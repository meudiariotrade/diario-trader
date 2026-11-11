// Função TERMINAL — arquivo único para colar no editor do Supabase (Edge Functions → terminal → index.ts)

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
// supabase/functions/economia/fontes.ts
// Leitores das fontes gratuitas e oficiais (sem rede, sem Deno.*): testados em fontes.test.ts.
// O Trading Economics é só a referência de layout: nenhum dado dele é copiado.

export type Ponto = [string, number]; // [período AAAA-MM-DD | AAAA-MM | AAAA-Qn, valor]

const num = (x: unknown) => { const v = typeof x === 'number' ? x : parseFloat(String(x ?? '').replace(',', '.')); return isFinite(v) ? v : null; };
const r = (x: number, d = 2) => +x.toFixed(d);

/** Banco Central (SGS): [{data:'dd/mm/aaaa', valor:'10,50'}] → pontos AAAA-MM-DD. */
export function leSGS(j: unknown): Ponto[] {
  if (!Array.isArray(j)) return [];
  const out: Ponto[] = [];
  for (const x of j as any[]) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(x?.data || '')), v = num(String(x?.valor ?? '').replace(',', '.'));
    if (m && v != null) out.push([`${m[3]}-${m[2]}-${m[1]}`, v]);
  }
  return out;
}

/** FRED (fredgraph.csv): "observation_date,SERIE\n2026-01-01,3.2" → pontos ("." = sem dado). */
export function leFRED(csv: string): Ponto[] {
  const out: Ponto[] = [];
  for (const l of String(csv || '').split(/\r?\n/).slice(1)) {
    const [d, v] = l.split(','), n = num(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d || '') && n != null) out.push([d, n]);
  }
  return out;
}

/** CSV do SDMX (BIS): acha as colunas REF_AREA, TIME_PERIOD e OBS_VALUE pelo cabeçalho. */
export function leSdmxCsv(csv: string): Record<string, Ponto[]> {
  const L = String(csv || '').split(/\r?\n/).filter(Boolean);
  if (!L.length) return {};
  const sp = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
  const h = sp(L[0]).map((x) => x.split(':')[0].trim().toUpperCase()), ia = h.indexOf('REF_AREA'), it = h.indexOf('TIME_PERIOD'), iv = h.indexOf('OBS_VALUE');
  if (ia < 0 || it < 0 || iv < 0) return {};
  const out: Record<string, Ponto[]> = {};
  for (const l of L.slice(1)) {
    const c = sp(l), v = num(c[iv]);
    if (v == null || !c[it]) continue;
    (out[c[ia].split(':')[0].trim()] ??= []).push([c[it].trim(), v]);
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return out;
}

/** SDMX-JSON da OCDE (dimensionAtObservation=AllDimensions) → { REF_AREA: pontos }. Aceita "structure" (v1) e "structures" (v2). */
export function leOecd(j: any): Record<string, Ponto[]> {
  const data = j?.data ?? j, st = data?.structures?.[0] ?? data?.structure, dims = st?.dimensions?.observation || [];
  const obs = data?.dataSets?.[0]?.observations || {}, ia = dims.findIndex((d: any) => d.id === 'REF_AREA'), it = dims.findIndex((d: any) => d.id === 'TIME_PERIOD');
  if (ia < 0 || it < 0) return {};
  const out: Record<string, Ponto[]> = {};
  for (const [k, v] of Object.entries(obs)) {
    const idx = k.split(':').map(Number), val = num((v as any[])?.[0]);
    if (val == null) continue;
    const area = dims[ia].values[idx[ia]]?.id, per = dims[it].values[idx[it]]?.id;
    if (area && per) (out[area] ??= []).push([per, val]);
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return out;
}

/** JSON-stat do Eurostat com uma série só (um país, uma unidade): tempo → valor. */
export function leEurostat(j: any): Ponto[] {
  const t = j?.dimension?.time?.category?.index, v = j?.value;
  if (!t || !v) return [];
  return Object.entries(t as Record<string, number>).map(([per, i]) => [per, num(v[i])] as [string, number | null])
    .filter((x): x is Ponto => x[1] != null).sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** Variação em 12 meses (ou n períodos) de um índice: (v / v[n atrás] − 1) × 100. */
export function anual(p: Ponto[], n = 12): Ponto[] {
  const out: Ponto[] = [];
  for (let i = n; i < p.length; i++) if (p[i - n][1]) out.push([p[i][0], r((p[i][1] / p[i - n][1] - 1) * 100)]);
  return out;
}
/** Diferença entre períodos (ex.: vagas criadas no mês a partir do total de empregos). */
export const diferenca = (p: Ponto[]): Ponto[] => p.slice(1).map((x, i) => [x[0], r(x[1] - p[i][1], 1)] as Ponto);
/** Acumulado de 12 meses de uma taxa mensal em % (juros compostos). */
export function acum12(p: Ponto[]): Ponto[] {
  const out: Ponto[] = [];
  for (let i = 11; i < p.length; i++) out.push([p[i][0], r((p.slice(i - 11, i + 1).reduce((a, x) => a * (1 + x[1] / 100), 1) - 1) * 100)]);
  return out;
}
/** Série diária → último valor de cada mês (para gráficos de juros e câmbio). */
export function mensal(p: Ponto[]): Ponto[] {
  const m = new Map<string, number>();
  for (const [d, v] of p) m.set(d.slice(0, 7), v);
  return [...m.entries()].map(([k, v]) => [k, v] as Ponto);
}

export type Resumo = { atual: number | null; anterior: number | null; periodo: string | null; serie: Ponto[] };
export const resumo = (p: Ponto[], n = 36): Resumo => {
  const s = p.slice(-n);
  return { atual: s.length ? s[s.length - 1][1] : null, anterior: s.length > 1 ? s[s.length - 2][1] : null, periodo: s.length ? s[s.length - 1][0] : null, serie: s };
};

// ---------- mercados (Yahoo, gráfico diário de 1 ano) ----------
/** Último, variação no dia, na semana (5 pregões), no mês (21), no ano (desde o último fechamento do ano anterior) e mini-série de 30 dias. */
export function variacoes(ts: number[], close: (number | null)[], agoraIso: string, bp = false) {
  const P: [string, number][] = [];
  ts.forEach((t, i) => { const c = close[i]; if (typeof c === 'number' && isFinite(c)) P.push([new Date(t * 1000).toISOString().slice(0, 10), c]); });
  if (P.length < 2) return null;
  // bp = juros (títulos): variação em pontos-base (0,01 p.p.) em vez de %
  const u = P[P.length - 1][1], pct = (a: number | undefined) => (a == null || (!bp && !a) ? null : bp ? r((u - a) * 100, 1) : r((u / a - 1) * 100)), ano = agoraIso.slice(0, 4);
  const fimAno = [...P].reverse().find((x) => x[0].slice(0, 4) < ano);
  return {
    ult: u, data: P[P.length - 1][0], dia: pct(P[P.length - 2][1]), sem: pct(P[P.length - 6]?.[1]), mes: pct(P[P.length - 22]?.[1]), ano: pct(fimAno?.[1]),
    spark: P.slice(-30).map((x) => r(x[1], 4)),
  };
}

// ---------- agenda ----------
export type Evento = { id: string; t: string; pais: string; d: string; imp: 1 | 2 | 3; atual: string; prev: string; ant: string; a: number | null; p: number | null; un: string; fonte: string };
const PAIS_TV: Record<string, string> = { US: 'EUA', BR: 'Brasil', EU: 'Zona do Euro', GB: 'Reino Unido', JP: 'Japão', CN: 'China', DE: 'Alemanha' };
const PAIS_FF: Record<string, string> = { USD: 'EUA', EUR: 'Zona do Euro', GBP: 'Reino Unido', JPY: 'Japão', CNY: 'China' };
/** Calendário do TradingView: importance −1/0/1 → 1/2/3; números em actual/forecast/previous. */
export function normTV(j: any): Evento[] {
  const L = Array.isArray(j?.result) ? j.result : [];
  const fmt = (v: unknown, un: string, sc: string) => (num(v) == null ? '' : `${r(num(v)!, 2)}${sc || ''}${un || ''}`.replace('.', ','));
  return L.filter((e: any) => PAIS_TV[e.country]).map((e: any) => ({
    id: 'tv' + e.id, t: String(e.title || ''), pais: PAIS_TV[e.country], d: String(e.date), imp: (e.importance >= 1 ? 3 : e.importance === 0 ? 2 : 1) as 1 | 2 | 3,
    atual: fmt(e.actual, e.unit, e.scale), prev: fmt(e.forecast, e.unit, e.scale), ant: fmt(e.previous, e.unit, e.scale), a: num(e.actual), p: num(e.forecast), un: String(e.unit || ''), fonte: 'TradingView',
  }));
}
/** Forex Factory (reserva): sem o resultado divulgado; Brasil não vem. */
export function normFF(j: any): Evento[] {
  const L = Array.isArray(j) ? j : [];
  return L.filter((e: any) => PAIS_FF[e.country] && e.impact !== 'Holiday').map((e: any, i: number) => ({
    id: 'ff' + i + String(e.date), t: String(e.title || ''), pais: PAIS_FF[e.country], d: new Date(e.date).toISOString(), imp: (e.impact === 'High' ? 3 : e.impact === 'Medium' ? 2 : 1) as 1 | 2 | 3,
    atual: '', prev: String(e.forecast || ''), ant: String(e.previous || ''), a: null, p: num(String(e.forecast || '').replace(/[%KMBT]/g, '')), un: '', fonte: 'Forex Factory',
  }));
}
/**
 * Surpresa e efeito provável (regra simples e explícita, não é previsão):
 * inflação/juros acima do esperado → juros mais altos → moeda forte, bolsa pressionada;
 * atividade/emprego acima → economia forte → moeda forte; desemprego/pedidos acima → economia fraca.
 */
export function surpresa(e: Pick<Evento, 't' | 'a' | 'p' | 'pais'>): { dir: 'acima' | 'abaixo' | 'em linha'; tom: 'forte' | 'fraca' | 'neutro'; efeito: string } | null {
  if (e.a == null || e.p == null) return null;
  const dif = e.a - e.p, tol = Math.max(Math.abs(e.p) * 0.01, 0.0001);
  const dir = Math.abs(dif) <= tol ? 'em linha' : dif > 0 ? 'acima' : 'abaixo';
  if (dir === 'em linha') return { dir, tom: 'neutro', efeito: 'Em linha com o esperado: pouco efeito.' };
  const t = e.t.toLowerCase(), moeda = ({ EUA: 'o dólar', Brasil: 'o real', 'Zona do Euro': 'o euro', 'Reino Unido': 'a libra', Japão: 'o iene', China: 'o yuan' } as Record<string, string>)[e.pais] || 'a moeda';
  const inv = /unemploy|desemprego|jobless|claims|seguro-desemprego/.test(t), infl = /cpi|ipca|inflation|infla|pce|ppi|igp|price/.test(t), juros = /rate decision|interest rate|selic|taxa de juros|fed funds/.test(t);
  let forte = dir === 'acima';
  if (inv) forte = !forte;
  const tom = forte ? 'forte' : 'fraca';
  const efeito = infl || juros
    ? (forte ? `Acima do esperado: pressão por juros altos → tende a fortalecer ${moeda} e pesar na bolsa.` : `Abaixo do esperado: alívio nos juros → tende a enfraquecer ${moeda} e ajudar a bolsa.`)
    : (forte ? `Economia mais forte que o esperado → tende a fortalecer ${moeda}.` : `Economia mais fraca que o esperado → tende a enfraquecer ${moeda}.`);
  return { dir, tom, efeito };
}

// ---------- notícias (RSS: só manchete, fonte e link) ----------
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const cdata = (s: string) => s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
const tagX = (x: string, n: string) => { const m = x.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, 'i')); return m ? dec(cdata(m[1])).replace(/<[^>]+>/g, '').trim() : ''; };
export type Noticia = { t: string; l: string; f: string; d: string; tags: string[] };
export function leRSS(xml: string, fonte: string): Noticia[] {
  const out: Noticia[] = [];
  for (const blk of String(xml || '').split(/<item[\s>]/i).slice(1)) {
    const x = blk.split(/<\/item>/i)[0], t = tagX(x, 'title'), l = tagX(x, 'link') || (/<link[^>]*href="([^"]+)"/i.exec(x)?.[1] ?? ''), d = new Date(tagX(x, 'pubDate') || tagX(x, 'dc:date'));
    if (!t || !/^https?:\/\//.test(l) || isNaN(+d)) continue;
    out.push({ t, l, f: fonte, d: d.toISOString(), tags: temas(t) });
  }
  return out;
}
const TEMAS: [string, RegExp][] = [
  ['Juros', /juro|selic|copom|fed\b|fomc|taxa básica|rate|yield|treasur|tesouro|bce|ecb|boj|banco central/i],
  ['Câmbio', /dólar|câmbio|real\b|euro\b|iene|yen|libra|forex|currency|moeda/i],
  ['Inflação', /infla|ipca|igp|cpi|pce|preços/i],
  ['Commodities', /petróleo|brent|wti|minério|ouro|gold|oil|soja|milho|café|commodit|vale\b|petrobras/i],
  ['EUA', /eua|estados unidos|wall street|nasdaq|s&p|dow|trump|fed\b|u\.s\.|us /i],
  ['China/Ásia', /china|chin|pequim|beijing|japão|japan|ásia|asia|nikkei|hang seng/i],
  ['Europa', /europa|europe|zona do euro|eurozone|alemanha|germany|reino unido|uk\b|bce|ecb|dax/i],
  ['Cripto', /bitcoin|cripto|crypto|ethereum|btc/i],
  ['Empresas', /lucro|balanço|resultado|ações da|ipo|dividend|receita|earnings|ceo/i],
];
export const temas = (t: string) => TEMAS.filter(([, re]) => re.test(t)).map(([k]) => k).slice(0, 3);

// ===== curva =====
// supabase/functions/juros/curva.ts
// Regras puras (sem rede): vértices do DI1, dias úteis, PU, taxa a termo, leitura do scanner do TradingView,
// Selic (desde quando), calendário do Copom. Testado em curva.test.ts.

export const COD_MES = 'FGHJKMNQUVXZ';
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const dia = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d, 12));

// ---------- feriados nacionais (base dos dias úteis da B3) ----------
function pascoa(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return dia(y, mo - 1, da);
}
const FER: Record<number, Set<string>> = {};
export function feriados(y: number): Set<string> {
  if (FER[y]) return FER[y];
  const s = new Set<string>();
  [[0, 1], [3, 21], [4, 1], [8, 7], [9, 12], [10, 2], [10, 15], [10, 20], [11, 25]].forEach(([m, d]) => s.add(iso(dia(y, m, d))));
  const P = pascoa(y);
  [-48, -47, -2, 60].forEach((n) => { const d = new Date(P); d.setUTCDate(d.getUTCDate() + n); s.add(iso(d)); });
  return (FER[y] = s);
}
export const diaUtil = (d: Date) => { const w = d.getUTCDay(); return w !== 0 && w !== 6 && !feriados(d.getUTCFullYear()).has(iso(d)); };
/** Vencimento do DI1: 1º dia útil do mês. */
export function vencimento(y: number, m: number): Date { const d = dia(y, m, 1); while (!diaUtil(d)) d.setUTCDate(d.getUTCDate() + 1); return d; }
/** Dias úteis de hoje (inclusive) até o vencimento (exclusive), convenção usada no PU do DI1. */
export function diasUteis(hoje: Date, venc: Date): number {
  const d = dia(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()), v = dia(venc.getUTCFullYear(), venc.getUTCMonth(), venc.getUTCDate());
  let n = 0;
  while (d < v) { if (diaUtil(d)) n++; d.setUTCDate(d.getUTCDate() + 1); }
  return n;
}
export const pu = (taxa: number, du: number) => 1e5 / Math.pow(1 + taxa / 100, du / 252);
export const termo = (t1: number, d1: number, t2: number, d2: number) =>
  (Math.pow(Math.pow(1 + t2 / 100, d2 / 252) / Math.pow(1 + t1 / 100, d1 / 252), 252 / (d2 - d1)) - 1) * 100;

// ---------- vértices consultados ----------
export type Vertice = { tk: string; cod: string; rotulo: string; venc: string; ano: number; mes: number };
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** Janeiro dos próximos 10 anos + abril, julho e outubro do ano que vem (sensíveis aos próximos Copom). */
export function vertices(hoje: Date): Vertice[] {
  const y = hoje.getUTCFullYear(), out: Vertice[] = [];
  const add = (ano: number, mes: number) => out.push({
    tk: `BMFBOVESPA:DI1${COD_MES[mes]}${ano}`, cod: `DI1${COD_MES[mes]}${String(ano).slice(2)}`, rotulo: `${MES[mes]}/${String(ano).slice(2)}`,
    venc: iso(vencimento(ano, mes)), ano, mes,
  });
  for (let k = 1; k <= 10; k++) {
    add(y + k, 0);
    if (k === 1) [3, 6, 9].forEach((m) => add(y + 1, m));
  }
  return out.sort((a, b) => a.venc.localeCompare(b.venc));
}

