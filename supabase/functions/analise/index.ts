
/** Calendário B3: fins de semana, feriados fixos, móveis e encerramentos de fim de ano. */
export function b3SemPregao(dia: string): boolean {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dia))return true;
 const date=new Date(dia+'T12:00:00Z'), y=date.getUTCFullYear(), w=date.getUTCDay();
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dia)return true;
 if(w===0||w===6)return true;
 if(['01-01','04-21','05-01','09-07','10-12','11-02','11-15','12-24','12-25','12-31',...(y>=2024?['11-20']:[])].includes(dia.slice(5)))return true;
 const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
 const easter=Date.UTC(y,month-1,day,12);
 return [-48,-47,-2,60].some(offset=>new Date(easter+offset*86400000).toISOString().slice(0,10)===dia);
}

// Função ANALISE — arquivo único para colar no editor do Supabase (Edge Functions → analise → index.ts)

// ===== indicadores =====
// supabase/functions/analise/indicadores.ts
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

// ===== multitempo =====
// supabase/functions/analise/multitempo.ts
// Leitura multi-tempo (mensal → semanal → diário), calculada SEMPRE pelo código. Funções puras, testadas em multitempo.test.ts.

export type TF = 'M' | 'W' | 'D';
/** Médias usadas em cada tempo gráfico (rápida, lenta) — as mesmas 20 e 50 períodos em todos os tempos, como o trader usa; a de 200 vem junto como referência de longo prazo. */
export const MEDIAS: Record<TF, [number, number]> = { D: [20, 50], W: [20, 50], M: [20, 50] };
export const MEDIA_LONGA = 200;

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

/** Topos e fundos: um candle é topo (fundo) se a máxima (mínima) é maior (menor) que as `k` vizinhas de cada lado. */
export function estrutura(cs: Candle[], k = 2): 'topos e fundos ascendentes' | 'topos e fundos descendentes' | 'mista' | 'sem dado' {
  const tops: number[] = [], funds: number[] = [];
  for (let i = k; i < cs.length - k; i++) {
    const viz = [...cs.slice(i - k, i), ...cs.slice(i + 1, i + k + 1)];
    if (viz.every((c) => cs[i][2] > c[2])) tops.push(cs[i][2]);
    if (viz.every((c) => cs[i][3] < c[3])) funds.push(cs[i][3]);
  }
  if (tops.length < 2 || funds.length < 2) return 'sem dado';
  const [t1, t2] = tops.slice(-2), [f1, f2] = funds.slice(-2);
  if (t2 > t1 && f2 > f1) return 'topos e fundos ascendentes';
  if (t2 < t1 && f2 < f1) return 'topos e fundos descendentes';
  return 'mista';
}

export type Leitura = {
  tempo: 'mensal' | 'semanal' | 'diário'; candles: number; ultimo: string | null; fechamento: number | null; var_ultimo_pct: number | null;
  media_rapida: { n: number; valor: number | null; inclinacao: 'subindo' | 'caindo' | 'lateral' | null };
  media_lenta: { n: number; valor: number | null };
  media_200: { n: number; valor: number | null; preco_acima: boolean | null };
  rsi14: number | null; rsi_zona: string | null; estrutura: string;
  tendencia: 'alta' | 'baixa' | 'lateral' | 'sem dado';
  maxima_periodo: number | null; minima_periodo: number | null; posicao_na_faixa_pct: number | null;
};

/** Tendência: alta = preço > média rápida > média lenta e média rápida subindo; baixa = o espelho; senão lateral. */
export function leitura(cs: Candle[], tf: TF): Leitura {
  const nome = tf === 'M' ? 'mensal' : tf === 'W' ? 'semanal' : 'diário';
  const c = cs.map((x) => x[4]), n = c.length, [nr, nl] = MEDIAS[tf];
  const mr = sma(c, nr), ml = sma(c, nl), mrAnt = n > nr + 3 ? sma(c.slice(0, n - 3), nr) : null;
  const incl = mr == null || mrAnt == null ? null : mr > mrAnt * 1.002 ? 'subindo' : mr < mrAnt * 0.998 ? 'caindo' : 'lateral';
  const px = n ? c[n - 1] : null, rs = rsi(c, 14);
  let tend: Leitura['tendencia'] = 'sem dado';
  if (px != null && mr != null && ml != null) {
    if (px > mr && mr > ml && incl !== 'caindo') tend = 'alta';
    else if (px < mr && mr < ml && incl !== 'subindo') tend = 'baixa';
    else tend = 'lateral';
  } else if (px != null && mr != null && incl) {
    // histórico curto para a média lenta: decide pelo preço x média rápida e pela inclinação dela
    tend = px > mr && incl === 'subindo' ? 'alta' : px < mr && incl === 'caindo' ? 'baixa' : 'lateral';
  }
  const m200 = sma(c, MEDIA_LONGA);
  const jan = cs.slice(tf === 'D' ? -252 : tf === 'W' ? -52 : -60);
  const mx = jan.length ? Math.max(...jan.map((x) => x[2])) : null, mn = jan.length ? Math.min(...jan.map((x) => x[3])) : null;
  return {
    tempo: nome, candles: n, ultimo: n ? cs[n - 1][0] : null, fechamento: r2(px, 4), var_ultimo_pct: n > 1 ? r2((c[n - 1] / c[n - 2] - 1) * 100) : null,
    media_rapida: { n: nr, valor: r2(mr, 4), inclinacao: incl }, media_lenta: { n: nl, valor: r2(ml, 4) },
    media_200: { n: MEDIA_LONGA, valor: r2(m200, 4), preco_acima: px != null && m200 != null ? px > m200 : null },
    rsi14: r2(rs, 1), rsi_zona: rsiZona(rs), estrutura: estrutura(cs.slice(-40)), tendencia: tend,
    maxima_periodo: r2(mx, 4), minima_periodo: r2(mn, 4),
    posicao_na_faixa_pct: px != null && mx != null && mn != null && mx > mn ? r2(((px - mn) / (mx - mn)) * 100, 0) : null,
  };
}

export function alinhamento(ls: Leitura[]): 'ALINHADO EM ALTA' | 'ALINHADO EM BAIXA' | 'DIVERGENTE' | 'LATERAL' | 'SEM DADO' {
  const t = ls.map((l) => l.tendencia).filter((x) => x !== 'sem dado');
  if (t.length < 2) return 'SEM DADO';
  if (t.every((x) => x === 'alta')) return 'ALINHADO EM ALTA';
  if (t.every((x) => x === 'baixa')) return 'ALINHADO EM BAIXA';
  if (t.includes('alta') && t.includes('baixa')) return 'DIVERGENTE';
  return 'LATERAL';
}

/** Monta a leitura dos três tempos. Semanal e mensal usam o histórico longo quando houver; senão, agregam o diário. */
export function multitempo(diario: Candle[], semanal?: Candle[] | null, mensal?: Candle[] | null) {
  const W = semanal && semanal.length >= 20 ? semanal : agrega(diario, 'W');
  const M = mensal && mensal.length >= 12 ? mensal : agrega(diario, 'M');
  const ls = [leitura(M, 'M'), leitura(W, 'W'), leitura(diario, 'D')];
  return { mensal: ls[0], semanal: ls[1], diario: ls[2], alinhamento: alinhamento(ls) };
}

/** Candles para desenhar o gráfico (últimos n) com as médias de 20, 50 e 200 calculadas no histórico inteiro. */
export function grafico(cs: Candle[], n: number) {
  const c = cs.map((x) => x[4]);
  const media = (p: number) => { const out: (number | null)[] = []; let s = 0; for (let i = 0; i < c.length; i++) { s += c[i]; if (i >= p) s -= c[i - p]; out.push(i + 1 >= p ? r2(s / p, 4) : null); } return out; };
  const ini = Math.max(0, cs.length - n);
  const m20 = media(20), m50 = media(50), m200 = media(200);
  return {
    c: cs.slice(ini).map((x) => [x[0], r2(x[1], 4), r2(x[2], 4), r2(x[3], 4), r2(x[4], 4), Math.round(x[5] || 0)]),
    mm20: m20.slice(ini), mm50: m50.slice(ini), mm200: m200.slice(ini),
  };
}

// ===== relatorio =====
// supabase/functions/analise/relatorio.ts
// Pós-processamento do relatório técnico: os números vêm do servidor, a IA fica só com o texto interpretativo.
// Funções puras (testáveis).

export const pt = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const simb = (m: string) => (m === 'BRL' ? 'R$ ' : m === 'USD' ? 'US$ ' : (m || '') + ' ');
const fp = (v: number | null | undefined, m: string) => (v == null ? '–' : simb(m) + pt(v));
export const rrTxt = (x: number) => pt(x, 1) + ':1';
const linhaPivos = (b: any, m: string) => {
  if (!b) return 'sem dado';
  const c = b.classico, k = b.camarilla;
  return `${b.base}. Clássico: R3 ${fp(c.R3, m)} · R2 ${fp(c.R2, m)} · R1 ${fp(c.R1, m)} · P ${fp(c.P, m)} · S1 ${fp(c.S1, m)} · S2 ${fp(c.S2, m)} · S3 ${fp(c.S3, m)}. Camarilla: R3 ${fp(k.R3, m)} · S3 ${fp(k.S3, m)}`;
};
const juntaTexto = (num: string, ia: unknown) => (typeof ia === 'string' && ia.trim() ? num + ' — ' + ia.trim() : num);

/** Ponto de entrada de UM lado (compra ou venda), sempre com números do servidor; o gatilho (texto) vem da IA. */
export function planoLado(pl: any, lado: 'compra' | 'venda', m: string, mtf: any, gatilho: unknown) {
  if (!pl) return null;
  const quer = lado === 'compra' ? 'alta' : 'baixa', contra = lado === 'compra' ? 'baixa' : 'alta';
  const t = (x: any) => (x && x.tendencia) || 'sem dado';
  const M = t(mtf && mtf.mensal), W = t(mtf && mtf.semanal), D = t(mtf && mtf.diario);
  const favor = [['mensal', M], ['semanal', W], ['diário', D]].filter(([, v]) => v === quer).map(([k]) => k);
  const vsMaior = M === quer && W === quer ? 'A FAVOR' : M === contra || (M !== quer && W === contra) ? 'CONTRA' : 'NEUTRO';
  const tempo = vsMaior === 'A FAVOR' ? 'a favor da tendência do mensal e do semanal'
    : vsMaior === 'CONTRA' ? `contra a tendência maior (mensal em ${M}, semanal em ${W}): só para operação curta, mão reduzida`
    : favor.length ? `a favor do ${favor.join(' e do ')}; tempo maior sem direção clara` : 'tempo maior sem direção clara';
  const agora = pl.atende_3_para_1;
  return {
    lado: lado === 'compra' ? 'COMPRA' : 'VENDA', vs_tempo_maior: vsMaior, tempo,
    entrada: agora ? `${fp(pl.entrada, m)} (preço atual) · risco/retorno ${rrTxt(pl.risco_retorno_1)}`
      : pl.entrada_para_3_para_1 != null ? `${fp(pl.entrada_para_3_para_1, m)} (esperar ${lado === 'compra' ? 'recuo' : 'repique'} até aqui) · risco/retorno 3:1`
      : `sem entrada com 3:1 agora (no preço atual ${fp(pl.entrada, m)} o risco/retorno é ${rrTxt(pl.risco_retorno_1)})`,
    stop: `${fp(pl.stop, m)} (${pl.origem.stop})`,
    alvo_1: `${fp(pl.alvo_1, m)} (${pl.origem.alvo_1})`, alvo_2: `${fp(pl.alvo_2, m)} (${pl.origem.alvo_2})`,
    gatilho: typeof gatilho === 'string' && gatilho.trim() ? gatilho.trim() : '',
    atende_3_para_1: agora || pl.entrada_para_3_para_1 != null,
  };
}

/** Troca os números que a IA escreveu pelos calculados no servidor; a IA fica só com o texto interpretativo. */
export function aplicaCalculos(rel: any, ativos: any[]) {
  if (!rel || !Array.isArray(rel.ativos)) return;
  for (const it of rel.ativos) {
    const a = ativos.find((x) => x.tk === String(it.ticker || '').toUpperCase());
    if (!a || !a.plano) continue;
    const m = a.moeda, i = a.ind, vies = String(it.vies || '').toUpperCase();
    const lado = vies === 'ALTA' ? 'compra' : vies === 'BAIXA' ? 'venda' : null;
    const pl = lado ? a.plano[lado] : null;
    const velho = it.plano_de_trade && typeof it.plano_de_trade === 'object' ? it.plano_de_trade : {};
    const inval = typeof velho.invalidacao === 'string' ? velho.invalidacao.trim() : '';
    if (pl && pl.atende_3_para_1) {
      it.plano_de_trade = {
        entrada: fp(pl.entrada, m), stop: `${fp(pl.stop, m)} (${pl.origem.stop})`,
        alvo_1: `${fp(pl.alvo_1, m)} (${pl.origem.alvo_1})`, alvo_2: `${fp(pl.alvo_2, m)} (${pl.origem.alvo_2})`,
        risco_retorno: `${rrTxt(pl.risco_retorno_1)} = |${fp(pl.alvo_1, m)} − ${fp(pl.entrada, m)}| ÷ |${fp(pl.entrada, m)} − ${fp(pl.stop, m)}|`,
        invalidacao: inval || `Fechamento além do stop em ${fp(pl.stop, m)}`,
      };
    } else {
      const rec = pl && pl.entrada_para_3_para_1 != null
        ? `Esperar recuo até ${fp(pl.entrada_para_3_para_1, m)} deixaria o risco/retorno em 3:1 (stop ${fp(pl.stop, m)}, alvo ${fp(pl.alvo_1, m)}).` : '';
      it.plano_de_trade = {
        entrada: 'sem setup agora', stop: '–', alvo_1: '–', alvo_2: '–',
        risco_retorno: pl ? `${rrTxt(pl.risco_retorno_1)} (abaixo de 3:1)` : 'sem viés definido',
        invalidacao: [inval, rec].filter(Boolean).join(' '),
      };
    }
    const gat = it.gatilhos && typeof it.gatilhos === 'object' ? it.gatilhos : {};
    it.entradas = { compra: planoLado(a.plano.compra, 'compra', m, a.mtf, gat.compra), venda: planoLado(a.plano.venda, 'venda', m, a.mtf, gat.venda) };
    delete it.gatilhos;
    it.pivos_diarios = linhaPivos(a.pivos && a.pivos.diario, m);
    it.pivos_semanais = linhaPivos(a.pivos && a.pivos.semanal, m);
    it.indicadores = juntaTexto(
      `RSI14 ${i.rsi14 ?? 'sem dado'} (${i.rsi_zona ?? 'sem dado'}) · SMA20 ${i.sma20 ?? 'sem dado'} · SMA50 ${i.sma50 ?? 'sem dado'} · SMA200 ${i.sma200 ?? 'sem dado'} · ATR14 ${i.atr14 ?? 'sem dado'} (${i.atr14_pct ?? 'sem dado'}% do preço)`, it.indicadores);
    it.forca_e_volume = juntaTexto(
      `Volume ${i.volume_vs_media20 ?? 'sem dado'}× a média de 20 dias (${i.volume_classe ?? 'sem dado'}) · OBV 20d ${i.obv_tendencia_20d ?? 'sem dado'} · RSI ${i.rsi14 ?? 'sem dado'}${i.volume_pode_estar_parcial ? ' · volume do dia pode estar parcial' : ''}`, it.forca_e_volume);
    it.calculado_pelo_servidor = {
      tendencia: i.tendencia, confluencias: a.confluencias.slice(0, 6), plano_compra: a.plano.compra, plano_venda: a.plano.venda, validacao: a.validacao,
    };
  }
  const c = rel.conclusao;
  if (c && rel.ativos.length === 1) {
    const a = ativos.find((x) => x.tk === String(rel.ativos[0].ticker || '').toUpperCase());
    const rec = String(c.recomendacao || '').toUpperCase();
    c.preco_alvo = a && a.plano ? (rec === 'COMPRAR' && a.plano.compra ? a.plano.compra.alvo_1 : rec === 'VENDER' && a.plano.venda ? a.plano.venda.alvo_1 : null) : null;
    c.preco_alvo_origem = 'calculado pelo servidor (alvo 1 do plano)';
  } else if (c) c.preco_alvo = null;
}


// ===== valuation =====
// supabase/functions/analise/valuation.ts
// Referências de valuation calculadas pelo código (a IA só interpreta). Funções puras, testadas em valuation.test.ts.
const ok = (x: unknown): x is number => typeof x === 'number' && isFinite(x);
const r = (x: number | null, d = 2) => (x == null || !isFinite(x) ? null : +x.toFixed(d));
const br = (x: number | null) => (x == null ? 'sem dado' : x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

export type Macro = { selic_pct: number | null; ipca12_pct: number | null; juro_real_pct: number | null; data: string | null };

/** Juro real (Fisher): (1+Selic)/(1+IPCA) − 1. */
export const juroReal = (selic: number | null, ipca: number | null) =>
  ok(selic) && ok(ipca) ? r(((1 + selic / 100) / (1 + ipca / 100) - 1) * 100) : null;

/**
 * f: fundamentos do Yahoo (frações como 0,18 = 18%). Devolve múltiplos derivados e preços de referência,
 * sempre com a conta explícita para a IA citar.
 */
export function referencias(f: any, macro: Macro | null) {
  const px = ok(f.preco) ? f.preco : null;
  const lpa = ok(f.lpa) ? f.lpa : ok(f.pl) && px ? px / f.pl : null;
  const vpa = ok(f.vpa) ? f.vpa : ok(f.p_vp) && px ? px / f.p_vp : null;
  const ey = ok(f.pl) && f.pl > 0 ? 100 / f.pl : null;
  const fcfy = ok(f.fluxo_caixa_livre) && ok(f.valor_mercado) && f.valor_mercado > 0 ? (f.fluxo_caixa_livre / f.valor_mercado) * 100 : null;
  const dpa = ok(f.dividendo_por_acao) ? f.dividendo_por_acao : ok(f.dividend_yield) && px ? f.dividend_yield * px : null;
  const graham = lpa != null && vpa != null && lpa > 0 && vpa > 0 ? Math.sqrt(22.5 * lpa * vpa) : null;
  const bazin = dpa != null && dpa > 0 ? dpa / 0.06 : null;
  const roe = ok(f.roe) ? f.roe * 100 : null;
  const up = (alvo: number | null) => (alvo != null && px ? r((alvo / px - 1) * 100, 1) : null);
  const selic = macro?.selic_pct ?? null;
  return {
    preco: r(px), lpa: r(lpa, 4), vpa: r(vpa, 4), dividendo_por_acao_12m: r(dpa, 4),
    earnings_yield_pct: r(ey), fcf_yield_pct: r(fcfy),
    premio_earnings_yield_sobre_selic_pp: ey != null && ok(selic) ? r(ey - selic) : null,
    roe_menos_selic_pp: roe != null && ok(selic) ? r(roe - selic) : null,
    graham: { valor: r(graham), conta: graham != null ? `√(22,5 × LPA ${br(lpa)} × VPA ${br(vpa)})` : null, upside_pct: up(graham) },
    bazin_6pct: { valor: r(bazin), conta: bazin != null ? `dividendos 12m por ação ${br(dpa)} ÷ 6%` : null, upside_pct: up(bazin) },
    alvo_medio_analistas: { valor: r(ok(f.alvo_medio_analistas) ? f.alvo_medio_analistas : null), upside_pct: up(ok(f.alvo_medio_analistas) ? f.alvo_medio_analistas : null) },
    posicao_52s_pct: ok(f.max_52s) && ok(f.min_52s) && px && f.max_52s > f.min_52s ? r(((px - f.min_52s) / (f.max_52s - f.min_52s)) * 100, 0) : null,
    observacao: 'Graham e Bazin são referências simples (Graham para empresas lucrativas com patrimônio; Bazin para pagadoras de dividendos estáveis). Nenhuma delas é preço-alvo por si só.',
  };
}

export type Cenario = { cenario?: string; probabilidade_pct?: number; preco?: number | null };
/** Margem de segurança exigida para comprar, pela qualidade do negócio. */
export const MARGEM: Record<string, number> = { ALTA: 15, MEDIA: 20, BAIXA: 30 };

/**
 * Preço justo = média dos preços dos cenários ponderada pela probabilidade (só se todos tiverem preço e as
 * probabilidades somarem entre 90% e 110%; preços fora de 0,2× a 5× o preço atual são descartados).
 * Preço-teto = preço justo × (1 − margem de segurança). Zona:
 *   preço ≤ teto → COMPRAR · teto < preço ≤ justo → MANTER (comprar só abaixo do teto)
 *   justo < preço ≤ justo × 1,15 → MANTER (sem aumentar) · acima disso → REDUZIR · acima de 1,3× (ou 1,15× com qualidade BAIXA) → VENDER
 */
export function decisao(cen: Cenario[] | null | undefined, preco: number | null, qualidade: string, pos: { preco_medio?: number | null; quantidade?: number | null; peso_pct?: number | null } | null) {
  const q = String(qualidade || '').toUpperCase().replace('É', 'E'), mg = MARGEM[q] ?? 20;
  const L = (Array.isArray(cen) ? cen : []).filter((c) => c && typeof c === 'object');
  const val = L.length >= 2 && preco && preco > 0 && L.every((c) => ok(c.preco) && ok(c.probabilidade_pct) && c.preco! >= preco * 0.2 && c.preco! <= preco * 5);
  const soma = val ? L.reduce((s, c) => s + (c.probabilidade_pct as number), 0) : 0;
  const posicao = pos && ok(pos.preco_medio) && pos.preco_medio > 0 && ok(preco)
    ? { preco_medio: r(pos.preco_medio), quantidade: pos.quantidade ?? null, peso_pct: r(pos.peso_pct ?? null, 1), resultado_pct: r((preco / pos.preco_medio - 1) * 100, 1) } : null;
  if (!val || soma < 90 || soma > 110) return { preco_justo: null, preco_teto: null, margem_pct: mg, zona: 'SEM DADO', upside_pct: null, conta: 'cenários sem preço ou probabilidades inválidas', posicao };
  const justo = L.reduce((s, c) => s + (c.preco as number) * (c.probabilidade_pct as number), 0) / soma, teto = justo * (1 - mg / 100), p = preco as number;
  const zona = p <= teto ? 'COMPRAR' : p <= justo ? 'MANTER' : p <= justo * 1.15 ? 'MANTER' : p > justo * (q === 'BAIXA' ? 1.15 : 1.3) ? 'VENDER' : 'REDUZIR';
  const nivel = p <= teto ? 'abaixo do preço-teto' : p <= justo ? 'entre o preço-teto e o preço justo' : p <= justo * 1.15 ? 'até 15% acima do preço justo' : 'bem acima do preço justo';
  return {
    preco_justo: r(justo), preco_teto: r(teto), margem_pct: mg, zona, situacao: nivel, upside_pct: r((justo / p - 1) * 100, 1),
    conta: L.map((c) => `${br(c.preco as number)} × ${c.probabilidade_pct}%`).join(' + ') + (Math.abs(soma - 100) > 0.01 ? ` ÷ ${soma}%` : '') + ` = ${br(justo)}; teto = ${br(justo)} × (1 − ${mg}%) = ${br(teto)}`,
    posicao,
  };
}

// ===== json tolerante =====
// supabase/functions/analise/json.ts — lê o JSON da IA mesmo com defeitos comuns:
// cercas ```json, texto antes/depois, quebra de linha crua dentro de texto, barra invertida inválida,
// vírgula sobrando, vírgula faltando entre itens e resposta cortada no meio (fecha o que ficou aberto).
// Mesmo código no app (extras2.js, seção 34): mantenha os dois iguais.
export function jsonTolerante(x: unknown): any {
  if (typeof x !== 'string') return null;
  const t0 = x.replace(/```(?:json)?/gi, '');
  const i0 = t0.indexOf('{');
  if (i0 < 0) return null;
  const t = t0.slice(i0);
  const VAL = '"\\/bfnrtu';
  let out = '', inStr = false, pilha: string[] = [], prev = '';
  const tenta = (s: string) => { try { return JSON.parse(s); } catch { return undefined; } };
  for (let k = 0; k < t.length; k++) {
    const ch = t[k];
    if (inStr) {
      if (ch === '\\') { const nx = t[k + 1]; if (nx !== undefined && VAL.includes(nx)) { out += ch + nx; k++; } else out += '\\\\'; continue; }
      if (ch === '"') { inStr = false; out += ch; prev = '"'; continue; }
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') continue;
      if (ch === '\t') { out += '\\t'; continue; }
      out += ch; continue;
    }
    if (/\s/.test(ch)) { out += ch; continue; }
    // vírgula faltando: um valor termina e outro começa logo em seguida
    if ((ch === '"' || ch === '{' || ch === '[') && (prev === '"' || prev === '}' || prev === ']' || /[0-9el]/.test(prev)) && pilha.length) out += ',';
    if (ch === '"') { inStr = true; out += ch; prev = ''; continue; }
    if (ch === '{' || ch === '[') { pilha.push(ch === '{' ? '}' : ']'); out += ch; prev = ch; continue; }
    if (ch === '}' || ch === ']') {
      out = out.replace(/,\s*$/, '');
      pilha.pop(); out += ch; prev = ch;
      if (!pilha.length) { const v = tenta(out); if (v !== undefined) return v; break; }
      continue;
    }
    out += ch; prev = ch;
  }
  // cortado no meio (ou defeito sem conserto direto): volta até um ponto seguro e fecha o que ficou aberto
  let s = inStr ? out + '"' : out;
  for (let volta = 0; volta < 80 && s.length > 1; volta++) {
    const z = s.replace(/[\s,:]+$/, '');
    const fech = fechamentos(z);
    if (fech !== null) { const v = tenta(z + fech); if (v !== undefined) return v; }
    const c = ultimoCorte(s);
    if (c <= 0) break;
    s = s.slice(0, c);
  }
  return null;
}
/** O que falta fechar (null se terminar dentro de texto). */
function fechamentos(s: string): string | null {
  const p: string[] = []; let inS = false;
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (inS) { if (ch === '\\') k++; else if (ch === '"') inS = false; continue; }
    if (ch === '"') inS = true; else if (ch === '{') p.push('}'); else if (ch === '[') p.push(']'); else if (ch === '}' || ch === ']') p.pop();
  }
  return inS ? null : p.reverse().join('');
}
/** Posição da última vírgula ou abertura fora de texto (para descartar o item incompleto). */
function ultimoCorte(s: string): number {
  let inS = false, ult = -1;
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (inS) { if (ch === '\\') k++; else if (ch === '"') inS = false; continue; }
    if (ch === '"') inS = true; else if (ch === ',') ult = k; else if (ch === '{' || ch === '[') ult = k + 1;
  }
  return ult >= s.length ? s.length - 1 : ult;
}

// ===== coerência dos fundamentos =====
// supabase/functions/analise/coerencia.ts
// Confere e corrige os fundamentos do Yahoo antes de irem para a IA. Funções puras, testadas em coerencia.test.ts.
// Problemas conhecidos do Yahoo com ações da B3:
//  1) balanço em outra moeda (ex.: Embraer em dólar) com preço em real: P/L, P/VP e valores ficam misturados;
//  2) P/L e P/VP calculados com dados velhos: refazemos preço ÷ LPA e preço ÷ VPA;
//  3) dividend yield às vezes vem em % em vez de fração, ou vazio: refazemos com os proventos pagos nos últimos 12 meses;
//  4) bancos: EBITDA, margem bruta, dívida/PL e dívida/EBITDA não fazem sentido e confundem a análise.
const okC = (x: unknown): x is number => typeof x === 'number' && isFinite(x);
const rC = (x: number, d = 4) => +x.toFixed(d);

export type Extras = { moedaPreco?: string | null; moedaBalanco?: string | null; fx?: number | null; proventos12m?: number | null };

export function ehBanco(f: any): boolean {
  return /financial/i.test(f.setor || '') && /bank|banco/i.test(f.industria || '');
}

export function ajustaFundamentos(f0: any, ex: Extras = {}): { f: any; notas: string[] } {
  const f: any = { ...f0 }, notas: string[] = [];
  const px = okC(f.preco) && f.preco > 0 ? f.preco : null;

  // 1) moeda do balanço diferente da moeda do preço
  const mp = (ex.moedaPreco || '').toUpperCase(), mb = (ex.moedaBalanco || '').toUpperCase();
  if (mp && mb && mp !== mb) {
    if (okC(ex.fx) && ex.fx > 0) {
      for (const k of ['lpa', 'lpa_projetado', 'vpa', 'receita', 'ebitda', 'divida_bruta', 'caixa', 'fluxo_caixa_operacional', 'fluxo_caixa_livre']) if (okC(f[k])) f[k] = rC(f[k] * ex.fx, 4);
      notas.push(`Balanço em ${mb} e preço em ${mp}: LPA, VPA e valores convertidos pela cotação ${mb}/${mp} ${ex.fx.toFixed(4)}.`);
      f.moeda_balanco_original = mb;
    } else {
      for (const k of ['pl', 'p_vp', 'ev_ebitda', 'lpa', 'vpa', 'pl_projetado', 'lpa_projetado']) f[k] = null;
      notas.push(`Balanço em ${mb} e preço em ${mp}, sem cotação para converter: P/L, P/VP e EV/EBITDA ficaram sem dado para não misturar moedas.`);
    }
  }

  // 2) múltiplos refeitos pela conta (preço atual ÷ dado por ação)
  if (px && okC(f.lpa)) {
    if (f.lpa > 0) { const pl = rC(px / f.lpa, 2); if (okC(f.pl) && Math.abs(pl / f.pl - 1) > 0.15) notas.push(`P/L refeito pela conta: ${pl.toFixed(2)} (o Yahoo mostrava ${f.pl.toFixed(2)}).`); f.pl = pl; }
    else { f.pl = null; notas.push('Prejuízo nos últimos 12 meses (LPA negativo): P/L não se aplica.'); }
  }
  if (px && okC(f.lpa_projetado) && f.lpa_projetado > 0) f.pl_projetado = rC(px / f.lpa_projetado, 2);
  if (px && okC(f.vpa)) {
    if (f.vpa > 0) { const pvp = rC(px / f.vpa, 2); if (okC(f.p_vp) && Math.abs(pvp / f.p_vp - 1) > 0.15) notas.push(`P/VP refeito pela conta: ${pvp.toFixed(2)} (o Yahoo mostrava ${f.p_vp.toFixed(2)}).`); f.p_vp = pvp; }
    else { f.p_vp = null; notas.push('Patrimônio líquido negativo: P/VP não se aplica.'); }
  }
  if (!okC(f.roe) && okC(f.lpa) && okC(f.vpa) && f.vpa > 0) f.roe = rC(f.lpa / f.vpa, 4);
  if (okC(f.roe) && Math.abs(f.roe) > 1.5) { notas.push(`ROE de ${(f.roe * 100).toFixed(0)}% parece fora da realidade no Yahoo: descartado.`); f.roe = null; }

  // 3) dividendos: proventos pagos nos últimos 12 meses ÷ preço
  if (px && okC(ex.proventos12m) && ex.proventos12m >= 0) {
    f.dividendo_por_acao = rC(ex.proventos12m, 4);
    f.dividend_yield = rC(ex.proventos12m / px, 4);
    if (okC(f.lpa) && f.lpa > 0) f.payout = rC(ex.proventos12m / f.lpa, 4);
    f.dividendos_fonte = 'proventos pagos nos últimos 12 meses (dividendos e JCP) ÷ preço atual';
  } else if (okC(f.dividend_yield) && f.dividend_yield > 1) {
    f.dividend_yield = rC(f.dividend_yield / 100, 4); // veio em % em vez de fração
  }
  if (okC(f.dividend_yield) && f.dividend_yield > 0.3) notas.push(`Dividend yield de ${(f.dividend_yield * 100).toFixed(1)}% é muito alto: pode ter provento extraordinário nos últimos 12 meses.`);

  // EV/EBITDA e dívida líquida/EBITDA refeitos na mesma moeda
  if (okC(f.ebitda) && f.ebitda > 0 && okC(f.divida_bruta) && okC(f.caixa)) {
    f.div_liq_ebitda = rC((f.divida_bruta - f.caixa) / f.ebitda, 2);
    if (okC(f.valor_mercado)) f.ev_ebitda = rC((f.valor_mercado + f.divida_bruta - f.caixa) / f.ebitda, 2);
  }

  // 4) bancos
  if (ehBanco(f)) {
    for (const k of ['ev_ebitda', 'margem_bruta', 'margem_ebitda', 'div_liq_ebitda', 'divida_pl_pct', 'liquidez_corrente', 'ebitda', 'divida_bruta', 'caixa', 'fluxo_caixa_livre', 'fluxo_caixa_operacional', 'valor_da_firma']) f[k] = null;
    notas.push('Banco: EBITDA, margem bruta, dívida/PL e dívida/EBITDA não se aplicam. Avalie por P/L, P/VP, ROE, dividendos e crescimento do lucro.');
  }
  return { f, notas };
}

// ===== checklist e histórico =====
// supabase/functions/analise/checklist.ts
// Histórico (dividend yield por ano, receita e lucro) e checklist de qualidade no estilo "Buy and Hold".
// Funções puras, testadas em checklist.test.ts.
const okH = (x: unknown): x is number => typeof x === 'number' && isFinite(x);
const rH = (x: number, d = 2) => +x.toFixed(d);

export type Mes = { t: number; c: number };       // fechamento mensal (t em segundos)
export type Provento = { t: number; v: number };  // data com e valor por ação
export type AnoDY = { ano: number; proventos: number; preco: number | null; dy_pct: number | null; parcial?: boolean };

const anoDe = (t: number) => new Date(t * 1000).getUTCFullYear();

/** Dividend yield de cada ano: proventos com data no ano ÷ fechamento do último mês do ano (ano corrente: ÷ preço atual). */
export function dyPorAno(meses: Mes[], prov: Provento[], agoraMs = Date.now(), precoAtual: number | null = null, anos = 10): AnoDY[] {
  const atual = new Date(agoraMs).getUTCFullYear();
  const fech = new Map<number, number>();
  for (const m of [...meses].sort((a, b) => a.t - b.t)) if (okH(m.c) && m.c > 0) fech.set(anoDe(m.t), m.c);
  const soma = new Map<number, number>();
  for (const p of prov) if (okH(p.v) && p.v > 0) soma.set(anoDe(p.t), (soma.get(anoDe(p.t)) || 0) + p.v);
  const primeiro = Math.min(...[...fech.keys(), atual]);
  const out: AnoDY[] = [];
  for (let a = atual - anos + 1; a <= atual; a++) {
    if (a < primeiro) continue;
    const pv = soma.get(a) || 0, parcial = a === atual;
    const preco = parcial ? (okH(precoAtual) && precoAtual > 0 ? precoAtual : fech.get(a) ?? null) : fech.get(a) ?? null;
    out.push({ ano: a, proventos: rH(pv, 4), preco: preco == null ? null : rH(preco, 2), dy_pct: preco ? rH((pv / preco) * 100, 2) : null, ...(parcial ? { parcial: true } : {}) });
  }
  return out;
}

/** Crescimento médio anual (CAGR) entre o primeiro e o último valor positivo, usando até n anos. */
export function cagr(serie: { ano: number; valor: number | null }[], n = 5): { pct: number | null; anos: number } {
  const s = serie.filter((x) => okH(x.valor)).sort((a, b) => a.ano - b.ano).slice(-(n + 1));
  if (s.length < 2) return { pct: null, anos: 0 };
  const a = s[0], b = s[s.length - 1], k = b.ano - a.ano;
  if (k <= 0 || !(a.valor! > 0) || !(b.valor! > 0)) return { pct: null, anos: k };
  return { pct: rH((Math.pow(b.valor! / a.valor!, 1 / k) - 1) * 100, 1), anos: k };
}

export type ItemCheck = { id: string; criterio: string; ok: boolean | null; valor: string };
export type EntradaCheck = {
  anosListada: number | null; roe: number | null /* fração */; receitas: { ano: number; valor: number | null }[]; lucros: { ano: number; valor: number | null }[];
  lucrosTri?: { data: string; valor: number | null }[]; liquidezDia: number | null /* R$ por dia */; usdbrl?: number | null;
  dyAnos: AnoDY[]; dividaPL: number | null /* em % (Yahoo) */; banco: boolean; margemLiquida: number | null /* fração */;
};
const pc = (x: number | null, d = 1) => (x == null ? 'sem dado' : x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%');
const mi = (x: number, m = 'R$') => m + ' ' + (x / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';

/** Checklist do investidor Buy and Hold (mesmos critérios e ordem do Investidor10; a nota dos usuários deles vira margem líquida). ok = null quando falta dado. */
export function checklist(e: EntradaCheck): { itens: ItemCheck[]; pontos: number; avaliados: number } {
  const it: ItemCheck[] = [];
  it.push({ id: 'listada', criterio: 'Empresa com mais de 5 anos de Bolsa', ok: e.anosListada == null ? null : e.anosListada >= 5, valor: e.anosListada == null ? 'sem dado' : `${Math.floor(e.anosListada)} anos de bolsa` });
  const lv = e.lucros.filter((x) => okH(x.valor));
  it.push({ id: 'prejuizo', criterio: 'Empresa nunca deu prejuízo (ano fiscal)', ok: lv.length ? lv.every((x) => x.valor! > 0) : null, valor: lv.length ? (lv.every((x) => x.valor! > 0) ? `lucro em todos os ${lv.length} anos disponíveis` : `prejuízo em ${lv.filter((x) => x.valor! <= 0).map((x) => x.ano).join(', ')}`) : 'sem dado' });
  const tri = (e.lucrosTri || []).filter((x) => okH(x.valor));
  it.push({ id: 'trimestres', criterio: 'Empresa com lucro nos últimos 20 trimestres (5 anos)', ok: tri.length ? tri.every((x) => x.valor! > 0) : (lv.length ? lv.every((x) => x.valor! > 0) || null : null), valor: tri.length ? (tri.every((x) => x.valor! > 0) ? `lucro em todos os ${tri.length} trimestres disponíveis` : `prejuízo em ${tri.filter((x) => x.valor! <= 0).length} trimestre(s)`) : 'sem dado trimestral (usa os anos)' });
  const cinco = e.dyAnos.filter((x) => !x.parcial && okH(x.dy_pct)).slice(-5);
  const dyM = cinco.length >= 3 ? cinco.reduce((s, x) => s + x.dy_pct!, 0) / cinco.length : null;
  it.push({ id: 'dy', criterio: 'Empresa pagou +5% de dividendos/ano nos últimos 5 anos', ok: dyM == null ? null : dyM > 5, valor: dyM == null ? 'sem dado' : `média de ${pc(dyM)} ao ano${cinco.length < 5 ? ` (${cinco.length} anos)` : ''}` });
  it.push({ id: 'roe', criterio: 'Empresa possui ROE acima de 10%', ok: okH(e.roe) ? e.roe > 0.1 : null, valor: okH(e.roe) ? 'ROE ' + pc(e.roe * 100) : 'sem dado' });
  it.push({ id: 'divida', criterio: 'Empresa possui dívida menor que patrimônio', ok: e.banco ? null : okH(e.dividaPL) ? e.dividaPL < 100 : null, valor: e.banco ? 'não se aplica a bancos' : okH(e.dividaPL) ? `dívida bruta = ${(e.dividaPL / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x o patrimônio` : 'sem dado' });
  const cr = cagr(e.receitas), cl = cagr(e.lucros);
  it.push({ id: 'receita', criterio: 'Empresa apresentou crescimento de receita nos últimos 5 anos', ok: cr.pct == null ? null : cr.pct > 10, valor: cr.pct == null ? 'sem dado' : `${pc(cr.pct)} ao ano${cr.anos < 5 ? ` (em ${cr.anos} anos)` : ''} · critério: acima de 10%` });
  it.push({ id: 'lucro', criterio: 'Empresa apresentou crescimento de lucros nos últimos 5 anos', ok: cl.pct == null ? null : cl.pct > 10, valor: cl.pct == null ? 'sem dado' : `${pc(cl.pct)} ao ano${cl.anos < 5 ? ` (em ${cl.anos} anos)` : ''} · critério: acima de 10%` });
  const usd = okH(e.liquidezDia) && okH(e.usdbrl) && e.usdbrl! > 0 ? e.liquidezDia / e.usdbrl! : null;
  it.push({ id: 'liquidez', criterio: 'Empresa possui liquidez diária acima de US$ 2M', ok: usd != null ? usd > 2e6 : okH(e.liquidezDia) ? e.liquidezDia > 2e6 * 5.5 : null, valor: okH(e.liquidezDia) ? mi(e.liquidezDia) + ' por dia' + (usd != null ? ` (${mi(usd, 'US$')})` : '') : 'sem dado' });
  it.push({ id: 'margem', criterio: 'Empresa possui margem líquida acima de 10%', ok: okH(e.margemLiquida) ? e.margemLiquida > 0.1 : null, valor: okH(e.margemLiquida) ? pc(e.margemLiquida * 100) : 'sem dado' });
  return { itens: it, pontos: it.filter((x) => x.ok === true).length, avaliados: it.filter((x) => x.ok !== null).length };
}

/** Rentabilidade (com proventos reinvestidos, pelo preço ajustado) em 1 e 3 meses e 1, 2, 5 e 10 anos. */
export function rentabilidade(adj: Mes[]): Record<string, number | null> {
  const m = adj.filter((x) => okH(x.c) && x.c > 0).sort((a, b) => a.t - b.t), n = m.length, u = n ? m[n - 1].c : null;
  const r = (k: number) => (u != null && n > k ? rH((u / m[n - 1 - k].c - 1) * 100, 2) : null);
  return { m1: r(1), m3: r(3), a1: r(12), a2: r(24), a5: r(60), a10: r(120) };
}

/** R$ 1.000 aplicados há `meses` meses: ativo (preço ajustado), índice (fechamentos) e CDI/IPCA (taxas mensais em %). */
export function comparaIndices(o: { ativo: Mes[]; ibov?: Mes[]; cdi?: { mes: string; pct: number }[]; ipca?: { mes: string; pct: number }[]; meses?: number }) {
  const N = o.meses ?? 60, mes = (t: number) => new Date(t * 1000).toISOString().slice(0, 7);
  const at = o.ativo.filter((x) => okH(x.c) && x.c > 0).sort((a, b) => a.t - b.t).slice(-(N + 1));
  if (at.length < 13) return null;
  const meses = at.map((x) => mes(x.t)), base = at[0].c;
  const serieAtivo = at.map((x) => rH((1000 * x.c) / base, 2));
  const ib = new Map((o.ibov || []).filter((x) => okH(x.c)).map((x) => [mes(x.t), x.c]));
  const ib0 = ib.get(meses[0]);
  const serieIbov = ib0 ? meses.map((k) => (ib.get(k) ? rH((1000 * ib.get(k)!) / ib0, 2) : null)) : null;
  const acum = (tx?: { mes: string; pct: number }[]) => { if (!tx || !tx.length) return null; const m = new Map(tx.map((x) => [x.mes, x.pct])); let v = 1000; return meses.map((k, i) => { if (i > 0) { const p = m.get(k); if (okH(p)) v *= 1 + p / 100; } return rH(v, 2); }); };
  return { meses, ativo: serieAtivo, ibov: serieIbov, cdi: acum(o.cdi), ipca: acum(o.ipca) };
}

// ===== plano do trader =====
// supabase/functions/analise/planotrader.ts — plano marcado pelo próprio trader (Fibonacci no print ou digitado).
// Função pura, testada em planotrader.test.ts.
const okP = (x: unknown): x is number => typeof x === 'number' && isFinite(x);
const numP = (x: unknown): number | null => {
  if (okP(x)) return x;
  if (typeof x !== 'string') return null;
  const s = x.replace(/[^\d,.\-]/g, ''); if (!s) return null;
  const v = +(/,\d{1,4}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s.replace(/,/g, ''));
  return isFinite(v) ? v : null;
};
export type PlanoTrader = { lado: 'COMPRA' | 'VENDA'; entrada: number; stop: number; alvos: number[]; rr: number[]; risco_pct: number; valido: true } | { valido: false; erro: string };

/** Confere o plano: stop do lado certo, alvos na direção do trade, risco/retorno de cada alvo. */
export function normalizaPlano(p: any): PlanoTrader {
  if (!p || typeof p !== 'object') return { valido: false, erro: 'sem plano' };
  const lado = /VEND|SELL|SHORT/i.test(String(p.lado || '')) ? 'VENDA' : 'COMPRA';
  const e = numP(p.entrada), st = numP(p.stop);
  const al = (Array.isArray(p.alvos) ? p.alvos : [p.alvo_1, p.alvo_2, p.alvo_3]).map(numP).filter((v: number | null): v is number => v != null && v > 0);
  if (e == null || st == null || e <= 0 || st <= 0) return { valido: false, erro: 'entrada e stop são obrigatórios' };
  if (lado === 'COMPRA' ? st >= e : st <= e) return { valido: false, erro: lado === 'COMPRA' ? 'na compra o stop fica abaixo da entrada' : 'na venda o stop fica acima da entrada' };
  const d = lado === 'COMPRA' ? 1 : -1, risco = Math.abs(e - st);
  const alvos = al.filter((a: number) => (a - e) * d > 0).sort((a: number, b: number) => (a - b) * d).slice(0, 4);
  if (!alvos.length) return { valido: false, erro: 'pelo menos um alvo na direção do trade' };
  return { lado, entrada: e, stop: st, alvos, rr: alvos.map((a: number) => +(((a - e) * d) / risco).toFixed(2)), risco_pct: +((risco / e) * 100).toFixed(2), valido: true };
}

// ===== servidor =====
// Economista IA: explica notícias e cenários (sem viés, sem recomendação de compra ou venda).
export const SYS_ECO = `Você é um economista sênior com mestrado e doutorado em Economia (macroeconomia, política monetária, finanças internacionais e mercados emergentes), com experiência em mesa de operações e em pesquisa acadêmica. Você conversa com um trader brasileiro que opera mini-índice (WIN), mini-dólar (WDO) no day trade e ações da B3 no swing trade, e quer ENTENDER o que está acontecendo.

Princípios (obrigatórios):
- Sem viés político, partidário ou ideológico. Não torça por governo, partido, banco central ou escola econômica. Quando economistas sérios divergem, apresente as leituras principais (por exemplo, keynesiana x monetarista, ortodoxa x heterodoxa) e diga em que evidência cada uma se apoia.
- Separe FATO (o que aconteceu, com número e fonte), INTERPRETAÇÃO (o que isso costuma significar) e INCERTEZA (o que ainda não se sabe).
- Use a busca na web para confirmar a notícia e os números recentes (Selic, IPCA, payroll, Fed, dólar, petróleo, minério etc.). Nunca invente número, data, declaração ou fonte. Se não encontrar a notícia ou não conseguir confirmar, diga isso claramente em "resumo" e baixe a "confianca".
- Explique de forma didática, como um professor muito bom: frases claras, termos técnicos explicados no glossário, nada de enrolação.
- Ligue sempre ao mercado brasileiro: efeito provável em Ibovespa/WIN, dólar/WDO, juros futuros (DI), setores e ações mais sensíveis, e também em S&P 500, Treasuries, petróleo e minério quando fizer sentido. Explique o mecanismo (o porquê), não só a direção.
- Cenários com probabilidades que somam 100, gatilhos objetivos que confirmariam cada um, e o que observar (dados, datas, falas).
- Traga o melhor argumento contrário à sua leitura principal ("contraponto").
- Não dê recomendação de compra ou venda de ativo nem preço-alvo. Fale de cenários, riscos e do que monitorar. Se o usuário pedir "compro ou vendo?", explique os fatores e devolva a decisão para ele.
- Se a pergunta for simples (ex.: "o que é curva de juros invertida?"), responda direto em "explicacao" e deixe listas vazias quando não fizerem sentido.
- Responda em português do Brasil.

Responda SOMENTE com um JSON válido, sem texto fora dele, neste formato:
{
  "titulo": "título curto do assunto",
  "resumo": "2 a 3 frases: o que aconteceu e por que importa para quem opera na B3",
  "explicacao": ["parágrafo 1", "parágrafo 2", "..."],
  "fatos": ["fato confirmado com número e fonte", "..."],
  "impactos": [{"mercado": "Ibovespa / WIN | Dólar / WDO | Juros futuros (DI) | S&P 500 | Petróleo | Minério | setor ou ação", "direcao": "alta | baixa | neutro | incerto", "porque": "mecanismo em 1 a 2 frases"}],
  "cenarios": [{"nome": "Base | Otimista | Pessimista", "probabilidade_pct": 50, "descricao": "o que acontece", "gatilhos": "o que confirmaria"}],
  "o_que_observar": ["dado, evento ou fala + quando", "..."],
  "visoes": [{"escola": "leitura/escola", "argumento": "o que ela diz e por quê"}],
  "contraponto": "o melhor argumento contra a leitura principal",
  "glossario": [{"termo": "termo técnico", "significado": "explicação simples"}],
  "confianca": "alta | média | baixa",
  "fontes": ["veículo ou órgão consultado"]
}`;

/** Texto limpo; se passar do limite, corta no fim de uma palavra e põe reticências (nunca no meio da palavra). */
const txt = (v: any, n = 1200) => { const s = (v == null ? '' : String(v)).replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n), k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[,;:.\s-]+$/, '') + '…'; };
const arr = (v: any) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
const DIR = ['alta', 'baixa', 'neutro', 'incerto'];

/** Arruma a resposta da IA: tipos certos, listas limitadas, probabilidades somando 100. */
const ECO_VAZIO = () => ({ titulo: 'Resposta', resumo: '', explicacao: [] as string[], fatos: [] as string[], impactos: [] as { mercado: string; direcao: string; porque: string }[], cenarios: [] as { nome: string; probabilidade_pct: number; descricao: string; gatilhos: string }[], o_que_observar: [] as string[], visoes: [] as { escola: string; argumento: string }[], contraponto: '', glossario: [] as { termo: string; significado: string }[], confianca: 'baixa', fontes: [] as string[] });
export type Eco = ReturnType<typeof ECO_VAZIO>;
export function normalizaEco(r: any): Eco {
  if (!r || typeof r !== 'object') return { ...ECO_VAZIO(), explicacao: [txt(r, 4000)].filter(Boolean) };
  if (r.texto_bruto) return { ...ECO_VAZIO(), explicacao: [txt(r.texto_bruto, 6000)] };
  const cen = arr(r.cenarios).map((c: any) => ({ nome: txt(c?.nome, 160) || 'Cenário', probabilidade_pct: Math.max(0, Math.min(100, Math.round(+c?.probabilidade_pct || 0))), descricao: txt(c?.descricao, 1500), gatilhos: txt(c?.gatilhos, 900) })).filter((c) => c.descricao).slice(0, 4);
  const soma = cen.reduce((s, c) => s + c.probabilidade_pct, 0);
  if (cen.length && soma > 0 && soma !== 100) { cen.forEach((c) => { c.probabilidade_pct = Math.round(c.probabilidade_pct / soma * 100); }); const d = 100 - cen.reduce((s, c) => s + c.probabilidade_pct, 0); cen[0].probabilidade_pct += d; }
  const dirN = (d: any) => { const s = txt(d, 20).toLowerCase(); return DIR.find((x) => s.startsWith(x.slice(0, 4))) || 'incerto'; };
  const conf = txt(r.confianca, 10).toLowerCase();
  return {
    titulo: txt(r.titulo, 200) || 'Resposta',
    resumo: txt(r.resumo, 1400),
    explicacao: arr(r.explicacao).map((x: any) => txt(x, 1500)).filter(Boolean).slice(0, 10),
    fatos: arr(r.fatos).map((x: any) => txt(x, 900)).filter(Boolean).slice(0, 10),
    impactos: arr(r.impactos).map((x: any) => ({ mercado: txt(x?.mercado, 140), direcao: dirN(x?.direcao), porque: txt(x?.porque, 900) })).filter((x) => x.mercado).slice(0, 10),
    cenarios: cen,
    o_que_observar: arr(r.o_que_observar).map((x: any) => txt(x, 600)).filter(Boolean).slice(0, 8),
    visoes: arr(r.visoes).map((x: any) => ({ escola: txt(x?.escola, 160), argumento: txt(x?.argumento, 1400) })).filter((x) => x.argumento).slice(0, 4),
    contraponto: txt(r.contraponto, 1600),
    glossario: arr(r.glossario).map((x: any) => ({ termo: txt(x?.termo, 120), significado: txt(x?.significado, 700) })).filter((x) => x.termo && x.significado).slice(0, 8),
    confianca: conf.startsWith('alt') ? 'alta' : conf.startsWith('m') ? 'média' : 'baixa',
    fontes: arr(r.fontes).map((x: any) => txt(x, 200)).filter(Boolean).slice(0, 10),
  };
}

// ===== servidor =====
// Estudo quantitativo (o que se faria com Python/Pandas): estatísticas do próprio histórico do ativo,
// calculadas no servidor, para a IA basear a análise em números e não em impressão.

const q2 = (x: number, d = 2) => +x.toFixed(d);
const pct = (x: number) => q2(x * 100, 2);

/** Médias móveis simples em série (null até ter n candles). */
function smaS(a: number[], n: number): (number | null)[] {
  const o: (number | null)[] = []; let s = 0;
  for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; o.push(i >= n - 1 ? s / n : null); }
  return o;
}
/** ATR de Wilder (14) em série. */
function atrS(H: number[], L: number[], C: number[], n = 14): (number | null)[] {
  const o: (number | null)[] = []; let a: number | null = null, s = 0;
  for (let i = 0; i < C.length; i++) {
    const tr = i ? Math.max(H[i] - L[i], Math.abs(H[i] - C[i - 1]), Math.abs(L[i] - C[i - 1])) : H[i] - L[i];
    if (i < n) { s += tr; a = i === n - 1 ? s / n : null; } else a = ((a as number) * (n - 1) + tr) / n;
    o.push(a);
  }
  return o;
}
/** RSI de Wilder (14) em série. */
function rsiS(C: number[], n = 14): (number | null)[] {
  const o: (number | null)[] = [null]; let g = 0, p = 0;
  for (let i = 1; i < C.length; i++) {
    const d = C[i] - C[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up; p += dn; if (i < n) { o.push(null); continue; } g /= n; p /= n; }
    else { g = (g * (n - 1) + up) / n; p = (p * (n - 1) + dn) / n; }
    o.push(p === 0 ? 100 : 100 - 100 / (1 + g / p));
  }
  return o;
}
const percentil = (hist: number[], v: number) => hist.length ? Math.round(hist.filter((x) => x <= v).length / hist.length * 100) : null;
const mediana = (a: number[]) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

type Estudo = { setup: string; ocorrencias: number; ativo_hoje: boolean; ultima: string | null; depois: Record<string, { media_pct: number; mediana_pct: number; positivos_pct: number }> | null; amostra_pequena: boolean };

/** Backtest de um sinal: retorno 5, 10 e 20 pregões depois de cada ocorrência (início do sinal, com 5 pregões de intervalo). */
function estudo(nome: string, n: number, C: number[], D: string[], cond: (i: number) => boolean): Estudo {
  const ev: number[] = []; let ult = -99;
  for (let i = 201; i < n; i++) if (cond(i) && !cond(i - 1) && i - ult >= 5) { ev.push(i); ult = i; }
  const fechados = ev.filter((i) => i + 20 < n);
  const depois: Estudo['depois'] = {};
  for (const k of [5, 10, 20]) {
    const r = fechados.map((i) => C[i + k] / C[i] - 1);
    if (!r.length) { continue; }
    depois[k + '_pregoes'] = { media_pct: pct(r.reduce((s, x) => s + x, 0) / r.length), mediana_pct: pct(mediana(r)!), positivos_pct: Math.round(r.filter((x) => x > 0).length / r.length * 100) };
  }
  return { setup: nome, ocorrencias: fechados.length, ativo_hoje: cond(n - 1), ultima: ev.length ? D[ev[ev.length - 1]] : null, depois: Object.keys(depois).length ? depois : null, amostra_pequena: fechados.length < 15 };
}

/** Simulação histórica de um plano: em cada dia do histórico (na mesma tendência de hoje), entra no fechamento com stop e alvo
 *  do mesmo tamanho em ATRs do plano e vê o que é atingido primeiro em até 60 pregões (se os dois no mesmo dia, conta stop). */
function simula(H: number[], L: number[], C: number[], A: (number | null)[], M200: (number | null)[], lado: 'compra' | 'venda', kStop: number, kAlvo: number) {
  const n = C.length, hojeAcima = M200[n - 1] != null ? C[n - 1] > (M200[n - 1] as number) : null;
  let alvo = 0, stop = 0, nada = 0; const dias: number[] = [];
  for (let i = 201; i < n - 1; i++) {
    const a = A[i]; if (a == null || a <= 0) continue;
    if (hojeAcima != null && M200[i] != null && (C[i] > (M200[i] as number)) !== hojeAcima) continue;
    const e = C[i], st = lado === 'compra' ? e - kStop * a : e + kStop * a, tg = lado === 'compra' ? e + kAlvo * a : e - kAlvo * a;
    let res = 0;
    for (let j = i + 1; j < Math.min(n, i + 61); j++) {
      const bateStop = lado === 'compra' ? L[j] <= st : H[j] >= st, bateAlvo = lado === 'compra' ? H[j] >= tg : L[j] <= tg;
      if (bateStop) { res = -1; break; }
      if (bateAlvo) { res = 1; dias.push(j - i); break; }
    }
    if (i + 60 >= n && res === 0) continue; // ainda em aberto: fora da conta
    if (res === 1) alvo++; else if (res === -1) stop++; else nada++;
  }
  const tot = alvo + stop + nada;
  if (tot < 20) return null;
  const rr = kAlvo / kStop, pA = alvo / tot, pS = stop / tot;
  return { simulacoes: tot, alvo_antes_do_stop_pct: Math.round(pA * 100), stop_antes_do_alvo_pct: Math.round(pS * 100), nenhum_em_60_pregoes_pct: Math.round(nada / tot * 100),
    dias_ate_o_alvo_mediana: dias.length ? mediana(dias) : null, expectativa_em_R: q2(pA * rr - pS, 2), risco_retorno: q2(rr, 2), filtro: hojeAcima == null ? 'todos os dias' : hojeAcima ? 'só dias com preço acima da MM200 (como hoje)' : 'só dias com preço abaixo da MM200 (como hoje)' };
}

/** Regra de OBV do trader: no rompimento de um topo (compra) ou perda de um fundo (venda), o OBV também tem que ter feito o pivô
 *  (fundo mais alto / topo mais baixo) e romper o topo (fundo) dele junto com o preço — ou antes do preço.
 *  Pivôs por fractal: máxima (mínima) maior (menor) que as k barras de cada lado. */
function obvRegra(D: string[], H: number[], L: number[], C: number[], V: number[], k = 3) {
  const n = C.length;
  if (V.filter((v) => v > 0).length < n * 0.8) return { aviso: 'sem volume confiável neste ativo (índice ou dado sem volume): regra do OBV não avaliada' };
  const O: number[] = []; for (let i = 0; i < n; i++) O.push(i ? O[i - 1] + (C[i] > C[i - 1] ? V[i] : C[i] < C[i - 1] ? -V[i] : 0) : 0);
  const pH: number[] = [], pL: number[] = [];
  for (let t = k; t < n - k; t++) {
    let a = true, b = true;
    for (let j = t - k; j <= t + k; j++) { if (j === t) continue; if (H[j] >= H[t]) a = false; if (L[j] <= L[t]) b = false; }
    if (a) pH.push(t); if (b) pL.push(t);
  }
  const antes = (arr: number[], lim: number) => { let r = -1; for (const x of arr) { if (x <= lim) r = x; else break; } return r; };
  const entre = (arr: number[], a: number, b: number) => arr.filter((x) => x > a && x < b);
  type Ev = { i: number; grupo: 'junto' | 'antes' | 'nao_confirmou'; pivo_preco: boolean; pivo_obv: boolean };
  const avalia = (lado: 'compra' | 'venda') => {
    const ev: Ev[] = [], usados = new Set<number>();
    const P = lado === 'compra' ? pH : pL, Q = lado === 'compra' ? pL : pH; // topos (compra) e fundos do pullback
    const rompe = (i: number, t: number) => lado === 'compra' ? C[i] > H[t] && C[i - 1] <= H[t] : C[i] < L[t] && C[i - 1] >= L[t];
    for (let i = 210; i < n; i++) {
      const t = antes(P, i - 1 - k); if (t < k || usados.has(t) || !rompe(i, t)) continue;
      usados.add(t);
      const pb = entre(Q, t, i - k), F = pb.length ? pb[pb.length - 1] : -1, F0 = antes(Q, t - 1);
      const pivo_preco = F >= 0 && F0 >= 0 && (lado === 'compra' ? L[F] > L[F0] : H[F] < H[F0]);
      const pivo_obv = F >= 0 && F0 >= 0 && (lado === 'compra' ? O[F] > O[F0] : O[F] < O[F0]);
      const nivel = lado === 'compra' ? Math.max(...O.slice(t - k, t + k + 1)) : Math.min(...O.slice(t - k, t + k + 1));
      let j = -1; for (let x = t + k + 1; x <= i; x++) if (lado === 'compra' ? O[x] > nivel : O[x] < nivel) { j = x; break; }
      ev.push({ i, grupo: j < 0 ? 'nao_confirmou' : j >= i - 1 ? 'junto' : 'antes', pivo_preco, pivo_obv });
    }
    const st = (lista: Ev[]) => {
      const f = lista.filter((e) => e.i + 20 < n);
      if (!f.length) return { ocorrencias: 0 };
      const sinal = lado === 'compra' ? 1 : -1, out: any = { ocorrencias: f.length, amostra_pequena: f.length < 15 };
      for (const kk of [5, 10, 20]) { const r = f.map((e) => (C[e.i + kk] / C[e.i] - 1) * sinal); out[kk + '_pregoes'] = { media_a_favor_pct: pct(r.reduce((a2, b2) => a2 + b2, 0) / r.length), mediana_a_favor_pct: pct(mediana(r)!), a_favor_pct: Math.round(r.filter((x) => x > 0).length / r.length * 100) }; }
      // rompimento falso: o preço volta para dentro (abaixo do topo / acima do fundo) em até 5 pregões
      out.rompimento_falso_pct = Math.round(f.filter((e) => { const t = antes(P, e.i - 1 - k); for (let x = e.i + 1; x <= e.i + 5; x++) if (lado === 'compra' ? C[x] < H[t] : C[x] > L[t]) return true; return false; }).length / f.length * 100);
      return out;
    };
    const regra = ev.filter((e) => e.pivo_preco && e.pivo_obv && e.grupo !== 'nao_confirmou');
    return {
      pivo_do_preco_qualquer_obv: st(ev.filter((e) => e.pivo_preco)),
      regra_completa_pivo_e_obv_rompendo: st(regra),
      obv_rompeu_junto: st(ev.filter((e) => e.grupo === 'junto')),
      obv_rompeu_antes_do_preco: st(ev.filter((e) => e.grupo === 'antes')),
      obv_nao_confirmou: st(ev.filter((e) => e.grupo === 'nao_confirmou')),
      ultimo: ev.length ? { data: D[ev[ev.length - 1].i], obv: ev[ev.length - 1].grupo, pivo_preco: ev[ev.length - 1].pivo_preco, pivo_obv: ev[ev.length - 1].pivo_obv } : null,
    };
  };
  // situação de hoje: último topo e último fundo confirmados, e se o OBV já passou o nível dele
  const hoje = (lado: 'compra' | 'venda') => {
    const P = lado === 'compra' ? pH : pL, Q = lado === 'compra' ? pL : pH, t = antes(P, n - 1 - k);
    if (t < k) return null;
    const nivelPreco = lado === 'compra' ? H[t] : L[t], nivelObv = lado === 'compra' ? Math.max(...O.slice(t - k, t + k + 1)) : Math.min(...O.slice(t - k, t + k + 1));
    const pb = entre(Q, t, n), F = pb.length ? pb[pb.length - 1] : -1, F0 = antes(Q, t - 1);
    const precoPassou = lado === 'compra' ? C[n - 1] > nivelPreco : C[n - 1] < nivelPreco, obvPassou = lado === 'compra' ? O[n - 1] > nivelObv : O[n - 1] < nivelObv;
    return {
      [lado === 'compra' ? 'topo_de_referencia' : 'fundo_de_referencia']: q2(nivelPreco), data_do_pivo: D[t],
      distancia_do_preco_pct: pct(C[n - 1] / nivelPreco - 1),
      preco_ja_rompeu: precoPassou, obv_ja_rompeu: obvPassou,
      pivo_do_preco_formado: F >= 0 && F0 >= 0 ? (lado === 'compra' ? L[F] > L[F0] : H[F] < H[F0]) : null,
      pivo_do_obv_formado: F >= 0 && F0 >= 0 ? (lado === 'compra' ? O[F] > O[F0] : O[F] < O[F0]) : null,
      leitura: obvPassou && !precoPassou ? 'OBV já rompeu antes do preço (pela regra, o volume está antecipando o rompimento)'
        : precoPassou && obvPassou ? 'preço e OBV romperam (regra atendida no rompimento)'
        : precoPassou && !obvPassou ? 'preço rompeu sem o OBV (regra NÃO atendida: rompimento sem volume)' : 'nem preço nem OBV romperam ainda',
    };
  };
  return {
    regra: 'No rompimento do topo (compra) ou do fundo (venda), o OBV precisa ter feito o pivô também e romper o topo (fundo) dele junto com o preço, ou antes do preço.',
    compra: avalia('compra'), venda: avalia('venda'), hoje: { compra: hoje('compra'), venda: hoje('venda') },
    como_ler: '"a_favor" = retorno a favor da operação (para a venda, queda é a favor). rompimento_falso_pct = % das vezes que o preço voltou para dentro do topo/fundo em até 5 pregões. Compare regra_completa com obv_nao_confirmou para ver se o OBV filtra rompimentos ruins neste ativo.',
  };
}

export type PlanoQ = { origem: string; lado: 'compra' | 'venda'; entrada: number; stop: number; alvos: number[] };

/** Estudo completo. cs = candles diários (quanto mais longo, melhor; ideal 10 anos); mensal = candles mensais (sazonalidade). */
export function estudoQuant(cs: Candle[], mensal: Candle[] | null | undefined, planos: PlanoQ[] = []) {
  if (!cs || cs.length < 260) return { aviso: 'histórico diário curto (menos de 1 ano): estudo quantitativo indisponível' };
  const D = cs.map((c) => c[0]), H = cs.map((c) => c[2]), L = cs.map((c) => c[3]), C = cs.map((c) => c[4]), n = C.length, u = C[n - 1];
  const M20 = smaS(C, 20), M50 = smaS(C, 50), M200 = smaS(C, 200), A = atrS(H, L, C), R = rsiS(C);
  const atr = A[n - 1] as number;
  // ----- retornos e posição -----
  const ret = (k: number) => n > k ? pct(u / C[n - 1 - k] - 1) : null;
  const ano = C.slice(-252), hi = Math.max(...H.slice(-252)), lo = Math.min(...L.slice(-252));
  let pico = ano[0], mdd = 0; for (const x of ano) { pico = Math.max(pico, x); mdd = Math.min(mdd, x / pico - 1); }
  // ----- volatilidade e regime -----
  const lr = C.map((x, i) => (i ? Math.log(x / C[i - 1]) : 0));
  const vol = (i: number) => { const s = lr.slice(i - 19, i + 1), m = s.reduce((a, b) => a + b, 0) / 20; return Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / 19) * Math.sqrt(252); };
  const volHist: number[] = []; for (let i = 220; i < n; i++) volHist.push(vol(i));
  const vAtual = vol(n - 1), atrPctHist = A.map((a, i) => (a != null ? a / C[i] : null)).filter((x): x is number => x != null);
  // distância da MM200 (em %) no histórico: mostra se o preço está "esticado"
  const d200Hist = M200.map((m, i) => (m != null ? C[i] / m - 1 : null)).filter((x): x is number => x != null);
  const dist = (m: number | null) => (m != null ? { pct: pct(u / m - 1), em_atr: q2((u - m) / atr, 1) } : null);
  const sd20 = Math.sqrt(C.slice(-20).reduce((s, x) => s + (x - (M20[n - 1] as number)) ** 2, 0) / 19);
  const regime = {
    volatilidade_20d_anual_pct: pct(vAtual), percentil_da_volatilidade: percentil(volHist, vAtual),
    atr14: q2(atr, 2), atr_pct_do_preco: pct(atr / u), percentil_do_atr: percentil(atrPctHist, atr / u),
    leitura: (() => { const p = percentil(volHist, vAtual) ?? 50; return p >= 80 ? 'volatilidade alta para o padrão do ativo (stops precisam ser mais largos; movimentos maiores)' : p <= 20 ? 'volatilidade baixa para o padrão do ativo (compressão: costuma anteceder movimento forte)' : 'volatilidade normal para o padrão do ativo'; })(),
  };
  const posicao = {
    retorno_1m_pct: ret(21), retorno_3m_pct: ret(63), retorno_6m_pct: ret(126), retorno_12m_pct: ret(252),
    na_faixa_de_52_semanas_pct: Math.round((u - lo) / ((hi - lo) || 1) * 100), maxima_52s: q2(hi), minima_52s: q2(lo), queda_desde_a_maxima_52s_pct: pct(u / hi - 1), maior_queda_em_12m_pct: pct(mdd),
    distancia_mm20: dist(M20[n - 1]), distancia_mm50: dist(M50[n - 1]), distancia_mm200: dist(M200[n - 1]),
    percentil_da_distancia_a_mm200: M200[n - 1] != null ? percentil(d200Hist, u / (M200[n - 1] as number) - 1) : null,
    zscore_20d: sd20 > 0 ? q2((u - (M20[n - 1] as number)) / sd20, 2) : null,
    rsi14: R[n - 1] != null ? q2(R[n - 1] as number, 1) : null,
  };
  // ----- estudos de setups (backtest no próprio ativo) -----
  const altaOK = (i: number) => M50[i] != null && M200[i] != null && C[i] > (M50[i] as number) && (M50[i] as number) > (M200[i] as number);
  const baixaOK = (i: number) => M50[i] != null && M200[i] != null && C[i] < (M50[i] as number) && (M50[i] as number) < (M200[i] as number);
  const mx20 = (i: number) => Math.max(...H.slice(i - 20, i)), mn20 = (i: number) => Math.min(...L.slice(i - 20, i));
  const estudos = [
    estudo('Pullback na MM20 em tendência de alta (preço > MM50 > MM200 e a mínima toca a MM20)', n, C, D, (i) => altaOK(i) && L[i] <= (M20[i] as number) * 1.005 && C[i] >= (M20[i] as number) * 0.99),
    estudo('Repique na MM20 em tendência de baixa (preço < MM50 < MM200 e a máxima toca a MM20)', n, C, D, (i) => baixaOK(i) && H[i] >= (M20[i] as number) * 0.995 && C[i] <= (M20[i] as number) * 1.01),
    estudo('Pullback do trader na alta (preço > MM50 > MM200; na correção, com máxima mais baixa ontem, o candle rompe a máxima do anterior)', n, C, D, (i) => altaOK(i) && H[i - 1] < H[i - 2] && H[i] > H[i - 1] && C[i] < Math.max(...H.slice(i - 10, i))),
    estudo('Pullback do trader na baixa (preço < MM50 < MM200; no repique, com mínima mais alta ontem, o candle perde a mínima do anterior)', n, C, D, (i) => baixaOK(i) && L[i - 1] > L[i - 2] && L[i] < L[i - 1] && C[i] > Math.min(...L.slice(i - 10, i))),
    estudo('Rompimento da máxima de 20 dias (fechamento acima)', n, C, D, (i) => C[i] > mx20(i)),
    estudo('Perda da mínima de 20 dias (fechamento abaixo)', n, C, D, (i) => C[i] < mn20(i)),
    estudo('RSI14 abaixo de 30 (sobrevendido)', n, C, D, (i) => R[i] != null && (R[i] as number) < 30),
    estudo('RSI14 acima de 70 (sobrecomprado)', n, C, D, (i) => R[i] != null && (R[i] as number) > 70),
    estudo('Fechamento cruzando para cima da MM200', n, C, D, (i) => M200[i] != null && C[i] > (M200[i] as number) && C[i - 1] <= (M200[i - 1] as number)),
    estudo('Fechamento cruzando para baixo da MM200', n, C, D, (i) => M200[i] != null && C[i] < (M200[i] as number) && C[i - 1] >= (M200[i - 1] as number)),
  ];
  // taxa base: qualquer dia (para comparar se o setup tem vantagem de verdade)
  const base: Record<string, any> = {};
  for (const k of [5, 10, 20]) { const r: number[] = []; for (let i = 201; i + k < n; i++) r.push(C[i + k] / C[i] - 1); base[k + '_pregoes'] = { media_pct: pct(r.reduce((s, x) => s + x, 0) / r.length), positivos_pct: Math.round(r.filter((x) => x > 0).length / r.length * 100) }; }
  // ----- sazonalidade (candles mensais) -----
  let sazonalidade: any = null;
  if (mensal && mensal.length >= 36) {
    const ms = mensal.slice(-181), por: Record<number, number[]> = {};
    for (let i = 1; i < ms.length; i++) { const m = +ms[i][0].slice(5, 7); (por[m] ||= []).push(ms[i][4] / ms[i - 1][4] - 1); }
    const nomes = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const mesHoje = +D[n - 1].slice(5, 7), um = (m: number) => { const r = por[m] || []; return r.length ? { mes: nomes[m], anos: r.length, media_pct: pct(r.reduce((s, x) => s + x, 0) / r.length), positivos_pct: Math.round(r.filter((x) => x > 0).length / r.length * 100) } : null; };
    sazonalidade = { mes_atual: um(mesHoje), proximo_mes: um(mesHoje % 12 + 1) };
  }
  // ----- simulação dos planos -----
  const simulacoes = planos.filter((p) => p && p.entrada > 0 && p.stop > 0 && p.alvos && p.alvos.length).map((p) => {
    const kS = Math.abs(p.entrada - p.stop) / atr;
    return { plano: p.origem, lado: p.lado, entrada: p.entrada, stop: p.stop, stop_em_atr: q2(kS, 2),
      alvos: p.alvos.filter((a) => a > 0).slice(0, 3).map((a) => ({ alvo: a, alvo_em_atr: q2(Math.abs(a - p.entrada) / atr, 2), historico: kS > 0 ? simula(H, L, C, A, M200, p.lado, kS, Math.abs(a - p.entrada) / atr) : null })) };
  });
  let regra_obv: any; try { regra_obv = obvRegra(D, H, L, C, cs.map((c) => c[5] || 0)); } catch (e) { regra_obv = { aviso: 'regra do OBV não calculada' }; }
  return {
    periodo: { de: D[0], ate: D[n - 1], pregoes: n },
    posicao, regime, regra_obv_do_trader: regra_obv, estudos_de_setups: estudos, taxa_base_qualquer_dia: base, sazonalidade, simulacao_dos_planos: simulacoes,
    como_ler: 'Estudos: retorno do ativo N pregões depois de cada vez que o sinal apareceu no histórico dele (media, mediana e % de vezes positivo); compare com a taxa_base para saber se o setup tem vantagem real. amostra_pequena = menos de 15 ocorrências (pouca confiança). Simulação dos planos: em cada dia do histórico na mesma tendência de hoje, entrada no fechamento com stop e alvo do mesmo tamanho em ATRs; mostra quantas vezes o alvo veio antes do stop e a expectativa em R (ganho médio por real arriscado). Passado não garante futuro.',
  };
}

// ===== servidor =====
// Leitura de Dow com as definições do trader e as regras de Martin Pring (Análise Técnica Explicada, cap. 1):
// - tendência de ALTA: topos e fundos ascendentes; BAIXA: topos e fundos descendentes; LATERAL: sem sequência na mesma direção (faixa).
// - a tendência é presumida em vigor até que o peso da evidência prove a reversão.
// - topo/fundo LEGÍTIMO: a reação seguinte devolve pelo menos ~1/3 do movimento anterior (magnitude) ou dura pelo menos ~1/3
//   do tempo do movimento anterior (tempo). Oscilações menores são ruído e não contam como topo/fundo.
// - DILEMA DE TOPOS E FUNDOS (meio sinal): numa alta, o preço perde o último fundo, mas a série de topos ascendentes ainda não
//   foi quebrada → meio sinal de baixa (ponto X). O sinal completo vem quando um rally faz topo mais baixo e o preço perde o
//   nível do ponto X (ponto Y). Na baixa, o espelho. No meio sinal a tendência continua classificada como a anterior.
// - PIVÔ (definição do trader): o ativo rompe o topo anterior (alta) ou perde o fundo anterior (baixa).
// - PULLBACK (definição do trader): na correção da alta, o candle rompe a máxima do candle anterior (compra);
//   no repique da baixa, o candle perde a mínima do candle anterior (venda).

const r4 = (x: number) => +x.toFixed(4);
export type Pv = { i: number; d: string; v: number; tipo: 'T' | 'F' };

/** Pivôs por fractal: topo = máxima maior que as k máximas de cada lado (fundo, o espelho). Só pivôs já confirmados. */
export function pivosDow(cs: Candle[], k = 2) {
  const tops: { i: number; d: string; v: number }[] = [], funds: { i: number; d: string; v: number }[] = [];
  for (let i = k; i < cs.length - k; i++) {
    let t = true, f = true;
    for (let j = i - k; j <= i + k; j++) { if (j === i) continue; if (cs[j][2] >= cs[i][2]) t = false; if (cs[j][3] <= cs[i][3]) f = false; }
    if (t) tops.push({ i, d: cs[i][0], v: cs[i][2] });
    if (f) funds.push({ i, d: cs[i][0], v: cs[i][3] });
  }
  return { tops, funds };
}

/** Sequência alternada topo/fundo/topo… (dois topos seguidos: fica o mais alto; dois fundos: o mais baixo). */
function alterna(cs: Candle[], k: number): Pv[] {
  const { tops, funds } = pivosDow(cs, k);
  const todos: Pv[] = [...tops.map((t) => ({ ...t, tipo: 'T' as const })), ...funds.map((f) => ({ ...f, tipo: 'F' as const }))].sort((a, b) => a.i - b.i);
  const s: Pv[] = [];
  for (const p of todos) {
    const u = s[s.length - 1];
    if (u && u.tipo === p.tipo) { if (p.tipo === 'T' ? p.v > u.v : p.v < u.v) s[s.length - 1] = p; }
    else if (u && u.i === p.i) continue;
    else s.push(p);
  }
  return s;
}

/** Regra de Pring: um topo/fundo só é legítimo se a reação seguinte devolveu >= ~1/3 do movimento anterior
 *  ou durou >= ~1/3 do tempo do movimento anterior. Reações menores são removidas (com o pivô seguinte) até sobrar só o que vale. */
export function legitimos(s: Pv[], frac = 0.3): Pv[] {
  const a = s.slice();
  let mudou = true;
  while (mudou && a.length >= 4) {
    mudou = false;
    for (let k = 1; k < a.length - 2; k++) {
      const ant = Math.abs(a[k].v - a[k - 1].v), rea = Math.abs(a[k + 1].v - a[k].v);
      const tAnt = a[k].i - a[k - 1].i, tRea = a[k + 1].i - a[k].i;
      if (rea < frac * ant && tRea < frac * tAnt) {
        // reação pequena demais: some com ela (o pivô k e o k+1); o próximo de mesmo tipo de k decide o extremo
        const prox = a[k + 2];
        const fica = a[k].tipo === 'T' ? (prox.v > a[k].v ? prox : a[k]) : (prox.v < a[k].v ? prox : a[k]);
        a.splice(k, 3, fica);
        mudou = true;
        break;
      }
    }
  }
  return a;
}

/** Topos e fundos legítimos (alternados) do histórico inteiro, com índices do próprio array de candles. */
export function sequenciaLegitima(cs: Candle[], k = 2): Pv[] { return legitimos(alterna(cs, k)); }

export type LeituraDow = {
  tendencia: 'alta' | 'baixa' | 'lateral' | 'sem dado'; motivo: string;
  ultimos_topos: { data: string; preco: number }[]; ultimos_fundos: { data: string; preco: number }[];
  faixa_lateral: { de: number; ate: number } | null;
  dilema: { tipo: 'meio sinal de baixa' | 'meio sinal de alta' | 'primeiro topo mais baixo' | 'primeiro fundo mais alto'; ponto_x: number | null; confirma_se: string; texto: string } | null;
  pivo: { tipo: 'alta' | 'baixa'; status: 'confirmado' | 'armado'; nivel: number; data: string | null; texto: string } | null;
  pullback: { lado: 'compra' | 'venda'; status: 'acionado' | 'armado'; gatilho: number; texto: string } | null;
};

export function leituraDow(cs: Candle[], k = 2): LeituraDow {
  const vazio: LeituraDow = { tendencia: 'sem dado', motivo: 'poucos candles', ultimos_topos: [], ultimos_fundos: [], faixa_lateral: null, dilema: null, pivo: null, pullback: null };
  if (!cs || cs.length < 15) return vazio;
  const off = Math.max(0, cs.length - 150), J = cs.slice(off), n = J.length, u = J[n - 1], px = u[4];
  const seq = legitimos(alterna(J, k));
  const T = seq.filter((p) => p.tipo === 'T'), F = seq.filter((p) => p.tipo === 'F');
  if (T.length < 2 || F.length < 2) return { ...vazio, motivo: 'topos e fundos legítimos insuficientes' };
  const [t1, t2] = T.slice(-2), [f1, f2] = F.slice(-2);
  const topoSobe = t2.v > t1.v, fundoSobe = f2.v > f1.v, topoDesce = t2.v < t1.v, fundoDesce = f2.v < f1.v;
  const depois = (i: number) => J.slice(i + 1);
  let tendencia: LeituraDow['tendencia'], motivo: string, dilema: LeituraDow['dilema'] = null;
  if (topoSobe && fundoSobe) {
    tendencia = 'alta';
    motivo = `topos ascendentes (${r4(t1.v)} → ${r4(t2.v)}) e fundos ascendentes (${r4(f1.v)} → ${r4(f2.v)})`;
    if (px < f2.v) {
      // perdeu o último fundo: só a série de fundos quebrou (ponto X). Pring: meio sinal; a tendência segue de alta até o sinal completo.
      const x = Math.min(...depois(f2.i).map((c) => c[3]));
      dilema = { tipo: 'meio sinal de baixa', ponto_x: r4(x), confirma_se: `um repique fizer topo abaixo de ${r4(t2.v)} e o preço perder ${r4(x)}`,
        texto: `dilema de topos e fundos: o preço perdeu o último fundo (${r4(f2.v)}), mas a série de topos ascendentes ainda não foi quebrada. É meio sinal de baixa: a tendência segue classificada como alta até a confirmação (topo mais baixo e perda de ${r4(x)}). Antecipar a reversão só se o peso da evidência (médias, volume/OBV, momento) também virar.` };
    }
  } else if (topoDesce && fundoDesce) {
    tendencia = 'baixa';
    motivo = `topos descendentes (${r4(t1.v)} → ${r4(t2.v)}) e fundos descendentes (${r4(f1.v)} → ${r4(f2.v)})`;
    if (px > t2.v) {
      const x = Math.max(...depois(t2.i).map((c) => c[2]));
      dilema = { tipo: 'meio sinal de alta', ponto_x: r4(x), confirma_se: `uma correção fizer fundo acima de ${r4(f2.v)} e o preço romper ${r4(x)}`,
        texto: `dilema de topos e fundos: o preço rompeu o último topo (${r4(t2.v)}), mas a série de fundos descendentes ainda não foi quebrada. É meio sinal de alta: a tendência segue classificada como baixa até a confirmação (fundo mais alto e rompimento de ${r4(x)}). Antecipar só se o peso da evidência também virar.` };
    }
  } else if (topoDesce && fundoSobe) {
    tendencia = 'lateral'; motivo = `topos descendentes e fundos ascendentes: o preço está se comprimindo numa faixa (triângulo)`;
  } else if (topoSobe && fundoDesce) {
    tendencia = 'lateral'; motivo = `topos ascendentes e fundos descendentes: faixa se alargando, sem direção definida`;
  } else {
    tendencia = 'lateral'; motivo = `topos e fundos no mesmo nível: faixa lateral`;
  }
  // primeiro sinal de cansaço sem quebra (alta com o último topo abaixo do anterior ainda acima do fundo, e o espelho)
  if (!dilema && tendencia === 'lateral' && topoDesce && fundoSobe) {
    const altaAntes = T.length >= 3 && F.length >= 2 && T[T.length - 2].v > T[T.length - 3].v;
    if (altaAntes) dilema = { tipo: 'primeiro topo mais baixo', ponto_x: r4(f2.v), confirma_se: `o preço perder o fundo ${r4(f2.v)}`, texto: `a alta fez o primeiro topo mais baixo (${r4(t2.v)} abaixo de ${r4(t1.v)}): sinal de cansaço; a reversão só se completa se o preço perder o fundo ${r4(f2.v)}.` };
  }
  const faixa_lateral = tendencia === 'lateral' ? { de: r4(Math.min(f1.v, f2.v)), ate: r4(Math.max(t1.v, t2.v)) } : null;
  // ----- pivô (definição do trader): rompimento do topo anterior / perda do fundo anterior -----
  let pivo: LeituraDow['pivo'] = null;
  const ultT = T[T.length - 1], ultF = F[F.length - 1];
  const rompeuTopo = depois(ultT.i).findIndex((c) => c[4] > ultT.v), perdeuFundo = depois(ultF.i).findIndex((c) => c[4] < ultF.v);
  if (ultF.i > ultT.i) {
    // último pivô foi um fundo: o pivô de alta é romper o topo anterior
    const fundoMaisAlto = ultF.v > (F.length >= 2 ? F[F.length - 2].v : -Infinity);
    pivo = rompeuTopo >= 0
      ? { tipo: 'alta', status: 'confirmado', nivel: r4(ultT.v), data: J[ultT.i + 1 + rompeuTopo][0], texto: `pivô de alta confirmado: ${fundoMaisAlto ? `fundo mais alto em ${r4(ultF.v)} e ` : ''}fechamento acima do topo anterior ${r4(ultT.v)}` }
      : { tipo: 'alta', status: 'armado', nivel: r4(ultT.v), data: null, texto: `${fundoMaisAlto ? `fundo mais alto em ${r4(ultF.v)}: ` : ''}pivô de alta confirma com fechamento acima do topo anterior ${r4(ultT.v)}` };
  } else {
    const topoMaisBaixo = ultT.v < (T.length >= 2 ? T[T.length - 2].v : Infinity);
    pivo = perdeuFundo >= 0
      ? { tipo: 'baixa', status: 'confirmado', nivel: r4(ultF.v), data: J[ultF.i + 1 + perdeuFundo][0], texto: `pivô de baixa confirmado: ${topoMaisBaixo ? `topo mais baixo em ${r4(ultT.v)} e ` : ''}fechamento abaixo do fundo anterior ${r4(ultF.v)}` }
      : { tipo: 'baixa', status: 'armado', nivel: r4(ultF.v), data: null, texto: `${topoMaisBaixo ? `topo mais baixo em ${r4(ultT.v)}: ` : ''}pivô de baixa confirma com fechamento abaixo do fundo anterior ${r4(ultF.v)}` };
  }
  // ----- pullback (definição do trader) -----
  let pullback: LeituraDow['pullback'] = null;
  const ant = J[n - 2], ant2 = J[n - 3];
  if (tendencia === 'alta' && !dilema) {
    if (ant[2] < ant2[2] && u[2] > ant[2]) pullback = { lado: 'compra', status: 'acionado', gatilho: r4(ant[2]), texto: `pullback de compra acionado: na correção, o candle atual rompeu a máxima do anterior (${r4(ant[2])})` };
    else if (u[2] < ant[2]) pullback = { lado: 'compra', status: 'armado', gatilho: r4(u[2]), texto: `correção dentro da alta: o gatilho do pullback é romper a máxima deste candle (${r4(u[2])})` };
  } else if (tendencia === 'baixa' && !dilema) {
    if (ant[3] > ant2[3] && u[3] < ant[3]) pullback = { lado: 'venda', status: 'acionado', gatilho: r4(ant[3]), texto: `pullback de venda acionado: no repique, o candle atual perdeu a mínima do anterior (${r4(ant[3])})` };
    else if (u[3] > ant[3]) pullback = { lado: 'venda', status: 'armado', gatilho: r4(u[3]), texto: `repique dentro da baixa: o gatilho do pullback de venda é perder a mínima deste candle (${r4(u[3])})` };
  }
  return {
    tendencia, motivo,
    ultimos_topos: T.slice(-3).map((t) => ({ data: t.d, preco: r4(t.v) })), ultimos_fundos: F.slice(-3).map((f) => ({ data: f.d, preco: r4(f.v) })),
    faixa_lateral, dilema, pivo, pullback,
  };
}

/** Leitura de Dow/Pring nos três tempos. Pring: mensal ≈ tendência primária (9 meses a 2 anos), semanal ≈ intermediária
 *  (6 semanas a 9 meses), diário ≈ curto prazo (2 a 6 semanas). */
export function dowTempos(diario: Candle[], semanal: Candle[] | null | undefined, mensal: Candle[] | null | undefined) {
  return {
    definicoes_do_trader: 'Alta = topos e fundos ascendentes; baixa = topos e fundos descendentes; lateral = sem sequência na mesma direção (preço numa faixa). Topo/fundo só conta se a reação seguinte devolveu pelo menos ~1/3 do movimento anterior ou durou pelo menos ~1/3 do tempo dele (Pring). Meio sinal (dilema de topos e fundos): quebrou só uma das séries; a tendência segue a mesma até a confirmação. Pivô = rompimento do topo anterior (alta) ou perda do fundo anterior (baixa). Pullback = na correção da alta, o candle rompe a máxima do candle anterior (compra); no repique da baixa, perde a mínima do candle anterior (venda).',
    mensal: mensal && mensal.length >= 15 ? { grau: 'tendência primária (Pring: 9 meses a 2 anos)', ...leituraDow(mensal, 2) } : null,
    semanal: semanal && semanal.length >= 15 ? { grau: 'tendência intermediária (Pring: 6 semanas a 9 meses)', ...leituraDow(semanal, 2) } : null,
    diario: { grau: 'tendência de curto prazo (Pring: 2 a 6 semanas)', ...leituraDow(diario, 2) },
  };
}

// ===== servidor =====
// Teoria de Dow (Pring, cap. 3): linhas, relação preço/volume, reação secundária, fases da tendência primária
// e confirmação pelo índice (o "as médias devem se confirmar" aplicado a um ativo: o índice do mercado confirma?).

const rd2 = (x: number) => +x.toFixed(2), rd4 = (x: number) => +x.toFixed(4);

/** LINHA de Dow: faixa estreita (~5% ou menos) por pelo menos 3 semanas (15 pregões). Rompimento para cima = acumulação; para baixo = distribuição. */
export function linhaDow(cs: Candle[], minDias = 15, maxFaixaPct = 5) {
  const n = cs.length; if (n < minDias + 2) return null;
  // procura a maior janela recente (terminando ontem ou hoje) com faixa <= maxFaixaPct
  let melhor: { ini: number; fim: number; hi: number; lo: number } | null = null;
  for (const fim of [n - 1, n - 2]) {
    let hi = -Infinity, lo = Infinity;
    for (let ini = fim; ini >= 0; ini--) {
      hi = Math.max(hi, cs[ini][2]); lo = Math.min(lo, cs[ini][3]);
      if ((hi - lo) / ((hi + lo) / 2) * 100 > maxFaixaPct) break;
      if (fim - ini + 1 >= minDias && (!melhor || fim - ini > melhor.fim - melhor.ini)) melhor = { ini, fim, hi, lo };
    }
  }
  if (!melhor) return null;
  const px = cs[n - 1][4], dias = melhor.fim - melhor.ini + 1;
  const status = melhor.fim === n - 2 ? (px > melhor.hi ? 'rompida para cima hoje (acumulação: Dow indica alta)' : px < melhor.lo ? 'rompida para baixo hoje (distribuição: Dow indica baixa)' : 'em formação') : 'em formação';
  return { de: cs[melhor.ini][0], pregoes: dias, maxima: rd4(melhor.hi), minima: rd4(melhor.lo), largura_pct: rd2((melhor.hi - melhor.lo) / ((melhor.hi + melhor.lo) / 2) * 100), status,
    texto: `linha de Dow: ${dias} pregões entre ${rd4(melhor.lo)} e ${rd4(melhor.hi)}; ${status}. Rompimento acima = acumulação; abaixo = distribuição.` };
}

/** Relação preço/volume (Dow): o normal é o volume crescer nas altas e encolher nas quedas. */
export function precoVolume(cs: Candle[], n = 40) {
  const J = cs.slice(-n - 1); if (J.length < 15) return null;
  const up: number[] = [], dn: number[] = [];
  for (let i = 1; i < J.length; i++) { const v = J[i][5]; if (!(v > 0)) continue; (J[i][4] > J[i - 1][4] ? up : J[i][4] < J[i - 1][4] ? dn : []).push(v); }
  if (up.length < 5 || dn.length < 5) return { aviso: 'sem volume suficiente' };
  const mu = up.reduce((a, b) => a + b, 0) / up.length, md = dn.reduce((a, b) => a + b, 0) / dn.length, raz = mu / md;
  return { pregoes: n, volume_medio_dias_de_alta: Math.round(mu), volume_medio_dias_de_queda: Math.round(md), razao_alta_sobre_queda: rd2(raz),
    leitura: raz >= 1.15 ? 'volume maior nas altas: relação normal de mercado comprador (confirma alta)'
      : raz <= 0.87 ? 'volume maior nas quedas: distribuição (Dow: aviso de que a alta pode virar; confirma baixa)'
      : 'volume parecido nas altas e nas quedas: sem informação forte' };
}

/** Reação secundária (Dow/Rhea): devolve 1/3 a 2/3 do movimento primário anterior e dura pelo menos 3–4 semanas. */
export function reacaoSecundaria(cs: Candle[], semanal: boolean) {
  const s = sequenciaLegitima(cs, 2); if (s.length < 3) return null;
  const n = cs.length, px = cs[n - 1][4], u = s[s.length - 1], a = s[s.length - 2];
  // movimento anterior = a → u; reação em andamento = u → preço atual
  const mov = u.v - a.v, rea = px - u.v;
  if (!mov || Math.sign(rea) === Math.sign(mov) || rea === 0) return { status: 'sem reação em andamento: o preço segue na direção do último movimento', movimento: { de: rd4(a.v), ate: rd4(u.v) } };
  const ret = Math.abs(rea / mov) * 100, barras = n - 1 - u.i, semanas = semanal ? barras : Math.round(barras / 5);
  const faixa = ret < 33 ? 'rasa (menos de 1/3): ainda não é reação secundária; a tendência anterior segue forte'
    : ret <= 66 ? 'dentro da faixa normal de reação secundária (1/3 a 2/3, muitas vezes ~50%)'
    : ret < 100 ? 'profunda (mais de 2/3): cuidado, pode ser a primeira perna de uma nova tendência primária' : 'devolveu todo o movimento: a tendência anterior está em xeque';
  return { movimento_anterior: { de: rd4(a.v), ate: rd4(u.v), sentido: mov > 0 ? 'alta' : 'baixa' }, retracao_pct: rd2(ret), duracao_semanas: semanas, classificacao: faixa,
    tempo: semanas >= 3 ? 'duração compatível com reação secundária (3 semanas ou mais)' : 'curta demais para reação secundária (menos de 3 semanas): é movimento menor',
    niveis_1_3_e_2_3: { um_terco: rd4(u.v - mov / 3), metade: rd4(u.v - mov / 2), dois_tercos: rd4(u.v - mov * 2 / 3) } };
}

/** Fase provável da tendência primária (Dow): 1ª acumulação/descrença, 2ª participação, 3ª excesso/especulação (ou pânico na baixa).
 *  Estimativa pelo mensal: quanto o preço já andou desde o início da tendência, ROC de 18 meses e RSI mensal. */
export function fasePrimaria(mensal: Candle[] | null | undefined) {
  if (!mensal || mensal.length < 30) return null;
  const L = leituraDow(mensal, 2), c = mensal.map((x) => x[4]), n = c.length;
  if (L.tendencia !== 'alta' && L.tendencia !== 'baixa') return { tendencia: L.tendencia, fase: 'sem tendência primária definida', evidencias: [] };
  const s = sequenciaLegitima(mensal, 2);
  // início da tendência: último fundo (alta) ou topo (baixa) antes da sequência atual de topos e fundos na mesma direção
  let ini = s.length - 1; const alta = L.tendencia === 'alta';
  for (let k = s.length - 1; k >= 2; k--) { const p = s[k], q = s[k - 2]; if (alta ? p.v > q.v : p.v < q.v) ini = k - 2; else break; }
  const base = s.slice(Math.max(0, ini)).find((x) => x.tipo === (alta ? 'F' : 'T')) || s[Math.max(0, ini)], desde = (c[n - 1] / base.v - 1) * 100, meses = n - 1 - base.i;
  const roc18 = n > 18 ? (c[n - 1] / c[n - 19] - 1) * 100 : null;
  let g = 0, p = 0; for (let i = n - 14; i < n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else p -= d; } const rsiM = p === 0 ? 100 : 100 - 100 / (1 + g / p);
  const ev: string[] = [`${alta ? 'alta' : 'queda'} de ${rd2(Math.abs(desde))}% em ${meses} meses desde ${alta ? 'o fundo' : 'o topo'} de ${rd4(base.v)} (${base.d.slice(0, 7)})`];
  if (roc18 != null) ev.push(`variação em 18 meses: ${rd2(roc18)}%`); ev.push(`RSI14 mensal: ${rd2(rsiM)}`);
  let fase: string;
  if (alta) fase = (roc18 != null && roc18 > 100) || rsiM > 75 ? '3ª fase provável (excesso/especulação): risco maior de reversão primária' : meses <= 8 || desde < 25 ? '1ª fase provável (acumulação: a tendência acabou de começar)' : '2ª fase provável (participação: tendência madura, mas sem sinais de excesso)';
  else fase = (roc18 != null && roc18 < -50) || rsiM < 25 ? '3ª fase provável (liquidação/pânico): costuma anteceder o fundo' : meses <= 8 || desde > -25 ? '1ª fase provável (a queda acabou de começar)' : '2ª fase provável (queda madura)';
  return { tendencia: L.tendencia, fase, evidencias: ev, aviso: 'estimativa: a teoria de Dow identifica a direção, não a duração nem o tamanho da tendência' };
}

/** Confirmação pelo mercado (princípio 6 de Dow adaptado): a tendência do índice (Ibovespa/S&P) confirma a do ativo? */
export function confirmacaoIndice(nome: string, idxSemanal: Candle[] | null | undefined, ativoSemanal: Candle[] | null | undefined) {
  if (!idxSemanal || idxSemanal.length < 30 || !ativoSemanal || ativoSemanal.length < 30) return null;
  const a = leituraDow(ativoSemanal, 2), b = leituraDow(idxSemanal, 2);
  const conf = a.tendencia === b.tendencia ? 'confirma' : (a.tendencia === 'lateral' || b.tendencia === 'lateral') ? 'não confirma (um deles está lateral)' : 'diverge';
  return { indice: nome, tendencia_semanal_do_indice: b.tendencia, motivo_do_indice: b.motivo, tendencia_semanal_do_ativo: a.tendencia, resultado: conf,
    leitura: conf === 'confirma' ? `o ${nome} está na mesma tendência semanal: o movimento do ativo tem o vento do mercado a favor` : `o ${nome} não está na mesma tendência semanal: movimento do ativo sem confirmação do mercado (mais risco de falhar)` };
}

// ===== servidor =====
// Ondas de Elliott (Pring, apêndice): o mercado sobe em 5 ondas (1, 3 e 5 de impulso; 2 e 4 corretivas) e corrige em 3 (a, b, c).
// Pring alerta: a contagem é subjetiva e deve ter peso pequeno. Aqui só testamos as regras objetivas sobre os topos e fundos
// legítimos e devolvemos uma contagem POSSÍVEL, com o nível que a invalida e alvos de Fibonacci.

const re4 = (x: number) => +x.toFixed(4), re2 = (x: number) => +x.toFixed(2);

/** Regras do impulso (de alta se sobe=true): onda 2 não passa do início da 1; onda 3 não é a menor entre 1, 3 e 5; onda 4 não entra no território da 1. */
function impulsoOk(p: number[], sobe: boolean) {
  const s = sobe ? 1 : -1, w = (a: number, b: number) => (p[b] - p[a]) * s;
  if (!(w(0, 1) > 0 && w(1, 2) < 0 && w(2, 3) > 0)) return false;
  if ((p[2] - p[0]) * s <= 0) return false; // onda 2 voltou além do início da onda 1
  if (p.length >= 5) { if (!(w(3, 4) < 0)) return false; if ((p[4] - p[1]) * s <= 0) return false; } // onda 4 sobrepôs a onda 1
  if (p.length >= 6) { if (!(w(4, 5) > 0)) return false; const l1 = w(0, 1), l3 = w(2, 3), l5 = w(4, 5); if (l3 < l1 && l3 < l5) return false; } // onda 3 a menor
  return true;
}

export function contagemElliott(cs: Candle[], rotulo: string) {
  const seq = sequenciaLegitima(cs, 2), n = cs.length, px = cs[n - 1][4];
  if (seq.length < 4) return { tempo: rotulo, contagem: 'sem contagem: poucos topos e fundos legítimos' };
  const out: any[] = [];
  for (const sobe of [true, false]) {
    const ini = sobe ? 'F' : 'T';
    // tenta as janelas mais recentes: 5 ondas completas (6 pivôs), onda 5 em andamento (5 pivôs + preço) e onda 3 em andamento (3 pivôs + preço)
    for (const m of [6, 5, 3]) {
      for (let st = seq.length - m; st >= Math.max(0, seq.length - m - 2); st--) {
        const P: Pv[] = seq.slice(st, st + m);
        if (P.length < m || P[0].tipo !== ini) continue;
        const v = P.map((x) => x.v);
        if (m === 6) {
          if (!impulsoOk(v, sobe) || st + m < seq.length - 1) continue; // precisa ser a sequência mais recente (no máx. 1 pivô depois)
          const l1 = Math.abs(v[1] - v[0]), l3 = Math.abs(v[3] - v[2]), l5 = Math.abs(v[5] - v[4]), tot = Math.abs(v[5] - v[0]), s = sobe ? -1 : 1;
          const depois = (px - v[5]) * (sobe ? 1 : -1) < 0;
          out.push({ sentido: sobe ? 'alta' : 'baixa', contagem: `5 ondas de ${sobe ? 'alta' : 'baixa'} possivelmente completas (onda 5 em ${re4(v[5])}, ${P[5].d})` + (depois ? `; o preço já ${sobe ? 'recua' : 'repica'}: possível correção a-b-c` : ''),
            ondas: { o1: [re4(v[0]), re4(v[1])], o2: re4(v[2]), o3: re4(v[3]), o4: re4(v[4]), o5: re4(v[5]) }, onda3_vs_onda1: re2(l3 / l1), onda5_vs_onda1: re2(l5 / l1),
            alvos_da_correcao_abc: { '38,2%': re4(v[5] + s * tot * 0.382), '50%': re4(v[5] + s * tot * 0.5), '61,8%': re4(v[5] + s * tot * 0.618), fundo_da_onda_4: re4(v[4]) },
            invalida_se: `o preço ${sobe ? 'superar' : 'perder'} ${re4(v[5])} (aí a onda 5 ainda não terminou ou a contagem está errada)` });
          break;
        }
        if (m === 5) {
          if (st + m !== seq.length || !impulsoOk(v, sobe) || (px - v[4]) * (sobe ? 1 : -1) <= 0) continue; // onda 5 em curso a partir do último pivô
          const l1 = Math.abs(v[1] - v[0]), l3 = Math.abs(v[3] - v[2]), s = sobe ? 1 : -1;
          out.push({ sentido: sobe ? 'alta' : 'baixa', contagem: `possível onda 5 de ${sobe ? 'alta' : 'baixa'} em andamento (onda 4 em ${re4(v[4])})`,
            ondas: { o1: [re4(v[0]), re4(v[1])], o2: re4(v[2]), o3: re4(v[3]), o4: re4(v[4]) }, onda3_vs_onda1: re2(l3 / l1),
            alvos_da_onda_5: { 'igual à onda 1': re4(v[4] + s * l1), '0,618 de (início da 1 até o fim da 3)': re4(v[4] + s * 0.618 * Math.abs(v[3] - v[0])) },
            invalida_se: `o preço ${sobe ? 'perder' : 'superar'} ${re4(v[1])} (topo da onda 1: a onda 4 não pode entrar nele)`, aviso: 'onda 5 é a última do impulso: movimento mais fraco e com divergências; proteja o lucro' });
          break;
        }
        if (m === 3) {
          if (st + m !== seq.length || !impulsoOk([...v, px], sobe) || (px - v[1]) * (sobe ? 1 : -1) <= 0) continue; // preço passou o fim da onda 1: possível onda 3
          const l1 = Math.abs(v[1] - v[0]), s = sobe ? 1 : -1, ret2 = Math.abs(v[2] - v[1]) / l1 * 100;
          out.push({ sentido: sobe ? 'alta' : 'baixa', contagem: `possível onda 3 de ${sobe ? 'alta' : 'baixa'} em andamento (rompeu o fim da onda 1 em ${re4(v[1])}; onda 2 devolveu ${re2(ret2)}% da onda 1)`,
            ondas: { o1: [re4(v[0]), re4(v[1])], o2: re4(v[2]) },
            alvos_da_onda_3: { '1,618 da onda 1': re4(v[2] + s * 1.618 * l1), '2,618 da onda 1': re4(v[2] + s * 2.618 * l1) },
            invalida_se: `o preço ${sobe ? 'perder' : 'superar'} ${re4(v[0])} (início da onda 1)`, aviso: 'onda 3 costuma ser a mais longa e forte; não pode ser a menor das ondas de impulso' });
          break;
        }
      }
    }
  }
  if (!out.length) return { tempo: rotulo, contagem: 'nenhuma contagem de impulso válida pelas regras (estrutura corretiva ou lateral)' };
  // prioriza a contagem mais avançada e no sentido do último movimento
  return { tempo: rotulo, possiveis: out.slice(0, 2), aviso: 'Elliott é subjetivo (Pring: dê peso pequeno). Use só como complemento à leitura de topos e fundos, nunca como gatilho sozinho.' };
}

export function elliottTempos(diario: Candle[], semanal: Candle[] | null | undefined) {
  return {
    regras: 'Impulso em 5 ondas (1, 3, 5 a favor; 2 e 4 corretivas) e correção em 3 (a, b, c). Regras: onda 2 não passa do início da 1; onda 3 nunca é a menor entre 1, 3 e 5; onda 4 não entra no território da onda 1. Fibonacci: onda 3 costuma medir 1,618 da onda 1; correções voltam 38,2–61,8%.',
    semanal: semanal && semanal.length >= 40 ? contagemElliott(semanal, 'semanal') : null,
    diario: diario.length >= 40 ? contagemElliott(diario, 'diário') : null,
  };
}

// ===== servidor =====
// Ferramentas clássicas (Flávio Lemos, "Análise técnica dos mercados financeiros", e Martin Pring): ADX/DI, MACD,
// divergências do IFR e do MACD, médias (cruzamentos), suportes e resistências com bipolaridade, linhas de tendência
// (LTA/LTB com regra dos 3% e dos 2 dias), objetivos do pivô por Fibonacci, padrões de candle, gaps e stops técnicos.

const c2 = (x: number) => +x.toFixed(2), c4 = (x: number) => +x.toFixed(4);

// ---------- séries ----------
function clSma(a: number[], n: number): (number | null)[] { const o: (number | null)[] = []; let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; o.push(i >= n - 1 ? s / n : null); } return o; }
function clEma(a: number[], n: number): number[] { const k = 2 / (n + 1), o: number[] = []; a.forEach((v, i) => o.push(i ? v * k + o[i - 1] * (1 - k) : v)); return o; }
function clRsi(C: number[], n = 14): (number | null)[] {
  const o: (number | null)[] = [null]; let g = 0, p = 0;
  for (let i = 1; i < C.length; i++) { const d = C[i] - C[i - 1], u = Math.max(d, 0), w = Math.max(-d, 0);
    if (i <= n) { g += u; p += w; if (i < n) { o.push(null); continue; } g /= n; p /= n; } else { g = (g * (n - 1) + u) / n; p = (p * (n - 1) + w) / n; }
    o.push(p === 0 ? 100 : 100 - 100 / (1 + g / p)); }
  return o;
}

/** ADX de Wilder (14) com +DI e −DI. Lemos: ADX < 20 sem tendência; 20–25 zona cinzenta; > 25 tendência forte. +DI acima de −DI = alta. */
export function adx(cs: Candle[], n = 14) {
  if (cs.length < n * 3) return null;
  const H = cs.map((c) => c[2]), L = cs.map((c) => c[3]), C = cs.map((c) => c[4]);
  let tr = 0, pdm = 0, mdm = 0; const dx: number[] = []; let pdi = 0, mdi = 0;
  for (let i = 1; i < cs.length; i++) {
    const up = H[i] - H[i - 1], dn = L[i - 1] - L[i];
    const t = Math.max(H[i] - L[i], Math.abs(H[i] - C[i - 1]), Math.abs(L[i] - C[i - 1]));
    const p = up > dn && up > 0 ? up : 0, m = dn > up && dn > 0 ? dn : 0;
    if (i <= n) { tr += t; pdm += p; mdm += m; if (i < n) continue; } else { tr = tr - tr / n + t; pdm = pdm - pdm / n + p; mdm = mdm - mdm / n + m; }
    pdi = tr ? 100 * pdm / tr : 0; mdi = tr ? 100 * mdm / tr : 0;
    dx.push(pdi + mdi ? 100 * Math.abs(pdi - mdi) / (pdi + mdi) : 0);
  }
  if (dx.length < n * 2) return null;
  const ad: number[] = []; let a = dx.slice(0, n).reduce((s, v) => s + v, 0) / n; ad.push(a);
  for (let i = n; i < dx.length; i++) { a = (a * (n - 1) + dx[i]) / n; ad.push(a); }
  const v = ad[ad.length - 1], v5 = ad[ad.length - 6] ?? v;
  return { adx: c2(v), mais_di: c2(pdi), menos_di: c2(mdi), adx_subindo: v > v5 + 0.5, direcao: pdi > mdi ? 'alta' : 'baixa',
    leitura: v < 20 ? 'sem tendência definida (ADX abaixo de 20): mercado de lado, cuidado com rompimentos falsos e sinais de média'
      : v < 25 ? `zona cinzenta (ADX entre 20 e 25): tendência de ${pdi > mdi ? 'alta' : 'baixa'} começando a se formar`
      : `tendência ${v > v5 + 0.5 ? 'forte e se fortalecendo' : v < v5 - 0.5 ? 'forte, mas perdendo força' : 'forte'} (ADX ${c2(v)}) de ${pdi > mdi ? 'alta (+DI acima do −DI)' : 'baixa (−DI acima do +DI)'}` };
}

/** MACD (12, 26, 9): linha, sinal, histograma e o último cruzamento. */
export function macd(C: number[]) {
  if (C.length < 60) return null;
  const e12 = clEma(C, 12), e26 = clEma(C, 26), m = C.map((_, i) => e12[i] - e26[i]), s = clEma(m, 9), h = m.map((v, i) => v - s[i]), n = C.length;
  let cruz: { tipo: string; ha: number } | null = null;
  for (let i = n - 1; i > n - 15 && i > 0; i--) { if ((h[i] > 0) !== (h[i - 1] > 0)) { cruz = { tipo: h[i] > 0 ? 'MACD cruzou para cima da linha de sinal (compra)' : 'MACD cruzou para baixo da linha de sinal (venda)', ha: n - 1 - i }; break; } }
  return { macd: c4(m[n - 1]), sinal: c4(s[n - 1]), histograma: c4(h[n - 1]), acima_de_zero: m[n - 1] > 0, histograma_crescendo: h[n - 1] > h[n - 2], ultimo_cruzamento: cruz, serie: m };
}

/** Divergências entre o preço e um oscilador nos dois últimos topos/fundos legítimos (Pring: alertam, não são sinal; precisam da confirmação do preço). */
function divergencias(seq: Pv[], osc: (number | null)[], nome: string) {
  const out: string[] = [];
  const T = seq.filter((p) => p.tipo === 'T').slice(-2), F = seq.filter((p) => p.tipo === 'F').slice(-2);
  if (T.length === 2 && osc[T[0].i] != null && osc[T[1].i] != null) {
    if (T[1].v > T[0].v && (osc[T[1].i] as number) < (osc[T[0].i] as number)) out.push(`divergência BAIXISTA no ${nome}: o preço fez topo mais alto (${c4(T[0].v)} → ${c4(T[1].v)}), o ${nome} fez topo mais baixo — perda de força da alta`);
    if (T[1].v < T[0].v && (osc[T[1].i] as number) > (osc[T[0].i] as number)) out.push(`divergência oculta de baixa no ${nome}: topo mais baixo no preço e mais alto no ${nome} (a baixa tende a continuar)`);
  }
  if (F.length === 2 && osc[F[0].i] != null && osc[F[1].i] != null) {
    if (F[1].v < F[0].v && (osc[F[1].i] as number) > (osc[F[0].i] as number)) out.push(`divergência ALTISTA no ${nome}: o preço fez fundo mais baixo (${c4(F[0].v)} → ${c4(F[1].v)}), o ${nome} fez fundo mais alto — perda de força da baixa`);
    if (F[1].v > F[0].v && (osc[F[1].i] as number) < (osc[F[0].i] as number)) out.push(`divergência oculta de alta no ${nome}: fundo mais alto no preço e mais baixo no ${nome} (a alta tende a continuar)`);
  }
  return out;
}

/** Médias: o que mudou recentemente (Pring: a mudança é dada pelo preço cruzando a média, não pela virada da média). */
function medias(C: number[]) {
  const n = C.length, M20 = clSma(C, 20), M50 = clSma(C, 50), M200 = clSma(C, 200), ev: string[] = [];
  for (const [nome, M] of [['MM20', M20], ['MM50', M50], ['MM200', M200]] as const) {
    for (let i = n - 1; i > n - 6 && i > 0; i--) { const a = M[i], b = M[i - 1]; if (a == null || b == null) break;
      if (C[i] > a && C[i - 1] <= b) { ev.push(`fechamento cruzou para cima da ${nome} há ${n - 1 - i} candle(s)`); break; }
      if (C[i] < a && C[i - 1] >= b) { ev.push(`fechamento cruzou para baixo da ${nome} há ${n - 1 - i} candle(s)`); break; } }
  }
  for (let i = n - 1; i > n - 21 && i > 0; i--) { const a = M50[i], b = M200[i], a0 = M50[i - 1], b0 = M200[i - 1]; if (a == null || b == null || a0 == null || b0 == null) break;
    if (a > b && a0 <= b0) { ev.push(`cruzamento de ouro (MM50 acima da MM200) há ${n - 1 - i} candles: no método do diamante, a compra ideal é no recuo até a MM50`); break; }
    if (a < b && a0 >= b0) { ev.push(`cruzamento da morte (MM50 abaixo da MM200) há ${n - 1 - i} candles: no método do diamante, a venda ideal é no repique até a MM50`); break; } }
  return ev;
}

/** Suportes e resistências horizontais pelos topos e fundos legítimos (agrupados por proximidade). Força = toques, recência e se já inverteu o papel. */
export function suportesResistencias(cs: Candle[], seq: Pv[], atr: number) {
  const n = cs.length, px = cs[n - 1][4], tol = Math.max(atr * 0.5, px * 0.006);
  const grupos: { v: number; toques: number; ult: number; tipos: Set<string> }[] = [];
  for (const p of seq) { const g = grupos.find((x) => Math.abs(x.v - p.v) <= tol); if (g) { g.v = (g.v * g.toques + p.v) / (g.toques + 1); g.toques++; g.ult = Math.max(g.ult, p.i); g.tipos.add(p.tipo); } else grupos.push({ v: p.v, toques: 1, ult: p.i, tipos: new Set([p.tipo]) }); }
  const fmt = (g: (typeof grupos)[0]) => {
    const papel = g.v < px ? 'suporte' : 'resistência', inverteu = g.tipos.size > 1;
    const forca = g.toques + (n - 1 - g.ult < 60 ? 1 : 0) + (inverteu ? 1 : 0);
    return { preco: c4(g.v), papel, toques: g.toques, ultimo_toque: cs[g.ult][0], distancia_pct: c2((g.v / px - 1) * 100), forca: forca >= 4 ? 'forte' : forca >= 2 ? 'média' : 'fraca',
      nota: inverteu ? `já foi ${papel === 'suporte' ? 'resistência' : 'suporte'} antes (bipolaridade: o nível rompido inverte o papel)` : '' };
  };
  const ac = grupos.filter((g) => g.v > px).sort((a, b) => a.v - b.v).slice(0, 3).map(fmt), ab = grupos.filter((g) => g.v <= px).sort((a, b) => b.v - a.v).slice(0, 3).map(fmt);
  return { resistencias_acima: ac, suportes_abaixo: ab, regra: 'Quanto mais toques, mais tempo, mais volume e mais recente, mais forte o nível. Rompido, o suporte vira resistência e vice-versa. Stop um pouco além do nível e longe de número redondo.' };
}

/** Linha de tendência (LTA pelos dois últimos fundos ascendentes; LTB pelos dois últimos topos descendentes), com os filtros de Lemos:
 *  rompimento confirmado por fechamento 3% além da linha ou 2 fechamentos seguidos do outro lado. */
export function linhasTendencia(cs: Candle[], seq: Pv[]) {
  const n = cs.length, out: any[] = [];
  const umaLinha = (tipo: 'LTA' | 'LTB') => {
    const P = seq.filter((p) => p.tipo === (tipo === 'LTA' ? 'F' : 'T'));
    if (P.length < 2) return null;
    const [a, b] = P.slice(-2);
    if (tipo === 'LTA' ? !(b.v > a.v) : !(b.v < a.v)) return null;
    if (b.i - a.i < 5) return null; // pontos muito próximos não definem tendência
    const inc = (b.v - a.v) / (b.i - a.i), y = (i: number) => a.v + inc * (i - a.i), hoje = y(n - 1);
    const tol = Math.abs(b.v) * 0.006;
    const toques = P.filter((p) => p.i >= a.i && Math.abs(p.v - y(p.i)) <= tol).length;
    const C = cs.map((c) => c[4]), lado = (i: number) => (tipo === 'LTA' ? C[i] < y(i) : C[i] > y(i));
    let rompida = '', dias = 0; for (let i = n - 1; i > b.i && lado(i); i--) dias++;
    const alem = tipo === 'LTA' ? (y(n - 1) - C[n - 1]) / y(n - 1) * 100 : (C[n - 1] - y(n - 1)) / y(n - 1) * 100;
    if (dias >= 2 || alem >= 3) rompida = `rompida e confirmada (${dias >= 2 ? dias + ' fechamentos do outro lado' : ''}${dias >= 2 && alem >= 3 ? ' e ' : ''}${alem >= 3 ? c2(alem) + '% além da linha' : ''}): um dos primeiros sinais de mudança de tendência`;
    else if (dias === 1) rompida = 'fechou do outro lado ontem/hoje: aguarde a confirmação (2º fechamento ou 3% além) antes de considerar rompida';
    const incPct = Math.abs(inc / a.v * 100);
    return { tipo, de: { data: a.d, preco: c4(a.v) }, ate: { data: b.d, preco: c4(b.v) }, valor_hoje: c4(hoje), distancia_pct: c2((C[n - 1] / hoje - 1) * 100), toques,
      validade: toques >= 3 ? 'validada (3 ou mais toques)' : 'só 2 toques: ainda precisa do 3º toque para ser confirmada', status: rompida || 'intacta: a tendência segue enquanto a linha não for rompida',
      inclinacao: incPct > 1 ? 'muito íngreme: ritmo difícil de sustentar; o rompimento tende a dar consolidação, não reversão (Pring)' : 'inclinação normal' };
  };
  for (const t of ['LTA', 'LTB'] as const) { const l = umaLinha(t); if (l) out.push(l); }
  return out;
}

/** Objetivos do pivô por extensão de Fibonacci (Lemos, estratégias de pivô): Z = ponto 2 − ponto 1; objetivos = ponto 2 ± 0,618Z, 1Z e 1,618Z.
 *  Invalida se perder o ponto 3 (alta) ou passar o ponto 3 (baixa) antes de romper o ponto 2. */
export function objetivosPivo(seq: Pv[], px: number) {
  const out: any[] = [];
  for (const alta of [true, false]) {
    const ult = seq.slice(-3);
    if (ult.length < 3) continue;
    const [p1, p2, p3] = ult;
    if (alta ? !(p1.tipo === 'F' && p2.tipo === 'T' && p3.tipo === 'F' && p3.v > p1.v) : !(p1.tipo === 'T' && p2.tipo === 'F' && p3.tipo === 'T' && p3.v < p1.v)) continue;
    const Z = Math.abs(p2.v - p1.v), s = alta ? 1 : -1, rompeu = alta ? px > p2.v : px < p2.v;
    out.push({ tipo: alta ? 'pivô de alta' : 'pivô de baixa', ponto_1: c4(p1.v), ponto_2: c4(p2.v), ponto_3: c4(p3.v), status: rompeu ? 'formado (rompeu o ponto 2)' : 'armado (falta romper o ponto 2)',
      gatilho: c4(p2.v), objetivos: { '61,8%': c4(p2.v + s * 0.618 * Z), '100%': c4(p2.v + s * Z), '161,8%': c4(p2.v + s * 1.618 * Z) },
      invalida_se: `${alta ? 'perder' : 'passar'} ${c4(p3.v)} (ponto 3)`, stop_tecnico: c4(p3.v - s * Z * 0.03) });
  }
  return out;
}

/** Padrões de candle dos últimos candles (Lemos, anexo; Pring: padrões de 1 e 2 barras têm efeito de curto prazo e pedem confirmação). */
export function candles(cs: Candle[], contexto: { tendencia: string; perto_de: string }) {
  const n = cs.length; if (n < 5) return [];
  const k = (i: number) => { const [, o, h, l, c] = cs[i]; const corpo = Math.abs(c - o), amp = h - l || 1e-9; return { o, h, l, c, corpo, amp, sup: h - Math.max(o, c), inf: Math.min(o, c) - l, alta: c > o }; };
  const a = k(n - 1), b = k(n - 2), d = k(n - 3), out: string[] = [];
  const queda = cs[n - 2][4] < cs[n - 6][4], subida = cs[n - 2][4] > cs[n - 6][4];
  if (a.corpo <= a.amp * 0.1) out.push(a.inf > a.amp * 0.6 ? 'doji libélula (dragonfly)' : a.sup > a.amp * 0.6 ? 'doji lápide (gravestone)' : 'doji: indecisão');
  if (a.inf >= 2 * a.corpo && a.sup <= a.corpo * 0.5 && a.corpo > a.amp * 0.1) out.push(queda ? 'martelo depois de queda (possível reversão para alta)' : subida ? 'enforcado depois de alta (alerta de topo)' : 'candle de sombra inferior longa');
  if (a.sup >= 2 * a.corpo && a.inf <= a.corpo * 0.5 && a.corpo > a.amp * 0.1) out.push(subida ? 'estrela cadente depois de alta (possível reversão para baixa)' : queda ? 'martelo invertido depois de queda' : 'candle de sombra superior longa');
  if (a.alta && !b.alta && a.c >= b.o && a.o <= b.c && a.corpo > b.corpo) out.push('engolfo de alta');
  if (!a.alta && b.alta && a.c <= b.o && a.o >= b.c && a.corpo > b.corpo) out.push('engolfo de baixa');
  if (b.corpo > b.amp * 0.5 && a.corpo < b.corpo * 0.5 && Math.max(a.o, a.c) <= Math.max(b.o, b.c) && Math.min(a.o, a.c) >= Math.min(b.o, b.c)) out.push(`harami ${b.alta ? 'de baixa' : 'de alta'} (perda de força)`);
  if (!d.alta && d.corpo > d.amp * 0.5 && b.corpo < d.corpo * 0.4 && a.alta && a.c > (d.o + d.c) / 2) out.push('estrela da manhã (reversão de alta)');
  if (d.alta && d.corpo > d.amp * 0.5 && b.corpo < d.corpo * 0.4 && !a.alta && a.c < (d.o + d.c) / 2) out.push('estrela da noite (reversão de baixa)');
  if (!b.alta && a.alta && a.o < b.c && a.c > (b.o + b.c) / 2 && a.c < b.o) out.push('piercing line (perfurante, reversão de alta)');
  if (b.alta && !a.alta && a.o > b.c && a.c < (b.o + b.c) / 2 && a.c > b.o) out.push('nuvem negra (dark cloud cover, reversão de baixa)');
  if (a.corpo >= a.amp * 0.9) out.push(`marubozu ${a.alta ? 'de alta' : 'de baixa'} (força; boa confirmação de rompimento quando vem com volume)`);
  const t3 = [k(n - 3), k(n - 2), k(n - 1)];
  if (t3.every((x) => x.alta && x.corpo > x.amp * 0.5) && t3[1].c > t3[0].c && t3[2].c > t3[1].c) out.push('três soldados brancos (força compradora)');
  if (t3.every((x) => !x.alta && x.corpo > x.amp * 0.5) && t3[1].c < t3[0].c && t3[2].c < t3[1].c) out.push('três corvos pretos (força vendedora)');
  return out.map((p) => `${p}${contexto.perto_de ? ' ' + contexto.perto_de : ''}`);
}

/** Último gap aberto (Pring: o mercado tende a fechar gaps; gaps viram suporte/resistência). */
function gapAberto(cs: Candle[]) {
  const n = cs.length;
  for (let i = n - 1; i > Math.max(1, n - 60); i--) {
    const up = cs[i][3] > cs[i - 1][2], dn = cs[i][2] < cs[i - 1][3];
    if (!up && !dn) continue;
    const de = up ? cs[i - 1][2] : cs[i][2], ate = up ? cs[i][3] : cs[i - 1][3];
    const fechado = cs.slice(i + 1).some((c) => (up ? c[3] <= de : c[2] >= ate));
    if (!fechado) return { tipo: up ? 'gap de alta' : 'gap de baixa', data: cs[i][0], de: c4(Math.min(de, ate)), ate: c4(Math.max(de, ate)), nota: `ainda aberto: tende a ser fechado e funciona como ${up ? 'suporte' : 'resistência'}` };
  }
  return null;
}

/** Stops técnicos (Lemos, cap. 17): abaixo do suporte/fundo (fora do número redondo), ATR × 2 e mínima/máxima de 15 pregões. */
function stops(cs: Candle[], seq: Pv[], atr: number) {
  const n = cs.length, px = cs[n - 1][4], F = seq.filter((p) => p.tipo === 'F').slice(-1)[0], T = seq.filter((p) => p.tipo === 'T').slice(-1)[0];
  const foraRedondo = (v: number, baixo: boolean) => { const r = Math.round(v); return Math.abs(v - r) < px * 0.002 ? c4(r + (baixo ? -px * 0.003 : px * 0.003)) : c4(v); };
  const mn = Math.min(...cs.slice(-15).map((c) => c[3])), mx = Math.max(...cs.slice(-15).map((c) => c[2]));
  return {
    compra: { abaixo_do_ultimo_fundo: F ? foraRedondo(F.v - atr * 0.2, true) : null, atr_x2: c4(px - 2 * atr), minima_15_pregoes: c4(mn) },
    venda: { acima_do_ultimo_topo: T ? foraRedondo(T.v + atr * 0.2, false) : null, atr_x2: c4(px + 2 * atr), maxima_15_pregoes: c4(mx) },
    regra: 'Stop técnico um pouco além do suporte/resistência (nunca no número redondo), com folga para a volatilidade (ATR). Defina também um stop de tempo: se não andar no prazo planejado, saia.',
  };
}

/** Pacote para um tempo gráfico. */
export function classicos(cs: Candle[], rotulo: string) {
  if (!cs || cs.length < 60) return { tempo: rotulo, aviso: 'poucos candles' };
  const C = cs.map((c) => c[4]), n = C.length, seq = sequenciaLegitima(cs, 2);
  const H = cs.map((c) => c[2]), L = cs.map((c) => c[3]);
  let atr = 0; for (let i = n - 14; i < n; i++) atr += Math.max(H[i] - L[i], Math.abs(H[i] - C[i - 1]), Math.abs(L[i] - C[i - 1])); atr /= 14;
  const R = clRsi(C), M = macd(C), ad = adx(cs);
  const sr = suportesResistencias(cs, seq.slice(-30), atr);
  const perto = [...sr.suportes_abaixo, ...sr.resistencias_acima].find((x) => Math.abs(x.distancia_pct) < 1.5);
  const div = [...divergencias(seq, R, 'IFR'), ...(M ? divergencias(seq, M.serie, 'MACD') : [])];
  const r14 = R[n - 1];
  return {
    tempo: rotulo,
    forca_da_tendencia_adx: ad,
    macd: M ? { macd: M.macd, sinal: M.sinal, histograma: M.histograma, acima_de_zero: M.acima_de_zero, histograma_crescendo: M.histograma_crescendo, ultimo_cruzamento: M.ultimo_cruzamento } : null,
    ifr14: r14 != null ? { valor: c2(r14), leitura: r14 >= 70 ? 'sobrecomprado (em alta forte pode ficar assim por muito tempo)' : r14 <= 30 ? 'sobrevendido (numa alta primária é oportunidade; numa baixa pode continuar)' : 'neutro' } : null,
    divergencias: div.length ? div : ['nenhuma divergência nos dois últimos topos/fundos'],
    medias_eventos_recentes: medias(C),
    suportes_e_resistencias: sr,
    linhas_de_tendencia: linhasTendencia(cs, seq),
    pivo_objetivos_fibonacci: objetivosPivo(seq, C[n - 1]),
    candles_recentes: candles(cs, { tendencia: '', perto_de: perto ? `(perto do ${perto.papel} ${perto.preco})` : '' }),
    gap_aberto: gapAberto(cs),
    stops_tecnicos: stops(cs, seq, atr),
  };
}

export function classicosTempos(diario: Candle[], semanal: Candle[] | null | undefined) {
  return { diario: classicos(diario, 'diário'), semanal: semanal && semanal.length >= 60 ? classicos(semanal, 'semanal') : null };
}

// ===== servidor =====
// Giro do mercado: texto curto no estilo de agência (pré-abertura, meio do pregão e fechamento),
// com os números do TradingView e os motivos do dia pesquisados na internet pela IA.
export type GiroJanela = 'pre' | 'meio' | 'fech';
export type GiroCot = { k: string; n: string; px: number | null; d1: number | null; ext?: number | null; fonte?: 'Profit' | 'TradingView' };

export const GIRO_TV: [string, string, string][] = [
  ['ibov', 'BMFBOVESPA:IBOV', 'Ibovespa'], ['win', 'BMFBOVESPA:WIN1!', 'Mini índice (WIN)'], ['dolar', 'FX_IDC:USDBRL', 'Dólar (R$)'], ['wdo', 'BMFBOVESPA:WDO1!', 'Dólar futuro (WDO, pontos)'], ['dxy', 'TVC:DXY', 'DXY'],
  ['di29', 'BMFBOVESPA:DI1F2029', 'DI jan/29 (%)'], ['di33', 'BMFBOVESPA:DI1F2033', 'DI jan/33 (%)'],
  ['spx', 'SP:SPX', 'S&P 500'], ['dji', 'DJ:DJI', 'Dow Jones'], ['ndq', 'NASDAQ:IXIC', 'Nasdaq'], ['es', 'CME_MINI:ES1!', 'S&P 500 futuro'], ['nq', 'CME_MINI:NQ1!', 'Nasdaq futuro'],
  ['ewz', 'AMEX:EWZ', 'EWZ'], ['brent', 'TVC:UKOIL', 'Petróleo Brent (US$)'], ['wti', 'TVC:USOIL', 'Petróleo WTI (US$)'], ['sgx', 'SGX:FEF1!', 'Minério de ferro SGX (US$)'],
  ['us10', 'TVC:US10Y', 'Treasury 10 anos (%)'], ['ouro', 'TVC:GOLD', 'Ouro (US$)'], ['btc', 'BITSTAMP:BTCUSD', 'Bitcoin (US$)'],
];
/** Qual giro faz sentido agora (horário de Brasília, em minutos desde meia-noite). */
export function giroJanela(min: number): GiroJanela { return min < 10 * 60 ? 'pre' : min < 17 * 60 + 10 ? 'meio' : 'fech'; }
export const GIRO_NOME: Record<GiroJanela, string> = { pre: 'Pré-abertura', meio: 'Meio do pregão', fech: 'Fechamento' };
/** Os 6 giros do dia (horário de Brasília). "jan" escolhe as cotações e a pauta base; "pauta" diz o que é específico de cada edição. */
export type GiroSlot = { id: string; ini: number; jan: GiroJanela; nome: string; pauta: string };
export const GIRO_SLOTS: GiroSlot[] = [
  { id: '07', ini: 420, jan: 'pre', nome: 'Giro das 7h', pauta: 'O pregão ainda não abriu (o índice e o dólar futuros abrem às 9h; a bolsa à vista às 10h). Conte o que aconteceu desde o fechamento de ontem: Ásia e Europa de madrugada, futuros de Nova York, petróleo, minério, notícias da noite, balanços divulgados e a agenda do dia, e o que isso sugere para a abertura.' },
  { id: '0910', ini: 550, jan: 'pre', nome: 'Abertura do futuro (9h10)', pauta: 'O índice futuro (WIN) e o dólar futuro (WDO) abriram às 9h. Diga como abriram em relação ao ajuste de ontem e por quê (exterior, notícias, agenda da manhã), o nível que estão testando e o que o mercado precifica para a abertura da bolsa à vista às 10h.' },
  { id: '10', ini: 600, jan: 'meio', nome: 'Abertura da bolsa (10h)', pauta: 'A bolsa à vista acabou de abrir. Ibovespa na abertura (pontos e variação), as ações que puxam a alta ou a queda e por quê, a reação a balanços e às notícias da manhã, e como estão o dólar e os juros futuros.' },
  { id: '12', ini: 720, jan: 'meio', nome: 'Giro do meio-dia', pauta: 'Meio do pregão: o que mudou desde a abertura (virou, ampliou ou devolveu?), setores e ações que lideram, notícias da manhã, Europa perto do fechamento e o que observar à tarde.' },
  { id: '15', ini: 900, jan: 'meio', nome: 'Giro das 15h', pauta: 'Tarde: Nova York já está aberta; como o exterior está influenciando a bolsa, o dólar e os juros daqui, o que mudou desde o meio-dia e o que observar até o fechamento.' },
  { id: '1720', ini: 1040, jan: 'fech', nome: 'Fechamento (17h20)', pauta: 'A bolsa à vista fechou (o índice futuro ainda negocia até o fim da sessão). Resultado do dia: Ibovespa, dólar e juros, quem ganhou e quem perdeu, como fecharam as ações com balanço, e o que fica para amanhã (balanços depois do fechamento, agenda e exterior à noite).' },
];
export function giroSlotAgora(min: number): GiroSlot | null { let r: GiroSlot | null = null; for (const x of GIRO_SLOTS) if (min >= x.ini) r = x; return r; }
export const hhmmMin = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

const gN = (v: number, d = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const gP = (v: number) => (v > 0 ? '+' : '') + gN(v) + '%';
/** Linhas prontas (números já formatados em pt-BR) para a IA não errar casas decimais. */
export function giroLinhas(q: GiroCot[], janela: GiroJanela): string[] {
  const dec: Record<string, number> = { ibov: 0, win: 0, wdo: 1, dolar: 4, dxy: 3, di29: 3, di33: 3, spx: 2, dji: 2, ndq: 2, es: 2, nq: 2, ewz: 2, brent: 2, wti: 2, sgx: 2, us10: 3, ouro: 2, btc: 0 };
  return q.filter((x) => x.px != null).map((x) => {
    const juro = x.k.startsWith('di') || x.k === 'us10';
    const v = juro ? (x.d1 != null ? ` (${x.d1 >= 0 ? '+' : ''}${gN(x.d1, 3)} p.p. no dia)` : '') : x.d1 != null ? ` (${gP(x.d1)})` : '';
    const pre = x.k === 'ewz' && x.ext != null && janela === 'pre' ? ` · pré-mercado/overnight ${gP(x.ext)}` : '';
    return `${x.n}: ${gN(x.px!, dec[x.k] ?? 2)}${v}${pre}${x.fonte === 'Profit' ? ' [Profit, tempo real]' : ''}`;
  });
}
export const SYS_GIRO = `Você é uma analista de mercado sênior de uma mesa de operações brasileira (CNPI, 15 anos de mercado), escrevendo o "Giro do mercado" para traders profissionais. Sem viés político.
Escreva em português do Brasil, texto ORIGINAL (não copie frases de outros veículos), com:
- "titulo": começa com o nome do giro (ex.: "Giro das 13h:", "Pré-abertura:", "Fechamento:") e uma manchete que junta o movimento principal e o PORQUÊ (até 170 caracteres).
- "texto": DOIS parágrafos separados por uma linha em branco, 200 a 340 palavras no total. Cada edição tem uma PAUTA diferente:
  • Pré-abertura = o que esperar: exterior de madrugada, futuros/EWZ, agenda do dia, os BALANÇOS que saíram ontem à noite e hoje antes da abertura (o que a empresa mostrou, pesquisando os números: lucro, receita, Ebitda, surpresa ou decepção) e os que saem hoje depois do fechamento.
  • Giro do meio do pregão = o que mudou desde a abertura: virou ou ampliou? que setor/ação lidera o movimento, o nível testado agora, e COMO AS AÇÕES QUE DIVULGARAM BALANÇO ESTÃO REAGINDO (use as variações do bloco "Balanços" e explique o motivo pelo resultado).
  • Fechamento = balanço do dia: quem ganhou e quem perdeu, como terminou em relação ao meio do dia, como FECHARAM as ações que divulgaram balanço, e o que fica para amanhã: os balanços que saem HOJE DEPOIS DO FECHAMENTO e amanhã antes da abertura (o que o mercado espera de cada um), agenda e exterior à noite.
  1º parágrafo (o quê e por quê): Ibovespa (variação e pontos) e o motivo concreto do dia, fundamentado em notícias de hoje que você pesquisou (pesquisas eleitorais e dinâmica eleitoral, Copom/juros/inflação, fiscal, balanços, risk on/risk off global, China, petróleo, geopolítica). Depois dólar (e se está descolado do DXY), juros futuros (DI) e bolsas de NY. Números entre parênteses, como as agências fazem.
  2º parágrafo (leitura técnica e impacto): use o bloco "Leitura técnica" (calculado pelo sistema com o histórico) para dizer onde os preços estão: perto ou acima da máxima histórica, menor preço em X meses/anos, suportes e resistências com a data de origem (ex.: "zona de suporte de set/2024"), acima/abaixo da média de 200 dias, sequência de quedas/altas. Ligue cada movimento às ações afetadas (minério → VALE3, CSNA3, CMIN3; petróleo → PETR4, PRIO3; juros futuros → varejo, construção e small caps; dólar → exportadoras como SUZB3, KLBN11, EMBR3; risco eleitoral → estatais e bancos) e diga o que pode acontecer no pregão (pré-abertura: "pode pesar em VALE3 na abertura"; meio do dia: o que observar até o fechamento; fechamento: o que fica para amanhã).
- "tecnico": 2 a 4 frases curtas só com níveis e datas (suportes, resistências, médias). Não copie frases do texto.
- "destaques": até 4 frases curtas (balanços com o número principal, ações que dispararam ou derreteram) com empresas ou eventos que NÃO apareceram no texto nem no "tecnico" (balanços, ações que dispararam ou derreteram, notícias corporativas), com o número quando houver. Se não houver nada novo, devolva a lista vazia.
- "leitura": "alta", "queda" ou "lateral" (como o Ibovespa está se comportando agora; na pré-abertura, o viés dos futuros e do exterior).
- "contexto": 2 a 4 frases curtas, cada uma começando pelo tipo de evidência e dois-pontos ("Eleição:", "Sazonalidade:", "Sentimento:", "Exterior:", "Juros:", "Fluxo:", "Técnica:"), mostrando de onde vem a leitura de alta, queda ou lateralidade. Use o bloco CONTEXTO quando ele vier. Não repita frases do texto.
- "fontes": até 5 objetos {"titulo","url"} das notícias que você usou.
REGRAS:
1) Use EXATAMENTE os números de "Cotações" e da "Leitura técnica" (já em pt-BR). Não invente nem arredonde diferente. Número que não estiver lá só entra se você achar na pesquisa, citando a fonte.
2) Pesquise na internet as notícias DE HOJE que explicam o movimento e cite o fato concreto (ex.: "pesquisa Quaest mostrou…", "o IPCA-15 veio acima do esperado…"). Se não achar motivo claro, diga que o mercado acompanha o exterior ou opera sem catalisador, sem inventar.
3) Pré-abertura: o pregão ainda não abriu; fale de futuros, EWZ, Ásia/Europa, petróleo, minério e da agenda do dia. Meio do pregão: "nesta [dia da semana]", movimento em andamento. Fechamento: "fechou", resultado do dia e o que fica para amanhã.
4) Leitura técnica é descrição de níveis, não recomendação: nada de "compre" ou "venda". Sem emojis.
5) EXPLIQUE O PORQUÊ COM VÁRIAS FONTES: classifique o dia (alta, queda ou lateral) e sustente com pelo menos três tipos de evidência diferentes entre notícias do dia, exterior, juros, fluxo, técnica, sazonalidade e sentimento. Se o bloco CONTEXTO trouxer calendário eleitoral, a eleição é assunto obrigatório: pesquise as pesquisas mais recentes (Quaest, Datafolha, AtlasIntel, Genial/Quaest, Paraná Pesquisas…), o que os candidatos disseram sobre economia, fiscal e estatais, e como o mercado está precificando (estatais, bancos, DI, dólar, EWZ), sempre sem tomar partido nem opinar sobre candidatos. Compare o dia com o padrão histórico do CONTEXTO ("em X das Y eleições desde 2002…", "outubro costuma…") deixando claro que é estatística, não previsão, e use o termômetro de medo e ganância para dizer se o mercado está esticado, com medo ou neutro.
6) SEJA CRIATIVA COM RIGOR: traga pelo menos um ângulo que o leitor não esperava (um paralelo com outra eleição ou outro ano, o dado de sazonalidade, o sentimento contrariando o preço, um setor andando na contramão), sempre com número e fonte. Nada de inventar fatos.
7) ESCRITA VIVA, SEM FÓRMULA: siga o "Estilo de abertura" pedido. Varie verbos e construções; evite clichês repetidos como "aversão global ao risco", "descolando-se do DXY", "sob a ótica técnica", "no ambiente doméstico", "segue confortável". Se receber os giros que o leitor já leu, NÃO repita manchete, frases, a mesma ordem de assuntos nem os mesmos números sem dizer o que mudou ("desde o meio-dia, o índice ampliou a queda de 1,21% para…"). Prefira o fato novo do momento.
Responda SOMENTE JSON: {"titulo":"","texto":"","tecnico":[""],"destaques":[""],"leitura":"alta|queda|lateral","contexto":[""],"fontes":[{"titulo":"","url":""}]}`;
/** Balanços no giro: quem divulgou e como a ação reage (meio e fechamento), e quem divulga a seguir. */
export type BalG = { tk: string; nome?: string; d: string; cap?: number; hora?: string | null; quando?: string | null };
export async function giroAcoes(tks: string[]): Promise<Record<string, { px: number; ch: number }>> {
  if (!tks.length) return {};
  const r = await fetch('https://scanner.tradingview.com/brazil/scan', {
    method: 'POST', signal: AbortSignal.timeout(8_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': GIRO_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({ symbols: { tickers: tks.map((t) => 'BMFBOVESPA:' + t), query: { types: [] } }, columns: ['close', 'change'] }),
  });
  if (!r.ok) return {};
  const j = await r.json(), out: Record<string, { px: number; ch: number }> = {};
  for (const x of j?.data || []) { const t = String(x.s || '').split(':')[1], d = x.d || []; if (t && typeof d[0] === 'number') out[t] = { px: d[0], ch: typeof d[1] === 'number' ? d[1] : 0 }; }
  return out;
}
const fBR = (v: number, c = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
/** Próximo dia útil (seg a sex) depois de d. */
const proxUtilG = (d: string) => { const x = new Date(d + 'T12:00:00Z'); do { x.setUTCDate(x.getUTCDate() + 1); } while ([0, 6].includes(x.getUTCDay())); return x.toISOString().slice(0, 10); };
export function giroBalancosLinhas(v: { hoje: string; ontem: BalG[]; hoje_lista: BalG[]; proximos: BalG[] } | null, jan: GiroJanela, px: Record<string, { px: number; ch: number }> = {}): string[] {
  if (!v) return [];
  const top = (L: BalG[], n = 10) => [...L].sort((a, b) => (b.cap || 0) - (a.cap || 0)).slice(0, n);
  const nome = (x: BalG) => x.nome && x.nome.toUpperCase() !== x.tk ? `${x.tk} (${x.nome})` : x.tk;
  const quando = (x: BalG) => x.hora ? ` às ${x.hora}` : x.quando === 'antes' ? ' antes da abertura' : x.quando === 'depois' ? ' após o fechamento' : '';
  const reag = (x: BalG) => { const p = px[x.tk]; return p ? `${nome(x)}: ${p.ch > 0 ? '+' : ''}${fBR(p.ch)}% (R$ ${fBR(p.px)})` : `${nome(x)}: sem cotação agora`; };
  const ontemNoite = top(v.ontem.filter((x) => x.quando !== 'antes')), hojeCedo = top(v.hoje_lista.filter((x) => x.quando === 'antes'));
  const hojeTarde = top(v.hoje_lista.filter((x) => x.quando !== 'antes')), amanha = proxUtilG(v.hoje), amanhaCedo = top(v.proximos.filter((x) => x.d === amanha));
  const L: string[] = [];
  if (jan === 'pre') {
    if (ontemNoite.length) L.push('Divulgaram balanço no último pregão, depois do fechamento (a ação reage hoje): ' + ontemNoite.map((x) => nome(x) + quando(x)).join('; '));
    if (hojeCedo.length) L.push('Divulgam hoje ANTES da abertura: ' + hojeCedo.map((x) => nome(x) + quando(x)).join('; '));
    if (hojeTarde.length) L.push('Divulgam hoje depois do fechamento (ou durante o dia): ' + hojeTarde.map((x) => nome(x) + quando(x)).join('; '));
  } else {
    const reagiu = [...ontemNoite, ...hojeCedo];
    if (reagiu.length) L.push(`${jan === 'meio' ? 'Como estão AGORA' : 'Como FECHARAM'} as ações de quem divulgou balanço (no último pregão após o fechamento ou hoje cedo): ` + reagiu.map(reag).join('; '));
    if (hojeTarde.length) L.push(`Divulgam hoje ${jan === 'meio' ? 'mais tarde, depois do fechamento' : 'depois do fechamento (a reação fica para amanhã)'}: ` + hojeTarde.map((x) => nome(x) + quando(x)).join('; '));
    if (jan === 'fech' && amanhaCedo.length) L.push('Divulgam no próximo pregão: ' + amanhaCedo.map((x) => nome(x) + quando(x)).join('; '));
  }
  return L;
}
/** Estilo de abertura de cada edição (muda por dia, janela e hora, para os textos não saírem iguais). */
export const GIRO_ESTILOS = [
  'comece pelo fato ou notícia mais importante do momento, não pelo Ibovespa',
  'comece por um número marcante do dia (um ativo, uma commodity ou um juro) e explique por que ele importa',
  'comece pelo setor ou pela ação que mais explica o movimento do índice',
  'comece comparando com o giro anterior: o que mudou desde então',
  'comece pela pergunta que o mercado está tentando responder hoje e responda em seguida',
  'comece pelo exterior (Nova York, Ásia ou Europa) e traga para a B3',
];
export function giroEstilo(dia: string, jan: string, bucket: number): string {
  let h = 0;
  for (const c of `${dia}|${jan}|${bucket}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const L = jan === 'meio' || jan === 'fech' ? GIRO_ESTILOS : GIRO_ESTILOS.filter((_, i) => i !== 3);
  return L[h % L.length];
}
export function giroNormaliza(r: any) {
  const s = (x: unknown, n: number) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const texto = String(r?.texto ?? r?.texto_bruto ?? '').split(/\n\s*\n/).map((p) => s(p, 2200)).filter(Boolean).join('\n\n').slice(0, 3500);
  if (!texto) throw new Error('A IA não devolveu o texto do giro.');
  return {
    titulo: s(r?.titulo, 220), texto,
    tecnico: (Array.isArray(r?.tecnico) ? r.tecnico : []).map((x: unknown) => s(x, 260)).filter(Boolean).slice(0, 4),
    destaques: (Array.isArray(r?.destaques) ? r.destaques : []).map((x: unknown) => s(x, 240)).filter(Boolean).slice(0, 4),
    leitura: ['alta', 'queda', 'lateral'].includes(String(r?.leitura || '').toLowerCase().trim()) ? String(r.leitura).toLowerCase().trim() : '',
    contexto: (Array.isArray(r?.contexto) ? r.contexto : []).map((x: unknown) => s(x, 260)).filter(Boolean).slice(0, 4),
    fontes: (Array.isArray(r?.fontes) ? r.fontes : []).map((f: any) => ({ titulo: s(f?.titulo, 160), url: /^https?:\/\//.test(String(f?.url || '')) ? s(f.url, 500) : '' })).filter((f: any) => f.titulo || f.url).slice(0, 5),
  };
}
const GIRO_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export async function giroCotacoes(): Promise<GiroCot[]> {
  const r = await fetch('https://scanner.tradingview.com/global/scan', {
    method: 'POST', signal: AbortSignal.timeout(9_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': GIRO_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({ symbols: { tickers: GIRO_TV.map((x) => x[1]), query: { types: [] } }, columns: ['close', 'change', 'change_abs', 'premarket_change', 'postmarket_change'] }),
  });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  const j = await r.json(), por = new Map<string, any[]>((j?.data || []).map((x: any) => [x.s, x.d || []]));
  return GIRO_TV.map(([k, s, n]) => {
    const d = por.get(s) || [], num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null);
    const juro = k.startsWith('di') || k === 'us10';
    return { k, n, px: num(d[0]), d1: juro ? num(d[2]) : num(d[1]), ext: k === 'ewz' ? num(d[3]) ?? num(d[4]) : null };
  });
}

/** Linhas da tabela "cotacoes" (ponte do Profit) por cima do TradingView: Ibovespa, WIN, WDO e DI, se atualizadas nos últimos 15 minutos. */
export type LinhaProfit = { ticker: string; ult: number | string | null; fec?: number | string | null; var?: number | string | null; updated_at: string };
export function giroProfit(q: GiroCot[], rows: LinhaProfit[], agoraMs = Date.now()): GiroCot[] {
  const n = (v: unknown) => { const x = typeof v === 'string' ? parseFloat(v) : v; return typeof x === 'number' && isFinite(x) && x > 0 ? x : null; };
  const frescas = rows.filter((r) => n(r.ult) && agoraMs - Date.parse(r.updated_at) <= 15 * 60_000).sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  const acha = (re: RegExp) => frescas.find((r) => re.test(String(r.ticker).toUpperCase()));
  const mapa: [string, RegExp][] = [['ibov', /^IBOV$/], ['win', /^(WINFUT|WIN[FGHJKMNQUVXZ]\d{2})$/], ['wdo', /^(WDOFUT|WDO[FGHJKMNQUVXZ]\d{2})$/], ['di29', /^DI1F29$/], ['di33', /^DI1F33$/]];
  return q.map((x) => {
    const m = mapa.find(([k]) => k === x.k); const r = m && acha(m[1]); if (!r) return { ...x, fonte: x.px != null ? 'TradingView' : undefined };
    const ult = n(r.ult)!, fec = n(r.fec), vr = typeof r.var === 'string' ? parseFloat(r.var) : r.var;
    const juro = x.k.startsWith('di');
    const d1 = juro ? (fec ? +(ult - fec).toFixed(3) : x.d1) : typeof vr === 'number' && isFinite(vr) ? vr : fec ? +((ult / fec - 1) * 100).toFixed(2) : x.d1;
    return { ...x, px: ult, d1, fonte: 'Profit' as const };
  });
}

// ---------- leitura técnica calculada com o histórico (o texto da IA cita estes níveis) ----------
export type Vela = [string, number, number, number, number, number]; // data, abertura, máxima, mínima, fechamento, volume
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mesAno = (d: string) => `${MES[+d.slice(5, 7) - 1]}/${d.slice(0, 4)}`;
const tempo = (d0: string, d1: string) => { const m = (+d1.slice(0, 4) - +d0.slice(0, 4)) * 12 + (+d1.slice(5, 7) - +d0.slice(5, 7)); return m >= 24 ? `${Math.floor(m / 12)} anos` : m >= 12 ? `${m} meses (mais de 1 ano)` : m >= 1 ? `${m} ${m === 1 ? 'mês' : 'meses'}` : 'algumas semanas'; };
/**
 * Fatos técnicos de um ativo: máxima histórica, máxima/mínima de 52 semanas, "menor/maior preço desde", médias de 50 e 200 dias,
 * sequência de altas/quedas e o suporte/resistência mais próximo (pivô de 5 velas de cada lado) com a data de origem.
 */
export function leituraTecnica(nome: string, cs: Vela[], px: number, maxHistMensal: number | null = null, dec = 2): string | null {
  const v = cs.filter((c) => c[4] > 0); if (v.length < 60 || !(px > 0)) return null;
  const fmt = (x: number) => x.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const fs = v.map((c) => c[4]), hoje = v[v.length - 1][0], out: string[] = [];
  const maxH = Math.max(maxHistMensal ?? 0, ...v.map((c) => c[2]));
  const dMax = (px / maxH - 1) * 100;
  if (px >= maxH * 0.999) out.push(`renovando a MÁXIMA HISTÓRICA (anterior ${fmt(maxH)})`);
  else if (dMax > -3) out.push(`a ${Math.abs(dMax).toFixed(1).replace('.', ',')}% da máxima histórica (${fmt(maxH)})`);
  const a52 = v.slice(-252), max52 = Math.max(...a52.map((c) => c[2])), min52 = Math.min(...a52.map((c) => c[3]));
  if (dMax <= -3) { if (px >= max52 * 0.995) out.push(`na máxima de 52 semanas (${fmt(max52)})`); }
  if (px < min52) out.push(`NOVA MÍNIMA de 52 semanas (a anterior era ${fmt(min52)})`); else if (px <= min52 * 1.005) out.push(`na mínima de 52 semanas (${fmt(min52)})`);
  // menor/maior preço desde: último fechamento (antes das 3 últimas sessões) tão baixo/alto quanto agora
  const ate = v.slice(0, -3);
  let iMenor = -1, iMaior = -1;
  for (let i = ate.length - 1; i >= 0; i--) { if (iMenor < 0 && ate[i][4] <= px) iMenor = i; if (iMaior < 0 && ate[i][4] >= px) iMaior = i; if (iMenor >= 0 && iMaior >= 0) break; }
  const desde = (i: number, tipo: string) => { if (i < 0) return `${tipo} preço em todo o histórico disponível (${tempo(v[0][0], hoje)})`; const t = tempo(ate[i][0], hoje); return t === 'algumas semanas' ? null : `${tipo} preço desde ${mesAno(ate[i][0])} (${t})`; };
  const dMen = desde(iMenor, 'menor'), dMai = dMax < -3 ? desde(iMaior, 'maior') : null;
  if (dMen && (iMenor < 0 || ate.length - iMenor > 30)) out.push(dMen);
  if (dMai && (iMaior < 0 || ate.length - iMaior > 30)) out.push(dMai);
  const sma = (n: number) => fs.length >= n ? fs.slice(-n).reduce((t, x) => t + x, 0) / n : null, m50 = sma(50), m200 = sma(200);
  if (m200) out.push(`${px >= m200 ? 'acima' : 'abaixo'} da média de 200 dias (${fmt(m200)})${m50 ? `, ${px >= m50 ? 'acima' : 'abaixo'} da de 50 (${fmt(m50)})` : ''}`);
  let seq = 0; const sinal = Math.sign(fs[fs.length - 1] - fs[fs.length - 2]);
  for (let i = fs.length - 1; i > 0 && Math.sign(fs[i] - fs[i - 1]) === sinal && sinal !== 0; i--) seq++;
  if (seq >= 3) out.push(`${seq} ${sinal > 0 ? 'altas' : 'quedas'} seguidas no fechamento`);
  // suporte (pivô de fundo abaixo) e resistência (pivô de topo acima) mais próximos, até 10% de distância
  const k = 5, piv: { tipo: 'fundo' | 'topo'; v: number; d: string }[] = [];
  for (let i = k; i < v.length - k; i++) {
    const viz = [...v.slice(i - k, i), ...v.slice(i + 1, i + k + 1)];
    if (viz.every((c) => v[i][3] < c[3])) piv.push({ tipo: 'fundo', v: v[i][3], d: v[i][0] });
    if (viz.every((c) => v[i][2] > c[2])) piv.push({ tipo: 'topo', v: v[i][2], d: v[i][0] });
  }
  const sup = piv.filter((p) => p.tipo === 'fundo' && p.v < px && p.v > px * 0.9).sort((a, b) => b.v - a.v)[0];
  const res = piv.filter((p) => p.tipo === 'topo' && p.v > px && p.v < px * 1.1).sort((a, b) => a.v - b.v)[0];
  if (sup) out.push(`suporte mais próximo em ${fmt(sup.v)} (fundo de ${mesAno(sup.d)}, ${((px / sup.v - 1) * 100).toFixed(1).replace('.', ',')}% abaixo)`);
  if (res) out.push(`resistência mais próxima em ${fmt(res.v)} (topo de ${mesAno(res.d)}, ${((res.v / px - 1) * 100).toFixed(1).replace('.', ',')}% acima)`);
  const ano = v.find((c) => c[0] >= hoje.slice(0, 4) + '-01-01');
  if (ano) { const ytd = (px / v[v.indexOf(ano) - 1 >= 0 ? v.indexOf(ano) - 1 : v.indexOf(ano)][4] - 1) * 100; out.push(`${ytd >= 0 ? '+' : ''}${ytd.toFixed(1).replace('.', ',')}% no ano`); }
  return out.length ? `${nome} (${fmt(px)}): ${out.join(' · ')}` : null;
}

// ===== servidor =====
// Coach do trader: resumo do dia (18h) e relatório da semana (sexta 19h), com os dados que o app manda.
export const SYS_COACH = `Você é um coach de performance de traders (mesa proprietária brasileira), direto e respeitoso, que usa as ideias de Van Tharp (Super Trader), Mark Douglas e a gestão de risco de Flávio Lemos.
Você recebe em JSON os dados reais do trader: as operações (ativo, lado, horário, resultado em R e em dinheiro, se seguiu as regras, erro marcado, setup), os checklists de preparação da MANHÃ e da NOITE (o que preencheu e o que deixou em branco, rotinas cumpridas), os limites do dia, as regras escritas dele e, quando houver, o resumo do mercado no dia.
Escreva em português do Brasil, falando com o trader ("você"):
- "resumo": 3 a 5 frases com o retrato do período: resultado, disciplina e o que mais chamou atenção. Cite números do JSON.
- "pontos_fortes": até 4 itens concretos (com número ou exemplo do JSON).
- "a_melhorar": até 4 itens concretos, ligando o erro ao contexto (ex.: "entrou contra a tendência do WIN às 10h12, quando o mercado caía com o risk off").
- "padroes": até 3 padrões que aparecem nos dados (horário, setup, dia da semana, operar sem preparação, aumentar a mão depois de perda). Só o que os dados mostram.
- "plano": até 4 ações práticas para amanhã (dia) ou para a próxima semana (semana).
- "nota_disciplina": número de 0 a 10 só pela disciplina (preparação feita, regras seguidas, limites respeitados), não pelo lucro.
REGRAS: use só os dados enviados; não invente operações nem números. Se houver poucos dados, diga isso. Nada de recomendação de compra ou venda de ativos. Sem emojis.
Responda SOMENTE JSON: {"resumo":"","pontos_fortes":[""],"a_melhorar":[""],"padroes":[""],"plano":[""],"nota_disciplina":0}`;
export function coachNormaliza(r: any) {
  const s = (x: unknown, n: number) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const L = (x: unknown, k: number) => (Array.isArray(x) ? x : []).map((y) => s(y, 320)).filter(Boolean).slice(0, k);
  const resumo = s(r?.resumo ?? r?.texto_bruto, 1500);
  if (!resumo) throw new Error('A IA não devolveu o resumo.');
  const nota = Number(r?.nota_disciplina);
  return { resumo, pontos_fortes: L(r?.pontos_fortes, 4), a_melhorar: L(r?.a_melhorar, 4), padroes: L(r?.padroes, 3), plano: L(r?.plano, 4), nota_disciplina: isFinite(nota) ? Math.max(0, Math.min(10, Math.round(nota * 10) / 10)) : null };
}

// ===== servidor =====
// Estudos de sazonalidade: rally de fim de ano, eleições presidenciais, mês a mês e decisões do Copom.
// IBOV e ações (Yahoo, fechamento diário desde 2000), dólar PTAX venda (Banco Central, série 1) e Selic meta (série 432).
// Setores = cesta igual das principais ações de cada setor (média dos retornos das que tinham preço na janela).
export type SzPonto = { d: string; v: number };
export type SzSerie = SzPonto[];
export type SzAtivo = { k: string; n: string; s?: SzSerie; cesta?: SzSerie[]; membros?: string[] };

const SZ_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export const SZ_SETORES: { k: string; n: string; tks: string[] }[] = [
  { k: 'bancos', n: 'Bancos', tks: ['ITUB4', 'BBDC4', 'BBAS3'] },
  { k: 'commod', n: 'Commodities', tks: ['VALE3', 'PETR4', 'GGBR4', 'CSNA3'] },
  { k: 'consumo', n: 'Consumo', tks: ['ABEV3', 'LREN3', 'RADL3'] },
  { k: 'eletricas', n: 'Elétricas', tks: ['CMIG4', 'ELET3', 'AXIA3', 'EGIE3', 'TAEE11'] },
  { k: 'imob', n: 'Imobiliário', tks: ['CYRE3', 'MRVE3', 'EVEN3'] },
];
// 1º e 2º turno das eleições presidenciais (domingos)
export const SZ_ELEICOES: { ano: number; t1: string; t2: string | null }[] = [
  { ano: 2002, t1: '2002-10-06', t2: '2002-10-27' }, { ano: 2006, t1: '2006-10-01', t2: '2006-10-29' },
  { ano: 2010, t1: '2010-10-03', t2: '2010-10-31' }, { ano: 2014, t1: '2014-10-05', t2: '2014-10-26' },
  { ano: 2018, t1: '2018-10-07', t2: '2018-10-28' }, { ano: 2022, t1: '2022-10-02', t2: '2022-10-30' },
  { ano: 2026, t1: '2026-10-04', t2: '2026-10-25' },
];

// ---------- utilidades de datas e séries ----------
export const szMais = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
/** Último ponto em ou antes de d (até 7 dias antes; mais velho que isso = sem preço). */
export function szAte(s: SzSerie, d: string): SzPonto | null {
  let lo = 0, hi = s.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (s[m].d <= d) { r = m; lo = m + 1; } else hi = m - 1; }
  if (r < 0) return null;
  return s[r].d >= szMais(d, -7) ? s[r] : null;
}
/** Primeiro ponto em ou depois de d (até 7 dias depois). */
export function szApos(s: SzSerie, d: string): SzPonto | null {
  let lo = 0, hi = s.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (s[m].d >= d) { r = m; hi = m - 1; } else lo = m + 1; }
  if (r < 0) return null;
  return s[r].d <= szMais(d, 7) ? s[r] : null;
}
const szRet1 = (s: SzSerie | undefined, d0: string, d1: string): number | null => {
  if (!s) return null; const a = szAte(s, d0), b = szAte(s, d1);
  return a && b && a.v > 0 && b.d > a.d ? (b.v / a.v - 1) * 100 : null;
};
/** Retorno % entre o fechamento em d0 e em d1 (último preço em ou antes de cada data). Cesta = média dos membros com preço. */
export function szRet(a: SzAtivo, d0: string, d1: string): number | null {
  if (a.s) return szRet1(a.s, d0, d1);
  const rs = (a.cesta || []).map((s) => szRet1(s, d0, d1)).filter((x): x is number => x != null);
  return rs.length ? rs.reduce((t, x) => t + x, 0) / rs.length : null;
}
const szR2 = (x: number | null) => (x == null || !isFinite(x) ? null : +x.toFixed(2));
export function szStats(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x != null && isFinite(x));
  if (!v.length) return { qtd: 0, media: null, mediana: null, pos: null, melhor: null, pior: null };
  const o = [...v].sort((a, b) => a - b), m = o.length >> 1;
  return { qtd: v.length, media: szR2(v.reduce((t, x) => t + x, 0) / v.length), mediana: szR2(o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2), pos: Math.round((v.filter((x) => x > 0).length / v.length) * 100), melhor: szR2(o[o.length - 1]), pior: szR2(o[0]) };
}
/** Pregões (datas) do calendário do IBOV. */
const szPregoes = (cal: SzSerie) => cal.map((p) => p.d);
/** Último pregão de um mês (AAAA-MM). */
function szUltimoPregao(cal: string[], ym: string): string | null { let r: string | null = null; for (const d of cal) { if (d.startsWith(ym)) r = d; else if (r && d > ym) break; } return r; }

// ---------- 1) mês a mês ----------
export function szMesAMes(ativos: SzAtivo[], cal: SzSerie, hoje: string) {
  const dias = szPregoes(cal), anoIni = +dias[0].slice(0, 4) + (dias[0].slice(5, 7) === '01' ? 0 : 1), mesAtual = hoje.slice(0, 7);
  const fim: Record<string, string> = {};
  for (const d of dias) fim[d.slice(0, 7)] = d; // último pregão de cada mês
  const meses: string[] = Object.keys(fim).filter((ym) => ym < mesAtual && +ym.slice(0, 4) >= anoIni).sort();
  const ant = (ym: string) => { const y = +ym.slice(0, 4), m = +ym.slice(5, 7); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };
  const porAtivo = ativos.map((a) => {
    const rets: Record<string, number | null> = {};
    for (const ym of meses) { const p = fim[ant(ym)]; rets[ym] = p ? szR2(szRet(a, p, fim[ym])) : null; }
    const mes = Array.from({ length: 12 }, (_, i) => { const mm = String(i + 1).padStart(2, '0'); return { m: i + 1, ...szStats(meses.filter((ym) => ym.endsWith('-' + mm)).map((ym) => rets[ym])) }; });
    return { k: a.k, n: a.n, mes, rets };
  });
  const anos = [...new Set(meses.map((ym) => ym.slice(0, 4)))];
  const ib = porAtivo.find((x) => x.k === 'ibov');
  // matriz ano × mês do IBOV (para o mapa de calor) e o mês corrente até agora
  const matriz = ib ? anos.map((y) => ({ ano: +y, m: Array.from({ length: 12 }, (_, i) => ib.rets[`${y}-${String(i + 1).padStart(2, '0')}`] ?? null) })) : [];
  const pAnt = fim[ant(mesAtual)], atual = pAnt ? ativos.map((a) => ({ k: a.k, v: szR2(szRet(a, pAnt, hoje)) })) : [];
  return { de: meses[0], ate: meses[meses.length - 1], ativos: porAtivo.map(({ rets: _r, ...x }) => x), matriz, mes_atual: { m: +mesAtual.slice(5, 7), parcial: atual } };
}

// ---------- 2) rally de fim de ano ----------
export function szFimDeAno(ativos: SzAtivo[], cal: SzSerie, hoje: string) {
  const dias = szPregoes(cal), anos: number[] = [];
  for (let y = +dias[0].slice(0, 4); y <= +hoje.slice(0, 4); y++) anos.push(y);
  const JAN = [
    { k: 'dez', n: 'Dezembro inteiro', ex: 'último pregão de nov → último de dez' },
    { k: 'quinzena', n: '2ª quinzena de dezembro', ex: 'fech. 15/12 → último pregão do ano' },
    { k: 'natal', n: 'Rally do Papai Noel', ex: '5 últimos pregões do ano + 2 primeiros de janeiro' },
    { k: 'jan', n: 'Efeito janeiro', ex: 'último pregão do ano → último de janeiro' },
  ];
  const linhas: any[] = [];
  for (const y of anos) {
    const nov = szUltimoPregao(dias, `${y}-11`), dez = szUltimoPregao(dias, `${y}-12`), jan = szUltimoPregao(dias, `${y + 1}-01`);
    const dDez = dias.filter((d) => d.startsWith(`${y}-12`)), dJan = dias.filter((d) => d.startsWith(`${y + 1}-01`));
    const iDez = dias.indexOf(dDez[dDez.length - 1] || '');
    const w: Record<string, [string, string] | null> = {
      dez: nov && dez && dez < hoje && dez.slice(5) >= '12-2' ? [nov, dez] : null,
      quinzena: dez && dez.slice(5) >= '12-2' ? [`${y}-12-15`, dez] : null,
      natal: dDez.length >= 5 && dJan.length >= 2 && iDez >= 5 ? [dias[iDez - 5], dJan[1]] : null,
      jan: dez && jan && dJan.length >= 15 && jan < hoje ? [dez, jan] : null,
    };
    const lin: any = { ano: y };
    for (const j of JAN) { const p = w[j.k]; lin[j.k] = p ? Object.fromEntries(ativos.map((a) => [a.k, szR2(szRet(a, p[0], p[1]))])) : null; }
    if (JAN.some((j) => lin[j.k])) linhas.push(lin);
  }
  const resumo = JAN.map((j) => ({ ...j, ativos: ativos.map((a) => ({ k: a.k, n: a.n, ...szStats(linhas.map((l) => l[j.k]?.[a.k] ?? null)) })) }));
  return { janelas: resumo, anos: linhas.reverse() };
}

// ---------- 3) eleições presidenciais ----------
export function szEleicoes(ativos: SzAtivo[], cal: SzSerie, hoje: string) {
  const JAN = [
    { k: 'semana', n: 'Semana antes', ex: 'sexta antes da semana → sexta pré-urna' },
    { k: 'pre', n: 'Pré-eleição', ex: 'segunda anterior → sexta pré-urna' },
    { k: 'pos', n: 'Reação ao resultado', ex: 'sexta pré-urna → segunda seguinte' },
    { k: 'trade', n: 'Trade segunda → segunda', ex: 'compra na segunda anterior, venda na segunda seguinte' },
    { k: 'mes', n: 'Um mês depois', ex: 'sexta pré-urna → 30 dias depois' },
  ];
  const turno = (t: 1 | 2) => {
    const linhas: any[] = [];
    for (const e of SZ_ELEICOES) {
      const T = t === 1 ? e.t1 : e.t2; if (!T) continue;
      const sexta = szMais(T, -2), segAnt = szMais(T, -6), sextaAnt = szMais(T, -9), segDep = szMais(T, 1), mes = szMais(T, 28);
      const w: Record<string, [string, string]> = { semana: [sextaAnt, sexta], pre: [segAnt, sexta], pos: [sexta, segDep], trade: [segAnt, segDep], mes: [sexta, mes] };
      const lin: any = { ano: e.ano, data: T, futuro: T >= hoje };
      for (const j of JAN) { const [a, b] = w[j.k]; lin[j.k] = b > hoje ? null : Object.fromEntries(ativos.map((x) => [x.k, szR2(szRet(x, a, b))])); }
      // pontos do IBOV, como na tabela do estudo
      const ib = ativos.find((x) => x.k === 'ibov')?.s;
      if (ib) lin.ibov_pts = { sexta_antes: szAte(ib, sextaAnt)?.v ?? null, segunda_antes: szAte(ib, segAnt)?.v ?? null, sexta_pre: szAte(ib, sexta)?.v ?? null, segunda_depois: segDep <= hoje ? szAte(ib, segDep)?.v ?? null : null };
      linhas.push(lin);
    }
    const passadas = linhas.filter((l) => !l.futuro);
    return { linhas, resumo: JAN.map((j) => ({ ...j, ativos: ativos.map((a) => ({ k: a.k, n: a.n, ...szStats(passadas.map((l) => l[j.k]?.[a.k] ?? null)) })) })) };
  };
  return { t1: turno(1), t2: turno(2), obs: 'Retornos entre fechamentos; sem custos. Eleição de 2026: só as janelas que já terminaram.' };
}

// ---------- 4) decisões do Copom (mudanças da Selic meta) ----------
export function szDecisoes(selic: SzSerie): { d: string; de: number; para: number }[] {
  // série 432 é diária: a nova meta vale a partir do dia seguinte à reunião; a decisão é o último dia com a meta antiga
  const out: { d: string; de: number; para: number }[] = [];
  for (let i = 1; i < selic.length; i++) if (selic[i].v !== selic[i - 1].v) out.push({ d: selic[i - 1].d, de: selic[i - 1].v, para: selic[i].v });
  return out;
}
export function szCopom(ativos: SzAtivo[], cal: SzSerie, selic: SzSerie, hoje: string) {
  const dias = szPregoes(cal), idx = (d: string) => { let r = -1; for (let i = 0; i < dias.length && dias[i] <= d; i++) r = i; return r; };
  const JAN = [
    { k: 'antes', n: 'Semana antes', ex: '5 pregões antes → dia da decisão' },
    { k: 'reacao', n: 'Reação no dia seguinte', ex: 'fech. do dia da decisão → fech. do dia seguinte (o Copom anuncia depois do fechamento)' },
    { k: 'semana', n: 'Semana depois', ex: 'dia da decisão → 5 pregões depois' },
  ];
  const decs = szDecisoes(selic).filter((x) => x.d >= dias[0]);
  const linhas = decs.map((x) => {
    const i = idx(x.d), D = dias[i], Dm5 = dias[i - 5], D1 = dias[i + 1], D5 = dias[i + 5];
    const w: Record<string, [string | undefined, string | undefined]> = { antes: [Dm5, D], reacao: [D, D1], semana: [D, D5] };
    const lin: any = { data: x.d, de: x.de, para: x.para, tipo: x.para > x.de ? 'alta' : 'corte', bp: Math.round((x.para - x.de) * 100) };
    for (const j of JAN) { const [a, b] = w[j.k]; lin[j.k] = a && b && b <= hoje ? Object.fromEntries(ativos.map((t) => [t.k, szR2(szRet(t, a, b))])) : null; }
    return lin;
  });
  const grupo = (f: (l: any) => boolean) => JAN.map((j) => ({ ...j, ativos: ativos.map((a) => ({ k: a.k, n: a.n, ...szStats(linhas.filter(f).map((l) => l[j.k]?.[a.k] ?? null)) })) }));
  return { alta: grupo((l) => l.tipo === 'alta'), corte: grupo((l) => l.tipo === 'corte'), linhas: linhas.reverse().slice(0, 40), n_alta: linhas.filter((l) => l.tipo === 'alta').length, n_corte: linhas.filter((l) => l.tipo === 'corte').length, obs: 'Só reuniões que mudaram a Selic (as de manutenção não aparecem na série do Banco Central).' };
}

// ---------- coleta ----------
async function szYahoo(sym: string): Promise<SzSerie> {
  const p2 = Math.floor(Date.now() / 1000);
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?period1=946684800&period2=${p2}&interval=1d`, { headers: { 'User-Agent': SZ_UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error('Yahoo ' + sym + ' ' + r.status);
  const R = (await r.json())?.chart?.result?.[0], ts: number[] = R?.timestamp || [], c: (number | null)[] = R?.indicators?.adjclose?.[0]?.adjclose || R?.indicators?.quote?.[0]?.close || [];
  const out: SzSerie = [];
  ts.forEach((t, i) => { const v = c[i]; if (typeof v === 'number' && v > 0) out.push({ d: new Date((t - 3 * 3600) * 1000).toISOString().slice(0, 10), v /* data em Brasília: o pregão é de dia, o antigo horário de verão não muda a data */ }); });
  return out.filter((p, i, a) => i === a.length - 1 || a[i + 1].d !== p.d);
}
async function szBcb(n: number, desde = 2000): Promise<SzSerie> {
  const fmt = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  const hoje = new Date(), partes: [Date, Date][] = [];
  for (let y = desde; y <= hoje.getUTCFullYear(); y += 9) partes.push([new Date(Date.UTC(y, 0, 1)), new Date(Math.min(Date.UTC(y + 8, 11, 31), hoje.getTime()))]); // a API limita 10 anos por pedido
  const blocos = await Promise.all(partes.map(async ([a, b]) => {
    const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados?formato=json&dataInicial=${fmt(a)}&dataFinal=${fmt(b)}`, { headers: { Accept: 'application/json', 'User-Agent': SZ_UA }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error('Banco Central série ' + n + ' ' + r.status);
    const j = await r.json();
    return (Array.isArray(j) ? j : []).map((x: any) => { const [d, m, y] = String(x.data).split('/'); return { d: `${y}-${m}-${d}`, v: parseFloat(String(x.valor).replace(',', '.')) }; }).filter((p: SzPonto) => p.v > 0);
  }));
  return blocos.flat().sort((a, b) => (a.d < b.d ? -1 : 1));
}
let cSaz: { ts: number; v: unknown } | null = null;
export async function sazonalidade() {
  if (cSaz && Date.now() - cSaz.ts < 12 * 3600_000) return cSaz.v;
  const tks = [...new Set(SZ_SETORES.flatMap((s) => s.tks))];
  const [ib, ptax, selic, ...acoes] = await Promise.all([
    szYahoo('^BVSP'), szBcb(1).catch(() => [] as SzSerie), szBcb(432).catch(() => [] as SzSerie),
    ...tks.map((t) => szYahoo(t + '.SA').catch(() => [] as SzSerie)),
  ]);
  if (ib.length < 1000) throw new Error('Histórico do Ibovespa indisponível agora. Tente de novo em alguns minutos.');
  const por: Record<string, SzSerie> = {}; tks.forEach((t, i) => (por[t] = acoes[i]));
  const ativos: SzAtivo[] = [
    { k: 'ibov', n: 'Ibovespa', s: ib },
    ...(ptax.length ? [{ k: 'dolar', n: 'Dólar (PTAX)', s: ptax }] : []),
    ...SZ_SETORES.map((s) => ({ k: s.k, n: s.n, cesta: s.tks.map((t) => por[t]).filter((x) => x.length > 100), membros: s.tks.filter((t) => por[t].length > 100) })),
  ];
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const v = {
    gerado: new Date().toISOString(), hoje,
    ativos: ativos.map((a) => ({ k: a.k, n: a.n, membros: a.membros || null })),
    mes: szMesAMes(ativos, ib, hoje), fim_ano: szFimDeAno(ativos, ib, hoje), eleicoes: szEleicoes(ativos, ib, hoje),
    copom: selic.length ? szCopom(ativos, ib, selic, hoje) : null,
    fontes: 'Ibovespa e ações: Yahoo Finance (fechamento ajustado); dólar: PTAX venda e Selic meta: Banco Central (SGS 1 e 432). Setores: média das ações de cada cesta. Sem custos. Passado não garante resultado futuro.',
  };
  cSaz = { ts: Date.now(), v };
  return v;
}

// ===== servidor =====
// Termômetro de medo e ganância (cópia do sentimento/calc.ts, fechada num escopo próprio para não colidir com os indicadores da análise).
// Gerado a partir de sentimento/calc.ts: se mudar lá, copie de novo.
export const SENT = (() => {
  // supabase/functions/sentimento/calc.ts — Índice de Medo e Ganância calculado pelo código (funções puras, testadas em calc.test.ts).
  // Cada componente vira uma nota de 0 (medo extremo) a 100 (ganância extrema) comparando o valor de hoje com o último ano.
  type Serie = { t: string[]; c: number[]; h?: number[]; l?: number[] };

  const rotulo = (v: number | null) => v == null ? 'sem dado' : v < 25 ? 'Medo extremo' : v < 45 ? 'Medo' : v <= 55 ? 'Neutro' : v <= 75 ? 'Ganância' : 'Ganância extrema';
  const r0 = (x: number) => Math.round(Math.max(0, Math.min(100, x)));
  const sma = (a: number[], n: number, i: number) => { if (i + 1 < n) return null; let s = 0; for (let k = i - n + 1; k <= i; k++) s += a[k]; return s / n; };
  /** Posição percentual de x dentro da amostra (0 = menor valor do período, 100 = maior). */
  function percentil(amostra: number[], x: number): number | null {
    const a = amostra.filter((v) => isFinite(v));
    if (a.length < 20 || !isFinite(x)) return null;
    const menores = a.filter((v) => v < x).length, iguais = a.filter((v) => v === x).length;
    return r0(((menores + iguais / 2) / a.length) * 100);
  }
  function rsi(c: number[], i: number, n = 14): number | null {
    if (i < n) return null;
    let g = 0, l = 0;
    for (let k = 1; k <= n; k++) { const d = c[k] - c[k - 1]; if (d >= 0) g += d; else l -= d; }
    g /= n; l /= n;
    for (let k = n + 1; k <= i; k++) { const d = c[k] - c[k - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; }
    return l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  const ret = (c: number[], i: number, n: number) => (i >= n && c[i - n] > 0 ? c[i] / c[i - n] - 1 : NaN);
  const vol = (c: number[], i: number, n = 20) => { if (i < n) return NaN; const r: number[] = []; for (let k = i - n + 1; k <= i; k++) r.push(Math.log(c[k] / c[k - 1])); const m = r.reduce((a, b) => a + b, 0) / n; return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) * Math.sqrt(252); };
  /** Alinha uma série secundária pelas datas da principal (último valor conhecido). */
  function alinha(base: Serie, outra: Serie | null): number[] | null {
    if (!outra || !outra.t.length) return null;
    const m = new Map<string, number>(); outra.t.forEach((d, i) => m.set(d, outra.c[i]));
    let ult = NaN; return base.t.map((d) => { const v = m.get(d); if (v != null && isFinite(v)) ult = v; return ult; });
  }

  type Componente = { id: string; nome: string; nota: number | null; leitura: string };
  type Def = { id: string; nome: string; valor: (i: number) => number; inverte?: boolean; direto?: boolean; leitura: (v: number) => string };

  /** Calcula o índice em cada um dos últimos `dias` pregões (percentil contra os 252 pregões anteriores a cada dia). */
  function indice(defs: Def[], n: number, dias: number) {
    const hist: { i: number; v: number | null; comps: Componente[] }[] = [];
    for (let i = Math.max(0, n - dias); i < n; i++) {
      const comps = defs.map((d) => {
        const x = d.valor(i);
        let nota: number | null = null;
        if (isFinite(x)) {
          if (d.direto) nota = r0(x);
          else { const am: number[] = []; for (let k = Math.max(0, i - 252); k < i; k++) { const v = d.valor(k); if (isFinite(v)) am.push(v); } const p = percentil(am, x); nota = p == null ? null : d.inverte ? 100 - p : p; }
        }
        return { id: d.id, nome: d.nome, nota, leitura: isFinite(x) ? d.leitura(x) : 'sem dado' };
      });
      const ok = comps.filter((c) => c.nota != null);
      hist.push({ i, v: ok.length >= 3 ? r0(ok.reduce((s, c) => s + (c.nota as number), 0) / ok.length) : null, comps });
    }
    return hist;
  }
  const pct = (x: number, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
  const num = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

  /** B3: momento do Ibovespa, força (RSI), volatilidade, posição na faixa de 52 semanas e porto seguro (Ibovespa × dólar). */
  function indiceB3(ibov: Serie, dolar: Serie | null, dias = 30) {
    const c = ibov.c, h = ibov.h || c, l = ibov.l || c, usd = alinha(ibov, dolar);
    const defs: Def[] = [
      { id: 'momento', nome: 'Momento (Ibovespa × média de 125 dias)', valor: (i) => { const m = sma(c, 125, i); return m ? c[i] / m - 1 : NaN; }, leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} da média` },
      { id: 'forca', nome: 'Força (RSI 14)', valor: (i) => rsi(c, i) ?? NaN, direto: true, leitura: (v) => 'RSI ' + num(v, 0) },
      { id: 'vol', nome: 'Volatilidade (20 dias)', valor: (i) => vol(c, i), inverte: true, leitura: (v) => pct(v) + ' ao ano' },
      { id: 'faixa', nome: 'Posição na faixa de 52 semanas', valor: (i) => { if (i < 20) return NaN; const a = Math.max(0, i - 251), mx = Math.max(...h.slice(a, i + 1)), mn = Math.min(...l.slice(a, i + 1)); return mx > mn ? ((c[i] - mn) / (mx - mn)) * 100 : NaN; }, direto: true, leitura: (v) => num(v, 0) + '% da faixa' },
      ...(usd ? [{ id: 'porto', nome: 'Porto seguro (Ibovespa × dólar em 20 dias)', valor: (i: number) => ret(c, i, 20) - ret(usd, i, 20), leitura: (v: number) => `${v >= 0 ? '+' : ''}${pct(v)} a favor da bolsa` } as Def] : []),
    ];
    return fecha(indice(defs, c.length, dias), ibov.t);
  }
  /** EUA (cálculo próprio, reserva quando a CNN não responde): S&P 500, VIX, RSI, faixa, ações × Treasuries e high yield × Treasuries. */
  function indiceEUA(spx: Serie, vix: Serie | null, tlt: Serie | null, hyg: Serie | null, ief: Serie | null, dias = 30) {
    const c = spx.c, h = spx.h || c, l = spx.l || c, V = alinha(spx, vix), T = alinha(spx, tlt), H = alinha(spx, hyg), I = alinha(spx, ief);
    const defs: Def[] = [
      { id: 'momento', nome: 'Momento (S&P 500 × média de 125 dias)', valor: (i) => { const m = sma(c, 125, i); return m ? c[i] / m - 1 : NaN; }, leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} da média` },
      { id: 'forca', nome: 'Força (RSI 14)', valor: (i) => rsi(c, i) ?? NaN, direto: true, leitura: (v) => 'RSI ' + num(v, 0) },
      { id: 'faixa', nome: 'Posição na faixa de 52 semanas', valor: (i) => { if (i < 20) return NaN; const a = Math.max(0, i - 251), mx = Math.max(...h.slice(a, i + 1)), mn = Math.min(...l.slice(a, i + 1)); return mx > mn ? ((c[i] - mn) / (mx - mn)) * 100 : NaN; }, direto: true, leitura: (v) => num(v, 0) + '% da faixa' },
      ...(V ? [{ id: 'vix', nome: 'Volatilidade (VIX)', valor: (i: number) => V[i], inverte: true, leitura: (v: number) => 'VIX ' + num(v) } as Def] : []),
      ...(T ? [{ id: 'porto', nome: 'Porto seguro (ações × Treasuries em 20 dias)', valor: (i: number) => ret(c, i, 20) - ret(T, i, 20), leitura: (v: number) => `${v >= 0 ? '+' : ''}${pct(v)} a favor das ações` } as Def] : []),
      ...(H && I ? [{ id: 'junk', nome: 'Apetite por risco (high yield × Treasuries)', valor: (i: number) => ret(H, i, 20) - ret(I, i, 20), leitura: (v: number) => `${v >= 0 ? '+' : ''}${pct(v, 2)} em 20 dias` } as Def] : []),
    ];
    return fecha(indice(defs, c.length, dias), spx.t);
  }
  function fecha(h: ReturnType<typeof indice>, t: string[]) {
    const u = h[h.length - 1], val = (k: number) => { const x = h[h.length - 1 - k]; return x ? x.v : null; };
    return { valor: u ? u.v : null, rotulo: rotulo(u ? u.v : null), data: u ? t[u.i] : null, componentes: u ? u.comps : [], ontem: val(1), semana: val(5), mes: val(21), hist: h.map((x) => ({ d: t[x.i], v: x.v })) };
  }
  /** Lê a resposta do Yahoo (chart) em séries diárias. */
  function serieYahoo(j: any): Serie | null {
    const r = j?.chart?.result?.[0], ts: number[] = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {};
    const out: Serie = { t: [], c: [], h: [], l: [] };
    ts.forEach((x, i) => { const c = q.close?.[i], h = q.high?.[i], l = q.low?.[i]; if (typeof c === 'number' && c > 0) { out.t.push(new Date(x * 1000 - 3 * 3600e3).toISOString().slice(0, 10)); out.c.push(c); out.h!.push(typeof h === 'number' ? h : c); out.l!.push(typeof l === 'number' ? l : c); } });
    return out.c.length ? out : null;
  }
  /** alternative.me (cripto) → formato comum. */
  function lerCripto(j: any) {
    const d = Array.isArray(j?.data) ? j.data : [];
    const pts = d.map((x: any) => ({ d: new Date(+x.timestamp * 1000).toISOString().slice(0, 10), v: +x.value })).filter((x: any) => isFinite(x.v)).reverse();
    if (!pts.length) return null;
    const u = pts[pts.length - 1], k = (n: number) => (pts[pts.length - 1 - n] ? pts[pts.length - 1 - n].v : null);
    return { valor: u.v, rotulo: rotulo(u.v), data: u.d, ontem: k(1), semana: k(7), mes: k(30), hist: pts.slice(-30), componentes: [] as Componente[] };
  }
  /** CNN (EUA) → formato comum. */
  function lerCNN(j: any) {
    const f = j?.fear_and_greed, h = j?.fear_and_greed_historical?.data;
    if (!f || !isFinite(+f.score)) return null;
    const pts = (Array.isArray(h) ? h : []).map((x: any) => ({ d: new Date(+x.x).toISOString().slice(0, 10), v: Math.round(+x.y) })).filter((x: any) => isFinite(x.v));
    const ult = new Map<string, number>(); pts.forEach((p: any) => ult.set(p.d, p.v));
    const comp = (k: string, nome: string) => { const x = j?.[k]; return x && isFinite(+x.score) ? { id: k, nome, nota: Math.round(+x.score), leitura: String(x.rating || '') } : null; };
    const comps = [comp('market_momentum_sp500', 'Momento do S&P 500'), comp('stock_price_strength', 'Força das ações (máximas × mínimas)'), comp('stock_price_breadth', 'Amplitude (volume em alta × baixa)'), comp('put_call_options', 'Opções put/call'), comp('market_volatility_vix', 'Volatilidade (VIX)'), comp('safe_haven_demand', 'Porto seguro'), comp('junk_bond_demand', 'Apetite por high yield')].filter(Boolean) as Componente[];
    const v = Math.round(+f.score);
    return { valor: v, rotulo: rotulo(v), data: f.timestamp ? String(f.timestamp).slice(0, 10) : null, ontem: isFinite(+f.previous_close) ? Math.round(+f.previous_close) : null, semana: isFinite(+f.previous_1_week) ? Math.round(+f.previous_1_week) : null, mes: isFinite(+f.previous_1_month) ? Math.round(+f.previous_1_month) : null, hist: [...ult.entries()].map(([d, v]) => ({ d, v })).slice(-30), componentes: comps };
  }

  return { indiceB3, lerCNN, serieYahoo, rotulo };
})();

// ===== servidor =====
// Calendário de balanços da B3 (TradingView): quem divulgou ontem/hoje e quem divulga nos próximos dias.
export type Bal = { tk: string; nome: string; d: string; cap: number; hora?: string | null; quando?: 'antes' | 'durante' | 'depois' | null; conf?: 'cvm' | 'com' | 'est'; link?: string };
const BAL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export const balDiaBR = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
/** Dia da divulgação: meia-noite UTC = só a data (sem horário), então vale o dia UTC; senão, o dia em Brasília. */
export const balDia = (ts: number) => (ts % 86400 === 0 ? new Date(ts * 1000).toISOString().slice(0, 10) : balDiaBR(ts));
/** Horário da divulgação em Brasília. Meia-noite UTC (21h em Brasília) é como o TradingView marca "sem horário": devolve null. */
export function balHora(ts: number): { hora: string | null; quando: 'antes' | 'durante' | 'depois' | null } {
  if (ts % 86400 === 0) return { hora: null, quando: null };
  const b = new Date((ts - 3 * 3600) * 1000), h = b.getUTCHours(), m = b.getUTCMinutes();
  return { hora: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, quando: h < 10 ? 'antes' : h >= 17 ? 'depois' : 'durante' };
}
export function balLinhas(data: any[], col: number): Bal[] {
  return (Array.isArray(data) ? data : []).map((x: any): Bal | null => {
    const d = x?.d || [], ts = d[col];
    return typeof ts === 'number' && ts > 0 ? { tk: String(x.s || '').split(':').pop() || '', nome: String(d[1] || d[0] || '').slice(0, 40), d: balDia(ts), cap: +d[2] || 0, ...balHora(ts) } : null;
  }).filter((x): x is Bal => !!x && /^[A-Z]{4}\d{1,2}$/.test(x.tk))
    .sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
}
async function balScan(campo: string, t0: number, t1: number) {
  const r = await fetch('https://scanner.tradingview.com/brazil/scan', { method: 'POST', signal: AbortSignal.timeout(9_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': BAL_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({ filter: [{ left: campo, operation: 'in_range', right: [t0, t1] }, { left: 'market_cap_basic', operation: 'greater', right: 5e7 }],
      options: { lang: 'pt' }, columns: ['name', 'description', 'market_cap_basic', campo], sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, 250] }) });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  return balLinhas((await r.json())?.data, 3);
}
// ---------- segunda fonte: calendário de resultados do Yahoo Finance (o mesmo da página finance.yahoo.com/calendar/earnings) ----------
let YB: { cookie: string; crumb: string; ts: number } | null = null;
async function ybAuth() {
  if (YB && Date.now() - YB.ts < 3600_000) return YB;
  const r = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': BAL_UA }, signal: AbortSignal.timeout(8_000) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0]; await r.text().catch(() => '');
  const c = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': BAL_UA, Cookie: cookie }, signal: AbortSignal.timeout(8_000) });
  const crumb = await c.text();
  if (!c.ok || !crumb || crumb.includes('<')) throw new Error('Yahoo: sem crumb');
  return (YB = { cookie, crumb, ts: Date.now() });
}
/** Converte a resposta do Yahoo (colunas + linhas) em Bal. BMO = antes da abertura, AMC = após o fechamento. */
export function balYahooLinhas(j: any): Bal[] {
  const doc = j?.finance?.result?.[0]?.documents?.[0], cols: string[] = (doc?.columns || []).map((c: any) => c.id), rows: any[][] = doc?.rows || [];
  const ix = (k: string) => cols.indexOf(k);
  return rows.map((r): Bal | null => {
    const tk = String(r[ix('ticker')] || '').replace(/\.SA$/, ''), dt = Date.parse(String(r[ix('startdatetime')] || '')), tipo = String(r[ix('startdatetimetype')] || '');
    if (!/^[A-Z]{4}\d{1,2}$/.test(tk) || !isFinite(dt)) return null;
    const ts = Math.floor(dt / 1000), h = balHora(ts);
    const quando = tipo === 'BMO' ? 'antes' : tipo === 'AMC' ? 'depois' : h.quando;
    const temHora = !!h.hora && !(tipo === 'TNS' || tipo === 'TAS') ;
    return { tk, nome: String(r[ix('companyshortname')] || tk).slice(0, 40), d: balDia(ts), cap: +r[ix('intradaymarketcap')] || 0, hora: temHora ? h.hora : null, quando: temHora || tipo === 'BMO' || tipo === 'AMC' ? quando : null };
  }).filter((x): x is Bal => !!x);
}
async function balYahoo(de: string, ate: string): Promise<Bal[]> {
  const a = await ybAuth();
  const body = { sortType: 'ASC', entityIdType: 'earnings', sortField: 'startdatetime', includeFields: ['ticker', 'companyshortname', 'startdatetime', 'startdatetimetype', 'intradaymarketcap'],
    query: { operator: 'and', operands: [{ operator: 'gte', operands: ['startdatetime', de] }, { operator: 'lt', operands: ['startdatetime', ate] }, { operator: 'eq', operands: ['region', 'br'] }] }, offset: 0, size: 250 };
  const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/visualization?lang=pt-BR&region=BR&crumb=${encodeURIComponent(a.crumb)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': BAL_UA, Cookie: a.cookie }, body: JSON.stringify(body), signal: AbortSignal.timeout(9_000) });
  if (!r.ok) { if (r.status === 401) YB = null; throw new Error('Yahoo ' + r.status); }
  return balYahooLinhas(await r.json());
}
/** Junta as duas fontes: a data do TradingView vale; o horário vem de quem tiver; empresa que só uma fonte tem entra também. */
export function juntaBal(tv: Bal[], yh: Bal[]): Bal[] {
  const out = tv.map((x) => ({ ...x })), por = new Map(out.map((x) => [x.tk, x]));
  for (const y of yh) {
    const t = por.get(y.tk);
    if (!t) { out.push(y); por.set(y.tk, y); continue; }
    if (!t.hora && y.hora && y.d === t.d) { t.hora = y.hora; t.quando = y.quando; }
    else if (!t.quando && y.quando && y.d === t.d) t.quando = y.quando;
    if (!t.cap && y.cap) t.cap = y.cap;
  }
  return out.sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
}
// ---------- fonte oficial: documentos entregues à CVM (sistema RAD/ENET, o mesmo do site da CVM, em tempo real) ----------
// ITR/DFP e press-release entregues = o balanço saiu de fato. Comunicado com a data dos resultados = data confirmada pela empresa.
const RAD = 'https://www.rad.cvm.gov.br/ENET/';
export type RadDoc = { cvm: string; empresa: string; cat: string; tipo: string; esp: string; ref: string; versao: string; entrega: string; assunto: string; protocolo: string; seq?: string; ver?: string; desc?: string };
const semTag = (x: string) => String(x || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export function radLinhas(raw: string): RadDoc[] {
  return String(raw || '').split('&*').map((row) => row.split('$&')).filter((c) => c.length >= 11).map((c) => {
    const ent = semTag(c[6]).replace(/^\d{8}\s*/, ''), m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(ent);
    const pr = /OpenDownloadDocumentos\(\s*'(\d+)'\s*,\s*'(\d+)'\s*,\s*'(\d+)'\s*,\s*'([^']+)'\s*\)/.exec(c[10] || '');
    return { cvm: semTag(c[0]), empresa: semTag(c[1]), cat: semTag(c[2]), tipo: semTag(c[3]), esp: semTag(c[4]), ref: (/(\d{2})\/(\d{2})\/(\d{4})/.exec(semTag(c[5])) || []).slice(1).reverse().join('-'), versao: semTag(c[8]), entrega: m ? `${m[3]}-${m[2]}-${m[1]}T${m[4] || '00'}:${m[5] || '00'}` : '', assunto: semTag(c[11] || ''), protocolo: pr ? pr[3] : '', seq: pr ? pr[1] : '', ver: pr ? pr[2] : '', desc: pr ? pr[4] : '' };
  }).filter((d) => d.empresa && d.entrega);
}
async function radBusca(periodo: string, de = '', ate = ''): Promise<RadDoc[]> {
  let cookie = '';
  try { const g = await fetch(RAD + 'frmConsultaExternaCVM.aspx', { headers: { 'User-Agent': BAL_UA }, signal: AbortSignal.timeout(8_000) }); cookie = (g.headers.get('set-cookie') || '').split(/,(?=[^ ;]+=)/).map((c) => c.split(';')[0]).join('; '); await g.text().catch(() => ''); } catch { /* segue sem cookie */ }
  const body = { dataDe: de, dataAte: ate, empresa: '', setorAtividade: '-1', categoriaEmissor: '-1', situacaoEmissor: 'A', tipoParticipante: '1', dataReferencia: '', categoria: '', periodo, horaIni: '', horaFim: '', palavraChave: '', ultimaDtRef: 'false', tipoEmpresa: '2', token: '', versaoCaptcha: 'V3' };
  const r = await fetch(RAD + 'frmConsultaExternaCVM.aspx/ListarDocumentos', { method: 'POST', signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': BAL_UA, Origin: 'https://www.rad.cvm.gov.br', Referer: RAD + 'frmConsultaExternaCVM.aspx', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('CVM ' + r.status);
  const L = radLinhas((await r.json())?.d?.dados || '');
  if (!L.length) throw new Error('CVM sem documentos');
  return L;
}
/** Link do documento. O visualizador da CVM (frmExibirArquivoIPEExterno) abre em branco no iPhone, então:
 *  press-release/comunicado (IPE) = baixa o PDF direto; ITR/DFP = a página do formulário em HTML. */
export const RAD_LINK = (d: Partial<RadDoc> | string) => {
  if (typeof d === 'string') return d ? RAD + 'frmExibirArquivoIPEExterno.aspx?NumeroProtocoloEntrega=' + d : '';
  if (d.seq && d.protocolo && /^IPE$/i.test(d.desc || '')) return `${RAD}frmDownloadDocumento.aspx?Tela=ext&numSequencia=${d.seq}&numVersao=${d.ver || '1'}&numProtocolo=${d.protocolo}&descTipo=IPE&CodigoInstituicao=1`;
  if (d.seq && /^(ITR|DFP)$/i.test(d.desc || d.cat || '')) return `${RAD}frmGerenciaPaginaFRE.aspx?NumeroSequencialDocumento=${d.seq}&CodigoTipoInstituicao=1`;
  return d.protocolo ? RAD + 'frmExibirArquivoIPEExterno.aspx?NumeroProtocoloEntrega=' + d.protocolo : '';
};
const quandoDe = (h: number) => (h < 10 ? 'antes' : h >= 17 ? 'depois' : 'durante') as 'antes' | 'durante' | 'depois';
/** Balanço que saiu: ITR, DFP ou press-release de resultados entregue à CVM. */
export function radSaiu(L: RadDoc[]): Bal[] {
  const recente = (d: RadDoc) => !d.ref || (Date.parse(d.entrega.slice(0, 10)) - Date.parse(d.ref)) / 864e5 <= 100;
  const rel = (d: RadDoc) => (/release|resultado/i.test(d.tipo + ' ' + d.assunto) ? 1 : 0);
  return [...L].sort((a, b) => rel(a) - rel(b)).filter((d) => recente(d) && !/reapresenta/i.test(d.tipo + ' ' + d.esp + ' ' + d.assunto)).filter((d) => /^(ITR|DFP)$/i.test(d.cat) || (/econ[oô]mico.financeir/i.test(d.cat) && /release|resultado/i.test(d.tipo + ' ' + d.assunto)))
    .map((d) => { const h = +d.entrega.slice(11, 13), mi = d.entrega.slice(14, 16); return { tk: '', nome: d.empresa, d: d.entrega.slice(0, 10), cap: 0, hora: `${d.entrega.slice(11, 13)}:${mi}`, quando: quandoDe(h), conf: 'cvm' as const, link: RAD_LINK(d) }; });
}
/** Data confirmada em comunicado ("divulgação dos resultados do 3T26 em 05/11/2026, após o fechamento"). */
export function radComunicados(L: RadDoc[], hoje: string): Bal[] {
  const out: Bal[] = [];
  for (const d of L) {
    if (!/comunicado|aviso|fato|calend/i.test(d.cat)) continue;
    const t = d.assunto + ' ' + d.tipo + ' ' + d.esp;
    if (!/(divulga|resultad|balan|trimestr|\b[1-4]T\d{2}\b|ITR|DFP)/i.test(t)) continue;
    const m = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(t);
    if (!m) continue;
    let y = m[3] ? +m[3] : +d.entrega.slice(0, 4); if (y < 100) y += 2000;
    const dia = `${y}-${String(+m[2]).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < hoje || +m[2] > 12 || +m[1] > 31) continue;
    const q = /antes da abertura|pr[eé].?abertura/i.test(t) ? 'antes' : /ap[oó]s o fechamento|ap[oó]s o preg/i.test(t) ? 'depois' : null;
    out.push({ tk: '', nome: d.empresa, d: dia, cap: 0, hora: null, quando: q, conf: 'com', link: RAD_LINK(d) });
  }
  return out;
}
/* nome da empresa na CVM → ticker (lista de ações da B3 no TradingView; a de maior valor de mercado da empresa) */
const NORM_FORA = new Set(['S', 'A', 'SA', 'CIA', 'COMPANHIA', 'DE', 'DO', 'DA', 'DOS', 'DAS', 'E', 'ON', 'PN', 'PNA', 'PNB', 'UNT', 'NM', 'N1', 'N2', 'MA', 'ED', 'EJ', 'ATZ', 'EM', 'RECUPERACAO', 'JUDICIAL']);
export const nomeChave = (n: string) => String(n || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !NORM_FORA.has(w)).join('');
export type Tick = { tk: string; nome: string; cap: number };
export function tickerDe(empresa: string, T: Tick[]): Tick | null {
  const a = nomeChave(empresa); if (a.length < 3) return null;
  let best: Tick | null = null, bs = 0;
  for (const t of T) {
    const b = nomeChave(t.nome); if (b.length < 3) continue;
    let sc = 0;
    if (a === b) sc = 100; else if (b.length >= 6 && a.includes(b)) sc = 50 + b.length; else if (a.length >= 6 && b.includes(a)) sc = 50 + a.length;
    else { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; if (k >= 7) sc = k; }
    if (sc > bs || (sc === bs && sc > 0 && best && t.cap > best.cap)) { best = t; bs = sc; }
  }
  return bs > 0 ? best : null;
}
let cTk: { ts: number; v: Tick[] } | null = null;
async function listaTickers(): Promise<Tick[]> {
  if (cTk && Date.now() - cTk.ts < 24 * 3600_000) return cTk.v;
  const r = await fetch('https://scanner.tradingview.com/brazil/scan', { method: 'POST', signal: AbortSignal.timeout(9_000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': BAL_UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
    body: JSON.stringify({ filter: [{ left: 'market_cap_basic', operation: 'greater', right: 2e7 }], options: { lang: 'pt' }, columns: ['name', 'description', 'market_cap_basic'], sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' }, range: [0, 900] }) });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  const v = ((await r.json())?.data || []).map((x: any) => ({ tk: String(x.s || '').split(':').pop() || '', nome: String(x.d?.[1] || ''), cap: +x.d?.[2] || 0 })).filter((x: Tick) => /^[A-Z]{4}\d{1,2}$/.test(x.tk));
  cTk = { ts: Date.now(), v }; return v;
}
export function poeTicker(L: Bal[], T: Tick[]): Bal[] {
  return L.map((b) => { if (b.tk) return b; const t = tickerDe(b.nome, T); return t ? { ...b, tk: t.tk, cap: b.cap || t.cap } : { ...b, tk: b.nome.split(/\s+/)[0].slice(0, 12) }; });
}
/** Junta com prioridade: o que veio da CVM manda na data e no horário; comunicado confirma a data; o resto é estimativa. */
export function juntaConf(base: Bal[], extra: Bal[]): Bal[] {
  const out: Bal[] = base.map((x) => ({ ...x, conf: x.conf || 'est' })), por = new Map(out.map((x) => [x.tk, x]));
  for (const y of extra) {
    const t = por.get(y.tk);
    if (!t) { const n = { ...y }; out.push(n); por.set(y.tk, n); continue; }
    if (y.conf === 'cvm' || (y.conf === 'com' && t.conf !== 'cvm')) { t.d = y.d; t.conf = y.conf; t.link = y.link || t.link; if (y.hora || y.conf === 'cvm') { t.hora = y.hora; t.quando = y.quando; } else if (y.quando) t.quando = y.quando; }
  }
  return out.sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
}
/** A mesma empresa tem várias ações (GGBR3 e GGBR4): a data confirmada (CVM ou comunicado) vale para todas. */
export function irmaos(L: Bal[]): Bal[] {
  const raiz = (tk: string) => tk.slice(0, 4), conf = new Map<string, Bal>();
  for (const x of L) if ((x.conf === 'cvm' || x.conf === 'com') && /^[A-Z]{4}\d/.test(x.tk)) { const o = conf.get(raiz(x.tk)); if (!o || (x.conf === 'cvm' && o.conf !== 'cvm')) conf.set(raiz(x.tk), x); }
  const out: Bal[] = [], vis = new Set<string>();
  for (const x of L) {
    const c = conf.get(raiz(x.tk)), y = c && c !== x && x.conf !== 'cvm' ? { ...x, d: c.d, hora: c.hora, quando: c.quando, conf: c.conf, link: c.link } : x;
    if (vis.has(y.tk)) continue; vis.add(y.tk); out.push(y);
  }
  return out;
}
let cBal: { ts: number; v: any } | null = null;
/** dias = quantos dias à frente (inclui hoje). Devolve: ontem (divulgados no último pregão), hoje_lista e proximos, com a confirmação de cada um. */
export async function balancos(dias = 7) {
  if (cBal && Date.now() - cBal.ts < 15 * 60_000) return cBal.v;
  const agora = Math.floor(Date.now() / 1000), hoje = balDiaBR(agora);
  const ini = Math.floor(Date.parse(hoje + 'T00:00:00-03:00') / 1000), dw = new Date(hoje + 'T12:00:00Z').getUTCDay();
  const br = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  const [o1, p1, y1, r1, r2, tk] = await Promise.allSettled([
    balScan('earnings_release_date', ini - 86400 * 4, agora),
    balScan('earnings_release_next_date', ini, ini + 86400 * dias),
    balYahoo(balDiaBR(ini - 86400 * 4), balDiaBR(ini + 86400 * (dias + 1))),
    radBusca('1'),
    dw <= 2 ? radBusca('2', br(balDiaBR(ini - 86400 * 4)), br(hoje)) : Promise.resolve([] as RadDoc[]),
    listaTickers(),
  ]);
  const ok = <T>(x: PromiseSettledResult<T[]>) => (x.status === 'fulfilled' ? x.value : []);
  const err = (x: PromiseSettledResult<unknown>) => (x.status === 'rejected' ? String((x.reason as Error)?.message || x.reason).slice(0, 80) : '');
  const docs = [...ok(r1), ...ok(r2)].filter((d, i, a) => a.findIndex((e) => e.protocolo && e.protocolo === d.protocolo) === i);
  if ([o1, p1, y1].every((x) => x.status === 'rejected') && !docs.length) { if (cBal) return cBal.v; throw new Error('Calendário de balanços indisponível agora (CVM, TradingView e Yahoo).'); }
  const T = ok(tk), saiu = poeTicker(radSaiu(docs), T), com = poeTicker(radComunicados(docs, hoje), T), yh = ok(y1);
  const ont = juntaConf(juntaBal(ok(o1), yh.filter((x) => x.d <= hoje)), saiu), prox = juntaConf(juntaBal(ok(p1), yh.filter((x) => x.d >= hoje)), com);
  const fontes = [{ nome: 'CVM (documentos entregues)', ok: r1.status === 'fulfilled', n: docs.length, erro: err(r1) }, { nome: 'TradingView', ok: o1.status === 'fulfilled' || p1.status === 'fulfilled', n: ok(o1).length + ok(p1).length, erro: err(p1) || err(o1) }, { nome: 'Yahoo Finance', ok: y1.status === 'fulfilled', n: yh.length, erro: err(y1) }];
  // a confirmação da CVM vale para todas as ações da empresa e passa por cima de estimativas em outra data
  const tudo = irmaos([...ont.filter((x) => x.conf === 'cvm'), ...prox.filter((x) => x.conf === 'com'), ...ont.filter((x) => x.conf !== 'cvm'), ...prox.filter((x) => x.conf !== 'com')])
    .sort((a, b) => (a.d === b.d ? b.cap - a.cap : a.d < b.d ? -1 : 1));
  ont.length = 0; ont.push(...tudo.filter((x) => x.d <= hoje));
  prox.length = 0; prox.push(...tudo.filter((x) => x.d >= hoje));
  const antes = ont.filter((x) => x.d < hoje), ult = antes.length ? antes[antes.length - 1].d : '';
  const hojeL = [...ont.filter((x) => x.d === hoje), ...prox.filter((x) => x.d === hoje)].filter((x, i, a) => a.findIndex((y) => y.tk === x.tk) === i)
    .sort((a, b) => (a.conf === 'cvm' ? 0 : 1) - (b.conf === 'cvm' ? 0 : 1) || b.cap - a.cap);
  const v = { hoje, ontem: antes.filter((x) => x.d === ult), hoje_lista: hojeL, proximos: prox.filter((x) => x.d > hoje), fonte: fontes.filter((f) => f.ok).map((f) => f.nome.split(' (')[0]).join(' + '), fontes };
  cBal = { ts: Date.now(), v };
  return v;
}
export function textoBalancos(v: { ontem: Bal[]; hoje_lista: Bal[] }) {
  const n = (l: Bal[]) => l.slice(0, 8).map((x) => x.hora ? `${x.tk} ${x.hora}` : x.quando === 'antes' ? `${x.tk} (antes da abertura)` : x.quando === 'depois' ? `${x.tk} (após o fechamento)` : x.tk).join(', ') + (l.length > 8 ? ` e mais ${l.length - 8}` : '');
  const p: string[] = [];
  if (v.ontem.length) p.push(`Divulgaram (${v.ontem[0].d.slice(8, 10)}/${v.ontem[0].d.slice(5, 7)}): ${n(v.ontem)}.`);
  if (v.hoje_lista.length) p.push(`Hoje: ${n(v.hoje_lista)}.`);
  return p.length ? { title: `📑 Balanços: ${v.hoje_lista.length} hoje${v.ontem.length ? `, ${v.ontem.length} ${v.ontem.length === 1 ? "saiu" : "saíram"}` : ''}`, body: p.join(' ') } : null;
}

// ===== servidor =====
// Contexto do Giro: calendário eleitoral, sazonalidade histórica (o mesmo estudo da aba Sazonalidade do app) e o termômetro
// de medo e ganância (o mesmo cálculo da aba Sentimento). Tudo vira linhas curtas de texto para a IA usar como evidência.

const CX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const cxP = (x: number | null | undefined, d = 1) => x == null || !isFinite(x) ? '–' : `${x > 0 ? '+' : ''}${x.toFixed(d).replace('.', ',')}%`;
const cxD = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);
const cxDias = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Onde estamos no calendário eleitoral (presidencial). Linhas vazias fora do período. */
export function cxEleicao(hoje: string): { linhas: string[]; turno: 1 | 2 | null; fase: string } {
  const e = SZ_ELEICOES.find((x) => x.ano === +hoje.slice(0, 4));
  if (!e) return { linhas: [], turno: null, fase: '' };
  const t1 = e.t1, t2 = e.t2, L: string[] = [];
  if (hoje <= t1 && cxDias(hoje, t1) <= 75) {
    L.push(`Ano de eleição presidencial: o 1º turno é no domingo ${cxD(t1)} (faltam ${cxDias(hoje, t1)} dias)${t2 ? `; um eventual 2º turno em ${cxD(t2)}` : ''}.`);
    return { linhas: L, turno: 1, fase: 'pre1' };
  }
  if (t2 && hoje > t1 && hoje <= t2) {
    const f = cxDias(hoje, t2);
    L.push(`Estamos entre os turnos da eleição presidencial: o 1º turno foi em ${cxD(t1)} e o 2º turno é no domingo ${cxD(t2)} (${f === 0 ? 'hoje' : f === 1 ? 'amanhã' : `faltam ${f} dias`}). Pesquisas de intenção de voto e o noticiário eleitoral mexem com estatais, bancos, juros futuros e dólar.`);
    return { linhas: L, turno: 2, fase: f <= 7 ? 'semana2' : 'entre' };
  }
  const fim = t2 || t1;
  if (hoje > fim && cxDias(fim, hoje) <= 30) {
    L.push(`A eleição presidencial terminou em ${cxD(fim)} (há ${cxDias(fim, hoje)} dias): o mercado ainda precifica o resultado, a transição e os nomes da equipe econômica.`);
    return { linhas: L, turno: t2 ? 2 : 1, fase: 'pos' };
  }
  return { linhas: [], turno: null, fase: '' };
}

/** Sazonalidade: o mês atual na história, a janela eleitoral e o fim de ano (só o que estiver valendo agora). */
export async function cxSazonal(hoje: string, turno: 1 | 2 | null, fase: string): Promise<string[]> {
  const v: any = await sazonalidade();
  const L: string[] = [], m = +hoje.slice(5, 7);
  const ib = (v?.mes?.ativos || []).find((a: any) => a.k === 'ibov'), dol = (v?.mes?.ativos || []).find((a: any) => a.k === 'dolar');
  const st = ib?.mes?.[m - 1], sd = dol?.mes?.[m - 1];
  if (st && st.qtd) {
    const parc = (v?.mes?.mes_atual?.parcial || []).find((x: any) => x.k === 'ibov');
    L.push(`Sazonalidade de ${MESES[m - 1]} (${v.mes.de?.slice(0, 4)}–${v.mes.ate?.slice(0, 4)}, ${st.qtd} anos): Ibovespa com média de ${cxP(st.media)} no mês, subiu em ${st.pos}% dos anos (melhor ${cxP(st.melhor)}, pior ${cxP(st.pior)})${sd && sd.qtd ? `; dólar com média de ${cxP(sd.media)}` : ''}.${parc && parc.v != null ? ` Neste ${MESES[m - 1]}, até agora: ${cxP(parc.v)}.` : ''}`);
  }
  if (turno) {
    const T = turno === 2 ? v?.eleicoes?.t2 : v?.eleicoes?.t1, R = T?.resumo || [];
    const pega = (k: string, a: string) => R.find((j: any) => j.k === k)?.ativos?.find((x: any) => x.k === a);
    const nm: Record<string, string> = { semana: 'na semana antes da votação', pre: 'de segunda a sexta antes da votação', pos: 'na reação ao resultado (sexta → segunda)', mes: 'no mês seguinte à votação' };
    const ks = fase === 'pos' ? ['pos', 'mes'] : ['semana', 'pos'];
    for (const k of ks) {
      const i = pega(k, 'ibov'), d = pega(k, 'dolar');
      if (i && i.qtd) L.push(`Eleições presidenciais desde 2002 (${i.qtd} casos, ${turno}º turno), ${nm[k]}: Ibovespa com média de ${cxP(i.media)}, subiu em ${i.pos}% das vezes (melhor ${cxP(i.melhor)}, pior ${cxP(i.pior)})${d && d.qtd ? `; dólar com média de ${cxP(d.media)}` : ''}.`);
    }
    const ult = (T?.linhas || []).filter((l: any) => !l.futuro && l.pos && l.pos.ibov != null).slice(-3);
    if (ult.length && fase !== 'pos') L.push(`Reação do Ibovespa ao resultado nas últimas eleições (${turno}º turno): ${ult.map((l: any) => `${l.ano} ${cxP(l.pos.ibov)}`).join(', ')}.`);
  }
  if (m === 12 || (m === 11 && +hoje.slice(8, 10) >= 15)) {
    const n = (v?.fim_ano?.janelas || []).find((j: any) => j.k === 'natal')?.ativos?.find((x: any) => x.k === 'ibov');
    if (n && n.qtd) L.push(`Rally do Papai Noel (5 últimos pregões do ano + 2 de janeiro): média de ${cxP(n.media)} no Ibovespa, positivo em ${n.pos}% dos anos.`);
  }
  return L;
}

async function cxYahoo(sym: string) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2y&interval=1d`, { headers: { 'User-Agent': CX_UA }, signal: AbortSignal.timeout(10_000) });
    return r.ok ? SENT.serieYahoo(await r.json()) : null;
  } catch { return null; }
}
/** Medo e ganância: B3 (cálculo do app) e EUA (CNN). */
export async function cxSentimento(): Promise<string[]> {
  const L: string[] = [];
  const [ibov, usd] = await Promise.all([cxYahoo('^BVSP'), cxYahoo('BRL=X')]);
  const fmt = (x: any) => `${x.valor} (${String(x.rotulo).toLowerCase()})${x.ontem != null ? `, ontem ${x.ontem}` : ''}${x.semana != null ? `, há uma semana ${x.semana}` : ''}${x.mes != null ? `, há um mês ${x.mes}` : ''}`;
  if (ibov) {
    const b: any = SENT.indiceB3(ibov, usd);
    if (b && b.valor != null) {
      const comp = (b.componentes || []).filter((c: any) => c && c.nota != null).sort((a: any, c: any) => Math.abs(c.nota - 50) - Math.abs(a.nota - 50)).slice(0, 2).map((c: any) => `${c.nome}: ${c.leitura}`).join('; ');
      L.push(`Medo e ganância da B3 (0 = medo extremo, 100 = ganância extrema; calculado pelo app): ${fmt(b)}.${comp ? ' O que mais pesa: ' + comp + '.' : ''}`);
    }
  }
  try {
    const de = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
    const r = await fetch(`https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${de}`, { headers: { 'User-Agent': CX_UA, Accept: 'application/json', Referer: 'https://edition.cnn.com/', Origin: 'https://edition.cnn.com' }, signal: AbortSignal.timeout(8_000) });
    if (r.ok) { const c: any = SENT.lerCNN(await r.json()); if (c && c.valor != null) L.push(`Medo e ganância dos EUA (CNN): ${fmt(c)}.`); }
  } catch { /* CNN fora: segue sem */ }
  return L;
}

/** Tudo junto, com tempo máximo: o giro não pode esperar demais. */
export async function giroContexto(hoje: string, ms = 14_000): Promise<{ eleicao: string[]; sazonal: string[]; sentimento: string[] }> {
  const el = cxEleicao(hoje);
  const ate = <T>(p: Promise<T>, vazio: T) => Promise.race([p.catch(() => vazio), new Promise<T>((r) => setTimeout(() => r(vazio), ms))]);
  const [sazonal, sentimento] = await Promise.all([ate(cxSazonal(hoje, el.turno, el.fase), [] as string[]), ate(cxSentimento(), [] as string[])]);
  return { eleicao: el.linhas, sazonal, sentimento };
}

// ===== servidor =====
// OpenRouter: modelos gratuitos (":free") como segunda IA, para aliviar o Gemini.
// Chave no Supabase: OPENROUTER_API_KEY. Opcional: OPENROUTER_MODELS = lista de modelos separada por vírgula (troca a escolha automática).

export const OR_KEY = Deno.env.get('OPENROUTER_API_KEY') || '';
const OR_PREF = ['deepseek/', 'qwen/qwen3', 'moonshotai/kimi', 'nvidia/nemotron', 'openai/gpt-oss', 'meta-llama/llama-4', 'meta-llama/llama-3.3-70b', 'z-ai/glm', 'google/gemma', 'mistralai/'];
let cOr: { ts: number; v: string[] } | null = null;

/** Escolhe até 4 modelos gratuitos de texto, com contexto grande, pela ordem de preferência. */
export function orEscolhe(lista: any[]): string[] {
  const gratis = (lista || []).filter((m) => {
    const id = String(m?.id || ''), p = m?.pricing || {}, ctx = +m?.context_length || 0;
    const zero = id.endsWith(':free') || (String(p.prompt) === '0' && String(p.completion) === '0');
    const texto = !m?.architecture?.output_modalities || (m.architecture.output_modalities as string[]).includes('text');
    return zero && texto && ctx >= 32000 && !/embed|guard|safety|moderat|audio|tts|image-gen|diffusion/i.test(id);
  });
  // modelos gigantes ou de raciocínio longo demoram e às vezes devolvem a resposta vazia: vão para o fim da fila
  const lento = (id: string) => /ultra|550b|480b|405b|-r1\b|r1-|thinking|reason|think/i.test(id) ? 50 : 0;
  const nota = (id: string) => { const i = OR_PREF.findIndex((p) => id.startsWith(p)); return (i < 0 ? 20 : i) + lento(id); };
  const ctx = new Map(gratis.map((m) => [String(m.id), +m.context_length || 0]));
  return gratis.map((m) => String(m.id)).sort((a, b) => nota(a) - nota(b) || (ctx.get(b)! - ctx.get(a)!) || a.localeCompare(b)).slice(0, 6);
}
export async function orModelos(): Promise<string[]> {
  const fixo = (Deno.env.get('OPENROUTER_MODELS') || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (fixo.length) return fixo;
  if (cOr && Date.now() - cOr.ts < 6 * 3600_000) return cOr.v;
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(6_000) });
    const v = orEscolhe((await r.json())?.data || []);
    if (v.length) { cOr = { ts: Date.now(), v }; return v; }
  } catch { /* lista fixa abaixo */ }
  return ['deepseek/deepseek-chat-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen3-235b-a22b:free'];
}
const orParse = (txt: string) => {
  const t = txt.replace(/```json|```/g, '').replace(/<think>[\s\S]*?<\/think>/g, '');
  try { return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); } catch { /* conserto */ }
  const z = jsonTolerante(t); return z && typeof z === 'object' ? z : null;
};
export let OR_ULTIMO = '';
/** Cota grátis do dia (50 pedidos sem créditos na conta) acabou: o OpenRouter fica de lado até a meia-noite UTC (21h de Brasília). */
export let OR_ESGOTADO_ATE = 0;
export const orEsgotado = (agora = Date.now()) => OR_ESGOTADO_ATE > agora;
export const OR_MSG_COTA = 'A cota grátis do dia no OpenRouter acabou (sem créditos na conta são 50 pedidos por dia). Ela volta às 21h de Brasília. Com US$ 10 de créditos na conta do OpenRouter, o limite dos modelos grátis sobe para 1.000 por dia.';
export function orCotaDia(status: number, texto: string, agora = Date.now()) {
  if (status !== 429 || !/free-models-per-day/i.test(texto)) return false;
  const d = new Date(agora); OR_ESGOTADO_ATE = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); return true;
}
/** Saúde dos modelos nesta instância: quem respondeu bem vai primeiro; quem falhou espera 30 min no fim da fila. */
const OR_FALHA = new Map<string, number>();
let OR_BOM = '';
export function orOrdem(modelos: string[], agora = Date.now()): string[] {
  const doente = (m: string) => (OR_FALHA.get(m) || 0) > agora - 30 * 60_000;
  const L = [...modelos].sort((a, b) => (+doente(a) - +doente(b)) || (+(b === OR_BOM) - +(a === OR_BOM)));
  return L;
}
/** Pergunta à IA do OpenRouter. Tenta os modelos gratuitos em ordem (no máximo 30 s cada); devolve o JSON (ou {texto_bruto}). */
export async function orChat(system: string, texto: string, opt: { json?: boolean; temp?: number; ate?: number; porModelo?: number } = {}): Promise<any> {
  if (!OR_KEY) throw new Error('OPENROUTER_API_KEY não configurada.');
  if (orEsgotado()) throw new Error(OR_MSG_COTA);
  const ate = opt.ate || Date.now() + 90_000, modelos = orOrdem(await orModelos());
  const erros: string[] = [];
  const falhou = (m: string, e: string) => { erros.push(`${m.split('/').pop()}: ${e}`); OR_FALHA.set(m, Date.now()); if (OR_BOM === m) OR_BOM = ''; };
  for (const m of modelos) {
    const ms = ate - Date.now(); if (ms < 8_000) break;
    for (const comFormato of opt.json ? [true, false] : [false]) {
      let r: Response;
      try {
        r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST', signal: AbortSignal.timeout(Math.min(ms - 1_000, opt.porModelo || 30_000)),
          headers: { Authorization: 'Bearer ' + OR_KEY, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://diario-de-trader.app', 'X-Title': 'Diario de Trader' },
          body: JSON.stringify({ model: m, temperature: opt.temp ?? 0.3, max_tokens: 8000, reasoning: { effort: 'low' }, messages: [{ role: 'system', content: system }, { role: 'user', content: texto }], ...(comFormato ? { response_format: { type: 'json_object' } } : {}) }),
        });
      } catch (e) { falhou(m, (e as Error).name === 'TimeoutError' ? 'demorou demais' : (e as Error).message); break; }
      if (!r.ok) {
        const t = (await r.text()).slice(0, 200);
        if (r.status === 400 && comFormato) continue; // o modelo não aceita o formato JSON: tenta sem
        if (orCotaDia(r.status, t)) throw new Error(OR_MSG_COTA); // a cota é da conta: os outros modelos grátis também vão recusar
        if (r.status === 402) {
          OR_ESGOTADO_ATE = Date.now() + 6 * 3600_000; // Sem créditos: não repetir em cada relatório da mesma instância.
          throw new Error('OpenRouter sem créditos disponíveis (402). A reserva ficará suspensa temporariamente; o Gemini continua sendo tentado.');
        }
        if (r.status === 401 || r.status === 403) throw new Error('OpenRouter recusou a chave (' + r.status + '): confira OPENROUTER_API_KEY no Supabase.');
        falhou(m, `${r.status}${r.status === 429 ? ' (sem cota agora)' : ''} ${t.replace(/\s+/g, ' ').slice(0, 80)}`); break; // 429/5xx/404: próximo modelo
      }
      const j = await r.json().catch(() => null), msg = j?.choices?.[0]?.message || {};
      let txt = String(msg.content || '');
      // modelos de raciocínio às vezes deixam a resposta só no "raciocínio": aproveita se houver um JSON lá
      if (!txt.trim() && opt.json && typeof msg.reasoning === 'string' && msg.reasoning.includes('{')) txt = msg.reasoning;
      if (!txt.trim()) { falhou(m, 'resposta vazia'); break; }
      if (!opt.json) { OR_ULTIMO = OR_BOM = m; return { texto_bruto: txt, modelo_ia: m }; }
      const p = orParse(txt);
      if (p) { OR_ULTIMO = OR_BOM = m; return p; }
      falhou(m, 'JSON inválido'); break;
    }
  }
  throw new Error('OpenRouter sem resposta (' + (erros.join(' · ') || 'sem modelos gratuitos') + ').');
}

// ===== servidor =====
// Jornal econômico do app: uma edição de manhã, uma no fim da tarde e uma de fim de semana, escritas pela IA com padrão de
// redação de jornal econômico (fatos com número e fonte, mecanismos econômicos explicados, sem viés político).
// As manchetes de fora (Money Times e Agência Brasil) entram só como pistas do que pesquisar: o texto é sempre original.
export type Edicao = 'manha' | 'meio' | 'tarde' | 'fds';
// 'meio' = tarde com o pregão em andamento (12h às 17h30); 'tarde' = fechamento, mostrado como edição da noite
export const ED_NOME: Record<Edicao, string> = { manha: 'Edição da manhã', meio: 'Edição da tarde', tarde: 'Edição da noite', fds: 'Edição de fim de semana' };

/** Qual edição vale agora (horário de Brasília). Antes das 6h vale a da tarde do dia anterior. */
export function jrEdicao(dia: string, min: number, diaSemana: number): { dia: string; ed: Edicao } {
  const ontem = (() => { const x = new Date(dia + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); })();
  const fds = (w: number) => w === 0 || w === 6;
  if (min < 6 * 60) { const w = (diaSemana + 6) % 7; return fds(w) ? { dia: ontem, ed: 'fds' } : { dia: ontem, ed: 'tarde' }; }
  if (fds(diaSemana)) return { dia, ed: 'fds' };
  return { dia, ed: min < 12 * 60 ? 'manha' : min < 17 * 60 + 30 ? 'meio' : 'tarde' };
}

// ---------- manchetes de fora (só título, horário e categoria; o texto das matérias não é lido) ----------
const JR_FEEDS = [
  ['https://www.moneytimes.com.br/mercados/feed/', 'Money Times'],
  ['https://www.moneytimes.com.br/economia/feed/', 'Money Times'],
  ['https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', 'Agência Brasil'],
] as const;
const JR_ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const jrDec = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/gi, (m, n) => JR_ENT[n.toLowerCase()] ?? m);
const jrTag = (x: string, n: string) => { const m = x.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, 'i')); return m ? jrDec(m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '')).replace(/<[^>]+>/g, '').trim() : ''; };
export type Manchete = { t: string; d: string; f: string; c: string[]; r?: string };
export function jrParse(xml: string, fonte: string): Manchete[] {
  const out: Manchete[] = [];
  for (const blk of xml.split(/<item[\s>]/i).slice(1)) {
    const x = blk.split(/<\/item>/i)[0], t = jrTag(x, 'title'), d = new Date(jrTag(x, 'pubDate'));
    if (!t || isNaN(+d)) continue;
    const r = jrTag(x, 'description').replace(/\s+/g, ' ').trim();
    out.push({ t: t.slice(0, 200), d: d.toISOString(), f: fonte, ...(r && r.toLowerCase() !== t.toLowerCase() ? { r: r.slice(0, 260) } : {}), c: [...x.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => jrDec(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim()).filter(Boolean).slice(0, 4) });
  }
  return out;
}
export async function jrManchetes(desdeH = 30): Promise<Manchete[]> {
  const desde = Date.now() - desdeH * 3600_000, vistos = new Set<string>(), out: Manchete[] = [];
  const res = await Promise.allSettled(JR_FEEDS.map(async ([u, f]) => { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; diario-trader/1.0)' }, signal: AbortSignal.timeout(7_000) }); if (!r.ok) throw new Error(String(r.status)); return jrParse(await r.text(), f); }));
  for (const r of res) if (r.status === 'fulfilled') for (const m of r.value) { const k = m.t.toLowerCase().slice(0, 80); if (+new Date(m.d) >= desde && !vistos.has(k)) { vistos.add(k); out.push(m); } }
  return out.sort((a, b) => +new Date(b.d) - +new Date(a.d)).slice(0, 40);
}

export const SYS_JORNAL = `Você é o editor-chefe de um jornal econômico brasileiro de referência, escrevendo para investidores, traders e estudantes de economia. Padrão de redação: precisão, números com fonte, mecanismos econômicos explicados e nenhum viés político-partidário.
Escreva em português do Brasil uma EDIÇÃO do jornal, com texto 100% ORIGINAL (nunca copie frases de outros veículos; as manchetes recebidas são só pistas do que pesquisar). Pesquise na internet os fatos do dia antes de escrever.
CADA MATÉRIA tem: "editoria" (Mercados, Macroeconomia, Juros e política monetária, Contas públicas, Empresas, Internacional, Commodities, Eleições e economia, Câmbio), "chapeu" (2 a 4 palavras, como nos jornais), "titulo" (informativo, com o fato e o número principal, até 110 caracteres), "linha_fina" (o desdobramento em uma frase, até 200 caracteres), "texto" (2 a 4 parágrafos separados por linha em branco; o 1º responde o quê, quem, quanto e por quê; os seguintes explicam o MECANISMO econômico, como o canal de transmissão dos juros, o efeito no câmbio, nos termos de troca, no fiscal, na inflação, no crédito e no fluxo estrangeiro, e trazem contexto histórico e comparações), "por_que_importa" (1 a 2 frases: o efeito prático no mercado, nos ativos ou no bolso), "numeros" (2 a 4 pares rótulo/valor com os números-chave da matéria) e "impacto" ({"ativos": até 5 códigos de ativos afetados, como PETR4, VALE3, ITUB4, WIN, WDO, DI, IBOV, S&P 500, Brent; "setores": até 3 setores da bolsa afetados, como Bancos, Petróleo, Mineração, Varejo, Construção, Elétricas, Exportadoras; "direcao": "alta", "baixa" ou "misto", o efeito provável da notícia sobre esses ativos}). Só coloque no impacto o que o texto sustenta; se não houver efeito claro, deixe as listas vazias.
ESTRUTURA DA EDIÇÃO:
- "manchete": a matéria mais importante do dia, com 3 a 4 parágrafos.
- "materias": 5 matérias de editorias DIFERENTES entre si e da manchete, escolhidas pela relevância do dia.
- "em_poucas_linhas": 4 a 6 notas curtas (uma frase cada) com fatos que não couberam nas matérias.
- "agenda": 3 a 6 itens {"quando","evento","por_que"} do que vem a seguir (indicadores, Copom/Fed, balanços, leilões, votações).
- "analise": {"titulo","texto"}: um artigo de análise da redação, em 2 parágrafos, com uma tese clara e fundamentada nos dados (é análise técnica, não opinião política nem recomendação de investimento).
- "fontes": até 8 {"titulo","url"} das fontes que você usou.
EDIÇÕES: "manha" = o que aconteceu desde o fechamento de ontem, exterior de madrugada, agenda e o que esperar do pregão. "meio" = edição da tarde, com o pregão em andamento: como a bolsa, o dólar e os juros estão ATÉ AGORA (números parciais do dia; escreva "até agora", "na parcial", nunca "fechou"), o que mexeu de manhã e o que observar no resto do pregão. "tarde" = edição da noite, o fechamento do dia: o que mexeu com os preços e por quê, o que fica para amanhã. "fds" = balanço da semana (com variações da semana) e o que esperar da próxima semana.
REGRAS:
1) Use EXATAMENTE os números dos blocos "Cotações" e "Leitura técnica"; número que não estiver lá só entra se você achar na pesquisa, citando a fonte no texto ("segundo o IBGE…", "dados do Banco Central…").
2) Eleições: cobertura factual (pesquisas, resultados, propostas econômicas e reação dos preços), sem tomar partido, sem adjetivar candidatos e sem prever quem vence.
3) Nada de recomendação de compra ou venda. Sem emojis. Sem clichês ("aversão ao risco" repetido, "no radar dos investidores", "sob a ótica"). Varie a construção das frases.
4) Se faltar informação confirmada sobre um assunto, não invente: troque de assunto.
Responda SOMENTE JSON: {"manchete":{"editoria":"","chapeu":"","titulo":"","linha_fina":"","texto":"","por_que_importa":"","numeros":[{"rotulo":"","valor":""}],"impacto":{"ativos":[""],"setores":[""],"direcao":""}},"materias":[{"editoria":"","chapeu":"","titulo":"","linha_fina":"","texto":"","por_que_importa":"","numeros":[{"rotulo":"","valor":""}],"impacto":{"ativos":[""],"setores":[""],"direcao":""}}],"em_poucas_linhas":[""],"agenda":[{"quando":"","evento":"","por_que":""}],"analise":{"titulo":"","texto":""},"fontes":[{"titulo":"","url":""}]}`;

const s = (x: unknown, n: number) => String(x ?? '').replace(/[ \t]+/g, ' ').trim().slice(0, n);
const par = (x: unknown, n: number) => String(x ?? '').split(/\n\s*\n/).map((p) => s(p.replace(/\s+/g, ' '), 1800)).filter(Boolean).join('\n\n').slice(0, n);
const nums = (L: unknown) => (Array.isArray(L) ? L : []).map((x: any) => ({ rotulo: s(x?.rotulo, 60), valor: s(x?.valor, 40) })).filter((x) => x.rotulo && x.valor).slice(0, 6);
const mat = (m: any, n = 4500) => ({ editoria: s(m?.editoria, 40) || 'Mercados', chapeu: s(m?.chapeu, 50), titulo: s(m?.titulo, 160), linha_fina: s(m?.linha_fina, 260), texto: par(m?.texto, n), por_que_importa: s(m?.por_que_importa, 400), numeros: nums(m?.numeros), impacto: imp(m?.impacto), placar: (['acima', 'em linha', 'abaixo'].includes(s(m?.placar, 12).toLowerCase()) ? s(m?.placar, 12).toLowerCase() : ''), consenso: s(m?.consenso, 300) });
function imp(x: any) { const L = (a: unknown, n: number, k: number) => (Array.isArray(a) ? a : []).map((v) => s(v, k)).filter(Boolean).slice(0, n); const d = s(x?.direcao, 10).toLowerCase(); return { ativos: L(x?.ativos, 5, 16), setores: L(x?.setores, 3, 40), direcao: ['alta', 'baixa', 'misto'].includes(d) ? d : '' }; }
export function jrNormaliza(r: any) {
  const manchete = mat(r?.manchete, 6000);
  if (!manchete.titulo || !manchete.texto) throw new Error('A IA não devolveu a manchete da edição.');
  return {
    manchete,
    materias: (Array.isArray(r?.materias) ? r.materias : []).map((m: any) => mat(m)).filter((m: any) => m.titulo && m.texto).slice(0, 10),
    em_poucas_linhas: (Array.isArray(r?.em_poucas_linhas) ? r.em_poucas_linhas : []).map((x: unknown) => s(x, 280)).filter(Boolean).slice(0, 8),
    cinco_coisas: (Array.isArray(r?.cinco_coisas) ? r.cinco_coisas : []).map((x: any) => (typeof x === 'string' ? { titulo: s(x, 140), texto: '' } : { titulo: s(x?.titulo, 140), texto: s(x?.texto, 300) })).filter((x: any) => x.titulo).slice(0, 5),
    fechamento_texto: s(r?.fechamento_texto, 700),
    grafico_do_dia: r?.grafico_do_dia && ['win', 'wdo', 'di'].includes(s(r.grafico_do_dia.ativo, 4).toLowerCase()) ? { ativo: s(r.grafico_do_dia.ativo, 4).toLowerCase(), titulo: s(r.grafico_do_dia.titulo, 120), texto: s(r.grafico_do_dia.texto, 400) } : null,
    mesa: r?.mesa && r.mesa.texto ? { titulo: s(r.mesa.titulo, 140), texto: par(r.mesa.texto, 2000) } : null,
    agenda: (Array.isArray(r?.agenda) ? r.agenda : []).map((a: any) => ({ quando: s(a?.quando, 40), pais: s(a?.pais, 30), evento: s(a?.evento, 140), por_que: s(a?.por_que, 220), impacto: (['alto', 'medio', 'baixo'].includes(s(a?.impacto, 8).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? s(a?.impacto, 8).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''), consenso: s(a?.consenso, 40), anterior: s(a?.anterior, 40) })).filter((a: any) => a.evento).slice(0, 10),
    analise: r?.analise && r.analise.texto ? { titulo: s(r.analise.titulo, 140), texto: par(r.analise.texto, 3000) } : null,
    fontes: (Array.isArray(r?.fontes) ? r.fontes : []).map((f: any) => ({ titulo: s(f?.titulo, 160), url: /^https?:\/\//.test(String(f?.url || '')) ? s(f.url, 500) : '' })).filter((f: any) => f.titulo || f.url).slice(0, 8),
    conferencia: confNormaliza(r?.conferencia),
    aula: aulaNormaliza(r?.aula),
  };
}

// ---------- "Para você": a edição ligada aos ativos do trader (sem busca; só com o que está na edição) ----------
export const SYS_VOCE = `Você é editor de um jornal econômico e escreve a seção "Para você" de um leitor que é trader. Use SOMENTE os fatos da edição recebida e o conhecimento geral sobre cada empresa, setor e ativo (o que mexe com cada um: petróleo para Petrobras, minério para Vale, juros para bancos e varejo, dólar para exportadoras, índice para o mini índice). Para cada ativo do leitor que tenha relação com algum fato da edição, escreva um item curto (até 2 frases) explicando a ligação e o que observar. Não invente notícia que não esteja na edição, não recomende compra nem venda e não fale de ativos sem relação. Se nada da edição tiver relação, devolva a lista vazia e diga isso em "resumo".
Responda SOMENTE JSON: {"itens":[{"ativo":"","texto":""}],"resumo":""}`;
export function vcNormaliza(r: any) {
  return { itens: (Array.isArray(r?.itens) ? r.itens : []).map((x: any) => ({ ativo: s(x?.ativo, 20).toUpperCase(), texto: s(x?.texto, 360) })).filter((x: any) => x.ativo && x.texto).slice(0, 6), resumo: s(r?.resumo, 300) };
}

// ---------- Plantão: matéria curta logo depois de um indicador importante ----------
export const SYS_PLANTAO = `Você é repórter de plantão de um jornal econômico brasileiro. Um indicador importante acabou de ser divulgado. Pesquise na internet o número divulgado e a reação imediata dos preços e escreva uma matéria curta e ORIGINAL em português do Brasil: "titulo" (com o número, até 110 caracteres), "linha_fina" (até 180 caracteres), "texto" (2 parágrafos separados por linha em branco: 1º o dado, o esperado e o anterior, com a fonte oficial; 2º o que significa para juros, câmbio e bolsa, e a reação dos preços se houver), "numeros" (até 3 pares {"rotulo","valor"}: divulgado, esperado, anterior). Se você NÃO encontrar o número divulgado em fonte confiável, responda {"sem_dado":true}. Sem viés político, sem recomendação, sem emojis.
Responda SOMENTE JSON: {"titulo":"","linha_fina":"","texto":"","numeros":[{"rotulo":"","valor":""}]}`;
export function plNormaliza(r: any) {
  if (r?.sem_dado) return null;
  const t = s(r?.titulo, 160), x = par(r?.texto, 2200);
  return t && x ? { titulo: t, linha_fina: s(r?.linha_fina, 240), texto: x, numeros: nums(r?.numeros).slice(0, 3) } : null;
}

// ---------- "A manhã acertou?": a edição da tarde confere o cenário da manhã com o fechamento ----------
export const CONF_PEDIDO = `\n\nCONFERÊNCIA: abaixo está o que a SUA edição da manhã de hoje disse. Compare, com honestidade e sem se defender, o cenário que a manhã traçou com o que de fato aconteceu no pregão (use as cotações e a pesquisa). Inclua no JSON o campo "conferencia": {"veredito":"acertou"|"parcial"|"errou","texto":"2 a 3 frases: o que a manhã esperou, o que aconteceu e por quê","pontos":[{"previsto":"","aconteceu":"","ok":true}]} com até 3 pontos concretos (direção da bolsa, do dólar, dos juros, um evento).`;
export function confNormaliza(c: any) {
  if (!c || !['acertou', 'parcial', 'errou'].includes(String(c.veredito))) return null;
  return { veredito: String(c.veredito), texto: s(c.texto, 600), pontos: (Array.isArray(c.pontos) ? c.pontos : []).map((p: any) => ({ previsto: s(p?.previsto, 160), aconteceu: s(p?.aconteceu, 160), ok: p?.ok === true })).filter((p: any) => p.previsto && p.aconteceu).slice(0, 3) };
}
export function manhaResumo(v: any) {
  if (!v?.manchete) return '';
  const m = (x: any) => `${x.titulo}. ${x.linha_fina || ''} ${x.por_que_importa || ''}`;
  return [`Manchete: ${m(v.manchete)}`, ...(v.materias || []).slice(0, 4).map((x: any) => `Matéria: ${m(x)}`), v.analise ? `Análise: ${v.analise.titulo}. ${String(v.analise.texto || '').slice(0, 700)}` : ''].filter(Boolean).join('\n').slice(0, 3500);
}

// ---------- Quiz da edição (para estudar economia com o jornal do dia) ----------
export const SYS_QUIZ = `Você é professor de Economia e prepara um quiz curto com base na edição do jornal recebida, para um estudante de Ciências Econômicas que também é trader. Faça 3 perguntas de múltipla escolha que testem a COMPREENSÃO dos mecanismos econômicos (por que os juros afetam o câmbio, o que um dado de inflação significa para o Copom, etc.), não decoreba de números. Use só os fatos da edição. Cada pergunta tem 4 alternativas plausíveis, exatamente uma correta, e uma explicação curta (até 2 frases) do porquê.
Responda SOMENTE JSON: {"perguntas":[{"p":"","ops":["","","",""],"c":0,"exp":""}]}`;
export function quizNormaliza(r: any) {
  return { perguntas: (Array.isArray(r?.perguntas) ? r.perguntas : []).map((q: any) => ({ p: s(q?.p, 300), ops: (Array.isArray(q?.ops) ? q.ops : []).map((o: unknown) => s(o, 160)).filter(Boolean).slice(0, 4), c: Math.max(0, Math.min(3, Math.round(+q?.c || 0))), exp: s(q?.exp, 400), disc: s(q?.disc, 120) })).filter((q: any) => q.p && q.ops.length === 4).slice(0, 3) };
}

// ---------- a edição é escrita por duas "redações" em paralelo (metade do texto cada = metade do tempo) ----------
export const PARTE_A = `\n\nPARTE 1 DE 4 — outras equipes escrevem o resto ao mesmo tempo. Escreva SOMENTE "manchete" (o assunto MAIS importante do dia, texto de 3 parágrafos), "analise" (2 a 3 parágrafos) e "fontes" (e "conferencia" ou "aula", se pedidas). Deixe "materias", "em_poucas_linhas" e "agenda" como listas vazias. Seja direto: pesquise só o necessário.`;
export const PARTE_B1 = `\n\nPARTE 2 DE 4 — outras equipes escrevem a manchete (o assunto MAIS importante do dia) e as outras matérias. Escreva SOMENTE "materias" com 3 matérias sobre o 2º, o 3º e o 4º assuntos mais importantes do dia (de editorias diferentes, texto de 2 a 3 parágrafos curtos cada, com o número que mexeu com o mercado) e "fontes". Responda {"materias":[...],"fontes":[...]}. Seja direto: pesquise só o necessário.`;
export const PARTE_B2 = `\n\nPARTE 3 DE 4 — outras equipes escrevem a manchete e as matérias dos assuntos mais importantes. Escreva SOMENTE "materias" com 3 matérias sobre o 5º, o 6º e o 7º assuntos mais importantes do dia (de preferência Empresas, Commodities, Internacional ou Contas públicas; texto de 2 a 3 parágrafos curtos cada, com o número que mexeu com o mercado) e "fontes". Responda {"materias":[...],"fontes":[...]}. Seja direto: pesquise só o necessário.`;
export const PARTE_C = `\n\nPARTE 4 DE 4 — outras equipes escrevem as matérias. Escreva SOMENTE estes campos:
"cinco_coisas": exatamente 5 itens, no estilo "5 coisas para saber antes da abertura": cada um com "titulo" (até 80 caracteres, com o fato e o número) e "texto" (1 frase dizendo o efeito no mercado brasileiro). Não repita a mesma notícia.
"em_poucas_linhas": 6 a 8 notas curtas de assuntos variados do dia, cada uma com o fato e o número.
"agenda": os indicadores, decisões de juros, leilões e votações que vêm por aí (NÃO coloque balanços de empresas, que o sistema acrescenta com as datas oficiais). Cada item com "quando" (dia e hora), "pais" (Brasil, EUA, Zona do Euro, China...), "evento", "por_que", "impacto" ("alto", "medio" ou "baixo"), "consenso" e "anterior". Preencha "consenso" e "anterior" SOMENTE com números que estejam nos dados recebidos neste pedido; se não estiverem, deixe "" (nunca invente número).
"fechamento_texto": 2 a 3 frases explicando como fecharam o Ibovespa, o dólar, os juros futuros e Nova York no último pregão, usando só as cotações recebidas neste pedido.
"grafico_do_dia": {"ativo": "win" (mini índice), "wdo" (dólar futuro) ou "di" (curva de juros), o gráfico que melhor conta a história do dia; "titulo": até 70 caracteres; "texto": 1 a 2 frases explicando o que o gráfico mostra}.
"mesa": {"titulo": "...", "texto": 2 parágrafos curtos de opinião da redação, no estilo de coluna de mercado: o que importa para quem opera hoje, os riscos e o que pode mudar o humor do pregão}. Não atribua falas a pessoas reais nem invente citações.
"fontes".
Responda {"cinco_coisas":[...],"em_poucas_linhas":[...],"agenda":[...],"fechamento_texto":"","grafico_do_dia":{},"mesa":{},"fontes":[...]}. Seja direto.`;
/** Partes escritas sem pesquisa na internet (bem mais rápidas): só com os blocos recebidos. */
export const SEM_BUSCA_JR = `\n\nNESTA PARTE VOCÊ NÃO TEM PESQUISA NA INTERNET: escreva SÓ com os fatos dos blocos recebidos (cotações, leitura técnica, contexto, balanços e as manchetes com os resumos oficiais). Não invente números, declarações nem fatos; o que não estiver nos blocos fica de fora. Em "fontes", liste só os veículos das manchetes usadas, sem link.`;
export const PARTE_CURTA = `\n\nEDIÇÃO CURTA: escreva a "manchete" (2 parágrafos) e 3 "materias" curtas (1 a 2 parágrafos), "em_poucas_linhas" e "analise" (1 parágrafo), usando SÓ as cotações, o contexto e as manchetes recebidas acima como base dos fatos.`;
const palavras = (t: string) => new Set(String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3));
/** Junta as duas partes; se a parte da manchete falhar, a primeira matéria vira manchete. Tira matéria repetida. */
export function jrJunta(a: any, ...resto: any[]) {
  const raw: any = { ...(a || {}) }, todas = [a, ...resto].filter(Boolean), lista = (k: string) => todas.flatMap((x: any) => Array.isArray(x?.[k]) ? x[k] : []);
  const ms = lista('materias');
  raw.fontes = lista('fontes');
  for (const k of ['em_poucas_linhas', 'agenda', 'cinco_coisas']) if (!(Array.isArray(raw[k]) && raw[k].length)) raw[k] = lista(k);
  for (const k of ['fechamento_texto', 'grafico_do_dia', 'mesa']) if (!raw[k]) { const x = todas.find((t: any) => t && t[k]); if (x) raw[k] = x[k]; }
  if (!raw.manchete?.titulo && ms.length) raw.manchete = ms.shift();
  const vistos = [palavras(raw.manchete?.titulo)];
  raw.materias = ms.filter((m: any) => { const p = palavras(m?.titulo); const rep = vistos.some((v) => { let c = 0; p.forEach((w) => v.has(w) && c++); return p.size && c >= 2 && c / p.size >= 0.6; }); if (!rep) vistos.push(p); return !rep; });
  const vu = new Set<string>(); raw.fontes = raw.fontes.filter((f: any) => { const k = String(f?.url || f?.titulo || ''); if (!k || vu.has(k)) return false; vu.add(k); return true; });
  return jrNormaliza(raw);
}

// ---------- Aula de domingo (edição de fim de semana): um conceito da faculdade explicado com as notícias da semana ----------
export const AULA_PEDIDO = `\n\nAULA DE DOMINGO: inclua também o campo "aula": escolha UM conceito de Ciências Econômicas que as notícias desta semana ilustram bem (ex.: curva de Phillips, regra de Taylor, paridade de juros, carry trade, efeito Fisher, multiplicador fiscal, termos de troca, expectativas racionais) e escreva {"conceito":"","titulo":"","texto":"3 a 4 parágrafos separados por linha em branco: o conceito em linguagem simples, de onde vem (autor ou escola), como as notícias da semana mostram o conceito na prática e o que ele ajuda a entender no mercado","perguntas":[{"p":"pergunta para o leitor pensar","r":"resposta curta"}]} com 2 ou 3 perguntas.`;
export function aulaNormaliza(a: any) {
  if (!a || !a.texto) return null;
  return { conceito: s(a.conceito, 80), titulo: s(a.titulo, 160), texto: par(a.texto, 4000), perguntas: (Array.isArray(a.perguntas) ? a.perguntas : []).map((q: any) => ({ p: s(q?.p, 300), r: s(q?.r, 500) })).filter((q: any) => q.p).slice(0, 3) };
}

// ---------- partes do jornal: aceita a resposta da IA mesmo quando ela vem "embrulhada" ou com nomes de campo diferentes ----------
const kN = (k: string) => String(k || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s-]+/g, '_');
const JR_CAMPOS: Record<string, string> = { manchete: 'manchete', manchete_principal: 'manchete', materia_principal: 'manchete', materias: 'materias', noticias: 'materias', em_poucas_linhas: 'em_poucas_linhas', poucas_linhas: 'em_poucas_linhas', notas: 'em_poucas_linhas', agenda: 'agenda', analise: 'analise', fontes: 'fontes', conferencia: 'conferencia', aula: 'aula', cinco_coisas: 'cinco_coisas', cinco: 'cinco_coisas', fechamento_texto: 'fechamento_texto', fechamento: 'fechamento_texto', grafico_do_dia: 'grafico_do_dia', grafico: 'grafico_do_dia', mesa: 'mesa', coluna: 'mesa', coluna_da_mesa: 'mesa' };
const temCampo = (o: any) => o && typeof o === 'object' && Object.keys(o).some((k) => JR_CAMPOS[kN(k)]);
/** Tira embrulhos ({"edicao":{...}}, [ {...} ], texto com JSON dentro) e padroniza os nomes dos campos. */
export function jrDesembrulha(r: any, parseTexto: (t: string) => any = () => null): any {
  if (r == null) return null;
  if (typeof r === 'string') r = parseTexto(r);
  if (r && typeof r.texto_bruto === 'string') r = parseTexto(r.texto_bruto) || r;
  if (Array.isArray(r)) r = r.find((x) => x && typeof x === 'object') || null;
  for (let i = 0; i < 3 && r && typeof r === 'object' && !temCampo(r); i++) { const v = Object.values(r).find((x) => temCampo(x) || (Array.isArray(x) && x.some(temCampo))); if (!v) break; r = Array.isArray(v) ? v.find(temCampo) : v; }
  if (!r || typeof r !== 'object') return null;
  const o: any = {};
  for (const [k, v] of Object.entries(r)) { const c = JR_CAMPOS[kN(k)]; if (c && o[c] == null) o[c] = v; }
  if (Array.isArray(o.manchete)) o.manchete = o.manchete[0];
  const mat = (m: any) => { if (!m || typeof m !== 'object') return m; const x: any = {}; for (const [k, v] of Object.entries(m)) x[kN(k).replace('linha_fina', 'linha_fina')] = v; return { ...x, titulo: x.titulo ?? x.title, texto: x.texto ?? x.corpo ?? x.text, chapeu: x.chapeu, por_que_importa: x.por_que_importa }; };
  if (o.manchete) o.manchete = mat(o.manchete);
  if (Array.isArray(o.materias)) o.materias = o.materias.map(mat);
  return o;
}
/** A parte serve? (A precisa de manchete; B, de matérias; C, de notas ou agenda) */
export function jrParteServe(id: string, r: any) {
  if (!r) return false;
  const temMat = Array.isArray(r.materias) && r.materias.some((m: any) => m?.titulo && m?.texto);
  if (id === 'A') return !!(r.manchete?.titulo && r.manchete?.texto) || temMat;
  if (id === 'C') return (Array.isArray(r.em_poucas_linhas) && r.em_poucas_linhas.length > 0) || (Array.isArray(r.agenda) && r.agenda.length > 0);
  return temMat;
}

// ---------- Balanços que saíram: uma matéria por empresa, lendo o documento oficial entregue à CVM ----------
export const PARTE_D = `\n\nPARTE ESPECIAL — BALANÇOS: outras equipes escrevem o resto do jornal. Escreva SOMENTE "materias": UMA matéria para CADA empresa da lista "BALANÇOS QUE SAÍRAM" abaixo, na mesma ordem, com "tk" (o código da ação), "editoria": "Empresas", "chapeu": "Balanço" seguido do trimestre (ex.: "Balanço 3T26"), "titulo" com o número principal (lucro ou prejuízo e a variação), "linha_fina", "texto" com 4 parágrafos curtos (1º: receita, Ebitda, lucro e margens, comparados com o mesmo trimestre do ano anterior e com o trimestre anterior; 2º: o que explicou o resultado (preço, volume, custos, câmbio, juros); 3º: dívida líquida, alavancagem (dívida líquida/Ebitda), geração de caixa e capex; 4º: dividendos ou JCP anunciados, perspectivas da empresa e o que o mercado vai olhar no pregão), "por_que_importa" e "numeros" (até 6: receita, Ebitda, lucro, margem Ebitda, dívida líquida/Ebitda e dividendos por ação), "placar" ("acima", "em linha" ou "abaixo" do que os analistas esperavam para o lucro; deixe "" se a pesquisa não trouxer a expectativa) e "consenso" (1 frase com o que o mercado esperava e de onde vem a estimativa; "" se não achar), e "impacto" ({"ativos": o código da ação e, se fizer sentido, até 2 empresas do mesmo setor; "setores": o setor; "direcao": "alta", "baixa" ou "misto", o efeito provável do resultado na ação). Os PDFs anexados são os documentos OFICIAIS que a empresa entregou à CVM: use-os como fonte principal dos números. Se não houver PDF de uma empresa, use a pesquisa. Nunca invente número: se não achar, diga que o documento não traz. Responda {"materias":[...]}.`;
/** Lista do prompt: quem divulgou, quando e se o PDF veio anexado. */
export function balSaiuTexto(L: { tk: string; nome?: string; d: string; hora?: string | null }[], comPdf: string[]) {
  return L.map((x) => `- ${x.tk}${x.nome ? ' (' + x.nome + ')' : ''}: documento entregue à CVM em ${x.d.slice(8, 10)}/${x.d.slice(5, 7)}${x.hora ? ' às ' + x.hora : ''}${comPdf.includes(x.tk) ? ' — PDF anexado' : ' — sem PDF (pesquise)'}`).join('\n');
}

// ===== servidor =====
// Varredura fundamentalista do Ibovespa (jornal): valor justo por Graham e Bazin para cada ação da lista,
// ranking pelo potencial de alta médio e UMA chamada à IA (sem busca) que resume as mais baratas.
// Triagem por números, não é recomendação de compra. Cache diário: varr:<dia>.
// A lista é de trabalho: a composição do Ibovespa muda a cada quadrimestre, revisar aqui.
const VARR_UNIVERSO = ['ABEV3', 'ALOS3', 'ASAI3', 'AXIA3', 'AZUL4', 'B3SA3', 'BBAS3', 'BBDC4', 'BBSE3', 'BEEF3', 'BPAC11', 'BRAV3', 'BRFS3', 'BRKM5', 'CMIG4', 'CMIN3', 'COGN3', 'CPFE3', 'CPLE6', 'CSAN3', 'CSNA3', 'CYRE3', 'ELET3', 'ELET6', 'EMBR3', 'ENGI11', 'EQTL3', 'GGBR4', 'GOAU4', 'HAPV3', 'HYPE3', 'ITSA4', 'ITUB4', 'JBSS3', 'KLBN11', 'LREN3', 'LWSA3', 'MGLU3', 'MRFG3', 'MRVE3', 'MULT3', 'NTCO3', 'PCAR3', 'PETR3', 'PETR4', 'PRIO3', 'RADL3', 'RAIL3', 'RAIZ4', 'RDOR3', 'RENT3', 'SBSP3', 'SLCE3', 'SUZB3', 'TAEE11', 'TIMS3', 'TOTS3', 'UGPA3', 'USIM5', 'VALE3', 'VBBR3', 'VIVT3', 'WEGE3', 'YDUQ3'];

const SYS_VARR = `Você escreve a seção "Oportunidades fundamentalistas" de um jornal de mercado para um trader iniciante (português do Brasil, claro, sem jargão sem explicação).
Você recebe um ranking de ações do Ibovespa com valor justo calculado por Graham e Bazin, e o potencial de alta em relação ao preço atual.
Regras: use só os números recebidos; não invente dados; não diga "compre" nem "venda". Deixe claro que é uma triagem por fórmulas simples, que não considera o momento técnico nem notícias, e que um preço abaixo do justo pode continuar abaixo por muito tempo.
Responda somente JSON: {"resumo": "até 3 frases sobre o que o ranking mostra", "destaques": [{"tk": "ticker da lista recebida", "leitura": "até 2 frases, citando o potencial e o motivo (ex.: lucro e patrimônio sustentam a conta de Graham; ou dividendos altos)"}]} com até 6 destaques.`;

async function varreduraGera(prazo: number) {
  const dia = hoje(), avisos: string[] = [], linhas: any[] = [];
  let i = 0, analisadas = 0;
  const trab = async () => {
    while (i < VARR_UNIVERSO.length && Date.now() < prazo) {
      const tk = VARR_UNIVERSO[i++];
      try {
        const r: any = await coletaFunCache(tk, 'BR', avisos, null);
        analisadas++;
        const f = r?.fund || {}, v = r?.val || {}, px = f.preco;
        const ups = [v?.graham?.upside_pct, v?.bazin_6pct?.upside_pct].filter((x: any) => typeof x === 'number' && isFinite(x));
        if (!px || !ups.length) continue;
        // filtro de qualidade mínimo: lucro positivo (se o dado existir) e ROE não negativo
        if (typeof f.pl === 'number' && f.pl <= 0) continue;
        if (typeof f.roe === 'number' && f.roe < 0) continue;
        const media = ups.reduce((a: number, b: number) => a + b, 0) / ups.length;
        linhas.push({ tk, preco: px, graham: v?.graham?.valor ?? null, graham_upside_pct: v?.graham?.upside_pct ?? null, bazin: v?.bazin_6pct?.valor ?? null, bazin_upside_pct: v?.bazin_6pct?.upside_pct ?? null, potencial_medio_pct: +media.toFixed(1), pl: f.pl ?? null, roe_pct: typeof f.roe === 'number' ? +(f.roe * 100).toFixed(1) : null });
      } catch (e) { avisos.push(`${tk}: sem dados (${(e as Error).message?.slice(0, 80)})`); }
    }
  };
  await Promise.all([trab(), trab(), trab(), trab(), trab(), trab()]);
  const ranking = linhas.filter((x) => x.potencial_medio_pct > 0).sort((a, b) => b.potencial_medio_pct - a.potencial_medio_pct);
  const top = ranking.slice(0, 8);
  const parcial = analisadas < VARR_UNIVERSO.length;
  let resumo = '', destaques: any[] = [];
  if (top.length) {
    try {
      const r = await gemini(SYS_VARR, [{ text: 'Ranking (mais baratas primeiro):\n' + JSON.stringify(top) }], { json: true, search: false });
      const j: any = typeof r === 'string' ? JSON.parse(r) : r;
      const ok = new Set(top.map((x) => x.tk));
      resumo = typeof j?.resumo === 'string' ? j.resumo.slice(0, 600) : '';
      destaques = (Array.isArray(j?.destaques) ? j.destaques : []).filter((d: any) => ok.has(d?.tk) && typeof d?.leitura === 'string').slice(0, 6).map((d: any) => ({ tk: d.tk, leitura: d.leitura.slice(0, 300) }));
    } catch (e) { avisos.push('IA: não escreveu o resumo desta vez'); }
  }
  const dados = { dia, universo: VARR_UNIVERSO.length, analisadas, parcial, ranking: top, todas_positivas: ranking.length, resumo, destaques, metodo: 'Graham (√(22,5 × LPA × VPA)) e Bazin (dividendos ÷ 6%), média do potencial de alta; filtro: lucro e ROE não negativos', avisos: avisos.slice(0, 8), gerado: new Date().toISOString() };
  if (!parcial && top.length) await cachePut(`varr:${dia}`, dados);
  return dados;
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
// Faculdade: aula de um tópico com exemplo real e atual, flashcards, e a edição do jornal ligada às disciplinas do aluno.
const fs = (x: unknown, n: number) => String(x ?? '').replace(/[ \t]+/g, ' ').trim().slice(0, n);
const fpar = (x: unknown, n: number) => String(x ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);

export const SYS_AULA = `Você é um professor universitário de Ciências Econômicas excelente e paciente, dando aula particular para um aluno do início do curso que trabalha em turnos numa siderúrgica e opera na bolsa. Explique o tópico pedido da disciplina pedida em português do Brasil simples, sem perder o rigor.
Use a ementa da disciplina, se vier, para ficar no nível e no recorte certos.
O mais importante: traga UM EXEMPLO REAL E ATUAL (de 2025 ou 2026, de preferência do Brasil, com nomes, números e datas), pesquisado na internet, que mostre o conceito acontecendo de verdade — numa empresa, no mercado, no governo ou na economia. Se o aluno é da Gerdau ou trader, um exemplo da siderurgia ou da bolsa ajuda, mas só se for verdadeiro.
Responda SOMENTE JSON: {"titulo":"","explicacao":"3 a 5 parágrafos curtos separados por linha em branco: o conceito, de onde vem (autor/escola, quando houver), como funciona com um exemplo simples, e por que importa","exemplo":{"titulo":"","texto":"2 parágrafos: o caso real e como ele mostra o conceito","fonte_url":""},"pontos":["até 5 pontos-chave para revisar, uma frase cada"],"pergunta":{"p":"uma pergunta para o aluno pensar","r":"resposta curta"},"flash":[{"f":"frente: pergunta curta","v":"verso: resposta curta"}]}
Faça de 6 a 8 flashcards. Nada de inventar dados: se não achar um exemplo real confiável, diga isso no texto do exemplo e use um caso histórico conhecido.`;
export function aulaNorm(r: any) {
  const ex = r?.exemplo || {};
  const out = {
    titulo: fs(r?.titulo, 160), explicacao: fpar(r?.explicacao, 5000),
    exemplo: ex?.texto ? { titulo: fs(ex.titulo, 160), texto: fpar(ex.texto, 2500), fonte_url: /^https?:\/\//.test(String(ex.fonte_url || '')) ? fs(ex.fonte_url, 400) : '' } : null,
    pontos: (Array.isArray(r?.pontos) ? r.pontos : []).map((x: unknown) => fs(x, 260)).filter(Boolean).slice(0, 6),
    pergunta: r?.pergunta?.p ? { p: fs(r.pergunta.p, 300), r: fs(r.pergunta.r, 600) } : null,
    flash: (Array.isArray(r?.flash) ? r.flash : []).map((x: any) => ({ f: fs(x?.f, 220), v: fs(x?.v, 400) })).filter((x: any) => x.f && x.v).slice(0, 10),
  };
  if (!out.explicacao) throw new Error('A IA não devolveu a aula. Tente de novo.');
  return out;
}

export const SYS_JORNAL_AULA = `Você é professor de Ciências Econômicas. Recebe a edição de hoje de um jornal econômico e a lista de disciplinas que o aluno está cursando agora. Para CADA disciplina, escolha a notícia da edição que melhor serve de exemplo real de algum conceito dela e explique a ligação em linguagem simples (1 parágrafo de até 5 frases), dizendo o nome do conceito. Use só os fatos da edição. Se nenhuma notícia servir para uma disciplina, diga isso e sugira o que observar nos próximos dias.
Responda SOMENTE JSON: {"itens":[{"disc":"nome da disciplina","conceito":"","materia":"título da notícia usada","texto":""}]}`;
export function jornalAulaNorm(r: any, discs: string[]) {
  const L = (Array.isArray(r?.itens) ? r.itens : []).map((x: any) => ({ disc: fs(x?.disc, 120), conceito: fs(x?.conceito, 120), materia: fs(x?.materia, 200), texto: fpar(x?.texto, 1400) })).filter((x: any) => x.disc && x.texto);
  // casa com o nome exato da disciplina do aluno (a IA às vezes encurta)
  const n = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  return L.map((x: any) => { const a = n(x.disc); const d = discs.find((d) => { const b = n(d); return b.filter((w) => a.includes(w)).length >= Math.min(2, b.length); }); return { ...x, disc: d || x.disc }; }).slice(0, 8);
}

// ===== servidor =====
// supabase/functions/analise/central.ts — Central de inteligência do terminal: a IA lê só os dados enviados pelo app e separa
// o que é dado confirmado, o que é interpretação e o que são cenários. O código confere os números dos "confirmados".
export const SYS_CENTRAL = `Você é o analista-chefe de uma mesa de operações brasileira. Recebe um JSON com os dados do terminal agora (macro, juros implícitos do Copom e do Fed, Focus, índices, setores, leitura técnica calculada pelo código, fundamentos e manchetes). Escreva em português do Brasil, direto, para um trader pessoa física.
REGRAS:
1) Use SOMENTE os dados do JSON. Não pesquise, não complete com memória, não invente número, data, empresa ou notícia.
2) "confirmados": só fatos que estão no JSON, com os números escritos exatamente como aparecem lá (pode trocar ponto por vírgula). Cite a fonte (o campo "fonte" do bloco, ou "terminal").
3) "interpretacoes": o que os dados sugerem, sempre com a base ("porque X subiu e Y caiu"). Escreva como leitura, não como certeza ("sugere", "pode indicar").
4) "tecnico": para cada ativo do bloco tecnico, a tendência (alta, baixa ou lateral) e se há sinal de mudança de tendência (use os eventos calculados: cruzamentos de médias, rompimento da média de 200, RSI saindo de extremos). Se não houver evento, diga que não há sinal.
5) "cenarios": otimista, neutro e pessimista, cada um CONDICIONAL ("se ... então ..."), com gatilhos observáveis e o que invalida. Não dê probabilidade, exceto as que já vêm calculadas no JSON (Copom/Fed implícitos), citando-as como tal.
6) Nada de recomendação de compra ou venda nem preço-alvo próprio. Previsão nunca é certeza.
7) Se faltar um bloco (null), diga em "lacunas" o que faltou e não comente o que não tem.
8) Cada número vem com a fonte e o horário do dado (campos fonte, dado_em, atraso). Nunca trate um dado atrasado ou antigo como se fosse de agora: cite o horário quando ele importar e, se o dado tiver mais de 30 minutos ou vier com atraso, diga isso. Se o JSON trouxer "qualidade" com problemas (cotação parada, divergência entre fontes), avise em "lacunas" e seja mais cauteloso.
9) Se o JSON tiver "foco" (um código de ativo), o relatório é sobre ESSE ativo: comece pelo ativo (preço, técnico do bloco ativo.tecnico, fundamentos, balanço, analistas, resultados, setor e pares, notícias sobre ele). Use o macro só para explicar o que afeta esse ativo. "tecnico" deve trazer o ativo (e o Ibovespa como referência, se houver), "setores" o setor dele, "noticias" as notícias dele, e os cenários devem ser para o preço e os resultados desse ativo, com níveis técnicos do JSON como gatilhos.
10) O bloco "validacao" diz o que o app conferiu antes de enviar. Dado marcado como "divergente", "parado" ou "atrasado" só pode ser usado com essa ressalva escrita; dado "sem_fonte" não existe para você. Nunca complete um número que falta.
Responda SOMENTE JSON:
{"resumo":"3 a 5 frases","confirmados":[{"fato":"","fonte":""}],"interpretacoes":[{"texto":"","base":""}],"tecnico":[{"ativo":"","tendencia":"alta|baixa|lateral","mudanca":"","leitura":""}],"fundamentos":"","setores":[{"setor":"","leitura":""}],"noticias":[{"titulo":"","por_que_importa":""}],"cenarios":{"otimista":{"descricao":"","gatilhos":[""],"invalida":""},"neutro":{"descricao":"","gatilhos":[""],"invalida":""},"pessimista":{"descricao":"","gatilhos":[""],"invalida":""}},"riscos":[""],"acompanhar":[""],"lacunas":[""]}`;

const cTxt = (x: unknown, n: number) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const cArr = (x: unknown) => (Array.isArray(x) ? x : []);
/** Números de um texto, normalizados (14,75 → 14.75; 1.234,5 → 1234.5; −0,8 → 0.8). Ignora anos e números de 1 dígito sem casa. */
export function numerosDe(s: string): string[] {
  const out: string[] = [];
  for (const m of String(s || '').matchAll(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/g)) {
    let t = m[0];
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(',', '.');
    const v = +t; if (!isFinite(v)) continue;
    if (/^\d$/.test(m[0])) continue; // 1 dígito solto ("3 cenários") não é dado
    if (/^(19|20)\d{2}$/.test(m[0])) continue; // ano
    out.push(String(Math.round(v * 100) / 100));
  }
  return out;
}
/** Conjunto de números presentes no contexto, em várias grafias (arredondado a 0, 1 e 2 casas, e o valor absoluto). */
export function numerosDoContexto(ctx: unknown): Set<string> {
  const S = new Set<string>();
  const add = (v: number) => { if (!isFinite(v)) return; for (const d of [0, 1, 2]) { const r = Math.round(Math.abs(v) * 10 ** d) / 10 ** d; S.add(String(r)); } };
  const vis = (x: unknown) => {
    if (typeof x === 'number') add(x);
    else if (typeof x === 'string') numerosDe(x).forEach((n) => add(+n));
    else if (Array.isArray(x)) x.forEach(vis);
    else if (x && typeof x === 'object') Object.values(x).forEach(vis);
  };
  vis(ctx);
  return S;
}
export function normalizaCentral(r: any, ctx: unknown) {
  const nums = numerosDoContexto(ctx);
  const cen = (c: any) => ({ descricao: cTxt(c?.descricao, 900), gatilhos: cArr(c?.gatilhos).map((x) => cTxt(x, 300)).filter(Boolean).slice(0, 5), invalida: cTxt(c?.invalida, 400) });
  const confirmados: { fato: string; fonte: string }[] = [], movidos: { texto: string; base: string }[] = [];
  for (const c of cArr(r?.confirmados).slice(0, 14)) {
    const fato = cTxt(c?.fato, 400); if (!fato) continue;
    const falta = numerosDe(fato).filter((n) => !nums.has(String(Math.abs(+n))));
    if (falta.length) movidos.push({ texto: fato, base: `número não encontrado nos dados do terminal (${falta.join(', ')}): tratado como interpretação` });
    else confirmados.push({ fato, fonte: cTxt(c?.fonte, 80) || 'terminal' });
  }
  const tend = (t: unknown) => { const s = cTxt(t, 12).toLowerCase(); return s.startsWith('alt') ? 'alta' : s.startsWith('bai') ? 'baixa' : 'lateral'; };
  return {
    resumo: cTxt(r?.resumo, 1400),
    confirmados,
    interpretacoes: cArr(r?.interpretacoes).map((x: any) => ({ texto: cTxt(x?.texto, 600), base: cTxt(x?.base, 300) })).filter((x) => x.texto).slice(0, 10).concat(movidos),
    tecnico: cArr(r?.tecnico).map((x: any) => ({ ativo: cTxt(x?.ativo, 20), tendencia: tend(x?.tendencia), mudanca: cTxt(x?.mudanca, 300), leitura: cTxt(x?.leitura, 500) })).filter((x) => x.ativo).slice(0, 16),
    fundamentos: cTxt(r?.fundamentos, 1200),
    setores: cArr(r?.setores).map((x: any) => ({ setor: cTxt(x?.setor, 60), leitura: cTxt(x?.leitura, 400) })).filter((x) => x.setor).slice(0, 8),
    noticias: cArr(r?.noticias).map((x: any) => ({ titulo: cTxt(x?.titulo, 240), por_que_importa: cTxt(x?.por_que_importa, 400) })).filter((x) => x.titulo).slice(0, 8),
    cenarios: { otimista: cen(r?.cenarios?.otimista), neutro: cen(r?.cenarios?.neutro), pessimista: cen(r?.cenarios?.pessimista) },
    riscos: cArr(r?.riscos).map((x) => cTxt(x, 300)).filter(Boolean).slice(0, 6),
    acompanhar: cArr(r?.acompanhar).map((x) => cTxt(x, 300)).filter(Boolean).slice(0, 8),
    lacunas: cArr(r?.lacunas).map((x) => cTxt(x, 200)).filter(Boolean).slice(0, 5).concat(cArr((ctx as any)?.validacao?.problemas).slice(0, 4).map((x) => 'Validação do app: ' + cTxt(x, 180))),
  };
}

// ===== servidor =====
// supabase/functions/analise/carteira.ts — Portfolio Intelligence (v279): indicadores técnicos determinísticos, notícias,
// métricas da carteira, prompts dos relatórios (individual e consolidado), validação dos fatos e decisão incremental.

export const PROMPT_VER_ATIVO = 'carteira-ativo-v2';
export const PROMPT_VER_CONS = 'carteira-consolidado-v2';

export type Familia = 'acao' | 'fii' | 'etf' | 'cripto' | 'rf';
/** família de análise: decide quais indicadores fazem sentido (sem fundamentos de empresa em ETF, cripto ou renda fixa) */
export function familia(cl: string): Familia {
  if (['acao', 'bdr', 'acao_ext'].includes(cl)) return 'acao';
  if (cl === 'fii') return 'fii';
  if (['etf', 'etf_ext'].includes(cl)) return 'etf';
  if (cl === 'cripto') return 'cripto';
  return 'rf';
}
/** símbolo do Yahoo para o histórico diário; renda fixa não tem cotação pública */
export function simboloY(tk: string, mk: string, cl: string): string | null {
  const t = String(tk || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '');
  if (!t || familia(cl) === 'rf') return null;
  if (cl === 'cripto' || mk === 'CR') return t.replace(/-?(USD|USDT|BRL)$/, '') + '-USD';
  return mk === 'BR' ? t + '.SA' : t;
}

// ---------- indicadores ----------
const c_sma = (a: number[], p: number) => { const o: (number | null)[] = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= p) s -= a[i - p]; if (i >= p - 1) o[i] = s / p; } return o; };
function c_rsi(cl: number[], p = 14) { const o: (number | null)[] = new Array(cl.length).fill(null); let g = 0, l = 0; for (let i = 1; i < cl.length; i++) { const d = cl[i] - cl[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= p) { g += up; l += dn; if (i === p) { g /= p; l /= p; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } else { g = (g * (p - 1) + up) / p; l = (l * (p - 1) + dn) / p; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } return o; }
function c_atr(c: Candle[], p = 14) { let a: number | null = null, s = 0; for (let i = 1; i < c.length; i++) { const tr = Math.max(c[i][2] - c[i][3], Math.abs(c[i][2] - c[i - 1][4]), Math.abs(c[i][3] - c[i - 1][4])); if (i <= p) { s += tr; if (i === p) a = s / p; } else a = ((a as number) * (p - 1) + tr) / p; } return a; }
const c_r2 = (x: number | null | undefined, d = 2) => (x == null || !isFinite(x) ? null : +x.toFixed(d));
const c_dp = (a: number[]) => { const n = a.length; if (n < 2) return null; const m = a.reduce((s, x) => s + x, 0) / n; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)); };
const c_lr = (cl: number[]) => cl.slice(1).map((x, i) => Math.log(x / cl[i]));
function c_tendencia(px: number, ma: number | null, maAntes: number | null, ma2: number | null = null): 'alta' | 'baixa' | 'lateral' | 'sem dado' {
  if (ma == null || maAntes == null) return 'sem dado';
  const inc = (ma / maAntes - 1) * 100;
  if (px > ma && inc > 0.15 && (ma2 == null || ma > ma2)) return 'alta';
  if (px < ma && inc < -0.15 && (ma2 == null || ma < ma2)) return 'baixa';
  return 'lateral';
}
/** suportes e resistências: topos e fundos (3 candles de cada lado) dos últimos 120 pregões, agrupados em 1,5% */
function c_niveis(c: Candle[], px: number) {
  const L = c.slice(-120), k = 3, pts: number[] = [];
  for (let i = k; i < L.length - k; i++) {
    let th = true, tl = true;
    for (let j = i - k; j <= i + k; j++) { if (L[j][2] > L[i][2]) th = false; if (L[j][3] < L[i][3]) tl = false; }
    if (th) pts.push(L[i][2]); if (tl) pts.push(L[i][3]);
  }
  const G: { v: number; n: number }[] = [];
  pts.sort((a, b) => a - b).forEach((v) => { const g = G.find((x) => Math.abs(x.v / v - 1) < 0.015); if (g) { g.v = (g.v * g.n + v) / (g.n + 1); g.n++; } else G.push({ v, n: 1 }); });
  const sup = G.filter((g) => g.v < px).sort((a, b) => b.v - a.v).slice(0, 2), res = G.filter((g) => g.v > px).sort((a, b) => a.v - b.v).slice(0, 2);
  const f = (g: { v: number; n: number }) => ({ nivel: c_r2(g.v, g.v < 1 ? 4 : 2), toques: g.n, distancia_pct: c_r2((g.v / px - 1) * 100, 1) });
  return { suportes: sup.map(f), resistencias: res.map(f) };
}
/** resumo técnico determinístico (a IA lê estes números; não calcula nada sozinha) */
export function resumoTecnico(c: Candle[] | null) {
  if (!c || c.length < 30) return null;
  const cl = c.map((x) => x[4]), n = cl.length, px = cl[n - 1], vol = c.map((x) => x[5] || 0);
  const m9 = c_sma(cl, 9), m20 = c_sma(cl, 20), m50 = c_sma(cl, 50), m200 = c_sma(cl, 200), R = c_rsi(cl), u = (a: (number | null)[], b = 0) => a[n - 1 - b] ?? null;
  const varP = (b: number) => (n > b ? c_r2((px / cl[n - 1 - b] - 1) * 100) : null);
  const rets = c_lr(cl), v20 = c_dp(rets.slice(-20)), v1a = c_dp(rets.slice(-252)), a = c_atr(c);
  const L52 = c.slice(-252), h52 = Math.max(...L52.map((x) => x[2])), l52 = Math.min(...L52.map((x) => x[3]));
  const cruz: string[] = [];
  const cz = (x: (number | null)[], y: (number | null)[], up: string, dn: string) => { for (let b = 0; b < 10; b++) { const i = n - 1 - b; if (i < 1 || x[i] == null || y[i] == null || x[i - 1] == null || y[i - 1] == null) continue; if ((x[i - 1] as number) <= (y[i - 1] as number) && (x[i] as number) > (y[i] as number)) { cruz.push(`${up} há ${b} pregão(ões)`); return; } if ((x[i - 1] as number) >= (y[i - 1] as number) && (x[i] as number) < (y[i] as number)) { cruz.push(`${dn} há ${b} pregão(ões)`); return; } } };
  cz(m9, m20, 'MM9 cruzou para cima da MM20', 'MM9 cruzou para baixo da MM20');
  cz(m50, m200, 'MM50 cruzou para cima da MM200 (cruz dourada)', 'MM50 cruzou para baixo da MM200 (cruz da morte)');
  cz(cl as any, m200, 'preço rompeu a MM200 para cima', 'preço perdeu a MM200');
  const vm = vol.slice(-20).reduce((s, x) => s + x, 0) / 20, temVol = vm > 0;
  return {
    pregoes: n, de: c[0][0], ate: c[n - 1][0], preco: c_r2(px, px < 1 ? 6 : 2),
    variacao_pct: { dia: varP(1), semana: varP(5), mes: varP(21), trimestre: varP(63), ano: varP(252) },
    medias: { mm9: c_r2(u(m9)), mm20: c_r2(u(m20)), mm50: c_r2(u(m50)), mm200: c_r2(u(m200)) },
    preco_vs_medias: Object.fromEntries((['mm9', 'mm20', 'mm50', 'mm200'] as const).map((k) => { const m = { mm9: u(m9), mm20: u(m20), mm50: u(m50), mm200: u(m200) }[k]; return [k, m == null ? 'sem dado' : px > m ? 'acima' : 'abaixo']; })),
    tendencia: { curto: c_tendencia(px, u(m20), u(m20, 5), null), medio: c_tendencia(px, u(m50), u(m50, 10), null), longo: c_tendencia(px, u(m200), u(m200, 20), null) },
    rsi14: c_r2(u(R), 1), momento_20d_pct: varP(20),
    volume: temVol ? { ultimo: Math.round(vol[n - 1]), media_20: Math.round(vm), relativo: c_r2(vol[n - 1] / vm, 2) } : null,
    volatilidade_anual_pct: { ultimos_20: v20 == null ? null : c_r2(v20 * Math.sqrt(252) * 100, 1), ultimo_ano: v1a == null ? null : c_r2(v1a * Math.sqrt(252) * 100, 1) },
    atr_pct: a ? c_r2(a / px * 100, 2) : null,
    ...c_niveis(c, px),
    maxima_52s: c_r2(h52), minima_52s: c_r2(l52), distancia_da_maxima_pct: c_r2((px / h52 - 1) * 100, 1),
    cruzamentos_recentes: cruz,
  };
}
export type ResTec = NonNullable<ReturnType<typeof resumoTecnico>>;

// ---------- notícias (Google Notícias, últimos 7 dias) ----------
const c_tira = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
export function leRSSNoticias(xml: string, max = 6) {
  const it = [...String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30).map((m) => {
    const g = (t: string) => { const x = new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`).exec(m[1]); return x ? c_tira(x[1]) : ''; };
    const titulo = g('title'), fonte = g('source') || (titulo.match(/ - ([^-]+)$/) || [])[1] || '';
    return { titulo: titulo.replace(/ - [^-]+$/, ''), fonte, data: g('pubDate') ? new Date(g('pubDate')).toISOString().slice(0, 10) : null, link: g('link') };
  }).filter((x) => x.titulo);
  const vistos = new Set<string>();
  return it.filter((x) => { const k = x.titulo.toLowerCase().slice(0, 60); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, max);
}
export const urlNoticias = (q: string) => `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:7d')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

// ---------- métricas da carteira (determinísticas) ----------
export type ItemCart = { tk: string; mk: string; cl: string; q: number; pm: number; nome?: string; setor?: string; regiao?: string; moeda?: string; prov?: number };
const C_EXPO: [RegExp, string[]][] = [
  [/energy minerals|petr|óleo|oil|gas/i, ['petróleo']], [/non-energy minerals|minera|metal|steel|siderur/i, ['minério e metais']],
  [/process industries|agro|papel|celulose|alimentos/i, ['commodities agrícolas e papel']], [/finance|financ|banc|segur/i, ['juros (bancos e seguradoras)']],
  [/utilities|energia elétrica|saneamento/i, ['juros (utilidades: dívida e regulação)']], [/retail|varejo|consumer|consumo/i, ['juros e renda (consumo)']],
  [/imobili|fii|real estate/i, ['juros (imobiliário)']],
];
export function exposicoes(setor: string, cl: string, moeda: string) {
  const s = new Set<string>();
  C_EXPO.forEach(([re, t]) => { if (re.test(setor || '')) t.forEach((x) => s.add(x)); });
  if (cl === 'fii') s.add('juros (imobiliário)');
  if (['rf', 'tesouro'].includes(cl)) s.add('juros (renda fixa)');
  if (moeda === 'USD') s.add('dólar');
  if (cl === 'cripto') s.add('cripto (dólar e risco)');
  return [...s];
}
function c_correl(a: number[], b: number[]) { const n = Math.min(a.length, b.length); if (n < 30) return null; const A = a.slice(-n), B = b.slice(-n), ma = A.reduce((s, x) => s + x, 0) / n, mb = B.reduce((s, x) => s + x, 0) / n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (A[i] - ma) * (B[i] - mb); va += (A[i] - ma) ** 2; vb += (B[i] - mb) ** 2; } return va && vb ? c / Math.sqrt(va * vb) : null; }
/** retornos diários alinhados por data */
function c_retornosPorData(cs: Candle[]) { const m = new Map<string, number>(); for (let i = 1; i < cs.length; i++) m.set(cs[i][0], cs[i][4] / cs[i - 1][4] - 1); return m; }
export function metricasCarteira(itens: ItemCart[], px: Record<string, number | null>, fx: number | null, velas: Record<string, Candle[] | null>, ibov: Candle[] | null) {
  const pos = itens.map((it) => {
    const p = px[it.tk], usd = it.moeda === 'USD', conv = usd ? fx : 1;
    const preco = p ?? it.pm, temPreco = p != null;
    const valor = conv ? it.q * preco * conv : null, custo = conv ? it.q * it.pm * conv : null;
    return { ...it, preco: c_r2(preco, preco < 1 ? 6 : 2), tem_preco: temPreco, valor_brl: c_r2(valor), custo_brl: c_r2(custo), resultado_brl: valor != null && custo != null ? c_r2(valor - custo) : null, resultado_pct: it.pm > 0 && temPreco ? c_r2((preco / it.pm - 1) * 100) : null };
  });
  const tot = pos.reduce((s, x) => s + (x.valor_brl || 0), 0), cus = pos.reduce((s, x) => s + (x.custo_brl || 0), 0);
  pos.forEach((x: any) => { x.peso_pct = tot > 0 && x.valor_brl != null ? c_r2(x.valor_brl / tot * 100, 1) : null; });
  const agrupa = (f: (x: any) => string) => { const o: Record<string, number> = {}; pos.forEach((x: any) => { const k = f(x) || 'sem dado'; o[k] = (o[k] || 0) + (x.valor_brl || 0); }); return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ nome: k, valor_brl: c_r2(v), pct: tot > 0 ? c_r2(v / tot * 100, 1) : null })); };
  const pesos = pos.map((x: any) => (x.peso_pct || 0) / 100), hhi = pesos.reduce((s, w) => s + w * w, 0);
  const ord = [...pos].sort((a: any, b: any) => (b.peso_pct || 0) - (a.peso_pct || 0));
  // correlação média entre os ativos (retornos diários do último ano) e beta da carteira contra o Ibovespa
  const R: Record<string, Map<string, number>> = {}; Object.entries(velas).forEach(([k, v]) => { if (v && v.length > 60) R[k] = c_retornosPorData(v.slice(-260)); });
  const ks = Object.keys(R), pares: { a: string; b: string; c: number }[] = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const d = [...R[ks[i]].keys()].filter((x) => R[ks[j]].has(x)); const c = c_correl(d.map((x) => R[ks[i]].get(x)!), d.map((x) => R[ks[j]].get(x)!)); if (c != null) pares.push({ a: ks[i], b: ks[j], c: c_r2(c, 2)! }); }
  let beta: number | null = null, volCart: number | null = null;
  if (ibov && ibov.length > 60 && ks.length) {
    const RI = c_retornosPorData(ibov.slice(-260)), datas = [...RI.keys()].filter((d) => ks.some((k) => R[k].has(d)));
    const rc = datas.map((d) => { let s = 0, w = 0; pos.forEach((x: any) => { const m = R[x.tk]; if (m && m.has(d)) { s += (x.peso_pct || 0) * m.get(d)!; w += x.peso_pct || 0; } }); return w ? s / w : 0; });
    const ri = datas.map((d) => RI.get(d)!); const n = rc.length;
    if (n > 30) { const mc = rc.reduce((s, x) => s + x, 0) / n, mi = ri.reduce((s, x) => s + x, 0) / n; let cv = 0, vi = 0; for (let i = 0; i < n; i++) { cv += (rc[i] - mc) * (ri[i] - mi); vi += (ri[i] - mi) ** 2; } beta = vi ? c_r2(cv / vi, 2) : null; const s = c_dp(rc); volCart = s == null ? null : c_r2(s * Math.sqrt(252) * 100, 1); }
  }
  const expo: Record<string, number> = {}; pos.forEach((x: any) => exposicoes(x.setor || '', x.cl, x.moeda || 'BRL').forEach((e) => { expo[e] = (expo[e] || 0) + (x.peso_pct || 0); }));
  return {
    patrimonio_brl: c_r2(tot), custo_brl: c_r2(cus), resultado_brl: c_r2(tot - cus), resultado_pct: cus > 0 ? c_r2((tot / cus - 1) * 100) : null, dolar: fx,
    posicoes: pos, por_classe: agrupa((x) => x.cl), por_setor: agrupa((x) => x.setor || ''), por_regiao: agrupa((x) => x.regiao || ''), por_moeda: agrupa((x) => x.moeda || 'BRL'),
    concentracao: { maior_posicao: ord[0] ? { tk: ord[0].tk, pct: (ord[0] as any).peso_pct } : null, top3_pct: c_r2(ord.slice(0, 3).reduce((s: number, x: any) => s + (x.peso_pct || 0), 0), 1), hhi: c_r2(hhi, 3), ativos_efetivos: hhi > 0 ? c_r2(1 / hhi, 1) : null, maior_setor: agrupa((x) => x.setor || '')[0] || null },
    correlacao: pares.length ? { media: c_r2(pares.reduce((s, p) => s + p.c, 0) / pares.length, 2), mais_altas: [...pares].sort((a, b) => b.c - a.c).slice(0, 3), mais_baixas: [...pares].sort((a, b) => a.c - b.c).slice(0, 2), periodo: 'retornos diários de até 1 ano' } : null,
    beta_ibov: beta, volatilidade_anual_pct: volCart, exposicao_pct: Object.fromEntries(Object.entries(expo).map(([k, v]) => [k, c_r2(v, 1)])),
    sem_preco: pos.filter((x) => !x.tem_preco).map((x) => x.tk),
  };
}

// ---------- decisão incremental: só refaz o relatório do ativo quando algo relevante mudou ----------
export type Marca = { px: number | null; tend: string[]; rsi: number | null; fund: string; news: string[]; res: string | null; gerado: string; balanco?: string | null };
export function marcaDe(tec: ResTec | null, fund: any, news: { titulo: string }[], prox: string | null, gerado: string): Marca {
  const f = fund ? ['pl', 'p_vp', 'ev_ebitda', 'roe', 'margem_liquida', 'dividend_yield', 'div_liq_ebitda'].map((k) => (typeof fund[k] === 'number' ? fund[k].toFixed(2) : '-')).join('|') : '';
  return { px: tec ? tec.preco : null, tend: tec ? [tec.tendencia.curto, tec.tendencia.medio, tec.tendencia.longo] : [], rsi: tec ? tec.rsi14 : null, fund: f, news: news.map((n) => n.titulo.toLowerCase().slice(0, 50)), res: prox, gerado };
}
export function precisaAtualizar(ant: Marca | null, nova: Marca, hojeISO: string) {
  if (!ant) return { sim: true, motivos: ['primeiro relatório do ativo'] };
  const m: string[] = [], dias = (Date.parse(hojeISO) - Date.parse(ant.gerado)) / 864e5;
  if (dias >= 7) m.push(`último relatório tem ${Math.floor(dias)} dias`);
  if (ant.px && nova.px && Math.abs(nova.px / ant.px - 1) >= 0.03) m.push(`preço mudou ${((nova.px / ant.px - 1) * 100).toFixed(1).replace('.', ',')}% desde o último relatório`);
  ['curto', 'médio', 'longo'].forEach((k, i) => { if (ant.tend[i] && nova.tend[i] && ant.tend[i] !== nova.tend[i]) m.push(`tendência de ${k} prazo mudou de ${ant.tend[i]} para ${nova.tend[i]}`); });
  const zona = (r: number | null) => (r == null ? '' : r >= 70 ? 'sobrecompra' : r <= 30 ? 'sobrevenda' : 'neutra');
  if (zona(ant.rsi) !== zona(nova.rsi) && zona(nova.rsi) !== 'neutra') m.push(`RSI entrou em ${zona(nova.rsi)}`);
  if (ant.fund && nova.fund && ant.fund !== nova.fund) m.push('indicadores fundamentalistas mudaram');
  if (nova.balanco && nova.balanco !== ant.balanco) m.push('nova informação contábil trimestral na fonte; relatório anterior precisa ser revalidado');
  const novas = nova.news.filter((t) => !ant.news.includes(t)).length; if (novas >= 2) m.push(`${novas} notícias novas`);
  if (ant.res && ant.res <= hojeISO && Date.parse(ant.res) > Date.parse(ant.gerado)) m.push('saiu resultado trimestral desde o último relatório');
  return { sim: m.length > 0, motivos: m };
}

// ---------- prompts ----------
const C_SEC = '{"fatos":["..."],"interpretacoes":["..."],"hipoteses":["..."]}';
const C_REGRAS = `Regras obrigatórias:
1) FATOS: só afirmações que um número ou texto dos DADOS sustenta, citando o número como veio (arredondar é permitido). Nada de número que não esteja nos DADOS.
2) INTERPRETAÇÕES: sua leitura dos fatos, em linguagem de analista, sem certezas.
3) HIPÓTESES: condicionais testáveis no formato "se X, então Y; confirma se ...; invalida se ...".
4) Dado ausente = escreva "sem dado". Nunca estime nem preencha com conhecimento próprio. ROIC, fluxo de caixa ou qualquer indicador que não veio = "sem dado".
5) Indicador que não se aplica à classe do ativo = diga "não se aplica a <classe>" (ex.: P/L em ETF, cripto ou renda fixa).
6) Sem recomendação de compra ou venda e sem preço-alvo próprio. Tom profissional, frases curtas, português do Brasil.
7) Cada lista com no máximo 5 itens; seção sem conteúdo útil = listas vazias.
8) Responda SOMENTE com o JSON pedido.
9) Não chame diferença entre valor e custo de rentabilidade histórica ou TWR. Só cite retorno ajustado a fluxos quando metricas_do_app o trouxer e preserve seu método e período. Não confunda valorização, aporte, provento recebido e dividend yield de mercado.
10) Sem dados suficientes, identifique a lacuna e seu efeito na conclusão. Não crie gatilhos arbitrários como patrimônio redondo para garantir uma rentabilidade futura. Não diga que múltiplo alto é justificado apenas por ROE alto.
11) Em cada seção escolha fatos distintos e evite repetir o patrimônio em todas. Referências, moedas e cobertura vêm dos DADOS. Não se apresente como profissional humano certificado.
12) Destaque o último trimestre que a fonte disponibilizou apenas quando há data e valores. Não diga que é o último balanço oficial sem documento da empresa/CVM. Quando a fonte não informar o trimestre, destaque a lacuna. Histórico anual até 2025 não significa que os resultados de 2026 foram incluídos.
13) Cite a moeda contábil correta antes de mencionar receitas e lucros; não converta USD para BRL sem taxa, período e método explícitos. Não invente volatilidade e beta de carteira quando indisponíveis.
14) Se houver dados trimestrais de fonte secundária com data, priorize esses dados sobre afirmações de relatórios anteriores. Não diga que a CVM confirmou um valor se não recebeu a demonstração oficial. Se a fonte não revelar o trimestre recente, destaque a lacuna. O histórico anual de 2025 não é o último trimestre de 2026.`;
export const SYS_ATIVO = `Você é um assistente de pesquisa patrimonial que redige análises estruturadas para revisão humana. Escreve o relatório individual de um ativo da carteira do cliente, a partir de dados já calculados pelo sistema.
${C_REGRAS}
Formato:
{"identificacao":{"ticker":"","nome":"","classe":"","mercado":"","moeda":""},
"resumo_executivo":${C_SEC},"desempenho":${C_SEC},"tecnica":{"fatos":[],"interpretacoes":[],"hipoteses":[],"tendencias":{"curto":"alta|baixa|lateral|sem dado","medio":"","longo":""}},
"fundamentos":${C_SEC},"noticias_eventos":${C_SEC},"riscos":${C_SEC},
"comparacao_historica":{"fatos":[],"interpretacoes":[],"hipoteses":[],"melhorou":[],"piorou":[],"mudancas_de_tendencia":[],"novos_riscos":[],"hipoteses_anteriores":[{"hipotese":"","situacao":"confirmada|contrariada|em aberto","evidencia":""}]},
"monitorar":["pontos objetivos a acompanhar, com níveis ou datas dos DADOS"],"reavaliar":{"sim":false,"motivo":""}}
Em "fundamentos", para ações, organize até cinco itens analíticos, com evidência e lacuna quando houver: qualidade do negócio e rentabilidade (ROE, margens e ROIC); evolução de receita/lucro e geração de caixa; balanço e endividamento (bancos/seguradoras com indicadores próprios, sem EBITDA); valuation relativo e premissas das referências de valuation fornecidas; dividendos e sustentabilidade do payout. Nos itens de interpretação conecte o indicador ao risco e à tese, sem concluir barato/caro por um único múltiplo. Se fluxo de caixa, ROIC, demonstrações ou comparação setorial não constarem dos DADOS, diga sem dado; não complete de memória. Use o histórico anual quando fornecido e não derive tendência de um único trimestre. Em "monitorar", priorize fatos verificáveis que fariam rever a tese fundamentalista, com datas e números somente quando fornecidos.
Em "fundamentos", para ETF, cripto ou renda fixa, use a análise específica da classe (ETF: o que replica e desempenho; FII: dividend yield e P/VP quando houver; cripto: só preço, volatilidade e volume; renda fixa: só posição e custo).
Em "comparacao_historica", compare com RELATORIO_ANTERIOR (se veio). Sem relatório anterior: fatos = ["primeiro relatório do ativo"] e o resto vazio.`;
export const SYS_CONS = `Você é o analista responsável pelo relatório consolidado da carteira de um cliente pessoa física, a partir de métricas já calculadas pelo sistema e dos relatórios individuais mais recentes.
${C_REGRAS}
Formato:
{"resumo_executivo":${C_SEC},"desempenho":${C_SEC},"distribuicao":${C_SEC},"setores":${C_SEC},"tecnica_consolidada":${C_SEC},"fundamentos_consolidados":${C_SEC},
"exposicao_macro":${C_SEC},"riscos":${C_SEC},"destaques":{"positivos":[],"negativos":[]},
"mudancas":{"fatos":[],"interpretacoes":[],"hipoteses":[],"melhorou":[],"piorou":[],"novos_riscos":[],"hipoteses_anteriores":[{"hipotese":"","situacao":"confirmada|contrariada|em aberto","evidencia":""}],"reavaliar":[{"tk":"","motivo":""}]},
"conclusao":${C_SEC},"pontos_positivos":["até 3, curtos, para o painel"],"pontos_de_atencao":["até 3, curtos, para o painel"]}
Em fundamentos_consolidados sintetize a qualidade dos negócios, crescimento e caixa, endividamento, valuation e renda usando as fichas individuais, indicando explicitamente quais ativos não foram analisados ou têm dados incompletos. Não trate ausência de relatório individual como boa qualidade. Compare o peso das exposições com os riscos dos negócios; não calcule média ingênua de P/L, DY ou ROE e não extrapole o yield para proventos da carteira. Preserve datas diferentes das análises individuais. Proventos recebidos só podem vir de registros; retornos históricos só de metricas_do_app, e o patrimônio isolado não prova desempenho.
Exposição macro: use "exposicao_pct" (classificação por setor feita pelo sistema) e o macro informado; diga que é uma regra por setor.
"mudancas": compare com RELATORIO_ANTERIOR (se veio); sem anterior, fatos = ["primeiro relatório consolidado"].`;

// ---------- normalização ----------
const c_txt = (x: unknown, n = 420) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const c_lista = (x: unknown, n = 5) => (Array.isArray(x) ? x : x ? [x] : []).map((v) => (typeof v === 'object' && v ? c_txt(Object.values(v).join(' — ')) : c_txt(v))).filter(Boolean).slice(0, n);
const c_sec = (o: any) => ({ fatos: c_lista(o?.fatos), interpretacoes: c_lista(o?.interpretacoes), hipoteses: c_lista(o?.hipoteses) });
const c_hipAnt = (x: unknown) => (Array.isArray(x) ? x : []).slice(0, 6).map((h: any) => ({ hipotese: c_txt(h?.hipotese, 300), situacao: ['confirmada', 'contrariada', 'em aberto'].includes(String(h?.situacao)) ? String(h.situacao) : 'em aberto', evidencia: c_txt(h?.evidencia, 300) })).filter((h) => h.hipotese);
const c_TEND = (x: unknown) => (['alta', 'baixa', 'lateral'].includes(String(x)) ? String(x) : 'sem dado');
export function normalizaAtivo(j: any) {
  const ch = j?.comparacao_historica || {};
  return {
    identificacao: { ticker: c_txt(j?.identificacao?.ticker, 20), nome: c_txt(j?.identificacao?.nome, 80), classe: c_txt(j?.identificacao?.classe, 40), mercado: c_txt(j?.identificacao?.mercado, 30), moeda: c_txt(j?.identificacao?.moeda, 6) },
    resumo_executivo: c_sec(j?.resumo_executivo), desempenho: c_sec(j?.desempenho),
    tecnica: { ...c_sec(j?.tecnica), tendencias: { curto: c_TEND(j?.tecnica?.tendencias?.curto), medio: c_TEND(j?.tecnica?.tendencias?.medio), longo: c_TEND(j?.tecnica?.tendencias?.longo) } },
    fundamentos: c_sec(j?.fundamentos), noticias_eventos: c_sec(j?.noticias_eventos), riscos: c_sec(j?.riscos),
    comparacao_historica: { ...c_sec(ch), melhorou: c_lista(ch.melhorou), piorou: c_lista(ch.piorou), mudancas_de_tendencia: c_lista(ch.mudancas_de_tendencia), novos_riscos: c_lista(ch.novos_riscos), hipoteses_anteriores: c_hipAnt(ch.hipoteses_anteriores) },
    monitorar: c_lista(j?.monitorar, 6), reavaliar: { sim: j?.reavaliar?.sim === true, motivo: c_txt(j?.reavaliar?.motivo, 300) },
  };
}
export function normalizaCons(j: any) {
  const mu = j?.mudancas || {};
  const o: any = { destaques: { positivos: c_lista(j?.destaques?.positivos), negativos: c_lista(j?.destaques?.negativos) }, pontos_positivos: c_lista(j?.pontos_positivos, 3), pontos_de_atencao: c_lista(j?.pontos_de_atencao, 3) };
  ['resumo_executivo', 'desempenho', 'distribuicao', 'setores', 'tecnica_consolidada', 'fundamentos_consolidados', 'exposicao_macro', 'riscos', 'conclusao'].forEach((k) => { o[k] = c_sec(j?.[k]); });
  o.mudancas = { ...c_sec(mu), melhorou: c_lista(mu.melhorou), piorou: c_lista(mu.piorou), novos_riscos: c_lista(mu.novos_riscos), hipoteses_anteriores: c_hipAnt(mu.hipoteses_anteriores), reavaliar: (Array.isArray(mu.reavaliar) ? mu.reavaliar : []).slice(0, 8).map((r: any) => ({ tk: c_txt(r?.tk, 16).toUpperCase(), motivo: c_txt(r?.motivo, 240) })).filter((r: any) => r.tk) };
  return o;
}

// ---------- validação: todo número citado como FATO precisa existir nos dados ----------
/** números de um texto em pt-BR ("1.234,56", "12,5%", "-3,2") ou en ("0.85") */
export function numerosFato(s: string): number[] {
  const out: number[] = [];
  for (const m of String(s || '').matchAll(/-?\d{1,3}(?:\.\d{3})+(?:,\d+)?(?!\d)|-?\d+\.\d+|-?\d+(?:,\d+)?/g)) {
    let t = m[0];
    if (/\.\d{3}/.test(t) && (t.includes(',') || /^-?\d{1,3}(\.\d{3})+$/.test(t))) t = t.replace(/\./g, '');
    out.push(parseFloat(t.replace(',', '.')));
  }
  return out.filter((x) => isFinite(x));
}
function c_numerosDados(d: unknown, acc: number[] = []): number[] {
  if (typeof d === 'number' && isFinite(d)) acc.push(d);
  else if (typeof d === 'string') numerosFato(d).forEach((x) => acc.push(x));
  else if (Array.isArray(d)) d.forEach((x) => c_numerosDados(x, acc));
  else if (d && typeof d === 'object') Object.values(d).forEach((x) => c_numerosDados(x, acc));
  return acc;
}
const c_confere = (x: number, base: number[]) => {
  const ax = Math.abs(x);
  if (Number.isInteger(x) && ((ax >= 1990 && ax <= 2100) || ax <= 12)) return true; // anos, meses, contagens pequenas
  return base.some((b) => { const ab = Math.abs(b); return Math.abs(ax - ab) <= Math.max(0.051, ab * 0.006) || Math.abs(ax - ab * 100) <= Math.max(0.051, ab * 0.6) || Math.abs(ax * 1000 - ab) <= ab * 0.006 || Math.abs(ax * 1e6 - ab) <= ab * 0.006 || Math.abs(ax * 1e9 - ab) <= ab * 0.006; });
};
export function validaRelatorio(rel: any, dados: unknown, lacunas: string[]) {
  const base = c_numerosDados(dados), problemas: string[] = [];
  const varre = (o: any, cam: string) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o.fatos)) o.fatos.forEach((f: string) => { const ruins = numerosFato(f).filter((x) => !c_confere(x, base)); if (ruins.length) problemas.push(`${cam}: número sem origem nos dados (${ruins.slice(0, 3).map((x) => String(x).replace('.', ',')).join('; ')}) em "${f.slice(0, 120)}"`); });
    Object.entries(o).forEach(([k, v]) => { if (v && typeof v === 'object' && !Array.isArray(v)) varre(v, cam ? cam + '.' + k : k); });
  };
  varre(rel, '');
  const estado = problemas.length ? 'revisar' : lacunas.length ? 'com_limitacoes' : 'validado';
  return { estado, problemas: problemas.slice(0, 10), lacunas: lacunas.slice(0, 10), conferidos: base.length };
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
export const VERSAO_FN = 'v300';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN, dono_configurado: !!(DONO || DONO_EMAIL_SHA256) }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/analise/index.ts
// Análise IA do diário: técnica, fundamentalista e foto de gráfico. IA: somente Gemini.
// Dados: brapi (B3), Twelve Data (EUA), Yahoo Finance (fundamentos).
//
// Secrets: GEMINI_API_KEY, BRAPI_TOKEN, TWELVE_API_KEY
//   supabase secrets set GEMINI_API_KEY=... BRAPI_TOKEN=... TWELVE_API_KEY=...
// Deploy: supabase functions deploy analise
//
// Indicadores (RSI, médias, ATR, volume, pivôs, níveis e plano) são calculados em ./indicadores.ts e testados
// (veja indicadores.test.ts). O Gemini só recebe os números prontos e escreve a interpretação.


/** Compatibilidade com GEMINI_MODEL antigo no Supabase: não voltar a chamar 2.5 se a chave perdeu acesso. */
const modeloAtual = (nome: string, rapido = false) => {
  const id = String(nome || '').trim().replace(/^models\//, '');
  if (/^gemini-(?:1\.|2\.[0-5](?:-|$))/.test(id)) return rapido ? 'gemini-3.5-flash-lite' : 'gemini-3.6-flash';
  return id || (rapido ? 'gemini-3.5-flash-lite' : 'gemini-3.6-flash');
};
const MODELO = modeloAtual(Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash');
const MODELO_TEC = modeloAtual(Deno.env.get('GEMINI_MODEL_TEC') || MODELO, true);
const MODELO_FUN = modeloAtual(Deno.env.get('GEMINI_MODEL_FUN') || MODELO);
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const BRAPI = Deno.env.get('BRAPI_TOKEN') || '';
const TWELVE = Deno.env.get('TWELVE_API_KEY') || '';
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';

// Origens permitidas (secret ALLOWED_ORIGINS, separadas por vírgula, ex.: https://seu-usuario.github.io). Vazio = qualquer origem.
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*';
  else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
const mkOut = (cors: Record<string, string>) => (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// ---------- util ----------
const num = (x: any) => (x == null || x === '' || !isFinite(+x) ? null : +x);
const raw = (o: any) => (o && typeof o === 'object' && 'raw' in o ? num(o.raw) : num(o));
// r2 vem de indicadores
const isB3 = (s: string) => /^[A-Z]{4}\d{1,2}$/.test(s);
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const iso = (sec: number) => new Date(sec * 1000).toISOString().slice(0, 10);


// ---------- cotações ----------
async function candlesBR(tk: string) {
  let j: any = null, st = 0;
  for (const rg of ['1y', '6mo', '3mo']) {
    const r = await fetch(`https://brapi.dev/api/quote/${tk}?range=${rg}&interval=1d`, {
      headers: { Authorization: 'Bearer ' + BRAPI }, signal: AbortSignal.timeout(12_000),
    });
    st = r.status;
    if (r.ok) { j = await r.json(); break; }
    if (r.status !== 400 && r.status !== 403) throw new Error('brapi ' + r.status);
  }
  if (!j) throw new Error('brapi ' + st);
  const q = j.results && j.results[0];
  if (!q || !Array.isArray(q.historicalDataPrice) || !q.historicalDataPrice.length) throw new Error('brapi sem histórico');
  const cs: Candle[] = q.historicalDataPrice
    .filter((c: any) => num(c.close) != null && num(c.high) != null)
    .map((c: any) => [iso(c.date), +c.open, +c.high, +c.low, +c.close, +(c.volume || 0)]);
  return { cs, preco: num(q.regularMarketPrice) ?? cs[cs.length - 1][4], moeda: 'BRL', nome: q.longName || q.shortName || '' };
}

async function candlesUS(tk: string) {
  const r = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tk)}&interval=1day&outputsize=260&apikey=${TWELVE}`, { signal: AbortSignal.timeout(12_000) },
  );
  const j = await r.json();
  if (!r.ok || j.status === 'error' || !Array.isArray(j.values)) throw new Error('Twelve Data: ' + (j.message || r.status));
  const cs: Candle[] = j.values
    .slice()
    .reverse()
    .map((v: any) => [String(v.datetime).slice(0, 10), +v.open, +v.high, +v.low, +v.close, +(v.volume || 0)]);
  return { cs, preco: cs[cs.length - 1][4], moeda: (j.meta && j.meta.currency) || 'USD', nome: '' };
}

// ---------- Yahoo (gráfico semanal e mensal, histórico longo) ----------
async function candlesYahoo(tk: string, mk: string, intervalo: '1d' | '1wk' | '1mo', range: string): Promise<Candle[] | null> {
  try {
    const sym = mk === 'BR' ? tk + '.SA' : tk;
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${intervalo}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const R = (await r.json())?.chart?.result?.[0], ts: number[] = R?.timestamp || [], q = R?.indicators?.quote?.[0] || {};
    const out: Candle[] = [];
    ts.forEach((t, i) => {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
      if ([o, h, l, c].every((v) => typeof v === 'number' && isFinite(v))) out.push([iso(t), o, h, l, c, +(q.volume?.[i] || 0)]);
    });
    return out.length ? out : null;
  } catch { return null; }
}

// ---------- macro (Banco Central): Selic e IPCA 12 meses, para custo de oportunidade ----------
let cMacro: { ts: number; m: Macro } | null = null;
// A API do Banco Central às vezes demora ou recusa pedidos de servidores na nuvem: tenta 3 caminhos por série,
// e se mesmo assim falhar usa o último valor bom guardado no banco (até 45 dias), avisando a data.
async function bcbUltimo(n: number): Promise<{ v: number | null; d: string }> {
  const urls = [
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados/ultimos/1?formato=json`,
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados/ultimos/3?formato=json`,
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${n}/dados?formato=json&dataInicial=${(() => { const d = new Date(Date.now() - 70 * 864e5); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; })()}`,
  ];
  for (let k = 0; k < urls.length; k++) {
    try {
      const r = await fetch(urls[k], { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(k ? 9_000 : 6_000) });
      if (r.ok) {
        const j = await r.json();
        const ult = Array.isArray(j) ? j[j.length - 1] : null;
        const v = num(typeof ult?.valor === 'string' ? ult.valor.replace(',', '.') : ult?.valor);
        if (v != null) return { v, d: String(ult?.data || '') };
      }
    } catch { /* tenta o próximo caminho */ }
    await new Promise((ok) => setTimeout(ok, 400));
  }
  return { v: null, d: '' };
}
async function macro(): Promise<Macro | null> {
  if (cMacro && Date.now() - cMacro.ts < 3600_000) return cMacro.m;
  const [s, i] = await Promise.all([bcbUltimo(432), bcbUltimo(13522)]);
  let guardado: any = null;
  if (s.v == null || i.v == null) { try { const c = await cacheGet('macro:ultimo'); if (c && c.dados && idadeDias(c.dia) <= 45) guardado = c; } catch { /* sem cache */ } }
  const selic = s.v ?? guardado?.dados?.selic_pct ?? null, ipca = i.v ?? guardado?.dados?.ipca12_pct ?? null;
  if (selic == null && ipca == null) return null;
  const m: Macro = { selic_pct: selic, ipca12_pct: ipca, juro_real_pct: juroReal(selic, ipca), data: s.d || guardado?.dados?.data || null };
  if (s.v != null && i.v != null) { cMacro = { ts: Date.now(), m }; try { await cachePut('macro:ultimo', m); } catch { /* sem cache */ } }
  else if (guardado) (m as any).obs = `Banco Central fora do ar agora: usando os valores guardados em ${fmtDia(guardado.dia)}.`;
  return m;
}

// ---------- Yahoo (fundamentos) ----------
let YH: { cookie: string; crumb: string } | null = null;
async function yhAuth() {
  if (YH) return YH;
  const r = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  await r.text().catch(() => '');
  const c = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, Cookie: cookie }, signal: AbortSignal.timeout(8_000) });
  const crumb = await c.text();
  if (!c.ok || !crumb || crumb.includes('<')) throw new Error('Yahoo: sem crumb');
  return (YH = { cookie, crumb });
}
/** Histórico no estilo Investidor10: DY e proventos por ano, rentabilidade, comparação com índices, receita/lucro e checklist. */
async function bcbMensal(serie: number, meses: number): Promise<{ mes: string; pct: number }[]> {
  try {
    const d = new Date(Date.now() - (meses + 2) * 31 * 86400e3), ini = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
    const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${ini}&dataFinal=${(() => { const h = new Date(); return `${String(h.getUTCDate()).padStart(2, '0')}/${String(h.getUTCMonth() + 1).padStart(2, '0')}/${h.getUTCFullYear()}`; })()}`, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
    if (!r.ok) return [];
    return ((await r.json()) as any[]).map((x) => ({ mes: `${String(x.data).slice(6, 10)}-${String(x.data).slice(3, 5)}`, pct: +String(x.valor).replace(',', '.') })).filter((x) => isFinite(x.pct));
  } catch { return []; }
}
async function chartMensal(sym: string, range: string, divs = false): Promise<any> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1mo${divs ? '&events=div' : ''}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9_000) });
    return r.ok ? (await r.json())?.chart?.result?.[0] || null : null;
  } catch { return null; }
}
async function historico(tk: string, mk: string, f: any): Promise<any> {
  const sym = mk === 'BR' ? tk + '.SA' : tk;
  const out: any = { dy_anos: [], receita_lucro: [], trimestres: [], ultimo_trimestre: null, moeda_contabil: f?.moeda_contabil || null, versao_dados_financeiros: 2, cotacao: [], anos_listada: null, proventos: [], rentabilidade: null, indices: null, empresa: null };
  const [R, ts, ibov, cdi, ipca, usd] = await Promise.all([
    chartMensal(sym, '11y', true),
    (async () => {
      try {
        const a = await yhAuth();
        const p2 = Math.floor(Date.now() / 1000), p1 = p2 - 12 * 365 * 86400;
        const r = await fetch(`https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(sym)}?symbol=${encodeURIComponent(sym)}&type=${[...new Set(['annualTotalRevenue', 'annualNetIncome', 'quarterlyTotalRevenue', 'quarterlyNetIncome', ...IUD_TIPOS])].join(',')}&period1=${p1}&period2=${p2}&crumb=${encodeURIComponent(a.crumb)}`, { headers: { 'User-Agent': UA, Cookie: a.cookie }, signal: AbortSignal.timeout(9_000) });
        return r.ok ? await r.json() : null;
      } catch { return null; }
    })(),
    mk === 'BR' ? chartMensal('^BVSP', '6y') : chartMensal('^GSPC', '6y'),
    mk === 'BR' ? bcbMensal(4391, 62) : Promise.resolve([]),
    mk === 'BR' ? bcbMensal(433, 62) : Promise.resolve([]),
    mk === 'BR' ? cambio('USD', 'BRL') : Promise.resolve(1),
  ]);
  let adj: { t: number; c: number }[] = [];
  if (R) {
    const t: number[] = R.timestamp || [], c: number[] = R.indicators?.quote?.[0]?.close || [], ac: number[] = R.indicators?.adjclose?.[0]?.adjclose || c;
    const meses = t.map((x, i) => ({ t: x, c: c[i] })).filter((m) => typeof m.c === 'number' && m.c > 0);
    adj = t.map((x, i) => ({ t: x, c: ac[i] })).filter((m) => typeof m.c === 'number' && m.c > 0);
    const prov = Object.values(R.events?.dividends || {}).map((d: any) => ({ t: +d.date, v: +d.amount })).filter((d) => d.v > 0).sort((a, b) => b.t - a.t);
    out.dy_anos = dyPorAno(meses, prov, Date.now(), typeof f.preco === 'number' ? f.preco : null, 10);
    out.proventos = prov.slice(0, 10).map((d) => ({ data_com: new Date(d.t * 1000).toISOString().slice(0, 10), valor: +d.v.toFixed(6) }));
    out.cotacao = meses.slice(-60).map((m) => [new Date(m.t * 1000).toISOString().slice(0, 7), +m.c.toFixed(2)]);
    const prim = R.meta?.firstTradeDate ?? (meses[0] && meses[0].t);
    if (typeof prim === 'number') out.anos_listada = +((Date.now() / 1000 - prim) / (365.25 * 86400)).toFixed(1);
    out.rentabilidade = rentabilidade(adj);
    const ib = ibov ? (ibov.timestamp || []).map((x: number, i: number) => ({ t: x, c: ibov.indicators?.quote?.[0]?.close?.[i] })).filter((m: any) => typeof m.c === 'number') : [];
    const cmp = comparaIndices({ ativo: adj, ibov: ib, cdi, ipca });
    if (cmp) out.indices = { ...cmp, nome_indice: mk === 'BR' ? 'Ibovespa' : 'S&P 500' };
  }
  const serie = (tipo: string) => {
    const it = (ts?.timeseries?.result || []).find((x: any) => Array.isArray(x?.meta?.type) && x.meta.type[0] === tipo);
    return ((it && it[tipo]) || []).filter(Boolean).map((x: any) => ({ ano: +String(x.asOfDate).slice(0, 4), data: String(x.asOfDate), valor: typeof x?.reportedValue?.raw === 'number' ? x.reportedValue.raw : null }));
  };
  const rec = serie('annualTotalRevenue'), luc = serie('annualNetIncome'), tri = serie('quarterlyNetIncome');
  const anos = [...new Set([...rec, ...luc].map((x: any) => x.ano as number))].sort();
  out.receita_lucro = anos.map((ano) => ({ ano, receita: rec.find((x: any) => x.ano === ano)?.valor ?? null, lucro: luc.find((x: any) => x.ano === ano)?.valor ?? null }));
  // Balanços TRIMESTRAIS disponíveis na fonte (não confundir com demonstrações anuais).
  const qRec = serie('quarterlyTotalRevenue'), qLuc = serie('quarterlyNetIncome');
  const qDatas = [...new Set([...qRec, ...qLuc].map((x: any) => x.data).filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().reverse().slice(0, 8);
  out.trimestres = qDatas.map((periodo: string) => ({
    periodo, receita: qRec.find((x: any) => x.data === periodo)?.valor ?? null,
    lucro: qLuc.find((x: any) => x.data === periodo)?.valor ?? null,
    moeda: out.moeda_contabil || null, fonte: 'Yahoo Finance (secundária; validar CVM/RI)'
  }));
  out.ultimo_trimestre = out.trimestres.find((x: any) => x.receita != null || x.lucro != null)?.periodo || null;
  out.consultado_em = new Date().toISOString();
  const liq = typeof f.volume_medio_3m === 'number' && typeof f.preco === 'number' ? f.volume_medio_3m * f.preco : null;
  try { const SB: Record<string, any[]> = {}; for (const t of IUD_TIPOS) SB[t] = serie(t).map((x: any) => ({ ano: x.ano, valor: x.valor })); out.balancos = iudIndicadores(SB, /bank|banco|insurance|seguro/i.test(f.industria || '') && /financial/i.test(f.setor || '')); } catch { out.balancos = null; }
  out.checklist = checklist({ anosListada: out.anos_listada, roe: f.roe ?? null, receitas: rec, lucros: luc, lucrosTri: tri, liquidezDia: liq, usdbrl: mk === 'BR' ? usd : 1, dyAnos: out.dy_anos, dividaPL: f.divida_pl_pct ?? null, banco: /bank|banco/i.test(f.industria || '') && /financial/i.test(f.setor || ''), margemLiquida: f.margem_liquida ?? null });
  // dados sobre a empresa
  const acoes = typeof f.valor_mercado === 'number' && typeof f.preco === 'number' && f.preco > 0 ? f.valor_mercado / f.preco : null;
  const pl = acoes && typeof f.vpa === 'number' ? acoes * f.vpa : null;
  out.empresa = { valor_mercado: f.valor_mercado ?? null, valor_firma: f.valor_da_firma ?? null, patrimonio: pl, acoes, divida_bruta: f.divida_bruta ?? null, divida_liquida: typeof f.divida_bruta === 'number' && typeof f.caixa === 'number' ? f.divida_bruta - f.caixa : null, caixa: f.caixa ?? null, liquidez_media_diaria: liq, setor: f.setor || null, industria: f.industria || null, divida_liq_patrimonio: pl && typeof f.divida_bruta === 'number' && typeof f.caixa === 'number' ? +((f.divida_bruta - f.caixa) / pl).toFixed(2) : null };
  // Bazin como o Investidor10: média dos proventos dos últimos 5 anos completos ÷ 6%
  const cinco = out.dy_anos.filter((x: any) => !x.parcial).slice(-5);
  if (cinco.length) out.bazin_media5 = +(cinco.reduce((s: number, x: any) => s + x.proventos, 0) / cinco.length).toFixed(4);
  return out;
}
/** Soma dos proventos (dividendos e JCP) pagos nos últimos 12 meses, pelo histórico de eventos do Yahoo. */
async function proventos12m(sym: string): Promise<number | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2y&interval=1mo&events=div`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
    if (!r.ok) return null;
    const R = (await r.json())?.chart?.result?.[0];
    if (!R) return null;
    const ev = R.events?.dividends || {}, lim = Date.now() / 1000 - 365 * 86400;
    const vals = Object.values(ev) as any[];
    if (!vals.length) return (R.timestamp || []).length > 6 ? 0 : null; // ativo com histórico e sem proventos = 0
    return vals.filter((d) => +d.date >= lim && +d.amount > 0).reduce((s, d) => s + +d.amount, 0);
  } catch { return null; }
}
/** Cotação para converter a moeda do balanço na moeda do preço (ex.: USD → BRL). */
async function cambio(de: string, para: string): Promise<number | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(de + para + '=X')}?range=5d&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
    if (!r.ok) return null;
    const v = (await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof v === 'number' && v > 0 ? v : null;
  } catch { return null; }
}
async function yahoo(tk: string, mk: string, retry = true): Promise<any> {
  const sym = mk === 'BR' ? tk + '.SA' : tk;
  const a = await yhAuth();
  const mods = 'price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,recommendationTrend';
  const r = await fetch(
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=${mods}&crumb=${encodeURIComponent(a.crumb)}`,
    { headers: { 'User-Agent': UA, Cookie: a.cookie }, signal: AbortSignal.timeout(10_000) },
  );
  if ((r.status === 401 || r.status === 403) && retry) { YH = null; return yahoo(tk, mk, false); }
  if (!r.ok) throw new Error('Yahoo ' + r.status);
  const R = (await r.json())?.quoteSummary?.result?.[0];
  if (!R) throw new Error('Yahoo sem dados');
  const p = R.price || {}, sd = R.summaryDetail || {}, ks = R.defaultKeyStatistics || {}, fd = R.financialData || {}, ap = R.assetProfile || {};
  const t = (R.recommendationTrend?.trend || [])[0] || {};
  const ebitda = raw(fd.ebitda), div = raw(fd.totalDebt), cx = raw(fd.totalCash);
  const f: any = {
    nome: p.longName || p.shortName || '', setor: ap.sector || '', industria: ap.industry || '',
    preco: raw(fd.currentPrice) ?? raw(p.regularMarketPrice),
    pl: raw(sd.trailingPE), p_vp: raw(ks.priceToBook), ev_ebitda: raw(ks.enterpriseToEbitda),
    roe: raw(fd.returnOnEquity), roa: raw(fd.returnOnAssets),
    margem_liquida: raw(fd.profitMargins) ?? raw(ks.profitMargins), margem_bruta: raw(fd.grossMargins),
    margem_ebitda: raw(fd.ebitdaMargins), margem_operacional: raw(fd.operatingMargins),
    divida_pl_pct: raw(fd.debtToEquity),
    div_liq_ebitda: ebitda && div != null && cx != null ? r2((div - cx) / ebitda) : null,
    crescimento_receita: raw(fd.revenueGrowth), crescimento_lucro: raw(fd.earningsGrowth),
    valor_mercado: raw(p.marketCap), dividend_yield: raw(sd.dividendYield) ?? raw(sd.trailingAnnualDividendYield),
    payout: raw(sd.payoutRatio), beta: raw(sd.beta) ?? raw(ks.beta),
    alvo_medio_analistas: raw(fd.targetMeanPrice),
    analistas_compra_forte_e_compra: (t.strongBuy || 0) + (t.buy || 0),
    analistas_manter: t.hold || 0,
    analistas_venda_e_venda_forte: (t.sell || 0) + (t.strongSell || 0),
    alvo_maximo_analistas: raw(fd.targetHighPrice), alvo_minimo_analistas: raw(fd.targetLowPrice), numero_analistas: raw(fd.numberOfAnalystOpinions),
    lpa: raw(ks.trailingEps), lpa_projetado: raw(ks.forwardEps), vpa: raw(ks.bookValue),
    pl_projetado: raw(ks.forwardPE) ?? raw(sd.forwardPE), peg: raw(ks.pegRatio), valor_da_firma: raw(ks.enterpriseValue),
    receita: raw(fd.totalRevenue), ebitda, divida_bruta: div, caixa: cx,
    fluxo_caixa_operacional: raw(fd.operatingCashflow), fluxo_caixa_livre: raw(fd.freeCashflow), liquidez_corrente: raw(fd.currentRatio),
    crescimento_lucro_trimestral: raw(ks.earningsQuarterlyGrowth),
    dividendo_por_acao: raw(sd.dividendRate) ?? raw(sd.trailingAnnualDividendRate), dy_media_5a_pct: raw(sd.fiveYearAvgDividendYield),
    max_52s: raw(sd.fiftyTwoWeekHigh), min_52s: raw(sd.fiftyTwoWeekLow),
    volume_medio_3m: raw(p.averageDailyVolume3Month) ?? raw(sd.averageVolume),
  };
  // confere e corrige: moeda do balanço, P/L e P/VP pela conta, dividendos dos últimos 12 meses e bancos
  const moedaPreco = p.currency || null, moedaBalanco = fd.financialCurrency || null;
  f.moeda_contabil = moedaBalanco;
  f.moeda_cotacao = moedaPreco;
  const [prov, fx] = await Promise.all([
    proventos12m(sym),
    moedaPreco && moedaBalanco && moedaPreco !== moedaBalanco ? cambio(moedaBalanco, moedaPreco) : Promise.resolve(null),
  ]);
  const aj = ajustaFundamentos(f, { moedaPreco, moedaBalanco, fx, proventos12m: prov });
  const chaves = ['pl', 'p_vp', 'ev_ebitda', 'roe', 'margem_liquida', 'divida_pl_pct', 'dividend_yield', 'crescimento_receita'];
  if (aj.notas.length) aj.f.notas_dos_dados = aj.notas;
  return { f: aj.f, notas: aj.notas, cobertura: chaves.filter((k) => aj.f[k] != null).length >= 4 ? 'ok' : 'baixa' };
}

// ---------- Gemini ----------
// O Supabase derruba a função (erro 546) se ela passar do limite de tempo (150 s no plano grátis).
// Por isso cada pedido ao Gemini tem prazo: se a IA não responder a tempo, a função devolve um erro claro antes de ser cortada.
const PRAZO_MS = Math.max(40, Math.min(380, +(Deno.env.get('ANALISE_PRAZO_S') || 125))) * 1000;
const PENSAR = (Deno.env.get('GEMINI_THINKING') || 'low').toLowerCase(); // low | medium | high | padrao
/** Modelos reserva: os "flash" estáveis mais novos que a sua chave pode usar (lista do próprio Google, guardada por 6 horas). */
let cModelos: { ts: number; v: string[] } | null = null;
// ---------- Jornal: preparo (números, contexto e manchetes, guardados 15 min), as 4 partes e a montagem ----------
type JrId = 'A' | 'B1' | 'B2' | 'C' | 'D';
const JR_IDS: JrId[] = ['A', 'B1', 'B2', 'C'];
const JR_TODAS = ['A', 'B1', 'B2', 'C', 'D'];
const jrParteK = (E: { dia: string; ed: string }, id: string) => `jornal:${E.dia}:${E.ed}:p${id}`;
/** O calendário de balanços que o app já tem (vem da função macro), limpo: só o necessário. */
function balDoApp(x: any) {
  if (!x || typeof x !== 'object') return null;
  const L = (a: any) => (Array.isArray(a) ? a : []).slice(0, 60).map((y: any) => ({ tk: String(y?.tk || '').slice(0, 8), nome: String(y?.nome || '').slice(0, 40), d: String(y?.d || '').slice(0, 10), hora: y?.hora ? String(y.hora).slice(0, 5) : null, quando: ['antes', 'durante', 'depois'].includes(y?.quando) ? y.quando : null, conf: ['cvm', 'com', 'est'].includes(y?.conf) ? y.conf : 'est', cap: +y?.cap || 0, link: /^https:\/\/www\.rad\.cvm\.gov\.br\//.test(String(y?.link || '')) ? String(y.link).slice(0, 400) : '' })).filter((y: any) => /^[A-Z]{4}\d{1,2}$/.test(y.tk) && /^\d{4}-\d{2}-\d{2}$/.test(y.d));
  return { ontem: L(x.ontem), hoje_lista: L(x.hoje_lista), proximos: L(x.proximos) };
}
/** Junta o calendário do servidor com o do app: o que tiver confirmação da CVM em qualquer um dos dois vale. */
function balJunta(v: any, app: any) {
  const a = balDoApp(app); if (!v) return a; if (!a) return v;
  const j = (x: any[], y: any[]) => { const m = new Map<string, any>(); for (const it of [...(x || []), ...(y || [])]) { const o = m.get(it.tk); if (!o || (it.conf === 'cvm' && o.conf !== 'cvm')) m.set(it.tk, it); } return [...m.values()]; };
  return { ...v, ontem: j(v.ontem, a.ontem), hoje_lista: j(v.hoje_lista, a.hoje_lista), proximos: j(v.proximos, a.proximos) };
}
async function jrPrep(E: { dia: string; ed: Edicao }, sp: Date, novo: boolean, balApp: any = null) {
  const k = `jornal:prep:${E.dia}:${E.ed}`;
  if (!novo) { const c = await cacheGet(k); if (c?.dados?.pedido && Date.now() - (+c.dados.ts || 0) < 15 * 60_000) return c.dados; }
  const jan = E.ed === 'manha' ? 'pre' : 'fech';
  const [q, cx, mans, vb] = await Promise.all([
    giroCotacoes().catch(() => [] as any[]),
    giroContexto(hoje()).catch(() => ({ eleicao: [] as string[], sazonal: [] as string[], sentimento: [] as string[] })),
    jrManchetes(E.ed === 'fds' ? 72 : 30).catch(() => []),
    Promise.race([balancos(7), new Promise((r) => setTimeout(() => r(null), 25_000))]).catch(() => null).then((v: any) => balJunta(v, balApp)) as Promise<any>,
  ]);
  const tec = await giroTecnica(q).catch(() => [] as string[]);
  const dsem = sp.toLocaleDateString('pt-BR', { weekday: 'long' }), hh = `${String(sp.getHours()).padStart(2, '0')}h${String(sp.getMinutes()).padStart(2, '0')}`;
  let pedido = `Hoje é ${dsem}, ${hoje().split('-').reverse().join('/')}, ${hh} (Brasília). Escreva a "${ED_NOME[E.ed]}" do jornal (edição "${E.ed}").\n\nCotações agora (TradingView):\n- ${giroLinhas(q, jan).join('\n- ')}`;
  if (tec.length) pedido += `\n\nLeitura técnica (calculada pelo sistema com o histórico diário):\n- ${tec.join('\n- ')}`;
  const bl: string[] = [];
  if (cx.eleicao.length) bl.push('Calendário eleitoral:\n- ' + cx.eleicao.join('\n- '));
  if (cx.sazonal.length) bl.push('Sazonalidade histórica (estatística do passado, não previsão):\n- ' + cx.sazonal.join('\n- '));
  if (cx.sentimento.length) bl.push('Termômetro de sentimento:\n- ' + cx.sentimento.join('\n- '));
  if (bl.length) pedido += `\n\nCONTEXTO DO SISTEMA:\n${bl.join('\n\n')}`;
  try { const lb = vb ? giroBalancosLinhas(vb, jan, {}) : []; if (lb.length) pedido += `\n\nBalanços (calendário do sistema; pesquise o resultado de cada um):\n- ${lb.join('\n- ')}`; } catch { /* sem balanços */ }
  if (mans.length) pedido += `\n\nManchetes de outros veículos nas últimas horas (SÓ PISTAS do que pesquisar; não copie, confirme os fatos e escreva com as suas palavras):\n- ${mans.slice(0, 30).map((m) => `[${new Date(m.d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} · ${m.f}] ${m.t}${m.r ? ' — resumo: ' + m.r : ''}`).join('\n- ')}`;
  // B3 fechada (antes das 10h, fim de semana ou noite): os números da bolsa são do ÚLTIMO PREGÃO — a IA não pode tratar como notícia de hoje
  {
    const minN = sp.getHours() * 60 + sp.getMinutes(), fdsN = [0, 6].includes(sp.getDay());
    if (E.ed !== 'tarde' && E.ed !== 'meio' && (fdsN || minN < 10 * 60)) {
      let ult = new Date(Date.parse(hoje() + 'T12:00:00Z') - 864e5); while ([0, 6].includes(ult.getUTCDay())) ult = new Date(+ult - 864e5);
      const ud = ult.toISOString().slice(0, 10), un = ult.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
      pedido += `\n\nATENÇÃO — A B3 AINDA NÃO ABRIU HOJE${fdsN ? ' (fim de semana)' : ' (o mini índice abre às 9h e a bolsa às 10h)'}. Os números de Ibovespa, mini índice, dólar futuro e DI nas cotações acima são do FECHAMENTO DO ÚLTIMO PREGÃO (${un}) e a variação é a daquele dia. Escreva sobre eles no passado e com a data ("ontem", "na ${un.split(',')[0]}"), nunca como se tivessem acontecido hoje.\nEDIÇÃO DA MANHÃ: a manchete é o que é NOVO desde o fechamento do último pregão — o que aconteceu de madrugada e no exterior, as notícias desta manhã, o pré-mercado em NY (EWZ e ADRs), a agenda de hoje e o que o mercado espera para a abertura. O grande fato do último pregão entra como CONTEXTO ("depois do tombo de ontem…"), não como a notícia do dia. Não repita a edição anterior.`;
      try { const ant = (await cacheGet(`jornal:${ud}:tarde`))?.dados || (await cacheGet(`jornal:${ud}:fds`))?.dados; if (ant?.manchete?.titulo) pedido += `\nA edição anterior (${un}) já deu como manchete: "${ant.manchete.titulo}". Matérias dela: ${(ant.materias || []).slice(0, 6).map((m: any) => '"' + m.titulo + '"').join('; ')}. Traga o desdobramento e o que mudou desde então, não a mesma notícia.`; } catch { /* sem a edição anterior */ }
    }
  }
  if (E.ed === 'tarde') { try { const mc = await cacheGet(`jornal:${E.dia}:manha`); const rm = manhaResumo(mc?.dados); if (rm) pedido += CONF_PEDIDO + `\n\nEdição da manhã:\n${rm}`; } catch { /* sem a manhã, sem conferência */ } }
  // ---- o MOMENTO: a IA precisa saber a hora exata e o que já aconteceu hoje (para não dizer "vai sair" do que já saiu) ----
  const minA = sp.getHours() * 60 + sp.getMinutes(), fdsA = [0, 6].includes(sp.getDay());
  const pregao = b3SemPregao(hoje()) ? 'B3 fechada nesta data: não houve abertura nem pregão hoje. Identifique cotações brasileiras como referência do último pregão, nunca como movimentação de hoje. Mercados internacionais têm calendário próprio.' : fdsA ? 'fim de semana (bolsa fechada)' : minA < 9 * 60 ? 'antes da abertura (o mini índice abre às 9h e a bolsa às 10h)' : minA < 10 * 60 ? 'mercado futuro aberto; a bolsa abre às 10h' : minA < 17 * 60 ? 'pregão em andamento' : minA < 18 * 60 + 30 ? 'pregão acabou de fechar (17h)' : 'pregão encerrado; after-market e noite';
  const saiuHoje = [...(vb?.hoje_lista || [])].filter((x: any) => x.conf === 'cvm'), vaiHoje = [...(vb?.hoje_lista || [])].filter((x: any) => x.conf !== 'cvm');
  pedido += `\n\nMOMENTO DA EDIÇÃO (respeite): agora são ${hh} de ${dsem} em Brasília — ${pregao}. Tudo o que tem horário ANTES de ${hh} hoje JÁ ACONTECEU: escreva no passado e com o resultado; nunca diga que "vai divulgar", "vai sair" ou "é esperado" para algo que já saiu. Só o que é depois de ${hh} é futuro.`;
  if (saiuHoje.length) pedido += `\nJÁ DIVULGARAM BALANÇO HOJE (documento entregue à CVM): ${saiuHoje.slice(0, 12).map((x: any) => x.tk + (x.hora ? ' às ' + x.hora : '')).join(', ')}.`;
  if (vaiHoje.length) pedido += `\nAINDA NÃO ENTREGARAM (previsto para hoje): ${vaiHoje.slice(0, 12).map((x: any) => x.tk + (x.hora ? ' ~' + x.hora : '')).join(', ')}.`;
  // balanços que ganham matéria própria (parte D): os entregues à CVM desde a última edição, os 3 maiores
  const ontemOk = E.ed === 'manha' || E.ed === 'fds';
  const balSaiu = [...saiuHoje, ...(ontemOk ? (vb?.ontem || []).filter((x: any) => x.conf === 'cvm') : [])]
    .filter((x: any, i: number, a: any[]) => a.findIndex((y: any) => String(y.tk).slice(0, 4) === String(x.tk).slice(0, 4)) === i)
    .sort((a: any, b: any) => (b.cap || 0) - (a.cap || 0)).slice(0, 3)
    .map((x: any) => ({ tk: x.tk, nome: String(x.nome || '').slice(0, 40), d: x.d, hora: x.hora || null, link: x.link || '' }));
  // balanços da agenda: vêm do calendário do sistema (CVM confirma), não da IA, que erra datas
  const dd = (d: string) => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][new Date(d + 'T12:00:00Z').getUTCDay()] + ' ' + d.slice(8, 10) + '/' + d.slice(5, 7);
  const balAg = (() => { try {
    const hj = hoje(), L = [...(vb?.hoje_lista || []).filter((x: any) => x.conf !== 'cvm' && (E.ed === 'manha' || x.quando !== 'antes')), ...(vb?.proximos || []).filter((x: any) => x.d > hj)];
    return L.filter((x: any, i: number, a: any[]) => a.findIndex((y: any) => y.tk.slice(0, 4) === x.tk.slice(0, 4)) === i).sort((a: any, b: any) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (b.cap || 0) - (a.cap || 0))).slice(0, 6)
      .map((x: any) => ({ quando: dd(x.d) + (x.hora ? ' ' + x.hora : x.quando === 'antes' ? ' (antes da abertura)' : x.quando === 'depois' ? ' (após o fechamento)' : ''), evento: `Balanço: ${x.tk}${x.nome && x.nome.toUpperCase() !== x.tk ? ' (' + String(x.nome).slice(0, 30) + ')' : ''}`, por_que: x.conf === 'com' ? 'Data confirmada pela empresa em comunicado à CVM.' : 'Data estimada pelo calendário de resultados; a empresa ainda não confirmou.' }));
  } catch { return []; } })();
  const d = { pedido, q: q.filter((x: any) => x.px != null).slice(0, 14), mans: mans.slice(0, 25), bal_ag: balAg, bal_saiu: balSaiu, ts: Date.now() };
  await cachePut(k, d);
  return d;
}
/** Escreve uma parte. A manchete (A) e as 2 matérias principais (B1) pesquisam na internet por até 70 s; se não der, escrevem sem pesquisa. */
async function jrParteGera(E: { dia: string; ed: Edicao }, P: any, id: JrId, ate: number) {
  if (id === 'D') return jrParteD(E, P, ate);
  const notaBal = Array.isArray(P.bal_saiu) && P.bal_saiu.length ? `\n\nBALANÇOS: os resultados de ${P.bal_saiu.map((x: any) => x.tk).join(', ')} ganham matéria própria de outra equipe, com os números. NÃO escreva matéria sobre esses balanços; se precisar citar, cite em uma frase.` : '';
  const txt = P.pedido + notaBal + (id === 'A' ? PARTE_A + (E.ed === 'fds' ? AULA_PEDIDO : '') : id === 'B1' ? PARTE_B1 : id === 'B2' ? PARTE_B2 : PARTE_C);
  const mJ = Deno.env.get('GEMINI_MODEL_JORNAL') || Deno.env.get('GEMINI_MODEL_GIRO') || (await modelosReserva())[0] || MODELO;
  const op = { json: true, model: mJ, ate, temp: 0.55 };
  const ler = (t: string) => { try { const x = t.replace(/```json|```/g, ''); return JSON.parse(x.slice(x.indexOf('{'), x.lastIndexOf('}') + 1)); } catch { return jsonTolerante(t); } };
  let r: any = null, obs = '';
  if (id === 'A' || id === 'B1') {
    try { r = jrDesembrulha(await gemini(SYS_JORNAL, [{ text: txt }], { ...op, search: true, ate: Math.min(ate - 30_000, Date.now() + 70_000) }), ler); if (!jrParteServe(id, r)) { obs = 'com pesquisa veio fora do formato (' + Object.keys(r || {}).join(',') + ')'; r = null; } }
    catch (e) { obs = (e as Error).message.slice(0, 160); }
    if (!r) console.log('jornal: parte', id, 'indo sem pesquisa:', obs);
  }
  if (!r) {
    // sem pesquisa a resposta vem em JSON garantido (modo JSON do Gemini)
    r = jrDesembrulha(await gemini(SYS_JORNAL + SEM_BUSCA_JR, [{ text: txt }], { ...op, search: false }), ler);
    if (!jrParteServe(id, r)) throw new Error(`A IA respondeu fora do formato na parte ${id} (campos: ${Object.keys(r || {}).join(', ') || 'nenhum'})`);
  }
  await cachePut(jrParteK(E, id), { r, ts: Date.now() });
  return r;
}
/** Balanços entregues à CVM que a edição pronta ainda não cobre (confere no máximo a cada 10 min). */
async function jrBalNovos(E: { dia: string; ed: Edicao }, ed: any, balApp: any = null): Promise<string[]> {
  if (E.dia !== hoje()) return [];
  { const f = await cacheGet(`jornal:balfalha:${E.dia}:${E.ed}`); if (f?.dados && Date.now() - (+f.dados.ts || 0) < 30 * 60_000) return []; }
  const k = `jornal:balchk:${E.dia}:${E.ed}`, c = await cacheGet(k);
  let saiu: string[] | null = c?.dados && Date.now() - (+c.dados.ts || 0) < 10 * 60_000 ? c.dados.saiu : null;
  if (!saiu) {
    const vb: any = balJunta(await Promise.race([balancos(7), new Promise((r) => setTimeout(() => r(null), 12_000))]).catch(() => null), balApp);
    if (!vb) return [];
    saiu = [...(vb.hoje_lista || []), ...(E.ed === 'manha' || E.ed === 'fds' ? vb.ontem || [] : [])].filter((x: any) => x.conf === 'cvm').sort((a: any, b: any) => (b.cap || 0) - (a.cap || 0)).map((x: any) => String(x.tk));
    await cachePut(k, { ts: Date.now(), saiu });
  }
  const cob = new Set((Array.isArray(ed?.bal_cobertos) ? ed.bal_cobertos : []).map((t: string) => String(t).slice(0, 4)));
  const raizes = [...new Set(saiu.map((t) => t.slice(0, 4)))].slice(0, 3);
  return raizes.filter((r) => !cob.has(r));
}
/** PDF oficial do documento na CVM (só o download direto do press-release), em base64 para o Gemini ler. */
async function cvmPdf(link: string): Promise<string | null> {
  if (!/frmDownloadDocumento\.aspx/.test(link || '')) return null;
  try {
    const r = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return null;
    const u8 = new Uint8Array(await r.arrayBuffer());
    if (u8.length < 1000 || u8.length > 12_000_000 || String.fromCharCode(...u8.slice(0, 4)) !== '%PDF') return null;
    let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    return btoa(bin);
  } catch { return null; }
}
/** Parte D: uma matéria por balanço entregue. Cada empresa num pedido próprio (em paralelo), lendo o PDF oficial
 *  quando a CVM entrega e pesquisando os números na internet. Matéria sem números não entra. */
async function jrParteD(E: { dia: string; ed: Edicao }, P: any, ate: number) {
  const L: any[] = Array.isArray(P.bal_saiu) ? P.bal_saiu : [];
  if (!L.length) { const r = { materias: [], vazio: true, cobertos: [] }; await cachePut(jrParteK(E, 'D'), { r, ts: Date.now() }); return r; }
  const mJ = Deno.env.get('GEMINI_MODEL_JORNAL') || Deno.env.get('GEMINI_MODEL_GIRO') || (await modelosReserva())[0] || MODELO;
  const ler = (t: string) => { try { const x = t.replace(/```json|```/g, ''); return JSON.parse(x.slice(x.indexOf('{'), x.lastIndexOf('}') + 1)); } catch { return jsonTolerante(t); } };
  const temNumero = (m: any) => (Array.isArray(m?.numeros) && m.numeros.some((n: any) => /\d/.test(String(n?.valor || '')))) || /R\$\s?\d|\d+[,.]?\d*\s?(%|bilh|milh|bi\b|mi\b)/i.test(String(m?.texto || ''));
  const uma = async (x: any) => {
    const pdf = await cvmPdf(x.link);
    const parts: any[] = [{ text: P.pedido + PARTE_D + '\n\nBALANÇOS QUE SAÍRAM:\n' + balSaiuTexto([x], pdf ? [x.tk] : []) + '\n\nPesquise na internet "' + (x.nome || x.tk) + ' resultado trimestre" (release de resultados, notícias de hoje) para pegar os números: lucro, receita, Ebitda, margens, dívida e dividendos. Inclua na matéria o campo "fonte_url" com o link da melhor fonte que você usou.' }];
    if (pdf) { parts.push({ text: `Documento oficial de ${x.tk} entregue à CVM:` }); parts.push({ inline_data: { mime_type: 'application/pdf', data: pdf } }); }
    let r: any = null, erro = '';
    // com pesquisa (e com o PDF, se veio): é o que traz os números
    try { r = jrDesembrulha(await gemini(SYS_JORNAL, parts, { json: true, model: mJ, temp: 0.3, search: true, ate: ate - 5_000 }), ler); } catch (e) { erro = (e as Error).message; }
    let m = (r?.materias || [])[0];
    // sem pesquisa só se o PDF veio (aí os números estão no documento)
    if ((!m || !temNumero(m)) && pdf && Date.now() < ate - 25_000) { try { r = jrDesembrulha(await gemini(SYS_JORNAL, parts, { json: true, model: mJ, temp: 0.3, search: false, ate: ate - 3_000 }), ler); m = (r?.materias || [])[0]; } catch (e) { erro = erro || (e as Error).message; } }
    if (!m || !m.titulo || !m.texto || !temNumero(m)) throw new Error(`não achei os números do balanço de ${x.tk} ainda${erro ? ' (' + erro.slice(0, 120) + ')' : ''}`);
    const fu = /^https?:\/\//.test(String(m.fonte_url || '')) ? String(m.fonte_url).slice(0, 400) : '';
    return { ...m, editoria: 'Empresas', tk: x.tk, link: x.link || '', pdf: !!pdf, fonte_url: fu };
  };
  const res = await Promise.allSettled(L.map(uma));
  const materias = res.map((y) => (y.status === 'fulfilled' ? y.value : null)).filter(Boolean);
  const falhas = res.map((y, i) => (y.status === 'rejected' ? L[i].tk + ': ' + String((y as PromiseRejectedResult).reason?.message || '') : '')).filter(Boolean);
  if (!materias.length) throw new Error('Balanços: ' + (falhas[0] || 'sem números ainda'));
  const r = { materias, cobertos: materias.map((m: any) => m.tk), falhas };
  await cachePut(jrParteK(E, 'D'), { r, ts: Date.now() });
  return r;
}
/** Junta as partes prontas numa edição e guarda para todo mundo. O app manda as partes que recebeu; o que faltar vem do cache. */
async function jrJuntaSalva(E: { dia: string; ed: Edicao }, P: any, doApp: Record<string, any> = {}) {
  const ps = await Promise.all(JR_IDS.map(async (id) => { const x = jrDesembrulha(doApp?.[id]); if (jrParteServe(id, x)) return x; const c = jrDesembrulha((await cacheGet(jrParteK(E, id)))?.dados?.r); return jrParteServe(id, c) ? c : null; }));
  if (!ps.some(Boolean)) throw new Error('nenhuma parte da edição chegou pronta');
  const corpo: any = jrJunta(ps[0], ...ps.slice(1));
  // balanços do dia (parte D) entram primeiro em "Mais do dia", com o link do documento oficial
  let D = jrDesembrulha(doApp?.D); if (!D?.materias) D = (await cacheGet(jrParteK(E, 'D')))?.dados?.r || null;
  const balM = (D?.materias || []).map((m: any) => { try { const n = jrNormaliza({ manchete: { ...m, editoria: 'Empresas' } }).manchete; return { ...n, tk: String(m.tk || '').slice(0, 8), link: /^https:\/\/www\.rad\.cvm\.gov\.br\//.test(m.link || '') ? m.link : '', pdf: !!m.pdf, fonte_url: /^https?:\/\//.test(m.fonte_url || '') ? String(m.fonte_url).slice(0, 400) : '' }; } catch { return null; } }).filter(Boolean);
  if (balM.length) { const nomes = [...balM.map((m: any) => m.tk.slice(0, 4)), ...(Array.isArray(P.bal_saiu) ? P.bal_saiu : []).map((x: any) => String(x.nome || '').split(/\s+/)[0]).filter((w: string) => w.length >= 4)].map((w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()); const sem = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); corpo.materias = [...balM, ...(corpo.materias || []).filter((m: any) => !(m.editoria === 'Empresas' && nomes.some((w: string) => new RegExp('\\b' + w).test(sem(m.titulo + ' ' + m.linha_fina)))))].slice(0, 9); }
  corpo.bal_cobertos = Array.isArray(D?.cobertos) ? D.cobertos : balM.map((m: any) => m.tk);
  if (Array.isArray(P.bal_ag)) corpo.agenda = [...(corpo.agenda || []).filter((x: any) => !/balan[cç]|resultad|\b[1-4]T\d{2}\b|\bITR\b|\bDFP\b/i.test(`${x.evento} ${x.por_que || ''}`)), ...P.bal_ag].slice(0, 9);
  const g = { edicao: E.ed, nome: ED_NOME[E.ed], dia: E.dia, gerado: new Date().toISOString(), ...corpo, cotacoes: P.q || [], manchetes_externas: P.mans || [], ...(ps.some((x) => !x) ? { parcial: true } : {}) };
  await cachePut(`jornal:${E.dia}:${E.ed}`, g);
  await cachePut('jornal:ultimo', g);
  return g;
}

/** Guarda o erro do dia (os 40 mais recentes) para o app mostrar em Status → Últimos erros. */
async function erroLog(modo: string, msg: string, cron: boolean) {
  const k = `erros:${hoje()}`, c = await cacheGet(k), L = Array.isArray(c?.dados?.L) ? c!.dados.L : [];
  L.unshift({ t: new Date().toISOString(), modo, msg: msg.slice(0, 400), cron });
  await cachePut(k, { L: L.slice(0, 40) });
}
/** Explica em português simples por que a edição não fechou (vai para o app). */
function jrMotivo(e: unknown) {
  const m = String(e || '');
  if (/sobrecarreg|503|overload|UNAVAILABLE/i.test(m)) return 'Motivo: a IA do Google está sobrecarregada agora. Tente de novo em alguns minutos.';
  if (/429|quota|RESOURCE_EXHAUSTED|cota/i.test(m)) return 'Motivo: a cota da IA do Google acabou por hoje (ela volta de madrugada) e a reserva gratuita também não respondeu.';
  if (/PRAZO|a tempo|demor/i.test(m)) return 'Motivo: a IA demorou demais para escrever. Tente de novo em 1 minuto.';
  if (/fora do formato|nenhuma parte/i.test(m)) return 'Motivo: ' + m;
  return m ? 'Motivo: ' + m.slice(0, 160) : 'Tente de novo em 1 minuto.';
}
async function modelosReserva(): Promise<string[]> {
  const fixo = (Deno.env.get('GEMINI_MODEL_RESERVA') || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (fixo.length) return fixo;
  if (cModelos && Date.now() - cModelos.ts < 6 * 3600_000) return cModelos.v;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': GEMINI_KEY }, signal: AbortSignal.timeout(6_000) });
    const j = await r.json();
    const v = ordenaModelos((j?.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m: any) => String(m.name || '').replace(/^models\//, '')));
    if (v.length) { cModelos = { ts: Date.now(), v }; return v; }
  } catch { /* usa a lista fixa */ }
  return ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
}
/** Só "gemini-X.Y-flash" e "gemini-X.Y-flash-lite" estáveis (sem preview/exp/tts/imagem): os 2 flash mais novos, o lite mais novo e o flash mais antigo. */
export function ordenaModelos(nomes: string[]): string[] {
  const ok = nomes.map((n) => /^gemini-(\d+(?:\.\d+)?)-flash(-lite)?$/.exec(n)).filter((m): m is RegExpExecArray => !!m);
  const fl = ok.filter((m) => !m[2]).sort((a, b) => +b[1] - +a[1]).map((m) => m[0]), li = ok.filter((m) => m[2]).sort((a, b) => +b[1] - +a[1]).map((m) => m[0]);
  // quando o Google sobrecarrega, costuma ser a família toda do modelo novo: a reserva mistura o flash novo, o flash-lite (outra fila) e um flash mais antigo
  return [...new Set([fl[0], fl[1], li[0], fl[fl.length - 1], li[1]].filter(Boolean))].slice(0, 4) as string[];
}
// ---------- duas IAs: Gemini (com busca na internet) e OpenRouter (modelos gratuitos, sem busca) ----------
// prefer 'or': tarefas leves (professor de inglês, questões, coach) vão primeiro para o OpenRouter e poupam a cota do Gemini.
// Nas outras, o Gemini vai primeiro e o OpenRouter entra se o Gemini falhar (cota, sobrecarga, modelo fora do ar).
const SEM_BUSCA = '\n\nATENÇÃO: agora você NÃO tem acesso à internet. Não cite notícias, pesquisas ou resultados de hoje que não estejam nos dados recebidos; quando faltar o motivo do movimento, diga que o texto foi feito só com os dados do sistema.';
export const IA_CONTA = { gemini: 0, openrouter: 0, falhasGemini: 0 };
async function gemini(system: string, parts: any[], opt: { json?: boolean; search?: boolean; model?: string; ate?: number; temp?: number; prefer?: 'or' | 'gemini' } = {}) {
  const soTexto = parts.every((p) => p && typeof p.text === 'string'), podeOr = !!OR_KEY && soTexto && !orEsgotado();
  const viaOr = async (semBusca: boolean) => { const r = await orChat(system + (semBusca ? SEM_BUSCA : ''), parts.map((p) => p.text).join('\n\n'), { json: opt.json, temp: opt.temp, ate: opt.ate }); IA_CONTA.openrouter++; return r; };
  if (podeOr && (opt.prefer === 'or' || !GEMINI_KEY)) {
    try { return await viaOr(false); } catch (e) { if (!GEMINI_KEY) throw e; console.log('OpenRouter falhou, indo para o Gemini:', (e as Error).message); }
  }
  try { const r = await geminiG(system, parts, opt); IA_CONTA.gemini++; return r; }
  catch (e) {
    IA_CONTA.falhasGemini++;
    const msg = (e as Error)?.message || '';
    if (!podeOr || opt.prefer === 'or' || (opt.ate && opt.ate - Date.now() < 15_000)) throw e;
    console.log('Gemini falhou, indo para o OpenRouter:', msg.slice(0, 200));
    try { return await viaOr(!!opt.search); } catch (e2) { throw new Error(msg + ' · Reserva (OpenRouter): ' + (e2 as Error).message); }
  }
}
async function geminiG(system: string, parts: any[], opt: { json?: boolean; search?: boolean; model?: string; ate?: number; temp?: number } = {}) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY não configurada no Supabase.');
  let modelo = modeloAtual(opt.model || MODELO);
  const ate = opt.ate || Date.now() + PRAZO_MS;
  const resta = () => ate - Date.now();
  const post = async (body: any) => {
    const ms = resta();
    if (ms < 5000) throw new Error('PRAZO');
    try {
      return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.min(ms, 55_000)),
      });
    } catch (e) {
      const n = (e as Error)?.name || '';
      if (n === 'TimeoutError' || n === 'AbortError') throw new Error('PRAZO');
      throw e;
    }
  };
  let pensar: any = {};
  // Google sobrecarregado (503/429/500): tenta de novo o mesmo modelo e depois os modelos reserva
  // Usar versões estáveis e respostas rápidas primeiro, sem ficar repetindo o modelo 2.5 já indisponível.
  const reserva = [...new Set([modelo, 'gemini-3.5-flash-lite', 'gemini-3.6-flash'])];
  const sobrecarga = (e: unknown) => /^Gemini (429|500|502|503|504)\b/.test((e as Error)?.message || '');
  const sumiu = (e: unknown) => /^Gemini 404\b/.test((e as Error)?.message || '');
  for (let i = 0; i < reserva.length; i++) {
    modelo = reserva[i];
    pensar = /gemini-3/i.test(modelo) && PENSAR !== 'padrao' ? { thinkingConfig: { thinkingLevel: PENSAR } } : {};
    try { return await gemini0(); } catch (e) {
      const msg = (e as Error)?.message || String(e);
      // Nunca consumir o prazo inteiro numa tentativa só. Se restar tempo, passa ao próximo Flash.
      if ((sobrecarga(e) || sumiu(e) || msg === 'PRAZO') && i < reserva.length - 1 && resta() > 18_000) {
        console.warn('Gemini alternando modelo:', modelo, msg.slice(0, 130));
        continue;
      }
      if (msg === 'PRAZO') throw new Error('A IA demorou a responder. O relatório não foi perdido; tente novamente em instantes.');
      if (sumiu(e)) throw new Error('Os modelos Gemini de reserva não responderam. Confira a permissão dos modelos disponíveis na chave de API.');
      if (sobrecarga(e)) throw new Error('Os modelos Gemini estão temporariamente sem capacidade ou cota; tente novamente mais tarde.');
      throw e;
    }
  }
  throw new Error('A IA não respondeu.');
  async function gemini0() {
  const textoDe = (j: any) => (j?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
  const chamar = (comBusca: boolean) => {
    const body: any = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: opt.temp ?? 0.3, maxOutputTokens: 32768, ...pensar, ...(opt.json && !comBusca ? { responseMimeType: 'application/json' } : {}) },
    };
    if (comBusca) body.tools = [{ google_search: {} }];
    return post(body);
  };
  let r = await chamar(!!opt.search);
  // sem cota/permissão para busca na web (plano grátis): tenta de novo sem a busca
  if (!r.ok && opt.search) r = await chamar(false);
  // modelo que não aceita o ajuste de raciocínio: tenta sem ele
  if (!r.ok && r.status === 400 && pensar.thinkingConfig) {
    const t = await r.text();
    if (/thinking/i.test(t)) { delete (pensar as any).thinkingConfig; r = await chamar(false); }
    else throw new Error('Gemini 400: ' + t.slice(0, 600));
  }
  if (!r.ok) throw new Error('Gemini ' + r.status + ': ' + (await r.text()).slice(0, 600));
  const txt = textoDe(await r.json());
  if (!txt) throw new Error('Gemini não devolveu texto.');
  const parse = (x: string) => {
    const t = x.replace(/```json|```/g, '');
    return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  };
  try { return parse(txt); } catch { /* segue para o reparo */ }
  { const z = jsonTolerante(txt); if (z && typeof z === 'object') return z; } // conserto local: rápido e sem gastar cota
  // JSON torto ou cortado: pede ao modelo só para corrigir o formato (sem busca, sem inventar dados)
  if (resta() < 25_000) return { texto_bruto: txt }; // sem tempo para o reparo
  try {
    const rr = await post({
      contents: [{ role: 'user', parts: [{ text: 'O JSON abaixo está inválido ou foi cortado. Devolva SOMENTE o JSON corrigido e completo, sem texto fora dele e sem acrescentar dados novos:\n' + txt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 32768, ...pensar, responseMimeType: 'application/json' },
    });
    if (rr.ok) return parse(textoDe(await rr.json()));
  } catch { /* cai no texto bruto */ }
  return { texto_bruto: txt };
  }
}

// ---------- prompts ----------
const BASE =
  'Você é um analista de valores mobiliários credenciado CNPI-P pela Apimec, com 20 anos de buy side e sell side no Brasil e nos EUA, ' +
  'responsável por relatórios que passam pelo compliance da Resolução CVM 20/2021: independência, fundamentação e transparência sobre premissas e riscos. ' +
  'Escreve para um trader pessoa física experiente (opera WIN, ações e opções) que quer decisões objetivas, não teoria. ' +
  'Princípios: (1) dados antes de opinião: toda afirmação relevante cita o número fornecido que a sustenta; (2) separe FATO (dado), INTERPRETAÇÃO (sua leitura) e PROJEÇÃO (premissa); ' +
  '(3) nunca invente números, datas, resultados ou notícias: se um dado não veio, escreva "sem dado"; (4) gestão de risco acima de tudo: diga o que invalida a tese e onde; ' +
  '(5) seja específico: nada de "pode subir ou cair", dê níveis, condições e probabilidades qualitativas; (6) tom profissional, frases curtas, sem adjetivos de marketing. ' +
  'Responda SOMENTE com um objeto JSON válido, em português do Brasil, sem texto fora do JSON. Isto não é recomendação de investimento personalizada.';

const SYS_FUN =
  BASE + `
Escopo: ANÁLISE FUNDAMENTALISTA (não comente gráfico). Siga o roteiro de um relatório CNPI-P:
1. Negócio e tese: o que a empresa faz, de onde vem o lucro, vantagens competitivas (escala, custo, marca, regulação, rede) e a tese em 1 frase.
2. Qualidade: ROE versus custo de capital (use roe_menos_selic_pp quando vier), margens e sua tendência, conversão de lucro em caixa (fluxo de caixa operacional e livre), alavancagem (dívida líquida/EBITDA, dívida/PL) e liquidez corrente.
3. Crescimento: receita e lucro (anual e trimestral) e de onde viria o crescimento.
4. Valuation por mais de um método: múltiplos (P/L, P/L projetado, P/VP, EV/EBITDA, PEG) comparados ao que é típico do setor e à média histórica quando você souber (se não souber, diga); earnings yield e FCF yield contra a Selic (custo de oportunidade: premio_earnings_yield_sobre_selic_pp); e as referências de preço já calculadas pelo servidor em referencias_de_valuation (Graham, Bazin 6%, alvo médio dos analistas). Cite a conta que veio pronta; não refaça.
5. Dividendos: yield atual versus média de 5 anos, payout e se o fluxo de caixa livre sustenta o pagamento.
6. Governança e riscos: controle (estatal, familiar, pulverizado), histórico de alocação de capital, riscos regulatórios, de commodity, de câmbio e de juros. Para empresas brasileiras, relacione com Selic, juro real e câmbio do bloco "Macro".
7. Cenários otimista, base e pessimista com probabilidade (somando 100%), premissas e preço de referência de cada um. O preço de cada cenário tem que vir de uma conta explícita com dados fornecidos (ex.: LPA projetado × P/L-alvo). Se faltar dado para a conta, preço = null e explique.
   Com os cenários, o servidor calcula: PREÇO JUSTO = média dos preços ponderada pelas probabilidades; PREÇO-TETO para comprar = preço justo × (1 − margem de segurança: 15% qualidade ALTA, 20% MEDIA, 30% BAIXA). Zonas: preço atual ≤ teto = COMPRAR; entre teto e justo = MANTER (comprar só abaixo do teto); até 15% acima do justo = MANTER sem aumentar; acima disso = REDUZIR; acima de 30% do justo (15% se qualidade BAIXA) = VENDER. Escreva para_quem_tem e para_quem_nao_tem coerentes com essa regra.
8. Decisão por ativo: "para_quem_tem" (manter, aumentar, reduzir ou vender; se vier "posicao" com preço médio e peso, considere o resultado da posição e se o peso na carteira está alto, e diga em que preço realizar ou reforçar) e "para_quem_nao_tem" (comprar agora, esperar o preço-teto ou ficar de fora, e o que mudaria isso).
9. Resultados recentes e notícias: use a busca na web; cite período, data e fonte. Sem fonte verificável, "sem dado".
10. ANÁLISE DE BALANÇOS (roteiro do livro "Análise de Balanços", de Sérgio de Iudícibus). Use os números prontos de analise_de_balancos_numeros (calculados pelo servidor a partir dos balanços anuais); não recalcule e não invente conta que não veio.
   a) Conheça a empresa antes dos números: o que vende, como financia clientes e estoques, se tem estoque (serviços, bancos e seguradoras não têm: ignore os índices de estoque e de liquidez para bancos e diga isso).
   b) Análise horizontal (evolução no tempo, base 100 no primeiro ano) e vertical (quanto cada conta pesa na receita ou no ativo): mostre a tendência, não só o último ano.
   c) Liquidez (corrente, seca, imediata, geral): capacidade de pagar o curto prazo. Liquidez corrente abaixo de 1 indica capital circulante líquido negativo.
   d) Endividamento e estrutura de capital: capitais de terceiros sobre o patrimônio, quanto da dívida vence no curto prazo (composição), imobilização do patrimônio líquido e dos recursos não correntes, cobertura de juros.
   e) Rotatividade: giro do estoque, prazos médios de estocagem, recebimento e pagamento, posicionamento relativo (recebimento ÷ pagamento; abaixo de 1 é bom: recebe antes de pagar), ciclo operacional e ciclo financeiro (quanto tempo a empresa precisa financiar o giro).
   f) Rentabilidade desdobrada: retorno sobre o ativo = margem líquida × giro do ativo (diga qual dos dois puxa o retorno) e retorno sobre o patrimônio líquido.
   g) Alavancagem financeira: grau = retorno sobre o PL ÷ retorno operacional do ativo. Acima de 1 a dívida está trabalhando a favor do acionista; abaixo de 1, contra.
   h) Visão de conjunto (o mais importante): forme uma opinião, não um veredicto. Rentabilidade boa com liquidez ruim por muito tempo é pior do que as duas apenas razoáveis, porque os juros dos empréstimos para cobrir o aperto corroem o lucro (círculo vicioso). Se a rentabilidade está boa e a liquidez não, explique pelos prazos (rotatividade) e pela dívida. Compare com o que é típico do setor quando souber.
   i) Sinais de alerta: termômetro de insolvência de Kanitz (acima de 0 solvente; de 0 a −3 penumbra; abaixo de −3 insolvência), superexpansão (vendas crescendo muito mais rápido que o capital de giro), ciclo financeiro longo e cobertura de juros baixa.
   j) Limitações: são números contábeis do passado, anuais e resumidos; a inflação e as práticas contábeis distorcem comparações; o índice isolado não decide nada.
Formato:
{"relatorio":{
 "sumario_executivo":["contexto atual","tese (compra/venda/neutra) com o principal número que a sustenta","o que precisa acontecer para a tese se confirmar"],
 "contexto_macro":"(empresas brasileiras) Selic, juro real e câmbio: efeito sobre o setor e sobre o custo de oportunidade, citando os números do bloco Macro. Se o bloco Macro vier sem dado, comente o efeito do ciclo de juros sobre o setor sem citar números de Selic ou IPCA (nunca escreva só \"sem dado\")",
 "visao_geral":"(só se houver vários ativos) leitura da carteira",
 "concentracao":"(só se houver vários ativos) comentário de setor e peso",
 "resultados_recentes":{"ultimo_balanco":"","noticias_relevantes":[""]},
 "matriz_de_riscos":[{"risco":"","tipo":"operacional|macroeconômico|regulatório|governança","probabilidade":"baixa|média|alta","impacto":"baixo|médio|alto","gatilho":""}],
 "conclusao":{"recomendacao":"COMPRAR|MANTER|VENDER","preco_alvo":0.00,"horizonte":"12 meses","justificativa":"mostre a conta do preço-alvo (média ponderada dos cenários pela probabilidade) e a margem de segurança versus o preço atual","premissas":[""]},
 "ativos":[{"ticker":"","qualidade":"ALTA|MEDIA|BAIXA","valuation":"BARATO|JUSTO|CARO","resumo":"",
   "tese_de_investimento":"","vantagens_competitivas":"","rentabilidade_e_margens":"ROE x Selic, margens e tendência","endividamento_e_caixa":"dívida líquida/EBITDA, dívida/PL, liquidez, geração de caixa",
   "valuation_leitura":"múltiplos x setor/histórico e earnings yield x Selic","valuation_metodos":"Graham, Bazin, alvo dos analistas e múltiplo-alvo: o que cada um indica e qual faz mais sentido para este negócio",
   "dividendos":"yield x média 5 anos, payout, sustentabilidade","governanca":"","perspectivas_de_crescimento":"gatilhos de valorização","riscos_e_catalisadores":"",
   "cenarios":[{"cenario":"otimista","probabilidade_pct":25,"preco":0.00,"premissas":"conta e premissas"},{"cenario":"base","probabilidade_pct":50,"preco":0.00,"premissas":""},{"cenario":"pessimista","probabilidade_pct":25,"preco":0.00,"premissas":""}],
   "para_quem_tem":"","para_quem_nao_tem":"",
   "pontos_fortes":[""],"pontos_de_atencao":[""],
   "analise_de_balancos":{"horizontal_vertical":"tendência de receita, lucro e margens (base 100) e o peso das contas","liquidez":"","endividamento":"","rotatividade":"prazos médios e ciclo financeiro","rentabilidade_e_alavancagem":"margem × giro, ROE e grau de alavancagem","visao_de_conjunto":"opinião de conjunto em 3 a 5 frases","alertas":["Kanitz, superexpansão, ciclo, juros"]}}],
 "alertas":[""]}}
Regras: matriz_de_riscos com exatamente 3 riscos que invalidariam a tese. Em "ativos", um item por ticker recebido, com "ticker" igual ao informado. Para ativo avulso, omita visao_geral e concentracao. Cobertura de dados "baixa": diga isso no resumo e reduza a convicção. Empresas de commodities (mineração, petróleo, siderurgia, papel e celulose): comente o ciclo e use múltiplos sobre lucro normalizado com cautela.`;

const SYS_TEC =
  BASE + `
DEFINIÇÕES DO TRADER (use exatamente estas; são a forma como ele lê o gráfico):
- TENDÊNCIA DE ALTA = topos e fundos ascendentes (cada topo acima do anterior e cada fundo acima do anterior). TENDÊNCIA DE BAIXA = topos e fundos descendentes. TENDÊNCIA LATERAL = quando não há sequência de topos e fundos na mesma direção: o preço anda dentro de uma faixa (diga a faixa: do fundo ao topo). Uma alta só é quebrada quando o preço perde o último fundo; uma baixa, quando rompe o último topo.
- PIVÔ = o ativo rompe o topo anterior (pivô de alta, normalmente depois de fazer um fundo mais alto) ou perde o fundo anterior (pivô de baixa, depois de um topo mais baixo). "Armado" = o fundo mais alto (topo mais baixo) já se formou e falta romper o nível; "confirmado" = rompeu.
- PULLBACK = numa CORREÇÃO dentro da tendência de alta, o candle rompe a MÁXIMA do candle anterior (entrada de compra); no REPIQUE dentro da tendência de baixa, o candle perde a MÍNIMA do candle anterior (entrada de venda).
REGRAS DE MARTIN PRING (Análise Técnica Explicada), que o trader adota:
- A tendência é presumida em vigor até que o PESO DA EVIDÊNCIA prove que ela se inverteu. Não declare reversão por um único sinal.
- TOPO E FUNDO LEGÍTIMOS: a reação precisa devolver entre ~1/3 e 2/3 do movimento anterior (magnitude) ou durar ~1/3 a 2/3 do tempo dele (consolidação lateral). Oscilações menores são ruído e não contam (o servidor já filtrou assim). Use bom senso: 32% conta como 1/3.
- DILEMA DE TOPOS E FUNDOS (meio sinal): quando só uma das séries quebra (ex.: na alta, o preço perde o último fundo, mas a série de topos ascendentes continua), há só meio sinal de reversão (ponto X). A tendência continua classificada como a anterior; o sinal completo vem com topo mais baixo e perda do nível do ponto X (ponto Y). No meio sinal, só antecipe a reversão se o peso da evidência concordar (médias móveis, volume/OBV, momento/RSI); caso contrário, trate com ceticismo e diga ao trader para proteger o lucro (stop) em vez de virar a mão. Campo "dilema" da leitura_dow_do_trader.
- GRAUS DA TENDÊNCIA: mensal ≈ primária (9 meses a 2 anos), semanal ≈ intermediária (6 semanas a 9 meses), diário ≈ curto prazo (2 a 6 semanas). A importância de uma reversão depende da duração e da magnitude das ondas: reversão no mensal pesa muito mais que no diário.
- As SURPRESAS acontecem na direção da tendência principal (primária): operações contra ela têm movimentos menores e mais perdas. A tendência primária define o caráter das intermediárias e de curto prazo.
TEORIA DE DOW (Pring, cap. 3) — bloco "teoria_de_dow" dentro de leitura_dow_do_trader:
- Os preços descontam tudo; use fechamentos. O mercado tem três movimentos: primário (anos; bull/bear market), reações secundárias (3 semanas a meses, devolvem 1/3 a 2/3 do primário, muitas vezes ~50%) e movimentos menores (até 6 semanas, sem valor de previsão e mais sujeitos a manipulação). A tarefa mais difícil (e mais importante) é distinguir uma reação secundária válida da primeira perna de uma nova tendência primária: use "reacao_secundaria" (retração e duração).
- Fases da tendência primária de alta: 1ª acumulação (descrença), 2ª participação (melhora dos negócios), 3ª excesso e especulação. Na baixa: 1ª abandono das esperanças, 2ª piora dos lucros, 3ª liquidação/pânico. Reversões grandes são mais prováveis depois de uma 3ª fase marcada ("fase_da_tendencia_primaria" é uma estimativa; trate como tal).
- LINHAS: faixa estreita (~5%) por 3 semanas ou mais; rompimento para cima = acumulação, para baixo = distribuição ("linha_de_dow").
- VOLUME: o normal é crescer nas altas e encolher nas quedas; o contrário é aviso de reversão, mas só como evidência de fundo — quem confirma é o preço ("preco_e_volume").
- AS MÉDIAS DEVEM SE CONFIRMAR: para um ativo, compare com o índice do mercado ("confirmacao_pelo_indice"): movimento sem confirmação do índice tem mais risco. Quanto mais próximas as confirmações, mais forte o movimento.
- Dow diz a DIREÇÃO, não a duração nem o tamanho da tendência; uma tendência estabelecida vale até que a reversão seja provada.
FERRAMENTAS CLÁSSICAS (Flávio Lemos, "Análise técnica dos mercados financeiros", e Pring) — bloco "ferramentas_classicas" (diário e semanal), já calculado pelo servidor:
- FORÇA DA TENDÊNCIA (ADX de Wilder): abaixo de 20 = sem tendência (mercado de lado: sinais de média e rompimentos falham mais; prefira operar a faixa ou ficar de fora); 20 a 25 = zona cinzenta; acima de 25 = tendência forte, com +DI acima do −DI na alta e o contrário na baixa. Use o ADX para confirmar ou questionar a leitura de topos e fundos (ex.: alta pelos topos e fundos com ADX 15 = alta fraca).
- SUPORTES E RESISTÊNCIAS: são memória do mercado. Quanto mais toques, mais tempo, mais volume e mais recente, mais forte o nível. BIPOLARIDADE: rompido, o suporte vira resistência e a resistência vira suporte. Cite os níveis de "suportes_e_resistencias" em "zonas_de_interesse".
- LINHAS DE TENDÊNCIA (LTA pelos fundos ascendentes, LTB pelos topos descendentes): 2 toques traçam, o 3º confirma; quanto mais toques, mais longa e menos íngreme, mais importante. O rompimento da LTA/LTB é UM DOS PRIMEIROS sinais de mudança de tendência, mas só vale confirmado pelos filtros de Lemos: fechamento 3% além da linha (regra dos 3%) ou dois fechamentos seguidos do outro lado (regra dos 2 dias); use fechamentos, não o intraday. Linha muito íngreme rompida costuma dar consolidação, não reversão (Pring). O corte da linha de canal NÃO indica mudança de tendência.
- PIVÔ COM OBJETIVOS (Lemos, estratégias de pivô): pivô de alta = ponto 1 fundo, ponto 2 topo, ponto 3 fundo mais alto; formado quando rompe o ponto 2. Objetivos pela extensão de Fibonacci a partir do ponto 2: +61,8%, +100% e +161,8% do tamanho da onda 1 (ponto 2 − ponto 1). Invalida se perder o ponto 3. Pivô de baixa é o espelho. Use "pivo_objetivos_fibonacci" para os alvos do pivô do trader.
- MÉDIAS MÓVEIS: a mudança é dada pelo PREÇO cruzando a média (fechamento), não pela virada da média; para mais certeza, espere a média virar também. Cruzamento de ouro (MM50 acima da MM200) / da morte (abaixo): no método do diamante, a compra ideal é no recuo até a MM50 depois do cruzamento de ouro, e a venda no repique até a MM50 depois do da morte. Cruzamentos dão muitos sinais falsos sem tendência (ADX baixo). Cruzamento junto com rompimento de LTA/LTB ou de padrão reforça muito o sinal (Pring).
- MOMENTO (IFR, MACD): divergências só ALERTAM para perda de força; não são sinal de compra ou venda sem a confirmação do preço (rompimento de linha de tendência ou de topo/fundo). Quanto mais divergências seguidas, mais fraca a estrutura. Numa alta primária, sobrevenda no IFR é oportunidade e sobrecompra pode durar; numa baixa primária, o contrário. Sinal de momento contra a tendência principal tende a falhar.
- CANDLES: padrões de 1 e 2 candles (martelo, estrela cadente, engolfo, harami, doji, estrela da manhã/noite) têm efeito de CURTO prazo e só valem perto de suporte/resistência ou linha de tendência, e com confirmação nos 1 a 3 candles seguintes; marubozu com volume é a melhor confirmação de rompimento. Trate como "tons de cinza", não preto no branco.
- GAPS: o mercado tende a fechar gaps; gap aberto funciona como suporte/resistência.
- A "BENDITA CONFIRMAÇÃO" (Lemos): espere o candle FECHAR antes de considerar rompimento ou cruzamento; muitos falsos rompimentos acontecem com o candle ainda em formação.
- STOPS (Lemos, cap. 17): stop técnico um pouco além do suporte/fundo (compra) ou da resistência/topo (venda), longe do número redondo (ex.: 9,97 e não 10,00), com folga para a volatilidade (ATR); evite stop apertado demais (zigue-zague). Defina stop de PREÇO e de TEMPO antes de entrar. Use "stops_tecnicos".
- RISCO E GESTÃO (Lemos, cap. 18 e 22): relação retorno/risco de 3:1; arriscar no máximo 1% do capital de risco por operação; no objetivo, realizar ao menos metade e subir o stop para o zero a zero; nunca mudar o plano com o mercado aberto; nunca fazer preço médio em posição perdedora; deixe o lucro correr e corte a perda rápido; em tendência de alta, ou está comprado ou está fora; compre força e venda fraqueza; só opere quando as análises apontarem na mesma direção. Use essas regras em "gestao" e nos cenários.
ONDAS DE ELLIOTT (Pring, apêndice) — bloco "ondas_de_elliott": o mercado sobe em 5 ondas (1, 3, 5 de impulso; 2 e 4 corretivas) e corrige em 3 (a, b, c), com proporções de Fibonacci. O servidor só aceita contagens que respeitam as regras (onda 2 não passa do início da 1; onda 3 nunca é a menor; onda 4 não entra na onda 1) e dá alvos e o nível que invalida. Pring adverte que Elliott é subjetivo e deve ter PESO PEQUENO: cite a contagem possível em "tendencia" (uma ou duas frases, com o nível de invalidação) só como complemento; nunca use Elliott sozinho como gatilho nem contra a leitura de topos e fundos.
O servidor já aplicou essas definições em "leitura_dow_do_trader" (mensal, semanal e diário: tendência, motivo com os topos e fundos, faixa lateral, pivô e pullback com o nível do gatilho). Use essa leitura como a tendência principal de cada tempo. As médias móveis do bloco "multitempo" são confirmação: se as médias disserem uma coisa e os topos e fundos outra, explique a divergência e dê prioridade aos topos e fundos. Em "multitempo", "tendencia", "gatilhos" e "zonas_de_interesse", fale em pivô e pullback com estes significados e com os níveis fornecidos.
Escopo: ANÁLISE TÉCNICA (não comente fundamentos), com leitura TOP-DOWN em três tempos gráficos:
1. MENSAL define a tendência primária (o "mapa"), SEMANAL a tendência intermediária (a "rota") e DIÁRIO o ponto de entrada (o "gatilho"). Use o bloco "multitempo" calculado pelo servidor: tendência, médias (mensal 6 e 12; semanal 10 e 40; diário 20 e 50), inclinação da média rápida, RSI14, estrutura de topos e fundos e posição na faixa do período.
2. Alinhamento: operações a favor do tempo maior têm prioridade. Se "alinhamento" for DIVERGENTE, diga qual tempo manda e por quê (ex.: correção dentro de alta primária = compra em suporte; repique dentro de baixa primária = venda em resistência). Se LATERAL, trate como faixa (comprar suporte, vender resistência) ou fique de fora.
3. Teoria de Dow e estrutura: topos e fundos, rompimentos e pullbacks. Volume confirma o movimento? (volume_vs_media20, OBV). RSI: zona, e se o RSI diário contradiz a tendência maior.
4. Níveis: pivôs diários (operação de 1 dia) e semanais (swing), médias e extremos; confluências entre eles têm mais peso. ATR14 mede o ruído: stop menor que ~1 ATR é ruído.
5. Plano: use plano_calculado. O usuário só aceita risco/retorno de pelo menos 3:1 e o principal erro dele é tirar o stop: deixe claro onde o stop técnico fica e o que acontece se for atingido.
6. O usuário opera OS DOIS LADOS (compra e venda/vendido). Para cada ativo, escreva o GATILHO de compra e o de venda, mesmo que um deles vá contra o viés: que preço ou evento confirma a entrada (rompimento com fechamento acima/abaixo de um nível fornecido, pullback que segura num suporte/resistência fornecido, perda de uma média), em qual tempo gráfico olhar o candle de confirmação, e se o lado está a favor ou contra a tendência maior (contra = operação curta e mão reduzida). Use só níveis fornecidos.
7. ESTUDO QUANTITATIVO (bloco "estudo_quantitativo", calculado pelo servidor sobre até 10 anos de candles diários do próprio ativo, como um analista quantitativo faria em Python/Pandas). Use-o para dar base estatística a cada afirmação:
   - "estudos_de_setups": para cada sinal, o retorno 5/10/20 pregões depois de todas as vezes que ele apareceu no histórico do ativo. Compare SEMPRE com "taxa_base_qualquer_dia": só diga que um setup tem vantagem se a mediana e o % de positivos forem melhores que a taxa base. Dê destaque aos sinais com "ativo_hoje": true. Se "amostra_pequena": true, diga que a evidência é fraca.
   - "posicao" e "regime": se o preço está esticado (percentil da distância à MM200 acima de 90 ou abaixo de 10, z-score além de ±2), em que ponto da faixa de 52 semanas está, e se a volatilidade está alta ou comprimida para o padrão do ativo (isso muda o tamanho do stop).
   - "simulacao_dos_planos": em quantas vezes do histórico (na mesma tendência de hoje) o alvo veio antes do stop e a expectativa em R. Expectativa negativa = o plano perde dinheiro no longo prazo, mesmo com risco/retorno bonito; diga isso com clareza.
   - "regra_obv_do_trader" (REGRA DO USUÁRIO, obrigatória): ele só entra no rompimento de topo (compra) ou de fundo (venda) se o OBV também tiver feito o pivô (fundo mais alto na compra, topo mais baixo na venda) e romper o topo/fundo dele JUNTO com o preço ou ANTES do preço. Em "forca_e_volume" diga, com base em "hoje", se a regra está atendida agora para compra e para venda (OBV já rompeu antes do preço = volume antecipando; preço rompeu sem o OBV = rompimento sem volume, a regra manda NÃO entrar). Use "compra"/"venda" para mostrar, com números, se neste ativo a regra filtrou rompimentos ruins: compare regra_completa_pivo_e_obv_rompendo com obv_nao_confirmou (retorno a favor e rompimento_falso_pct). Se a regra não melhorou os resultados neste ativo, diga isso com honestidade. Nos "gatilhos" de compra e venda, inclua a condição do OBV.
   - "sazonalidade": comente só se o padrão for forte (positivos acima de 70% ou abaixo de 30% em 8 anos ou mais).
   Escreva o campo "estatistica" (4 a 7 frases) com os números do estudo (citando o tamanho da amostra) e use-os também em "resumo", "gatilhos" e nos cenários. Nunca invente estatística que não esteja no bloco; passado não garante futuro.
REGRA DE OURO: todos os números (indicadores, multitempo, pivôs, níveis, confluências e plano_calculado) foram calculados e validados pelo servidor. NÃO recalcule, não estime indicadores e não crie preços ou níveis fora dos dados. Cite os valores fornecidos sem alterá-los. Campo null = "sem dado".
O servidor escreve sozinho os campos numéricos (pivos_diarios, pivos_semanais, plano_de_trade com entrada/stop/alvos/risco_retorno e preco_alvo) e coloca os números de indicadores no começo de "indicadores" e "forca_e_volume". Nesses campos, escreva só a leitura qualitativa, sem repetir os números.
Formato:
{"relatorio":{
 "sumario_executivo":["tendência primária (mensal) e intermediária (semanal)","tese para o diário (alta/baixa/neutra) e o gatilho","o nível que invalida"],
 "visao_geral":"(só se houver vários ativos)",
 "matriz_de_riscos":[{"risco":"","tipo":"técnico|macroeconômico|evento","probabilidade":"baixa|média|alta","impacto":"baixo|médio|alto","gatilho":"nível que invalida"}],
 "conclusao":{"recomendacao":"COMPRAR|MANTER|VENDER","preco_alvo":0.00,"horizonte":"","justificativa":"alvo técnico baseado nos níveis","premissas":[""]},
 "ativos":[{"ticker":"","vies":"ALTA|BAIXA|NEUTRO","resumo":"",
   "multitempo":{"mensal":"tendência primária, médias, estrutura e onde está na faixa","semanal":"","diario":"","leitura_top_down":"como os três se combinam e qual tempo manda agora"},
   "tendencia":"curto, médio e longo prazo","pivos_diarios":"","pivos_semanais":"",
   "confluencias":"níveis diários e semanais próximos","indicadores":"RSI, médias, ATR","forca_e_volume":"RSI, OBV, volume",
   "zonas_de_interesse":"suportes, resistências, pontos de entrada e saída com valores fornecidos",
   "gatilhos":{"compra":"condição exata de entrada comprada (nível fornecido, candle de confirmação e tempo gráfico)","venda":"condição exata de entrada vendida"},
   "plano_de_trade":{"entrada":"","stop":"","alvo_1":"","alvo_2":"","risco_retorno":"","invalidacao":""},"cenario_alta":"gatilho, níveis e alvo","cenario_baixa":"gatilho, níveis e alvo","estatistica":"o que o histórico do próprio ativo diz (estudo_quantitativo), com números e amostra"}],
 "alertas":[""]}}
Um item por ticker recebido, com "ticker" igual ao informado. matriz_de_riscos com exatamente 3 itens.
Plano de trade: o plano numérico vem pronto em plano_calculado (compra e venda). Não o refaça. Em plano_de_trade escreva apenas "invalidacao" (texto): o que precisa acontecer, usando níveis fornecidos, para a tese perder a validade, e comente se o plano calculado está a favor do tempo maior. Se plano_calculado não atingir 3:1, o viés for NEUTRO ou o diário estiver contra o mensal, diga em "invalidacao" qual nível fornecido precisa ser rompido ou testado para surgir um setup.`;

const PEDE_PLANO_TEC = (p: any, fibo: any, nPrints: number) =>
  'PLANO DO TRADER (Fibonacci que ele mesmo desenhou' + (nPrints ? `; os ${nPrints} print(s) dele estão anexados acima` : '') + '): ' + JSON.stringify({ lado: p.lado, entrada: p.entrada, stop: p.stop, alvos: p.alvos, risco_retorno_por_alvo: p.rr, risco_pct: p.risco_pct }) +
  (fibo ? '\nLeitura anterior do desenho: ' + JSON.stringify(fibo) : '') +
  '\nComo analista técnico sênior (CNPI-T, 20 anos de mesa), faça uma análise profissional desse Fibonacci e desse plano, cruzando com os dados calculados (tendência e médias de 20/50/200 nos 3 tempos, estrutura de topos e fundos, RSI, ATR, volume, níveis e confluências). Seja direto e honesto: se o setup for fraco, diga. ' +
  'Inclua no item do ativo o campo "plano_do_trader": {"leitura_do_fibonacci":"de qual fundo/topo até qual topo/fundo o Fibonacci foi puxado, em que tempo gráfico, se a pernada escolhida é a relevante e quais níveis (38,2/50/61,8/78,6 e extensões 127,2/161,8) importam aqui","confluencias":"onde os níveis do Fibonacci coincidem com médias, topos/fundos anteriores, pivôs ou zonas de volume (cite os números)","contexto_multitempo":"o plano está a favor ou contra a tendência do mensal e do semanal","entrada":"se a entrada está num nível que faz sentido e qual gatilho de confirmação esperar (candle, tempo gráfico, volume)","stop":"se o stop está protegido por estrutura e cabe no ATR (quantos ATRs)","alvos":"se os alvos são realistas frente às resistências/suportes no caminho","gestao":"parcial, onde mover o stop para o zero a zero, quando desistir","nota_do_setup":"A|B|C (A = alta qualidade)","probabilidade":"baixa|média|alta, baseada na simulacao_dos_planos do plano do trader (cite: em N simulações o alvo 1 veio antes do stop em X% e a expectativa é Y R)","a_favor":[""],"contra":[""],"ajuste_sugerido":"um ajuste concreto com números, ou \\"nenhum\\"","conclusao":"1 a 2 frases: vale ou não executar e em que condição"}. Não refaça um plano próprio; analise o do trader.';
const PEDE_PLANO_FUN = (p: any, fibo: any, nPrints: number) =>
  'PLANO DO INVESTIDOR (marcado por ele no gráfico' + (nPrints ? `; os ${nPrints} print(s) dele estão anexados acima` : '') + '): ' + JSON.stringify({ lado: p.lado, entrada: p.entrada, stop: p.stop, alvos: p.alvos, risco_retorno_por_alvo: p.rr }) +
  (fibo ? '\nLeitura anterior do desenho: ' + JSON.stringify(fibo) : '') +
  '\nComo analista fundamentalista sênior (CNPI, 20 anos de buy side), avalie esse plano à luz dos fundamentos e do valuation calculados (preço justo dos cenários, preço-teto com margem de segurança, Graham, Bazin, alvo dos analistas, DY, qualidade do negócio). ' +
  'Inclua no item do ativo o campo "plano_do_investidor": {"entrada_x_valor":"a entrada está abaixo, perto ou acima do preço-teto e do preço justo; qual a margem de segurança nesse preço (cite os números)","alvos_x_valor":"os alvos fazem sentido frente ao preço justo, ao cenário otimista e ao alvo dos analistas","stop_x_tese":"o stop faz sentido para uma tese fundamentalista ou é curto demais/longo demais","dividendos_no_caminho":"quanto de proventos se espera receber no horizonte, se aplicável","horizonte":"prazo coerente para o plano","nota_do_plano":"A|B|C","a_favor":[""],"contra":[""],"ajuste_sugerido":"um ajuste concreto com números, ou \\"nenhum\\"","conclusao":"1 a 2 frases"}.';
const SYS_FIBO =
  BASE + `
Escopo: o trader mandou até 3 prints do gráfico (mensal, semanal e diário) de um ativo e marcou um Fibonacci (retração e/ou extensão) no ponto onde vê uma oportunidade.
Leia SOMENTE o que está visível: os níveis do Fibonacci com os preços escritos ao lado (0%, 23,6%, 38,2%, 50%, 61,8%, 78,6%, 100%, 127,2%, 161,8% etc.), o eixo de preços e o último preço.
Monte o plano que esse desenho indica: lado (COMPRA se o Fibonacci foi puxado de um fundo para um topo e o preço está recuando; VENDA no caso contrário), entrada (o nível de retração onde o trader espera entrar, normalmente 50% ou 61,8%, ou o preço atual se ele já estiver lá), stop (além do nível 100% / do fundo ou topo de origem, ou o nível que o trader marcou como stop) e alvos (extensões 127,2% / 161,8% ou o topo/fundo anterior; até 3, em ordem).
Se houver linhas horizontais ou textos marcados como "stop", "entrada" ou "alvo", eles têm prioridade. Use o print com Fibonacci; se houver mais de um, use o do menor tempo gráfico para a entrada e confira com os maiores.
Não invente preço que não dá para ler: se algum nível estiver ilegível, deixe null e explique em "avisos".
Formato:
{"lado":"COMPRA|VENDA","entrada":0.00,"stop":0.00,"alvos":[0.00],"tempo_grafico_usado":"diário|semanal|mensal","niveis_lidos":[{"nivel":"61,8%","preco":0.00}],"preco_atual_lido":0.00,"explicacao":"2 a 4 frases: de onde até onde o Fibonacci foi puxado e por que esses pontos","confianca":"alta|media|baixa","avisos":[""]}`;

const SYS_IMG =
  BASE + `
Escopo: leia a imagem de um gráfico (print/foto). Descreva só o que é visível; se algo estiver ilegível, registre em "limitacoes". Se houver dados calculados, use-os para complementar.
Formato:
{"relatorio":{"ativo_lido":"","timeframe_lido":"","vies":"ALTA|BAIXA|NEUTRO","resumo":"","tendencia":"","estrutura":"","suportes":[""],"resistencias":[""],"padroes":[""],"indicadores_visiveis":"","cenario_alta":"","cenario_baixa":"","limitacoes":[""]}}`;

const SYS_POS =
  BASE + `
Escopo: revisar POSIÇÕES ABERTAS do usuário (stop, alvos, risco e vencimentos). Use somente os dados fornecidos: cada posição traz entrada, stop, alvos, quantidade e, quando houver, dados de mercado calculados (preço atual, ATR14, médias, RSI, pivôs) e "calculos" já feitos (r_aberto, dist_stop_pct, dist_alvos_pct, dias_para_vencer). Sem dado de mercado, avalie só pela estrutura informada e escreva "sem dado" onde faltar o preço atual.
Regras: não invente preços. Avalie o stop contra o ATR14 (stop muito curto é ruído; muito longo foge do plano) e contra pivôs e médias fornecidos. Em opções, comprado perde no máximo o prêmio; lançado tem risco maior; olhe os dias para vencer.
Formato:
{"relatorio":{
 "sumario_executivo":["visão geral do risco aberto","o que exige ação hoje","o que pode esperar"],
 "posicoes":[{"id":"","ativo":"","situacao":"NO ALVO|PERTO DO STOP|EM ANDAMENTO|VENCENDO|SEM DADO","stop":"avaliação do stop","alvos":"distância e viabilidade dos alvos","vencimento":"(só opções) dias e risco de tempo","acao_sugerida":"MANTER|REDUZIR|ENCERRAR|AJUSTAR STOP|ROLAR","novo_stop":"valor numérico ou sem dado","justificativa":""}],
 "alertas":[""]}}
Um item por posição recebida, com "id" e "ativo" iguais aos informados.`;

// ---------- Giro: histórico para a leitura técnica (guardado por 1 hora) ----------
let cGiroH: { ts: number; v: Record<string, { d: Vela[]; m: number | null }> } | null = null;
async function giroTecnica(q: { k: string; px: number | null }[]): Promise<string[]> {
  const L: [string, string, string, number][] = [['ibov', '^BVSP', 'Ibovespa', 0], ['sgx', 'TIO=F', 'Minério de ferro SGX', 2], ['brent', 'BZ=F', 'Petróleo Brent', 2], ['dolar', 'BRL=X', 'Dólar', 4], ['spx', '^GSPC', 'S&P 500', 0], ['vale', 'VALE3.SA', 'VALE3', 2], ['petr', 'PETR4.SA', 'PETR4', 2]];
  if (!cGiroH || Date.now() - cGiroH.ts > 3600_000) {
    const v: Record<string, { d: Vela[]; m: number | null }> = {};
    await Promise.all(L.map(async ([k, sym]) => {
      const [d, mm] = await Promise.all([candlesYahoo(sym, 'US', '1d', '5y'), k === 'ibov' || k === 'spx' ? candlesYahoo(sym, 'US', '1mo', 'max') : Promise.resolve(null)]);
      if (d && d.length > 60) v[k] = { d: d as Vela[], m: mm && mm.length ? Math.max(...mm.map((c) => c[2])) : null };
    }));
    cGiroH = { ts: Date.now(), v };
  }
  const out: string[] = [];
  for (const [k, , n, dec] of L) {
    const h = cGiroH.v[k]; if (!h) continue;
    const ult = h.d[h.d.length - 1][4], vivo = q.find((x) => x.k === k)?.px;
    const px = vivo && Math.abs(vivo / ult - 1) < 0.15 ? vivo : ult; // cotação de outra fonte muito diferente do histórico (outro contrato): fica com o histórico
    const t = leituraTecnica(n, h.d, px, h.m, dec); if (t) out.push(t);
  }
  return out;
}

// ---------- coleta por ativo ----------
// ---------- WIN/WDO (mini índice e mini dólar): histórico do Ibovespa e do dólar, na escala do Profit quando ele está ligado ----------
const FUT_RE = /^(WIN|IND|WDO|DOL)/;
async function profitPreco(uid: string | null | undefined, raiz: string): Promise<number | null> {
  if (!uid || !SB || !SB_SVC) return null;
  try {
    const r = await fetch(`${SB}/rest/v1/cotacoes?select=ticker,ult,updated_at&user_id=eq.${uid}&ticker=like.${raiz}*&order=updated_at.desc&limit=5`, { headers: svc(), signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const rows = await r.json();
    const ok = (Array.isArray(rows) ? rows : []).find((x: any) => typeof x.ult === 'number' || (typeof x.ult === 'string' && +x.ult > 0));
    if (!ok || Date.now() - Date.parse(ok.updated_at) > 3 * 86400e3) return null; // até o último pregão (fim de semana incluso)
    const v = +ok.ult; return v > 0 ? v : null;
  } catch { return null; }
}
async function candlesFuturo(tk: string, uid?: string | null) {
  const dol = /^(WDO|DOL)/.test(tk), sym = dol ? 'BRL=X' : '^BVSP', mult = dol ? 1000 : 1;
  const [D, W, M, px] = await Promise.all([
    candlesYahoo(sym, 'US', '1d', '10y'), candlesYahoo(sym, 'US', '1wk', '10y'), candlesYahoo(sym, 'US', '1mo', 'max'),
    profitPreco(uid, dol ? 'WDO' : 'WIN').then((v) => v ?? profitPreco(uid, dol ? 'DOL' : 'IND')),
  ]);
  if (!D || D.length < 30) throw new Error('sem histórico do ' + (dol ? 'dólar' : 'Ibovespa'));
  const ultimo = D[D.length - 1][4] * mult;
  // fator: o futuro tem prêmio sobre o à vista; com o preço do Profit, todo o histórico vai para a escala do contrato
  const fator = px && Math.abs(px / ultimo - 1) < 0.08 ? px / ultimo : 1;
  const conv = (cs: Candle[] | null) => cs ? cs.map((c) => [c[0], +(c[1] * mult * fator).toFixed(2), +(c[2] * mult * fator).toFixed(2), +(c[3] * mult * fator).toFixed(2), +(c[4] * mult * fator).toFixed(2), c[5]] as Candle) : null;
  const aviso = (fator !== 1
    ? `${tk}: histórico do ${dol ? 'dólar à vista (BRL=X × 1000)' : 'Ibovespa à vista'} ajustado para a escala do contrato pelo preço do Profit (${px}); prêmio do futuro de ${((fator - 1) * 100).toFixed(2)}%.`
    : `${tk}: análise feita em ${dol ? 'pontos do dólar à vista (BRL=X × 1000)' : 'pontos do Ibovespa à vista'}; o contrato tem um prêmio sobre o à vista, então confira os níveis no Profit (ligue a ponte do Profit para a conversão automática).`)
    + (dol ? ' O dólar não tem volume no histórico: OBV e preço×volume não valem aqui.' : '');
  return { d: { cs: conv(D)!, preco: px && fator !== 1 ? px : +(ultimo * fator).toFixed(2), moeda: dol ? 'BRL' : 'pts', nome: tk }, W: conv(W), M: conv(M), aviso, idx: dol ? 'DX-Y.NYB' : '^GSPC', idxNome: dol ? 'índice do dólar (DXY)' : 'S&P 500' };
}

async function coletaTec(tk: string, mk: string, uid?: string | null) {
  if (FUT_RE.test(tk)) return coletaTecFut(tk, mk, uid);
  // semanal 10 anos e mensal desde o início: dá para as médias de 20, 50 e 200 em todos os tempos.
  // diário do Yahoo (2 anos) completa quando a brapi devolve menos de 200 candles (plano grátis) — sem ele não há SMA200.
  const idxNome = mk === 'BR' ? 'Ibovespa' : 'S&P 500';
  const [d, W, M, Dy, IW] = await Promise.all([
    mk === 'BR' ? candlesBR(tk) : candlesUS(tk),
    candlesYahoo(tk, mk, '1wk', '10y'), candlesYahoo(tk, mk, '1mo', 'max'), candlesYahoo(tk, mk, '1d', '10y'),
    candlesYahoo(mk === 'BR' ? '^BVSP' : '^GSPC', 'US', '1wk', '5y'), // índice para a confirmação de Dow
  ]);
  return montaTec(tk, mk, d, W, M, Dy, IW, idxNome, []);
}
async function coletaTecFut(tk: string, mk: string, uid?: string | null) {
  const f = await candlesFuturo(tk, uid);
  const IW = await candlesYahoo(f.idx, 'US', '1wk', '5y');
  // diário completo (até 10 anos) já vem do Yahoo: indicadores usam 2 anos, como nas ações
  const Dy = f.d.cs;
  const d = { ...f.d, cs: Dy.slice(-500) }; // ~2 anos de pregões
  return montaTec(tk, mk, d, f.W, f.M, Dy, IW, f.idxNome, [f.aviso]);
}
function montaTec(tk: string, mk: string, d: { cs: Candle[]; preco: number; moeda: string; nome?: string }, W: Candle[] | null, M: Candle[] | null, Dy: Candle[] | null, IW: Candle[] | null, idxNome: string, avisos0: string[]) {
  if (d.cs.length < 210 && Dy && Dy.length > d.cs.length) {
    // usa o histórico do Yahoo até o dia anterior ao primeiro candle da brapi e emenda os candles da brapi (mais atuais)
    const ini = d.cs[0][0];
    const doisAnos = new Date(Date.now() - 2 * 366 * 86400e3).toISOString().slice(0, 10); // como antes: só 2 anos para os indicadores
    d.cs = [...Dy.filter((c) => c[0] < ini && c[0] >= doisAnos), ...d.cs];
  }
  if (d.cs.length < 30) throw new Error('histórico curto');
  // histórico longo (até 10 anos de diário) só para o estudo quantitativo: Yahoo até antes do 1º candle atual + candles atuais
  const qcs = Dy && Dy.length > d.cs.length ? [...Dy.filter((c) => c[0] < d.cs[0][0]), ...d.cs] : d.cs;
  const calc = calculosTecnicos(d.cs, d.preco, hoje());
  const mtf = multitempo(d.cs, W, M);
  const Wu = W && W.length >= 20 ? W : agrega(d.cs, 'W'), Mu = M && M.length >= 12 ? M : agrega(d.cs, 'M');
  let dow: any = null; try { dow = dowTempos(d.cs, Wu, Mu); } catch { /* sem leitura de Dow */ }
  // teoria de Dow (Pring, cap. 3) e ondas de Elliott (apêndice): cada parte isolada, para um erro não derrubar a análise
  const tenta = <T,>(f: () => T): T | null => { try { return f(); } catch { return null; } };
  if (dow) dow.teoria_de_dow = {
    linha_de_dow: tenta(() => linhaDow(d.cs)), preco_e_volume: tenta(() => precoVolume(d.cs)),
    reacao_secundaria: { semanal: tenta(() => reacaoSecundaria(Wu, true)), diario: tenta(() => reacaoSecundaria(d.cs, false)) },
    fase_da_tendencia_primaria: tenta(() => fasePrimaria(Mu)), confirmacao_pelo_indice: tenta(() => confirmacaoIndice(idxNome, IW, Wu)),
  };
  const elliott = tenta(() => elliottTempos(d.cs, Wu));
  const classicos = tenta(() => classicosTempos(d.cs, Wu)); // Flávio Lemos e Pring: ADX, MACD, divergências, S/R, LTA/LTB, pivô, candles, gaps e stops
  const res = {
    tk, mk, moeda: d.moeda, preco_atual: d.preco,
    ind: calc.ind, pivos: calc.pivos, niveis: calc.niveis, confluencias: calc.confluencias, plano: calc.plano, validacao: calc.validacao, mtf, dow, elliott, classicos,
    candles: d.cs.slice(-90), // o app desenha os últimos 45
    // gráficos de candles do PDF (estilo TradingView): diário, semanal e mensal, com médias de 20, 50 e 200
    graficos: { D: grafico(d.cs, 130), W: grafico(W && W.length >= 20 ? W : agrega(d.cs, 'W'), 110), M: grafico(M && M.length >= 12 ? M : agrega(d.cs, 'M'), 120) },
    avisos: [...avisos0, ...(d.cs.length < 200 ? ['histórico menor que 200 candles: SMA200 indisponível'] : [])],
  };
  // histórico longo fica fora do JSON (não vai para o app nem para o Gemini; só o estudo quantitativo usa)
  Object.defineProperty(res, 'qcs', { value: qcs, enumerable: false, configurable: true });
  Object.defineProperty(res, 'qM', { value: M, enumerable: false, configurable: true });
  return res;
}
// Yahoo devolve ROE, margens, yield etc. como fração (0,18 = 18%). Para o Gemini convertemos tudo para % explícito.
function fundPct(f: any) {
  const o: any = { ...f };
  ['roe', 'roa', 'margem_liquida', 'margem_bruta', 'margem_ebitda', 'margem_operacional', 'crescimento_receita', 'crescimento_lucro', 'crescimento_lucro_trimestral', 'dividend_yield', 'payout']
    .forEach((k) => { if (k in o) { o[k + '_pct'] = typeof o[k] === 'number' ? +(o[k] * 100).toFixed(2) : null; delete o[k]; } });
  return o;
}
const UNIDADES = 'Unidades: campos terminados em _pct estão em % (18,5 = 18,5%); divida_pl_pct também está em % (45 = 45%); pl, p_vp, ev_ebitda e div_liq_ebitda são múltiplos (vezes); valores monetários na moeda do ativo; null = sem dado (não estime nem busque outro valor para ele). P/L, P/VP, EV/EBITDA, dividend yield e payout já foram conferidos pelo código (preço ÷ dado por ação; dividendos = proventos pagos em 12 meses); notas_dos_dados explica as correções feitas: respeite-as (ex.: em banco não comente EBITDA nem dívida/EBITDA).';
async function coletaFun(tk: string, mk: string) {
  const y = await yahoo(tk, mk);
  return { tk, mk, cobertura: y.cobertura, fund: y.f };
}

// ---------- Supabase (auth, limite diário e cache) ----------
const SB = Deno.env.get('SUPABASE_URL') || '';
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SB_SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LIMITE = +(Deno.env.get('LIMITE_DIARIO') || 30); // análises por usuário por dia
const svc = (x: Record<string, string> = {}) => ({ apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC, 'Content-Type': 'application/json', ...x });

// confirma que o token é de um usuário logado (a chave anônima sozinha não passa)
async function usuario(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tk || !SB) return null;
  try {
    const r = await fetch(SB + '/auth/v1/user', { headers: { apikey: SB_ANON || SB_SVC, Authorization: 'Bearer ' + tk } });
    if (!r.ok) return null;
    const j = await r.json();
    if (j?.id) {
      const id = String(j.id);
      EMAILS.set(id, String(j?.email || '').toLowerCase());
      if (j.email_confirmed_at) EMAILS_CONFIRMADOS.set(id, String(j.email || '').toLowerCase().trim());
      else EMAILS_CONFIRMADOS.delete(id);
    }
    return j && j.id ? String(j.id) : null;
  } catch { return null; }
}
// Limite por pessoa: o dono confirmado é isento; demais contas mantêm a cota configurada.
const EMAILS = new Map<string, string>();
const EMAILS_CONFIRMADOS = new Map<string, string>();
const DONO = (Deno.env.get('DONO_EMAIL') || '').toLowerCase().trim(), LIM_OUTROS = Deno.env.get('LIMITE_OUTROS');
// Conta privada autorizada: comparar somente o e-mail confirmado pelo Supabase Auth.
const DONO_EMAIL_SHA256 = '2ff0db9763be138adec7e1ea4c1bde6022e2c54ec93cf49f480b0e2afcf8f1a2';
const donoSemLimite = async (email: string): Promise<boolean> => {
  const normalizado = email.toLowerCase().trim();
  if (!normalizado) return false;
  if (DONO && normalizado === DONO) return true;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizado));
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  return hash === DONO_EMAIL_SHA256;
};
const limiteDe = (email: string) => (DONO && LIM_OUTROS != null && LIM_OUTROS !== '' && email && email !== DONO ? Math.max(0, +LIM_OUTROS || 0) : LIMITE);
// Uso privado: uma indisponibilidade nunca libera chamadas de IA sem limite.
async function usoHoje(uid: string): Promise<number> {
  const r = await fetch(`${SB}/rest/v1/analise_uso?select=id&uid=eq.${uid}&dia=eq.${hoje()}`, {
    headers: svc({ Prefer: 'count=exact', Range: '0-0' }), signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error('O controle de uso da IA está indisponível. Tente novamente em instantes.');
  const match = /\/(\d+)$/.exec(r.headers.get('content-range') || '');
  if (!match) throw new Error('Não foi possível confirmar o uso diário da IA.');
  return +match[1];
}
async function reservaUso(uid: string, modo: string, limite: number): Promise<boolean> {
  if (!SB || !SB_SVC) throw new Error('O controle de uso da IA não está configurado.');
  const r = await fetch(`${SB}/rest/v1/rpc/analise_reservar_uso`, {
    method: 'POST', headers: svc(), signal: AbortSignal.timeout(5000),
    body: JSON.stringify({ p_uid: uid, p_dia: hoje(), p_modo: modo, p_limite: limite }),
  });
  if (!r.ok) throw new Error('O controle de uso da IA está indisponível. Nenhuma análise nova foi iniciada.');
  const result = await r.json();
  if (typeof result !== 'boolean') throw new Error('Resposta inválida do controle de uso da IA.');
  return result;
}
async function cacheGet(chave: string): Promise<{ dia: string; dados: any } | null> {
  if (!SB || !SB_SVC) return null;
  try {
    const r = await fetch(`${SB}/rest/v1/analise_cache?select=dia,dados&chave=eq.${encodeURIComponent(chave)}&limit=1`, { headers: svc() });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j[0] ? j[0] : null;
  } catch { return null; }
}
async function cachePut(chave: string, dados: any) {
  if (!SB || !SB_SVC) return;
  try {
    await fetch(`${SB}/rest/v1/analise_cache?on_conflict=chave`, { method: 'POST', headers: svc({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify({ chave, dia: hoje(), dados }) });
    if (Math.random() < 0.05) { // limpeza ocasional: guarda só os últimos 10 dias
      const lim = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10);
      await fetch(`${SB}/rest/v1/analise_cache?dia=lt.${lim}&chave=neq.macro:ultimo`, { method: 'DELETE', headers: svc() });
      await fetch(`${SB}/rest/v1/analise_uso?dia=lt.${lim}`, { method: 'DELETE', headers: svc() });
    }
  } catch { /* sem tabela */ }
}
const fmtDia = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);
const idadeDias = (d: string) => Math.round((Date.parse(hoje() + 'T00:00:00Z') - Date.parse(d + 'T00:00:00Z')) / 864e5);

// fundamentos do dia ficam guardados; se o Yahoo falhar, usa o último guardado (até 7 dias) e avisa
async function coletaFunCache(tk: string, mk: string, avisos: string[], mac: Macro | null = null) {
  const r = await coletaFunCache0(tk, mk, avisos);
  const val: any = referencias(r.fund, mk === 'BR' ? mac : null);
  const h: any = (r as any).hist, px = r.fund && r.fund.preco;
  if (h && typeof h.bazin_media5 === 'number' && h.bazin_media5 > 0 && px) {
    const v = h.bazin_media5 / 0.06;
    val.bazin_6pct = { valor: +v.toFixed(2), conta: `média dos proventos de 5 anos ${h.bazin_media5.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ 6%`, upside_pct: +((v / px - 1) * 100).toFixed(1) };
  }
  return { ...r, val };
}
async function coletaFunCache0(tk: string, mk: string, avisos: string[]) {
  const chave = `fund4:${mk}:${tk}`; // fund3 = fundamentos conferidos (coerencia.ts) + histórico e checklist
  const c = await cacheGet(chave);
  const nota = (n: string[] | undefined) => (n || []).forEach((x) => avisos.push(`${tk}: ${x}`));
  if (c && c.dia === hoje() && c.dados && c.dados.f && c.dados.hist?.versao_dados_financeiros === 2 && typeof c.dados?.consultado_ms === 'number' && Date.now() - c.dados.consultado_ms < 2 * 3600_000) { nota(c.dados.notas); return { tk, mk, cobertura: c.dados.cobertura, fund: c.dados.f, hist: c.dados.hist || null }; }
  try {
    const y = await yahoo(tk, mk);
    let hist: any = null;
    try { hist = await historico(tk, mk, y.f); } catch { /* histórico é opcional */ }
    await cachePut(chave, { cobertura: y.cobertura, f: y.f, notas: y.notas, hist, consultado_ms: Date.now() });
    nota(y.notas);
    return { tk, mk, cobertura: y.cobertura, fund: y.f, hist };
  } catch (e) {
    if (c && c.dados && c.dados.f && idadeDias(c.dia) <= 7) {
      avisos.push(`${tk}: Yahoo indisponível agora; usando os dados guardados de ${fmtDia(c.dia)}`);
      return { tk, mk, cobertura: c.dados.cobertura, fund: c.dados.f, hist: c.dados.hist || null };
    }
    throw e;
  }
}


// ---------- carteira (v279): relatórios individuais e consolidados, salvos com rastreabilidade ----------
const MODELO_CART = modeloAtual(Deno.env.get('GEMINI_MODEL_CARTEIRA') || MODELO);
const CART_MAX_DIA = +(Deno.env.get('CARTEIRA_MAX_DIA') || 15); // relatórios individuais automáticos por dia
async function relUltimo(uid: string, tipo: string, tk?: string) {
  if (!SB || !SB_SVC) return null;
  try { const r = await fetch(`${SB}/rest/v1/carteira_relatorios?select=*&user_id=eq.${uid}&tipo=eq.${tipo}${tk ? '&tk=eq.' + encodeURIComponent(tk) : ''}&order=gerado.desc&limit=1`, { headers: svc() }); if (!r.ok) return null; const j = await r.json(); return j && j[0] ? j[0] : null; } catch { return null; }
}
async function relUltimosAtivos(uid: string) {
  if (!SB || !SB_SVC) return [];
  try { const r = await fetch(`${SB}/rest/v1/carteira_relatorios?select=tk,gerado,ref,conteudo,validacao,dados&user_id=eq.${uid}&tipo=eq.ativo&order=gerado.desc&limit=80`, { headers: svc() }); if (!r.ok) return []; const L = await r.json(); const vistos = new Set<string>(); return (L || []).filter((x: any) => { if (vistos.has(x.tk)) return false; vistos.add(x.tk); return true; }); } catch { return []; }
}
async function relSalva(row: any) {
  if (!SB || !SB_SVC) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para salvar o relatório.');
  const r = await fetch(`${SB}/rest/v1/carteira_relatorios`, { method: 'POST', headers: svc({ Prefer: 'return=representation' }), body: JSON.stringify(row) });
  if (!r.ok) { const t = await r.text(); throw new Error(r.status === 404 || /carteira_relatorios/.test(t) ? 'Rode o arquivo carteira.sql no Supabase (tabela carteira_relatorios).' : 'Não salvei o relatório: ' + t.slice(0, 160)); }
  return (await r.json())[0];
}
async function cartCfg(uid: string) {
  if (!SB || !SB_SVC) return null;
  try { const r = await fetch(`${SB}/rest/v1/carteira_cfg?select=cfg,estado,atualizado&user_id=eq.${uid}&limit=1`, { headers: svc() }); if (!r.ok) return null; const j = await r.json(); return j && j[0] ? j[0] : null; } catch { return null; }
}
async function cartEstado(uid: string, estado: any) {
  if (!SB || !SB_SVC) return;
  try { await fetch(`${SB}/rest/v1/carteira_cfg?user_id=eq.${uid}`, { method: 'PATCH', headers: svc({ Prefer: 'return=minimal' }), body: JSON.stringify({ estado }) }); } catch { /* sem tabela */ }
}
const limpaItem = (o: any): ItemCart & { prox?: string | null; px_manual?: number | null; primeira?: string | null } => ({
  tk: String(o?.tk || '').toUpperCase().replace(/[^A-Z0-9.\- ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30), mk: ['BR', 'US', 'CR'].includes(o?.mk) ? o.mk : 'BR', cl: String(o?.cl || 'acao').slice(0, 12),
  q: +o?.q || 0, pm: +o?.pm || 0, nome: String(o?.nome || '').slice(0, 80), setor: String(o?.setor || '').slice(0, 60), regiao: String(o?.regiao || '').slice(0, 20),
  moeda: o?.moeda === 'USD' ? 'USD' : 'BRL', prov: +o?.prov || 0, prox: /^\d{4}-\d{2}-\d{2}$/.test(String(o?.prox || '')) ? String(o.prox) : null,
  px_manual: +o?.px_manual > 0 ? +o.px_manual : null, primeira: /^\d{4}-\d{2}-\d{2}$/.test(String(o?.primeira || '')) ? String(o.primeira) : null,
});
const CL_NOME: Record<string, string> = { acao: 'ação brasileira', fii: 'fundo imobiliário (FII)', etf: 'ETF brasileiro', bdr: 'BDR', acao_ext: 'ação internacional', etf_ext: 'ETF internacional', cripto: 'criptomoeda', rf: 'renda fixa', tesouro: 'Tesouro Direto', outro: 'outro ativo' };
async function velasDe(it: ItemCart, range = '2y') {
  const sym = simboloY(it.tk, it.mk, it.cl); if (!sym) return null;
  return candlesYahoo(sym.replace(/\.SA$/, ''), sym.endsWith('.SA') ? 'BR' : 'US', '1d', range);
}
async function coletaAtivo(it: any, mac: Macro | null) {
  const fam = familia(it.cl), fontes: string[] = [], lacunas: string[] = [], avisos: string[] = [];
  const cs = await velasDe(it); const tec = resumoTecnico(cs);
  if (tec) fontes.push('Yahoo Finance: cotações diárias (2 anos)'); else if (fam !== 'rf') lacunas.push('sem histórico de cotações');
  let fund: any = null, hist: any = null, val: any = null, cob: any = null;
  if ((fam === 'acao' || fam === 'fii') && it.mk !== 'CR') {
    try { const f = await coletaFunCache(it.tk, it.mk === 'BR' ? 'BR' : 'US', avisos, mac); fund = f.fund; hist = (f as any).hist; val = (f as any).val; cob = f.cobertura; fontes.push('Yahoo Finance: fundamentos e balanços'); }
    catch (e) { lacunas.push('fundamentos indisponíveis: ' + (e as Error).message.slice(0, 80)); }
  }
  let news: any[] = [];
  if (fam !== 'rf') { try { const q = it.mk === 'BR' || it.cl === 'cripto' ? `${it.tk}${it.nome ? ' OR "' + it.nome.split(/\s+/).slice(0, 2).join(' ') + '"' : ''}` : `${it.tk} stock`; const r = await fetch(urlNoticias(q), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) }); if (r.ok) { news = leRSSNoticias(await r.text(), 6); fontes.push('Google Notícias (7 dias)'); } } catch { /* sem notícias */ } if (!news.length) lacunas.push('sem notícias recentes encontradas'); }
  if (mac && (fam === 'acao' || fam === 'fii')) fontes.push('Banco Central: Selic e IPCA');
  const fundOut = fam === 'acao' ? { ...fundPct(fund || {}), cobertura: cob, referencias_de_valuation: val, roic: 'sem dado', evolucao_receita_lucro: hist ? hist.receita_lucro : 'sem dado',
      balancos_trimestrais_disponiveis: hist?.trimestres || [],
      data_ultimo_trimestre_na_fonte: hist?.ultimo_trimestre || null,
      moeda_contabil: hist?.moeda_contabil || fund?.moeda_contabil || 'não confirmada',
      nota_periodo: 'Exercícios anuais até 2025 não substituem os resultados trimestrais de 2026. Dados trimestrais do Yahoo são fonte secundária, não comprovação por CVM/RI.',
      dividend_yield_por_ano: hist ? (hist.dy_anos || []).slice(-6) : 'sem dado' }
    : fam === 'fii' ? { dividend_yield_pct: fund && typeof fund.dividend_yield === 'number' ? +(fund.dividend_yield * 100).toFixed(2) : 'sem dado', p_vp: fund?.p_vp ?? 'sem dado', preco: fund?.preco ?? null, dividend_yield_por_ano: hist ? (hist.dy_anos || []).slice(-6) : 'sem dado', nota: 'FII: lucro, margens e endividamento de empresa não se aplicam' }
    : `não se aplica a ${CL_NOME[it.cl] || it.cl}`;
  if (fam === 'acao' && !fund) lacunas.push('sem fundamentos');
  if (fam === 'acao' && !hist?.ultimo_trimestre) lacunas.push('Trimestre contábil mais recente não confirmado pela fonte; consultar resultado oficial no RI/CVM.');
  if (fam === 'fii') lacunas.push('Relatório gerencial mensal oficial do FII não consultado; DY e P/VP do Yahoo não confirmam o último informe.');
  return { fam, cs, tec, fund, fundOut, news, fontes, lacunas, avisos, dados_em: tec ? tec.ate : null };
}
async function relAtivo(uid: string, it: any, o: { force?: boolean; ate: number; origem: string; mac: Macro | null; lim?: ((m: string) => Promise<Response | null>) | null }) {
  const C = await coletaAtivo(it, o.mac), ant = await relUltimo(uid, 'ativo', it.tk);
  const trimestreMarcador = C.fundOut?.balancos_trimestrais_disponiveis?.slice(0, 3).map((q: any) => [q.periodo, q.receita, q.lucro].join(':')).join('|') || null;
  const marca = { ...marcaDe(C.tec, C.fund, C.news, it.prox || null, new Date().toISOString()), balanco: trimestreMarcador };
  const dec = precisaAtualizar(ant?.meta?.marca || null, marca, hoje());
  if (ant && ant.prompt_ver === PROMPT_VER_ATIVO && !o.force && !dec.sim) return { reaproveitado: true, row: ant, motivos: ['sem mudança relevante desde ' + String(ant.ref).split('-').reverse().join('/')] };
  if (o.lim) { const l = await o.lim('carteira'); if (l) throw new Error('Limite diário de análises atingido. Tente amanhã.'); }
  const antResumo = ant ? { data: ant.ref, resumo: ant.conteudo?.resumo_executivo, tendencias: ant.conteudo?.tecnica?.tendencias, hipoteses: [...(ant.conteudo?.resumo_executivo?.hipoteses || []), ...(ant.conteudo?.tecnica?.hipoteses || []), ...(ant.conteudo?.fundamentos?.hipoteses || [])].slice(0, 6), monitorar: ant.conteudo?.monitorar, marca_anterior: ant.meta?.marca } : null;
  const valor = C.tec && it.q ? it.q * (C.tec.preco || it.pm) : null;
  const dados = {
    hoje: hoje(), identificacao: { ticker: it.tk, nome: it.nome || null, classe: CL_NOME[it.cl] || it.cl, mercado: it.mk === 'BR' ? 'B3' : it.mk === 'CR' ? 'cripto' : 'EUA', moeda: it.cl === 'cripto' ? 'USD (cotação do Yahoo)' : it.moeda || 'BRL', setor: it.setor || null },
    posicao: it.q ? { quantidade: it.q, preco_medio: it.pm, custo_total: +(it.q * it.pm).toFixed(2), valor_atual: valor != null ? +valor.toFixed(2) : null, resultado_pct: C.tec && it.pm > 0 && it.cl !== 'cripto' ? +((C.tec.preco! / it.pm - 1) * 100).toFixed(2) : null, proventos_recebidos: it.prov || 0, primeira_compra: it.primeira || null } : 'ativo da watchlist (sem posição)',
    tecnico: C.tec || 'sem dado', fundamentos: C.fundOut, noticias: C.news.length ? C.news : 'sem notícias encontradas', proximo_resultado: it.prox || 'sem dado',
    macro: C.fam === 'acao' || C.fam === 'fii' ? o.mac : 'não usado', motivos_da_atualizacao: dec.motivos, avisos_dos_dados: C.avisos, RELATORIO_ANTERIOR: antResumo,
  };
  const or0 = IA_CONTA.openrouter;
  const j = await gemini(SYS_ATIVO, [{ text: `Relatório individual de ${it.tk}. DADOS (JSON):\n${JSON.stringify(dados)}` }], { json: true, model: MODELO_CART, ate: o.ate, temp: 0.2 });
  const rel = normalizaAtivo(j);
  if (!rel.resumo_executivo.fatos.length && !rel.tecnica.fatos.length) throw new Error('A IA não respondeu o relatório de ' + it.tk);
  const modelo = IA_CONTA.openrouter > or0 ? 'OpenRouter ' + (OR_ULTIMO || '') : MODELO_CART;
  const row = await relSalva({ user_id: uid, tipo: 'ativo', tk: it.tk, ref: hoje(), fontes: C.fontes, dados_em: C.dados_em, modelo, prompt_ver: PROMPT_VER_ATIVO, validacao: validaRelatorio(rel, dados, C.lacunas), meta: { marca, motivos: dec.motivos, origem: o.origem, classe: it.cl, familia: C.fam }, conteudo: rel, dados: { tecnico: C.tec, fundamentos: C.fundOut, noticias: C.news, posicao: dados.posicao } });
  return { reaproveitado: false, row, motivos: dec.motivos };
}
async function relConsolidado(uid: string, itens: any[], metricasApp: any, o: { ate: number; origem: string; mac: Macro | null; lim?: ((m: string) => Promise<Response | null>) | null; reaproveitados?: string[] }) {
  const ativos = itens.filter((x) => x.q > 0);
  if (!ativos.length) throw new Error('Carteira sem posições.');
  const velas: Record<string, any> = {}, px: Record<string, number | null> = {}, fontes = new Set<string>(['Yahoo Finance: cotações diárias']);
  const [fxV, ibov] = await Promise.all([candlesYahoo('BRL=X', 'US', '1d', '1mo'), candlesYahoo('^BVSP', 'US', '1d', '1y')]);
  const fx = fxV && fxV.length ? +fxV[fxV.length - 1][4].toFixed(4) : null;
  await Promise.all(ativos.map(async (it) => { const v = await velasDe(it, '1y').catch(() => null); velas[it.tk] = v; const ult = v && v.length ? v[v.length - 1][4] : null; px[it.tk] = it.cl === 'cripto' ? (ult != null && fx ? ult * fx : it.px_manual) : (ult ?? it.px_manual ?? null); }));
  const m = metricasCarteira(ativos.map((it) => (it.cl === 'cripto' ? { ...it, moeda: 'BRL' } : it)), px, fx, velas, ibov);
  // Consolidado não deve depender exclusivamente dos textos individuais salvos: consulta os últimos trimestres da fonte.
  const balancosRecentes = await Promise.all(ativos.filter((a: any) => familia(a.cl) === 'acao').map(async (a: any) => {
    try {
      const q = await coletaFunCache(a.tk, a.mk === 'BR' ? 'BR' : 'US', [], o.mac);
      return { ticker: a.tk, periodo: q.hist?.ultimo_trimestre || null,
        moeda: q.hist?.moeda_contabil || q.fund?.moeda_contabil || null,
        dados_trimestrais: (q.hist?.trimestres || []).slice(0, 3),
        fonte: 'Yahoo Finance; conferência com CVM/RI não efetuada' };
    } catch { return { ticker: a.tk, periodo: null, moeda: null, dados_trimestrais: [],
      fonte: 'indisponível; não presumir atualização do balanço' }; }
  }));
  const indiv = (await relUltimosAtivos(uid)).filter((r: any) => ativos.some((a) => a.tk === r.tk)).map((r: any) => ({ tk: r.tk, data: r.ref, validacao: r.validacao?.estado, tendencias: r.conteudo?.tecnica?.tendencias, resumo: (r.conteudo?.resumo_executivo?.fatos || []).slice(0, 2), interpretacao: (r.conteudo?.resumo_executivo?.interpretacoes || []).slice(0, 1), riscos: (r.conteudo?.riscos?.fatos || []).slice(0, 2), fundamentos: (r.conteudo?.fundamentos?.fatos || []).slice(0, 5), fundamentos_interpretacao: (r.conteudo?.fundamentos?.interpretacoes || []).slice(0, 5), dados_fundamentais: r.dados?.fundamentos || null, reavaliar: r.conteudo?.reavaliar,
      trimestre_salvo: r.dados?.fundamentos?.data_ultimo_trimestre_na_fonte || null }));
  // Um consolidado novo não deve tratar a interpretação antiga como fundamentação atual se a fonte trimestral mudou.
  const trimestralPorAtivo = new Map(balancosRecentes.map((b: any) => [b.ticker, b]));
  for (const r of indiv) {
    const atual: any = trimestralPorAtivo.get(r.tk);
    if (atual?.periodo && r.trimestre_salvo !== atual.periodo) {
      r.fundamentos = [];
      r.fundamentos_interpretacao = [];
      r.resumo = [];
      r.dados_fundamentais = null;
      r.validacao_periodo = 'DESATUALIZADO: fonte possui trimestre '+atual.periodo+' não presente no relatório individual';
    } else if (!atual?.periodo && trimestralPorAtivo.has(r.tk)) {
      r.validacao_periodo = 'SEM CONFIRMAÇÃO DE TRIMESTRE ATUAL; interpretar fundamentos com cautela';
    } else r.validacao_periodo = 'trimestre compatível com fonte, NÃO verificado por RI/CVM';
  }
  const lacunas: string[] = [];
  if (m.sem_preco.length) lacunas.push('sem cotação (usando preço médio): ' + m.sem_preco.join(', '));
  const sem = ativos.filter((a) => familia(a.cl) !== 'rf' && !indiv.some((r: any) => r.tk === a.tk)).map((a) => a.tk); if (sem.length) lacunas.push('sem relatório individual: ' + sem.join(', '));
  if (!fx && ativos.some((a) => a.moeda === 'USD' || a.cl === 'cripto')) lacunas.push('sem cotação do dólar');
  for (const b of balancosRecentes) if (!b.periodo) lacunas.push(b.ticker + ': demonstração trimestral recente não confirmada.');
  for (const r of indiv) if (r.validacao_periodo?.startsWith('DESATUALIZADO')) lacunas.push(r.tk + ': análise anterior omitida, por divergência de período contábil.');
  const ant = await relUltimo(uid, 'consolidado');
  const dados = { hoje: hoje(), metricas: m, metricas_do_app: metricasApp && typeof metricasApp === 'object' ? metricasApp : 'sem dado', relatorios_individuais: indiv, balancos_trimestrais_da_fonte: balancosRecentes, lacunas_de_balancos: lacunas, macro: o.mac || 'sem dado', ativos_sem_mudanca_relevante: o.reaproveitados || [],
    RELATORIO_ANTERIOR: ant ? { data: ant.ref, resumo: ant.conteudo?.resumo_executivo, riscos: ant.conteudo?.riscos, hipoteses: [...(ant.conteudo?.resumo_executivo?.hipoteses || []), ...(ant.conteudo?.conclusao?.hipoteses || []), ...(ant.conteudo?.riscos?.hipoteses || [])].slice(0, 6), metricas: ant.dados?.metricas ? { patrimonio_brl: ant.dados.metricas.patrimonio_brl, resultado_pct: ant.dados.metricas.resultado_pct, concentracao: ant.dados.metricas.concentracao, volatilidade_anual_pct: ant.dados.metricas.volatilidade_anual_pct, beta_ibov: ant.dados.metricas.beta_ibov } : null } : null };
  if (balancosRecentes.some((x) => x.periodo)) fontes.add('Yahoo Finance: séries trimestrais; CVM/RI pendente');
  if (o.mac) fontes.add('Banco Central: Selic e IPCA'); if (indiv.length) fontes.add('relatórios individuais salvos'); if (metricasApp) fontes.add('rentabilidade calculada pelo app (movimentações)');
  if (o.lim) { const l = await o.lim('carteira'); if (l) throw new Error('Limite diário de análises atingido. Tente amanhã.'); }
  const or0 = IA_CONTA.openrouter;
  const j = await gemini(SYS_CONS, [{ text: `Relatório consolidado da carteira. DADOS (JSON):\n${JSON.stringify(dados)}` }], { json: true, model: MODELO_CART, ate: o.ate, temp: 0.2 });
  const rel = normalizaCons(j);
  if (!rel.resumo_executivo.fatos.length) throw new Error('A IA não respondeu o relatório consolidado.');
  const modelo = IA_CONTA.openrouter > or0 ? 'OpenRouter ' + (OR_ULTIMO || '') : MODELO_CART;
  return relSalva({ user_id: uid, tipo: 'consolidado', tk: null, ref: hoje(), fontes: [...fontes], dados_em: ibov && ibov.length ? ibov[ibov.length - 1][0] : null, modelo, prompt_ver: PROMPT_VER_CONS, validacao: validaRelatorio(rel, dados, lacunas), meta: { origem: o.origem, ativos: ativos.map((a) => a.tk), reaproveitados: o.reaproveitados || [] }, conteudo: rel, dados: { metricas: m, metricas_do_app: dados.metricas_do_app, balancos_trimestrais_da_fonte: balancosRecentes } });
}
// ---------- relatório em lotes (carteiras grandes não estouram o tempo da função) ----------
const LOTE = 4;
const SYS_SINT = (tec: boolean) => BASE + `
Escopo: consolidar a análise ${tec ? 'técnica' : 'fundamentalista'} de uma carteira cujos ativos já foram analisados um a um (resumos abaixo). Use SOMENTE esses resumos e os pesos fornecidos; não crie dados novos${tec ? '' : ' e não faça busca'}.
Formato:
{"relatorio":{"sumario_executivo":["contexto","tese","principais drivers"],"visao_geral":"leitura da carteira",${tec ? '' : '"concentracao":"comentário de setor e peso",'}"matriz_de_riscos":[{"risco":"","tipo":"","probabilidade":"baixa|média|alta","impacto":"baixo|médio|alto","gatilho":""}],"conclusao":{"recomendacao":"COMPRAR|MANTER|VENDER","preco_alvo":null,"horizonte":"","justificativa":"","premissas":[""]},"alertas":[""]}}
matriz_de_riscos: exatamente 3 itens. Em carteira, preco_alvo é null.`;
const grupos = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function relatorioEmLotes(tec: boolean, dados: any[], cab: string, modelo: string, erros: string[], lotes: { n: number }, ate: number, extras: any[] = []) {
  const sys = tec ? SYS_TEC : SYS_FUN;
  lotes.n = 1;
  if (dados.length <= LOTE) return await gemini(sys, [...extras, { text: cab + JSON.stringify(dados) }], { json: true, search: !tec, model: modelo, ate });
  const gs = grupos(dados, LOTE);
  lotes.n = gs.length;
  const parciais = await Promise.all(gs.map(async (g, i) => {
    try {
      const nota = `LOTE ${i + 1} de ${gs.length}: analise SOMENTE os ${g.length} ativos abaixo; "ativos" deve conter apenas eles. As seções gerais serão consolidadas depois, então seja breve nelas.\n`;
      const r = await gemini(sys, [{ text: cab.replace('\nDados:\n', '\n' + nota + 'Dados:\n') + JSON.stringify(g) }], { json: true, search: !tec, model: modelo, ate });
      return r.relatorio || r;
    } catch (e) { erros.push(`lote ${i + 1}: ${(e as Error).message}`); return null; }
  }));
  const ok = parciais.filter(Boolean) as any[];
  if (!ok.length) throw new Error(erros[erros.length - 1] || 'Falha em todos os lotes');
  const ativosIA = ok.flatMap((r) => (Array.isArray(r.ativos) ? r.ativos : []));
  const resumos = ativosIA.map((a: any) => tec
    ? { ticker: a.ticker, vies: a.vies, resumo: a.resumo }
    : { ticker: a.ticker, qualidade: a.qualidade, valuation: a.valuation, resumo: a.resumo, pontos_de_atencao: a.pontos_de_atencao });
  const alertas = [...new Set(ok.flatMap((r) => (Array.isArray(r.alertas) ? r.alertas : [])))];
  let sint: any = {};
  try {
    const pesos = cab.split('\nData de hoje:')[0];
    const r = await gemini(SYS_SINT(tec), [{ text: pesos + '\nResumo por ativo:\n' + JSON.stringify(resumos) + '\nAlertas levantados nos lotes:\n' + JSON.stringify(alertas) }], { json: true, search: false, model: MODELO_TEC, ate });
    sint = r.relatorio || r;
  } catch (e) { erros.push('consolidação: ' + (e as Error).message); }
  const rel: any = { ...sint, ativos: ativosIA, alertas: [...new Set([...(Array.isArray(sint.alertas) ? sint.alertas : []), ...alertas])] };
  if (!tec) {
    const rr = ok.map((r) => r.resultados_recentes).filter(Boolean);
    rel.resultados_recentes = {
      ultimo_balanco: rr.map((x: any) => x.ultimo_balanco).filter(Boolean).join(' | '),
      noticias_relevantes: [...new Set(rr.flatMap((x: any) => (Array.isArray(x.noticias_relevantes) ? x.noticias_relevantes : [])))],
    };
  }
  return { relatorio: rel };
}

const SYS_EST =
  BASE + `
Escopo: interpretar ESTATÍSTICAS DE TRADES do próprio usuário (diário de trader). Todos os números abaixo foram calculados e validados pelo código do app: NÃO recalcule, não estime e não invente números. Cite os valores exatamente como vieram. Se faltar dado, escreva "sem dado". Amostra pequena (menos de 30 trades) exige cautela explícita.
Base teórica: expectativa em R, SQN e gestão de risco (Van Tharp). Foque em comportamento e processo, sem prometer resultado.
Formato:
{"relatorio":{
  "leitura_geral":["2 a 4 frases sobre o que os números dizem"],
  "pontos_fortes":[{"tema":"","evidencia":"número fornecido","por_que_importa":""}],
  "pontos_de_melhoria":[{"tema":"","evidencia":"número fornecido","acao":"ação concreta e mensurável"}],
  "padroes_de_comportamento":["ex.: saída antecipada, horário ruim, overtrading, quebra de regras"],
  "plano_proximos_20_trades":["regras objetivas e mensuráveis"],
  "alertas":[""]}}
Cada item de pontos_de_melhoria deve apontar para um diagnóstico ou número fornecido.`;

// ---------- handler ----------
Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out0 = mkOut(cors);
  // registro de erros: toda resposta com erro (menos login, limite e pedido inválido) fica guardada para o Status do app
  let modoAtual = '', cronAtual = false;
  const out = (o: any, st = 200) => {
    try { if (o && typeof o === 'object' && o.erro && modoAtual && !/Entre na sua conta|Limite diário|liberadas só para o dono|inválid|Método não permitido/i.test(String(o.erro))) { const p = erroLog(modoAtual + (o.parte ? ':' + o.parte : ''), String(o.erro), cronAtual); const er = (globalThis as any).EdgeRuntime; if (er?.waitUntil) er.waitUntil(p); } } catch { /* nada */ }
    return out0(o, st);
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'analise', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ erro: 'Método não permitido' }, 405);
  // o giro automático vem da função notificar, com o segredo do agendador (CRON_SECRET), sem usuário
  const CRONS = Deno.env.get('CRON_SECRET') || '', cs = req.headers.get('x-cron-secret') || '';
  const doCron = !!CRONS && cs.length === CRONS.length && [...cs].reduce((a, c, i) => a | (c.charCodeAt(0) ^ CRONS.charCodeAt(i)), 0) === 0;
  const uid = doCron ? null : await usuario(req);
  if (SB && !uid && !doCron) return out({ erro: 'Entre na sua conta de novo (Mais → Conta).' }, 401);
  let b: any;
  try { b = await req.json(); } catch { return out({ erro: 'JSON inválido' }, 400); }
  modoAtual = String(b?.modo || '').slice(0, 30); cronAtual = doCron;
  const gerado = new Date().toISOString();
  const ate = Date.now() + PRAZO_MS;
  // limite diário por usuário (só conta quando o Gemini vai ser chamado)
  const limite = async (modo: string) => {
    if (!uid || await donoSemLimite(EMAILS_CONFIRMADOS.get(uid) || '')) return null;
    const lim = limiteDe(EMAILS.get(uid) || '');
    if (!(await reservaUso(uid, modo, lim))) return out({ erro: lim === 0 ? 'As análises com IA estão liberadas só para o dono do app.' : `Limite diário de ${lim} análises atingido. Tente amanhã.` }, 429);
    return null;
  };

  try {
    // ----- Fibonacci marcado nos prints do trader -----
    if (b.modo === 'fibo') {
      const imgs = (Array.isArray(b.imgs) ? b.imgs : []).filter((x: any) => x && typeof x.data === 'string' && x.data.length > 100).slice(0, 3);
      if (!imgs.length) return out({ erro: 'Mande pelo menos um print com o Fibonacci marcado.' }, 400);
      if (imgs.some((x: any) => x.data.length > 3_000_000)) return out({ erro: 'Print grande demais. Tire um print menor.' }, 413);
      { const lim = await limite('imagem'); if (lim) return lim; }
      const tk = String(b.tk || '').trim().toUpperCase().slice(0, 12);
      const parts: any[] = [];
      imgs.forEach((x: any) => { parts.push({ text: `Print do gráfico ${String(x.tf || '').slice(0, 10) || 'sem tempo informado'}:` }); parts.push({ inline_data: { mime_type: x.mime === 'image/png' ? 'image/png' : 'image/jpeg', data: x.data } }); });
      parts.push({ text: `Ativo: ${tk || 'não informado'}. Leia o Fibonacci marcado e devolva o plano.` });
      const r: any = await gemini(SYS_FIBO, parts, { json: true, model: MODELO_TEC, ate });
      const plano = normalizaPlano(r);
      return out({ ia: 'Gemini', modelo: MODELO_TEC, gerado, leitura: r, plano });
    }

    // ----- Giro do mercado: pré-abertura, meio do pregão e fechamento (um texto por janela, igual para todos) -----
    if (doCron && !['giro', 'jornal', 'plantao', 'carteira_auto'].includes(b.modo)) return out({ erro: 'Não autorizado' }, 401);
    // ----- coach: resumo do dia e relatório da semana (dados vêm do app) -----
    if (b.modo === 'coach') {
      const per = b.periodo === 'semana' ? 'semana' : b.periodo === 'mes' ? 'mes' : 'dia', dados = b.dados && typeof b.dados === 'object' ? b.dados : null;
      const txt = dados ? JSON.stringify(dados) : '';
      if (!txt || txt.length > 120_000) return out({ erro: dados ? 'Dados demais para o resumo.' : 'Sem dados para resumir.' }, 400);
      { const lim = await limite('coach'); if (lim) return lim; }
      const m = Deno.env.get('GEMINI_MODEL_GIRO') || (await modelosReserva().catch(() => [] as string[]))[0] || MODELO;
      const r = await gemini(SYS_COACH, [{ text: `Período: ${per === 'dia' ? 'o dia de hoje' : per === 'mes' ? 'o mês inteiro (fechamento mensal). Compare "este_mes" com "mes_anterior": diga o que melhorou e o que piorou, com números, e no "plano" dê até 4 focos para o próximo mês' : 'a semana (segunda a sexta)'}. Data: ${hoje()}.\nDados do trader (JSON):\n${txt}` }], { json: true, model: m, ate });
      return out({ periodo: per, gerado, ...coachNormaliza(r) });
    }
    // ----- uso de hoje (contador no app) -----
    if (b.modo === 'erros') {
      const ont = new Date(Date.parse(hoje() + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10);
      const [a, c] = await Promise.all([cacheGet(`erros:${hoje()}`), cacheGet(`erros:${ont}`)]);
      return out0({ erros: [...(a?.dados?.L || []), ...(c?.dados?.L || [])].slice(0, 60) });
    }
    if (b.modo === 'uso' && uid && await donoSemLimite(EMAILS_CONFIRMADOS.get(uid) || '')) return out({hoje:0,limite:'∞',ilimitado:true,dono:true,contagem_disponivel:false});
    if (b.modo === 'uso') { const n = uid ? await usoHoje(uid) : null; return out({ hoje: n ?? 0, limite: limiteDe(uid ? EMAILS.get(uid) || '' : ''), dono: !DONO || (!!uid && EMAILS.get(uid) === DONO) }); }
    // ----- diagnóstico da IA: modelos e um teste curto -----
    if (b.modo === 'diag') {
      const res = await modelosReserva().catch(() => [] as string[]), mGiro = Deno.env.get('GEMINI_MODEL_GIRO') || res[0] || MODELO;
      // as duas IAs são testadas ao mesmo tempo (a função tem 150 s no total)
      const orP = (async () => {
        if (!OR_KEY) return { chave: false };
        const t1 = Date.now();
        try { const ms = await orModelos(); const r: any = await orChat('Responda só com o JSON {"ok":true}.', 'teste', { json: true, ate: Date.now() + 70_000, porModelo: 20_000 }); return { chave: true, modelos: ms, teste: (r?.ok ? 'respondeu' : 'respondeu (formato diferente)') + ' com ' + String(OR_ULTIMO || '').split('/').pop(), ms: Date.now() - t1 }; }
        catch (e) { return { chave: true, modelos: await orModelos().catch(() => []), teste: 'erro: ' + String((e as Error).message).slice(0, 400), ms: Date.now() - t1 }; }
      })();
      const t0 = Date.now(); let ping = '';
      try { const r: any = await geminiG('Responda só com o JSON {"ok":true}.', [{ text: 'teste' }], { json: true, model: mGiro, ate: Date.now() + 40_000 }); ping = r?.ok ? 'respondeu' : 'respondeu (formato diferente)'; }
      catch (e) { ping = 'erro: ' + String((e as Error).message).slice(0, 160); }
      const msG = Date.now() - t0, orInfo = await orP;
      return out({ chave: !!GEMINI_KEY, principal: MODELO, analise_tecnica: MODELO_TEC, giro: mGiro, reservas: res, teste: ping, ms: msG, openrouter: orInfo, uso_instancia: IA_CONTA });
    }
    // ----- Jornal: "Para você" (a edição ligada aos ativos do trader; vai primeiro na IA gratuita, sem busca) -----
    if (b.modo === 'jornal_voce') {
      const ativos = (Array.isArray(b.ativos) ? b.ativos : []).map((x: unknown) => String(x || '').toUpperCase().replace(/[^A-Z0-9.!]/g, '').slice(0, 12)).filter(Boolean).slice(0, 25);
      const ed = String(b.edicao || '').slice(0, 7000);
      if (!ativos.length || !ed) return out({ itens: [], resumo: 'Sem ativos para relacionar.' });
      { const lim = await limite('jornal_voce'); if (lim) return lim; }
      const r = await gemini(SYS_VOCE, [{ text: `Ativos do leitor: ${ativos.join(', ')}\n\nEdição de hoje:\n${ed}` }], { json: true, ate, temp: 0.4, prefer: 'or' });
      return out({ ...vcNormaliza(r), gerado });
    }
    // ----- Quiz da edição (IA gratuita primeiro, sem busca) -----
    if (b.modo === 'jornal_quiz') {
      const ed = String(b.edicao || '').slice(0, 7000);
      if (!ed) return out({ erro: 'Edição vazia' }, 400);
      { const lim = await limite('jornal_quiz'); if (lim) return lim; }
      const discs = (Array.isArray(b.disciplinas) ? b.disciplinas : []).map((x: unknown) => String(x || '').trim().slice(0, 120)).filter(Boolean).slice(0, 8);
      const r = await gemini(SYS_QUIZ + (discs.length ? `\nO aluno cursa agora: ${discs.join('; ')}. Sempre que der, ligue cada pergunta a uma dessas disciplinas e ponha o nome exato dela no campo "disc" da pergunta.` : ''), [{ text: `Edição de hoje:\n${ed}` }], { json: true, ate, temp: 0.5, prefer: 'or' });
      const qz = quizNormaliza(r);
      if (!qz.perguntas.length) return out({ erro: 'A IA não montou o quiz agora. Tente de novo.' });
      return out({ ...qz, gerado });
    }
    // ----- Plantão: lista do dia (só leitura) e matéria nova quando o servidor de avisos detecta um indicador importante -----
    if (b.modo === 'plantoes') {
      const c = await cacheGet(`plantoes:${hoje()}`);
      return out({ itens: Array.isArray(c?.dados?.itens) ? c!.dados.itens : [] });
    }
    if (b.modo === 'plantao') {
      const e = b.evento || {}, id = String(e.id || '').replace(/[^\w-]/g, '').slice(0, 80), t = String(e.t || '').slice(0, 160);
      if (!id || !t) return out({ erro: 'Evento inválido' }, 400);
      const chave = `plantao:${hoje()}:${id}`, c0 = await cacheGet(chave);
      if (c0?.dados) return out({ ...c0.dados, cache: true });
      if (!doCron) return out({ erro: 'O plantão é escrito pelo servidor de avisos.' }, 403);
      const pais = e.cur === 'BRL' ? 'Brasil' : e.cur === 'USD' ? 'Estados Unidos' : String(e.cur || '');
      const pedido = `Indicador: ${t} (${pais}). Horário da divulgação: ${new Date(String(e.d || Date.now())).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.${e.f ? ' Projeção do mercado: ' + String(e.f).slice(0, 30) + '.' : ''}${e.p ? ' Anterior: ' + String(e.p).slice(0, 30) + '.' : ''}`;
      const mP = Deno.env.get('GEMINI_MODEL_GIRO') || (await modelosReserva())[0] || MODELO;
      const r = await gemini(SYS_PLANTAO, [{ text: pedido }], { json: true, search: true, model: mP, ate, temp: 0.4 });
      const n = plNormaliza(r), g = n ? { id, evento: t, pais, em: String(e.d || ''), gerado, ...n } : { id, evento: t, sem_dado: true, gerado };
      await cachePut(chave, g);
      if (n) { const lk = `plantoes:${hoje()}`, L = await cacheGet(lk); const itens = (Array.isArray(L?.dados?.itens) ? L!.dados.itens : []).filter((x: any) => x.id !== id); itens.unshift(g); await cachePut(lk, { itens: itens.slice(0, 12) }); }
      return out(g);
    }
    // ----- Jornal econômico: edição da manhã, da tarde e de fim de semana (texto original da IA, guardado para todos) -----
    // ----- Jornal econômico: o app pede as 4 partes da edição em pedidos separados (cada um termina bem antes do limite da função),
    // cada parte pronta fica guardada, e no fim "junta" monta a edição para todo mundo -----
    if (b.modo === 'jornal' || b.modo === 'jornal_parte' || b.modo === 'jornal_junta') {
      const sp = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })), min = sp.getHours() * 60 + sp.getMinutes();
      const E = jrEdicao(hoje(), min, sp.getDay()), chave = `jornal:${E.dia}:${E.ed}`;
      const ultima = async () => { const u = await cacheGet('jornal:ultimo'); return u?.dados?.manchete ? u.dados : null; };
      if (b.modo === 'jornal') {
        if (!b.force) {
          const c = await cacheGet(chave);
          if (c?.dados?.manchete) {
            // saiu balanço depois que a edição fechou? o app escreve só a parte dos balanços e junta de novo
            if (b.partes) { try { const nv = await jrBalNovos(E, c.dados, b.bal); if (nv.length) return out({ faltando: true, atualizar: true, partes: ['D'], novos: nv, dia: E.dia, edicao: E.ed, ultima: c.dados }); } catch { /* segue com a edição */ } }
            return out({ ...c.dados, cache: true });
          }
        }
        // app novo: ele mesmo pede as partes
        if (b.partes) return out({ faltando: true, partes: JR_TODAS, dia: E.dia, edicao: E.ed, ultima: await ultima() });
        // servidor de avisos e app antigo: escreve aqui as partes que faltam; o que ficar pronto fica guardado e a próxima chamada continua
        if (!doCron) { const lim = await limite('jornal'); if (lim) return lim; }
        const P = await jrPrep(E, sp, !!b.force, b.bal), ateP = Date.now() + 105_000;
        const res = await Promise.allSettled((JR_TODAS as JrId[]).map(async (id) => { if (!b.force) { const c = await cacheGet(jrParteK(E, id)); if (id === 'D' ? !!c?.dados?.r : jrParteServe(id, jrDesembrulha(c?.dados?.r))) return; } await jrParteGera(E, P, id, ateP); }));
        try { return out(await jrJuntaSalva(E, P)); }
        catch (e) {
          const mot = jrMotivo(res.map((x) => x.status === 'rejected' ? String((x as PromiseRejectedResult).reason?.message || '') : '').filter(Boolean)[0] || (e as Error).message);
          const u = await ultima();
          if (u) return out({ ...u, antiga: true, aviso: 'A edição nova não fechou a tempo. Esta é a última edição pronta.', motivo: mot });
          return out({ erro: 'A redação não conseguiu fechar a edição agora. ' + mot });
        }
      }
      if (b.modo === 'jornal_parte') {
        const id = String(b.parte || '') as JrId;
        if (!JR_TODAS.includes(id)) return out({ erro: 'Parte inválida' }, 400);
        if (!b.force) {
          const c = await cacheGet(chave); if (c?.dados?.manchete) return out({ parte: id, ok: true, pronta: true });
          const pc = await cacheGet(jrParteK(E, id)); const pr = id === 'D' ? pc?.dados?.r : jrDesembrulha(pc?.dados?.r); if (id === 'D' ? !!pr : jrParteServe(id, pr)) return out({ parte: id, ok: true, cache: true, r: pr });
        }
        if (id === 'A' && !doCron) { const lim = await limite('jornal'); if (lim) return lim; }
        try { const P = await jrPrep(E, sp, !!b.force && (id === 'A' || id === 'D'), b.bal); const r = await jrParteGera(E, P, id, Date.now() + 115_000); return out({ parte: id, ok: true, r }); }
        catch (e) { console.error('jornal parte', id, (e as Error).message); if (id === 'D') await cachePut(`jornal:balfalha:${E.dia}:${E.ed}`, { ts: Date.now() }); return out({ parte: id, erro: jrMotivo((e as Error).message) }); }
      }
      // jornal_junta
      if (!b.partes_prontas || !Object.keys(b.partes_prontas).length) { const c = await cacheGet(chave); if (c?.dados?.manchete) return out({ ...c.dados, cache: true }); }
      try { const P = await jrPrep(E, sp, false); return out(await jrJuntaSalva(E, P, b.partes_prontas && typeof b.partes_prontas === 'object' ? b.partes_prontas : {})); }
      catch (e) { const u = await ultima(); return out({ erro: 'A redação não conseguiu fechar a edição. ' + jrMotivo((e as Error).message), ultima: u }); }
    }

    if (b.modo === 'varredura') {
      // jornal: ranking fundamentalista do Ibovespa, uma vez por dia (cache). force só para o dono/cron
      const c = await cacheGet(`varr:${hoje()}`);
      if (c?.dados?.ranking && !b.force) return out({ ...c.dados, cache: true });
      { const lim = await limite('varredura'); if (lim) return lim; }
      return out(await varreduraGera(Date.now() + 100_000));
    }
    if (b.modo === 'giro') {
      if (!b.ultimo && b3SemPregao(hoje())) return out({ erro:'B3 fechada nesta data. Não há giro de abertura, intradiário ou fechamento de hoje. Consulte o último pregão.', bolsa_fechada:true, dia:hoje() },409);
      // antes das 7h e no fim de semana: o último giro pronto (fechamento do último pregão), só leitura, sem IA
      if (b.ultimo) {
        for (let n = b.hoje_tambem ? 0 : 1; n <= 6; n++) {
          const d = new Date(Date.parse(hoje() + 'T12:00:00Z') - n * 864e5).toISOString().slice(0, 10);
          for (const id of ['1720', '15', '12', '10', '0910', '07']) { const c = await cacheGet(`giro:${d}:s${id}`); if (!b3SemPregao(d) && c?.dados?.texto) return out({ ...c.dados, cache: true, dia_giro: d, slot_giro: id }); }
        }
        return out({ erro: 'Ainda não há giro pronto dos últimos dias.' });
      }
      const P = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
      const min = +P.hour * 60 + +P.minute, dia = hoje(), atual = giroSlotAgora(min);
      // 6 giros por dia: 7h, 9h10 (abertura do futuro), 10h (abertura da bolsa), 12h, 15h e 17h20 (fechamento)
      let slot: GiroSlot | null = GIRO_SLOTS.find((x) => x.id === b.slot) || null;
      if (!slot && b.janela) slot = b.janela === 'fech' ? GIRO_SLOTS[GIRO_SLOTS.length - 1] : [...GIRO_SLOTS].reverse().find((x) => x.jan === b.janela && x.ini <= min) || GIRO_SLOTS.find((x) => x.jan === b.janela) || null; // app antigo
      if (!slot) slot = atual;
      if (!slot) return out({ erro: 'O primeiro giro do dia sai às 7h.' }, 409);
      const jan: GiroJanela = slot.jan, bucket = GIRO_SLOTS.indexOf(slot);
      const chave = (id: string) => `giro:${dia}:s${id}`;
      if (!b.force || slot !== atual) { const c = await cacheGet(chave(slot.id)); if (c?.dados?.texto) return out({ ...c.dados, cache: true }); }
      if (slot !== atual) return out({ erro: atual && GIRO_SLOTS.indexOf(slot) < GIRO_SLOTS.indexOf(atual) ? `O ${slot.nome.toLowerCase()} de hoje não foi gerado no horário.` : `O ${slot.nome.toLowerCase()} sai às ${hhmmMin(slot.ini)}.` }, 409);
      { const lim = await limite('giro'); if (lim) return lim; }
      let q = await giroCotacoes();
      // Profit ligado no PC (ponte): Ibovespa, WIN, WDO e DI em tempo real. Primeiro os do próprio usuário; no envio automático, os mais recentes de quem estiver com a ponte ligada (são cotações de mercado, iguais para todos)
      try {
        const desde = new Date(Date.now() - 15 * 60_000).toISOString(), tks = 'ticker=in.(IBOV,WINFUT,WDOFUT,DI1F29,DI1F33)';
        const busca = async (f: string) => { const r = await fetch(`${SB}/rest/v1/cotacoes?select=ticker,ult,fec,var,updated_at&updated_at=gte.${desde}&${f}&order=updated_at.desc&limit=50`, { headers: svc(), signal: AbortSignal.timeout(5_000) }); return r.ok ? await r.json() : []; };
        let rows: any[] = uid ? await busca(`user_id=eq.${uid}`) : [];
        if (!rows.length) rows = await busca(tks);
        else rows = [...rows, ...(await busca(tks))];
        if (rows.length) q = giroProfit(q, rows);
      } catch { /* sem Profit: fica com o TradingView */ }
      const hh = `${P.hour}h${P.minute !== '00' ? P.minute : ''}`, nome = slot.nome;
      const pedido = `Hoje é ${P.weekday}, ${dia.split('-').reverse().join('/')}, ${hh} (horário de Brasília). Escreva o "${nome}".\n\nCotações agora (TradingView; as marcadas [Profit, tempo real] vêm do Profit do trader e valem mais):\n- ${giroLinhas(q, jan).join('\n- ')}\n\nPauta desta edição (${slot.nome}): ${slot.pauta}`;
      // contexto do app: calendário eleitoral, sazonalidade histórica e medo e ganância (guardado por hora)
      const ctxP = (async () => { const ck = `giroctx:${dia}:${P.hour}`; const c = await cacheGet(ck).catch(() => null); if (c?.dados?.eleicao) return c.dados; const v = await giroContexto(dia); if (v.sazonal.length || v.sentimento.length) await cachePut(ck, v).catch(() => {}); return v; })().catch(() => ({ eleicao: [], sazonal: [], sentimento: [] }));
      const tec = await giroTecnica(q).catch(() => [] as string[]);
      let pedido2 = pedido + (tec.length ? `\n\nLeitura técnica (calculada pelo sistema com o histórico diário; use estes níveis e datas):\n- ${tec.join('\n- ')}` : '');
      // giros já publicados hoje: o novo precisa trazer o que MUDOU, com outra abertura e outras palavras
      const antes: string[] = [];
      for (const x of GIRO_SLOTS) { if (x === slot) break; const c = await cacheGet(chave(x.id)).catch(() => null); if (c?.dados?.texto) antes.push(`[${c.dados.nome || x.nome} ${c.dados.hora || ''}] ${c.dados.titulo}\n${String(c.dados.texto).slice(0, 700)}`); }
      // balanços: quem divulgou (e como a ação reage) e quem divulga a seguir, pela função macro
      try {
        const vb: any = await Promise.race([balancos(7), new Promise((r) => setTimeout(() => r(null), 12_000))]);
        if (vb && Array.isArray(vb.proximos)) {
          const tks = jan === 'pre' ? [] : [...(vb.ontem || []), ...(vb.hoje_lista || [])].map((x: any) => String(x.tk || '')).filter((t: string) => /^[A-Z]{4}\d{1,2}$/.test(t)).slice(0, 25);
          const px = await giroAcoes(tks).catch(() => ({}));
          const lb = giroBalancosLinhas(vb, jan, px);
          if (lb.length) pedido2 += `\n\nBalanços (calendário do sistema; pesquise na internet o resultado de cada um e cite o número principal):\n- ${lb.join('\n- ')}`;
        }
      } catch { /* sem calendário de balanços: segue sem */ }
      { const cx = await ctxP; const bl: string[] = [];
        if (cx.eleicao.length) bl.push('Calendário eleitoral:\n- ' + cx.eleicao.join('\n- '));
        if (cx.sazonal.length) bl.push('Sazonalidade histórica (estudo da aba Sazonalidade do app; estatística do passado, não previsão):\n- ' + cx.sazonal.join('\n- '));
        if (cx.sentimento.length) bl.push('Termômetro de sentimento (aba Sentimento do app):\n- ' + cx.sentimento.join('\n- '));
        if (bl.length) pedido2 += `\n\nCONTEXTO (dados do app do trader; use como evidência e cite com naturalidade):\n${bl.join('\n\n')}`; }
      const est = giroEstilo(dia, jan, bucket);
      pedido2 += `\n\nEstilo de abertura desta edição: ${est}.`;
      if (antes.length) pedido2 += `\n\nGiros que o leitor JÁ LEU hoje (não repita manchete, frases, estrutura nem a ordem dos assuntos; conte o que mudou desde então e compare números quando fizer sentido):\n\n${antes.join('\n\n---\n\n')}`;
      // o Giro vai primeiro num modelo "flash" (rápido): o "pro" com busca na web estourava o tempo
      const mGiro = Deno.env.get('GEMINI_MODEL_GIRO') || (await modelosReserva())[0] || MODELO;
      const r = await gemini(SYS_GIRO, [{ text: pedido2 }], { json: true, search: true, model: mGiro, ate, temp: 0.85 });
      const g = { janela: jan, slot: slot.id, nome, hora: hh, gerado, ...giroNormaliza(r), cotacoes: q.filter((x) => x.px != null), profit: q.some((x) => x.fonte === 'Profit') };
      await cachePut(chave(slot.id), g);
      return out(g);
    }

    // ----- Economista IA: explica notícias e cenários -----
    // ----- CNPI-T: questões originais por tema (estudos) -----
    if (b.modo === 'cnpi') {
      const nome = String(b.nome || '').slice(0, 90), n = Math.min(15, Math.max(3, Math.round(+b.n || 10))), prova = String(b.tema || '').startsWith('b') ? 'CB (Conteúdo Brasileiro)' : 'CT1 (Análise Técnica)';
      const ex = (Array.isArray(b.existentes) ? b.existentes : []).slice(0, 30).map((x: unknown) => String(x).replace(/\s+/g, ' ').slice(0, 200));
      if (!nome) return out({ erro: 'Escolha o tema.' }, 400);
      { const lim = await limite('cnpi'); if (lim) return lim; }
      const SYS_CNPI = `Você é professor e elaborador de questões para a certificação CNPI-T da Apimec (provas aplicadas pela FGV). Escreva questões ORIGINAIS (nunca copie provas, apostilas ou livros) em português do Brasil, no nível e no estilo da prova: enunciado claro, 4 alternativas plausíveis, só UMA correta, sem "todas as anteriores" nem "nenhuma das anteriores". Misture questões conceituais, de interpretação e de cálculo simples (retração de Fibonacci, relação risco/retorno, expectativa, juro real, preço de título etc.). O conteúdo precisa estar tecnicamente correto segundo a bibliografia da Apimec (Murphy; Edwards e Magee; Pring; Kirkpatrick e Dahlquist; Nison para candlestick; Frost e Prechter para Elliott; para o CB, a Lei 6.404, a Lei 6.385, normas da CVM e do Banco Central). Em cada questão: "q" (enunciado), "o" (4 alternativas, sem letras), "c" (índice da correta, de 0 a 3, variando a posição), "e" (explicação curta de por que a correta está certa e o erro mais comum), "r" (referência: livro e capítulo, ou a norma). Responda SOMENTE JSON: {"questoes":[{"q":"","o":["","","",""],"c":0,"e":"","r":""}]}`;
      const pedido = `Prova: ${prova}. Tema: ${nome}. Escreva ${n} questões novas.${ex.length ? '\nNão repita nem parafraseie estas, que o aluno já tem:\n- ' + ex.join('\n- ') : ''}`;
      const mq = (await modelosReserva())[0] || MODELO;
      const r = await gemini(SYS_CNPI, [{ text: pedido }], { json: true, model: mq, ate, temp: 0.7, prefer: 'or' });
      const L = (Array.isArray(r?.questoes) ? r.questoes : []).map((q: any) => ({ q: String(q?.q || '').replace(/\s+/g, ' ').trim().slice(0, 700), o: (Array.isArray(q?.o) ? q.o : []).map((x: unknown) => String(x).replace(/^\s*[A-Da-d][).]\s*/, '').trim().slice(0, 300)), c: Math.round(+q?.c), e: String(q?.e || '').trim().slice(0, 600), r: String(q?.r || '').trim().slice(0, 160) }))
        .filter((q: any) => q.q && q.o.length === 4 && q.o.every(Boolean) && q.c >= 0 && q.c <= 3).slice(0, n);
      return out({ questoes: L, gerado });
    }

    // ----- Faculdade: aula de um tópico com exemplo real atual (pesquisa) e o jornal do dia ligado às disciplinas -----
    if (b.modo === 'aula_disc') {
      const L1 = (x: unknown, n: number) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, n);
      const disc = L1(b.disciplina, 120), top = L1(b.topico, 160), curso = L1(b.curso, 80) || 'Ciências Econômicas', ementa = String(b.ementa || '').slice(0, 3000);
      if (!disc || !top) return out({ erro: 'Escolha a disciplina e o tópico.' }, 400);
      { const lim = await limite('aula_disc'); if (lim) return lim; }
      const pedido = `Curso: ${curso}. Disciplina: ${disc}. Tópico da aula: ${top}. Hoje é ${hoje().split('-').reverse().join('/')}.${ementa ? '\nEmenta/plano de ensino da disciplina (use como referência do recorte e do nível):\n' + ementa : ''}`;
      let r: any = null;
      try { r = aulaNorm(await gemini(SYS_AULA, [{ text: pedido }], { json: true, search: true, ate, temp: 0.5 })); }
      catch (e) { r = aulaNorm(await gemini(SYS_AULA + '\n\nATENÇÃO: agora você não tem pesquisa na internet; use um exemplo real conhecido (histórico ou recente) e diga a data.', [{ text: pedido }], { json: true, ate, temp: 0.5, prefer: 'or' })); }
      return out({ ...r, disciplina: disc, topico: top, gerado });
    }
    // ----- Estudos: explica uma questão de simulado (por que a alternativa certa é a certa) -----
    if (b.modo === 'explica') {
      const L1 = (x: unknown, n: number) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, n);
      const q = L1(b.q, 1800), tema = L1(b.tema, 120), ops = (Array.isArray(b.o) ? b.o : []).slice(0, 5).map((x: unknown) => L1(x, 400));
      const c = Math.round(+b.c), r = b.r == null ? -1 : Math.round(+b.r);
      if (!q || ops.length < 2 || !(c >= 0 && c < ops.length)) return out({ erro: 'Questão incompleta.' }, 400);
      { const lim = await limite('explica'); if (lim) return lim; }
      const SYS_EXP = `Você é professor de certificações financeiras (CNPI, CFP, CEA) e de derivativos. Explique em português do Brasil, de forma curta e didática, por que a alternativa indicada como correta é a correta. O gabarito é oficial: NÃO conteste o gabarito. Se houver conta, mostre o passo a passo com os números da questão. Se o aluno marcou outra alternativa, diga em uma frase por que ela está errada. Cite o conceito, a fórmula ou a norma (ex.: CPC 01, Lei 6.404, CAPM, paridade put-call). Termine com uma dica curta para acertar questões parecidas. Responda SOMENTE JSON: {"explicacao":"","conta":"","erro_marcado":"","dica":""} (use "" quando não se aplicar; no máximo 120 palavras na explicação).`;
      const L = 'abcde';
      const pedido = `Tema: ${tema || 'geral'}\nQuestão: ${q}\n${ops.map((o: string, i: number) => `${L[i]}) ${o}`).join('\n')}\nGabarito oficial: ${L[c]})${r >= 0 && r !== c ? `\nO aluno marcou: ${L[r]})` : ''}`;
      const mq = (await modelosReserva())[0] || MODELO;
      const j = await gemini(SYS_EXP, [{ text: pedido }], { json: true, model: mq, ate, temp: 0.3, prefer: 'or' });
      const res = { explicacao: L1(j?.explicacao, 1400), conta: L1(j?.conta, 700), erro_marcado: L1(j?.erro_marcado, 400), dica: L1(j?.dica, 300) };
      if (!res.explicacao) return out({ erro: 'A IA não respondeu agora. Tente de novo.' });
      return out({ ...res, gerado });
    }
    if (b.modo === 'jornal_aula') {
      const discs = (Array.isArray(b.disciplinas) ? b.disciplinas : []).map((x: unknown) => String(x || '').trim().slice(0, 120)).filter(Boolean).slice(0, 8);
      const ed = String(b.edicao || '').slice(0, 7000);
      if (!discs.length || !ed) return out({ erro: 'Faltam as disciplinas ou a edição.' }, 400);
      { const lim = await limite('jornal_aula'); if (lim) return lim; }
      const r = await gemini(SYS_JORNAL_AULA, [{ text: `Disciplinas que o aluno cursa agora: ${discs.join('; ')}.\n\nEdição de hoje do jornal:\n${ed}` }], { json: true, ate, temp: 0.4, prefer: 'or' });
      const itens = jornalAulaNorm(r, discs);
      if (!itens.length) return out({ erro: 'A IA não ligou o jornal às disciplinas agora. Tente de novo.' });
      return out({ itens, gerado });
    }
    // planos de estudo: tópicos de uma matéria de qualquer curso e questões de treino sobre um tópico
    if (b.modo === 'topicos' || b.modo === 'quiz') {
      const lim1 = (x: unknown, n: number) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, n);
      const curso = lim1(b.curso, 80), materia = lim1(b.materia, 90), topico = lim1(b.topico, 140), nivel = lim1(b.nivel, 40) || 'graduação';
      if (!materia) return out({ erro: 'Informe a matéria.' }, 400);
      { const lim = await limite(b.modo); if (lim) return lim; }
      const mq = (await modelosReserva())[0] || MODELO;
      if (b.modo === 'topicos') {
        const SYS_T = `Você é coordenador pedagógico. Monte a lista de tópicos de estudo de uma matéria, na ordem em que normalmente é ensinada, para o nível informado, em português do Brasil. Cada tópico é curto (até 70 caracteres), específico e estudável numa sessão de 40 a 60 minutos. Entre 8 e 15 tópicos. Inclua "d" = dificuldade de 1 (fácil) a 3 (difícil). Responda SOMENTE JSON: {"topicos":[{"t":"","d":2}]}`;
        const ementa = String(b.ementa || '').slice(0, 4000);
        const r = await gemini(SYS_T + (ementa ? ' Quando vier a EMENTA/PLANO DE ENSINO da disciplina, siga exatamente os temas e a ordem dela (pode dividir um tema grande em dois tópicos).' : ''), [{ text: `Curso: ${curso || 'não informado'}. Nível: ${nivel}. Matéria: ${materia}.${ementa ? '\nEmenta/plano de ensino:\n' + ementa : ''}` }], { json: true, model: mq, ate, temp: 0.4, prefer: 'or' });
        const L = (Array.isArray(r?.topicos) ? r.topicos : []).map((x: any) => ({ t: lim1(typeof x === 'string' ? x : x?.t, 90), d: Math.min(3, Math.max(1, Math.round(+x?.d || 2))) })).filter((x: any) => x.t).slice(0, 15);
        return out({ topicos: L, gerado });
      }
      if (!topico) return out({ erro: 'Escolha o tópico.' }, 400);
      const n = Math.min(10, Math.max(3, Math.round(+b.n || 5)));
      const SYS_Q = `Você é professor universitário. Escreva questões ORIGINAIS de múltipla escolha em português do Brasil para o aluno treinar um tópico: enunciado claro, 4 alternativas plausíveis, só UMA correta, sem "todas/nenhuma das anteriores". Misture conceito, interpretação e, quando a matéria permitir, cálculo simples. Conteúdo tecnicamente correto. Em cada questão: "q", "o" (4 alternativas, sem letras), "c" (índice da correta, 0 a 3, variando), "e" (explicação curta), "r" (onde estudar: tipo de livro-texto ou capítulo usual). Responda SOMENTE JSON: {"questoes":[{"q":"","o":["","","",""],"c":0,"e":"","r":""}]}`;
        const r = await gemini(SYS_Q, [{ text: `Curso: ${curso || 'não informado'}. Matéria: ${materia}. Tópico: ${topico}. Escreva ${n} questões.` }], { json: true, model: mq, ate, temp: 0.7, prefer: 'or' });
      const L = (Array.isArray(r?.questoes) ? r.questoes : []).map((q: any) => ({ q: lim1(q?.q, 700), o: (Array.isArray(q?.o) ? q.o : []).map((x: unknown) => String(x).replace(/^\s*[A-Da-d][).]\s*/, '').trim().slice(0, 300)), c: Math.round(+q?.c), e: lim1(q?.e, 600), r: lim1(q?.r, 160) }))
        .filter((q: any) => q.q && q.o.length === 4 && q.o.every(Boolean) && q.c >= 0 && q.c <= 3).slice(0, n);
      return out({ questoes: L, gerado });
    }

    // inglês: conversa curta com um professor para iniciante (situações do dia a dia, do trabalho e do mercado)
    if (b.modo === 'ingles') {
      const l1 = (x: unknown, n: number) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, n);
      const cena = l1(b.cena, 200), texto = l1(b.texto, 600);
      const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-10).map((h: any) => `${h?.q === 'a' ? 'Aluno' : 'Professor'}: ${l1(h?.t, 400)}`).join('\n');
      { const lim = await limite('ingles'); if (lim) return lim; }
      const SYS_EN = 'Você é um professor de inglês paciente e animado para um brasileiro adulto INICIANTE (sabe quase nada de inglês). Ele é técnico em eletrotécnica numa usina, estuda economia e faz day trade. ' +
        'Converse em INGLÊS MUITO SIMPLES (nível A1 a A2: frases curtas, palavras comuns, presente simples), dentro da situação proposta, e faça sempre UMA pergunta curta para ele continuar. ' +
        'Responda APENAS com JSON: {"resposta":"sua fala em inglês, no máximo 2 frases curtas","traducao":"tradução da sua fala para o português do Brasil","correcao":"a frase do aluno corrigida em inglês natural, se ela tiver erro ou se ele escreveu em português; senão vazio","explicacao":"em português, 1 frase simples explicando a correção; senão vazio","sugestao":"uma resposta simples em inglês que o aluno pode usar agora"}. ' +
        'Elogie quando ele acertar. Não use gírias difíceis. Não dê recomendação de investimento nem invente cotações.';
      const pedido = `Situação: ${cena || 'conversa livre'}.\n${hist ? 'Conversa até aqui:\n' + hist + '\n' : ''}${texto ? 'Aluno: ' + texto : 'Comece você a conversa, com uma saudação e uma pergunta simples.'}`;
      const mq = (await modelosReserva())[0] || MODELO;
      const r = await gemini(SYS_EN, [{ text: pedido }], { json: true, model: mq, ate, temp: 0.6, prefer: 'or' });
      const L = (k: string, n: number) => l1(r?.[k], n);
      if (!L('resposta', 400)) return out({ erro: 'A IA não respondeu agora. Tente de novo.' }, 502);
      return out({ resposta: L('resposta', 400), traducao: L('traducao', 400), correcao: L('correcao', 300), explicacao: L('explicacao', 300), sugestao: L('sugestao', 200), gerado });
    }

    // ----- Terminal: central de inteligência (dados confirmados × interpretação × cenários) -----
    if (b.modo === 'central') {
      const ctx = b.contexto && typeof b.contexto === 'object' ? b.contexto : null;
      const bruto = ctx ? JSON.stringify(ctx) : '';
      if (!ctx || bruto.length < 20) return out({ erro: 'Sem dados do terminal para analisar.' }, 400);
      if (bruto.length > 30000) return out({ erro: 'Dados demais: abra menos ativos no terminal.' }, 400);
      { const lim = await limite('central'); if (lim) return lim; }
      const pedido = `Hoje: ${hoje()}. Dados do terminal (JSON):\n${bruto}`;
      const j = await gemini(SYS_CENTRAL, [{ text: pedido }], { json: true, model: MODELO, ate, temp: 0.3 });
      const res = normalizaCentral(j, ctx);
      if (!res.resumo && !res.confirmados.length) return out({ erro: 'A IA não respondeu agora. Tente de novo.' });
      return out({ ...res, ia: 'Gemini', modelo: MODELO, gerado });
    }
    if (b.modo === 'economista') {
      const texto = String(b.texto || '').trim().slice(0, 6000);
      if (texto.length < 3) return out({ erro: 'Escreva a pergunta ou cole a notícia.' }, 400);
      const link = /^https?:\/\/\S+$/.test(String(b.link || '').trim()) ? String(b.link).trim().slice(0, 500) : '';
      const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-6).map((h: any) => `Usuário: ${String(h?.p || '').slice(0, 1200)}\nVocê respondeu (resumo): ${String(h?.r || '').slice(0, 1500)}`).join('\n\n');
      { const lim = await limite('economista'); if (lim) return lim; }
      const m = await macro().catch(() => null);
      const ctx = `Data de hoje: ${hoje()}.` + (m ? ` Últimos dados do Banco Central: Selic ${m.selic_pct ?? '?'}% ao ano, IPCA 12 meses ${m.ipca12_pct ?? '?'}%, juro real ${m.juro_real_pct ?? '?'}%.` : '');
      const pedido = `${ctx}${hist ? '\n\nConversa até aqui:\n' + hist : ''}\n\nPergunta ou notícia do usuário:\n${texto}${link ? '\nLink da notícia: ' + link : ''}`;
      const r = await gemini(SYS_ECO, [{ text: pedido }], { json: true, search: true, model: MODELO, ate });
      return out({ ia: 'Gemini', modelo: MODELO, gerado, resposta: normalizaEco(r) });
    }

    // ----- foto -----
    if (b.modo === 'imagem') {
      if (!b.img || !b.img.data) return out({ erro: 'Imagem ausente' }, 400);
      { const lim = await limite('imagem'); if (lim) return lim; }
      const erros: string[] = [], ativos: any[] = [];
      let extra = '';
      const tk = String(b.tk || '').trim().toUpperCase();
      if (tk && /^[A-Z0-9.\-]{1,12}$/.test(tk)) {
        const mk = b.mk === 'BR' || b.mk === 'US' ? b.mk : isB3(tk) ? 'BR' : 'US';
        try { const a = await coletaTec(tk, mk, uid); ativos.push(a); extra = '\nDados calculados: ' + JSON.stringify({ tk, preco: a.preco_atual, ind: a.ind, pivos: a.pivos }); }
        catch (e) { erros.push(`${tk}: ${(e as Error).message}`); }
      }
      const rel = await gemini(
        SYS_IMG,
        [{ inline_data: { mime_type: b.img.mime || 'image/jpeg', data: b.img.data } }, { text: 'Contexto do usuário: ' + String(b.foco || '').slice(0, 200) + extra }],
        { json: true, ate },
      );
      return out({ ia: 'Gemini', modelo: MODELO, gerado, ativos, relatorio: rel.relatorio || rel, erros });
    }

    // ----- posições abertas -----
    if (b.modo === 'posicoes') {
      const pos = (Array.isArray(b.itens) ? b.itens : []).slice(0, 15);
      if (!pos.length) return out({ erro: 'Nenhuma posição aberta informada' }, 400);
      { const lim = await limite('posicoes'); if (lim) return lim; }
      const erros: string[] = [], ativos: any[] = [];
      const alvos = new Map<string, string>();
      pos.forEach((p: any) => {
        const tk = String(p.tk || '').trim().toUpperCase();
        if (tk && (p.mk === 'BR' || p.mk === 'US') && /^[A-Z0-9.\-]{1,12}$/.test(tk)) alvos.set(tk, p.mk);
      });
      await Promise.all([...alvos].slice(0, 8).map(async ([tk, mk]) => {
        try { ativos.push(await coletaTec(tk, mk, uid)); } catch (e) { erros.push(`${tk}: ${(e as Error).message}`); }
      }));
      const dias = (v: string) => {
        const t = Date.parse(String(v || '') + 'T00:00:00Z');
        return isFinite(t) ? Math.round((t - Date.parse(hoje() + 'T00:00:00Z')) / 864e5) : null;
      };
      const dados = pos.map((p: any) => {
        const tk = String(p.tk || '').trim().toUpperCase();
        const a = ativos.find((x) => x.tk === tk);
        const dir = p.lado === 'V' ? -1 : 1;
        const e = num(p.entrada), s = num(p.stop);
        const calculos: any = {};
        if (a) {
          const px = a.preco_atual;
          calculos.preco_do_ativo_ou_subjacente = px;
          if (p.tipo === 'O') {
            const k = num(p.strike);
            if (k != null) calculos.dist_strike_pct = r2(((k - px) / px) * 100);
          } else if (e != null) {
            calculos.resultado_aberto_pct = r2(((px - e) / e) * 100 * dir);
            if (s != null && e !== s) calculos.r_aberto = r2(((px - e) * dir) / Math.abs(e - s));
            if (s != null) calculos.dist_stop_pct = r2(((px - s) / px) * 100 * dir);
            const al = (Array.isArray(p.alvos) ? p.alvos : []).map((x: any) => num(x)).filter((x: any) => x != null);
            if (al.length) calculos.dist_alvos_pct = al.map((t: number) => r2(((t - px) / px) * 100 * dir));
          }
        }
        if (p.tipo === 'O') calculos.dias_para_vencer = dias(p.venc);
        return {
          id: String(p.id || ''), ativo: String(p.ativo || '').toUpperCase(), tipo: p.tipo,
          lado: p.lado === 'V' ? 'venda/lançado' : 'compra/comprado',
          entrada: e, stop: s, alvos: p.alvos, quantidade: p.qtd, aberta_em: p.dt,
          opcao: p.opcao, strike: p.strike, vencimento: p.venc, estrutura: p.estrutura,
          mercado: a ? { preco_atual: a.preco_atual, moeda: a.moeda, indicadores: a.ind, pivos: a.pivos } : 'sem dado de mercado',
          calculos,
        };
      });
      const prompt = 'Data de hoje: ' + hoje() + '\nPosições abertas do usuário:\n' + JSON.stringify(dados);
      const rel = await gemini(SYS_POS, [{ text: prompt }], { json: true, model: MODELO_TEC, ate });
      return out({ ia: 'Gemini', modelo: MODELO_TEC, gerado, ativos: ativos.map(({ candles, graficos, ...r }) => r), relatorio: rel.relatorio || rel, erros });
    }

    // ----- estatísticas dos trades (números já calculados pelo app) -----
    // ----- diário: debriefing (texto ou áudio), tipos de perda e "pergunte ao diário" (dados vêm do app) -----
    if (b.modo === 'diario') {
      const sub = String(b.sub || '');
      const lim1 = (x: unknown, n: number) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
      if (!['debrief', 'perdas', 'chat'].includes(sub)) return out({ erro: 'Pedido inválido.' }, 400);
      { const lim = await limite('diario'); if (lim) return lim; }
      const mq = Deno.env.get('GEMINI_MODEL_GIRO') || (await modelosReserva().catch(() => [] as string[]))[0] || MODELO;
      if (sub === 'debrief') {
        const texto = String(b.texto || '').slice(0, 6000), au = b.audio && typeof b.audio === 'object' ? b.audio : null;
        const dados = JSON.stringify(b.dia || {}).slice(0, 20000);
        if (!texto.trim() && !(au && au.data)) return out({ erro: 'Fale ou escreva sobre o dia.' }, 400);
        if (au && String(au.data).length > 8_000_000) return out({ erro: 'Áudio longo demais (até 3 minutos).' }, 413);
        const SYS_DB = `Você é um coach de trading (linha Van Tharp / Mark Douglas) que organiza o debriefing de um day trader brasileiro. Responda em português do Brasil, em JSON: {"transcricao": string (só se veio áudio: a fala transcrita fielmente, sem inventar), "bem": string (o que ele fez bem, 1 a 3 frases), "aprendizado": string (a lição principal, 1 a 2 frases), "condicoes_erros": string (em que condição os erros aconteceram, ou ""), "para_nao_repetir": string (uma ação concreta para amanhã), "emocoes": [até 4 emoções nomeadas, ex.: "ansiedade", "euforia"], "erros": [até 4 erros objetivos, ex.: "entrou sem stop"]}. Use só o que ele disse e os trades enviados; não invente fatos nem números. Tom direto e respeitoso.`;
        const parts: any[] = [];
        if (au && au.data) parts.push({ inline_data: { mime_type: /^audio\/[a-z0-9.+-]+$/.test(String(au.mime)) ? String(au.mime) : 'audio/mp4', data: String(au.data) } });
        parts.push({ text: `${texto ? 'Debriefing escrito:\n' + texto + '\n\n' : au ? 'O debriefing está no áudio acima.\n\n' : ''}Trades e plano do dia (JSON): ${dados}` });
        const r = await gemini(SYS_DB, parts, { json: true, model: mq, ate, temp: 0.3 });
        const arr = (x: unknown) => (Array.isArray(x) ? x : []).map((y) => lim1(y, 60)).filter(Boolean).slice(0, 4);
        return out({ gerado, transcricao: au ? lim1(r?.transcricao, 6000) : '', bem: lim1(r?.bem, 600), aprendizado: lim1(r?.aprendizado, 600), condicoes_erros: lim1(r?.condicoes_erros, 600), para_nao_repetir: lim1(r?.para_nao_repetir, 400), emocoes: arr(r?.emocoes), erros: arr(r?.erros) });
      }
      if (sub === 'perdas') {
        const P = (Array.isArray(b.perdas) ? b.perdas : []).slice(0, 150).map((x: any) => ({ id: lim1(x?.id, 40), d: lim1(x?.d, 10), h: lim1(x?.h, 5), at: lim1(x?.at, 16), lado: lim1(x?.lado, 2), setup: lim1(x?.setup, 40), r: Number.isFinite(+x?.r) ? +x.r : null, v: +x?.v || 0, erro: lim1(x?.erro, 60), regras: lim1(x?.regras, 10), emo: lim1(x?.emo, 20), nota: lim1(x?.nota, 2), tilt: lim1(x?.tilt, 80), ctx: lim1(x?.ctx, 8), obs: lim1(x?.obs, 160) })).filter((x: any) => x.id);
        if (P.length < 5) return out({ erro: 'Poucas perdas para agrupar.' }, 400);
        const SYS_P = `Você analisa as perdas de um trader e as separa em 3 a 6 PADRÕES de comportamento ou de mercado (ex.: "entrada atrasada depois de candle grande", "contra a tendência do dia", "revanche logo depois de stop", "stop esticado"). Use horário, setup, erro, emoção, regras, tilt, contexto e anotações. Cada trade entra em no máximo um grupo; trades sem padrão claro podem ficar de fora. Responda em português do Brasil, em JSON: {"grupos":[{"nome": string curto (até 50), "descricao": string (1 frase, o que caracteriza), "evitar": string (1 ação concreta), "ids": [ids dos trades]}]}. Não calcule valores: o app calcula.`;
        const r = await gemini(SYS_P, [{ text: 'Perdas (JSON): ' + JSON.stringify(P) }], { json: true, model: mq, ate, temp: 0.3 });
        const ok = new Set(P.map((x: any) => x.id));
        const G = (Array.isArray(r?.grupos) ? r.grupos : []).slice(0, 6).map((g: any) => ({ nome: lim1(g?.nome, 60), descricao: lim1(g?.descricao, 240), evitar: lim1(g?.evitar, 200), ids: (Array.isArray(g?.ids) ? g.ids : []).map((x: unknown) => String(x)).filter((x: string) => ok.has(x)) })).filter((g: any) => g.nome && g.ids.length);
        return out({ gerado, grupos: G });
      }
      const pergunta = lim1(b.pergunta, 500);
      if (pergunta.length < 3) return out({ erro: 'Escreva a pergunta.' }, 400);
      const dados = JSON.stringify(b.dados || {});
      if (dados.length > 90_000) return out({ erro: 'Dados demais. Escolha um período menor.' }, 413);
      const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-4).map((h: any) => `P: ${lim1(h?.p, 300)}\nR: ${lim1(h?.r, 600)}`).join('\n');
      const SYS_C = `Você é o analista do diário de um trader. Responda à pergunta usando SOMENTE os dados enviados (resumo e lista de trades com data, hora, ativo, setup, resultado em R e em dinheiro, erro, regras, emoção, nota A/B/C, tilt, contexto do dia e sono). Faça as contas com cuidado e mostre os números que usou (quantos trades, soma, média). Se os dados não permitem responder, diga o que falta. Português do Brasil, direto, no máximo 8 linhas, sem markdown pesado. Responda em JSON: {"resposta": string}.`;
      const r = await gemini(SYS_C, [{ text: `Data de hoje: ${hoje()}.\n${hist ? 'Conversa anterior:\n' + hist + '\n\n' : ''}Dados (JSON): ${dados}\n\nPergunta: ${pergunta}` }], { json: true, model: mq, ate, temp: 0.2 });
      return out({ gerado, resposta: lim1(r?.resposta, 2500) });
    }

    if (b.modo === 'estatisticas') {
      if (!b.resumo || typeof b.resumo !== 'object') return out({ erro: 'Estatísticas ausentes' }, 400);
      const pacote = JSON.stringify({ resumo: b.resumo, diagnosticos: Array.isArray(b.diagnosticos) ? b.diagnosticos.slice(0, 20) : [], grupos: b.grupos && typeof b.grupos === 'object' ? b.grupos : null });
      if (pacote.length > 30000) return out({ erro: 'Dados grandes demais' }, 413);
      { const lim = await limite('estatisticas'); if (lim) return lim; }
      const rel = await gemini(SYS_EST, [{ text: 'Data de hoje: ' + hoje() + '\nEstatísticas calculadas (não recalcule):\n' + pacote }], { json: true, model: MODELO_TEC, ate });
      return out({ ia: 'Gemini', modelo: MODELO_TEC, gerado, base: 'números calculados pelo app', relatorio: rel.relatorio || rel });
    }

    // ----- técnica / fundamentalista -----
    // ----- carteira (v279): relatório individual, consolidado e rodada automática (agendada ou pedida no app) -----
    if (b.modo === 'carteira_ativo' || b.modo === 'carteira_consolidado' || b.modo === 'carteira_auto') {
      const dono = doCron ? String(b.uid || '') : uid;
      if (!dono || !/^[0-9a-f-]{36}$/.test(dono)) return out({ erro: 'Usuário inválido.' }, 400);
      const mac = await macro().catch(() => null), lim = doCron ? null : limite;
      if (b.modo === 'carteira_ativo') {
        const it = limpaItem(b.item || {}); if (!it.tk) return out({ erro: 'Informe o ativo.' }, 400);
        const r = await relAtivo(dono, it, { force: !!b.force, ate, origem: doCron ? 'agendado' : 'app', mac, lim });
        return out({ ...r, gerado });
      }
      const C = await cartCfg(dono), cfg = (b.cfg && typeof b.cfg === 'object' ? b.cfg : C?.cfg) || {};
      const itens = (Array.isArray(cfg.itens) ? cfg.itens : []).slice(0, 40).map(limpaItem).filter((x: any) => x.tk);
      if (b.modo === 'carteira_consolidado') {
        const row = await relConsolidado(dono, itens, cfg.metricas || null, { ate, origem: doCron ? 'agendado' : 'app', mac, lim });
        return out({ row, gerado });
      }
      // rodada: ativos com mudança relevante ganham relatório novo; os outros reaproveitam o último; no fim, o consolidado
      if (doCron && cfg.on !== true) return out({ pulado: 'agendamento desligado' });
      const ref = hoje(), prazo = Math.min(ate, Date.now() + Math.max(30_000, Math.min(+b.ms || 100_000, 140_000)));
      const e0 = C?.estado && C.estado.ref === ref ? C.estado : { ref, feitos: [], reap: [], falhas: [], cons: null, ini: gerado };
      const pend = () => itens.filter((x: any) => x.q > 0 && familia(x.cl) !== 'rf' && ![...e0.feitos, ...e0.reap, ...e0.falhas.map((f: any) => f.tk)].includes(x.tk));
      for (const it of pend()) {
        if (prazo - Date.now() < 35_000) break;
        if (doCron && e0.feitos.length >= CART_MAX_DIA) { e0.reap.push(it.tk); continue; }
        try { const r = await relAtivo(dono, it, { ate: prazo, origem: doCron ? 'agendado' : 'app', mac, lim }); (r.reaproveitado ? e0.reap : e0.feitos).push(it.tk); }
        catch (e) { e0.falhas.push({ tk: it.tk, erro: (e as Error).message.slice(0, 140) }); if (/Limite diário/.test((e as Error).message)) break; }
        await cartEstado(dono, e0);
      }
      if (!pend().length && !e0.cons && prazo - Date.now() >= 30_000 && itens.some((x: any) => x.q > 0)) {
        try { const row = await relConsolidado(dono, itens, cfg.metricas || null, { ate: prazo, origem: doCron ? 'agendado' : 'app', mac, lim, reaproveitados: e0.reap }); e0.cons = row.id; e0.fim = new Date().toISOString(); }
        catch (e) { e0.erro_cons = (e as Error).message.slice(0, 160); }
        await cartEstado(dono, e0);
      }
      return out({ ...e0, pendentes: pend().map((x: any) => x.tk), gerado });
    }
    const tec = b.modo === 'tecnica';
    if (!tec && b.modo !== 'fundamentalista') return out({ erro: 'Modo inválido' }, 400);
    const itens = (Array.isArray(b.itens) ? b.itens : []).slice(0, 12)
      .map((o: any) => ({ tk: String(o.tk || '').trim().toUpperCase(), mk: o.mk === 'BR' || o.mk === 'US' ? o.mk : null, o }))
      .filter((o: any) => /^[A-Z0-9.\-]{1,12}$/.test(o.tk));
    if (!itens.length) return out({ erro: 'Nenhum ativo informado' }, 400);

    const modeloUsado = tec ? MODELO_TEC : MODELO_FUN;
    // relatório de ativo avulso guardado: fundamentalista vale o dia; técnico vale 1 hora. "force" ignora o guardado.
    const meuPlano = b.avulso ? normalizaPlano(b.meu_plano) : null;
    const meuOk: any = meuPlano && meuPlano.valido ? meuPlano : null;
    // prints do trader (com o Fibonacci desenhado) vão junto para a IA analisar o desenho
    const prints = meuOk && Array.isArray(b.prints) ? b.prints.filter((x: any) => x && typeof x.data === 'string' && x.data.length > 100 && x.data.length < 3_000_000).slice(0, 3) : [];
    const extrasImg: any[] = prints.flatMap((x: any) => [{ text: `Print do trader · gráfico ${String(x.tf || '').slice(0, 10)} (com o Fibonacci que ele desenhou):` }, { inline_data: { mime_type: 'image/jpeg', data: x.data } }]);
    const fiboLido = meuOk && b.meu_fibo && typeof b.meu_fibo === 'object' ? { explicacao: String(b.meu_fibo.explicacao || '').slice(0, 600), niveis: Array.isArray(b.meu_fibo.niveis) ? b.meu_fibo.niveis.slice(0, 12) : [] } : null;
    // Nunca compartilhar relatórios personalizados ou dados da ponte entre contas.
    const contextoCache = JSON.stringify({ modo:b.modo, ativo:itens[0]?.tk, mercado:itens[0]?.mk, modelo:modeloUsado, plano:meuOk, fibo:fiboLido, prints });
    const digestCache = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contextoCache));
    const hashCache = Array.from(new Uint8Array(digestCache), x=>x.toString(16).padStart(2,'0')).join('');
    const chaveRel = uid && b.avulso && itens.length === 1 ? `rel318:${uid}:${hoje()}:${hashCache}` : '';
    if (chaveRel && !b.force) {
      const c = await cacheGet(chaveRel);
      const idadeMin = c && c.dados && c.dados.gerado ? (Date.now() - Date.parse(c.dados.gerado)) / 6e4 : 1e9;
      if (c && c.dados && c.dados.relatorio && (!tec || idadeMin < 60)) return out({ ...c.dados, cache: true });
    }
    { const lim = await limite(tec ? 'tecnica' : 'fundamentalista'); if (lim) return lim; }

    const erros: string[] = [], avisos: string[] = [], ativos: any[] = [];
    const mac = tec ? null : await macro();
    await Promise.all(itens.map(async (it: any) => {
      const mk = it.mk || (isB3(it.tk) ? 'BR' : 'US');
      try { ativos.push(tec ? await coletaTec(it.tk, mk, uid) : await coletaFunCache(it.tk, mk, avisos, mac)); }
      catch (e) { erros.push(`${it.tk}: ${(e as Error).message}`); }
    }));
    if (!ativos.length) return out({ erro: 'Não consegui dados para nenhum ativo', erros }, 502);
    ativos.sort((a, c) => itens.findIndex((i: any) => i.tk === a.tk) - itens.findIndex((i: any) => i.tk === c.tk));

    // estudo quantitativo (backtests no histórico do próprio ativo): planos testados = o do trader + os calculados
    function quantDe(a: any) {
      try {
        const planos: PlanoQ[] = [];
        if (meuOk && itens.length === 1) planos.push({ origem: 'plano do trader (o Fibonacci dele)', lado: meuOk.lado === 'VENDA' ? 'venda' : 'compra', entrada: meuOk.entrada, stop: meuOk.stop, alvos: meuOk.alvos });
        for (const k of ['compra', 'venda'] as const) { const p = a.plano && a.plano[k]; if (p) planos.push({ origem: 'plano calculado de ' + k, lado: k, entrada: p.entrada, stop: p.stop, alvos: [p.alvo_1, p.alvo_2] }); }
        return estudoQuant(a.qcs || [], a.qM, planos);
      } catch (e) { return { aviso: 'estudo quantitativo falhou: ' + (e as Error).message }; }
      finally { delete a.qcs; delete a.qM; }
    }
    if (tec) ativos.forEach((a) => { if (FUT_RE.test(a.tk)) (a.avisos || []).forEach((x: string) => avisos.push(x)); });
    // dados enviados ao Gemini (candles reduzidos)
    const peso: Record<string, any> = {};
    itens.forEach((i: any) => (peso[i.tk] = { peso_pct: i.o.peso, preco_medio: i.o.pm, quantidade: i.o.q }));
    const dados = ativos.map((a) => tec
      ? {
        ticker: a.tk, moeda: a.moeda, preco_atual: a.preco_atual, indicadores: a.ind, pivos: a.pivos,
        multitempo: a.mtf,
        leitura_dow_do_trader: a.dow,
        ondas_de_elliott: a.elliott,
        ferramentas_classicas: a.classicos,
        niveis_proximos: proximos(a.niveis, 4), confluencias: a.confluencias.slice(0, 8), plano_calculado: a.plano, validacao_do_servidor: a.validacao,
        ultimos_fechamentos: a.candles.slice(-30).map((c: Candle) => c[4]),
        estudo_quantitativo: quantDe(a),
        ...(FUT_RE.test(a.tk) ? { avisos_dos_dados: a.avisos, contrato_futuro: 'Mini contrato futuro da B3 (day trade): use a leitura diária e semanal para o viés e os níveis; cite os níveis na escala informada.' } : {}),
      }
      : { ticker: a.tk, mercado: a.mk, cobertura_dados: a.cobertura, fundamentos: fundPct(a.fund), referencias_de_valuation: a.val,
        ...(a.hist ? { analise_de_balancos_numeros: a.hist.balancos || null, checklist_buy_and_hold: a.hist.checklist && { pontos: a.hist.checklist.pontos, de: a.hist.checklist.avaliados, itens: a.hist.checklist.itens.map((x: any) => ({ criterio: x.criterio, atende: x.ok, valor: x.valor })) }, dividend_yield_por_ano_pct: (a.hist.dy_anos || []).map((x: any) => ({ ano: x.ano, dy: x.dy_pct, ...(x.parcial ? { ano_em_andamento: true } : {}) })), receita_e_lucro_por_ano: a.hist.receita_lucro } : {}), ...(posDe(a) ? { posicao: posDe(a) } : {}) });
    const avulso = !!b.avulso;
    function posDe(a: any) {
      const p = peso[a.tk], px = (a.val && a.val.preco) ?? (a.fund && a.fund.preco);
      if (b.avulso || !p || !(+p.preco_medio > 0)) return null;
      return { preco_medio: +p.preco_medio, quantidade: p.quantidade ?? null, peso_pct: p.peso_pct ?? null, resultado_pct: px ? r2((px / +p.preco_medio - 1) * 100, 1) : null };
    }
    const cab = (avulso ? 'Ativo avulso (sem posição na carteira).\n' : 'Carteira do usuário (pesos e posições):\n' + JSON.stringify(peso) + '\n') +
      'Data de hoje: ' + hoje() + (tec ? '' : '\n' + UNIDADES + '\nMacro Brasil (Banco Central): ' + JSON.stringify(mac || 'sem dado')) +
      (meuOk ? '\n' + (tec ? PEDE_PLANO_TEC : PEDE_PLANO_FUN)(meuOk, fiboLido, prints.length) : '') + '\nDados:\n';

    const lotes = { n: 1 };
    const rel = await relatorioEmLotes(tec, dados, cab, modeloUsado, erros, lotes, ate, extrasImg);
    const relat: any = (rel as any).relatorio || rel;
    if (tec) aplicaCalculos(relat, ativos);
    // o estudo estatístico aparece dentro de "Indicadores" (no app e no PDF), sem mudar as telas
    if (tec && Array.isArray(relat.ativos)) for (const it of relat.ativos) {
      const e = typeof it.estatistica === 'string' ? it.estatistica.trim() : '';
      if (!e) continue;
      const bloco = 'O que o histórico do ativo diz (estudo estatístico): ' + e;
      if (typeof it.indicadores === 'string' || it.indicadores == null) it.indicadores = (it.indicadores ? String(it.indicadores).trim() + '\n\n' : '') + bloco;
      else it.forca_e_volume = (typeof it.forca_e_volume === 'string' && it.forca_e_volume ? it.forca_e_volume.trim() + '\n\n' : '') + bloco;
    }
    else if (Array.isArray(relat.ativos)) for (const it of relat.ativos) {
      const a = ativos.find((x) => x.tk === String(it.ticker || '').toUpperCase());
      if (a) it.decisao = decisao(it.cenarios, (a.val && a.val.preco) ?? (a.fund && a.fund.preco), it.qualidade, posDe(a));
    }
    if (!tec && relat.conclusao && Array.isArray(relat.ativos) && relat.ativos.length === 1 && relat.ativos[0].decisao && relat.ativos[0].decisao.preco_justo != null) {
      relat.conclusao.preco_alvo = relat.ativos[0].decisao.preco_justo;
      relat.conclusao.preco_alvo_origem = 'preço justo: média dos cenários ponderada pela probabilidade';
    }
    const resposta: any = { ia: 'Gemini', modelo: modeloUsado, gerado, ativos, relatorio: relat, erros, avisos, lotes: lotes.n, ...(tec ? {} : { macro: mac }), ...(meuOk ? { meu_plano: meuOk } : {}) };
    if (chaveRel && !erros.length && !(rel as any).texto_bruto) await cachePut(chaveRel, resposta);
    return out(resposta);
  } catch (e) {
    return out({ erro: (e as Error).message }, 500);
  }
});



