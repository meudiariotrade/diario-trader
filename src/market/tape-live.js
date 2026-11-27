/* v760 — Barra rolante: preços da Ponte Profit, Finnhub e Binance existentes.
   Apenas caches e WebSockets no navegador; sem polling do Supabase.
   TradingView permanece como visual de contingência: o iframe não é raspado. */
(function (root, doc) {
  "use strict";
  if (root.TapeLiveQuote) return;
  const BIN = Object.freeze({
    "BTC-USD": "btcusdt",
    "ETH-USD": "ethusdt",
    "SOL-USD": "solusdt",
    "XRP-USD": "xrpusdt"
  });
  const PF = Object.freeze({
    "^BVSP": ["IBOV"],
    "BRL=X": ["USDBRL"],
    "DX-Y.NYB": ["DXY"],
    "^GSPC": ["SPX"],
    "^IXIC": ["NDX", "NASDAQ"],
    "^DJI": ["DJI", "DOW"],
    "CL=F": ["WTI"],
    "GC=F": ["OURO"],
    EWZ: ["EWZ"]
  });
  const ultimo = new Map();
  const numero = (x) => x === null || x === undefined || x === "" ? null : (Number.isFinite(Number(x)) ? Number(x) : null);
  function instante(x) {
    if (typeof x === "number" && Number.isFinite(x))
      return x > 1e12 ? x : x > 1e9 ? x * 1000 : x;
    const data = Date.parse(x || "");
    return Number.isFinite(data) ? data : 0;
  }
  function monta(dado, fonte, agora, ttl, natureza) {
    if (!dado) return null;
    const px = numero(dado.px == null ? dado.ult : dado.px);
    const ts = instante(dado.ts || dado.up || dado.em || dado.updated_at || dado.horarioPreco);
    if (!(px > 0) || !ts || ts > agora + 60000 || agora - ts > ttl) return null;
    let chg = numero(dado.d1 == null ? dado.var : dado.d1);
    if (chg == null && numero(dado.fec) > 0) chg = (px / numero(dado.fec) - 1) * 100;
    return { px, chg, fonte, dadoEm: new Date(ts).toISOString(), natureza, fechado: false };
  }
  function profit(chave, agora) {
    const nomes = PF[chave] || (/^[A-Z]{4}\d{1,2}$/.test(chave) ? [chave] : []);
    if (!nomes.length) return null;
    const terminal = root.TRM?.TR;
    let local = null;
    try { local = typeof CQ === "object" ? CQ.pf : null; } catch {}
    for (const nome of nomes) {
      for (const cache of [local, terminal?.profit]) {
        const q = monta(cache?.[nome], "Profit · ponte", agora, 90000, "pregão");
        if (q) return q;
      }
      const q = monta(root.TRM?.profitDe?.(nome), "Profit · ponte", agora, 90000, "pregão");
      if (q) return q;
    }
    return null;
  }
  function cripto(chave, agora) {
    const par = BIN[chave];
    if (!par) return null;
    return monta(root.TRM?.TR?.px?.["BIN:" + par], "Binance · USDT (24h)", agora, 45000, "24h");
  }
  function finnhub(chave, agora) {
    const simbolo = chave === "EWZ" ? "EWZ" : null;
    if (!simbolo) return null;
    const dado = root.TRM?.TR?.px?.["FH:" + simbolo];
    const q = monta(dado, "Finnhub · negociação", agora, 90000, "pregão");
    if (!q) return null;
    // Negócio via WS não informa fechamento anterior. Evita porcentagem fabricada.
    q.chg = null;
    if (dado?.horarioPreco) {
      const horaFonte = instante(dado.horarioPreco);
      if (!horaFonte || horaFonte > agora + 60000 || agora - horaFonte > 90000) return null;
      q.dadoEm = new Date(horaFonte).toISOString();
    }
    return q;
  }
  function consulta(chave, agora = Date.now()) {
    const central=root.DiarioMarketData;if(central?.has(chave)){const q=central.get(chave);if(q)return q;}
    // v926: este módulo é carregado depois do núcleo e sobrescreve tapeVivo.
    // Consulta primeiro a referência validada de EWZ exposta pelo núcleo.
    if (chave === "EWZ") {
      let adr = null;
      try { adr = root.DiarioEwzCotacao?.() || null; } catch {}
      if (adr && Number.isFinite(adr.px) && adr.px > 0 &&
          typeof adr.chg === "number" && Number.isFinite(adr.chg)) {
        ultimo.set(chave, adr);
        return adr;
      }
    }
    const q = profit(chave, agora) || cripto(chave, agora) || finnhub(chave, agora);
    if (q) {
      ultimo.set(chave, q);
      return q;
    }
    const dadosBackup = root.tapeDados?.();
    const anterior = ultimo.get(chave);
    return !dadosBackup?.[chave] && anterior ? { ...anterior, fechado: true } : null;
  }
  root.tapeVivo = consulta;
  function conexoes() {
    if (doc.hidden || typeof navigator !== "undefined" && navigator.onLine === false || root.DIARIO_DEMO) return;
    try {
      if(typeof tab!=='undefined'&&['home','dia'].includes(tab))root.DiarioMarketData?.refresh?.().then(()=>{root.tapeRedraw?.();root.DiarioInteligenciaEtapa1?.refresh?.();}).catch(()=>{});
      // Reaproveita o WS já gerenciado pela camada de cotações, sem conexão duplicada.
      root.QuoteConnection?.sockets?.();
      if (typeof SESS !== "undefined" && SESS?.at)
        root.TRM?.trBinance?.(["btcusdt", "ethusdt", "solusdt", "xrpusdt"], "tape");
    } catch {}
  }
  async function ponte() {
    if (doc.hidden || root.DIARIO_DEMO || !root.DIARIO_PONTE_LOCAL?.cotacoesUrl || typeof cqPonte !== "function") return;
    try {
      await cqPonte();
      root.tapeRedraw?.();
    } catch {}
  }
  function desenha() { if (!doc.hidden) root.tapeRedraw?.(); }
  setTimeout(conexoes, 700);
  setInterval(conexoes, 60000);
  setInterval(ponte, 15000); // Apenas leitura da ponte local configurada; sem rede Supabase por segundo.
  setInterval(desenha, 2000); // Atualiza DOM a partir dos caches locais, nunca uma API.
  doc.addEventListener("visibilitychange", () => { if (!doc.hidden) { conexoes(); ponte(); desenha(); } });
  root.addEventListener?.("online", () => { conexoes(); ponte(); });
  root.TapeLiveQuote = Object.freeze({ consulta, monta, instante, fonte: "Profit/Finnhub/Binance" });
})(window, document);
