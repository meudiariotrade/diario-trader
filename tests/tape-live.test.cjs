const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../src/market/tape-live.js"), "utf8");
function criar(clock = Date.now()) {
  const janela = { TRM: { TR: { px: {}, profit: {} }, trBinance(){} }, tapeDados: () => ({}) };
  const documento = { hidden: false, addEventListener(){} };
  vm.runInNewContext(source, {
    window: janela, document: documento, navigator: { onLine: true },
    setInterval(){}, setTimeout(){}, Date
  }, { timeout: 1000 });
  return { janela, clock };
}
test("Profit recente tem prioridade em ações brasileiras sem Supabase", () => {
  const { janela, clock } = criar();
  janela.TRM.TR.profit.PETR4 = { px: 34.56, d1: -0.8, up: clock - 2000 };
  const q = janela.tapeVivo("PETR4");
  assert.equal(q.px, 34.56);
  assert.equal(q.chg, -0.8);
  assert.match(q.fonte, /Profit/);
});
test("preços antigos e futuros diferentes do câmbio spot são rejeitados", () => {
  const { janela, clock } = criar();
  janela.TRM.TR.profit.PETR4 = { px: 34.56, d1: 0.2, up: clock - 900001 };
  janela.TRM.TR.profit.DOLFUT = { px: 5.4, d1: 1, up: clock - 1000 };
  assert.equal(janela.tapeVivo("PETR4"), null);
  assert.equal(janela.tapeVivo("BRL=X"), null);
});
test("Binance alimenta os quatro criptoativos e a variação de 24 horas", () => {
  const { janela, clock } = criar();
  for (const [key, par] of [["BTC-USD","btcusdt"],["ETH-USD","ethusdt"],["SOL-USD","solusdt"],["XRP-USD","xrpusdt"]]) {
    janela.TRM.TR.px["BIN:" + par] = { px: 500, d1: 2.4, ts: clock - 1000 };
    const q = janela.tapeVivo(key);
    assert.equal(q.px, 500);
    assert.equal(q.chg, 2.4);
    assert.match(q.fonte, /Binance/);
  }
});
test("Finnhub entrega negociação recente sem inventar variação diária", () => {
  const { janela, clock } = criar();
  janela.TRM.TR.px["FH:EWZ"] = { px: 30.1, ts: clock - 2000 };
  const q = janela.tapeVivo("EWZ");
  assert.equal(q.px, 30.1);
  assert.equal(q.chg, null);
  assert.match(q.fonte, /Finnhub/);
});
test("sem fluxo ao vivo mantém último preço com FECHADO somente sem snapshot", () => {
  const { janela, clock } = criar();
  janela.TRM.TR.px["BIN:btcusdt"] = { px: 99000, d1: 1.2, ts: clock - 2000 };
  assert.equal(janela.tapeVivo("BTC-USD").fechado, false);
  delete janela.TRM.TR.px["BIN:btcusdt"];
  assert.equal(janela.tapeVivo("BTC-USD").fechado, true);
  janela.tapeDados = () => ({ "BTC-USD": { px: 98900, chg: 0.5 } });
  assert.equal(janela.tapeVivo("BTC-USD"), null);
});
test("módulo não faz polling de tabelas Supabase nem lê iframes TradingView", () => {
  assert.doesNotMatch(source, /\/rest\/v1\/|\/functions\/v1\/|fetch\s*\(/);
  assert.doesNotMatch(source, /contentDocument|iframe\.|postMessage\(/);
  assert.match(source, /setInterval\(desenha, 2000\)/);
});
