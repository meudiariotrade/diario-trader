const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Macro financeiro anexa sessão nas seis chamadas de Terminal sem mexer em fontes',()=>{
 const src=fs.readFileSync('src/domains/core/08-terminal-e-sazonalidade.js','utf8');
 const calls=[...src.matchAll(/fetch\(([te])\.url \+ "\/functions\/v1\/macro",\s*\{\s*method: "POST",\s*headers:\s*macroAuthHeaders\(\1\)/g)];
 assert.equal(calls.length,6);
 assert.equal((src.match(/\/functions\/v1\/macro/g)||[]).length,6);
 const comum=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8');
 assert.match(comum,/function macroAuthHeaders\(config\)/);
 assert.match(comum,/h\.Authorization = "Bearer " \+ SESS\.at/);
});
test('Screener não envia solicitações que seriam 401 sem login',()=>{
 const src=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 const begin=src.indexOf('async function scFetch(');
 const stop=src.indexOf('return o.json();',begin);
 const area=src.slice(begin,stop);
 assert.match(area,/if \(!token\) throw new Error\("Entre na sua conta/);
 assert.match(area,/Authorization: "Bearer " \+ token/);
 assert.match(area,/\/functions\/v1\/screener/);
});
