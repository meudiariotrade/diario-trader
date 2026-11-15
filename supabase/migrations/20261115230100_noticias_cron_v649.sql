-- v649: monitor isolado; mantém o 'notificar-tick' existente a cada minuto.
-- Cron UTC a cada 5 min; a função pula os ciclos fora da janela de 15 min quando as bolsas estão fechadas.
-- O segredo continua armazenado exclusivamente no Vault.
select cron.schedule(
  'noticias-urgentes-tick',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/notificar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name='diario_cron_secret')
    ),
    body := '{"acao":"noticias-tick"}'::jsonb,
    timeout_milliseconds := 45000
  ) where exists(select 1 from public.push_subs);
  $job$
);
