'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../src/analysis/screeners-top10.js');
const reference='2026-11-19';
const br={ticker:'PETR4',documento_balanco_tipo:'ITR',documento_balanco_id:'123456789',
 documento_balanco_url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/',
 documento_balanco_publicado_em:'2026-11-16',data_competencia_balanco:'2026-09-30',
 fundamentais_em:'2026-11-17',tecnicos_em:'2026-11-18'};
test('v786: documento oficial válido da CVM mantém elegibilidade',()=>{
 assert.deepEqual(T.qualityGate('BR',br,null,reference).reasons,[]);
 assert.equal(T.qualityGate('BR',br,null,reference).passed,true);
});
test('v786: publicação CVM anterior à competência bloqueia rating',()=>{
 const d={...br,documento_balanco_publicado_em:'2026-03-01'};
 const r=T.qualityGate('BR',d,null,reference);
 assert.equal(r.passed,false);assert.ok(r.reasons.some(x=>x.includes('publicado antes')));
});
test('v786: dados com referência futura não são publicados como score confirmado',()=>{
 for(const key of ['documento_balanco_publicado_em','fundamentais_em','tecnicos_em']){
  const r=T.qualityGate('BR',{...br,[key]:'2026-12-20'},null,reference);
  assert.equal(r.passed,false,key);
 }
});
test('v786: accession SEC inválido e documento CVM sem ID válido bloqueiam ranking',()=>{
 const us={...br,documento_balanco_tipo:'10-K',documento_balanco_id:'invalid',
  documento_balanco_url:'https://www.sec.gov/Archives/edgar/data/320193/x'};
 assert.equal(T.qualityGate('US',us,null,reference).passed,false);
 assert.equal(T.qualityGate('BR',{...br,documento_balanco_id:''},null,reference).passed,false);
});
test('v786: divergência de linhagem SEC bloqueia selo',()=>{
 const us={...br,documento_balanco_tipo:'10-K',documento_balanco_id:'0000320193-26-000010',
  documento_balanco_url:'https://www.sec.gov/Archives/edgar/data/320193/000032019326000010/'};
 const d={lineageAudit:{missing:['eps_growth_yoy'],conflicts:[]}};
 assert.equal(T.qualityGate('US',us,d,reference).passed,false);
 assert.equal(T.qualityGate('US',us,{lineageAudit:{missing:[],conflicts:[]}},reference).passed,true);
});
