/* v815 — Barra de contexto única: fase da sessão, relógios B3/NY, próxima virada,
 * ativo em foco, risco usado e status do dia. Fica no cabeçalho raiz, é a mesma em
 * todas as abas e não consulta rede: lê DiarioSessoes, DiarioRisco e DiarioInteligencia.
 * Atualiza pelo relógio central (1 s), só com a página visível e só o texto que mudou.
 */
(function (root, doc) {
  'use strict';
  if (!doc || root.DiarioBarraContexto) return;
  var FOCO_KEY = 'diario-foco-v815';
  var FASES = {
    pre: ['PRÉ-MERCADO', 'pre', 'Abertura em'],
    pregao: ['PREGÃO', 'pregao', 'Fechamento em'],
    pos: ['PÓS-MERCADO', 'pos', 'Próxima fase em'],
    b3_fechada: ['B3 FECHADA', 'fechada', 'Próxima fase em'],
    cripto_macro: ['FIM DE SEMANA', 'fechada', 'Próxima fase em']
  };
  var el = null, ultimo = {}, prox = 0, agLido = 0, agEventos = [];

  /* Próximo evento de alto impacto (BR/EUA) da agenda já guardada no aparelho; relido no máximo 1x/min. */
  function proximoEvento(now) {
    if (now - agLido > 60000) {
      agLido = now; agEventos = [];
      try {
        var raw = JSON.parse(localStorage.getItem('diario-agenda') || 'null'), v = raw && (raw.v || raw);
        [0, 1].forEach(function (k) { var e = v && v[k] && v[k].eventos; if (Array.isArray(e)) agEventos = agEventos.concat(e); });
        agEventos = agEventos.filter(function (e) { return e && e.imp >= 1 && /^(BR|US)$/.test(e.p) && e.em; })
          .map(function (e) { return { t: String(e.t || ''), at: Date.parse(e.em) }; })
          .filter(function (e) { return isFinite(e.at); }).sort(function (a, b) { return a.at - b.at; });
      } catch (e) { agEventos = []; }
    }
    for (var i = 0; i < agEventos.length; i++) { var d = agEventos[i].at - now; if (d > -5 * 60000 && d <= 60 * 60000) return agEventos[i]; }
    return null;
  }

  function hm(ms, zona) {
    try { return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: zona }); } catch (e) { return '--:--'; }
  }
  function falta(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    if (h >= 24) return Math.floor(h / 24) + ' d ' + (h % 24) + ' h';
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
  }
  function corRisco(p) { return p == null ? '' : p <= 50 ? 'ok' : p <= 80 ? 'at' : 'cr'; }

  /* Ativo em foco: lembrado no aparelho e publicado no barramento para as outras abas. */
  function focoAtual() {
    var b = root.DiarioInteligencia, s = b && b.getSelectedAsset && b.getSelectedAsset();
    if (s && s.ticker) return s.ticker;
    try { return localStorage.getItem(FOCO_KEY) || ''; } catch (e) { return ''; }
  }
  function definirFoco(tk, origem) {
    var b = root.DiarioInteligencia;
    var t = b && b.normalizeTicker ? b.normalizeTicker(tk) : null;
    if (!t) return false;
    try { localStorage.setItem(FOCO_KEY, t); } catch (e) { /* segue */ }
    if (b) b.selectAsset(t, origem || 'app');
    pinta(true);
    return true;
  }

  function dados(now) {
    var S = root.DiarioSessoes, c = S ? S.context(now) : null;
    var f = FASES[c && c.mode] || FASES.b3_fechada;
    if (!prox || prox <= now) prox = S ? S.nextTransition(now) : 0;
    var r = null, st = null;
    try { r = root.DiarioRisco && root.DiarioRisco.hoje(); } catch (e) { r = null; }
    try { st = root.DiarioRisco && root.DiarioRisco.status && root.DiarioRisco.status(); } catch (e) { st = null; }
    var pct = null;
    if (r && r.limite > 0 && r.disponivel != null) pct = Math.max(0, Math.min(100, Math.round((r.limite - r.disponivel) / r.limite * 100)));
    return {
      fase: f[0], cls: f[1], rot: f[2], b3: hm(now, 'America/Sao_Paulo'), ny: hm(now, 'America/New_York'),
      falta: prox ? falta(prox - now) : '', foco: focoAtual(), pct: pct,
      st: st ? st.label : '', stc: st ? st.st : '', why: st ? st.why : '',
      ev: proximoEvento(now)
    };
  }

  function monta() {
    if (el && el.isConnected) return el;
    var head = doc.getElementById('dt393-global-head');
    var alvo = head && head.querySelector('.dt393-topbar');
    if (!alvo) return null;
    el = doc.getElementById('dt815-ctx') || doc.createElement('div');
    el.id = 'dt815-ctx';
    el.innerHTML = '<button type="button" class="dt815-fase" data-dt815="dia"></button>' +
      '<span class="dt815-it dt815-rel">B3 <b data-k="b3"></b></span>' +
      '<span class="dt815-it dt815-rel">NY <b data-k="ny"></b></span>' +
      '<span class="dt815-it"><span data-k="rot"></span> <b data-k="falta"></b></span>' +
      '<span class="dt815-it dt815-ev" hidden><b data-k="evq"></b> <span data-k="evt"></span></span>' +
      '<span class="dt815-sp"></span>' +
      '<button type="button" class="dt815-it dt815-foco" data-dt815="foco">Foco <b data-k="foco"></b></button>' +
      '<span class="dt815-it dt815-risco">Risco <b data-k="pct"></b><i aria-hidden="true"><u></u></i></span>' +
      '<button type="button" class="dt815-st" data-dt815="dia"></button>';
    alvo.insertAdjacentElement('afterend', el);
    ultimo = {};
    return el;
  }
  function txt(k, v) {
    if (ultimo[k] === v) return;
    ultimo[k] = v;
    var n = el.querySelector('[data-k="' + k + '"]');
    if (n) n.textContent = v;
  }
  /* Ativo aberto no Terminal também vira o foco do app. */
  function ligaTerminal() {
    var f = root.trRoda;
    if (typeof f !== 'function' || f.__dt815) return;
    var g = function (cmd) {
      try { var p = root.trParse && root.trParse(cmd); if (p && p.tk) definirFoco(p.tk, 'terminal'); } catch (e) { /* segue */ }
      return f.apply(this, arguments);
    };
    g.__dt815 = 1; root.trRoda = g;
  }
  function pinta(forca) {
    ligaTerminal();
    if (doc.hidden && !forca) return;
    if (!monta()) return;
    var d = dados(Date.now());
    var fb = el.querySelector('.dt815-fase');
    if (ultimo.fase !== d.fase + d.cls) { ultimo.fase = d.fase + d.cls; fb.textContent = d.fase; fb.className = 'dt815-fase f-' + d.cls; }
    txt('b3', d.b3); txt('ny', d.ny); txt('rot', d.rot); txt('falta', d.falta);
    txt('foco', d.foco || '—');
    txt('pct', d.pct == null ? '—' : d.pct + '%');
    var rk = d.pct + '|' + corRisco(d.pct);
    if (ultimo.rk !== rk) {
      ultimo.rk = rk;
      var ri = el.querySelector('.dt815-risco');
      ri.className = 'dt815-it dt815-risco ' + corRisco(d.pct);
      ri.querySelector('u').style.width = (d.pct || 0) + '%';
    }
    var ev = el.querySelector('.dt815-ev');
    if (d.ev) {
      var mins = Math.round((d.ev.at - Date.now()) / 60000);
      txt('evq', mins > 0 ? 'EM ' + mins + ' MIN' : 'AGORA');
      txt('evt', hm(d.ev.at, 'America/Sao_Paulo') + ' · ' + d.ev.t);
      if (ev.hidden) ev.hidden = false;
    } else if (!ev.hidden) ev.hidden = true;
    var sb = el.querySelector('.dt815-st');
    var sk = d.st + '|' + d.stc + '|' + d.why;
    if (ultimo.st !== sk) {
      ultimo.st = sk;
      sb.textContent = d.st || '';
      sb.hidden = !d.st;
      sb.className = 'dt815-st s-' + (d.stc || 'g');
      sb.title = d.why || '';
    }
  }

  doc.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var b = t.closest('[data-dt815]');
    if (b) {
      var go = b.getAttribute('data-dt815') === 'foco' ? 'term' : 'dia';
      if (b.hasAttribute('data-tk')) definirFoco(b.getAttribute('data-tk'), 'clique');
      var tk = focoAtual();
      if (typeof root.irPara === 'function') root.irPara(go);
      /* Foco → Terminal já abre o gráfico do ativo (comando "TICKER G"). */
      if (go === 'term' && tk) setTimeout(function () { try { if (typeof root.trRoda === 'function') root.trRoda(tk + ' G'); } catch (x) { /* segue */ } }, 300);
      return;
    }
    /* Qualquer linha ou botão com ticker (data-tk / data-ticker) vira o ativo em foco do app. */
    var a = t.closest('[data-tk],[data-ticker]');
    if (a) definirFoco(a.getAttribute('data-tk') || a.getAttribute('data-ticker'), 'clique');
  }, true);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) { prox = 0; pinta(); } });
  root.addEventListener('diario:render', function () { pinta(true); });
  setInterval(pinta, 1000);
  var restaurado = focoAtual();
  if (restaurado && root.DiarioInteligencia && !root.DiarioInteligencia.getSelectedAsset()) root.DiarioInteligencia.selectAsset(restaurado, 'restaurado');
  root.DiarioBarraContexto = Object.freeze({ pinta: pinta, definirFoco: definirFoco, focoAtual: focoAtual });
})(typeof window !== 'undefined' ? window : globalThis, typeof document !== 'undefined' ? document : null);
