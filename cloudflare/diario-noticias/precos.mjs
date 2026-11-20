/* v836 — Preços sob demanda na Cloudflare (gerado de supabase/functions/precos/index.ts, sem auth):
 * brapi (B3) e Twelve Data (EUA e USD/BRL) com as chaves guardadas como segredos do Worker
 * (BRAPI_TOKEN e TWELVE_KEY). Sem chave configurada, o app continua usando o Supabase.
 */
export const limpaBR = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
export const limpaUS = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12);
export function temChaves(env) { return !!(env && (env.BRAPI_TOKEN || env.TWELVE_KEY)); }
export async function buscarPrecos(env, brIn, usIn, fetcher = fetch) {
  const br = [...new Set((brIn || []).map(limpaBR).filter(Boolean))].slice(0, 40);
  const us = [...new Set((usIn || []).map(limpaUS).filter(Boolean))].slice(0, 40);
  const out = { br: {}, us: {}, fx: 0, erros: [], fonte: 'cloudflare' };
  const bt = env?.BRAPI_TOKEN || '', td = env?.TWELVE_KEY || '';
  const lote = Math.min(20, Math.max(1, Number(env?.BRAPI_LOTE || (bt ? 10 : 1))));
  for (let i = 0; i < br.length; i += lote) {
    const g = br.slice(i, i + lote);
    try {
      const r = await fetcher('https://brapi.dev/api/quote/' + g.join(','), { headers: bt ? { Authorization: 'Bearer ' + bt } : {}, signal: AbortSignal.timeout(10000) });
      const j = await r.json();
      for (const q of j.results ?? []) if (q.regularMarketPrice > 0) out.br[q.symbol] = q.regularMarketPrice;
      for (const s of g) if (!out.br[s]) out.erros.push(s);
    } catch { out.erros.push(...g); }
  }
  if (td) {
    const ut = [...us, 'USD/BRL'];
    for (let i = 0; i < ut.length; i += 8) {
      const g = ut.slice(i, i + 8);
      try {
        const r = await fetcher('https://api.twelvedata.com/price?symbol=' + encodeURIComponent(g.join(',')) + '&apikey=' + encodeURIComponent(td), { signal: AbortSignal.timeout(10000) });
        const j = await r.json();
        for (const s of g) { const v = g.length === 1 ? j : j[s], p = Number(v?.price); if (p > 0) { if (s === 'USD/BRL') out.fx = p; else out.us[s] = p; } else out.erros.push(s); }
      } catch { out.erros.push(...g); }
    }
  } else out.erros.push(...us);
  return out;
}
