/* v811 — Resultado da sessão e Plano × Execução.
   Funções puras: recebem registros já salvos e devolvem números e comparações.
   Nada é inventado: sem dado comparável, o item sai como "Dados insuficientes".
   Sem rede, sem timers, sem Supabase. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DiarioPlanoExecucao = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const num = (x) => {
    if (x == null || x === '') return null;
    const n = typeof x === 'number' ? x : Number(String(x).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const dataSaida = (t) => String(t.dtx || t.dt || '').slice(0, 10);
  const dataEntrada = (t) => String(t.dt || '').slice(0, 10);
  const fechada = (t) => num(t.exit) != null;
  const MOD = { D: 'dt', S: 'sw', O: 'op' };
  const NOME_MOD = { dt: 'Day trade', sw: 'Swing', op: 'Opções', ex: 'EUA/Forex' };
  function modalidade(t) {
    if (t.forex || /USD/i.test(String(t.moeda || ''))) return 'ex';
    return MOD[t.tipo] || MOD[t.tp] || '';
  }
  const brl = (n) => (n < 0 ? '−' : '') + 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vezes = (n) => (n < 0 ? '−' : n > 0 ? '+' : '') + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '× o risco';

  /* Resultado realizado do dia.
     - Conta pela data de SAÍDA (posição aberta ontem e encerrada hoje entra hoje).
     - Posição aberta (inclusive carregada de outro pregão ou reaberta) nunca entra como realizada.
     - Saídas parciais registradas como registros separados (ex.: importação do Profit) somam
       cada uma com sua própria quantidade.
     - Basta um registro encerrado sem P&L calculável para o total virar "insuficiente". */
  function resultadoSessao(trades, dia, deps) {
    const pl = deps && deps.pl;
    const lista = Array.isArray(trades) ? trades : [];
    const encerradas = lista.filter((t) => fechada(t) && dataSaida(t) === dia);
    const abertas = lista.filter((t) => !fechada(t));
    const abertasHoje = abertas.filter((t) => dataEntrada(t) === dia);
    const valores = encerradas.map((t) => ({ t, v: num(pl ? pl(t) : null) }));
    const validas = valores.filter((x) => x.v != null);
    const insuficiente = !encerradas.length || validas.length !== encerradas.length;
    const realizado = insuficiente ? null : Math.round(validas.reduce((s, x) => s + x.v, 0) * 100) / 100;
    const acertos = validas.filter((x) => x.v > 0).length;
    return {
      encerradas: encerradas.length,
      abertas: abertas.length,
      abertasHoje: abertasHoje.length,
      validas: validas.length,
      semResultado: encerradas.length - validas.length,
      realizado,
      acertos,
      taxa: insuficiente ? null : (100 * acertos) / validas.length,
      insuficiente,
      motivo: !encerradas.length ? 'Nenhuma operação encerrada nesta data.'
        : insuficiente ? (encerradas.length - validas.length) + ' operação(ões) encerrada(s) sem resultado calculável (preço ou valor por ponto inválido).'
        : '',
    };
  }

  /* Plano congelado na conclusão do preparo; se não existir, usa o plano atual e avisa. */
  function planoDoDia(dia) {
    const d = dia || {};
    if (d.planoSnap && typeof d.planoSnap === 'object') return { ...d.planoSnap, congelado: true };
    const p = d.pl2 || {};
    return { metaDia: d.metaDia, maxP: d.maxP, max: p.max, vies: p.vies, mods: p.mods || [], txt: p.txt, stopConfirmado: !!(d.cl && d.cl.p_stop), congelado: false };
  }

  function linha(item, planejado, executado, diferenca, evidencia, status) {
    return { item, planejado, executado, diferenca, evidencia, status };
  }

  /* Plano × Execução da sessão e de cada operação.
     status: 'ok' (seguiu o plano), 'desvio' (fugiu do plano), 'info' (sem regra), 'sem_dados'. */
  function compararPlano(diaRegistro, trades, dia, deps) {
    const pl = (deps && deps.pl) || (() => null);
    const risco = (deps && deps.risco) || (() => null);
    const plano = planoDoDia(diaRegistro);
    const lista = (Array.isArray(trades) ? trades : []).filter((t) => dataEntrada(t) === dia || (fechada(t) && dataSaida(t) === dia));
    const res = resultadoSessao(trades, dia, { pl });
    const sessao = [];
    const max = num(plano.max);
    sessao.push(max > 0
      ? linha('Quantidade de operações', 'até ' + max, String(lista.length), lista.length > max ? '+' + (lista.length - max) + ' acima do limite' : 'dentro do limite',
        lista.length + ' registro(s) com entrada ou saída em ' + dia.split('-').reverse().join('/'), lista.length > max ? 'desvio' : 'ok')
      : linha('Quantidade de operações', 'Sem limite definido', String(lista.length), '—', 'Defina "Máximo de trades" no preparo para comparar.', 'sem_dados'));
    const maxP = num(plano.maxP);
    if (!(maxP > 0)) sessao.push(linha('Perda máxima do dia', 'Sem limite definido', res.realizado == null ? 'Dados insuficientes' : brl(res.realizado), '—', 'Defina "Perda máxima" no preparo.', 'sem_dados'));
    else if (res.realizado == null) sessao.push(linha('Perda máxima do dia', brl(-maxP), 'Dados insuficientes', '—', res.motivo, 'sem_dados'));
    else sessao.push(linha('Perda máxima do dia', brl(-maxP), brl(res.realizado), res.realizado < -maxP ? 'ultrapassou em ' + brl(-maxP - res.realizado).replace('−', '') : 'dentro do limite',
      res.encerradas + ' operação(ões) encerrada(s)', res.realizado < -maxP ? 'desvio' : 'ok'));
    const meta = num(plano.metaDia);
    if (meta > 0 && res.realizado != null) sessao.push(linha('Meta do dia', brl(meta), brl(res.realizado), res.realizado >= meta ? 'atingida' : 'não atingida', 'Meta é referência, não obrigação de operar.', 'info'));
    const vies = String(plano.vies || '');
    if (vies === 'compra' || vies === 'venda') {
      const contra = lista.filter((t) => (vies === 'compra' ? t.side === 'V' : t.side === 'C'));
      sessao.push(linha('Viés do dia', vies === 'compra' ? 'Compra' : 'Venda', lista.length ? (lista.length - contra.length) + ' a favor · ' + contra.length + ' contra' : 'Nenhuma operação',
        contra.length ? contra.length + ' operação(ões) contra o viés' : 'alinhado', contra.map((t) => t.ativo || 'Ativo').join(', ') || '—', contra.length ? 'desvio' : 'ok'));
    } else sessao.push(linha('Viés do dia', vies === 'neutro' ? 'Neutro' : 'Não definido', '—', '—', vies === 'neutro' ? 'Viés neutro: sem comparação de direção.' : 'Defina o viés no preparo.', vies === 'neutro' ? 'info' : 'sem_dados'));
    const mods = Array.isArray(plano.mods) ? plano.mods : [];
    if (mods.length) {
      const fora = lista.filter((t) => { const m = modalidade(t); return m && !mods.includes(m); });
      sessao.push(linha('Foco operacional', mods.map((m) => NOME_MOD[m] || m).join(', '), lista.length ? lista.length - fora.length + ' no foco · ' + fora.length + ' fora' : 'Nenhuma operação',
        fora.length ? fora.length + ' fora do foco' : 'no foco', fora.map((t) => (t.ativo || 'Ativo') + ' (' + (NOME_MOD[modalidade(t)] || '?') + ')').join(', ') || '—', fora.length ? 'desvio' : 'ok'));
    }
    const semStop = lista.filter((t) => num(t.stop) == null);
    sessao.push(linha('Stop definido antes da entrada', plano.stopConfirmado ? 'Confirmado no preparo' : 'Não confirmado', lista.length ? (lista.length - semStop.length) + ' de ' + lista.length + ' com stop' : 'Nenhuma operação',
      semStop.length ? semStop.length + ' sem stop registrado' : 'todas com stop', semStop.map((t) => t.ativo || 'Ativo').join(', ') || '—', semStop.length ? 'desvio' : lista.length ? 'ok' : 'info'));

    const porTrade = lista.map((t) => {
      const linhas = [];
      const entrada = num(t.entry), stop = num(t.stop), alvo = num(t.target), saida = num(t.exit);
      const r = num(risco(t)), v = num(pl(t));
      const dir = t.side === 'C' ? 1 : -1;
      if (stop == null) linhas.push(linha('Stop', 'Não registrado', saida == null ? 'Aberta' : 'Saída ' + saida, '—', 'Sem stop não há risco planejado para comparar.', 'desvio'));
      else if (saida == null) linhas.push(linha('Stop', String(stop), 'Posição aberta', '—', 'Comparação só após a saída.', 'info'));
      else if (r > 0 && v != null) {
        const x = v / r;
        linhas.push(linha('Risco', brl(-r) + ' (stop ' + stop + ')', brl(v) + ' · ' + vezes(x), x < -1.05 ? 'perda maior que o risco planejado' : 'dentro do risco',
          'entrada ' + entrada + ' · saída ' + saida, x < -1.05 ? 'desvio' : 'ok'));
      } else linhas.push(linha('Risco', 'stop ' + stop, saida == null ? 'Aberta' : 'Dados insuficientes', '—', 'Quantidade, valor por ponto ou preço inválido.', 'sem_dados'));
      if (alvo != null && saida != null && entrada != null) {
        const atingiu = (saida - alvo) * dir >= 0;
        const parcial = !atingiu && (saida - entrada) * dir > 0;
        linhas.push(linha('Alvo', String(alvo), 'Saída ' + saida, atingiu ? 'alvo atingido' : parcial ? 'saída com lucro antes do alvo' : 'alvo não atingido',
          parcial ? 'Confira se a saída antecipada estava no plano.' : '—', atingiu ? 'ok' : parcial ? 'info' : 'info'));
      } else if (alvo == null) linhas.push(linha('Alvo', 'Não registrado', saida == null ? 'Aberta' : 'Saída ' + saida, '—', 'Registre o alvo para avaliar a execução.', 'sem_dados'));
      return { id: t.id || '', ativo: t.ativo || 'Ativo não informado', aberta: saida == null, setup: t.setup || '', linhas };
    });
    const desvios = sessao.filter((l) => l.status === 'desvio').length + porTrade.reduce((s, t) => s + t.linhas.filter((l) => l.status === 'desvio').length, 0);
    return { plano, resultado: res, sessao, porTrade, desvios, operacoes: lista.length };
  }

  return { resultadoSessao, compararPlano, planoDoDia, modalidade };
});
