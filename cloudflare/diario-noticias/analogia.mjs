/* v833 — "Última vez parecida": compara a direção do dia de seis mercados com o histórico diário
 * e devolve o dia mais recente com o mesmo padrão e o que aconteceu nos 5 pregões seguintes.
 * Dado público (Yahoo Finance, gráfico diário de 3 anos), calculado na Cloudflare e guardado no KV.
 * Comparação de direção, não previsão.
 */
export const ATIVOS = [
  ['spx', '^GSPC'], ['ndx', '^IXIC'], ['ibov', '^BVSP'], ['ouro', 'GC=F'], ['btc', 'BTC-USD'], ['petroleo', 'CL=F']
];
const UA = 'Mozilla/5.0 (compatible; DiarioTrader/1.0)';
const MIN_HOJE = 0.5, MIN_PASSADO = 0.3;

export function serieDeChart(json) {
  const r = json?.chart?.result?.[0], ts = r?.timestamp || [], c = r?.indicators?.quote?.[0]?.close || [];
  const off = Number(r?.meta?.gmtoffset || 0), out = new Map();
  for (let i = 0; i < ts.length; i++) {
    const v = Number(c[i]);
    if (!Number.isFinite(v) || v <= 0) continue;
    out.set(new Date((ts[i] + off) * 1000).toISOString().slice(0, 10), v);
  }
  return out;
}
export function retornos(serie) {
  const datas = [...serie.keys()].sort(), out = new Map();
  for (let i = 1; i < datas.length; i++) out.set(datas[i], (serie.get(datas[i]) / serie.get(datas[i - 1]) - 1) * 100);
  return { datas, ret: out };
}
const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);

/* series: { spx: Map(data→fechamento), ... } — calcula o quadro do dia e a última vez parecida. */
export function calcularAnalogia(series, agora = new Date()) {
  const R = {};
  for (const [k] of ATIVOS) if (series[k]) R[k] = retornos(series[k]);
  if (!R.spx || R.spx.datas.length < 30) return null;
  const hojeData = R.spx.datas.at(-1), hoje = {};
  for (const [k] of ATIVOS) hoje[k] = R[k] ? r2(R[k].ret.get(hojeData)) : null;
  const fortes = Object.entries(hoje).filter(([, v]) => v != null && Math.abs(v) >= MIN_HOJE);
  const quedas = fortes.filter(([, v]) => v < 0).length, altas = fortes.length - quedas;
  const titulo = fortes.length >= 4 && (quedas === fortes.length || altas === fortes.length)
    ? (quedas ? 'Tudo caindo junto hoje' : 'Tudo subindo junto hoje') : 'Movimento do dia entre mercados';
  const padrao = fortes.length ? (quedas >= altas ? quedas + ' de ' + fortes.length + ' em queda forte' : altas + ' de ' + fortes.length + ' em alta forte') : 'sem movimento forte';
  let ultima = null, vezes = 0;
  if (fortes.length >= 3) {
    const datas = R.spx.datas;
    for (let i = datas.length - 2; i >= 1; i--) {
      const d = datas[i];
      const ok = fortes.every(([k, v]) => { const p = R[k]?.ret.get(d); return p != null && Math.abs(p) >= MIN_PASSADO && Math.sign(p) === Math.sign(v); });
      if (!ok) continue;
      vezes++;
      if (!ultima) {
        const dia = {}; for (const [k] of fortes) dia[k] = r2(R[k].ret.get(d));
        const depois = (k) => {
          const ds = R[k]?.datas; if (!ds) return null;
          const j = ds.indexOf(d); if (j < 0 || j + 5 >= ds.length) return null;
          return r2((series[k].get(ds[j + 5]) / series[k].get(d) - 1) * 100);
        };
        ultima = { data: d, diasAtras: datas.length - 1 - i, dia, depois5: { spx: depois('spx'), ibov: depois('ibov') } };
      }
    }
  }
  return { versao: 1, gerado: agora.toISOString(), data: hojeData, titulo, padrao, hoje, ultima, vezes, desde: R.spx.datas[1], fonte: 'Yahoo Finance (diário, 3 anos)' };
}

export async function coletarAnalogia(fetcher = fetch) {
  const series = {};
  await Promise.all(ATIVOS.map(async ([k, sym]) => {
    try {
      const r = await fetcher('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=3y&interval=1d', { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (r.ok) series[k] = serieDeChart(await r.json());
    } catch { /* ativo fica de fora */ }
  }));
  return calcularAnalogia(series);
}

/* A cada 30 min no pregão de NY (dias úteis, 09:30–17:00 de NY) e uma vez às 18:00 de NY. */
export function analogiaAgora(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false }).formatToParts(date).map((x) => [x.type, x.value]));
  if (p.weekday === 'Sat' || p.weekday === 'Sun') return false;
  const m = (Number(p.hour) % 24) * 60 + Number(p.minute);
  return (m >= 570 && m <= 1020 && m % 30 === 0) || m === 1080;
}
