// Função NOTICIAS — arquivo único para colar no editor do Supabase (Edge Functions → noticias → index.ts)

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
// supabase/functions/noticias/index.ts
// Lê o RSS do Money Times e devolve só título, link, fonte, horário e categorias.
// O texto das matérias NÃO é copiado (os termos de uso do site proíbem); o app só mostra a manchete e abre o site.
//
// Deploy (sem verificação de JWT, igual às funções "precos" e "screener"):
//   supabase functions deploy noticias --no-verify-jwt
// Secret opcional: ALLOWED_ORIGINS=https://seu-usuario.github.io

const FEEDS = [
  'https://www.moneytimes.com.br/mercados/feed/',
  'https://www.moneytimes.com.br/feed/',
];
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';
const TTL = 5 * 60 * 1000;

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*';
  else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};


type Item = { t: string; l: string; a: string; d: string; c: string[] };
/** Só links http(s) de verdade (um feed adulterado não consegue mandar javascript: para o app). */
const linkOk = (u: string) => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch { return false; } };

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const cdata = (s: string) => s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
const tag = (x: string, n: string) => {
  const m = x.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, 'i'));
  return m ? dec(cdata(m[1])).trim() : '';
};

function parse(xml: string): Item[] {
  const out: Item[] = [];
  for (const blk of xml.split(/<item[\s>]/i).slice(1)) {
    const x = blk.split(/<\/item>/i)[0];
    const t = tag(x, 'title');
    const l = tag(x, 'link');
    const d = new Date(tag(x, 'pubDate'));
    if (!t || !/^https:\/\/(www\.)?moneytimes\.com\.br\//.test(l) || isNaN(+d)) continue;
    const c = [...x.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => dec(cdata(m[1])).trim()).filter(Boolean);
    out.push({ t, l, a: tag(x, 'dc:creator'), d: d.toISOString(), c: c.slice(0, 12) });
  }
  return out;
}

let cache: { ts: number; itens: Item[] } | null = null;

async function carrega(): Promise<Item[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.itens;
  const res = await Promise.allSettled(
    FEEDS.map(async (u) => {
      const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' } });
      if (!r.ok) throw new Error('feed ' + r.status);
      return parse(await r.text());
    }),
  );
  const mapa = new Map<string, Item>();
  for (const r of res) if (r.status === 'fulfilled') for (const it of r.value) if (linkOk(it.l) && !mapa.has(it.l)) mapa.set(it.l, it);
  const itens = [...mapa.values()].sort((a, b) => +new Date(b.d) - +new Date(a.d)).slice(0, 60);
  if (!itens.length) {
    if (cache) return cache.itens; // feed fora do ar: devolve a última cópia
    throw new Error('Não consegui ler o feed do Money Times agora.');
  }
  cache = { ts: Date.now(), itens };
  return itens;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) =>
    new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=120' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'noticias', cors); if (vr) return vr; }
  if (req.method !== 'GET' && req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 30)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  try {
    const itens = await carrega();
    return out({ fonte: 'Money Times', gerado: new Date().toISOString(), itens });
  } catch (e) {
    return out({ error: (e as Error).message }, 502);
  }
});
