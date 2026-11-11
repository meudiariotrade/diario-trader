// Função RADAR — arquivo único para colar no editor do Supabase (Edge Functions → radar → index.ts)

// ===== indicadores =====
// supabase/functions/radar/indicadores.ts (cópia de analise/indicadores.ts: cada função publica sozinha)
// Indicadores técnicos calculados SEMPRE pelo código (nunca pela IA). Funções puras, sem rede e sem Deno.*,
// para poderem ser testadas com `node --test` ou `deno test`. A IA só recebe estes números e os interpreta.

export type Candle = [string, number, number, number, number, number]; // data, open, high, low, close, volume

export const r2 = (x: number | null | undefined, d = 2): number | null =>
  x == null || !isFinite(x) ? null : +x.toFixed(d);

// ---------- médias ----------
export function sma(a: number[], n: number): number | null {
  if (!(n >= 1) || a.length < n) return null;
  let s = 0;
  for (let i = a.length - n; i < a.length; i++) s += a[i];
  return s / n;
}

/** Média exponencial: semente = SMA dos n primeiros valores; depois k = 2/(n+1). */
export function ema(a: number[], n: number): number | null {
  if (!(n >= 1) || a.length < n) return null;
  let e = a.slice(0, n).reduce((s, x) => s + x, 0) / n;
  const k = 2 / (n + 1);
  for (let i = n; i < a.length; i++) e = a[i] * k + e * (1 - k);
  return e;
}

// ---------- RSI (Wilder) ----------
export function rsi(c: number[], n = 14): number | null {
  if (c.length < n + 1) return null;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) {
    const d = c[i] - c[i - 1];
    if (d >= 0) g += d; else l -= d;
  }
  g /= n; l /= n;
  for (let i = n + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    g = (g * (n - 1) + Math.max(d, 0)) / n;
    l = (l * (n - 1) + Math.max(-d, 0)) / n;
  }
  if (g === 0 && l === 0) return 50; // preço parado: sem força para nenhum lado
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / l);
}

export function rsiZona(v: number | null): 'sobrecomprado' | 'sobrevendido' | 'neutro' | null {
  if (v == null) return null;
  return v >= 70 ? 'sobrecomprado' : v <= 30 ? 'sobrevendido' : 'neutro';
}

