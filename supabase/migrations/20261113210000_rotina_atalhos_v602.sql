-- v602: rotina operacional automática (Atalhos do iPhone, nota do BTG por e-mail e ponte do Profit).
-- Migration aditiva: só CREATE TABLE IF NOT EXISTS, índices, funções e políticas novas. RLS ativo em toda tabela nova.

-- 1) Token pessoal dos Atalhos do iPhone (?token=...). Só o hash SHA-256 fica no banco.
create table if not exists public.atalhos_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  criado_em timestamptz not null default now(),
  usado_em timestamptz
);
comment on table public.atalhos_tokens is 'Hash do token pessoal usado pelas URLs dos Atalhos do iPhone (daily-panorama, check-morning-status, inbound-btg-note).';
alter table public.atalhos_tokens enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='atalhos_tokens' and policyname='atalhos_tokens_ler_proprio') then
    create policy atalhos_tokens_ler_proprio on public.atalhos_tokens for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.atalhos_tokens from anon, authenticated;
grant select on public.atalhos_tokens to authenticated;
grant select, insert, update on public.atalhos_tokens to service_role;

-- Gera (ou troca) o token da própria conta. Devolve o token uma única vez; o banco guarda só o hash.
create or replace function public.atalhos_gerar_token()
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); tk text;
begin
  if uid is null then raise exception 'Entre na sua conta.'; end if;
  tk := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.atalhos_tokens (user_id, token_hash) values (uid, encode(extensions.digest(tk, 'sha256'), 'hex'))
  on conflict (user_id) do update set token_hash = excluded.token_hash, criado_em = now(), usado_em = null;
  return tk;
end $$;
revoke execute on function public.atalhos_gerar_token() from public, anon;
grant execute on function public.atalhos_gerar_token() to authenticated;

-- 2) Caixa de entrada das notas de corretagem recebidas pelo webhook inbound-btg-note.
create table if not exists public.notas_inbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  arquivo text not null,
  sha256 text not null,
  numero_nota text,
  data_pregao date,
  corretora text,
  status text not null default 'pendente' check (status in ('pendente','importada','duplicada','erro')),
  origem text,
  erro text,
  recebido_em timestamptz not null default now(),
  importado_em timestamptz,
  unique (user_id, sha256)
);
comment on table public.notas_inbox is 'Notas de corretagem (PDF) recebidas por e-mail/Atalho. Trava anti-duplicidade: número da nota + data do pregão (e o próprio arquivo).';
create unique index if not exists notas_inbox_nota_data on public.notas_inbox (user_id, numero_nota, data_pregao)
  where numero_nota is not null and data_pregao is not null;
create index if not exists notas_inbox_pendentes on public.notas_inbox (user_id) where status = 'pendente';
alter table public.notas_inbox enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notas_inbox' and policyname='notas_inbox_ler_proprio') then
    create policy notas_inbox_ler_proprio on public.notas_inbox for select to authenticated using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notas_inbox' and policyname='notas_inbox_atualizar_proprio') then
    create policy notas_inbox_atualizar_proprio on public.notas_inbox for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.notas_inbox from anon, authenticated;
grant select, update on public.notas_inbox to authenticated;
grant select, insert, update on public.notas_inbox to service_role;

