/* v549 — Mercado simples: 3 abas + Mais, categorias enxutas, uma ordenação, extras recolhidos.
   Nada é apagado: os botões originais ficam escondidos e são acionados pelos atalhos novos. */
(function (root, doc) {
  'use strict';
  if (root.MercadoSimples549) return;
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => [...el.querySelectorAll(s)];
  const mk = () => $('#app:not(.v503-fantasma) .dt395-native-mercado');
  const st = { mais: false, outros: false, mostrar: '' };
  doc.body.classList.add('mkt549');

  // Abre em Futuros uma vez por sessão (WIN/WDO primeiro).
  try { if (!sessionStorage.getItem('m549-fut') && typeof CQ !== 'undefined' && CQ) { CQ.aba = 'fut'; sessionStorage.setItem('m549-fut', '1'); } } catch {}

  const PRINCIPAIS = new Set(['fav', 'fut', 'br', 'idx']);
  const ORDEM = [['lista', 'Ordem padrão'], ['alta', 'Maiores altas'], ['baixa', 'Maiores quedas']];
  const MAIS = [
    ['lab', 'Análises', 'Medo e ganância, sazonalidade, correlação e cenários'],
    ['jr', 'Jornal do dia', 'Resumo do pregão e giro de notícias'],
    ['ls', 'Long & Short', 'Pares de ações e acompanhamento'],
    ['radar', 'Movimentos, insiders e fluxo', 'Ações que se moveram forte e quem comprou ou vendeu'],
    ['mapa', 'Mapa de calor', 'Visão em blocos da categoria aberta'],
    ['comparar', 'Comparar históricos', 'Dois ativos no mesmo gráfico'],
    ['fontes', 'Fontes e atualização', 'De onde vêm os preços e o horário de cada consulta']
  ];
  const sub = () => { try { return MKT.tab; } catch { return ''; } };
  const ir = t => { try { MKT.tab = t; try { localStorage.setItem('diario-mkt-tab', t); } catch {} render(); scrollTo(0, 0); } catch {} };

  function abas(m) {
    const nav = $('nav.m403-primary-tabs', m); if (!nav) return;
    let mais = $('[data-mkt549="mais"]', nav);
    if (!mais) {
      mais = doc.createElement('button'); mais.type = 'button'; mais.dataset.mkt549 = 'mais'; mais.textContent = 'Mais';
      mais.setAttribute('aria-expanded', 'false'); nav.append(mais);
    }
    const emMais = ['lab', 'jr', 'al', 'pn', 'giro'].includes(sub());
    mais.classList.toggle('mkt549-on', emMais || st.mais);
    mais.setAttribute('aria-expanded', String(st.mais));
    if (mais.nextElementSibling) nav.append(mais);
    let painel = $('#mkt549-mais', m);
    if (!painel) {
      painel = doc.createElement('div'); painel.id = 'mkt549-mais'; painel.setAttribute('role', 'menu');
      painel.innerHTML = MAIS.map(([k, t, d]) => `<button type="button" role="menuitem" data-mkt549-ir="${k}"><b>${t}</b><small>${d}</small></button>`).join('');
      nav.after(painel);
    } else if (painel.previousElementSibling !== nav) nav.after(painel);
    painel.hidden = !st.mais;
    const temRadar = !!$('#v518-mov, #v519-ins, #v520-fa', m);
    const r = $('[data-mkt549-ir="radar"]', painel); if (r) r.hidden = !temRadar;
  }

  function radar(m) {
    const itens = $$('#v519-ins, #v520-fa', m);
    let box = $('#mkt549-radar', m);
    if (!itens.length) { if (box) box.hidden = true; return; }
    if (!box) {
      box = doc.createElement('section'); box.id = 'mkt549-radar'; box.setAttribute('aria-label', 'Movimentos, insiders e fluxo');
      box.innerHTML = '<div class="mkt549-radar-top"><b>Movimentos, insiders e fluxo</b><button type="button" data-mkt549-fechar>Fechar</button></div>';
    }
    const ref = $('#mkt549-mais', m) || $('nav.m403-primary-tabs', m);
    if (ref && box.previousElementSibling !== ref) ref.after(box);
    for (const id of ['v519-ins', 'v520-fa']) { const el = itens.find(x => x.id === id); if (el && el.parentElement !== box) box.append(el); }
    box.hidden = st.mostrar !== 'radar';
  }

  function cotacoes(m) {
    const box = $('#cqbox, #cotbox', m); if (!box || box.classList.contains('market-quotes')) return;
    // Categorias: 4 principais + Outros.
    const seg = $('.cqtabs', box);
    if (seg) {
      let outros = $('[data-mkt549-outros]', seg);
      if (!outros) { outros = doc.createElement('button'); outros.type = 'button'; outros.dataset.mkt549Outros = '1'; seg.append(outros); }
      $$('button[data-cqa]', seg).forEach(b => { const extra = !PRINCIPAIS.has(b.dataset.cqa); b.classList.toggle('mkt549-extra', extra); });
      const ativoExtra = $$('button[data-cqa].on', seg).some(b => !PRINCIPAIS.has(b.dataset.cqa));
      seg.classList.toggle('mkt549-outros-abertos', st.outros);
      const txt = st.outros ? 'Menos' : (ativoExtra ? 'Outros ✓' : 'Outros');
      if (outros.textContent !== txt) outros.textContent = txt;
      outros.setAttribute('aria-expanded', String(st.outros));
      if (outros.nextElementSibling) seg.append(outros);
    }
    // Atualizar vira ícone dentro da busca.
    const busca = $('label.m403-searchbar, .cq388-searchbar', box), refresh = $('[data-m408-refresh]', box);
    if (busca && refresh && !$('[data-mkt549-refresh]', busca)) {
      const b = doc.createElement('button'); b.type = 'button'; b.dataset.mkt549Refresh = '1'; b.setAttribute('aria-label', 'Atualizar preços'); b.title = 'Atualizar preços';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
      busca.append(b);
    }
    const inp = $('input[data-m403-search], input[data-cq388-search]', box); if (inp && inp.placeholder !== 'Buscar ativo') inp.placeholder = 'Buscar ativo';
    // Uma ordenação só (botão que alterna).
    const ctr = $('.m408-controls', box);
    if (ctr) {
      let ord = $('[data-mkt549-ordem]', ctr);
      if (!ord) { ord = doc.createElement('button'); ord.type = 'button'; ord.dataset.mkt549Ordem = '1'; ctr.prepend(ord); }
      const atual = ($('.m408-sort-left [data-cqo].on', ctr) || {}).dataset?.cqo || 'lista';
      const label = '⇅ ' + (ORDEM.find(o => o[0] === atual) || ORDEM[0])[1];
      if (ord.textContent !== label) ord.textContent = label;
      const mapa = !!$('.m408-sort-right [data-cqv="mapa"].on', ctr);
      ctr.classList.toggle('mkt549-mapa', mapa);
    }
    // Extras recolhidos, abertos pelo menu Mais.
    for (const [k, sel] of [['comparar', 'details.simple-comparison'], ['fontes', 'details.simple-market-sources']]) {
      const d = $(sel, box) || $(sel, m); if (d) d.classList.toggle('mkt549-visivel', st.mostrar === k);
    }
    // Card de ADRs: só o essencial.
    const adr = $('#adr', box);
    if (adr) $$(':scope > p.sm.mut, :scope > div.sm.mut', adr).forEach((p, i) => p.classList.toggle('mkt549-oculto', i > 0));
  }

  function run() {
    const m = mk(); if (!m) return;
    try { radar(m); cotacoes(m); } catch (e) { console.warn('v549 mercado', e); }
  }
  let q = false;
  const agenda = () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; run(); }); } };

  doc.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-mkt549="mais"]')) { e.preventDefault(); st.mais = !st.mais; agenda(); return; }
    const it = t.closest('[data-mkt549-ir]');
    if (it) {
      e.preventDefault(); const k = it.dataset.mkt549Ir; st.mais = false;
      if (k === 'lab' || k === 'jr') { st.mostrar = ''; ir(k); return; }
      if (k === 'ls') { st.mostrar = ''; const b = doc.getElementById('v512-lsbtn') || $('#app:not(.v503-fantasma) [data-v512="ls"]'); b?.click(); agenda(); return; }
      if (sub() !== 'cq') ir('cq');
      if (k === 'mapa') { st.mostrar = ''; $('#app:not(.v503-fantasma) :is(#cqbox,#cotbox) [data-cqv="mapa"]')?.click(); agenda(); return; }
      st.mostrar = k; agenda();
      setTimeout(() => {
        const alvo = k === 'radar' ? $('#app:not(.v503-fantasma) #mkt549-radar') : $(`#app:not(.v503-fantasma) ${k === 'comparar' ? 'details.simple-comparison' : 'details.simple-market-sources'}`);
        if (alvo) { if (alvo.tagName === 'DETAILS') alvo.open = true; alvo.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      }, 120);
      return;
    }
    if (t.closest('[data-mkt549-fechar]')) { st.mostrar = ''; agenda(); return; }
    if (t.closest('[data-mkt549-outros]')) { e.preventDefault(); st.outros = !st.outros; agenda(); return; }
    if (t.closest('[data-mkt549-refresh]')) { e.preventDefault(); $('#app:not(.v503-fantasma) :is(#cqbox,#cotbox) [data-m408-refresh]')?.click(); return; }
    if (t.closest('[data-mkt549-ordem]')) {
      e.preventDefault();
      const atual = ($('#app:not(.v503-fantasma) .m408-sort-left [data-cqo].on') || {}).dataset?.cqo || 'lista';
      const prox = ORDEM[(ORDEM.findIndex(o => o[0] === atual) + 1) % ORDEM.length][0];
      $(`#app:not(.v503-fantasma) .m408-sort-left [data-cqo="${prox}"]`)?.click(); agenda(); return;
    }
    if (t.closest('#app .m403-primary-tabs [data-navroute]')) { st.mais = false; st.mostrar = ''; }
    if (t.closest('.cqtabs button[data-cqa]')) st.outros = false;
    if (st.mais && !t.closest('#mkt549-mais')) { st.mais = false; agenda(); }
  }, true);
  doc.addEventListener('keydown', e => { if (e.key === 'Escape' && st.mais) { st.mais = false; agenda(); } });
  new MutationObserver(agenda).observe(doc.body, { childList: true, subtree: true });
  root.MercadoSimples549 = Object.freeze({ run, estado: st });
  agenda();
})(window, document);
