'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const I=require('../src/analysis/screeners-inteligencia.js');
const T=require('../src/analysis/screeners-top10.js');
const row=()=>({preco_referencia:10,total_acoes:1e9,valor_mercado_brl:10e9,
 pl:10,lpa:1,pvp:1,vpa:10,dpa_12m:.6,dividend_yield:6});
test('v797: quatro identidades por ação e múltiplos conferem',()=>{
 const r=I.reconcileValuationBR(row());
 assert.equal(r.complete,true);assert.equal(r.checked,4);assert.deepEqual(r.conflicts,[]);
});
test('v797: mismatch de classe/quantidade de ações não é considerado válido',()=>{
 const r=I.reconcileValuationBR({...row(),valor_mercado_brl:100e9});
 assert.equal(r.complete,false);assert.match(r.conflicts[0],/Valor mercado/);
});
test('v797: sem informação não inventa divergência ou prova',()=>{
 const r=I.reconcileValuationBR({preco_referencia:10});
 assert.equal(r.complete,false);assert.equal(r.checked,0);
});
test('v797: incompatibilidade bloqueia homologação de modelo composto sem mexer na nota',()=>{
 const r=T.qualityGate('BR',{documento_balanco_tipo:'DFP',
  documento_balanco_id:'12345',documento_balanco_url:'https://dados.cvm.gov.br/a',
  data_competencia_balanco:'2025-12-31',documento_balanco_publicado_em:'2026-03-20'},
  {valuationEvidence:{required:true,complete:true},
   valuationReconciliation:{complete:false,conflicts:['P/L / LPA']}},'2026-11-19');
 assert.equal(r.passed,false);assert.match(r.reasons.join(' '),/preços-teto/);
});
