/* Integração do gráfico REAL v421 (Terminal → Gráficos) com o bundle v522. */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
async function run(){
 const source=fs.readFileSync('terminal-gp-v421.js','utf8');
 const bundle=fs.readFileSync('camadas-v522.js','utf8');
 assert(bundle.includes(source),'Bundle efetivamente inclui o mesmo gráfico GP da origem');
 const index=fs.readFileSync('index.html','utf8');
 assert(index.includes('camadas-v522.js?v=526'),'Página força a versão publicada dos controles');
 assert(index.includes('terminal-gestos-seguros.css?v=526'),'Folha de estilo atualizada');
 assert(/const C='diario-v5\d\d-[a-z-]+'/.test(fs.readFileSync('sw.js','utf8')),'Cache PWA revisado');
 const err=[];
 const vc=new VirtualConsole();vc.on('jsdomError',e=>err.push(e.message));
 vc.on('error',e=>err.push(String(e)));
 const dom=new JSDOM('<!doctype html><html lang="pt-BR"><body class="trmon"><main id="app"><div id="tf413"><div class="tf413-main">Grade anterior</div></div></main></body></html>',
 {url:'https://example.test/diario-trader/',pretendToBeVisual:true,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,d=w.document;
 w.tab='term';w.render0=function(){};
 const start=Date.now()-710*86400000;
 const makeRows=(base)=>Array.from({length:700},(_,i)=>{
  const px=base+Math.sin(i*.03)*10+i*.12;
  return [Math.floor((start+i*86400000)/1000),px-.4,px+1.6,px-2.1,px,10000+i];
 });
 const rows={IBOV:makeRows(125000),SPX:makeRows(5500)};
 w.TRM={tec:{velas:(sym,iv)=>({L:rows[sym]||[],nota:'fonte de teste'}),pegaVelas:async()=>null,erroVelas:()=>''}};
 w.SVGElement.prototype.getBoundingClientRect=function(){
  if(this.matches?.('.gp-svg'))return {left:10,top:20,right:510,bottom:320,width:500,height:300};
  return {left:0,top:0,right:0,bottom:0,width:0,height:0};
 };
 w.eval(source);
 w.render0();
 const root=d.querySelector('#v421-gp');
 assert(root,'Gráfico atual foi inserido no próprio Terminal');
 const nav=root.querySelector('.gp-navigation');
 assert(nav,'Controles precisam ficar acima do gráfico principal');
 assert.equal(root.querySelector('.gp-navigation + .gp-plot')?.getAttribute('data-gp-plot'),'',
 'Controles ficam imediatamente antes da área plotada');
 assert.deepEqual([...nav.querySelectorAll('[data-gp-nav]')].map(b=>b.dataset.gpNav),
 ['hand','price','time','zin','zout','reset']);
 assert(root.querySelector('.gp-svg'), 'Gráfico SVG realmente desenhado');
 let current=w.DIARIO_GP421.view();
 assert(current.max>current.count,'Histórico completo permite arrastar para dados anteriores');
 assert.equal(current.offset,0);
 const firstCount=current.count;
 const firstPrices=[...root.querySelectorAll('text.gp-ax')].slice(0,5).map(x=>x.textContent).join('|');
 const click=cmd=>{const btn=d.querySelector('[data-gp-nav="'+cmd+'"]');assert(btn);btn.click();};
 const pointer=(type,x,y,id=1)=>{
  const svg=d.querySelector('#v421-gp .gp-svg');
  const e=new w.Event(type,{bubbles:true,cancelable:true});
  Object.assign(e,{clientX:x,clientY:y,pointerId:id,button:0,pointerType:'touch'});
  svg.dispatchEvent(e);
  return e;
 };
 click('time');
 assert.equal(w.DIARIO_GP421.state().navMode,'time');
 pointer('pointerdown',70,120);
 pointer('pointermove',245,120);
 pointer('pointerup',245,120);
 current=w.DIARIO_GP421.view();
 assert(current.offset>0,'Arrasto horizontal deve revelar candles históricos anteriores');
 assert.equal(current.priceShift,0,'Modo Tempo não desloca preços');
 const oldOffset=current.offset;
 click('price');
 pointer('pointerdown',110,80,2);
 const moving=pointer('pointermove',110,165,2);
 assert(moving.defaultPrevented,'Gesto no gráfico não provoca scroll/swipe do aplicativo');
 pointer('pointerup',110,165,2);
 current=w.DIARIO_GP421.view();
 assert(current.priceShift>0,'Arrasto para baixo desloca eixo de preço');
 assert.equal(current.offset,oldOffset,'Modo Preço não troca período');
 const afterPrices=[...root.querySelectorAll('text.gp-ax')].slice(0,5).map(x=>x.textContent).join('|');
 assert.notEqual(afterPrices,firstPrices,'Rótulos do eixo são recalculados, não apenas traduzidos visualmente');
 click('zin');
 const zoomed=w.DIARIO_GP421.view();
 assert(zoomed.count<firstCount,'Zoom reduz quantidade visível de candles');
 click('zout');
 assert(w.DIARIO_GP421.view().count>zoomed.count,'Zoom menos amplia a janela');
 click('hand');
 pointer('pointerdown',160,90,3);
 pointer('pointermove',205,130,3);
 pointer('pointerup',205,130,3);
 assert.equal(w.DIARIO_GP421.state().navMode,'hand');
 assert(root.querySelector('[data-gp-nav="hand"]').getAttribute('aria-pressed')==='true');
 click('reset');
 current=w.DIARIO_GP421.view();
 assert.equal(current.offset,0,'Restauração retorna ao último candle');
 assert.equal(current.priceShift,0,'Restauração zera ajuste de preço');
 assert.equal(current.count,firstCount,'Restauração recompõe período padrão');
 w.DIARIO_GP421.paint();
 assert(root.querySelector('[data-gp-nav="hand"]'),'Controles persistem após atualizar dados');
 assert.equal(root.querySelectorAll('.gp-navigation').length,1,'Controles não duplicam');
 assert.equal(err.length,0,'Sem erros inesperados de DOM: '+err.join('; '));
 console.log('✅ GP principal real: controles visíveis, dados históricos, preço, tempo, zoom, reset, toque e integração do bundle v522.');
 w.close();
}
run().catch(err=>{console.error(err);process.exitCode=1;});
