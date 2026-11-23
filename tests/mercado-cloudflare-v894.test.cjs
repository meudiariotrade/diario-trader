const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const SOURCE=fs.readFileSync(path.resolve(__dirname,'../src/shared/mercado-cloudflare-v894.js'),'utf8');
const SB='https://vdzwydizostutukppcsj.supabase.co/functions/v1/';
const CF='https://diario-trader.lucianosilva43567.workers.dev/v1/';
function ambiente(publico){
 const chamadas=[];
 const fetchNativo=async(input,opts={})=>{
  const url=typeof input==='string'?input:input.url;
  chamadas.push({url,opts});
  if(url.startsWith(CF)){
   const x=await publico(url,opts);
   return new Response(JSON.stringify(x.data),{status:x.status||200,headers:{'content-type':'application/json'}});
  }
  return Response.json({from:'supabase',ok:true});
 };
 const window={fetch:fetchNativo};
 vm.runInNewContext(SOURCE,{window,URL,URLSearchParams,Response,Request,Set,Number,String,Object,console,AbortSignal});
 return {chamadas,fetch:window.fetch,bridge:window.DiarioMercadoPublico};
}
test('a ponte assume v894 sem depender da instalação do SW',()=>{
 const x=ambiente(async()=>({data:{}}));
 assert.equal(x.bridge.versao,894);
 assert.equal(x.bridge.semFallbackSupabase,true);
});
test('EWZ vai direto Cloudflare sem enviar apikey ou JWT',async()=>{
 const x=ambiente(async()=>({data:{spot:35.1,vol:{hv20:0.28},status:'sem_feed_opcoes',vencs:[]}}));
 const r=await x.fetch(SB+'ewz',{method:'POST',headers:{Authorization:'Bearer DADO_PRIVADO',apikey:'CHAVE_PRIVADA'},body:JSON.stringify({acao:'agora',venc:'2026-12-18',user_id:'segredo'})});
 assert.equal(r.status,200);assert.equal((await r.json()).spot,35.1);
 assert.equal(x.chamadas.length,1);
 assert.match(x.chamadas[0].url,/\/v1\/ewz/);
 assert.ok(!x.chamadas[0].url.includes('segredo'));
 assert.deepEqual(Object.keys(x.chamadas[0].opts.headers),['Accept']);
 assert.equal(x.chamadas[0].opts.credentials,'omit');
});
test('lote de 85 preços passa em 3 lotes na Cloudflare e não Supabase',async()=>{
 const x=ambiente(async url=>{
  const list=(new URL(url).searchParams.get('br')||'').split(',').filter(Boolean);
  return {data:{br:Object.fromEntries(list.map(s=>[s,12.4])),us:{},fx:5.1,erros:[]}};
 });
 const tickers=Array.from({length:85},(_,i)=>'T'+String(i).padStart(3,'0'));
 const r=await x.fetch(SB+'precos',{method:'POST',body:JSON.stringify({br:tickers,us:[]})});
 assert.equal(r.status,200);
 assert.equal(Object.keys((await r.json()).br).length,85);
 assert.equal(x.chamadas.length,3);
 assert.ok(x.chamadas.every(c=>c.url.startsWith(CF)));
});
test('erro Cloudflare não gera nem uma requisição Supabase',async()=>{
 const x=ambiente(async()=>({status:502,data:{error:'Provedor indisponível'}}));
 const r=await x.fetch(SB+'macro',{method:'POST',body:JSON.stringify({modo:'agenda',semana:0})});
 assert.equal(r.status,503);
 assert.equal((await r.json()).semFallbackSupabase,true);
 assert.equal(x.chamadas.length,1);
});
test('candles OHLCV retornados sem credenciais de usuario',async()=>{
 const x=ambiente(async()=>({data:{simbolo:'PETR4.SA',candles:[[1,2,3,1,2,100]]}}));
 const r=await x.fetch(SB+'candles',{method:'POST',headers:{Authorization:'Bearer segredo'},body:JSON.stringify({ativo:'PETR4',intervalo:'1d'})});
 assert.equal((await r.json()).candles.length,1);
 assert.equal(x.chamadas.length,1);
 assert.ok(!JSON.stringify(x.chamadas[0]).includes('segredo'));
});
test('notificações e dados privados continuam no Supabase',async()=>{
 const x=ambiente(async()=>({data:{}}));
 const r=await x.fetch(SB+'notificar',{method:'POST',headers:{Authorization:'Bearer teste'},body:JSON.stringify({acao:'agora'})});
 assert.equal((await r.json()).from,'supabase');
 assert.equal(x.chamadas.length,1);
 assert.ok(x.chamadas[0].url.startsWith(SB));
});
test('input inválido não aciona Supabase',async()=>{
 const x=ambiente(async()=>({data:{}}));
 const r=await x.fetch(SB+'precos',{method:'POST',body:'invalid-json'});
 assert.equal(r.status,400);
 assert.equal(x.chamadas.length,0);
});