// ---------- ATR (Wilder) ----------
export function trueRanges(cs: Candle[]): number[] {
  const tr: number[] = [];
  for (let i = 1; i < cs.length; i++) {
    const h = cs[i][2], l = cs[i][3], pc = cs[i - 1][4];
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  return tr;
}
export function atr(cs: Candle[], n = 14): number | null {
  if (cs.length < n + 1) return null;
  const tr = trueRanges(cs);
  let a = tr.slice(0, n).reduce((s, x) => s + x, 0) / n;
  for (let i = n; i < tr.length; i++) a = (a * (n - 1) + tr[i]) / n;
  return a;
}

// ---------- volume ----------
export function obvSerie(cs: Candle[]): number[] {
  let o = 0;
  const s = [0];
  for (let i = 1; i < cs.length; i++) {
    o += cs[i][4] > cs[i - 1][4] ? cs[i][5] : cs[i][4] < cs[i - 1][4] ? -cs[i][5] : 0;
    s.push(o);
  }
  return s;
}
export function obvTendencia(cs: Candle[], janela = 20): 'subindo' | 'caindo' | 'lateral' | null {
  const s = obvSerie(cs);
  if (s.length < janela + 2) return null;
  const a = s[s.length - 1], b = s[s.length - 1 - janela];
  return a > b ? 'subindo' : a < b ? 'caindo' : 'lateral';
}
/** Volume do último candle contra a média dos n candles anteriores (o último não entra na média). */
export function volumeStats(cs: Candle[], n = 20) {
  if (cs.length < n + 1) return { ultimo: cs.length ? cs[cs.length - 1][5] : null, media: null, relativo: null, classe: null as null | string };
  const v = cs.map((x) => x[5]);
  const ultimo = v[v.length - 1];
  const media = v.slice(-n - 1, -1).reduce((s, x) => s + x, 0) / n;
  const relativo = media > 0 ? ultimo / media : null;
  const classe = relativo == null ? null : relativo >= 1.5 ? 'muito acima da média' : relativo >= 1.1 ? 'acima da média' : relativo <= 0.7 ? 'abaixo da média' : 'na média';
  return { ultimo, media, relativo, classe };
}

// ---------- pivôs ----------
export function pivos(H: number, L: number, C: number) {
  const P = (H + L + C) / 3, r = H - L, f = (x: number) => +x.toFixed(4);
  return {
    classico: { R3: f(H + 2 * (P - L)), R2: f(P + r), R1: f(2 * P - L), P: f(P), S1: f(2 * P - H), S2: f(P - r), S3: f(L - 2 * (H - P)) },
    fibonacci: { R3: f(P + r), R2: f(P + 0.618 * r), R1: f(P + 0.382 * r), P: f(P), S1: f(P - 0.382 * r), S2: f(P - 0.618 * r), S3: f(P - r) },
    camarilla: {
      R4: f(C + (r * 1.1) / 2), R3: f(C + (r * 1.1) / 4), R2: f(C + (r * 1.1) / 6), R1: f(C + (r * 1.1) / 12),
      S1: f(C - (r * 1.1) / 12), S2: f(C - (r * 1.1) / 6), S3: f(C - (r * 1.1) / 4), S4: f(C - (r * 1.1) / 2),
    },
  };
}
export const segunda = (d: string): string => {
  const x = new Date(d + 'T00:00:00Z');
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
};
/** Pivôs do último pregão completo (antes de `hojeStr`) e da última semana completa. */
export function pivosDS(cs: Candle[], hojeStr: string) {
  const comp = cs.filter((c) => c[0] < hojeStr);
  const d = comp[comp.length - 1];
  const diario = d ? { base: d[0], ...pivos(d[2], d[3], d[4]) } : null;
  const sem = segunda(hojeStr), w: Record<string, Candle[]> = {};
  comp.filter((c) => segunda(c[0]) < sem).forEach((c) => (w[segunda(c[0])] ||= []).push(c));
  const ks = Object.keys(w).sort(), k = ks[ks.length - 1];
  const semanal = k
    ? { base: 'semana de ' + k, ...pivos(Math.max(...w[k].map((c) => c[2])), Math.min(...w[k].map((c) => c[3])), w[k][w[k].length - 1][4]) }
    : null;
  return { diario, semanal };
}

// ---------- indicadores consolidados ----------
export function tendencia(preco: number, s20: number | null, s50: number | null, s200: number | null) {
  const lado = (a: number | null, b: number | null) => (a == null || b == null ? 'sem dado' : a > b ? 'alta' : a < b ? 'baixa' : 'lateral');
  return {
    curto_prazo: lado(preco, s20), // preço x SMA20
    medio_prazo: lado(s20, s50), // SMA20 x SMA50
    longo_prazo: lado(preco, s200), // preço x SMA200
  };
}

export function indicadores(cs: Candle[], preco: number, hojeStr = '') {
  const c = cs.map((x) => x[4]);
  const n = c.length;
  const s20 = sma(c, 20), s50 = sma(c, 50), s200 = sma(c, 200), a = atr(cs, 14), rs = rsi(c, 14);
  const vol = volumeStats(cs, 20);
  const ano = cs.slice(-252);
  return {
    var_1d_pct: n > 1 ? r2((c[n - 1] / c[n - 2] - 1) * 100) : null,
    rsi14: r2(rs, 1),
    rsi_zona: rsiZona(rs),
    sma9: r2(sma(c, 9), 4), sma20: r2(s20, 4), sma50: r2(s50, 4), sma200: r2(s200, 4),
    ema9: r2(ema(c, 9), 4), ema21: r2(ema(c, 21), 4),
    dist_sma20_pct: s20 ? r2((preco / s20 - 1) * 100) : null,
    dist_sma50_pct: s50 ? r2((preco / s50 - 1) * 100) : null,
    dist_sma200_pct: s200 ? r2((preco / s200 - 1) * 100) : null,
    tendencia: tendencia(preco, s20, s50, s200),
    atr14: r2(a, 4), atr14_pct: a ? r2((a / preco) * 100) : null,
    volume_vs_media20: r2(vol.relativo),
    volume_classe: vol.classe,
    volume_media20: vol.media == null ? null : Math.round(vol.media),
    volume_ultimo: vol.ultimo,
    volume_ultimo_candle_data: n ? cs[n - 1][0] : null,
    volume_pode_estar_parcial: !!hojeStr && n > 0 && cs[n - 1][0] >= hojeStr,
    obv_tendencia_20d: obvTendencia(cs, 20),
    max_52s: ano.length ? Math.max(...ano.map((x) => x[2])) : null,
    min_52s: ano.length ? Math.min(...ano.map((x) => x[3])) : null,
    janela_52s_candles: ano.length,
  };
}

// ---------- níveis, confluências e plano ----------
export type Nivel = { rotulo: string; valor: number; tipo: 'pivo' | 'media' | 'extremo'; dist_pct: number; dist_atr: number | null };

export function niveis(preco: number, ind: ReturnType<typeof indicadores>, pv: ReturnType<typeof pivosDS>, a: number | null): Nivel[] {
  const out: Nivel[] = [];
  const add = (rotulo: string, valor: number | null | undefined, tipo: Nivel['tipo']) => {
    if (valor == null || !isFinite(valor) || valor <= 0) return;
    out.push({ rotulo, valor: +valor.toFixed(4), tipo, dist_pct: +(((valor - preco) / preco) * 100).toFixed(2), dist_atr: a ? +((valor - preco) / a).toFixed(2) : null });
  };
  const bloco = (nome: string, p: any) => {
    if (!p) return;
    for (const k of ['R3', 'R2', 'R1', 'P', 'S1', 'S2', 'S3']) add(`${nome} clássico ${k}`, p.classico[k], 'pivo');
    for (const k of ['R2', 'R1', 'S1', 'S2']) add(`${nome} fibonacci ${k}`, p.fibonacci[k], 'pivo');
    for (const k of ['R4', 'R3', 'S3', 'S4']) add(`${nome} camarilla ${k}`, p.camarilla[k], 'pivo');
  };
  bloco('pivô diário', pv.diario);
  bloco('pivô semanal', pv.semanal);
  add('SMA20', ind.sma20, 'media'); add('SMA50', ind.sma50, 'media'); add('SMA200', ind.sma200, 'media');
  add('máxima 52s', ind.max_52s, 'extremo'); add('mínima 52s', ind.min_52s, 'extremo');
  return out.sort((x, y) => x.valor - y.valor);
}

/** Os n níveis mais próximos acima e abaixo do preço. */
export function proximos(ns: Nivel[], n = 4) {
  const acima = ns.filter((x) => x.dist_pct > 0).sort((a, b) => a.dist_pct - b.dist_pct).slice(0, n);
  const abaixo = ns.filter((x) => x.dist_pct < 0).sort((a, b) => b.dist_pct - a.dist_pct).slice(0, n);
  return { acima, abaixo };
}

/** Agrupa níveis a menos de `tol` de distância (confluências). Só devolve grupos com 2+ métodos diferentes. */
export function confluencias(ns: Nivel[], tol: number) {
  const g: Nivel[][] = [];
  for (const n of ns) {
    const ult = g[g.length - 1];
    if (ult && n.valor - ult[ult.length - 1].valor <= tol) ult.push(n); else g.push([n]);
  }
  return g
    .filter((x) => x.length >= 2)
    .map((x) => ({
      zona: [x[0].valor, x[x.length - 1].valor] as [number, number],
      centro: +(x.reduce((s, n) => s + n.valor, 0) / x.length).toFixed(4),
      niveis: x.map((n) => n.rotulo),
      dist_pct: x[0].dist_pct,
    }));
}

export type Plano = {
  lado: 'compra' | 'venda'; entrada: number; stop: number; alvo_1: number; alvo_2: number;
  risco_retorno_1: number; risco_retorno_2: number; atende_3_para_1: boolean; entrada_para_3_para_1: number | null; origem: { stop: string; alvo_1: string; alvo_2: string };
};

/**
 * Plano determinístico a partir dos níveis e do ATR:
 *  - stop: nível mais próximo contra a operação entre 0,5 e 3 ATR de distância; sem nível, 1,5 ATR.
 *  - alvo 1: nível mais próximo a favor a 1 ATR ou mais; sem nível, 2 ATR.
 *  - alvo 2: próximo nível a favor, 0,5 ATR além do alvo 1; sem nível, 3 ATR.
 */
export function planoCalculado(preco: number, ns: Nivel[], a: number | null): { compra: Plano | null; venda: Plano | null } {
  if (!a || !(a > 0) || !(preco > 0)) return { compra: null, venda: null };
  const monta = (lado: 'compra' | 'venda'): Plano => {
    const d = lado === 'compra' ? 1 : -1;
    const dist = (n: Nivel) => (n.valor - preco) * d; // positivo = a favor da operação
    const contra = ns
      .filter((n) => dist(n) < 0 && -dist(n) >= 0.5 * a && -dist(n) <= 3 * a)
      .sort((x, y) => -dist(x) - -dist(y));
    const sCand = contra[0];
    const stop = sCand ? sCand.valor : preco - d * 1.5 * a;
    const favor = ns.filter((n) => dist(n) >= a).sort((x, y) => dist(x) - dist(y));
    const t1 = favor[0];
    const alvo1 = t1 ? t1.valor : preco + d * 2 * a;
    const d1 = Math.abs(alvo1 - preco);
    const t2 = favor.find((n) => dist(n) >= d1 + 0.5 * a);
    const alvo2 = t2 ? t2.valor : preco + d * Math.max(d1 + 0.5 * a, 3 * a);
    const risco = Math.abs(preco - stop);
    const rr = (alvo: number) => (risco > 0 ? +(Math.abs(alvo - preco) / risco).toFixed(2) : 0);
    // entrada que deixaria o risco/retorno em 3:1 mantendo stop e alvo 1 (só faz sentido esperando um recuo)
    const e3 = (alvo1 + 3 * stop) / 4;
    const e3ok = rr(alvo1) < 3 && ((lado === 'compra' && e3 > stop && e3 < preco) || (lado === 'venda' && e3 < stop && e3 > preco));
    return {
      lado, entrada: +preco.toFixed(4), stop: +stop.toFixed(4), alvo_1: +alvo1.toFixed(4), alvo_2: +alvo2.toFixed(4),
      risco_retorno_1: rr(alvo1), risco_retorno_2: rr(alvo2), atende_3_para_1: rr(alvo1) >= 3, entrada_para_3_para_1: e3ok ? +e3.toFixed(4) : null,
      origem: { stop: sCand ? sCand.rotulo : '1,5 × ATR14', alvo_1: t1 ? t1.rotulo : '2 × ATR14', alvo_2: t2 ? t2.rotulo : '3 × ATR14' },
    };
  };
  return { compra: monta('compra'), venda: monta('venda') };
}

// ---------- validação de sanidade ----------
export function valida(ind: ReturnType<typeof indicadores>, pv: ReturnType<typeof pivosDS>, preco: number): string[] {
  const av: string[] = [];
  if (ind.rsi14 != null && (ind.rsi14 < 0 || ind.rsi14 > 100)) av.push('RSI fora de 0 a 100');
  if (ind.atr14 != null && !(ind.atr14 > 0)) av.push('ATR não positivo');
  if (!(preco > 0)) av.push('preço atual inválido');
  if (ind.max_52s != null && ind.min_52s != null && ind.max_52s < ind.min_52s) av.push('máxima menor que a mínima');
  const ordem = (p: any, nome: string, ks: string[]) => {
    const v = ks.map((k) => p[k]);
    for (let i = 1; i < v.length; i++) if (!(v[i] > v[i - 1])) { av.push(`${nome}: níveis fora de ordem`); return; }
  };
  for (const [nome, b] of [['pivô diário', pv.diario], ['pivô semanal', pv.semanal]] as const) {
    if (!b) continue;
    ordem(b.classico, nome + ' clássico', ['S3', 'S2', 'S1', 'P', 'R1', 'R2', 'R3']);
    ordem(b.fibonacci, nome + ' fibonacci', ['S3', 'S2', 'S1', 'P', 'R1', 'R2', 'R3']);
    ordem(b.camarilla, nome + ' camarilla', ['S4', 'S3', 'S2', 'S1', 'R1', 'R2', 'R3', 'R4']);
  }
  return av;
}

/** Tudo que o `analise` precisa por ativo, já calculado e validado. */
export function calculosTecnicos(cs: Candle[], preco: number, hojeStr: string) {
  const ind = indicadores(cs, preco, hojeStr);
  const pv = pivosDS(cs, hojeStr);
  const a = ind.atr14;
  const ns = niveis(preco, ind, pv, a);
  const tol = a ? 0.25 * a : preco * 0.002;
  return { ind, pivos: pv, niveis: ns, confluencias: confluencias(ns, tol), plano: planoCalculado(preco, ns, a), validacao: valida(ind, pv, preco) };
}

// ===== setups =====
// supabase/functions/radar/setups.ts
// Radar de oportunidades: setups técnicos calculados SEMPRE pelo código, sem rede. Testado em setups.test.ts.
// Entrada: histórico diário até ONTEM + cotação ao vivo do Profit (último, abertura, máxima, mínima).

export type Ao = { ult: number; abe?: number | null; max?: number | null; min?: number | null };
export type Setup = { id: string; nome: string; detalhe: string; peso: number };
export type Tempo = 'D' | 'W' | 'M';
export type Fib = { modo?: '2p'; a: number; b: number; c: number; da: string; db: string; dc: string; alvos: { r: number; v: number; rr?: number }[]; tf?: Tempo; cs?: (string | number)[][] };
export type FibTempos = Fib & { tf: Tempo; tempos: Partial<Record<Tempo, Fib | null>> };
export type Sinal = {
  lado: 'C' | 'V'; score: number; setups: Setup[]; preco: number; entrada: number; stop: number; alvo1: number; alvo2: number | null; rr: number; fib: FibTempos;
  rsi: number | null; vol_rel: number | null; tendencia: string; motivos_contra: string[];
};

const f2 = (x: number) => x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r = (x: number, d = 2) => +x.toFixed(d);

/** Proporções da projeção de Fibonacci usadas como alvo. */
export const FIB_R = [0.618, 1, 1.618];
/** Projeção: C + (B − A) × r. Serve para compra (A fundo, B topo, C fundo) e venda (A topo, B fundo, C topo). */
export const fibProj = (a: number, b: number, c: number) => FIB_R.map((r) => ({ r, v: +(c + (b - a) * r).toFixed(4) }));
/** Expansão de dois pontos (como no Profit/TradingView): 0% no topo B (compra) e o tamanho é B − C. Alvos = B + (B − C) × r. Venda: espelho. */
export const fibExp = (b: number, c: number) => FIB_R.map((r) => ({ r, v: +(b + (b - c) * r).toFixed(4) }));

/** Pivôs (fractal): topo = máxima maior que as k vizinhas de cada lado; fundo = mínima menor que as k vizinhas. */
export function pivosSwing(cs: Candle[], k = 2) {
  const out: { i: number; d: string; tipo: 'topo' | 'fundo'; v: number }[] = [];
  for (let i = k; i < cs.length - k; i++) {
    const viz = [...cs.slice(i - k, i), ...cs.slice(i + 1, i + k + 1)];
    if (viz.every((c) => cs[i][2] > c[2])) out.push({ i, d: cs[i][0], tipo: 'topo', v: cs[i][2] });
    if (viz.every((c) => cs[i][3] < c[3])) out.push({ i, d: cs[i][0], tipo: 'fundo', v: cs[i][3] });
  }
  return out;
}

/**
 * Estrutura A-B-C para a projeção de Fibonacci a partir dos pivôs.
 * Compra: C = último fundo abaixo do preço (é o STOP); B = último topo antes de C, acima de C; A = último fundo antes de B, abaixo de C.
 * Venda: espelho (C = último topo acima do preço = STOP).
 */
export function estruturaFib(cs: Candle[], preco: number, lado: 'C' | 'V'): Fib | null {
  // Expansão de Fibonacci de DOIS pontos: C = último fundo abaixo do preço (stop) e B = último topo antes de C (o pivô que é rompido).
  // Entrada no rompimento de B (0%); alvos 61,8%, 100% e 161,8% de (B − C) acima de B. Venda: espelho. A (origem) só aparece no gráfico.
  const pv = pivosSwing(cs), compra = lado === 'C';
  const ehC = (x: { tipo: string }) => x.tipo === (compra ? 'fundo' : 'topo'), ehB = (x: { tipo: string }) => x.tipo === (compra ? 'topo' : 'fundo');
  let ic = -1;
  for (let i = pv.length - 1; i >= 0; i--) if (ehC(pv[i])) { ic = i; break; } // o pivô mais recente desse tipo
  if (ic < 0) return null;
  const C = pv[ic];
  if (compra ? !(C.v < preco) : !(C.v > preco)) return null; // o preço já perdeu o pivô: sem estrutura
  let ib = -1;
  for (let i = ic - 1; i >= 0; i--) if (ehB(pv[i]) && (compra ? pv[i].v > C.v : pv[i].v < C.v)) { ib = i; break; }
  if (ib < 0) return null;
  const B = pv[ib];
  let A = null as null | typeof B;
  for (let i = ib - 1; i >= 0; i--) if (ehC(pv[i])) { A = pv[i]; break; }
  if (A && (compra ? !(A.v < C.v) : !(A.v > C.v))) return null; // correção passou da origem: fundo mais baixo (topo mais alto na venda), não é tendência a favor
  const alvos = fibExp(B.v, C.v);
  if (compra ? preco >= alvos[2].v : preco <= alvos[2].v) return null; // o preço já passou do 161,8%: esse movimento acabou, não serve de plano
  return { modo: '2p', a: A ? A.v : C.v, b: B.v, c: C.v, da: A ? A.d : C.d, db: B.d, dc: C.d, alvos };
}

/** Junta candles diários em semanais (semana começando na segunda) ou mensais. */
export function agrega(cs: Candle[], tf: 'W' | 'M'): Candle[] {
  const g = new Map<string, Candle[]>();
  for (const c of cs) {
    const k = tf === 'W' ? segunda(c[0]) : c[0].slice(0, 7) + '-01';
    const a = g.get(k);
    if (a) a.push(c); else g.set(k, [c]);
  }
  return [...g.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, a]) => [
    k, a[0][1], Math.max(...a.map((c) => c[2])), Math.min(...a.map((c) => c[3])), a[a.length - 1][4], a.reduce((s, c) => s + (c[5] || 0), 0),
  ] as Candle);
}
const r4 = (x: number) => +x.toFixed(4);
/** Pivôs e projeção de Fibonacci no diário, semanal e mensal, com um trecho de candles (a partir de pouco antes de A) para o gráfico. */
export function fibTempos(cs: Candle[], preco: number, lado: 'C' | 'V', maxCandles = 45): Partial<Record<Tempo, Fib | null>> {
  const out: Partial<Record<Tempo, Fib | null>> = {};
  const series: [Tempo, Candle[]][] = [['D', cs.slice(-300)], ['W', agrega(cs, 'W').slice(-150)], ['M', agrega(cs, 'M').slice(-72)]];
  for (const [tf, s] of series) {
    const f = estruturaFib(s, preco, lado);
    if (!f) { out[tf] = null; continue; }
    const iA = s.findIndex((c) => c[0] === f.da), ini = Math.max(0, Math.min(iA - 4, s.length - maxCandles)); // A sempre aparece; no mínimo maxCandles
    out[tf] = { ...f, tf, cs: s.slice(ini).map((c) => [c[0], r4(c[1]), r4(c[2]), r4(c[3]), r4(c[4])]) };
  }
  return out;
}

