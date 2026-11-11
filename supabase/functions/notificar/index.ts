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

// Função NOTIFICAR — arquivo único para colar no editor do Supabase (Edge Functions → notificar → index.ts)

// ===== servidor =====
// supabase/functions/notificar/panorama.ts — foto automática do panorama do mercado (v237): horários do usuário e o fechamento da B3,
// que muda com o horário de verão americano (pregão até 17h ou 18h em Brasília).
export type Pano = { on: boolean; h: string[]; fech: number | null };
export function limpaPano(x: unknown): Pano {
  const o = (x && typeof x === 'object' ? x : {}) as any;
  const h = (Array.isArray(o.h) ? o.h : []).map((v: unknown) => String(v || '').trim()).filter((v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)).slice(0, 6);
  const f = o.fech == null || o.fech === '' ? null : Math.round(+o.fech);
  return { on: o.on === true, h: [...new Set<string>(h)], fech: f != null && isFinite(f) && f >= 0 && f <= 240 ? f : null };
}
/** Fim do pregão regular da B3 em minutos de Brasília: 17h quando Nova York está no horário de verão, 18h fora dele. */
export const fechB3 = (dia: string) => (offsetNY(dia) === -4 ? 17 * 60 : 18 * 60);
const ehUtil = (dia: string) => { const w = new Date(dia + 'T12:00:00Z').getUTCDay(); return w > 0 && w < 6; };
/** Horários (em minutos) das fotos do dia; vazio em fim de semana e feriado da B3. */
export function slotsDia(dia: string, p: Pano): number[] {
  if (!p.on || !ehUtil(dia) || b3SemPregao(dia)) return [];
  const L = p.h.map((x) => +x.slice(0, 2) * 60 + +x.slice(3, 5));
  if (p.fech != null) L.push(fechB3(dia) + p.fech);
  return [...new Set(L)].filter((m) => m >= 0 && m < 1440).sort((a, b) => a - b);
}
/** Horário que acabou de chegar (tolerância de 3 min, se o agendador atrasar). */
export const slotAgora = (dia: string, p: Pano, agora: number) => slotsDia(dia, p).find((m) => agora - m >= 0 && agora - m < 3) ?? null;
export const minHM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// ===== servidor =====
// supabase/functions/notificar/combo.ts — alertas por condições combinadas (v235): média móvel, RSI, suporte/resistência,
// volume fora do padrão, variação do dia, divergência entre dois ativos, resultado divulgado e dado econômico importante.
export type Cond =
  | { t: 'mm'; n: number; dir: 'acima' | 'abaixo' | 'cruza_cima' | 'cruza_baixo' }
  | { t: 'rsi'; op: '<' | '>'; v: number }
  | { t: 'sr'; dist: number }
  | { t: 'vol'; x: number }
  | { t: 'var'; op: '<' | '>'; v: number }
  | { t: 'div'; tk2: string; x: number }
  | { t: 'res' }
  | { t: 'eco' };
export type Alc = { id: string; tk: string; nome: string; lg: 'e' | 'ou'; c: Cond[] };
const nn = (v: unknown, lo: number, hi: number) => { const x = +(v as number); return isFinite(x) && x >= lo && x <= hi ? x : null; };
const tkOk = (x: unknown) => { const s = String(x || '').toUpperCase().replace(/[^A-Z0-9.!]/g, '').slice(0, 14); return /^[A-Z0-9.!]{2,14}$/.test(s) ? s : ''; };
export function limpaAlc(x: unknown): Alc[] {
  if (!Array.isArray(x)) return [];
  const out: Alc[] = [];
  for (const a of x.slice(0, 10)) {
    const o = a as any, id = String(o?.id || '').replace(/[^\w-]/g, '').slice(0, 24), tk = tkOk(o?.tk);
    if (!id || !tk) continue;
    const c: Cond[] = [];
    for (const k of (Array.isArray(o.c) ? o.c : []).slice(0, 5)) {
      if (k?.t === 'mm' && nn(k.n, 2, 300) != null && ['acima', 'abaixo', 'cruza_cima', 'cruza_baixo'].includes(k.dir)) c.push({ t: 'mm', n: Math.round(k.n), dir: k.dir });
      else if (k?.t === 'rsi' && (k.op === '<' || k.op === '>') && nn(k.v, 1, 99) != null) c.push({ t: 'rsi', op: k.op, v: +k.v });
      else if (k?.t === 'sr' && nn(k.dist, 0.05, 10) != null) c.push({ t: 'sr', dist: +k.dist });
      else if (k?.t === 'vol' && nn(k.x, 1.1, 20) != null) c.push({ t: 'vol', x: +k.x });
      else if (k?.t === 'var' && (k.op === '<' || k.op === '>') && nn(k.v, -50, 50) != null) c.push({ t: 'var', op: k.op, v: +k.v });
      else if (k?.t === 'div' && tkOk(k.tk2) && nn(k.x, 0.1, 30) != null) c.push({ t: 'div', tk2: tkOk(k.tk2), x: +k.x });
      else if (k?.t === 'res') c.push({ t: 'res' });
      else if (k?.t === 'eco') c.push({ t: 'eco' });
    }
    if (c.length) out.push({ id, tk, nome: String(o.nome || '').replace(/\s+/g, ' ').slice(0, 60), lg: o.lg === 'ou' ? 'ou' : 'e', c });
  }
  return out;
}
export const smaU = (a: number[], n: number) => (a.length >= n ? a.slice(-n).reduce((s, v) => s + v, 0) / n : null);
export function rsiU(cl: number[], p = 14) {
  if (cl.length <= p) return null; let g = 0, l = 0;
  for (let i = 1; i < cl.length; i++) { const d = cl[i] - cl[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= p) { g += up; l += dn; if (i === p) { g /= p; l /= p; } } else { g = (g * (p - 1) + up) / p; l = (l * (p - 1) + dn) / p; } }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
/** Topos e fundos (±3 velas) agrupados a 0,6% → nível mais perto do preço. */
export function nivelPerto(v: number[][], px: number) {
  const L = v.slice(-220), k = 3, pts: number[] = [];
  for (let i = k; i < L.length - k; i++) { let th = true, tl = true; for (let j = i - k; j <= i + k; j++) { if (L[j][2] > L[i][2]) th = false; if (L[j][3] < L[i][3]) tl = false; } if (th) pts.push(L[i][2]); if (tl) pts.push(L[i][3]); }
  if (!pts.length) return null;
  const gr: { v: number; s: number; n: number }[] = [];
  pts.sort((a, b) => a - b).forEach((v) => { const g = gr[gr.length - 1]; if (g && (v - g.v) / g.v <= 0.006) { g.s += v; g.n++; g.v = g.s / g.n; } else gr.push({ v, s: v, n: 1 }); });
  const m = gr.sort((a, b) => Math.abs(a.v - px) - Math.abs(b.v - px))[0];
  return { v: m.v, dist: Math.abs(m.v / px - 1) * 100, tipo: m.v < px ? 'suporte' : 'resistência' };
}
export type Dado = { px: number; v: number[][]; hoje: boolean; volHoje: number | null; frac: number; d1: number | null; res: boolean };
/** Série de fechamentos com o preço atual no lugar da vela de hoje. */
const serie = (d: Dado) => { const cl = d.v.map((x) => x[4]); if (d.hoje) cl[cl.length - 1] = d.px; else cl.push(d.px); return cl; };
export function avalia(a: Alc, d: Dado | null, outros: Record<string, Dado | null>, ecoAgora: string | null): { ok: boolean; motivos: string[] } {
  if (!d || !(d.px > 0)) return { ok: false, motivos: [] };
  const cl = serie(d), ant = cl.slice(0, -1), fx = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 4 : 2 });
  const res = a.c.map((c): string | null => {
    if (c.t === 'mm') {
      const m = smaU(cl, c.n), m0 = smaU(ant, c.n), p0 = ant[ant.length - 1]; if (m == null) return null;
      if (c.dir === 'acima') return d.px > m ? `preço ${fx(d.px)} acima da MM${c.n} (${fx(m)})` : null;
      if (c.dir === 'abaixo') return d.px < m ? `preço ${fx(d.px)} abaixo da MM${c.n} (${fx(m)})` : null;
      if (m0 == null || p0 == null) return null;
      if (c.dir === 'cruza_cima') return p0 <= m0 && d.px > m ? `cruzou para cima da MM${c.n} (${fx(m)})` : null;
      return p0 >= m0 && d.px < m ? `cruzou para baixo da MM${c.n} (${fx(m)})` : null;
    }
    if (c.t === 'rsi') { const r = rsiU(cl); return r != null && (c.op === '<' ? r < c.v : r > c.v) ? `RSI ${r.toFixed(0)} ${c.op === '<' ? 'abaixo' : 'acima'} de ${c.v}` : null; }
    if (c.t === 'sr') { const n = nivelPerto(d.v, d.px); return n && n.dist <= c.dist ? `a ${n.dist.toFixed(2).replace('.', ',')}% do ${n.tipo} ${fx(n.v)}` : null; }
    if (c.t === 'vol') { const vs = d.v.slice(d.hoje ? -21 : -20, d.hoje ? -1 : undefined).map((x) => x[5] || 0).filter((x) => x > 0); if (!vs.length || !(d.volHoje! > 0)) return null; const med = vs.reduce((s, v) => s + v, 0) / vs.length, r = d.volHoje! / (med * Math.max(0.15, Math.min(1, d.frac))); return r >= c.x ? `volume ${r.toFixed(1).replace('.', ',')}× o normal para o horário` : null; }
    if (c.t === 'var') return d.d1 != null && (c.op === '>' ? d.d1 > c.v : d.d1 < c.v) ? `variação do dia ${d.d1.toFixed(2).replace('.', ',')}%` : null;
    if (c.t === 'div') { const o = outros[c.tk2]; if (!o || d.d1 == null || o.d1 == null) return null; const df = d.d1 - o.d1; return Math.abs(df) >= c.x ? `${df > 0 ? '+' : ''}${df.toFixed(2).replace('.', ',')} p.p. contra ${c.tk2}` : null; }
    if (c.t === 'res') return d.res ? 'resultado trimestral divulgado hoje' : null;
    if (c.t === 'eco') return ecoAgora;
    return null;
  });
  const ok = a.lg === 'ou' ? res.some(Boolean) : res.every(Boolean);
  return { ok, motivos: res.filter((x): x is string => !!x) };
}
/** Fração do pregão da B3 (10h–17h) já passada, em minutos de Brasília. */
export const fracPregao = (min: number) => Math.max(0, Math.min(1, (min - 600) / 420));

// ===== mercados =====
// supabase/functions/notificar/mercados.ts
// Abertura dos mercados em horário de Brasília (Brasil sem horário de verão = UTC−3) e checagem de stop/alvo.
// Funções puras, testadas em mercados.test.mts.

export type Mk = 'b3' | 'ny' | 'tk';
export const MK_NOME: Record<Mk, string> = { b3: 'B3', ny: 'Nova York', tk: 'Tóquio' };
const BANDEIRA: Record<Mk, string> = { b3: '🇧🇷', ny: '🇺🇸', tk: '🇯🇵' };

// Feriados com bolsa FECHADA (conferir e atualizar todo ano, como as datas do Copom).
export const FERIADOS: Record<Mk, string[]> = {
  b3: ['2026-11-02', '2026-11-20', '2026-12-24', '2026-12-25', '2026-12-31',
    '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21', '2027-05-27', '2027-11-02', '2027-11-15', '2027-12-24', '2027-12-31'],
  ny: ['2026-11-26', '2026-12-25',
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24'],
  tk: ['2026-11-03', '2026-11-23', '2026-12-31',
    '2027-01-01', '2027-01-04', '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-22', '2027-04-29', '2027-05-03', '2027-05-04', '2027-05-05',
    '2027-07-19', '2027-08-11', '2027-09-20', '2027-09-23', '2027-10-11', '2027-11-03', '2027-11-23', '2027-12-31'],
};

const mkDiaMais = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const semana = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay(); // 0 = domingo
const util = (d: string) => semana(d) >= 1 && semana(d) <= 5;
// DARF: aviso no dia útil anterior ao vencimento e no próprio dia (10h)
export type Darf = { m: string; v: number; venc: string };
export function limpaDarf(x: any): Darf[] {
  if (!Array.isArray(x)) return [];
  return x.slice(0, 3).map((d: any) => ({ m: String(d?.m || '').slice(0, 7), v: +d?.v, venc: String(d?.venc || '').slice(0, 10) })).filter((d: Darf) => /^\d{4}-\d{2}$/.test(d.m) && /^\d{4}-\d{2}-\d{2}$/.test(d.venc) && isFinite(d.v) && d.v > 0 && d.v < 1e7);
}
const somaDia = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
export function darfAvisos(L: Darf[], dia: string, agora: number): { title: string; body: string; chave: string }[] {
  if (agora < 600 || agora >= 603) return [];
  const out: { title: string; body: string; chave: string }[] = [];
  const pregao = (d: string) => util(d) && !FERIADOS.b3.includes(d);
  let ant = somaDia(dia, 1); while (!pregao(ant)) ant = somaDia(ant, 1); // próximo dia útil
  const mes = (m: string) => new Date(m + '-15T12:00:00Z').toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  for (const d of L) {
    if (d.venc === dia) out.push({ title: '🧾 DARF vence hoje', body: `Imposto de ${mes(d.m)}: ${brl(d.v)} (código 6015). Pague hoje para não ter multa.`, chave: `darf-${d.m}-0` });
    else if (d.venc === ant && pregao(dia)) out.push({ title: '🧾 DARF vence amanhã', body: `Imposto de ${mes(d.m)}: ${brl(d.v)} (código 6015). Gere o DARF no Sicalc ou no app do banco.`, chave: `darf-${d.m}-1` });
  }
  return out;
}
// primeiro dia útil do mês na B3 (sem fim de semana nem feriado)
export function primeiroUtilMes(dia: string): boolean {
  const pregao = (d: string) => util(d) && !FERIADOS.b3.includes(d);
  if (!pregao(dia)) return false;
  for (let i = 1; i < +dia.slice(8, 10); i++) if (pregao(dia.slice(0, 8) + String(i).padStart(2, '0'))) return false;
  return true;
}
export const horaTxt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Diferença de Nova York para UTC em horas nesse dia (−4 no horário de verão, −5 fora), pelo fuso oficial. */
export function offsetNY(dia: string): number {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).formatToParts(new Date(dia + 'T15:00:00Z'));
  const m = /GMT([+-]\d+)/.exec(p.find((x) => x.type === 'timeZoneName')?.value || '');
  return m ? +m[1] : -5;
}
/** Abertura de Nova York (9h30 local) em minutos do dia em Brasília: 10:30 no horário de verão americano, 11:30 fora dele. */
export const nyBR = (dia: string) => 9 * 60 + 30 + (-3 - offsetNY(dia)) * 60;

/** Próxima mudança do horário de Nova York em Brasília nos próximos `dias` dias (para avisar antes). */
export function mudancaNY(dia: string, dias = 7): { dia: string; de: string; para: string } | null {
  const hoje = nyBR(dia);
  for (let k = 1; k <= dias; k++) { const d = mkDiaMais(dia, k), v = nyBR(d); if (v !== hoje) return { dia: d, de: horaTxt(hoje), para: horaTxt(v) }; }
  return null;
}

/** Aberturas do dia (em Brasília). Tóquio abre às 9h de lá = 21h do dia anterior aqui, então conta o dia seguinte de Tóquio. */
export function aberturas(dia: string): { mk: Mk; min: number; hora: string; titulo: string; corpo: string }[] {
  const out: { mk: Mk; min: number; hora: string; titulo: string; corpo: string }[] = [];
  if (util(dia) && !b3SemPregao(dia)) out.push({ mk: 'b3', min: 600, hora: '10:00', titulo: `${BANDEIRA.b3} B3 abriu (10:00)`, corpo: 'Mercado à vista aberto. Confira o plano e o limite de perda do dia.' });
  if (util(dia) && !FERIADOS.ny.includes(dia)) {
    const m = nyBR(dia), mu = mudancaNY(dia);
    out.push({ mk: 'ny', min: m, hora: horaTxt(m), titulo: `${BANDEIRA.ny} Nova York abriu (${horaTxt(m)})`,
      corpo: 'NYSE e Nasdaq abertas.' + (mu ? ` Atenção: a partir de ${mu.dia.slice(8, 10)}/${mu.dia.slice(5, 7)} (mudança do horário de verão nos EUA) a abertura passa para ${mu.para} de Brasília.` : '') });
  }
  const tk = mkDiaMais(dia, 1);
  if (util(tk) && !FERIADOS.tk.includes(tk)) out.push({ mk: 'tk', min: 21 * 60, hora: '21:00', titulo: `${BANDEIRA.tk} Tóquio abriu (21:00)`, corpo: 'Sessão asiática começou: atenção aos pares com JPY, AUD e NZD.' });
  return out;
}

