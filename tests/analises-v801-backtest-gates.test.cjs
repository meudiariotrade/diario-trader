'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../src/analysis/backtest-gates-v801.js'),C=require('../src/analysis/feed-contract-v787.js');
const t0=Date.parse('2025-01-01T12:00:00Z');
const series=n=>Array.from({length:n},(_,i)=>{
 const p=70+i/20;return[Math.round((t0+i*86400000)/1000),p,p+1,p-1,p,1e5]});
test('v801: pelo menos 400 candles no diário, nunca homologar sem prova',()=>{
 const good=G.check(series(420),{market:'BR',tf:'1d',asOf:'2026-11-19',contract:C});
 assert.equal(good.eligible,true);assert.equal(good.adjustedVerified,false);
 assert.equal(G.check(series(350),{market:'BR',tf:'1d',asOf:'2026-11-19',contract:C}).eligible,false);
});
test('v801: janela as-of impede introduzir candles futuros no backtest',()=>{
 const r=G.check(series(420),{market:'US',tf:'1d',asOf:'2025-06-01',contract:C});
 assert.equal(r.eligible,false);assert.match(r.reason,/lookahead/);
});
test('v801: resultado insuficiente permanece N/D e não relata win rate fictício',()=>{
 const gate=G.check(series(100),{market:'BR',tf:'1d',contract:C});
 const out=G.unavailable(gate);
 assert.equal(Object.keys(out.setups).length,4);
 assert.ok(Object.values(out.setups).every(x=>x.winRate===null&&x.expectancyR===null));
});
