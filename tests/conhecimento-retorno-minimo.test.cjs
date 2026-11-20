const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const source = fs.readFileSync('supabase/functions/conhecimento-ia/index.ts', 'utf8');
const helper = source.slice(source.indexOf('async function db('), source.indexOf('async function embed('));
function request(response, init) {
  const db = vm.runInNewContext(stripTypeScriptTypes(helper) + ';db', {
    Headers, AbortSignal, sb: 'https://example.invalid', pub: 'test', fetch: async () => response
  });
  return db('teste', 'teste', init);
}
const minimal = {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates,return=minimal'}};
test('indexação aceita gravação 201 sem corpo', async () => {
  assert.equal(await request(new Response(null, {status: 201}), minimal), null);
});
test('remoção aceita 204 sem corpo e erros HTTP continuam visíveis', async () => {
  const remove = {method: 'DELETE', headers: {Prefer: 'return=minimal'}};
  assert.equal(await request(new Response(null, {status: 204}), remove), null);
  await assert.rejects(request(new Response(null, {status: 403}), minimal), /HTTP 403/);
});
test('busca preserva os dados e rejeita resposta vazia inesperada', async () => {
  assert.deepEqual(await request(Response.json([{indice: 1}]), {method: 'POST'}), [{indice: 1}]);
  await assert.rejects(request(new Response(''), {method: 'POST'}), /consulta inválida/);
});
