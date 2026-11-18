-- v768: melhora comprovantes documentais já existentes sem homologar indicadores adicionais.
-- Não transfere históricos privados, não cria dados de mercado e não altera operações.
-- Identidade SEC: CIK 10 dígitos e accession XBRL já presente na linhagem do indicador.
UPDATE quant_br.acoes AS a
SET linhagem_indicadores=(
 SELECT coalesce(jsonb_object_agg(e.key,
  CASE WHEN jsonb_typeof(e.value)='object'
   AND e.value->>'documento_id'=a.documento_balanco_id
   AND e.value->>'competencia'=a.data_competencia_balanco::text
   THEN e.value||jsonb_build_object(
    'fonte','CVM','data_competencia_balanco',a.data_competencia_balanco::text,
    'url_referencia',a.documento_balanco_url,
    'tipo_url','pacote_CVM_ITR_DFP_identificado_por_protocolo')
   ELSE e.value END),'{}'::jsonb)
 FROM jsonb_each(a.linhagem_indicadores)e
)
WHERE a.linhagem_indicadores<>'{}'::jsonb
 AND a.documento_balanco_id IS NOT NULL
 AND a.documento_balanco_url LIKE 'https://dados.cvm.gov.br/%'
 AND a.data_competencia_balanco IS NOT NULL;

UPDATE quant_us.acoes AS a
SET linhagem_indicadores=(
 SELECT coalesce(jsonb_object_agg(e.key,
  CASE WHEN jsonb_typeof(e.value)='array' THEN (
   SELECT coalesce(jsonb_agg(
    CASE WHEN jsonb_typeof(v.value)='object'
      AND (v.value->>'documento_id')~'^[0-9]{10}-[0-9]{2}-[0-9]{6}$'
      AND (v.value->>'competencia')~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     THEN v.value||jsonb_build_object(
      'fonte','SEC EDGAR',
      'data_competencia_balanco',v.value->>'competencia',
      'url_referencia','https://www.sec.gov/Archives/edgar/data/'||
       ltrim(a.cik,'0')||'/'||replace(v.value->>'documento_id','-','')||'/')
     ELSE v.value END ORDER BY v.ord),'[]'::jsonb)
   FROM jsonb_array_elements(e.value) WITH ORDINALITY v(value,ord))
   ELSE e.value END),'{}'::jsonb)
 FROM jsonb_each(a.linhagem_indicadores)e
)
WHERE a.linhagem_indicadores<>'{}'::jsonb
 AND a.cik~'^[0-9]{10}$'
 AND a.documento_balanco_url LIKE 'https://www.sec.gov/Archives/%';

-- Duas janelas adicionais, estritamente no pregão semanal, 12 ativos por rodada.
-- Worker existente já impõe 180 ms entre requisições SEC e interrompe o lote em 403/429.
SELECT cron.schedule('screeners-sec-documentos-v768-intermediario','25 9 * * 1-5',$cron$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_top","limite":12}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);
SELECT cron.schedule('screeners-sec-documentos-v768-encerramento','25 18 * * 1-5',$cron$
 SELECT net.http_post(
  url := 'https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-sync',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',public.diario_agendamento_chave()),
  body := '{"acao":"sec_top","limite":12}'::jsonb,
  timeout_milliseconds := 15000
 );
$cron$);
