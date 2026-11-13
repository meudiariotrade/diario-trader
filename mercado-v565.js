/* v565 — Mercado: Terminal Grafite.
   Faixa de contexto (título da tela e selo de exemplo), item Panorama no menu "Mais",
   estado dos filtros para leitores de tela, avisos repetidos e travessão sem dado.
   Idempotente: compara antes de escrever no DOM; sem dado → "–". */
(function () {
  'use strict';
  var doc = document;
  doc.body.classList.add('mkt565');
  var TITULOS = { lab: 'Análises', pn: 'Panorama', fl: 'Fluxo de opções', opc: 'Opções', rk: 'Altas e baixas' };
  var demo = /[?&]demo=1\b/.test(location.search);
  var agendado = 0;

  function sub() { try { return MKT.tab; } catch (e) { return ''; } }
  function setAttr(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v); }

  function faixa(m) {
    var ref = m.querySelector('#mkt549-mais') || m.querySelector('nav.m403-primary-tabs');
    if (!ref) return;
    var el = m.querySelector('#mkt565-ctx');
    if (!el) { el = doc.createElement('div'); el.id = 'mkt565-ctx'; }
    // só reposiciona se não estiver depois da referência (evita briga com outros módulos)
    if (el.parentNode !== m || !(ref.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) ref.after(el);
    var t = TITULOS[sub()] || '';
    var html = '';
    if (t) html += '<button type="button" data-mkt565-voltar>‹ Mais</button><h2>' + t + '</h2>';
    if (demo) html += '<span class="mkt565-ex">EXEMPLO · dados fictícios</span>';
    var chave = t + '|' + (demo ? 1 : 0);
    if (el.getAttribute('data-k') !== chave) { el.innerHTML = html; el.setAttribute('data-k', chave); }
  }

  function menu(m) { /* v570: menu Mais só com Análises e Movimentos, insiders e fluxo (CSS). */ }

  function pressed(m) {
    m.querySelectorAll('button.btn[data-v]').forEach(function (b) { setAttr(b, 'aria-pressed', String(!b.classList.contains('s'))); });
    m.querySelectorAll('.cqtabs>button, .m406-switch-button').forEach(function (b) {
      setAttr(b, 'aria-pressed', String(b.classList.contains('on') || b.getAttribute('aria-selected') === 'true'));
    });
  }

  function dup(m) {
    m.querySelectorAll('.warn, .sm.am').forEach(function (n) {
      var eh = /^\s*Modo demonstrativo:/.test(n.textContent || '');
      if (n.classList.contains('mkt565-dup') !== eh) n.classList.toggle('mkt565-dup', eh);
    });
  }

  function travessao(m) {
    m.querySelectorAll('.sw9k b').forEach(function (b) {
      if (b.children.length === 0 && b.textContent.trim() === '—') b.textContent = '–';
    });
  }

  function run() {
    agendado = 0;
    var app = doc.querySelector('#app:not(.v503-fantasma)'); if (!app) return;
    var m = app.querySelector('.dt395-native-mercado');
    if (!m) return;
    if (!["cq","lab"].includes(sub())) faixa(m); menu(m); pressed(m); dup(m); travessao(m);
    // v572: Jornal pertence a Notícias (aba marcada é Notícias, não Mais).
    var jr = m.getAttribute('data-m403-sub') === 'jr';
    var nt = m.querySelector('nav.m403-primary-tabs [data-navroute="mercado:nt"]'), mais = m.querySelector('nav.m403-primary-tabs [data-mkt549="mais"]');
    if (nt) { nt.classList.toggle('on', jr || nt.classList.contains('on')); if (jr) nt.setAttribute('aria-current', 'page'); }
    if (mais && jr) { mais.classList.remove('on'); mais.removeAttribute('aria-current'); }
  }
  function agenda() { if (agendado) return; var em = false; try { em = tab === 'mercado'; } catch (e) { /* sem app */ } if (em) agendado = requestAnimationFrame(run); }

  doc.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    var ir = t.closest('[data-mkt565-ir]');
    if (ir && ir.closest('#app:not(.v503-fantasma)')) {
      try { MKT.tab = ir.getAttribute('data-mkt565-ir'); try { localStorage.setItem('diario-mkt-tab', MKT.tab); } catch (e) { /* sem storage */ } render(); scrollTo(0, 0); } catch (e) { /* sem app */ }
      return;
    }
    var v = t.closest('[data-mkt565-voltar]');
    if (v) { var mais = doc.querySelector('#app:not(.v503-fantasma) [data-mkt549="mais"]'); if (mais) mais.click(); }
  });

  new MutationObserver(agenda).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.Mercado565 = { run: run };
  agenda();
})();
