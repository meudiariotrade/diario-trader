import { sazonalidadeUs } from "./sazonal-us.ts";
// Função MACRO — entrada principal; publicar junto de sazonal-us.ts.

// ===== cálculo =====
// supabase/functions/macro/calc.ts — Mapa do mercado, pré-abertura da B3 e Brasil em números (funções puras, testadas em calc.test.ts).
export type Ativo = { s: string; n: string; tipo?: 'juro' };
export const MERCADOS: { g: string; itens: Ativo[] }[] = [
  { g: 'Bolsas', itens: [{ s: '^BVSP', n: 'Ibovespa' }, { s: '^GSPC', n: 'S&P 500' }, { s: '^IXIC', n: 'Nasdaq' }, { s: '^DJI', n: 'Dow Jones' }, { s: '^GDAXI', n: 'DAX' }, { s: '^FTSE', n: 'FTSE 100' }, { s: '^STOXX50E', n: 'Euro Stoxx 50' }, { s: '^N225', n: 'Nikkei' }, { s: '^HSI', n: 'Hang Seng' }, { s: '000001.SS', n: 'Xangai' }] },
  { g: 'Futuros e ADR', itens: [{ s: 'ES=F', n: 'S&P futuro' }, { s: 'NQ=F', n: 'Nasdaq futuro' }, { s: 'EWZ', n: 'EWZ (Brasil em NY)' }] },
  { g: 'Moedas', itens: [{ s: 'BRL=X', n: 'USD/BRL' }, { s: 'DX-Y.NYB', n: 'DXY' }, { s: 'EURUSD=X', n: 'EUR/USD' }, { s: 'JPY=X', n: 'USD/JPY' }, { s: 'GBPUSD=X', n: 'GBP/USD' }, { s: 'AUDUSD=X', n: 'AUD/USD' }, { s: 'CNY=X', n: 'USD/CNY' }, { s: 'MXN=X', n: 'USD/MXN' }] },
  { g: 'Commodities', itens: [{ s: 'BZ=F', n: 'Petróleo Brent' }, { s: 'CL=F', n: 'Petróleo WTI' }, { s: 'TIO=F', n: 'Minério de ferro' }, { s: 'DCE:I', n: 'Minério Dalian (China)' }, { s: 'GC=F', n: 'Ouro' }, { s: 'SI=F', n: 'Prata' }, { s: 'HG=F', n: 'Cobre' }, { s: 'ZS=F', n: 'Soja' }, { s: 'ZC=F', n: 'Milho' }, { s: 'KC=F', n: 'Café' }] },
  { g: 'Cripto', itens: [{ s: 'BTC-USD', n: 'Bitcoin' }, { s: 'ETH-USD', n: 'Ethereum' }, { s: 'SOL-USD', n: 'Solana' }, { s: 'XRP-USD', n: 'XRP' }, { s: 'BNB-USD', n: 'BNB' }] },
  { g: 'Juros dos EUA', itens: [{ s: '^TNX', n: 'Treasury 10 anos', tipo: 'juro' }, { s: '^FVX', n: 'Treasury 5 anos', tipo: 'juro' }] },
];
const r = (x: number, d = 2) => +x.toFixed(d);
/** Último preço, variação do dia (contra o fechamento anterior) e do mês; em juros, a variação vem em pontos-base. */
export function resumo(c: number[], juro = false) {
  const v = c.filter((x) => isFinite(x) && x > 0);
  if (v.length < 2) return null;
  const u = v[v.length - 1], a = v[v.length - 2], m = v[Math.max(0, v.length - 22)];
  return juro
    ? { px: r(u, 3), d1: null, m1: null, d1bp: r((u - a) * 100, 1), m1bp: r((u - m) * 100, 1), spark: v.slice(-22).map((x) => r(x, 3)) }
    : { px: r(u, u > 1000 ? 0 : u > 10 ? 2 : 4), d1: r((u / a - 1) * 100), m1: r((u / m - 1) * 100), spark: v.slice(-22).map((x) => r(x, 4)) };
}
// ---------- TradingView (principal) e Yahoo (reserva) ----------
/** Tickers do TradingView para cada ativo (tenta na ordem). */
export const TV: Record<string, string[]> = {
  '^BVSP': ['BMFBOVESPA:IBOV'], '^GSPC': ['SP:SPX'], '^IXIC': ['NASDAQ:IXIC'], '^DJI': ['DJ:DJI'], '^GDAXI': ['XETR:DAX'], '^FTSE': ['TVC:UKX'],
  '^STOXX50E': ['TVC:SX5E'], '^N225': ['TVC:NI225'], '^HSI': ['TVC:HSI'], '000001.SS': ['SSE:000001'],
  'ES=F': ['CME_MINI:ES1!'], 'NQ=F': ['CME_MINI:NQ1!'], EWZ: ['AMEX:EWZ'],
  'BRL=X': ['FX_IDC:USDBRL'], 'DX-Y.NYB': ['TVC:DXY'], 'EURUSD=X': ['FX:EURUSD'], 'JPY=X': ['FX:USDJPY'], 'GBPUSD=X': ['FX:GBPUSD'], 'AUDUSD=X': ['FX:AUDUSD'],
  'CNY=X': ['FX_IDC:USDCNY'], 'MXN=X': ['FX:USDMXN'],
  'BZ=F': ['ICEEUR:BRN1!'], 'CL=F': ['NYMEX:CL1!'], 'TIO=F': ['SGX:FEF1!', 'COMEX:TIO1!'], 'DCE:I': ['DCE:I1!'], 'GC=F': ['TVC:GOLD'], 'SI=F': ['TVC:SILVER'], 'HG=F': ['COMEX:HG1!'],
  'ZS=F': ['CBOT:ZS1!'], 'ZC=F': ['CBOT:ZC1!'], 'KC=F': ['ICEUS:KC1!'],
  '^TNX': ['TVC:US10Y'], '^FVX': ['TVC:US05Y'], 'BTC-USD': ['BITSTAMP:BTCUSD', 'COINBASE:BTCUSD'], 'ETH-USD': ['BITSTAMP:ETHUSD', 'COINBASE:ETHUSD'],
  'SOL-USD': ['COINBASE:SOLUSD', 'BINANCE:SOLUSDT'], 'XRP-USD': ['BITSTAMP:XRPUSD', 'BINANCE:XRPUSDT'], 'BNB-USD': ['BINANCE:BNBUSDT', 'BINANCE:BNBUSD'],
};
/** Mercado do screener do TradingView para quem não vier na busca global. */
export function tvMercado(t: string): string {
  const e = t.split(':')[0];
  if (e === 'BMFBOVESPA') return 'brazil';
  if (e === 'AMEX' || e === 'NASDAQ' || e === 'NYSE') return 'america';
  if (e.startsWith('FX')) return 'forex';
  if (e === 'BITSTAMP' || e === 'BINANCE' || e === 'COINBASE') return 'crypto';
  if (/^(CME|COMEX|CBOT|NYMEX|ICE|SGX|DCE|SHFE|ZCE)/.test(e)) return 'futures';
  return 'cfd';
}
/** close, variação do dia (%), variação do dia (absoluta), desempenho de 30 dias e variação do candle mensal (desde o fechamento do mês passado). */
export const TV_COLS = ['close', 'change', 'change_abs', 'Perf.1M', 'change|1M', 'update_time', 'update_mode'];
/** Lê a resposta do screener: { data: [{ s: 'TVC:DXY', d: [close, change%, change_abs, perf1m] }] }. */
export function lerTV(j: any): Record<string, { px: number; d1: number; dabs: number | null; m1: number | null; m1tipo: 'mes' | '30d' }> {
  const out: Record<string, any> = {};
  for (const x of Array.isArray(j?.data) ? j.data : []) {
    const [px, d1, dabs, p30, mes, quoteTime, updateMode] = Array.isArray(x?.d) ? x.d : [];
    const okN = (v: unknown) => typeof v === 'number' && isFinite(v), m1 = okN(mes) ? mes : okN(p30) ? p30 : null, m1tipo: 'mes' | '30d' = okN(mes) ? 'mes' : '30d';
    if (typeof x?.s === 'string' && typeof px === 'number' && px > 0 && typeof d1 === 'number' && isFinite(d1))
      out[x.s] = { simboloFonte:x.s, fonte:'TradingView', horarioPreco:typeof quoteTime === 'number' && quoteTime>0 && quoteTime<=Date.now()/1000+60 ? new Date(quoteTime*1000).toISOString():null, modoAtualizacao:updateMode || null, fechamentoAnterior:typeof dabs === 'number' && px-dabs>0 ? px-dabs : d1>-100 ? px/(1+d1/100):null, baseVariacao:'Referência diária do provedor (fechamento/ajuste anterior)', px, d1, dabs: typeof dabs === 'number' ? dabs : null, m1, m1tipo };
  }
  return out;
}
/** Fechamentos diários do Yahoo, um por dia (no fuso da bolsa), com o último preço no lugar do candle do dia.
 *  Corrige o 0,00% de fim de semana (o último preço era somado como se fosse um dia novo). */
