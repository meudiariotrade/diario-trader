'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('v756 autoriza Cloudflare nas duas CSPs',()=>{
 for(const path of ['index.html','src/index.html']){
  const csp=read(path).match(/connect-src [^"]+/)?.[0]||'';
  assert.match(csp,/https:\/\/workers\.dev/);
  assert.match(csp,/https:\/\/\*\.workers\.dev/);
 }
});
test('v756 envia ao Worker somente dados públicos',()=>{
 const c=read('src/analysis/analises.js');
 assert.match(c,/endpoint\.edge\?\{\}:\{apikey:c\.key\}/);
 const w=read('cloudflare/diario-screeners/index.mjs');
 assert.match(w,/Somente leitura/);
 assert.doesNotMatch(w,/SUPABASE_SERVICE_ROLE_KEY|Authorization:\s*Bearer/);
});
test('v756 renova sessão e restringe host das Edge Functions',()=>{
 const c=read('src/domains/core/02-estado-e-persistencia.js');
 assert.match(c,/async function edgeFetchAutenticado/);
 assert.match(c,/destino\.origin !== new URL\(server\.url\)\.origin/);
 assert.match(c,/cabecalhos\.set\("Authorization", "Bearer " \+ SESS\.at\)/);
 assert.match(c,/RQ_LEITURAS_PENDENTES/);
 assert.match(c,/RQ_DIARIO_REVISOES/);
});
test('v756 bloqueia chamadas nomeadas sem helper',()=>{
 for(const path of ['src/domains/core/02-estado-e-persistencia.js','src/domains/core/07-conta-e-integracoes.js','src/domains/core/13-diagnostico-e-relatorios.js','src/domains/layers/01-navegacao-e-fluxos.js','src/domains/layers/02-carteira-e-terminal.js'])
  assert.doesNotMatch(read(path),/\bfetch\([^\n]*\.url\s*\+\s*["']\/functions\/v1\/(?:screener|macro|mesa-macro|logos)["']/);
});
test('v756 fecha timers no ciclo de tela',()=>{
 assert.match(read('src/domains/core/03-render-e-operacoes.js'),/DiarioCiclos\?\.enter\(tab\)/);
 assert.match(read('src/domains/core/03-render-e-operacoes.js'),/clearInterval\(SCA\)/);
 assert.match(read('src/domains/core/07-conta-e-integracoes.js'),/clearInterval\(MDO_AUTO_INTERVAL\)/);
});
test('v756 alinha versões',()=>{
 assert.equal(JSON.parse(read('release.config.json')).version,756);
 assert.equal(JSON.parse(read('package.json')).version,'756.0.0');
});
