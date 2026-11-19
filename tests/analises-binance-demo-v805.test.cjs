'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Binance=require('../src/analysis/binance-stream-v790.js');
const Feed=require('../src/analysis/feed-contract-v787.js');
test('QA v805: Analises não abre rede Binance em modo demonstração',()=>{
 const old=globalThis.DIARIO_DEMO,ws=[];
 globalThis.DIARIO_DEMO=true;
 try{
  class FakeSocket{constructor(url){ws.push(url)} close(){}}
  const b=Binance.create({contract:Feed,WebSocketImpl:FakeSocket});
  assert.equal(b.start(['BTCUSDT','ETHUSDT']),false);
  assert.equal(ws.length,0);
  assert.equal(b.status().active,false);
 }finally{
  if(old===undefined)delete globalThis.DIARIO_DEMO;
  else globalThis.DIARIO_DEMO=old;
 }
});
