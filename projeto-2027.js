/* Setups de Índice e Dólar com checklist da operação (v545: nomes descritivos e guia do setup). */
(function (root, doc) {
  'use strict';
  const names = { indice: 'Índice · padrão clássico + ações de peso', dolar: 'Dólar · padrão clássico + correlações' };
  // Nomes usados até a v544: continuam reconhecidos e são migrados para os novos.
  const legacy = { 'Projeto Os 10% — 2027 · Índice': names.indice, 'Projeto Os 10% — 2027 · Dólar': names.dolar };
  const definitions = {
    [names.indice]: [
      'Entrada em padrão clássico (antes das 10h, só padrão clássico).',
      'Ações de peso confirmaram a direção: ITUB4, PETR4, VALE3, AXIA3 e SBSP3, conferidas no monitor de mercado.',
      'Esperei 1 minuto após a abertura do à vista e do americano e fiquei fora do horário de notícia.',
      'Entrada longe da VWAP, da média de 200 e do Ajuste.',
      'Confirmei no 2 min, ajustei no 1 min e olhei o 5 min para o contexto.',
      'Stop na média 8/9 (vale stop cutucada), fixo de 300 pontos conforme a volatilidade ou no candle de gatilho.',
      'Stop em barra com folga de 3 a 5 ticks, nunca exatamente no tick.',
      'Offset de 15 pontos na boleta.',
      'Primeira parcial de 30% da mão a 200 pontos da entrada (conforme a volatilidade).',
      'Depois da primeira parcial, stop fixo no zero a zero.',
      'Com mais lotes, carreguei buscando mais 200 pontos e protegi barra a barra.',
      'Respeitei o stop diário de R$ 200 por contrato.'
    ],
    [names.dolar]: [
      'Entrada em padrão clássico.',
      'Conferi as correlações: DI31, DXY (dlindex) e petróleo (correlação inversa).',
      'Esperei 1 minuto após a abertura do à vista e do americano e fiquei fora do horário de notícia.',
      'Entrada longe da VWAP, da média de 200 e do Ajuste.',
      'Stop fixo de 6 pontos conforme a volatilidade, na barra de ignição ou na média 8/9.',
      'Stop em barra com folga de 1 tick.',
      'Offset de 0,5 ponto na entrada e de até 3 pontos no stop.',
      'Primeira parcial de 30% da mão a 5 pontos.',
      'Depois da parcial, stop no zero a zero.',
      'Restante dividido e carregado pela média 8/9 ou barra a barra.',
      'Respeitei o stop diário de R$ 200 por contrato.'
    ]
  };
  // Guia curto mostrado na ficha quando o setup é escolhido.
  const guides = {
    [names.indice]: {
      quando: 'Padrão clássico no índice com o à vista aberto, confirmado pelas ações de peso (ITUB4, PETR4, VALE3, AXIA3, SBSP3) e pelo monitor de mercado. Antes das 10h, só padrão clássico.',
      linhas: [['Stop', 'Média 8/9 (cutucada), 300 pts fixo ou candle de gatilho · folga de 3 a 5 ticks'], ['1º alvo', '200 pts · parcial de 30%'], ['Depois', 'Stop no zero a zero; carregar +200 pts barra a barra'], ['Offset', '15 pts'], ['Evitar', 'Notícia, 1º minuto das aberturas, VWAP, MM200 e Ajuste']]
    },
    [names.dolar]: {
      quando: 'Padrão clássico no dólar com DI31, DXY (dlindex) e petróleo a favor. Petróleo tem correlação inversa.',
      linhas: [['Stop', '6 pts fixo, barra de ignição ou média 8/9 · folga de 1 tick'], ['1º alvo', '5 pts · parcial de 30%'], ['Depois', 'Stop no zero a zero; carregar pela média 8/9 ou barra a barra'], ['Offset', 'Entrada 0,5 pt · stop até 3 pts'], ['Evitar', 'Notícia, 1º minuto das aberturas, VWAP, MM200 e Ajuste']]
    }
  };
  // Listas gravadas pela v542 (se o usuário não editou, são trocadas pela versão nova).
  const oldDefaults = new Set(['Defini o stop diário de R$ 200 por contrato, somando índice e dólar, e travei a perda total no Profit (Negociação → Gestão de Risco).', 'Conferi o offset de 15 pontos.', 'Conferi offset de entrada de 0,5 ponto e offset de stop de até 3 pontos.']);
  const canon = name => legacy[name] || name;
  const isProject = name => Object.hasOwn(definitions, canon(name || ''));
  function ensure() {
    if (typeof S === 'undefined' || !S) return;
    const setups = (S.ax ??= {})['chk.setups'] ??= {};
    for (const [old, now] of Object.entries(legacy)) {
      if (Object.hasOwn(setups, old)) {
        const items = setups[old] || [];
        const untouched = items.some(item => oldDefaults.has(item));
        if (!Object.hasOwn(setups, now)) setups[now] = untouched ? definitions[now].slice() : items.slice();
        delete setups[old];
      }
    }
    for (const [name, items] of Object.entries(definitions)) {
      if (!Object.hasOwn(setups, name)) setups[name] = items.slice();
    }
    for (const trade of S.trades || []) {
      if (legacy[trade.setup]) trade.setup = legacy[trade.setup];
      if (trade.checklist2027 && legacy[trade.checklist2027.setup]) trade.checklist2027.setup = legacy[trade.checklist2027.setup];
    }
  }
  function snapshot(trade) {
    if (!trade || !isProject(trade.setup)) return;
    ensure();
    trade.setup = canon(trade.setup);
    trade.checklist2027 = { version: 2, setup: trade.setup, items: chkDe(trade.setup).slice() };
  }
  function guideHtml(name) {
    const g = guides[canon(name)];
    if (!g) return '';
    return `<details class="po-guia" open><summary>Como operar este setup</summary><p>${esc(g.quando)}</p><dl>${g.linhas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>`;
  }
  function install() {
    ensure();
    for (const name of Object.values(names)) if (!SETUPS_PADRAO.includes(name)) SETUPS_PADRAO.push(name);
    const original = sheet;
    sheet = function () {
      ensure();
      if (T?.chk) T.chk = { ...T.chk }; // Editar não altera as marcações salvas antes de Salvar.
      if (T && legacy[T.setup]) T.setup = legacy[T.setup];
      let html = original.apply(this, arguments);
      if (!T || !html.includes('name="setup"')) return html; // Mantém a etapa obrigatória das fotos.
      const selected = isProject(T.setup);
      html = html.replace(/(<label>Setup \/ estratégia<input[^>]*><\/label>)/, (label) => label + (selected ? `${guideHtml(T.setup)}<label>Padrão clássico / gatilho da entrada<input name="project2027Pattern" value="${esc(T.project2027Pattern || '')}" placeholder="Ex.: rompimento, pullback, topo duplo" maxlength="240"></label><p class="sm mut">Marque o que cumpriu nesta operação. Os valores mudam conforme a volatilidade.</p>` : ''));
      return html;
    };
    const originalRender = render;
    render = function () { ensure(); return originalRender.apply(this, arguments); };
  }
  function reset(next) {
    if (!T || canon(T.setup) === canon(next) || !(isProject(T.setup) || isProject(next))) return;
    T.chk = {}; delete T.checklist2027; T.project2027Pattern = '';
  }
  doc.addEventListener('input', event => {
    if (event.target.matches('#sh input[name="setup"]')) reset(event.target.value);
  }, true);
  doc.addEventListener('click', event => {
    const pick = event.target.closest('#sh [data-setup-pick]');
    if (pick) reset(pick.dataset.setupPick);
    if (event.target.closest('#sh [data-a="savetrade"]') && typeof T !== 'undefined') snapshot(T);
  }, true);
  root.Projeto2027 = Object.freeze({ names: Object.freeze(names), legacy: Object.freeze(legacy), guides, ensure, guideHtml });
  install();
})(window, document);
