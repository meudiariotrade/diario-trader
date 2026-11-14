// supabase/functions/finnhub-token/index.ts — v624
// Entrega a chave da Finnhub só para quem está logado (token do app). A chave fica no ambiente
// (secret FINNHUB_API_KEY) ou no Vault (FINNHUB_API_KEY, lida pela RPC public.finnhub_chave()).
// Nada de chave no código do app. Publicar com "Verify JWT" desligado: a função confere o login.

const SB = Deno.env.get('SUPABASE_URL') || '', ANON = Deno.env.get('SUPABASE_ANON_KEY') || '', SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

async function logado(req: Request): Promise<boolean> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!tk || tk === ANON || tk.split('.').length !== 3) return false;
  try {
    const r = await fetch(SB + '/auth/v1/user', { headers: { apikey: ANON || SVC, Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return false;
    const j = await r.json();
    return typeof j?.id === 'string' && j.id.length > 10;
  } catch { return false; }
}
let cache: { v: string; ate: number } | null = null;
async function chave(): Promise<string> {
  const env = (Deno.env.get('FINNHUB_API_KEY') || '').trim();
  if (env) return env;
  if (cache && cache.ate > Date.now()) return cache.v;
  try {
    const r = await fetch(SB + '/rest/v1/rpc/finnhub_chave', { method: 'POST', headers: { apikey: SVC, Authorization: 'Bearer ' + SVC, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(6000) });
    const v = r.ok ? String((await r.json()) || '').trim() : '';
    cache = { v, ate: Date.now() + 300_000 };
    return v;
  } catch { return ''; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  if (!(await logado(req))) return out({ error: 'Entre na sua conta.' }, 401);
  const v = await chave();
  return v ? out({ token: v }) : out({ token: null, motivo: 'FINNHUB_API_KEY não configurada' });
});
