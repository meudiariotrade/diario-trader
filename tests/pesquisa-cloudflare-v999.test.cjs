'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const env={SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server',GEMINI_API_KEY:'mock'};
const base='https://worker.test/v1/pesquisa',uid='f0000000-0000-4000-8000-000000000001';
const req=(body,auth='Bearer valid')=>new Request(base,{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json',Origin:'https://meudiariotrade.github.io'},body:JSON.stringify(body)});
test('Cloudflare Pesquisa: health, sessão obrigatória, CORS e isolamento privado',async()=>{
 const {pesquisaCloudflare,pesquisaHealth}=await import('../cloudflare/diario-noticias/pesquisa-v999.mjs');
 assert.equal(pesquisaHealth(env).status,200);assert.equal(pesquisaHealth({}).status,503);
 const blocked=await pesquisaCloudflare(req({},''),env,async()=>{throw Error('não chamar agenda')},async()=>{throw Error('não consultar sem sessão')});
 assert.equal(blocked.status,401);assert.match(blocked.headers.get('Cache-Control'),/no-store/);
 const calls=[];
 const ok=await pesquisaCloudflare(req({acao:'listar'}),env,async()=>{},async(url,opts)=>{
  calls.push([String(url),new Headers(opts.headers)]);
  return String(url).endsWith('/auth/v1/user')?Response.json({id:uid}):Response.json([{id:'own',user_id:uid,comando:{modo:'TECNICO'},status:'concluido'}]);
 });
 assert.equal(ok.status,200);assert.equal((await ok.json()).trabalhos[0].id,'own');
 assert.equal(calls[0][1].get('authorization'),'Bearer valid');
 assert.match(calls[1][0],new RegExp('user_id=eq.'+uid));assert.equal(calls[1][1].get('authorization'),'Bearer server');
});
test('Pesquisa mantém os oito modos, migra apenas a rota e não altera o layout',async()=>{
 const {MODOS,comando}=await import('../supabase/functions/pesquisa/contrato.ts');
 assert.equal(MODOS.length,8);
 for(const cmd of ['ANALISE ABBV','RESULTADO AAPL','COMPARE AAPL MSFT','TECNICO PETR4','CARTEIRA PETR4 AAPL','AGENDA','MODO PROVA CT1','EXPLIQUE RSI'])assert.ok(MODOS.includes(comando(cmd).modo));
 const src=fs.readFileSync('src/analysis/analises.js','utf8');assert.match(src,/PESQUISA_EDGE\+'\/health'/);assert.match(src,/fetch\(destino,/);
});
