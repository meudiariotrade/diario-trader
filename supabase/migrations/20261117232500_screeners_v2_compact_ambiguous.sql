CREATE OR REPLACE FUNCTION public.quant_v2_compact(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare out_rows jsonb;out_scatter jsonb;res jsonb;
begin
 select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
 'ticker',r->'ticker','empresa',r->'empresa','company_name',r->'company_name',
 'setor',r->'setor','sector',r->'sector','bdr_ticker',r->'bdr_ticker',
 'exchange',r->'exchange','security_type',r->'security_type',
 'roe',r->'roe','roic',r->'roic','dividend_yield',r->'dividend_yield',
 'payout_implicito',r->'payout_implicito','pl',r->'pl','pvp',r->'pvp',
 'ev_ebitda',r->'ev_ebitda','fcf_yield',r->'fcf_yield',
 'div_liq_ebitda',r->'div_liq_ebitda','momentum_12_1',r->'momentum_12_1',
 'rsi_14',r->'rsi_14','dist_mm200_pct',r->'dist_mm200_pct',
 'liquidez_diaria_brl',r->'liquidez_diaria_brl','valor_mercado_brl',r->'valor_mercado_brl',
 'avg_daily_volume_usd',r->'avg_daily_volume_usd','market_cap_usd',r->'market_cap_usd',
 'forward_pe',r->'forward_pe','peg_ratio',r->'peg_ratio','ev_fcf',r->'ev_fcf',
 'fcf_margin',r->'fcf_margin','eps_growth_yoy',r->'eps_growth_yoy',
 'revenue_growth_yoy',r->'revenue_growth_yoy','price_sales',r->'price_sales',
 'rule_of_40',r->'rule_of_40','buyback_yield',r->'buyback_yield',
 'total_shareholder_yield',r->'total_shareholder_yield',
 'score_quant_br',r->'score_quant_br','score_quant_us',r->'score_quant_us',
 'score_qualidade',r->'score_qualidade','score_valuation',r->'score_valuation',
 'score_dividendos',r->'score_dividendos','score_momentum',r->'score_momentum',
 'score_model_version',r->'score_model_version',
 'cobertura_pct',r->'cobertura_pct','ativo_elegivel',r->'ativo_elegivel',
 'fonte_principal',r->'fonte_principal','fonte_precos',r->'fonte_precos',
 'fundamentais_em',r->'fundamentais_em','tecnicos_em',r->'tecnicos_em',
 'data_competencia_balanco',r->'data_competencia_balanco',
 'sec_facts_at',r->'sec_facts_at','sec_source_url',r->'sec_source_url',
 'updated_at',r->'updated_at','dados_status',r->'dados_status',
 'identificador_emissor',r->'identificador_emissor'
 )))) into out_rows from jsonb_array_elements(coalesce(p->'rows','[]'::jsonb)) r;
 select coalesce(jsonb_agg(r),'[]'::jsonb) into out_scatter from (
  select value as r from jsonb_array_elements(coalesce(p->'scatter','[]'::jsonb)) with ordinality a(value,ord)
  where ord<=180
 ) a;
 res:=jsonb_set(coalesce(p,'{}'::jsonb),'{rows}',coalesce(out_rows,'[]'::jsonb));
 res:=jsonb_set(res,'{scatter}',coalesce(out_scatter,'[]'::jsonb));
 return res;
end $function$
;
