const MK = [
    "Alta calma",
    "Alta volátil",
    "Lateral calma",
    "Lateral volátil",
    "Baixa calma",
    "Baixa volátil",
  ],
  ERR = [
    "Nenhum",
    "Operei com a trava ativa",
    "Entrei por dica/emoção (fora do sistema)",
    "Não saí no stop",
    "Risco grande demais",
    "Saí cedo por emoção",
    "Não segui minha rotina",
    "Operei fora do tipo de mercado",
    "Foquei na entrada, não no risco/retorno",
    "Entrei sem saída predeterminada",
    "Precisava estar certo (realizei cedo/segurei perda)",
    "Operei demais (perdi o controle)",
    "Outro",
  ],
  ESTR = [
    "Compra de call",
    "Compra de put",
    "Venda coberta de call",
    "Venda de put",
    "Trava de alta",
    "Trava de baixa",
    "Financiamento / collar",
    "Straddle / strangle",
    "Borboleta / condor",
    "Calendário",
    "Outra",
  ],
  CATS = ["Plano de trade", "Gestão de risco", "Rotina", "Psicologia"],
  SEED = [
    [0, "Só entro com setup do meu sistema (nunca por dica ou emoção)"],
    [0, "Defino a saída predeterminada antes de entrar"],
    [0, "Só opero o tipo de mercado para o qual meu sistema foi feito"],
    [1, "Defino o stop inicial antes de entrar"],
    [1, "Risco máximo de 1% do capital por trade"],
    [1, "Só pego trade com alvo de pelo menos 3 vezes o risco"],
    [1, "Saio quando o stop é atingido"],
    [3, "Assumo a responsabilidade pelo resultado, sem culpar o mercado"],
    [3, "Aceito a perda no stop: não preciso estar certo"],
  ],
  $ = (e) => document.querySelector(e),
  uid = () => Math.random().toString(36).slice(2, 10),
  sum = (e) => e.reduce((t, a) => t + a, 0),
  avg = (e) => (e.length ? sum(e) / e.length : 0),
  esc = (e) =>
    String(e ?? "").replace(
      /[&<>"']/g,
      (t) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[t],
    ),
  urlSegura = (e) => {
    try {
      const t = new URL(String(e || ""), location.href);
      return /^https?:$/.test(t.protocol) ? t.href : "#";
    } catch {
      return "#";
    }
  },
  durFmt = (e) =>
    e == null || !isFinite(e)
      ? "–"
      : e < 90
        ? Math.round(e) + " min"
        : e < 1440
          ? (e / 60).toFixed(1).replace(".", ",") + " h"
          : (e / 1440).toFixed(1).replace(".", ",") + " dias",
  f2 = (e) =>
    e == null || !isFinite(e) ? "–" : e.toFixed(2).replace(".", ","),
  fr = (e) => (e > 0 ? "+" : "") + f2(e) + "×",
  pc = (e) => Math.round(e * 100) + "%",
  cls = (e) => (e > 0 ? "g" : e < 0 ? "r" : ""),
  NF_BRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
  NF_2 = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  money = (e) =>
    e == null
      ? "–"
      : typeof e == "number"
        ? NF_BRL.format(e)
        : e.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  opt = (e, t) =>
    e
      .map((a) => {
        const [o, s] = Array.isArray(a) ? a : [a, a];
        return `<option value="${esc(o)}"${o == t ? " selected" : ""}>${esc(s)}</option>`;
      })
      .join(""),
  loc = () => {
    const e = new Date();
    return new Date(e - e.getTimezoneOffset() * 6e4).toISOString();
  },
  fdt = (e) => e.slice(8, 10) + "/" + e.slice(5, 7) + " " + e.slice(11, 16),
  LOCAL_SAVE = { revision: 0, committed: 0, pending: !1, error: "" };
let S = { trades: [], days: {}, rules: [], seed: 0 },
  tab = "home",
  T = null,
  orig = {},
  isNew = 0,
  delArm = 0,
  D = loc().slice(0, 10),
  db = null,
  M = {},
  U = {},
  st,
  PER = "all",
  AUTO = 0,
  TIPO = "all",
  OPEN = {},
  QM = 0,
  VW = {},
  LT = "trades",
  SV = 0,
  DV = "ed",
  DX = null,
  LF = { f: "all", q: "" },
  CH = {},
  SESS = null,
  AM = "in",
  RECOV = null,
  SY = { msg: "", email: "" },
  sT;
const inPer = (e) => noPeriodo(e.slice(0, 10), PER, loc().slice(0, 10)),
  tipoSel = () =>
    `<label>Tipo<select id="tp">${opt(
      [
        ["all", "Todos"],
        ["D", "Só day trade"],
        ["S", "Só swing"],
        ["O", "Só opções"],
        ["F", "Só Forex"],
      ],
      TIPO,
    )}</select></label>`,
  sym = (e) => (
    (e = e.trim().toUpperCase()),
    e.includes(":") ? e : "BMFBOVESPA:" + e
  ),
  perSel = () =>
    `<label>Período<select id="per">${opt(PERIODOS, PER)}</select></label>`,
  open = async () => (
    await window.APP_MODULES_READY,
    await window.APP_DEMO_READY,
    new Promise((e) => {
      try {
        const t = indexedDB.open(
          window.DIARIO_DEMO ? "diario-trader-demo-v286" : "diario-trader",
          1,
        );
        ((t.onupgradeneeded = () => {
          (t.result.createObjectStore("kv"), t.result.createObjectStore("img"));
        }),
          (t.onsuccess = () => {
            ((db = t.result), e());
          }),
          (t.onerror = () => e()));
      } catch {
        e();
      }
    })
  ),
  idb = (e, t, ...a) =>
    new Promise((o) => {
      if (!db) return o();
      try {
        const s = db
          .transaction(e, t === "get" ? "readonly" : "readwrite")
          .objectStore(e)
          [t](...a);
        ((s.onsuccess = () => o(s.result)), (s.onerror = () => o()));
      } catch {
        o();
      }
    }),
  persist = () => {
    (clearTimeout(st),
      LOCAL_SAVE.revision++,
      (LOCAL_SAVE.pending = !0),
      (st = setTimeout(persistNow, 250)));
  },
  save = () => {
    (window.TraderWorkflow?.beforeSave(),
      window.DiarioDados?.stamp(diarioDaysCanonical(), Date.now()),
      (S.mt = Date.now()),
      (SV = Date.now()),
      persist(),
      syncSoon(),
      svUi(),
      window.TraderContinuo329?.signal("save"));
  },
  shrink = (e) =>
    new Promise((t) => {
      const a = new Image();
      ((a.onload = () => {
        const o = Math.min(1, 1100 / Math.max(a.width, a.height)),
          s = document.createElement("canvas");
        ((s.width = a.width * o),
          (s.height = a.height * o),
          s.getContext("2d").drawImage(a, 0, 0, s.width, s.height),
          s.toBlob(t, "image/jpeg", 0.7));
      }),
        (a.onerror = () => t(null)),
        (a.src = URL.createObjectURL(e)));
    });
async function fillImgs() {
  for (const e of document.querySelectorAll("img[data-img]")) {
    const t = e.dataset.img;
    if (!U[t]) {
      const a = M[t] || (await idb("img", "get", t));
      a && (U[t] = URL.createObjectURL(a));
    }
    U[t] && (e.src = U[t]);
  }
}
const CAPN = { D: "Day trade", O: "Opções", S: "Swing trade" },
  CAPU = { D: "contrato", O: "lote", S: "lote" };
let CAPO = 0,
  CAPC = 0;
document.addEventListener(
  "toggle",
  (e) => {
    (e.target && e.target.id === "capd" && (CAPO = e.target.open),
      e.target && e.target.id === "capc" && (CAPC = e.target.open));
  },
  !0,
);
function capCalc(e) {
  const t = (c, p) => gv("cap", e + "_" + c, p),
    a = t("ini", "");
  if (a === "" || !isFinite(+a)) return null;
  const o = t("desde", ""),
    s = +t("ap", 0) || 0,
    n = S.trades
      .filter((c) => (c.tipo || "D") === e)
      .map((c) => ({ t: c, c: cBRL(c) }))
      .filter(
        (c) => c.c.pl != null && (!o || (c.t.dtx || c.t.dt).slice(0, 10) >= o),
      ),
    r = sum(n.map((c) => c.c.pl)),
    i = +a + s + r,
    l = +t("cpc", 0) || 0,
    d = +t("rk", 0) || 0;
  return {
    ini: +a,
    ap: s,
    res: r,
    at: i,
    n: n.length,
    pct: +a ? (r / +a) * 100 : null,
    cpc: l,
    rk: d,
    lotes: l > 0 ? Math.max(0, Math.floor(i / l)) : null,
    risco: d > 0 ? (Math.max(0, i) * d) / 100 : null,
    curve: capCurvePts(+a + s, n),
  };
}
function capCard(e) {
  const t = capCalc(e),
    a = CAPU[e],
    o = (n) => gv("cap", e + "_" + n, ""),
    s = (n, r, i, l = "number") =>
      `<label>${r}<input type="${l}"${l === "number" ? ' step="any" inputmode="decimal"' : ""} data-ax="cap.${e}_${n}" value="${esc(o(n))}" placeholder="${i}"></label>`;
  return `<div class="card"><div class="top"><b>💰 Capital · ${CAPN[e]}</b>${t ? `<span class="sm ${cls(t.res)}">${t.res >= 0 ? "+" : ""}${money(t.res)}</span>` : ""}</div>${t ? `<div style="font-size:28px;font-weight:700;margin-top:4px" class="${t.at <= 0 ? "r" : ""}">${money(t.at)}</div><div class="mut sm">Inicial ${money(t.ini)}${t.ap ? " · aportes/saques " + money(t.ap) : ""} · ${t.n} operação(ões) encerrada(s)${t.pct != null ? " · " + (t.pct >= 0 ? "+" : "") + f2(t.pct) + "% sobre o inicial" : ""}</div>${t.lotes != null ? `<div style="margin-top:8px">Pode operar até <b>${t.lotes}</b> ${a}${t.lotes === 1 ? "" : "s"} <span class="mut sm">(${money(t.cpc)} de capital por ${a})</span></div>` : ""}${t.risco != null ? `<div class="sm">Risco por trade (${f2(t.rk)}%): <b>${money(t.risco)}</b></div>` : ""}${t.at <= 0 ? '<div class="warn" style="margin-top:6px">Capital zerado ou negativo nesta modalidade.</div>' : ""}` : '<div class="mut sm" style="margin-top:6px">Informe o capital inicial. Ele sobe e desce com o resultado das operações encerradas, inclusive as importadas do Profit.</div>'}${capCurve(e, t)}
<details id="capd" style="margin-top:8px"${CAPO ? " open" : ""}><summary class="sm">${capResumo(e, t)}</summary><div class="g2" style="margin-top:6px">${s("ini", "Capital inicial (R$)", "2000")}${s("desde", "Contar resultados a partir de", "", "date")}</div><div class="g2">${s("cpc", "Capital por " + a + " (R$)", "1000")}${s("rk", "Risco por trade (%)", "2")}</div><div class="g2">${s("meta", "Meta do ciclo (R$)", "500")}${s("stp", "Stop do ciclo (R$)", "300")}</div>${s("ap", "Aportes (+) ou saques (−) acumulados (R$)", "0")}<div class="mut sm" style="margin-top:6px">Contratos permitidos = capital atual ÷ capital por ${a}. Em branco, a data inicial conta todas as operações já registradas.</div></details></div>`;
}
function capCurvePts(e, t) {
  const a = t
    .slice()
    .sort((n, r) => (n.t.dtx || n.t.dt).localeCompare(r.t.dtx || r.t.dt));
  let o = e;
  const s = [{ v: o, l: "Início" }];
  return (
    a.forEach((n) => {
      o += n.c.pl;
      const r = n.t.dtx || n.t.dt;
      s.push({ v: o, l: r.slice(8, 10) + "/" + r.slice(5, 7) });
    }),
    s
  );
}
function capResumo(e, t) {
  return t
    ? "⚙️ Configurar capital · inicial " +
        money(t.ini) +
        (t.cpc ? " · " + money(t.cpc) + "/" + CAPU[e] : "") +
        (t.rk ? " · risco " + f2(t.rk) + "%" : "")
    : "⚙️ Configurar capital (toque para preencher)";
}
function capCurve(e, t) {
  if (!t || !t.curve || t.curve.length < 2) return "";
  const a = t.curve.map((g) => g.v),
    o = a.length,
    s = Math.min(...a),
    n = Math.max(...a),
    r = (n - s) * 0.1 || Math.abs(n) * 0.05 || 1,
    i = s - r,
    l = n + r,
    d = (g) => ((g / (o - 1)) * 296 + 2).toFixed(1),
    c = (g) => (66 - ((g - i) / (l - i)) * 60).toFixed(1),
    p = a.map((g, h) => d(h) + "," + c(g)).join(" "),
    u = c(a[0]),
    m = a[o - 1] >= a[0],
    f = m ? "var(--g)" : "var(--r)";
  let x = a[0],
    v = 0;
  return (
    a.forEach((g) => {
      ((x = Math.max(x, g)), (v = Math.max(v, x - g)));
    }),
    `<details id="capc"${CAPC ? " open" : ""} style="margin-top:8px"><summary class="sm">📈 Curva de capital · ${o - 1} operação(ões)</summary><svg viewBox="0 0 300 72" style="width:100%;height:auto;margin-top:6px" role="img" aria-label="Curva de capital ${CAPN[e]}"><line x1="0" x2="300" y1="${u}" y2="${u}" stroke="var(--bd)" stroke-dasharray="3"/><polyline fill="none" stroke="${f}" stroke-width="2" points="${p}"/><circle cx="${d(o - 1)}" cy="${c(a[o - 1])}" r="3.5" fill="${f}"/></svg><div class="top sm mut"><span>Mín. ${money(s)}</span><span>Máx. ${money(n)}</span></div><div class="sm mut">Queda máxima (drawdown): <b class="${v > 0 ? "r" : ""}">${money(v)}</b>. Linha tracejada = capital de partida. Conta só trades encerrados desde a data configurada.</div></details>`
  );
}
function capTotal() {
  const e = ["D", "O", "S"]
    .map((s) => ({ tp: s, c: capCalc(s) }))
    .filter((s) => s.c);
  if (!e.length)
    return '<div class="card"><b>💰 Capital total</b><div class="mut sm" style="margin-top:4px">Defina o capital inicial em cada aba (Day trade, Opções e Swing) e o total aparece aqui.</div></div>';
  const t = sum(e.map((s) => s.c.at)),
    a = sum(e.map((s) => s.c.ini + s.c.ap)),
    o = sum(e.map((s) => s.c.res));
  return `<div class="card"><div class="top"><b>💰 Capital total</b><span class="sm ${cls(o)}">${o >= 0 ? "+" : ""}${money(o)}</span></div><div style="font-size:28px;font-weight:700;margin-top:4px" class="${t <= 0 ? "r" : ""}">${money(t)}</div><div class="mut sm">Inicial ${money(a)}${a ? " · " + (o >= 0 ? "+" : "") + f2((o / a) * 100) + "%" : ""}</div>${e.map((s) => `<div class="top sm" style="margin-top:6px"><span>${CAPN[s.tp]}</span><b class="${s.c.at <= 0 ? "r" : ""}">${money(s.c.at)}</b></div>`).join("")}</div>`;
}
function card(e) {
  const t = calc(e),
    a = e.pplan || e.pin || e.pout;
  return `<div class="card row" data-a="edit" data-id="${e.id}" data-s="${esc(((e.ativo || "") + " " + (e.setup || "")).toLowerCase())}"><div class="th">${a ? `<img data-img="${a}">` : "📈"}</div><div class="fl"><b>${esc(e.ativo) || '<span class="r">⚠ sem ativo</span>'}</b> · ${e.tipo === "O" ? (e.side === "C" ? "Comprado" : "Lançado") : e.side === "C" ? "Compra" : "Venda"}<div class="mut sm">${fdt(e.dt)}${e.tipo === "O" && e.strike ? " · " + (e.ot === "P" ? "Put" : "Call") + " " + esc(e.strike) : ""}${e.setup ? " · " + esc(e.setup) : ""}</div>${e.err && e.err !== "Nenhum" ? '<span class="tag">⚠ erro</span>' : ""}${e.rules === "n" ? '<span class="tag">fora das regras</span>' : ""}</div><div class="rt ${cls(t.r)}">${isOpen(e) ? `<span class="mut sm">aberto</span><br><button class="btn s" data-a="enc" data-id="${e.id}" style="margin-top:4px">Encerrar</button>` : t.pl == null ? '<span class="mut sm">–</span>' : mT(e, t.pl)}<div class="sm mut">${t.pl == null ? "" : pctConta(t.pl, moedaT(e), e.tipo || "D")}</div></div></div>`;
}
let EXD = {},
  XTO = 1;
(document.addEventListener(
  "toggle",
  (e) => {
    e.target && e.target.id === "xtd" && (XTO = e.target.open);
  },
  !0,
),
  (function () {
    const e = TraderStyles.slot("legacy-001");
    ((e.textContent = TraderStyles.css("legacy-001")), TraderStyles.mount(e));
  })());
function xtScore(e) {
  const t = [];
  return (
    e.forEach(({ t: a }) => {
      const o = [],
        s = numN(a.emo);
      (s != null && s >= 1 && s <= 5 && o.push((s - 1) / 4),
        a.rules === "s" ? o.push(1) : a.rules === "n" && o.push(0),
        a.err && o.length && o.push(a.err === "Nenhum" ? 1 : 0),
        o.length && t.push(avg(o)));
    }),
    t.length ? Math.round(avg(t) * 100) : null
  );
}
function xtGauge(e, t, a) {
  const o = Math.max(Math.abs(e), 1),
    s = t > 0 ? t : o,
    n = -(a > 0 ? a : o),
    r = Math.min(1, Math.max(0, (e - n) / (s - n))),
    i = (v, g) => {
      const h = Math.PI * (1 - v);
      return [
        (60 + g * Math.cos(h)).toFixed(1),
        (62 - g * Math.sin(h)).toFixed(1),
      ];
    },
    l = (v, g, h) => {
      const [b, y] = i(v, 46),
        [j, k] = i(g, 46);
      return `<path d="M${b} ${y} A46 46 0 0 1 ${j} ${k}" fill="none" stroke="${h}" stroke-width="9"/>`;
    },
    [d, c] = i(r, 38),
    p = (0 - n) / (s - n),
    [u, m] = i(p, 46),
    [f, x] = i(p, 38);
  return `<svg viewBox="0 0 120 74" style="width:100%;max-width:170px;height:auto" role="img" aria-label="Resultado do ciclo frente à meta">${l(0, 0.34, "var(--r)")}${l(0.34, 0.67, "#c2933d")}${l(0.67, 1, "var(--g)")}<line x1="${u}" y1="${m}" x2="${f}" y2="${x}" stroke="var(--tx,#fff)" stroke-width="1.2" opacity=".55"/><line x1="60" y1="62" x2="${d}" y2="${c}" stroke="var(--tx,#fff)" stroke-width="2.4" stroke-linecap="round"/><circle cx="60" cy="62" r="4" fill="var(--tx,#fff)"/><text x="6" y="73" font-size="7" fill="var(--r)">${a > 0 ? "-" + Math.round(a) : ""}</text><text x="114" y="73" font-size="7" text-anchor="end" fill="var(--g)">${t > 0 ? Math.round(t) : ""}</text></svg>`;
}
function extrato(e) {
  const t = (Ce) => gv("cap", e + "_" + Ce, ""),
    a = t("ini");
  if (a === "" || !isFinite(+a)) return "";
  const o = t("desde"),
    s = +t("ap") || 0,
    n = +a + s,
    r = +t("meta") || 0,
    i = +t("stp") || 0,
    l = (Ce) => (Ce.dtx || Ce.dt).slice(0, 10),
    d = S.trades
      .filter((Ce) => (Ce.tipo || "D") === e && (!o || l(Ce) >= o))
      .slice()
      .sort(cmpCron)
      .map((Ce) => ({ t: Ce, c: cBRL(Ce) })),
    c = [...new Set(d.map((Ce) => l(Ce.t)))].slice(-6);
  let p = EXD[e] || "all";
  p !== "all" && !c.includes(p) && (p = "all");
  const u = d.filter((Ce) => Ce.c.pl != null),
    m = sum(u.map((Ce) => Ce.c.pl)),
    f = {},
    x = {};
  let v = 0;
  d.forEach((Ce) => {
    if (Ce.c.pl != null) {
      v += Ce.c.pl;
      const Qe = l(Ce.t);
      ((x[Qe] = (x[Qe] || 0) + Ce.c.pl), (f[Ce.t.id] = { cy: v, dy: x[Qe] }));
    }
  });
  const g = p === "all" ? d : d.filter((Ce) => l(Ce.t) === p),
    h = g.filter((Ce) => Ce.c.pl != null),
    b = sum(h.map((Ce) => Ce.c.pl)),
    y =
      n +
      (p === "all"
        ? 0
        : sum(u.filter((Ce) => l(Ce.t) < p).map((Ce) => Ce.c.pl))),
    j = y + b,
    k = h.filter((Ce) => Ce.c.pl > 0),
    A = h.filter((Ce) => Ce.c.pl < 0),
    C = h.length ? k.length / h.length : null,
    I = g.map((Ce) => Ce.c.rr).filter((Ce) => Ce != null),
    J = I.length ? avg(I) : null,
    se =
      k.length && A.length
        ? avg(k.map((Ce) => Ce.c.pl)) / Math.abs(avg(A.map((Ce) => Ce.c.pl)))
        : null,
    Ie = xtScore(g),
    Pe =
      Ie == null
        ? ""
        : Ie >= 70
          ? "Saudável"
          : Ie >= 40
            ? "Atenção"
            : "Crítico",
    Me = Ie == null ? "" : Ie >= 70 ? "g" : Ie >= 40 ? "" : "r",
    ue =
      r > 0 && m >= r
        ? "🎯 Meta batida"
        : i > 0 && m <= -i
          ? "🛑 Stop atingido"
          : u.length
            ? "📊 Em andamento"
            : "⏳ Sem operações",
    ve = (Ce) => (Ce > 0 ? "+" : "") + money(Ce),
    he = (Ce) =>
      Ce == null
        ? ""
        : (Ce > 0 ? "+" : "") + (Math.abs(Ce) >= 10 ? Math.round(Ce) : f2(Ce)),
    we = e === "O" ? "prêmio" : "pts",
    Be = (Ce, Qe, de = "") =>
      `<div><div class="l">${Ce}</div><b class="${de}">${Qe}</b></div>`,
    Ge = g
      .map((Ce, Qe) => {
        const de = Ce.t,
          Se = Ce.c,
          Ve = de.side === "C" ? 1 : -1,
          Je = numN(de.entry),
          Ye = numN(de.stop),
          Xe = numN(de.target),
          ot = Xe != null && Je != null ? (Xe - Je) * Ve : null,
          Ke = Ye != null && Je != null ? (Ye - Je) * Ve : null,
          at = numN(de.emo),
          rt = f[de.id];
        return `<tr data-a="edit" data-id="${de.id}"><td class="mut">${Qe + 1}</td><td>${fdt(de.dtx || de.dt)}</td><td><b>${esc(de.ativo) || "—"}</b>${e === "O" && de.strike ? ' <span class="mut">' + (de.ot === "P" ? "Put" : "Call") + " " + esc(de.strike) + "</span>" : ""}<div class="sm mut">${de.side === "C" ? '<span class="g">C</span>' : '<span class="r">V</span>'}${ot != null ? ' · <span class="g">↑ ' + he(ot) + " " + we + "</span>" : ""}${Ke != null ? ' · <span class="r">↓ ' + he(Ke) + " " + we + "</span>" : ""}</div></td><td>${at >= 1 && at <= 5 ? EMO[at - 1] : "–"}${de.rules === "s" ? " ✅" : de.rules === "n" ? " ⚠️" : ""}</td><td>${Se.risk != null && y > 0 ? f2((Se.risk / y) * 100) + "%" : "–"}</td><td>${Se.rr != null ? f2(Se.rr) + ":1" : "–"}</td><td class="${cls(Se.pl)}${Se.pl == null ? " lvr" : ""}"${Se.pl == null ? ' data-lvid="' + de.id + '"' : ""}><b>${Se.pl != null ? ve(Se.pl) : "–"}</b></td><td class="${rt ? cls(rt.dy) : ""}">${rt ? ve(rt.dy) : "–"}</td><td class="${rt ? cls(rt.cy) : ""}">${rt ? ve(rt.cy) : "–"}</td><td><span class="xt-p ${Se.pl != null ? "f" : "a"}">${Se.pl != null ? "Fechado" : "Aberto"}</span></td></tr>`;
      })
      .join("");
  return `<details id="xtd" class="card xt"${XTO ? " open" : ""}><summary>🧾 Extrato do plano · ${CAPN[e]}<span class="mut sm" style="font-weight:400"> · ${o ? "desde " + o.split("-").reverse().join("/") : "todas as operações"}</span></summary>
 <div class="chips2" style="margin-top:8px"><button class="${p === "all" ? "on" : ""}" data-a="exd" data-tp="${e}" data-id="all">Ciclo</button>${c.map((Ce) => `<button class="${p === Ce ? "on" : ""}" data-a="exd" data-tp="${e}" data-id="${Ce}">${Ce.slice(8, 10)}/${Ce.slice(5, 7)}</button>`).join("")}</div>
 <div class="xt-top"><div class="xt-g">${xtGauge(m, r, i)}<div class="xt-gc"><b class="${cls(m)}">${ve(m)}</b><div class="mut">${r > 0 ? Math.round((m / r) * 100) + "% da meta do ciclo" : "defina meta e stop em ⚙️ Configurar capital"}</div></div></div>
 <div class="xt-s">${Be("PL inicial", money(y))}${Be("Resultado", ve(b) + (y > 0 ? ' <span class="sm mut">(' + (b >= 0 ? "+" : "") + f2((b / y) * 100) + "%)</span>" : ""), cls(b))}${Be("PL atual", money(j), j <= 0 ? "r" : "")}${Be("Estado (ciclo)", ue)}${Be("Score emocional", Ie == null ? "–" : Ie + "/100 · " + Pe, Me)}${Be("Meta / stop", (r > 0 ? money(r) : "–") + " / " + (i > 0 ? "-" + money(i) : "–"))}</div></div>
 <div class="xt-m">${d.some((Ce) => Ce.c.pl == null) ? '<span>Em aberto (ao vivo) <b id="lvopen" data-tp="' + e + '">–</b></span>' : ""}<span>ROI <b class="${cls(b)}">${y > 0 ? (b >= 0 ? "+" : "") + f2((b / y) * 100) + "%" : "–"}</b></span><span>Ganho/risco planejado <b>${J != null ? f2(J) + ":1" : "–"}</b></span><span>Ganho/risco realizado <b>${se != null ? f2(se) + ":1" : "–"}</b></span><span>Trades <b>${g.length}</b>${g.length !== h.length ? ' <span class="sm">(' + (g.length - h.length) + " aberto" + (g.length - h.length > 1 ? "s" : "") + ")</span>" : ""}</span><span>WR <b>${C != null ? f2(C * 100) + "%" : "–"}</b>${h.length ? ' <span class="sm">(' + k.length + "/" + h.length + ")</span>" : ""}</span></div>
 ${g.length ? `<div class="xt-w"><table><tr><th>#</th><th>Data</th><th>Ativo</th><th>Emo</th><th>RO</th><th>RR</th><th>Resultado</th><th>Acum. dia</th><th>Acum. ciclo</th><th>Status</th></tr>${Ge}</table></div>` : '<p class="mut sm" style="margin-top:10px">Nenhuma operação neste período.</p>'}
 <div class="mut sm" style="margin-top:8px">RO = risco do trade sobre o PL inicial. Velocímetro, estado e meta/stop são do ciclo inteiro; o restante acompanha o dia escolhido. Toque numa linha para editar.</div></details>`;
}
let XV = {};
(function () {
  const e = TraderStyles.slot("legacy-002");
  ((e.textContent = TraderStyles.css("legacy-002")), TraderStyles.mount(e));
})();
const xtSw = (e) =>
    `<div class="seg" style="margin:8px 0">${[
      ["op", "📋 Operações"],
      ["an", "📊 Análise"],
    ]
      .map(
        ([t, a]) =>
          `<button class="${(XV[e] || "op") === t ? "on" : ""}" data-a="xv" data-tp="${e}" data-id="${t}">${a}</button>`,
      )
      .join("")}</div>`,
  xtHead = (e) =>
    `<div class="top"><h1>${{ D: "Day trade", S: "Swing trade", O: "Opções" }[e]}</h1><button class="btn" data-a="new" data-tp="${e}">+ Novo trade</button></div>`;
function xtSd(e) {
  if (e.length < 2) return null;
  const t = avg(e);
  return Math.sqrt(sum(e.map((a) => (a - t) * (a - t))) / (e.length - 1));
}
function xtDur(e) {
  if (e == null || !isFinite(e)) return "–";
  if (((e = Math.round(e)), e < 60)) return e + "min";
  if (e < 1440)
    return Math.floor(e / 60) + "h" + (e % 60 ? " " + (e % 60) + "min" : "");
  const t = e / 1440;
  return f2(t).replace(/,00$/, "") + " d";
}
function analise(e) {
  const t = (Y) => gv("cap", e + "_" + Y, ""),
    a = t("ini");
  if (a === "" || !isFinite(+a))
    return '<div class="card"><b>📊 Análise do plano</b><div class="mut sm" style="margin-top:6px">Informe o capital inicial desta aba (⚙️ Configurar capital, na aba Operações) para calcular saldo, drawdown e retorno.</div></div>';
  const o = t("desde"),
    s = +a + (+t("ap") || 0),
    n = +t("rk") || 0,
    r = (Y) => (Y.dtx || Y.dt).slice(0, 10),
    i = S.trades
      .filter((Y) => (Y.tipo || "D") === e && (!o || r(Y) >= o))
      .slice()
      .sort(cmpCron)
      .map((Y) => ({ t: Y, c: cBRL(Y) }))
      .filter((Y) => Y.c.pl != null),
    l = i.length;
  if (!l)
    return '<div class="card"><b>📊 Análise do plano</b><div class="mut sm" style="margin-top:6px">Ainda não há operações encerradas neste ciclo.</div></div>';
  const d = i.map((Y) => Y.c.pl),
    c = sum(d),
    p = i.filter((Y) => Y.c.pl > 0),
    u = i.filter((Y) => Y.c.pl < 0),
    m = p.length / l,
    f = sum(p.map((Y) => Y.c.pl)),
    x = Math.abs(sum(u.map((Y) => Y.c.pl))),
    v = p.length ? f / p.length : null,
    g = u.length ? x / u.length : null,
    h = v != null && g > 0 ? v / g : null,
    b = x > 0 ? f / x : null,
    y = (Y) => (Y > 0 ? "+" : "") + f2(Y) + "%",
    j = (Y) => (Y > 0 ? "+" : "") + money(Y),
    k = (Y) => Y.t.rules === "n" || (Y.t.err && Y.t.err !== "Nenhum");
  let A = s,
    C = s,
    I = 0,
    J = 0;
  const se = {};
  i.forEach((Y) => {
    const q = r(Y.t);
    (se[q] || (se[q] = { s: A, p: 0 }),
      (se[q].p += Y.c.pl),
      (A += Y.c.pl),
      (C = Math.max(C, A)));
    const L = C - A;
    L > I && ((I = L), (J = C > 0 ? (L / C) * 100 : 0));
  });
  const Ie = C - A,
    Pe = C > 0 ? (Ie / C) * 100 : 0,
    Me = i.filter((Y) => Y.t.rules === "s" || Y.t.rules === "n"),
    ue = Me.length
      ? Me.filter((Y) => Y.t.rules === "s").length / Me.length
      : null,
    ve = p.filter(k).length,
    he = i.map((Y) => Y.c.rr).filter((Y) => Y != null),
    we = he.length ? avg(he) : null,
    Be = we != null ? 1 / (1 + we) : null,
    Ge = p.map((Y) => Y.c.risk).filter((Y) => Y != null),
    Ce = u.map((Y) => Y.c.risk).filter((Y) => Y != null),
    Qe = Ge.length && Ce.length && avg(Ce) > 0 ? avg(Ge) / avg(Ce) : null,
    de = i.map((Y) => Y.c.risk).filter((Y) => Y != null),
    Se = n > 0 ? (s * n) / 100 : 0,
    Ve = de.length && Se > 0 ? avg(de) / Se : null,
    Je = i
      .filter(
        (Y) =>
          Y.c.risk != null &&
          numN(Y.t.target) != null &&
          numN(Y.t.entry) != null,
      )
      .map((Y) => ({
        r: Y.c.risk,
        g:
          Math.abs(numN(Y.t.target) - numN(Y.t.entry)) *
          (numN(Y.t.qty) || 0) *
          (numN(Y.t.pv) || 1),
      })),
    Ye = Je.length
      ? m * avg(Je.map((Y) => Y.g)) - (1 - m) * avg(Je.map((Y) => Y.r))
      : null,
    Xe = c / l,
    ot = Ye != null ? Xe - Ye : null,
    Ke = Ye > 0 ? Math.min(1, Math.max(0, Xe / Ye)) : null,
    at = Object.values(se).map((Y) => (Y.s > 0 ? Y.p / Y.s : 0)),
    rt = xtSd(at),
    dt =
      typeof JR < "u" && JR.data && JR.data.selic && isFinite(JR.data.selic.v)
        ? +JR.data.selic.v
        : null,
    vt = dt != null ? Math.pow(1 + dt / 100, 1 / 252) - 1 : 0,
    ft = rt > 0 ? ((avg(at) - vt) / rt) * Math.sqrt(252) : null,
    ht =
      ft == null
        ? ""
        : ft < 0
          ? "Negativo"
          : ft < 1
            ? "Fraco"
            : ft < 2
              ? "Bom"
              : ft < 3
                ? "Muito bom"
                : "Excepcional",
    qe = ft == null ? "" : ft < 0 ? "r" : ft < 1 ? "an-amb" : "g",
    Le = xtSd(d),
    ke = Le != null && avg(d) !== 0 ? Le / Math.abs(avg(d)) : null,
    ze =
      ke == null
        ? ""
        : ke <= 1
          ? "Consistente"
          : ke <= 2
            ? "Moderado"
            : "Muito errático",
    Ue = ke == null ? "" : ke <= 1 ? "g" : ke <= 2 ? "an-amb" : "r",
    We = i.map((Y) => {
      const q = Y.t,
        L = numN(q.entry),
        F = q.side === "C" ? 1 : -1,
        O = numN(q.mep),
        ne = numN(q.men),
        Ee = numN(q.stop);
      return L > 0
        ? {
            mep: O != null ? (((O - L) * F) / L) * 100 : null,
            men: ne != null ? (((ne - L) * F) / L) * 100 : null,
            st: Ee != null ? (Math.abs(L - Ee) / L) * 100 : null,
            tg:
              numN(q.target) != null
                ? (Math.abs(numN(q.target) - L) / L) * 100
                : null,
          }
        : {};
    }),
    Re = We.map((Y) => Y.mep).filter((Y) => Y != null),
    K = We.map((Y) => Y.men).filter((Y) => Y != null),
    pe = Re.length ? avg(Re) : null,
    Q = K.length ? avg(K) : null,
    re = We.map((Y) => Y.st).filter((Y) => Y != null),
    ie = We.map((Y) => Y.tg).filter((Y) => Y != null),
    R = pe == null ? "" : ie.length && pe >= avg(ie) * 0.5 ? "g" : "an-amb",
    z =
      Q == null
        ? ""
        : re.length
          ? Math.abs(Q) <= avg(re) * 0.5
            ? "g"
            : Math.abs(Q) <= avg(re)
              ? "an-amb"
              : "r"
          : "",
    oe = (Y) => {
      const q = new Date(Y.t.dt),
        L = new Date(Y.t.dtx);
      return Y.t.dtx && isFinite(q) && isFinite(L) ? (L - q) / 6e4 : null;
    },
    me = p.map(oe).filter((Y) => Y != null),
    be = u.map(oe).filter((Y) => Y != null),
    X = i.map(oe).filter((Y) => Y != null),
    xe = me.length ? avg(me) : null,
    $e = be.length ? avg(be) : null,
    fe = X.length ? avg(X) : null,
    Fe = xe != null && $e > 0 ? (xe / $e - 1) * 100 : null,
    w =
      fe == null
        ? ""
        : fe <= 15
          ? "Scalping"
          : fe < 1440
            ? "Day trade"
            : fe < 7 * 1440
              ? "Swing curto"
              : "Posição",
    H = r(i[i.length - 1].t),
    N = MES[+H.slice(5, 7) - 1].slice(0, 3).toUpperCase() + "/" + H.slice(0, 4),
    W = (Y, q, L = "", F = "") =>
      `<div><div class="l">${Y}</div><div class="v ${F}">${q}</div><div class="s">${L}</div></div>`,
    Te = (Y, q) => `<span class="${Y >= 0 ? "g" : "r"}">${q}</span>`,
    V = `<div class="card an"><div class="an-h"><i>💲</i>Financeiro <small>· ${l} operação(ões)${o ? " desde " + o.split("-").reverse().join("/") : ""}</small></div><div class="an-k">
  ${W("Saldo", money(s + c), "PL inicial: <b>" + money(s) + "</b>")}
  ${W("Resultado · ciclo", '<span class="' + cls(c) + '">' + j(c) + '</span> <span class="sm ' + cls(c) + '">' + y((c / s) * 100) + "</span>", 'Expectativa: <b class="' + cls(Xe) + '">' + money(Xe) + "/trade</b>")}
  ${W("Drawdown do topo", '<span class="' + (Ie > 0 ? "r" : "g") + '">' + f2(Pe) + "%</span>", 'Máx.: <b class="r">-' + f2(J) + "%</b> (-" + money(I) + ")")}
  ${W("Profit factor", b != null ? f2(b) : f > 0 ? "∞" : "–", 'Conformidade: <b class="' + (ue == null ? "" : ue >= 0.8 ? "g" : "r") + '">' + (ue != null ? Math.round(ue * 100) + "%" : "–") + '</b><br>Sorte (ganhos fora das regras): <b class="' + (ve ? "r" : "g") + '">' + (p.length ? Math.round((ve / p.length) * 100) + "%" : "–") + "</b> (" + ve + "/" + p.length + ")")}
 </div></div>`,
    ae = `<div class="card an"><div class="an-h"><i>🎯</i>Assimetria de risco</div><div class="an-k">
  ${W("Win rate", f2(m * 100) + "%", Be != null ? "Mínimo p/ empatar (RR " + f2(we) + ':1): <b class="an-amb">' + f2(Be * 100) + "%</b> " + Te(m - Be, (m >= Be ? "↑ +" : "↓ ") + f2(Math.abs(m - Be) * 100) + " p.p.") : "Sem alvo informado nos trades")}
  ${W("Payoff", h != null ? '<span class="' + (h >= 1 ? "g" : "r") + '">' + f2(h) + "x</span>" : "–", 'W: <b class="g">' + (v != null ? money(v) : "–") + '</b> L: <b class="r">' + (g != null ? money(g) : "–") + "</b>")}
  ${W("Risco W/L", Qe != null ? '<span class="an-blu">' + f2(Qe) + "x</span>" : "–", "W: <b>" + (Ge.length ? money(avg(Ge)) : "–") + "</b> L: <b>" + (Ce.length ? money(avg(Ce)) : "–") + '</b> <span class="mut">(risco médio por trade)</span>')}
  <div><div class="l">Utiliz. RO</div>${Ve != null ? '<div class="v an-amb">' + Math.round(Ve * 100) + '%</div><div class="an-bar"><i style="width:' + Math.min(100, Ve * 100) + "%;background:" + (Ve > 1 ? "var(--r)" : "#c2933d") + '"></i></div><div class="s">risco médio ÷ risco máx. (' + f2(n) + "% do PL = " + money(Se) + ")</div>" : '<div class="v">–</div><div class="s">defina "Risco por trade (%)" em ⚙️ Configurar capital</div>'}</div>
 </div></div>`,
    ee = `<div class="card an an-ev ${ot != null && ot < 0 ? "bad" : ""}"><div class="an-h"><i>📉</i>EV ${ot != null && Ye > 0 ? (ot < 0 ? '<b class="r" style="letter-spacing:0">' + Math.round((-ot / Ye) * 100) + "% de perda</b>" : '<b class="g" style="letter-spacing:0">no esperado ou acima</b>') : ""}</div>
  ${
    Ye != null
      ? `<div class="an-3"><div class="an-box"><div class="l">EV esperado</div><div class="v">${money(Ye)}</div><div class="s">/trade</div></div><div class="an-box"><div class="l">EV real</div><div class="v ${cls(Xe)}">${money(Xe)}</div><div class="s">/trade</div></div><div class="an-box" style="${ot < 0 ? "background:rgba(232,108,89,0.08)" : ""}"><div class="l">Gap</div><div class="v ${cls(ot)}">${j(ot)}</div><div class="s">/trade</div></div></div>
  <hr class="an-hr"><div class="top sm"><span class="mut">${ot < 0 ? "Perda" : "Ganho"} acumulada <span>(${l} trade${l > 1 ? "s" : ""})</span></span><b class="${cls(ot)}">${j(ot * l)}</b></div>${Ke != null ? '<div class="an-bar"><i style="width:' + Ke * 100 + '%;background:var(--g)"></i></div><div class="s mut" style="text-align:right;margin-top:4px">' + Math.round(Ke * 100) + "% capturado</div>" : ""}`
      : '<div class="mut sm">Informe entrada, stop e alvo nos trades para calcular o EV esperado (win rate × ganho planejado − perda × risco).</div>'
  }</div>`,
    le = `<div class="card an"><div class="an-h"><i>〰️</i>Consistência operacional <small>· ${N}</small></div><div class="an-k c4">
  ${W("Sharpe", ft != null ? f2(ft) : "–", ft != null ? '<b class="' + qe + '">' + ht + '</b><br><span class="an-tag">' + (dt != null ? "Selic atual " + f2(dt) + "%" : "sem Selic (rf = 0)") + "</span>" : '<span class="mut">precisa de 2+ dias</span>', ft != null ? qe : "")}
  ${W("CV norm.", ke != null ? f2(ke) : "–", ke != null ? '<b class="' + Ue + '">' + ze + "</b>" : '<span class="mut">precisa de 2+ trades</span>', Ue)}
  ${W("MEP médio", pe != null ? y(pe) : "–", "por entry" + (pe == null ? "<br>preencha nos trades" : ""), R)}
  ${W("MEN médio", Q != null ? y(Q) : "–", "por entry" + (Q == null ? "<br>preencha nos trades" : ""), z)}</div>
  <hr class="an-hr"><div class="top"><div><div class="l mut sm" style="font-size:11px">TEMPO W VS L</div><div class="sm" style="margin-top:4px">W: <b class="g">${xtDur(xe)}</b> &nbsp; L: <b class="r">${xtDur($e)}</b></div></div>${Fe != null ? '<div style="text-align:right"><b class="' + (Fe >= 0 ? "g" : "r") + '" style="font-size:16px">' + (Fe >= 0 ? "+" : "") + Math.round(Fe) + '%</b> <span class="sm ' + (Fe >= 0 ? "g" : "r") + '">' + (Fe >= 0 ? "Winners run" : "Ganhos cortados cedo") + "</span></div>" : ""}</div>
  <div class="sm mut" style="margin-top:10px">Tempo médio geral <b style="color:var(--tx,inherit)">${xtDur(fe)}</b> ${w ? '<span class="an-tag">' + w + "</span>" : ""}</div></div>`;
  return `<div class="an-g">${V}${ae}${ee}${le}</div><details class="card" style="margin-top:10px"><summary class="sm">ⓘ Como cada número é calculado</summary><div class="sm mut" style="margin-top:8px;line-height:1.55">
 <b>Saldo</b> = capital inicial + aportes + resultado. <b>Drawdown do topo</b> = queda do saldo desde o maior saldo já atingido; "Máx." é a maior queda do ciclo. <b>Profit factor</b> = soma dos ganhos ÷ soma das perdas. <b>Conformidade</b> = % de trades com "segui minhas regras = Sim". <b>Sorte</b> = % dos ganhos obtidos quebrando regra ou com erro marcado.<br>
 <b>Payoff</b> = ganho médio ÷ perda média. <b>Mínimo p/ empatar</b> = 1 ÷ (1 + RR planejado médio). <b>Risco W/L</b> = risco médio dos ganhos ÷ risco médio das perdas. <b>Utiliz. RO</b> = risco médio ÷ (capital × risco por trade).<br>
 <b>EV esperado</b> = win rate × ganho planejado até o alvo − (1 − win rate) × risco. <b>EV real</b> = resultado médio por trade. <b>Gap</b> = real − esperado.<br>
 <b>Sharpe</b> = (retorno diário médio − Selic diária) ÷ desvio dos retornos diários × √252 (com poucos dias é pouco confiável). <b>CV norm.</b> = desvio ÷ |média| do resultado por trade (até 1 consistente, até 2 moderado, acima errático). <b>MEP / MEN</b> = melhor / pior preço atingido dentro do trade, em % da entrada (campos opcionais no trade). <b>Tempo W vs L</b> = duração média (entrada → saída) dos ganhos contra as perdas.</div></details>`;
}
const LV = { px: {}, dl: {}, td: 0, ts: 0, err: "", ed: "", hit: {}, busy: 0 },
  LVT = ["trades", "swing", "opc"],
  lvKey = (e) =>
    String(e.ativo || "")
      .trim()
      .toUpperCase();
function lvQ(e) {
  const t = LV.px[e];
  if (t && t.ult > 0 && Date.now() - t.up < 3e4) return { ...t, d: 0 };
  const a = LV.dl[e];
  return a && a.ult > 0 && Date.now() - a.up < 18e4 ? { ...a, d: 1 } : null;
}
function lvCalc(e) {
  const t = lvQ(lvKey(e));
  if (!t) return null;
  const a = numN(e.entry),
    o = numN(e.stop),
    s = numN(e.target),
    n = e.side === "C" ? 1 : -1,
    r = numN(e.qty) || 0,
    i = numN(e.pv) || 1,
    l = numN(e.cost) || 0;
  if (a == null) return null;
  const d = (t.ult - a) * n * r * i - l,
    c = o != null ? Math.abs(a - o) * r * i : null;
  return {
    px: t.ult,
    d: t.d,
    pl: d,
    r: c > 0 ? d / c : null,
    ds: o != null ? (t.ult - o) * n : null,
    dt: s != null ? (s - t.ult) * n : null,
    st:
      o != null && (t.ult - o) * n <= 0
        ? "stop"
        : s != null && (s - t.ult) * n <= 0
          ? "alvo"
          : "",
  };
}
async function lvPoll() {
  if (
    !(
      LV.busy ||
      !SESS ||
      !window.CLOUD_OK ||
      document.hidden ||
      !(LVT.includes(tab) || tab === "live") ||
      (tab !== "live" && !S.trades.some((e) => isOpen(e) && lvKey(e)))
    )
  ) {
    LV.busy = 1;
    try {
      const e = await (
          await rq("/rest/v1/cotacoes?select=*&user_id=eq." + SESS.uid)
        ).json(),
        t = {};
      (e.forEach(
        (a) =>
          (t[String(a.ticker).toUpperCase()] = {
            ult: +a.ult,
            hor: a.hor,
            up: Date.parse(a.updated_at) || 0,
          }),
      ),
        (LV.px = t),
        (LV.all = e),
        (LV.ts = Date.now()),
        (LV.err = ""));
    } catch (e) {
      LV.err =
        e.status === 404
          ? 'ponte não configurada (tabela "cotacoes" não existe)'
          : String(e.message || e);
    }
    try {
      await lvDelayed();
    } catch {}
    ((LV.busy = 0), lvPaint(), lvcPaint());
  }
}
async function lvDelayed() {
  const e = cfg(),
    t = /^(WIN|WDO|IND|DOL|BGI|CCM|ICF|WSP|DI1)/,
    a = [
      ...new Set(S.trades.filter((o) => isOpen(o) && lvKey(o)).map(lvKey)),
    ].filter(
      (o) => !t.test(o) && !(LV.px[o] && Date.now() - LV.px[o].up < 3e4),
    );
  if (!(!e || !a.length || Date.now() - LV.td < 6e4)) {
    LV.td = Date.now();
    try {
      await tok();
      const o = await fetch(e.url + "/functions/v1/precos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: e.key,
            Authorization: "Bearer " + SESS.at,
          },
          body: JSON.stringify({
            br: a.filter((r) => /\d/.test(r)),
            us: a.filter((r) => !/\d/.test(r)),
          }),
        }),
        s = await o.json();
      if (!o.ok) throw new Error(s.erro || "Erro " + o.status);
      const n = hm();
      for (const r of [s.br || {}, s.us || {}])
        for (const i in r)
          r[i] > 0 &&
            (LV.dl[i.toUpperCase()] = { ult: +r[i], hor: n, up: Date.now() });
      LV.ed = "";
    } catch (o) {
      LV.ed = String(o.message || o);
    }
  }
}
function buzz(e) {
  try {
    typeof navigator.vibrate == "function" && navigator.vibrate(e);
  } catch {}
}
function lvPaint() {
  const e = $("#app");
  if (!e || !LVT.includes(tab)) return;
  const t = S.trades.filter((d) => isOpen(d) && lvKey(d)),
    a = $("#lvbar");
  if (!SESS || !window.CLOUD_OK || !t.length) {
    a && a.remove();
    return;
  }
  const o = Object.values(LV.px).filter((d) => Date.now() - d.up < 3e4),
    s = Object.values(LV.dl).filter((d) => Date.now() - d.up < 18e4);
  let n = a;
  (n ||
    (e.insertAdjacentHTML(
      "afterbegin",
      '<div id="lvbar" class="sm" style="margin-bottom:8px"></div>',
    ),
    (n = $("#lvbar"))),
    (n.innerHTML =
      o.length && !LV.err
        ? '<span class="g">🟢 Ao vivo</span> <span class="mut">· ' +
          esc(o.sort((d, c) => c.up - d.up)[0].hor || "") +
          " · " +
          o.length +
          " ativo(s) chegando" +
          (s.length ? " · " + s.length + " com atraso" : "") +
          "</span>"
        : s.length
          ? '<span class="an-amb">🟡 Cotação com atraso</span> <span class="mut">· brapi/Twelve Data, ~15 min · ' +
            s.length +
            " ativo(s) · atualiza a cada 1 min</span>"
          : '<span class="mut">⚪ Sem cotações.' +
            (LV.err ? " Ponte: " + esc(LV.err) + "." : "") +
            (LV.ed
              ? " Fonte com atraso: " + esc(LV.ed) + "."
              : " Ponte do Profit desligada e a fonte com atraso não trouxe os ativos abertos (futuros e opções não têm fonte gratuita).") +
            "</span>"));
  const r = (d) => (Math.abs(d) >= 10 ? Math.round(d) : f2(d)),
    i = {};
  t.forEach((d) => {
    var c;
    const p = lvCalc(d);
    let u = "";
    p &&
      ((i[(c = d.tipo || "D")] ?? (i[c] = [])).push(p.pl),
      p.st &&
        LV.hit[d.id] !== p.st &&
        ((LV.hit[d.id] = p.st), buzz([200, 100, 200])),
      p.st || delete LV.hit[d.id],
      (u =
        '<span class="' +
        (p.d ? "an-amb" : "g") +
        '">●</span> último <b>' +
        f2(p.px) +
        "</b>" +
        (p.d ? ' <span class="mut">(atraso)</span>' : "") +
        ' · aberto <b class="' +
        cls(p.pl) +
        '">' +
        (p.pl > 0 ? "+" : "") +
        money(p.pl) +
        "</b>" +
        (p.pl != null && pctConta(p.pl)
          ? ' <span class="' + cls(p.pl) + '">(' + pctConta(p.pl) + ")</span>"
          : "") +
        (p.ds != null ? " · stop a " + r(p.ds) : "") +
        (p.dt != null ? " · alvo a " + r(p.dt) : "") +
        (p.st
          ? ' <b class="' +
            (p.st === "stop" ? "r" : "g") +
            '">' +
            (p.st === "stop" ? "⚠ STOP ATINGIDO" : "🎯 ALVO ATINGIDO") +
            "</b>"
          : "")));
    const m = e.querySelector('.card.row[data-id="' + d.id + '"]');
    if (m) {
      const x = m.querySelector(".fl") || m;
      let v = x.querySelector(".lv");
      (v ||
        ((v = document.createElement("div")),
        (v.className = "lv sm"),
        (v.style.marginTop = "4px"),
        x.appendChild(v)),
        (v.innerHTML = u));
    }
    const f = e.querySelector('td.lvr[data-lvid="' + d.id + '"]');
    f &&
      (f.innerHTML = p
        ? '<b class="' +
          cls(p.pl) +
          '" title="ao vivo">' +
          (p.pl > 0 ? "+" : "") +
          money(p.pl) +
          ' <span class="g">●</span></b>'
        : "<b>–</b>");
  });
  const l = e.querySelector("#lvopen");
  if (l) {
    const d = i[l.dataset.tp] || [];
    l.innerHTML = d.length
      ? '<span class="' +
        cls(sum(d)) +
        '">' +
        (sum(d) > 0 ? "+" : "") +
        money(sum(d)) +
        "</span>"
      : "–";
  }
}
setInterval(lvPoll, 2500);
let LVC = { q: "", f: "all" };
const lvcHoje = () => {
  const e = new Date();
  return (
    String(e.getDate()).padStart(2, "0") +
    "/" +
    String(e.getMonth() + 1).padStart(2, "0") +
    "/" +
    e.getFullYear()
  );
};
function vLive() {
  return `<h1>Cotações ao vivo</h1><div id="lvcbar" class="sm" style="margin:6px 0"></div><input id="cq" placeholder="🔍 Buscar ativo" value="${esc(LVC.q)}" autocapitalize="characters" autocomplete="off"><div class="chips2" style="margin-top:8px">${[
    ["all", "Todos"],
    ["meus", "Meus trades"],
    ["alta", "Em alta"],
    ["baixa", "Em baixa"],
  ]
    .map(
      ([e, t]) =>
        `<button class="${LVC.f === e ? "on" : ""}" data-a="lvcf" data-id="${e}">${t}</button>`,
    )
    .join(
      "",
    )}</div><div class="card" style="margin-top:8px;padding:6px 8px"><table style="width:100%"><thead><tr><th style="text-align:left">Ativo</th><th style="text-align:right">Último</th><th style="text-align:right">Var.</th><th style="text-align:right">Hora</th></tr></thead><tbody id="lvcb"></tbody></table></div><div class="mut sm">Atualiza a cada ~3 s enquanto a ponte do Profit estiver rodando. Var. = a mesma do Profit (sobre o fechamento do dia anterior). Se a ponte ainda não mandar a variação, o app calcula sobre a abertura. Linhas em cinza não negociaram hoje (aparece a data do último negócio). ★ = ativo de um trade aberto.</div>`;
}
function lvcPaint() {
  if (tab !== "live") return;
  const e = $("#lvcb"),
    t = $("#lvcbar");
  if (!e || !t) return;
  if (!SESS || !window.CLOUD_OK) {
    ((t.innerHTML =
      '<span class="mut">Entre na sua conta (Mais → Conta): as cotações chegam pelo Supabase.</span>'),
      (e.innerHTML = ""));
    return;
  }
  const a = Date.now(),
    o = lvcHoje(),
    s = new Set(S.trades.filter((d) => isOpen(d) && lvKey(d)).map(lvKey)),
    n = (LV.all || [])
      .map((d) => ({
        k: String(d.ticker).toUpperCase(),
        u: +d.ult,
        a: +d.abe,
        f: +d.fec,
        vr: d.var == null || d.var === "" ? null : +d.var,
        h: d.hor || "",
        d: d.dat || "",
        up: Date.parse(d.updated_at) || 0,
      }))
      .filter((d) => d.u > 0),
    r = n.filter((d) => a - d.up < 3e4).length,
    i = n.reduce((d, c) => Math.max(d, c.up), 0);
  t.innerHTML = LV.err
    ? '<span class="r">⚠️ ' + esc(LV.err) + "</span>"
    : n.length
      ? r
        ? '<span class="g">🟢 Ao vivo</span> <span class="mut">· ' +
          hm(i) +
          " · " +
          n.length +
          " ativos</span>"
        : '<span class="mut">⚪ Ponte parada. Última cotação às ' +
          hm(i) +
          " (" +
          n.length +
          " ativos).</span>"
      : '<span class="mut">⚪ Nenhuma cotação ainda. Rode a ponte do Profit (iniciar.bat) com o Profit e o Excel abertos.</span>';
  let l = n.map((d) => ({
    ...d,
    v:
      d.vr != null && isFinite(d.vr) && Math.abs(d.vr) < 90
        ? d.vr
        : d.f > 0 && d.u / d.f > 0.3 && d.u / d.f < 3
          ? (d.u / d.f - 1) * 100
          : d.a > 0 && d.u / d.a > 0.3 && d.u / d.a < 3
            ? (d.u / d.a - 1) * 100
            : null,
    st: !!d.d && d.d !== o,
  }));
  (LVC.q && (l = l.filter((d) => d.k.includes(LVC.q))),
    LVC.f === "meus"
      ? (l = l.filter((d) => s.has(d.k)))
      : LVC.f === "alta"
        ? (l = l.filter((d) => d.v > 0).sort((d, c) => c.v - d.v))
        : LVC.f === "baixa" &&
          (l = l.filter((d) => d.v < 0).sort((d, c) => d.v - c.v)),
    (LVC.f === "all" || LVC.f === "meus") &&
      l.sort((d, c) => (d.k < c.k ? -1 : 1)),
    (e.innerHTML = l.length
      ? l
          .map(
            (d) =>
              `<tr class="${d.st ? "mut" : ""}"><td><b>${s.has(d.k) ? "★ " : ""}${esc(d.k)}</b></td><td style="text-align:right">${f2(d.u)}</td><td class="${d.st ? "" : cls(d.v)}" style="text-align:right">${d.v == null ? "–" : (d.v > 0 ? "+" : "") + f2(d.v) + "%"}</td><td class="sm mut" style="text-align:right">${d.st ? esc(d.d.slice(0, 5)) : esc(d.h)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="4" class="mut" style="padding:10px 0">Nada para mostrar.</td></tr>'));
}
document.addEventListener("input", (e) => {
  e.target &&
    e.target.id === "cq" &&
    ((LVC.q = e.target.value.trim().toUpperCase()), lvcPaint());
});
function vList(e = "D") {
  if (XV[e] === "an") return xtHead(e) + xtSw(e) + analise(e);
  const t = e === "S",
    a = S.trades
      .filter((n) => (n.tipo || "D") === e && inPer(n.dt))
      .sort((n, r) => r.dt.localeCompare(n.dt)),
    o = a.map((n) => ({ ...n, c: calc(n) })).filter((n) => n.c.pl != null),
    s = o.map((n) => n.c.pl);
  return (
    `<div class="top"><h1>${{ D: "Day trade", S: "Swing trade", O: "Opções" }[e]}</h1><button class="btn" data-a="new" data-tp="${e}">+ Novo trade</button></div>${xtSw(e)}${capCard(e)}${extrato(e)}${perSel()}${filtBar()}${s.length ? `<div class="mut sm" style="margin-top:8px">${s.length} fechado(s) · ${a.length - s.length} aberto(s) · resultado <b class="${cls(sum(s))}">${mnyMix(somaMoedas(o))}</b> · média por trade <b class="${cls(avg(s))}">${mnyMix(mediaMoedas(o))}</b></div>` : ""}` +
    (a.length
      ? ((n) =>
          n.slice(0, LST.n).map(card).join("") +
          (n.length > LST.n
            ? `<button class="btn s" data-cx="maisTr" style="width:100%;margin:10px 0">Mostrar mais ${Math.min(100, n.length - LST.n)} de ${n.length - LST.n}</button>`
            : ""))(fl(a)) || '<p class="mut">Nada com esse filtro.</p>'
      : `<p class="mut">Nenhum trade ainda. ${e === "O" ? "Registre a opção com strike, vencimento e prêmios. O stop em prêmio define o risco." : t ? "Envie a foto do planejamento (entrada, stop e alvos), o stop inicial define o risco." : "Registre o primeiro, com as fotos de entrada e saída, o stop inicial e o resultado."}</p>`)
  );
}
function sheet() {
  const e = T,
    t = (o, s) =>
      `<div class="ph"><label>${s}</label><div class="pv">${e[o] ? `<img data-img="${e[o]}">` : ""}</div><label class="btn s" style="color:var(--tx)">${e[o] ? "Trocar" : "Adicionar"} foto<input type="file" accept="image/*" hidden data-k="${o}"></label></div>`,
    a = (o, s, n = "") =>
      `<label>${s}<input name="${o}" type="number" step="any" inputmode="decimal" value="${esc(e[o])}" placeholder="${n}"></label>`;
  return `<div class="ov"><div class="sh"><div class="top"><h2 style="margin:0">${isNew ? "Novo trade" : "Editar trade"}${e.tipo === "S" ? " (swing)" : e.tipo === "O" ? " (opção)" : ""}</h2><button class="x" data-a="close">✕</button></div>
${
  isNew
    ? ""
    : `<label>Tipo de operação</label>${segs("tipo", e.tipo || "D", [
        ["D", "Day trade"],
        ["S", "Swing"],
        ["O", "Opção"],
      ])}<div class="mut sm" style="margin:-4px 0 8px">Ao salvar, o trade passa para a aba escolhida.</div>`
}<label>Data e hora<input type="datetime-local" name="dt" value="${e.dt}"></label>
<div class="g2"><label>Ativo<input name="ativo" value="${esc(e.ativo)}" placeholder="WINZ26"></label><div><label>Lado</label>${segs(
    "side",
    e.side,
    e.tipo === "O"
      ? [
          ["C", "Comprado", "g"],
          ["V", "Lançado", "r"],
        ]
      : [
          ["C", "Compra", "g"],
          ["V", "Venda", "r"],
        ],
  )}</div></div>
<label>Setup / estratégia<input name="setup" value="${esc(e.setup)}"></label>
<label>Tipo de mercado<select name="mkt">${opt(MK, e.mkt)}</select></label>
${
  e.tipo === "O"
    ? `<div class="g2"><label>Subjacente<input name="sub" value="${esc(e.sub)}" placeholder="PETR4"></label><label>Call / Put<select name="ot">${opt(
        [
          ["C", "Call"],
          ["P", "Put"],
        ],
        e.ot || "C",
      )}</select></label></div><div class="g2">${a("strike", "Strike")}<label>Vencimento<input type="date" name="venc" value="${esc(e.venc)}"></label></div><div class="g2">${a("spot", "Subjacente na entrada")}<label>Estrutura<select name="estr">${opt(ESTR, e.estr)}</select></label></div><div class="mut sm">Em travas e estruturas, use o prêmio líquido: débito = Comprado, crédito = Lançado.</div>`
    : ""
}
<div class="g3">${a("entry", e.tipo === "O" ? "Prêmio de entrada" : "Entrada")}${a("stop", e.tipo === "O" ? "Prêmio do stop" : "Stop inicial")}${a("target", e.tipo === "O" ? "Prêmio alvo 1" : e.tipo === "S" ? "Alvo 1" : "Alvo")}</div>
${e.tipo === "S" || e.tipo === "O" ? `<div class="g2">${a("target2", "Alvo 2")}${a("target3", "Alvo 3")}</div>` : ""}<div class="g3">${a("exit", e.tipo === "O" ? "Prêmio de saída" : "Saída")}${a("qty", e.tipo === "O" ? "Qtd. de opções (lote 100)" : "Qtd.")}${a("pv", e.tipo === "O" ? "Multiplicador (1)" : "R$/ponto")}</div>
<div class="g2">${a("mep", "Melhor preço no trade (MEP)")}${a("men", "Pior preço no trade (MEN)")}</div><div class="mut sm" style="margin:-4px 0 8px">Opcional. Maior preço atingido (compra) ou menor (venda) em MEP; o contrário em MEN. Alimenta a aba Análise.</div>${a("cost", "Custos totais (R$)")}<label>Data e hora da saída<input type="datetime-local" name="dtx" value="${esc(e.dtx)}"></label>
<div class="prev" id="prev"></div>
<h3>Fotos</h3><div class="g2">${e.tipo === "S" || e.tipo === "O" ? t("pplan", "Planejamento (entrada, stop, alvos)") : ""}${t("pin", "Entrada")}${t("pout", "Saída")}</div>
<h3>Disciplina</h3>
<label>Segui minhas regras?</label>${segs("rules", e.rules, [
    ["s", "Sim", "g"],
    ["n", "Não", "r"],
  ])}<label>Como eu estava antes de entrar?</label><div class="chips2">${EMO.map((o, s) => `<button class="${e.emo == s + 1 ? "on" : ""}" data-seg="emo" data-v="${s + 1}">${o}</button>`).join("")}</div>
<label>Erro cometido (erro = não seguir suas regras)<select name="err">${opt(ERR, e.err)}</select></label>
<label>Anotações (por que entrei, o que senti, o que aprendi)<textarea name="nota">${esc(e.nota)}</textarea></label>${iaBlock(e.ia, calc(e), "t")}
<div id="msg" class="r" style="margin:8px 0"></div>
<div class="g2"><button class="btn" data-a="savetrade">Salvar</button>${isNew ? "" : `<button class="btn d" data-a="deltrade">${delArm ? "Confirmar exclusão" : "Excluir"}</button>`}</div></div></div>`;
}
function prev() {
  const e = $("#prev");
  if (!e || !T) return;
  const t = calc(T),
    a = T.side === "C" ? 1 : -1,
    o = +T.entry,
    s = +T.stop;
  let n = "";
  if (
    (o && s
      ? ((o - s) * a <= 0 &&
          (n +=
            '<div class="r">⚠ Stop do lado errado da entrada para ' +
            (T.tipo === "O"
              ? T.side === "C"
                ? "Comprado"
                : "Lançado"
              : T.side === "C"
                ? "Compra"
                : "Venda") +
            ". Confira o Lado: se estiver errado, o resultado sai com o sinal trocado.</div>"),
        (n += `Risco planejado: <b>${mT(T, t.risk)}</b>${pctConta(t.risk, moedaT(T), T.tipo) ? " (" + pctConta(t.risk, moedaT(T), T.tipo).replace("+", "") + ")" : ""}`),
        t.rr != null &&
          (n += ` · ganho/risco planejado <b>${f2(t.rr)} para 1</b>${t.rr < 3 ? ' <span class="r">(abaixo de 3 para 1)</span>' : ""}`),
        (T.tipo === "S" || T.tipo === "O") &&
          ["target2", "target3"].forEach((r, i) => {
            +T[r] &&
              (n += ` · Alvo ${i + 2}: <b>${f2(Math.abs(+T[r] - o) / Math.abs(o - s))}:1</b>`);
          }),
        t.pl != null &&
          (n += `<br>Resultado: <b class="${cls(t.pl)}">${mT(T, t.pl)}</b>${pctConta(t.pl, moedaT(T), T.tipo) ? ' <span class="' + cls(t.pl) + '">(' + pctConta(t.pl, moedaT(T), T.tipo) + ")</span>" : ""}${t.r != null && t.r < -1.05 ? ' <span class="r">perda maior que o risco planejado: o stop foi respeitado?</span>' : ""}`))
      : (n =
          '<span class="mut">Informe entrada e stop inicial: sem stop não dá para medir o risco.</span>'),
    T.tipo === "O" && o && s)
  ) {
    const r = +T.strike,
      i = T.venc
        ? Math.round(
            (new Date(T.venc + "T12:00") -
              new Date(T.dt.slice(0, 10) + "T12:00")) /
              864e5,
          )
        : null;
    ((n += "<br>"),
      i != null &&
        (n += `DTE: <b>${i}</b> dia(s)${i <= 7 ? ' <span class="r">(vencimento próximo: o tempo corrói o prêmio mais rápido)</span>' : ""} · `),
      r &&
        (n += `Breakeven (opção simples): <b>${f2(T.ot === "P" ? r - o : r + o)}</b> · `),
      (n += `Risco: <b>${pc(Math.abs(o - s) / o)}</b> do prêmio`));
  }
  {
    const r = capCalc(T.tipo || "D");
    r &&
      r.lotes != null &&
      (n +=
        "<br>Capital atual permite até <b>" +
        r.lotes +
        "</b> " +
        CAPU[T.tipo || "D"] +
        (r.lotes === 1 ? "" : "s") +
        ".");
  }
  e.innerHTML = n;
}
function showSheet() {
  const e = document.querySelector("#sh .ov"),
    t = e ? e.scrollTop : 0;
  $("#sh").innerHTML = T ? (QM ? qsheet() : sheet()) : "";
  const a = document.querySelector("#sh .ov");
  (a && t && (a.scrollTop = t),
    (document.body.style.overflow = T ? "hidden" : ""),
    ($("#fab").style.display = T ? "none" : fabDisp()),
    fillImgs(),
    prev());
}
function closeSheet(e) {
  (T &&
    !e &&
    ["pin", "pout", "pplan"].forEach((t) => {
      T[t] && T[t] !== orig[t] && idb("img", "delete", T[t]);
    }),
    (T = null),
    (QM = 0),
    (delArm = 0),
    showSheet());
}
function vDia() {
  const e = S.days[D] || { chk: {} },
    t = S.trades
      .filter((i) => i.dt.slice(0, 10) === D)
      .map((i) => ({ ...i, c: calc(i) }))
      .concat(typeof fxDia == "function" ? fxDia(D) : []),
    a = dayFech(D),
    o = sum(a.map((i) => i.c.r || 0)),
    s = totBRL(somaMoedas(a)),
    n = t.filter((i) => i.err && i.err !== "Nenhum").length,
    r = (i, l, d = "") =>
      `<label>${l}<textarea data-d="${i}" placeholder="${d}">${esc(e[i])}</textarea></label>`;
  return DV === "hist"
    ? vDiaHist()
    : `<h1>Meu dia</h1>${diaSeg()}<div style="display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:end"><button class="btn s" data-a="dprev">‹</button><label style="margin:0">Data<input type="date" id="dd" value="${D}"></label><button class="btn s" data-a="dnext">›</button></div>${D !== loc().slice(0, 10) ? '<button class="btn s" style="margin-top:6px" data-a="dtoday">Ir para hoje</button>' : ""}<div class="mut sm" id="svs" style="margin-top:6px"></div>
<div class="card" style="margin-top:12px"><b>Resumo automático</b><div class="mut">${t.length} trade(s) · <span class="${cls(s)}">${mnyMix(somaMoedas(a))}</span>${pctConta(s) ? ' · <span class="' + cls(s) + '">' + pctConta(s) + "</span>" : ""} · ${n} erro(s)</div></div>
<h2>☀️ Antes do mercado</h2>
<label>Como estou hoje?</label><div class="chips2">${EMO.map((i, l) => `<button class="${e.energia == l + 1 ? "on" : ""}" data-dseg="energia" data-v="${l + 1}">${i}</button>`).join("")}</div><div class="g2" style="grid-template-columns:1fr"><label>Tipo de mercado hoje<select data-d="mkt"><option value="">–</option>${opt(MK, e.mkt)}</select></label></div>
${r("plano", "Plano do dia", "Cenário, níveis, ativos")}
${r("pre", "Riscos do dia e reação", "O que pode dar errado e como vou reagir")}
<h2>✅ Checklist de regras <span class="mut sm" id="cnt"></span></h2>
<div class="card">${S.rules.length ? S.rules.map((i) => `<label class="ck"><input type="checkbox" data-chk="${i.id}"${e.chk && e.chk[i.id] ? " checked" : ""}><span>${esc(i.t)}</span></label>`).join("") : '<span class="mut">Cadastre suas regras na aba Regras.</span>'}</div>
<h2>🌙 Depois do mercado (debriefing)</h2>
${r("resumo", "Resumo do dia")}
<label>Quebra de regra ou erro operacional<select data-d="erros"><option value="">–</option>${opt(
        [
          ["n", "Não, segui as regras"],
          ["s", "Sim"],
        ],
        e.erros,
      )}</select></label>
${r("cond", "Contexto do erro", "Em que condições aconteceu e quando pode se repetir")}
${r("prevn", "Ação corretiva", "O que vou fazer para não repetir")}
${r("bem", "Acertos do dia")}
<div class="g2"><label>Nota do dia: <b id="nv">${e.nota === void 0 || e.nota === "" ? "–" : esc(e.nota)}</b><input type="range" min="0" max="10" step="1" data-d="nota" value="${esc(e.nota || 0)}"></label></div>
${r("aprend", "Aprendizado principal")}${iaBlock(e.ia, a.length ? { r: o, pl: s } : null, "d")}<button class="btn" style="width:100%;margin-top:14px" data-a="dsave">💾 Salvar dia</button><div class="mut sm" style="margin-top:6px">Também é salvo automaticamente a cada alteração.</div>`;
}
function cnt() {
  const e = $("#cnt");
  if (!e) return;
  const t = (S.days[D] || {}).chk || {};
  e.textContent =
    Object.values(t).filter(Boolean).length + "/" + S.rules.length;
}
function vRegras() {
  return (
    `<h1>Minhas regras</h1><p class="mut sm">Para Tharp, erro é simplesmente não seguir suas regras escritas. As regras abaixo são sugestões inspiradas no livro: edite ou apague.</p>
<div class="card"><div class="g2"><label>Categoria<select id="rc">${opt(
      CATS.map((e, t) => [t, e]),
      0,
    )}</select></label><label>Nova regra<input id="rt" placeholder="Escreva a regra"></label></div><button class="btn" style="margin-top:10px" data-a="addrule">Adicionar regra</button></div>` +
    CATS.map((e, t) => {
      const a = S.rules.filter((o) => o.cat == t);
      return a.length
        ? `<h3>${e}</h3>` +
            a
              .map(
                (o) =>
                  `<div class="card g2" style="grid-template-columns:1fr auto;align-items:center"><input data-rid="${o.id}" value="${esc(o.t)}" style="margin:0"><button class="x" data-a="delrule" data-id="${o.id}">✕</button></div>`,
              )
              .join("")
        : "";
    }).join("")
  );
}
function grp(e, t, a) {
  const o = {};
  return (
    e.forEach((s) => {
      var n;
      (o[(n = s[t] || "—")] ?? (o[n] = [])).push(s.c.r);
    }),
    Object.entries(o)
      .sort((s, n) =>
        a === 1
          ? s[0].localeCompare(n[0])
          : a
            ? a.indexOf(s[0]) - a.indexOf(n[0])
            : 0,
      )
      .map(
        ([s, n]) =>
          `<tr><td>${esc(s)}</td><td>${n.length}</td><td>${pc(n.filter((r) => r > 0).length / n.length)}</td><td class="${cls(avg(n))}">${f2(avg(n))}×</td><td class="${cls(sum(n))}">${f2(sum(n))}×</td></tr>`,
      )
      .join("")
  );
}
const tbl = (e, t) =>
    `<div class="card"><table><tr>${e.map((a) => `<th>${a}</th>`).join("")}</tr>${t}</table></div>`,
  qual = (e) =>
    e < 0.16
      ? "Abaixo do tradável"
      : e < 0.2
        ? "Fraco, mas operável"
        : e < 0.25
          ? "Médio"
          : e < 0.3
            ? "Bom"
            : e < 0.5
              ? "Excelente"
              : e < 0.7
                ? "Soberbo"
                : "Santo Graal";
async function csv() {
  const e = (o) => '"' + String(o ?? "").replace(/"/g, '""') + '"',
    t = [
      "data",
      "ativo",
      "lado",
      "setup",
      "mercado",
      "entrada",
      "stop",
      "alvo",
      "saida",
      "qtd",
      "valor_ponto",
      "custos",
      "risco_1R",
      "resultado",
      "R",
      "seguiu_regras",
      "erro",
      "emocional",
      "nota",
      "tipo",
      "alvo2",
      "alvo3",
      "subjacente",
      "call_put",
      "strike",
      "vencimento",
      "estrutura",
      "saida_em",
    ],
    a = S.trades.map((o) => {
      const s = calc(o);
      return [
        o.dt,
        o.ativo,
        o.side,
        o.setup,
        o.mkt,
        o.entry,
        o.stop,
        o.target,
        o.exit,
        o.qty,
        o.pv,
        o.cost,
        s.risk,
        s.pl,
        s.r,
        o.rules,
        o.err,
        o.emo,
        o.nota,
        o.tipo || "D",
        o.target2,
        o.target3,
        o.sub,
        o.ot,
        o.strike,
        o.venc,
        o.estr,
        o.dtx,
      ]
        .map(e)
        .join(",");
    });
  await saveFile(
    "diario-trades.csv",
    "\uFEFF" +
      t.join(",") +
      `
` +
      a.join(`
`),
  );
}
function vGraf() {
  const e = S.trades.filter((a) => a.tipo === "S" && calc(a).r == null),
    t = [
      ...new Set([
        ...(S.watch || []),
        ...e.map((a) => (a.ativo || "").toUpperCase()).filter(Boolean),
        ...S.trades
          .filter((a) => a.tipo === "O" && a.sub && calc(a).r == null)
          .map((a) => a.sub.toUpperCase()),
      ]),
    ];
  return (
    '<h1>Gráficos</h1><p class="mut sm">Gráfico ao vivo não carrega dentro desta página (conexões externas são bloqueadas aqui). O botão abre o gráfico em tempo real no TradingView em outra aba. Ativo fora da B3: digite com a bolsa, ex.: NASDAQ:AAPL.</p><div class="card"><div class="g2" style="grid-template-columns:1fr auto;align-items:end"><label>Adicionar ativo<input id="wt" placeholder="PETR4"></label><button class="btn" data-a="addw">Adicionar</button></div></div>' +
    (t.length
      ? t
          .map((a) => {
            const o = e
              .filter((s) => (s.ativo || "").toUpperCase() === a)
              .map(
                (s) =>
                  `Entrada ${esc(s.entry)} · Stop ${esc(s.stop)}${[
                    s.target,
                    s.target2,
                    s.target3,
                  ]
                    .filter(Boolean)
                    .map((n, r) => ` · Alvo ${r + 1} ${esc(n)}`)
                    .join("")}`,
              )
              .join("<br>");
            return `<div class="card"><div class="top"><b>${esc(a)}</b><span><button class="btn s" data-a="chart" data-id="${esc(a)}">${OPEN[a] ? "Fechar" : "Ver gráfico aqui"}</button> <a class="btn s" href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym(a))}" target="_blank" rel="noopener noreferrer">Gráfico ao vivo ↗</a>${(S.watch || []).includes(a) ? ` <button class="x" data-a="delw" data-id="${esc(a)}">✕</button>` : ""}</span></div>${o ? `<div class="mut sm" style="margin-top:6px">${o}</div>` : ""}${OPEN[a] ? `<iframe src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym(a))}&interval=D&theme=${matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"}&locale=br&timezone=America%2FSao_Paulo&allow_symbol_change=1" style="width:100%;height:420px;border:0;margin-top:8px;border-radius:8px"></iframe><div class="mut sm">Quadro em branco ou aviso de símbolo indisponível? Use o botão "Gráfico ao vivo ↗".</div>` : ""}</div>`;
          })
          .join("")
      : '<p class="mut">Adicione ativos para acompanhar. Seus swing trades abertos aparecem aqui sozinhos, com entrada, stop e alvos.</p>')
  );
}
const KV = (e, t, a = "", o = "") =>
  `<div class="card"><span class="mut sm">${e}</span><b class="${a}">${t}</b><span class="mut sm">${o}</span></div>`;
function hist(e) {
  const t = [
      "≤ −2×",
      "−2 a −1×",
      "−1 a 0×",
      "0 a 1×",
      "1 a 2×",
      "2 a 3×",
      "> 3×",
    ],
    a = t.map(() => 0);
  e.forEach(
    (s) =>
      a[
        s <= -2
          ? 0
          : s <= -1
            ? 1
            : s < 0
              ? 2
              : s < 1
                ? 3
                : s < 2
                  ? 4
                  : s <= 3
                    ? 5
                    : 6
      ]++,
  );
  const o = Math.max(...a, 1);
  return `<div class="card">${t.map((s, n) => `<div style="display:flex;gap:8px;align-items:center;font-size:12px;margin:3px 0"><span style="width:70px">${s}</span><div style="flex:1"><div style="height:12px;border-radius:8px;width:${(a[n] / o) * 100}%;background:${n < 3 ? "var(--r)" : "var(--g)"}"></div></div><b>${a[n]}</b></div>`).join("")}</div>`;
}
async function saveFile(e, t, a = "text/csv") {
  try {
    if (typeof claude < "u") {
      const s = await claude.use("downloads");
      if (s) {
        await s.save({ filename: e, data: t });
        return;
      }
    }
  } catch {}
  const o = document.createElement("a");
  ((o.href = URL.createObjectURL(new Blob([t], { type: a }))),
    (o.download = e),
    document.body.appendChild(o),
    o.click(),
    o.remove());
}
async function backup() {
  return window.TraderBackup.exportBackup();
}
async function restore(e) {
  return window.TraderBackup.restoreBackup(e);
}
let Z = { pct: 1 },
  RP = "w0",
  CM = loc().slice(0, 7);
const ymd = (e) =>
  new Date(e - e.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
function rng(e) {
  const t = new Date();
  let a, o, s;
  if (e[0] === "w")
    ((a = new Date()),
      a.setHours(12),
      a.setDate(a.getDate() - ((a.getDay() + 6) % 7) - (e === "w1" ? 7 : 0)),
      (o = new Date(a)),
      o.setDate(o.getDate() + 6));
  else {
    const n = e === "m1" ? -1 : 0;
    ((a = new Date(t.getFullYear(), t.getMonth() + n, 1)),
      (o = new Date(t.getFullYear(), t.getMonth() + n + 1, 0)));
  }
  return [ymd(a), ymd(o), e + ymd(a)];
}
function vPainel() {
  const e = S.prop || {},
    t = S.goals || {},
    a = (s, n) =>
      `<label>${n}<input type="number" step="any" inputmode="decimal" data-p="${s}" value="${esc(e[s])}"></label>`,
    o = (s, n) =>
      `<label>${n}<input type="number" step="any" inputmode="decimal" data-z="${s}" value="${esc(Z[s])}" ${s === "cap" ? `placeholder="${esc(e.cap)}"` : ""}></label>`;
  return `<h1>Painel</h1><h2>🛡️ Mesa proprietária</h2><p class="mut sm">Preencha as regras da sua conta. O painel usa seus trades fechados.</p>
<div class="g2">${a("cap", "Capital inicial (R$)")}${a("meta", "Meta de lucro (R$)")}</div><div class="g2">${a("perdaDia", "Perda máx. diária (R$)")}${a("ddTotal", "Drawdown máx. total (R$)")}</div>
<div class="g2">${a("consist", "Consistência: maior dia ≤ (% do lucro)")}<label>Tipo de drawdown<select data-p="ddTipo">${opt(
    [
      ["trail", "Trailing (do pico)"],
      ["fixo", "Fixo (do capital inicial)"],
    ],
    e.ddTipo || "trail",
  )}</select></label></div><div id="pp" style="margin-top:8px"></div>
<h2>🎯 Metas de processo</h2><div class="g2"><label>Máx. de trades por dia<input type="number" data-g="maxTr" value="${esc(t.maxTr)}"></label><label>Regras seguidas na semana (%)<input type="number" data-g="regPct" value="${esc(t.regPct)}"></label></div><div id="gg" style="margin-top:8px"></div>
<h2>🧮 Tamanho da posição</h2><div class="g2">${o("cap", "Capital (R$)")}${o("pct", "Risco por trade (%)")}</div><div class="g3">${o("entry", "Entrada")}${o("stop", "Stop")}${o("pv", "R$/ponto")}</div><div class="prev" id="zz"></div><div class="mut sm">R$/ponto: WIN 0,20 · WDO 10 · ações 1.</div>
<h2>💾 Backup completo</h2><p class="mut sm">Salva trades, fotos, dias, regras e painel em um arquivo .json. Restaurar mescla com o que já existe neste aparelho.</p><div class="g2"><button class="btn" data-a="bk">Exportar backup</button><label class="btn s" style="margin:0;text-align:center;color:var(--tx)">Restaurar backup<input type="file" accept=".json,application/json" hidden id="bkf"></label></div><div id="bm" class="mut sm" style="margin-top:8px">${S.lastBackup ? "Último backup: " + S.lastBackup.split("-").reverse().join("/") : "Nenhum backup feito ainda."}</div>`;
}
function ppOut() {
  const e = $("#pp");
  if (!e) return;
  const t = S.prop || {},
    a = S.trades
      .map((g) => ({ ...g, c: cBRL(g) }))
      .filter((g) => g.c.pl != null)
      .sort(cmpCron),
    o = +t.cap || 0,
    s = loc().slice(0, 10),
    n = {};
  let r = o,
    i = o;
  a.forEach((g) => {
    ((r += g.c.pl), (i = Math.max(i, r)));
    const h = (g.dtx || g.dt).slice(0, 10);
    n[h] = (n[h] || 0) + g.c.pl;
  });
  const l = r - o,
    d = t.ddTipo === "fixo" ? Math.max(0, o - r) : i - r,
    c = n[s] || 0,
    p = Object.values(n),
    u = p.length ? Math.max(...p) : 0,
    m = (g) => +t[g] || 0,
    f = (g, h, b) => {
      const y = h > 0 ? Math.min(100, Math.max(0, (g / h) * 100)) : 0,
        j = b
          ? y >= 80
            ? "var(--r)"
            : y >= 50
              ? "#c2933d"
              : "var(--g)"
          : "var(--ac)";
      return `<div style="height:8px;background:var(--bg);border-radius:8px;margin:4px 0;border:1px solid var(--bd)"><div style="height:100%;width:${y}%;background:${j};border-radius:8px"></div></div>`;
    },
    x = (g, h, b, y) =>
      `<div class="card"><b>${g}</b> <span class="mut sm">${b}</span><div>${h}</div>${y}</div>`;
  let v = "";
  if (m("perdaDia")) {
    const g = Math.max(0, -c);
    v +=
      x(
        "Perda diária hoje",
        `${money(g)} de ${money(m("perdaDia"))}`,
        "restam " + money(Math.max(0, m("perdaDia") - g)),
        f(g, m("perdaDia"), 1),
      ) +
      (g >= m("perdaDia") * 0.8
        ? '<div class="warn">⚠ Perto (ou acima) do limite de perda diária: pare de operar hoje.</div>'
        : "");
  }
  if (
    (m("ddTotal") &&
      (v += x(
        "Drawdown " + (t.ddTipo === "fixo" ? "fixo" : "trailing"),
        `${money(d)} de ${money(m("ddTotal"))}`,
        "restam " + money(Math.max(0, m("ddTotal") - d)),
        f(d, m("ddTotal"), 1),
      )),
    m("meta") &&
      (v += x(
        "Meta de lucro",
        `${money(l)} de ${money(m("meta"))}`,
        pc(Math.max(0, l) / m("meta")),
        f(Math.max(0, l), m("meta")),
      )),
    m("consist") && l > 0)
  ) {
    const g = (u / l) * 100;
    v +=
      x(
        "Consistência",
        `Maior dia: ${money(u)} = ${f2(g)}% do lucro`,
        "limite " + m("consist") + "%",
        f(g, m("consist"), 1),
      ) +
      (g > m("consist")
        ? `<div class="warn">⚠ Maior dia acima do limite. O lucro total precisa chegar a ${money(u / (m("consist") / 100))} (sem novo dia maior).</div>`
        : "");
  }
  e.innerHTML =
    v || '<p class="mut sm">Preencha os limites acima para ver o painel.</p>';
}
function ggOut() {
  const e = $("#gg");
  if (!e) return;
  const t = S.goals || {},
    a = loc().slice(0, 10),
    o =
      S.trades.filter((x) => x.dt.slice(0, 10) === a).length +
      (typeof fxDia == "function" ? fxDia(a).length : 0),
    [s, n] = rng("w0"),
    r = S.trades.filter((x) => {
      const v = x.dt.slice(0, 10);
      return v >= s && v <= n;
    }),
    i = r.filter(
      (x) => x.rules !== "n" && (!x.err || x.err === "Nenhum"),
    ).length,
    l = [
      ...new Set([
        ...S.trades.map((x) => x.dt.slice(0, 10)),
        ...Object.keys(S.days).filter(
          (x) => S.days[x].resumo || S.days[x].erros,
        ),
      ]),
    ].sort(),
    d = new Set(
      S.trades
        .filter((x) => x.rules === "n" || (x.err && x.err !== "Nenhum"))
        .map((x) => x.dt.slice(0, 10)),
    ),
    c = (x) =>
      !d.has(x) &&
      (S.days[x] || {}).erros !== "s" &&
      !(typeof diaRuim == "function" && diaRuim(x));
  let p = 0,
    u = 0;
  l.forEach((x) => {
    ((p = c(x) ? p + 1 : 0), (u = Math.max(u, p)));
  });
  const m = +t.maxTr && o > +t.maxTr,
    f = r.length ? (i / r.length) * 100 : null;
  e.innerHTML = `<div class="kv">${KV("Dias seguidos sem erro", p, p ? "g" : "", "melhor: " + u)}${KV("Trades hoje", o + (+t.maxTr ? " / " + t.maxTr : ""), m ? "r" : "", m ? "acima do limite: pare" : "")}${KV("Regras seguidas (semana)", f == null ? "–" : Math.round(f) + "%", f != null && +t.regPct && f < +t.regPct ? "r" : "g", +t.regPct ? "meta " + t.regPct + "%" : "")}</div>`;
}
function zzOut() {
  const e = $("#zz");
  if (!e) return;
  const t = S.prop || {},
    a = +(Z.cap || t.cap),
    o = +Z.pct,
    s = +Z.entry,
    n = +Z.stop,
    r = +Z.pv || 1;
  if (!(a && o && s && n && s !== n)) {
    e.innerHTML =
      '<span class="mut">Informe capital, % de risco, entrada e stop.</span>';
    return;
  }
  const i = (a * o) / 100,
    l = Math.abs(s - n) * r,
    d = Math.floor(i / l);
  e.innerHTML = `Risco por trade: <b>${money(i)}</b><br>Risco por unidade: ${money(l)}<br>Tamanho sugerido: <b>${d}</b> ${d < 1 ? '<span class="r">(stop largo demais para esse risco)</span>' : `<br>Risco real: ${money(d * l)} (${f2(((d * l) / a) * 100)}% do capital)`}`;
}
const MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
function cal() {
  const [e, t] = CM.split("-").map(Number),
    a = new Date(e, t, 0).getDate(),
    o = new Date(e, t - 1, 1).getDay(),
    s = {};
  (S.trades.forEach((r) => {
    const i = calc(r);
    if (i.pl != null && (r.dtx || r.dt).slice(0, 7) === CM) {
      const l = (r.dtx || r.dt).slice(0, 10);
      s[l] = (s[l] || 0) + emBRL(i.pl, moedaT(r));
    }
  }),
    typeof fxPer == "function" &&
      fxPer(CM + "-01", CM + "-31").forEach((r) => {
        const i = r.dtx.slice(0, 10);
        s[i] = (s[i] || 0) + emBRL(r.c.pl, "USD");
      }));
  let n =
    `<div class="top"><button class="btn s" data-a="cprev">‹</button><b>${MES[t - 1]} ${e}</b><button class="btn s" data-a="cnext">›</button></div><div class="cal">${["D", "S", "T", "Q", "Q", "S", "S"].map((r) => `<i class="mut sm">${r}</i>`).join("")}` +
    "<i></i>".repeat(o);
  for (let r = 1; r <= a; r++) {
    const i = `${CM}-${String(r).padStart(2, "0")}`,
      l = s[i];
    n += `<button data-a="cday" data-id="${i}" class="${l > 0 ? "cg" : l < 0 ? "cr" : ""}">${r}<span>${l == null ? "" : Math.round(l)}</span></button>`;
  }
  return (
    n +
    '</div><div class="mut sm">Verde: dia positivo · Vermelho: dia negativo (R$, com o Forex convertido pelo dólar das configurações). Toque no dia para abrir o registro.</div>'
  );
}
function vRev() {
  const [e, t, a] = rng(RP),
    o = S.trades
      .map((u) => ({ ...u, c: calc(u) }))
      .filter((u) => {
        const m = String(u.dtx || u.dt).slice(0, 10);
        return m >= e && m <= t && u.c.pl != null;
      })
      .concat(typeof fxPer == "function" ? fxPer(e, t) : []),
    s = o.length,
    n = o.map((u) => u.c.pl),
    r = (S.rev || {})[a] || {},
    i = Object.keys(S.days).filter((u) => u >= e && u <= t),
    l = i
      .map((u) => S.days[u].nota)
      .filter((u) => u !== "" && u != null)
      .map(Number),
    d = {};
  o.filter((u) => u.err && u.err !== "Nenhum").forEach((u) => {
    d[u.err] = (d[u.err] || 0) + emBRL(u.c.pl, moedaT(u));
  });
  const c = Object.entries(d).sort((u, m) => u[1] - m[1])[0],
    p = (u, m) =>
      `<label>${m}<textarea data-rv="${u}">${esc(r[u])}</textarea></label>`;
  return (
    `<h1>Revisão</h1>${cal()}<h2>Revisão do período</h2><label>Período<select id="rp">${opt(
      [
        ["w0", "Esta semana"],
        ["w1", "Semana passada"],
        ["m0", "Este mês"],
        ["m1", "Mês passado"],
      ],
      RP,
    )}</select></label><div class="mut sm">${e.split("-").reverse().join("/")} a ${t.split("-").reverse().join("/")}</div>` +
    (s
      ? `<div class="kv" style="margin-top:8px">${KV("Trades", s, "", pc(n.filter((u) => u > 0).length / s) + " de acerto")}${KV("Resultado", mnyMix(somaMoedas(o)), cls(sum(n)), pctConta(totBRL(somaMoedas(o))))}${KV("Média por trade", mnyMix(mediaMoedas(o)), cls(avg(n)))}${KV("Regras seguidas", pc(o.filter((u) => u.rules !== "n").length / s))}${KV("Nota média do dia", l.length ? f2(avg(l)) : "–")}${KV("Dias registrados", i.length)}</div>${c ? `<div class="card">Erro mais caro: <b>${esc(c[0])}</b> <span class="r">${money(c[1])}</span></div>` : '<div class="card g">Nenhum erro registrado no período 👏</div>'}`
      : '<p class="mut">Sem trades fechados neste período.</p>') +
    p("repetir", "O que vou repetir (o que funcionou)?") +
    p("parar", "O que vou parar de fazer?") +
    p("plano", "Foco para o próximo período")
  );
}
function vTrades(e = "D") {
  if (e === "D") return vList(e);
  if (XV[e] === "an") return xtHead(e) + xtSw(e) + analise(e);
  const t = VW[e] || "ab",
    a = S.trades.filter((s) => s.tipo === e && inPer(s.dt)),
    o = a.filter(isOpen).sort((s, n) => n.dt.localeCompare(s.dt));
  return (
    `<div class="top"><h1>${e === "O" ? "Opções" : "Swing trade"}</h1><button class="btn" data-a="new" data-tp="${e}">+ Novo trade</button></div>${xtSw(e)}${capCard(e)}${extrato(e)}<div class="${e === "S" ? "g3" : "g2"}" style="margin:8px 0"><button class="btn ${t === "ab" ? "" : "s"}" data-a="vw" data-tp="${e}" data-id="ab">Abertas (${o.length})</button><button class="btn ${t === "pf" ? "" : "s"}" data-a="vw" data-tp="${e}" data-id="pf">Performance</button>${e === "S" ? `<button class="btn ${t === "sc" ? "" : "s"}" data-a="vw" data-tp="S" data-id="sc">Scanner</button>` : ""}</div>${t === "sc" ? "" : perSel()}${t === "pf" ? filtBar() : ""}` +
    (t === "sc" && e === "S"
      ? vScan()
      : t === "ab"
        ? o.length
          ? o.map(card).join("")
          : `<p class="mut">Nenhuma posição aberta. ${e === "O" ? "Registre a montagem com strike, vencimento e prêmio de entrada." : "Registre a entrada com o planejamento (entrada, stop e alvos)."} Depois use o botão Encerrar quando sair.</p>`
        : perfView(a))
  );
}
function perfView(e) {
  const t = fl(e)
    .map((r) => ({ ...r, c: calc(r) }))
    .filter((r) => r.c.pl != null)
    .sort((r, i) => (i.dtx || i.dt).localeCompare(r.dtx || r.dt));
  if (!t.length)
    return '<p class="mut">Nenhuma operação encerrada no período.</p>';
  const a = t.map((r) => r.c.pl),
    o = sum(a),
    s = moedaT(t[0]),
    n = t[0].tipo || "D";
  return `<div class="kv" style="margin-top:8px">${KV("Resultado", mnyMix(somaMoedas(t)), cls(o), t.length + " operação(ões)" + (pctConta(o, s, n) ? " · " + pctConta(o, s, n) : ""))}${KV("Média por trade", mnyMix(mediaMoedas(t)), cls(avg(a)))}${KV("Acerto", pc(a.filter((r) => r > 0).length / a.length))}${KV("Maior ganho / perda", mnyC(Math.max(...a), s) + " / " + mnyC(Math.min(...a), s))}</div><div class="card" style="margin-top:8px"><table><tr><th>Ativo</th><th>Entrada</th><th>Saída</th><th>Resultado</th></tr>${t.map((r) => `<tr data-a="edit" data-id="${r.id}" style="cursor:pointer"><td>${esc(r.ativo) || "—"}<div class="mut sm">${fdt(r.dtx || r.dt).slice(0, 5)}${r.tipo === "O" && r.strike ? " · " + (r.ot === "P" ? "Put" : "Call") + " " + esc(r.strike) : ""}</div></td><td>${esc(r.entry)}</td><td>${esc(r.exit)}</td><td class="${cls(r.c.pl)}">${mT(r, r.c.pl)}<div class="sm">${pctConta(r.c.pl, moedaT(r), r.tipo || "D")}</div></td></tr>`).join("")}</table></div>`;
}
function qsheet() {
  const e = T,
    t = (a, o) =>
      `<label>${o}<input name="${a}" type="number" step="any" inputmode="decimal" value="${esc(e[a])}"></label>`;
  return `<div class="ov"><div class="sh"><div class="top"><h2 style="margin:0">Encerrar posição</h2><button class="x" data-a="close">✕</button></div>${String(e.ativo || "").trim() ? `<div class="card"><b>${esc(e.ativo)}</b></div>` : '<label>Ativo (obrigatório)<input name="ativo" value="" placeholder="WINZ26" autocapitalize="characters"></label>'}<label>Lado</label>${segs(
    "side",
    e.side,
    e.tipo === "O"
      ? [
          ["C", "Comprado", "g"],
          ["V", "Lançado", "r"],
        ]
      : [
          ["C", "Compra", "g"],
          ["V", "Venda", "r"],
        ],
  )}<div class="g3">${t("entry", e.tipo === "O" ? "Prêmio de entrada" : "Entrada")}${t("stop", e.tipo === "O" ? "Prêmio do stop" : "Stop inicial")}${t("qty", "Qtd.")}</div>${e.tipo === "O" ? "" : t("pv", "R$/ponto")}
<div class="g2">${t("mep", "Melhor preço (MEP)")}${t("men", "Pior preço (MEN)")}</div><label>${e.tipo === "O" ? "Prêmio de saída" : "Preço de saída"}<input name="exit" type="number" step="any" inputmode="decimal" value="${esc(e.exit)}"></label>
<div class="g2"><label>Custos totais (R$)<input name="cost" type="number" step="any" inputmode="decimal" value="${esc(e.cost)}"></label><label>Data e hora da saída<input type="datetime-local" name="dtx" value="${esc(e.dtx)}"></label></div><div class="prev" id="prev"></div>
<h3>Foto da saída</h3><div class="ph"><div class="pv">${e.pout ? `<img data-img="${e.pout}">` : ""}</div><label class="btn s" style="color:var(--tx)">${e.pout ? "Trocar" : "Adicionar"} foto<input type="file" accept="image/*" hidden data-k="pout"></label></div>
<label>Segui minhas regras?</label>${segs("rules", e.rules, [
    ["s", "Sim", "g"],
    ["n", "Não", "r"],
  ])}<label>Erro cometido<select name="err">${opt(ERR, e.err)}</select></label>
<label>Anotações<textarea name="nota">${esc(e.nota)}</textarea></label><div id="msg" class="r" style="margin:8px 0"></div><button class="btn" data-a="savetrade" style="width:100%">Encerrar posição</button></div></div>`;
}
function zoom(e) {
  const t = $("#lb");
  ((t.innerHTML = `<button class="x" data-a="lbx" style="position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:12px;color:#ffffff;font-size:32px;z-index:2">✕</button><img src="${esc(e)}" style="width:100%;display:block;margin:auto">`),
    (t.style.display = "block"));
}
function bkBanner() {
  if (
    tab === "painel" ||
    !S.trades.length ||
    (SESS && S.lastSyncAt && Date.now() - S.lastSyncAt < 3 * 864e5)
  )
    return;
  const e = S.lastBackup
    ? Math.floor((Date.now() - new Date(S.lastBackup + "T12:00")) / 864e5)
    : null;
  (e != null && e <= 7) ||
    $("#app").insertAdjacentHTML(
      "afterbegin",
      `<div class="warn" style="margin-bottom:8px">💾 ${e == null ? "Você ainda não fez backup." : "Último backup há " + e + " dias."} Fotos e trades ficam só neste aparelho. <button class="btn s" data-a="gopainel" style="margin-left:6px">Fazer backup</button></div>`,
    );
}
function vHome() {
  const e = loc().slice(0, 10),
    t = S.trades
      .map((i) => ({ ...i, c: calc(i) }))
      .filter((i) => i.c.pl != null && (i.dtx || i.dt).slice(0, 10) === e)
      .concat(typeof fxDia == "function" ? fxDia(e) : []),
    a = sum(t.map((i) => emBRL(i.c.pl, moedaT(i)))),
    o = sum(t.map((i) => i.c.r || 0)),
    s = S.trades.filter(isOpen).sort((i, l) => l.dt.localeCompare(i.dt)),
    n = chkN((S.days[e] || {}).chk),
    r = s
      .filter((i) => i.tipo === "O" && i.venc)
      .map((i) => ({
        t: i,
        d: Math.round(
          (new Date(i.venc + "T12:00") - new Date(e + "T12:00")) / 864e5,
        ),
      }))
      .filter((i) => i.d <= 7)
      .sort((i, l) => i.d - l.d);
  return `<section data-hb="hero">${hero(a, o, t.length, s.length, n)}</section><section data-hb="cap">${capTotal()}</section><section data-hb="posso">${posso(t, a, n)}</section><section data-hb="turno">${turnoCard()}</section><section data-hb="venc">${r.length ? "<h2>⏳ Vencimentos próximos</h2>" + r.map((i) => `<div class="warn" style="margin:6px 0">${esc(i.t.ativo)} · ${i.d < 0 ? "venceu há " + -i.d + " dia(s)" : i.d === 0 ? "vence hoje" : "vence em " + i.d + " dia(s)"}</div>`).join("") : ""}</section><section data-hb="pos"><h2>Posições abertas (${s.length})</h2>${s.length ? s.map(card).join("") : '<p class="mut">Nenhuma posição aberta.</p>'}</section><section data-hb="lim"><h2>Limites da mesa</h2><div id="pp"></div></section><section data-hb="metas"><h2>Metas de processo</h2><div id="gg"></div></section><section data-hb="cal">${calMes()}</section><section data-hb="acoes"><div class="g2" style="margin-top:12px"><button class="btn" data-a="new" data-tp="D">+ Day trade</button><button class="btn s" data-a="gotab" data-id="dia">Abrir o dia</button></div></section>`;
}
const ls = {
    get(e) {
      try {
        return JSON.parse(APP_STORAGE.getItem(e));
      } catch {
        return null;
      }
    },
    set(e, t) {
      try {
        APP_STORAGE.setItem(e, JSON.stringify(t));
      } catch {}
    },
    del(e) {
      try {
        APP_STORAGE.removeItem(e);
      } catch {}
    },
  },
  cfg = () =>
    window.SUPA_URL && window.SUPA_KEY
      ? {
          url: String(window.SUPA_URL).replace(/\/$/, ""),
          key: window.SUPA_KEY,
        }
      : ls.get("diario-cfg"),
  hm = (e = Date.now()) =>
    new Date(e).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  em = (e) => {
    const t = String((e && e.message) || e);
    return /Invalid login/i.test(t)
      ? "E-mail ou senha incorretos."
      : /not confirmed/i.test(t)
        ? "Confirme seu e-mail antes de entrar."
        : /already registered/i.test(t)
          ? "E-mail já cadastrado: use Entrar."
          : /Failed to fetch|NetworkError|Load failed/i.test(t)
            ? "Sem conexão com a internet."
            : /at least/i.test(t)
              ? "Senha fraca: use pelo menos 10 caracteres."
              : /rate limit|too many|429/i.test(t)
                ? "Muitas tentativas seguidas. Espere alguns minutos e tente de novo."
                : /deadline|timed? ?out|504|Erro 50[234]/i.test(t)
                  ? "O servidor demorou para responder. Sua conta pode ter sido criada: confira seu e-mail (e o spam). Se não chegar em 5 minutos, toque em Reenviar e-mail de confirmação."
                  : /weak|pwned|leaked/i.test(t)
                    ? "Essa senha é fraca ou já vazou na internet. Escolha outra."
                    : t;
  },
  seedRules = () => {
    S.rules = SEED.map(([e, t]) => ({ id: uid(), cat: e, t }));
  };
function syncOwner() {
  return typeof SESS > "u" ? null : SESS?.uid || null;
}
function assertSyncOwner(e) {
  if (syncOwner() !== e) {
    const t = new Error(
      "A conta mudou durante a operação. A resposta anterior foi descartada.",
    );
    throw ((t.code = "SESSION_CHANGED"), t);
  }
}
async function rq(e, t = {}, a = !0) {
  const o = syncOwner(),
    s = cfg();
  if (!s) throw new Error("Configure o Supabase.");
  (a && (await tok()), assertSyncOwner(o));
  const n = t.tok || (a && SESS ? SESS.at : /^eyJ/.test(s.key) ? s.key : ""),
    r = {
      apikey: s.key,
      ...(n ? { Authorization: "Bearer " + n } : {}),
      ...(t.headers || {}),
    },
    i = await fetch(s.url + e, { ...t, headers: r });
  if ((assertSyncOwner(o), !i.ok)) {
    let l = "";
    try {
      const c = await i.json();
      l = c.msg || c.message || c.error_description || c.error || "";
    } catch {}
    const d = new Error(l || "Erro " + i.status);
    throw ((d.status = i.status), d);
  }
  return i;
}
function setSess(e, t) {
  ((SESS = {
    at: e.access_token,
    rt: e.refresh_token,
    exp: Date.now() + (e.expires_in || 3600) * 1e3,
    uid: e.user.id,
    email: t || e.user.email,
  }),
    ls.set("diario-sess", SESS));
}
async function tok() {
  if (!SESS) throw new Error("Entre na sua conta.");
  if (SESS.exp - Date.now() > 6e4) return;
  const e = syncOwner(),
    t = SESS.email,
    a = SESS.rt;
  try {
    const s = await (
      await rq(
        "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: a }),
        },
        !1,
      )
    ).json();
    (assertSyncOwner(e), setSess(s, t));
  } catch (o) {
    throw (
      assertSyncOwner(e),
      o.status === 400 || o.status === 401
        ? ((SESS = null),
          ls.del("diario-sess"),
          new Error("Sessão expirada: entre novamente."))
        : o
    );
  }
}
async function hashAuth() {
  const e = new URLSearchParams(location.hash.slice(1)),
    t = e.get("access_token");
  if (t) {
    if (
      (history.replaceState(null, "", location.pathname),
      e.get("type") === "recovery")
    ) {
      ((RECOV = t), (tab = "conta"));
      return;
    }
    try {
      const a = await (await rq("/auth/v1/user", { tok: t }, !1)).json();
      (setSess(
        {
          access_token: t,
          refresh_token: e.get("refresh_token"),
          expires_in: +e.get("expires_in") || 3600,
          user: a,
        },
        a.email,
      ),
        (tab = "conta"));
    } catch {}
  }
}
async function doAuth(e) {
  const t = $("#ce").value.trim(),
    a = $("#cp").value;
  if (((SY.email = t), !t || a.length < (e === "up" ? 10 : 6))) {
    ((SY.msg =
      e === "up"
        ? "Informe e-mail e uma senha de pelo menos 10 caracteres."
        : "Informe e-mail e senha."),
      render());
    return;
  }
  if (e === "up" && !SY.termo) {
    ((SY.msg =
      "Para criar a conta, aceite os Termos de uso e a Política de privacidade."),
      render());
    return;
  }
  ((SY.msg = "Aguarde…"), render());
  try {
    const o = JSON.stringify(
        e === "up"
          ? {
              email: t,
              password: a,
              data: { termos: TERMOS_VER, termos_em: new Date().toISOString() },
            }
          : { email: t, password: a },
      ),
      s = { "Content-Type": "application/json" };
    if (e === "up") {
      const n = await (
        await rq("/auth/v1/signup", { method: "POST", headers: s, body: o }, !1)
      ).json();
      if (!n.access_token) {
        ((SY.msg =
          "Conta criada. Abra o e-mail de confirmação que enviamos (veja também o spam) e depois toque em Entrar."),
          (SY.reenv = t),
          (AM = "in"),
          render());
        return;
      }
      setSess(n, t);
    } else
      setSess(
        await (
          await rq(
            "/auth/v1/token?grant_type=password",
            { method: "POST", headers: s, body: o },
            !1,
          )
        ).json(),
        t,
      );
    (S.uid &&
      S.uid !== SESS.uid &&
      ((S = { trades: [], days: {}, rules: [], seed: 1, mt: 0 }), seedRules()),
      (SY.msg = ""),
      render(),
      await sync(1));
  } catch (o) {
    ((SY.msg = em(o)), render());
  }
}
const pub = () => {
  const { uid: e, st: t, up: a, lastSyncAt: o, ...s } = S;
  return { ...s, days: diarioDaysCanonical() };
};
function syncSoon() {
  (clearTimeout(sT), SESS && (sT = setTimeout(() => sync(), 3e3)));
}
function uiSy() {
  const e = $("#sy");
  e && (e.textContent = SY.msg);
}
function adopt(e) {
  const t = { uid: S.uid, up: S.up };
  ((S = { trades: [], days: {}, rules: [], seed: 1, ...e, ...t, st: e.mt }),
    window.DiarioDados?.reset(S.days),
    persist());
}
function diarioDaysCanonical() {
  try {
    if (typeof MDU < "u" && MDU.k && MDU.par)
      return ((MDU.par.us = S.days[MDU.k]), { ...S.days, [MDU.k]: MDU.par });
  } catch {}
  return S.days || {};
}
function mergeIn(e) {
  const t = { ...(e.del || {}) };
  for (const [p, u] of Object.entries(S.del || {}))
    t[p] = Math.max(+t[p] || 0, +u || 0);
  const a = new Map();
  [...(e.trades || []), ...S.trades].forEach((p) => {
    const u = a.get(p.id);
    typeof window < "u" && window.TraderModel
      ? a.set(p.id, window.TraderModel.mergeRecord(p, u))
      : (!u || (p.u || 0) >= (u.u || 0)) && a.set(p.id, p);
  });
  const o = [...a.values()].filter((p) => !(t[p.id] && t[p.id] >= (p.u || 0))),
    s = { ...(e.days || {}) };
  for (const [p, u] of Object.entries(S.days || {}))
    (!s[p] || (u.u || 0) >= (s[p].u || 0)) && (s[p] = u);
  if (typeof window < "u" && window.DiarioDados) {
    const p = window.DiarioDados.mergeDays(S.days, e.days);
    for (const u of Object.keys(s)) delete s[u];
    Object.assign(s, p);
  }
  const n = new Map();
  [...(e.rules || []), ...S.rules].forEach((p) => {
    const u = n.get(p.id);
    (!u || (p.u || 0) >= (u.u || 0)) && n.set(p.id, p);
  });
  const r = [...n.values()].filter((p) => !t[p.id]),
    i = new Map(),
    l = S.mt >= (e.mt || 0) ? S : e,
    d = l === S ? e : S;
  [...(e.books || []), ...(S.books || [])].forEach((p) => {
    const u = i.get(p.id);
    (!u || (p.u || 0) >= (u.u || 0)) && i.set(p.id, p);
  });
  const c = [...i.values()].filter((p) => !(t[p.id] && t[p.id] >= (p.u || 0)));
  S = {
    ...d,
    ...l,
    trades: o,
    days: s,
    rules: r,
    books: c,
    del: t,
    ops: unionU(e.ops, S.ops, t),
    lanc: unionU(e.lanc, S.lanc, t),
    mesaTr: unionU(e.mesaTr, S.mesaTr, t),
    olho: unionU(e.olho, S.olho, t),
    olR: ((e.olRu || 0) > (S.olRu || 0) ? e.olR : S.olR) || e.olR,
    olRu: Math.max(e.olRu || 0, S.olRu || 0),
    pn: { ...(d.pn || {}), ...(l.pn || {}) },
    ax: {
      ...(d.ax || {}),
      ...(l.ax || {}),
      ...(globalThis.AdvancedResearch &&
      (d.ax?.researchAdvanced || l.ax?.researchAdvanced)
        ? {
            researchAdvanced: globalThis.AdvancedResearch.merge(
              d.ax?.researchAdvanced,
              l.ax?.researchAdvanced,
            ),
          }
        : {}),
    },
    rev: { ...(d.rev || {}), ...(l.rev || {}) },
    cart:
      d.cart || l.cart
        ? {
            ...(d.cart || {}),
            ...(l.cart || {}),
            lanc: window.TraderBackupModel.records(
              S.cart?.lanc,
              e.cart?.lanc,
              t,
            ),
          }
        : void 0,
    watch: [...new Set([...(e.watch || []), ...(S.watch || [])])],
    uid: S.uid,
    up: S.up,
    st: S.st,
    mt: Date.now(),
  };
}
async function photos() {
  const e = syncOwner(),
    t = [
      ...new Set(
        S.trades.flatMap((o) =>
          ["pin", "pout", "pplan"].map((s) => o[s]).filter(Boolean),
        ),
      ),
    ];
  S.up = S.up || {};
  let a = 0;
  for (const o of t) {
    const s = M[o] || (await idb("img", "get", o)),
      n = "/storage/v1/object/fotos/" + e + "/" + o + ".jpg";
    if ((assertSyncOwner(e), s && !S.up[o]))
      (await rq(n, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg", "x-upsert": "true" },
        body: s,
      }),
        assertSyncOwner(e),
        (S.up[o] = 1));
    else if (!s)
      try {
        const r = await (
          await rq(n.replace("/object/", "/object/authenticated/"))
        ).blob();
        (assertSyncOwner(e),
          (M[o] = r),
          await idb("img", "put", r, o),
          assertSyncOwner(e),
          (S.up[o] = 1),
          delete U[o],
          a++);
      } catch (r) {
        if (r.status !== 400 && r.status !== 404) throw r;
      }
  }
  return (persist(), a);
}
async function up(e = null, revision = null) {
  const owner = syncOwner();
  for (let i = 0; i < 3; i++) {
    assertSyncOwner(owner);
    const data = pub();
    const result = await (
      await rq("/rest/v1/rpc/diario_salvar_revisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({ expected_revision: revision, new_data: data }),
      })
    ).json();
    assertSyncOwner(owner);
    if (result.saved) {
      S.st = data.mt;
      persist();
      window.TraderContinuo329?.signal("cloud");
      return;
    }
    revision = result.revision ?? null;
    if (result.data) mergeIn(result.data);
  }
  const error = new Error(
    "Outro aparelho está atualizando o diário. Os dados estão salvos neste aparelho.",
  );
  error.status = 409;
  throw error;
}
async function sync(force) {
  const owner = syncOwner();
  if (!SESS || SY.busy) return;
  SY.busy = 1;
  SY.msg = "Sincronizando…";
  uiSy();
  let failed = false;
  try {
    const rows = await (
      await rq("/rest/v1/diario?select=data,revision&user_id=eq." + SESS.uid, {
        signal: AbortSignal.timeout(20000),
      })
    ).json();
    assertSyncOwner(owner);
    const remote = rows[0]?.data,
      revision = rows[0]?.revision ?? null;
    let upload = false,
      redraw = false;
    if (!remote) upload = true;
    else {
      const r = remote.mt || 0,
        l = S.mt || 0,
        base = S.st || 0;
      if (r > base && l > base) {
        mergeIn(remote);
        upload = true;
        redraw = true;
      } else if (r > base) {
        adopt(remote);
        redraw = true;
      } else if (l > base || force) upload = true;
    }
    S.uid = SESS.uid;
    const count = await photos();
    assertSyncOwner(owner);
    if (upload || !S.st) await up(remote, revision);
    assertSyncOwner(owner);
    S.lastSyncAt = Date.now();
    persist();
    SY_RECOVERY.saved();
    SY.msg = "Sincronizado às " + hm();
    if ((count || redraw) && !typing()) render();
  } catch (error) {
    failed = true;
    if (syncOwner() === owner) {
      SY.msg = SY_RECOVERY.failed(error)
        ? "Salvo neste aparelho · sincronização pendente. Nova tentativa automática."
        : "Falha ao sincronizar: " + em(error);
    }
  } finally {
    SY.busy = 0;
    uiSy();
    svUi();
    if (tab === "conta") render();
    if (!failed && S.mt > S.st) syncSoon();
  }
}
const SY_RECOVERY = DiarioSyncRecovery.criar({
  owner: syncOwner,
  run: () => sync(),
  changed: () => {},
});
let remoteCloudTimer = null;
(addEventListener("trader:remote-cloud-save", (e) => {
  const t = e?.detail?.owner;
  !t ||
    !SESS ||
    SESS.uid !== t ||
    window.DIARIO_DEMO ||
    (clearTimeout(remoteCloudTimer),
    (remoteCloudTimer = setTimeout(() => {
      if (
        ((remoteCloudTimer = null),
        !(!SESS || SESS.uid !== t) && !(document.hidden || !navigator.onLine))
      ) {
        if (SY.busy || LOCAL_SAVE.pending || S.mt > S.st) {
          ((SY.msg =
            "Alteracoes em outra janela: finalize o salvamento local para atualizar."),
            uiSy(),
            (LOCAL_SAVE.pending || S.mt > S.st) && syncSoon());
          return;
        }
        sync().catch(() => {});
      }
    }, 1200)));
}),
  document.addEventListener("visibilitychange", () => {
    !document.hidden && SESS && sync();
  }),
  addEventListener("online", () => {
    SESS && sync();
  }));