// ---------- stop e alvo dos trades abertos ----------
export type Aberto = { id: string; a: string; sd: 'C' | 'V'; st: number | null; al: number[] };
/** Níveis atingidos pelo preço p: 'stop' ou 'a1'/'a2'/'a3' (todos os já tocados). */
export function niveisTocados(t: Aberto, p: number): string[] {
  if (!(p > 0)) return [];
  const c = t.sd === 'C', out: string[] = [];
  if (t.st != null && t.st > 0 && (c ? p <= t.st : p >= t.st)) out.push('stop');
  t.al.forEach((v, i) => { if (v > 0 && (c ? p >= v : p <= v)) out.push('a' + (i + 1)); });
  return out;
}
export function limpaAbertos(x: unknown): Aberto[] {
  if (!Array.isArray(x)) return [];
  const n = (v: unknown) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null);
  return x.slice(0, 40).map((t: any) => ({
    id: String(t?.id || '').slice(0, 40), a: String(t?.a || '').toUpperCase().slice(0, 14), sd: (t?.sd === 'V' ? 'V' : 'C') as 'C' | 'V',
    st: n(t?.st), al: (Array.isArray(t?.al) ? t.al : []).map(n).filter((v: number | null): v is number => v != null).slice(0, 3),
  })).filter((t) => t.id && /^[A-Z0-9$]{3,14}$/.test(t.a) && (t.st != null || t.al.length));
}

// ---------- trava do dia: lembrete de 15 em 15 min e alerta de violação ----------
export type Trava = { dia: string; desde: string; mot: string[]; viol: number };
export function limpaTrava(x: any): Trava | null {
  if (!x || typeof x !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(x.dia))) return null;
  const desde = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(x.desde)) ? String(x.desde) : '';
  const mot = (Array.isArray(x.mot) ? x.mot : []).map((m: unknown) => String(m).replace(/\s+/g, ' ').trim().slice(0, 80)).filter(Boolean).slice(0, 5);
  const viol = Number.isInteger(+x.viol) && +x.viol >= 0 ? Math.min(+x.viol, 99) : 0;
  return desde || viol ? { dia: String(x.dia), desde, mot, viol } : null;
}
const BRONCAS = [
  ['🔒 Dia encerrado', 'Você bateu a regra do dia: {m}. Feche a plataforma. O mercado abre de novo amanhã.'],
  ['🔒 Ainda travado', 'Nenhum trade de hoje compensa quebrar a regra. Faça o debriefing no app e saia da tela.'],
  ['🔒 Não é hora de recuperar', 'Tentar recuperar hoje é como se perde a conta. Amanhã você volta com a cabeça limpa.'],
  ['🔒 Disciplina é o seu edge', 'O plano manda parar: {m}. Quem respeita o stop do dia continua no jogo.'],
];
/** Avisos da trava para este minuto: lembrete a cada 15 min desde a trava (até 22h) e alerta imediato de violação. */
export function travaAvisos(t: Trava | null, dia: string, agora: number): { chave: string; title: string; body: string }[] {
  if (!t || t.dia !== dia) return [];
  const out: { chave: string; title: string; body: string }[] = [];
  const m = t.mot.length ? t.mot.join(', ') : 'limite do dia';
  if (t.desde && agora < 22 * 60) {
    const d = agora - (+t.desde.slice(0, 2) * 60 + +t.desde.slice(3, 5));
    if (d >= 0 && d % 15 < 3) {
      const n = Math.floor(d / 15), [ti, bo] = BRONCAS[n % BRONCAS.length];
      out.push({ chave: `trv|${dia}|${n}`, title: ti, body: bo.replace('{m}', m) });
    }
  }
  if (t.viol > 0) out.push({ chave: `trvv|${dia}|${t.viol}`, title: '🚨 Você operou com a trava ativa', body: `${t.viol} trade(s) depois da trava hoje. Dia marcado como ruim e amanhã é dia de recuperação (metade do limite). Feche a plataforma agora.` });
  return out;
}

// ---------- trades de olho: aviso quando chegar na entrada, passar do gatilho (pivô/pullback) ou invalidar (stop) ----------
export type Olho = { id: string; a: string; sd: 'C' | 'V'; e: number; st: number | null; gl: number | null; glt: string };
export function limpaOlho(x: unknown): Olho[] {
  if (!Array.isArray(x)) return [];
  const n = (v: unknown) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null);
  return x.slice(0, 20).map((t: any) => ({
    id: String(t?.id || '').slice(0, 40), a: String(t?.a || '').toUpperCase().slice(0, 14), sd: (t?.sd === 'V' ? 'V' : 'C') as 'C' | 'V',
    e: n(t?.e) as number, st: n(t?.st), gl: n(t?.gl), glt: String(t?.glt || '').replace(/\s+/g, ' ').slice(0, 60),
  })).filter((t) => t.id && t.e != null && /^[A-Z0-9$]{3,14}$/.test(t.a));
}
/** O que o preço p acionou: 'gat' (passou o gatilho do pivô/pullback), 'ent' (chegou na entrada), 'inv' (passou do stop antes de entrar). */
export function olhoAcionou(t: Olho, p: number): string[] {
  if (!(p > 0)) return [];
  const c = t.sd === 'C', out: string[] = [];
  if (t.st != null && (c ? p <= t.st : p >= t.st)) return ['inv'];
  if (t.gl != null && (c ? p > t.gl : p < t.gl)) out.push('gat');
  if (c ? p >= t.e : p <= t.e) out.push('ent');
  return out;
}

/** Alertas de preço criados na aba Cotações do app: até 20, cada um dispara uma vez só. */
export type Alpx = { id: string; s: string; c: string; op: '>' | '<'; v: number };
export function limpaAlpx(x: unknown): Alpx[] {
  if (!Array.isArray(x)) return [];
  const out: Alpx[] = [];
  for (const a of x.slice(0, 20)) {
    if (!a || typeof a !== 'object') continue;
    const o = a as any, id = String(o.id || '').replace(/[^\w-]/g, '').slice(0, 24), s = String(o.s || '').toUpperCase().slice(0, 40), c = String(o.c || '').replace(/[^\w/.!-]/g, '').toUpperCase().slice(0, 14), v = +o.v;
    if (!id || !/^[A-Z_]+:[A-Z0-9.!/_-]+$/.test(s) || !(o.op === '>' || o.op === '<') || !isFinite(v) || v <= 0) continue;
    out.push({ id, s, c: c || s.split(':')[1], op: o.op, v });
  }
  return out;
}
/** Passou do nível? ">" dispara com o preço no nível ou acima; "<" no nível ou abaixo. */
export const alpxAcionou = (a: Alpx, px: number) => px > 0 && (a.op === '>' ? px >= a.v : px <= a.v);

/** Lembrete diário de inglês: horário, se já estudou hoje e a sequência de dias. */
export type EnLemb = { on: boolean; h: string; feito: string; seq: number };
export function limpaEn(x: unknown): EnLemb | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as any, h = /^\d{2}:\d{2}$/.test(String(o.h)) ? String(o.h) : '20:30';
  return { on: !!o.on, h, feito: /^\d{4}-\d{2}-\d{2}$/.test(String(o.feito || '')) ? String(o.feito) : '', seq: Math.max(0, Math.min(3650, Math.round(+o.seq || 0))) };
}
/** Horário do lembrete no dia: em dia de turno das 8h às 17h (código 8) vai para 18h30; no turno das 16h (código 16), para 14h30. */
export function horaEn(hmin: number, codTurno: string | undefined) {
  if (codTurno === '8' && hmin >= 480 && hmin < 1050) return 1110;
  if (codTurno === '16' && hmin >= 900) return 870;
  return hmin;
}

// ===== servidor =====
// Agenda econômica da semana (calendário do TradingView), em português e no horário de Brasília.
export const AG_PAISES = ['BR', 'US', 'CN', 'EU', 'DE', 'GB', 'JP', 'CA'];
export const AG_NOME: Record<string, string> = { BR: 'Brasil', US: 'EUA', CN: 'China', EU: 'Zona do Euro', DE: 'Alemanha', GB: 'Reino Unido', JP: 'Japão', CA: 'Canadá' };
const BRT = -3 * 3600_000;

/** Janela da semana: do domingo (eventos de "antes da semana", como a China) ao sábado. No sábado já mostra a próxima. */
export function janelaSemana(agoraMs = Date.now(), desloc = 0) {
  const l = new Date(agoraMs + BRT); // relógio de Brasília em campos UTC
  const dow = l.getUTCDay();
  const ini = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()) - (dow === 6 ? -1 : dow) * 86400_000 + desloc * 7 * 86400_000;
  return { de: new Date(ini - BRT).toISOString(), ate: new Date(ini + 6 * 86400_000 - BRT).toISOString() };
}

// Traduções mais comuns (ordem importa: o mais específico primeiro)
const TR: [RegExp, string][] = [
  [/\bNAHB Housing Market In(dex|dx)\b/i, 'Confiança das construtoras (NAHB)'],
  [/\bIGP-10 Inflation Index\b/i, 'IGP-10'], [/\bIGP-M Inflation Index\b/i, 'IGP-M'], [/\bIGP-DI Inflation Index\b/i, 'IGP-DI'],
  [/\bMid-?month CPI\b|\bIPCA-15\b|\bIPCA Inflation Index \(mid-?month\)/i, 'IPCA-15'],
  [/\bIPCA Inflation Index\b/i, 'IPCA'],
  [/\bInterest Rate Decision\b/i, 'Decisão de juros'],
  [/\bCore Inflation Rate\b|\bCore CPI\b/i, 'Núcleo da inflação (CPI)'],
  [/\bInflation Rate\b|\bCPI\b/i, 'Inflação ao consumidor (CPI)'],
  [/\bCore PCE Price Index\b/i, 'Núcleo do PCE'], [/\bPCE Price Index\b/i, 'Inflação PCE'],
  [/\bPPI\b/i, 'Inflação ao produtor (PPI)'],
  [/\bGDP Growth Rate\b|\bGDP\b/i, 'PIB'],
  [/\bRetail Sales\b/i, 'Vendas no varejo'],
  [/\bIndustrial Production\b/i, 'Produção industrial'],
  [/\bFixed Asset Investment\b/i, 'Investimento em ativos fixos'],
  [/\bLoan Prime Rate\b/i, 'LPR (juro de referência)'],
  [/\bUnemployment Rate\b/i, 'Taxa de desemprego'],
  [/\bInitial Jobless Claims\b/i, 'Pedidos de auxílio-desemprego'], [/\bContinuing Jobless Claims\b/i, 'Pedidos contínuos de auxílio-desemprego'],
  [/\bNon ?Farm Payrolls\b/i, 'Payroll (empregos fora do agro)'],
  [/\bADP Employment Change\b/i, 'ADP: emprego privado'],
  [/\bAverage Earnings\b/i, 'Salários médios'], [/\bClaimant Count Change\b/i, 'Pedidos de seguro-desemprego'], [/\bEmployment Change\b/i, 'Variação do emprego'],
  [/\bBuilding Permits\b/i, 'Licenças de construção'], [/\bHousing Starts\b/i, 'Construção de casas iniciadas'],
  [/\bPending Home Sales\b/i, 'Vendas pendentes de imóveis'], [/\bExisting Home Sales\b/i, 'Vendas de imóveis usados'], [/\bNew Home Sales\b/i, 'Vendas de imóveis novos'],
  [/\bMichigan Consumer Sentiment\b/i, 'Sentimento do consumidor (Michigan)'], [/\bMichigan Inflation Expectations\b/i, 'Expectativa de inflação (Michigan)'],
  [/\bInflation Expectations\b/i, 'Expectativa de inflação'],
  [/\bConsumer Confidence\b/i, 'Confiança do consumidor'], [/\bBusiness Confidence\b/i, 'Confiança empresarial'],
  [/\bZEW Economic Sentiment Index\b|\bZEW Economic Sentiment\b/i, 'ZEW: sentimento econômico'],
  [/\bIfo Business Climate\b/i, 'Ifo: clima de negócios'],
  [/\bManufacturing PMI\b/i, 'PMI industrial'], [/\bServices PMI\b/i, 'PMI de serviços'], [/\bComposite PMI\b/i, 'PMI composto'],
  [/\bISM Manufacturing\b/i, 'ISM industrial'], [/\bISM Services\b|\bISM Non-Manufacturing\b/i, 'ISM de serviços'],
  [/\b(CB )?Leading (Economic )?Index\b/i, 'Indicadores antecedentes (LEI)'],
  [/\bTrade Balance\b/i, 'Balança comercial'], [/\bCurrent Account\b/i, 'Conta corrente'],
  [/\bCrude Oil (Inventories|Stocks Change)\b|\bEIA Crude Oil Stocks Change\b/i, 'Estoques de petróleo (EIA)'],
  [/\bDurable Goods Orders\b/i, 'Encomendas de bens duráveis'], [/\bPersonal Income\b/i, 'Renda pessoal'], [/\bPersonal Spending\b/i, 'Gastos pessoais'],
  [/\bFOMC Minutes\b/i, 'Ata do FOMC'], [/\bCopom Minutes\b/i, 'Ata do Copom'], [/\bMonetary Policy Meeting Minutes\b/i, 'Ata de política monetária'],
  [/\bSpeech\b|\bSpeaks\b/i, 'discurso'],
  [/\bBCB Focus Market Readout\b|\bFocus Market Readout\b/i, 'Relatório Focus'],
  [/\bIBC-Br\b.*$/i, 'IBC-Br (prévia do PIB)'],
  [/\bTax Revenue\b/i, 'Arrecadação federal'], [/\bBudget Balance\b/i, 'Resultado fiscal'],
];
const PER: [RegExp, string][] = [[/\bQoQ\b/g, 'tri/tri'], [/\bYoY\b/g, 'anual'], [/\bMoM\b/g, 'mensal'], [/\bPrel(iminary)?\b/gi, 'prévia'], [/\bFinal\b/g, 'final'], [/\bFlash\b/gi, 'prévia']];
export function traduz(t: string) {
  let s = String(t || '').replace(/\*+\s*$/, '').replace(/\s+/g, ' ').trim();
  for (const [re, pt] of TR) if (re.test(s)) { s = s.replace(re, pt); break; }
  for (const [re, pt] of PER) s = s.replace(re, pt);
  return s;
}
/** Rotina que só polui a agenda: leilões de títulos, inspeções de grãos, sondas, Redbook. */
export const ROTINA = /\bBill Auc|\bAuction\b|\bAuc\b|Inspected|Baker Hughes|Rig Count|Redbook|MBA (Mortgage|Purchase)|Mortgage (Applications|Rate)|\bAPI (Crude|Weekly)|Cushing|Gasoline (Inventories|Stocks)|Distillate|Heating Oil|Natural Gas Stor|Refinery|Treasury Bill|Bond Auction|Note Auction|Bund Auction|Gilt Auction|JGB Auction|CFTC|Commitments of Traders|Speculative Net/i;

export type Evento = { id: string; p: string; t: string; orig: string; em: string; imp: number; per?: string; ant?: string; proj?: string; atual?: string; rotina?: boolean; extra?: boolean };
const fmt = (v: any, unit?: string, scale?: string) => v == null || v === '' ? undefined : `${typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : v}${scale || ''}${unit ? (unit === '%' ? '%' : ' ' + unit) : ''}`;

