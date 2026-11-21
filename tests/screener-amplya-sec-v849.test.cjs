const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v849: SEC Companyfacts → histórico anual dos EUA (fluxo de 1 ano, saldo no fim do exercício, arquivo mais recente)',async()=>{
 const anos=[2021,2022,2023,2024];
 const fluxo=(v0)=>anos.map((a,i)=>({start:a+'-01-01',end:a+'-12-31',val:v0*(1+i*.1),form:'10-K',filed:(a+1)+'-02-15',fy:a,fp:'FY'}))
  .concat([{start:'2024-10-01',end:'2024-12-31',val:1,form:'10-K',filed:'2025-02-15'}]);
 const saldo=(v0)=>anos.map((a,i)=>({end:a+'-12-31',val:v0+i,form:'10-K',filed:(a+1)+'-02-15'}));
 const facts={'us-gaap':{Revenues:{units:{USD:fluxo(1000).filter(x=>!x.end.startsWith('2024'))}},RevenueFromContractWithCustomerExcludingAssessedTax:{units:{USD:fluxo(1000)}},NetIncomeLoss:{units:{USD:fluxo(100)}},StockholdersEquity:{units:{USD:saldo(500)}},
  Assets:{units:{USD:saldo(2000)}},CashAndCashEquivalentsAtCarryingValue:{units:{USD:saldo(50)}},LongTermDebt:{units:{USD:saldo(300)}},
  PaymentsOfDividends:{units:{USD:fluxo(-40)}},WeightedAverageNumberOfDilutedSharesOutstanding:{units:{shares:fluxo(10)}}}};
 globalThis.caches={default:{match:async()=>undefined,put:async()=>{}}};
 const orig=globalThis.fetch;
 globalThis.fetch=async(u)=>String(u).includes('company_tickers')?Response.json({0:{cik_str:320193,ticker:'AAPL'}}):Response.json({cik:320193,entityName:'Apple Inc.',facts});
 try{
  const w=(await import('../cloudflare/diario-screeners/index.mjs')).default;
  const r=await w.fetch(new Request('https://x.workers.dev/v1/sec-historico?ticker=AAPL'),{}, {waitUntil(){}});
  const j=await r.json();
  assert.equal(r.status,200);assert.equal(j.nome,'Apple Inc.');assert.deepEqual(Object.keys(j.anos),['2021','2022','2023','2024']);
  assert.equal(j.anos[2024].rec,1300);assert.equal(j.anos[2024].luc,130);assert.equal(j.anos[2024].pl,503);assert.equal(j.anos[2024].dvd,52);assert.equal(j.anos[2024].acoes,13);
  const bad=await w.fetch(new Request('https://x.workers.dev/v1/sec-historico?ticker=petr4!'),{}, {waitUntil(){}});assert.equal(bad.status,400);
 }finally{globalThis.fetch=orig}
});
test('v849: ranking denso no estilo planilha — preço justo, desconto, rankings, Fórmula Mágica, filtros rápidos e cabeçalho que ordena',()=>{
 const a=fs.readFileSync('src/analysis/analises.js','utf8');
 for(const r of [/function rankings\(m\)/,/Greenblatt/,/data-scr-sort=/,/data-scr-tg=/,/tgMag==='1'&&!\(rkm\?\.get\(r\.ticker\)\?\.mag<=30\)/,/scr849-bar/,/scr849-chip/,/th\('Preço justo'/,/th\('F\. Mágica','mag'/,/data-hf-market=/])assert.match(a,r);
 const h=fs.readFileSync('src/analysis/historico-fundamentos.js','utf8');assert.match(h,/\/v1\/sec-historico/);assert.match(h,/US\$ /);
 assert.match(fs.readFileSync('analises.css','utf8'),/\.scr849-table/);
});
