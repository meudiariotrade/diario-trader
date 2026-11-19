-- v775 — apagar apenas AGENDAMENTOS REDUNDANTES, NUNCA dados.
-- A API SEC/XBRL pública usa Cloudflare; a CVM grande migrou para GitHub Actions semanal.
-- Mantém a coleta SEC sec_top da v763 (1x/dia útil), SEC Submissions com cooldown,
-- XBRL v773 e CVM por CNPJ v772. Não toca nos crons de push/jornal/usuários.
DO $migration$
DECLARE job text;
BEGIN
 FOREACH job IN ARRAY ARRAY[
  'screeners-sec-documentos-v765-manha',
  'screeners-sec-documentos-v765-meiodia',
  'screeners-sec-documentos-v765-tarde',
  'screeners-sec-documentos-v768-intermediario',
  'screeners-sec-documentos-v768-encerramento',
  'screeners-cvm-documentos-v763'
 ] LOOP
  IF EXISTS(SELECT 1 FROM cron.job WHERE jobname=job) THEN
   PERFORM cron.unschedule(job);
  END IF;
 END LOOP;
END $migration$;

-- Exceções restantes são rastreadas como PENDÊNCIA, não como prova.
-- ASML/AEM/CCEP/ABEV requerem 20-F/40-F/CIK submetidos à SEC;
-- cooldown conserva lacunas reais quando a fonte bloqueia ou não fornece prova.
-- CEAB3/CLSC4/CMIG3/CMIG4/MDIA3/MLAS3 só recebem prova por CNPJ
-- explicitamente confirmado e protocolo CVM validado no Edge Function.
