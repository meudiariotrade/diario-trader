-- v729: monitor de notícias de maior impacto. Atualiza o job EXISTENTE,
-- sem criar um segundo agendamento e sem religar o tick pesado.
-- A cada 2 min no pregão (09h-17h59 de Brasília), a cada 10 min fora dele.
-- A Edge Function primeiro verifica se há usuários com Push de urgentes ativado.
select cron.schedule(
  'noticias-urgentes-leve-v727',
  '*/2 * * * *',
  $job$
    select net.http_post(
      url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/notificar',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'diario_agendamento_v724' limit 1
        )
      ),
      body := '{"acao":"noticias_urgentes"}'::jsonb,
      timeout_milliseconds := 30000
    )
    where extract(minute from now() at time zone 'America/Sao_Paulo')::int %
      (case
        when extract(isodow from now() at time zone 'America/Sao_Paulo') between 1 and 5
         and extract(hour from now() at time zone 'America/Sao_Paulo') between 9 and 17
          then 2
        else 10
      end) = 0;
  $job$
);
