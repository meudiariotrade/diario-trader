const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const mod=import(pathToFileURL(path.resolve('cloudflare/diario-screeners/snapshot-cache-v896.mjs')).href);
function makeKV(){const entries=new Map();return {entries,
  async put(key,value,opts){entries.set(key,{value,metadata:opts.metadata})},
  async getWithMetadata(key){return entries.get(key)||{value:null,metadata:null}}};}
function sample(m){return {ok:true,market:m,pipeline_origin:'github-actions-public',universe_complete:true,universe_rows:[{ticker:m==='BR'?'PETR4':'AAPL'}],
 rows:[{ticker:'T'}],last_update:new Date().toISOString(),total:1};}
test('atualiza BR/US e atende todos os GETs direto do KV',async()=>{
 const a=await mod,kv=makeKV();let calls=0;
 await a.refreshBoth({SCREENER_CACHE:kv},async url=>{calls++;return Response.json(sample(new URL(url).searchParams.get('market')))});
 assert.equal(calls,2);
 const req=new Request('https://edge.example/v1/screeners?market=BR&snapshot=1&universe=1');
 const result=await a.servePublicSnapshot(req,{SCREENER_CACHE:kv},null,null);
 assert.equal(result.status,200);assert.equal(result.headers.get('X-Snapshot-Source'),'cloudflare-kv-public-v896');
 assert.equal((await result.json()).universe_rows[0].ticker,'PETR4');
 assert.equal(calls,2,'requisição do usuário não chama Supabase');
 const r304=await a.servePublicSnapshot(new Request(req.url,{headers:{'If-None-Match':result.headers.get('ETag')}}),{SCREENER_CACHE:kv},null,null);
 assert.equal(r304.status,304);
});
test('falha do CRON não apaga último snapshot',async()=>{
 const a=await mod,kv=makeKV(),entry={value:JSON.stringify(sample('US')),metadata:{fetchedAt:Date.now(),
 expiresAt:Date.now()+10000,generatedAt:new Date().toISOString(),etag:'"old"'}};
 kv.entries.set('universe:v2:US',entry);
 await assert.rejects(()=>a.refreshMarket('US',{SCREENER_CACHE:kv},async()=>new Response('upstream',{status:503})));
 assert.deepEqual(kv.entries.get('universe:v2:US'),entry);
});
test('snapshot ausente/privado não volta à origem',async()=>{
 const a=await mod,kv=makeKV();
 const r=await a.servePublicSnapshot(new Request('https://edge.example/v1/screeners?market=BR'),{SCREENER_CACHE:kv},null,null);
 assert.equal(r.status,503);assert.equal((await r.json()).semFallbackSupabase,true);
 const bad=await a.servePublicSnapshot(new Request('https://edge.example/v1/screeners?market=BR&owned=PETR4'),{SCREENER_CACHE:kv},null,null);
 assert.equal(bad.status,400);
 await assert.rejects(()=>a.refreshMarket('BR',{SCREENER_CACHE:kv},async()=>Response.json({...sample('BR'),user_id:'private'})));
 const front=fs.readFileSync('src/analysis/analises.js','utf8');
 assert.equal(front.includes("c.url+'/functions/v1/screeners-quant'"),false);
 const worker=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 assert.equal(worker.includes("origin+'/functions/v1/screeners-quant"),false);
 const conf=JSON.parse(fs.readFileSync('cloudflare/diario-screeners/wrangler.jsonc','utf8'));
 assert.ok(conf.triggers.crons.includes(a.SCREENER_CRON));
});
test('antiguidade real é sinalizada, sem falsear atualidade',async()=>{
 const a=await mod,kv=makeKV();kv.entries.set('universe:v2:BR',{value:JSON.stringify(sample('BR')),
 metadata:{fetchedAt:Date.now(),expiresAt:Date.now()+3600000,
 generatedAt:new Date(Date.now()-3*86400000).toISOString(),etag:'"test"'}});
 const r=await a.servePublicSnapshot(new Request('https://edge.example/v1/screeners?market=BR'),{SCREENER_CACHE:kv},null,null);
 assert.equal(r.status,200);assert.equal(r.headers.get('X-Snapshot-Stale'),'1');
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
