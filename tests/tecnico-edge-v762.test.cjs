'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Cloudflare: candles criptográficos sob demanda, TTL intradiário e sem tráfego Supabase',{concurrency:false},async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 const source=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const api=(await import('../cloudflare/diario-screeners/index.mjs?test=v762-1')).default;
 const memory=new Map(),calls=[];
 globalThis.caches={default:{
  match:async key=>memory.get(key.url)?.clone()||null,
  put:async(key,response)=>{memory.set(key.url,response.clone())}
 }};
 globalThis.fetch=async url=>{
  calls.push(String(url));
  if(!String(url).startsWith('https://data-api.binance.vision/api/v3/klines?'))
   throw Error('Endpoint externo não autorizado: '+url);
  return Response.json(Array.from({length:300},(_,i)=>{
   const price=100+i*.1;
   return [Date.now()-(302-i)*900000,String(price),String(price+1),String(price-1),String(price+.2),'8000'];
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


test('Cloudflare: quando Binance responde 451, Bybit Spot fornece barras reais ordenadas e sem Supabase',{concurrency:false},async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches,calls=[];
 const source=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const api=(await import('../cloudflare/diario-screeners/index.mjs?test=v762-2')).default;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 globalThis.fetch=async url=>{
  calls.push(String(url));
  if(String(url).startsWith('https://api.binance.com/')||String(url).startsWith('https://data-api.binance.vision/'))return new Response('Unavailable for legal reasons',{status:451});
  if(String(url).startsWith('https://api.bybit.com/'))return Response.json({
   retCode:0,result:{list:Array.from({length:300},(_,i)=>{
    const price=200+(300-i)*.3;
    return [String(Date.now()-(i+2)*900000),String(price),String(price+1),String(price-1),String(price+.2),'8900'];
   })}
  });
  throw Error('Sem outras fontes esperadas');
 };
 try{
  const url='https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=CRYPTO&ticker=BTCUSDT&tf=15m';
  const resp=await api.fetch(new Request(url),{}, {waitUntil:()=>{}});
  assert.equal(resp.status,200);
  const body=await resp.json();
  assert.equal(body.source,'Bybit Spot Klines');
  assert.equal(body.candles.length,300);
  assert.ok(body.candles.every((c,i)=>i===0||c[0]>body.candles[i-1][0]));
  assert.ok(body.candles.every(c=>c[1]>0&&c[2]>=c[4]&&c[3]<=c[4]&&c[5]>0));
  assert.equal(calls.length,3);
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});


test('Cloudflare: B3 usa histórico real da brapi quando Yahoo bloqueia',{concurrency:false},async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches,calls=[];
 const src=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const api=(await import('../cloudflare/diario-screeners/index.mjs?test=v762-3')).default;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 globalThis.fetch=async url=>{
  calls.push(String(url));
  if(String(url).includes('finance.yahoo.com/'))return new Response('',{status:429});
  if(String(url).startsWith('https://brapi.dev/api/quote/PETR4?'))return Response.json({
   results:[{symbol:'PETR4',historicalDataPrice:Array.from({length:440},(_,i)=>({
    date:Math.floor((Date.now()-(441-i)*86400000)/1000),open:30+i*.05,high:31+i*.05,low:29+i*.05,close:30.5+i*.05,volume:1000000
   }))}]
  });
  throw Error('Endpoint não previsto');
 };
 try{
  const resp=await api.fetch(new Request('https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=BR&ticker=PETR4&tf=1d'),{}, {waitUntil:()=>{}});
  assert.equal(resp.status,200);
  const data=await resp.json();
  assert.match(data.source,/brapi.dev/);
  assert.equal(data.candles.length,440);
  assert.ok(calls.some(x=>x.startsWith('https://brapi.dev/')));
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
test('Cloudflare: ação EUA recorre a histórico Nasdaq EOD sem sintetizar barras intradiárias',{concurrency:false},async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 const src=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const api=(await import('../cloudflare/diario-screeners/index.mjs?test=v762-4')).default;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 globalThis.fetch=async url=>{
  if(String(url).includes('finance.yahoo.com/'))return new Response('',{status:429});
  if(String(url).includes('api.nasdaq.com/api/quote/AAPL/historical'))return Response.json({data:{tradesTable:{rows:
   Array.from({length:440},(_,i)=>({
    date:new Date(Date.now()-(441-i)*86400000).toISOString().slice(0,10),
    open:'$'+(100+i*.1).toFixed(2),high:'$'+(101+i*.1).toFixed(2),
    low:'$'+(99+i*.1).toFixed(2),close:'$'+(100.5+i*.1).toFixed(2),volume:'1,000,000'
   }))
  }}});
  throw Error('Endpoint não previsto');
 };
 try{
  const resp=await api.fetch(new Request('https://diario-screeners-quant.example.workers.dev/v1/tecnico-candles?market=US&ticker=AAPL&tf=1d'),{}, {waitUntil:()=>{}});
  assert.equal(resp.status,200);
  const data=await resp.json();
  assert.match(data.source,/Nasdaq EOD/);
  assert.equal(data.candles.length,440);
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches}
});
