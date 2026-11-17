-- v724: base de agendamento leve; não altera operações, carteira nem cache antigo.
-- Eventos pequenos são armazenados para evitar buscar feeds públicos a cada minuto.
create table if not exists public.push_calendario_eventos (
  id text primary key,
  titulo text not null,
  moeda text not null,
  horario timestamptz not null,
  impacto text not null check (impacto in ('high', 'med')),
  previsao text not null default '',
  anterior text not null default '',
  atualizado_em timestamptz not null default now()
);
create index if not exists push_calendario_horario_idx
  on public.push_calendario_eventos (horario);
alter table public.push_calendario_eventos enable row level security;
revoke all on public.push_calendario_eventos from anon, authenticated;
grant select, insert, update on public.push_calendario_eventos to service_role;

-- Segredo isolado no Vault; o navegador e os usuários autenticados não o acessam.
do $$
begin
  if not exists(select 1 from vault.secrets where name = 'diario_agendamento_v724') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'diario_agendamento_v724', 'Autenticação interna de pg_cron para notificações econômicas leves'
    );
  end if;
end $$;

-- A Edge Function consulta a mesma credencial apenas com SERVICE_ROLE.
create or replace function public.diario_agendamento_chave()
returns text language sql stable security definer set search_path = ''
as $$
  select s.decrypted_secret
  from vault.decrypted_secrets as s
  where s.name = 'diario_agendamento_v724'
  limit 1
$$;
revoke all on function public.diario_agendamento_chave() from public, anon, authenticated;
grant execute on function public.diario_agendamento_chave() to service_role;
