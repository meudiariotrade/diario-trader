-- v632: histórico 1m do Profit (ponte local ou CSV do ProfitChart), por usuário. Aditiva, com RLS.
create table if not exists public.profit_candles (
  uid uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ativo text not null,
  t bigint not null,
  o numeric not null, h numeric not null, l numeric not null, c numeric not null,
  v numeric not null default 0,
  primary key (uid, ativo, t)
);
alter table public.profit_candles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profit_candles' and policyname='profit_candles_dono') then
    create policy profit_candles_dono on public.profit_candles for all to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
  end if;
end $$;
