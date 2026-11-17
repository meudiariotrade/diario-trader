-- v727 — auditoria mínima do monitor urgente; não armazena notícias ou dados de operações.
create table if not exists public.noticias_monitor_status (
  id smallint primary key default 1 check (id = 1),
  consultado_em timestamptz,
  estado text not null default 'aguardando' check (estado in ('aguardando','ok','parcial','erro','sem_inscricoes')),
  fontes_ok integer not null default 0 check (fontes_ok >= 0),
  fontes_falhas text[] not null default '{}',
  examinadas integer not null default 0 check (examinadas >= 0),
  urgentes integer not null default 0 check (urgentes >= 0),
  enviados integer not null default 0 check (enviados >= 0),
  falhas_envio integer not null default 0 check (falhas_envio >= 0),
  duracao_ms integer not null default 0 check (duracao_ms >= 0),
  motivo text not null default ''
);
alter table public.noticias_monitor_status enable row level security;
revoke all on public.noticias_monitor_status from public, anon, authenticated;
grant select, insert, update on public.noticias_monitor_status to service_role;
comment on table public.noticias_monitor_status is
  'Diagnóstico agregado da última execução de notícias urgentes, sem segredos nem artigos';
