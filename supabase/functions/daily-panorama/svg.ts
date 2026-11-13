// Monta o SVG do Panorama de Mercado (1080 px de largura) a partir da "foto" guardada em panorama_fotos.
// Paleta do app: fundo #0A0C10, painéis #11141B, divisórias #1E232E, âmbar #D4A017, alta #10B981, baixa #EF4444.
const C = { bg: '#0A0C10', pn: '#11141B', ln: '#1E232E', am: '#D4A017', g: '#10B981', r: '#EF4444', tx: '#E6E8EC', mu: '#8A8F9C' };
const W = 1080, M = 48, GAP = 24, COL = (W - 2 * M - GAP) / 2, RH = 40;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const nf = (v: number, d: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const px = (v: unknown) => { const n = Number(v); if (v == null || !isFinite(n)) return '—'; const a = Math.abs(n); return nf(n, a >= 1000 ? 0 : a >= 100 ? 2 : a >= 10 ? 2 : a >= 1 ? 4 : 4); };
const pct = (v: unknown) => { const n = Number(v); if (v == null || !isFinite(n)) return { t: '—', c: C.mu }; return { t: (n > 0 ? '▲ +' : n < 0 ? '▼ −' : '■ ') + nf(Math.abs(n), 2) + '%', c: n > 0.004 ? C.g : n < -0.004 ? C.r : C.mu }; };
const corta = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const t = (x: number, y: number, s: string, o: { z?: number; c?: string; b?: boolean; a?: 'start' | 'end' | 'middle'; ls?: number; f?: string } = {}) =>
  `<text x="${x}" y="${y}" font-family="${o.f || 'DejaVu Sans'}" font-size="${o.z || 22}" font-weight="${o.b ? 700 : 400}" fill="${o.c || C.tx}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
type Linha = { n: string; v: string; p: { t: string; c: string } };
function painel(x: number, y: number, w: number, titulo: string, linhas: Linha[], vazio = 'Sem dados nesta foto.') {
  const h = 64 + Math.max(1, linhas.length) * RH + 12;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.pn}"/>`;
  s += t(x + 24, y + 38, titulo.toUpperCase(), { z: 17, c: C.am, b: true, ls: 2 });
  s += `<rect x="${x + 24}" y="${y + 54}" width="${w - 48}" height="1" fill="${C.ln}"/>`;
  if (!linhas.length) s += t(x + 24, y + 54 + 28, vazio, { z: 20, c: C.mu });
  linhas.forEach((l, i) => {
    const yy = y + 54 + 28 + i * RH;
    s += t(x + 24, yy, corta(l.n, 17), { z: 22 });
    s += t(x + w - 24 - 150, yy, l.v, { z: 22, a: 'end' });
    s += t(x + w - 24, yy, l.p.t, { z: 20, c: l.p.c, b: true, a: 'end' });
    if (i < linhas.length - 1) s += `<rect x="${x + 24}" y="${yy + 13}" width="${w - 48}" height="1" fill="${C.ln}"/>`;
  });
  return { s, h };
}
const CURTO: Record<string, string> = { 'Euro Stoxx 50': 'Euro Stoxx 50', 'EWZ (Brasil em NY)': 'EWZ', 'Minério Dalian (China)': 'Minério Dalian', 'Petróleo Brent': 'Brent', 'Petróleo WTI': 'WTI', 'Treasury 10 anos': 'Treasury 10a', 'Treasury 5 anos': 'Treasury 5a' };
export function panoramaSvg(dados: any, quando: Date, hoje: string, titulo = 'Antes da Abertura'): string {
  const grupos: any[] = dados?.mdo?.mercados?.grupos || [];
  const item = (g: string, n: string) => (grupos.find((x) => x.g === g)?.itens || []).find((i: any) => i.n === n);
  const L = (g: string, nomes: string[]): Linha[] => nomes.map((n) => item(g, n)).filter(Boolean).map((i: any) => i.juro
    ? { n: CURTO[i.n] || i.n, v: nf(+i.px, 2) + '%', p: i.d1bp == null ? { t: '—', c: C.mu } : { t: (i.d1bp > 0 ? '▲ +' : i.d1bp < 0 ? '▼ −' : '■ ') + nf(Math.abs(i.d1bp), 1) + ' bp', c: i.d1bp > 0 ? C.r : i.d1bp < 0 ? C.g : C.mu } }
    : { n: CURTO[i.n] || i.n, v: px(i.px), p: pct(i.d1) });
  const bolsas = L('Bolsas', ['Ibovespa', 'S&P 500', 'Nasdaq', 'Dow Jones', 'DAX', 'Euro Stoxx 50', 'Nikkei', 'Hang Seng']);
  const fut = [...L('Futuros e ADR', ['S&P futuro', 'Nasdaq futuro']), ...L('Moedas', ['USD/BRL', 'DXY', 'EUR/USD']), ...L('Juros dos EUA', ['Treasury 10 anos'])];
  const ewz = item('Futuros e ADR', 'EWZ (Brasil em NY)');
  if (ewz) fut.splice(2, 0, { n: ewz.ext ? 'EWZ (pré)' : 'EWZ', v: px(ewz.ext?.px ?? ewz.px), p: pct(ewz.ext?.pct ?? ewz.d1) });
  const comm = L('Commodities', ['Petróleo Brent', 'Petróleo WTI', 'Minério de ferro', 'Minério Dalian (China)', 'Ouro', 'Cobre']);
  const ADR = ['PBR', 'VALE', 'ITUB', 'BBD', 'ABEV', 'GGB'];
  const adrs: Linha[] = ((dados?.ad?.itens || []) as any[]).filter((a) => ADR.includes(a.s)).sort((a, b) => ADR.indexOf(a.s) - ADR.indexOf(b.s))
    .map((a) => { const pr = a.state === 'pre' && a.pre ? a.pre : null; return { n: a.s + (pr ? ' (pré)' : ''), v: 'US$ ' + nf(+(pr?.px ?? a.px), 2), p: pct(pr?.chp ?? a.chp) }; });
  const evs = ((dados?.ag?.eventos || []) as any[]).filter((e) => +e.imp >= 1 && !e.rotina).filter((e) => {
    const d = new Date(new Date(e.em).getTime() - 3 * 3600_000).toISOString().slice(0, 10); return d === hoje;
  }).sort((a, b) => (a.em < b.em ? -1 : 1)).slice(0, 7);
  const pre = dados?.mdo?.mercados?.pre || {}, vies = String(pre.vies || '').toLowerCase();
  const corV = vies === 'positivo' ? C.g : vies === 'negativo' ? C.r : C.am;
  const dataTxt = quando.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaTxt = quando.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  let s = '', y = 0;
  s += `<rect x="0" y="0" width="${W}" height="4" fill="${C.am}"/>`;
  s += t(M, 66, 'DIÁRIO DE TRADER · PANORAMA DO MERCADO', { z: 18, c: C.am, b: true, ls: 3 });
  s += t(M, 132, titulo, { z: 54, b: true, f: 'DejaVu Serif' });
  s += t(M, 176, dataTxt.replace(/^./, (c) => c.toUpperCase()) + ' · ' + horaTxt + ' Brasília', { z: 22, c: C.mu });
  if (vies) {
    const lab = 'VIÉS ' + vies.toUpperCase(), bw = 40 + lab.length * 15;
    s += `<rect x="${W - M - bw}" y="92" width="${bw}" height="52" rx="4" fill="none" stroke="${corV}" stroke-width="2"/>`;
    s += t(W - M - bw / 2, 126, lab, { z: 20, c: corV, b: true, a: 'middle', ls: 1 });
  }
  if (pre.br?.pct != null) s += t(W - M, 176, 'Brasil em NY ' + pct(pre.br.pct).t, { z: 20, c: pct(pre.br.pct).c, a: 'end' });
  y = 208; s += `<rect x="${M}" y="${y}" width="${W - 2 * M}" height="1" fill="${C.ln}"/>`; y += 24;
  const a1 = painel(M, y, COL, 'Bolsas · fechamento', bolsas), b1 = painel(M + COL + GAP, y, COL, 'Futuros · moedas · juros', fut);
  s += a1.s + b1.s; y += Math.max(a1.h, b1.h) + GAP;
  const a2 = painel(M, y, COL, 'Commodities', comm), b2 = painel(M + COL + GAP, y, COL, 'ADRs em Nova York', adrs);
  s += a2.s + b2.s; y += Math.max(a2.h, b2.h) + GAP;
  // agenda do dia: só eventos de 3 estrelas (alta importância)
  const ah = 64 + Math.max(1, evs.length) * RH + 12;
  s += `<rect x="${M}" y="${y}" width="${W - 2 * M}" height="${ah}" rx="6" fill="${C.pn}"/>`;
  s += t(M + 24, y + 38, 'AGENDA DE HOJE · ★★★', { z: 17, c: C.am, b: true, ls: 2 });
  s += t(W - M - 24, y + 38, 'horário de Brasília', { z: 16, c: C.mu, a: 'end' });
  s += `<rect x="${M + 24}" y="${y + 54}" width="${W - 2 * M - 48}" height="1" fill="${C.ln}"/>`;
  if (!evs.length) s += t(M + 24, y + 82, 'Nenhum evento de 3 estrelas na agenda de hoje.', { z: 20, c: C.mu });
  evs.forEach((e, i) => {
    const yy = y + 82 + i * RH, hr = new Date(e.em).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    const ref = e.atual ? 'atual ' + e.atual : e.proj ? 'proj. ' + e.proj : e.ant ? 'ant. ' + e.ant : '';
    s += t(M + 24, yy, hr, { z: 22, b: true });
    s += `<rect x="${M + 112}" y="${yy - 22}" width="46" height="28" rx="4" fill="${C.ln}"/>` + t(M + 135, yy - 2, String(e.p || '').slice(0, 2), { z: 16, b: true, a: 'middle', c: C.am });
    s += t(M + 176, yy, corta(String(e.t || ''), 40), { z: 22 });
    if (ref) s += t(W - M - 24, yy, ref, { z: 20, c: C.mu, a: 'end' });
    if (i < evs.length - 1) s += `<rect x="${M + 24}" y="${yy + 13}" width="${W - 2 * M - 48}" height="1" fill="${C.ln}"/>`;
  });
  y += ah + 32;
  s += t(M, y, 'Fontes: TradingView · Yahoo · agenda TradingView. Cotações com atraso de até 15 min; não é recomendação.', { z: 16, c: C.mu });
  y += 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="${W}" height="${y}" fill="${C.bg}"/>${s}</svg>`;
}
