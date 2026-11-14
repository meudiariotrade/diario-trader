function vEco(e) {
  return `<div class="card"><div class="top"><b>🎓 Economista IA</b>${ECO.l.length ? '<button class="btn s" data-eco="limpa">Limpar</button>' : ""}</div>${e}
  <div class="sm mut">Economista com formação de mestrado e doutorado, sem viés político. Cole uma notícia (texto ou link) ou pergunte sobre cenários: ele confirma os fatos na internet, explica o mecanismo, mostra o efeito no Ibovespa, dólar e DI e monta cenários com probabilidade.</div>
  <textarea id="eco_tx" rows="4" placeholder="Ex.: cole aqui a notícia ou o link, ou pergunte: o que muda para o WDO se o Fed cortar juros?" style="width:100%;margin-top:8px">${esc(ECO.rascunho)}</textarea>
  <button class="btn" data-eco="vai" style="width:100%;margin-top:6px"${ECO.busy ? " disabled" : ""}>${ECO.busy ? "Pensando… (pode levar até 1 minuto, deixe a tela acesa)" : "Perguntar ao economista"}</button>
  ${ECO.err ? `<div class="sm r" style="margin-top:6px">${esc(ECO.err)}</div>` : ""}
  ${ECO.l.length ? "" : `<div class="sm mut" style="margin-top:10px">Sugestões:</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${ECO_SUG.map((t) => `<button class="btn s" data-eco="sug" style="text-align:left">${esc(t)}</button>`).join("")}</div>`}
  <div class="sm mut" style="margin-top:8px">Explica e mostra cenários; não diz para comprar ou vender. Conta no limite diário de análises da IA.</div></div>
  ${ECO.l.slice().reverse().map(ecoResp).join("")}`;
}
{
  const e = HUB_M.findIndex((t) => t[0] === "mercado:nt");
  HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, [
    "mercado:eco",
    "Economista IA",
  ]);
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "eco" ? e.apply(this, arguments) : vEco("");
  };
}
async function rpEco(e) {
  const t = await rpLib(),
    a = e.r || {},
    o = "Gerado em " + rpAgora(),
    s = await rpNovo(t, {
      titulo: "Economista IA · " + (a.titulo || ""),
      cabecalho: "Economista IA · " + (a.titulo || ""),
      tipo: "Análise econômica",
      data: o,
    }),
    n = a.titulo && s.wd(a.titulo, 30, "b") <= s.W - 2 * s.M - 170;
  return (
    rpCapa(s, {
      tipo: "Análise econômica · Economista IA",
      titulo: n ? a.titulo : "Análise econômica",
      sub: n ? "" : a.titulo || "",
      rec: "Confiança " + (a.confianca || "–"),
      recCor:
        a.confianca === "alta"
          ? s.C.g
          : a.confianca === "média"
            ? s.C.am
            : s.C.r,
      data: o,
    }),
    s.caixa("Pergunta", [e.q.length > 900 ? e.q.slice(0, 900) + "…" : e.q], {
      barra: s.C.mut,
    }),
    a.resumo && s.caixa("Resumo", [a.resumo], { barra: s.C.ac }),
    a.explicacao &&
      a.explicacao.length &&
      (s.h2("Explicação"), s.para(a.explicacao)),
    a.fatos && a.fatos.length && (s.h2("Fatos confirmados"), s.bul(a.fatos)),
    a.impactos &&
      a.impactos.length &&
      (s.h2("Efeito nos mercados"),
      s.tab(
        [
          { l: "Mercado", w: 24 },
          { l: "Direção", w: 12 },
          { l: "Por quê", w: 64 },
        ],
        a.impactos.map((r) => [
          { t: r.mercado, f: "b" },
          {
            t: r.direcao,
            f: "b",
            c:
              r.direcao === "alta"
                ? s.C.g
                : r.direcao === "baixa"
                  ? s.C.r
                  : s.C.am,
          },
          r.porque,
        ]),
      )),
    a.cenarios &&
      a.cenarios.length &&
      (s.h2("Cenários"),
      rpBarras(s, {
        itens: a.cenarios.map((r) => ({
          l: r.nome,
          v: r.probabilidade_pct,
          c: /otim/i.test(r.nome)
            ? s.C.g
            : /pess/i.test(r.nome)
              ? s.C.r
              : s.C.ac,
          txt: r.probabilidade_pct + "%",
        })),
        max: 100,
        lw: 110,
      }),
      a.cenarios.forEach((r) =>
        s.caixa(
          `${r.nome} · ${r.probabilidade_pct}%`,
          [
            r.descricao,
            ...(r.gatilhos
              ? [{ t: "Confirma se: " + r.gatilhos, f: "i" }]
              : []),
          ],
          {
            barra: /otim/i.test(r.nome)
              ? s.C.g
              : /pess/i.test(r.nome)
                ? s.C.r
                : s.C.ac,
          },
        ),
      )),
    a.o_que_observar &&
      a.o_que_observar.length &&
      (s.h2("O que observar"), s.bul(a.o_que_observar)),
    a.visoes &&
      a.visoes.length &&
      (s.h2("Como as escolas leem"),
      a.visoes.forEach((r) => s.para(r.escola + ": " + r.argumento))),
    a.contraponto && s.caixa("Contraponto", [a.contraponto], { barra: s.C.am }),
    a.glossario &&
      a.glossario.length &&
      (s.h2("Glossário"),
      s.bul(a.glossario.map((r) => r.termo + ": " + r.significado))),
    a.fontes && a.fontes.length && s.nota("Fontes: " + a.fontes.join(" · ")),
    rpRodape(s),
    await s.doc.save()
  );
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-eco]");
  if (!t) return;
  const a = t.dataset.eco;
  if (a === "vai") {
    const o = document.getElementById("eco_tx");
    ecoPergunta(o && o.value);
  } else if (a === "sug") {
    const o = document.getElementById("eco_tx");
    (o && (o.value = t.textContent), ecoPergunta(t.textContent));
  } else if (a === "del")
    ((ECO.l = ECO.l.filter((o) => o.id !== t.dataset.v)),
      ecoSalva(),
      ecoPaint());
  else if (a === "limpa")
    confirm("Apagar toda a conversa com o economista?") &&
      ((ECO.l = []), ecoSalva(), ecoPaint());
  else if (a === "pdf") {
    const o = ECO.l.find((s) => s.id === t.dataset.v);
    o &&
      rpAbrir(
        "Economista IA · " + (o.r.titulo || ""),
        "economista-" + loc().slice(0, 10) + ".pdf",
        () => rpEco(o),
      );
  } else if (a === "news") {
    MKT.tab = "eco";
    try {
      ls.set("diario-mkt-tab", "eco");
    } catch {}
    ((ECO.rascunho = ""),
      render(),
      window.scrollTo(0, 0),
      ecoPergunta(
        "Explique esta notícia: " +
          t.dataset.t +
          (t.dataset.l
            ? `
` + t.dataset.l
            : ""),
      ));
  }
});
{
  const e = mkPaint;
  mkPaint = function () {
    e.apply(this, arguments);
    const t = document.getElementById("mknews");
    t &&
      t.querySelectorAll("a.card").forEach((a) => {
        if (
          a.nextElementSibling &&
          a.nextElementSibling.classList.contains("eco-nw")
        )
          return;
        const o = (a.querySelector("div") || a).textContent
            .replace(/^URGENTE/, "")
            .trim(),
          s = document.createElement("div");
        ((s.className = "eco-nw"),
          (s.innerHTML =
            '<button class="btn s" data-eco="news">🎓 Explicar</button>'));
        const n = s.firstChild;
        ((n.dataset.t = o),
          (n.dataset.l = a.getAttribute("href") || ""),
          a.after(s));
      });
  };
}
(function () {
  const e = TraderStyles.slot("legacy-027");
  ((e.textContent = TraderStyles.css("legacy-027")), TraderStyles.mount(e));
})();
const PNL = {
  v: (() => {
    try {
      return ls.get("diario-painel") || null;
    } catch {
      return null;
    }
  })(),
  ts: 0,
  busy: 0,
  err: "",
  sem: (() => {
    try {
      return +ls.get("diario-painel-sem") || 52;
    } catch {
      return 52;
    }
  })(),
  ab: null,
};
async function pnlCarrega(e) {
  if (PNL.busy || (!e && (PNL.v || PNL.err) && Date.now() - PNL.ts < 10 * 6e4))
    return;
  const t = cfg();
  if (!t) {
    PNL.err = "Configure o Supabase na aba Conta.";
    return;
  }
  ((PNL.busy = 1), (PNL.err = ""), pnlPaint());
  try {
    const a = await fetch(t.url + "/functions/v1/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: t.key },
        body: JSON.stringify({ modo: "painel" }),
      }),
      o = await a.json().catch(() => ({}));
    if (!a.ok) throw new Error(o.error || "Erro " + a.status);
    if (!Array.isArray(o.itens))
      throw new Error(
        'Para ver o painel, publique a nova versão da função "macro" no Supabase.',
      );
    ((PNL.v = o), (PNL.ts = Date.now()));
    try {
      ls.set("diario-painel", o);
    } catch {}
  } catch (a) {
    ((PNL.err = String(a.message || a)), (PNL.ts = Date.now() - 8 * 6e4));
  }
  ((PNL.busy = 0), pnlPaint());
}
function pnlPaint() {
  if (tab !== "mercado" || MKT.tab !== "pn") return;
  const e = window.scrollY;
  (render(), window.scrollTo(0, e));
}
const pnlN = (e, t) =>
    e == null || !isFinite(e)
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        }),
  PNL_MES = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
function pnlSvg(e, t, a, o) {
  const s = o ? 340 : 200,
    n = o ? 150 : 84,
    r = 2,
    i = o ? 44 : 34,
    l = 6,
    d = 14,
    c = e.map((k) => k[1]);
  let p = Math.min(...c),
    u = Math.max(...c);
  const m = (u - p) * 0.08 || u * 0.01;
  ((p -= m), (u += m));
  const f = (k) => r + (k / (e.length - 1)) * (s - r - i),
    x = (k) => l + (1 - (k - p) / (u - p)) * (n - l - d),
    v = e
      .map(
        (k, A) => (A ? "L" : "M") + f(A).toFixed(1) + " " + x(k[1]).toFixed(1),
      )
      .join(" "),
    g = Math.abs(u) >= 1e3 ? 0 : Math.abs(u) >= 10 ? 1 : 2,
    h = [u - m, (u + p) / 2, p + m],
    b = [];
  let y = "";
  e.forEach((k, A) => {
    const C = k[0].slice(0, 7);
    C !== y && ((y = C), b.push([A, k[0]]));
  });
  const j = Math.max(1, Math.ceil(b.length / (o ? 6 : 4)));
  return `<svg viewBox="0 0 ${s} ${n}" class="pnl-sv" role="img"><defs><linearGradient id="g${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t}" stop-opacity=".45"/><stop offset="1" stop-color="${t}" stop-opacity=".04"/></linearGradient></defs>
  ${h.map((k) => `<line x1="${r}" x2="${s - i}" y1="${x(k)}" y2="${x(k)}" stroke="var(--bd)" stroke-width=".5"/><text x="${s - i + 3}" y="${x(k) + 3}" font-size="${o ? 8 : 7}" fill="var(--mut)">${pnlN(k, g)}</text>`).join("")}
  <path d="${v} L ${f(e.length - 1)} ${n - d} L ${f(0)} ${n - d} Z" fill="url(#g${a})"/><path d="${v}" fill="none" stroke="${t}" stroke-width="1.2"/>
  ${b
    .filter((k, A) => A % j === 0 && A > 0)
    .map(
      ([k, A]) =>
        `<text x="${f(k)}" y="${n - 3}" font-size="${o ? 8 : 7}" fill="var(--mut)" text-anchor="middle">${PNL_MES[+A.slice(5, 7) - 1]}${A.slice(5, 7) === "01" ? " " + A.slice(2, 4) : ""}</text>`,
    )
    .join("")}</svg>`;
}
function pnlTile(e, t) {
  const a = new Date(Date.now() - PNL.sem * 7 * 864e5)
      .toISOString()
      .slice(0, 10),
    o = e.pts.filter((c) => c[0] >= a);
  if (o.length < 3) return "";
  const s = e.d1 >= 0,
    n = s ? "#2e8b5d" : "#dc3e26",
    r = (o[o.length - 1][1] / o[0][1] - 1) * 100,
    i = PNL.ab === e.s,
    l = !e.d1 && !e.d1abs,
    d = l ? "mut" : s ? "g" : "r";
  return `<div class="pnl-t${i ? " ab" : ""}" data-pnl="${esc(e.s)}"><div class="pnl-h"><span class="pnl-n">${esc(e.n)}</span><span class="pnl-dt">${e.data.slice(8, 10)}/${e.data.slice(5, 7)}</span></div>
  <div class="pnl-px"><b>${pnlN(e.px, e.dp)}</b>${e.un && i ? ` <span class="sm mut">${esc(e.un)}</span>` : ""}</div>
  <div class="pnl-d ${d}">${l ? "●" : s ? "▲" : "▼"} ${pnlN(Math.abs(e.d1abs), e.dp)} · ${(e.d1 > 0 ? "+" : "") + pnlN(e.d1, 2)}%</div>
  ${pnlSvg(o, l ? "#7a808c" : n, t, i)}<div class="pnl-pe">${PNL.sem === 104 ? "2 anos" : PNL.sem + " sem."} <b class="${r >= 0 ? "g" : "r"}">${(r > 0 ? "+" : "") + pnlN(r, 1)}%</b></div></div>`;
}
function vPainelMk() {
  setTimeout(() => pnlCarrega(), 0);
  const e = PNL.v;
  return `<div class="card"><div class="top"><b>📈 Visão geral do mercado</b><button class="btn s" data-pnlb="rf">${PNL.busy ? "…" : "↻ Atualizar"}</button></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${[13, 26, 52, 104].map((t) => `<button class="btn${PNL.sem === t ? "" : " s"}" data-pnlb="sem" data-v="${t}">${t === 104 ? "2 anos" : t === 52 ? "52 semanas" : t + " sem."}</button>`).join("")}</div>
  ${PNL.err ? `<div class="sm am">${esc(PNL.err)}</div>` : ""}<div class="sm mut">Verde ou vermelho pela variação do dia. Toque num gráfico para ampliar.</div></div>
  ${e ? `<div class="pnl-g">${e.itens.map(pnlTile).join("")}</div><div class="sm mut" style="margin:8px 2px">Cotação e variação do dia: ${e.fonte && /TradingView/.test(e.fonte) ? "TradingView (como no Mapa do mercado)" : "Yahoo Finance"}; gráfico com fechamentos diários do Yahoo; minério de Dalian: Sina. Com atraso${e.em ? "; atualizado às " + hm(Date.parse(e.em)) : ""}. Treasury 10 anos em % ao ano.</div>` : PNL.busy ? '<div class="card sm mut">Carregando os gráficos…</div>' : ""}`;
}
{
  const e = HUB_M.findIndex((t) => t[0] === "mercado:mu");
  HUB_M.splice(e < 0 ? 0 : e + 1, 0, ["mercado:pn", "Painel"]);
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "pn" ? e.apply(this, arguments) : vPainelMk();
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pnlb]");
  if (t) {
    if (t.dataset.pnlb === "rf") pnlCarrega(!0);
    else {
      PNL.sem = +t.dataset.v;
      try {
        ls.set("diario-painel-sem", PNL.sem);
      } catch {}
      pnlPaint();
    }
    return;
  }
  const a = e.target.closest("[data-pnl]");
  if (a && tab === "mercado" && MKT.tab === "pn") {
    ((PNL.ab = PNL.ab === a.dataset.pnl ? null : a.dataset.pnl), render());
    const o = document.querySelector(".pnl-t.ab");
    o && o.scrollIntoView({ block: "nearest" });
  }
}),
  (function () {
    const e = TraderStyles.slot("legacy-028");
    ((e.textContent = TraderStyles.css("legacy-028")), TraderStyles.mount(e));
  })());
