// resolve.ts (v608) — dicionário + resolução dinâmica de logotipos. Copiado em logos/ e daily-panorama/ (cada função é publicada sozinha).
// Retorna, por ticker, a lista de URLs (1 logo; 2 bandeiras nos pares de moedas) e a fonte.
export type Logo = { urls: string[]; fonte: 'brapi' | 'tradingview' | 'bandeira'; par?: boolean };

const TV = (id: string) => `https://s3-symbol-logo.tradingview.com/${id}.svg`;
const BRAPI = (t: string) => `https://icons.brapi.dev/icons/${t}.svg`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

// Moeda → país (bandeira). EUR usa a bandeira da União Europeia.
export const MOEDA_PAIS: Record<string, string> = {
  USD: 'US', BRL: 'BR', EUR: 'EU', GBP: 'GB', JPY: 'JP', CHF: 'CH', CAD: 'CA', AUD: 'AU', NZD: 'NZ', CNY: 'CN', CNH: 'CN', HKD: 'HK',
  MXN: 'MX', CLP: 'CL', COP: 'CO', ARS: 'AR', PEN: 'PE', ZAR: 'ZA', TRY: 'TR', INR: 'IN', KRW: 'KR', SGD: 'SG', NOK: 'NO', SEK: 'SE',
  DKK: 'DK', PLN: 'PL', RUB: 'RU', ILS: 'IL', XAU: '', XAG: '',
};
export const bandeira = (pais: string) => TV('country/' + pais.toUpperCase());

// Apelidos do app → símbolo do TradingView (índices, futuros, commodities, cripto e juros).
export const ALIAS: Record<string, string> = {
  IBOV: 'BMFBOVESPA:IBOV', IBOVESPA: 'BMFBOVESPA:IBOV', '^BVSP': 'BMFBOVESPA:IBOV', IFIX: 'BMFBOVESPA:IFIX', SMLL: 'BMFBOVESPA:SMLL', IBXX: 'BMFBOVESPA:IBXX', IDIV: 'BMFBOVESPA:IDIV',
  WIN: 'BMFBOVESPA:WIN1!', IND: 'BMFBOVESPA:IND1!', WDO: 'BMFBOVESPA:WDO1!', DOL: 'BMFBOVESPA:DOL1!', DI: 'BMFBOVESPA:DI11!', DI1: 'BMFBOVESPA:DI11!',
  BGI: 'BMFBOVESPA:BGI1!', CCM: 'BMFBOVESPA:CCM1!', ICF: 'BMFBOVESPA:ICF1!',
  SPX: 'SP:SPX', 'S&P 500': 'SP:SPX', SP500: 'SP:SPX', '^GSPC': 'SP:SPX', NDX: 'NASDAQ:NDX', NASDAQ: 'NASDAQ:NDX', '^IXIC': 'NASDAQ:IXIC', DJI: 'DJ:DJI', RUT: 'TVC:RUT', VIX: 'TVC:VIX',
  DAX: 'XETR:DAX', UKX: 'TVC:UKX', SX5E: 'TVC:SX5E', N225: 'TVC:NI225', HSI: 'TVC:HSI', SHCOMP: 'SSE:000001', DXY: 'TVC:DXY', 'DX-Y.NYB': 'TVC:DXY',
  ES: 'CME_MINI:ES1!', NQ: 'CME_MINI:NQ1!', YM: 'CBOT_MINI:YM1!', RTY: 'CME_MINI:RTY1!',
  US10Y: 'TVC:US10Y', US02Y: 'TVC:US02Y', US2A: 'TVC:US02Y', US10A: 'TVC:US10Y', US30A: 'TVC:US30Y', BR2A: 'TVC:BR02Y', BR5A: 'TVC:BR05Y', BR10A: 'TVC:BR10Y', '^TNX': 'TVC:US10Y',
  BRENT: 'ICEEUR:BRN1!', 'BZ=F': 'ICEEUR:BRN1!', WTI: 'NYMEX:CL1!', 'CL=F': 'NYMEX:CL1!', NG: 'NYMEX:NG1!', MINERIO: 'SGX:FEF1!', 'MINÉRIO': 'SGX:FEF1!', FEF: 'SGX:FEF1!', IRON: 'SGX:FEF1!', DCE: 'DCE:I1!',
  OURO: 'TVC:GOLD', GOLD: 'TVC:GOLD', 'GC=F': 'TVC:GOLD', PRATA: 'TVC:SILVER', SILVER: 'TVC:SILVER', COBRE: 'COMEX:HG1!', SOJA: 'CBOT:ZS1!', MILHO: 'CBOT:ZC1!', TRIGO: 'CBOT:ZW1!',
  'CAFÉ': 'ICEUS:KC1!', CAFE: 'ICEUS:KC1!', 'AÇÚCAR': 'ICEUS:SB1!', ACUCAR: 'ICEUS:SB1!', 'ALGODÃO': 'ICEUS:CT1!', ALGODAO: 'ICEUS:CT1!', BOI: 'CME:LE1!',
  BTC: 'BITSTAMP:BTCUSD', ETH: 'BITSTAMP:ETHUSD', SOL: 'COINBASE:SOLUSD', XRP: 'BITSTAMP:XRPUSD', BNB: 'BINANCE:BNBUSDT', DOGE: 'BINANCE:DOGEUSDT', ADA: 'COINBASE:ADAUSD', USDT: 'BINANCE:USDTBRL',
  'BTC/BRL': 'BINANCE:BTCBRL', 'USDT/BRL': 'BINANCE:USDTBRL',
};
const CAND_EXCH = ['NASDAQ', 'NYSE', 'AMEX', 'OTC', 'BMFBOVESPA', 'TVC', 'SP', 'CBOE'];

