// Função SCREENER — arquivo único para colar no editor do Supabase (Edge Functions → screener → index.ts)

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
// supabase/functions/screener/index.ts
// Scanner de tendência (preço > MM20 > MM50 > MM150 > MM200). Cotações do Yahoo Finance (gratuito, sem chave, pode ter atraso).
// Só responde a quem está logado no app. Publicar com "Verify JWT" desligado.

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};

// PETR4 -> PETR4.SA ; AAPL continua AAPL
const toYahoo = (s: string) => (/^[A-Z]{4}\d{1,2}$/.test(s) ? s + '.SA' : s);
const simboloOk = (s: string) => /^\^?[A-Z0-9][A-Z0-9.\-=]{0,14}$/.test(s); // aceita índices do Yahoo (^BVSP), moedas (BRL=X) e cripto (BTC-USD)

async function getCloses(sym: string): Promise<number[]> {
  const path = `/v8/finance/chart/${encodeURIComponent(toYahoo(sym))}?range=2y&interval=1d`;
  let lastErr = 'sem dados';
  for (const host of ['query1', 'query2']) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com${path}`, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) });
      if (!r.ok) { lastErr = 'HTTP ' + r.status; continue; }
      const j = await r.json();
      const res = j?.chart?.result?.[0];
      const raw: (number | null)[] = res?.indicators?.quote?.[0]?.close ?? [];
      const closes = raw.filter((v): v is number => typeof v === 'number' && v > 0);
      const live = res?.meta?.regularMarketPrice; // usa o último preço disponível no candle de hoje
      if (closes.length && typeof live === 'number' && live > 0) closes[closes.length - 1] = live;
      if (closes.length) return closes;
    } catch (e) { lastErr = String(e); }
  }
  throw new Error(lastErr);
}
// média móvel simples; null onde ainda não há pontos suficientes
function sma(c: number[], n: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < c.length; i++) { sum += c[i]; if (i >= n) sum -= c[i - n]; out.push(i >= n - 1 ? sum / n : null); }
  return out;
}
const stateAt = (p: number, a: number | null, b: number | null, c: number | null, d: number | null) => {
  if (a == null || b == null || c == null || d == null) return 'neutro';
  if (p > a && a > b && b > c && c > d) return 'alta';
  if (p < a && a < b && b < c && c < d) return 'queda';
  return 'neutro';
};
async function analyze(s: string, detail: boolean) {
  try {
    const c = await getCloses(s);
    if (c.length < 201) return { s, ok: false };
    const m20 = sma(c, 20), m50 = sma(c, 50), m150 = sma(c, 150), m200 = sma(c, 200);
    const n = c.length - 1;
    const state = stateAt(c[n], m20[n], m50[n], m150[n], m200[n]);
    let days = 0; // há quantos pregões o alinhamento dura
    if (state !== 'neutro') for (let i = n; i >= 0 && stateAt(c[i], m20[i], m50[i], m150[i], m200[i]) === state; i--) days++;
    const out: Record<string, unknown> = {
      s, ok: true, state, days, px: c[n], chg: (c[n] / c[n - 1] - 1) * 100, dist20: (c[n] / (m20[n] as number) - 1) * 100,
      ma: { 20: m20[n], 50: m50[n], 150: m150[n], 200: m200[n] },
    };
    if (detail) { const k = 120; out.series = { c: c.slice(-k), m20: m20.slice(-k), m50: m50.slice(-k), m150: m150.slice(-k), m200: m200.slice(-k) }; }
    return out;
  } catch { return { s, ok: false }; }
}

Deno.serve(async (req: Request) => {
  const cors = corsFor(req);
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'screener', cors); if (vr) return vr; }
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return json({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 30)) return json({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  try {
    const { symbols, detail } = await req.json();
    if (!Array.isArray(symbols) || !symbols.length) return json({ error: 'symbols vazio' }, 400);
    const list = [...new Set(symbols.slice(0, 30).map((x: unknown) => String(x).trim().toUpperCase()))].filter(simboloOk) as string[];
    if (!list.length) return json({ error: 'Nenhum código de ativo válido.' }, 400);
    const data = await Promise.all(list.map((s) => analyze(s, !!detail)));
    return json({ data });
  } catch { return json({ error: 'Pedido inválido.' }, 400); }
});