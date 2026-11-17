create or replace function public.quant_v2_compact(p jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare out_rows jsonb;out_scatter jsonb;res jsonb;
begin
 select coalesce(jsonb_agg(t.compact order by t.ord),'[]'::jsonb) into out_rows from (
  select x.ord,(select coalesce(jsonb_object_agg(k,case
    when jsonb_typeof(v)='number' then to_jsonb(round((v::text)::numeric,4)) else v end),'{}'::jsonb)
    from jsonb_each(x.value) as kv(k,v) where k=any(array['ticker','empresa','company_name','setor','sector','bdr_ticker','exchange','roe','roic','dividend_yield','payout_implicito','pl','pvp','ev_ebitda','fcf_yield','div_liq_ebitda','momentum_12_1','rsi_14','dist_mm200_pct','liquidez_diaria_brl','valor_mercado_brl','avg_daily_volume_usd','market_cap_usd','forward_pe','peg_ratio','ev_fcf','fcf_margin','eps_growth_yoy','revenue_growth_yoy','price_sales','rule_of_40','score_quant_br','score_quant_us','score_qualidade','score_valuation','score_dividendos','score_momentum','score_model_version','cobertura_pct','ativo_elegivel','fonte_principal','fundamentais_em','tecnicos_em','data_competencia_balanco','sec_facts_at','sec_source_url','updated_at','dados_status','identificador_emissor']::text[]) and v<>'null'::jsonb) compact
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
end $$;
