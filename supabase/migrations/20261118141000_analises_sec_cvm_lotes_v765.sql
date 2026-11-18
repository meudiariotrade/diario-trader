-- v765: backfill SEC repartido em quatro janelas UTC; limita 12 emissores por rodada.
-- Sem leitura em segundos, sem tokens em codigo-fonte, sem fluxos de Operacoes/Carteira.
select cron.schedule('screeners-sec-documentos-v765-manha','45 7 * * 1-5',$cron$
 select net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_top", "limite":12}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);

select cron.schedule('screeners-sec-documentos-v765-meiodia','45 11 * * 1-5',$cron$
 select net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_top", "limite":12}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);

select cron.schedule('screeners-sec-documentos-v765-tarde','45 15 * * 1-5',$cron$
 select net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_top", "limite":12}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);

-- Espelho CVM do GitHub roda sabado 04:45 UTC; aguardar ate 07:30 UTC para consumi-lo.
select cron.schedule('screeners-cvm-documentos-v763','30 7 * * 6',$cron$
 select net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"cvm"}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);