function vConta() {
  if (!window.CLOUD_OK)
    return '<h1>Conta</h1><div class="card">A conta com sincronização na nuvem funciona só na versão hospedada do app (Netlify ou GitHub Pages). Nesta versão, seus dados ficam só neste aparelho: use o backup completo na aba Painel.</div>';
  const e = cfg(),
    t = !(window.SUPA_URL && window.SUPA_KEY);
  return e
    ? RECOV
      ? `<h1>Nova senha</h1><label>Nova senha (mín. 10 caracteres)<input id="np" type="password" autocomplete="new-password"></label><button class="btn" style="margin-top:10px" data-a="newpw">Salvar senha</button><div class="r sm" style="margin-top:8px">${esc(SY.msg)}</div>`
      : SESS
        ? `<h1>Conta</h1><div class="card"><b>${esc(SESS.email)}</b><div class="mut sm" id="sy">${esc(SY.msg || (S.lastSyncAt ? "Última sincronização: " + hm(S.lastSyncAt) : "Ainda não sincronizado"))}</div></div><div class="g2"><button class="btn" data-a="syncnow">Sincronizar agora</button><button class="btn s" data-a="logout">Sair</button></div><p class="mut sm">Seus dados também ficam salvos neste aparelho, então o app funciona offline e sincroniza quando a internet voltar. Apagar um trade em um aparelho apaga nos outros na próxima sincronização.</p>`
        : `<h1>Conta</h1><p class="mut sm">Entre para sincronizar operações e fotos em todos os seus aparelhos.</p><div class="g2" style="margin:8px 0"><button class="btn ${AM === "in" ? "" : "s"}" data-a="am" data-id="in">Entrar</button><button class="btn ${AM === "up" ? "" : "s"}" data-a="am" data-id="up">Criar conta</button></div><label>E-mail<input id="ce" type="email" autocomplete="email" value="${esc(SY.email)}"></label><label>${AM === "up" ? "Senha (mín. 10 caracteres)" : "Senha"}<input id="cp" type="password" autocomplete="${AM === "up" ? "new-password" : "current-password"}"></label><button class="btn" style="margin-top:10px;width:100%" data-a="auth">${AM === "in" ? "Entrar" : "Criar conta"}</button><div class="r sm" style="margin-top:8px">${esc(SY.msg)}</div>${t ? '<button class="btn s" style="margin-top:12px" data-a="clrcfg">Trocar projeto Supabase</button>' : ""}`
    : `<h1>Conta</h1><p class="mut sm">Cole os dados do seu projeto Supabase (Project Settings → API): a URL e a chave <b>anon public</b>.</p><label>URL do projeto<input id="cu" placeholder="https://xxxx.supabase.co"></label><label>Chave anon<input id="ck"></label><button class="btn" style="margin-top:10px" data-a="savecfg">Salvar</button><div class="r sm" style="margin-top:8px">${esc(SY.msg)}</div>`;
}
const EMO = ["😫", "😕", "😐", "🙂", "😄"],
  segs = (e, t, a) =>
    `<div class="chips2">${a.map(([o, s, n]) => `<button class="${t == o ? "on " + (n || "") : ""}" data-seg="${e}" data-v="${o}">${s}</button>`).join("")}</div>`,
  segT = (e) => segOps(e),
  fl = (e) =>
    e.filter((t) => {
      const a = calc(t);
      return (
        LF.f === "all" ||
        (LF.f === "ab" && a.r == null) ||
        (LF.f === "g" && a.pl > 0) ||
        (LF.f === "p" && a.pl < 0)
      );
    }),
  filtBar = () =>
    `<div class="chips2" style="margin-top:8px">${[
      ["all", "Todos"],
      ["ab", "Abertas"],
      ["g", "Ganhos"],
      ["p", "Perdas"],
    ]
      .map(
        ([e, t]) =>
          `<button class="${LF.f === e ? "on" : ""}" data-a="flt" data-id="${e}">${t}</button>`,
      )
      .join(
        "",
      )}</div><input id="lq" placeholder="🔍 Buscar ativo ou setup" value="${esc(LF.q)}" style="margin-top:8px">`;