export function normaliza(t: string): string {
  return String(t || '').trim().toUpperCase().replace(/\s+/g, ' ').replace(/\.SA$/, '');
}
/** Par de moedas ("USD/BRL", "USDBRL", "FX_IDC:USDBRL") → [base, cotada]; null se não for par. */
export function parMoedas(t: string): [string, string] | null {
  const s = normaliza(t).replace(/^[A-Z_]+:/, '');
  const m = /^([A-Z]{3})\/?([A-Z]{3})$/.exec(s);
  if (!m || !(m[1] in MOEDA_PAIS) || !(m[2] in MOEDA_PAIS) || !MOEDA_PAIS[m[1]] || !MOEDA_PAIS[m[2]]) return null;
  return [m[1], m[2]];
}
export const ehB3 = (t: string) => /^[A-Z]{4}\d{1,2}[FB]?$/.test(t);

const cache = new Map<string, { ts: number; v: Logo | null }>();
const DIA = 24 * 3600_000;
async function existe(url: string): Promise<boolean> {
  try { const r = await fetch(url, { method: 'GET', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) }); const ok = r.ok && /svg|image/.test(r.headers.get('content-type') || ''); await r.body?.cancel(); return ok; } catch { return false; }
}
async function scanLogo(simbolos: string[]): Promise<Record<string, { logo: string; base: string; cot: string }>> {
  const out: Record<string, any> = {};
  if (!simbolos.length) return out;
  try {
    const r = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { tickers: simbolos, query: { types: [] } }, columns: ['logoid', 'base_currency_logoid', 'currency_logoid', 'type'] }),
    });
    if (!r.ok) return out;
    for (const x of (await r.json())?.data || []) { const [logo, base, cot, tipo] = x.d || []; out[x.s] = { logo: logo || '', base: base || '', cot: cot || '', tipo: tipo || '' }; }
  } catch { /* fonte fora */ }
  return out;
}
const deTv = (x: { logo: string; base: string; cot: string; tipo?: string }): Logo | null => {
  if (x.tipo === 'forex' && /^country\//.test(x.base) && /^country\//.test(x.cot)) return { urls: [TV(x.base), TV(x.cot)], fonte: 'bandeira', par: true };
  const id = x.logo || x.base; return id ? { urls: [TV(id)], fonte: 'tradingview' } : null;
};

/** Resolve uma lista de tickers. Cache de 24 h por ticker na instância. */
export async function resolveLogos(lista: string[]): Promise<Record<string, Logo | null>> {
  const res: Record<string, Logo | null> = {}, falta: string[] = [];
  for (const bruto of [...new Set(lista.map(normaliza))].filter(Boolean)) {
    const c = cache.get(bruto);
    if (c && Date.now() - c.ts < DIA) { res[bruto] = c.v; continue; }
    const p = parMoedas(bruto);
    if (p) { res[bruto] = { urls: [bandeira(MOEDA_PAIS[p[0]]), bandeira(MOEDA_PAIS[p[1]])], fonte: 'bandeira', par: true }; cache.set(bruto, { ts: Date.now(), v: res[bruto] }); continue; }
    if (/^DI1[FGHJKMNQUVXZ]\d{2,4}$/.test(bruto.replace(/^BMFBOVESPA:/, ''))) { res[bruto] = { urls: [bandeira('BR')], fonte: 'bandeira' }; cache.set(bruto, { ts: Date.now(), v: res[bruto] }); continue; }
    if (/^PAIS:[A-Z]{2}$/.test(bruto)) { res[bruto] = { urls: [bandeira(bruto.slice(5))], fonte: 'bandeira' }; cache.set(bruto, { ts: Date.now(), v: res[bruto] }); continue; }
    falta.push(bruto);
  }
  // B3: brapi primeiro (ticker exato, depois o ticker base sem o número e as classes mais comuns).
  await Promise.all(falta.filter(ehB3).map(async (t) => {
    const base = t.replace(/\d+[FB]?$/, '');
    for (const c of [...new Set([t.replace(/F$/, ''), base, base + '3', base + '4', base + '11'])]) {
      if (await existe(BRAPI(c))) { res[t] = { urls: [BRAPI(c)], fonte: 'brapi' }; cache.set(t, { ts: Date.now(), v: res[t] }); return; }
    }
  }));
  // TradingView: símbolo exato, apelido ou candidatos por bolsa.
  const pend = falta.filter((t) => !res[t]);
  const cand: Record<string, string[]> = {};
  for (const t of pend) {
    const s = t;
    cand[t] = t.includes(':') ? [t] : ALIAS[t] ? [ALIAS[t]] : ehB3(t) ? ['BMFBOVESPA:' + t] : /^[A-Z]{2,6}$/.test(t) ? [...CAND_EXCH.map((e) => e + ':' + s), 'BITSTAMP:' + s + 'USD', 'BINANCE:' + s + 'USDT'] : [];
  }
  const tv = await scanLogo([...new Set(Object.values(cand).flat())]);
  for (const t of pend) {
    let v: Logo | null = null;
    for (const s of cand[t]) { const x = tv[s]; if (x) { v = deTv(x); if (v) break; } }
    res[t] = v; cache.set(t, { ts: Date.now(), v });
  }
  if (cache.size > 5000) cache.clear();
  return res;
}

/** Baixa o SVG (para o Panorama embutir como imagem). Remove scripts e eventos por segurança. */
const cacheSvg = new Map<string, { ts: number; v: string | null }>();
export async function svgDe(url: string): Promise<string | null> {
  const c = cacheSvg.get(url); if (c && Date.now() - c.ts < DIA) return c.v;
  let v: string | null = null;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    if (r.ok) { const t = await r.text(); if (/<svg[\s>]/i.test(t) && t.length < 200_000) v = t.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, ''); }
  } catch { /* sem logo */ }
  cacheSvg.set(url, { ts: Date.now(), v }); if (cacheSvg.size > 2000) cacheSvg.clear();
  return v;
}