export function normalizaAgenda(raw: any, de: string, ate: string): Evento[] {
  const arr: any[] = Array.isArray(raw?.result) ? raw.result : Array.isArray(raw) ? raw : [];
  const out: Evento[] = [];
  const vistos = new Set<string>();
  for (const x of arr) {
    const p = String(x?.country || '').toUpperCase(), em = x?.date;
    if (!AG_PAISES.includes(p) || !em || isNaN(Date.parse(em))) continue;
    const orig = String(x.title || x.indicator || '').trim(); if (!orig) continue;
    const k = p + '|' + orig + '|' + em; if (vistos.has(k)) continue; vistos.add(k);
    // (v366) o TradingView às vezes marca Copom/Selic, Fed, IPCA, CPI e Payroll como importância 0: esses entram sempre como alta
    const chave = (p === 'BR' || p === 'US') && /interest rate decision|selic|copom|fomc|fed interest|\bipca\b|inflation rate|\bcpi\b|non farm payrolls|nonfarm/i.test(orig + ' ' + String(x.indicator || ''));
    const imp = chave ? 1 : typeof x.importance === 'number' ? Math.max(-1, Math.min(1, x.importance)) : -1;
    out.push({ id: String(x.id ?? k), p, t: traduz(orig), orig, em: new Date(em).toISOString(), imp, per: x.period || undefined,
      ant: fmt(x.previous, x.unit, x.scale), proj: fmt(x.forecast, x.unit, x.scale), atual: fmt(x.actual, x.unit, x.scale), rotina: ROTINA.test(orig) || undefined });
  }
  // Focus do Banco Central: toda segunda às 8h25 (às vezes não vem no calendário)
  for (let d = Date.parse(de); d < Date.parse(ate); d += 86400_000) {
    const l = new Date(d + BRT);
    if (l.getUTCDay() !== 1) continue;
    const dia = l.toISOString().slice(0, 10);
    if (out.some((e) => e.p === 'BR' && /focus/i.test(e.orig + e.t) && new Date(Date.parse(e.em) + BRT).toISOString().slice(0, 10) === dia)) continue;
    out.push({ id: 'focus-' + dia, p: 'BR', t: 'Relatório Focus', orig: 'Focus', em: new Date(Date.parse(dia + 'T08:25:00-03:00')).toISOString(), imp: 0, extra: true });
  }
  return out.sort((a, b) => a.em.localeCompare(b.em) || b.imp - a.imp);
}