function applyQ() {
  LF.q &&
    document
      .querySelectorAll(".card[data-s]")
      .forEach(
        (e) => (e.style.display = e.dataset.s.includes(LF.q) ? "" : "none"),
      );
}
function applyTheme() {
  const e = ls.get("diario-theme"),
    t = document.documentElement;
  !t ||
    !t.setAttribute ||
    (e === "light" || e === "dark"
      ? t.setAttribute("data-theme", e)
      : t.removeAttribute("data-theme"));
}
function animCount() {
  document.querySelectorAll("[data-count]").forEach((e) => {
    const t = +e.dataset.count,
      a = performance.now(),
      o = (s) => {
        const n = Math.min(1, (s - a) / 700);
        ((e.textContent = money(t * (1 - Math.pow(1 - n, 3)))),
          n < 1 && requestAnimationFrame(o));
      };
    requestAnimationFrame(o);
  });
}
function spark() {
  const e = S.trades
    .map((i) => ({ t: i, c: calc(i) }))
    .filter((i) => i.c.pl != null)
    .map((i) => ({ t: i.t, c: { ...i.c, pl: emBRL(i.c.pl, moedaT(i.t)) } }))
    .concat(
      typeof fxPer == "function"
        ? fxPer("0000-00-00", "9999-12-31").map((i) => ({
            t: i,
            c: { ...i.c, pl: emBRL(i.c.pl, "USD") },
          }))
        : [],
    )
    .sort((i, l) => (i.t.dtx || i.t.dt).localeCompare(l.t.dtx || l.t.dt))
    .slice(-30);
  if (e.length < 2) return "";
  let t = 0;
  const a = e.map((i) => (t += i.c.pl)),
    o = Math.min(0, ...a),
    s = Math.max(0, ...a),
    n = (i) => 46 - ((i - o) / (s - o || 1)) * 40,
    r = a.map((i, l) => (l / (a.length - 1)) * 300 + "," + n(i)).join(" ");
  return `<svg viewBox="0 0 300 50" style="width:100%;margin-top:8px"><polygon points="0,50 ${r} 300,50" fill="var(--ac)" opacity=".15"/><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${r}"/></svg><div class="sm mut">evolução dos últimos 30 trades</div>`;
}
var hero, vMais;
const ring = (e, t, a = "var(--ac)") => {
  const o = 2 * Math.PI * 26,
    s = (o * Math.min(100, Math.max(0, e))) / 100;
  return `<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--bd)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${s} ${o}" transform="rotate(-90 32 32)"/><text x="32" y="36" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor">${Math.round(e)}%</text></svg><span class="mut sm">${t}</span></div>`;
};
var lineChart, barChart;
function chPoint(e) {
  const t = e.target.closest && e.target.closest("svg[data-ch]");
  if (!t) return;
  const a = t.dataset.ch,
    o = CH[a];
  if (!o) return;
  const s = t.getBoundingClientRect(),
    n = o.vals.length,
    r = Math.max(
      0,
      Math.min(
        n - 1,
        Math.round(((e.clientX - s.left) / s.width) * (n > 1 ? n - 1 : 0)),
      ),
    ),
    i = Math.min(0, ...o.vals),
    l = Math.max(0, ...o.vals),
    d = n > 1 ? (r / (n - 1)) * 300 : 150,
    c = 90 - ((o.vals[r] - i) / (l - i || 1)) * 80,
    p = $("#chl-" + a),
    u = $("#chc-" + a);
  (p.setAttribute("x1", d),
    p.setAttribute("x2", d),
    (p.style.display = ""),
    u.setAttribute("cx", d),
    u.setAttribute("cy", c),
    (u.style.display = ""),
    ($("#chr-" + a).textContent = o.labels[r] + " · " + o.unit(o.vals[r])));
}
(document.addEventListener("pointerdown", chPoint),
  document.addEventListener("pointermove", (e) => {
    (e.buttons || e.pointerType === "touch") && chPoint(e);
  }));
