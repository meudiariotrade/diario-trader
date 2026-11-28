-- Rode UMA vez no Supabase: SQL Editor > New query > cole tudo > Run.
-- Tabelas usadas pela função "analise" (cache de relatórios/fundamentos e limite diário).
-- A função acessa com a chave de serviço; as tabelas ficam fechadas para o app (RLS ligado, sem políticas).

create table if not exists public.analise_cache (
  chave  text primary key,
  dia    date not null,
  dados  jsonb not null,
  criado timestamptz not null default now()
);
create index if not exists analise_cache_dia_idx on public.analise_cache (dia);
alter table public.analise_cache enable row level security;

create table if not exists public.analise_uso (
  id     bigint generated always as identity primary key,
  uid    uuid not null,
  dia    date not null,
  modo   text,
  criado timestamptz not null default now()
);
create index if not exists analise_uso_uid_dia_idx on public.analise_uso (uid, dia);
alter table public.analise_uso enable row level security;
