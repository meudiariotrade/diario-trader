const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('v712: núcleo não substitui a URL do Supabase definida em config.js',()=>{
 const source=fs.readFileSync('src/domains/core/01-runtime-estilos.js','utf8');
 assert.ok(!source.includes('window.SUPA_URL ='));
 assert.ok(!source.includes('window.SUPA_KEY ='));
 assert.doesNotMatch(source,/wbpsmszecpzioaijfnsl/);
 assert.ok(JSON.parse(fs.readFileSync('release.config.json','utf8')).version>=712,'Versão não pode regredir abaixo de 712');
});
