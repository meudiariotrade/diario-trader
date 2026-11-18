CREATE OR REPLACE FUNCTION public.quant_screeners_universo_publico(p_market text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
DECLARE dados jsonb;
BEGIN
 IF p_market NOT IN ('BR','US') THEN RAISE EXCEPTION 'Mercado invalido'; END IF;
 IF p_market='BR' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO dados
   FROM (SELECT ticker,empresa,setor,segmento,roe,roic,dividend_yield,payout_implicito,pl,pvp,ev_ebitda,
     fcf_yield,margem_liquida,div_liq_ebitda,liquidez_diaria_brl,valor_mercado_brl,
     momentum_12_1,rsi_14,dist_mm200_pct,score_quant_br,cobertura_pct,
     fonte_principal,fundamentais_em,tecnicos_em,score_model_version,data_competencia_balanco,
     ativo_elegivel,updated_at,dados_status,identificador_emissor
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
     ativo_elegivel,updated_at,dados_status,identificador_emissor
     FROM quant_us.acoes WHERE active AND ativo_elegivel
     ORDER BY score_quant_us DESC NULLS LAST,ticker LIMIT 1001) x;
 END IF;
 RETURN jsonb_build_object('market',p_market,'rows',
   (SELECT coalesce(jsonb_agg(j),'[]'::jsonb)
    FROM jsonb_array_elements(dados) WITH ORDINALITY AS _entry(j,ord)
    WHERE ord<=1000),
   'complete',jsonb_array_length(dados)<=1000);
END $$;
REVOKE ALL ON FUNCTION public.quant_screeners_universo_publico(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_screeners_universo_publico(text) TO service_role;
