'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
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
