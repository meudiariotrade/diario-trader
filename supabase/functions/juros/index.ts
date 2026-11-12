// Função JUROS — arquivo único para colar no editor do Supabase (Edge Functions → juros → index.ts)

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
export const VERSAO_FN = 'v125';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/juros/index.ts
// Painel de juros e cotações para a aba Mercado e a aba Juros e DI.
//
// Banco Central (SGS, API pública, sem chave). O BC limita "últimos N" a 20 registros, então a Selic meta
// é lida por janela de datas (3 anos) para saber desde quando está no nível atual.
//   432 = Selic meta   1178 = Selic over (ano)   4389 = CDI (ano)   13522 = IPCA 12 meses   433 = IPCA do mês   1 = dólar PTAX (venda)
// Focus (API Olinda do BC): medianas de Selic e IPCA para o ano e o seguinte, IPCA 12 meses à frente e a
//   expectativa para a próxima reunião do Copom.
// TradingView (scanner público, cotação com ~15 min de atraso, sem login): curva de DI futuro da B3,
//   minério (SGX FEF; se não vier, COMEX TIO, o mesmo minério 62% Fe), petróleo e Treasuries.
//   É um serviço não oficial do TradingView: se mudar, o app volta a mostrar o quadro do TradingView.
//
// Deploy (sem verificação de JWT, igual às outras funções):
//   supabase functions deploy juros --no-verify-jwt


const SGS = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';
const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const TTL_BC = 60 * 60 * 1000, TTL_FOCUS = 3 * 60 * 60 * 1000, TTL_TV = 3 * 60 * 1000;

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    Vary: 'Origin',
  };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*';
  else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};

// ---------- Banco Central ----------
type Raw = { data: string; valor: string };
async function sgs(n: number, q: string) {
  const r = await fetch(`${SGS}${n}/dados${q}${q.includes('?') ? '&' : '?'}formato=json`, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`BCB ${n}: ${r.status}`);
  const j = (await r.json()) as Raw[];
  const out = (Array.isArray(j) ? j : []).map((p) => ({ d: p.data, v: parseFloat(p.valor) })).filter((p) => isFinite(p.v));
  if (!out.length) throw new Error(`BCB ${n}: sem dados`);
  return out;
}
const ultimos = (n: number, k: number) => sgs(n, `/ultimos/${Math.min(20, k)}`);

let cBC: { ts: number; o: Record<string, unknown> } | null = null;
async function bancoCentral(hoje: Date) {
  if (cBC && Date.now() - cBC.ts < TTL_BC) return cBC.o;
  const jn = janela(hoje, 3);
  const [sel, over, cdi, ipca12, ipcaMes, ptax] = await Promise.allSettled([
    sgs(432, `?dataInicial=${jn.ini}&dataFinal=${jn.fim}`).catch(() => ultimos(432, 20)), // janela de datas; se falhar, ao menos o valor atual
    ultimos(1178, 1), ultimos(4389, 1), ultimos(13522, 1), ultimos(433, 12), ultimos(1, 1),
  ]);
  const o: Record<string, unknown> = {};
  if (sel.status === 'fulfilled') o.selic = selicInfo(sel.value);
  if (over.status === 'fulfilled') o.over = over.value.at(-1);
  if (cdi.status === 'fulfilled') o.cdi = cdi.value.at(-1);
  if (ipca12.status === 'fulfilled') o.ipca12 = ipca12.value.at(-1);
  if (ipcaMes.status === 'fulfilled') o.ipcaMes = { ...ipcaMes.value.at(-1)!, hist: ipcaMes.value.map((p) => ({ m: p.d.slice(3), v: p.v })) };
  if (ptax.status === 'fulfilled') o.ptax = ptax.value.at(-1);
  const erros = [sel, over, cdi, ipca12, ipcaMes, ptax].filter((x) => x.status === 'rejected').map((x) => String((x as PromiseRejectedResult).reason?.message || x));
  if (erros.length) o.erros_bc = erros;
  if (!o.selic && !o.cdi && !o.ipca12) throw new Error('Não consegui ler o Banco Central agora.');
  cBC = { ts: Date.now(), o };
  return o;
}