function olPivos(e, t = 2) {
  const a = [],
    o = [];
  for (let r = t; r < e.length - t; r++) {
    let i = 1,
      l = 1;
    for (let d = r - t; d <= r + t; d++)
      d !== r && (e[d][2] >= e[r][2] && (i = 0), e[d][3] <= e[r][3] && (l = 0));
    (i && a.push({ i: r, v: e[r][2], tipo: "T" }),
      l && o.push({ i: r, v: e[r][3], tipo: "F" }));
  }
  const s = [];
  for (const r of [...a, ...o].sort((i, l) => i.i - l.i)) {
    const i = s[s.length - 1];
    i && i.tipo === r.tipo
      ? (r.tipo === "T" ? r.v > i.v : r.v < i.v) && (s[s.length - 1] = r)
      : (i && i.i === r.i) || s.push(r);
  }
  let n = 1;
  for (; n && s.length >= 4; ) {
    n = 0;
    for (let r = 1; r < s.length - 2; r++) {
      const i = Math.abs(s[r].v - s[r - 1].v);
      if (
        Math.abs(s[r + 1].v - s[r].v) < 0.3 * i &&
        s[r + 1].i - s[r].i < 0.3 * (s[r].i - s[r - 1].i)
      ) {
        const l = s[r + 2],
          d =
            s[r].tipo === "T"
              ? l.v > s[r].v
                ? l
                : s[r]
              : l.v < s[r].v
                ? l
                : s[r];
        (s.splice(r, 3, d), (n = 1));
        break;
      }
    }
  }
  return s;
}
function olDow(e) {
  const t = e.slice(-150),
    a = t.length,
    o = t[a - 1],
    s = +o[4],
    n = olPivos(t),
    r = n.filter((k) => k.tipo === "T"),
    i = n.filter((k) => k.tipo === "F");
  if (a < 15 || r.length < 2 || i.length < 2)
    return {
      tend: "sem dado",
      txt: "Poucos topos e fundos legítimos para ler a tendência.",
    };
  const [l, d] = r.slice(-2),
    [c, p] = i.slice(-2),
    u = (k) => olF(k);
  let m,
    f,
    x = null;
  d.v > l.v && p.v > c.v
    ? ((m = "alta"),
      (f = `Topos (${u(l.v)} → ${u(d.v)}) e fundos (${u(c.v)} → ${u(p.v)}) ascendentes: alta`),
      s < p.v &&
        ((x = "baixa"),
        (f += `, mas o preço perdeu o último fundo (${u(p.v)}): meio sinal de baixa (dilema de topos e fundos)`)))
    : d.v < l.v && p.v < c.v
      ? ((m = "baixa"),
        (f = `Topos (${u(l.v)} → ${u(d.v)}) e fundos (${u(c.v)} → ${u(p.v)}) descendentes: baixa`),
        s > d.v &&
          ((x = "alta"),
          (f += `, mas o preço rompeu o último topo (${u(d.v)}): meio sinal de alta (dilema de topos e fundos)`)))
      : ((m = "lateral"),
        (f = `Sem sequência de topos e fundos na mesma direção: lateral entre ${u(Math.min(c.v, p.v))} e ${u(Math.max(l.v, d.v))}`));
  const v = r[r.length - 1],
    g = i[i.length - 1];
  let h;
  if (g.i > v.i) {
    const k = t.slice(v.i + 1).findIndex((A) => +A[4] > v.v);
    h = {
      tipo: "C",
      nivel: v.v,
      conf: k >= 0,
      ha: k >= 0 ? a - 1 - (v.i + 1 + k) : null,
    };
  } else {
    const k = t.slice(g.i + 1).findIndex((A) => +A[4] < g.v);
    h = {
      tipo: "V",
      nivel: g.v,
      conf: k >= 0,
      ha: k >= 0 ? a - 1 - (g.i + 1 + k) : null,
    };
  }
  const b = t[a - 2],
    y = t[a - 3];
  let j = null;
  return (
    m === "alta" &&
      !x &&
      (j =
        b[2] < y[2] && o[2] > b[2]
          ? { lado: "C", ac: !0, g: b[2] }
          : o[2] < b[2]
            ? { lado: "C", ac: !1, g: o[2] }
            : null),
    m === "baixa" &&
      !x &&
      (j =
        b[3] > y[3] && o[3] < b[3]
          ? { lado: "V", ac: !0, g: b[3] }
          : o[3] > b[3]
            ? { lado: "V", ac: !1, g: o[3] }
            : null),
    { tend: m, meio: x, txt: f, pivo: h, pb: j, s: n, J: t }
  );
}
function olObvRegra(e, t, a) {
  const o = e.length,
    s = e.map((j) => +j[4]),
    n = e.map((j) => +(j[5] || 0));
  if (n.filter((j) => j > 0).length < o * 0.8) return null;
  const r = [0];
  for (let j = 1; j < o; j++)
    r.push(r[j - 1] + (s[j] > s[j - 1] ? n[j] : s[j] < s[j - 1] ? -n[j] : 0));
  const i = a !== "V",
    l = t.filter((j) => j.tipo === (i ? "T" : "F")),
    d = t.filter((j) => j.tipo === (i ? "F" : "T"));
  if (!l.length) return null;
  const c = l[l.length - 1],
    p = d.filter((j) => j.i > c.i).pop(),
    u = d.filter((j) => j.i < c.i).pop(),
    m = i
      ? Math.max(...r.slice(Math.max(0, c.i - 2), c.i + 3))
      : Math.min(...r.slice(Math.max(0, c.i - 2), c.i + 3)),
    f = i ? r[o - 1] > m : r[o - 1] < m,
    x = i ? s[o - 1] > c.v : s[o - 1] < c.v,
    v = p && u ? (i ? r[p.i] > r[u.i] : r[p.i] < r[u.i]) : null,
    g = p && u ? (i ? p.v > u.v : p.v < u.v) : null,
    h = !!(f && v !== !1),
    b = (i ? "topo" : "fundo") + " de " + olF(c.v),
    y =
      f && !x
        ? `OBV já rompeu o ${i ? "topo" : "fundo"} dele antes do preço (${b}): volume antecipando → permite`
        : f && x
          ? `Preço e OBV romperam juntos o ${b} → permite`
          : x
            ? `Preço rompeu o ${b} SEM o OBV romper o dele → não permite (rompimento sem volume)`
            : `Nem preço nem OBV romperam o ${b} ainda → aguardar o OBV`;
  return {
    ok: h,
    txt:
      y +
      (v === !1
        ? ` · o OBV não fez o pivô (${i ? "fundo mais alto" : "topo mais baixo"}) → não permite`
        : v
          ? " · pivô do OBV formado"
          : "") +
      (g === !1 ? " · o preço também não fez o pivô" : ""),
  };
}
{
  const e = olCalc;
  olCalc = function (t, a) {
    const o = e(t, a);
    OL._k = o;
    try {
      const s = (t || [])
        .filter((m) => Array.isArray(m) && m.length >= 5)
        .map((m) => [m[0], +m[1], +m[2], +m[3], +m[4], +(m[5] || 0)]);
      if (s.length < 25) return o;
      const n = olDow(s),
        r = a !== "V";
      if (
        (n.tend !== "sem dado" &&
          ((o.tend = r
            ? n.tend === "alta" && n.meio !== "baixa"
            : n.tend === "baixa" && n.meio !== "alta"),
          (o.txt.tend =
            n.txt +
            (n.meio
              ? " → a tendência segue a anterior até confirmar; cautela"
              : ""))),
        n.s)
      ) {
        const m = olObvRegra(n.J, n.s, a);
        m && ((o.obv = m.ok), (o.txt.obv = m.txt));
      }
      const i = n.pivo,
        l = n.pb,
        d = r ? "C" : "V",
        c = olF;
      let p = !1,
        u = [];
      (i && i.tipo === d
        ? i.conf && i.ha <= 2
          ? ((p = !0),
            u.push(
              `pivô ${r ? "de alta" : "de baixa"} confirmado ${i.ha ? "há " + i.ha + " candle(s)" : "agora"} (${r ? "rompeu o topo" : "perdeu o fundo"} ${c(i.nivel)})`,
            ))
          : i.conf
            ? u.push(`pivô já confirmado há ${i.ha} candles (entrada atrasada)`)
            : u.push(
                `pivô armado: ${r ? "compra com fechamento acima de" : "venda com fechamento abaixo de"} ${c(i.nivel)}`,
              )
        : i &&
          u.push(
            `último pivô é ${i.tipo === "C" ? "de alta" : "de baixa"} (contra o lado do trade)`,
          ),
        l &&
          l.lado === d &&
          (l.ac
            ? ((p = !0),
              u.push(
                `pullback acionado: ${r ? "rompeu a máxima" : "perdeu a mínima"} do candle anterior (${c(l.g)})`,
              ))
            : u.push(
                `pullback armado: gatilho ${r ? "acima da máxima" : "abaixo da mínima"} deste candle (${c(l.g)})`,
              )),
        (o.gat = p),
        (o.txt.gat = u.join(" · ") || "Sem pivô ou pullback a favor agora."));
    } catch {}
    return o;
  };
}
{
  const e = OL_REGRAS.find((a) => a.id === "tend");
  e &&
    (e.t =
      "A favor da tendência (topos e fundos: alta na compra, baixa na venda)");
  const t = OL_REGRAS.find((a) => a.id === "obv");
  (t &&
    (t.t =
      "OBV está permitindo (pivô do OBV rompendo junto com o preço ou antes)"),
    OL_REGRAS.some((a) => a.id === "gat") ||
      OL_REGRAS.splice(2, 0, {
        id: "gat",
        t: "Gatilho do setup: pivô ou pullback acionado",
        auto: "gat",
      }));
}
function olMigra() {
  if (!Array.isArray(S.olR) || !S.olR.length || S.olRv >= 2) return;
  const e = {
    tend: "A favor da tendência (média 20 acima da 50 na compra, abaixo na venda)",
    obv: "OBV está permitindo (confirma a direção)",
  };
  ((S.olR = S.olR.map((t) =>
    e[t.id] && t.t === e[t.id]
      ? { ...t, t: OL_REGRAS.find((a) => a.id === t.id).t }
      : t,
  )),
    S.olR.some((t) => t.id === "gat") ||
      S.olR.splice(Math.min(2, S.olR.length), 0, {
        id: "gat",
        t: "Gatilho do setup: pivô ou pullback acionado",
        auto: "gat",
      }),
    (S.olRv = 2),
    (S.olRu = Date.now()));
  try {
    save();
  } catch {}
}
{
  const e = olHtml;
  olHtml = function () {
    return (olMigra(), e.apply(this, arguments));
  };
}
{
  const e = olAuto;
  olAuto = async function (t) {
    const a = await e(t),
      o = OL._k;
    return (
      o && o.gat != null
        ? ((a.rg.gat = o.gat), (a.au.gat = o.txt.gat))
        : o && o.txt && o.txt.gat && (a.au.gat = o.txt.gat),
      a
    );
  };
}
{
  const e = olForm;
  olForm = function () {
    return e
      .apply(this, arguments)
      .replace(
        "O app confere sozinho OBV, médias, volume e risco/retorno pelos candles do Yahoo (com atraso). As outras você marca.",
        "O app confere sozinho, pelos candles (com atraso): tendência por topos e fundos, a sua regra do OBV, pivô e pullback, média de 20, volume e risco/retorno. As outras você marca.",
      );
  };
}
{
  const e = olRegrasHtml;
  olRegrasHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        "(OBV, médias de 20/50, volume e risco/retorno)",
        "(topos e fundos, regra do OBV, pivô/pullback, média de 20, volume e risco/retorno)",
      );
  };
}
{
  const e = olCard;
  olCard = function (t) {
    return e
      .apply(this, arguments)
      .replace(
        `<button class="btn s" data-ol="reconf" data-id="${esc(t.id)}">`,
        `<button class="btn s" data-olia="${esc(t.id)}">🤖 Analisar com IA</button><button class="btn s" data-ol="reconf" data-id="${esc(t.id)}">`,
      );
  };
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-olia]");
  if (!t) return;
  const a = olLista().find((s) => s.id === t.dataset.olia);
  if (!a) return;
  const o = String(a.a || "").toUpperCase();
  if (
    !(
      /^(BGI|CCM|ICF|WSP|DI1)/.test(o) &&
      !confirm(
        "A análise técnica da IA faz ações, ETFs, FIIs, BDRs, WIN e WDO. Para " +
          o +
          " os dados podem não vir. Tentar mesmo assim?",
      )
    )
  ) {
    try {
      await prCarrega();
      const s = prDe(o);
      ((s.pl = {
        sd: a.sd === "V" ? "V" : "C",
        e: String(a.e ?? ""),
        st: String(a.st ?? ""),
        a: [0, 1, 2].map((n) => String((a.al || [])[n] ?? "")),
      }),
        prSalva());
    } catch {}
    ((tab = "analise"), (ANX.m = "tec"), (ANX.tkA = o), (ANX.msg = ""));
    try {
      ls.set("diario-tab", "analise");
    } catch {}
    (irPara(tab), scrollTo(0, 0), setTimeout(() => anxRun("tec"), 50));
  }
});
function pnlAuto() {
  typeof PNL > "u" ||
    tab !== "mercado" ||
    MKT.tab !== "pn" ||
    document.hidden ||
    PNL.busy ||
    (Date.now() - (PNL.ts || 0) >= 5 * 6e4 && pnlCarrega(!0));
}
(setInterval(pnlAuto, 3e4),
  document.addEventListener("visibilitychange", () => {
    document.hidden || setTimeout(pnlAuto, 800);
  }));
{
  const e = vPainelMk;
  vPainelMk = function () {
    return e
      .apply(this, arguments)
      .replace(
        "Toque num gráfico para ampliar.",
        "Toque num gráfico para ampliar. Atualiza sozinho a cada 5 minutos com a tela aberta.",
      );
  };
}
const FN_ESPERADA = {
    macro: "v181",
    analise: "v180",
    notificar: "v181",
    ewz: "v165",
    juros: "v124",
    radar: "v138",
  },
  fnEsp = (e) => FN_ESPERADA[e] || FN_VERSAO;
sysTesta = async function (e) {
  const t = cfg();
  !t ||
    SYS.busy ||
    ((SYS.busy = 1),
    e || render(),
    (SYS.res = await Promise.all(
      FN_LISTA.map(async ([a, o]) => {
        const s = fnEsp(a);
        try {
          const n = await fetch(t.url + "/functions/v1/" + a + "?versao=1", {
            headers: { apikey: t.key },
          });
          let r = null;
          try {
            r = JSON.parse(await n.text());
          } catch {}
          if (n.ok && r && r.versao) {
            const i = (l) => +String(l).replace(/\D/g, "") || 0;
            return i(r.versao) >= i(s)
              ? { f: a, l: o, st: "ok", msg: "Atualizada (" + r.versao + ")." }
              : {
                  f: a,
                  l: o,
                  st: "velha",
                  msg: `Publicada a ${r.versao}; a nova é a ${s}. Apague o código no Supabase e cole o arquivo ${a}-index.ts mais recente.`,
                };
          }
          return n.status === 404
            ? {
                f: a,
                l: o,
                st: "nao",
                msg: "Não existe no Supabase com esse nome. Crie a função com o nome exato.",
              }
            : {
                f: a,
                l: o,
                st: "velha",
                msg: "Publicada, mas é uma versão antiga. Cole o arquivo novo.",
              };
        } catch {
          return {
            f: a,
            l: o,
            st: "sem",
            msg: "Não respondeu: a função não foi publicada, o nome está diferente, ou o ALLOWED_ORIGINS não bate com o endereço do app.",
          };
        }
      }),
    )),
    (SYS.busy = 0),
    (SYS.em = Date.now()),
    render());
};
{
  const e = vStatus;
  vStatus = function () {
    return e.apply(this, arguments).replace(
      `funções esperadas: <b>${FN_VERSAO}</b>`,
      `funções esperadas: <b>${Object.entries(FN_ESPERADA)
        .map(([t, a]) => t + " " + a)
        .join(" · ")} · demais ${FN_VERSAO}</b>`,
    );
  };
}
const OL_PV = { WIN: 0.2, IND: 1, WDO: 10, DOL: 50, BIT: 0.01 };
function olTamanho(e) {
  try {
    const t = olN(e.e),
      a = olN(e.st);
    if (t == null || a == null || t === a) return "";
    const o = (e.tf || "1d") === "1d" ? "S" : "D",
      s = +gv("ct", "cap", "") || +capRef(o) || 0,
      n = +gv("ct", "pct", "") || 1;
    if (!(s > 0))
      return '<div class="sm mut" style="margin-top:4px">Tamanho da posição: informe seu capital e o risco por trade (Ferramentas → Contratos / risco).</div>';
    const r = String(e.a || "")
        .toUpperCase()
        .slice(0, 3),
      i = OL_PV[r] || 1,
      l = !!OL_PV[r],
      d = (s * n) / 100,
      c = Math.abs(t - a) * i,
      p = Math.floor(d / c),
      u = l ? "contrato(s)" : "ações",
      m = !l && /\d/.test(e.a) ? Math.floor(p / 100) * 100 : null;
    return p < 1
      ? `<div class="sm am" style="margin-top:4px">Tamanho da posição: o stop (${money(c)} por ${l ? "contrato" : "ação"}) é maior que o seu risco por trade (${money(d)}). Diminua o stop ou não opere.</div>`
      : `<div class="sm" style="margin-top:4px">📏 Tamanho: <b>${p.toLocaleString("pt-BR")} ${u}</b>${m != null && m !== p ? ` <span class="mut">(lote padrão ${m.toLocaleString("pt-BR")}, o resto no fracionário)</span>` : ""} <span class="mut">· risco ${money(p * c)} de ${money(d)} (${String(n).replace(".", ",")}% de ${money(s)})</span></div>`;
  } catch {
    return "";
  }
}
{
  const e = olCard;
  olCard = function (t) {
    const a = e.apply(this, arguments),
      o = olTamanho(t);
    return o
      ? a.replace('<details class="olr">', o + '<details class="olr">')
      : a;
  };
}
OL._last = OL._last || {};
{
  const e = olCalc;
  olCalc = function (t, a) {
    try {
      const s = OL._tk,
        n = s && typeof lvQ == "function" ? lvQ(s) : null;
      if (n && !n.d && +n.ult > 0 && Array.isArray(t) && t.length) {
        t = t.slice();
        const r = t[t.length - 1].slice(),
          i = +n.ult;
        ((r[4] = i),
          (r[2] = Math.max(+r[2], i)),
          (r[3] = Math.min(+r[3], i)),
          (t[t.length - 1] = r),
          (OL._vivo = 1));
      } else OL._vivo = 0;
    } catch {}
    const o = e.call(this, t, a);
    try {
      const s = (t || [])
        .filter((n) => Array.isArray(n) && n.length >= 5)
        .map((n) => [n[0], +n[1], +n[2], +n[3], +n[4], +(n[5] || 0)]);
      if (s.length >= 25) {
        const n = olDow(s),
          r = a === "V" ? "V" : "C";
        ((o.gl = null),
          (o.glt = ""),
          n.pb && n.pb.lado === r && !n.pb.ac
            ? ((o.gl = n.pb.g), (o.glt = "pullback"))
            : n.pivo &&
              n.pivo.tipo === r &&
              !n.pivo.conf &&
              ((o.gl = n.pivo.nivel), (o.glt = "pivô")),
          (o.setup =
            n.pb && n.pb.lado === r
              ? "Pullback"
              : n.pivo && n.pivo.tipo === r
                ? "Pivô"
                : null));
      }
    } catch {}
    return o;
  };
}
{
  const e = olAuto;
  olAuto = async function (t) {
    OL._tk = String(t.a || "").toUpperCase();
    const a = await e(t),
      o = OL._k;
    return (
      o &&
        ((a.gl = o.gl || null),
        (a.glt = o.glt || ""),
        (a.setup = o.setup || null),
        (OL._last[OL._tk + "|" + (t.sd === "V" ? "V" : "C")] = {
          gl: a.gl,
          glt: a.glt,
          setup: a.setup,
        })),
      OL._vivo &&
        (a.msg =
          (a.msg || "") + " Último candle com o preço ao vivo do Profit."),
      a
    );
  };
}
function olGuardaGatilho(e) {
  const t =
    OL._last[
      String(e.a || "").toUpperCase() + "|" + (e.sd === "V" ? "V" : "C")
    ];
  t && ((e.gl = t.gl), (e.glt = t.glt), t.setup && (e.setup = t.setup));
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest('[data-ol="salva"],[data-ol="reconf"]');
  t &&
    setTimeout(
      () => {
        try {
          let a = 0;
          (olLista().forEach((o) => {
            const s = JSON.stringify([o.gl, o.glt, o.setup]);
            (olGuardaGatilho(o),
              s !== JSON.stringify([o.gl, o.glt, o.setup]) && (a = 1));
          }),
            a && save());
        } catch {}
      },
      t.dataset.ol === "reconf" ? 4e3 : 300,
    );
}),
  (OL.rcTs = 0));
