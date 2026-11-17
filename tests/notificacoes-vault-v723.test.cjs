const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const frontend = fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
const edge = fs.readFileSync('supabase/functions/notificar/index.ts','utf8');
test('Push novo Supabase usa Vault do servidor, sem expor chave privada ao app',()=>{
  assert.match(edge,/rpc\('push_configuracao'\)/);
  assert.match(edge,/\.publicKey/);
  assert.match(edge,/case 'chave'/);
  const response = edge.slice(edge.indexOf("case 'chave'"),edge.indexOf("case 'diag'"));
  assert.doesNotMatch(response,/\.privateKey/);
});
test('Reativar push renova assinatura antiga e diagnóstico contempla iPhone',()=>{
  const view = frontend.slice(frontend.indexOf('async function alEnable'),frontend.indexOf('async function alLoadEv'));
  assert.match(view,/assinatura\.unsubscribe\(\)/);
  assert.match(view,/pushManager\.subscribe/);
  assert.match(view,/No iPhone/);
  assert.match(frontend,/e\("on", "Reativar", 1\)/);
  assert.doesNotMatch(view,/Este PC não está inscrito/);
});
