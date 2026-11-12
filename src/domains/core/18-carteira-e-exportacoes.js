const RP_COR = {
    tx: "#17191b",
    mut: "#6b7280",
    bd: "#eae9e6",
    bg: "#efeeeb",
    ac: "#3b3e43",
    dk: "#141517",
    g: "#2e8a5c",
    r: "#d04e3a",
    am: "#a98136",
    bl: "#588bb8",
    wh: "#ffffff",
    g2: "#eeedea",
    r2: "#fbe8e5",
    am2: "#dfc79a",
    bl2: "#eeedeb",
    cz: "#f6f5f3",
    li: "#66cc99",
    li2: "#b3b6bd",
  },
  RP_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function rpTx(e) {
  if (e == null) return "";
  ((e = String(e)),
    (e = e
      .replace(/[\u202F\u2009\u2007\u200B]/g, " ")
      .replace(/\u221a/g, "raiz")
      .replace(/[\u2212\u2012]/g, "-")
      .replace(/\u2192/g, "->")
      .replace(/\u2190/g, "<-")
      .replace(/\u2191/g, "(sobe)")
      .replace(/\u2193/g, "(cai)")
      .replace(/\u2265/g, ">=")
      .replace(/\u2264/g, "<=")
      .replace(/\u2248/g, "~")
      .replace(/[\u2713\u2714\u2705]/g, "ok")
      .replace(/[\u2717\u2718\u274c]/g, "x")
      .replace(/[\u25b2]/g, "+")
      .replace(/[\u25bc]/g, "-")
      .replace(/\r/g, "")));
  let t = "";
  for (const a of e) {
    const o = a.codePointAt(0);
    if (
      a ===
      `
`
    ) {
      t += a;
      continue;
    }
    if (a === "	") {
      t += " ";
      continue;
    }
    ((o >= 32 && o < 127) || (o >= 160 && o <= 255) || RP_EXTRA.includes(a)) &&
      (t += a);
  }
  return t.replace(/ {2,}/g, " ");
}
const rpOk = (e) => typeof e == "number" && isFinite(e),
  rpNum = (e, t = 2) =>
    rpOk(+e) && e !== null && e !== ""
      ? (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        })
      : "–",
  rpBRL = (e, t) =>
    rpOk(+e) && e !== null
      ? (t && t !== "BRL" ? (t === "USD" ? "US$ " : t + " ") : "R$ ") +
        rpNum(e, Math.abs(e) >= 1e3 ? 0 : 2)
      : "–",
  rpPct = (e, t = 1) => (rpOk(+e) && e !== null ? rpNum(e, t) + "%" : "–"),
  rpFr = (e, t = 1) => (rpOk(+e) && e !== null ? rpNum(e * 100, t) + "%" : "–"),
  rpBig = (e) => {
    if (!rpOk(+e) || e === null) return "–";
    const t = Math.abs(e);
    return t >= 1e12
      ? rpNum(e / 1e12, 2) + " tri"
      : t >= 1e9
        ? rpNum(e / 1e9, 1) + " bi"
        : t >= 1e6
          ? rpNum(e / 1e6, 1) + " mi"
          : rpNum(e, 0);
  },
  rpUp = (e) =>
    String(e || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
function rpTexto(e) {
  return e == null || e === ""
    ? []
    : typeof e == "string" || typeof e == "number"
      ? [String(e)]
      : Array.isArray(e)
        ? e.flatMap(rpTexto)
        : typeof e == "object"
          ? Object.entries(e)
              .filter(([, t]) => t != null && t !== "")
              .map(
                ([t, a]) =>
                  rpRotulo(t) +
                  ": " +
                  (typeof a == "object" ? rpTexto(a).join(" · ") : a),
              )
          : [];
}
function rpRotulo(e) {
  const t = {
    ultimo_balanco: "Último balanço",
    noticias_relevantes: "Notícias relevantes",
    preco_alvo: "Preço-alvo",
    preco_alvo_origem: "Origem do preço-alvo",
    risco_retorno: "Risco/retorno",
    invalidacao: "Invalidação",
    alvo_1: "Alvo 1",
    alvo_2: "Alvo 2",
    leitura_top_down: "Leitura top-down",
    diario: "Diário",
    acao_sugerida: "Ação sugerida",
  };
  if (t[e]) return t[e];
  const a = String(e).replace(/_/g, " ");
  return a.charAt(0).toUpperCase() + a.slice(1);
}
async function rpLib() {
  if (window.PDFLib) return window.PDFLib;
  if (
    (await new Promise((e, t) => {
      const a = document.createElement("script");
      ((a.src = "pdf-lib.min.js"),
        (a.onload = e),
        (a.onerror = () =>
          t(
            new Error(
              "Não consegui carregar o gerador de PDF (pdf-lib.min.js). Confira se o arquivo foi enviado ao GitHub junto com o app.js.",
            ),
          )),
        document.head.appendChild(a));
    }),
    !window.PDFLib)
  )
    throw new Error("O gerador de PDF não iniciou.");
  return window.PDFLib;
}
async function rpNovo(...args) {
  await DiarioChunks.load("pdf-documentos.js");
  return DiarioChunks.functions.rpNovo.apply(this, args);
}
function rpRodape(e) {
  const t = e.doc.getPages(),
    a = t.length;
  t.forEach((o, s) => {
    ((e.pg = o),
      e.ln(e.M, e.H - 40, e.W - e.M, e.H - 40, { c: e.C.bd, w: 0.7 }),
      e.t(
        "Conteúdo gerado por IA a partir de dados de terceiros (com atraso) e pode conter erros. Não é recomendação de investimento.",
        e.M,
        e.H - 32,
        { s: 6.8, c: e.C.mut, w: e.CW - 70 },
      ),
      e.t(`Página ${s + 1} de ${a}`, e.W - e.M, e.H - 32, {
        s: 7.2,
        f: "b",
        c: e.C.mut,
        al: "r",
      }));
  });
}
function rpCapa(e, t) {
  const { C: a, M: o, W: s } = e,
    n = 138;
  (e.rect(0, 0, s, n, { fill: a.dk }),
    e.rect(0, n - 3, s, 3, { fill: a.ac }),
    e.rr(o, 26, 30, 30, { fill: a.ac, r: 8 }),
    e.path("M 7 21 L 13 15 L 17 18 L 24 9", o, 26, { stroke: a.wh, bw: 2.4 }),
    e.circ(o + 24, 35, 2.2, { fill: a.wh }),
    e.assetLogo &&
      e.pg.drawImage(e.assetLogo, {
        x: o + 3,
        y: e.H - 58,
        width: 24,
        height: 24,
      }),
    e.t("DIÁRIO DE TRADER", o + 40, 29, { s: 8.5, f: "b", c: a.li }),
    e.t(t.tipo, o + 40, 42, { s: 10.5, c: a.wh }),
    e.t(t.titulo, o, 70, { s: 30, f: "b", c: a.wh, w: s - 2 * o - 170 }),
    t.sub && e.t(t.sub, o, 106, { s: 9.5, c: a.li2, w: s - 2 * o - 170 }));
  const r = s - o;
  if (t.rec) {
    const i = t.recCor || a.am;
    e.pill(t.rec, r, 30, { s: 10, bg: i, c: a.wh, al: "r" });
  }
  (t.preco && e.t(t.preco, r, 64, { s: 20, f: "b", c: a.wh, al: "r" }),
    t.precoSub && e.t(t.precoSub, r, 90, { s: 8, c: a.li2, al: "r" }),
    e.t(t.data, r, 108, { s: 8, c: a.li2, al: "r" }),
    (e.y = n + 18));
}
const rpRecCor = (e, t) => {
  const a = rpUp(t);
  return /COMPRA|ALTA|BARATO/.test(a)
    ? e.C.g
    : /VEND|BAIXA|REDUZ|CARO/.test(a)
      ? e.C.r
      : e.C.am;
};
function rpRegua(e, t) {
  const { C: a, M: o } = e,
    s = 150;
  e.need(s + 10);
  const n = e.y,
    r = o + 8,
    i = o + e.CW - 8,
    l = t.refs.filter((y) => rpOk(y.v) && y.v > 0),
    d = [t.preco, ...l.map((y) => y.v)].filter(rpOk);
  if (d.length < 2) return;
  let c = Math.min(...d),
    p = Math.max(...d);
  const u = (p - c) * 0.12 || p * 0.1;
  ((c = Math.max(0, c - u)), (p += u));
  const m = (y) => r + ((y - c) / (p - c)) * (i - r),
    f = n + 78;
  if (
    (e.rr(o, n, e.CW, s, { fill: a.wh, stroke: a.bd, r: 8 }),
    rpOk(t.teto) && rpOk(t.justo))
  ) {
    const y = m(c),
      j = m(Math.max(c, t.teto)),
      k = m(Math.min(p, t.justo)),
      A = m(p);
    (e.rect(y, f - 9, j - y, 18, { fill: a.g2 }),
      e.rect(j, f - 9, k - j, 18, { fill: a.am2 }),
      e.rect(k, f - 9, A - k, 18, { fill: a.r2 }));
    let C = r + 60;
    [
      [a.g2, a.g, "zona de compra (até o preço-teto)"],
      [a.am2, a.am, "manter (entre teto e justo)"],
      [a.r2, a.r, "caro (acima do justo)"],
    ].forEach(([I, J, se]) => {
      (e.rect(C, n + s - 15, 9, 9, { fill: I, stroke: J, bw: 0.6 }),
        e.t(se, C + 13, n + s - 14, { s: 6.9, c: a.tx }),
        (C += e.wd(se, 6.9) + 28));
    });
  } else e.rect(r, f - 2, i - r, 4, { fill: a.cz });
  const x = l.slice().sort((y, j) => y.v - j.v),
    v = [-1e9, -1e9, -1e9];
  x.forEach((y) => {
    const j = m(y.v),
      k = `${y.l} ${rpNum(y.v, 2)}`,
      A = e.wd(k, 7.4, "b") + 6;
    let C = 0;
    for (; C < 2 && j - A / 2 < v[C]; ) C++;
    v[C] = j + A / 2;
    const I = f + 16 + C * 16;
    (e.ln(j, f + 9, j, I - 1, { c: y.c || a.mut, w: 0.7, dash: [1.5, 1.5] }),
      e.circ(j, f, 4, { fill: y.c || a.mut, stroke: a.wh, bw: 1.2 }),
      e.t(k, Math.min(i - A / 2, Math.max(r + A / 2, j)), I, {
        s: 7.4,
        f: "b",
        c: y.c || a.mut,
        al: "c",
      }));
  });
  const g = m(t.preco);
  (e.path("M -6 0 L 6 0 L 0 8 Z", g, f - 20, { fill: a.dk }),
    e.ln(g, f - 12, g, f + 9, { c: a.dk, w: 1.6 }));
  const h = `Preço atual ${rpNum(t.preco, 2)}`,
    b = e.wd(h, 8.6, "b") + 14;
  (e.rr(Math.min(i - b, Math.max(r, g - b / 2)), f - 44, b, 17, {
    fill: a.dk,
    r: 8.5,
  }),
    e.t(h, Math.min(i - b, Math.max(r, g - b / 2)) + b / 2, f - 40, {
      s: 8.6,
      f: "b",
      c: a.wh,
      al: "c",
    }),
    e.t(rpNum(c, 2), r, n + s - 14, { s: 6.8, c: a.mut }),
    e.t(rpNum(p, 2), i, n + s - 14, { s: 6.8, c: a.mut, al: "r" }),
    (e.y = n + s + 6),
    e.nota(t.nota));
}
function rpBarras(e, t) {
  const { C: a, M: o } = e,
    s = t.itens.filter((g) => rpOk(g.v));
  if (!s.length) return;
  const n = t.lw || 130,
    r = 13,
    i = 9,
    l = 26 + s.length * (r + i) + (t.ref ? 14 : 0);
  e.need(l + 8);
  const d = e.y;
  e.rr(o, d, e.CW, l, { fill: a.wh, stroke: a.bd, r: 8 });
  const c = o + n,
    p = o + e.CW - 58;
  let u = Math.min(0, ...s.map((g) => g.v), t.ref ? t.ref.v : 0),
    m = Math.max(0, ...s.map((g) => g.v), t.ref ? t.ref.v : 0, t.max || 0);
  (m === u && (m = u + 1), (m += (m - u) * 0.04));
  const f = (g) => c + ((g - u) / (m - u)) * (p - c),
    x = f(0);
  let v = d + 16;
  if (
    (s.forEach((g) => {
      e.t(g.l, o + 12, v + 2, { s: 8.6, f: "b", c: a.tx, w: n - 18 });
      const h = f(Math.min(0, g.v)),
        b = f(Math.max(0, g.v));
      (e.rr(h, v, Math.max(1.5, b - h), r, {
        fill: g.c || (g.v < 0 ? a.r : a.ac),
        r: 3,
      }),
        e.t(
          g.txt || (t.un === "%" ? rpPct(g.v) : rpNum(g.v, 2)),
          b + 5,
          v + 2.5,
          { s: 8.4, f: "b", c: g.v < 0 ? a.r : a.tx },
        ),
        (v += r + i));
    }),
    u < 0 && e.ln(x, d + 10, x, v - 4, { c: a.mut, w: 0.6 }),
    t.ref && rpOk(t.ref.v))
  ) {
    const g = f(t.ref.v);
    (e.ln(g, d + 10, g, v, { c: a.r, w: 1.2, dash: [3, 2] }),
      e.t(t.ref.l, g, v + 1, { s: 7.6, f: "b", c: a.r, al: "c" }));
  }
  ((e.y = d + l + 6), e.nota(t.nota));
}
function rpCenarios(e, t) {
  const { C: a, M: o } = e,
    s = t.cen.filter((h) => rpOk(h.preco));
  if (!s.length) return;
  const n = 190;
  e.need(n + 8);
  const r = e.y;
  e.rr(o, r, e.CW, n, { fill: a.wh, stroke: a.bd, r: 8 });
  const i = [...s.map((h) => h.preco), t.preco, t.justo].filter(rpOk);
  let l = Math.min(...i) * 0.75,
    d = Math.max(...i) * 1.08;
  const c = r + n - 34,
    p = r + 20,
    u = (h) => c - ((h - l) / (d - l)) * (c - p),
    m = o + 46,
    f = o + e.CW - 90,
    x = Math.min(70, ((f - m) / s.length) * 0.5);
  for (let h = 0; h <= 4; h++) {
    const b = l + ((d - l) * h) / 4,
      y = u(b);
    (e.ln(m, y, f, y, { c: a.cz, w: 0.6 }),
      e.t(rpNum(b, 2), m - 6, y - 3.5, { s: 6.8, c: a.mut, al: "r" }));
  }
  s.forEach((h, b) => {
    const y = m + ((b + 0.5) * (f - m)) / s.length,
      j = u(h.preco);
    (e.rr(y - x / 2, j, x, c - j, { fill: h.c || a.ac, r: 4 }),
      e.t(rpNum(h.preco, 2), y, j - 13, { s: 9, f: "b", c: a.tx, al: "c" }),
      rpOk(h.prob) &&
        e.t(rpNum(h.prob, 0) + "%", y, c - 16, {
          s: 9,
          f: "b",
          c: a.wh,
          al: "c",
        }),
      e.t(h.nome, y, c + 7, { s: 8.6, f: "b", c: h.c || a.tx, al: "c" }),
      rpOk(h.prob) &&
        e.t("probabilidade", y, c + 18, { s: 6.6, c: a.mut, al: "c" }));
  });
  const v = [],
    g = (h, b, y, j) => {
      if (!rpOk(h)) return;
      const k = u(h);
      e.ln(m, k, f + 4, k, { c: y, w: 1.3, dash: j });
      let A = k - 8;
      for (; v.some((C) => Math.abs(C - A) < 20); )
        A += (A < k ? -1 : 1) * 0 + 20;
      (v.push(A),
        e.t(b, f + 8, A, { s: 7, f: "b", c: y }),
        e.t(rpNum(h, 2), f + 8, A + 9, { s: 8, f: "b", c: y }));
    };
  ([
    [t.justo, "Preço justo", a.bl],
    [t.preco, "Preço atual", a.dk, [3, 2]],
  ]
    .filter((h) => rpOk(h[0]))
    .sort((h, b) => b[0] - h[0])
    .forEach((h) => g(...h)),
    (e.y = r + n + 6),
    e.nota(t.nota));
}
function rpEmpilhada(e, t) {
  const { C: a, M: o } = e,
    s = t.partes.reduce((c, p) => c + (p.n || 0), 0);
  if (!s) return;
  const n = 58;
  e.need(n + 8);
  const r = e.y;
  e.rr(o, r, e.CW, n, { fill: a.wh, stroke: a.bd, r: 8 });
  let i = o + 12;
  const l = e.CW - 24;
  t.partes.forEach((c) => {
    const p = (l * (c.n || 0)) / s;
    (p > 0 &&
      (e.rect(i, r + 14, p, 14, { fill: c.c }),
      p > 26 &&
        e.t(String(c.n), i + p / 2, r + 17, {
          s: 8,
          f: "b",
          c: a.wh,
          al: "c",
        })),
      (i += p));
  });
  let d = o + 12;
  (t.partes.forEach((c) => {
    e.rect(d, r + 38, 8, 8, { fill: c.c });
    const p = `${c.l}: ${c.n || 0} (${rpNum(((c.n || 0) / s) * 100, 0)}%)`;
    (e.t(p, d + 12, r + 38, { s: 8, c: a.tx }), (d += e.wd(p, 8) + 30));
  }),
    (e.y = r + n + 6),
    e.nota(t.nota));
}
function rpFaixa(e, t) {
  if (!rpOk(t.min) || !rpOk(t.max) || !rpOk(t.v) || t.max <= t.min) return;
  const { C: a, M: o } = e,
    s = 58;
  e.need(s + 8);
  const n = e.y;
  e.rr(o, n, e.CW, s, { fill: a.wh, stroke: a.bd, r: 8 });
  const r = o + 70,
    i = o + e.CW - 70,
    l = (u) =>
      r + Math.max(0, Math.min(1, (u - t.min) / (t.max - t.min))) * (i - r),
    d = n + 30;
  ([
    [a.g, 0, 1 / 3],
    [a.am, 1 / 3, 2 / 3],
    [a.r, 2 / 3, 1],
  ].forEach(([u, m, f]) =>
    e.rect(r + (i - r) * m, d - 3, (i - r) * (f - m), 6, { fill: u, op: 0.55 }),
  ),
    e.t("Mínima", o + 12, d - 10, { s: 7, c: a.mut }),
    e.t(rpNum(t.min, 2), o + 12, d + 1, { s: 8.5, f: "b" }),
    e.t("Máxima", o + e.CW - 12, d - 10, { s: 7, c: a.mut, al: "r" }),
    e.t(rpNum(t.max, 2), o + e.CW - 12, d + 1, { s: 8.5, f: "b", al: "r" }));
  const c = l(t.v);
  e.circ(c, d, 6.5, { fill: a.dk, stroke: a.wh, bw: 1.5 });
  const p = ((t.v - t.min) / (t.max - t.min)) * 100;
  (e.t(
    `${t.l || "Preço"} ${rpNum(t.v, 2)} · ${rpNum(p, 0)}% da faixa`,
    c,
    d + 11,
    { s: 7.8, f: "b", c: a.dk, al: "c" },
  ),
    (e.y = n + s + 6),
    e.nota(t.nota));
}
function rpMatriz(e, t) {
  const { C: a, M: o } = e,
    s = t.filter((g) => g && g.risco);
  if (!s.length) return;
  const n = (g) => {
      const h = rpUp(g);
      return /ALT/.test(h) ? 2 : /MED/.test(h) ? 1 : /BAIX/.test(h) ? 0 : 1;
    },
    r = 34,
    i = o + 44,
    l = Math.max(3 * r + 44, 0),
    d = s.map((g, h) => ({
      i: h,
      ls: e.wrap(`${h + 1}. ${g.risco}`, e.CW - 3 * r - 90, 8.6),
    })),
    c = d.reduce((g, h) => g + h.ls.length * 12 + 4, 0),
    p = Math.max(l, c + 20);
  e.need(p + 8);
  const u = e.y;
  e.rr(o, u, e.CW, p, { fill: a.wh, stroke: a.bd, r: 8 });
  const m = [
    [a.g2, a.am2, a.am2],
    [a.g2, a.am2, a.r2],
    [a.am2, a.r2, a.r2],
  ];
  for (let g = 0; g < 3; g++)
    for (let h = 0; h < 3; h++)
      e.rect(i + h * r, u + 12 + (2 - g) * r, r - 2, r - 2, { fill: m[g][h] });
  (["Alta", "Média", "Baixa"].forEach((g, h) =>
    e.t(g, i - 5, u + 12 + h * r + r / 2 - 5, { s: 6.8, c: a.mut, al: "r" }),
  ),
    ["Baixo", "Médio", "Alto"].forEach((g, h) =>
      e.t(g, i + h * r + r / 2 - 1, u + 14 + 3 * r, {
        s: 6.8,
        c: a.mut,
        al: "c",
      }),
    ),
    e.t("probabilidade", o + 8, u + 8, { s: 6.4, f: "b", c: a.mut }),
    e.t("impacto", i + 1.5 * r, u + 26 + 3 * r, {
      s: 6.4,
      f: "b",
      c: a.mut,
      al: "c",
    }));
  const f = {};
  s.forEach((g, h) => {
    const b = n(g.probabilidade),
      y = n(g.impacto),
      j = b + "-" + y,
      k = (f[j] = (f[j] || 0) + 1),
      A = i + y * r + r / 2 - 1 + (k - 1) * 9 - 4 * (k > 1),
      C = u + 12 + (2 - b) * r + r / 2 - 1;
    (e.circ(A, C, 7, { fill: a.dk }),
      e.t(String(h + 1), A, C - 3.6, { s: 7.6, f: "b", c: a.wh, al: "c" }));
  });
  let x = u + 14;
  const v = i + 3 * r + 24;
  (d.forEach((g) => {
    (g.ls.forEach((h) => {
      (e.t(h, v, x, { s: 8.6 }), (x += 12));
    }),
      (x += 4));
  }),
    (e.y = u + p + 8));
}
function rpLinha(e, t) {
  const { C: a, M: o } = e,
    s = t.serie.filter((k) => rpOk(k.c));
  if (s.length < 5) return;
  const n = 210;
  e.need(n + 8);
  const r = e.y;
  e.rr(o, r, e.CW, n, { fill: a.wh, stroke: a.bd, r: 8 });
  const i = o + 40,
    l = o + e.CW - 96,
    d = r + 16,
    c = r + n - 28,
    p = s.map((k) => k.c);
  let u = Math.min(...p),
    m = Math.max(...p);
  const f = m - u || m * 0.05,
    x = (t.niveis || []).filter(
      (k) => rpOk(k.v) && k.v > u - f * 0.6 && k.v < m + f * 0.6,
    );
  x.forEach((k) => {
    ((u = Math.min(u, k.v)), (m = Math.max(m, k.v)));
  });
  const v = (m - u) * 0.06;
  ((u -= v), (m += v));
  const g = (k) => i + (k / (s.length - 1)) * (l - i),
    h = (k) => c - ((k - u) / (m - u)) * (c - d);
  for (let k = 0; k <= 4; k++) {
    const A = u + ((m - u) * k) / 4;
    (e.ln(i, h(A), l, h(A), { c: a.cz, w: 0.6 }),
      e.t(rpNum(A, 2), i - 5, h(A) - 3.5, { s: 6.6, c: a.mut, al: "r" }));
  }
  const b = (k, A, C) => {
    let I = "";
    (k.forEach((J, se) => {
      if (!rpOk(J)) return;
      const Ie = g(se) - i,
        Pe = h(J) - d;
      I += (I ? " L " : "M ") + Ie.toFixed(1) + " " + Pe.toFixed(1);
    }),
      I && e.path(I, i, d, { stroke: A, bw: C }));
  };
  ((t.medias || []).forEach((k) => b(k.vals, k.c, 1.1)), b(p, a.dk, 1.7));
  const y = [];
  x.forEach((k) => {
    const A = h(k.v);
    e.ln(i, A, l, A, { c: k.c, w: 0.9, dash: [3, 2] });
    let C = A - 4;
    for (; y.some((I) => Math.abs(I - C) < 9); ) C += 9;
    (y.push(C),
      e.t(`${k.l} ${rpNum(k.v, 2)}`, l + 5, C, {
        s: 6.9,
        f: "b",
        c: k.c,
        w: 90,
      }));
  });
  let j = i;
  ([{ l: "Preço", c: a.dk }, ...(t.medias || [])].forEach((k) => {
    (e.rect(j, c + 12, 10, 2.5, { fill: k.c }),
      e.t(k.l, j + 14, c + 9, { s: 7, c: a.tx }),
      (j += e.wd(k.l, 7) + 30));
  }),
    s[0].d && e.t(s[0].d, i, c + 3, { s: 6.4, c: a.mut }),
    s[s.length - 1].d &&
      e.t(s[s.length - 1].d, l, c + 3, { s: 6.4, c: a.mut, al: "r" }),
    (e.y = r + n + 6),
    e.nota(t.nota));
}
function rpPlano(e, t) {
  const { C: a, M: o } = e;
  if (![t.entrada, t.stop, t.alvo1].every(rpOk)) return;
  const s = 70;
  e.need(s + 8);
  const n = e.y;
  e.rr(o, n, e.CW, s, { fill: a.wh, stroke: a.bd, r: 8 });
  const r = [t.stop, t.entrada, t.alvo1, t.alvo2].filter(rpOk),
    i = Math.min(...r),
    l = Math.max(...r),
    d = o + 20,
    c = o + e.CW - 20,
    p = (x) => d + ((x - i) / (l - i || 1)) * (c - d),
    u = n + 34;
  (e.t(t.titulo, o + 12, n + 9, { s: 9, f: "b", c: a.dk }),
    t.selo &&
      e.pill(t.selo, o + e.CW - 12, n + 6, {
        s: 7.4,
        bg: t.seloOk ? a.g2 : a.am2,
        c: t.seloOk ? a.g : a.am,
        al: "r",
      }));
  const m = (x, v, g) => {
    const h = p(Math.min(x, v)),
      b = p(Math.max(x, v));
    e.rect(h, u - 5, Math.max(1, b - h), 10, { fill: g });
  };
  (m(t.stop, t.entrada, a.r),
    m(t.entrada, t.alvo1, a.g),
    rpOk(t.alvo2) && m(t.alvo1, t.alvo2, a.g2));
  const f = (x, v, g) => {
    if (!rpOk(x)) return;
    const h = p(x);
    (e.ln(h, u - 9, h, u + 9, { c: g, w: 1.6 }),
      e.t(v, h, u + 12, { s: 7.2, f: "b", c: g, al: "c" }),
      e.t(rpNum(x, 2), h, u + 21, { s: 7.6, c: a.tx, al: "c" }));
  };
  (f(t.stop, "Stop", a.r),
    f(t.entrada, "Entrada", a.dk),
    f(t.alvo1, "Alvo 1", a.g),
    f(t.alvo2, "Alvo 2", a.g),
    (e.y = n + s + 6),
    e.nota(t.nota));
}
const RP_OURO = "#b88c3a",
  RP_AZUL = "#36383e";
function rpChecklist(e, t) {
  const { C: a, M: o } = e,
    s = (t && t.itens) || [];
  if (!s.length) return;
  const n = e.hex(RP_OURO);
  e.need(40);
  const r = e.y;
  (e.rr(o, r, e.CW, 28, { fill: a.dk, r: 7 }),
    e.t("Pontuação", o + 12, r + 9, { s: 9, f: "b", c: a.li }),
    e.t(`${t.pontos} de ${s.length} critérios atendidos`, o + 70, r + 8, {
      s: 10.5,
      f: "b",
      c: a.wh,
    }));
  const i = 150,
    l = o + e.CW - i - 12,
    d = t.pontos / s.length;
  (e.rect(l, r + 11, i, 6, { fill: e.hex("#3c3f45") }),
    e.rect(l, r + 11, i * d, 6, {
      fill:
        d >= 0.66
          ? e.hex("#c19646")
          : d >= 0.4
            ? e.hex("#c9a156")
            : e.hex("#ed8b7c"),
    }),
    (e.y += 36),
    s.forEach((c, p) => {
      const u = e.wrap(c.criterio, e.CW - 170, 9.4, "b"),
        m = Math.max(30, u.length * 12 + 12);
      e.need(m);
      const f = e.y;
      p % 2 && e.rect(o, f, e.CW, m, { fill: a.cz });
      const x = o + 10,
        v = f + m / 2 - 7;
      (c.ok === !0
        ? (e.rr(x, v, 14, 14, { fill: n, r: 2.5 }),
          e.path("M 3 7 L 6 10 L 11 4", x, v, { stroke: a.wh, bw: 1.8 }))
        : c.ok === !1
          ? e.rr(x, v, 14, 14, {
              fill: a.wh,
              stroke: e.hex("#c9cdd3"),
              bw: 1,
              r: 2.5,
            })
          : (e.rr(x, v, 14, 14, {
              fill: a.cz,
              stroke: e.hex("#c9cdd3"),
              bw: 1,
              r: 2.5,
            }),
            e.t("?", x + 7, v + 2.5, { s: 8.5, f: "b", c: a.mut, al: "c" })),
        u.forEach((h, b) =>
          e.t(h, o + 34, f + (m - u.length * 12) / 2 + 1 + b * 12, {
            s: 9.4,
            f: "b",
            c: c.ok === !1 ? a.mut : a.tx,
          }),
        ));
      const g = e.wrap(c.valor, 140, 7.8);
      (g
        .slice(0, 2)
        .forEach((h, b) =>
          e.t(
            h,
            o + e.CW - 10,
            f + (m - g.slice(0, 2).length * 10) / 2 + b * 10,
            {
              s: 7.8,
              c: c.ok === !0 ? a.g : c.ok === !1 ? a.r : a.mut,
              al: "r",
            },
          ),
        ),
        e.ln(o, f + m, o + e.CW, f + m, { c: a.bd, w: 0.5 }),
        (e.y += m));
    }),
    (e.y += 6),
    e.nota(
      'Mesmos critérios do checklist Buy and Hold do Investidor10, calculados pelo app com dados do Yahoo Finance. A nota dos usuários do Investidor10 (que só existe lá) foi trocada por margem líquida acima de 10%. Caixa dourada = atende; vazia = não atende; "?" = sem dado.',
    ));
}
function rpColunas(e, t) {
  const { C: a, M: o } = e,
    s = t.cats;
  if (!s.length) return;
  const n = t.series.filter((h) => h.vals.some(rpOk));
  if (!n.length) return;
  const r = t.h || 200;
  e.need(r + 8);
  const i = e.y;
  e.rr(o, i, e.CW, r, { fill: a.wh, stroke: a.bd, r: 8 });
  const l = o + 40,
    d = o + e.CW - 14,
    c = i + (n.length > 1 ? 30 : 22),
    p = i + r - (t.sub ? 40 : 28),
    u = n.flatMap((h) => h.vals).filter(rpOk);
  let m = Math.max(0, ...u),
    f = Math.min(0, ...u);
  (t.media && rpOk(t.media.v) && (m = Math.max(m, t.media.v)),
    m === f && (m = f + 1),
    (m += (m - f) * 0.12));
  const x = (h) => p - ((h - f) / (m - f)) * (p - c);
  for (let h = 0; h <= 4; h++) {
    const b = f + ((m - f) * h) / 4;
    (e.ln(l, x(b), d, x(b), { c: a.cz, w: 0.6 }),
      e.t(t.fmtEixo ? t.fmtEixo(b) : rpNum(b, 1), l - 5, x(b) - 3.5, {
        s: 6.6,
        c: a.mut,
        al: "r",
      }));
  }
  f < 0 && e.ln(l, x(0), d, x(0), { c: a.mut, w: 0.7 });
  const v = (d - l) / s.length,
    g = Math.min(28, (v * 0.7) / n.length);
  if (
    (s.forEach((h, b) => {
      const y = l + v * (b + 0.5);
      (n.forEach((j, k) => {
        const A = j.vals[b];
        if (!rpOk(A)) return;
        const C = y - (g * n.length) / 2 + k * g,
          I = x(Math.max(0, A)),
          J = x(Math.min(0, A)),
          se = typeof j.c == "function" ? j.c(A, b) : j.c;
        (e.rr(C + 1, I, g - 2, Math.max(1, J - I), {
          fill: se,
          r: 2.5,
          op: t.parcial && t.parcial[b] ? 0.55 : void 0,
        }),
          t.rotulo !== !1 &&
            e.t(
              j.fmt ? j.fmt(A) : rpNum(A, 1),
              C + g / 2,
              A >= 0 ? I - 10 : J + 2,
              {
                s: n.length > 1 ? 5.8 : 7,
                f: "b",
                c: A < 0 ? a.r : a.tx,
                al: "c",
              },
            ));
      }),
        e.t(String(h), y, p + 4, { s: 7.4, f: "b", c: a.tx, al: "c" }),
        t.sub &&
          t.sub[b] != null &&
          e.t(t.sub[b], y, p + 15, { s: 6.3, c: a.mut, al: "c" }));
    }),
    t.media && rpOk(t.media.v))
  ) {
    const h = x(t.media.v);
    (e.ln(l, h, d, h, { c: a.am, w: 1.1, dash: [3, 2] }),
      e.t(t.media.l, d - 2, h - 10, { s: 7, f: "b", c: a.am, al: "r" }));
  }
  if (n.length > 1) {
    let h = l;
    n.forEach((b) => {
      (e.rect(h, i + 12, 9, 9, {
        fill: typeof b.c == "function" ? b.c(1, 0) : b.c,
      }),
        e.t(b.l, h + 13, i + 12, { s: 7.6, c: a.tx }),
        (h += e.wd(b.l, 7.6) + 32));
    });
  }
  ((e.y = i + r + 6), e.nota(t.nota));
}
function rpCombo(e, t) {
  const { C: a, M: o } = e,
    s = t.cats.length;
  if (s < 2) return;
  const n = t.h || 215;
  e.need(n + 8);
  const r = e.y;
  e.rr(o, r, e.CW, n, { fill: a.wh, stroke: a.bd, r: 8 });
  const i = o + 40,
    l = o + e.CW - 40,
    d = r + 34,
    c = r + n - 30,
    p = t.barras.vals,
    u = t.linha.vals,
    m = Math.max(...p.filter(rpOk), 0.01) * 1.18,
    f = Math.max(...u.filter(rpOk), 1) * 1.18,
    x = (A) => c - (A / m) * (c - d),
    v = (A) => c - (A / f) * (c - d);
  for (let A = 0; A <= 4; A++) {
    const C = c - ((c - d) * A) / 4;
    (e.ln(i, C, l, C, { c: a.cz, w: 0.6 }),
      e.t(rpNum((m * A) / 4, 2), i - 5, C - 3.5, { s: 6.5, c: a.mut, al: "r" }),
      e.t(rpNum((f * A) / 4, 0) + "%", l + 5, C - 3.5, {
        s: 6.5,
        c: e.hex(RP_OURO),
      }));
  }
  const g = (l - i) / s,
    h = Math.min(26, g * 0.62),
    b = e.hex(RP_AZUL),
    y = e.hex(RP_OURO);
  p.forEach((A, C) => {
    const I = i + g * (C + 0.5);
    if (rpOk(A) && A > 0) {
      const J = x(A);
      (e.rr(I - h / 2, J, h, c - J, {
        fill: b,
        r: 2.5,
        op: t.parcial && t.parcial[C] ? 0.5 : void 0,
      }),
        e.t(rpNum(A, 2), I, J - 9, { s: 6.3, f: "b", c: b, al: "c" }));
    }
    e.t(String(t.cats[C]), I, c + 5, { s: 7.2, f: "b", c: a.tx, al: "c" });
  });
  let j = "";
  (u.forEach((A, C) => {
    if (!rpOk(A)) return;
    const I = i + g * (C + 0.5) - i,
      J = v(A) - d;
    j += (j ? " L " : "M ") + I.toFixed(1) + " " + J.toFixed(1);
  }),
    j && e.path(j, i, d, { stroke: y, bw: 1.8 }),
    u.forEach((A, C) => {
      if (!rpOk(A)) return;
      const I = i + g * (C + 0.5),
        J = v(A);
      (e.circ(I, J, 3, { fill: y, stroke: a.wh, bw: 1 }),
        e.t(rpNum(A, 1) + "%", I, J - 12, {
          s: 6.6,
          f: "b",
          c: e.hex("#836329"),
          al: "c",
        }));
    }),
    e.rect(i, r + 13, 9, 9, { fill: b }),
    e.t(t.barras.l, i + 13, r + 13, { s: 7.6 }));
  const k = i + e.wd(t.barras.l, 7.6) + 34;
  (e.ln(k, r + 17.5, k + 14, r + 17.5, { c: y, w: 1.8 }),
    e.circ(k + 7, r + 17.5, 2.6, { fill: y }),
    e.t(t.linha.l, k + 19, r + 13, { s: 7.6 }),
    (e.y = r + n + 6),
    e.nota(t.nota));
}
function rpMulti(e, t) {
  const { C: a, M: o } = e,
    s = t.series.filter((y) => y.vals && y.vals.some(rpOk));
  if (!s.length) return;
  const n = t.h || 215;
  e.need(n + 8);
  const r = e.y;
  e.rr(o, r, e.CW, n, { fill: a.wh, stroke: a.bd, r: 8 });
  const i = o + 46,
    l = o + e.CW - 70,
    d = r + 30,
    c = r + n - 26,
    p = t.x.length,
    u = s.flatMap((y) => y.vals).filter(rpOk);
  let m = Math.min(...u),
    f = Math.max(...u);
  const x = (f - m) * 0.08 || 10;
  ((m -= x), (f += x));
  const v = (y) => i + (y / (p - 1)) * (l - i),
    g = (y) => c - ((y - m) / (f - m)) * (c - d);
  for (let y = 0; y <= 4; y++) {
    const j = m + ((f - m) * y) / 4;
    (e.ln(i, g(j), l, g(j), { c: a.cz, w: 0.6 }),
      e.t(rpNum(j, 0), i - 5, g(j) - 3.5, { s: 6.5, c: a.mut, al: "r" }));
  }
  const h = [];
  s.forEach((y) => {
    let j = "";
    (y.vals.forEach((A, C) => {
      rpOk(A) &&
        (j +=
          (j ? " L " : "M ") +
          (v(C) - i).toFixed(1) +
          " " +
          (g(A) - d).toFixed(1));
    }),
      e.path(j, i, d, { stroke: y.c, bw: y.w || 1.3 }));
    const k = [...y.vals].reverse().find(rpOk);
    if (rpOk(k)) {
      let A = g(k) - 4;
      for (; h.some((C) => Math.abs(C - A) < 9); ) A += 9;
      (h.push(A),
        e.t(`${y.l} ${rpNum(k, 0)}`, l + 5, A, {
          s: 6.8,
          f: "b",
          c: y.c,
          w: 66,
        }));
    }
  });
  let b = i;
  (s.forEach((y) => {
    (e.rect(b, r + 12, 10, 3, { fill: y.c }),
      e.t(y.l, b + 14, r + 9.5, { s: 7.4 }),
      (b += e.wd(y.l, 7.4) + 30));
  }),
    [0, Math.floor((p - 1) / 2), p - 1].forEach((y, j) =>
      e.t(String(t.x[y]).split("-").reverse().join("/"), v(y), c + 5, {
        s: 6.5,
        c: a.mut,
        al: j === 0 ? "l" : j === 2 ? "r" : "c",
      }),
    ),
    (e.y = r + n + 6),
    e.nota(t.nota));
}
function rpFun(e, t, a) {
  const { C: o } = e,
    s = t.relatorio || {},
    n = Array.isArray(t.ativos) ? t.ativos : [],
    r = Array.isArray(s.ativos) ? s.ativos : [],
    i = (j) => r.find((k) => rpUp(k.ticker) === rpUp(j)) || {},
    l = n.length === 1,
    d = t.macro || {},
    c = n[0] || {},
    p = c.fund || {},
    u = i(c.tk),
    m = u.decisao || {},
    f = s.conclusao || {},
    x = c.hist || {},
    v = f.recomendacao || m.zona || "",
    g = c.mk === "US" ? "USD" : "BRL";
  if (
    (rpCapa(e, {
      tipo: "Relatório fundamentalista",
      titulo: l ? c.tk : "Carteira " + (a.mk || ""),
      sub: l
        ? [p.nome, p.setor, p.industria].filter(Boolean).join(" · ")
        : `${n.length} ativos · ${[...new Set(n.map((j) => (j.fund || {}).setor).filter(Boolean))].length} setores`,
      rec: v && "Recomendação: " + v,
      recCor: rpRecCor(e, v),
      preco: l && rpOk(p.preco) ? rpBRL(p.preco, g) : "",
      precoSub: l ? "cotação de referência" : "",
      data: a.data,
    }),
    l)
  ) {
    const j = x.cotacao || [],
      k =
        j.length > 12 && rpOk(j[j.length - 1][1]) && rpOk(j[j.length - 13][1])
          ? (j[j.length - 1][1] / j[j.length - 13][1] - 1) * 100
          : null;
    if (
      (e.kpis(
        [
          {
            l: "VARIAÇÃO (12M)",
            v: rpOk(k) ? (k > 0 ? "+" : "") + rpPct(k, 2) : "–",
            c: rpOk(k) ? (k >= 0 ? o.g : o.r) : void 0,
          },
          { l: "P/L", v: rpNum(p.pl, 2) },
          { l: "P/VP", v: rpNum(p.p_vp, 2) },
          { l: "DY (12M)", v: rpFr(p.dividend_yield, 2) },
        ],
        { h: 46 },
      ),
      rpOk(m.preco_justo))
    ) {
      const A = m.upside_pct;
      e.kpis([
        {
          l: "PREÇO ATUAL",
          v: rpBRL(p.preco, g),
          d: "Cotação usada nos cálculos (com atraso).",
        },
        {
          l: "PREÇO JUSTO",
          v: rpBRL(m.preco_justo, g),
          c: o.bl,
          d: "Média dos cenários ponderada pela probabilidade.",
        },
        {
          l: "COMPRAR ATÉ",
          v: rpBRL(m.preco_teto, g),
          c: o.g,
          d: `Preço justo com ${rpNum(m.margem_pct, 0)}% de margem de segurança.`,
        },
        {
          l: "POTENCIAL",
          v: (A > 0 ? "+" : "") + rpPct(A),
          c: A >= 0 ? o.g : o.r,
          d: "Distância do preço atual até o preço justo.",
        },
      ]);
    }
  }
  const h = rpTexto(s.sumario_executivo);
  (h.length &&
    e.caixa(
      "Sumário executivo",
      h.map((j) => ({ b: j })),
      { barra: o.ac },
    ),
    l && rpMeuPlano(e, t, a, u, !0),
    l ||
      (e.h2("Painel da carteira"),
      e.tab(
        [
          { l: "Ativo", w: 14 },
          { l: "P/L", w: 9, al: "r" },
          { l: "P/VP", w: 9, al: "r" },
          { l: "ROE", w: 10, al: "r" },
          { l: "Marg. líq.", w: 11, al: "r" },
          { l: "DY", w: 9, al: "r" },
          { l: "Checklist", w: 11, al: "r" },
          { l: "Valuation", w: 12 },
        ],
        n.map((j) => {
          const k = j.fund || {},
            A = i(j.tk),
            C = j.hist && j.hist.checklist;
          return [
            { t: j.tk, f: "b" },
            rpNum(k.pl, 1),
            rpNum(k.p_vp, 2),
            rpFr(k.roe),
            rpFr(k.margem_liquida),
            rpFr(k.dividend_yield),
            C ? `${C.pontos}/${C.itens.length}` : "–",
            { t: A.valuation || "–", c: rpRecCor(e, A.valuation) },
          ];
        }),
      ),
      a.pesos &&
        Object.keys(a.pesos).length &&
        rpBarras(e, {
          itens: n
            .map((j) => ({ l: j.tk, v: +a.pesos[j.tk] || 0 }))
            .sort((j, k) => k.v - j.v),
          un: "%",
          nota: "Peso de cada ativo na carteira.",
        }),
      s.visao_geral && (e.h3("Visão geral"), e.para(rpTexto(s.visao_geral))),
      s.concentracao &&
        (e.h3("Concentração"), e.para(rpTexto(s.concentracao)))),
    n.forEach((j) => rpFunAtivo(e, j, i(j.tk), l, d, a)));
  const b =
    typeof s.contexto_macro == "string" &&
    /^\s*sem dado\.?\s*$/i.test(s.contexto_macro)
      ? ""
      : s.contexto_macro;
  d &&
    (rpOk(d.selic_pct) || b) &&
    (e.h2("Contexto macro", null, 72),
    e.kpis(
      [
        {
          l: "SELIC",
          v: rpPct(d.selic_pct, 2),
          d: "Custo de oportunidade: o que a renda fixa paga.",
        },
        {
          l: "IPCA 12 MESES",
          v: rpPct(d.ipca12_pct, 2),
          d: "Inflação acumulada.",
        },
        {
          l: "JURO REAL",
          v: rpPct(d.juro_real_pct, 2),
          d: "Selic descontada a inflação.",
        },
      ],
      { cols: 3 },
    ),
    d.obs && e.nota(d.obs),
    e.para(rpTexto(b)));
  const y = s.resultados_recentes;
  if (y && (y.ultimo_balanco || rpTexto(y.noticias_relevantes).length)) {
    (e.h2("Resultados recentes e notícias", null, 50),
      y.ultimo_balanco &&
        (e.h3("Último balanço"), e.para(rpTexto(y.ultimo_balanco))));
    const j = rpTexto(y.noticias_relevantes);
    j.length && (e.h3("Notícias relevantes"), e.bul(j));
  }
  (rpRiscos(e, s), rpConclusao(e, s, g), rpFim(e, t, s));
}
function rpFunAtivo(e, t, a, o, s, n) {
  const { C: r } = e,
    i = t.fund || {},
    l = a.decisao || {},
    d = t.val || {},
    c = t.hist || {},
    p = t.mk === "US" ? "USD" : "BRL",
    u = p === "BRL" ? "R$ " : "US$ ";
  if (
    (o ||
      (e.add(),
      e.rr(e.M, e.y, e.CW, 44, { fill: r.dk, r: 8 }),
      e.t(t.tk, e.M + 14, e.y + 11, { s: 18, f: "b", c: r.wh }),
      e.t(
        [i.nome, i.setor].filter(Boolean).join(" · "),
        e.M + 14 + e.wd(t.tk, 18, "b") + 12,
        e.y + 17,
        { s: 9, c: r.li2, w: e.CW - 200 },
      ),
      a.valuation &&
        e.pill(String(a.valuation), e.M + e.CW - 12, e.y + 13, {
          s: 8.5,
          bg: rpRecCor(e, a.valuation),
          c: r.wh,
          al: "r",
        }),
      (e.y += 56)),
    a.resumo)
  ) {
    if (
      (e.h2(o ? "Resumo" : "Resumo de " + t.tk, null, 60),
      a.qualidade || a.valuation)
    ) {
      let he = e.M;
      (a.qualidade &&
        (he +=
          e.pill("Qualidade " + a.qualidade, he, e.y, {
            s: 8,
            bg: rpRecCor(
              e,
              a.qualidade === "ALTA"
                ? "COMPRA"
                : a.qualidade === "BAIXA"
                  ? "VENDA"
                  : "",
            ),
            c: r.wh,
          }) + 6),
        a.valuation &&
          e.pill(String(a.valuation), he, e.y, {
            s: 8,
            bg: rpRecCor(e, a.valuation),
            c: r.wh,
          }),
        (e.y += 24));
    }
    e.para(rpTexto(a.resumo));
  }
  const m = c.rentabilidade,
    f = c.indices;
  if (m && Object.values(m).some(rpOk)) {
    e.h2(
      "Rentabilidade",
      "Quanto a ação rendeu em cada período, com os proventos reinvestidos (preço ajustado).",
      130,
    );
    const he = (we) => {
      const Be = m[we];
      return {
        v: rpOk(Be) ? (Be > 0 ? "+" : "") + rpPct(Be, 2) : "–",
        c: rpOk(Be) ? (Be >= 0 ? r.g : r.r) : r.mut,
      };
    };
    (e.kpis(
      [
        ["1 MÊS", "m1"],
        ["3 MESES", "m3"],
        ["1 ANO", "a1"],
      ].map(([we, Be]) => ({ l: we, ...he(Be) })),
      { cols: 3, h: 44, vs: 14 },
    ),
      e.kpis(
        [
          ["2 ANOS", "a2"],
          ["5 ANOS", "a5"],
          ["10 ANOS", "a10"],
        ].map(([we, Be]) => ({ l: we, ...he(Be) })),
        { cols: 3, h: 44, vs: 14 },
      ));
  }
  if (f && f.ativo && f.ativo.length > 12) {
    const he = Math.round((f.meses.length - 1) / 12),
      we = (Be) => Be && [...Be].reverse().find(rpOk);
    (e.h2(
      `Comparação com índices (${he} anos)`,
      `Se você tivesse investido R$ 1.000 em ${t.tk} há ${he} anos (com os proventos reinvestidos), hoje teria ${rpBRL(we(f.ativo), "BRL")}.`,
      225,
    ),
      rpMulti(e, {
        x: f.meses,
        series: [
          { l: t.tk, vals: f.ativo, c: e.hex("#d04e3a"), w: 2 },
          { l: "CDI", vals: f.cdi, c: e.hex(RP_AZUL) },
          { l: "IPCA", vals: f.ipca, c: e.hex("#2f8b5d") },
          { l: f.nome_indice || "Ibovespa", vals: f.ibov, c: e.hex(RP_OURO) },
        ],
        nota: "Valores em R$ a partir de R$ 1.000. CDI e IPCA: Banco Central (taxas mensais acumuladas). Índice e ação: Yahoo Finance.",
      }),
      e.kpis(
        [
          { l: t.tk, v: rpBRL(we(f.ativo), "BRL"), c: e.hex("#d04e3a") },
          { l: "CDI", v: rpBRL(we(f.cdi), "BRL") },
          { l: "IPCA", v: rpBRL(we(f.ipca), "BRL") },
          {
            l: String(f.nome_indice || "IBOVESPA").toUpperCase(),
            v: rpBRL(we(f.ibov), "BRL"),
          },
        ],
        { h: 44, vs: 13 },
      ));
  }
  if (o) {
    const he = [
      { l: "Justo", v: l.preco_justo, c: r.bl },
      { l: "Teto", v: l.preco_teto, c: r.g },
      { l: "Graham", v: d.graham && d.graham.valor, c: e.hex("#9e9789") },
      {
        l: "Bazin",
        v: d.bazin_6pct && d.bazin_6pct.valor,
        c: e.hex("#2f8b5d"),
      },
      {
        l: "Analistas",
        v: d.alvo_medio_analistas && d.alvo_medio_analistas.valor,
        c: r.am,
      },
    ];
    he.filter((we) => rpOk(we.v)).length &&
      (e.h2(
        "O preço na régua",
        "Onde o preço atual está em relação ao preço justo e às referências de valuation calculadas.",
        160,
      ),
      rpRegua(e, {
        preco: i.preco,
        justo: l.preco_justo,
        teto: l.preco_teto,
        refs: he,
        nota: "Verde: abaixo do preço-teto (zona de compra com margem de segurança). Amarelo: entre o teto e o preço justo (manter). Vermelho: acima do preço justo.",
      }));
  }
  const x = [];
  (d.graham &&
    rpOk(d.graham.valor) &&
    x.push([
      "Preço justo de Graham",
      d.graham.valor,
      d.graham.upside_pct,
      "Raiz de 22,5 × LPA × VPA. Não funciona bem para empresas de tecnologia nem com patrimônio pequeno.",
      d.graham.conta,
    ]),
    d.bazin_6pct &&
      rpOk(d.bazin_6pct.valor) &&
      x.push([
        "Preço-teto de Bazin",
        d.bazin_6pct.valor,
        d.bazin_6pct.upside_pct,
        "Média dos proventos dos últimos 5 anos ÷ 6% (DY mínimo desejado). Só faz sentido para boas pagadoras.",
        d.bazin_6pct.conta,
      ]),
    x.length &&
      (e.h2(
        "Graham e Bazin",
        "Duas fórmulas clássicas de preço máximo a pagar. São referências, não recomendação.",
        150,
      ),
      x.forEach((he) => {
        e.need(76);
        const we = e.y;
        (e.rr(e.M, we, e.CW, 70, { fill: r.wh, stroke: r.bd, r: 8 }),
          e.t(he[0], e.M + 12, we + 10, { s: 10, f: "b", c: r.dk }));
        const Be = [e.M + 12, e.M + 130, e.M + 250];
        ([
          ["Preço atual", rpBRL(i.preco, p), r.tx],
          [
            he[0].includes("Bazin") ? "Preço-teto" : "Preço justo",
            rpBRL(he[1], p),
            r.bl,
          ],
          [
            "Upside",
            rpOk(he[2]) ? (he[2] > 0 ? "+" : "") + rpPct(he[2]) : "–",
            rpOk(he[2]) ? (he[2] >= 0 ? r.g : r.r) : r.mut,
          ],
        ].forEach(([Ge, Ce, Qe], de) => {
          (e.t(Ge, Be[de], we + 28, { s: 7.4, c: r.mut }),
            e.t(Ce, Be[de], we + 38, { s: 13, f: "b", c: Qe }));
        }),
          e
            .wrap(
              he[3] + (he[4] ? " Conta: " + he[4] + "." : ""),
              e.CW - 380,
              7.2,
            )
            .slice(0, 5)
            .forEach((Ge, Ce) =>
              e.t(Ge, e.M + 370, we + 12 + Ce * 9.5, { s: 7.2, c: r.mut }),
            ),
          (e.y = we + 78));
      })),
    e.h2(
      "Indicadores",
      "Os fundamentos da empresa, agrupados. Embaixo de cada número, o que ele significa.",
      90,
    ));
  const v = rpOk(i.div_liq_ebitda),
    g = c.empresa || {},
    h = (he, we) => {
      const Be = we.filter((Ge) => Ge.v !== "–" && Ge.v !== "–x");
      Be.length && (e.h3(he), e.kpis(Be));
    };
  (h("Valuation", [
    {
      l: "P/L",
      v: rpNum(i.pl, 2),
      d: 'Anos de lucro atual para "pagar" o preço.',
    },
    { l: "P/VP", v: rpNum(i.p_vp, 2), d: "Preço sobre o patrimônio por ação." },
    {
      l: "EV/EBITDA",
      v: rpNum(i.ev_ebitda, 2),
      d: "Valor da empresa sobre a geração de caixa.",
    },
    {
      l: "P/L PROJETADO",
      v: rpNum(i.pl_projetado, 2),
      d: "P/L com o lucro esperado pelos analistas.",
    },
    { l: "LPA", v: rpNum(i.lpa, 2), d: "Lucro por ação em 12 meses." },
    { l: "VPA", v: rpNum(i.vpa, 2), d: "Patrimônio por ação." },
  ]),
    h("Eficiência", [
      {
        l: "MARGEM BRUTA",
        v: rpFr(i.margem_bruta),
        d: "Receita menos o custo direto.",
      },
      {
        l: "MARGEM EBITDA",
        v: rpFr(i.margem_ebitda),
        d: "Geração de caixa operacional sobre a receita.",
      },
      {
        l: "MARGEM OPERACIONAL",
        v: rpFr(i.margem_operacional),
        d: "Lucro da operação sobre a receita.",
      },
      {
        l: "MARGEM LÍQUIDA",
        v: rpFr(i.margem_liquida),
        d: "De cada R$ 100 vendidos, quanto vira lucro.",
      },
    ]),
    h("Rentabilidade", [
      {
        l: "ROE",
        v: rpFr(i.roe),
        c:
          rpOk(i.roe) && rpOk(s.selic_pct)
            ? i.roe * 100 >= s.selic_pct
              ? r.g
              : r.r
            : void 0,
        d: "Lucro sobre o patrimônio. Bom quando passa da Selic.",
      },
      { l: "ROA", v: rpFr(i.roa), d: "Lucro sobre os ativos totais." },
    ]),
    h("Dividendos", [
      {
        l: "DIVIDEND YIELD",
        v: rpFr(i.dividend_yield, 2),
        d: "Proventos dos últimos 12 meses sobre o preço.",
      },
      {
        l: "PAYOUT",
        v: rpFr(i.payout),
        d: "Parte do lucro distribuída aos acionistas.",
      },
      {
        l: "PROVENTOS 12M",
        v: rpOk(i.dividendo_por_acao)
          ? u + rpNum(i.dividendo_por_acao, 2)
          : "–",
        d: "Dividendos e JCP por ação.",
      },
    ]),
    h("Endividamento", [
      {
        l: "LIQUIDEZ CORRENTE",
        v: rpNum(i.liquidez_corrente, 2),
        d: "Ativo circulante ÷ passivo circulante. Acima de 1 é confortável.",
      },
      {
        l: "DÍV. LÍQ./EBITDA",
        v: v ? rpNum(i.div_liq_ebitda, 2) : "–",
        c: v && i.div_liq_ebitda > 3 ? r.r : void 0,
        d: "Anos de caixa para quitar a dívida líquida.",
      },
      {
        l: "DÍV. LÍQ./PATRIMÔNIO",
        v: rpNum(g.divida_liq_patrimonio, 2),
        d: "Negativo = mais caixa que dívida.",
      },
      {
        l: "DÍV. BRUTA/PATRIMÔNIO",
        v: rpOk(i.divida_pl_pct) ? rpNum(i.divida_pl_pct / 100, 2) : "–",
        d: "Abaixo de 1 = dívida menor que o patrimônio.",
      },
    ]));
  const b = c.checklist,
    y = (he) => b && b.itens.find((we) => we.id === he);
  (h("Crescimento", [
    {
      l: "CRESC. RECEITA 12M",
      v: rpFr(i.crescimento_receita),
      c: rpOk(i.crescimento_receita)
        ? i.crescimento_receita >= 0
          ? r.g
          : r.r
        : void 0,
      d: "Variação das vendas em 12 meses.",
    },
    {
      l: "CRESC. LUCRO 12M",
      v: rpFr(i.crescimento_lucro),
      c: rpOk(i.crescimento_lucro)
        ? i.crescimento_lucro >= 0
          ? r.g
          : r.r
        : void 0,
      d: "Variação do lucro em 12 meses.",
    },
    {
      l: "CAGR RECEITAS",
      v:
        y("receita") && y("receita").valor !== "sem dado"
          ? y("receita").valor.split(" ")[0]
          : "–",
      d: "Crescimento médio ao ano (anos disponíveis).",
    },
    {
      l: "CAGR LUCROS",
      v:
        y("lucro") && y("lucro").valor !== "sem dado"
          ? y("lucro").valor.split(" ")[0]
          : "–",
      d: "Crescimento médio ao ano (anos disponíveis).",
    },
  ]),
    b &&
      b.itens &&
      b.itens.length &&
      (e.h2(
        "Checklist do investidor Buy and Hold",
        `Sobre ${t.tk}: os critérios de qualidade de longo prazo que a empresa atende hoje.`,
        200,
      ),
      rpChecklist(e, b)));
  const j = (c.dy_anos || []).filter((he) => rpOk(he.dy_pct));
  if (j.length >= 2) {
    const he = j.filter((Ge) => !Ge.parcial).slice(-5),
      we = he.length
        ? he.reduce((Ge, Ce) => Ge + Ce.dy_pct, 0) / he.length
        : null;
    (e.h2(
      `Histórico de dividendos · ${t.tk}`,
      "Proventos pagos por ação em cada ano (barras) e o dividend yield do ano (linha dourada).",
      225,
    ),
      rpCombo(e, {
        cats: j.map((Ge) => (Ge.parcial ? Ge.ano + "*" : Ge.ano)),
        barras: {
          l: "Dividendos pagos (R$ por ação)",
          vals: j.map((Ge) => Ge.proventos),
        },
        linha: { l: "Dividend yield", vals: j.map((Ge) => Ge.dy_pct) },
        parcial: j.map((Ge) => !!Ge.parcial),
        nota: `DY de cada ano = proventos com data no ano ÷ preço no fim do ano.${j.some((Ge) => Ge.parcial) ? " * Ano em andamento: proventos até agora ÷ preço atual." : ""} JCP pelo valor bruto. Fonte: Yahoo Finance.`,
      }),
      e.kpis(
        [
          {
            l: "DIVIDEND YIELD ATUAL (12M)",
            v: rpFr(i.dividend_yield, 2),
            d: rpOk(i.dividendo_por_acao)
              ? `Proventos pagos em 12 meses: ${u}${rpNum(i.dividendo_por_acao, 2)}`
              : "",
          },
          {
            l: "DIVIDEND YIELD MÉDIO DE 5 ANOS",
            v: rpOk(we) ? rpPct(we, 2) : "–",
            d: "Média dos últimos 5 anos completos.",
          },
        ],
        { cols: 2 },
      ));
    const Be = (c.proventos || []).slice(0, 8);
    Be.length &&
      e.tab(
        [
          { l: "Tipo", w: 30 },
          { l: "Data com", w: 35 },
          { l: "Valor por ação", w: 35, al: "r" },
        ],
        Be.map((Ge) => [
          "Dividendos/JCP",
          String(Ge.data_com).split("-").reverse().join("/"),
          rpNum(Ge.valor, 4),
        ]),
      );
  }
  const k = (c.receita_lucro || []).filter(
    (he) => rpOk(he.receita) || rpOk(he.lucro),
  );
  if (k.length >= 2) {
    const he =
        Math.max(...k.map((Be) => Math.abs(Be.receita || Be.lucro || 0))) >= 1e9
          ? 1e9
          : 1e6,
      we = he === 1e9 ? "bi" : "mi";
    (e.h2(
      "Receita e lucro por ano",
      `Valores anuais em ${we === "bi" ? "bilhões" : "milhões"} de ${p === "BRL" ? "reais" : "dólares"}. Crescimento constante dos dois é sinal de negócio saudável.`,
      210,
    ),
      rpColunas(e, {
        cats: k.map((Be) => Be.ano),
        series: [
          {
            l: "Receita",
            vals: k.map((Be) => (rpOk(Be.receita) ? Be.receita / he : null)),
            c: e.hex("#86abcb"),
            fmt: (Be) => rpNum(Be, 1),
          },
          {
            l: "Lucro líquido",
            vals: k.map((Be) => (rpOk(Be.lucro) ? Be.lucro / he : null)),
            c: (Be) => (Be < 0 ? r.r : e.hex(RP_AZUL)),
            fmt: (Be) => rpNum(Be, 1),
          },
        ],
        fmtEixo: (Be) => rpNum(Be, 0),
        nota: "Fonte: demonstrações anuais via Yahoo Finance (normalmente os últimos 4 ou 5 anos).",
      }));
  }
  const A = (c.cotacao || []).filter((he) => rpOk(he[1]));
  A.length >= 12 &&
    (e.h2("Cotação nos últimos 5 anos", "Fechamento de cada mês.", 216),
    rpLinha(e, {
      serie: A.map((he) => ({
        c: he[1],
        d: String(he[0]).split("-").reverse().join("/"),
      })),
      medias: [
        {
          l: "Média de 12 meses",
          vals: rpSma(
            A.map((he) => he[1]),
            12,
          ),
          c: r.am,
        },
      ],
      niveis: [],
      nota: "A média de 12 meses mostra a tendência de longo prazo do preço.",
    }));
  const C = s.selic_pct,
    I = [
      { l: "ROE", v: rpOk(i.roe) ? i.roe * 100 : null },
      { l: "Earnings yield (1 ÷ P/L)", v: d.earnings_yield_pct },
      {
        l: "Dividend yield",
        v: rpOk(i.dividend_yield) ? i.dividend_yield * 100 : null,
      },
      { l: "FCF yield (caixa livre)", v: d.fcf_yield_pct },
    ].filter((he) => rpOk(he.v));
  I.length &&
    t.mk !== "US" &&
    (e.h2(
      "Rentabilidade x custo de oportunidade",
      "Compara o que a empresa entrega com o que a renda fixa paga sem risco.",
      40 + I.length * 22 + 14,
    ),
    rpBarras(e, {
      itens: I.map((he) => ({
        ...he,
        c: rpOk(C) && he.v < C ? e.hex("#9ca0a9") : void 0,
      })),
      un: "%",
      lw: 150,
      ref: rpOk(C) ? { v: C, l: "Selic " + rpPct(C, 2) } : null,
      nota: "Barras à direita da linha vermelha rendem mais que a Selic. Earnings yield = 100 ÷ P/L. FCF yield = caixa livre ÷ valor de mercado.",
    }));
  const J = (Array.isArray(a.cenarios) ? a.cenarios : []).map((he) => {
    const we = rpUp(he.cenario);
    return {
      nome: String(he.cenario || "").replace(/^./, (Be) => Be.toUpperCase()),
      prob: +he.probabilidade_pct,
      preco: +he.preco,
      premissas: he.premissas,
      c: /OTIM/.test(we) ? r.g : /PESS/.test(we) ? r.r : r.bl,
    };
  });
  if (
    (J.some((he) => rpOk(he.preco)) &&
      (e.h2(
        "Cenários e preço justo",
        "Três cenários com preço e probabilidade. O preço justo é a média ponderada deles.",
        196,
      ),
      rpCenarios(e, {
        cen: J,
        preco: i.preco,
        justo: l.preco_justo,
        nota: l.conta ? "Conta: " + l.conta : "",
      }),
      e.tab(
        [
          { l: "Cenário", w: 16 },
          { l: "Prob.", w: 9, al: "r" },
          { l: "Preço", w: 12, al: "r" },
          { l: "Premissas", w: 63 },
        ],
        J.map((he) => [
          { t: he.nome, f: "b", c: he.c },
          rpPct(he.prob, 0),
          rpNum(he.preco, 2),
          he.premissas || "–",
        ]),
      )),
    rpOk(l.preco_justo) || a.para_quem_tem || a.para_quem_nao_tem)
  ) {
    const he = [];
    (l.situacao &&
      he.push(
        `Preço atual ${l.situacao}. Margem de segurança de ${rpNum(l.margem_pct, 0)}% pela qualidade do negócio.`,
      ),
      a.para_quem_tem &&
        he.push({ b: "Se você tem: " + rpTexto(a.para_quem_tem).join(" ") }),
      a.para_quem_nao_tem &&
        he.push({
          b: "Se você não tem: " + rpTexto(a.para_quem_nao_tem).join(" "),
        }),
      l.posicao &&
        rpOk(l.posicao.resultado_pct) &&
        he.push(
          `Sua posição: preço médio ${rpNum(l.posicao.preco_medio, 2)} · resultado ${rpPct(l.posicao.resultado_pct)}.`,
        ));
    const we = rpRecCor(e, l.zona);
    (e.h2("Decisão", null, e.mede(l.zona ? "Zona: " + l.zona : "", he).h),
      e.caixa(l.zona ? "Zona: " + l.zona : "", he, {
        bg:
          we === r.g
            ? e.hex("#efeeeb")
            : we === r.r
              ? e.hex("#fdf4f3")
              : e.hex("#dfc79a"),
        barra: we,
      }));
  }
  e.kpis(
    [
      {
        l: "EARNINGS YIELD x SELIC",
        v: rpOk(d.premio_earnings_yield_sobre_selic_pp)
          ? (d.premio_earnings_yield_sobre_selic_pp > 0 ? "+" : "") +
            rpNum(d.premio_earnings_yield_sobre_selic_pp, 1) +
            " p.p."
          : "–",
        c: rpOk(d.premio_earnings_yield_sobre_selic_pp)
          ? d.premio_earnings_yield_sobre_selic_pp >= 0
            ? r.g
            : r.r
          : void 0,
        d: 'Positivo: o lucro "rende" mais que a Selic.',
      },
      {
        l: "ROE x SELIC",
        v: rpOk(d.roe_menos_selic_pp)
          ? (d.roe_menos_selic_pp > 0 ? "+" : "") +
            rpNum(d.roe_menos_selic_pp, 1) +
            " p.p."
          : "–",
        c: rpOk(d.roe_menos_selic_pp)
          ? d.roe_menos_selic_pp >= 0
            ? r.g
            : r.r
          : void 0,
        d: "Positivo: a empresa rende mais que a renda fixa.",
      },
      {
        l: "ALVO MÉDIO DOS ANALISTAS",
        v:
          d.alvo_medio_analistas && rpOk(d.alvo_medio_analistas.valor)
            ? rpNum(d.alvo_medio_analistas.valor, 2)
            : "–",
        d:
          d.alvo_medio_analistas && rpOk(d.alvo_medio_analistas.upside_pct)
            ? `${d.alvo_medio_analistas.upside_pct > 0 ? "+" : ""}${rpPct(d.alvo_medio_analistas.upside_pct)} sobre o preço atual.`
            : "Consenso do mercado.",
      },
    ],
    { cols: 3 },
  );
  const se = i.analistas_compra_forte_e_compra || 0,
    Ie = i.analistas_manter || 0,
    Pe = i.analistas_venda_e_venda_forte || 0;
  (se + Ie + Pe || rpOk(i.max_52s)) &&
    (e.h2("Mercado e consenso", null, 70),
    se + Ie + Pe &&
      rpEmpilhada(e, {
        partes: [
          { l: "Compra", n: se, c: r.g },
          { l: "Manter", n: Ie, c: r.am },
          { l: "Venda", n: Pe, c: r.r },
        ],
        nota: `Recomendações de ${se + Ie + Pe} analistas que acompanham o papel.`,
      }),
    rpFaixa(e, {
      min: i.min_52s,
      max: i.max_52s,
      v: i.preco,
      l: "Preço atual",
      nota: "Faixa de preço das últimas 52 semanas. Perto da máxima, a margem de segurança costuma ser menor.",
    }));
  const Me = [
    ["Tese de investimento", a.tese_de_investimento],
    ["Vantagens competitivas", a.vantagens_competitivas],
    ["Rentabilidade e margens", a.rentabilidade_e_margens],
    ["Endividamento e caixa", a.endividamento_e_caixa],
    ["Dividendos", a.dividendos],
    ["Leitura do valuation", a.valuation_leitura],
    ["Métodos de valuation", a.valuation_metodos],
    ["Governança", a.governanca],
    ["Perspectivas de crescimento", a.perspectivas_de_crescimento],
    ["Riscos e catalisadores", a.riscos_e_catalisadores],
  ].filter((he) => rpTexto(he[1]).length);
  Me.length &&
    (e.h2("Análise detalhada", null, 50),
    Me.forEach(([he, we]) => {
      (e.h3(he), e.para(rpTexto(we)));
    }));
  const ue = rpTexto(a.pontos_fortes),
    ve = rpTexto(a.pontos_de_atencao);
  if (
    (ue.length && (e.h2("Pontos fortes", null, 30), e.bul(ue, { dot: r.g })),
    ve.length && (e.h2("Pontos de atenção", null, 30), e.bul(ve, { dot: r.r })),
    c.empresa)
  ) {
    const he = c.empresa,
      we = [
        {
          l: "VALOR DE MERCADO",
          v: rpOk(he.valor_mercado) ? u + rpBig(he.valor_mercado) : "–",
        },
        {
          l: "VALOR DE FIRMA",
          v: rpOk(he.valor_firma) ? u + rpBig(he.valor_firma) : "–",
        },
        {
          l: "PATRIMÔNIO LÍQUIDO",
          v: rpOk(he.patrimonio) ? u + rpBig(he.patrimonio) : "–",
        },
        { l: "Nº TOTAL DE AÇÕES", v: rpOk(he.acoes) ? rpBig(he.acoes) : "–" },
        {
          l: "DÍVIDA BRUTA",
          v: rpOk(he.divida_bruta) ? u + rpBig(he.divida_bruta) : "–",
        },
        {
          l: "DÍVIDA LÍQUIDA",
          v: rpOk(he.divida_liquida) ? u + rpBig(he.divida_liquida) : "–",
        },
        { l: "CAIXA", v: rpOk(he.caixa) ? u + rpBig(he.caixa) : "–" },
        {
          l: "LIQUIDEZ MÉDIA DIÁRIA",
          v: rpOk(he.liquidez_media_diaria)
            ? u + rpBig(he.liquidez_media_diaria)
            : "–",
        },
        { l: "SETOR", v: he.setor || "–" },
        { l: "SEGMENTO", v: he.industria || "–" },
        {
          l: "ANOS DE BOLSA",
          v: rpOk(c.anos_listada) ? rpNum(c.anos_listada, 0) + " anos" : "–",
        },
      ].filter((Be) => Be.v !== "–");
    we.length &&
      (e.h2("Informações sobre a empresa", null, 60),
      e.kpis(we, { cols: 3, h: 42, vs: 11 }));
  }
}
function rpRiscos(e, t) {
  const a = Array.isArray(t.matriz_de_riscos)
    ? t.matriz_de_riscos.filter((n) => n && n.risco)
    : [];
  if (!a.length) return;
  const { C: o } = e;
  (e.h2(
    "Matriz de riscos",
    "Cada número no quadro é um risco da lista. Quanto mais para cima e para a direita, mais perigoso.",
    150,
  ),
    rpMatriz(e, a));
  const s = (n) =>
    /ALT/.test(rpUp(n)) ? o.r : /BAIX/.test(rpUp(n)) ? o.g : o.am;
  e.tab(
    [
      { l: "#", w: 5 },
      { l: "Risco e gatilho", w: 55 },
      { l: "Tipo", w: 16 },
      { l: "Prob.", w: 12 },
      { l: "Impacto", w: 12 },
    ],
    a.map((n, r) => [
      { t: String(r + 1), f: "b" },
      { t: n.risco, f: "b", sub: n.gatilho ? "Gatilho: " + n.gatilho : "" },
      n.tipo || "–",
      { t: n.probabilidade || "–", c: s(n.probabilidade), f: "b" },
      { t: n.impacto || "–", c: s(n.impacto), f: "b" },
    ]),
  );
}
function rpConclusao(e, t, a) {
  const o = t.conclusao;
  if (!o || typeof o != "object") return;
  const { C: s } = e,
    n = [];
  (rpOk(+o.preco_alvo) && o.preco_alvo
    ? n.push({
        t: `Preço-alvo: ${rpBRL(+o.preco_alvo, a)}${o.horizonte ? " · horizonte: " + o.horizonte : ""}`,
        f: "b",
      })
    : o.horizonte && n.push("Horizonte: " + o.horizonte),
    rpTexto(o.justificativa).forEach((l) => n.push(l)));
  const r = rpTexto(o.premissas);
  (r.length &&
    (n.push({ t: "Premissas:", f: "b" }), r.forEach((l) => n.push({ b: l }))),
    o.preco_alvo_origem &&
      n.push("Origem do preço-alvo: " + o.preco_alvo_origem));
  const i = rpRecCor(e, o.recomendacao);
  (e.h2(
    "Conclusão e recomendação",
    null,
    e.mede(o.recomendacao ? "x" : "", n).h,
  ),
    e.caixa(o.recomendacao ? "Recomendação: " + o.recomendacao : "", n, {
      barra: i,
      bg:
        i === s.g
          ? e.hex("#efeeeb")
          : i === s.r
            ? e.hex("#fdf4f3")
            : e.hex("#dfc79a"),
    }));
}
function rpFim(e, t, a) {
  const o = rpTexto(a.alertas);
  o.length && (e.h2("Alertas"), e.bul(o, { dot: e.C.am }));
  const s = (Array.isArray(t.avisos) ? t.avisos : []).concat(
    Array.isArray(t.erros) && t.erros.length
      ? ["Sem dados para: " + t.erros.join("; ")]
      : [],
  );
  (s.length &&
    (e.h2("Notas sobre os dados"), e.bul(s, { s: 8.6, dot: e.C.mut })),
    e.h2("Fontes e aviso"),
    e.para(
      `Cotações e fundamentos: brapi (B3), Twelve Data (EUA) e Yahoo Finance, com atraso; macro: Banco Central (SGS). Texto gerado por ${t.ia || "IA"}${t.modelo ? " (" + t.modelo + ")" : ""} em ${t.gerado ? new Date(t.gerado).toLocaleString("pt-BR") : "data desconhecida"}. Os números de valuation (preço justo, preço-teto, Graham, Bazin) são calculados pelo app; a IA apenas interpreta.`,
      { s: 8.6, c: e.C.mut },
    ),
    e.para(
      "Este material é um estudo pessoal e não constitui recomendação de investimento. Rentabilidade passada não garante resultado futuro. Confira os dados antes de decidir.",
      { s: 8.6, c: e.C.mut, f: "i" },
    ));
}
function rpCandles(e, t) {
  const { C: a, M: o } = e,
    s = t.g;
  if (!s || !Array.isArray(s.c) || s.c.length < 10) return;
  const n = s.c.filter((de) => [de[1], de[2], de[3], de[4]].every(rpOk));
  if (n.length < 10) return;
  const r = t.h || 262;
  e.need(r + 8);
  const i = e.y,
    l = e.hex("#339966"),
    d = e.hex("#e86a57"),
    c = e.hex("#f2f1ef"),
    p = e.hex("#787b86");
  e.rr(o, i, e.CW, r, { fill: a.wh, stroke: e.hex("#d4d6d9"), r: 6 });
  const u = n[n.length - 1],
    m = n[n.length - 2],
    f = m ? (u[4] / m[4] - 1) * 100 : 0;
  e.t(`${t.tk} · ${t.tf} · ${t.bolsa || "B3"}`, o + 10, i + 8, {
    s: 9.5,
    f: "b",
    c: e.hex("#16171a"),
  });
  const x = `A ${rpNum(u[1], 2)}  M ${rpNum(u[2], 2)}  m ${rpNum(u[3], 2)}  F ${rpNum(u[4], 2)}  ${f >= 0 ? "+" : ""}${rpNum(f, 2)}%`;
  e.t(
    x,
    o + 10 + e.wd(`${t.tk} · ${t.tf} · ${t.bolsa || "B3"}`, 9.5, "b") + 12,
    i + 9,
    { s: 7.6, c: f >= 0 ? l : d },
  );
  const v = [
    ["MM 20", s.mm20, e.hex("#6997bf")],
    ["MM 50", s.mm50, e.hex("#c2933d")],
    ["MM 200", s.mm200, e.hex("#766f61")],
  ];
  let g = o + 10;
  v.forEach(([de, Se, Ve]) => {
    const Je = Se && [...Se].reverse().find(rpOk);
    if (!rpOk(Je)) return;
    const Ye = `${de} ${rpNum(Je, 2)}`;
    (e.t(Ye, g, i + 21, { s: 7, f: "b", c: Ve }), (g += e.wd(Ye, 7, "b") + 12));
  });
  const h = o + 8,
    b = o + e.CW - 52,
    y = i + 36,
    j = i + r - 20,
    k = 34,
    A = j - k - 6,
    C = n.length,
    I = n.flatMap((de) => [de[2], de[3]]);
  v.forEach(([, de]) =>
    (de || []).forEach((Se) => {
      rpOk(Se) && I.push(Se);
    }),
  );
  let J = Math.min(...I),
    se = Math.max(...I);
  const Ie = (t.niveis || []).filter(
    (de) =>
      rpOk(de.v) && de.v > J - (se - J) * 0.15 && de.v < se + (se - J) * 0.15,
  );
  Ie.forEach((de) => {
    ((J = Math.min(J, de.v)), (se = Math.max(se, de.v)));
  });
  const Pe = (se - J) * 0.05 || se * 0.02;
  ((J -= Pe), (se += Pe));
  const Me = (de) => A - ((de - J) / (se - J)) * (A - y),
    ue = (b - h) / C,
    ve = (de) => h + ue * (de + 0.5),
    he = Math.max(0.8, ue * 0.68);
  for (let de = 0; de <= 5; de++) {
    const Se = J + ((se - J) * de) / 5,
      Ve = Me(Se);
    (e.ln(h, Ve, b, Ve, { c, w: 0.6 }),
      e.t(rpNum(Se, 2), b + 4, Ve - 3.5, { s: 6.6, c: p }));
  }
  const we = 5;
  for (let de = 0; de < we; de++) {
    const Se = Math.round(((C - 1) * de) / (we - 1)),
      Ve = ve(Se);
    e.ln(Ve, y, Ve, j, { c, w: 0.5 });
    const Je = String(n[Se][0]).slice(0, 10).split("-");
    e.t(
      t.tf === "Mensal"
        ? Je[1] + "/" + Je[0].slice(2)
        : t.tf === "Semanal"
          ? Je[2] + "/" + Je[1] + "/" + Je[0].slice(2)
          : Je[2] + "/" + Je[1],
      Ve,
      j + 5,
      { s: 6.4, c: p, al: "c" },
    );
  }
  const Be = Math.max(...n.map((de) => +de[5] || 0), 1);
  (n.forEach((de, Se) => {
    const Ve = de[4] >= de[1],
      Je = Ve ? l : d,
      Ye = ve(Se);
    if (+de[5] > 0) {
      const Ke = (+de[5] / Be) * k;
      e.rect(Ye - he / 2, j - Ke, he, Ke, { fill: Je, op: 0.35 });
    }
    e.ln(Ye, Me(de[2]), Ye, Me(de[3]), {
      c: Je,
      w: Math.max(0.5, Math.min(1, ue * 0.18)),
    });
    const Xe = Me(Math.max(de[1], de[4])),
      ot = Me(Math.min(de[1], de[4]));
    e.rect(Ye - he / 2, Xe, he, Math.max(0.6, ot - Xe), { fill: Je });
  }),
    v.forEach(([, de, Se]) => {
      if (!de) return;
      let Ve = "";
      (de.slice(-C).forEach((Je, Ye) => {
        rpOk(Je) &&
          (Ve +=
            (Ve ? " L " : "M ") +
            (ve(Ye) - h).toFixed(1) +
            " " +
            (Me(Je) - y).toFixed(1));
      }),
        Ve && e.path(Ve, h, y, { stroke: Se, bw: 1 }));
    }));
  const Ge = [];
  Ie.forEach((de) => {
    const Se = Me(de.v);
    e.ln(h, Se, b, Se, { c: de.c, w: 0.7, dash: [3, 2] });
    let Ve = Se - 9;
    for (; Ge.some((Je) => Math.abs(Je - Ve) < 9); ) Ve -= 9;
    (Ge.push(Ve),
      e.t(`${de.l} ${rpNum(de.v, 2)}`, b - 4, Ve, {
        s: 6.4,
        f: "b",
        c: de.c,
        al: "r",
      }));
  });
  const Ce = Me(u[4]),
    Qe = f >= 0 ? l : d;
  (e.ln(h, Ce, b, Ce, { c: Qe, w: 0.6, dash: [1, 1.5] }),
    e.rect(b + 1, Ce - 6, 48, 12, { fill: Qe }),
    e.t(rpNum(u[4], 2), b + 25, Ce - 3.6, { s: 7, f: "b", c: a.wh, al: "c" }),
    e.ln(h, j, b, j, { c: e.hex("#d4d6d9"), w: 0.6 }),
    e.t("Volume", h + 2, j - k - 1, { s: 6, c: p }),
    (e.y = i + r + 6),
    e.nota(t.nota));
}
function rpImagem(e, t, a) {
  const { C: o, M: s } = e,
    n = e.CW,
    r = (n * t.height) / t.width,
    i = Math.min(r, (e.BOT - e.TOP) / 2 - 34),
    l = i < r ? (i * t.width) / t.height : n;
  (e.need(i + 22),
    e.rr(s, e.y, e.CW, i + 8, { fill: o.wh, stroke: o.bd, r: 6 }),
    e.pg.drawImage(t, {
      x: s + (e.CW - l) / 2,
      y: e.H - e.y - 4 - i,
      width: l,
      height: i,
    }),
    (e.y += i + 12),
    a && e.nota(a));
}
function rpMeuPlano(e, t, a, o, s) {
  const { C: n } = e,
    r = a.plano,
    i = a.imgs || [];
  if (!(!r && !i.length)) {
    if (
      (e.h2(
        s ? "Meu plano de entrada" : "Meu plano: Fibonacci marcado no gráfico",
        r
          ? "Entrada, stop e alvos que você marcou (lidos do seu print ou digitados), com o risco/retorno de cada alvo."
          : "Os prints que você mandou.",
        r ? 150 : 260,
      ),
      r)
    ) {
      (e.kpis([
        { l: "LADO", v: r.lado, c: r.lado === "VENDA" ? n.r : n.g },
        { l: "ENTRADA", v: rpNum(r.entrada, 2) },
        {
          l: "STOP",
          v: rpNum(r.stop, 2),
          c: n.r,
          d: `Risco de ${rpNum(r.risco_pct, 2)}% até o stop.`,
        },
        {
          l: "ALVOS",
          v: r.alvos.map((p) => rpNum(p, 2)).join(" · "),
          vs: r.alvos.length > 2 ? 10 : 12,
          c: n.g,
          d: r.rr.map((p, u) => `alvo ${u + 1} = 1:${rpNum(p, 1)}`).join(" · "),
        },
      ]),
        rpPlano(e, {
          titulo: `${r.lado === "VENDA" ? "Venda" : "Compra"} pelo seu ${s ? "plano" : "Fibonacci"}`,
          entrada: r.entrada,
          stop: r.stop,
          alvo1: r.alvos[0],
          alvo2: r.alvos[1],
          selo: `R/R ${rpNum(r.rr[0], 1)}:1`,
          seloOk: r.rr[0] >= 2,
        }));
      const l = a.ia || {};
      if (!s && (l.explicacao || (l.niveis && l.niveis.length))) {
        (e.h3("Níveis lidos no seu print"),
          l.explicacao && e.para(l.explicacao));
        const p = (l.niveis || []).filter((u) => u && u.nivel);
        (p.length &&
          e.tab(
            [
              { l: "Nível", w: 40 },
              { l: "Preço lido no print", w: 60, al: "r" },
            ],
            p.map((u) => [{ t: String(u.nivel), f: "b" }, rpNum(+u.preco, 2)]),
          ),
          l.avisos &&
            l.avisos.length &&
            e.bul(l.avisos, { s: 8.6, dot: n.am }));
      }
      const d = o && (s ? o.plano_do_investidor : o.plano_do_trader),
        c =
          t.meu_plano &&
          Math.abs(t.meu_plano.entrada - r.entrada) < 1e-6 &&
          Math.abs(t.meu_plano.stop - r.stop) < 1e-6;
      if (d && c) {
        const p = d.nota_do_setup || d.nota_do_plano,
          u = /A/.test(p || "") ? n.g : /C/.test(p || "") ? n.r : n.am;
        if (
          (e.h2(
            s
              ? "Análise do seu plano · analista fundamentalista"
              : "Análise do seu Fibonacci · analista técnico",
            null,
            90,
          ),
          p || d.probabilidade)
        ) {
          e.need(30);
          let x = e.M;
          (p &&
            (x +=
              e.pill("Nota do " + (s ? "plano" : "setup") + ": " + p, x, e.y, {
                s: 9,
                bg: u,
                c: n.wh,
              }) + 8),
            d.probabilidade &&
              e.pill("Probabilidade " + d.probabilidade, x, e.y, {
                s: 9,
                bg: n.cz,
                c: n.tx,
              }),
            (e.y += 26));
        }
        ((s
          ? [
              ["Entrada x valor", d.entrada_x_valor],
              ["Alvos x valor", d.alvos_x_valor],
              ["Stop x tese", d.stop_x_tese],
              ["Dividendos no caminho", d.dividendos_no_caminho],
              ["Horizonte", d.horizonte],
            ]
          : [
              ["Leitura do Fibonacci", d.leitura_do_fibonacci],
              ["Confluências", d.confluencias],
              ["Contexto multi-tempo", d.contexto_multitempo],
              ["Entrada e gatilho", d.entrada],
              ["Stop", d.stop],
              ["Alvos", d.alvos],
              ["Gestão do trade", d.gestao],
            ]
        )
          .filter((x) => rpTexto(x[1]).length)
          .forEach(([x, v]) => {
            (e.h3(x), e.para(rpTexto(v)));
          }),
          d.avaliacao && (e.h3("Avaliação"), e.para(rpTexto(d.avaliacao))));
        const m = rpTexto(d.a_favor),
          f = rpTexto(d.contra);
        (m.length &&
          (e.need(40),
          e.para("A favor:", { f: "b", s: 9.5, gap: 2 }),
          e.bul(m, { dot: n.g })),
          f.length &&
            (e.need(40),
            e.para("Contra:", { f: "b", s: 9.5, gap: 2 }),
            e.bul(f, { dot: n.r })),
          d.ajuste_sugerido &&
            !/^nenhum/i.test(String(d.ajuste_sugerido)) &&
            e.caixa("Ajuste sugerido", [String(d.ajuste_sugerido)], {
              barra: n.am,
              bg: e.hex("#dfc79a"),
            }),
          d.conclusao &&
            e.caixa("Conclusão", rpTexto(d.conclusao), { barra: u }));
      } else
        e.nota(
          d
            ? 'A análise da IA foi feita com outro plano. Toque em "Atualizar relatório" para analisar o plano atual.'
            : 'Para a IA analisar este plano, toque em "Atualizar relatório" com o plano preenchido.',
        );
    }
    i.forEach((l) => rpImagem(e, l.img, `Seu print · ${l.tf}`));
  }
}
function rpSma(e, t) {
  return e.map((a, o) =>
    o + 1 < t ? null : e.slice(o + 1 - t, o + 1).reduce((s, n) => s + n, 0) / t,
  );
}
function rpTec(e, t, a) {
  const { C: o } = e,
    s = t.relatorio || {},
    n = Array.isArray(t.ativos) ? t.ativos : [],
    r = Array.isArray(s.ativos) ? s.ativos : [],
    i = (x) => r.find((v) => rpUp(v.ticker) === rpUp(x)) || {},
    l = n.length === 1,
    d = n[0] || {},
    c = i(d.tk),
    p = s.conclusao || {},
    u = c.vies || "",
    m = d.moeda || "BRL";
  rpCapa(e, {
    tipo: "Relatório técnico",
    titulo: l ? d.tk : "Carteira " + (a.mk || ""),
    sub: l
      ? "Leitura mensal, semanal e diária · médias de 20, 50 e 200"
      : `${n.length} ativos`,
    rec:
      l && u
        ? "Viés: " + u
        : p.recomendacao
          ? "Recomendação: " + p.recomendacao
          : "",
    recCor: rpRecCor(e, l ? u : p.recomendacao),
    preco: l && rpOk(d.preco_atual) ? rpBRL(d.preco_atual, m) : "",
    precoSub:
      l && d.ind && rpOk(d.ind.var_1d_pct)
        ? `${d.ind.var_1d_pct > 0 ? "+" : ""}${rpPct(d.ind.var_1d_pct, 2)} no dia`
        : "",
    data: a.data,
  });
  const f = rpTexto(s.sumario_executivo);
  (f.length &&
    e.caixa(
      "Sumário executivo",
      f.map((x) => ({ b: x })),
      { barra: o.ac },
    ),
    rpMeuPlano(e, t, a, c),
    n.forEach((x) => {
      const v = i(x.tk),
        g = x.ind || {},
        h = x.moeda || "BRL",
        b = x.mtf || {};
      if (
        (l ||
          (e.add(),
          e.rr(e.M, e.y, e.CW, 44, { fill: o.dk, r: 8 }),
          e.t(x.tk, e.M + 14, e.y + 11, { s: 18, f: "b", c: o.wh }),
          v.vies &&
            e.pill("Viés " + v.vies, e.M + e.CW - 12, e.y + 13, {
              s: 8.5,
              bg: rpRecCor(e, v.vies),
              c: o.wh,
              al: "r",
            }),
          (e.y += 56)),
        e.kpis([
          {
            l: "PREÇO",
            v: rpBRL(x.preco_atual, h),
            d: rpOk(g.var_1d_pct)
              ? `${g.var_1d_pct > 0 ? "+" : ""}${rpPct(g.var_1d_pct, 2)} no último pregão`
              : "",
          },
          {
            l: "RSI (14)",
            v: rpNum(g.rsi14, 0),
            c: rpOk(g.rsi14)
              ? g.rsi14 > 70
                ? o.r
                : g.rsi14 < 30
                  ? o.g
                  : void 0
              : void 0,
            d: "Acima de 70 = esticado; abaixo de 30 = sobrevendido.",
          },
          {
            l: "ATR (14)",
            v: rpPct(g.atr14_pct, 1),
            d: "Oscilação média diária: ajuda a dimensionar o stop.",
          },
          {
            l: "VOLUME",
            v: rpOk(g.volume_vs_media20)
              ? rpNum(g.volume_vs_media20, 1) + "x"
              : "–",
            d: "Volume do último pregão sobre a média de 20.",
          },
          {
            l: "MÉDIA 20",
            v: rpNum(g.sma20, 2),
            d: rpOk(g.dist_sma20_pct)
              ? `Preço ${g.dist_sma20_pct >= 0 ? "acima" : "abaixo"} ${rpPct(Math.abs(g.dist_sma20_pct))}`
              : "",
            c: rpOk(g.dist_sma20_pct)
              ? g.dist_sma20_pct >= 0
                ? o.g
                : o.r
              : void 0,
          },
          {
            l: "MÉDIA 50",
            v: rpNum(g.sma50, 2),
            d: rpOk(g.dist_sma50_pct)
              ? `Preço ${g.dist_sma50_pct >= 0 ? "acima" : "abaixo"} ${rpPct(Math.abs(g.dist_sma50_pct))}`
              : "",
            c: rpOk(g.dist_sma50_pct)
              ? g.dist_sma50_pct >= 0
                ? o.g
                : o.r
              : void 0,
          },
          {
            l: "MÉDIA 200",
            v: rpNum(g.sma200, 2),
            d: rpOk(g.dist_sma200_pct)
              ? `Preço ${g.dist_sma200_pct >= 0 ? "acima" : "abaixo"} ${rpPct(Math.abs(g.dist_sma200_pct))}`
              : "Histórico curto para a média de 200.",
            c: rpOk(g.dist_sma200_pct)
              ? g.dist_sma200_pct >= 0
                ? o.g
                : o.r
              : void 0,
          },
          {
            l: "ALINHAMENTO",
            v: String(b.alinhamento || "–")
              .replace("ALINHADO EM ", "")
              .replace("SEM DADO", "–"),
            vs: 12,
            c: rpRecCor(e, b.alinhamento),
            d: "Mensal, semanal e diário juntos.",
          },
        ]),
        v.resumo && (e.h2("Resumo"), e.para(rpTexto(v.resumo))),
        b.diario)
      ) {
        e.h2(
          "Leitura multi-tempo",
          "Tendência de alta = preço acima da média de 20, média de 20 acima da de 50 e subindo. Baixa é o contrário.",
          110,
        );
        const k = (C) => (C === "alta" ? o.g : C === "baixa" ? o.r : o.am);
        e.tab(
          [
            { l: "Tempo", w: 14 },
            { l: "Tendência", w: 14 },
            { l: "Média 20", w: 14, al: "r" },
            { l: "Média 50", w: 14, al: "r" },
            { l: "Média 200", w: 14, al: "r" },
            { l: "RSI", w: 9, al: "r" },
            { l: "Na faixa", w: 11, al: "r" },
          ],
          [
            ["Mensal", b.mensal],
            ["Semanal", b.semanal],
            ["Diário", b.diario],
          ]
            .filter((C) => C[1])
            .map(([C, I]) => [
              { t: C, f: "b" },
              { t: I.tendencia, c: k(I.tendencia), f: "b" },
              rpNum(I.media_rapida && I.media_rapida.valor, 2) +
                (I.media_rapida && I.media_rapida.inclinacao === "subindo"
                  ? " (sobe)"
                  : I.media_rapida && I.media_rapida.inclinacao === "caindo"
                    ? " (cai)"
                    : ""),
              rpNum(I.media_lenta && I.media_lenta.valor, 2),
              I.media_200 && rpOk(I.media_200.valor)
                ? {
                    t:
                      rpNum(I.media_200.valor, 2) +
                      (I.media_200.preco_acima ? " (acima)" : " (abaixo)"),
                    c: I.media_200.preco_acima ? o.g : o.r,
                  }
                : "–",
              rpNum(I.rsi14, 0),
              rpPct(I.posicao_na_faixa_pct, 0),
            ]),
        );
        const A = v.multitempo || {};
        ["mensal", "semanal", "diario", "leitura_top_down"].forEach((C) => {
          A[C] && (e.h3(rpRotulo(C)), e.para(rpTexto(A[C])));
        });
      }
      const y = x.graficos;
      if (y && (y.D || y.W || y.M)) {
        const k = (x.pivos && x.pivos.diario && x.pivos.diario.classico) || {},
          A = (x.pivos && x.pivos.semanal && x.pivos.semanal.classico) || {},
          C =
            x.plano &&
            (rpUp(v.vies) === "BAIXA" ? x.plano.venda : x.plano.compra),
          I = [
            { l: "Pivô P", v: k.P, c: e.hex("#787b86") },
            { l: "R1", v: k.R1, c: e.hex("#e86a57") },
            { l: "S1", v: k.S1, c: e.hex("#339966") },
          ];
        C &&
          C.atende_3_para_1 &&
          I.push(
            { l: "Stop", v: C.stop, c: e.hex("#e86a57") },
            { l: "Alvo 1", v: C.alvo_1, c: e.hex("#339966") },
          );
        const J = [
          { l: "Pivô sem. P", v: A.P, c: e.hex("#787b86") },
          { l: "R1 sem.", v: A.R1, c: e.hex("#e86a57") },
          { l: "S1 sem.", v: A.S1, c: e.hex("#339966") },
        ];
        e.h2(
          "Gráficos: mensal, semanal e diário",
          "Candles no estilo TradingView, com volume e as médias de 20, 50 e 200 períodos de cada tempo gráfico.",
          270,
        );
        const se = x.mk === "US" ? "EUA" : "B3";
        (y.M &&
          rpCandles(e, {
            g: y.M,
            tk: x.tk,
            tf: "Mensal",
            bolsa: se,
            nota: "Tendência primária: cada candle é um mês.",
          }),
          y.W &&
            rpCandles(e, {
              g: y.W,
              tk: x.tk,
              tf: "Semanal",
              bolsa: se,
              nota: "Tendência intermediária: cada candle é uma semana.",
            }),
          y.D &&
            rpCandles(e, {
              g: y.D,
              tk: x.tk,
              tf: "Diário",
              bolsa: se,
              nota: "Curto prazo: cada candle é um dia. Verde: fechou acima da abertura; vermelho: abaixo. Dados com atraso (brapi/Yahoo).",
            }));
      } else {
        const k = Array.isArray(x.candles) ? x.candles : [];
        if (k.length > 10) {
          const A = k.map((se) => +se[4]),
            C = (x.pivos && x.pivos.diario && x.pivos.diario.classico) || {},
            I =
              x.plano &&
              (rpUp(v.vies) === "BAIXA" ? x.plano.venda : x.plano.compra),
            J = [
              { l: "Pivô P", v: C.P, c: e.hex("#7a808c") },
              { l: "R1", v: C.R1, c: o.r },
              { l: "S1", v: C.S1, c: o.g },
            ];
          (I &&
            I.atende_3_para_1 &&
            J.push(
              { l: "Stop", v: I.stop, c: o.r },
              { l: "Alvo 1", v: I.alvo_1, c: o.g },
            ),
            e.h2(
              "Preço, médias e níveis",
              `Fechamentos dos últimos ${k.length} pregões com as médias de 20 e 50 e os pivôs diários.`,
              216,
            ),
            rpLinha(e, {
              serie: k.map((se) => ({
                c: +se[4],
                d: String(se[0] || "")
                  .slice(0, 10)
                  .split("-")
                  .reverse()
                  .join("/"),
              })),
              medias: [
                { l: "Média 20", vals: rpSma(A, 20), c: o.bl },
                { l: "Média 50", vals: rpSma(A, 50), c: o.am },
              ],
              niveis: J,
              nota: "Linha escura: preço de fechamento. Tracejados: pivôs do dia (P = equilíbrio, R1 = primeira resistência, S1 = primeiro suporte). As médias de 50 e 200 do diário usam o histórico completo; aqui só aparece o trecho do gráfico.",
            }));
        }
      }
      const j = [
        ["Tendência", v.tendencia],
        ["Confluências", v.confluencias],
        ["Indicadores", v.indicadores],
        ["Força e volume", v.forca_e_volume],
        ["Zonas de interesse", v.zonas_de_interesse],
        ["Gatilho de compra", v.gatilhos && v.gatilhos.compra],
        ["Gatilho de venda", v.gatilhos && v.gatilhos.venda],
        ["Cenário de alta", v.cenario_alta],
        ["Cenário de baixa", v.cenario_baixa],
      ].filter((k) => rpTexto(k[1]).length);
      j.length &&
        (e.h2("Análise detalhada", null, 50),
        j.forEach(([k, A]) => {
          (e.h3(k), e.para(rpTexto(A)));
        }));
    }),
    rpRiscos(e, s),
    rpConclusao(e, s, m),
    rpFim(e, t, s));
}
function rpGen(e, t, a) {
  const { C: o } = e,
    s = t.relatorio || {};
  rpCapa(e, {
    tipo: a.tipo,
    titulo: a.alvo,
    sub: "",
    rec: s.vies ? "Viés: " + s.vies : "",
    recCor: rpRecCor(e, s.vies),
    data: a.data,
  });
  const n = Array.isArray(s.posicoes) ? s.posicoes : null;
  (Object.entries(s).forEach(([r, i]) => {
    if (r === "posicoes" || r === "vies" || i == null || i === "") return;
    const l = rpTexto(i);
    l.length && (e.h2(rpRotulo(r)), Array.isArray(i) ? e.bul(l) : e.para(l));
  }),
    n &&
      n.length &&
      (e.h2("Posições"),
      n.forEach((r) => {
        const i = r.ativo || r.ticker || "";
        e.caixa(
          i + (r.acao_sugerida ? " · " + r.acao_sugerida : ""),
          Object.entries(r)
            .filter(([l]) => !["ativo", "ticker", "acao_sugerida"].includes(l))
            .flatMap(([l, d]) => rpTexto(d).map((c) => rpRotulo(l) + ": " + c)),
          { barra: rpRecCor(e, r.acao_sugerida) },
        );
      })),
    rpFim(e, t, {}));
}
async function rpGera(e, t, a) {
  const o = await rpLib(),
    s =
      {
        fun: "Relatório fundamentalista",
        tec: "Relatório técnico",
        pos: "Revisão das posições",
        img: "Leitura do gráfico",
      }[e] || "Relatório",
    n = await rpNovo(o, {
      ...a,
      titulo: `${s} · ${a.alvo}`,
      cabecalho: `${s} · ${a.alvo}`,
      tipo: s,
    });
  if (Array.isArray(a.prints) && a.prints.length) {
    a.imgs = [];
    for (const r of a.prints)
      try {
        const i = atob(r.b64),
          l = new Uint8Array(i.length);
        for (let d = 0; d < i.length; d++) l[d] = i.charCodeAt(d);
        a.imgs.push({ tf: r.tf, img: await n.doc.embedJpg(l) });
      } catch {}
  }
  return (
    e === "fun"
      ? rpFun(n, t, a)
      : e === "tec"
        ? rpTec(n, t, a)
        : rpGen(n, t, { ...a, tipo: s }),
    rpRodape(n),
    await n.doc.save()
  );
}
async function rpPrevia(e) {
  const t = document.getElementById("pdfprev");
  if (t)
    try {
      const a = await (
        await ntLib()
      ).getDocument({
        data: e.slice(),
        isEvalSupported: !1,
        enableScripting: !1,
      }).promise;
      t.innerHTML = "";
      const o = Math.min(820, innerWidth - 28);
      for (let s = 1; s <= a.numPages; s++) {
        const n = await a.getPage(s),
          r = n.getViewport({ scale: 1 }),
          i = (o / r.width) * (devicePixelRatio > 1 ? 2 : 1),
          l = n.getViewport({ scale: i }),
          d = document.createElement("canvas");
        if (
          ((d.width = l.width),
          (d.height = l.height),
          (d.style.cssText = `width:${o}px;display:block;margin:0 auto 14px;box-shadow:0 2px 10px rgba(0,0,0,0.18);border-radius:8px;background:#ffffff`),
          t.appendChild(d),
          await n.render({ canvasContext: d.getContext("2d"), viewport: l })
            .promise,
          !document.getElementById("pdfprev"))
        )
          return;
      }
    } catch {
      t.innerHTML =
        '<div style="padding:30px 10px;text-align:center;color:#6d737e;font-size:14px">PDF pronto. A prévia não abriu aqui, mas o arquivo está certo: toque em "Salvar / compartilhar".</div>';
    }
}
{
  const e = anxPdf;
  anxPdf = async function () {
    const t = ANX.m,
      a = ANX.mk,
      o = (ANX.tkA || "").trim().toUpperCase(),
      s =
        t === "img"
          ? "img"
          : t === "pos"
            ? "pos"
            : o
              ? "tk:" + o + ":" + t
              : a + ":" + t,
      n = ANX.res && ANX.res[s];
    if (!n || !n.relatorio) return e();
    try {
      anxConserta(n);
    } catch {}
    const r = Array.isArray(n.ativos) ? n.ativos : [],
      i =
        t === "img"
          ? String((n.relatorio && n.relatorio.ativo_lido) || "foto do gráfico")
          : t === "pos"
            ? "posições abertas"
            : o || (r.length === 1 ? r[0].tk : "carteira " + a),
      l =
        {
          tec: "técnico",
          fun: "fundamentalista",
          pos: "das posições abertas",
          img: "do gráfico",
        }[t] || "",
      d = "Relatório " + l + " · " + i,
      c = document.getElementById("pdfov");
    if ((c && c.remove(), !TraderStyles.find("pdfcss2"))) {
      const m = TraderStyles.slot("legacy-121");
      ((m.id = "pdfcss2"),
        (m.textContent = TraderStyles.css("legacy-121")),
        TraderStyles.mount(m));
    }
    const p = (PDFB = {
        tt: d,
        busy: 1,
        blob: null,
        msg: "Montando o PDF…",
        name:
          [
            "relatorio",
            {
              tec: "tecnico",
              fun: "fundamentalista",
              pos: "posicoes",
              img: "grafico",
            }[t],
            t === "img" || t === "pos" ? "" : i.replace(/\s+/g, "-"),
            loc().slice(0, 10),
          ]
            .filter(Boolean)
            .join("-") + ".pdf",
      }),
      u = document.createElement("div");
    ((u.id = "pdfov"),
      (u.innerHTML =
        '<div class="pvbar" id="pdfbar"></div><div id="pdfst"></div><div id="pdfprev"></div>'),
      u.addEventListener("click", (m) => {
        const f = m.target.closest("[data-pv]");
        if (!f) return;
        const x = f.dataset.pv;
        x === "x" ? pdfClose() : x === "s" && pdfShare();
      }),
      document.body.appendChild(u),
      (document.body.style.overflow = "hidden"),
      (history.state && history.state.pdf) || history.pushState({ pdf: 1 }, ""),
      pdfBar());
    try {
      const m = {};
      if (t === "fun" && !o)
        try {
          anxItens(a).forEach((v) => (m[v.tk] = v.peso));
        } catch {}
      let f = {};
      if ((t === "tec" || t === "fun") && o)
        try {
          await prCarrega();
          const v = PR.v && PR.v[o];
          v &&
            (f = {
              plano: prPlano(o),
              ia: v.ia || null,
              prints: ["M", "W", "D"]
                .filter((g) => v[g])
                .map((g) => ({
                  tf: { M: "Mensal", W: "Semanal", D: "Diário" }[g],
                  b64: v[g].b64,
                })),
            });
        } catch {}
      const x = await rpGera(t, n, {
        ...f,
        alvo: i,
        mk: a,
        pesos: m,
        data:
          "Gerado em " +
          new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
      });
      if (PDFB !== p) return;
      ((p.blob = new Blob([x], { type: "application/pdf" })),
        (p.busy = 0),
        (p.msg =
          'PDF pronto. Toque em "Salvar / compartilhar" e escolha "Salvar em Arquivos".'),
        pdfBar(),
        rpPrevia(x));
    } catch (m) {
      if ((console.error(m), PDFB !== p)) return;
      (u.remove(),
        (PDFB = null),
        (document.body.style.overflow = ""),
        window.toast &&
          toast(
            "PDF novo indisponível (" +
              (m.message || m) +
              "). Usando o modelo simples.",
            4e3,
          ),
        e());
    }
  };
}
function anxHistHtml(e) {
  const t = e && e.hist;
  if (!t) return "";
  let a = "";
  const o = t.checklist,
    s = e.fund || {},
    n = (d) =>
      typeof d == "number"
        ? (d > 0 ? "+" : "") + d.toFixed(2).replace(".", ",") + "%"
        : "–",
    r = t.rentabilidade;
  r &&
    Object.values(r).some((d) => typeof d == "number") &&
    (a += `<div class="ckh"><b>Rentabilidade</b><span class="sm mut">com proventos reinvestidos</span></div><div class="rtg">${[
      ["1 mês", "m1"],
      ["3 meses", "m3"],
      ["1 ano", "a1"],
      ["2 anos", "a2"],
      ["5 anos", "a5"],
      ["10 anos", "a10"],
    ]
      .map(
        ([d, c]) =>
          `<div><small>${d}</small><b class="${typeof r[c] == "number" ? (r[c] >= 0 ? "g" : "r") : "mut"}">${n(r[c])}</b></div>`,
      )
      .join("")}</div>`);
  const i = t.indices;
  if (i && i.ativo && i.ativo.length > 12) {
    const d = (u) => u && [...u].reverse().find((m) => typeof m == "number"),
      c = Math.round((i.meses.length - 1) / 12),
      p = (u) =>
        typeof u == "number"
          ? "R$ " +
            u.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "–";
    a += `<div class="ckh" style="margin-top:14px"><b>R$ 1.000 há ${c} anos viraram</b></div><div class="rtg two" style="margin-top:0">${[
      [e.tk, i.ativo, "#d04e3a"],
      ["CDI", i.cdi],
      ["IPCA", i.ipca],
      [i.nome_indice || "Ibovespa", i.ibov],
    ]
      .map(
        ([u, m, f]) =>
          `<div><small>${esc(u)}</small><b style="${f ? "color:" + f : ""}">${p(d(m))}</b></div>`,
      )
      .join("")}</div>`;
  }
  o &&
    o.itens &&
    o.itens.length &&
    (a += `<div class="ckh" style="margin-top:16px"><b>Checklist do investidor Buy and Hold</b><span class="ckp">${o.pontos} de ${o.itens.length}</span></div><div class="ckl">${o.itens.map((d) => `<div class="cki ${d.ok === !0 ? "ok" : d.ok === !1 ? "no" : "nd"}"><i>${d.ok === !0 ? "✓" : d.ok === !1 ? "" : "?"}</i><div><b>${esc(d.criterio)}</b><small>${esc(d.valor)}</small></div></div>`).join("")}</div>`);
  const l = (t.dy_anos || []).filter((d) => typeof d.dy_pct == "number");
  if (l.length >= 2) {
    const d = l.length,
      c = 330 / d,
      p = Math.max(...l.map((v) => v.proventos || 0), 0.01) * 1.2,
      u = Math.max(...l.map((v) => v.dy_pct), 1) * 1.2,
      m = l.filter((v) => !v.parcial).slice(-5),
      f = m.length ? m.reduce((v, g) => v + g.dy_pct, 0) / m.length : null,
      x = l
        .map((v, g) => `${(g + 0.5) * c},${140 - (v.dy_pct / u) * 140 + 14}`)
        .join(" ");
    a += `<div class="ckh" style="margin-top:16px"><b>Histórico de dividendos</b><span class="sm mut"><i class="lg az"></i>R$ por ação <i class="lg ou"></i>DY</span></div><svg viewBox="0 0 330 174" style="width:100%;height:auto">${l
      .map((v, g) => {
        const h = ((v.proventos || 0) / p) * 140,
          b = g * c + c * 0.2,
          y = c * 0.6;
        return `<rect x="${b}" y="${140 - h + 14}" width="${y}" height="${h}" rx="3" fill="#36383e" opacity="${v.parcial ? 0.5 : 1}"/><text x="${b + y / 2}" y="168" font-size="9" text-anchor="middle" fill="currentColor" opacity=".75">${v.ano}${v.parcial ? "*" : ""}</text>`;
      })
      .join(
        "",
      )}<polyline points="${x}" fill="none" stroke="#b88c3a" stroke-width="2"/>${l.map((v, g) => `<circle cx="${(g + 0.5) * c}" cy="${140 - (v.dy_pct / u) * 140 + 14}" r="3" fill="#b88c3a"/><text x="${(g + 0.5) * c}" y="${140 - (v.dy_pct / u) * 140 + 6}" font-size="8.5" font-weight="700" text-anchor="middle" fill="#b88c3a">${v.dy_pct.toFixed(1).replace(".", ",")}%</text>`).join("")}</svg>
    <div class="rtg two"><div><small>Dividend yield atual (12m)</small><b>${typeof s.dividend_yield == "number" ? (s.dividend_yield * 100).toFixed(2).replace(".", ",") + "%" : "–"}</b></div><div><small>Dividend yield médio de 5 anos</small><b>${f != null ? f.toFixed(2).replace(".", ",") + "%" : "–"}</b></div></div>${l.some((v) => v.parcial) ? '<div class="sm mut">* ano em andamento</div>' : ""}`;
  }
  return a ? `<div class="card">${a}</div>` : "";
}
{
  const e = anxFun;
  anxFun = function (t, ...a) {
    let o = e(t, ...a);
    try {
      const s = Array.isArray(t.ativos) ? t.ativos : [],
        n = s
          .filter((r) => r.hist)
          .map(
            (r) =>
              (s.length > 1 ? `<h3>${esc(r.tk)}</h3>` : "") + anxHistHtml(r),
          )
          .join("");
      if (n) {
        const r = "<h2>Painel fundamentalista</h2>";
        o = o.includes(r)
          ? o.replace(
              r,
              "<h2>Rentabilidade, checklist e dividendos</h2>" + n + r,
            )
          : o + n;
      }
    } catch {}
    return o;
  };
}
(function () {
  const e = TraderStyles.slot("legacy-122");
  ((e.textContent = TraderStyles.css("legacy-122")), TraderStyles.mount(e));
})();
const PR = { v: null, busy: !1, msg: "", ok: "" };
async function prCarrega() {
  if (PR.v) return PR.v;
  try {
    PR.v = (await idb("kv", "get", "anxpr")) || {};
  } catch {
    PR.v = {};
  }
  return PR.v;
}
function prSalva() {
  try {
    idb("kv", "put", PR.v || {}, "anxpr");
  } catch {}
}
const prTk = () => (ANX.tkA || "").trim().toUpperCase(),
  prDe = (e) => (
    (PR.v = PR.v || {}),
    PR.v[e] || (PR.v[e] = { pl: { sd: "C", e: "", st: "", a: ["", "", ""] } })
  );
function prPlano(e) {
  const t = PR.v && PR.v[e];
  if (!t) return null;
  const a = t.pl || {},
    o = (d) => {
      if (d == null || d === "") return null;
      const c = String(d).trim(),
        p = +(/,/.test(c) ? c.replace(/\./g, "").replace(",", ".") : c);
      return isFinite(p) && p > 0 ? p : null;
    },
    s = o(a.e),
    n = o(a.st),
    r = a.sd === "V" ? -1 : 1,
    i = (a.a || [])
      .map(o)
      .filter((d) => d != null && s != null && (d - s) * r > 0);
  if (s == null || n == null || (n - s) * r >= 0 || !i.length) return null;
  const l = Math.abs(s - n);
  return {
    lado: a.sd === "V" ? "VENDA" : "COMPRA",
    entrada: s,
    stop: n,
    alvos: i,
    rr: i.map((d) => +(((d - s) * r) / l).toFixed(2)),
    risco_pct: +((l / s) * 100).toFixed(2),
  };
}
function prHtml() {
  const e = prTk();
  if (!e) return "";
  const t = prDe(e),
    a = t.pl,
    o = prPlano(e),
    s = (r, i) =>
      `<div class="prs">${t[r] ? `<img src="${t[r].url}" alt="Print ${i}"><button class="x" data-pr="del" data-k="${r}" aria-label="Remover">✕</button>` : `<label class="prv">＋<span>${i}</span><input type="file" accept="image/*" hidden data-prf="${r}"></label>`}${t[r] ? `<small>${i}</small>` : ""}</div>`,
    n = (r, i, l) =>
      `<label>${i}<input data-prp="${r}" inputmode="decimal" value="${esc(l || "")}" placeholder="0,00"></label>`;
  return `<div class="card prc"><div class="top"><b>📎 Meus gráficos e meu plano</b><span class="sm mut">opcional · vai para o relatório e o PDF</span></div>
<div class="sm mut" style="margin:4px 0 8px">Mande os prints do TradingView (com o Fibonacci marcado no ponto de entrada) e toque em "Ler meu Fibonacci", ou digite entrada, stop e alvos.</div>
<div class="prg">${s("M", "Mensal")}${s("W", "Semanal")}${s("D", "Diário")}</div>
<button class="btn s" data-pr="fibo" style="width:100%;margin-top:8px"${PR.busy ? " disabled" : ""}>${PR.busy ? "Lendo o Fibonacci…" : "🔎 Ler meu Fibonacci nos prints"}</button>
${PR.msg ? `<div class="warn sm" style="margin-top:6px">${esc(PR.msg)}</div>` : ""}${PR.ok ? `<div class="sm" style="margin-top:6px;color:var(--g)">${esc(PR.ok)}</div>` : ""}
${t.ia && t.ia.explicacao ? `<div class="sm mut" style="margin-top:6px">🤖 ${esc(t.ia.explicacao)}${t.ia.confianca ? ` · confiança ${esc(t.ia.confianca)}` : ""}</div>` : ""}
<div class="g2" style="margin-top:10px"><label>Lado<select data-prp="sd"><option value="C"${a.sd !== "V" ? " selected" : ""}>Compra</option><option value="V"${a.sd === "V" ? " selected" : ""}>Venda</option></select></label>${n("e", "Entrada", a.e)}</div>
<div class="g2">${n("st", "Stop", a.st)}${n("a0", "Alvo 1", a.a[0])}</div><div class="g2">${n("a1", "Alvo 2", a.a[1])}${n("a2", "Alvo 3", a.a[2])}</div>
<div class="sm" id="prrr" style="margin-top:4px">${prRRtxt(o, a)}</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn s" data-pr="olho"${o ? "" : " disabled"}>👀 Levar para Trades de olho</button><button class="btn s" data-pr="limpa">Limpar plano</button></div>
<div class="sm mut" style="margin-top:6px">Com o plano preenchido, o próximo "Atualizar relatório" manda o plano e os prints para a IA analisar ${ANX.m === "fun" ? "como analista fundamentalista (entrada x preço justo e margem de segurança)" : "como analista técnico (o seu Fibonacci, confluências, stop e alvos)"}. Os prints e o plano entram no PDF.</div></div>`;
}
function prRRtxt(e, t) {
  return e
    ? `<span class="g">✓ Plano válido</span> · risco ${String(e.risco_pct).replace(".", ",")}% · ${e.rr.map((a, o) => `alvo ${o + 1} = 1:${String(a.toFixed(1)).replace(".", ",")}`).join(" · ")}`
    : !t || (!t.e && !t.st)
      ? '<span class="mut">Preencha entrada, stop e pelo menos o alvo 1.</span>'
      : '<span class="am">Confira: na compra o stop fica abaixo da entrada e os alvos acima (na venda, o contrário).</span>';
}
{
  const e = vAnalise;
  vAnalise = function () {
    let t = e.apply(this, arguments);
    try {
      if ((ANX.m === "tec" || ANX.m === "fun") && !prTk()) {
        const a =
            '<div class="card prc"><b>📎 Meus gráficos e meu plano</b><div class="sm mut" style="margin-top:4px">Digite o ativo em "Analisar um ativo específico" (ex.: VALE3) para anexar os prints do TradingView com o Fibonacci e montar o seu plano de entrada, stop e alvos.</div></div>',
          o = t.indexOf('data-an="run" data-v="' + ANX.m + '"');
        if (o > 0) {
          const s = t.indexOf("</div>", t.indexOf("</button>", o));
          s > 0 && (t = t.slice(0, s + 6) + a + t.slice(s + 6));
        } else t += a;
      } else if ((ANX.m === "tec" || ANX.m === "fun") && prTk()) {
        if (!PR.v)
          return (
            prCarrega().then(() => {
              tab === "analise" && render();
            }),
            t
          );
        const a = t.indexOf('data-an="run" data-v="' + ANX.m + '"');
        if (a > 0) {
          const o = t.indexOf("</div>", t.indexOf("</button>", a));
          o > 0 && (t = t.slice(0, o + 6) + prHtml() + t.slice(o + 6));
        } else t += prHtml();
      }
    } catch {}
    return t;
  };
}
(document.addEventListener("change", async (e) => {
  const t = e.target.closest("[data-prf]");
  if (t && t.files && t.files[0]) {
    const o = prTk();
    if (!o) return;
    try {
      const s = await anxShrink(t.files[0]);
      ((prDe(o)[t.dataset.prf] = s), prSalva(), (PR.msg = ""));
    } catch {
      PR.msg = "Não consegui ler essa imagem.";
    }
    render();
    return;
  }
  const a = e.target.closest('[data-prp="sd"]');
  if (a) {
    ((prDe(prTk()).pl.sd = a.value), prSalva());
    const o = document.getElementById("prrr");
    o && (o.innerHTML = prRRtxt(prPlano(prTk()), prDe(prTk()).pl));
  }
}),
  document.addEventListener("input", (e) => {
    const t = e.target.closest("[data-prp]");
    if (!t || t.dataset.prp === "sd") return;
    const a = prDe(prTk()).pl,
      o = t.dataset.prp;
    (o[0] === "a" && o.length === 2 ? (a.a[+o[1]] = t.value) : (a[o] = t.value),
      prSalva());
    const s = document.getElementById("prrr");
    s && (s.innerHTML = prRRtxt(prPlano(prTk()), a));
    const n = document.querySelector('[data-pr="olho"]');
    n && (n.disabled = !prPlano(prTk()));
  }),
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-pr]");
    if (!t) return;
    const a = prTk(),
      o = prDe(a),
      s = t.dataset.pr;
    if (s === "del") {
      (delete o[t.dataset.k], prSalva(), render());
      return;
    }
    if (s === "limpa") {
      ((o.pl = { sd: "C", e: "", st: "", a: ["", "", ""] }),
        delete o.ia,
        prSalva(),
        render());
      return;
    }
    if (s === "olho") {
      const n = prPlano(a);
      if (!n) return;
      const r = {
        id: "ol" + uid(),
        a,
        dia: loc().slice(0, 10),
        sd: n.lado === "VENDA" ? "V" : "C",
        tf: "1d",
        e: String(n.entrada).replace(".", ","),
        st: String(n.stop).replace(".", ","),
        al: n.alvos.map((i) => String(i).replace(".", ",")),
        nota: "Plano do Fibonacci (Análise IA)",
        rg: { rr: n.rr[0] >= 2 },
        au: { rr: `Alvo 1 dá 1:${n.rr[0].toFixed(1).replace(".", ",")}` },
        arq: !1,
        u: Date.now(),
      };
      ((S.olho = [...(S.olho || []), r]),
        save(),
        window.toast && toast("Levado para Trades de olho (Ao vivo)."));
      return;
    }
    if (s === "fibo") {
      const n = ["M", "W", "D"]
        .filter((r) => o[r])
        .map((r) => ({
          tf: { M: "mensal", W: "semanal", D: "diário" }[r],
          mime: "image/jpeg",
          data: o[r].b64,
        }));
      if (!n.length) {
        ((PR.msg = "Mande pelo menos um print com o Fibonacci marcado."),
          render());
        return;
      }
      ((PR.busy = !0), (PR.msg = ""), (PR.ok = ""), render());
      try {
        const r = await anxCall({ modo: "fibo", tk: a, imgs: n }),
          i = r.leitura || {},
          l = r.plano || {},
          d = (c) => (c == null ? "" : String(c).replace(".", ","));
        (l.valido
          ? ((o.pl = {
              sd: l.lado === "VENDA" ? "V" : "C",
              e: d(l.entrada),
              st: d(l.stop),
              a: [0, 1, 2].map((c) => d(l.alvos[c])),
            }),
            (PR.ok =
              "Plano lido do seu Fibonacci. Confira os números antes de usar."))
          : ((o.pl = {
              sd: /VEND/i.test(i.lado || "") ? "V" : "C",
              e: d(i.entrada),
              st: d(i.stop),
              a: [0, 1, 2].map((c) => d((i.alvos || [])[c])),
            }),
            (PR.msg =
              "A IA leu o gráfico, mas o plano ficou incompleto (" +
              (l.erro || "confira") +
              "). Ajuste os números.")),
          (o.ia = {
            explicacao: i.explicacao || "",
            confianca: i.confianca || "",
            avisos: Array.isArray(i.avisos) ? i.avisos.filter(Boolean) : [],
            niveis: Array.isArray(i.niveis_lidos) ? i.niveis_lidos : [],
            tf: i.tempo_grafico_usado || "",
          }),
          prSalva());
      } catch (r) {
        PR.msg = "Não consegui ler o Fibonacci: " + (r.message || r);
      }
      ((PR.busy = !1), render());
      return;
    }
  }));
{
  const e = anxCall;
  anxCall = async function (t, ...a) {
    try {
      if (
        t &&
        (t.modo === "tecnica" || t.modo === "fundamentalista") &&
        t.avulso
      ) {
        await prCarrega();
        const o = String(
            (t.itens && t.itens[0] && t.itens[0].tk) || "",
          ).toUpperCase(),
          s = prPlano(o),
          n = PR.v && PR.v[o];
        s &&
          (t = {
            ...t,
            meu_plano: s,
            prints: ["M", "W", "D"]
              .filter((r) => n && n[r])
              .map((r) => ({
                tf: { M: "mensal", W: "semanal", D: "diário" }[r],
                data: n[r].b64,
              })),
            ...(n && n.ia
              ? {
                  meu_fibo: {
                    explicacao: n.ia.explicacao || "",
                    niveis: n.ia.niveis || [],
                  },
                }
              : {}),
          });
      }
    } catch {}
    return e(t, ...a);
  };
}
((function () {
  const e = TraderStyles.slot("legacy-123");
  ((e.textContent = TraderStyles.css("legacy-123")), TraderStyles.mount(e));
})(),
  document.addEventListener("change", (e) => {
    e.target &&
      e.target.id === "anx_ta" &&
      (ANX.m === "tec" || ANX.m === "fun") &&
      ((ANX.tkA = e.target.value.replace(/[^A-Za-z0-9.\-]/g, "")), render());
  }),
  document.addEventListener("keydown", (e) => {
    e.key === "Enter" &&
      e.target &&
      e.target.id === "anx_ta" &&
      e.target.blur();
  }));