const PATS = [
    [
      "martelo",
      "Martelo",
      "alta",
      [[60, 64, 10, 63]],
      "Após uma queda (fundo ou suporte).",
      "Corpo pequeno no topo e sombra inferior longa (≥ 2× o corpo), quase sem sombra superior. Os vendedores empurraram o preço para baixo, mas os compradores o devolveram até perto da abertura.",
      "Candle seguinte fechando acima do corpo do martelo. Stop abaixo da mínima.",
    ],
    [
      "enforcado",
      "Homem enforcado",
      "baixa",
      [[63, 66, 12, 60]],
      "Após uma alta (topo ou resistência).",
      "Mesmo formato do martelo, mas aparece no topo. Mostra que já houve venda forte durante o pregão; os compradores ainda seguraram o fechamento, mas o fôlego está acabando.",
      "Candle seguinte de baixa, fechando abaixo do corpo. Sem confirmação é só um alerta.",
    ],
    [
      "martelo-inv",
      "Martelo invertido",
      "alta",
      [[22, 70, 18, 25]],
      "Após uma queda.",
      "Corpo pequeno embaixo e sombra superior longa. Os compradores tentaram reagir; sozinho é fraco, precisa de confirmação.",
      "Abertura/fechamento do dia seguinte acima do corpo do martelo invertido.",
    ],
    [
      "estrela-cad",
      "Estrela cadente",
      "baixa",
      [[30, 78, 26, 27]],
      "Após uma alta.",
      "Corpo pequeno embaixo e sombra superior longa (≥ 2× o corpo). O preço subiu forte, mas foi rejeitado e devolvido. Sinal de exaustão dos compradores.",
      "Candle seguinte de baixa. Stop acima da máxima da estrela.",
    ],
    [
      "doji",
      "Doji",
      "indec",
      [[50, 75, 25, 50]],
      "Em qualquer ponto; pesa mais no fim de tendência.",
      "Abertura e fechamento praticamente iguais: equilíbrio entre compradores e vendedores. Indica indecisão e possível pausa ou virada da tendência.",
      "Esperar o candle seguinte definir a direção.",
    ],
    [
      "doji-lib",
      "Doji libélula",
      "alta",
      [[70, 72, 20, 71]],
      "Fundo de tendência de baixa.",
      'Abertura, fechamento e máxima praticamente iguais, com sombra inferior longa. Forma de "T". Rejeição forte de preços baixos.',
      "Candle de alta na sequência.",
    ],
    [
      "doji-lap",
      "Doji lápide",
      "baixa",
      [[30, 80, 28, 29]],
      "Topo de tendência de alta.",
      'Abertura, fechamento e mínima praticamente iguais, com sombra superior longa. Forma de "T" invertido. Rejeição forte de preços altos.',
      "Candle de baixa na sequência.",
    ],
    [
      "piao",
      "Pião (spinning top)",
      "indec",
      [[45, 70, 30, 55]],
      "Qualquer ponto; relevante depois de candles longos.",
      "Corpo pequeno com sombras dos dois lados: disputa sem vencedor. Mostra perda de força da tendência atual.",
      "Aguardar o candle seguinte; observar volume.",
    ],
    [
      "maru-alta",
      "Marubozu de alta",
      "cont",
      [[20, 80, 20, 80]],
      "Início ou meio de movimento de alta.",
      "Candle de alta sem sombras: compradores dominaram do começo ao fim. Força compradora.",
      "Costuma ser suporte ao ser retestado (meio do corpo).",
    ],
    [
      "maru-baixa",
      "Marubozu de baixa",
      "cont",
      [[80, 80, 20, 20]],
      "Início ou meio de movimento de baixa.",
      "Candle de baixa sem sombras: vendedores dominaram do começo ao fim. Força vendedora.",
      "Costuma ser resistência ao ser retestado (meio do corpo).",
    ],
    [
      "engolfo-alta",
      "Engolfo de alta",
      "alta",
      [
        [60, 62, 38, 40],
        [36, 68, 34, 66],
      ],
      "Após uma queda.",
      "Candle de baixa seguido de um candle de alta cujo corpo engole totalmente o corpo anterior. A força compradora assume o controle.",
      "Quanto maior o segundo candle e o volume, mais forte. Stop abaixo da mínima do engolfo.",
    ],
    [
      "engolfo-baixa",
      "Engolfo de baixa",
      "baixa",
      [
        [40, 62, 38, 60],
        [64, 66, 32, 34],
      ],
      "Após uma alta.",
      "Candle de alta seguido de um candle de baixa cujo corpo engole o corpo anterior. A força vendedora assume o controle.",
      "Quanto maior o segundo candle e o volume, mais forte. Stop acima da máxima do engolfo.",
    ],
    [
      "harami-alta",
      "Harami de alta",
      "alta",
      [
        [75, 77, 25, 30],
        [45, 55, 42, 52],
      ],
      "Após uma queda.",
      "Candle de baixa longo seguido de um candle pequeno de alta contido no corpo do primeiro. A pressão vendedora diminui.",
      "Mais fraco que o engolfo; confirmar com um terceiro candle de alta.",
    ],
    [
      "harami-baixa",
      "Harami de baixa",
      "baixa",
      [
        [30, 77, 25, 75],
        [62, 66, 48, 50],
      ],
      "Após uma alta.",
      "Candle de alta longo seguido de um candle pequeno de baixa contido no corpo do primeiro. A pressão compradora diminui.",
      "Mais fraco que o engolfo; confirmar com um terceiro candle de baixa.",
    ],
    [
      "harami-cross",
      "Harami cross",
      "indec",
      [
        [75, 77, 25, 30],
        [52, 60, 44, 52],
      ],
      "Fim de tendência.",
      "Como o harami, mas o segundo candle é um doji. Indecisão forte depois de um candle longo; sinal de reversão mais relevante que o harami comum.",
      "Candle seguinte confirma a direção.",
    ],
    [
      "penetracao",
      "Linha de penetração",
      "alta",
      [
        [75, 77, 30, 32],
        [25, 62, 22, 60],
      ],
      "Após uma queda.",
      "Candle de baixa longo; o seguinte abre abaixo da mínima anterior e fecha acima do meio do corpo do primeiro (sem engolfar).",
      "Quanto mais o fechamento passar do meio do corpo, mais forte.",
    ],
    [
      "nuvem-negra",
      "Nuvem negra",
      "baixa",
      [
        [30, 72, 28, 70],
        [76, 78, 40, 42],
      ],
      "Após uma alta.",
      "Candle de alta longo; o seguinte abre acima da máxima anterior e fecha abaixo do meio do corpo do primeiro. Contrário da linha de penetração.",
      "Quanto mais o fechamento entrar no corpo anterior, mais forte.",
    ],
    [
      "pinca-fundo",
      "Pinça de fundo",
      "alta",
      [
        [60, 62, 20, 30],
        [28, 55, 20, 50],
      ],
      "Após uma queda, em suporte.",
      "Dois candles com mínimas praticamente iguais: o mercado testou o mesmo piso duas vezes e não perdeu.",
      "Mais forte se o segundo candle for de alta.",
    ],
    [
      "pinca-topo",
      "Pinça de topo",
      "baixa",
      [
        [40, 80, 38, 70],
        [72, 80, 50, 52],
      ],
      "Após uma alta, em resistência.",
      "Dois candles com máximas praticamente iguais: o mercado testou o mesmo teto duas vezes e não passou.",
      "Mais forte se o segundo candle for de baixa.",
    ],
    [
      "estrela-manha",
      "Estrela da manhã",
      "alta",
      [
        [80, 82, 45, 48],
        [40, 44, 30, 38],
        [42, 78, 40, 75],
      ],
      "Fundo de uma tendência de baixa.",
      "Três candles: baixa longo, candle pequeno (estrela) com gap para baixo, e alta longo que fecha acima do meio do primeiro. Reversão de alta clássica.",
      "Terceiro candle é a confirmação. Stop abaixo da mínima da estrela.",
    ],
    [
      "estrela-noite",
      "Estrela da noite",
      "baixa",
      [
        [20, 55, 18, 52],
        [60, 70, 58, 62],
        [58, 60, 22, 25],
      ],
      "Topo de uma tendência de alta.",
      "Três candles: alta longo, candle pequeno (estrela) com gap para cima, e baixa longo que fecha abaixo do meio do primeiro. Reversão de baixa clássica.",
      "Terceiro candle é a confirmação. Stop acima da máxima da estrela.",
    ],
    [
      "bebe-abandonado",
      "Bebê abandonado (alta)",
      "alta",
      [
        [80, 82, 50, 52],
        [40, 44, 36, 41],
        [48, 80, 46, 78],
      ],
      "Fundo de uma tendência de baixa.",
      "Variação rara e forte da estrela da manhã: o doji do meio fica isolado por gaps (suas sombras não encostam nos candles vizinhos).",
      "Raro; quando aparece, merece atenção. Confirmar com volume.",
    ],
    [
      "tres-soldados",
      "Três soldados brancos",
      "alta",
      [
        [20, 45, 18, 42],
        [38, 66, 36, 63],
        [58, 86, 56, 83],
      ],
      "Após uma queda ou lateralização.",
      "Três candles de alta seguidos, cada um abrindo dentro do corpo anterior e fechando perto da máxima. Compradores no controle.",
      "Cuidado se os candles forem muito longos (esticado): pode vir correção.",
    ],
    [
      "tres-corvos",
      "Três corvos negros",
      "baixa",
      [
        [84, 86, 60, 62],
        [66, 68, 38, 40],
        [44, 46, 16, 18],
      ],
      "Após uma alta ou lateralização.",
      "Três candles de baixa seguidos, cada um abrindo dentro do corpo anterior e fechando perto da mínima. Vendedores no controle.",
      "Cuidado se o preço já caiu muito: pode vir repique.",
    ],
    [
      "tres-metodos-alta",
      "Três métodos ascendentes",
      "cont",
      [
        [20, 72, 18, 70],
        [62, 66, 48, 52],
        [54, 64, 46, 50],
        [52, 60, 44, 48],
        [50, 88, 48, 86],
      ],
      "Durante uma tendência de alta.",
      "Candle de alta longo, três candles pequenos de correção dentro da sua faixa e novo candle de alta longo fechando acima do primeiro. Pausa saudável e continuação.",
      "Entrada no rompimento da máxima do quinto candle.",
    ],
    [
      "tres-metodos-baixa",
      "Três métodos descendentes",
      "cont",
      [
        [80, 82, 30, 32],
        [38, 52, 34, 48],
        [46, 54, 40, 44],
        [44, 56, 38, 42],
        [44, 46, 12, 14],
      ],
      "Durante uma tendência de baixa.",
      "Candle de baixa longo, três candles pequenos de repique dentro da sua faixa e novo candle de baixa longo fechando abaixo do primeiro. Pausa e continuação.",
      "Entrada no rompimento da mínima do quinto candle.",
    ],
  ],
  PT = {
    alta: ["Reversão de alta", "g"],
    baixa: ["Reversão de baixa", "r"],
    indec: ["Indecisão", "mut"],
    cont: ["Continuação", "mut"],
  },
  STS = [
    ["lendo", "📖 Lendo"],
    ["quero", "🔖 Quero ler"],
    ["feito", "✅ Concluído"],
  ];
let BID = null,
  PF = "all",
  BV = "pad";
function csvg(e) {
  const t = e.length * 26 + 8,
    a = (o) => 100 - o;
  return `<svg viewBox="0 0 ${t} 100" style="height:96px;width:auto;max-width:100%" aria-hidden="true">${e
    .map(([o, s, n, r], i) => {
      const l = 4 + i * 26 + 13,
        d = r > o ? "var(--g)" : r < o ? "var(--r)" : "var(--mut)";
      return `<line x1="${l}" x2="${l}" y1="${a(s)}" y2="${a(n)}" stroke="${d}" stroke-width="2"/><rect x="${l - 8}" y="${a(Math.max(o, r))}" width="16" height="${Math.max(1.5, Math.abs(o - r))}" fill="${d}" rx="1"/>`;
    })
    .join("")}</svg>`;
}
function seedBooks() {
  (S.books ?? (S.books = []),
    !S.books.some((e) => e.id === "cand") &&
      !(S.del && S.del.cand) &&
      (S.books.unshift({
        id: "cand",
        t: "Candlestick",
        a: "Carlos Alberto",
        st: "lendo",
        pat: 1,
        notes: [],
        u: Date.now(),
      }),
      persist()));
}
/* Title Case só na exibição: conectivos curtos ficam minúsculos (exceto a 1ª palavra); siglas mantidas. */
function tituloLivro(t) {
  const menores = new Set(["a","à","o","e","é","de","da","do","das","dos","em","no","na","nos","nas","um","uma","por","para","com","and","of","the","in","on","to","for","or"]);
  return String(t || "").trim().split(/\s+/).map((w, i) => {
    if (!w) return w;
    if (/[A-Z]{2,}/.test(w) || /\d/.test(w)) return w;
    const l = w.toLocaleLowerCase("pt-BR");
    if (i > 0 && menores.has(l)) return l;
    return l.charAt(0).toLocaleUpperCase("pt-BR") + l.slice(1);
  }).join(" ");
}
function vEstudos() {
  seedBooks();
  const books = S.books || [];
  return `<h1>Estudos</h1><label class="est-book-search">Buscar nos meus livros<input type="search" data-est-book-search placeholder="Título ou autor" aria-label="Buscar nos meus livros"></label>
 <div class="est-book-list">${books.map((book) => `<div class="card row" data-est-book-row data-a="openbook" data-id="${esc(book.id)}"><div class="th">${book.pat ? "🕯️" : "📘"}</div><div class="fl"><b>${esc(tituloLivro(book.t))}</b><div class="mut sm">${esc(book.a)} · ${(STS.find((status) => status[0] === book.st) || STS[0])[1]} · ${(book.notes || []).length} anotação(ões)${book.pat ? " · " + PATS.length + " padrões" : ""}</div></div></div>`).join("")}</div>
 <p class="mut sm est-book-empty" hidden>Nenhum livro corresponde à busca.</p>
 <details class="card est-book-add"><summary>Adicionar livro</summary><div class="g2"><label>Livro<input id="bt" placeholder="Título"></label><label>Autor<input id="ba" placeholder="Autor"></label></div><button class="btn" style="margin-top:10px" data-a="addbook">+ Adicionar livro</button></details>`;
}
function vLivro() {
  const e = (S.books || []).find((n) => n.id === BID);
  if (!e) return vEstudos();
  const t = (e.notes || []).slice().sort((n, r) => (r.u || 0) - (n.u || 0)),
    a = `<div class="top"><button class="btn s" data-a="gotab" data-id="estudos">‹ Livros</button>${e.pat ? "" : '<button class="btn s d" data-a="delbook" data-id="' + e.id + '">Excluir livro</button>'}</div><h1>${esc(tituloLivro(e.t))}</h1><div class="mut sm">${esc(e.a)}</div><label>Situação<select data-bs="${e.id}">${opt(STS, e.st || "lendo")}</select></label>`,
    o = e.pat
      ? `<div class="seg"><button class="${BV === "pad" ? "on" : ""}" data-a="bv" data-id="pad">🕯️ Padrões</button><button class="${BV === "not" ? "on" : ""}" data-a="bv" data-id="not">📝 Anotações</button></div>`
      : "",
    s = `<div class="card"><div class="g2" style="grid-template-columns:2fr 1fr"><label>Título<input id="nt" placeholder="Ex.: Capítulo 3, ideia-chave"></label><label>Página<input id="np" inputmode="numeric" placeholder="Pág."></label></div><label>Anotação<textarea id="nx" placeholder="O que aprendi / como aplico no meu trade"></textarea></label><button class="btn" style="margin-top:10px" data-a="addnote" data-id="${e.id}">Salvar anotação</button></div>${t.map((n) => `<div class="card"><div class="top"><b>${esc(n.t || "Sem título")}</b><span class="mut sm">${n.p ? "pág. " + esc(n.p) + " · " : ""}${new Date(n.u || 0).toLocaleDateString("pt-BR")}</span><button class="x" data-a="delnote" data-id="${e.id}" data-n="${n.id}">✕</button></div><textarea data-nb="${e.id}|${n.id}">${esc(n.x)}</textarea></div>`).join("") || '<p class="mut sm">Nenhuma anotação ainda.</p>'}`;
  return e.pat && BV === "pad" ? a + o + vPadroes() : a + o + s;
}
function vPadroes() {
  const e = [
      ["all", "Todos"],
      ["alta", "Alta"],
      ["baixa", "Baixa"],
      ["indec", "Indecisão"],
      ["cont", "Continuação"],
    ],
    t = PATS.filter((a) => PF === "all" || a[2] === PF);
  return (
    `<div class="warn" style="margin:8px 0;border-color:var(--bd)">Padrões clássicos de candlestick (Nison/escola japonesa), com texto próprio. Um padrão só tem valor com <b>contexto</b> (tendência anterior, suporte/resistência, volume) e <b>confirmação</b> no candle seguinte. Use o campo de cada padrão para colocar o que o livro diz, com a página.</div><div class="seg" style="overflow-x:auto">${e.map(([a, o]) => `<button class="${PF === a ? "on" : ""}" data-a="pf" data-id="${a}">${o}</button>`).join("")}</div>` +
    t
      .map(
        ([a, o, s, n, r, i, l]) =>
          `<div class="card"><div class="top" style="align-items:flex-start"><div><b>${o}</b><div class="sm ${PT[s][1]}" style="font-weight:600">${PT[s][0]} · ${n.length} candle${n.length > 1 ? "s" : ""}</div></div>${csvg(n)}</div><div class="sm" style="margin-top:8px"><b>Onde:</b> ${r}</div><div class="sm" style="margin-top:4px"><b>Leitura:</b> ${i}</div><div class="sm" style="margin-top:4px"><b>Confirmação:</b> ${l}</div><textarea data-pn="${a}" style="min-height:44px;margin-top:8px" placeholder="Sua anotação do livro (página, observações)…">${esc((S.pn || {})[a])}</textarea></div>`,
      )
      .join("")
  );
}
const AS = [
  [
    "EURUSD",
    "Euro / Dólar",
    "Forex",
    "fx",
    "EUR",
    "USD",
    1e5,
    1e-4,
    1.1,
    100,
    20,
    "pips",
  ],
  [
    "EURCAD",
    "Euro / Dólar canadense",
    "Forex",
    "fx",
    "EUR",
    "CAD",
    1e5,
    1e-4,
    1.52,
    100,
    20,
    "pips",
  ],
  [
    "USDCAD",
    "Dólar / Dólar canadense",
    "Forex",
    "fx",
    "USD",
    "CAD",
    1e5,
    1e-4,
    1.38,
    100,
    20,
    "pips",
  ],
  [
    "CADUSD",
    "Dólar canadense / Dólar (inverso do USDCAD)",
    "Forex",
    "fx",
    "CAD",
    "USD",
    1e5,
    1e-4,
    0.72,
    100,
    20,
    "pips",
  ],
  [
    "GBPUSD",
    "Libra / Dólar",
    "Forex",
    "fx",
    "GBP",
    "USD",
    1e5,
    1e-4,
    1.3,
    100,
    20,
    "pips",
  ],
  [
    "USDJPY",
    "Dólar / Iene",
    "Forex",
    "fx",
    "USD",
    "JPY",
    1e5,
    0.01,
    150,
    100,
    20,
    "pips",
  ],
  [
    "USDCHF",
    "Dólar / Franco suíço",
    "Forex",
    "fx",
    "USD",
    "CHF",
    1e5,
    1e-4,
    0.9,
    100,
    20,
    "pips",
  ],
  [
    "AUDUSD",
    "Dólar australiano / Dólar",
    "Forex",
    "fx",
    "AUD",
    "USD",
    1e5,
    1e-4,
    0.66,
    100,
    20,
    "pips",
  ],
  [
    "NZDUSD",
    "Dólar neozelandês / Dólar",
    "Forex",
    "fx",
    "NZD",
    "USD",
    1e5,
    1e-4,
    0.6,
    100,
    20,
    "pips",
  ],
  [
    "EURGBP",
    "Euro / Libra",
    "Forex",
    "fx",
    "EUR",
    "GBP",
    1e5,
    1e-4,
    0.85,
    100,
    20,
    "pips",
  ],
  [
    "EURJPY",
    "Euro / Iene",
    "Forex",
    "fx",
    "EUR",
    "JPY",
    1e5,
    0.01,
    165,
    100,
    20,
    "pips",
  ],
  [
    "GBPJPY",
    "Libra / Iene",
    "Forex",
    "fx",
    "GBP",
    "JPY",
    1e5,
    0.01,
    195,
    100,
    20,
    "pips",
  ],
  [
    "EURCHF",
    "Euro / Franco suíço",
    "Forex",
    "fx",
    "EUR",
    "CHF",
    1e5,
    1e-4,
    0.95,
    100,
    20,
    "pips",
  ],
  [
    "AUDJPY",
    "Dólar australiano / Iene",
    "Forex",
    "fx",
    "AUD",
    "JPY",
    1e5,
    0.01,
    99,
    100,
    20,
    "pips",
  ],
  [
    "NIKKEI",
    "Nikkei 225 (JP225)",
    "Índices",
    "cfd",
    "",
    "JPY",
    1,
    1,
    48e3,
    50,
    100,
    "pontos",
  ],
  [
    "NAS100",
    "Nasdaq 100",
    "Índices",
    "cfd",
    "",
    "USD",
    1,
    1,
    25e3,
    50,
    50,
    "pontos",
  ],
  [
    "USTEC",
    "Nasdaq 100 (nome USTEC)",
    "Índices",
    "cfd",
    "",
    "USD",
    1,
    1,
    25e3,
    50,
    50,
    "pontos",
  ],
  [
    "UK100",
    "FTSE 100",
    "Índices",
    "cfd",
    "",
    "GBP",
    1,
    1,
    9700,
    50,
    30,
    "pontos",
  ],
  [
    "RUSSELL2000",
    "Russell 2000 (US2000)",
    "Índices",
    "cfd",
    "",
    "USD",
    1,
    1,
    2400,
    50,
    15,
    "pontos",
  ],
  [
    "HK50",
    "Hang Seng 50",
    "Índices",
    "cfd",
    "",
    "HKD",
    1,
    1,
    26e3,
    50,
    100,
    "pontos",
  ],
  [
    "XAUUSD",
    "Ouro / Dólar",
    "Commodities",
    "cfd",
    "",
    "USD",
    100,
    1,
    4e3,
    100,
    5,
    "US$",
  ],
  [
    "USOIL",
    "Petróleo WTI",
    "Commodities",
    "cfd",
    "",
    "USD",
    1e3,
    1,
    60,
    50,
    0.5,
    "US$",
  ],
  [
    "BTCUSD",
    "Bitcoin / Dólar",
    "Cripto",
    "cfd",
    "",
    "USD",
    1,
    1,
    1e5,
    25,
    500,
    "US$",
  ],
  [
    "ETHUSD",
    "Ethereum / Dólar",
    "Cripto",
    "cfd",
    "",
    "USD",
    1,
    1,
    3500,
    25,
    30,
    "US$",
  ],
];
let AF = "all",
  AXO = {};
