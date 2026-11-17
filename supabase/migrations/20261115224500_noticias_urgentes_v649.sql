-- v649 — monitor de notícias urgentes, independente do tick de notificações existente.
-- O cron executa a cada 5 minutos; a Edge Function reduz para 15 minutos
-- fora de 09h–18h de Brasília e nos fins de semana.
-- Nenhum segredo é salvo no GitHub. Web Push mantém o histórico em push_log (RLS).
do $v649$
begin
  if not exists (select 1 from vault.secrets where name = 'diario_cron_secret') then
    raise notice 'Segredo de cron não configurado: notícia urgente sem agendamento até validar serviço';
    return;
  end if;
  perform cron.schedule(
    'noticias-urgentes-tick',
    '*/5 * * * *',
    $cmd$
      select net.http_post(
        url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/notificar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'diario_cron_secret' limit 1)
        ),
        body := jsonb_build_object('acao', 'noticias_urgentes'),
        timeout_milliseconds := 60000
      )
      where exists (select 1 from public.push_subs where user_id is not null);
    $cmd$
  );
end
$v649$;
