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
const FEEDS_PRIORITARIOS = [
  { fonte: 'InfoMoney', host: 'infomoney.com.br', url: 'https://www.infomoney.com.br/feed/' },
  { fonte: 'CNBC', host: 'cnbc.com', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
];
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';
const TTL = 90 * 1000;

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

/** RSS de portais conhecidos: valida origem e data, sem buscar ou copiar corpo da matéria. */
export function parsePortal(xml: string, fonte: string, host: string, agora = Date.now()): Item[] {
  const out: Item[] = [];
  for (const parte of xml.slice(0, 450_000).split(/<item[\s>]/i).slice(1, 45)) {
    const bloco = parte.split(/<\/item>/i)[0];
    const t = tag(bloco, 'title').slice(0, 230), l = tag(bloco, 'link');
    const data = Date.parse(tag(bloco, 'pubDate'));
    let origemOk = false;
    try { const u = new URL(l); origemOk = u.protocol === 'https:' &&
      (u.hostname === host || u.hostname.endsWith('.' + host)); } catch {}
    if (!origemOk || t.length < 12 || !Number.isFinite(data) || data > agora + 300_000 ||
      data < agora - 2 * 86400_000) continue;
    const c = [...bloco.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)]
      .map((x) => dec(cdata(x[1]))).filter(Boolean).slice(0, 8);
    out.push({ t, l, d: new Date(data).toISOString(), a: fonte, c });
  }
  return out.slice(0, 28);
}

// Fonte principal do filtro X / Breaking: RSS direto via Edge Function.
// No iPhone os proxies RSSHub/Nitter frequentemente retornam 404/429.
const X_PERFIS = ['FirstSquawk', 'DeItaone'] as const;
export function parseX(xml: string, perfil: string, agora = Date.now()): Item[] {
  if (!X_PERFIS.some((p) => p.toLowerCase() === perfil.toLowerCase())) return [];
  const out: Item[] = [];
  for (const parte of xml.slice(0, 450_000).split(/<item[\s>]/i).slice(1, 50)) {
    const bloco = parte.split(/<\/item>/i)[0];
    const t = tag(bloco, 'title').slice(0, 230);
    const l = tag(bloco, 'link');
    const d = Date.parse(tag(bloco, 'pubDate'));
    const valida = new RegExp('^https://(?:www\\.)?x\\.com/' + perfil + '/status/[0-9]+(?:[/?#].*)?$', 'i').test(l);
    if (!valida || !linkOk(l) || t.length < 12 || !Number.isFinite(d) ||
        d > agora + 300_000 || d < agora - 48 * 3600_000) continue;
    out.push({ t, l, a: 'X · @' + perfil, d: new Date(d).toISOString(), c: ['x', 'breaking'] });
    if (out.length >= 18) break;
  }
  return out;
}
type DadosNoticias = { itens: Item[]; fontesX: { ok: string[]; falhas: string[] } };
let cache: { ts: number; dados: DadosNoticias } | null = null;

async function carrega(): Promise<DadosNoticias> {
  if (cache && Date.now() - cache.ts < 3 * 60_000) return cache.dados;
  const tarefas = [
    ...FEEDS.map((url) => ({
      nome: 'Money Times', consultar: async () => {
        const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(8500) });
        if (!r.ok) throw new Error('feed ' + r.status);
        const itens = parse(await r.text());
        if (!itens.length) throw new Error('feed vazio');
        return itens.slice(0, 35);
      },
    })),
    ...FEEDS_PRIORITARIOS.map((feed) => ({
      nome: feed.fonte, consultar: async () => {
        const r = await fetch(feed.url, {
          headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' },
          signal: AbortSignal.timeout(7500),
        });
        if (!r.ok) throw new Error('RSS ' + r.status);
        const itens = parsePortal(await r.text(), feed.fonte, feed.host);
        if (!itens.length) throw new Error('RSS sem notícias recentes');
        return itens;
      }
    })),
    ...X_PERFIS.map((perfil) => ({
      nome: 'X @' + perfil, consultar: async () => {
        // Mesmo RSS do FxEmbed, com um segundo domínio somente quando o principal falhar.
        for (const url of [
          'https://fxtwitter.com/' + perfil + '/feed.xml?count=35',
          'https://fixupx.com/' + perfil + '/feed.xml?count=35',
        ]) {
          try {
            const r = await fetch(url, {
              headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
              signal: AbortSignal.timeout(7500)
            });
            if (!r.ok) continue;
            const itens = parseX(await r.text(), perfil);
            if (itens.length) return itens;
          } catch { /* contingência em série, sem sobrecarregar o provedor */ }
        }
        throw new Error('RSS X temporariamente indisponível: @' + perfil);
      },
    })),
  ];
  const respostas = await Promise.allSettled(tarefas.map((t) => t.consultar()));
  const mapa = new Map<string, Item>(), ok: string[] = [], falhas: string[] = [];
  for (let i = 0; i < respostas.length; i++) {
    const r = respostas[i], nome = tarefas[i].nome;
    if (nome.startsWith('X @')) (r.status === 'fulfilled' ? ok : falhas).push(nome);
    if (r.status === 'fulfilled') for (const it of r.value)
      if (linkOk(it.l) && !mapa.has(it.l)) mapa.set(it.l, it);
  }
  const itens = [...mapa.values()].sort((a,b) => +new Date(b.d) - +new Date(a.d)).slice(0, 110);
  if (!itens.length) {
    if (cache && Date.now() - cache.ts < 30 * 60_000) return cache.dados;
    throw new Error('Nenhuma fonte de notícias respondeu com manchetes válidas.');
  }
  const dados = { itens, fontesX: { ok, falhas } };
  cache = { ts: Date.now(), dados };
  return dados;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) =>
    new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=30' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'noticias', cors); if (vr) return vr; }
  if (req.method !== 'GET' && req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 30)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  try {
    const dados = await carrega();
    return out({ fonte: 'InfoMoney + Money Times + CNBC + X', gerado: new Date().toISOString(), atualizadoEm: new Date(cache?.ts || Date.now()).toISOString(), ...dados });
  } catch (e) {
    return out({ error: (e as Error).message }, 502);
  }
});
