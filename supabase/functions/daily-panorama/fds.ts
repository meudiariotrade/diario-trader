// fds.ts (v638) — "Panorama Fim de Semana · Cripto & Macro" (sábado e domingo).
// 12 criptoativos pela Binance (24h: preço, variação, máxima e mínima), termômetro de risco e
// manchetes do fim de semana (Google Notícias). Mesmo visual escuro/âmbar do Panorama.
import { svgDe } from './resolve.ts';
export const FDS_CRIPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI', 'TON', 'DOT'];
export const ehFimDeSemana = (d = new Date()) => {
  const w = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(d);
  return w === 'Sat' || w === 'Sun';
};
type Cripto = { k: string; px: number; d1: number; hi: number; lo: number };
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (t: string) => { const u = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const usd = (v: number) => (v >= 1000 ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : v >= 1 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toLocaleString('pt-BR', { maximumFractionDigits: 4 }));
const pct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%';

export async function criptos(): Promise<Cripto[]> {
  const syms = encodeURIComponent(JSON.stringify(FDS_CRIPTO.map((k) => k + 'USDT')));
  // data-api.binance.vision: espelho público de dados de mercado (sem bloqueio por região)
  for (const host of ['https://data-api.binance.vision', 'https://api.binance.com']) {
    try {
      const r = await fetch(`${host}/api/v3/ticker/24hr?symbols=${syms}`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const L = await r.json();
      const M = new Map((L as any[]).map((x) => [String(x.symbol).replace(/USDT$/, ''), x]));
      return FDS_CRIPTO.filter((k) => M.has(k)).map((k) => { const x: any = M.get(k); return { k, px: +x.lastPrice, d1: +x.priceChangePercent, hi: +x.highPrice, lo: +x.lowPrice }; });
    } catch { /* tenta o próximo */ }
  }
  return [];
}
export async function manchetes(): Promise<string[]> {
  const q = encodeURIComponent('(mercado financeiro OR economia OR bitcoin OR cripto OR Fed OR China OR petróleo OR geopolítica) when:2d');
  try {
    const r = await fetch(`https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const xml = await r.text(), out: string[] = [], vistos = new Set<string>();
    for (const m of xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g)) {
      const t = m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+-\s+[^-]{2,40}$/, '').trim();
      const k = t.toLowerCase().slice(0, 40);
      if (t.length > 20 && !vistos.has(k)) { vistos.add(k); out.push(t); }
      if (out.length >= 5) break;
    }
    return out;
  } catch { return []; }
}
export function termometro(L: Cripto[]) {
  if (!L.length) return { vies: 'Sem dados', cor: '#8A90A0', txt: 'Sem cotações da Binance agora.' };
  const peso = (k: string) => (k === 'BTC' ? 4 : k === 'ETH' ? 2 : 1);
  const tot = L.reduce((s, x) => s + peso(x.k), 0), med = L.reduce((s, x) => s + x.d1 * peso(x.k), 0) / tot, alta = L.filter((x) => x.d1 > 0).length;
  const vies = med >= 1 && alta >= L.length * 0.6 ? 'Apetite a risco' : med <= -1 && alta <= L.length * 0.4 ? 'Defensivo' : 'Neutro';
  const cor = vies === 'Apetite a risco' ? '#10B981' : vies === 'Defensivo' ? '#EF4444' : '#D4A017';
  const txt = `Média ponderada ${pct(med)} em 24h, ${alta} de ${L.length} em alta. ${vies === 'Apetite a risco' ? 'Prévia positiva para a abertura dos futuros no domingo à noite.' : vies === 'Defensivo' ? 'Sinal de cautela para a abertura dos futuros no domingo à noite.' : 'Sem direção clara para a abertura dos futuros no domingo à noite.'}`;
  return { vies, cor, txt };
}
export async function logosCripto(L: Cripto[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(L.map(async (x) => {
    const s = await svgDe(`https://s3-symbol-logo.tradingview.com/crypto/XTVC${x.k}.svg`).catch(() => null);
    if (s) out[x.k] = 'data:image/svg+xml;base64,' + b64(s);
  }));
  return out;
}
export function fdsSvg(L: Cripto[], news: string[], logos: Record<string, string>, quando: Date) {
  const W = 1080, P = 48, termo = termometro(L);
  const dataTxt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(quando);
  const cw = (W - 2 * P - 2 * 16) / 3, ch = 132, y0 = 236;
  const cards = L.map((x, i) => {
    const cx = P + (i % 3) * (cw + 16), cy = y0 + Math.floor(i / 3) * (ch + 16), cor = x.d1 >= 0 ? '#10B981' : '#EF4444';
    const logo = logos[x.k] ? `<clipPath id="c${i}"><circle cx="${cx + 38}" cy="${cy + 40}" r="20"/></clipPath><image href="${logos[x.k]}" x="${cx + 18}" y="${cy + 20}" width="40" height="40" clip-path="url(#c${i})"/>` : `<circle cx="${cx + 38}" cy="${cy + 40}" r="20" fill="#181C26" stroke="#D4A017"/><text x="${cx + 38}" y="${cy + 45}" font-size="13" font-weight="700" fill="#D4A017" text-anchor="middle">${esc(x.k.slice(0, 4))}</text>`;
    return `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="6" fill="#11141B" stroke="#1E232E"/>${logo}
<text x="${cx + 70}" y="${cy + 36}" font-size="22" font-weight="700" fill="#E6E8EE">${x.k}</text><text x="${cx + 70}" y="${cy + 58}" font-size="15" fill="#8A90A0">USDT</text>
<text x="${cx + cw - 18}" y="${cy + 46}" font-size="24" font-weight="700" fill="#E6E8EE" text-anchor="end">US$ ${usd(x.px)}</text>
<text x="${cx + cw - 18}" y="${cy + 80}" font-size="21" font-weight="700" fill="${cor}" text-anchor="end">${pct(x.d1)}</text>
<text x="${cx + 18}" y="${cy + 112}" font-size="14" fill="#8A90A0">Máx ${usd(x.hi)} · Mín ${usd(x.lo)}</text>`;
  }).join('');
  const yT = y0 + Math.ceil(L.length / 3) * (ch + 16) + 12;
  const quebra = (t: string, n: number) => { const ws = t.split(' '), ls: string[] = []; let l = ''; for (const w of ws) { if ((l + ' ' + w).trim().length > n) { ls.push(l.trim()); l = w; } else l += ' ' + w; } l.trim() && ls.push(l.trim()); return ls.slice(0, 2); };
  const termTxt = quebra(termo.txt, 80);
  const yN = yT + 150;
  let yy = yN + 64;
  const itens = (news.length ? news : ['Sem manchetes do fim de semana agora.']).map((t) => { const ls = quebra(t, 78); const s = ls.map((l, j) => `<text x="${P + 34}" y="${yy + j * 30}" font-size="21" fill="#E6E8EE">${esc(l)}</text>`).join('') + `<circle cx="${P + 14}" cy="${yy - 7}" r="5" fill="#D4A017"/>`; yy += ls.length * 30 + 18; return s; }).join('');
  const H = yy + 70;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans">
<rect width="${W}" height="${H}" fill="#0A0C10"/><rect x="0" y="0" width="${W}" height="6" fill="#D4A017"/>
<text x="${P}" y="84" font-size="40" font-weight="700" fill="#E6E8EE">Panorama Fim de Semana</text>
<text x="${P}" y="128" font-size="28" font-weight="700" fill="#D4A017">Cripto &amp; Macro</text>
<text x="${P}" y="168" font-size="18" fill="#8A90A0">${esc(dataTxt)} (Brasília)</text>
<circle cx="${W - P - 292}" cy="121" r="7" fill="#10B981"/><text x="${W - P}" y="128" font-size="19" font-weight="700" fill="#10B981" text-anchor="end">Binance 24/7 · Tempo real</text>
<text x="${P}" y="214" font-size="20" font-weight="700" fill="#C9CDD6">Cripto · 24 horas</text>
${cards}
<rect x="${P}" y="${yT}" width="${W - 2 * P}" height="126" rx="6" fill="#11141B" stroke="#1E232E"/><rect x="${P}" y="${yT}" width="6" height="126" fill="${termo.cor}"/>
<text x="${P + 26}" y="${yT + 40}" font-size="20" font-weight="700" fill="#C9CDD6">Termômetro de abertura</text><text x="${W - P - 22}" y="${yT + 40}" font-size="22" font-weight="700" fill="${termo.cor}" text-anchor="end">${esc(termo.vies)}</text>
${termTxt.map((l, j) => `<text x="${P + 26}" y="${yT + 76 + j * 28}" font-size="19" fill="#E6E8EE">${esc(l)}</text>`).join('')}
<text x="${P}" y="${yN + 20}" font-size="20" font-weight="700" fill="#C9CDD6">Principais notícias do fim de semana</text>
${itens}
<text x="${P}" y="${H - 28}" font-size="15" fill="#5B6170">Diário de Trader · Binance (24h) e Google Notícias. Leitura de risco é indicativa, não é recomendação.</text>
</svg>`;
}
