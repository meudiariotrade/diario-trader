/* v554 — repaginada pelas 8 regras de interface:
   consistência (GANHO/PERDA, "Resultado do dia"), feedback, fechamento (trava não bloqueia o 1º trade),
   prevenção de erros (confirma descartar trade), desfazer (regra excluída), controle (avisos no lugar certo),
   memória (checklist só do pré-mercado na trava) e aba "Desempenho" na planilha. */
(function (root, doc) {
  'use strict';
  if (root.Ajustes554) return;
  const $ = (s, el = doc) => el.querySelector(s);
  const g = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch { return d; } };
  const salvar = () => { try { save(); } catch {} };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Regra 4/8 — trava: o checklist exigido é o do pré-mercado; sem nenhum trade ainda, não trava o primeiro registro. */
  if (typeof travaEstado === 'function' && !travaEstado.__v554) {
    const orig = travaEstado;
    travaEstado = function () {
      const r = orig.apply(this, arguments);
      try {
        const i = (r.resolver || []).findIndex(x => x.id === 'chk');
        if (i >= 0) {
          const semTrades = !(S.trades || []).length;
          const pre = (S.rules || []).filter(x => !x.phase || x.phase === 'pre');
          const dia = (S.days || {})[g(() => pHoje().td, '')] || {}, chk = dia.chk || {};
          const feitos = pre.filter(x => chk[x.id]).length;
          if (semTrades || !pre.length || feitos >= pre.length) r.resolver.splice(i, 1);
          else r.resolver[i] = { ...r.resolver[i], txt: `checklist do pré-mercado ${feitos}/${pre.length}`, acao: 'Marque os itens de Pré-mercado em Meu dia.' };
          r.travado = !!((r.duro || []).length || r.resolver.length || r.pausaAte);
        }
      } catch {}
      return r;
    };
    travaEstado.__v554 = 1;
  }

  /* Regra 1 — mesmo vocabulário: GANHO / PERDA no lugar de WIN / LOSS. */
  if (typeof trBadge === 'function' && !trBadge.__v554) {
    const ob = trBadge;
    trBadge = function () { return String(ob.apply(this, arguments)).replace('>WIN<', '>GANHO<').replace('>LOSS<', '>PERDA<'); };
    trBadge.__v554 = 1;
  }

  /* Regra 7 — demonstração não bloqueia "Novo trade" por falta de foto nos trades de exemplo. */
  function demoSemTrava() {
    const v = root.DIARIO_V506; if (!root.DIARIO_DEMO || !v || typeof v.diaInfo !== 'function' || v.diaInfo.__v554) return;
    const o = v.diaInfo; const w = function () { const r = o.apply(this, arguments); return r ? { ...r, semFoto: 0 } : r; }; w.__v554 = 1;
    try { v.diaInfo = w; } catch {}
  }

  /* Regra 6 — desfazer exclusão de regra. */
  let desfazRegra = null, timer = 0;
  function barraDesfazer(txt) {
    let bar = $('#v554-undo');
    if (!bar) { bar = doc.createElement('div'); bar.id = 'v554-undo'; bar.setAttribute('role', 'status'); doc.body.append(bar); }
    bar.innerHTML = `<span>${esc(txt)}</span><button type="button" data-v554-undo>Desfazer</button>`;
    bar.hidden = false; clearTimeout(timer); timer = setTimeout(() => { bar.hidden = true; desfazRegra = null; }, 7000);
  }

  /* Regra 5 — fechar o formulário de trade com dados digitados pede confirmação. */
  let mexeu = false;
  doc.addEventListener('input', e => { if (e.target.closest?.('#sh')) mexeu = true; }, true);

  doc.addEventListener('click', e => {
    const t = e.target;
    const del = t.closest('[data-a="delrule"][data-id]');
    if (del) {
      const id = del.dataset.id, lista = g(() => S.rules, []), idx = lista.findIndex(r => r.id === id);
      if (idx >= 0) { desfazRegra = { r: { ...lista[idx] }, idx }; setTimeout(() => barraDesfazer('Regra excluída.'), 0); }
      return;
    }
    if (t.closest('[data-v554-undo]') && desfazRegra) {
      const { r, idx } = desfazRegra; desfazRegra = null;
      try { if (!S.rules.some(x => x.id === r.id)) S.rules.splice(Math.min(idx, S.rules.length), 0, r); if (S.del) delete S.del[r.id]; salvar(); render(); } catch {}
      const bar = $('#v554-undo'); if (bar) bar.hidden = true; return;
    }
    const fechar = t.closest('#sh [data-a="close"], #sh .fx');
    if (fechar && mexeu && $('#sh [data-a="savetrade"]')) {
      if (!root.confirm('Descartar o que você digitou neste trade?')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      mexeu = false; return;
    }
    if (t.closest('#sh [data-a="savetrade"]')) mexeu = false;
    if (t.closest('[data-a="new"], [data-a="edit"], [data-dt393-action="newtrade"]')) mexeu = false;
  }, true);

  /* Regra 2 — Esc fecha a ficha aberta no PC. */
  doc.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const sh = $('#sh'); if (!sh || sh.hidden || !sh.offsetParent && getComputedStyle(sh).position !== 'fixed') return;
    const b = $('#sh [data-a="close"], #sh .fx, #sh [aria-label="Fechar"]'); if (b && b.offsetParent !== null) { b.click(); }
  });

  /* Textos e acessibilidade a cada render. */
  function ajustes() {
    const a = $('#app:not(.v503-fantasma)'); if (!a) return;
    a.querySelectorAll('[data-a="delrule"]').forEach(b => { if (b.getAttribute('aria-label') !== 'Excluir regra') { b.setAttribute('aria-label', 'Excluir regra'); b.title = 'Excluir regra'; } });
    a.querySelectorAll('.v4-kpis small, .kpi small, small').forEach(s => { if (s.textContent === 'P&L do dia') s.textContent = 'Resultado do dia'; });
    const t = g(() => tab, '');
    doc.body.classList.toggle('v554-pausa-fora', !['home', 'ops', 'dia', 'trades'].includes(t));
    // (demonstração mantém a exigência de foto: é o que mostra o recurso)
    // Setup pessoal não aparece como sugestão para contas novas.
    try { const x = 'Setup Michael Jackson', i = SETUPS_PADRAO.indexOf(x); if (i >= 0 && !(S.ax || {}).planoOp && !(S.trades || []).some(t => t.setup === x)) SETUPS_PADRAO.splice(i, 1); } catch {}
  }
  let q = false;
  new MutationObserver(() => { if (!q) { q = true; requestAnimationFrame(() => { q = false; ajustes(); }); } }).observe(doc.body, { childList: true, subtree: true });

  /* Planilha — aba "Desempenho". */
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const F = { money: '"R$" #,##0.00;-"R$" #,##0.00', vez: '+0.00"×";-0.00"×";0.00"×"', pct: '0%', int: '0', dec: '0.00' };
  function desempenho(trades) {
    const lin = (trades || []).map(t => ({ t, c: g(() => calc(t), {}) || {} })).filter(x => typeof x.c.pl === 'number' && isFinite(x.c.pl))
      .sort((a, b) => String(a.t.dt).localeCompare(String(b.t.dt)));
    if (!lin.length) return null;
    const pl = lin.map(x => x.c.pl), rs = lin.map(x => x.c.r).filter(v => typeof v === 'number' && isFinite(v));
    const gan = pl.filter(v => v > 0), per = pl.filter(v => v < 0);
    const soma = a => a.reduce((s, v) => s + v, 0), media = a => a.length ? soma(a) / a.length : null;
    let pico = 0, acc = 0, dd = 0, seqG = 0, seqP = 0, curG = 0, curP = 0;
    for (const v of pl) { acc += v; pico = Math.max(pico, acc); dd = Math.min(dd, acc - pico); if (v > 0) { curG++; curP = 0; } else if (v < 0) { curP++; curG = 0; } else { curG = curP = 0; } seqG = Math.max(seqG, curG); seqP = Math.max(seqP, curP); }
    const mg = media(gan), mp = media(per);
    const rows = [], H = {};
    const add = (cells, h) => { if (h) H[rows.length] = h; rows.push(cells); };
    add([{ v: 'Desempenho', s: 't' }], 26);
    add([{ v: `${lin.length} trades encerrados no período. × risco: +1,00× = ganhou o mesmo que arriscou.`, s: 'nota' }]);
    add(null);
    add([{ v: 'Visão geral', s: 'h' }, { v: '', s: 'h' }]);
    const kv = (k, v, fmt, s) => add([{ v: k }, v == null ? { v: '—', s: 'vz' } : { v, fmt, s: s || (typeof v === 'number' ? (v > 0 ? 'ok' : v < 0 ? 'ruim' : 'n') : 'n') }]);
    kv('Resultado total', soma(pl), F.money);
    kv('Trades', lin.length, F.int, 'n');
    kv('Taxa de acerto', gan.length / lin.length, F.pct, 'n');
    kv('Ganho médio', mg, F.money);
    kv('Perda média', mp, F.money);
    kv('Payoff (ganho médio ÷ perda média)', mg != null && mp ? Math.abs(mg / mp) : null, F.dec, 'n');
    kv('Expectativa por trade (× risco)', media(rs), F.vez);
    kv('Maior sequência de ganhos', seqG, F.int, 'n');
    kv('Maior sequência de perdas', seqP, F.int, 'n');
    kv('Maior rebaixamento (R$)', dd, F.money);
    add(null);
    const grupo = (titulo, chave) => {
      const m = new Map();
      for (const x of lin) { const k = chave(x) || '—'; const o = m.get(k) || { n: 0, w: 0, pl: 0, r: [] }; o.n++; if (x.c.pl > 0) o.w++; o.pl += x.c.pl; if (typeof x.c.r === 'number' && isFinite(x.c.r)) o.r.push(x.c.r); m.set(k, o); }
      add([{ v: titulo, s: 'h' }, { v: 'Trades', s: 'h' }, { v: 'Acerto', s: 'h' }, { v: 'Resultado', s: 'h' }, { v: 'Média × risco', s: 'h' }]);
      [...m.entries()].sort((a, b) => b[1].pl - a[1].pl).forEach(([k, o]) => add([{ v: k }, { v: o.n, fmt: F.int }, { v: o.w / o.n, fmt: F.pct }, { v: o.pl, fmt: F.money, s: o.pl > 0 ? 'ok' : o.pl < 0 ? 'ruim' : 'n' }, o.r.length ? { v: media(o.r), fmt: F.vez, s: media(o.r) > 0 ? 'ok' : media(o.r) < 0 ? 'ruim' : 'n' } : { v: '—', s: 'vz' }]));
      add(null);
    };
    grupo('Por setup', x => x.t.setup);
    grupo('Por ativo', x => String(x.t.ativo || '').toUpperCase());
    /* v592 — dias da semana: onde opero mais/menos e onde ganho/perco mais. */
    {
      const dw = x => new Date(String(x.t.dt).slice(0, 10) + 'T12:00').getDay();
      const ds = [1, 2, 3, 4, 5].concat([6, 0].filter(d => lin.some(x => dw(x) === d)));
      const tab = ds.map(d => { const l = lin.filter(x => dw(x) === d); const g = l.filter(x => x.c.pl > 0), p = l.filter(x => x.c.pl < 0); return { d, n: l.length, w: g.length, gan: soma(g.map(x => x.c.pl)), per: soma(p.map(x => x.c.pl)), pl: soma(l.map(x => x.c.pl)) }; });
      add([{ v: 'Por dia da semana', s: 'h' }, { v: 'Trades', s: 'h' }, { v: 'Acerto', s: 'h' }, { v: 'Ganhos', s: 'h' }, { v: 'Perdas', s: 'h' }, { v: 'Resultado', s: 'h' }]);
      const cor = v => v > 0 ? 'ok' : v < 0 ? 'ruim' : 'n';
      tab.forEach(o => add([{ v: DIAS[o.d] }, { v: o.n, fmt: F.int }, o.n ? { v: o.w / o.n, fmt: F.pct } : { v: '—', s: 'vz' }, { v: o.gan, fmt: F.money, s: cor(o.gan) }, { v: o.per, fmt: F.money, s: cor(o.per) }, { v: o.pl, fmt: F.money, s: cor(o.pl) }]));
      add(null);
      const com = tab.filter(o => o.n);
      const nomes = l => l.map(o => DIAS[o.d]).join(', ');
      const ext = (l, f, maior) => { if (!l.length) return []; const alvo = maior ? Math.max(...l.map(f)) : Math.min(...l.map(f)); return l.filter(o => f(o) === alvo); };
      const mais = ext(tab, o => o.n, true), menos = ext(tab, o => o.n, false);
      const ganha = ext(com.filter(o => o.pl > 0), o => o.pl, true), perde = ext(com.filter(o => o.pl < 0), o => o.pl, false);
      add([{ v: 'Resumo por dia da semana', s: 'h' }, { v: '', s: 'h' }, { v: '', s: 'h' }]);
      const linha = (k, l, txt, s) => add([{ v: k }, l.length ? { v: nomes(l), s: s || 'n' } : { v: '—', s: 'vz' }, l.length ? { v: txt(l[0]), s: s || 'n' } : { v: '', s: 'vz' }]);
      linha('Dia em que mais opero', mais, o => o.n + (o.n === 1 ? ' trade' : ' trades'));
      linha('Dia em que menos opero', menos, o => o.n + (o.n === 1 ? ' trade' : ' trades'));
      linha('Dia em que mais ganho', ganha, o => o.pl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'ok');
      linha('Dia em que mais perco', perde, o => o.pl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'ruim');
      add(null);
    }
    grupo('Por horário', x => { const h = String(x.t.dt).slice(11, 13); return h ? h + 'h' : ''; });
    return { nome: 'Desempenho', rows, larg: [300, 90, 90, 130, 130, 130], semGrade: 1, alturas: H };
  }
  root.DIARIO_V554_DESEMP = desempenho;
  root.Ajustes554 = Object.freeze({ desempenho });
  ajustes();
})(window, document);