// ---------- scanner do TradingView ----------
export type Cot = { s: string; close: number; chp: number | null; cha: number | null; desc: string; atraso: boolean };
export const COLUNAS = ['close', 'change', 'change_abs', 'description', 'update_mode'];
const n = (x: unknown) => (typeof x === 'number' && isFinite(x) ? x : null);
/** Lê {data:[{s, d:[close, change%, change_abs, description, update_mode]}]}. */
export function leScanner(j: any): Map<string, Cot> {
  const m = new Map<string, Cot>();
  for (const it of Array.isArray(j?.data) ? j.data : []) {
    const d = Array.isArray(it?.d) ? it.d : [];
    const close = n(d[0]);
    if (!it?.s || close == null) continue;
    m.set(String(it.s).toUpperCase(), { s: String(it.s), close, chp: n(d[1]), cha: n(d[2]), desc: typeof d[3] === 'string' ? d[3] : '', atraso: String(d[4] || '').startsWith('delayed') });
  }
  return m;
}
/** Primeira cotação disponível numa lista de alternativas (ex.: FEF da SGX, senão minério da COMEX). */
export function primeira(m: Map<string, Cot>, alts: string[]): (Cot & { alt: number }) | null {
  for (let i = 0; i < alts.length; i++) { const c = m.get(alts[i].toUpperCase()); if (c) return { ...c, alt: i }; }
  return null;
}
/** Contratos de minério: 1º e 2º vencimento (SGX FEF; alternativa COMEX TIO, mesmo minério 62% Fe). */
export function minerio(hoje: Date): { fef1: string[]; fef2: string[] } {
  const y = hoje.getUTCFullYear(), m = hoje.getUTCMonth();
  const c = (k: number, pre: string) => { const mm = (m + k) % 12, yy = y + Math.floor((m + k) / 12); return `${pre}${COD_MES[mm]}${yy}`; };
  return {
    fef1: ['SGX:FEF1!', c(0, 'SGX:FEF'), 'COMEX:TIO1!', c(0, 'COMEX:TIO')],
    fef2: ['SGX:FEF2!', c(1, 'SGX:FEF'), 'COMEX:TIO2!', c(1, 'COMEX:TIO')],
  };
}

// ---------- curva ----------
export type Ponto = { cod: string; rotulo: string; venc: string; du: number; taxa: number; var_pb: number | null; ant: number | null; pu: number; termo: number | null; atraso: boolean };
export function montaCurva(m: Map<string, Cot>, vs: Vertice[], hoje: Date): Ponto[] {
  const out: Ponto[] = [];
  for (const v of vs) {
    const c = m.get(v.tk.toUpperCase());
    if (!c || !(c.close > 0 && c.close < 100)) continue;
    const du = diasUteis(hoje, new Date(v.venc + 'T12:00:00Z'));
    if (du <= 0) continue;
    const prev = out[out.length - 1];
    out.push({
      cod: v.cod, rotulo: v.rotulo, venc: v.venc, du, taxa: c.close,
      var_pb: c.cha == null ? null : Math.round(c.cha * 1000) / 10, ant: c.cha == null ? null : +(c.close - c.cha).toFixed(3),
      pu: +pu(c.close, du).toFixed(2), termo: prev && du > prev.du ? +termo(prev.taxa, prev.du, c.close, du).toFixed(3) : null, atraso: c.atraso,
    });
  }
  return out;
}
/** Taxa interpolada (flat forward, padrão da B3) num prazo em dias úteis. */
export function interpola(c: Ponto[], du: number): number | null {
  if (!c.length) return null;
  if (du <= c[0].du) return c[0].taxa;
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1], b = c[i];
    if (du <= b.du) {
      const fa = Math.pow(1 + a.taxa / 100, a.du / 252), fb = Math.pow(1 + b.taxa / 100, b.du / 252);
      const f = fa * Math.pow(fb / fa, (du - a.du) / (b.du - a.du));
      return (Math.pow(f, 252 / du) - 1) * 100;
    }
  }
  return c[c.length - 1].taxa;
}
/** Resumo da curva: inclinação (longo − curto), formato e quanto o mercado espera até o 1º vértice. */
export function leitura(c: Ponto[], cdi: number | null) {
  if (c.length < 2) return null;
  const curto = c[0], longo = c.reduce((a, b) => (b.du > a.du ? b : a)), meio = c.find((p) => p.du >= 500) || c[Math.floor(c.length / 2)];
  const incl = Math.round((longo.taxa - curto.taxa) * 100);
  const forma = incl > 50 ? 'positiva (longos acima dos curtos)' : incl < -50 ? 'invertida (mercado espera cortes de juros)' : 'quase plana';
  const vars = c.map((p) => p.var_pb).filter((x): x is number => x != null);
  const media = vars.length ? Math.round(vars.reduce((a, b) => a + b, 0) / vars.length * 10) / 10 : null;
  const dia = media == null ? null : media > 3 ? 'abrindo (taxas subindo)' : media < -3 ? 'fechando (taxas caindo)' : 'estável';
  return {
    curto: curto.cod, longo: longo.cod, meio: meio.cod, inclinacao_pb: incl, forma, var_media_pb: media, dia,
    curto_vs_cdi_pb: cdi == null ? null : Math.round((curto.taxa - cdi) * 100),
    taxa_1a: (() => { const t = interpola(c, 252); return t == null ? null : +t.toFixed(3); })(),
  };
}

// ---------- Selic ----------
export type Pt = { d: string; v: number };
/** dd/mm/aaaa -> aaaa-mm-dd */
export const dataBR = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : s; };
/** Última meta, desde quando está nela e a mudança anterior (pb). A série vem em ordem de data. */
export function selicInfo(s: Pt[]) {
  if (!s.length) return null;
  const ult = s[s.length - 1];
  let i = s.length - 1;
  while (i > 0 && s[i - 1].v === ult.v) i--;
  const ant = i > 0 ? s[i - 1].v : null;
  return { v: ult.v, d: ult.d, desde: s[i].d, ant, mud_pb: ant == null ? null : Math.round((ult.v - ant) * 100), completo: i > 0 };
}
export const juroReal = (nominal: number, inflacao: number) => ((1 + nominal / 100) / (1 + inflacao / 100) - 1) * 100;

