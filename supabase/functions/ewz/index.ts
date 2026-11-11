// Função EWZ — arquivo único para colar no editor do Supabase (Edge Functions → ewz → index.ts)

// ===== cálculo =====
// supabase/functions/ewz/calc.ts — leitura do fluxo de opções do EWZ (dados atrasados da Cboe). Funções puras, testadas em calc.test.mts.
// Ideia: classificar cada execução pelo último preço em relação ao bid/ask (estimativa, não infalível), somar prêmios
// (net premium) de calls e puts, e cruzar com open interest, volatilidade implícita e exposição em delta.
export type Op = { option: string; bid: number; ask: number; iv: number; open_interest: number; volume: number; delta: number; gamma: number; last_trade_price: number; last_trade_time?: string | null };
export type Ct = { s: string; venc: string; t: 'C' | 'P'; k: number; bid: number; ask: number; last: number; vol: number; oi: number; iv: number; d: number; g: number; lado: 'C' | 'V' | 'M' | null; prem: number };
export type Boleta = { s: string; venc: string; t: 'C' | 'P'; k: number; dvol: number; preco: number; premio: number; lado: 'C' | 'V' | 'M' | null; oi: number; vol: number; delta: number; expo: number };

/** "EWZ261120C00030000" → vencimento, tipo e strike. */
export function leSimbolo(s: string): { venc: string; t: 'C' | 'P'; k: number } | null {
  const m = /^[A-Z]+(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/.exec(String(s || ''));
  if (!m) return null;
  return { venc: `20${m[1]}-${m[2]}-${m[3]}`, t: m[4] as 'C' | 'P', k: +m[5] / 1000 };
}
/** Lado estimado da execução: perto do ask = compra; perto do bid = venda; no meio = indefinido. */
export function ladoDe(last: number, bid: number, ask: number): 'C' | 'V' | 'M' | null {
  if (!(last > 0)) return null;
  if (!(ask > 0) || !(ask >= bid)) return 'M';
  const sp = ask - bid;
  if (sp <= 0) return last >= ask ? 'C' : last <= bid ? 'V' : 'M';
  if (last >= ask - 0.25 * sp) return 'C';
  if (last <= bid + 0.25 * sp) return 'V';
  return 'M';
}
export function contratos(ops: Op[]): Ct[] {
  const out: Ct[] = [];
  for (const o of ops || []) {
    const p = leSimbolo(o.option); if (!p) continue;
    const last = +o.last_trade_price || 0, vol = +o.volume || 0, bid = +o.bid || 0, ask = +o.ask || 0;
    out.push({ s: o.option, ...p, bid, ask, last, vol, oi: +o.open_interest || 0, iv: +o.iv || 0, d: +o.delta || 0, g: +o.gamma || 0, lado: vol > 0 ? ladoDe(last, bid, ask) : null, prem: vol * last * 100 });
  }
  return out;
}
const sinal = (l: Ct['lado']) => (l === 'C' ? 1 : l === 'V' ? -1 : 0);
export function vies(netC: number, netP: number): 'comprador' | 'vendedor' | 'misto' {
  if (netC > 0 && netP < 0) return 'comprador';
  if (netC < 0 && netP > 0) return 'vendedor';
  return 'misto';
}
export function diasEntre(a: string, b: string) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
/** IV no dinheiro de cada vencimento e a interpolada para 30 dias (variância total). */
export function ivAtm(C: Ct[], spot: number, hoje: string) {
  const vs = [...new Set(C.map((c) => c.venc))].filter((v) => v >= hoje).sort();
  const pts: { venc: string; dias: number; iv: number; strad: number | null }[] = [];
  for (const v of vs) {
    const L = C.filter((c) => c.venc === v && c.iv > 0.01 && c.iv < 3); if (!L.length) continue;
    const k = L.reduce((b, c) => (Math.abs(c.k - spot) < Math.abs(b - spot) ? c.k : b), L[0].k);
    const at = L.filter((c) => c.k === k); const iv = at.reduce((a, c) => a + c.iv, 0) / at.length;
    const ca = C.find((c) => c.venc === v && c.k === k && c.t === 'C'), pu = C.find((c) => c.venc === v && c.k === k && c.t === 'P');
    const mid = (c?: Ct) => (c && c.bid > 0 && c.ask >= c.bid ? (c.bid + c.ask) / 2 : c && c.last > 0 ? c.last : null);
    const s = mid(ca) != null && mid(pu) != null ? mid(ca)! + mid(pu)! : null;
    pts.push({ venc: v, dias: Math.max(1, diasEntre(hoje, v)), iv, strad: s });
  }
  let iv30: number | null = null;
  if (pts.length) {
    const a = [...pts].reverse().find((p) => p.dias <= 30), b = pts.find((p) => p.dias >= 30);
    if (a && b && b.dias > a.dias) { const w = (30 - a.dias) / (b.dias - a.dias), v2 = (a.iv ** 2 * a.dias * (1 - w) + b.iv ** 2 * b.dias * w) / 30; iv30 = Math.sqrt(v2); }
    else iv30 = (a || b)!.iv;
  }
  return { pts, iv30 };
}
/** Volatilidade realizada anualizada (desvio dos retornos diários em log). */
export function hv(fech: number[], n = 20): number | null {
  const L = fech.slice(-(n + 1)); if (L.length < n + 1) return null;
  const r = L.slice(1).map((v, i) => Math.log(v / L[i])), m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)) * Math.sqrt(252);
}
export function resumo(C: Ct[], spot: number, hoje: string) {
  let netC = 0, netP = 0, volC = 0, volP = 0, oiC = 0, oiP = 0, premC = 0, premP = 0, expo = 0;
  for (const c of C) {
    if (c.venc < hoje) continue;
    const sg = sinal(c.lado);
    if (c.t === 'C') { volC += c.vol; oiC += c.oi; premC += c.prem; netC += sg * c.prem; } else { volP += c.vol; oiP += c.oi; premP += c.prem; netP += sg * c.prem; }
    expo += sg * c.vol * 100 * c.d * spot;
  }
  const top = C.filter((c) => c.vol > 0 && c.venc >= hoje).sort((a, b) => b.prem - a.prem).slice(0, 15)
    .map((c) => ({ s: c.s, venc: c.venc, t: c.t, k: c.k, vol: c.vol, oi: c.oi, preco: c.last, premio: Math.round(c.prem), lado: c.lado, abertura: c.vol > c.oi, iv: c.iv, delta: c.d, expo: Math.round(sinal(c.lado) * c.vol * 100 * c.d * spot) }));
  return { netC: Math.round(netC), netP: Math.round(netP), volC, volP, oiC, oiP, premC: Math.round(premC), premP: Math.round(premP), pcVol: volC ? volP / volC : null, pcOi: oiC ? oiP / oiC : null, expo: Math.round(expo), vies: vies(netC, netP), top };
}
/** OI por strike (calls e puts) num vencimento, perto do preço, com GEX (OI × gama × 100 × S² × 1%). */
export function mapaOi(C: Ct[], spot: number, venc: string, antes: Record<string, number> | null, faixa = 0.25) {
  const by: Record<string, { k: number; oc: number; op: number; dc: number | null; dp: number | null; gex: number }> = {};
  for (const c of C) {
    if (c.venc !== venc || Math.abs(c.k / spot - 1) > faixa) continue;
    const o = (by[c.k] ??= { k: c.k, oc: 0, op: 0, dc: null, dp: null, gex: 0 });
    const d = antes && antes[c.s] != null ? c.oi - antes[c.s] : null;
    if (c.t === 'C') { o.oc += c.oi; o.dc = d; o.gex += c.oi * c.g * 100 * spot * spot * 0.01; } else { o.op += c.oi; o.dp = d; o.gex -= c.oi * c.g * 100 * spot * spot * 0.01; }
  }
  const L = Object.values(by).sort((a, b) => a.k - b.k);
  const callWall = L.filter((x) => x.k >= spot).reduce<null | typeof L[0]>((b, x) => (!b || x.oc > b.oc ? x : b), null);
  const putWall = L.filter((x) => x.k <= spot).reduce<null | typeof L[0]>((b, x) => (!b || x.op > b.op ? x : b), null);
  let flip: number | null = null, acc = 0; const tot = L.reduce((a, x) => a + x.gex, 0);
  for (let i = 0; i < L.length; i++) { const a0 = acc; acc += L[i].gex; if (i && Math.sign(a0) !== Math.sign(acc) && a0 !== 0) { flip = L[i].k; } }
  return { L, callWall: callWall ? callWall.k : null, putWall: putWall ? putWall.k : null, gex: Math.round(tot), flip };
}
/** Diferença de volume desde a última leitura: vira "boleta" quando o prêmio da diferença passa do mínimo. */
export function incremento(C: Ct[], antes: Record<string, number>, spot: number, minPremio = 250_000, primeira = false) {
  let dNetC = 0, dNetP = 0; const bol: Boleta[] = [], vols: Record<string, number> = {};
  for (const c of C) {
    vols[c.s] = c.vol; const dv = c.vol - (antes[c.s] || 0); if (dv <= 0 || !(c.last > 0)) continue;
    const pr = dv * c.last * 100, sg = sinal(c.lado);
    if (c.t === 'C') dNetC += sg * pr; else dNetP += sg * pr;
    if (!primeira && pr >= minPremio) bol.push({ s: c.s, venc: c.venc, t: c.t, k: c.k, dvol: dv, preco: c.last, premio: Math.round(pr), lado: c.lado, oi: c.oi, vol: c.vol, delta: c.d, expo: Math.round(sg * dv * 100 * c.d * spot) });
  }
  return { dNetC: Math.round(dNetC), dNetP: Math.round(dNetP), boletas: bol.sort((a, b) => b.premio - a.premio).slice(0, 25), vols };
}
/** Estruturas prováveis entre boletas do mesmo intervalo (hipóteses, não certezas). */
export function estruturas(B: { s: string; venc: string; t: 'C' | 'P'; k: number; dvol: number; lado: string | null; ts?: string }[]) {
  const out: { tipo: string; pernas: string[]; ts?: string }[] = [], usado = new Set<number>();
  const perto = (a: number, b: number, r = 0.15) => Math.abs(a - b) <= Math.max(a, b) * r;
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    if (usado.has(i) || usado.has(j)) continue; const a = B[i], b = B[j];
    if ((a.ts || '') !== (b.ts || '')) continue;
    let tipo = '';
    if (a.venc === b.venc && a.t === b.t && a.k !== b.k && a.lado && b.lado && a.lado !== b.lado && a.lado !== 'M' && b.lado !== 'M') {
      const comp = a.lado === 'C' ? a : b, vend = a.lado === 'C' ? b : a;
      if (perto(a.dvol, b.dvol)) tipo = a.t === 'C' ? (comp.k < vend.k ? 'trava de alta com calls' : 'trava de baixa com calls') : (comp.k > vend.k ? 'trava de baixa com puts' : 'trava de alta com puts');
      else if (a.t === 'C' && perto(vend.dvol, comp.dvol * 2, 0.2) && vend.k > comp.k) tipo = 'booster (1 comprada × 2 vendidas)';
    } else if (a.venc === b.venc && a.k === b.k && a.t !== b.t && perto(a.dvol, b.dvol)) {
      const ca = a.t === 'C' ? a : b, pu = a.t === 'C' ? b : a;
      if (ca.lado === 'C' && pu.lado === 'V') tipo = 'sintético comprado (compra call + vende put)';
      else if (ca.lado === 'V' && pu.lado === 'C') tipo = 'sintético vendido (vende call + compra put)';
      else if (ca.lado === 'C' && pu.lado === 'C') tipo = 'straddle comprado (aposta em movimento)';
      else if (ca.lado === 'V' && pu.lado === 'V') tipo = 'straddle vendido (venda de volatilidade)';
    } else if (a.venc !== b.venc && a.t === b.t && perto(a.k, b.k, 0.05) && perto(a.dvol, b.dvol) && a.lado && b.lado && a.lado !== b.lado) tipo = 'rolagem provável';
    if (tipo) { usado.add(i); usado.add(j); out.push({ tipo, pernas: [a.s, b.s], ts: a.ts }); }
  }
  return out;
}
/** Horário de Nova York (para saber se o pregão americano está aberto). */
export function horaNY(d = new Date()): { dia: string; min: number; semana: number } {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || '';
  return { dia: `${g('year')}-${g('month')}-${g('day')}`, min: (+g('hour') % 24) * 60 + +g('minute'), semana: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')) };
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
export const VERSAO_FN = 'v165';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/ewz/index.ts — fluxo de opções do EWZ (dados públicos e atrasados da Cboe) para ler o índice brasileiro.
// acao "agora" (app, com login): fluxo do dia, boletas relevantes, estruturas prováveis, OI por strike, volatilidade.
// acao "grava" (agendador, com CRON_SECRET): a cada 5 min no pregão americano guarda a evolução do net premium e as boletas.
// Tabelas: rode ewz.sql. Publicar: supabase functions deploy ewz --no-verify-jwt

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const SB = Deno.env.get('SUPABASE_URL') || '', SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', CRON = Deno.env.get('CRON_SECRET') || '';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
const svc = (x: Record<string, string> = {}) => ({ apikey: SVC, Authorization: 'Bearer ' + SVC, 'Content-Type': 'application/json', ...x });
async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { ...svc(), ...(init.headers as Record<string, string> || {}) }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`tabela ${path.split('?')[0]}: ${r.status} ${(await r.text()).slice(0, 160)}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
let cC: { ts: number; ops: Op[]; spot: number | null } | null = null, cY: { ts: number; f: number[]; px: number | null } | null = null;
async function yahoo() {
  if (cY && Date.now() - cY.ts < 30 * 60_000) return cY;
  const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/EWZ?range=3mo&interval=1d', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
  const j = r.ok ? (await r.json())?.chart?.result?.[0] : null;
  const f = ((j?.indicators?.quote?.[0]?.close || []) as (number | null)[]).filter((v): v is number => typeof v === 'number' && v > 0);
  cY = { ts: Date.now(), f, px: +j?.meta?.regularMarketPrice || null }; return cY;
}
async function cboe(forca = false) {
  if (!forca && cC && Date.now() - cC.ts < 60_000) return cC;
  const r = await fetch('https://cdn.cboe.com/api/global/delayed_quotes/options/EWZ.json', { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error('Cboe ' + r.status);
  const j = await r.json(), d = j?.data || {};
  const spot = +d.current_price || +d.close || +d.prev_day_close || null;
  cC = { ts: Date.now(), ops: Array.isArray(d.options) ? d.options : [], spot }; return cC;
}
async function preco() { const c = await cboe(); if (c.spot) return c.spot; const y = await yahoo().catch(() => null); return y?.px || y?.f.at(-1) || null; }

async function agora(b: any) {
  const ny = horaNY(), c = await cboe(), spot = await preco(); if (!spot) throw new Error('Sem a cotação do EWZ agora.');
  const C = contratos(c.ops), R = resumo(C, spot, ny.dia), I = ivAtm(C, spot, ny.dia);
  const y = await yahoo().catch(() => null), hv20 = y ? hv(y.f, 20) : null;
  const vencs = I.pts.filter((p) => p.dias <= 120).map((p) => ({ venc: p.venc, dias: p.dias, iv: +p.iv.toFixed(4) }));
  const venc = vencs.some((v) => v.venc === b.venc) ? String(b.venc) : (vencs.find((v) => v.dias >= 7) || vencs[0] || { venc: '' }).venc;
  const [oiAnt, ultDia, ivh] = await Promise.all([
    rest(`ewz_oi?select=dia,oi&dia=lt.${ny.dia}&order=dia.desc&limit=1`).catch(() => []),
    rest('ewz_serie?select=dia&order=ts.desc&limit=1').catch(() => []),
    rest('ewz_iv?select=dia,iv30,hv20,spot&order=dia.desc&limit=260').catch(() => []),
  ]);
  const dia = ultDia?.[0]?.dia || ny.dia;
  const [serie, bol] = await Promise.all([
    rest(`ewz_serie?select=ts,spot,net_c,net_p,expo&dia=eq.${dia}&order=ts.asc&limit=200`).catch(() => []),
    rest(`ewz_boletas?select=ts,sym,venc,tipo,k,dvol,preco,premio,lado,oi,vol,delta,expo&dia=eq.${dia}&order=ts.asc&limit=300`).catch(() => []),
  ]);
  const M = venc ? mapaOi(C, spot, venc, oiAnt?.[0]?.oi || null) : null;
  const B = (bol || []).map((x: any) => ({ s: x.sym, venc: x.venc, t: x.tipo, k: +x.k, dvol: +x.dvol, lado: x.lado, ts: String(x.ts).slice(0, 16), preco: +x.preco, premio: +x.premio, oi: +x.oi, vol: +x.vol, delta: +x.delta, expo: +x.expo }));
  const iv30 = I.pts.length ? I.iv30 : null, ivs = (ivh || []).map((x: any) => +x.iv30).filter((v: number) => v > 0);
  const rank = iv30 != null && ivs.length >= 20 ? (iv30 - Math.min(...ivs)) / ((Math.max(...ivs) - Math.min(...ivs)) || 1) : null;
  const p30 = I.pts.find((p) => p.dias >= 25 && p.strad != null) || I.pts.find((p) => p.strad != null);
  return {
    gerado: new Date().toISOString(), fonte: 'Cboe (cotações atrasadas ~15 min) e Yahoo', ny, spot, ...R,
    vol: { iv30, hv20, rank, nHist: ivs.length, mov1dp: iv30 != null ? iv30 * Math.sqrt(30 / 365) : null, strad: p30 ? { venc: p30.venc, dias: p30.dias, pct: p30.strad! / spot, usd: p30.strad } : null, pts: I.pts.slice(0, 8) },
    vencs, venc, oi: M, oiDia: oiAnt?.[0]?.dia || null, dia, serie: serie || [], boletas: B.sort((a: any, b: any) => b.premio - a.premio).slice(0, 40), estruturas: estruturas(B).slice(0, 15),
  };
}

async function grava() {
  const ny = horaNY();
  if (ny.semana < 1 || ny.semana > 5 || ny.min < 585 || ny.min > 995) return { fora: true, ny };
  const c = await cboe(true), spot = await preco(); if (!spot) throw new Error('sem cotação');
  const C = contratos(c.ops), est = (await rest('ewz_estado?select=*&id=eq.1').catch(() => []))?.[0] || null;
  const primeira = !est || est.dia !== ny.dia;
  if (primeira) {
    const oi: Record<string, number> = {}; for (const x of C) if (x.oi > 0 && diasEntre(ny.dia, x.venc) <= 120 && diasEntre(ny.dia, x.venc) >= 0 && Math.abs(x.k / spot - 1) <= 0.3) oi[x.s] = x.oi;
    await rest('ewz_oi', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ dia: ny.dia, oi }) }).catch(() => null);
    const velho = new Date(Date.now() - 35 * 864e5).toISOString().slice(0, 10);
    await Promise.all(['ewz_serie', 'ewz_boletas', 'ewz_oi'].map((t) => rest(`${t}?dia=lt.${velho}`, { method: 'DELETE' }).catch(() => null)));
  }
  const inc = incremento(C, primeira ? {} : (est.vols || {}), spot, 250_000, primeira);
  const netC = (primeira ? 0 : +est.net_c || 0) + inc.dNetC, netP = (primeira ? 0 : +est.net_p || 0) + inc.dNetP, R = resumo(C, spot, ny.dia), ts = new Date().toISOString();
  await rest('ewz_serie', { method: 'POST', body: JSON.stringify({ dia: ny.dia, ts, spot, net_c: netC, net_p: netP, vol_c: R.volC, vol_p: R.volP, expo: R.expo }) });
  if (inc.boletas.length) await rest('ewz_boletas', { method: 'POST', body: JSON.stringify(inc.boletas.map((x) => ({ dia: ny.dia, ts, sym: x.s, venc: x.venc, tipo: x.t, k: x.k, dvol: x.dvol, preco: x.preco, premio: x.premio, lado: x.lado, oi: x.oi, vol: x.vol, delta: x.delta, expo: x.expo }))) });
  await rest('ewz_estado', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id: 1, dia: ny.dia, vols: inc.vols, net_c: netC, net_p: netP, ts }) });
  const y = await yahoo().catch(() => null), I = ivAtm(C, spot, ny.dia);
  if (I.iv30) await rest('ewz_iv', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ dia: ny.dia, iv30: I.iv30, hv20: y ? hv(y.f, 20) : null, spot }) }).catch(() => null);
  const vies = netC > 0 && netP < 0 ? 'comprador' : netC < 0 && netP > 0 ? 'vendedor' : 'misto';
  return { ok: true, primeira, spot, netC, netP, vies, boletas: inc.boletas.filter((x) => x.premio >= 1_000_000).slice(0, 5) };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'ewz', cors); if (vr) return vr; }
  let b: any = {}; try { b = await req.json(); } catch { /* vazio */ }
  try {
    if (b.acao === 'grava') {
      if (!segredoIgual(req.headers.get('x-cron-secret'), CRON)) return out({ error: 'Não autorizado' }, 401);
      return out(await grava());
    }
    const uid = await usuarioDe(req);
    if (!uid) return out({ error: 'Entre na sua conta no app (Ferramentas → Conta).' }, 401);
    if (!dentroDoLimite(uid, 20)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
    return out(await agora(b));
  } catch (e) { return out({ error: (e as Error).message }, 502); }
});