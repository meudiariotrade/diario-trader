-- v589: estado diário do trader (Meu dia). Migration aditiva, com RLS por auth.uid().
create table if not exists public.estado_diario (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dia date not null,
  emotional_state text check (emotional_state in ('calmo','focado','ansioso','cansado','euforico')),
  emocao_em timestamptz,
  pre_concluido_em timestamptz,
  meta_diaria numeric(14,2) check (meta_diaria is null or meta_diaria >= 0),
  stop_diario numeric(14,2) check (stop_diario is null or stop_diario >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, dia)
);
comment on table public.estado_diario is 'Estado do dia por conta: emoção (1 toque), horário de conclusão do pré-mercado e meta/stop do dia.';

alter table public.estado_diario enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='estado_diario' and policyname='estado_diario_ler_proprio') then
    create policy estado_diario_ler_proprio on public.estado_diario for select to authenticated using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='estado_diario' and policyname='estado_diario_inserir_proprio') then
    create policy estado_diario_inserir_proprio on public.estado_diario for insert to authenticated with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='estado_diario' and policyname='estado_diario_atualizar_proprio') then
    create policy estado_diario_atualizar_proprio on public.estado_diario for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
end $$;

revoke all on public.estado_diario from anon;
grant select, insert, update on public.estado_diario to authenticated;

create or replace function public.estado_diario_toca()
returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em := now(); return new; end $$;

revoke execute on function public.estado_diario_toca() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='estado_diario_toca' and tgrelid='public.estado_diario'::regclass) then
    create trigger estado_diario_toca before update on public.estado_diario for each row execute function public.estado_diario_toca();
  end if;
end $$;
