'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bridge=fs.readFileSync('profit-cotacoes-v552.js','utf8');
const live=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
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
   assert.match(url,/^\/rest\/v1\/cotacoes\?select=ticker,ult,var,updated_at&limit=250&user_id=eq\.usuario-privado$/);
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
