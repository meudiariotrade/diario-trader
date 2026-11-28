/**
 * v1062 — Fase D: as rotinas agendadas rodam na Cloudflare, não mais nas Edge Functions do Supabase.
 * O agendador (agenda-v932) chamava `supabase.co/functions/v1/<nome>` ~600 vezes por dia.
 * Aqui rodam `notificar` (avisos a cada 5 min, notícias urgentes, calendário: ~470/dia) e `rotina-cron`.
 * `movimentos` continua no Supabase: em dia agitado passa de 50 chamadas externas por execução
 * (limite do plano gratuito de Workers) e mandaria alertas pela metade.
 * Agora o mesmo código-fonte (supabase/functions/<nome>/index.ts) roda dentro deste Worker,
 * numa invocação própria (binding SELF), e o Supabase só é chamado como reserva se a Cloudflare falhar.
 * - Banco continua no Supabase (tabelas = dados), com a mesma chave de serviço.
 * - Push: `npm:web-push` é trocado pela implementação Web Crypto (webpush-v1062.mjs) via alias.
 * - Chaves VAPID: as que já estão no D1 (segredos-v1041). Estas rotinas não usam IA: nenhuma consulta ao Vault.
 * - Nada de Logs/Analytics; nenhum segredo é devolvido por HTTP.
 */
import { segredoV1041 } from './segredos-v1041.mjs';

const FUNCOES = Object.freeze({
  'notificar': () => import('../../supabase/functions/notificar/index.ts'),
  'rotina-cron': () => import('../../supabase/functions/rotina-cron/index.ts'),
});
export const FUNCOES_LOCAIS_V1062 = Object.freeze(Object.keys(FUNCOES));
const PUBLICO = Object.freeze({
  SUPABASE_URL: 'https://vdzwydizostutukppcsj.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_LjeuewTU7OjYrNiRzM2nJQ_iAa9UCkC',
});
const VAPID = Object.freeze({ VAPID_PUBLIC: 'diario_vapid_public', VAPID_PRIVATE: 'diario_vapid_private', VAPID_SUBJECT: 'diario_vapid_subject' });
const ESSENCIAIS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'VAPID_PUBLIC', 'VAPID_PRIVATE'];
export const ROTA_LOCAL_V1062 = '/v1/fn-local/';

/** Deve rodar localmente? Desligável pela variável FUNCOES_LOCAIS_V1062=0 (volta tudo ao Supabase). */
export function rodaLocalV1062(nome, env) {
  return !!(env && env.SELF && typeof env.SELF.fetch === 'function' && env.FUNCOES_LOCAIS_V1062 !== '0' &&
    Object.prototype.hasOwnProperty.call(FUNCOES, nome));
}

const iguais = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
};

/** Monta o leitor de variáveis: Worker → valores públicos → VAPID no D1. */
export async function leitorV1062(env, opcoes = {}) {
  const lerSegredo = opcoes.segredo || ((nome) => segredoV1041(env, nome));
  const extra = {};
  for (const [k, nome] of Object.entries(VAPID)) {
    if (typeof env[k] === 'string' && env[k]) continue;
    try { const v = await lerSegredo(nome); if (v) extra[k] = v; } catch (_) { /* sem D1: fica sem */ }
  }
  return (k) => (typeof env[k] === 'string' && env[k] ? env[k] : extra[k] || PUBLICO[k]);
}

let lerAtual = () => undefined;
let envAtual = {};
let registrando = null;
const handlers = new Map();

/* As rotinas buscam mercados/agenda/ADRs chamando `supabase.co/functions/v1/macro|adrs`.
 * Esses dados são públicos e já saem do cache da Cloudflare (Worker diario-trader); só se ele falhar
 * a chamada segue para o Supabase, como antes. */
