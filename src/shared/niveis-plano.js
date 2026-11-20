/* v822 — Níveis do plano por ativo (entrada, stop, alvos), guardados no aparelho.
 * "Levar para o plano" no Técnico e no Fibonaccing grava aqui; o gráfico do Terminal desenha.
 * Sem rede e sem Supabase. Cada ativo expira em 7 dias.
 */
(function (root, doc) {
  'use strict';
  if (root.DiarioNiveis) return;
  var KEY = 'diario-niveis-v822', VALIDADE = 7 * 864e5;
  function le() { try { return JSON.parse(root.localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function grava(o) { try { root.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* segue */ } }
  function tk(t) { var s = String(t || '').trim().toUpperCase(); return /^[A-Z0-9.^_-]{1,24}$/.test(s) ? s : null; }
  function num(v) { var n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v); return isFinite(n) && n > 0 ? n : null; }
  function get(t) {
    var k = tk(t), o = le(), v = k && o[k];
    if (!v) return null;
    if (Date.now() - (v.em || 0) > VALIDADE) { delete o[k]; grava(o); return null; }
    return v;
  }
  function set(t, n) {
    var k = tk(t); if (!k || !n) return false;
    var v = { entrada: num(n.entrada), stop: num(n.stop), alvos: (n.alvos || []).map(num).filter(Boolean).slice(0, 4), origem: String(n.origem || 'app').slice(0, 30), em: Date.now() };
    if (v.entrada == null && v.stop == null && !v.alvos.length) return false;
    var o = le(); o[k] = v; grava(o);
    try { root.dispatchEvent(new CustomEvent('diario:niveis', { detail: { ticker: k } })); } catch (e) { /* segue */ }
    return true;
  }
  function list() {
    var o = le(), out = [];
    Object.keys(o).forEach(function (k) { var v = get(k); if (v) out.push(Object.assign({ ticker: k }, v)); });
    return out.sort(function (a, b) { return b.em - a.em; });
  }
  function remove(t) { var k = tk(t), o = le(); if (k && o[k]) { delete o[k]; grava(o); } }
  /* Botão "Levar para o plano": data-niv822="TICKER" data-e data-s data-a="a1|a2|a3" data-o="origem". */
  if (doc) doc.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-niv822]');
    if (!b) return;
    var t = b.getAttribute('data-niv822');
    var ok = set(t, { entrada: b.getAttribute('data-e'), stop: b.getAttribute('data-s'), alvos: String(b.getAttribute('data-a') || '').split('|'), origem: b.getAttribute('data-o') });
    if (ok && root.DiarioBarraContexto) root.DiarioBarraContexto.definirFoco(t, 'plano');
    var msg = ok ? 'Níveis de ' + tk(t) + ' levados ao plano. O gráfico do Terminal já mostra entrada, stop e alvos.' : 'Sem níveis válidos para levar ao plano.';
    if (typeof root.toast === 'function') root.toast(msg);
    b.textContent = ok ? 'No plano ✓' : b.textContent;
  });
  root.DiarioNiveis = Object.freeze({ get: get, set: set, remove: remove, list: list });
})(typeof window !== 'undefined' ? window : globalThis, typeof document !== 'undefined' ? document : null);
