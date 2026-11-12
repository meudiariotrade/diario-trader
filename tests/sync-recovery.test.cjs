const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criar } = require('../sync-recovery.js');
test('timeout agenda recuperação, confirma sucesso e cancela a fila', async () => {
  const tasks = new Map(), delays = [], states = []; let id = 0, calls = 0, q;
  q = criar({ owner: () => 'conta-a', run: async () => { calls++; q.saved(); }, schedule: (fn, ms) => { delays.push(ms); tasks.set(++id, fn); return id; }, cancel: n => tasks.delete(n), changed: s => states.push(s.state) });
  assert.ok(q.failed(Object.assign(new Error('timeout'), { status: 500 })));
  assert.equal(q.pending, true); await tasks.get(id)();
  assert.equal(calls, 1); assert.equal(q.pending, false); assert.deepEqual(states, ['pending', 'synced']); assert.equal(delays[0], 3000);
});
test('troca de conta e erros de autorização não repetem o salvamento', async () => {
  let owner = 'a', task, calls = 0;
  const q = criar({ owner: () => owner, run: async () => calls++, schedule: f => { task = f; return 1; }, cancel: () => {} });
  q.failed(new Error('Failed to fetch')); owner = 'b'; await task(); assert.equal(calls, 0);
  assert.equal(q.failed({ status: 401 }), false); assert.equal(q.failed({ code: 'SESSION_CHANGED', status: 500 }), false);
});
test('offline mantém a fila sem enviar e limita o intervalo das tentativas', async () => {
  let task, calls = 0; const delays = [];
  const q = criar({ owner: () => 'a', online: () => false, run: async () => calls++, schedule: (f, d) => { task = f; delays.push(d); return 1; }, cancel: () => {} });
  q.failed(new Error('offline')); for (let i = 0; i < 10; i++) await task();
  assert.equal(calls, 0); assert.ok(q.pending); assert.equal(delays.at(-1), 120000);
});
