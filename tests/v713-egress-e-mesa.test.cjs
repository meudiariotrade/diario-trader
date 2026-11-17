const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p, 'utf8');

test('v713: sync remota usa 10 minutos e volta ao foco', () => {
  const s = read('src/domains/core/13-diagnostico-e-relatorios.js');
  assert.match(s, /setInterval\(syConferirEstado, 10 \* 60e3\)/);
  assert.match(s, /visibilitychange/);
});
test('v713: resumos só consultam quando Estudos estiver visível', () => {
  const s = read('src/domains/core/04-analises-e-estudos.js');
  assert.match(s, /navigator\.onLine && rsTela\(\)\) rsLoad\(!0\)/);
  assert.match(s, /\}, 45e3\)/);
});
test('v713: Insiders reaparece logo abaixo de Movimentos', () => {
  const s = read('src/domains/layers/04-design-e-navegacao.js');
  assert.match(s, /t\.after\(e\);/);
  assert.match(s, /t\.dataset\.v518Ready !== "1"/);
  assert.match(s, /DIARIO_V519\?\.insCartao\?\.\(\)/);
  assert.doesNotMatch(s, /\}, 1700\)/);
});
test('v713: só a Mesa proprietária é retirada', () => {
  const menu = read('src/domains/core/05-mercado-e-noticias.js');
  const layout = read('src/domains/layers/01-navegacao-e-fluxos.js');
  const feature = read('src/domains/core/12-carteira-e-inteligencia.js');
  assert.doesNotMatch(menu, /"Mesa proprietária"/);
  assert.doesNotMatch(layout, /\["mesa", "Mesa proprietária"\]/);
  assert.doesNotMatch(feature, /data-id="mesa"/);
  assert.match(feature, /\["painel", "Metas, limites e backup"\]/);
  assert.match(read('src/index.html'), /mesa-v562\.js/);
});
