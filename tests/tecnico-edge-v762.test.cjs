'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Cloudflare: candles criptográficos sob demanda, TTL intradiário e sem tráfego Supabase',{concurrency:false},async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 const source=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const api=(await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source))).default;
 const memory=new Map(),calls=[];
 globalThis.caches={default:{
  match:async key=>memory.get(key.url)?.clone()||null,
  put:async(key,response)=>{memory.set(key.url,response.clone())}
 }};
 globalThis.fetch=async url=>{
  calls.push(String(url));
  if(!String(url).startsWith('https://api.binance.com/api/v3/klines?'))
   throw Error('Endpoint externo não autorizado: '+url);
  return Response.json(Array.from({length:300},(_,i)=>{
   const price=100+i*.1;
   return [1700000000000+i*3600000,String(price),String(price+1),String(price-1),String(price+.2),'8000'];
  }));
 };
 const ctx={waitUntil:p=>p.catch(()=>{})},env={SUPABASE_URL:'https://example.supabase.co'};
 try{
  const u='https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=CRYPTO&ticker=BTCUSDT&tf=15m';
  const first=await api.fetch(new Request(u),env,ctx);
  assert.equal(first.status,200);
  assert.match(first.headers.get('Cache-Control'),/max-age=300/);
  const payload=await first.json();
  assert.equal(payload.candles.length,300);
  assert.equal(payload.source,'Binance Klines');
  const second=await api.fetch(new Request(u),env,ctx);
  assert.equal(second.status,200);
  assert.equal(second.headers.get('X-Screeners-Cache'),'HIT');
  assert.equal(calls.length,1,'O segundo acesso deve ser servido pelo cache do Worker');
  for(const bad of [
   'https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=CRYPTO&ticker=FAKEUSDT&tf=15m',
   'https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=BR&ticker=PETR4&tf=2m',
   'https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=US&ticker=../../../&tf=1d'
  ]){const resp=await api.fetch(new Request(bad),env,ctx);assert.equal(resp.status,400)}
  assert.ok(calls.every(x=>!x.includes('supabase.co')));
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
