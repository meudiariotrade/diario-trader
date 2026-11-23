const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const HOST='https://vdzwydizostutukppcsj.supabase.co/functions/v1/';
const EDGE='https://diario-trader.lucianosilva43567.workers.dev/v1/';
function montar(handler){
 const chamadas=[];
 const native=async(url,opcoes={})=>{
  chamadas.push({url:String(url),opcoes});
  if(!String(url).startsWith(EDGE))throw Error('Tentativa de enviar dados ao Supabase: '+url);
  const v=await handler(String(url));
  return Response.json(v.data,{status:v.status||200});
 };
 const window={fetch:native};
 vm.runInNewContext(read('src/shared/mercado-cloudflare-v894.js'),{window,URL,URLSearchParams,Response,Request,Set,AbortSignal,console});
 return {chamadas,fetch:window.fetch};
}
test('v899: juros e sentimento nunca consultam o Supabase',async()=>{
 const a=montar(url=>url.includes('/juros')?{data:{selic:14.25,curva:{}}}:{data:{b3:{valor:45}}});
 for(const f of ['juros','sentimento']){
  const r=await a.fetch(HOST+f,{method:'POST',headers:{apikey:'segredo',Authorization:'Bearer segredo'},body:'{}'});
  assert.equal(r.status,200);
 }
 assert.equal(a.chamadas.length,2);
 assert.ok(a.chamadas.every(c=>c.url.startsWith(EDGE)));
 assert.ok(a.chamadas.every(c=>Object.keys(c.opcoes.headers||{}).join() === 'Accept'));
});
test('v899: ADRs passam somente símbolos públicos para a borda',async()=>{
 const a=montar(()=>({data:{itens:[{s:'PBR'}],erros:[]}}));
 const r=await a.fetch(HOST+'adrs',{method:'POST',headers:{Authorization:'Bearer segredo'},body:JSON.stringify({symbols:['PBR','VALE'],carteira:'privada'})});
 assert.equal(r.status,200);
 assert.equal(a.chamadas.length,1);
 assert.match(a.chamadas[0].url,/\/v1\/adrs\?s=PBR%2CVALE/);
 assert.ok(!JSON.stringify(a.chamadas).includes('segredo'));
 assert.ok(!JSON.stringify(a.chamadas).includes('privada'));
});
test('v899: notícias redirecionadas sem sessão e com campo de fonte legado',async()=>{
 const a=montar(()=>({data:{itens:[{t:'Mercado',l:'https://exemplo.com',fonte:'Reuters'}],fontesOk:['Reuters']}}));
 const r=await a.fetch(HOST+'noticias',{method:'POST',body:'{}'});
 assert.equal(r.status,200);
 assert.equal((await r.json()).itens[0].f,'Reuters');
 assert.equal(a.chamadas.length,1);
 assert.match(a.chamadas[0].url,/\/v1\/noticias$/);
});
test('v899: falha de borda não abre fallback ao Supabase',async()=>{
 const a=montar(()=>({data:{error:'indisponível'},status:503}));
 const r=await a.fetch(HOST+'juros',{method:'POST',body:'{}'});
 assert.equal(r.status,503);
 assert.equal((await r.json()).semFallbackSupabase,true);
 assert.equal(a.chamadas.length,1);
});
test('v899: macro e notícias não renovam token do Supabase',()=>{
 const persist=read('src/domains/core/02-estado-e-persistencia.js');
 const trecho=persist.slice(persist.indexOf('async function edgeFetchAutenticado'),persist.indexOf('async function hashAuth()'));
 assert.ok(trecho.indexOf('destino.pathname === "/functions/v1/macro"')<trecho.indexOf('await tok()'));
 assert.match(trecho,/credentials: "omit"/);
 const noticias=read('src/domains/core/04-analises-e-estudos.js');
 const n=noticias.slice(noticias.indexOf('async function mkEdgeNoticias'),noticias.indexOf('/* Traducao gratuita'));
 assert.doesNotMatch(n,/supabase\.co|\/functions\/v1\/|await tok\(\)/);
 assert.match(n,/workers\.dev\/v1\/noticias/);
});
test('v899: SW também protege novos fluxos públicos sem encaminhar autorização',()=>{
 const sw=read('src/service-worker.js');
 for(const f of ['juros','sentimento','adrs','noticias'])assert.match(sw,new RegExp("'"+f+"'"));
 assert.match(sw,/credentials:'omit'/);
});
