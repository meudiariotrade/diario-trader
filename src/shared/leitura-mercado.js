/* Núcleo de leitura contextual: cálculos determinísticos, sem chamadas externas.
 * Adaptadores das abas fornecem snapshots já validados; nenhum dado privado sai daqui.
 */
(function(root) {
  'use strict';
  if (root.DiarioLeituraMercado) return;
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  function surprise(event) {
    if (!event || !finite(event.actual) || !finite(event.consensus)) return null;
    const delta = event.actual - event.consensus;
    const relative = event.consensus === 0 ? null : delta / Math.abs(event.consensus) * 100;
    return Object.freeze({ delta, relative, direction: delta > 0 ? 'acima' : delta < 0 ? 'abaixo' : 'igual' });
  }
  function provenance(record, now) {
    if (!record || typeof record !== 'object' || !record.source || !record.timestamp) return Object.freeze({ status: 'sem_fonte', ageMs: null });
    const stamp = Date.parse(record.timestamp);
    const age = (finite(now) ? now : Date.now()) - stamp;
    if (!Number.isFinite(stamp) || age < -60000) return Object.freeze({ status: 'data_invalida', ageMs: null });
    const ttl = finite(record.ttlMs) && record.ttlMs >= 0 ? record.ttlMs : 15 * 60000;
    return Object.freeze({ status: age > ttl ? 'desatualizado' : 'atual', ageMs: age });
  }
  function related(items, ticker, limit) {
    const t = String(ticker || '').toUpperCase();
    if (!/^[A-Z0-9.^_-]{1,24}$/.test(t)) return [];
    const max = Math.max(0, Math.min(50, Number.isInteger(limit) ? limit : 10));
    return (Array.isArray(items) ? items : [])
      .filter(x => x && Array.isArray(x.tickers) && x.tickers.some(y => String(y).toUpperCase() === t))
      .slice(0, max);
  }
  function tradeStats(trades) {
    const closed = (Array.isArray(trades) ? trades : []).filter(t => t && t.status === 'closed' && finite(t.pnl));
    const wins = closed.filter(t => t.pnl > 0);
    const losses = closed.filter(t => t.pnl < 0);
    const sum = a => a.reduce((n, t) => n + t.pnl, 0);
    const gain = sum(wins), loss = sum(losses);
    return Object.freeze({
      count: closed.length, wins: wins.length, losses: losses.length,
      breakeven: closed.length - wins.length - losses.length,
      net: sum(closed), winRate: closed.length ? wins.length / closed.length : null,
      profitFactor: loss < 0 ? gain / Math.abs(loss) : null
    });
  }
  root.DiarioLeituraMercado = Object.freeze({ surprise, provenance, related, tradeStats });
})(typeof window !== 'undefined' ? window : globalThis);
