const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');
const intelligence=require('../src/analysis/screeners-inteligencia.js');
const ranking=require('../src/analysis/screeners-top10.js');
const sync=read('supabase/functions/screeners-sync/index.ts');
const edge=read('supabase/functions/screeners-quant/index.ts');
test('BR v2: calcula payout ausente a partir de DY e P/L e confere nota',{timeout:2000},()=>{
 const date=new Date().toISOString().slice(0,10);
 const row={ticker:'PETR3',empresa:'Petrobras',roe:22,roic:18,pl:5,ev_ebitda:4,fcf_yield:9,
  dividend_yield:7,payout_implicito:0,momentum_12_1:10,liquidez_diaria_brl:1e7,
  fundamentais_em:date,tecnicos_em:date,score_model_version:'v2.0',ativo_elegivel:true,
  data_competencia_balanco:new Date(Date.now()-40*86400000).toISOString().slice(0,10),
  documento_balanco_tipo:'ITR',documento_balanco_id:'123456789',
  documento_balanco_url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/',documento_balanco_publicado_em:date};
 assert.equal(intelligence.diagnostics('BR',row).parts[2].metrics.find(x=>x.key==='payout_implicito').number,35);
 row.score_quant_br=+intelligence.calculate('BR',row).reduce((a,x,i)=>a+x*intelligence.weights.BR[i].weight/100,0).toFixed(2);
 const d=intelligence.diagnostics('BR',row);
 assert.equal(d.validated,true);
 assert.equal(d.difference,0);
});
test('US v2 usa pesos novos sem precisar de short interest/buyback',()=>{
 const date=new Date().toISOString().slice(0,10);
 const row={ticker:'AAPL',company_name:'Empresa de exemplo',roic:20,roe:25,fcf_margin:19,
  eps_growth_yoy:17,revenue_growth_yoy:12,forward_pe:21,peg_ratio:1.6,ev_fcf:17,
  momentum_12_1:11,dist_mm200_pct:5,dividend_yield:2,payout_implicito:40,
  avg_daily_volume_usd:1e8,market_cap_usd:1e12,
  fundamentais_em:date,tecnicos_em:date,score_model_version:'us_v2.0',ativo_elegivel:true,
  data_competencia_balanco:new Date(Date.now()-40*86400000).toISOString().slice(0,10),
  documento_balanco_tipo:'10-Q',documento_balanco_id:'0000000000-26-000001',
  documento_balanco_url:'https://www.sec.gov/Archives/edgar/data/0000000000/000000000026000001/',
  documento_balanco_publicado_em:date,
  sec_facts_at:date,sec_source_url:'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json'};
 assert.deepEqual(intelligence.weights.US.map(x=>x.weight),[30,30,25,15]);
 row.score_quant_us=+intelligence.calculate('US',row).reduce((a,x,i)=>a+x*intelligence.weights.US[i].weight/100,0).toFixed(2);
 const d=intelligence.diagnostics('US',row);
 assert.equal(d.validated,true);
 assert.equal(d.difference,0);
 assert.equal(ranking.generate('US',[row],intelligence).entries.length,1);
});
test('Ranking escolhe a classe de maior liquidez por emissor e não altera Carteira',()=>{
 const today=new Date().toISOString().slice(0,10);
 const base={empresa:'Empresa A',roe:22,roic:18,pl:6,ev_ebitda:5,fcf_yield:8,
 dividend_yield:5,payout_implicito:35,momentum_12_1:11,
 score_model_version:'v2.0',ativo_elegivel:true,fundamentais_em:today,tecnicos_em:today,
 data_competencia_balanco:new Date(Date.now()-40*86400000).toISOString().slice(0,10),
 documento_balanco_tipo:'ITR',documento_balanco_id:'123456789',
 documento_balanco_url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/',documento_balanco_publicado_em:today};
 const mk=(ticker,liquidez)=>{const row={...base,ticker,liquidez_diaria_brl:liquidez};
 row.score_quant_br=+intelligence.calculate('BR',row).reduce((a,x,i)=>a+x*intelligence.weights.BR[i].weight/100,0).toFixed(2);return row};
 const result=ranking.generate('BR',[mk('PETR3',3000000),mk('PETR4',22000000)],intelligence);
 assert.equal(result.entries.length,1);assert.equal(result.entries[0].row.ticker,'PETR4');
});
test('Sync incremental e OHLCV diário ficam isolados no backend com lote limitado',()=>{
 assert.match(sync,/quant_v2_recalcular_lote/);
 assert.match(sync,/quant_v2_fundamentos_pendentes/);
 assert.match(sync,/range=2y&interval=1d/);
 assert.match(sync,/daily|technicalPrices/);
 assert.match(sync,/quant_v2_patch_precos/);
 assert.match(sync,/quant_v2_sync_log/);
 assert.match(sync,/scoreEngine\.calculate/);
 assert.doesNotMatch(sync,/setInterval\(|Realtime\.channel|\.subscribe\(/);
});
test('Cache HTTP público não contém Carteira; consultas de custódia nunca são públicas',()=>{
 assert.match(edge,/req\.method==='GET'/);
 assert.match(edge,/public, max-age=900, s-maxage=1800/);
 assert.match(edge,/if-none-match/);
 assert.match(edge,/W\/'/);
 assert.match(edge,/auth\/v1\/user/);
 assert.match(edge,/private, no-store/);
 assert.match(edge,/quant_v2_consulta_compacta/);
 assert.match(edge,/owned\.length===0&&custody==='todos'/);
});
