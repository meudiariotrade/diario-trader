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
  for(let i=0;i<3;i++){
   w.MKT.tab='nt';w.render();await tick();
   assert.equal(w.document.querySelectorAll('[data-m550-jornal]').length,1);
   w.document.querySelector('[data-m550-jornal]').click();await tick();
   assert.equal(w.MKT.tab,'jr');
   assert.equal(w.document.querySelectorAll('[data-m550-jornal]').length,0);
   assert.deepEqual([...w.document.querySelectorAll('.m406-section-switch[data-m406-switch="jr"] button')].map(b=>b.textContent),['Jornal do Pregão','Giro do mercado']);
   assert.equal(w.document.querySelectorAll('.m406-section-switch[data-m406-switch="jr"] button[aria-pressed="true"]').length,1);
   // v616: a barra de Notícias continua no topo, com "Jornal do dia" ativo (sem parecer outra tela)
   assert.deepEqual([...w.document.querySelectorAll('[data-m550-ntnav] button')].map(b=>b.textContent),['Notícias','Balanços da B3','Jornal do dia']);
   assert.equal(w.document.querySelectorAll('[data-m550-ntnav]').length,1);
   w.document.querySelector('[data-m406-select="giro"]').click();
   assert.equal(w.document.querySelector('.m406-content-host').hidden,false);
   assert.equal(w.document.querySelector('.m406-content-host').textContent,'Edição do giro');
   w.render();await tick();
   assert.equal(w.document.querySelector('[data-m406-select="giro"]').getAttribute('aria-pressed'),'true');
   assert.equal(w.document.querySelectorAll('[data-m550-jornal]').length,0);
   w.document.querySelector('[data-m406-select="jornal"]').click();
   assert.equal(w.document.querySelector('.m406-content-host').hidden,true);
   assert.equal(w.document.getElementById('edicao').hidden,false);
  }
 }finally{dom.window.close()}
});
