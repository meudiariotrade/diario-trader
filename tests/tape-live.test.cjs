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

test("v992: snapshot público conserva preço, variação, fonte e horário, distingue referência antiga",()=>{
 const core=fs.readFileSync(path.join(__dirname,"../src/domains/core/02-estado-e-persistencia.js"),"utf8");
 const a=core.indexOf("function tapeSnapshot992("),b=core.indexOf("window.tapeDados = ",a);
 assert.ok(a>=0&&b>a);
 const ctx={};vm.runInNewContext(core.slice(a,b),ctx);
 const now=Date.parse("2026-11-25T20:00:00Z");
 const symbols=["^BVSP","BRL=X","^GSPC","^IXIC","EWZ","BTC-USD"];
 const snapshot={mercados:{grupos:[{itens:symbols.map((s,i)=>({s,px:100+i,d1:1.2,fonte:"TradingView",priceAt:new Date(now-60000).toISOString()}))}]}};
 const r=ctx.tapeSnapshot992(snapshot,now);
 assert.equal(Object.keys(r).length,6);assert.equal(r["^BVSP"].chg,1.2);assert.equal(r["BTC-USD"].referencia,false);
 snapshot.mercados.grupos[0].itens[0].priceAt=new Date(now-3600000).toISOString();
 assert.equal(ctx.tapeSnapshot992(snapshot,now)["^BVSP"].referencia,true);
 snapshot.mercados.grupos[0].itens[0].quoteStatus="divergente";
 assert.equal(ctx.tapeSnapshot992(snapshot,now)["^BVSP"],undefined);
 const i=core.indexOf("window.tapeDados = ",a),j=core.indexOf("window.tapeRedraw = l;",i);
 assert.match(core.slice(i,j),/DiarioPublico.get/);
 assert.doesNotMatch(core.slice(i,j),/scFetch\(/);
});

test("v993: contrato real do Worker com símbolos de bolsa preenche os seis cards",()=>{
 const core=fs.readFileSync(path.join(__dirname,"../src/domains/core/02-estado-e-persistencia.js"),"utf8");
 const a=core.indexOf("function tapeSnapshot992("),b=core.indexOf("window.tapeDados = ",a);
 const ctx={};vm.runInNewContext(core.slice(a,b),ctx);
 const now=Date.parse("2026-11-25T23:55:00Z");
 const pairs=[["BMFBOVESPA:IBOV","^BVSP"],["FX_IDC:USDBRL","BRL=X"],["SP:SPX","^GSPC"],["NASDAQ:IXIC","^IXIC"],["AMEX:EWZ","EWZ"],["BITSTAMP:BTCUSD","BTC-USD"]];
 const snap={mercados:{grupos:[{itens:pairs.map(([s],i)=>({s,px:100+i,d1:1.2,source:"TradingView (atrasado)",priceAt:new Date(now-60000).toISOString()}))}]}};
 const result=ctx.tapeSnapshot992(snap,now);
 for(const [i,[symbol,key]] of pairs.entries()){assert.equal(result[key]?.px,100+i,symbol);assert.equal(result[key]?.chg,1.2);}
 const worker=fs.readFileSync(path.join(__dirname,"../cloudflare/diario-noticias/producao-snapshot-v894.mjs"),"utf8");
 const catalog=worker.slice(worker.indexOf('an=[["BMFBOVESPA:IBOV"'),worker.indexOf("function bs("));
 for(const [symbol] of pairs)assert.ok(catalog.includes('"'+symbol+'"'),symbol);
});