const CF_PUBLICO = 'https://diario-trader.lucianosilva43567.workers.dev';
let publicoBinding = null; // service binding NOTICIAS → Worker diario-trader (Worker não chama Worker pelo workers.dev)
export function rotaPublicaV1062(url, init) {
  let u;
  try { u = new URL(String(url)); } catch (_) { return null; }
  if (u.origin !== PUBLICO.SUPABASE_URL || String(init?.method || 'GET').toUpperCase() !== 'POST') return null;
  let b = {};
  try { b = JSON.parse(String(init?.body || '{}')) || {}; } catch (_) { return null; }
  if (u.pathname === '/functions/v1/macro') {
    if (b.modo === 'diag') return null;
    const p = new URLSearchParams();
    for (const k of ['modo', 'aba', 'semana']) if (b[k] != null && b[k] !== '') p.set(k, String(b[k]).slice(0, 80));
    return CF_PUBLICO + '/v1/macro?' + p.toString();
  }
  if (u.pathname === '/functions/v1/adrs') {
    const s = [...new Set((Array.isArray(b.symbols) ? b.symbols : []).map((x) => String(x || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12)).filter(Boolean))].slice(0, 40);
    return s.length ? CF_PUBLICO + '/v1/adrs?s=' + encodeURIComponent(s.join(',')) : null;
  }
  return null;
}
/** fetch das rotinas: Worker diario-trader pela ligação interna; macro/ADRs do cache público; resto igual. */
export function criarFetchV1062(nativo, binding) {
  const novo = async (input, init) => {
    const b = binding();
    if (b) {
      // O código das funções chama o Worker diario-trader pelo endereço público
      // (/v1/noticias, /v2/eventos); entre Workers isso precisa ir pela ligação interna.
      try {
        const u = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input?.url);
        if (u.origin === CF_PUBLICO) return b.fetch(input, init);
      } catch (_) { /* segue */ }
      const alvo = rotaPublicaV1062(typeof input === 'string' || input instanceof URL ? input : input?.url, init);
      if (alvo) {
        try {
          const r = await b.fetch(alvo, { method: 'GET', headers: { Accept: 'application/json' }, signal: init?.signal || AbortSignal.timeout(20000) });
          if (r.ok) return r;
        } catch (_) { /* segue para a origem anterior */ }
      }
    }
    return nativo(input, init);
  };
  novo.__v1062 = true;
  return novo;
}
function instalarFetchPublico() {
  if (globalThis.fetch.__v1062) return;
  globalThis.fetch = criarFetchV1062(globalThis.fetch.bind(globalThis), () => publicoBinding);
}

function instalarDeno() {
  instalarFetchPublico();
  if (globalThis.Deno && globalThis.Deno.__v1062) return;
  globalThis.Deno = {
    __v1062: true,
    env: {
      get(nome) {
        if (nome === 'ALLOWED_ORIGINS') return envAtual.ALLOWED_ORIGINS || 'https://meudiariotrade.github.io';
        const v = lerAtual(nome);
        return typeof v === 'string' ? v : undefined;
      },
      toObject() { return {}; },
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

const json = (obj, status) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

/** Rota interna POST /v1/fn-local/<nome>: só aceita o segredo do agendador. Devolve null se não for desta rota. */
export async function funcaoLocalV1062(request, env, ctx, opcoes = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(ROTA_LOCAL_V1062)) return null;
  const nome = url.pathname.slice(ROTA_LOCAL_V1062.length);
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (!iguais(request.headers.get('x-cron-secret') || '', env?.CRON_SECRET || '')) return json({ error: 'Não autorizado.' }, 401);
  if (!Object.prototype.hasOwnProperty.call(FUNCOES, nome)) return json({ error: 'Função não migrada.' }, 404);
  const ler = await leitorV1062(env, opcoes);
  if (ESSENCIAIS.some((k) => { const v = ler(k); return typeof v !== 'string' || !v; }))
    return json({ error: 'Função ainda sem chaves no Cloudflare; usando a origem anterior.' }, 503);
  envAtual = env || {};
  lerAtual = ler;
  publicoBinding = env?.NOTICIAS && typeof env.NOTICIAS.fetch === 'function' ? env.NOTICIAS : null;
  globalThis.EdgeRuntime = { waitUntil: (p) => { try { ctx?.waitUntil?.(Promise.resolve(p).catch(() => {})); } catch (_) { /* sem ctx */ } } };
  try {
    const h = await handlerDe(nome);
    const original = new URL(request.url);
    const req = new Request(PUBLICO.SUPABASE_URL + '/functions/v1/' + nome + original.search, request);
    const resp = await h(req);
    const r = new Response(resp.body, resp);
    r.headers.set('Cache-Control', 'no-store');
    r.headers.set('x-diario-origem', 'cloudflare');
    return r;
  } catch (e) {
    return json({ error: 'Falha na função ' + nome + ' (Cloudflare).' }, 502);
  }
}
