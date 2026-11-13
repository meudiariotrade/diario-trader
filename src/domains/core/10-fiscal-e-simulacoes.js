function cngPts(e) {
  const t = CNG[e];
  return t.k ? t.k : CNG[t.inv].k.map(([a, o]) => [a, 1 - o]);
}
function cngSerie(e, t) {
  const a = [];
  for (let o = 0; o < t; o++) {
    const s = o / (t - 1);
    let n = 0;
    for (; n < e.length - 2 && e[n + 1][0] < s; ) n++;
    const [r, i] = e[n],
      [l, d] = e[n + 1];
    a.push(i + (d - i) * (l > r ? (s - r) / (l - r) : 0));
  }
  return a;
}
function cngCandles(e, t, a) {
  const o = [];
  let s = t + e[0] * a;
  return (
    e.forEach((n, r) => {
      const i = t + n * a + (Math.random() - 0.5) * a * 0.035,
        l = r ? s + (Math.random() - 0.5) * a * 0.015 : i - a * 0.02,
        d = Math.max(l, i) + Math.random() * a * 0.03,
        c = Math.min(l, i) - Math.random() * a * 0.03;
      (o.push([l, d, c, i]), (s = i));
    }),
    o
  );
}
function cngSvg(e, t = {}) {
  const a = e
      .flatMap((d) => [d[1], d[2]])
      .concat(t.linhas ? t.linhas.map((d) => d.v) : []),
    o = Math.max(...a),
    s = Math.min(...a),
    n = o - s || 1,
    r = (d) => 12 + ((o - d) / n) * 146,
    i = 320 / e.length;
  let l = "";
  if (
    (e.forEach((d, c) => {
      const p = c * i + i / 2,
        u = d[3] >= d[0] ? "var(--g,#2e8b5d)" : "var(--r,#dc3e26)";
      l += `<line x1="${p}" x2="${p}" y1="${r(d[1])}" y2="${r(d[2])}" stroke="${u}"/><rect x="${p - i * 0.32}" y="${Math.min(r(d[0]), r(d[3]))}" width="${i * 0.64}" height="${Math.max(1, Math.abs(r(d[0]) - r(d[3])))}" fill="${u}"/>`;
    }),
    (t.linhas || []).forEach((d) => {
      l += `<line x1="0" x2="320" y1="${r(d.v)}" y2="${r(d.v)}" stroke="var(--ac,#86abcb)" stroke-dasharray="4 3"/><text x="4" y="${r(d.v) - 3}" font-size="9" fill="var(--ac,#86abcb)">${d.t} ${d.v.toFixed(2).replace(".", ",")}</text>`;
    }),
    t.seta != null)
  ) {
    const d = e[t.seta],
      c = t.seta * i + i / 2;
    l += `<text x="${c}" y="${r(d[2]) + 14}" font-size="12" text-anchor="middle" fill="var(--am,#a98136)">▲</text>`;
  }
  return `<svg viewBox="0 0 320 170" style="width:100%;height:auto;background:var(--card2,transparent);border-radius:12px;margin:8px 0" role="img" aria-label="Gráfico da questão">${l}</svg>`;
}
const cngOpc = (e, t) => {
    const a = [e];
    return (
      cnEmbaralha(t.filter((o) => o !== e))
        .slice(0, 3)
        .forEach((o) => a.push(o)),
      a
    );
  },
  CNG_REF =
    "Edwards & Magee, Análise Técnica de Tendências de Ações; Murphy, Análise Técnica do Mercado Financeiro (formações de reversão e de continuação).";