/** Fração do pregão já passada (10h às 17h), para projetar o volume do dia. */
export function fracaoPregao(minutosBR: number) {
  return Math.min(1, Math.max(0.05, (minutosBR - 600) / 420));
}

/** Candle de hoje montado com a cotação ao vivo. */
export function candleHoje(hoje: string, q: Ao, volHoje: number | null): Candle {
  const o = q.abe && q.abe > 0 ? q.abe : q.ult;
  const h = Math.max(q.max && q.max > 0 ? q.max : 0, o, q.ult), l = Math.min(q.min && q.min > 0 ? q.min : Infinity, o, q.ult);
  return [hoje, o, h, l, q.ult, volHoje ?? 0];
}

/**
 * Avalia um ativo. hist = candles diários completos (antes de hoje), no mínimo ~60.
 * volHoje = volume parcial do dia (Yahoo, com atraso) ou null; fracao = parte do pregão já passada.
 * Devolve até dois sinais (compra e venda), só os que passam nos filtros de liquidez e de risco/retorno.
 */
export function avalia(hist: Candle[], q: Ao, hoje: string, volHoje: number | null = null, fracao = 1): Sinal[] {
  const H = hist.filter((c) => c[0] < hoje && c[4] > 0);
  if (H.length < 60 || !(q.ult > 0)) return [];
  const P = q.ult, cs = [...H, candleHoje(hoje, q, volHoje)];
  const c = cs.map((x) => x[4]), cAnt = c.slice(0, -1);
  const A = atr(cs, 14);
  if (!A || !(A > 0)) return [];
  const s20 = sma(c, 20)!, s50 = sma(c, 50)!, s200 = sma(c, 200);
  const rs = rsi(c, 14), rsAnt = rsi(cAnt, 14);
  const e9 = ema(c, 9), e21 = ema(c, 21), e9a = ema(cAnt, 9), e21a = ema(cAnt, 21);
  const ult20 = H.slice(-20), max20 = Math.max(...ult20.map((x) => x[2])), min20 = Math.min(...ult20.map((x) => x[3]));
  const volMed = H.slice(-20).reduce((s, x) => s + x[5], 0) / 20;
  // liquidez: volume financeiro médio de 20 dias acima de R$ 5 milhões
  if (!(volMed * P >= 5e6)) return [];
  const volRel = volHoje != null && volMed > 0 && fracao > 0 ? volHoje / fracao / volMed : null;
  const abe = q.abe && q.abe > 0 ? q.abe : P;
  const altaLonga = s200 == null ? s20 > s50 : s50 > s200 && P > s200, baixaLonga = s200 == null ? s20 < s50 : s50 < s200 && P < s200;
  const tend = altaLonga && s20 > s50 ? 'alta' : baixaLonga && s20 < s50 ? 'baixa' : 'lateral';
  const volTxt = volRel == null ? '' : ` · volume projetado ${f2(volRel)}× a média`;

  const C: Setup[] = [], V: Setup[] = [];
  // 1) rompimento / perda da faixa de 20 dias
  if (P > max20 && P > s50) C.push({ id: 'romp', nome: 'Rompimento da máxima de 20 dias', detalhe: `preço ${f2(P)} acima da máxima de 20 dias ${f2(max20)}${volTxt}`, peso: 30 });
  if (P < min20 && P < s50) V.push({ id: 'romp', nome: 'Perda da mínima de 20 dias', detalhe: `preço ${f2(P)} abaixo da mínima de 20 dias ${f2(min20)}${volTxt}`, peso: 30 });
  // 2) pullback na média de 20 a favor da tendência, com candle do dia confirmando
  const perto20 = Math.abs(P - s20) <= 0.6 * A;
  if (tend === 'alta' && perto20 && P > abe && rs != null && rs >= 38 && rs <= 62)
    C.push({ id: 'pull', nome: 'Pullback na média de 20 (tendência de alta)', detalhe: `preço ${f2(P)} encostado na SMA20 ${f2(s20)}, candle do dia comprador, RSI ${f2(rs)}`, peso: 30 });
  if (tend === 'baixa' && perto20 && P < abe && rs != null && rs >= 38 && rs <= 62)
    V.push({ id: 'pull', nome: 'Pullback na média de 20 (tendência de baixa)', detalhe: `preço ${f2(P)} encostado na SMA20 ${f2(s20)}, candle do dia vendedor, RSI ${f2(rs)}`, peso: 30 });
  // 3) RSI saindo do extremo a favor da tendência longa
  if (rs != null && rsAnt != null && rsAnt <= 32 && rs > rsAnt && P > abe && (s200 == null || P > s200))
    C.push({ id: 'rsi', nome: 'Repique de sobrevenda', detalhe: `RSI virou de ${f2(rsAnt)} para ${f2(rs)}${s200 ? `, ainda acima da SMA200 ${f2(s200)}` : ''}`, peso: 25 });
  if (rs != null && rsAnt != null && rsAnt >= 68 && rs < rsAnt && P < abe && (s200 == null || P < s200))
    V.push({ id: 'rsi', nome: 'Virada de sobrecompra', detalhe: `RSI virou de ${f2(rsAnt)} para ${f2(rs)}${s200 ? `, abaixo da SMA200 ${f2(s200)}` : ''}`, peso: 25 });
  // 4) cruzamento da média exponencial 9 com a 21 hoje
  if (e9 != null && e21 != null && e9a != null && e21a != null) {
    if (e9a <= e21a && e9 > e21 && P > s50) C.push({ id: 'mm', nome: 'Cruzamento MME9 × MME21 para cima', detalhe: `MME9 ${f2(e9)} cruzou acima da MME21 ${f2(e21)}`, peso: 20 });
    if (e9a >= e21a && e9 < e21 && P < s50) V.push({ id: 'mm', nome: 'Cruzamento MME9 × MME21 para baixo', detalhe: `MME9 ${f2(e9)} cruzou abaixo da MME21 ${f2(e21)}`, peso: 20 });
  }

  const out: Sinal[] = [];
  for (const [lado, L] of [['C', C], ['V', V]] as const) {
    if (!L.length) continue;
    const tempos = fibTempos(cs, P, lado), tf = (['D', 'W', 'M'] as Tempo[]).find((t) => tempos[t]);
    if (!tf) continue; // sem pivô para o stop ou sem impulso para projetar em nenhum tempo: fica de fora
    const { cs: _cs, ...base } = tempos[tf] as Fib, fib: FibTempos = { ...base, tf, tempos };
    const dir = lado === 'C' ? 1 : -1, E = (P - fib.b) * dir >= 0 ? P : fib.b; // entrada: rompimento do pivô B (se já rompeu, o preço de agora)
    const a_favor = fib.alvos.filter((x) => (x.v - E) * dir > 0);
    if (!a_favor.length) continue; // já passou dos 161,8%
    const risco = Math.abs(E - fib.c);
    if (!(risco > 0)) continue;
    fib.alvos = fib.alvos.map((x) => ({ ...x, rr: +(((x.v - E) * dir) / risco).toFixed(2) }));
    const rr1 = +(Math.abs(a_favor[0].v - E) / risco).toFixed(2), rrMax = Math.max(...fib.alvos.map((x) => x.rr!));
    const p = { risco_retorno_1: rrMax };
    const contra: string[] = [];
    let s = L.reduce((t, x) => t + x.peso, 0) + 10 * (L.length - 1);
    if ((lado === 'C' && tend === 'alta') || (lado === 'V' && tend === 'baixa')) s += 15;
    else if (tend !== 'lateral') { s -= 15; contra.push(`contra a tendência de ${tend}`); }
    if (volRel != null) {
      if (volRel >= 1.5) s += 15; else if (volRel >= 1.1) s += 8;
      else if (volRel < 0.7) { s -= 10; contra.push('volume fraco'); }
    }
    // na expansão de dois pontos, com entrada no rompimento de B e stop em C, o 161,8% paga 1,62× o risco; entrar acima de B reduz isso
    if (p.risco_retorno_1 >= 1.5) s += 10; else if (p.risco_retorno_1 < 1.3) { s -= 10; contra.push(`entrada longe do pivô: até 161,8% paga só ${f2(p.risco_retorno_1)}× o risco`); }
    if (lado === 'C' && rs != null && rs >= 72) { s -= 15; contra.push(`RSI esticado (${f2(rs)})`); }
    if (lado === 'V' && rs != null && rs <= 28) { s -= 15; contra.push(`RSI esticado (${f2(rs)})`); }
    const mov = Math.abs(P / abe - 1) * 100;
    if (mov > 2.5 * (A / P) * 100) { s -= 10; contra.push('já andou mais de 2,5 ATR no dia'); }
    if (rrMax < 1.2) continue; // já andou demais depois do rompimento: nem o 161,8% paga 1,2× o risco até o pivô
    out.push({
      lado, score: Math.max(0, Math.min(100, Math.round(s))), setups: L, preco: r(P, 4), entrada: r(E, 4), stop: fib.c, alvo1: a_favor[0].v, alvo2: a_favor[1]?.v ?? null,
      rr: rr1, fib, rsi: rs == null ? null : r(rs, 1), vol_rel: volRel == null ? null : r(volRel), tendencia: tend, motivos_contra: contra,
    });
  }
  return out;
}

