'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const intel=require('../src/analysis/screeners-inteligencia.js');
const inst=require('../src/analysis/institutional-v781.js');
const engine=require('../src/analysis/tecnico-engine.js');
const near=(v,x,epsilon=1e-8)=>assert.ok(Math.abs(v-x)<=epsilon,String(v)+' != '+String(x));
const bars=(n=280)=>Array.from({length:n},(_,i)=>{const c=30+i*.04;return {t:Date.UTC(2025,0,1+i),o:c-.03,h:c+.15,l:c-.18,c,v:10000+(i%7)*300}});
test('fórmula própria usa lucro, payout percentual, quantidade de ações e yield 7%',()=>{
 const v=intel.valuationBR({lucro_projetado_brl:14613000000,payout_projetado:25,
 total_acoes:5730834040,preco_referencia:8.5});
 near(v.methods.proprio,9.10675223711167,1e-10);
 near(v.margins.proprio,(9.10675223711167-8.5)/9.10675223711167*100);
 const low=intel.valuationBR({lucro_projetado_brl:14613000000,payout_projetado:.25,
  total_acoes:5730834040},{yieldAceitavel:.06});
 assert.ok(low.methods.proprio>v.methods.proprio);
});
test('Bazin e Graham independentes; sem dados => N/D, nunca zero inventado',()=>{
 const v=intel.valuationBR({preco_referencia:25,dpa_12m:2.4,lpa:4,vpa:16});
 near(v.methods.bazin,40);near(v.methods.graham,Math.sqrt(22.5*4*16));
 near(v.margins.bazin,37.5);
 const missing=intel.valuationBR({preco_referencia:30,pl:7,pvp:1.2,dividend_yield:10,payout_implicito:40});
 for(const val of Object.values(missing.methods))assert.equal(val,null);
 for(const val of Object.values(missing.margins))assert.equal(val,null);
});
test('Bazin ajustado preserva anos zerados e rejeita dividendos extraordinários',()=>{
 const base={preco_referencia:20,dividendos_anuais:[
  {ano:2022,dpa:1},{ano:2023,dpa:1.2},{ano:2024,dpa:10,extraordinario:true},
  {ano:2025,dpa:0},{ano:2026,dpa:1.1}]};
 const v=intel.valuationBR(base);
 near(v.methods.bazinDinamico,(1+1.2+0+1.1)/4/.06);
 assert.equal(intel.valuationBR({dividendos_anuais:base.dividendos_anuais.slice(0,2)}).methods.bazinDinamico,null);
 assert.equal(intel.valuationBR({lpa:-2,vpa:20}).methods.graham,null);
});
test('KST de Pring produz linha e sinal com 10/15/20/30 e SMA9',()=>{
 const result=inst.kst(bars(260));
 assert.equal(typeof result.value,'number');
 assert.equal(typeof result.signal,'number');
 assert.equal(typeof result.bullish,'boolean');
});
test('Pocket Pivot exige barra positiva, proximidade à média e volume maior que queda',()=>{
 const c=bars(260);
 c[255].c=c[254].c-.02;c[255].o=c[255].c+.01;c[255].v=15000;
 c[259].v=23000;c[259].o=c[259].c-.1;
 const result=inst.analyze(c,1,{market:'BR'});
 assert.equal(result.valid,true);
 assert.equal(result.pocket.armed,true);
 assert.equal(result.pocket.volumeThreshold,15000);
 c[259].v=14000;
 assert.equal(inst.analyze(c,1,{market:'BR'}).pocket.armed,false);
});
test('CAN SLIM sem EPS trimestral e RS do universo não vira confirmação',()=>{
 const result=inst.analyze(bars(),1,{market:'BR'});
 assert.equal(result.canSlim.confirmed,false);
 assert.ok(result.canSlim.missing.includes('C'));
 assert.ok(result.canSlim.missing.includes('I'));
 assert.equal(result.canSlim.checks.L,null);
});
test('OBV macro exige rompimento com dados observados e identifica rótulo',()=>{
 const c=bars();
 const r=inst.obvEvidence(c,1);
 assert.equal(r.macro,true);
 assert.equal(r.label,'OBV ROMPIDO (MACRO)');
 assert.equal(engine.one(c,1,{market:'BR'}).metrics.obvSignal,'OBV ROMPIDO (MACRO)');
});
test('PFR e Trap não são executados na mesma barra de formação',()=>{
 const c=bars();
 const r=inst.analyze(c,1,{market:'BR'});
 assert.equal(r.stormer.pfr.triggered,false);
 assert.equal(r.stormer.trap.triggered,false);
});
