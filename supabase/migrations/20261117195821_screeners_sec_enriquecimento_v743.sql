-- Análises: rastreio XBRL oficial dos EUA, somente leitura no app.
alter table quant_us.acoes add column if not exists sec_checked_at timestamptz;
alter table quant_us.acoes add column if not exists sec_facts_at date;
alter table quant_us.acoes add column if not exists sec_status text;
alter table quant_us.acoes add column if not exists sec_source_url text;
create index if not exists us_sec_pendentes on quant_us.acoes (sec_checked_at asc nulls first, market_cap_usd desc nulls last)
 where active and cik is not null;

create or replace function public.quant_screeners_sec_map(p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare n integer:=0;
begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>250 then raise exception 'Lote CIK invalido'; end if;
 update quant_us.acoes a set cik=lpad(x.cik,10,'0')
 from jsonb_to_recordset(p_rows) x(ticker text,cik text)
 where a.ticker=upper(btrim(x.ticker)) and x.cik ~ '^[0-9]{1,10}$'
  and a.cik is distinct from lpad(x.cik,10,'0');
 get diagnostics n=row_count;
 return n;
end; $$;
revoke all on function public.quant_screeners_sec_map(jsonb) from public,anon,authenticated;
grant execute on function public.quant_screeners_sec_map(jsonb) to service_role;

create or replace function public.quant_screeners_sec_pendentes(p_limit integer default 15)
returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb)
from (
  select ticker,cik,market_cap_usd,roic,roe,forward_pe,peg_ratio,ev_fcf,fcf_margin,
   eps_growth_yoy,momentum_12_1,short_interest_pct,dividend_yield,buyback_yield,
   total_shareholder_yield,sec_checked_at
  from quant_us.acoes where active and cik~'^[0-9]{10}$'
  order by sec_checked_at asc nulls first, market_cap_usd desc nulls last,ticker
  limit least(greatest(p_limit,1),25)
) t;
$$;
revoke all on function public.quant_screeners_sec_pendentes(integer) from public,anon,authenticated;
grant execute on function public.quant_screeners_sec_pendentes(integer) to service_role;

create or replace function public.quant_screeners_sec_patch(p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare n integer:=0;
begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>25 then raise exception 'Lote SEC invalido'; end if;
 update quant_us.acoes a
 set 
  revenue_growth_yoy=coalesce(x.revenue_growth_yoy,a.revenue_growth_yoy),
  eps_growth_yoy=coalesce(x.eps_growth_yoy,a.eps_growth_yoy),
  fcf_margin=coalesce(x.fcf_margin,a.fcf_margin),
  roe=coalesce(a.roe,x.roe),
  ev_fcf=coalesce(a.ev_fcf,x.ev_fcf),
  price_sales=coalesce(a.price_sales,x.price_sales),
  buyback_yield=coalesce(x.buyback_yield,a.buyback_yield),
  score_quant_us=coalesce(x.score_quant_us,a.score_quant_us),
  sec_checked_at=now(),
  sec_status=left(coalesce(nullif(x.sec_status,''),'indisponivel'),80),
  sec_facts_at=coalesce(x.sec_facts_at,a.sec_facts_at),
  sec_source_url=coalesce(x.sec_source_url,a.sec_source_url),
  updated_at=now()
 from jsonb_to_recordset(p_rows) x(
  ticker text,cik text,revenue_growth_yoy numeric,eps_growth_yoy numeric,
  fcf_margin numeric,roe numeric,ev_fcf numeric,price_sales numeric,
  buyback_yield numeric,score_quant_us numeric,sec_status text,
  sec_facts_at date,sec_source_url text
 )
 where a.ticker=upper(btrim(x.ticker)) and a.cik=x.cik and x.cik ~ '^[0-9]{10}$';
 get diagnostics n=row_count;
 return n;
end; $$;
revoke all on function public.quant_screeners_sec_patch(jsonb) from public,anon,authenticated;
grant execute on function public.quant_screeners_sec_patch(jsonb) to service_role;