// ---------- Copom (datas oficiais divulgadas pelo BC; atualizar quando sair o calendário do ano seguinte) ----------
export const COPOM: [string, string][] = [
  ['2026-01-27', '2026-01-28'], ['2026-03-17', '2026-03-18'], ['2026-04-28', '2026-04-29'], ['2026-06-16', '2026-06-17'],
  ['2026-08-04', '2026-08-05'], ['2026-09-15', '2026-09-16'], ['2026-11-03', '2026-11-04'], ['2026-12-08', '2026-12-09'],
];
export function copom(hojeIso: string) {
  const prox = COPOM.find((r) => r[1] >= hojeIso) || null;
  const ult = [...COPOM].reverse().find((r) => r[1] < hojeIso) || null;
  const dd = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
  return {
    proxima: prox ? { inicio: prox[0], decisao: prox[1], dias: dd(hojeIso, prox[1]) } : null,
    ultima: ult ? { decisao: ult[1] } : null,
    restantes_ano: COPOM.filter((r) => r[1] >= hojeIso && r[1].slice(0, 4) === hojeIso.slice(0, 4)).length,
  };
}
/** Janela de datas para o SGS (o BC limita "últimos" a 20 e janelas a 10 anos). */
export function janela(hoje: Date, anos: number) {
  const f = (d: Date) => `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  const ini = new Date(hoje); ini.setUTCFullYear(ini.getUTCFullYear() - anos);
  return { ini: f(ini), fim: f(hoje) };
}

// ---------- Focus (expectativas do mercado, API Olinda do BC) ----------
type FocusLinha = { Indicador?: string; Data?: string; DataReferencia?: string | number; Mediana?: number; Reuniao?: string };
/** Mediana mais recente de Selic e IPCA para o ano corrente e o seguinte. */
export function focusAnual(rows: FocusLinha[], ano: number) {
  const ok = (rows || []).filter((r) => r && r.Data && typeof r.Mediana === 'number');
  if (!ok.length) return null;
  const data = ok.map((r) => r.Data!).sort().at(-1)!;
  const pega = (ind: string, y: number) => {
    const r = ok.filter((x) => x.Indicador === ind && String(x.DataReferencia) === String(y)).sort((a, b) => b.Data!.localeCompare(a.Data!))[0];
    return r ? r.Mediana! : null;
  };
  // mesma mediana uma semana antes (para mostrar se o mercado subiu ou baixou a projeção)
  const semana = new Date(Date.parse(data + 'T12:00:00Z') - 7 * 864e5).toISOString().slice(0, 10);
  const antes = (ind: string, y: number) => {
    const r = ok.filter((x) => x.Indicador === ind && String(x.DataReferencia) === String(y) && x.Data! <= semana).sort((a, b) => b.Data!.localeCompare(a.Data!))[0];
    return r ? r.Mediana! : null;
  };
  const par = (ind: string) => ({ [ano]: pega(ind, ano), [ano + 1]: pega(ind, ano + 1) }), parAnt = (ind: string) => ({ [ano]: antes(ind, ano), [ano + 1]: antes(ind, ano + 1) });
  return {
    data, semana,
    selic: par('Selic'), ipca: par('IPCA'), pib: par('PIB Total'), cambio: par('Câmbio'),
    ant: { selic: parAnt('Selic'), ipca: parAnt('IPCA'), pib: parAnt('PIB Total'), cambio: parAnt('Câmbio') },
  };
}
/** Mediana do Focus para a próxima reunião do Copom ("R7/2026" = 7ª reunião de 2026). */
export function focusReuniao(rows: FocusLinha[], hojeIso: string) {
  const i = COPOM.findIndex((r) => r[1] >= hojeIso);
  if (i < 0) return null;
  const nome = `R${i + 1}/${COPOM[i][1].slice(0, 4)}`;
  const r = (rows || []).filter((x) => x && x.Reuniao === nome && typeof x.Mediana === 'number').sort((a, b) => String(b.Data).localeCompare(String(a.Data)))[0];
  return r ? { reuniao: nome, mediana: r.Mediana!, data: r.Data! } : null;
}

// ===== servidor =====
// Análise de balanços no roteiro clássico (Iudícibus, "Análise de Balanços"): análise horizontal e vertical,
// liquidez, endividamento, rotatividade (prazos médios e ciclos), rentabilidade desdobrada (margem × giro),
// alavancagem financeira, termômetro de insolvência de Kanitz e sinais de superexpansão.
// Os números saem dos balanços anuais do Yahoo (fundamentals-timeseries). Onde falta conta, o índice fica null.

export const IUD_TIPOS = ['annualTotalRevenue', 'annualNetIncome', 'annualCostOfRevenue', 'annualGrossProfit', 'annualOperatingIncome', 'annualEBIT', 'annualInterestExpense',
  'annualTotalAssets', 'annualCurrentAssets', 'annualCurrentLiabilities', 'annualTotalLiabilitiesNetMinorityInterest', 'annualTotalNonCurrentLiabilitiesNetMinorityInterest',
  'annualStockholdersEquity', 'annualInventory', 'annualAccountsReceivable', 'annualAccountsPayable', 'annualCashAndCashEquivalents', 'annualNetPPE'];

type Serie = { ano: number; valor: number | null }[];
const iudR = (x: number | null, d = 2) => (x == null || !isFinite(x) ? null : +x.toFixed(d));
const iudDiv = (a: number | null | undefined, b: number | null | undefined) => (a == null || b == null || !isFinite(a) || !isFinite(b) || b === 0 ? null : a / b);
const iudMed = (a: number | null | undefined, b: number | null | undefined) => (a == null ? b ?? null : b == null ? a : (a + b) / 2);

/** Indicadores por ano (até 4 anos) e a leitura do último ano. banco = instituição financeira (liquidez e giro não se aplicam). */
export function iudIndicadores(S: Record<string, Serie>, banco = false) {
  const anos = [...new Set(Object.values(S).flat().map((x) => x.ano))].filter((a) => isFinite(a)).sort().slice(-4);
  if (anos.length === 0) return null;
  const v = (k: string, ano: number) => { const x = (S[k] || []).find((y) => y.ano === ano); return x && typeof x.valor === 'number' ? x.valor : null; };
  const linhas = anos.map((ano, i) => {
    const ant = i > 0 ? anos[i - 1] : null, g = (k: string) => v(k, ano), gm = (k: string) => iudMed(g(k), ant ? v(k, ant) : null);
    const rec = g('annualTotalRevenue'), ll = g('annualNetIncome'), cmv = g('annualCostOfRevenue') != null ? Math.abs(g('annualCostOfRevenue') as number) : null;
    const ac = g('annualCurrentAssets'), pc = g('annualCurrentLiabilities'), at = g('annualTotalAssets'), pt = g('annualTotalLiabilitiesNetMinorityInterest'), pnc = g('annualTotalNonCurrentLiabilitiesNetMinorityInterest');
    const pl = g('annualStockholdersEquity'), est = g('annualInventory'), cr = g('annualAccountsReceivable'), forn = g('annualAccountsPayable'), cx = g('annualCashAndCashEquivalents');
    const ebit = g('annualEBIT') ?? g('annualOperatingIncome'), juros = g('annualInterestExpense') != null ? Math.abs(g('annualInterestExpense') as number) : null;
    const anc = at != null && ac != null ? at - ac : null;
    // rotatividade (médias do ano e do ano anterior, como no livro)
    const estM = gm('annualInventory'), crM = gm('annualAccountsReceivable'), fornM = gm('annualAccountsPayable'), atM = gm('annualTotalAssets'), plM = gm('annualStockholdersEquity');
    const compras = cmv != null && est != null ? cmv + est - (ant ? v('annualInventory', ant) ?? est : est) : cmv;
    const giroEst = iudDiv(cmv, estM), pme = giroEst ? 365 / giroEst : null, pmr = iudDiv(crM != null ? crM * 365 : null, rec), pmp = iudDiv(fornM != null ? fornM * 365 : null, compras);
    const co = pme != null && pmr != null ? pme + pmr : pmr, cf = co != null && pmp != null ? co - pmp : null;
    const margem = iudDiv(ll, rec), giroAt = iudDiv(rec, atM), roa = margem != null && giroAt != null ? margem * giroAt : iudDiv(ll, atM), roe = iudDiv(ll, plM);
    const roaOp = iudDiv(ebit != null ? ebit * 0.66 : null, atM); // retorno operacional depois do IR (34%), antes dos juros
    const lc = iudDiv(ac, pc), ls = iudDiv(ac != null && est != null ? ac - est : ac, pc), li = iudDiv(cx, pc), lg = iudDiv(ac, pt); // geral aproximada: sem o realizável a longo prazo
    const ct = iudDiv(pt, pl), comp = iudDiv(pc, pt), imob = iudDiv(anc, pl), imobRnc = iudDiv(anc, pl != null && pnc != null ? pl + pnc : null);
    // termômetro de insolvência de Kanitz: > 0 solvente; entre 0 e −3 penumbra; < −3 insolvente
    const kz = [iudDiv(ll, pl), lg, ls, lc, ct].every((x) => x != null) ? 0.05 * (iudDiv(ll, pl) as number) + 1.65 * (lg as number) + 3.55 * (ls as number) - 1.06 * (lc as number) - 0.33 * (ct as number) : null;
    return {
      ano, receita: rec, lucro_liquido: ll,
      vertical: { cmv_sobre_receita_pct: iudR(iudDiv(cmv, rec) != null ? (iudDiv(cmv, rec) as number) * 100 : null, 1), margem_bruta_pct: iudR(iudDiv(g('annualGrossProfit'), rec) != null ? (iudDiv(g('annualGrossProfit'), rec) as number) * 100 : null, 1), margem_operacional_pct: iudR(iudDiv(ebit, rec) != null ? (iudDiv(ebit, rec) as number) * 100 : null, 1), ativo_circulante_sobre_ativo_pct: iudR(iudDiv(ac, at) != null ? (iudDiv(ac, at) as number) * 100 : null, 1), patrimonio_sobre_ativo_pct: iudR(iudDiv(pl, at) != null ? (iudDiv(pl, at) as number) * 100 : null, 1) },
      liquidez: banco ? null : { corrente: iudR(lc), seca: iudR(ls), imediata: iudR(li), geral_aproximada: iudR(lg), capital_circulante_liquido: ac != null && pc != null ? ac - pc : null },
      endividamento: { capitais_terceiros_sobre_pl: iudR(ct), composicao_curto_prazo_pct: iudR(comp != null ? comp * 100 : null, 1), imobilizacao_do_pl: banco ? null : iudR(imob), imobilizacao_recursos_nao_correntes: banco ? null : iudR(imobRnc), cobertura_de_juros: iudR(iudDiv(ebit, juros), 1) },
      rotatividade: banco ? null : { giro_estoque: iudR(giroEst, 1), prazo_medio_estocagem_dias: iudR(pme, 0), prazo_medio_recebimento_dias: iudR(pmr, 0), prazo_medio_pagamento_dias: iudR(pmp, 0), posicionamento_relativo_pmr_pmp: iudR(iudDiv(pmr, pmp)), ciclo_operacional_dias: iudR(co, 0), ciclo_financeiro_dias: iudR(cf, 0) },
      rentabilidade: { margem_liquida_pct: iudR(margem != null ? margem * 100 : null, 1), giro_do_ativo: iudR(giroAt), retorno_sobre_ativo_pct: iudR(roa != null ? roa * 100 : null, 1), retorno_sobre_pl_pct: iudR(roe != null ? roe * 100 : null, 1), retorno_operacional_ativo_pct: iudR(roaOp != null ? roaOp * 100 : null, 1), grau_alavancagem_financeira: iudR(iudDiv(roe, roaOp)) },
      kanitz: banco ? null : iudR(kz),
    };
  });
  const u = linhas[linhas.length - 1], p = linhas.length > 1 ? linhas[0] : null;
  // análise horizontal: base 100 no primeiro ano da série
  const base = (k: 'receita' | 'lucro_liquido') => (p && p[k] && u[k] != null ? iudR(((u[k] as number) / (p[k] as number)) * 100, 0) : null);
  const alertas: string[] = [];
  if (!banco && u.kanitz != null) alertas.push(u.kanitz > 0 ? `Termômetro de Kanitz ${String(u.kanitz).replace('.', ',')}: faixa de solvência.` : u.kanitz >= -3 ? `Termômetro de Kanitz ${String(u.kanitz).replace('.', ',')}: penumbra (atenção).` : `Termômetro de Kanitz ${String(u.kanitz).replace('.', ',')}: faixa de insolvência.`);
  const ro = u.rentabilidade, lq = u.liquidez;
  if (!banco && ro.retorno_sobre_pl_pct != null && ro.retorno_sobre_pl_pct > 12 && lq?.corrente != null && lq.corrente < 1) alertas.push('Rentabilidade boa com liquidez corrente abaixo de 1: descompasso que, se virar tendência, gera juros cada vez maiores.');
  if (ro.grau_alavancagem_financeira != null) alertas.push(ro.grau_alavancagem_financeira > 1 ? 'Alavancagem financeira favorável: a dívida está rendendo mais do que custa ao acionista.' : 'Alavancagem financeira desfavorável: a dívida custa mais do que rende ao acionista.');
  if (!banco && p && p.receita && u.receita && p.liquidez?.capital_circulante_liquido != null && lq?.capital_circulante_liquido != null && u.receita > p.receita * 1.3 && lq.capital_circulante_liquido < p.liquidez.capital_circulante_liquido) alertas.push('Possível superexpansão: vendas crescendo forte com capital circulante líquido caindo.');
  if (!banco && u.rotatividade?.ciclo_financeiro_dias != null && u.rotatividade.ciclo_financeiro_dias > 120) alertas.push(`Ciclo financeiro longo (${u.rotatividade.ciclo_financeiro_dias} dias): a empresa financia muito capital de giro.`);
  if (u.endividamento.cobertura_de_juros != null && u.endividamento.cobertura_de_juros < 1.5) alertas.push('Cobertura de juros baixa: o lucro operacional mal paga a despesa financeira.');
  return { metodo: 'Iudícibus: análise horizontal e vertical, liquidez, endividamento, rotatividade, rentabilidade (margem × giro), alavancagem e termômetro de Kanitz', banco, anos: linhas, horizontal_base100: { receita: base('receita'), lucro_liquido: base('lucro_liquido'), de: p?.ano ?? null, ate: u.ano }, alertas,
    observacoes: ['Liquidez geral aproximada (o balanço resumido não separa o realizável a longo prazo).', 'Prazos médios calculados com a receita total (não há separação de vendas a prazo) e compras estimadas por CMV + variação do estoque.'] };
}

// ===== servidor =====
// supabase/functions/terminal/term.ts
// Regras puras do Terminal (sem rede): listas de mercados, leitura do screener do TradingView,
// probabilidade implícita do Copom (curva de DI1) e do Fed (futuros de fed funds), Tesouro Direto,
// balanços da SEC (EDGAR) e resumo do Yahoo (quoteSummary). Testadas em term.test.mts.

// ---------- listas dos monitores (símbolos do TradingView) ----------
export type It = { s: string; n: string; r?: string; dp?: number };
export const MUNDO: Record<string, { nome: string; grupos: { nome: string; itens: It[] }[] }> = {
  wei: { nome: 'Bolsas do mundo', grupos: [
    { nome: 'Américas', itens: [{ s: 'BMFBOVESPA:IBOV', n: 'Ibovespa', dp: 0 }, { s: 'SP:SPX', n: 'S&P 500' }, { s: 'NASDAQ:NDX', n: 'Nasdaq 100' }, { s: 'DJ:DJI', n: 'Dow Jones', dp: 0 }, { s: 'TVC:RUT', n: 'Russell 2000' }, { s: 'TSX:TSX', n: 'Canadá (TSX)', dp: 0 }, { s: 'BMV:ME', n: 'México (IPC)', dp: 0 }, { s: 'TVC:VIX', n: 'VIX' }] },
    { nome: 'Europa', itens: [{ s: 'TVC:SX5E', n: 'Euro Stoxx 50', dp: 0 }, { s: 'XETR:DAX', n: 'Alemanha (DAX)', dp: 0 }, { s: 'TVC:UKX', n: 'Londres (FTSE 100)', dp: 0 }, { s: 'EURONEXT:PX1', n: 'Paris (CAC 40)', dp: 0 }, { s: 'INDEX:FTSEMIB', n: 'Itália (FTSE MIB)', dp: 0 }, { s: 'BME:IBC', n: 'Espanha (IBEX)', dp: 0 }] },
    { nome: 'Ásia e Pacífico', itens: [{ s: 'TVC:NI225', n: 'Japão (Nikkei)', dp: 0 }, { s: 'TVC:HSI', n: 'Hong Kong (Hang Seng)', dp: 0 }, { s: 'SSE:000001', n: 'Xangai' }, { s: 'TVC:KOSPI', n: 'Coreia (Kospi)' }, { s: 'ASX:XJO', n: 'Austrália (ASX 200)', dp: 0 }, { s: 'NSE:NIFTY', n: 'Índia (Nifty 50)', dp: 0 }] },
    { nome: 'Futuros', itens: [{ s: 'BMFBOVESPA:WIN1!', n: 'Mini índice (WIN)', dp: 0 }, { s: 'CME_MINI:ES1!', n: 'S&P 500 futuro' }, { s: 'CME_MINI:NQ1!', n: 'Nasdaq futuro' }, { s: 'CBOT_MINI:YM1!', n: 'Dow futuro', dp: 0 }] },
  ] },
  fx: { nome: 'Moedas', grupos: [
    { nome: 'Real', itens: [{ s: 'FX_IDC:USDBRL', n: 'Dólar / Real', dp: 4 }, { s: 'BMFBOVESPA:WDO1!', n: 'Dólar futuro (WDO)', dp: 1 }, { s: 'FX_IDC:EURBRL', n: 'Euro / Real', dp: 4 }, { s: 'FX_IDC:GBPBRL', n: 'Libra / Real', dp: 4 }, { s: 'FX_IDC:CNYBRL', n: 'Yuan / Real', dp: 4 }] },
    { nome: 'Principais', itens: [{ s: 'TVC:DXY', n: 'Índice do dólar (DXY)' }, { s: 'FX:EURUSD', n: 'Euro / Dólar', dp: 4 }, { s: 'FX:GBPUSD', n: 'Libra / Dólar', dp: 4 }, { s: 'FX:USDJPY', n: 'Dólar / Iene' }, { s: 'FX:USDCHF', n: 'Dólar / Franco', dp: 4 }, { s: 'FX:AUDUSD', n: 'Dólar australiano', dp: 4 }, { s: 'FX:USDCAD', n: 'Dólar / Canadense', dp: 4 }] },
    { nome: 'Emergentes', itens: [{ s: 'FX_IDC:USDMXN', n: 'Dólar / Peso mexicano', dp: 4 }, { s: 'FX_IDC:USDCLP', n: 'Dólar / Peso chileno' }, { s: 'FX_IDC:USDCOP', n: 'Dólar / Peso colombiano' }, { s: 'FX_IDC:USDZAR', n: 'Dólar / Rand', dp: 4 }, { s: 'FX_IDC:USDTRY', n: 'Dólar / Lira turca', dp: 4 }, { s: 'FX_IDC:USDCNY', n: 'Dólar / Yuan', dp: 4 }] },
  ] },
  cmd: { nome: 'Commodities', grupos: [
    { nome: 'Energia', itens: [{ s: 'ICEEUR:BRN1!', n: 'Petróleo Brent' }, { s: 'NYMEX:CL1!', n: 'Petróleo WTI' }, { s: 'NYMEX:NG1!', n: 'Gás natural', dp: 3 }, { s: 'NYMEX:RB1!', n: 'Gasolina (RBOB)', dp: 3 }] },
    { nome: 'Metais', itens: [{ s: 'TVC:GOLD', n: 'Ouro' }, { s: 'TVC:SILVER', n: 'Prata', dp: 3 }, { s: 'COMEX:HG1!', n: 'Cobre', dp: 3 }, { s: 'SGX:FEF1!', n: 'Minério de ferro (Singapura)' }, { s: 'DCE:I1!', n: 'Minério de ferro (Dalian)', dp: 1 }] },
    { nome: 'Agrícolas', itens: [{ s: 'CBOT:ZS1!', n: 'Soja', dp: 2 }, { s: 'CBOT:ZC1!', n: 'Milho' }, { s: 'ICEUS:KC1!', n: 'Café arábica' }, { s: 'ICEUS:SB1!', n: 'Açúcar' }, { s: 'BMFBOVESPA:BGI1!', n: 'Boi gordo (B3)' }] },
  ] },
  cri: { nome: 'Cripto', grupos: [
    { nome: 'Principais', itens: [{ s: 'BINANCE:BTCUSDT', n: 'Bitcoin', r: 'btcusdt' }, { s: 'BINANCE:ETHUSDT', n: 'Ethereum', r: 'ethusdt' }, { s: 'BINANCE:SOLUSDT', n: 'Solana', r: 'solusdt' }, { s: 'BINANCE:XRPUSDT', n: 'XRP', r: 'xrpusdt', dp: 4 }, { s: 'BINANCE:BNBUSDT', n: 'BNB', r: 'bnbusdt' }, { s: 'BINANCE:ADAUSDT', n: 'Cardano', r: 'adausdt', dp: 4 }, { s: 'BINANCE:DOGEUSDT', n: 'Dogecoin', r: 'dogeusdt', dp: 5 }, { s: 'BINANCE:BTCBRL', n: 'Bitcoin em reais', r: 'btcbrl', dp: 0 }] },
  ] },
  jur: { nome: 'Juros e mercado monetário', grupos: [
    { nome: 'Brasil', itens: [{ s: 'BMFBOVESPA:DI11!', n: 'DI1 mais curto', dp: 3 }, { s: 'TVC:BR02Y', n: 'Título 2 anos', dp: 3 }, { s: 'TVC:BR05Y', n: 'Título 5 anos', dp: 3 }, { s: 'TVC:BR10Y', n: 'Título 10 anos', dp: 3 }] },
    { nome: 'EUA', itens: [{ s: 'TVC:US03MY', n: 'T-Bill 3 meses', dp: 3 }, { s: 'TVC:US02Y', n: 'Treasury 2 anos', dp: 3 }, { s: 'TVC:US05Y', n: 'Treasury 5 anos', dp: 3 }, { s: 'TVC:US10Y', n: 'Treasury 10 anos', dp: 3 }, { s: 'TVC:US30Y', n: 'Treasury 30 anos', dp: 3 }] },
    { nome: 'Mundo (10 anos)', itens: [{ s: 'TVC:DE10Y', n: 'Alemanha', dp: 3 }, { s: 'TVC:GB10Y', n: 'Reino Unido', dp: 3 }, { s: 'TVC:JP10Y', n: 'Japão', dp: 3 }, { s: 'TVC:IT10Y', n: 'Itália', dp: 3 }, { s: 'TVC:MX10Y', n: 'México', dp: 3 }] },
  ] },
};

/** Mercado do screener a partir do prefixo do símbolo. */
export function tvMercado(t: string): string {
  const e = t.split(':')[0];
  if (e === 'BMFBOVESPA') return /^BMFBOVESPA:(DI1|WIN|WDO|IND|DOL|BGI|CCM|ICF)/.test(t)?'futures':'brazil';
  if (e === 'AMEX' || e === 'NASDAQ' || e === 'NYSE') return 'america';
  if (e.startsWith('FX')) return 'forex';
  if (e === 'BITSTAMP' || e === 'BINANCE' || e === 'COINBASE') return 'crypto';
  if (/^(CME|COMEX|CBOT|NYMEX|ICE|SGX|DCE|SHFE|ZCE)/.test(e)) return 'futures';
  if (e === 'TVC') return 'cfd';
  return 'global';
}
/** Ticker digitado no terminal → símbolo do TradingView (PETR4 → BMFBOVESPA:PETR4; AAPL → NASDAQ:AAPL só se vier com bolsa). */
export function simbolo(tk: string): string {
  const t = String(tk || '').trim().toUpperCase();
  if (!t) return '';
  if(t === 'TVC:UKOIL' || t === 'UKOIL')return 'ICEEUR:BRN1!';
  if(t === 'TVC:USOIL' || t === 'USOIL')return 'NYMEX:CL1!';
  if (t.includes(':')) return t;
  const AP: Record<string, string> = { WINFUT: 'BMFBOVESPA:WIN1!', WDOFUT: 'BMFBOVESPA:WDO1!', INDFUT: 'BMFBOVESPA:IND1!', DOLFUT: 'BMFBOVESPA:DOL1!', SPX: 'SP:SPX', NDX: 'NASDAQ:NDX', DJI: 'DJ:DJI', DXY: 'TVC:DXY', VIX: 'TVC:VIX', USDBRL: 'FX_IDC:USDBRL', DOLAR: 'FX_IDC:USDBRL', EURBRL: 'FX_IDC:EURBRL', US10Y: 'TVC:US10Y', BRENT: 'ICEEUR:BRN1!', WTI: 'NYMEX:CL1!', OURO: 'TVC:GOLD', GOLD: 'TVC:GOLD' };
  if (AP[t]) return AP[t];
  if (/^(IBOV|IBXX|IBXL|IFNC|IMAT|ICON|IEEX|SMLL|IDIV|IFIX|IMOB|UTIL|INDX|IBRA)$/.test(t)) return 'BMFBOVESPA:' + t;
  const cr = /^(BTC|ETH|SOL|XRP|BNB|ADA|DOGE|LTC|AVAX|LINK|DOT)(USDT|USD|BRL)$/.exec(t);
  if (cr) return 'BINANCE:' + cr[1] + (cr[2] === 'USD' ? 'USDT' : cr[2]);
  if (/^[A-Z]{6}$/.test(t) && /^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)/.test(t) && /(USD|JPY|CHF|CAD|EUR|GBP|AUD|NZD)$/.test(t)) return 'FX:' + t;
  if (/^[A-Z]{4}\d{1,2}[A-Z]?$/.test(t) || /^(WIN|WDO|IND|DOL|DI1|BGI|CCM|ICF)[A-Z0-9!]*$/.test(t)) return 'BMFBOVESPA:' + t;
  return t; // ações dos EUA: o screener "america" aceita o ticker com a bolsa; quem chama completa com NASDAQ/NYSE
}
/** Lê { data:[{ s, d:[...] }] } com os nomes das colunas pedidas. */
export function lerScan(j: any, cols: string[]): Record<string, any>[] {
  const out: Record<string, any>[] = [];
  for (const x of Array.isArray(j?.data) ? j.data : []) {
    if (typeof x?.s !== 'string' || !Array.isArray(x?.d)) continue;
    const o: Record<string, any> = { s: x.s };
    cols.forEach((c, i) => { const v = x.d[i]; o[c] = typeof v === 'number' ? (isFinite(v) ? v : null) : v ?? null; });
    out.push(o);
  }
  return out;
}
export const COL_COT = ['description', 'close', 'change', 'change_abs', 'open', 'high', 'low', 'volume', 'Value.Traded', 'update_mode', 'currency', 'update_time'];
export const COL_FUND = ['description', 'close', 'change', 'market_cap_basic', 'price_earnings_ttm', 'price_book_ratio', 'price_sales_current', 'enterprise_value_ebitda_ttm', 'dividend_yield_recent',
  'return_on_equity', 'return_on_assets', 'net_margin', 'gross_margin', 'operating_margin', 'debt_to_equity', 'current_ratio', 'total_revenue', 'net_income', 'earnings_per_share_basic_ttm',
  'beta_1_year', 'price_52_week_high', 'price_52_week_low', 'Perf.YTD', 'Perf.Y', 'sector', 'industry', 'number_of_employees', 'average_volume_30d_calc'];
export const COL_FUND_MIN = ['description', 'close', 'change', 'market_cap_basic', 'price_earnings_ttm', 'price_book_ratio', 'dividend_yield_recent', 'sector', 'industry'];

/** Corpo do screener para "mais negociadas / maiores altas / maiores baixas" de um mercado. */
export function corpoMost(mk: 'brazil' | 'america', ord: 'vol' | 'alta' | 'baixa', n = 25) {
  const sortBy = ord === 'vol' ? 'Value.Traded' : 'change';
  const filtro: any[] = [{ left: 'type', operation: 'in_range', right: ['stock', 'dr', 'fund'] }, { left: 'Value.Traded', operation: 'greater', right: mk === 'brazil' ? 5e6 : 5e7 }];
  if (mk === 'brazil') filtro.push({ left: 'exchange', operation: 'equal', right: 'BMFBOVESPA' });
  return { filter: filtro, options: { lang: 'pt' }, markets: [mk], symbols: { query: { types: [] }, tickers: [] }, columns: COL_COT, sort: { sortBy, sortOrder: ord === 'baixa' ? 'asc' : 'desc' }, range: [0, n] };
}
/** Filtro de ações (EQS) com limites simples; valores ausentes são ignorados. */
export function corpoEqs(mk: 'brazil' | 'america', f: { plMax?: number; pvpMax?: number; dyMin?: number; roeMin?: number; liqMin?: number; setor?: string }, n = 40) {
  const L: any[] = [{ left: 'type', operation: 'equal', right: 'stock' }];
  if (mk === 'brazil') L.push({ left: 'exchange', operation: 'equal', right: 'BMFBOVESPA' });
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null);
  if (numT(f.plMax) != null) L.push({ left: 'price_earnings_ttm', operation: 'in_range', right: [0.01, f.plMax] });
  if (numT(f.pvpMax) != null) L.push({ left: 'price_book_ratio', operation: 'in_range', right: [0.01, f.pvpMax] });
  if (numT(f.dyMin) != null) L.push({ left: 'dividend_yield_recent', operation: 'greater', right: f.dyMin });
  if (numT(f.roeMin) != null) L.push({ left: 'return_on_equity', operation: 'greater', right: f.roeMin });
  L.push({ left: 'Value.Traded', operation: 'greater', right: numT(f.liqMin) ?? (mk === 'brazil' ? 2e6 : 2e7) });
  if (f.setor) L.push({ left: 'sector', operation: 'equal', right: f.setor });
  return { filter: L, options: { lang: 'pt' }, markets: [mk], symbols: { query: { types: [] }, tickers: [] }, columns: COL_FUND_MIN.concat(['return_on_equity', 'Value.Traded']), sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, n] };
}
/** Pares do mesmo setor (RV). */
export function corpoPares(mk: 'brazil' | 'america', setor: string, n = 12) {
  const L: any[] = [{ left: 'type', operation: 'equal', right: 'stock' }, { left: 'sector', operation: 'equal', right: setor }];
  if (mk === 'brazil') L.push({ left: 'exchange', operation: 'equal', right: 'BMFBOVESPA' });
  return { filter: L, options: { lang: 'pt' }, markets: [mk], symbols: { query: { types: [] }, tickers: [] }, columns: COL_FUND_MIN.concat(['return_on_equity', 'enterprise_value_ebitda_ttm', 'net_margin']), sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, n] };
}

// ---------- Copom implícito (como o WIRP): curva de DI1 mês a mês ----------
const fdu = (t: number, du: number) => Math.pow(1 + t / 100, du / 252);
/** Dia útil seguinte a uma data ISO (a nova Selic vale a partir do dia útil seguinte à decisão). */
export function diaUtilSeguinte(isoD: string): Date {
  const d = new Date(isoD + 'T12:00:00Z');
  do { d.setUTCDate(d.getUTCDate() + 1); } while (!diaUtil(d));
  return d;
}
/** Códigos DI1 dos próximos `n` vencimentos mensais (1º dia útil de cada mês) a partir de hoje. */
export function di1Mensais(hoje: Date, n = 14): { tk: string; cod: string; venc: Date }[] {
  const out: { tk: string; cod: string; venc: Date }[] = [];
  let y = hoje.getUTCFullYear(), m = hoje.getUTCMonth();
  for (let i = 0; out.length < n && i < n + 2; i++) {
    const v = vencimento(y, m);
    if (iso(v) > iso(hoje)) out.push({ tk: `BMFBOVESPA:DI1${COD_MES[m]}${y}`, cod: `DI1${COD_MES[m]}${String(y).slice(2)}`, venc: v });
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
/** Divide uma variação implícita em passos de 25 pb: −0,18 → 72% de −25 pb e 28% de 0. */
export function probPassos(delta: number, passo = 0.25): { mov_pb: number; p: number }[] {
  const lo = Math.floor(delta / passo) * passo, hi = lo + passo, w = (delta - lo) / passo;
  const a = { mov_pb: Math.round(lo * 100), p: Math.round((1 - w) * 1000) / 10 }, b = { mov_pb: Math.round(hi * 100), p: Math.round(w * 1000) / 10 };
  return [a, b].filter((x) => x.p > 0.05).sort((x, y) => y.p - x.p);
}
/**
 * Probabilidade de cada próximo Copom a partir de: CDI de hoje (% a.a.) e taxas dos DI1 mensais.
 * Entre dois vencimentos seguidos a taxa a termo é a média do CDI no período; se uma decisão cai no meio,
 * separa o pedaço antes (taxa antiga) e depois (taxa nova) e resolve a taxa nova.
 */
export function copomImplicito(hoje: Date, cdi: number, selic: number, di: { venc: Date; taxa: number }[], reunioes = COPOM, max = 4) {
  const hojeIso = iso(hoje), pts = di.filter((x) => isFinite(x.taxa) && x.taxa > 0).sort((a, b) => +a.venc - +b.venc);
  if (!pts.length || !(cdi > 0)) return [];
  const prox = reunioes.filter((r) => r[1] >= hojeIso).slice(0, max);
  const out: any[] = [];
  let taxaAtual = cdi, selicAtual = selic, ini = hoje, fIni = 1;
  for (const r of prox) {
    const efet = diaUtilSeguinte(r[1]);
    const ref = pts.find((p) => +p.venc > +efet);
    if (!ref) break;
    const duRef = diasUteis(hoje, ref.venc), fRef = fdu(ref.taxa, duRef);
    // trecho de ini até a decisão: taxa atual; da decisão até o vencimento de referência: taxa nova (supõe nada muda até lá)
    const duAntes = diasUteis(ini, efet), duDepois = diasUteis(efet, ref.venc);
    if (duDepois <= 0) break;
    const fAntes = fIni * fdu(taxaAtual, duAntes);
    const nova = (Math.pow(fRef / fAntes, 252 / duDepois) - 1) * 100;
    const delta = Math.round((nova - taxaAtual) * 1000) / 1000;
    const selicNova = Math.round((selicAtual + delta) * 100) / 100;
    out.push({ decisao: r[1], vigencia: iso(efet), contrato: iso(ref.venc), taxa_implicita: Math.round(nova * 100) / 100, mov_pb: Math.round(delta * 100), selic_esperada: selicNova, probs: probPassos(delta) });
    fIni = fAntes; ini = efet; taxaAtual = nova; selicAtual = selicNova;
  }
  return out;
}

// ---------- Fed implícito (como o FedWatch): futuros de fed funds (100 − preço = média do mês) ----------
export const FOMC: string[] = ['2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17', '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-09',
  '2027-01-27', '2027-03-17', '2027-04-28', '2027-06-09', '2027-07-28', '2027-09-15', '2027-10-27', '2027-12-08'];
export function zqSimbolos(hoje: Date, n = 8): { tk: string; ano: number; mes: number }[] {
  const out: { tk: string; ano: number; mes: number }[] = [];
  let y = hoje.getUTCFullYear(), m = hoje.getUTCMonth();
  for (let i = 0; i < n; i++) { out.push({ tk: `CBOT:ZQ${COD_MES[m]}${y}`, ano: y, mes: m }); m++; if (m > 11) { m = 0; y++; } }
  return out;
}
/** Método da CME: no mês da reunião, média = (d/N)·antes + ((N−d)/N)·depois. Começa da taxa efetiva atual. */
export function fedImplicito(hoje: Date, efetiva: number, alvoSup: number, zq: { ano: number; mes: number; px: number }[], reunioes = FOMC, max = 4) {
  const hojeIso = iso(hoje), mapa = new Map(zq.filter((z) => z.px > 80 && z.px < 101).map((z) => [`${z.ano}-${z.mes}`, 100 - z.px]));
  const prox = reunioes.filter((r) => r >= hojeIso).slice(0, max), out: any[] = [];
  let antes = efetiva, teto = alvoSup;
  for (const r of prox) {
    const d = new Date(r + 'T12:00:00Z'), y = d.getUTCFullYear(), m = d.getUTCMonth(), N = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), dia = d.getUTCDate();
    const media = mapa.get(`${y}-${m}`);
    let depois: number | null = null;
    if (media != null && N - dia > 0) depois = (media - (dia / N) * antes) / ((N - dia) / N);
    if (depois == null) { const prox2 = mapa.get(`${m === 11 ? y + 1 : y}-${(m + 1) % 12}`); if (prox2 != null) depois = prox2; }
    if (depois == null) break;
    const delta = Math.round((depois - antes) * 1000) / 1000;
    teto = Math.round((teto + delta) * 100) / 100;
    out.push({ decisao: r, taxa_implicita: Math.round(depois * 100) / 100, mov_pb: Math.round(delta * 100), teto_esperado: teto, probs: probPassos(delta) });
    antes = depois;
  }
  return out;
}

// ---------- Tesouro Direto ----------
export function leTesouro(j: any) {
  const L = j?.response?.TrsrBdTradgList;
  if (!Array.isArray(L)) return [];
  return L.map((x: any) => x?.TrsrBd || x).filter((b: any) => b && b.nm).map((b: any) => ({
    nome: String(b.nm), venc: String(b.mtrtyDt || '').slice(0, 10), taxa_compra: numT(b.anulInvstmtRate), taxa_venda: numT(b.anulRedRate),
    pu_compra: numT(b.untrInvstmtVal), pu_venda: numT(b.untrRedVal), minimo: numT(b.minInvstmtAmt),
  })).filter((b: any) => b.venc).sort((a: any, b: any) => (a.nome.localeCompare(b.nome) || a.venc.localeCompare(b.venc)));
}
const numT = (v: unknown) => (typeof v === 'number' && isFinite(v) && v !== 0 ? v : null);

// ---------- SEC (EDGAR): balanço padronizado das empresas americanas ----------
const SEC_C: [string, string[]][] = [
  ['receita', ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet']],
  ['lucro_operacional', ['OperatingIncomeLoss']], ['lucro_liquido', ['NetIncomeLoss']], ['ativo', ['Assets']], ['passivo', ['Liabilities']],
  ['patrimonio', ['StockholdersEquity']], ['ativo_circulante', ['AssetsCurrent']], ['passivo_circulante', ['LiabilitiesCurrent']],
  ['caixa', ['CashAndCashEquivalentsAtCarryingValue']], ['divida_lp', ['LongTermDebtNoncurrent', 'LongTermDebt']],
  ['fco', ['NetCashProvidedByUsedInOperatingActivities']], ['capex', ['PaymentsToAcquirePropertyPlantAndEquipment']], ['lpa', ['EarningsPerShareDiluted']],
];
/** Últimos `n` anos fiscais (10-K) de cada conta. */
export function secResumo(j: any, n = 5) {
  const g = j?.facts?.['us-gaap'] || {};
  const anos = new Map<number, Record<string, number>>();
  for (const [k, nomes] of SEC_C) {
    for (const nome of nomes) {
      const u = g[nome]?.units; if (!u) continue;
      const L: any[] = u.USD || u['USD/shares'] || [];
      const anual = L.filter((x) => x?.form === '10-K' && x?.fp === 'FY' && typeof x?.val === 'number' && x.end);
      if (!anual.length) continue;
      for (const x of anual) {
        const ano = +String(x.end).slice(0, 4), dur = x.start ? (Date.parse(x.end) - Date.parse(x.start)) / 864e5 : 365;
        if (dur < 300 || dur > 400) continue; // só o ano cheio
        const o = anos.get(ano) || {}; if (o[k] == null) o[k] = x.val; anos.set(ano, o);
      }
      // instantâneos (balanço): sem start
      for (const x of anual.filter((y) => !y.start)) { const ano = +String(x.end).slice(0, 4), o = anos.get(ano) || {}; if (o[k] == null) o[k] = x.val; anos.set(ano, o); }
      if ([...anos.values()].some((o) => o[k] != null)) break;
    }
  }
  const L = [...anos.entries()].sort((a, b) => a[0] - b[0]).slice(-n).map(([ano, o]) => ({ ano, ...o }));
  return { empresa: String(j?.entityName || ''), anos: L };
}

// ---------- Yahoo quoteSummary: ficha (DES), analistas (ANR), resultados (EE/ERN) e proventos (DVD) ----------
const rv = (x: any) => (x && typeof x.raw === 'number' && isFinite(x.raw) ? x.raw : null);
export function leSummary(j: any) {
  const R = j?.quoteSummary?.result?.[0]; if (!R) return null;
  const ap = R.assetProfile || {}, fd = R.financialData || {}, ks = R.defaultKeyStatistics || {}, sd = R.summaryDetail || {}, ce = R.calendarEvents || {}, eh = R.earningsHistory?.history || [], et = R.earningsTrend?.trend || [], rt = R.recommendationTrend?.trend?.[0] || {};
  return {
    perfil: { setor: ap.sector || null, industria: ap.industry || null, funcionarios: ap.fullTimeEmployees ?? null, site: ap.website || null, resumo: String(ap.longBusinessSummary || '').slice(0, 1200), cidade: [ap.city, ap.country].filter(Boolean).join(', ') || null },
    analistas: { alvo_medio: rv(fd.targetMeanPrice), alvo_max: rv(fd.targetHighPrice), alvo_min: rv(fd.targetLowPrice), n: rv(fd.numberOfAnalystOpinions), nota: rv(fd.recommendationMean), rec: fd.recommendationKey || null,
      votos: { compra_forte: rt.strongBuy ?? null, compra: rt.buy ?? null, neutro: rt.hold ?? null, venda: rt.sell ?? null, venda_forte: rt.strongSell ?? null } },
    numeros: { preco: rv(fd.currentPrice), receita: rv(fd.totalRevenue), ebitda: rv(fd.ebitda), margem_liq: rv(fd.profitMargins), margem_op: rv(fd.operatingMargins), roe: rv(fd.returnOnEquity), roa: rv(fd.returnOnAssets),
      divida: rv(fd.totalDebt), caixa: rv(fd.totalCash), liq_corrente: rv(fd.currentRatio), cresc_receita: rv(fd.revenueGrowth), cresc_lucro: rv(fd.earningsGrowth), fco: rv(fd.operatingCashflow), fcl: rv(fd.freeCashflow),
      pl: rv(sd.trailingPE), pl_proj: rv(sd.forwardPE), pvp: rv(ks.priceToBook), ev_ebitda: rv(ks.enterpriseToEbitda), beta: rv(sd.beta) ?? rv(ks.beta), valor_mercado: rv(sd.marketCap), acoes: rv(ks.sharesOutstanding) },
    proventos: { dy: rv(sd.dividendYield), taxa_anual: rv(sd.dividendRate), payout: rv(sd.payoutRatio), data_com: rv(sd.exDividendDate) ? new Date(rv(sd.exDividendDate)! * 1000).toISOString().slice(0, 10) : null },
    eventos: { resultado: (ce.earnings?.earningsDate || []).map((d: any) => rv(d)).filter(Boolean).map((t: number) => new Date(t * 1000).toISOString().slice(0, 10)), lpa_esperado: rv(ce.earnings?.earningsAverage), receita_esperada: rv(ce.earnings?.revenueAverage) },
    resultados: eh.map((h: any) => ({ trimestre: rv(h.quarter) ? new Date(rv(h.quarter)! * 1000).toISOString().slice(0, 7) : null, lpa: rv(h.epsActual), esperado: rv(h.epsEstimate), surpresa_pct: rv(h.surprisePercent) != null ? Math.round(rv(h.surprisePercent)! * 1000) / 10 : null })).filter((x: any) => x.trimestre),
    projecoes: et.filter((t: any) => /^(0q|\+1q|0y|\+1y)$/.test(t.period)).map((t: any) => ({ periodo: t.period, fim: t.endDate || null, lpa: rv(t.earningsEstimate?.avg), receita: rv(t.revenueEstimate?.avg), cresc: rv(t.growth), revisao: t.epsTrend ? { atual: rv(t.epsTrend.current), d7: rv(t.epsTrend['7daysAgo']), d30: rv(t.epsTrend['30daysAgo']), d90: rv(t.epsTrend['90daysAgo']) } : null, revisoes: t.epsRevisions ? { sobe30: rv(t.epsRevisions.upLast30days), desce30: rv(t.epsRevisions.downLast30days) } : null })),
  };
}

// ---------- notícias por ativo ou tema (Google Notícias: manchete, fonte e link) ----------
export function urlGnews(q: string, lingua: 'pt' | 'en' = 'pt', janela = 'when:2d') {
  const p = lingua === 'pt' ? 'hl=pt-BR&gl=BR&ceid=BR:pt-419' : 'hl=en-US&gl=US&ceid=US:en';
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' ' + janela)}&${p}`;
}
/** No Google Notícias o título vem "Manchete - Fonte": separa a fonte. */
export function separaFonte(t: string): { t: string; f: string | null } {
  const m = /^(.*\S)\s+-\s+([^-]{2,60})$/.exec(String(t || '').trim());
  return m ? { t: m[1], f: m[2].trim() } : { t: String(t || '').trim(), f: null };
}
/** Consultas de agência: Reuters e Estadão/Broadcast (só manchete e link, minutos depois). */
export const AGENCIAS: [string, string, 'pt' | 'en'][] = [
  ['Reuters (Brasil)', 'site:reuters.com Brazil OR Brasil', 'en'],
  ['Reuters (mercados)', 'site:reuters.com markets', 'en'],
  ['Estadão/Broadcast', 'site:estadao.com.br economia OR mercado', 'pt'],
  ['Valor Econômico', 'site:valor.globo.com', 'pt'],
  ['Agência Brasil', 'site:agenciabrasil.ebc.com.br economia', 'pt'],
];

