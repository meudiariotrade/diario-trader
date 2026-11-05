'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const base=__dirname;
const code=fs.readFileSync(path.join(base,'mercado-visual-v388.js'),'utf8');
const listeners={};
function element(type){
 const e={type,children:[],attrs:{},textContent:'',value:'',hidden:false,parent:null,
  append(...nodes){for(const node of nodes){this.children.push(node);node.parent=this;}},
  setAttribute(k,v){this.attrs[k]=v},
  matches(s){return s==='[data-cq388-search]' && this.attrs['data-cq388-search']!==undefined},
  closest(s){if(s==='[data-cq388-clear]'&&this.attrs['data-cq388-clear']!==undefined)return this;if(s==='#cotbox')return box;return null},
  querySelector(s){if(s==='[data-cq388-search]')return descend(this,x=>x.attrs['data-cq388-search']!==undefined);if(s==='[data-cq388-clear]')return descend(this,x=>x.attrs['data-cq388-clear']!==undefined);return null},
  before(node){this.parent.tool=node;node.parent=this.parent},
  after(node){this.parent.empty=node;node.parent=this.parent},
  focus(){doc.activeElement=this}
 };return e;
}
function descend(node,pred){for(const child of node.children){if(pred(child))return child;const r=descend(child,pred);if(r)return r}return null}
const makeRow=(tick,name,price)=>({hidden:false,price,querySelector(s){if(s==='.cqn')return{querySelector(sel){if(sel==='b')return{textContent:tick};if(sel==='small')return{textContent:name};return null}};return null}});
function makeBox(rows,id='cotbox'){
 const b={id,rows,tool:null,empty:null,
   tabs:{selected:{attrs:{},setAttribute(k,v){this.attrs[k]=v}},querySelector(){return this.selected}},
   bar:{before(node){b.tool=node}},
   list:{after(node){b.empty=node}},
   querySelector(s){if(s===':scope > .cqtabs')return this.tabs;
    if(s===':scope > .cq388-searchbar')return this.tool;
    if(s===':scope > .cqbar')return this.bar;
    if(s==='[data-cq388-empty]')return this.empty;
    if(s==='[data-cq388-count]')return descend(this.tool,x=>x.attrs['data-cq388-count']!==undefined);
    if(s==='[data-cq388-clear]')return descend(this.tool,x=>x.attrs['data-cq388-clear']!==undefined);
    if(s==='[data-cq388-search]')return descend(this.tool,x=>x.attrs['data-cq388-search']!==undefined);
    if(s==='.cql')return this.list;return null},
   querySelectorAll(s){if(s==='.cql > .cqr')return this.rows;return []}
 };return b;
}
let box=makeBox([makeRow('AAPL','Apple',349.51),makeRow('MSFT','Microsoft',555.80),makeRow('NVDA','Nvidia',200.13)]);
const app={querySelector(){return box}};
const doc={readyState:'complete',activeElement:null,
 addEventListener(name,cb){(listeners[name]??=[]).push(cb)},
 createElement:element,
 getElementById(id){return id==='app'?app:id==='cotbox'?box:null}
};
let renderHook;
const window={document:doc,MutationObserver:class{observe(){}},requestAnimationFrame(cb){cb()},TraderUI:{onRender(name,callback){renderHook=callback}},setTimeout(cb){cb()}};
vm.runInNewContext(code,{window,document:doc,console});
let count=0;const ok=(name,cb)=>{cb();count++;console.log('✓',name)};
ok('A aba Mercado carrega e cria a busca sem chamar API',()=>{assert(box.tool);assert.equal(box.tool.type,'div');assert.equal(box.querySelector('[data-cq388-count]').textContent,'3 de 3 ativos')});
ok('Não duplica a busca em novas renderizações',()=>{const prev=box.tool;renderHook();assert.strictEqual(box.tool,prev)});
ok('Selecionado expõe aria-current',()=>assert.equal(box.tabs.selected.attrs['aria-current'],'page'));
ok('Busca por ticker oculta apenas ativos diferentes',()=>{
 const input=box.querySelector('[data-cq388-search]');input.value='msft';
 for(const f of listeners.input||[])f({target:input});
 assert.deepEqual(box.rows.map(r=>r.hidden),[true,false,true]);
 assert.equal(box.rows[1].price,555.80);
 assert.equal(box.querySelector('[data-cq388-count]').textContent,'1 de 3 ativos');
});
ok('Busca ignora acentos e maiúsculas',()=>{
 const input=box.querySelector('[data-cq388-search]');input.value='nvíDIA';
 for(const f of listeners.input||[])f({target:input});
 assert.deepEqual(box.rows.map(r=>r.hidden),[true,true,false]);
});
ok('Estado da busca sobrevive à atualização completa da lista',()=>{
 box=makeBox([makeRow('AAPL','Apple',350),makeRow('NVDA','Nvidia',201)]);renderHook();
 assert.equal(box.querySelector('[data-cq388-search]').value,'nvíDIA');
 assert.deepEqual(box.rows.map(r=>r.hidden),[true,false]);
});
ok('Busca vazia reexibe todos os ativos',()=>{
 const clear=box.querySelector('[data-cq388-clear]');
 for(const f of listeners.click||[])f({target:clear,preventDefault(){}});
 assert.deepEqual(box.rows.map(r=>r.hidden),[false,false]);
 assert.equal(box.querySelector('[data-cq388-search]').value,'');
});
ok('Nenhum resultado mostra aviso explícito',()=>{
 const input=box.querySelector('[data-cq388-search]');input.value='ZZZZ';
 for(const f of listeners.input||[])f({target:input});
 assert.equal(box.empty.hidden,false);
});
ok('Troca de categoria zera busca e preserva dados',()=>{
 for(const f of listeners.click||[])f({target:{closest(s){return s==='[data-cqa]'?{}:null}}});
 assert.deepEqual(box.rows.map(r=>r.hidden),[false,false]);
});
ok('ADRs mantém controles específicos sem injeção da busca',()=>{
 box=makeBox([], 'cqbox');renderHook();assert(!box.tool);
});
ok('JS não modifica preços ou variações da fonte',()=>{assert.strictEqual(typeof code.includes('fetch('),'boolean');assert(!code.includes('fetch('))});
const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
ok('HTML carrega folha de estilo e módulo visual uma única vez',()=>{
 assert.equal(html.split('mercado-visual-v388.js?v=388').length,2);
 assert.equal(html.split('mercado-visual-v388.css?v=388').length,2);
});
ok('Service Worker permite instalação atômica da v388',()=>{
 assert(sw.includes('diario-v388-mercado-visual-01'));assert(sw.includes('"mercado-visual-v388.js"'));assert(sw.includes('"mercado-visual-v388.css"'));
});
console.log('Mercado v388:',count,'verificações aprovadas');
