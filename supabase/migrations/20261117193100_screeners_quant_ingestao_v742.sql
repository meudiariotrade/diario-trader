-- Acesso exclusivo do backend service_role. RLS nao e contornada pelo navegador.
create or replace function public.quant_screeners_lote(p_market text,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $f$
declare total integer:=0;
begin
 if p_market not in ('BR','US') or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>250 then raise exception 'Lote invalido'; end if;
 if p_market='BR' then
 insert into quant_br.acoes as t (ticker,empresa,setor,segmento,roe,roic,dividend_yield,payout_implicito,pl,pvp,ev_ebitda,fcf_yield,margem_liquida,div_liq_ebitda,liquidez_diaria_brl,valor_mercado_brl,momentum_12_1,dist_max_52w,rsi_14,dist_mm200_pct,score_quant_br,cobertura_pct,preco_referencia,fonte_principal,fundamentais_em,tecnicos_em,dados_status)
 select upper(trim(x.ticker)),coalesce(nullif(trim(x.empresa),''), x.ticker),x.setor,x.segmento,x.roe,x.roic,x.dividend_yield,x.payout_implicito,x.pl,x.pvp,x.ev_ebitda,x.fcf_yield,x.margem_liquida,x.div_liq_ebitda,x.liquidez_diaria_brl,x.valor_mercado_brl,x.momentum_12_1,x.dist_max_52w,x.rsi_14,x.dist_mm200_pct,x.score_quant_br,x.cobertura_pct,x.preco_referencia,x.fonte_principal,x.fundamentais_em,x.tecnicos_em,coalesce(x.dados_status,'catalogado')
 from jsonb_to_recordset(p_rows) as x (ticker text,empresa text,setor text,segmento text,roe numeric,roic numeric,dividend_yield numeric,payout_implicito numeric,pl numeric,pvp numeric,ev_ebitda numeric,fcf_yield numeric,margem_liquida numeric,div_liq_ebitda numeric,liquidez_diaria_brl numeric,valor_mercado_brl numeric,momentum_12_1 numeric,dist_max_52w numeric,rsi_14 numeric,dist_mm200_pct numeric,score_quant_br numeric,cobertura_pct numeric,preco_referencia numeric,fonte_principal text,fundamentais_em date,tecnicos_em date,dados_status text)
 where x.ticker ~ '^[A-Za-z0-9][A-Za-z0-9.-]{0,19}$'
 on conflict(ticker) do update set empresa=coalesce(excluded.empresa,t.empresa),
setor=coalesce(excluded.setor,t.setor),
segmento=coalesce(excluded.segmento,t.segmento),
roe=coalesce(excluded.roe,t.roe),
roic=coalesce(excluded.roic,t.roic),
dividend_yield=coalesce(excluded.dividend_yield,t.dividend_yield),
payout_implicito=coalesce(excluded.payout_implicito,t.payout_implicito),
pl=coalesce(excluded.pl,t.pl),
pvp=coalesce(excluded.pvp,t.pvp),
ev_ebitda=coalesce(excluded.ev_ebitda,t.ev_ebitda),
fcf_yield=coalesce(excluded.fcf_yield,t.fcf_yield),
margem_liquida=coalesce(excluded.margem_liquida,t.margem_liquida),
div_liq_ebitda=coalesce(excluded.div_liq_ebitda,t.div_liq_ebitda),
liquidez_diaria_brl=coalesce(excluded.liquidez_diaria_brl,t.liquidez_diaria_brl),
valor_mercado_brl=coalesce(excluded.valor_mercado_brl,t.valor_mercado_brl),
momentum_12_1=coalesce(excluded.momentum_12_1,t.momentum_12_1),
dist_max_52w=coalesce(excluded.dist_max_52w,t.dist_max_52w),
rsi_14=coalesce(excluded.rsi_14,t.rsi_14),
dist_mm200_pct=coalesce(excluded.dist_mm200_pct,t.dist_mm200_pct),
score_quant_br=coalesce(excluded.score_quant_br,t.score_quant_br),
cobertura_pct=coalesce(excluded.cobertura_pct,t.cobertura_pct),
preco_referencia=coalesce(excluded.preco_referencia,t.preco_referencia),
fonte_principal=coalesce(excluded.fonte_principal,t.fonte_principal),
fundamentais_em=coalesce(excluded.fundamentais_em,t.fundamentais_em),
tecnicos_em=coalesce(excluded.tecnicos_em,t.tecnicos_em),
dados_status=coalesce(excluded.dados_status,t.dados_status),updated_at=now()
 where t.empresa is distinct from coalesce(excluded.empresa,t.empresa) or t.setor is distinct from coalesce(excluded.setor,t.setor) or t.segmento is distinct from coalesce(excluded.segmento,t.segmento) or t.roe is distinct from coalesce(excluded.roe,t.roe) or t.roic is distinct from coalesce(excluded.roic,t.roic) or t.dividend_yield is distinct from coalesce(excluded.dividend_yield,t.dividend_yield) or t.payout_implicito is distinct from coalesce(excluded.payout_implicito,t.payout_implicito) or t.pl is distinct from coalesce(excluded.pl,t.pl) or t.pvp is distinct from coalesce(excluded.pvp,t.pvp) or t.ev_ebitda is distinct from coalesce(excluded.ev_ebitda,t.ev_ebitda) or t.fcf_yield is distinct from coalesce(excluded.fcf_yield,t.fcf_yield) or t.margem_liquida is distinct from coalesce(excluded.margem_liquida,t.margem_liquida) or t.div_liq_ebitda is distinct from coalesce(excluded.div_liq_ebitda,t.div_liq_ebitda) or t.liquidez_diaria_brl is distinct from coalesce(excluded.liquidez_diaria_brl,t.liquidez_diaria_brl) or t.valor_mercado_brl is distinct from coalesce(excluded.valor_mercado_brl,t.valor_mercado_brl) or t.momentum_12_1 is distinct from coalesce(excluded.momentum_12_1,t.momentum_12_1) or t.dist_max_52w is distinct from coalesce(excluded.dist_max_52w,t.dist_max_52w) or t.rsi_14 is distinct from coalesce(excluded.rsi_14,t.rsi_14) or t.dist_mm200_pct is distinct from coalesce(excluded.dist_mm200_pct,t.dist_mm200_pct) or t.score_quant_br is distinct from coalesce(excluded.score_quant_br,t.score_quant_br) or t.cobertura_pct is distinct from coalesce(excluded.cobertura_pct,t.cobertura_pct) or t.preco_referencia is distinct from coalesce(excluded.preco_referencia,t.preco_referencia) or t.fonte_principal is distinct from coalesce(excluded.fonte_principal,t.fonte_principal) or t.fundamentais_em is distinct from coalesce(excluded.fundamentais_em,t.fundamentais_em) or t.tecnicos_em is distinct from coalesce(excluded.tecnicos_em,t.tecnicos_em) or t.dados_status is distinct from coalesce(excluded.dados_status,t.dados_status);
 get diagnostics total = row_count;
 else
 insert into quant_us.acoes as t (ticker,company_name,bdr_ticker,exchange,sector,industry,cik,roic,roe,forward_pe,peg_ratio,ev_fcf,price_sales,dividend_yield,buyback_yield,revenue_growth_yoy,eps_growth_yoy,fcf_margin,net_debt_ebitda,short_interest_pct,avg_daily_volume_usd,market_cap_usd,momentum_12_1,rsi_14,dist_mm200_pct,score_quant_us,cobertura_pct,preco_referencia_usd,fonte_principal,fundamentais_em,tecnicos_em,dados_status)
 select upper(trim(x.ticker)),coalesce(nullif(trim(x.company_name),''), x.ticker),x.bdr_ticker,coalesce(x.exchange,'NASDAQ'),x.sector,x.industry,x.cik,x.roic,x.roe,x.forward_pe,x.peg_ratio,x.ev_fcf,x.price_sales,x.dividend_yield,x.buyback_yield,x.revenue_growth_yoy,x.eps_growth_yoy,x.fcf_margin,x.net_debt_ebitda,x.short_interest_pct,x.avg_daily_volume_usd,x.market_cap_usd,x.momentum_12_1,x.rsi_14,x.dist_mm200_pct,x.score_quant_us,x.cobertura_pct,x.preco_referencia_usd,x.fonte_principal,x.fundamentais_em,x.tecnicos_em,coalesce(x.dados_status,'catalogado')
 from jsonb_to_recordset(p_rows) as x (ticker text,company_name text,bdr_ticker text,exchange text,sector text,industry text,cik text,roic numeric,roe numeric,forward_pe numeric,peg_ratio numeric,ev_fcf numeric,price_sales numeric,dividend_yield numeric,buyback_yield numeric,revenue_growth_yoy numeric,eps_growth_yoy numeric,fcf_margin numeric,net_debt_ebitda numeric,short_interest_pct numeric,avg_daily_volume_usd numeric,market_cap_usd numeric,momentum_12_1 numeric,rsi_14 numeric,dist_mm200_pct numeric,score_quant_us numeric,cobertura_pct numeric,preco_referencia_usd numeric,fonte_principal text,fundamentais_em date,tecnicos_em date,dados_status text)
 where x.ticker ~ '^[A-Za-z0-9][A-Za-z0-9.-]{0,19}$'
 on conflict(ticker) do update set company_name=coalesce(excluded.company_name,t.company_name),
bdr_ticker=coalesce(excluded.bdr_ticker,t.bdr_ticker),
sector=coalesce(excluded.sector,t.sector),
industry=coalesce(excluded.industry,t.industry),
cik=coalesce(excluded.cik,t.cik),
roic=coalesce(excluded.roic,t.roic),
roe=coalesce(excluded.roe,t.roe),
forward_pe=coalesce(excluded.forward_pe,t.forward_pe),
peg_ratio=coalesce(excluded.peg_ratio,t.peg_ratio),
ev_fcf=coalesce(excluded.ev_fcf,t.ev_fcf),
price_sales=coalesce(excluded.price_sales,t.price_sales),
dividend_yield=coalesce(excluded.dividend_yield,t.dividend_yield),
buyback_yield=coalesce(excluded.buyback_yield,t.buyback_yield),
revenue_growth_yoy=coalesce(excluded.revenue_growth_yoy,t.revenue_growth_yoy),
eps_growth_yoy=coalesce(excluded.eps_growth_yoy,t.eps_growth_yoy),
fcf_margin=coalesce(excluded.fcf_margin,t.fcf_margin),
net_debt_ebitda=coalesce(excluded.net_debt_ebitda,t.net_debt_ebitda),
short_interest_pct=coalesce(excluded.short_interest_pct,t.short_interest_pct),
avg_daily_volume_usd=coalesce(excluded.avg_daily_volume_usd,t.avg_daily_volume_usd),
market_cap_usd=coalesce(excluded.market_cap_usd,t.market_cap_usd),
momentum_12_1=coalesce(excluded.momentum_12_1,t.momentum_12_1),
rsi_14=coalesce(excluded.rsi_14,t.rsi_14),
dist_mm200_pct=coalesce(excluded.dist_mm200_pct,t.dist_mm200_pct),
score_quant_us=coalesce(excluded.score_quant_us,t.score_quant_us),
cobertura_pct=coalesce(excluded.cobertura_pct,t.cobertura_pct),
preco_referencia_usd=coalesce(excluded.preco_referencia_usd,t.preco_referencia_usd),
fonte_principal=coalesce(excluded.fonte_principal,t.fonte_principal),
fundamentais_em=coalesce(excluded.fundamentais_em,t.fundamentais_em),
tecnicos_em=coalesce(excluded.tecnicos_em,t.tecnicos_em),
dados_status=coalesce(excluded.dados_status,t.dados_status),updated_at=now()
 where t.company_name is distinct from coalesce(excluded.company_name,t.company_name) or t.bdr_ticker is distinct from coalesce(excluded.bdr_ticker,t.bdr_ticker) or t.sector is distinct from coalesce(excluded.sector,t.sector) or t.industry is distinct from coalesce(excluded.industry,t.industry) or t.cik is distinct from coalesce(excluded.cik,t.cik) or t.roic is distinct from coalesce(excluded.roic,t.roic) or t.roe is distinct from coalesce(excluded.roe,t.roe) or t.forward_pe is distinct from coalesce(excluded.forward_pe,t.forward_pe) or t.peg_ratio is distinct from coalesce(excluded.peg_ratio,t.peg_ratio) or t.ev_fcf is distinct from coalesce(excluded.ev_fcf,t.ev_fcf) or t.price_sales is distinct from coalesce(excluded.price_sales,t.price_sales) or t.dividend_yield is distinct from coalesce(excluded.dividend_yield,t.dividend_yield) or t.buyback_yield is distinct from coalesce(excluded.buyback_yield,t.buyback_yield) or t.revenue_growth_yoy is distinct from coalesce(excluded.revenue_growth_yoy,t.revenue_growth_yoy) or t.eps_growth_yoy is distinct from coalesce(excluded.eps_growth_yoy,t.eps_growth_yoy) or t.fcf_margin is distinct from coalesce(excluded.fcf_margin,t.fcf_margin) or t.net_debt_ebitda is distinct from coalesce(excluded.net_debt_ebitda,t.net_debt_ebitda) or t.short_interest_pct is distinct from coalesce(excluded.short_interest_pct,t.short_interest_pct) or t.avg_daily_volume_usd is distinct from coalesce(excluded.avg_daily_volume_usd,t.avg_daily_volume_usd) or t.market_cap_usd is distinct from coalesce(excluded.market_cap_usd,t.market_cap_usd) or t.momentum_12_1 is distinct from coalesce(excluded.momentum_12_1,t.momentum_12_1) or t.rsi_14 is distinct from coalesce(excluded.rsi_14,t.rsi_14) or t.dist_mm200_pct is distinct from coalesce(excluded.dist_mm200_pct,t.dist_mm200_pct) or t.score_quant_us is distinct from coalesce(excluded.score_quant_us,t.score_quant_us) or t.cobertura_pct is distinct from coalesce(excluded.cobertura_pct,t.cobertura_pct) or t.preco_referencia_usd is distinct from coalesce(excluded.preco_referencia_usd,t.preco_referencia_usd) or t.fonte_principal is distinct from coalesce(excluded.fonte_principal,t.fonte_principal) or t.fundamentais_em is distinct from coalesce(excluded.fundamentais_em,t.fundamentais_em) or t.tecnicos_em is distinct from coalesce(excluded.tecnicos_em,t.tecnicos_em) or t.dados_status is distinct from coalesce(excluded.dados_status,t.dados_status);
 get diagnostics total = row_count;
 end if;
 return total;
end;$f$;
revoke all on function public.quant_screeners_lote(text,jsonb) from public,anon,authenticated;
grant execute on function public.quant_screeners_lote(text,jsonb) to service_role;

create or replace function public.quant_screeners_pendentes(p_market text,p_limit integer default 120)
returns jsonb language plpgsql stable security definer set search_path='' as $p$
declare result jsonb;
begin
 if p_market='BR' then
  select coalesce(jsonb_agg(ticker),'[]'::jsonb) into result from
  (select ticker from quant_br.acoes where ativa order by coalesce(tecnicos_em,'1900-01-01'::date),ticker limit least(greatest(p_limit,1),200)) z;
 elsif p_market='US' then
  select coalesce(jsonb_agg(ticker),'[]'::jsonb) into result from
  (select ticker from quant_us.acoes where active order by coalesce(tecnicos_em,'1900-01-01'::date),ticker limit least(greatest(p_limit,1),200)) z;
 else raise exception 'Mercado invalido'; end if;
 return result;
end;$p$;
revoke all on function public.quant_screeners_pendentes(text,integer) from public,anon,authenticated;
grant execute on function public.quant_screeners_pendentes(text,integer) to service_role;