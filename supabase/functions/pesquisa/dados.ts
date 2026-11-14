// v621: coleta direta de dados reais (sem IA) para a aba Análises — B3 e exterior (EUA).
// B3: ticker com número no fim (PETR4, BBAS3, MXRF11, ROXO34, BOVA11) → Yahoo "<TK>.SA" + brapi (reserva).
// Exterior: só letras (AAPL, NVDA, IAU, IVV, SPY, EWZ) → Yahoo.
type Env = (key: string) => string | undefined;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

export const ehB3 = (t: string) => /^[A-Z]{4}\d{1,2}$/.test(t);
export const ehExterior = (t: string) => /^[A-Z]{1,5}(?:[.-][A-Z])?$/.test(t);
export const mercadoDe = (t: string) => (ehB3(t) ? 'B3' : 'EUA');
export const simbolo = (t: string) => (ehB3(t) ? t + '.SA' : t.replace('.', '-'));
export const moedaDe = (t: string) => (ehB3(t) ? 'BRL' : 'USD');

const num = (v: any): number | null => {
  const x = v && typeof v === 'object' ? v.raw : v;
  return typeof x === 'number' && Number.isFinite(x) ? x : null;
};

let YH: { cookie: string; crumb: string; ts: number } | null = null;
async function yhAuth(fetcher: typeof fetch) {
  if (YH && Date.now() - YH.ts < 30 * 60_000) return YH;
  const r = await fetcher('https://fc.yahoo.com', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  await r.text().catch(() => '');
  const c = await fetcher('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, Cookie: cookie }, signal: AbortSignal.timeout(8000) });
  const crumb = await c.text();
  if (!c.ok || !crumb || crumb.includes('<')) throw new Error('Yahoo Finance não liberou a consulta (crumb, HTTP ' + c.status + ').');
  return (YH = { cookie, crumb, ts: Date.now() });
}

async function yJson(url: string, fetcher: typeof fetch, auth = true) {
  const a = auth ? await yhAuth(fetcher) : null;
  const u = a ? url + (url.includes('?') ? '&' : '?') + 'crumb=' + encodeURIComponent(a.crumb) : url;
  const r = await fetcher(u, { headers: { 'User-Agent': UA, ...(a ? { Cookie: a.cookie } : {}) }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error('Yahoo Finance HTTP ' + r.status + (t ? ': ' + t.replace(/\s+/g, ' ').slice(0, 160) : '')); }
  return r.json();
}

const MODS = 'price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,calendarEvents,fundProfile,topHoldings,earnings';
const TIPOS_Q = ['quarterlyTotalRevenue', 'quarterlyNetIncome', 'quarterlyEBITDA', 'quarterlyOperatingCashFlow', 'quarterlyFreeCashFlow', 'quarterlyStockholdersEquity', 'quarterlyTotalDebt', 'quarterlyCashAndCashEquivalents'];
const TIPOS_A = ['annualTotalRevenue', 'annualNetIncome', 'annualFreeCashFlow', 'annualStockholdersEquity', 'annualDilutedEPS'];

function serie(ts: any, tipo: string) {
  const it = (ts?.timeseries?.result || []).find((x: any) => Array.isArray(x?.meta?.type) && x.meta.type[0] === tipo);
  return ((it && it[tipo]) || []).filter(Boolean).map((x: any) => ({ data: String(x.asOfDate || ''), valor: num(x.reportedValue) })).filter((x: any) => x.valor != null).slice(-8);
}

/** Dividendos dos últimos 5 anos pelo histórico do Yahoo (eventos div). */
async function dividendos(sym: string, fetcher: typeof fetch) {
  try {
    const j = await yJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5y&interval=1mo&events=div`, fetcher, false);
    const ev = j?.chart?.result?.[0]?.events?.dividends || {};
    return Object.values(ev).map((d: any) => ({ data: new Date(d.date * 1000).toISOString().slice(0, 10), valor: num(d.amount) })).filter((d: any) => d.valor != null).sort((a: any, b: any) => a.data.localeCompare(b.data));
  } catch { return []; }
}

async function brapi(tk: string, env: Env, fetcher: typeof fetch) {
  const token = env('BRAPI_TOKEN') || '';
  const r = await fetcher(`https://brapi.dev/api/quote/${encodeURIComponent(tk)}?modules=summaryProfile,defaultKeyStatistics,financialData&dividends=true${token ? '&token=' + encodeURIComponent(token) : ''}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error('brapi HTTP ' + r.status);
  const j = await r.json(), q = j?.results?.[0];
  if (!q) throw new Error('brapi sem resultado');
  return q;
}

export type Ficha = Record<string, any>;

/** Ficha completa de um ativo: cotação, perfil, múltiplos, balanços trimestrais/anuais, proventos e ETF. */
export async function coletaAtivo(tk: string, env: Env, fetcher: typeof fetch = fetch): Promise<Ficha> {
  const sym = simbolo(tk), mercado = mercadoDe(tk), erros: string[] = [], fontes: { titulo: string; url: string }[] = [];
  let S: any = null, ts: any = null, bq: any = null;
  try { S = (await yJson(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=${MODS}`, fetcher))?.quoteSummary?.result?.[0] || null; }
  catch (e) { erros.push((e as Error).message); }
  try {
    const p2 = Math.floor(Date.now() / 1000), p1 = p2 - 6 * 365 * 86400;
    ts = await yJson(`https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(sym)}?symbol=${encodeURIComponent(sym)}&type=${[...TIPOS_Q, ...TIPOS_A].join(',')}&period1=${p1}&period2=${p2}`, fetcher);
  } catch (e) { erros.push('Balanços: ' + (e as Error).message); }
  if (mercado === 'B3') { try { bq = await brapi(tk, env, fetcher); } catch (e) { erros.push((e as Error).message); } }
  const div = await dividendos(sym, fetcher);
  const P = S?.price || {}, SD = S?.summaryDetail || {}, K = S?.defaultKeyStatistics || {}, F = S?.financialData || {}, A = S?.assetProfile || {}, FP = S?.fundProfile || {};
  const BK = bq?.defaultKeyStatistics || {}, BF = bq?.financialData || {}, BS = bq?.summaryProfile || {};
  const tipo = String(P.quoteType || bq?.quoteType || '').toUpperCase(), etf = tipo === 'ETF' || /^(BOVA|IVVB|SMAL|HASH|GOLD|DIVO|SPXI|XINA|NASD|BBSD|ECOO|FIND|GOVE|MATB|PIBB|BOVV|BRAX)11$/.test(tk);
  const preco = num(P.regularMarketPrice) ?? num(F.currentPrice) ?? num(bq?.regularMarketPrice);
  if (preco == null) throw new Error(`Sem cotação para ${tk} (${sym}). ${erros.join(' · ').slice(0, 300)}`);
  fontes.push({ titulo: `Yahoo Finance · ${sym}`, url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}` });
  if (bq) fontes.push({ titulo: `brapi · ${tk}`, url: `https://brapi.dev/quote/${encodeURIComponent(tk)}` });
  const doze = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10), div12 = div.filter((d: any) => d.data >= doze).reduce((s: number, d: any) => s + d.valor, 0);
  const Q = Object.fromEntries(TIPOS_Q.map((t) => [t.replace('quarterly', '').replace(/^./, (c) => c.toLowerCase()), serie(ts, t)]));
  const AN = Object.fromEntries(TIPOS_A.map((t) => [t.replace('annual', '').replace(/^./, (c) => c.toLowerCase()), serie(ts, t)]));
  const lpa = num(K.trailingEps) ?? num(BK.trailingEps) ?? num(bq?.earningsPerShare), vpa = num(K.bookValue) ?? num(BK.bookValue);
  return {
    ticker: tk, simbolo: sym, mercado, moeda: String(P.currency || bq?.currency || moedaDe(tk)), etf, tipo: etf ? 'ETF' : tipo || 'EQUITY',
    nome: String(P.longName || P.shortName || bq?.longName || tk), setor: A.sector || BS.sector || null, industria: A.industry || BS.industry || null,
    preco, variacao_dia: num(P.regularMarketChangePercent), hora: P.regularMarketTime ? new Date(num(P.regularMarketTime)! * 1000).toISOString() : null,
    valor_mercado: num(P.marketCap) ?? num(SD.marketCap) ?? num(bq?.marketCap), volume_medio: num(SD.averageVolume),
    min52: num(SD.fiftyTwoWeekLow), max52: num(SD.fiftyTwoWeekHigh),
    pl: num(SD.trailingPE) ?? num(bq?.priceEarnings), pvp: num(K.priceToBook) ?? num(BK.priceToBook), ev_ebitda: num(K.enterpriseToEbitda) ?? num(BK.enterpriseToEbitda),
    lpa, vpa, acoes: num(K.sharesOutstanding) ?? num(BK.sharesOutstanding),
    roe: num(F.returnOnEquity) ?? num(BF.returnOnEquity), margem_liquida: num(F.profitMargins) ?? num(BF.profitMargins), margem_ebitda: num(F.ebitdaMargins) ?? num(BF.ebitdaMargins),
    divida_total: num(F.totalDebt) ?? num(BF.totalDebt), caixa: num(F.totalCash) ?? num(BF.totalCash), fcl: num(F.freeCashflow) ?? num(BF.freeCashflow), fco: num(F.operatingCashflow) ?? num(BF.operatingCashflow),
    moeda_balanco: F.financialCurrency || null,
    dy: num(SD.trailingAnnualDividendYield) ?? num(SD.dividendYield) ?? num(SD.yield), payout: num(SD.payoutRatio), dividendos_12m: div12 || null, dividendos: div.slice(-20),
    proximo_resultado: S?.calendarEvents?.earnings?.earningsDate?.[0] ? new Date(num(S.calendarEvents.earnings.earningsDate[0])! * 1000).toISOString().slice(0, 10) : null,
    data_com: S?.calendarEvents?.exDividendDate ? new Date(num(S.calendarEvents.exDividendDate)! * 1000).toISOString().slice(0, 10) : null,
    trimestral: Q, anual: AN,
    etf_info: etf ? { categoria: FP.categoryName || null, familia: FP.family || null, taxa: num(FP.feesExpensesInvestment?.annualReportExpenseRatio) ?? num(SD.expenseRatio) ?? num(FP.annualReportExpenseRatio), patrimonio: num(SD.totalAssets), ytd: num(K.ytdReturn), maiores: (S?.topHoldings?.holdings || []).slice(0, 5).map((h: any) => ({ nome: h.holdingName || h.symbol, peso: num(h.holdingPercent) })) } : null,
    fontes, avisos: erros.slice(0, 4), consultado_em: new Date().toISOString(),
  };
}

/** Candles diários e semanais (Yahoo chart), B3 ou exterior. */
export async function candles(tk: string, fetcher: typeof fetch = fetch) {
  const sym = simbolo(tk), out: Record<string, number[][]> = {};
  for (const [nome, range, interval] of [['diario', '2y', '1d'], ['semanal', '5y', '1wk']]) {
    try {
      const j = await yJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}`, fetcher, false);
      const v = j?.chart?.result?.[0], q = v?.indicators?.quote?.[0];
      out[nome] = (v?.timestamp || []).map((t: number, i: number) => [t, q.open[i], q.high[i], q.low[i], q.close[i], q.volume?.[i] || 0]).filter((c: any[]) => c.slice(1, 5).every((x) => typeof x === 'number' && x > 0));
    } catch { out[nome] = []; }
  }
  return out;
}
