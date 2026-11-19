'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../src/analysis/feed-finnhub-v791.js');
const C=require('../src/analysis/feed-contract-v787.js');
const now=Date.parse('2026-11-19T12:00:00Z');
test('v791: preço de trade US exige horário do provedor, não hora do cache',()=>{
 const old={'FH:AAPL':{px:240,up:'2026-11-19T11:59:59Z'}};
 assert.equal(F.fromCache('AAPL',old,C,now),null);
});
test('v791: lê trade Finnhub com timestamp original e sem inventar variação',()=>{
 const data={'FH:AAPL':{px:240.52,horarioPreco:'2026-11-19T11:59:55Z',Authorization:'segredo'}};
 const q=F.fromCache('AAPL',data,C,now);
 assert.equal(q.ticker,'AAPL');assert.equal(q.price,240.52);
 assert.equal(q.source,'finnhub');assert.equal(q.isLive,true);
 assert.equal(q.change_pct,null);assert.equal(q.Authorization,undefined);
});
test('v791: não mistura tickers, período futuro nem atribui dado em tempo real a cache antigo',()=>{
 const rows={'FH:AAPL':{px:200,horarioPreco:'2026-11-19T11:50:00Z'},
  'FH:MSFT':{px:350,horarioPreco:'2026-11-19T12:02:00Z'}};
 assert.equal(F.fromCache('AAPL',rows,C,now).stale,true);
 assert.equal(F.fromCache('MSFT',rows,C,now),null);
 assert.equal(F.fromCache('TSLA',rows,C,now),null);
});
