// Função PRECOS — arquivo único para colar no editor do Supabase (Edge Functions → precos → index.ts)

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
// supabase/functions/precos/index.ts
// Último preço dos ativos das posições abertas: B3 pela brapi.dev, EUA e USD/BRL pela Twelve Data.
// Secrets: BRAPI_TOKEN, TWELVE_KEY (opcional BRAPI_LOTE). Só responde a quem está logado. Publicar com "Verify JWT" desligado.

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
const limpaBR = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
const limpaUS = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12);

Deno.serve(async (req) => {
  const H = { ...corsFor(req), 'Content-Type': 'application/json' };
  const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: H });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: H });
  { const vr = versaoResp(req, 'precos', corsFor(req)); if (vr) return vr; }
  if (req.method !== 'POST') return J({ erro: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return J({ erro: 'entre na sua conta' }, 401);
  if (!dentroDoLimite(uid, 30)) return J({ erro: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  const b = await req.json().catch(() => ({}));
  const br = [...new Set((Array.isArray(b.br) ? b.br : []).map(limpaBR).filter(Boolean))].slice(0, 40) as string[];
  const us = [...new Set((Array.isArray(b.us) ? b.us : []).map(limpaUS).filter(Boolean))].slice(0, 40) as string[];
  const out = { br: {} as Record<string, number>, us: {} as Record<string, number>, fx: 0, erros: [] as string[] };
  const bt = Deno.env.get('BRAPI_TOKEN') ?? '', td = Deno.env.get('TWELVE_KEY') ?? '';
  const lote = Math.min(20, Math.max(1, Number(Deno.env.get('BRAPI_LOTE') ?? '1')));

  for (let i = 0; i < br.length; i += lote) {
    const g = br.slice(i, i + lote);
    try {
      const r = await fetch(`https://brapi.dev/api/quote/${g.join(',')}`, { headers: bt ? { Authorization: `Bearer ${bt}` } : {}, signal: AbortSignal.timeout(10_000) });
      const j = await r.json();
      for (const q of j.results ?? []) if (q.regularMarketPrice > 0) out.br[q.symbol] = q.regularMarketPrice;
      for (const s of g) if (!out.br[s]) out.erros.push(s);
    } catch { out.erros.push(...g); }
  }

  const ut = [...us, 'USD/BRL'];
  for (let i = 0; i < ut.length; i += 8) {
    const g = ut.slice(i, i + 8);
    try {
      const r = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(g.join(','))}&apikey=${encodeURIComponent(td)}`, { signal: AbortSignal.timeout(10_000) });
      const j = await r.json();
      for (const s of g) {
        const v = g.length === 1 ? j : j[s], p = Number(v?.price);
        if (p > 0) { if (s === 'USD/BRL') out.fx = p; else out.us[s] = p; } else out.erros.push(s);
      }
    } catch { out.erros.push(...g); }
  }
  return J(out);
});