/** Ordena e corta: melhores primeiro, no máximo n por lado. */
export function ranking<T extends { lado: string; score: number }>(xs: T[], n = 12) {
  const s = [...xs].sort((a, b) => b.score - a.score);
  return [...s.filter((x) => x.lado === 'C').slice(0, n), ...s.filter((x) => x.lado === 'V').slice(0, n)];
}

/** Só ações e units da B3 (fora opções, termos, BDRs de baixa liquidez continuam pelo filtro de volume). */
export const ehAcao = (t: string) => /^[A-Z]{4}(3|4|5|6|11)$/.test(t);

// ---------- placar: o que aconteceu com cada sinal ----------
export type Resultado = { fim: boolean; nivel: 'stop' | '61,8%' | '100%' | '161,8%' | null; dias: number; r: number; status: 'stop' | 'alvo' | 'aberto' | 'expirou'; ate: string | null };
/**
 * Percorre os candles DEPOIS do dia do sinal (o próprio dia fica de fora: não se sabe a ordem dentro dele).
 * Stop e alvo no mesmo candle conta como stop (conservador). O sinal termina no stop, no 161,8% ou após `maxDias` pregões.
 * R = alvo mais alto atingido (saída nele) ou −1 no stop; se expirar sem alvo, R do último fechamento.
 */
