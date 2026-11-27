/**
 * v1042 — Fase A da saída do Supabase: Edge Functions de dados públicos rodando no Worker.
 * Usa o mesmo código-fonte de supabase/functions/<nome>/index.ts (uma fonte só durante a transição):
 * um "Deno" mínimo captura o handler de Deno.serve e entrega as variáveis do Worker em Deno.env.get.
 * O login continua no Supabase Auth (as funções validam o usuário em /auth/v1/user, que é o básico).
 * Nada de Logs/Analytics; nenhum dado privado em cache público.
 */
const FUNCOES = Object.freeze({
  'terminal': () => import('../../supabase/functions/terminal/index.ts'),
  'mesa-macro': () => import('../../supabase/functions/mesa-macro/index.ts'),
  'sazonal-extras': () => import('../../supabase/functions/sazonal-extras/index.ts'),
  'finnhub-token': () => import('../../supabase/functions/finnhub-token/index.ts'),
  // Fase B (v1054): funções chamadas pelo app. Mesma fonte; o Supabase fica só com Auth e tabelas.
  'analise': () => import('../../supabase/functions/analise/index.ts'),
  'resumo': () => import('../../supabase/functions/resumo/index.ts'),
  'revista-ia': () => import('../../supabase/functions/revista-ia/index.ts'),
  'conhecimento-ia': () => import('../../supabase/functions/conhecimento-ia/index.ts'),
  'aulas': () => import('../../supabase/functions/aulas/index.ts'),
  'mesa': () => import('../../supabase/functions/mesa/index.ts'),
  'logos': () => import('../../supabase/functions/logos/index.ts'),
  'series': () => import('../../supabase/functions/series/index.ts'),
  'screener': () => import('../../supabase/functions/screener/index.ts'),
});
/* Fase B: só roda no Worker quando as chaves essenciais já estão cadastradas nele.
 * Sem elas, responde 503 e o app volta para a função antiga do Supabase (sem quebrar).
 * Ao cadastrar as chaves na Cloudflare, a função passa a rodar no Worker sozinha. */
const SB = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const REQUISITOS = Object.freeze({
  'analise': [...SB, 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'],
  'resumo': [...SB, 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'],
  'revista-ia': SB,
  'conhecimento-ia': SB,
  'aulas': SB,
  'mesa': [...SB, 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'],
});
export function faltamSegredosV1054(nome, env) {
  return (REQUISITOS[nome] || []).filter((k) => typeof env?.[k] !== 'string' || !env[k]).length;
}
export const FUNCOES_V1042 = Object.freeze(Object.keys(FUNCOES));

const handlers = new Map();
let envAtual = {};
let registrando = null;

function instalarDeno() {
  if (globalThis.Deno && globalThis.Deno.__v1042) return;
  globalThis.Deno = {
    __v1042: true,
    env: {
      get(nome) {
        const e = envAtual || {};
        if (nome === 'ALLOWED_ORIGINS') return e.ALLOWED_ORIGINS || e.ALLOWED_ORIGIN || 'https://meudiariotrade.github.io';
        if (nome === 'TWELVE_KEY' || nome === 'TWELVE_API_KEY' || nome === 'TWELVEDATA_KEY') return e[nome] || e.TWELVE_KEY || e.TWELVE_API_KEY || e.TWELVEDATA_KEY;
        const v = e[nome];
        return typeof v === 'string' ? v : undefined;
      },
      toObject() { return { ...envAtual }; },
    },
    serve(a, b) {
      const h = typeof a === 'function' ? a : b;
      if (registrando && typeof h === 'function') handlers.set(registrando, h);
      return { finished: Promise.resolve(), shutdown() {} };
    },
  };
}

async function handlerDe(nome) {
  if (handlers.has(nome)) return handlers.get(nome);
  instalarDeno();
  registrando = nome;
  try { await FUNCOES[nome](); } finally { registrando = null; }
  const h = handlers.get(nome);
  if (!h) throw new Error('Função ' + nome + ' não registrou o handler.');
  return h;
}

/** Rota /v1/fn/<nome>: devolve null quando a rota não é desta camada. */
export async function funcaoV1042(request, env, ctx) {
  const url = new URL(request.url);
  const m = /^\/v1\/fn\/([a-z0-9-]+)$/.exec(url.pathname);
  if (!m) return null;
  const nome = m[1];
  if (!Object.prototype.hasOwnProperty.call(FUNCOES, nome))
    return Response.json({ error: 'Função não migrada.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (faltamSegredosV1054(nome, env))
    return Response.json({ error: 'Função ainda sem chaves no Cloudflare; usando a origem anterior.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  envAtual = env || {};
  // aulas e resumo continuam o processamento em segundo plano (EdgeRuntime.waitUntil no Supabase).
  globalThis.EdgeRuntime = { waitUntil: (p) => { try { ctx?.waitUntil?.(Promise.resolve(p).catch(() => {})); } catch (_) { /* sem ctx em teste */ } } };
  try {
    const h = await handlerDe(nome);
    const resp = await h(request);
    // Respostas destas funções dependem do usuário/autorização: nunca em cache compartilhado.
    const r = new Response(resp.body, resp);
    if (!r.headers.has('Cache-Control')) r.headers.set('Cache-Control', 'private, no-store');
    return r;
  } catch (e) {
    return Response.json({ error: 'Falha na função ' + nome + ' (Cloudflare).' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