// ---------- setores (comparação no dia, semana, mês e ano, ponderada pelo valor de mercado) ----------
export const COL_SET = ['description', 'close', 'change', 'Perf.W', 'Perf.1M', 'Perf.YTD', 'market_cap_basic', 'sector'];
export function corpoSetores(mk: 'brazil' | 'america', n = 300) {
  const L: any[] = [{ left: 'type', operation: 'equal', right: 'stock' }, { left: 'market_cap_basic', operation: 'greater', right: mk === 'brazil' ? 5e8 : 2e10 }];
  if (mk === 'brazil') L.push({ left: 'exchange', operation: 'equal', right: 'BMFBOVESPA' });
  return { filter: L, options: { lang: 'pt' }, markets: [mk], symbols: { query: { types: [] }, tickers: [] }, columns: COL_SET, sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, n] };
}
export const SETOR_PT: Record<string, string> = {
  'Finance': 'Financeiro', 'Energy Minerals': 'Petróleo e gás', 'Non-Energy Minerals': 'Mineração e siderurgia', 'Utilities': 'Energia elétrica e saneamento', 'Retail Trade': 'Varejo',
  'Consumer Non-Durables': 'Consumo básico', 'Consumer Durables': 'Consumo durável', 'Consumer Services': 'Serviços ao consumidor', 'Health Services': 'Saúde (serviços)', 'Health Technology': 'Saúde (farma e equipamentos)',
  'Technology Services': 'Tecnologia (software)', 'Electronic Technology': 'Tecnologia (hardware e chips)', 'Transportation': 'Transporte e logística', 'Process Industries': 'Indústria de base (papel, química, agro)',
  'Producer Manufacturing': 'Bens de capital', 'Industrial Services': 'Serviços industriais', 'Communications': 'Telecom', 'Commercial Services': 'Serviços comerciais', 'Distribution Services': 'Distribuição',
  'Miscellaneous': 'Outros', 'Government': 'Governo',
};
export function agregaSetores(L: Record<string, any>[]) {
  const g = new Map<string, Record<string, any>[]>();
  for (const x of L) { if (!x || !x.sector || !(x.market_cap_basic > 0)) continue; (g.get(x.sector) || g.set(x.sector, []).get(x.sector)!).push(x); }
  const media = (A: Record<string, any>[], k: string) => { let s = 0, w = 0; for (const a of A) { const v = a[k]; if (typeof v === 'number' && isFinite(v)) { s += v * a.market_cap_basic; w += a.market_cap_basic; } } return w ? Math.round((s / w) * 100) / 100 : null; };
  return [...g.entries()].map(([setor, A]) => {
    const top = A.slice().sort((a, b) => b.market_cap_basic - a.market_cap_basic).slice(0, 4);
    return { setor, nome: SETOR_PT[setor] || setor, n: A.length, vm: A.reduce((s, a) => s + a.market_cap_basic, 0), d1: media(A, 'change'), sem: media(A, 'Perf.W'), mes: media(A, 'Perf.1M'), ano: media(A, 'Perf.YTD'),
      lideres: top.map((a) => ({ s: String(a.s).split(':')[1] || a.s, d1: typeof a.change === 'number' ? Math.round(a.change * 100) / 100 : null })),
      alta: A.filter((a) => a.change > 0).length, baixa: A.filter((a) => a.change < 0).length };
  }).filter((x) => x.n >= 2).sort((a, b) => (b.d1 ?? -99) - (a.d1 ?? -99));
}

