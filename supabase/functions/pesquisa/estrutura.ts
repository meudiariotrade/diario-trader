// v621: motor técnico da Revista da Semana, compartilhado com a aba Análises (mesmo código do app).
// Teoria de Dow (pivôs), Ondas de Elliott (ciclo e extensões), Fibonacci, elástico MM20/MM10s, RSI 14 e price action.
// deno-lint-ignore-file
const r = (u: any) => typeof u == "number" && Number.isFinite(u);
const j = (u: number) => new Date(u * 1e3).toISOString().slice(0, 10);
export function B(u: any[]) {
  if (u.length < 15) return null;
  let P = 0, m = 0;
  for (let c = 1; c < u.length; c++) {
    const q = u[c][4] - u[c - 1][4];
    c <= 14 ? ((P += Math.max(0, q)), (m += Math.max(0, -q)), c === 14 && ((P /= 14), (m /= 14))) : ((P = (P * 13 + Math.max(0, q)) / 14), (m = (m * 13 + Math.max(0, -q)) / 14));
  }
  return P === 0 && m === 0 ? 50 : m === 0 ? 100 : 100 - 100 / (1 + P / m);
}
const media = (u: any[], P: number) => (u.length >= P ? u.slice(-P).reduce((m, c) => m + c[4], 0) / P : null);
const tend = (u: number, P: any, m: any) => (P == null || m == null ? "não avaliada" : u > P && P > m ? "alta" : u < P && P < m ? "baixa" : "indefinida");
      const pct = (a, b) => (r(a) && r(b) && b !== 0 ? (a / b - 1) * 100 : null);
      export function tec(m: any[], c: any[], x: any): any {
        const n = m.length,
          px = m[n - 1][4],
          J = Math.min(40, n),
          L = m.slice(-J);
        let iH = 0, iL = 0;
        L.forEach((b, k) => { b[2] >= L[iH][2] && (iH = k); b[3] <= L[iL][3] && (iL = k); });
        const H = L[iH][2], Lo = L[iL][3], amp = H - Lo,
          alta = iH > iL,
          niv = [0.382, 0.5, 0.618].map((f) => ({ f, v: alta ? H - amp * f : Lo + amp * f })),
          perna = {
            direcao: alta ? "alta" : "baixa",
            de: alta ? Lo : H, ate: alta ? H : Lo,
            inicio: j(L[alta ? iL : iH][0]), fim: j(L[alta ? iH : iL][0]),
            sessoes: Math.abs(iH - iL), janela: J,
          },
          ret = amp > 0 ? (alta ? (H - px) / amp : (px - Lo) / amp) * 100 : null;
        // price action dos últimos 5 candles
        const U = m.slice(-6), pa = [];
        let inside = 0;
        for (let k = 1; k < U.length; k++) {
          const b = U[k], a = U[k - 1], corpo = Math.abs(b[4] - b[1]), rg = b[2] - b[3] || 1e-9,
            sup = b[2] - Math.max(b[1], b[4]), inf = Math.min(b[1], b[4]) - b[3], dia = j(b[0]);
          b[2] <= a[2] && b[3] >= a[3] && (inside++, pa.push({ tipo: "inside bar", dia, nota: "compressão de volatilidade dentro da barra anterior" }));
          sup >= 2 * corpo && sup / rg >= 0.5 && pa.push({ tipo: "pavio superior longo", dia, nota: "rejeição vendedora na máxima (possível armadilha de compra)" });
          inf >= 2 * corpo && inf / rg >= 0.5 && pa.push({ tipo: "pavio inferior longo", dia, nota: "rejeição compradora na mínima (possível armadilha de venda)" });
        }
        const V = U.slice(1), up = (i) => V.slice(1).every((b, k) => b[i] > V[k][i]), dn = (i) => V.slice(1).every((b, k) => b[i] < V[k][i]),
          hh = V.slice(1).filter((b, k) => b[2] > V[k][2]).length, hl = V.slice(1).filter((b, k) => b[3] > V[k][3]).length,
          seq = up(2) && up(3) ? "topos e fundos ascendentes nos 5 candles"
            : dn(2) && dn(3) ? "topos e fundos descendentes nos 5 candles"
            : hh >= 3 && hl >= 3 ? "maioria de topos e fundos ascendentes"
            : hh <= 1 && hl <= 1 ? "maioria de topos e fundos descendentes" : "sequência mista (sem direção clara nos 5 candles)";
        // polaridade: nível rompido antes dos últimos 5 candles (antiga resistência/suporte)
        const A = m.slice(-45, -5), resA = A.length ? Math.max(...A.map((b) => b[2])) : null, supA = A.length ? Math.min(...A.map((b) => b[3])) : null;
        let pol = null;
        r(resA) && px > resA && Math.abs(pct(px, resA)) <= 3
          ? (pol = { tipo: "resistência rompida", nivel: resA, dist: pct(px, resA), nota: "antiga resistência pode atuar como suporte (polaridade)" })
          : r(supA) && px < supA && Math.abs(pct(px, supA)) <= 3
            ? (pol = { tipo: "suporte rompido", nivel: supA, dist: pct(px, supA), nota: "antigo suporte pode atuar como resistência (polaridade)" })
            : r(resA) && px <= resA && Math.abs(pct(px, resA)) <= 1.5
              ? (pol = { tipo: "resistência próxima", nivel: resA, dist: pct(px, resA), nota: "teste da máxima anterior ainda não rompida" })
              : r(supA) && px >= supA && Math.abs(pct(px, supA)) <= 1.5 &&
                (pol = { tipo: "suporte próximo", nivel: supA, dist: pct(px, supA), nota: "teste da mínima anterior ainda não perdida" });
        // momentum (RSI 14) e perda de força
        const rsi5 = n > 20 ? B(m.slice(0, -5)) : null, px5 = n > 6 ? m[n - 6][4] : null;
        let mom = x.rsi == null ? "não avaliado" : x.rsi >= 70 ? "sobrecompra" : x.rsi <= 30 ? "sobrevenda" : "neutro";
        r(rsi5) && r(px5) && r(x.rsi) && (px > px5 && x.rsi < rsi5 - 2 ? (mom += " · perda de momentum (preço sobe com RSI caindo)") : px < px5 && x.rsi > rsi5 + 2 && (mom += " · perda de força vendedora (preço cai com RSI subindo)"));
        // confluências: Fibonacci × médias × polaridade (até 1% de distância)
        const refs = [["MM20", x.ma20], ["MM50", x.ma50], ["MM200", x.ma200], ["MM10s", x.w10], ["MM40s", x.w40], ...(pol ? [[pol.tipo, pol.nivel]] : [])].filter((q) => r(q[1])),
          conf = niv.map((q) => ({ nivel: (q.f * 100).toFixed(1).replace(".", ",") + "%", valor: q.v, com: refs.filter((z) => Math.abs(pct(z[1], q.v)) <= 1).map((z) => z[0]) })).filter((q) => q.com.length);
        // v619: Teoria de Dow — topos e fundos (swing highs/lows) por fractal; primária (k=5, 200 sessões) e secundária (k=2, 40 sessões)
        const swings = (B0, k) => {
          const S = [];
          for (let i = k; i < B0.length - k; i++) {
            const w = B0.slice(i - k, i + k + 1);
            B0[i][2] >= Math.max(...w.map((b) => b[2])) && S.push({ tipo: "T", v: B0[i][2], i, dia: j(B0[i][0]) });
            B0[i][3] <= Math.min(...w.map((b) => b[3])) && S.push({ tipo: "F", v: B0[i][3], i, dia: j(B0[i][0]) });
          }
          const Z = [];
          for (const q of S.sort((a, b) => a.i - b.i)) {
            const u = Z[Z.length - 1];
            u && u.tipo === q.tipo ? ((q.tipo === "T" ? q.v > u.v : q.v < u.v) && (Z[Z.length - 1] = q)) : Z.push(q);
          }
          return Z;
        };
        const classe = (Z) => {
          const T = Z.filter((q) => q.tipo === "T").slice(-2), F = Z.filter((q) => q.tipo === "F").slice(-2);
          if (T.length < 2 || F.length < 2) return { tend: "indefinida", T, F };
          const hh = T[1].v > T[0].v, hl = F[1].v > F[0].v;
          return { tend: hh && hl ? "alta" : !hh && !hl ? "baixa" : hh ? "transição (topo mais alto, fundo mais baixo)" : "lateral (topo mais baixo, fundo mais alto)", T, F };
        };
        const B200 = m.slice(-200), P1 = classe(swings(B200, 5)), Z2 = swings(m.slice(-40), 2), P2 = classe(Z2),
          ultT = P1.T[P1.T.length - 1], ultF = P1.F[P1.F.length - 1],
          pivo = P1.tend === "alta" ? (ultF ? { tipo: "fundo anterior", v: ultF.v, dia: ultF.dia, nota: "perda em fechamento quebra a sequência de fundos ascendentes" } : null)
            : P1.tend === "baixa" ? (ultT ? { tipo: "topo anterior", v: ultT.v, dia: ultT.dia, nota: "rompimento em fechamento quebra a sequência de topos descendentes" } : null)
            : alta ? (ultF ? { tipo: "fundo anterior", v: ultF.v, dia: ultF.dia, nota: "perda em fechamento confirma a troca de direção" } : null)
            : ultT ? { tipo: "topo anterior", v: ultT.v, dia: ultT.dia, nota: "rompimento em fechamento confirma a troca de direção" } : null,
          acima = Z2.filter((q) => q.tipo === "T" && q.v > px).map((q) => q.v), abaixo = Z2.filter((q) => q.tipo === "F" && q.v < px).map((q) => q.v),
          dow = {
            primaria: P1.tend, secundaria: P2.tend,
            topos: P1.T.map((q) => ({ v: q.v, dia: q.dia })), fundos: P1.F.map((q) => ({ v: q.v, dia: q.dia })),
            pivo, topoImediato: acima.length ? Math.min(...acima) : null, fundoImediato: abaixo.length ? Math.max(...abaixo) : null,
          };
        // v619: Ondas de Elliott — impulso x correção pela profundidade da retração; extensões 100% e 161,8%
        const posFim = alta ? iH : iL, depois = L.slice(posFim + 1),
          C0 = depois.length ? (alta ? Math.min(...depois.map((b) => b[3])) : Math.max(...depois.map((b) => b[2]))) : px,
          prof = amp > 0 ? (alta ? (H - C0) / amp : (C0 - Lo) / amp) * 100 : null,
          fase = prof == null ? "não avaliada"
            : prof < 23.6 ? "perna impulsiva em andamento (sem correção relevante)"
            : prof < 38.2 ? "correção rasa, típica de pausa dentro do impulso (onda 4 ou B curta)"
            : prof <= 61.8 ? "correção na zona clássica de Fibonacci (ABC ou onda 2)"
            : prof < 100 ? "correção profunda: a leitura de impulso perde força além de 61,8%"
            : "perna devolvida por completo: possível troca de ciclo",
          elliott = {
            tipo: prof != null && prof < 23.6 ? "impulso" : prof != null && prof < 100 ? "correção" : "reversão",
            fase, profundidade: prof, baseC: C0,
            gatilho: alta ? H : Lo,
            ext100: amp > 0 ? (alta ? C0 + amp : C0 - amp) : null,
            ext1618: amp > 0 ? (alta ? C0 + 1.618 * amp : C0 - 1.618 * amp) : null,
            invalida: alta ? Lo : H,
          };
        // referências acionáveis mais próximas do preço (quadro final)
        const cand = [["MM20", x.ma20], ["Fibonacci 38,2%", niv[0].v], ["Fibonacci 50%", niv[1].v], ["topo imediato", dow.topoImediato], ["fundo imediato", dow.fundoImediato], [alta ? "topo da perna" : "fundo da perna", alta ? H : Lo]].filter((q) => r(q[1])),
          refAlta = cand.filter((q) => q[1] > px * 1.0005).sort((a, b) => a[1] - b[1])[0] || null,
          refBaixa = cand.filter((q) => q[1] < px * 0.9995).sort((a, b) => b[1] - a[1])[0] || null;
        const invQ = alta ? [...P1.F].reverse().find((q) => q.v < px) : [...P1.T].reverse().find((q) => q.v > px),
          invalidacao = invQ ? { v: invQ.v, tipo: alta ? "fundo anterior" : "topo anterior", dia: invQ.dia } : { v: alta ? Lo : H, tipo: "início da perna", dia: perna.inicio };
        return {
          dow, elliott, refAlta, refBaixa, invalidacao,
          perna, fibo: niv, retracao: ret,
          elastico20: pct(px, x.ma20), elastico10s: pct(px, x.w10), dist50: pct(px, x.ma50), dist200: pct(px, x.ma200),
          zonaValor: r(x.ma20) && r(x.w10) ? (Math.abs(pct(px, x.ma20)) <= 1.5 ? "na zona de valor diária (até 1,5% da MM20)" : Math.abs(pct(px, x.ma20)) >= 5 ? "esticado longe da MM20 (5% ou mais)" : "fora da zona de valor, sem esticamento extremo") : "não avaliada",
          pa, inside, seq, pol, rsi5, mom, conf,
        };
      }