// ===== servidor =====
// Briefing da manhã (9h30, dia útil): futuros, EWZ no pré-mercado, petróleo, minério, dólar, agenda do dia e trades de olho perto da entrada.
export type Cot = { px: number; d1: number };
const pc = (v: number | null | undefined) => (v == null || !isFinite(v) ? '–' : (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%');
export function textoBriefing(q: { sp?: Cot | null; ewz?: number | null; ewzTipo?: string; brent?: Cot | null; sgx?: Cot | null; dalian?: number | null; dolar?: Cot | null },
  agenda: { hora: string; t: string; pais: string }[], perto: { a: string; dist: number; sd: string }[]) {
  const p: string[] = [];
  if (q.sp) p.push(`S&P fut ${pc(q.sp.d1)}`);
  if (q.ewz != null) p.push(`EWZ ${q.ewzTipo || 'pré'} ${pc(q.ewz)}`);
  if (q.brent) p.push(`Brent ${pc(q.brent.d1)}`);
  if (q.dalian != null) p.push(`Dalian ${pc(q.dalian)}`);
  else if (q.sgx) p.push(`Minério ${pc(q.sgx.d1)}`);
  if (q.dolar) p.push(`Dólar ${pc(q.dolar.d1)}`);
  // viés simples: soma ponderada (S&P e EWZ pesam mais; dólar subindo pesa contra)
  const pts = (q.sp ? q.sp.d1 * 1 : 0) + (q.ewz != null ? q.ewz * 1 : 0) + (q.dalian != null ? q.dalian * 0.4 : q.sgx ? q.sgx.d1 * 0.4 : 0) - (q.dolar ? q.dolar.d1 * 0.8 : 0);
  const vies = pts > 0.5 ? 'positivo' : pts < -0.5 ? 'negativo' : 'neutro';
  let corpo = p.join(' · ') + '.';
  if (agenda.length) corpo += ' Agenda: ' + agenda.slice(0, 3).map((a) => `${a.hora} ${a.pais} ${a.t}`).join('; ') + '.';
  if (perto.length) corpo += ' De olho: ' + perto.slice(0, 3).map((o) => `${o.a} a ${o.dist.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da entrada`).join(', ') + '.';
  return { title: `☀️ Antes da abertura: viés ${vies}`, body: corpo.length > 300 ? corpo.slice(0, 297) + '…' : corpo };
}

// ===== servidor =====
// Fluxo de investidores na B3 (estrangeiro, institucional, pessoa física...): dado diário divulgado pela B3, com ~2 dias de atraso.
// Fonte: tabela pública do site Dados de Mercado (que republica a B3). Lê o HTML de forma tolerante: cada linha com uma data e 5 valores.
export type LinhaFluxo = { d: string; est: number; inst: number; pf: number; ifin: number; out: number };
const fxNum = (s: string): number | null => {
  const m = /(-?[\d.]+(?:,\d+)?)\s*(bi|mi|mil)?/i.exec(s.replace(/−/g, '-'));
  if (!m) return null;
  const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  if (!isFinite(v)) return null;
  const u = (m[2] || 'mi').toLowerCase();
  return u === 'bi' ? v * 1000 : u === 'mil' ? v / 1000 : v; // tudo em R$ milhões
};
export function parseFluxo(html: string): LinhaFluxo[] {
  const out: LinhaFluxo[] = [];
  for (const tr of html.split(/<tr[\s>]/i).slice(1)) {
    const cel = tr.split(/<\/t[dh]>/i).map((c) => c.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const dm = cel.length ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cel[0]) : null;
    if (!dm) continue;
    const v = cel.slice(1, 6).map(fxNum);
    if (v.length < 5 || v.some((x) => x == null)) continue;
    out.push({ d: `${dm[3]}-${dm[2]}-${dm[1]}`, est: v[0]!, inst: v[1]!, pf: v[2]!, ifin: v[3]!, out: v[4]! });
  }
  return out.sort((a, b) => (a.d < b.d ? 1 : -1));
}
export function resumoFluxo(L: LinhaFluxo[]) {
  if (!L.length) return null;
  const ult = L[0], mes = ult.d.slice(0, 7), ano = ult.d.slice(0, 4);
  const soma = (f: (x: LinhaFluxo) => boolean) => +L.filter(f).reduce((s, x) => s + x.est, 0).toFixed(2);
  let seq = 0; const sg = Math.sign(ult.est); for (const x of L) { if (Math.sign(x.est) === sg && sg !== 0) seq++; else break; }
  return { ultimo: ult, mes: soma((x) => x.d.startsWith(mes)), ano_na_tabela: soma((x) => x.d.startsWith(ano)), dias_seguidos: seq, sentido: sg > 0 ? 'entrada' : sg < 0 ? 'saída' : 'zero', linhas: L.slice(0, 20), dias_no_mes: L.filter((x) => x.d.startsWith(mes)).length };
}
let cFluxo: { ts: number; v: unknown } | null = null;
export async function fluxo() {
  if (cFluxo && Date.now() - cFluxo.ts < 60 * 60_000) return cFluxo.v;
  const r = await fetch('https://www.dadosdemercado.com.br/fluxo', { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', Accept: 'text/html' }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) { if (cFluxo) return cFluxo.v; throw new Error('Fluxo da B3 indisponível agora (' + r.status + ').'); }
  const res = resumoFluxo(parseFluxo(await r.text()));
  if (!res) { if (cFluxo) return cFluxo.v; throw new Error('Não consegui ler a tabela do fluxo.'); }
  const v = { ...res, fonte: 'B3 (via Dados de Mercado)', obs: 'Valores em R$ milhões, mercado à vista (ações). A B3 divulga com cerca de 2 dias úteis de atraso.' };
  cFluxo = { ts: Date.now(), v };
  return v;
}

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
// Vencimentos de opções da B3 (2026 e 2027) para o aviso no briefing da manhã.
export const VENC_ACOES = ['2026-01-16', '2026-02-20', '2026-03-20', '2026-04-17', '2026-05-15', '2026-06-19', '2026-07-17', '2026-08-21', '2026-09-18', '2026-10-16', '2026-11-19', '2026-12-18', '2027-01-15', '2027-02-19', '2027-03-19', '2027-04-16', '2027-05-21', '2027-06-18', '2027-07-16', '2027-08-20', '2027-09-17', '2027-10-15', '2027-11-19', '2027-12-17'];
export const VENC_IBOV = ['2026-01-14', '2026-02-18', '2026-03-18', '2026-04-15', '2026-05-13', '2026-06-17', '2026-07-15', '2026-08-12', '2026-09-16', '2026-10-14', '2026-11-18', '2026-12-16', '2027-01-13', '2027-02-17', '2027-03-17', '2027-04-14', '2027-05-12', '2027-06-16', '2027-07-14', '2027-08-18', '2027-09-15', '2027-10-13', '2027-11-17', '2027-12-15'];
const vcMais = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
/** Próximo dia útil (seg a sex). */
export const proxUtil = (d: string) => { let x = vcMais(d, 1); while ([0, 6].includes(new Date(x + 'T12:00:00Z').getUTCDay())) x = vcMais(x, 1); return x; };
/** Frase para o briefing: hoje ou no próximo pregão vencem opções? */
export function avisoVenc(dia: string): string | null {
  const am = proxUtil(dia), p: string[] = [];
  for (const [L, n] of [[VENC_ACOES, 'opções sobre ações'], [VENC_IBOV, 'opções sobre Ibovespa']] as const) {
    if (L.includes(dia)) p.push(`hoje vencem as ${n}`); else if (L.includes(am)) p.push(`${new Date(am + 'T12:00:00Z').getUTCDay() === 1 ? 'segunda' : 'amanhã'} vencem as ${n}`);
  }
  p.sort((a, b) => +b.startsWith('hoje') - +a.startsWith('hoje'));
  return p.length ? '📆 ' + p.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.' : null;
}

// ===== servidor =====
// Opções abertas: o app manda as pernas (código, subjacente, call/put, strike, vencimento, vendida?) e o servidor avisa
// nos 3 dias antes do vencimento (10h) e quando uma opção vendida entra no dinheiro na semana do vencimento.
export type Opc = { id: string; a: string; sub: string; t: 'C' | 'P'; k: number; v: string; ven: boolean };
export function limpaOpc(x: any): Opc[] {
  if (!Array.isArray(x)) return [];
  return x.slice(0, 30).map((o: any) => ({
    id: String(o?.id || '').slice(0, 40), a: String(o?.a || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12),
    sub: String(o?.sub || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), t: o?.t === 'P' ? 'P' : 'C',
    k: +o?.k > 0 && +o.k < 1e6 ? +o.k : 0, v: /^\d{4}-\d{2}-\d{2}$/.test(String(o?.v)) ? String(o.v) : '', ven: !!o?.ven,
  } as Opc)).filter((o: Opc) => o.id && o.a && o.v);
}
const dif = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
const fx = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export type AvisoOpc = { chave: string; title: string; body: string };
/** agora em minutos do dia; px = preço do subjacente (ou nada). */
export function opcAvisos(L: Opc[], dia: string, agora: number, px: Record<string, number>): AvisoOpc[] {
  const out: AvisoOpc[] = [];
  const porV = new Map<string, Opc[]>();
  for (const o of L) { const d = dif(dia, o.v); if (d < 0 || d > 7) continue; const k = o.id + '|' + o.v; porV.set(k, [...(porV.get(k) || []), o]); }
  for (const [k, os] of porV) {
    const d = dif(dia, os[0].v), p = os[0].sub ? px[os[0].sub] : undefined;
    const itm = os.filter((o) => o.ven && o.k > 0 && p && (o.t === 'C' ? p > o.k : p < o.k));
    const risco = itm.map((o) => `${o.t === 'C' ? 'call' : 'put'} vendida ${fx(o.k)} dentro do dinheiro (${o.sub} a ${fx(p!)})`);
    if (d <= 3 && agora >= 600 && agora < 603) {
      out.push({ chave: `opc|${k}|${dia}`, title: `⏳ ${os[0].a} vence ${d === 0 ? 'hoje' : d === 1 ? 'amanhã' : 'em ' + d + ' dias'}`,
        body: (risco.length ? 'Risco de exercício: ' + risco.join('; ') + '. ' : '') + 'Decida: encerrar, rolar ou deixar vencer. Confira no app.' });
    }
    if (itm.length && agora >= 610 && agora <= 1020) {
      out.push({ chave: `opcx|${k}|${dia}`, title: `⚠ ${os[0].a}: risco de exercício`, body: risco.join('; ') + `. Vence ${d === 0 ? 'hoje' : 'em ' + d + ' dia(s)'}.` });
    }
  }
  return out;
}

// ---------- alertas da grade de opções (dados que a ponte do Profit grava em opcoes_grade) ----------
export type OpAlvo = { c: string; op: '>=' | '<='; v: number };
export type IvResumo = Record<string, { mn: number; mx: number; n: number }>;
export function limpaOpa(x: any): OpAlvo[] {
  if (!Array.isArray(x)) return [];
  return x.slice(0, 20).map((o: any) => ({ c: String(o?.c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12), op: o?.op === '<=' ? '<=' : '>=', v: +o?.v } as OpAlvo)).filter((o: OpAlvo) => o.c && o.v > 0 && o.v < 1e6);
}
export function limpaIvh(x: any): IvResumo {
  const out: IvResumo = {};
  if (!x || typeof x !== 'object') return out;
  for (const [k, v] of Object.entries(x).slice(0, 12)) { const a = String(k).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), r = v as any; if (a && +r?.mx > +r?.mn && +r?.mn > 0 && +r?.n >= 1) out[a] = { mn: +r.mn, mx: +r.mx, n: Math.round(+r.n) }; }
  return out;
}
/** Preço de referência de uma série: meio do book, ou último negócio de hoje. */
export const opPreco = (x: any): number | null => (x?.b > 0 && x?.a >= x?.b ? (x.b + x.a) / 2 : x?.n > 0 && x?.u > 0 ? +x.u : null);
const ivp = (v: any) => { v = +v; if (!(v > 0)) return null; const x = v > 3 ? v / 100 : v; return x > 0.02 && x < 3 ? x : null; };
/** IV no dinheiro (IMPVT do Profit) no vencimento com 7+ dias mais próximo. */
export function ivAtm(row: { spot: number; series: any[] }, dia: string): number | null {
  const S = +row.spot; if (!(S > 0)) return null;
  const ms = [...new Set((row.series || []).map((x) => x.m))].sort();
  for (const m of ms) {
    const L = (row.series || []).filter((x) => x.m === m && ivp(x.ivp) && opPreco(x) != null && Math.abs(x.k - S) / S < 0.06);
    const v = L.length ? (L[0].v || `${m}-28`) : null;
    if (!L.length || (v && dif(dia, v) < 7)) continue;
    const k = L.reduce((b, x) => (Math.abs(x.k - S) < Math.abs(b - S) ? x.k : b), L[0].k), A = L.filter((x) => Math.abs(x.k - k) < 1e-6).map((x) => ivp(x.ivp)!);
    return A.reduce((a, b) => a + b, 0) / A.length;
  }
  return null;
}
export function avisosGrade(rows: { ativo: string; spot: number; series: any[] }[], ivh: IvResumo, opa: OpAlvo[], dia: string, agora: number, ivOn: boolean): AvisoOpc[] {
  const out: AvisoOpc[] = [];
  if (agora < 615 || agora > 1020) return out;            // pregão de opções (10h15 às 17h)
  const fx = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (ivOn) for (const r of rows) {
    const h = ivh[r.ativo]; if (!h || h.n < 20) continue;
    const iv = ivAtm(r, dia); if (iv == null) continue;
    const rank = (iv - h.mn) / (h.mx - h.mn);
    if (rank >= 0.8) out.push({ chave: `opciv|${r.ativo}|${dia}`, title: `📈 ${r.ativo}: volatilidade cara (IV Rank ${Math.round(Math.min(1, rank) * 100)}%)`, body: `A volatilidade implícita no dinheiro está em ${Math.round(iv * 100)}%, perto da máxima do seu histórico (${Math.round(h.mn * 100)}% a ${Math.round(h.mx * 100)}%). Momento de estudar vendas (coberta ou put) no Radar de renda.` });
  }
  const por = new Map<string, any>(); for (const r of rows) for (const x of r.series || []) por.set(String(x.c).toUpperCase(), x);
  for (const a of opa) {
    const x = por.get(a.c), p = x ? opPreco(x) : null; if (p == null) continue;
    if (a.op === '>=' ? p >= a.v : p <= a.v) out.push({ chave: `opa|${a.c}|${a.op}|${a.v}|${dia}`, title: `🎯 ${a.c} chegou a R$ ${fx(p)}`, body: `Seu alerta: ${a.op === '>=' ? 'subir até' : 'cair até'} R$ ${fx(a.v)}. Strike ${fx(+x.k)}${x.v ? ', vence ' + x.v.split('-').reverse().join('/') : ''}.` });
  }
  return out;
}

// ===== servidor =====
// Scanner das regras do backtest: no fechamento, verifica se a regra salva no app deu sinal no último candle diário de cada ativo da lista.
// Mesma lógica do app (seção 85/89 do app.js). Testado em scanner.test.mts.
export type Regra = { set: 'cruz' | 'pull' | 'romp' | 'ifr'; lado: 'c' | 'cv'; stop: 'atr' | 'fundo'; k: number; alvo: number; max: number };
export type Scan = { on: boolean; at: string[]; regra: Regra };
export type Vela = [number, number, number, number, number]; // t, o, h, l, c
const SETS = ['cruz', 'pull', 'romp', 'ifr'];
export function limpaScan(x: any): Scan | null {
  if (!x || typeof x !== 'object' || !x.on) return null;
  const at = (Array.isArray(x.at) ? x.at : []).map((t: any) => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '')).filter((t: string) => /^[A-Z]{4}(3|4|5|6|11)$/.test(t)).slice(0, 25);
  const r = x.regra || {};
  if (!at.length || !SETS.includes(r.set)) return null;
  const n = (v: any, d: number, lo: number, hi: number) => { const y = +v; return isFinite(y) && y >= lo && y <= hi ? y : d; };
  return { on: true, at, regra: { set: r.set, lado: r.lado === 'cv' ? 'cv' : 'c', stop: r.stop === 'fundo' ? 'fundo' : 'atr', k: n(r.k, 1.5, .3, 6), alvo: n(r.alvo, 2, .5, 10), max: n(r.max, 20, 2, 200) } };
}
export function indicadores(C: Vela[]) {
  const n = C.length, cl = C.map((c) => c[4]);
  const ema = (p: number) => { const o: (number | null)[] = []; let e: number | null = null; for (let i = 0; i < n; i++) { e = e == null ? cl[i] : e + (cl[i] - e) * 2 / (p + 1); o.push(i >= p - 1 ? e : null); } return o; };
  const sma = (p: number) => { const o: (number | null)[] = []; let s = 0; for (let i = 0; i < n; i++) { s += cl[i]; if (i >= p) s -= cl[i - p]; o.push(i >= p - 1 ? s / p : null); } return o; };
  const atr: (number | null)[] = []; let a: number | null = null;
  for (let i = 0; i < n; i++) { const tr = i ? Math.max(C[i][2] - C[i][3], Math.abs(C[i][2] - cl[i - 1]), Math.abs(C[i][3] - cl[i - 1])) : C[i][2] - C[i][3]; a = a == null ? tr : (a * 13 + tr) / 14; atr.push(i >= 13 ? a : null); }
  const ifr: (number | null)[] = []; let g = 0, l = 0;
  for (let i = 0; i < n; i++) { if (!i) { ifr.push(null); continue; } const d = cl[i] - cl[i - 1]; if (i <= 14) { g += Math.max(d, 0) / 14; l += Math.max(-d, 0) / 14; } else { g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; } ifr.push(i >= 14 ? (l === 0 ? 100 : 100 - 100 / (1 + g / l)) : null); }
  return { e9: ema(9), m21: sma(21), m20: sma(20), atr, ifr };
}
type Ind = ReturnType<typeof indicadores>;
export function sinal(r: Regra, C: Vela[], I: Ind, i: number): number {
  const c = C[i], p = C[i - 1]; if (!p) return 0; let L = false, S = false;
  if (r.set === 'cruz') { const a = I.e9[i - 1], b = I.m21[i - 1], x = I.e9[i], y = I.m21[i]; if (a != null && b != null && x != null && y != null) { L = a <= b && x > y; S = a >= b && x < y; } }
  else if (r.set === 'pull') { const m = I.m20[i], m5 = I.m20[i - 5]; if (m != null && m5 != null) { L = m > m5 && c[3] <= m * 1.003 && c[4] > m && c[4] > c[1]; S = m < m5 && c[2] >= m * .997 && c[4] < m && c[4] < c[1]; } }
  else if (r.set === 'romp') { if (i >= 21) { let hi = -Infinity, lo = Infinity; for (let k = i - 20; k < i; k++) { hi = Math.max(hi, C[k][2]); lo = Math.min(lo, C[k][3]); } L = c[4] > hi; S = c[4] < lo; } }
  else if (r.set === 'ifr') { const a = I.ifr[i - 1], b = I.ifr[i]; if (a != null && b != null) { L = a < 30 && b >= 30; S = a > 70 && b <= 70; } }
  return L ? 1 : (r.lado === 'cv' && S ? -1 : 0);
}
/** Histórico da regra no ativo (em R) e o sinal do último candle, se houver. */
export function avaliaRegra(r: Regra, C: Vela[]) {
  const I = indicadores(C), rs: number[] = []; let i = 1;
  while (i < C.length - 1) {
    const sg = sinal(r, C, I, i), at = I.atr[i]; if (!sg || at == null) { i++; continue; }
    const e = C[i][4]; let st: number;
    if (r.stop === 'fundo') { let x = sg > 0 ? Infinity : -Infinity; for (let k = Math.max(0, i - 4); k <= i; k++) x = sg > 0 ? Math.min(x, C[k][3]) : Math.max(x, C[k][2]); st = x; } else st = e - sg * r.k * at;
    const risco = Math.abs(e - st); if (!(risco > 0)) { i++; continue; }
    const al = e + sg * r.alvo * risco; let sai: number | null = null, j = i + 1;
    for (; j < C.length; j++) { const c = C[j]; if (sg > 0 ? c[3] <= st : c[2] >= st) { sai = st; break; } if (sg > 0 ? c[2] >= al : c[3] <= al) { sai = al; break; } if (j - i >= r.max) { sai = c[4]; break; } }
    if (sai == null) { j = C.length - 1; sai = C[j][4]; }
    rs.push(sg * (sai - e) / risco); i = Math.max(j, i + 1);
  }
  const u = C.length - 1, sg = sinal(r, C, I, u), at = I.atr[u];
  let hoje: { lado: number; e: number; st: number; al: number } | null = null;
  if (sg && at != null) { const e = C[u][4]; let st = e - sg * r.k * at; if (r.stop === 'fundo') { let x = sg > 0 ? Infinity : -Infinity; for (let k = Math.max(0, u - 4); k <= u; k++) x = sg > 0 ? Math.min(x, C[k][3]) : Math.max(x, C[k][2]); st = x; } hoje = { lado: sg, e, st, al: e + sg * r.alvo * Math.abs(e - st) }; }
  const n = rs.length;
  return { n, ac: n ? rs.filter((x) => x > 0).length / n : null, exp: n ? rs.reduce((a, b) => a + b, 0) / n : null, hoje };
}
export const NOME_SET: Record<string, string> = { cruz: 'cruzamento de médias', pull: 'pullback na MM 20', romp: 'rompimento de 20 dias', ifr: 'IFR saindo do extremo' };

// Lembrete dos planos de estudo: o app manda, para os próximos 14 dias, quantas tarefas há em cada dia e de quais matérias.
export type Estudo = { h: number; por: Record<string, { n: number; m: string }> };
export function limpaEstudo(x: any): Estudo | null {
  if (!x || typeof x !== 'object') return null; const m = /^(\d{2}):(\d{2})$/.exec(String(x.h || '')); if (!m) return null;
  const h = +m[1] * 60 + +m[2]; if (h > 1439) return null; const por: Estudo['por'] = {};
  for (const [d, v] of Object.entries(x.por || {}).slice(0, 20)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && +(v as any)?.n > 0) por[d] = { n: Math.min(50, Math.round(+(v as any).n)), m: String((v as any).m || '').slice(0, 90) };
  return Object.keys(por).length ? { h, por } : null;
}
export function avisoEstudo(e: Estudo | null, dia: string, agora: number) {
  if (!e) return null; const o = e.por[dia]; if (!o || agora - e.h < 0 || agora - e.h >= 3) return null;
  return { title: '📚 Hora de estudar', body: `Hoje: ${o.n} tarefa(s) no seu plano${o.m ? ' (' + o.m + ')' : ''}. Toque para ver.`, chave: 'estudo-' + dia };
}

// ---------- lembretes inteligentes (v177): debriefing pendente e dados faltando ----------
export type Lemb = { dia: string; br: { n: number; deb: boolean }; us: { n: number; deb: boolean }; semStop: number; pend: number };
export function limpaLemb(x: any): Lemb | null {
  if (!x || typeof x !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(x.dia || ''))) return null;
  const n = (v: any) => Math.max(0, Math.min(999, Math.round(+v) || 0)), m = (v: any) => ({ n: n(v?.n), deb: !!v?.deb });
  return { dia: String(x.dia), br: m(x.br), us: m(x.us), semStop: n(x.semStop), pend: n(x.pend) };
}
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
export function avisosLemb(l: Lemb | null, dia: string, agora: number, semana: string) {
  const out: { title: string; body: string; chave: string; r: string; go: string }[] = []; if (!l) return out;
  const na = (h: number) => agora - h >= 0 && agora - h < 3;
  if (l.dia === dia && l.br.n > 0 && !l.br.deb && na(1260)) out.push({ title: '📝 Debriefing da B3 pendente', body: `Você fez ${l.br.n} trade(s) na B3 hoje e ainda não escreveu o resumo. Leva 2 minutos e é o que mais ensina.`, chave: 'lemb-br-' + dia, r: 'deb', go: 'dia' });
  if (l.dia === dia && l.us.n > 0 && !l.us.deb && na(1410)) out.push({ title: '📝 Debriefing dos EUA pendente', body: `Você fez ${l.us.n} trade(s) nos EUA hoje e ainda não fechou o dia. Anote o que funcionou antes de dormir.`, chave: 'lemb-us-' + dia, r: 'debus', go: 'dia' });
  if (semana === 'Sun' && na(1140) && diasEntre(l.dia, dia) <= 7 && (l.pend > 0 || l.semStop > 0)) {
    const p = [l.pend ? `${l.pend} pendência(s) no diário` : '', l.semStop ? `${l.semStop} trade(s) da semana sem stop anotado` : ''].filter(Boolean).join(' e ');
    out.push({ title: '🗂️ Arrume o diário antes da semana', body: `Você tem ${p}. Completar agora deixa a revisão da semana certa.`, chave: 'lemb-sem-' + dia, r: 'pend', go: 'home' });
  }
  return out;
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
export const VERSAO_FN = 'v299';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/notificar/index.ts
// Notificações push do diário:
//   - checklist da manhã (padrão 08:00) e checklist da abertura americana (padrão 18:50), seg a sex, horário de Brasília
//   - aviso alguns minutos antes de notícias importantes do calendário econômico (padrão 5 min)
//
// Passo a passo em notificacoes-setup.sql. Resumo:
//   1) npx web-push generate-vapid-keys
//   2) supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:seu@email.com CRON_SECRET=uma-senha-longa
//   3) supabase functions deploy notificar --no-verify-jwt
//   4) rodar o SQL do agendamento (pg_cron chama a ação "tick" a cada minuto)
//
// Calendário: feed público semanal do Forex Factory (moedas USD, EUR, GBP, JPY, CNY, CAD, AUD, NZD, CHF).
// Ele NÃO traz eventos do Brasil (IPCA, Copom etc.).
// Escala de turno: o app manda os próximos dias junto com as preferências; o aviso da manhã vira "não opere" em dia de turno
// e o da noite avisa a véspera. Dia de Copom também entra no aviso (datas em COPOM_DECISAO).
// Domingo (padrão 18:00): revisão da semana com o resumo calculado pelo app (B3 em R$ e Forex em US$).
// Abertura dos mercados: B3 10:00, Nova York 9h30 de lá (10:30 ou 11:30 de Brasília, pelo horário de verão americano) e Tóquio 21:00.
// Trades abertos: o app manda ativo, stop e alvos; a cotação vem da ponte do Profit (tabela cotacoes) e o aviso sai quando tocar.


const PUB = Deno.env.get('VAPID_PUBLIC') || '';
const PRIV = Deno.env.get('VAPID_PRIVATE') || '';
const SUBJ = Deno.env.get('VAPID_SUBJECT') || 'mailto:contato@exemplo.com';
const CRON = Deno.env.get('CRON_SECRET') || '';
const MAXSUBS = +(Deno.env.get('MAX_SUBS') || 20);
const POR_PESSOA = 5; // aparelhos por pessoa
const TZ = 'America/Sao_Paulo';
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';

// Carregamento sob demanda: se algo estiver errado (biblioteca, chaves, banco), a função responde com a explicação
// em vez de falhar na inicialização com um "Erro 500" sem detalhes.
// deno-lint-ignore no-explicit-any
let wp: any = null;
async function push() {
  if (wp) return wp;
  if (!PUB || !PRIV) throw new Error('Faltam os secrets VAPID_PUBLIC e/ou VAPID_PRIVATE na função.');
  // deno-lint-ignore no-explicit-any
  let mod: any;
  try { mod = await import('npm:web-push@3.6.7'); } catch (e) { throw new Error('Não consegui carregar a biblioteca de push: ' + (e as Error).message); }
  const w = mod.default ?? mod;
  try { w.setVapidDetails(SUBJ, PUB, PRIV); } catch (e) { throw new Error('Chaves VAPID inválidas: ' + (e as Error).message); }
  return (wp = w);
}
// deno-lint-ignore no-explicit-any
let sbc: any = null;
async function db() {
  if (sbc) return sbc;
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('A função não recebeu SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.');
  const { createClient } = await import('npm:@supabase/supabase-js@2');
  return (sbc = createClient(url, key));
}

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*';
  else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};

// ---------- util ----------
const sha = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
const hhmm = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const toMin = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
const hmBR = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

const MOEDAS: Record<string, string> = {
  BRL: 'Brasil', USD: 'EUA', EUR: 'Zona do Euro', GBP: 'Reino Unido', JPY: 'Japão', CNY: 'China', CAD: 'Canadá', AUD: 'Austrália', NZD: 'Nova Zelândia', CHF: 'Suíça',
};

type Turno = { on: boolean; dias: Record<string, string>; niv: Record<string, string> };
type Semana = { id: string; titulo: string; corpo: string };
type Prefs = { m: string; n: string; sem: string; lead: number; cur: string[]; imp: 'high' | 'med'; on: { m: boolean; n: boolean; ev: boolean; sem: boolean; ab: boolean; tr: boolean; trv: boolean; ol: boolean; br: boolean; bal: boolean; giro: boolean; coach: boolean; rel: boolean; opc: boolean; opciv: boolean; ir: boolean; ewz: boolean; lemb: boolean; jr: boolean; pl: boolean; kw: boolean ; res: boolean }; kw: string[]; br: string; bal: string; turno: Turno | null; copom: boolean; semana: Semana | null; semres: Semana | null; alpx: Alpx[]; en: EnLemb | null; mk: Mk[]; abertos: Aberto[]; trava: Trava | null; olho: Olho[]; opc: Opc[]; opa: OpAlvo[]; ivh: IvResumo; darf: Darf[]; scan: Scan | null; estudo: Estudo | null; lemb: Lemb | null; alc: Alc[]; dqp: boolean; pano: Pano };
/** Resumo da semana calculado pelo app (o servidor não lê os trades): id = segunda-feira da semana. */
export function limpaSemana(x: any): Semana | null {
  if (!x || typeof x !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(x.id))) return null;
  const t = String(x.titulo || '').replace(/\s+/g, ' ').trim().slice(0, 80), c = String(x.corpo || '').replace(/\s+/g, ' ').trim().slice(0, 240);
  return t ? { id: String(x.id), titulo: t, corpo: c } : null;
}
/** Segunda-feira da semana de uma data AAAA-MM-DD. */
export const segunda = (d: string) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
/** Escala de turno enviada pelo app (só os próximos dias): códigos 8, 16, 0 e F; nível r = não opere, a = atenção, g = livre. */
export function limpaTurno(t: any): Turno | null {
  if (!t || typeof t !== 'object' || !t.dias || typeof t.dias !== 'object') return null;
  const dias: Record<string, string> = {};
  for (const [k, v] of Object.entries(t.dias).slice(0, 120)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && ['8', '16', '0', 'F'].includes(String(v))) dias[k] = String(v);
  const niv: Record<string, string> = { '8': 'r', '16': 'a', '0': 'a', F: 'g' };
  if (t.niv && typeof t.niv === 'object') for (const c of Object.keys(niv)) if (['r', 'a', 'g'].includes(t.niv[c])) niv[c] = t.niv[c];
  return { on: t.on !== false && t.on !== 0, dias, niv };
}
const TH: Record<string, string> = { '8': '08h–17h', '16': '16h–00h', '0': '00h–08h', F: 'folga' };
/** Janela realista para operar em cada turno (aviso da manhã). */
export const JANELA: Record<string, string> = {
  '16': 'Turno 16h–00h hoje: dá para operar das 9h às 14h30 e parar a tempo de ir para o trabalho.',
  '0': 'Você saiu do turno da madrugada (00h–08h): durma antes. Se for operar, só à tarde e com a mão menor.',
};
// datas de decisão do Copom (quarta-feira); atualizar quando o BC divulgar o calendário do ano seguinte
export const COPOM_DECISAO = ['2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17', '2026-08-05', '2026-09-16', '2026-11-04', '2026-12-09'];
const diaMais = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
/** Texto do aviso da manhã e da noite conforme turno e Copom. */
export function avisoDia(p: Prefs, dia: string, quando: 'm' | 'n') {
  const t = p.turno && p.turno.on ? p.turno : null;
  const alvo = quando === 'm' ? dia : diaMais(dia, 1);
  const c = t ? t.dias[alvo] : undefined, nv = c ? t!.niv[c] || 'g' : 'g';
  const copom = p.copom && COPOM_DECISAO.includes(alvo);
  const extra: string[] = [];
  let title = '', urg = false;
  if (quando === 'm') {
    if (c && nv === 'r') { title = `🛑 Dia de turno (${TH[c]}): não opere hoje`; urg = true; }
    else if (c && nv === 'a') extra.push(JANELA[c] || `Turno ${c} (${TH[c]}) hoje: opere só no horário livre.`);
    if (copom) extra.push('Hoje tem decisão do Copom, por volta das 18h30: cuidado com DI e índice no fim do dia.');
  } else {
    if (c && nv === 'r') extra.push(`Amanhã é dia de turno (${TH[c]}): planeje não operar.`);
    else if (c === '0') extra.push('Hoje à meia-noite você entra no turno 00h–08h: descanse antes e amanhã de manhã não opere sem dormir.');
    if (copom) extra.push('Amanhã tem decisão do Copom.');
  }
  return { title, extra: extra.join(' '), urg };
}
function limpaPrefs(p: any): Prefs {
  p = p && typeof p === 'object' ? p : {};
  const cur = (Array.isArray(p.cur) ? p.cur : ['USD']).map((x: any) => String(x).toUpperCase()).filter((x: string) => MOEDAS[x]);
  return {
    m: hhmm(p.m) ? p.m : '08:00',
    n: hhmm(p.n) ? p.n : '18:50',
    sem: hhmm(p.sem) ? p.sem : '18:00',
    lead: Number.isInteger(+p.lead) && +p.lead >= 1 && +p.lead <= 60 ? +p.lead : 5,
    cur: cur.length ? cur : ['USD'],
    imp: p.imp === 'med' ? 'med' : 'high',
    on: { m: p.on?.m !== false, n: p.on?.n !== false, ev: p.on?.ev !== false, sem: p.on?.sem !== false, ab: p.on?.ab !== false, tr: p.on?.tr !== false, trv: p.on?.trv !== false, ol: p.on?.ol !== false, br: p.on?.br !== false, bal: p.on?.bal !== false, giro: p.on?.giro !== false, coach: p.on?.coach !== false, rel: p.on?.rel !== false, opc: p.on?.opc !== false, opciv: p.on?.opciv !== false, ir: p.on?.ir !== false, ewz: p.on?.ewz === true , lemb: p.on?.lemb !== false, jr: p.on?.jr !== false, pl: p.on?.pl !== false, kw: p.on?.kw !== false, res: p.on?.res !== false },
    kw: (Array.isArray(p.kw) ? p.kw : []).map((x: unknown) => String(x || '').trim().slice(0, 30)).filter((x: string) => x.length >= 2).slice(0, 12),
    bal: hhmm(p.bal) ? p.bal : '07:00',
    br: hhmm(p.br) ? p.br : '09:30',
    turno: limpaTurno(p.turno), copom: p.copom !== false, semana: limpaSemana(p.semana), semres: limpaSemana(p.semres),
    mk: (Array.isArray(p.mk) ? p.mk : ['b3', 'ny', 'tk']).filter((x: string) => ['b3', 'ny', 'tk'].includes(x)) as Mk[],
    abertos: limpaAbertos(p.abertos), trava: limpaTrava(p.trava), olho: limpaOlho(p.olho), alpx: limpaAlpx(p.alpx), en: limpaEn(p.en), opc: limpaOpc(p.opc), opa: limpaOpa(p.opa), ivh: limpaIvh(p.ivh), darf: limpaDarf(p.darf), scan: limpaScan(p.scan), estudo: limpaEstudo(p.estudo), lemb: limpaLemb(p.lemb), alc: limpaAlc(p.alc), dqp: p.dqp === true, pano: limpaPano(p.pano),
  };
}

