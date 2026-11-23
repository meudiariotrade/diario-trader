const test=require('node:test');
const assert=require('node:assert/strict');
test('v896: cache KV público é compartilhado entre regiões, sem retornar ao Supabase',async t=>{
 const {default:worker}=await import('../cloudflare/diario-screeners/index.mjs');
 const {refreshMarket}=await import('../cloudflare/diario-screeners/snapshot-cache-v896.mjs');
 const kv=new Map(),env={SCREENER_CACHE:{
   getWithMetadata:async key=>kv.get(key)||{value:null,metadata:null},
   put:async(key,value,{metadata})=>kv.set(key,{value,metadata})}};
 const previous=globalThis.caches;
 t.after(()=>{globalThis.caches=previous});
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 t.mock.method(globalThis,'fetch',async()=>{throw Error('Um clique do usuário não deve chamar a origem');});
 const url='https://example.com/v1/screeners?market=BR';
 const before=await worker.fetch(new Request(url),env,{waitUntil:()=>{}});
 assert.equal(before.status,503);
 assert.equal((await before.json()).semFallbackSupabase,true);
 await refreshMarket('BR',env,async()=>Response.json({ok:true,market:'BR',rows:[{ticker:'PETR4'}],
  universe_complete:true,universe_rows:[{ticker:'PETR4'}],last_update:new Date().toISOString()}));
 const first=await worker.fetch(new Request(url),env,{waitUntil:()=>{}});
 assert.equal(first.status,200);
 assert.equal(first.headers.get('X-Snapshot-Tier'),'kv');
 const tag=first.headers.get('ETag');assert.ok(tag);
 const another=await worker.fetch(new Request(url,{headers:{'If-None-Match':tag}}),env,{waitUntil:()=>{}});
 assert.equal(another.status,304);assert.equal(another.headers.get('X-Snapshot-Tier'),'kv');
 assert.equal(fetch.mock.callCount(),0,'GET da interface nunca chama Supabase');
 const stored=kv.get('universe:v2:BR');stored.metadata.generatedAt=new Date(Date.now()-3*86400000).toISOString();
 const stale=await worker.fetch(new Request(url),env,{waitUntil:()=>{}});
 assert.equal(stale.status,200);
 assert.equal(stale.headers.get('X-Snapshot-Stale'),'1');
 assert.equal(stale.headers.get('Cache-Control'),'no-store');
});
