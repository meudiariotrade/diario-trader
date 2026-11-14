-- v631: cache dos candles do Replay de mercado (dados públicos de mercado, um dia por linha).
-- Escrita só pela função candles (service_role); leitura só para quem está logado.
create table if not exists public.replay_candles (
  simbolo text not null,
  intervalo text not null,
  dia date not null,
  candles jsonb not null,
  atualizado timestamptz not null default now(),
  primary key (simbolo, intervalo, dia)
);
alter table public.replay_candles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'replay_candles' and policyname = 'replay_candles_leitura_logado') then
    create policy replay_candles_leitura_logado on public.replay_candles for select to authenticated using (auth.uid() is not null);
  end if;
end $$;