const gv = (e, t, a) => {
    const o = (S.ax || {})[e + "." + t];
    return o === void 0 || o === "" ? a : o;
  },
  axg = (e, t) => {
    const a = (S.ax || {})["g." + e];
    return a === void 0 || a === "" ? t : +a;
  },
  aPx = (e) => +gv(e, "px", (AS.find((t) => t[0] === e) || [])[8]);
function rate(e) {
  return e === "USD"
    ? 1
    : ["EUR", "GBP", "AUD", "NZD"].includes(e)
      ? aPx(e + "USD")
      : e === "CAD"
        ? 1 / aPx("USDCAD")
        : e === "JPY"
          ? 1 / aPx("USDJPY")
          : e === "CHF"
            ? 1 / aPx("USDCHF")
            : e === "HKD"
              ? 1 / axg("hkd", 7.8)
              : 1;
}
function ac(e) {
  const [t, , , a, o, s, n, r, i, l, d] = e,
    c = +gv(t, "px", i),
    p = +gv(t, "lev", l) || 1,
    u = +gv(t, "stop", d),
    m = +gv(t, "cs", n),
    f = a === "fx" ? m * rate(o) : m * c * rate(s),
    x = m * r * rate(s);
  return {
    px: c,
    lev: p,
    stop: u,
    cs: m,
    notional: f,
    margin: f / p,
    pv: x,
    risk: u * x,
  };
}
const usd = (e) =>
    "US$ " +
    (+e).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  brl = (e) =>
    "R$ " +
    (+e * axg("brl", 5.4)).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
function vAtivos0() {
  const e = ["all", "Forex", "Índices", "Commodities", "Cripto"],
    t = axg("risco", 100),
    a = AS.filter((s) => AF === "all" || s[2] === AF),
    o = (s, n, r) =>
      `<label>${n}<input type="number" step="any" inputmode="decimal" data-axg="${s}" value="${axg(s, r)}"></label>`;
  return (
    `<p class="mut sm">Margem, risco e valor por <b>1 lote</b>. Cálculo com o tamanho de contrato padrão de corretoras MT5; margem, alavancagem e tamanho do contrato variam por corretora, então confira na sua e ajuste em “Ajustar”. Os preços são só de referência: atualize os que usar.</p>
<div class="card"><div class="g3">${o("risco", "Risco por trade (US$)", 100)}${o("brl", "Dólar (R$)", 5.4)}${o("hkd", "USD/HKD", 7.8)}</div><div class="g2" style="margin-top:8px">${o("cap", "Capital na corretora (US$)", 0)}<div class="mut sm" style="align-self:end">${axg("cap", 0) > 0 ? brl(axg("cap", 0)) + " · risco de " + usd(t) + " = " + f2((t / axg("cap", 0)) * 100) + "% do capital" : "Informe o capital para ver % de risco e lotes máximos."}</div></div></div>
<div class="seg" style="overflow-x:auto">${e.map((s) => `<button class="${AF === s ? "on" : ""}" data-a="af" data-id="${s}">${s === "all" ? "Todos" : s}</button>`).join("")}</div>` +
    a
      .map((s) => {
        const n = ac(s),
          r = s[0],
          i = AXO[r],
          l = (d, c, p) =>
            `<label>${c}<input type="number" step="any" inputmode="decimal" data-ax="${r}.${d}" value="${p}"></label>`;
        return `<div class="card"><div class="top" data-a="axo" data-id="${r}" style="cursor:pointer"><div><b>${r}</b> <span class="mut sm">${esc(s[1])}</span></div><span class="mut sm">${i ? "▲" : "▼ Ajustar"}</span></div>
<div class="kv" style="margin-top:8px"><div class="card"><span class="mut sm">Margem por lote (1:${n.lev})</span><b>${usd(n.margin)}</b><span class="mut sm">${brl(n.margin)}</span></div><div class="card"><span class="mut sm">Risco por lote (${f2(n.stop).replace(",00", "")} ${s[11]})</span><b class="r">${usd(n.risk)}</b><span class="mut sm">${brl(n.risk)}</span></div><div class="card"><span class="mut sm">Valor do lote</span><b>${usd(n.notional)}</b><span class="mut sm">${s[3] === "fx" ? "contrato " + n.cs.toLocaleString("pt-BR") + " " + s[4] : "contrato " + n.cs.toLocaleString("pt-BR") + " × preço"}</span></div><div class="card"><span class="mut sm">Valor de 1 ${s[2] === "Forex" ? "pip" : s[2] === "Índices" ? "ponto" : "US$ de variação"} por lote</span><b>${usd(n.pv)}</b><span class="mut sm">${brl(n.pv)}</span></div></div>
<div class="sm" style="margin-top:8px">Para arriscar <b>${usd(t)}</b>: <b>${n.risk > 0 ? f2(t / n.risk) : "–"} lote(s)</b> · margem ${n.risk > 0 ? usd((t / n.risk) * n.margin) : "–"}</div>${axg("cap", 0) > 0 ? `<div class="sm mut" style="margin-top:4px">Margem de 1 lote = ${f2((n.margin / axg("cap", 0)) * 100)}% do capital · cabem até ${f2(Math.floor((axg("cap", 0) / n.margin) * 100) / 100)} lote(s) pela margem${n.risk > 0 && (t / n.risk) * n.margin > axg("cap", 0) ? ' · <span class="r">⚠ esse trade pede mais margem que o capital</span>' : ""}</div>` : ""}
${i ? `<div class="g2" style="margin-top:6px">${l("px", "Preço atual", n.px)}${l("lev", "Alavancagem (1:x)", n.lev)}${l("stop", "Stop (" + s[11] + ")", n.stop)}${l("cs", "Contrato (unid./lote)", n.cs)}</div>` : ""}</div>`;
      })
      .join("") +
    '<p class="mut sm">Margem = (contrato × preço, em US$) ÷ alavancagem. Risco por lote = stop × valor do pip/ponto. Conversões para US$ usam os preços de EURUSD, GBPUSD, USDJPY, USDCAD etc. desta lista, então mantenha-os atualizados. NAS100 e USTEC são o mesmo índice (o nome muda por corretora). CADUSD não existe em todas as corretoras (é o inverso do USDCAD).</p>'
  );
}
const WL0 =
  "PETR4 PETR3 VALE3 ITUB4 BBDC4 BBAS3 ABEV3 WEGE3 B3SA3 RENT3 SUZB3 GGBR4 CSNA3 USIM5 AXIA3 AXIA6 EQTL3 SBSP3 CMIG4 CPLE3 TAEE11 VIVT3 RADL3 LREN3 MGLU3 BBSE3 BPAC11 SANB11 ITSA4 HAPV3 RDOR3 RAIL3 MOTV3 EMBR3 PRIO3 CSAN3 MBRF3 BEEF3 KLBN11 UGPA3 VBBR3 CYRE3 MRVE3 COGN3 NATU3 ASAI3 TOTS3 MULT3 BOVA11 IVVB11 SMAL11".split(
    " ",
  );
let SC = ls.get("diario-scan") || { ts: 0, d: {} },
  SCF = "alta",
  SCX = null,
  SCB = 0,
  SCM = "",
  SCD = {},
  SCA = null;
const wl = () => (S.wl && S.wl.length ? S.wl : WL0),
  scB3 = (e) => /^[A-Z]{4}\d{1,2}$/.test(e),
  tvLink = (e) =>
    "https://www.tradingview.com/chart/?symbol=" +
    encodeURIComponent(scB3(e) ? "BMFBOVESPA:" + e : e),
  yhLink = (e) =>
    "https://finance.yahoo.com/quote/" +
    encodeURIComponent(scB3(e) ? e + ".SA" : e) +
    "/chart";
async function scFetch(e, t) {
  const a = cfg();
  if (!a) throw new Error("Configure o Supabase na aba Conta.");
  let o;
  try {
    o = await fetch(a.url + "/functions/v1/screener", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: a.key },
      body: JSON.stringify({ symbols: e, detail: !!t }),
    });
  } catch {
    throw new Error(
      'Não consegui falar com a função "screener": confira se ela foi publicada, se a verificação de JWT está desligada e se há internet.',
    );
  }
  if (!o.ok) {
    let s = "";
    try {
      s = (await o.json()).error || "";
    } catch {}
    throw new Error(
      o.status === 401
        ? 'A função exige login: desligue "Verify JWT" nas configurações dela no Supabase.'
        : o.status === 404
          ? 'Função "screener" não encontrada: publique-a no Supabase.'
          : s || "Erro " + o.status,
    );
  }
  return o.json();
}
function scUi() {
  const e = $("#scm");
  e && (e.textContent = SCM);
}
async function scRun(e) {
  if (SCB) return;
  const t = e
    ? Object.values(SC.d)
        .filter((s) => s.ok && s.state !== "neutro")
        .map((s) => s.s)
    : wl();
  if (!t.length) return;
  ((SCB = 1), (SCM = "Buscando… 0/" + t.length), scUi());
  let a = 0,
    o = 0;
  try {
    for (let s = 0; s < t.length; s += 25) {
      const n = t.slice(s, s + 25);
      (((await scFetch(n)).data || []).forEach((r) => {
        ((SC.d[r.s] = r), r.ok || o++);
      }),
        (a += n.length),
        (SCM = "Buscando… " + a + "/" + t.length),
        scUi());
    }
    ((SC.ts = Date.now()),
      ls.set("diario-scan", SC),
      (SCM = "Atualizado às " + hm() + (o ? " · " + o + " sem dados" : "")));
  } catch (s) {
    SCM = "Falha: " + s.message;
  }
  ((SCB = 0), tab === "swing" && VW.S === "sc" && render());
}
async function scDetail(e) {
  try {
    const t = await scFetch([e], !0),
      a = (t.data || [])[0];
    a && a.series ? (SCD[e] = a.series) : (SCD[e] = { err: 1 });
  } catch (t) {
    SCD[e] = { err: 1, msg: t.message };
  }
  tab === "swing" && SCX === e && render();
}
function maChart(e) {
  const t = e.c.length,
    a = [...e.c, ...e.m20, ...e.m50, ...e.m150, ...e.m200].filter(
      (l) => l != null,
    ),
    o = Math.min(...a),
    s = Math.max(...a),
    n = (l) => 92 - ((l - o) / (s - o || 1)) * 84,
    r = (l) => (l / (t - 1)) * 300,
    i = (l, d, c) =>
      `<polyline fill="none" stroke="${d}" stroke-width="${c}" points="${l
        .map((p, u) => (p == null ? null : r(u) + "," + n(p)))
        .filter(Boolean)
        .join(" ")}"/>`;
  return `<svg viewBox="0 0 300 100" style="width:100%;margin-top:8px">${i(e.m200, "#e55d48", 1.4)}${i(e.m150, "#c89e51", 1.4)}${i(e.m50, "#cfaa66", 1.4)}${i(e.m20, "#80a7c9", 1.4)}${i(e.c, "var(--tx)", 1.8)}<circle cx="300" cy="${n(e.c[t - 1])}" r="3" fill="var(--tx)"/></svg><div class="sm mut">Preço · <span style="color:#80a7c9">MM20</span> · <span style="color:#cfaa66">MM50</span> · <span style="color:#c89e51">MM150</span> · <span style="color:#e55d48">MM200</span> · últimos ${t} pregões (o último ponto é o candle de hoje)</div>`;
}
function scPanel(e) {
  const t = SCD[e.s];
  return `<div style="margin-top:10px"><div class="sm mut">MM20 ${f2(e.ma[20])} · MM50 ${f2(e.ma[50])} · MM150 ${f2(e.ma[150])} · MM200 ${f2(e.ma[200])}</div>${t ? (t.err ? `<div class="warn" style="margin-top:8px">Não consegui carregar o gráfico${t.msg ? ": " + esc(t.msg) : ""}.</div>` : maChart(t)) : '<div class="mut sm" style="margin-top:8px">Carregando gráfico…</div>'}<div class="g3" style="margin-top:10px"><a class="btn s" href="${tvLink(e.s)}" target="_blank" rel="noopener noreferrer">TradingView ↗</a><a class="btn s" href="${yhLink(e.s)}" target="_blank" rel="noopener noreferrer">Yahoo ↗</a><button class="btn" data-a="scnew" data-id="${esc(e.s)}">➕ Swing</button></div><div class="mut sm" style="margin-top:6px">O botão ➕ Swing preenche entrada com o preço atual e stop na MM50: ajuste antes de salvar.</div></div>`;
}
function scRow(e) {
  const t = SCX === e.s;
  return `<div class="card"><div class="top" data-a="scx" data-id="${esc(e.s)}" style="cursor:pointer"><div><b>${esc(e.s)}</b> ${e.days <= 3 ? '<span class="chip" style="margin:0 0 0 4px">🆕</span>' : ""}<div class="mut sm">alinhado há ${e.days} pregão(ões) · ${f2(e.dist20)}% da MM20</div></div><div style="text-align:right"><b>${f2(e.px)}</b><div class="sm ${cls(e.chg)}">${e.chg > 0 ? "+" : ""}${f2(e.chg)}%</div></div></div>${t ? scPanel(e) : ""}</div>`;
}
function vScan() {
  if (!window.CLOUD_OK)
    return '<div class="card">O scanner busca cotações pela internet e só funciona no app hospedado (GitHub Pages).</div>';
  const e = Object.values(SC.d),
    t = e.filter((r) => r.ok),
    a = t.filter((r) => r.state === "alta"),
    o = t.filter((r) => r.state === "queda"),
    s = e.length - t.length,
    n = (SCF === "alta" ? a : SCF === "queda" ? o : [...a, ...o]).sort(
      (r, i) => r.days - i.days,
    );
  return `<div class="card"><b>Scanner de tendência</b><p class="mut sm" style="margin:6px 0">🟢 Alta: preço &gt; MM20 &gt; MM50 &gt; MM150 &gt; MM200. 🔴 Queda: o inverso. O candle de hoje usa o último preço disponível (pode ter atraso).</p><div class="g2"><button class="btn" data-a="scrun">${SCB ? "Buscando…" : "🔄 Atualizar"}</button><button class="btn ${SCA ? "" : "s"}" data-a="scauto">${SCA ? "⏸ Auto ligado" : "▶ Auto (90 s)"}</button></div><div class="mut sm" id="scm" style="margin-top:8px">${esc(SCM || (SC.ts ? "Última busca às " + hm(SC.ts) : "Toque em Atualizar para buscar as cotações."))}</div></div><div class="seg">${[
    ["alta", "🟢 Alta (" + a.length + ")"],
    ["queda", "🔴 Queda (" + o.length + ")"],
    ["todos", "Todos"],
  ]
    .map(
      ([r, i]) =>
        `<button class="${SCF === r ? "on" : ""}" data-a="scf" data-id="${r}">${i}</button>`,
    )
    .join(
      "",
    )}</div>${n.length ? n.map(scRow).join("") : `<p class="mut">${SC.ts ? "Nenhum ativo da lista está assim agora." : "Sem resultados ainda."}</p>`}${s ? `<div class="mut sm">${s} ativo(s) sem dados (símbolo inválido ou limite do Yahoo): atualize de novo.</div>` : ""}<h3>Minha lista (${wl().length})</h3><div class="g2" style="grid-template-columns:1fr auto;align-items:end"><label>Adicionar ativos<input id="wla" placeholder="PETR4, VALE3, AAPL…" autocapitalize="characters"></label><button class="btn" data-a="wladd">Adicionar</button></div><div class="chips2" style="margin-top:8px">${wl()
    .map(
      (r) => `<button data-a="wldel" data-id="${esc(r)}">${esc(r)} ✕</button>`,
    )
    .join(
      "",
    )}</div><button class="btn s" style="margin-top:8px" data-a="wlreset">Restaurar lista padrão</button>`;
}
function scNew(e) {
  const t = SC.d[e];
  if (!t || !t.ok) return;
  const a = t.state === "alta",
    o = (s) => +(+s).toFixed(2);
  ((AUTO = 0),
    (isNew = 1),
    (orig = {}),
    (T = {
      tipo: "S",
      id: uid(),
      dt: loc().slice(0, 16),
      side: a ? "C" : "V",
      ativo: e,
      entry: o(t.px),
      stop: o(t.ma[50]),
      target: "",
      qty: 1,
      pv: 1,
      cost: 0,
      emo: "3",
      rules: "s",
      err: "Nenhum",
      mkt: a ? MK[0] : MK[4],
      setup: "Médias alinhadas (" + (a ? "alta" : "queda") + ")",
    }),
    showSheet());
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a]");
  if (!t) return;
  const a = t.dataset.a,
    o = t.dataset.id;
  if (a === "scrun") scRun();
  else if (a === "scauto")
    (SCA
      ? (clearInterval(SCA), (SCA = null))
      : ((SCA = setInterval(() => {
          tab === "swing" && VW.S === "sc" && !document.hidden && scRun(1);
        }, 9e4)),
        scRun(SC.ts ? 1 : 0)),
      render());
  else if (a === "scf") ((SCF = o), render());
  else if (a === "scx")
    ((SCX = SCX === o ? null : o), render(), SCX && !SCD[SCX] && scDetail(SCX));
  else if (a === "wladd") {
    const s = ($("#wla").value || "")
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter((n) => /^[A-Z0-9.\-=^]{1,15}$/.test(n));
    if (!s.length) return;
    ((S.wl = [...new Set([...wl(), ...s])]), save(), render());
  } else
    a === "wldel"
      ? ((S.wl = wl().filter((s) => s !== o)), save(), render())
      : a === "wlreset"
        ? (delete S.wl, save(), render())
        : a === "scnew" && scNew(o);
});
let IM = null;
const fN = (e) => (
    (e = String(e || "").trim()),
    e === "" || e === "-"
      ? null
      : parseFloat(e.replace(/\./g, "").replace(",", "."))
  ),
  fT = (e) => {
    const t = String(e || "").match(
      /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,
    );
    return t ? new Date(+t[3], +t[2] - 1, +t[1], +t[4], +t[5], +t[6]) : null;
  },
  p2 = (e) => String(e).padStart(2, "0"),
  isoD = (e) =>
    e.getFullYear() + "-" + p2(e.getMonth() + 1) + "-" + p2(e.getDate()),
  isoL = (e) => isoD(e) + "T" + p2(e.getHours()) + ":" + p2(e.getMinutes()),
  hs = (e) => {
    let t = 5381;
    for (let a = 0; a < e.length; a++) t = ((t << 5) + t + e.charCodeAt(a)) | 0;
    return (t >>> 0).toString(36);
  },
  FUT = /^(WIN|WDO|IND|DOL)[FGHJKMNQUVXZ]\d{2}$/,
  OPT = /^[A-Z0-9]{4}([A-X])(\d{2,4})[A-Z]?$/;
function impParse(e) {
  const t = e.replace(/\r/g, "").split(`
`);
  if (!(t[1] || "").includes("Ativo") || !(t[1] || "").includes("Lado"))
    throw new Error(
      "Esse arquivo não parece ser o histórico de ordens do Profit.",
    );
  const a = [];
  let o = null;
  for (const s of t.slice(2)) {
    if (!s.trim()) continue;
    const n = s.split(";");
    n[0] !== ""
      ? ((o = {
          a: n[4],
          lado: n[5],
          st: n[6],
          cr: fT(n[7]),
          stop: fN(n[10]),
          tipo: n[22],
          fills: [],
        }),
        a.push(o))
      : o && n[6] === "Trade" && o.fills.push([fT(n[7]), fN(n[12]), fN(n[13])]);
  }
  return a;
}
function impTrips(e) {
  const t = [];
  (e.forEach((s) =>
    s.fills.forEach(([n, r, i]) => {
      n && r != null && i && t.push({ t: n, a: s.a, s: s.lado, p: r, q: i });
    }),
  ),
    t.sort((s, n) => s.t - n.t));
  const a = {},
    o = [];
  t.forEach((s) => {
    var n;
    return (a[(n = s.a)] ?? (a[n] = [])).push(s);
  });
  for (const [s, n] of Object.entries(a)) {
    let r = 0,
      i = null;
    for (const l of n) {
      const d = l.s === "C" ? 1 : -1;
      let c = l.q;
      for (; c > 0; )
        if (r === 0)
          ((i = { a: s, side: l.s, t0: l.t, op: [[l.p, c]], cl: [] }),
            (r = d * c),
            (c = 0));
        else if (r > 0 == d > 0) ((r += d * c), i.op.push([l.p, c]), (c = 0));
        else {
          const p = Math.min(c, Math.abs(r));
          (i.cl.push([l.p, p]),
            (r += d * p),
            (c -= p),
            (i.t1 = l.t),
            r === 0 && (o.push(i), (i = null)));
        }
    }
    i && r !== 0 && ((i.open = 1), o.push(i));
  }
  return o.sort((s, n) => s.t0 - n.t0);
}
const impEp = (e) =>
  sum(e.op.map((t) => t[0] * t[1])) / sum(e.op.map((t) => t[1]));
function impStop(e, t) {
  const a = e.side === "C" ? "V" : "C",
    o = e.open ? new Date() : e.t1 || e.t0,
    s = e.t0.getTime() - 12e4,
    n = o.getTime() + 5e3,
    r = impEp(e),
    i = t
      .filter(
        (l) =>
          l.a === e.a &&
          /^Stop/.test(l.tipo || "") &&
          l.lado === a &&
          l.stop != null &&
          l.cr &&
          l.cr.getTime() >= s &&
          l.cr.getTime() <= n,
      )
      .sort((l, d) => l.cr - d.cr)[0];
  return i && (e.side === "C" ? i.stop < r : i.stop > r) ? i.stop : null;
}
function impKind(e) {
  if (FUT.test(e.a)) return "D";
  if (OPT.test(e.a)) return "O";
  const t = e.t1 || e.t0;
  return isoD(e.t0) === isoD(t) && !e.open ? "D" : "S";
}
function optInfo(e, t) {
  const a = e.match(OPT),
    o = a[1].charCodeAt(0) - 65,
    s = o < 12,
    n = s ? o : o - 12,
    r = a[2],
    i = r.length === 3 ? +r / 10 : r.length === 2 ? +r : +r / 100;
  let l = t.getFullYear();
  n < t.getMonth() && l++;
  const d = new Date(l, n, 1),
    c = new Date(l, n, 1 + ((5 - d.getDay() + 7) % 7) + 14);
  return { ot: s ? "C" : "P", strike: i, venc: isoD(c) };
}
function impDefaults(e, t) {
  const a = { WIN: [], WDO: [] };
  t.forEach((s) => {
    const n = s.a.slice(0, 3),
      r = impStop(s, e);
    a[n] && r != null && a[n].push(Math.abs(r - impEp(s)));
  });
  const o = (s) =>
    s.length ? s.sort((n, r) => n - r)[Math.floor(s.length / 2)] : 0;
  return { win: o(a.WIN) || 100, wdo: o(a.WDO) || 5, opt: 100, cost: 0 };
}
function impBuild() {
  const e = IM.cfg;
  return IM.trs.map((t) => {
    const a = sum(t.op.map((u) => u[1])),
      o = impEp(t),
      s = sum(t.cl.map((u) => u[1])),
      n = !t.open && s ? sum(t.cl.map((u) => u[0] * u[1])) / s : null,
      r = impKind(t),
      i = t.a.slice(0, 3),
      l = i === "WIN" ? 0.2 : i === "WDO" ? 10 : 1;
    let d = impStop(t, IM.orders),
      c = 0;
    if (d == null) {
      c = 1;
      const u = i === "WIN" ? +e.win : i === "WDO" ? +e.wdo : 0;
      d =
        r === "O"
          ? Math.max(0.01, o * (1 - (+e.opt || 100) / 100))
          : u
            ? t.side === "C"
              ? o - u
              : o + u
            : null;
    }
    const p = {
      id: "imp" + hs(t.a + t.side + isoL(t.t0) + a + o.toFixed(4)),
      tipo: r,
      dt: isoL(t.t0),
      dtx: n != null ? isoL(t.t1) : "",
      ativo: t.a,
      side: t.side,
      entry: +o.toFixed(4),
      stop: d == null ? "" : +(+d).toFixed(4),
      exit: n == null ? "" : +n.toFixed(4),
      qty: a,
      pv: l,
      cost: r === "D" ? +(a * (+e.cost || 0)).toFixed(2) : 0,
      rules: "s",
      err: "Nenhum",
      emo: "3",
      mkt: "",
      setup: "Importado do Profit",
      nota:
        (c ? "Stop estimado na importação. " : "") +
        "Custos não vêm no relatório.",
    };
    if (r === "O") {
      const u = optInfo(t.a, t.t0);
      Object.assign(p, u, {
        estr:
          t.side === "C"
            ? u.ot === "C"
              ? ESTR[0]
              : ESTR[1]
            : u.ot === "P"
              ? ESTR[3]
              : "Outra",
      });
    }
    return {
      t: p,
      est: c,
      pl:
        n == null ? null : (n - o) * (t.side === "C" ? 1 : -1) * a * l - p.cost,
    };
  });
}
function impRefresh() {
  IM.rows = impBuild();
  const e = new Map(S.trades.map((t) => [t.id, t]));
  ((IM.dup = new Set()),
    (IM.upd = new Set()),
    IM.rows.forEach((t) => {
      const a = e.get(t.t.id);
      a &&
        (isOpen(a) && t.t.exit !== ""
          ? IM.upd.add(t.t.id)
          : IM.dup.add(t.t.id));
    }));
}
function impLoad(e) {
  const t = impParse(e),
    a = impTrips(t);
  if (!a.length)
    throw new Error("Não encontrei ordens executadas nesse arquivo.");
  ((IM = { orders: t, trs: a, cfg: impDefaults(t, a), off: new Set() }),
    impRefresh());
}
function impPrev() {
  if (IM.err)
    return `<div class="warn" style="margin-top:10px">${esc(IM.err)}</div>`;
  if (IM.msg)
    return `<div class="card g" style="margin-top:10px">${esc(IM.msg)}</div>`;
  if (!IM.rows) return "";
  const e = IM.rows,
    t = e.filter((n) => !IM.dup.has(n.t.id)),
    a = t.filter((n) => !IM.off.has(n.t.id)),
    o = (n) => e.filter((r) => r.t.tipo === n).length,
    s = (n, r) =>
      `<label>${r}<input type="number" step="any" inputmode="decimal" data-imc="${n}" value="${esc(IM.cfg[n])}"></label>`;
  return (
    `<div class="card" style="margin-top:10px"><b>${e.length} operações encontradas</b><div class="mut sm">${o("D")} day trade (WIN/WDO) · ${o("O")} opções · ${o("S")} swing${IM.dup.size ? " · " + IM.dup.size + " já importada(s)" : ""}${IM.upd.size ? " · " + IM.upd.size + " abertas que agora fecham" : ""}</div></div><h3>Stops quando não aparecem no relatório</h3><div class="g2">${s("win", "WIN (pontos)")}${s("wdo", "WDO (pontos)")}${s("opt", "Opções: perda do prêmio (%)")}${s("cost", "Custo por contrato (R$)")}</div><div class="mut sm">Os padrões vêm da mediana dos seus próprios stops no relatório. Sem stop não dá para medir o risco, então esses valores são estimativas: ajuste depois em cada trade.</div><h3>Operações</h3>` +
    e
      .map((n) => {
        const r = n.t,
          i = IM.dup.has(r.id),
          l = IM.off.has(r.id);
        return `<div class="card row" ${i ? "" : `data-a="imptog" data-id="${r.id}"`} style="opacity:${i || l ? 0.45 : 1}"><div style="font-size:20px">${i ? "✔" : l ? "☐" : "☑"}</div><div class="fl"><b>${esc(r.ativo)}</b> · ${r.tipo === "O" ? (r.side === "C" ? "Comprado" : "Lançado") : r.side === "C" ? "Compra" : "Venda"} ${r.qty}<div class="mut sm">${r.dt.slice(8, 10)}/${r.dt.slice(5, 7)} ${r.dt.slice(11)} · ${r.tipo === "D" ? "Day trade" : r.tipo === "O" ? "Opção" : "Swing"} · ${esc(r.entry)} → ${r.exit === "" ? "aberta" : esc(r.exit)}${n.est ? " · stop estimado" : ""}${i ? " · já importada" : ""}${IM.upd.has(r.id) ? " · fecha operação aberta" : ""}</div></div><div class="rt ${cls(n.pl)}">${n.pl == null ? '<span class="mut sm">aberta</span>' : money(n.pl)}</div></div>`;
      })
      .join("") +
    `<button class="btn" style="width:100%;margin-top:12px" data-a="impgo" ${a.length ? "" : "disabled"}>Importar ${a.length} operação(ões)</button>`
  );
}
function vImport() {
  return `<h1>Importar relatório</h1><p class="mut sm">No Profit, exporte o histórico de ordens em CSV e escolha o arquivo aqui. O arquivo é lido no seu aparelho. O app junta as ordens executadas em operações (da entrada até a posição zerar): WIN e WDO viram day trade, opções viram Opções. Operações já importadas não duplicam.</p><label class="btn s" style="color:var(--tx);display:block;text-align:center">📂 Escolher arquivo CSV<input type="file" accept=".csv,text/csv,.txt" hidden id="impf"></label>${IM ? impPrev() : ""}`;
}
(document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.id === "impf" && t.files[0]) {
    try {
      impLoad(
        new TextDecoder("windows-1252").decode(await t.files[0].arrayBuffer()),
      );
    } catch (a) {
      IM = { err: a.message || "Não consegui ler o arquivo." };
    }
    render();
    return;
  }
  t.dataset &&
    t.dataset.imc &&
    IM &&
    IM.cfg &&
    ((IM.cfg[t.dataset.imc] = t.value), impRefresh(), render());
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-a]");
    if (!t) return;
    const a = t.dataset.a,
      o = t.dataset.id;
    if (a === "imptog")
      (IM.off.has(o) ? IM.off.delete(o) : IM.off.add(o), render());
    else if (a === "impgo" && IM && IM.rows) {
      const s = IM.rows.filter(
        (i) => !IM.dup.has(i.t.id) && !IM.off.has(i.t.id),
      );
      let n = 0,
        r = 0;
      (s.forEach((i) => {
        if (IM.upd.has(i.t.id)) {
          const l = S.trades.find((d) => d.id === i.t.id);
          l &&
            ((l.exit = i.t.exit), (l.dtx = i.t.dtx), (l.u = Date.now()), r++);
        } else (S.trades.push({ ...i.t, u: Date.now() }), n++);
      }),
        save(),
        (IM = {
          msg:
            "✅ " +
            n +
            " operação(ões) importada(s)" +
            (r ? " e " + r + " aberta(s) encerrada(s)" : "") +
            ". Veja em Trades (Day trade e Opções).",
        }),
        render());
    }
  }));
