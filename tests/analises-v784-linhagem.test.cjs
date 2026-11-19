'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../src/analysis/screeners-inteligencia.js');
const asOf='2026-11-19';
const base=(start,end,filed,id)=>({
 documento_id:id,formulario:'10-K',competencia:end,periodo_inicio:start,
 publicado_em:filed,namespace:'us-gaap',unidade:'USD'
});
const old=base('2024-01-01','2024-12-31','2025-02-25','0000320193-25-000011');
const fresh=base('2025-01-01','2025-12-31','2026-02-25','0000320193-26-000011');
const revenue=(b,val)=>({...b,codigo_xbrl:'RevenueFromContractWithCustomerExcludingAssessedTax',valor_reportado:val});
test('v784: crescimento YoY refeito a partir de dois protocolos SEC verificados',()=>{
 const r=F.auditLineage({revenue_growth_yoy:20,linhagem_indicadores:{
  revenue_growth_yoy:[revenue(fresh,120),revenue(old,100)]}},asOf);
 assert.equal(r.complete,true);assert.deepEqual(r.verified,['revenue_growth_yoy']);
});
test('v784: discrepância com valor salvo invalida a prova sem inventar retificação',()=>{
 const r=F.auditLineage({revenue_growth_yoy:50,linhagem_indicadores:{
  revenue_growth_yoy:[revenue(fresh,120),revenue(old,100)]}},asOf);
 assert.equal(r.complete,false);assert.deepEqual(r.conflicts,['revenue_growth_yoy']);
});
test('v784: lucro EPS precisa ser de mesma tag e unidade USD/shares',()=>{
 const a={...fresh,unidade:'USD/shares',codigo_xbrl:'EarningsPerShareDiluted',valor_reportado:1.2};
 const b={...old,unidade:'USD/shares',codigo_xbrl:'EarningsPerShareDiluted',valor_reportado:1};
 assert.equal(F.auditLineage({eps_growth_yoy:20,linhagem_indicadores:{eps_growth_yoy:[a,b]}},asOf).complete,true);
 assert.equal(F.auditLineage({eps_growth_yoy:20,linhagem_indicadores:{eps_growth_yoy:[a,{...b,unidade:'EUR/shares'}]}},asOf).complete,false);
});
test('v784: FCF exige CFO, CAPEX e receita mesmo accession e período',()=>{
 const cfo={...fresh,codigo_xbrl:'NetCashProvidedByUsedInOperatingActivities',valor_reportado:30};
 const capex={...fresh,codigo_xbrl:'PaymentsToAcquirePropertyPlantAndEquipment',valor_reportado:10};
 const rev=revenue(fresh,120);
 const row={fcf_margin:100*(30-10)/120,linhagem_indicadores:{fcf_margin:[cfo,capex,rev]}};
 assert.equal(F.auditLineage(row,asOf).complete,true);
 const wrong={...row,linhagem_indicadores:{fcf_margin:[cfo,{...capex,documento_id:old.documento_id},rev]}};
 assert.equal(F.auditLineage(wrong,asOf).complete,false);
});
test('v784: prova ausente e filing no futuro não geram selo completo',()=>{
 const r=F.auditLineage({revenue_growth_yoy:20},asOf);
 assert.equal(r.complete,false);assert.deepEqual(r.missing,['revenue_growth_yoy']);
 const a=F.auditLineage({revenue_growth_yoy:20,linhagem_indicadores:{
  revenue_growth_yoy:[{...revenue(fresh,120),publicado_em:'2026-12-05'},revenue(old,100)]}},asOf);
 assert.equal(a.complete,false);
});
