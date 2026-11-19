'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const contract=require('../src/analysis/feed-contract-v787.js');
const profit=require('../src/analysis/feed-profit-v788.js');
const now=Date.parse('2026-11-19T12:00:00Z');
test('v788: converte snapshot Profit da ponte existente sem buscar pela rede',()=>{
 const quote=profit.normalizeEntry({tk:'PETR4',px:24.12,d1:1.2,em:'2026-11-19T11:59:58Z'},'PETR4',contract,now);
 assert.equal(quote.ticker,'PETR4');assert.equal(quote.source,'profit-local');assert.equal(quote.isLive,true);
});
test('v788: qualquer dado sem timestamp oficial não vira cotação em tempo real',()=>{
 assert.equal(profit.normalizeEntry({tk:'PETR4',px:24.12},'PETR4',contract,now),null);
 assert.equal(profit.normalizeEntry({tk:'PETR4',px:-1,em:'2026-11-19T11:59:50Z'},'PETR4',contract,now),null);
});
test('v788: @WIN é alias interno e nunca deve virar ativo negociado',()=>{
 assert.equal(profit.normalizeEntry({tk:'@WIN',px:500,em:'2026-11-19T11:59:58Z'},'@WIN',contract,now),null);
 const q=profit.normalizeEntry({tk:'WINZ26',px:500,em:'2026-11-19T11:59:58Z'},'WINZ26',contract,now);
 assert.equal(q.ticker,'WINZ26');
});
test('v788: cache local usa último salvo se feed vivo estiver ausente, com selo antigo',()=>{
 const snapshot={pf:{},saved:{PETR4:{tk:'PETR4',px:24.5,d1:1,em:'2026-11-19T11:50:00Z'}}};
 const r=profit.readFromCache(snapshot,contract,now,'PETR4');
 assert.equal(r.stale,true);assert.equal(r.quality,'ANTIGO');
});
test('v788: cache não vaza dados de carteira ou secrets para o quote público',()=>{
 const src={pf:{PETR4:{tk:'PETR4',px:23,d1:2,em:'2026-11-19T11:59:59Z',
  user_id:'private-id',Authorization:'secret',quantidade:1200}},saved:{}};
 const q=profit.readFromCache(src,contract,now,'PETR4');
 assert.equal(q.user_id,undefined);assert.equal(q.Authorization,undefined);assert.equal(q.quantidade,undefined);
});
