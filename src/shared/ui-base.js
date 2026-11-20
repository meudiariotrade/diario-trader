/* v828 — Componentes base do redesign (todas as abas menos o Terminal).
 * Só montam HTML com as classes .ui-*; não guardam estado, não fazem rede.
 * Os botões e atributos data-* das telas continuam sendo passados por quem chama,
 * então os handlers existentes seguem funcionando.
 */
(function (root) {
  'use strict';
  if (root.DiarioUI) return;
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* Card: { titulo, acao: {rotulo, attrs}, corpo (HTML já seguro), span: 3|4|6|8|9|12, classe } */
  function card(o) {
    o = o || {};
    var span = o.span ? ' ui-s' + o.span : '';
    var acao = o.acao ? '<button type="button" class="ui-act" ' + (o.acao.attrs || '') + '>' + esc(o.acao.rotulo) + '</button>' : '';
    var head = o.titulo ? '<header><h2>' + esc(o.titulo) + '</h2>' + acao + '</header>' : '';
    return '<section class="ui-card' + span + (o.classe ? ' ' + esc(o.classe) : '') + '"' + (o.attrs ? ' ' + o.attrs : '') + '>' + head + (o.corpo || '') + '</section>';
  }
  /* KpiCard: { rotulo, valor, detalhe, tom: 'g'|'r'|'' } — valor e detalhe já formatados. */
  function kpi(o) {
    o = o || {};
    var tom = o.tom === 'g' ? ' class="ui-g"' : o.tom === 'r' ? ' class="ui-r"' : '';
    return '<div class="ui-kpi"><span>' + esc(o.rotulo) + '</span><b' + tom + '>' + esc(o.valor) + '</b>' + (o.detalhe ? '<small>' + esc(o.detalhe) + '</small>' : '') + '</div>';
  }
  function kpis(lista) { return '<div class="ui-kpis">' + (lista || []).map(kpi).join('') + '</div>'; }
  /* StatusBadge: texto + tom 'ok' | 'warn' | 'err' | '' (neutro). */
  function badge(texto, tom) { return '<span class="ui-badge' + (tom ? ' ' + esc(tom) : '') + '">' + esc(texto) + '</span>'; }
  function bento(html) { return '<div class="ui-bento">' + (html || '') + '</div>'; }
  function split(principal, lateral) { return '<div class="ui-split"><div class="ui-main">' + (principal || '') + '</div><aside class="ui-aside">' + (lateral || '') + '</aside></div>'; }
  root.DiarioUI = Object.freeze({ esc: esc, card: card, kpi: kpi, kpis: kpis, badge: badge, bento: bento, split: split });
})(typeof window !== 'undefined' ? window : globalThis);