export function serieYahoo(R: any): number[] {
  const ts: number[] = R?.timestamp || [], cl: any[] = R?.indicators?.quote?.[0]?.close || [], off = +R?.meta?.gmtoffset || 0;
  const dia = (t: number) => new Date((t + off) * 1000).toISOString().slice(0, 10);
  const D: string[] = [], V: number[] = [];
  ts.forEach((t, i) => { const v = cl[i]; if (typeof v !== 'number' || !(v > 0)) return; const d = dia(t); if (D.length && D[D.length - 1] === d) V[V.length - 1] = v; else { D.push(d); V.push(v); } });
  const u = R?.meta?.regularMarketPrice, ut = R?.meta?.regularMarketTime;
  if (typeof u === 'number' && u > 0 && typeof ut === 'number' && D.length) { const d = dia(ut); if (d === D[D.length - 1]) V[V.length - 1] = u; else if (d > D[D.length - 1]) { D.push(d); V.push(u); } }
  return V;
}
/** Maior variação diária aceitável: acima disso é dado quebrado (contrato vencido, falha da fonte). */
export const limiteDia = (s: string) => (/-USD$/.test(s) ? 25 : 12);
/** Junta TradingView (principal) e Yahoo (reserva e mini-gráfico) num item do mapa. */
export function junta(a: Ativo, tv: Record<string, { px: number; d1: number; dabs: number | null; m1: number | null; m1tipo?: 'mes' | '30d' }>, yh: number[] | null) {
  const juro = a.tipo === 'juro', y = yh ? resumo(yh, juro) : null;
  const t = (TV[a.s] || []).map((k) => tv[k]).find(Boolean);
  let it: any = null;
  if (t) it = juro
    ? { px: r(t.px, 3), d1: null, m1: null, d1bp: t.dabs != null ? r(t.dabs * 100, 1) : y?.d1bp ?? null, m1bp: y?.m1bp ?? null, spark: y?.spark || [], fonte: 'TradingView' }
    : { px: r(t.px, t.px > 1000 ? 0 : t.px > 10 ? 2 : 4), d1: r(t.d1), m1: t.m1 != null ? r(t.m1) : y?.m1 ?? null, m1tipo: t.m1 != null ? (t.m1tipo || '30d') : '30d', spark: y?.spark || [], fonte: 'TradingView' };
  else if (y && !['BZ=F','CL=F'].includes(a.s)) it = { ...y, m1tipo: '30d', fonte: 'Yahoo', simboloFonte:a.s, baseVariacao:'Últimos dois fechamentos disponíveis no histórico' };
  if (!it) return null;
  if(t)Object.assign(it,{simboloFonte:(t as any).simboloFonte,horarioPreco:(t as any).horarioPreco,modoAtualizacao:(t as any).modoAtualizacao,fechamentoAnterior:(t as any).fechamentoAnterior,baseVariacao:(t as any).baseVariacao});
  if (!juro && it.d1 != null && Math.abs(it.d1) > limiteDia(a.s)) { it.d1 = null; it.m1 = null; it.suspeito = true; }
  if (juro && it.d1bp != null && Math.abs(it.d1bp) > 60) { it.d1bp = null; it.suspeito = true; }
  return it;
}
/** Pré-abertura: o que pesa a favor ou contra a B3 antes das 10h, com peso por importância e limite por ativo. */
const PRE: { s: string; n: string; w: number; ref: number; efeito: [string, string]; sempre?: boolean }[] = [
  { s: 'ES=F', n: 'S&P futuro', w: 1, ref: 0.6, efeito: ['humor global positivo', 'humor global negativo'] },
  { s: 'EWZ', n: 'EWZ (Brasil em NY, último fechamento)', w: 0.5, ref: 1.2, efeito: ['estrangeiro comprando Brasil', 'estrangeiro vendendo Brasil'] },
  { s: 'DX-Y.NYB', n: 'DXY (dólar global)', w: -0.8, ref: 0.4, efeito: ['dólar forte pesa em emergentes', 'dólar fraco ajuda emergentes'] },
  { s: 'BRL=X', n: 'USD/BRL', w: -1, ref: 0.6, efeito: ['real se desvalorizando', 'real se valorizando'] },
  { s: 'BZ=F', n: 'Petróleo Brent', w: 0.5, ref: 1.5, efeito: ['ajuda PETR4 e PRIO3', 'pesa em PETR4 e PRIO3'] },
  { s: 'TIO=F', n: 'Minério de ferro (Singapura)', w: 0.4, ref: 1.5, efeito: ['ajuda VALE3 e siderúrgicas', 'pesa em VALE3 e siderúrgicas'], sempre: true },
  { s: 'DCE:I', n: 'Minério Dalian (China, negocia na madrugada do Brasil)', w: 0.5, ref: 2, efeito: ['ajuda VALE3 e siderúrgicas', 'pesa em VALE3 e siderúrgicas'], sempre: true },
  { s: '^HSI', n: 'Hang Seng (China)', w: 0.3, ref: 1.2, efeito: ['China ajuda commodities', 'China pesa em commodities'] },
];
/** Pré e pós-mercado de ações/ETFs dos EUA (EWZ): colunas do TradingView [close, premarket_close, premarket_change, postmarket_close, postmarket_change]. */
export type Ext = { tipo: 'pré-mercado' | 'pós-mercado' | 'overnight'; px: number; pct: number; fech: number | null };
/** noite: último preço na Blue Ocean (BOATS:, sessão overnight 20h–4h de NY, domingo a quinta), comparado ao fechamento regular. */
export function escolheExt(d: (number | null)[] | null | undefined, agoraMs = Date.now(), noite: number | null = null): Ext | null {
  if (!Array.isArray(d)) return null;
  const [fech, prePx, prePct, posPx, posPct] = d.map((x) => (typeof x === 'number' && isFinite(x) ? x : null));
  // hora de Nova York
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(agoraMs));
  const wd = p.find((x) => x.type === 'weekday')?.value || '', hh = +(p.find((x) => x.type === 'hour')?.value || 0) % 24, mm = +(p.find((x) => x.type === 'minute')?.value || 0), min = hh * 60 + mm;
  const util = !['Sat', 'Sun'].includes(wd);
  const pre = prePx != null && prePct != null ? { tipo: 'pré-mercado' as const, px: prePx, pct: r(prePct, 2), fech } : null;
  const pos = posPx != null && posPct != null ? { tipo: 'pós-mercado' as const, px: posPx, pct: r(posPct, 2), fech } : null;
  if (util && min >= 4 * 60 && min < 9 * 60 + 30) return pre || null; // antes da abertura de NY: só o pré do dia
  if (util && min >= 9 * 60 + 30 && min < 16 * 60) return null;       // pregão regular: vale o preço normal
  // sessão overnight (Blue Ocean): domingo a quinta das 20h às 24h e segunda a sexta da 0h às 4h
  const overnight = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(wd) && min >= 20 * 60) || (util && min < 4 * 60);
  if (overnight && noite != null && isFinite(noite) && noite > 0 && fech) return { tipo: 'overnight', px: noite, pct: r((noite / fech - 1) * 100, 2), fech };
  return pos || null;                                                 // depois das 16h, noite e fim de semana: último pós-mercado
}
/** Brasil em NY fora do pregão: EWZ e as ADRs das maiores empresas (pré-mercado, overnight ou pós-mercado). */
export const ADRS: { s: string; tk: string; w: number }[] = [
  { s: 'AMEX:EWZ', tk: 'EWZ', w: 2 }, { s: 'NYSE:PBR', tk: 'PBR (Petrobras)', w: 1 }, { s: 'NYSE:VALE', tk: 'VALE', w: 1 }, { s: 'NYSE:ITUB', tk: 'ITUB (Itaú)', w: 1 },
  { s: 'NYSE:BBD', tk: 'BBD (Bradesco)', w: 0.7 }, { s: 'NYSE:ABEV', tk: 'ABEV (Ambev)', w: 0.5 }, { s: 'NYSE:ERJ', tk: 'ERJ (Embraer)', w: 0.4 },
];
/** Média ponderada do Brasil em NY (só o que tem preço fora do pregão; o pregão normal a B3 já viu). */
export function brasilEmNY(ext: Record<string, Ext | null | undefined>) {
  const L = ADRS.map((a) => ({ ...a, e: ext[a.s] })).filter((a) => a.e && isFinite(a.e.pct));
  const w = L.reduce((s, a) => s + a.w, 0);
  if (!L.length || w < 1.5) return null; // pelo menos o EWZ ou duas ADRs
  return { pct: r(L.reduce((s, a) => s + a.e!.pct * a.w, 0) / w, 2), tipo: L[0].e!.tipo, itens: L.map((a) => ({ tk: a.tk, pct: a.e!.pct })) };
}
export function preAbertura(m: Record<string, { d1: number | null; ext?: Ext | null } | null>, ext: Record<string, Ext | null | undefined> = {}) {
  const itens: { n: string; d1: number; efeito: string; sinal: 1 | -1 | 0 }[] = [], semDado: { n: string; d1: null; efeito: string; sinal: 0 }[] = [];
  let pts = 0, peso = 0;
  // o Brasil em NY fora do pregão (EWZ e ADRs) é o termômetro mais direto do que a B3 vai fazer: peso 3
  const br = brasilEmNY({ 'AMEX:EWZ': m['EWZ']?.ext || null, ...ext });
  if (br) {
    const forca = Math.max(-1, Math.min(1, br.pct / 1.0)), contrib = forca * 3; pts += contrib; peso += 3;
    const sinal = Math.abs(forca) < 0.25 ? 0 : contrib > 0 ? 1 : -1;
    itens.push({ n: `Brasil em NY · ${br.tipo} (EWZ e ADRs): ${br.itens.map((x) => `${x.tk} ${x.pct > 0 ? '+' : ''}${x.pct.toFixed(2).replace('.', ',')}%`).join(' · ')}`, d1: br.pct, efeito: sinal === 0 ? 'neutro' : br.pct > 0 ? 'estrangeiro comprando Brasil' : 'estrangeiro vendendo Brasil', sinal });
  }
  for (const p of PRE) {
    if (p.s === 'EWZ' && br) continue; // já entrou no Brasil em NY
    const e2 = m[p.s]?.ext;
    const d = e2 && isFinite(e2.pct) ? e2.pct : m[p.s]?.d1;
    if (d == null || !isFinite(d)) { if (p.sempre) semDado.push({ n: p.n, d1: null, efeito: 'sem cotação agora', sinal: 0 }); continue; }
    const forca = Math.max(-1, Math.min(1, d / p.ref)), contrib = forca * p.w;
    pts += contrib; peso += Math.abs(p.w);
    const sinal = Math.abs(forca) < 0.25 ? 0 : contrib > 0 ? 1 : -1;
    const nome = e2 ? `${p.n.replace(/,? ?último fechamento/, '').replace(/\(\s*\)/, '').replace(/\s+\)/, ')')} · ${e2.tipo} ${e2.px.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${m[p.s]?.d1 != null ? `; no pregão ${(m[p.s]!.d1! > 0 ? '+' : '')}${m[p.s]!.d1!.toFixed(2).replace('.', ',')}%` : ''}` : p.n;
    itens.push({ n: nome, d1: d, efeito: sinal === 0 ? 'neutro' : (d > 0 ? p.efeito[0] : p.efeito[1]), sinal });
  }
  if (!peso) return null;
  let nota = r((pts / peso) * 100, 0); // −100 (tudo contra) a +100 (tudo a favor)
  // choque só do Brasil (eleição, fiscal, intervenção): o mundo pode estar calmo, mas é o Brasil em NY e o real que mandam
  let alerta = '';
  const brl = m['BRL=X']?.ext?.pct ?? m['BRL=X']?.d1 ?? null;
  if (br && Math.abs(br.pct) >= 1) {
    const sg = Math.sign(br.pct), piso = Math.abs(br.pct) >= 2.5 ? 80 : Math.abs(br.pct) >= 1.5 ? 60 : 35;
    if (Math.sign(nota) !== sg || Math.abs(nota) < piso) nota = sg * piso;
    alerta = `${br.pct < 0 ? 'O Brasil está caindo forte' : 'O Brasil está subindo forte'} em NY fora do pregão (média ${br.pct > 0 ? '+' : ''}${br.pct.toFixed(2).replace('.', ',')}% entre EWZ e ADRs). Isso manda no viés da abertura, mesmo com o exterior ${Math.abs(pts / peso) < 0.25 ? 'calmo' : 'na outra direção'}.`;
  } else if (brl != null && isFinite(brl) && Math.abs(brl) >= 1.5) {
    const sg = -Math.sign(brl);
    if (Math.sign(nota) !== sg || Math.abs(nota) < 45) nota = sg * 45;
    alerta = `O dólar contra o real ${brl > 0 ? 'sobe' : 'cai'} ${Math.abs(brl).toFixed(2).replace('.', ',')}%: movimento forte só do Brasil.`;
  }
  nota = Math.max(-100, Math.min(100, nota));
  const vies = nota >= 25 ? 'positivo' : nota <= -25 ? 'negativo' : 'neutro';
  return { vies, nota, forca: Math.abs(nota) >= 60 ? 'forte' : '', alerta, br, itens: [...itens.sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1)), ...semDado] };
}
/** Focus: mediana mais recente e a de ~4 semanas antes, por indicador e ano. */
export function focusResumo(rows: any[], anos: number[]) {
  const out: { ind: string; ano: number; v: number; ant: number | null; data: string }[] = [];
  for (const ind of ['IPCA', 'PIB Total', 'Câmbio', 'Selic']) for (const ano of anos) {
    const L = rows.filter((x) => x.Indicador === ind && String(x.DataReferencia) === String(ano) && isFinite(+x.Mediana)).sort((a, b) => String(b.Data).localeCompare(String(a.Data)));
    if (!L.length) continue;
    const u = L[0], lim = new Date(Date.parse(u.Data) - 26 * 864e5).toISOString().slice(0, 10), a = L.find((x) => String(x.Data) <= lim);
    out.push({ ind, ano, v: +u.Mediana, ant: a ? +a.Mediana : null, data: String(u.Data) });
  }
  return out;
}
/** Valida um indicador do Banco Central pela faixa plausível (protege de série errada ou fora do ar). */
export const plausivel = (v: number, [a, b]: [number, number]) => isFinite(v) && v >= a && v <= b;
// ---------- Minério de Dalian pelo Sina Finance (hq.sinajs.cn, contrato contínuo I0) ----------
/** var hq_str_nf_I0="铁矿石连续,145959,abertura,máxima,mínima,fech.ant,compra,venda,último,ajuste do dia,ajuste anterior,...,data"; variação contra o ajuste anterior (padrão da bolsa chinesa). */
export function leSinaNF(txt: string): { px: number; ant: number; d1: number; data: string | null } | null {
  const m = /hq_str_nf_\w+="([^"]*)"/.exec(String(txt || ''));
  if (!m || !m[1]) return null;
  const f = m[1].split(',');
  const n = (i: number) => { const v = parseFloat(f[i]); return isFinite(v) && v > 0 ? v : null; };
  const px = n(8) ?? n(9), ant = n(10) ?? n(5);
  if (px == null || ant == null || px < 100 || px > 5000) return null; // minério em yuan por tonelada
  const d1 = r((px / ant - 1) * 100);
  if (Math.abs(d1) > 12) return null;
  const data = f.find((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)) || null;
  return { px: r(px, 1), ant, d1, data };
}
/** Candles diários do Sina (getDailyKLine): [{d,o,h,l,c,v}] ou [[d,o,h,l,c,v]] dentro de um jsonp. Devolve fechamentos por data. */
export function leSinaKline(txt: string): { d: string; c: number }[] {
  const s = String(txt || ''), i = s.indexOf('['), j = s.lastIndexOf(']');
  if (i < 0 || j <= i) return [];
  try {
    const a = JSON.parse(s.slice(i, j + 1));
    return (Array.isArray(a) ? a : []).map((x: any) => Array.isArray(x) ? { d: String(x[0]), c: +x[4] } : { d: String(x?.d ?? x?.date ?? ''), c: +(x?.c ?? x?.close) })
      .filter((x) => /^\d{4}-\d{2}-\d{2}/.test(x.d) && isFinite(x.c) && x.c > 0).sort((a, b) => a.d.localeCompare(b.d));
  } catch { return []; }
}
/** Junta cotação e histórico do Sina no formato do mapa (px, d1, m1 desde o fechamento do mês passado, spark). */
export function dalianItem(q: ReturnType<typeof leSinaNF>, k: { d: string; c: number }[]) {
  if (!q) return null;
  const mes = (q.data || new Date().toISOString()).slice(0, 7);
  const antes = k.filter((x) => x.d.slice(0, 7) < mes), fm = antes.length ? antes[antes.length - 1].c : null;
  return { px: q.px, d1: q.d1, m1: fm ? r((q.px / fm - 1) * 100) : null, m1tipo: fm ? 'mes' : '30d', spark: k.slice(-21).map((x) => x.c).concat(q.px), fonte: 'Sina' };
}

// ===== servidor =====
// Agenda econômica da semana (calendário do TradingView), em português e no horário de Brasília.
export const AG_PAISES = ['BR', 'US', 'CN', 'EU', 'DE', 'GB', 'JP', 'CA'];
export const AG_NOME: Record<string, string> = { BR: 'Brasil', US: 'EUA', CN: 'China', EU: 'Zona do Euro', DE: 'Alemanha', GB: 'Reino Unido', JP: 'Japão', CA: 'Canadá' };
const BRT = -3 * 3600_000;

/** Janela da semana: do domingo (eventos de "antes da semana", como a China) ao sábado. No sábado já mostra a próxima. */
export function janelaSemana(agoraMs = Date.now(), desloc = 0) {
  const l = new Date(agoraMs + BRT); // relógio de Brasília em campos UTC
  const dow = l.getUTCDay();
  const ini = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()) - (dow === 6 ? -1 : dow) * 86400_000 + desloc * 7 * 86400_000;
  return { de: new Date(ini - BRT).toISOString(), ate: new Date(ini + 6 * 86400_000 - BRT).toISOString() };
}

// Traduções mais comuns (ordem importa: o mais específico primeiro)
const TR: [RegExp, string][] = [
  [/\bNAHB Housing Market In(dex|dx)\b/i, 'Confiança das construtoras (NAHB)'],
  [/\bIGP-10 Inflation Index\b/i, 'IGP-10'], [/\bIGP-M Inflation Index\b/i, 'IGP-M'], [/\bIGP-DI Inflation Index\b/i, 'IGP-DI'],
  [/\bMid-?month CPI\b|\bIPCA-15\b|\bIPCA Inflation Index \(mid-?month\)/i, 'IPCA-15'],
  [/\bIPCA Inflation Index\b/i, 'IPCA'],
  [/\bInterest Rate Decision\b/i, 'Decisão de juros'],
  [/\bCore Inflation Rate\b|\bCore CPI\b/i, 'Núcleo da inflação (CPI)'],
  [/\bInflation Rate\b|\bCPI\b/i, 'Inflação ao consumidor (CPI)'],
  [/\bCore PCE Price Index\b/i, 'Núcleo do PCE'], [/\bPCE Price Index\b/i, 'Inflação PCE'],
  [/\bPPI\b/i, 'Inflação ao produtor (PPI)'],
  [/\bGDP Growth Rate\b|\bGDP\b/i, 'PIB'],
  [/\bRetail Sales\b/i, 'Vendas no varejo'],
  [/\bIndustrial Production\b/i, 'Produção industrial'],
  [/\bFixed Asset Investment\b/i, 'Investimento em ativos fixos'],
  [/\bLoan Prime Rate\b/i, 'LPR (juro de referência)'],
  [/\bUnemployment Rate\b/i, 'Taxa de desemprego'],
  [/\bInitial Jobless Claims\b/i, 'Pedidos de auxílio-desemprego'], [/\bContinuing Jobless Claims\b/i, 'Pedidos contínuos de auxílio-desemprego'],
  [/\bNon ?Farm Payrolls\b/i, 'Payroll (empregos fora do agro)'],
  [/\bADP Employment Change\b/i, 'ADP: emprego privado'],
  [/\bAverage Earnings\b/i, 'Salários médios'], [/\bClaimant Count Change\b/i, 'Pedidos de seguro-desemprego'], [/\bEmployment Change\b/i, 'Variação do emprego'],
  [/\bBuilding Permits\b/i, 'Licenças de construção'], [/\bHousing Starts\b/i, 'Construção de casas iniciadas'],
  [/\bPending Home Sales\b/i, 'Vendas pendentes de imóveis'], [/\bExisting Home Sales\b/i, 'Vendas de imóveis usados'], [/\bNew Home Sales\b/i, 'Vendas de imóveis novos'],
  [/\bMichigan Consumer Sentiment\b/i, 'Sentimento do consumidor (Michigan)'], [/\bMichigan Inflation Expectations\b/i, 'Expectativa de inflação (Michigan)'],
  [/\bInflation Expectations\b/i, 'Expectativa de inflação'],
  [/\bConsumer Confidence\b/i, 'Confiança do consumidor'], [/\bBusiness Confidence\b/i, 'Confiança empresarial'],
  [/\bZEW Economic Sentiment Index\b|\bZEW Economic Sentiment\b/i, 'ZEW: sentimento econômico'],
  [/\bIfo Business Climate\b/i, 'Ifo: clima de negócios'],
  [/\bManufacturing PMI\b/i, 'PMI industrial'], [/\bServices PMI\b/i, 'PMI de serviços'], [/\bComposite PMI\b/i, 'PMI composto'],
  [/\bISM Manufacturing\b/i, 'ISM industrial'], [/\bISM Services\b|\bISM Non-Manufacturing\b/i, 'ISM de serviços'],
  [/\b(CB )?Leading (Economic )?Index\b/i, 'Indicadores antecedentes (LEI)'],
  [/\bTrade Balance\b/i, 'Balança comercial'], [/\bCurrent Account\b/i, 'Conta corrente'],
  [/\bCrude Oil (Inventories|Stocks Change)\b|\bEIA Crude Oil Stocks Change\b/i, 'Estoques de petróleo (EIA)'],
  [/\bDurable Goods Orders\b/i, 'Encomendas de bens duráveis'], [/\bPersonal Income\b/i, 'Renda pessoal'], [/\bPersonal Spending\b/i, 'Gastos pessoais'],
  [/\bFOMC Minutes\b/i, 'Ata do FOMC'], [/\bCopom Minutes\b/i, 'Ata do Copom'], [/\bMonetary Policy Meeting Minutes\b/i, 'Ata de política monetária'],
  [/\bSpeech\b|\bSpeaks\b/i, 'discurso'],
  [/\bBCB Focus Market Readout\b|\bFocus Market Readout\b/i, 'Relatório Focus'],
  [/\bIBC-Br\b.*$/i, 'IBC-Br (prévia do PIB)'],
  [/\bTax Revenue\b/i, 'Arrecadação federal'], [/\bBudget Balance\b/i, 'Resultado fiscal'],
];
const PER: [RegExp, string][] = [[/\bQoQ\b/g, 'tri/tri'], [/\bYoY\b/g, 'anual'], [/\bMoM\b/g, 'mensal'], [/\bPrel(iminary)?\b/gi, 'prévia'], [/\bFinal\b/g, 'final'], [/\bFlash\b/gi, 'prévia']];
export function traduz(t: string) {
  let s = String(t || '').replace(/\*+\s*$/, '').replace(/\s+/g, ' ').trim();
  for (const [re, pt] of TR) if (re.test(s)) { s = s.replace(re, pt); break; }
  for (const [re, pt] of PER) s = s.replace(re, pt);
  return s;
}
/** Rotina que só polui a agenda: leilões de títulos, inspeções de grãos, sondas, Redbook. */
export const ROTINA = /\bBill Auc|\bAuction\b|\bAuc\b|Inspected|Baker Hughes|Rig Count|Redbook|MBA (Mortgage|Purchase)|Mortgage (Applications|Rate)|\bAPI (Crude|Weekly)|Cushing|Gasoline (Inventories|Stocks)|Distillate|Heating Oil|Natural Gas Stor|Refinery|Treasury Bill|Bond Auction|Note Auction|Bund Auction|Gilt Auction|JGB Auction|CFTC|Commitments of Traders|Speculative Net/i;

