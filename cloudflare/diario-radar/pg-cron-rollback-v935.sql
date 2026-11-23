-- Corte do agendador v935: altera exclusivamente o estado de 16 jobs conhecidos.
-- Nunca executa DROP, TRUNCATE, DELETE ou consultas a Logs/Analytics.
-- Aplicar somente após preflight Cloudflare com HTTP 200 e Worker disponível.
DO $$
DECLARE
  alvo text[] := ARRAY[
      'calendario-push-v724',
      'email-semana',
      'insiders',
      'jornal-mesa',
      'jornal-mesa-retentativa',
      'jornal-mesa-retentativa-2',
      'movimentos',
      'movimentos-limpa',
      'noticias-urgentes-leve-v727',
      'notificar-leve-v724',
      'push-log-limpa',
      'resumo-tick',
      'rotina-almoco',
      'rotina-fechamento',
      'rotina-matinal',
      'rotina-tarde'
  ];
  encontrado integer;
  r record;
BEGIN
  SELECT count(*) INTO encontrado FROM cron.job WHERE jobname=ANY(alvo);
  IF encontrado<>16 THEN RAISE EXCEPTION 'Corte cancelado: esperado 16 jobs, existem %', encontrado; END IF;
  FOR r IN SELECT jobid FROM cron.job WHERE jobname=ANY(alvo) ORDER BY jobname LOOP
    PERFORM cron.alter_job(r.jobid, active=>true);
  END LOOP;
END;
$$;
-- Confirmar estado das 16 linhas (sem consultar dados ou logs).
SELECT jobname, active FROM cron.job WHERE jobname=ANY(ARRAY['calendario-push-v724','email-semana','insiders','jornal-mesa','jornal-mesa-retentativa','jornal-mesa-retentativa-2','movimentos','movimentos-limpa','noticias-urgentes-leve-v727','notificar-leve-v724','push-log-limpa','resumo-tick','rotina-almoco','rotina-fechamento','rotina-matinal','rotina-tarde']) ORDER BY jobname;
