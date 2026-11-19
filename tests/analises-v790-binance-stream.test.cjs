'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Binance=require('../src/analysis/binance-stream-v790.js');
const Feed=require('../src/analysis/feed-contract-v787.js');
let instances=[];
class FakeSocket{
 constructor(url){this.url=url;this.closed=false;instances.push(this)}
 close(){this.closed=true}
 receive(data){this.onmessage?.({data:JSON.stringify({stream:'btcusdt@miniTicker',data})})}
}
const make=()=>{instances=[];return Binance.create({contract:Feed,WebSocketImpl:FakeSocket})};
test('v790: uma conexão agregada com quatro pares permitidos, sem API key',()=>{
 const b=make();assert.equal(b.start(['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','SECRET']),true);
 assert.equal(instances.length,1);assert.match(instances[0].url,/^wss:\/\/stream\.binance\.com:9443\/stream\?streams=/);
 assert.doesNotMatch(instances[0].url,/SECRET|token|apiKey/i);
 assert.equal(b.status().pairs.length,4);b.stop();
});
test('v790: recebe miniTicker real com preço, horário e variação validada',()=>{
 const b=make();b.start(['BTCUSDT']);const now=Date.now(),w=instances[0];w.onopen?.();
 w.receive({e:'24hrMiniTicker',E:now,s:'BTCUSDT',c:'96000.50',o:'95000.00'});
 const q=b.get('BTCUSDT');
 assert.equal(q.ticker,'BTCUSDT');assert.equal(q.source,'binance');assert.equal(q.price,96000.5);
 assert.ok(q.change_pct>0);assert.equal(q.isLive,true);
 assert.equal(b.status().connected,true);b.stop();
});
test('v790: dados de ticker fora da assinatura não contaminam stream',()=>{
 const b=make();b.start(['BTCUSDT']);instances[0].receive({
 e:'24hrMiniTicker',E:Date.now(),s:'ETHUSDT',c:'5000',o:'4500'});
 assert.equal(b.get('ETHUSDT'),null);b.stop();
});
test('v790: nunca reabrir conexão via timer; stop cancela handlers e socket',()=>{
 const b=make();b.start(['BTCUSDT']);const ws=instances[0];
 b.stop();assert.equal(ws.closed,true);assert.equal(ws.onmessage,null);
 assert.equal(b.status().connected,false);assert.equal(b.status().active,false);
});