-- Bucket privado das notas (só PDF, até 20 MB), uma pasta por conta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notas', 'notas', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='notas_ler_proprias') then
    create policy notas_ler_proprias on storage.objects for select to authenticated
      using (bucket_id = 'notas' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;

-- 3) Ponte do Profit: completa hora de entrada/saída e stop ao gravar a operação.
--    Nunca bloqueia a gravação: qualquer falha na busca do stop é ignorada.
create or replace function public.operacoes_profit_completa()
returns trigger language plpgsql security definer set search_path = '' as $$
declare troca timestamptz; achado numeric; fut text := left(upper(new.ativo), 3);
begin
  if new.fechamento is not null and new.fechamento < new.abertura then
    troca := new.abertura; new.abertura := new.fechamento; new.fechamento := troca;
  end if;
  if new.fechamento is null and new.preco_saida is not null and tg_op = 'UPDATE' and old.fechamento is not null then
    new.fechamento := old.fechamento;
  end if;
  if new.stop is null or new.stop <= 0 then
    begin
      -- a) trade lançado no diário (mesmo ativo e lado, até 15 min da entrada)
      select replace(x->>'stop', ',', '.')::numeric into achado
        from public.diario d, jsonb_array_elements(coalesce(d.data->'trades', '[]'::jsonb)) x
       where d.user_id = new.user_id
         and coalesce(x->>'orig', '') <> 'profit'
         and coalesce(x->>'side', 'C') = new.lado
         and (upper(x->>'ativo') = upper(new.ativo) or (fut in ('WIN','WDO','IND','DOL') and left(upper(x->>'ativo'), 3) = fut))
         and coalesce(x->>'stop', '') ~ '^[0-9]+([.,][0-9]+)?$'
         and coalesce(x->>'dt', '') ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}'
         and abs(extract(epoch from (((left(x->>'dt', 16))::timestamp at time zone 'America/Sao_Paulo') - new.abertura))) <= 900
       order by abs(extract(epoch from (((left(x->>'dt', 16))::timestamp at time zone 'America/Sao_Paulo') - new.abertura)))
       limit 1;
      -- b) trade aberto enviado pelo app para os alertas (ativo, lado e stop)
      if achado is null then
        select (t->>'st')::numeric into achado
          from public.push_subs p, jsonb_array_elements(coalesce(p.prefs->'abertos', '[]'::jsonb)) t
         where p.user_id = new.user_id
           and coalesce(t->>'sd', 'C') = new.lado
           and (upper(t->>'a') = upper(new.ativo) or (fut in ('WIN','WDO','IND','DOL') and left(upper(t->>'a'), 3) = fut))
           and coalesce(t->>'st', '') ~ '^[0-9]+(\.[0-9]+)?$'
         limit 1;
      end if;
      if achado is not null and achado > 0 then new.stop := achado; end if;
    exception when others then null;
    end;
  end if;
  return new;
end $$;
revoke execute on function public.operacoes_profit_completa() from public, anon, authenticated;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'operacoes_profit_completa' and tgrelid = 'public.operacoes_profit'::regclass) then
    create trigger operacoes_profit_completa before insert or update on public.operacoes_profit
      for each row execute function public.operacoes_profit_completa();
  end if;
end $$;

-- 4) Lembrete pós-pregão (17:45): contas com trades no dia e sem o "Fechar o dia" preenchido.
--    Só leitura; executável apenas pelo service_role (função rotina-cron).
create or replace function public.rotina_fechamento_pendentes(p_dia date)
returns table (user_id uuid, trades integer) language sql stable security definer set search_path = '' as $$
  select d.user_id,
         (select count(*)::int from jsonb_array_elements(coalesce(d.data->'trades', '[]'::jsonb)) x
           where left(coalesce(x->>'dt', ''), 10) = p_dia::text or left(coalesce(x->>'dtx', ''), 10) = p_dia::text) as trades
    from public.diario d
   where d.updated_at >= now() - interval '3 days'
     and coalesce(d.data->'days'->(p_dia::text)->>'fech', '') = ''
     and coalesce(d.data->'days'->(p_dia::text)->'us'->>'fech', '') = ''
     and exists (select 1 from jsonb_array_elements(coalesce(d.data->'trades', '[]'::jsonb)) x
                  where left(coalesce(x->>'dt', ''), 10) = p_dia::text or left(coalesce(x->>'dtx', ''), 10) = p_dia::text);
$$;
revoke execute on function public.rotina_fechamento_pendentes(date) from public, anon, authenticated;
grant execute on function public.rotina_fechamento_pendentes(date) to service_role;

-- 5) Agendamentos (seg–sex). pg_cron roda em UTC; Brasília = UTC−3 (sem horário de verão).
--    06:50 BRT = 09:50 UTC (atualização da agenda e dos mercados) · 17:45 BRT = 20:45 UTC (lembrete do fechamento).
--    O segredo interno vem do Vault (diario_cron_secret), nunca do código.
select cron.schedule('rotina-matinal', '50 9 * * 1-5', $c$select net.http_post(url := 'https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/rotina-cron', headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='diario_cron_secret')), body := '{"acao":"matinal"}'::jsonb, timeout_milliseconds := 90000);$c$);
select cron.schedule('rotina-fechamento', '45 20 * * 1-5', $c$select net.http_post(url := 'https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/rotina-cron', headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='diario_cron_secret')), body := '{"acao":"fechamento"}'::jsonb, timeout_milliseconds := 90000);$c$);
