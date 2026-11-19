'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/domains/core/01-runtime-estilos.js'),'utf8');
const terminal=fs.readFileSync(path.join(root,'src/domains/core/17-fontes-e-balancos.js'),'utf8');
const htmls=['index.html','src/index.html'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
test('modo demo mantém CSP restritiva para fontes externas',()=>{
 assert.ok(source.includes("frame-src 'none'; script-src 'self'; img-src 'self' data: blob:"));
 assert.ok(source.includes('w.DIARIO_DEMO = f'));
});
test('CSP normal permite fontes TradingView necessárias sem unsafe-inline em scripts',()=>{
 for(const html of htmls){
  assert.ok(html.includes('https://s3.tradingview.com/external-embedding/'));
  assert.ok(html.includes("img-src 'self' data: blob: https:"));
  assert.ok(html.includes("object-src 'none'"));
  assert.ok(!html.split('script-src ')[1].split(';')[0].includes('unsafe-inline'));
 }
});
test('botão instalar do Terminal não usa onclick inline',()=>{
 assert.ok(!terminal.includes('<button class="trbtn trinst" onclick='));
 assert.ok(terminal.includes('instalar?.addEventListener("click"'));
});
