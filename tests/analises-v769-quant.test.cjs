'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../src/analysis/tecnico-engine.js');
const I=require('../src/analysis/screeners-inteligencia.js');
const source=p=>fs.readFileSync(p,'utf8');
const bars=(n=320,shift=0)=>Array.from({length:n},(_,i)=>{
 const p=35+i*.07+Math.sin(i/8)*1.3+shift;
 return [1700000000+i*86400,p-.12,p+.84,p-.85,p,150000+(i%14)*2200];
});
test('P1: custos líquidos estritamente ilustrativos por mercado; não inventar spread observado',()=>{
 for(const m of ['BR','US','CRYPTO']){
  const c=M.costScenario(m);assert.equal(c.verified,false);assert.ok(c.roundTripBps>0);
  const gross=M.riskNet({entry:100,stop:95,target2a:110},1,m);
  assert.ok(gross.rrNet<2);assert.ok(gross.netRisk>5);assert.ok(gross.netReward<10);
 }
 assert.equal(M.costScenario('UNRECOGNIZED'),null);
 assert.equal(M.riskNet({entry:100,stop:102,target2a:115},1,'BR'),null);
 assert.equal(M.riskNet({entry:100,stop:95,target2a:-1},1,'BR'),null);
});
test('P1: backtest não calcula Minervini sem histórico de RS nem inventa métricas com 250 candles',()=>{
 const small=M.walkForward(bars(250),{market:'BR',tf:'1d'});
 assert.equal(small.setups.minervini.trades,0);assert.equal(small.setups.minervini.winRate,null);
 const out=M.walkForward(bars(330),{market:'BR',tf:'1d',adjustedVerified:false});
 assert.equal(out.bars,330);assert.equal(out.method,'walk-forward-next-open-v1');
 assert.ok(out.historyDecisions>0);
 assert.equal(out.setups.minervini.trades,0);
 assert.match(out.setups.minervini.reason,/RS histórico ausente/);
 for(const s of Object.values(out.setups)){
  assert.equal(s.winRate===null||s.winRate>=0&&s.winRate<=100,true);
  if(s.expectancyR!==null)assert.ok(Number.isFinite(s.expectancyR));
 }
});
test('P1: worker BACKTEST é efêmero e não consulta banco ou rede',()=>{
 const workerSource=source('src/analysis/tecnico-worker.js'),out=[];
 const worker={DiarioTecnicoEngine:M,postMessage:x=>out.push(x)};
 vm.runInNewContext(workerSource,{self:worker,importScripts:()=>{}});
 worker.onmessage({data:{action:'BACKTEST',reqId:45,ticker:'PETR4',market:'BR',tf:'1d',candles:bars(325)}});
 assert.equal(out.length,1);assert.equal(out[0].action,'BACKTEST_DONE');
 assert.equal(out[0].reqId,45);assert.equal(out[0].result.costs.market,'BR');
 assert.doesNotMatch(workerSource,/\/rest\/v1\/|\/functions\/v1\/|setInterval\(|\bfetch\(/i);
});
test('P1: regras financeiras explícitas não confundem REIT/Finance com bancos',()=>{
 const bank={setor:'Finance',empresa:'BANCO BMG S.A.',roe:13,pl:5,pvp:.64,dividend_yield:9,
  payout_implicito:48,momentum_12_1:8,ev_ebitda:-99};
 assert.equal(I.financialSubtype(bank),true);
 assert.equal(I.financialSubtype({...bank,empresa:'REAL ESTATE INVESTMENT TRUST'}),false);
 const s=I.calculate('BR',bank);
 assert.equal(s.length,4);assert.ok(s.every(x=>x!==null));
 const withoutEv=I.calculate('BR',{...bank,ev_ebitda:null});
 assert.deepEqual(withoutEv,s);
 assert.deepEqual(I.groupsFor('BR',bank).map(x=>x.weight),[30,30,25,15]);
 const insurer={sector:'Finance',company_name:'American Integrity Insurance Group',roe:15,
  forward_pe:13,dividend_yield:2,momentum_12_1:10,dist_mm200_pct:4};
 assert.equal(I.financialSubtype(insurer),true);
 assert.equal(I.financialSubtype({...insurer,company_name:'Random Finance Holdings REIT'}),false);
 assert.equal(I.calculate('US',insurer)[0]!==null,true);
 assert.equal(I.diagnostics('US',insurer).validated,false,'P/VP e prova documental ausentes não podem homologar score');
});
test('P1: SQL/JS definem modelo especial somente para subtipo comprovado; P/VP EUA nulo permanece faltante',()=>{
 const sql=source('supabase/migrations/20261118193500_analises_financeiro_v769.sql');
 assert.match(sql,/quant_v2_score/);assert.match(sql,/pvp numeric/);
 assert.match(sql,/v2\.1-fin/);assert.match(sql,/score_model_version=v\.modelo/);
 assert.match(sql,/snapshot_refresh\('BR'\)/);assert.match(sql,/snapshot_refresh\('US'\)/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS/);
 assert.doesNotMatch(sql,/\b(?:TRUNCATE|DELETE|DROP)\b/i);
 const ui=source('src/analysis/tecnico-ui.js'),pdf=source('src/analysis/tecnico-pdf.js');
 assert.match(ui,/R\/R líquido estimado/);assert.match(ui,/historicoNoDetalhe/);
 assert.match(pdf,/R\/R bruto \/ líquido \(est\.\)/);
 for(const f of ['src/analysis/tecnico-engine.js','src/analysis/tecnico-worker.js','src/analysis/tecnico-ui.js','src/analysis/tecnico-pdf.js'])
  new vm.Script(source(f),{filename:f});
});