export function placar(s: { dia: string; lado: 'C' | 'V'; entrada: number; stop: number; alvos: number[] }, cs: Candle[], maxDias = 20): Resultado {
  const c = s.lado === 'C', risco = Math.abs(s.entrada - s.stop), Rde = (v: number) => (risco > 0 ? +(((v - s.entrada) * (c ? 1 : -1)) / risco).toFixed(2) : 0);
  const nomes = ['61,8%', '100%', '161,8%'] as const;
  const dep = cs.filter((x) => x[0] > s.dia).slice(0, maxDias);
  let melhor = -1;
  for (let i = 0; i < dep.length; i++) {
    const [, , h, l] = dep[i];
    const bateuStop = c ? l <= s.stop : h >= s.stop;
    if (bateuStop) {
      if (melhor >= 0) return { fim: true, nivel: nomes[melhor], dias: i + 1, r: Rde(s.alvos[melhor]), status: 'alvo', ate: dep[i][0] };
      return { fim: true, nivel: 'stop', dias: i + 1, r: -1, status: 'stop', ate: dep[i][0] };
    }
    s.alvos.forEach((v, k) => { if (k > melhor && (c ? h >= v : l <= v)) melhor = k; });
    if (melhor === s.alvos.length - 1) return { fim: true, nivel: nomes[melhor], dias: i + 1, r: Rde(s.alvos[melhor]), status: 'alvo', ate: dep[i][0] };
  }
  const n = dep.length, ult = n ? dep[n - 1] : null;
  if (n >= maxDias) return { fim: true, nivel: melhor >= 0 ? nomes[melhor] : null, dias: n, r: melhor >= 0 ? Rde(s.alvos[melhor]) : Rde(ult![4]), status: melhor >= 0 ? 'alvo' : 'expirou', ate: ult![0] };
  return { fim: false, nivel: melhor >= 0 ? nomes[melhor] : null, dias: n, r: melhor >= 0 ? Rde(s.alvos[melhor]) : ult ? Rde(ult[4]) : 0, status: 'aberto', ate: ult ? ult[0] : null };
}

