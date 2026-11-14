// v621: valuation (Graham, Bazin, DCF), adaptação para ETFs e relatório em Markdown montado pelo código.
// Todos os números do relatório vêm daqui; a IA só escreve a leitura analítica por cima destes dados.
// deno-lint-ignore-file
const ok = (v: any) => typeof v === 'number' && Number.isFinite(v);
export const fmt = (v: any, d = 2) => (ok(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'n/d');
export const pct = (v: any, d = 1) => (ok(v) ? fmt(v * 100, d) + '%' : 'n/d');
const pp = (v: any, d = 2) => (ok(v) ? (v > 0 ? '+' : '') + fmt(v, d) + '%' : 'n/d');
export const din = (v: any, moeda: string) => (ok(v) ? (moeda === 'USD' ? 'US$ ' : moeda === 'BRL' ? 'R$ ' : moeda + ' ') + fmt(v) : 'n/d');
const grande = (v: any, moeda: string) => {
  if (!ok(v)) return 'n/d';
  const a = Math.abs(v), [d, s] = a >= 1e12 ? [1e12, ' tri'] : a >= 1e9 ? [1e9, ' bi'] : a >= 1e6 ? [1e6, ' mi'] : [1, ''];
  return (moeda === 'USD' ? 'US$ ' : 'R$ ') + fmt(v / d, 2) + s;
};
const dm = (d: any) => (d ? String(d).slice(8, 10) + '/' + String(d).slice(5, 7) + '/' + String(d).slice(0, 4) : 'n/d');

/** Premissas padrão do app quando o usuário não preenche as Premissas de DCF. */
export const premissasPadrao = (mercado: string) => (mercado === 'B3' ? { wacc: 0.14, crescimento: 0.05, perpetuidade: 0.04, anos: 5 } : { wacc: 0.09, crescimento: 0.06, perpetuidade: 0.025, anos: 5 });

export function valuation(f: any, premissas: any) {
  if (!f || f.etf) return null;
  const moeda = f.moeda, px = f.preco, financeiro = /financial|bank|banco|seguro|insurance/i.test(String(f.setor || '') + ' ' + String(f.industria || ''));
  const graham = ok(f.lpa) && ok(f.vpa) && f.lpa > 0 && f.vpa > 0 ? Math.sqrt(22.5 * f.lpa * f.vpa) : null;
  const div12 = ok(f.dividendos_12m) ? f.dividendos_12m : ok(f.dy) && ok(px) ? f.dy * px : null;
  const bazin = ok(div12) && div12 > 0 ? div12 / 0.06 : null;
  const P = premissas && Object.keys(premissas).length ? { ...premissas, origem: 'suas premissas' } : { ...premissasPadrao(f.mercado), origem: 'premissas padrão do app' };
  let dcf: any = null, dcfMotivo = '';
  const moedaBal = f.moeda_balanco && f.moeda_balanco !== moeda ? f.moeda_balanco : null;
  if (financeiro) dcfMotivo = 'Instituição financeira: fluxo de caixa livre não se aplica; use P/VP, ROE e dividendos.';
  else if (moedaBal) dcfMotivo = `Balanço em ${moedaBal} e cotação em ${moeda}: DCF não calculado para não misturar moedas.`;
  else if (!(ok(f.fcl) && f.fcl > 0)) dcfMotivo = 'Fluxo de caixa livre (12 meses) ausente ou negativo.';
  else if (!(ok(f.acoes) && f.acoes > 0)) dcfMotivo = 'Número de ações ausente.';
  else if (!(P.wacc > P.perpetuidade)) dcfMotivo = 'WACC precisa ser maior que o crescimento na perpetuidade.';
  else {
    let pv = 0, fl = f.fcl;
    for (let i = 1; i <= P.anos; i++) { fl *= 1 + P.crescimento; pv += fl / (1 + P.wacc) ** i; }
    const term = (fl * (1 + P.perpetuidade)) / (P.wacc - P.perpetuidade) / (1 + P.wacc) ** P.anos, ev = pv + term,
      liq = (ok(f.divida_total) ? f.divida_total : 0) - (ok(f.caixa) ? f.caixa : 0), preco = (ev - liq) / f.acoes;
    dcf = { preco, ev, divida_liquida: liq, fcl: f.fcl };
  }
  const margem = (v: any) => (ok(v) && v > 0 ? (v - px) / v : null);
  return { moeda, preco: px, graham, bazin, div12, dcf, dcfMotivo, premissas: P, margens: { graham: margem(graham), bazin: margem(bazin), dcf: margem(dcf?.preco) }, financeiro };
}

/** Evolução dos últimos trimestres (receita e lucro) com variação trimestre a trimestre e ano a ano. */
export function trimestres(f: any) {
  const R = f?.trimestral?.totalRevenue || [], L = f?.trimestral?.netIncome || [];
  const datas = [...new Set([...R, ...L].map((x: any) => x.data))].sort().slice(-5);
  const v = (s: any[], d: string) => s.find((x: any) => x.data === d)?.valor ?? null;
  return datas.map((d, i) => ({ data: d, receita: v(R, d), lucro: v(L, d), qoq: i > 0 && v(L, d) != null && v(L, datas[i - 1]) ? (v(L, d) / Math.abs(v(L, datas[i - 1])) - 1) * 100 * Math.sign(v(L, datas[i - 1])) : null, yoy: i >= 4 && v(L, d) != null && v(L, datas[i - 4]) ? (v(L, d) / Math.abs(v(L, datas[i - 4])) - 1) * 100 * Math.sign(v(L, datas[i - 4])) : null }));
}

export function correlacao(a: number[][], b: number[][]) {
  const mb = new Map(b.map((c) => [new Date(c[0] * 1000).toISOString().slice(0, 10), c[4]])), pares: number[][] = [];
  const A = a.map((c) => [new Date(c[0] * 1000).toISOString().slice(0, 10), c[4]] as [string, number]).filter(([d]) => mb.has(d)).slice(-121);
  for (let i = 1; i < A.length; i++) pares.push([A[i][1] / A[i - 1][1] - 1, mb.get(A[i][0])! / mb.get(A[i - 1][0])! - 1]);
  if (pares.length < 40) return null;
  const ma = pares.reduce((s, x) => s + x[0], 0) / pares.length, mbb = pares.reduce((s, x) => s + x[1], 0) / pares.length;
  let c = 0, va = 0, vb = 0;
  for (const [x, y] of pares) { c += (x - ma) * (y - mbb); va += (x - ma) ** 2; vb += (y - mbb) ** 2; }
  return va && vb ? c / Math.sqrt(va * vb) : null;
}

export const NOTA_FISCAL = {
  EUA: 'Lei 14.754/2023: ganhos e rendimentos de aplicações no exterior (ações, ETFs, dividendos) de pessoa física são tributados a 15% ao ano, apurados na Declaração de Ajuste Anual, com compensação de perdas no exterior; o imposto retido nos EUA sobre dividendos pode ser deduzido nos limites da lei. Confirme com seu contador.',
  B3_ETF: 'ETF de renda variável na B3: 15% sobre o ganho de capital em operações normais (20% em day trade), recolhido via DARF até o último dia útil do mês seguinte, sem a isenção de R$ 20 mil das ações.',
};

function tabela(cab: string[], linhas: any[][]) {
  return '| ' + cab.join(' | ') + ' |\n|' + cab.map(() => '---').join('|') + '|\n' + linhas.map((l) => '| ' + l.map((x) => String(x ?? 'n/d').replace(/\|/g, '/')).join(' | ') + ' |').join('\n');
}

function tecnicoMd(tk: string, e: any, moeda: string) {
  if (!e) return `Sem candles suficientes para ${tk}.`;
  const t = e.tech || {}, D = t.dow || {}, E = t.elliott || {}, o = e.opcoes || {};
  const L = [
    ['Último candle', dm(e.ultimo)], ['Fechamento', fmt(e.close)], ['MM20 · MM50 · MM200 (diário)', `${fmt(e.ma20)} · ${fmt(e.ma50)} · ${fmt(e.ma200)}`],
    ['MM10s · MM40s (semanal)', `${fmt(e.w10)} · ${fmt(e.w40)}`], ['Estrutura diária / semanal', `${e.dailyTrend} / ${e.weeklyTrend}`], ['RSI 14', `${fmt(e.rsi, 1)} · ${t.mom || ''}`],
    ['Dow · primária / secundária', `${D.primaria || 'n/d'} / ${D.secundaria || 'n/d'}`], ['Pivô de reversão (Dow)', D.pivo ? `${fmt(D.pivo.v)} · ${D.pivo.tipo} (${dm(D.pivo.dia)})` : 'n/d'],
    ['Perna dominante', t.perna ? `${t.perna.direcao}: ${fmt(t.perna.de)} → ${fmt(t.perna.ate)}` : 'n/d'],
    ['Fibonacci 38,2% · 50% · 61,8%', t.fibo ? t.fibo.map((q: any) => fmt(q.v)).join(' · ') : 'n/d'],
    ['Elliott · ciclo', E.fase || 'n/d'], ['Extensões 100% · 161,8%', `${fmt(E.ext100)} · ${fmt(E.ext1618)} (se romper ${fmt(E.gatilho)})`],
    ['Elástico MM20 · MM10s', `${pp(t.elastico20)} · ${pp(t.elastico10s)} (${t.zonaValor || 'n/d'})`],
    ['Últimos 5 candles', (t.pa || []).length ? t.pa.map((q: any) => q.tipo + ' ' + dm(q.dia).slice(0, 5)).join(' · ') : 'sem inside bar ou pavio de rejeição'],
    ['Polaridade', t.pol ? `${t.pol.tipo} em ${fmt(t.pol.nivel)}` : 'sem nível rompido próximo'],
    ['Confluências (até 1%)', (t.conf || []).length ? t.conf.map((q: any) => `${q.nivel} ${fmt(q.valor)} + ${q.com.join(', ')}`).join(' · ') : 'nenhuma'],
    ['Referência acima / abaixo', `${t.refAlta ? fmt(t.refAlta[1]) + ' (' + t.refAlta[0] + ')' : 'n/d'} / ${t.refBaixa ? fmt(t.refBaixa[1]) + ' (' + t.refBaixa[0] + ')' : 'n/d'}`],
    ['Invalidação do cenário', t.invalidacao ? `${fmt(t.invalidacao.v)} (${t.invalidacao.tipo})` : 'n/d'],
  ];
  const op = [
    ['Venda coberta (strike de referência acima do preço)', o.venda_coberta != null ? din(o.venda_coberta, moeda) : 'sem resistência próxima'],
    ['Trava de alta (compra no suporte / venda na resistência)', o.trava_alta ? `${din(o.trava_alta.comprada, moeda)} / ${din(o.trava_alta.vendida, moeda)}` : 'n/d'],
    ['Trava de baixa (compra na resistência / venda no suporte)', o.trava_baixa ? `${din(o.trava_baixa.comprada, moeda)} / ${din(o.trava_baixa.vendida, moeda)}` : 'n/d'],
    [`Compra a seco de ${o.direcao === 'baixa' ? 'puts' : 'calls'} (perna de ${o.direcao || 'n/d'}): gatilho / alvo de extensão`, `${din(o.compra_seco_gatilho, moeda)} / ${din(o.alvo_extensao, moeda)}`],
    ['Invalidação técnica', din(o.invalidacao, moeda)],
  ];
  return `${tabela(['Mapa técnico', 'Valor'], L)}\n\n### Contexto para estruturação com opções\n${tabela(['Estrutura', 'Níveis de referência'], op)}\n\nRSI ${fmt(e.rsi, 1)} e elástico de ${pp(t.elastico20)} até a MM20: ${ok(e.rsi) && e.rsi >= 70 ? 'prêmios de calls tendem a estar mais caros — contexto que favorece estudar venda coberta/travas de alta com strike na resistência.' : ok(e.rsi) && e.rsi <= 30 ? 'contexto de sobrevenda — estudar travas de alta com risco limitado no suporte em vez de compra a seco alavancada.' : 'momento neutro — a escolha da estrutura depende do rompimento da referência acima ou da perda da referência abaixo.'} Níveis educacionais; confira liquidez, vencimento e volatilidade implícita na plataforma.`;
}

function fundamentosMd(f: any, v: any) {
  const m = f.moeda;
  const L = [
    ['Cotação', `${din(f.preco, m)} · ${f.hora ? dm(f.hora) : ''}`], ['Valor de mercado', grande(f.valor_mercado, m)], ['Setor / indústria', `${f.setor || 'n/d'} / ${f.industria || 'n/d'}`],
    ['P/L · P/VP · EV/EBITDA', `${fmt(f.pl)} · ${fmt(f.pvp)} · ${fmt(f.ev_ebitda)}`], ['LPA · VPA', `${din(f.lpa, m)} · ${din(f.vpa, m)}`],
    ['ROE · margem líquida · margem EBITDA', `${pct(f.roe)} · ${pct(f.margem_liquida)} · ${pct(f.margem_ebitda)}`],
    ['Dividend yield · payout', `${pct(f.dy)} · ${pct(f.payout)}`], ['Proventos últimos 12 meses (por ação)', din(f.dividendos_12m, m)],
    ['Dívida total · caixa', `${grande(f.divida_total, m)} · ${grande(f.caixa, m)}`], ['FCO · FCL (12 meses)', `${grande(f.fco, m)} · ${grande(f.fcl, m)}`],
    ['Mínima · máxima 52 semanas', `${din(f.min52, m)} · ${din(f.max52, m)}`], ['Próximo resultado · data com', `${dm(f.proximo_resultado)} · ${dm(f.data_com)}`],
  ];
  let out = tabela(['Fundamentos', 'Valor'], L);
  if (v) {
    const P = v.premissas;
    out += `\n\n### Preço justo (${m === 'USD' ? 'US$' : 'R$'})\n` + tabela(['Método', 'Preço justo', 'Margem de segurança', 'Fórmula'], [
      ['Graham', din(v.graham, m), pct(v.margens.graham), '√(22,5 × LPA × VPA)'],
      ['Bazin', din(v.bazin, m), pct(v.margens.bazin), 'proventos 12m ÷ 6%'],
      ['DCF', v.dcf ? din(v.dcf.preco, m) : 'indisponível', pct(v.margens.dcf), v.dcf ? `FCL ${grande(v.dcf.fcl, m)}, WACC ${pct(P.wacc)}, cresc. ${pct(P.crescimento)}, perp. ${pct(P.perpetuidade)}, ${P.anos} anos (${P.origem})` : v.dcfMotivo],
    ]) + '\n\nMargem de segurança = (preço justo − cotação) ÷ preço justo. Estimativas condicionais, não preço-alvo.';
  }
  const T = trimestres(f);
  if (T.length) out += '\n\n### Últimos trimestres\n' + tabela(['Trimestre', 'Receita', 'Lucro líquido', 'Lucro QoQ', 'Lucro YoY'], T.map((q) => [dm(q.data), grande(q.receita, f.moeda_balanco || m), grande(q.lucro, f.moeda_balanco || m), pp(q.qoq, 1), pp(q.yoy, 1)]));
  if (f.dividendos?.length) out += '\n\n### Proventos recentes\n' + tabela(['Data', 'Valor por ação'], f.dividendos.slice(-6).reverse().map((d: any) => [dm(d.data), din(d.valor, m)]));
  return out;
}

function etfMd(f: any, extra: any) {
  const m = f.moeda, I = f.etf_info || {};
  const L = [['Cotação', din(f.preco, m)], ['Categoria', I.categoria || 'n/d'], ['Gestora', I.familia || 'n/d'], ['Taxa de administração', pct(I.taxa, 2)], ['Patrimônio', grande(I.patrimonio, m)],
    ['Retorno no ano', pct(I.ytd)], ['Dividend yield', pct(f.dy)], ['Mínima · máxima 52 semanas', `${din(f.min52, m)} · ${din(f.max52, m)}`],
    ['Correlação com o dólar (USD/BRL, 120 pregões)', extra?.corrDolar != null ? fmt(extra.corrDolar, 2) : 'n/d']];
  let out = tabela(['ETF', 'Valor'], L);
  if (I.maiores?.length) out += '\n\n' + tabela(['Maiores posições', 'Peso'], I.maiores.map((h: any) => [h.nome, pct(h.peso)]));
  out += `\n\n### Análise macro/setorial e cambial\nETF não tem balanço de empresa: a leitura usa categoria, custo, composição e câmbio. ${f.mercado === 'EUA' ? 'Para o investidor brasileiro, o retorno em reais soma a variação do ativo em dólar e a variação do USD/BRL' : 'Ativo em reais'}${extra?.corrDolar != null ? `; correlação de ${fmt(extra.corrDolar, 2)} com o dólar nos últimos 120 pregões (${Math.abs(extra.corrDolar) < 0.2 ? 'baixa' : Math.abs(extra.corrDolar) < 0.5 ? 'moderada' : 'alta'})` : ''}.\n\n**Nota tributária:** ${f.mercado === 'EUA' ? NOTA_FISCAL.EUA : NOTA_FISCAL.B3_ETF}`;
  return out;
}

/** Relatório completo montado pelo código para um ativo, conforme o modo. */
export function ativoMd(modo: string, f: any, calc: any) {
  const v = calc?.valuation, e = calc?.estudo, cab = `## ${f.ticker} · ${f.nome}\n${f.mercado === 'B3' ? 'B3' : 'Exterior (EUA)'} · ${f.etf ? 'ETF' : 'Ação'} · moeda ${f.moeda} · cotação ${din(f.preco, f.moeda)}${ok(f.variacao_dia) ? ` (${pp(f.variacao_dia)} no dia)` : ''}`;
  const partes = [cab];
  if (modo !== 'TECNICO') partes.push('### Fundamentos e valuation\n' + (f.etf ? etfMd(f, calc) : fundamentosMd(f, v)));
  if (modo !== 'RESULTADO') partes.push('### Análise técnica (Dow, Elliott, Fibonacci, price action)\n' + tecnicoMd(f.ticker, e, f.moeda));
  if (f.mercado === 'EUA' && !f.etf && modo !== 'TECNICO') partes.push('**Nota tributária:** ' + NOTA_FISCAL.EUA);
  if (f.avisos?.length) partes.push('_Avisos de coleta: ' + f.avisos.join(' · ').slice(0, 300) + '_');
  return partes.join('\n\n');
}

export function compareMd(fs: any[], calcs: Record<string, any>) {
  const c = (f: any) => calcs[f.ticker] || {};
  const lin = (rot: string, fn: (f: any) => any) => [rot, ...fs.map(fn)];
  return '## Comparação lado a lado\n' + tabela(['Indicador', ...fs.map((f) => f.ticker)], [
    lin('Mercado · tipo', (f) => `${f.mercado} · ${f.etf ? 'ETF' : 'Ação'}`), lin('Cotação', (f) => din(f.preco, f.moeda)), lin('Valor de mercado', (f) => grande(f.valor_mercado, f.moeda)),
    lin('P/L', (f) => fmt(f.pl)), lin('P/VP', (f) => fmt(f.pvp)), lin('EV/EBITDA', (f) => fmt(f.ev_ebitda)), lin('ROE', (f) => pct(f.roe)), lin('Margem líquida', (f) => pct(f.margem_liquida)),
    lin('Dividend yield', (f) => pct(f.dy)), lin('Payout', (f) => pct(f.payout)), lin('Graham · margem', (f) => (c(f).valuation ? `${din(c(f).valuation.graham, f.moeda)} · ${pct(c(f).valuation.margens.graham)}` : 'n/a')),
    lin('Bazin · margem', (f) => (c(f).valuation ? `${din(c(f).valuation.bazin, f.moeda)} · ${pct(c(f).valuation.margens.bazin)}` : 'n/a')),
    lin('Estrutura diária / semanal', (f) => (c(f).estudo ? `${c(f).estudo.dailyTrend} / ${c(f).estudo.weeklyTrend}` : 'n/d')), lin('Dow primária', (f) => c(f).estudo?.tech?.dow?.primaria || 'n/d'),
    lin('RSI 14', (f) => fmt(c(f).estudo?.rsi, 1)), lin('Elástico MM20', (f) => pp(c(f).estudo?.tech?.elastico20)), lin('Elliott', (f) => c(f).estudo?.tech?.elliott?.tipo || 'n/d'),
    lin('Correlação com o dólar', (f) => (c(f).corrDolar != null ? fmt(c(f).corrDolar, 2) : 'n/d')),
  ]) + '\n\nMoedas nativas mantidas (R$ para B3, US$ para EUA); compare múltiplos, não preços.';
}

export function carteiraMd(fs: any[], calcs: Record<string, any>) {
  const n = fs.length, porMercado = fs.reduce((a: any, f) => ((a[f.mercado] = (a[f.mercado] || 0) + 1), a), {}), porSetor = fs.reduce((a: any, f) => { const s = f.etf ? 'ETF · ' + (f.etf_info?.categoria || 'n/d') : f.setor || 'n/d'; a[s] = (a[s] || 0) + 1; return a; }, {});
  const exterior = (porMercado.EUA || 0) / n;
  return '## Diagnóstico da carteira\n' + tabela(['Ativo', 'Mercado', 'Tipo/Setor', 'Cotação', 'Estrutura diária/semanal', 'RSI 14', 'Elástico MM20', 'Correlação c/ dólar'], fs.map((f) => { const e = calcs[f.ticker]?.estudo; return [f.ticker, f.mercado, f.etf ? 'ETF' : f.setor || 'n/d', din(f.preco, f.moeda), e ? `${e.dailyTrend}/${e.weeklyTrend}` : 'n/d', fmt(e?.rsi, 1), pp(e?.tech?.elastico20), calcs[f.ticker]?.corrDolar != null ? fmt(calcs[f.ticker].corrDolar, 2) : 'n/d']; })) +
    `\n\n### Exposição e concentração (por número de ativos; pesos não informados)\n- Exposição cambial: ${fmt(exterior * 100, 0)}% dos ativos negociados em dólar (${porMercado.EUA || 0} de ${n}).\n- Setores: ${Object.entries(porSetor).map(([s, q]) => `${s} (${q})`).join(', ')}.\n- Maior concentração setorial: ${Object.entries(porSetor).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'n/d'}.\n- Momento técnico: ${fs.filter((f) => calcs[f.ticker]?.estudo?.weeklyTrend === 'alta').length} em alta no semanal, ${fs.filter((f) => calcs[f.ticker]?.estudo?.weeklyTrend === 'baixa').length} em baixa; ${fs.filter((f) => (calcs[f.ticker]?.estudo?.rsi ?? 0) >= 70).length} em sobrecompra (RSI ≥ 70).` +
    (porMercado.EUA ? '\n\n**Nota tributária:** ' + NOTA_FISCAL.EUA : '');
}
