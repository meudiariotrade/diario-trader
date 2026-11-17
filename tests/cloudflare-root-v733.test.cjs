const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Cloudflare conectado com diretório / encontra Worker de notícias isolado', () => {
  const root = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
  const nested = JSON.parse(fs.readFileSync('cloudflare/diario-noticias/wrangler.jsonc', 'utf8'));
  assert.equal(root.name, 'diario-trader-noticias');
  assert.equal(root.main, 'cloudflare/diario-noticias/index.mjs');
  assert.ok(fs.statSync(path.resolve(root.main)).isFile());
  assert.equal(root.name, nested.name);
  assert.equal(root.compatibility_date, nested.compatibility_date);
  assert.deepEqual(root.triggers, nested.triggers);
  assert.deepEqual(root.kv_namespaces, nested.kv_namespaces);
  assert.deepEqual(root.vars, nested.vars);
  assert.deepEqual(root.kv_namespaces, [{ binding: 'NEWS_CACHE' }]);
});
