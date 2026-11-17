-- v727: monitor de breaking news isolado do cron pesado de notificar, sem repetição de fontes
-- pg_cron roda a cada 5 minutos, mas só invoca a Edge a cada 15 fora do pregão.
-- Horários baseados em America/Sao_Paulo, para evitar diferença de UTC e horário de verão.
select cron.schedule(
  'noticias-urgentes-leve-v727',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/notificar',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-cron-secret',(
          select decrypted_secret from vault.decrypted_secrets
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
          then 5
        else 15
      end) = 0;
  $job$
);