function cngQuestao() {
  if (Math.random() < 0.22) {
    const l = Object.keys(CNG_CANDLE),
      d = l[Math.floor(Math.random() * l.length)],
      c = d === "est" || d === "enb" || (d === "doji" && Math.random() < 0.5),
      p = 20 + Math.random() * 60,
      u = p * 0.12,
      m = cngSerie(
        c
          ? [
              [0, 0],
              [1, 0.85],
            ]
          : [
              [0, 1],
              [1, 0.15],
            ],
        16,
      ),
      f = cngCandles(m, p, u),
      x = f[f.length - 1],
      v = x[3],
      g = u * 0.05;
    let h;
    (d === "mart"
      ? (h = [v - g * 0.3, v + g * 0.25, v - g * 3.2, v + g * 0.1])
      : d === "est"
        ? (h = [v + g * 0.2, v + g * 3.2, v - g * 0.25, v - g * 0.1])
        : d === "doji"
          ? (h = [v, v + g * 1.6, v - g * 1.6, v + g * 0.02])
          : d === "eng"
            ? (f.push([v + g * 0.2, v + g * 0.4, v - g * 0.9, v - g * 0.7]),
              (h = [v - g * 0.9, v + g * 1.4, v - g * 1.1, v + g * 1.2]))
            : (f.push([v - g * 0.2, v + g * 0.9, v - g * 0.4, v + g * 0.7]),
              (h = [v + g * 0.9, v + g * 1.1, v - g * 1.4, v - g * 1.2])),
      f.push(h));
    const b = Object.values(CNG_CANDLE).map((y) => y.n);
    return {
      id: "g_c_" + d,
      t: "t6",
      q: "No gráfico, qual é o padrão de candle destacado na última barra (▲)?",
      o: cngOpc(CNG_CANDLE[d].n, b.concat(["Harami de alta", "Marubozu"])),
      c: 0,
      e: CNG_CANDLE[d].e,
      r: "Steve Nison, Japanese Candlestick Charting Techniques.",
      g: cngSvg(f, { seta: f.length - 1 }),
    };
  }
  const e = Object.keys(CNG),
    t = e[Math.floor(Math.random() * e.length)],
    a = CNG[t],
    o = +(15 + Math.random() * 80).toFixed(0),
    s = +(o * (0.15 + Math.random() * 0.15)).toFixed(1),
    n = cngPts(t);
  if (a.alvo && Math.random() < 0.45) {
    const l = (g) => +(o + g * s).toFixed(2);
    let d, c, p, u;
    if (a.alvo.band) {
      const g = n,
        h = l(g[0][1]),
        b = l(g[1][1]),
        y = l(g[7][1] + 0.08);
      ((d = y), (c = h), (p = +(y + (b - h)).toFixed(2)));
      const j = cngSerie(g.slice(0, 8).concat([[0.86, g[7][1] + 0.08]]), 40),
        k = cngCandles(j, o, s),
        A = [
          p,
          +(y + (b - h) / 2).toFixed(2),
          +(b + (b - h)).toFixed(2),
          +b.toFixed(2),
        ];
      return {
        id: "g_a_" + t,
        t: "t4",
        q: `Bandeira de alta: o mastro vai de ${h.toFixed(2).replace(".", ",")} a ${b.toFixed(2).replace(".", ",")} e o rompimento da bandeira acontece em ${y.toFixed(2).replace(".", ",")}. Qual é o alvo mínimo pela regra clássica?`,
        o: A.map((C) => "R$ " + C.toFixed(2).replace(".", ",")),
        c: 0,
        e: `Projeta-se o tamanho do mastro (${(b - h).toFixed(2).replace(".", ",")}) a partir do ponto de rompimento: ${y.toFixed(2).replace(".", ",")} + ${(b - h).toFixed(2).replace(".", ",")} = ${p.toFixed(2).replace(".", ",")}.`,
        r: CNG_REF,
        g: cngSvg(k, {
          linhas: [
            { v: h, t: "início" },
            { v: b, t: "topo" },
            { v: y, t: "romp." },
          ],
        }),
      };
    }
    ((d = l(a.alvo.neck)), (c = l(a.alvo.ext)));
    const m = Math.abs(c - d);
    ((p = +(d + a.alvo.dir * m).toFixed(2)),
      (u =
        t === "oco" || t === "ocoi"
          ? ["pescoço", "cabeça"]
          : ["confirmação", t === "td" ? "topos" : "fundos"]));
    const f = n.findIndex((g) => g[0] >= 0.8),
      x = cngCandles(cngSerie(n.slice(0, f + 1), 40), o, s),
      v = [
        p,
        +(d + (a.alvo.dir * m) / 2).toFixed(2),
        +(c - a.alvo.dir * m).toFixed(2),
        +(d - a.alvo.dir * m).toFixed(2),
      ].filter((g, h, b) => b.indexOf(g) === h);
    for (; v.length < 4; )
      v.push(+(p + a.alvo.dir * v.length * m * 0.3).toFixed(2));
    return {
      id: "g_a_" + t,
      t: "t4",
      q: `O gráfico mostra a formação ${a.n}, com ${u[0]} em ${d.toFixed(2).replace(".", ",")} e ${u[1]} em ${c.toFixed(2).replace(".", ",")}. Confirmado o rompimento, qual é o objetivo mínimo de preço?`,
      o: v.slice(0, 4).map((g) => "R$ " + g.toFixed(2).replace(".", ",")),
      c: 0,
      e: `Mede-se a altura da formação (${m.toFixed(2).replace(".", ",")}) e projeta-se a partir do ponto de rompimento, no sentido dele: ${d.toFixed(2).replace(".", ",")} ${a.alvo.dir > 0 ? "+" : "−"} ${m.toFixed(2).replace(".", ",")} = ${p.toFixed(2).replace(".", ",")}.`,
      r: CNG_REF,
      g: cngSvg(x, {
        linhas: [
          { v: d, t: u[0] },
          { v: c, t: u[1] },
        ],
      }),
    };
  }
  const r = cngCandles(cngSerie(n, 44), o, s),
    i = Object.values(CNG).map((l) => l.n);
  return {
    id: "g_p_" + t,
    t: "t4",
    q: "Qual formação gráfica aparece neste gráfico?",
    o: cngOpc(a.n, i.concat(["Retângulo", "Diamante"])),
    c: 0,
    e: a.e,
    r: CNG_REF,
    g: cngSvg(r),
  };
}
{
  const e = cnInicia;
  cnInicia = function (t, a) {
    if (t !== "graf") return e.apply(this, arguments);
    const o = [];
    for (let s = 0; s < 10; s++) o.push(cngQuestao());
    ((CN.run = {
      modo: "graf",
      arg: a,
      L: o.map((s) => ({
        ...s,
        ord: cnEmbaralha([0, 1, 2, 3].slice(0, s.o.length)),
      })),
      i: 0,
      resp: {},
      marc: {},
      ini: Date.now(),
      fim: null,
      acabou: 0,
    }),
      render(),
      scrollTo(0, 0));
  };
}
{
  const e = cnQuestaoHtml;
  cnQuestaoHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = CN.run.L[CN.run.i];
      if (a && a.g)
        return t
          .replace('<div class="cnp">', a.g + '<div class="cnp">')
          .replace(/>Treino \xb7 quest\xe3o/, ">Padrões no gráfico · questão");
    } catch {}
    return t;
  };
}
{
  const e = cnHomeHtml;
  cnHomeHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        "<h2>CT1 · treino por tema</h2>",
        '<h2>Padrões no gráfico</h2><div class="card"><div class="sm" style="color:var(--mut)">Gráficos gerados na hora: identifique OCO, topos e fundos duplos, triângulos, bandeiras, cunhas e candles, e calcule o objetivo de preço como a prova cobra. Cada rodada é diferente.</div><button class="btn" data-cnm="graf" data-v="ct" style="width:100%;margin-top:8px">📈 Treinar com gráficos (10)</button></div><h2>CT1 · treino por tema</h2>',
      );
  };
}
const IR_ETF = new Set([
  "BOVA11",
  "IVVB11",
  "SMAL11",
  "HASH11",
  "BOVV11",
  "SPXI11",
  "DIVO11",
  "GOLD11",
  "XINA11",
  "NASD11",
  "ECOO11",
  "BRAX11",
  "PIBB11",
  "FIND11",
  "MATB11",
  "ISUS11",
  "QBTC11",
  "ETHE11",
  "BITH11",
  "BOVX11",
  "XBOV11",
  "ACWI11",
  "EURP11",
  "WRLD11",
  "USDB11",
  "B5P211",
  "IMAB11",
  "FIXA11",
]);
function irVencISO(e) {
  const [t, a] = e.split("-").map(Number),
    o = new Date(t, a + 1, 0, 12);
  for (; o.getDay() % 6 === 0; ) o.setDate(o.getDate() - 1);
  return ymd(o);
}
function irClasse(e) {
  const t = String(e.ativo || "")
      .toUpperCase()
      .trim(),
    a = String(e.dt).slice(0, 10),
    o = String(e.dtx || e.dt).slice(0, 10);
  return a === o
    ? "D"
    : (e.tipo || "D") === "O" ||
        /^(WIN|WDO|IND|DOL|BGI|CCM|ICF|SJC|DI1|WSP|BIT)/.test(t) ||
        /^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(t)
      ? "O"
      : /11$/.test(t)
        ? IR_ETF.has(t)
          ? "O"
          : "F"
        : /^[A-Z]{4}[345678]$/.test(t)
          ? "A"
          : "O";
}
function irPrevia() {
  const e = new Set(((S.ir || {}).notas || []).map((n) => n.d.slice(0, 7))),
    t = {};
  S.trades.forEach((n) => {
    var r;
    if (n.forex || moedaT(n) !== "BRL") return;
    const i = calc(n);
    if (i.pl == null) return;
    const l = String(n.dtx || n.dt).slice(0, 7);
    if (window.irCobertura?.(l).conferida) return;
    const d = irClasse(n),
      c = t[l] ?? (t[l] = { c: {}, n: 0, irrf: 0 }),
      p = (r = c.c)[d] ?? (r[d] = { bruto: 0, vendas: 0 });
    ((p.bruto += i.pl), c.n++);
    const u = numN(n.qty) || 0,
      m = n.side === "V" ? numN(n.entry) : numN(n.exit);
    (d === "A" && m && u && (p.vendas += m * u),
      d === "D" && i.pl > 0
        ? (c.irrf += i.pl * 0.01)
        : d !== "D" && m && u && (c.irrf += m * u * (numN(n.pv) || 1) * 5e-5));
  });
  const a = { D: 0, A: 0, O: 0, F: 0 },
    o = [];
  let s = 0;
  return (
    Object.keys(t)
      .sort()
      .forEach((n) => {
        const r = t[n],
          i = [];
        let l = 0;
        for (const u of Object.keys(IRC)) {
          const m = r.c[u];
          if (!m) continue;
          const [f, x, v] = IRC[u];
          let g = 0,
            h = 0,
            b = 0,
            y = !1;
          (u === "A" && m.vendas <= v && m.bruto >= 0
            ? (y = !0)
            : m.bruto < 0
              ? (a[u] += -m.bruto)
              : ((g = Math.min(a[u], m.bruto)),
                (a[u] -= g),
                (h = m.bruto - g),
                (b = h * x)),
            (l += b),
            i.push({
              k: u,
              nm: f,
              liq: m.bruto,
              comp: g,
              base: h,
              tx: b,
              isento: y,
              vendas: m.vendas,
            }));
        }
        const d = Math.min(r.irrf, l),
          c = l - d + s;
        let p = 0;
        (c >= 10 ? ((p = c), (s = 0)) : (s = c),
          o.push({ m: n, rows: i, imp: l, irrf: d, darf: p, n: r.n, prev: 1 }));
      }),
    o
  );
}
function irPendentes() {
  const e = (S.ir || {}).pago || {},
    t = ymd(new Date()),
    a = [];
  try {
    irCalc().out.forEach((o) => {
      o.darf > 0 && window.irCobertura?.(o.m).conferida &&
        a.push({ m: o.m, v: o.darf, venc: irVencISO(o.m), prev: 0 });
    });
  } catch {}
  return (
    irPrevia().forEach((o) => {
      o.darf > 0 &&
        a.push({ m: o.m, v: o.darf, venc: irVencISO(o.m), prev: 1 });
    }),
    a
      .filter((o) => !e[o.m] && o.venc >= addD(t, -90))
      .sort((o, s) => o.venc.localeCompare(s.venc))
  );
}
function irPreviaHtml() {
  const e = irPrevia().slice(-4).reverse(),
    t = irPendentes(),
    a = ymd(new Date()),
    o = (r) =>
      new Date(r + "-15T12:00").toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    s = t.length
      ? `<h2>Estimativas e apuração do período</h2>${t
          .map((r) => {
            const i = Math.round(
              (new Date(r.venc + "T12:00") - new Date(a + "T12:00")) / 864e5,
            );
            return `<div class="card"><div class="top"><b>${o(r.m)}</b><b class="r">${money(r.v)}</b></div><div class="sm">${r.venc < a ? `<b class="r">Vencido em ${fmtD(r.venc)}</b>: pague com multa e juros (Sicalc, na Receita).` : `Vence em <b>${fmtD(r.venc)}</b>${i === 0 ? " (hoje)" : i === 1 ? " (amanhã)" : ` (em ${i} dias)`}`} · código 6015${r.prev ? ' · <span class="am">'+esc(window.irCobertura?.(r.m).estado||'estimativa pelo diário')+'</span>' : ' · apuração conferida pelo usuário'}</div><button class="btn s" data-irpago="${r.m}" ${r.prev ? "disabled" : ""} style="margin-top:6px">Marcar como pago</button></div>`;
          })
          .join(
            "",
          )}<div class="sm mut">Você recebe uma notificação no dia útil anterior e no dia do vencimento.</div>`
      : "",
    n = e.length
      ? `<h2>Prévia pelo diário</h2><div class="sm mut" style="margin-bottom:6px">Meses ainda não conferidos, calculados pelos trades do diário (resultado sem custos, IRRF estimado). Notas parciais não excluem o restante do mês. Confira a cobertura antes de usar a apuração das notas.</div>${e.map((r) => `<div class="card"><div class="top"><b>${o(r.m)}</b><b class="${r.darf > 0 ? "r" : "g"}">DARF ≈ ${money(r.darf)}</b></div>${r.rows.map((i) => `<div class="sm" style="margin-top:4px"><b>${i.nm}</b>: <span class="${cls(i.liq)}">${money(i.liq)}</span>${i.isento ? ` · <b class="g">isento (vendas ≈ ${money(i.vendas)})</b>` : i.liq < 0 ? " · prejuízo a compensar" : ` · imposto ${money(i.tx)}`}</div>`).join("")}<div class="sm mut" style="margin-top:4px">${r.n} trade(s) · IRRF estimado ${money(r.irrf)}${r.darf > 0 ? " · vence em " + fmtD(irVencISO(r.m)) : ""}</div></div>`).join("")}`
      : "";
  return s + n;
}
{
  const e = vImpostoAp;
  vImpostoAp = function () {
    const t = e.apply(this, arguments);
    try {
      return t.replace(
        "<h2>Custos operacionais</h2>",
        irPreviaHtml() + "<h2>Custos operacionais</h2>",
      );
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-irpago]");
  if (a) {
    ((((t = S.ir ?? (S.ir = {})).pago ?? (t.pago = {}))[a.dataset.irpago] =
      Date.now()),
      save());
    try {
      turnoPushSync();
    } catch {}
    render();
  }
});
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      t.darf = irPendentes()
        .filter((a) => a.venc >= ymd(new Date()))
        .slice(0, 3)
        .map((a) => ({ m: a.m, v: Math.round(a.v * 100) / 100, venc: a.venc }));
    } catch {}
    return t;
  };
}
try {
  typeof NP < "u" &&
    NP.on &&
    NP.on.ir === void 0 &&
    ((NP.on.ir = !0), ls.set("diario-np", NP));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("ir", "🧾 DARF: aviso no dia útil anterior e no dia do vencimento")}`
    );
  };
}
GOR.ir = () => {
  ((GO.r = null), (VW.IR = "ap"), irPara("imposto"), scrollTo(0, 0));
};
var BT = { busy: 0, err: "", res: null, dados: null, k: "" };
const BT_SET = {
  cruz: "Cruzamento de médias (MME 9 × MM 21)",
  pull: "Pullback na MM 20 a favor da tendência",
  romp: "Rompimento da máxima/mínima de 20 candles",
  ifr: "IFR 14 saindo de sobrevendido (30) / sobrecomprado (70)",
};
function btCfg() {
  return Object.assign(
    {
      tk: "",
      tf: "1d",
      set: "pull",
      lado: "c",
      stop: "atr",
      k: 1.5,
      alvo: 2,
      max: 20,
      zera: 1,
    },
    (S.ax || {}).bt || {},
  );
}
function btInd(e) {
  const t = e.length,
    a = e.map((c) => c[4]),
    o = (c) => {
      const p = [];
      let u = null;
      for (let m = 0; m < t; m++)
        ((u = u == null ? a[m] : u + ((a[m] - u) * 2) / (c + 1)),
          p.push(m >= c - 1 ? u : null));
      return p;
    },
    s = (c) => {
      const p = [];
      let u = 0;
      for (let m = 0; m < t; m++)
        ((u += a[m]),
          m >= c && (u -= a[m - c]),
          p.push(m >= c - 1 ? u / c : null));
      return p;
    },
    n = [];
  let r = null;
  for (let c = 0; c < t; c++) {
    const p = c
      ? Math.max(
          e[c][2] - e[c][3],
          Math.abs(e[c][2] - a[c - 1]),
          Math.abs(e[c][3] - a[c - 1]),
        )
      : e[c][2] - e[c][3];
    ((r = r == null ? p : (r * 13 + p) / 14), n.push(c >= 13 ? r : null));
  }
  const i = [];
  let l = 0,
    d = 0;
  for (let c = 0; c < t; c++) {
    if (!c) {
      i.push(null);
      continue;
    }
    const p = a[c] - a[c - 1];
    (c <= 14
      ? ((l += Math.max(p, 0) / 14), (d += Math.max(-p, 0) / 14))
      : ((l = (l * 13 + Math.max(p, 0)) / 14),
        (d = (d * 13 + Math.max(-p, 0)) / 14)),
      i.push(c >= 14 ? (d === 0 ? 100 : 100 - 100 / (1 + l / d)) : null));
  }
  return { e9: o(9), m21: s(21), m20: s(20), atr: n, ifr: i };
}
function btSinal(e, t, a, o) {
  const s = t[o],
    n = t[o - 1],
    r = e.set;
  if (!n) return 0;
  let i = 0,
    l = 0;
  if (r === "cruz")
    a.e9[o - 1] != null &&
      a.m21[o - 1] != null &&
      ((i = a.e9[o - 1] <= a.m21[o - 1] && a.e9[o] > a.m21[o]),
      (l = a.e9[o - 1] >= a.m21[o - 1] && a.e9[o] < a.m21[o]));
  else if (r === "pull") {
    const d = a.m20[o],
      c = a.m20[o - 5];
    d != null &&
      c != null &&
      ((i = d > c && s[3] <= d * 1.003 && s[4] > d && s[4] > s[1]),
      (l = d < c && s[2] >= d * 0.997 && s[4] < d && s[4] < s[1]));
  } else if (r === "romp") {
    if (o >= 21) {
      let d = -1 / 0,
        c = 1 / 0;
      for (let p = o - 20; p < o; p++)
        ((d = Math.max(d, t[p][2])), (c = Math.min(c, t[p][3])));
      ((i = s[4] > d), (l = s[4] < c));
    }
  } else if (r === "ifr") {
    const d = a.ifr[o - 1],
      c = a.ifr[o];
    d != null &&
      c != null &&
      ((i = d < 30 && c >= 30), (l = d > 70 && c <= 70));
  }
  return i ? 1 : e.lado === "cv" && l ? -1 : 0;
}
function btRoda(e, t) {
  const a = btInd(t),
    o = [],
    s = (x) => rpyDia(x),
    n = e.tf !== "1d";
  let r = 1;
  for (; r < t.length - 1; ) {
    const x = btSinal(e, t, a, r);
    if (!x || a.atr[r] == null) {
      r++;
      continue;
    }
    const v = t[r][4];
    let g;
    if (e.stop === "fundo") {
      let A = x > 0 ? 1 / 0 : -1 / 0;
      for (let C = Math.max(0, r - 4); C <= r; C++)
        A = x > 0 ? Math.min(A, t[C][3]) : Math.max(A, t[C][2]);
      g = A;
    } else g = v - x * e.k * a.atr[r];
    const h = Math.abs(v - g);
    if (!(h > 0)) {
      r++;
      continue;
    }
    const b = v + x * e.alvo * h;
    let y = null,
      j = r + 1,
      k = "";
    for (; j < t.length; j++) {
      const A = t[j];
      if (n && e.zera && s(A[0]) !== s(t[r][0])) {
        (j--, (y = t[j][4]), (k = "fim do dia"));
        break;
      }
      if (x > 0 ? A[3] <= g : A[2] >= g) {
        ((y = g), (k = "stop"));
        break;
      }
      if (x > 0 ? A[2] >= b : A[3] <= b) {
        ((y = b), (k = "alvo"));
        break;
      }
      if (j - r >= e.max) {
        ((y = A[4]), (k = "tempo"));
        break;
      }
    }
    (y == null && ((j = t.length - 1), (y = t[j][4]), (k = "aberto")),
      o.push({
        t: t[r][0],
        lado: x,
        e: v,
        st: g,
        sai: y,
        r: (x * (y - v)) / h,
        mot: k,
        n: j - r,
      }),
      (r = Math.max(j, r + 1)));
  }
  const i = o.map((x) => x.r),
    l = i.length;
  let d = 0,
    c = 0,
    p = 0,
    u = 0,
    m = 0;
  const f = [0];
  return (
    i.forEach((x) => {
      ((d += x),
        f.push(d),
        (c = Math.max(c, d)),
        (p = Math.min(p, d - c)),
        x < 0 ? (u++, (m = Math.max(m, u))) : (u = 0));
    }),
    {
      T: o,
      n: l,
      ac: l ? i.filter((x) => x > 0).length / l : null,
      exp: l ? d / l : null,
      sqn: sqnDe(i),
      tot: d,
      dd: p,
      mx: m,
      curva: f,
      de: t[0][0],
      ate: t[t.length - 1][0],
    }
  );
}
async function btExec() {
  const e = btCfg(),
    t = cfg();
  if (!e.tk) {
    toast("Escolha o ativo.");
    return;
  }
  if (!t) {
    ((BT.err = "Configure o Supabase na aba Conta."), render());
    return;
  }
  ((BT.busy = 1), (BT.err = ""), render());
  try {
    const a = e.tk + "|" + e.tf;
    if (BT.k !== a || !BT.dados) {
      const s = await fetch(t.url + "/functions/v1/candles", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: t.key },
          body: JSON.stringify({ ativo: e.tk, intervalo: e.tf }),
        }),
        n = await s.json();
      if (!s.ok) throw new Error(n.error || "Erro " + s.status);
      ((BT.dados = n), (BT.k = a));
    }
    const o = (BT.dados.candles || []).filter((s) => s[2] > s[3] || s[4]);
    if (o.length < 60)
      throw new Error("Poucos candles para testar (" + o.length + ").");
    BT.res = btRoda(e, o);
  } catch (a) {
    ((BT.err = String(a.message || a)), (BT.res = null));
  }
  ((BT.busy = 0), render());
}
function btCurva(e) {
  const t = Math.max(...e, 0),
    a = Math.min(...e, 0),
    o = t - a || 1,
    s = (r) => 4 + ((t - r) / o) * 82,
    n = (r) => (r / (e.length - 1 || 1)) * 320;
  return `<svg viewBox="0 0 320 90" style="width:100%;height:auto"><line x1="0" x2="320" y1="${s(0)}" y2="${s(0)}" stroke="var(--bd2,#ccc)" stroke-dasharray="3 3"/><path d="${e.map((r, i) => (i ? "L" : "M") + n(i).toFixed(1) + " " + s(r).toFixed(1)).join("")}" fill="none" stroke="${e[e.length - 1] >= 0 ? "var(--g,#2e8b5d)" : "var(--r,#dc3e26)"}" stroke-width="1.6"/></svg>`;
}
function btHtml() {
  const e = btCfg(),
    t = BT.res,
    a = rpyAtivos(),
    o = (r, i, l) => `<select data-bt="${r}">${opt(i, String(l))}</select>`,
    s = (r) => new Date(r * 1e3).toLocaleDateString("pt-BR");
  let n = "";
  if (t) {
    const r = (i) =>
      i == null
        ? "–"
        : (i >= 0 ? "+" : "") + i.toFixed(2).replace(".", ",") + "×";
    n = `<div class="card"><div class="top"><b>Resultado</b><span class="sm mut">${s(t.de)} a ${s(t.ate)}</span></div>${
      t.n
        ? `
<div class="g3" style="gap:8px;margin:8px 0;text-align:center"><div><div class="sm mut">Trades</div><b>${t.n}</b></div><div><div class="sm mut">Acerto</div><b>${Math.round(t.ac * 100)}%</b></div><div><div class="sm mut">Expectativa</div><b class="${cls(t.exp)}">${r(t.exp)}</b></div><div><div class="sm mut">Total</div><b class="${cls(t.tot)}">${r(t.tot)}</b></div><div><div class="sm mut">Maior queda</div><b class="r">${r(t.dd)}</b></div><div><div class="sm mut">SQN</div><b>${t.sqn != null ? f2(t.sqn) : "–"}</b></div></div>
${btCurva(t.curva)}<div class="sm" style="margin:6px 0">${t.n < 30 ? "⚠ Menos de 30 trades: amostra pequena, o resultado pode ser sorte. Use um período maior (diário, 2 anos). " : ""}${t.exp > 0 ? `Com risco de 1% por trade, isso seria cerca de ${t.tot.toFixed(1).replace(".", ",")}% no período, com queda máxima de ${Math.abs(t.dd).toFixed(1).replace(".", ",")}%. ` : "Expectativa negativa nesse período: o setup, do jeito que está, perde dinheiro. "}Maior sequência de perdas: ${t.mx}.</div>
<div style="overflow-x:auto"><table style="width:100%;font-size:12px"><tr><th>Entrada</th><th>Lado</th><th>Saída</th><th>× risco</th></tr>${t.T.slice(
            -10,
          )
            .reverse()
            .map(
              (i) =>
                `<tr><td>${new Date(i.t * 1e3).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: e.tf === "1d" ? void 0 : "2-digit", minute: e.tf === "1d" ? void 0 : "2-digit" })}</td><td>${i.lado > 0 ? "Compra" : "Venda"}</td><td>${i.mot}</td><td class="${cls(i.r)}">${i.r.toFixed(2).replace(".", ",")}</td></tr>`,
            )
            .join("")}</table></div>`
        : '<div class="sm mut" style="margin-top:6px">Nenhum sinal nesse período. Troque o setup ou o tempo gráfico.</div>'
    }
<div class="sm" style="color:var(--mut);margin-top:6px">Entrada no fechamento do candle do sinal; se o stop e o alvo cabem no mesmo candle, conta o stop (conservador). Sem custos e sem derrapagem. Passado não garante futuro.</div></div>`;
  }
  return `<div class="card"><b>🧪 Backtest de setup</b><div class="sm" style="color:var(--mut);margin:4px 0 8px">Teste uma regra nos candles antes de arriscar dinheiro. O app mostra quantas vezes o setup apareceu, o acerto, quanto paga (em vezes o risco) e a maior queda.</div>
<div class="g2"><label>Ativo<input data-bt="tk" list="rpyl" value="${esc(e.tk || a[0] || "PETR4")}" autocapitalize="characters"><datalist id="rpyl">${a.map((r) => `<option value="${esc(r)}">`).join("")}</datalist></label><label>Tempo gráfico${o(
    "tf",
    [
      ["1d", "Diário (2 anos)"],
      ["60m", "60 min (3 meses)"],
      ["15m", "15 min (1 mês)"],
      ["5m", "5 min (5 dias)"],
    ],
    e.tf,
  )}</label></div>
<label>Setup${o("set", Object.entries(BT_SET), e.set)}</label>
<div class="g2"><label>Lado${o(
    "lado",
    [
      ["c", "Só compra"],
      ["cv", "Compra e venda"],
    ],
    e.lado,
  )}</label><label>Stop${o(
    "stop",
    [
      ["atr", "Volatilidade (ATR)"],
      ["fundo", "Fundo/topo dos últimos 5 candles"],
    ],
    e.stop,
  )}</label></div>
<div class="g3">${e.stop === "atr" ? `<label>× ATR<input data-bt="k" type="number" step="0.1" inputmode="decimal" value="${e.k}"></label>` : ""}<label>Alvo (× risco)<input data-bt="alvo" type="number" step="0.5" inputmode="decimal" value="${e.alvo}"></label><label>Máx. candles<input data-bt="max" type="number" inputmode="numeric" value="${e.max}"></label></div>
${e.tf !== "1d" ? `<label class="sm" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" data-bt="zera" ${e.zera ? "checked" : ""} style="width:auto"> Zerar no fim do dia (day trade)</label>` : ""}
<button class="btn" data-btgo="1" style="width:100%;margin-top:8px"${BT.busy ? " disabled" : ""}>${BT.busy ? "Testando…" : "Rodar o backtest"}</button>${BT.err ? `<div class="sm r" style="margin-top:6px">${esc(BT.err)}</div>` : ""}</div>${n}`;
}
(document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-bt]");
  if (!t) return;
  const a = btCfg(),
    o = t.dataset.bt;
  if (
    ((a[o] =
      t.type === "checkbox"
        ? t.checked
          ? 1
          : 0
        : t.type === "number"
          ? +t.value
          : o === "tk"
            ? t.value.toUpperCase().trim()
            : t.value),
    ((S.ax ?? (S.ax = {})).bt = a),
    save(),
    BT.dados && BT.res && o !== "tk" && o !== "tf")
  ) {
    const n = (BT.dados.candles || []).filter((r) => r[2] > r[3] || r[4]);
    BT.res = btRoda(a, n);
  } else (o === "tk" || o === "tf") && (BT.res = null);
  const s = scrollY;
  (render(), scrollTo(0, s));
}),
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-btgo]")) {
      const t = document.querySelector('[data-bt="tk"]');
      if (t) {
        const a = btCfg();
        ((a.tk = t.value.toUpperCase().trim()), ((S.ax ?? (S.ax = {})).bt = a));
      }
      btExec();
    }
  }));
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "bt"
      ? `<h1>Estudos</h1><div class="seg" style="margin:8px 0 10px"><button data-ep="esv" data-id="liv">📚 Livros</button><button data-ep="esv" data-id="pr">🧩 Prompts</button><button data-ep="esv" data-id="cnpi">🎓 CNPI-T</button><button data-ep="esv" data-id="rpy">▶️ Replay</button><button class="on" data-ep="esv" data-id="bt">🧪 Backtest</button></div>${btHtml()}`
      : e
          .apply(this, arguments)
          .replace(
            /(data-id="rpy">\u25b6\ufe0f Replay<\/button>)/,
            '$1<button data-ep="esv" data-id="bt">🧪 Backtest</button>',
          );
  };
}
GOR.backtest = () => {
  ((GO.r = null), (ESV = "bt"), irPara("estudos"));
};
function frStatus(e) {
  const t = loc().slice(0, 10),
    a = e || Date.parse(loc().slice(0, 16) + ":00Z"),
    o = +(S.ax || {}).freioMin || 15,
    s = S.trades
      .map((d) => ({ t: d, c: calc(d) }))
      .filter(
        (d) =>
          d.c.pl != null &&
          String(d.t.dtx || "").slice(0, 10) === t &&
          String(d.t.dtx).length >= 16,
      )
      .sort((d, c) => String(d.t.dtx).localeCompare(String(c.t.dtx)));
  let n = 0;
  for (let d = s.length - 1; d >= 0 && s[d].c.pl < 0; d--) n++;
  if (n < 2) return null;
  const r = Date.parse(String(s[s.length - 1].t.dtx).slice(0, 16) + ":00Z"),
    i = Math.ceil((r + o * 6e4 - a) / 6e4),
    l = s.slice(-n).reduce((d, c) => d + emBRL(c.c.pl, moedaT(c.t)), 0);
  return { seq: n, falta: i, min: o, perda: l };
}
function frHoraRuim(e) {
  const t = horaDe(e);
  if (!t) return null;
  const a = S.trades
    .map((s) => ({ t: s, c: calc(s) }))
    .filter(
      (s) =>
        s.c.pl != null &&
        s.c.r != null &&
        isFinite(s.c.r) &&
        horaDe(s.t.dt) === t,
    )
    .map((s) => +s.c.r);
  if (a.length < 8) return null;
  const o = a.reduce((s, n) => s + n, 0) / a.length;
  return o >= -0.05
    ? null
    : { h: t, n: a.length, m: o, ac: a.filter((s) => s > 0).length / a.length };
}
function frHtml() {
  if (!T || QM || !isNew) return "";
  const e = [],
    t = frStatus();
  t && t.falta > 0
    ? e.push(
        `<div class="warn frv" style="margin:8px 0;border-color:var(--r)"><b>🧊 Pausa de ${t.min} minutos: faltam ${t.falta} min</b><div class="sm" style="margin-top:4px">${t.seq} perdas seguidas hoje (${money(t.perda)}). Entrar agora é o que mais derruba resultado (operação de revanche). Levante, respire e confira: esta entrada está no seu plano escrito?</div></div>`,
      )
    : t &&
      t.seq >= 3 &&
      e.push(
        `<div class="warn frv" style="margin:8px 0"><b>${t.seq} perdas seguidas hoje.</b> <span class="sm">A pausa acabou, mas pense em encerrar o dia: o próximo trade costuma vir com a cabeça quente.</span></div>`,
      );
  const a = frHoraRuim(T.dt || loc().slice(0, 16));
  return (
    a &&
      e.push(
        `<div class="warn" style="margin:8px 0"><b>⏰ Horário fraco para você:</b> <span class="sm">entradas às ${a.h} somam ${a.n} trades com média de ${f2(a.m)}× e ${Math.round(a.ac * 100)}% de acerto. Só entre se o setup estiver perfeito.</span></div>`,
      ),
    e.join("")
  );
}
{
  const e = sheet;
  sheet = function () {
    const t = e.apply(this, arguments);
    try {
      const a = frHtml();
      if (a)
        return t.replace(
          '<button class="x" data-a="close">✕</button></div>',
          '<button class="x" data-a="close">✕</button></div>' + a,
        );
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
function tblAjusta(e) {
  try {
    const t = innerWidth;
    (e || document).querySelectorAll("table").forEach((a) => {
      if (a.closest(".tblw")) return;
      const o = a.getBoundingClientRect();
      if (!o.width || o.right <= t + 1) return;
      for (
        let n = a.parentElement;
        n && n !== document.body;
        n = n.parentElement
      )
        if (/(auto|scroll)/.test(getComputedStyle(n).overflowX)) return;
      const s = document.createElement("div");
      ((s.className = "tblw"),
        (s.style.cssText =
          "overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%"),
        a.parentNode.insertBefore(s, a),
        s.appendChild(a));
    });
  } catch {}
}
{
  const e = render0;
  render0 = function () {
    (e.apply(this, arguments),
      tblAjusta(document.getElementById("app")),
      setTimeout(() => tblAjusta(document.getElementById("app")), 30));
  };
}
(new MutationObserver((e) => {
  for (const t of e)
    for (const a of t.addedNodes)
      a.nodeType === 1 &&
        (a.id === "fx" ||
          a.id === "pdfov" ||
          (a.closest && a.closest("#sh"))) &&
        setTimeout(() => tblAjusta(a), 30);
}).observe(document.body, { childList: !0, subtree: !0 }),
  (RRD.al = (() => {
    try {
      return +ls.get("diario-rd-al") || 0.05;
    } catch {
      return 0.05;
    }
  })()));
const RRD_DIR = {
  cs: ["Call a seco", 1],
  ps: ["Put a seco", -1],
  ta: ["Trava de alta", 1],
  tb: ["Trava de baixa", -1],
};
function rrdAcima(e, t, a, o, s) {
  return !(t > 0) || !(s > 0) || !(a > 0)
    ? e > t
      ? 1
      : 0
    : OPM.ncdf((Math.log(e / t) + (o - (s * s) / 2) * a) / (s * Math.sqrt(a)));
}
function rrdDirLista() {
  const e = OPG.rows || [],
    t = loc().slice(0, 10),
    a = opR(),
    o = RRD.tp,
    s = RRD_DIR[o][1],
    n = [],
    r = (c) => (c.a > 0 ? c.a : c.p),
    i = (c) => (c.b > 0 ? c.b : c.p);
  (e.forEach((c) => {
    const p = +c.spot;
    if (!(p > 0)) return;
    const u = p * (1 + s * RRD.al),
      m = opgRank(c.ativo);
    [...new Set((c.series || []).map((f) => f.m))].sort().forEach((f) => {
      const x = opgAtmIV(c, f) || 0.3,
        v = opgSeries(c, f).filter((y) => y.lq && y.k > 0 && y.p >= 0.03);
      if (!v.length) return;
      const g = v[0].v || opgVenc(c, f),
        h = opDias(t, g);
      if (h < 7 || h > 90) return;
      const b = h / 365;
      if (o === "cs" || o === "ps") {
        const y = o === "cs" ? "C" : "P";
        v.filter((j) => j.t === y).forEach((j) => {
          const k = r(j);
          if (!(k >= 0.05)) return;
          const A = j.iv || x,
            C = OPM.gregas(p, j.k, b, a, A, y),
            I = Math.abs(C.d);
          if (I < 0.15 || I > 0.75) return;
          const J = y === "C" ? j.k + k : j.k - k,
            se = Math.max(0, y === "C" ? u - j.k : j.k - u),
            Ie = (se - k) / k;
          if (!(Ie > 0)) return;
          const Pe =
            y === "C" ? rrdAcima(p, J, b, a, A) : 1 - rrdAcima(p, J, b, a, A);
          n.push({
            k: "s",
            row: c,
            venc: g,
            dias: h,
            A: u,
            rk: m,
            ot: y,
            x: j,
            custo: k,
            be: J,
            vA: se,
            ret: Ie,
            pl: Pe,
            delta: C.d,
            th: C.th,
            sc: Ie * Pe,
            legs: [{ x: j, lado: "C", pr: k }],
          });
        });
      } else {
        const y = o === "ta" ? "C" : "P",
          j = v.filter((k) => k.t === y).sort((k, A) => k.k - A.k);
        for (const k of j)
          for (const A of j) {
            if (!(A.k > k.k)) continue;
            const C = k.iv || x;
            let I, J;
            if (o === "ta") {
              if (k.k < p * 0.93 || k.k > p * 1.03 || A.k > u * 1.01) continue;
              ((I = k), (J = A));
            } else {
              if (A.k > p * 1.07 || A.k < p * 0.97 || k.k < u * 0.99) continue;
              ((I = A), (J = k));
            }
            const se = r(I) - i(J),
              Ie = A.k - k.k;
            if (!(se > 0.02) || se > Ie * 0.85) continue;
            const Pe = Ie - se,
              Me = o === "ta" ? k.k + se : A.k - se,
              ue =
                o === "ta"
                  ? rrdAcima(p, Me, b, a, C)
                  : 1 - rrdAcima(p, Me, b, a, C),
              ve =
                o === "ta"
                  ? rrdAcima(p, A.k, b, a, C)
                  : 1 - rrdAcima(p, k.k, b, a, C),
              he = Math.min(Ie, Math.max(0, o === "ta" ? u - k.k : A.k - u)),
              we = (he - se) / se;
            n.push({
              k: "t",
              row: c,
              venc: g,
              dias: h,
              A: u,
              rk: m,
              ot: y,
              compra: I,
              vende: J,
              custo: se,
              w: Ie,
              mx: Pe,
              be: Me,
              vA: he,
              ret: we,
              retMax: Pe / se,
              pl: ue,
              pm: ve,
              sc: (Pe / se) * ue,
              legs: [
                { x: I, lado: "C", pr: r(I) },
                { x: J, lado: "V", pr: i(J) },
              ],
            });
          }
      }
    });
  }),
    n.sort((c, p) => p.sc - c.sc));
  const l = {},
    d = [];
  for (const c of n) {
    const p = c.row.ativo;
    if (((l[p] = (l[p] || 0) + 1), l[p] <= 2 && d.push(c), d.length >= 8))
      break;
  }
  return d;
}
function rrdChips() {
  const e = (t, a, o, s) =>
    `<button class="${s ? "on" : ""}" data-rrd="${t}" data-v="${a}">${o}</button>`;
  return `<div class="sm" style="color:var(--mut);margin:8px 2px 2px">Renda (vender opção)</div><div class="hub2" style="margin:0 0 4px">${e("tp", "cc", "Venda coberta de call", RRD.tp === "cc")}${e("tp", "vp", "Venda de put", RRD.tp === "vp")}</div>
<div class="sm" style="color:var(--mut);margin:6px 2px 2px">Direção (comprar opção)</div><div class="hub2" style="margin:0 0 4px">${Object.entries(
    RRD_DIR,
  )
    .map(([t, [a, o]]) => e("tp", t, (o > 0 ? "📈 " : "📉 ") + a, RRD.tp === t))
    .join("")}</div>`;
}
function rrdDirHtml() {
  const e = rrdDirLista(),
    t = RRD.tp,
    a = RRD_DIR[t][1],
    o = (d) => (d * 100).toFixed(1).replace(".", ",") + "%",
    s = (d) => Math.round(d * 100) + "%",
    n = (d, c, p, u) =>
      `<button class="${u ? "on" : ""}" data-rrd="${d}" data-v="${c}">${p}</button>`,
    r = t === "ta" || t === "tb",
    i = {
      cs: "Compra de call a seco: você paga o prêmio e ganha se o ativo subir além do ponto de equilíbrio até o vencimento. A perda máxima é o prêmio, mas o tempo corre contra: parada, a opção perde valor todo dia.",
      ps: "Compra de put a seco: aposta na queda (ou proteção da carteira). Perda máxima é o prêmio; o tempo corre contra.",
      ta: "Trava de alta: compra uma call e vende outra de strike maior no mesmo vencimento. Custa menos que a call a seco e sofre menos com o tempo e com a volatilidade, em troca de um ganho máximo limitado.",
      tb: "Trava de baixa: compra uma put e vende outra de strike menor no mesmo vencimento. Mais barata que a put a seco, com ganho máximo limitado.",
    }[t],
    l = e.length
      ? e
          .map((d, c) => {
            const p = d.rk.rank != null && d.rk.rank > 0.6,
              u = opN(d.A),
              m =
                d.k === "s"
                  ? `${d.ot === "C" ? "Call" : "Put"} ${opN(d.x.k)}`
                  : `${t === "ta" ? "Trava de alta" : "Trava de baixa"} ${opN(d.compra.k)} / ${opN(d.vende.k)}`,
              f =
                d.k === "s"
                  ? esc(d.x.c)
                  : `${esc(d.compra.c)} + ${esc(d.vende.c)}`;
            return `<div class="card rrdc"><div class="top"><b>${c + 1}. ${esc(d.row.ativo)} · ${m}</b><span class="sm mut">${f} · vence ${esc(fmtD(d.venc).slice(0, 5))} (${d.dias} d)</span></div>
<div class="rrdg"><div><small>Custo</small><b class="mono">R$ ${opN(d.custo)}</b><i>${money(d.custo * 100)} por lote (perda máx.)</i></div><div><small>Se for a ${u}</small><b class="mono ${d.ret > 0 ? "g" : "r"}">${d.ret > 0 ? "+" : ""}${s(d.ret)}</b><i>${r ? "ganho máx. " + money(d.mx * 100) + " (" + s(d.retMax) + ")" : money((d.vA - d.custo) * 100) + " por lote"}</i></div>
<div><small>Chance de lucro</small><b class="mono ${d.pl >= 0.45 ? "g" : d.pl >= 0.3 ? "am" : "r"}">${s(d.pl)}</b><i>${r ? "ganho máx. em " + s(d.pm) : "delta " + d.delta.toFixed(2).replace(".", ",")}</i></div><div><small>Equilíbrio</small><b class="mono">${opN(d.be)}</b><i>${d.be / +d.row.spot - 1 > 0 ? "+" : ""}${o(d.be / +d.row.spot - 1)} do preço (${opN(+d.row.spot)})</i></div></div>
${d.k === "s" ? `<div class="sm" style="color:var(--mut)">Parada, perde cerca de ${money(Math.abs(d.th) * 100)} por dia por lote (theta). ${p ? '<b class="am">Volatilidade cara (IV Rank ' + s(d.rk.rank) + "): comprar a seco sai caro, a trava costuma ser melhor agora.</b>" : d.rk.rank != null && d.rk.rank < 0.3 ? "Volatilidade barata: bom momento para comprar opção." : ""}</div>` : `<div class="sm" style="color:var(--mut)">Compra ${esc(d.compra.c)} e vende ${esc(d.vende.c)}, mesma quantidade. ${p ? "Volatilidade cara: a ponta vendida ajuda a pagar a comprada." : ""}</div>`}
<button class="btn s" data-rrdd="${c}" style="width:100%;margin-top:8px">Montar esta operação</button></div>`;
          })
          .join("")
      : `<div class="card sm" style="color:var(--mut)">Nenhuma combinação passou no filtro. ${OPG.rows && OPG.rows.length ? "Fora do pregão quase não há ofertas; tente com o mercado aberto ou outro alvo." : "Com a ponte do Profit rodando, a grade chega e as ideias se montam sozinhas."}</div>`;
  return (
    rrdChips() +
    `<div class="sm" style="color:var(--mut);margin:6px 2px 2px">Seu alvo para o ativo até o vencimento</div><div class="hub2" style="margin:0 0 8px">${[0.03, 0.05, 0.1].map((d) => n("al", d, (a > 0 ? "+" : "−") + Math.round(d * 100) + "%", RRD.al === d)).join("")}</div>
<div class="card sm" style="margin:0 0 6px;color:var(--mut)">${i}</div>${l}
<div class="sm" style="margin:8px 2px;color:var(--mut)">Compra pelo preço de venda da oferta e venda pelo de compra (quando há oferta). Chance de lucro pelo modelo de Black-Scholes com a volatilidade do Profit, no vencimento. Ordenado pelo retorno ajustado à chance de lucro, até 2 ideias por ativo. Só faça com uma direção definida pela sua análise. Estudo, não recomendação.</div>`
  );
}
{
  const e = rrdHtml;
  rrdHtml = function () {
    return RRD_DIR[RRD.tp]
      ? rrdDirHtml()
      : e
          .apply(this, arguments)
          .replace(
            /<div class="hub2" style="margin:8px 0 4px">[\s\S]*?<\/div>/,
            rrdChips(),
          );
  };
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest('[data-rrd="al"]');
    if (t) {
      (e.stopImmediatePropagation(), (RRD.al = +t.dataset.v));
      try {
        ls.set("diario-rd-al", RRD.al);
      } catch {}
      opgPinta();
      return;
    }
    const a = e.target.closest("[data-rrdd]");
    if (!a) return;
    const o = rrdDirLista()[+a.dataset.rrdd];
    if (!o) return;
    const s = (l) => +(+l).toFixed(2),
      n = o.k === "t",
      r = o.legs.map((l, d) => ({
        id: "l" + Date.now().toString(36) + d,
        tp: l.x.t,
        lado: l.lado,
        k: l.x.k,
        venc: o.venc,
        pr: s(l.pr),
        q: 100,
      })),
      i = o.legs[0].x;
    ((AUTO = 0),
      (isNew = 1),
      (QM = 0),
      (T = {
        id: Date.now().toString(36),
        tipo: "O",
        dt: loc().slice(0, 16),
        ativo: i.c,
        sub: o.row.ativo,
        side: "C",
        ot: i.t,
        strike: String(i.k),
        venc: o.venc,
        spot: String(o.row.spot),
        entry: String(s(o.custo)),
        stop: String(s(o.custo * 0.5)),
        target: String(s(n ? o.w : Math.max(o.vA, o.custo * 2))),
        exit: "",
        qty: "100",
        pv: "1",
        rules: "",
        err: "Nenhum",
        estr: n
          ? RRD.tp === "ta"
            ? "Trava de alta"
            : "Trava de baixa"
          : i.t === "C"
            ? "Compra de call"
            : "Compra de put",
        legs: r,
      }),
      (orig = {}),
      showSheet());
  },
  !0,
);
var SCN = { busy: 0, res: null, err: "", prog: "" };
const scnAcao = (e) => /^[A-Z]{4}(3|4|5|6|11)$/.test(e);
function scnCfg() {
  const e = (S.ax || {}).scan || {},
    t = [
      ...new Set(
        rpyAtivos()
          .filter(scnAcao)
          .concat([
            "PETR4",
            "VALE3",
            "ITUB4",
            "BBAS3",
            "BBDC4",
            "PRIO3",
            "WEGE3",
            "ABEV3",
          ]),
      ),
    ].slice(0, 12);
  return {
    on: e.on ? 1 : 0,
    at: Array.isArray(e.at) && e.at.length ? e.at : t,
  };
}
function scnRegra() {
  const e = btCfg();
  return {
    set: e.set,
    lado: e.lado,
    stop: e.stop,
    k: +e.k || 1.5,
    alvo: +e.alvo || 2,
    max: +e.max || 20,
  };
}
function scnSalva(e) {
  (((S.ax ?? (S.ax = {})).scan = {
    on: e.on ? 1 : 0,
    at: e.at,
    regra: scnRegra(),
  }),
    save());
  try {
    turnoPushSync();
  } catch {}
}
async function scnRoda() {
  const e = cfg(),
    t = scnCfg();
  if (!e) {
    ((SCN.err = "Configure o Supabase na aba Conta."), render());
    return;
  }
  ((SCN.busy = 1), (SCN.err = ""), (SCN.res = []), render());
  const a = { ...btCfg(), tf: "1d" };
  for (const o of t.at) {
    SCN.prog = o;
    const s = document.getElementById("scnprog");
    s && (s.textContent = "Lendo " + o + "…");
    try {
      const n = await fetch(e.url + "/functions/v1/candles", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: e.key },
          body: JSON.stringify({ ativo: o, intervalo: "1d" }),
        }),
        r = await n.json();
      if (!n.ok) throw new Error(r.error || "Erro " + n.status);
      const i = (r.candles || []).filter((m) => m[2] > m[3] || m[4]);
      if (i.length < 60) throw new Error("poucos candles");
      const l = btRoda(a, i),
        d = btInd(i),
        c = i.length - 1,
        p = btSinal(a, i, d, c);
      let u = null;
      if (p && d.atr[c] != null) {
        const m = i[c][4];
        let f = m - p * a.k * d.atr[c];
        if (a.stop === "fundo") {
          let x = p > 0 ? 1 / 0 : -1 / 0;
          for (let v = Math.max(0, c - 4); v <= c; v++)
            x = p > 0 ? Math.min(x, i[v][3]) : Math.max(x, i[v][2]);
          f = x;
        }
        u = {
          lado: p,
          e: m,
          st: f,
          al: m + p * a.alvo * Math.abs(m - f),
          d: rpyDia(i[c][0]),
        };
      }
      SCN.res.push({
        tk: o,
        n: l.n,
        ac: l.ac,
        exp: l.exp,
        sqn: l.sqn,
        hoje: u,
      });
    } catch (n) {
      SCN.res.push({ tk: o, erro: String(n.message || n) });
    }
  }
  (SCN.res.sort(
    (o, s) =>
      (s.hoje ? 1 : 0) - (o.hoje ? 1 : 0) || (s.exp ?? -9) - (o.exp ?? -9),
  ),
    ((S.ax ?? (S.ax = {})).scanRes = {
      em: Date.now(),
      set: btCfg().set,
      res: SCN.res,
    }),
    save(),
    (SCN.busy = 0),
    render());
}
function scnHtml() {
  const e = scnCfg(),
    t = SCN.res || ((S.ax || {}).scanRes || {}).res || null,
    a = ((S.ax || {}).scanRes || {}).em,
    o = (r) =>
      r == null
        ? "–"
        : (r >= 0 ? "+" : "") + r.toFixed(2).replace(".", ",") + "×",
    s = (r) =>
      (+r).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    n = (t || []).filter((r) => r.hoje);
  return `<div class="card" id="scanner"><b>🔎 Scanner da sua regra</b><div class="sm" style="color:var(--mut);margin:4px 0 8px">Usa a regra configurada acima (${esc(BT_SET[btCfg().set])}, stop e alvo iguais) no gráfico diário de cada ativo da lista: mostra onde ela deu sinal no último candle e como ela foi no passado naquele ativo.</div>
<label>Ativos (separe por vírgula; só ações e ETFs)<input data-scn="at" value="${esc(e.at.join(", "))}" autocapitalize="characters"></label>
<label class="sm" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" data-scn="on" ${e.on ? "checked" : ""} style="width:auto"> Avisar no celular às 18h40 (dias de pregão) quando a regra der sinal</label>
<button class="btn" data-scngo="1" style="width:100%;margin-top:8px"${SCN.busy ? " disabled" : ""}>${SCN.busy ? "Escaneando…" : "Escanear agora"}</button><div class="sm mut" id="scnprog" style="margin-top:4px">${SCN.busy ? "Lendo " + esc(SCN.prog) + "…" : a ? "Última varredura: " + new Date(a).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</div>${SCN.err ? `<div class="sm r">${esc(SCN.err)}</div>` : ""}
${
  t && t.length
    ? `${n.length ? n.map((r) => `<div class="card" style="margin:8px 0 0;padding:10px;border-color:${r.hoje.lado > 0 ? "var(--g)" : "var(--r)"}"><div class="top"><b>${esc(r.tk)} · ${r.hoje.lado > 0 ? "📈 compra" : "📉 venda"} ${s(r.hoje.e)}</b><span class="sm mut">${fmtD(r.hoje.d).slice(0, 5)}</span></div><div class="sm">Stop ${s(r.hoje.st)} · alvo ${s(r.hoje.al)}</div><div class="sm ${r.exp != null && r.exp > 0 ? "g" : "r"}">No passado: ${r.n} sinais, ${r.ac != null ? Math.round(r.ac * 100) + "% de acerto" : "–"}, ${o(r.exp)} por trade${r.n < 10 ? " (poucos sinais)" : ""}</div></div>`).join("") : '<div class="sm" style="margin-top:8px">Nenhum ativo deu sinal no último candle.</div>'}
<div style="overflow-x:auto;margin-top:8px"><table style="width:100%;font-size:12px"><tr><th>Ativo</th><th>Hoje</th><th>Sinais</th><th>Acerto</th><th>Média</th></tr>${t.map((r) => (r.erro ? `<tr><td>${esc(r.tk)}</td><td colspan="4" class="mut">${esc(r.erro)}</td></tr>` : `<tr><td>${esc(r.tk)}</td><td>${r.hoje ? (r.hoje.lado > 0 ? "compra" : "venda") : "–"}</td><td>${r.n}</td><td>${r.ac != null ? Math.round(r.ac * 100) + "%" : "–"}</td><td class="${cls(r.exp || 0)}">${o(r.exp)}</td></tr>`)).join("")}</table></div>`
    : ""
}</div>`;
}
(document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-scn]");
  if (!t) return;
  const a = scnCfg();
  if (
    (t.dataset.scn === "on"
      ? (a.on = t.checked ? 1 : 0)
      : (a.at = t.value
          .toUpperCase()
          .split(/[\s,;]+/)
          .filter(scnAcao)
          .slice(0, 25)),
    scnSalva(a),
    t.dataset.scn === "at")
  ) {
    const o = scrollY;
    (render(), scrollTo(0, o));
  }
}),
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-scngo]")) {
      const t = document.querySelector('[data-scn="at"]');
      if (t) {
        const a = scnCfg();
        ((a.at = t.value
          .toUpperCase()
          .split(/[\s,;]+/)
          .filter(scnAcao)
          .slice(0, 25)),
          scnSalva(a));
      }
      scnRoda();
    }
  }));
{
  const e = btHtml;
  btHtml = function () {
    return e.apply(this, arguments) + scnHtml();
  };
}
document.addEventListener("change", (e) => {
  e.target.closest("[data-bt]") &&
    setTimeout(() => {
      const t = (S.ax || {}).scan;
      t && t.on && scnSalva(scnCfg());
    }, 0);
});
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      const a = (S.ax || {}).scan;
      a && a.on && (t.scan = { on: 1, at: a.at, regra: a.regra || scnRegra() });
    } catch {}
    return t;
  };
}
GOR.scanner = () => {
  ((GO.r = null),
    (ESV = "bt"),
    irPara("estudos"),
    setTimeout(() => {
      const e = document.getElementById("scanner");
      e && e.scrollIntoView({ behavior: "smooth" });
    }, 200));
};
const STR_CH = [-0.1, -0.05, -0.03, 0.03, 0.05, 0.1];
function strPos() {
  const e = loc().slice(0, 10),
    t = opR(),
    a = [];
  return (
    S.trades
      .filter((o) => (o.tipo || "D") === "O" && isOpen(o))
      .forEach((o) => {
        const s = opPernas(o);
        if (!s.length) return;
        const n = opSpot(o);
        if (!n) return;
        const r = opIVs(o, s);
        s.forEach((i, l) => {
          i.q > 0 &&
            ((i.tp !== "A" && !(i.k > 0 && i.venc)) ||
              a.push({
                t: o,
                sub: opSub(o) || String(o.ativo || "").slice(0, 5),
                S: n.v,
                f: n.f,
                tp: i.tp,
                sg: i.lado === "V" ? -1 : 1,
                k: i.k,
                q: i.q,
                iv: r[l] || 0.35,
                T: i.tp === "A" ? 0 : Math.max(0.5, opDias(e, i.venc)) / 365,
              }));
        });
      }),
    a
  );
}
function strValor(e, t, a) {
  const o = opR();
  return e.reduce((s, n) => {
    const r = n.S * (1 + t);
    return (
      s +
      n.sg *
        n.q *
        (n.tp === "A"
          ? r
          : OPM.bs(r, n.k, n.T, o, Math.max(0.03, n.iv + a), n.tp))
    );
  }, 0);
}
function strCalc() {
  const e = strPos();
  if (!e.length) return null;
  const t = opR(),
    a = strValor(e, 0, 0),
    o = [...new Set(e.map((u) => u.sub))],
    s = STR_CH.map((u) => ({
      ch: u,
      n: strValor(e, u, 0) - a,
      v: strValor(e, u, 0.1) - a,
    })),
    n = strValor(e, 0, 0.1) - a,
    r = strValor(e, 0, -0.05) - a;
  let i = 0,
    l = 0,
    d = 0;
  e.forEach((u) => {
    if (u.tp === "A") {
      i += u.sg * u.q * u.S * 0.01;
      return;
    }
    const m = OPM.gregas(u.S, u.k, u.T, t, u.iv, u.tp);
    ((i += u.sg * u.q * m.d * u.S * 0.01),
      (l += u.sg * u.q * m.th),
      (d += u.sg * u.q * m.ve));
  });
  const c = o.map((u) => {
      const m = e.filter((x) => x.sub === u),
        f = strValor(m, 0, 0);
      return {
        s: u,
        n: new Set(m.map((x) => x.t.id)).size,
        lo: Math.min(...STR_CH.map((x) => strValor(m, x, 0) - f)),
        hi: Math.max(...STR_CH.map((x) => strValor(m, x, 0) - f)),
        f: m[0].f,
      };
    }),
    p = Math.min(...s.map((u) => Math.min(u.n, u.v)), n, r);
  return {
    P: e,
    grid: s,
    volUp: n,
    volDn: r,
    d: i,
    th: l,
    ve: d,
    porSub: c,
    pior: p,
    nOps: new Set(e.map((u) => u.t.id)).size,
  };
}
function strHtml() {
  const e = strCalc();
  if (!e) return "";
  const t = +capRef("O") || 0,
    a = (s) => (s > 0 ? "+" : "") + Math.round(s * 100) + "%",
    o = (s) => `<span class="${cls(s)}">${money(s)}</span>`;
  return `<div class="card" id="opstress"><div class="top"><b>🧯 Estresse das opções abertas</b><span class="sm mut">${e.nOps} operação(ões)</span></div>
<div class="sm" style="color:var(--mut);margin:4px 0 8px">Quanto a soma das suas posições ganha ou perde agora se os ativos andarem de uma vez, com a volatilidade normal ou disparando 10 pontos (como num susto do mercado).</div>
<div style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th>Ativos</th><th style="text-align:right">Vol. normal</th><th style="text-align:right">Vol. +10 pp</th></tr>${e.grid.map((s) => `<tr><td>${a(s.ch)}</td><td style="text-align:right;white-space:nowrap">${o(s.n)}</td><td style="text-align:right;white-space:nowrap">${o(s.v)}</td></tr>`).join("")}<tr><td>Parado</td><td style="text-align:right">–</td><td style="text-align:right;white-space:nowrap">${o(e.volUp)}</td></tr></table></div>
<div class="rrdg" style="margin-top:8px"><div><small>Delta</small><b class="mono ${cls(e.d)}">${money(e.d)}</b><i>por 1% de alta dos ativos</i></div><div><small>Theta</small><b class="mono ${cls(e.th)}">${money(e.th)}</b><i>por dia, com tudo parado</i></div><div><small>Vega</small><b class="mono ${cls(e.ve)}">${money(e.ve)}</b><i>por +1 ponto de volatilidade</i></div><div><small>Pior cenário</small><b class="mono r">${money(e.pior)}</b><i>${
    t > 0
      ? Math.abs((e.pior / t) * 100)
          .toFixed(1)
          .replace(".", ",") + "% do capital de opções"
      : "entre os testados"
  }</i></div></div>
${e.porSub.length > 1 ? `<div class="sm" style="margin-top:6px">${e.porSub.map((s) => `<span style="white-space:nowrap"><b>${esc(s.s)}</b>: ${o(s.lo)} a ${o(s.hi)}</span>`).join(" · ")}</div>` : ""}
${t > 0 && e.pior < -t * 0.1 ? '<div class="warn sm" style="margin-top:8px">O pior cenário tira mais de 10% do capital de opções. Pense em travar parte do risco (comprar proteção ou fechar a ponta mais exposta).</div>' : ""}
<div class="sm" style="color:var(--mut);margin-top:6px">Black-Scholes com o preço atual (${e.porSub.map((s) => esc(s.s) + ": " + (s.f === "agora" ? "ao vivo" : s.f === "ponte" ? "ponte" : "preço da entrada")).join(", ")}) e a volatilidade da entrada de cada perna. Movimento instantâneo, sem passar dias.</div></div>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "opc" || XV.O === "an") return;
      setTimeout(() => {
        try {
          const t = document.getElementById("app");
          if (!t || t.querySelector("#opstress")) return;
          const a = strHtml();
          if (!a) return;
          const o = t.querySelector("#oprenda");
          if (!o) return;
          const s = document.createElement("div");
          ((s.innerHTML = a), o.after(s.firstElementChild));
        } catch {}
      }, 5);
    } catch {}
  };
}
const PL_ECO = {
    curso: "Ciências Econômicas",
    nome: "Economia · 1º semestre",
    materias: [
      [
        "Introdução à Economia",
        [
          ["O problema econômico: escassez e escolha", 1],
          [
            "Fronteira de possibilidades de produção e custo de oportunidade",
            2,
          ],
          ["Sistema de preços: demanda e oferta", 2],
          ["Equilíbrio de mercado e deslocamentos das curvas", 2],
          ["Elasticidades (preço, renda e cruzada)", 3],
          ["Estruturas de mercado: concorrência, monopólio, oligopólio", 2],
          ["Agregados macroeconômicos: PIB, inflação e desemprego", 2],
          ["Moeda, bancos e política monetária (noções)", 3],
          ["Política fiscal e setor público (noções)", 2],
          ["Setor externo: balanço de pagamentos e câmbio", 3],
          ["Crescimento e desenvolvimento econômico", 2],
        ],
      ],
      [
        "Matemática I (Cálculo)",
        [
          ["Conjuntos, intervalos e números reais", 1],
          ["Funções: domínio, imagem e gráficos", 2],
          ["Funções do 1º e do 2º grau", 1],
          ["Exponencial e logaritmo (juros compostos)", 2],
          ["Limites", 3],
          ["Continuidade", 2],
          ["Derivada: definição e interpretação", 3],
          ["Regras de derivação (produto, quociente, cadeia)", 3],
          ["Máximos e mínimos", 3],
          ["Aplicações: custo, receita e lucro marginais", 2],
          ["Elasticidade calculada pela derivada", 3],
        ],
      ],
      [
        "Contabilidade Introdutória",
        [
          ["Patrimônio: ativo, passivo e patrimônio líquido", 1],
          ["Contas e plano de contas", 1],
          ["Partidas dobradas: débito e crédito", 2],
          ["Lançamentos e razonetes", 2],
          ["Balancete de verificação", 2],
          ["Balanço patrimonial", 2],
          ["Demonstração do resultado (DRE)", 2],
          ["Regime de competência × regime de caixa", 2],
          ["Operações com mercadorias (CMV)", 3],
          ["Depreciação", 2],
        ],
      ],
      [
        "Introdução às Ciências Sociais",
        [
          ["O surgimento da sociologia", 1],
          ["Durkheim: fato social e solidariedade", 2],
          ["Max Weber: ação social e racionalização", 3],
          ["Karl Marx: classes e modo de produção", 3],
          ["Estado, poder e instituições", 2],
          ["Trabalho e sociedade", 2],
          ["Desigualdade e estratificação social", 2],
          ["Formação da sociedade brasileira", 2],
        ],
      ],
      [
        "História Econômica Geral",
        [
          ["Feudalismo e a transição para o capitalismo", 2],
          ["Mercantilismo e as grandes navegações", 2],
          ["Revolução Industrial", 2],
          ["Capitalismo no século XIX e o imperialismo", 2],
          ["Crise de 1929 e a Grande Depressão", 2],
          ["Bretton Woods e os anos dourados do pós-guerra", 3],
          ["Choques do petróleo e a globalização", 2],
        ],
      ],
      [
        "Metodologia Científica",
        [
          ["Ciência, senso comum e método", 1],
          ["Leitura, resumo e fichamento", 1],
          ["Normas da ABNT (citações e referências)", 2],
          ["Tipos de pesquisa", 1],
          ["Projeto de pesquisa: problema, objetivos e hipóteses", 2],
        ],
      ],
    ],
  },
  PL_DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
  plL = () => S.planos ?? (S.planos = []),
  plId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function plAtivo() {
  const e = plL();
  return e.find((t) => t.id === (S.ax || {}).plAtivo) || e[0] || null;
}
function plNovo(e) {
  const t = ymd(new Date()),
    a = addD(t, e === "cnpi" ? 90 : 120);
  let o = {
    id: plId(),
    tipo: e,
    nome: "Meu plano",
    curso: "",
    fim: a,
    horas: 6,
    dias: [1, 2, 3, 4, 5],
    lembrete: "20:00",
    materias: [],
    criado: t,
  };
  return (
    e === "cnpi"
      ? ((o.nome = "CNPI-T"),
        (o.curso = "Certificação CNPI-T (Apimec)"),
        (o.materias = Object.keys(CN_TEMAS).map((s) => ({
          id: "m" + s,
          nome: (s[0] === "t" ? "CT1 · " : "CB · ") + CN_TEMAS[s],
          cn: s,
          prova: "",
          top: [
            { id: s + "a", t: "Estudar a teoria (livro ou apostila)", d: 2 },
            {
              id: s + "b",
              t: "Treino do tema no app (10 questões)",
              d: 2,
              cn: "tema",
            },
            { id: s + "c", t: "Refazer os erros do tema", d: 1, cn: "erros" },
          ],
        }))))
      : e === "eco"
        ? ((o.nome = PL_ECO.nome),
          (o.curso = PL_ECO.curso),
          (o.materias = PL_ECO.materias.map(([s, n]) => ({
            id: plId(),
            nome: s,
            prova: "",
            top: n.map(([r, i]) => ({ id: plId(), t: r, d: i })),
          }))))
        : ((o.nome = "Novo curso"), (o.curso = "")),
    plL().push(o),
    ((S.ax ?? (S.ax = {})).plAtivo = o.id),
    save(),
    o
  );
}
function plDif(e, t, a) {
  if (e.tipo === "cnpi" && t.cn) {
    const o = cnStats((s) => s.t === t.cn);
    return o.pc == null ? 2 : o.pc < 0.5 ? 3 : o.pc < 0.7 ? 2 : 1;
  }
  return a.d || 2;
}
function plAgenda(e, t) {
  const a = ymd(new Date()),
    o = e.fim && e.fim >= a ? e.fim : addD(a, 30),
    s = t && t < o ? t : o,
    n = [];
  for (let u = a; u <= o && n.length < 400; u = addD(u, 1))
    (e.dias || []).includes(new Date(u + "T12:00").getDay()) && n.push(u);
  const r = Math.max(
      1,
      Math.round(
        ((+e.horas || 6) * 60) / 45 / Math.max(1, (e.dias || [1]).length),
      ),
    ),
    i = {},
    l = (u, m) => (i[u] ?? (i[u] = [])).push(m),
    d = [];
  (e.materias.forEach((u, m) =>
    u.top.forEach((f, x) => {
      f.feito ||
        d.push({
          m: u,
          x: f,
          dl: u.prova && u.prova >= a ? u.prova : o,
          dif: plDif(e, u, f),
          o: m * 100 + x,
        });
    }),
  ),
    d.sort((u, m) => u.dl.localeCompare(m.dl) || u.o - m.o));
  let c = 0;
  for (const u of n) {
    let m = 0;
    for (; m < r && c < d.length; ) {
      const f = d[c];
      if (f.dl < u) {
        c++;
        continue;
      }
      (l(u, { tp: "est", m: f.m, x: f.x }), m++, c++);
    }
  }
  const p = d.slice(c).filter((u) => u.dl >= a);
  return (
    e.materias.forEach((u) => {
      if (u.prova && u.prova >= a) {
        const m = addD(u.prova, -1);
        (m >= a &&
          l(m, {
            tp: "prova",
            m: u,
            txt: `Revisão geral de ${u.nome}: prova amanhã`,
          }),
          l(u.prova, { tp: "prova", m: u, txt: `📝 Prova de ${u.nome} hoje` }));
      }
      u.top.forEach((m) => {
        if (!m.feito) return;
        const f = m.rv || 0;
        if (f >= 3) return;
        const x = addD(ymd(new Date(m.feito)), [1, 7, 30][f]);
        l(x < a ? a : x, { tp: "rev", m: u, x: m, k: f });
      });
    }),
    e.tipo === "cnpi" &&
      n.forEach((u, m) => {
        m % 6 === 5 &&
          l(u, { tp: "sim", txt: "Simulado completo (alterne CT1 e CB)" });
      }),
    Object.keys(i).forEach((u) => {
      u > s && delete i[u];
    }),
    { ag: i, dias: n, porDia: r, sobra: p.length, pend: d.length }
  );
}
function plProg(e) {
  let t = 0,
    a = 0;
  return (
    e.materias.forEach((o) =>
      o.top.forEach((s) => {
        (t++, s.feito && a++);
      }),
    ),
    { t, f: a, pc: t ? a / t : 0 }
  );
}
function plProntoCnpi() {
  const e = (cnS().sims || []).slice(0, 3);
  return e.length ? e.reduce((t, a) => t + a.ac / a.tot, 0) / e.length : null;
}
function plTarefa(e, t, a) {
  const o = ymd(new Date()),
    s = esc(t.m ? t.m.nome : "");
  return t.tp === "est"
    ? `<label class="ck" style="margin:6px 0;align-items:flex-start"><input type="checkbox" data-plx="feito" data-m="${t.m.id}" data-t="${t.x.id}"${t.x.feito ? " checked" : ""}><span><b>${esc(t.x.t)}</b><br><span class="sm mut">${s}${t.x.d === 3 ? " · difícil" : ""}</span>${a === o ? plBot(e, t) : ""}</span></label>`
    : t.tp === "rev"
      ? `<label class="ck" style="margin:6px 0;align-items:flex-start"><input type="checkbox" data-plx="rev" data-m="${t.m.id}" data-t="${t.x.id}"><span>🔁 Revisar: <b>${esc(t.x.t)}</b><br><span class="sm mut">${s} · ${["1ª revisão (dia seguinte)", "2ª revisão (1 semana)", "3ª revisão (1 mês)"][t.k]}</span>${a === o ? plBot(e, t) : ""}</span></label>`
      : t.tp === "sim"
        ? `<div class="sm" style="margin:6px 0">📋 <b>${esc(t.txt)}</b>${a === o ? ' <button class="btn s" data-cnm="sim" data-v="ct" data-plgo="1">Fazer CT1</button> <button class="btn s" data-cnm="sim" data-v="cb" data-plgo="1">Fazer CB</button>' : ""}</div>`
        : `<div class="sm" style="margin:6px 0">${esc(t.txt)}</div>`;
}
function plBot(e, t) {
  return t.x && t.x.cn && t.m.cn
    ? ` <button class="btn s" data-cnm="${t.x.cn}" data-v="${t.m.cn}" data-plgo="1" style="margin-top:4px">Abrir o treino</button>`
    : e.tipo !== "cnpi"
      ? ` <button class="btn s" data-plq="${t.m.id}|${t.x.id}" style="margin-top:4px">🧠 Questões com IA</button>`
      : "";
}
function plHtml() {
  const e = plL(),
    t = plAtivo(),
    a = ymd(new Date()),
    o =
      '<div class="g3" style="gap:8px;margin-top:8px"><button class="btn s" data-pln="cnpi" style="white-space:normal;line-height:1.25">🎓 CNPI-T<br><small>usa seus simulados</small></button><button class="btn s" data-pln="eco" style="white-space:normal;line-height:1.25">📘 Economia<br><small>1º semestre (modelo)</small></button><button class="btn s" data-pln="livre" style="white-space:normal;line-height:1.25">➕ Outro curso<br><small>em branco</small></button></div>';
  if (!t)
    return `<div class="card"><b>🗓️ Planos de estudo</b><div class="sm" style="color:var(--mut);margin:4px 0">Diga até quando precisa estar pronto e quantas horas tem por semana: o app divide as matérias em sessões de ~45 minutos, agenda revisões (1 dia, 1 semana e 1 mês depois) e reorganiza sozinho quando você atrasa. Serve para a CNPI, para a faculdade ou para qualquer curso.</div>${o}</div>`;
  const s = plAgenda(t, addD(a, 13)),
    n = plProg(t),
    r = Math.round(
      (new Date(t.fim + "T12:00") - new Date(a + "T12:00")) / 864e5,
    ),
    i = s.ag[a] || [],
    l = Math.max(1, s.dias.length / Math.max(1, t.dias.length)),
    d = s.pend / l,
    c = t.tipo === "cnpi" ? plProntoCnpi() : null,
    p = Object.keys(s.ag)
      .filter((u) => u > a)
      .sort()
      .slice(0, 6);
  return `${e.length > 1 ? `<div class="hub2" style="margin:0 0 8px">${e.map((u) => `<button class="${u.id === t.id ? "on" : ""}" data-pla="${u.id}">${esc(u.nome)}</button>`).join("")}</div>` : ""}<div class="card"><div class="top"><b>🗓️ ${esc(t.nome)}</b><span class="sm mut">${r >= 0 ? r + " dia(s) até " + fmtD(t.fim) : "prazo encerrado"}</span></div>${t.curso ? `<div class="sm mut">${esc(t.curso)}</div>` : ""}
<div class="cnbar" style="margin-top:8px"><b style="width:${n.pc * 100}%"></b></div><div class="sm" style="margin-top:4px">${n.f} de ${n.t} tópicos estudados (${Math.round(n.pc * 100)}%) · ritmo necessário: <b>${d.toFixed(1).replace(".", ",")}</b> tópico(s) por semana · ${s.porDia} por dia de estudo</div>
${s.sobra ? `<div class="warn sm" style="margin-top:6px">⚠ ${s.sobra} tópico(s) não cabem até a data. Aumente as horas por semana, os dias de estudo ou adie a data.</div>` : ""}
${c != null ? `<div class="sm" style="margin-top:6px">Pronto para a prova: <b class="${c >= 0.67 ? "g" : c >= 0.55 ? "am" : "r"}">${Math.round(c * 100)}%</b> de acerto nos últimos simulados (aprovação: 67%).</div>` : ""}</div>
<h2>Hoje · ${PL_DIAS[new Date().getDay()]} ${fmtD(a).slice(0, 5)}</h2><div class="card">${i.length ? i.map((u) => plTarefa(t, u, a)).join("") : `<div class="sm mut">${(t.dias || []).includes(new Date().getDay()) ? "Nada pendente para hoje. 👏" : "Hoje não é dia de estudo neste plano."}</div>`}</div>
${p.length ? `<h2>Próximos dias</h2><div class="card">${p.map((u) => `<div class="sm" style="margin:6px 0"><b>${PL_DIAS[new Date(u + "T12:00").getDay()]} ${fmtD(u).slice(0, 5)}</b>: ${s.ag[u].map((m) => (m.tp === "est" ? esc(m.x.t) : m.tp === "rev" ? "🔁 " + esc(m.x.t) : esc(m.txt))).join(" · ")}</div>`).join("")}</div>` : ""}
<h2>Matérias</h2>${t.materias
    .map((u) => {
      const m = u.top.filter((f) => f.feito).length;
      return `<details class="card" style="padding:10px 12px"><summary style="cursor:pointer"><b>${esc(u.nome)}</b> <span class="sm mut">${m}/${u.top.length}${u.prova ? " · prova " + fmtD(u.prova).slice(0, 5) : ""}</span></summary>
<label class="sm" style="margin-top:6px">Data da prova (opcional)<input type="date" data-plm="prova" data-m="${u.id}" value="${esc(u.prova || "")}"></label>
${u.top.map((f) => `<div style="display:flex;gap:6px;align-items:center;margin:4px 0"><input type="checkbox" data-plx="feito" data-m="${u.id}" data-t="${f.id}"${f.feito ? " checked" : ""} style="width:auto"><span class="sm" style="flex:1">${esc(f.t)}${f.d === 3 ? ' <span class="am">●</span>' : ""}</span>${t.tipo !== "cnpi" ? `<button class="btn s" data-plq="${u.id}|${f.id}" title="Questões com IA" style="padding:4px 8px">🧠</button><button class="btn s" data-pldel="${u.id}|${f.id}" style="padding:4px 8px">✕</button>` : ""}</div>`).join("")}
${t.tipo !== "cnpi" ? `<div style="display:flex;gap:6px;margin-top:6px"><input data-pladd="${u.id}" placeholder="Novo tópico" style="flex:1"><button class="btn s" data-pladdb="${u.id}">+</button></div><div style="display:flex;gap:6px;margin-top:6px"><button class="btn s" data-plia="${u.id}" style="flex:1">✨ Sugerir tópicos com IA</button><button class="btn s d" data-plmdel="${u.id}">Excluir matéria</button></div>` : ""}</details>`;
    })
    .join("")}
${t.tipo !== "cnpi" ? '<div class="card"><div style="display:flex;gap:6px"><input id="plnm" placeholder="Nova matéria (ex.: Microeconomia I)" style="flex:1"><button class="btn s" data-plnm="1">Adicionar</button></div><div class="sm mut" style="margin-top:4px">Os tópicos do modelo são uma base comum; confira com o plano de ensino da sua faculdade e ajuste.</div></div>' : ""}
<h2>Configurar o plano</h2><div class="card"><div class="g2"><label>Nome<input data-plc="nome" value="${esc(t.nome)}"></label><label>Curso<input data-plc="curso" value="${esc(t.curso || "")}" placeholder="ex.: Direito, Engenharia"></label></div>
<div class="g3"><label>Até (prova/fim)<input type="date" data-plc="fim" value="${esc(t.fim)}"></label><label>Horas por semana<input type="number" inputmode="decimal" data-plc="horas" value="${esc(t.horas)}"></label><label>Lembrete<input type="time" data-plc="lembrete" value="${esc(t.lembrete || "")}"></label></div>
<div class="sm mut" style="margin:6px 0 4px">Dias de estudo</div><div class="hub2">${PL_DIAS.map((u, m) => `<button class="${t.dias.includes(m) ? "on" : ""}" data-pld="${m}">${u}</button>`).join("")}</div>
<button class="btn s d" data-plx="apaga" style="width:100%;margin-top:10px">Excluir este plano</button></div>
<h2>Novo plano</h2><div class="card"><div class="sm mut">Crie quantos quiser: um para a CNPI, outro para a faculdade, outro para um amigo que estuda outra coisa.</div>${o}</div>`;
}
function plAch(e) {
  const t = plAtivo();
  if (!t) return {};
  const a = t.materias.find((o) => o.id === e);
  return { P: t, m: a };
}
async function plIA(e) {
  const { P: t, m: a } = plAch(e);
  if (!a) return;
  const o = document.querySelector(`[data-plia="${e}"]`);
  o && ((o.disabled = !0), (o.textContent = "Pensando…"));
  try {
    const s = (
      (await anxCall({ modo: "topicos", curso: t.curso, materia: a.nome }))
        .topicos || []
    ).filter(
      (n) =>
        n &&
        n.t &&
        !a.top.some((r) => r.t.toLowerCase() === String(n.t).toLowerCase()),
    );
    (s.forEach((n) => a.top.push({ id: plId(), t: n.t, d: n.d || 2 })),
      save(),
      toast(s.length + " tópico(s) adicionados."));
  } catch (s) {
    toast(String(s.message || s), 4e3);
  }
  render();
}
async function plQuiz(e, t) {
  const { P: a, m: o } = plAch(e),
    s = o && o.top.find((n) => n.id === t);
  if (s) {
    toast("Gerando questões sobre " + s.t + "…", 3e3);
    try {
      const n = (
        (
          await anxCall({
            modo: "quiz",
            curso: a.curso,
            materia: o.nome,
            topico: s.t,
            n: 5,
          })
        ).questoes || []
      ).map((r, i) => ({ ...r, id: "pl" + t + i, t: "", r: r.r || o.nome }));
      if (!n.length)
        throw new Error("A IA não devolveu questões. Tente de novo.");
      ((CN.run = {
        modo: "plano",
        arg: a.id,
        L: n.map((r) => ({ ...r, ord: cnEmbaralha([0, 1, 2, 3]) })),
        i: 0,
        resp: {},
        marc: {},
        ini: Date.now(),
        fim: null,
        acabou: 0,
        tit: s.t,
      }),
        render(),
        scrollTo(0, 0));
    } catch (n) {
      toast(String(n.message || n), 4e3);
    }
  }
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if ((a = t("[data-pln]"))) {
      (plNovo(a.dataset.pln), render(), scrollTo(0, 0));
      return;
    }
    if ((a = t("[data-pla]"))) {
      (((S.ax ?? (S.ax = {})).plAtivo = a.dataset.pla), save(), render());
      return;
    }
    if ((a = t("[data-pld]"))) {
      const o = plAtivo(),
        s = +a.dataset.pld;
      ((o.dias = o.dias.includes(s)
        ? o.dias.filter((n) => n !== s)
        : [...o.dias, s].sort()),
        o.dias.length || (o.dias = [s]),
        save(),
        plSync(),
        render());
      return;
    }
    if ((a = t("[data-plia]"))) return plIA(a.dataset.plia);
    if ((a = t("[data-plq]"))) {
      const [o, s] = a.dataset.plq.split("|");
      return (e.preventDefault(), plQuiz(o, s));
    }
    if ((a = t("[data-pldel]"))) {
      const [o, s] = a.dataset.pldel.split("|"),
        { m: n } = plAch(o);
      n && ((n.top = n.top.filter((r) => r.id !== s)), save(), render());
      return;
    }
    if ((a = t("[data-plmdel]"))) {
      const o = plAtivo();
      if (!confirm("Excluir a matéria e os tópicos dela?")) return;
      ((o.materias = o.materias.filter((s) => s.id !== a.dataset.plmdel)),
        save(),
        render());
      return;
    }
    if ((a = t("[data-pladdb]"))) {
      const o = document.querySelector(`[data-pladd="${a.dataset.pladdb}"]`),
        { m: s } = plAch(a.dataset.pladdb);
      s &&
        o &&
        o.value.trim() &&
        (s.top.push({ id: plId(), t: o.value.trim().slice(0, 90), d: 2 }),
        save(),
        render());
      return;
    }
    if ((a = t("[data-plnm]"))) {
      const o = document.getElementById("plnm"),
        s = plAtivo();
      s &&
        o &&
        o.value.trim() &&
        (s.materias.push({
          id: plId(),
          nome: o.value.trim().slice(0, 80),
          prova: "",
          top: [],
        }),
        save(),
        render());
      return;
    }
    if ((a = t('[data-plx="apaga"]'))) {
      const o = plAtivo();
      if (!o || !confirm('Excluir o plano "' + o.nome + '"?')) return;
      ((S.planos = plL().filter((s) => s.id !== o.id)),
        save(),
        plSync(),
        render());
      return;
    }
    t("[data-plgo]") && (ESV = "cnpi");
  },
  !0,
),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-plx],[data-plm],[data-plc]");
    if (!t) return;
    const a = plAtivo();
    if (!a) return;
    if (t.dataset.plc) {
      const n = t.dataset.plc;
      ((a[n] =
        n === "horas" ? Math.max(1, Math.min(80, +t.value || 6)) : t.value),
        save(),
        plSync(),
        render());
      return;
    }
    const { m: o } = plAch(t.dataset.m);
    if (!o) return;
    if (t.dataset.plm === "prova") {
      ((o.prova = t.value), save(), render());
      return;
    }
    const s = o.top.find((n) => n.id === t.dataset.t);
    s &&
      (t.dataset.plx === "feito"
        ? ((s.feito = t.checked ? Date.now() : 0), (s.rv = 0))
        : t.dataset.plx === "rev" && (s.rv = (s.rv || 0) + 1),
      save(),
      plSync(),
      setTimeout(() => {
        const n = scrollY;
        (render(), scrollTo(0, n));
      }, 250));
  }));
