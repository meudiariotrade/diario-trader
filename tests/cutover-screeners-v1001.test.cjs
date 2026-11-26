'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
const snippet=src.slice(src.indexOf('function scCalcular('),src.indexOf('function scUi()'));
function runtime(fn){return vm.runInNewContext(snippet+'\n({scFetch,scCalcular})',{fetch:fn,URLSearchParams,AbortSignal,scB3:s=>/^[A-Z]{4}\d{1,2}$/.test(s),Set,Number,Math,Promise,Error,String})}
test('scanner usa somente Cloudflare e mantém médias, estado, série e último preço',async()=>{
 const calls=[],closes=Array.from({length:260},(_,i)=>100+i);
 const x=runtime(async(url,opt)=>{calls.push({url,opt});const sym=new URL(url).searchParams.get('t');return Response.json({chart:{result:[{meta:{symbol:sym,regularMarketPrice:360,regularMarketTime:1795650000},indicators:{quote:[{close:closes}]}}]}})});
 const out=await x.scFetch(['PETR4','^BVSP','BRL=X','PETR4'],true);
 assert.equal(out.data.length,3);assert.equal(out.data[0].state,'alta');assert.equal(out.data[0].px,360);assert.equal(out.data[0].series.c.length,120);assert.equal(out.data[0].ma[20],349.55);
 assert.equal(new URL(calls[0].url).searchParams.get('t'),'PETR4.SA');
 assert.equal(new URL(calls[1].url).searchParams.get('t'),'^BVSP');
 assert.ok(calls.every(c=>new URL(c.url).hostname==='diario-trader.lucianosilva43567.workers.dev'&&c.opt.credentials==='omit'&&!c.opt.headers.Authorization&&!c.opt.headers.apikey));
});
test('falha, ticker divergente e histórico insuficiente não voltam ao Supabase',async()=>{
 const calls=[];const x=runtime(async(url)=>{calls.push(url);return Response.json({chart:{result:[{meta:{symbol:'OTHER'},indicators:{quote:[{close:[10]}]}}]}})});
 const out=await x.scFetch(['PETR4','AAPL'],false);assert.ok(out.data.every(z=>!z.ok));assert.equal(calls.length,2);assert.ok(calls.every(u=>u.includes('workers.dev')));
 assert.equal(x.scCalcular('PETR4',[1,2,3],false).ok,false);
});
test('snapshot fundamentalista não possui fallback Supabase',()=>{
 const src=fs.readFileSync('src/analysis/analises.js','utf8'),cf=fs.readFileSync('cloudflare/diario-screeners/snapshot-cache-v896.mjs','utf8');
 assert.match(src,/const endpoints=\[\{url:edgeUrl\+path,edge:true\}\]/);
 assert.doesNotMatch(cf,/functions\/v1\/screeners-quant/);
 assert.doesNotMatch(snippet,/functions\/v1|Authorization|apikey/);
});
