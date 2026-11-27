/* v1033 — Microinterações (inspiradas no UI Moments, MIT · guanmo-ai/ui-moments).
 * Camada só de interface: não faz rede, não guarda dados e não muda as telas.
 * 1. Segurar para confirmar (Encerrar / Excluir)   2. Números rolando nos KPIs
 * 3. Checklist riscando                             4. Puxar para atualizar (celular)
 * 5. Anel de progresso nas exportações              6. Loader discreto nos "Carregando…"
 */
(function () {
  'use strict';
  if (window.DiarioMomentos) return;
  var doc = document;
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CSS = [
    /* 1 — segurar para confirmar */
    '.uim-hold{position:relative;overflow:hidden;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}',
    '.uim-fill{position:absolute;inset:0;transform-origin:left center;transform:scaleX(0);background:rgba(245,158,11,.28);pointer-events:none}',
    '.uim-holding .uim-fill{transform:scaleX(1);transition:transform var(--uim-hold,650ms) linear}',
    '.uim-held{box-shadow:inset 0 0 0 1px #F59E0B}',
    '.uim-toast{position:fixed;left:50%;bottom:calc(88px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;background:#181C28;color:#E2E8F0;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:8px 12px;font-size:13px;pointer-events:none;opacity:0;transition:opacity .15s}',
    '.uim-toast.on{opacity:1}',
    '@media (min-width:761px){.uim-toast{bottom:24px}}',
    /* 2 — números rolando */
    '.uim-odw{display:inline-flex;align-items:flex-end;white-space:pre;font:inherit;color:inherit}',
    '.uim-od{display:inline-block;height:1.2em;line-height:1.2em;overflow:hidden;vertical-align:bottom}',
    '.uim-ods{display:flex;flex-direction:column;transition:transform .6s cubic-bezier(.2,.8,.2,1)}',
    '.uim-ods>i{font-style:normal;height:1.2em;line-height:1.2em}',
    '.ui-kpi>b,[data-odo]{font-variant-numeric:tabular-nums}',
    /* 3 — checklist riscando */
    '.gchk input[type=checkbox]+span{background:linear-gradient(currentColor,currentColor) 0 58%/0 1px no-repeat;transition:background-size .35s ease,color .2s}',
    '.gchk input[type=checkbox]:checked+span{background-size:100% 1px;color:#64748B}',
    /* 4 — puxar para atualizar */
    '.uim-ptr{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 8px);z-index:2147482000;width:32px;height:32px;margin-left:-16px;border-radius:50%;background:#12151E;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(-40px);pointer-events:none}',
    '.uim-ptr svg{width:18px;height:18px;stroke:#64748B;transition:stroke .15s}',
    '.uim-ptr.pronto svg{stroke:#F59E0B}',
    '.uim-ptr.girando svg{stroke:#F59E0B;animation:uim-gira .8s linear infinite}',
    /* 5 — anel de exportação */
    '.uim-dl{position:relative}',
    '.uim-ring{display:inline-block;width:14px;height:14px;margin-left:8px;vertical-align:-2px;border-radius:50%;border:2px solid rgba(245,158,11,.25);border-top-color:#F59E0B;animation:uim-gira .8s linear infinite}',
    /* 6 — loader discreto (sinal indo e voltando) */
    '.uim-loader{display:inline-flex;gap:2px;align-items:flex-end;height:10px;margin-right:8px;vertical-align:-1px}',
    '.uim-loader>i{width:2px;height:100%;background:#F59E0B;border-radius:1px;animation:uim-sinal 1s ease-in-out infinite}',
    '.uim-loader>i:nth-child(2){animation-delay:.15s}.uim-loader>i:nth-child(3){animation-delay:.3s}',
    '@keyframes uim-gira{to{transform:rotate(360deg)}}',
    '@keyframes uim-sinal{0%,100%{transform:scaleY(.3);opacity:.5}50%{transform:scaleY(1);opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.uim-ods,.gchk input+span,.uim-holding .uim-fill{transition:none!important}.uim-ring,.uim-loader>i,.uim-ptr.girando svg{animation:none!important}}'
  ].join('\n');

  function montarCss() {
    if (doc.getElementById('uim-css')) return;
    var s = doc.createElement('style');
    s.id = 'uim-css';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'uim-toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 1400);
  }

  /* ---------- 1. Segurar para confirmar ---------- */
  var HOLD_MS = 650;
  var SEL_HOLD = '[data-a="enc"],[data-fx="encerrar"],[data-a="deltrade"],[data-a="delrule"],[data-a="delw"],[data-a="delbook"],[data-a="delnote"],[data-hold]';
  var RE_HOLD = /^(Excluir|Apagar|Encerrar)(\s|$)/i;
  var passando = false, silencioAte = 0, ativo = null;

  function alvoHold(el) {
    var b = el && el.closest ? el.closest('button,[role="button"]') : null;
    if (!b || b.disabled || b.closest('[data-no-hold]')) return null;
    if (b.matches(SEL_HOLD)) return b;
    if (b.closest('#app,#sh') && RE_HOLD.test((b.textContent || '').trim())) return b;
    return null;
  }
  function disparar(b) {
    var original = window.confirm;
    window.confirm = function () { return true; };
    passando = true;
    try {
      /* Excluir trade era em 2 toques (Excluir → Confirmar exclusão); segurar já confirma. */
      if (b.getAttribute('data-a') === 'deltrade') { try { if (typeof delArm !== 'undefined') delArm = 1; } catch (e) {} }
      b.click();
    } finally { passando = false; window.confirm = original; }
  }
  function cancelar() {
    if (!ativo) return;
    clearTimeout(ativo.t);
    ativo.b.classList.remove('uim-holding');
    var f = ativo.b.querySelector(':scope > .uim-fill');
    if (f && !ativo.ok) f.remove();
    ativo = null;
  }
  function iniciarHold(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    var b = alvoHold(e.target);
    if (!b) return;
    cancelar();
    b.classList.add('uim-hold');
    if (!b.title) b.title = 'Segure para confirmar';
    var f = doc.createElement('span');
    f.className = 'uim-fill';
    f.setAttribute('aria-hidden', 'true');
    b.appendChild(f);
    b.style.setProperty('--uim-hold', HOLD_MS + 'ms');
    void f.offsetWidth;
    b.classList.add('uim-holding');
    b.addEventListener('pointerleave', cancelar, { once: true });
    ativo = { b: b, ok: false, t: setTimeout(function () {
      if (!ativo || ativo.b !== b) return;
      ativo.ok = true;
      b.classList.remove('uim-holding');
      b.classList.add('uim-held');
      try { navigator.vibrate && navigator.vibrate(15); } catch (er) {}
      silencioAte = Date.now() + 800;
      f.remove();
      ativo = null;
      setTimeout(function () { b.classList.remove('uim-held'); }, 500);
      disparar(b);
    }, HOLD_MS) };
  }
  function cliqueHold(e) {
    if (passando) return;
    var b = alvoHold(e.target);
    if (!b) return;
    if (e.detail === 0) return; /* teclado (Enter/Espaço): segue o fluxo de confirmação que já existia */
    e.preventDefault();
    e.stopImmediatePropagation();
    if (Date.now() > silencioAte) toast('Segure para confirmar');
  }

  /* ---------- 2. Números rolando ---------- */
  var SEL_ODO = '.ui-kpi>b,.dt975-ops-pl,[data-odo]';
  var ultimos = new Map(), animando = new WeakSet();
  function limparOdo(el) {
    var final = el.getAttribute('data-uim-final');
    if (final != null) { el.textContent = final; el.removeAttribute('data-uim-final'); }
  }
  function chaveOdo(el) {
    if (el.dataset.odo) return 'o:' + el.dataset.odo;
    if (el.classList.contains('dt975-ops-pl')) return 'c:ops-pl';
    var k = el.closest('.ui-kpi');
    var r = k && k.querySelector('span');
    return r ? 'k:' + (window.tab || '') + ':' + r.textContent.trim() : null;
  }
  function rolar(el, antes, agora) {
    if (reduz || !/\d/.test(agora) || antes.length > 24 || agora.length > 24) return;
    var a = antes.split('').reverse(), n = agora.split('');
    el.setAttribute('data-uim-final', agora);
    var frag = doc.createElement('span'), pares = [];
    frag.className = 'uim-odw';
    n.forEach(function (ch, i) {
      if (!/\d/.test(ch)) { frag.appendChild(doc.createTextNode(ch)); return; }
      var ant = a[n.length - 1 - i];
      var de = /\d/.test(ant || '') ? +ant : 0;
      if (de === +ch) { frag.appendChild(doc.createTextNode(ch)); return; }
      var w = doc.createElement('span'); w.className = 'uim-od'; w.setAttribute('aria-hidden', 'true');
      var s = doc.createElement('span'); s.className = 'uim-ods';
      for (var d = 0; d < 10; d++) { var x = doc.createElement('i'); x.textContent = d; s.appendChild(x); }
      s.style.transform = 'translateY(' + (-1.2 * de) + 'em)';
      w.appendChild(s); frag.appendChild(w); pares.push([s, +ch]);
    });
    if (!pares.length) return;
    el.textContent = '';
    el.appendChild(frag);
    animando.add(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      pares.forEach(function (p) { p[0].style.transform = 'translateY(' + (-1.2 * p[1]) + 'em)'; });
    }); });
    setTimeout(function () {
      animando.delete(el);
      if (el.isConnected) limparOdo(el);
      /* Se a tela foi redesenhada copiando o nó no meio da animação, devolve o número limpo. */
      doc.querySelectorAll('[data-uim-final]').forEach(function (x) { if (!animando.has(x)) limparOdo(x); });
    }, 700);
  }
  function verOdo(el) {
    if (el.hasAttribute('data-uim-final')) { if (!animando.has(el)) limparOdo(el); return; }
    var k = chaveOdo(el); if (!k) return;
    var agora = (el.textContent || '').trim(), antes = ultimos.get(k);
    ultimos.set(k, agora);
    if (antes != null && antes !== agora) rolar(el, antes, agora);
  }

  /* ---------- 4. Puxar para atualizar (só toque) ---------- */
  var ptr = null, toque = null, LIMIAR = 72;
  function indicador() {
    if (ptr) return ptr;
    ptr = doc.createElement('div');
    ptr.className = 'uim-ptr';
    ptr.setAttribute('aria-hidden', 'true');
    ptr.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>';
    doc.body.appendChild(ptr);
    return ptr;
  }
  function noTopo(t) {
    if ((window.scrollY || doc.documentElement.scrollTop || 0) > 0) return false;
    for (var n = t; n && n !== doc.body; n = n.parentElement) {
      if (n.scrollTop > 0) return false;
    }
    return true;
  }
  function bloqueado(t) {
    return !!(t.closest && t.closest('#sh .ov,#sh .sh,dialog,.wf-chat-panel,input,textarea,select,canvas,iframe,[data-no-ptr],.trp,.trbar')) ||
      !!doc.querySelector('#sh .ov,dialog[open],.wf-chat-panel:not([hidden]),#mdr2');
  }
  function botaoAtualizar() {
    var bs = doc.querySelectorAll('#app button');
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      if (!b.disabled && b.offsetParent && /^(↻\s*)?Atualizar(\s|$)/i.test((b.textContent || '').trim())) return b;
    }
    return null;
  }
  function tStart(e) {
    if (e.touches.length !== 1 || bloqueado(e.target) || !noTopo(e.target)) { toque = null; return; }
    toque = { y: e.touches[0].clientY, x: e.touches[0].clientX, dy: 0 };
  }
  function tMove(e) {
    if (!toque) return;
    var dy = e.touches[0].clientY - toque.y, dx = Math.abs(e.touches[0].clientX - toque.x);
    if (dy <= 0 || dx > dy) { if (toque.dy) esconderPtr(); toque.dy = 0; if (dy < -4) toque = null; return; }
    toque.dy = dy;
    var p = indicador(), k = Math.min(dy, LIMIAR * 1.4);
    p.style.transition = 'none';
    p.style.opacity = String(Math.min(1, dy / LIMIAR));
    p.style.transform = 'translateY(' + (k * 0.6) + 'px) rotate(' + (k * 3) + 'deg)';
    p.classList.toggle('pronto', dy >= LIMIAR);
  }
  function esconderPtr() {
    if (!ptr) return;
    ptr.style.transition = 'transform .2s, opacity .2s';
    ptr.style.opacity = '0';
    ptr.style.transform = 'translateY(-40px)';
    ptr.classList.remove('pronto', 'girando');
  }
  function tEnd(e) {
    if (!toque) return;
    var fim = e && e.changedTouches && e.changedTouches[0];
    var dy = Math.max(toque.dy, fim ? fim.clientY - toque.y : 0);
    if (fim && Math.abs(fim.clientX - toque.x) > dy) dy = 0;
    toque = null;
    if (dy < LIMIAR) { esconderPtr(); return; }
    var p = indicador();
    p.style.transition = 'transform .2s';
    p.style.transform = 'translateY(' + (LIMIAR * 0.6) + 'px)';
    p.classList.remove('pronto'); p.classList.add('girando');
    try { navigator.vibrate && navigator.vibrate(10); } catch (er) {}
    var b = botaoAtualizar();
    try {
      if (b) b.click();
      else if (typeof render === 'function') render();
      window.dispatchEvent(new CustomEvent('diario:atualizar', { detail: { origem: 'puxar' } }));
    } catch (er) {}
    setTimeout(esconderPtr, 900);
  }

  /* ---------- 5. Anel nas exportações ---------- */
  var RE_EXP = /(Exportar|Baixar|Gerar PDF|^PDF\b|Planilha|\bCSV\b|\bXLSX\b|Relatório em imagem)/i;
  function cliqueExport(e) {
    var b = e.target.closest && e.target.closest('button,a[download]');
    if (!b || b.querySelector('.uim-ring') || !(b.hasAttribute('data-export') || RE_EXP.test((b.textContent || '').trim()))) return;
    if (alvoHold(b)) return;
    var r = doc.createElement('span');
    r.className = 'uim-ring';
    r.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (b.isConnected) { b.classList.add('uim-dl'); b.setAttribute('aria-busy', 'true'); b.appendChild(r); } }, 0);
    setTimeout(function () { r.remove(); if (b.isConnected) { b.classList.remove('uim-dl'); b.removeAttribute('aria-busy'); } }, 1400);
  }

  /* ---------- 6. Loader nos textos de carregamento ---------- */
  var RE_CARREGA = /^(Carregando|Buscando|Atualizando|Preparando|Gerando|Consultando|Áurea (está|encaminhou))\b.*(…|\.\.\.)$/;
  function verLoader(el) {
    if (el.firstElementChild && el.firstElementChild.classList.contains('uim-loader')) return;
    var tn = el.firstChild;
    while (tn && tn.nodeType === 3 && !tn.nodeValue.trim()) tn = tn.nextSibling;
    if (!tn || tn.nodeType !== 3) return; /* só quem tem o texto direto, para não duplicar no pai */
    var t = (el.textContent || '').trim();
    if (!RE_CARREGA.test(t) || el.children.length > 1 || t.length > 120) return;
    var l = doc.createElement('span');
    l.className = 'uim-loader';
    l.setAttribute('aria-hidden', 'true');
    l.innerHTML = '<i></i><i></i><i></i>';
    el.insertBefore(l, el.firstChild);
  }

  /* ---------- Observador único (só nós adicionados) ---------- */
  var fila = new Set(), agendado = false;
  function processar() {
    agendado = false;
    fila.forEach(function (n) {
      if (!n.isConnected || n.nodeType !== 1) return;
      if (n.matches(SEL_ODO)) verOdo(n);
      n.querySelectorAll && n.querySelectorAll(SEL_ODO).forEach(verOdo);
      var cands = [n].concat(Array.prototype.slice.call(n.querySelectorAll ? n.querySelectorAll('p,small,span,div,b,[role="status"]') : []));
      for (var i = 0; i < cands.length && i < 400; i++) {
        var c = cands[i];
        if (c.childElementCount <= 1 && /^(Carregando|Buscando|Atualizando|Preparando|Gerando|Consultando|Áurea)/.test((c.textContent || '').trim())) verLoader(c);
      }
    });
    fila.clear();
  }
  function observar() {
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') { var p = m.target.parentElement; if (p) fila.add(p); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1 && !(n.classList && (n.classList.contains('uim-od') || n.classList.contains('uim-odw') || n.classList.contains('uim-loader') || n.classList.contains('uim-fill') || n.classList.contains('uim-ring')))) fila.add(n);
          else if (n.nodeType === 3 && n.parentElement) fila.add(n.parentElement);
        }
      }
      if (fila.size && !agendado) { agendado = true; requestAnimationFrame(processar); }
    }).observe(doc.body, { childList: true, subtree: true, characterData: true });
  }

  function iniciar() {
    montarCss();
    window.addEventListener('pointerdown', iniciarHold, true);
    window.addEventListener('pointerup', function () { if (ativo && !ativo.ok) cancelar(); }, true);
    window.addEventListener('pointercancel', cancelar, true);
    window.addEventListener('scroll', function () { if (ativo) cancelar(); }, { passive: true, capture: true });
    window.addEventListener('click', cliqueHold, true);
    doc.addEventListener('click', cliqueExport, true);
    if ('ontouchstart' in window) {
      doc.addEventListener('touchstart', tStart, { passive: true });
      doc.addEventListener('touchmove', tMove, { passive: true });
      doc.addEventListener('touchend', tEnd, { passive: true });
      doc.addEventListener('touchcancel', function () { toque = null; esconderPtr(); }, { passive: true });
    }
    observar();
    doc.querySelectorAll(SEL_ODO).forEach(verOdo);
  }

  window.DiarioMomentos = Object.freeze({ toast: toast, versao: 1 });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
