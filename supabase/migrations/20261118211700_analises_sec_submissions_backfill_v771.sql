-- v771: backfill documental finito e cadenciado, sem polling de mercado.
-- Uma invocação a cada dois minutos (até 16 CIKs distintos), encerrada quando a fila esvaziar.
CREATE OR REPLACE FUNCTION public.quant_sec_docs_parar_backfill(p_force boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE pending_exists boolean;
BEGIN
 SELECT EXISTS(
  SELECT 1 FROM quant_us.acoes a
  WHERE a.active AND a.ativo_elegivel AND a.cik~'^[0-9]{10}$'
   AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
      OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL)
   AND (a.sec_sem_periodo_consultado_em IS NULL OR a.sec_sem_periodo_consultado_em<now()-interval '7 days')
 ) INTO pending_exists;
 IF NOT p_force AND pending_exists THEN RETURN false;END IF;
 PERFORM cron.unschedule('screeners-sec-submissions-v771');
 RETURN true;
 EXCEPTION WHEN undefined_object THEN RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_parar_backfill(boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_parar_backfill(boolean) TO service_role;

-- A chave permanece na RPC do servidor: nunca colocá-la no código da Cloudflare ou GitHub.
SELECT cron.schedule('screeners-sec-submissions-v771','*/2 * * * *',$cron$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sec-docs',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"coletar","limite":16}'::jsonb,
  timeout_milliseconds := 110000
 );
$cron$);
