
-- v763: backfill oficial em lotes pequenos. Somente x-cron-secret obtido no servidor.
select cron.schedule('screeners-sec-documentos-v763','45 3 * * 1-5',$cron$
 select net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_top","limite":12}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);
select cron.schedule('screeners-cvm-documentos-v763','30 5 * * 6',$cron$
 select net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"cvm"}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);
