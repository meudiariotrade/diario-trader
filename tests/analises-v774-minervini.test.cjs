'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../src/analysis/tecnico-engine.js'),src=p=>fs.readFileSync(p,'utf8');
const bars=Array.from({length:530},(_,i)=>{const p=10+i*.15;return [1690000000+i*86400,p,p+1,p-1,p,150000];});
test('v774: Trend Template 8/8 não depende de VCP, mas execução Minervini exige VCP separado',()=>{
 const t=M.passTemplate(M.normalize(bars),1,95,false);
 assert.equal(t.score,8);
 assert.equal(t.vcpConfirmado,false);
 assert.match(t.nota,/independente do VCP/);
 const engine=src('src/analysis/tecnico-engine.js');
 assert.match(engine,/x\.minervini\?\.score===8&&x\.vcp===true/);
});
test('v774: RS retrospectivo usa 252 candles anteriores e percentil sem look-ahead',()=>{
 const srcW=src('src/analysis/tecnico-worker.js');
 assert.match(srcW,/if\(i<252\)return null/);
 assert.match(srcW,/\[63,126,189,252\]/);
 assert.match(srcW,/benchmark\.length<253/);
 assert.doesNotMatch(srcW,/\bfetch\(/);
});
test('v774: backtest 5 trades não é suficiente; holdout/intervalo e ajuste não são inventados',()=>{
 const bt=M.walkForward(bars,{market:'BR',tf:'1d',rsHistory:{}});
 assert.equal(bt.statsModel,'validation-v774');
 assert.ok(bt.historyDecisions>200);
 assert.ok(bt.sampleSplitAt);
 for(const entry of Object.values(bt.setups)){
  assert.ok(entry.trades<30?entry.winRate===null:true);
  assert.ok('confidence95' in entry);
  assert.ok(entry.outOfSample&&Number.isInteger(entry.outOfSample.trades));
  assert.notEqual(entry.status,'homologado');
 }
 const ui=src('src/analysis/tecnico-ui.js');
 assert.match(ui,/tecnico-worker\.js\?v=787/);
 assert.match(ui,/version:'tecnico-781\.1'/);
 assert.match(ui,/adjustedVerified:false/);
});
test('v774: sintaxe mantém gráfico, cliente e PDF sem mudanças visuais',()=>{
 for(const file of ['src/analysis/tecnico-engine.js','src/analysis/tecnico-worker.js','src/analysis/tecnico-ui.js','src/analysis/tecnico-pdf.js'])
  new vm.Script(src(file),{filename:file});
 assert.equal(M.VERSION,'tecnico-787.1');
});