async function olReconfere() {
  if (
    tab !== "live" ||
    document.hidden ||
    OL.busy ||
    OL.ed ||
    OL.rc ||
    !cfg() ||
    !SESS ||
    Date.now() - OL.rcTs < 5 * 6e4
  )
    return;
  const e = new Date().getDay();
  if (e === 0 || e === 6) return;
  const t = olLista()
    .filter((a) => !a.arq && a.a && olN(a.e) != null)
    .slice(0, 8);
  if (t.length) {
    ((OL.rc = 1), (OL.rcTs = Date.now()));
    for (const a of t)
      try {
        const o = await olAuto(a),
          s = olAplica(a.rg || {}, o);
        Object.assign(a, {
          rg: s.rg,
          au: { ...(a.au || {}), ...s.au },
          auEm: Date.now(),
          gl: o.gl,
          glt: o.glt,
          setup: o.setup || a.setup,
        });
      } catch {}
    OL.rc = 0;
    try {
      save();
    } catch {}
    (olPintaAuto(), olPushSync());
  }
}
setInterval(olReconfere, 6e4);
try {
  typeof NP < "u" && NP.on && NP.on.ol === void 0 && (NP.on.ol = !0);
} catch {}
function olAlvos() {
  const e = diasMais(loc().slice(0, 10), -15);
  return olLista()
    .filter(
      (t) => !t.arq && t.a && olN(t.e) != null && String(t.dia || "") >= e,
    )
    .map((t) => ({
      id: String(t.id),
      a: String(t.a).toUpperCase(),
      sd: t.sd === "V" ? "V" : "C",
      e: olN(t.e),
      st: olN(t.st),
      gl: t.gl != null ? +t.gl : null,
      glt: t.glt || "",
    }))
    .slice(0, 20);
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      t.olho = olAlvos();
    } catch {}
    return t;
  };
}
function olPushSync() {
  (clearTimeout(olPushSync._t),
    (olPushSync._t = setTimeout(() => {
      try {
        turnoPushSync(!1);
      } catch {}
    }, 5e3)));
}
document.addEventListener("click", (e) => {
  e.target.closest(
    '[data-ol="salva"],[data-ol="reconf"],[data-ol="arq"],[data-ol="apaga"]',
  ) && setTimeout(olPushSync, 4500);
});
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("ol", "👀 Trades de olho: entrada, gatilho e setup invalidado")}<div class="sm mut" style="margin-bottom:8px">Avisa quando o preço chegar na entrada, passar o gatilho do pivô ou do pullback, ou passar do stop antes de entrar. Usa o Profit e, sem ele, o preço com atraso (dia útil, das 9h50 às 18h10). O gatilho é atualizado quando o app confere o trade.</div>`
    );
  };
}
ST_ABAS.push(["regras", "Minhas regras"]);
function olDoTrade(e) {
  const t = String(e.ativo || "").toUpperCase(),
    a = String(e.dt || "").slice(0, 10),
    o = e.side === "V" ? "V" : "C";
  if (!t || !a) return null;
  let s = null,
    n = 1e9;
  for (const r of S.olho || []) {
    if (
      String(r.a || "").toUpperCase() !== t ||
      (r.sd === "V" ? "V" : "C") !== o ||
      !r.dia
    )
      continue;
    const i = (Date.parse(a) - Date.parse(r.dia)) / 864e5;
    i < -1 || i > 7 || (Math.abs(i) < n && ((n = Math.abs(i)), (s = r)));
  }
  return s;
}
function setupDe(e, t) {
  const a =
    String(e.setup || "") +
    " " +
    String((t && t.setup) || "") +
    " " +
    String((t && t.au && t.au.gat) || "");
  return /pull/i.test(a)
    ? "Pullback"
    : /piv[o\xf4]/i.test(a)
      ? "Pivô"
      : "Outro / sem registro";
}
function vVantagemRegras(e, t) {
  const a = e
      .map((r) => {
        const i = olDoTrade(r);
        return {
          t: r,
          o: i,
          r: r.c && r.c.r != null ? r.c.r : null,
          pl: r.c ? r.c.pl : null,
        };
      })
      .filter((r) => r.pl != null),
    o = (r, i) => {
      const l = new Map();
      a.forEach((c) => {
        const p = i(c);
        p != null && (l.get(p) || l.set(p, []).get(p)).push(c);
      });
      const d = [...l.entries()]
        .map(([c, p]) => {
          const u = p.filter((x) => x.pl > 0).length,
            m = p.filter((x) => x.r != null).map((x) => x.r),
            f = p.reduce((x, v) => x + v.pl, 0);
          return {
            k: c,
            n: p.length,
            ac: u / p.length,
            mr: m.length ? m.reduce((x, v) => x + v, 0) / m.length : null,
            med: f / p.length,
            so: f,
          };
        })
        .sort((c, p) => p.n - c.n);
      return d.length
        ? `<h3 style="margin-top:14px">${r}</h3><table class="tbl"><tr><th></th><th>Nº</th><th>Acerto</th><th>Média × risco</th><th>Média</th><th>Total</th></tr>${d.map((c) => `<tr><td>${esc(c.k)}</td><td>${c.n}</td><td>${pcN(c.ac)}</td><td class="${cls(c.mr)}">${c.mr == null ? "–" : (c.mr > 0 ? "+" : "") + f2(c.mr) + "×"}</td><td class="${cls(c.med)}">${t(c.med)}</td><td class="${cls(c.so)}">${t(c.so)}</td></tr>`).join("")}</table>`
        : "";
    },
    s = a.filter((r) => r.o).length,
    n = (r) => (r === !0 ? "Sim" : r === !1 ? "Não" : null);
  return `<div class="card" style="margin-top:10px"><b>🧪 Sua vantagem pelas suas regras</b>
  <div class="sm mut" style="margin-top:4px">Cada trade fechado é ligado ao trade de olho do mesmo ativo e lado (anotado até 7 dias antes). ${s} de ${a.length} trades têm trade de olho. "Média × risco" = quanto você ganha, em média, para cada 1 real arriscado (precisa do stop no trade): é a expectativa do sistema do Van Tharp. Positivo = a regra está te dando vantagem.</div>
  ${o("Por setup (pivô x pullback)", (r) => setupDe(r.t, r.o))}
  ${o("O OBV permitia? (sua regra)", (r) => (r.o ? n(r.o.rg && r.o.rg.obv) || "Não conferido" : null))}
  ${o("A favor da tendência (topos e fundos)?", (r) => (r.o ? n(r.o.rg && r.o.rg.tend) || "Não conferido" : null))}
  ${o("Gatilho acionado na hora de anotar?", (r) => (r.o ? n(r.o.rg && r.o.rg.gat) || "Não conferido" : null))}
  ${o("Dentro de todas as regras?", (r) => (r.o ? (olVeredito(r.o).st === "ok" ? "Sim" : "Não") : null))}
  ${s < 10 ? '<div class="warn" style="margin-top:10px">Poucos trades ligados a trades de olho. Anote a ideia em Ao vivo → Trades de olho antes de entrar e, no trade, escreva no Setup "Pivô" ou "Pullback": com 20 a 30 trades já dá para ver qual regra realmente funciona para você.</div>' : ""}</div>`;
}
{
  const e = vStats;
  vStats = function () {
    const t = e.apply(this, arguments);
    if (ST.aba !== "regras") return t;
    try {
      const a = stCtx();
      return a.rows.length ? t + vVantagemRegras(a.rows, a.fs) : t;
    } catch (a) {
      return (
        t +
        `<div class="warn">Não consegui montar a tabela: ${esc(a.message || a)}</div>`
      );
    }
  };
}
function olAdx(e, t = 14) {
  if (e.length < t * 3) return null;
  let a = 0,
    o = 0,
    s = 0,
    n = 0,
    r = 0;
  const i = [];
  for (let d = 1; d < e.length; d++) {
    const c = e[d][2] - e[d - 1][2],
      p = e[d - 1][3] - e[d][3],
      u = Math.max(
        e[d][2] - e[d][3],
        Math.abs(e[d][2] - e[d - 1][4]),
        Math.abs(e[d][3] - e[d - 1][4]),
      ),
      m = c > p && c > 0 ? c : 0,
      f = p > c && p > 0 ? p : 0;
    if (d <= t) {
      if (((a += u), (o += m), (s += f), d < t)) continue;
    } else ((a = a - a / t + u), (o = o - o / t + m), (s = s - s / t + f));
    ((n = a ? (100 * o) / a : 0),
      (r = a ? (100 * s) / a : 0),
      i.push(n + r ? (100 * Math.abs(n - r)) / (n + r) : 0));
  }
  if (i.length < t * 2) return null;
  let l = i.slice(0, t).reduce((d, c) => d + c, 0) / t;
  for (let d = t; d < i.length; d++) l = (l * (t - 1) + i[d]) / t;
  return { adx: l, pdi: n, mdi: r };
}
{
  const e = olCalc;
  olCalc = function (t, a) {
    const o = e.apply(this, arguments);
    try {
      const s = (t || [])
        .filter((d) => Array.isArray(d) && d.length >= 5)
        .map((d) => [d[0], +d[1], +d[2], +d[3], +d[4], +(d[5] || 0)]);
      if (s.length < 45) return o;
      const n = olAdx(s);
      if (n && o.txt.tend) {
        const d = n.adx;
        ((o.txt.tend += ` · ADX ${d.toFixed(0)}: ${d < 20 ? "sem força (mercado de lado: cuidado com rompimento falso)" : d < 25 ? "tendência começando (zona cinzenta)" : "tendência forte"}`),
          d < 20 &&
            o.tend &&
            ((o.tend = !1),
            (o.txt.tend += " → não conta como a favor da tendência")));
      }
      const r = olPivos(s.slice(-150)),
        i = r.slice(-3),
        l = a !== "V";
      if (i.length === 3) {
        const [d, c, p] = i;
        if (
          l
            ? d.tipo === "F" && c.tipo === "T" && p.tipo === "F" && p.v > d.v
            : d.tipo === "T" && c.tipo === "F" && p.tipo === "T" && p.v < d.v
        ) {
          const u = Math.abs(c.v - d.v),
            m = l ? 1 : -1,
            f = olF;
          ((o.alvosPivo = [0.618, 1, 1.618].map((x) => c.v + m * x * u)),
            (o.txt.gat =
              (o.txt.gat ? o.txt.gat + " · " : "") +
              `objetivos do pivô (Lemos): ${o.alvosPivo.map(f).join(" / ")}; invalida se ${l ? "perder" : "passar"} ${f(p.v)}`));
        }
      }
    } catch {}
    return o;
  };
}
{
  const e = semPush;
  semPush = function () {
    const t = e.apply(this, arguments);
    try {
      const [a, o] = rng("w0"),
        s = S.trades
          .filter(
            (n) =>
              !isOpen(n) &&
              String(n.dtx || n.dt).slice(0, 10) >= a &&
              String(n.dtx || n.dt).slice(0, 10) <= o,
          )
          .map((n) => {
            const r = olDoTrade(n),
              i = calc(n);
            return { ol: r, r: i.r, pl: i.pl };
          })
          .filter((n) => n.ol && n.pl != null);
      if (s.length) {
        const n = s.filter((c) => olVeredito(c.ol).st === "ok"),
          r = s.filter((c) => olVeredito(c.ol).st !== "ok"),
          i = (c) => {
            const p = c.filter((u) => u.r != null).map((u) => u.r);
            return p.length
              ? (p.reduce((u, m) => u + m, 0) / p.length)
                  .toFixed(1)
                  .replace(".", ",") + "×"
              : "–";
          },
          l = `Regras: dentro ${n.length} (${i(n)}), fora ${r.length} (${i(r)}).`;
        let d = t.corpo.replace(" Toque para fazer a revisão.", "");
        ((d = (d + " " + l + " Toque para fazer a revisão.").trim()),
          (t.corpo = d.length > 240 ? d.slice(0, 237) + "…" : d));
      }
    } catch {}
    return t;
  };
}
const IMG = { busy: 0 };
function imgQ(e) {
  const t = MDO.v && MDO.v.mercados && MDO.v.mercados.grupos;
  if (!t) return null;
  for (const a of t) for (const o of a.itens) if (o.s === e) return o;
  return null;
}
async function imgDados() {
  const e = [];
  ((!MDO.v || !MDO.v.mercados || Date.now() - (MDO.ts || 0) > 3 * 6e4) &&
    e.push(mdoCarrega(!0).catch(() => {})),
    (!AD.data || Date.now() - (AD.data.ts || 0) > 3 * 6e4) &&
      e.push(adrLoad(!0).catch(() => {})),
    await Promise.all(e));
}
function imgDesenha() {
  const e = ((AD.data && AD.data.itens) || [])
      .filter((Ce) => Ce.s !== "EWZ" && AD.list.includes(Ce.s))
      .slice(0, 12),
    t = (Ce) => {
      const Qe = window.TraderAdr.view(Ce).extra;
      return Qe
        ? {
            t:
              (Qe.active ? "" : "últ. ") +
              { overnight: "overnight", pre: "pré", post: "pós" }[Qe.kind] +
              (Qe.at
                ? " " +
                  new Date(Qe.at).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                  })
                : " s/ hora"),
            px: Qe.px,
            chp: Qe.chp,
          }
        : null;
    },
    a = e.some((Ce) => t(Ce)),
    o = 1080,
    s =
      1604 +
      (a ? Math.ceil(e.length / 2) * 22 : 0) +
      (window.TraderPreOpen?.height() || 0),
    n = document.createElement("canvas");
  ((n.width = o), (n.height = s));
  const r = n.getContext("2d"),
    i = "#2e8b5d",
    l = "#dc3e26",
    d = "#7a808c",
    c = "#16171a",
    p = "#efeeeb",
    u = "#ffffff",
    m = "#efeeeb",
    f = (Ce) =>
      Ce == null || !isFinite(Ce)
        ? "–"
        : (Ce > 0 ? "+" : "") +
          (+Ce).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) +
          "%",
    x = (Ce, Qe) =>
      Ce == null || !isFinite(Ce)
        ? "–"
        : (+Ce).toLocaleString("pt-BR", {
            minimumFractionDigits: Qe,
            maximumFractionDigits: Qe,
          }),
    v = (Ce) => (Ce == null ? d : Ce > 0 ? i : Ce < 0 ? l : d),
    g = (Ce, Qe, de, Se = {}) => {
      ((r.font = `${Se.b ? "700" : "500"} ${Se.s || 28}px -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`),
        (r.fillStyle = Se.c || "#17191b"),
        (r.textAlign = Se.al || "left"),
        (r.textBaseline = "alphabetic"),
        r.fillText(Ce, Qe, de));
    },
    h = (Ce, Qe, de, Se, Ve, Je, Ye) => {
      (r.beginPath(),
        r.moveTo(Ce + Ve, Qe),
        r.arcTo(Ce + de, Qe, Ce + de, Qe + Se, Ve),
        r.arcTo(Ce + de, Qe + Se, Ce, Qe + Se, Ve),
        r.arcTo(Ce, Qe + Se, Ce, Qe, Ve),
        r.arcTo(Ce, Qe, Ce + de, Qe, Ve),
        r.closePath(),
        Je && ((r.fillStyle = Je), r.fill()),
        Ye && ((r.strokeStyle = Ye), (r.lineWidth = 2), r.stroke()));
    };
  ((r.fillStyle = p),
    r.fillRect(0, 0, o, s),
    (r.fillStyle = c),
    r.fillRect(0, 0, o, 150),
    (r.fillStyle = i),
    r.fillRect(0, 146, o, 4));
  const b = new Date(),
    y = b.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    }),
    j = b.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  (g("PANORAMA DO MERCADO", 48, 64, { s: 26, b: 1, c: "#66cc99" }),
    g(y.charAt(0).toUpperCase() + y.slice(1) + " · " + j, 48, 112, {
      s: 40,
      b: 1,
      c: u,
    }));
  const k = MDO.v && MDO.v.mercados && MDO.v.mercados.pre;
  if (k) {
    const Ce = { positivo: i, negativo: l, neutro: "#b88c3a" }[k.vies] || d;
    (h(o - 48 - 300, 40, 300, 72, 36, Ce),
      g("Viés " + k.vies, o - 48 - 150, 88, {
        s: 32,
        b: 1,
        c: u,
        al: "center",
      }));
  }
  let A = 180;
  const C = ((AD.data && AD.data.itens) || []).find((Ce) => Ce.s === "EWZ"),
    I = imgQ("EWZ");
  (h(36, A, o - 72, 150, 18, u, m),
    window.TraderAssetIdentity?.draw(r, "EWZ", 64, A + 27, 32),
    g("EWZ", 107, A + 56, { s: 36, b: 1 }),
    g("Brasil em Nova York", 64, A + 96, { s: 24, c: d }));
  const J = C ? window.TraderAdr.view(C).regular.px : I && I.px,
    se = C ? window.TraderAdr.view(C).regular.chp : I && I.d1;
  (g(x(J, 2), o - 64, A + 60, { s: 40, b: 1, al: "right" }),
    g(f(se), o - 64, A + 104, { s: 32, b: 1, c: v(se), al: "right" }));
  const Ie = C && window.TraderAdr.view(C).extra,
    Pe = Ie
      ? {
          tipo:
            Ie.kind === "pre"
              ? "pré-mercado"
              : Ie.kind === "overnight"
                ? "overnight"
                : "pós-mercado",
          px: Ie.px,
          pct: Ie.chp,
        }
      : I && I.ext;
  (Pe &&
    (g(
      `${Pe.tipo === "pré-mercado" ? "Pré-mercado" : Pe.tipo === "overnight" ? "Overnight (24h)" : "Pós-mercado"} ${x(Pe.px, 2)}`,
      64,
      A + 134,
      { s: 24, c: d },
    ),
    g(f(Pe.pct), 420, A + 134, { s: 24, b: 1, c: v(Pe.pct) })),
    (A += 176));
  const Me = ((AD.data && AD.data.itens) || [])
    .filter((Ce) => Ce.s !== "EWZ" && AD.list.includes(Ce.s))
    .slice(0, 12);
  g("ADRs brasileiras", 48, A + 30, { s: 30, b: 1 });
  const ue = Me.some(
    (Ce) => window.TraderAdr.view(Ce).active?.kind === "overnight",
  )
    ? "overnight"
    : Me.length
      ? adState(Me)
      : "closed";
  (g(
    {
      overnight: "overnight · contra fech. regular",
      pre: "pré-mercado",
      reg: "pregão aberto",
      post: "pós-mercado",
      closed: "mercado fechado",
    }[ue] || "",
    o - 48,
    A + 30,
    { s: 24, c: d, al: "right" },
  ),
    (A += 48));
  const ve = (o - 72 - 20) / 2,
    he = a ? 74 : 52,
    we = Math.ceil(Me.length / 2) || 1;
  (h(36, A, o - 72, we * he + 20, 18, u, m),
    Me.forEach((Ce, Qe) => {
      const de = Qe < we ? 0 : 1,
        Se = de ? Qe - we : Qe,
        Ve = 36 + de * (ve + 20),
        Je = A + 20 + Se * he + (a ? 34 : 38);
      (window.TraderAssetIdentity?.draw(r, Ce.s, Ve + 20, Je - 25, 28),
        g(Ce.s, Ve + 57, Je, { s: 28, b: 1 }),
        g(
          window.TraderAdr.price(window.TraderAdr.view(Ce).regular.px),
          Ve + ve - 140,
          Je,
          { s: 26, al: "right" },
        ),
        g(f(window.TraderAdr.view(Ce).regular.chp), Ve + ve - 16, Je, {
          s: 26,
          b: 1,
          c: v(window.TraderAdr.view(Ce).regular.chp),
          al: "right",
        }));
      const Ye = a && t(Ce);
      (Ye &&
        (g(Ye.t, Ve + 24, Je + 27, { s: 20, c: d }),
        g(window.TraderAdr.price(Ye.px), Ve + ve - 140, Je + 27, {
          s: 20,
          c: d,
          al: "right",
        }),
        Ye.chp != null &&
          g(f(Ye.chp), Ve + ve - 16, Je + 27, {
            s: 20,
            b: 1,
            c: v(Ye.chp),
            al: "right",
          })),
        Se < we - 1 &&
          ((r.fillStyle = m),
          r.fillRect(Ve + 20, Je + (a ? 42 : 18), ve - 30, 1)));
    }),
    Me.length || g("Sem cotações das ADRs agora.", 64, A + 56, { s: 26, c: d }),
    (A += we * he + 20 + 28),
    (A += window.TraderPreOpen?.draw(r, o, A) || 0));
  const Be = (Ce, Qe, de, Se, Ve) => {
      g(Ce, de + 12, A + 30, { s: 30, b: 1 });
      const Je = A + 48;
      (h(de, Je, Se, (Ve || Qe.length) * he + 20, 18, u, m),
        Qe.forEach(([Ye, Xe, ot], Ke) => {
          const at = Je + 20 + Ke * he + 38;
          if (
            (window.TraderAssetIdentity?.draw(
              r,
              window.TraderAssetIdentity?.fromLabel(Ye) || Ye,
              de + 23,
              at - 24,
              26,
            ),
            g(Ye, de + 58, at, { s: 26, b: 1 }),
            Xe)
          ) {
            g(x(Xe.px, ot), de + Se - 150, at, {
              s: 24,
              c: "#373a3f",
              al: "right",
            });
            const rt = Xe.juro ? Xe.d1bp : Xe.d1;
            g(
              Xe.juro ? (rt > 0 ? "+" : "") + x(rt, 1) + " pb" : f(rt),
              de + Se - 16,
              at,
              { s: 26, b: 1, c: v(rt), al: "right" },
            );
          } else g("–", de + Se - 16, at, { s: 26, c: d, al: "right" });
          Ke < Qe.length - 1 &&
            ((r.fillStyle = m), r.fillRect(de + 20, at + 18, Se - 40, 1));
        }));
    },
    Ge = (o - 72 - 20) / 2;
  if (
    (Be(
      "Commodities",
      [
        ["Minério SGX", imgQ("TIO=F"), 2],
        ["Minério Dalian", imgQ("DCE:I"), 1],
        ["Petróleo Brent", imgQ("BZ=F"), 2],
        ["Petróleo WTI", imgQ("CL=F"), 2],
      ],
      36,
      Ge,
    ),
    Be(
      "Futuros e dólar",
      [
        ["S&P fut.", imgQ("ES=F"), 2],
        ["Nasdaq fut.", imgQ("NQ=F"), 2],
        ["Dólar", imgQ("BRL=X"), 4],
        ["DXY", imgQ("DX-Y.NYB"), 2],
      ],
      36 + Ge + 20,
      Ge,
    ),
    (A += 48 + 4 * he + 20 + 30),
    Be(
      "Bolsas",
      [
        ["Ibovespa", imgQ("^BVSP"), 0],
        ["Nikkei", imgQ("^N225"), 0],
        ["DAX", imgQ("^GDAXI"), 0],
      ],
      36,
      Ge,
      3,
    ),
    Be(
      "Ouro e cripto",
      [
        ["Ouro", imgQ("GC=F"), 1],
        ["Bitcoin", imgQ("BTC-USD"), 0],
        ["Ethereum", imgQ("ETH-USD"), 2],
      ],
      36 + Ge + 20,
      Ge,
      3,
    ),
    (A += 48 + 3 * he + 20 + 30),
    k && k.itens && k.itens.length && A < s - 150)
  ) {
    const Ce = k.itens.filter((Qe) => Qe.d1 != null).slice(0, 3);
    (g("O que mais pesa na abertura", 48, A + 30, { s: 28, b: 1 }),
      (A += 44),
      Ce.forEach((Qe) => {
        A + 30 > s - 100 ||
          (g(
            "• " +
              String(Qe.n)
                .replace(/\s*\(.*?\)\s*/g, " ")
                .replace(/\s*\xb7.*$/, "")
                .trim()
                .slice(0, 30) +
              ": " +
              f(Qe.d1) +
              " — " +
              Qe.efeito,
            56,
            A + 30,
            { s: 24, c: "#373a3f" },
          ),
          (A += 38));
      }));
  }
  return (
    (r.fillStyle = m),
    r.fillRect(48, s - 84, o - 96, 2),
    g(
      "Fontes: TradingView, Yahoo Finance e Sina (Dalian), com atraso.",
      o / 2,
      s - 50,
      { s: 21, c: d, al: "center" },
    ),
    g(
      "Material informativo, não é recomendação de investimento.",
      o / 2,
      s - 20,
      { s: 21, c: d, al: "center" },
    ),
    window.TraderExportBrand
      ? window.TraderExportBrand.compactPanorama(n, A)
      : n
  );
}
async function imgGera() {
  if (!IMG.busy) {
    ((IMG.busy = 1), window.toast && toast("Montando a imagem…", 1500));
    try {
      await imgDados();
      try {
        // v608: logos oficiais (brapi / TradingView) — 1ª passada lista os ativos, depois carrega e desenha.
        if (window.DiarioLogos) {
          try { imgDesenha(); } catch {}
          await Promise.race([window.DiarioLogos.carregaPendentes(), new Promise((r) => setTimeout(r, 12e3))]);
        }
      } catch {}
      const e = imgDesenha(),
        t = await new Promise((o) => e.toBlob(o, "image/jpeg", 0.92)),
        a =
          "mercado-" +
          loc().slice(0, 10) +
          "-" +
          new Date().toTimeString().slice(0, 5).replace(":", "h") +
          ".jpg";
      ((IMG.blob = t),
        (IMG.nome = a),
        (IMG.legenda = null),
        (IMG.titulo = null),
        imgMostra(URL.createObjectURL(t)));
    } catch (e) {
      alert("Não consegui montar a imagem: " + (e.message || e));
    }
    IMG.busy = 0;
  }
}
function imgMostra(e) {
  const t = document.getElementById("imgov");
  t && t.remove();
  const a = document.createElement("div");
  ((a.id = "imgov"),
    (a.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(13,13,14,0.92);display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px))"),
    (a.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:10px"><button data-img="x" class="imgov-voltar" style="flex:0 0 auto;min-height:44px;padding:12px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:#11141B;color:#ffffff;-webkit-text-fill-color:#ffffff;font-weight:600;font-size:16px;cursor:pointer">← Voltar</button><button data-img="s" style="flex:1;padding:12px;border-radius:12px;border:0;background:#3b3e43;color:#ffffff;font-weight:700;font-size:16px">📤 Compartilhar / salvar</button></div><div style="flex:1;overflow:auto;display:flex;justify-content:center"><img src="${e}" alt="Panorama do mercado" style="max-width:100%;height:auto;border-radius:12px;align-self:flex-start"></div><div style="color:#e9e7e4;font-size:13px;margin-top:8px;text-align:center">No iPhone: Compartilhar → "Salvar imagem" ou mande direto no WhatsApp. Ou segure a imagem para salvar.</div>`),
    a.addEventListener("click", async (o) => {
      const s = o.target.closest("[data-img]");
      if (!s) return;
      if (s.dataset.img === "x") {
        (a.remove(), URL.revokeObjectURL(e));
        return;
      }
      const n = new File([IMG.blob], IMG.nome, { type: "image/jpeg" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [n] })) {
          await navigator.share({
            files: [n],
            title: IMG.titulo || "Panorama do mercado",
            text:
              IMG.legenda ||
              "📊 Panorama do mercado – " +
                new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                }) +
                imgLegenda() +
                (typeof FE < "u" && FE.v && FE.v.ultimo
                  ? " · Estrangeiro na B3 (" +
                    feDia(FE.v.ultimo.d) +
                    "): " +
                    feMi(FE.v.ultimo.est)
                  : ""),
          });
          return;
        }
      } catch (i) {
        if (i && i.name === "AbortError") return;
      }
      const r = document.createElement("a");
      ((r.href = e),
        (r.download = IMG.nome),
        document.body.appendChild(r),
        r.click(),
        r.remove());
    }),
    document.body.appendChild(a));
}
document.addEventListener("click", (e) => {
  e.target.closest("[data-imgger]") && imgGera();
});
{
  const e = mdoPre;
  mdoPre = function (t) {
    const a = e.apply(this, arguments);
    return (
      a &&
      a.replace(
        '<div class="mdo-vies"',
        '<button class="btn s" data-imgger="1" style="width:100%;margin:6px 0">📸 Gerar imagem para o grupo (EWZ, ADRs, minério, petróleo, S&P)</button><div class="mdo-vies"',
      )
    );
  };
}
{
  const e = adrHtml;
  adrHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        "<b>🇧🇷 ADRs brasileiras</b>",
        '<b>🇧🇷 ADRs brasileiras</b> <button class="btn s" data-imgger="1" style="padding:3px 9px;font-size:13px;margin-left:6px">📸 Imagem</button>',
      );
  };
}
const olFmt = (e) =>
  e == null || !isFinite(e) ? "" : String(+(+e).toFixed(4)).replace(".", ",");
