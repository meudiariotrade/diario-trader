const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

function read(p){return fs.readFileSync(p,'utf8');}

test('v1066: botao IA fica no canto direito dos cards de noticias no PC',()=>{
 const css=read('src/app-theme.css');
 assert.match(css,/dt1060-pc-news[\s\S]*#mknews a\.card \.sm\.mut\{display:flex!important;align-items:center!important;justify-content:space-between!important/);
 assert.match(css,/dt1060-pc-news[\s\S]*#mknews a\.card \.dt969-acts\{display:inline-flex!important;align-items:center!important;gap:6px!important;margin-left:auto!important/);
});

test('v1066: Fluxo estrangeiro (#febox) entra compacto na 3a coluna do Mercado no PC sem duplicar',()=>{
 const diag=read('src/domains/core/13-diagnostico-e-relatorios.js');
 const etapa1=read('src/intelligence/etapa1.js');
 const css=read('src/app-theme.css');
 assert.match(diag,/m623Bloco\("Cripto ao vivo"[\s\S]*feHtml\(\)/);
 assert.match(etapa1,/\.m623-term \.m623-col:last-child/);
 assert.match(css,/#cotbox \.m623-term #febox\{/);
});