// ---------- (v266) indicador divulgado: o número no minuto, com a projeção e o anterior ----------
export function resultadosSaiu(evs: { id: string; p: string; t: string; em: string; imp: number; atual?: string; proj?: string; ant?: string }[], agoraMs: number) {
  return evs.filter((e) => e.imp >= 1 && (e.p === 'BR' || e.p === 'US') && e.atual && agoraMs - Date.parse(e.em) >= 0 && agoraMs - Date.parse(e.em) <= 30 * 60_000)
    .slice(0, 6).map((e) => ({ id: String(e.id), title: `${e.p === 'BR' ? '🇧🇷' : '🇺🇸'} ${e.t}: ${e.atual}`.slice(0, 120), body: [e.proj ? `Projeção ${e.proj}` : '', e.ant ? `anterior ${e.ant}` : ''].filter(Boolean).join(' · ').slice(0, 200) || 'Saiu o número.' }));
}
// ---------- palavras-chave no jornal e nos plantões ----------
export const kwNorm = (t: string) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
export function kwAchados(kws: string[], edicoes: any[], plantoes: any[]) {
  const out: { kw: string; titulo: string; chave: string }[] = [];
  const itens: { t: string; txt: string; chave: string }[] = [];
  for (const e of edicoes) for (const m of [e.manchete, ...(e.materias || [])]) if (m?.titulo) itens.push({ t: m.titulo, txt: kwNorm(`${m.titulo} ${m.linha_fina || ''} ${m.texto || ''}`), chave: `${e.edicao || ''}` });
  for (const p of plantoes) if (p?.titulo) itens.push({ t: `⚡ ${p.titulo}`, txt: kwNorm(`${p.titulo} ${p.linha_fina || ''} ${p.texto || ''}`), chave: `pl${p.id || ''}` });
  for (const k of kws) {
    const n = kwNorm(k); if (n.length < 2) continue;
    const re = new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
    const it = itens.find((x) => re.test(x.txt)); if (it) out.push({ kw: k, titulo: it.t, chave: it.chave });
  }
  return out.slice(0, 3);
}