export type Evento = { id: string; p: string; t: string; orig: string; em: string; imp: number; per?: string; ant?: string; proj?: string; atual?: string; rotina?: boolean; extra?: boolean };
const fmt = (v: any, unit?: string, scale?: string) => v == null || v === '' ? undefined : `${typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : v}${scale || ''}${unit ? (unit === '%' ? '%' : ' ' + unit) : ''}`;

export function normalizaAgenda(raw: any, de: string, ate: string): Evento[] {
  const arr: any[] = Array.isArray(raw?.result) ? raw.result : Array.isArray(raw) ? raw : [];
  const out: Evento[] = [];
  const vistos = new Set<string>();
  for (const x of arr) {
    const p = String(x?.country || '').toUpperCase(), em = x?.date;
    if (!AG_PAISES.includes(p) || !em || isNaN(Date.parse(em))) continue;
    const orig = String(x.title || x.indicator || '').trim(); if (!orig) continue;
    const k = p + '|' + orig + '|' + em; if (vistos.has(k)) continue; vistos.add(k);
    const imp = typeof x.importance === 'number' ? Math.max(-1, Math.min(1, x.importance)) : -1;
    out.push({ id: String(x.id ?? k), p, t: traduz(orig), orig, em: new Date(em).toISOString(), imp, per: x.period || undefined,
      ant: fmt(x.previous, x.unit, x.scale), proj: fmt(x.forecast, x.unit, x.scale), atual: fmt(x.actual, x.unit, x.scale), rotina: ROTINA.test(orig) || undefined });
  }
  // Focus do Banco Central: toda segunda às 8h25 (às vezes não vem no calendário)
  for (let d = Date.parse(de); d < Date.parse(ate); d += 86400_000) {
    const l = new Date(d + BRT);
    if (l.getUTCDay() !== 1) continue;
    const dia = l.toISOString().slice(0, 10);
    if (out.some((e) => e.p === 'BR' && /focus/i.test(e.orig + e.t) && new Date(Date.parse(e.em) + BRT).toISOString().slice(0, 10) === dia)) continue;
    out.push({ id: 'focus-' + dia, p: 'BR', t: 'Relatório Focus', orig: 'Focus', em: new Date(Date.parse(dia + 'T08:25:00-03:00')).toISOString(), imp: 0, extra: true });
  }
  return out.sort((a, b) => a.em.localeCompare(b.em) || b.imp - a.imp);
}

// ===== servidor =====
// Desempenho por setor (EUA: ETFs setoriais SPDR do S&P 500; Brasil: índices setoriais da B3), ranqueado por período.
export const SETORES: Record<'us' | 'br', { tk: string; n: string }[]> = {
  us: [
    { tk: 'AMEX:XLY', n: 'Consumo discricionário' }, { tk: 'AMEX:XLK', n: 'Tecnologia' }, { tk: 'AMEX:XLC', n: 'Comunicação' },
    { tk: 'AMEX:XLV', n: 'Saúde' }, { tk: 'AMEX:XLB', n: 'Materiais' }, { tk: 'AMEX:XLE', n: 'Energia' },
    { tk: 'AMEX:XLI', n: 'Industrial' }, { tk: 'AMEX:XLP', n: 'Consumo básico' }, { tk: 'AMEX:XLF', n: 'Financeiro' },
    { tk: 'AMEX:XLRE', n: 'Imobiliário' }, { tk: 'AMEX:XLU', n: 'Utilidades' },
  ],
  br: [
    { tk: 'BMFBOVESPA:IFNC', n: 'Financeiro' }, { tk: 'BMFBOVESPA:IMAT', n: 'Materiais básicos' }, { tk: 'BMFBOVESPA:IEEX', n: 'Energia elétrica' },
    { tk: 'BMFBOVESPA:UTIL', n: 'Utilidade pública' }, { tk: 'BMFBOVESPA:ICON', n: 'Consumo' }, { tk: 'BMFBOVESPA:IMOB', n: 'Imobiliário' },
    { tk: 'BMFBOVESPA:INDX', n: 'Industrial' }, { tk: 'BMFBOVESPA:IFIX', n: 'Fundos imobiliários' }, { tk: 'BMFBOVESPA:SMLL', n: 'Small caps' },
    { tk: 'BMFBOVESPA:IDIV', n: 'Dividendos' },
  ],
};
export const REF = { us: { tk: 'SP:SPX', n: 'S&P 500' }, br: { tk: 'BMFBOVESPA:IBOV', n: 'Ibovespa' } };
/** Colunas do screener do TradingView: variação do dia, semana (5 pregões), 1 mês e 3 meses, em %. */
export const SET_COLS = ['change', 'Perf.W', 'Perf.1M', 'Perf.3M'];
export const PERIODOS = [['d', 'Hoje'], ['w', '5 dias'], ['m', '1 mês'], ['t', '3 meses']] as const;
type Lin = { tk: string; n: string; d: number | null; w: number | null; m: number | null; t: number | null };
const num = (v: any) => (typeof v === 'number' && isFinite(v) && Math.abs(v) < 300 ? Math.round(v * 100) / 100 : null);

/** Junta a resposta do screener ({data:[{s,d:[...]}]}) com a lista de setores. */
export function leSetores(j: any, lista: { tk: string; n: string }[]): Lin[] {
  const m = new Map<string, any[]>();
  for (const x of j?.data || []) if (x && typeof x.s === 'string' && Array.isArray(x.d)) m.set(x.s, x.d);
  return lista.map((s) => { const d = m.get(s.tk); return { tk: s.tk, n: s.n, d: num(d?.[0]), w: num(d?.[1]), m: num(d?.[2]), t: num(d?.[3]) }; })
    .filter((x) => x.d != null || x.w != null || x.m != null || x.t != null);
}

/** Destaques automáticos: quem liderou e quem ficou para trás em cada período. */
export function destaques(L: Lin[]) {
  const out: { p: string; txt: string }[] = [];
  const nome = (x: Lin) => x.n.replace(/ \(.*\)$/, '');
  const lista = (a: string[]) => a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || '';
  for (const [k, rot] of PERIODOS) {
    const v = L.filter((x) => x[k] != null).sort((a, b) => (b[k] as number) - (a[k] as number));
    if (v.length < 4) continue;
    const top = v.slice(0, 2).filter((x) => (x[k] as number) > 0), fim = v.slice(-2).reverse().filter((x) => (x[k] as number) < 0);
    const sobe = v.filter((x) => (x[k] as number) > 0).length;
    const ab = rot === 'Hoje' ? 'Hoje' : rot === '5 dias' ? 'Em 5 dias' : rot === '1 mês' ? 'Em 1 mês' : 'Em 3 meses';
    const partes = [top.length ? `${lista(top.map(nome))} lideraram` : 'nenhum setor subiu', fim.length ? `${lista(fim.map(nome))} ficaram para trás` : 'nenhum setor caiu'];
    out.push({ p: k, txt: `${ab}, ${partes.join('; ')} (${sobe} de ${v.length} em alta).` });
  }
  return out;
}

