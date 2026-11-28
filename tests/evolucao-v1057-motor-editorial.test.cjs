'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../src/analysis/tecnico-engine.js');
const read=p=>fs.readFileSync(p,'utf8');

function makeSeries(dir=1,len=320){
 const out=[];
 for(let i=0;i<len;i++){
  const base=dir===1?40+i*0.18:120-i*0.18;
  const wave=Math.sin(i/9)*3.5;
  const c=base+wave;
  const o=c-(dir===1?0.3:-0.3);
  const h=Math.max(o,c)+1.4;
  const l=Math.min(o,c)-1.4;
  out.push({t:Date.UTC(2024,0,1+i),o,h,l,c,v:150000+(i%10)*5000});
 }
 return out;
}

test('v1057 Etapa 01: comunicação editorial padronizada no fluxo Fato relevante → interpretação → consequência → condição de confirmação ou invalidação',()=>{
 const fluxo=/Fato relevante\s*→\s*interpretação\s*→\s*consequência\s*→\s*condição de confirmação ou invalidação/;
 for(const file of [
  'cloudflare/diario-screeners/aurea-qualidade-v1048.mjs',
  'cloudflare/diario-screeners/aurea-resumao-v904.mjs',
  'cloudflare/diario-screeners/diario-ia-v933.mjs',
  'supabase/functions/_shared/narrativa-tecnica.ts',
  'supabase/functions/revista-ia/revista.ts',
  'supabase/functions/analise/index.ts'
 ]){
  assert.match(read(file),fluxo,'fluxo editorial ausente em '+file);
 }
 assert.match(read('cloudflare/diario-screeners/aurea-debate-v1013.mjs'),/PROTOCOLO_EDITORIAL_V1057/);
});

test('v1057 Etapa 03: validação por candles fechados descarta candle em formação',()=>{
 const base=makeSeries(1,220);
 const forming={t:base.at(-1).t+86400000,o:100,h:120,l:95,c:118,v:500000,closed:false};
 const norm=E.closedOnly([...base,forming]);
 assert.equal(norm.length,base.length);
 assert.equal(norm.at(-1).t,base.at(-1).t);
 const dropped=E.normalize(base,{dropLastForming:true});
 assert.equal(dropped.length,base.length-1);
});

test('v1057 Etapa 03: MM20/50/200 diário, MM10/40 semanal, retração 23,6%–78,6% e projeção simétrica alta/baixa separada',()=>{
 const up=makeSeries(1,340);
 const resUp=E.one(up,1,{tf:'1d',daily:up,higher:E.aggregateWeekly(up)});
 assert.equal(resUp.valid,true);
 assert.equal(resUp.closedValidated,true);
 assert.ok(Number.isFinite(resUp.metrics.sma20)&&Number.isFinite(resUp.metrics.sma50)&&Number.isFinite(resUp.metrics.sma200));
 assert.ok(Number.isFinite(resUp.metrics.sma10w)&&Number.isFinite(resUp.metrics.sma40w));
 assert.ok(Number.isFinite(resUp.metrics.atr14)&&Number.isFinite(resUp.metrics.rsi14)&&Number.isFinite(resUp.metrics.obv));

 // Teste exato de simetria Retração (A→B→C) e Projeção (A–B a partir de C) para alta e baixa
 const barsUp=Array.from({length:320},(_,i)=>{
  const p=i<154?80+i*0.3:i===200?110:115;
  return {t:Date.UTC(2025,0,1+i),o:p,h:p+1,l:i===200?110:p-1,c:p,v:100000};
 });
 const fUp=E.fibo(barsUp,1,[{i:83,p:80,d:-1},{i:154,p:140,d:1}]);
 assert.equal(fUp.retracement.direction,'alta');
 const rMapUp=Object.fromEntries(fUp.retracement.levels.map(x=>[String(x.ratio),x.price]));
 assert.equal(rMapUp['0.236'],125.84);
 assert.equal(rMapUp['0.382'],117.08);
 assert.equal(rMapUp['0.5'],110);
 assert.equal(rMapUp['0.618'],102.92);
 assert.equal(rMapUp['0.764'],94.16);
 assert.equal(rMapUp['0.786'],92.84);
 assert.equal(fUp.projection.ready,true);
 assert.equal(fUp.projection.anchors.C.price,110);
 const pMapUp=Object.fromEntries(fUp.projection.levels.map(x=>[String(x.ratio),x.price]));
 assert.equal(pMapUp['1'],170);
 assert.equal(pMapUp['1.272'],186.32);
 assert.equal(pMapUp['1.414'],194.84);
 assert.equal(pMapUp['1.618'],207.08);

 // Simetria de baixa (A=140, B=80, C=110)
 const barsDn=Array.from({length:320},(_,i)=>{
  const p=i<154?140-i*0.3:i===200?110:100;
  return {t:Date.UTC(2025,0,1+i),o:p,h:i===200?110:p+1,l:p-1,c:p,v:100000};
 });
 const fDn=E.fibo(barsDn,-1,[{i:83,p:140,d:1},{i:154,p:80,d:-1}]);
 assert.equal(fDn.retracement.direction,'baixa');
 const rMapDn=Object.fromEntries(fDn.retracement.levels.map(x=>[String(x.ratio),x.price]));
 assert.equal(rMapDn['0.236'],94.16);
 assert.equal(rMapDn['0.382'],102.92);
 assert.equal(rMapDn['0.5'],110);
 assert.equal(rMapDn['0.618'],117.08);
 assert.equal(rMapDn['0.764'],125.84);
 assert.equal(rMapDn['0.786'],127.16);
 const pMapDn=Object.fromEntries(fDn.projection.levels.map(x=>[String(x.ratio),x.price]));
 assert.equal(pMapDn['1'],50);
 assert.equal(pMapDn['1.272'],33.68);
 assert.equal(pMapDn['1.414'],25.16);
 assert.equal(pMapDn['1.618'],12.92);
});

