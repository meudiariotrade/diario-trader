/* v836 — Candles públicos do Yahoo na Cloudflare (porte do modo "gráfico" e da "janela do trade" de
 * supabase/functions/candles). O Replay continua no Supabase porque acumula dias no banco. */
export function mapa(ativo, sub = '') {
  const s = String(ativo || '').toUpperCase().replace(/\s/g, '').replace(/^.*:/, '');
  if (!s) return null;
  const ok = (y, nota = '') => ({ y, proxy: false, mult: 1, nota });
  const px = (y, nota, mult = 1) => ({ y, proxy: true, mult, nota });
  const indices = { VIX: '^VIX', IBOV: '^BVSP', IBOVESPA: '^BVSP', SPX: '^GSPC', SP500: '^GSPC', NDX: '^NDX', NASDAQ: '^IXIC', DOW: '^DJI', DJI: '^DJI', DXY: 'DX-Y.NYB', USDBRL: 'BRL=X', PRATA: 'SI=F', COBRE: 'HG=F', NG: 'NG=F' };
  if (indices[s]) return ok(indices[s]);
  const commodities = { BRENT: 'BZ=F', UKOIL: 'BZ=F', 'BRN1!': 'BZ=F', 'BZ=F': 'BZ=F', WTI: 'CL=F', USOIL: 'CL=F', 'CL1!': 'CL=F', 'CL=F': 'CL=F', OURO: 'GC=F', GOLD: 'GC=F', 'GC=F': 'GC=F' };
  if (commodities[s]) return px(commodities[s], 'Histórico de futuro de referência (Yahoo). Bolsa, vencimento e rolagem podem diferir da cotação do cabeçalho; OHLC não é substituído por outra fonte.');
  if (/^(WIN|IND)/.test(s)) return px('^BVSP', 'Ibovespa à vista: o mini índice não tem histórico gratuito. Use para ver o horário da entrada e da saída; o preço é parecido, mas não igual ao do contrato.');
  if (/^(WDO|DOL)/.test(s)) return px('BRL=X', 'Dólar à vista × 1000 (aproxima o mini dólar). O preço do futuro tem um prêmio sobre o à vista.', 1000);
  const fut = [[/^M?ES[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'ES=F'], [/^M?NQ[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'NQ=F'], [/^M?YM[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'YM=F'], [/^(M2K|RTY)[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'RTY=F'], [/^M?CL[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'CL=F'], [/^M?GC[FGHJKMNQUVXZ]?\d{0,2}!?$/, 'GC=F']];
  for (const [r, y] of fut) if (r.test(s)) return ok(y, 'Contrato contínuo (1º vencimento).');
  if (/^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(s)) {
    const base = String(sub || '').toUpperCase().trim() || s.slice(0, 4) + '3';
    return px(base.replace(/F$/, '') + '.SA', `Opção: o gráfico é do ativo-objeto (${base}), não do prêmio da opção.`);
  }
  if (/^[A-Z]{4}\d{1,2}F?$/.test(s)) return ok(s.replace(/F$/, '') + '.SA');
  const idx = { US30: 'YM=F', DJ30: 'YM=F', NAS100: 'NQ=F', US100: 'NQ=F', USTEC: 'NQ=F', US500: 'ES=F', SPX500: 'ES=F', GER40: '^GDAXI', DE40: '^GDAXI', XAUUSD: 'GC=F', XAGUSD: 'SI=F', USOIL: 'CL=F', WTI: 'CL=F', UKOIL: 'BZ=F' };
  for (const [k, y] of Object.entries(idx)) if (s.startsWith(k)) return ok(y, k.startsWith('XAU') || k.includes('OIL') || k === 'WTI' ? 'Contrato futuro de referência: o preço do CFD pode diferir um pouco.' : 'Índice futuro de referência: o preço do CFD pode diferir um pouco.');
  if (/^(BTC|ETH|SOL|XRP)/.test(s)) return ok(s.slice(0, 3) + '-USD');
  if (/^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)(USD|JPY|CHF|CAD|EUR|GBP|AUD|NZD)$/.test(s)) return ok(s + '=X');
  if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(s)) return ok(s);
  return null;
}
export const epochBR = (x) => { const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(x || '')); if (!m) return NaN; return Date.parse(`${m[1]}T${m[2] || '12'}:${m[3] || '00'}:00-03:00`) / 1000; };
export function janela(de, ate, agora) {
  const a = epochBR(de), b = isFinite(epochBR(ate)) ? epochBR(ate) : a;
  if (!isFinite(a)) return null;
  const ini = Math.min(a, b), fim = Math.max(a, b), idade = (agora - ini) / 86400, dur = (fim - ini) / 3600;
  if (idade <= 58 && dur <= 10) return { intervalo: '5m', p1: ini - 90 * 60, p2: Math.min(agora, fim + 90 * 60) };
  if (idade <= 700 && dur <= 24 * 20) return { intervalo: '60m', p1: ini - 86400, p2: Math.min(agora, fim + 86400) };
  return { intervalo: '1d', p1: ini - 20 * 86400, p2: Math.min(agora, fim + 20 * 86400) };
}
export function leYahoo(j, mult = 1, max = 400) {
  const r = j?.chart?.result?.[0], ts = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {}, out = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
    if ([o, h, l, c].every((x) => typeof x === 'number' && isFinite(x))) out.push([ts[i], +(o * mult).toFixed(5), +(h * mult).toFixed(5), +(l * mult).toFixed(5), +(c * mult).toFixed(5), typeof v === 'number' && isFinite(v) ? v : 0]);
  }
  return out.length > max ? out.slice(out.length - max) : out;
}
export const GRAFICO = { '5m': { intervalo: '5m', range: '5d' }, '15m': { intervalo: '15m', range: '1mo' }, '60m': { intervalo: '60m', range: '3mo' }, '1d': { intervalo: '1d', range: '2y' } };
async function yahoo(caminho, fetcher) {
  let ultima = null;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try { const r = await fetcher('https://' + host + caminho, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }); if (r.ok) return r; ultima = r; } catch {}
  }
  return ultima;
}
/** Retorna {status, body, ttl}. */
export async function buscarCandles(p, fetcher = fetch, agora = Date.now() / 1000) {
  const m = mapa(String(p.ativo || '').slice(0, 20), String(p.sub || '').slice(0, 12));
  if (!m) return { status: 400, body: { error: 'Não sei qual gráfico usar para esse ativo.' } };
  const base = { simbolo: m.y, proxy: m.proxy, nota: m.nota, fonte: 'Yahoo Finance' };
  const g = GRAFICO[String(p.intervalo || '')];
  let caminho, intervalo, max = 400, ttl;
  if (g) { intervalo = g.intervalo; max = 600; ttl = 120; caminho = `/v8/finance/chart/${encodeURIComponent(m.y)}?range=${g.range}&interval=${g.intervalo}&includePrePost=false`; }
  else {
    const j = janela(String(p.de || ''), String(p.ate || ''), agora);
    if (!j) return { status: 400, body: { error: 'Data do trade inválida.' } };
    intervalo = j.intervalo; ttl = 600;
    caminho = `/v8/finance/chart/${encodeURIComponent(m.y)}?period1=${Math.floor(j.p1)}&period2=${Math.floor(j.p2)}&interval=${j.intervalo}&includePrePost=false`;
  }
  const r = await yahoo(caminho, fetcher);
  if (!r || !r.ok) return { status: 502, body: { error: 'Yahoo ' + (r?.status || 'sem resposta') } };
  const candles = leYahoo(await r.json(), m.mult, max);
  if (!candles.length && !g) return { status: 404, body: { error: 'Sem candles para esse período (feriado, fim de semana ou fora do horário).' } };
  return { status: 200, ttl, body: { ...base, intervalo, consultadoEm: new Date(agora * 1000).toISOString(), candles } };
}
