// Função SERIES — histórico de indicadores do Banco Central (SGS) para o gráfico do Terminal.
// Arquivo único (Edge Functions → series → index.ts). Só leitura de dados públicos do BCB; não grava nada.
// Lista fechada de séries: o app não consegue pedir outro endereço.

// ===== séries permitidas =====
type Def = { sgs: number; nome: string; unidade: string; freq: 'diaria' | 'mensal'; passo?: boolean };
const SERIES: Record<string, Def> = {
  selic:      { sgs: 432,   nome: 'Selic meta',               unidade: '% a.a.', freq: 'diaria', passo: true },
  cdi:        { sgs: 4389,  nome: 'CDI anualizado',           unidade: '% a.a.', freq: 'diaria', passo: true },
  ipca:       { sgs: 433,   nome: 'IPCA mensal',              unidade: '% no mês', freq: 'mensal' },
  ipca12:     { sgs: 13522, nome: 'IPCA 12 meses',            unidade: '%',      freq: 'mensal' },
  igpm:       { sgs: 189,   nome: 'IGP-M mensal',             unidade: '% no mês', freq: 'mensal' },
  ibcbr:      { sgs: 24364, nome: 'IBC-Br (dessazonalizado)', unidade: 'índice', freq: 'mensal' },
  desemprego: { sgs: 24369, nome: 'Desemprego (PNAD)',        unidade: '%',      freq: 'mensal' },
  ptax:       { sgs: 1,     nome: 'Dólar PTAX (venda)',       unidade: 'R$',     freq: 'diaria' },
};

// ===== segurança (igual às outras funções do app) =====
const ENV = (k: string) => ((globalThis as any).Deno?.env?.get(k) as string | undefined) || '';
const CACHE_U = new Map<string, { uid: string; ate: number }>();
async function usuarioDe(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim(), url = ENV('SUPABASE_URL'), anon = ENV('SUPABASE_ANON_KEY');
  if (!tk || !url || tk.split('.').length !== 3 || tk === anon || tk.length > 4096) return null;
  const c = CACHE_U.get(tk);
  if (c && c.ate > Date.now()) return c.uid;
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: anon || ENV('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || typeof j.id !== 'string') return null;
    if (CACHE_U.size > 500) CACHE_U.clear();
    CACHE_U.set(tk, { uid: j.id, ate: Date.now() + 5 * 60_000 });
    return j.id;
  } catch { return null; }
}
const USO = new Map<string, number[]>();
function dentroDoLimite(chave: string, max: number, janelaMs = 60_000, agora = Date.now()): boolean {
  const L = (USO.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (L.length >= max) { USO.set(chave, L); return false; }
  L.push(agora); USO.set(chave, L);
  if (USO.size > 2000) USO.clear();
  return true;
}
const VERSAO_FN = 'v305';
const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
const ORIGENS = (ENV('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};

// ===== Banco Central =====
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';
const cache = new Map<string, { ts: number; v: unknown }>();
const fmt = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
const epoch = (br: string) => { const [d, m, y] = String(br).split('/'); const t = Date.UTC(+y, +m - 1, +d, 15) / 1000; return Number.isFinite(t) ? t : NaN; };

async function serie(def: Def, desde: number): Promise<number[][]> {
  const hoje = new Date(), partes: [Date, Date][] = [];
  // a API do SGS aceita no máximo 10 anos por pedido
  for (let y = desde; y <= hoje.getUTCFullYear(); y += 9) partes.push([new Date(Date.UTC(y, 0, 1)), new Date(Math.min(Date.UTC(y + 8, 11, 31), hoje.getTime()))]);
  const blocos = await Promise.all(partes.map(async ([a, b]) => {
    const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${def.sgs}/dados?formato=json&dataInicial=${fmt(a)}&dataFinal=${fmt(b)}`, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
    if (r.status === 404) return [];
    if (!r.ok) throw new Error('Banco Central: série ' + def.sgs + ' respondeu ' + r.status);
    const j = await r.json();
    return (Array.isArray(j) ? j : []).map((x: any) => [epoch(x.data), parseFloat(String(x.valor).replace(',', '.'))]);
  }));
  const agora = Date.now() / 1000 + 86400;
  let pts = blocos.flat().filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[0] <= agora).sort((a, b) => a[0] - b[0]);
  // remove datas repetidas
  pts = pts.filter((p, i, a) => i === a.length - 1 || a[i + 1][0] !== p[0]);
  // séries em degrau (Selic, CDI): guarda só as mudanças e o último ponto
  if (def.passo) pts = pts.filter((p, i, a) => i === 0 || i === a.length - 1 || p[1] !== a[i - 1][1]);
  return pts.slice(-4000);
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try { if (new URL(req.url).searchParams.has('versao')) return out({ fn: 'series', versao: VERSAO_FN, series: Object.keys(SERIES) }); } catch { /* segue */ }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 40)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  let b: any; try { b = await req.json(); } catch { return out({ error: 'JSON inválido' }, 400); }
  const id = String(b?.serie || '').toLowerCase().slice(0, 20);
  const def = SERIES[id];
  if (!def) return out({ error: 'Série não disponível.', disponiveis: Object.keys(SERIES) }, 400);
  const anoAtual = new Date().getUTCFullYear();
  const desde = Math.max(2000, Math.min(anoAtual, Math.trunc(+b?.desde || anoAtual - 5)));
  const chave = id + '|' + desde, c = cache.get(chave);
  if (c && Date.now() - c.ts < 6 * 3600_000) return out(c.v);
  try {
    const pontos = await serie(def, desde);
    if (!pontos.length) return out({ error: 'O Banco Central não retornou dados para essa série.' }, 404);
    const v = { serie: id, sgs: def.sgs, nome: def.nome, unidade: def.unidade, freq: def.freq, fonte: 'Banco Central do Brasil (SGS)', consultadoEm: new Date().toISOString(), pontos };
    if (cache.size > 60) cache.clear();
    cache.set(chave, { ts: Date.now(), v });
    return out(v);
  } catch (e) { return out({ error: (e as Error).message }, 502); }
});
