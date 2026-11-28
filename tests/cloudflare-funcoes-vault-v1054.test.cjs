'use strict';
// Arquivo próprio: o Vault é cacheado por processo (10 min), então este teste não pode dividir processo com outros.
const test=require('node:test'),assert=require('node:assert/strict');
const mod=()=>import('../cloudflare/diario-noticias/funcoes-v1042.mjs');
const req=(nome,init={})=>new Request('https://worker.test/v1/fn/'+nome,{headers:{Origin:'https://meudiariotrade.github.io',...(init.headers||{})},...init});
test('v1054: chave de IA vinda do Vault do Supabase libera analise no Worker (sem copiar segredo)',async()=>{
 const {funcaoV1042}=await mod();
 const orig=global.fetch;const chamadas=[];
 global.fetch=async(url,init)=>{chamadas.push(String(url));if(String(url).endsWith('/rest/v1/rpc/ia_chaves'))return new Response(JSON.stringify({GEMINI_API_KEY:'chave-do-vault'}),{status:200,headers:{'Content-Type':'application/json'}});return new Response('{}',{status:401})};
 try{
  const r=await funcaoV1042(req('analise',{method:'OPTIONS'}),{SUPABASE_URL:'https://abc123.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'svc'});
  assert.notEqual(r.status,503,'com o Vault a função roda no Worker');
  assert.ok(chamadas.some(u=>u.endsWith('/rest/v1/rpc/ia_chaves')));
  assert.doesNotMatch(await r.text(),/chave-do-vault/);
 }finally{global.fetch=orig}
});
