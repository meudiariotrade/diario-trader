// Função MOVIMENTOS — vigia petróleo, minério, dólar, índices etc. Quando um ativo passa do limite do dia (ex.: ±3%),
// busca as notícias do dia (Google Notícias / Bing, em português e inglês), a IA resume o motivo em 1–2 frases e manda push. pg_cron a cada 5 min.
// Também: ações da B3 com puxada forte, fluxo estrangeiro da B3 (acao 'fluxo' + aviso acima de R$ 1 bi) e fluxo forte por ação (dados da ponte).
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY'), GK = ENV('GEMINI_API_KEY');
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
async function db(p: string, init: RequestInit = {}) { const r = await fetch(SB + '/rest/v1/' + p, { ...init, headers: { ...svc, ...((init.headers as any) || {}) } }); if (!r.ok) throw new Error('db ' + r.status + ' ' + (await r.text()).slice(0, 160)); const t = await r.text(); return t ? JSON.parse(t) : null; }

// [nome, símbolo, scanner, limite %, ações da B3 afetadas, busca de notícias, prefixo do preço]
const ATIVOS: [string, string, string, number, string, string, string][] = [
  ['Petróleo Brent', 'ICEEUR:BRN1!', 'futures', 3, 'PETR4, PRIO3, RECV3, BRAV3', 'petróleo Brent', 'US$ '],
  ['Minério de ferro', 'SGX:FEF1!', 'futures', 3, 'VALE3, CSNA3, CMIN3, GGBR4', 'minério de ferro', 'US$ '],
  ['Cobre', 'COMEX:HG1!', 'futures', 3, 'VALE3', 'cobre preço mercado', 'US$ '],
  ['Ouro', 'TVC:GOLD', 'cfd', 2.5, 'AURA33', 'ouro preço', 'US$ '],
  ['Soja', 'CBOT:ZS1!', 'futures', 3, 'SLCE3, AGRO3', 'soja Chicago', ''],
  ['Gás natural', 'NYMEX:NG1!', 'futures', 6, '', 'gás natural preço', 'US$ '],
  ['Dólar', 'FX_IDC:USDBRL', 'global', 1.5, 'WDO', 'dólar real câmbio', 'R$ '],
  ['Índice do dólar (DXY)', 'TVC:DXY', 'cfd', 1, 'WDO', 'índice DXY dólar', ''],
  ['Ibovespa', 'BMFBOVESPA:IBOV', 'global', 2, 'WIN', 'Ibovespa', ''],
  ['S&P 500', 'SP:SPX', 'america', 2, 'WIN', 'S&P 500 Wall Street', ''],
  ['EWZ (Brasil em NY)', 'AMEX:EWZ', 'global', 3, 'WIN', 'EWZ Brasil Wall Street', 'US$ '],
  ['Petrobras', 'BMFBOVESPA:PETR4', 'global', 4, 'PETR4', 'Petrobras ações', 'R$ '],
  ['Vale', 'BMFBOVESPA:VALE3', 'global', 4, 'VALE3', 'Vale ações', 'R$ '],
  ['Bitcoin', 'BINANCE:BTCUSDT', 'global', 5, '', 'bitcoin', 'US$ '],
];
const NIVEIS = [1, 1.7, 2.5]; // 3% → avisa; 5,1% → avisa de novo; 7,5% → de novo