/** Estudo completo de um ativo a partir dos candles diários e semanais [t,o,h,l,c,v]. */
export function estudo(diario: any[], semanal: any[]) {
  const m = diario, c = semanal;
  if (!m || m.length < 60) return null;
  const q = m[m.length - 1], H = m.slice(-21, -1);
  const ma20 = media(m, 20), ma50 = media(m, 50), ma200 = media(m, 200), w10 = media(c, 10), w40 = media(c, 40), rsi = B(m);
  const base = { ultimo: j(q[0]), close: q[4], ma20, ma50, ma200, w10, w40, rsi, support: Math.min(...H.map((I: any) => I[3])), resistance: Math.max(...H.map((I: any) => I[2])),
    dailyTrend: tend(q[4], ma20, ma50), weeklyTrend: tend(q[4], w10, w40) };
  let tech = null;
  try { tech = tec(m, c, { ma20, ma50, ma200, w10, w40, rsi }); } catch { tech = null; }
  return { ...base, tech, opcoes: opcoes(base, tech) };
}
/** Contexto prático para estruturas com opções (educacional): níveis para venda coberta, travas e compra a seco. */
export function opcoes(h: any, t: any) {
  if (!t) return null;
  const px = h.close, res = [t.refAlta?.[1], t.dow?.topoImediato, h.resistance].filter((v) => r(v) && v > px).sort((a, b) => a - b),
    sup = [t.refBaixa?.[1], t.dow?.fundoImediato, h.support].filter((v) => r(v) && v < px).sort((a, b) => b - a);
  return {
    venda_coberta: res[0] ?? null, // strike de referência acima do preço (resistência mais próxima)
    trava_alta: sup[0] != null && res[0] != null ? { comprada: sup[0], vendida: res[0] } : null,
    trava_baixa: res[0] != null && sup[0] != null ? { comprada: res[0], vendida: sup[0] } : null,
    compra_seco_gatilho: t.elliott?.gatilho ?? null, alvo_extensao: t.elliott?.ext100 ?? null, invalidacao: t.invalidacao?.v ?? null,
    rsi: h.rsi, elastico20: t.elastico20, direcao: t.perna?.direcao || null,
  };
}
