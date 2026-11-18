const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {layer}=require('./helpers/source.cjs');
const tick=()=>new Promise(r=>setTimeout(r,100));

test('Jornal e Notícias sem sub-aba Giro, duplicação ou tela antiga após voltar',async()=>{
 const dom=new JSDOM('<div id="app"></div>',{url:'https://app.test/',runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 const hooks=[];
 try{
  Object.assign(w,{tab:'mercado',MKT:{tab:'nt'},S:{ax:{},rules:[]},scrollTo(){},TraderUI:{onRender(name,fn){hooks.push(fn)}},vGiro:()=>'<p id="giro-edicao">Edição antiga do giro</p>'});
  w.render=()=>{
   w.document.getElementById('app').innerHTML='<div class="dt395-native-mercado"><div class="card" id="edicao">Edição original do Jornal</div></div>';
   hooks.forEach(fn=>fn());
  };
  w.eval(layer('mercado-v406.js'));
  w.eval(fs.readFileSync('melhorias-v550.js','utf8'));
  const rot=()=>[...w.document.querySelectorAll('.m406-section-switch button')].map(b=>b.textContent);
  const ativo=()=>[...w.document.querySelectorAll('.m406-section-switch button[aria-pressed="true"]')].map(b=>b.textContent);
  for(let i=0;i<3;i++){
   w.MKT.tab='nt';w.render();await tick();
   assert.equal(w.document.querySelectorAll('.m406-section-switch').length,1);
   assert.deepEqual(rot(),['Notícias','Balanços da B3','Jornal do Pregão']);
   assert.equal(w.document.querySelector('[data-m406-select="giro"]'),null);
   // Atalho legado do Giro deve abrir o Jornal, nunca ressuscitar a sub-aba removida.
   w.document.querySelector('[data-m550-jornal="giro"]').click();await tick();
   assert.equal(w.MKT.tab,'jr');
   assert.equal(w.document.querySelectorAll('.m406-section-switch').length,1);
   assert.deepEqual(rot(),['Notícias','Balanços da B3','Jornal do Pregão']);
   assert.deepEqual(ativo(),['Jornal do Pregão']);
   assert.equal(w.document.querySelector('.m406-content-host').hidden,true);
   assert.equal(w.document.getElementById('edicao').hidden,false);
   assert.equal(w.document.getElementById('giro-edicao'),null);
   w.render();await tick();
   assert.deepEqual(ativo(),['Jornal do Pregão']);
   assert.equal(w.document.querySelector('[data-m406-select="giro"]'),null);
  }
 }finally{dom.window.close()}
});