// ===== servidor =====
// Painel "Visão geral do mercado": gráficos de área de 2 anos (o app recorta 13, 26, 52 ou 104 semanas).
export const PAINEL: { s: string; n: string; un?: string; dp?: number }[] = [
  { s: '^BVSP', n: 'IBOV', dp: 0 }, { s: '^GSPC', n: 'S&P 500' }, { s: '^IXIC', n: 'NASDAQ' }, { s: '^STOXX', n: 'STOXX 600' },
  { s: '^HSI', n: 'HANG SENG' }, { s: '^VIX', n: 'VIX' }, { s: 'GC=F', n: 'OURO', un: 'US$/oz' }, { s: 'BRL=X', n: 'DÓLAR/REAL', dp: 4 },
  { s: 'BTC-USD', n: 'BITCOIN', un: 'US$' }, { s: '^TNX', n: 'TREASURY 10 ANOS', un: '%', dp: 3 }, { s: 'DX-Y.NYB', n: 'DXY' },
  { s: 'BZ=F', n: 'BRENT', un: 'US$' }, { s: 'DCE:I', n: 'MINÉRIO DALIAN', un: 'yuan/t', dp: 1 },
];
const dia = (t: number) => new Date(t * 1000 - 3 * 3600_000).toISOString().slice(0, 10);
/** Série diária [data, fechamento] do Yahoo (chart v8), um ponto por dia (o último do dia vale). */
export function serieDiaria(res: any): [string, number][] {
  const ts: number[] = res?.timestamp || [], c: any[] = res?.indicators?.quote?.[0]?.close || [];
  const m = new Map<string, number>();
  ts.forEach((t, i) => { const v = c[i]; if (typeof v === 'number' && isFinite(v) && v > 0) m.set(dia(t), v); });
  const px = res?.meta?.regularMarketPrice, tm = res?.meta?.regularMarketTime;
  if (typeof px === 'number' && px > 0 && typeof tm === 'number') m.set(dia(tm), px);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
/** Resumo do quadro: último valor, variação do dia (absoluta e %) e data. */
export function quadro(it: { s: string; n: string; un?: string; dp?: number }, pts: [string, number][]) {
  if (pts.length < 5) return null;
  const casas = it.dp ?? 2, r = (x: number, d = casas) => +x.toFixed(d);
  const [d1, u] = pts[pts.length - 1], a = pts[pts.length - 2][1];
  return { s: it.s, n: it.n, un: it.un || '', dp: casas, data: d1, px: r(u), d1abs: r(u - a), d1: +((u / a - 1) * 100).toFixed(2), pts: pts.map(([d, v]) => [d, r(v)] as [string, number]) };
}
/** Tickers do TradingView para o painel (os que não estão no mapa do Mundo). */
export const PAINEL_TV: Record<string, string[]> = { '^STOXX': ['TVC:SXXP', 'STOXX:SXXP'], '^VIX': ['TVC:VIX', 'CBOE:VIX'] };
/** Cotação do TradingView no quadro: último valor, variação do dia e o último ponto do gráfico (o histórico continua do Yahoo).
 *  Em dia útil, se o Yahoo ainda não tem o ponto de hoje, acrescenta; no fim de semana só troca o último (cripto acrescenta sempre). */
export function aplicaTV(q: ReturnType<typeof quadro>, t: { px: number; d1: number; dabs: number | null } | null | undefined, hoje: string, diaUtil: boolean, cripto = false) {
  if (!q || !t || !(t.px > 0)) return q;
  const casas = q.dp, r = (x: number) => +x.toFixed(casas);
  const ult = q.pts[q.pts.length - 1][1];
  // histórico do Yahoo muito diferente do TradingView (contrato ou fonte diferente): números do TradingView, gráfico do Yahoo sem emendar
  if (!cripto && ult > 0 && Math.abs(t.px / ult - 1) > 0.15) {
    const dabs0 = t.dabs != null && isFinite(t.dabs) ? t.dabs : t.px - t.px / (1 + t.d1 / 100);
    return { ...q, px: r(t.px), d1: +t.d1.toFixed(2), d1abs: r(dabs0), fonte: 'TradingView', aviso: 'gráfico do Yahoo em escala diferente da cotação do TradingView' };
  }
  const pts = q.pts.slice(), u = pts[pts.length - 1];
  if (u[0] === hoje) pts[pts.length - 1] = [hoje, r(t.px)];
  else if ((diaUtil || cripto) && u[0] < hoje && t.d1 !== 0) pts.push([hoje, r(t.px)]);
  else pts[pts.length - 1] = [u[0], r(t.px)];
  const dabs = t.dabs != null && isFinite(t.dabs) ? t.dabs : t.px - t.px / (1 + t.d1 / 100);
  return { ...q, px: r(t.px), d1: +t.d1.toFixed(2), d1abs: r(dabs), data: pts[pts.length - 1][0], pts, fonte: 'TradingView' };
}

// ===== servidor =====
// Aba "Cotações" do app (Mercado): listas por grupo, com preço e variação do dia, pelo screener público do TradingView.
// Atenção: ações e futuros da B3 no TradingView gratuito chegam com cerca de 15 min de atraso; moedas e cripto quase em tempo real.
export type Cq = { s: string; n: string; dp?: number; un?: string; c?: string };
const B = (t: string, n: string, dp = 2): Cq => ({ s: 'BMFBOVESPA:' + t, n, dp, c: t });
const U = (ex: string, t: string, n: string): Cq => ({ s: `${ex}:${t}`, n, c: t });
export const ABAS: Record<string, { nome: string; itens: Cq[] }> = {
  fut: { nome: 'Futuros', itens: [
    { s: 'BMFBOVESPA:WIN1!', n: 'Mini índice (WIN)', dp: 0, c: 'WIN' }, { s: 'BMFBOVESPA:WDO1!', n: 'Mini dólar (WDO)', dp: 1, c: 'WDO' },
    { s: 'BMFBOVESPA:IND1!', n: 'Índice cheio (IND)', dp: 0, c: 'IND' }, { s: 'BMFBOVESPA:DOL1!', n: 'Dólar cheio (DOL)', dp: 1, c: 'DOL' },
    { s: 'BMFBOVESPA:BGI1!', n: 'Boi gordo (BGI)', c: 'BGI' }, { s: 'BMFBOVESPA:CCM1!', n: 'Milho (CCM)', c: 'CCM' }, { s: 'BMFBOVESPA:ICF1!', n: 'Café arábica (ICF)', c: 'ICF' },
    { s: 'CME_MINI:ES1!', n: 'S&P 500 futuro', c: 'ES' }, { s: 'CME_MINI:NQ1!', n: 'Nasdaq futuro', c: 'NQ' }, { s: 'CBOT_MINI:YM1!', n: 'Dow Jones futuro', dp: 0, c: 'YM' },
    { s: 'CME_MINI:RTY1!', n: 'Russell 2000 futuro', c: 'RTY' },
  ] },
  idx: { nome: 'Índices', itens: [
    { s: 'BMFBOVESPA:IBOV', n: 'Ibovespa', dp: 0, c: 'IBOV' }, { s: 'BMFBOVESPA:IBXX', n: 'IBrX 100', dp: 0, c: 'IBXX' }, { s: 'BMFBOVESPA:SMLL', n: 'Small caps', dp: 0, c: 'SMLL' },
    { s: 'BMFBOVESPA:IFIX', n: 'IFIX (fundos imobiliários)', dp: 0, c: 'IFIX' }, { s: 'BMFBOVESPA:IDIV', n: 'Dividendos (IDIV)', dp: 0, c: 'IDIV' },
    { s: 'SP:SPX', n: 'S&P 500', c: 'SPX' }, { s: 'NASDAQ:NDX', n: 'Nasdaq 100', c: 'NDX' }, { s: 'DJ:DJI', n: 'Dow Jones', dp: 0, c: 'DJI' }, { s: 'TVC:RUT', n: 'Russell 2000', c: 'RUT' },
    { s: 'TVC:VIX', n: 'VIX (medo)', c: 'VIX' }, { s: 'XETR:DAX', n: 'DAX (Alemanha)', dp: 0, c: 'DAX' }, { s: 'TVC:UKX', n: 'FTSE 100 (Londres)', dp: 0, c: 'UKX' },
    { s: 'TVC:SX5E', n: 'Euro Stoxx 50', dp: 0, c: 'SX5E' }, { s: 'TVC:NI225', n: 'Nikkei (Japão)', dp: 0, c: 'N225' }, { s: 'TVC:HSI', n: 'Hang Seng (Hong Kong)', dp: 0, c: 'HSI' },
    { s: 'SSE:000001', n: 'Xangai', c: 'SHCOMP' },
  ] },
  br: { nome: 'Ações BR', itens: [
    B('PETR4', 'Petrobras PN'), B('VALE3', 'Vale'), B('ITUB4', 'Itaú Unibanco'), B('BBDC4', 'Bradesco PN'), B('BBAS3', 'Banco do Brasil'), B('B3SA3', 'B3'), B('ABEV3', 'Ambev'),
    B('WEGE3', 'WEG'), B('PRIO3', 'PRIO'), B('ITSA4', 'Itaúsa'), B('BPAC11', 'BTG Pactual'), B('SUZB3', 'Suzano'), B('ELET3', 'Eletrobras'), B('RENT3', 'Localiza'),
    B('EQTL3', 'Equatorial'), B('RADL3', 'Raia Drogasil'), B('GGBR4', 'Gerdau PN'), B('CSNA3', 'CSN'), B('USIM5', 'Usiminas'), B('EMBR3', 'Embraer'),
    B('VBBR3', 'Vibra'), B('LREN3', 'Lojas Renner'), B('MGLU3', 'Magazine Luiza'), B('RAIL3', 'Rumo'), B('SBSP3', 'Sabesp'), B('CMIG4', 'Cemig PN'),
  ] },
  us: { nome: 'Ações EUA', itens: [
    U('NASDAQ', 'AAPL', 'Apple'), U('NASDAQ', 'MSFT', 'Microsoft'), U('NASDAQ', 'NVDA', 'Nvidia'), U('NASDAQ', 'AMZN', 'Amazon'), U('NASDAQ', 'GOOGL', 'Alphabet (Google)'),
    U('NASDAQ', 'META', 'Meta'), U('NASDAQ', 'TSLA', 'Tesla'), U('NASDAQ', 'AVGO', 'Broadcom'), U('NYSE', 'BRK.B', 'Berkshire Hathaway'), U('NYSE', 'JPM', 'JPMorgan'),
    U('NYSE', 'V', 'Visa'), U('NASDAQ', 'NFLX', 'Netflix'), U('NASDAQ', 'AMD', 'AMD'), U('NASDAQ', 'COST', 'Costco'), U('NYSE', 'XOM', 'ExxonMobil'),
    U('NYSE', 'WMT', 'Walmart'), U('NYSE', 'LLY', 'Eli Lilly'), U('NASDAQ', 'PLTR', 'Palantir'),
    U('NYSE', 'CRM', 'Salesforce'),
    U('NYSE', 'NET', 'Cloudflare'),
    U('NASDAQ', 'GTLB', 'GitLab'),
    U('NYSE', 'RDDT', 'Reddit'),
    U('NYSE', 'PINS', 'Pinterest'),
    U('NYSE', 'SNAP', 'Snap'),
    U('NASDAQ', 'EBAY', 'eBay'),
    U('NASDAQ', 'ETSY', 'Etsy'),
    U('NYSE', 'UBER', 'Uber'),
    U('NASDAQ', 'ABNB', 'Airbnb'),
    U('NASDAQ', 'PYPL', 'PayPal'),
    U('NYSE', 'SPOT', 'Spotify'),
    U('NASDAQ', 'SHOP', 'Shopify'),
    U('NASDAQ', 'INTC', 'Intel'),
    U('NYSE', 'MA', 'Mastercard'),
    U('NASDAQ', 'QCOM', 'Qualcomm'),
  ] },
  adr: { nome: 'ADRs', itens: [
    U('AMEX', 'EWZ', 'EWZ (Brasil em NY)'), U('NYSE', 'PBR', 'Petrobras'), U('NYSE', 'VALE', 'Vale'), U('NYSE', 'ITUB', 'Itaú'), U('NYSE', 'BBD', 'Bradesco'),
    U('NYSE', 'ABEV', 'Ambev'), U('NYSE', 'SBS', 'Sabesp'), U('NYSE', 'ERJ', 'Embraer'), U('NYSE', 'GGB', 'Gerdau'), U('NYSE', 'SID', 'CSN'), U('NYSE', 'SUZ', 'Suzano'),
    U('NYSE', 'CIG', 'Cemig'), U('NYSE', 'NU', 'Nubank'), U('NASDAQ', 'XP', 'XP'), U('NASDAQ', 'STNE', 'StoneCo'), U('NYSE', 'PAGS', 'PagSeguro'), U('NYSE', 'BSBR', 'Santander Brasil'),
  ] },
  fx: { nome: 'Moedas', itens: [
    { s: 'FX_IDC:USDBRL', n: 'Dólar / Real', dp: 4, c: 'USD/BRL' }, { s: 'FX_IDC:EURBRL', n: 'Euro / Real', dp: 4, c: 'EUR/BRL' }, { s: 'TVC:DXY', n: 'Índice do dólar (DXY)', c: 'DXY' },
    { s: 'FX:EURUSD', n: 'Euro / Dólar', dp: 5, c: 'EUR/USD' }, { s: 'FX:GBPUSD', n: 'Libra / Dólar', dp: 5, c: 'GBP/USD' }, { s: 'FX:USDJPY', n: 'Dólar / Iene', dp: 3, c: 'USD/JPY' },
    { s: 'FX:AUDUSD', n: 'Dólar australiano / Dólar', dp: 5, c: 'AUD/USD' }, { s: 'FX:USDCAD', n: 'Dólar / Dólar canadense', dp: 5, c: 'USD/CAD' }, { s: 'FX:USDCHF', n: 'Dólar / Franco suíço', dp: 5, c: 'USD/CHF' },
    { s: 'FX:NZDUSD', n: 'Dólar neozelandês / Dólar', dp: 5, c: 'NZD/USD' }, { s: 'FX:EURJPY', n: 'Euro / Iene', dp: 3, c: 'EUR/JPY' }, { s: 'FX:GBPJPY', n: 'Libra / Iene', dp: 3, c: 'GBP/JPY' },
    { s: 'FX:EURGBP', n: 'Euro / Libra', dp: 5, c: 'EUR/GBP' }, { s: 'FX:USDMXN', n: 'Dólar / Peso mexicano', dp: 4, c: 'USD/MXN' }, { s: 'FX_IDC:USDCNY', n: 'Dólar / Yuan', dp: 4, c: 'USD/CNY' },
    { s: 'FX:AUDCAD', n: 'Dólar australiano / Dólar canadense', dp: 5, c: 'AUD/CAD' },
    { s: 'FX:AUDJPY', n: 'Dólar australiano / Iene', dp: 3, c: 'AUD/JPY' },
    { s: 'FX:CADJPY', n: 'Dólar canadense / Iene', dp: 3, c: 'CAD/JPY' },
    { s: 'FX:EURAUD', n: 'Euro / Dólar australiano', dp: 5, c: 'EUR/AUD' },
    { s: 'FX:EURCAD', n: 'Euro / Dólar canadense', dp: 5, c: 'EUR/CAD' },
    { s: 'FX:EURCHF', n: 'Euro / Franco suíço', dp: 5, c: 'EUR/CHF' },
    { s: 'FX:EURNZD', n: 'Euro / Dólar neozelandês', dp: 5, c: 'EUR/NZD' },
    { s: 'FX:GBPAUD', n: 'Libra / Dólar australiano', dp: 5, c: 'GBP/AUD' },
    { s: 'FX:GBPCAD', n: 'Libra / Dólar canadense', dp: 5, c: 'GBP/CAD' },
    { s: 'FX:GBPCHF', n: 'Libra / Franco suíço', dp: 5, c: 'GBP/CHF' },
    { s: 'FX:NZDCAD', n: 'Dólar neozelandês / Dólar canadense', dp: 5, c: 'NZD/CAD' },
    { s: 'FX:NZDJPY', n: 'Dólar neozelandês / Iene', dp: 3, c: 'NZD/JPY' },
    { s: 'FX:CHFJPY', n: 'Franco suíço / Iene', dp: 3, c: 'CHF/JPY' },
    { s: 'FX_IDC:USDNOK', n: 'Dólar / Coroa norueguesa', dp: 4, c: 'USD/NOK' },
    { s: 'FX_IDC:USDSEK', n: 'Dólar / Coroa sueca', dp: 4, c: 'USD/SEK' },
    { s: 'FX_IDC:USDSGD', n: 'Dólar / Dólar de Singapura', dp: 5, c: 'USD/SGD' },
    { s: 'FX_IDC:USDZAR', n: 'Dólar / Rand sul-africano', dp: 4, c: 'USD/ZAR' },
    { s: 'OANDA:XAUUSD', n: 'Ouro à vista (XAU/USD)', c: 'XAU/USD' },
  ] },
  cmd: { nome: 'Commodities', itens: [
    { s: 'ICEEUR:BRN1!', n: 'Petróleo Brent', un: 'US$', c: 'BRENT' }, { s: 'NYMEX:CL1!', n: 'Petróleo WTI', un: 'US$', c: 'WTI' }, { s: 'NYMEX:NG1!', n: 'Gás natural', un: 'US$', dp: 3, c: 'NG' },
    { s: 'SGX:FEF1!', n: 'Minério de ferro (Singapura)', un: 'US$/t', c: 'FEF' }, { s: 'DCE:I1!', n: 'Minério de ferro (Dalian)', un: 'yuan/t', dp: 1, c: 'DCE' },
    { s: 'TVC:GOLD', n: 'Ouro', un: 'US$/oz', c: 'OURO' }, { s: 'TVC:SILVER', n: 'Prata', un: 'US$/oz', dp: 3, c: 'PRATA' }, { s: 'COMEX:HG1!', n: 'Cobre', un: 'US$/lb', dp: 4, c: 'COBRE' },
    { s: 'CBOT:ZS1!', n: 'Soja (Chicago)', un: '¢/bu', c: 'SOJA' }, { s: 'CBOT:ZC1!', n: 'Milho (Chicago)', un: '¢/bu', c: 'MILHO' }, { s: 'CBOT:ZW1!', n: 'Trigo (Chicago)', un: '¢/bu', c: 'TRIGO' },
    { s: 'ICEUS:KC1!', n: 'Café (NY)', un: '¢/lb', c: 'CAFÉ' }, { s: 'ICEUS:SB1!', n: 'Açúcar (NY)', un: '¢/lb', c: 'AÇÚCAR' }, { s: 'ICEUS:CT1!', n: 'Algodão (NY)', un: '¢/lb', c: 'ALGODÃO' },
    { s: 'CME:LE1!', n: 'Boi vivo (Chicago)', un: '¢/lb', dp: 3, c: 'BOI' },
  ] },
  cri: { nome: 'Cripto', itens: [
    { s: 'BITSTAMP:BTCUSD', n: 'Bitcoin', un: 'US$', c: 'BTC' }, { s: 'BITSTAMP:ETHUSD', n: 'Ethereum', un: 'US$', c: 'ETH' }, { s: 'COINBASE:SOLUSD', n: 'Solana', un: 'US$', c: 'SOL' },
    { s: 'BITSTAMP:XRPUSD', n: 'XRP', un: 'US$', dp: 4, c: 'XRP' }, { s: 'BINANCE:BNBUSDT', n: 'BNB', un: 'US$', c: 'BNB' }, { s: 'BINANCE:DOGEUSDT', n: 'Dogecoin', un: 'US$', dp: 5, c: 'DOGE' },
    { s: 'COINBASE:ADAUSD', n: 'Cardano', un: 'US$', dp: 4, c: 'ADA' }, { s: 'BINANCE:BTCBRL', n: 'Bitcoin em reais', un: 'R$', dp: 0, c: 'BTC/BRL' }, { s: 'BINANCE:USDTBRL', n: 'Tether em reais', un: 'R$', dp: 3, c: 'USDT/BRL' },
  ] },
  jur: { nome: 'Juros', itens: [
    { s: 'TVC:BR02Y', n: 'Título do governo BR 2 anos', un: '%', dp: 3, c: 'BR2A' }, { s: 'TVC:BR05Y', n: 'Título do governo BR 5 anos', un: '%', dp: 3, c: 'BR5A' },
    { s: 'TVC:BR10Y', n: 'Título do governo BR 10 anos', un: '%', dp: 3, c: 'BR10A' }, { s: 'TVC:US02Y', n: 'Treasury 2 anos', un: '%', dp: 3, c: 'US2A' },
    { s: 'TVC:US10Y', n: 'Treasury 10 anos', un: '%', dp: 3, c: 'US10A' }, { s: 'TVC:US30Y', n: 'Treasury 30 anos', un: '%', dp: 3, c: 'US30A' },
    { s: 'TVC:DE10Y', n: 'Alemanha 10 anos', un: '%', dp: 3, c: 'DE10A' }, { s: 'TVC:JP10Y', n: 'Japão 10 anos', un: '%', dp: 3, c: 'JP10A' },
  ] },
};
/** Monta as linhas da aba com o que veio do screener; o que não veio fica sem preço (o app mostra "sem cotação"). */
export function montaAba(aba: string, tv: Record<string, { px: number; d1: number; dabs: number | null }>) {
  const A = ABAS[aba]; if (!A) return null;
  return A.itens.map((i) => {
    const t = tv[i.s], dp = i.dp ?? 2;
    if (!t || !(t.px > 0)) return { s: i.s, c: i.c || i.s.split(':')[1], n: i.n, un: i.un || '', dp, px: null, d1: null, dabs: null };
    const dabs = t.dabs != null && isFinite(t.dabs) ? t.dabs : t.px - t.px / (1 + t.d1 / 100);
    return { fonte:(t as any).fonte || 'TradingView', simboloFonte:(t as any).simboloFonte || i.s, horarioPreco:(t as any).horarioPreco || null, modoAtualizacao:(t as any).modoAtualizacao || null, fechamentoAnterior:(t as any).fechamentoAnterior ?? null, baseVariacao:(t as any).baseVariacao || null, s: i.s, c: i.c || i.s.split(':')[1], n: i.n, un: i.un || '', dp, px: +t.px.toFixed(dp), d1: +t.d1.toFixed(2), dabs: +dabs.toFixed(dp) };
  });
}

// ===== servidor =====
// Fluxo de investidores na B3 (estrangeiro, institucional, pessoa física...): dado diário divulgado pela B3, com ~2 dias de atraso.
// Fonte: tabela pública do site Dados de Mercado (que republica a B3). Lê o HTML de forma tolerante: cada linha com uma data e 5 valores.
export type LinhaFluxo = { d: string; est: number; inst: number; pf: number; ifin: number; out: number };
const fxNum = (s: string): number | null => {
  const m = /(-?[\d.]+(?:,\d+)?)\s*(bi|mi|mil)?/i.exec(s.replace(/−/g, '-'));
  if (!m) return null;
  const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  if (!isFinite(v)) return null;
  const u = (m[2] || 'mi').toLowerCase();
  return u === 'bi' ? v * 1000 : u === 'mil' ? v / 1000 : v; // tudo em R$ milhões
};
export function parseFluxo(html: string): LinhaFluxo[] {
  const out: LinhaFluxo[] = [];
  for (const tr of html.split(/<tr[\s>]/i).slice(1)) {
    const cel = tr.split(/<\/t[dh]>/i).map((c) => c.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const dm = cel.length ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cel[0]) : null;
    if (!dm) continue;
    const v = cel.slice(1, 6).map(fxNum);
    if (v.length < 5 || v.some((x) => x == null)) continue;
    out.push({ d: `${dm[3]}-${dm[2]}-${dm[1]}`, est: v[0]!, inst: v[1]!, pf: v[2]!, ifin: v[3]!, out: v[4]! });
  }
  return out.sort((a, b) => (a.d < b.d ? 1 : -1));
}
export function resumoFluxo(L: LinhaFluxo[]) {
  if (!L.length) return null;
  const ult = L[0], mes = ult.d.slice(0, 7), ano = ult.d.slice(0, 4);
  const soma = (f: (x: LinhaFluxo) => boolean) => +L.filter(f).reduce((s, x) => s + x.est, 0).toFixed(2);
  let seq = 0; const sg = Math.sign(ult.est); for (const x of L) { if (Math.sign(x.est) === sg && sg !== 0) seq++; else break; }
  return { ultimo: ult, mes: soma((x) => x.d.startsWith(mes)), ano_na_tabela: soma((x) => x.d.startsWith(ano)), dias_seguidos: seq, sentido: sg > 0 ? 'entrada' : sg < 0 ? 'saída' : 'zero', linhas: L.slice(0, 20), dias_no_mes: L.filter((x) => x.d.startsWith(mes)).length };
}
let cFluxo: { ts: number; v: unknown } | null = null;
export async function fluxo() {
  if (cFluxo && Date.now() - cFluxo.ts < 60 * 60_000) return cFluxo.v;
  const r = await fetch('https://www.dadosdemercado.com.br/fluxo', { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', Accept: 'text/html' }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) { if (cFluxo) return cFluxo.v; throw new Error('Fluxo da B3 indisponível agora (' + r.status + ').'); }
  const res = resumoFluxo(parseFluxo(await r.text()));
  if (!res) { if (cFluxo) return cFluxo.v; throw new Error('Não consegui ler a tabela do fluxo.'); }
  const v = { ...res, fonte: 'B3 (via Dados de Mercado)', obs: 'Valores em R$ milhões, mercado à vista (ações). A B3 divulga com cerca de 2 dias úteis de atraso.' };
  cFluxo = { ts: Date.now(), v };
  return v;
}

// ===== servidor =====
// Calendário de balanços da B3 (TradingView): quem divulgou ontem/hoje e quem divulga nos próximos dias.
export type Bal = { tk: string; nome: string; d: string; cap: number; hora?: string | null; quando?: 'antes' | 'durante' | 'depois' | null; conf?: 'cvm' | 'com' | 'est'; link?: string };
const BAL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export const balDiaBR = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
/** Dia da divulgação: meia-noite UTC = só a data (sem horário), então vale o dia UTC; senão, o dia em Brasília. */
export const balDia = (ts: number) => (ts % 86400 === 0 ? new Date(ts * 1000).toISOString().slice(0, 10) : balDiaBR(ts));
/** Horário da divulgação em Brasília. Meia-noite UTC (21h em Brasília) é como o TradingView marca "sem horário": devolve null. */
export function balHora(ts: number): { hora: string | null; quando: 'antes' | 'durante' | 'depois' | null } {
  if (ts % 86400 === 0) return { hora: null, quando: null };
  const b = new Date((ts - 3 * 3600) * 1000), h = b.getUTCHours(), m = b.getUTCMinutes();
  return { hora: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, quando: h < 10 ? 'antes' : h >= 17 ? 'depois' : 'durante' };
}
export function balLinhas(data: any[], col: number): Bal[] {
  return (Array.isArray(data) ? data : []).map((x: any): Bal | null => {
    const d = x?.d || [], ts = d[col];
    return typeof ts === 'number' && ts > 0 ? { tk: String(x.s || '').split(':').pop() || '', nome: String(d[1] || d[0] || '').slice(0, 40), d: balDia(ts), cap: +d[2] || 0, ...balHora(ts) } : null;
  }).filter((x): x is Bal => !!x && /^[A-Z]{4}\d{1,2}$/.test(x.tk))
    .sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
}
async function balScan(campo: string, t0: number, t1: number) {
  const r = await fetch('https://scanner.tradingview.com/brazil/scan', { method: 'POST', signal: AbortSignal.timeout(9_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': BAL_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({ filter: [{ left: campo, operation: 'in_range', right: [t0, t1] }, { left: 'market_cap_basic', operation: 'greater', right: 5e7 }],
      options: { lang: 'pt' }, columns: ['name', 'description', 'market_cap_basic', campo], sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, 250] }) });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  return balLinhas((await r.json())?.data, 3);
}
// ---------- segunda fonte: calendário de resultados do Yahoo Finance (o mesmo da página finance.yahoo.com/calendar/earnings) ----------
let YB: { cookie: string; crumb: string; ts: number } | null = null;
async function ybAuth() {
  if (YB && Date.now() - YB.ts < 3600_000) return YB;
  const r = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': BAL_UA }, signal: AbortSignal.timeout(8_000) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0]; await r.text().catch(() => '');
  const c = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': BAL_UA, Cookie: cookie }, signal: AbortSignal.timeout(8_000) });
  const crumb = await c.text();
  if (!c.ok || !crumb || crumb.includes('<')) throw new Error('Yahoo: sem crumb');
  return (YB = { cookie, crumb, ts: Date.now() });
}
/** Converte a resposta do Yahoo (colunas + linhas) em Bal. BMO = antes da abertura, AMC = após o fechamento. */
export function balYahooLinhas(j: any): Bal[] {
  const doc = j?.finance?.result?.[0]?.documents?.[0], cols: string[] = (doc?.columns || []).map((c: any) => c.id), rows: any[][] = doc?.rows || [];
  const ix = (k: string) => cols.indexOf(k);
  return rows.map((r): Bal | null => {
    const tk = String(r[ix('ticker')] || '').replace(/\.SA$/, ''), dt = Date.parse(String(r[ix('startdatetime')] || '')), tipo = String(r[ix('startdatetimetype')] || '');
    if (!/^[A-Z]{4}\d{1,2}$/.test(tk) || !isFinite(dt)) return null;
    const ts = Math.floor(dt / 1000), h = balHora(ts);
    const quando = tipo === 'BMO' ? 'antes' : tipo === 'AMC' ? 'depois' : h.quando;
    const temHora = !!h.hora && !(tipo === 'TNS' || tipo === 'TAS') ;
    return { tk, nome: String(r[ix('companyshortname')] || tk).slice(0, 40), d: balDia(ts), cap: +r[ix('intradaymarketcap')] || 0, hora: temHora ? h.hora : null, quando: temHora || tipo === 'BMO' || tipo === 'AMC' ? quando : null };
  }).filter((x): x is Bal => !!x);
}
async function balYahoo(de: string, ate: string): Promise<Bal[]> {
  const a = await ybAuth();
  const body = { sortType: 'ASC', entityIdType: 'earnings', sortField: 'startdatetime', includeFields: ['ticker', 'companyshortname', 'startdatetime', 'startdatetimetype', 'intradaymarketcap'],
    query: { operator: 'and', operands: [{ operator: 'gte', operands: ['startdatetime', de] }, { operator: 'lt', operands: ['startdatetime', ate] }, { operator: 'eq', operands: ['region', 'br'] }] }, offset: 0, size: 250 };
  const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/visualization?lang=pt-BR&region=BR&crumb=${encodeURIComponent(a.crumb)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': BAL_UA, Cookie: a.cookie }, body: JSON.stringify(body), signal: AbortSignal.timeout(9_000) });
  if (!r.ok) { if (r.status === 401) YB = null; throw new Error('Yahoo ' + r.status); }
  return balYahooLinhas(await r.json());
}
/** Junta as duas fontes: a data do TradingView vale; o horário vem de quem tiver; empresa que só uma fonte tem entra também. */
export function juntaBal(tv: Bal[], yh: Bal[]): Bal[] {
  const out = tv.map((x) => ({ ...x })), por = new Map(out.map((x) => [x.tk, x]));
  for (const y of yh) {
    const t = por.get(y.tk);
    if (!t) { out.push(y); por.set(y.tk, y); continue; }
    if (!t.hora && y.hora && y.d === t.d) { t.hora = y.hora; t.quando = y.quando; }
    else if (!t.quando && y.quando && y.d === t.d) t.quando = y.quando;
    if (!t.cap && y.cap) t.cap = y.cap;
  }
  return out.sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
}
// ---------- fonte oficial: documentos entregues à CVM (sistema RAD/ENET, o mesmo do site da CVM, em tempo real) ----------
// ITR/DFP e press-release entregues = o balanço saiu de fato. Comunicado com a data dos resultados = data confirmada pela empresa.
const RAD = 'https://www.rad.cvm.gov.br/ENET/';
export type RadDoc = { cvm: string; empresa: string; cat: string; tipo: string; esp: string; ref: string; versao: string; entrega: string; assunto: string; protocolo: string; seq?: string; ver?: string; desc?: string };
const semTag = (x: string) => String(x || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export function radLinhas(raw: string): RadDoc[] {
  return String(raw || '').split('&*').map((row) => row.split('$&')).filter((c) => c.length >= 11).map((c) => {
    const ent = semTag(c[6]).replace(/^\d{8}\s*/, ''), m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(ent);
    const pr = /OpenDownloadDocumentos\(\s*'(\d+)'\s*,\s*'(\d+)'\s*,\s*'(\d+)'\s*,\s*'([^']+)'\s*\)/.exec(c[10] || '');
    return { cvm: semTag(c[0]), empresa: semTag(c[1]), cat: semTag(c[2]), tipo: semTag(c[3]), esp: semTag(c[4]), ref: (/(\d{2})\/(\d{2})\/(\d{4})/.exec(semTag(c[5])) || []).slice(1).reverse().join('-'), versao: semTag(c[8]), entrega: m ? `${m[3]}-${m[2]}-${m[1]}T${m[4] || '00'}:${m[5] || '00'}` : '', assunto: semTag(c[11] || ''), protocolo: pr ? pr[3] : '', seq: pr ? pr[1] : '', ver: pr ? pr[2] : '', desc: pr ? pr[4] : '' };
  }).filter((d) => d.empresa && d.entrega);
}
async function radBusca(periodo: string, de = '', ate = ''): Promise<RadDoc[]> {
  let cookie = '';
  try { const g = await fetch(RAD + 'frmConsultaExternaCVM.aspx', { headers: { 'User-Agent': BAL_UA }, signal: AbortSignal.timeout(8_000) }); cookie = (g.headers.get('set-cookie') || '').split(/,(?=[^ ;]+=)/).map((c) => c.split(';')[0]).join('; '); await g.text().catch(() => ''); } catch { /* segue sem cookie */ }
  const body = { dataDe: de, dataAte: ate, empresa: '', setorAtividade: '-1', categoriaEmissor: '-1', situacaoEmissor: 'A', tipoParticipante: '1', dataReferencia: '', categoria: '', periodo, horaIni: '', horaFim: '', palavraChave: '', ultimaDtRef: 'false', tipoEmpresa: '2', token: '', versaoCaptcha: 'V3' };
  const r = await fetch(RAD + 'frmConsultaExternaCVM.aspx/ListarDocumentos', { method: 'POST', signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': BAL_UA, Origin: 'https://www.rad.cvm.gov.br', Referer: RAD + 'frmConsultaExternaCVM.aspx', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('CVM ' + r.status);
  const L = radLinhas((await r.json())?.d?.dados || '');
  if (!L.length) throw new Error('CVM sem documentos');
  return L;
}
/** Link do documento. O visualizador da CVM (frmExibirArquivoIPEExterno) abre em branco no iPhone, então:
 *  press-release/comunicado (IPE) = baixa o PDF direto; ITR/DFP = a página do formulário em HTML. */
export const RAD_LINK = (d: Partial<RadDoc> | string) => {
  if (typeof d === 'string') return d ? RAD + 'frmExibirArquivoIPEExterno.aspx?NumeroProtocoloEntrega=' + d : '';
  if (d.seq && d.protocolo && /^IPE$/i.test(d.desc || '')) return `${RAD}frmDownloadDocumento.aspx?Tela=ext&numSequencia=${d.seq}&numVersao=${d.ver || '1'}&numProtocolo=${d.protocolo}&descTipo=IPE&CodigoInstituicao=1`;
  if (d.seq && /^(ITR|DFP)$/i.test(d.desc || d.cat || '')) return `${RAD}frmGerenciaPaginaFRE.aspx?NumeroSequencialDocumento=${d.seq}&CodigoTipoInstituicao=1`;
  return d.protocolo ? RAD + 'frmExibirArquivoIPEExterno.aspx?NumeroProtocoloEntrega=' + d.protocolo : '';
};
const quandoDe = (h: number) => (h < 10 ? 'antes' : h >= 17 ? 'depois' : 'durante') as 'antes' | 'durante' | 'depois';
/** Balanço que saiu: ITR, DFP ou press-release de resultados entregue à CVM. */
export function radSaiu(L: RadDoc[]): Bal[] {
  const recente = (d: RadDoc) => !d.ref || (Date.parse(d.entrega.slice(0, 10)) - Date.parse(d.ref)) / 864e5 <= 100;
  const rel = (d: RadDoc) => (/release|resultado/i.test(d.tipo + ' ' + d.assunto) ? 1 : 0);
  return [...L].sort((a, b) => rel(a) - rel(b)).filter((d) => recente(d) && !/reapresenta/i.test(d.tipo + ' ' + d.esp + ' ' + d.assunto)).filter((d) => /^(ITR|DFP)$/i.test(d.cat) || (/econ[oô]mico.financeir/i.test(d.cat) && /release|resultado/i.test(d.tipo + ' ' + d.assunto)))
    .map((d) => { const h = +d.entrega.slice(11, 13), mi = d.entrega.slice(14, 16); return { tk: '', nome: d.empresa, d: d.entrega.slice(0, 10), cap: 0, hora: `${d.entrega.slice(11, 13)}:${mi}`, quando: quandoDe(h), conf: 'cvm' as const, link: RAD_LINK(d) }; });
}
/** Data confirmada em comunicado ("divulgação dos resultados do 3T26 em 05/11/2026, após o fechamento"). */
export function radComunicados(L: RadDoc[], hoje: string): Bal[] {
  const out: Bal[] = [];
  for (const d of L) {
    if (!/comunicado|aviso|fato|calend/i.test(d.cat)) continue;
    const t = d.assunto + ' ' + d.tipo + ' ' + d.esp;
    if (!/(divulga|resultad|balan|trimestr|\b[1-4]T\d{2}\b|ITR|DFP)/i.test(t)) continue;
    const m = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(t);
    if (!m) continue;
    let y = m[3] ? +m[3] : +d.entrega.slice(0, 4); if (y < 100) y += 2000;
    const dia = `${y}-${String(+m[2]).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < hoje || +m[2] > 12 || +m[1] > 31) continue;
    const q = /antes da abertura|pr[eé].?abertura/i.test(t) ? 'antes' : /ap[oó]s o fechamento|ap[oó]s o preg/i.test(t) ? 'depois' : null;
    out.push({ tk: '', nome: d.empresa, d: dia, cap: 0, hora: null, quando: q, conf: 'com', link: RAD_LINK(d) });
  }
  return out;
}
/* nome da empresa na CVM → ticker (lista de ações da B3 no TradingView; a de maior valor de mercado da empresa) */
const NORM_FORA = new Set(['S', 'A', 'SA', 'CIA', 'COMPANHIA', 'DE', 'DO', 'DA', 'DOS', 'DAS', 'E', 'ON', 'PN', 'PNA', 'PNB', 'UNT', 'NM', 'N1', 'N2', 'MA', 'ED', 'EJ', 'ATZ', 'EM', 'RECUPERACAO', 'JUDICIAL']);
export const nomeChave = (n: string) => String(n || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !NORM_FORA.has(w)).join('');
export type Tick = { tk: string; nome: string; cap: number };
export function tickerDe(empresa: string, T: Tick[]): Tick | null {
  const a = nomeChave(empresa); if (a.length < 3) return null;
  let best: Tick | null = null, bs = 0;
  for (const t of T) {
    const b = nomeChave(t.nome); if (b.length < 3) continue;
    let sc = 0;
    if (a === b) sc = 100; else if (b.length >= 6 && a.includes(b)) sc = 50 + b.length; else if (a.length >= 6 && b.includes(a)) sc = 50 + a.length;
    else { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; if (k >= 7) sc = k; }
    if (sc > bs || (sc === bs && sc > 0 && best && t.cap > best.cap)) { best = t; bs = sc; }
  }
  return bs > 0 ? best : null;
}
let cTk: { ts: number; v: Tick[] } | null = null;
async function listaTickers(): Promise<Tick[]> {
  if (cTk && Date.now() - cTk.ts < 24 * 3600_000) return cTk.v;
  const r = await fetch('https://scanner.tradingview.com/brazil/scan', { method: 'POST', signal: AbortSignal.timeout(9_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': BAL_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({ filter: [{ left: 'market_cap_basic', operation: 'greater', right: 2e7 }], options: { lang: 'pt' }, columns: ['name', 'description', 'market_cap_basic'], sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, 900] }) });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  const v = ((await r.json())?.data || []).map((x: any) => ({ tk: String(x.s || '').split(':').pop() || '', nome: String(x.d?.[1] || ''), cap: +x.d?.[2] || 0 })).filter((x: Tick) => /^[A-Z]{4}\d{1,2}$/.test(x.tk));
  cTk = { ts: Date.now(), v }; return v;
}
export function poeTicker(L: Bal[], T: Tick[]): Bal[] {
  return L.map((b) => { if (b.tk) return b; const t = tickerDe(b.nome, T); return t ? { ...b, tk: t.tk, cap: b.cap || t.cap } : { ...b, tk: b.nome.split(/\s+/)[0].slice(0, 12) }; });
}
/** Junta com prioridade: o que veio da CVM manda na data e no horário; comunicado confirma a data; o resto é estimativa. */
export function juntaConf(base: Bal[], extra: Bal[]): Bal[] {
  const out: Bal[] = base.map((x) => ({ ...x, conf: x.conf || 'est' })), por = new Map(out.map((x) => [x.tk, x]));
  for (const y of extra) {
    const t = por.get(y.tk);
    if (!t) { const n = { ...y }; out.push(n); por.set(y.tk, n); continue; }
    if (y.conf === 'cvm' || (y.conf === 'com' && t.conf !== 'cvm')) { t.d = y.d; t.conf = y.conf; t.link = y.link || t.link; if (y.hora || y.conf === 'cvm') { t.hora = y.hora; t.quando = y.quando; } else if (y.quando) t.quando = y.quando; }
  }
  return out.sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
}
/** A mesma empresa tem várias ações (GGBR3 e GGBR4): a data confirmada (CVM ou comunicado) vale para todas. */
export function irmaos(L: Bal[]): Bal[] {
  const raiz = (tk: string) => tk.slice(0, 4), conf = new Map<string, Bal>();
  for (const x of L) if ((x.conf === 'cvm' || x.conf === 'com') && /^[A-Z]{4}\d/.test(x.tk)) { const o = conf.get(raiz(x.tk)); if (!o || (x.conf === 'cvm' && o.conf !== 'cvm')) conf.set(raiz(x.tk), x); }
  const out: Bal[] = [], vis = new Set<string>();
  for (const x of L) {
    const c = conf.get(raiz(x.tk)), y = c && c !== x && x.conf !== 'cvm' ? { ...x, d: c.d, hora: c.hora, quando: c.quando, conf: c.conf, link: c.link } : x;
    if (vis.has(y.tk)) continue; vis.add(y.tk); out.push(y);
  }
  return out;
}
let cBal: { ts: number; v: any } | null = null;
/** dias = quantos dias à frente (inclui hoje). Devolve: ontem (divulgados no último pregão), hoje_lista e proximos, com a confirmação de cada um. */
export async function balancos(dias = 7) {
  if (cBal && Date.now() - cBal.ts < 15 * 60_000) return cBal.v;
  const agora = Math.floor(Date.now() / 1000), hoje = balDiaBR(agora);
  const ini = Math.floor(Date.parse(hoje + 'T00:00:00-03:00') / 1000), dw = new Date(hoje + 'T12:00:00Z').getUTCDay();
  const br = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  const [o1, p1, y1, r1, r2, tk] = await Promise.allSettled([
    balScan('earnings_release_date', ini - 86400 * 4, agora),
    balScan('earnings_release_next_date', ini, ini + 86400 * dias),
    balYahoo(balDiaBR(ini - 86400 * 4), balDiaBR(ini + 86400 * (dias + 1))),
    radBusca('1'),
    dw <= 2 ? radBusca('2', br(balDiaBR(ini - 86400 * 4)), br(hoje)) : Promise.resolve([] as RadDoc[]),
    listaTickers(),
  ]);
  const ok = <T>(x: PromiseSettledResult<T[]>) => (x.status === 'fulfilled' ? x.value : []);
  const err = (x: PromiseSettledResult<unknown>) => (x.status === 'rejected' ? String((x.reason as Error)?.message || x.reason).slice(0, 80) : '');
  const docs = [...ok(r1), ...ok(r2)].filter((d, i, a) => a.findIndex((e) => e.protocolo && e.protocolo === d.protocolo) === i);
  if ([o1, p1, y1].every((x) => x.status === 'rejected') && !docs.length) { if (cBal) return cBal.v; throw new Error('Calendário de balanços indisponível agora (CVM, TradingView e Yahoo).'); }
  const T = ok(tk), saiu = poeTicker(radSaiu(docs), T), com = poeTicker(radComunicados(docs, hoje), T), yh = ok(y1);
  const ont = juntaConf(juntaBal(ok(o1), yh.filter((x) => x.d <= hoje)), saiu), prox = juntaConf(juntaBal(ok(p1), yh.filter((x) => x.d >= hoje)), com);
  const fontes = [{ nome: 'CVM (documentos entregues)', ok: r1.status === 'fulfilled', n: docs.length, erro: err(r1) }, { nome: 'TradingView', ok: o1.status === 'fulfilled' || p1.status === 'fulfilled', n: ok(o1).length + ok(p1).length, erro: err(p1) || err(o1) }, { nome: 'Yahoo Finance', ok: y1.status === 'fulfilled', n: yh.length, erro: err(y1) }];
  // a confirmação da CVM vale para todas as ações da empresa e passa por cima de estimativas em outra data
  const tudo = irmaos([...ont.filter((x) => x.conf === 'cvm'), ...prox.filter((x) => x.conf === 'com'), ...ont.filter((x) => x.conf !== 'cvm'), ...prox.filter((x) => x.conf !== 'com')])
    .sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
  ont.length = 0; ont.push(...tudo.filter((x) => x.d <= hoje));
  prox.length = 0; prox.push(...tudo.filter((x) => x.d >= hoje));
  const antes = ont.filter((x) => x.d < hoje), ult = antes.length ? antes[antes.length - 1].d : '';
  const hojeL = [...ont.filter((x) => x.d === hoje), ...prox.filter((x) => x.d === hoje)].filter((x, i, a) => a.findIndex((y) => y.tk === x.tk) === i)
    .sort((a, b) => (a.conf === 'cvm' ? 0 : 1) - (b.conf === 'cvm' ? 0 : 1) || b.cap - a.cap);
  const v = { hoje, ontem: antes.filter((x) => x.d === ult), hoje_lista: hojeL, proximos: prox.filter((x) => x.d > hoje), fonte: fontes.filter((f) => f.ok).map((f) => f.nome.split(' (')[0]).join(' + '), fontes };
  cBal = { ts: Date.now(), v };
  return v;
}
export function textoBalancos(v: { ontem: Bal[]; hoje_lista: Bal[] }) {
  const n = (l: Bal[]) => l.slice(0, 8).map((x) => x.hora ? `${x.tk} ${x.hora}` : x.quando === 'antes' ? `${x.tk} (antes da abertura)` : x.quando === 'depois' ? `${x.tk} (após o fechamento)` : x.tk).join(', ') + (l.length > 8 ? ` e mais ${l.length - 8}` : '');
  const p: string[] = [];
  if (v.ontem.length) p.push(`Divulgaram (${v.ontem[0].d.slice(8, 10)}/${v.ontem[0].d.slice(5, 7)}): ${n(v.ontem)}.`);
  if (v.hoje_lista.length) p.push(`Hoje: ${n(v.hoje_lista)}.`);
  return p.length ? { title: `📑 Balanços: ${v.hoje_lista.length} hoje${v.ontem.length ? `, ${v.ontem.length} ${v.ontem.length === 1 ? "saiu" : "saíram"}` : ''}`, body: p.join(' ') } : null;
}

// ===== servidor =====
// Estudos de sazonalidade: rally de fim de ano, eleições presidenciais, mês a mês e decisões do Copom.
// IBOV e ações (Yahoo, fechamento diário desde 2000), dólar PTAX venda (Banco Central, série 1) e Selic meta (série 432).
// Setores = cesta igual das principais ações de cada setor (média dos retornos das que tinham preço na janela).
export type SzPonto = { d: string; v: number };
export type SzSerie = SzPonto[];
export type SzAtivo = { k: string; n: string; s?: SzSerie; cesta?: SzSerie[]; membros?: string[] };

const SZ_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export const SZ_SETORES: { k: string; n: string; tks: string[] }[] = [
  { k: 'bancos', n: 'Bancos', tks: ['ITUB4', 'BBDC4', 'BBAS3'] },
  { k: 'commod', n: 'Commodities', tks: ['VALE3', 'PETR4', 'GGBR4', 'CSNA3'] },
  { k: 'consumo', n: 'Consumo', tks: ['ABEV3', 'LREN3', 'RADL3'] },
  { k: 'eletricas', n: 'Elétricas', tks: ['CMIG4', 'ELET3', 'AXIA3', 'EGIE3', 'TAEE11'] },
  { k: 'imob', n: 'Imobiliário', tks: ['CYRE3', 'MRVE3', 'EVEN3'] },
];
// 1º e 2º turno das eleições presidenciais (domingos)
export const SZ_ELEICOES: { ano: number; t1: string; t2: string | null }[] = [
  { ano: 2002, t1: '2002-10-06', t2: '2002-10-27' }, { ano: 2006, t1: '2006-10-01', t2: '2006-10-29' },
  { ano: 2010, t1: '2010-10-03', t2: '2010-10-31' }, { ano: 2014, t1: '2014-10-05', t2: '2014-10-26' },
  { ano: 2018, t1: '2018-10-07', t2: '2018-10-28' }, { ano: 2022, t1: '2022-10-02', t2: '2022-10-30' },
  { ano: 2026, t1: '2026-10-04', t2: '2026-10-25' },
];

// ---------- utilidades de datas e séries ----------
export const szMais = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
/** Último ponto em ou antes de d (até 7 dias antes; mais velho que isso = sem preço). */
export function szAte(s: SzSerie, d: string): SzPonto | null {
  let lo = 0, hi = s.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (s[m].d <= d) { r = m; lo = m + 1; } else hi = m - 1; }
  if (r < 0) return null;
  return s[r].d >= szMais(d, -7) ? s[r] : null;
}
/** Primeiro ponto em ou depois de d (até 7 dias depois). */
export function szApos(s: SzSerie, d: string): SzPonto | null {
  let lo = 0, hi = s.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (s[m].d >= d) { r = m; hi = m - 1; } else lo = m + 1; }
  if (r < 0) return null;
  return s[r].d <= szMais(d, 7) ? s[r] : null;
}
const szRet1 = (s: SzSerie | undefined, d0: string, d1: string): number | null => {
  if (!s) return null; const a = szAte(s, d0), b = szAte(s, d1);
  return a && b && a.v > 0 && b.d > a.d ? (b.v / a.v - 1) * 100 : null;
};
/** Retorno % entre o fechamento em d0 e em d1 (último preço em ou antes de cada data). Cesta = média dos membros com preço. */
export function szRet(a: SzAtivo, d0: string, d1: string): number | null {
  if (a.s) return szRet1(a.s, d0, d1);
  const rs = (a.cesta || []).map((s) => szRet1(s, d0, d1)).filter((x): x is number => x != null);
  return rs.length ? rs.reduce((t, x) => t + x, 0) / rs.length : null;
}
const szR2 = (x: number | null) => (x == null || !isFinite(x) ? null : +x.toFixed(2));
export function szStats(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x != null && isFinite(x));
  if (!v.length) return { qtd: 0, media: null, mediana: null, pos: null, melhor: null, pior: null };
  const o = [...v].sort((a, b) => a - b), m = o.length >> 1;
  return { qtd: v.length, media: szR2(v.reduce((t, x) => t + x, 0) / v.length), mediana: szR2(o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2), pos: Math.round((v.filter((x) => x > 0).length / v.length) * 100), melhor: szR2(o[o.length - 1]), pior: szR2(o[0]) };
}
/** Pregões (datas) do calendário do IBOV. */
const szPregoes = (cal: SzSerie) => cal.map((p) => p.d);
/** Último pregão de um mês (AAAA-MM). */
function szUltimoPregao(cal: string[], ym: string): string | null { let r: string | null = null; for (const d of cal) { if (d.startsWith(ym)) r = d; else if (r && d > ym) break; } return r; }

// ---------- 1) mês a mês ----------
export function szMesAMes(ativos: SzAtivo[], cal: SzSerie, hoje: string) {
  const dias = szPregoes(cal), anoIni = +dias[0].slice(0, 4) + (dias[0].slice(5, 7) === '01' ? 0 : 1), mesAtual = hoje.slice(0, 7);
  const fim: Record<string, string> = {};
  for (const d of dias) fim[d.slice(0, 7)] = d; // último pregão de cada mês
  const meses: string[] = Object.keys(fim).filter((ym) => ym < mesAtual && +ym.slice(0, 4) >= anoIni).sort();
  const ant = (ym: string) => { const y = +ym.slice(0, 4), m = +ym.slice(5, 7); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };
  const porAtivo = ativos.map((a) => {
    const rets: Record<string, number | null> = {};
    for (const ym of meses) { const p = fim[ant(ym)]; rets[ym] = p ? szR2(szRet(a, p, fim[ym])) : null; }
    const mes = Array.from({ length: 12 }, (_, i) => { const mm = String(i + 1).padStart(2, '0'); return { m: i + 1, ...szStats(meses.filter((ym) => ym.endsWith('-' + mm)).map((ym) => rets[ym])) }; });
    return { k: a.k, n: a.n, mes, rets };
  });
  const anos = [...new Set(meses.map((ym) => ym.slice(0, 4)))];
  const ib = porAtivo.find((x) => x.k === 'ibov');
  // matriz ano × mês do IBOV (para o mapa de calor) e o mês corrente até agora
  const matriz = ib ? anos.map((y) => ({ ano: +y, m: Array.from({ length: 12 }, (_, i) => ib.rets[`${y}-${String(i + 1).padStart(2, '0')}`] ?? null) })) : [];
  const pAnt = fim[ant(mesAtual)], atual = pAnt ? ativos.map((a) => ({ k: a.k, v: szR2(szRet(a, pAnt, hoje)) })) : [];
  return { de: meses[0], ate: meses[meses.length - 1], ativos: porAtivo.map(({ rets: _r, ...x }) => x), matriz, mes_atual: { m: +mesAtual.slice(5, 7), parcial: atual } };
}

// ---------- 2) rally de fim de ano ----------
export function szFimDeAno(ativos: SzAtivo[], cal: SzSerie, hoje: string) {
  const dias = szPregoes(cal), anos: number[] = [];
  for (let y = +dias[0].slice(0, 4); y <= +hoje.slice(0, 4); y++) anos.push(y);
  const JAN = [
    { k: 'dez', n: 'Dezembro inteiro', ex: 'último pregão de nov → último de dez' },
    { k: 'quinzena', n: '2ª quinzena de dezembro', ex: 'fech. 15/12 → último pregão do ano' },
    { k: 'natal', n: 'Rally do Papai Noel', ex: '5 últimos pregões do ano + 2 primeiros de janeiro' },
    { k: 'jan', n: 'Efeito janeiro', ex: 'último pregão do ano → último de janeiro' },
  ];
  const linhas: any[] = [];
  for (const y of anos) {
    const nov = szUltimoPregao(dias, `${y}-11`), dez = szUltimoPregao(dias, `${y}-12`), jan = szUltimoPregao(dias, `${y + 1}-01`);
    const dDez = dias.filter((d) => d.startsWith(`${y}-12`)), dJan = dias.filter((d) => d.startsWith(`${y + 1}-01`));
    const iDez = dias.indexOf(dDez[dDez.length - 1] || '');
    const w: Record<string, [string, string] | null> = {
      dez: nov && dez && dez < hoje && dez.slice(5) >= '12-2' ? [nov, dez] : null,
      quinzena: dez && dez.slice(5) >= '12-2' ? [`${y}-12-15`, dez] : null,
      natal: dDez.length >= 5 && dJan.length >= 2 && iDez >= 5 ? [dias[iDez - 5], dJan[1]] : null,
      jan: dez && jan && dJan.length >= 15 && jan < hoje ? [dez, jan] : null,
    };
    const lin: any = { ano: y };
    for (const j of JAN) { const p = w[j.k]; lin[j.k] = p ? Object.fromEntries(ativos.map((a) => [a.k, szR2(szRet(a, p[0], p[1]))])) : null; }
    if (JAN.some((j) => lin[j.k])) linhas.push(lin);
  }
  const resumo = JAN.map((j) => ({ ...j, ativos: ativos.map((a) => ({ k: a.k, n: a.n, ...szStats(linhas.map((l) => l[j.k]?.[a.k] ?? null)) })) }));
  return { janelas: resumo, anos: linhas.reverse() };
}

// ---------- 3) eleições presidenciais ----------
export function szEleicoes(ativos: SzAtivo[], cal: SzSerie, hoje: string) {
  const JAN = [
    { k: 'semana', n: 'Semana antes', ex: 'sexta antes da semana → sexta pré-urna' },
    { k: 'pre', n: 'Pré-eleição', ex: 'segunda anterior → sexta pré-urna' },
    { k: 'pos', n: 'Reação ao resultado', ex: 'sexta pré-urna → segunda seguinte' },
    { k: 'trade', n: 'Trade segunda → segunda', ex: 'compra na segunda anterior, venda na segunda seguinte' },
    { k: 'mes', n: 'Um mês depois', ex: 'sexta pré-urna → 30 dias depois' },
  ];
  const turno = (t: 1 | 2) => {
    const linhas: any[] = [];
    for (const e of SZ_ELEICOES) {
      const T = t === 1 ? e.t1 : e.t2; if (!T) continue;
      const sexta = szMais(T, -2), segAnt = szMais(T, -6), sextaAnt = szMais(T, -9), segDep = szMais(T, 1), mes = szMais(T, 28);
      const w: Record<string, [string, string]> = { semana: [sextaAnt, sexta], pre: [segAnt, sexta], pos: [sexta, segDep], trade: [segAnt, segDep], mes: [sexta, mes] };
      const lin: any = { ano: e.ano, data: T, futuro: T >= hoje };
      for (const j of JAN) { const [a, b] = w[j.k]; lin[j.k] = b > hoje ? null : Object.fromEntries(ativos.map((x) => [x.k, szR2(szRet(x, a, b))])); }
      // pontos do IBOV, como na tabela do estudo
      const ib = ativos.find((x) => x.k === 'ibov')?.s;
      if (ib) lin.ibov_pts = { sexta_antes: szAte(ib, sextaAnt)?.v ?? null, segunda_antes: szAte(ib, segAnt)?.v ?? null, sexta_pre: szAte(ib, sexta)?.v ?? null, segunda_depois: segDep <= hoje ? szAte(ib, segDep)?.v ?? null : null };
      linhas.push(lin);
    }
    const passadas = linhas.filter((l) => !l.futuro);
    return { linhas, resumo: JAN.map((j) => ({ ...j, ativos: ativos.map((a) => ({ k: a.k, n: a.n, ...szStats(passadas.map((l) => l[j.k]?.[a.k] ?? null)) })) })) };
  };
  return { t1: turno(1), t2: turno(2), obs: 'Retornos entre fechamentos; sem custos. Eleição de 2026: só as janelas que já terminaram.' };
}

// ---------- 4) decisões do Copom (mudanças da Selic meta) ----------
export function szDecisoes(selic: SzSerie): { d: string; de: number; para: number }[] {
  // série 432 é diária: a nova meta vale a partir do dia seguinte à reunião; a decisão é o último dia com a meta antiga
  const out: { d: string; de: number; para: number }[] = [];
  for (let i = 1; i < selic.length; i++) if (selic[i].v !== selic[i - 1].v) out.push({ d: selic[i - 1].d, de: selic[i - 1].v, para: selic[i].v });
  return out;
}
export function szCopom(ativos: SzAtivo[], cal: SzSerie, selic: SzSerie, hoje: string) {
  const dias = szPregoes(cal), idx = (d: string) => { let r = -1; for (let i = 0; i < dias.length && dias[i] <= d; i++) r = i; return r; };
  const JAN = [
    { k: 'antes', n: 'Semana antes', ex: '5 pregões antes → dia da decisão' },
    { k: 'reacao', n: 'Reação no dia seguinte', ex: 'fech. do dia da decisão → fech. do dia seguinte (o Copom anuncia depois do fechamento)' },
    { k: 'semana', n: 'Semana depois', ex: 'dia da decisão → 5 pregões depois' },
  ];
  const decs = szDecisoes(selic).filter((x) => x.d >= dias[0]);
  const linhas = decs.map((x) => {
    const i = idx(x.d), D = dias[i], Dm5 = dias[i - 5], D1 = dias[i + 1], D5 = dias[i + 5];
    const w: Record<string, [string | undefined, string | undefined]> = { antes: [Dm5, D], reacao: [D, D1], semana: [D, D5] };
    const lin: any = { data: x.d, de: x.de, para: x.para, tipo: x.para > x.de ? 'alta' : 'corte', bp: Math.round((x.para - x.de) * 100) };
    for (const j of JAN) { const [a, b] = w[j.k]; lin[j.k] = a && b && b <= hoje ? Object.fromEntries(ativos.map((t) => [t.k, szR2(szRet(t, a, b))])) : null; }
    return lin;
  });
  const grupo = (f: (l: any) => boolean) => JAN.map((j) => ({ ...j, ativos: ativos.map((a) => ({ k: a.k, n: a.n, ...szStats(linhas.filter(f).map((l) => l[j.k]?.[a.k] ?? null)) })) }));
  return { alta: grupo((l) => l.tipo === 'alta'), corte: grupo((l) => l.tipo === 'corte'), linhas: linhas.reverse().slice(0, 40), n_alta: linhas.filter((l) => l.tipo === 'alta').length, n_corte: linhas.filter((l) => l.tipo === 'corte').length, obs: 'Só reuniões que mudaram a Selic (as de manutenção não aparecem na série do Banco Central).' };
}

// ---------- coleta ----------
async function szYahoo(sym: string): Promise<SzSerie> {
  const p2 = Math.floor(Date.now() / 1000);
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?period1=946684800&period2=${p2}&interval=1d`, { headers: { 'User-Agent': SZ_UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error('Yahoo ' + sym + ' ' + r.status);
  const R = (await r.json())?.chart?.result?.[0], ts: number[] = R?.timestamp || [], c: (number | null)[] = R?.indicators?.adjclose?.[0]?.adjclose || R?.indicators?.quote?.[0]?.close || [];
  const out: SzSerie = [];
  ts.forEach((t, i) => { const v = c[i]; if (typeof v === 'number' && v > 0) out.push({ d: new Date((t - 3 * 3600) * 1000).toISOString().slice(0, 10), v /* data em Brasília: o pregão é de dia, o antigo horário de verão não muda a data */ }); });
  return out.filter((p, i, a) => i === a.length - 1 || a[i + 1].d !== p.d);
}
async function szBcb(n: number, desde = 2000): Promise<SzSerie> {
  const fmt = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  const hoje = new Date(), partes: [Date, Date][] = [];
  for (let y = desde; y <= hoje.getUTCFullYear(); y += 9) partes.push([new Date(Date.UTC(y, 0, 1)), new Date(Math.min(Date.UTC(y + 8, 11, 31), hoje.getTime()))]); // a API limita 10 anos por pedido
  const blocos = await Promise.all(partes.map(async ([a, b]) => {
    const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados?formato=json&dataInicial=${fmt(a)}&dataFinal=${fmt(b)}`, { headers: { Accept: 'application/json', 'User-Agent': SZ_UA }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error('Banco Central série ' + n + ' ' + r.status);
    const j = await r.json();
    return (Array.isArray(j) ? j : []).map((x: any) => { const [d, m, y] = String(x.data).split('/'); return { d: `${y}-${m}-${d}`, v: parseFloat(String(x.valor).replace(',', '.')) }; }).filter((p: SzPonto) => p.v > 0);
  }));
  return blocos.flat().sort((a, b) => (a.d < b.d ? -1 : 1));
}
let cSaz: { ts: number; v: unknown } | null = null;
export async function sazonalidade() {
  if (cSaz && Date.now() - cSaz.ts < 12 * 3600_000) return cSaz.v;
  const tks = [...new Set(SZ_SETORES.flatMap((s) => s.tks))];
  const [ib, ptax, selic, ...acoes] = await Promise.all([
    szYahoo('^BVSP'), szBcb(1).catch(() => [] as SzSerie), szBcb(432).catch(() => [] as SzSerie),
    ...tks.map((t) => szYahoo(t + '.SA').catch(() => [] as SzSerie)),
  ]);
  if (ib.length < 1000) throw new Error('Histórico do Ibovespa indisponível agora. Tente de novo em alguns minutos.');
  const por: Record<string, SzSerie> = {}; tks.forEach((t, i) => (por[t] = acoes[i]));
  const ativos: SzAtivo[] = [
    { k: 'ibov', n: 'Ibovespa', s: ib },
    ...(ptax.length ? [{ k: 'dolar', n: 'Dólar (PTAX)', s: ptax }] : []),
    ...SZ_SETORES.map((s) => ({ k: s.k, n: s.n, cesta: s.tks.map((t) => por[t]).filter((x) => x.length > 100), membros: s.tks.filter((t) => por[t].length > 100) })),
  ];
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const v = {
    gerado: new Date().toISOString(), hoje,
    ativos: ativos.map((a) => ({ k: a.k, n: a.n, membros: a.membros || null })),
    mes: szMesAMes(ativos, ib, hoje), fim_ano: szFimDeAno(ativos, ib, hoje), eleicoes: szEleicoes(ativos, ib, hoje),
    copom: selic.length ? szCopom(ativos, ib, selic, hoje) : null,
    fontes: 'Ibovespa e ações: Yahoo Finance (fechamento ajustado); dólar: PTAX venda e Selic meta: Banco Central (SGS 1 e 432). Setores: média das ações de cada cesta. Sem custos. Passado não garante resultado futuro.',
  };
  cSaz = { ts: Date.now(), v };
  return v;
}

// ===== servidor =====
// Maiores altas e baixas da B3 (ações líquidas), pelo scanner do TradingView. O app troca pelos números do Profit quando a ponte estiver ligada.
export type RkItem = { tk: string; nome: string; px: number; var: number; vol: number | null; cap: number | null };
const RK_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export function rkLinhas(data: any[]): RkItem[] {
  return (Array.isArray(data) ? data : []).map((x: any): RkItem | null => {
    const d = x?.d || [], tk = String(x?.s || '').split(':').pop() || '', px = d[2], v = d[3];
    if (!/^[A-Z]{4}\d{1,2}$/.test(tk) || /3[1-9]$/.test(tk) || typeof px !== 'number' || typeof v !== 'number' || !isFinite(v)) return null;
    return { tk, nome: String(d[1] || d[0] || tk).replace(/\s+(ON|PN|UNT|N\d|NM|EJ|ED|EDJ|ATZ|MB)(\s|$).*/i, '').slice(0, 26), px, var: +v.toFixed(2), vol: typeof d[4] === 'number' ? d[4] : null, cap: typeof d[5] === 'number' ? d[5] : null };
  }).filter((x): x is RkItem => !!x);
}
async function rkScan(ordem: 'desc' | 'asc'): Promise<RkItem[]> {
  const r = await fetch('https://scanner.tradingview.com/brazil/scan', {
    method: 'POST', signal: AbortSignal.timeout(9_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': RK_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({
      filter: [{ left: 'type', operation: 'equal', right: 'stock' }, { left: 'is_primary', operation: 'equal', right: true }, { left: 'market_cap_basic', operation: 'egreater', right: 2e9 }, { left: 'average_volume_30d_calc', operation: 'egreater', right: 300000 }],
      options: { lang: 'pt' }, columns: ['name', 'description', 'close', 'change', 'Value.Traded', 'market_cap_basic'], sort: { sortBy: 'change', sortOrder: ordem }, range: [0, 25],
    }),
  });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  return rkLinhas((await r.json())?.data);
}
let cRk: { ts: number; v: unknown } | null = null;
export async function ranking() {
  if (cRk && Date.now() - cRk.ts < 60_000) return cRk.v;
  const [altas, baixas] = await Promise.all([rkScan('desc'), rkScan('asc')]);
  const v = { altas: altas.filter((x) => x.var > 0).slice(0, 15), baixas: baixas.filter((x) => x.var < 0).slice(0, 15), gerado: new Date().toISOString(), fonte: 'TradingView' };
  cRk = { ts: Date.now(), v };
  return v;
}

// ===== servidor =====
// Diagnóstico das fontes externas: cada teste com tempo-limite curto, devolve ok/erro e quanto demorou.
export type DiagItem = { fonte: string; uso: string; ok: boolean; ms: number; detalhe: string };
const DG_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export async function testa(fonte: string, uso: string, f: () => Promise<string>, ms = 8000): Promise<DiagItem> {
  const t0 = Date.now();
  try {
    const det = await Promise.race([f(), new Promise<string>((_, rej) => setTimeout(() => rej(new Error('sem resposta em ' + ms / 1000 + 's')), ms))]);
    return { fonte, uso, ok: true, ms: Date.now() - t0, detalhe: det };
  } catch (e) { return { fonte, uso, ok: false, ms: Date.now() - t0, detalhe: String((e as Error)?.message || e).slice(0, 160) }; }
}
const tvH = { 'Content-Type': 'application/json', 'User-Agent': DG_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' };
export async function diagnostico(): Promise<DiagItem[]> {
  return Promise.all([
    testa('TradingView (cotações)', 'Painel, imagem, Giro, ranking', async () => {
      const r = await fetch('https://scanner.tradingview.com/global/scan', { method: 'POST', headers: tvH, body: JSON.stringify({ symbols: { tickers: ['BMFBOVESPA:IBOV'], query: { types: [] } }, columns: ['close'] }) });
      if (!r.ok) throw new Error('HTTP ' + r.status); const v = (await r.json())?.data?.[0]?.d?.[0]; if (typeof v !== 'number') throw new Error('veio sem preço'); return 'Ibovespa ' + Math.round(v).toLocaleString('pt-BR');
    }),
    testa('TradingView (calendários)', 'Agenda e balanços', async () => {
      const de = new Date().toISOString(), ate = new Date(Date.now() + 2 * 864e5).toISOString();
      const r = await fetch(`https://economic-calendar.tradingview.com/events?from=${de}&to=${ate}&countries=US,BR`, { headers: { 'User-Agent': DG_UA, Origin: 'https://www.tradingview.com' } });
      if (!r.ok) throw new Error('HTTP ' + r.status); const n = ((await r.json())?.result || []).length; return n + ' eventos nos próximos 2 dias';
    }),
    testa('Yahoo Finance', 'Histórico, sazonalidade, leitura técnica', async () => {
      const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?range=5d&interval=1d', { headers: { 'User-Agent': DG_UA } });
      if (!r.ok) throw new Error('HTTP ' + r.status); const n = (await r.json())?.chart?.result?.[0]?.timestamp?.length || 0; if (!n) throw new Error('sem candles'); return n + ' pregões recebidos';
    }),
    testa('Banco Central', 'Selic, IPCA, PTAX', async () => {
      const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json', { headers: { Accept: 'application/json', 'User-Agent': DG_UA } });
      if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); return 'Selic meta ' + (j?.[0]?.valor ?? '?') + '%';
    }),
    testa('Sina (minério Dalian)', 'Minério de Dalian', async () => {
      const r = await fetch('https://hq.sinajs.cn/list=nf_I0', { headers: { 'User-Agent': DG_UA, Referer: 'https://finance.sina.com.cn/' } });
      if (!r.ok) throw new Error('HTTP ' + r.status); const t = new TextDecoder().decode(await r.arrayBuffer()), m = /"([^"]*)"/.exec(t); const px = m ? parseFloat(m[1].split(',')[8]) : NaN; if (!(px > 0)) throw new Error('veio sem preço'); return 'Dalian ' + px;
    }),
    testa('Dados de Mercado', 'Fluxo estrangeiro', async () => {
      const r = await fetch('https://www.dadosdemercado.com.br/fluxo', { headers: { 'User-Agent': DG_UA, Accept: 'text/html' } });
      if (!r.ok) throw new Error('HTTP ' + r.status); const t = await r.text(); if (!/\d{2}\/\d{2}\/\d{4}/.test(t)) throw new Error('página sem a tabela'); return 'tabela encontrada';
    }),
  ]);
}

// ===== segurança =====
// seguranca.ts — login obrigatório, limite de uso por pessoa e comparação de segredo em tempo constante.
// Copiado em cada função (cada função do Supabase é publicada sozinha). Testes em seguranca.test.ts.
const ENV = (k: string) => ((globalThis as any).Deno?.env?.get(k) as string | undefined) || '';
const CACHE = new Map<string, { uid: string; ate: number }>();

/** Id do usuário logado a partir do token do app (a chave anônima sozinha não passa). Guarda o resultado por 5 min. */
export async function usuarioDe(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim(), url = ENV('SUPABASE_URL'), anon = ENV('SUPABASE_ANON_KEY');
  if (!tk || !url || tk.split('.').length !== 3 || tk === anon || tk.length > 4096) return null;
  const c = CACHE.get(tk);
  if (c && c.ate > Date.now()) return c.uid;
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: anon || ENV('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || typeof j.id !== 'string') return null;
    if (CACHE.size > 500) CACHE.clear();
    CACHE.set(tk, { uid: j.id, ate: Date.now() + 5 * 60_000 });
    return j.id;
  } catch { return null; }
}

const USO = new Map<string, number[]>();
/** Janela deslizante: no máximo `max` chamadas em `janelaMs` por chave (usuário). */
export function dentroDoLimite(chave: string, max: number, janelaMs = 60_000, agora = Date.now()): boolean {
  const L = (USO.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (L.length >= max) { USO.set(chave, L); return false; }
  L.push(agora); USO.set(chave, L);
  if (USO.size > 2000) USO.clear();
  return true;
}

/** Compara segredos sem vazar pelo tempo de resposta. Segredo vazio nunca confere. */
export function segredoIgual(recebido: string | null, esperado: string): boolean {
  if (!esperado || typeof recebido !== 'string') return false;
  const a = new TextEncoder().encode(recebido), b = new TextEncoder().encode(esperado);
  let d = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) d |= (a[i % (a.length || 1)] ?? 0) ^ b[i];
  return d === 0 && a.length === b.length;
}

/** Só aceita endereços dos serviços de push oficiais (Apple, Google, Mozilla, Microsoft): a função não vira um "carteiro" para qualquer site. */
export function pushOk(u: unknown): boolean {
  if (typeof u !== 'string' || u.length > 800) return false;
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && !x.port && /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/.test(x.hostname);
  } catch { return false; }
}

/** Versão das funções: o app compara com a dele na tela "Status do sistema". */
export const VERSAO_FN = 'v296';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/macro/index.ts
// Inspirado no Trading Economics: mapa do mercado (bolsas, moedas, commodities, juros e cripto), pré-abertura da B3
// e Brasil em números (Banco Central: SGS e Focus). Cotações do TradingView (screener público, com Yahoo de reserva); Banco Central oficial.
// Publicar:  supabase functions deploy macro --no-verify-jwt

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
let cM: { ts: number; v: any } | null = null, cB: { ts: number; v: any } | null = null;

async function fechamentos(sym: string): Promise<number[] | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2mo&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const c = serieYahoo((await r.json())?.chart?.result?.[0]);
    return c.length ? c : null;
  } catch { return null; }
}
async function scan(mercado: string, tickers: string[]) {
  try {
    const r = await fetch(`https://scanner.tradingview.com/${mercado}/scan`, {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: TV_COLS }),
    });
    return r.ok ? lerTV(await r.json()) : {};
  } catch { return {}; }
}
/** Pré e pós-mercado (TradingView, screener dos EUA). Falhar aqui não atrapalha o resto. */
async function extendido(tickers: string[]): Promise<Record<string, any>> {
  try {
    const r = await fetch('https://scanner.tradingview.com/america/scan', {
      method: 'POST', signal: AbortSignal.timeout(8_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: ['close', 'premarket_close', 'premarket_change', 'postmarket_close', 'postmarket_change'] }),
    });
    if (!r.ok) return {};
    const j = await r.json(), out: Record<string, any> = {};
    const noite = await overnight(tickers.map((t) => 'BOATS:' + t.split(':')[1]));
    for (const x of j?.data || []) { const e = escolheExt(x.d, Date.now(), noite['BOATS:' + String(x.s).split(':')[1]] ?? null); if (e) out[x.s] = e; }
    return out;
  } catch { return {}; }
}
/** Último preço da sessão overnight (Blue Ocean, prefixo BOATS: no TradingView), em pedido separado para não derrubar o resto. */
async function overnight(tickers: string[]): Promise<Record<string, number>> {
  try {
    const r = await fetch('https://scanner.tradingview.com/america/scan', {
      method: 'POST', signal: AbortSignal.timeout(6_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: ['close'] }),
    });
    if (!r.ok) return {};
    const out: Record<string, number> = {};
    for (const x of (await r.json())?.data || []) { const v = x?.d?.[0]; if (typeof v === 'number' && isFinite(v) && v > 0) out[x.s] = v; }
    return out;
  } catch { return {}; }
}
/** Minério de ferro de Dalian (contrato contínuo I0) no Sina Finance: cotação + candles diários para o mês e o mini-gráfico. */
let cKl: { ts: number; v: { d: string; c: number }[] } | null = null;
async function dalianSina() {
  const H = { 'User-Agent': UA, Referer: 'https://finance.sina.com.cn/' };
  try {
    const r = await fetch('https://hq.sinajs.cn/list=nf_I0', { headers: H, signal: AbortSignal.timeout(6_000) });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    let txt = ''; try { txt = new TextDecoder('gbk').decode(buf); } catch { txt = new TextDecoder().decode(buf); }
    const q = leSinaNF(txt);
    if (!q) return null;
    let k = cKl && Date.now() - cKl.ts < 60 * 60_000 ? cKl.v : [];
    if (!k.length) {
      try {
        const rk = await fetch('https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_I0=/InnerFuturesNewService.getDailyKLine?symbol=I0', { headers: H, signal: AbortSignal.timeout(6_000) });
        if (rk.ok) { k = leSinaKline(await rk.text()); if (k.length) cKl = { ts: Date.now(), v: k }; }
      } catch { /* sem histórico: fica sem o mês */ }
    }
    return dalianItem(q, k);
  } catch { return null; }
}
/** Busca tudo no screener global; o que não vier, tenta no screener do próprio mercado. */
async function tradingView() {
  const todos = [...new Set(Object.values(TV).flat())];
  const tv = await scan('global', todos);
  const falta: Record<string, string[]> = {};
  todos.filter((t) => !tv[t]).forEach((t) => { (falta[tvMercado(t)] ??= []).push(t); });
  for (const o of await Promise.all(Object.entries(falta).map(([m, ts]) => scan(m, ts)))) Object.assign(tv, o);
  return tv;
}
/** Histórico do Yahoo (mini-gráfico e reserva): muda pouco, fica 30 min guardado. As cotações do TradingView são buscadas de novo a cada minuto. */
const cY = new Map<string, { ts: number; v: number[] | null }>();
async function fechamentosCache(s: string) { const c = cY.get(s); if (c && Date.now() - c.ts < 30 * 60_000) return c.v; const v = await fechamentos(s); if (v || !c) cY.set(s, { ts: Date.now(), v }); return v ?? c?.v ?? null; }
async function mercados() {
  if (cM && Date.now() - cM.ts < 60_000) return cM.v;
  const todos = MERCADOS.flatMap((g) => g.itens);
  const dlP = dalianSina(), extP = extendido(ADRS.map((a) => a.s));
  const [tv, yh] = await Promise.all([tradingView(), Promise.all(todos.map((a) => a.s.includes(':') ? Promise.resolve(null) : fechamentosCache(a.s)))]);
  const por: Record<string, any> = {};
  todos.forEach((a, i) => { por[a.s] = junta(a, tv, yh[i]); });
  // minério de Dalian: Sina Finance (tempo real da bolsa chinesa); se falhar, fica o do TradingView
  const dl = await dlP;
  if (dl) por['DCE:I'] = dl;
  // pré e pós-mercado do EWZ (o que o estrangeiro fez com o Brasil depois do fechamento da B3)
  const ext = await extP;
  if (por['EWZ'] && ext['AMEX:EWZ']) { por['EWZ'].ext = ext['AMEX:EWZ']; }
  const fontes = { tv: todos.filter((a) => por[a.s]?.fonte === 'TradingView').length, yahoo: todos.filter((a) => por[a.s]?.fonte === 'Yahoo').length, suspeitos: todos.filter((a) => por[a.s]?.suspeito).map((a) => a.n) };
  const v = { grupos: MERCADOS.map((g) => ({ g: g.g, itens: g.itens.map((a) => ({ s: a.s, n: a.n, juro: a.tipo === 'juro', ...(por[a.s] || {}) })).filter((x: any) => x.px != null) })), pre: preAbertura(por, ext), fontes, em: new Date().toISOString() };
  console.log('macro fontes', JSON.stringify(fontes));
  cM = { ts: Date.now(), v };
  return v;
}
async function sgs(n: number, k: number) {
  const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados/ultimos/${k}?formato=json`, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error('BCB ' + n + ': ' + r.status);
  return ((await r.json()) as { data: string; valor: string }[]).map((p) => ({ d: p.data, v: parseFloat(p.valor) })).filter((p) => isFinite(p.v));
}
async function brasil() {
  if (cB && Date.now() - cB.ts < 6 * 3600_000) return cB.v;
  const S: [string, number, number, [number, number], string][] = [
    ['Selic meta', 432, 1, [1, 40], '% ao ano'], ['IPCA 12 meses', 13522, 13, [-5, 30], '%'], ['IPCA do mês', 433, 12, [-3, 5], '%'],
    ['Desemprego (PNAD)', 24369, 13, [2, 25], '%'], ['Dívida bruta / PIB', 13762, 13, [30, 150], '% do PIB'], ['Atividade (IBC-Br)', 24364, 13, [50, 300], 'índice'], ['Dólar PTAX', 1, 20, [1, 15], 'R$'],
  ];
  const ind = (await Promise.allSettled(S.map(([, n, k]) => sgs(n, k)))).map((x, i) => {
    const [nome, , , faixa, un] = S[i];
    if (x.status !== 'fulfilled' || !x.value.length) return null;
    const L = x.value, u = L[L.length - 1];
    if (!plausivel(u.v, faixa)) return null; // série fora do esperado: não mostra número errado
    const ant = L.length > 1 ? L[L.length - 2].v : null, ano = L.length >= 13 ? L[L.length - 13].v : null;
    const extra = nome.startsWith('Atividade') && ant ? { mom: +((u.v / ant - 1) * 100).toFixed(2), yoy: ano ? +((u.v / ano - 1) * 100).toFixed(2) : null } : {};
    return { nome, un, v: u.v, d: u.d, ant, hist: L.map((p) => p.v), ...extra };
  }).filter(Boolean);
  let focus: any[] = [];
  try {
    const y = new Date().getUTCFullYear(), f = `(Indicador eq 'IPCA' or Indicador eq 'PIB Total' or Indicador eq 'Câmbio' or Indicador eq 'Selic') and baseCalculo eq 0 and (DataReferencia eq '${y}' or DataReferencia eq '${y + 1}')`;
    const r = await fetch(`https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=200&$filter=${encodeURIComponent(f)}&$orderby=${encodeURIComponent('Data desc')}&$select=Indicador,Data,DataReferencia,Mediana&$format=json`, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
    if (r.ok) focus = focusResumo((await r.json())?.value || [], [y, y + 1]);
  } catch { /* segue sem o Focus */ }
  const v = { ind, focus, em: new Date().toISOString() };
  if (ind.length) cB = { ts: Date.now(), v };
  return v;
}

/** Painel: 2 anos de fechamentos diários de cada ativo (Yahoo; minério de Dalian pelo Sina). */
let cPn: { ts: number; v: any } | null = null;
async function klineDalian(): Promise<{ d: string; c: number }[]> {
  if (cKl && Date.now() - cKl.ts < 60 * 60_000 && cKl.v.length) return cKl.v;
  try {
    const rk = await fetch('https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_I0=/InnerFuturesNewService.getDailyKLine?symbol=I0', { headers: { 'User-Agent': UA, Referer: 'https://finance.sina.com.cn/' }, signal: AbortSignal.timeout(8_000) });
    if (rk.ok) { const k = leSinaKline(await rk.text()); if (k.length) { cKl = { ts: Date.now(), v: k }; return k; } }
  } catch { /* sem Dalian */ }
  return cKl?.v || [];
}
async function painel() {
  if (cPn && Date.now() - cPn.ts < 4 * 60_000) return cPn.v; // o app atualiza o painel a cada 5 min
  const desde = new Date(Date.now() - 2 * 366 * 86400_000).toISOString().slice(0, 10);
  const itens = await Promise.all(PAINEL.map(async (it) => {
    try {
      let pts: [string, number][] = [];
      if (it.s === 'DCE:I') {
        pts = (await klineDalian()).filter((x) => x.d >= desde).map((x) => [x.d.slice(0, 10), x.c] as [string, number]);
        const q = await dalianSina(); if (q && pts.length) { const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10); if (pts[pts.length - 1][0] !== hoje) pts.push([hoje, q.px]); else pts[pts.length - 1][1] = q.px; }
      } else {
        const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(it.s)}?range=2y&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
        if (r.ok) pts = serieDiaria((await r.json())?.chart?.result?.[0]);
      }
      return quadro(it, pts);
    } catch { return null; }
  }));
  // valor e variação do dia pelo TradingView (os mesmos do Mapa do mercado); o histórico do gráfico continua do Yahoo; Dalian fica com o Sina
  const tvDe = (sym: string) => TV[sym] || PAINEL_TV[sym] || [];
  const syms = [...new Set(PAINEL.filter((p) => p.s !== 'DCE:I').flatMap((p) => tvDe(p.s)))];
  let tv: Record<string, any> = {};
  try {
    tv = await scan('global', syms);
    const falta: Record<string, string[]> = {};
    syms.filter((t) => !tv[t]).forEach((t) => { (falta[tvMercado(t)] ??= []).push(t); });
    for (const o of await Promise.all(Object.entries(falta).map(([m, ts]) => scan(m, ts)))) Object.assign(tv, o);
  } catch { /* sem TradingView: fica o Yahoo */ }
  const agoraBR = new Date(Date.now() - 3 * 3600_000), hoje = agoraBR.toISOString().slice(0, 10), util = ![0, 6].includes(agoraBR.getUTCDay());
  const ok = itens.map((q, i) => {
    const it = PAINEL[i]; if (!q || it.s === 'DCE:I') return q ? { ...q, fonte: it.s === 'DCE:I' ? 'Sina' : 'Yahoo' } : q;
    const t = tvDe(it.s).map((k) => tv[k]).find(Boolean);
    return t ? aplicaTV(q, t, hoje, util, it.s.endsWith('-USD')) : { ...q, fonte: 'Yahoo' };
  }).filter(Boolean);
  if (ok.length < 3) { if (cPn) return cPn.v; throw new Error('Yahoo não respondeu os gráficos agora.'); }
  const nTV = ok.filter((x: any) => x.fonte === 'TradingView').length;
  const v = { itens: ok, em: new Date().toISOString(), fonte: `TradingView em ${nTV} quadros (gráfico com o histórico do Yahoo); minério de Dalian: Sina` };
  cPn = { ts: Date.now(), v };
  return v;
}

/** Setores (EUA e Brasil) ranqueados por período, pelo screener do TradingView. */
let cSet: { ts: number; v: any } | null = null;
async function setores() {
  if (cSet && Date.now() - cSet.ts < 3 * 60_000) return cSet.v;
  const um = async (reg: 'us' | 'br') => {
    const lista = [...SETORES[reg], REF[reg]];
    for (const mk of [reg === 'us' ? 'america' : 'brazil', 'global']) {
      try {
        const r = await fetch(`https://scanner.tradingview.com/${mk}/scan`, {
          method: 'POST', signal: AbortSignal.timeout(10_000),
          headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
          body: JSON.stringify({ symbols: { tickers: lista.map((x) => x.tk), query: { types: [] } }, columns: SET_COLS }),
        });
        if (!r.ok) continue;
        const L = leSetores(await r.json(), lista);
        if (L.length >= 4) { const ref = L.find((x) => x.tk === REF[reg].tk) || null, set = L.filter((x) => x.tk !== REF[reg].tk); return { setores: set, ref, destaques: destaques(set) }; }
      } catch { /* tenta o próximo */ }
    }
    return null;
  };
  const [us, br] = await Promise.all([um('us'), um('br')]);
  if (!us && !br) { if (cSet) return cSet.v; throw new Error('TradingView não respondeu os setores agora.'); }
  const v = { us, br, em: new Date().toISOString(), fonte: 'TradingView' };
  cSet = { ts: Date.now(), v };
  return v;
}

