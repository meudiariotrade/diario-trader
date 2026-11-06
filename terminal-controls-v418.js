/* v418 — Gráfico com navegação direta (mão), sem painel de botões ocupando a tela. */
(function(root) {
  'use strict';
  const doc = root.document;
  if (!doc) return;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const key = 'dt-terminal-space-v416'; // preservar ajuste salvo na v416
  let spaces = {};
  try { const s = JSON.parse(root.localStorage?.getItem(key) || '{}'); if (s && typeof s === 'object') spaces = s; } catch (_) {}
  const getSpace = p => clamp(Number(spaces[p] ?? 14) || 0, 0, 35);
  const saveSpace = (p, n) => {
    spaces[p] = clamp(Number(n) || 0, 0, 35);
    try { root.localStorage?.setItem(key, JSON.stringify(spaces)); } catch (_) {}
  };
  function installPadding() {
    if (!root.TerminalChart) return false;
    root.TerminalChart.padding = (panel, count) => Math.max(0, Math.round((+count || 0) * getSpace(panel) / 100));
    return true;
  }
  installPadding();
  const send = (panel, action, value, anchor) => root.TRM?.tec?.chartView?.(panel, action, value, anchor);
  const svgOf = target => target?.closest?.('svg[data-g9svg]');
  const panelOf = svg => Number(svg?.dataset?.g9svg);
  const chartBox = svg => svg?.closest('[data-trp]') || svg?.closest('.trpb') || svg?.parentElement;
  let renderQueued = false;
  const label = panel => '<div class="g418-toolbar" data-g418-panel="'+panel+'" aria-label="Mover gráfico">'
    + '<span class="g418-guide">✋ <b>Arraste o gráfico</b><span class="g418-desktop"> para mover preço e tempo</span><span class="g418-mobile"> · pinça para zoom</span></span>'
    + '<button type="button" data-g418-action="reset" title="Restaurar gráfico" aria-label="Restaurar enquadramento">⟲</button>'
    + '<details class="g418-more"><summary aria-label="Opções do gráfico">⋯</summary><div class="g418-options">'
    + '<label>Margem direita <output data-g418-out="'+panel+'">'+getSpace(panel)+'%</output><input type="range" data-g418-space="'+panel+'" min="0" max="35" step="1" value="'+getSpace(panel)+'" aria-label="Margem direita"></label>'
    + '<button type="button" data-g418-action="auto">Preço automático</button>'
    + '</div></details><span class="g418-sr" aria-live="polite"></span></div>';
  function enhance() {
    renderQueued = false;
    installPadding();
    for (const svg of doc.querySelectorAll('svg[data-g9svg]')) {
      const panel = panelOf(svg), parent = chartBox(svg);
      if (!Number.isFinite(panel) || !parent) continue;
      const bar = parent.querySelector('.g9bar');
      if (!bar) continue;
      const old = parent.querySelector('.g416-controls');
      if (old) old.remove();
      const existing = parent.querySelector('.g418-toolbar');
      if (existing && Number(existing.dataset.g418Panel) !== panel) existing.remove();
      if (!parent.querySelector('.g418-toolbar')) bar.insertAdjacentHTML('afterend', label(panel));
    }
  }
  function queueEnhance() {
    if (renderQueued) return;
    renderQueued = true;
    root.requestAnimationFrame(enhance);
  }
  const ready = () => {
    enhance();
    const target = doc.getElementById('app') || doc.body;
    new MutationObserver(queueEnhance).observe(target, { childList: true, subtree: true });
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  function info(panel, msg) {
    const el = doc.querySelector('.g418-toolbar[data-g418-panel="' + panel + '"] .g418-sr');
    if (el) el.textContent = msg;
  }
  // Os comandos extras ficam dentro de ⋯; a tela principal usa apenas gestos.
  doc.addEventListener('click', e => {
    const btn = e.target.closest?.('[data-g418-action]');
    if (!btn) return;
    const host = btn.closest('.g418-toolbar'), panel = Number(host?.dataset.g418Panel);
    if (!Number.isFinite(panel)) return;
    e.preventDefault(); e.stopPropagation();
    if (btn.dataset.g418Action === 'reset') {
      send(panel, 'reset', 0); info(panel, 'Visualização restaurada');
    } else if (btn.dataset.g418Action === 'auto') {
      send(panel, 'priceauto', 0); info(panel, 'Preço automático');
      host.querySelector('details')?.removeAttribute('open');
    }
  }, true);
  doc.addEventListener('input', e => {
    const slider = e.target.closest?.('[data-g418-space]');
    if (!slider) return;
    const out = slider.closest('.g418-options')?.querySelector('[data-g418-out]');
    if (out) out.textContent = slider.value + '%';
  }, true);
  doc.addEventListener('change', e => {
    const slider = e.target.closest?.('[data-g418-space]');
    if (!slider) return;
    const panel = Number(slider.dataset.g418Space);
    if (!Number.isFinite(panel)) return;
    saveSpace(panel, Number(slider.value)); installPadding();
    send(panel, 'page', 0); info(panel, 'Margem direita ' + getSpace(panel) + '%');
  }, true);

  // Gestos: um dedo/mouse desloca TEMPO e PREÇO juntos.
  // A API nativa 'move' aplica as duas transformações numa única renderização.
  // Os gestos são acumulados e aplicados ao soltar para não destruir o SVG sob o dedo.
  let active = null;
  const at = e => ({ x: e.clientX, y: e.clientY });
  const d = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);
  function clearPreview(g) {
    if (!g) return;
    try { g.svg.style.removeProperty('transform'); g.svg.classList.remove('g418-grabbing'); } catch (_) {}
  }
  function init(e) {
    const svg = svgOf(e.target);
    if (!svg || e.button > 0 || !root.TRM?.tec?.chartView) return;
    const panel = panelOf(svg), rect = svg.getBoundingClientRect();
    if (!Number.isFinite(panel) || rect.width < 15 || rect.height < 15) return;
    if (active && (active.svg !== svg || active.panel !== panel)) { clearPreview(active); active = null; }
    if (!active) active = {
      panel, svg, rect, pointers: new Map(), starts: new Map(), multi: false,
      initialPinch: null, latestPinch: null, moved: false
    };
    active.starts.set(e.pointerId, at(e));
    active.pointers.set(e.pointerId, at(e));
    if (active.pointers.size === 2) {
      active.multi = true;
      const points = [...active.pointers.values()];
      active.initialPinch = { a: { ...points[0] }, b: { ...points[1] } };
      active.latestPinch = { a: { ...points[0] }, b: { ...points[1] } };
      clearPreview(active);
    }
    active.svg.classList.add('g418-grabbing');
    // Não tomar o scroll em toda a página: apenas no SVG do gráfico.
    if (e.pointerType === 'touch' && e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
  }
  function move(e) {
    const g = active;
    if (!g || !g.pointers.has(e.pointerId)) return;
    const p = at(e);
    g.pointers.set(e.pointerId, p);
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
    if (g.pointers.size >= 2) {
      const points = [...g.pointers.values()];
      g.latestPinch = { a: { ...points[0] }, b: { ...points[1] } };
      return;
    }
    if (g.multi) return;
    const a = g.starts.get(e.pointerId) || p;
    const dx = p.x-a.x, dy = p.y-a.y;
    if (Math.hypot(dx,dy) < 5) return;
    g.moved = true;
    // Prévia visual acompanha a mão; a escala real é atualizada ao soltar.
    g.svg.style.transform = 'translate3d(' + clamp(dx, -g.rect.width*.5, g.rect.width*.5).toFixed(1) + 'px,'
      + clamp(dy, -g.rect.height*.35, g.rect.height*.35).toFixed(1) + 'px,0)';
  }
  function finish(e, cancelled) {
    const g = active;
    if (!g || !g.pointers.has(e.pointerId)) return;
    const end = at(e);
    if (!cancelled) g.pointers.set(e.pointerId, end);
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
    if (g.pointers.size >= 2) {
      const points = [...g.pointers.values()];
      g.latestPinch = { a: { ...points[0] }, b: { ...points[1] } };
    }
    g.pointers.delete(e.pointerId);
    if (g.pointers.size) return;
    clearPreview(g); active = null;
    if (cancelled) return;
    if (g.multi && g.initialPinch && g.latestPinch) {
      const {a,b} = g.initialPinch, {a:c,b:f} = g.latestPinch;
      const widthRatio = clamp(Math.abs(a.x-b.x)/Math.max(18,Math.abs(c.x-f.x)), .45, 2.3);
      const heightRatio = clamp(Math.abs(a.y-b.y)/Math.max(18,Math.abs(c.y-f.y)), .45, 2.3);
      const initialDist = d(a,b), finalDist = d(c,f);
      const zoom = clamp(initialDist / Math.max(18, finalDist), .45, 2.3);
      const mid = clamp(((a.x+b.x)/2-g.rect.left)/g.rect.width,0,1);
      if (Math.abs(zoom-1) > .055) {
        send(g.panel, 'zoom', zoom, mid);
        // Pinça uniforme: a escala do preço também se aproxima/afasta.
        send(g.panel, 'pricezoom', zoom);
        info(g.panel, 'Zoom alterado');
      }
      return;
    }
    const start = [...g.starts.values()][0] || end;
    const dx = end.x-start.x, dy = end.y-start.y;
    if (Math.hypot(dx,dy) <= 7) return;
    // dx positivo: puxar dados anteriores para a direita. dy positivo: gráfico desce.
    send(g.panel, 'move', {
      time: clamp(dx/g.rect.width, -1, 1),
      price: clamp(dy/g.rect.height, -1, 1)
    });
    info(g.panel, 'Gráfico movimentado');
  }
  doc.addEventListener('pointerdown', init, true);
  doc.addEventListener('pointermove', move, { capture: true, passive: false });
  doc.addEventListener('pointerup', e => finish(e, false), true);
  doc.addEventListener('pointercancel', e => finish(e, true), true);
  // Se a janela perde o foco no meio do gesto, liberar o gráfico.
  root.addEventListener('blur', () => { clearPreview(active); active = null; });
  // Wheel com Ctrl preserva zoom no PC; sem Ctrl, preserva a rolagem normal da página.
  doc.addEventListener('wheel', e => {
    const svg = svgOf(e.target);
    if (!svg || !(e.ctrlKey || e.metaKey)) return;
    const r = svg.getBoundingClientRect(), panel = panelOf(svg);
    if (!Number.isFinite(panel) || !r.width) return;
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
    send(panel, 'zoom', e.deltaY < 0 ? .88 : 1.14, clamp((e.clientX-r.left)/r.width,0,1));
  }, { capture: true, passive: false });
  // Teclado para acessibilidade, sem interferir com formulários.
  doc.addEventListener('keydown', e => {
    const svg = svgOf(e.target);
    if (!svg || e.altKey || e.ctrlKey || e.metaKey) return;
    const keys = { ArrowLeft: ['page', .2], ArrowRight: ['page', -.2],
      ArrowUp: ['pricepan', -.12], ArrowDown: ['pricepan', .12],
      '+':['zoom',.8], '=':['zoom',.8], '-':['zoom',1.25], Home:['reset',0] };
    if (!keys[e.key]) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const [action, value] = keys[e.key]; send(panelOf(svg), action, value, .5);
  }, true);
  root.TraderChartGesturesV418 = Object.freeze({ version: 'v418', getSpace, mode: 'grab', padding: (p,n) => root.TerminalChart?.padding?.(p,n) });
})(window);
