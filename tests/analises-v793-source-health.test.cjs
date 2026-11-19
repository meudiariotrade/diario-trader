'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../src/analysis/source-health-v793.js'),C=require('../src/analysis/feed-contract-v787.js');
const now=Date.parse('2026-11-19T14:00:00Z');
const quote=(ticker,market,source,age=4000)=>C.quote({
 ticker,market,source,price:10,change_pct:null,timestamp:now-age},{now});
test('v793: não mistura tickers nem mercados, mesmo que um provedor informe ticker diferente',()=>{
 const service=H.create({contract:C,providers:{BR:[{get:()=>quote('VALE3','BR','profit-local')}] }});
 assert.equal(service.assess('PETR4','BR',now).selected,null);
 assert.equal(service.assess('PETR4','BR',now).sources,0);
});
test('v793: última cotação antiga é rotulada ANTIGO, nunca realtime',()=>{
 const service=H.create({contract:C,providers:{BR:[{get:()=>quote('PETR4','BR','profit-local',40000)}]}});
 const q=service.assess('PETR4','BR',now);
 assert.equal(q.quality,'ANTIGO');assert.equal(q.selected.isLive,false);assert.equal(q.stale,true);
});
test('v793: aceita somente a origem autorizada do próprio mercado e valida timestamps',()=>{
 const service=H.create({contract:C,providers:{US:[{get:()=>quote('AAPL','US','binance')},
  {get:()=>quote('AAPL','US','finnhub')}] }});
 const q=service.assess('AAPL','US',now);
 assert.equal(q.selected.source,'finnhub');assert.equal(q.sources,1);
});
test('v793: não abre rede nem lança exceção por provedor inativo',()=>{
 const service=H.create({contract:C,providers:{CRYPTO:[{get:()=>{throw Error('offline')}}]}});
 assert.equal(service.assess('BTCUSDT','CRYPTO',now).quality,'INDISPONÍVEL');
});
