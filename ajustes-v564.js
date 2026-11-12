/* v564 — ajustes pedidos:
   - posições abertas e "Resultado do dia" ao vivo pelo Profit (ou trades lançados à mão), também na faixa de cotações;
   - "Ajustar" capital leva ao capital de Day trade, Swing e Opções em Operações;
   - sem as telas "Metas, posição e backup" e "Dimensionamento de contratos";
   - "Importar do Profit" dentro de Operações; Imposto de renda fora da Carteira (fica no menu);
   - Plano de transição só com o plano do trader (sem Gastos, Reserva e Casamento) e etapas até sair da CLT;
   - busca do menu volta ao estado inicial ao reabrir. */
(function (root, doc) {
  'use strict';
  if (root.DiarioAjustes564) return;
  var g = function (f, d) { try { var v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
  var aba = function () { return g(function () { return tab; }, ''); };
  var ir = function (t) { try { tab = t; render(); root.scrollTo && root.scrollTo(0, 0); } catch (e) { /* sem app */ } };
  var brl = function (v) { return (v < 0 ? '−' : v > 0 ? '+' : '') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  // ---------- capital: sempre no cartão de capital da modalidade, em Operações ----------
  function abreCapital() {
    try { CAPO = 1; } catch (e) { /* sem cartão */ }
    ir('trades');
    var n = 0, t = setInterval(function () {
      var d = doc.querySelector('#app #capd');
      if (d || ++n > 20) { clearInterval(t); if (d) { d.open = true; d.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }
    }, 100);
  }
  doc.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-dt414-go="painel"],[data-dt414-go="contratos"],[data-v563-capital]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { var dr = doc.getElementById('dt394-drawer'); if (dr) dr.hidden = true; doc.body.classList.remove('dt394-drawer-open'); } catch (x) { /* sem menu */ }
    abreCapital();
  }, true);

  // ---------- ao vivo: cotações do Profit para posições abertas, resultado do dia e faixa ----------
  var VP = { busy: 0, ts: 0 };
  function temSessao() { return g(function () { return typeof SESS !== 'undefined' && SESS && SESS.uid && root.CLOUD_OK; }, false); }
  async function poll() {
    if (VP.busy || doc.hidden || !temSessao()) return;
    VP.busy = 1;
    try {
      var rows = await (await rq('/rest/v1/cotacoes?select=*&user_id=eq.' + SESS.uid)).json();
      if (Array.isArray(rows)) {
        var t = {};
        rows.forEach(function (a) { t[String(a.ticker).toUpperCase()] = { ult: +a.ult, hor: a.hor, up: Date.parse(a.updated_at) || 0 }; });
        LV.px = Object.assign({}, LV.px || {}, t); LV.all = rows; LV.ts = Date.now(); VP.ts = Date.now();
      }
    } catch (e) { /* ponte desligada */ }
    VP.busy = 0;
    aplica();
  }
  setInterval(poll, 10000);
  setTimeout(poll, 2500);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) poll(); });

  // Ibovespa da faixa também pela ponte (o Profit publica como IBOV).
  var vivoOrig = root.tapeVivo;
  root.tapeVivo = function (s) {
    if (s === '^BVSP') s = 'IBOV';
    if (s === 'IBOV') {
      var r = g(function () { return (LV.all || []).find(function (o) { return String(o.ticker).toUpperCase() === 'IBOV'; }); }, null);
      if (r && +r.ult > 0 && Date.now() - (Date.parse(r.updated_at) || 0) < 12e4) {
        var v = r.var != null && r.var !== '' && isFinite(+r.var) && Math.abs(+r.var) < 90 ? +r.var : +r.fec > 0 ? (+r.ult / +r.fec - 1) * 100 : null;
        if (v != null) return { px: +r.ult, chg: v };
      }
      return null;
    }
    return vivoOrig ? vivoOrig(s) : null;
  };

  function hojeISO() { return g(function () { return loc().slice(0, 10); }, new Date().toISOString().slice(0, 10)); }
  function fechadoHoje() {
    var d = hojeISO(), s = 0;
    g(function () {
      S.trades.forEach(function (t) {
        if (isOpen(t)) return;
        if (String(t.dtx || t.dt || '').slice(0, 10) !== d) return;
        var c = cBRL(t); if (c && isFinite(c.pl)) s += c.pl;
      });
    }, 0);
    return s;
  }
  function abertoVivo() { var ab = g(function () { return hojeAberto(); }, null); return ab && ab.n ? ab : null; }
  function notaTxt(ab) { return 'ao vivo · ' + brl(ab.pl) + ' em ' + ab.n + ' posição' + (ab.n === 1 ? '' : 'ões') + ' aberta' + (ab.n === 1 ? '' : 's'); }
  // Usados pelos cartões de resultado (Início e Meu dia) já na montagem: o valor sai certo, sem piscar.
  root.vivoDia = function (x) { var ab = abertoVivo(); return ab ? (+x || 0) + ab.pl : x; };
  root.vivoNota = function () { var ab = abertoVivo(); return ab ? '<em class="v563-vivo">' + notaTxt(ab) + '</em>' : ''; };
  // Entre uma montagem e outra, a cotação muda: atualiza só o número e a nota.
  function pintaResultado() {
    var t0 = aba(); if (t0 !== 'home' && t0 !== 'dia') return;
    var ab = abertoVivo();
    doc.querySelectorAll('#app:not(.v503-fantasma) [data-v568-base]').forEach(function (val) {
      if (!/\d/.test(val.textContent)) return; // valores escondidos (olho)
      var base = +val.getAttribute('data-v568-base') || 0, tot = ab ? base + ab.pl : base;
      if (val.dataset.v568Tot === String(tot)) return;
      if (val.dataset.v568Tot !== undefined || ab) {
        val.textContent = brl(tot);
        val.style.color = tot > 0 ? 'var(--ds-up)' : tot < 0 ? 'var(--ds-down)' : '';
      }
      val.dataset.v568Tot = String(tot);
      var box = val.parentElement, nota = box.querySelector('.v563-vivo');
      if (ab) { if (!nota) { nota = doc.createElement('em'); nota.className = 'v563-vivo'; val.after(nota); } var t2 = notaTxt(ab); if (nota.textContent !== t2) nota.textContent = t2; }
      else if (nota) nota.remove();
    });
  }
  function aplica() {
    try { if (typeof lvcPaint === 'function') lvcPaint(); } catch (e) { /* sem painel */ }
    try { if (root.tapeRedraw) root.tapeRedraw(); } catch (e) { /* sem faixa */ }
    try { if (typeof lvPaint === 'function' && aba() === 'live') lvPaint(); } catch (e) { /* sem tela */ }
    pintaResultado();
  }

  // ---------- telas ----------
  function operacoes(app) {
    if (aba() !== 'ops') return;
    var ferr = app.querySelector('[data-v4tool="geral"]');
    if (!ferr || ferr.parentElement.querySelector('[data-v563-import]')) return;
    var b = doc.createElement('button');
    b.type = 'button'; b.className = ferr.className; b.dataset.dt393Route = 'import'; b.dataset.v563Import = '1';
    b.innerHTML = (g(function () { return root.icoSvg('layers'); }, '') || '') + 'Importar do Profit';
    ferr.after(b);
  }
  function importar(app) {
    if (aba() !== 'import') return;
    var back = app.querySelector('#dt414-back button');
    if (back && back.dataset.dt414Go) { delete back.dataset.dt414Go; back.dataset.dt393Route = 'ops'; back.textContent = '← Operações'; back.setAttribute('aria-label', 'Voltar para Operações'); }
    var p = app.querySelector('.platform-area > p'); if (p && !/Operações/.test(p.textContent)) p.textContent = 'DIÁRIO DE TRADER / Operações';
  }
  function configuracoes(app) {
    app.querySelectorAll('.dt414-essentials [data-dt414-go="painel"],.dt414-essentials [data-dt414-go="contratos"],.dt414-essentials [data-dt414-go="import"]').forEach(function (b) { b.remove(); });
  }
  function carteira(app) {
    var t = aba();
    app.querySelectorAll('[data-navroute="imposto"]').forEach(function (b) {
      var faixa = b.parentElement;
      if (t === 'imposto') { if (faixa && faixa.style.display !== 'none') faixa.style.display = 'none'; } else b.remove();
    });
    if (t === 'imposto') {
      var back = app.querySelector('#dt414-back'); if (back) back.remove();
    }
  }
  function etapas(app) {
    var txt = function (re) {
      var rows = [].slice.call(app.querySelectorAll('div,li')).filter(function (d) { return /^[✓✗]/.test(d.textContent.trim()) && re.test(d.textContent) && d.textContent.length < 260; });
      if (!rows.length) return null;
      return /^✓/.test(rows[rows.length - 1].textContent.trim());
    };
    var E = [
      ['Disciplina', 'Seguir as regras em 90% dos trades dos últimos 90 dias.', txt(/Disciplina/)],
      ['Consistência', '12 meses positivos seguidos, sem mês negativo no meio.', txt(/meses positivos seguidos/)],
      ['Renda', 'Média dos últimos 6 meses na renda alvo e nenhum mês com perda maior que 1 mês de custo.', (function () { var a = txt(/renda alvo/), b = txt(/Nenhum mês/); return a == null && b == null ? null : !!a && !!b; })()],
      ['Segurança', 'Reserva de 12 meses de custo de vida guardada.', txt(/Reserva de 12/)],
    ];
    var atual = E.findIndex(function (x) { return !x[2]; });
    var html = '<h2>Etapas até sair da CLT</h2><p class="sm mut">Uma etapa de cada vez. A próxima só conta quando a anterior está cumprida.</p><ol class="v563-etapas">' +
      E.map(function (x, i) {
        var st = x[2] ? 'ok' : i === atual ? 'agora' : 'depois';
        return '<li class="' + st + '"><b>' + (i + 1) + '. ' + x[0] + '</b><span>' + x[1] + '</span><em>' + (x[2] ? 'cumprida' : i === atual ? 'etapa atual' : 'a seguir') + '</em></li>';
      }).join('') + '<li class="' + (atual < 0 ? 'ok' : 'depois') + '"><b>5. Transição</b><span>Pedir as contas com plano escrito, capital separado e salário do trader definido.</span><em>' + (atual < 0 ? 'liberada' : 'a seguir') + '</em></li></ol>';
    var card = app.querySelector('.v563-etapas-card');
    if (!card) {
      card = doc.createElement('div'); card.className = 'card v563-etapas-card';
      var hero = app.querySelector('.dt395-native-carreira .hero'); if (!hero) return;
      hero.after(card);
    }
    if (card.dataset.h !== html) { card.innerHTML = html; card.dataset.h = html; }
  }
  function transicao(app) {
    if (aba() !== 'carreira') return;
    g(function () { if (FIN.t && FIN.t !== 'plano') { FIN.t = 'plano'; render(); } });
    app.querySelectorAll('.finchips').forEach(function (c) { c.remove(); });
    app.querySelectorAll('.crsai-c').forEach(function (c) { if (/^Casamento/.test(c.textContent.trim())) c.remove(); });
    etapas(app);
  }
  function redireciona() {
    var t = aba();
    if (t === 'painel' || t === 'contratos') abreCapital();
  }

  // ---------- menu: busca sempre volta ao início ao reabrir ----------
  function menuLimpo() {
    var dr = doc.getElementById('dt394-drawer'); if (!dr || dr.hidden) return;
    if (dr.dataset.v563Aberto === '1') return;
    dr.dataset.v563Aberto = '1';
    var inp = doc.getElementById('dt394-nav-search');
    if (inp && inp.value) { inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    dr.classList.remove('v512-busca');
    dr.querySelectorAll('.v420-menu-sec.v420-empty').forEach(function (n) { n.classList.remove('v420-empty'); });
    dr.querySelectorAll('.dt394-nav-list [hidden]').forEach(function (n) { if (n.id !== 'dt414-drawer-access' && n.id !== 'v419-drawer') n.hidden = false; });
    var nr = doc.getElementById('dt394-no-results'); if (nr) nr.hidden = true;
  }
  function menuFechado() { var dr = doc.getElementById('dt394-drawer'); if (dr && dr.hidden) dr.dataset.v563Aberto = ''; }

  var q = 0;
  function monta() {
    q = 0;
    var app = doc.querySelector('#app:not(.v503-fantasma)');
    menuFechado(); menuLimpo();
    if (!app) return;
    var t = aba();
    redireciona(); operacoes(app); importar(app); configuracoes(app); carteira(app); transicao(app); pintaResultado();
  }
  function fila() { if (!q) { q = 1; setTimeout(monta, 150); } }
  new MutationObserver(fila).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  fila();
  // v568: aplica logo depois de cada render (antes da pintura) para o resultado ao vivo não piscar.
  function gancho() {
    if (typeof root.render0 !== 'function' || root.render0.__v568) return;
    var prev = root.render0;
    var f = function () { var r = prev.apply(this, arguments); try { pintaResultado(); } catch (e) { /* sem tela */ } return r; };
    f.__v568 = 1; root.render0 = f;
  }
  gancho(); setInterval(gancho, 2000);
  root.DiarioAjustes564 = { poll: poll, abreCapital: abreCapital };
})(window, document);
