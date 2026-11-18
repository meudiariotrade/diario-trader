CREATE OR REPLACE FUNCTION public.quant_screeners_universo_publico(p_market text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE dados jsonb;
BEGIN
 IF p_market NOT IN ('BR','US') THEN RAISE EXCEPTION 'Mercado invalido'; END IF;
 IF p_market='BR' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO dados
   FROM (SELECT ticker,empresa,setor,segmento,roe,roic,dividend_yield,payout_implicito,pl,pvp,ev_ebitda,
     fcf_yield,margem_liquida,div_liq_ebitda,liquidez_diaria_brl,valor_mercado_brl,
     momentum_12_1,rsi_14,dist_mm200_pct,score_quant_br,cobertura_pct,
     fonte_principal,fundamentais_em,tecnicos_em,score_model_version,data_competencia_balanco,
     ativo_elegivel,updated_at,dados_status,identificador_emissor,documento_balanco_tipo,documento_balanco_id,documento_balanco_url,documento_balanco_publicado_em
     FROM quant_br.acoes WHERE ativa AND ativo_elegivel
     ORDER BY score_quant_br DESC NULLS LAST,ticker LIMIT 1001) x;
 ELSE
   SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO dados
   FROM (SELECT ticker,company_name,sector,industry,bdr_ticker,exchange,roe,roic,dividend_yield,
     forward_pe,peg_ratio,ev_fcf,price_sales,buyback_yield,total_shareholder_yield,
     revenue_growth_yoy,eps_growth_yoy,fcf_margin,rule_of_40,net_debt_ebitda,
     avg_daily_volume_usd,market_cap_usd,momentum_12_1,rsi_14,dist_mm200_pct,
     score_quant_us,cobertura_pct,fonte_principal,fundamentais_em,tecnicos_em,
     score_model_version,data_competencia_balanco,sec_facts_at,sec_source_url,
     ativo_elegivel,updated_at,dados_status,identificador_emissor,documento_balanco_tipo,documento_balanco_id,documento_balanco_url,documento_balanco_publicado_em
     FROM quant_us.acoes WHERE active AND ativo_elegivel
     ORDER BY score_quant_us DESC NULLS LAST,ticker LIMIT 1001) x;
 END IF;
 RETURN jsonb_build_object('market',p_market,'rows',
   (SELECT coalesce(jsonb_agg(j),'[]'::jsonb)
    FROM jsonb_array_elements(dados) WITH ORDINALITY AS _entry(j,ord)
    WHERE ord<=1000),
   'complete',jsonb_array_length(dados)<=1000);
END $function$;

CREATE OR REPLACE FUNCTION public.quant_v2_compact(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare out_rows jsonb;out_scatter jsonb;res jsonb;
begin
 select coalesce(jsonb_agg(t.compact order by t.ord),'[]'::jsonb) into out_rows from (
  select x.ord,(select coalesce(jsonb_object_agg(k,case
    when jsonb_typeof(v)='number' then to_jsonb(round((v::text)::numeric,4)) else v end),'{}'::jsonb)
    from jsonb_each(x.value) as kv(k,v) where k=any(array['ticker','empresa','company_name','setor','sector','bdr_ticker','exchange','roe','roic','dividend_yield','payout_implicito','pl','pvp','ev_ebitda','fcf_yield','div_liq_ebitda','momentum_12_1','rsi_14','dist_mm200_pct','liquidez_diaria_brl','valor_mercado_brl','avg_daily_volume_usd','market_cap_usd','forward_pe','peg_ratio','ev_fcf','fcf_margin','eps_growth_yoy','revenue_growth_yoy','price_sales','rule_of_40','score_quant_br','score_quant_us','score_qualidade','score_valuation','score_dividendos','score_momentum','score_model_version','cobertura_pct','ativo_elegivel','fonte_principal','fundamentais_em','tecnicos_em','data_competencia_balanco','sec_facts_at','sec_source_url','updated_at','dados_status','identificador_emissor','documento_balanco_tipo','documento_balanco_id','documento_balanco_url','documento_balanco_publicado_em']::text[]) and v<>'null'::jsonb) compact
  from jsonb_array_elements(coalesce(p->'rows','[]'::jsonb)) with ordinality as x(value,ord)
 ) t;
 select coalesce(jsonb_agg(t.compact order by t.ord),'[]'::jsonb) into out_scatter from (
  select x.ord,(select coalesce(jsonb_object_agg(k,case
   when jsonb_typeof(v)='number' then to_jsonb(round((v::text)::numeric,4)) else v end),'{}'::jsonb)
   from jsonb_each(x.value) as kv(k,v) where k=any(array['ticker','roe','roic','payout','pvp','ev_ebitda','dy','div_liq_ebitda','momentum','owned','forward_pe','peg_ratio','yield','rule40','score','fcf_yield','fcf_margin']::text[]) and v<>'null'::jsonb) compact
  from jsonb_array_elements(coalesce(p->'scatter','[]'::jsonb)) with ordinality as x(value,ord)
  where x.ord<=180
 ) t;
 res:=jsonb_set(coalesce(p,'{}'::jsonb),'{rows}',out_rows);
 return jsonb_set(res,'{scatter}',out_scatter);
end $function$;

