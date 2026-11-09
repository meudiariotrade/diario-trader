const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, localFile } = require('../scripts/build.cjs');

test('a publicação encontra os recursos do HTML e do service worker e valida JavaScript', () => {
  const assets = validate();
  assert.ok(assets.includes('index.html'));
  assert.ok(assets.includes('camadas-v522.js'));
  assert.ok(!assets.some(file => /\.(ts|sql|map)$/.test(file)));
});
test('recursos ausentes e caminhos fora da publicação interrompem a validação', () => {
  assert.throws(() => localFile('arquivo-ausente.js'), /ausente/);
  assert.throws(() => localFile('../package.json'), /inválido/);
  assert.equal(localFile('https://example.invalid/a.js'), null);
});
