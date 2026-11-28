'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const mod=()=>import('../cloudflare/diario-noticias/funcoes-v1042.mjs');
const env={ALLOWED_ORIGIN:'https://meudiariotrade.github.io',SUPABASE_URL:'https://abc123.supabase.co',SUPABASE_ANON_KEY:'anon'};
const req=(nome,init={})=>new Request('https://worker.test/v1/fn/'+nome,{headers:{Origin:'https://meudiariotrade.github.io',...(init.headers||{})},...init});
test('lista as funções das fases A e B (v1054)',async()=>{
 const {FUNCOES_V1042}=await mod();
 assert.deepEqual([...FUNCOES_V1042].sort(),['analise','aulas','conhecimento-ia','finnhub-token','logos','mesa','mesa-macro','resumo','revista-ia','sazonal-extras','screener','series','terminal']);
});
test('fase B: sem as chaves no Worker responde 503 para o app voltar à origem anterior',async()=>{
 const {funcaoV1042,faltamSegredosV1054}=await mod();
 const r=await funcaoV1042(req('analise',{method:'POST',body:'{}'}),{SUPABASE_URL:'https://abc123.supabase.co'});
 assert.equal(r.status,503);assert.match(r.headers.get('cache-control')||'',/no-store/);
 assert.equal(faltamSegredosV1054('analise',{SUPABASE_URL:'u',SUPABASE_ANON_KEY:'a',SUPABASE_SERVICE_ROLE_KEY:'s',GEMINI_API_KEY:'g'}),0);
 assert.equal(faltamSegredosV1054('logos',{}),0,'logos não precisa de chave');
});
test('fase B: módulos carregam e respondem ao preflight sem cache público',async()=>{
 const {funcaoV1042}=await mod();
 const cheio={...env,SUPABASE_SERVICE_ROLE_KEY:'s',GEMINI_API_KEY:'g'};
 for(const nome of ['analise','resumo','revista-ia','conhecimento-ia','aulas','mesa','logos','series','screener']){
  const r=await funcaoV1042(req(nome,{method:'OPTIONS'}),cheio);
  assert.ok(r.status===204||r.status===200,nome+' status '+r.status);
  assert.match(r.headers.get('cache-control')||'',/no-store|private/,nome);
 }
});
test('rota fora da camada devolve null e função não migrada devolve 404',async()=>{
 const {funcaoV1042}=await mod();
 assert.equal(await funcaoV1042(new Request('https://worker.test/v1/noticias'),env),null);
 const r=await funcaoV1042(req('notificar',{method:'POST',body:'{}'}),env);
 assert.equal(r.status,404,'notificar (push) fica para a fase C');
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
test('v1054: URL e chave pública do Supabase usam os valores públicos do app quando faltam no Worker',async()=>{
 const {faltamSegredosV1054}=await mod();
 assert.equal(faltamSegredosV1054('revista-ia',{}),0);
 assert.equal(faltamSegredosV1054('aulas',{}),0);
 assert.equal(faltamSegredosV1054('analise',{}),2,'sem service role e sem Gemini continua bloqueado');
});
