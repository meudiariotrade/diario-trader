/* v1034 — Etapa 2: navegação e operações (inspirado no UI Moments / Astryx, MIT).
 * Só interface: não faz rede e não grava dados.
 * 1. Paleta Ctrl+K: grupo "Ações" + setas ↑/↓ na busca global que já existe (dt949)
 * 2. Painel de baixo (#sh): alça e arrastar para baixo para fechar (celular)
 * 3. Arrastar para registrar: Salvar de trade novo no celular
 * 4. Tabelas: ordenar tocando no cabeçalho + 1ª coluna fixa quando rola de lado
 */
(function () {
  'use strict';
  if (window.DiarioNavegacao) return;
  var doc = document;
  var celular = function () { return window.matchMedia && matchMedia('(max-width:760px)').matches; };

  var CSS = [
    /* 1 — paleta */
    '#dt949-busca .uim-cmd{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;min-height:44px;border:0;border-radius:4px;background:transparent;color:inherit;text-align:left;cursor:pointer;font-size:13.5px}',
    '#dt949-busca .uim-cmd small{color:#64748B;font-size:12px}',
    '#dt949-busca .uim-cmd kbd{font:11px/1 inherit;color:#64748B;border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:3px 5px}',
    '#dt949-busca .uim-cmd:hover,#dt949-busca .uim-sel{background:rgba(245,158,11,.12)!important;outline:0}',
    /* 2 — alça do painel */
    '.uim-grab{display:none}',
    '@media (max-width:760px){.uim-grab{display:block;width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:8px auto 4px;flex-shrink:0}.uim-grab-area{touch-action:pan-x}}',
    /* 3 — arrastar para registrar */
    '.uim-swipe{position:relative;height:48px;border-radius:4px;background:#181C28;border:1px solid rgba(255,255,255,.08);overflow:hidden;-webkit-user-select:none;user-select:none;touch-action:pan-y}',
    '.uim-swipe>span{position:absolute;inset:0 0 0 48px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#64748B;pointer-events:none}',
    '.uim-swipe>.uim-trilho{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(245,158,11,.18)}',
    '.uim-swipe>button{position:absolute;left:4px;top:4px;width:40px;height:38px;border:0;border-radius:4px;background:#F59E0B;color:#08090D;font-size:18px;font-weight:700;touch-action:none}',
    '.uim-swipe.ok>button{background:#10B981}',
    /* 4 — tabelas */
    'table.uim-ord th.uim-th{cursor:pointer;-webkit-user-select:none;user-select:none;white-space:nowrap}',
    'table.uim-ord th.uim-th::after{content:"";display:inline-block;width:8px;margin-left:4px;color:#64748B;font-size:10px}',
    'table.uim-ord th[aria-sort="ascending"]::after{content:"▲";color:#F59E0B}',
    'table.uim-ord th[aria-sort="descending"]::after{content:"▼";color:#F59E0B}',
    'table.uim-fixa th:first-child,table.uim-fixa td:first-child{position:sticky;left:0;z-index:1;background:var(--ui-card,#12151E);box-shadow:1px 0 0 rgba(255,255,255,.06)}'
  ].join('\n');

  function montarCss() {
    if (doc.getElementById('uim-nav-css')) return;
    var s = doc.createElement('style'); s.id = 'uim-nav-css'; s.textContent = CSS; doc.head.appendChild(s);
  }
  function semAc(v) { return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function irRota(r) {
    try {
      if (window.DiarioRotas && window.DiarioRotas.navigate) { window.DiarioRotas.navigate(r); return; }
      var b = doc.querySelector('[data-dt393-route="' + r + '"]');
      if (b) { b.click(); return; }
      if (typeof irPara === 'function') { tab = r; irPara(r); }
    } catch (e) {}
  }
  function clicar(sel) { var b = doc.querySelector(sel); if (b) { b.click(); return true; } return false; }

  /* ---------- 1. Paleta de comandos ---------- */
  var ACOES = [
    ['Novo day trade', 'registrar trade novo operacao day win wdo', function () { clicar('#fabm [data-a="new"][data-tp="D"]'); }],
    ['Novo swing trade', 'registrar swing novo posicao', function () { clicar('#fabm [data-a="new"][data-tp="S"]'); }],
    ['Nova operação com opções', 'registrar opcao opcoes call put novo', function () { clicar('#fabm [data-a="new"][data-tp="O"]'); }],
    ['Perguntar à Áurea', 'aurea ia chat assistente perguntar analisar', function () { clicar('[data-ia-topo]') || clicar('#economista-flutuante .wf-chat-launcher'); }],
    ['Checklist do dia', 'checklist regras rotina pre mercado preparo', function () {
      irRota('dia');
      setTimeout(function () { clicar('[data-rotina-preparo]'); }, 350);
    }],
    ['Importar do Profit', 'importar profit csv relatorio ordens', function () { irRota('import'); }]
  ];
  function acoesPara(q) {
    q = semAc(q).trim();
    if (!q) return ACOES.slice(0, 4);
    var t = q.split(/\s+/);
    return ACOES.filter(function (a) { var s = semAc(a[0] + ' ' + a[1]); return t.every(function (p) { return s.indexOf(p) >= 0; }); });
  }
  function desenharAcoes(dlg) {
    var res = dlg.querySelector('#dt949-res');
    if (!res) return;
    var velho = res.querySelector('[data-uim-acoes]');
    var q = (dlg.querySelector('#dt949-q') || {}).value || '';
    var lista = acoesPara(q);
    var html = lista.length ? '<div class="b-grp">Ações</div>' + lista.map(function (a) {
      return '<button type="button" class="uim-cmd" data-uim-cmd="' + ACOES.indexOf(a) + '"><span>' + esc(a[0]) + '</span><kbd>↵</kbd></button>';
    }).join('') : '';
    if (velho && velho.innerHTML === html) return;
    if (velho) velho.remove();
    if (!html) return;
    var box = doc.createElement('div');
    box.setAttribute('data-uim-acoes', '');
    box.innerHTML = html;
    res.insertBefore(box, res.firstChild);
  }
  function itensPaleta(dlg) { return Array.prototype.slice.call(dlg.querySelectorAll('.uim-cmd,[data-b949-go]')).filter(function (b) { return b.offsetParent; }); }
  function ligarPaleta(dlg) {
    if (dlg.dataset.uimPaleta) return;
    dlg.dataset.uimPaleta = '1';
    var res = dlg.querySelector('#dt949-res');
    if (res) new MutationObserver(function () { desenharAcoes(dlg); }).observe(res, { childList: true });
    dlg.addEventListener('input', function () { setTimeout(function () { desenharAcoes(dlg); }, 0); });
    dlg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-uim-cmd]');
      if (!b) return;
      e.stopPropagation();
      var a = ACOES[+b.dataset.uimCmd];
      dlg.close();
      if (a) setTimeout(a[2], 0);
    }, true);
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
      var itens = itensPaleta(dlg);
      if (!itens.length) return;
      var atual = dlg.querySelector('.uim-sel');
      var i = itens.indexOf(atual);
      if (e.key === 'Enter') {
        if (atual) { e.preventDefault(); e.stopImmediatePropagation(); atual.click(); }
        else if (e.target.id === 'dt949-q' && itens[0] && itens[0].classList.contains('uim-cmd') && !dlg.querySelector('[data-b949-go]')) { e.preventDefault(); e.stopImmediatePropagation(); itens[0].click(); }
        return;
      }
      e.preventDefault();
      if (atual) atual.classList.remove('uim-sel');
      i = e.key === 'ArrowDown' ? (i + 1) % itens.length : (i <= 0 ? itens.length - 1 : i - 1);
      itens[i].classList.add('uim-sel');
      itens[i].scrollIntoView({ block: 'nearest' });
    }, true);
    dlg.addEventListener('input', function () { var s = dlg.querySelector('.uim-sel'); if (s) s.classList.remove('uim-sel'); }, true);
    desenharAcoes(dlg);
  }

  /* ---------- 2. Painel de baixo: alça + arrastar para fechar ---------- */
  var arrasto = null;
  function prepararSheet(sh) {
    if (sh.querySelector(':scope > .uim-grab')) return;
    var g = doc.createElement('div');
    g.className = 'uim-grab';
    g.setAttribute('aria-hidden', 'true');
    sh.insertBefore(g, sh.firstChild);
  }
  function shStart(e) {
    if (!celular() || e.touches.length !== 1) return;
    var sh = e.target.closest && e.target.closest('#sh .sh');
    if (!sh) return;
    var rolo = sh.closest('.ov') || sh;
    if (rolo.scrollTop > 0 || sh.scrollTop > 0 || e.target.closest('input,textarea,select,canvas,[contenteditable],.uim-swipe')) return;
    arrasto = { sh: sh, rolo: rolo, y: e.touches[0].clientY, x: e.touches[0].clientX, dy: 0 };
  }
  function shMove(e) {
    if (!arrasto) return;
    var dy = e.touches[0].clientY - arrasto.y, dx = Math.abs(e.touches[0].clientX - arrasto.x);
    if (arrasto.rolo.scrollTop > 0 || dx > Math.abs(dy) || dy < 0) { if (arrasto.dy) soltar(arrasto.sh); arrasto = dy < -4 || dx > 12 ? null : arrasto; return; }
    arrasto.dy = dy;
    arrasto.sh.style.transition = 'none';
    arrasto.sh.style.transform = 'translateY(' + dy + 'px)';
  }
  function soltar(sh) { sh.style.transition = 'transform .2s ease'; sh.style.transform = ''; }
  function shEnd(e) {
    if (!arrasto) return;
    var a = arrasto; arrasto = null;
    var fim = e.changedTouches && e.changedTouches[0];
    var dy = Math.max(a.dy, fim ? fim.clientY - a.y : 0);
    if (dy > 110) {
      a.sh.style.transition = 'transform .18s ease';
      a.sh.style.transform = 'translateY(100%)';
      setTimeout(function () { if (typeof closeSheet === 'function') closeSheet(); else a.sh.style.transform = ''; }, 160);
    } else soltar(a.sh);
  }

  /* ---------- 3. Arrastar para registrar (trade novo no celular) ---------- */
  function prepararSwipe(btn) {
    if (btn.dataset.uimSwipe || !celular()) return;
    var novo = false;
    try { novo = typeof isNew !== 'undefined' && !!isNew; } catch (er) {}
    if (!novo) return;
    btn.dataset.uimSwipe = '1';
    var trilho = doc.createElement('div');
    trilho.className = 'uim-swipe';
    trilho.setAttribute('role', 'group');
    trilho.innerHTML = '<div class="uim-trilho"></div><span>Arraste para registrar →</span><button type="button" aria-label="Registrar trade (toque duas vezes)">›</button>';
    btn.hidden = true;
    btn.parentNode.insertBefore(trilho, btn);
    var knob = trilho.querySelector('button'), fill = trilho.querySelector('.uim-trilho');
    var x0 = 0, max = 0, cur = 0, ativo = false;
    function por(x) { cur = Math.max(0, Math.min(max, x)); knob.style.transform = 'translateX(' + cur + 'px)'; fill.style.width = (cur + 44) + 'px'; }
    function voltar() { knob.style.transition = fill.style.transition = 'transform .2s, width .2s'; por(0); setTimeout(function () { knob.style.transition = fill.style.transition = ''; }, 220); }
    knob.addEventListener('pointerdown', function (e) {
      ativo = true; x0 = e.clientX - cur; max = trilho.clientWidth - 48;
      knob.setPointerCapture && knob.setPointerCapture(e.pointerId);
    });
    knob.addEventListener('pointermove', function (e) { if (ativo) por(e.clientX - x0); });
    function fim() {
      if (!ativo) return; ativo = false;
      if (cur >= max * 0.9) {
        por(max); trilho.classList.add('ok');
        try { navigator.vibrate && navigator.vibrate(15); } catch (er) {}
        setTimeout(function () {
          btn.click();
          /* Se a validação segurou o formulário aberto, o trilho volta para tentar de novo. */
          setTimeout(function () { if (trilho.isConnected) { trilho.classList.remove('ok'); voltar(); } }, 400);
        }, 120);
      } else voltar();
    }
    knob.addEventListener('pointerup', fim);
    knob.addEventListener('pointercancel', fim);
    /* Acessibilidade: com leitor de tela (toque duplo = clique sem arrasto) registra direto. */
    knob.addEventListener('click', function (e) { if (e.detail === 0) btn.click(); });
  }

  /* ---------- 4. Tabelas ordenáveis + 1ª coluna fixa ---------- */
  function numero(t) {
    t = String(t || '').replace(/[\s ]/g, '');
    if (!t || /^[—–-]$/.test(t)) return null;
    if (!/^[+−-]?(R\$|US\$|\$)?[+−-]?\d[\d.]*(,\d+)?(%|x|pts?|k|mi|bi)?$/i.test(t)) return NaN;
    var neg = /^[+]?(R\$|US\$|\$)?[−-]/.test(t) || /^[−-]/.test(t);
    var v = parseFloat(t.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(v) ? NaN : (neg ? -v : v);
  }
  function ordenar(th) {
    var tabela = th.closest('table'), tb = tabela.tBodies[0];
    if (!tb) return;
    var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
    var dir = th.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
    tabela.querySelectorAll('th[aria-sort]').forEach(function (x) { x.removeAttribute('aria-sort'); });
    th.setAttribute('aria-sort', dir);
    var linhas = Array.prototype.slice.call(tb.rows).filter(function (r) { return r.cells.length > idx; });
    var vals = linhas.map(function (r) { return (r.cells[idx].textContent || '').trim(); });
    var numerica = vals.filter(function (v) { var n = numero(v); return n !== null && !isNaN(n); }).length >= Math.max(1, vals.filter(function (v) { return numero(v) !== null; }).length * 0.6);
    var sinal = dir === 'ascending' ? 1 : -1;
    linhas.map(function (r, i) { return [r, vals[i], i]; }).sort(function (a, b) {
      if (numerica) {
        var x = numero(a[1]), y = numero(b[1]);
        if (x === null || isNaN(x)) return 1; if (y === null || isNaN(y)) return -1;
        return (x - y) * sinal || a[2] - b[2];
      }
      return a[1].localeCompare(b[1], 'pt-BR', { numeric: true }) * sinal || a[2] - b[2];
    }).forEach(function (p) { tb.appendChild(p[0]); });
  }
  function prepararTabela(t) {
    if (t.dataset.uimTab || t.closest('[data-no-sort],.trp,.trbar,#wf-chat-panel,.v503-fantasma') || !t.tHead || !t.tBodies[0]) return;
    t.dataset.uimTab = '1';
    if (t.tBodies[0].rows.length >= 3) {
      t.classList.add('uim-ord');
      Array.prototype.forEach.call(t.tHead.rows[t.tHead.rows.length - 1].cells, function (th) {
        if (th.tagName !== 'TH' || !(th.textContent || '').trim() || th.colSpan > 1) return;
        th.classList.add('uim-th');
        th.setAttribute('tabindex', '0');
        if (!th.title) th.title = 'Ordenar';
      });
    }
    var w = t.parentElement;
    if (w && w.scrollWidth > w.clientWidth + 4 && t.rows[0] && t.rows[0].cells.length > 3) t.classList.add('uim-fixa');
  }
  function cliqueTabela(e) {
    var th = e.target.closest && e.target.closest('table.uim-ord th.uim-th');
    if (!th || e.target.closest('button,a,input,select,[data-hlp]')) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e.type === 'keydown') e.preventDefault();
    ordenar(th);
  }

  /* ---------- Observador ---------- */
  var agendado = false;
  function varrer() {
    agendado = false;
    var dlg = doc.getElementById('dt949-busca'); if (dlg) ligarPaleta(dlg);
    doc.querySelectorAll('#sh .sh').forEach(prepararSheet);
    doc.querySelectorAll('#sh [data-a="savetrade"]:not([data-uim-swipe])').forEach(prepararSwipe);
    doc.querySelectorAll('#app table:not([data-uim-tab])').forEach(prepararTabela);
  }
  function iniciar() {
    montarCss();
    new MutationObserver(function () { if (!agendado) { agendado = true; requestAnimationFrame(varrer); } })
      .observe(doc.body, { childList: true, subtree: true });
    doc.addEventListener('touchstart', shStart, { passive: true });
    doc.addEventListener('touchmove', shMove, { passive: true });
    doc.addEventListener('touchend', shEnd, { passive: true });
    doc.addEventListener('touchcancel', function () { if (arrasto) { soltar(arrasto.sh); arrasto = null; } }, { passive: true });
    doc.addEventListener('click', cliqueTabela);
    doc.addEventListener('keydown', cliqueTabela);
    varrer();
  }
  window.DiarioNavegacao = Object.freeze({ acoes: function () { return ACOES.map(function (a) { return a[0]; }); }, versao: 1 });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
