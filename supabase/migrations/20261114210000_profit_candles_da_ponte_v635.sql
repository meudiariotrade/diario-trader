-- v635: a ponte do Profit já grava cada cotação em public.cotacoes. Este gatilho monta, a cada
-- cotação, o candle de 1 minuto em public.profit_candles (por usuário, RLS já ativo).
-- Minuto = data/hora do negócio vindos do Profit (BRT). Volume = negócios do minuto quando a
-- ponte manda o acumulado (neg); sem ele, o app usa a amplitude do candle como atividade.
-- Migração aditiva: só ADD COLUMN, CREATE FUNCTION e CREATE TRIGGER (se ainda não existir).
alter table public.profit_candles add column if not exists n0 numeric;

create or replace function public.profit_candles_da_cotacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_t bigint;
  v_at text;
  v_px numeric := new.ult;
begin
  if new.user_id is null or v_px is null or v_px <= 0 or new.hor is null or new.dat is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.ult is not distinct from new.ult and old.hor is not distinct from new.hor then
    return new;
  end if;
  begin
    v_t := (floor(extract(epoch from ((to_timestamp(new.dat || ' ' || new.hor, 'DD/MM/YYYY HH24:MI:SS')::timestamp) at time zone 'America/Sao_Paulo')) / 60) * 60)::bigint;
    v_at := case when upper(new.ticker) ~ '^(WIN|WDO|IND|DOL)' then substr(upper(new.ticker), 1, 3) else upper(new.ticker) end;
    insert into public.profit_candles (uid, ativo, t, o, h, l, c, v, n0)
    values (new.user_id, v_at, v_t, v_px, v_px, v_px, v_px, 0, new.neg)
    on conflict (uid, ativo, t) do update set
      h = greatest(public.profit_candles.h, excluded.c),
      l = least(public.profit_candles.l, excluded.c),
      c = excluded.c,
      v = case when excluded.n0 is not null and public.profit_candles.n0 is not null
               then greatest(0, excluded.n0 - public.profit_candles.n0)
               else public.profit_candles.v end;
  exception when others then
    return new; -- nunca atrapalha a gravação da ponte
  end;
  return new;
end;
$$;

revoke all on function public.profit_candles_da_cotacao() from public, anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'profit_candles_da_cotacao' and tgrelid = 'public.cotacoes'::regclass) then
    create trigger profit_candles_da_cotacao after insert or update on public.cotacoes
      for each row execute function public.profit_candles_da_cotacao();
  end if;
end $$;
