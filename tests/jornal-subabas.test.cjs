const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {layer}=require('./helpers/source.cjs');
const tick=()=>new Promise(r=>setTimeout(r,100));

test('Jornal sem duplicação após cliques, atualizações e retorno de Notícias',async()=>{
 const dom=new JSDOM('<div id="app"></div>',{url:'https://app.test/',runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 const hooks=[];
 try{
  Object.assign(w,{tab:'mercado',MKT:{tab:'nt'},S:{ax:{},rules:[]},scrollTo(){},TraderUI:{onRender(name,fn){hooks.push(fn)}},vGiro:()=>'<p id="giro-edicao">Edição do giro</p>'});
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
   // v617: uma barra só, sem "Jornal do dia" duplicando o Jornal do Pregão
   assert.equal(w.document.querySelectorAll('.m406-section-switch').length,1);
   assert.deepEqual(rot(),['Notícias','Balanços da B3','Jornal do Pregão','Giro do mercado']);
   w.document.querySelector('[data-m550-jornal="giro"]').click();await tick();
   assert.equal(w.MKT.tab,'jr');
   assert.equal(w.document.querySelectorAll('.m406-section-switch').length,1);
   assert.deepEqual(rot(),['Notícias','Balanços da B3','Jornal do Pregão','Giro do mercado']);
   assert.deepEqual(ativo(),['Giro do mercado']);
   assert.equal(w.document.querySelector('.m406-content-host').textContent,'Edição do giro');
   w.document.querySelector('[data-m406-select="jornal"]').click();
   assert.deepEqual(ativo(),['Jornal do Pregão']);
   assert.equal(w.document.querySelector('.m406-content-host').hidden,true);
   assert.equal(w.document.getElementById('edicao').hidden,false);
   w.document.querySelector('[data-m406-select="giro"]').click();
   assert.deepEqual(ativo(),['Giro do mercado']);
   w.render();await tick();
   assert.deepEqual(ativo(),['Giro do mercado']);
   w.document.querySelector('[data-m406-select="jornal"]').click();
  }
 }finally{dom.window.close()}
});
