'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../src/analysis/tecnico-engine.js'),read=p=>fs.readFileSync(p,'utf8');
const cloud=read('cloudflare/diario-screeners/index.mjs'),ui=read('src/analysis/tecnico-ui.js');
const worker=read('src/analysis/tecnico-worker.js');
test('v779: manter candle de execução nominal separado do ajustado para estudo',()=>{
 assert.match(cloud,/adjustedCandles:adjustedReady\?adjustedCandles:null/);
 assert.match(cloud,/adjustmentBasis:adjustedReady/);
 assert.match(cloud,/adjustedVerified:false/);
 assert.match(cloud,/Yahoo adjclose\/close/);
 assert.match(cloud,/revision=v779-adjusted/);
 assert.match(ui,/adjustedCandles:adjusted/);
 assert.match(ui,/data\?\.adjustedCandles\|\|data\?\.candles/);
 assert.match(ui,/adjustedVerified:false/);
});
test('v779: histórico diário precisa ter 400 barras válidas antes do RS/backtest',()=>{
 assert.match(cloud,/tf==='1d'&&items\.length<400/);
 assert.match(ui,/tf==='1d'&&payload\.candles\.length<400/);
 assert.match(worker,/a\.adjustedDaily\|\|a\.daily\|\|a\.candles/);
 assert.match(worker,/if\(i<252\)return null/);
 assert.doesNotMatch(worker,/\bfetch\(/);
});
test('v779: série ajustada é apenas exploratória e não simula custos executáveis',()=>{
 const raw=Array.from({length:510},(_,i)=>[1700000000+i*86400,100+i*.12,101+i*.12,99+i*.12,100+i*.12,150000]);
 const adjusted=raw.map(x=>[x[0],x[1]*.97,x[2]*.97,x[3]*.97,x[4]*.97,x[5]]);
 assert.equal(M.normalize(adjusted).length,510);
 const backtest=M.walkForward(adjusted,{market:'BR',tf:'1d',adjustedVerified:false});
 assert.equal(backtest.costs.verified,false);
 assert.ok(Object.values(backtest.setups).every(x=>x.status!=='homologado'));
});
test('v779: não alterar PDF nem lógica de apresentação',()=>{
 assert.equal(M.VERSION,'tecnico-779.1');
 for(const p of ['src/analysis/tecnico-engine.js','src/analysis/tecnico-worker.js','src/analysis/tecnico-ui.js','src/analysis/tecnico-pdf.js'])
  new vm.Script(read(p),{filename:p});
});