// ---------- Focus ----------
let cFocus: { ts: number; o: unknown } | null = null;
async function olinda(recurso: string, filtro: string, select: string, top: number) {
  const url = `${OLINDA}${recurso}?$top=${top}&$filter=${encodeURIComponent(filtro)}&$orderby=${encodeURIComponent('Data desc')}&$select=${select}&$format=json`;
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error('Focus ' + r.status);
  return ((await r.json())?.value || []) as any[];
}
async function focus(hoje: Date) {
  if (cFocus && Date.now() - cFocus.ts < TTL_FOCUS) return cFocus.o;
  const y = hoje.getUTCFullYear(), hj = iso(hoje);
  const [an, i12, reu] = await Promise.allSettled([
    olinda('ExpectativasMercadoAnuais', `(Indicador eq 'Selic' or Indicador eq 'IPCA' or Indicador eq 'PIB Total' or Indicador eq 'Câmbio') and baseCalculo eq 0`, 'Indicador,Data,DataReferencia,Mediana', 600),
    olinda('ExpectativasMercadoInflacao12Meses', `Indicador eq 'IPCA' and Suavizada eq 'S' and baseCalculo eq 0`, 'Indicador,Data,Mediana', 1),
    olinda('ExpectativasMercadoSelic', `baseCalculo eq 0`, 'Indicador,Data,Reuniao,Mediana', 30),
  ]);
  const o: Record<string, unknown> = {};
  if (an.status === 'fulfilled') Object.assign(o, focusAnual(an.value, y) || {});
  if (i12.status === 'fulfilled' && i12.value[0]) o.ipca12m = { v: i12.value[0].Mediana, data: i12.value[0].Data };
  if (reu.status === 'fulfilled') o.reuniao = focusReuniao(reu.value, hj);
  if (!Object.keys(o).length) throw new Error('Focus indisponível');
  cFocus = { ts: Date.now(), o };
  return o;
}

// ---------- TradingView ----------
const MERCADOS = ['futures', 'cfd', 'bond', 'global'];
let cTV: { ts: number; m: Map<string, Cot> } | null = null;
async function scanner(tickers: string[]): Promise<Map<string, Cot>> {
  if (cTV && Date.now() - cTV.ts < TTL_TV) return cTV.m;
  const body = JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: COLUNAS });
  const rs = await Promise.allSettled(MERCADOS.map(async (mk) => {
    const r = await fetch(`https://scanner.tradingview.com/${mk}/scan`, {
      method: 'POST', body, signal: AbortSignal.timeout(12_000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/', 'User-Agent': UA },
    });
    if (!r.ok) throw new Error(mk + ' ' + r.status);
    return leScanner(await r.json());
  }));
  const m = new Map<string, Cot>();
  for (const r of rs) if (r.status === 'fulfilled') for (const [k, v] of r.value) if (!m.has(k)) m.set(k, v);
  if (!m.size) { if (cTV) return cTV.m; throw new Error('TradingView não respondeu'); }
  cTV = { ts: Date.now(), m };
  return m;
}

async function carrega() {
  const hoje = new Date(), hj = iso(hoje);
  const vs = vertices(hoje), mi = minerio(hoje);
  const outros = { wti: ['TVC:USOIL', 'NYMEX:CL1!'], brent: ['TVC:UKOIL', 'ICEEUR:BRN1!'], fef1: mi.fef1, fef2: mi.fef2, dce: ['DCE:I1!'], ust2: ['TVC:US02Y'], ust10: ['TVC:US10Y'], ust30: ['TVC:US30Y'], dxy: ['TVC:DXY'] };
  const tickers = [...vs.map((v) => v.tk), 'BMFBOVESPA:DI11!', ...Object.values(outros).flat()];
  const [bc, fo, tv] = await Promise.allSettled([bancoCentral(hoje), focus(hoje), scanner(tickers)]);
  const o: Record<string, unknown> = { fonte: 'Banco Central do Brasil (SGS e Focus) e TradingView', gerado: hoje.toISOString() };
  if (bc.status === 'fulfilled') Object.assign(o, bc.value); else o.erro_bc = String(bc.reason?.message || bc.reason);
  if (fo.status === 'fulfilled') o.focus = fo.value;
  o.copom = copom(hj);
  const s = o.selic as { v: number } | undefined, i12 = o.ipca12 as { v: number } | undefined, cdi = o.cdi as { v: number } | undefined;
  if (s && i12) o.real = juroReal(s.v, i12.v);
  if (tv.status === 'fulfilled') {
    const m = tv.value;
    const curva = montaCurva(m, vs, hoje);
    o.curva = curva;
    o.curva_info = leitura(curva, cdi ? cdi.v : null);
    const ci = o.curva_info as { taxa_1a: number | null } | null;
    const f = o.focus as { ipca12m?: { v: number } } | undefined;
    if (ci && ci.taxa_1a != null && f && f.ipca12m) o.real_exante = { v: juroReal(ci.taxa_1a, f.ipca12m.v), taxa_1a: ci.taxa_1a, ipca_esp: f.ipca12m.v };
    const cot: Record<string, unknown> = {};
    for (const [k, alts] of Object.entries(outros)) { const c = primeira(m, alts); if (c) cot[k] = c; }
    o.cot = cot;
    o.tv = { ok: true, simbolos: m.size };
  } else o.tv = { ok: false, erro: String(tv.reason?.message || tv.reason) };
  return o;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'juros', cors); if (vr) return vr; }
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 30)) return out({ error: 'Muitas consultas seguidas. Espere um minuto.' }, 429);
  try { return out(await carrega()); } catch (e) { return out({ error: (e as Error).message }, 502); }
});