const typing = () => {
  const e = document.activeElement;
  return !!(
    e &&
    /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) &&
    e.closest &&
    e.closest("#app")
  );
};
function persistNow() {
  clearTimeout(st);
  const e = LOCAL_SAVE.revision;
  LOCAL_SAVE.pending = !0;
  try {
    if (!db) throw new Error("Armazenamento do aparelho indisponível.");
    const t = JSON.parse(JSON.stringify(S)),
      a = db.transaction("kv", "readwrite");
    (a.objectStore("kv").put(t, "s"),
      (a.oncomplete = () => {
        (e === LOCAL_SAVE.revision &&
          ((LOCAL_SAVE.committed = e),
          (LOCAL_SAVE.pending = !1),
          (LOCAL_SAVE.error = "")),
          svUi());
      }),
      (a.onabort = () => localSaveFailed(a.error, e)),
      (a.onerror = () => localSaveFailed(a.error, e)));
  } catch (t) {
    localSaveFailed(t, e);
  }
  svUi();
}
function localSaveFailed(e, t) {
  if (t !== LOCAL_SAVE.revision) return;
  const a =
      e && e.name === "QuotaExceededError"
        ? "Sem espaço para salvar neste aparelho. Faça um backup e libere espaço."
        : "Não foi possível salvar neste aparelho. Mantenha o app aberto e faça um backup.",
    o = LOCAL_SAVE.error !== a;
  ((LOCAL_SAVE.pending = !1),
    (LOCAL_SAVE.error = a),
    svUi(),
    o && typeof window.toast == "function" && window.toast(a, 8e3));
}
function svUi() {
  const e = $("#svs");
  if (!e) return;
  if (
    (e.setAttribute("role", "status"),
    e.setAttribute("aria-live", "polite"),
    (e.dataset.saveState = LOCAL_SAVE.error
      ? "error"
      : LOCAL_SAVE.pending
        ? "pending"
        : "saved"),
    LOCAL_SAVE.error)
  ) {
    e.textContent = LOCAL_SAVE.error;
    return;
  }
  if (LOCAL_SAVE.pending) {
    e.textContent = "Salvando neste aparelho…";
    return;
  }
  if (!SV) {
    e.textContent = "As alterações são salvas automaticamente.";
    return;
  }
  const t = SESS
    ? (S.st || 0) >= (S.mt || 0)
      ? " · sincronizado na nuvem"
      : /^Falha/.test(SY.msg || "")
        ? " · falha na sincronização; cópia local salva"
        : " · aguardando sincronização"
    : " · só neste aparelho";
  e.textContent = "✓ Salvo neste aparelho às " + hm(SV) + t;
}
const DF = [
    ["plano", "☀️ Plano do dia"],
    ["pre", "Ensaio mental"],
    ["resumo", "🌙 Como foi o dia"],
    ["cond", "Condições dos erros"],
    ["prevn", "Para não repetir"],
    ["bem", "O que fiz bem"],
    ["aprend", "Aprendizado"],
  ],
  dHas = (e) =>
    !!e &&
    (DF.some(([t]) => e[t]) ||
      e.nota ||
      e.energia ||
      e.erros ||
      e.mkt ||
      Object.values(e.chk || {}).some(Boolean)),
  diaSeg = () =>
    `<div class="seg"><button class="${DV === "ed" ? "on" : ""}" data-a="dv" data-id="ed">✍️ Escrever</button><button class="${DV === "hist" ? "on" : ""}" data-a="dv" data-id="hist">📜 Histórico</button></div>`;
function vDiaHist() {
  const e = Object.keys(S.days)
    .filter((t) => dHas(S.days[t]))
    .sort()
    .reverse();
  return (
    `<h1>Meu dia</h1>${diaSeg()}<input id="lq" placeholder="🔍 Buscar nos meus relatórios" value="${esc(LF.q)}" style="margin-bottom:8px">` +
    (e.length
      ? e
          .map((t) => {
            const a = S.days[t],
              o = dayFech(t).map((d) => ({
                ...d.c,
                pl: emBRL(d.c.pl, moedaT(d)),
              })),
              s = sum(o.map((d) => d.pl)),
              n = DF.map(([d]) => a[d] || "")
                .join(" ")
                .trim(),
              r = chkN(a.chk),
              i = DX === t,
              l = new Date(t + "T12:00").toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              });
            return `<div class="card" data-s="${esc((t + " " + l + " " + n).toLowerCase())}"><div class="top" data-a="dhx" data-id="${t}" style="cursor:pointer"><div style="min-width:0"><b>${esc(l)}</b> ${a.energia ? EMO[a.energia - 1] : ""}<div class="mut sm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62vw">${esc(a.resumo || a.plano || a.aprend || "(sem texto)")}</div></div><div class="sm mut" style="text-align:right;white-space:nowrap">${a.nota !== void 0 && a.nota !== "" ? "nota " + esc(a.nota) + " · " : ""}${o.length ? `<span class="${cls(s)}">${money(s)}</span> ·` : ""} ${i ? "▴" : "▾"}</div></div>${
              i
                ? `<div style="margin-top:10px">${DF.filter(([d]) => a[d])
                    .map(
                      ([d, c]) =>
                        `<div class="sm mut" style="margin-top:8px">${c}</div><div style="white-space:pre-wrap">${esc(a[d])}</div>`,
                    )
                    .join(
                      "",
                    )}${a.erros ? `<div class="sm mut" style="margin-top:8px">Cometi erro?</div><div>${a.erros === "s" ? "Sim" : "Não"}</div>` : ""}${r ? `<div class="sm mut" style="margin-top:8px">Checklist</div><div>${r}/${S.rules.length} regras marcadas</div>` : ""}<button class="btn s" style="margin-top:12px" data-a="dedit" data-id="${t}">✏️ Editar este dia</button></div>`
                : ""
            }</div>`;
          })
          .join("")
      : '<p class="mut">Nenhum dia registrado ainda. Escreva o primeiro na aba Escrever.</p>')
  );
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-a]");
  if (!t) return;
  const a = t.dataset.a,
    o = t.dataset.id;
  if (a === "dv") ((DV = o), render(), scrollTo(0, 0));
  else if (a === "dhx") ((DX = DX === o ? null : o), render());
  else if (a === "dedit") ((D = o), (DV = "ed"), render(), scrollTo(0, 0));
  else if (a === "dprev" || a === "dnext") {
    const s = new Date(D + "T12:00");
    s.setDate(s.getDate() + (a === "dnext" ? 1 : -1));
    const n = isoD(s);
    if (n > loc().slice(0, 10)) return;
    ((D = n), render(), scrollTo(0, 0));
  } else
    a === "dtoday"
      ? ((D = loc().slice(0, 10)), render(), scrollTo(0, 0))
      : a === "dsave" &&
        (clearTimeout(st),
        await idb("kv", "put", S, "s"),
        (SV = Date.now()),
        svUi(),
        SESS && sync(1));
});
let AV = "at",
  OD = {
    s: "EURUSD",
    side: "C",
    entry: "",
    stop: "",
    target: "",
    lots: "",
    nota: "",
  },
  OC = {},
  LD = { d: "", s: "", v: "", n: "" },
  AOF = "all",
  APF = "all",
  OX = null;
const unionU = (e, t, a) => {
    const o = new Map();
    return (
      [...(e || []), ...(t || [])].forEach((s) => {
        const n = o.get(s.id);
        (!n || (s.u || 0) >= (n.u || 0)) && o.set(s.id, s);
      }),
      [...o.values()].filter((s) => !(a[s.id] && a[s.id] >= (s.u || 0)))
    );
  },
  asOf = (e) => AS.find((t) => t[0] === e),
  csvQ = (e) => '"' + String(e ?? "").replace(/"/g, '""') + '"',
  cN = (e) =>
    e == null || !isFinite(e) ? "" : (+e).toFixed(2).replace(".", ","),
  apIn = (e) => noPeriodo(e, APF, loc().slice(0, 10));
var barChartU;
function opCalc(e) {
  const t = asOf(e.s);
  if (!t) return null;
  const a = ac(t),
    o = +e.entry,
    s = +e.stop,
    n = +e.target,
    r = e.side === "C" ? 1 : -1;
  if (!(o && s)) return { a: t, c: a, need: 1 };
  const i = Math.abs(o - s) / t[7],
    l = i * a.pv,
    d =
      +e.lots > 0
        ? +e.lots
        : l > 0
          ? Math.floor((axg("risco", 100) / l) * 100 + 1e-9) / 100
          : 0,
    c = n ? Math.abs(n - o) / t[7] : null;
  return {
    a: t,
    c: a,
    sp: i,
    risk1: l,
    lots: d,
    risk: d * l,
    gain: c != null ? d * c * a.pv : null,
    rr: c != null && i > 0 ? c / i : null,
    margin: d * a.margin,
    wrong: (o - s) * r <= 0,
    wrongT: !!n && (n - o) * r <= 0,
  };
}
function opRes(e, t, a) {
  const o = asOf(e.s),
    s = ac(o);
  return (
    (((+t - +e.entry) * (e.side === "C" ? 1 : -1)) / o[7]) * s.pv * +e.lots -
    (+a || 0)
  );
}
function opPrev() {
  const e = $("#opv");
  if (!e) return;
  const t = opCalc(OD);
  if (!t || t.need) {
    e.innerHTML =
      '<span class="mut sm">Informe entrada e stop para ver risco, lotes e ganho/risco.</span>';
    return;
  }
  const a = t.a[11],
    o = axg("cap", 0);
  e.innerHTML = `${t.wrong ? '<div class="warn" style="margin-bottom:6px">⚠ O stop está do lado errado da entrada.</div>' : ""}${t.wrongT ? '<div class="warn" style="margin-bottom:6px">⚠ O alvo está do lado errado da entrada.</div>' : ""}<div class="kv">${KV("Stop", f2(t.sp) + " " + a, "", usd(t.risk1) + " por lote")}${KV("Lotes", f2(t.lots), "", +OD.lots > 0 ? "informado" : "sugerido p/ risco de " + usd(axg("risco", 100)))}${KV("Risco total", usd(t.risk), "r", o > 0 ? f2((t.risk / o) * 100) + "% do capital" : "")}${KV("Ganho no alvo", t.gain == null ? "–" : usd(t.gain), "g", t.rr == null ? "informe o alvo" : "ganho/risco " + f2(t.rr) + " para 1")}</div><div class="mut sm" style="margin-top:6px">Margem: ${usd(t.margin)}${o > 0 && t.margin > o ? ' <span class="r">⚠ maior que o capital</span>' : ""}</div>`;
}
function opPanel(e) {
  const t = (n, r, i = "s") =>
      `<button class="btn ${i}" data-a="${n}" data-id="${e.id}">${r}</button>`,
    a = OC.id === e.id,
    o = (n, r) =>
      `<label>${r}<input type="number" step="any" inputmode="decimal" data-oc="${n}" value="${esc(a ? OC[n] : "")}"></label>`;
  let s =
    '<div style="margin-top:10px">' +
    (e.nota
      ? `<div class="sm mut" style="white-space:pre-wrap">${esc(e.nota)}</div>`
      : "");
  return (
    e.st === "open"
      ? (s += `<div class="g3" style="margin-top:8px">${o("exit", "Saída (preço)")}${o("res", "Resultado US$ (opc.)")}${o("cost", "Custos US$")}</div><label>Data e hora da saída<input type="datetime-local" data-oc="dtx" value="${esc(a && OC.dtx ? OC.dtx : loc().slice(0, 16))}"></label><div class="mut sm" id="ocv" style="margin-top:6px">Informe o preço de saída (o resultado sai do valor do pip) ou o resultado direto.</div><div class="g2" style="margin-top:8px">${t("opfin", "✅ Encerrar", "")}${t("opdel", "🗑 Excluir")}</div>`)
      : e.st === "plan"
        ? (s += `<div class="g3" style="margin-top:8px">${t("opgo", "▶ Entrei", "")}${t("opedit", "✏️ Editar")}${t("opdel", "🗑 Excluir")}</div>`)
        : (s += `<div class="sm" style="margin-top:6px">${e.x !== "" && e.x != null ? "Saída " + esc(e.x) + " · " : ""}custos ${usd(e.cost || 0)}</div><div class="g3" style="margin-top:8px">${t("opre", "↩ Reabrir")}${t("opedit", "✏️ Editar")}${t("opdel", "🗑 Excluir")}</div>`),
    s + "</div>"
  );
}
function opCard(e) {
  const t = asOf(e.s) || [, , , , , , , 1],
    a =
      numN(e.entry) != null && numN(e.stop) != null
        ? Math.abs(numN(e.entry) - numN(e.stop)) / t[7]
        : null,
    o =
      numN(e.target) != null && numN(e.entry) != null
        ? Math.abs(numN(e.target) - numN(e.entry)) / t[7]
        : null,
    s = o && a ? o / a : null,
    n = e.st === "closed" && e.rk > 0 ? e.res / e.rk : null,
    r = {
      plan: "📝 Planejada",
      open: "▶ Em andamento",
      closed: "✅ Encerrada",
    }[e.st];
  return `<div class="card"><div class="top" data-a="opx" data-id="${e.id}" style="cursor:pointer"><div><b>${esc(e.s)}</b> · ${e.side === "C" ? "Compra" : "Venda"} ${f2(e.lots)} lote(s)<div class="mut sm">${r}${opDataTxt(e)} · entrada ${esc(e.entry)} · stop ${esc(e.stop)}${e.target ? " · alvo " + esc(e.target) : ""}${s ? " · ganho/risco " + f2(s) + " para 1" : ""}</div></div><div class="rt ${e.st === "closed" ? cls(e.res) : ""}">${e.st === "closed" ? usd(e.res) : '<span class="mut sm">' + usd(e.rk || 0) + " em risco</span>"}</div></div>${OX === e.id ? opPanel(e) : ""}</div>`;
}
function vOps() {
  const e = S.ops || [],
    t = !!OD.id,
    a = asOf(OD.s),
    o = a ? ac(a).px : "",
    s = e
      .filter((r) => AOF === "all" || r.st === AOF)
      .sort((r, i) => (opQuando(i) || "").localeCompare(opQuando(r) || "")),
    n = (r, i, l) =>
      `<label>${i}<input type="number" step="any" inputmode="decimal" data-od="${r}" value="${esc(OD[r])}" placeholder="${esc(l || "")}"></label>`;
  return `<div class="card"><b>${t ? "Editar operação" : "Montar operação"}</b><label>Ativo<select data-od="s">${AS.map((r) => `<option value="${r[0]}"${OD.s === r[0] ? " selected" : ""}>${r[0]} · ${esc(r[1])}</option>`).join("")}</select></label><label>Lado</label><div class="chips2"><button class="${OD.side === "C" ? "on g" : ""}" data-a="odside" data-id="C">Compra</button><button class="${OD.side === "V" ? "on r" : ""}" data-a="odside" data-id="V">Venda</button></div><div class="g3">${n("entry", "Entrada", o)}${n("stop", "Stop")}${n("target", "Alvo")}</div><div class="g2">${n("lots", "Lotes (vazio = pelo risco)", "auto")}<label>Anotação<input data-od="nota" value="${esc(OD.nota)}"></label></div>${opFormDatas()}<div id="opv" style="margin-top:10px"></div><button class="btn" style="width:100%;margin-top:10px" data-a="opadd">${t ? "💾 Salvar alterações" : "➕ Adicionar à lista"}</button>${t ? '<button class="btn s" style="width:100%;margin-top:6px" data-a="opcancel">Cancelar edição</button>' : ""}</div>
<div class="chips2" style="margin-top:8px">${[
    ["all", "Todas"],
    ["plan", "Planejadas"],
    ["open", "Em andamento"],
    ["closed", "Encerradas"],
  ]
    .map(
      ([r, i]) =>
        `<button class="${AOF === r ? "on" : ""}" data-a="opf" data-id="${r}">${i}</button>`,
    )
    .join(
      "",
    )}</div>${s.length ? opLista(s) : '<p class="mut">Nenhuma operação nesta lista. Monte a primeira acima.</p>'}`;
}
function lcItems() {
  const e = [];
  return (
    (S.ops || [])
      .filter((t) => t.st === "closed")
      .forEach((t) =>
        e.push({
          id: t.id,
          d: (t.dtx || t.dt || "").slice(0, 10),
          s: t.s,
          v: +t.res,
          n: "Operação " + (t.side === "C" ? "de compra" : "de venda"),
          op: 1,
          rk: t.rk,
        }),
      ),
    (S.lanc || []).forEach((t) =>
      e.push({ id: t.id, d: t.d, s: t.s, v: +t.v, n: t.n || "", op: 0 }),
    ),
    e.sort((t, a) => t.d.localeCompare(a.d))
  );
}
function vLucros() {
  const e = lcItems(),
    t = loc().slice(0, 10),
    a = diasMais(t, -6),
    o = t.slice(0, 7),
    s = (f) => sum(e.filter(f).map((x) => x.v)),
    n = axg("cap", 0),
    r = s(() => 1),
    i = s((f) => f.d === t),
    l = {};
  e.forEach((f) => (l[f.d] = (l[f.d] || 0) + f.v));
  const d = Object.keys(l).sort();
  let c = 0;
  const p = d.map((f) => (c += l[f])),
    u = (f) => f.slice(8) + "/" + f.slice(5, 7),
    m = d.slice(-20);
  return `<div class="kv">${KV("Hoje", usd(i), cls(i), brl(i))}${KV("Últimos 7 dias", usd(s((f) => f.d >= a)), cls(s((f) => f.d >= a)), brl(s((f) => f.d >= a)))}${KV("Este mês", usd(s((f) => f.d.slice(0, 7) === o)), cls(s((f) => f.d.slice(0, 7) === o)), brl(s((f) => f.d.slice(0, 7) === o)))}${KV("Total", usd(r), cls(r), n > 0 ? f2((r / n) * 100) + "% do capital" : brl(r))}</div>
${
  d.length > 1
    ? `<h2>Evolução</h2>${lineChart("lcum", p, d.map(u), (f) => usd(f))}<h2>Resultado por dia</h2>${barChartU(
        "ldia",
        m.map((f) => l[f]),
        m.map(u),
      )}`
    : ""
}
<div class="card" style="margin-top:12px"><b>Registrar lucro ou prejuízo</b><div class="g2"><label>Data<input type="date" data-lf="d" value="${esc(LD.d || t)}"></label><label>Valor (US$, negativo = prejuízo)<input type="number" step="any" inputmode="decimal" data-lf="v" value="${esc(LD.v)}"></label></div><div class="g2"><label>Ativo (opcional)<select data-lf="s"><option value="">–</option>${AS.map((f) => `<option value="${f[0]}"${LD.s === f[0] ? " selected" : ""}>${f[0]}</option>`).join("")}</select></label><label>Anotação<input data-lf="n" value="${esc(LD.n)}"></label></div><button class="btn" style="width:100%;margin-top:10px" data-a="lcadd">➕ Adicionar</button><div class="mut sm" style="margin-top:6px">Operações encerradas na aba Operações entram aqui sozinhas.</div></div>
<h3>Lançamentos</h3>${
    e.length
      ? [...e]
          .reverse()
          .slice(0, 80)
          .map(
            (f) =>
              `<div class="card g2" style="grid-template-columns:1fr auto;align-items:center"><div><b>${f.d.slice(8)}/${f.d.slice(5, 7)}/${f.d.slice(2, 4)}</b> ${f.s ? "· " + esc(f.s) : ""}<div class="mut sm">${esc(f.n)}${f.op ? " · da aba Operações" : ""}</div></div><div style="text-align:right"><b class="${cls(f.v)}">${usd(f.v)}</b>${f.op ? "" : `<button class="x" data-a="lcdel" data-id="${f.id}">✕</button>`}</div></div>`,
          )
          .join("")
      : '<p class="mut">Nenhum lançamento ainda.</p>'
  }`;
}
function pfRows() {
  const e = {};
  return (
    lcItems()
      .filter((t) => apIn(t.d))
      .forEach((t) => {
        var a;
        return (e[(a = t.s || "(sem ativo)")] ?? (e[a] = [])).push(t);
      }),
    Object.entries(e)
      .map(([t, a]) => {
        const o = a.map((i) => i.v),
          s = o.filter((i) => i > 0),
          n = o.filter((i) => i < 0),
          r = a.filter((i) => i.op && i.rk > 0).map((i) => i.v / i.rk);
        return {
          s: t,
          n: a.length,
          win: s.length / a.length,
          tot: sum(o),
          avg: avg(o),
          gw: sum(s),
          gl: sum(n),
          R: r.length ? avg(r) : null,
          best: Math.max(...o),
          worst: Math.min(...o),
        };
      })
      .sort((t, a) => a.tot - t.tot)
  );
}
function pfAll(e) {
  const t = sum(e.map((r) => r.n)),
    a = sum(e.map((r) => r.gw)),
    o = sum(e.map((r) => r.gl)),
    s = e.reduce((r, i) => r + Math.round(i.win * i.n), 0),
    n = lcItems().filter((r) => apIn(r.d) && r.v < 0).length;
  return {
    n: t,
    tot: sum(e.map((r) => r.tot)),
    gw: a,
    gl: o,
    win: t ? s / t : 0,
    pf: o < 0 ? a / -o : null,
    payoff: s && n && o < 0 ? a / s / (-o / n) : null,
    best: e.length ? Math.max(...e.map((r) => r.best)) : 0,
    worst: e.length ? Math.min(...e.map((r) => r.worst)) : 0,
  };
}
function vPerf() {
  const e = pfRows(),
    t = pfAll(e);
  return (
    `<div class="chips2">${[
      ["all", "Tudo"],
      ["hoje", "Hoje"],
      ["7", "7 dias"],
      ["30", "30 dias"],
      ["mes", "Este mês"],
    ]
      .map(
        ([a, o]) =>
          `<button class="${APF === a ? "on" : ""}" data-a="apf" data-id="${a}">${o}</button>`,
      )
      .join("")}</div>` +
    (e.length
      ? `<div class="kv" style="margin-top:8px">${KV("Resultado", usd(t.tot), cls(t.tot), t.n + " lançamento(s)/operação(ões)")}${KV("Acerto", pc(t.win))}${KV("Fator de lucro", t.pf == null ? "–" : f2(t.pf), "", "ganhos ÷ perdas")}${KV("Payoff", t.payoff == null ? "–" : f2(t.payoff), "", "ganho médio ÷ perda média")}${KV("Melhor", usd(t.best), "g")}${KV("Pior", usd(t.worst), "r")}</div><h2>Resultado por ativo</h2>${barChartU(
          "pfa",
          e.map((a) => a.tot),
          e.map((a) => a.s),
        )}<div class="card"><table><tr><th>Ativo</th><th>Nº</th><th>Acerto</th><th>Resultado</th><th>Média</th></tr>${e.map((a) => `<tr><td>${esc(a.s)}</td><td>${a.n}</td><td>${pc(a.win)}</td><td class="${cls(a.tot)}">${usd(a.tot)}</td><td class="${cls(a.avg)}">${usd(a.avg)}</td></tr>`).join("")}</table></div>`
      : '<p class="mut" style="margin-top:10px">Sem resultados neste período. Encerre operações ou registre lucros para ver a performance.</p>') +
    '<h3>Exportar</h3><div class="g2"><button class="btn" data-a="pfexp">⬇️ Performance por ativo</button><button class="btn s" data-a="opexp">⬇️ Todas as operações</button></div><div class="mut sm" style="margin-top:6px">Arquivos CSV (separador ponto e vírgula, vírgula decimal) que abrem direto no Excel em português. Respeitam o período escolhido acima.</div>'
  );
}
async function pfExport(e) {
  const t = new Date(),
    a = isoD(t);
  if (e === "pf") {
    const o = pfRows(),
      s = pfAll(o),
      n = [
        "ativo",
        "operacoes",
        "acerto_pct",
        "resultado_usd",
        "media_usd",
        "ganhos_usd",
        "perdas_usd",
        "R_medio",
        "melhor_usd",
        "pior_usd",
      ],
      r = o.map((i) =>
        [
          i.s,
          i.n,
          cN(i.win * 100),
          cN(i.tot),
          cN(i.avg),
          cN(i.gw),
          cN(i.gl),
          cN(i.R),
          cN(i.best),
          cN(i.worst),
        ]
          .map(csvQ)
          .join(";"),
      );
    (r.push(
      [
        "TOTAL",
        s.n,
        cN(s.win * 100),
        cN(s.tot),
        "",
        cN(s.gw),
        cN(s.gl),
        "",
        cN(s.best),
        cN(s.worst),
      ]
        .map(csvQ)
        .join(";"),
    ),
      await saveFile(
        "performance-ativos-" + a + ".csv",
        "\uFEFF" +
          n.join(";") +
          `
` +
          r.join(`
`),
      ));
  } else {
    const o = [
        "tipo",
        "data",
        "ativo",
        "lado",
        "entrada",
        "stop",
        "alvo",
        "lotes",
        "saida",
        "resultado_usd",
        "risco_usd",
        "R",
        "status",
        "anotacao",
      ],
      s = [];
    ((S.ops || [])
      .filter((n) => apIn((n.dtx || n.dt || "").slice(0, 10)))
      .forEach((n) =>
        s.push(
          [
            "Operação",
            (n.dtx || n.dt || "").slice(0, 10),
            n.s,
            n.side === "C" ? "Compra" : "Venda",
            n.entry,
            n.stop,
            n.target,
            n.lots,
            n.x,
            n.st === "closed" ? cN(n.res) : "",
            cN(n.rk),
            n.st === "closed" && n.rk > 0 ? cN(n.res / n.rk) : "",
            { plan: "Planejada", open: "Em andamento", closed: "Encerrada" }[
              n.st
            ],
            n.nota,
          ]
            .map(csvQ)
            .join(";"),
        ),
      ),
      (S.lanc || [])
        .filter((n) => apIn(n.d))
        .forEach((n) =>
          s.push(
            [
              "Lançamento",
              n.d,
              n.s,
              "",
              "",
              "",
              "",
              "",
              "",
              cN(n.v),
              "",
              "",
              "",
              n.n,
            ]
              .map(csvQ)
              .join(";"),
          ),
        ),
      await saveFile(
        "operacoes-ativos-" + a + ".csv",
        "\uFEFF" +
          o.join(";") +
          `
` +
          s.join(`
`),
      ));
  }
}
function vAtivos() {
  return (
    `<h1>Forex</h1><div class="seg">${[
      ["at", "Ativos"],
      ["op", "Operações"],
      ["lu", "Lucros"],
      ["pf", "Performance"],
    ]
      .map(
        ([e, t]) =>
          `<button class="${AV === e ? "on" : ""}" data-a="avv" data-id="${e}">${t}</button>`,
      )
      .join("")}</div>` +
    (AV === "op"
      ? vOps()
      : AV === "lu"
        ? vLucros()
        : AV === "pf"
          ? vPerf()
          : vAtivos0())
  );
}
(document.addEventListener("input", (e) => {
  const t = e.target,
    a = t.dataset || {};
  if (a.od !== void 0) ((OD[a.od] = t.value), opPrev());
  else if (a.lf !== void 0) LD[a.lf] = t.value;
  else if (a.oc !== void 0) {
    OC[a.oc] = t.value;
    const o = (S.ops || []).find((n) => n.id === OC.id),
      s = $("#ocv");
    if (o && s) {
      const n = OC.exit,
        r = OC.res;
      s.textContent =
        r !== void 0 && r !== ""
          ? "Resultado informado: " + usd(+r)
          : n !== void 0 && n !== ""
            ? "Resultado estimado: " + usd(opRes(o, n, OC.cost))
            : "Informe o preço de saída ou o resultado.";
    }
  }
}),
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-a]");
    if (!t) return;
    const a = t.dataset.a,
      o = t.dataset.id,
      s = () => (S.ops || []).find((r) => r.id === o),
      n = (r) => {
        const i = $("#opv");
        i && (i.innerHTML = '<div class="warn">' + r + "</div>");
      };
    if (a === "avv") ((AV = o), render());
    else if (a === "odside") ((OD.side = o), render());
    else if (a === "opf") ((AOF = o), render());
    else if (a === "opx")
      ((OX = OX === o ? null : o), (OC = { id: o }), render());
    else if (a === "opcancel")
      ((OD = {
        s: OD.s,
        side: OD.side,
        entry: "",
        stop: "",
        target: "",
        lots: "",
        nota: "",
      }),
        render());
    else if (a === "opadd") {
      const r = opCalc(OD);
      if (!r || r.need || r.wrong || !(r.lots > 0)) {
        n(
          "Informe entrada e stop do lado certo (e lotes, se o stop for largo demais para o risco definido).",
        );
        return;
      }
      const i = {
        s: OD.s,
        side: OD.side,
        entry: OD.entry,
        stop: OD.stop,
        target: OD.target || "",
        lots: r.lots,
        rk: +r.risk.toFixed(2),
        nota: OD.nota || "",
        u: Date.now(),
      };
      if (OD.id) {
        const l = (S.ops || []).find((d) => d.id === OD.id);
        l &&
          (Object.assign(l, i),
          OD.dt && (l.dt = String(OD.dt).slice(0, 16)),
          OD.dtx && l.st === "closed" && (l.dtx = String(OD.dtx).slice(0, 16)));
      } else {
        const l = opNova(i);
        if (!l) return;
        (S.ops ?? (S.ops = [])).push(l);
      }
      ((OD = {
        s: OD.s,
        side: OD.side,
        entry: "",
        stop: "",
        target: "",
        lots: "",
        nota: "",
      }),
        save(),
        render());
    } else if (a === "opedit") {
      const r = s();
      if (!r) return;
      ((OD = {
        id: r.id,
        s: r.s,
        side: r.side,
        entry: r.entry,
        stop: r.stop,
        target: r.target,
        lots: r.lots,
        nota: r.nota,
        dt: r.dt || "",
        dtx: (r.st === "closed" && r.dtx) || "",
      }),
        render(),
        scrollTo(0, 0));
    } else if (a === "opgo") {
      const r = s();
      r && ((r.st = "open"), (r.u = Date.now()), save(), render());
    } else if (a === "opfin") {
      const r = s();
      if (!r || OC.id !== o) return;
      const i = OC.res,
        l = OC.exit;
      let d;
      if (i !== void 0 && i !== "" && isFinite(+i)) d = +i;
      else if (l !== void 0 && l !== "" && isFinite(+l))
        d = opRes(r, l, OC.cost);
      else {
        const c = $("#ocv");
        c &&
          (c.innerHTML =
            '<span class="r">Informe o preço de saída ou o resultado.</span>');
        return;
      }
      (Object.assign(r, {
        st: "closed",
        x: l === void 0 ? "" : l,
        cost: +OC.cost || 0,
        res: +d.toFixed(2),
        dtx: String(OC.dtx || loc().slice(0, 16)).slice(0, 16),
        u: Date.now(),
      }),
        (OC = {}),
        (OX = null),
        save(),
        render());
    } else if (a === "opre") {
      const r = s();
      r && ((r.st = "open"), (r.u = Date.now()), save(), render());
    } else if (a === "opdel")
      ((S.ops = (S.ops || []).filter((r) => r.id !== o)),
        ((S.del ?? (S.del = {}))[o] = Date.now()),
        (OX = null),
        save(),
        render());
    else if (a === "lcadd") {
      const r = +LD.v;
      if (!isFinite(r) || LD.v === "" || r === 0) return;
      ((S.lanc ?? (S.lanc = [])).push({
        id: uid(),
        d: LD.d || loc().slice(0, 10),
        s: LD.s || "",
        v: r,
        n: LD.n || "",
        u: Date.now(),
      }),
        (LD = { d: LD.d, s: "", v: "", n: "" }),
        save(),
        render());
    } else
      a === "lcdel"
        ? ((S.lanc = (S.lanc || []).filter((r) => r.id !== o)),
          ((S.del ?? (S.del = {}))[o] = Date.now()),
          save(),
          render())
        : a === "apf"
          ? ((APF = o), render())
          : a === "pfexp"
            ? pfExport("pf")
            : a === "opexp" && pfExport("op");
  }),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-a]");
    if (!t) return;
    const a = t.dataset.a,
      o = t.dataset.id,
      s = () =>
        S.books.find(
          (n) => n.id === (a === "addnote" || a === "delnote" ? o : BID),
        );
    if (a === "openbook")
      ((BID = o),
        (BV = (S.books.find((n) => n.id === o) || {}).pat ? "pad" : "not"),
        (tab = "livro"),
        render(),
        scrollTo(0, 0));
    else if (a === "addbook") {
      const n = $("#bt").value.trim();
      if (!n) return;
      (S.books.unshift({
        id: uid(),
        t: n,
        a: $("#ba").value.trim(),
        st: "lendo",
        notes: [],
        u: Date.now(),
      }),
        save(),
        render());
    } else if (a === "delbook") {
      if (!confirm("Excluir este livro e todas as anotações?")) return;
      ((S.books = S.books.filter((n) => n.id !== o)),
        ((S.del ?? (S.del = {}))[o] = Date.now()),
        save(),
        (tab = "estudos"),
        render(),
        scrollTo(0, 0));
    } else if (a === "bv") ((BV = o), render());
    else if (a === "pf") ((PF = o), render());
    else if (a === "addnote") {
      const n = $("#nx").value.trim(),
        r = $("#nt").value.trim();
      if (!n && !r) return;
      const i = s();
      ((i.notes ?? (i.notes = [])).push({
        id: uid(),
        t: r,
        p: $("#np").value.trim(),
        x: n,
        u: Date.now(),
      }),
        (i.u = Date.now()),
        save(),
        render());
    } else if (a === "delnote") {
      const n = s();
      ((n.notes = n.notes.filter((r) => r.id !== t.dataset.n)),
        (n.u = Date.now()),
        save(),
        render());
    } else
      a === "af"
        ? ((AF = o), render())
        : a === "axo" && ((AXO[o] = !AXO[o]), render());
  }),
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.pn) (((S.pn ?? (S.pn = {}))[t.dataset.pn] = t.value), save());
    else if (t.dataset.nb) {
      const [a, o] = t.dataset.nb.split("|"),
        s = S.books.find((r) => r.id === a),
        n = s && s.notes.find((r) => r.id === o);
      n && ((n.x = t.value), (n.u = Date.now()), (s.u = Date.now()), save());
    } else if (t.dataset.bs) {
      const a = S.books.find((o) => o.id === t.dataset.bs);
      a && ((a.st = t.value), (a.u = Date.now()), save());
    }
  }),
  document.addEventListener("change", (e) => {
    const t = e.target;
    (t.dataset.ax || t.dataset.axg) &&
      (((S.ax ?? (S.ax = {}))[t.dataset.ax || "g." + t.dataset.axg] = t.value),
      save(),
      render());
  }));
