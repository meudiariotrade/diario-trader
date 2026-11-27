'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const mod=()=>import('../cloudflare/diario-noticias/funcoes-v1042.mjs');
const env={ALLOWED_ORIGIN:'https://meudiariotrade.github.io',SUPABASE_URL:'https://abc123.supabase.co',SUPABASE_ANON_KEY:'anon'};
const req=(nome,init={})=>new Request('https://worker.test/v1/fn/'+nome,{headers:{Origin:'https://meudiariotrade.github.io',...(init.headers||{})},...init});
test('lista só as funções públicas da fase A',async()=>{
 const {FUNCOES_V1042}=await mod();
 assert.deepEqual([...FUNCOES_V1042].sort(),['finnhub-token','mesa-macro','sazonal-extras','terminal']);
});
test('rota fora da camada devolve null e função não migrada devolve 404',async()=>{
 const {funcaoV1042}=await mod();
 assert.equal(await funcaoV1042(new Request('https://worker.test/v1/noticias'),env),null);
 const r=await funcaoV1042(req('notificar',{method:'POST',body:'{}'}),env);
 assert.equal(r.status,404);
});
test('handlers reais registram via Deno.serve e respondem ao preflight sem cache público',async()=>{
 const {funcaoV1042}=await mod();
 for(const nome of ['sazonal-extras','mesa-macro','terminal','finnhub-token']){
  const r=await funcaoV1042(req(nome,{method:'OPTIONS'}),env);
  assert.ok(r.status===204||r.status===200,nome+' status '+r.status);
  assert.match(r.headers.get('cache-control')||'',/no-store|private/,nome);
 }
});
test('finnhub-token sem login não entrega a chave',async()=>{
 const {funcaoV1042}=await mod();
 const orig=global.fetch;global.fetch=async()=>new Response('{}',{status:401});
 try{
  const r=await funcaoV1042(req('finnhub-token',{method:'POST',body:'{}',headers:{'Content-Type':'application/json'}}),{...env,FINNHUB_API_KEY:'segredo-finnhub'});
  assert.ok(r.status>=400,'status '+r.status);
  assert.doesNotMatch(await r.text(),/segredo-finnhub/);
 }finally{global.fetch=orig}
});
