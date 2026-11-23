const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const SOURCE=fs.readFileSync(path.resolve(__dirname,'../src/service-worker.js'),'utf8').replaceAll('__APP_VERSION__','893');
const SUPA='https://vdzwydizostutukppcsj.supabase.co/functions/v1/';
const CF='https://diario-trader.lucianosilva43567.workers.dev/v1/';

function contexto(publico){
 const eventos={};const chamadas=[];
 const falsoFetch=async(input,options={})=>{
  const url=typeof input==='string'?input:input.url;
  chamadas.push({url,options});
  if(url.startsWith(CF)){
   const recebido=await publico(url,options);
   return new Response(JSON.stringify(recebido.data),{
    status:recebido.status||200,headers:{'Content-Type':'application/json'}
   });
  }
  return Response.json({origem:'supabase',ok:true});
 };
 const self={
  addEventListener:(name,fn)=>(eventos[name]??=[]).push(fn),
  registration:{scope:'https://meudiariotrade.github.io/diario-trader/'}
 };
 vm.runInNewContext(SOURCE,{
   self,location:{origin:'https://meudiariotrade.github.io'},URL,URLSearchParams,
   Request,Response,Set,Date,console,fetch:falsoFetch
 });
 async function executar(funcao,body,headers={}){
  const request=new Request(SUPA+funcao,{
   method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer token-privado',apikey:'anon-privada',...headers},
   body:JSON.stringify(body)
  });
  let resposta;
  const evento={request,respondWith(p){if(resposta)throw new Error('respondWith duplicado');resposta=p}};
  for(const fn of eventos.fetch)fn(evento);
  return resposta?await resposta:null;
 }
 return {chamadas,executar};
}

test('macro agenda usa Cloudflare GET, preservando contrato e sem JWT',async()=>{
 const c=contexto(async()=>({data:{eventos:[{nome:'CPI'}],fonte:'TradingView'}}));
 const r=await c.executar('macro',{modo:'agenda',semana:0});
 assert.equal(r.status,200);
 assert.deepEqual((await r.json()).eventos[0].nome,'CPI');
 assert.equal(c.chamadas.length,1);
 assert.match(c.chamadas[0].url,/\/v1\/macro\?modo=agenda&semana=0/);
 assert.equal(c.chamadas[0].options.method,'GET');
 assert.equal(c.chamadas[0].options.credentials,'omit');
 assert.deepEqual(Object.keys(c.chamadas[0].options.headers),['Accept']);
});

test('precos B3 e EUA usam Cloudflare e retornam mapa compativel',async()=>{
 const c=contexto(async()=>({data:{br:{PETR4:38.35},us:{AAPL:225.4},fx:5.1,erros:[]}}));
 const r=await c.executar('precos',{br:['PETR4'],us:['AAPL']});
 const j=await r.json();
 assert.equal(j.br.PETR4,38.35);assert.equal(j.us.AAPL,225.4);
 assert.match(c.chamadas[0].url,/\/v1\/precos\?/);
 assert.match(c.chamadas[0].url,/br=PETR4/);
 assert.match(c.chamadas[0].url,/us=AAPL/);
});

test('candles preserva OHLCV para analises e backtest',async()=>{
 const c=contexto(async()=>({data:{simbolo:'PETR4.SA',candles:[[1732000000,38,39,37,38.5,1000]],intervalo:'1d'}}));
 const r=await c.executar('candles',{ativo:'PETR4',intervalo:'1d'});
 const j=await r.json();
 assert.equal(j.candles.length,1);
 assert.match(c.chamadas[0].url,/\/v1\/candles\?ativo=PETR4&intervalo=1d/);
});

test('sem feed EWZ na Cloudflare recua para Supabase mantendo fluxo',async()=>{
 const c=contexto(async()=>({status:502,data:{error:'Feed ainda não configurado'}}));
 const r=await c.executar('ewz',{acao:'agora',venc:'2026-12-18'});
 assert.equal((await r.json()).origem,'supabase');
 assert.equal(c.chamadas.length,2);
 assert.match(c.chamadas[0].url,/\/v1\/ewz/);
 assert.match(c.chamadas[1].url,/supabase\.co\/functions\/v1\/ewz/);
});

test('resposta invalida do Cloudflare cai no fallback sem quebrar a tela',async()=>{
 const c=contexto(async()=>({data:{erro:'provider sem dados'}}));
 const r=await c.executar('macro',{modo:'painel'});
 assert.equal((await r.json()).origem,'supabase');
 assert.equal(c.chamadas.length,2);
});

test('nunca corta posicoes: lote maior que 40 usa origem intacta',async()=>{
 const c=contexto(async()=>({data:{br:{},us:{}}}));
 const r=await c.executar('precos',{br:Array.from({length:41},(_,i)=>'A'+i),us:[]});
 assert.equal((await r.json()).origem,'supabase');
 assert.equal(c.chamadas.length,1);
});

test('radar, autenticacao e notificacoes ficam fora da interceptacao',async()=>{
 const c=contexto(async()=>({data:{}}));
 assert.equal(await c.executar('radar',{acao:'agora'}),null);
 assert.equal(await c.executar('notificar',{acao:'enviar'}),null);
 assert.equal(c.chamadas.length,0);
});

test('nao encaminha campos extras, chaves ou informacoes de usuario',async()=>{
 const c=contexto(async()=>({data:{mercados:{},brasil:{}}}));
 await c.executar('macro',{modo:'',token:'nao-expor',user_id:'usuario-privado',carteira:{segredo:true}});
 const u=new URL(c.chamadas[0].url);
 assert.equal(u.searchParams.has('token'),false);
 assert.equal(u.searchParams.has('user_id'),false);
 assert.equal(u.searchParams.has('carteira'),false);
});