function plSync() {
  (clearTimeout(plSync._t),
    (plSync._t = setTimeout(() => {
      try {
        turnoPushSync();
      } catch {}
    }, 1500)));
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      const a = ymd(new Date()),
        o = {};
      let s = "";
      (plL().forEach((n) => {
        if (!n.lembrete) return;
        (!s || n.lembrete < s) && (s = n.lembrete);
        const r = plAgenda(n, addD(a, 13));
        Object.entries(r.ag).forEach(([i, l]) => {
          const d = o[i] ?? (o[i] = { n: 0, m: [] });
          ((d.n += l.length),
            l.forEach((c) => {
              c.m && !d.m.includes(c.m.nome) && d.m.push(c.m.nome);
            }));
        });
      }),
        s &&
          Object.keys(o).length &&
          (t.estudo = {
            h: s,
            por: Object.fromEntries(
              Object.entries(o).map(([n, r]) => [
                n,
                { n: r.n, m: r.m.slice(0, 3).join(", ").slice(0, 90) },
              ]),
            ),
          }));
    } catch {}
    return t;
  };
}
{
  const e = vEstudos;
  vEstudos = function () {
    const t =
      '<div class="seg" style="margin:8px 0 10px"><button data-ep="esv" data-id="liv">📚 Livros</button><button data-ep="esv" data-id="pr">🧩 Prompts</button><button data-ep="esv" data-id="cnpi">🎓 CNPI-T</button><button class="on" data-ep="esv" data-id="pl">🗓️ Planos</button><button data-ep="esv" data-id="rpy">▶️ Replay</button><button data-ep="esv" data-id="bt">🧪 Backtest</button></div>';
    if (ESV === "pl") {
      const a = CN.run;
      return a && a.modo === "plano"
        ? `<h1>Estudos</h1><div class="sm mut" style="margin:6px 0">Treino: ${esc(a.tit || "")}</div>${a.acabou ? cnResultadoHtml() : cnQuestaoHtml()}`
        : `<h1>Estudos</h1>${t}${plHtml()}`;
    }
    return e
      .apply(this, arguments)
      .replace(
        /(data-id="cnpi">\ud83c\udf93 CNPI-T<\/button>)/,
        '$1<button data-ep="esv" data-id="pl">🗓️ Planos</button>',
      );
  };
}
{
  const e = cnQuestaoHtml;
  cnQuestaoHtml = function () {
    const t = e.apply(this, arguments);
    try {
      if (CN.run && CN.run.modo === "plano")
        return t.replace(/>Treino \xb7 quest\xe3o/, ">Treino com IA · questão");
    } catch {}
    return t;
  };
}
{
  const e = cnHomeHtml;
  cnHomeHtml = function () {
    const t = e.apply(this, arguments),
      a = plL().find((o) => o.tipo === "cnpi");
    return t.replace(
      "<h2>Padrões no gráfico</h2>",
      `<div class="card" style="margin-top:8px"><div class="top"><b>🗓️ Plano de estudo da CNPI</b>${a ? `<span class="sm mut">${plProg(a).f}/${plProg(a).t}</span>` : ""}</div><div class="sm" style="color:var(--mut);margin:4px 0">${a ? "Sua agenda até a prova, priorizando os temas em que você mais erra." : "Informe a data da prova: o app monta a agenda até lá, prioriza os temas em que você mais erra e agenda simulados."}</div><button class="btn s" ${a ? `data-pla="${a.id}" data-plopen="1"` : 'data-pln="cnpi" data-plopen="1"'} style="width:100%">${a ? "Abrir o plano" : "Criar o plano da CNPI"}</button></div><h2>Padrões no gráfico</h2>`,
    );
  };
}
(document.addEventListener("click", (e) => {
  e.target.closest("[data-plopen]") &&
    setTimeout(() => {
      ((ESV = "pl"), render(), scrollTo(0, 0));
    }, 0);
}),
  (GOR.estudo = () => {
    ((GO.r = null), (ESV = "pl"), irPara("estudos"));
  }));
