const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../src/operations/plano-execucao.js');

/* P&L de referência: (saída − entrada) × direção × qtd × valor por ponto − custo. */
const pl = (t) => {
  const e = Number(t.entry), x = Number(t.exit);
  if (t.exit == null || t.exit === '' || !Number.isFinite(e) || !Number.isFinite(x) || t.invalido) return null;
  return (x - e) * (t.side === 'C' ? 1 : -1) * t.qty * (t.pv || 1) - (t.cost || 0);
};
const risco = (t) => (t.stop == null ? null : Math.abs(t.entry - t.stop) * t.qty * (t.pv || 1));
const DIA = '2026-11-23';

test('P0-01: parciais importadas somam cada uma com sua quantidade', () => {
  const trades = [
    { id: 'p1', ativo: 'WINZ26', side: 'C', entry: 130000, exit: 130200, qty: 2, pv: 0.2, dt: DIA + 'T09:10', dtx: DIA + 'T09:30' },
    { id: 'p2', ativo: 'WINZ26', side: 'C', entry: 130000, exit: 130400, qty: 1, pv: 0.2, dt: DIA + 'T09:10', dtx: DIA + 'T10:05' },
  ];
  const r = api.resultadoSessao(trades, DIA, { pl });
  assert.equal(r.encerradas, 2);
  assert.equal(r.realizado, 2 * 200 * 0.2 + 400 * 0.2); // 80 + 80
  assert.equal(r.taxa, 100);
});

test('P0-01: posição carregada conta na data da SAÍDA; aberta e reaberta não viram realizado', () => {
  const trades = [
    { id: 'c', ativo: 'PETR4', side: 'C', entry: 30, exit: 31, qty: 100, dt: '2026-11-19T15:00', dtx: DIA + 'T11:00' },
    { id: 'a', ativo: 'VALE3', side: 'C', entry: 60, exit: '', qty: 100, dt: '2026-11-19T10:00' },
    { id: 'r', ativo: 'ITUB4', side: 'V', entry: 35, exit: null, qty: 100, dt: DIA + 'T10:00', dtx: '' },
  ];
  const r = api.resultadoSessao(trades, DIA, { pl });
  assert.equal(r.encerradas, 1);
  assert.equal(r.realizado, 100);
  assert.equal(r.abertas, 2);
  assert.equal(r.abertasHoje, 1);
  const ontem = api.resultadoSessao(trades, '2026-11-19', { pl });
  assert.equal(ontem.encerradas, 0);
  assert.equal(ontem.realizado, null);
});

test('P0-01: um encerrado sem P&L calculável torna o total insuficiente (sem número inventado)', () => {
  const trades = [
    { id: 'ok', ativo: 'PETR4', side: 'C', entry: 30, exit: 31, qty: 100, dt: DIA, dtx: DIA },
    { id: 'x', ativo: 'WINZ26', side: 'C', entry: 130000, exit: 130100, qty: 1, pv: 1, invalido: true, dt: DIA, dtx: DIA },
  ];
  const r = api.resultadoSessao(trades, DIA, { pl });
  assert.equal(r.insuficiente, true);
  assert.equal(r.realizado, null);
  assert.equal(r.taxa, null);
  assert.match(r.motivo, /sem resultado calculável/);
});

test('P0-02: plano congelado × execução — limite de trades, perda máxima, viés, foco e stop', () => {
  const dia = {
    metaDia: 300, maxP: 200, pl2: { max: 9 },
    planoSnap: { em: '2026-11-23T08:40:00-03:00', metaDia: 300, maxP: 200, max: 2, vies: 'compra', mods: ['dt'], stopConfirmado: true },
  };
  const trades = [
    { id: 't1', ativo: 'WINZ26', tipo: 'D', side: 'C', entry: 130000, stop: 129800, target: 130400, exit: 130400, qty: 2, pv: 0.2, dt: DIA, dtx: DIA },
    { id: 't2', ativo: 'WINZ26', tipo: 'D', side: 'V', entry: 130500, stop: 130600, exit: 131900, qty: 2, pv: 0.2, dt: DIA, dtx: DIA },
    { id: 't3', ativo: 'PETR4', tipo: 'S', side: 'C', entry: 30, exit: 29.8, qty: 100, dt: DIA, dtx: DIA },
  ];
  const c = api.compararPlano(dia, trades, DIA, { pl, risco });
  assert.equal(c.plano.congelado, true, 'usa o plano congelado, não o editado depois (max 9)');
  const item = (n) => c.sessao.find((l) => l.item === n);
  assert.equal(item('Quantidade de operações').status, 'desvio');
  assert.match(item('Quantidade de operações').diferenca, /\+1 acima/);
  // 160 − 560 − 20 = −420 < −200
  assert.equal(c.resultado.realizado, -420);
  assert.equal(item('Perda máxima do dia').status, 'desvio');
  assert.equal(item('Viés do dia').status, 'desvio');
  assert.match(item('Viés do dia').evidencia, /WINZ26/);
  assert.equal(item('Foco operacional').status, 'desvio');
  assert.match(item('Foco operacional').evidencia, /PETR4 \(Swing\)/);
  assert.equal(item('Stop definido antes da entrada').status, 'desvio');
  const t1 = c.porTrade.find((t) => t.id === 't1');
  assert.equal(t1.linhas.find((l) => l.item === 'Risco').status, 'ok');
  assert.equal(t1.linhas.find((l) => l.item === 'Alvo').diferenca, 'alvo atingido');
  const t2 = c.porTrade.find((t) => t.id === 't2');
  const r2 = t2.linhas.find((l) => l.item === 'Risco');
  assert.equal(r2.status, 'desvio');
  assert.match(r2.executado, /× o risco/);
  assert.doesNotMatch(JSON.stringify(c), /\b\d+R\b/, 'sem notação R');
  assert.ok(c.desvios >= 6);
});

test('P0-02: sem plano nem operações, nada é inventado', () => {
  const c = api.compararPlano({}, [], DIA, { pl, risco });
  assert.equal(c.plano.congelado, false);
  assert.equal(c.operacoes, 0);
  assert.ok(c.sessao.every((l) => ['sem_dados', 'info'].includes(l.status)));
  assert.equal(c.sessao.find((l) => l.item === 'Perda máxima do dia').executado, 'Dados insuficientes');
});
