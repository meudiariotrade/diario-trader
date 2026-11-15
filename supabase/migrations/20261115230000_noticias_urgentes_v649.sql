-- v649 — histórico permanente de notícias urgentes entregues por conta.
-- Nenhuma leitura pública. As únicas escritas são service_role na Edge Function notificar.
create table if not exists public.noticias_urgentes_notificadas (
 user_id uuid not null references auth.users(id) on delete cascade,
 noticia_hash text not null check (noticia_hash ~ '^[a-f0-9]{64}$'),
 titulo text not null,
 url text not null,
 fonte text not null,
 publicada_em timestamptz not null,
 registrada_em timestamptz not null default now(),
 primary key(user_id,noticia_hash)
);
alter table public.noticias_urgentes_notificadas enable row level security;
revoke all on table public.noticias_urgentes_notificadas from public, anon, authenticated;
grant select on table public.noticias_urgentes_notificadas to authenticated;
do $$
begin
 if not exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='noticias_urgentes_notificadas'
    and policyname='noticias_urgentes_ler_proprias'
 ) then
  create policy noticias_urgentes_ler_proprias
  on public.noticias_urgentes_notificadas
  for select to authenticated
  using ((select auth.uid()) = user_id);
 end if;
end $$;
comment on table public.noticias_urgentes_notificadas is
 'Deduplicação persistente de notícias de alto impacto; servidor insere por usuário e Web Push usa push_log por aparelho.';
