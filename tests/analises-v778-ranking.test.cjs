'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const I=require('../src/analysis/screeners-inteligencia.js');
const T=require('../src/analysis/screeners-top10.js');
const today=new Date().toISOString().slice(0,10);
const us=()=>{
 const row={ticker:'AAPL',company_name:'Example Co',sector:'Technology',
  roic:19,roe:21,fcf_margin:16,eps_growth_yoy:12,revenue_growth_yoy:9,
  forward_pe:22,peg_ratio:1.4,ev_fcf:22,momentum_12_1:12,dist_mm200_pct:12,
  dividend_yield:1.2,payout_implicito:20,avg_daily_volume_usd:5000000,
  score_model_version:'us_v2.0',ativo_elegivel:true,fundamentais_em:today,
  tecnicos_em:today,data_competencia_balanco:'2026-09-30',
  sec_facts_at:'2026-09-30',sec_source_url:'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
  documento_balanco_tipo:'10-K',documento_balanco_id:'0000320193-26-000055',
  documento_balanco_publicado_em:today,
  documento_balanco_url:'https://www.sec.gov/Archives/edgar/data/320193/000032019326000055/example.htm'};
 const scores=I.calculate('US',row),groups=I.weights.US;
 row.score_quant_us=+scores.reduce((sum,n,i)=>sum+n*groups[i].weight/100,0).toFixed(2);
 return row;
};
test('v778: valores extremos/projeções não produzem homologação automática',()=>{
 const row=us();row.dividend_yield=35;row.payout_implicito=250;
 const flags=I.qualityFlags('US',row);
 assert.ok(flags.some(x=>/Dividend Yield/.test(x)));
 assert.ok(flags.some(x=>/Payout/.test(x)));
 const d=I.diagnostics('US',row);
 assert.equal(d.qualityFlags.length>=2,true);
 assert.equal(T.generate('US',[row],I).entries.length,0);
});
test('v778: ranking EUA exige XBRL identificado, além de protocolo SEC e fórmula',()=>{
 const valid=us(),analysis=I.diagnostics('US',valid);
 assert.equal(analysis.validated,false,'Apenas identificador Companyfacts não certifica a linhagem das métricas');
 assert.equal(analysis.secXbrlIdentificado,true);
 assert.equal(T.generate('US',[valid],I).entries.length,0,'sem provas individuais de EPS, receita e FCF');
 const undocumented={...valid,sec_source_url:null,sec_facts_at:null};
 assert.equal(I.diagnostics('US',undocumented).secXbrlIdentificado,false);
 assert.equal(T.generate('US',[undocumented],I).entries.length,0);
});
test('v778: diagnóstico deixa explícito XBRL parcial sem inventar validação integral',()=>{
 const d=I.diagnostics('US',us());
 assert.equal(d.provenanceLevel,'protocolo_mais_xbrl_parcial');
 assert.match(T.generate('US',[us()],I).reason,/Provas XBRL são parciais/);
 const bad=us();bad.forward_pe=-2;
 assert.ok(I.qualityFlags('US',bad).some(x=>/forward_pe/.test(x)));
});