function vContratos() {
  const e = (u, m) => +gv("ct", u, m),
    t = e("cap", 1e4),
    a = e("pct", 2),
    o = e("vf", 20),
    s = e("nd", 3),
    n = e("ns", 2),
    r = e("nm", 2),
    i = (t * a) / 100,
    l = (u) =>
      "R$ " +
      (+u).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    d = (u, m, f) =>
      `<label>${m}<input type="number" step="any" inputmode="decimal" data-ax="ct.${u}" value="${f}"></label>`,
    c = [
      ["sp", "SP-500", 6e3, 0.44, 50],
      ["nq", "NASDAQ", 21e3, 0.6, 20],
      ["cl", "OIL - CL", 69, 2.7, 1e3],
      ["wdo", "WDOFUT", 5260, 1, 10],
      ["win", "WINFUT", 197e3, 1, 0.2],
      ["ac", "AÇÕES", 30, 5, 1],
    ],
    p = [
      ["Risco por trade", i],
      ["Perda máx. no dia", i * s],
      ["Perda máx. na semana", i * s * n],
      ["Perda máx. no mês", i * s * n * r],
      ["Stop pânico (2× o trade)", i * 2],
    ];
  return (
    `<h1>Contratos</h1><p class="mut sm">Quantos contratos cabem no seu risco: stop pela volatilidade (% da vol. do ativo) × valor do ponto. Preço e volatilidade são de referência: atualize antes do pregão.</p>
<div class="card"><div class="g2">${d("cap", "Capital (R$)", t)}${d("pct", "Risco por trade (% do capital)", a)}</div><div class="g2">${d("vf", "% da volatilidade como stop", o)}${d("nd", "Máx. de stops no dia", s)}</div><div class="g2">${d("ns", "Máx. dias de perda na semana", n)}${d("nm", "Máx. semanas de perda no mês", r)}</div></div>
<div class="kv">${p.map(([u, m]) => `<div class="card"><span class="mut sm">${u}</span><b${u.startsWith("Stop") ? ' class="r"' : ""}>${l(m)}</b></div>`).join("")}</div>` +
    c
      .map(([u, m, f, x, v]) => {
        const g = e(u + ".px", f),
          h = e(u + ".vol", x),
          b = e(u + ".mult", v),
          y = e(u + ".stop", 0),
          j = (g * h) / 100,
          k = (j * o) / 100,
          A = y > 0 ? y : k,
          C = A * b,
          I = C > 0 ? Math.floor(i / C) : 0,
          J = I * C;
        return `<div class="card"><div class="top"><b>${m}</b><span class="rt ${I > 0 ? "g" : "r"}">${I} ${u === "ac" ? "ações" : "contrato" + (I === 1 ? "" : "s")}</span></div>
<div class="sm mut" style="margin-top:6px">Vol. em pontos ${f2(j)} · stop ${f2(A)}${y > 0 ? " (manual)" : ""} · risco por contrato <b>${l(C)}</b></div>${I > 0 ? `<div class="sm" style="margin-top:4px">Risco real <b>${l(J)}</b> (${f2(t > 0 ? (J / t) * 100 : 0)}% do capital)</div>` : `<div class="warn" style="margin-top:6px">⚠ 1 ${u === "ac" ? "ação" : "contrato"} arrisca ${l(C)}, acima do limite de ${l(i)} por trade.</div>`}
<div class="g2" style="margin-top:6px">${d(u + ".px", "Último preço", g)}${d(u + ".vol", "Volatilidade (%)", h)}${d(u + ".mult", "Multiplicador (R$/pt)", b)}${d(u + ".stop", "Stop manual (pts)", y || "")}</div></div>`;
      })
      .join("") +
    `<p class="mut sm">Stop pela vol = preço × vol% × ${o}%. Contratos = risco do trade ÷ (stop × multiplicador), arredondado para baixo. O stop manual substitui o stop pela vol. Valores iniciais copiados da sua planilha (aba CÁLCULO DT).</p>`
  );
}
let CMX = 0;
function pCore(e, t) {
  const a = (v, g) => +gv("ct", v, g),
    o = S.prop || {},
    s = typeof trCfg == "function" ? trCfg() : {},
    n = S.days[loc().slice(0, 10)] || {},
    r = (...v) => {
      const g = v.map(Number).filter((h) => h > 0);
      return g.length ? Math.min(...g) : 0;
    },
    i = r(s.maxTr, n.maxT) || a("nd", 3),
    l =
      r(s.perdaDia, limPerda(n)) ||
      +o.perdaDia ||
      ((a("cap", 1e4) * a("pct", 2)) / 100) * i,
    d = Math.max(0, -t),
    c = e.slice().sort((v, g) => (v.dtx || v.dt).localeCompare(g.dtx || g.dt)),
    p = [];
  let u = 0;
  for (let v = c.length - 1; v >= 0 && c[v].c.pl < 0; v--) u++;
  {
    const v = loc().slice(0, 10);
    s.turno !== 0 &&
      turnoNv(v) === "r" &&
      p.push("dia de turno " + TH[tcod(v)]);
  }
  (d >= l && p.push("perda diária no limite"),
    u >= (+s.maxStops || 2) && p.push(u + " stops seguidos"));
  const m = e.length + (typeof abertosHoje == "function" ? abertosHoje() : 0);
  m >= i && p.push(m + " trades no dia (máx. " + i + ")");
  let f = 0,
    x = 0;
  return (
    c.forEach((v) => {
      ((f += emBRL(v.c.pl, moedaT(v))), (x = Math.max(x, f)));
    }),
    s.lucro !== 0 &&
      x > 0 &&
      x >= l * 0.5 &&
      f <= x * 0.5 &&
      p.push("devolveu metade do lucro do dia (pico " + money(x) + ")"),
    +s.meta > 0 &&
      t >= +s.meta &&
      p.push("bateu a meta do dia (" + money(+s.meta) + ")"),
    { nd: i, lim: l, perda: d, seq: u, mot: p, ntr: m, pico: x }
  );
}
function pHoje() {
  const e = loc().slice(0, 10),
    t = S.trades
      .map((a) => ({ ...a, c: calc(a) }))
      .filter((a) => a.c.pl != null && (a.dtx || a.dt).slice(0, 10) === e)
      .concat(typeof fxDia == "function" ? fxDia(e) : [])
      .map((a) => ({
        ...a,
        moeda: "BRL",
        c: { ...a.c, pl: emBRL(a.c.pl, moedaT(a)) },
      }));
  return { td: e, hj: t, P: sum(t.map((a) => a.c.pl)) };
}
var pBloq;
function posso(e, t, a) {
  const o = pCore(e, t),
    { nd: s, lim: n, perda: r, seq: i, mot: l } = o,
    d = Math.max(0, n - r),
    c = (S.rules || []).length,
    p = +(S.ax || {})["ov." + loc().slice(0, 10)] || 0,
    u = l.length
      ? "r"
      : r >= n * 0.8 || (c && a < c) || turnoNv(loc().slice(0, 10)) === "a"
        ? "a"
        : "g",
    m = { r: "Pare por hoje", a: "Atenção", g: "Pode operar" }[u],
    f = { r: "var(--r)", a: "#c2933d", g: "var(--g)" }[u],
    x = (v, g, h) =>
      `<div class="card"><span class="mut sm">${v}</span><b>${g}</b><span class="mut sm">${h}</span></div>`;
  return `<div class="card" style="border:2px solid ${f}"><div class="top"><b style="font-size:20px;color:${f}">${m}</b><span class="mut sm">Posso operar hoje?</span></div><div class="sm" style="margin:6px 0">${l.length ? l.join(" · ") + ". Novo trade pede confirmação." : (turnoNv(loc().slice(0, 10)) === "a" ? turnoTxt(loc().slice(0, 10)) + ": cuide do horário. " : "") + (c && a < c ? "Revisão das regras pendente para o encerramento." : "Dentro dos limites do dia.")}</div>${p ? `<div class="sm r" style="margin-bottom:6px">Você abriu ${p} trade(s) depois do aviso hoje.</div>` : ""}<div class="kv">${x("Perda restante", money(d), "de " + money(n))}${x("Trades hoje", o.ntr != null ? o.ntr : e.length, "máx. " + s + " · abertos contam")}${x("Stops seguidos", i, "pare em " + ((typeof trCfg == "function" && +trCfg().maxStops) || 2))}${x("Regras avaliadas", a + "/" + c, "revisão após operar")}</div></div>`;
}
function calMes() {
  const e = new Date();
  (e.setDate(1), e.setMonth(e.getMonth() + CMX));
  const t = e.getFullYear(),
    a = e.getMonth(),
    o = (p) => String(p).padStart(2, "0"),
    s = t + "-" + o(a + 1) + "-",
    n = new Date(t, a + 1, 0).getDate(),
    r = (new Date(t, a, 1).getDay() + 6) % 7,
    i = {},
    l = loc().slice(0, 10);
  (S.trades.forEach((p) => {
    const u = calc(p),
      m = (p.dtx || p.dt).slice(0, 10);
    u.pl != null &&
      m.startsWith(s) &&
      (i[m] = (i[m] || 0) + emBRL(u.pl, moedaT(p)));
  }),
    typeof fxPer == "function" &&
      fxPer(s + "01", s + "31").forEach((p) => {
        const u = p.dtx.slice(0, 10);
        i[u] = (i[u] || 0) + emBRL(p.c.pl, "USD");
      }));
  const d = sum(Object.values(i));
  let c = "";
  for (let p = 0; p < r; p++) c += "<div></div>";
  for (let p = 1; p <= n; p++) {
    const u = s + o(p),
      m = i[u],
      f =
        m == null
          ? "var(--bg)"
          : `color-mix(in srgb,${m >= 0 ? "var(--g)" : "var(--r)"} 30%,var(--card))`;
    c += `<button class="dc" data-a="cday" data-id="${u}" style="background:${f}${u === l ? ";outline:2px solid var(--ac)" : ""}"><span class="mut sm">${p}${tcod(u) ? ' <i style="font-size:9px">' + tcod(u) + "</i>" : ""}</span><b>${m == null ? "" : Math.abs(m) >= 1e3 ? (m / 1e3).toFixed(1).replace(".", ",") + "k" : Math.round(m)}</b></button>`;
  }
  return `<div class="top"><h2>Calendário</h2><div><button class="btn s" data-a="cm" data-id="-1">‹</button> <span class="sm">${e.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span> <button class="btn s" data-a="cm" data-id="1">›</button></div></div><div class="mc">${["S", "T", "Q", "Q", "S", "S", "D"].map((p) => `<span class="mut sm">${p}</span>`).join("")}${c}</div><div class="sm" style="margin:6px 0 12px">Resultado do mês: <b class="${d >= 0 ? "g" : "r"}">${money(d)}</b></div>`;
}
var TCOD = ["8", "16", "0", "F"],
  TH = { 8: "08h–17h", 16: "16h–00h", 0: "00h–08h", F: "Folga" },
  TNV0 = { 8: "r", 16: "a", 0: "a", F: "g" },
  TSV = 0,
  TSM = 0,
  TSMSG = "";
function turnoSeed() {
  const e = {};
  return (
    "8,F,16,16,16,F,0,0,8,8,F,F,16,16".split(",").forEach((t, a) => {
      e[diasMais("2026-10-14", a)] = t;
    }),
    { on: 1, letra: "A", dias: e, niv: { ...TNV0 } }
  );
}
function turnoGet() {
  const e = (S.ax || {}).turno;
  return e && e.dias
    ? { on: 1, letra: "A", ...e, niv: { ...TNV0, ...(e.niv || {}) } }
    : turnoSeed();
}
function turnoSet(e) {
  const t = turnoGet();
  (e(t), ((S.ax ?? (S.ax = {})).turno = t), save());
}
function tcod(e) {
  const t = turnoGet();
  return (t.on && t.dias[e]) || "";
}
function turnoNv(e) {
  const t = turnoGet(),
    a = t.on && t.dias[e];
  return (a && t.niv[a]) || "g";
}
function turnoTxt(e) {
  const t = tcod(e);
  return t ? (t === "F" ? "Folga" : "Turno " + t + " (" + TH[t] + ")") : "";
}
function turnoParse(e, t) {
  const a = Math.max(0, "ABCD".indexOf(String(t || "A").toUpperCase())),
    o = {};
  let s = 0;
  return (
    String(e || "")
      .split(/\r?\n/)
      .forEach((n) => {
        const r = n.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
        if (!r) {
          n.trim() && s++;
          return;
        }
        let i = r[3] ? +r[3] : new Date().getFullYear();
        i < 100 && (i += 2e3);
        const l = +r[1],
          d = +r[2];
        if (l < 1 || l > 31 || d < 1 || d > 12) {
          s++;
          return;
        }
        const c = n.slice(r.index + r[0].length),
          p = (c.match(/\b(16|8|0|F|folga)\b/gi) || []).map((m) =>
            /^f/i.test(m) ? "F" : m,
          );
        if (!p.length) {
          s++;
          return;
        }
        const u = p.length >= 4 ? p[a] : p[0];
        if (!u) {
          s++;
          return;
        }
        o[
          i +
            "-" +
            String(d).padStart(2, "0") +
            "-" +
            String(l).padStart(2, "0")
        ] = u;
      }),
    { dias: o, n: Object.keys(o).length, ign: s }
  );
}
function turnoCard() {
  const e = turnoGet(),
    t = loc().slice(0, 10),
    a = { r: "Não opere", a: "Atenção", g: "Livre" },
    o = { r: "var(--r)", a: "#c2933d", g: "var(--g)" },
    s = Array.from({ length: 7 }, (r, i) => {
      const l = diasMais(t, i),
        d = e.dias[l] || "",
        c = d ? e.niv[d] || "g" : "";
      return `<div style="text-align:center;flex:1;min-width:0"><div class="mut sm">${i ? new Date(l + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") : "hoje"}</div><div style="margin-top:3px;padding:6px 0;border-radius:8px;border:${i ? 1 : 2}px solid ${c ? o[c] : "var(--bd,#8884)"};font-weight:700">${d || "–"}</div></div>`;
    }).join(""),
    n =
      e.on && e.dias[t]
        ? `<div style="margin:6px 0;color:${o[turnoNv(t)]}"><b>${turnoTxt(t)}</b> · ${a[turnoNv(t)]}${turnoNv(t) === "r" ? " — hoje não é dia de operar." : ""}</div>`
        : `<div class="mut sm" style="margin:6px 0">${e.on ? "Hoje sem turno cadastrado." : "Alerta de turno desligado."}</div>`;
  return `<div class="card"><div class="top"><b>Escala de turno · letra ${esc(e.letra)}</b><button class="btn s" data-a="tsv">${TSV ? "Fechar" : "Editar escala"}</button></div>${n}<div style="display:flex;gap:4px">${s}</div>${TSV ? turnoEd(e) : ""}</div>`;
}
function turnoEd(e) {
  const t = new Date();
  (t.setDate(1), t.setMonth(t.getMonth() + TSM));
  const a = t.getFullYear(),
    o = t.getMonth(),
    s = (c) => String(c).padStart(2, "0"),
    n = new Date(a, o + 1, 0).getDate(),
    r = (new Date(a, o, 1).getDay() + 6) % 7,
    i = { r: "var(--r)", a: "#c2933d", g: "var(--g)" };
  let l = "";
  for (let c = 0; c < r; c++) l += "<div></div>";
  for (let c = 1; c <= n; c++) {
    const p = a + "-" + s(o + 1) + "-" + s(c),
      u = e.dias[p] || "";
    l += `<button class="dc" data-a="tsc" data-id="${p}" style="${u ? "border:2px solid " + i[e.niv[u] || "g"] : ""}"><span class="mut sm">${c}</span><b>${u}</b></button>`;
  }
  const d = TCOD.map(
    (c) =>
      `<button class="btn s" data-a="tsn" data-id="${c}">${c === "F" ? "Folga" : c + " · " + TH[c]}: ${{ r: "não opere", a: "atenção", g: "livre" }[e.niv[c]]}</button>`,
  ).join(" ");
  return `<hr style="border:0;border-top:1px solid #8883;margin:10px 0"><div class="top"><span class="sm">${t.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · toque no dia para trocar (vazio → 8 → 16 → 0 → F)</span><div><button class="btn s" data-a="tsm" data-id="-1">‹</button> <button class="btn s" data-a="tsm" data-id="1">›</button></div></div><div class="mc">${["S", "T", "Q", "Q", "S", "S", "D"].map((c) => `<span class="mut sm">${c}</span>`).join("")}${l}</div>
<div class="sm" style="margin:10px 0 4px">O que cada turno faz com o aviso (toque para mudar):</div><div style="display:flex;flex-wrap:wrap;gap:6px">${d}</div>
<div class="sm" style="margin:12px 0 4px">Importar: cole as linhas da tabela (ex.: <i>14.10.26 qua 8</i>, ou a linha inteira A B C D) e escolha a sua letra.</div><div style="display:flex;gap:6px"><input id="tsl" value="${esc(e.letra)}" maxlength="1" style="width:46px;text-align:center"><button class="btn s" data-a="tsimp">Importar</button><button class="btn s" data-a="tson">${e.on ? "Desligar aviso" : "Ligar aviso"}</button><button class="btn s" data-a="tsclr">Limpar</button></div><textarea id="tsx" rows="5" placeholder="14.10.26 qua 8 F 16 0&#10;15.10.26 qui F 16 0 8" style="width:100%;margin-top:6px"></textarea><div class="sm ${TSMSG[0] === "✓" ? "g" : "r"}" style="margin-top:4px">${esc(TSMSG)}</div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a]");
  if (!t || !/^ts/.test(t.dataset.a)) return;
  const a = t.dataset.a,
    o = t.dataset.id;
  if (a === "tsv") ((TSV = !TSV), (TSMSG = ""));
  else if (a === "tsm") TSM += +o;
  else if (a === "tsc")
    turnoSet((s) => {
      const n = s.dias[o] || "",
        r = TCOD.indexOf(n),
        i = r + 1 < TCOD.length ? TCOD[r + 1] : "";
      i ? (s.dias[o] = i) : delete s.dias[o];
    });
  else if (a === "tsn")
    turnoSet((s) => {
      s.niv[o] = { r: "a", a: "g", g: "r" }[s.niv[o] || "g"];
    });
  else if (a === "tson")
    turnoSet((s) => {
      s.on = s.on ? 0 : 1;
    });
  else if (a === "tsclr") {
    if (!confirm("Apagar toda a escala cadastrada?")) return;
    turnoSet((s) => {
      s.dias = {};
    });
  } else if (a === "tsimp") {
    const s =
        (($("#tsl") || {}).value || "A").trim().toUpperCase().slice(0, 1) ||
        "A",
      n = turnoParse(($("#tsx") || {}).value, s);
    if (!n.n) {
      ((TSMSG = "Não achei datas com turno. Use linhas como: 14.10.26 qua 8"),
        render());
      return;
    }
    (turnoSet((r) => {
      ((r.letra = s), Object.assign(r.dias, n.dias));
    }),
      (TSMSG =
        "✓ " +
        n.n +
        " dia(s) importado(s)" +
        (n.ign ? " (" + n.ign + " linha(s) ignorada(s))" : "")));
  } else return;
  render();
});
const IC = (e) =>
    `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${e}"/></svg>`,
  ICS = {
    live: "M3 12h4l3-8 4 16 3-8h4",
    regras: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
    graf: "M3 17l5-6 4 3 8-9M3 21h18",
    painel: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    rev: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    estudos: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19h15",
    ativos: "M12 3v18M16 7h-5a3 3 0 000 6h2a3 3 0 010 6H8",
    contratos: "M6 3h12v18H6zM9 7h6M9 12h1M12 12h1M9 16h1M12 16h1",
    import: "M12 4v11M7 11l5 5 5-5M5 20h14",
    carteiras: "M12 3v9h9a9 9 0 11-9-9zM15 3.5A9 9 0 0120.5 9H15z",
    analise:
      "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
    imposto: "M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5zM10 8h4M10 12h4",
    conta: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6",
  };
((function () {
  const e = TraderStyles.slot("legacy-003");
  ((e.textContent = TraderStyles.css("legacy-003")), TraderStyles.mount(e));
  const t = (c) => c.map(([p, u]) => ({ proName: p, title: u })),
    a = {
      symbols: t([
        ["BMFBOVESPA:IBOV", "IBOV"],
        ["BMFBOVESPA:WIN1!", "WIN"],
        ["BMFBOVESPA:WDO1!", "WDO"],
        ["FX_IDC:USDBRL", "USD/BRL"],
        ["TVC:DXY", "DXY"],
        ["FOREXCOM:SPXUSD", "S&P 500"],
        ["FOREXCOM:NSXUSD", "NASDAQ"],
        ["FOREXCOM:DJI", "DOW"],
        ["INDEX:DEU40", "DAX"],
        ["TVC:NI225", "NIKKEI"],
        ["BITSTAMP:BTCUSD", "BTC"],
        ["BITSTAMP:ETHUSD", "ETH"],
        ["TVC:USOIL", "WTI"],
        ["TVC:UKOIL", "BRENT"],
        ["TVC:GOLD", "OURO"],
        ["TVC:SILVER", "PRATA"],
        ["COMEX:HG1!", "COBRE"],
        ["CBOT:ZS1!", "SOJA"],
        ["BMFBOVESPA:PETR4", "PETR4"],
        ["BMFBOVESPA:VALE3", "VALE3"],
        ["BMFBOVESPA:ITUB4", "ITUB4"],
        ["BMFBOVESPA:BBDC4", "BBDC4"],
        ["BMFBOVESPA:BBAS3", "BBAS3"],
        ["BMFBOVESPA:WEGE3", "WEGE3"],
        ["BMFBOVESPA:ABEV3", "ABEV3"],
        ["BMFBOVESPA:B3SA3", "B3SA3"],
      ]),
      showSymbolLogo: !0,
      colorTheme: "dark",
      isTransparent: !0,
      largeChartUrl: "",
      displayMode: "regular",
      locale: "br",
    };
  function o() {
    if (document.getElementById("tape")) return;
    const c = document.createElement("div");
    c.id = "tape";
    const p = document.createElement("div");
    ((p.className = "tradingview-widget-container"),
      (p.innerHTML =
        '<div class="tradingview-widget-container__widget"></div>'));
    const u = document.createElement("script");
    ((u.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"),
      (u.async = !0),
      (u.innerHTML = JSON.stringify(a)),
      c.appendChild(p),
      setTimeout(() => {
        r || p.appendChild(u);
      }, 7e3));
    const m = document.createElement("div");
    ((m.id = "tapeSp"),
      document.body.insertBefore(m, document.body.firstChild),
      document.body.insertBefore(c, m));
  }
  (document.body ? o() : document.addEventListener("DOMContentLoaded", o),
    (e.textContent +=
      "#tape .mq{height:46px;overflow:hidden;display:flex;align-items:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}#tape .tr{display:flex;white-space:nowrap;animation:tpm var(--d,60s) linear infinite;will-change:transform}@keyframes tpm{to{transform:translateX(-50%)}}#tape .ti{display:flex;flex-direction:column;justify-content:center;gap:4px;padding:0 16px;border-right:1px solid #1b1d1f;line-height:1.1;font-size:12px;color:#eae9e6}#tape .ti b{font-size:13px}#tape .up{color:#3aad74}#tape .dn{color:#e7614c}"));
  const s = [
    ["^BVSP", "IBOV"],
    ["BRL=X", "USD/BRL"],
    ["DX-Y.NYB", "DXY"],
    ["^GSPC", "S&P 500"],
    ["^IXIC", "NASDAQ"],
    ["^DJI", "DOW"],
    ["BTC-USD", "BTC"],
    ["ETH-USD", "ETH"],
    ["CL=F", "WTI"],
    ["GC=F", "OURO"],
    ...[
      "PETR4",
      "VALE3",
      "ITUB4",
      "BBDC4",
      "BBAS3",
      "WEGE3",
      "ABEV3",
      "B3SA3",
      "RENT3",
      "SUZB3",
    ].map((c) => [c, c]),
  ];
  let n = {},
    r = 0;
  window.tapeDados = () => n;
  const i = ([c, p]) => {
    const u = (window.tapeVivo && window.tapeVivo(c)) || n[c],
      m = +u.chg || 0,
      f = m >= 0;
    return `<span>${p} <span class="${f ? "up" : "dn"}">${f ? "▲" : "▼"}</span></span><span class="${f ? "up" : "dn"}">${f2(u.px)} <b>${f ? "+" : ""}${f2(m)}%</b></span>`;
  };
  function l() {
    const c = document.getElementById("tape");
    if (!c) return;
    const p = s.filter((x) => n[x[0]]);
    if (p.length < 4) return;
    if (r) {
      c.querySelectorAll(".ti").forEach((x) => {
        const v = s.find((g) => g[0] === x.dataset.s);
        v && n[v[0]] && (x.innerHTML = i(v));
      });
      return;
    }
    const u = p
        .map((x) => `<div class="ti" data-s="${x[0]}">${i(x)}</div>`)
        .join(""),
      m = document.createElement("div");
    ((m.className = "mq"),
      (m.innerHTML = `<div class="tr" style="--d:${Math.max(30, p.length * 4)}s">${u}${u}</div>`));
    const f = c.querySelector(".tradingview-widget-container");
    (f && (f.style.display = "none"), c.appendChild(m), (r = 1));
  }
  async function d() {
    if (!document.hidden)
      try {
        (((await scFetch(s.map((c) => c[0]))).data || []).forEach((c) => {
          c &&
            c.ok &&
            c.px != null &&
            s.some((p) => p[0] === c.s) &&
            (n[c.s] = c);
        }),
          l());
      } catch {}
  }
  ((window.tapeRedraw = l), setTimeout(d, 1200), setInterval(d, 6e4));
})(),
  (function () {
    const e = TraderStyles.slot("legacy-004");
    ((e.textContent = TraderStyles.css("legacy-004")), TraderStyles.mount(e));
    const t = [
        ["home", "🏠", "Início", "Resumo do dia"],
        ["mercado", "📰", "Mercado", "Agenda, notícias, cotações e alertas"],
        ["live", "⚡", "Cotações ao vivo", "Lista da ponte do Profit"],
        ["juros", "📚", "Juros e DI", "Selic, DI futuro e curva de juros"],
        ["trades", "📸", "Day trade", "Operações e fotos"],
        ["swing", "🌊", "Swing", "Posições e scanner"],
        ["opc", "🎯", "Opções", "Abertas e performance"],
        ["dia", "🌙", "Meu dia", "Antes e depois do mercado"],
        ["stats", "📊", "Estatísticas", "Resultados e feedback"],
      ],
      a = [
        ["regras", "Regras", "Seu plano escrito"],
        ["graf", "Gráficos", "TradingView e níveis"],
        ["painel", "Painel", "Mesa, metas e backup"],
        ["rev", "Revisão", "Calendário do mês"],
        ["estudos", "Estudos", "Livros e padrões de candles"],
        ["ativos", "Ativos", "Margem, risco e lote"],
        ["contratos", "Contratos", "Lotes pelo capital e volatilidade"],
        ["carteiras", "Carteiras", "Brasil e EUA, evolução"],
        ["analise", "Análise IA", "Relatório da carteira"],
        ["imposto", "Imposto de renda", "Notas, custos e DARF"],
        ["import", "Importar", "Relatório do Profit (CSV)"],
        ["conta", "Conta", "Sincronização"],
      ],
      o = (i, l, d, c) =>
        `<button class="mit${tab === i ? " on" : ""}" data-a="gotab" data-id="${i}"><span class="mi">${l}</span><span><b>${d}</b><small>${c}</small></span></button>`;
    function s() {
      const i = document.getElementById("mdr");
      (i && i.remove(), (document.body.style.overflow = T ? "hidden" : ""));
    }
    function n() {
      s();
      const i = document.createElement("div");
      ((i.id = "mdr"),
        (i.innerHTML = `<div class="mbk" data-m="x"></div><aside class="mpn"><div class="mhd"><b style="font-size:18px">Menu</b><button data-m="x" aria-label="Fechar">✕</button></div><div class="ms">Diário</div>${t.map((l) => o(...l)).join("")}<div class="ms">Ferramentas</div>${a.map(([l, d, c]) => o(l, IC(ICS[l]), d, c)).join("")}<div class="ms">Mais</div>${o("mais", "⚙️", "Aparência", "Tema claro, escuro ou automático")}</aside>`),
        document.body.appendChild(i),
        (document.body.style.overflow = "hidden"));
    }
    function r() {
      const i = document.getElementById("tape");
      if (!i) {
        setTimeout(r, 200);
        return;
      }
      if (document.getElementById("mbtn")) return;
      const l = document.createElement("button");
      ((l.id = "mbtn"),
        l.setAttribute("aria-label", "Menu"),
        (l.innerHTML =
          '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'),
        i.appendChild(l));
    }
    (r(),
      document.addEventListener("click", (i) => {
        if (i.target.closest("#mbtn")) {
          n();
          return;
        }
        (i.target.closest('#mdr [data-m="x"]') ||
          i.target.closest("#mdr [data-a]")) &&
          s();
      }),
      document.addEventListener("keydown", (i) => {
        i.key === "Escape" && s();
      }));
  })());
const IRC = {
  D: ["Day trade", 0.2, 0],
  A: ["Swing ações", 0.15, 2e4],
  O: ["Swing ETF/BDR/futuros/opções", 0.15, 0],
  F: ["Swing FII", 0.2, 0],
};
function irVenc(e) {
  const [t, a] = e.split("-").map(Number),
    o = new Date(t, a + 1, 0);
  for (; o.getDay() % 6 === 0; ) o.setDate(o.getDate() - 1);
  return o.toLocaleDateString("pt-BR");
}
function irCalc() {
  const e = ((S.ir || {}).notas || [])
      .slice()
      .sort((p, u) => p.d.localeCompare(u.d)),
    t = {},
    a = (p) => +p || 0,
    o = { corr: 0, emol: 0, iss: 0, out: 0, bruto: 0 };
  e.forEach((p) => {
    var u, m;
    const f = p.d.slice(0, 7),
      x = t[f] ?? (t[f] = { c: {}, cost: 0, bruto: 0, irrf: 0 }),
      v = (u = x.c)[(m = p.m)] ?? (u[m] = { bruto: 0, cost: 0, vendas: 0 }),
      g = a(p.corr) + a(p.emol) + a(p.iss) + a(p.out);
    ((v.bruto += a(p.bruto)),
      (v.cost += g),
      (v.vendas += a(p.vendas)),
      (x.cost += g),
      (x.bruto += a(p.bruto)),
      (x.irrf += a(p.irrf)),
      ["corr", "emol", "iss", "out"].forEach((h) => (o[h] += a(p[h]))),
      (o.bruto += a(p.bruto)));
  });
  const s = { D: 0, A: 0, O: 0, F: 0 },
    n = [];
  let r = 0,
    i = 0;
  Object.keys(t)
    .sort()
    .forEach((p) => {
      const u = t[p],
        m = [];
      let f = 0;
      for (const b of Object.keys(IRC)) {
        const y = u.c[b];
        if (!y) continue;
        const j = y.bruto - y.cost,
          [k, A, C] = IRC[b];
        let I = 0,
          J = 0,
          se = 0,
          Ie = !1;
        (b === "A" && y.vendas <= C && j >= 0
          ? (Ie = !0)
          : j < 0
            ? (s[b] += -j)
            : ((I = Math.min(s[b], j)), (s[b] -= I), (J = j - I), (se = J * A)),
          (f += se),
          m.push({
            k: b,
            nm: k,
            liq: j,
            comp: I,
            base: J,
            tx: se,
            isento: Ie,
            vendas: y.vendas,
          }));
      }
      const x = r + u.irrf,
        v = Math.min(x, f);
      r = x - v;
      const g = f - v + i;
      let h = 0;
      (g >= 10 ? ((h = g), (i = 0)) : (i = g),
        n.push({
          m: p,
          rows: m,
          cost: u.cost,
          bruto: u.bruto,
          irrf: u.irrf,
          imp: f,
          darf: h,
          carry: i,
          pool: r,
          prej: { ...s },
        }));
    });
  const l = sum(n.map((p) => p.cost)),
    d = new Date().getFullYear() + "-",
    c = loc().slice(0, 7);
  return {
    out: n,
    tot: o,
    all: l,
    ano: sum(n.filter((p) => p.m.startsWith(d)).map((p) => p.cost)),
    mes: sum(n.filter((p) => p.m === c).map((p) => p.cost)),
  };
}
function vImpostoAp() {
  const e = irCalc(),
    t = ((S.ir || {}).notas || [])
      .slice()
      .sort((n, r) => r.d.localeCompare(n.d)),
    a = (n, r, i = "number") =>
      `<label>${r}<input id="${n}" type="${i}" step="any" inputmode="decimal"></label>`,
    o = (n, r, i) =>
      `<div class="card"><span class="mut sm">${n}</span><b>${r}</b><span class="mut sm">${i || ""}</span></div>`,
    s =
      e.tot.bruto > 0
        ? f2((e.all / e.tot.bruto) * 100) + "% do resultado bruto"
        : "";
  return `<p class="mut sm">Lance os valores de cada nota de corretagem. O app desconta os custos, separa day trade e swing, compensa prejuízos e calcula o DARF (código 6015).</p>
<h2>Custos operacionais</h2><div class="kv">${o("Total gasto", money(e.all), s)}${o("No ano", money(e.ano))}${o("No mês", money(e.mes))}</div><p class="sm mut">Corretagem ${money(e.tot.corr)} · Emolumentos/taxas ${money(e.tot.emol)} · ISS ${money(e.tot.iss)} · Outros ${money(e.tot.out)}</p>
<h2>Nova nota</h2><div class="card"><div class="g2">${a("ir_d", "Data", "date")}<label>Mercado<select id="ir_m">${Object.entries(
    IRC,
  )
    .map(([n, r]) => `<option value="${n}">${r[0]}</option>`)
    .join(
      "",
    )}</select></label></div><div class="g2">${a("ir_b", "Resultado bruto (R$)")}${a("ir_v", "Total de vendas (só swing ações)")}</div><div class="g2">${a("ir_c", "Corretagem")}${a("ir_e", "Emolumentos + taxas")}</div><div class="g2">${a("ir_i", "ISS")}${a("ir_o", "Outros custos")}</div>${a("ir_r", "IRRF retido (R$)")}<button class="btn" data-a="irAdd" style="margin-top:10px">Adicionar nota</button></div>
<h2>Apuração mensal</h2>${
    e.out.length
      ? e.out
          .slice()
          .reverse()
          .map(
            (n) =>
              `<div class="card"><div class="top"><b>${new Date(n.m + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b><b class="${n.darf > 0 ? "r" : "g"}">DARF ${money(n.darf)}</b></div>${n.rows.map((r) => `<div class="sm" style="margin-top:6px"><b>${r.nm}</b>: líquido <b class="${r.liq >= 0 ? "g" : "r"}">${money(r.liq)}</b>${r.isento ? ' · <b class="g">isento (vendas ${money(r.vendas)} ≤ R$ 20 mil)</b>' : r.liq < 0 ? " · prejuízo a compensar" : ` · compensado ${money(r.comp)} · base ${money(r.base)} · imposto ${money(r.tx)}`}</div>`).join("")}<div class="sm mut" style="margin-top:6px">Custos do mês ${money(n.cost)} · IRRF ${money(n.irrf)}${n.darf > 0 ? " · vence em " + irVenc(n.m) + " (sem feriados)" : ""}${n.carry > 0 ? " · abaixo de R$ 10: soma ao mês seguinte" : ""}</div>${
                Object.values(n.prej).some((r) => r > 0)
                  ? `<div class="sm mut">Prejuízo acumulado: ${Object.entries(
                      n.prej,
                    )
                      .filter(([r, i]) => i > 0)
                      .map(([r, i]) => IRC[r][0] + " " + money(i))
                      .join(" · ")}</div>`
                  : ""
              }</div>`,
          )
          .join("")
      : '<p class="mut">Nenhuma nota lançada.</p>'
  }
<h2>Notas lançadas</h2>${t.map((n) => `<div class="card"><div class="top"><span><b>${n.d.split("-").reverse().join("/")}</b> · ${IRC[n.m][0]}${n.src ? " · 📥 importada" : ""}</span><button class="btn s" data-a="irDel" data-id="${n.id}">Excluir</button></div><div class="sm mut">Bruto ${money(+n.bruto || 0)} · custos ${money((+n.corr || 0) + (+n.emol || 0) + (+n.iss || 0) + (+n.out || 0))} · IRRF ${money(+n.irrf || 0)}</div>${n.av ? `<div class="sm r">${esc(n.av)}</div>` : ""}</div>`).join("")}
<p class="sm mut">Cálculo orientativo (15% swing, 20% day trade, FII 20%, isenção de R$ 20 mil só em ações no swing). Não cobre casos especiais nem feriados. Confirme com um contador de renda variável e guarde as notas.</p>`;
}
const NT = { notes: [], msg: "", busy: 0, cart: 1 },
  ntNum = (e) => {
    const t = parseFloat(String(e).replace(/\./g, "").replace(",", "."));
    return isFinite(t) ? t : 0;
  },
  ntD = (e) => {
    const t = String(e).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return t ? t[3] + "-" + t[2] + "-" + t[1] : "";
  },
  ntNorm = (e) =>
    String(e)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim(),
  NTETF =
    /^(BOVA|BOVV|SMAL|IVVB|HASH|GOLD|DIVO|FIND|MATB|ISUS|XINA|SPXI|NASD|ECOO|BBSD|B5P2|IMAB|IRFM|FIXA|GOVE|MILL|QBTC|ETHE|TECK|URET|WRLD|ACWI|DNAI|BRAX|PIBB|XFIX|QETH|SOLH|BITH|CHIP|JOGO|ESGB|BOVX)/,
  NTUNIT =
    /^(TAEE|KLBN|SANB|BPAC|ALUP|SAPR|ENGI|SULA|BRBI|IGTI|TIET|AESB|RNEW|BIDI|BPAN|GETT)/,
  ntOpt = (e) =>
    /OP[C\xc7][A\xc3]O/i.test(e.mkt || "") ||
    /^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(e.tk || ""),
  ntCat = (e) =>
    e.dt
      ? "D"
      : ntOpt(e)
        ? "O"
        : /11$/.test(e.tk)
          ? NTETF.test(e.tk)
            ? "O"
            : NTUNIT.test(e.tk)
              ? "A"
              : "F"
          : /(31|32|33|34|35|39)$/.test(e.tk)
            ? "O"
            : "A",
  ntLines = (e, t) => {
    const a = [];
    return (
      e
        .filter((o) => o.str && o.transform && String(o.str).trim())
        .forEach((o) => {
          const s = o.transform[4],
            n = o.transform[5];
          let r = a.find((i) => Math.abs(i.y - n) < 2.5);
          (r || a.push((r = { y: n, it: [] })),
            r.it.push({ x: s, s: String(o.str).trim() }));
        }),
      a.sort((o, s) => s.y - o.y),
      a.map(
        (o) => (
          o.it.sort((s, n) => s.x - n.x),
          {
            full: o.it.map((s) => s.s).join(" "),
            R: o.it
              .filter((s) => s.x >= t * 0.5)
              .map((s) => s.s)
              .join(" "),
          }
        ),
      )
    );
  },
  ntParse = (e) => {
    const t = [];
    let a = null;
    return (
      e.forEach((o) => {
        const s = ntLines(o.items, o.W),
          n = s.slice(0, 14),
          r = n
            .map((c) =>
              c.full.match(/(\d{4,})\s+(\d{1,2})\s+(\d{2}\/\d{2}\/\d{4})/),
            )
            .find(Boolean),
          i = ntD(
            r
              ? r[3]
              : (n
                  .map((c) => c.full.match(/\d{2}\/\d{2}\/\d{4}/))
                  .find(Boolean) || [""])[0],
          ),
          l = r ? r[1] : "",
          d = r ? +r[2] : 1;
        if (!a || d === 1 || (l && l !== a.nr) || (i && i !== a.d)) {
          const c =
            n
              .map((p) => p.full)
              .find(
                (p) =>
                  /CTVM|DTVM|CORRETORA|\bS\.A\./i.test(p) &&
                  !/NOTA DE/i.test(p),
              ) || "";
          ((a = {
            nr: l,
            d: i,
            corretora: /BTG/i.test(c)
              ? "BTG Pactual"
              : c
                  .replace(/\s*(CTVM|DTVM).*$/i, "")
                  .replace(/\s*S\.A\.?.*$/i, "")
                  .trim() || "Corretora",
            ops: [],
            c: {},
            L: [],
          }),
            t.push(a));
        }
        a.L.push(...s);
      }),
      t.forEach((o) => {
        let s = "";
        const n = {
          liq: 0,
          reg: 0,
          termo: 0,
          ana: 0,
          emol: 0,
          transf: 0,
          ccor: 0,
          exe: 0,
          exc: 0,
          corr: 0,
          iss: 0,
          out: 0,
          irrf: 0,
          totcor: null,
          liquido: null,
          vliq: null,
        };
        let r = 0;
        (o.L.forEach((l) => {
          const d = l.full.match(
            /^\d+-[A-Z\xc0-\xda]+(?:\s[A-Z\xc0-\xda]+)?\s+([CV])\s+(.+?)\s+(\d[\d.]*)\s+([\d.]+,\d+)\s+([\d.]+,\d{2})\s+([DC])$/,
          );
          if (d) {
            const f = d[2].trim().split(/\s+/),
              x = f.findIndex((v) =>
                /^[A-Z]{4}(\d{1,2}|[A-X]\d{2,3})[A-Z]?$/.test(v),
              );
            if (x >= 0) {
              let v = f[x];
              /^[A-Z]{4}\d{1,2}F$/.test(v) && (v = v.slice(0, -1));
              const g = f.slice(x + 1),
                h = g[g.length - 1] || "";
              (o.ops.push({
                cv: d[1],
                mkt: f.slice(0, x).join(" ").trim(),
                tk: v,
                qty: ntNum(d[3]),
                px: ntNum(d[4]),
                val: ntNum(d[5]),
                dc: d[6],
                dt:
                  (/^[A-Z#2-9]$/.test(h) && /D/.test(h)) ||
                  g.some((b) => b === "D"),
              }),
                r++);
            }
            return;
          }
          const c = l.R.trim();
          if (!c) return;
          if (/^clearing$/i.test(c)) {
            s = "clr";
            return;
          }
          if (/^bolsa$/i.test(c)) {
            s = "bol";
            return;
          }
          if (/^deposit.ria$/i.test(c)) {
            s = "dep";
            return;
          }
          if (/^corretagem\s*\/\s*despesas$/i.test(c)) {
            s = "cor";
            return;
          }
          const p = c.match(/(-?[\d.]+,\d{2})\s*([DC])?\s*$/);
          if (!p) return;
          const u = ntNum(p[1]),
            m = ntNorm(c.slice(0, p.index));
          /^valor liquido das operacoes/.test(m)
            ? (n.vliq = u)
            : /^taxa de liquidacao/.test(m)
              ? (n.liq += u)
              : /^taxa de registro/.test(m)
                ? (n.reg += u)
                : /^taxa de termo/.test(m)
                  ? (n.termo += u)
                  : /^taxa a\.?n\.?a/.test(m)
                    ? (n.ana += u)
                    : /^emolumentos/.test(m)
                      ? (n.emol += u)
                      : /^taxa de transfer/.test(m)
                        ? (n.transf += u)
                        : /^total corretagem/.test(m)
                          ? (n.totcor = u)
                          : /^liquido para/.test(m)
                            ? (n.liquido = p[2] === "C" ? u : -u)
                            : s === "cor" &&
                              (/^clearing/.test(m)
                                ? (n.ccor += u)
                                : /^execucao casa/.test(m)
                                  ? (n.exc += u)
                                  : /^execucao/.test(m)
                                    ? (n.exe += u)
                                    : /^corretagem/.test(m)
                                      ? (n.corr += u)
                                      : /^iss/.test(m)
                                        ? (n.iss += u)
                                        : /^outras/.test(m)
                                          ? (n.out += u)
                                          : /^i\.?r\.?r\.?f/.test(m) &&
                                            (n.irrf += u));
        }),
          (n.ok = r > 0),
          (o.c = n),
          (o.vol = o.ops.reduce((l, d) => l + d.val, 0)),
          delete o.L);
        const i = (l) => Math.round(l * 100) / 100;
        ((o.cost = {
          corr: i(n.corr + n.exe + n.exc + n.ccor),
          emol: i(n.liq + n.reg + n.termo + n.ana + n.emol + n.transf),
          iss: i(n.iss),
          out: i(n.out),
          irrf: i(n.irrf),
        }),
          o.ops.forEach((l) => (l.cat = ntCat(l))),
          (o.key = o.corretora + "|" + o.nr + "|" + o.d));
      }),
      t.filter((o) => o.ops.length)
    );
  };
let PDFJS = null;
async function ntLib() {
  if (PDFJS) return PDFJS;
  const e = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/",
    t = await import(e + "legacy/build/pdf.mjs");
  return (
    (t.GlobalWorkerOptions.workerSrc = e + "legacy/build/pdf.worker.mjs"),
    (PDFJS = {
      ...t,
      getDocument(a) {
        const o = t.getDocument({
          standardFontDataUrl: e + "standard_fonts/",
          wasmUrl: e + "wasm/",
          ...a,
          isEvalSupported: !1,
          enableScripting: !1,
        });
        return {
          promise: o.promise.then(
            (s) => (
              typeof s.destroy != "function" && (s.destroy = () => o.destroy()),
              s
            ),
          ),
          destroy: () => o.destroy(),
        };
      },
    }),
    PDFJS
  );
}
async function ntRead(e) {
  if (e.size > 50 * 1024 * 1024)
    throw new Error("O PDF deve ter no máximo 50 MB.");
  const t = await ntLib(),
    a = new Uint8Array(await e.arrayBuffer());
  let o;
  for (let s = 0; s < 3; s++)
    try {
      const n = await t.getDocument({
          data: a.slice(),
          password: o,
          isEvalSupported: !1,
          enableScripting: !1,
        }).promise,
        r = [];
      for (let i = 1; i <= n.numPages; i++) {
        const l = await n.getPage(i),
          d = await l.getTextContent();
        r.push({ W: l.getViewport({ scale: 1 }).width, items: d.items });
      }
      return r;
    } catch (n) {
      if (n && n.name === "PasswordException") {
        if (
          ((o = prompt(
            s
              ? "Senha incorreta. Tente de novo:"
              : "Este PDF tem senha. Normalmente são os 5 primeiros dígitos do CPF:",
          )),
          !o)
        )
          throw new Error("PDF protegido por senha.");
      } else throw n;
    }
  throw new Error("Senha incorreta.");
}
function ntPm(e, t) {
  let a = 0,
    o = 0;
  return (
    ((S.cart || {}).lanc || [])
      .filter((s) => s.mk === "BR" && s.tk === e && s.tp !== "P" && s.d <= t)
      .sort((s, n) => (s.d < n.d ? -1 : s.d > n.d ? 1 : 0))
      .forEach((s) => {
        const n = +s.q || 0,
          r = +s.p || 0,
          i = +s.cs || 0;
        if (s.tp === "C") ((a += n), (o += n * r + i));
        else {
          const l = a > 0 ? o / a : 0,
            d = Math.min(n, a);
          ((o -= l * d), (a -= d));
        }
      }),
    a > 1e-9 ? o / a : 0
  );
}
function ntImport() {
  const e = NT.notes.filter((i) => !i.dup && i.d);
  if (!e.length) {
    ((NT.msg = "Nenhuma nota nova para importar."), render());
    return;
  }
  const t = S.ir ?? (S.ir = { notas: [] }),
    a = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} }),
    o = (i) => Math.round(i * 100) / 100,
    s = { F: "fii", O: "etf", A: "acao" };
  (t.imp ?? (t.imp = []), t.notas ?? (t.notas = []), a.lanc ?? (a.lanc = []));
  let n = 0,
    r = 0;
  (e
    .sort((i, l) => i.d.localeCompare(l.d))
    .forEach((i) => {
      const l = uid(),
        d = i.vol || 1,
        c = i.cost,
        p = c.corr + c.emol + c.iss + c.out,
        u = {};
      i.ops.forEach((v) => {
        var g;
        return (u[(g = v.cat)] ?? (u[g] = [])).push(v);
      });
      const m = Object.keys(u),
        f = {
          corr: c.corr,
          emol: c.emol,
          iss: c.iss,
          out: c.out,
          irrf: c.irrf,
        };
      m.forEach((v, g) => {
        const h = u[v],
          b = sum(h.map((C) => C.val)),
          y = g === m.length - 1,
          j = (C) => {
            const I = y ? f[C] : o((c[C] * b) / d);
            return ((f[C] = o(f[C] - I)), I);
          };
        let k = 0,
          A = "";
        if (v === "D") {
          const C = {};
          (h.forEach((I) => {
            var J;
            const se = C[(J = I.tk)] ?? (C[J] = { qc: 0, vc: 0, qv: 0, vv: 0 });
            I.cv === "C"
              ? ((se.qc += I.qty), (se.vc += I.val))
              : ((se.qv += I.qty), (se.vv += I.val));
          }),
            Object.values(C).forEach((I) => {
              const J = Math.min(I.qc, I.qv);
              J > 0 && (k += J * (I.vv / I.qv) - J * (I.vc / I.qc));
            }),
            Object.values(C).some((I) => I.qc !== I.qv) &&
              (A =
                "Day trade com quantidades de compra e venda diferentes: confira o resultado."));
        } else
          h.some(ntOpt)
            ? (A =
                "Opções: resultado bruto não calculado. Exclua e lance na mão, ou confira no fechamento da operação.")
            : h.forEach((C) => {
                if (C.cv === "V") {
                  const I = ntPm(C.tk, i.d);
                  I > 0
                    ? (k += (C.px - I) * C.qty)
                    : (A =
                        "Venda sem preço médio na Carteira: resultado bruto não calculado.");
                }
                NT.cart &&
                  !ntOpt(C) &&
                  a.lanc.push({
                    id: uid(),
                    mk: "BR",
                    tp: C.cv,
                    cl: s[v] || "acao",
                    tk: C.tk,
                    d: i.d,
                    q: C.qty,
                    p: C.px,
                    cs: o((p * C.val) / d),
                    src: l,
                  });
              });
        (A && r++,
          t.notas.push({
            id: uid(),
            d: i.d,
            m: v,
            bruto: o(k),
            vendas: o(sum(h.filter((C) => C.cv === "V").map((C) => C.val))),
            corr: j("corr"),
            emol: j("emol"),
            iss: j("iss"),
            out: j("out"),
            irrf: j("irrf"),
            src: l,
            av: A,
          }));
      });
      const x = i.c;
      (t.imp.push({
        id: l,
        key: i.key,
        corretora: i.corretora,
        nr: i.nr,
        d: i.d,
        vol: o(i.vol),
        liquido: x.liquido,
        det: {
          corr: o(x.corr),
          exe: o(x.exe + x.exc),
          ccor: o(x.ccor),
          liq: o(x.liq),
          reg: o(x.reg),
          termo: o(x.termo),
          ana: o(x.ana),
          emol: o(x.emol),
          transf: o(x.transf),
          iss: o(x.iss),
          out: o(x.out),
        },
        cost: { ...c },
        ops: i.ops.map((v) => ({
          cv: v.cv,
          tk: v.tk,
          qty: v.qty,
          px: v.px,
          val: v.val,
          cat: v.cat,
        })),
      }),
        n++);
    }),
    save(),
    (NT.notes = []),
    (NT.msg =
      n +
      " nota(s) importada(s)" +
      (r ? " · " + r + " lançamento(s) com aviso na aba Apuração." : ".")),
    (VW.IR = "im"),
    render());
}
function ntDel(e) {
  const t = S.ir || {};
  ((t.imp = (t.imp || []).filter((a) => a.id !== e)),
    (t.notas = (t.notas || []).filter((a) => a.src !== e)),
    S.cart && (S.cart.lanc = (S.cart.lanc || []).filter((a) => a.src !== e)),
    save(),
    render());
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a]");
  if (!t) return;
  const a = t.dataset.a;
  a === "ntok"
    ? ntImport()
    : a === "ntclr"
      ? ((NT.notes = []), (NT.msg = ""), render())
      : a === "ntdel" &&
        confirm(
          "Excluir esta nota importada? Os lançamentos de imposto e da Carteira gerados por ela também saem.",
        ) &&
        ntDel(t.dataset.id);
}),
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.id === "ntf" && t.files && t.files.length) {
      ((NT.busy = 1),
        (NT.msg = "Lendo " + t.files.length + " arquivo(s)…"),
        (NT.notes = []),
        render());
      const a = [],
        o = [],
        s = (S.ir || {}).imp || [];
      for (const n of Array.from(t.files))
        try {
          const r = ntParse(await ntRead(n));
          (r.length ||
            o.push(
              n.name +
                ": não achei operações da Bovespa (notas de futuros ainda não são lidas aqui).",
            ),
            a.push(...r));
        } catch (r) {
          o.push(n.name + ": " + (r.message || "não consegui ler."));
        }
      (a.forEach((n) => (n.dup = s.some((r) => r.key === n.key))),
        (NT.notes = a),
        (NT.msg = o.join(" · ")),
        (NT.busy = 0),
        (VW.IR = "im"),
        render());
    } else if (t.dataset && t.dataset.ntc !== void 0) {
      const [a, o] = t.dataset.ntc.split(":");
      NT.notes[a] &&
        NT.notes[a].ops[o] &&
        ((NT.notes[a].ops[o].cat = t.value), render());
    } else t.id === "ntcart" && (NT.cart = t.checked ? 1 : 0);
  }));
