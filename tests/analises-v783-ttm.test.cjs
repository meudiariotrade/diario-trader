'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/analysis/xbrl-periodos.js');
function fixture(){
 const period=(start,end,filed,val,form='10-Q',id='0000320193-26-000010')=>
  ({start,end,filed,val,form,accn:id,fy:2026,fp:form==='10-K'?'FY':'Q3'});
 const series=(fy,curr,prior)=>[
  period('2025-01-01','2025-12-31','2026-02-20',fy,'10-K'),
  period('2026-01-01','2026-09-30','2026-10-25',curr),
  period('2025-01-01','2025-09-30','2025-10-25',prior,'10-Q','0000320193-25-000010')];
 return {facts:{'us-gaap':{
  RevenueFromContractWithCustomerExcludingAssessedTax:{units:{USD:series(1000,800,700)}},
  NetCashProvidedByUsedInOperatingActivities:{units:{USD:series(300,240,180)}},
  PaymentsToAcquirePropertyPlantAndEquipment:{units:{USD:series(100,80,65)}}
 }}};
}
test('v783: TTM = FY + YTD corrente - YTD anterior, mesmo conceito',()=>{
 const doc=fixture(),r=P.ttmOne(doc,{tags:['RevenueFromContractWithCustomerExcludingAssessedTax'],asOf:'2026-11-19'});
 assert.equal(r.value,1100);assert.equal(r.method,'FY+YTD-YTD');
 assert.equal(r.period_end,'2026-09-30');assert.equal(r.proofs.length,3);
 assert.ok(r.proofs.every(x=>x.documento_id&&x.codigo_xbrl&&x.publicado_em));
 const m=P.fcfMargin(doc,{asOf:'2026-11-19'});
 assert.ok(Math.abs(m.margin_pct-(360-115)/1100*100)<1e-9);
 assert.equal(m.method,'FY+YTD-YTD');
});
test('v783: dados publicados depois da data de análise não causam look-ahead',()=>{
 const r=P.ttmOne(fixture(),{tags:['RevenueFromContractWithCustomerExcludingAssessedTax'],asOf:'2026-10-20'});
 assert.equal(r.value,1000);assert.equal(r.method,'FY');assert.equal(r.period_end,'2025-12-31');
});
test('v783: ausência de YTD homólogo bloqueia TTM e não retorna anual obsoleto',()=>{
 const doc=fixture();doc.facts['us-gaap'].RevenueFromContractWithCustomerExcludingAssessedTax.units.USD.pop();
 assert.equal(P.ttmOne(doc,{tags:['RevenueFromContractWithCustomerExcludingAssessedTax'],asOf:'2026-11-19'}),null);
});
test('v783: rejeita cruzamento de período FY/TTM e não mistura unidades ou taxonomias',()=>{
 const doc=fixture();
 doc.facts['us-gaap'].NetCashProvidedByUsedInOperatingActivities.units.USD[1].start='2026-02-01';
 assert.equal(P.fcfMargin(doc,{asOf:'2026-11-19'}),null);
 assert.equal(P.ttmOne(doc,{tags:['RevenueFromContractWithCustomerExcludingAssessedTax'],unit:'EUR',asOf:'2026-11-19'}),null);
 assert.equal(P.ttmOne(doc,{namespace:'ifrs-full',tags:['RevenueFromContractWithCustomerExcludingAssessedTax'],asOf:'2026-11-19'}),null);
});
test('v783: formato de data, accession e valores inválidos são recusados',()=>{
 const doc=fixture();
 doc.facts['us-gaap'].RevenueFromContractWithCustomerExcludingAssessedTax.units.USD[0].accn='fake';
 assert.equal(P.ttmOne(doc,{tags:['RevenueFromContractWithCustomerExcludingAssessedTax'],asOf:'2026-10-20'}),null);
 assert.equal(P.observations(doc,{tag:'RevenueFromContractWithCustomerExcludingAssessedTax',asOf:'2026-02-30'}).length,0);
});