function acompPlanos(e) {
  const t = [];
  try {
    const a = e.relatorio || {},
      o = anxArr(e.ativos),
      s = anxAiAtivos(a);
    if (e.meu_plano && o.length === 1) {
      const n = e.meu_plano;
      return (
        t.push({
          tk: o[0].tk,
          sd: n.lado === "VENDA" ? "V" : "C",
          e: n.entrada,
          st: n.stop,
          al: (n.alvos || []).slice(0, 3),
          orig: "seu plano",
        }),
        t
      );
    }
    o.forEach((n) => {
      const r =
          s.find((c) => String(c.ticker || "").toUpperCase() === n.tk) || {},
        i = String(r.vies || "").toUpperCase(),
        l = i === "BAIXA" ? "venda" : i === "ALTA" ? "compra" : null,
        d = l && n.plano && n.plano[l];
      d &&
        d.entrada &&
        d.stop &&
        t.push({
          tk: n.tk,
          sd: l === "venda" ? "V" : "C",
          e: d.entrada,
          st: d.stop,
          al: [d.alvo_1, d.alvo_2].filter(Boolean),
          orig:
            "plano calculado" + (d.atende_3_para_1 ? "" : " (abaixo de 3:1)"),
        });
    });
  } catch {}
  return t;
}
{
  const e = anxTec;
  anxTec = function (t, ...a) {
    const o = e.apply(this, [t, ...a]);
    try {
      const s = acompPlanos(t);
      return s.length
        ? ((ANX._acomp = s),
          o +
            `<div class="card"><b>👀 Acompanhar nos Trades de olho</b><div class="sm mut" style="margin:4px 0 8px">Leva entrada, stop e alvos para Ao vivo → Trades de olho: o app confere as suas regras, avisa no celular quando chegar na entrada e o trade entra na estatística "Minhas regras".</div>${s.map((n, r) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--bd)"><span class="sm"><b>${esc(n.tk)}</b> ${n.sd === "V" ? "venda" : "compra"} · entrada ${olFmt(n.e)} · stop ${olFmt(n.st)} · alvo ${n.al.map(olFmt).join(" / ")} <span class="mut">(${esc(n.orig)})</span></span><button class="btn s" data-acomp="${r}">+ Acompanhar</button></div>`).join("")}</div>`)
        : o;
    } catch {
      return o;
    }
  };
}
(document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-acomp]");
  if (!t) return;
  const a = (ANX._acomp || [])[+t.dataset.acomp];
  if (!a) return;
  if (
    olLista().find(
      (s) =>
        !s.arq &&
        String(s.a).toUpperCase() === a.tk &&
        (s.sd === "V" ? "V" : "C") === a.sd &&
        olN(s.e) === +(+a.e).toFixed(4),
    )
  ) {
    window.toast &&
      toast(a.tk + " já está nos Trades de olho com essa entrada.", 2500);
    return;
  }
  const o = {
    id: "ol" + uid(),
    a: a.tk,
    dia: loc().slice(0, 10),
    sd: a.sd,
    tf: "1d",
    e: olFmt(a.e),
    st: olFmt(a.st),
    al: a.al.map(olFmt).filter(Boolean),
    nota: "Da Análise IA (" + a.orig + ")",
    rg: {},
    au: {},
    u: Date.now(),
  };
  {
    const s = olRR(o);
    s.length &&
      ((o.rg.rr = s[0].rr >= 2),
      (o.au.rr = `Alvo 1 dá 1:${s[0].rr.toFixed(1).replace(".", ",")}`));
  }
  ((S.olho = (S.olho || []).concat(o)),
    save(),
    (t.textContent = "✓ Acompanhando"),
    (t.disabled = !0));
  try {
    const s = await olAuto(o),
      n = olAplica(o.rg || {}, s);
    (Object.assign(o, {
      rg: n.rg,
      au: { ...(o.au || {}), ...n.au },
      auEm: Date.now(),
      gl: s.gl,
      glt: s.glt,
      setup: s.setup || null,
    }),
      save());
  } catch {}
  (olPushSync(),
    window.toast &&
      toast(
        a.tk +
          " foi para Ao vivo → Trades de olho, já conferido pelas suas regras.",
        3500,
      ));
}),
  document.addEventListener(
    "click",
    (e) => {
      if (!(!e.target.closest('[data-a="savetrade"]') || !isNew || !T))
        try {
          const t = String(T.ativo || "")
              .trim()
              .toUpperCase(),
            a = T.side === "V" ? "V" : "C";
          if (!t) return;
          const o = olLista()
            .filter(
              (n) =>
                !n.arq &&
                String(n.a || "").toUpperCase() === t &&
                (n.sd === "V" ? "V" : "C") === a,
            )
            .sort((n, r) => String(r.dia).localeCompare(String(n.dia)))[0];
          if (!o) return;
          T.olho = o.id;
          const s = olVeredito(o);
          if (s.st === "bloq") {
            const n = `Trade de olho de ${t}: BLOQUEADO pelas suas regras obrigatórias (${s.bloq.map((r) => r.t.split(" (")[0]).join("; ")}).

Lemos: "Nunca altere o plano feito com o mercado fechado quando o pregão abrir."

Registrar a entrada mesmo assim?`;
            if (!confirm(n)) {
              (e.stopImmediatePropagation(), e.preventDefault(), delete T.olho);
              return;
            }
            T.foraDaRegra = 1;
          }
        } catch {}
    },
    !0,
  ));
{
  const e = olDoTrade;
  olDoTrade = function (t) {
    if (t && t.olho) {
      const a = (S.olho || []).find((o) => o.id === t.olho);
      if (a) return a;
    }
    return e.apply(this, arguments);
  };
}
try {
  AL_CUR.some((e) => e[0] === "BRL") || AL_CUR.push(["BRL", "Brasil"]);
} catch {}
try {
  typeof NP < "u" &&
    (NP._br1 ||
      ((NP._br1 = 1),
      NP.cur.includes("BRL") || NP.cur.push("BRL"),
      NP.on && NP.on.br === void 0 && (NP.on.br = !0),
      NP.br || (NP.br = "09:30"),
      ls.set("diario-np", NP)));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("br", "☀️ Briefing antes da abertura (9h30)")}<div class="sm mut" style="margin-bottom:8px">Às 9h30 dos dias úteis chega um resumo: S&P futuro, EWZ no pré-mercado ou overnight, petróleo, minério (SGX e Dalian), dólar, as notícias fortes do dia e os trades de olho que estão perto da entrada.</div>`
    );
  };
}
{
  const e = vStatus;
  vStatus = function () {
    return (
      e.apply(this, arguments) +
      `<div class="card" style="margin-top:10px"><h2 style="margin:0 0 6px">🧹 Funções que o app usa</h2><div class="sm">O app só chama estas ${FN_LISTA.length} funções do Supabase:</div><div style="display:flex;flex-wrap:wrap;gap:5px;margin:8px 0">${FN_LISTA.map(([t]) => `<code style="background:var(--bg2,rgba(127,127,127,0.12));padding:2px 7px;border-radius:8px;font-size:12px">${esc(t)}</code>`).join("")}</div><div class="sm mut">Qualquer outra função que aparecer em Edge Functions no Supabase (por exemplo <b>analise-ia</b> ou testes antigos) não é usada e pode ser apagada: abra a função → Settings (ou os três pontinhos) → Delete. Apagar uma dessa lista desliga a parte do app correspondente.</div></div>`
    );
  };
}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return e
      .apply(this, arguments)
      .replace(
        '<div class="sm mut" style="margin-bottom:8px">Às 9h30',
        '<div class="sm" style="display:flex;align-items:center;gap:8px;margin:-2px 0 6px 26px">Horário: <input type="time" data-brh value="' +
          esc(NP.br || "09:30") +
          '" style="width:auto;padding:4px 8px;margin:0"></div><div class="sm mut" style="margin-bottom:8px">No horário escolhido (padrão 9h30)',
      );
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest && e.target.closest("[data-brh]");
  if (!(!t || !/^\d\d:\d\d$/.test(t.value))) {
    NP.br = t.value;
    try {
      ls.set("diario-np", NP);
    } catch {}
    try {
      turnoPushSync();
    } catch {}
    toast("Briefing às " + t.value);
  }
});
const GOR = {
  img: () => {
    tab === "mercado" && ((GO.r = null), setTimeout(() => imgGera(), 1200));
  },
};
setInterval(() => {
  const e = typeof GO < "u" && GO.r;
  if (!(!e || !GOR[e]))
    try {
      GOR[e]();
    } catch {}
}, 700);
{
  const e = vPainelMk;
  vPainelMk = function () {
    return e
      .apply(this, arguments)
      .replace(
        "<b>📈 Visão geral do mercado</b>",
        '<b>📈 Visão geral do mercado</b> <button class="btn s" data-imgger="1" style="padding:3px 9px">📸 Imagem</button>',
      );
  };
}
const FE = {
  v: (() => {
    try {
      return ls.get("diario-fluxo") || null;
    } catch {
      return null;
    }
  })(),
  ts: 0,
  busy: 0,
  err: "",
};
async function feCarrega() {
  if (FE.busy || Date.now() - FE.ts < 30 * 6e4) return;
  const e = cfg();
  if (!e) return;
  FE.busy = 1;
  try {
    const a = await fetch(e.url + "/functions/v1/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: e.key },
        body: JSON.stringify({ modo: "fluxo" }),
      }),
      o = await a.json().catch(() => ({}));
    if (!a.ok) throw new Error(o.error || "Erro " + a.status);
    if (!o.ultimo)
      throw new Error(
        'Para ver o fluxo estrangeiro, publique a nova versão da função "macro".',
      );
    ((FE.v = o), (FE.err = ""));
    try {
      ls.set("diario-fluxo", o);
    } catch {}
  } catch (a) {
    FE.err = String(a.message || a);
  }
  ((FE.ts = Date.now()), (FE.busy = 0));
  const t = document.getElementById("febox");
  t && (t.outerHTML = feHtml());
}
const feMi = (e) => {
    const t = Math.abs(e),
      a = e < 0 ? "−" : "+";
    return t >= 1e3
      ? a +
          "R$ " +
          (t / 1e3).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) +
          " bi"
      : a +
          "R$ " +
          t.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
          " mi";
  },
  feDia = (e) => e.slice(8, 10) + "/" + e.slice(5, 7);
