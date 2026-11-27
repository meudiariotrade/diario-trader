-- Videoaulas (aba Estudos → Aulas). Já aplicado no projeto atual em 02/11/2026.
create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  livro text not null,
  numero int not null,
  titulo text not null,
  capitulos text not null default '',
  roteiro jsonb not null,
  progresso jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, livro, numero)
);
alter table public.aulas enable row level security;
create policy "aulas: ler as minhas" on public.aulas for select to authenticated using ((select auth.uid()) = user_id);
create policy "aulas: criar as minhas" on public.aulas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "aulas: alterar as minhas" on public.aulas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "aulas: apagar as minhas" on public.aulas for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists aulas_user_livro on public.aulas (user_id, livro, numero);

-- Geração pelo app (função "aulas"): status da geração e último erro da IA.
alter table public.aulas add column if not exists status text not null default 'pronta' check (status in ('gerando','pronta','erro'));
alter table public.aulas add column if not exists erro text;
