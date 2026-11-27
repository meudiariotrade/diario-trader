/* v1036 — Etapa 4: Meu dia, Estudos e Inglês (inspirado no UI Moments, MIT).
 * 1. Régua com marcas (Notch Slider): sliders 0–10 (ex.: Nota do dia) ganham marcas e o valor ao lado.
 * 2. Botão giratório com cliques (Detent Dial): "Máx. de trades" — girar, rolar o mouse ou setas mudam de 1 em 1.
 * 3. Barra maré (Tide Progress): barras de progresso de estudo/checklist sobem da base e têm a borda viva.
 * Só interface: o valor continua no mesmo campo de sempre (dispara input/change), sem rede.
 */
(function () {
  'use strict';
  if (window.DiarioRotinaUI) return;
  var doc = document;
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CSS = [
    /* 1 — régua com marcas */
    'input[type=range].uim-notch{-webkit-appearance:none;appearance:none;width:100%;height:40px;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0;touch-action:pan-y}',
    'input[type=range].uim-notch::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.28) 0 1px,transparent 1px calc((100% - 1px)/10)),#181C28}',
    'input[type=range].uim-notch::-moz-range-track{height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.28) 0 1px,transparent 1px calc((100% - 1px)/10)),#181C28}',
    'input[type=range].uim-notch::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-8px;border-radius:4px;background:#F59E0B;border:2px solid #08090D}',
    'input[type=range].uim-notch::-moz-range-thumb{width:20px;height:20px;border-radius:4px;background:#F59E0B;border:2px solid #08090D}',
    '.uim-notch-v{display:inline-block;min-width:2ch;margin-left:6px;color:#F59E0B;font-weight:700;font-variant-numeric:tabular-nums}',
    '.uim-notch-esc{display:flex;justify-content:space-between;font-size:10px;color:#64748B;font-variant-numeric:tabular-nums;padding:0 6px}',
    /* 2 — botão giratório */
    '.uim-dial-w{display:flex;align-items:center;gap:10px}',
    '.uim-dial{position:relative;width:44px;height:44px;flex-shrink:0;border-radius:50%;background:#181C28;border:1px solid rgba(255,255,255,.08);cursor:grab;touch-action:none;outline-offset:2px}',
    '.uim-dial:focus-visible{outline:2px solid #F59E0B}',
    '.uim-dial i{position:absolute;left:50%;top:4px;width:2px;height:12px;margin-left:-1px;border-radius:1px;background:#F59E0B;transform-origin:1px 18px;transition:transform .12s}',
    '.uim-dial b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#E2E8F0;font-variant-numeric:tabular-nums;pointer-events:none}',
    /* 3 — barra maré */
    '.uim-tide{position:relative;overflow:hidden}',
    '.uim-tide::after{content:"";position:absolute;top:0;bottom:0;right:0;width:10px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35));animation:uim-mare 2.4s ease-in-out infinite}',
    '@keyframes uim-mare{0%,100%{opacity:.15}50%{opacity:.6}}',
    '@media (prefers-reduced-motion:reduce){.uim-tide::after{animation:none;opacity:.3}.uim-dial i{transition:none}}'
  ].join('\n');
  function montarCss() {
    if (doc.getElementById('uim-rot-css')) return;
    var s = doc.createElement('style'); s.id = 'uim-rot-css'; s.textContent = CSS; doc.head.appendChild(s);
  }
  function avisar(inp) {
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function vibrar(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  /* ---------- 1. Régua com marcas ---------- */
  function prepararRegua(r) {
    if (r.dataset.uimNotch) return;
    var min = +r.min || 0, max = r.max === '' ? 100 : +r.max, passo = +r.step || 1;
    if (min !== 0 || max !== 10 || passo !== 1) return;
    r.dataset.uimNotch = '1';
    r.classList.add('uim-notch');
    var esc = doc.createElement('div');
    esc.className = 'uim-notch-esc'; esc.setAttribute('aria-hidden', 'true');
    esc.innerHTML = '<span>0</span><span>5</span><span>10</span>';
    r.insertAdjacentElement('afterend', esc);
    var ult = r.value;
    r.addEventListener('input', function () { if (r.value !== ult) { ult = r.value; vibrar(5); } });
  }

  /* ---------- 2. Botão giratório (Máx. de trades) ---------- */
  var SEL_DIAL = 'input[type=number][data-d="maxT"],input[type=number][data-v789-field="max"],input[type=number][data-uim-dial]';
  function prepararDial(inp) {
    if (inp.dataset.uimDial === '1' || !inp.offsetParent) return;
    inp.dataset.uimDial = '1';
    var min = inp.min !== '' ? +inp.min : 0, max = inp.max !== '' ? +inp.max : 20;
    if (min < 1) min = 1;
    var w = doc.createElement('span');
    w.className = 'uim-dial-w';
    var d = doc.createElement('span');
    d.className = 'uim-dial';
    d.setAttribute('role', 'slider');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', 'Girar para ajustar ' + ((inp.closest('label') || {}).textContent || 'valor').replace(/\s+/g, ' ').trim().slice(0, 40));
    d.setAttribute('aria-valuemin', min); d.setAttribute('aria-valuemax', max);
    d.innerHTML = '<i></i><b></b>';
    inp.parentNode.insertBefore(w, inp);
    w.appendChild(d); w.appendChild(inp);
    var ponteiro = d.querySelector('i'), txt = d.querySelector('b');
    function atual() { var v = parseInt(inp.value, 10); return isNaN(v) ? null : v; }
    function desenhar() {
      var v = atual();
      txt.textContent = v == null ? '–' : v;
      d.setAttribute('aria-valuenow', v == null ? '' : v);
      var f = v == null ? 0 : (Math.min(max, Math.max(min, v)) - min) / Math.max(1, max - min);
      ponteiro.style.transform = 'rotate(' + (-135 + f * 270) + 'deg)';
    }
    function por(v) {
      v = Math.min(max, Math.max(min, v));
      if (v === atual()) return;
      inp.value = v; desenhar(); vibrar(6); avisar(inp);
    }
    var ang0 = null, base = 0;
    function angulo(e) { var r = d.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
    d.addEventListener('pointerdown', function (e) { ang0 = angulo(e); base = atual() == null ? min : atual(); d.setPointerCapture && d.setPointerCapture(e.pointerId); e.preventDefault(); });
    d.addEventListener('pointermove', function (e) {
      if (ang0 == null) return;
      var delta = angulo(e) - ang0;
      if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
      por(base + Math.round(delta / 27)); /* 1 clique a cada ~27° */
      if (Math.abs(delta) > 150) { ang0 = angulo(e); base = atual(); }
    });
    d.addEventListener('pointerup', function () { ang0 = null; });
    d.addEventListener('pointercancel', function () { ang0 = null; });
    d.addEventListener('wheel', function (e) { e.preventDefault(); por((atual() == null ? min - 1 : atual()) + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
    d.addEventListener('keydown', function (e) {
      var v = atual() == null ? min - 1 : atual();
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); por(v + 1); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); por(v - 1); }
      else if (e.key === 'Home') { e.preventDefault(); por(min); }
      else if (e.key === 'End') { e.preventDefault(); por(max); }
    });
    inp.addEventListener('input', desenhar);
    desenhar();
  }

  /* ---------- 3. Barra maré ---------- */
  var SEL_TIDE = '.v514-bar>i,.dt975-pbar.ok>i,.v4-rbar>b,[data-uim-tide]>*';
  function prepararMare(f) {
    if (f.dataset.uimTide) return;
    f.dataset.uimTide = '1';
    var alvo = f.style.width;
    if (!alvo || parseFloat(alvo) <= 0) return;
    f.classList.add('uim-tide');
    if (reduz) return;
    f.style.transition = 'none';
    f.style.width = '0%';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      f.style.transition = 'width .9s cubic-bezier(.2,.8,.2,1)';
      f.style.width = alvo;
    }); });
  }

  var agendado = false;
  function varrer() {
    agendado = false;
    doc.querySelectorAll('#app input[type=range]:not([data-uim-notch])').forEach(prepararRegua);
    doc.querySelectorAll(SEL_DIAL).forEach(prepararDial);
    doc.querySelectorAll(SEL_TIDE).forEach(prepararMare);
  }
  function iniciar() {
    montarCss();
    new MutationObserver(function () { if (!agendado) { agendado = true; requestAnimationFrame(varrer); } }).observe(doc.body, { childList: true, subtree: true });
    varrer();
  }
  window.DiarioRotinaUI = Object.freeze({ versao: 1 });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
