'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bridge=fs.readFileSync('profit-cotacoes-v552.js','utf8');
const live=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
const quotes=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
const html=fs.readFileSync('src/index.html','utf8');
function app(){
 const listeners={};
 let requests=0;
 let now=new Date().toISOString();
 const doc={
  hidden:false,body:{},activeElement:null,
  querySelector:()=>null,querySelectorAll:()=>[],
  addEventListener:(name,fn)=>{listeners[name]=fn}
 };
 const context={
  window:null,document:doc,
  SESS:{uid:'usuario-privado'},
  CQ:{owner:null,pf:{},saved:{},pfTs:0,cloudTs:0},
  codFut:t=>t+'Z26',cqPonte:async()=>{},cqPinta:()=>{},
  tab:'live',MKT:{tab:'cq'},URL,AbortSignal,Date,
  setInterval:()=>1,
  MutationObserver:class{observe(){}},
  requestAnimationFrame:fn=>fn(),
  rq:async(url)=>{
   requests++;
   assert.match(url,/^\/rest\/v1\/cotacoes\?select=ticker,ult,var,updated_at,dat,hor&limit=250&user_id=eq\.usuario-privado$/);
   return {ok:true,json:async()=>[{ticker:'WINFUT',ult:155000+requests,var:0.25,updated_at:now},
     {ticker:'PETR4',ult:45.6,var:-0.3,updated_at:now}]};
  }
 };
 context.window=context;
 vm.createContext(context);
 vm.runInContext(bridge,context,{filename:'profit-cotacoes-v552.js'});
 return {context,listeners,requests:()=>requests,changeNow:iso=>{now=iso}};
}
test('v945: ponte lê a conta autenticada, aceita WINFUT e não perde a fonte do Profit',async()=>{
 const {context:c,requests}=app();
 await c.cqPonte();
 assert.equal(requests(),1);
 assert.equal(c.CQ.pf['@WIN'].px,155001);
 assert.equal(c.CQ.pf.PETR4.px,45.6);
 assert.equal(c.CQ.owner,'usuario-privado');
});
test('v945: nenhuma consulta automática em segundos; atualização humana pode revalidar em 15s',async()=>{
 const {context:c,requests}=app();
 await c.cqPonte();
 await c.cqPonte();
 await c.cqPonte(true);
 assert.equal(requests(),1);
 c.CQ.pfTs-=20000;
 c.CQ.cloudTs-=20000;
 await c.cqPonte(true);
 assert.equal(requests(),2);
 assert.equal(c.CQ.pf['@WIN'].px,155002);
 c.CQ.pfTs-=120000;
 c.CQ.cloudTs-=120000;
 await c.cqPonte();
 assert.equal(requests(),2,'automático segue limitado a 15 minutos');
});
test('v945: a tela Live busca snapshot na entrada e tem atualizar manual sem polling extra',()=>{
 assert.match(live,/if \(tab === "live" && SESS\?\.uid && window\.CLOUD_OK && typeof cqPonte === "function"\)\s*await cqPonte\(\)/);
 assert.match(live,/document\.addEventListener\("diario:tela"/);
 assert.match(live,/data-lvpf-refresh/);
 assert.match(live,/cqPonte\(true\)/);
 assert.match(live,/Última amostra da ponte às/);
 assert.doesNotMatch(live,/⚪ Ponte parada\. Última cotação às/);
 assert.match(bridge,/event\.target\?\.closest\?\.\('\[data-cqr\]'\)/);
 assert.match(html,/profit-cotacoes-v552\.js\?v=__APP_VERSION__/);
});

test('v945: para preços da ponte, negócio tem prioridade sobre reenvio do snapshot',async()=>{
 const {context:c}=app();
 const ontem=new Date(Date.now()-86400000);
 const dia=ontem.toLocaleDateString('en-GB',{timeZone:'America/Sao_Paulo'});
 const hora='14:30:00';
 const negocio=new Date(dia.split('/').reverse().join('-')+'T'+hora+'-03:00');
 c.rq=async()=>({ok:true,json:async()=>[
   {ticker:'WINFUT',ult:155000,var:0,updated_at:new Date().toISOString(),dat:dia,hor:hora}
 ]});
 await c.cqPonte();
 assert.equal(c.CQ.pf['@WIN'],undefined,'não classificar negócio de ontem como ao vivo');
 assert.equal(c.CQ.saved['@WIN'].em,negocio.toISOString());
 assert.ok(c.CQ.saved['@WIN'].recebidoEm,'hora de sincronização guardada separadamente');
});
test('v945: TradingView é usado se Profit estiver indisponível ou antigo, inclusive após fechamento',()=>{
 const start=quotes.indexOf('const cqPf = (e, t) => {');
 const end=quotes.indexOf(',\n  cqPx = (e, t) => {',start);
 assert.ok(start>0 && end>start);
 const code=quotes.slice(start,end)+';\nglobalThis.cqEscolha = cqPf;';
 const dayBefore=new Date(Date.now()-86400000).toISOString();
 const recent=new Date(Date.now()-60000).toISOString();
 const saved={px:100,tk:'PETR4',em:dayBefore,d1:1};
 const c={CQ:{owner:'user-1',pf:{},saved:{PETR4:saved}},SESS:{uid:'user-1'},
   cqSessaoAberta:()=>false,Date};
 vm.createContext(c);vm.runInContext(code,c);
 const quote={c:'PETR4',s:'BMFBOVESPA:PETR4',px:101,d1:2,horarioPreco:recent};
 assert.equal(c.cqEscolha(quote,'br'),null,'TradingView mais novo deve prevalecer');
 assert.equal(c.cqEscolha({...quote,px:null},'br').fechado,true,'Profit salvo só como fechamento');
 c.cqSessaoAberta=()=>true;
 assert.equal(c.cqEscolha(quote,'br'),null,'durante pregão não exibir Profit antigo');
 c.CQ.pf.PETR4={px:102,d1:1.5,em:recent};
 assert.equal(c.cqEscolha(quote,'br').px,102,'Profit recente tem prioridade durante pregão');
 c.cqSessaoAberta=()=>false;
 assert.equal(c.cqEscolha(quote,'br'),null,'Profit mesmo recente não mascara TradingView após fechamento');
 c.CQ.saved.PETR4={...saved,em:new Date(Date.now()+20000).toISOString()};
 assert.equal(c.cqEscolha(quote,'br').fechado,true,'preservar fechamento se TV comprovadamente mais antigo');
});