const STK_META = {
  regras: "Zero trades fora do plano",
  prep: "Preparação da manhã em todos os dias úteis",
  limite: "Respeitar o limite de perda todos os dias",
  max: "No máximo N trades por dia",
};
function stkDias() {
  const e = loc().slice(0, 10),
    t = [];
  for (let a = 0, o = e; a < 400; a++, o = addD(o, -1)) {
    if (isWk(o)) continue;
    const s = S.days[o] || {},
      n = dayTr(o).filter((l) => (l.c && l.c.pl != null) || l.forex),
      r = limPerda(s),
      i = dayPL(n);
    t.push({
      k: o,
      hoje: o === e,
      n: n.length,
      regras: n.length ? n.every((l) => l.rules !== "n") : null,
      prep: prepDe(s, "m").feita,
      limite: n.length && r > 0 ? i >= -r : null,
    });
  }
  return t;
}
function stkSeq(e, t) {
  let a = 0,
    o = 0,
    s = 0,
    n = !0;
  for (const r of e) {
    const i = t(r);
    i != null &&
      ((r.hoje && i === !1 && t === stkF.prep) ||
        (i ? (s++, n && (a = s)) : ((n = !1), (o = Math.max(o, s)), (s = 0))));
  }
  return ((o = Math.max(o, s)), { atual: a, rec: o });
}
const stkF = {
  regras: (e) => e.regras,
  prep: (e) => e.prep,
  limite: (e) => e.limite,
};
function stkMeta() {
  const e = (S.ax || {}).metaSem,
    t = addD(loc().slice(0, 10), -((new Date().getDay() + 6) % 7));
  return e && e.sem === t ? e : { tipo: "", n: 3, sem: t };
}
function stkMetaProg(e) {
  const t = loc().slice(0, 10),
    a = [];
  for (let n = 0; n < 5; n++) {
    const r = addD(e.sem, n);
    r <= t && a.push(r);
  }
  let o = 0,
    s = 0;
  return (
    a.forEach((n) => {
      const r = dayTr(n).filter((c) => (c.c && c.c.pl != null) || c.forex),
        i = S.days[n] || {},
        l = limPerda(i);
      let d = null;
      (e.tipo === "regras"
        ? (d = r.length ? r.every((c) => c.rules !== "n") : null)
        : e.tipo === "prep"
          ? (d = prepDe(i, "m").feita || (n === t ? null : !1))
          : e.tipo === "limite"
            ? (d = r.length ? (l > 0 ? dayPL(r) >= -l : !0) : null)
            : e.tipo === "max" && (d = r.length ? r.length <= +e.n : null),
        d === !0 ? o++ : d === !1 && s++);
    }),
    { ok: o, ruim: s, dias: a.length }
  );
}
function stkHtml() {
  const e = stkDias(),
    t = [
      ["regras", "📏", "Seguindo as regras", "dias com trade"],
      ["prep", "☀️", "Preparação da manhã", "dias úteis"],
      ["limite", "🛑", "Limite respeitado", "dias com trade"],
    ].map(([s, n, r, i]) => ({
      k: s,
      ic: n,
      l: r,
      u: i,
      ...stkSeq(e, stkF[s]),
    })),
    a = stkMeta(),
    o = a.tipo ? stkMetaProg(a) : null;
  return `<div class="card" id="stk"><div class="top"><b>🔥 Sequências</b><span class="sm mut">recorde entre parênteses</span></div>
<div class="g3" style="gap:6px;margin-top:8px;text-align:center">${t.map((s) => `<div style="background:var(--card2);border-radius:12px;padding:8px 4px"><div style="font-size:20px;font-weight:750">${s.ic} ${s.atual}</div><div class="sm">${s.l}</div><div class="sm mut">${s.rec ? (s.atual && s.atual >= s.rec ? "🏆 recorde!" : "(" + s.rec + ")") : s.k === "limite" ? "defina o limite no Meu dia" : "sem dados ainda"}</div></div>`).join("")}</div>
<div style="margin-top:10px">${
    a.tipo
      ? `<div class="sm"><b>Meta da semana:</b> ${esc(STK_META[a.tipo].replace("N", a.n))}</div><div class="sm" style="margin-top:2px">${o.ruim ? `<span class="r">✗ falhou em ${o.ruim} dia(s)</span>` : '<span class="g">✓ cumprida até agora</span>'} · ${o.ok} dia(s) ok de ${o.dias} <button class="btn s" data-stk="troca" style="margin-left:6px">Trocar</button></div>`
      : `<div class="sm mut" style="margin-bottom:4px">Escolha uma meta para esta semana:</div><div class="hub2">${Object.entries(
          STK_META,
        )
          .map(
            ([s, n]) =>
              `<button data-stk="${s}">${esc(n.replace("N", "3"))}</button>`,
          )
          .join("")}</div>`
  }</div></div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-stk]");
  if (!t) return;
  const a = stkMeta();
  if (t.dataset.stk === "troca") a.tipo = "";
  else if (((a.tipo = t.dataset.stk), a.tipo === "max")) {
    const s = prompt("No máximo quantos trades por dia?", "3");
    if (!s) return;
    a.n = Math.max(1, Math.round(+s) || 3);
  }
  (((S.ax ?? (S.ax = {})).metaSem = a), save());
  const o = scrollY;
  (render(), scrollTo(0, o));
});
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#stk")) return;
      const a = t.querySelector("h2"),
        o = document.createElement("div");
      ((o.innerHTML = stkHtml()),
        a ? a.before(o.firstElementChild) : t.appendChild(o.firstElementChild));
    } catch (t) {
      console.error(t);
    }
  };
}
function prjDias(e) {
  const t = diasMais(loc().slice(0, 10), -120),
    a = {};
  return (
    S.trades.forEach((o) => {
      const s = calc(o);
      if (s.pl == null) return;
      const n = dOf(o);
      n < t || (a[n] = (a[n] || 0) + emBRL(s.pl, moedaT(o)));
    }),
    e.fx &&
      lcItems().forEach((o) => {
        o.d >= t && (a[o.d] = (a[o.d] || 0) + o.v * usdBrl());
      }),
    Object.values(a)
  );
}
function prjSim(e) {
  const t = prjDias(e);
  if (t.length < 15) return { n: t.length };
  const a = +e.mult || 1,
    o = Math.max(4, Math.min(22, Math.round(t.length / 4))),
    s = (+e.irDT || 20) / 100,
    n = +e.alvo || +e.renda || 0,
    r = +e.custo || 0,
    i = r * (+e.mesesReserva || 0);
  let l = 13;
  const d = () => (
      (l ^= l << 13),
      (l >>>= 0),
      (l ^= l >>> 17),
      (l ^= l << 5),
      (l >>>= 0),
      l / 4294967296
    ),
    c = 2e3,
    p = [],
    u = Array.from({ length: 12 }, () => []),
    m = [];
  let f = 0,
    x = 0;
  for (let h = 0; h < c; h++) {
    let b = 0,
      y = +e.reserva || 0,
      j = 0,
      k = 0,
      A = null;
    for (let C = 0; C < 12; C++) {
      let I = 0;
      for (let se = 0; se < o; se++) I += t[Math.floor(d() * t.length)] * a;
      const J = I > 0 ? I * (1 - s) : I;
      (p.push(J),
        n && J >= n && f++,
        (b += J),
        u[C].push(b),
        (y += Math.max(0, J)),
        A == null && i > 0 && y >= i && (A = C + 1),
        (j = r && J >= r ? j + 1 : 0),
        (k = Math.max(k, j)));
    }
    (k >= 6 && x++, m.push(A));
  }
  const v = (h, b) => {
      const y = h.slice().sort((j, k) => j - k);
      return y[Math.min(y.length - 1, Math.floor(b * y.length))];
    },
    g = m.filter((h) => h != null).sort((h, b) => h - b);
  return {
    n: t.length,
    porMes: o,
    mult: a,
    med: v(p, 0.5),
    p10: v(p, 0.1),
    p90: v(p, 0.9),
    pAlvo: n ? f / (c * 12) : null,
    p6: r ? x / c : null,
    res:
      i > 0 && Math.floor(c * 0.5) < g.length ? g[Math.floor(c * 0.5)] : null,
    resPc: i > 0 ? g.length / c : null,
    fan: u.map((h) => [v(h, 0.1), v(h, 0.5), v(h, 0.9)]),
    alvo: n,
    custo: r,
    resAlvo: i,
    pNeg: p.filter((h) => h < 0).length / p.length,
  };
}
function prjSvg(e) {
  const t = Math.max(0, ...e.map((i) => i[2])),
    a = Math.min(0, ...e.map((i) => i[0])),
    o = t - a || 1,
    s = (i) => 6 + ((t - i) / o) * 108,
    n = (i) => ((i + 1) / 12) * 320,
    r = (i, l, d) =>
      `<path d="M0 ${s(0)} ${e.map((c, p) => "L" + n(p).toFixed(1) + " " + s(c[i]).toFixed(1)).join(" ")}" fill="none" stroke="${l}" stroke-width="${d}"/>`;
  return `<svg viewBox="0 0 320 120" style="width:100%;height:auto"><line x1="0" x2="320" y1="${s(0)}" y2="${s(0)}" stroke="var(--bd2,#999)" stroke-dasharray="3 3"/>${r(0, "var(--r,#dc3e26)", 1)}${r(2, "var(--g,#2e8b5d)", 1)}${r(1, "var(--ac,#86abcb)", 2)}</svg>`;
}
function prjHtml() {
  const e = crCfg(),
    t = prjSim(e),
    a = (o) => Math.round(o * 100) + "%";
  return !t.med && t.med !== 0
    ? `<h2>Projeção (Monte Carlo)</h2><div class="card sm" style="color:var(--mut)">Precisa de pelo menos 15 dias operados nos últimos 4 meses para projetar (você tem ${t.n}).</div>`
    : `<h2>Projeção para os próximos 12 meses</h2><div class="card"><div class="sm" style="color:var(--mut)">O app sorteia 2.000 anos possíveis a partir dos seus ${t.n} dias operados nos últimos 4 meses (${t.porMes} pregões por mês, já com IR de ${e.irDT || 20}% nos meses positivos)${t.mult !== 1 ? `, com a mão ${String(t.mult).replace(".", ",")}× maior` : ""}.</div>
<div class="rrdg" style="margin-top:8px"><div><small>Renda mensal provável</small><b class="mono ${cls(t.med)}">${money(t.med)}</b><i>8 em 10 meses entre ${money(t.p10)} e ${money(t.p90)}</i></div><div><small>Mês ≥ renda alvo</small><b class="mono">${t.pAlvo == null ? "–" : a(t.pAlvo)}</b><i>${t.alvo ? "alvo " + money(t.alvo) : "preencha a renda alvo"}</i></div>
<div><small>6 meses seguidos ≥ custo</small><b class="mono">${t.p6 == null ? "–" : a(t.p6)}</b><i>chance de acontecer em 12 meses</i></div><div><small>Reserva completa</small><b class="mono">${t.resAlvo ? (t.res != null ? "em " + t.res + " mês(es)" : "> 12 meses") : "–"}</b><i>${t.resAlvo ? "meta " + money(t.resAlvo) + " · chance em 12m: " + a(t.resPc) : "preencha custo e reserva"}</i></div></div>
${prjSvg(t.fan)}<div class="sm mut">Resultado acumulado em 12 meses: linha do meio = cenário típico; verde = 1 em 10 melhores; vermelho = 1 em 10 piores.</div>
<label style="margin-top:8px">E se eu aumentar a mão? (multiplicador)<input type="number" step="0.25" inputmode="decimal" data-cr="mult" value="${esc(e.mult || 1)}"></label>
${t.pNeg > 0.4 ? '<div class="warn sm" style="margin-top:6px">Em mais de 4 de cada 10 meses simulados o resultado é negativo: ainda não é renda, é estatística a melhorar. Mantenha a CLT.</div>' : ""}
<div class="sm" style="color:var(--mut);margin-top:6px">Os dias são sorteados de forma independente, então sequências ruins reais podem ser piores. Use como termômetro, não como promessa.</div></div>`;
}
{
  const e = vCarreira;
  vCarreira = function () {
    const t = e.apply(this, arguments);
    try {
      return t.replace(
        "<h2>Seus números</h2>",
        prjHtml() + "<h2>Seus números</h2>",
      );
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
var FLW = { d: null, busy: 0, err: "", venc: "", ts: 0 };
async function flwCarrega(e) {
  if (FLW.busy || (!e && Date.now() - FLW.ts < 55e3 && FLW.d)) return;
  const t = cfg();
  if (!t || typeof SESS > "u" || !SESS) {
    ((FLW.err = "Entre na sua conta (Ferramentas → Conta) para ver o fluxo."),
      flwPinta());
    return;
  }
  ((FLW.busy = 1), flwPinta());
  try {
    await tok();
    const a = await fetch(t.url + "/functions/v1/ewz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: t.key,
          Authorization: "Bearer " + SESS.at,
        },
        body: JSON.stringify({ acao: "agora", venc: FLW.venc || "" }),
      }),
      o = await a.json().catch(() => ({}));
    if (!a.ok)
      throw new Error(
        a.status === 404
          ? 'A função "ewz" ainda não foi publicada no Supabase.'
          : o.error || "Erro " + a.status,
      );
    ((FLW.d = o), (FLW.venc = o.venc), (FLW.err = ""));
  } catch (a) {
    FLW.err = String(a.message || a);
  }
  ((FLW.ts = Date.now()), (FLW.busy = 0), flwPinta());
}
function flwPinta() {
  const e = document.getElementById("flwbox");
  e && (e.outerHTML = flwHtml());
}
const flwUS = (e) =>
    e == null
      ? "–"
      : (e < 0 ? "−" : "") +
        "US$ " +
        (Math.abs(e) >= 1e6
          ? (Math.abs(e) / 1e6).toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            }) + " mi"
          : Math.abs(e) >= 1e3
            ? (Math.abs(e) / 1e3).toLocaleString("pt-BR", {
                maximumFractionDigits: 0,
              }) + " mil"
            : Math.abs(e).toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })),
  flwLado = (e) =>
    e === "C"
      ? '<span class="g">compra</span>'
      : e === "V"
        ? '<span class="r">venda</span>'
        : '<span class="mut">meio</span>',
  flwVenc = (e) =>
    String(e || "").slice(8, 10) + "/" + String(e || "").slice(5, 7);
function flwSerieSvg(e) {
  if (!e || e.length < 2)
    return '<div class="sm mut">A evolução aparece ao longo do pregão americano (uma leitura a cada 5 minutos, com a função notificar ativa).</div>';
  const t = 330,
    a = 150,
    o = 6,
    s = e.map((h) => +h.net_c),
    n = e.map((h) => +h.net_p),
    r = e.map((h) => +h.spot),
    i = Math.max(0, ...s, ...n),
    l = Math.min(0, ...s, ...n),
    d = i - l || 1,
    c = (h) => o + ((i - h) / d) * (a - 2 * o),
    p = Math.max(...r),
    u = Math.min(...r),
    m = p - u || 1,
    f = (h) => o + ((p - h) / m) * (a - 2 * o),
    x = (h) => (h / (e.length - 1)) * t,
    v = (h, b, y, j, k) =>
      `<path d="${h.map((A, C) => (C ? "L" : "M") + x(C).toFixed(1) + " " + b(A).toFixed(1)).join("")}" fill="none" stroke="${y}" stroke-width="${j}"${k ? ' stroke-dasharray="3 3"' : ""}/>`,
    g = (h) =>
      new Date(h).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
  return `<svg viewBox="0 0 ${t} ${a + 14}" style="width:100%;height:auto"><line x1="0" x2="${t}" y1="${c(0)}" y2="${c(0)}" stroke="var(--bd2,#999)" stroke-dasharray="2 3"/>${v(r, f, "var(--mut,#888)", 1.2, 1)}${v(s, c, "var(--g,#2e8b5d)", 2)}${v(n, c, "var(--r,#dc3e26)", 2)}
<text x="2" y="${a + 12}" font-size="9" fill="var(--mut)">${g(e[0].ts)}</text><text x="${t - 2}" y="${a + 12}" font-size="9" text-anchor="end" fill="var(--mut)">${g(e[e.length - 1].ts)}</text></svg>
<div class="sm" style="display:flex;gap:10px;flex-wrap:wrap"><span><b class="g">━</b> net premium calls</span><span><b class="r">━</b> net premium puts</span><span><b class="mut">┅</b> preço do EWZ</span></div>`;
}
function flwOiHtml(e, t) {
  if (!e || !e.L.length)
    return '<div class="sm mut">Sem open interest para este vencimento.</div>';
  const a = e.L.filter((r) => r.oc || r.op),
    o = Math.max(1, ...a.map((r) => Math.max(r.oc, r.op))),
    s = a.reduce(
      (r, i) => (Math.abs(i.k - t) < Math.abs(r.k - t) ? i : r),
      a[0],
    ),
    n = (r) =>
      r == null || !r
        ? ""
        : `<span class="${r > 0 ? "g" : "r"}" style="font-size:10px"> ${r > 0 ? "+" : ""}${r.toLocaleString("pt-BR")}</span>`;
  return `<div style="font-size:11.5px">${a
    .slice()
    .reverse()
    .map(
      (r) =>
        `<div style="display:grid;grid-template-columns:1fr 46px 1fr;gap:4px;align-items:center;margin:1px 0${r === s ? ";background:var(--card2);border-radius:8px" : ""}"><div style="text-align:right;white-space:nowrap">${n(r.dp)} <span style="display:inline-block;height:9px;width:${Math.round((r.op / o) * 90)}px;background:var(--r,#dc3e26);opacity:.75;border-radius:2px;vertical-align:middle"></span></div><div style="text-align:center"><b>${r.k}</b>${r.k === e.callWall ? '<div class="g" style="font-size:9px;line-height:1">teto</div>' : r.k === e.putWall ? '<div class="r" style="font-size:9px;line-height:1">piso</div>' : ""}</div><div style="white-space:nowrap"><span style="display:inline-block;height:9px;width:${Math.round((r.oc / o) * 90)}px;background:var(--g,#2e8b5d);opacity:.75;border-radius:2px;vertical-align:middle"></span>${n(r.dc)}</div></div>`,
    )
    .join("")}</div>
<div class="sm" style="margin-top:6px"><span class="r">■</span> puts · <span class="g">■</span> calls · <b class="g">teto</b>: maior OI de calls acima (${e.callWall ?? "–"}) · <b class="r">piso</b>: maior OI de puts abaixo (${e.putWall ?? "–"})${e.flip ? ` · troca de sinal do GEX perto de ${e.flip}` : ""}. Os números pequenos são a variação do OI desde a leitura anterior.</div>`;
}
function flwHtml() {
  const e = FLW.d;
  if ((setTimeout(() => flwCarrega(!1), 0), !e))
    return `<div id="flwbox"><div class="card sm" style="color:var(--mut)">${FLW.err ? esc(FLW.err) : "Carregando o fluxo do EWZ…"}</div>${flwSobre()}</div>`;
  const t = e.vol || {},
    a = (n) => (n == null ? "–" : (n * 100).toFixed(1).replace(".", ",") + "%"),
    o = { comprador: "g", vendedor: "r", misto: "am" }[e.vies],
    s = e.dia !== (e.ny || {}).dia;
  return `<div id="flwbox"><div class="card"><div class="top"><b>EWZ US$ ${(+e.spot).toFixed(2).replace(".", ",")}</b><span class="chip ${o}" style="border-color:currentColor">viés ${esc(e.vies)}</span></div>
<div class="sm" style="color:var(--mut);margin-top:4px">${e.vies === "comprador" ? "Predomínio de compras de call e vendas de put no dia." : e.vies === "vendedor" ? "Predomínio de vendas de call e compras de put no dia." : "Fluxo misto: compras (ou vendas) dos dois lados, sem direção clara só por este critério."} Fluxo com viés não garante o movimento: confirme no gráfico.</div>
<div class="rrdg" style="margin-top:8px"><div><small>Net premium calls</small><b class="mono ${cls(e.netC)}">${flwUS(e.netC)}</b><i>volume ${(+e.volC).toLocaleString("pt-BR")}</i></div><div><small>Net premium puts</small><b class="mono ${cls(e.netP)}">${flwUS(e.netP)}</b><i>volume ${(+e.volP).toLocaleString("pt-BR")}</i></div>
<div><small>Exposição em delta</small><b class="mono ${cls(e.expo)}">${flwUS(e.expo)}</b><i>das execuções classificadas</i></div><div><small>Put/call</small><b class="mono">${e.pcVol != null ? e.pcVol.toFixed(2).replace(".", ",") : "–"}</b><i>no volume · ${e.pcOi != null ? e.pcOi.toFixed(2).replace(".", ",") : "–"} no OI</i></div></div></div>
<h2>Evolução no dia${s ? " (" + fmtD(e.dia) + ")" : ""}</h2><div class="card">${flwSerieSvg(e.serie)}</div>
<h2>Boletas relevantes</h2><div class="card">${
    e.boletas.length
      ? `<div style="overflow-x:auto"><table style="width:100%;font-size:12px"><tr><th>Hora</th><th style="text-align:left">Contrato</th><th style="text-align:right">Prêmio</th></tr>${e.boletas
          .slice(0, 15)
          .map(
            (n) =>
              `<tr><td>${new Date(n.ts + ":00Z").toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td><td style="text-align:left">${n.t === "C" ? "Call" : "Put"} ${n.k} · ${flwVenc(n.venc)} · ${flwLado(n.lado)}<div class="sm mut">${n.dvol.toLocaleString("pt-BR")} contr.${n.vol > n.oi ? " · vol > OI" : ""} · delta eq. <span class="${cls(n.expo)}">${flwUS(n.expo)}</span></div></td><td style="text-align:right;white-space:nowrap"><b>${flwUS(n.premio)}</b></td></tr>`,
          )
          .join("")}</table></div>`
      : '<div class="sm mut">Nenhuma boleta acima de US$ 250 mil registrada no dia (as leituras são de 5 em 5 minutos, durante o pregão americano).</div>'
  }
${e.estruturas.length ? `<div class="sm" style="margin-top:8px"><b>Estruturas prováveis</b> (hipóteses pelo horário, quantidade, strike e vencimento):<ul style="margin:4px 0 0 18px;padding:0">${e.estruturas.map((n) => `<li>${esc(n.tipo)} <span class="mut">${n.pernas.map((r) => esc(r.replace(/^EWZ/, ""))).join(" + ")}</span></li>`).join("")}</ul></div>` : ""}</div>
<h2>Maiores prêmios do dia (por contrato)</h2><div class="card"><div style="overflow-x:auto"><table style="width:100%;font-size:12px"><tr><th style="text-align:left">Contrato</th><th style="text-align:right">Prêmio</th></tr>${e.top
    .slice(0, 10)
    .map(
      (n) =>
        `<tr><td style="text-align:left">${n.t === "C" ? "Call" : "Put"} ${n.k} · ${flwVenc(n.venc)} · último ${flwLado(n.lado)}<div class="sm mut">volume ${n.vol.toLocaleString("pt-BR")} · OI ${n.oi.toLocaleString("pt-BR")}${n.abertura ? ' <span class="am">●</span>' : ""}</div></td><td style="text-align:right;white-space:nowrap">${flwUS(n.premio)}</td></tr>`,
    )
    .join(
      "",
    )}</table></div><div class="sm mut" style="margin-top:4px"><span class="am">●</span> volume maior que o OI: parte provavelmente é posição nova (confirme na atualização do OI).</div></div>
<h2>Volatilidade</h2><div class="card"><div class="rrdg"><div><small>IV 30 dias</small><b class="mono">${a(t.iv30)}</b><i>no dinheiro, interpolada</i></div><div><small>Movimento implícito</small><b class="mono">${t.strad ? "±" + a(t.strad.pct) : "–"}</b><i>${t.strad ? `straddle ${flwVenc(t.strad.venc)} (${t.strad.dias} d): ±US$ ${t.strad.usd.toFixed(2).replace(".", ",")}, entre ${(e.spot - t.strad.usd).toFixed(2).replace(".", ",")} e ${(e.spot + t.strad.usd).toFixed(2).replace(".", ",")}` : ""}</i></div>
<div><small>1 desvio-padrão (30 d)</small><b class="mono">${t.mov1dp != null ? "±" + a(t.mov1dp) : "–"}</b><i>${t.mov1dp != null ? "entre " + (e.spot * (1 - t.mov1dp)).toFixed(2).replace(".", ",") + " e " + (e.spot * (1 + t.mov1dp)).toFixed(2).replace(".", ",") : ""}</i></div><div><small>Realizada 20 d</small><b class="mono">${a(t.hv20)}</b><i>${t.iv30 != null && t.hv20 != null ? (t.iv30 > t.hv20 ? "IV acima da realizada: prêmio caro" : "IV abaixo da realizada: prêmio barato") : ""}${t.rank != null ? " · IV Rank " + Math.round(t.rank * 100) + "%" : t.nHist ? ` · IV Rank após 20 dias (${t.nHist})` : ""}</i></div></div>
<div class="sm" style="color:var(--mut);margin-top:6px">Movimento implícito e desvio-padrão não são alvo de preço nem garantem a faixa; são estimativas tiradas dos prêmios. A IV mede o tamanho do movimento precificado, não a direção. Prêmio alto pode refletir risco alto: vender volatilidade exige estrutura, controle de exposição e tamanho de posição.</div></div>
<h2>Open interest por strike</h2><div class="card"><div class="hub2" style="margin-bottom:8px">${(
    e.vencs || []
  )
    .slice(0, 8)
    .map(
      (n) =>
        `<button class="${n.venc === e.venc ? "on" : ""}" data-flv="${n.venc}">${flwVenc(n.venc)} · ${n.dias}d</button>`,
    )
    .join("")}</div>${flwOiHtml(e.oi, e.spot)}
<div class="sm" style="color:var(--mut);margin-top:6px">Todo contrato aberto tem um comprado e um vendido: OI alto sozinho não diz direção, nem vira suporte ou resistência automaticamente.${e.oiDia ? " Variação do OI comparada com " + fmtD(e.oiDia) + "." : ""}</div></div>
${flwSobre()}<div class="sm mut" style="margin:6px 2px">${esc(e.fonte || "")} · atualizado ${new Date(e.gerado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ${FLW.busy ? "· atualizando…" : ""}</div></div>`;
}
function flwSobre() {
  return `<h2>Como usar</h2><div class="card sm"><div>O EWZ é o ETF de ações brasileiras negociado nos EUA (segue o MSCI Brazil 25/50, em dólar). Operações grandes nas opções dele podem gerar ajustes de hedge que chegam às ações daqui, ao índice e ao câmbio, ou os dois mercados podem estar reagindo à mesma notícia.</div>
<div style="margin-top:6px"><b>Antes de usar o fluxo, pergunte:</b><ol style="margin:4px 0 0 18px;padding:0"><li>Essa operação acrescenta informação ao cenário?</li><li>Existe convergência com o gráfico do índice?</li><li>Há uma entrada com risco aceitável?</li></ol></div>
<div style="margin-top:6px"><b>Sem o preço dar um motivo técnico para entrar, não entre.</b> O fluxo acrescenta contexto; o gráfico dá o gatilho; a gestão de risco define se a operação cabe.</div>
<div style="margin-top:6px;color:var(--mut)">O lado (compra/venda) é estimado pelo último preço perto do ask ou do bid, o que não é infalível: uma execução pode ser abertura, encerramento ou parte de uma estrutura maior. O net premium é um saldo de prêmios, não a exposição líquida do mercado. Dados com atraso de cerca de 15 minutos.</div>
<label class="ck" style="margin-top:8px"><input type="checkbox" data-flal="1"${typeof NP < "u" && NP.on && NP.on.ewz ? " checked" : ""}><span>Avisar no celular quando passar boleta acima de US$ 1 milhão</span></label></div>`;
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-flv]");
  if (t) {
    ((FLW.venc = t.dataset.flv), flwCarrega(!0));
    return;
  }
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-flal]");
    if (t) {
      try {
        ((NP.on.ewz = t.checked), ls.set("diario-np", NP), turnoPushSync(!0));
      } catch {}
      toast(t.checked ? "Aviso de boletas do EWZ ligado." : "Aviso desligado.");
    }
  }));
try {
  const e = HUB_M.findIndex((a) => a[0] === "mercado:opc");
  HUB_M.some((a) => a[0] === "mercado:fl") ||
    HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, [
      "mercado:fl",
      "🐋 Fluxo EWZ",
    ]);
  const t = MGRP.find((a) => a[0] === "Ações");
  t && !t[1].includes("mercado:fl") && t[1].push("mercado:fl");
} catch {}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "fl"
      ? e.apply(this, arguments)
      : `<h1>Fluxo de opções do EWZ</h1><p class="sm mut" style="margin-top:-4px">Como o mercado de fora está negociando ações brasileiras pelas opções do EWZ: net premium, boletas, estruturas, open interest e volatilidade.</p>${flwHtml()}`;
  };
}
(setInterval(() => {
  try {
    tab === "mercado" && MKT.tab === "fl" && !document.hidden && flwCarrega(!1);
  } catch {}
}, 6e4),
  (GOR.ewz = () => {
    tab === "mercado" && ((GO.r = null), (MKT.tab = "fl"), render());
  }));
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("ewz", "🐋 EWZ: boletas acima de US$ 1 milhão nas opções")}`
    );
  };
}
try {
  FN_LISTA.push(["ewz", "Fluxo de opções do EWZ"]);
} catch {}
const SHR = {
    modo: (() => {
      try {
        return ls.get("diario-shr-m") || "preco";
      } catch {
        return "preco";
      }
    })(),
    rs: (() => {
      try {
        return ls.get("diario-shr-rs") ? 1 : 0;
      } catch {
        return 0;
      }
    })(),
    url: null,
    blob: null,
    id: null,
  },
  SHR_TOURO = [
    [8, 20],
    [25, 16],
    [52, 8],
    [64, 12],
    [72, 15],
    [73, 9],
    [78, 5],
    [86, 3],
    [80, 8],
    [77, 14],
    [82, 16],
    [90, 30],
    [94, 36],
    [92, 40],
    [85, 39],
    [78, 34],
    [74, 42],
    [80, 48],
    [88, 54],
    [90, 58],
    [86, 59],
    [78, 54],
    [72, 50],
    [68, 48],
    [66, 60],
    [61, 60],
    [61, 47],
    [50, 44],
    [38, 44],
    [34, 50],
    [30, 60],
    [25, 60],
    [27, 48],
    [20, 46],
    [10, 56],
    [6, 55],
    [12, 44],
    [6, 34],
    [1, 36],
    [3, 26],
  ],
  SHR_CHIFRE = [
    [80, 16],
    [83, 10],
    [89, 7],
    [97, 7],
    [90, 11],
    [85, 18],
  ],
  SHR_URSO = [
    [4, 32],
    [8, 22],
    [22, 16],
    [40, 10],
    [54, 12],
    [64, 18],
    [68, 16],
    [69, 13],
    [72, 12],
    [74, 15],
    [80, 19],
    [88, 24],
    [95, 28],
    [98, 31],
    [97, 35],
    [90, 37],
    [84, 38],
    [78, 40],
    [74, 46],
    [76, 58],
    [84, 60],
    [84, 62],
    [70, 62],
    [68, 50],
    [55, 48],
    [42, 48],
    [40, 56],
    [42, 62],
    [28, 62],
    [26, 52],
    [14, 46],
    [6, 40],
  ];
function shrPoli(e, t) {
  (e.beginPath(),
    t.forEach((a, o) => (o ? e.lineTo(a[0], a[1]) : e.moveTo(a[0], a[1]))),
    e.closePath());
}
function shrBicho(e, t, a, o, s, n, r) {
  const i = ([u, m]) => [a + u * s, o + m * s],
    l = t.map(i),
    d = t === SHR_TOURO ? SHR_CHIFRE.map(i) : null;
  (e.save(),
    (e.globalAlpha = 0.35),
    (e.fillStyle = n),
    e.beginPath(),
    e.ellipse(
      a + 50 * s,
      o + (t === SHR_TOURO ? 61 : 63) * s,
      46 * s,
      3.2 * s,
      0,
      0,
      7,
    ),
    (e.filter = "blur(18px)"),
    e.fill(),
    e.restore(),
    e.save(),
    (e.shadowColor = n),
    (e.shadowBlur = 70),
    shrPoli(e, l),
    (e.fillStyle = "#0e0f10"),
    e.fill(),
    e.restore(),
    e.save(),
    shrPoli(e, l),
    e.clip());
  const c = l.length;
  for (let u = 0; u < c; u += 2) {
    const m = l[u],
      f = l[(u + 2) % c],
      x = l[(u + Math.floor(c / 2) + (u % 5)) % c];
    (e.beginPath(),
      e.moveTo(m[0], m[1]),
      e.lineTo(f[0], f[1]),
      e.lineTo(x[0], x[1]),
      e.closePath());
    const v = e.createLinearGradient(m[0], m[1], x[0], x[1]);
    (v.addColorStop(0, u % 2 ? n : r),
      v.addColorStop(0.55, "rgba(14,15,16,0)"),
      (e.globalAlpha = 0.12 + (u % 4) * 0.06),
      (e.fillStyle = v),
      e.fill(),
      (e.globalAlpha = 0.06),
      (e.strokeStyle = "#fff"),
      (e.lineWidth = 1),
      e.stroke());
  }
  if (
    ((e.globalAlpha = 1),
    e.restore(),
    e.save(),
    (e.shadowColor = n),
    (e.shadowBlur = 26),
    (e.strokeStyle = n),
    (e.lineWidth = 3.4),
    (e.lineJoin = "round"),
    shrPoli(e, l),
    e.stroke(),
    d)
  ) {
    (shrPoli(e, d), (e.fillStyle = "#0e0f10"), e.fill());
    const u = e.createLinearGradient(d[0][0], d[0][1], d[2][0], d[2][1]);
    (u.addColorStop(0, n),
      u.addColorStop(1, r),
      (e.globalAlpha = 0.5),
      (e.fillStyle = u),
      e.fill(),
      (e.globalAlpha = 1),
      e.stroke());
  }
  e.restore();
  const p = i(t === SHR_TOURO ? [84, 22] : [83, 25]);
  (e.save(),
    (e.shadowColor = r),
    (e.shadowBlur = 30),
    (e.fillStyle = "#fff"),
    e.beginPath(),
    e.arc(p[0], p[1], s * 1.1, 0, 7),
    e.fill(),
    e.restore());
}
function shrDados(e) {
  if (e._fx) return shrDadosFx(e);
  const t = isOpen(e),
    a = t ? tcPx(e) : null,
    o = calc(t && a ? { ...e, exit: String(a), dtx: loc().slice(0, 16) } : e),
    s = e.side !== "V",
    n =
      { D: "Day trade", S: "Swing trade", O: "Opção" }[e.tipo || "D"] ||
      "Trade",
    r =
      e.tipo === "O"
        ? e.side === "C"
          ? "Comprado"
          : "Lançado"
        : s
          ? "Compra"
          : "Venda";
  return {
    op: t,
    px: a,
    c: o,
    compra: s,
    tp: n,
    lado: r,
    pc:
      o.pl != null
        ? pctConta(o.pl, moedaT(e), e.tipo || "D").replace(" da conta", "")
        : "",
  };
}
const SHR_FRASES = {
    g: [
      "Plano feito, plano seguido.",
      "Paciência paga.",
      "Disciplina antes do lucro.",
      "Entrada no ponto, saída no plano.",
      "O mercado pagou quem esperou.",
    ],
    r: [
      "Stop é custo do negócio.",
      "Perda pequena, conta viva.",
      "Segui o plano, o mercado não quis.",
      "Respeitar o stop também é vitória.",
      "Amanhã tem mercado.",
    ],
    a: [
      "Posição em andamento.",
      "Stop definido, emoção desligada.",
      "Deixa o trade trabalhar.",
    ],
  },
  SHR_BULL = {
    c: "M95 95C90 70 70 45 40 40C62 52 80 70 108 88C130 70 175 55 215 58C260 60 300 70 330 88C350 98 365 105 372 118C385 112 392 100 395 92C398 104 392 122 378 132C380 150 376 168 366 180L380 225L388 246L368 248L352 205C345 195 335 190 325 188L330 222L336 246L316 246L305 200C280 202 230 204 200 198L190 230L186 248L166 248L172 205C160 200 150 205 135 215L108 228L100 222L125 200C130 190 132 180 132 170C128 160 118 150 100 145C85 142 70 140 58 132C52 128 52 120 58 116C66 110 74 104 80 100C86 98 90 96 95 95Z",
    h: "M112 92C104 70 92 52 64 44C88 50 108 64 124 88Z",
    o: [86, 112],
    l: [
      "M150 80C170 110 172 150 160 190",
      "M215 62C220 100 222 150 214 196",
      "M268 66C262 100 268 150 300 196",
      "M330 90C320 120 326 160 350 182",
      "M100 146C112 130 128 118 140 92",
      "M60 128C70 124 82 122 96 124",
    ],
  },
  SHR_BEAR = {
    c: "M70 120C68 108 74 98 84 100C92 101 94 110 92 116C105 112 125 100 150 92C185 70 230 66 265 78C300 88 335 100 352 122C365 140 368 160 360 178L368 236C370 244 364 248 354 248L330 248C322 248 322 240 328 236L326 200C300 206 250 210 215 206L212 238C213 246 206 248 198 248L178 248C170 248 170 240 178 236L180 202C170 200 160 204 150 210L140 240C138 247 130 248 122 248L104 248C96 248 96 241 104 237L118 228L128 190C124 175 112 165 98 160C84 158 70 156 58 152C50 149 47 143 50 137C56 131 62 126 70 120Z",
    h: null,
    o: [76, 128],
    l: [
      "M150 94C168 120 170 160 160 200",
      "M220 70C224 110 226 160 220 204",
      "M285 82C282 120 292 160 326 198",
      "M98 160C112 150 128 128 140 96",
      "M56 142C66 140 76 142 88 148",
    ],
  };
function shrArte(e, t, a, o, s, n, r) {
  const i = new Path2D(t.c),
    l = t.h ? new Path2D(t.h) : null;
  (e.save(),
    e.translate(a, o),
    e.scale(s, s),
    e.save(),
    (e.shadowColor = n),
    (e.shadowBlur = (90 / s) * 2),
    (e.fillStyle = "#0c0c0e"),
    e.fill(i),
    e.restore());
  const d = e.createLinearGradient(40, 40, 380, 250);
  (d.addColorStop(0, "#3a3a40"),
    d.addColorStop(0.35, "#151518"),
    d.addColorStop(0.7, "#262629"),
    d.addColorStop(1, "#0b0b0d"),
    (e.fillStyle = d),
    e.fill(i),
    e.save(),
    e.clip(i));
  const c = e.createRadialGradient(120, 90, 5, 120, 90, 220);
  (c.addColorStop(0, "rgba(213,181,122,0.35)"),
    c.addColorStop(1, "rgba(0,0,0,0)"),
    (e.fillStyle = c),
    e.fillRect(0, 0, 420, 270),
    (e.lineWidth = 1.6),
    (e.strokeStyle = n),
    (e.globalAlpha = 0.28),
    (e.shadowColor = n),
    (e.shadowBlur = 12),
    t.l.forEach((p) => e.stroke(new Path2D(p))),
    (e.globalAlpha = 1));
  for (let p = 0; p < 28; p++)
    ((e.globalAlpha = 0.08),
      (e.fillStyle = n),
      e.fillRect(60 + ((p * 47) % 300), 70 + ((p * 29) % 170), 26, 3));
  if (
    ((e.globalAlpha = 1),
    e.restore(),
    e.save(),
    (e.shadowColor = n),
    (e.shadowBlur = 30),
    (e.strokeStyle = n),
    (e.lineWidth = (3 / s) * 2),
    (e.lineJoin = "round"),
    e.stroke(i),
    e.restore(),
    l)
  ) {
    const p = e.createLinearGradient(60, 40, 124, 92);
    (p.addColorStop(0, "#dfc79a"),
      p.addColorStop(0.4, n),
      p.addColorStop(1, "#443416"),
      (e.fillStyle = p),
      e.fill(l),
      e.save(),
      (e.shadowColor = n),
      (e.shadowBlur = 20),
      (e.strokeStyle = "#dfc79a"),
      (e.lineWidth = 1.5),
      e.stroke(l),
      e.restore(),
      e.save(),
      (e.strokeStyle = "#dfc79a"),
      (e.lineWidth = 2),
      (e.shadowColor = n),
      (e.shadowBlur = 18),
      e.stroke(new Path2D("M95 95C90 70 70 45 40 40C62 52 80 70 108 88")),
      e.restore());
  }
  (e.save(),
    (e.shadowColor = r),
    (e.shadowBlur = 40),
    (e.fillStyle = r),
    e.beginPath(),
    e.ellipse(t.o[0], t.o[1], 6, 3.5, -0.3, 0, 7),
    e.fill(),
    e.restore(),
    e.restore());
}
function shrPainel(e, t, a, o, s, n, r) {
  (e.save(),
    (e.globalAlpha = 0.85),
    (e.fillStyle = "rgba(17,13,5,0.75)"),
    (e.strokeStyle = n),
    (e.lineWidth = 2),
    (e.shadowColor = n),
    (e.shadowBlur = 14),
    e.fillRect(t, a, o, s),
    e.strokeRect(t, a, o, s),
    (e.shadowBlur = 0));
  for (let i = 0; i < Math.floor((s - 20) / 13); i++) {
    let l = t + 12;
    for (let d = 0; d < 5; d++) {
      const c = 10 + ((r * 7 + i * 13 + d * 29) % 46);
      if (l + c > t + o - 10) break;
      ((e.globalAlpha = 0.25 + ((i + d + r) % 4) * 0.15),
        (e.fillStyle = n),
        e.fillRect(l, a + 12 + i * 13, c, 5),
        (l += c + 8));
    }
  }
  e.restore();
}
function shrPct(e, t, a) {
  const o = t.c;
  if (a === "conta")
    return t.pc
      ? parseFloat(t.pc.replace("%", "").replace(/\./g, "").replace(",", "."))
      : null;
  const s = numN(e.entry),
    n = t.op ? t.px : numN(e.exit);
  return !(s > 0) || n == null
    ? null
    : ((n - s) / s) * 100 * (e.side === "V" ? -1 : 1);
}
var shrGera;
async function shrAbre(e) {
  const t = shrAcha(e);
  if (!t) return;
  SHR.id = e;
  let a = document.getElementById("shrov");
  (a ||
    ((a = document.createElement("div")),
    (a.id = "shrov"),
    (a.className = "ov"),
    document.body.appendChild(a)),
    (document.body.style.overflow = "hidden"),
    (a.innerHTML =
      '<div class="sh" style="max-width:520px;margin:auto"><div class="top"><b>Imagem para compartilhar</b><button class="x" data-shrx="1">✕</button></div><div class="sm mut" style="margin:8px 0">Gerando…</div></div>'));
  try {
    const o = await shrGera(t);
    (SHR.url && URL.revokeObjectURL(SHR.url),
      (SHR.blob = o),
      (SHR.url = URL.createObjectURL(o)),
      (a.innerHTML = `<div class="sh" style="max-width:520px;margin:auto"><div class="top"><b>Imagem para compartilhar</b><button class="x" data-shrx="1">✕</button></div><img src="${SHR.url}" alt="Card do trade" style="width:100%;border-radius:16px;margin:10px 0;display:block">
<div class="seg" style="margin-bottom:8px"><button class="${SHR.modo !== "conta" ? "on" : ""}" data-shrm="preco">% da operação</button><button class="${SHR.modo === "conta" ? "on" : ""}" data-shrm="conta">% da conta</button></div><label class="ck"><input type="checkbox" data-shrrs="1"${SHR.rs ? " checked" : ""}><span>Mostrar o resultado em dinheiro</span></label><div class="g2" style="margin-top:10px"><button class="btn" data-shrgo="share">Compartilhar</button><a class="btn s" href="${SHR.url}" download="trade-${esc(String(t.ativo || "").toLowerCase())}.png" style="text-align:center">Salvar imagem</a></div><div class="sm mut" style="margin-top:8px">% da operação: quanto o preço andou a seu favor desde a entrada (em opções, quanto o prêmio rendeu). Por padrão não mostra valores em reais.</div></div>`));
  } catch (o) {
    a.innerHTML = `<div class="sh"><div class="top"><b>Imagem</b><button class="x" data-shrx="1">✕</button></div><div class="sm r">Não consegui gerar: ${esc(String(o.message || o))}</div></div>`;
  }
}
function shrFecha() {
  const e = document.getElementById("shrov");
  (e && e.remove(), (document.body.style.overflow = ""));
}
const SHR_CAM =
  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>';
(document.addEventListener(
  "click",
  async (e) => {
    const t = e.target.closest("[data-shr]");
    if (t) {
      (e.stopPropagation(), e.preventDefault(), shrAbre(t.dataset.shr));
      return;
    }
    if (e.target.closest("[data-shrx]") || e.target.id === "shrov") {
      shrFecha();
      return;
    }
    if (e.target.closest("[data-shrgo]") && SHR.blob) {
      const a = shrAcha(SHR.id),
        o = new File(
          [SHR.blob],
          "trade-" + String((a && a.ativo) || "diario").toLowerCase() + ".png",
          { type: "image/png" },
        );
      try {
        if (navigator.canShare && navigator.canShare({ files: [o] }))
          await navigator.share({ files: [o], title: "Meu trade" });
        else {
          const s = document.createElement("a");
          ((s.href = SHR.url), (s.download = o.name), s.click());
        }
      } catch {}
    }
  },
  !0,
),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-shrm]");
    if (t) {
      SHR.modo = t.dataset.shrm;
      try {
        ls.set("diario-shr-m", SHR.modo);
      } catch {}
      SHR.id && shrAbre(SHR.id);
    }
  }),
  document.addEventListener("change", (e) => {
    if (e.target.closest("[data-shrrs]")) {
      SHR.rs = e.target.checked ? 1 : 0;
      try {
        ls.set("diario-shr-rs", SHR.rs ? 1 : "");
      } catch {}
      SHR.id && shrAbre(SHR.id);
    }
  }));
{
  const e = card;
  card = function (t) {
    const a = e.apply(this, arguments);
    try {
      const o = `<button class="tc-cam" data-shr="${esc(t.id)}" aria-label="Gerar imagem para compartilhar" title="Gerar imagem">${SHR_CAM}</button>`;
      return a.includes('<div class="tc-f">')
        ? a.replace('<div class="tc-f">', '<div class="tc-f">' + o)
        : a.replace(/<\/div>$/, `<div class="tc-f">${o}</div></div>`);
    } catch {}
    return a;
  };
}
{
  const e = fxHtml;
  fxHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = FX && S.trades.find((o) => o.id === FX.id);
      t &&
        a &&
        (t = t.replace(
          '<div class="g2" style="margin:16px 0 30px">',
          `<button class="btn s" data-shr="${esc(a.id)}" style="width:100%;margin-top:14px;display:flex;gap:8px;justify-content:center;align-items:center">${SHR_CAM} Gerar imagem para compartilhar</button><div class="g2" style="margin:16px 0 30px">`,
        ));
    } catch {}
    return t;
  };
}
(function () {
  const e = TraderStyles.slot("legacy-040");
  ((e.textContent = TraderStyles.css("legacy-040")), TraderStyles.mount(e));
})();
const SHR_ARTE = "";
function shrAcha(e) {
  if (((e = String(e || "")), e.startsWith("fx:"))) {
    const t = (S.ops || []).find((o) => o.id === e.slice(3));
    if (!t) return null;
    const a = t.st === "closed" && t.rk > 0 ? t.res / t.rk : null;
    return {
      id: e,
      _fx: 1,
      _o: t,
      ativo: t.s,
      tipo: "FX",
      side: t.side,
      entry: t.entry,
      exit: t.exit,
      stop: t.stop,
      target: t.target,
      qty: t.lots,
      dt: t.dt || "",
      dtx: t.dtx || "",
      setup: t.setup || "",
      rules: t.rules,
      _r: a,
      _res: t.st === "closed" ? +t.res : null,
      _op: t.st !== "closed",
    };
  }
  return S.trades.find((t) => t.id === e) || null;
}
function shrDadosFx(e) {
  const t = { pl: e._res, r: e._r };
  return {
    op: e._op,
    px: null,
    c: t,
    compra: e.side !== "V",
    tp: "Forex",
    lado: e.side !== "V" ? "Compra" : "Venda",
    pc: t.pl != null ? pctConta(t.pl, "USD") : "",
  };
}
const SHR_DESC = (e) => {
  const t = String(e || "").toUpperCase();
  return /^WIN/.test(t)
    ? "Índice Bovespa Mini"
    : /^IND/.test(t)
      ? "Índice Bovespa Cheio"
      : /^WDO/.test(t)
        ? "Dólar Mini"
        : /^DOL/.test(t)
          ? "Dólar Cheio"
          : /^BIT/.test(t)
            ? "Bitcoin Futuro"
            : /^(MES|ES)/.test(t)
              ? "S&P 500 Futuro"
              : /^(MNQ|NQ)/.test(t)
                ? "Nasdaq 100 Futuro"
                : /^XAU/.test(t)
                  ? "Ouro"
                  : /^[A-Z]{6}$/.test(t)
                    ? t.slice(0, 3) + "/" + t.slice(3) + " · Forex"
                    : /^[A-Z]{4}[A-X]\d+/.test(t)
                      ? "Opção de " + t.slice(0, 4)
                      : /^[A-Z]{4}11$/.test(t)
                        ? "ETF / Fundo"
                        : /^[A-Z]{4}\d$/.test(t)
                          ? "Ação"
                          : "";
};
let SHR_IMG = null;
function shrArteDados() {
  return window.SHR_ARTE_DATA
    ? Promise.resolve(window.SHR_ARTE_DATA)
    : new Promise((e, t) => {
        const a = document.createElement("script");
        ((a.src = "arte.js"),
          (a.onload = () =>
            window.SHR_ARTE_DATA
              ? e(window.SHR_ARTE_DATA)
              : t(new Error("arte.js vazio"))),
          (a.onerror = () =>
            t(
              new Error(
                "Suba o arquivo arte.js no GitHub (junto com o app.js).",
              ),
            )),
          document.head.appendChild(a));
      });
}
function shrImg() {
  return (
    SHR_IMG ||
    (SHR_IMG = shrArteDados()
      .then(
        (e) =>
          new Promise((t, a) => {
            const o = new Image();
            ((o.onload = () => t(o)), (o.onerror = a), (o.src = e));
          }),
      )
      .catch((e) => {
        throw ((SHR_IMG = null), e);
      }))
  );
}
shrGera = async function (e) {
  const t = shrDados(e),
    a = 1080,
    o = 1080,
    s = document.createElement("canvas");
  ((s.width = a), (s.height = o));
  const n = s.getContext("2d"),
    r = 'system-ui,-apple-system,"SF Pro Display","Segoe UI",Roboto,sans-serif',
    i = (we, Be) => (n.font = `${we} ${Be}px ${r}`),
    l = "#42c081",
    d = "#ea7462",
    c = shrPct(e, t, SHR.modo || "preco"),
    p = c == null ? null : c >= 0,
    u = (we, Be, Ge, Ce, Qe) => {
      (n.beginPath(),
        n.roundRect ? n.roundRect(we, Be, Ge, Ce, Qe) : n.rect(we, Be, Ge, Ce));
    };
  ((n.fillStyle = "#030404"), n.fillRect(0, 0, a, o));
  let m = a;
  try {
    const we = await shrImg(),
      Be = 900,
      Ge = (we.width * Be) / we.height;
    ((m = a - Ge), n.drawImage(we, m, 0, Ge, Be));
  } catch {}
  const f = n.createLinearGradient(m, 0, m + 190, 0);
  (f.addColorStop(0, "rgb(3,4,4)"),
    f.addColorStop(0.35, "rgba(3,4,4,0.75)"),
    f.addColorStop(1, "rgba(3,4,4,0)"),
    (n.fillStyle = f),
    n.fillRect(0, 0, m + 190, 900));
  const x = n.createLinearGradient(0, 700, 0, 880);
  (x.addColorStop(0, "rgba(3,4,4,0)"),
    x.addColorStop(1, "rgb(3,4,4)"),
    (n.fillStyle = x),
    n.fillRect(0, 700, a, 180),
    (n.fillStyle = "#030404"),
    n.fillRect(0, 860, a, o - 860));
  const v = n.createRadialGradient(240, 500, 40, 240, 500, 520);
  (v.addColorStop(0, "rgba(192,148,66,0.07)"),
    v.addColorStop(1, "rgba(0,0,0,0)"),
    (n.fillStyle = v),
    n.fillRect(0, 0, a, o),
    n.save(),
    (n.strokeStyle = l),
    (n.lineWidth = 4),
    (n.shadowColor = l),
    (n.shadowBlur = 14),
    u(44, 56, 116, 116, 16),
    n.stroke(),
    n.restore(),
    [
      [70, 120, 92, 70],
      [90, 100, 118, 74],
      [110, 90, 108, 62],
      [130, 76, 96, 58],
    ].forEach(([we, Be, Ge, Ce], Qe) => {
      ((n.strokeStyle = Qe % 2 ? l : "#edece9"),
        (n.lineWidth = 3),
        n.beginPath(),
        n.moveTo(we, Ce),
        n.lineTo(we, Be + 30),
        n.stroke(),
        (n.fillStyle = n.strokeStyle),
        n.fillRect(we - 7, Math.min(Be, Ge), 14, Math.abs(Be - Ge) + 18));
    }),
    i("900", 62),
    (n.fillStyle = "#f2f1ee"),
    n.fillText("DIÁRIO DE", 178, 108),
    n.save(),
    (n.fillStyle = l),
    (n.shadowColor = l),
    (n.shadowBlur = 18),
    n.fillText("TRADER", 178, 170),
    n.restore(),
    i("500", 17),
    (n.fillStyle = "rgba(255,255,255,0.7)"),
    n.save(),
    n.letterSpacing && (n.letterSpacing = "6px"),
    n.fillText("ANÁLISE   •   DISCIPLINA   •   RESULTADOS", 46, 214),
    n.restore(),
    (n.fillStyle = l),
    n.fillRect(46, 262, 5, 96));
  const g = String(e.ativo || "—")
    .toUpperCase()
    .slice(0, 12);
  (i("900", 64), (n.fillStyle = "#fff"), n.fillText(g, 70, 318));
  const h = SHR_DESC(g) || t.tp;
  (i("400", 28),
    (n.fillStyle = "rgba(255,255,255,0.75)"),
    n.fillText(h, 72, 354),
    i("800", 30));
  const b = t.lado,
    y = t.compra ? l : d,
    j = n.measureText(b).width + 40;
  (n.save(),
    (n.strokeStyle = y),
    (n.lineWidth = 2.5),
    (n.fillStyle = t.compra
      ? "rgba(66,192,129,0.12)"
      : "rgba(234,116,98,0.12)"),
    u(68, 378, j, 48, 12),
    n.fill(),
    n.stroke(),
    n.restore(),
    (n.fillStyle = y),
    n.fillText(b, 88, 412));
  let k = 68 + j + 18;
  i("400", 30);
  const A = numN(e.qty);
  [
    A
      ? e._fx
        ? f2(A) + " lote" + (A === 1 ? "" : "s")
        : A.toLocaleString("pt-BR") +
          (e.tipo === "O"
            ? " opç."
            : /^[A-Z]{4}(3|4|5|6|11)$/.test(g)
              ? " ações"
              : " contr.")
      : "",
    e._fx ? "" : t.tp,
    t.op ? "Aberta" : "Fechada",
  ]
    .filter(Boolean)
    .forEach((we) => {
      ((n.fillStyle = "rgba(255,255,255,0.4)"),
        n.fillRect(k, 384, 2, 36),
        (k += 18),
        (n.fillStyle = "rgba(255,255,255,0.85)"),
        n.fillText(we, k, 412),
        (k += n.measureText(we).width + 18));
    });
  const C =
      c == null
        ? "—"
        : (c >= 0 ? "+" : "") + c.toFixed(2).replace(".", ",") + "%",
    I = p == null ? "#fff" : p ? l : d;
  (i("900", C.length > 8 ? 92 : 108),
    p != null &&
      (n.save(),
      (n.fillStyle = I),
      (n.shadowColor = I),
      (n.shadowBlur = 20),
      n.beginPath(),
      p
        ? (n.moveTo(72, 540), n.lineTo(104, 500), n.lineTo(136, 540))
        : (n.moveTo(72, 500), n.lineTo(104, 540), n.lineTo(136, 500)),
      n.closePath(),
      n.fill(),
      n.restore()),
    n.save(),
    (n.fillStyle = I),
    (n.shadowColor = I),
    (n.shadowBlur = 26),
    n.fillText(C, p == null ? 68 : 150, 556),
    n.restore(),
    SHR.modo === "conta" &&
      (i("400", 22),
      (n.fillStyle = "rgba(255,255,255,0.5)"),
      n.fillText("sobre a conta", 152, 590)));
  const J = (we, Be, Ge, Ce) => {
      ((n.fillStyle = "rgba(255,255,255,0.12)"),
        n.fillRect(68, we - 44, 500, 1.5),
        n.save(),
        (n.strokeStyle = l),
        (n.lineWidth = 3),
        (n.shadowColor = l),
        (n.shadowBlur = 8),
        Be === "moeda"
          ? [0, 9, 18].forEach((Qe) => {
              (n.beginPath(),
                n.ellipse(96, we - 6 - Qe, 18, 6, 0, 0, 7),
                n.stroke());
            })
          : (n.beginPath(),
            n.arc(96, we - 12, 18, 0, 7),
            n.stroke(),
            n.beginPath(),
            n.arc(96, we - 12, 9, 0, 7),
            n.stroke(),
            n.beginPath(),
            n.moveTo(96, we - 12),
            n.lineTo(114, we - 30),
            n.stroke()),
        n.restore(),
        i("400", 28),
        (n.fillStyle = "rgba(255,255,255,0.82)"),
        n.fillText(Ge, 140, we),
        i("800", 32),
        (n.fillStyle = "#fff"),
        (n.textAlign = "right"),
        n.fillText(Ce, 566, we),
        (n.textAlign = "left"));
    },
    se = (we) => {
      if (we == null || we === "") return "—";
      if (!e._fx) return vPx(we) || "—";
      const Be = numN(we);
      if (Be == null) return "—";
      const Ge = Math.min(
        5,
        Math.max(2, (String(we).split(/[.,]/)[1] || "").length),
      );
      return Be.toLocaleString("pt-BR", {
        minimumFractionDigits: Ge,
        maximumFractionDigits: Ge,
      });
    };
  (J(660, "moeda", "Preço de Entrada", se(e.entry)),
    J(
      740,
      "alvo",
      t.op ? "Preço Atual" : "Preço de Fechamento",
      t.op ? (t.px ? se(t.px) : "—") : se(e.exit),
    ),
    SHR.rs &&
      t.c.pl != null &&
      (i("400", 24),
      (n.fillStyle = "rgba(255,255,255,0.6)"),
      n.fillText("Resultado", 140, 800),
      i("800", 28),
      (n.fillStyle = t.c.pl >= 0 ? l : d),
      (n.textAlign = "right"),
      n.fillText(e._fx ? usd(t.c.pl) : mT(e, t.c.pl), 566, 800),
      (n.textAlign = "left")),
    (n.fillStyle = "rgba(255,255,255,0.14)"),
    n.fillRect(68, 860, 780, 1.5),
    n.fillRect(68, 982, 780, 1.5),
    n.save(),
    (n.strokeStyle = l),
    (n.lineWidth = 3.5),
    (n.shadowColor = l),
    (n.shadowBlur = 8),
    u(70, 890, 52, 50, 8),
    n.stroke(),
    n.beginPath(),
    n.moveTo(70, 906),
    n.lineTo(122, 906),
    n.moveTo(84, 882),
    n.lineTo(84, 896),
    n.moveTo(108, 882),
    n.lineTo(108, 896),
    n.stroke(),
    (n.fillStyle = l),
    [
      [84, 918],
      [96, 918],
      [108, 918],
      [84, 930],
      [96, 930],
    ].forEach(([we, Be]) => n.fillRect(we - 2, Be - 2, 5, 5)),
    n.restore());
  const Ie = String((t.op ? e.dt : e.dtx || e.dt) || "");
  (i("500", 18),
    (n.fillStyle = "rgba(255,255,255,0.6)"),
    n.fillText("DATA / HORA", 150, 898),
    i("800", 30),
    (n.fillStyle = "#fff"),
    n.fillText(
      Ie ? Ie.slice(0, 10) + " " + Ie.slice(11, 16) + ":00" : "—",
      150,
      942,
    ),
    (n.fillStyle = l),
    n.fillRect(528, 884, 2, 72),
    i("500", 18),
    (n.fillStyle = "rgba(255,255,255,0.6)"),
    (n.textAlign = "right"),
    n.fillText(e.setup ? "SETUP" : "ESTRATÉGIA", 836, 898),
    i("900", 36),
    (n.fillStyle = "#fff"),
    n.fillText(
      String(
        e.setup || (e.rules === "s" ? "Dentro do plano" : "Diário de Trader"),
      ).slice(0, 20),
      836,
      944,
    ),
    (n.textAlign = "left"),
    n.save(),
    (n.strokeStyle = l),
    (n.lineWidth = 4),
    (n.shadowColor = l),
    (n.shadowBlur = 12));
  const Pe = 880,
    Me = 866,
    ue = 130,
    ve = 24;
  ([
    [Pe, Me, 1, 1],
    [Pe + ue, Me, -1, 1],
    [Pe, Me + ue, 1, -1],
    [Pe + ue, Me + ue, -1, -1],
  ].forEach(([we, Be, Ge, Ce]) => {
    (n.beginPath(),
      n.moveTo(we, Be + Ce * ve),
      n.lineTo(we, Be),
      n.lineTo(we + Ge * ve, Be),
      n.stroke());
  }),
    n.restore(),
    (n.fillStyle = "#fff"),
    u(Pe + 14, Me + 14, ue - 28, ue - 28, 12),
    n.fill());
  const he = n.createLinearGradient(
    Pe + 22,
    Me + 22,
    Pe + ue - 22,
    Me + ue - 22,
  );
  return (
    he.addColorStop(0, "#111214"),
    he.addColorStop(1, "#0a0b0c"),
    (n.fillStyle = he),
    u(Pe + 20, Me + 20, ue - 40, ue - 40, 10),
    n.fill(),
    [
      [Pe + 42, Me + 86, Me + 64, Me + 48],
      [Pe + 58, Me + 78, Me + 92, Me + 56],
      [Pe + 74, Me + 70, Me + 56, Me + 42],
      [Pe + 90, Me + 56, Me + 74, Me + 38],
    ].forEach(([we, Be, Ge, Ce], Qe) => {
      ((n.strokeStyle = Qe % 2 ? "#edece9" : l),
        (n.lineWidth = 2.5),
        n.beginPath(),
        n.moveTo(we, Ce),
        n.lineTo(we, Math.max(Be, Ge) + 8),
        n.stroke(),
        (n.fillStyle = n.strokeStyle),
        n.fillRect(we - 5, Math.min(Be, Ge), 10, Math.abs(Be - Ge) + 4));
    }),
    (n.fillStyle = l),
    n.fillRect(150, 1032, 180, 1.5),
    n.fillRect(a - 330, 1032, 180, 1.5),
    i("500", 17),
    (n.fillStyle = "rgba(255,255,255,0.7)"),
    (n.textAlign = "center"),
    n.fillText(
      "G R A N D E S   R E S U L T A D O S   V Ê M   D E   G R A N D E S   H Á B I T O S",
      a / 2,
      1038,
    ),
    (n.textAlign = "left"),
    await new Promise((we) => s.toBlob((Be) => we(Be), "image/png"))
  );
};
{
  const e = opCard;
  opCard = function (t) {
    const a = e.apply(this, arguments);
    try {
      return a.replace(
        /<\/div>$/,
        `<div class="tc-f" style="margin-top:6px">${`<button class="tc-cam" data-shr="fx:${esc(t.id)}" aria-label="Gerar imagem para compartilhar" title="Gerar imagem">${SHR_CAM}</button>`}</div></div>`,
      );
    } catch {
      return a;
    }
  };
}
function eqDias() {
  const e = {};
  S.trades.forEach((t) => {
    const a = calc(t);
    if (a.pl == null) return;
    const o = String(t.dtx || t.dt).slice(0, 10);
    e[o] = (e[o] || 0) + emBRL(a.pl, moedaT(t));
  });
  try {
    lcItems().forEach((t) => {
      t.d && (e[t.d] = (e[t.d] || 0) + (+t.v || 0) * usdBrl());
    });
  } catch {}
  return e;
}
function perRange(e) {
  const t = ymd(new Date());
  if (e === "d") return [t, t, "Resultado do dia", fmtD(t)];
  if (e === "w") {
    const n = addD(t, -((new Date().getDay() + 6) % 7));
    return [
      n,
      addD(n, 6),
      "Resultado da semana",
      fmtD(n).slice(0, 5) + " a " + fmtD(addD(n, 4)),
    ];
  }
  if (e === "pm") {
    const n = new Date(),
      r = ymd(new Date(n.getFullYear(), n.getMonth() - 1, 1)),
      i = ymd(new Date(n.getFullYear(), n.getMonth(), 0));
    return [r, i, "Resultado de " + mesNome(r), mesNome(r)];
  }
  const a = new Date(),
    o = ymd(new Date(a.getFullYear(), a.getMonth(), 1)),
    s = ymd(new Date(a.getFullYear(), a.getMonth() + 1, 0));
  return [o, s, "Resultado do mês", mesNome(o)];
}
function perDados(e) {
  const [t, a, o, s] = perRange(e),
    n = mesNum(t, a),
    r = +capRef() || 0,
    i = S.trades
      .map((p) => ({ t: p, c: calc(p) }))
      .filter((p) => {
        const u = String(p.t.dtx || p.t.dt).slice(0, 10);
        return p.c.pl != null && u >= t && u <= a;
      })
      .filter((p) => p.c.r != null && isFinite(p.c.r)),
    l = i.reduce((p, u) => p + u.c.r, 0),
    d = i.slice().sort((p, u) => u.c.r - p.c.r)[0];
  let c = 0;
  try {
    c = stkSeq(stkDias(), stkF.regras).atual;
  } catch {}
  return {
    k: e,
    a: t,
    b: a,
    tit: o,
    sub: s,
    M: n,
    pct: r > 0 && n.n ? (n.P / r) * 100 : null,
    R: i.length ? l : null,
    best: d,
    seq: c,
  };
}
async function shrGeraPer(e) {
  const t = document.createElement("canvas");
  ((t.width = 1080), (t.height = 1080));
  const a = t.getContext("2d"),
    o = 'system-ui,-apple-system,"SF Pro Display","Segoe UI",Roboto,sans-serif',
    s = (y, j) => (a.font = `${y} ${j}px ${o}`),
    n = "#42c081",
    r = "#ea7462",
    i = e.pct == null ? null : e.pct >= 0,
    l = (y, j, k, A, C) => {
      (a.beginPath(),
        a.roundRect ? a.roundRect(y, j, k, A, C) : a.rect(y, j, k, A));
    };
  ((a.fillStyle = "#030404"), a.fillRect(0, 0, 1080, 1080));
  let d = 1080;
  try {
    const y = await shrImg(),
      j = 900,
      k = (y.width * j) / y.height;
    ((d = 1080 - k), a.drawImage(y, d, 0, k, j));
  } catch {}
  const c = a.createLinearGradient(d, 0, d + 190, 0);
  (c.addColorStop(0, "rgb(3,4,4)"),
    c.addColorStop(0.35, "rgba(3,4,4,0.75)"),
    c.addColorStop(1, "rgba(3,4,4,0)"),
    (a.fillStyle = c),
    a.fillRect(0, 0, d + 190, 900));
  const p = a.createLinearGradient(0, 700, 0, 880);
  (p.addColorStop(0, "rgba(3,4,4,0)"),
    p.addColorStop(1, "rgb(3,4,4)"),
    (a.fillStyle = p),
    a.fillRect(0, 700, 1080, 180),
    (a.fillStyle = "#030404"),
    a.fillRect(0, 860, 1080, 220),
    a.save(),
    (a.strokeStyle = n),
    (a.lineWidth = 4),
    (a.shadowColor = n),
    (a.shadowBlur = 14),
    l(44, 56, 116, 116, 16),
    a.stroke(),
    a.restore(),
    [
      [70, 120, 92, 70],
      [90, 100, 118, 74],
      [110, 90, 108, 62],
      [130, 76, 96, 58],
    ].forEach(([y, j, k, A], C) => {
      ((a.strokeStyle = C % 2 ? n : "#edece9"),
        (a.lineWidth = 3),
        a.beginPath(),
        a.moveTo(y, A),
        a.lineTo(y, j + 30),
        a.stroke(),
        (a.fillStyle = a.strokeStyle),
        a.fillRect(y - 7, Math.min(j, k), 14, Math.abs(j - k) + 18));
    }),
    s("900", 62),
    (a.fillStyle = "#f2f1ee"),
    a.fillText("DIÁRIO DE", 178, 108),
    a.save(),
    (a.fillStyle = n),
    (a.shadowColor = n),
    (a.shadowBlur = 18),
    a.fillText("TRADER", 178, 170),
    a.restore(),
    s("500", 17),
    (a.fillStyle = "rgba(255,255,255,0.7)"),
    a.fillText("ANÁLISE   •   DISCIPLINA   •   RESULTADOS", 46, 214),
    (a.fillStyle = n),
    a.fillRect(46, 262, 5, 96),
    s("900", 52),
    (a.fillStyle = "#fff"),
    a.fillText(e.tit.toUpperCase().slice(0, 22), 70, 312),
    s("400", 28),
    (a.fillStyle = "rgba(255,255,255,0.75)"),
    a.fillText(e.sub, 72, 352),
    s("400", 30));
  let u = 68;
  [
    e.M.n + " trade" + (e.M.n === 1 ? "" : "s"),
    e.M.acerto != null ? Math.round(e.M.acerto * 100) + "% de acerto" : "",
    e.R != null
      ? (e.R >= 0 ? "+" : "") + e.R.toFixed(1).replace(".", ",") + "×"
      : "",
  ]
    .filter(Boolean)
    .forEach((y, j) => {
      (j &&
        ((a.fillStyle = "rgba(255,255,255,0.4)"),
        a.fillRect(u, 384, 2, 36),
        (u += 18)),
        (a.fillStyle = j === 2 ? (e.R >= 0 ? n : r) : "rgba(255,255,255,0.85)"),
        a.fillText(y, u, 412),
        (u += a.measureText(y).width + 18));
    });
  const m =
      e.pct == null
        ? "—"
        : (e.pct >= 0 ? "+" : "") + e.pct.toFixed(2).replace(".", ",") + "%",
    f = i == null ? "#fff" : i ? n : r;
  (s("900", m.length > 8 ? 92 : 108),
    i != null &&
      (a.save(),
      (a.fillStyle = f),
      (a.shadowColor = f),
      (a.shadowBlur = 20),
      a.beginPath(),
      i
        ? (a.moveTo(72, 540), a.lineTo(104, 500), a.lineTo(136, 540))
        : (a.moveTo(72, 500), a.lineTo(104, 540), a.lineTo(136, 500)),
      a.closePath(),
      a.fill(),
      a.restore()),
    a.save(),
    (a.fillStyle = f),
    (a.shadowColor = f),
    (a.shadowBlur = 26),
    a.fillText(m, i == null ? 68 : 150, 546),
    a.restore(),
    s("400", 22),
    (a.fillStyle = "rgba(255,255,255,0.5)"),
    a.fillText("sobre a conta", 154, 594));
  const x = (y, j, k, A) => {
    ((a.fillStyle = "rgba(255,255,255,0.12)"),
      a.fillRect(68, y - 44, 500, 1.5),
      s("400", 28),
      (a.fillStyle = "rgba(255,255,255,0.82)"),
      a.fillText(j, 74, y),
      s("800", 32),
      (a.fillStyle = A || "#fff"),
      (a.textAlign = "right"),
      a.fillText(k, 566, y),
      (a.textAlign = "left"));
  };
  (x(
    660,
    "Melhor trade",
    e.best
      ? String(e.best.t.ativo || "")
          .toUpperCase()
          .slice(0, 8) +
          " " +
          (e.best.c.r >= 0 ? "+" : "") +
          e.best.c.r.toFixed(2).replace(".", ",") +
          "×"
      : "—",
    n,
  ),
    x(740, "Dias positivos × negativos", e.M.diasPos + " × " + e.M.diasNeg),
    SHR.rs && e.M.n && x(820, "Resultado", money(e.M.P), e.M.P >= 0 ? n : r),
    (a.fillStyle = "rgba(255,255,255,0.14)"),
    a.fillRect(68, 860, 780, 1.5),
    a.fillRect(68, 982, 780, 1.5),
    a.save(),
    (a.strokeStyle = n),
    (a.lineWidth = 3.5),
    (a.shadowColor = n),
    (a.shadowBlur = 8),
    l(70, 890, 52, 50, 8),
    a.stroke(),
    a.beginPath(),
    a.moveTo(70, 906),
    a.lineTo(122, 906),
    a.moveTo(84, 882),
    a.lineTo(84, 896),
    a.moveTo(108, 882),
    a.lineTo(108, 896),
    a.stroke(),
    a.restore(),
    s("500", 18),
    (a.fillStyle = "rgba(255,255,255,0.6)"),
    a.fillText("PERÍODO", 150, 898),
    s("800", 30),
    (a.fillStyle = "#fff"),
    a.fillText(e.sub.slice(0, 24), 150, 942),
    (a.fillStyle = n),
    a.fillRect(528, 884, 2, 72),
    s("500", 18),
    (a.fillStyle = "rgba(255,255,255,0.6)"),
    (a.textAlign = "right"),
    a.fillText("SEGUINDO AS REGRAS", 836, 898),
    s("900", 30),
    (a.fillStyle = "#fff"),
    a.fillText(
      e.seq + " dia" + (e.seq === 1 ? "" : "s") + " seguidos",
      836,
      942,
    ),
    (a.textAlign = "left"),
    a.save(),
    (a.strokeStyle = n),
    (a.lineWidth = 4),
    (a.shadowColor = n),
    (a.shadowBlur = 12));
  const v = 880,
    g = 866,
    h = 130,
    b = 24;
  return (
    [
      [v, g, 1, 1],
      [v + h, g, -1, 1],
      [v, g + h, 1, -1],
      [v + h, g + h, -1, -1],
    ].forEach(([y, j, k, A]) => {
      (a.beginPath(),
        a.moveTo(y, j + A * b),
        a.lineTo(y, j),
        a.lineTo(y + k * b, j),
        a.stroke());
    }),
    a.restore(),
    (a.fillStyle = "#fff"),
    l(v + 14, g + 14, h - 28, h - 28, 12),
    a.fill(),
    (a.fillStyle = "#0a0b0c"),
    l(v + 20, g + 20, h - 40, h - 40, 10),
    a.fill(),
    [
      [v + 42, g + 86, g + 64, g + 48],
      [v + 58, g + 78, g + 92, g + 56],
      [v + 74, g + 70, g + 56, g + 42],
      [v + 90, g + 56, g + 74, g + 38],
    ].forEach(([y, j, k, A], C) => {
      ((a.strokeStyle = C % 2 ? "#edece9" : n),
        (a.lineWidth = 2.5),
        a.beginPath(),
        a.moveTo(y, A),
        a.lineTo(y, Math.max(j, k) + 8),
        a.stroke(),
        (a.fillStyle = a.strokeStyle),
        a.fillRect(y - 5, Math.min(j, k), 10, Math.abs(j - k) + 4));
    }),
    (a.fillStyle = n),
    a.fillRect(150, 1032, 180, 1.5),
    a.fillRect(750, 1032, 180, 1.5),
    s("500", 17),
    (a.fillStyle = "rgba(255,255,255,0.7)"),
    (a.textAlign = "center"),
    a.fillText(
      "G R A N D E S   R E S U L T A D O S   V Ê M   D E   G R A N D E S   H Á B I T O S",
      1080 / 2,
      1038,
    ),
    (a.textAlign = "left"),
    await new Promise((y) => t.toBlob((j) => y(j), "image/png"))
  );
}
{
  const e = shrAbre;
  shrAbre = async function (t) {
    if (!String(t).startsWith("per:")) return e.apply(this, arguments);
    const a = String(t).slice(4),
      o = perDados(a);
    SHR.id = t;
    let s = document.getElementById("shrov");
    (s ||
      ((s = document.createElement("div")),
      (s.id = "shrov"),
      (s.className = "ov"),
      document.body.appendChild(s)),
      (document.body.style.overflow = "hidden"),
      (s.innerHTML =
        '<div class="sh" style="max-width:520px;margin:auto"><div class="top"><b>Imagem do período</b><button class="x" data-shrx="1">✕</button></div><div class="sm mut" style="margin:8px 0">Gerando…</div></div>'));
    try {
      const n = await shrGeraPer(o);
      (SHR.url && URL.revokeObjectURL(SHR.url),
        (SHR.blob = n),
        (SHR.url = URL.createObjectURL(n)),
        (s.innerHTML = `<div class="sh" style="max-width:520px;margin:auto"><div class="top"><b>Imagem do período</b><button class="x" data-shrx="1">✕</button></div><div class="seg" style="margin-top:8px">${[
          ["d", "Hoje"],
          ["w", "Semana"],
          ["m", "Mês"],
          ["pm", "Mês passado"],
        ]
          .map(
            ([r, i]) =>
              `<button class="${r === a ? "on" : ""}" data-shr="per:${r}">${i}</button>`,
          )
          .join(
            "",
          )}</div><img src="${SHR.url}" alt="Resultado do período" style="width:100%;border-radius:16px;margin:10px 0;display:block">
<label class="ck"><input type="checkbox" data-shrrs="1"${SHR.rs ? " checked" : ""}><span>Mostrar o resultado em dinheiro</span></label><div class="g2" style="margin-top:10px"><button class="btn" data-shrgo="share">Compartilhar</button><a class="btn s" href="${SHR.url}" download="resultado-${a}.png" style="text-align:center">Salvar imagem</a></div>${o.M.n ? "" : '<div class="sm mut" style="margin-top:6px">Sem operações encerradas neste período.</div>'}</div>`));
    } catch (n) {
      s.innerHTML = `<div class="sh"><div class="top"><b>Imagem</b><button class="x" data-shrx="1">✕</button></div><div class="sm r">Não consegui gerar: ${esc(String(n.message || n))}</div></div>`;
    }
  };
}
var EQ = {
  p: (() => {
    try {
      return ls.get("diario-eq-p") || "90";
    } catch {
      return "90";
    }
  })(),
};
function eqHtml() {
  const e = eqDias(),
    t = Object.keys(e).sort();
  if (t.length < 2) return "";
  const a = +capRef() || 0,
    o = ymd(new Date()),
    s = EQ.p === "all" ? t[0] : addD(o, -+EQ.p);
  let n = 0;
  const r = [];
  if (
    (t.forEach((se) => {
      ((n += e[se]), se >= s && r.push([se, n]));
    }),
    r.length < 2)
  )
    return "";
  const i = a > 0 ? a : 0,
    l = r.map((se) => se[1] + i);
  let d = -1 / 0,
    c = 0,
    p = 0,
    u = 0;
  const m = l.map(
    (se, Ie) => (se > d && ((d = se), (u = Ie)), (c = Math.min(c, se - d)), d),
  );
  p = l[l.length - 1] - d;
  const f = 340,
    x = 130,
    v = 6,
    g = Math.max(...m),
    h = Math.min(...l),
    b = g - h || 1,
    y = (se) => v + ((g - se) / b) * (x - 2 * v),
    j = (se) => (se / (l.length - 1)) * f,
    k = l
      .map(
        (se, Ie) =>
          (Ie ? "L" : "M") + j(Ie).toFixed(1) + " " + y(se).toFixed(1),
      )
      .join(""),
    A = k + `L${f} ${x}L0 ${x}Z`,
    C =
      m
        .map(
          (se, Ie) =>
            (Ie ? "L" : "M") + j(Ie).toFixed(1) + " " + y(se).toFixed(1),
        )
        .join("") +
      l
        .slice()
        .reverse()
        .map(
          (se, Ie) =>
            "L" + j(l.length - 1 - Ie).toFixed(1) + " " + y(se).toFixed(1),
        )
        .join("") +
      "Z",
    I = l[l.length - 1] >= l[0],
    J = l[l.length - 1] - l[0];
  return `<div class="card" id="eqc"><div class="top"><b>📈 Curva de patrimônio</b><div class="hub2" style="margin:0">${[
    ["30", "30d"],
    ["90", "90d"],
    ["all", "Tudo"],
  ]
    .map(
      ([se, Ie]) =>
        `<button class="${EQ.p === se ? "on" : ""}" data-eqp="${se}" style="padding:4px 10px">${Ie}</button>`,
    )
    .join("")}</div></div>
<svg viewBox="0 0 ${f} ${x}" style="width:100%;height:auto;margin-top:6px" role="img" aria-label="Curva de patrimônio"><defs><linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${I ? "#37a66f" : "#e86854"}" stop-opacity=".35"/><stop offset="1" stop-color="${I ? "#37a66f" : "#e86854"}" stop-opacity="0"/></linearGradient></defs>
<path d="${A}" fill="url(#eqg)"/><path d="${C}" fill="#e86854" opacity=".22"/><path d="${k}" fill="none" stroke="${I ? "#37a66f" : "#e86854"}" stroke-width="2.2"/><circle cx="${j(u)}" cy="${y(l[u])}" r="4" fill="#bb8e3b"/></svg>
<div class="g3" style="gap:6px;margin-top:6px;text-align:center"><div><div class="sm mut">No período</div><b class="${cls(J)}">${money(J)}</b></div><div><div class="sm mut">Maior queda</div><b class="r">${money(c)}</b></div><div><div class="sm mut">Do recorde</div><b class="${p < 0 ? "r" : "g"}">${p < 0 ? money(p) : "🏆 no topo"}</b></div></div>
<div class="sm mut" style="margin-top:4px">${a > 0 ? "Saldo = capital " + money(a) + " + resultados (B3 e Forex em reais)." : "Resultado acumulado (defina o capital para ver o saldo)."} Vermelho: distância do topo anterior. Ponto dourado: recorde.</div></div>`;
}
