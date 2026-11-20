/* v836 — Fluxo de opções do EWZ na Cloudflare (antes no Supabase: tabelas ewz_* gravadas a cada 5 min).
 * Coleta no cron do Worker a cada ~6 min no pregão americano e guarda TUDO numa chave do KV (1 escrita por coleta).
 * Dados públicos e atrasados da Cboe + Yahoo. */
import { contratos, resumo, ivAtm, hv, mapaOi, incremento, estruturas, diasEntre, horaNY } from './ewz-gerado.mjs';
export const EWZ_KEY = 'diario:ewz:v1';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
async function cboe(fetcher) {
  const r = await fetcher('https://cdn.cboe.com/api/global/delayed_quotes/options/EWZ.json', { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('Cboe ' + r.status);
  const d = (await r.json())?.data || {};
  return { ops: Array.isArray(d.options) ? d.options : [], spot: +d.current_price || +d.close || +d.prev_day_close || null };
}
async function yahoo(fetcher) {
  const r = await fetcher('https://query1.finance.yahoo.com/v8/finance/chart/EWZ?range=3mo&interval=1d', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  const j = r.ok ? (await r.json())?.chart?.result?.[0] : null;
  return { f: (j?.indicators?.quote?.[0]?.close || []).filter((v) => typeof v === 'number' && v > 0), px: +j?.meta?.regularMarketPrice || null };
}
/** Pregão americano (seg–sex, 9h45–16h35 em NY) e pelo menos ~5 min desde a última coleta. */
export function ewzColetaAgora(est, agora = new Date()) {
  const ny = horaNY(agora);
  if (ny.semana < 1 || ny.semana > 5 || ny.min < 585 || ny.min > 995) return false;
  return !est?.ts || agora.getTime() - Date.parse(est.ts) >= 290000;
}
/** Uma coleta: devolve o novo estado (o chamador grava no KV). */
export function ewzAvanca(est, C, spot, ny, ts, hv20) {
  const e = est || {}, primeira = e.dia !== ny.dia;
  const base = primeira ? { dia: ny.dia, vols: {}, net_c: 0, net_p: 0, serie: [], boletas: [], oiAnt: e.oiHoje || e.oiAnt || null, oiHoje: null, ivh: e.ivh || [] } : { ...e };
  if (primeira) {
    const oi = {};
    for (const x of C) { const d = diasEntre(ny.dia, x.venc); if (x.oi > 0 && d <= 120 && d >= 0 && Math.abs(x.k / spot - 1) <= 0.3) oi[x.s] = x.oi; }
    base.oiHoje = { dia: ny.dia, oi };
  }
  const inc = incremento(C, primeira ? {} : e.vols || {}, spot, 250000, primeira);
  const R = resumo(C, spot, ny.dia);
  base.net_c = (+base.net_c || 0) + inc.dNetC; base.net_p = (+base.net_p || 0) + inc.dNetP; base.vols = inc.vols; base.ts = ts;
  base.serie = [...base.serie, { ts, spot, net_c: base.net_c, net_p: base.net_p, expo: R.expo }].slice(-200);
  base.boletas = [...base.boletas, ...inc.boletas.map((x) => ({ ts, sym: x.s, venc: x.venc, tipo: x.t, k: x.k, dvol: x.dvol, preco: x.preco, premio: x.premio, lado: x.lado, oi: x.oi, vol: x.vol, delta: x.delta, expo: x.expo }))].slice(-300);
  const I = ivAtm(C, spot, ny.dia);
  if (I.iv30) base.ivh = [...(base.ivh || []).filter((x) => x.dia !== ny.dia), { dia: ny.dia, iv30: I.iv30, hv20, spot }].slice(-260);
  return base;
}
export async function ewzColeta(env, fetcher = fetch, agora = new Date()) {
  const est = await env.NEWS_CACHE.get(EWZ_KEY, 'json').catch(() => null);
  if (!ewzColetaAgora(est, agora)) return null;
  const ny = horaNY(agora), c = await cboe(fetcher), y = await yahoo(fetcher).catch(() => null);
  const spot = c.spot || y?.px; if (!spot) return null;
  const novo = ewzAvanca(est, contratos(c.ops), spot, ny, agora.toISOString(), y ? hv(y.f, 20) : null);
  await env.NEWS_CACHE.put(EWZ_KEY, JSON.stringify(novo));
  return novo;
}
/** Mesmo contrato da ação "agora" da função ewz do Supabase. */
export async function ewzAgora(env, venc0, fetcher = fetch) {
  const ny = horaNY(), c = await cboe(fetcher), y = await yahoo(fetcher).catch(() => null), spot = c.spot || y?.px || y?.f.at(-1);
  if (!spot) throw new Error('Sem a cotação do EWZ agora.');
  const est = (env.NEWS_CACHE && (await env.NEWS_CACHE.get(EWZ_KEY, 'json').catch(() => null))) || {};
  const C = contratos(c.ops), R = resumo(C, spot, ny.dia), I = ivAtm(C, spot, ny.dia), hv20 = y ? hv(y.f, 20) : null;
  const vencs = I.pts.filter((p) => p.dias <= 120).map((p) => ({ venc: p.venc, dias: p.dias, iv: +p.iv.toFixed(4) }));
  const venc = vencs.some((v) => v.venc === venc0) ? String(venc0) : (vencs.find((v) => v.dias >= 7) || vencs[0] || { venc: '' }).venc;
  const oiAnt = est.oiHoje && est.oiHoje.dia < ny.dia ? est.oiHoje : est.oiAnt || null;
  const M = venc ? mapaOi(C, spot, venc, oiAnt?.oi || null) : null;
  const B = (est.boletas || []).map((x) => ({ s: x.sym, venc: x.venc, t: x.tipo, k: +x.k, dvol: +x.dvol, lado: x.lado, ts: String(x.ts).slice(0, 16), preco: +x.preco, premio: +x.premio, oi: +x.oi, vol: +x.vol, delta: +x.delta, expo: +x.expo }));
  const iv30 = I.pts.length ? I.iv30 : null, ivs = (est.ivh || []).map((x) => +x.iv30).filter((v) => v > 0);
  const rank = iv30 != null && ivs.length >= 20 ? (iv30 - Math.min(...ivs)) / ((Math.max(...ivs) - Math.min(...ivs)) || 1) : null;
  const p30 = I.pts.find((p) => p.dias >= 25 && p.strad != null) || I.pts.find((p) => p.strad != null);
  return {
    gerado: new Date().toISOString(), fonte: 'Cboe (cotações atrasadas ~15 min) e Yahoo', origem: 'cloudflare', ny, spot, ...R,
    vol: { iv30, hv20, rank, nHist: ivs.length, mov1dp: iv30 != null ? iv30 * Math.sqrt(30 / 365) : null, strad: p30 ? { venc: p30.venc, dias: p30.dias, pct: p30.strad / spot, usd: p30.strad } : null, pts: I.pts.slice(0, 8) },
    vencs, venc, oi: M, oiDia: oiAnt?.dia || null, dia: est.dia || ny.dia, serie: (est.serie || []).map(({ ts, spot, net_c, net_p, expo }) => ({ ts, spot, net_c, net_p, expo })),
    boletas: B.sort((a, b) => b.premio - a.premio).slice(0, 40), estruturas: estruturas(B).slice(0, 15),
  };
}
