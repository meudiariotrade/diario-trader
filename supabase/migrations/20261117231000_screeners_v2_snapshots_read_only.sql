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
   ativo_elegivel=(b.ativa and b.liquidez_diaria_brl>=1000000 and coalesce(b.pl,1)>0 and coalesce(b.ev_ebitda,1)>0 and coalesce(b.fcf_yield,0)>=0),
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
   ativo_elegivel=(b.active and b.exchange in ('NYSE','NASDAQ')
     and b.security_type='stock'
     and b.avg_daily_volume_usd>=2000000 and b.market_cap_usd>=300000000),
   identificador_emissor=coalesce(nullif(b.cik,''),upper(b.company_name)),
   data_competencia_balanco=coalesce(b.data_competencia_balanco,b.sec_facts_at)
   from s where b.ticker=s.ticker;
 else raise exception 'Mercado invalido';end if;
 get diagnostics result=row_count;
 return result;
end $function$
;

-- Separar data de coleta da competência do balanço; não inferir filing date.
create or replace function public.quant_v2_classificar_us(p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>200 then raise exception 'Lote invalido';end if;
 update quant_us.acoes a set
  security_type=case when x.security_type='stock' then 'stock' else 'other' end,
  exchange=case when x.exchange in ('NYSE','NASDAQ') then x.exchange else a.exchange end
 from jsonb_to_recordset(p_rows) x(ticker text,security_type text,exchange text)
 where a.ticker=upper(btrim(x.ticker));
 get diagnostics n=row_count;return n;
end $$;

-- Payload compacto sem colunas extras do catálogo e sem mudar os nomes consumidos pela UI.
create or replace function public.quant_v2_compact(p jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare r jsonb;out_rows jsonb;out_scatter jsonb;res jsonb;
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
end $$;

-- Snapshot global: uma agregação depois de atualizar cada lote, não a cada abertura.
create or replace function public.quant_v2_snapshot_refresh(p_market text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare data jsonb;top jsonb;result jsonb;
begin
 if p_market not in ('BR','US') then raise exception 'Mercado invalido';end if;
 data:=public.quant_v2_compact(public.quant_screeners_buscar(p_market,'','','todos','{}'::text[],0,'all','top','score',0));
 if p_market='BR' then
   select coalesce(jsonb_agg(row),'[]'::jsonb) into top from (
    select to_jsonb(b) row from (
     select distinct on (identificador_emissor) * from quant_br.acoes
     where ativa and ativo_elegivel and score_quant_br is not null
     order by identificador_emissor, liquidez_diaria_brl desc nulls last,score_quant_br desc nulls last
    ) b order by b.score_quant_br desc nulls last,ticker limit 10) q;
   insert into quant_br.snapshot(chave,payload,gerado_em) values('global',
     jsonb_set(data,'{top10}',top),now())
   on conflict(chave) do update set payload=excluded.payload,gerado_em=excluded.gerado_em;
   insert into quant_br.setor_medianas(setor,empresas,roe,roic,dy,momentum,calculado_em)
   select setor,count(*),percentile_disc(.5) within group(order by roe),
    percentile_disc(.5) within group(order by roic),percentile_disc(.5) within group(order by dividend_yield),
    percentile_disc(.5) within group(order by momentum_12_1),now()
    from quant_br.acoes where ativa and setor is not null group by setor
   on conflict(setor) do update set empresas=excluded.empresas,roe=excluded.roe,roic=excluded.roic,
     dy=excluded.dy,momentum=excluded.momentum,calculado_em=excluded.calculado_em;
 else
   select coalesce(jsonb_agg(row),'[]'::jsonb) into top from (
    select to_jsonb(b) row from (
     select distinct on (identificador_emissor) * from quant_us.acoes
     where active and ativo_elegivel and score_quant_us is not null
     order by identificador_emissor,avg_daily_volume_usd desc nulls last,score_quant_us desc nulls last
    ) b order by b.score_quant_us desc nulls last,ticker limit 10) q;
   insert into quant_us.snapshot(chave,payload,gerado_em) values('global',
    jsonb_set(data,'{top10}',top),now())
   on conflict(chave) do update set payload=excluded.payload,gerado_em=excluded.gerado_em;
   insert into quant_us.setor_medianas(setor,empresas,roe,roic,dy,momentum,calculado_em)
   select sector,count(*),percentile_disc(.5) within group(order by roe),
    percentile_disc(.5) within group(order by roic),percentile_disc(.5) within group(order by dividend_yield),
    percentile_disc(.5) within group(order by momentum_12_1),now()
    from quant_us.acoes where active and sector is not null group by sector
   on conflict(setor) do update set empresas=excluded.empresas,roe=excluded.roe,roic=excluded.roic,
    dy=excluded.dy,momentum=excluded.momentum,calculado_em=excluded.calculado_em;
 end if;
 return jsonb_build_object('market',p_market,'top',jsonb_array_length(top),'bytes',octet_length(data::text));
end $$;

create or replace function public.quant_v2_snapshot_read(p_market text)
returns jsonb language sql stable security definer set search_path='' as $$
 select case when p_market='BR' then
 (select payload from quant_br.snapshot where chave='global')
 else (select payload from quant_us.snapshot where chave='global') end
$$;

create or replace function public.quant_v2_consulta_compacta(p_market text,p_search text,p_sector text,p_custody text,
p_owned text[],p_liquidity numeric,p_cap text,p_preset text,p_order text,p_page integer)
returns jsonb language sql stable security definer set search_path='' as $$
 select public.quant_v2_compact(public.quant_screeners_buscar(p_market,p_search,p_sector,p_custody,
 p_owned,p_liquidity,p_cap,p_preset,p_order,p_page))
$$;
revoke all on function public.quant_v2_classificar_us(jsonb),public.quant_v2_compact(jsonb),
 public.quant_v2_snapshot_refresh(text),public.quant_v2_snapshot_read(text),
 public.quant_v2_consulta_compacta(text,text,text,text,text[],numeric,text,text,text,integer)
 from public,anon,authenticated;
grant execute on function public.quant_v2_classificar_us(jsonb),public.quant_v2_compact(jsonb),
 public.quant_v2_snapshot_refresh(text),public.quant_v2_snapshot_read(text),
 public.quant_v2_consulta_compacta(text,text,text,text,text[],numeric,text,text,text,integer)
 to service_role;