// ---------- mapa: TopoJSON (world-atlas 110m) → caminhos SVG já projetados ----------
/** Projeção cilíndrica de Miller recortada entre 84°N e 57°S; pontos a menos de `tol` px do anterior são descartados. */
export function topoParaPaths(topo: any, W = 1000, tol = 0.7) {
  const tr = topo?.transform, arcsQ: number[][][] = Array.isArray(topo?.arcs) ? topo.arcs : [];
  const geoms: any[] = topo?.objects?.countries?.geometries || [];
  if (!arcsQ.length || !geoms.length) throw new Error('Mapa vazio.');
  const miller = (lat: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180));
  const yN = miller(84), yS = miller(-57), H = Math.round(W * (yN - yS) / (2 * Math.PI));
  const px = (lon: number, lat: number): [number, number] => [((lon + 180) / 360) * W, ((yN - miller(Math.max(-57, Math.min(84, lat)))) / (yN - yS)) * H];
  const arcs = arcsQ.map((a) => { let x = 0, y = 0; return a.map((p) => { if (tr) { x += p[0]; y += p[1]; return px(x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]); } return px(p[0], p[1]); }); });
  const arco = (i: number) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
  const anel = (idx: number[]) => { const pts: [number, number][] = []; idx.forEach((i, k) => { const a = arco(i); pts.push(...(k ? a.slice(1) : a)); }); return pts; };
  const dAnel = (pts: [number, number][]) => {
    if (pts.length < 3) return '';
    let s = '', lx = NaN, ly = NaN, n = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i && i < pts.length - 1 && Math.abs(x - lx) < tol && Math.abs(y - ly) < tol) continue;
      if (i && Math.abs(x - lx) > W / 2) { s += 'M'; } else s += i ? 'L' : 'M'; // atravessa a linha de data: começa outro trecho
      s += Math.round(x * 10) / 10 + ',' + Math.round(y * 10) / 10; lx = x; ly = y; n++;
    }
    return n >= 3 ? s + 'Z' : '';
  };
  const paises = geoms.map((g) => {
    const polys: number[][][] = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    const d = polys.map((p) => p.map((r) => dAnel(anel(r))).join('')).join('');
    return { id: String(g.id ?? ''), n: String(g.properties?.name || ''), d };
  }).filter((p) => p.d && p.n !== 'Antarctica');
  return { w: W, h: H, paises };
}

// ---------- máquina do tempo: janela de busca de notícias de um dia ----------
export function janelaDia(d: string): { de: string; ate: string; q: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const t = Date.parse(d + 'T12:00:00Z'); if (!isFinite(t) || t > Date.now() + 864e5) return null;
  const f = (x: number) => new Date(x).toISOString().slice(0, 10);
  return { de: f(t - 864e5), ate: f(t + 864e5), q: `after:${f(t - 864e5)} before:${f(t + 864e5)}` };
}
// ---------- pesquisa universal de ativos (busca de símbolos do TradingView) ----------
export function leBusca(j: any) {
  const L: any[] = Array.isArray(j?.symbols) ? j.symbols : Array.isArray(j) ? j : [];
  const tira = (x: unknown) => String(x ?? '').replace(/<\/?em>/g, '');
  return L.slice(0, 20).map((x) => ({ tk: tira(x.symbol), n: tira(x.description), tipo: String(x.type || ''), bolsa: String(x.exchange || x.source_id || ''), pais: String(x.country || '') }))
    .filter((x) => x.tk && /^[A-Z0-9.!_-]{1,20}$/.test(x.tk));
}

// ---------- contrato vigente dos minis (o TradingView nem sempre acha o contínuo WIN1!/WDO1! no screener) ----------
const LETRA = 'FGHJKMNQUVXZ';
/** WIN: meses pares, vence na quarta mais próxima do dia 15; WDO: vence no 1º dia útil do mês, então vale o do mês seguinte. */
export function contratoVigente(raiz: 'WIN' | 'WDO' | 'IND' | 'DOL', hoje = new Date()): string {
  let y = hoje.getUTCFullYear(), m = hoje.getUTCMonth();
  if (raiz === 'WIN' || raiz === 'IND') {
    const quarta = (yy: number, mm: number) => { let melhor = 15, dist = 99; for (let d = 9; d <= 21; d++) { const w = new Date(Date.UTC(yy, mm, d)).getUTCDay(); if (w === 3 && Math.abs(d - 15) < dist) { dist = Math.abs(d - 15); melhor = d; } } return melhor; };
    if (m % 2 === 0) m += 1; // jan→fev, mar→abr…
    else if (hoje.getUTCDate() > quarta(y, m)) m += 2;
    if (m > 11) { m -= 12; y++; }
  } else { m += 1; if (m > 11) { m = 0; y++; } }
  return `BMFBOVESPA:${raiz}${LETRA[m]}${y}`;
}

// ---------- fontes extras para validação e contingência: brapi (B3) e Twelve Data (EUA e moedas) ----------
/** Código do terminal → símbolo da Twelve Data (só EUA e moedas; B3 fica com a brapi). */
export function simbTwelve(sym: string): string | null {
  const s = String(sym || '').toUpperCase(), base = s.includes(':') ? s.split(':')[1] : s, ex = s.includes(':') ? s.split(':')[0] : '';
  if (/^FX/.test(ex) && /^[A-Z]{6}$/.test(base)) return base.slice(0, 3) + '/' + base.slice(3);
  if (/^(NASDAQ|NYSE|AMEX)$/.test(ex) || (!ex && /^[A-Z]{1,5}$/.test(base))) return base;
  if (/^BINANCE$/.test(ex)) { const m = /^(BTC|ETH|SOL|XRP)(USDT|USD)$/.exec(base); return m ? m[1] + '/USD' : null; }
  return null;
}
export const simbBrapi = (sym: string): string | null => { const s = String(sym || '').toUpperCase(), base = s.includes(':') ? s.split(':')[1] : s, ex = s.includes(':') ? s.split(':')[0] : 'BMFBOVESPA'; return ex === 'BMFBOVESPA' && /^[A-Z]{4}\d{1,2}$/.test(base) ? base : ex === 'BMFBOVESPA' && base === 'IBOV' ? '^BVSP' : null; };
export function leBrapi(j: any): Record<string, { px: number; d1: number | null; em: string | null }> {
  const o: Record<string, { px: number; d1: number | null; em: string | null }> = {};
  for (const r of Array.isArray(j?.results) ? j.results : []) { const px = +r?.regularMarketPrice; if (r?.symbol && px > 0) o[String(r.symbol).toUpperCase()] = { px, d1: typeof r.regularMarketChangePercent === 'number' ? r.regularMarketChangePercent : null, em: r.regularMarketTime ? new Date(r.regularMarketTime).toISOString() : null }; }
  return o;
}
export function leTwelve(j: any, pedidos: string[]): Record<string, { px: number; d1: number | null; em: string | null }> {
  const o: Record<string, { px: number; d1: number | null; em: string | null }> = {};
  const um = (x: any) => { const px = +x?.close; if (!(px > 0)) return null; return { px, d1: x.percent_change != null && isFinite(+x.percent_change) ? +x.percent_change : null, em: x.timestamp ? new Date(+x.timestamp * 1000).toISOString() : x.datetime || null }; };
  if (pedidos.length === 1) { const v = um(j); if (v) o[pedidos[0]] = v; return o; }
  for (const k of pedidos) { const v = um(j?.[k]); if (v) o[k] = v; }
  return o;
}

// ---------- Tesouro Direto pelo Tesouro Transparente (o JSON do site do Tesouro Direto saiu do ar em ago/2025) ----------
/** CSV "PrecoTaxaTesouroDireto": Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha.
 *  Devolve só a data base mais recente, no mesmo formato do leTesouro. */
export function leTesouroCsv(txt: string) {
  const L = String(txt || '').split(/\r?\n/); if (L.length < 2) return { data: null as string | null, itens: [] as any[] };
  const cab = L[0].split(';').map((x) => x.trim().toLowerCase()), ix = (re: RegExp) => cab.findIndex((c) => re.test(c));
  const iT = ix(/^tipo/), iV = ix(/vencimento/), iB = ix(/data base/), iTC = ix(/taxa compra/), iTV = ix(/taxa venda/), iPC = ix(/pu compra/), iPV = ix(/pu venda/);
  if ([iT, iV, iB].some((i) => i < 0)) throw new Error('CSV do Tesouro em formato desconhecido.');
  const dt = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '').trim()); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  const nb = (s: string) => { const v = parseFloat(String(s || '').trim().replace(/\./g, '').replace(',', '.')); return isFinite(v) && v !== 0 ? v : null; };
  let max = '';
  const rows: string[][] = [];
  for (let k = 1; k < L.length; k++) { const c = L[k].split(';'); if (c.length < 3) continue; const b = dt(c[iB]); if (!b) continue; if (b > max) { max = b; rows.length = 0; } if (b === max) rows.push(c); }
  const hoje = new Date().toISOString().slice(0, 10);
  const itens = rows.map((c) => ({ nome: String(c[iT]).trim(), venc: dt(c[iV]), taxa_compra: iTC >= 0 ? nb(c[iTC]) : null, taxa_venda: iTV >= 0 ? nb(c[iTV]) : null, pu_compra: iPC >= 0 ? nb(c[iPC]) : null, pu_venda: iPV >= 0 ? nb(c[iPV]) : null, minimo: null }))
    .filter((b) => b.venc && b.venc > hoje).sort((a, b) => a.nome.localeCompare(b.nome) || a.venc.localeCompare(b.venc));
  return { data: max || null, itens };
}
// notícias que não têm RSS estável: busca no Google Notícias restrita ao site
export const FEEDS_GN: [string, string, 'pt' | 'en'][] = [['InfoMoney', 'site:infomoney.com.br mercados OR ações OR bolsa', 'pt'], ['Banco Central', 'site:bcb.gov.br', 'pt']];

// ---------- biblioteca histórica: séries diárias longas (Yahoo) para relações, cenários, correlação e ciclos ----------
export const HIST_BASE: [string, string, string][] = [['IBOV', '^BVSP', 'Ibovespa'], ['USDBRL', 'BRL=X', 'Dólar'], ['BRENT', 'BZ=F', 'Petróleo Brent'], ['US10Y', '^TNX', 'Treasury 10 anos'], ['SPX', '^GSPC', 'S&P 500'],
  ['OURO', 'GC=F', 'Ouro'], ['DXY', 'DX-Y.NYB', 'Índice do dólar'], ['VIX', '^VIX', 'VIX'], ['COBRE', 'HG=F', 'Cobre'], ['BTC', 'BTC-USD', 'Bitcoin'], ['VALE3', 'VALE3.SA', 'Vale'], ['PETR4', 'PETR4.SA', 'Petrobras']];
/** Yahoo (chart) → { d: datas AAAA-MM-DD, c: fechamentos } sem buracos. */
export function leSerieY(j: any): { d: string[]; c: number[] } {
  const r = j?.chart?.result?.[0], ts: number[] = r?.timestamp || [], q = r?.indicators?.quote?.[0]?.close || [], d: string[] = [], c: number[] = [];
  ts.forEach((t, i) => { const v = q[i]; if (typeof v === 'number' && isFinite(v) && v > 0) { const k = new Date(t * 1000).toISOString().slice(0, 10); if (d[d.length - 1] === k) c[c.length - 1] = +v.toFixed(4); else { d.push(k); c.push(+v.toFixed(4)); } } });
  return { d, c };
}
/** Velas de 60 min → variação média absoluta por hora (em Brasília), com o tamanho da amostra. */
export function volHora(j: any) {
  const r = j?.chart?.result?.[0], ts: number[] = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {}, g: Record<number, number[]> = {};
  for (let i = 0; i < ts.length; i++) { const o = q.open?.[i], c = q.close?.[i]; if (!(o > 0) || !(c > 0)) continue; const h = (new Date(ts[i] * 1000).getUTCHours() + 21) % 24; (g[h] ||= []).push(Math.abs(c / o - 1) * 100); }
  return Object.entries(g).map(([h, L]) => ({ h: +h, media: +(L.reduce((s, v) => s + v, 0) / L.length).toFixed(3), n: L.length })).filter((x) => x.n >= 5).sort((a, b) => a.h - b.h);
}

// ===== servidor =====
// supabase/functions/terminal/index.ts
// Terminal do Diário (no estilo Bloomberg, só com fontes gratuitas e oficiais):
//   cotações e monitores do mundo, mais negociadas, ficha e balanços da empresa, filtro de ações, indicadores de 6 países,
//   agenda com resultado, notícias (inclusive manchetes da Reuters e do Estadão pelo Google Notícias), Tesouro Direto,
//   curvas e a probabilidade implícita do próximo Copom (curva de DI1) e do Fed (futuros de fed funds).
// Publicar: colar o arquivo único terminal-index.ts no editor do Supabase (Edge Functions → nova função "terminal").
// Corpo: {"acao":"cot"|"mundo"|"most"|"fund"|"eqs"|"macro"|"agenda"|"noticias"|"copom"|"fed"|"titulos", ...}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const UA_SEC = 'DiarioTrader terminal contato@diariotrader.app';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
const pega = async (url: string, extra: Record<string, string> = {}, ms = 12_000, init: RequestInit = {}) => {
  const r = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...extra, ...((init.headers as any) || {}) }, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`);
  return r;
};
const CACHE_T = new Map<string, { ts: number; v: unknown }>();
const EM_CURSO = new Map<string, Promise<unknown>>();
async function cacheado<T>(k: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const c = CACHE_T.get(k);
  if (c && Date.now() - c.ts < ttl) return c.v as T;
  const existente = EM_CURSO.get(k);
  if (existente) return existente as Promise<T>;
  // Compartilha apenas a mesma consulta pendente. O TTL, os dados e o fallback
  // permanecem exatamente como na publicação anterior.
  const trabalho = Promise.resolve().then(async () => {
    try { const v = await fn(); if (CACHE_T.size > 400) CACHE_T.clear(); CACHE_T.set(k, { ts: Date.now(), v }); return v; }
    catch (e) { if (c) return c.v as T; throw e; }
  }).finally(() => { EM_CURSO.delete(k); });
  EM_CURSO.set(k, trabalho);
  return trabalho;
}
const anosAtras = (n: number) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - n); return d.toISOString().slice(0, 10); };

// ---------- TradingView (screener) ----------
const ALT_SIMB: Record<string, string[]> = { 'TVC:GOLD': ['COMEX:GC1!'], 'TVC:SILVER': ['COMEX:SI1!'], 'TVC:DXY': ['ICEUS:DX1!'], 'SGX:FEF1!': ['DCE:I1!'] };
const TVH = { 'Content-Type': 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' };
async function scanSimbolos(simbolos: string[], cols: string[]): Promise<Record<string, any>[]> {
  const porMk: Record<string, string[]> = {};
  for (const s of simbolos) (porMk[tvMercado(s)] ||= []).push(s);
  const res = await Promise.all(Object.entries(porMk).map(async ([mk, L]) => {
    try {
      const r = await pega(`https://scanner.tradingview.com/${mk}/scan`, TVH, 10_000, { method: 'POST', body: JSON.stringify({ symbols: { tickers: L, query: { types: [] } }, columns: cols }) });
      return lerScan(await r.json(), cols);
    } catch { return []; }
  }));
  const out = res.flat(), achou = new Set(out.map((x) => x.s)), falta = simbolos.filter((s) => !achou.has(s));
  const tenta = async (mk: string, tks: string[]) => { if (!tks.length) return [] as Record<string, any>[]; try { const r = await pega(`https://scanner.tradingview.com/${mk}/scan`, TVH, 10_000, { method: 'POST', body: JSON.stringify({ symbols: { tickers: tks, query: { types: [] } }, columns: cols }) }); return lerScan(await r.json(), cols); } catch { return []; } };
  const faltam = () => simbolos.filter((s) => !out.some((x) => x.s === s));
  // segunda chance: mercado global e CFDs (TVC:UKOIL, TVC:GOLD… ficam no "cfd")
  out.push(...await tenta('global', faltam()));
  out.push(...await tenta('cfd', faltam()));
  // terceira: símbolo equivalente (contrato futuro), devolvido com o nome pedido
  for (const r of ['WIN', 'WDO', 'IND', 'DOL'] as const) ALT_SIMB[`BMFBOVESPA:${r}1!`] = [contratoVigente(r), contratoVigente(r).replace(/(\d{2})(\d{2})$/, '$2')];
  const alt = faltam().filter((s) => ALT_SIMB[s]);
  if (alt.length) {
    const pedidos = alt.flatMap((s) => ALT_SIMB[s]);
    const porMk2: Record<string, string[]> = {}; for (const s of pedidos) (porMk2[tvMercado(s)] ||= []).push(s);
    const achados = (await Promise.all(Object.entries(porMk2).map(([mk, L]) => tenta(mk, L)))).flat();
    for (const s of alt) { const x = ALT_SIMB[s].map((a) => achados.find((y) => y.s === a)).find(Boolean); if (x) out.push({ ...x, s, equivalente: x.s }); }
  }
  return out;
}
async function scanQuery(mk: string, corpo: any): Promise<Record<string, any>[]> {
  const r = await pega(`https://scanner.tradingview.com/${mk}/scan`, TVH, 12_000, { method: 'POST', body: JSON.stringify(corpo) });
  return lerScan(await r.json(), corpo.columns);
}
const cotLinha = (x: Record<string, any>) => ({ simboloFonte: x.equivalente || x.s, horarioPreco: typeof x.update_time === 'number' && x.update_time > 0 && x.update_time <= Date.now()/1000+60 ? new Date(x.update_time*1000).toISOString() : null, modoAtualizacao: x.update_mode || null, fechamentoAnterior: typeof x.close === 'number' && typeof x.change_abs === 'number' && x.close-x.change_abs > 0 ? x.close-x.change_abs : null, baseVariacao: 'Referência diária do provedor (fechamento/ajuste anterior)', s: x.s, n: x.description || x.s.split(':')[1], px: x.close, d1: x.change, dabs: x.change_abs, ab: x.open, max: x.high, min: x.low, vol: x.volume, fin: x['Value.Traded'], atraso: x.update_mode ? !/^(realtime|streaming)$/i.test(String(x.update_mode)) : null, moeda: x.currency || null });

