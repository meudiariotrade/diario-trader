'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v779 hotfix: OKX com 300 candles não interrompe busca por histórico Kraken diário completo',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 const source=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const worker=(await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source))).default;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 const urls=[];
 const now=Math.floor(Date.now()/1000);
 globalThis.fetch=async url=>{
  urls.push(String(url));
  if(String(url).includes('okx.com/api/v5/market/history-candles'))return Response.json({
   code:'0',data:Array.from({length:300},(_,i)=>[String((now-(302-i)*86400)*1000),
    '100','103','98','101','1000'])
  });
  if(String(url).includes('api.kraken.com/0/public/OHLC'))return Response.json({
   error:[],result:{XBTUSDT:Array.from({length:500},(_,i)=>[
    now-(500-i)*86400,'100','103','98','101','100','2000'
   ]),last:now}
  });
  return new Response('source regionally unavailable',{status:451});
 };
 try{
  const url='https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=CRYPTO&ticker=BTCUSDT&tf=1d';
  const resp=await worker.fetch(new Request(url),{}, {waitUntil:()=>{}});
  assert.equal(resp.status,200);
  const data=await resp.json();
  assert.equal(data.source,'Kraken Spot OHLC (USDT)');
  assert.equal(data.candles.length,500);
  assert.equal(data.adjustedVerified,false);
  assert.ok(urls.some(x=>x.includes('okx.com/api/v5/market/history-candles')));
  assert.ok(urls.some(x=>x.includes('api.kraken.com/0/public/OHLC')));
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
test('v779 hotfix: não homologar histórico diário menor que 400 quando todas fontes falham',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 const src=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const worker=(await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(src))).default;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 globalThis.fetch=async url=>{
  if(String(url).includes('okx.com/api/v5/market/history-candles'))return Response.json({code:'0',data:Array.from({length:300},(_,i)=>[
   String((Math.floor(Date.now()/86400000)-302+i)*86400000),'100','103','98','101','1000'
  ])});
  return new Response('Unavailable',{status:451});
 };
 try{
  const resp=await worker.fetch(new Request('https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=CRYPTO&ticker=BTCUSDT&tf=1d'),{}, {waitUntil:()=>{}});
  assert.notEqual(resp.status,200);
  const body=await resp.json();
  assert.ok(String(body.error).includes('incompleto'));
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
