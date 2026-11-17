-- No maximo 20 empresas em cada execucao, 6 vezes por dia util.
-- Sem download de historicos ou streaming pelo Supabase.
do $jobs$
begin
 if not exists(select 1 from cron.job where jobname='screeners-finnhub-v743') then
 perform cron.schedule('screeners-finnhub-v743','5 0,4,8,12,16,20 * * 1-5',
  $cmd$select net.http_post(
   url:='https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-finnhub',
   headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
   body:='{}'::jsonb,timeout_milliseconds:=110000
  );$cmd$);
 end if;
end;$jobs$;