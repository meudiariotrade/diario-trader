/* v550 — destaque WIN/WDO, Análises recolhidas, Jornal junto de Notícias, primeiro acesso em 3 passos,
   "Continuar" em Estudos e revisão de regras repetidas/contraditórias. Nada é apagado sem o usuário tocar. */
(function (root, doc) {
  'use strict';
  if (root.Melhorias550) return;
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => [...el.querySelectorAll(s)];
  const app = () => $('#app:not(.v503-fantasma)');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const g = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch { return d; } };
  const salvar = () => { try { save(); } catch {} };
  const ax = () => (g(() => S, null) ? (S.ax ??= {}) : {});

  /* ---------------- Mercado: Análises em blocos recolhidos ---------------- */
  const abertos = new Set();
  function analises(m) {
    const grid = $('.sw9grid', m); if (!grid) return;
    $$(':scope > div', grid).forEach((bloco, i) => {
      const tit = $(':scope > .sw9t', bloco); if (!tit) return;
      const chave = (tit.childNodes[0]?.textContent || tit.textContent).trim().slice(0, 60);
      if (!bloco.classList.contains('m550-sanf')) {
        bloco.classList.add('m550-sanf');
        tit.setAttribute('role', 'button'); tit.tabIndex = 0;
        if (i === 0 && !abertos.size) abertos.add(chave);
      }
      const aberto = abertos.has(chave);
      bloco.classList.toggle('m550-aberto', aberto);
      tit.setAttribute('aria-expanded', String(aberto));
      tit.dataset.m550Chave = chave;
    });
  }
  function alternaBloco(tit) {
    const k = tit.dataset.m550Chave; if (!k) return;
    abertos.has(k) ? abertos.delete(k) : abertos.add(k);
    const m = $('#app:not(.v503-fantasma) .dt395-native-mercado'); if (m) analises(m);
    setTimeout(() => root.dispatchEvent(new Event('resize')), 50);
  }

  /* ---------------- Mercado: Jornal do dia dentro de Notícias ---------------- */
  function jornal(m) {
    // v617: uma barra só — Notícias | Balanços da B3 | Jornal do Pregão | Giro do mercado.
    // "Jornal do dia" era o mesmo que "Jornal do Pregão"; o segundo nível confundia o destaque ativo.
    $$('[data-m550-ntnav]', m).forEach(b => b.remove());
    const aba = g(() => MKT.tab, '');
    const btn = (attr, val, txt) => { const b = doc.createElement('button'); b.type = 'button'; b.className = 'm406-switch-button'; b.dataset[attr] = val; b.setAttribute('aria-pressed', 'false'); b.textContent = txt; return b; };
    if (aba === 'jr') {
      $$('[data-m550-jornal]', m).forEach(b => b.remove());
      const tabs = $('.m406-section-switch[data-m406-switch="jr"] .m406-switch-tabs', m);
      if (tabs && !$('[data-m550-nt]', tabs)) { tabs.setAttribute('aria-label', 'Seção de Notícias'); tabs.prepend(btn('m550Nt', 'noticias', 'Notícias'), btn('m550Nt', 'balancos', 'Balanços da B3')); }
      return;
    }
    if (aba !== 'nt') { $$('[data-m550-jornal]', m).forEach(b => b.remove()); return; }
    const sw = $('.m406-section-switch[data-m406-switch="nt"]', m); if (!sw || $('[data-m550-jornal]', sw)) return;
    const tabs = $('.m406-switch-tabs', sw) || sw;
    tabs.append(btn('m550Jornal', 'jornal', 'Jornal do Pregão'), btn('m550Jornal', 'giro', 'Giro do mercado'));
  }

  /* ---------------- Início: primeiro acesso em 3 passos ---------------- */
  const PASSOS = [
    ['stop', 'Defina seu stop diário', 'Quanto você aceita perder no dia. O app avisa quando chegar perto.', 'Definir stop'],
    ['setup', 'Escolha seu setup', 'Veja o checklist de Índice e Dólar e as regras de operação.', 'Ver regras'],
    ['trade', 'Registre o primeiro trade', 'Entrada, stop, saída e a foto do gráfico. Leva um minuto.', 'Registrar trade']
  ];
  function guia(a) {
    const home = $('.v4-page.v4-home', a);
    const st = ax().guia550 ||= {};
    const semTrades = !(g(() => S.trades, []) || []).length;
    let card = $('#m550-guia', a);
    if (!home || st.fim || (!semTrades && !st.forcar)) { card?.remove(); return; }
    if (!semTrades) st.trade = 1;
    if (PASSOS.every(p => st[p[0]])) { st.fim = Date.now(); salvar(); card?.remove(); return; }
    if (!card) { card = doc.createElement('section'); card.id = 'm550-guia'; card.className = 'v4-card'; card.setAttribute('aria-label', 'Primeiros passos'); }
    if (home.firstElementChild !== card) home.prepend(card);
    const feitos = PASSOS.filter(p => st[p[0]]).length;
    const html = `<div class="m550-guia-top"><h2>Comece em 3 passos</h2><button type="button" data-m550-pular>Pular</button></div><p class="m550-guia-sub">${feitos} de 3 feitos</p><ol>${PASSOS.map(([k, t, s, b]) => `<li class="${st[k] ? 'feito' : ''}"><div><b>${t}</b><small>${s}</small></div>${st[k] ? '<span class="m550-ok" aria-label="Feito">✓</span>' : `<button type="button" data-m550-passo="${k}">${b}</button>`}</li>`).join('')}</ol>`;
    if (card.dataset.h !== html) { card.innerHTML = html; card.dataset.h = html; }
  }
  function irPasso(k) {
    const st = ax().guia550 ||= {};
    if (k !== 'trade') { st[k] = 1; salvar(); }
    if (k === 'stop') { const b = $('#app:not(.v503-fantasma) [data-dt414-go="painel"]'); if (b) b.click(); else { try { tab = 'painel'; render(); } catch {} } }
    if (k === 'setup') { try { tab = 'regras'; render(); scrollTo(0, 0); } catch {} }
    if (k === 'trade') { const b = $('[data-dt393-action="newtrade"]'); if (b) b.click(); else { try { tab = 'ops'; render(); } catch {} } }
  }

  /* ---------------- Estudos: continuar de onde parou ---------------- */
  function lembrar(tipo, id, titulo) { const a = ax(); a.estUltimo = { tipo, id, titulo: String(titulo || '').slice(0, 90), em: Date.now() }; salvar(); }
  function continuar(a) {
    const page = $('.dt397-studies', a);
    let card = $('#m550-continuar', a);
    const ult = ax().estUltimo;
    /* v596: o card entra em Hoje > Continuar último estudo. */
    const alvo = page && $('.v596-continuar .dt397-panel-head', page);
    if (!alvo || !ult?.titulo) { card?.remove(); return; }
    if (!card) { card = doc.createElement('section'); card.id = 'm550-continuar'; card.setAttribute('aria-label', 'Continuar estudo'); }
    if (card.previousElementSibling !== alvo) alvo.after(card);
    const html = `<div><small>${ult.tipo === 'aula' ? 'Última aula' : 'Último livro'}</small><b>${esc(ult.titulo)}</b></div><button type="button" data-m550-continuar>Continuar</button>`;
    if (card.dataset.h !== html) { card.innerHTML = html; card.dataset.h = html; }
  }
  function abrirUltimo() {
    const u = ax().estUltimo; if (!u) return;
    if (u.tipo === 'livro') { const b = doc.createElement('button'); b.dataset.a = 'openbook'; b.dataset.id = u.id; b.hidden = true; ($('#app:not(.v503-fantasma)') || doc.body).append(b); b.click(); b.remove(); return; }
    const v = $('#app:not(.v503-fantasma) [data-dt397-view="aul"]'); v?.click();
    let n = 0; const t = setInterval(() => { const it = $(`#app:not(.v503-fantasma) [data-auopen="${CSS.escape(u.id)}"]`); if (it || ++n > 20) { clearInterval(t); it?.click(); } }, 150);
  }

  /* ---------------- Regras: repetidas e contraditórias ---------------- */
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9% ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const CONFLITOS = [
    [/\b3\s*(r|vezes o risco)\b|pelo menos 3r/i, 'O seu plano usa stop de 300 pts e 1º alvo de 200 pts no índice: um alvo mínimo de 3 vezes o risco não bate com ele.'],
    [/\b1% do capital\b/i, 'O seu plano usa stop diário de R$ 200 por contrato: confira se o limite de 1% do capital ainda vale.'],
    [/5 minutos antes e depois de noticia/i, 'O plano diz para não operar em horário de notícia; confira se os 5 minutos continuam valendo.']
  ];
  function revisar() {
    const rules = g(() => S.rules, []) || [], ok = ax().regrasOk || {};
    const itens = [], vistos = new Map();
    for (const r of rules) {
      const k = norm(r.t); if (!k) continue;
      if (vistos.has(k) && !ok[r.id]) itens.push({ r, motivo: 'Repete: "' + vistos.get(k).t + '"' });
      else vistos.set(k, r);
    }
    const temPlano = rules.some(r => String(r.id).startsWith('po-'));
    if (temPlano) for (const r of rules) { if (ok[r.id] || String(r.id).startsWith('po-')) continue; const c = CONFLITOS.find(([re]) => re.test(r.t)); if (c && !itens.some(i => i.r === r)) itens.push({ r, motivo: c[1] }); }
    return itens;
  }
  function regras(a) {
    if (g(() => tab, '') !== 'regras') return;
    const alvo = $('.po-regras', a) || $('h1', a); if (!alvo) return;
    const itens = revisar();
    let card = $('#m550-regras', a);
    if (!itens.length) { card?.remove(); return; }
    if (!card) { card = doc.createElement('section'); card.id = 'm550-regras'; card.className = 'card'; }
    if (alvo.nextElementSibling !== card) alvo.after(card);
    const html = `<h3>Regras para revisar (${itens.length})</h3><p class="sm mut">Algumas regras se repetem ou não batem com o seu plano. Nada é removido sem você tocar.</p>${itens.map(({ r, motivo }) => `<div class="m550-rv"><div><b>${esc(r.t)}</b><small>${esc(motivo)}</small></div><div class="m550-rv-acoes"><button type="button" data-m550-remover="${esc(r.id)}">Remover</button><button type="button" data-m550-manter="${esc(r.id)}">Manter</button></div></div>`).join('')}`;
    if (card.dataset.h !== html) { card.innerHTML = html; card.dataset.h = html; }
  }
  function removerRegra(id) {
    const b = doc.createElement('button'); b.dataset.a = 'delrule'; b.dataset.id = id; b.hidden = true;
    ($('#app:not(.v503-fantasma)') || doc.body).append(b); b.click(); b.remove();
  }

  /* ---------------- ciclo ---------------- */
  function run() {
    const a = app(); if (!a) return;
    const t = g(() => tab, '');
    try {
      const m = $('.dt395-native-mercado', a);
      if (m) { const sub = g(() => MKT.tab, ''); if (sub === 'lab') analises(m); if (sub === 'nt' || sub === 'jr') jornal(m); }
      if (t === 'home') guia(a);
      if (t === 'estudos') continuar(a);
      regras(a);
    } catch (e) { console.warn('v550', e); }
  }
  let q = false;
  const agenda = () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; run(); }); } };
  doc.addEventListener('click', e => {
    const t = e.target;
    let el;
    if ((el = t.closest('.m550-sanf > .sw9t'))) { alternaBloco(el); return; }
    const ntv = t.closest('[data-m550-nt]');
    if (ntv) { e.preventDefault(); e.stopPropagation(); try { ntv.dataset.m550Nt === 'balancos' ? GOR.bal() : GOR.noticias ? GOR.noticias() : ((MKT.tab = 'nt'), render()); scrollTo(0, 0); } catch {} return; }
    if ((el = t.closest('[data-m550-jornal]'))) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.setItem('diario-mercado-jornal-secao', el.dataset.m550Jornal === 'giro' ? 'giro' : 'jornal'); } catch {} try { MKT.tab = 'jr'; render(); scrollTo(0, 0); } catch {} return; }
    if ((el = t.closest('[data-m550-passo]'))) { e.preventDefault(); irPasso(el.dataset.m550Passo); agenda(); return; }
    if (t.closest('[data-m550-pular]')) { const st = ax().guia550 ||= {}; st.fim = Date.now(); salvar(); agenda(); return; }
    if (t.closest('[data-m550-continuar]')) { e.preventDefault(); abrirUltimo(); return; }
    if ((el = t.closest('[data-m550-remover]'))) { e.preventDefault(); removerRegra(el.dataset.m550Remover); agenda(); return; }
    if ((el = t.closest('[data-m550-manter]'))) { e.preventDefault(); (ax().regrasOk ||= {})[el.dataset.m550Manter] = Date.now(); salvar(); agenda(); return; }
    if ((el = t.closest('[data-a="openbook"][data-id]')) && !el.hidden) { const tt = el.querySelector('b')?.textContent; if (tt) lembrar('livro', el.dataset.id, tt); }
    if ((el = t.closest('[data-auopen]'))) { const tt = el.querySelector('b, strong, h3')?.textContent || el.textContent; lembrar('aula', el.dataset.auopen, tt.trim()); }
  }, true);
  doc.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.m550-sanf > .sw9t')) { e.preventDefault(); alternaBloco(e.target.closest('.m550-sanf > .sw9t')); } });
  new MutationObserver(agenda).observe(doc.body, { childList: true, subtree: true });
  root.Melhorias550 = Object.freeze({ run, revisar });
  agenda();
})(window, document);