function feHtml() {
  const e = FE.v;
  if (!e)
    return `<div class="card" id="febox" style="margin-bottom:10px"><b>🌎 Fluxo estrangeiro na B3</b><div class="sm ${FE.err ? "am" : "mut"}" style="margin-top:4px">${esc(FE.err || "Carregando…")}</div></div>`;
  const t = e.ultimo,
    a = (n) => (n > 0 ? "g" : n < 0 ? "r" : "mut"),
    o = Math.max(...e.linhas.slice(0, 10).map((n) => Math.abs(n.est)), 1),
    s = e.linhas
      .slice(0, 10)
      .reverse()
      .map(
        (n) =>
          `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="height:44px;width:100%;display:flex;flex-direction:column;justify-content:${n.est >= 0 ? "flex-end" : "flex-start"}"><div style="height:${Math.max(2, Math.round((22 * Math.abs(n.est)) / o))}px;background:${n.est >= 0 ? "var(--g,#2e8b5d)" : "var(--r,#dc3e26)"};border-radius:2px;${n.est >= 0 ? "margin-bottom:22px" : "margin-top:22px"}"></div></div><span style="font-size:9.5px" class="mut">${feDia(n.d)}</span></div>`,
      )
      .join("");
  return `<div class="card" id="febox" style="margin-bottom:10px"><div class="top"><b>🌎 Fluxo estrangeiro na B3</b><span class="sm mut">${feDia(t.d)}</span></div>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin:6px 0"><div><div class="sm mut">No dia</div><b class="${a(t.est)}" style="font-size:18px">${feMi(t.est)}</b></div><div><div class="sm mut">No mês (${e.dias_no_mes} pregões)</div><b class="${a(e.mes)}" style="font-size:18px">${feMi(e.mes)}</b></div><div><div class="sm mut">Sequência</div><b>${e.dias_seguidos} dia(s) de ${esc(e.sentido)}</b></div></div>
<div style="display:flex;gap:3px;align-items:stretch;margin:6px 0 2px">${s}</div>
<div class="sm mut">Institucional ${feMi(t.inst)} · Pessoa física ${feMi(t.pf)} · Inst. financeira ${feMi(t.ifin)}. ${esc(e.obs || "")} Fonte: ${esc(e.fonte || "B3")}.</div></div>`;
}
{
  const e = vPainelMk;
  vPainelMk = function () {
    return (setTimeout(feCarrega, 0), feHtml() + e.apply(this, arguments));
  };
}
{
  const e = imgDesenha;
  imgDesenha = function () {
    return e.apply(this, arguments);
  };
}
try {
  typeof NP < "u" &&
    !NP._bal1 &&
    ((NP._bal1 = 1),
    (NP.on = NP.on || {}),
    NP.on.bal === void 0 && (NP.on.bal = !0),
    NP.bal || (NP.bal = "07:00"),
    ls.set("diario-np", NP));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("bal", "📑 Balanços do dia")}<div class="sm" style="display:flex;align-items:center;gap:8px;margin:-2px 0 6px 26px">Horário: <input type="time" data-balh value="${esc(NP.bal || "07:00")}" style="width:auto;padding:4px 8px;margin:0"></div><div class="sm mut" style="margin-bottom:8px">Nos dias úteis: quais empresas da B3 divulgaram balanço desde o último pregão (geralmente depois do fechamento) e quais divulgam hoje.</div>`
    );
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest && e.target.closest("[data-balh]");
  if (!(!t || !/^\d\d:\d\d$/.test(t.value))) {
    NP.bal = t.value;
    try {
      ls.set("diario-np", NP);
    } catch {}
    try {
      turnoPushSync();
    } catch {}
    toast("Balanços às " + t.value);
  }
});
const BAL = {
  v: (() => {
    try {
      return ls.get("diario-bal") || null;
    } catch {
      return null;
    }
  })(),
  ts: 0,
  busy: 0,
  err: "",
};
async function balCarrega() {
  if (BAL.busy || Date.now() - BAL.ts < 30 * 6e4) return;
  const e = cfg();
  if (!e) return;
  BAL.busy = 1;
  try {
    const a = await fetch(e.url + "/functions/v1/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: e.key },
        body: JSON.stringify({ modo: "balancos" }),
      }),
      o = await a.json().catch(() => ({}));
    if (!a.ok) throw new Error(o.error || "Erro " + a.status);
    if (!Array.isArray(o.proximos))
      throw new Error(
        'Para ver os balanços, publique a nova versão da função "macro".',
      );
    ((BAL.v = o), (BAL.err = ""));
    try {
      ls.set("diario-bal", o);
    } catch {}
  } catch (a) {
    BAL.err = String(a.message || a);
  }
  ((BAL.ts = Date.now()), (BAL.busy = 0));
  const t = document.getElementById("balbox");
  t && (t.outerHTML = balHtml());
}
var balHtml;
{
  const e = vPainelMk;
  vPainelMk = function () {
    setTimeout(balCarrega, 0);
    const t = e.apply(this, arguments),
      a = t.indexOf('<div class="card" id="febox"');
    if (a < 0) return balHtml() + t;
    const o = t.indexOf("</div></div>", t.indexOf("Fonte:", a)) + 12;
    return t.slice(0, o) + balHtml() + t.slice(o);
  };
}
GOR.bal = () => {
  tab === "mercado" &&
    ((GO.r = null),
    typeof MKT < "u" && ((MKT.tab = "pn"), render()),
    setTimeout(() => {
      const e = document.getElementById("balbox");
      e && e.scrollIntoView({ behavior: "smooth" });
    }, 600));
};
function imgBalTxt() {
  try {
    const e = BAL.v;
    if (!e) return "";
    const t = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
    if (e.hoje !== t) return "";
    const a = (s, n) =>
        s
          .slice(0, n)
          .map((r) => r.tk)
          .join(", ") + (s.length > n ? " +" + (s.length - n) : ""),
      o = [];
    return (
      (e.hoje_lista || []).length && o.push("hoje: " + a(e.hoje_lista, 6)),
      (e.ontem || []).length && o.push("saíram: " + a(e.ontem, 4)),
      o.length ? "Balanços " + o.join(" · ") : ""
    );
  } catch {
    return "";
  }
}
{
  const e = imgDados;
  imgDados = async function () {
    try {
      await Promise.race([
        balCarrega(),
        new Promise((t) => setTimeout(t, 4e3)),
      ]);
    } catch {}
    return e.apply(this, arguments);
  };
}
{
  const e = imgDesenha;
  imgDesenha = function () {
    return e.apply(this, arguments);
  };
}
function imgBalListas() {
  try {
    const e = BAL.v;
    if (!e) return null;
    const t = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
    if (e.hoje !== t) return null;
    const a = e.hoje_lista || [],
      o = e.ontem || [];
    return a.length || o.length
      ? { h: a, o, dO: o.length ? o[0].d : "" }
      : null;
  } catch {
    return null;
  }
}
{
  const e = imgDesenha;
  imgDesenha = function () {
    const t = e.apply(this, arguments);
    try {
      const a = imgBalListas(),
        o = typeof FE < "u" && FE.v && FE.v.ultimo ? FE.v : null,
        s = imgAgenda();
      if (!a && !o && !s.length) return t;
      const n = t.width,
        r = t.height,
        i = r - 92,
        l = 92,
        d = 36,
        c = n - 2 * d,
        p = "#2e8b5d",
        u = "#dc3e26",
        m = "#7a808c",
        f = "#16171a",
        x = "#efeeeb",
        v = document.createElement("canvas").getContext("2d"),
        g = (ue, ve) =>
          (ve ? "700 " : "500 ") +
          ue +
          "px Inter, system-ui, -apple-system, sans-serif",
        h = (ue, ve) => {
          const he = ue
            .slice(0, ve)
            .map((we) =>
              we.hora
                ? we.tk + " · " + we.hora
                : we.quando === "antes"
                  ? we.tk + " · pré-abertura"
                  : we.quando === "depois"
                    ? we.tk + " · pós-fech."
                    : we.tk,
            );
          return (ue.length > ve && he.push("+" + (ue.length - ve)), he);
        },
        b = (ue, ve, he) => {
          v.font = g(24, 1);
          let we = ve,
            Be = 0;
          const Ge = [];
          return (
            ue.forEach((Ce) => {
              const Qe = v.measureText(Ce).width + 32;
              (we + Qe > ve + he && ((we = ve), (Be += 54)),
                Ge.push({ t: Ce, x: we, y: Be, w: Qe }),
                (we += Qe + 10));
            }),
            { out: Ge, h: Be + 44 }
          );
        };
      let y = 0,
        j = null,
        k = null;
      a &&
        ((j = a.h.length ? b(h(a.h, 14), d + 24, c - 48) : null),
        (k = a.o.length ? b(h(a.o, 10), d + 24, c - 48) : null),
        (y = 22 + (j ? 40 + j.h + 14 : 0) + (k ? 40 + k.h + 14 : 0) + 10));
      const A = o ? 168 : 0,
        C = s.length ? s.length * 54 + 26 : 0,
        I = (s.length ? C + 60 : 0) + (a ? y + 60 : 0) + (o ? A + 60 : 0) + 10,
        J = document.createElement("canvas");
      ((J.width = n), (J.height = r + I));
      const se = J.getContext("2d");
      ((se.fillStyle = "#efeeeb"),
        se.fillRect(0, 0, n, J.height),
        se.drawImage(t, 0, 0, n, i, 0, 0, n, i));
      const Ie = (ue, ve, he, we, Be, Ge, Ce) => {
          (se.beginPath(),
            se.moveTo(ue + Be, ve),
            se.arcTo(ue + he, ve, ue + he, ve + we, Be),
            se.arcTo(ue + he, ve + we, ue, ve + we, Be),
            se.arcTo(ue, ve + we, ue, ve, Be),
            se.arcTo(ue, ve, ue + he, ve, Be),
            se.closePath(),
            Ge && ((se.fillStyle = Ge), se.fill()),
            Ce && ((se.strokeStyle = Ce), (se.lineWidth = 2), se.stroke()));
        },
        Pe = (ue, ve, he, we = {}) => {
          ((se.font = g(we.s || 24, we.b)),
            (se.fillStyle = we.c || f),
            (se.textAlign = we.al || "left"),
            se.fillText(ue, ve, he));
        };
      let Me = i + 6;
      if (
        (s.length &&
          (Pe("Agenda de hoje", 48, Me + 30, { s: 28, b: 1 }),
          Pe("horário de Brasília", n - 48, Me + 30, {
            s: 22,
            c: m,
            al: "right",
          }),
          (Me += 48),
          Ie(d, Me, c, C, 22, "#ffffff", x),
          s.forEach((ue, ve) => {
            const he = Me + 14 + ve * 54,
              we = Date.parse(ue.em) < Date.now() - 5 * 6e4;
            (Ie(d + 20, he + 8, 88, 38, 19, we ? "#f4f3f1" : "#16171a"),
              Pe(agHora(ue.em), d + 64, he + 35, {
                s: 22,
                b: 1,
                c: we ? m : "#ffffff",
                al: "center",
              }));
            const Be = AG_NM[ue.p] || ue.p;
            (Pe(Be, d + 126, he + 35, { s: 22, b: 1, c: "#282a2e" }),
              (se.font = g(22, 1)));
            const Ge = se.measureText(Be).width;
            let Ce = ue.t;
            se.font = g(23, 0);
            const Qe = [
                ue.atual ? "Atual " + ue.atual : "",
                ue.proj ? "Proj. " + ue.proj : "",
              ]
                .filter(Boolean)
                .join(" · "),
              de = Qe ? se.measureText(Qe).width + 20 : 0,
              Se = c - 126 - Ge - 14 - de - 20;
            for (; se.measureText(Ce).width > Se && Ce.length > 8; )
              Ce = Ce.slice(0, -2);
            (Ce !== ue.t && (Ce = Ce.replace(/.$/, "…")),
              Pe(Ce, d + 126 + Ge + 12, he + 35, {
                s: 23,
                c: we ? m : "#26282b",
              }),
              Qe && Pe(Qe, d + c - 20, he + 35, { s: 21, c: m, al: "right" }),
              ve < s.length - 1 &&
                ((se.fillStyle = x), se.fillRect(d + 20, he + 52, c - 40, 1)));
          }),
          (Me += C + 12)),
        a)
      ) {
        Pe("Balanços do dia", 48, Me + 30, { s: 28, b: 1 });
        const ue = new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        (Pe(ue, n - 48, Me + 30, { s: 22, c: m, al: "right" }),
          (Me += 48),
          Ie(d, Me, c, y, 22, "#ffffff", x));
        let ve = Me + 24;
        const he = (we, Be, Ge, Ce, Qe, de) => {
          (Pe(Be, d + 24, ve + 22, { s: 22, b: 1, c: Ge }),
            (ve += 40),
            we.out.forEach((Se) => {
              (Ie(Se.x, ve + Se.y, Se.w, 44, 22, Ce, Qe),
                Pe(Se.t, Se.x + Se.w / 2, ve + Se.y + 31, {
                  s: 24,
                  b: 1,
                  c: de,
                  al: "center",
                }));
            }),
            (ve += we.h + 14));
        };
        (j && he(j, "📅  Divulgam hoje", f, "#efeeeb", "#d6d3ce", "#282a2e"),
          k &&
            he(
              k,
              "✅  Já divulgaram (" +
                a.dO.slice(8, 10) +
                "/" +
                a.dO.slice(5, 7) +
                ")",
              f,
              "#f4f3f1",
              "#e2e0dc",
              "#26282b",
            ),
          (Me += y + 12));
      }
      if (o) {
        const ue = o.ultimo,
          ve = (Ge) => (Ge > 0 ? p : Ge < 0 ? u : m);
        (Pe("Investidor estrangeiro na B3", 48, Me + 30, { s: 28, b: 1 }),
          Pe("ações · R$", n - 48, Me + 30, { s: 22, c: m, al: "right" }),
          (Me += 48),
          Ie(d, Me, c, A, 22, "#ffffff", x));
        const he = c / 3;
        [
          ["No dia " + feDia(ue.d), ue.est],
          ["No mês", o.mes],
        ].forEach(([Ge, Ce], Qe) => {
          const de = d + 24 + Qe * he;
          (Pe(Ge, de, Me + 44, { s: 22, c: m }),
            Pe(feMi(Ce).replace("−", "-"), de, Me + 92, {
              s: 38,
              b: 1,
              c: ve(Ce),
            }));
        });
        const we = d + 24 + 2 * he,
          Be = ue.est >= 0;
        (Ie(we, Me + 24, he - 48, 74, 16, Be ? "#efeeeb" : "#fcefed"),
          Pe(Be ? "▲ Entrada" : "▼ Saída", we + (he - 48) / 2, Me + 70, {
            s: 26,
            b: 1,
            c: Be ? "#282a2e" : "#992c1b",
            al: "center",
          }),
          Pe(
            o.dias_seguidos +
              " dia(s) seguido(s) de " +
              o.sentido +
              " · dado da B3 com ~2 dias de atraso",
            d + 24,
            Me + 140,
            { s: 21, c: m },
          ),
          (Me += A + 12));
      }
      return (se.drawImage(t, 0, r - l, n, l, 0, J.height - l, n, l), J);
    } catch {
      return t;
    }
  };
}
function imgAgenda() {
  try {
    const e = AG.v && AG.v[0];
    if (!e || !Array.isArray(e.eventos)) return [];
    const t = agDia(new Date().toISOString()),
      a = new Set();
    return e.eventos
      .filter((o) => o.imp === 1 && agDia(o.em) === t)
      .sort((o, s) => Date.parse(o.em) - Date.parse(s.em))
      .filter((o) => {
        const s =
          o.p + o.t.replace(/ (mensal|anual|tri\/tri|pr\xe9via|final)$/, "");
        return a.has(s) ? !1 : (a.add(s), !0);
      })
      .slice(0, 6);
  } catch {
    return [];
  }
}
{
  const e = imgDados;
  imgDados = async function () {
    try {
      if (!AG.v[0] || Date.now() - (AG.ts[0] || 0) > 30 * 6e4) {
        const t = AG.sem;
        AG.sem = 0;
        const a = agCarrega(!0);
        ((AG.sem = t),
          await Promise.race([a, new Promise((o) => setTimeout(o, 4e3))]));
      }
    } catch {}
    return e.apply(this, arguments);
  };
}
document.addEventListener(
  "toggle",
  (e) => {
    const t = e.target && e.target.dataset && e.target.dataset.agd;
    if (!t) return;
    ((AG.ab = AG.ab || {}), (AG.ab[t] = e.target.open));
    const a = e.target.querySelector('summary span[style*="float"]');
    a && (a.textContent = e.target.open ? "▾" : "▸");
  },
  !0,
);
function imgLegenda() {
  try {
    const e = [],
      t = MDO.v && MDO.v.mercados && MDO.v.mercados.pre,
      a = (i) =>
        (i > 0 ? "+" : "") +
        (+i).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        "%";
    t && t.vies && e.push("Viés " + t.vies);
    const o = ((AD.data && AD.data.itens) || []).find((i) => i.s === "EWZ"),
      s = imgQ("EWZ"),
      n = s && s.ext;
    n && isFinite(n.pct)
      ? e.push(
          "EWZ " +
            (n.tipo === "overnight"
              ? "overnight"
              : n.tipo === "pré-mercado"
                ? "pré"
                : "pós") +
            " " +
            a(n.pct),
        )
      : o && isFinite(o.chp) && e.push("EWZ " + a(o.chp));
    const r = imgQ("^BVSP");
    return (
      r && isFinite(r.d1) && e.push("Ibovespa " + a(r.d1)),
      e.length ? " · " + e.join(" · ") : ""
    );
  } catch {
    return "";
  }
}
{
  const e = rdPlano;
  rdPlano = function (t) {
    const a = e.apply(this, arguments);
    try {
      if (!a.meu && a.f && a.alvos && a.alvos.length) {
        const o = t.lado === "C" ? 1 : -1,
          s = +t.entrada;
        a.consumido = a.alvos.every((n) => (n.v - s) * o <= 0);
      }
    } catch {}
    return a;
  };
}
{
  const e = rdItem;
  rdItem = function (t) {
    let a = e.apply(this, arguments);
    try {
      const o = rdPlano(t);
      if (!o.consumido) return a;
      const s = t.lado === "C",
        n = o.f,
        r = o.alvos[o.alvos.length - 1],
        i = `<div class="rd-ct" style="background:rgba(194,148,62,0.12);border-radius:12px;padding:8px 10px;margin:6px 0">⚠️ <b>No ${RD_TFN[o.tf]} esse movimento já aconteceu.</b> Pela sua regra, a entrada era no rompimento do ${s ? "topo" : "fundo"} B (<b>${rdN(n.b)}</b>), e o preço já passou do alvo de 161,8% (${rdN(r.v)}). Entrar agora em ${rdN(t.entrada)} com stop em ${rdN(o.stop)} arrisca mais do que esses alvos pagam. Use o tempo gráfico em que o setup apareceu, ou espere um novo pivô no ${RD_TFN[o.tf]}.</div>`;
      a = a
        .replace('<div class="rd-l2">', i + '<div class="rd-l2">')
        .replace(
          /<button class="btn rd-mt"[^>]*>[^<]*<\/button>/,
          '<div class="sm mut" style="margin:6px 0">Sem plano válido neste tempo gráfico.</div>',
        );
    } catch {}
    return a;
  };
}
const SZ = {
  v: (() => {
    try {
      return ls.get("diario-saz") || null;
    } catch {
      return null;
    }
  })(),
  ts: 0,
  busy: 0,
  err: "",
  ab: (() => {
    try {
      return ls.get("diario-saz-ab") || "fim";
    } catch {
      return "fim";
    }
  })(),
  jf: "natal",
  je: "trade",
  tu: 2,
  am: "ibov",
  jc: "reacao",
  tc: "corte",
};
{
  const e = HUB_M.findIndex((t) => t[0] === "mercado:pn");
  HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, [
    "mercado:saz",
    "Sazonalidade",
  ]);
}
async function szCarrega(e) {
  if (
    SZ.busy ||
    (!e &&
      SZ.v &&
      Date.now() - Date.parse(SZ.v.gerado || 0) < 12 * 36e5 &&
      SZ.v.hoje === loc().slice(0, 10)) ||
    (!e && SZ.err && Date.now() - SZ.ts < 12e4)
  )
    return;
  const t = cfg();
  if (!t) {
    SZ.err = "Configure o Supabase na aba Conta.";
    return;
  }
  ((SZ.busy = 1), (SZ.err = ""), szPinta());
  try {
    const a = await fetch(t.url + "/functions/v1/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: t.key },
        body: JSON.stringify({ modo: "sazonal" }),
      }),
      o = await a.json().catch(() => ({}));
    if (!a.ok) throw new Error(o.error || "Erro " + a.status);
    if (!o.mes)
      throw new Error(
        'Para ver a sazonalidade, publique a nova versão da função "macro" no Supabase.',
      );
    SZ.v = o;
    try {
      ls.set("diario-saz", o);
    } catch {}
  } catch (a) {
    SZ.err = String(a.message || a);
  }
  ((SZ.ts = Date.now()), (SZ.busy = 0), szPinta());
}
function szPinta() {
  const e = document.getElementById("szbox");
  e && (e.innerHTML = szCorpo());
}
const szP = (e) =>
    e == null || !isFinite(e)
      ? '<span class="mut">—</span>'
      : `<span class="${e > 0 ? "g" : e < 0 ? "r" : "mut"}">${e > 0 ? "+" : ""}${(+e).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>`,
  szN = (e) =>
    e == null
      ? "—"
      : (+e).toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
  SZ_MES = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ],
  szChip = (e, t, a, o) =>
    `<button class="btn s${o ? "" : " sz-off"}" data-sz${e}="${t}" style="padding:4px 10px;margin:2px 4px 2px 0;${o ? "" : "opacity:.55"}">${a}</button>`;
function szKpi(e, t) {
  if (!e || !e.qtd) return "";
  const a = (o, s, n) =>
    `<div class="sz-k"><div class="sm mut">${o}</div><div class="sz-kv">${s}</div><div class="sm mut">${n || ""}</div></div>`;
  return `<div class="sz-kg">${a("Retorno médio", szP(e.media), t)}${a("Mediana", szP(e.mediana), e.qtd + " vezes")}${a("Positivas", `<b>${e.pos}%</b>`, "")}${a("Melhor", szP(e.melhor), "")}${a("Pior", szP(e.pior), "")}</div>`;
}
function szTabAtivos(e) {
  return `<table class="sz-t"><tr><th>Ativo</th><th>Média</th><th>Mediana</th><th>Positivas</th></tr>${e.ativos
    .filter((t) => t.qtd)
    .map(
      (t) =>
        `<tr${t.k === "ibov" ? ' class="sz-ib"' : ""}><td>${esc(t.n)}</td><td>${szP(t.media)}</td><td>${szP(t.mediana)}</td><td>${t.pos}% <span class="mut">(${t.qtd})</span></td></tr>`,
    )
    .join("")}</table>`;
}
function szFim(e) {
  const t = e.fim_ano,
    a = t.janelas.find((s) => s.k === SZ.jf) || t.janelas[0],
    o = a.ativos.find((s) => s.k === "ibov");
  return `<div style="margin:6px 0">${t.janelas.map((s) => szChip("jf", s.k, s.n, s.k === a.k)).join("")}</div><div class="sm mut">${esc(a.ex)}</div>${szKpi(o, "Ibovespa")}
  <div class="sz-h">IBOV, dólar e setores</div>${szTabAtivos(a)}
  <div class="sz-h">Ano a ano</div><table class="sz-t"><tr><th>Ano</th><th>IBOV</th><th>Dólar</th><th>Bancos</th><th>Commod.</th></tr>${t.anos
    .filter((s) => s[a.k])
    .map(
      (s) =>
        `<tr><td>${s.ano}</td><td>${szP(s[a.k].ibov)}</td><td>${szP(s[a.k].dolar)}</td><td>${szP(s[a.k].bancos)}</td><td>${szP(s[a.k].commod)}</td></tr>`,
    )
    .join("")}</table>`;
}
function szEle(e) {
  const t = e.eleicoes,
    a = SZ.tu === 1 ? t.t1 : t.t2,
    o = a.resumo.find((r) => r.k === SZ.je) || a.resumo[0],
    s = o.ativos.find((r) => r.k === "ibov"),
    n = (r) =>
      r.ibov_pts
        ? `<span class="sm mut">${szN(r.ibov_pts.segunda_antes)} → ${r.ibov_pts.segunda_depois ? szN(r.ibov_pts.segunda_depois) : "…"}</span>`
        : "";
  return `<div class="seg" style="margin:6px 0">${[1, 2].map((r) => `<button class="${SZ.tu === r ? "on" : ""}" data-sztu="${r}">${r}º turno</button>`).join("")}</div>
  <div style="margin:4px 0">${a.resumo.map((r) => szChip("je", r.k, r.n, r.k === o.k)).join("")}</div><div class="sm mut">${esc(o.ex)}</div>${szKpi(s, "Ibovespa · " + (SZ.tu === 1 ? "1º" : "2º") + " turno")}
  <div class="sz-h">Eleição a eleição</div><table class="sz-t"><tr><th>Eleição</th><th>IBOV</th><th>Dólar</th><th>Bancos</th><th>Elétricas</th></tr>${a.linhas
    .slice()
    .reverse()
    .map(
      (r) =>
        `<tr${r.futuro ? ' class="sz-fut"' : ""}><td><b>${r.ano}</b><div class="sm mut">${r.data.slice(8, 10)}/${r.data.slice(5, 7)}</div></td>${r[o.k] ? `<td>${szP(r[o.k].ibov)}${o.k === "trade" ? "<div>" + n(r) + "</div>" : ""}</td><td>${szP(r[o.k].dolar)}</td><td>${szP(r[o.k].bancos)}</td><td>${szP(r[o.k].eletricas)}</td>` : `<td colspan="4" class="sm mut">${r.futuro ? "ainda vai acontecer" : "sem dados"}</td>`}</tr>`,
    )
    .join("")}</table>
  <div class="sz-h">IBOV, dólar e setores (média das eleições)</div>${szTabAtivos(o)}<div class="sm mut" style="margin-top:6px">${esc(t.obs)}</div>`;
}
function szMes(e) {
  const t = e.mes,
    a = t.ativos.find((r) => r.k === SZ.am) || t.ativos[0],
    o = t.mes_atual,
    s = (o.parcial || []).find((r) => r.k === a.k),
    n = (r) =>
      r == null
        ? "transparent"
        : r > 0
          ? `rgba(22,163,74,${Math.min(0.85, 0.15 + Math.abs(r) / 12)})`
          : `rgba(220,38,38,${Math.min(0.85, 0.15 + Math.abs(r) / 12)})`;
  return `<div style="margin:6px 0">${t.ativos.map((r) => szChip("am", r.k, r.n, r.k === a.k)).join("")}</div>
  <div class="sm mut">${esc(a.n)}: retorno de cada mês (fechamento do mês anterior → fechamento do mês), de ${t.de.slice(0, 4)} a ${t.ate.slice(0, 4)}.</div>
  <table class="sz-t"><tr><th>Mês</th><th>Média</th><th>Mediana</th><th>Positivos</th></tr>${a.mes.map((r) => `<tr${r.m === o.m ? ' class="sz-ib"' : ""}><td><b>${SZ_MES[r.m - 1]}</b>${r.m === o.m ? ' <span class="ag-tag">agora</span>' : ""}</td><td>${szP(r.media)}</td><td>${szP(r.mediana)}</td><td>${r.pos == null ? "—" : r.pos + "%"} <span class="mut">(${r.qtd})</span></td></tr>`).join("")}</table>
  ${s ? `<div class="sm" style="margin-top:6px">${SZ_MES[o.m - 1]} até agora: ${szP(s.v)}</div>` : ""}
  ${
    t.matriz && t.matriz.length
      ? `<div class="sz-h">Mapa de calor do Ibovespa (ano × mês)</div><div style="overflow-x:auto"><table class="sz-hm"><tr><th></th>${SZ_MES.map((r) => `<th>${r[0]}</th>`).join("")}</tr>${t.matriz
          .slice()
          .reverse()
          .map(
            (r) =>
              `<tr><td>${String(r.ano).slice(2)}</td>${r.m.map((i) => `<td style="background:${n(i)}" title="${i == null ? "" : i.toFixed(1) + "%"}">${i == null ? "" : Math.round(i)}</td>`).join("")}</tr>`,
          )
          .join("")}</table></div>`
      : ""
  }`;
}
function szCop(e) {
  const t = e.copom;
  if (!t) return '<div class="sm mut">Sem dados do Banco Central agora.</div>';
  const a = SZ.tc === "alta" ? t.alta : t.corte,
    o = a.find((n) => n.k === SZ.jc) || a[0],
    s = o.ativos.find((n) => n.k === "ibov");
  return `<div class="seg" style="margin:6px 0"><button class="${SZ.tc === "corte" ? "on" : ""}" data-sztc="corte">Cortes (${t.n_corte})</button><button class="${SZ.tc === "alta" ? "on" : ""}" data-sztc="alta">Altas (${t.n_alta})</button></div>
  <div style="margin:4px 0">${a.map((n) => szChip("jc", n.k, n.n, n.k === o.k)).join("")}</div><div class="sm mut">${esc(o.ex)}</div>${szKpi(s, "Ibovespa")}
  <div class="sz-h">IBOV, dólar e setores</div>${szTabAtivos(o)}
  <div class="sz-h">Últimas decisões</div><table class="sz-t"><tr><th>Data</th><th>Selic</th><th>IBOV dia seg.</th><th>Dólar</th></tr>${t.linhas
    .slice(0, 20)
    .map(
      (n) =>
        `<tr><td>${n.data.slice(8, 10)}/${n.data.slice(5, 7)}/${n.data.slice(2, 4)}</td><td>${szN(n.de)} → <b class="${n.tipo === "alta" ? "r" : "g"}">${szN(n.para)}</b></td><td>${szP(n.reacao && n.reacao.ibov)}</td><td>${szP(n.reacao && n.reacao.dolar)}</td></tr>`,
    )
    .join(
      "",
    )}</table><div class="sm mut" style="margin-top:6px">${esc(t.obs)}</div>`;
}
function szCorpo() {
  const e = SZ.v;
  if (!e)
    return `<div class="sm ${SZ.err ? "am" : "mut"}" style="padding:10px 0">${SZ.busy ? "Calculando 26 anos de histórico… (só na primeira vez do dia)" : esc(SZ.err || "Carregando…")}</div>`;
  const t = SZ.ab,
    a =
      t === "ele"
        ? szEle(e)
        : t === "mes"
          ? szMes(e)
          : t === "cop"
            ? szCop(e)
            : szFim(e),
    o = (e.ativos || [])
      .filter((s) => s.membros)
      .map((s) => `${s.n}: ${s.membros.join(", ")}`)
      .join(" · ");
  return `${SZ.err ? `<div class="sm am">${esc(SZ.err)}</div>` : ""}${a}<div class="sm mut" style="margin-top:10px">Setores = média das ações: ${esc(o)}. ${esc(e.fontes)}</div>`;
}
function vSaz(e) {
  return (
    setTimeout(() => szCarrega(), 0),
    `<style>.sz-t{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}.sz-t th{font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;text-align:right;color:var(--mut,#7a808c);padding:4px 4px;border-bottom:1px solid var(--bd,#efeeeb)}.sz-t th:first-child,.sz-t td:first-child{text-align:left}.sz-t td{text-align:right;padding:8px 4px;border-bottom:1px solid var(--bd,#f4f3f1)}.sz-ib td{background:rgba(172,132,57,0.07)}.sz-fut td{opacity:.6}.sz-h{font-weight:700;margin:16px 0 4px}.sz-kg{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px;margin:8px 0}.sz-k{background:rgba(127,127,127,0.07);border-radius:8px;padding:8px 8px}.sz-kv{font-size:18px;font-weight:800}.sz-hm{border-collapse:collapse;font-size:10px}.sz-hm td,.sz-hm th{width:24px;height:20px;text-align:center;padding:0;border:1px solid var(--bg,#ffffff)}.sz-hm td:first-child{color:var(--mut,#7a808c);padding-right:4px}</style>
  <div class="card"><div class="top"><b>📅 Sazonalidade</b><button class="btn s" data-szrf="1">${SZ.busy ? "…" : "↻"}</button></div>${e || ""}
  <div class="sm mut">Como o Ibovespa, o dólar e os setores se comportaram em cada época, desde 2000. Toque nas janelas para comparar.</div>
  <div class="seg" style="margin:8px 0;display:grid;grid-template-columns:repeat(4,1fr)">${[
    ["fim", "Fim de ano"],
    ["ele", "Eleições"],
    ["mes", "Mês a mês"],
    ["cop", "Copom"],
  ]
    .map(
      ([t, a]) =>
        `<button class="${SZ.ab === t ? "on" : ""}" data-szab="${t}" style="font-size:13px;padding:7px 2px;white-space:nowrap;min-width:0">${a}</button>`,
    )
    .join("")}</div>
  <div id="szbox">${szCorpo()}</div></div>`
  );
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "saz" ? e.apply(this, arguments) : vSaz("");
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest(
    "[data-szab],[data-szjf],[data-szje],[data-sztu],[data-szam],[data-szjc],[data-sztc],[data-szrf]",
  );
  if (!t) return;
  const a = t.dataset;
  if (a.szrf) {
    szCarrega(!0);
    return;
  }
  if (a.szab) {
    SZ.ab = a.szab;
    try {
      ls.set("diario-saz-ab", a.szab);
    } catch {}
    render();
    return;
  }
  (a.szjf && (SZ.jf = a.szjf),
    a.szje && (SZ.je = a.szje),
    a.sztu && (SZ.tu = +a.sztu),
    a.szam && (SZ.am = a.szam),
    a.szjc && (SZ.jc = a.szjc),
    a.sztc && (SZ.tc = a.sztc),
    szPinta());
});
const VENC = {
    acoes: [
      "2026-01-16",
      "2026-02-20",
      "2026-03-20",
      "2026-04-17",
      "2026-05-15",
      "2026-06-19",
      "2026-07-17",
      "2026-08-21",
      "2026-09-18",
      "2026-10-16",
      "2026-11-19",
      "2026-12-18",
      "2027-01-15",
      "2027-02-19",
      "2027-03-19",
      "2027-04-16",
      "2027-05-21",
      "2027-06-18",
      "2027-07-16",
      "2027-08-20",
      "2027-09-17",
      "2027-10-15",
      "2027-11-19",
      "2027-12-17",
    ],
    ibov: [
      "2026-01-14",
      "2026-02-18",
      "2026-03-18",
      "2026-04-15",
      "2026-05-13",
      "2026-06-17",
      "2026-07-15",
      "2026-08-12",
      "2026-09-16",
      "2026-10-14",
      "2026-11-18",
      "2026-12-16",
      "2027-01-13",
      "2027-02-17",
      "2027-03-17",
      "2027-04-14",
      "2027-05-12",
      "2027-06-16",
      "2027-07-14",
      "2027-08-18",
      "2027-09-15",
      "2027-10-13",
      "2027-11-17",
      "2027-12-15",
    ],
  },
  VC = { ab: !1 },
  vcDias = (e, t) =>
    Math.round(
      (Date.parse(e + "T12:00:00") - Date.parse(t + "T12:00:00")) / 864e5,
    ),
  vcFmt = (e) =>
    ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][
      new Date(e + "T12:00:00").getDay()
    ] +
    " " +
    e.slice(8, 10) +
    "/" +
    e.slice(5, 7);
function vcProx(e, t) {
  return VENC[e].find((a) => a >= t) || null;
}
function vencHtml() {
  const e = loc().slice(0, 10),
    t = (o, s) => {
      const n = vcProx(o, e);
      if (!n) return "";
      const r = vcDias(n, e);
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bd,#f4f3f1)"><span>${s}</span><span><b>${vcFmt(n)}</b> <span class="${r <= 1 ? "r" : r <= 5 ? "am" : "mut"} sm">${r === 0 ? "hoje" : r === 1 ? "amanhã" : "em " + r + " dias"}</span></span></div>`;
    },
    a = (o) =>
      `<table class="sz-t" style="width:100%;border-collapse:collapse;font-size:13px"><tr><th style="text-align:left">${o}</th><th style="text-align:right">Ações</th><th style="text-align:right">Ibovespa</th></tr>${VENC.acoes
        .filter((s) => s.startsWith(o))
        .map((s, n) => {
          const r = VENC.ibov.filter((i) => i.startsWith(o))[n];
          return `<tr${s < e && r < e ? ' style="opacity:.45"' : ""}><td>${SZ_MES[+s.slice(5, 7) - 1]}</td><td style="text-align:right">${vcFmt(s)}</td><td style="text-align:right">${vcFmt(r)}</td></tr>`;
        })
        .join("")}</table>`;
  return `<div class="card" id="vcbox" style="margin-bottom:10px"><div class="top"><b>📆 Vencimento de opções</b><button class="btn s" data-vc="ab" style="padding:3px 9px">${VC.ab ? "Fechar" : "Calendário 2026–27"}</button></div>${t("acoes", "Opções sobre ações")}${t("ibov", "Opções sobre Ibovespa")}
  ${VC.ab ? `<div style="margin-top:8px">${a("2026")}<div style="height:8px"></div>${a("2027")}</div>` : ""}<div class="sm mut" style="margin-top:6px">Fonte: B3. Ações: 3ª sexta-feira do mês (antecipa se for feriado, como 19/11/2026). Ibovespa: quarta-feira mais próxima do dia 15.</div></div>`;
}
{
  const e = agHtml;
  agHtml = function () {
    return vencHtml() + e.apply(this, arguments);
  };
}
document.addEventListener("click", (e) => {
  if (!e.target.closest('[data-vc="ab"]')) return;
  VC.ab = !VC.ab;
  const t = document.getElementById("vcbox");
  t && (t.outerHTML = vencHtml());
});
{
  const e = optInfo;
  optInfo = function (t, a) {
    const o = e.apply(this, arguments);
    try {
      const s = o.venc.slice(0, 7),
        n = VENC.acoes.find((r) => r.startsWith(s));
      n && (o.venc = n);
    } catch {}
    return o;
  };
}
const GR = { v: {}, busy: "", err: {}, j: null };
{
  const e = HUB_M.findIndex((t) => t[0] === "mercado:pn");
  HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, ["mercado:giro", "Giro"]);
}
const grAgora = () => {
    const e = new Date(),
      t =
        +e.toLocaleString("en-GB", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          hourCycle: "h23",
        }) *
          60 +
        +e.toLocaleString("en-GB", {
          timeZone: "America/Sao_Paulo",
          minute: "2-digit",
        });
    return t < 600 ? "pre" : t < 1030 ? "meio" : "fech";
  },
  GR_N = { pre: "Pré-abertura", meio: "Meio do pregão", fech: "Fechamento" };
