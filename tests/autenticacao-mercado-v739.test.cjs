const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Macro público vai Cloudflare sem renovar sessão; mantém as cinco chamadas do Terminal',()=>{
 const src=fs.readFileSync('src/domains/core/08-terminal-e-sazonalidade.js','utf8');
 const calls=[...src.matchAll(/macroFetchComSessao\(([te])\.url \+ "\/functions\/v1\/macro",\s*\{\s*method: "POST",\s*headers:\s*macroAuthHeaders\(\1\)/g)];
 assert.equal(calls.length,5);
 assert.equal((src.match(/\/functions\/v1\/macro/g)||[]).length,5);
 const persist=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 const code=persist.slice(persist.indexOf('async function edgeFetchAutenticado'),persist.indexOf('async function hashAuth()'));
 assert.ok(code.indexOf('destino.pathname === "/functions/v1/macro"')<code.indexOf('await tok()'));
 assert.match(code,/credentials: "omit"/);
 const comum=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8');
 assert.match(comum,/function macroAuthHeaders\(config\)/);
 assert.match(comum,/h\.Authorization = "Bearer " \+ SESS\.at/);
});
test('Screener público consulta Cloudflare sem login, sem credenciais e sem fallback Supabase',()=>{
 const src=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 const begin=src.indexOf('async function scFetch(');
 const stop=src.indexOf('function scUi()',begin);
 assert.ok(begin>=0&&stop>begin,'Delimitação da função do Scanner');
 const area=src.slice(begin,stop);
 assert.match(area,/https:\/\/diario-trader\.lucianosilva43567\.workers\.dev\/v1\/diario/);
 assert.match(area,/method:\s*"GET"/);
 assert.match(area,/credentials:\s*"omit"/);
 assert.match(area,/range:\s*"2y"/);
 assert.doesNotMatch(area,/\/functions\/v1\/|supabase\.co|edgeFetchAutenticado|Authorization|apikey|\bSESS\b|\btok\s*\(|\bcfg\s*\(/i);
});
