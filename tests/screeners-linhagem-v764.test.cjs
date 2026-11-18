const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const sync=fs.readFileSync('supabase/functions/screeners-sync/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261118130000_analises_linhagem_cvm_sec_v764.sql','utf8');
test('CVM: parse numérico financeiro não inventa valores, separa CNPJ e moeda',()=>{
 const src=sync.slice(sync.indexOf('function csvRows('),sync.indexOf('async function cvmDreEvidencias('));
 const code=stripTypeScriptTypes(src,{mode:'transform'});
 const fn=vm.runInNewContext(code+'\n({csvRows,cvmNumero})');
 assert.equal(fn.cvmNumero('1.234,50'),1234.5);
 assert.equal(fn.cvmNumero('9356000.000000'),9356000,'ponto decimal CVM nao vira multiplicacao por milhao');
 assert.equal(fn.cvmNumero('1234.500000'),1234.5);
 assert.equal(fn.cvmNumero('-22,00'),-22);
 assert.equal(fn.cvmNumero(''),null);
 assert.equal(fn.cvmNumero('texto'),null);
 const raw='CNPJ_CIA;DT_REFER;CD_CONTA;VL_CONTA\n11.111.111/0001-11;2026-09-30;3.01;100,50\n22.222.222/0001-22;2026-09-30;3.01;200,00';
 const rows=fn.csvRows(raw,new Set(['11111111000111']));
 assert.equal(rows.length,1);
 assert.equal(rows[0].VL_CONTA,'100,50');
});
test('CVM: linhagem usa documentos, periodo e versao, e nao valida automaticamente o TTM',()=>{
 assert.match(sync,/cvmZipDreRows\(kind,parte,alvo\)/);
 assert.match(sync,/row\.DT_REFER!==doc\.competencia/);
 assert.match(sync,/String\(row\.VERSAO\)!==String\(doc\.versao\)/);
 assert.match(sync,/row\.DT_FIM_EXERC!==doc\.competencia/);
 assert.match(sync,/CD_CONTA==='3\.01'/);
 assert.match(sync,/CD_CONTA==='3\.11'/);
 assert.match(sync,/valida_indicador_ttm:false/);
 assert.match(sync,/valor_original_csv:String\(row\.VL_CONTA\)/);
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

test('CVM: evidencia real requer CNPJ, versao, mesma competencia e conta DRE oficial',async()=>{
 const source=sync.slice(sync.indexOf('function csvRows('),sync.indexOf('\nfunction normalizeName'));
 const csv=[
  'CNPJ_CIA;DT_REFER;VERSAO;ORDEM_EXERC;DT_INI_EXERC;DT_FIM_EXERC;CD_CONTA;VL_CONTA;MOEDA;ESCALA_MOEDA',
  '11.111.111/0001-11;2026-09-30;2;ÚLTIMO;2026-01-01;2026-09-30;3.01;1.500,00;REAL;MIL',
  '11.111.111/0001-11;2026-09-30;2;ÚLTIMO;2026-01-01;2026-09-30;3.11;120,50;REAL;MIL',
  '11.111.111/0001-11;2026-09-30;1;ÚLTIMO;2026-01-01;2026-09-30;3.01;9.999,00;REAL;MIL',
  '11.111.111/0001-11;2026-06-30;2;ÚLTIMO;2026-01-01;2026-06-30;3.01;8.888,00;REAL;MIL'
 ].join('\n');
 const header=csv.split('\n')[0].split(';');
 const dreRows=csv.split('\n').slice(1).map(line=>Object.fromEntries(line.split(';').map((value,i)=>[header[i],value])));
 const context={cvmZipDreRows:async (_k,p)=>p==='DRE_con'?dreRows:[],Date,Set,Map,Number,String};
 const fn=vm.runInNewContext(stripTypeScriptTypes(source,{mode:'transform'})+'\ncvmDreEvidencias',context);
 const doc={formulario:'ITR',documento_id:'123456',publicado_em:'2026-11-01',competencia:'2026-09-30',versao:'2'};
 const r=await fn(new Map([['11111111000111',doc]]));
 const linhagem=r.contas.get('11111111000111');
 assert.equal(linhagem.receita_liquida_dre.valor_reportado,1500);
 assert.equal(linhagem.lucro_prejuizo_dre.valor_reportado,120.5);
 assert.equal(linhagem.receita_liquida_dre.valida_indicador_ttm,false);
 assert.equal(linhagem.receita_liquida_dre.documento_id,'123456');
 assert.equal(linhagem.receita_liquida_dre.escala_moeda,'MIL');
 const outro=await fn(new Map([['11111111000111',{...doc,versao:'3'}]]));
 assert.equal(outro.contas.size,0,'Nunca vincular demonstração de versão divergente');
});

test('CVM: DRE gigante é lida em streaming, retendo apenas CNPJ solicitado',async()=>{
 const source=sync.slice(sync.indexOf('async function cvmZipDreRows('),sync.indexOf('\nfunction normalizeName'));
 const header='CNPJ_CIA;DT_REFER;VERSAO;VL_CONTA';
 const linhas=Array.from({length:1200},(_,i)=>i===880?
  '11.111.111/0001-11;2026-09-30;2;125,00':
  '22.222.222/0001-22;2026-09-30;1;0,00');
 const conteudo=[header,...linhas].join('\n');
 const encoder=new TextEncoder();
 const contexto={cvmZipBytes:async()=>({compressed:encoder.encode(conteudo),method:0}),Blob,TextDecoder,Set,Map,Number,String};
 const fn=vm.runInNewContext(stripTypeScriptTypes(source,{mode:'transform'})+'\ncvmZipDreRows',contexto);
 const rows=await fn('itr','DRE_con',new Set(['11111111000111']));
 assert.equal(rows.length,1);
 assert.equal(rows[0].VL_CONTA,'125,00');
 assert.match(sync,/restante=4_000_000-total/);
 assert.match(sync,/selecionadas\.length>=35001/);
});