function anxPlanoHtml(e, t) {
  try {
    const a = (e && e.relatorio) || {},
      o = e && e.meu_plano;
    if (!o) return "";
    const s = (Array.isArray(a.ativos) ? a.ativos : [])[0] || {},
      n = t ? s.plano_do_investidor : s.plano_do_trader;
    if (!n) return "";
    const r = (d) =>
        typeof d == "number"
          ? d.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "–",
      i = n.nota_do_setup || n.nota_do_plano || "",
      l = t
        ? [
            ["Entrada x valor", n.entrada_x_valor],
            ["Alvos x valor", n.alvos_x_valor],
            ["Stop x tese", n.stop_x_tese],
            ["Dividendos no caminho", n.dividendos_no_caminho],
            ["Horizonte", n.horizonte],
          ]
        : [
            ["Leitura do Fibonacci", n.leitura_do_fibonacci],
            ["Confluências", n.confluencias],
            ["Contexto multi-tempo", n.contexto_multitempo],
            ["Entrada e gatilho", n.entrada],
            ["Stop", n.stop],
            ["Alvos", n.alvos],
            ["Gestão do trade", n.gestao],
          ];
    return `<h2>${t ? "Análise do seu plano" : "Análise do seu Fibonacci"}</h2><div class="card"><div class="top"><b>${o.lado === "VENDA" ? "Venda" : "Compra"} · entrada ${r(o.entrada)} · stop ${r(o.stop)} · alvos ${o.alvos.map(r).join(" / ")}</b>${i ? `<span class="ckp">Nota ${esc(i)}</span>` : ""}</div>
  ${l
    .filter((d) => d[1])
    .map(
      ([d, c]) =>
        `<div class="sm" style="margin-top:8px"><b>${d}:</b> ${esc(typeof c == "string" ? c : JSON.stringify(c))}</div>`,
    )
    .join("")}
  ${Array.isArray(n.a_favor) && n.a_favor.length ? `<div class="sm" style="margin-top:8px"><b class="g">A favor:</b> ${n.a_favor.map(esc).join(" · ")}</div>` : ""}${Array.isArray(n.contra) && n.contra.length ? `<div class="sm" style="margin-top:4px"><b class="r">Contra:</b> ${n.contra.map(esc).join(" · ")}</div>` : ""}
  ${n.ajuste_sugerido && !/^nenhum/i.test(n.ajuste_sugerido) ? `<div class="warn sm" style="margin-top:8px">Ajuste sugerido: ${esc(n.ajuste_sugerido)}</div>` : ""}${n.conclusao ? `<div style="margin-top:8px"><b>${esc(n.conclusao)}</b></div>` : ""}</div>`;
  } catch {
    return "";
  }
}
{
  const e = anxTec;
  anxTec = function (t, ...a) {
    const o = e(t, ...a);
    return anxPlanoHtml(t, !1) + o;
  };
}
{
  const e = anxFun;
  anxFun = function (t, ...a) {
    const o = e(t, ...a);
    return anxPlanoHtml(t, !0) + o;
  };
}
(addEventListener("pagehide", () => {
  LOCAL_SAVE.pending && persistNow();
}),
  document.addEventListener("visibilitychange", () => {
    document.hidden && LOCAL_SAVE.pending && persistNow();
  }),
  document.addEventListener("input", (e) => {
    const t = e.target.closest && e.target.closest('[data-pl2="txt"]');
    if (!t) return;
    const a = plDia();
    ((a.txt = t.value), save());
  }));
try {
  Object.assign(FN_ESPERADA, {
    analise: "v282",
    notificar: "v282",
    terminal: "v305",
    candles: "v305",
  });
} catch {}
