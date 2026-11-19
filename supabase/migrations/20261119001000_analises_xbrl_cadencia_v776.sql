-- v776 — SEC/XBRL somente em lotes pequenos, com cooldown persistente por CIK.
-- 4 execuções diárias em dias úteis, no máximo 12 emissores por rodada.
-- A Cloudflare responde do cache público; nenhum arquivo pesado passa pelo banco.
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS sec_xbrl_proxima_tentativa_em timestamptz;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS sec_xbrl_falhas integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.quant_sec_xbrl_pendentes(p_limit integer DEFAULT 10)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb)
 FROM (
  SELECT x.ticker,x.cik
  FROM (
   SELECT DISTINCT ON (a.cik) a.ticker,a.cik,a.market_cap_usd
   FROM quant_us.acoes a
   WHERE a.active AND a.ativo_elegivel
    AND a.cik~'^[0-9]{10}$'
    AND a.documento_balanco_id~'^[0-9]{10}-[0-9]{2}-[0-9]{6}$'
    AND (a.sec_facts_at IS NULL OR a.sec_facts_at<a.data_competencia_balanco)
    AND (a.sec_xbrl_proxima_tentativa_em IS NULL OR a.sec_xbrl_proxima_tentativa_em<=now())
    AND (a.sec_sem_periodo_consultado_em IS NULL OR a.sec_sem_periodo_consultado_em<now()-interval '7 days')
   ORDER BY a.cik,a.market_cap_usd DESC NULLS LAST,a.ticker
  )x
  ORDER BY x.market_cap_usd DESC NULLS LAST,x.ticker
  LIMIT least(12,greatest(1,coalesce(p_limit,10)))
 )t;
$fn$;
REVOKE ALL ON FUNCTION public.quant_sec_xbrl_pendentes(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_xbrl_pendentes(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.quant_sec_xbrl_retry_batch(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>12
 THEN RAISE EXCEPTION 'Lote retry XBRL inválido'; END IF;
 UPDATE quant_us.acoes a SET
  sec_xbrl_falhas=least(12,a.sec_xbrl_falhas+1),
  sec_xbrl_proxima_tentativa_em=now()+make_interval(hours=>least(168,12*power(2,least(4,a.sec_xbrl_falhas)))::integer),
  fundamentos_prova_status='xbrl_aguardando_fonte'
 FROM jsonb_to_recordset(p_rows)x(cik text,motivo text)
 WHERE a.active AND a.ativo_elegivel AND a.cik=x.cik
  AND x.cik~'^[0-9]{10}$'
  AND (a.sec_facts_at IS NULL OR a.sec_facts_at<a.data_competencia_balanco);
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_xbrl_retry_batch(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_xbrl_retry_batch(jsonb) TO service_role;

-- Sucesso real limpa cooldown, sem atribuir comprovação a métricas ausentes.
CREATE OR REPLACE FUNCTION public.quant_sec_xbrl_status_bulk(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>16
 THEN RAISE EXCEPTION 'Lote XBRL inválido'; END IF;
 UPDATE quant_us.acoes a SET
  fundamentos_prova_status=CASE WHEN x.metricas_validas THEN 'xbrl_parcial_com_metrica'
    ELSE 'xbrl_presente_sem_metrica' END,
  sec_xbrl_proxima_tentativa_em=NULL,sec_xbrl_falhas=0
 FROM jsonb_to_recordset(p_rows)x(ticker text,cik text,metricas_validas boolean)
 WHERE a.active AND a.ativo_elegivel AND a.ticker=upper(btrim(x.ticker))
  AND a.cik=x.cik AND x.cik~'^[0-9]{10}$' AND a.sec_facts_at IS NOT NULL;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_xbrl_status_bulk(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_xbrl_status_bulk(jsonb) TO service_role;

-- 48 CIK/dia útil no máximo; o banco nunca busca companyfacts diretamente.
SELECT cron.schedule('screeners-sec-xbrl-v773','15 1,7,13,19 * * 1-5',$cron$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_xbrl","limite":12}'::jsonb,
  timeout_milliseconds := 30000
 );
$cron$);
