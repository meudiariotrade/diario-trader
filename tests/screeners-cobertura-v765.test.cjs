'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const src=fs.readFileSync('supabase/functions/screeners-sync/index.ts','utf8');
const cron=fs.readFileSync('supabase/migrations/20261118141000_analises_sec_cvm_lotes_v765.sql','utf8');
function period(facts){
 const fn=src.slice(src.indexOf('function secPeriodo('),src.indexOf('function secAnnual('));
 return vm.runInNewContext(stripTypeScriptTypes(fn,{mode:'transform'})+'\nsecPeriodo',{Date,Set,Object,String,Array})(facts);
}
test('SEC: report 20-F IFRS com accession e data oficial é aceito',()=>{
 const data={facts:{'ifrs-full':{Assets:{units:{USD:[
  {form:'20-F',accn:'0001234567-26-000001',end:'2025-12-31',filed:'2026-03-15',val:1000}
 ]}}}}};
 assert.equal(period(data)?.form,'20-F');
 data.facts['ifrs-full'].Assets.units.USD[0].form='6-K';
 assert.equal(period(data),null);
 data.facts['ifrs-full'].Assets.units.USD[0].form='40-F';
 data.facts['ifrs-full'].Assets.units.USD[0].accn='sem-id';
 assert.equal(period(data),null);
});
test('SEC: 10-Q us-gaap permanece aceito e periodos futuros são rejeitados',()=>{
 const obj={facts:{'us-gaap':{Assets:{units:{USD:[
 {form:'10-Q',accn:'0001234567-26-000001',end:'2026-09-30',filed:'2026-11-15',val:12}
 ]}}}}};
 assert.equal(period(obj)?.form,'10-Q');
 obj.facts['us-gaap'].Assets.units.USD[0].end='2027-12-31';
 assert.equal(period(obj),null);
});
test('CVM: aceita somente arquivo pequeno, recente, e validado contra metadados oficiais',()=>{
 assert.match(src,/cvm-dre-/);
 assert.match(src,/j\.documentos\.length<100/);
 assert.match(src,/row\.documento_id!==doc\.documento_id/);
 assert.match(src,/row\.versao!==doc\.versao/);
 assert.match(src,/row\.publicado_em!==doc\.publicado_em/);
 assert.match(src,/ev\.valida_indicador_ttm!==false/);
 assert.match(src,/cvmNumero\(ev\.valor_original_csv\)/);
 assert.match(src,/14\*86400000/);
 assert.match(src,/fallback amostral/);
});
test('Agendamentos SEC nunca fazem polling e CVM permanece semanal',()=>{
 for(const name of ['manha','meiodia','tarde'])assert.match(cron,new RegExp('screeners-sec-documentos-v765-'+name));
 assert.match(cron,/screeners-cvm-documentos-v763','30 7 \* \* 6'/);
 assert.equal((cron.match(/"limite":12/g)||[]).length,3);
 assert.doesNotMatch(src,/setInterval\(/);
});

test('B3: nomes societários com S.A., Banco/BCO e preposições casam com CVM',()=>{
 const source=src.slice(src.indexOf('function normalizeName('),src.indexOf('async function cvmEnriquecer('));
 const fn=vm.runInNewContext(stripTypeScriptTypes(source,{mode:'transform'})+'\nnormalizeName',{String});
 assert.equal(fn('WEG S.A.'),'WEG');
 assert.equal(fn('BANCO DO BRASIL S.A.'),fn('BCO BRASIL SA'));
 assert.equal(fn('BCO BRADESCO S.A.'),fn('BANCO BRADESCO S.A.'));
 assert.equal(fn('DIRECIONAL ENGENHARIA S.A.'),'DIRECIONAL ENGENHARIA');
});
