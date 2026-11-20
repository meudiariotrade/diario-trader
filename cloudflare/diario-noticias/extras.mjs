/* v835 — Automação de mercado na Cloudflare (dado público, Yahoo Finance; sem Supabase):
 *  1) Correlação quebrada: pares que andam juntos (Petrobras × petróleo, Vale × minério,
 *     Ibovespa × EWZ, dólar × DXY) e hoje foram em direções opostas.
 *  2) Gap de amanhã: depois do fechamento da B3, quanto EWZ, S&P futuro e petróleo andaram desde as 17h.
 *  3) Reação histórica: guarda a variação do Ibovespa no dia de cada evento forte da agenda.
 */
import { serieDeChart, retornos } from './analogia.mjs';

const UA = 'Mozilla/5.0 (compatible; DiarioTrader/1.0)';
export const PARES = [
  { id: 'petr-oleo', a: ['PETR4', 'PETR4.SA'], b: ['Petróleo WTI', 'CL=F'], porque: 'Petrobras costuma acompanhar o petróleo; quando se separa, o motivo costuma ser empresa (dividendos, governo, preço de combustível).' },
  { id: 'vale-minerio', a: ['VALE3', 'VALE3.SA'], b: ['Minério', 'TIO=F'], porque: 'Vale costuma acompanhar o minério de ferro; separação pode vir de notícia da empresa, câmbio ou da China.' },
  { id: 'ibov-ewz', a: ['Ibovespa', '^BVSP'], b: ['EWZ', 'EWZ'], porque: 'EWZ é o Brasil negociado em NY em dólar; separação costuma ser câmbio ou fluxo estrangeiro.' },
  { id: 'dolar-dxy', a: ['Dólar/real', 'BRL=X'], b: ['DXY', 'DX-Y.NYB'], porque: 'O real costuma seguir o dólar global; separação aponta fator local (fiscal, juros, fluxo).' }
];
const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);

async function chart(fetcher, sym, range, interval) {
  const r = await fetcher('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + range + '&interval=' + interval, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw Error('HTTP ' + r.status);
  return r.json();
}
export function correlacao(ra, rb, datas) {
  const xs = [], ys = [];
  for (const d of datas) { const x = ra.get(d), y = rb.get(d); if (x != null && y != null) { xs.push(x); ys.push(y); } }
  if (xs.length < 20) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
/* series: {simbolo: Map(data→fechamento)} — devolve todos os pares, marcando os que quebraram hoje. */
export function avaliarPares(series) {
  return PARES.map((p) => {
    const A = series[p.a[1]], B = series[p.b[1]];
    if (!A || !B) return null;
    const ra = retornos(A), rb = retornos(B), dA = ra.datas.at(-1), dB = rb.datas.at(-1);
    const hojeA = ra.ret.get(dA), hojeB = rb.ret.get(dB);
    const janela = ra.datas.slice(-61, -1);
    const corr = correlacao(ra.ret, rb.ret, janela);
    const quebrou = corr != null && corr >= 0.3 && hojeA != null && hojeB != null && Math.abs(hojeA) >= 1 && Math.abs(hojeB) >= 1 && Math.sign(hojeA) !== Math.sign(hojeB);
    return { id: p.id, a: p.a[0], b: p.b[0], hojeA: r2(hojeA), hojeB: r2(hojeB), dataA: dA, dataB: dB, correlacao60: r2(corr), quebrou, porque: p.porque };
  }).filter(Boolean);
}
/* Gap: variação desde as 17h de Brasília (fechamento da B3) usando o gráfico de 5 min do dia. */
export function variacaoDesde(json, desdeMs) {
  const r = json?.chart?.result?.[0], ts = r?.timestamp || [], c = r?.indicators?.quote?.[0]?.close || [];
  let base = null, ult = null;
  for (let i = 0; i < ts.length; i++) {
    const v = Number(c[i]); if (!Number.isFinite(v) || v <= 0) continue;
    if (ts[i] * 1000 <= desdeMs) base = v;
    ult = v;
  }
  return base && ult ? r2((ult / base - 1) * 100) : null;
}
function fechamentoB3Hoje(agora) {
  const d = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const off = agora.getTime() - d.getTime();
  d.setHours(17, 0, 0, 0);
  return d.getTime() + off;
}
export function textoGap(g) {
  const v = [g.ewz, g.sp, g.petroleo].filter((x) => x != null);
  if (!v.length) return 'Sem dados depois do fechamento da B3.';
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const dir = m <= -0.4 ? 'abertura mais fraca' : m >= 0.4 ? 'abertura mais forte' : 'abertura perto do fechamento';
  return 'Desde o fechamento da B3: EWZ ' + fmt(g.ewz) + ', S&P futuro ' + fmt(g.sp) + ', petróleo ' + fmt(g.petroleo) + '. Leitura: ' + dir + ' (estimativa por proxies, não é preço de abertura).';
}
function fmt(v) { return v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%'; }

export async function coletarExtras(fetcher = fetch, agora = new Date()) {
  const simbolos = [...new Set(PARES.flatMap((p) => [p.a[1], p.b[1]]))], series = {};
  await Promise.all(simbolos.map(async (s) => { try { series[s] = serieDeChart(await chart(fetcher, s, '6mo', '1d')); } catch { /* fica de fora */ } }));
  const pares = avaliarPares(series);
  const desde = fechamentoB3Hoje(agora), gap = {};
  await Promise.all([['ewz', 'EWZ'], ['sp', 'ES=F'], ['petroleo', 'CL=F']].map(async ([k, s]) => {
    try { gap[k] = variacaoDesde(await chart(fetcher, s, '1d', '5m'), desde); } catch { gap[k] = null; }
  }));
  const ib = series['^BVSP'] ? retornos(series['^BVSP']) : null;
  return {
    versao: 1, gerado: agora.toISOString(), pares,
    gap: agora.getTime() > desde ? { ...gap, texto: textoGap(gap) } : null,
    ibovHoje: ib ? { data: ib.datas.at(-1), ret: r2(ib.ret.get(ib.datas.at(-1))) } : null
  };
}
/* Reação histórica: no fim do dia, guarda a variação do Ibovespa para cada evento forte do dia (até 12 por evento). */
export function chaveEvento(t) { return String(t || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\b(nov|dez|jan|fev|mar|abr|mai|jun|jul|ago|set|out)\.?\s*\d{4}\b/g, '').replace(/[^a-z0-9à-ú ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80); }
export function registrarReacoes(reacoes, eventosHoje, ibovHoje) {
  const out = { ...(reacoes || {}) };
  if (!ibovHoje || ibovHoje.ret == null) return out;
  for (const e of eventosHoje || []) {
    const k = chaveEvento(e.t); if (!k) continue;
    const lista = (out[k] || []).filter((x) => x.data !== ibovHoje.data);
    lista.unshift({ data: ibovHoje.data, ibov: ibovHoje.ret });
    out[k] = lista.slice(0, 12);
  }
  return out;
}
/* Agenda: 30 min no pregão de NY (como a analogia), 18h e 20h de Brasília (gap) e 18h30 (reações). */
export function extrasAgora(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false }).formatToParts(date).map((x) => [x.type, x.value]));
  if (p.weekday === 'Sat' || p.weekday === 'Sun') return { coleta: false, reacoes: false };
  const m = (Number(p.hour) % 24) * 60 + Number(p.minute);
  return { coleta: (m >= 660 && m <= 1080 && m % 30 === 0) || m === 1200 || m === 480, reacoes: m === 1110 };
}
