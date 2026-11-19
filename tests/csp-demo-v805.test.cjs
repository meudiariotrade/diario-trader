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
 assert.match(source,/frame-src 'none'; script-src 'self'; img-src 'self' data: blob:/);
 assert.match(source,/w\\.DIARIO_DEMO = f/);
});
test('CSP normal permite somente fontes TradingView necessárias',()=>{
 for(const html of htmls){
  assert.match(html,/script-src[^;]*https:\/\/s3\\.tradingview\\.com\/external-embedding\//);
  assert.match(html,/img-src[^;]*https:/);
  assert.match(html,/object-src 'none'/);
 }
});
test('botão instalar do Terminal não usa onclick inline',()=>{
 assert.doesNotMatch(terminal,/<button class="trbtn trinst" onclick=/);
 assert.match(terminal,/instalar\\?\\.addEventListener\\("click"/);
});
