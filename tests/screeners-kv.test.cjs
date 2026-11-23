const test = require('node:test');
const assert = require('node:assert/strict');

test('snapshot público atravessa regiões e respeita validade, ETag e universo completo', async t => {
  const worker = (await import('../cloudflare/diario-screeners/index.mjs')).default;
  const kv = new Map();
  const env = {
    SUPABASE_URL: 'https://example.supabase.co',
    SCREENER_CACHE: {
      getWithMetadata: async key => kv.get(key) || {},
      put: async (key, value, {metadata}) => kv.set(key, {value, metadata})
    }
  };
  const tasks = [];
  const ctx = {waitUntil: job => tasks.push(job)};
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    ok:true, market:'BR', universe_complete:complete, universe_rows:[]
  }, {headers:{ETag:'"snapshot"'}}));
  const previous = globalThis.caches;
  t.after(() => {globalThis.caches = previous;});
  // Duas regiões frias, sem entrada no cache HTTP local.
  globalThis.caches = {default:{match:async () => null, put:async () => {}}};
  let complete = true;
  const url = 'https://example.com/v1/screeners?market=BR';
  const first = await worker.fetch(new Request(url), env, ctx);
  assert.equal(first.headers.get('X-Snapshot-Tier'), 'origin');
  await Promise.all(tasks);
  const second = await worker.fetch(new Request(url,{headers:{'If-None-Match':'"snapshot"'}}),env,ctx);
  assert.equal(second.status,304);
  assert.equal(second.headers.get('X-Snapshot-Tier'),'kv');
  assert.equal(fetch.mock.callCount(),1);
  kv.values().next().value.metadata.expiresAt = Date.now()-1;
  complete = false;
  const third = await worker.fetch(new Request(url),env,ctx);
  assert.equal(third.headers.get('X-Snapshot-Tier'),'origin');
  await Promise.all(tasks);
  assert.ok(kv.values().next().value.metadata.expiresAt < Date.now());
});
