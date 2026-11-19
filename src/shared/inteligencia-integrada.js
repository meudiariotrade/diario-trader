/* Inteligência integrada — barramento local sem persistência privada nem polling.
 * Contrato: cada aba publica contexto leve e se desinscreve ao desmontar.
 * Não altera DOM, layout, rotas, cotações ou operações.
 */
(function (root) {
  'use strict';
  if (root.DiarioInteligencia) return;
  const allowed = new Set(['ativo:selecionado', 'mercado:evento', 'agenda:evento', 'analises:atualizada', 'operacoes:resumo', 'contexto:limpo']);
  const listeners = new Map();
  let selected = null;
  function normalizeTicker(value) {
    const t = String(value || '').trim().toUpperCase();
    return /^[A-Z0-9.^_-]{1,24}$/.test(t) ? t : null;
  }
  function subscribe(type, callback, signal) {
    if (!allowed.has(type) || typeof callback !== 'function') return function () {};
    if (signal && signal.aborted) return function () {};
    let set = listeners.get(type);
    if (!set) { set = new Set(); listeners.set(type, set); }
    set.add(callback);
    let active = true;
    function off() {
      if (!active) return;
      active = false;
      set.delete(callback);
      if (!set.size) listeners.delete(type);
      if (signal) signal.removeEventListener('abort', off);
    }
    if (signal) signal.addEventListener('abort', off, { once: true });
    return off;
  }
  function publish(type, payload) {
    if (!allowed.has(type)) return false;
    const callbacks = listeners.get(type);
    if (!callbacks) return true;
    for (const callback of Array.from(callbacks)) {
      try { callback(payload); } catch (_) { /* isolação entre consumidores */ }
    }
    return true;
  }
  function selectAsset(ticker, origin) {
    const t = normalizeTicker(ticker);
    if (!t) return false;
    selected = Object.freeze({ ticker: t, origin: String(origin || 'app').slice(0, 40), at: Date.now() });
    return publish('ativo:selecionado', selected);
  }
  function clearContext() { selected = null; publish('contexto:limpo', null); }
  root.DiarioInteligencia = Object.freeze({
    subscribe, publish, selectAsset, clearContext,
    getSelectedAsset: function () { return selected; },
    normalizeTicker
  });
})(typeof window !== 'undefined' ? window : globalThis);
