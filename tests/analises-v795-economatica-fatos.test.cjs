'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/analysis/economatica-fatos-v795.js');
const good=()=>({provider:'economatica',scope:'private',entitlementVerified:true,
 ticker:'PETR4',publishedAt:'2026-11-18',
 facts:[{metric:'roe',unit:'percent',periodEnd:'2026-09-30',value:14.2},
  {metric:'netIncome',unit:'BRL',periodEnd:'2026-09-30',value:30e9}]});
const options={ticker:'PETR4',asOf:'2026-11-19'};
test('v795: fatos licenciados não entram no score ou cache público',()=>{
 const r=A.normalize(good(),options);
 assert.equal(r.accepted,true);assert.equal(r.scoreEligible,false);
 assert.equal(r.redistributionAllowed,false);assert.equal(r.facts.length,2);
});
test('v795: licença/scope ausente falha fechado',()=>{
 assert.equal(A.normalize({...good(),entitlementVerified:false},options).accepted,false);
 assert.equal(A.normalize({...good(),scope:'public'},options).accepted,false);
});
test('v795: rejeita competência futura, ticker divergente e duplicação',()=>{
 assert.equal(A.normalize({...good(),publishedAt:'2026-11-20'},options).accepted,false);
 assert.equal(A.normalize({...good(),ticker:'VALE3'},options).accepted,false);
 const row=good();row.facts.push({...row.facts[0]});
 assert.equal(A.normalize(row,options).accepted,false);
});
test('v795: moeda errada não substitui valores oficiais',()=>{
 const row=good();row.facts[0].unit='JPY';
 assert.equal(A.normalize(row,options).scoreEligible,false);
});