async function cotacoes() {
  const out: Record<string, { p: number; v: number }> = {};
  for (const sc of ['global', 'futures', 'cfd', 'america']) {
    const t = ATIVOS.filter((a) => a[2] === sc).map((a) => a[1]);
    if (!t.length) continue;
    const r = await fetch(`https://scanner.tradingview.com/${sc}/scan`, { method: 'POST', body: JSON.stringify({ symbols: { tickers: t }, columns: ['close', 'change'] }), signal: AbortSignal.timeout(10_000) });
    const j = await r.json(); for (const x of j?.data || []) out[x.s] = { p: +x.d[0], v: +x.d[1] };
  }
  return out;
}
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'Accept-Language': 'pt-BR,pt;q=0.9' };
const limpa = (t: string) => t.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&lt;|&gt;/g, '').trim();
function itens(x: string) { return [...x.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/g)].slice(0, 8).map((m) => ({ t: limpa(m[1]), u: limpa(m[2]) })); }
const EN: Record<string, string> = { 'petróleo Brent': 'Brent crude oil prices', 'minério de ferro': 'iron ore prices', 'cobre preço mercado': 'copper prices', 'ouro preço': 'gold prices', 'soja Chicago': 'soybean futures', 'gás natural preço': 'natural gas prices', 'dólar real câmbio': 'Brazilian real dollar', 'índice DXY dólar': 'dollar index', 'Ibovespa': 'Ibovespa Brazil stocks', 'S&P 500 Wall Street': 'S&P 500 stocks', 'EWZ Brasil Wall Street': 'Brazil stocks EWZ', 'Petrobras ações': 'Petrobras shares', 'Vale ações': 'Vale shares', 'bitcoin': 'bitcoin price' };
async function manchetes(q: string) {
  const bing = (x: string, l: string) => `https://www.bing.com/news/search?q=${encodeURIComponent(x)}&format=rss&setlang=${l}&qft=interval%3d%227%22`;
  const pega = async (urls: string[]) => { for (const u of urls) { try { const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(7000) }); const L = itens(await r.text()); if (L.length) return L; } catch { /* próxima fonte */ } await new Promise((r) => setTimeout(r, 400)); } return [] as { t: string; u: string }[]; };
  // português + inglês: o motivo de petróleo, minério e índices lá fora quase sempre sai antes na imprensa internacional
  const [pt, en] = await Promise.all([pega([`https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:1d')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, bing(q, 'pt-br'), bing(q, 'pt-br')]), pega([bing(EN[q] || q.replace(/ ações$/, ' shares'), 'en-us'), bing(EN[q] || q.replace(/ ações$/, ' shares'), 'en-us')])]);
  return [...pt.slice(0, 5), ...en.slice(0, 5)];
}
let MOD = '';
async function modelo() {
  if (MOD) return MOD;
  try { const j = await (await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': GK } })).json(); const L = (j.models || []).map((m: any) => String(m.name).replace('models/', '')).filter((n: string) => /^gemini-[\d.]+-flash-lite$/.test(n)).sort().reverse(); MOD = L[0] || 'gemini-2.5-flash-lite'; } catch { MOD = 'gemini-2.5-flash-lite'; }
  return MOD;
}
async function motivo(nome: string, v: number, M: { t: string }[]) {
  if (!M.length || !GK) return '';
  const p = `${nome} ${v > 0 ? 'sobe' : 'cai'} ${Math.abs(v).toFixed(1).replace('.', ',')}% hoje. Com base SÓ nas manchetes abaixo (em português ou inglês), explique em no máximo 2 frases curtas, em português do Brasil, o motivo provável do movimento. Se as manchetes não explicarem, responda exatamente: SEM_MOTIVO. Não invente números.\n\n${M.map((m) => '- ' + m.t).join('\n')}`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${await modelo()}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GK }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: p }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 200 } }), signal: AbortSignal.timeout(20_000) });
    const j = await r.json(); const t = String((j?.candidates?.[0]?.content?.parts || []).map((x: any) => x.text || '').join('')).trim();
    return /SEM_MOTIVO/.test(t) ? '' : t.slice(0, 260);
  } catch { return ''; }
}
let WP: any = null;
async function manda(sub: any, title: string, body: string, tag: string) {
  const pub = ENV('VAPID_PUBLIC'), pri = ENV('VAPID_PRIVATE'); if (!pub || !pri) return false;
  if (!WP) { WP = (await import('npm:web-push@3.6.7')).default; WP.setVapidDetails(ENV('VAPID_SUBJECT') || 'mailto:alertas@example.com', pub, pri); }
  try { await WP.sendNotification(sub.sub, JSON.stringify({ title, body, tag, data: { go: 'mercado', r: 'mov' } }), { TTL: 3600 }); return true; }
  catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db(`push_subs?id=eq.${sub.id}`, { method: 'DELETE' }).catch(() => null); return false; }
}
const ja = async (k: string) => !!(await db(`push_log?select=chave&chave=eq.${encodeURIComponent(k)}`))?.length;
const marca = (k: string) => db('push_log', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ chave: k, em: new Date().toISOString() }) }).catch(() => {});
const fmt = (v: number, c = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
// divergência: a matéria-prima andou forte e a ação ligada a ela não acompanhou (só no pregão)
const PARES: [string, string, string, string][] = [['ICEEUR:BRN1!', 'BMFBOVESPA:PETR4', 'Petróleo', 'PETR4'], ['SGX:FEF1!', 'BMFBOVESPA:VALE3', 'Minério', 'VALE3'], ['SP:SPX', 'BMFBOVESPA:IBOV', 'S&P 500', 'Ibovespa']];

type LinhaFluxo = { d: string; est: number; inst: number; pf: number; ifin: number; out: number };
const fxNum = (s: string): number | null => {
  const m = /(-?[\d.]+(?:,\d+)?)\s*(bi|mi|mil)?/i.exec(s.replace(/−/g, '-'));
  if (!m) return null;
  const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  if (!isFinite(v)) return null;
  const u = (m[2] || 'mi').toLowerCase();
  return u === 'bi' ? v * 1000 : u === 'mil' ? v / 1000 : v; // tudo em R$ milhões
};
function parseFluxo(html: string): LinhaFluxo[] {
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
function resumoFluxo(L: LinhaFluxo[]) {
  if (!L.length) return null;
  const ult = L[0], mes = ult.d.slice(0, 7), ano = ult.d.slice(0, 4);
  const soma = (f: (x: LinhaFluxo) => boolean) => +L.filter(f).reduce((s, x) => s + x.est, 0).toFixed(2);
  let seq = 0; const sg = Math.sign(ult.est); for (const x of L) { if (Math.sign(x.est) === sg && sg !== 0) seq++; else break; }
  return { ultimo: ult, mes: soma((x) => x.d.startsWith(mes)), ano_na_tabela: soma((x) => x.d.startsWith(ano)), dias_seguidos: seq, sentido: sg > 0 ? 'entrada' : sg < 0 ? 'saída' : 'zero', linhas: L.slice(0, 20), dias_no_mes: L.filter((x) => x.d.startsWith(mes)).length };
}
// fluxo da B3: o banco (pg_cron + pg_net) baixa a tabela da Dados de Mercado para mercado_cache('fluxo'); aqui só lê e resume
async function fluxo() {
  const r = await db("mercado_cache?select=payload,fetched_at&id=eq.fluxo"); const html = r?.[0]?.payload?.html; if (!html) return null;
  const res = resumoFluxo(parseFluxo(html)); if (!res) return null;
  return { ...res, fonte: 'B3 (via Dados de Mercado)', obs: 'Valores em R$ milhões, mercado à vista (ações). A B3 divulga com cerca de 2 dias úteis de atraso.', baixado: r[0].fetched_at };
}
const bi = (v: number) => (v < 0 ? '-' : '+') + 'R$ ' + (Math.abs(v) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' bi';

Deno.serve(async (req) => {
  const h = { 'Content-Type': 'application/json' };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const agora = new Date(Date.now() - 3 * 3600_000), hora = agora.getUTCHours(), min = hora * 60 + agora.getUTCMinutes(), dia = agora.toISOString().slice(0, 10), dsem = agora.getUTCDay();
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  if (b.acao === 'fluxo') { const f = await fluxo().catch(() => null); return new Response(JSON.stringify(f || { error: 'Fluxo ainda não baixado.' }), { status: f ? 200 : 503, headers: { ...h, ...cors } }); }
  if (b.acao === 'noticias') return new Response(JSON.stringify(await manchetes(String(b.q || 'petróleo Brent'))), { headers: h });
  if (b.acao === 'lista') return new Response(JSON.stringify(ATIVOS.map((a) => ({ nome: a[0], sym: a[1], lim: a[3] }))), { headers: { ...h, ...cors } });
  if (!b.teste && (hora < 7 || hora >= 22)) return new Response(JSON.stringify({ ok: true, fora: true }), { headers: h });
  if (b.teste) { const k = 'movteste:' + dia; if (await ja(k)) return new Response(JSON.stringify({ ok: false, r: 'teste já feito hoje' }), { headers: h }); await marca(k); }
  const C = await cotacoes(), feitos: any[] = [];
  const todos = ((await db('push_subs?select=id,user_id,sub,prefs').catch(() => [])) || []), subs = todos.filter((x: any) => x.prefs?.on?.mov !== false);
  const pregao = dsem >= 1 && dsem <= 5 && min >= 600 && min <= 1075;
  for (const [nome, sym, , lim, b3, q, pre] of ATIVOS) {
    const c = C[sym]; if (!c || !isFinite(c.v)) continue;
    if ((dsem === 0 || dsem === 6) && !/BTC/.test(sym)) continue; // fim de semana: só cripto
    if (/BMFBOVESPA/.test(sym) && !pregao && !b.teste) continue;
    const dir = c.v > 0 ? 'a' : 'b', alvo: [any, string][] = [];
    for (const s of subs) {
      const l = Number(s.prefs?.movLim?.[sym]); const L = isFinite(l) && l > 0 ? l : lim;
      const nivel = NIVEIS.filter((k) => Math.abs(c.v) >= L * k).length;
      if (b.teste ? sym === b.teste : nivel > 0) { const k = `mov:${s.id}:${sym}:${dia}:${dir}:${nivel}`; if (b.teste || !(await ja(k))) alvo.push([s, k]); }
    }
    if (!alvo.length) continue;
    const M = await manchetes(q), m = await motivo(nome, c.v, M);
    const tit = `${nome} ${c.v > 0 ? '▲ +' : '▼ '}${fmt(c.v, 1)}%`;
    const corpo = (`${pre}${fmt(c.p, c.p < 20 ? 3 : 2)}. ${m || (M[0] ? 'Manchete: ' + M[0].t : 'Sem notícia clara ainda.')}${b3 ? ' · De olho: ' + b3 : ''}`).slice(0, 300);
    let n = 0; for (const [s, k] of alvo) { if (await manda(s, tit, corpo, 'mov-' + sym)) n++; await marca(k); }
    const kg = `movg:${sym}:${dia}:${dir}:${NIVEIS.filter((k) => Math.abs(c.v) >= lim * k).length}`;
    if (!(await ja(kg))) { await marca(kg); await db('movimentos', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ dia, ativo: nome, simbolo: sym, variacao: c.v, preco: c.p, motivo: m, manchetes: M.slice(0, 6), b3 }) }).catch(() => {}); }
    feitos.push({ nome, v: c.v, n, m });
  }
  if (pregao && min >= 630) for (const [ms, as, mn, an] of PARES) {
    const x = C[ms], y = C[as]; if (!x || !y) continue;
    const forte = Math.abs(x.v) >= 2, contra = Math.sign(y.v) !== Math.sign(x.v) || Math.abs(y.v) < Math.abs(x.v) * 0.25;
    if (!forte || !contra) continue;
    const tit = `Divergência: ${mn} × ${an}`, corpo = `${mn} ${x.v > 0 ? '+' : ''}${fmt(x.v, 1)}% e ${an} ${y.v > 0 ? '+' : ''}${fmt(y.v, 1)}%. ${an} não acompanhou: pode ser força relativa ${x.v > 0 ? 'fraca' : 'forte'} da ação ou um ajuste ainda por vir. Confira antes de operar.`;
    for (const s of subs.filter((s: any) => s.prefs?.on?.div !== false)) { const k = `div:${s.id}:${ms}:${dia}`; if (await ja(k)) continue; await manda(s, tit, corpo, 'div-' + ms); await marca(k); }
    const kg = `divg:${ms}:${dia}`; if (!(await ja(kg))) { await marca(kg); await db('movimentos', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ dia, ativo: tit, simbolo: ms + '|' + as, variacao: x.v, preco: y.v, motivo: corpo, manchetes: [], b3: an }) }).catch(() => {}); }
  }
  // ações da B3 com puxada forte (qualquer empresa líquida): 5% por padrão; ações que você opera, 3%
  if (pregao && min >= 615) try {
    const r = await fetch('https://scanner.tradingview.com/brazil/scan', { method: 'POST', signal: AbortSignal.timeout(10_000), body: JSON.stringify({ filter: [{ left: 'Value.Traded', operation: 'greater', right: 30_000_000 }, { left: 'change', operation: 'not_in_range', right: [-3, 3] }, { left: 'type', operation: 'equal', right: 'stock' }], columns: ['name', 'description', 'close', 'change', 'Value.Traded'], sort: { sortBy: 'change', sortOrder: 'desc' }, range: [0, 60] }) });
    const A = ((await r.json())?.data || []).map((x: any) => ({ tk: String(x.d[0]), nome: String(x.d[1] || '').replace(/\s+(S\.?A\.?|SA|Pfd|Participacoes.*|Holding.*)$/i, '').trim(), p: +x.d[2], v: +x.d[3] })).filter((a: any) => !['PETR4', 'VALE3'].includes(a.tk));
    if (A.length) {
      const D = (await db('diario?select=user_id,data').catch(() => [])) || [];
      const meus: Record<string, Set<string>> = {}; for (const d of D) { const S = new Set<string>(); for (const t of (d.data?.trades || []).slice(-400)) S.add(String(t.ativo || '').toUpperCase().replace(/F$/, '')); for (const o of d.data?.olho || []) S.add(String(o.a || '').toUpperCase()); meus[d.user_id] = S; }
      const cache: Record<string, { M: any[]; m: string }> = {}; let enviados = 0;
      for (const a of A) {
        if (enviados >= 6) break;
        const dir = a.v > 0 ? 'a' : 'b';
        for (const s of todos.filter((s: any) => s.prefs?.on?.acs !== false)) {
          const meu = meus[s.user_id]?.has(a.tk); const base = Number(s.prefs?.movLim?.ACOES) > 0 ? Number(s.prefs.movLim.ACOES) : 5;
          const L = meu ? Math.min(3, base) : base; const nivel = NIVEIS.filter((k) => Math.abs(a.v) >= L * k).length; if (!nivel) continue;
          const k = `acs:${s.id}:${a.tk}:${dia}:${dir}:${nivel}`; if (await ja(k)) continue;
          if (!cache[a.tk]) { const M = await manchetes(a.nome + ' ações'); cache[a.tk] = { M, m: await motivo(a.tk + ' (' + a.nome + ')', a.v, M) }; }
          const c = cache[a.tk];
          await manda(s, `${a.tk} ${a.v > 0 ? '▲ +' : '▼ '}${fmt(a.v, 1)}%${meu ? ' · você opera' : ''}`, (`R$ ${fmt(a.p)} · ${a.nome}. ${c.m || (c.M[0] ? 'Manchete: ' + c.M[0].t : 'Sem notícia clara ainda.')}`).slice(0, 300), 'acs-' + a.tk); await marca(k); enviados++;
        }
        const kg = `acsg:${a.tk}:${dia}:${dir}:${NIVEIS.filter((k) => Math.abs(a.v) >= 5 * k).length}`;
        if (Math.abs(a.v) >= 5 && !(await ja(kg))) { await marca(kg); if (!cache[a.tk]) { const M = await manchetes(a.nome + ' ações'); cache[a.tk] = { M, m: await motivo(a.tk + ' (' + a.nome + ')', a.v, M) }; } await db('movimentos', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ dia, ativo: `${a.tk} · ${a.nome}`, simbolo: 'BMFBOVESPA:' + a.tk, variacao: a.v, preco: a.p, motivo: cache[a.tk].m, manchetes: cache[a.tk].M.slice(0, 6), b3: a.tk }) }).catch(() => {}); }
      }
    }
  } catch { /* segue */ }
  // movimento que saiu sem motivo: tenta de novo (até 3 por rodada, só nas últimas 3 horas) e completa o cartão do app
  try {
    const V = (await db(`movimentos?select=id,ativo,simbolo,variacao&dia=eq.${dia}&criado=gte.${new Date(Date.now() - 3 * 3600_000).toISOString()}&or=(motivo.is.null,motivo.eq.)&limit=3`)) || [];
    for (const r of V) { const a = ATIVOS.find((x) => x[1] === r.simbolo); const nm = a ? a[0] : String(r.ativo || ''); const q = a ? a[5] : nm.split(' · ').pop() + ' ações'; if (!a && !/^BMFBOVESPA:/.test(r.simbolo)) continue; const M = await manchetes(q); const m = await motivo(nm, +r.variacao, M); if (m || M.length) await db(`movimentos?id=eq.${r.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ motivo: m, manchetes: M.slice(0, 6) }) }); }
  } catch { /* segue */ }
  // fluxo forte por ação (dados que a ponte de cada usuário manda): estrangeiras pesadas numa ação, WIN ou WDO
  if (pregao) try {
    const F = (await db(`fluxo_acoes?select=user_id,ativo,est_compra,est_venda,ag_compra,ag_venda&dia=eq.${dia}`)) || [];
    for (const f of F) {
      const fut = /^(WIN|WDO|IND|DOL)/.test(f.ativo), est = (+f.est_compra) - (+f.est_venda);
      const lim = /^(WDO|DOL)/.test(f.ativo) ? 2000 : fut ? 5000 : 30e6; if (Math.abs(est) < lim) continue;
      const nv = Math.floor(Math.abs(est) / lim), dir = est > 0 ? 'c' : 'v', nome = f.ativo.replace(/FUT$/, '');
      const val = fut ? Math.abs(Math.round(est)).toLocaleString('pt-BR') + ' contratos' : 'R$ ' + (Math.abs(est) / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mi';
      const ag = (+f.ag_compra) + (+f.ag_venda), pc = ag ? Math.round((+f.ag_compra) / ag * 100) : 50;
      for (const s of todos.filter((s: any) => s.user_id === f.user_id && s.prefs?.on?.fla !== false)) {
        const k = `fla:${s.id}:${f.ativo}:${dia}:${dir}:${Math.min(nv, 5)}`; if (await ja(k)) continue;
        await manda(s, `${nome}: estrangeiras ${est > 0 ? 'comprando' : 'vendendo'} forte`, `Saldo estimado das corretoras estrangeiras hoje: ${est > 0 ? '+' : '−'}${val}. Agressão: ${pc}% compradora. Estimativa da ponte pelo RTD, confirme no gráfico.`, 'fla-' + f.ativo); await marca(k);
      }
    }
  } catch { /* sem ponte */ }
  // fluxo estrangeiro: avisa uma vez por dia novo quando o estrangeiro mexe R$ 1 bi ou mais
  try {
    const f: any = await fluxo();
    if (f?.ultimo && Math.abs(f.ultimo.est) >= 1000 && hora >= 8) {
      const d = f.ultimo.d, tit = `Estrangeiro ${f.ultimo.est > 0 ? 'comprou' : 'vendeu'} ${bi(f.ultimo.est).slice(1)} na B3`;
      const corpo = `Dia ${d.slice(8)}/${d.slice(5, 7)}. No mês: ${bi(f.mes)}. ${f.dias_seguidos > 1 ? f.dias_seguidos + ' dias seguidos de ' + f.sentido + '. ' : ''}${f.ultimo.est > 0 ? 'Entrada de estrangeiro costuma dar força ao Ibovespa/WIN e pressionar o dólar para baixo.' : 'Saída de estrangeiro costuma pesar no Ibovespa/WIN e puxar o dólar para cima.'}`;
      for (const s of todos.filter((s: any) => s.prefs?.on?.flx !== false)) { const k = `flx:${s.id}:${d}`; if (await ja(k)) continue; await manda(s, tit, corpo, 'flx'); await marca(k); }
    }
  } catch { /* sem fluxo */ }
  return new Response(JSON.stringify({ ok: true, feitos }), { headers: h });
});
