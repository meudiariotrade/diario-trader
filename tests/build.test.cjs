const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, localFile, publicationFiles } = require('../scripts/build.cjs');

test('a publicação encontra os recursos do HTML e do service worker e valida JavaScript', () => {
  const assets = validate();
  assert.ok(assets.includes('index.html'));
  assert.ok(assets.includes('camadas-v560.js'));
  assert.ok(!assets.some(file => /\.(ts|sql|map)$/.test(file)));
});
test('manifesto publica somente entradas, dependências e recursos dinâmicos declarados',()=>{const {reachableFiles}=require('../scripts/build.cjs'),result=reachableFiles();for(const f of ['app.js','inicio.js','interface.js'])assert.ok(!result.files.includes(f));for(const f of ['analises.js','config.js','pdf-lib.min.js','cnpi.js'])assert.ok(result.files.includes(f));assert.equal(Object.keys(result.reasons).length,result.files.length)});
test('publicação exclui cópias históricas sem descartar recursos ativos ou arquivos referenciados', () => {
  assert.deepEqual(publicationFiles(['index.html','nucleo-v522.js','nucleo-v521.js','camadas-v500.js','estilo-v519.css','livro.pdf','icon-192.png'], new Set(['nucleo-v522.js','estilo-v519.css'])),
    ['index.html','nucleo-v522.js','estilo-v519.css','livro.pdf','icon-192.png']);
});
test('recursos ausentes e caminhos fora da publicação interrompem a validação', () => {
  assert.throws(() => localFile('arquivo-ausente.js'), /ausente/);
  assert.throws(() => localFile('../package.json'), /inválido/);
  assert.equal(localFile('https://example.invalid/a.js'), null);
});
