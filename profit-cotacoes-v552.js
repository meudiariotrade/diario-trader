/* v552 — com a ponte ao vivo, as cotações da B3 vêm do Profit.
   A ponte publica os contratos como WINFUT/WDOFUT/INDFUT/DOLFUT; a versão anterior só aceitava WINZ26 etc. */
(function (root, doc) {
  'use strict';
  if (root.ProfitCotacoes552 || typeof cqPonte !== 'function') return;
  const FUT = /^(WIN|WDO|IND|DOL)(?:FUT|[FGHJKMNQUVXZ]\d\d|\$N?)$/;
  const g = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch { return d; } };
  const original = cqPonte;
  cqPonte = async function () {
    try {
      if (typeof SESS === 'undefined' || !SESS?.uid) { CQ.pf={}; CQ.saved={}; CQ.owner=null; return; }
      if (CQ.owner !== SESS.uid) { CQ.pf={}; CQ.saved={}; CQ.pfTs=0; CQ.owner=SESS.uid; }
      if (Date.now() - (CQ.pfTs || 0) < 15e3) return;
      const owner = SESS.uid;
      CQ.pfTs = Date.now();
      const linhas = await (await rq('/rest/v1/cotacoes?select=ticker,ult,var,updated_at&user_id=eq.' + SESS.uid)).json();
      if (SESS?.uid !== owner || !Array.isArray(linhas)) return;
      const t = {}, saved = {}, vig = { WIN: codFut('WIN'), WDO: codFut('WDO'), IND: codFut('IND'), DOL: codFut('DOL') };
      (linhas || []).forEach(o => {
        const s = String(o.ticker || '').toUpperCase();
        if (!(+o.ult > 0) || !Number.isFinite(Date.parse(o.updated_at)) || Date.parse(o.updated_at) > Date.now()+60000) return;
        const n = { px: +o.ult, d1: o.var != null && isFinite(+o.var) ? +o.var : null, tk: s, em: o.updated_at };
        const older = saved[s];
        if (!older || Date.parse(n.em) > Date.parse(older.em)) saved[s] = n;
        const stale = Date.now() - Date.parse(n.em) > 3 * 6e4;
        if (!stale) t[s] = n;
        const r = FUT.exec(s);
        // Contrato vigente tem prioridade; depois o contínuo (WINFUT); depois qualquer outro.
        if (r) {
          const k = '@' + r[1];
          // Never use an expired contract as the generic current future.
          if (s !== vig[r[1]] && !/FUT$/.test(s)) return;
          for (const target of stale ? [saved] : [saved,t]) {
            const current = target[k];
            if (!current || (s === vig[r[1]] && current.tk !== vig[r[1]]) || (s === current.tk && Date.parse(n.em)>Date.parse(current.em))) target[k] = n;
          }
        }
      });
      CQ.pf = t; CQ.saved = saved;
    } catch { return original.apply(this, arguments); }
  };
  // Mantém os preços atualizados enquanto a aba Cotações está aberta (sem atrapalhar a digitação na busca).
  setInterval(async () => {
    if (doc.hidden || g(() => tab, '') !== 'mercado' || g(() => MKT.tab, '') !== 'cq') return;
    const antes = g(() => CQ.pfTs, 0);
    await cqPonte();
    if (g(() => CQ.pfTs, 0) === antes) return;
    const foco = doc.activeElement;
    if (foco && foco.matches?.('#cotbox input, #cqbox input')) return;
    try { cqPinta(); } catch {}
  }, 15e3);
  // Linha de fonte curta no lugar do parágrafo longo.
  function fonte() {
    const box = doc.querySelector('#app:not(.v503-fantasma) #cotbox'); if (!box || box.classList.contains('market-quotes')) return;
    const p = [...box.querySelectorAll(':scope > div.sm.mut')].find(d => /^Fonte:/.test(d.textContent.trim()));
    if (!p) return;
    const vivo = Object.keys(g(() => CQ.pf, {}) || {}).length > 0;
    const txt = vivo ? 'Preços da B3 ao vivo pelo Profit. Exterior, moedas e cripto pelo TradingView.' : 'Ponte do Profit desligada: preços do TradingView, B3 com até 15 min de atraso.';
    p.classList.add('m552-fonte', 'v552-fonte');
    if (p.textContent !== txt) p.textContent = txt;
  }
  let q = false;
  new MutationObserver(() => { if (!q) { q = true; requestAnimationFrame(() => { q = false; fonte(); }); } }).observe(doc.body, { childList: true, subtree: true });
  root.ProfitCotacoes552 = Object.freeze({ FUT });
})(window, document);
