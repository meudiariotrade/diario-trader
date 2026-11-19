-- v787: score BR integra 4 preços-teto somente se todos documentados e com bases compatíveis.
-- Regra de compatibilidade: nota antiga quando insumos ausentes; US intocado.

-- v787: insumos públicos auditáveis, aditivos e sem alterações em dados existentes.
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS lucro_projetado_brl numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS total_acoes numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS payout_projetado numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS payout_medio_historico numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS dpa_12m numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS dpa_media_consistente_5a numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS dividendos_anuais jsonb;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS lpa numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS vpa numeric;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS valuation_insumos_conferidos boolean NOT NULL DEFAULT false;
-- Sem INSERT/UPDATE em massa neste migration: fontes ausentes permanecem NULL.
CREATE OR REPLACE FUNCTION public.quant_br_valor_composto(r jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
DECLARE
 preco numeric:=NULLIF(r->>'preco_referencia','')::numeric;
 shares numeric:=NULLIF(r->>'total_acoes','')::numeric;
 lucro numeric:=NULLIF(r->>'lucro_projetado_brl','')::numeric;
 cap numeric:=NULLIF(r->>'valor_mercado_brl','')::numeric;
 pl numeric:=NULLIF(r->>'pl','')::numeric;
 pay numeric:=coalesce(NULLIF(r->>'payout_projetado','')::numeric,
                        NULLIF(r->>'payout_medio_historico','')::numeric);
 dpa numeric:=NULLIF(r->>'dpa_12m','')::numeric;
 media numeric:=NULLIF(r->>'dpa_media_consistente_5a','')::numeric;
 lpa numeric:=NULLIF(r->>'lpa','')::numeric;
 vpa numeric:=NULLIF(r->>'vpa','')::numeric;
 own numeric; bazin numeric; dyn numeric; graham numeric;
 m1 numeric; m2 numeric; m3 numeric; m4 numeric; composite numeric; note numeric;
 source text:='lucro projetado informado';
BEGIN
 IF coalesce((r->>'valuation_insumos_conferidos')::boolean,false)=false
  OR preco IS NULL OR preco<=0 THEN
  RETURN jsonb_build_object('composite_margin',null,'score',null,'status','sem prova completa');
 END IF;
 IF (lucro IS NULL OR lucro<=0) AND cap>0 AND pl>0 THEN
  lucro:=cap/pl; source:='lucro TTM implicito: valor mercado / P/L, nao consenso';
 END IF;
 IF pay>1 AND pay<=100 THEN pay:=pay/100; END IF;
 IF lucro IS NULL OR lucro<=0 OR shares IS NULL OR shares<=0 OR
    pay IS NULL OR pay<=0 OR pay>1 OR dpa IS NULL OR dpa<=0 OR
    media IS NULL OR media<=0 OR lpa IS NULL OR lpa<=0 OR vpa IS NULL OR vpa<=0 THEN
  RETURN jsonb_build_object('composite_margin',null,'score',null,'status','um ou mais insumos ausentes');
 END IF;
 own:=(lucro*pay/shares)/0.07;
 bazin:=dpa/0.06;
 dyn:=media/0.06;
 graham:=sqrt(22.5*lpa*vpa);
 IF least(own,bazin,dyn,graham)<=0 THEN
  RETURN jsonb_build_object('composite_margin',null,'score',null,'status','preco teto invalido');
 END IF;
 m1:=(own-preco)/own*100;m2:=(bazin-preco)/bazin*100;
 m3:=(dyn-preco)/dyn*100;m4:=(graham-preco)/graham*100;
 composite:=(m1+m2+m3+m4)/4;
 note:=greatest(0,least(100,50+composite));
 RETURN jsonb_build_object(
   'proprio',own,'bazin',bazin,'bazinDinamico',dyn,'graham',graham,
   'margem_proprio',m1,'margem_bazin',m2,'margem_bazinDinamico',m3,'margem_graham',m4,
   'composite_margin',composite,'score',note,'status','conferido','lucro_base',source);
END $function$;
REVOKE ALL ON FUNCTION public.quant_br_valor_composto(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_br_valor_composto(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.quant_v2_score(m text,r jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
DECLARE
 q numeric;v numeric;d numeric;mo numeric;tt numeric;dy numeric;pl numeric;pay numeric;
 fin boolean;model text; v_val numeric;
BEGIN
 fin:=lower(trim(coalesce(r->>'setor',r->>'sector',''))) IN ('finance','financeiro','financials','financial services')
  AND lower(coalesce(r->>'segmento',r->>'industry','')||' '||coalesce(r->>'empresa',r->>'company_name',''))
  ~ '(^|[^a-z])(banco|bancos|bancorp|unibanco|bank|banks|banking|bco|jpmorgan|morgan[[:space:]]+stanley|goldman[[:space:]]+sachs|wells[[:space:]]+fargo|citigroup|capital[[:space:]]+one|pnc[[:space:]]+financial|chubb|progressive[[:space:]]+corporation|allstate[[:space:]]+corporation|travelers[[:space:]]+companies|seguro|seguros|seguradora|seguradoras|seguridade|resseguro|resseguros|insurance|insurer|insurers|financial[[:space:]]+holdings?|holdings?[[:space:]]+financeiras?)([^a-z]|$)';
 model:=CASE WHEN fin AND m='BR' THEN 'v2.1-fin' WHEN fin AND m='US' THEN 'us_v2.1-fin'
   WHEN m='BR' THEN 'v2.0' ELSE 'us_v2.0' END;
 dy:=nullif(r->>'dividend_yield','')::numeric;
 pl:=nullif(r->>'pl','')::numeric;
 pay:=nullif(r->>'payout_implicito','')::numeric;
 IF m='BR' THEN
  v_val:=(public.quant_br_valor_composto(r)->>'score')::numeric;
  IF (pay IS NULL OR pay=0) AND dy>0 AND pl>0 THEN pay:=round(dy*pl,4);END IF;
  IF fin THEN
   q:=public.quant_v2_scale((r->>'roe')::numeric,5,25);
   v:=public.quant_v2_avg(public.quant_v2_scale(pl,5,25,true),
    public.quant_v2_scale((r->>'pvp')::numeric,.6,3,true));
   d:=public.quant_v2_avg(public.quant_v2_scale(dy,0,12),
    CASE WHEN pay IS NULL THEN null WHEN pay BETWEEN 20 AND 80 THEN 90 ELSE 25 END);
   mo:=public.quant_v2_scale((r->>'momentum_12_1')::numeric,-30,50);
  ELSE
   q:=public.quant_v2_avg(public.quant_v2_scale((r->>'roe')::numeric,5,25),public.quant_v2_scale((r->>'roic')::numeric,5,22));
   v:=public.quant_v2_avg(public.quant_v2_scale(pl,5,25,true),
    public.quant_v2_scale((r->>'ev_ebitda')::numeric,4,18,true),public.quant_v2_scale((r->>'fcf_yield')::numeric,0,12));
   d:=public.quant_v2_avg(public.quant_v2_scale(dy,0,12),
    CASE WHEN pay IS NULL THEN null WHEN pay BETWEEN 20 AND 80 THEN 90 ELSE 25 END);
   mo:=public.quant_v2_scale((r->>'momentum_12_1')::numeric,-30,50);
  END IF;
  IF v IS NOT NULL AND v_val IS NOT NULL THEN
   v:=v*0.80+v_val*0.20;
   model:=CASE WHEN fin THEN 'v2.2-fin-val' ELSE 'v2.2-val' END;
  END IF;
  tt:=CASE WHEN q IS NULL OR v IS NULL OR d IS NULL OR mo IS NULL THEN null
   ELSE round(q*.30+v*.30+d*.25+mo*.15,2) END;
 ELSIF m='US' THEN
  IF fin THEN
   q:=public.quant_v2_scale((r->>'roe')::numeric,5,25);
   v:=public.quant_v2_avg(public.quant_v2_scale((r->>'forward_pe')::numeric,8,40,true),
    public.quant_v2_scale((r->>'pvp')::numeric,.6,3,true));
   mo:=public.quant_v2_avg(public.quant_v2_scale((r->>'momentum_12_1')::numeric,-30,50),
    public.quant_v2_scale((r->>'dist_mm200_pct')::numeric,-35,35));
   d:=public.quant_v2_avg(public.quant_v2_scale(dy,0,12),
    CASE WHEN pay IS NULL THEN null WHEN pay BETWEEN 20 AND 80 THEN 90 ELSE 25 END);
  ELSE
   q:=public.quant_v2_avg(public.quant_v2_scale((r->>'roic')::numeric,5,22),
    public.quant_v2_scale((r->>'roe')::numeric,5,25),public.quant_v2_scale((r->>'fcf_margin')::numeric,0,30),
    public.quant_v2_scale((r->>'eps_growth_yoy')::numeric,-10,35),public.quant_v2_scale((r->>'revenue_growth_yoy')::numeric,-10,35));
   v:=public.quant_v2_avg(public.quant_v2_scale((r->>'forward_pe')::numeric,8,40,true),
    public.quant_v2_scale((r->>'peg_ratio')::numeric,.7,3,true),
    public.quant_v2_scale((r->>'ev_fcf')::numeric,5,35,true));
   mo:=public.quant_v2_avg(public.quant_v2_scale((r->>'momentum_12_1')::numeric,-30,50),
    public.quant_v2_scale((r->>'dist_mm200_pct')::numeric,-35,35));
   d:=public.quant_v2_avg(public.quant_v2_scale(dy,0,12),
    CASE WHEN pay IS NULL THEN null WHEN pay BETWEEN 0 AND 80 THEN 90 ELSE 25 END);
  END IF;
  tt:=CASE WHEN q IS NULL OR v IS NULL OR d IS NULL OR mo IS NULL THEN null
   ELSE round(q*.30+v*.30+mo*.25+d*.15,2) END;
 ELSE RAISE EXCEPTION 'Mercado invalido'; END IF;
 RETURN jsonb_build_object('total',tt,'qualidade',CASE WHEN q IS NULL THEN null ELSE round(q*.30,2) END,
   'valuation',CASE WHEN v IS NULL THEN null ELSE round(v*.30,2) END,
   'dividendos',CASE WHEN d IS NULL THEN null ELSE round(d*(CASE WHEN m='BR' THEN .25 ELSE .15 END),2) END,
   'momentum',CASE WHEN mo IS NULL THEN null ELSE round(mo*(CASE WHEN m='BR' THEN .15 ELSE .25 END),2) END,
   'payout_efetivo',pay,'modelo',model,'setor_financeiro_confirmado',fin,
   'margem_composta',CASE WHEN m='BR' THEN public.quant_br_valor_composto(r)->'composite_margin' ELSE 'null'::jsonb END);
END $function$;

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
     preco_referencia,lucro_projetado_brl,total_acoes,payout_projetado,payout_medio_historico,dpa_12m,dpa_media_consistente_5a,lpa,vpa,dividendos_anuais,valuation_insumos_conferidos,momentum_12_1,rsi_14,dist_mm200_pct,score_quant_br,cobertura_pct,
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
    from jsonb_each(x.value) as kv(k,v) where k=any(array['ticker','empresa','company_name','setor','sector','bdr_ticker','exchange','roe','roic','dividend_yield','payout_implicito','pl','preco_referencia','lucro_projetado_brl','total_acoes','payout_projetado','payout_medio_historico','dpa_12m','dpa_media_consistente_5a','lpa','vpa','dividendos_anuais','valuation_insumos_conferidos','pvp','ev_ebitda','fcf_yield','div_liq_ebitda','momentum_12_1','rsi_14','dist_mm200_pct','liquidez_diaria_brl','valor_mercado_brl','avg_daily_volume_usd','market_cap_usd','forward_pe','peg_ratio','ev_fcf','fcf_margin','eps_growth_yoy','revenue_growth_yoy','price_sales','rule_of_40','score_quant_br','score_quant_us','score_qualidade','score_valuation','score_dividendos','score_momentum','score_model_version','cobertura_pct','ativo_elegivel','fonte_principal','fundamentais_em','tecnicos_em','data_competencia_balanco','sec_facts_at','sec_source_url','updated_at','dados_status','identificador_emissor','documento_balanco_tipo','documento_balanco_id','documento_balanco_url','documento_balanco_publicado_em']::text[]) and v<>'null'::jsonb) compact
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
   score_model_version=coalesce(s.sc->>'modelo','v2.0'),
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
   score_model_version=coalesce(s.sc->>'modelo','us_v2.0'),
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

-- Compatibilidade do cálculo em lote: financeiro com valuation certificado continua elegível.
CREATE OR REPLACE FUNCTION public.quant_v2_recalcular_lote(p_market text, p_tickers text[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare n integer:=0;
begin
 if p_market not in ('BR','US') or array_length(p_tickers,1)>250 then raise exception 'Lote ou mercado invalido'; end if;
 if coalesce(array_length(p_tickers,1),0)=0 then return 0;end if;
 if p_market='BR' then
  with scores as (
   select a.ticker,public.quant_v2_score('BR',to_jsonb(a)) s
   from quant_br.acoes a where a.ativa and a.ticker=any(p_tickers)
  ),v as (
   select ticker,s,(s->>'modelo') as modelo,(s->>'total')::numeric total,(s->>'payout_efetivo')::numeric payout,
   (s->>'qualidade')::numeric q,(s->>'valuation')::numeric val,
   (s->>'dividendos')::numeric div,(s->>'momentum')::numeric mo from scores
  )
  update quant_br.acoes a set
   payout_implicito=coalesce(v.payout,a.payout_implicito),score_quant_br=v.total,
   score_qualidade=v.q,score_valuation=v.val,score_dividendos=v.div,
   score_momentum=v.mo,score_model_version=v.modelo,
   ativo_elegivel=coalesce((a.ativa and a.liquidez_diaria_brl>=1000000 and
    coalesce(a.pl,1)>0 and (v.modelo IN ('v2.1-fin','v2.2-fin-val') or (coalesce(a.ev_ebitda,1)>0 and coalesce(a.fcf_yield,0)>=0))),false),
   identificador_emissor=left(a.ticker,4)
  from v where a.ticker=v.ticker and (
    a.score_quant_br is distinct from v.total or
    a.payout_implicito is distinct from coalesce(v.payout,a.payout_implicito) or
    a.score_model_version is distinct from v.modelo or
    a.ativo_elegivel is distinct from coalesce((a.ativa and a.liquidez_diaria_brl>=1000000 and
    coalesce(a.pl,1)>0 and (v.modelo IN ('v2.1-fin','v2.2-fin-val') or (coalesce(a.ev_ebitda,1)>0 and coalesce(a.fcf_yield,0)>=0))),false)
  );
 else
  with scores as(
   select a.ticker,public.quant_v2_score('US',to_jsonb(a)) s
   from quant_us.acoes a where a.active and a.ticker=any(p_tickers)
  ),v as(
   select ticker,s,(s->>'modelo') as modelo,(s->>'total')::numeric total,(s->>'qualidade')::numeric q,
   (s->>'valuation')::numeric val,(s->>'dividendos')::numeric div,
   (s->>'momentum')::numeric mo from scores
  )
  update quant_us.acoes a set
   score_quant_us=v.total,score_qualidade=v.q,score_valuation=v.val,
   score_dividendos=v.div,score_momentum=v.mo,score_model_version=v.modelo,
   identificador_emissor=coalesce(nullif(a.cik,''),upper(a.company_name)),
   ativo_elegivel=coalesce((a.active and a.exchange in ('NYSE','NASDAQ') and
    a.security_type='stock' and a.avg_daily_volume_usd>=2000000 and a.market_cap_usd>=300000000),false)
  from v where a.ticker=v.ticker and (
   a.score_quant_us is distinct from v.total or
   a.score_model_version is distinct from v.modelo or
   a.ativo_elegivel is distinct from coalesce((a.active and a.exchange in ('NYSE','NASDAQ') and
    a.security_type='stock' and a.avg_daily_volume_usd>=2000000 and a.market_cap_usd>=300000000),false)
  );
 end if;
 get diagnostics n=row_count;return n;
end $function$

;
CREATE OR REPLACE FUNCTION quant_us.score_v2_transacional()
RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
AS $function$
DECLARE s jsonb;
BEGIN
 s:=public.quant_v2_score('US',to_jsonb(NEW));
 NEW.score_quant_us:=(s->>'total')::numeric;
 NEW.score_qualidade:=(s->>'qualidade')::numeric;
 NEW.score_valuation:=(s->>'valuation')::numeric;
 NEW.score_dividendos:=(s->>'dividendos')::numeric;
 NEW.score_momentum:=(s->>'momentum')::numeric;
 NEW.score_model_version:=coalesce(s->>'modelo','us_v2.0');
 RETURN NEW;
END $function$;