try {
  typeof NP < "u" &&
    NP.on &&
    NP.on.giro === void 0 &&
    ((NP.on.giro = !0), ls.set("diario-np", NP));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("giro", "📰 Giro do mercado (7h, 9h10, 10h, 12h, 15h e 17h20)")}<div class="sm mut" style="margin-bottom:8px">Um resumo pronto do pregão, com os números e os motivos do dia, para ler ou mandar no grupo.</div>`
    );
  };
}
var grCarrega;
function grPinta() {
  const e = document.getElementById("grbox");
  e && (e.innerHTML = grCorpo());
}
function grTexto(e) {
  return `${e.titulo}

${e.texto}${
    (e.tecnico || []).length
      ? `

📐 Leitura técnica
` +
        e.tecnico.map((t) => "• " + t).join(`
`)
      : ""
  }${
    (e.destaques || []).length
      ? `

` +
        e.destaques.map((t) => "• " + t).join(`
`)
      : ""
  }`;
}
function grCorpo() {
  const e = GR.j || grAgora(),
    t = loc().slice(0, 10) + e,
    a = GR.v[t],
    o = GR.err[t];
  if (GR.busy === e)
    return '<div class="sm mut" style="padding:12px 0">Escrevendo o giro com as notícias de hoje… (até 1 minuto)</div>';
  if (!a)
    return `<div class="sm ${o ? "am" : "mut"}" style="padding:10px 0">${esc(o || "Toque em atualizar para gerar.")}</div>`;
  const s = a.gerado
    ? new Date(a.gerado).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : "";
  return `<div style="font-weight:800;font-size:16px;line-height:1.3;margin:6px 0">${esc(a.titulo)}</div><div style="line-height:1.55;font-size:15px;white-space:pre-line">${esc(a.texto)}</div>
  ${(a.tecnico || []).length ? `<div style="margin-top:10px;padding:8px 10px;border-radius:12px;background:rgba(127,127,127,0.08)"><div class="sm" style="font-weight:700;margin-bottom:4px">📐 Leitura técnica</div><ul style="margin:0 0 0 18px;padding:0;font-size:14px">${a.tecnico.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
  ${(a.destaques || []).length ? `<ul style="margin:8px 0 0 18px;padding:0;font-size:14px">${a.destaques.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"><button class="btn s" data-gr="cp">📋 Copiar</button><button class="btn s" data-gr="sh">📤 Compartilhar</button>${e === grAgora() ? '<button class="btn s" data-gr="rf">↻ Atualizar</button>' : ""}</div>
  ${(a.fontes || []).length ? `<div class="sm mut">Fontes: ${a.fontes.map((n) => (n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.titulo || "link")}</a>` : esc(n.titulo))).join(" · ")}</div>` : ""}
  <div class="sm mut" style="margin-top:4px">Gerado às ${s} pela IA com as cotações ${a.profit ? "do <b>Profit</b> (Ibovespa, WIN, WDO e DI em tempo real) e do TradingView" : "do TradingView"} e notícias pesquisadas na internet. Confira os fatos antes de repassar. Não é recomendação de investimento.</div>`;
}
var vGiro;
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "giro" ? e.apply(this, arguments) : vGiro();
  };
}
(document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-grj],[data-gr]");
  if (!t) return;
  if (t.dataset.grj) {
    ((GR.j = t.dataset.grj), render());
    return;
  }
  const a = GR.j || grAgora(),
    o = GR.v[loc().slice(0, 10) + a];
  if (t.dataset.gr === "rf") {
    grCarrega(a, !0);
    return;
  }
  if (!o) return;
  const s = grTexto(o);
  if (t.dataset.gr === "cp")
    try {
      (await navigator.clipboard.writeText(s), toast("Texto copiado"));
    } catch {
      toast("Não consegui copiar");
    }
  if (t.dataset.gr === "sh")
    try {
      navigator.share
        ? await navigator.share({ text: s })
        : (await navigator.clipboard.writeText(s), toast("Texto copiado"));
    } catch {}
}),
  (GOR.giro = () => {
    tab === "mercado" &&
      ((GO.r = null), (MKT.tab = "giro"), (GR.j = null), render());
  }));
const RK = { v: null, prof: [], ts: 0, busy: 0, err: "" };
{
  const e = HUB_M.findIndex((t) => t[0] === "mercado:giro");
  HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, [
    "mercado:rk",
    "Altas e baixas",
  ]);
}
const rkAcao = (e) =>
  /^[A-Z]{4}\d{1,2}$/.test(e) &&
  !/3[1-9]$/.test(e) &&
  !/^(WIN|WDO|IND|DOL|DI1|BGI|CCM|ICF)/.test(e);
