// fds.ts (v638) — "Panorama Fim de Semana · Cripto & Macro" (sábado e domingo).
// 12 criptoativos pela Binance (24h: preço, variação, máxima e mínima), termômetro de risco e
// manchetes do fim de semana (Google Notícias). Mesmo visual escuro/âmbar do Panorama.
import { svgDe } from './resolve.ts';
import { decodeEntidades } from '../_shared/entidades.ts';
export const FDS_CRIPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI', 'TON', 'DOT'];
// v640: sábado 00:00 até domingo 19:59 (Brasília). Domingo 20:00 os futuros dos EUA reabrem → Panorama normal.
export const ehFimDeSemana = (d = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  return p.weekday === 'Sat' || (p.weekday === 'Sun' && +p.hour < 20);
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
// v639: várias fontes (as do app + grandes portais) e prioridade para o que mexe na abertura de segunda:
// geopolítica, EUA/Trump, Fed, China, petróleo, juros, cripto. Só do fim de semana (últimas 48 h).
const FEEDS: [string, string][] = [
  ['Money Times', 'https://www.moneytimes.com.br/mercados/feed/'],
  ['Money Times', 'https://www.moneytimes.com.br/feed/'],
  ['InfoMoney', 'https://www.infomoney.com.br/feed/'],
  ['g1 Mundo', 'https://g1.globo.com/rss/g1/mundo/'],
  ['g1 Economia', 'https://g1.globo.com/rss/g1/economia/'],
  ['CNN Brasil', 'https://www.cnnbrasil.com.br/feed/'],
  ['Google Notícias', 'https://news.google.com/rss/search?q=' + encodeURIComponent('(Trump OR EUA OR Fed OR China OR guerra OR ataque OR petróleo OR tarifas OR bitcoin OR aeroportos) when:2d') + '&hl=pt-BR&gl=BR&ceid=BR:pt-419'],
  ['Google News', 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en'],
];
const PESO: [RegExp, number][] = [
  [/\b(trump|casa branca|white house|biden|eua|estados unidos|u\.s\.|us )\b/i, 3], [/\b(ataque|atentado|attack|guerra|war|míssil|missile|militar|military|explos)/i, 4],
  [/\b(israel|ir[aã]|iran|r[uú]ssia|russia|ucr[aâ]nia|ukraine|china|taiwan|coreia|venezuela|oriente m[eé]dio)/i, 3],
  [/\b(fed|juros|inflação|inflation|tarifa|tariff|petr[oó]leo|oil|opep|opec|d[oó]lar|bolsa|wall street|mercados?)\b/i, 3],
  [/\b(aeroporto|airport|voos|flights|shutdown|paralisa|greve|fechad)/i, 3], [/\b(bitcoin|cripto|crypto|ethereum|binance)/i, 2],
  [/\b(lula|haddad|banco central|copom|selic|ibovespa)\b/i, 2],
  // v640: fora opinião, colunas, estudos e conteúdo atemporal
  [/^(estudo|pesquisa|como|por que|porque|guia|veja|confira|saiba|entenda|o que|quem|quanto|qual|dicas?|quiz|hor[oó]scopo|opini[aã]o|an[aá]lise|artigo|coluna|podcast|v[ií]deo|ao vivo|newsletter)\b|\?$|\b(opini[aã]o|coluna|editorial|podcast|webinar|curso|e-?book|ranking|melhores|novela|bbb|futebol|receita|celebridade|hor[oó]scopo)\b/i, -10],
];
export async function manchetes(): Promise<string[]> {
  const limite = Date.now() - 24 * 3600e3, /* v640: só as últimas 24 horas */ itens: { t: string; f: string; s: number; d: number }[] = [];
  await Promise.all(FEEDS.map(async ([fonte, url]) => {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(7000) });
      if (!r.ok) return;
      const xml = await r.text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const tt = /<title>([\s\S]*?)<\/title>/.exec(m[1]), pd = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(m[1]);
        if (!tt) continue;
        const d = pd ? Date.parse(pd[1].trim()) : Date.now();
        if (!(d >= limite)) continue;
        const t = decodeEntidades(tt[1].replace(/<!\[CDATA\[|\]\]>/g, '')).replace(/<[^>]+>/g, '').replace(/\s+-\s+[^-]{2,40}$/, '').trim();
        if (t.length < 25) continue;
        const s = PESO.reduce((a, [re, w]) => a + (re.test(t) ? w : 0), 0);
        itens.push({ t, f: fonte, s, d });
      }
    } catch { /* fonte fora do ar: segue com as outras */ }
  }));
  itens.sort((a, b) => b.s - a.s || b.d - a.d);
  // Normalização editorial e assuntos distintos, antes de limitar a cinco manchetes.
  const limparCredito = (t: string) => t.replace(/\s*\([^)]+\)\s*$/, '').trim();
  const ignorar = new Set('a o as os um uma uns umas de da do das dos em na no nas nos por para com sem sobre entre ao aos pela pelo pelas pelos que se e ou mas como após apos desde até ate é sao foi ser esta estão esse essa isso seu sua seus suas the a an of in on at for from to by with and or after amid over is are was were will has have had new says say said this that as its their it into during about'.split(' '));
  const equivalentes: Record<string, string> = {
    attacks: 'ataque', attack: 'ataque', attacked: 'ataque', attacking: 'ataque',
    ataques: 'ataque', ataca: 'ataque', atacam: 'ataque', atacou: 'ataque',
    missiles: 'missil', missile: 'missil', misseis: 'missil',
    war: 'guerra', wars: 'guerra',
    iran: 'ira', iranian: 'ira', iranianos: 'ira',
    america: 'eua', us: 'eua', usa: 'eua', american: 'eua', americans: 'eua', americano: 'eua', americana: 'eua', americanos: 'eua', americanas: 'eua',
    israeli: 'israel', israelis: 'israel',
    russian: 'russia', russos: 'russia',
    ukraine: 'ucrania', ukrainian: 'ucrania',
    chinese: 'china',
    tariff: 'tarifa', tariffs: 'tarifa', tarifas: 'tarifa',
    oil: 'petroleo', crude: 'petroleo',
    inflation: 'inflacao', interest: 'juros', rates: 'juros', rate: 'juros',
    markets: 'mercado', market: 'mercado', mercados: 'mercado',
    crypto: 'cripto', cryptocurrencies: 'cripto',
    middle: 'oriente', east: 'medio', tensions: 'tensao', tension: 'tensao',
  };
  const eventos = new Set('ataque missil guerra tarifa petroleo inflacao juros greve explosao queda alta acordo eleicao sancoes sancao prisao morte crise acidente incendio embargo invasao'.split(' '));
  const chave = (t: string) => [...new Set(limparCredito(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').split(/\s+/)
    .map((w) => equivalentes[w] || w).filter((w) => w.length > 2 && !ignorar.has(w)))];
  const mesmoEvento = (a: string[], b: string[]) => {
    const comuns = a.filter((w) => b.includes(w));
    return comuns.length >= 3 || (comuns.length >= 2 && comuns.some((w) => eventos.has(w)) && comuns.length / Math.min(a.length, b.length) >= 0.3);
  };
  const out: string[] = [], vistos: string[][] = [];
  for (const it of itens) {
    if (it.s < 3) break; // mantém os critérios de relevância factual existentes
    const t = limparCredito(it.t), k = chave(t);
    if (!k.length || vistos.some((v) => mesmoEvento(k, v))) continue;
    vistos.push(k);
    out.push(it.f === 'Google News' ? '\u0000' + t : t);
    if (out.length >= 5) break;
  }
  // v641: manchete em inglês é traduzida para o português (sem chave; se falhar, fica a original)
  return Promise.all(out.map(async (x) => {
    if (!x.startsWith('\u0000')) return limparCredito(x);
    const t = x.slice(1);
    let pt = '';
    try {
      const r = await fetch('https://api.mymemory.translated.net/get?langpair=en|pt-BR&q=' + encodeURIComponent(t), { signal: AbortSignal.timeout(6000) });
      const j = r.ok ? await r.json() : null;
      pt = String(j?.responseData?.translatedText || '').trim();
      /MYMEMORY|QUOTA|INVALID/i.test(pt) && (pt = '');
    } catch { /* tenta o Google */ }
    if (!pt) {
      try {
        const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=' + encodeURIComponent(t), { signal: AbortSignal.timeout(5000) });
        const j = r.ok ? await r.json() : null;
        pt = Array.isArray(j?.[0]) ? j[0].map((p: any) => p?.[0] || '').join('').trim() : '';
      } catch { /* fica a original */ }
    }
    return limparCredito(pt || t);
  }));
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
  const quebra = (t: string, n: number) => { const ws = t.split(' '), ls: string[] = []; let l = ''; for (const w of ws) { if ((l + ' ' + w).trim().length > n) { ls.push(l.trim()); l = w; } else l += ' ' + w; } l.trim() && ls.push(l.trim()); return ls.slice(0, 3); };
  const termTxt = quebra(termo.txt, 80);
  const yN = yT + 150;
  let yy = yN + 64;
  const itens = (news.length ? news : ['Sem manchetes do fim de semana agora.']).map((t) => { const ls = quebra(t, 74); const s = ls.map((l, j) => `<text x="${P + 34}" y="${yy + j * 30}" font-size="21" fill="#E6E8EE">${esc(l)}</text>`).join('') + `<circle cx="${P + 14}" cy="${yy - 7}" r="5" fill="#D4A017"/>`; yy += ls.length * 30 + 18; return s; }).join('');
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
<text x="${P}" y="${H - 28}" font-size="15" fill="#5B6170">Diário de Trader · Binance 24h · Não é recomendação.</text>
</svg>`;
}
