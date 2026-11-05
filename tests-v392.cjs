'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('node:path');
const dir=__dirname;
const txt=n=>fs.readFileSync(p.join(dir,n),'utf8');
const js=txt('design-v392.js'),css=txt('design-v392.css'),html=txt('index.html'),sw=txt('sw.js');
const tests=[
 ['Fontes v392 publicadas',()=>{assert(html.includes('design-v392.js?v=392'));assert(html.includes('design-v392.css?v=392'));assert(sw.includes('design-v392.js'));assert(sw.includes('design-v392.css'))}],
 ['Cache Service Worker renovado',()=>assert(sw.includes('diario-v392-migracao-integral-01'))],
 ['Sem esconder funções antigas',()=>{assert(js.includes('nativeWorkspace('));assert(!js.includes('Ferramentas completas da versão anterior'));assert(!js.includes('dt392-legacy'));}],
 ['Navegação inferior duplicada ocultada',()=>{assert(css.includes('#bnav{display:none!important}'));assert(css.includes('body.dt392-active > nav'))}],
 ['Meta diária independente da geral',()=>{assert(js.includes('metaDia'));assert(js.includes('S?.prop?.meta'));assert(!js.includes('S?.goals?.meta'));assert(js.includes('currentRules()'));}],
 ['Regras por fase com persistência',()=>{assert(js.includes('data-dt392-rule-phase'));assert(js.includes("rule.phase=el.value"));assert(js.includes('data-rule-phase'));}],
 ['Campos brasileiros e estadunidenses separados',()=>{assert(js.includes("MDM==='us'"));assert(js.includes('d.us||{}'))}],
 ['Todas as ferramentas nativas preservadas na tela',()=>{assert(js.includes('Array.from(root.childNodes).forEach'));assert(js.includes('content.appendChild(body)'));}],
];
let count=0;for(const [name,fun] of tests){fun();console.log('OK',name);count++;}
console.log(`${count}/${tests.length} verificações estáticas aprovadas.`);