async function rkCarrega(e) {
  if (RK.busy || (!e && Date.now() - RK.ts < 45e3 && RK.v)) return;
  const t = cfg();
  if (!t) {
    RK.err = "Configure o Supabase na aba Conta.";
    return;
  }
  ((RK.busy = 1), (RK.err = ""), rkPinta());
  const [a, o] = await Promise.allSettled([
    fetch(t.url + "/functions/v1/macro", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: t.key },
      body: JSON.stringify({ modo: "ranking" }),
    }).then(async (s) => {
      const n = await s.json().catch(() => ({}));
      if (!s.ok) throw new Error(n.error || "Erro " + s.status);
      if (!Array.isArray(n.altas))
        throw new Error(
          'Publique a nova versão da função "macro" no Supabase.',
        );
      return n;
    }),
    SESS
      ? rq(
          "/rest/v1/cotacoes?select=ticker,ult,fec,var,updated_at&user_id=eq." +
            SESS.uid,
        ).then((s) => s.json())
      : Promise.resolve([]),
  ]);
  (a.status === "fulfilled"
    ? (RK.v = a.value)
    : (RK.err = String((a.reason && a.reason.message) || a.reason)),
    (RK.prof =
      o.status === "fulfilled" && Array.isArray(o.value) ? o.value : []),
    (RK.ts = Date.now()),
    (RK.busy = 0),
    rkPinta());
}
function rkMonta() {
  const e = Date.now() - 6e5,
    t = (n) => {
      const r = typeof n == "string" ? parseFloat(n) : n;
      return typeof r == "number" && isFinite(r) ? r : null;
    },
    a = new Map();
  if (
    ((RK.prof || []).forEach((n) => {
      const r = String(n.ticker || "").toUpperCase(),
        i = t(n.ult);
      if (!rkAcao(r) || !(i > 0) || Date.parse(n.updated_at) < e) return;
      const l = t(n.fec),
        d = t(n.var) ?? (l ? (i / l - 1) * 100 : null);
      d != null && a.set(r, { tk: r, px: i, var: +(+d).toFixed(2), pf: 1 });
    }),
    a.size >= 30)
  ) {
    const n = [...a.values()];
    return {
      fonte: "Profit (tempo real)",
      prof: 1,
      altas: n
        .filter((r) => r.var > 0)
        .sort((r, i) => i.var - r.var)
        .slice(0, 10),
      baixas: n
        .filter((r) => r.var < 0)
        .sort((r, i) => r.var - i.var)
        .slice(0, 10),
    };
  }
  if (!RK.v) return null;
  const o = {};
  [...RK.v.altas, ...RK.v.baixas].forEach((n) => (o[n.tk] = n.nome));
  const s = (n) =>
    n.map((r) => (a.has(r.tk) ? { ...r, ...a.get(r.tk), nome: r.nome } : r));
  return {
    fonte:
      "TradingView (pode ter até 15 min de atraso)" +
      (a.size ? " + Profit nos ativos que a ponte manda" : ""),
    prof: 0,
    altas: s(RK.v.altas)
      .filter((n) => n.var > 0)
      .sort((n, r) => r.var - n.var)
      .slice(0, 10),
    baixas: s(RK.v.baixas)
      .filter((n) => n.var < 0)
      .sort((n, r) => n.var - r.var)
      .slice(0, 10),
    nm: o,
  };
}
function rkPinta() {
  const e = document.getElementById("rkbox");
  e && (e.innerHTML = rkCorpo());
}
function rkCorpo() {
  const e = rkMonta();
  if (!e)
    return `<div class="sm ${RK.err ? "am" : "mut"}" style="padding:10px 0">${esc(RK.busy ? "Buscando…" : RK.err || "Carregando…")}</div>`;
  const t = Math.max(
      ...[...e.altas, ...e.baixas].map((s) => Math.abs(s.var)),
      1,
    ),
    a = (s) =>
      (s > 0 ? "+" : "") +
      s.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) +
      "%",
    o = (s, n) =>
      s
        .map(
          (r, i) =>
            `<div style="display:grid;grid-template-columns:22px 70px 1fr 64px 64px;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--bd,#f4f3f1);font-size:13px"><span class="mut">${i + 1}</span><b>${esc(r.tk)}</b><span style="height:8px;border-radius:8px;background:${n};opacity:.75;width:${Math.max(4, Math.round((Math.abs(r.var) / t) * 100))}%"></span><span style="text-align:right">${r.px.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><b style="text-align:right;color:${n}">${a(r.var)}</b></div>`,
        )
        .join("") || '<div class="sm mut">Nenhuma.</div>';
  return `${RK.err ? `<div class="sm am">${esc(RK.err)}</div>` : ""}<div class="sz-h" style="font-weight:700;margin:6px 0 2px;color:#2e8b5d">▲ 10 maiores altas</div>${o(e.altas, "#2e8b5d")}
  <div style="font-weight:700;margin:14px 0 2px;color:#dc3e26">▼ 10 maiores baixas</div>${o(e.baixas, "#dc3e26")}
  <button class="btn" data-rk="img" style="width:100%;margin-top:12px">📸 Gerar imagem para o grupo</button>
  <div class="sm mut" style="margin-top:6px">Fonte: ${esc(e.fonte)}. Ações líquidas da B3 (sem BDRs). ${e.prof ? "" : "Para ter em tempo real, deixe a ponte do Profit ligada: ela já manda as ações do Ibovespa."}</div>`;
}
function vRanking() {
  return (
    setTimeout(() => rkCarrega(), 0),
    `<div class="card"><div class="top"><b>📊 Maiores altas e baixas · B3</b><button class="btn s" data-rk="rf">${RK.busy ? "…" : "↻"}</button></div><div id="rkbox">${rkCorpo()}</div></div>`
  );
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "rk" ? e.apply(this, arguments) : vRanking();
  };
}
setInterval(() => {
  try {
    tab === "mercado" && MKT.tab === "rk" && !document.hidden && rkCarrega();
  } catch {}
}, 6e4);
function rkDesenha(e) {
  const t = document.createElement("canvas");
  ((t.width = 1080), (t.height = 1580));
  const a = t.getContext("2d"),
    o = (f, x) =>
      (x ? "700 " : "500 ") +
      f +
      "px Inter, system-ui, -apple-system, sans-serif",
    s = (f, x, v, g = {}) => {
      ((a.font = o(g.s || 24, g.b)),
        (a.fillStyle = g.c || "#16171a"),
        (a.textAlign = g.al || "left"),
        a.fillText(f, x, v));
    },
    n = (f, x, v, g, h, b, y) => {
      (a.beginPath(),
        a.moveTo(f + h, x),
        a.arcTo(f + v, x, f + v, x + g, h),
        a.arcTo(f + v, x + g, f, x + g, h),
        a.arcTo(f, x + g, f, x, h),
        a.arcTo(f, x, f + v, x, h),
        a.closePath(),
        b && ((a.fillStyle = b), a.fill()),
        y && ((a.strokeStyle = y), (a.lineWidth = 2), a.stroke()));
    };
  ((a.fillStyle = "#efeeeb"),
    a.fillRect(0, 0, 1080, 1580),
    (a.fillStyle = "#16171a"),
    a.fillRect(0, 0, 1080, 150),
    (a.fillStyle = "#ac8439"),
    a.fillRect(0, 150, 1080, 5));
  const r = new Date(),
    i = r.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    }),
    l = r.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  (s("ALTAS E BAIXAS DA B3", 48, 62, { s: 28, b: 1, c: "#66cc99" }),
    s(i.charAt(0).toUpperCase() + i.slice(1) + " · " + l, 48, 112, {
      s: 42,
      b: 1,
      c: "#fff",
    }));
  const d = typeof imgQ == "function" ? imgQ("^BVSP") : null;
  d &&
    d.d1 != null &&
    (n(750, 40, 282, 76, 38, d.d1 >= 0 ? "#2e8b5d" : "#dc3e26"),
    s(
      "IBOV " +
        (d.d1 > 0 ? "+" : "") +
        d.d1.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        "%",
      891,
      90,
      { s: 30, b: 1, c: "#fff", al: "center" },
    ));
  const c = Math.max(
      ...[...e.altas, ...e.baixas].map((f) => Math.abs(f.var)),
      1,
    ),
    p = (f) =>
      (f > 0 ? "+" : "") +
      f.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) +
      "%",
    u = (f, x, v, g, h) => (
      s(f, 48, h + 34, { s: 32, b: 1, c: v }),
      (h += 52),
      n(36, h, 1008, 580, 22, "#fff", "#efeeeb"),
      x.forEach((b, y) => {
        const j = h + 20 + y * 56 + 38;
        (s(String(y + 1), 64, j, { s: 24, c: "#9ca0a9" }),
          s(b.tk, 104, j, { s: 30, b: 1 }));
        const k = (e.nm && e.nm[b.tk]) || b.nome || "";
        k && s(k.slice(0, 16), 252, j, { s: 20, c: "#7a808c" });
        const A = Math.max(8, Math.round((Math.abs(b.var) / c) * 200));
        (n(520, j - 18, A, 20, 10, g),
          s(
            b.px.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            880,
            j,
            { s: 26, al: "right" },
          ),
          s(p(b.var), 1016, j, { s: 30, b: 1, c: v, al: "right" }),
          y < 9 && ((a.fillStyle = "#f4f3f1"), a.fillRect(56, j + 18, 968, 1)));
      }),
      x.length || s("Nenhuma.", 64, h + 60, { s: 24, c: "#9ca0a9" }),
      h + 560 + 20
    );
  let m = u("▲ 10 maiores altas", e.altas, "#2e8b5d", "#dddad5", 180);
  return (
    (m = u("▼ 10 maiores baixas", e.baixas, "#dc3e26", "#f9d5cf", m + 16)),
    s(
      "Fonte: " +
        e.fonte.replace(/ \(pode.*\)/, " (com atraso)") +
        ". Ações líquidas da B3, sem BDRs.",
      1080 / 2,
      1528,
      { s: 20, c: "#7a808c", al: "center" },
    ),
    s(
      "Material informativo, não é recomendação de investimento.",
      1080 / 2,
      1558,
      { s: 20, c: "#7a808c", al: "center" },
    ),
    t
  );
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-rk]");
  if (t) {
    if (t.dataset.rk === "rf") {
      rkCarrega(!0);
      return;
    }
    if (t.dataset.rk === "img") {
      const a = rkMonta();
      if (!a) return;
      try {
        const o = rkDesenha(a),
          s = await new Promise((r) => o.toBlob(r, "image/jpeg", 0.92));
        ((IMG.blob = s),
          (IMG.nome =
            "altas-baixas-" +
            loc().slice(0, 10) +
            "-" +
            new Date().toTimeString().slice(0, 5).replace(":", "h") +
            ".jpg"));
        const n = (r) =>
          r
            .slice(0, 3)
            .map(
              (i) =>
                i.tk +
                " " +
                (i.var > 0 ? "+" : "") +
                i.var.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }) +
                "%",
            )
            .join(", ");
        ((IMG.titulo = "Altas e baixas da B3"),
          (IMG.legenda =
            "📊 Altas e baixas da B3 – " +
            new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            }) +
            " · ▲ " +
            n(a.altas) +
            " · ▼ " +
            n(a.baixas)),
          imgMostra(URL.createObjectURL(s)));
      } catch {
        toast("Não consegui montar a imagem");
      }
    }
  }
});
const DSES = { d: null, s: null };
function dsAtual() {
  const e = loc().slice(0, 10);
  if (DSES.d === D && DSES.s) return DSES.s;
  if (D !== e) return "m";
  const [t, a] = String(NP.n || "18:50")
    .split(":")
    .map(Number);
  return new Date().getHours() * 60 + new Date().getMinutes() >=
    Math.min(1020, t * 60 + a - 60)
    ? "n"
    : "m";
}
function noiteHtml(e) {
  const t = e.noite || {},
    a = (o, s, n = "") =>
      `<label>${s}<textarea data-n2="${o}" placeholder="${esc(n)}">${esc(t[o] || "")}</textarea></label>`;
  return `<label>Como estou agora?</label><div class="chips2">${EMO.map((o, s) => `<button class="${t.energia == s + 1 ? "on" : ""}" data-n2seg="energia" data-v="${s + 1}">${o}</button>`).join("")}</div>
<div class="g2" style="grid-template-columns:1fr"><label>Tipo de mercado na sessão<select data-n2="mkt"><option value="">–</option>${opt(MK, t.mkt)}</select></label></div>
${a("plano", "Plano da sessão nos EUA", "Cenário em NY, níveis, ativos (S&P, Nasdaq, ouro, petróleo…), horário de parar")}
${a("pre", "Ensaio mental: o que pode dar errado na sessão e como vou reagir?")}
${e.plano || e.pre ? `<details class="card" style="margin-top:8px"><summary class="sm"><b>☀️ Ver a preparação da manhã</b></summary>${e.plano ? `<div class="sm" style="margin-top:6px"><b>Plano:</b> ${esc(e.plano)}</div>` : ""}${e.pre ? `<div class="sm" style="margin-top:4px"><b>Ensaio:</b> ${esc(e.pre)}</div>` : ""}</details>` : ""}`;
}
{
  const e = vDia;
  vDia = function () {
    let t = e.apply(this, arguments);
    if (typeof DV < "u" && DV === "hist") return t;
    try {
      typeof GO < "u" &&
        (GO.r === "n" || GO.r === "m") &&
        ((DSES.d = D), (DSES.s = GO.r));
      const a = dsAtual(),
        o = "<h2>☀️ Antes do mercado</h2>",
        s = t.indexOf(o),
        n = t.indexOf("<h2>✅ Checklist de regras"),
        r = t.indexOf("<h2>🌙 Depois do mercado (debriefing)</h2>");
      if (s < 0 || n < s || r < n) return t;
      const i = S.days[D] || {},
        l = (x) => (String(x || "").trim() ? "✓" : "–"),
        d = `<div class="seg" style="margin:4px 0;display:grid;grid-template-columns:1fr 1fr"><button class="${a === "m" ? "on" : ""}" data-dses="m">☀️ Manhã <span class="sm mut">${l(i.plano)}</span></button><button class="${a === "n" ? "on" : ""}" data-dses="n">🌐 Noite <span class="sm mut">${l((i.noite || {}).plano)}</span></button></div><div class="sm mut" style="margin-bottom:6px">Cada sessão tem a sua preparação, salva separada no mesmo dia.</div>`;
      let c = t.slice(s + o.length, n),
        p = t.slice(n, r);
      const u = p.indexOf('<div class="card" id="rot-n">'),
        m = u >= 0 ? p.indexOf('<details class="card" id="rtd"', u) : -1,
        f = u >= 0 && m > u ? p.slice(u, m) : "";
      if ((f && (p = p.slice(0, u) + p.slice(m)), a === "n")) {
        const x = c.indexOf('<div class="card" id="rot-m">');
        c = (x >= 0 ? c.slice(0, x) : "") + f + noiteHtml(i);
      }
      return t.slice(0, s) + o + d + c + p + t.slice(r);
    } catch {
      return t;
    }
  };
}
(document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-dses]");
  if (a) {
    ((DSES.d = D), (DSES.s = a.dataset.dses), render());
    return;
  }
  const o = e.target.closest("[data-n2seg]");
  if (o) {
    const s = (t = S.days)[D] ?? (t[D] = { chk: {} }),
      n = s.noite ?? (s.noite = {});
    ((n[o.dataset.n2seg] = +o.dataset.v),
      (n.u = s.u = Date.now()),
      save(),
      o.parentElement
        .querySelectorAll("button")
        .forEach((r) => r.classList.toggle("on", r === o)));
  }
}),
  document.addEventListener("input", (e) => {
    var t;
    const a = e.target;
    if (!a.dataset || !a.dataset.n2) return;
    const o = (t = S.days)[D] ?? (t[D] = { chk: {} }),
      s = o.noite ?? (o.noite = {});
    ((s[a.dataset.n2] = a.value), (s.u = o.u = Date.now()), save());
  }),
  document.addEventListener("change", (e) => {
    var t;
    const a = e.target;
    if (a.dataset && a.dataset.n2) {
      const o = (t = S.days)[D] ?? (t[D] = { chk: {} }),
        s = o.noite ?? (o.noite = {});
      ((s[a.dataset.n2] = a.value), (s.u = o.u = Date.now()), save());
      return;
    }
  }));
const DG = {
    busy: 0,
    fontes: null,
    ia: null,
    ult: null,
    uso: null,
    err: "",
    em: 0,
  },
  DG_NOME = {
    giro: "Giro (todos)",
    "giro:pre": "Giro pré-abertura",
    "giro:meio": "Giro meio do pregão",
    "giro:fech": "Giro fechamento",
    br: "Briefing 9h30",
    bal: "Balanços 7h",
    m: "Checklist da manhã",
    n: "Checklist da noite",
    coach: "Resumo do dia 18h",
    rel: "Relatório de sexta",
    sem: "Revisão de domingo",
    ev: "Notícias",
  };
