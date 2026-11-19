'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('Binance: renderizações repetidas não furam o backoff após falha de rede',()=>{
 const vm=require('node:vm'),source=fs.readFileSync('src/domains/core/17-fontes-e-balancos.js','utf8');
 const from=source.indexOf('  function J(E, P) {'),to=source.indexOf('  function se(E) {',from);let now=10000;const sockets=[];
 class Socket{constructor(){this.readyState=0;sockets.push(this)}close(){this.readyState=3;this.onclose?.()}}
 const context={e:{},WebSocket:Socket,Date:{now:()=>now},v(){},Ie(){}};vm.createContext(context);vm.runInContext(source.slice(from,to)+'this.connect=J;',context);
 context.connect(['btcusdt'],'tape');sockets[0].readyState=3;sockets[0].onerror();sockets[0].onclose();
 for(let i=0;i<60;i++)context.connect(['btcusdt'],'tape');assert.equal(sockets.length,1);assert.equal(context.e.wsFailures,1);
 now+=5000;context.connect(['btcusdt'],'tape');assert.equal(sockets.length,2);sockets[1].readyState=1;sockets[1].onopen();assert.equal(context.e.wsRetryAt,0);assert.equal(context.e.wsFailures,0);
});
test('Terminal: repetir instalação não regrava atributos dos controles já protegidos',()=>{
 const dom=new JSDOM('<body class="trmon"><main id="app"><div class="trm"><button data-trtela="FLUXO">Fluxo</button><button data-trcmd="ECO">Economia</button></div></main></body>',{runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.tab='term';w.TRM={FN:{FLUXO:'Fluxo (abre a tela)',ECO:'Economia'},EXT:{},ALIAS:{},roda(){}};
 w.eval(fs.readFileSync('terminal-comandos.js','utf8'));
 const mo=new w.MutationObserver(()=>{});mo.observe(w.document.querySelector('#app'),{attributes:true,subtree:true});
 w.TerminalCommandPolicy.install();w.TerminalCommandPolicy.install();
 assert.equal(mo.takeRecords().length,0,'Instalação idempotente não gera mutações de atributos');
 const blocked=w.document.querySelector('[data-trtela]'),allowed=w.document.querySelector('[data-trcmd="ECO"]');assert.equal(blocked.hidden,true);assert.equal(blocked.style.getPropertyPriority('display'),'important');assert.equal(allowed.hidden,false);mo.disconnect();dom.window.close();
});
test('SVG: ícone monitor e identificador desconhecido produzem paths válidos',()=>{
 const source=fs.readFileSync('src/domains/core/05-mercado-e-noticias.js','utf8');
 const start=source.indexOf('    const o = {\n        home:');const end=source.indexOf('    window.icoSvg = r;',start);
 assert(start>=0&&end>start);const dom=new JSDOM('',{runScripts:'outside-only'});
 dom.window.eval(source.slice(start,end)+'window.testIcon=r;');
 for(const name of ['monitor','home','qa-unknown']){const svg=dom.window.testIcon(name);assert(!svg.includes('undefined'));assert.match(svg,/<path d="[Mm]/);}
 dom.window.close();
});