// ---------- calendário ----------
type Ev = { id: string; t: string; cur: string; d: string; imp: 'high' | 'med'; f: string; p: string };
let calC: { ts: number; ev: Ev[] } | null = null;
async function eventos(): Promise<Ev[]> {
  if (calC && Date.now() - calC.ts < 30 * 60 * 1000) return calC.ev;
  const urls = ['https://nfs.faireconomy.media/ff_calendar_thisweek.json', 'https://nfs.faireconomy.media/ff_calendar_nextweek.json'];
  const res = await Promise.allSettled(urls.map(async (u) => {
    const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!r.ok) throw new Error('calendário ' + r.status);
    return await r.json();
  }));
  const out = new Map<string, Ev>();
  for (const r of res) {
    if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue;
    for (const x of r.value) {
      const imp = String(x.impact || '').toLowerCase();
      const d = new Date(x.date);
      const cur = String(x.country || '').toUpperCase();
      if ((imp !== 'high' && imp !== 'medium') || isNaN(+d) || !MOEDAS[cur] || !x.title) continue;
      const id = await sha(`${d.toISOString()}|${cur}|${x.title}`);
      out.set(id, { id, t: String(x.title), cur, d: d.toISOString(), imp: imp === 'high' ? 'high' : 'med', f: String(x.forecast || ''), p: String(x.previous || '') });
    }
  }
  // Brasil (IPCA, Copom, PIB…): o Forex Factory não tem; vem do calendário econômico do TradingView
  try {
    const { de } = janelaSemana(Date.now()), ate = new Date(Date.now() + 8 * 86400_000).toISOString();
    const r = await fetch(`https://economic-calendar.tradingview.com/events?from=${encodeURIComponent(de)}&to=${encodeURIComponent(ate)}&countries=BR`, { headers: { 'User-Agent': UA, Accept: 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' }, signal: AbortSignal.timeout(10_000) });
    if (r.ok) for (const e of normalizaAgenda(await r.json(), de, ate)) {
      if (e.p !== 'BR' || e.imp < 0 || e.rotina || e.extra) continue;
      out.set('br' + e.id, { id: 'br' + e.id, t: e.t + (e.per ? ` (${e.per})` : ''), cur: 'BRL', d: e.em, imp: e.imp === 1 ? 'high' : 'med', f: e.proj || '', p: e.ant || '' });
    }
  } catch { /* segue sem o Brasil */ }
  const ev = [...out.values()].sort((a, b) => +new Date(a.d) - +new Date(b.d));
  if (!ev.length) {
    if (calC) return calC.ev;
    throw new Error('Não consegui ler o calendário econômico agora.');
  }
  calC = { ts: Date.now(), ev };
  return ev;
}

// ---------- envio ----------
async function envia(row: { id: string; sub: any }, payload: Record<string, unknown>, chave?: string) {
  if (chave) {
    const { error } = await (await db()).from('push_log').insert({ chave });
    if (error) return false; // já enviado (chave duplicada)
  }
  try {
    await (await push()).sendNotification(row.sub, JSON.stringify(payload), { TTL: 900, urgency: 'high' });
    return true;
  } catch (e) {
    const sc = (e as { statusCode?: number }).statusCode;
    if (sc === 404 || sc === 410) await (await db()).from('push_subs').delete().eq('id', row.id);
    else console.error('push falhou', sc, (e as Error).message);
    return false;
  }
}

/** Preço com atraso do Yahoo (ações da B3 com .SA), guardado por 2 minutos. */
const cPx = new Map<string, { ts: number; v: number | null }>();
async function precoAtraso(tk: string): Promise<number | null> {
  const c = cPx.get(tk); if (c && Date.now() - c.ts < 120_000) return c.v;
  let v: number | null = null;
  try {
    const sym = /\d/.test(tk) ? tk + '.SA' : tk;
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=5m`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6_000) });
    if (r.ok) { const x = (await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice; v = typeof x === 'number' && x > 0 ? x : null; }
  } catch { /* sem preço */ }
  cPx.set(tk, { ts: Date.now(), v });
  return v;
}

const hmDia = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
/** Dados do briefing (uma vez por minuto para todos): TradingView (S&P futuro, EWZ no pré-mercado, Brent, minério SGX, dólar) e Sina (Dalian). */
let cBr: { ts: number; v: any } | null = null;
async function briefingDados() {
  if (cBr && Date.now() - cBr.ts < 120_000) return cBr.v;
  const v: any = {};
  try {
    const r = await fetch('https://scanner.tradingview.com/global/scan', { method: 'POST', signal: AbortSignal.timeout(8_000), headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { tickers: ['CME_MINI:ES1!', 'TVC:UKOIL', 'SGX:FEF1!', 'FX_IDC:USDBRL', 'AMEX:EWZ'], query: { types: [] } }, columns: ['close', 'change', 'premarket_change', 'postmarket_change'] }) });
    if (r.ok) for (const x of (await r.json())?.data || []) {
      const [px, d1, pre, pos] = x.d || []; const c: Cot | null = typeof px === 'number' && typeof d1 === 'number' ? { px, d1 } : null;
      if (x.s === 'CME_MINI:ES1!') v.sp = c; else if (x.s === 'TVC:UKOIL') v.brent = c; else if (x.s === 'SGX:FEF1!') v.sgx = c; else if (x.s === 'FX_IDC:USDBRL') v.dolar = c;
      else if (x.s === 'AMEX:EWZ') { if (typeof pre === 'number') { v.ewz = pre; v.ewzTipo = 'pré'; } else if (typeof pos === 'number') { v.ewz = pos; v.ewzTipo = 'pós'; } else if (c) { v.ewz = c.d1; v.ewzTipo = 'fech.'; } }
    }
  } catch { /* sem TradingView */ }
  try {
    const r = await fetch('https://hq.sinajs.cn/list=nf_I0', { headers: { 'User-Agent': UA, Referer: 'https://finance.sina.com.cn/' }, signal: AbortSignal.timeout(6_000) });
    if (r.ok) { const m = /hq_str_nf_\w+="([^"]*)"/.exec(new TextDecoder().decode(await r.arrayBuffer())); if (m) { const f = m[1].split(','), px = parseFloat(f[8]) || parseFloat(f[9]), ant = parseFloat(f[10]) || parseFloat(f[5]); if (px > 100 && ant > 100) v.dalian = (px / ant - 1) * 100; } }
  } catch { /* sem Sina */ }
  cBr = { ts: Date.now(), v };
  return v;
}

const JR_OK = new Set<string>(), PL_OK = new Set<string>(); // jornal da manhã e plantões já feitos nesta instância
const GIRO_OK = new Set<string>(); // giros já enviados nesta instância (evita chamar a IA de novo à toa)
// (v237) registro das automações: o app mostra no painel AUTO (tabela automacao_log; sem a tabela, só não registra)
async function logAuto(tarefa: string, ok: boolean, detalhe = '', ms = 0) {
  try { await (await db()).from('automacao_log').insert({ tarefa, ok, detalhe: String(detalhe).slice(0, 400), ms: Math.round(ms) }); } catch { /* sem a tabela */ }
}
// (v237) foto do panorama: guarda os mesmos dados que o app usa para desenhar a imagem (macro, agenda, fluxo, balanços e ADRs)
const ADR_PAD = ['EWZ', 'WEGZY', 'BBSEY', 'BDORY', 'SUZ', 'SID', 'GGB', 'ITUB', 'PBR', 'VALE', 'ABEV', 'BBD'];
const PANO_OK = new Set<string>();
const CART_AVISO = new Set<string>(); let CART_RODANDO = false;
async function fotoPanorama(slot: string): Promise<number | null> {
  const t0 = Date.now(), base = Deno.env.get('SUPABASE_URL') || '', anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const { data: ja } = await (await db()).from('panorama_fotos').select('id').eq('slot', slot).limit(1);
  if (ja && ja[0]) return ja[0].id;
  const chama = async (fn: string, body: unknown) => { try { const r = await fetch(`${base}/functions/v1/${fn}`, { method: 'POST', signal: AbortSignal.timeout(40_000), headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, ...(anon ? { apikey: anon, Authorization: 'Bearer ' + anon } : {}) }, body: JSON.stringify(body) }); return r.ok ? await r.json() : null; } catch { return null; } };
  const [mdo, ag, fe, bal, ad] = await Promise.all([chama('macro', {}), chama('macro', { modo: 'agenda', semana: 0 }), chama('macro', { modo: 'fluxo' }), chama('macro', { modo: 'balancos' }), chama('adrs', { symbols: ADR_PAD })]);
  if (!mdo && !ad) { await logAuto('panorama', false, `${slot}: macro e adrs não responderam`, Date.now() - t0); return null; }
  const dados = { mdo, ag, fe, bal, ad: ad ? { ts: Date.now(), itens: ad.itens || [], fonte: ad.fonte || '', atraso: !!ad.atraso } : null };
  const { data, error } = await (await db()).from('panorama_fotos').insert({ slot, dados }).select('id').single();
  if (error) { await logAuto('panorama', false, `${slot}: ${error.message}`, Date.now() - t0); return null; }
  await logAuto('panorama', true, `${slot}: foto guardada (${[mdo && 'mercados', ag && 'agenda', fe && 'fluxo', bal && 'balanços', ad && 'ADRs'].filter(Boolean).join(', ')})`, Date.now() - t0);
  return data?.id ?? null;
}
async function tick() {
  const now = new Date();
  const P = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now).map((x) => [x.type, x.value]),
  );
  const dia = `${P.year}-${P.month}-${P.day}`;
  const agora = +P.hour * 60 + +P.minute;
  const util = !['Sat', 'Sun'].includes(P.weekday);
  let { data: subs, error: eSubs } = await (await db()).from('push_subs').select('id,sub,prefs,user_id');
  if (eSubs && /user_id/.test(eSubs.message || '')) ({ data: subs } = await (await db()).from('push_subs').select('id,sub,prefs'));
  if (!subs || !subs.length) return { enviados: 0 };
  let evs: Ev[] = [];
  try { evs = await eventos(); } catch (_) { /* segue só com os checklists */ }
  let n = 0;
  const abre = aberturas(dia);
  // cotações da ponte do Profit (só se alguém tiver trade aberto com stop/alvo)
  let cot: Record<string, number> | null = null;
  if (subs.some((s: any) => Array.isArray(s.prefs?.abertos) && s.prefs.abertos.length)) {
    cot = {};
    const { data } = await (await db()).from('cotacoes').select('ticker,ult,updated_at').gte('updated_at', new Date(Date.now() - 5 * 60_000).toISOString());
    for (const r of data || []) if (+r.ult > 0) cot[String(r.ticker).toUpperCase()] = +r.ult;
  }
  // trades de olho: preço do Profit; sem ele, Yahoo com atraso (só em dia útil, das 9h50 às 18h10)
  const olhoTk: string[] = [...new Set<string>(subs.flatMap((x: any) => limpaPrefs(x.prefs).on.ol ? limpaPrefs(x.prefs).olho.map((o) => o.a) : []))];
  const pxOlho: Record<string, number> = {};
  if (olhoTk.length) {
    if (!cot) {
      cot = {};
      const { data } = await (await db()).from('cotacoes').select('ticker,ult,updated_at').gte('updated_at', new Date(Date.now() - 5 * 60_000).toISOString());
      for (const r of data || []) if (+r.ult > 0) cot[String(r.ticker).toUpperCase()] = +r.ult;
    }
    for (const k of olhoTk) if (cot[k]) pxOlho[k] = cot[k];
    if (util && agora >= 565 && agora <= 1090) await Promise.all(olhoTk.filter((k) => !pxOlho[k]).slice(0, 15).map(async (k) => { const v = await precoAtraso(k); if (v) pxOlho[k] = v; }));
  }
  // alertas de preço da aba Cotações: Profit (cotação da ponte) primeiro, TradingView para o resto
  const alTk = [...new Set<string>(subs.flatMap((x: any) => limpaPrefs(x.prefs).alpx.map((a) => a.s)))];
  const pxAl: Record<string, number> = {};
  if (alTk.length) {
    try {
      const r = await fetch('https://scanner.tradingview.com/global/scan', { method: 'POST', signal: AbortSignal.timeout(8_000), headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
        body: JSON.stringify({ symbols: { tickers: alTk.slice(0, 200), query: { types: [] } }, columns: ['close'] }) });
      if (r.ok) for (const x of (await r.json())?.data || []) { const v = x?.d?.[0]; if (typeof v === 'number' && v > 0) pxAl[x.s] = v; }
    } catch { /* sem TradingView: tenta no próximo minuto */ }
    if (!cot) {
      cot = {};
      const { data } = await (await db()).from('cotacoes').select('ticker,ult,updated_at').gte('updated_at', new Date(Date.now() - 5 * 60_000).toISOString());
      for (const r of data || []) if (+r.ult > 0) cot[String(r.ticker).toUpperCase()] = +r.ult;
    }
  }
  // fluxo de opções do EWZ: a cada 5 min a função ewz guarda a evolução (pregão americano); aqui só avisa as boletas grandes
  let ewz: any = null;
  if (util && agora % 5 === 0 && agora >= 600 && agora <= 1140) {
    try {
      const url = Deno.env.get('SUPABASE_URL') || '', anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
      const r = await fetch(url + '/functions/v1/ewz', { method: 'POST', signal: AbortSignal.timeout(40_000), headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, ...(anon ? { apikey: anon, Authorization: 'Bearer ' + anon } : {}) }, body: JSON.stringify({ acao: 'grava' }) });
      ewz = r.ok ? await r.json() : null;
    } catch (e) { console.error('ewz falhou', (e as Error).message); }
  }
  // giro do mercado (dia útil): 7h, 9h10 (abertura do futuro), 10h (abertura da bolsa), 12h, 15h e 17h20 (fechamento) — a função analise escreve, aqui só avisa
  let giro: any = null;
  const falhas: { pref: 'jr' | 'giro'; chave: string; title: string; body: string }[] = []; // automáticos que não saíram na última tentativa
  const motivo = (m: unknown) => String(m || 'sem resposta da IA').replace(/^A redação não conseguiu fechar a edição( agora)?\. ?/, '').replace(/^Motivo: /, '').slice(0, 160);
  const GIRO_H: [number, string][] = [[420, '07'], [550, '0910'], [600, '10'], [720, '12'], [900, '15'], [1040, '1720']], gj = GIRO_H.find(([m]) => agora - m >= 0 && agora - m < 16 && (agora - m) % 3 === 0);
  if (util && !b3SemPregao(dia) && gj && !GIRO_OK.has(`${dia}|${gj[1]}`) && subs.some((x: any) => limpaPrefs(x.prefs).on.giro)) {
    try {
      const url = Deno.env.get('SUPABASE_URL') || '', anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
      const r = await fetch(url + '/functions/v1/analise', { method: 'POST', signal: AbortSignal.timeout(110_000), headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, ...(anon ? { apikey: anon, Authorization: 'Bearer ' + anon } : {}) }, body: JSON.stringify({ modo: 'giro', slot: gj[1] }) });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.texto) { giro = j; GIRO_OK.add(`${dia}|${gj[1]}`); } else { console.error('giro falhou (tenta de novo em 3 min)', r.status, j?.erro); if (agora - gj[0] >= 15) falhas.push({ pref: 'giro', chave: `falha-giro-${dia}-${gj[1]}`, title: `⚠️ O giro das ${gj[1].length > 2 ? gj[1].slice(0, -2) + 'h' + gj[1].slice(-2) : gj[1] + 'h'} não saiu`, body: `${motivo(j?.erro || 'erro ' + r.status)} Abra o Giro para tentar de novo.` }); }
    } catch (e) { console.error('giro falhou', (e as Error).message); if (agora - gj[0] >= 15) falhas.push({ pref: 'giro', chave: `falha-giro-${dia}-${gj[1]}`, title: `⚠️ O giro das ${gj[1].length > 2 ? gj[1].slice(0, -2) + 'h' + gj[1].slice(-2) : gj[1] + 'h'} não saiu`, body: `${motivo((e as Error).message)} Abra o Giro para tentar de novo.` }); }
  }
  const chamaAnalise = async (corpo: Record<string, unknown>) => {
    const url = Deno.env.get('SUPABASE_URL') || '', anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const r = await fetch(url + '/functions/v1/analise', { method: 'POST', signal: AbortSignal.timeout(110_000), headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, ...(anon ? { apikey: anon, Authorization: 'Bearer ' + anon } : {}) }, body: JSON.stringify(corpo) });
    return { ok: r.ok, status: r.status, j: await r.json().catch(() => null) as any };
  };
  // jornal: a edição da manhã fica pronta às 6h30 (dia útil) ou 8h (fim de semana) e avisa quem quiser
  let jornal: any = null, jornalT: any = null;
  const jrMin = util ? 390 : 480;
  if (agora - jrMin >= 0 && agora - jrMin < 30 && (agora - jrMin) % 5 === 0 && !JR_OK.has(dia) && subs.some((x: any) => limpaPrefs(x.prefs).on.jr)) {
    try { const r = await chamaAnalise({ modo: 'jornal' }); if (r.ok && r.j?.manchete?.titulo && !r.j.antiga) { jornal = r.j; JR_OK.add(dia); } else { if (!r.j?.gerando) console.error('jornal falhou (tenta de novo em 5 min)', r.status, r.j?.erro); if (agora - jrMin >= 25) falhas.push({ pref: 'jr', chave: `falha-jornal-${dia}`, title: `⚠️ O jornal das ${util ? '6h30' : '8h'} não fechou`, body: `${motivo(r.j?.motivo || r.j?.erro || (r.j?.antiga ? 'a IA não fechou a edição nova a tempo' : 'erro ' + r.status))} Abra o Jornal para tentar de novo.` }); } } catch (e) { console.error('jornal falhou', (e as Error).message); if (agora - jrMin >= 25) falhas.push({ pref: 'jr', chave: `falha-jornal-${dia}`, title: `⚠️ O jornal das ${util ? '6h30' : '8h'} não fechou`, body: `${motivo((e as Error).message)} Abra o Jornal para tentar de novo.` }); }
  }
  // edição da tarde (pregão em andamento): pronta às 12h05, também sem avisar ninguém
  if (util && agora - 725 >= 0 && agora - 725 < 30 && (agora - 725) % 5 === 0 && !JR_OK.has(dia + '|m') && subs.some((x: any) => limpaPrefs(x.prefs).on.jr)) {
    try { const r = await chamaAnalise({ modo: 'jornal' }); if (r.ok && r.j?.manchete?.titulo && !r.j.antiga) JR_OK.add(dia + '|m'); else if (!r.j?.gerando) console.error('jornal do meio-dia falhou (tenta de novo em 5 min)', r.status, r.j?.erro); } catch (e) { console.error('jornal do meio-dia falhou', (e as Error).message); }
  }
  // edição da noite (fechamento): a analise fecha às 17h35 sem avisar ninguém, para quem abrir o jornal já encontrar pronta (sem esperar a IA)
  if (util && agora - 1055 >= 0 && agora - 1055 < 30 && (agora - 1055) % 5 === 0 && !JR_OK.has(dia + '|t') && subs.some((x: any) => limpaPrefs(x.prefs).on.jr)) {
    try { const r = await chamaAnalise({ modo: 'jornal' }); if (r.ok && r.j?.manchete?.titulo && !r.j.antiga) { JR_OK.add(dia + '|t'); if (!r.j.cache) jornalT = r.j; } else if (!r.j?.gerando) console.error('jornal da tarde falhou (tenta de novo em 5 min)', r.status, r.j?.erro); } catch (e) { console.error('jornal da tarde falhou', (e as Error).message); }
  }
  // plantão: 10 a 25 min depois de um indicador forte do Brasil ou dos EUA, a analise escreve uma matéria curta com o número
  const plantoes: any[] = [];
  if (agora >= 360 && agora <= 1260 && agora % 5 === 0 && subs.some((x: any) => limpaPrefs(x.prefs).on.pl)) {
    const ag = Date.now(), alvo = evs.filter((e) => e.imp === 'high' && ['BRL', 'USD'].includes(e.cur) && !PL_OK.has(e.id) && ag - Date.parse(e.d) >= 10 * 60_000 && ag - Date.parse(e.d) <= 25 * 60_000).slice(0, 2);
    for (const e of alvo) {
      try { const r = await chamaAnalise({ modo: 'plantao', evento: { id: e.id, t: e.t, cur: e.cur, d: e.d, f: e.f, p: e.p } }); if (r.ok) { PL_OK.add(e.id); if (r.j?.titulo && !r.j.cache) plantoes.push(r.j); } } catch (x) { console.error('plantão falhou', (x as Error).message); }
    }
  }
  // scanner das regras do backtest: candles diários (Yahoo) no fechamento, 18h40
  const velas: Record<string, Vela[]> = {};
  if (util && agora >= 1120 && agora < 1123) {
    const tks = [...new Set<string>(subs.flatMap((x: any) => { const q = limpaPrefs(x.prefs); return q.scan ? q.scan.at : []; }))].slice(0, 60);
    await Promise.all(tks.map(async (tk) => {
      try {
        const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tk + '.SA')}?range=2y&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
        if (!r.ok) return; const j = (await r.json())?.chart?.result?.[0], ts: number[] = j?.timestamp || [], q = j?.indicators?.quote?.[0] || {}, out: Vela[] = [];
        for (let i = 0; i < ts.length; i++) { const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i]; if ([o, h, l, c].every((v: any) => typeof v === 'number' && v > 0)) out.push([ts[i], o, h, l, c]); }
        if (out.length > 60 && hmDia(new Date(out[out.length - 1][0] * 1000).toISOString()) === dia) velas[tk] = out;
      } catch { /* sem dados */ }
    }));
  }
  // grade de opções (tabela opcoes_grade) de quem pediu alertas de IV ou de preço
  let grade: Record<string, any[]> | null = null;
  if (util && agora >= 615 && agora <= 1020) {
    const ids = [...new Set(subs.filter((x: any) => { const q = limpaPrefs(x.prefs); return x.user_id && q.on.opc && (q.opa.length || Object.keys(q.ivh).length); }).map((x: any) => x.user_id))];
    if (ids.length) { const { data, error } = await (await db()).from('opcoes_grade').select('user_id,ativo,spot,series').in('user_id', ids); if (!error && data) { grade = {}; for (const r of data) (grade[r.user_id] ??= []).push(r); } }
  }
  // opções abertas: preço do subjacente (Profit; sem ele, Yahoo com atraso) para o risco de exercício
  const opcTk: string[] = util && agora >= 600 && agora <= 1020 ? [...new Set<string>(subs.flatMap((x: any) => { const q = limpaPrefs(x.prefs); return q.on.opc ? q.opc.filter((o) => o.ven && o.sub).map((o) => o.sub) : []; }))] : [];
  const pxOpc: Record<string, number> = {};
  if (opcTk.length) {
    if (!cot) {
      cot = {};
      const { data } = await (await db()).from('cotacoes').select('ticker,ult,updated_at').gte('updated_at', new Date(Date.now() - 5 * 60_000).toISOString());
      for (const r of data || []) if (+r.ult > 0) cot[String(r.ticker).toUpperCase()] = +r.ult;
    }
    for (const k of opcTk) if (cot[k]) pxOpc[k] = cot[k];
    await Promise.all(opcTk.filter((k) => !pxOpc[k]).slice(0, 10).map(async (k) => { const v = await precoAtraso(k); if (v) pxOpc[k] = v; }));
  }
  // (v266) resultado do indicador no minuto: calendário do TradingView com o número divulgado (Brasil e EUA, alta importância)
  let saiu: { id: string; title: string; body: string }[] = [];
  const alcTodos = subs.flatMap((x: any) => limpaPrefs(x.prefs).alc), alcHora = util && agora >= 600 && agora <= 1095 && agora % 5 === 0 && alcTodos.length > 0;
  if (util && agora >= 360 && agora <= 1320 && (subs.some((x: any) => limpaPrefs(x.prefs).on.res) || (alcHora && alcTodos.some((a) => a.c.some((c) => c.t === 'eco'))))) {
    try {
      const de = new Date(Date.now() - 6 * 36e5).toISOString(), ate = new Date(Date.now() + 36e5).toISOString();
      const r = await fetch(`https://economic-calendar.tradingview.com/events?from=${encodeURIComponent(de)}&to=${encodeURIComponent(ate)}&countries=BR,US`, { headers: { 'User-Agent': UA, Accept: 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' }, signal: AbortSignal.timeout(8_000) });
      if (r.ok) saiu = resultadosSaiu(normalizaAgenda(await r.json(), de, ate), Date.now());
    } catch { /* tenta no próximo minuto */ }
  }
  // (v269) alertas combinados: a cada 5 minutos no pregão, com velas diárias do Yahoo e preço do Profit quando houver
  const dAlc: Record<string, DadoAlc | null> = {};
  if (alcHora) {
    const tks = [...new Set<string>(alcTodos.flatMap((a) => [a.tk, ...a.c.filter((c) => c.t === 'div').map((c: any) => c.tk2)]))].slice(0, 25);
    const resHoje = new Set<string>();
    if (alcTodos.some((a) => a.c.some((c) => c.t === 'res'))) {
      try {
        const sy = tks.map((t) => (/^[A-Z]{4}\d{1,2}$/.test(t) ? 'BMFBOVESPA:' + t : t));
        const r = await fetch('https://scanner.tradingview.com/global/scan', { method: 'POST', signal: AbortSignal.timeout(8_000), headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' }, body: JSON.stringify({ symbols: { tickers: sy, query: { types: [] } }, columns: ['earnings_release_date', 'earnings_release_next_date'] }) });
        if (r.ok) for (const x of (await r.json())?.data || []) if ((x?.d || []).some((t: unknown) => typeof t === 'number' && hmDia(new Date(t * 1000).toISOString()) === dia)) resHoje.add(String(x.s).split(':').pop()!);
      } catch { /* sem a data do resultado */ }
    }
    if (!cot) { cot = {}; const { data } = await (await db()).from('cotacoes').select('ticker,ult,updated_at').gte('updated_at', new Date(Date.now() - 5 * 60_000).toISOString()); for (const r of data || []) if (+r.ult > 0) cot[String(r.ticker).toUpperCase()] = +r.ult; }
    await Promise.all(tks.map(async (tk) => {
      try {
        const sym = /^[A-Z]{4}\d{1,2}$/.test(tk) ? tk + '.SA' : tk === 'IBOV' ? '^BVSP' : tk;
        const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8_000) });
        if (!r.ok) { dAlc[tk] = null; return; }
        const R0 = (await r.json())?.chart?.result?.[0], ts: number[] = R0?.timestamp || [], q = R0?.indicators?.quote?.[0] || {}, v: number[][] = [];
        ts.forEach((t, i) => { if ([q.open?.[i], q.high?.[i], q.low?.[i], q.close?.[i]].every((x) => typeof x === 'number')) v.push([t, q.open[i], q.high[i], q.low[i], q.close[i], q.volume?.[i] || 0]); });
        if (v.length < 25) { dAlc[tk] = null; return; }
        const hoje = hmDia(new Date(v[v.length - 1][0] * 1000).toISOString()) === dia, px = cot![tk] || R0?.meta?.regularMarketPrice || v[v.length - 1][4];
        const fech = hoje ? v[v.length - 2][4] : v[v.length - 1][4];
        dAlc[tk] = { px, v, hoje, volHoje: hoje ? v[v.length - 1][5] : null, frac: fracPregao(agora), d1: fech > 0 ? (px / fech - 1) * 100 : null, res: resHoje.has(tk) };
      } catch { dAlc[tk] = null; }
    }));
  }
  // (v237) foto automática do panorama nos horários de cada usuário (e no fechamento da B3, que muda com o horário de verão americano)
  const panoSlots = new Map<number, any[]>();
  for (const x of subs as any[]) { const q = limpaPrefs(x.prefs), m = slotAgora(dia, q.pano, agora); if (m != null) (panoSlots.get(m) || panoSlots.set(m, []).get(m)!).push(x); }
  for (const [m, L] of panoSlots) {
    const slot = `${dia} ${minHM(m)}`;
    try {
      const id = await fotoPanorama(slot);
      if (id != null && !PANO_OK.has(slot)) {
        let k = 0; const fech = m >= fechB3(dia);
        for (const x of L) if (await envia(x, { title: `📸 Panorama das ${minHM(m)} pronto`, body: fech ? 'Fechamento do mercado: a imagem está pronta para mandar no grupo.' : 'A imagem do mercado está pronta para mandar no grupo.', tag: 'pano', data: { go: 'pano', r: String(id) } }, `${x.id}|pano|${slot}`)) { n++; k++; }
        PANO_OK.add(slot); await logAuto('panorama', true, `${slot}: ${k} aviso(s) enviado(s)`);
      }
    } catch (e) { await logAuto('panorama', false, `${slot}: ${(e as Error).message}`); }
  }
  // (v279) relatório automático da carteira: depois do fechamento da B3 (17h ou 18h, conforme o horário de verão americano) + folga;
  // cada minuto avança um pedaço (ativos com mudança relevante ganham relatório novo) até o consolidado ficar pronto.
  if (util && !b3SemPregao(dia) && !CART_RODANDO) {
    let cfgs: any[] = [];
    try { const { data } = await (await db()).from('carteira_cfg').select('user_id,cfg,estado'); cfgs = (data || []).filter((r: any) => r.cfg && r.cfg.on === true); } catch { /* sem a tabela */ }
    const vez = cfgs.find((r: any) => { const ini = fechB3(dia) + Math.max(10, Math.min(120, +r.cfg.off || 20)); const e = r.estado && r.estado.ref === dia ? r.estado : null; return agora >= ini && agora < ini + 150 && !(e && (e.cons || e.erro_cons)); });
    if (vez) {
      CART_RODANDO = true; const t0 = Date.now();
      try {
        const r = await chamaAnalise({ modo: 'carteira_auto', uid: vez.user_id, ms: 95_000 });
        const e = r.j || {};
        await logAuto('carteira', r.ok && !e.erro, r.ok ? `${dia}: ${e.feitos?.length || 0} relatório(s) novo(s), ${e.reap?.length || 0} sem mudança, ${e.pendentes?.length || 0} pendente(s)${e.cons ? ', consolidado pronto' : ''}${e.erro_cons ? ', consolidado falhou: ' + e.erro_cons : ''}` : `${dia}: ${e.erro || 'erro ' + r.status}`, Date.now() - t0);
        if ((e.cons || e.erro_cons) && !CART_AVISO.has(vez.user_id + dia)) {
          CART_AVISO.add(vez.user_id + dia);
          for (const x of (subs as any[]).filter((y: any) => y.user_id === vez.user_id)) if (await envia(x, e.cons ? { title: '📊 Relatório da carteira pronto', body: `${e.feitos?.length || 0} ativo(s) com relatório novo, ${e.reap?.length || 0} sem mudança relevante. Toque para ler.`, tag: 'cart', data: { go: 'carteiras', r: String(e.cons) } } : { title: '⚠️ Relatório da carteira não saiu', body: String(e.erro_cons).slice(0, 140), tag: 'cart', data: { go: 'carteiras' } }, `${x.id}|cart|${dia}`)) n++;
        }
      } catch (er) { await logAuto('carteira', false, `${dia}: ${(er as Error).message}`, Date.now() - t0); }
      finally { CART_RODANDO = false; }
    }
  }
  // limpeza diária (3h): log das automações com mais de 14 dias e fotos com mais de 30
  if (agora === 180) { try { await (await db()).from('automacao_log').delete().lt('em', new Date(Date.now() - 14 * 864e5).toISOString()); await (await db()).from('panorama_fotos').delete().lt('gerado', new Date(Date.now() - 30 * 864e5).toISOString()); await logAuto('limpeza', true, 'registros antigos apagados'); } catch { /* sem as tabelas */ } }
  // (v271) ponte do Profit parada no meio do pregão: avisa quem pediu (Data Center → aviso de integridade)
  const ultPonte: Record<string, number> = {};
  if (util && agora >= 605 && agora <= 1075 && subs.some((x: any) => x.user_id && limpaPrefs(x.prefs).dqp)) {
    try {
      const { data } = await (await db()).from('cotacoes').select('user_id,updated_at').gte('updated_at', new Date(Date.now() - 60 * 60_000).toISOString());
      for (const r of data || []) { const t = Date.parse(r.updated_at); if (r.user_id && t > (ultPonte[r.user_id] || 0)) ultPonte[r.user_id] = t; }
    } catch { /* sem a tabela */ }
  }
  if (alcHora) await logAuto('alertas combinados', Object.values(dAlc).some(Boolean) || !Object.keys(dAlc).length, `${alcTodos.length} alerta(s) conferido(s); dados de ${Object.values(dAlc).filter(Boolean).length}/${Object.keys(dAlc).length} ativo(s)`);
  if (saiu.length) await logAuto('resultado no minuto', true, saiu.map((x) => x.title).join(' · ').slice(0, 300));
  const ecoTxt = saiu.length ? saiu[0].title.replace(/^\S+\s/, '') : null;
  for (const s of subs) {
    const p = limpaPrefs(s.prefs);
    if (p.dqp && s.user_id && ultPonte[s.user_id]) {
      const u = ultPonte[s.user_id], min = (Date.now() - u) / 60_000;
      if (min >= 5 && min <= 60) {
        const hh = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(u));
        if (await envia(s, { title: '⚠️ Ponte do Profit parada', body: `Nenhuma cotação nova desde ${hh}. O PC ou o Profit pode ter desligado; o terminal está usando o TradingView (15 min).`, tag: 'ponte', data: { go: 'term', r: 'dq' } }, `${s.id}|ponte|${dia}|${Math.floor(agora / 120)}`)) { n++; await logAuto('ponte do Profit', false, `parada desde ${hh}: aviso enviado`); }
      }
    }
    if (alcHora) for (const a of p.alc) {
      const r = avaliaAlc(a, dAlc[a.tk] || null, dAlc, ecoTxt);
      if (r.ok && await envia(s, { title: `⚡ ${a.tk}: ${a.nome || 'alerta combinado'}`, body: r.motivos.join(' · ').slice(0, 220) + '. Não é recomendação.', tag: 'alc-' + a.id, data: { go: 'term', r: 'alc' } }, `${s.id}|alc|${a.id}|${dia}`)) n++;
    }
    if (p.on.res) for (const a of saiu) if (await envia(s, { title: a.title, body: a.body, tag: 'res-' + a.id, data: { go: 'term', r: 'eco' } }, `${s.id}|res|${a.id}`)) n++;
    // grade de opções da ponte: IV Rank alto e preço-alvo de série
    if (util && p.on.opc && grade && s.user_id && grade[s.user_id]) for (const a of avisosGrade(grade[s.user_id], p.ivh, p.opa, dia, agora, p.on.opciv)) if (await envia(s, { title: a.title, body: a.body, tag: a.chave, data: { go: 'mercado', r: a.chave.startsWith('opciv') ? 'renda' : 'opc' } }, `${s.id}|${a.chave}`)) n++;
    // opções: vencimento nos próximos 3 dias (10h) e opção vendida dentro do dinheiro na semana do vencimento
    if (util && p.on.opc && p.opc.length) for (const a of opcAvisos(p.opc, dia, agora, pxOpc)) if (await envia(s, { title: a.title, body: a.body, tag: a.chave, data: { go: 'trades' } }, `${s.id}|${a.chave}`)) n++;
    // resumo do seu dia (dia útil, 18h05): o app monta com a IA quando você toca
    if (util && p.on.coach && agora - 1085 >= 0 && agora - 1085 < 3 && await envia(s, { title: '🧭 Seu resumo do dia', body: 'Toque para ver como foram seus trades e checklists de hoje, comparados com o que o mercado fez.', tag: 'coach-' + dia, data: { go: 'dia', r: 'coach' } }, `${s.id}|coach|${dia}`)) n++;
    // relatório da semana (sexta, 19h): checklists da manhã e da noite e as operações de segunda a sexta
    // (v188) com os números da semana que o app mandou: resultado, acerto, melhor e pior trade e uma coisa para corrigir
    if (P.weekday === 'Fri' && p.on.rel && agora - 1140 >= 0 && agora - 1140 < 3) {
      const sr = p.semres && p.semres.id === segunda(dia) ? p.semres : null;
      if (await envia(s, { title: sr ? sr.titulo : '📋 Relatório da semana pronto', body: sr ? sr.corpo || 'Toque para ver o relatório da semana.' : 'Seus checklists (manhã e noite) e suas operações de segunda a sexta, com o comentário da IA.', tag: 'rel-' + dia, data: { go: 'home', r: 'relsem' } }, `${s.id}|rel|${dia}`)) n++;
    }
    // EWZ: boleta acima de US$ 1 milhão (no máximo um aviso a cada 20 minutos)
    if (p.on.ewz && ewz?.boletas?.length) {
      const us = (v: number) => 'US$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi', L = ewz.boletas.slice(0, 3).map((b: any) => `${us(b.premio)} em ${b.t === 'C' ? 'calls' : 'puts'} ${b.k} (${String(b.venc).slice(8, 10)}/${String(b.venc).slice(5, 7)}), ${b.lado === 'C' ? 'provável compra' : b.lado === 'V' ? 'provável venda' : 'no meio do spread'}${b.vol > b.oi ? ', volume > OI' : ''}`);
      if (await envia(s, { title: `🐋 EWZ: boleta relevante · viés ${ewz.vies}`, body: L.join(' · ').slice(0, 230), tag: 'ewz-' + dia, data: { go: 'mercado', r: 'ewz' } }, `${s.id}|ewz|${dia}|${Math.floor(agora / 20)}`)) n++;
    }
    // planos de estudo: lembrete no horário escolhido, nos dias com tarefa
    { const a = avisoEstudo(p.estudo, dia, agora); if (a && await envia(s, { title: a.title, body: a.body, tag: a.chave, data: { go: 'estudos', r: 'estudo' } }, `${s.id}|${a.chave}`)) n++; }
    // scanner: sinais da regra salva no último candle diário
    if (p.scan && Object.keys(velas).length) {
      const fx = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), achou: string[] = [];
      for (const tk of p.scan.at) { const C = velas[tk]; if (!C) continue; const a = avaliaRegra(p.scan.regra, C); if (!a.hoje) continue;
        achou.push(`${tk} ${a.hoje.lado > 0 ? 'compra' : 'venda'} ${fx(a.hoje.e)} (stop ${fx(a.hoje.st)}, alvo ${fx(a.hoje.al)})${a.n >= 5 && a.ac != null && a.exp != null ? ` · histórico ${Math.round(a.ac * 100)}% de acerto, ${a.exp >= 0 ? '+' : ''}${fx(a.exp)}R` : ''}`); }
      if (achou.length && await envia(s, { title: `🔎 Scanner: ${achou.length} sinal(is) de ${NOME_SET[p.scan.regra.set]}`, body: achou.slice(0, 4).join(' · ').slice(0, 230), tag: 'scan-' + dia, data: { go: 'estudos', r: 'scanner' } }, `${s.id}|scan|${dia}`)) n++;
    }
    // lembretes: debriefing pendente (21h B3, 23h30 EUA) e pendências no domingo (19h)
    if (p.on.lemb) for (const a of avisosLemb(p.lemb, dia, agora, P.weekday)) if (await envia(s, { title: a.title, body: a.body, tag: a.chave, data: { go: a.go, r: a.r } }, `${s.id}|${a.chave}`)) n++;
    // DARF: dia útil anterior e dia do vencimento, 10h
    if (p.on.ir) for (const a of darfAvisos(p.darf, dia, agora)) if (await envia(s, { title: a.title, body: a.body, tag: a.chave, data: { go: 'home', r: 'ir' } }, `${s.id}|${a.chave}`)) n++;
    // fechamento do mês (1º dia útil do mês, 19h05): resumo do mês anterior com comparação e IA
    if (p.on.rel && agora - 1145 >= 0 && agora - 1145 < 3 && primeiroUtilMes(dia) && await envia(s, { title: '📊 Fechamento do mês pronto', body: 'Resultado, acerto, setups e erros do mês passado comparados com o mês anterior, com o comentário da IA e PDF.', tag: 'relmes-' + dia, data: { go: 'home', r: 'relmes' } }, `${s.id}|relmes|${dia}`)) n++;
    if (giro && p.on.giro && await envia(s, { title: `📰 ${giro.titulo}`.slice(0, 120), body: giro.texto.length > 230 ? giro.texto.slice(0, 227) + '…' : giro.texto, tag: `giro-${dia}-${giro.slot || giro.janela}`, data: { go: 'mercado', r: 'giro' } }, `${s.id}|giro|${dia}|${giro.slot || giro.janela}`)) n++;
    if (jornal && p.on.jr && await envia(s, { title: `📰 Jornal do Pregão: ${jornal.manchete.titulo}`.slice(0, 120), body: String(jornal.manchete.linha_fina || 'O jornal de hoje está pronto.').slice(0, 230), tag: `jornal-${dia}`, data: { go: 'mercado', r: 'jornal' } }, `${s.id}|jornal|${dia}`)) n++;
    for (const pl of plantoes) if (p.on.pl && await envia(s, { title: `⚡ Plantão: ${pl.titulo}`.slice(0, 120), body: String(pl.linha_fina || '').slice(0, 230), tag: `plantao-${pl.id}`, data: { go: 'mercado', r: 'jornal' } }, `${s.id}|plantao|${dia}|${pl.id}`)) n++;
    // automático que não saiu: avisa uma vez, com o motivo (quem tem o aviso daquele automático ligado)
    for (const f of falhas) if ((f.pref === 'jr' ? p.on.jr : p.on.giro) && await envia(s, { title: f.title, body: f.body, tag: f.chave, data: { go: 'mercado', r: f.pref === 'jr' ? 'jornal' : 'giro' } }, `${s.id}|falha|${dia}|${f.chave}`)) n++;
    // palavras-chave: avisa quando o jornal ou um plantão falar de um assunto que você cadastrou
    if (p.on.kw && p.kw.length) for (const a of kwAchados(p.kw, [jornal, jornalT].filter(Boolean), plantoes)) if (await envia(s, { title: `🔎 ${a.kw} no jornal`.slice(0, 120), body: a.titulo.slice(0, 230), tag: `kw-${dia}-${a.kw}`, data: { go: 'mercado', r: 'jornal' } }, `${s.id}|kw|${dia}|${kwNorm(a.kw)}|${a.chave}`)) n++;
    // inglês: lembrete do dia (não manda se já estudou hoje; foge do horário de turno)
    if (p.en && p.en.on && p.en.feito !== dia) {
      const [hh, mm] = p.en.h.split(':').map(Number), alvo = horaEn(hh * 60 + mm, p.turno?.dias?.[dia]);
      if (agora - alvo >= 0 && agora - alvo < 3 && await envia(s, { title: p.en.seq > 0 ? `🔥 Sua sequência de ${p.en.seq} dia${p.en.seq > 1 ? 's' : ''} de inglês acaba hoje` : '🇺🇸 3 minutos de inglês hoje?', body: 'Uma lição rápida ou o modo Ouvir. Toque para começar.', tag: 'en-' + dia, data: { go: 'estudos', r: 'ingles' } }, `${s.id}|en|${dia}`)) n++;
    }
    for (const a of p.alpx) {
      const px = (cot && cot[a.c]) || pxAl[a.s];
      if (!px || !alpxAcionou(a, px)) continue;
      const fx = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 4 : 2 });
      if (await envia(s, { title: `🔔 ${a.c} ${a.op === '>' ? 'chegou a' : 'caiu para'} ${fx(a.v)}`, body: `Agora em ${fx(px)}. Toque para ver as cotações.`, tag: 'alpx-' + a.id, data: { go: 'mercado', r: 'cq' } }, `${s.id}|alpx|${a.id}`)) n++;
    }
    // trades de olho: entrada, gatilho (pivô/pullback) e setup invalidado
    if (p.on.ol) for (const o of p.olho) {
      const px = pxOlho[o.a];
      if (!px) continue;
      const fx = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      for (const nv of olhoAcionou(o, px)) {
        const lado = o.sd === 'C' ? 'compra' : 'venda';
        const msg = nv === 'inv' ? { t: `❌ ${o.a}: setup invalidado`, b: `Preço ${fx(px)} passou do stop ${fx(o.st!)} antes da entrada (${lado}). Risque esse trade de olho.` }
          : nv === 'gat' ? { t: `⚡ ${o.a}: passou o gatilho`, b: `Preço ${fx(px)} ${o.sd === 'C' ? 'acima' : 'abaixo'} de ${fx(o.gl!)}${o.glt ? ' (' + o.glt + ')' : ''}. Confira o candle e o OBV antes de entrar.` }
          : { t: `👀 ${o.a} chegou na entrada`, b: `Preço ${fx(px)} · entrada ${fx(o.e)} (${lado}). Confira as suas regras antes de executar.` };
        if (await envia(s, { title: msg.t, body: msg.b, tag: `ol-${o.id}-${nv}`, data: { go: 'live' } }, `${s.id}|ol|${o.id}|${nv}|${nv === 'gat' ? o.gl : nv === 'inv' ? o.st : o.e}|${dia}`)) n++;
      }
    }
    // trava do dia: lembrete de 15 em 15 min e alerta de violação
    if (p.on.trv) for (const a of travaAvisos(p.trava, dia, agora)) if (await envia(s, { title: a.title, body: a.body, tag: a.chave, data: { go: 'dia' } }, `${s.id}|${a.chave}`)) n++;
    // abertura dos mercados
    if (p.on.ab) for (const a of abre) {
      if (!p.mk.includes(a.mk)) continue;
      const d = agora - a.min;
      if (d < 0 || d >= 3) continue;
      const c = p.turno && p.turno.on ? p.turno.dias[dia] : undefined, turno = c && (p.turno!.niv[c] || 'g') === 'r' && a.mk !== 'tk';
      if (await envia(s, { title: a.titulo, body: a.corpo + (turno ? ` Hoje é dia de turno (${TH[c!]}): não opere.` : ''), tag: `ab-${a.mk}-${dia}`, data: { go: 'mercado' } }, `${s.id}|ab|${a.mk}|${dia}`)) n++;
    }
    // stop e alvos dos trades abertos
    if (p.on.tr && cot) for (const t of p.abertos) {
      const px = cot[t.a];
      if (!px) continue;
      for (const nv of niveisTocados(t, px)) {
        const alvo = nv === 'stop' ? t.st! : t.al[+nv.slice(1) - 1];
        const tit = nv === 'stop' ? `🛑 ${t.a} tocou o stop` : `🎯 ${t.a} chegou no alvo ${nv.slice(1)}`;
        const fx = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        if (await envia(s, { title: tit, body: `Preço ${fx(px)} · ${nv === 'stop' ? 'stop' : 'alvo'} ${fx(alvo)} (${t.sd === 'C' ? 'compra' : 'venda'}). Siga o seu plano.`, tag: `tr-${t.id}-${nv}`, data: { go: 'trades' } }, `${s.id}|tr|${t.id}|${nv}|${alvo}`)) n++;
      }
    }
    if (util && p.on.m) {
      const d = agora - toMin(p.m), a = avisoDia(p, dia, 'm');
      if (d >= 0 && d < 3 && await envia(s, {
        title: a.title || '☀️ Hora do checklist da manhã',
        body: a.title ? (a.extra ? a.extra + ' ' : '') + 'Use o dia para estudar e revisar trades.' : 'Revise a agenda, defina seu risco do dia e marque a rotina antes de operar.' + (a.extra ? ' ' + a.extra : ''),
        tag: 'chk-m-' + dia, data: { go: a.title ? 'home' : 'dia', r: 'm' },
      }, `${s.id}|m|${dia}`)) n++;
    }
    if (util && p.on.n) {
      const d = agora - toMin(p.n), a = avisoDia(p, dia, 'n');
      if (d >= 0 && d < 3 && await envia(s, {
        title: '🌐 Checklist da abertura americana', body: 'Faça o checklist de novo antes da sessão noturna. Confirme seu limite de risco.' + (a.extra ? ' ' + a.extra : ''),
        tag: 'chk-n-' + dia, data: { go: 'dia', r: 'n' },
      }, `${s.id}|n|${dia}`)) n++;
    }
    // domingo: revisão da semana (B3 e Forex), com o resumo que o app mandou
    if (P.weekday === 'Sun' && p.on.sem && p.semana && p.semana.id === segunda(dia)) {
      const d = agora - toMin(p.sem);
      if (d >= 0 && d < 3 && await envia(s, { title: p.semana.titulo, body: p.semana.corpo || 'Toque para fazer a revisão da semana.', tag: 'sem-' + p.semana.id, data: { go: 'home', r: 'rev' } }, `${s.id}|sem|${p.semana.id}`)) n++;
    }
    // balanços: quem divulgou desde o último pregão e quem divulga hoje (dia útil, 7h por padrão)
    if (util && p.on.bal) {
      const d = agora - toMin(p.bal);
      if (d >= 0 && d < 3) {
        try { const t = textoBalancos(await balancos(1)); if (t && await envia(s, { title: t.title, body: t.body, tag: 'bal-' + dia, data: { go: 'mercado', r: 'bal' } }, `${s.id}|bal|${dia}`)) n++; } catch { /* sem calendário */ }
      }
    }
    // briefing da manhã (dia útil, 9h30 por padrão): mercado antes da abertura, agenda do dia e trades de olho perto da entrada
    if (util && p.on.br) {
      const d = agora - toMin(p.br);
      const c = p.turno && p.turno.on ? p.turno.dias[dia] : undefined, turno = c && (p.turno!.niv[c] || 'g') === 'r';
      if (d >= 0 && d < 3) {
        const q = await briefingDados();
        const hoje = evs.filter((e) => e.imp === 'high' && (e.cur === 'BRL' || e.cur === 'USD') && hmDia(e.d) === dia && +new Date(e.d) > +now).slice(0, 3).map((e) => ({ hora: hmBR(e.d), t: e.t.slice(0, 40), pais: e.cur === 'BRL' ? '🇧🇷' : '🇺🇸' }));
        const perto = p.olho.map((o) => { const px = pxOlho[o.a] || cot?.[o.a]; return px ? { a: o.a, sd: o.sd, dist: Math.abs(o.e / px - 1) * 100 } : null; }).filter((x): x is { a: string; sd: 'C' | 'V'; dist: number } => !!x && x.dist <= 2).sort((a, b) => a.dist - b.dist);
        const b = textoBriefing(q, hoje, perto);
        { const av = avisoVenc(dia); if (av) b.body += ' ' + av; }
        try { const f: any = await fluxo(); if (f?.ultimo) { const mi = (v: number) => (v < 0 ? '−' : '+') + 'R$ ' + (Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' bi' : Math.round(Math.abs(v)) + ' mi'); b.body += ` Estrangeiro ${f.ultimo.d.slice(8, 10)}/${f.ultimo.d.slice(5, 7)}: ${mi(f.ultimo.est)} (mês ${mi(f.mes)}).`; } } catch { /* sem fluxo */ }
        if (await envia(s, { title: b.title, body: b.body + (turno ? ` Hoje é dia de turno (${TH[c!]}): não opere.` : ''), tag: 'br-' + dia, data: { go: 'mercado', r: 'img' } }, `${s.id}|br|${dia}`)) n++;
      }
    }
    if (p.on.ev) {
      for (const e of evs) {
        if (!p.cur.includes(e.cur) || (p.imp === 'high' && e.imp !== 'high')) continue;
        const mins = (+new Date(e.d) - +now) / 60000;
        if (mins <= 0 || mins > p.lead) continue;
        const det = [e.f && `Previsão ${e.f}`, e.p && `Anterior ${e.p}`].filter(Boolean).join(' · ');
        if (await envia(s, {
          title: `⏰ Em ${Math.max(1, Math.round(mins))} min: ${e.t} (${MOEDAS[e.cur]})`,
          body: `${e.imp === 'high' ? 'Alto' : 'Médio'} impacto às ${hmBR(e.d)}${det ? ' · ' + det : ''}`,
          tag: 'ev-' + e.id, data: { go: 'mercado' },
        }, `${s.id}|ev|${e.id}|${p.lead}`)) n++;
      }
    }
  }
  // operações novas do Profit: chegam sem foto de entrada e de saída; avisa uma vez por operação (v232)
  try {
    const ids = [...new Set((subs as any[]).map((x) => x.user_id).filter(Boolean))];
    if (ids.length) {
      const { data: ops } = await (await db()).from('operacoes_profit').select('user_id,id_externo,ativo,abertura,criado').in('user_id', ids).gte('criado', new Date(Date.now() - 6 * 3600_000).toISOString()).order('criado', { ascending: true }).limit(300);
      const por: Record<string, any[]> = {};
      for (const o of ops || []) (por[o.user_id] ??= []).push(o);
      for (const s of subs as any[]) {
        const L = s.user_id ? por[s.user_id] : null;
        if (!L || !L.length || s.prefs?.on?.pf === false) continue;
        for (const o of L) {
          const hh = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(o.abertura));
          if (await envia(s, { title: '📸 Profit: anexe as fotos', body: `${o.ativo} (entrada às ${hh}) chegou do Profit sem foto. Anexe a foto da entrada e a da saída no diário.`, tag: 'profit-' + o.id_externo, data: { go: 'trades' } }, `${s.id}|profit|${o.id_externo}`)) n++;
        }
      }
    }
  } catch (_) { /* tabela do Profit ainda não criada: segue */ }
  if (agora % 15 === 0) await logAuto('ciclo', true, `${n} aviso(s) neste minuto · ${subs.length} inscrição(ões)`, Date.now() - now.getTime());
  return { enviados: n };
}

