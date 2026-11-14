// v606 — "Mesa macro" da aba Mercado: 12 termômetros, DIs líquidos com inclinação, Fed Watch,
// cesta de moedas emergentes, US Market Barometer (3x3) e estatísticas do Ibovespa (correlação e volatilidade).
// Tudo numa consulta só, pelo screener público do TradingView (preços) e Yahoo (fechamentos diários).
type Tv = Record<string, { px: number; d1: number; dabs: number | null; m1: number | null; horarioPreco?: string | null }>;
type Scan = (mercado: string, tickers: string[]) => Promise<Tv>;

export const MAPA606 = [
  { k: 'WIN', n: 'Mini índice', s: 'BMFBOVESPA:WIN1!', dp: 0, ss: 'b3' },
  { k: 'WDO', n: 'Mini dólar', s: 'BMFBOVESPA:WDO1!', dp: 1, ss: 'b3' },
  { k: 'EWZ', n: 'Brasil em NY', s: 'AMEX:EWZ', dp: 2, ss: 'nyse' },
  { k: 'S&P 500', n: 'Índice EUA', s: 'SP:SPX', dp: 0, ss: 'nyse' },
  { k: 'DXY', n: 'Índice do dólar', s: 'TVC:DXY', dp: 2, ss: 'fx24' },
  { k: 'USD/BRL', n: 'Dólar à vista', s: 'FX_IDC:USDBRL', dp: 4, ss: 'brl' },
  { k: 'DI1F27', n: 'DI jan/27', s: 'BMFBOVESPA:DI1F2027', dp: 3, un: '%', ss: 'di' },
  { k: 'DI1F31', n: 'DI jan/31', s: 'BMFBOVESPA:DI1F2031', dp: 3, un: '%', ss: 'di' },
  { k: 'US10Y', n: 'Treasury 10a', s: 'TVC:US10Y', dp: 3, un: '%', ss: 'fx24' },
  { k: 'Brent', n: 'Petróleo', s: 'ICEEUR:BRN1!', dp: 2, ss: 'ice' },
  { k: 'Minério', n: 'Ferro SGX', s: 'SGX:FEF1!', dp: 2, ss: 'sgx' },
  { k: 'BTC', n: 'Bitcoin', s: 'BITSTAMP:BTCUSD', dp: 0, ss: '24h' },
];
export const DI606 = [
  { k: 'DI1F27', s: 'BMFBOVESPA:DI1F2027', venc: '2027-01-04' },
  { k: 'DI1F28', s: 'BMFBOVESPA:DI1F2028', venc: '2028-01-03' },
  { k: 'DI1F29', s: 'BMFBOVESPA:DI1F2029', venc: '2029-01-02' },
  { k: 'DI1F31', s: 'BMFBOVESPA:DI1F2031', venc: '2031-01-02' },
  { k: 'DI1F33', s: 'BMFBOVESPA:DI1F2033', venc: '2033-01-03' },
];
export const EM606 = [
  { k: 'USD/MXN', s: ['FX_IDC:USDMXN', 'FX:USDMXN'] },
  { k: 'USD/CLP', s: ['FX:USDCLP', 'PEPPERSTONE:USDCLP', 'FX_IDC:USDCLP'] },
  { k: 'USD/COP', s: ['FX_IDC:USDCOP', 'FX:USDCOP'] },
  { k: 'USD/ZAR', s: ['FX_IDC:USDZAR', 'FX:USDZAR'] },
  { k: 'USD/CNY', s: ['FX_IDC:USDCNY', 'FX:USDCNY'] },
];
// Linhas Large/Mid/Small × colunas Value/Core/Growth (iShares S&P 500, 400 e 600).
export const BAR606 = [
  ['IVE', 'IVV', 'IVW'],
  ['IJJ', 'IJH', 'IJK'],
  ['IJS', 'IJR', 'IJT'],
];
// Reuniões do FOMC (2º dia, data da decisão). Fonte: federalreserve.gov (2027 é o calendário provisório oficial).
export const FOMC606 = ['2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17', '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-09',
  '2027-01-27', '2027-03-17', '2027-04-28', '2027-06-09', '2027-07-28', '2027-09-15', '2027-10-27', '2027-12-08'];
const MES = 'FGHJKMNQUVXZ';
const zq = (ano: number, mes0: number) => `CBOT:ZQ${MES[mes0]}${ano}`;
const diasNoMes = (ano: number, mes0: number) => new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();

