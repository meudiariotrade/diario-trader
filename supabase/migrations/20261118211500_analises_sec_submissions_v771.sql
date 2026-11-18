-- v771: registrar estado documental sem confundir ausência de protocolo com dispensa.
-- Não altera carteira, operações, cotações, scores nem layout.
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS documento_rastreio_status text;
ALTER TABLE quant_br.acoes ADD COLUMN IF NOT EXISTS documento_rastreio_motivo text;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS documento_rastreio_status text;
ALTER TABLE quant_us.acoes ADD COLUMN IF NOT EXISTS documento_rastreio_motivo text;

-- Units vinculam-se às demonstrações do emissor, NÃO são automaticamente dispensadas.
-- Classificar a pendência sem fabricar protocolo oficial.
UPDATE quant_br.acoes SET
 documento_rastreio_status=CASE
  WHEN tipo_ativo IN ('bdr','etf') THEN 'nao_aplicavel_ao_emissor_b3'
  WHEN tipo_ativo='unit' OR ticker~'11$' THEN 'pendente_documento_do_emissor'
  ELSE 'pendente_protocolo_cvm' END,
 documento_rastreio_motivo=CASE
  WHEN tipo_ativo IN ('bdr','etf') THEN 'Instrumento classificado como BDR/ETF: conferir documentos do emissor/administrador no regulador próprio'
  WHEN tipo_ativo='unit' OR ticker~'11$' THEN 'Unit não dispensa ITR/DFP do emissor; exige documento CVM por CNPJ/protocolo'
  ELSE 'Emissor de ações elegível sem ID/documento CVM comprovado; aguardar correspondência por CNPJ' END
WHERE ativa AND ativo_elegivel
 AND (documento_balanco_id IS NULL OR documento_balanco_tipo IS NULL OR documento_balanco_url IS NULL OR documento_balanco_publicado_em IS NULL);

UPDATE quant_us.acoes SET documento_rastreio_status='pendente_submissions_sec',
 documento_rastreio_motivo='CIK válido; documento ainda não comprovado por SEC Submissions'
WHERE active AND ativo_elegivel AND cik~'^[0-9]{10}$'
 AND (documento_balanco_id IS NULL OR documento_balanco_tipo IS NULL OR documento_balanco_url IS NULL OR documento_balanco_publicado_em IS NULL);

CREATE OR REPLACE FUNCTION public.quant_sec_docs_pendentes(p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb)
FROM (
 SELECT x.cik,x.ticker FROM (
  SELECT DISTINCT ON (a.cik) a.cik,a.ticker,a.market_cap_usd
  FROM quant_us.acoes a
  WHERE a.active AND a.ativo_elegivel AND a.cik~'^[0-9]{10}$'
   AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
     OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL)
   AND (a.sec_sem_periodo_consultado_em IS NULL OR a.sec_sem_periodo_consultado_em<now()-interval '7 days')
  ORDER BY a.cik,a.market_cap_usd DESC NULLS LAST,a.ticker
 ) x ORDER BY x.market_cap_usd DESC NULLS LAST,x.ticker
 LIMIT least(24,greatest(1,coalesce(p_limit,20)))
)t;
$fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_pendentes(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_pendentes(integer) TO service_role;

-- Atualiza até 24 emissores por transação, sem fetch por ticker no banco.
-- Um CIK serve todas as classes de ação do mesmo emissor; nunca sobrescrever prova mais nova.
CREATE OR REPLACE FUNCTION public.quant_sec_docs_bulk_upsert(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>24
 THEN RAISE EXCEPTION 'Lote SEC inválido'; END IF;
 UPDATE quant_us.acoes a SET
  data_competencia_balanco=x.competencia,
  documento_balanco_tipo=x.formulario,
  documento_balanco_id=x.documento_id,
  documento_balanco_url=x.documento_url,
  documento_balanco_publicado_em=x.publicado_em,
  documento_rastreio_status='comprovado_sec_submissions',
  documento_rastreio_motivo='Protocolo SEC oficial e competência verificáveis; não homologa fundamentos XBRL',
  updated_at=now()
 FROM jsonb_to_recordset(p_rows) x(
  cik text,competencia date,formulario text,documento_id text,
  documento_url text,publicado_em date)
 WHERE a.cik=x.cik AND a.active AND a.ativo_elegivel
  AND x.cik~'^[0-9]{10}$'
  AND x.formulario IN ('10-K','10-Q','10-K/A','10-Q/A','20-F','40-F','20-F/A','40-F/A')
  AND x.documento_id~'^[0-9]{10}-[0-9]{2}-[0-9]{6}$'
  AND x.documento_url LIKE 'https://www.sec.gov/Archives/edgar/data/%'
  AND x.competencia BETWEEN '2019-01-01'::date AND current_date
  AND x.publicado_em BETWEEN x.competencia AND current_date
  AND (a.data_competencia_balanco IS NULL OR a.data_competencia_balanco<=x.competencia)
  AND (a.documento_balanco_id IS DISTINCT FROM x.documento_id
   OR a.documento_rastreio_status IS DISTINCT FROM 'comprovado_sec_submissions');
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_bulk_upsert(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_bulk_upsert(jsonb) TO service_role;

-- Cooldown por CIK sem prova oficial; não cria status 'comprovado' em qualquer falha.
CREATE OR REPLACE FUNCTION public.quant_sec_docs_sem_prova(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE n integer:=0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>24
 THEN RAISE EXCEPTION 'Lote sem prova inválido'; END IF;
 UPDATE quant_us.acoes a SET
  sec_sem_periodo_consultado_em=now(),
  documento_rastreio_status='sem_formulario_validado',
  documento_rastreio_motivo=left(coalesce(x.motivo,'SEC sem formulário verificável'),180)
 FROM jsonb_to_recordset(p_rows) x(cik text,motivo text)
 WHERE a.cik=x.cik AND a.active AND a.ativo_elegivel
  AND x.cik~'^[0-9]{10}$'
  AND (a.documento_balanco_id IS NULL OR a.documento_balanco_tipo IS NULL
    OR a.documento_balanco_url IS NULL OR a.documento_balanco_publicado_em IS NULL);
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $fn$;
REVOKE ALL ON FUNCTION public.quant_sec_docs_sem_prova(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_sec_docs_sem_prova(jsonb) TO service_role;
