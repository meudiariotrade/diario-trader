/* v568 — tema claro sem blocos pretos.
   Depois de cada troca de tela, procura fundos escuros (e textos claros) que vieram do tema escuro
   e troca pelos tokens do tema claro. Seleção (.on, ativo, pressionado) vira âmbar claro. Só roda no tema claro. */
(function (root, doc) {
  'use strict';
  if (root.DiarioClaro568) return;
  var visto = new WeakMap(), vtx = new WeakSet();
  var PULA = '.trm,#tf413,#terminal-inicio,img,svg,canvas,video,iframe,picture,#wf-demo-banner,.wf-chat-launcher,#capa,#c561,#splash,.v503-fantasma,[class*="tradingview"],.c561-arte,.jr561-arte,.dt397-cover,.pf-logo,[data-noclaro]';
  var SEL = '.on,.active,.ativo,.sel,.pri,[aria-pressed="true"],[aria-current],[aria-selected="true"]';
  function claro() { return doc.documentElement.getAttribute('data-v427-tema') === 'claro'; }
  function lum(c) {
    var m = c && c.match(/[\d.]+/g); if (!m || m.length < 3) return null;
    var a = m.length > 3 ? +m[3] : 1; if (a < 0.5) return null;
    return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
  }
  function passa(raiz) {
    if (!raiz) return;
    var todos = raiz.getElementsByTagName('*');
    for (var i = 0; i < todos.length; i++) {
      var e = todos[i];
      var k = e.className && e.className.baseVal === undefined ? e.className : '';
      if (visto.get(e) === k) continue;
      if (e.matches(PULA) || e.closest(PULA)) { visto.set(e, k); continue; }
      var s = getComputedStyle(e);
      if (s.display === 'none') { continue; }
      var bg = lum(s.backgroundColor);
      if (bg !== null && bg < 0.32 && !/url\(/.test(s.backgroundImage)) {
        e.classList.remove('cl568', 'cl568-on');
        e.classList.add(e.matches(SEL) ? 'cl568-on' : 'cl568');
      } else if (/gradient/.test(s.backgroundImage) && !/url\(/.test(s.backgroundImage) && e.matches('button,a,[role=button],.chip,.btn')) {
        e.classList.add(e.matches(SEL) ? 'cl568-on' : 'cl568');
      }
      visto.set(e, e.className && e.className.baseVal === undefined ? e.className : '');
    }
    // textos claros que ficaram sobre fundo claro
    for (var j = 0; j < todos.length; j++) {
      var t = todos[j];
      if (vtx.has(t) || !t.firstChild || t.childElementCount > 3) continue;
      vtx.add(t);
      var tx = false; for (var n = t.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) { tx = true; break; }
      if (!tx || t.closest(PULA)) continue;
      var cs = getComputedStyle(t), l = lum(cs.color);
      if (l !== null && l > 0.78) t.classList.add('cl568-tx');
    }
  }
  var fila = 0;
  function roda() {
    fila = 0;
    if (!claro()) return;
    passa(doc.getElementById('app'));
    passa(doc.getElementById('dt394-drawer'));
    passa(doc.getElementById('wf-chat-panel'));
    passa(doc.getElementById('v4-bnav'));
  }
  function agenda() { if (!fila && claro()) fila = setTimeout(roda, 60); }
  function gancho() {
    if (typeof root.render0 !== 'function' || root.render0.__cl568) return;
    var prev = root.render0;
    var f = function () { var r = prev.apply(this, arguments); try { if (claro()) roda(); } catch (e) { /* segue */ } return r; };
    f.__cl568 = 1; root.render0 = f;
  }
  gancho(); setInterval(gancho, 2000);
  // v570: o que entra na tela é corrigido antes da pintura (sem piscar preto).
  new MutationObserver(function (lista) {
    if (!claro()) return;
    for (var i = 0; i < lista.length; i++) for (var n = lista[i].addedNodes, k = 0; k < n.length; k++) {
      var e = n[k]; if (e.nodeType !== 1) continue;
      if (e.closest && e.closest('#app,#dt394-drawer,#wf-chat-panel,#v4-bnav,#v570-metas')) { try { passa(e.parentElement || e); } catch (x) { /* segue */ } }
    }
    agenda();
  }).observe(doc.body, { childList: true, subtree: true });
  new MutationObserver(function () { visto = new WeakMap(); vtx = new WeakSet(); agenda(); }).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-v427-tema'] });
  agenda();
  root.DiarioClaro568 = { roda: roda };
})(window, document);