/** Probabilidades no método do CME FedWatch, a partir dos futuros de Fed Funds (taxa implícita = 100 − preço). */
export function fedWatch(precos: Record<string, number>, hoje = new Date()) {
  const hj = hoje.toISOString().slice(0, 10);
  const prox = FOMC606.find((d) => d >= hj);
  if (!prox) return null;
  const [a, m] = prox.split('-').map(Number), mes0 = m - 1, dia = +prox.slice(8, 10);
  const temReuniao = (ano: number, mm0: number) => FOMC606.some((d) => d.startsWith(`${ano}-${String(mm0 + 1).padStart(2, '0')}`));
  const pa = mes0 === 0 ? [a - 1, 11] : [a, mes0 - 1], pd = mes0 === 11 ? [a + 1, 0] : [a, mes0 + 1];
  const imp = (ano: number, mm0: number) => { const p = precos[zq(ano, mm0)]; return p > 0 ? 100 - p : null; };
  const rM = imp(a, mes0); if (rM == null) return null;
  const N = diasNoMes(a, mes0), antes = dia / N; // decisão vale a partir do dia seguinte
  let r0: number | null = null, r1: number | null = null;
  const rAnt = imp(pa[0], pa[1]), rDep = imp(pd[0], pd[1]);
  if (rAnt != null && !temReuniao(pa[0], pa[1])) { r0 = rAnt; r1 = (rM - r0 * antes) / (1 - antes); }
  else if (rDep != null && !temReuniao(pd[0], pd[1])) { r1 = rDep; r0 = (rM - r1 * (1 - antes)) / antes; }
  else if (rAnt != null) { r0 = rAnt; r1 = (rM - r0 * antes) / (1 - antes); }
  if (r0 == null || r1 == null || !isFinite(r0) || !isFinite(r1)) return null;
  const piso = Math.floor((r0 + 0.02) / 0.25) * 0.25; // faixa atual estimada a partir da taxa efetiva implícita
  const passos = (r1 - r0) / 0.25, base = Math.trunc(passos), frac = Math.abs(passos - base);
  const lado = passos >= 0 ? 1 : -1;
  const cen: { mov: number; p: number }[] = [];
  const add = (mov: number, p: number) => { if (p > 0.004) cen.push({ mov, p: Math.round(p * 1000) / 10 }); };
  add(base * 25, 1 - frac); add((base + lado) * 25, frac);
  cen.sort((x, y) => y.p - x.p);
  return { reuniao: prox, faixa: [piso, piso + 0.25], efetiva: +r0.toFixed(4), implicita: +r1.toFixed(4), variacaoBps: Math.round((r1 - r0) * 1000) / 10, cenarios: cen,
    contratos: [zq(a, mes0), rAnt != null ? zq(pa[0], pa[1]) : zq(pd[0], pd[1])], fonte: 'Futuros de Fed Funds CBOT (ZQ) via TradingView · método CME FedWatch' };
}

/** Taxa interpolada (linear) num prazo em anos, a partir dos vértices [anos, taxa]. */
export function interpola(pts: [number, number][], anos: number): number | null {
  const p = pts.filter((x) => isFinite(x[0]) && isFinite(x[1])).sort((x, y) => x[0] - y[0]);
  if (p.length < 2) return null;
  if (anos <= p[0][0]) { const [a, b] = p; return a[1] + ((b[1] - a[1]) * (anos - a[0])) / (b[0] - a[0]); }
  for (let i = 1; i < p.length; i++) if (anos <= p[i][0]) { const a = p[i - 1], b = p[i]; return a[1] + ((b[1] - a[1]) * (anos - a[0])) / (b[0] - a[0]); }
  const a = p[p.length - 2], b = p[p.length - 1]; return a[1] + ((b[1] - a[1]) * (anos - a[0])) / (b[0] - a[0]);
}

/** Correlação de Pearson. */
export function correl(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length); if (n < 10) return null;
  const mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}
export function desvio(x: number[]): number | null {
  if (x.length < 5) return null; const m = x.reduce((s, v) => s + v, 0) / x.length;
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1));
}

async function diarios(sym: string, UA: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=6mo&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return out;
    const R = (await r.json())?.chart?.result?.[0], ts: number[] = R?.timestamp || [], c: (number | null)[] = R?.indicators?.quote?.[0]?.close || [];
    ts.forEach((t, i) => { const v = c[i]; if (typeof v === 'number' && v > 0) out.set(new Date(t * 1000).toISOString().slice(0, 10), v); });
  } catch { /* sem série */ }
  return out;
}

/** Correlação Ibov × dólar (60 pregões coincidentes) e volatilidade do Ibov (20 pregões, anualizada). */
export async function estatIbov(UA: string) {
  const [ib, fx] = await Promise.all([diarios('^BVSP', UA), diarios('BRL=X', UA)]);
  const ret = (m: Map<string, number>) => { const d = [...m.keys()].sort(), o = new Map<string, number>(); for (let i = 1; i < d.length; i++) o.set(d[i], (m.get(d[i])! / m.get(d[i - 1])! - 1) * 100); return o; };
  const ri = ret(ib), rf = ret(fx), comuns = [...ri.keys()].filter((d) => rf.has(d)).sort().slice(-60);
  const corr = correl(comuns.map((d) => ri.get(d)!), comuns.map((d) => rf.get(d)!));
  const ult20 = [...ri.keys()].sort().slice(-20).map((d) => ri.get(d)!), sd = desvio(ult20);
  return { corr60: corr == null ? null : +corr.toFixed(3), n: comuns.length, vol20: sd == null ? null : +(sd * Math.sqrt(252)).toFixed(2), ate: comuns[comuns.length - 1] || null, fonte: 'Yahoo Finance (^BVSP e BRL=X, fechamentos diários)' };
}

