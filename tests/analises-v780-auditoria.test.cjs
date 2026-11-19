'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/analises-auditoria-v780.cjs');
const date='2026-11-18';
const sec={market:'US',ticker:'AAPL',eligible:true,documento_balanco_tipo:'10-K',
 documento_balanco_id:'0000320193-26-000088',documento_balanco_url:'https://www.sec.gov/Archives/edgar/data/320193/000032019326000088/10k.htm',
 documento_balanco_publicado_em:'2026-11-10',data_competencia_balanco:'2026-09-30',sec_facts_at:'2026-09-30',
 sec_source_url:'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
 linhagem_indicadores:{revenue_growth_yoy:[{documento_id:'0000320193-26-000088',codigo_xbrl:'RevenueFromContractWithCustomerExcludingAssessedTax',
 competencia:'2026-09-30',valor_reportado:750000000,unidade:'USD'}]}};
const br={market:'BR',ticker:'PETR4',eligible:true,documento_balanco_tipo:'ITR',documento_balanco_id:'162999',
 documento_balanco_url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/itr_cia_aberta_2026.zip',
 documento_balanco_publicado_em:'2026-11-12',data_competencia_balanco:'2026-09-30'};
test('v780: nunca confundir prova documental, XBRL e linhagem em três contagens',()=>{
 const r=A.audit([sec,br],{today:date});
 assert.equal(r.markets.US.docRate,100);
 assert.equal(r.markets.US.xbrlRate,100);
 assert.equal(r.markets.US.lineageRate,100);
 assert.equal(r.markets.BR.docRate,100);
 assert.match(r.limitation,/≠ desempenho de trading/);
});
test('v780: data futura, accession sem SEC e documento sem prova são rejeitados',()=>{
 const r=A.audit([{...sec,documento_balanco_publicado_em:'2027-01-01'},{
  ...br,documento_balanco_url:'https://example.com/fake',
  documento_rastreio_motivo:'Sem ITR/DFP oficial'}],{today:date});
 assert.equal(r.markets.US.docs,0);assert.equal(r.markets.BR.docs,0);
 assert.equal(r.markets.US.lineage,0);
 assert.equal(r.markets.BR.exceptions.length,1);
 assert.throws(()=>A.audit([sec,sec],{today:date}),/duplicado/);
});
test('v780: selos só surgem se TODAS as provas estatísticas forem externas',()=>{
 const r=A.audit([sec,br],{today:date});
 const fail=A.acceptance(r,{noLookAheadVerified:true,outOfSampleVerified:true,costsAndCorporateActionsVerified:false});
 assert.equal(fail.approved,false);assert.match(fail.status,/NÃO HOMOLOGADO/);
 const ok=A.acceptance(r,{noLookAheadVerified:true,outOfSampleVerified:true,costsAndCorporateActionsVerified:true});
 assert.equal(ok.approved,true);
 assert.match(A.markdown(r,fail),/NÃO HOMOLOGADO/);
});
test('v780: somente análise local, sem Supabase, logs, rede nem rotinas temporizadas',()=>{
 const fs=require('node:fs'),s=fs.readFileSync('scripts/analises-auditoria-v780.cjs','utf8');
 assert.doesNotMatch(s,/(?:require\(.+supabase|supabase\.co|edge_logs|postgres_logs|cron\.job_run_details|setInterval\(|fetch\()/);
 assert.equal(typeof A.audit,'function');
});
