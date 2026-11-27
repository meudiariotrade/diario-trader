/* v1035 — Etapa 3: gráficos (inspirado no UI Moments / Astryx, MIT).
 * 1. Curva de resultados (svg[data-uim-vals]): passar o dedo/mouse mostra o ponto;
 *    arrastar seleciona um trecho e mostra a variação; "Ampliar" dá zoom no trecho.
 * 2. DiarioGraficos.faixa(plano, fmt): régua S2–R2 com a faixa máxima–mínima e o fechamento
 *    (usada no Plano do pregão WIN/WDO).
 * Só interface: sem rede, sem timers contínuos.
 */
(function () {
  'use strict';
  if (window.DiarioGraficos) return;
  var doc = document, NS = 'http://www.w3.org/2000/svg';

  var CSS = [
    '.uim-brush{position:relative;touch-action:pan-y}',
    '.uim-brush svg{cursor:crosshair}',
    '.uim-tip{position:absolute;top:6px;left:8px;z-index:2;background:#181C28;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:6px 8px;font-size:12px;color:#E2E8F0;font-variant-numeric:tabular-nums;pointer-events:none;white-space:nowrap}',
    '.uim-tip b.g{color:#10B981}.uim-tip b.r{color:#EF4444}',
    '.uim-gbar{display:flex;gap:4px;justify-content:flex-end;margin-top:4px;min-height:0}',
    '.uim-gbar button{min-height:32px;padding:0 10px;border-radius:4px;border:1px solid rgba(255,255,255,.08);background:#12151E;color:#E2E8F0;font-size:12px}',
    '@media (max-width:760px){.uim-gbar button{min-height:40px}}',
    '.uim-faixa{margin:8px 0 4px}',
    '.uim-faixa svg{width:100%;height:56px;display:block;overflow:visible}',
    '.uim-faixa text{font:10px system-ui,sans-serif;fill:#64748B;font-variant-numeric:tabular-nums}',
    '.uim-faixa .lg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:#64748B;margin-top:2px}',
    '.uim-faixa .lg span{white-space:nowrap}',
    '.uim-faixa .lg i{display:inline-block;width:10px;height:6px;margin-right:4px;vertical-align:middle;border-radius:1px}'
  ].join('\n');
  function montarCss() {
    if (doc.getElementById('uim-graf-css')) return;
    var s = doc.createElement('style'); s.id = 'uim-graf-css'; s.textContent = CSS; doc.head.appendChild(s);
  }
  function brl(v) {
    var s = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (v > 0 ? '+' : v < 0 ? '−' : '') + 'R$ ' + s;
  }
  function dm(d) { var p = String(d || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : d; }
  function el(tag, attrs) { var e = doc.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /* ---------- 1. Curva com seleção e zoom ---------- */
  function prepararCurva(svg) {
    if (svg.dataset.uimBrush) return;
    var vals = (svg.dataset.uimVals || '').split(',').map(Number), datas = (svg.dataset.uimDatas || '').split(',');
    if (vals.length < 2 || vals.some(isNaN)) return;
    svg.dataset.uimBrush = '1';
    var x0 = +svg.dataset.uimX0 || 5, xw = +svg.dataset.uimXw || 590, y0 = +svg.dataset.uimY0 || 180, yh = +svg.dataset.uimYh || 155;
    var mn = +svg.dataset.uimMin || 0, rg = +svg.dataset.uimRng || 1;
    var n = vals.length, vb = svg.viewBox.baseVal, vbOrig = [vb.x, vb.y, vb.width, vb.height];
    var px = function (i) { return x0 + (i / (n - 1)) * xw; }, py = function (v) { return y0 - ((v - mn) / rg) * yh; };
    var wrap = doc.createElement('div');
    wrap.className = 'uim-brush';
    svg.parentNode.insertBefore(wrap, svg);
    wrap.appendChild(svg);
    var g = el('g', { 'pointer-events': 'none' });
    var faixa = el('rect', { y: 0, height: vbOrig[3], fill: 'rgba(245,158,11,.12)', visibility: 'hidden' });
    var linha = el('line', { y1: 0, y2: vbOrig[3], stroke: '#64748B', 'stroke-width': 1, 'stroke-dasharray': '3 3', 'vector-effect': 'non-scaling-stroke', visibility: 'hidden' });
    var ponto = el('circle', { r: 4, fill: '#F59E0B', visibility: 'hidden', 'vector-effect': 'non-scaling-stroke' });
    g.appendChild(faixa); g.appendChild(linha); g.appendChild(ponto); svg.appendChild(g);
    var tip = doc.createElement('div'); tip.className = 'uim-tip'; tip.hidden = true; tip.setAttribute('aria-live', 'polite');
    wrap.appendChild(tip);
    var bar = doc.createElement('div'); bar.className = 'uim-gbar';
    var bZoom = doc.createElement('button'); bZoom.type = 'button'; bZoom.textContent = 'Ampliar trecho'; bZoom.hidden = true;
    var bTudo = doc.createElement('button'); bTudo.type = 'button'; bTudo.textContent = 'Ver tudo'; bTudo.hidden = true;
    bar.appendChild(bZoom); bar.appendChild(bTudo);
    wrap.insertAdjacentElement('afterend', bar);
    var sel = null, ini = null, arrastou = false, zoom = null;

    function idx(e) {
      var r = svg.getBoundingClientRect(), v = svg.viewBox.baseVal;
      var x = v.x + ((e.clientX - r.left) / r.width) * v.width;
      return Math.max(0, Math.min(n - 1, Math.round(((x - x0) / xw) * (n - 1))));
    }
    function mostrarPonto(i) {
      linha.setAttribute('x1', px(i)); linha.setAttribute('x2', px(i)); linha.setAttribute('visibility', 'visible');
      ponto.setAttribute('cx', px(i)); ponto.setAttribute('cy', py(vals[i])); ponto.setAttribute('visibility', 'visible');
      var d = i ? vals[i] - vals[i - 1] : vals[0];
      tip.innerHTML = 'Trade ' + (i + 1) + ' · ' + dm(datas[i]) + ' · acumulado <b class="' + (vals[i] >= 0 ? 'g' : 'r') + '">' + brl(vals[i]) + '</b> · no trade <b class="' + (d >= 0 ? 'g' : 'r') + '">' + brl(d) + '</b>';
      tip.hidden = false;
    }
    function mostrarSel(a, b) {
      var i = Math.min(a, b), j = Math.max(a, b);
      sel = [i, j];
      faixa.setAttribute('x', px(i)); faixa.setAttribute('width', Math.max(1, px(j) - px(i))); faixa.setAttribute('visibility', 'visible');
      var base = i ? vals[i - 1] : 0, d = vals[j] - base, k = j - i + 1;
      tip.innerHTML = dm(datas[i]) + ' a ' + dm(datas[j]) + ' · ' + k + ' trade' + (k > 1 ? 's' : '') + ' · <b class="' + (d >= 0 ? 'g' : 'r') + '">' + brl(d) + '</b>';
      tip.hidden = false;
      bZoom.hidden = j - i < 1;
    }
    function limpar() {
      sel = null; faixa.setAttribute('visibility', 'hidden'); linha.setAttribute('visibility', 'hidden'); ponto.setAttribute('visibility', 'hidden');
      tip.hidden = true; bZoom.hidden = true;
    }
    svg.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ini = idx(e); arrastou = false;
      if (e.pointerType === 'mouse') svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
      mostrarPonto(ini);
    });
    svg.addEventListener('pointermove', function (e) {
      var i = idx(e);
      if (ini != null && (e.pointerType === 'mouse' ? e.buttons & 1 : true) && i !== ini) { arrastou = true; linha.setAttribute('visibility', 'hidden'); ponto.setAttribute('visibility', 'hidden'); mostrarSel(ini, i); return; }
      if (ini == null && !sel && e.pointerType === 'mouse') mostrarPonto(i);
    });
    svg.addEventListener('pointerup', function () { if (!arrastou && ini != null) { sel = null; faixa.setAttribute('visibility', 'hidden'); bZoom.hidden = true; } ini = null; });
    svg.addEventListener('pointercancel', function () { ini = null; });
    svg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && ini == null && !sel) limpar(); });
    /* Toque: segurar e arrastar na horizontal seleciona; rolar na vertical continua rolando a página. */
    svg.style.touchAction = 'pan-y';
    bZoom.addEventListener('click', function () {
      if (!sel) return;
      var a = px(sel[0]), b = px(sel[1]), pad = (b - a) * 0.04;
      zoom = [a - pad, b + pad];
      svg.setAttribute('viewBox', (a - pad) + ' ' + vbOrig[1] + ' ' + (b - a + 2 * pad) + ' ' + vbOrig[3]);
      bTudo.hidden = false; bZoom.hidden = true;
    });
    bTudo.addEventListener('click', function () {
      zoom = null; svg.setAttribute('viewBox', vbOrig.join(' ')); bTudo.hidden = true; limpar();
    });
  }

  /* ---------- 2. Régua de faixa x pivôs ---------- */
  function faixa(o, fmt) {
    try {
      if (!o || ![o.S2, o.S1, o.P, o.R1, o.R2, o.H, o.L, o.C].every(function (v) { return typeof v === 'number' && isFinite(v); })) return '';
      fmt = typeof fmt === 'function' ? fmt : function (v) { return v.toLocaleString('pt-BR'); };
      var lo = Math.min(o.S2, o.L), hi = Math.max(o.R2, o.H), W = 300, pad = 8;
      if (!(hi > lo)) return '';
      var X = function (v) { return (pad + ((v - lo) / (hi - lo)) * (W - 2 * pad)).toFixed(1); };
      var niv = [['S2', o.S2, '#10B981'], ['S1', o.S1, '#10B981'], ['P', o.P, '#E2E8F0'], ['R1', o.R1, '#EF4444'], ['R2', o.R2, '#EF4444']];
      var s = '<svg viewBox="0 0 ' + W + ' 56" preserveAspectRatio="none" role="img" aria-label="Faixa do pregão de referência: mínima ' + fmt(o.L) + ', máxima ' + fmt(o.H) + ', fechamento ' + fmt(o.C) + ', entre S2 ' + fmt(o.S2) + ' e R2 ' + fmt(o.R2) + '">';
      s += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="22" y2="22" stroke="rgba(255,255,255,.12)" stroke-width="2"/>';
      s += '<rect x="' + X(o.L) + '" width="' + Math.max(1, X(o.H) - X(o.L)).toFixed(1) + '" y="17" height="10" rx="1" fill="rgba(245,158,11,.35)"/>';
      niv.forEach(function (n) {
        s += '<line x1="' + X(n[1]) + '" x2="' + X(n[1]) + '" y1="12" y2="32" stroke="' + n[2] + '" stroke-width="1.5"/>';
        s += '<text x="' + X(n[1]) + '" y="44" text-anchor="middle">' + n[0] + '</text>';
      });
      s += '<path d="M' + X(o.C) + ' 10 l-4 -6 h8 z" fill="#F59E0B"/>';
      s += '</svg>';
      return '<div class="uim-faixa">' + s + '<div class="lg"><span><i style="background:rgba(245,158,11,.35)"></i>Mín. ' + fmt(o.L) + ' – Máx. ' + fmt(o.H) + '</span><span><i style="background:#F59E0B;width:6px"></i>Fech. ' + fmt(o.C) + '</span></div></div>';
    } catch (e) { return ''; }
  }

  var agendado = false;
  function varrer() { agendado = false; doc.querySelectorAll('svg[data-uim-vals]:not([data-uim-brush])').forEach(prepararCurva); }
  function iniciar() {
    montarCss();
    new MutationObserver(function () { if (!agendado) { agendado = true; requestAnimationFrame(varrer); } }).observe(doc.body, { childList: true, subtree: true });
    varrer();
  }
  window.DiarioGraficos = Object.freeze({ faixa: faixa, versao: 1 });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
