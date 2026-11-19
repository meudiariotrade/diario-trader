'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../src/analysis/tecnico-engine.js');
const source=p=>fs.readFileSync(p,'utf8');
const bars=(n=525,drift=.06)=>Array.from({length:n},(_,i)=>{
 const p=55+i*drift+Math.sin(i/9)*.9;
 return [1700000000+i*86400,p-.1,p+.8,p-.85,p,200000+i%13*1800];
});
test('v771: RS histórico requer benchmark, pelo menos 30 pares e data alinhada',()=>{
 const output=[],self={DiarioTecnicoEngine:M,postMessage:x=>output.push(x)};
 const src=source('src/analysis/tecnico-worker.js');
 vm.runInNewContext(src,{self,importScripts:()=>{}});
 const members=Array.from({length:30},(_,i)=>'STK'+String(i).padStart(2,'0'));
 const assets=members.map((ticker,i)=>({ticker,market:'BR',candles:bars(525,.055+i*.002),daily:bars(525,.055+i*.002)}));
 self.onmessage({data:{action:'RUN',reqId:77,tf:'1d',assets,
  rsUniverse:{BR:members},benchmarks:{BR:bars(525,.05)},rsAsOf:'2026-11-18'}});
 assert.equal(output.length,1);
 assert.equal(output[0].action,'DONE');
 const row=output[0].rows[0];
 assert.ok(row.rsHistory&&Object.keys(row.rsHistory).length>=180,'precisa registrar RS histórico sem usar o dia futuro');
 assert.ok(Object.values(row.rsHistory).every(v=>Number.isInteger(v)&&v>=0&&v<=99));
 assert.equal(row.rsMeta.denominator,30);
 output.length=0;
 self.onmessage({data:{action:'BACKTEST',reqId:78,ticker:row.ticker,
  market:'BR',tf:'1d',candles:assets[0].candles,rsHistory:row.rsHistory}});
 assert.equal(output[0].action,'BACKTEST_DONE');
 assert.ok(output[0].result.historyDecisions>=200);
 assert.doesNotMatch(output[0].result.setups.minervini.reason,/RS histórico ausente/);
});
test('v771: sem benchmark ou universo incompleto, histórico RS não é inventado',()=>{
 const out=[],self={DiarioTecnicoEngine:M,postMessage:x=>out.push(x)};
 vm.runInNewContext(source('src/analysis/tecnico-worker.js'),{self,importScripts:()=>{}});
 const universe=Array.from({length:30},(_,i)=>'STK'+i);
 self.onmessage({data:{action:'RUN',reqId:2,assets:[{ticker:'STK0',market:'BR',candles:bars(),daily:bars()}],
  rsUniverse:{BR:universe},benchmarks:{}}});
 assert.equal(out[0].rows[0].rsHistory,null);
 assert.equal(out[0].rows[0].rsMeta.completo,false);
});
test('v771: Cloudflare já usava 2y, mas agora revoga cache antigo; SEC sem companyfacts para documentos',()=>{
 const src=source('cloudflare/diario-screeners/index.mjs');
 assert.match(src,/const range=tf==='1d'\?'2y'/);
 assert.match(src,/revision=v779-adjusted/);
 assert.match(src,/\/v1\/sec-documento/);
 assert.match(src,/https:\/\/data\.sec\.gov\/submissions\/CIK/);
 assert.match(src,/accessionNumber/);
 assert.match(src,/User-Agent/);
 assert.doesNotMatch(src,/supabase.*service_role|SUPABASE_SERVICE_ROLE_KEY/i);
 const supa=source('supabase/functions/screeners-sec-docs/index.ts');
 assert.match(supa,/quant_sec_docs_bulk_upsert/);
 assert.match(supa,/const EDGE='https:\/\/diario-screeners-quant/);
 assert.match(supa,/await delay\(Math\.max\(0,120-/);
});
test('v771: classificação BR não homologa balanços ausentes e RPC SEC tem lote e privilégio mínimos',()=>{
 const sql=source('supabase/migrations/20261118211500_analises_sec_submissions_v771.sql');
 assert.match(sql,/pendente_protocolo_cvm/);
 assert.match(sql,/pendente_documento_do_emissor/);
 assert.match(sql,/quant_sec_docs_bulk_upsert/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.quant_sec_docs_bulk_upsert\(jsonb\) TO service_role/);
 assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE|DELETE)\b/i);
 for(const f of ['src/analysis/tecnico-ui.js','src/analysis/tecnico-engine.js','src/analysis/tecnico-worker.js'])
  new vm.Script(source(f),{filename:f});
});
