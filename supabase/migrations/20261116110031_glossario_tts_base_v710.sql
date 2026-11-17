-- v710: restaurar tabela de glossário ausente no baseline original.
create table if not exists public.aulas_glossario_tts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  termos jsonb not null default '{}'::jsonb,
  revisao integer not null default 0,
  atualizado timestamptz not null default now(),
  constraint aulas_glossario_revisao_nonnegative check (revisao >= 0),
  constraint aulas_glossario_termos_obj check (jsonb_typeof(termos) = 'object')
);
alter table public.aulas_glossario_tts enable row level security;
revoke all on public.aulas_glossario_tts from anon, authenticated;
grant select,insert,update on public.aulas_glossario_tts to authenticated;
grant all on public.aulas_glossario_tts to service_role;
create policy aulas_glossario_ler_proprio on public.aulas_glossario_tts
 for select to authenticated using ((select auth.uid()) = user_id);
create policy aulas_glossario_inserir_proprio on public.aulas_glossario_tts
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy aulas_glossario_atualizar_proprio on public.aulas_glossario_tts
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
