// Função SENTIMENTO — arquivo único para colar no editor do Supabase (Edge Functions → sentimento → index.ts)

// ===== cálculo =====
// supabase/functions/sentimento/calc.ts — Índice de Medo e Ganância calculado pelo código (funções puras, testadas em calc.test.ts).
// Cada componente vira uma nota de 0 (medo extremo) a 100 (ganância extrema) comparando o valor de hoje com o último ano.
export type Serie = { t: string[]; c: number[]; h?: number[]; l?: number[] };

export const rotulo = (v: number | null) => v == null ? 'sem dado' : v < 25 ? 'Medo extremo' : v < 45 ? 'Medo' : v <= 55 ? 'Neutro' : v <= 75 ? 'Ganância' : 'Ganância extrema';
const r0 = (x: number) => Math.round(Math.max(0, Math.min(100, x)));
const sma = (a: number[], n: number, i: number) => { if (i + 1 < n) return null; let s = 0; for (let k = i - n + 1; k <= i; k++) s += a[k]; return s / n; };
/** Posição percentual de x dentro da amostra (0 = menor valor do período, 100 = maior). */
export function percentil(amostra: number[], x: number): number | null {
  const a = amostra.filter((v) => isFinite(v));
  if (a.length < 20 || !isFinite(x)) return null;
  const menores = a.filter((v) => v < x).length, iguais = a.filter((v) => v === x).length;
  return r0(((menores + iguais / 2) / a.length) * 100);
}
export function rsi(c: number[], i: number, n = 14): number | null {
  if (i < n) return null;
  let g = 0, l = 0;
  for (let k = 1; k <= n; k++) { const d = c[k] - c[k - 1]; if (d >= 0) g += d; else l -= d; }
  g /= n; l /= n;
  for (let k = n + 1; k <= i; k++) { const d = c[k] - c[k - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
const ret = (c: number[], i: number, n: number) => (i >= n && c[i - n] > 0 ? c[i] / c[i - n] - 1 : NaN);
const vol = (c: number[], i: number, n = 20) => { if (i < n) return NaN; const r: number[] = []; for (let k = i - n + 1; k <= i; k++) r.push(Math.log(c[k] / c[k - 1])); const m = r.reduce((a, b) => a + b, 0) / n; return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) * Math.sqrt(252); };
/** Alinha uma série secundária pelas datas da principal (último valor conhecido). */
export function alinha(base: Serie, outra: Serie | null): number[] | null {
  if (!outra || !outra.t.length) return null;
  const m = new Map<string, number>(); outra.t.forEach((d, i) => m.set(d, outra.c[i]));
  let ult = NaN; return base.t.map((d) => { const v = m.get(d); if (v != null && isFinite(v)) ult = v; return ult; });
}

export type Componente = { id: string; nome: string; nota: number | null; leitura: string };
type Def = { id: string; nome: string; valor: (i: number) => number; inverte?: boolean; direto?: boolean; leitura: (v: number) => string };

/** Calcula o índice em cada um dos últimos `dias` pregões (percentil contra os 252 pregões anteriores a cada dia). */
function indice(defs: Def[], n: number, dias: number) {
  const hist: { i: number; v: number | null; comps: Componente[] }[] = [];
  for (let i = Math.max(0, n - dias); i < n; i++) {
    const comps = defs.map((d) => {
      const x = d.valor(i);
      let nota: number | null = null;
      if (isFinite(x)) {
        if (d.direto) nota = r0(x);
        else { const am: number[] = []; for (let k = Math.max(0, i - 252); k < i; k++) { const v = d.valor(k); if (isFinite(v)) am.push(v); } const p = percentil(am, x); nota = p == null ? null : d.inverte ? 100 - p : p; }
      }
      return { id: d.id, nome: d.nome, nota, leitura: isFinite(x) ? d.leitura(x) : 'sem dado' };
    });
    const ok = comps.filter((c) => c.nota != null);
    hist.push({ i, v: ok.length >= 3 ? r0(ok.reduce((s, c) => s + (c.nota as number), 0) / ok.length) : null, comps });
  }
  return hist;
}
const pct = (x: number, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
const num = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/** B3: momento do Ibovespa, força (RSI), volatilidade, posição na faixa de 52 semanas e porto seguro (Ibovespa × dólar). */
export function indiceB3(ibov: Serie, dolar: Serie | null, dias = 30) {
  const c = ibov.c, h = ibov.h || c, l = ibov.l || c, usd = alinha(ibov, dolar);
  const defs: Def[] = [
    { id: 'momento', nome: 'Momento (Ibovespa × média de 125 dias)', valor: (i) => { const m = sma(c, 125, i); return m ? c[i] / m - 1 : NaN; }, leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} da média` },
    { id: 'forca', nome: 'Força (RSI 14)', valor: (i) => rsi(c, i) ?? NaN, direto: true, leitura: (v) => 'RSI ' + num(v, 0) },
    { id: 'vol', nome: 'Volatilidade (20 dias)', valor: (i) => vol(c, i), inverte: true, leitura: (v) => pct(v) + ' ao ano' },
    { id: 'faixa', nome: 'Posição na faixa de 52 semanas', valor: (i) => { if (i < 20) return NaN; const a = Math.max(0, i - 251), mx = Math.max(...h.slice(a, i + 1)), mn = Math.min(...l.slice(a, i + 1)); return mx > mn ? ((c[i] - mn) / (mx - mn)) * 100 : NaN; }, direto: true, leitura: (v) => num(v, 0) + '% da faixa' },
    ...(usd ? [{ id: 'porto', nome: 'Porto seguro (Ibovespa × dólar em 20 dias)', valor: (i: number) => ret(c, i, 20) - ret(usd, i, 20), leitura: (v: number) => `${v >= 0 ? '+' : ''}${pct(v)} a favor da bolsa` } as Def] : []),
  ];
  return fecha(indice(defs, c.length, dias), ibov.t);
}
/** EUA (cálculo próprio, reserva quando a CNN não responde): S&P 500, VIX, RSI, faixa, ações × Treasuries e high yield × Treasuries. */
export function indiceEUA(spx: Serie, vix: Serie | null, tlt: Serie | null, hyg: Serie | null, ief: Serie | null, dias = 30) {
  const c = spx.c, h = spx.h || c, l = spx.l || c, V = alinha(spx, vix), T = alinha(spx, tlt), H = alinha(spx, hyg), I = alinha(spx, ief);
  const defs: Def[] = [
    { id: 'momento', nome: 'Momento (S&P 500 × média de 125 dias)', valor: (i) => { const m = sma(c, 125, i); return m ? c[i] / m - 1 : NaN; }, leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} da média` },
    { id: 'forca', nome: 'Força (RSI 14)', valor: (i) => rsi(c, i) ?? NaN, direto: true, leitura: (v) => 'RSI ' + num(v, 0) },
    { id: 'faixa', nome: 'Posição na faixa de 52 semanas', valor: (i) => { if (i < 20) return NaN; const a = Math.max(0, i - 251), mx = Math.max(...h.slice(a, i + 1)), mn = Math.min(...l.slice(a, i + 1)); return mx > mn ? ((c[i] - mn) / (mx - mn)) * 100 : NaN; }, direto: true, leitura: (v) => num(v, 0) + '% da faixa' },
    ...(V ? [{ id: 'vix', nome: 'Volatilidade (VIX)', valor: (i: number) => V[i], inverte: true, leitura: (v: number) => 'VIX ' + num(v) } as Def] : []),
    ...(T ? [{ id: 'porto', nome: 'Porto seguro (ações × Treasuries em 20 dias)', valor: (i: number) => ret(c, i, 20) - ret(T, i, 20), leitura: (v: number) => `${v >= 0 ? '+' : ''}${pct(v)} a favor das ações` } as Def] : []),
    ...(H && I ? [{ id: 'junk', nome: 'Apetite por risco (high yield × Treasuries)', valor: (i: number) => ret(H, i, 20) - ret(I, i, 20), leitura: (v: number) => `${v >= 0 ? '+' : ''}${pct(v, 2)} em 20 dias` } as Def] : []),
  ];
  return fecha(indice(defs, c.length, dias), spx.t);
}
function fecha(h: ReturnType<typeof indice>, t: string[]) {
  const u = h[h.length - 1], val = (k: number) => { const x = h[h.length - 1 - k]; return x ? x.v : null; };
  return { valor: u ? u.v : null, rotulo: rotulo(u ? u.v : null), data: u ? t[u.i] : null, componentes: u ? u.comps : [], ontem: val(1), semana: val(5), mes: val(21), hist: h.map((x) => ({ d: t[x.i], v: x.v })) };
}
/** Lê a resposta do Yahoo (chart) em séries diárias. */
export function serieYahoo(j: any): Serie | null {
  const r = j?.chart?.result?.[0], ts: number[] = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {};
  const out: Serie = { t: [], c: [], h: [], l: [] };
  ts.forEach((x, i) => { const c = q.close?.[i], h = q.high?.[i], l = q.low?.[i]; if (typeof c === 'number' && c > 0) { out.t.push(new Date(x * 1000 - 3 * 3600e3).toISOString().slice(0, 10)); out.c.push(c); out.h!.push(typeof h === 'number' ? h : c); out.l!.push(typeof l === 'number' ? l : c); } });
  return out.c.length ? out : null;
}
/** alternative.me (cripto) → formato comum. */
export function lerCripto(j: any) {
  const d = Array.isArray(j?.data) ? j.data : [];
  const pts = d.map((x: any) => ({ d: new Date(+x.timestamp * 1000).toISOString().slice(0, 10), v: +x.value })).filter((x: any) => isFinite(x.v)).reverse();
  if (!pts.length) return null;
  const u = pts[pts.length - 1], k = (n: number) => (pts[pts.length - 1 - n] ? pts[pts.length - 1 - n].v : null);
  return { valor: u.v, rotulo: rotulo(u.v), data: u.d, ontem: k(1), semana: k(7), mes: k(30), hist: pts.slice(-30), componentes: [] as Componente[] };
}
/** CNN (EUA) → formato comum. */
export function lerCNN(j: any) {
  const f = j?.fear_and_greed, h = j?.fear_and_greed_historical?.data;
  if (!f || !isFinite(+f.score)) return null;
  const pts = (Array.isArray(h) ? h : []).map((x: any) => ({ d: new Date(+x.x).toISOString().slice(0, 10), v: Math.round(+x.y) })).filter((x: any) => isFinite(x.v));
  const ult = new Map<string, number>(); pts.forEach((p: any) => ult.set(p.d, p.v));
  const comp = (k: string, nome: string) => { const x = j?.[k]; return x && isFinite(+x.score) ? { id: k, nome, nota: Math.round(+x.score), leitura: String(x.rating || '') } : null; };
  const comps = [comp('market_momentum_sp500', 'Momento do S&P 500'), comp('stock_price_strength', 'Força das ações (máximas × mínimas)'), comp('stock_price_breadth', 'Amplitude (volume em alta × baixa)'), comp('put_call_options', 'Opções put/call'), comp('market_volatility_vix', 'Volatilidade (VIX)'), comp('safe_haven_demand', 'Porto seguro'), comp('junk_bond_demand', 'Apetite por high yield')].filter(Boolean) as Componente[];
  const v = Math.round(+f.score);
  return { valor: v, rotulo: rotulo(v), data: f.timestamp ? String(f.timestamp).slice(0, 10) : null, ontem: isFinite(+f.previous_close) ? Math.round(+f.previous_close) : null, semana: isFinite(+f.previous_1_week) ? Math.round(+f.previous_1_week) : null, mes: isFinite(+f.previous_1_month) ? Math.round(+f.previous_1_month) : null, hist: [...ult.entries()].map(([d, v]) => ({ d, v })).slice(-30), componentes: comps };
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
export const VERSAO_FN = 'v90';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/sentimento/index.ts
// Medo e Ganância: B3 (cálculo próprio: Ibovespa e dólar), EUA (CNN; se não responder, cálculo próprio com S&P 500, VIX,
// Treasuries e high yield) e cripto (alternative.me, gratuito). Guarda o resultado por 30 min.
// Publicar:  supabase functions deploy sentimento --no-verify-jwt

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
let cache: { ts: number; v: unknown } | null = null;

async function yahoo(sym: string): Promise<Serie | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2y&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12_000) });
    return r.ok ? serieYahoo(await r.json()) : null;
  } catch { return null; }
}
async function json(url: string, headers: Record<string, string> = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function monta() {
  const erros: string[] = [];
  const [ibov, usd, spx, vix, tlt, hyg, ief] = await Promise.all(['^BVSP', 'BRL=X', '^GSPC', '^VIX', 'TLT', 'HYG', 'IEF'].map(yahoo));
  const b3 = ibov ? { ...indiceB3(ibov, usd), fonte: 'Cálculo do app (Ibovespa e dólar, Yahoo Finance)' } : null;
  if (!b3) erros.push('B3: Yahoo sem dados');
  let eua: any = null;
  try {
    const de = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
    const c = lerCNN(await json(`https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${de}`, { Referer: 'https://edition.cnn.com/', Origin: 'https://edition.cnn.com' }));
    if (c) eua = { ...c, fonte: 'CNN Fear & Greed' };
  } catch (e) { erros.push('CNN: ' + (e as Error).message); }
  if (!eua && spx) eua = { ...indiceEUA(spx, vix, tlt, hyg, ief), fonte: 'Cálculo do app (S&P 500, VIX, Treasuries e high yield; a CNN não respondeu)' };
  let cripto: any = null;
  try { const c = lerCripto(await json('https://api.alternative.me/fng/?limit=31')); if (c) cripto = { ...c, fonte: 'alternative.me' }; }
  catch (e) { erros.push('Cripto: ' + (e as Error).message); }
  return { b3, eua, cripto, gerado: new Date().toISOString(), erros };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'sentimento', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 20)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  if (cache && Date.now() - cache.ts < 30 * 60_000) return out(cache.v);
  try { const v = await monta(); if (v.b3 || v.eua || v.cripto) cache = { ts: Date.now(), v }; return out(v); }
  catch (e) { return out({ error: (e as Error).message }, 500); }
});