/** Aba "Cotações" do app: uma lista por vez (futuros, índices, ações BR e EUA, ADRs, moedas, commodities, cripto e juros). */
const cCq = new Map<string, { ts: number; v: any }>();
async function cotacoes(aba: string) {
  if (!ABAS[aba]) throw new Error('Lista desconhecida.');
  const c = cCq.get(aba); if (c && Date.now() - c.ts < 20_000) return c.v;
  const porMk: Record<string, string[]> = {};
  ABAS[aba].itens.forEach((i) => { (porMk[tvMercado(i.s)] ||= []).push(i.s); });
  const tv: Record<string, any> = Object.assign({}, ...(await Promise.all(Object.entries(porMk).map(([mk, t]) => scan(mk, t)))));
  const falta = ABAS[aba].itens.map((i) => i.s).filter((s) => !tv[s]);
  if (falta.length) Object.assign(tv, await scan('global', falta));
  const itens = montaAba(aba, tv)!;
  if (!itens.some((x) => x.px != null)) { if (c) return c.v; throw new Error('O TradingView não respondeu as cotações agora.'); }
  const v = { aba, nome: ABAS[aba].nome, itens, em: new Date().toISOString(), fonte: 'TradingView' };
  cCq.set(aba, { ts: Date.now(), v });
  return v;
}