const irSeg = (e) =>
    `<div class="seg">${[
      ["ap", "🧾 Apuração"],
      ["im", "📥 Importar"],
      ["cu", "💸 Custos"],
    ]
      .map(
        ([t, a]) =>
          `<button class="${t === e ? "on" : ""}" data-a="vw" data-tp="IR" data-id="${t}">${a}</button>`,
      )
      .join("")}</div>`,
  ntBar = (e, t, a) => {
    const o = a > 0 ? (t / a) * 100 : 0;
    return `<div class="sm" style="margin-top:8px">${e} · ${f2(o)}% · ${money(t)}</div><div style="height:8px;border-radius:8px;background:var(--bd)"><div style="width:${o}%;height:8px;border-radius:8px;background:var(--ac)"></div></div>`;
  },
  ntKv = (e, t, a) =>
    `<div class="card"><span class="mut sm">${e}</span><b>${t}</b><span class="mut sm">${a || ""}</span></div>`,
  ntFd = (e) => (e ? e.split("-").reverse().join("/") : "sem data");
function vImpNotas() {
  const e = NT.notes,
    t = ((S.ir || {}).imp || []).slice().sort((s, n) => n.d.localeCompare(s.d)),
    a = (s, n, r) =>
      `<select data-ntc="${s}:${n}" style="margin-top:4px">${Object.entries(IRC)
        .map(
          ([i, l]) =>
            `<option value="${i}"${i === r ? " selected" : ""}>${l[0]}</option>`,
        )
        .join("")}</select>`,
    o = e.filter((s) => !s.dup && s.d).length;
  return `<div class="card"><b>📄 Importar nota de corretagem</b><div class="sm mut" style="margin-top:4px">Escolha o PDF da nota (pode ser mais de uma). O app lê as operações e as taxas, separa por tipo, calcula o resultado e lança na apuração, nos custos e na Carteira. Lê notas da Bovespa (ações, FIIs, ETFs). O PDF é lido no seu aparelho e nome e CPF da nota não são guardados. Precisa de internet para abrir o leitor de PDF.</div><label class="btn" style="margin-top:8px;display:block;text-align:center">${NT.busy ? "Lendo…" : "Escolher PDF(s)"}<input id="ntf" type="file" accept="application/pdf,.pdf" multiple hidden></label>${NT.msg ? `<div class="sm ${e.length || NT.busy || /importada/.test(NT.msg) ? "mut" : "r"}" style="margin-top:6px">${esc(NT.msg)}</div>` : ""}</div>
${
  e.length
    ? `<h2>Conferir antes de importar</h2>${e
        .map((s, n) => {
          const r = s.cost,
            i = r.corr + r.emol + r.iss + r.out;
          return `<div class="card"><div class="top"><b>${esc(s.corretora)} · nota ${esc(s.nr || "–")}</b><span class="sm">${ntFd(s.d)}</span></div>${s.dup ? '<div class="warn" style="margin:6px 0">Esta nota já foi importada e será ignorada.</div>' : ""}${s.d ? "" : '<div class="warn" style="margin:6px 0">Não achei a data do pregão: esta nota não será importada.</div>'}${s.ops.map((l, d) => `<div class="sm" style="margin-top:8px"><b class="${l.cv === "C" ? "g" : "r"}">${l.cv === "C" ? "Compra" : "Venda"}</b> ${esc(l.tk)} · ${l.qty} × ${f2(l.px)} = ${money(l.val)}${l.dt ? " · day trade" : ""}</div>${a(n, d, l.cat)}`).join("")}<div class="sm mut" style="margin-top:8px">Corretagem ${money(r.corr)} · Taxas B3 ${money(r.emol)} · ISS ${money(r.iss)} · Outros ${money(r.out)} · IRRF ${money(r.irrf)}</div><div class="sm"><b>Custos da nota: ${money(i)}</b>${s.c.liquido == null ? "" : " · líquido " + money(Math.abs(s.c.liquido)) + (s.c.liquido < 0 ? " (a pagar)" : " (a receber)")}</div></div>`;
        })
        .join("")}
<label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input id="ntcart" type="checkbox"${NT.cart ? " checked" : ""} style="width:auto;margin-top:3px"><span class="sm">Lançar compras e vendas na aba Carteiras (calcula o preço médio e o resultado das vendas; day trade e opções não entram)</span></label><div class="g2"><button class="btn" data-a="ntok"${o ? "" : " disabled"}>Importar ${o} nota(s)</button><button class="btn s" data-a="ntclr">Descartar</button></div>`
    : ""
}
<h2>Notas importadas (${t.length})</h2>${
    t.length
      ? t
          .map((s) => {
            const n = s.cost;
            return `<div class="card"><div class="top"><span><b>${ntFd(s.d)}</b> · ${esc(s.corretora)} · nota ${esc(s.nr || "–")}</span><button class="btn s" data-a="ntdel" data-id="${s.id}">Excluir</button></div><div class="sm mut">${s.ops.map((r) => (r.cv === "C" ? "C " : "V ") + r.tk + " " + r.qty).join(" · ")}</div><div class="sm mut">Volume ${money(s.vol)} · custos ${money(n.corr + n.emol + n.iss + n.out)}</div></div>`;
          })
          .join("")
      : '<p class="mut">Nenhuma nota importada ainda.</p>'
  }`;
}
function vImpCustos() {
  const e = irCalc(),
    t = S.ir || {},
    a = t.imp || [],
    o = t.notas || [],
    s = (x) => +x || 0,
    n = e.tot,
    r = n.corr + n.emol + n.iss + n.out,
    i = {},
    l = {},
    d = {},
    c = {};
  (a.forEach((x) => {
    for (const v in x.det) i[v] = (i[v] || 0) + s(x.det[v]);
    d[x.d.slice(0, 7)] = (d[x.d.slice(0, 7)] || 0) + s(x.vol);
  }),
    o.forEach((x) => {
      const v = x.d.slice(0, 7),
        g = s(x.corr) + s(x.emol) + s(x.iss) + s(x.out);
      ((l[v] = (l[v] || 0) + g), (c[x.m] = (c[x.m] || 0) + g));
    }));
  const p = sum(o.map((x) => s(x.irrf))),
    u = sum(a.map((x) => s(x.vol))),
    m = sum(a.map((x) => x.ops.length)),
    f = [
      ["Corretagem", i.corr || 0],
      ["Execução", i.exe || 0],
      ["Clearing da corretora", i.ccor || 0],
      ["Taxa de liquidação", i.liq || 0],
      ["Taxa de registro", i.reg || 0],
      ["Emolumentos", i.emol || 0],
      ["Taxa A.N.A.", i.ana || 0],
      ["Taxa de termo/opções", i.termo || 0],
      ["Transferência de ativos", i.transf || 0],
      ["ISS", i.iss || 0],
      ["Outras despesas", i.out || 0],
    ].filter((x) => x[1] > 0);
  return `<div class="kv">${ntKv("Total gasto", money(e.all), u > 0 ? f2((sum(a.map((x) => x.cost.corr + x.cost.emol + x.cost.iss + x.cost.out)) / u) * 100) + "% do volume importado" : "")}${ntKv("No ano", money(e.ano))}${ntKv("No mês", money(e.mes))}</div>
${m ? `<p class="sm mut">Custo médio por operação importada: ${money(sum(a.map((x) => x.cost.corr + x.cost.emol + x.cost.iss + x.cost.out)) / m)} · ${m} operação(ões) · volume ${money(u)}</p>` : ""}
<h2>Para onde vai o dinheiro</h2>${r > 0 ? ntBar("Corretagem", n.corr, r) + ntBar("Taxas B3 (liquidação, registro, emolumentos)", n.emol, r) + ntBar("ISS", n.iss, r) + ntBar("Outros", n.out, r) : '<p class="mut">Sem custos lançados.</p>'}
<h2>Detalhe das taxas</h2>${f.length ? f.map(([x, v]) => `<div class="top sm" style="margin-top:6px"><span>${x}</span><b>${money(v)}</b></div>`).join("") : '<p class="mut sm">O detalhe aparece para as notas importadas por PDF.</p>'}
<h2>Por tipo de operação</h2>${
    Object.keys(c).length
      ? Object.entries(c)
          .sort((x, v) => v[1] - x[1])
          .map(([x, v]) => ntBar(IRC[x] ? IRC[x][0] : x, v, r))
          .join("")
      : '<p class="mut">–</p>'
  }
<h2>Por mês</h2>${
    Object.keys(l).length
      ? Object.keys(l)
          .sort()
          .reverse()
          .map(
            (x) =>
              `<div class="card"><div class="top"><b>${new Date(x + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b><b>${money(l[x])}</b></div><div class="sm mut">${d[x] ? "Volume " + money(d[x]) + " · " + f2((l[x] / d[x]) * 100) + "% do volume" : "Lançado na mão"}</div></div>`,
          )
          .join("")
      : '<p class="mut">–</p>'
  }
<p class="sm mut" style="margin-top:10px">IRRF retido (não é custo, abate o imposto): ${money(p)}</p>`;
}
function vImposto() {
  const e = VW.IR || "ap";
  return (
    "<h1>Imposto de renda</h1>" +
    irSeg(e) +
    (e === "im" ? vImpNotas() : e === "cu" ? vImpCustos() : vImpostoAp())
  );
}
const CCL = {
    acao: "Ações",
    etf: "ETFs",
    fii: "FII/REIT",
    tesouro: "Tesouro",
    rf: "Renda fixa",
    outro: "Outros",
  },
  usdf = (e) =>
    (+e).toLocaleString("en-US", { style: "currency", currency: "USD" }),
  cmo = (e, t) => (e === "US" ? usdf(t) : money(t));
var carCalc;
function carSnap() {
  const e = carCalc(),
    t = loc().slice(0, 10),
    a = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} }),
    o = a.snap ?? (a.snap = {}),
    s = (r) => +r.toFixed(2),
    n = {
      BR: { v: s(e.BR.v), c: s(e.BR.c) },
      US: { v: s(e.US.v), c: s(e.US.c) },
    };
  return (
    e.BR.v + e.US.v > 0 &&
      JSON.stringify(o[t]) !== JSON.stringify(n) &&
      ((o[t] = n), save()),
    e
  );
}
function carChart(e) {
  const t = (S.cart || {}).snap || {},
    a = Object.keys(t)
      .filter((f) => t[f][e] && t[f][e].v > 0)
      .sort();
  if (a.length < 2)
    return `<p class="mut sm">O gráfico de evolução se forma com o uso: o app grava um ponto por dia em que você abre esta aba (falta ${2 - a.length}).</p>`;
  const o = a.map((f) => t[f][e].v),
    s = a.map((f) => t[f][e].c),
    n = o.concat(s),
    r = Math.min(...n),
    i = Math.max(...n),
    l = 320,
    d = 140,
    c = (f) => 8 + (f * (l - 16)) / (a.length - 1),
    p = (f) => d - 10 - ((f - r) / (i - r || 1)) * (d - 24),
    u = (f) =>
      f.map((x, v) => c(v).toFixed(1) + "," + p(x).toFixed(1)).join(" "),
    m = (f) => f.split("-").reverse().join("/");
  return `<svg viewBox="0 0 ${l} ${d}" style="width:100%;height:auto"><polyline points="${u(s)}" fill="none" stroke="#8a93a3" stroke-width="1.5" stroke-dasharray="4 3"/><polyline points="${u(o)}" fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linejoin="round"/></svg><div class="sm mut top"><span>${m(a[0])}</span><span>linha cheia: patrimônio · tracejada: investido</span><span>${m(a[a.length - 1])}</span></div>`;
}
let CARMSG = "";
async function carPrecos() {
  const e = cfg();
  if (!e) {
    alert("Configure o Supabase em config.js para buscar preços.");
    return;
  }
  if (!SESS) {
    alert("Entre na sua conta (Mais → Conta) para buscar preços.");
    return;
  }
  const t = carCalc(),
    a = t.BR.pos.map((s) => s.tk),
    o = t.US.pos.map((s) => s.tk);
  if (!a.length && !o.length) {
    alert("Lance uma posição primeiro.");
    return;
  }
  ((CARMSG = "Buscando preços…"), render());
  try {
    await tok();
    const s = await fetch(e.url + "/functions/v1/precos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: e.key,
        Authorization: "Bearer " + SESS.at,
      },
      body: JSON.stringify({ br: a, us: o }),
    });
    if (s.status === 401)
      throw new Error("Entre na sua conta de novo (Mais → Conta).");
    const n = await s.json();
    if (!s.ok) throw new Error(n.erro || "Erro " + s.status);
    const r = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} }),
      i = loc().slice(0, 10);
    let l = 0;
    for (const [c, p] of [
      ["BR", n.br || {}],
      ["US", n.us || {}],
    ])
      for (const u in p)
        p[u] > 0 &&
          (((r.px ?? (r.px = {}))[c + ":" + u] = { p: p[u], d: i }), l++);
    (n.fx > 0 && (r.fx = n.fx), save());
    const d = n.erros || [];
    CARMSG =
      l +
      " preço(s) atualizado(s) às " +
      hm() +
      (d.length
        ? ". Sem resposta: " +
          d.join(", ") +
          " (no plano gratuito, tente de novo em 1 minuto)."
        : ".");
  } catch (s) {
    CARMSG = "Falha: " + em(s);
  }
  render();
}
function vCarteiras() {
  const e = carSnap(),
    t = (S.ax || {})["cart.mk"] || "BR",
    a = e[t],
    o = +(S.cart || {}).fx || 0,
    s = ((S.cart || {}).lanc || [])
      .slice()
      .sort((d, c) => c.d.localeCompare(d.d)),
    n = a.v - a.c,
    r = (d, c, p = "number") =>
      `<label>${c}<input id="${d}" type="${p}" step="any" inputmode="decimal"></label>`,
    i = (d, c, p, u) =>
      `<div class="card"><span class="mut sm">${d}</span><b${u ? ` class="${u}"` : ""}>${c}</b><span class="mut sm">${p || ""}</span></div>`,
    l = {};
  return (
    a.pos.forEach((d) => (l[d.cl] = (l[d.cl] || 0) + d.v)),
    `<h1>Carteiras</h1><div class="g2"><button class="${t === "BR" ? "btn" : "btn s"}" data-a="cmk" data-id="BR">🇧🇷 Brasil</button><button class="${t === "US" ? "btn" : "btn s"}" data-a="cmk" data-id="US">🇺🇸 EUA (US$)</button></div>
<button class="btn s" data-a="carPx" style="margin-top:10px;width:100%">Atualizar preços</button><div class="sm mut" style="margin-top:4px">${esc(CARMSG)}</div>
<div class="kv" style="margin-top:12px">${i("Patrimônio", cmo(t, a.v), t === "US" && o > 0 ? "≈ " + money(a.v * o) : "")}${i("Investido", cmo(t, a.c))}${i("Resultado", cmo(t, n), f2(a.c > 0 ? (n / a.c) * 100 : 0) + "%", n >= 0 ? "g" : "r")}${i("Proventos", cmo(t, a.prov), "recebidos")}${i("Lucro realizado", cmo(t, a.real), "vendas", a.real >= 0 ? "g" : "r")}</div>
${t === "US" ? `<div class="card"><label>Dólar de hoje (R$) para converter<input type="number" step="any" inputmode="decimal" data-cfx="1" value="${o || ""}"></label></div>` : ""}
<h2>Evolução</h2><div class="card">${carChart(t)}</div>
<h2>Alocação por classe</h2>${
      a.v > 0
        ? Object.entries(l)
            .sort((d, c) => c[1] - d[1])
            .map(([d, c]) => {
              const p = (c / a.v) * 100;
              return `<div class="sm" style="margin-top:8px">${CCL[d] || d} · ${f2(p)}% · ${cmo(t, c)}</div><div style="height:8px;border-radius:8px;background:var(--bd)"><div style="width:${p}%;height:8px;border-radius:8px;background:var(--ac)"></div></div>`;
            })
            .join("")
        : '<p class="mut">Sem posições neste mercado.</p>'
    }
<h2>Posições</h2>${a.pos.map((d) => `<div class="card"><div class="top"><b>${esc(d.tk)} <span class="mut sm">${CCL[d.cl] || d.cl}</span></b><b class="${d.lu >= 0 ? "g" : "r"}">${cmo(t, d.lu)} (${f2(d.pc)}%)</b></div><div class="sm mut" style="margin:4px 0">${f2(d.q)} un · PM ${cmo(t, d.pm)} · valor ${cmo(t, d.v)}${d.tem ? "" : " · sem preço atual (usando PM)"}</div><label>Preço atual<input type="number" step="any" inputmode="decimal" data-cpx="${esc(d.mk + ":" + d.tk)}" value="${d.tem ? d.pa : ""}"></label></div>`).join("") || '<p class="mut">Nenhuma posição. Lance uma compra abaixo.</p>'}
<h2>Novo lançamento</h2><div class="card"><div class="g2"><label>Mercado<select id="c_mk"><option value="BR"${t === "BR" ? " selected" : ""}>Brasil</option><option value="US"${t === "US" ? " selected" : ""}>EUA</option></select></label><label>Tipo<select id="c_tp"><option value="C">Compra</option><option value="V">Venda</option><option value="P">Provento</option></select></label></div><div class="g2"><label>Classe<select id="c_cl">${Object.entries(
      CCL,
    )
      .map(([d, c]) => `<option value="${d}">${c}</option>`)
      .join(
        "",
      )}</select></label><label>Ticker<input id="c_tk" type="text" autocapitalize="characters"></label></div><div class="g2">${r("c_d", "Data", "date")}${r("c_q", "Quantidade")}</div><div class="g2">${r("c_p", "Preço unitário (provento: valor total)")}${r("c_cs", "Custos")}</div><button class="btn" data-a="carAdd" style="margin-top:10px">Adicionar</button></div>
<h2>Lançamentos</h2>${s.map((d) => `<div class="card"><div class="top"><span><b>${d.d.split("-").reverse().join("/")}</b> · ${{ C: "Compra", V: "Venda", P: "Provento" }[d.tp]} ${esc(d.tk)} (${d.mk})</span><button class="btn s" data-a="carDel" data-id="${d.id}">Excluir</button></div><div class="sm mut">${+d.q || ""} × ${cmo(d.mk, +d.p || 0)}${+d.cs ? " · custos " + cmo(d.mk, +d.cs) : ""}</div></div>`).join("")}
<p class="sm mut">Toque em “Atualizar preços” para buscar cotações (brapi no Brasil, Twelve Data nos EUA, com atraso). Você também pode digitar o preço manualmente, útil para Tesouro. O app grava um ponto por dia para o gráfico.</p>`
  );
}
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.cpx) {
    const a = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} });
    (((a.px ?? (a.px = {}))[t.dataset.cpx] = {
      p: +t.value || 0,
      d: loc().slice(0, 10),
    }),
      save(),
      render());
  } else
    t.dataset.cfx &&
      (((S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} })).fx =
        +t.value || 0),
      save(),
      render());
});
function fixS() {
  const e = (t) => (t && typeof t == "object" && !Array.isArray(t) ? t : {});
  ((!S || typeof S != "object") && (S = {}),
    (S.trades = (Array.isArray(S.trades) ? S.trades : [])
      .filter((t) => t && typeof t == "object")
      .map(
        (t) => (
          (typeof t.dt != "string" || !t.dt) &&
            (t.dt =
              typeof t.dtx == "string" && t.dtx ? t.dtx : "2000-01-01T00:00"),
          t
        ),
      )),
    (S.days = e(S.days)));
  for (const t of Object.keys(S.days)) {
    const a = (S.days[t] = e(S.days[t]));
    (a.chk && typeof a.chk == "object" && !Array.isArray(a.chk)) ||
      (a.chk = {});
  }
  ((S.rules = (Array.isArray(S.rules) ? S.rules : []).filter(
    (t) => t && typeof t == "object",
  )),
    ["ax", "rev", "pn", "del"].forEach((t) => {
      S[t] != null &&
        (typeof S[t] != "object" || Array.isArray(S[t])) &&
        (S[t] = {});
    }));
}
