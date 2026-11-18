#!/usr/bin/env node
'use strict';
/* Smoke test público da rota técnica Cloudflare após deploy. Sem Supabase e sem segredos. */
const {setTimeout:delay}=require('node:timers/promises');
const origin=String(process.env.DIARIO_TECNICO_EDGE_ORIGIN||'https://diario-screeners-quant.lucianosilva43567.workers.dev').replace(/\/$/,'');
async function check(ticker,market,tf,min){
 const url=origin+'/v1/tecnico-candles?market='+market+'&ticker='+ticker+'&tf='+tf;
 let last;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(18000),cache:'no-store'});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw Error('HTTP '+response.status+': '+String(body.error||'sem detalhe').slice(0,110));
   if(body.ok!==true||body.market!==market||body.ticker!==ticker||body.tf!==tf)throw Error('Cabeçalhos de mercado, ticker ou timeframe divergentes');
   if(!Array.isArray(body.candles)||body.candles.length<min)throw Error('Histórico menor que '+min+' barras');
   if(!body.candles.every(c=>Array.isArray(c)&&c.length===6&&c.every(Number.isFinite)&&c[3]>0&&c[2]>=c[3]&&c[5]>=0))
    throw Error('OHLCV inconsistente');
   const cache=response.headers.get('Cache-Control')||'';
   if(!/max-age=(300|900)/.test(cache))throw Error('TTL da borda inválido: '+cache);
   process.stdout.write('VALIDADO '+ticker+' '+tf+': '+body.candles.length+' barras, fonte '+body.source+', '+cache+'\n');
   return;
  }catch(e){last=e;if(attempt<3)await delay(3000)}
 }
 throw Error(ticker+'/'+tf+': '+String(last?.message||last));
}
(async()=>{
 if(!/^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(origin))throw Error('Origem da borda não autorizada');
 await check('BTCUSDT','CRYPTO','15m',210);
 await check('BTCUSDT','CRYPTO','1d',252);
 await check('PETR4','BR','1d',252);
 await check('AAPL','US','1d',252);
})().catch(e=>{console.error('Gate Cloudflare falhou: '+e.message);process.exitCode=1});
