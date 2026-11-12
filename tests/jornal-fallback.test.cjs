const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {stripTypeScriptTypes} = require('node:module');
const src = stripTypeScriptTypes(fs.readFileSync('supabase/functions/mesa/fallback.ts','utf8'));
const url = 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
test('edição salva mantém conteúdo, data e aviso sem se passar por edição nova',async()=>{
  const {edicaoSalva} = await import(url), now = Date.parse('2026-11-11T23:00:00Z');
  const old = {dia:'2026-11-11',gerado:'2026-11-11T20:00:00Z',capa:{manchete:'Edição anterior'}};
  const result=edicaoSalva(old,now);
  assert.equal(result.gerado,old.gerado);assert.equal(result.desatualizado,true);assert.match(result.avisoAtualizacao,/11\/11\/2026/);
  assert.equal(edicaoSalva({...old,gerado:'2026-11-08T20:00:00Z'},now),null);assert.equal(edicaoSalva({...old,gerado:'2026-11-12T20:00:00Z'},now),null);
});
