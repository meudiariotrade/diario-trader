const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../src/domains/core/13-diagnostico-e-relatorios.js'), 'utf8');

// Exercita o conversor verdadeiro do aplicativo sem criar conexões com Finnhub.
const ini = src.indexOf('function fhSym(code, grupo = "") {');
const fim = src.indexOf('function fhLista()', ini);
assert.ok(ini > 0 && fim > ini, 'Conversor Finnhub encontrado');
const trecho = src.slice(ini, fim);
const sym = new Function('FH_INDICES', 'FH_MOEDAS', 'FH_ACOES', trecho + '\nreturn fhSym;')(
  { 'Nikkei 225': 'OANDA:JP225_USD', DAX: 'OANDA:DE30_EUR' },
  new Set(Intl.supportedValuesOf ? Intl.supportedValuesOf('currency') : ['USD','EUR','JPY','GBP','AUD','NZD','BRL']),
  ['EWZ','SPY','QQQ','AAPL']
);

test('Finnhub converte pares novos automaticamente sem tabela de pares', () => {
  for (const [entrada, esperado] of [
    ['AUD/USD','OANDA:AUD_USD'], ['EUR/JPY','OANDA:EUR_JPY'],
    ['GBPJPY','OANDA:GBP_JPY'], ['NZD/CAD','OANDA:NZD_CAD'],
    ['FX:EURUSD','OANDA:EUR_USD'], ['FX_IDC:USDBRL','OANDA:USD_BRL'],
    ['OANDA:EUR_USD','OANDA:EUR_USD'],
  ]) assert.equal(sym(entrada, 'fx'), esperado, entrada);
});
test('Ações de watchlists não são confundidas com moedas', () => {
  assert.equal(sym('NASDAQ:GOOGL','us'),'GOOGL');
  assert.equal(sym('NYSE:BRK.B','us'),'BRK.B');
  assert.equal(sym('NASDAQ:ABCDEF','us'),'ABCDEF');
  assert.equal(sym('TVC:DXY','fx'),null);
});
test('Nikkei e DAX têm mapeamento Finnhub opcional e fallback TradingView', () => {
  assert.equal(sym('Nikkei 225','fut'),'OANDA:JP225_USD');
  assert.equal(sym('DAX','fut'),'OANDA:DE30_EUR');
  assert.match(src, /c: "Nikkei 225"[\s\S]*?"TVC:NI225"/);
  assert.match(src, /c: "DAX"[\s\S]*?"INDEX:DEU40"[\s\S]*?"XETR:DAX"/);
});
test('Desktop reutiliza a lista mobile e preserva emergentes separadamente', () => {
  assert.match(src, /const linhasMobile = cqItens\("fx"\)/);
  assert.match(src, /m623Bloco\("Moedas", moedas,/);
  assert.match(src, /m623Bloco\("Emergentes", g\("em"\),/);
  assert.match(src, /m623Bloco\("Futuros", futuros,/);
  assert.match(src, /for \(const it of cqLinhasExtras\(category\)\)/);
});
test('Finnhub mantém cotações reais e TradingView como fallback', () => {
  assert.match(src, /FH_TODOS\.has\(s\)/);
  assert.match(src, /type: "subscribe", symbol: s/);
  assert.match(src, /const f = fhAplica\(it\.k, it\.px, it\.d1, it\.g\)/);
  assert.match(src, /function cqExtrasCarrega\(\)/);
  assert.match(src, /\/functions\/v1\/terminal/);
});
