-- v843 (autorizado pelo usuário em 20/11): religa as rotinas que ficaram desligadas desde a troca de projeto.
-- Aplicada no Supabase em 20/11. Fluxo por ação (fluxo-b3) segue desligado a pedido; aulas-fila-limpa também
-- (apagaria prints do Profit com mais de 30 dias).
-- 1) Jornal: nova tentativa 15 e 30 min depois (com edição pronta, a função devolve o cache).
do $$
declare cmd text := $c$SELECT net.http_post(
 url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/rotina-cron',
 headers := jsonb_build_object('Content-Type','application/json',
    'x-cron-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='diario_agendamento_v724' LIMIT 1)),
 body := '{"acao":"jornal_agendado"}'::jsonb,
 timeout_milliseconds := 120000);$c$;
begin
  if not exists (select 1 from cron.job where jobname='jornal-mesa-retentativa') then
    perform cron.schedule('jornal-mesa-retentativa','45 10,21 * * 1-5',cmd); end if;
  if not exists (select 1 from cron.job where jobname='jornal-mesa-retentativa-2') then
    perform cron.schedule('jornal-mesa-retentativa-2','0 11,22 * * 1-5',cmd); end if;
end $$;
-- 2) Radar: segredo lido do Vault (mesmo das outras rotinas) e religado.
do $$
declare j record; acao text;
begin
  for j in select jobid, jobname from cron.job where jobname in ('radar-varrer','radar-cripto') loop
    acao := case when j.jobname='radar-varrer' then 'varrer' else 'cripto' end;
    perform cron.alter_job(j.jobid,
      command := format($c$select net.http_post(
 url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/radar',
 headers := jsonb_build_object('Content-Type','application/json',
    'x-cron-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='diario_agendamento_v724' LIMIT 1)),
 body := '{"acao":"%s"}'::jsonb,
 timeout_milliseconds := 120000);$c$, acao),
      active := true);
  end loop;
end $$;
-- 3) Movimentos fortes: só em dia útil, no horário de mercado (09h–18h de Brasília), a cada 5 min.
select cron.alter_job((select jobid from cron.job where jobname='movimentos'), schedule := '*/5 12-21 * * 1-5', active := true);
-- 4) Limpezas diárias de dados temporários (avisos, sinais do radar e movimentos antigos).
select cron.alter_job(jobid, active := true) from cron.job where jobname in ('push-log-limpa','radar-limpa','movimentos-limpa');
