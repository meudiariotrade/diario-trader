-- v769: bancos, seguradoras e holdings financeiras com classificação específica, não setor Finance genérico.
-- Preserva métricas ausentes como NULL e versão de modelo por ativo; sem leituras de logs.
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS pvp numeric;
CREATE OR REPLACE FUNCTION public.quant_v2_score(m text,r jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
DECLARE
 q numeric;v numeric;d numeric;mo numeric;tt numeric;dy numeric;pl numeric;pay numeric;
 fin boolean;model text;
BEGIN
 fin:=lower(trim(coalesce(r->>'setor',r->>'sector',''))) IN ('finance','financeiro','financials','financial services')
  AND lower(coalesce(r->>'segmento',r->>'industry','')||' '||coalesce(r->>'empresa',r->>'company_name',''))
  ~ '(^|[^a-z])(banco|bancos|bancorp|unibanco|bank|banks|banking|seguro|seguros|seguradora|seguradoras|seguridade|resseguro|resseguros|insurance|insurer|insurers|financial[[:space:]]+holdings?|holdings?[[:space:]]+financeiras?)([^a-z]|$)';
 model:=CASE WHEN fin AND m='BR' THEN 'v2.1-fin' WHEN fin AND m='US' THEN 'us_v2.1-fin'
   WHEN m='BR' THEN 'v2.0' ELSE 'us_v2.0' END;
 dy:=nullif(r->>'dividend_yield','')::numeric;
 pl:=nullif(r->>'pl','')::numeric;
 pay:=nullif(r->>'payout_implicito','')::numeric;
 IF m='BR' THEN
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
   'payout_efetivo',pay,'modelo',model,'setor_financeiro_confirmado',fin);
END $function$;

-- Atualizações transacionais existentes continuam aceitando até 250 ativos por lote.
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
    coalesce(a.pl,1)>0 and (v.modelo='v2.1-fin' or (coalesce(a.ev_ebitda,1)>0 and coalesce(a.fcf_yield,0)>=0))),false),
   identificador_emissor=left(a.ticker,4)
  from v where a.ticker=v.ticker and (
    a.score_quant_br is distinct from v.total or
    a.payout_implicito is distinct from coalesce(v.payout,a.payout_implicito) or
    a.score_model_version is distinct from v.modelo or
    a.ativo_elegivel is distinct from coalesce((a.ativa and a.liquidez_diaria_brl>=1000000 and
    coalesce(a.pl,1)>0 and (v.modelo='v2.1-fin' or (coalesce(a.ev_ebitda,1)>0 and coalesce(a.fcf_yield,0)>=0))),false)
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
DO $ddl$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='quant_us_finance_subtype_guard') THEN
  CREATE TRIGGER quant_us_finance_subtype_guard
  BEFORE UPDATE OF sector,industry,company_name ON quant_us.acoes
  FOR EACH ROW EXECUTE FUNCTION quant_us.score_v2_transacional();
 END IF;
END $ddl$;
-- Recalcular somente emissores com subtipo financeiro identificado, sem alterar outros setores.
SELECT public.quant_v2_recalcular_lote('BR',ARRAY(
 SELECT a.ticker FROM quant_br.acoes a WHERE a.ativa
 AND (public.quant_v2_score('BR',to_jsonb(a))->>'setor_financeiro_confirmado')='true'
 ORDER BY ticker LIMIT 250
));
SELECT public.quant_v2_recalcular_lote('US',ARRAY(
 SELECT a.ticker FROM quant_us.acoes a WHERE a.active
 AND (public.quant_v2_score('US',to_jsonb(a))->>'setor_financeiro_confirmado')='true'
 ORDER BY ticker LIMIT 250
));
-- Atualização pontual de dois snapshots públicos (sem polling).
SELECT public.quant_v2_snapshot_refresh('BR');
SELECT public.quant_v2_snapshot_refresh('US');