/** Ações dos EUA chegam sem a bolsa: testa NASDAQ, NYSE e AMEX. */
function variantes(tk: string): string[] {
  const s = simbolo(tk);
  if (s.includes(':')) return [s];
  return ['NASDAQ:' + s, 'NYSE:' + s, 'AMEX:' + s];
}
const BRAPI = Deno.env.get('BRAPI_TOKEN') || '', TWELVE = Deno.env.get('TWELVE_API_KEY') || Deno.env.get('TWELVE_KEY') || Deno.env.get('TWELVEDATA_KEY') || '';
type Extra = Record<string, { px: number; d1: number | null; em: string | null }>;
/** brapi: um ativo por chamada (vale para o plano grátis); cache de 60 s. */
async function brapi(tks: string[]): Promise<Extra> {
  if (!BRAPI || !tks.length) return {};
  const out: Extra = {};
  await Promise.all(tks.slice(0, 12).map(async (t) => { try { const v = await cacheado('brapi|' + t, 60_000, async () => leBrapi(await (await pega(`https://brapi.dev/api/quote/${encodeURIComponent(t)}?token=${encodeURIComponent(BRAPI)}`, { Accept: 'application/json' }, 8_000)).json())); Object.assign(out, v); } catch { /* sem brapi agora */ } }));
  return out;
}
/** Twelve Data: até 8 símbolos por chamada (limite grátis de 8 por minuto); cache de 60 s. */
async function twelve(sim: string[]): Promise<Extra> {
  if (!TWELVE || !sim.length) return {};
  const L = [...new Set(sim)].slice(0, 8), k = 'td|' + L.join(',');
  try { return await cacheado(k, 60_000, async () => leTwelve(await (await pega(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(L.join(','))}&apikey=${encodeURIComponent(TWELVE)}`, { Accept: 'application/json' }, 8_000)).json(), L)); } catch { return {}; }
}
/** Validação: o mesmo ativo em fontes independentes (brapi e Twelve Data), para comparar com o Profit e o TradingView. */
async function valida(lista: string[]) {
  const sy = lista.slice(0, 20).map((t) => ({ t, s: simbolo(t) }));
  const bp = sy.map((x) => ({ ...x, b: simbBrapi(x.s) })).filter((x) => x.b), tw = sy.map((x) => ({ ...x, w: simbTwelve(x.s) })).filter((x) => x.w);
  const [B, W] = await Promise.all([brapi(bp.map((x) => x.b!)), twelve(tw.map((x) => x.w!))]);
  const itens: Record<string, any> = {};
  for (const x of bp) if (B[x.b!.toUpperCase()]) itens[x.t] = { ...(itens[x.t] || {}), brapi: B[x.b!.toUpperCase()] };
  for (const x of tw) if (W[x.w!]) itens[x.t] = { ...(itens[x.t] || {}), twelve: W[x.w!] };
  return { em: new Date().toISOString(), brapi: !!BRAPI, twelve: !!TWELVE, itens };
}
async function cot(lista: string[]) {
  const pedidos = lista.slice(0, 120).map((t) => ({ t, v: variantes(t) }));
  const L = await scanSimbolos([...new Set(pedidos.flatMap((p) => p.v))], COL_COT);
  const por = new Map(L.map((x) => [x.s, x]));
  const itens: any[] = pedidos.map((p) => { const x = p.v.map((v) => por.get(v)).find(Boolean); return x ? { pedido: p.t, ...cotLinha(x), fonte: 'TradingView' } : { pedido: p.t, s: p.v[0], px: null }; });
  if(itens.some(x=>x.px==null)){
    const cached=await mercadoCache('quotes',15*60000);
    if(cached){const rows=lerScan(cached.payload,['description','close','change','change_abs','update_mode','currency','update_time']),by=new Map(rows.map(x=>[x.s,x]));for(const item of itens.filter(x=>x.px==null)){const wanted=pedidos.find(p=>p.t===item.pedido),found=wanted?.v.map(v=>by.get(v)).find(Boolean);if(found&&typeof found.close==='number'&&found.close>0)Object.assign(item,cotLinha(found),{atraso:true,fonte:'TradingView',snapshot:true,coletaServidor:cached.fetched_at})}}
  }
  // contingência: o que o TradingView não achou vem da brapi (B3) ou da Twelve Data (EUA e moedas), quando as chaves estão configuradas
  const falta = itens.filter((x) => x.px == null);
  if (falta.length && (BRAPI || TWELVE)) {
    const v = await valida(falta.map((x) => x.pedido));
    for (const x of falta) { const e = v.itens[x.pedido]; const z = e?.brapi || e?.twelve; if (z) Object.assign(x, { px: z.px, d1: z.d1, atraso: true, fonte: e.brapi ? 'brapi' : 'Twelve Data', dado_em: z.em }); }
  }
  return { em: new Date().toISOString(), fonte: 'TradingView', itens };
}
async function mundo(g: string) {
  const M = MUNDO[g]; if (!M) throw new Error('Monitor desconhecido.');
  return cacheado('mundo|' + g, 20_000, async () => {
    const L = await scanSimbolos(M.grupos.flatMap((x) => x.itens.map((i) => i.s)), COL_COT), por = new Map(L.map((x) => [x.s, x]));
    if (!L.length) throw new Error('O TradingView não respondeu agora.');
    return { g, nome: M.nome, em: new Date().toISOString(), fonte: 'TradingView', grupos: M.grupos.map((gr) => ({ nome: gr.nome, itens: gr.itens.map((i) => { const x = por.get(i.s); return { ...(x ? cotLinha(x) : { s: i.s, px: null }), n: i.n, dp: i.dp ?? 2, r: i.r || null }; }) })) };
  });
}
async function most(mk: 'brazil' | 'america', ord: 'vol' | 'alta' | 'baixa') {
  return cacheado(`most|${mk}|${ord}`, 30_000, async () => ({ mk, ord, em: new Date().toISOString(), fonte: 'TradingView', itens: (await scanQuery(mk, corpoMost(mk, ord))).map(cotLinha) }));
}

// ---------- Yahoo (ficha, analistas, resultados, balanços) ----------
let YH: { cookie: string; crumb: string; ts: number } | null = null;
async function yhAuth() {
  if (YH && Date.now() - YH.ts < 30 * 60_000) return YH;
  const r = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0]; await r.text().catch(() => '');
  const c = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, Cookie: cookie }, signal: AbortSignal.timeout(8_000) });
  const crumb = await c.text();
  if (!c.ok || !crumb || crumb.includes('<')) throw new Error('Yahoo: sem crumb');
  return (YH = { cookie, crumb, ts: Date.now() });
}
const ySym = (tk: string, br: boolean) => (br ? tk + '.SA' : tk);
async function ySummary(sym: string) {
  const a = await yhAuth();
  const mods = 'assetProfile,financialData,defaultKeyStatistics,summaryDetail,calendarEvents,earningsHistory,earningsTrend,recommendationTrend';
  const r = await pega(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=${mods}&crumb=${encodeURIComponent(a.crumb)}`, { Cookie: a.cookie }, 10_000);
  return leSummary(await r.json());
}
async function yBalancos(sym: string, banco: boolean) {
  const a = await yhAuth(), p2 = Math.floor(Date.now() / 1000), p1 = p2 - 6 * 365 * 86400;
  const r = await pega(`https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(sym)}?symbol=${encodeURIComponent(sym)}&type=${IUD_TIPOS.join(',')}&period1=${p1}&period2=${p2}&crumb=${encodeURIComponent(a.crumb)}`, { Cookie: a.cookie }, 10_000);
  const ts = await r.json();
  const serie = (tipo: string) => { const it = (ts?.timeseries?.result || []).find((x: any) => Array.isArray(x?.meta?.type) && x.meta.type[0] === tipo); return ((it && it[tipo]) || []).filter(Boolean).map((x: any) => ({ ano: +String(x.asOfDate).slice(0, 4), valor: typeof x?.reportedValue?.raw === 'number' ? x.reportedValue.raw : null })); };
  const SB: Record<string, any[]> = {}; for (const t of IUD_TIPOS) SB[t] = serie(t);
  return iudIndicadores(SB, banco);
}
// ---------- SEC (EDGAR) ----------
async function secCik(tk: string): Promise<string | null> {
  const m = await cacheado('sec-tickers', 24 * 3600_000, async () => (await pega('https://www.sec.gov/files/company_tickers.json', { 'User-Agent': UA_SEC, Accept: 'application/json' }, 12_000)).json()) as any;
  const x = Object.values(m || {}).find((v: any) => String(v?.ticker || '').toUpperCase() === tk.toUpperCase()) as any;
  return x ? String(x.cik_str).padStart(10, '0') : null;
}
async function sec(tk: string) {
  const cik = await secCik(tk); if (!cik) return null;
  return cacheado('sec|' + cik, 12 * 3600_000, async () => secResumo(await (await pega(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { 'User-Agent': UA_SEC, Accept: 'application/json' }, 15_000)).json()));
}
async function fund(tkIn: string) {
  const tk = String(tkIn || '').trim().toUpperCase().replace(/^.*:/, '');
  if (!/^[A-Z0-9.\-]{1,12}$/.test(tk)) throw new Error('Ticker inválido.');
  return cacheado('fund|' + tk, 10 * 60_000, async () => {
    const vs = variantes(tk), br = vs[0].startsWith('BMFBOVESPA:');
    let tv: Record<string, any>[] = [];
    try { tv = await scanSimbolos(vs, COL_FUND); } catch { /* tenta o mínimo */ }
    if (!tv.length) tv = await scanSimbolos(vs, COL_FUND_MIN);
    const x = tv[0] || null, mk = br ? 'brazil' : 'america';
    const banco = /financ|banc|insur|segur/i.test(String(x?.sector || '') + String(x?.industry || ''));
    const [sm, bal, pares, sc] = await Promise.allSettled([
      ySummary(ySym(tk, br)), yBalancos(ySym(tk, br), banco),
      x?.sector ? scanQuery(mk, corpoPares(mk, x.sector)) : Promise.resolve([]),
      br ? Promise.resolve(null) : sec(tk),
    ]);
    const v = (p: PromiseSettledResult<any>) => (p.status === 'fulfilled' ? p.value : null);
    if (!x && !v(sm)) throw new Error(`Não achei ${tk}.`);
    return { tk, s: x?.s || vs[0], br, em: new Date().toISOString(), tv: x, yahoo: v(sm), balancos: v(bal), pares: (v(pares) || []).filter((p: any) => !/^BMFBOVESPA:[A-Z]{4}\d{1,2}F$/.test(String(p.s))).map((p: any) => ({ s: p.s, n: p.description, px: p.close, pl: p.price_earnings_ttm, pvp: p.price_book_ratio, dy: p.dividend_yield_recent, roe: p.return_on_equity, ev_ebitda: p.enterprise_value_ebitda_ttm, ml: p.net_margin, vm: p.market_cap_basic })), sec: v(sc),
      fontes: ['TradingView (cotação e múltiplos)', 'Yahoo Finance (ficha, analistas, resultados, balanços)', ...(br ? [] : ['SEC EDGAR (balanço oficial)'])] };
  });
}
async function eqs(mk: 'brazil' | 'america', f: any) {
  const L = await scanQuery(mk, corpoEqs(mk, f || {}));
  return { mk, em: new Date().toISOString(), itens: L.map((p) => ({ s: p.s, n: p.description, px: p.close, d1: p.change, pl: p.price_earnings_ttm, pvp: p.price_book_ratio, dy: p.dividend_yield_recent, roe: p.return_on_equity, vm: p.market_cap_basic, fin: p['Value.Traded'], setor: p.sector })) };
}

// ---------- macro: indicadores de 6 países (mesmas fontes da função economia) ----------
// Banco Central (SGS): desde 2025 o "/ultimos/N" só aceita N ≤ 20 e séries diárias só até 10 anos por consulta.
// Acima de 20 pontos, pede por período (dataInicial/dataFinal) e guarda a última cópia boa por 3 h.
const dmy = (x: Date) => `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`;
const sgsUrl = (c: number, q: string) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${c}/dados${q}`;
async function sgs(c: number, n = 20, diario = false): Promise<Ponto[]> {
  return cacheado(`sgs|${c}|${n}`, 3 * 3600_000, async () => {
    if (n <= 20) return leSGS(await (await pega(sgsUrl(c, `/ultimos/${n}?formato=json`), { Accept: 'application/json' }, 15_000)).json());
    const dias = Math.min(3600, diario ? Math.ceil(n * 1.5) + 15 : n * 31 + 45);
    try {
      const L = leSGS(await (await pega(sgsUrl(c, `?formato=json&dataInicial=${dmy(new Date(Date.now() - dias * 864e5))}&dataFinal=${dmy(new Date())}`), { Accept: 'application/json' }, 20_000)).json());
      if (L.length) return L.slice(-n);
      throw new Error('vazio');
    } catch { return leSGS(await (await pega(sgsUrl(c, '/ultimos/20?formato=json'), { Accept: 'application/json' }, 15_000)).json()); }
  });
}
// FRED: no máximo 2 downloads ao mesmo tempo (muitos juntos fazem o site recusar), 2 tentativas e cópia boa por 6 h.
let fredAtivos = 0; const fredFila: (() => void)[] = [];
async function fredVez<T>(fn: () => Promise<T>): Promise<T> {
  if (fredAtivos >= 2) await new Promise<void>((r) => fredFila.push(r));
  fredAtivos++;
  try { return await fn(); } finally { fredAtivos--; const nx = fredFila.shift(); if (nx) nx(); }
}
const fred = (id: string) => cacheado('fred|' + id, 6 * 3600_000, () => fredVez(async () => {
  const u = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${anosAtras(4)}`;
  try { const L = leFRED(await (await pega(u, { Accept: 'text/csv,*/*' }, 20_000)).text()); if (L.length) return L; throw new Error('FRED ' + id + ' vazio'); }
  catch { await new Promise((r) => setTimeout(r, 1500)); const L = leFRED(await (await pega(u, { Accept: 'text/csv,*/*' }, 25_000)).text()); if (!L.length) throw new Error('FRED ' + id + ' vazio'); return L; }
}));
const bis = (flow: string, key: string) => cacheado(`bis|${flow}|${key}`, 6 * 3600_000, async () => leSdmxCsv(await (await pega(`https://stats.bis.org/api/v2/data/dataflow/BIS/${flow}/1.0/${key}?lastNObservations=40&format=csv`)).text()));
const oecd = (flow: string, key: string, n: number) => cacheado(`oecd|${flow}|${key}`, 6 * 3600_000, async () => leOecd(await (await pega(`https://sdmx.oecd.org/public/rest/data/${flow}/${key}?lastNObservations=${n}&dimensionAtObservation=AllDimensions&format=jsondata`, { Accept: 'application/json' })).json()));
const eurostat = async (q: string) => leEurostat(await (await pega(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${q}`, { Accept: 'application/json' })).json());
const PIB_OCDE = () => oecd('OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA_EXPENDITURE_GROWTH_OECD,1.1', 'Q..JPN+GBR+USA+CHN+BRA.S1..B1GQ......GY.', 12);
const DES_OCDE = () => oecd('OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0', 'JPN+GBR+USA..._Z.Y._T.Y_GE15..M', 36);
const JUROS_BIS = () => bis('WS_CBPOL', 'M.XM+GB+JP+CN');
const CPI_BIS = () => bis('WS_LONG_CPI', 'M.XM+GB+JP+CN.771');
type Def = { id: string; nome: string; un: string; fonte: string; o?: string; get: () => Promise<Ponto[]> };
const PAISES: { id: string; nome: string; defs: Def[] }[] = [
  { id: 'BR', nome: 'Brasil', defs: [
    { id: 'br_selic', nome: 'Selic (meta)', un: '%', fonte: 'Banco Central', o: 'juros', get: async () => mensal(await sgs(432, 900, true)) },
    { id: 'br_ipca12', nome: 'IPCA em 12 meses', un: '%', fonte: 'IBGE / Banco Central', o: 'infl', get: () => sgs(13522, 60) },
    { id: 'br_ipca', nome: 'IPCA no mês', un: '%', fonte: 'IBGE / Banco Central', get: () => sgs(433, 60) },
    { id: 'br_pib', nome: 'PIB (anual)', un: '%', fonte: 'OCDE', o: 'pib', get: async () => (await PIB_OCDE()).BRA || [] },
    { id: 'br_des', nome: 'Desemprego (PNAD)', un: '%', fonte: 'IBGE / Banco Central', o: 'des', get: () => sgs(24369, 60) },
    { id: 'br_ibc', nome: 'IBC-Br (atividade, anual)', un: '%', fonte: 'Banco Central', get: async () => anual(await sgs(24363, 60)) },
    { id: 'br_igpm', nome: 'IGP-M em 12 meses', un: '%', fonte: 'FGV / Banco Central', get: async () => acum12(await sgs(189, 60)) },
    { id: 'br_ptax', nome: 'Dólar PTAX', un: 'R$', fonte: 'Banco Central', get: async () => mensal(await sgs(1, 900, true)) },
    { id: 'br_dlsp', nome: 'Dívida líquida (% do PIB)', un: '%', fonte: 'Banco Central', get: () => sgs(4513, 36) },
  ] },
  { id: 'US', nome: 'EUA', defs: [
    { id: 'us_fed', nome: 'Juros do Fed (teto)', un: '%', fonte: 'FRED', o: 'juros', get: async () => mensal(await fred('DFEDTARU')) },
    { id: 'us_cpi', nome: 'Inflação CPI (anual)', un: '%', fonte: 'FRED / BLS', o: 'infl', get: async () => anual(await fred('CPIAUCSL')) },
    { id: 'us_core', nome: 'Núcleo do CPI (anual)', un: '%', fonte: 'FRED / BLS', get: async () => anual(await fred('CPILFESL')) },
    { id: 'us_pce', nome: 'Núcleo do PCE (anual)', un: '%', fonte: 'FRED / BEA', get: async () => anual(await fred('PCEPILFE')) },
    { id: 'us_pibt', nome: 'PIB (tri, anualizado)', un: '%', fonte: 'FRED / BEA', o: 'pib', get: () => fred('A191RL1Q225SBEA') },
    { id: 'us_des', nome: 'Desemprego', un: '%', fonte: 'FRED / BLS', o: 'des', get: () => fred('UNRATE') },
    { id: 'us_nfp', nome: 'Payroll (vagas no mês)', un: 'mil', fonte: 'FRED / BLS', get: async () => diferenca(await fred('PAYEMS')) },
    { id: 'us_10a', nome: 'Treasury 10 anos', un: '%', fonte: 'FRED', get: async () => mensal(await fred('DGS10')) },
    { id: 'us_claims', nome: 'Pedidos de seguro-desemprego', un: 'mil', fonte: 'FRED / DOL', get: async () => (await fred('ICSA')).map(([d, v]) => [d, Math.round(v / 1000)] as Ponto) },
    { id: 'us_sent', nome: 'Confiança do consumidor (Michigan)', un: 'pts', fonte: 'FRED / U. Michigan', get: () => fred('UMCSENT') },
  ] },
  { id: 'XM', nome: 'Zona do Euro', defs: [
    { id: 'eu_juros', nome: 'Juros do BCE', un: '%', fonte: 'BIS', o: 'juros', get: async () => (await JUROS_BIS()).XM || [] },
    { id: 'eu_infl', nome: 'Inflação (anual)', un: '%', fonte: 'BIS', o: 'infl', get: async () => (await CPI_BIS()).XM || [] },
    { id: 'eu_pib', nome: 'PIB (anual)', un: '%', fonte: 'Eurostat', o: 'pib', get: () => eurostat('namq_10_gdp?geo=EA20&unit=CLV_PCH_SM&s_adj=SCA&na_item=B1GQ&lastTimePeriod=12') },
    { id: 'eu_des', nome: 'Desemprego', un: '%', fonte: 'Eurostat', o: 'des', get: () => eurostat('une_rt_m?geo=EA20&s_adj=SA&age=TOTAL&sex=T&unit=PC_ACT&lastTimePeriod=36') },
  ] },
  { id: 'GB', nome: 'Reino Unido', defs: [
    { id: 'gb_juros', nome: 'Juros do BoE', un: '%', fonte: 'BIS', o: 'juros', get: async () => (await JUROS_BIS()).GB || [] },
    { id: 'gb_infl', nome: 'Inflação (anual)', un: '%', fonte: 'BIS', o: 'infl', get: async () => (await CPI_BIS()).GB || [] },
    { id: 'gb_pib', nome: 'PIB (anual)', un: '%', fonte: 'OCDE', o: 'pib', get: async () => (await PIB_OCDE()).GBR || [] },
    { id: 'gb_des', nome: 'Desemprego', un: '%', fonte: 'OCDE', o: 'des', get: async () => (await DES_OCDE()).GBR || [] },
  ] },
  { id: 'JP', nome: 'Japão', defs: [
    { id: 'jp_juros', nome: 'Juros do BoJ', un: '%', fonte: 'BIS', o: 'juros', get: async () => (await JUROS_BIS()).JP || [] },
    { id: 'jp_infl', nome: 'Inflação (anual)', un: '%', fonte: 'BIS', o: 'infl', get: async () => (await CPI_BIS()).JP || [] },
    { id: 'jp_pib', nome: 'PIB (anual)', un: '%', fonte: 'OCDE', o: 'pib', get: async () => (await PIB_OCDE()).JPN || [] },
    { id: 'jp_des', nome: 'Desemprego', un: '%', fonte: 'OCDE', o: 'des', get: async () => (await DES_OCDE()).JPN || [] },
  ] },
  { id: 'CN', nome: 'China', defs: [
    { id: 'cn_juros', nome: 'Juros do PBoC', un: '%', fonte: 'BIS', o: 'juros', get: async () => (await JUROS_BIS()).CN || [] },
    { id: 'cn_infl', nome: 'Inflação (anual)', un: '%', fonte: 'BIS', o: 'infl', get: async () => (await CPI_BIS()).CN || [] },
    { id: 'cn_pib', nome: 'PIB (anual)', un: '%', fonte: 'OCDE', o: 'pib', get: async () => (await PIB_OCDE()).CHN || [] },
  ] },
];
async function macro() {
  // com indicador faltando, tenta de novo em 5 min (em vez de 30)
  const c0 = CACHE_T.get('macro') as any; if (c0 && c0.v?.falhas?.length && Date.now() - c0.ts > 5 * 60_000) c0.ts = 0;
  return cacheado('macro', 30 * 60_000, async () => {
    const [paises, focus] = await Promise.all([
      Promise.all(PAISES.map(async (p) => ({ id: p.id, nome: p.nome, itens: await Promise.all(p.defs.map(async (d) => {
        try { return { id: d.id, nome: d.nome, un: d.un, fonte: d.fonte, o: d.o || null, ...resumo(await d.get(), 24) }; }
        catch (e) { return { id: d.id, nome: d.nome, un: d.un, fonte: d.fonte, o: d.o || null, atual: null, anterior: null, periodo: null, serie: [], erro: (e as Error).message }; }
      })) }))),
      focusResumo().catch(() => null),
    ]);
    if (!paises.some((p) => p.itens.some((i: any) => i.atual != null))) throw new Error('Nenhuma fonte de indicadores respondeu agora.');
    const falhas = paises.flatMap((p) => p.itens.filter((i: any) => i.atual == null).map((i: any) => ({ pais: p.nome, nome: i.nome, fonte: i.fonte, erro: i.erro || 'sem dado' })));
    return { gerado: new Date().toISOString(), paises, focus, falhas };
  });
}
/** Focus: medianas mais recentes para o ano atual e o próximo, e como estavam 4 semanas antes. */
async function focusResumo() {
  const ano = new Date().getUTCFullYear();
  const f = `(Indicador eq 'Selic' or Indicador eq 'IPCA' or Indicador eq 'PIB Total' or Indicador eq 'Câmbio') and baseCalculo eq 0 and (DataReferencia eq '${ano}' or DataReferencia eq '${ano + 1}')`;
  const u = `https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=200&$orderby=Data%20desc&$format=json&$select=Indicador,Data,DataReferencia,Mediana&$filter=${encodeURIComponent(f)}`;
  const L: any[] = (await (await pega(u, { Accept: 'application/json' })).json())?.value || [];
  const datas = [...new Set(L.map((x) => x.Data))].sort().reverse(), d0 = datas[0], d4 = datas[4] || datas[datas.length - 1];
  const pega1 = (ind: string, ref: string, d: string) => L.find((x) => x.Indicador === ind && x.DataReferencia === ref && x.Data === d)?.Mediana ?? null;
  return { data: d0, antes: d4, itens: ['IPCA', 'PIB Total', 'Selic', 'Câmbio'].flatMap((ind) => [String(ano), String(ano + 1)].map((ref) => ({ ind, ref, v: pega1(ind, ref, d0), ant: pega1(ind, ref, d4) }))) };
}
async function agenda(dia = '') {
  const jd = janelaDia(dia);
  return cacheado('agenda' + (jd ? '|' + dia : ''), jd ? 30 * 60_000 : 60_000, async () => {
    const de = jd ? jd.de + 'T00:00:00Z' : new Date(Date.now() - 2 * 864e5).toISOString(), ate = jd ? jd.ate + 'T23:59:59Z' : new Date(Date.now() + 8 * 864e5).toISOString();
    let ev: Evento[] = [], fonte = 'TradingView', aviso = '';
    try {
      const j = await (await pega(`https://economic-calendar.tradingview.com/events?from=${de}&to=${ate}&countries=US,BR,EU,DE,GB,JP,CN`, { Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/', Accept: 'application/json' })).json();
      ev = normTV(j); if (!ev.length) throw new Error('vazio');
    } catch {
      const j = await (await pega('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { Accept: 'application/json' })).json();
      ev = normFF(j); fonte = 'Forex Factory'; aviso = 'O calendário com resultados não respondeu: mostrando previsão e anterior (sem o Brasil).';
    }
    return { gerado: new Date().toISOString(), fonte, aviso, itens: ev.map((e) => ({ ...e, sur: surpresa(e) })).sort((a, b) => (a.d < b.d ? -1 : 1)) };
  });
}

// ---------- máquina do tempo e pesquisa de ativos ----------
async function noticiasDia(dia: string, q: string) {
  const jd = janelaDia(dia); if (!jd) throw new Error('Data inválida.');
  const busca = String(q || '').trim().slice(0, 60);
  return cacheado(`ntd|${dia}|${busca.toLowerCase()}`, 6 * 3600_000, async () => {
    const consultas: [string, string, 'pt' | 'en'][] = busca ? [[busca, 'Google Notícias', 'pt']] : [['ibovespa OR dólar OR juros OR bolsa OR Copom', 'Google Notícias', 'pt'], ['site:reuters.com Brasil mercado', 'Reuters (Brasil)', 'pt'], ['stocks OR "Wall Street" OR Fed', 'Google News', 'en']];
    const todos: Noticia[] = [], ok: string[] = [], falha: string[] = [];
    await Promise.all(consultas.map(async ([qq, f, l]) => { try { const n = leRSS(await (await pega(urlGnews(qq, l, jd.q), { Accept: 'application/rss+xml, application/xml, text/xml' })).text(), f).map((x) => { const y = separaFonte(x.t); return { ...x, t: y.t, f: y.f || f }; }); ok.push(f); todos.push(...n); } catch { falha.push(f); } }));
    const vistos = new Set<string>(), itens = todos.filter((n) => n.d.slice(0, 10) >= jd.de && n.d.slice(0, 10) <= jd.ate).sort((a, b) => (a.d < b.d ? 1 : -1)).filter((n) => { const k = n.t.toLowerCase().replace(/\W+/g, '').slice(0, 60); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 80);
    return { dia, gerado: new Date().toISOString(), fonte: 'Arquivo do Google Notícias (manchete e link)', fontes: ok, falharam: falha, itens };
  });
}
async function busca(q: string) {
  const t = String(q || '').trim().toUpperCase().replace(/[^A-Z0-9 .!-]/g, '').slice(0, 30);
  if (t.length < 2) return { q: t, itens: [] };
  return cacheado('busca|' + t, 24 * 3600_000, async () => {
    const r = await pega(`https://symbol-search.tradingview.com/symbol_search/v3/?text=${encodeURIComponent(t)}&hl=0&exchange=&lang=pt&search_type=&domain=production&sort_by_country=BR`, { Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/', Accept: 'application/json' }, 8_000);
    return { q: t, fonte: 'TradingView', itens: leBusca(await r.json()) };
  });
}

// ---------- setores e mapa ----------
async function setores(mk: 'brazil' | 'america') {
  return cacheado('setores|' + mk, 5 * 60_000, async () => {
    const L = await scanQuery(mk, corpoSetores(mk));
    if (!L.length) throw new Error('O screener não respondeu agora.');
    return { mk, em: new Date().toISOString(), fonte: 'TradingView (15 min de atraso), média ponderada pelo valor de mercado', setores: agregaSetores(L) };
  });
}
async function mapaMundo() {
  return cacheado('mapa', 24 * 3600_000, async () => {
    let erro = '';
    for (const u of ['https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json', 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json']) {
      try { return { fonte: 'Natural Earth (world-atlas 110m)', ...topoParaPaths(await (await pega(u, { Accept: 'application/json' }, 15_000)).json()) }; } catch (e) { erro = (e as Error).message; }
    }
    throw new Error('Mapa indisponível: ' + erro);
  });
}

// ---------- notícias ----------
const FEEDS: [string, string][] = [
  ['Money Times', 'https://www.moneytimes.com.br/mercados/feed/'],
  ['Investing.com', 'https://br.investing.com/rss/news.rss'], ['Bloomberg Línea', 'https://www.bloomberglinea.com.br/arc/outboundfeeds/rss/?outputType=xml'],
  ['CNBC', 'https://www.cnbc.com/id/10000664/device/rss/rss.html'], ['MarketWatch', 'https://feeds.content.dowjones.io/public/rss/mw_topstories'],
  ['Federal Reserve', 'https://www.federalreserve.gov/feeds/press_all.xml'],
];
const gnews = async (q: string, lingua: 'pt' | 'en', fonte: string): Promise<Noticia[]> => leRSS(await (await pega(urlGnews(q, lingua), { Accept: 'application/rss+xml, application/xml, text/xml' })).text(), fonte)
  .map((n) => { const x = separaFonte(n.t); return { ...n, t: x.t, f: x.f ? `${x.f}` : fonte }; });
async function noticias(q: string) {
  const busca = String(q || '').trim().slice(0, 80);
  return cacheado('nt|' + busca.toLowerCase(), busca ? 3 * 60_000 : 2 * 60_000, async () => {
    const ok: string[] = [], falha: string[] = [], todos: (Noticia & { ag?: boolean })[] = [];
    const tarefas: [string, () => Promise<Noticia[]>, boolean][] = busca
      ? [[`Google Notícias: ${busca}`, () => gnews(busca, 'pt', 'Google Notícias'), false], [`Google News (EN): ${busca}`, () => gnews(busca, 'en', 'Google News'), false]]
      : [...FEEDS.map(([f, u]) => [f, async () => leRSS(await (await pega(u, { Accept: 'application/rss+xml, application/xml, text/xml' })).text(), f), false] as [string, () => Promise<Noticia[]>, boolean]),
        ...AGENCIAS.map(([f, qq, l]) => [f, () => gnews(qq, l, f), true] as [string, () => Promise<Noticia[]>, boolean]),
        ...FEEDS_GN.map(([f, qq, l]) => [f, async () => (await gnews(qq, l, f)).map((n) => ({ ...n, f })), false] as [string, () => Promise<Noticia[]>, boolean])];
    await Promise.all(tarefas.map(async ([f, fn, ag]) => { try { const n = await fn(); if (n.length) { ok.push(f); todos.push(...n.slice(0, 30).map((x) => ({ ...x, ag }))); } else falha.push(f); } catch { falha.push(f); } }));
    const vistos = new Set<string>(), itens = todos.sort((a, b) => (a.d < b.d ? 1 : -1)).filter((n) => { const k = n.t.toLowerCase().replace(/\W+/g, '').slice(0, 60); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 150);
    if (!itens.length) throw new Error('Nenhuma fonte de notícias respondeu agora.');
    return { gerado: new Date().toISOString(), busca, fontes: ok, falharam: falha, itens };
  });
}

// ---------- juros: Copom e Fed implícitos, Tesouro Direto ----------
async function mercadoCache(id: string, maxAge = 7*86400000): Promise<any> {
 try {
  const url=ENV('SUPABASE_URL'),key=ENV('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)return null;
  const r=await fetch(url+'/rest/v1/mercado_cache?id=eq.'+encodeURIComponent(id)+'&select=payload,fetched_at',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(3000)});
  if(!r.ok)return null;const item=(await r.json())[0];return item&&Date.now()-Date.parse(item.fetched_at)<maxAge?item:null;
 }catch{return null}
}
async function copomRes() {
 return cacheado('copom',60000,async()=>{
  const hoje=new Date();hoje.setUTCHours(12,0,0,0);const vs=di1Mensais(hoje,18),avisos:string[]=[];
  const result=await Promise.allSettled([scanSimbolos(vs.map(v=>v.tk),['close','change_abs','update_time']),sgs(4389,5),sgs(432,5)]);
  let L=result[0].status==='fulfilled'?result[0].value:[],cdiS=result[1].status==='fulfilled'?result[1].value:[],selS=result[2].status==='fulfilled'?result[2].value:[];
  if(!L.some(x=>typeof x.close==='number'&&x.close>0)){const cached=await mercadoCache('di');if(cached){L=lerScan(cached.payload,['close','change_abs','update_time']);avisos.push('Curva da última coleta disponível no servidor: '+cached.fetched_at)}}
  if(!cdiS.length){const v=await mercadoCache('cdi');if(v){cdiS=leSGS(v.payload);avisos.push('CDI da última coleta disponível: '+v.fetched_at)}}
  if(!selS.length){const v=await mercadoCache('selic');if(v){selS=leSGS(v.payload);avisos.push('Selic da última coleta disponível: '+v.fetched_at)}}
  if(!cdiS.length){let diario:any[]=[];try{diario=await sgs(12,5)}catch{}if(!diario.length){const v=await mercadoCache('cdi_diario');if(v)diario=leSGS(v.payload)}if(diario.length){cdiS=diario.filter(x=>Number.isFinite(x[1])&&x[1]>=0).map(x=>[x[0],(Math.pow(1+x[1]/100,252)-1)*100]);avisos.push('CDI anualizado a partir do CDI diário oficial (SGS 12, base 252 dias úteis).')}}
  const por=new Map(L.map(x=>[x.s,x]));const di=vs.map(v=>({venc:v.venc,cod:v.cod,taxa:por.get(v.tk)?.close,ts:por.get(v.tk)?.update_time,var_pb:typeof por.get(v.tk)?.change_abs==='number'?Math.round(por.get(v.tk)!.change_abs*100):null})).filter(x=>typeof x.taxa==='number'&&Number.isFinite(x.taxa)&&x.taxa>0);
  const cdi=cdiS.at(-1)?.[1]??null,selic=selS.at(-1)?.[1]??null;
  if(!di.length)avisos.push('Curva DI1 indisponível. Sem curva, não são calculados cenários implícitos.');
  if(!(cdi&&cdi>0))avisos.push('CDI não disponível. Não foi substituído por uma taxa estimada.');
  if(!(selic&&selic>0))avisos.push('Selic não disponível. Não foi substituída por uma taxa estimada.');
  return {em:new Date().toISOString(),cdi,selic,cdi_ref:cdiS.at(-1)?.[0]||null,selic_ref:selS.at(-1)?.[0]||null,parcial:!di.length||!(cdi&&selic),avisos,curva:di.map(x=>({cod:x.cod,venc:x.venc.toISOString().slice(0,10),taxa:x.taxa,var_pb:x.var_pb,horarioPreco:typeof x.ts==='number'?new Date(x.ts*1000).toISOString():null})),reunioes:di.length&&cdi&&selic?copomImplicito(hoje,cdi,selic,di):[],calendario:COPOM.map(r=>r[1]),fonte:'DI1 (TradingView, com atraso) e CDI/Selic (Banco Central); horários individuais da fonte'};
 });
}
async function fed() {
  return cacheado('fed', 5 * 60_000, async () => {
    const hoje = new Date(); hoje.setUTCHours(12, 0, 0, 0);
    const zs = zqSimbolos(hoje, 10);
    const [L, ef, tu, tl] = await Promise.all([scanSimbolos(zs.map((z) => z.tk), ['close']), fred('EFFR'), fred('DFEDTARU'), fred('DFEDTARL')]);
    const por = new Map(L.map((x) => [x.s, x.close]));
    const zq = zs.map((z) => ({ ano: z.ano, mes: z.mes, px: por.get(z.tk) ?? NaN })).filter((z) => isFinite(z.px));
    const efetiva = ef.length ? ef[ef.length - 1][1] : NaN, teto = tu.length ? tu[tu.length - 1][1] : NaN, piso = tl.length ? tl[tl.length - 1][1] : NaN;
    if (!zq.length || !isFinite(efetiva)) throw new Error('Sem os futuros de fed funds agora.');
    return { em: new Date().toISOString(), efetiva, faixa: [piso, teto], reunioes: fedImplicito(hoje, efetiva, teto, zq), calendario: FOMC, fonte: 'Futuros de fed funds (TradingView) e taxa efetiva (FRED)' };
  });
}
/** Preços e taxas do Tesouro Direto: arquivo diário do Tesouro Transparente (fechamento do último dia útil), guardado por 3 h. */
async function tesouroCsv() {
  const r = await cacheado('td-csv', 3 * 3600_000, async () => {
    const txt = await (await pega('https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv', { Accept: 'text/csv,*/*' }, 25_000)).text();
    const v = leTesouroCsv(txt); if (!v.itens.length) throw new Error('arquivo do Tesouro sem títulos'); return v;
  });
  return r.itens.map((x: any) => ({ ...x, data_base: r.data }));
}
/** Séries diárias de 10 anos (base + até 12 ações pedidas), Selic diária e volatilidade por hora do Ibovespa. Cache de 6 h. */
async function hist(extra: string[]) {
  const ex = [...new Set(extra.map((t) => String(t).toUpperCase().replace(/[^A-Z0-9]/g, '')).filter((t) => /^[A-Z]{4}\d{1,2}$/.test(t) && !HIST_BASE.some((b) => b[0] === t)))].slice(0, 12);
  const lista: [string, string, string][] = HIST_BASE.concat(ex.map((t) => [t, t + '.SA', t] as [string, string, string]));
  const Y = (sym: string, q: string) => pega(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?${q}`, { 'User-Agent': UA, Accept: 'application/json' }, 15_000).then((r) => r.json());
  const series: Record<string, any> = {}, falhas: string[] = [];
  await Promise.all(lista.map(async ([k, sym, n]) => { try { const v = await cacheado('hist|' + sym, 6 * 3600_000, async () => leSerieY(await Y(sym, 'range=10y&interval=1d'))); if (v.c.length > 50) series[k] = { n, ...v }; else falhas.push(n); } catch { falhas.push(n); } }));
  let selic: any = null, horas: any = null;
  try { selic = await cacheado('hist|selic', 12 * 3600_000, async () => { const de = new Date(Date.now() - 3600 * 864e5), f = (x: Date) => `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`; const L = leSGS(await (await pega(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${f(de)}&dataFinal=${f(new Date())}`, { Accept: 'application/json' }, 15_000)).json()); return { d: L.map((x) => x[0]), v: L.map((x) => x[1]) }; }); } catch { falhas.push('Selic'); }
  try { horas = await cacheado('hist|horas', 6 * 3600_000, async () => ({ ibov: volHora(await Y('^BVSP', 'range=60d&interval=60m')), dolar: volHora(await Y('BRL=X', 'range=60d&interval=60m')) })); } catch { falhas.push('volatilidade por hora'); }
  return { gerado: new Date().toISOString(), fonte: 'Yahoo Finance (fechamentos diários, até 10 anos) e Banco Central (Selic, SGS 432)', series, selic, horas, falhas };
}
/** Varredura: testa agora (sem cache) cada fonte externa que o app usa e diz quais painéis dependem dela. */
async function varredura() {
  const hoje = new Date(), d2 = new Date(Date.now() - 730 * 864e5), iso = hoje.toISOString().slice(0, 10);
  const TVX = { Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' };
  const txt = async (u: string, h: Record<string, string> = {}, ms = 15_000) => (await pega(u, h, ms)).text();
  type P = [string, string, string[], () => Promise<string | number>];
  const P: P[] = [
    ['sgs', 'Banco Central SGS (últimos dados)', ['ECST', 'WMAP', 'WIRP', 'CENB', 'Copom'], async () => leSGS(JSON.parse(await txt(sgsUrl(432, '/ultimos/1?formato=json')))).length],
    ['sgs_per', 'Banco Central SGS (séries por período)', ['ECST', 'WMAP', 'HIST'], async () => leSGS(JSON.parse(await txt(sgsUrl(13522, `?formato=json&dataInicial=${dmy(d2)}&dataFinal=${dmy(hoje)}`)))).length],
    ['focus', 'Banco Central Focus (projeções)', ['ECFC', 'ECST'], async () => (JSON.parse(await txt("https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=1&$format=json", { Accept: 'application/json' })).value || []).length],
    ['fred', 'FRED (indicadores dos EUA)', ['ECST', 'WMAP', 'WIRP', 'CENB'], async () => leFRED(await fredVez(() => txt(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL&cosd=${anosAtras(1)}`, {}, 20_000))).length],
    ['bis', 'BIS (juros e inflação: Europa, Reino Unido, Japão, China)', ['ECST', 'WMAP', 'CENB'], async () => (await txt('https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/M.GB?lastNObservations=1&format=csv')).split('\n').length - 1],
    ['oecd', 'OCDE (PIB e desemprego)', ['ECST', 'WMAP'], async () => (await txt('https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0/USA..._Z.Y._T.Y_GE15..M?lastNObservations=1&dimensionAtObservation=AllDimensions&format=jsondata', { Accept: 'application/json' }, 20_000)).length],
    ['eurostat', 'Eurostat (zona do euro)', ['ECST', 'WMAP'], async () => (await txt('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m?geo=EA20&s_adj=SA&age=TOTAL&sex=T&unit=PC_ACT&lastTimePeriod=1', { Accept: 'application/json' })).length],
    ['tv', 'TradingView (cotações, DI, setores, filtros)', ['MON', 'WEI', 'FX', 'GC', 'WIRP', 'SETORES', 'EQS', 'TOP'], async () => (await scanSimbolos(['BMFBOVESPA:IBOV'], ['close'])).length],
    ['tv_cal', 'TradingView (agenda econômica)', ['ECO', 'AGENDA', 'EVT'], async () => normTV(JSON.parse(await txt(`https://economic-calendar.tradingview.com/events?from=${iso}T00:00:00Z&to=${iso}T23:59:59Z&countries=US,BR`, { ...TVX, Accept: 'application/json' }))).length],
    ['tv_busca', 'TradingView (busca de ativos)', ['busca'], async () => (await txt('https://symbol-search.tradingview.com/symbol_search/v3/?text=PETR4&hl=0&exchange=&lang=pt&search_type=&domain=production&sort_by_country=BR', TVX)).length],
    ['ff', 'Forex Factory (agenda reserva)', ['ECO'], async () => (await txt('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { Accept: 'application/json' })).length],
    ['yahoo', 'Yahoo Finance (histórico e gráficos)', ['HIST', 'REL', 'CEN', 'G'], async () => leSerieY(JSON.parse(await txt('https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?range=5d&interval=1d', { Accept: 'application/json' }))).c.length],
    ['yahoo_fund', 'Yahoo Finance (analistas, resultados, balanços)', ['DES', 'FA', 'ANR', 'EE', 'PESQ'], async () => { const v = await ySummary('PETR4.SA'); if (!v) throw new Error('sem dados'); return 1; }],
    ['gnews', 'Google Notícias (InfoMoney, Banco Central, agências)', ['NEWS', 'N', 'FIRST', 'TOP'], async () => leRSS(await txt(urlGnews('Ibovespa', 'pt'), { Accept: 'application/rss+xml, application/xml, text/xml' }), 'G').length],
    ...FEEDS.map(([n, u]) => ['rss_' + n.toLowerCase().replace(/\W+/g, ''), 'RSS ' + n, ['NEWS', 'TOP'], async () => leRSS(await txt(u, { Accept: 'application/rss+xml, application/xml, text/xml' }), n).length] as P),
    ['tesouro', 'Tesouro Transparente (Tesouro Direto)', ['TD', 'YAS'], async () => (await txt('https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv', { Range: 'bytes=0-2000', Accept: 'text/csv,*/*' }, 20_000)).length],
    ['atlas', 'Mapa do mundo (world-atlas)', ['WMAP'], async () => (await txt('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json', { Accept: 'application/json' })).length],
  ];
  if (BRAPI) P.push(['brapi', 'brapi (cotações reserva)', ['MON', 'Q'], async () => JSON.stringify(leBrapi(JSON.parse(await txt(`https://brapi.dev/api/quote/PETR4?token=${encodeURIComponent(BRAPI)}`, { Accept: 'application/json' })))).length]);
  if (TWELVE) P.push(['twelve', 'Twelve Data (cotações reserva)', ['MON', 'Q'], async () => JSON.stringify(leTwelve(JSON.parse(await txt(`https://api.twelvedata.com/quote?symbol=AAPL&apikey=${encodeURIComponent(TWELVE)}`, { Accept: 'application/json' })))).length]);
  const itens = await Promise.all(P.map(async ([id, nome, usado, fn]) => {
    const t0 = Date.now();
    try { const n = await fn(); const ok = typeof n === 'number' ? n > 0 : !!n; return { id, nome, usado, ok, ms: Date.now() - t0, erro: ok ? null : 'respondeu vazio' }; }
    catch (e) { return { id, nome, usado, ok: false, ms: Date.now() - t0, erro: String((e as Error).message || e).slice(0, 140) }; }
  }));
  return { em: new Date().toISOString(), itens, chaves: { brapi: !!BRAPI, twelve: !!TWELVE } };
}
/** (v279) histórico diário dos ativos da carteira (símbolos do Yahoo) e CDI diário, para rentabilidade, drawdown e comparação com índices. */
async function histp(y: unknown, desde: string) {
  const L = (Array.isArray(y) ? y : []).filter((x: any) => Array.isArray(x) && /^[A-Z0-9 .\-]{1,24}$/i.test(String(x[0])) && /^[A-Z0-9.^=\-]{1,20}$/i.test(String(x[1]))).slice(0, 30) as [string, string][];
  const dias = Math.max(30, Math.min(3650, (Date.now() - Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(desde) ? desde : '')) / 864e5 || 365));
  const range = dias <= 360 ? '1y' : dias <= 720 ? '2y' : dias <= 1800 ? '5y' : '10y';
  const series: Record<string, any> = {}, falhas: string[] = [];
  await Promise.all(L.map(async ([k, sym]) => {
    try { const v = await cacheado(`hp|${sym}|${range}`, 6 * 3600_000, async () => leSerieY(await (await pega(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d`, { Accept: 'application/json' }, 15_000)).json())); if (v.c.length) series[k] = { sym, ...v }; else falhas.push(k); }
    catch { falhas.push(k); }
  }));
  let cdi: any = null;
  try { cdi = await cacheado(`hp|cdi|${range}`, 12 * 3600_000, async () => { const L2 = leSGS(await (await pega(sgsUrl(12, `?formato=json&dataInicial=${dmy(new Date(Date.now() - Math.min(dias + 10, 3600) * 864e5))}&dataFinal=${dmy(new Date())}`), { Accept: 'application/json' }, 20_000)).json()); return { d: L2.map((x) => x[0]), v: L2.map((x) => x[1]) }; }); } catch { falhas.push('CDI'); }
  return { gerado: new Date().toISOString(), range, series, cdi, falhas, fonte: 'Yahoo Finance (fechamentos diários) e Banco Central (CDI, SGS 12)' };
}
async function titulos() {
  return cacheado('titulos', 5 * 60_000, async () => {
    const [td, curvas] = await Promise.allSettled([
      tesouroCsv(),
      mundo('jur'),
    ]);
    return { em: new Date().toISOString(), tesouro: td.status === 'fulfilled' ? td.value : [], tesouro_erro: td.status === 'rejected' ? String((td.reason as Error)?.message || td.reason) : null, curvas: curvas.status === 'fulfilled' ? curvas.value : null };
  });
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'terminal', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 60)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  let b: any = {}; try { b = await req.json(); } catch { /* vazio */ }
  try {
    switch (b.acao) {
      case 'cot': return out(await cot((Array.isArray(b.s) ? b.s : []).map((x: unknown) => String(x).slice(0, 30))));
      case 'mundo': return out(await mundo(String(b.g || 'wei')));
      case 'most': return out(await most(b.mk === 'america' ? 'america' : 'brazil', ['alta', 'baixa'].includes(b.ord) ? b.ord : 'vol'));
      case 'fund': return out(await fund(String(b.tk || '')));
      case 'eqs': return out(await eqs(b.mk === 'america' ? 'america' : 'brazil', b.f || {}));
      case 'macro': return out(await macro());
      case 'agenda': return out(await agenda(String(b.dia || '')));
      case 'noticias': return out(b.dia ? await noticiasDia(String(b.dia), String(b.q || '')) : await noticias(String(b.q || '')));
      case 'busca': return out(await busca(String(b.q || '')));
      case 'hist': return out(await hist(Array.isArray(b.extra) ? b.extra : []));
      case 'valida': return out(await valida((Array.isArray(b.s) ? b.s : []).map((x: unknown) => String(x).slice(0, 30))));
      case 'copom': return out(await copomRes());
      case 'fed': return out(await fed());
      case 'titulos': return out(await titulos());
      case 'varredura': return out(await varredura());
      case 'histp': return out(await histp(b.y, String(b.desde || '')));
      case 'setores': return out(await setores(b.mk === 'america' ? 'america' : 'brazil'));
      case 'mapa': return out(await mapaMundo());
      default: return out({ error: 'Ação desconhecida.' }, 400);
    }
  } catch (e) { return out({ error: (e as Error).message }, 502); }
});


