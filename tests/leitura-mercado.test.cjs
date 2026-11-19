const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = { Date, Number, Object, Array, String, Math };
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync('src/shared/leitura-mercado.js', 'utf8'), sandbox);
const engine = sandbox.DiarioLeituraMercado;
test('surpresa econômica distingue realizado e consenso sem inferir impacto', () => {
  const x = engine.surprise({ actual: 3.5, consensus: 3 });
  assert.equal(x.delta, .5);
  assert.equal(x.direction, 'acima');
  assert.equal(engine.surprise({ actual: null, consensus: 3 }), null);
});
test('fonte e atualização obrigatórias', () => {
  assert.equal(engine.provenance({ source: 'fonte', timestamp: '2026-01-01T00:00:00Z', ttlMs: 1000 }, Date.parse('2026-01-01T00:00:02Z')).status, 'desatualizado');
  assert.equal(engine.provenance({ timestamp: '2026-01-01T00:00:00Z' }).status, 'sem_fonte');
});
test('relaciona eventos a ticker sem mesclar ativos', () => {
  const result = engine.related([{ tickers: ['PETR4'] }, { tickers: ['VALE3'] }], 'petr4');
  assert.equal(result.length, 1);
});
test('operações abertas não contaminam estatística de operações fechadas', () => {
  const stats = engine.tradeStats([{ status: 'open', pnl: 900 }, { status: 'closed', pnl: 100 }, { status: 'closed', pnl: -50 }]);
  assert.equal(stats.count, 2);
  assert.equal(stats.net, 50);
  assert.equal(stats.profitFactor, 2);
});