/** Dia de turno marcado como "não opere" na escala que o app manda junto com as preferências de notificação. */
export function emTurno(prefs: any, dia: string): boolean {
  const t = prefs?.turno;
  if (!t || t.on === 0 || t.on === false || !t.dias) return false;
  const c = String(t.dias[dia] ?? '');
  if (!c) return false;
  const niv = (t.niv && t.niv[c]) || ({ '8': 'r', '16': 'a', '0': 'a', F: 'g' } as Record<string, string>)[c] || 'g';
  return niv === 'r';
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
export const VERSAO_FN = 'v138';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/radar/index.ts
// Radar de oportunidades: a cada 15 min no pregão, varre os ativos que a ponte do Profit manda (tabela cotacoes),
// calcula setups de compra e venda pelo código (setups.ts) e pede ao Gemini um comentário curto só dos melhores.
// Grava em radar_sinais (o app lê) e manda push dos sinais fortes.
//
// Publicar:  supabase functions deploy radar --no-verify-jwt
// Secrets usados (os mesmos das outras funções): CRON_SECRET, GEMINI_API_KEY, GEMINI_MODEL (ou GEMINI_MODEL_RADAR),
//   VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (push; sem eles o radar funciona sem notificação)

const SB = Deno.env.get('SUPABASE_URL') || '';
const SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const CRON = Deno.env.get('CRON_SECRET') || '';
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const MODELO = Deno.env.get('GEMINI_MODEL_RADAR') || Deno.env.get('GEMINI_MODEL_TEC') || Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash';
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';
const TZ = 'America/Sao_Paulo';

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};

