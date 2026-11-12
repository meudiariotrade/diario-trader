// Função CANDLES — arquivo único para colar no editor do Supabase (Edge Functions → candles → index.ts)

// ===== mapa =====
// supabase/functions/candles/mapa.ts — regras puras: qual símbolo do Yahoo usar para cada ativo e qual período/intervalo pedir.

export type Mapa = { y: string; proxy: boolean; mult: number; nota: string };
export function mapa(ativo: string, sub = ''): Mapa | null {
  const s = String(ativo || '').toUpperCase().replace(/\s/g, '').replace(/^.*:/, '');
  if (!s) return null;
  const ok = (y: string, nota = '') => ({ y, proxy: false, mult: 1, nota });
  const px = (y: string, nota: string, mult = 1) => ({ y, proxy: true, mult, nota });
  const indices: Record<string,string>={VIX:'^VIX',IBOV:'^BVSP',IBOVESPA:'^BVSP',SPX:'^GSPC',SP500:'^GSPC',NDX:'^NDX',NASDAQ:'^IXIC',DOW:'^DJI',DJI:'^DJI',DXY:'DX-Y.NYB',USDBRL:'BRL=X',PRATA:'SI=F',COBRE:'HG=F',NG:'NG=F'};
  if(indices[s])return ok(indices[s]);
  const commodities: Record<string,string> = { BRENT:'BZ=F', UKOIL:'BZ=F', 'BRN1!':'BZ=F', 'BZ=F':'BZ=F', WTI:'CL=F', USOIL:'CL=F', 'CL1!':'CL=F', 'CL=F':'CL=F', OURO:'GC=F', GOLD:'GC=F', 'GC=F':'GC=F' };
  if (commodities[s]) return px(commodities[s], 'Histórico de futuro de referência (Yahoo). Bolsa, vencimento e rolagem podem diferir da cotação do cabeçalho; OHLC não é substituído por outra fonte.');
  if (/^(WIN|IND)/.test(s)) return px('^BVSP', 'Ibovespa à vista: o mini índice não tem histórico gratuito. Use para ver o horário da entrada e da saída; o preço é parecido, mas não igual ao do contrato.');
  if (/^(WDO|DOL)/.test(s)) return px('BRL=X', 'Dólar à vista × 1000 (aproxima o mini dólar). O preço do futuro tem um prêmio sobre o à vista.', 1000);
  const fut: [RegExp, string][] = [[/^M?ES[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'ES=F'], [/^M?NQ[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'NQ=F'], [/^M?YM[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'YM=F'], [/^(M2K|RTY)[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'RTY=F'], [/^M?CL[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'CL=F'], [/^M?GC[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'GC=F']];
  for (const [r, y] of fut) if (r.test(s)) return ok(y, 'Contrato contínuo (1º vencimento).');
  if (/^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(s)) {
    const base = String(sub || '').toUpperCase().trim() || s.slice(0, 4) + '3';
    return px(base.replace(/F$/, '') + '.SA', `Opção: o gráfico é do ativo-objeto (${base}), não do prêmio da opção.`);
  }
  if (/^[A-Z]{4}\d{1,2}F?$/.test(s)) return ok(s.replace(/F$/, '') + '.SA');
  const idx: Record<string, string> = { US30: 'YM=F', DJ30: 'YM=F', NAS100: 'NQ=F', US100: 'NQ=F', USTEC: 'NQ=F', US500: 'ES=F', SPX500: 'ES=F', GER40: '^GDAXI', DE40: '^GDAXI', XAUUSD: 'GC=F', XAGUSD: 'SI=F', USOIL: 'CL=F', WTI: 'CL=F', UKOIL: 'BZ=F' };
  for (const [k, y] of Object.entries(idx)) if (s.startsWith(k)) return ok(y, k.startsWith('XAU') || k.includes('OIL') || k === 'WTI' ? 'Contrato futuro de referência: o preço do CFD pode diferir um pouco.' : 'Índice futuro de referência: o preço do CFD pode diferir um pouco.');
  if (/^(BTC|ETH|SOL|XRP)/.test(s)) return ok(s.slice(0, 3) + '-USD');
  if (/^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)(USD|JPY|CHF|CAD|EUR|GBP|AUD|NZD)$/.test(s)) return ok(s + '=X');
  if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(s)) return ok(s);
  return null;
}

/** "AAAA-MM-DDTHH:MM" no horário de Brasília -> epoch (s). */
export const epochBR = (x: string) => { const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(x || '')); if (!m) return NaN; return Date.parse(`${m[1]}T${m[2] || '12'}:${m[3] || '00'}:00-03:00`) / 1000; };

/** Período e intervalo: 5 min até 59 dias atrás (mesmo dia), 60 min até ~2 anos, senão diário. */
export function janela(de: string, ate: string, agora: number) {
  const a = epochBR(de), b = isFinite(epochBR(ate)) ? epochBR(ate) : a;
  if (!isFinite(a)) return null;
  const ini = Math.min(a, b), fim = Math.max(a, b), idade = (agora - ini) / 86400, dur = (fim - ini) / 3600;
  if (idade <= 58 && dur <= 10) return { intervalo: '5m', p1: ini - 90 * 60, p2: Math.min(agora, fim + 90 * 60) };
  if (idade <= 700 && dur <= 24 * 20) return { intervalo: '60m', p1: ini - 86400, p2: Math.min(agora, fim + 86400) };
  return { intervalo: '1d', p1: ini - 20 * 86400, p2: Math.min(agora, fim + 20 * 86400) };
}

/** Converte a resposta do Yahoo (chart) em [[t,o,h,l,c]], sem buracos, até `max` candles. */
export function leYahoo(j: any, mult = 1, max = 400): number[][] {
  const r = j?.chart?.result?.[0], ts: number[] = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {};
  const out: number[][] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
    // 6º valor = volume (usado no OBV e na regra de volume dos "trades de olho"); 0 quando o Yahoo não tem
    if ([o, h, l, c].every((v) => typeof v === 'number' && isFinite(v))) out.push([ts[i], +(o * mult).toFixed(5), +(h * mult).toFixed(5), +(l * mult).toFixed(5), +(c * mult).toFixed(5), typeof v === 'number' && isFinite(v) ? v : 0]);
  }
  return out.length > max ? out.slice(out.length - max) : out;
}

/** Gráfico das cotações ao vivo: intervalo pedido no app → intervalo e período do Yahoo. */
export const GRAFICO: Record<string, { intervalo: string; range: string }> = {
  '5m': { intervalo: '5m', range: '5d' }, '15m': { intervalo: '15m', range: '1mo' }, '60m': { intervalo: '60m', range: '3mo' }, '1d': { intervalo: '1d', range: '2y' },
};

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
export const VERSAO_FN = 'v305';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/candles/index.ts
// Candles do momento de um trade para a ficha da operação (Yahoo Finance, gratuito, com atraso).
// Deploy (sem verificação de JWT, igual às outras funções):  supabase functions deploy candles --no-verify-jwt

const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
const cache = new Map<string, { ts: number; v: unknown }>();

/** Tenta a origem secundária do Yahoo quando a primeira falha. */
async function yahooCandles(url: string, init: RequestInit): Promise<Response> {
  let ultima: Response | null = null;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    const target = new URL(url); target.hostname = host;
    try {
      const response = await fetch(target.href, { ...init, signal: AbortSignal.timeout(7000) });
      if (response.ok) return response;
      ultima = response;
    } catch { /* tenta a segunda origem; mantém os mesmos códigos do handler */ }
  }
  if (ultima) return ultima;
  throw new Error('A fonte de candles demorou para responder. Tente novamente.');
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'candles', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 90)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  let b: any; try { b = await req.json(); } catch { return out({ error: 'JSON inválido' }, 400); }
  const m = mapa(String(b.ativo || '').slice(0, 20), String(b.sub || '').slice(0, 12));
  if (!m) return out({ error: 'Não sei qual gráfico usar para esse ativo.' }, 400);
  // gráfico das cotações ao vivo: histórico por intervalo (o candle atual vem do Profit, no app)
  const g = GRAFICO[String(b.intervalo || '')];
  if (g) {
    const chave = `g|${m.y}|${g.intervalo}`, c0 = cache.get(chave);
    if (c0 && Date.now() - c0.ts < 2 * 60_000) return out(c0.v);
    try {
      const r = await yahooCandles(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.y)}?range=${g.range}&interval=${g.intervalo}&includePrePost=false`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
      if (!r.ok) return out({ error: 'Yahoo ' + r.status }, 502);
      const v = { simbolo: m.y, intervalo: g.intervalo, proxy: m.proxy, nota: m.nota, fonte: 'Yahoo Finance', consultadoEm: new Date().toISOString(), candles: leYahoo(await r.json(), m.mult, 600) };
      cache.set(chave, { ts: Date.now(), v });
      return out(v);
    } catch (e) { return out({ error: (e as Error).message }, 500); }
  }
  const j = janela(String(b.de || ''), String(b.ate || ''), Date.now() / 1000);
  if (!j) return out({ error: 'Data do trade inválida.' }, 400);
  const chave = `${m.y}|${j.intervalo}|${Math.floor(j.p1 / 300)}|${Math.floor(j.p2 / 300)}`;
  const c = cache.get(chave);
  if (c && Date.now() - c.ts < 10 * 60_000) return out(c.v);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.y)}?period1=${Math.floor(j.p1)}&period2=${Math.floor(j.p2)}&interval=${j.intervalo}&includePrePost=false`;
    const r = await yahooCandles(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
    if (!r.ok) return out({ error: 'Yahoo ' + r.status }, 502);
    const candles = leYahoo(await r.json(), m.mult);
    if (!candles.length) return out({ error: 'Sem candles para esse período (feriado, fim de semana ou fora do horário).' }, 404);
    const v = { simbolo: m.y, intervalo: j.intervalo, proxy: m.proxy, nota: m.nota, fonte: 'Yahoo Finance', consultadoEm: new Date().toISOString(), candles };
    cache.set(chave, { ts: Date.now(), v });
    return out(v);
  } catch (e) { return out({ error: (e as Error).message }, 500); }
});
