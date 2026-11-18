-- v772: retentativas SEC com cadência adaptativa e vínculo CVM por CNPJ oficial.
-- Sem tabelas de logs, sem polling de mercado e sem alterar registros pessoais.
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS sec_proxima_tentativa_em timestamptz;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS sec_falhas_consecutivas integer NOT NULL DEFAULT 0;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS emissor_cnpj text;

-- O mesmo CIK representa classes distintas; pendências em cooldown não desaparecem do universo.
CREATE OR REPLACE FUNCTION public.quant_sec_docs_pendentes(p_limit integer DEFAULT 16)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM (
  SELECT z.cik,z.ticker FROM (
   SELECT DISTINCT ON (a.cik) a.cik,a.ticker,a.market_cap_usd
   FROM quant_us.acoes a
   WHERE a.active AND a.ativo_elegivel AND a.cik~'^[0-9]{10}$'
    AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
      OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL)
    AND (a.sec_sem_periodo_consultado_em IS NULL
      OR a.sec_sem_periodo_consultado_em<now()-interval '7 days')
    AND (a.sec_proxima_tentativa_em IS NULL OR a.sec_proxima_tentativa_em<=now())
   ORDER BY a.cik,a.market_cap_usd DESC NULLS LAST,a.ticker
  )z ORDER BY z.market_cap_usd DESC NULLS LAST,z.ticker
  LIMIT least(16,greatest(1,coalesce(p_limit,16)))
 )r;
$fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_pendentes(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_pendentes(integer) TO service_role;

-- HTTP inesperado não causa loop infinito no mesmo CIK: backoff 30m, 1h ... 24h.
CREATE OR REPLACE FUNCTION public.quant_sec_docs_retry_patch(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>16
 THEN RAISE EXCEPTION 'Lote de retentativa SEC inválido'; END IF;
 UPDATE quant_us.acoes a SET
  sec_falhas_consecutivas=least(12,greatest(0,a.sec_falhas_consecutivas)+1),
  sec_proxima_tentativa_em=now()+make_interval(
   mins=>least(1440,30*power(2,least(6,greatest(0,a.sec_falhas_consecutivas))))::integer),
  documento_rastreio_status='retry_sec_documento',
  documento_rastreio_motivo=left(coalesce(x.motivo,'Falha SEC transitória; nova tentativa cadenciada'),180)
 FROM jsonb_to_recordset(p_rows)x(cik text,motivo text)
 WHERE a.active AND a.ativo_elegivel AND a.cik=x.cik AND x.cik~'^[0-9]{10}$'
 AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
 OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL);
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_retry_patch(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_retry_patch(jsonb) TO service_role;

-- Escalonamento automático: lotes rápidos enquanto há trabalho, revisão diária durante cooldown,
-- encerrar se não restou nenhuma pendência, sem deixar cron de 2 minutos ocioso para sempre.
CREATE OR REPLACE FUNCTION public.quant_sec_docs_cadencia(p_bloqueio boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE unresolved boolean;ready boolean;current_schedule text;new_schedule text;
cmd text:=$command$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sec-docs',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"coletar","limite":16}'::jsonb,
  timeout_milliseconds := 110000
 );
$command$;
BEGIN
 SELECT EXISTS(SELECT 1 FROM quant_us.acoes a WHERE a.active AND a.ativo_elegivel
  AND a.cik~'^[0-9]{10}$' AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
  OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL)) INTO unresolved;
 IF NOT unresolved THEN
  IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='screeners-sec-submissions-v771') THEN
   PERFORM cron.unschedule('screeners-sec-submissions-v771');
  END IF;
  RETURN 'concluido';
 END IF;
 SELECT EXISTS(SELECT 1 FROM quant_us.acoes a WHERE a.active AND a.ativo_elegivel
  AND a.cik~'^[0-9]{10}$' AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
  OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL)
  AND (a.sec_sem_periodo_consultado_em IS NULL OR a.sec_sem_periodo_consultado_em<now()-interval '7 days')
  AND (a.sec_proxima_tentativa_em IS NULL OR a.sec_proxima_tentativa_em<=now())) INTO ready;
 new_schedule:=CASE WHEN p_bloqueio OR NOT ready THEN '17 6 * * *' ELSE '*/2 * * * *' END;
 SELECT j.schedule INTO current_schedule FROM cron.job j WHERE j.jobname='screeners-sec-submissions-v771';
 IF current_schedule IS DISTINCT FROM new_schedule THEN
  PERFORM cron.schedule('screeners-sec-submissions-v771',new_schedule,cmd);
 END IF;
 RETURN CASE WHEN new_schedule='17 6 * * *' THEN 'revisao_diaria' ELSE 'backfill_rapido' END;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_cadencia(boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_cadencia(boolean) TO service_role;

-- Não supor Unit/BDR: associação CVM exige documento oficial e CNPJ de 14 dígitos.
CREATE OR REPLACE FUNCTION public.quant_cvm_pendentes(p_limit integer DEFAULT 24)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (
 SELECT ticker,empresa FROM quant_br.acoes
 WHERE ativa AND ativo_elegivel
 AND (documento_balanco_id IS NULL OR documento_balanco_tipo IS NULL
 OR documento_balanco_url IS NULL OR documento_balanco_publicado_em IS NULL)
 ORDER BY ticker LIMIT least(24,greatest(1,coalesce(p_limit,24)))
)t;
$fn$;
REVOKE ALL ON FUNCTION public.quant_cvm_pendentes(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_cvm_pendentes(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.quant_cvm_documentos_bulk(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>24
 THEN RAISE EXCEPTION 'Lote CVM inválido'; END IF;
 UPDATE quant_br.acoes a SET emissor_cnpj=x.cnpj,
  data_competencia_balanco=x.competencia,
  documento_balanco_tipo=x.formulario,
  documento_balanco_id=x.documento_id,
  documento_balanco_url=x.documento_url,
  documento_balanco_publicado_em=x.publicado_em,
  documento_rastreio_status='comprovado_cvm_cnpj',
  documento_rastreio_motivo='Emissor identificado por CNPJ único no cadastro oficial CVM; documento ITR/DFP validado',
  linhagem_indicadores=CASE WHEN coalesce(x.linhagem,'{}'::jsonb)<>'{}'::jsonb
   THEN coalesce(a.linhagem_indicadores,'{}'::jsonb)||x.linhagem
   ELSE coalesce(a.linhagem_indicadores,'{}'::jsonb) END,
  updated_at=now()
 FROM jsonb_to_recordset(p_rows)x(ticker text,cnpj text,competencia date,formulario text,
   documento_id text,documento_url text,publicado_em date,linhagem jsonb)
 WHERE a.ticker=upper(btrim(x.ticker)) AND a.ativa AND a.ativo_elegivel
  AND x.cnpj~'^[0-9]{14}$' AND x.formulario IN('ITR','DFP')
  AND x.documento_id~'^[0-9]{1,18}$'
  AND x.documento_url LIKE 'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/%'
  AND x.competencia BETWEEN '2019-01-01'::date AND current_date
  AND x.publicado_em BETWEEN x.competencia AND current_date
  AND (a.data_competencia_balanco IS NULL OR a.data_competencia_balanco<=x.competencia)
  AND (a.emissor_cnpj IS NULL OR a.emissor_cnpj=x.cnpj);
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_cvm_documentos_bulk(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_cvm_documentos_bulk(jsonb) TO service_role;
