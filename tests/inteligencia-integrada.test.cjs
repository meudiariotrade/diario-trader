const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('src/shared/inteligencia-integrada.js', 'utf8');
function setup() { const context = { Date, Set, Map, Object, String, Array, AbortController }; context.window = context; vm.runInNewContext(code, context); return context.DiarioInteligencia; }
test('seleção normalizada é comunicada a consumidores', () => {
  const bus = setup(); let received; bus.subscribe('ativo:selecionado', x => received = x);
  assert.equal(bus.selectAsset(' petr4 ', 'terminal'), true);
  assert.equal(received.ticker, 'PETR4');
  assert.equal(bus.getSelectedAsset().origin, 'terminal');
});
test('desmontagem cancela assinaturas e não duplica listeners', () => {
  const bus = setup(); const ctrl = new AbortController(); let calls = 0;
  bus.subscribe('mercado:evento', () => calls++, ctrl.signal);
  bus.publish('mercado:evento', { source: 'cache' });
  ctrl.abort();
  bus.publish('mercado:evento', { source: 'cache' });
  assert.equal(calls, 1);
});
test('eventos desconhecidos e tickers inválidos são recusados', () => {
  const bus = setup();
  assert.equal(bus.publish('token:privado', 'secret'), false);
  assert.equal(bus.selectAsset('<script>'), false);
});
test('falha em um consumidor não bloqueia os demais', () => {
  const bus = setup(); let ok = false;
  bus.subscribe('agenda:evento', () => { throw Error('erro isolado'); });
  bus.subscribe('agenda:evento', () => { ok = true; });
  bus.publish('agenda:evento', {});
  assert.equal(ok, true);
});
