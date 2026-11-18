-- v773: XBRL apenas onde houver documento SEC comprovado e ainda falte evidência contábil.
-- Inventário público pequeno, sem motor de cálculo no PostgreSQL ou leitura de logs.
CREATE OR REPLACE FUNCTION public.quant_sec_xbrl_pendentes(p_limit integer DEFAULT 10)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (
  SELECT x.ticker,x.cik FROM (
   SELECT DISTINCT ON (a.cik) a.ticker,a.cik,a.market_cap_usd
   FROM quant_us.acoes a
   WHERE a.active AND a.ativo_elegivel AND a.cik~'^[0-9]{10}$'
    AND a.documento_balanco_id~'^[0-9]{10}-[0-9]{2}-[0-9]{6}$'
    AND (a.sec_facts_at IS NULL OR a.sec_facts_at<a.data_competencia_balanco)
    AND (a.sec_sem_periodo_consultado_em IS NULL
      OR a.sec_sem_periodo_consultado_em<now()-interval '7 days')
   ORDER BY a.cik,a.market_cap_usd DESC NULLS LAST,a.ticker
  )x ORDER BY x.market_cap_usd DESC NULLS LAST,x.ticker
  LIMIT least(12,greatest(1,coalesce(p_limit,10)))
 )t;
$fn$;
REVOKE ALL ON FUNCTION public.quant_sec_xbrl_pendentes(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_xbrl_pendentes(integer) TO service_role;

-- Monitorar qualidade sem confundir existência de score (TradingView etc.) com prova XBRL.
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS fundamentos_prova_status text;
UPDATE quant_us.acoes SET fundamentos_prova_status=CASE
 WHEN coalesce(linhagem_indicadores,'{}'::jsonb)<>'{}'::jsonb THEN 'xbrl_parcial_com_linhagem'
 WHEN sec_facts_at IS NOT NULL THEN 'xbrl_presente_sem_linhagem'
 ELSE 'sem_prova_xbrl'
END
WHERE active AND ativo_elegivel AND fundamentos_prova_status IS NULL;

-- Uma rodada XBRL adicional diária, somente dados empresariais públicos.
-- Os seis crons antigos passam a receber apenas resposta compactada da Cloudflare
-- depois da publicação do Worker e da função v773.
SELECT cron.schedule('screeners-sec-xbrl-v773','35 21 * * 1-5',$cron$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_xbrl","limite":10}'::jsonb,
  timeout_milliseconds := 30000
 );
$cron$);
