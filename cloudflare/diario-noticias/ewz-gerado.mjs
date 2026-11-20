/* GERADO por scripts/gerar-worker-macro.cjs a partir de supabase/functions/ewz — não edite aqui. */
// Função EWZ — arquivo único para colar no editor do Supabase (Edge Functions → ewz → index.ts)

// ===== cálculo =====
// supabase/functions/ewz/calc.ts — leitura do fluxo de opções do EWZ (dados atrasados da Cboe). Funções puras, testadas em calc.test.mts.
// Ideia: classificar cada execução pelo último preço em relação ao bid/ask (estimativa, não infalível), somar prêmios
// (net premium) de calls e puts, e cruzar com open interest, volatilidade implícita e exposição em delta.
                                                                                                                                                                                                          
                                                                                                                                                                                                                     
                                                                                                                                                                                                           

/** "EWZ261120C00030000" → vencimento, tipo e strike. */
export function leSimbolo(s        )                                                   {
  const m = /^[A-Z]+(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/.exec(String(s || ''));
  if (!m) return null;
  return { venc: `20${m[1]}-${m[2]}-${m[3]}`, t: m[4]             , k: +m[5] / 1000 };
}
/** Lado estimado da execução: perto do ask = compra; perto do bid = venda; no meio = indefinido. */
export function ladoDe(last        , bid        , ask        )                         {
  if (!(last > 0)) return null;
  if (!(ask > 0) || !(ask >= bid)) return 'M';
  const sp = ask - bid;
  if (sp <= 0) return last >= ask ? 'C' : last <= bid ? 'V' : 'M';
  if (last >= ask - 0.25 * sp) return 'C';
  if (last <= bid + 0.25 * sp) return 'V';
  return 'M';
}
export function contratos(ops      )       {
  const out       = [];
  for (const o of ops || []) {
    const p = leSimbolo(o.option); if (!p) continue;
    const last = +o.last_trade_price || 0, vol = +o.volume || 0, bid = +o.bid || 0, ask = +o.ask || 0;
    out.push({ s: o.option, ...p, bid, ask, last, vol, oi: +o.open_interest || 0, iv: +o.iv || 0, d: +o.delta || 0, g: +o.gamma || 0, lado: vol > 0 ? ladoDe(last, bid, ask) : null, prem: vol * last * 100 });
  }
  return out;
}
const sinal = (l            ) => (l === 'C' ? 1 : l === 'V' ? -1 : 0);
export function vies(netC        , netP        )                                     {
  if (netC > 0 && netP < 0) return 'comprador';
  if (netC < 0 && netP > 0) return 'vendedor';
  return 'misto';
}
export function diasEntre(a        , b        ) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
/** IV no dinheiro de cada vencimento e a interpolada para 30 dias (variância total). */
export function ivAtm(C      , spot        , hoje        ) {
  const vs = [...new Set(C.map((c) => c.venc))].filter((v) => v >= hoje).sort();
  const pts                                                                     = [];
  for (const v of vs) {
    const L = C.filter((c) => c.venc === v && c.iv > 0.01 && c.iv < 3); if (!L.length) continue;
    const k = L.reduce((b, c) => (Math.abs(c.k - spot) < Math.abs(b - spot) ? c.k : b), L[0].k);
    const at = L.filter((c) => c.k === k); const iv = at.reduce((a, c) => a + c.iv, 0) / at.length;
    const ca = C.find((c) => c.venc === v && c.k === k && c.t === 'C'), pu = C.find((c) => c.venc === v && c.k === k && c.t === 'P');
    const mid = (c     ) => (c && c.bid > 0 && c.ask >= c.bid ? (c.bid + c.ask) / 2 : c && c.last > 0 ? c.last : null);
    const s = mid(ca) != null && mid(pu) != null ? mid(ca)  + mid(pu)  : null;
    pts.push({ venc: v, dias: Math.max(1, diasEntre(hoje, v)), iv, strad: s });
  }
  let iv30                = null;
  if (pts.length) {
    const a = [...pts].reverse().find((p) => p.dias <= 30), b = pts.find((p) => p.dias >= 30);
    if (a && b && b.dias > a.dias) { const w = (30 - a.dias) / (b.dias - a.dias), v2 = (a.iv ** 2 * a.dias * (1 - w) + b.iv ** 2 * b.dias * w) / 30; iv30 = Math.sqrt(v2); }
    else iv30 = (a || b) .iv;
  }
  return { pts, iv30 };
}
/** Volatilidade realizada anualizada (desvio dos retornos diários em log). */
export function hv(fech          , n = 20)                {
  const L = fech.slice(-(n + 1)); if (L.length < n + 1) return null;
  const r = L.slice(1).map((v, i) => Math.log(v / L[i])), m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)) * Math.sqrt(252);
}
export function resumo(C      , spot        , hoje        ) {
  let netC = 0, netP = 0, volC = 0, volP = 0, oiC = 0, oiP = 0, premC = 0, premP = 0, expo = 0;
  for (const c of C) {
    if (c.venc < hoje) continue;
    const sg = sinal(c.lado);
    if (c.t === 'C') { volC += c.vol; oiC += c.oi; premC += c.prem; netC += sg * c.prem; } else { volP += c.vol; oiP += c.oi; premP += c.prem; netP += sg * c.prem; }
    expo += sg * c.vol * 100 * c.d * spot;
  }
  const top = C.filter((c) => c.vol > 0 && c.venc >= hoje).sort((a, b) => b.prem - a.prem).slice(0, 15)
    .map((c) => ({ s: c.s, venc: c.venc, t: c.t, k: c.k, vol: c.vol, oi: c.oi, preco: c.last, premio: Math.round(c.prem), lado: c.lado, abertura: c.vol > c.oi, iv: c.iv, delta: c.d, expo: Math.round(sinal(c.lado) * c.vol * 100 * c.d * spot) }));
  return { netC: Math.round(netC), netP: Math.round(netP), volC, volP, oiC, oiP, premC: Math.round(premC), premP: Math.round(premP), pcVol: volC ? volP / volC : null, pcOi: oiC ? oiP / oiC : null, expo: Math.round(expo), vies: vies(netC, netP), top };
}
/** OI por strike (calls e puts) num vencimento, perto do preço, com GEX (OI × gama × 100 × S² × 1%). */
export function mapaOi(C      , spot        , venc        , antes                               , faixa = 0.25) {
  const by                                                                                                           = {};
  for (const c of C) {
    if (c.venc !== venc || Math.abs(c.k / spot - 1) > faixa) continue;
    const o = (by[c.k] ??= { k: c.k, oc: 0, op: 0, dc: null, dp: null, gex: 0 });
    const d = antes && antes[c.s] != null ? c.oi - antes[c.s] : null;
    if (c.t === 'C') { o.oc += c.oi; o.dc = d; o.gex += c.oi * c.g * 100 * spot * spot * 0.01; } else { o.op += c.oi; o.dp = d; o.gex -= c.oi * c.g * 100 * spot * spot * 0.01; }
  }
  const L = Object.values(by).sort((a, b) => a.k - b.k);
  const callWall = L.filter((x) => x.k >= spot).reduce                    ((b, x) => (!b || x.oc > b.oc ? x : b), null);
  const putWall = L.filter((x) => x.k <= spot).reduce                    ((b, x) => (!b || x.op > b.op ? x : b), null);
  let flip                = null, acc = 0; const tot = L.reduce((a, x) => a + x.gex, 0);
  for (let i = 0; i < L.length; i++) { const a0 = acc; acc += L[i].gex; if (i && Math.sign(a0) !== Math.sign(acc) && a0 !== 0) { flip = L[i].k; } }
  return { L, callWall: callWall ? callWall.k : null, putWall: putWall ? putWall.k : null, gex: Math.round(tot), flip };
}
/** Diferença de volume desde a última leitura: vira "boleta" quando o prêmio da diferença passa do mínimo. */
export function incremento(C      , antes                        , spot        , minPremio = 250_000, primeira = false) {
  let dNetC = 0, dNetP = 0; const bol           = [], vols                         = {};
  for (const c of C) {
    vols[c.s] = c.vol; const dv = c.vol - (antes[c.s] || 0); if (dv <= 0 || !(c.last > 0)) continue;
    const pr = dv * c.last * 100, sg = sinal(c.lado);
    if (c.t === 'C') dNetC += sg * pr; else dNetP += sg * pr;
    if (!primeira && pr >= minPremio) bol.push({ s: c.s, venc: c.venc, t: c.t, k: c.k, dvol: dv, preco: c.last, premio: Math.round(pr), lado: c.lado, oi: c.oi, vol: c.vol, delta: c.d, expo: Math.round(sg * dv * 100 * c.d * spot) });
  }
  return { dNetC: Math.round(dNetC), dNetP: Math.round(dNetP), boletas: bol.sort((a, b) => b.premio - a.premio).slice(0, 25), vols };
}
/** Estruturas prováveis entre boletas do mesmo intervalo (hipóteses, não certezas). */
export function estruturas(B                                                                                                        ) {
  const out                                                    = [], usado = new Set        ();
  const perto = (a        , b        , r = 0.15) => Math.abs(a - b) <= Math.max(a, b) * r;
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    if (usado.has(i) || usado.has(j)) continue; const a = B[i], b = B[j];
    if ((a.ts || '') !== (b.ts || '')) continue;
    let tipo = '';
    if (a.venc === b.venc && a.t === b.t && a.k !== b.k && a.lado && b.lado && a.lado !== b.lado && a.lado !== 'M' && b.lado !== 'M') {
      const comp = a.lado === 'C' ? a : b, vend = a.lado === 'C' ? b : a;
      if (perto(a.dvol, b.dvol)) tipo = a.t === 'C' ? (comp.k < vend.k ? 'trava de alta com calls' : 'trava de baixa com calls') : (comp.k > vend.k ? 'trava de baixa com puts' : 'trava de alta com puts');
      else if (a.t === 'C' && perto(vend.dvol, comp.dvol * 2, 0.2) && vend.k > comp.k) tipo = 'booster (1 comprada × 2 vendidas)';
    } else if (a.venc === b.venc && a.k === b.k && a.t !== b.t && perto(a.dvol, b.dvol)) {
      const ca = a.t === 'C' ? a : b, pu = a.t === 'C' ? b : a;
      if (ca.lado === 'C' && pu.lado === 'V') tipo = 'sintético comprado (compra call + vende put)';
      else if (ca.lado === 'V' && pu.lado === 'C') tipo = 'sintético vendido (vende call + compra put)';
      else if (ca.lado === 'C' && pu.lado === 'C') tipo = 'straddle comprado (aposta em movimento)';
      else if (ca.lado === 'V' && pu.lado === 'V') tipo = 'straddle vendido (venda de volatilidade)';
    } else if (a.venc !== b.venc && a.t === b.t && perto(a.k, b.k, 0.05) && perto(a.dvol, b.dvol) && a.lado && b.lado && a.lado !== b.lado) tipo = 'rolagem provável';
    if (tipo) { usado.add(i); usado.add(j); out.push({ tipo, pernas: [a.s, b.s], ts: a.ts }); }
  }
  return out;
}
/** Horário de Nova York (para saber se o pregão americano está aberto). */
export function horaNY(d = new Date())                                               {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(d);
  const g = (t        ) => p.find((x) => x.type === t)?.value || '';
  return { dia: `${g('year')}-${g('month')}-${g('day')}`, min: (+g('hour') % 24) * 60 + +g('minute'), semana: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')) };
}

