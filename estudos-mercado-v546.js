/* v546 — Estudos e Mercado mais simples: menos cabeçalho repetido, nomes claros, técnico recolhido. */
(function (root, doc) {
  'use strict';
  if (root.EstudosMercado546) return;
  const app = () => doc.querySelector('#app:not(.v503-fantasma)');
  const txt = (el, value) => { if (el && el.textContent !== value) el.textContent = value; };
  const getTab = () => { try { return tab; } catch { return ''; } };
  const getEsv = () => { try { return ESV; } catch { return ''; } };
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

  // Mercado abre em Cotações uma vez por sessão (depois respeita a última aba escolhida).
  try { if (!sessionStorage.getItem('m546-cq') && typeof MKT !== 'undefined' && MKT) { MKT.tab = 'cq'; sessionStorage.setItem('m546-cq', '1'); } } catch {}

  const NOMES = { 'Vídeos': 'Aulas', 'Vídeo aula': 'Aulas', 'Vídeo aulas': 'Aulas', 'Checklist de leitura': 'Plano de estudo' };
  const DUPLICADOS = new Set(['Biblioteca', 'Simulados', 'Simulado', 'Hoje', 'Ciclo', 'Ciclo de estudos']);

  function estudos(a) {
    const page = a.querySelector('.dt397-studies'); if (!page) return;
    const interno = page.classList.contains('dt-est-interno');
    // Nomes
    page.querySelectorAll('[data-dt397-view] , .dt397-native-mount > header h2').forEach(el => {
      const strong = el.querySelector('strong, b, h3') || (el.children.length ? null : el);
      const alvo = strong || el.querySelector('span');
      if (alvo && NOMES[norm(alvo.textContent)]) txt(alvo, NOMES[norm(alvo.textContent)]);
    });
    page.querySelectorAll('.dt397-library [data-dt397-view="pl"] p, .dt397-library [data-dt397-view="pl"] small').forEach(el => txt(el, 'Organize o que estudar em cada semana'));
    // Meta da semana: só em Hoje, fechada.
    const meta = page.querySelector('#v514-meta');
    if (meta) {
      const naHoje = getEsv() === 'est';
      if (meta.hidden === naHoje) meta.hidden = !naHoje;
    }
    // Segunda navegação: tira só o que repete as abas principais.
    page.querySelectorAll('.estchips button, .e2row button').forEach(b => {
      const dup = DUPLICADOS.has(norm(b.textContent).replace(/^[^\p{L}]+/u, ''));
      if (dup && !b.classList.contains('on') && !b.hidden) b.hidden = true;
    });
    if (interno && getEsv() === 'aul') aulas(page);
  }

  function aulas(page) {
    const nat = page.querySelector('.dt395-native-estudos'); if (!nat) return;
    const intro = nat.querySelector('.au-intro');
    if (intro) txt(intro, 'Aulas narradas dos seus livros, com vídeo e legenda.');
    const sync = nat.querySelector('#aulas-sync');
    const precisaLogin = sync && !sync.querySelector('[data-aulas-login]')?.hidden;
    // Um aviso de login só: se o aviso principal existe, o card de sincronização sai.
    const aviso = [...nat.querySelectorAll('.card.warn')].find(c => /Entre na sua conta/.test(c.textContent));
    if (sync) { const esconder = !!aviso && precisaLogin; if (sync.hidden !== esconder) sync.hidden = esconder; }
    // Cards de aula parada: título e texto curtos.
    nat.querySelectorAll('.au-stale').forEach(c => {
      c.querySelectorAll('p.sm.mut').forEach((p, i) => { if (i === 0) txt(p, p.textContent.replace(/ O roteiro pode ter sido interrompido\. Isso é diferente da geração de áudio ou vídeo pela ponte\./, '')); else if (/Para completar/.test(p.textContent)) txt(p, 'Continue no aparelho que começou ou crie em Nova aula os capítulos que faltam.'); });
    });
    // Itens técnicos vão para "Gerenciar aulas", no fim.
    let box = nat.querySelector(':scope details.e546-gerenciar');
    if (!box) { box = doc.createElement('details'); box.className = 'card e546-gerenciar'; box.innerHTML = '<summary>Gerenciar aulas</summary><div class="e546-corpo"></div>'; nat.append(box); }
    const corpo = box.querySelector('.e546-corpo');
    const mover = [];
        nat.querySelectorAll(':scope details').forEach(d => { if (d !== box && !box.contains(d) && /PDFs antigos|voz de narração|voz da narração/i.test(d.querySelector('summary')?.textContent || '')) mover.push(d); });
    const dash = nat.querySelector('.au-dashboard'); if (dash) dash.querySelectorAll('p').forEach(p => { if (!p.hidden) p.hidden = true; });
    for (const el of mover) if (el.parentElement !== corpo) corpo.append(el);
    box.hidden = !corpo.children.length;
    if (box.nextElementSibling) nat.append(box);
    // Busca de livros não pertence à tela de aulas.
    nat.querySelectorAll('.est-book-search, .est-book-list').forEach(el => { if (!el.hidden) el.hidden = true; });
  }

  function mercado(a) {
    const m = a.querySelector('.dt395-native-mercado') || a;
    m.querySelectorAll('.m403-primary-tabs button').forEach(b => { if (norm(b.textContent) === 'Cotações e Panorama') txt(b.querySelector('span') || b, 'Cotações'); });
    const box = m.querySelector('#cqbox'); if (!box) return;
    const work = box.querySelector('.m408-workspace');
    if (work) {
      let ref = work;
      for (const sel of ['details.simple-comparison', 'details.simple-market-sources']) {
        const d = box.querySelector(sel);
        if (d && d.previousElementSibling !== ref && d.parentElement === work.parentElement) ref.after(d);
        if (d && d.parentElement === work.parentElement) ref = d;
      }
    }
  }

  let q = false;
  function run() {
    q = false;
    const a = app(); if (!a) return;
    try { if (getTab() === 'estudos') estudos(a); } catch (e) { console.warn('v546 estudos', e); }
    try { if (getTab() === 'mercado' || a.querySelector('.dt395-native-mercado')) mercado(a); } catch (e) { console.warn('v546 mercado', e); }
  }
  const agenda = () => { if (!q) { q = true; requestAnimationFrame(run); } };
  new MutationObserver(agenda).observe(doc.body, { childList: true, subtree: true });
  root.EstudosMercado546 = Object.freeze({ run });
  agenda();
})(window, document);
