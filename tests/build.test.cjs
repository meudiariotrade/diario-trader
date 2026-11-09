const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, localFile, publicationFiles } = require('../scripts/build.cjs');

test('a publicação encontra os recursos do HTML e do service worker e valida JavaScript', () => {
  const assets = validate();
  assert.ok(assets.includes('index.html'));
  assert.ok(assets.includes('camadas-v522.js'));
  assert.ok(!assets.some(file => /\.(ts|sql|map)$/.test(file)));
});
test('publicação exclui cópias históricas sem descartar recursos ativos ou arquivos referenciados', () => {
  assert.deepEqual(publicationFiles(['index.html','nucleo-v522.js','nucleo-v521.js','camadas-v500.js','estilo-v519.css','livro.pdf','icon-192.png'], new Set(['nucleo-v522.js','estilo-v519.css'])),
    ['index.html','nucleo-v522.js','estilo-v519.css','livro.pdf','icon-192.png']);
});
test('recursos ausentes e caminhos fora da publicação interrompem a validação', () => {
  assert.throws(() => localFile('arquivo-ausente.js'), /ausente/);
  assert.throws(() => localFile('../package.json'), /inválido/);
  assert.equal(localFile('https://example.invalid/a.js'), null);
});
