-- v772: conferência CVM semanal depois do espelho oficial GitHub Actions,
-- sem downloads volumosos pelo Postgres; credencial do cron permanece no servidor.
SELECT cron.schedule('screeners-cvm-cnpj-v772','15 8 * * 6',$cron$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-cvm-docs',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"reconciliar"}'::jsonb,
  timeout_milliseconds := 30000
 );
$cron$);
