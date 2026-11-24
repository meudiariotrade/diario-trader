const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('egress: precos locais nao fazem polling Supabase de 2,5 segundos',()=>{
 const core=read('src/domains/core/02-estado-e-persistencia.js');
 const loop=core.slice(core.indexOf('async function lvPoll()'),core.indexOf('async function lvDelayed()'));
 assert.doesNotMatch(loop,/\/rest\/v1\/cotacoes/);
 assert.doesNotMatch(core,/setInterval\(lvPoll,\s*2500\)/);
 assert.match(loop,/window\.TRM/);
 const portfolio=read('src/domains/core/12-carteira-e-inteligencia.js');
 assert.doesNotMatch(portfolio,/setInterval\(async \(\) => \{\s*try \{\s*if \(document\.hidden \|\| !SESS/);
 assert.doesNotMatch(portfolio,/\}, 3e3\)\)\);/);
});
test('egress: ponte local preferida e leitura remota limitada a 15 minutos',()=>{
 const src=read('profit-cotacoes-v552.js');
 assert.match(src,/DIARIO_PONTE_LOCAL\?\.cotacoesUrl/);
 assert.match(src,/CQ\.cloudTs/);
 assert.match(src,/15 \* 6e4/);
 assert.doesNotMatch(src,/original\.apply\(this/);
 assert.match(src,/select=ticker,ult,var,updated_at,dat,hor&limit=250&user_id=eq\./);
 assert.match(src,/\/v1\/profit-quotes/);assert.match(src,/CQ\.cloudTs \|\| 0/);
 assert.match(src,/manual \? 15e3 : 15 \* 6e4/);
 const conn=read('src/domains/layers/01-navegacao-e-fluxos.js');
 assert.match(conn,/trFinnhub/);assert.match(conn,/trBinance/);
});
test('egress: cache de consulta curto nao reutiliza login, escrita ou diario',()=>{
 const src=read('src/domains/core/02-estado-e-persistencia.js');
 assert.match(src,/LEITURAS_TTL = 15 \* 60 \* 1000/);
 assert.match(src,/leituraCacheKey\(path\).*syncOwner\(\)/);
 assert.match(src,/somenteLeitura && !t\.cacheRefresh/);
 assert.match(src,/AbortSignal\.timeout\(4000\)/);
 const m=src.match(/podeCache =([\s\S]*?)cached =/);
 assert.ok(m);assert.doesNotMatch(m[1],/\/diario/);assert.doesNotMatch(m[1],/auth|token/);
});
test('egress: Mentor mantem aulas, textos e audio locais; nunca pre-carrega videos',()=>{
 const pdf=read('src/studies/tecnica-pdf.js'),voz=read('src/studies/tecnica-voz.js'),aulas=read('src/studies/tecnica-aulas.js');
 assert.match(pdf,/idb\('kv','put'/);assert.match(pdf,/localRead\('aulas'/);
 assert.match(pdf,/localWrite\('texto'/);assert.match(pdf,/CACHE_TTL=15\*60\*1000/);
 assert.match(voz,/cloudRetryAfter/);assert.doesNotMatch(voz,/setInterval\(/);
 assert.match(aulas,/vozCacheSalvar/);assert.match(aulas,/vozCacheLer/);
 assert.match(aulas,/preload="none"/);assert.match(aulas,/keepPlayer/);
 assert.doesNotMatch(aulas,/browserVoice\(/);
});
