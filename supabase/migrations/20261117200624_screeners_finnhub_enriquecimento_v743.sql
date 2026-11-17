-- Análises / EUA: métricas complementares Finnhub sob orçamento diário estrito.
alter table quant_us.acoes add column if not exists finnhub_checked_at timestamptz;
alter table quant_us.acoes add column if not exists finnhub_status text;
create index if not exists us_finnhub_pendentes on quant_us.acoes(finnhub_checked_at asc nulls first,market_cap_usd desc nulls last)
where active;

create or replace function public.quant_screeners_finnhub_pendentes(p_limit integer default 20)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(v)),'[]'::jsonb)
 from (
  select ticker,market_cap_usd,forward_pe,peg_ratio,ev_fcf,revenue_growth_yoy,
  eps_growth_yoy,fcf_margin,roic,momentum_12_1,short_interest_pct,
  dividend_yield,buyback_yield,total_shareholder_yield
  from quant_us.acoes where active and ticker~'^[A-Z0-9][A-Z0-9.-]{0,19}$'
  order by finnhub_checked_at asc nulls first,market_cap_usd desc nulls last,ticker
  limit least(greatest(p_limit,1),30)
 ) v;
$$;
revoke all on function public.quant_screeners_finnhub_pendentes(integer) from public,anon,authenticated;
grant execute on function public.quant_screeners_finnhub_pendentes(integer) to service_role;

create or replace function public.quant_screeners_finnhub_patch(p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare n integer:=0;
begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>30 then raise exception 'Lote invalido'; end if;
 update quant_us.acoes a set
  forward_pe=coalesce(x.forward_pe,a.forward_pe),
  peg_ratio=coalesce(x.peg_ratio,a.peg_ratio),
  ev_fcf=coalesce(x.ev_fcf,a.ev_fcf),
  revenue_growth_yoy=coalesce(x.revenue_growth_yoy,a.revenue_growth_yoy),
  eps_growth_yoy=coalesce(x.eps_growth_yoy,a.eps_growth_yoy),
  finnhub_checked_at=now(),
  finnhub_status=left(coalesce(nullif(x.status,''),'indisponivel'),70),
  updated_at=now()
 from jsonb_to_recordset(p_rows) x(
   ticker text,forward_pe numeric,peg_ratio numeric,ev_fcf numeric,
   revenue_growth_yoy numeric,eps_growth_yoy numeric,status text)
 where a.ticker=upper(btrim(x.ticker));
 get diagnostics n=row_count;
 return n;
end; $$;
revoke all on function public.quant_screeners_finnhub_patch(jsonb) from public,anon,authenticated;
grant execute on function public.quant_screeners_finnhub_patch(jsonb) to service_role;
