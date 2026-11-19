'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const I=require('../src/analysis/screeners-inteligencia.js');
const T=require('../src/analysis/screeners-top10.js');
const doc=(year)=>({fonte:'CVM',formulario:'DFP',documento_id:String(120000+year),
 url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/'+year,
 competencia:year+'-12-31',publicado_em:(year+1)+'-03-20',ano:year});
const evidence=()=>({proprio:doc(2024),bazin:doc(2024),
 bazinDinamico:[doc(2022),doc(2023),doc(2024)],graham:doc(2024)});
test('v796: quatro provas CVM incluindo 3 exercícios consecutivos homologam evidência',()=>{
 const r=I.auditValuationEvidenceBR({score_model_version:'v2.2-val',valuation_evidencias:evidence()},'2026-11-19');
 assert.equal(r.required,true);assert.equal(r.complete,true);
});
test('v796: flag artificial não substitui documentos CVM',()=>{
 const r=I.auditValuationEvidenceBR({valuation_insumos_conferidos:true},'2026-11-19');
 assert.equal(r.complete,false);assert.deepEqual(r.missing,['proprio','bazin','bazinDinamico','graham']);
});
test('v796: histórico sem 3 anos e data futura são bloqueados',()=>{
 const x=evidence();x.bazinDinamico=x.bazinDinamico.slice(0,2);
 assert.equal(I.auditValuationEvidenceBR({score_model_version:'v2.2-val',valuation_evidencias:x},'2026-11-19').complete,false);
 const y=evidence();y.graham={...y.graham,publicado_em:'2027-01-01'};
 assert.equal(I.auditValuationEvidenceBR({valuation_insumos_conferidos:true,valuation_evidencias:y},'2026-11-19').complete,false);
});
test('v796: sem modelo composto não obriga novos documentos nem altera score SQL/JS',()=>{
 const r=I.auditValuationEvidenceBR({score_model_version:'v2.0'},'2026-11-19');
 assert.equal(r.required,false);assert.equal(r.complete,true);
});
test('v796: ranking exclui margem composta sem documento, sem apagar dados',()=>{
 const r=T.qualityGate('BR',{documento_balanco_tipo:'DFP',
  documento_balanco_id:'12345',documento_balanco_url:'https://dados.cvm.gov.br/a',
  data_competencia_balanco:'2025-12-31',documento_balanco_publicado_em:'2026-03-20'},
  {valuationEvidence:{required:true,complete:false}},'2026-11-19');
 assert.equal(r.passed,false);assert.match(r.reasons.join(' '),/quatro fórmulas/);
});