test('v1057 Etapa 04: Impulso vs Correção, retomada por fechamento, Dow HH/HL/LH/LL, Elliott alternativo e Fractalidade',()=>{
 // Impulso limpo (sem sobreposição, alta eficiência, grande amplitude/ATR)
 const impulseBars=Array.from({length:25},(_,i)=>({
  t:Date.UTC(2025,0,1+i),o:100+i*3,h:100+i*3+2.2,l:100+i*3-0.2,c:100+i*3+2,v:200000
 }));
 const imp=E.classifyLeg(impulseBars,0,impulseBars.length-1,2.5);
 assert.equal(imp.kind,'impulso');
 assert.ok(imp.amplitudeAtr>=2);
 assert.ok(imp.efficiency>=0.8);
 assert.ok(imp.overlapRatio<=0.2);

 // Correção sobreposta (baixa eficiência, alta sobreposição)
 const corrBars=Array.from({length:20},(_,i)=>{
  const p=100+(i%2===0?0.6:-0.6);
  return {t:Date.UTC(2025,0,1+i),o:p,h:102,l:98,c:p+(i%2===0?-0.2:0.2),v:100000};
 });
 const corr=E.classifyLeg(corrBars,0,corrBars.length-1,3.5);
 assert.equal(corr.kind,'correcao');
 assert.ok(corr.overlapRatio>=0.8);

 // Dow HH/HL e LH/LL
 const up=makeSeries(1,340),dn=makeSeries(-1,340);
 const resUp=E.one(up,1,{tf:'1d',daily:up});
 const resDn=E.one(dn,-1,{tf:'1d',daily:dn});
 assert.equal(resUp.structure.dow.primaryTrend,'alta');
 assert.ok(resUp.structure.dow.sequence.some(x=>x.tag==='HH'||x.tag==='HL'));
 assert.equal(resDn.structure.dow.primaryTrend,'baixa');
 assert.ok(resDn.structure.dow.sequence.some(x=>x.tag==='LH'||x.tag==='LL'));

 // Elliott sempre traz hipótese principal + alternativa ou indefinição
 assert.ok(typeof resUp.elliott.hipotesePrincipal==='string'&&resUp.elliott.hipotesePrincipal.length>5);
 assert.ok(typeof resUp.elliott.hipoteseAlternativa==='string'&&resUp.elliott.hipoteseAlternativa.length>5);
 assert.equal(typeof resUp.elliott.indefinido,'boolean');

 // Fractalidade Mensal, Semanal, Diário
 const frac=resUp.structure.fractality;
 assert.equal(frac.diario.available,true);
 assert.equal(frac.semanal.available,true);
 assert.equal(frac.mensal.available,true);
 assert.equal(frac.alignment,'alinhado_alta');
 assert.ok(resUp.structure.resumption&&typeof resUp.structure.resumption.confirmed==='boolean');
});
