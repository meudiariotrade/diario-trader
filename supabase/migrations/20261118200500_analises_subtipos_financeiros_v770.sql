-- v770: corrigir subtipos bancários abreviados e emissores financeiros identificáveis.
-- Migração exclusivamente aditiva: não editar v769 já aplicada em produção.
-- Setor Finance isolado NUNCA basta; preservar REITs, imobiliárias, gestoras e corretoras.
-- Nenhuma alteração no app/PDF, nas carteiras ou nas operações.

CREATE OR REPLACE FUNCTION public.quant_v2_score(m text,r jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
DECLARE
 q numeric;v numeric;d numeric;mo numeric;tt numeric;dy numeric;pl numeric;pay numeric;
 fin boolean;model text;
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

-- Recalcular apenas emissores reconhecidos (máximo de 250 por mercado), sem polling.
SELECT public.quant_v2_recalcular_lote('BR',ARRAY(
 SELECT a.ticker FROM quant_br.acoes a WHERE a.ativa
 AND (public.quant_v2_score('BR',to_jsonb(a))->>'setor_financeiro_confirmado')='true'
 ORDER BY a.ticker LIMIT 250
));
SELECT public.quant_v2_recalcular_lote('US',ARRAY(
 SELECT a.ticker FROM quant_us.acoes a WHERE a.active
 AND (public.quant_v2_score('US',to_jsonb(a))->>'setor_financeiro_confirmado')='true'
 ORDER BY a.ticker LIMIT 250
));
-- Duas atualizações pontuais de cache público; sem leitura ou escrita em logs.
SELECT public.quant_v2_snapshot_refresh('BR');
SELECT public.quant_v2_snapshot_refresh('US');
