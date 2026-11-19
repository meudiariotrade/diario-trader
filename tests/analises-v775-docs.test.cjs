'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=p=>fs.readFileSync(p,'utf8');
test('v775: só unschedule de 6 agendamentos redundantes, mantém SEC/CVM/Push',()=>{
 const sql=source('supabase/migrations/20261118233000_analises_crons_documentos_v775.sql');
 assert.equal((sql.match(/'screeners-sec-documentos-v765-(?:manha|meiodia|tarde)'/g)||[]).length,3);
 assert.equal((sql.match(/'screeners-sec-documentos-v768-(?:intermediario|encerramento)'/g)||[]).length,2);
 assert.match(sql,/'screeners-cvm-documentos-v763'/);
 assert.match(sql,/cron\.unschedule\(v_job_name\)/);
 assert.match(sql,/j\.jobname=v_job_name/);
 assert.doesNotMatch(sql,/\b(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+(?:quant_|public\.))/i);
 assert.doesNotMatch(sql,/screeners-sec-submissions-v771'|screeners-cvm-cnpj-v772'|screeners-sec-xbrl-v773'|notificacoes/);
});
test('v775: CNPJ revisado exige também nome do emissor e protocolo CVM existente',()=>{
 const s=source('supabase/functions/screeners-cvm-docs/index.ts');
 const p=s.slice(s.indexOf('const ALIAS_OFICIAL'),s.indexOf('const iso=x=>'));
 const values=vm.runInNewContext(stripTypeScriptTypes(p,{mode:'transform'})+'\nALIAS_OFICIAL');
 assert.deepEqual(Object.keys(values).sort(),['CEAB3','CLSC4','CMIG3','CMIG4','MDIA3','MLAS3']);
 for(const [ticker,obj] of Object.entries(values)){
  assert.match(obj.cnpj,/^\d{14}$/);
  assert.match(obj.prova,/^https:\/\//);
  assert.ok(obj.emissor instanceof RegExp||Object.prototype.toString.call(obj.emissor)==='[object RegExp]');
 }
 assert.equal(values.CMIG3.cnpj,values.CMIG4.cnpj,'ON e PN do mesmo emissor');
 assert.match(s,/reviewed\.emissor\.test\(key\)/);
 assert.match(s,/src\.emissores\.some/);
 assert.match(s,/docs\.get\(id\)/);
 assert.match(s,/quant_cvm_documentos_bulk/);
});
