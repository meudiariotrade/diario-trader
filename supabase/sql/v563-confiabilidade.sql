-- Compatible com a v562 durante a atualização dos aparelhos.
alter table public.diario add column if not exists revision bigint not null default 0;
create or replace function public.diario_incrementar_revisao() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.revision := old.revision + 1; return new; end;
$$;
revoke all on function public.diario_incrementar_revisao() from public, anon, authenticated;
drop trigger if exists diario_revisao on public.diario;
create trigger diario_revisao before update on public.diario for each row execute function public.diario_incrementar_revisao();

create or replace function public.diario_salvar_revisao(expected_revision bigint, new_data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' set lock_timeout = '3s' as $$
declare caller uuid := auth.uid(); saved_revision bigint; current_data jsonb;
begin
  if caller is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  if new_data is null or jsonb_typeof(new_data) <> 'object' then raise exception 'Dados inválidos' using errcode = '22023'; end if;
  if expected_revision is null then
    insert into public.diario(user_id,data,updated_at,revision) values(caller,new_data,clock_timestamp(),1)
      on conflict(user_id) do nothing returning revision into saved_revision;
  else
    update public.diario set data = new_data, updated_at = clock_timestamp()
      where user_id = caller and revision = expected_revision returning revision into saved_revision;
  end if;
  if saved_revision is not null then return jsonb_build_object('saved',true,'revision',saved_revision); end if;
  select data,revision into current_data,saved_revision from public.diario where user_id = caller;
  return jsonb_build_object('saved',false,'data',current_data,'revision',saved_revision);
end;
$$;
revoke all on function public.diario_salvar_revisao(bigint,jsonb) from public,anon;
grant execute on function public.diario_salvar_revisao(bigint,jsonb) to authenticated;

-- Registros antigos continuam enviados; somente a fila nova usa pendente/falhou.
alter table public.push_log
  add column if not exists status text not null default 'enviado',
  add column if not exists subscription_id text,
  add column if not exists subscription_owner uuid,
  add column if not exists payload jsonb,
  add column if not exists attempts integer not null default 0,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists locked_until timestamptz,
  add column if not exists lease_id uuid,
  add column if not exists last_error text,
  add column if not exists sent_at timestamptz;
create index if not exists push_log_pendentes_idx on public.push_log(next_attempt_at)
  where status in ('pendente','falhou') and attempts < 5;

create or replace function public.push_reservar(p_chave text,p_subscription text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare lease uuid;
begin
  insert into public.push_log(chave,status,subscription_id,subscription_owner,payload,next_attempt_at)
    select p_chave,'pendente',p_subscription,s.user_id,p_payload,now() from public.push_subs s where s.id=p_subscription
    on conflict(chave) do nothing;
  update public.push_log set locked_until = now() + interval '2 minutes',lease_id = gen_random_uuid(),attempts = attempts + 1
    where chave = p_chave and status in ('pendente','falhou') and attempts < 5
      and em > now() - interval '15 minutes' and next_attempt_at <= now()
      and (locked_until is null or locked_until < now()) returning lease_id into lease;
  return jsonb_build_object('reservado',lease is not null,'lease',lease);
end;
$$;
create or replace function public.push_concluir(p_chave text,p_lease uuid,p_ok boolean,p_erro text default null,p_invalida boolean default false)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  update public.push_log set status = case when p_ok then 'enviado' when p_invalida then 'descartado' else 'falhou' end,
    sent_at = case when p_ok then now() else sent_at end,
    last_error = case when p_ok then null else left(p_erro,300) end,
    next_attempt_at = case when p_ok or p_invalida then null else now() + make_interval(secs => least(480,30 * (2 ^ least(attempts,4))::integer)) end,
    locked_until = null,lease_id = null where chave = p_chave and lease_id = p_lease;
  get diagnostics affected = row_count; return affected = 1;
end;
$$;
create or replace function public.push_retentar_lote(p_limit integer default 12)
returns table(chave text,subscription_id text,subscription_owner uuid,payload jsonb,lease_id uuid)
language sql security invoker set search_path = '' as $$
  with candidatos as (
    select p.chave from public.push_log p where p.status in ('pendente','falhou') and p.attempts < 5
      and p.em > now() - interval '15 minutes' and p.next_attempt_at <= now()
      and (p.locked_until is null or p.locked_until < now())
      order by p.next_attempt_at limit greatest(1,least(p_limit,30)) for update skip locked
  )
  update public.push_log p set locked_until = now() + interval '2 minutes',lease_id = gen_random_uuid(),attempts = p.attempts + 1
    from candidatos c where p.chave = c.chave returning p.chave,p.subscription_id,p.subscription_owner,p.payload,p.lease_id;
$$;
revoke all on function public.push_reservar(text,text,jsonb),public.push_concluir(text,uuid,boolean,text,boolean),public.push_retentar_lote(integer) from public,anon,authenticated;
grant execute on function public.push_reservar(text,text,jsonb),public.push_concluir(text,uuid,boolean,text,boolean),public.push_retentar_lote(integer) to service_role;
