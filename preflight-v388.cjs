/** Preflight da versão publicada; sem rede e sem modificar arquivos. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const expected='386';
const html=read('index.html'),sw=read('sw.js'),manifest=read('manifest.webmanifest'),app=read('app.js');
assert(app.includes(`const APP_VER="v${expected}"`),'APP_VER incoerente');
assert(sw.includes('diario-v390-mercado-icones-01'),'Cache de instalação não foi atualizado');
for(const f of ['recursos.js','inicio.js','app.js','interface.js']){
 assert(new RegExp(f.replaceAll('.','\\.')+`\\?v=${expected}(?:-|"|')`).test(html),`Script ${f} sem cache busting`);
}
assert(manifest.includes(`?v=${expected}`),'Ícones do manifest desatualizados');
const core=(sw.match(/const CORE=\[([^\]]+)\]/)||[])[1];
const extra=(sw.match(/const EXTRA=\[([^\]]+)\]/)||[])[1];
assert(core&&extra,'Lista de arquivos em cache não localizada');
const assets=[...core.matchAll(/"([^"]+)"/g),...extra.matchAll(/"([^"]+)"/g)].map(m=>m[1]);
assert.equal(assets.length,new Set(assets).size,'Arquivo repetido em CORE/EXTRA');
for(const f of assets){assert(!f.includes('..')&&!f.startsWith('/'),'Caminho inseguro em cache');assert(fs.statSync(path.join(root,f)).isFile(),`Arquivo ausente: ${f}`)}
const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
assert.equal(new Set(scripts).size,scripts.length,'Scripts duplicados no HTML');
for (const f of ['icon-pack-v390.js','identidade-ativos-v390.js','mercado-visual-v388.js','mercado-visual-v388.css']){
 assert(assets.includes(f),`Recurso v388 fora do cache: ${f}`);
 assert(fs.existsSync(path.join(root,f)),`Arquivo v388 ausente: ${f}`);
}
assert(html.includes('identidade-ativos-v390.js?v=390'),'Hotfix v387 não é carregado');
assert(html.includes('mercado-visual-v388.js?v=388'),'Módulo visual não é carregado');
assert(html.includes('mercado-visual-v388.css?v=388'),'CSS visual não é carregado');
// Chaves publishable ou anon não são segredos. Chaves de serviço e privadas não podem estar no frontend.
const publicFiles=['mercado-visual-v388.js','icon-pack-v390.js','identidade-ativos-v390.js','index.html','recursos.js','inicio.js','app.js','interface.js','identidade-ativos-v390.js','calendario-mercado-v379.js','editorial-financeiro-v379.js','diagnostico-v386.js','terminal-mobile-v385.js','estudos.js','arte.js','ingles.js','cnpi.js','sw.js'];
const highRisk=[/sb_secret_[a-z0-9_-]{10,}/ig,/sk-(?:proj-)?[a-z0-9_-]{20,}/ig,/AKIA[0-9A-Z]{16}/g,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,/\bSUPABASE_SERVICE_ROLE_KEY\b/g];
for(const f of publicFiles){const body=read(f);for(const rx of highRisk){rx.lastIndex=0;assert(!rx.test(body),`Possível segredo privilegiado em ${f}: ${rx.source}`)}}
assert(!/<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]/i.test(html),'Scripts inline em página com CSP que os bloqueia');
assert(html.includes('<meta name="referrer" content="no-referrer">'),'Links por token não devem vazar em Referer');
console.log(`Preflight v388: ${assets.length} recursos de cache + ${publicFiles.length} arquivos públicos verificados; nenhum segredo de serviço detectado.`);
