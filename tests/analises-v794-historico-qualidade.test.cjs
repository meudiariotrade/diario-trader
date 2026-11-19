'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../src/analysis/historico-qualidade-v794.js'),C=require('../src/analysis/feed-contract-v787.js');
const time=Date.parse('2026-11-19T12:00:00Z'),t0=Date.parse('2024-01-01T12:00:00Z');
const candles=Array.from({length:420},(_,i)=>{
 const t=Math.round((t0+i*86400000)/1000),c=80+i/10;return[t,c-1,c+2,c-2,c,10000]});
const payload=()=>({ok:true,ticker:'PETR4',market:'BR',tf:'1d',
 source:'Yahoo Finance histórico sujeito a atraso',fetchedAt:new Date(time).toISOString(),
 as_of:new Date(candles.at(-1)[0]*1000).toISOString(),candles});
const opts={ticker:'PETR4',market:'BR',tf:'1d',now:time,contract:C};
test('v794: aceita 400+ barras OHLCV com ticker/horário correspondente',()=>{
 const r=Q.audit(payload(),opts);assert.equal(r.valid,true);assert.equal(r.barCount,420);
});
test('v794: rejeita ticker, fonte ou as_of divergente',()=>{
 assert.equal(Q.audit({...payload(),ticker:'VALE3'},opts).valid,false);
 assert.equal(Q.audit({...payload(),as_of:'2025-02-01T00:00:00Z'},opts).valid,false);
 assert.equal(Q.audit({...payload(),source:''},opts).valid,false);
});
test('v794: não apresenta ajuste Yahoo como certificado',()=>{
 const r=Q.audit({...payload(),adjustedCandles:candles,adjustedVerified:false},opts);
 assert.equal(r.valid,true);assert.equal(r.adjustedCandles,null);
 assert.equal(r.adjustedVerified,false);
});
test('v794: rejeita snapshot posterior ao tempo de decisão',()=>{
 const r=Q.audit({...payload(),fetchedAt:'2026-11-20T13:00:00Z'},opts);
 assert.equal(r.valid,false);
});
test('v794: rejeita histórico truncado que não sustenta backtest diário',()=>{
 const r=Q.audit({...payload(),candles:candles.slice(-120)},opts);
 assert.equal(r.valid,false);
});