// ---------- util ----------
const agoraBR = () => {
  const P = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { dia: `${P.year}-${P.month}-${P.day}`, min: +P.hour * 60 + +P.minute, util: !['Sat', 'Sun'].includes(P.weekday) };
};
const diaBR = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const svc = (extra: Record<string, string> = {}) => ({ apikey: SVC, Authorization: 'Bearer ' + SVC, 'Content-Type': 'application/json', ...extra });
async function rest(path: string, o: RequestInit = {}) {
  const r = await fetch(SB + '/rest/v1/' + path, { ...o, headers: { ...svc(), ...(o.headers as Record<string, string> || {}) } });
  if (!r.ok) throw new Error(`banco ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
/** Roda fn sobre a lista com no máximo n chamadas ao mesmo tempo. */
async function emLotes<T, R>(xs: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(xs.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => { while (i < xs.length) { const k = i++; out[k] = await fn(xs[k]); } }));
  return out;
}

// ---------- Yahoo: histórico diário (guardado 1x por dia) e volume parcial de hoje ----------
/** Criptos varridas pelo radar (negociam 24h; o dia delas é o dia UTC, como no Yahoo e nas corretoras). */
export const CRIPTO = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD', 'LTC-USD'];
const ehCripto = (t: string) => /-USD$/.test(t);
const diaUTC = () => new Date().toISOString().slice(0, 10);
async function yahoo(tk: string, range: string): Promise<Candle[]> {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tk)}${ehCripto(tk) ? '' : '.SA'}?range=${range}&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error('Yahoo ' + r.status);
  const R = (await r.json())?.chart?.result?.[0], ts: number[] = R?.timestamp || [], q = R?.indicators?.quote?.[0] || {};
  const out: Candle[] = [];
  ts.forEach((t, i) => {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
    if ([o, h, l, c].every((x) => typeof x === 'number' && x > 0)) out.push([ehCripto(tk) ? new Date(t * 1000).toISOString().slice(0, 10) : diaBR(new Date(t * 1000).toISOString()), o, h, l, c, q.volume?.[i] || 0]);
  });
  return out;
}
// v17: o histórico de 3 anos é baixado uma vez; depois, a cada dia, só o último mês é buscado e emendado.
// (antes, todo dia o radar baixava 3 anos de 50 ativos de uma vez, estourava o limite de CPU da função antes de salvar
// e repetia o mesmo trabalho a cada 15 minutos, sem nunca terminar.)
const MAX_CANDLES = 800, NOVOS_3A_POR_RODADA = 12, DIAS_EMENDA = 25, EMENDA_POR_RODADA = 60;
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
export function emenda(base: Candle[], novos: Candle[], dia: string): Candle[] {
  const add = novos.filter((c) => c[0] < dia);
  if (!add.length) return base.filter((c) => c[0] < dia).slice(-MAX_CANDLES);
  const corte = add[0][0];
  return [...base.filter((c) => c[0] < corte), ...add].slice(-MAX_CANDLES);
}
async function historicos(tks: string[], dia: string, erros: string[]) {
  const H = new Map<string, Candle[]>(), velhos = new Map<string, Candle[]>();
  for (let i = 0; i < tks.length; i += 150) {
    const lote = tks.slice(i, i + 150);
    const rows = await rest(`radar_cache?select=ticker,dia,candles&ticker=in.(${lote.join(',')})`).catch(() => []);
    for (const r of rows || []) {
      const n = r.candles?.length || 0;
      if (n <= 300) continue; // cache curto (antigo, de 1 ano): baixa os 3 anos de novo
      if (r.dia === dia) H.set(r.ticker, r.candles);
      else if (diasEntre(r.dia, dia) <= DIAS_EMENDA) velhos.set(r.ticker, r.candles);
    }
  }
  const novos: { ticker: string; dia: string; candles: Candle[] }[] = [];
  // 1) cache de dias anteriores: só o último mês (rápido e leve) e emenda — até EMENDA_POR_RODADA por vez;
  //    os demais ficam para as próximas rodadas (não são avaliados com histórico incompleto)
  await emLotes([...velhos.keys()].slice(0, EMENDA_POR_RODADA), 8, async (t) => {
    const base = velhos.get(t)!;
    try {
      const cs = emenda(base, await yahoo(t, '1mo'), dia);
      H.set(t, cs); novos.push({ ticker: t, dia, candles: cs });
    } catch (e) {
      H.set(t, base.filter((c) => c[0] < dia)); // sem Yahoo agora: usa o histórico guardado
      if (erros.length < 5) erros.push(`${t}: ${(e as Error).message}`);
    }
  });
  // 2) sem cache: 3 anos, poucos por rodada (o resto entra nas próximas)
  const falta = tks.filter((t) => !H.has(t) && !velhos.has(t)).slice(0, NOVOS_3A_POR_RODADA);
  await emLotes(falta, 6, async (t) => {
    try {
      const cs = (await yahoo(t, '3y')).filter((c) => c[0] < dia).slice(-MAX_CANDLES);
      if (cs.length) { H.set(t, cs); novos.push({ ticker: t, dia, candles: cs }); }
    } catch (e) { if (erros.length < 5) erros.push(`${t}: ${(e as Error).message}`); }
  });
  // grava em blocos pequenos (menos memória e CPU de uma vez)
  for (let i = 0; i < novos.length; i += 25)
    await rest('radar_cache?on_conflict=ticker', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(novos.slice(i, i + 25)) }).catch(() => null);
  return { H, pendentes: tks.length - H.size };
}
async function volumeHoje(tk: string, dia: string): Promise<number | null> {
  try { const c = (await yahoo(tk, '5d')).find((x) => x[0] === dia); return c ? c[5] : null; } catch { return null; }
}

// ---------- Gemini: comentário curto dos melhores sinais ----------
const SYS = 'Você é um analista CNPI-P (Apimec) que acompanha a B3 e as principais criptomoedas (tickers terminados em -USD, em dólar) para um trader pessoa física experiente. ' +
  'Para cada sinal recebido (já calculado pelo código: setup, preço, entrada no rompimento do pivô B, stop no fundo/topo C, alvos pela expansão de Fibonacci de dois pontos (B + (B − C) × 61,8%, 100% e 161,8%), RSI, volume projetado, tendência e pontos contra), ' +
  'escreva UM comentário de até 230 caracteres: o que confirma a entrada (ex.: fechar acima de X, volume seguir acima da média) e o que invalida (o stop ou nível). ' +
  'Use só os números fornecidos, nunca invente notícia ou dado. Se os pontos contra pesarem mais, diga "esperar" e por quê. ' +
  'Responda SOMENTE JSON: {"TICKER|C ou V":"comentário", ...}. Não é recomendação de investimento.';
async function comenta(xs: (Sinal & { ticker: string })[]): Promise<Record<string, string>> {
  if (!GEMINI_KEY || !xs.length) return {};
  const dados = xs.map((s) => ({
    chave: `${s.ticker}|${s.lado}`, lado: s.lado === 'C' ? 'compra' : 'venda', setups: s.setups.map((x) => x.detalhe), preco: s.preco, entrada_no_rompimento_de_B: s.entrada, stop_no_pivo: s.stop, fibonacci: { tempo_grafico: ({ D: 'diário', W: 'semanal', M: 'mensal' } as Record<string, string>)[s.fib.tf], B_pivo_rompido: s.fib.b, C_fundo_ou_topo_da_correcao: s.fib.c, alvos: s.fib.alvos.map((x) => ({ projecao: x.r * 100 + '%', preco: x.v, risco_retorno: x.rr })) },
    risco_retorno: s.rr, rsi: s.rsi, volume_projetado_x_media: s.vol_rel, tendencia_diaria: s.tendencia, pontos_contra: s.motivos_contra, score: s.score,
  }));
  for (const m of [MODELO, 'gemini-3.5-flash-lite']) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, signal: AbortSignal.timeout(40_000),
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: 'user', parts: [{ text: JSON.stringify(dados) }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 4000, responseMimeType: 'application/json' } }),
      });
      if (!r.ok) continue;
      const t = ((await r.json())?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
      const j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(j)) if (typeof v === 'string') out[k] = v.replace(/\s+/g, ' ').trim().slice(0, 260);
      return out;
    } catch { /* tenta o modelo reserva */ }
  }
  return {};
}

// ---------- push ----------
let WP: any = null;
async function push(uid: string, titulo: string, corpo: string, tag: string) {
  const pub = Deno.env.get('VAPID_PUBLIC'), pri = Deno.env.get('VAPID_PRIVATE');
  if (!pub || !pri) return 0;
  if (!WP) { WP = (await import('npm:web-push@3.6.7')).default; WP.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'mailto:radar@example.com', pub, pri); }
  // só os aparelhos da própria pessoa (sem a coluna user_id, que vem do seguranca-v86.sql, cai no comportamento antigo)
  const subs = await rest(`push_subs?select=id,sub,prefs&user_id=eq.${uid}`).catch(() => rest('push_subs?select=id,sub,prefs&user_id=is.null').catch(() => []));
  const { dia } = agoraBR();
  let n = 0;
  for (const s of subs || []) {
    if (emTurno(s.prefs, dia)) continue; // dia de turno (não operar): o sinal fica só no app
    try { await WP.sendNotification(s.sub, JSON.stringify({ title: titulo, body: corpo, tag, data: { go: 'live' } }), { TTL: 900, urgency: 'high' }); n++; }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await rest(`push_subs?id=eq.${s.id}`, { method: 'DELETE' }).catch(() => null); }
  }
  return n;
}

// ---------- varredura de um usuário ----------
async function varre(uid: string, op: { b3?: boolean } = {}) {
  const { dia, min } = agoraBR(), erros: string[] = [];
  const cfg = (await rest(`radar_cfg?select=*&user_id=eq.${uid}`).catch(() => []))?.[0] || { push: true, score_min: 75 };
  const fazB3 = op.b3 !== false, fazCr = cfg.cripto !== false;
  const cot = fazB3 ? ((await rest(`cotacoes?select=ticker,ult,abe,max,min,updated_at&user_id=eq.${uid}`)) || []) : [];
  const vivos = cot.filter((c: any) => ehAcao(String(c.ticker).toUpperCase()) && +c.ult > 0 && c.updated_at && diaBR(c.updated_at) === dia)
    .map((c: any) => ({ t: String(c.ticker).toUpperCase(), q: { ult: +c.ult, abe: +c.abe || null, max: +c.max || null, min: +c.min || null } }));
  const { H, pendentes } = await historicos(vivos.map((v: any) => v.t), dia, erros);
  const fr = fracaoPregao(min);
  // 1ª passada sem volume; só os candidatos buscam o volume parcial de hoje e são reavaliados
  const cand = vivos.filter((v: any) => H.has(v.t) && avalia(H.get(v.t)!, v.q, dia).length);
  const vols = await emLotes(cand, 8, (v: any) => volumeHoje(v.t, dia));
  let sinais: (Sinal & { ticker: string })[] = [];
  cand.forEach((v: any, i: number) => avalia(H.get(v.t)!, v.q, dia, vols[i], fr).forEach((s) => sinais.push({ ...s, ticker: v.t })));
  sinais = ranking(sinais, 12);
  // cripto: 24h, histórico diário em UTC e o candle de hoje do próprio Yahoo
  const qCr = new Map<string, any>();
  let nCr = 0;
  if (fazCr) {
    const dU = diaUTC(), hU = new Date(), frU = Math.max(0.05, (hU.getUTCHours() * 60 + hU.getUTCMinutes()) / 1440);
    const hc = await historicos(CRIPTO, dU, erros);
    hc.H.forEach((v, k) => H.set(k, v));
    const hoje = await emLotes(CRIPTO, 5, async (t) => { try { return (await yahoo(t, '5d')).find((c) => c[0] === dU) || null; } catch { return null; } });
    const cr: (Sinal & { ticker: string })[] = [];
    CRIPTO.forEach((t, i) => {
      const c = hoje[i]; if (!c || !hc.H.has(t)) return;
      const q = { ult: c[4], abe: c[1], max: c[2], min: c[3] }; qCr.set(t, q); nCr++;
      avalia(hc.H.get(t)!, q, dU, c[5] || null, frU).forEach((s) => cr.push({ ...s, ticker: t }));
    });
    sinais = sinais.concat(ranking(cr, 5));
  }

  const ant = (await rest(`radar_sinais?select=ticker,lado,setups,comentario,avisado,primeiro&user_id=eq.${uid}&dia=eq.${dia}`).catch(() => [])) || [];
  const ka = new Map<string, any>(ant.map((a: any) => [`${a.ticker}|${a.lado}`, a]));
  const ids = (s: Sinal) => s.setups.map((x) => x.id).sort().join(',');
  const precisa = sinais.filter((s) => s.score >= 45 && (!ka.get(`${s.ticker}|${s.lado}`)?.comentario || (ka.get(`${s.ticker}|${s.lado}`)?.setups || []).map((x: any) => x.id).sort().join(',') !== ids(s))).slice(0, 10);
  const com = await comenta(precisa);
  const agora = new Date().toISOString();
  const rows = sinais.map((s) => {
    const k = `${s.ticker}|${s.lado}`, a = ka.get(k);
    return {
      user_id: uid, dia, ticker: s.ticker, lado: s.lado, score: s.score, setups: s.setups, preco: s.preco, entrada: s.entrada, stop: s.stop, alvo1: s.alvo1, alvo2: s.alvo2,
      rr: s.rr, fib: s.fib, rsi: s.rsi, vol_rel: s.vol_rel, tendencia: s.tendencia, contra: s.motivos_contra, comentario: com[k] || a?.comentario || null,
      ativo: true, avisado: a?.avisado || false, primeiro: a?.primeiro || agora, atualizado: agora,
    };
  });
  if (rows.length) await rest('radar_sinais?on_conflict=user_id,dia,ticker,lado', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
  const fora = ant.filter((a: any) => (ehCripto(a.ticker) ? fazCr : fazB3) && !rows.some((r) => r.ticker === a.ticker && r.lado === a.lado));
  for (const a of fora) await rest(`radar_sinais?user_id=eq.${uid}&dia=eq.${dia}&ticker=eq.${a.ticker}&lado=eq.${a.lado}`, { method: 'PATCH', body: JSON.stringify({ ativo: false, atualizado: agora }) }).catch(() => null);

  // push: sinais fortes ainda não avisados (no máximo 3 por varredura)
  let avisos = 0;
  if (cfg.push !== false) {
    for (const r of rows.filter((r) => !r.avisado && r.score >= (+cfg.score_min || 75)).slice(0, 3)) {
      const t = `🎯 Radar: ${r.lado === 'C' ? 'COMPRA' : 'VENDA'} ${r.ticker} · ${r.score}`;
      const nf = (v: number) => v.toFixed(Math.abs(v) < 10 ? 4 : 2);
      const b = `${r.setups[0].nome}. Entrada ${nf(r.entrada)}, stop no pivô ${nf(r.stop)}, alvos Fibo ${r.fib.alvos.map((x) => nf(x.v)).join(' / ')}`;
      if (await push(uid, t, b, `radar-${dia}-${r.ticker}-${r.lado}`).catch(() => 0)) avisos++;
      await rest(`radar_sinais?user_id=eq.${uid}&dia=eq.${dia}&ticker=eq.${r.ticker}&lado=eq.${r.lado}`, { method: 'PATCH', body: JSON.stringify({ avisado: true }) }).catch(() => null);
    }
  }
  // placar: atualiza o que aconteceu com os sinais dos últimos 30 dias que ainda não terminaram
  try {
    const de = new Date(Date.parse(dia + 'T12:00:00Z') - 30 * 864e5).toISOString().slice(0, 10);
    const velhos = (await rest(`radar_sinais?select=dia,ticker,lado,entrada,stop,alvos:fib->alvos,resultado&user_id=eq.${uid}&dia=gte.${de}&dia=lt.${dia}`)) || [];
    const qv = new Map<string, any>([...vivos.map((v: any) => [v.t, v.q]), ...qCr]);
    for (const v of velhos) {
      if (v.resultado?.fim || !H.has(v.ticker) || !Array.isArray(v.alvos)) continue;
      const q = qv.get(v.ticker), cs = q ? [...H.get(v.ticker)!, candleHoje(ehCripto(v.ticker) ? diaUTC() : dia, q, null)] : H.get(v.ticker)!;
      const res = placar({ dia: v.dia, lado: v.lado, entrada: +v.entrada, stop: +v.stop, alvos: v.alvos.map((x: any) => +x.v) }, cs);
      if (JSON.stringify(res) !== JSON.stringify(v.resultado))
        await rest(`radar_sinais?user_id=eq.${uid}&dia=eq.${v.dia}&ticker=eq.${v.ticker}&lado=eq.${v.lado}`, { method: 'PATCH', body: JSON.stringify({ resultado: res }) }).catch(() => null);
    }
  } catch (e) { if (erros.length < 5) erros.push('placar: ' + (e as Error).message); }
  const resumo = { ultima: agora, analisados: H.size, pendentes, sinais: rows.length, erro: erros.length ? erros.join(' · ').slice(0, 300) : null };
  await rest('radar_cfg?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: uid, ...resumo }) }).catch(() => null);
  return { ...resumo, avisos, ativos_ponte: vivos.length, cripto: nCr };
}

const usuario = usuarioDe;
/** Dispara uma chamada desta função por pessoa (até 4 ao mesmo tempo). Esperar a resposta não gasta CPU. */
async function espalha(uids: string[], acao: string) {
  return emLotes(uids, 4, async (uid) => {
    try {
      const r = await fetch(SB + '/functions/v1/radar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, apikey: SVC, Authorization: 'Bearer ' + SVC }, body: JSON.stringify({ acao, uid }), signal: AbortSignal.timeout(140_000) });
      const j = await r.json().catch(() => ({}));
      return r.ok ? { analisados: j.analisados, sinais: j.sinais, pendentes: j.pendentes, erro: j.erro || null } : { erro: `HTTP ${r.status} ${j.error || ''}`.trim() };
    } catch (e) { return { erro: (e as Error).message }; }
  });
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'radar', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  if (!SB || !SVC) return out({ error: 'Função sem SUPABASE_URL/SERVICE_ROLE.' }, 500);
  let b: any = {}; try { b = await req.json(); } catch { /* corpo vazio */ }
  try {
    if (b.acao === 'varrer') { // agendado pelo pg_cron
      if (!segredoIgual(req.headers.get('x-cron-secret'), CRON)) return out({ error: 'Não autorizado' }, 401);
      const { dia, min, util } = agoraBR();
      if (!util || min < 600 || min > 1085) return out({ ok: true, fora_do_pregao: true });
      const cot = (await rest('cotacoes?select=user_id,updated_at&order=updated_at.desc&limit=2000')) || [];
      const uids = [...new Set(cot.filter((c: any) => c.updated_at && diaBR(c.updated_at) === dia).map((c: any) => c.user_id))] as string[];
      return out({ ok: true, usuarios: uids.length, res: await espalha(uids, 'varrer_um') });
    }
    if (b.acao === 'varrer_um' || b.acao === 'cripto_um') { // uma pessoa por chamada: cada uma tem o próprio limite de CPU
      if (!segredoIgual(req.headers.get('x-cron-secret'), CRON)) return out({ error: 'Não autorizado' }, 401);
      const uid = String(b.uid || '');
      if (!/^[0-9a-f-]{36}$/i.test(uid)) return out({ error: 'Usuário inválido' }, 400);
      return out(await varre(uid, b.acao === 'cripto_um' ? { b3: false } : {}));
    }
    if (b.acao === 'cripto') { // agendado pelo pg_cron a cada 30 min, 24h (só cripto)
      if (!segredoIgual(req.headers.get('x-cron-secret'), CRON)) return out({ error: 'Não autorizado' }, 401);
      const us = (await rest('radar_cfg?select=user_id&cripto=is.true').catch(() => [])) || [];
      return out({ ok: true, usuarios: us.length, res: await espalha(us.map((u: any) => u.user_id), 'cripto_um') });
    }
    if (b.acao === 'agora') { // botão "Varrer agora" do app
      const uid = await usuario(req);
      if (!uid) return out({ error: 'Faça login no app.' }, 401);
      const c = (await rest(`radar_cfg?select=ultima&user_id=eq.${uid}`).catch(() => []))?.[0];
      if (c?.ultima && Date.now() - Date.parse(c.ultima) < 3 * 60_000) return out({ error: 'O radar acabou de rodar. Tente de novo em alguns minutos.' }, 429);
      return out(await varre(uid));
    }
    return out({ error: 'Ação desconhecida' }, 400);
  } catch (e) { return out({ error: (e as Error).message }, 500); }
});
