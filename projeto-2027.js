/* Checklist fornecido pelo usuário: CHECK-LIST PROJETO OS 10% - 2027. */
(function (root, doc) {
  'use strict';
  const common = [
    'Defini o stop diário de R$ 200 por contrato, somando índice e dólar, e travei a perda total no Profit (Negociação → Gestão de Risco).',
    'Evitei horário de notícia e aguardei pelo menos 1 minuto após as aberturas do à-vista brasileiro e americano.',
    'Conferi os tempos gráficos: 1 minuto para ajuste fino, 2 minutos para confirmação e 5 minutos para o contexto.',
    'Evitei entrada próxima à VWAP, à média de 200 e ao Ajuste (PriorCote Ajuste).',
    'Conferi a margem indicada no plano: R$ 1.000 por contrato, de índice ou dólar.'
  ];
  const names = { indice: 'Projeto Os 10% — 2027 · Índice', dolar: 'Projeto Os 10% — 2027 · Dólar' };
  const definitions = {
    [names.indice]: [...common,
      'Minha entrada seguiu um padrão clássico e foi validada pelas ações de peso: ITUB4, PETR4, VALE3, AXIA3 e SBSP3; conferi o monitor de mercado.',
      'Antes das 10h, operei apenas padrão clássico. Considerei a preferência do plano por índice com o mercado à vista aberto e correlação com as ações.',
      'Defini o stop pela média de 8/9 (inclusive cutucada), por 300 pontos conforme a volatilidade, ou pelo candle de gatilho; a regra vale para qualquer tempo gráfico.',
      'Planejei o primeiro alvo a 200 pontos da entrada, conforme a volatilidade, e stop fixo no zero a zero após a primeira parcial.',
      'Planejei parciais de 30% da mão, conforme os lotes; com mais lotes, busquei etapas de 200 pontos, protegendo no barra a barra.',
      'Conferi o offset de 15 pontos.',
      'Se usei stop em candle, deixei folga de 3 a 5 ticks, sem colocar o stop exatamente na extremidade ou a apenas 1 tick.'
    ],
    [names.dolar]: [...common,
      'Minha entrada seguiu um padrão clássico; conferi DI31, DXY (dlindex) e petróleo como correlações, sendo o petróleo inverso conforme o plano.',
      'Defini o stop em 6 pontos conforme a volatilidade, na barra de ignição ou na média de 8/9.',
      'Planejei a primeira parcial em 5 pontos e depois stop fixo no zero a zero; condução pela média de 8/9 ou barra a barra.',
      'Planejei a primeira parcial com 30% da mão e a divisão do restante para tentar carregar o trade.',
      'Conferi offset de entrada de 0,5 ponto e offset de stop de até 3 pontos.',
      'Se usei stop em candle, deixei folga de 1 tick.'
    ]
  };
  const isProject = name => Object.hasOwn(definitions, name || '');
  function ensure() {
    if (typeof S === 'undefined' || !S) return;
    const setups = (S.ax ??= {})['chk.setups'] ??= {};
    for (const [name, items] of Object.entries(definitions)) {
      if (!Object.hasOwn(setups, name)) setups[name] = items.slice();
    }
  }
  function snapshot(trade) {
    if (!trade || !isProject(trade.setup)) return;
    ensure();
    trade.checklist2027 = { version: 1, setup: trade.setup, items: chkDe(trade.setup).slice() };
  }
  function install() {
    ensure();
    for (const name of Object.values(names)) if (!SETUPS_PADRAO.includes(name)) SETUPS_PADRAO.push(name);
    const original = sheet;
    sheet = function () {
      ensure();
      if (T?.chk) T.chk = { ...T.chk }; // Editar não altera as marcações salvas antes de Salvar.
      let html = original.apply(this, arguments);
      if (!T || !html.includes('name="setup"')) return html; // Mantém a etapa obrigatória das fotos.
      const selected = isProject(T.setup);
      html = html.replace(/(<label>Setup \/ estratégia<input[^>]*><\/label>)/, (label) => label + (selected ? `<label>Padrão clássico / gatilho da entrada<input name="project2027Pattern" value="${esc(T.project2027Pattern || '')}" placeholder="Descreva o padrão que você operou" maxlength="240"></label><p class="sm mut">Checklist do seu documento de 2027. Marque o que cumpriu; os valores são referências do plano, com os ajustes de volatilidade indicados nele. A trava de risco é configurada no Profit.</p>` : ''));
      return html;
    };
    const originalRender = render;
    render = function () { ensure(); return originalRender.apply(this, arguments); };
  }
  function reset(next) {
    if (!T || T.setup === next || !(isProject(T.setup) || isProject(next))) return;
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
  root.Projeto2027 = Object.freeze({ names: Object.freeze(names), ensure });
  install();
})(window, document);
