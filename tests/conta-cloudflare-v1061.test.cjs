'use strict';
// A função "conta" roda no Worker (mesmo código do Supabase). Simula Supabase e diario-sync.
const test=require('node:test'),assert=require('node:assert/strict');
const mod=()=>import('../cloudflare/diario-noticias/funcoes-v1042.mjs');
const uid='11111111-1111-4111-8111-111111111111';
const jwt='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.assinatura';
const env={ALLOWED_ORIGIN:'https://meudiariotrade.github.io',SUPABASE_URL:'https://abc123.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc'};
const pedido=()=>new Request('https://worker.test/v1/fn/conta',{method:'POST',headers:{Origin:'https://meudiariotrade.github.io',Authorization:'Bearer '+jwt,'Content-Type':'application/json'},body:JSON.stringify({acao:'excluir',confirma:'EXCLUIR',senha:'certa'})});
function simula(syncStatus){
 const chamadas=[];
 global.fetch=async(url,init={})=>{
  const u=String(url),m=init.method||'GET';chamadas.push(m+' '+u);
  if(u.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'pessoa@exemplo.test'});
  if(u.includes('/auth/v1/token'))return Response.json({user:{id:uid}});
  if(u.includes('/storage/v1/object/list/'))return Response.json([]);
  if(u.includes('/rest/v1/'))return new Response(null,{status:204});
  if(u.includes('/v1/conta/excluir'))return new Response('{}',{status:syncStatus});
  if(u.includes('/auth/v1/admin/users/'))return new Response('{}',{status:200});
  return new Response('{}',{status:404});
 };
 return chamadas;
}
test('v1061: se a Cloudflare não apagar o diário/arquivos, o login NÃO é removido',async()=>{
 const {funcaoV1042}=await mod();const orig=global.fetch;
 try{
  const chamadas=simula(500);
  const r=await funcaoV1042(pedido(),env);
  assert.equal(r.status,500);
  assert.ok(chamadas.some(c=>c.includes('/v1/conta/excluir')));
  assert.ok(!chamadas.some(c=>c.includes('/auth/v1/admin/users/')),'login preservado para repetir a exclusão');
 }finally{global.fetch=orig}
});
test('v1061: com a Cloudflare limpa, remove o login por último',async()=>{
 const {funcaoV1042}=await mod();const orig=global.fetch;
 try{
  const chamadas=simula(200);
  const r=await funcaoV1042(pedido(),env);const j=await r.json();
  assert.equal(r.status,200,JSON.stringify(j));assert.equal(j.apagado.cloudflare,'ok');
  const iSync=chamadas.findIndex(c=>c.includes('/v1/conta/excluir')),iAuth=chamadas.findIndex(c=>c.includes('/auth/v1/admin/users/'));
  assert.ok(iSync>=0&&iAuth>iSync,'Cloudflare antes do login');
 }finally{global.fetch=orig}
});
