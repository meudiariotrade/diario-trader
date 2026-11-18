
-- v763: score US deterministico na mesma transacao e prova documental separada da coleta.
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS documento_balanco_tipo text;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS documento_balanco_id text;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS documento_balanco_url text;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS documento_balanco_publicado_em date;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS linhagem_indicadores jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS documento_balanco_tipo text;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS documento_balanco_id text;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS documento_balanco_url text;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS documento_balanco_publicado_em date;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS linhagem_indicadores jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION quant_us.score_v2_transacional()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
DECLARE s jsonb;
BEGIN
  s:=public.quant_v2_score('US',to_jsonb(NEW));
  NEW.score_quant_us:=(s->>'total')::numeric;
  NEW.score_qualidade:=(s->>'qualidade')::numeric;
  NEW.score_valuation:=(s->>'valuation')::numeric;
  NEW.score_dividendos:=(s->>'dividendos')::numeric;
  NEW.score_momentum:=(s->>'momentum')::numeric;
  NEW.score_model_version:='us_v2.0';
  RETURN NEW;
END $fn$;
DO $do$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='quant_us.acoes'::regclass AND tgname='quant_us_score_v2_guard') THEN
  CREATE TRIGGER quant_us_score_v2_guard
  BEFORE INSERT OR UPDATE OF roic,roe,fcf_margin,eps_growth_yoy,revenue_growth_yoy,forward_pe,peg_ratio,ev_fcf,dividend_yield,payout_implicito,momentum_12_1,dist_mm200_pct,score_quant_us
  ON quant_us.acoes FOR EACH ROW EXECUTE FUNCTION quant_us.score_v2_transacional();
 END IF;
END $do$;
-- Reconcilia apenas linhas com pontuacao calculavel e diferenca maior que 0,1.
UPDATE quant_us.acoes a
SET score_quant_us=a.score_quant_us
WHERE a.score_quant_us IS NOT NULL
 AND (public.quant_v2_score('US',to_jsonb(a))->>'total') IS NOT NULL
 AND abs(a.score_quant_us-(public.quant_v2_score('US',to_jsonb(a))->>'total')::numeric)>0.1;

-- Patch restrito: nunca confundir companyfacts/coleta com documento SEC ou CVM.
CREATE OR REPLACE FUNCTION public.quant_screeners_documento_patch(p_market text,p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF p_market NOT IN('US','BR') OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>12
 THEN RAISE EXCEPTION 'Lote documental invalido'; END IF;
 IF p_market='US' THEN
  UPDATE quant_us.acoes a SET
   data_competencia_balanco=x.competencia,
   documento_balanco_tipo=x.formulario,
   documento_balanco_id=x.documento_id,
   documento_balanco_url=x.documento_url,
   documento_balanco_publicado_em=x.publicado_em,
   linhagem_indicadores=coalesce(x.linhagem,'{}'::jsonb),
   updated_at=now()
  FROM jsonb_to_recordset(p_rows) x(
   ticker text,cik text,competencia date,formulario text,documento_id text,
   documento_url text,publicado_em date,linhagem jsonb)
  WHERE a.ticker=upper(btrim(x.ticker)) AND a.cik=x.cik AND x.cik~'^[0-9]{10}$'
    AND x.formulario IN('10-K','10-Q','10-K/A','10-Q/A','20-F','40-F')
    AND x.documento_id~'^[0-9]{10}-[0-9]{2}-[0-9]{6}$'
    AND x.documento_url LIKE 'https://www.sec.gov/Archives/edgar/data/%'
    AND x.competencia BETWEEN '2019-01-01'::date AND current_date
    AND x.publicado_em BETWEEN x.competencia AND current_date
    AND (a.data_competencia_balanco IS NULL OR a.data_competencia_balanco<=x.competencia);
 ELSE
  UPDATE quant_br.acoes a SET
   data_competencia_balanco=x.competencia,
   documento_balanco_tipo=x.formulario,
   documento_balanco_id=x.documento_id,
   documento_balanco_url=x.documento_url,
   documento_balanco_publicado_em=x.publicado_em,
   linhagem_indicadores=coalesce(x.linhagem,'{}'::jsonb),
   updated_at=now()
  FROM jsonb_to_recordset(p_rows) x(
   ticker text,competencia date,formulario text,documento_id text,
   documento_url text,publicado_em date,linhagem jsonb)
  WHERE a.ticker=upper(btrim(x.ticker))
    AND x.formulario IN('ITR','DFP')
    AND x.documento_id~'^[0-9]{1,18}$'
    AND (x.documento_url LIKE 'https://dados.cvm.gov.br/%' OR x.documento_url LIKE 'https://www.rad.cvm.gov.br/%')
    AND x.competencia BETWEEN '2019-01-01'::date AND current_date
    AND x.publicado_em BETWEEN x.competencia AND current_date
    AND (a.data_competencia_balanco IS NULL OR a.data_competencia_balanco<=x.competencia);
 END IF;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_screeners_documento_patch(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_screeners_documento_patch(text,jsonb) TO service_role;