let cache: { ts: number; v: any } | null = null, cacheEst: { ts: number; v: any } | null = null;
export async function mesa606(scan: Scan, UA: string) {
  if (cache && Date.now() - cache.ts < 20_000) return cache.v;
  const hoje = new Date(), a = hoje.getUTCFullYear(), m0 = hoje.getUTCMonth();
  const zqs: string[] = []; for (let i = -1; i <= 4; i++) { const d = new Date(Date.UTC(a, m0 + i, 1)); zqs.push(zq(d.getUTCFullYear(), d.getUTCMonth())); }
  const etfs = BAR606.flat().flatMap((t) => ['AMEX:' + t, 'NASDAQ:' + t]);
  const todos = [...new Set([...MAPA606.map((x) => x.s), ...DI606.map((x) => x.s), ...EM606.flatMap((x) => x.s), ...etfs, ...zqs])];
  const [tv, est] = await Promise.all([
    scan('global', todos),
    cacheEst && Date.now() - cacheEst.ts < 30 * 60_000 ? Promise.resolve(cacheEst.v) : estatIbov(UA).then((v) => { if (v.corr60 != null) cacheEst = { ts: Date.now(), v }; return v; }).catch(() => null),
  ]);
  const q = (s: string) => tv[s] && tv[s].px > 0 ? tv[s] : null;
  const mapa = MAPA606.map((x) => { const t = q(x.s); return { ...x, px: t?.px ?? null, d1: t?.d1 ?? null, dabs: t?.dabs ?? null, em: t?.horarioPreco || null }; });
  const base = Date.UTC(a, m0, hoje.getUTCDate());
  const di = DI606.map((x) => {
    const t = q(x.s), anos = (Date.parse(x.venc) - base) / (365.25 * 864e5);
    const ant = t && t.dabs != null ? t.px - t.dabs : null;
    return { k: x.k, venc: x.venc, anos: +anos.toFixed(3), taxa: t?.px ?? null, ant: ant == null ? null : +ant.toFixed(3), bps: t && t.dabs != null ? Math.round(t.dabs * 1000) / 10 : null, em: t?.horarioPreco || null };
  });
  const pts = (campo: 'taxa' | 'ant') => di.filter((x) => x[campo] != null).map((x) => [x.anos, x[campo] as number] as [number, number]);
  const inc = (campo: 'taxa' | 'ant') => { const r2 = interpola(pts(campo), 2), r5 = interpola(pts(campo), 5); return r2 == null || r5 == null ? null : { r2, r5, bps: Math.round((r5 - r2) * 1000) / 10 }; };
  const iH = inc('taxa'), iA = inc('ant');
  const emer = EM606.map((x) => { const s = x.s.find((y) => q(y) && !(q(y)!.d1 === 0 && q(y)!.dabs === 0)) || x.s.find((y) => q(y)); const t = s ? q(s) : null; return { k: x.k, s: s || x.s[0], px: t?.px ?? null, d1: t?.d1 ?? null, m1: t?.m1 ?? null }; });
  const val = emer.filter((x) => x.d1 != null), media = val.length ? val.reduce((s, x) => s + x.d1!, 0) / val.length : null;
  const brl = q('FX_IDC:USDBRL');
  const precosZq: Record<string, number> = {}; zqs.forEach((s) => { const t = q(s); if (t) precosZq[s] = t.px; });
  const bar = BAR606.map((linha) => linha.map((tk) => { const t = q('AMEX:' + tk) || q('NASDAQ:' + tk); return { tk, px: t?.px ?? null, d1: t?.d1 ?? null, m1: t?.m1 ?? null }; }));
  const v = {
    versao: 'v606', em: hoje.toISOString(), fonte: 'TradingView (screener público; B3 com ~15 min de atraso)',
    mapa, di,
    inclinacao: iH ? { hoje: iH.bps, ant: iA?.bps ?? null, varBps: iA ? Math.round((iH.bps - iA.bps) * 10) / 10 : null, r2: +iH.r2.toFixed(3), r5: +iH.r5.toFixed(3) } : null,
    fed: fedWatch(precosZq, hoje),
    emergentes: { itens: emer, media: media == null ? null : +media.toFixed(3), n: val.length, brl: brl ? { px: brl.px, d1: brl.d1, m1: brl.m1 } : null },
    barometro: { linhas: ['Large', 'Mid', 'Small'], colunas: ['Value', 'Core', 'Growth'], celulas: bar, fonte: 'ETFs iShares S&P 500/400/600 via TradingView' },
    ibov: est,
  };
  if (mapa.some((x) => x.px != null)) cache = { ts: Date.now(), v };
  else if (cache) return cache.v;
  return v;
}
