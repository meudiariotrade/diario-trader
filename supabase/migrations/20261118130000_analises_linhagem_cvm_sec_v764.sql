-- v764: prova por conta CVM nao se confunde com indicador TTM; preservar provas de um mesmo documento.
-- Falhas SEC sem periodo entram em cooldown; nao consomem o mesmo slot diario por 7 dias.
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS sec_sem_periodo_consultado_em timestamptz;

CREATE OR REPLACE FUNCTION public.quant_screeners_sec_tentativa_patch(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>16
 THEN RAISE EXCEPTION 'Lote SEC invalido'; END IF;
 UPDATE quant_us.acoes a
 SET sec_sem_periodo_consultado_em=now(), updated_at=now()
 FROM jsonb_to_recordset(p_rows) x(ticker text,cik text)
 WHERE a.ticker=upper(btrim(x.ticker)) AND a.cik=x.cik
  AND x.cik~'^[0-9]{10}$' AND a.data_competencia_balanco IS NULL;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_screeners_sec_tentativa_patch(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_screeners_sec_tentativa_patch(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.quant_screeners_sec_top(p_limit integer DEFAULT 12)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb)
FROM (
 SELECT ticker,cik,score_quant_us,market_cap_usd
 FROM quant_us.acoes
 WHERE ativo_elegivel AND cik~'^[0-9]{10}$'
  AND data_competencia_balanco IS NULL
  AND (sec_sem_periodo_consultado_em IS NULL OR sec_sem_periodo_consultado_em<now()-interval '7 days')
 ORDER BY score_quant_us DESC NULLS LAST,market_cap_usd DESC NULLS LAST,ticker
 LIMIT least(16,greatest(1,p_limit))
)x;
$fn$;
REVOKE ALL ON FUNCTION public.quant_screeners_sec_top(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_screeners_sec_top(integer) TO service_role;

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
   linhagem_indicadores=CASE
    WHEN a.documento_balanco_id=x.documento_id AND a.data_competencia_balanco=x.competencia
     THEN coalesce(a.linhagem_indicadores,'{}'::jsonb)||coalesce(x.linhagem,'{}'::jsonb)
    ELSE coalesce(x.linhagem,'{}'::jsonb)
   END,
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
   linhagem_indicadores=CASE
    WHEN a.documento_balanco_id=x.documento_id AND a.data_competencia_balanco=x.competencia
     THEN coalesce(a.linhagem_indicadores,'{}'::jsonb)||coalesce(x.linhagem,'{}'::jsonb)
    ELSE coalesce(x.linhagem,'{}'::jsonb)
   END,
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

