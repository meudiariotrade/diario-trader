create or replace function public.quant_v2_compact(p jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare out_rows jsonb;out_scatter jsonb;res jsonb;
begin
 select coalesce(jsonb_agg(t.compact),'[]'::jsonb) into out_rows from (
 select (select coalesce(jsonb_object_agg(k,v),'{}'::jsonb)
 from jsonb_each(x.value) as kv(k,v) where k=any(array['ticker','empresa','company_name','setor','sector','bdr_ticker','exchange','security_type','roe','roic','dividend_yield','payout_implicito','pl','pvp','ev_ebitda','fcf_yield','div_liq_ebitda','momentum_12_1','rsi_14','dist_mm200_pct','liquidez_diaria_brl','valor_mercado_brl','avg_daily_volume_usd','market_cap_usd','forward_pe','peg_ratio','ev_fcf','fcf_margin','eps_growth_yoy','revenue_growth_yoy','price_sales','rule_of_40','buyback_yield','total_shareholder_yield','score_quant_br','score_quant_us','score_qualidade','score_valuation','score_dividendos','score_momentum','score_model_version','cobertura_pct','ativo_elegivel','fonte_principal','fonte_precos','fundamentais_em','tecnicos_em','data_competencia_balanco','sec_facts_at','sec_source_url','updated_at','dados_status','identificador_emissor']::text[]) and v<>'null'::jsonb) compact
 from jsonb_array_elements(coalesce(p->'rows','[]'::jsonb)) as x(value)
 ) t;
 select coalesce(jsonb_agg(value),'[]'::jsonb) into out_scatter from
 (select value from jsonb_array_elements(coalesce(p->'scatter','[]'::jsonb)) with ordinality as a(value,ord) where ord<=180) y;
 res:=jsonb_set(coalesce(p,'{}'::jsonb),'{rows}',out_rows);
 return jsonb_set(res,'{scatter}',out_scatter);
end $$;
