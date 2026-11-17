-- Backfill e atualização BR/EUA em pequenos lotes (sem polling nem Realtime).
-- O processamento ocorre fora do PostgreSQL; no Supabase persistem apenas indicadores.
do $jobs$
begin
 if not exists (select 1 from cron.job where jobname='screeners-fundamentos-us-v743') then
 perform cron.schedule('screeners-fundamentos-us-v743','15 1,7,13,19 * * 1-5',
  $cmd$select net.http_post(
    url:='https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
    body:='{"acao":"fundamentos","mercado":"US","limite":200}'::jsonb,
    timeout_milliseconds:=100000
  );$cmd$);
 end if;
 if not exists (select 1 from cron.job where jobname='screeners-fundamentos-br-v743') then
 perform cron.schedule('screeners-fundamentos-br-v743','5 22 * * 1-5',
  $cmd$select net.http_post(
    url:='https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
    body:='{"acao":"fundamentos","mercado":"BR","limite":200}'::jsonb,
    timeout_milliseconds:=100000
  );$cmd$);
 end if;
 if not exists (select 1 from cron.job where jobname='screeners-mapear-cik-v743') then
 perform cron.schedule('screeners-mapear-cik-v743','30 10 * * 1',
  $cmd$select net.http_post(
    url:='https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sec',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
    body:='{"acao":"mapear"}'::jsonb,
    timeout_milliseconds:=100000
  );$cmd$);
 end if;
end;$jobs$;