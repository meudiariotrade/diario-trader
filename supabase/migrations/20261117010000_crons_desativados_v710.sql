-- v710: não executar chamadas antes de configurar os secrets e validar Auth/migração de dados.
do $$
declare item record;
begin
 for item in select jobid from cron.job where jobname in
 ('rotina-almoco','rotina-fechamento','rotina-matinal','rotina-tarde') and active
 loop
  perform cron.alter_job(item.jobid,active := false);
 end loop;
end $$;
