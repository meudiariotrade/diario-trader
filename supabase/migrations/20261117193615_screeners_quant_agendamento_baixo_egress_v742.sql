-- Apenas duas execucoes diarias, sem leitura continua ou Realtime.
do $jobs$
begin
 if not exists(select 1 from cron.job where jobname='screeners-catalogo-v742') then
  perform cron.schedule('screeners-catalogo-v742','15 9 * * 1-5',
   $cmd$select net.http_post(
      url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
      headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
      body := '{"acao":"catalogo"}'::jsonb,timeout_milliseconds := 125000);$cmd$);
 end if;
 if not exists(select 1 from cron.job where jobname='screeners-enriquecer-v742') then
  perform cron.schedule('screeners-enriquecer-v742','45 23 * * 1-5',
   $cmd$select net.http_post(
      url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
      headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
      body := '{"acao":"enriquecer"}'::jsonb,timeout_milliseconds := 125000);$cmd$);
 end if;
end;$jobs$;