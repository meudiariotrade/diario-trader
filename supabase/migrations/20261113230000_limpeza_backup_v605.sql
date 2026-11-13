-- v605: cópia de segurança antes de limpezas pontuais de dados (ex.: ativos de demonstração da Carteira).
-- Aditiva, com RLS: cada conta só lê as próprias cópias; só o servidor grava.
create table if not exists public.limpeza_backup (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  motivo text not null,
  origem text not null,
  dados jsonb not null,
  criado_em timestamptz not null default now()
);
comment on table public.limpeza_backup is 'Cópia integral do que foi removido em limpezas pontuais (diário/carteira/relatórios), para desfazer se preciso.';
alter table public.limpeza_backup enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='limpeza_backup' and policyname='limpeza_backup_ler_proprio') then
    create policy limpeza_backup_ler_proprio on public.limpeza_backup for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.limpeza_backup from anon, authenticated;
grant select on public.limpeza_backup to authenticated;
grant select, insert on public.limpeza_backup to service_role;
