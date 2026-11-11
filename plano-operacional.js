/* v545 — plano operacional distribuído no checklist do dia (antes/durante/depois) e em Regras;
   conflitos internos do diário resolvidos sem poluir a tela; botão das videoaulas com login claro. */
(function (root, doc) {
  'use strict';
  if (root.PlanoOperacional) return;
  const VER = 1;
  // [id, fase, categoria (0 plano, 1 risco, 2 rotina, 3 psicologia), texto]
  const RULES = [
    ['po-pre-stop', 'pre', 1, 'Stop diário de R$ 200 por contrato operado travado no Profit (Negociação → Gestão de Risco → Perda total na conta). Índice e dólar juntos somam no mesmo limite.'],
    ['po-pre-margem', 'pre', 1, 'Margem de R$ 1.000 por contrato (índice ou dólar) disponível para a mão de hoje.'],
    ['po-pre-agenda', 'pre', 0, 'Horários de notícia de hoje anotados: nesses momentos não opero.'],
    ['po-pre-acoes', 'pre', 0, 'Ações de peso no radar: ITUB4, PETR4, VALE3, AXIA3 e SBSP3, com o monitor de mercado aberto (Ferramentas → Monitor de mercado).'],
    ['po-pre-correl', 'pre', 0, 'Correlações do dólar no radar: DI31, DXY (dlindex) e petróleo (correlação inversa).'],
    ['po-pre-zonas', 'pre', 0, 'VWAP, média de 200 e Ajuste (PriorCote Ajuste) marcados no gráfico como zonas para evitar entrada.'],
    ['po-pre-tempos', 'pre', 0, 'Gráficos prontos: 1 min (ajuste fino), 2 min (confirmação de tendência ou reversão) e 5 min (visão geral).'],
    ['po-pre-offset', 'pre', 1, 'Offsets na boleta: índice 15 pontos; dólar 0,5 ponto na entrada e até 3 pontos no stop.'],
    ['po-dur-abertura', 'during', 2, 'Esperei 1 minuto após a abertura do à vista brasileiro e do americano.'],
    ['po-dur-noticia', 'during', 0, 'Não operei em horário de notícia.'],
    ['po-dur-10h', 'during', 0, 'Antes das 10h, só entrei em padrão clássico.'],
    ['po-dur-zonas', 'during', 0, 'Não entrei perto da VWAP, da média de 200 ou do Ajuste.'],
    ['po-dur-indice', 'during', 0, 'No índice, a entrada foi confirmada pelas ações de peso (prioridade: índice com o à vista aberto).'],
    ['po-dur-stop', 'during', 1, 'Stop definido antes de entrar: média 8/9 (vale stop cutucada), fixo (índice 300 pts / dólar 6 pts, conforme volatilidade) ou candle de gatilho / barra de ignição.'],
    ['po-dur-folga', 'during', 1, 'Stop em barra com folga, nunca exatamente no tick: índice 3 a 5 ticks além; dólar 1 tick.'],
    ['po-dur-parcial', 'during', 1, 'Primeira parcial de 30% no alvo (índice 200 pts / dólar 5 pts) e stop no zero a zero.'],
    ['po-dur-carregar', 'during', 1, 'Restante carregado: índice buscando mais 200 pts barra a barra; dólar pela média 8/9 ou barra a barra.'],
    ['po-pos-stop', 'post', 1, 'Fiquei dentro do stop diário de R$ 200 por contrato.'],
    ['po-pos-setup', 'post', 0, 'Cada trade registrado com o setup certo (Índice ou Dólar) e o checklist da operação marcado.'],
    ['po-pos-horarios', 'post', 2, 'Revisei os horários: 1 minuto após as aberturas, fora de notícia e só padrão clássico antes das 10h.'],
    ['po-pos-gestao', 'post', 1, 'Revisei a gestão: parcial de 30%, zero a zero e condução feitos como planejado.']
  ];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const has = () => { try { return typeof S !== 'undefined' && S && Array.isArray(S.rules); } catch { return false; } };

  function seed() {
    if (!has()) return 0;
    S.ax ??= {};
    if ((S.ax.planoOp || 0) >= VER) return 0;
    if (!S.ax.planoOpAceito) return 0; // v554: plano modelo só entra se o usuário escolher.
    const del = S.del || {}, now = Date.now(); let n = 0;
    for (const [id, phase, cat, t] of RULES) {
      if (del[id] || S.rules.some(r => r.id === id)) continue;
      S.rules.push({ id, cat, t, phase, u: now }); n++;
    }
    S.ax.planoOp = VER;
    if (n) { try { save(); } catch {} }
    return n;
  }

  const TABELA = [
    ['Stop diário', 'R$ 200 por contrato (soma índice + dólar), travado no Profit', 'idem'],
    ['Margem', 'R$ 1.000 por contrato', 'R$ 1.000 por contrato'],
    ['Stop', 'Média 8/9 (cutucada), 300 pts fixo ou candle de gatilho', '6 pts fixo, barra de ignição ou média 8/9'],
    ['Folga do stop em barra', '3 a 5 ticks', '1 tick'],
    ['1º alvo', '200 pts · parcial de 30%', '5 pts · parcial de 30%'],
    ['Depois do 1º alvo', 'Stop no zero a zero; +200 pts barra a barra', 'Stop no zero a zero; média 8/9 ou barra a barra'],
    ['Offset', '15 pts', 'Entrada 0,5 pt · stop até 3 pts'],
    ['Confirmação', 'ITUB4, PETR4, VALE3, AXIA3, SBSP3 + monitor', 'DI31, DXY e petróleo (inverso)']
  ];
  function regrasHtml() {
    return `<section class="card po-regras" aria-label="Parâmetros de operação"><h3>Parâmetros de operação</h3><p class="sm mut">Referência rápida. Valores ajustáveis conforme a volatilidade.</p><div class="po-tab" role="table"><div class="po-row po-head" role="row"><span role="columnheader"></span><span role="columnheader">Índice</span><span role="columnheader">Dólar</span></div>${TABELA.map(([k, a, b]) => `<div class="po-row" role="row"><b role="rowheader">${esc(k)}</b><span role="cell">${esc(a)}</span><span role="cell">${esc(b)}</span></div>`).join('')}</div><h4>Proibições</h4><ul class="po-lista"><li>Operar em horário de notícia.</li><li>Entrar no 1º minuto da abertura do à vista e do americano.</li><li>Entrar perto da VWAP, da média de 200 ou do Ajuste.</li><li>Antes das 10h, entrar fora de padrão clássico.</li><li>Stop exatamente no tick da barra.</li></ul><h4>Tempos gráficos</h4><ul class="po-lista"><li><b>1 min</b> ajuste fino da entrada.</li><li><b>2 min</b> confirmação de tendência ou reversão.</li><li><b>5 min</b> visão geral do movimento.</li></ul></section>`;
  }
  function ofertaHtml() {
    return `<section class="card po-oferta" aria-label="Plano modelo"><h3>Plano modelo para Índice e Dólar</h3><p class="sm mut">Adiciona ${RULES.length} itens ao checklist (antes, durante e depois do pregão), os setups de Índice e Dólar e um quadro de parâmetros. Você pode editar ou excluir depois.</p><button type="button" class="btn" data-po-aceitar>Adicionar plano modelo</button></section>`;
  }
  function installRegras() {
    if (typeof vRegras !== 'function' || vRegras.__po) return;
    const original = vRegras;
    vRegras = function () {
      const html = original.apply(this, arguments);
      try { const ok = (S.ax || {}).planoOp; return html.replace(/(<h1>Minhas regras<\/h1>)/, '$1' + (ok ? regrasHtml() : ofertaHtml())); } catch { return html; }
    };
    vRegras.__po = 1;
  }

  // Conflitos de sincronização: o app já aplica a versão mais recente; aqui só arquiva e limpa o aviso.
  function limparConflitos() {
    try {
      if (!root.DiarioDados || typeof S === 'undefined' || !S?.days) return 0;
      let n = 0; const arq = ((S.ax ??= {}).conflitosArq ??= []);
      for (const [date, day] of Object.entries(S.days)) {
        for (const c of (day?._conflicts || []).slice()) {
          const idx = (c.versions || []).length - 1; if (idx < 0) continue;
          const meta = (c.path || []).some(k => String(k).startsWith('_')) || ['at', 'u'].includes(String((c.path || []).at(-1)));
          if (!meta) arq.push({ date, path: c.path, versions: c.versions, em: Date.now() });
          if (root.DiarioDados.resolve(day, c.id, idx)) n++;
        }
      }
      while (arq.length > 50) arq.shift();
      if (n) { try { save(); } catch {} }
      return n;
    } catch { return 0; }
  }

  // Botão "Gerar videoaulas": sessão vencida vira botão de login; dados do curso carregam antes.
  async function gerarAulas(btn) {
    const st = doc.querySelector('#v512-ar-st'); if (!st) return;
    let sess = null; try { sess = SESS; } catch {}
    if (sess) { try { await tok(); sess = SESS; } catch { sess = null; } }
    if (!sess) {
      st.innerHTML = 'Sua sessão expirou neste aparelho. <button type="button" class="btn s" data-dt393-route="conta" data-po-login>Entrar na minha conta</button>';
      return;
    }
    if (!root.EST_DATA?.BIB_AR) {
      st.textContent = 'Carregando o conteúdo do curso…';
      await new Promise(ok => { const s = doc.createElement('script'); s.src = 'estudos.js?v=522'; s.onload = s.onerror = ok; doc.head.appendChild(s); });
      if (!root.EST_DATA?.BIB_AR) { st.textContent = 'Não consegui carregar o conteúdo do curso. Verifique a internet e toque de novo.'; return; }
    }
    btn.disabled = true;
    try { await root.DIARIO_V512.arGerar(st); } finally { btn.disabled = false; }
  }
  doc.addEventListener('click', event => {
    const btn = event.target.closest('#v512-ar .v512-go');
    if (btn && root.DIARIO_V512?.arGerar) { event.preventDefault(); event.stopImmediatePropagation(); gerarAulas(btn); return; }
    if (event.target.closest('[data-po-aceitar]')) { try { (S.ax ??= {}).planoOpAceito = 1; seed(); root.Projeto2027?.ensure(); save(); render(); } catch {} return; }
    if (event.target.closest('[data-po-login]')) { try { tab = 'conta'; render(); scrollTo(0, 0); } catch {} }
  }, true);

  function tick() { seed(); limparConflitos(); doc.querySelectorAll('.diary-conflicts').forEach(e => e.remove()); }
  installRegras();
  if (typeof render === 'function' && !render.__po) {
    const r = render;
    render = function () { try { tick(); } catch {} return r.apply(this, arguments); };
    render.__po = 1;
  }
  new MutationObserver(() => { const c = doc.querySelector('.diary-conflicts'); if (c) c.remove(); }).observe(doc.body, { childList: true, subtree: true });
  root.PlanoOperacional = Object.freeze({ RULES, seed, regrasHtml, limparConflitos });
  try { tick(); } catch {}
})(window, document);