/** Agenda da semana: calendário econômico do TradingView (o mesmo do quadro embutido, mas a semana inteira e sem limite de itens). */
const cAg = new Map<number, { ts: number; v: any }>();
async function agenda(desloc: number) {
  const c = cAg.get(desloc); if (c && Date.now() - c.ts < 10 * 60_000) return c.v;
  const { de, ate } = janelaSemana(Date.now(), desloc);
  const u = `https://economic-calendar.tradingview.com/events?from=${encodeURIComponent(de)}&to=${encodeURIComponent(ate)}&countries=${AG_PAISES.join(',')}`;
  const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' }, signal: AbortSignal.timeout(12_000) });
  if (!r.ok) { if (c) return c.v; throw new Error('Calendário do TradingView respondeu ' + r.status); }
  const v = { de, ate, eventos: normalizaAgenda(await r.json(), de, ate), em: new Date().toISOString(), fonte: 'TradingView' };
  if (v.eventos.length > 1) cAg.set(desloc, { ts: Date.now(), v });
  return v;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'macro', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = segredoIgual(req.headers.get('x-cron-secret'), ENV('CRON_SECRET')) ? 'interno-cron' : await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 20)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  let corpo: any = {}; try { corpo = await req.json(); } catch { /* sem corpo */ }
  if (corpo?.modo === 'painel') {
    try { return out(await painel()); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'balancos') {
    try { return out(await balancos(7)); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'diag') {
    try { return out({ itens: await diagnostico(), em: new Date().toISOString() }); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'ranking') {
    try { return out(await ranking()); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'sazonal_us') {
    try { return out(await sazonalidadeUs()); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'sazonal') {
    try { return out(await sazonalidade()); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'fluxo') {
    try { return out(await fluxo()); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'setores') {
    try { return out(await setores()); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'cotacoes') {
    try { return out(await cotacoes(String(corpo.aba || 'fut'))); } catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  if (corpo?.modo === 'agenda') {
    try { return out(await agenda(Math.max(0, Math.min(1, Math.trunc(+corpo.semana || 0))))); }
    catch (e) { return out({ error: String((e as Error)?.message || e) }, 502); }
  }
  const [m, b] = await Promise.allSettled([mercados(), brasil()]);
  return out({ mercados: m.status === 'fulfilled' ? m.value : null, brasil: b.status === 'fulfilled' ? b.value : null, erros: [m, b].filter((x) => x.status === 'rejected').map((x: any) => String(x.reason?.message || x.reason)) });
});
