const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const sync=fs.readFileSync('supabase/functions/screeners-sync/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261118130000_analises_linhagem_cvm_sec_v764.sql','utf8');
test('CVM: parse numérico financeiro não inventa valores, separa CNPJ e moeda',()=>{
 const src=sync.slice(sync.indexOf('function csvRows('),sync.indexOf('async function cvmDreEvidencias('));
 const code=stripTypeScriptTypes(src,{mode:'transform'});
 const fn=vm.runInNewContext(code+'\n({csvRows,cvmNumero})');
 assert.equal(fn.cvmNumero('1.234,50'),1234.5);
 assert.equal(fn.cvmNumero('-22,00'),-22);
 assert.equal(fn.cvmNumero(''),null);
 assert.equal(fn.cvmNumero('texto'),null);
 const raw='CNPJ_CIA;DT_REFER;CD_CONTA;VL_CONTA\n11.111.111/0001-11;2026-09-30;3.01;100,50\n22.222.222/0001-22;2026-09-30;3.01;200,00';
 const rows=fn.csvRows(raw,new Set(['11111111000111']));
 assert.equal(rows.length,1);
 assert.equal(rows[0].VL_CONTA,'100,50');
});
test('CVM: linhagem usa documentos, periodo e versao, e nao valida automaticamente o TTM',()=>{
 assert.match(sync,/cvmZipCsv\(kind,parte\)/);
 assert.match(sync,/row\.DT_REFER!==doc\.competencia/);
 assert.match(sync,/String\(row\.VERSAO\)!==String\(doc\.versao\)/);
 assert.match(sync,/row\.DT_FIM_EXERC!==doc\.competencia/);
 assert.match(sync,/CD_CONTA==='3\.01'/);
 assert.match(sync,/CD_CONTA==='3\.11'/);
 assert.match(sync,/valida_indicador_ttm:false/);
 assert.match(sync,/comLinhagem\+\+/);
 assert.match(sync,/dados\.byteLength>/);
 assert.match(migration,/a\.documento_balanco_id=x\.documento_id/);
 assert.match(migration,/linhagem_indicadores,'\{\}'::jsonb\)\|\|coalesce\(x\.linhagem/);
});
test('SEC: ativo sem periodo recebe pausa finita, sem engolir limites 429',()=>{
 assert.match(sync,/quant_screeners_sec_tentativa_patch/);
 assert.match(sync,/semPeriodo\.push/);
 assert.match(migration,/sec_sem_periodo_consultado_em/);
 assert.match(migration,/interval '7 days'/);
 assert.match(migration,/GRANT EXECUTE ON FUNCTION public\.quant_screeners_sec_tentativa_patch\(jsonb\) TO service_role/);
 assert.doesNotMatch(sync,/setInterval\(/);
});
