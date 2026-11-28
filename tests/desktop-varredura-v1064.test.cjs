'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('v1064 Desktop: barra de busca ampliada e centralizada no topo, largura útil total e zero colunas/cards vazios sem tocar no mobile ou Terminal',()=>{
 const css=read('src/app-theme.css');
 assert.match(css,/\/\* v1064 — Varredura Desktop:/);
 assert.match(css,/\.dt954-search-pill\{\s*order:1!important;flex:1 1 480px!important;min-width:280px!important;max-width:680px!important/);
 assert.match(css,/margin:0 auto!important/);
 assert.match(css,/body:not\(\[data-v4route=term\]\) #app#app\{\s*width:100%!important;max-width:none!important/);
 assert.match(css,/:is\(\.ui-aside,\.v829-aside,\[data-intel-etapa1\]\):empty\{\s*display:none!important/);
 assert.match(css,/:is\(\.card,\.v4-card,\.ui-card,\.dt393-card\):empty\{\s*display:none!important/);
 const rel=JSON.parse(read('release.config.json'));
 assert.ok(rel.version>=1064);
});
