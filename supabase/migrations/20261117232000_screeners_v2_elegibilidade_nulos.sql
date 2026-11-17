CREATE OR REPLACE FUNCTION public.quant_v2_recalcular(p_market text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result integer;
begin
 if p_market='BR' then
  with s as (select ticker,public.quant_v2_score('BR',to_jsonb(b)) sc from quant_br.acoes b where b.ativa)
  update quant_br.acoes b set
   payout_implicito=coalesce((s.sc->>'payout_efetivo')::numeric,b.payout_implicito),
   score_quant_br=(s.sc->>'total')::numeric,
   score_qualidade=(s.sc->>'qualidade')::numeric,
   score_valuation=(s.sc->>'valuation')::numeric,
   score_dividendos=(s.sc->>'dividendos')::numeric,
   score_momentum=(s.sc->>'momentum')::numeric,
   score_model_version='v2.0',
   ativo_elegivel=coalesce((b.ativa and b.liquidez_diaria_brl>=1000000 and coalesce(b.pl,1)>0 and coalesce(b.ev_ebitda,1)>0 and coalesce(b.fcf_yield,0)>=0),false),
   identificador_emissor=left(b.ticker,4),
   data_competencia_balanco=b.data_competencia_balanco
   from s where b.ticker=s.ticker;
 elsif p_market='US' then
  with s as (select ticker,public.quant_v2_score('US',to_jsonb(b)) sc from quant_us.acoes b where b.active)
  update quant_us.acoes b set
   score_quant_us=(s.sc->>'total')::numeric,
   score_qualidade=(s.sc->>'qualidade')::numeric,
   score_valuation=(s.sc->>'valuation')::numeric,
   score_dividendos=(s.sc->>'dividendos')::numeric,
   score_momentum=(s.sc->>'momentum')::numeric,
   score_model_version='us_v2.0',
   ativo_elegivel=coalesce((b.active and b.exchange in ('NYSE','NASDAQ')
     and b.security_type='stock'
     and b.avg_daily_volume_usd>=2000000 and b.market_cap_usd>=300000000),false),
   identificador_emissor=coalesce(nullif(b.cik,''),upper(b.company_name)),
   data_competencia_balanco=coalesce(b.data_competencia_balanco,b.sec_facts_at)
   from s where b.ticker=s.ticker;
 else raise exception 'Mercado invalido';end if;
 get diagnostics result=row_count;
 return result;
end $function$
;
