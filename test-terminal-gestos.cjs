/* Testes isolados do patch de gestos do Terminal v522. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
async function run(){
 const logs=[],vc=new VirtualConsole();
 vc.on('jsdomError',e=>logs.push(e.message));
 vc.on('error',e=>logs.push(String(e)));
 const markup='<!doctype html><html lang="pt-BR"><head><script src="camadas-v522.js?v=522"></script></head>'+
 '<body class="trmon"><main id="app"><div id="trgrid"><div data-trp="0" class="trp"><div class="trpb">'+
 '<div class="g9bar"></div><div class="g418-toolbar" data-g418-panel="0">'+
 '<span class="g418-guide">✋ Arraste</span><button data-g418-action="reset">Reset</button><span class="g418-sr"></span></div>'+
 '<svg data-g9svg="0" class="g9svg" tabindex="0"></svg></div></div></div>'+
 '<section class="v357-extra"><div class="us-rank"><span id="sazon-cell">Sazonalidade</span></div></section>'+
 '<div class="anxt"><table id="market-table"><tbody><tr><td id="market-cell">Tabela</td></tr></tbody></table></div>'+
 '<div id="outside">Área normal</div></main></body></html>';
 const dom=new JSDOM(markup,{url:'https://example.test/diario-trader/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document,calls=[];
 w.console.warn=()=>{};
 const state={log:true};
 w.TerminalChart={axis:(p,action)=>{if(action==='scale')state.log=!state.log;return state;}};
 w.TRM={tec:{chartView:(...args)=>{calls.push(args);if(args[1]==='scale')w.TerminalChart.axis(args[0],'scale');}}};
 const svg=d.querySelector('svg[data-g9svg="0"]');
 svg.getBoundingClientRect=()=>({left:30,top:20,width:320,height:210,right:350,bottom:230});
 w.eval(fs.readFileSync('terminal-gestos-seguros.js','utf8'));
 d.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
 assert(d.querySelector('.g522-tool[data-g522-panel="0"]'),'Controles dentro do gráfico');
 assert.equal(d.querySelectorAll('.g522-tool').length,1,'Controles sem duplicação');
 const b=(selector)=>{const e=d.querySelector(selector);assert(e,'Seletor ausente '+selector);e.click();return e;};
 const ptr=(name,x,y,id=1)=>{const e=new w.Event(name,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:id,button:0,pointerType:'mouse'});svg.dispatchEvent(e);return e;};
 let legacyDown=0;
 d.addEventListener('pointerdown',()=>legacyDown++,true);
 ptr('pointerdown',100,100);
 assert.equal(legacyDown,1,'Mãozinha legado recebe evento');
 assert.equal(w.TraderGestosSeguros.modeOf(0),'hand');
 b('[data-g522-mode="price"]');
 ptr('pointerdown',110,70);
 ptr('pointermove',110,135);
 ptr('pointerup',110,135);
 assert.equal(legacyDown,1,'Arraste de preço não executa mãozinha em paralelo');
 assert(calls.some(c=>c[0]===0&&c[1]==='pricepan'&&c[2]>0),'Preço desloca verticalmente');
 assert.match(d.querySelector('.g522-tool summary').textContent,/Preço/);
 calls.length=0;
 b('[data-g522-mode="time"]');
 ptr('pointerdown',110,90,2);
 ptr('pointermove',190,90,2);
 ptr('pointerup',190,90,2);
 assert(calls.some(c=>c[1]==='page'&&c[2]>0),'Tempo desloca na horizontal');
 assert(!calls.some(c=>c[1]==='pricepan'),'Modo tempo não altera preço');
 b('[data-g522-action="zoom-in"]');
 b('[data-g522-action="zoom-out"]');
 b('[data-g522-action="scale"]');
 b('[data-g522-action="latest"]');
 assert.deepEqual(calls.slice(-4).map(c=>c[1]),['zoom','zoom','scale','latest']);
 assert.equal(state.log,false,'Escala logarítmica para linear');
 const touch=(el,name,x,y,count=1)=>{
  const e=new w.Event(name,{bubbles:true,cancelable:true});
  const points=Array.from({length:count},(_,i)=>({clientX:x+i*30,clientY:y}));
  Object.defineProperty(e,'touches',{value:name==='touchend'||name==='touchcancel'?[]:points});
  Object.defineProperty(e,'changedTouches',{value:points});
  el.dispatchEvent(e);return e;
 };
 let docMoves=0,docEnds=0,blocked=0;
 d.addEventListener('touchmove',()=>docMoves++,true);
 d.addEventListener('touchend',()=>docEnds++,true);
 w.addEventListener('dt:gesto-interno',()=>blocked++);
 const cell=d.getElementById('market-cell');
 touch(cell,'touchstart',70,90);
 const moveTable=touch(cell,'touchmove',130,92);
 const endTable=touch(cell,'touchend',130,92);
 assert.equal(docMoves,0,'Arrasto interno não chega à navegação');
 assert.equal(docEnds,0,'Touchend de tabela isolado');
 assert.equal(moveTable.defaultPrevented,false,'Scroll horizontal preservado');
 assert.equal(endTable.defaultPrevented,false,'Nenhuma rolagem cancelada');
 assert.equal(blocked,1);
 const season=d.getElementById('sazon-cell');
 touch(season,'touchstart',90,90);
 touch(season,'touchmove',175,91);
 touch(season,'touchend',175,91);
 assert.equal(blocked,2,'Sazonalidade protegida');
 touch(cell,'touchstart',100,70);
 touch(cell,'touchmove',101,150);
 touch(cell,'touchend',101,150);
 assert(docMoves>0,'Arrasto vertical segue normal');
 const before=docMoves,outside=d.getElementById('outside');
 touch(outside,'touchstart',80,70);
 touch(outside,'touchmove',145,70);
 touch(outside,'touchend',145,70);
 assert(docMoves>before,'Navegação fora do conteúdo não bloqueada');
 const old=blocked;
 touch(cell,'touchstart',80,80,2);
 touch(cell,'touchmove',135,80,2);
 touch(cell,'touchend',135,80,2);
 assert.equal(blocked,old,'Multi-touch não gera bloqueio indevido');
 assert.deepEqual(logs,[],'Nenhuma falha DOM');
 console.log('✅ Terminal: mãozinha, preço/tempo, zoom, escala, ponto atual, tabela, sazonalidade e navegação.');
 w.close();
}
run().catch(err=>{console.error(err);process.exitCode=1;});