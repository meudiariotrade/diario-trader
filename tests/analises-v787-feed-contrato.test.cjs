'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../src/analysis/feed-contract-v787.js');
const now=Date.parse('2026-11-19T12:00:00Z');
test('v787: normaliza BR, EUA e pares cripto sem colapsar contratos futuros',()=>{
 assert.equal(F.ticker('PETR4.SA','BR'),'PETR4');
 assert.equal(F.ticker('WINZ26','BR'),'WINZ26');
 assert.equal(F.ticker('BRK.B','US'),'BRK.B');
 assert.equal(F.ticker('BTC/USDT','CRYPTO'),'BTCUSDT');
 assert.equal(F.ticker('AB CD','US'),null);
});
test('v787: preço sem horário ou com futuro não entra em tempo real',()=>{
 assert.equal(F.quote({market:'BR',ticker:'PETR4',price:25,source:'profit-local',timestamp:now+120000},{now}).valid,false);
 assert.equal(F.quote({market:'BR',ticker:'PETR4',price:-10,source:'profit-local',timestamp:now},{now}).valid,false);
});
test('v787: fonte indicativa nunca recebe selo em tempo real',()=>{
 const a=F.quote({market:'BR',ticker:'PETR4',price:20,source:'tradingview',timestamp:now},{now});
 const b=F.quote({market:'BR',ticker:'PETR4',price:20,source:'profit-local',timestamp:now},{now});
 assert.equal(a.isLive,false);assert.equal(a.quality,'INDICATIVO');
 assert.equal(b.isLive,true);assert.equal(b.quality,'EM TEMPO REAL');
});
test('v787: fallback serve preço válido e não prioriza preço do Profit antigo',()=>{
 const quotes=[
  {market:'BR',ticker:'PETR4',price:20,source:'profit-local',timestamp:now-300000},
  {market:'BR',ticker:'PETR4',price:21,source:'cloudflare',timestamp:now-60000}];
 const r=F.choose(quotes,'BR',{now});
 assert.equal(r.selected.source,'cloudflare');
 assert.equal(r.selected.price,21);
 assert.equal(r.selected.isLive,false);
});
test('v787: série técnica diária exige 400 OHLCV e falha com candle duplicado',()=>{
 const candles=Array.from({length:400},(_,i)=>[Math.floor(now/1000)-(400-i)*86400,20,21,19,20.5,1000]);
 assert.equal(F.series(candles).valid,true);
 assert.equal(F.series(candles.slice(10)).valid,false);
 assert.equal(F.series([...candles,candles[0]]).valid,false);
});


test('v787: fallback de um ativo jamais aproveita cotação de outro',()=>{
 const quotes=[
  {market:'BR',ticker:'PETR4',price:20,source:'profit-local',timestamp:now},
  {market:'BR',ticker:'VALE3',price:50,source:'cloudflare',timestamp:now}];
 assert.equal(F.choose(quotes,'BR',{now}).selected,null);
 assert.equal(F.choose(quotes,'BR',{now,ticker:'PETR4'}).selected.ticker,'PETR4');
 assert.equal(F.choose(quotes,'BR',{now,ticker:'ITUB4'}).selected,null);
});
