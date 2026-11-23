const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Cloudflare conectado com diretório / encontra Worker de notícias isolado', () => {
  const root = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
  const nested = JSON.parse(fs.readFileSync('cloudflare/diario-noticias/wrangler.jsonc', 'utf8'));
  assert.equal(root.name, 'diario-trader');
  assert.equal(root.main, 'cloudflare/diario-noticias/producao-snapshot-v890.mjs');
  assert.equal(nested.main, 'producao-snapshot-v890.mjs');
  assert.equal(root.keep_vars,true);
  assert.equal(nested.keep_vars,true);
  assert.ok(fs.statSync(path.resolve(root.main)).isFile());
  assert.equal(root.name, nested.name);
  assert.equal(root.compatibility_date, nested.compatibility_date);
  assert.deepEqual(root.triggers, nested.triggers);
  assert.deepEqual(root.kv_namespaces, nested.kv_namespaces);
  assert.deepEqual(root.vars, nested.vars);
  assert.deepEqual(root.kv_namespaces, [{ binding: 'NEWS_CACHE',id:'6fbbde51848b47919b38de922f6c0362' }]);
  assert.deepEqual(root.d1_databases,nested.d1_databases);
  assert.deepEqual(root.ratelimits,nested.ratelimits);
});
