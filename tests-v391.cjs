/* Testes rápidos da camada visual Figma v391: dados reais, rotas, escape e cache. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=__dirname;
const source=fs.readFileSync(path.join(base,'design-v391.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'design-v391.css'),'utf8');
const sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
let passed=0;
function ok(name,cb){cb();passed++;console.log('OK ',name)}
function makeFixture(){
  let lastHead=null;
  class Node {
    constructor(name){this.name=name;this.children=[];this.dataset={};this.innerHTML='';this.attrs={};this.classList={add(){},toggle(){}};this.open=false;}
    get childNodes(){return this.children}
    appendChild(child){this.children.push(child);return child}
    insertBefore(child,other){this.children.unshift(child);return child}
    before(node){lastHead=node}
    remove(){if(lastHead===this)lastHead=null}
    removeAttribute(key){if(key==='data-dt391-decorated')delete this.dataset.dt391Decorated}
    setAttribute(key,val){this.attrs[key]=val}
    querySelector(key){if(key==='summary')return {textContent:''};return null}
  }
  const root=new Node('app'),nav=new Node('nav');
  const doc={body:{classList:{add(){}}},readyState:'loading',listeners:{},
    createElement(type){return new Node(type)},
    getElementById(key){return key==='app'?root:key==='dt391-global-head'?lastHead:null},
    querySelector(query){return query==='nav'?nav:null},
    addEventListener(key,cb){(this.listeners[key]??=[]).push(cb)}
  };
  const ctx={document:doc,window:{},console,setTimeout(){},Date,Intl,Event:function(){},
    S:{trades:[{id:'w1',dt:'2026-11-05T09:00',dtx:'2026-11-05T09:25',ativo:'WINZ26',side:'C',entry:100,exit:110,stop:98,target:115,qty:1,setup:'Pullback'},
         {id:'w2',dt:'2026-11-05T10:00',ativo:'WDOZ26',side:'V',entry:5.5,stop:5.6,target:5.2,qty:5,setup:'Reversão'}],
       days:{'2026-11-05':{plano:'Opere com disciplina',resumo:'Respeitei o plano',chk:{r1:true}}},
       rules:[{id:'r1',cat:0,t:'Respeitar meu plano'},{id:'r2',cat:1,t:'Não aumentar o risco'}],prop:{cap:10000,meta:500,perdaDia:200}},
    tab:'home',D:'2026-11-05',MKT:{tab:'ag'},
    render0(){root.children=[new Node('old')]},
    esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))},
    isOpen(t){return t.exit==null},
    cBRL(t){return {pl:t.exit==null?null:(t.exit-t.entry)*t.qty*(t.side==='C'?1:-1)}},
    calc(t){return {r:t.exit==null?null:1,risk:12}},
    capCalc(){return {at:10000}},
    segundaDe(){return '2026-11-02'},loc(){return '2026-11-05T15:00:00'}
  };
  vm.runInNewContext(source,ctx,{filename:'design-v391.js'});
  return {ctx,root,nav,get head(){return lastHead},view(route){ctx.tab=route;ctx.render0();const page=root.children.find(n=>n.name==='div');return page?.innerHTML||'';}};
}
ok('CSS e JS vinculados à página publicada e ao Service Worker',()=>{
  assert(html.includes('design-v391.css?v=391'));
  assert(html.includes('design-v391.js?v=391'));
  assert(sw.includes('diario-v391-figma-identidade-01'));
  for(const file of ['design-v391.js','design-v391.css'])assert(sw.includes('"'+file+'"'));
});
ok('Identidade mantém contraste, estado do foco e layout móvel',()=>{
  assert(css.includes('#06e6ac'));
  assert(css.includes(':focus-visible'));
  assert(css.includes('@media(max-width:430px)'));
});
const f=makeFixture();
ok('Tela inicial exibe resultados dos trades registrados, não números dos mockups',()=>{
  const v=f.view('home');assert(v.includes('Resumo do dia'));assert(v.includes('R$ 10,00')||v.includes('R$ 10,00'));
  assert(v.includes('Abrir Terminal'));assert(!v.includes('2.430,00'));assert(f.head.innerHTML.includes('Sem cotação'));
});
ok('Meu dia usa plano persistido e permite editar regras reais',()=>{
  const v=f.view('dia');assert(v.includes('Opere com disciplina'));assert(v.includes('data-chk="r1"'));assert(v.includes('1 de 2'));
});
ok('Operações traz posições abertas e trades registrados',()=>{
  const v=f.view('ops');assert(v.includes('WINZ26'));assert(v.includes('WDOZ26'));assert(v.includes('1 aberta(s)'));
});
ok('Diário constrói performance real e permite acessar lançamentos',()=>{
  const v=f.view('stats');assert(v.includes('Performance do Diário'));assert(v.includes('Respeitei o plano'));
});
ok('Mercado e Terminal preservam conteúdo operacional existente',()=>{
  assert(f.view('mercado').includes('Cotações'));
  assert(f.root.children.some(x=>x.name==='old'));
  assert(f.view('term').includes('Profit Pro'));
});
ok('Dados inseridos pelo usuário são escapados no HTML do novo painel',()=>{
  f.ctx.S.days['2026-11-05'].resumo='<script>alert(1)</script>';
  const v=f.view('stats');assert(!v.includes('<script>alert(1)</script>'));assert(v.includes('&lt;script&gt;'));
});
console.log(`\n${passed}/${passed} testes de interface v391 aprovados.`);
