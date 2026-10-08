-- Diário de Trader: execute tudo isto no SQL Editor do Supabase (uma vez só).

-- 1) Tabela com os dados de cada usuário (uma linha por conta)
create table if not exists public.diario (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diario enable row level security;

create policy "diario_select_own" on public.diario
  for select to authenticated using (auth.uid() = user_id);
create policy "diario_insert_own" on public.diario
  for insert to authenticated with check (auth.uid() = user_id);
create policy "diario_update_own" on public.diario
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diario_delete_own" on public.diario
  for delete to authenticated using (auth.uid() = user_id);

-- 2) Espaço privado para as fotos (cada conta só acessa a própria pasta)
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy "fotos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
