const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('v916: erros do aplicativo ficam somente no aparelho; sem remessa de telemetria ao Supabase',()=>{
 const source=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
 assert.doesNotMatch(source,/\/rest\/v1\/erros_app/);
 assert.match(source,/function erLista\(\)/);
 assert.match(source,/APP_STORAGE\.setItem\(ERL\.k/);
 assert.match(source,/async function erEnvia\(\)/);
});
test('v916: não se muda o comportamento do Radar nem se publica dados privados',()=>{
 const source=fs.readFileSync('src/domains/core/06-risco-e-tecnico.js','utf8');
 assert.match(source,/diario-radar\.lucianosilva43567\.workers\.dev/);
 assert.doesNotMatch(source,/e\.url \+ "\/functions\/v1\/radar"/);
 const records=fs.readFileSync('src/shared/diario-registros-v913.js','utf8');
 assert.match(records,/window\.DiarioD1Principal\?\.active\(uid\)/);
 assert.match(records,/credentials:'omit'/);
});