// ---------- servidor ----------
Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'notificar', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  let b: any;
  try { b = await req.json(); } catch { return out({ error: 'JSON inválido' }, 400); }
  try {
    switch (b.acao) {
      case 'tick': {
        if (!segredoIgual(req.headers.get('x-cron-secret'), CRON)) return out({ error: 'Não autorizado' }, 401);
        await push();
        return out(await tick());
      }
      case 'chave':
        await push(); // valida as chaves antes de entregar ao app
        return out({ chave: PUB });
      case 'diag': {
        if (!(await usuarioDe(req))) return out({ error: 'Entre na sua conta no app.' }, 401);
        const r: Record<string, unknown> = {
          vapidPublicTamanho: PUB.length, vapidPrivateTamanho: PRIV.length, subject: SUBJ.replace(/(.{3}).*(@.*)/, '$1***$2'),
          cronSecret: !!CRON, supabaseUrl: !!Deno.env.get('SUPABASE_URL'), serviceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        };
        try { await push(); r.push = 'ok'; } catch (e) { r.push = (e as Error).message; }
        try { const { error } = await (await db()).from('push_subs').select('id', { head: true, count: 'exact' }); r.banco = error ? error.message : 'ok'; } catch (e) { r.banco = (e as Error).message; }
        return out(r);
      }
      case 'ultimos': {
        const uid = await usuarioDe(req);
        if (!uid) return out({ error: 'Entre na sua conta no app.' }, 401);
        const sb = await db();
        const { data: meus } = await sb.from('push_subs').select('id').eq('user_id', uid);
        const ult: Record<string, string> = {};
        for (const m of meus || []) {
          const { data } = await sb.from('push_log').select('chave').like('chave', `${m.id}|%`).limit(500);
          for (const x of data || []) {
            const p = String(x.chave).split('|'), tipo = p[1], dia = p.find((y: string) => /^\d{4}-\d{2}-\d{2}$/.test(y)) || '';
            const k = tipo === 'giro' ? `giro:${p[3] || ''}` : tipo;
            if (dia && (!ult[k] || ult[k] < dia)) ult[k] = dia;
          }
        }
        return out({ aparelhos: (meus || []).length, ultimos: ult });
      }
      case 'eventos': {
        const lim = Date.now() + 7 * 864e5;
        return out({ fonte: 'Forex Factory', itens: (await eventos()).filter((e) => +new Date(e.d) > Date.now() - 36e5 && +new Date(e.d) < lim), moedas: MOEDAS });
      }
      case 'inscrever': {
        // só quem está logado inscreve aparelho (as preferências levam trava do dia e trades abertos)
        const uid = await usuarioDe(req);
        if (!uid) return out({ error: 'Entre na sua conta no app para ativar as notificações.' }, 401);
        if (!dentroDoLimite('insc:' + uid, 30)) return out({ error: 'Muitas atualizações seguidas. Espere um minuto.' }, 429);
        const sub = b.sub, k = sub?.keys;
        if (!sub || !pushOk(sub.endpoint) || typeof k?.p256dh !== 'string' || typeof k?.auth !== 'string' || k.p256dh.length > 200 || k.auth.length > 100) return out({ error: 'Inscrição inválida' }, 400);
        const id = await sha(sub.endpoint);
        const sb = await db();
        const { data: ja, error: leituraErro } = await sb.from('push_subs').select('id,user_id').eq('id', id).maybeSingle();
        if (leituraErro) return out({ error: 'Não consegui verificar este aparelho.' }, 503);
        if (ja && ja.user_id !== uid) return out({ error: 'Aparelho não disponível para esta conta.' }, 404);
        if (!ja) {
          // até 5 aparelhos por pessoa: o mais antigo sai para o novo entrar
          try {
            const { data: meus, error: e1 } = await sb.from('push_subs').select('id,criado').eq('user_id', uid).order('criado', { ascending: true });
            if (!e1 && meus && meus.length >= POR_PESSOA) await sb.from('push_subs').delete().in('id', meus.slice(0, meus.length - POR_PESSOA + 1).map((x: any) => x.id));
          } catch { /* coluna user_id ainda não criada: vale só o limite geral */ }
          const { count } = await sb.from('push_subs').select('id', { count: 'exact', head: true });
          if ((count || 0) >= MAXSUBS) return out({ error: 'Limite de aparelhos atingido (MAX_SUBS).' }, 429);
        }
        const linha = { id, sub: { endpoint: sub.endpoint, keys: { p256dh: k.p256dh, auth: k.auth } }, prefs: limpaPrefs(b.prefs) };
        const resultado = ja
          ? await sb.from('push_subs').update(linha).eq('id', id).eq('user_id', uid)
          : await sb.from('push_subs').insert({ ...linha, user_id: uid });
        if (resultado.error) return out({ error: 'Não consegui salvar o aparelho. Tente novamente.' }, resultado.error.code === '23505' ? 409 : 500);
        return out({ ok: true, prefs: limpaPrefs(b.prefs) });
      }
      case 'cancelar': {
        const uid = await usuarioDe(req);
        if (!uid) return out({ error: 'Entre na sua conta no app.' }, 401);
        if (!dentroDoLimite('cancelar:' + uid, 20)) return out({ error: 'Muitas tentativas. Espere um minuto.' }, 429);
        if (!pushOk(b.endpoint)) return out({ error: 'Inscrição inválida.' }, 400);
        const { error } = await (await db()).from('push_subs').delete().eq('id', await sha(b.endpoint)).eq('user_id', uid);
        if (error) return out({ error: 'Não consegui cancelar as notificações.' }, 503);
        return out({ ok: true });
      }
      case 'teste': {
        const uid = await usuarioDe(req);
        if (!uid) return out({ error: 'Entre na sua conta no app.' }, 401);
        if (!dentroDoLimite('teste:' + uid, 3)) return out({ error: 'Espere um minuto antes de testar novamente.' }, 429);
        if (!pushOk(b.endpoint)) return out({ error: 'Inscrição inválida.' }, 400);
        const id = await sha(b.endpoint);
        const { data: s, error } = await (await db()).from('push_subs').select('id,sub').eq('id', id).eq('user_id', uid).maybeSingle();
        if (error) return out({ error: 'Não consegui consultar o aparelho.' }, 503);
        if (!s) return out({ error: 'Aparelho não encontrado nesta conta.' }, 404);
        const ok = await envia(s, { title: '🔔 Teste do diário', body: 'Se você está vendo isto, as notificações estão funcionando.', tag: 'teste', data: { go: 'mercado' } });
        return ok ? out({ ok: true }) : out({ error: 'O envio falhou. Tente ativar de novo.' }, 502);
      }
      default:
        return out({ error: 'Ação desconhecida' }, 400);
    }
  } catch (e) {
    return out({ error: (e as Error).message }, 500);
  }
});