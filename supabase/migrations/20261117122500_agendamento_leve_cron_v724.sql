-- v724: pg_cron executa somente caminhos leves com credencial armazenada no Vault.
-- O antigo notificar-tick e os outros crons custosos continuam desativados.
select cron.schedule(
  'notificar-leve-v724',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/notificar',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret
                          from vault.decrypted_secrets
                          where name = 'diario_agendamento_v724' limit 1)
      ),
      body := '{"acao":"tick_leve"}'::jsonb,
      timeout_milliseconds := 20000
    );
  $job$
);

-- Calendário atualizado no máximo 12 vezes ao dia, sem gerar Jornal ou relatórios.
select cron.schedule(
  'calendario-push-v724',
  '17 */2 * * *',
  $job$
    select net.http_post(
      url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/notificar',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret
                          from vault.decrypted_secrets
                          where name = 'diario_agendamento_v724' limit 1)
      ),
      body := '{"acao":"atualizar_calendario"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $job$
);
