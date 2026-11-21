'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const sb=fs.readFileSync('supabase/functions/screeners-sync/index.ts','utf8');
const edge=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
const begin=sb.indexOf('function secAnnual('),end=sb.indexOf('\nasync function secColetar(',begin);
if(begin<0||end<=begin)throw Error('Extrator oficial SEC não encontrado');
const funcs=vm.runInNewContext(stripTypeScriptTypes(sb.slice(begin,end),{mode:'transform'})+'\n({secAnnual,secValores})',{
 now:'2026-11-18',Date,Set,Map,Number,numeric:n=>typeof n==='number'&&Number.isFinite(n)?n:null,
 round:(n,p=4)=>Number.isFinite(n)?+n.toFixed(p):null
});
const fact=(val,start,end,accn,form='10-K')=>({val,start,end,accn,form,filed:end==='2025-12-31'?'2026-02-25':'2025-02-15'});
const d24='2024-12-31',d25='2025-12-31',a24='0000320193-25-000011',a25='0000320193-26-000011';
const annual=(v24,v25,unit='USD',form='10-K')=>({units:{[unit]:[
 fact(v24,'2024-01-01',d24,a24,form),fact(v25,'2025-01-01',d25,a25,form)]}});
test('v777: 10-K consecutivos, crescimento e FCF anual reprodutíveis',()=>{
 const doc={facts:{'us-gaap':{
  RevenueFromContractWithCustomerExcludingAssessedTax:annual(100,120),
  NetCashProvidedByUsedInOperatingActivities:annual(20,30),
  PaymentsToAcquirePropertyPlantAndEquipment:annual(8,10),
  EarningsPerShareDiluted:annual(1,1.25,'USD/shares')
 }}};
 const v=funcs.secValores(doc);
 assert.equal(v.revenue_growth_yoy,20);
 assert.equal(v.eps_growth_yoy,25);
 assert.equal(v.fcf_margin,+(100*(30-10)/120).toFixed(4));
});
test('v777: IFRS 20-F em EUR suporta razão YoY, sem fingir câmbio USD',()=>{
 const doc={facts:{'ifrs-full':{Revenue:annual(80,100,'EUR','20-F')}}};
 assert.equal(funcs.secValores(doc).revenue_growth_yoy,25);
 assert.equal(funcs.secValores(doc).fcf_margin,null);
});
test('v777: FCF sem a mesma moeda/documento/ano nunca é homologado',()=>{
 const doc={facts:{'us-gaap':{
  Revenues:annual(100,120),
  NetCashProvidedByUsedInOperatingActivities:annual(20,30),
  PaymentsToAcquirePropertyPlantAndEquipment:annual(8,10,'EUR')
 }}};
 assert.equal(funcs.secValores(doc).fcf_margin,null);
 // Sem dois anos consecutivos não calcular YoY mesmo que exista dado.
 doc.facts['us-gaap'].Revenues.units.USD[0].end='2023-12-31';
 assert.equal(funcs.secValores(doc).revenue_growth_yoy,null);
});
test('v777: Cloudflare conserva IFRS e unidades monetárias sem converter taxa',()=>{
 assert.match(edge,/revision=v(782|858)-concepts/);
 assert.match(edge,/DilutedEarningsLossPerShare/);
 assert.match(edge,/CashFlowsFromUsedInOperatingActivities/);
 assert.match(edge,/\(USD\|EUR\|CAD\|GBP\|BRL\|CHF\|JPY\)/);
 assert.match(sb,/namespace:x\.namespace,unidade:x\.unit/);
 assert.match(sb,/equalsFiscal\(x,cfoPeriod\)/);
 assert.match(sb,/\(CFO-CAPEX\)\/receita\*100/);
 assert.doesNotMatch(sb,/setInterval\(/);
});