async function dgTesta() {
  if (DG.busy) return;
  const e = cfg();
  if (!e) {
    ((DG.err = "Configure o Supabase na aba Conta."), dgPinta());
    return;
  }
  ((DG.busy = 1), (DG.err = ""), dgPinta());
  const [t, a, o, s] = await Promise.allSettled([
    fetch(e.url + "/functions/v1/macro", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: e.key },
      body: JSON.stringify({ modo: "diag" }),
    }).then(async (n) => {
      const r = await n.json().catch(() => ({}));
      if (!n.ok || !Array.isArray(r.itens))
        throw new Error(r.error || 'Publique a função "macro" mais nova.');
      return r.itens;
    }),
    anxCall({ modo: "diag" }),
    alFn("ultimos", {}),
    anxCall({ modo: "uso" }),
  ]);
  ((DG.fontes =
    t.status === "fulfilled"
      ? t.value
      : [
          {
            fonte: "Função macro",
            uso: "—",
            ok: !1,
            ms: 0,
            detalhe: String((t.reason && t.reason.message) || t.reason),
          },
        ]),
    (DG.ia =
      a.status === "fulfilled"
        ? a.value
        : { erro: String((a.reason && a.reason.message) || a.reason) }),
    (DG.ult =
      o.status === "fulfilled"
        ? o.value
        : { erro: String((o.reason && o.reason.message) || o.reason) }),
    (DG.uso = s.status === "fulfilled" ? s.value : null),
    (DG.em = Date.now()),
    (DG.busy = 0),
    dgPinta());
}
function dgPinta() {
  const e = document.getElementById("dgbox");
  e && (e.innerHTML = dgCorpo());
}
function dgCorpo() {
  if (DG.busy)
    return '<div class="sm mut" style="padding:8px 0">Testando as fontes… (até 40 segundos)</div>';
  if (!DG.fontes)
    return `<div class="sm ${DG.err ? "am" : "mut"}">${esc(DG.err || 'Toque em "Testar fontes" para ver se cada fonte de dados está respondendo.')}</div>`;
  const e = (r) =>
      `<div style="display:grid;grid-template-columns:22px 1fr auto;gap:6px;padding:6px 0;border-bottom:1px solid var(--bd,#f4f3f1)"><span>${r.ok ? "✅" : "❌"}</span><span><b>${esc(r.fonte)}</b><div class="sm mut">${esc(r.uso)} · ${esc(r.detalhe)}</div></span><span class="sm mut">${(r.ms / 1e3).toFixed(1).replace(".", ",")}s</span></div>`,
    t = DG.ia || {},
    a = t.teste && /^respondeu/.test(t.teste),
    o = (r) => (r ? r.slice(8, 10) + "/" + r.slice(5, 7) : "—"),
    s = loc().slice(0, 10),
    n = (DG.ult && DG.ult.ultimos) || {};
  return `${DG.fontes.map(e).join("")}
  <div style="display:grid;grid-template-columns:22px 1fr;gap:6px;padding:6px 0;border-bottom:1px solid var(--bd,#f4f3f1)"><span>${t.erro ? "❌" : a ? "✅" : "⚠️"}</span><span><b>IA do Google (Gemini)</b><div class="sm mut">${t.erro ? esc(t.erro) : `Teste: ${esc(t.teste || "—")} (${((t.ms || 0) / 1e3).toFixed(1).replace(".", ",")}s) · principal ${esc(t.principal || "—")} · Giro e resumos ${esc(t.giro || "—")} · reservas ${esc((t.reservas || []).join(", ") || "—")}`}</div></span></div>
  ${DG.uso ? `<div class="sm" style="margin-top:8px">🤖 Uso da IA hoje: <b>${DG.uso.ilimitado ? "Sem limite diário do aplicativo" : DG.uso.hoje + " de " + DG.uso.limite}</b> análises${DG.uso.dono ? "" : " (limite definido pelo dono do app)"}.</div>` : ""}
  <div style="margin-top:10px"><b class="sm">📬 Últimos avisos enviados para os seus aparelhos</b>${DG.ult && DG.ult.erro ? `<div class="sm am">${esc(DG.ult.erro)}</div>` : `<div class="sm mut">${(DG.ult && DG.ult.aparelhos) || 0} aparelho(s) inscrito(s).</div>`}
  <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">${["giro:07", "giro:0910", "giro:10", "giro:12", "giro:15", "giro:1720", "br", "bal", "m", "n", "coach", "rel", "sem", "jornal", "plantao"].map((r) => `<span style="background:rgba(127,127,127,0.1);border-radius:8px;padding:3px 8px;font-size:12px">${DG_NOME[r]}: <b class="${n[r] === s ? "g" : ""}">${o(n[r])}</b></span>`).join("")}</div></div>
  <div class="sm mut" style="margin-top:6px">Testado às ${new Date(DG.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Se alguma fonte ficar com ❌ por mais de um dia, me mande um print.</div>`;
}
{
  const e = vStatus;
  vStatus = function () {
    return (
      e.apply(this, arguments) +
      `<div class="card" style="margin-top:10px"><div class="top"><b>🩺 Diagnóstico das fontes</b><button class="btn s" data-dg="1">${DG.busy ? "…" : "Testar fontes"}</button></div><div id="dgbox">${dgCorpo()}</div></div>`
    );
  };
}
document.addEventListener("click", (e) => {
  e.target.closest("[data-dg]") && dgTesta();
});
const USO = { v: null, ts: 0 };
async function usoCarrega() {
  if (!(Date.now() - USO.ts < 6e4)) {
    USO.ts = Date.now();
    try {
      USO.v = await anxCall({ modo: "uso" });
      const e = document.getElementById("usobox");
      e && (e.innerHTML = usoTxt());
    } catch {}
  }
}
const usoTxt = () =>
  USO.v
    ? USO.v.ilimitado
      ? "IA sem limite diário do aplicativo."
      : `🤖 Hoje você usou <b>${USO.v.hoje} de ${USO.v.limite}</b> análises com IA.`
    : "";
{
  const e = vAnalise;
  vAnalise = function () {
    return (
      setTimeout(usoCarrega, 0),
      e
        .apply(this, arguments)
        .replace(
          /(<h1[^>]*>[^<]*<\/h1>)/,
          `$1<div class="sm mut" id="usobox" style="margin:-4px 0 8px">${usoTxt()}</div>`,
        )
    );
  };
}
function grDesenha(e) {
  const t = document.createElement("canvas").getContext("2d"),
    a = (g, h) =>
      (h ? "700 " : "500 ") +
      g +
      "px Inter, system-ui, -apple-system, sans-serif",
    o = (g, h, b, y) => {
      t.font = a(h, b);
      const j = [];
      return (
        String(g || "")
          .split(
            `
`,
          )
          .forEach((k) => {
            if (!k.trim()) {
              j.push("");
              return;
            }
            let A = "";
            (k.split(/\s+/).forEach((C) => {
              const I = A ? A + " " + C : C;
              t.measureText(I).width > y && A ? (j.push(A), (A = C)) : (A = I);
            }),
              A && j.push(A));
          }),
        j
      );
    },
    s = o(e.titulo, 40, 1, 968),
    n = o(e.texto, 27, 0, 968),
    r = (e.tecnico || []).map((g) => o(g, 24, 0, 938)),
    i = (e.cotacoes || [])
      .filter((g) =>
        [
          "ibov",
          "dolar",
          "spx",
          "ndq",
          "brent",
          "sgx",
          "di29",
          "ouro",
          "btc",
          "dxy",
          "ewz",
        ].includes(g.k),
      )
      .slice(0, 8),
    l =
      200 +
      s.length * 50 +
      30 +
      n.length * 40 +
      (r.length ? 70 + r.reduce((g, h) => g + h.length * 34 + 8, 0) : 0) +
      (i.length ? 60 + Math.ceil(i.length / 2) * 64 : 0) +
      120,
    d = document.createElement("canvas");
  ((d.width = 1080), (d.height = l));
  const c = d.getContext("2d"),
    p = (g, h, b, y = {}) => {
      ((c.font = a(y.s || 24, y.b)),
        (c.fillStyle = y.c || "#16171a"),
        (c.textAlign = y.al || "left"),
        c.fillText(g, h, b));
    },
    u = (g, h, b, y, j, k, A) => {
      (c.beginPath(),
        c.moveTo(g + j, h),
        c.arcTo(g + b, h, g + b, h + y, j),
        c.arcTo(g + b, h + y, g, h + y, j),
        c.arcTo(g, h + y, g, h, j),
        c.arcTo(g, h, g + b, h, j),
        c.closePath(),
        k && ((c.fillStyle = k), c.fill()),
        A && ((c.strokeStyle = A), (c.lineWidth = 2), c.stroke()));
    };
  ((c.fillStyle = "#efeeeb"),
    c.fillRect(0, 0, 1080, l),
    (c.fillStyle = "#16171a"),
    c.fillRect(0, 0, 1080, 140),
    (c.fillStyle = "#ac8439"),
    c.fillRect(0, 140, 1080, 5));
  const m = new Date(e.gerado || Date.now()),
    f = m.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    }),
    x = m.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  (p("GIRO DO MERCADO · " + (GR_N[e.janela] || "").toUpperCase(), 56, 60, {
    s: 26,
    b: 1,
    c: "#d4b57d",
  }),
    p(f.charAt(0).toUpperCase() + f.slice(1) + " · " + x, 56, 108, {
      s: 38,
      b: 1,
      c: "#fff",
    }));
  let v = 200;
  if (
    (s.forEach((g) => {
      (p(g, 56, v, { s: 40, b: 1 }), (v += 50));
    }),
    (v += 10),
    n.forEach((g) => {
      (g && p(g, 56, v, { s: 27, c: "#26282b" }), (v += g ? 40 : 20));
    }),
    r.length)
  ) {
    v += 20;
    const g = r.reduce((h, b) => h + b.length * 34 + 8, 0) + 50;
    (u(40, v - 6, 1e3, g, 18, "#ffffff", "#efeeeb"),
      p("Leitura técnica", 56, v + 30, { s: 26, b: 1 }),
      (v += 66),
      r.forEach((h) => {
        (p("•", 56, v, { s: 24, c: "#2e8b5d", b: 1 }),
          h.forEach((b) => {
            (p(b, 82, v, { s: 24, c: "#373a3f" }), (v += 34));
          }),
          (v += 8));
      }),
      (v += 10));
  }
  if (i.length) {
    v += 20;
    const g = 952 / 2,
      h = (b) =>
        b == null
          ? "–"
          : (b > 0 ? "+" : "") +
            b.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) +
            "%";
    (i.forEach((b, y) => {
      const j = y % 2,
        k = Math.floor(y / 2),
        A = 56 + j * (g + 16),
        C = v + k * 64;
      u(A, C, g, 54, 14, "#ffffff", "#efeeeb");
      const I = b.k.startsWith("di");
      (p(b.n.replace(/ \(.*\)$/, ""), A + 18, C + 36, { s: 22, b: 1 }),
        p(
          I
            ? (b.d1 >= 0 ? "+" : "") +
                (b.d1 || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                }) +
                " p.p."
            : h(b.d1),
          A + g - 18,
          C + 36,
          {
            s: 23,
            b: 1,
            c:
              (b.d1 || 0) > 0
                ? "#2e8b5d"
                : (b.d1 || 0) < 0
                  ? "#dc3e26"
                  : "#7a808c",
            al: "right",
          },
        ));
    }),
      (v += Math.ceil(i.length / 2) * 64));
  }
  return (
    p(
      "Texto gerado por IA com cotações do " +
        (e.profit ? "Profit e do TradingView" : "TradingView") +
        " e notícias do dia. Confira antes de repassar.",
      1080 / 2,
      l - 56,
      { s: 19, c: "#7a808c", al: "center" },
    ),
    p(
      "Material informativo, não é recomendação de investimento.",
      1080 / 2,
      l - 26,
      { s: 19, c: "#7a808c", al: "center" },
    ),
    d
  );
}
{
  const e = grCorpo;
  grCorpo = function () {
    return e
      .apply(this, arguments)
      .replace(
        '<button class="btn s" data-gr="sh">📤 Compartilhar</button>',
        '<button class="btn s" data-gr="sh">📤 Compartilhar</button><button class="btn s" data-gr="img">📸 Imagem</button>',
      );
  };
}
document.addEventListener("click", async (e) => {
  if (!e.target.closest('[data-gr="img"]')) return;
  const t = GR.j || grAgora(),
    a = GR.v[loc().slice(0, 10) + t];
  if (a)
    try {
      const o = grDesenha(a),
        s = await new Promise((n) => o.toBlob(n, "image/jpeg", 0.92));
      ((IMG.blob = s),
        (IMG.nome = "giro-" + t + "-" + loc().slice(0, 10) + ".jpg"),
        (IMG.titulo = a.titulo),
        (IMG.legenda = a.titulo),
        imgMostra(URL.createObjectURL(s)));
    } catch {
      toast("Não consegui montar a imagem");
    }
});
try {
  if (typeof NP < "u" && NP.on) {
    let e = 0;
    (NP.on.coach === void 0 && ((NP.on.coach = !0), (e = 1)),
      NP.on.rel === void 0 && ((NP.on.rel = !0), (e = 1)),
      e && ls.set("diario-np", NP));
  }
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("coach", "🧭 Resumo do seu dia (18h05)")}${t("rel", "📋 Relatório da semana (sexta, 19h)")}<div class="sm mut" style="margin-bottom:8px">A IA compara seus trades e checklists com o que o mercado fez. Na sexta, o relatório junta os checklists da manhã e da noite e as operações da semana.</div>`
    );
  };
}
const rd2c = (e) =>
  e == null || !isFinite(e) ? null : Math.round(e * 100) / 100;
function prepDe(e, t) {
  const a = t === "n" ? e.noite || {} : e,
    o = rotS()[t];
  return {
    rotina: o.length ? rotDone(e, t) + "/" + o.length : "sem rotina",
    plano: String(a.plano || "").slice(0, 400),
    ensaio: String(a.pre || "").slice(0, 300),
    energia: a.energia || null,
    tipo_mercado: a.mkt || null,
    feita: !!String(a.plano || "").trim(),
  };
}
function dadosDia(e, t) {
  const a = S.days[e] || {},
    o = dayTr(e),
    s = o.filter((n) => n.c.pl != null);
  return {
    data: e,
    dia_semana: dsem(e),
    operacoes: o
      .slice(0, 40)
      .map((n) => ({
        ativo: n.ativo,
        lado: n.side === "C" ? "compra" : "venda",
        hora: String(n.dt || "").slice(11, 16),
        tipo: n.tipo,
        setup: n.setup || null,
        resultado_R: rd2c(n.c.r),
        resultado: rd2c(n.c.pl),
        seguiu_regras:
          n.rules === "s" ? "sim" : n.rules === "n" ? "não" : "não marcou",
        erro: n.err && n.err !== "Nenhum" ? n.err : null,
        nota: n.nota ? String(n.nota).slice(0, 160) : null,
      })),
    resultado_dia: rd2c(dayPL(o)),
    trades: o.length,
    fechados: s.length,
    preparacao_manha: prepDe(a, "m"),
    preparacao_noite: prepDe(a, "n"),
    regras_marcadas_no_dia: S.rules.length
      ? chkN(a.chk) + "/" + S.rules.length
      : null,
    limites: { perda_maxima: limPerda(a) || null, max_trades: +a.maxT || null },
    debriefing: {
      como_foi: String(a.resumo || "").slice(0, 400),
      errou: a.erros === "s" ? "sim" : a.erros === "n" ? "não" : null,
      o_que_fiz_bem: String(a.bem || "").slice(0, 300),
      aprendizado: String(a.aprend || "").slice(0, 300),
      nota: a.nota ?? null,
    },
    ...(t ? { regras_escritas: S.rules.map((n) => n.t).slice(0, 25) } : {}),
  };
}
const COACH = { busy: "" };
function coachHtml(e, t) {
  if (!e) return "";
  const a = (o, s) =>
    s && s.length
      ? `<div class="sm" style="margin-top:8px;font-weight:700">${o}</div><ul style="margin:2px 0 0 18px;padding:0;font-size:14px">${s.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
      : "";
  return `<div style="line-height:1.5;font-size:14px;margin-top:6px">${esc(e.resumo)}</div>${e.nota_disciplina != null ? `<div class="sm" style="margin-top:6px">Nota de disciplina: <b>${String(e.nota_disciplina).replace(".", ",")}/10</b></div>` : ""}${a("✅ Pontos fortes", e.pontos_fortes)}${a("⚠️ A melhorar", e.a_melhorar)}${a("🔁 Padrões", e.padroes)}${a(t, e.plano)}<div class="sm mut" style="margin-top:6px">Gerado pela IA em ${new Date(e.gerado || Date.now()).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}, só com os seus dados.</div>`;
}
async function coachDia(e) {
  var t;
  if (COACH.busy) return;
  COACH.busy = "d" + e;
  const a = document.getElementById("cobox");
  a &&
    (a.innerHTML =
      '<div class="sm mut">A IA está lendo seus trades e checklists de hoje…</div>');
  try {
    const s = dadosDia(e, !0),
      n = GR.v[e + "fech"] || GR.v[e + "meio"];
    n && (s.mercado_no_dia = (n.titulo + ". " + n.texto).slice(0, 1500));
    const r = await anxCall({ modo: "coach", periodo: "dia", dados: s });
    ((((t = S.days)[e] ?? (t[e] = { chk: {} })).coach = r),
      (S.days[e].u = Date.now()),
      save());
  } catch (s) {
    toast(String(s.message || s));
  }
  COACH.busy = "";
  const o = document.getElementById("rot-coach");
  o && (o.outerHTML = coachCard(e));
}
function coachCard(e) {
  const t = (S.days[e] || {}).coach;
  return `<div class="card" id="rot-coach" style="margin-top:12px"><div class="top"><b>🧭 Resumo do dia (IA)</b><button class="btn s" data-coach="${e}">${t ? "↻ Refazer" : "Gerar"}</button></div><div id="cobox">${t ? coachHtml(t, "📌 Para amanhã") : '<div class="sm mut">Compara seus trades e a preparação da manhã e da noite com as suas regras e com o que o mercado fez. Gere no fim do dia.</div>'}</div></div>`;
}
{
  const e = vDia;
  vDia = function () {
    const t = e.apply(this, arguments);
    if (typeof DV < "u" && DV === "hist") return t;
    try {
      if (typeof GO < "u" && GO.r === "coach") {
        DFASE = { d: D, f: "pos" };
        const a = D;
        (S.days[a] || {}).coach || setTimeout(() => coachDia(a), 400);
      }
    } catch {}
    return t + coachCard(D);
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-coach]");
  t && coachDia(t.dataset.coach);
});
function relDias(e) {
  const t = [];
  for (let a = 0; a < 5; a++) t.push(addD(e, a));
  return t;
}
function relHtml(e, t, a) {
  const o = relDias(e),
    s = (S.relsem || {})[a],
    n = o
      .map((u) => {
        const m = S.days[u] || {},
          f = dayTr(u),
          x = prepDe(m, "m"),
          v = prepDe(m, "n"),
          g = dayPL(f),
          h = f.filter((y) => y.rules === "s").length,
          b = (y) =>
            `${y.feita ? "✓" : "–"} <span class="mut">${esc(y.rotina)}</span>`;
        return `<tr><td>${dsem(u)} ${u.slice(8, 10)}/${u.slice(5, 7)}</td><td>${b(x)}</td><td>${b(v)}</td><td>${f.length}</td><td class="${cls(g)}">${f.length ? money(g) : "–"}</td><td>${f.length ? h + "/" + f.length : "–"}</td></tr>`;
      })
      .join(""),
    r = o.map((u) => dayTr(u)).flat(),
    i = dayPL(r),
    l = o.filter((u) => prepDe(S.days[u] || {}, "m").feita).length,
    d = o.filter((u) => prepDe(S.days[u] || {}, "n").feita).length,
    c = {};
  r.forEach((u) => {
    u.err && u.err !== "Nenhum" && (c[u.err] = (c[u.err] || 0) + 1);
  });
  const p = Object.entries(c)
    .sort((u, m) => m[1] - u[1])
    .slice(0, 3);
  return `<section class="card" id="relsem" style="padding:14px;margin-bottom:12px"><div class="top"><b style="font-size:18px">📋 Relatório da semana</b><span class="sm mut">${fmtD(o[0]).slice(0, 5)} a ${fmtD(o[4]).slice(0, 5)}</span></div>
  <div class="g2" style="gap:8px;margin:8px 0"><div class="card" style="margin:0;padding:8px 10px"><div class="sm mut">Preparação da manhã</div><b>${l} de 5 dias</b></div><div class="card" style="margin:0;padding:8px 10px"><div class="sm mut">Preparação da noite</div><b>${d} de 5 dias</b></div>
  <div class="card" style="margin:0;padding:8px 10px"><div class="sm mut">Operações</div><b>${r.length}</b> <span class="sm ${cls(i)}">${money(i)}</span></div><div class="card" style="margin:0;padding:8px 10px"><div class="sm mut">Seguiu as regras</div><b>${r.length ? Math.round((r.filter((u) => u.rules === "s").length / r.length) * 100) + "%" : "–"}</b></div></div>
  <div style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th>Dia</th><th>Manhã</th><th>Noite</th><th>Trades</th><th>Resultado</th><th>Regras</th></tr>${n}</table></div>
  ${p.length ? `<div class="sm" style="margin-top:6px">Erros mais frequentes: ${p.map(([u, m]) => `<b>${esc(u)}</b> (${m}x)`).join(" · ")}</div>` : ""}
  <div style="margin-top:10px"><div class="top"><b class="sm">🧭 Comentário da IA</b><button class="btn s" data-relia="${a}">${s ? "↻ Refazer" : "Gerar"}</button></div><div id="relbox">${s ? coachHtml(s, "📌 Para a próxima semana") : '<div class="sm mut">A IA lê os checklists e as operações da semana e aponta padrões, pontos fortes e o que mudar.</div>'}</div></div></section>`;
}
async function relIA(e) {
  if (COACH.busy) return;
  COACH.busy = "s";
  const [t] = rng(RP),
    a = document.getElementById("relbox");
  a &&
    (a.innerHTML = '<div class="sm mut">A IA está lendo a sua semana…</div>');
  try {
    const s = relDias(t).map((r) => dadosDia(r, !1)),
      n = await anxCall({
        modo: "coach",
        periodo: "semana",
        dados: {
          semana: { de: s[0].data, ate: s[4].data },
          dias: s,
          regras_escritas: S.rules.map((r) => r.t).slice(0, 25),
        },
      });
    (((S.relsem ?? (S.relsem = {}))[e] = n), save());
  } catch (s) {
    toast(String(s.message || s));
  }
  COACH.busy = "";
  const o = document.getElementById("relsem");
  if (o) {
    const [s, n, r] = rng(RP);
    o.outerHTML = relHtml(s, n, r);
  }
}
