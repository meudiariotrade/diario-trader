'use strict';
/* v803 — cenários integrados puramente locais, sem rede e sem Supabase. */
const assert=require('node:assert/strict');
const Feed=require('../src/analysis/feed-contract-v787.js');
const Health=require('../src/analysis/source-health-v793.js');
const Snapshot=require('../src/analysis/snapshot-contract-v800.js');
const Historic=require('../src/analysis/historico-qualidade-v794.js');
const Val=require('../src/analysis/screeners-inteligencia.js');
const Rank=require('../src/analysis/screeners-top10.js');
const Backtest=require('../src/analysis/backtest-gates-v801.js');
const security=require('./analises-security-v802.cjs');
const now=Date.parse('2026-11-19T15:30:00Z');
function run(){
 const checks=[],record=(name,fn)=>{fn();checks.push(name)};
 record('segurança adaptadores',()=>assert.equal(security.audit().ok,true));
 record('ticker exato e feed em tempo real',()=>{
  const quote=Feed.quote({ticker:'AAPL',market:'US',source:'finnhub',price:220,
   timestamp:now-3000},{now});
  assert.equal(quote.valid,true);
  const h=Health.create({contract:Feed,providers:{US:[{get:()=>quote}]}});
  const selected=h.assess('AAPL','US',now);
  assert.equal(selected.selected.source,'finnhub');
  assert.equal(h.assess('MSFT','US',now).selected,null);
 });
 record('snapshot público sem dados pessoais',()=>{
  const row={ticker:'PETR4',score_quant_br:70};
  const data={ok:true,market:'BR',rows:[row],universe_rows:[row],
   universe_complete:true,last_update:'2026-11-18T15:00:00Z'};
  assert.equal(Snapshot.check(data,{market:'BR'}).valid,true);
  assert.equal(Snapshot.check({...data,rows:[{...row,email:'privado@example.org'}]},
   {market:'BR'}).valid,false);
 });
 record('preço justo e margem composta somente se quatro insumos suficientes',()=>{
  const row={ticker:'PETR4',preco_referencia:10,lucro_projetado_brl:2e9,
   total_acoes:1e9,payout_projetado:25,dpa_12m:.6,dpa_media_consistente_5a:.5,
   lpa:2,vpa:15,roe:23,roic:19,pl:5,ev_ebitda:6,fcf_yield:7,
   dividend_yield:6,payout_implicito:25,momentum_12_1:15,valuation_insumos_conferidos:true};
  const v=Val.valuationBR(row),parts=Val.calculate('BR',row);
  assert.equal(v.scoreActive,true);
  assert.equal(Object.values(v.methods).every(x=>Number.isFinite(x)&&x>0),true);
  assert.equal(parts.length,4);
  assert.equal(Val.valuationBR({...row,dpa_media_consistente_5a:null}).scoreActive,false);
  assert.equal(Val.auditValuationEvidenceBR(row).complete,false);
 });
 record('Top 10 não homologa sem provas independentes',()=>{
  const raw={ticker:'PETR4',documento_balanco_tipo:'DFP',documento_balanco_id:'123456',
   documento_balanco_url:'https://dados.cvm.gov.br/contas',
   data_competencia_balanco:'2025-12-31',
   documento_balanco_publicado_em:'2026-03-20'};
  const gate=Rank.qualityGate('BR',raw,{valuationEvidence:{required:true,complete:false},
   valuationReconciliation:{complete:false,conflicts:[]}},'2026-11-19');
  assert.equal(gate.passed,false);
 });
 record('backtest bloqueado por 400 barras/datas',()=>{
  const t0=Date.parse('2025-01-02T12:00:00Z');
  const candles=Array.from({length:200},(_,i)=>{
   const p=10+i/10;return[Math.floor((t0+i*86400000)/1000),p,p+1,p-1,p,5000]});
  const gate=Backtest.check(candles,{market:'BR',tf:'1d',asOf:'2026-11-19',contract:Feed});
  assert.equal(gate.eligible,false);
  assert.equal(Backtest.unavailable(gate).setups.fibonaccing.winRate,null);
 });
 record('OHLCV não certifica dados ajustados de origem secundária',()=>{
  const t0=Date.parse('2024-01-02T12:00:00Z');
  const candles=Array.from({length:410},(_,i)=>{
   const p=10+i/10;return[Math.floor((t0+i*86400000)/1000),p,p+1,p-1,p,5000]});
  const payload={ok:true,ticker:'PETR4',market:'BR',tf:'1d',candles,
   source:'OHLCV simulado (teste)',fetchedAt:new Date(now).toISOString(),
   as_of:new Date(candles.at(-1)[0]*1000).toISOString(),
   adjustedCandles:candles,adjustedVerified:false};
  const q=Historic.audit(payload,{ticker:'PETR4',market:'BR',tf:'1d',contract:Feed,now});
  assert.equal(q.valid,true);assert.equal(q.adjustedVerified,false);
 });
 return {version:'v803',ok:true,checks:checks.length,scenarios:checks,
  claim:'Contratos sintéticos aprovados — não substitui testes de provedores/ProfitDLL em tempo real'};
}
if(require.main===module){try{process.stdout.write(JSON.stringify(run(),null,2)+'\n')}
 catch(e){process.stderr.write('Gate v803: '+String(e.message||e)+'\n');process.exitCode=1}}
module.exports={run};
