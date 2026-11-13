document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-eqp]");
  if (!t) return;
  EQ.p = t.dataset.eqp;
  try {
    ls.set("diario-eq-p", EQ.p);
  } catch {}
  const a = document.getElementById("eqc");
  if (a) {
    const o = document.createElement("div");
    ((o.innerHTML = eqHtml()), a.replaceWith(o.firstElementChild || o));
  }
});
var HMY = new Date().getFullYear();
function hmHtml() {
  const e = eqDias(),
    t = HMY,
    a = new Date(t, 0, 1),
    o = (a.getDay() + 6) % 7,
    s = [];
  for (
    let h = new Date(t, 0, 1);
    h.getFullYear() === t;
    h.setDate(h.getDate() + 1)
  )
    s.push(ymd(h));
  const n = s.map((h) => e[h]).filter((h) => h != null),
    r = Math.max(1, ...n.map(Math.abs)),
    i = 13,
    l = 3,
    d = Math.ceil((s.length + o) / 7),
    c = d * (i + l),
    p = 7 * (i + l),
    u = (h) => {
      if (h == null) return "var(--card2,#1d1e21)";
      const b = 0.25 + 0.75 * Math.min(1, Math.abs(h) / r);
      return h >= 0
        ? `rgba(22,199,132,${b.toFixed(2)})`
        : `rgba(246,70,93,${b.toFixed(2)})`;
    },
    m = n.filter((h) => h > 0).length,
    f = n.filter((h) => h < 0).length,
    x = n.reduce((h, b) => h + b, 0);
  let v = "";
  s.forEach((h, b) => {
    const y = b + o,
      j = Math.floor(y / 7),
      k = y % 7,
      A = e[h];
    v += `<rect x="${j * (i + l)}" y="${k * (i + l)}" width="${i}" height="${i}" rx="3" fill="${u(A)}" data-hmd="${h}"><title>${fmtD(h)}${A != null ? ": " + money(A) : ""}</title></rect>`;
  });
  const g = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
    .map(
      (h, b) =>
        `<text x="${Math.floor((Math.round((new Date(t, b, 1) - a) / 864e5) + o) / 7) * (i + l)}" y="-4" font-size="10" fill="var(--mut)">${h}</text>`,
    )
    .join("");
  return `<div class="card" id="hmc"><div class="top"><b>🟩 ${t} em quadradinhos</b><div class="hub2" style="margin:0"><button data-hmy="-1" style="padding:4px 10px">‹</button><button data-hmy="1" style="padding:4px 10px">›</button></div></div>
<div class="hmsc" style="overflow-x:auto;margin-top:8px"><svg viewBox="0 -14 ${c} ${p + 14}" style="width:${c}px;max-width:none;height:auto" role="img" aria-label="Resultado por dia no ano">${g}${v}</svg></div>
<div class="sm" style="margin-top:6px">${n.length} dias operados · <span class="g">${m} positivos</span> · <span class="r">${f} negativos</span> · total <b class="${cls(x)}">${money(x)}</b></div><div class="sm mut">Toque num dia para abrir o Meu dia daquela data. Quanto mais forte a cor, maior o resultado.</div></div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-hmy]");
  if (t) {
    HMY += +t.dataset.hmy;
    const o = document.getElementById("hmc");
    if (o) {
      const s = document.createElement("div");
      s.innerHTML = hmHtml();
      const n = s.firstElementChild;
      o.replaceWith(n);
      const r = n.querySelector(".hmsc");
      r &&
        (r.scrollLeft = HMY === new Date().getFullYear() ? r.scrollWidth : 0);
    }
    return;
  }
  const a = e.target.closest("[data-hmd]");
  a && ((D = a.dataset.hmd), irPara("dia"), scrollTo(0, 0));
});
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.querySelector("#hmc .hmsc");
      t && HMY === new Date().getFullYear() && (t.scrollLeft = t.scrollWidth);
    } catch {}
  };
}
{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    try {
      const a = t.indexOf("<h2>Revisão do período</h2>");
      if (a > 0) return t.slice(0, a) + hmHtml() + t.slice(a);
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
function cqLista() {
  const e = S.trades
      .map((y) => ({ t: y, c: calc(y) }))
      .filter((y) => y.c.pl != null),
    t = e.length,
    a = eqDias(),
    o = {};
  Object.entries(a).forEach(([y, j]) => {
    o[y.slice(0, 7)] = (o[y.slice(0, 7)] || 0) + j;
  });
  const s = Object.keys(o)
      .sort()
      .filter((y) => y < ymd(new Date()).slice(0, 7)),
    n = s.filter((y) => o[y] > 0).length;
  let r = 0,
    i = 0;
  s.forEach((y) => {
    ((r = o[y] > 0 ? r + 1 : 0), (i = Math.max(i, r)));
  });
  let l = { rec: 0 },
    d = { rec: 0 };
  try {
    const y = stkDias();
    ((l = stkSeq(y, stkF.regras)), (d = stkSeq(y, stkF.prep)));
  } catch {}
  const c = e.filter((y) => y.c.r != null && y.c.r < 0 && y.c.r >= -1.1).length,
    p = (() => {
      try {
        return cnS();
      } catch {
        return { sims: [], r: {} };
      }
    })(),
    u = Object.values(p.r || {}).reduce((y, j) => y + (j.n || 0), 0),
    m = (p.sims || []).some((y) => y.ac >= Math.ceil((40 * y.tot) / 60)),
    f = (S.planos || []).reduce(
      (y, j) =>
        y +
        j.materias.reduce((k, A) => k + A.top.filter((C) => C.feito).length, 0),
      0,
    ),
    x = (S.replay || []).length,
    v = {};
  e.forEach((y) => {
    if (y.c.r == null) return;
    const j = String(y.t.dtx || y.t.dt).slice(0, 7);
    v[j] = (v[j] || 0) + y.c.r;
  });
  const g = Math.max(0, ...Object.values(v)),
    h = Object.keys(o).some((y) => {
      const j = e.filter((k) => String(k.t.dtx || k.t.dt).slice(0, 7) === y);
      return j.length >= 10 && j.every((k) => !k.t.err || k.t.err === "Nenhum");
    }),
    b = (y, j, k, A, C, I) => ({
      id: y,
      ic: j,
      nome: k,
      desc: A,
      cur: Math.min(C, I),
      alvo: I,
      ok: C >= I,
    });
  return [
    b(
      "t1",
      "🚀",
      "Primeiro passo",
      "Registrar o primeiro trade encerrado",
      t,
      1,
    ),
    b("t100", "💯", "Centena", "100 trades registrados", t, 100),
    b("t500", "🏛️", "Veterano", "500 trades registrados", t, 500),
    b("m1", "📗", "Mês verde", "Fechar um mês no positivo", n, 1),
    b("m3", "🔥", "Trinca", "3 meses positivos seguidos", i, 3),
    b("m6", "👑", "Consistência", "6 meses positivos seguidos", i, 6),
    b(
      "r10",
      "📏",
      "Disciplina 10",
      "10 dias seguidos seguindo as regras",
      l.rec,
      10,
    ),
    b(
      "r30",
      "🛡️",
      "Disciplina 30",
      "30 dias seguidos seguindo as regras",
      l.rec,
      30,
    ),
    b("p20", "☀️", "Ritual", "20 manhãs seguidas com preparação", d.rec, 20),
    b(
      "s30",
      "🧯",
      "Stop é stop",
      "30 perdas dentro do stop planejado (até 1,1× o risco)",
      c,
      30,
    ),
    b(
      "e10",
      "🎯",
      "Mês limpo",
      "Um mês com 10+ trades e nenhum erro marcado",
      h ? 1 : 0,
      1,
    ),
    b(
      "R10",
      "💎",
      "10× o risco no mês",
      "Somar +10× o risco num único mês",
      Math.round(g * 10) / 10,
      10,
    ),
    b("c500", "📚", "Estudante", "500 questões respondidas na CNPI-T", u, 500),
    b(
      "cap",
      "🎓",
      "Aprovado no simulado",
      "Nota de aprovação num simulado da CNPI-T",
      m ? 1 : 0,
      1,
    ),
    b(
      "pl25",
      "🗓️",
      "Plano em dia",
      "25 tópicos estudados nos planos de estudo",
      f,
      25,
    ),
    b(
      "rp10",
      "▶️",
      "Treino de replay",
      "10 operações no treino com replay",
      x,
      10,
    ),
  ];
}
const CQ_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5l2.2 5.5M16 2.5l-2.2 5.5"/><circle cx="12" cy="14.5" r="6.5"/><path d="M12 11.2l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/></svg>';
function cqHtml() {
  const e = cqLista();
  return `<div class="card" id="cqc"><div class="top"><b>🏅 Conquistas</b><span class="sm mut">${e.filter((t) => t.ok).length} de ${e.length}</span></div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${e.map((t) => `<span title="${esc(t.nome)}" style="width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:20px;${t.ok ? "background:rgba(187,142,59,0.15);border:2px solid #bb8e3b;color:#bb8e3b;box-shadow:0 0 10px rgba(187,142,59,0.35)" : "border:2px dashed var(--bd2,#555);opacity:.35"}">${CQ_SVG}</span>`).join("")}</div>
<details style="margin-top:6px"><summary class="sm" style="cursor:pointer">Ver todas</summary>${e.map((t) => `<div style="display:flex;gap:8px;align-items:center;margin:8px 0"><span style="display:inline-flex;${t.ok ? "color:#bb8e3b" : "opacity:.4"}">${CQ_SVG}</span><div style="flex:1"><b class="sm">${esc(t.nome)}</b>${t.ok ? ' <span class="g sm">✓</span>' : ""}<div class="sm mut">${esc(t.desc)}</div>${t.ok ? "" : `<div class="cnbar" style="margin-top:3px"><b style="width:${(t.cur / t.alvo) * 100}%"></b></div><div class="sm mut">${String(t.cur).replace(".", ",")} de ${t.alvo}</div>`}</div></div>`).join("")}</details></div>`;
}
function cqNovas() {
  try {
    const e = cqLista()
        .filter((o) => o.ok)
        .map((o) => o.id),
      t = (S.ax || {}).cqv;
    if (!t) {
      (((S.ax ?? (S.ax = {})).cqv = e), save());
      return;
    }
    const a = e.filter((o) => !t.includes(o));
    if (a.length) {
      ((S.ax.cqv = e), save());
      const o = cqLista().find((s) => s.id === a[0]);
      toast(`🏅 Conquista desbloqueada: ${o.nome}!`, 4500);
    }
  } catch {}
}
(setTimeout(cqNovas, 4e3),
  setInterval(() => {
    document.hidden || cqNovas();
  }, 2e4));
var RTR = null;
function rtrDados(e) {
  const [t, a] = perRange(e),
    o = mesNum(t, a),
    [s, n] = mesAnterior(t),
    r = mesNum(s, n),
    i = {};
  S.trades.forEach((c) => {
    const p = calc(c);
    if (p.pl == null || p.r == null) return;
    const u = String(c.dtx || c.dt).slice(0, 10);
    if (u < t || u > a) return;
    const m = String(c.dt).slice(11, 13);
    m && (i[m] ?? (i[m] = { n: 0, r: 0 }), i[m].n++, (i[m].r += p.r));
  });
  const l = Object.entries(i)
    .filter(([, c]) => c.n >= 2)
    .sort((c, p) => p[1].r - c[1].r);
  let d = 0;
  try {
    d = stkSeq(stkDias(), stkF.regras).rec;
  } catch {}
  return {
    k: e,
    a: t,
    b: a,
    nome: mesNome(t),
    M: o,
    A: r,
    ouro: l[0],
    pior: l.length > 1 ? l[l.length - 1] : null,
    rec: d,
  };
}
function rtrSlides(e) {
  const t = e.M,
    a = e.A,
    o = (d) => (d == null ? "–" : Math.round(d * 100) + "%"),
    s = t.setups[0],
    n = t.erros[0],
    r = +capRef() || 0,
    i = r > 0 ? (t.P / r) * 100 : null,
    l = (d, c, p) =>
      d == null || c == null
        ? ""
        : `<div style="font-size:18px;opacity:.85;margin-top:6px">${d >= c ? "▲" : "▼"} ${p(Math.abs(d - c))} vs ${mesNome(e.a).split(" ")[0] === "janeiro" ? "mês anterior" : "o mês anterior"}</div>`;
  return [
    {
      bg: "#6b98c0,#9a9283",
      h: `<div style="font-size:20px;opacity:.85">Sua retrospectiva</div><div style="font-size:48px;font-weight:900;line-height:1.05;margin:10px 0">${esc(e.nome)}</div><div style="font-size:20px;opacity:.85">Toque para avançar</div>`,
    },
    {
      bg: "#2a2c31,#ac8439",
      h: `<div style="font-size:20px;opacity:.85">Você fez</div><div style="font-size:72px;font-weight:900">${t.n}</div><div style="font-size:22px">operações, com <b>${o(t.acerto)}</b> de acerto</div>${i != null ? `<div style="font-size:48px;font-weight:900;margin-top:16px">${i >= 0 ? "+" : ""}${i.toFixed(2).replace(".", ",")}%</div><div style="font-size:18px;opacity:.85">sobre a conta</div>` : ""}${l(t.acerto, a.acerto, (d) => Math.round(d * 100) + " pp de acerto")}`,
    },
    {
      bg: "#7c2012,#c2943e",
      h: s
        ? `<div style="font-size:20px;opacity:.85">Seu melhor setup foi</div><div style="font-size:48px;font-weight:900;margin:10px 0">${esc(s[0])}</div><div style="font-size:22px">${s[1].n} trades · ${s[1].n ? Math.round((s[1].w / s[1].n) * 100) : 0}% de acerto</div>`
        : '<div style="font-size:28px">Marque o setup nos trades para descobrir qual paga mais.</div>',
    },
    {
      bg: "#34373c,#37a46d",
      h: e.ouro
        ? `<div style="font-size:20px;opacity:.85">Seu horário de ouro</div><div style="font-size:72px;font-weight:900">${e.ouro[0]}h</div><div style="font-size:22px">${e.ouro[1].r >= 0 ? "+" : ""}${e.ouro[1].r.toFixed(1).replace(".", ",")}× em ${e.ouro[1].n} trades</div>${e.pior && e.pior[1].r < 0 ? `<div style="font-size:18px;margin-top:18px;opacity:.9">E o horário para evitar: <b>${e.pior[0]}h</b> (${e.pior[1].r.toFixed(1).replace(".", ",")}×)</div>` : ""}`
        : '<div style="font-size:28px">Poucos trades com horário para achar o seu horário de ouro.</div>',
    },
    {
      bg: "#7f2a1d,#e7614c",
      h: n
        ? `<div style="font-size:20px;opacity:.85">O erro que mais custou</div><div style="font-size:40px;font-weight:900;margin:10px 0">${esc(n[0])}</div><div style="font-size:22px">${n[1].n} vez(es)</div><div style="font-size:18px;opacity:.9;margin-top:14px">Corrigir só esse erro já muda o próximo mês.</div>`
        : '<div style="font-size:20px;opacity:.85">Erros marcados</div><div style="font-size:64px;font-weight:900">0</div><div style="font-size:22px">Mês sem erro marcado. 👏</div>',
    },
    {
      bg: "#2c2e33,#c73720",
      h: `<div style="font-size:20px;opacity:.85">Disciplina</div><div style="font-size:64px;font-weight:900">${o(t.regras)}</div><div style="font-size:22px">dos trades dentro das regras</div><div style="font-size:20px;margin-top:14px">☀️ ${t.prep} de ${t.util} manhãs com preparação<br>🔥 recorde: ${e.rec} dias seguidos nas regras</div>${l(t.regras, a.regras, (d) => Math.round(d * 100) + " pp nas regras")}`,
    },
    {
      bg: "#030404,#1e2023",
      h: `<div style="font-size:20px;opacity:.85">Feche o mês em grande</div><div style="font-size:36px;font-weight:900;margin:12px 0">Compartilhe o seu resultado</div><button class="btn" data-shr="per:${e.k}" style="margin-top:10px">📸 Gerar o card do mês</button><div style="font-size:16px;opacity:.7;margin-top:18px">Grandes resultados vêm de grandes hábitos.</div>`,
    },
  ];
}
function rtrAbre(e) {
  const t = rtrDados(e);
  RTR = { R: t, S: rtrSlides(t), i: 0 };
  let a = document.getElementById("rtrov");
  (a ||
    ((a = document.createElement("div")),
    (a.id = "rtrov"),
    document.body.appendChild(a)),
    (document.body.style.overflow = "hidden"),
    rtrPinta());
}
function rtrPinta() {
  const e = document.getElementById("rtrov");
  if (!e || !RTR) return;
  const t = RTR.S[RTR.i],
    [a, o] = t.bg.split(",");
  (clearTimeout(rtrPinta._t),
    (e.style.cssText = `position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,${a},${o});color:#ffffff;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top) + 14px) 22px 30px`),
    (e.innerHTML = `<div style="display:flex;gap:4px">${RTR.S.map((s, n) => `<i style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,${n <= RTR.i ? 0.95 : 0.3})"></i>`).join("")}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><b style="font-size:15px">📅 Diário de Trader</b><button data-rtr="x" style="background:none;border:0;color:#ffffff;font-size:28px">✕</button></div>
<div data-rtr="prox" style="flex:1;display:flex;flex-direction:column;justify-content:center;animation:rtrIn .45s ease">${t.h}</div><div style="font-size:13px;opacity:.7;text-align:center">${RTR.i + 1} de ${RTR.S.length}</div>`),
    RTR.i < RTR.S.length - 1 &&
      (rtrPinta._t = setTimeout(() => {
        RTR && document.getElementById("rtrov") && (RTR.i++, rtrPinta());
      }, 6500)));
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-rtr]");
    if (t && !e.target.closest("[data-shr]")) {
      const a = t.dataset.rtr;
      if (a === "x") {
        clearTimeout(rtrPinta._t);
        const o = document.getElementById("rtrov");
        (o && o.remove(), (RTR = null), (document.body.style.overflow = ""));
        return;
      }
      if (a === "prox" && RTR) {
        RTR.i < RTR.S.length - 1 && (RTR.i++, rtrPinta());
        return;
      }
      (a === "m" || a === "pm") && rtrAbre(a);
      return;
    }
    if (e.target.closest("#rtrov [data-shr]")) {
      clearTimeout(rtrPinta._t);
      const a = document.getElementById("rtrov");
      (a && a.remove(), (RTR = null));
    }
  },
  !0,
),
  (function () {
    const e = TraderStyles.slot("legacy-041");
    ((e.textContent = TraderStyles.css("legacy-041")), TraderStyles.mount(e));
  })());
function iniExtras() {
  const e = new Date().getDate(),
    [t] = perRange("pm"),
    a = mesNum(...perRange("pm").slice(0, 2)).n > 0;
  return `<div class="card" id="shrper"><div class="top"><b>📸 Compartilhar resultado</b></div><div class="g3" style="gap:6px;margin-top:8px"><button class="btn s" data-shr="per:d">Hoje</button><button class="btn s" data-shr="per:w">Semana</button><button class="btn s" data-shr="per:m">Mês</button></div>
${e <= 7 && a ? `<button class="btn" data-rtr="pm" style="width:100%;margin-top:8px">▶ Sua retrospectiva de ${esc(mesNome(t).split(" ")[0])} está pronta</button>` : '<button class="btn s" data-rtr="m" style="width:100%;margin-top:8px">▶ Retrospectiva do mês até agora</button>'}</div>${eqHtml()}${cqHtml()}`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#shrper")) return;
      const a = t.querySelector("#stk"),
        o = document.createElement("div");
      o.innerHTML = iniExtras();
      const s = document.createDocumentFragment();
      if (([...o.children].forEach((n) => s.appendChild(n)), a)) a.after(s);
      else {
        const n = t.querySelector("h2");
        n ? n.before(s) : t.appendChild(s);
      }
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = relMesHtml;
  relMesHtml = function (t, a, o) {
    return e
      .apply(this, arguments)
      .replace(
        '<button class="btn s" data-mespdf=',
        `<button class="btn s" data-rtr="${t === perRange("pm")[0] ? "pm" : "m"}" style="margin-right:6px">▶ Retrospectiva</button><button class="btn s" data-mespdf=`,
      );
  };
}
const PRIV = {
    on: (() => {
      try {
        return ls.get("diario-priv") ? 1 : 0;
      } catch {
        return 0;
      }
    })(),
  },
  PRIV_RX = /(-?\s?(?:R\$|US\$)\s?-?[\d.]+(?:,\d+)?(?:\s?(?:mi|mil))?)/g;
function privAplica(e) {
  if (!PRIV.on || !e) return;
  const t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, {
      acceptNode: (o) =>
        o.parentElement &&
        /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(o.parentElement.tagName)
          ? 2
          : /(R\$|US\$)/.test(o.nodeValue)
            ? 1
            : 2,
    }),
    a = [];
  for (; t.nextNode(); ) a.push(t.currentNode);
  a.forEach((o) => {
    o.nodeValue = o.nodeValue.replace(
      PRIV_RX,
      (s) => (/US\$/.test(s) ? "US$" : "R$") + " •••",
    );
  });
}
{
  const e = render0;
  render0 = function () {
    (e.apply(this, arguments),
      PRIV.on &&
        (privAplica(document.getElementById("app")),
        setTimeout(() => privAplica(document.getElementById("app")), 60)));
  };
}
new MutationObserver((e) => {
  if (PRIV.on)
    for (const t of e)
      for (const a of t.addedNodes)
        a.nodeType === 1 &&
          (a.id === "fx" || (a.closest && a.closest("#fx,#sh"))) &&
          setTimeout(() => privAplica(a), 20);
}).observe(document.body, { childList: !0, subtree: !0 });
function privBotao() {
  let e = document.getElementById("privb");
  (e ||
    ((e = document.createElement("button")),
    (e.id = "privb"),
    e.setAttribute("aria-label", "Esconder valores"),
    (e.style.cssText =
      "position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom) + 86px);z-index:50;width:40px;height:40px;border-radius:50%;border:1px solid var(--bd);background:var(--card);color:var(--tx);box-shadow:0 4px 14px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;padding:0"),
    document.body.appendChild(e),
    e.addEventListener("click", () => {
      PRIV.on = PRIV.on ? 0 : 1;
      try {
        ls.set("diario-priv", PRIV.on ? 1 : "");
      } catch {}
      (privBotao(),
        render(),
        toast(PRIV.on ? "Valores escondidos (R$ •••)." : "Valores visíveis."));
    })),
    (e.innerHTML = PRIV.on
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.8M6.5 7.6A17 17 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/></svg>'),
    (e.style.color = PRIV.on ? "var(--ac)" : "var(--tx)"));
}
if ((setTimeout(privBotao, 500), "serviceWorker" in navigator))
  try {
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (!(e.data || {}).novaVersao || document.getElementById("upbar"))
        return;
      const t = document.createElement("div");
      ((t.id = "upbar"),
        (t.style.cssText =
          "position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 84px);z-index:9998;background:var(--ac,#86abcb);color:#ffffff;border-radius:16px;padding:12px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,0.3)"),
        (t.innerHTML =
          '<span style="flex:1;font-size:14px"><b>Versão nova pronta.</b> Toque para atualizar.</span><button style="background:#ffffff;color:#111111;border:0;border-radius:12px;padding:8px 12px;font-weight:700">Atualizar</button>'),
        t.addEventListener("click", () => location.reload()),
        document.body.appendChild(t));
    });
  } catch {}
function netAviso() {
  let e = document.getElementById("netbar");
  if (navigator.onLine) {
    e && e.remove();
    return;
  }
  e ||
    ((e = document.createElement("div")),
    (e.id = "netbar"),
    (e.style.cssText =
      "position:fixed;top:calc(env(safe-area-inset-top) + 6px);left:50%;transform:translateX(-50%);z-index:9998;background:#111111;color:#ffffff;border-radius:999px;padding:6px 14px;font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,0.3)"),
    (e.textContent = "Sem internet: mostrando a última cópia salva"),
    document.body.appendChild(e));
}
(addEventListener("online", netAviso),
  addEventListener("offline", netAviso),
  setTimeout(netAviso, 1e3));
{
  let e = 0;
  new MutationObserver(() => {
    !PRIV.on ||
      e ||
      (e = requestAnimationFrame(() => {
        ((e = 0), privAplica(document.getElementById("app")));
      }));
  }).observe(document.getElementById("app") || document.body, {
    subtree: !0,
    childList: !0,
    characterData: !0,
  });
}
const ehIdx = (e) =>
    /^(WIN|IND|WDO|DOL|BOVA11|BGI|SMAL11)/.test(String(e || "").toUpperCase()),
  flwFresco = () => FLW.d && Date.now() - FLW.ts < 20 * 6e4;
function ewzMarca() {
  if (!T || !isNew || T.ewz || (T.ativo && !ehIdx(T.ativo))) return;
  if (!flwFresco()) {
    try {
      typeof SESS < "u" && SESS && flwCarrega(!1);
    } catch {}
    return;
  }
  const e = FLW.d;
  T.ewz = { v: e.vies, nc: e.netC, np: e.netP, ts: Date.now() };
}
function ewzChip() {
  if (!T || QM || (T.ativo && !ehIdx(T.ativo))) return "";
  const e =
    T.ewz ||
    (flwFresco() ? { v: FLW.d.vies, nc: FLW.d.netC, np: FLW.d.netP } : null);
  if (!e) return "";
  const t = { comprador: "g", vendedor: "r", misto: "am" }[e.v] || "",
    a = T.side === "V" ? -1 : 1,
    o = e.v === "comprador" ? 1 : e.v === "vendedor" ? -1 : 0,
    s = o
      ? o === a
        ? "a favor da sua entrada"
        : "contra a sua entrada"
      : "fluxo misto, sem direção clara";
  return `<div class="sm" style="margin:6px 0;padding:8px 10px;border:1px solid var(--bd);border-radius:12px">🐋 Fluxo do EWZ: <b class="${t}">viés ${esc(e.v)}</b> (calls ${flwUS(e.nc)}, puts ${flwUS(e.np)}) · <b>${s}</b><div class="mut" style="margin-top:2px">Contexto, não gatilho: sem motivo técnico no gráfico, não entre.</div></div>`;
}
{
  const e = sheet;
  sheet = function () {
    try {
      ewzMarca();
    } catch {}
    const t = e.apply(this, arguments);
    try {
      const a = ewzChip();
      if (a)
        return t.replace(
          '<button class="x" data-a="close">✕</button></div>',
          '<button class="x" data-a="close">✕</button></div>' + a,
        );
    } catch {}
    return t;
  };
}
function ewzStatsHtml(e) {
  const t = e.filter(
    (r) => r.ewz && ehIdx(r.ativo) && r.c && r.c.r != null && isFinite(r.c.r),
  );
  if (!t.length)
    return '<h2>Fluxo do EWZ × seus trades de índice</h2><div class="card sm mut">Ainda não há trades de índice registrados com a leitura do EWZ. A partir de agora, todo trade novo de WIN, IND, WDO ou DOL guarda o viés do fluxo no momento da entrada (com a tela do Fluxo EWZ carregada nos últimos 20 minutos).</div>';
  const a = { a: [], c: [], m: [] };
  t.forEach((r) => {
    const i = r.side === "V" ? -1 : 1,
      l = r.ewz.v === "comprador" ? 1 : r.ewz.v === "vendedor" ? -1 : 0;
    (l === 0 ? a.m : l === i ? a.a : a.c).push(+r.c.r);
  });
  const o = (r, i) => {
      const l = i.length,
        d = l ? i.filter((p) => p > 0).length / l : null,
        c = l ? i.reduce((p, u) => p + u, 0) / l : null;
      return `<tr><td>${r}</td><td style="text-align:right">${l}</td><td style="text-align:right">${d == null ? "–" : Math.round(d * 100) + "%"}</td><td style="text-align:right" class="${c == null ? "" : c >= 0 ? "g" : "r"}">${c == null ? "–" : f2(c) + "×"}</td></tr>`;
    },
    s = a.a.length ? a.a.reduce((r, i) => r + i, 0) / a.a.length : null,
    n = a.c.length ? a.c.reduce((r, i) => r + i, 0) / a.c.length : null;
  return `<h2>Fluxo do EWZ × seus trades de índice</h2><div class="card" style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th style="text-align:left">Entrada</th><th>Trades</th><th>Acerto</th><th>Média</th></tr>${o("A favor do fluxo", a.a)}${o("Contra o fluxo", a.c)}${o("Fluxo misto", a.m)}</table>
<div class="sm" style="margin-top:6px">${s != null && n != null && a.a.length >= 10 && a.c.length >= 10 ? (s > n ? `Operar a favor do fluxo rendeu <b class="g">${f2(s - n)}× a mais</b> por trade. A leitura está funcionando para você.` : "Operar a favor do fluxo não rendeu mais que operar contra. Use o fluxo só como contexto.") : "Precisa de pelo menos 10 trades a favor e 10 contra para tirar conclusão."}</div></div>`;
}
{
  const e = vStats;
  vStats = function () {
    let t = e.apply(this, arguments);
    try {
      if (typeof ST < "u" && ST.aba === "onde") {
        const a = stRows()
          .map((o) => (o.c ? o : { ...o, c: calc(o) }))
          .filter((o) => o.c && o.c.pl != null);
        t += ewzStatsHtml(a) + emoStatsHtml(a);
      }
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
const EMO2 = [
  ["calmo", "😌 Calmo"],
  ["confiante", "💪 Confiante"],
  ["ansioso", "😬 Ansioso"],
  ["medo", "😨 Com medo"],
  ["euforico", "🤩 Eufórico"],
  ["raiva", "😠 Com raiva"],
  ["tedio", "🥱 Entediado / FOMO"],
];
{
  const e = sheet;
  sheet = function () {
    const t = e.apply(this, arguments);
    try {
      if (!T || QM) return t;
      const a = `<label>Como eu estava durante o trade e na saída?</label><div class="chips2" id="emo2">${EMO2.map(([n, r]) => `<button type="button" class="${T.emo2 === n ? "on" : ""}" data-emo2="${n}">${r}</button>`).join("")}</div>`,
        o = t.indexOf("<label>Como eu estava antes de entrar?</label>");
      if (o < 0) return t;
      const s = t.indexOf("</div>", o);
      return s < 0 ? t : t.slice(0, s + 6) + a + t.slice(s + 6);
    } catch {
      return t;
    }
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-emo2]");
  !t ||
    !T ||
    (e.preventDefault(),
    (T.emo2 = T.emo2 === t.dataset.emo2 ? "" : t.dataset.emo2),
    document
      .querySelectorAll("#emo2 [data-emo2]")
      .forEach((a) => a.classList.toggle("on", a.dataset.emo2 === T.emo2)));
});
function emoStatsHtml(e) {
  const t = e.filter((r) => r.emo2 && r.c && r.c.r != null && isFinite(r.c.r));
  if (!t.length)
    return '<h2>Emoções no trade</h2><div class="card sm mut">Marque como você estava durante o trade (calmo, ansioso, com medo, eufórico…) no encerramento. Com alguns trades, aparece aqui em qual estado você ganha e em qual você perde.</div>';
  const a = {};
  t.forEach((r) => {
    var i;
    (a[(i = r.emo2)] ?? (a[i] = [])).push(+r.c.r);
  });
  const o = Object.entries(a)
      .map(([r, i]) => ({
        k: r,
        n: i.length,
        ac: i.filter((l) => l > 0).length / i.length,
        ex: i.reduce((l, d) => l + d, 0) / i.length,
        tot: i.reduce((l, d) => l + d, 0),
      }))
      .sort((r, i) => i.ex - r.ex),
    s = (r) => (EMO2.find((i) => i[0] === r) || [r, r])[1],
    n = o[o.length - 1];
  return `<h2>Emoções no trade</h2><div class="card" style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th style="text-align:left">Estado</th><th>Trades</th><th>Acerto</th><th>Média</th><th>Total</th></tr>${o.map((r) => `<tr><td>${s(r.k)}</td><td style="text-align:right">${r.n}</td><td style="text-align:right">${Math.round(r.ac * 100)}%</td><td style="text-align:right" class="${r.ex >= 0 ? "g" : "r"}">${f2(r.ex)}×</td><td style="text-align:right" class="${r.tot >= 0 ? "g" : "r"}">${f2(r.tot)}×</td></tr>`).join("")}</table>
${
  n && n.ex < 0 && n.n >= 3
    ? `<div class="sm" style="margin-top:6px">Quando você está <b>${s(n.k)
        .replace(/^\S+\s/, "")
        .toLowerCase()}</b>, perde em média <b class="r">${f2(n.ex)}×</b> por trade. Nesse estado, a melhor operação é não operar.</div>`
    : ""
}</div>`;
}
const SHC = {};
async function shrCandles(e) {
  if (SHC[e.id]) return SHC[e.id];
  const t = cfg();
  if (!t) throw new Error("sem Supabase");
  const a = String(e.dt).slice(0, 10),
    o = String(e.dtx || e.dt).slice(0, 10),
    s = a === o,
    n = await fetch(t.url + "/functions/v1/candles", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: t.key },
      body: JSON.stringify({
        ativo: e.ativo,
        sub: e.sub || "",
        de: s ? a + "T10:30" : e.dt,
        ate: s ? a + "T16:30" : e.dtx || "",
      }),
    }),
    r = await n.json();
  if (!n.ok || !(r.candles || []).length)
    throw new Error(r.error || "sem candles");
  return (SHC[e.id] = r.candles);
}
function shrDesenhaGraf(e, t, a, o, s, n, r) {
  const i = (j) => {
      const k = Date.parse(String(j || "").slice(0, 16) + ":00-03:00");
      return isFinite(k) ? k / 1e3 : null;
    },
    l = i(a.dt),
    d = i(a.dtx),
    c = numN(a.entry),
    p = numN(a.exit),
    u = numN(a.stop),
    m = t.slice(-90),
    f = Math.max(...m.map((j) => j[2]), c || -1 / 0, p || -1 / 0),
    x = Math.min(...m.map((j) => j[3]), c || 1 / 0, p || 1 / 0),
    v = f - x || 1,
    g = (j) => s + ((f - j) / v) * r,
    h = n / m.length;
  (e.save(), (e.strokeStyle = "rgba(255,255,255,0.05)"));
  for (let j = 0; j < 6; j++)
    (e.beginPath(),
      e.moveTo(o, s + (r * j) / 5),
      e.lineTo(o + n, s + (r * j) / 5),
      e.stroke());
  (m.forEach((j, k) => {
    const A = o + k * h + h / 2,
      C = j[4] >= j[1],
      I = C ? "#42c081" : "#ea7462";
    ((e.globalAlpha = 0.9),
      (e.strokeStyle = I),
      (e.lineWidth = Math.max(1, h * 0.12)),
      e.beginPath(),
      e.moveTo(A, g(j[2])),
      e.lineTo(A, g(j[3])),
      e.stroke(),
      (e.fillStyle = I),
      e.fillRect(
        A - h * 0.35,
        Math.min(g(j[1]), g(j[4])),
        h * 0.7,
        Math.max(1.5, Math.abs(g(j[1]) - g(j[4]))),
      ));
  }),
    (e.globalAlpha = 1));
  const b = (j) => {
      if (j == null) return null;
      let k = null;
      return (
        m.forEach((A, C) => {
          A[0] <= j && (k = C);
        }),
        k
      );
    },
    y = (j, k, A, C) => {
      if (k == null) return;
      const I = b(j);
      if (
        (e.setLineDash([8, 6]),
        (e.strokeStyle = A),
        (e.lineWidth = 2),
        e.beginPath(),
        e.moveTo(o, g(k)),
        e.lineTo(o + n, g(k)),
        e.stroke(),
        e.setLineDash([]),
        I != null)
      ) {
        const J = o + I * h + h / 2;
        (e.save(),
          (e.shadowColor = A),
          (e.shadowBlur = 18),
          (e.fillStyle = A),
          e.beginPath(),
          e.arc(J, g(k), 9, 0, 7),
          e.fill(),
          e.restore());
      }
      ((e.font = "700 20px system-ui"),
        (e.fillStyle = A),
        (e.textAlign = "right"),
        e.fillText(C, o + n - 4, g(k) - 8),
        (e.textAlign = "left"));
    };
  (u != null && u <= f && u >= x && y(null, u, "rgba(234,116,98,0.7)", "stop"),
    y(l, c, "#bb8e3b", "entrada"),
    p != null && y(d, p, "#ffffff", "saída"),
    e.restore());
}
{
  const e = shrGera;
  shrGera = async function (t) {
    if (SHR.vis !== "graf" || t._fx) return e.apply(this, arguments);
    let a = null;
    try {
      a = await shrCandles(t);
    } catch {
      return (
        toast("Não consegui o gráfico do trade; usei a arte.", 3e3),
        e.apply(this, arguments)
      );
    }
    const o = SHR_IMG;
    SHR_IMG = Promise.resolve({ width: 574, height: 1e3, __vazio: 1 });
    const s = CanvasRenderingContext2D.prototype,
      n = s.drawImage;
    s.drawImage = function (r) {
      if (r && r.__vazio) {
        shrDesenhaGraf(this, a, t, 650, 260, 400, 500);
        return;
      }
      return n.apply(this, arguments);
    };
    try {
      return await e.apply(this, arguments);
    } finally {
      ((s.drawImage = n), (SHR_IMG = o));
    }
  };
}
SHR.vis = "arte";
try {
  ls.set("diario-shr-v", "");
} catch {}
{
  const e = shrAbre;
  shrAbre = async function (t) {
    await e.apply(this, arguments);
    try {
      if (String(t).startsWith("per:") || String(t).startsWith("fx:")) return;
      const a = null;
      a &&
        !document.querySelector("[data-shrv]") &&
        a.insertAdjacentHTML(
          "beforebegin",
          `<div class="seg" style="margin-bottom:8px"><button class="${SHR.vis !== "graf" ? "on" : ""}" data-shrv="arte">Arte</button><button class="${SHR.vis === "graf" ? "on" : ""}" data-shrv="graf">Gráfico do trade</button></div>`,
        );
    } catch {}
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-shrv]");
  if (t) {
    SHR.vis = t.dataset.shrv;
    try {
      ls.set("diario-shr-v", SHR.vis);
    } catch {}
    SHR.id && shrAbre(SHR.id);
  }
});
function apHtml() {
  const e = loc().slice(0, 10),
    t = S.days[e] || {};
  let a = null;
  try {
    a = travaEstado();
  } catch {}
  const o = limPerda(t),
    s = stkMeta(),
    n = String(t.plano || "").trim(),
    r = flwFresco() ? FLW.d : null;
  let i = null;
  try {
    const p = turnoGet();
    i = p && p.dias ? p.dias[e] : null;
  } catch {}
  const l = new Date().getDay(),
    d = l === 0 || l === 6;
  if (!flwFresco() && !d)
    try {
      typeof SESS < "u" && SESS && setTimeout(() => flwCarrega(!1), 0);
    } catch {}
  const c = (p, u, m, f) =>
    `<div style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><span style="width:22px;text-align:center">${p}</span><div style="flex:1"><span class="sm mut">${u}</span><div class="${f || ""}" style="font-weight:600">${m}</div></div></div>`;
  return `<div class="card" id="apc"><div class="top"><b>☀️ Antes de operar hoje</b>${a ? `<span class="chip ${a.travado ? "r" : "g"}" style="border-color:currentColor">${a.travado ? "travado" : "liberado"}</span>` : ""}</div>
${a && a.duro.length ? c("🔒", "Trava", esc(a.duro.join(" · ")), "r") : ""}${a && a.resolver.length ? c("⚠️", "Resolver antes", esc(a.resolver.map((p) => p.txt).join(" · ")), "am") : ""}${i && i !== "F" && i !== "0" ? c("🏭", "Turno", `Dia de turno (${esc(i)})`) : ""}
${c("🛑", "Limite de perda hoje", o > 0 ? money(o) : '<span class="mut">não definido · defina no Meu dia</span>')}
${c("🎯", "Meta da semana", s.tipo ? esc(STK_META[s.tipo].replace("N", s.n)) : '<span class="mut">escolha no card Sequências</span>')}
${d ? "" : c("🐋", "Fluxo do EWZ", r ? `<span class="${{ comprador: "g", vendedor: "r", misto: "am" }[r.vies]}">viés ${esc(r.vies)}</span> <span class="sm mut">calls ${flwUS(r.netC)} · puts ${flwUS(r.netP)}</span>` : '<span class="mut">carregando… (ou abra Mercado → Fluxo EWZ)</span>')}
${c("📝", "Seu plano escrito", n ? esc(n.slice(0, 160)) + (n.length > 160 ? "…" : "") : '<button class="btn s" data-a="gotab" data-id="dia">Escrever o plano do dia</button>')}
<div class="sm mut" style="margin-top:4px">O fluxo dá contexto; o gráfico dá o gatilho; o limite decide se cabe.</div></div>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#apc")) return;
      const a = t.querySelector("#stk") || t.querySelector("h2"),
        o = document.createElement("div");
      ((o.innerHTML = apHtml()),
        a ? a.before(o.firstElementChild) : t.appendChild(o.firstElementChild));
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = flwPinta;
  flwPinta = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("apc");
      if (t && tab === "home") {
        const a = document.createElement("div");
        ((a.innerHTML = apHtml()), t.replaceWith(a.firstElementChild));
      }
    } catch {}
  };
}
function pdLista() {
  const e = loc().slice(0, 10),
    t = addD(e, -90),
    a = [];
  return (
    S.trades.forEach((o) => {
      if (String(o.dtx || o.dt).slice(0, 10) < t) return;
      const s = calc(o),
        n = [],
        r = o.tipo || "D",
        i = isOpen(o);
      (i &&
        r === "D" &&
        String(o.dt).slice(0, 10) < e &&
        n.push(["aberto", "day trade ainda aberto"]),
        r !== "O" && numN(o.stop) == null && n.push(["stop", "sem stop"]),
        String(o.setup || "").trim() || n.push(["setup", "sem setup"]),
        !i && !o.rules && n.push(["rules", 'sem "segui as regras?"']),
        !i && !o.err && n.push(["err", "sem erro marcado"]),
        n.length && a.push({ t: o, f: n }));
    }),
    a.sort((o, s) => String(s.t.dt).localeCompare(String(o.t.dt)))
  );
}
function pdBanner() {
  const e = pdLista().length;
  return e
    ? `<div class="card" id="pdb" style="border-color:var(--am)"><div class="top"><b>🧩 ${e} trade(s) com dados faltando</b><button class="btn s" data-pd="abre">Completar</button></div><div class="sm mut">Stop, setup e regras completos deixam as estatísticas, o Monte Carlo e a chance de aprovação na mesa muito mais precisos.</div></div>`
    : "";
}
function pdHtml() {
  const e = pdLista(),
    t = [
      ...new Set(
        S.trades.map((a) => String(a.setup || "").trim()).filter(Boolean),
      ),
    ].slice(0, 30);
  return `<div class="sh" style="max-width:560px;margin:auto;max-height:88vh;overflow:auto"><div class="top"><b>🧩 Completar dados (${e.length})</b><button class="x" data-pd="x">✕</button></div>
<datalist id="pdset">${t.map((a) => `<option value="${esc(a)}">`).join("")}</datalist>
${
  e.length
    ? e
        .slice(0, 40)
        .map(({ t: a, f: o }) => {
          const s = o.map((n) => n[0]);
          return `<div class="card" style="margin:8px 0;padding:10px" data-pdid="${esc(a.id)}"><div class="top"><b>${esc(a.ativo || "—")} · ${a.side === "V" ? "venda" : "compra"}</b><span class="sm mut">${fdt(a.dt)}</span></div><div class="sm r" style="margin:2px 0 6px">${o.map((n) => n[1]).join(" · ")}</div>
${s.includes("stop") ? '<label class="sm">Stop<input data-pdf="stop" inputmode="decimal" placeholder="preço do stop"></label>' : ""}${s.includes("setup") ? '<label class="sm">Setup<input data-pdf="setup" list="pdset" placeholder="ex.: Pullback"></label>' : ""}
${s.includes("rules") ? '<div class="sm" style="margin-top:6px">Segui as regras?</div><div class="seg"><button data-pdf="rules" data-v="s">Sim</button><button data-pdf="rules" data-v="n">Não</button></div>' : ""}
${s.includes("err") ? `<label class="sm" style="margin-top:6px">Erro<select data-pdf="err"><option value="">escolha…</option>${ERR.map((n) => `<option>${esc(n)}</option>`).join("")}</select></label>` : ""}
${s.includes("aberto") ? `<button class="btn s" data-a="edit" data-id="${esc(a.id)}" style="margin-top:6px;width:100%">Abrir para encerrar</button>` : ""}</div>`;
        })
        .join("")
    : '<div class="sm g" style="margin:10px 0">Tudo completo. 👏</div>'
}</div>`;
}
function pdAbre() {
  let e = document.getElementById("pdov");
  (e ||
    ((e = document.createElement("div")),
    (e.id = "pdov"),
    (e.className = "ov"),
    document.body.appendChild(e)),
    (document.body.style.overflow = "hidden"),
    (e.innerHTML = pdHtml()));
}
function pdFecha() {
  const e = document.getElementById("pdov");
  (e && e.remove(), (document.body.style.overflow = ""), render());
}
function pdGrava(e, t, a) {
  const o = S.trades.find((r) => r.id === e);
  if (!o || a == null || a === "") return;
  ((o[t] = t === "stop" ? String(a).replace(",", ".") : a),
    (o.u = Date.now()),
    save());
  const s = document.querySelector(`#pdov [data-pdid="${CSS.escape(e)}"]`);
  if (s) {
    const r = pdLista().find((i) => i.t.id === e);
    if (!r)
      ((s.style.opacity = ".4"),
        (s.innerHTML = '<div class="sm g">✓ completo</div>'),
        setTimeout(() => s.remove(), 900));
    else {
      const i = s.querySelector(".sm.r");
      i && (i.textContent = r.f.map((l) => l[1]).join(" · "));
    }
  }
  const n = document.querySelector("#pdov .top b");
  n && (n.textContent = "🧩 Completar dados (" + pdLista().length + ")");
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-pd]");
    if (t) {
      t.dataset.pd === "abre" ? pdAbre() : pdFecha();
      return;
    }
    const a = e.target.closest('[data-pdf="rules"]');
    if (a) {
      const o = a.closest("[data-pdid]");
      pdGrava(o.dataset.pdid, "rules", a.dataset.v);
      return;
    }
    if (e.target.closest('#pdov [data-a="edit"]')) {
      const o = document.getElementById("pdov");
      (o && o.remove(), (document.body.style.overflow = ""));
    }
  },
  !0,
),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-pdf]");
    if (!t || t.tagName === "BUTTON") return;
    const a = t.closest("[data-pdid]");
    pdGrava(a.dataset.pdid, t.dataset.pdf, t.value.trim());
  }));
function ceCalc(e, t) {
  const a = S.trades
      .map((i) => ({ t: i, c: calc(i) }))
      .filter((i) => {
        const l = String(i.t.dtx || i.t.dt).slice(0, 10);
        return i.c.pl != null && l >= e && l <= t;
      })
      .map((i) => ({ ...i, v: emBRL(i.c.pl, moedaT(i.t)) })),
    o = (i) => i.reduce((l, d) => l + d.v, 0),
    s = (i) => i.t.rules === "n",
    n = (i) => i.t.err && i.t.err !== "Nenhum",
    r = {};
  return (
    a
      .filter((i) => n(i) || s(i))
      .forEach((i) => {
        const l = n(i) ? i.t.err : "Fora das regras";
        (r[l] ?? (r[l] = { n: 0, v: 0 }), r[l].n++, (r[l].v += i.v));
      }),
    {
      n: a.length,
      real: o(a),
      semFora: o(a.filter((i) => !s(i))),
      semErro: o(a.filter((i) => !n(i))),
      limpo: o(a.filter((i) => !s(i) && !n(i))),
      nRuim: a.filter((i) => s(i) || n(i)).length,
      tags: Object.entries(r).sort((i, l) => i[1].v - l[1].v),
    }
  );
}
function ceHtml() {
  const e = new Date(),
    t = e.getFullYear(),
    a = [];
  for (let n = 5; n >= 0; n--) {
    const r = new Date(t, e.getMonth() - n, 1),
      i = ymd(r),
      l = ymd(new Date(r.getFullYear(), r.getMonth() + 1, 0)),
      d = ceCalc(i, l);
    d.n && a.push({ a: i, ...d });
  }
  const o = ceCalc(t + "-01-01", t + "-12-31");
  if (!o.n) return "";
  const s = o.limpo - o.real;
  return `<h2>Quanto os erros me custaram</h2><div class="card"><div class="rrdg"><div><small>Resultado real (${t})</small><b class="mono ${cls(o.real)}">${money(o.real)}</b><i>${o.n} trades</i></div><div><small>Sem erros e fora das regras</small><b class="mono ${cls(o.limpo)}">${money(o.limpo)}</b><i>tirando ${o.nRuim} trade(s)</i></div></div>
<div class="sm" style="margin:6px 0">${s > 0 ? `Os erros e os trades fora das regras custaram <b class="r">${money(s)}</b> este ano.` : s < 0 ? `Curioso: os trades com erro deram lucro este ano (${money(-s)}). Não conte com isso: no longo prazo, erro custa.` : "Nenhum trade com erro ou fora das regras este ano. 👏"}</div>
<div style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th style="text-align:left">Mês</th><th style="text-align:right">Real</th><th style="text-align:right">Sem erros</th><th style="text-align:right">Diferença</th></tr>${a.map((n) => `<tr><td>${esc(mesNome(n.a).split(" ")[0])}</td><td style="text-align:right;white-space:nowrap" class="${cls(n.real)}">${money(n.real)}</td><td style="text-align:right;white-space:nowrap" class="${cls(n.limpo)}">${money(n.limpo)}</td><td style="text-align:right;white-space:nowrap" class="${n.limpo - n.real > 0 ? "r" : "mut"}">${n.limpo - n.real > 0 ? "−" + money(n.limpo - n.real).replace("-", "") : "–"}</td></tr>`).join("")}</table></div>
${
  o.tags.length
    ? `<div class="sm" style="margin-top:8px"><b>Os que mais custaram:</b> ${
        o.tags
          .slice(0, 4)
          .filter((n) => n[1].v < 0)
          .map(
            ([n, r]) =>
              `${esc(n)} <span class="r">${money(r.v)}</span> (${r.n}x)`,
          )
          .join(" · ") || "nenhum deu prejuízo"
      }</div>`
    : ""
}
<div class="sm mut" style="margin-top:4px">"Sem erros" tira os trades marcados com erro ou como fora das regras. Mostra o tamanho do custo, não um resultado garantido.</div></div>`;
}
{
  const e = vStats;
  vStats = function () {
    let t = e.apply(this, arguments);
    try {
      typeof ST < "u" && ST.aba === "risco" && (t += ceHtml());
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    try {
      let a = t.indexOf("<h2>Revisão do período</h2>");
      return (
        a < 0 && (a = t.indexOf("<label>Período")),
        a > 0 ? t.slice(0, a) + ceHtml() + t.slice(a) : t + ceHtml()
      );
    } catch {}
    return t;
  };
}
var RVG = null;
function rvgSemana() {
  const e = ymd(new Date()),
    t = new Date().getDay(),
    a = addD(e, -((t + 6) % 7)),
    o =
      t === 0 || t === 6 || (t === 5 && new Date().getHours() >= 17)
        ? a
        : addD(a, -7);
  return [o, addD(o, 6)];
}
function rvgFeita() {
  const [e] = rvgSemana();
  return !!((S.ax || {}).rvg || {})[e];
}
function rvgAbre() {
  const [e, t] = rvgSemana();
  RVG = { a: e, b: t, i: 0 };
  let a = document.getElementById("rvgov");
  (a ||
    ((a = document.createElement("div")),
    (a.id = "rvgov"),
    (a.className = "ov"),
    document.body.appendChild(a)),
    (document.body.style.overflow = "hidden"),
    rvgPinta());
}
function rvgTs() {
  return S.trades
    .map((e) => ({ t: e, c: calc(e) }))
    .filter((e) => {
      const t = String(e.t.dtx || e.t.dt).slice(0, 10);
      return t >= RVG.a && t <= RVG.b && e.c.pl != null;
    })
    .sort((e, t) => String(e.t.dt).localeCompare(String(t.t.dt)));
}
function rvgPinta() {
  const e = document.getElementById("rvgov");
  if (!e || !RVG) return;
  const t = rvgTs(),
    a = ["Começo", "Trades", "Números", "Próxima semana", "Regra"],
    o = RVG.i;
  let s = "";
  if (o === 0)
    s = `<div style="font-size:15px;margin:8px 0">Semana de <b>${fmtD(RVG.a).slice(0, 5)}</b> a <b>${fmtD(addD(RVG.a, 4)).slice(0, 5)}</b>: ${t.length} trade(s) encerrado(s).</div><div class="sm mut">São 5 passos rápidos: revisar cada trade, ver os números, escolher a meta da próxima semana e ajustar uma regra. Leva uns 10 minutos.</div>`;
  else if (o === 1)
    s = t.length
      ? t
          .map(
            ({
              t: n,
              c: r,
            }) => `<div class="card" style="margin:8px 0;padding:10px" data-pdid="${esc(n.id)}"><div class="top"><b>${esc(n.ativo)} · ${n.side === "V" ? "venda" : "compra"}</b><b class="${cls(r.pl)}">${r.r != null ? f2(r.r) + "×" : mT(n, r.pl)}</b></div><div class="sm mut">${fdt(n.dt)}${n.setup ? " · " + esc(n.setup) : ""}</div>
<div class="sm" style="margin-top:6px">Segui as regras?</div><div class="seg"><button class="${n.rules === "s" ? "on" : ""}" data-rvgr="s">Sim</button><button class="${n.rules === "n" ? "on" : ""}" data-rvgr="n">Não</button></div>
<label class="sm" style="margin-top:6px">Erro<select data-pdf="err">${ERR.map((i) => `<option${(n.err || "Nenhum") === i ? " selected" : ""}>${esc(i)}</option>`).join("")}</select></label>${n.setup ? "" : '<label class="sm">Setup<input data-pdf="setup" placeholder="ex.: Pullback"></label>'}
<label class="sm">O que aprendi (opcional)<input data-pdf="nota" value="${esc(n.nota || "")}" placeholder="uma frase"></label></div>`,
          )
          .join("")
      : '<div class="sm mut">Nenhum trade encerrado nesta semana.</div>';
  else if (o === 2) {
    const n = mesNum(RVG.a, RVG.b),
      r = ceCalc(RVG.a, RVG.b),
      i = t.filter((d) => d.c.r != null).map((d) => d.c.r),
      l = i.reduce((d, c) => d + c, 0);
    s = `<div class="rrdg"><div><small>Resultado</small><b class="mono ${cls(n.P)}">${money(n.P)}</b><i>${i.length ? (l >= 0 ? "+" : "") + f2(l) + "×" : ""}</i></div><div><small>Acerto</small><b class="mono">${n.acerto != null ? Math.round(n.acerto * 100) + "%" : "–"}</b><i>${n.n} trades</i></div><div><small>Dentro das regras</small><b class="mono">${n.regras != null ? Math.round(n.regras * 100) + "%" : "–"}</b><i>preparação: ${n.prep}/${n.util} manhãs</i></div><div><small>Custo dos erros</small><b class="mono ${r.limpo - r.real > 0 ? "r" : ""}">${r.limpo - r.real > 0 ? money(r.real - r.limpo) : "R$ 0"}</b><i>${r.nRuim} trade(s) com erro</i></div></div>
${n.setups.length ? `<div class="sm" style="margin-top:6px">Melhor setup: <b>${esc(n.setups[0][0])}</b> (${money(n.setups[0][1].pl)})</div>` : ""}${n.erros.length ? `<div class="sm">Erro mais caro: <b>${esc(n.erros[0][0])}</b> (${money(n.erros[0][1].pl)})</div>` : ""}`;
  } else if (o === 3) {
    const n = addD(RVG.a, 7),
      r = ((S.ax || {}).metaSem || {}).sem === n ? S.ax.metaSem : null;
    s = `<div class="sm" style="margin-bottom:6px">Escolha <b>uma</b> meta para a semana que começa em ${fmtD(n).slice(0, 5)}:</div>${Object.entries(
      STK_META,
    )
      .map(
        ([i, l]) =>
          `<button class="btn ${r && r.tipo === i ? "" : "s"}" data-rvgm="${i}" style="width:100%;margin:4px 0;text-align:left;white-space:normal">${esc(l.replace("N", "3"))}</button>`,
      )
      .join("")}`;
  } else
    s = `<div class="sm" style="margin-bottom:6px">Quer criar ou ajustar uma regra a partir desta semana? (opcional)</div><label class="sm">Nova regra<input id="rvgreg" placeholder="ex.: depois de 2 stops no dia, paro"></label><div class="sm mut" style="margin-top:6px">Suas regras atuais: ${(S.rules || []).length}. Ela entra no checklist de regras do Meu dia.</div>`;
  e.innerHTML = `<div class="sh" style="max-width:560px;margin:auto;max-height:90vh;overflow:auto"><div class="top"><b>🧭 Revisão da semana</b><button class="x" data-rvg="x">✕</button></div>
<div style="display:flex;gap:4px;margin:8px 0">${a.map((n, r) => `<i style="flex:1;height:4px;border-radius:2px;background:${r <= o ? "var(--ac)" : "var(--bd)"}"></i>`).join("")}</div><div class="sm mut">Passo ${o + 1} de 5 · ${a[o]}</div>
<div style="margin-top:8px">${s}</div><div class="g2" style="margin-top:12px"><button class="btn s" data-rvg="ant"${o ? "" : " disabled"}>‹ Voltar</button><button class="btn" data-rvg="prox">${o < 4 ? "Próximo ›" : "Concluir ✓"}</button></div></div>`;
}
document.addEventListener(
  "click",
  (e) => {
    var t;
    const a = e.target.closest("[data-rvg]");
    if (a) {
      const n = a.dataset.rvg;
      if (n === "abre") return rvgAbre();
      if (n === "x") {
        const r = document.getElementById("rvgov");
        (r && r.remove(),
          (document.body.style.overflow = ""),
          (RVG = null),
          render());
        return;
      }
      if (!RVG) return;
      if (n === "ant") {
        ((RVG.i = Math.max(0, RVG.i - 1)), rvgPinta());
        return;
      }
      if (n === "prox") {
        if (RVG.i < 4) {
          (RVG.i++, rvgPinta());
          return;
        }
        const r = document.getElementById("rvgreg");
        (r &&
          r.value.trim() &&
          (S.rules ?? (S.rules = [])).push({
            id: Date.now().toString(36),
            t: r.value.trim().slice(0, 200),
          }),
          (((t = S.ax ?? (S.ax = {})).rvg ?? (t.rvg = {}))[RVG.a] = Date.now()),
          save());
        const i = document.getElementById("rvgov");
        (i && i.remove(),
          (document.body.style.overflow = ""),
          (RVG = null),
          toast("Revisão da semana concluída. 👏", 3500),
          render());
        return;
      }
    }
    const o = e.target.closest("[data-rvgr]");
    if (o) {
      const n = o.closest("[data-pdid]");
      (pdGrava(n.dataset.pdid, "rules", o.dataset.rvgr),
        n
          .querySelectorAll("[data-rvgr]")
          .forEach((r) => r.classList.toggle("on", r === o)));
      return;
    }
    const s = e.target.closest("[data-rvgm]");
    if (s && RVG) {
      const n = addD(RVG.a, 7);
      if (
        (((S.ax ?? (S.ax = {})).metaSem = {
          tipo: s.dataset.rvgm,
          n: 3,
          sem: n,
        }),
        s.dataset.rvgm === "max")
      ) {
        const r = prompt("No máximo quantos trades por dia?", "3");
        r && (S.ax.metaSem.n = Math.max(1, Math.round(+r) || 3));
      }
      (save(), rvgPinta());
    }
  },
  !0,
);
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#pdb,#rvgb")) return;
      const a = new Date().getDay(),
        o = a === 0 || a === 6 || (a === 5 && new Date().getHours() >= 17);
      let s = pdBanner();
      if (
        (o &&
          !rvgFeita() &&
          (s =
            '<div class="card" id="rvgb" style="border-color:var(--ac)"><div class="top"><b>🧭 Revisão da semana pendente</b><button class="btn s" data-rvg="abre">Começar</button></div><div class="sm mut">5 passos, uns 10 minutos: trades, números, meta da próxima semana e uma regra.</div></div>' +
            s),
        !s)
      )
        return;
      const n = t.querySelector("#apc") || t.querySelector("#stk"),
        r = document.createElement("div");
      r.innerHTML = s;
      const i = document.createDocumentFragment();
      ([...r.children].forEach((l) => i.appendChild(l)),
        n ? n.after(i) : t.prepend(i));
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = relHtml;
  relHtml = function (t, a, o) {
    return e
      .apply(this, arguments)
      .replace(
        '<b style="font-size:18px">📋 Relatório da semana</b>',
        '<b style="font-size:18px">📋 Relatório da semana</b><button class="btn s" data-rvg="abre" style="margin-left:auto;margin-right:8px">🧭 Revisão guiada</button>',
      );
  };
}
const ehUS = (e) => e && (e.forex || moedaT(e) === "USD");
var MDM = (() => {
  try {
    const e = sessionStorage.getItem("diario-mdm");
    if (e) return e;
  } catch {}
  return new Date().getHours() >= 17 || new Date().getHours() < 4 ? "us" : "br";
})();
function mdmSet(e) {
  MDM = e;
  try {
    sessionStorage.setItem("diario-mdm", e);
  } catch {}
  ((DSES.d = D), (DSES.s = e === "us" ? "n" : "m"), (DSES.via = "mdm"));
}
{
  const e = dsAtual;
  dsAtual = function () {
    return DSES.d === D && DSES.s
      ? ((MDM = DSES.s === "n" ? "us" : "br"), DSES.s)
      : MDM === "us"
        ? "n"
        : "m";
  };
}
const DEB_K = [
  "resumo",
  "bem",
  "aprend",
  "nota",
  "erros",
  "cond",
  "prevn",
  "mkt",
];
var mdmDeb;
function mdmTrades() {
  const e = S.trades
      .filter(
        (a) =>
          String(a.dt).slice(0, 10) === D &&
          (MDM === "us" ? ehUS(a) : !ehUS(a)),
      )
      .sort((a, o) => String(a.dt).localeCompare(String(o.dt))),
    t =
      MDM === "us"
        ? (S.ops || []).filter((a) => String(a.dt || "").slice(0, 10) === D)
        : [];
  return { L: e, O: t };
}
var mdmSwitch;
function mdmAplica() {
  if (tab !== "dia" || (typeof DV < "u" && DV === "hist")) return;
  const e = document.getElementById("app"),
    t = e && e.querySelector("#dfases");
  if (!t || e.querySelector("#mdmsw")) return;
  (t.insertAdjacentHTML("beforebegin", mdmSwitch()),
    e.querySelectorAll("[data-dses]").forEach((r) => {
      const i = r.closest(".seg");
      if (i && i.isConnected) {
        const l = i.nextElementSibling;
        (l && /Cada sess\xe3o tem/.test(l.textContent || "") && l.remove(),
          MDM === "us" &&
            !e.querySelector("#eussw") &&
            i.insertAdjacentHTML("beforebegin", eusSwitch()),
          i.remove());
      }
    }));
  const a = e.querySelector('.dfase[data-fase="dur"]'),
    { L: o, O: s } = mdmTrades();
  if (a) {
    const r = [...a.querySelectorAll("details")].find((d) =>
        /Trades do dia/.test(d.textContent || ""),
      ),
      i = [...a.querySelectorAll("p.mut")].find((d) =>
        /Nenhum trade/.test(d.textContent || ""),
      );
    (r && r.remove(), i && i.remove());
    const l = document.createElement("div");
    ((l.id = "mdmtr"),
      (l.innerHTML = `<div class="top" style="margin-top:10px"><b>${MDM === "us" ? "Trades nos EUA" : "Trades na B3"} (${o.length + s.length})</b><button class="btn s" data-a="new" data-tp="D">+ Novo trade</button></div>${o.map((d) => card(d)).join("")}${s.map((d) => opCard(d)).join("")}${o.length + s.length ? "" : `<p class="mut sm">Nenhum trade ${MDM === "us" ? "nos EUA" : "na B3"} neste dia.</p>`}`),
      a.append(l));
  }
  const n = t.querySelector('[data-dfase="dur"] .sm');
  if (
    (n &&
      (n.textContent =
        o.length +
        s.length +
        " trade" +
        (o.length + s.length === 1 ? "" : "s")),
    MDM === "us")
  ) {
    const r = e.querySelector('.dfase[data-fase="pos"]'),
      i = mdmDeb();
    if (r) {
      r.querySelectorAll("[data-d]").forEach((d) => {
        const c = d.dataset.d;
        DEB_K.includes(c) && ((d.dataset.mdus = "1"), (d.value = i[c] ?? ""));
      });
      const l = r.querySelector("h2");
      l &&
        !r.querySelector("#mdmdeb") &&
        l.insertAdjacentHTML(
          "afterend",
          '<div class="sm" id="mdmdeb" style="margin:-2px 0 8px;color:var(--ac)">Debriefing da sessão nos EUA (separado do da B3)</div>',
        );
    }
  }
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      mdmAplica();
    } catch (t) {
      console.error(t);
    }
  };
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-mdm]");
    if (t) {
      if ((e.stopPropagation(), mdmSet(t.dataset.mdm), tab === "dia"))
        (DFASE && (DFASE.d = D), render());
      else {
        (tab !== "trades" && tab !== "ativos" && (tab = "trades"),
          t.dataset.mdm === "br" && tab === "ativos" && (tab = "trades"),
          (OPMK = t.dataset.mdm));
        try {
          ls.set("diario-opm", OPMK);
        } catch {}
        render();
      }
      scrollTo(0, 0);
    }
  },
  !0,
),
  ["input", "change"].forEach((e) =>
    document.addEventListener(
      e,
      (t) => {
        const a = t.target;
        if (!a.dataset || !a.dataset.mdus || !a.dataset.d) return;
        t.stopImmediatePropagation();
        const o = mdmDeb();
        o[a.dataset.d] = a.value;
        const s = S.days[D];
        ((s.noite.u = s.u = Date.now()), save());
      },
      !0,
    ),
  ));
{
  const e = vDiaHist;
  vDiaHist = function () {
    const t = e.apply(this, arguments),
      a = `<div class="seg" id="mdmsw" style="margin:0 0 8px;display:grid;grid-template-columns:1fr 1fr"><button class="${MDM === "br" ? "on" : ""}" data-mdmh="br">Brasil</button><button class="${MDM === "us" ? "on" : ""}" data-mdmh="us">EUA</button></div>`;
    if (MDM === "br") return t.replace('<input id="lq"', a + '<input id="lq"');
    const o = Object.keys(S.days)
        .filter((n) => {
          const r = (S.days[n] || {}).noite || {},
            i = r.deb || {};
          return (
            r.plano ||
            r.pre ||
            Object.values(i).some((l) => String(l || "").trim()) ||
            S.trades.some(
              (l) => ehUS(l) && String(l.dtx || l.dt).slice(0, 10) === n,
            )
          );
        })
        .concat(
          S.trades
            .filter((n) => ehUS(n) && n.dtx)
            .map((n) => String(n.dtx).slice(0, 10)),
        )
        .filter((n, r, i) => i.indexOf(n) === r)
        .sort()
        .reverse(),
      s = t.indexOf('<input id="lq"');
    return (
      (s > 0 ? t.slice(0, s) : "<h1>Meu dia</h1>") +
      a +
      (o.length
        ? o
            .map((n) => {
              const r = (S.days[n] || {}).noite || {},
                i = r.deb || {},
                l = S.trades
                  .filter(
                    (p) => ehUS(p) && String(p.dtx || p.dt).slice(0, 10) === n,
                  )
                  .map((p) => calc(p))
                  .filter((p) => p.pl != null),
                d = l.reduce((p, u) => p + u.pl, 0),
                c = new Date(n + "T12:00").toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                });
              return `<div class="card"><div class="top"><div style="min-width:0"><b>${esc(c)}</b> ${r.energia ? EMO[r.energia - 1] : ""}<div class="mut sm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62vw">${esc(i.resumo || r.plano || i.aprend || "(sem texto)")}</div></div><div class="sm mut" style="text-align:right;white-space:nowrap">${i.nota != null && i.nota !== "" ? "nota " + esc(i.nota) + " · " : ""}${l.length ? `<span class="${cls(d)}">${mnyC(d, "USD")}</span>` : ""}</div></div>
<details style="margin-top:6px"><summary class="sm">Ver</summary>${
                [
                  ["plano", "🌙 Plano da sessão", r],
                  ["pre", "Ensaio mental", r],
                  ["resumo", "Como foi a sessão", i],
                  ["bem", "O que fiz bem", i],
                  ["aprend", "Aprendizado", i],
                  ["prevn", "Para não repetir", i],
                ]
                  .filter(([p, , u]) => String(u[p] || "").trim())
                  .map(
                    ([p, u, m]) =>
                      `<div class="sm mut" style="margin-top:8px">${u}</div><div style="white-space:pre-wrap">${esc(m[p])}</div>`,
                  )
                  .join("") || '<div class="sm mut">Só trades neste dia.</div>'
              }<button class="btn s" data-mdmdia="${n}" style="margin-top:8px">Abrir este dia</button></details></div>`;
            })
            .join("")
        : '<p class="mut">Nenhuma sessão nos EUA registrada ainda.</p>')
    );
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-mdmh]");
  if (t) {
    (mdmSet(t.dataset.mdmh), render());
    return;
  }
  const a = e.target.closest("[data-mdmdia]");
  a &&
    ((D = a.dataset.mdmdia),
    (DV = "ed"),
    mdmSet("us"),
    (tab = "dia"),
    render(),
    scrollTo(0, 0));
});
var OPMK = (() => {
  try {
    return ls.get("diario-opm") || "br";
  } catch {
    return "br";
  }
})();
{
  const e = segOps;
  segOps = function (t) {
    if (t === "stats" || t === "rev")
      return e
        .apply(this, arguments)
        .replace(/<div class="seg hub"[^]*?<\/div>/, o("num"));
    const a =
      t === "ativos" ? "us" : t === "swing" || t === "opc" ? "br" : OPMK;
    function o(n) {
      return `<div class="seg hub" style="margin:2px 0 8px;display:grid;grid-template-columns:1fr 1fr 1fr"><button class="${n === "br" ? "on" : ""}" data-mdm="br">Brasil</button><button class="${n === "us" ? "on" : ""}" data-mdm="us">EUA</button><button class="${n === "num" ? "on" : ""}" data-a="gotab" data-id="${OPS_D}">Números</button></div>`;
    }
    const s =
      a === "br"
        ? [
            ["trades", "Day trade"],
            ["swing", "Swing"],
            ["opc", "Opções"],
          ]
        : [
            ["trades", "Futuros e ações"],
            ["ativos", "Forex"],
          ];
    return (
      o(a) +
      `<div class="hub2" style="margin-bottom:10px">${s.map(([n, r]) => `<button class="${n === t ? "on" : ""}" data-a="gotab" data-id="${n}">${r}</button>`).join("")}</div>`
    );
  };
}
{
  const e = vList;
  vList = function (t) {
    if ((t || "D") !== "D") return e.apply(this, arguments);
    const a = S.trades;
    S.trades = a.filter(
      (o) => (o.tipo || "D") !== "D" || (OPMK === "us" ? ehUS(o) : !ehUS(o)),
    );
    try {
      let o = e.apply(this, arguments);
      return (
        OPMK === "us"
          ? (o = o.replace("<h1>Day trade</h1>", "<h1>Mercado americano</h1>"))
          : (o = o.replace("<h1>Day trade</h1>", "<h1>Day trade B3</h1>")),
        o
      );
    } finally {
      S.trades = a;
    }
  };
}
document.addEventListener("click", (e) => {
  e.target.closest('[data-a="new"]') &&
    setTimeout(() => {
      try {
        T &&
          isNew &&
          !T.moeda &&
          ((tab === "trades" && OPMK === "us") ||
            (tab === "dia" && MDM === "us")) &&
          ((T.moeda = "USD"), (T.pv = T.pv || 1), showSheet());
      } catch {}
    }, 0);
});
var EUS = (() => {
  try {
    const t = sessionStorage.getItem("diario-eus");
    if (t) return t;
  } catch {}
  const e = new Date().getHours();
  return e >= 17 || e < 4 ? "n" : "d";
})();
const ROTU0 = [
  "Vi a agenda e as notícias dos EUA para hoje (CPI, payroll, Fed, balanços)",
  "Marquei os níveis do pré-mercado e da abertura de NY",
  "Revisei o plano e o limite de risco da sessão",
  "Chequei meu estado emocional e o horário de parar",
];
function rotU() {
  const e = rotS();
  return (
    Array.isArray(e.u) ||
      ((e.u = ROTU0.map((t, a) => ({ id: "u" + (a + 1), t }))),
      (S.mt = Date.now()),
      save()),
    e.u
  );
}
function usdHtml(e) {
  rotU();
  const t = e.usd || {},
    a = (o, s, n = "") =>
      `<label>${s}<textarea data-u2="${o}" placeholder="${esc(n)}">${esc(t[o] || "")}</textarea></label>`;
  return (
    rotCard(
      "u",
      "Rotina do dia (EUA)",
      "Antes da abertura de Nova York (10h30 de Brasília no horário de verão americano, 11h30 fora dele).",
    ) +
    `<label>Como estou agora?</label><div class="chips2">${EMO.map((o, s) => `<button class="${t.energia == s + 1 ? "on" : ""}" data-u2seg="energia" data-v="${s + 1}">${o}</button>`).join("")}</div>
<div class="g2" style="grid-template-columns:1fr"><label>Tipo de mercado na sessão<select data-u2="mkt"><option value="">–</option>${opt(MK, t.mkt)}</select></label></div>
${a("plano", "Plano da sessão do dia nos EUA", "Cenário em NY, níveis, ativos (S&P, Nasdaq, ouro, petróleo…), notícias do dia, horário de parar")}
${a("pre", "Ensaio mental: o que pode dar errado e como vou reagir?")}`
  );
}
{
  const e = noiteHtml;
  noiteHtml = function (t) {
    return MDM === "us" && EUS === "d" ? usdHtml(t) : e.apply(this, arguments);
  };
}
function eusSwitch() {
  const e = S.days[D] || {},
    t = (a) => (String(a || "").trim() ? "✓" : "–");
  return `<div class="seg" id="eussw" style="margin:6px 0 8px;display:grid;grid-template-columns:1fr 1fr"><button class="${EUS === "d" ? "on" : ""}" data-eus="d">☀️ Rotina do dia <span class="sm mut">${t((e.usd || {}).plano)}</span></button><button class="${EUS === "n" ? "on" : ""}" data-eus="n">🌙 Rotina da noite <span class="sm mut">${t((e.noite || {}).plano)}</span></button></div>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || (typeof DV < "u" && DV === "hist")) return;
      const t = document.getElementById("app"),
        a = t && t.querySelector('.dfase[data-fase="pre"]');
      if (!a) return;
      if (MDM === "br") {
        const n = a.querySelector("#rot-m b");
        n && (n.textContent = "Rotina do dia (B3)");
        return;
      }
      if (!a.querySelector("#eussw")) {
        const n = a.querySelector("#rot-u") || a.querySelector("#rot-n");
        n
          ? n.insertAdjacentHTML("beforebegin", eusSwitch())
          : a.insertAdjacentHTML("afterbegin", eusSwitch());
      }
      const o = a.querySelector("#rot-n");
      if (o)
        if (EUS === "d") o.style.display = "none";
        else {
          const n = o.querySelector("b");
          n && (n.textContent = "Rotina da noite (EUA)");
        }
      const s = a.querySelector("#rot-m");
      s && (s.style.display = "none");
    } catch (t) {
      console.error(t);
    }
  };
}
(document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-eus]");
  if (a) {
    EUS = a.dataset.eus;
    try {
      sessionStorage.setItem("diario-eus", EUS);
    } catch {}
    render();
    return;
  }
  const o = e.target.closest("[data-u2seg]");
  if (o) {
    const s = (t = S.days)[D] ?? (t[D] = { chk: {} }),
      n = s.usd ?? (s.usd = {});
    ((n[o.dataset.u2seg] = +o.dataset.v),
      (n.u = s.u = Date.now()),
      save(),
      o.parentElement
        .querySelectorAll("button")
        .forEach((r) => r.classList.toggle("on", r === o)));
  }
}),
  ["input", "change"].forEach((e) =>
    document.addEventListener(e, (t) => {
      var a;
      const o = t.target;
      if (!o.dataset || !o.dataset.u2) return;
      const s = (a = S.days)[D] ?? (a[D] = { chk: {} }),
        n = s.usd ?? (s.usd = {});
      ((n[o.dataset.u2] = o.value), (n.u = s.u = Date.now()), save());
    }),
  ));
function rotUEdit() {
  return `<details class="card" style="margin-top:8px"><summary class="sm"><b>Editar a rotina do dia (EUA)</b></summary>${rotU()
    .map(
      (e) =>
        `<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin:4px 0"><input data-rotu="${e.id}" value="${esc(e.t)}" style="margin:0"><button class="x" data-rotux="${e.id}" aria-label="Remover item">✕</button></div>`,
    )
    .join(
      "",
    )}<div style="display:flex;gap:6px;margin-top:6px"><input id="rotun" placeholder="Novo item" style="margin:0;flex:1"><button class="btn s" data-rotuadd="1">+</button></div></details>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || MDM !== "us" || EUS !== "d") return;
      const t = document.querySelector("#rot-u");
      t &&
        !document.getElementById("rotued") &&
        t.insertAdjacentHTML(
          "afterend",
          '<div id="rotued">' + rotUEdit() + "</div>",
        );
    } catch {}
  };
}
(document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-rotu]");
  if (!t) return;
  const a = rotU().find((o) => o.id === t.dataset.rotu);
  a && ((a.t = t.value.trim() || a.t), (S.mt = Date.now()), save());
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-rotux]");
    if (t) {
      ((S.rot.u = rotU().filter((a) => a.id !== t.dataset.rotux)),
        (S.mt = Date.now()),
        save(),
        render());
      return;
    }
    if (e.target.closest("[data-rotuadd]")) {
      const a = document.getElementById("rotun");
      a &&
        a.value.trim() &&
        (rotU().push({
          id: "u" + Date.now().toString(36),
          t: a.value.trim().slice(0, 160),
        }),
        (S.mt = Date.now()),
        save(),
        render());
    }
  }));
{
  const e = dsAtual;
  dsAtual = function () {
    const t = e.apply(this, arguments);
    return (
      DSES.d === D && DSES.s === "n" && DSES.via !== "mdm" && (EUS = "n"),
      t
    );
  };
}
const APP_VER = window.DIARIO_RELEASE.label;
function sdEstado() {
  const e = loc().slice(0, 10),
    t = String(ls.get("diario-snap-dia") || "").split("|")[0],
    a = typeof SESS < "u" && !!SESS,
    o = !!window.CLOUD_OK,
    s = S.lastSyncAt ? new Date(S.lastSyncAt) : null,
    n = t
      ? Math.round((new Date(e + "T12:00") - new Date(t + "T12:00")) / 864e5)
      : null,
    r = (typeof BK < "u" && BK.err) || "",
    i = o
      ? a
        ? r ||
          (n != null && n > 2
            ? `A última cópia na nuvem é de ${n} dias atrás. Abra o app com internet para atualizar.`
            : "")
        : "Você não está conectado: seus dados estão só neste aparelho. Entre na conta para sincronizar e ter cópia diária na nuvem."
      : "";
  return { logado: a, nuvem: o, sync: s, snap: t, velho: n, erro: r, prob: i };
}
function sdHtml(e) {
  const t = sdEstado();
  if (!e && !t.prob) return "";
  if (!e)
    return `<div class="card" id="sdb" style="border-color:var(--r)"><div class="top"><b>🛟 Seus dados precisam de atenção</b><button class="btn s" data-a="gotab" data-id="conta">Resolver</button></div><div class="sm">${esc(t.prob)}</div></div>`;
  const a = (o, s, n) =>
    `<div style="display:flex;gap:8px;margin:6px 0"><span>${o ? "✅" : "⚠️"}</span><div class="sm"><b>${s}</b><div class="mut">${n}</div></div></div>`;
  return `<div class="card" id="sdc"><b>🛟 Saúde dos dados</b>${a(t.logado, "Conta", t.logado ? "Conectado: tudo sincroniza entre os aparelhos." : "Não conectado: os dados ficam só neste aparelho.")}
${a(!!t.sync, "Última sincronização", t.sync ? t.sync.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "nunca")}
${a(t.velho != null && t.velho <= 2 && !t.erro, "Cópia diária na nuvem (30 dias)", t.erro ? esc(t.erro) : t.snap ? fmtD(t.snap) + (t.velho === 0 ? " (hoje)" : "") : "ainda não feita")}
<div class="sm mut" style="margin-top:4px">As fotos dos trades ficam no aparelho e vão no backup completo (arquivo) do Painel.</div></div>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      if (!t) return;
      if (tab === "home" && !t.querySelector("#sdb")) {
        const a = sdHtml(!1);
        if (a) {
          const o = document.createElement("div");
          o.innerHTML = a;
          const s = t.querySelector("#apc");
          s ? s.before(o.firstElementChild) : t.prepend(o.firstElementChild);
        }
      }
      if (tab === "conta" && !t.querySelector("#sdc")) {
        const a = t.querySelector("h1"),
          o = document.createElement("div");
        ((o.innerHTML = sdHtml(!0)),
          a ? a.after(o.firstElementChild) : t.prepend(o.firstElementChild));
      }
      if (tab === "painel") {
        const a = [...t.querySelectorAll("h2")].find((o) =>
          /Mesa propriet\xe1ria \(b\xe1sico\)/.test(o.textContent),
        );
        if (a && !a.closest("details")) {
          const o = document.createElement("details");
          ((o.className = "card"),
            (o.innerHTML =
              '<summary class="sm"><b>Mesa proprietária (configuração simples, antiga)</b> · use o Painel completo da mesa acima</summary>'),
            a.before(o));
          let s = a;
          const n = [];
          for (; s && !(s !== a && s.tagName === "H2"); )
            (n.push(s), (s = s.nextElementSibling));
          n.forEach((r) => o.appendChild(r));
        }
      }
    } catch (t) {
      console.error(t);
    }
  };
}
const qkMods = () => {
  var e;
  return (e = S.ax ?? (S.ax = {})).qkm ?? (e.qkm = []);
};
{
  const e = qkDesenha;
  qkDesenha = function () {
    e.apply(this, arguments);
    try {
      const t = document.querySelector("#qk .qk-pn");
      if (!t || t.querySelector("#qkm")) return;
      const a = qkMods(),
        o = `<div id="qkm" style="margin:6px 0 4px"><div class="sm mut" style="margin-bottom:4px">Modelos (toque para preencher)</div><div class="chips2">${a.map((n) => `<button class="${QK._mod === n.id ? "on" : ""}" data-qkmod="${n.id}">${esc(n.nome)}</button>`).join("")}<button data-qkmsalva="1">＋ salvar como modelo</button></div></div>`,
        s = t.querySelector(".top");
      if (
        (s
          ? s.insertAdjacentHTML("afterend", o)
          : t.insertAdjacentHTML("afterbegin", o),
        QK._mod)
      ) {
        const n = a.find((r) => r.id === QK._mod);
        if (n) {
          const r = (() => {
            try {
              const i =
                typeof lvQ == "function"
                  ? lvQ((raizAtivo(QK.ativo), QK.ativo))
                  : null;
              return i && i.ult > 0 ? i.ult : null;
            } catch {
              return null;
            }
          })();
          t.querySelector("#qkm").insertAdjacentHTML(
            "beforeend",
            `<div class="sm" style="margin-top:4px">${esc(n.ativo)} · ${n.side === "C" ? "compra" : "venda"} · ${n.qty} · stop ${String(n.stop).replace(".", ",")} pts${n.alvo ? " · alvo " + String(n.alvo).replace(".", ",") + " pts" : ""}${r ? ` · <button class="btn s" data-qkpx="${r}" style="padding:3px 8px">usar preço agora (${vPx(r)})</button>` : ""}</div>`,
          );
        }
      }
    } catch {}
  };
}
{
  const e = qkSalva;
  qkSalva = function () {
    try {
      const s = QK && QK._mod ? qkMods().find((r) => r.id === QK._mod) : null,
        n = numN(QK.entry);
      (s &&
        n != null &&
        !String(QK.stop || "").trim() &&
        +s.stop > 0 &&
        (QK.stop = String(
          +(n - (QK.side === "C" ? 1 : -1) * s.stop).toFixed(5),
        )),
        (QK._alvo =
          s && n != null && +s.alvo > 0
            ? +(n + (QK.side === "C" ? 1 : -1) * s.alvo).toFixed(5)
            : null));
    } catch {}
    const t = S.trades.length,
      a = QK && QK._alvo,
      o = e.apply(this, arguments);
    try {
      if (a != null && S.trades.length > t) {
        const s = S.trades[S.trades.length - 1];
        s.target || ((s.target = String(a)), save());
      }
    } catch {}
    return o;
  };
}
document.addEventListener(
  "click",
  (e) => {
    if (!QK) return;
    const t = e.target.closest("[data-qkmod]");
    if (t) {
      const o = qkMods().find((s) => s.id === t.dataset.qkmod);
      if (!o) return;
      ((QK._mod = o.id),
        (QK.ativo = o.ativo),
        (QK.side = o.side),
        (QK.qty = String(o.qty)),
        (QK.stop = ""),
        qkDesenha(),
        setTimeout(() => {
          const s = document.querySelector('#qk [data-qk="entry"]');
          s && s.focus();
        }, 50));
      return;
    }
    const a = e.target.closest("[data-qkpx]");
    if (a) {
      ((QK.entry = a.dataset.qkpx), qkDesenha());
      return;
    }
    if (e.target.closest("[data-qkmsalva]")) {
      const o = String(QK.ativo || "").toUpperCase();
      if (!o) {
        toast("Escolha o ativo antes.");
        return;
      }
      const s = numN(QK.entry),
        n = numN(QK.stop);
      let r = s != null && n != null ? Math.abs(s - n) : null;
      if (r == null) {
        const d = prompt(
          "Stop do modelo, em pontos (distância da entrada):",
          "150",
        );
        if (!d) return;
        r = +String(d).replace(",", ".");
      }
      const i = prompt(
          "Alvo em pontos (opcional, deixe vazio se não usa):",
          "",
        ),
        l = prompt(
          "Nome do modelo:",
          `${raizAtivo(o) || o} ${QK.side === "C" ? "compra" : "venda"} ${QK.qty || 1}`,
        );
      if (!l) return;
      (qkMods().push({
        id: Date.now().toString(36),
        nome: l.slice(0, 30),
        ativo: o,
        side: QK.side,
        qty: +QK.qty || 1,
        stop: r,
        alvo: i ? +String(i).replace(",", ".") : 0,
      }),
        save(),
        toast("Modelo salvo."),
        qkDesenha());
    }
  },
  !0,
);
function lembDados() {
  const e = loc().slice(0, 10),
    t = S.days[e] || {},
    a = S.trades.filter(
      (l) => String(l.dtx || l.dt).slice(0, 10) === e && calc(l).pl != null,
    ),
    o = a.filter((l) => !ehUS(l)).length,
    s =
      a.filter((l) => ehUS(l)).length +
      (S.ops || []).filter(
        (l) =>
          l.st === "closed" && String(l.dtx || l.dt || "").slice(0, 10) === e,
      ).length,
    n = addD(e, -7),
    r = S.trades.filter(
      (l) =>
        String(l.dt).slice(0, 10) >= n &&
        (l.tipo || "D") !== "O" &&
        numN(l.stop) == null,
    ).length;
  let i = 0;
  try {
    i = pdLista().length;
  } catch {}
  return {
    dia: e,
    br: { n: o, deb: !!String(t.resumo || "").trim() },
    us: {
      n: s,
      deb: !!String(((t.noite || {}).deb || {}).resumo || "").trim(),
    },
    semStop: r,
    pend: i,
  };
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      t.lemb = lembDados();
    } catch {}
    return t;
  };
}
try {
  typeof NP < "u" &&
    NP.on &&
    NP.on.lemb === void 0 &&
    ((NP.on.lemb = !0), ls.set("diario-np", NP));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("lemb", "📝 Lembretes: debriefing pendente (21h B3, 23h30 EUA) e dados faltando (domingo)")}`
    );
  };
}
(setInterval(() => {
  try {
    turnoPushSync(!1);
  } catch {}
}, 10 * 6e4),
  (GOR.deb = () => {
    ((GO.r = null),
      (tab = "dia"),
      (D = loc().slice(0, 10)),
      (DV = "ed"),
      mdmSet("br"),
      (DFASE = { d: D, f: "pos" }),
      render());
  }),
  (GOR.debus = () => {
    ((GO.r = null),
      (tab = "dia"),
      (D = loc().slice(0, 10)),
      (DV = "ed"),
      mdmSet("us"),
      (DFASE = { d: D, f: "pos" }),
      render());
  }),
  (GOR.pend = () => {
    ((GO.r = null),
      (tab = "home"),
      render(),
      setTimeout(() => {
        try {
          pdAbre();
        } catch {}
      }, 300));
  }));
const LK = {
    cfg: (() => {
      try {
        return JSON.parse(APP_STORAGE.getItem("diario-lock") || "null");
      } catch {
        return null;
      }
    })(),
    aberto: !1,
    saiu: 0,
  },
  lkSalva = (e) => {
    LK.cfg = e;
    try {
      e
        ? APP_STORAGE.setItem("diario-lock", JSON.stringify(e))
        : APP_STORAGE.removeItem("diario-lock");
    } catch {}
  },
  b64 = (e) => btoa(String.fromCharCode(...new Uint8Array(e))),
  ub64 = (e) => Uint8Array.from(atob(e), (t) => t.charCodeAt(0));
async function lkHash(e, t) {
  const a = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(t + "|" + e),
  );
  return b64(a);
}
var lkFaceCria, lkFace;
function lkMostra() {
  if (!LK.cfg || document.getElementById("lkov")) return;
  LK.aberto = !1;
  const e = document.createElement("div");
  ((e.id = "lkov"),
    (e.style.cssText =
      "position:fixed;inset:0;z-index:100000;background:var(--bg,#080809);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center"),
    (e.innerHTML = `<div style="font-size:48px">🔒</div><b style="font-size:20px">Diário de Trader</b><div class="sm mut">Desbloqueie para ver seus dados</div>${LK.cfg.cred ? '<button class="btn" data-lk="face" style="min-width:220px">Desbloquear com Face ID</button>' : ""}<input id="lkpin" type="password" inputmode="numeric" maxlength="8" placeholder="PIN" style="max-width:200px;text-align:center;font-size:22px;letter-spacing:6px"><button class="btn s" data-lk="pin" style="min-width:200px">Entrar com o PIN</button><div class="sm r" id="lkmsg"></div>`),
    document.body.appendChild(e),
    e.querySelector("#lkpin").addEventListener("keydown", (t) => {
      t.key === "Enter" && lkPin();
    }));
}
async function lkPin() {
  const e = document.getElementById("lkpin"),
    t = document.getElementById("lkmsg");
  !e ||
    !LK.cfg ||
    ((await lkHash(e.value, LK.cfg.sal)) === LK.cfg.pin
      ? lkAbre()
      : (t && (t.textContent = "PIN errado."), (e.value = "")));
}
function lkAbre() {
  LK.aberto = !0;
  const e = document.getElementById("lkov");
  e && e.remove();
}
(document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-lk]");
  if (t)
    if (t.dataset.lk === "face")
      if (await lkFace()) lkAbre();
      else {
        const a = document.getElementById("lkmsg");
        a && (a.textContent = "Não deu certo: use o PIN.");
      }
    else lkPin();
}),
  LK.cfg && lkMostra(),
  document.addEventListener("visibilitychange", () => {
    LK.cfg &&
      (document.hidden
        ? (LK.saiu = Date.now())
        : LK.saiu &&
          Date.now() - LK.saiu > (LK.cfg.min || 5) * 6e4 &&
          lkMostra());
  }));
function lkCardHtml() {
  const e = LK.cfg;
  return `<h2>Bloqueio do app</h2><div class="card" id="lkc"><div class="sm" style="margin-bottom:6px">${e ? `<b class="g">Ligado</b> · ${e.cred ? "Face ID / digital + PIN" : "PIN"} · bloqueia ao abrir e depois de ${e.min || 5} min fora do app` : "Desligado: qualquer pessoa com o seu celular desbloqueado vê o app."}</div>
${e ? `<div class="g2"><button class="btn s" data-lkc="min">Tempo: ${e.min || 5} min</button><button class="btn s d" data-lkc="off">Desligar</button></div>` : '<div class="g2"><button class="btn" data-lkc="face">Ligar com Face ID</button><button class="btn s" data-lkc="pin">Só com PIN</button></div>'}
<div class="sm mut" style="margin-top:6px">O PIN é a reserva caso o Face ID falhe. Fica guardado só neste aparelho (com segurança, sem o número em texto).</div></div>`;
}
{
  const e = vMais;
  vMais = function () {
    return e.apply(this, arguments) + lkCardHtml();
  };
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-lkc]");
  if (!t) return;
  const a = t.dataset.lkc;
  if (a === "off") {
    if (!confirm("Desligar o bloqueio?")) return;
    (lkSalva(null), render());
    return;
  }
  if (a === "min") {
    const r = prompt(
      "Bloquear depois de quantos minutos fora do app?",
      String((LK.cfg || {}).min || 5),
    );
    if (!r) return;
    (lkSalva({
      ...LK.cfg,
      min: Math.max(1, Math.min(240, Math.round(+r) || 5)),
    }),
      render());
    return;
  }
  const o = prompt("Crie um PIN de 4 a 8 números (reserva):", "");
  if (!o) return;
  if (!/^\d{4,8}$/.test(o)) {
    toast("O PIN precisa ter de 4 a 8 números.");
    return;
  }
  if (prompt("Repita o PIN:", "") !== o) {
    toast("Os PINs não conferem.");
    return;
  }
  const s = b64(crypto.getRandomValues(new Uint8Array(12))),
    n = { pin: await lkHash(o, s), sal: s, min: 5 };
  if (a === "face")
    try {
      n.cred = await lkFaceCria();
    } catch (r) {
      toast(
        "Face ID não ativou (" + (r.message || r) + "). Ficou só com o PIN.",
        5e3,
      );
    }
  (lkSalva(n), (LK.aberto = !0), render(), toast("Bloqueio ligado."));
});
const DSH = (() => {
  const e = { p: "90", m: "all", s: "", a: "" };
  try {
    return Object.assign(
      e,
      JSON.parse(APP_STORAGE.getItem("diario-dsh") || "{}"),
    );
  } catch {
    return e;
  }
})();
let DSH_MO = "BRL";
const dshM = (e) => (DSH_MO === "USD" ? mnyC(e, "USD") : money(e)),
  dshGuarda = () => {
    try {
      APP_STORAGE.setItem("diario-dsh", JSON.stringify(DSH));
    } catch {}
  };
let DSH_COR = null;
const DSH_CLARO = {
  g: "#2e8a5c",
  r: "#d04e3a",
  ac: "#588bb8",
  am: "#a37c33",
  bd: "#e1dfdb",
  mut: "#6d737e",
  tx: "#111111",
  card: "#ffffff",
};
function dshCor() {
  if (DSH_COR) return DSH_COR;
  const e = getComputedStyle(document.body),
    t = (a, o) => e.getPropertyValue(a).trim() || o;
  return {
    g: t("--g", "#2e8a5c"),
    r: t("--r", "#d93d25"),
    ac: t("--ac", "#588bb8"),
    am: t("--am", "#cfab69"),
    bd: t("--bd", "#e8e6e3"),
    mut: t("--mut", "#6d737e"),
    tx: t("--tx", "#151619"),
    card: t("--card", "#ffffff"),
  };
}
function dshRgba(e, t) {
  const a = /^#?([0-9a-f]{6})$/i.exec(String(e).trim());
  if (!a) return e;
  const o = parseInt(a[1], 16);
  return `rgba(${(o >> 16) & 255},${(o >> 8) & 255},${o & 255},${t.toFixed(2)})`;
}
const dshN = (e, t = 2) =>
    e === 1 / 0
      ? "∞"
      : e == null || !isFinite(e)
        ? "–"
        : e.toLocaleString("pt-BR", {
            minimumFractionDigits: t,
            maximumFractionDigits: t,
          }),
  dshK = (e) => {
    if (e == null || !isFinite(e)) return "–";
    const t = Math.abs(e);
    return (
      (e < 0 ? "−" : "") +
      (t >= 1e6
        ? dshN(t / 1e6, 1) + "mi"
        : t >= 1e3
          ? dshN(t / 1e3, 1) + "k"
          : dshN(t, 0))
    );
  };
function dshTodas() {
  const e = [];
  S.trades.forEach((t) => {
    const a = calc(t);
    if (a.pl == null) return;
    const o = String(t.dt || ""),
      s = String(t.dtx || t.dt).slice(0, 10);
    e.push({
      d: s,
      de: o.slice(0, 10) || s,
      h: /T\d\d/.test(o) ? +o.slice(11, 13) : null,
      v: emBRL(a.pl, moedaT(t)),
      r: a.r != null && isFinite(a.r) ? a.r : null,
      setup: String(t.setup || "").trim() || "Sem setup",
      at: String(raizAtivo(t.ativo) || t.ativo || "?").toUpperCase(),
      us: ehUS(t),
      emo: t.emo2 || "",
      ok: t.rules !== "n",
      err: t.err && t.err !== "Nenhum" ? t.err : "",
    });
  });
  try {
    lcItems().forEach((t) => {
      t.d &&
        e.push({
          d: t.d,
          de: t.d,
          h: null,
          v: (+t.v || 0) * usdBrl(),
          r: null,
          setup: "Forex",
          at: String(t.s || "FOREX").toUpperCase(),
          us: !0,
          emo: "",
          ok: !0,
          err: "",
          fx: 1,
        });
    });
  } catch {}
  return e.sort((t, a) => t.d.localeCompare(a.d));
}
function dshPer(e) {
  const t = loc().slice(0, 10);
  if (e === "30" || e === "90") {
    const a = +e,
      o = diasMais(t, -(a - 1));
    return {
      a: o,
      b: t,
      pa: diasMais(o, -a),
      pb: diasMais(o, -1),
      nome: "Últimos " + a + " dias",
      cmp: "os " + a + " dias anteriores",
    };
  }
  if (e === "mes") {
    const a = t.slice(0, 8) + "01",
      o = new Date(a + "T12:00:00Z");
    return (
      o.setUTCMonth(o.getUTCMonth() - 1),
      {
        a,
        b: t,
        pa: o.toISOString().slice(0, 10),
        pb: diasMais(a, -1),
        nome: "Este mês",
        cmp: "o mês passado",
      }
    );
  }
  if (e === "ano") {
    const a = +t.slice(0, 4);
    return {
      a: a + "-01-01",
      b: t,
      pa: a - 1 + "-01-01",
      pb: a - 1 + t.slice(4),
      nome: "Este ano",
      cmp: "o mesmo período do ano passado",
    };
  }
  return {
    a: "0000-00-00",
    b: "9999-12-31",
    pa: null,
    pb: null,
    nome: "Todo o histórico",
    cmp: "",
  };
}
function dshFiltra(e, t, a, o) {
  return e.filter(
    (s) =>
      s.d >= t &&
      s.d <= a &&
      (DSH.m === "all" || (DSH.m === "us") === s.us) &&
      (o === "s" || !DSH.s || s.setup === DSH.s) &&
      (o === "a" || !DSH.a || s.at === DSH.a),
  );
}
function dshKpi(e) {
  const t = e.length,
    a = e.filter((h) => h.v > 0),
    o = e.filter((h) => h.v < 0),
    s = sum(e.map((h) => h.v)),
    n = sum(a.map((h) => h.v)),
    r = -sum(o.map((h) => h.v)),
    i = e.filter((h) => h.r != null).map((h) => h.r),
    l = i.length ? sum(i) / i.length : null,
    d =
      i.length > 1
        ? Math.sqrt(sum(i.map((h) => (h - l) ** 2)) / (i.length - 1))
        : null,
    c = {};
  e.forEach((h) => (c[h.d] = (c[h.d] || 0) + h.v));
  const p = Object.keys(c).sort(),
    u = p.map((h) => c[h]);
  let m = 0,
    f = 0,
    x = 0;
  u.forEach((h) => {
    ((m += h), (f = Math.max(f, m)), (x = Math.max(x, f - m)));
  });
  let v = 0,
    g = 0;
  return (
    e.forEach((h) => {
      h.v < 0 ? (v++, (g = Math.max(g, v))) : h.v > 0 && (v = 0);
    }),
    {
      n: t,
      net: s,
      win: t ? a.length / t : null,
      aw: a.length ? n / a.length : null,
      al: o.length ? r / o.length : null,
      payoff: a.length && o.length ? n / a.length / (r / o.length) : null,
      pf: r > 0 ? n / r : n > 0 ? 1 / 0 : null,
      mr: l,
      mv: t ? s / t : null,
      sqn:
        d > 0 && i.length >= 5
          ? (Math.sqrt(Math.min(i.length, 100)) * l) / d
          : null,
      dd: x,
      rec: x > 0 ? s / x : null,
      msq: g,
      dias: p.length,
      dPos: u.filter((h) => h > 0).length,
      nr: i.length,
    }
  );
}
function dshTiles(e, t) {
  return `<div class="dshk">${[
    [
      "Resultado",
      dshM(e.net),
      `${e.n} trade(s) em ${e.dias} dia(s)`,
      "net",
      1,
      cls(e.net),
    ],
    [
      "Acerto",
      e.win == null ? "–" : pct0(e.win),
      `${e.dPos} de ${e.dias} dias positivos`,
      "win",
      1,
      "",
    ],
    [
      "Ganho ÷ perda",
      dshN(e.payoff),
      e.aw != null && e.al != null
        ? `${dshM(e.aw)} ÷ ${dshM(e.al)}`
        : "média dos ganhos ÷ média das perdas",
      "payoff",
      1,
      e.payoff != null ? (e.payoff >= 1.5 ? "g" : e.payoff < 1 ? "r" : "") : "",
    ],
    [
      "Fator de lucro",
      dshN(e.pf),
      "total ganho ÷ total perdido",
      "pf",
      1,
      e.pf != null ? (e.pf >= 1.5 ? "g" : e.pf < 1 ? "r" : "") : "",
    ],
    [
      "Média por trade",
      e.mr != null ? dshN(e.mr) + "×" : dshM(e.mv),
      e.mr != null ? dshM(e.mv) + " por trade" : "sem stop anotado: em R$",
      "mr",
      1,
      cls(e.mr != null ? e.mr : e.mv),
    ],
    [
      "Maior queda",
      e.dd > 0 ? dshM(-e.dd) : dshM(0),
      e.rec != null
        ? `resultado = ${dshN(e.rec, 1)}× a queda`
        : "do topo ao fundo",
      "dd",
      -1,
      e.dd > 0 ? "r" : "",
    ],
    [
      "SQN",
      dshN(e.sqn),
      e.sqn == null
        ? "precisa de 5 trades com stop"
        : e.sqn >= 3
          ? "excelente"
          : e.sqn >= 2
            ? "bom"
            : e.sqn >= 1.6
              ? "médio"
              : e.sqn >= 0
                ? "fraco"
                : "negativo",
      "sqn",
      1,
      e.sqn != null ? (e.sqn >= 2 ? "g" : e.sqn < 0 ? "r" : "") : "",
    ],
    [
      "Pior sequência",
      e.msq + " perda(s)",
      "seguidas",
      "msq",
      -1,
      e.msq >= 4 ? "r" : "",
    ],
  ]
    .map(([a, o, s, n, r, i]) => {
      let l = "";
      if (t && t.n) {
        const d = e[n],
          c = t[n];
        if (
          d != null &&
          c != null &&
          isFinite(d) &&
          isFinite(c) &&
          Math.abs(d - c) > 1e-9
        ) {
          const p = d > c;
          l = `<span class="dshd ${(p ? 1 : -1) * r > 0 ? "g" : "r"}">${p ? "▲" : "▼"}</span>`;
        }
      }
      return `<div class="dshkt"><span class="sm mut">${a}</span><b class="${i}">${o}${l}</b><span class="sm mut">${s}</span></div>`;
    })
    .join("")}</div>`;
}
function dshLarg(e) {
  const t = document.getElementById("app"),
    a = (t && t.clientWidth ? t.clientWidth : Math.min(innerWidth, 760)) - 60;
  return Math.max(280, Math.round(e || innerWidth < 980 ? a : (a - 14) / 2));
}
function dshEq(e, t) {
  const a = {};
  e.forEach((ve) => (a[ve.d] = (a[ve.d] || 0) + ve.v));
  const o = Object.keys(a).sort();
  if (o.length < 2)
    return '<div class="sm mut">Precisa de pelo menos 2 dias com trades no período.</div>';
  let s = 0,
    n = 0,
    r = 0,
    i = 0;
  const l = [0],
    d = [0];
  o.forEach((ve) => {
    ((s += a[ve]),
      (n = Math.max(n, s)),
      l.push(s),
      d.push(s - n),
      s < n ? (r++, (i = Math.max(i, r))) : (r = 0));
  });
  const c = dshLarg(1),
    p = c < 500 ? 150 : 200,
    u = 18,
    m = c < 500 ? 56 : 72,
    f = 46,
    x = 10,
    v = l.length,
    g = (ve) => f + (ve * (c - f - x)) / (v - 1),
    h = Math.max(...l),
    b = Math.min(...l),
    y = (ve) => 8 + ((h - ve) / (h - b || 1)) * (p - 16),
    j = Math.min(...d),
    k = j || -1,
    A = (ve) => p + u + (ve / k) * (m - 4),
    C = l.map((ve, he) => `${g(he).toFixed(1)},${y(ve).toFixed(1)}`).join(" "),
    I = l[v - 1],
    J = I >= 0 ? t.g : t.r,
    se = y(Math.max(b, Math.min(h, 0))),
    Ie =
      `${g(0)},${p + u} ` +
      d.map((ve, he) => `${g(he).toFixed(1)},${A(ve).toFixed(1)}`).join(" ") +
      ` ${g(v - 1)},${p + u}`,
    Pe = d.indexOf(j),
    Me = [h, (h + b) / 2, b]
      .map(
        (ve) =>
          `<line x1="${f}" x2="${c - x}" y1="${y(ve).toFixed(1)}" y2="${y(ve).toFixed(1)}" stroke="${t.bd}" stroke-dasharray="3 4"/><text x="${f - 6}" y="${(y(ve) + 3).toFixed(1)}" font-size="11" text-anchor="end" fill="${t.mut}">${dshK(ve)}</text>`,
      )
      .join(""),
    ue = d[v - 1];
  return `<svg viewBox="0 0 ${c} ${p + u + m + 18}" class="dshsv" role="img" aria-label="Curva de capital e quedas"><defs><linearGradient id="dshgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${J}" stop-opacity=".30"/><stop offset="1" stop-color="${J}" stop-opacity="0"/></linearGradient></defs>${Me}
${b < 0 && h > 0 ? `<line x1="${f}" x2="${c - x}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="${t.mut}" stroke-width=".8"/>` : ""}
<polygon points="${g(0)},${se} ${C} ${g(v - 1)},${se}" fill="url(#dshgr)"/><polyline points="${C}" fill="none" stroke="${J}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${g(v - 1).toFixed(1)}" cy="${y(I).toFixed(1)}" r="4" fill="${J}"/>
<text x="${f}" y="${p + u - 5}" font-size="11" fill="${t.mut}">Queda desde o topo</text><line x1="${f}" x2="${c - x}" y1="${p + u}" y2="${p + u}" stroke="${t.bd}"/>
<polygon points="${Ie}" fill="${t.r}" fill-opacity=".22" stroke="${t.r}" stroke-width="1.2" stroke-linejoin="round"/>${j < 0 ? `<text x="${Math.min(g(Pe) + 5, c - x - 50).toFixed(1)}" y="${(A(j) - 3).toFixed(1)}" font-size="11" fill="${t.r}" font-weight="700">${dshK(j)}</text>` : ""}
<text x="${f}" y="${p + u + m + 15}" font-size="11" fill="${t.mut}">${fmtD(o[0]).slice(0, 5)}</text><text x="${c - x}" y="${p + u + m + 15}" font-size="11" text-anchor="end" fill="${t.mut}">${fmtD(o[o.length - 1]).slice(0, 5)}</text></svg>
<div class="sm" style="margin-top:6px">Maior queda: <b class="r">${dshM(j)}</b> · ficou até <b>${i}</b> pregão(ões) abaixo do topo · agora: ${ue < 0 ? `<b class="r">${dshM(ue)}</b> abaixo do topo` : '<b class="g">no topo</b>'}</div>`;
}
function dshHm(e, t) {
  const a = e.filter((b) => b.h != null);
  if (a.length < 5)
    return '<div class="sm mut">Precisa de pelo menos 5 trades com horário de entrada.</div>';
  const o = (b) => new Date(b.de + "T12:00:00Z").getUTCDay(),
    s = {};
  a.forEach((b) => {
    var y;
    const j = s[(y = o(b) + "|" + b.h)] ?? (s[y] = { v: 0, n: 0, w: 0 });
    ((j.v += b.v), j.n++, b.v > 0 && j.w++);
  });
  const n = a.map((b) => b.h),
    r = [];
  for (let b = Math.min(...n); b <= Math.max(...n); b++) r.push(b);
  const i = [1, 2, 3, 4, 5].concat(
      a.some((b) => o(b) === 6) ? [6] : [],
      a.some((b) => o(b) === 0) ? [0] : [],
    ),
    l = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    d = Math.max(...Object.values(s).map((b) => Math.abs(b.v))) || 1,
    c = (b, y) => {
      const j = s[b + "|" + y];
      if (!j) return '<td class="dshhe"></td>';
      const k = 0.14 + (0.76 * Math.abs(j.v)) / d;
      return `<td title="${l[b]} ${y}h: ${dshM(j.v)} em ${j.n} trade(s), ${Math.round((j.w / j.n) * 100)}% de acerto" style="background:${dshRgba(j.v >= 0 ? t.g : t.r, k)};color:${k > 0.55 ? "#fff" : t.tx}"><b>${dshK(j.v)}</b><small>${j.n}</small></td>`;
    },
    p = r.map((b) => sum(i.map((y) => (s[y + "|" + b] || { v: 0 }).v))),
    u = i.map((b) => sum(r.map((y) => (s[b + "|" + y] || { v: 0 }).v))),
    m = Object.entries(s),
    f = (
      m.filter(([, b]) => b.n >= 2).length >= 2
        ? m.filter(([, b]) => b.n >= 2)
        : m
    ).sort((b, y) => b[1].v - y[1].v),
    x = (b) => {
      const [y, j] = b.split("|");
      return `${l[y].toLowerCase()}, ${j}h às ${+j + 1}h`;
    },
    v = f[0],
    g = f[f.length - 1],
    h = (b) => `<span class="dshdot" style="background:${b}"></span>`;
  return `<div class="dshhm"><table><tr><th></th>${r.map((b) => `<th>${b}h</th>`).join("")}<th>Total</th></tr>${i.map((b, y) => `<tr><th>${l[b]}</th>${r.map((j) => c(b, j)).join("")}<td class="dsht ${cls(u[y])}">${dshK(u[y])}</td></tr>`).join("")}<tr><th>Total</th>${p.map((b) => `<td class="dsht ${cls(b)}">${dshK(b)}</td>`).join("")}<td></td></tr></table></div>
<div class="sm" style="margin-top:8px">${g && g[1].v > 0 ? `${h(t.g)}Melhor horário: <b>${x(g[0])}</b> (${dshM(g[1].v)} em ${g[1].n} trades)` : ""}${v && v[1].v < 0 ? `<br>${h(t.r)}Pior horário: <b>${x(v[0])}</b> (${dshM(v[1].v)} em ${v[1].n} trades)` : ""}</div><div class="sm mut">Pela hora de entrada. O número pequeno é a quantidade de trades.</div>`;
}
function dshHist(e, t) {
  const a = e.filter((g) => g.r != null).map((g) => g.r);
  if (a.length < 5)
    return '<div class="sm mut">Precisa de pelo menos 5 trades com stop anotado.</div>';
  const o = -3,
    s = 0.5,
    n = 18,
    r = Array(n).fill(0);
  a.forEach((g) => {
    r[Math.max(0, Math.min(n - 1, Math.floor((g - o) / s)))]++;
  });
  const i = dshLarg(),
    l = i < 500 ? 160 : 190,
    d = 10,
    c = 22,
    p = (i - d * 2) / n,
    u = Math.max(...r);
  let m = "";
  (r.forEach((g, h) => {
    const b = o + h * s,
      y = (g / u) * (l - c - 16),
      j = d + h * p;
    g &&
      (m += `<rect x="${(j + 1.5).toFixed(1)}" y="${(l - c - y).toFixed(1)}" width="${(p - 3).toFixed(1)}" height="${Math.max(2, y).toFixed(1)}" rx="3" fill="${b < 0 ? t.r : t.g}" fill-opacity="${b < -1.01 ? 1 : 0.72}"/><text x="${(j + p / 2).toFixed(1)}" y="${(l - c - y - 4).toFixed(1)}" font-size="11" text-anchor="middle" fill="${t.mut}">${g}</text>`);
  }),
    [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].forEach((g) => {
      const h = d + ((g - o) / s) * p;
      m += `<text x="${Math.max(14, Math.min(i - 14, h)).toFixed(1)}" y="${l - 6}" font-size="11" text-anchor="middle" fill="${t.mut}">${g === -3 ? "≤−3" : g === 6 ? "≥6" : g}×</text>`;
    }));
  const f = d + 4 * p;
  m += `<line x1="${f}" x2="${f}" y1="4" y2="${l - c}" stroke="${t.r}" stroke-dasharray="3 3"/><text x="${f - 4}" y="12" font-size="11" text-anchor="end" fill="${t.r}">−1×</text>`;
  const x = a.filter((g) => g < -1.15).length,
    v = a.filter((g) => g >= 2).length;
  return `<svg viewBox="0 0 ${i} ${l}" class="dshsv" role="img" aria-label="Histograma dos resultados em vezes o risco">${m}</svg><div class="sm" style="margin-top:6px">${x ? `<b class="r">${x} trade(s)</b> perderam mais que o risco planejado (${pct0(x / a.length)}): stop esticado ou sem stop na plataforma.` : '<b class="g">Nenhum trade perdeu mais que o risco planejado:</b> stop respeitado.'} ${v ? `<b class="g">${v}</b> trade(s) que pagaram 2× o risco ou mais (${pct0(v / a.length)}).` : "Nenhum trade chegou a 2× o risco: confira se está saindo cedo demais."}</div><div class="sm mut">${a.length} trade(s) com stop anotado.</div>`;
}
function dshRank(e, t) {
  const a = {};
  e.forEach((i) => {
    var l;
    const d = a[(l = i[t])] ?? (a[l] = { n: 0, v: 0, w: 0, rs: [] });
    (d.n++, (d.v += i.v), i.v > 0 && d.w++, i.r != null && d.rs.push(i.r));
  });
  const o = Object.entries(a).sort((i, l) => l[1].v - i[1].v);
  if (!o.length) return "";
  const s = Math.max(...o.map(([, i]) => Math.abs(i.v))) || 1,
    n = dshCor(),
    r = t === "setup" ? "s" : "a";
  return `${(o.length > 8 ? [...o.slice(0, 5), ...o.slice(-3)] : o).map(([i, l], d) => `${o.length > 8 && d === 5 ? '<div class="sm mut" style="margin:4px 0">…</div>' : ""}<div class="dshrr${DSH[r] === i ? " on" : ""}" data-dshf="${r}" data-v="${esc(i)}"><div class="top sm"><b>${esc(i)}</b><b class="${cls(l.v)}">${dshM(l.v)}</b></div><div class="dshbar"><i style="width:${Math.max(2, (Math.abs(l.v) / s) * 100).toFixed(1)}%;background:${l.v >= 0 ? n.g : n.r}"></i></div><div class="sm mut">${l.n} trade(s) · ${pct0(l.w / l.n)} de acerto${l.rs.length ? " · " + dshN(sum(l.rs) / l.rs.length) + "× risco por trade" : ""}</div></div>`).join("")}
<div class="sm mut" style="margin-top:6px">${o.length > 8 ? `Mostrando os 5 melhores e os 3 piores de ${o.length}. ` : ""}Toque para filtrar o dashboard${DSH[r] ? " (toque de novo para tirar o filtro)" : ""}.</div>`;
}
function dshTab(e, t) {
  return `<div style="overflow-x:auto"><table class="dshtb"><tr>${e.map((a) => `<th>${a}</th>`).join("")}</tr>${t.join("")}</table></div>`;
}
function dshCab(e, t, a) {
  const o = (k, A) => {
      const C = A.length;
      if (!C) return "";
      const I = sum(A.map((se) => se.v)),
        J = A.filter((se) => se.r != null).map((se) => se.r);
      return `<tr><td>${k}</td><td>${C}</td><td>${pct0(A.filter((se) => se.v > 0).length / C)}</td><td>${J.length ? dshN(sum(J) / J.length) + "×" : "–"}</td><td class="${cls(I)}">${dshM(I)}</td></tr>`;
    },
    s = ["", "Trades", "Acerto", "Média", "Resultado"],
    n = (typeof EMO2 < "u" ? EMO2 : [])
      .map(([k, A]) =>
        o(
          A,
          e.filter((C) => C.emo === k),
        ),
      )
      .filter(Boolean),
    r = [
      o(
        "Seguiu as regras",
        e.filter((k) => k.ok && !k.fx),
      ),
      o(
        "Quebrou as regras",
        e.filter((k) => !k.ok),
      ),
    ].filter(Boolean),
    i = {};
  e.filter((k) => k.err).forEach((k) => {
    var A;
    return (i[(A = k.err)] ?? (i[A] = [])).push(k);
  });
  const l = Object.entries(i)
      .sort((k, A) => sum(k[1].map((C) => C.v)) - sum(A[1].map((C) => C.v)))
      .slice(0, 6)
      .map(([k, A]) => o(esc(k), A)),
    d = loc().slice(0, 10),
    c = [];
  for (let k = 5; k >= 0; k--) {
    const A = new Date(d.slice(0, 8) + "15T12:00:00Z");
    (A.setUTCMonth(A.getUTCMonth() - k), c.push(A.toISOString().slice(0, 7)));
  }
  const p = c.map(
      (k) =>
        -sum(
          t
            .filter((A) => A.d.slice(0, 7) === k && A.err && A.v < 0)
            .map((A) => A.v),
        ),
    ),
    u = Math.max(...p) || 1,
    m = [
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
    ],
    f = dshLarg(),
    x = 120,
    v = (f - 20) / 6;
  let g = "";
  p.forEach((k, A) => {
    const C = (k / u) * (x - 40),
      I = 10 + A * v;
    g += `<rect x="${(I + v * 0.2).toFixed(1)}" y="${(x - 22 - C).toFixed(1)}" width="${(v * 0.6).toFixed(1)}" height="${Math.max(k ? 2 : 0, C).toFixed(1)}" rx="4" fill="${a.r}" fill-opacity="${A === 5 ? 0.55 : 0.9}"/><text x="${(I + v / 2).toFixed(1)}" y="${(x - 26 - C).toFixed(1)}" font-size="11" text-anchor="middle" fill="${a.mut}">${k ? dshK(-k) : ""}</text><text x="${(I + v / 2).toFixed(1)}" y="${x - 6}" font-size="11" text-anchor="middle" fill="${a.mut}">${m[+c[A].slice(5, 7) - 1]}</text>`;
  });
  const h = e.filter((k) => !k.ok),
    b = e.filter((k) => k.ok && !k.fx),
    y = h.length ? sum(h.map((k) => k.v)) / h.length : null,
    j = b.length ? sum(b.map((k) => k.v)) / b.length : null;
  return `${r.length ? `<b class="sm">Regras</b>${dshTab(s, r)}${y != null && j != null && h.length >= 3 ? `<div class="sm" style="margin:4px 0 10px">Quando quebra as regras, cada trade rende <b class="${cls(y - j)}">${dshM(Math.abs(y - j))}</b> a ${y < j ? "menos" : "mais"} que quando segue.</div>` : ""}` : ""}
${n.length ? `<b class="sm">Emoção no trade</b>${dshTab(s, n)}` : '<div class="sm mut" style="margin:6px 0">Marque como você estava (calmo, ansioso, com medo…) ao encerrar o trade para ver o resultado por emoção.</div>'}
${l.length ? `<b class="sm" style="display:block;margin-top:10px">Erros mais caros</b>${dshTab(s, l)}` : ""}
<b class="sm" style="display:block;margin-top:10px">Custo dos erros por mês</b><svg viewBox="0 0 ${f} ${x}" class="dshsv" role="img" aria-label="Custo dos erros por mês">${g}</svg>`;
}
function dshMk(e, t, a) {
  const o = (p) =>
      dshKpi(
        e.filter(
          (u) =>
            u.d >= t &&
            u.d <= a &&
            u.us === p &&
            (!DSH.s || u.setup === DSH.s) &&
            (!DSH.a || u.at === DSH.a),
        ),
      ),
    s = o(!1),
    n = o(!0);
  if (!s.n || !n.n)
    return s.n || n.n
      ? `<div class="sm mut">Só tem trades ${s.n ? "no Brasil" : "nos EUA"} neste período.</div>`
      : "";
  const r = (p, u, m, f) =>
      `<tr><td>${p}</td><td class="${f ? cls(f[0]) : ""}">${u}</td><td class="${f ? cls(f[1]) : ""}">${m}</td></tr>`,
    i = [
      r("Resultado", dshM(s.net), dshM(n.net), [s.net, n.net]),
      r("Trades", s.n, n.n),
      r("Acerto", pct0(s.win), pct0(n.win)),
      r("Ganho ÷ perda", dshN(s.payoff), dshN(n.payoff)),
      r("Fator de lucro", dshN(s.pf), dshN(n.pf)),
      r("Por trade", dshM(s.mv), dshM(n.mv), [s.mv, n.mv]),
      r(
        "Média × risco",
        s.mr != null ? dshN(s.mr) + "×" : "–",
        n.mr != null ? dshN(n.mr) + "×" : "–",
        [s.mr, n.mr],
      ),
      r("Maior queda", dshM(-s.dd), dshM(-n.dd)),
      r("Dias positivos", `${s.dPos} de ${s.dias}`, `${n.dPos} de ${n.dias}`),
    ],
    l = s.dias ? s.net / s.dias : 0,
    d = n.dias ? n.net / n.dias : 0,
    c = l >= d ? "Brasil" : "EUA";
  return `${dshTab(["", "Brasil", "EUA"], i)}<div class="sm" style="margin-top:8px">Por dia operado, <b>${c}</b> pagou mais: ${dshM(Math.max(l, d))} contra ${dshM(Math.min(l, d))}${s.n < 10 || n.n < 10 ? " (ainda com poucos trades, compare com cuidado)" : ""}.</div>`;
}
function dshAneis(e) {
  const t = loc().slice(0, 10),
    a = t.slice(0, 7),
    o = a + "-01",
    s = dshTodas().filter((x) => x.d >= o && x.d <= t),
    n = sum(s.map((x) => x.v)),
    r = (() => {
      try {
        return crCfg();
      } catch {
        return {};
      }
    })(),
    i = +(S.ax || {}).dshMeta || +r.alvo || +r.renda || 0,
    l = [
      ...new Set(
        S.trades
          .filter((x) => String(x.dt).slice(0, 7) === a)
          .map((x) => String(x.dt).slice(0, 10)),
      ),
    ],
    d = l.filter(
      (x) =>
        !S.trades.some(
          (v) =>
            String(v.dt).slice(0, 10) === x &&
            (v.rules === "n" || (v.err && v.err !== "Nenhum")),
        ) && !(typeof diaRuim == "function" && diaRuim(x)),
    ),
    c = l.filter((x) => {
      const v = S.days[x] || {};
      return (
        String(v.resumo || "").trim() ||
        String(((v.noite || {}).deb || {}).resumo || "").trim()
      );
    }),
    p = [];
  for (let x = segundaDe(o); x <= t; x = diasMais(x, 7))
    (diasMais(x, 4) < t ||
      (x <= t && new Date(t + "T12:00:00Z").getUTCDay() >= 5)) &&
      p.push(x);
  const u = p.filter((x) => ((S.ax || {}).rvg || {})[x]),
    m = [
      [
        "Resultado × meta",
        i > 0 ? n / i : 0,
        i > 0 ? `${dshM(n)} de ${dshM(i)}` : "defina a meta abaixo",
        e.g,
      ],
      [
        "Dias seguindo o plano",
        l.length ? d.length / l.length : 0,
        `${d.length} de ${l.length} dia(s)`,
        e.ac,
      ],
      [
        "Debriefings feitos",
        l.length ? c.length / l.length : 0,
        `${c.length} de ${l.length} dia(s)`,
        e.am,
      ],
      [
        "Revisões da semana",
        p.length ? u.length / p.length : 0,
        `${u.length} de ${p.length} semana(s)`,
        "#b2aca0",
      ],
    ],
    f = (x, v, g) => {
      const h = 80 - x * 17,
        b = 2 * Math.PI * h,
        y = Math.max(0, Math.min(1, v || 0));
      return `<circle cx="95" cy="95" r="${h}" fill="none" stroke="${g}" stroke-opacity=".16" stroke-width="13"/>${y > 0 ? `<circle cx="95" cy="95" r="${h}" fill="none" stroke="${g}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${(b * y).toFixed(1)} ${b.toFixed(1)}" transform="rotate(-90 95 95)"/>` : ""}`;
    };
  return `<div class="dshan"><svg viewBox="0 0 190 190" role="img" aria-label="Metas do mês">${m.map((x, v) => f(v, x[1], x[3])).join("")}</svg><div>${m.map((x) => `<div class="sm" style="margin:5px 0"><span class="dshdot" style="background:${x[3]}"></span><b>${x[0]}</b> · ${Math.round(Math.max(0, x[1]) * 100)}%<div class="mut" style="margin-left:14px">${x[2]}</div></div>`).join("")}</div></div>
<label class="sm" style="display:flex;align-items:center;gap:8px;margin-top:8px">Meta do mês (R$)<input type="number" inputmode="decimal" data-dshmeta value="${i || ""}" placeholder="ex.: 3000" style="max-width:140px;margin:0"></label>`;
}
function vDash() {
  const e = dshCor(),
    t = dshTodas(),
    a = dshPer(DSH.p);
  if (!t.length)
    return '<h1>Dashboard</h1><div class="card">Ainda não há trades encerrados. Assim que você registrar os primeiros, os números aparecem aqui.</div>';
  const o = dshFiltra(t, a.a, a.b),
    s = dshKpi(o),
    n = a.pa ? dshKpi(dshFiltra(t, a.pa, a.pb)) : null,
    r = [...new Set(t.map((u) => u.at))].sort(),
    i = [...new Set(t.map((u) => u.setup))].sort(),
    l = (u, m) =>
      `<div class="seg dshseg">${m.map(([f, x]) => `<button class="${DSH[u] === f ? "on" : ""}" data-dsh="${u}" data-v="${f}">${x}</button>`).join("")}</div>`,
    d = (u, m, f) =>
      `<label>${m}<select data-dshsel="${u}"><option value="">Todos</option>${f.map((x) => `<option value="${esc(x)}"${DSH[u] === x ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`,
    c = (u, m, f = "") =>
      m
        ? `<div class="dsi ${f}"><h2>${u}</h2><div class="card">${m}</div></div>`
        : "",
    p = typeof mmDash == "function" ? mmDash() : "";
  return `<div id="dshw"><div class="top" style="align-items:center;gap:8px"><h1 style="margin:0">Dashboard</h1><div class="dshx"><button class="btn s" data-dshx="img">Imagem</button><button class="btn s" data-dshx="pdf">PDF</button></div></div>
<div class="sm mut" style="margin:4px 0 10px">${a.nome}${DSH.m !== "all" ? " · " + (DSH.m === "us" ? "EUA" : "Brasil") : ""}${DSH.s ? " · setup " + esc(DSH.s) : ""}${DSH.a ? " · " + esc(DSH.a) : ""} · em R$ (US$ convertido)${a.cmp && n && n.n ? " · as setas comparam com " + a.cmp : ""}</div>
<div class="dshf">${l("p", [
    ["30", "30 dias"],
    ["90", "90 dias"],
    ["mes", "Mês"],
    ["ano", "Ano"],
    ["all", "Tudo"],
  ])}${l("m", [
    ["all", "Todos"],
    ["br", "Brasil"],
    ["us", "EUA"],
  ])}<div class="g2">${d("s", "Setup", i)}${d("a", "Ativo", r)}</div></div>
${o.length ? dshTiles(s, n) : '<div class="card sm mut">Nenhum trade com esses filtros.</div>'}
<div class="dshg">${c("Curva de capital e quedas", o.length ? dshEq(o, e) : "", "w2")}${c("Metas do mês", dshAneis(e))}${c("Distribuição dos resultados (× risco)", o.length ? dshHist(o, e) : "")}
${c("Resultado por hora e dia da semana", o.length ? dshHm(o, e) : "", "w2")}${c("Setups", dshRank(dshFiltra(t, a.a, a.b, "s"), "setup"))}${c("Ativos", dshRank(dshFiltra(t, a.a, a.b, "a"), "at"))}
${c("Brasil × EUA", DSH.m === "all" ? dshMk(t, a.a, a.b) : "")}${c("Cabeça e disciplina", o.length ? dshCab(o, t, e) : "")}${c("Mesas proprietárias", p, "w2")}</div></div>`;
}
{
  const e = TraderStyles.slot("legacy-042");
  ((e.textContent = TraderStyles.css("legacy-042")), TraderStyles.mount(e));
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-dsh]");
  if (t) {
    ((DSH[t.dataset.dsh] = t.dataset.v), dshGuarda());
    const s = scrollY;
    (render(), scrollTo(0, s));
    return;
  }
  const a = e.target.closest("[data-dshf]");
  if (a) {
    const s = a.dataset.dshf,
      n = a.dataset.v;
    ((DSH[s] = DSH[s] === n ? "" : n), dshGuarda());
    const r = scrollY;
    (render(), scrollTo(0, r));
    return;
  }
  const o = e.target.closest("[data-dshx]");
  o && (o.dataset.dshx === "pdf" ? dshPdf() : dshImg());
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-dshsel]");
    if (t) {
      ((DSH[t.dataset.dshsel] = t.value), dshGuarda());
      const o = scrollY;
      (render(), scrollTo(0, o));
      return;
    }
    const a = e.target.closest("[data-dshmeta]");
    if (a) {
      (((S.ax ?? (S.ax = {})).dshMeta = +a.value || 0), save());
      const o = scrollY;
      (render(), scrollTo(0, o));
    }
  }));
async function dshImg() {
  const e = document.getElementById("dshw");
  if (e) {
    toast("Gerando a imagem…");
    try {
      const t = await (
          await pdfLib(
            "html2canvas",
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            () => window.html2canvas,
          )
        )(e, {
          scale: 2,
          backgroundColor:
            getComputedStyle(document.body).backgroundColor || "#fff",
          useCORS: !0,
          logging: !1,
          ignoreElements: (n) =>
            !!(
              n.classList &&
              (n.classList.contains("dshf") || n.classList.contains("dshx"))
            ),
        }),
        a = await new Promise((n) =>
          (
            window.TraderExportBrand?.frame(t, "Desempenho e registros") || t
          ).toBlob(n, "image/png"),
        ),
        o = new File([a], "dashboard-" + loc().slice(0, 10) + ".png", {
          type: "image/png",
        });
      if (navigator.canShare && navigator.canShare({ files: [o] })) {
        await navigator.share({ files: [o], title: "Meu dashboard" });
        return;
      }
      const s = document.createElement("a");
      ((s.href = URL.createObjectURL(a)),
        (s.download = o.name),
        document.body.appendChild(s),
        s.click(),
        s.remove(),
        setTimeout(() => URL.revokeObjectURL(s.href), 4e4));
    } catch (t) {
      if (t && t.name === "AbortError") return;
      toast("Não consegui gerar a imagem: " + ((t && t.message) || t), 4e3);
    }
  }
}
function dshPdf() {
  DSH_COR = DSH_CLARO;
  let e;
  try {
    e = vDash();
  } finally {
    DSH_COR = null;
  }
  const t = document.createElement("div");
  t.innerHTML = e;
  const a = t.querySelector("#dshw");
  ((a.id = "anx_rep"),
    a.querySelectorAll(".dshf,.dshx").forEach((r) => r.remove()));
  const o = a.querySelector(".dshg");
  o && ([...o.children].forEach((r) => a.insertBefore(r, o)), o.remove());
  const s = a.querySelector("h1");
  (s && s.closest(".top").remove(),
    (a.style.display = "none"),
    document.body.appendChild(a));
  try {
    anxPdf();
  } finally {
    a.remove();
  }
  const n = dshPer(DSH.p);
  try {
    ((PDFB.tt = "Dashboard · " + n.nome),
      (PDFB.name = "dashboard-" + loc().slice(0, 10) + ".pdf"));
    const r = document.querySelector("#pdfbody h1");
    (r && (r.textContent = PDFB.tt), pdfBar());
  } catch {}
}
if (OPS_D === "dash") {
  OPS_D = "stats";
  try {
    ls.set("diario-ops-d", "stats");
  } catch {}
}
{
  const e = render0;
  render0 = function () {
    (tab === "dash" && (tab = "stats"), e.apply(this, arguments));
  };
}
{
  let e = 0,
    t = innerWidth;
  addEventListener("resize", () => {
    (clearTimeout(e),
      (e = setTimeout(() => {
        if (
          Math.abs(innerWidth - t) > 40 &&
          [
            "stats",
            "mesa",
            "rev",
            "home",
            "trades",
            "swing",
            "opc",
            "ativos",
          ].includes(tab)
        ) {
          t = innerWidth;
          const a = scrollY;
          (render(), scrollTo(0, a));
        }
      }, 300)));
  });
}
GOR.dash = () => {
  ((GO.r = null), irPara("stats"));
};
const MM = { nova: !1, prev: null, dup: null };
function mmLista() {
  const e = S.ax ?? (S.ax = {});
  if (!Array.isArray(e.mesas)) {
    e.mesas = [];
    const a = e.mesa && e.mesa.preset ? e.mesa : null;
    a &&
      (a.id || (a.id = "m1"),
      a.on == null && (a.on = 1),
      e.mesas.push(a),
      (S.mesaTr || []).forEach((o) => {
        o.m || (o.m = a.id);
      }));
  }
  const t = e.mesa;
  if (t && t.preset) {
    t.id ||
      ((t.id = MM.prev || "m" + Date.now().toString(36)),
      t.on == null && (t.on = 1),
      (MM.prev = null),
      (MM.nova = !1));
    const a = e.mesas.findIndex((o) => o.id === t.id);
    (a < 0 ? e.mesas.push(t) : e.mesas[a] !== t && (e.mesas[a] = t),
      (S.mesaTr || []).forEach((o) => {
        o.m || (o.m = t.id);
      }));
  }
  return e.mesas;
}
{
  const e = mesaCfg;
  mesaCfg = function () {
    return MM.nova ? null : e.apply(this, arguments);
  };
}
{
  const e = mesaItens;
  mesaItens = function (t) {
    if (!t || t.fonte !== "mesa") return e.apply(this, arguments);
    mmLista();
    const a = S.mesaTr;
    S.mesaTr = (a || []).filter((o) => !t.id || (o.m || t.id) === t.id);
    try {
      return e.apply(this, arguments);
    } finally {
      S.mesaTr = a;
    }
  };
}
document.addEventListener(
  "click",
  (e) => {
    if (e.target.closest("[data-msp]")) {
      const t = mesaCfg();
      MM.prev = MM.nova ? null : (t && t.id) || null;
    }
  },
  !0,
);
function mmLinha(e) {
  let t;
  try {
    t = mesaCalc(e);
  } catch {
    return "";
  }
  const a = (s) => mFmt(e, s),
    o = (S.ax || {}).mesa;
  return `<div class="mml"><div class="top"><b>${esc(e.nome || "Mesa")}</b><span class="chip" style="color:${t.st[1]};border-color:${t.st[1]}">${t.st[0]}</span></div>
${t.pode ? `<div class="sm mut" style="margin-top:6px">Hoje ainda pode perder</div><div class="big2 ${t.pode[1] <= 0 ? "r" : ""}">${t.pode[1] <= 0 ? "Nada: pare" : a(t.pode[1])}</div>` : ""}
<div class="sm" style="margin-top:6px;display:flex;justify-content:space-between"><span>Hoje <b class="${cls(t.plHoje)}">${a(t.plHoje)}</b></span><span>Total <b class="${cls(t.saldo)}">${a(t.saldo)}</b></span></div>
${t.meta > 0 ? `<div class="sm mut" style="margin-top:4px">Meta ${a(t.meta)} · ${pct0(Math.max(0, t.lucroEf) / t.meta)}</div>${barra(t.lucroEf / t.meta, "var(--g)")}` : ""}
${t.margem != null && t.pt > 0 ? `<div class="sm mut" style="margin-top:4px">Folga até a perda total: ${a(t.margem)}</div>${barra(t.margem / t.pt, t.margem < t.pt * 0.3 ? "var(--r)" : "var(--am)")}` : ""}
<button class="btn s" style="width:100%;margin-top:8px" data-mmsel="${esc(e.id)}" data-mmir="1">${o && o.id === e.id ? "Abrir" : "Abrir esta mesa"}</button></div>`;
}
const mmAtivas = () => mmLista().filter((e) => e.on !== 0 && e.preset);
function mmDash() {
  const e = mmAtivas();
  if (!e.length) return "";
  const t = {};
  return (
    e.forEach((a) => {
      try {
        const o = mesaCalc(a),
          s = a.moeda === "USD" ? "USD" : "BRL";
        (t[s] ?? (t[s] = { h: 0, s: 0 }),
          (t[s].h += o.plHoje),
          (t[s].s += o.saldo));
      } catch {}
    }),
    `${
      e.length > 1
        ? `<div class="sm" style="margin-bottom:8px">${Object.entries(t)
            .map(
              ([a, o]) =>
                `${a === "USD" ? "Em US$" : "Em R$"}: hoje <b class="${cls(o.h)}">${mnyC(o.h, a)}</b> · total <b class="${cls(o.s)}">${mnyC(o.s, a)}</b>`,
            )
            .join("<br>")}</div>`
        : ""
    }<div class="mmg">${e.map(mmLinha).join("")}</div>`
  );
}
{
  const e = mesaMini;
  mesaMini = function () {
    const t = mmAtivas();
    return t.length <= 1
      ? e.apply(this, arguments)
      : `<div class="card" style="padding:12px 14px"><div class="top"><b>${t.length} mesas em operação</b><button class="btn s" data-m2="mesa">Abrir</button></div><div class="mmg" style="margin-top:8px">${t.map(mmLinha).join("")}</div></div>`;
  };
}
function mmBarra() {
  const e = mmLista(),
    t = (S.ax || {}).mesa;
  return !e.length && !MM.nova
    ? ""
    : `<div class="mmbar">${e
        .map((a) => {
          let o = "var(--mut)";
          try {
            a.on !== 0 && (o = mesaCalc(a).st[1]);
          } catch {}
          return `<button class="${!MM.nova && t && t.id === a.id ? "on" : ""}" data-mmsel="${esc(a.id)}"><span class="mmdot" style="background:${o}"></span>${esc(a.nome || "Mesa")}${a.on === 0 ? " (pausada)" : ""}</button>`;
        })
        .join(
          "",
        )}<button class="${MM.nova ? "on" : ""}" data-mmnova="1">＋ Nova mesa</button></div>
${MM.nova ? '<div class="card sm">Escolha abaixo a mesa nova. As outras continuam como estão, cada uma com as próprias operações e regras. <button class="btn s" data-mmcanc="1" style="margin-left:6px">Cancelar</button></div>' : e.length > 1 ? `<h2>Todas as mesas</h2>${mmDash()}` : ""}`;
}
function mmRodape(e) {
  const t = mmLista().filter((a) => a.id !== e.id);
  return `<h2>Esta mesa</h2><div class="card"><label class="ck"><input type="checkbox" data-mmon${e.on !== 0 ? " checked" : ""}><span>Em operação (aparece no Início, no dashboard e nos avisos)</span></label>
<div class="g2" style="margin-top:8px"><button class="btn s" data-mmnova="1">＋ Adicionar outra mesa</button><button class="btn s d" data-mmdel="1">Excluir esta mesa</button></div>${t.length ? "" : '<div class="sm mut" style="margin-top:6px">Opera em mais de uma mesa? Adicione as outras: cada uma fica com as próprias regras e operações, e o Início mostra todas juntas.</div>'}</div>`;
}
{
  const e = vMesa;
  vMesa = function () {
    mmLista();
    const t = S.ax || {},
      a = t.mesa,
      o = S.mesaTr;
    a &&
      a.id &&
      Array.isArray(o) &&
      (S.mesaTr = o.filter((n) => (n.m || a.id) === a.id));
    let s;
    try {
      s = e.apply(this, arguments);
    } finally {
      S.mesaTr = o;
    }
    try {
      s = s.replace(
        "<h1>Mesa proprietária</h1>",
        "<h1>Mesa proprietária</h1>" + mmBarra(),
      );
      const n = mesaCfg();
      if (n && n.id && !MM.nova) {
        const r = mmAtivas().filter((i) => i.id !== n.id && i.fonte === "mesa");
        (n.fonte === "mesa" &&
          r.length &&
          (s = s.replace(
            /(<button class="btn" data-mtx="salvar")/,
            `<div class="sm" style="margin-top:8px">Lançar a mesma operação também em:</div><div class="chips2" style="margin:4px 0">${r.map((i) => `<label class="ck sm" style="margin:2px 8px 2px 0"><input type="checkbox" data-mmdup="${esc(i.id)}"><span>${esc(i.nome)}</span></label>`).join("")}</div>$1`,
          )),
          (s += mmRodape(n)));
      }
    } catch (n) {
      console.error(n);
    }
    return s;
  };
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-mmsel]");
    if (t) {
      mmLista();
      const a = S.ax.mesas.find((o) => o.id === t.dataset.mmsel);
      a &&
        ((S.ax.mesa = a),
        (MM.nova = !1),
        save(),
        t.dataset.mmir && (tab = "mesa"),
        render(),
        scrollTo(0, 0));
      return;
    }
    if (e.target.closest("[data-mmnova]")) {
      (mmLista(), (MM.nova = !0), (MM.prev = null), render(), scrollTo(0, 0));
      return;
    }
    if (e.target.closest("[data-mmcanc]")) {
      ((MM.nova = !1), render());
      return;
    }
    if (e.target.closest("[data-mmdel]")) {
      const a = mesaCfg();
      if (!a || !a.id) return;
      const o = (S.mesaTr || []).filter((n) => n.m === a.id);
      if (
        !confirm(
          `Excluir a mesa "${a.nome}"${o.length ? ` e as ${o.length} operação(ões) dela` : ""}? Não dá para desfazer.`,
        )
      )
        return;
      const s = Date.now();
      (o.forEach((n) => {
        (S.del ?? (S.del = {}))[n.id] = s;
      }),
        (S.mesaTr = (S.mesaTr || []).filter((n) => n.m !== a.id)),
        (S.ax.mesas = S.ax.mesas.filter((n) => n.id !== a.id)),
        (S.ax.mesa = S.ax.mesas[0] || null),
        S.ax.mesa || delete S.ax.mesa,
        save(),
        render(),
        toast("Mesa excluída."));
      return;
    }
    if (e.target.closest('[data-mtx="salvar"]') && typeof MT < "u" && !MT.ed) {
      const a = [...document.querySelectorAll("[data-mmdup]:checked")].map(
        (o) => o.dataset.mmdup,
      );
      if (a.length) {
        const o = new Set((S.mesaTr || []).map((n) => n.id)),
          s = (mesaCfg() || {}).id;
        setTimeout(() => {
          const n = (S.mesaTr || []).filter((r) => !o.has(r.id));
          n.length &&
            (n.forEach((r) => {
              (r.m || (r.m = s),
                a.forEach((i) =>
                  S.mesaTr.push({ ...r, id: uid(), m: i, u: Date.now() }),
                ));
            }),
            save(),
            render(),
            toast(`Lançada também em ${a.length} outra(s) mesa(s).`));
        }, 0);
      }
    }
  },
  !0,
),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-mmon]");
    if (!t) return;
    const a = mesaCfg();
    a && ((a.on = t.checked ? 1 : 0), save(), render());
  }));
{
  const e = limiteConfere;
  limiteConfere = function () {
    e.apply(this, arguments);
    try {
      const t = mesaCfg();
      mmAtivas()
        .filter((a) => !t || a.id !== t.id)
        .forEach((a) => {
          const o = mesaCalc(a),
            s = "mesa.av." + a.id + "." + o.hoje;
          !o.pode ||
            o.pode[1] > 0 ||
            (S.ax || {})[s] ||
            ((S.ax[s] = 1),
            save(),
            toast(
              "🛑 " + a.nome + ": você chegou ao limite de perda de hoje.",
              5e3,
            ));
        });
    } catch {}
  };
}
const PCH = {};
lineChart = function (e, t, a, o) {
  if (!t || !t.length) return "";
  const s = dshCor(),
    n = dshLarg(1),
    r = n < 500 ? 160 : 200,
    i = 46,
    l = 10,
    d = 12,
    c = 22,
    p = t.length,
    u = Math.min(0, ...t),
    m = Math.max(0, ...t),
    f = m - u || 1,
    x = (J) => (p > 1 ? i + (J * (n - i - l)) / (p - 1) : (i + n - l) / 2),
    v = (J) => d + ((m - J) / f) * (r - d - c),
    g = t[p - 1],
    h = m <= 0,
    b = h || (g < t[0] && g < 0) ? s.r : s.g,
    y = v(0);
  PCH[e] = {
    k: "l",
    vals: t,
    labels: a,
    f: o || dshK,
    W: n,
    H: r,
    pl: i,
    pr: l,
    pt: d,
    pb: c,
    lo: u,
    hi: m,
  };
  const j = t
      .map((J, se) => `${x(se).toFixed(1)},${v(J).toFixed(1)}`)
      .join(" "),
    k = t.indexOf(Math.max(...t)),
    A = t.indexOf(Math.min(...t)),
    C = [0, 1, 2, 3]
      .map((J) => {
        const se = m - (J * f) / 3;
        return `<line x1="${i}" x2="${n - l}" y1="${v(se).toFixed(1)}" y2="${v(se).toFixed(1)}" stroke="${s.bd}" stroke-dasharray="${Math.abs(se) < 1e-9 ? "0" : "3 4"}"/><text x="${i - 6}" y="${(v(se) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${s.mut}">${dshK(se)}</text>`;
      })
      .join(""),
    I = (J, se, Ie) =>
      `<circle cx="${x(J).toFixed(1)}" cy="${v(t[J]).toFixed(1)}" r="3.5" fill="${se}"/><text x="${Math.max(i + 20, Math.min(n - l - 20, x(J))).toFixed(1)}" y="${(v(t[J]) + (Ie ? -8 : 16)).toFixed(1)}" font-size="11" font-weight="700" text-anchor="middle" fill="${se}">${dshK(t[J])}</text>`;
  return `<div class="card pch"><div class="sm mut" id="chr-${e}">${p} ponto(s) · toque ou arraste no gráfico</div><svg viewBox="0 0 ${n} ${r}" class="dshsv" data-pch="${e}" style="touch-action:pan-y" role="img"><defs><linearGradient id="pg-${e}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}" stop-opacity="${h ? 0 : 0.28}"/><stop offset="1" stop-color="${b}" stop-opacity="${h ? 0.28 : 0}"/></linearGradient></defs>${C}
<polygon points="${x(0).toFixed(1)},${y.toFixed(1)} ${j} ${x(p - 1).toFixed(1)},${y.toFixed(1)}" fill="url(#pg-${e})"/><polyline points="${j}" fill="none" stroke="${b}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
${p > 2 && !h && t[k] > 0 ? I(k, s.g, 1) : ""}${p > 2 && t[A] < 0 && A !== k ? I(A, s.r, 0) : ""}<circle cx="${x(p - 1).toFixed(1)}" cy="${v(g).toFixed(1)}" r="4.5" fill="${b}" stroke="${s.card}" stroke-width="2"/>
<line id="pchl-${e}" y1="${d}" y2="${r - c}" stroke="${s.mut}" stroke-dasharray="3 3" style="display:none"/><circle id="pchc-${e}" r="5" fill="${s.ac}" stroke="${s.card}" stroke-width="2" style="display:none"/>
${a && a.length ? `<text x="${i}" y="${r - 5}" font-size="11" fill="${s.mut}">${esc(String(a[0]).slice(0, 14))}</text><text x="${n - l}" y="${r - 5}" font-size="11" text-anchor="end" fill="${s.mut}">${esc(String(a[p - 1]).slice(0, 14))}</text>` : ""}</svg></div>`;
};
function pchBarras(e, t, a, o) {
  if (!t || !t.length) return "";
  const s = dshCor(),
    n = dshLarg(1),
    r = n < 500 ? 150 : 180,
    i = 46,
    l = 10,
    d = 16,
    c = 22,
    p = t.length,
    u = Math.min(0, ...t),
    m = Math.max(0, ...t),
    f = m - u || 1,
    x = (C) => d + ((m - C) / f) * (r - d - c),
    v = x(0),
    g = (n - i - l) / p,
    h = sum(t) / p;
  PCH[e] = { k: "b", vals: t, labels: a, f: o, W: n, pl: i, pr: l, n: p };
  const b = [0, 1, 2]
      .map((C) => {
        const I = m - (C * f) / 2;
        return `<line x1="${i}" x2="${n - l}" y1="${x(I).toFixed(1)}" y2="${x(I).toFixed(1)}" stroke="${s.bd}" stroke-dasharray="3 4"/><text x="${i - 6}" y="${(x(I) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${s.mut}">${dshK(I)}</text>`;
      })
      .join(""),
    y = t
      .map((C, I) => {
        const J = Math.min(x(C), v),
          se = Math.max(1.5, Math.abs(x(C) - v)),
          Ie = i + I * g + g * 0.14;
        return `<rect data-i="${I}" x="${Ie.toFixed(1)}" y="${J.toFixed(1)}" width="${Math.max(1.5, g * 0.72).toFixed(1)}" height="${se.toFixed(1)}" rx="${Math.min(4, g * 0.2).toFixed(1)}" fill="${C >= 0 ? s.g : s.r}"/>`;
      })
      .join(""),
    j = Math.max(1, Math.ceil(p / (n < 500 ? 6 : 10))),
    k = a
      ? t
          .map((C, I) =>
            I % j === 0 ||
            (I === p - 1 && p - 1 - Math.floor((p - 1) / j) * j > j / 2)
              ? `<text x="${(i + I * g + g / 2).toFixed(1)}" y="${r - 5}" font-size="10.5" text-anchor="middle" fill="${s.mut}">${esc(String(a[I]).slice(0, 6))}</text>`
              : "",
          )
          .join("")
      : "",
    A = t.filter((C) => C > 0).length;
  return `<div class="card pch"><div class="sm mut" id="chr-${e}">${A} de ${p} positivo(s) · média ${o(h)} · toque numa barra</div><svg viewBox="0 0 ${n} ${r}" class="dshsv" data-pch="${e}" style="touch-action:pan-y" role="img">${b}<line x1="${i}" x2="${n - l}" y1="${v.toFixed(1)}" y2="${v.toFixed(1)}" stroke="${s.mut}" stroke-width=".8"/>${y}
${p > 2 ? `<line x1="${i}" x2="${n - l}" y1="${x(h).toFixed(1)}" y2="${x(h).toFixed(1)}" stroke="${s.ac}" stroke-dasharray="5 4" stroke-width="1.2"/><text x="${n - l}" y="${(x(h) - 4).toFixed(1)}" font-size="10.5" text-anchor="end" fill="${s.ac}">média</text>` : ""}${k}</svg></div>`;
}
((barChart = function (e, t, a) {
  return pchBarras(e, t, a, (o) => money(o));
}),
  (barChartU = function (e, t, a) {
    return pchBarras(e, t, a, (o) => usd(o));
  }));
function pchToque(e) {
  const t = e.target.closest && e.target.closest("svg[data-pch]");
  if (!t) return;
  const a = t.dataset.pch,
    o = PCH[a];
  if (!o) return;
  const s = t.getBoundingClientRect(),
    n = ((e.clientX - s.left) / s.width) * o.W,
    r = o.vals.length,
    i = document.getElementById("chr-" + a);
  if (o.k === "l") {
    const l = Math.max(
        0,
        Math.min(
          r - 1,
          Math.round(((n - o.pl) / (o.W - o.pl - o.pr)) * (r - 1)),
        ),
      ),
      d = r > 1 ? o.pl + (l * (o.W - o.pl - o.pr)) / (r - 1) : o.W / 2,
      c =
        o.pt + ((o.hi - o.vals[l]) / (o.hi - o.lo || 1)) * (o.H - o.pt - o.pb),
      p = document.getElementById("pchl-" + a),
      u = document.getElementById("pchc-" + a);
    (p &&
      (p.setAttribute("x1", d),
      p.setAttribute("x2", d),
      (p.style.display = "")),
      u &&
        (u.setAttribute("cx", d),
        u.setAttribute("cy", c),
        (u.style.display = "")),
      i &&
        (i.innerHTML = `${esc(o.labels ? o.labels[l] : "")} · <b>${esc(o.f(o.vals[l]))}</b>`));
  } else {
    const l = Math.max(
      0,
      Math.min(r - 1, Math.floor((n - o.pl) / ((o.W - o.pl - o.pr) / r))),
    );
    (t
      .querySelectorAll("rect[data-i]")
      .forEach((d) => (d.style.opacity = +d.dataset.i === l ? "1" : ".45")),
      i &&
        (i.innerHTML = `${esc(o.labels ? o.labels[l] : "")} · <b class="${cls(o.vals[l])}">${esc(o.f(o.vals[l]))}</b>`));
  }
}
(document.addEventListener("pointerdown", pchToque),
  document.addEventListener("pointermove", (e) => {
    (e.buttons || e.pointerType === "touch") && pchToque(e);
  }));
function stDsh(e) {
  const t = [...new Set(e.map(moedaT))],
    a = t.length > 1 || t[0] !== "USD";
  return (
    (DSH_MO = a ? "BRL" : "USD"),
    e
      .map((o) => {
        const s = o.c || calc(o),
          n = String(o.dt || "");
        return {
          d: String(o.dtx || o.dt).slice(0, 10),
          de: n.slice(0, 10),
          h: /T\d\d/.test(n) && !o.lanc ? +n.slice(11, 13) : null,
          v: a ? emBRL(s.pl, moedaT(o)) : s.pl,
          r: s.r != null && isFinite(s.r) ? s.r : null,
          setup:
            String(o.setup || "").trim() || (o.forex ? "Forex" : "Sem setup"),
          at: String(raizAtivo(o.ativo) || o.ativo || "?").toUpperCase(),
          us: !!o.forex || ehUS(o),
          emo: o.emo2 || "",
          ok: o.rules !== "n",
          err: o.err && o.err !== "Nenhum" ? o.err : "",
          fx: o.forex ? 1 : 0,
        };
      })
      .filter((o) => o.v != null && isFinite(o.v))
      .sort((o, s) => o.d.localeCompare(s.d))
  );
}
function stAnterior() {
  const e = loc().slice(0, 10),
    [t, a] = intervalo(PER, e);
  if (!t) return null;
  let o, s;
  if (PER === "mes") {
    const i = new Date(t + "T12:00:00Z");
    (i.setUTCMonth(i.getUTCMonth() - 1),
      (o = i.toISOString().slice(0, 10)),
      (s = diasMais(t, -1)));
  } else if (PER === "ano")
    ((o = +t.slice(0, 4) - 1 + t.slice(4)),
      (s = +a.slice(0, 4) - 1 + a.slice(4)));
  else {
    const i =
      Math.round(
        (new Date(a + "T12:00:00Z") - new Date(t + "T12:00:00Z")) / 864e5,
      ) + 1;
    ((o = diasMais(t, -i)), (s = diasMais(t, -1)));
  }
  const n = PER;
  PER = "all";
  let r;
  try {
    r = stRows();
  } finally {
    PER = n;
  }
  return {
    rows: r
      .map((i) => (i.c ? i : { ...i, c: calc(i) }))
      .filter((i) => i.c && i.c.pl != null)
      .filter((i) => {
        const l = String(i.dtx || i.dt).slice(0, 10);
        return l >= o && l <= s;
      }),
    nome:
      {
        hoje: "ontem",
        sem: "a semana passada",
        7: "os 7 dias anteriores",
        30: "os 30 dias anteriores",
        mes: "o mês passado",
        ano: "o mesmo período do ano passado",
      }[PER] || "o período anterior",
  };
}
{
  const e = vStats;
  vStats = function () {
    let t = e.apply(this, arguments);
    try {
      const a = stRows()
        .map((n) => (n.c ? n : { ...n, c: calc(n) }))
        .filter((n) => n.c && n.c.pl != null);
      if (!a.length) return t;
      const o = stDsh(a),
        s = dshCor();
      if (ST.aba === "geral") {
        const n = t.indexOf("<h2>Evolução do resultado</h2>"),
          r = t.indexOf("<h2>Resultado por dia</h2>");
        n > 0 &&
          r > n &&
          (t =
            t.slice(0, n) +
            `<h2>Curva de capital e quedas</h2><div class="card">${dshEq(o, s)}</div>` +
            t.slice(r));
      }
      if (ST.aba === "risco") {
        const n = t.indexOf("<h2>Disciplina e erros</h2>");
        n > 0 &&
          (t =
            t.slice(0, n) +
            `<h2>Distribuição dos resultados (× risco)</h2><div class="card">${dshHist(o, s)}</div>` +
            t.slice(n));
      }
      if (ST.aba === "onde") {
        const n = t.indexOf("<h2>Mapa de calor: dia × hora</h2>"),
          r = t.indexOf("<h2>Por dia da semana</h2>");
        n >= 0 &&
          r > n &&
          (t =
            t.slice(0, n) +
            `<h2>Mapa de calor: dia × hora</h2><div class="card">${dshHm(o, s)}</div>` +
            t.slice(r));
        const i = (l, d) => {
          const c = t.indexOf(`<h2>${l}</h2>`);
          if (c < 0) return;
          const p = dshRank(o, d);
          p &&
            (t =
              t.slice(0, c) +
              `<h2>${l}</h2><div class="card">${p}</div><details class="sm" style="margin:-4px 0 10px"><summary>Ver a tabela completa</summary>` +
              t
                .slice(c + l.length + 9)
                .replace(/(<\/table>(?:<\/div>)?)/, "$1</details>"));
        };
        if (
          (i("Por setup", "setup"),
          i("Por ativo", "at"),
          TIPO === "all" && o.some((l) => l.us) && o.some((l) => !l.us))
        ) {
          const l = dshMk(o, "0000-00-00", "9999-12-31");
          l && (t += `<h2>Brasil × EUA</h2><div class="card">${l}</div>`);
        }
      }
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (
        (document.body.classList.toggle(
          "dshwide",
          ["stats", "mesa", "rev"].includes(tab),
        ),
        tab !== "stats")
      )
        return;
      const t = document.getElementById("app"),
        a =
          t &&
          [...t.querySelectorAll(".kv")].find(
            (d) =>
              /M\xe9dia por trade/.test(d.textContent) &&
              /Fator de lucro/.test(d.textContent),
          );
      if (!a) return;
      const o = stRows()
        .map((d) => (d.c ? d : { ...d, c: calc(d) }))
        .filter((d) => d.c && d.c.pl != null);
      if (!o.length) return;
      const s = dshKpi(stDsh(o)),
        n = stAnterior(),
        r = DSH_MO,
        i = n && n.rows.length ? dshKpi(stDsh(n.rows)) : null;
      DSH_MO = r;
      const l = document.createElement("div");
      ((l.innerHTML =
        dshTiles(s, i) +
        (i
          ? `<div class="sm mut" style="margin:2px 0 6px">As setas comparam com ${n.nome} (${i.n} trade(s)).</div>`
          : "")),
        a.replaceWith(...l.childNodes));
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    try {
      const a = t.indexOf("<h2>Revisão do período</h2>"),
        o = `<h2>Metas do mês</h2><div class="card">${dshAneis(dshCor())}</div>`;
      return a > 0 ? t.slice(0, a) + o + t.slice(a) : t + o;
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
function mesaGraf(e) {
  const t = mesaCalc(e);
  if (!t.ks.length) return "";
  const a = dshCor(),
    o = +e.perdaTotal || 0;
  let s = 0,
    n = 0;
  const r = [0],
    i = [o ? -o : null],
    l = ["início"];
  t.ks.forEach((se) => {
    s += t.dias[se];
    const Ie = o
      ? e.dd === "fixo"
        ? -o
        : e.trava
          ? Math.min(n - o, 0)
          : n - o
      : null;
    (e.dd !== "trail" && (n = Math.max(n, s)),
      r.push(s),
      i.push(
        e.dd === "trail"
          ? (() => {
              const Pe = Math.max(n, s);
              return ((n = Pe), e.trava ? Math.min(Pe - o, 0) : Pe - o);
            })()
          : Ie,
      ),
      l.push(fmtD(se).slice(0, 5)));
  });
  const d = dshLarg(1),
    c = d < 500 ? 170 : 210,
    p = 50,
    u = 58,
    m = 12,
    f = 22,
    x = r.length,
    v = r.concat(
      i.filter((se) => se != null),
      t.meta > 0 ? [t.meta] : [],
      [0],
    ),
    g = Math.max(...v),
    h = Math.min(...v),
    b = g - h || 1,
    y = (se) => p + (se * (d - p - u)) / Math.max(1, x - 1),
    j = (se) => m + ((g - se) / b) * (c - m - f),
    k = (se) => mFmt(e, se),
    A = r.map((se, Ie) => `${y(Ie).toFixed(1)},${j(se).toFixed(1)}`).join(" "),
    C = s >= 0 ? a.g : a.r,
    I =
      i[0] != null
        ? i
            .map(
              (se, Ie) =>
                `${Ie ? "L" : "M"}${y(Ie).toFixed(1)} ${j(se).toFixed(1)}`,
            )
            .join("")
        : "",
    J = t.margem != null ? t.margem : null;
  return `<h2>Evolução na mesa</h2><div class="card"><svg viewBox="0 0 ${d} ${c}" class="dshsv" role="img" aria-label="Saldo da mesa com meta e perda máxima">
<line x1="${p}" x2="${d - u}" y1="${j(0).toFixed(1)}" y2="${j(0).toFixed(1)}" stroke="${a.mut}" stroke-width=".8"/><text x="${p - 6}" y="${(j(0) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${a.mut}">0</text>
${t.meta > 0 ? `<line x1="${p}" x2="${d - u}" y1="${j(t.meta).toFixed(1)}" y2="${j(t.meta).toFixed(1)}" stroke="${a.g}" stroke-dasharray="6 4" stroke-width="1.4"/><text x="${d - u + 4}" y="${(j(t.meta) + 4).toFixed(1)}" font-size="11" fill="${a.g}" font-weight="700">Meta</text><text x="${p - 6}" y="${(j(t.meta) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${a.g}">${dshK(t.meta)}</text>` : ""}
${I ? `<path d="${I}L${y(x - 1).toFixed(1)} ${(c - f).toFixed(1)}L${y(0).toFixed(1)} ${(c - f).toFixed(1)}Z" fill="${a.r}" fill-opacity=".08"/><path d="${I}" fill="none" stroke="${a.r}" stroke-dasharray="6 4" stroke-width="1.4"/><text x="${d - u + 4}" y="${(j(i[x - 1]) + 4).toFixed(1)}" font-size="11" fill="${a.r}" font-weight="700">Perda</text><text x="${d - u + 4}" y="${(j(i[x - 1]) + 16).toFixed(1)}" font-size="11" fill="${a.r}" font-weight="700">máx.</text><text x="${p - 6}" y="${(j(i[x - 1]) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${a.r}">${dshK(i[x - 1])}</text>` : ""}
<polyline points="${A}" fill="none" stroke="${C}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${r.map((se, Ie) => (Ie ? `<circle cx="${y(Ie).toFixed(1)}" cy="${j(se).toFixed(1)}" r="${x > 30 ? 1.6 : 3}" fill="${C}"/>` : "")).join("")}
<circle cx="${y(x - 1).toFixed(1)}" cy="${j(s).toFixed(1)}" r="5" fill="${C}" stroke="${a.card}" stroke-width="2"/><text x="${d - u + 4}" y="${(j(s) + 4).toFixed(1)}" font-size="11" fill="${C}" font-weight="700">${dshK(s)}</text>
<text x="${p}" y="${c - 5}" font-size="11" fill="${a.mut}">${l[1]}</text><text x="${d - u}" y="${c - 5}" font-size="11" text-anchor="end" fill="${a.mut}">${l[x - 1]}</text></svg>
<div class="sm" style="margin-top:6px">Saldo <b class="${cls(s)}">${k(s)}</b>${t.meta > 0 ? ` · falta <b>${k(Math.max(0, t.meta - t.lucroEf))}</b> para a meta` : ""}${J != null ? ` · folga até a perda máxima <b class="${J < o * 0.3 ? "r" : ""}">${k(J)}</b>` : ""}</div>
<div class="sm mut">Linha vermelha: onde a conta é reprovada${e.dd === "fixo" ? " (fixa)" : " (sobe junto com o seu melhor saldo)"}. Linha verde: a meta.</div></div>`;
}
{
  const e = vMesa;
  vMesa = function () {
    let t = e.apply(this, arguments);
    try {
      const a = mesaCfg();
      if (!a || MM.nova) return t;
      const o = mesaGraf(a),
        s = '<div class="kv" style="margin-top:10px">',
        n = t.indexOf(s);
      o && n > 0 && (t = t.slice(0, n) + o + t.slice(n));
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-043");
  ((e.textContent = TraderStyles.css("legacy-043")), TraderStyles.mount(e));
}
const hjD = () => loc().slice(0, 10),
  dia$ = (e) => {
    var t;
    return (t = S.days)[e] ?? (t[e] = { chk: {} });
  },
  TELA = { t: document.hidden ? 0 : Date.now() };
function telaConta() {
  var e;
  if (!TELA.t) return;
  const t = Date.now(),
    a = (t - TELA.t) / 6e4;
  if (((TELA.t = t), a > 0 && a < 120)) {
    const o = hjD(),
      s = (e = S.ax ?? (S.ax = {})).tela ?? (e.tela = {});
    s[o] = +((s[o] || 0) + a).toFixed(1);
    const n = Object.keys(s).sort();
    n.length > 400 && delete s[n[0]];
  }
}
(document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    (telaConta(), (TELA.t = 0));
    try {
      save();
    } catch {}
  } else TELA.t = Date.now();
}),
  setInterval(() => {
    document.hidden || telaConta();
  }, 6e4),
  setInterval(() => {
    try {
      document.hidden || save();
    } catch {}
  }, 5 * 6e4));
function evCalc(e) {
  const t = new Date(e + "T12:00:00Z"),
    a = t.getUTCDay(),
    o = t.getUTCDate(),
    s = t.getUTCMonth() + 1,
    n = [];
  if (
    (a === 5 && o <= 7 && n.push("Payroll (EUA)"),
    a === 5 && o >= 15 && o <= 21 && n.push("Vencimento de opções (B3)"),
    s % 2 === 0 && a === 3)
  ) {
    const r = new Date(Date.UTC(t.getUTCFullYear(), s - 1, 15));
    let i = null;
    for (let l = -7; l <= 7; l++)
      new Date(r.getTime() + l * 864e5).getUTCDay() === 3 &&
        (i == null || Math.abs(l) < Math.abs(i)) &&
        (i = l);
    i != null &&
      new Date(r.getTime() + i * 864e5).getUTCDate() === o &&
      n.push("Vencimento do WIN");
  }
  return n;
}
const EV_NOME = [
  [/copom|selic|taxa de juros.*brasil/i, "Copom"],
  [/fomc|fed interest rate|federal funds|decis\xe3o.*fed/i, "Fed (FOMC)"],
  [/cpi|consumer price/i, "CPI (inflação EUA)"],
  [/ipca/i, "IPCA"],
  [/non.?farm|payroll/i, "Payroll (EUA)"],
  [/pib|gdp/i, "PIB"],
  [/powell/i, "Fala do Powell"],
  [/pce/i, "PCE (inflação EUA)"],
];
function evGrava() {
  var e;
  try {
    const t = AG.v && AG.v[AG.sem];
    if (!t || !Array.isArray(t.eventos)) return;
    const a = (e = S.ax ?? (S.ax = {})).evd ?? (e.evd = {});
    let o = 0;
    (t.eventos
      .filter((s) => s.imp === 1)
      .forEach((s) => {
        const n = agDia(s.em),
          r = (EV_NOME.find(([l]) => l.test(s.t)) || [])[1];
        if (!r) return;
        const i = a[n] ?? (a[n] = []);
        i.includes(r) || (i.push(r), (o = 1));
      }),
      o && save());
  } catch {}
}
const evDia = (e) => [
  ...new Set([...(((S.ax || {}).evd || {})[e] || []), ...evCalc(e)]),
];
function evStats() {
  const e = eqDias(),
    t = {};
  Object.entries(e).forEach(([s, n]) => {
    evDia(s).forEach((r) => {
      const i = t[r] ?? (t[r] = { n: 0, v: 0, neg: 0 });
      (i.n++, (i.v += n), n < 0 && i.neg++);
    });
  });
  const a = Object.keys(e),
    o = a.length ? sum(a.map((s) => e[s])) / a.length : 0;
  return { R: t, med: o };
}
const EV_TEMA = {
    Copom: "Política monetária, Selic e juros (Macroeconomia)",
    "Fed (FOMC)":
      "Juros americanos e fluxo de capitais (Economia internacional)",
    "CPI (inflação EUA)": "Inflação: como é medida e por que mexe nos juros",
    IPCA: "Inflação no Brasil: IPCA, metas e expectativas",
    "Payroll (EUA)": "Mercado de trabalho e ciclo econômico",
    PIB: "Contas nacionais: o que entra no PIB",
    "Fala do Powell": "Comunicação do banco central e expectativas",
    "PCE (inflação EUA)": "Inflação: núcleo e medidas alternativas",
    "Vencimento do WIN": "Mercado futuro: ajuste diário e vencimento",
    "Vencimento de opções (B3)": "Opções: exercício e efeito no ativo-objeto",
  },
  SONO = [
    ["b", "😴 Dormi bem"],
    ["m", "😐 Mais ou menos"],
    ["r", "🥱 Dormi mal"],
  ],
  CTX = [
    ["tend", "📈 Tendência"],
    ["lat", "↔️ Lateral"],
    ["not", "📰 Notícia forte"],
    ["vol", "🌪️ Volátil"],
  ];
var chipsDia;
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-dch]");
  if (!t) return;
  const a = dia$(t.dataset.d),
    o = t.dataset.dch;
  ((a[o] = a[o] === t.dataset.v ? "" : t.dataset.v),
    (a.u = Date.now()),
    save(),
    t.parentElement
      .querySelectorAll("button")
      .forEach((s) =>
        s.classList.toggle("on", s === t && a[o] === t.dataset.v),
      ));
});
function euIdeal() {
  const e = eqDias(),
    t = Object.keys(e)
      .filter((i) => e[i] > 0)
      .sort((i, l) => e[l] - e[i])
      .slice(0, 20);
  if (t.length < 5) return null;
  const a = (i) => S.trades.filter((l) => String(l.dt).slice(0, 10) === i),
    o = t.map((i) => a(i).length),
    s = t
      .map((i) => {
        const l = a(i)
          .map((d) => +String(d.dt).slice(11, 13))
          .filter((d) => d > 0);
        return l.length ? Math.min(...l) : null;
      })
      .filter((i) => i != null)
      .sort((i, l) => i - l),
    n = (i) => Math.round((t.filter(i).length / t.length) * 100),
    r = t.filter((i) => (S.days[i] || {}).sono);
  return {
    n: t.length,
    trades: Math.round((sum(o) / t.length) * 10) / 10,
    maxT: Math.max(...o),
    hora: s.length ? s[Math.floor(s.length / 2)] : null,
    plano: n((i) => String((S.days[i] || {}).plano || "").trim()),
    sono:
      r.length >= 3
        ? Math.round(
            (r.filter((i) => S.days[i].sono === "b").length / r.length) * 100,
          )
        : null,
  };
}
function euIdealHtml() {
  const e = euIdeal();
  if (!e) return "";
  const t = hjD(),
    a = S.days[t] || {},
    o = S.trades.filter((i) => String(i.dt).slice(0, 10) === t),
    s = (i, l) => `<span class="${i ? "g" : "r"}">${i ? "✓" : "✗"} ${l}</span>`,
    n = o.length
      ? Math.min(...o.map((i) => +String(i.dt).slice(11, 13)))
      : null,
    r = [
      e.plano >= 60 ? s(!!String(a.plano || "").trim(), "plano escrito") : "",
      e.sono != null && e.sono >= 60
        ? a.sono
          ? s(a.sono === "b", "dormiu bem")
          : '<span class="mut">marque como dormiu</span>'
        : "",
      s(
        o.length <= Math.ceil(e.trades),
        `${o.length} trade(s) até agora (bons dias: ~${String(e.trades).replace(".", ",")})`,
      ),
      e.hora != null && n != null
        ? s(
            n >= e.hora - 1 && n <= e.hora + 1,
            `primeira entrada às ${n}h (bons dias: ${e.hora}h)`,
          )
        : "",
    ].filter(Boolean);
  return `<div style="margin:8px 0 2px;padding-top:8px;border-top:1px solid var(--bd)"><span class="sm mut">Seu "eu ideal" (seus ${e.n} melhores dias)</span><div class="sm" style="margin-top:3px">${r.join(" · ")}</div></div>`;
}
function pausaSeq() {
  const e = eqDias(),
    t = Object.keys(e).sort();
  let a = 0;
  for (let o = t.length - 1; o >= 0 && e[t[o]] < 0; o--) a++;
  return { n: a, ult: t[t.length - 1] || "" };
}
{
  const e = pCore;
  pCore = function (t, a) {
    const o = e.apply(this, arguments);
    try {
      (S.ax || {}).pausaDia === hjD() &&
        o.mot.push("pausa programada (dia de estudo)");
    } catch {}
    return o;
  };
}
function pausaHtml() {
  const e = pausaSeq(),
    t = +(S.ax || {}).pausaN || 3,
    a = S.ax || {};
  return a.pausaDia === hjD()
    ? '<div class="card" id="pzb" style="border-color:var(--am)"><b>📚 Hoje é dia de pausa</b><div class="sm" style="margin:4px 0 8px">Sem operar: revise trades antigos, refaça o playbook e treine nos flashcards.</div><div class="g2"><button class="btn s" data-a="gotab" data-id="estudos">Flashcards dos trades</button><button class="btn s" data-pz="fim">Encerrar a pausa</button></div></div>'
    : e.n < t || a.pausaVisto === e.ult
      ? ""
      : `<div class="card" id="pzb" style="border-color:var(--r)"><b>🧯 ${e.n} dias negativos seguidos</b><div class="sm" style="margin:4px 0 8px">É aqui que muita conta quebra: a vontade de recuperar aumenta a mão e diminui o critério. Sugestão: 1 dia de pausa em modo estudo.</div><div class="g2"><button class="btn" data-pz="am">Pausar amanhã</button><button class="btn s" data-pz="hj">Pausar hoje</button></div><button class="btn s" data-pz="nao" style="width:100%;margin-top:6px">Agora não</button></div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pz]");
  if (!t) return;
  const a = t.dataset.pz,
    o = S.ax ?? (S.ax = {});
  (a === "am" && (o.pausaDia = diasMais(hjD(), 1)),
    a === "hj" && (o.pausaDia = hjD()),
    a === "fim" && delete o.pausaDia,
    (o.pausaVisto = pausaSeq().ult),
    save(),
    render(),
    (a === "am" || a === "hj") &&
      toast(
        a === "hj"
          ? "Pausa hoje: a trava fica ligada até amanhã."
          : "Pausa amanhã: a trava liga o dia todo.",
        4e3,
      ));
});
const NQ = [
    ["setup", "Está no meu setup?"],
    ["stop", "Stop definido antes?"],
    ["hora", "Horário bom para mim?"],
    ["plano", "Estava no plano do dia?"],
  ],
  notaABC = (e) => {
    const t = e && e.nq;
    if (!t) return "";
    const a = NQ.filter(([o]) => t[o]).length;
    return a >= 4 ? "A" : a === 3 ? "B" : "C";
  },
  nqHtml = (e, t) =>
    `<div class="sm mut" style="margin:8px 0 4px">Nota do trade (antes de entrar) ${e ? "· <b>" + notaABC({ nq: e }) + "</b>" : ""}</div><div class="chips2">${NQ.map(([a, o]) => `<button class="${e && e[a] ? "on" : ""}" ${t}="${a}">${o}</button>`).join("")}</div>`;
{
  const e = sheet;
  sheet = function () {
    let t = e.apply(this, arguments);
    try {
      T &&
        (t = t.replace(
          "<h3>Disciplina</h3>",
          "<h3>Disciplina</h3>" + nqHtml(T.nq, "data-nqs"),
        ));
    } catch {}
    return t;
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-nqs]");
  if (t && T) {
    const o = (T.nq = T.nq || {});
    ((o[t.dataset.nqs] = o[t.dataset.nqs] ? 0 : 1), showSheet());
    return;
  }
  const a = e.target.closest("[data-nqq]");
  if (a && QK) {
    const o = (QK.nq = QK.nq || {});
    ((o[a.dataset.nqq] = o[a.dataset.nqq] ? 0 : 1), qkDesenha());
  }
});
{
  const e = qkDesenha;
  qkDesenha = function () {
    e.apply(this, arguments);
    try {
      const t = document.querySelector("#qk .qk-pn");
      if (!t || t.querySelector("#qknq")) return;
      const a = document.createElement("div");
      ((a.id = "qknq"), (a.innerHTML = nqHtml(QK.nq, "data-nqq")));
      const o = t.querySelector('[data-qk="exit"]');
      ((o && o.closest("label")) || t.lastElementChild).after(a);
    } catch {}
  };
}
{
  const e = qkSalva;
  qkSalva = function () {
    const t = QK && QK.nq,
      a = S.trades.length,
      o = e.apply(this, arguments);
    try {
      t &&
        S.trades.length > a &&
        ((S.trades[S.trades.length - 1].nq = { ...t }), save());
    } catch {}
    return o;
  };
}
{
  const e = fxHtml;
  fxHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = FX && S.trades.find((s) => s.id === FX.id),
        o = notaABC(a);
      (o &&
        (t = t.replace(
          '<h2>Disciplina</h2><div class="card">',
          `<h2>Disciplina</h2><div class="card"><div class="sm" style="margin-bottom:6px">Nota antes de entrar: <b class="${o === "A" ? "g" : o === "C" ? "r" : "am"}" style="font-size:16px">${o}</b> <span class="mut">(${
            NQ.filter(([s]) => a.nq[s])
              .map(([, s]) => s.replace("?", ""))
              .join(", ") || "nenhum critério"
          })</span></div>`,
        )),
        a &&
          a.tilt &&
          (t = t.replace(
            '<h2>Disciplina</h2><div class="card">',
            '<h2>Disciplina</h2><div class="card"><div class="warn" style="margin-bottom:8px">🧯 Possível tilt: ' +
              esc(a.tilt) +
              "</div>",
          )));
    } catch {}
    return t;
  };
}
function tiltMarca() {
  let e = 0,
    t = "";
  const a = S.trades
    .filter((o) => o.dt && (o.tipo || "D") !== "O")
    .sort((o, s) => String(o.dt).localeCompare(String(s.dt)));
  for (let o = 1; o < a.length; o++) {
    const s = a[o];
    if (s.tiltOk) continue;
    const n = String(s.dt).slice(0, 10),
      r = a
        .slice(0, o)
        .filter(
          (u) =>
            u.dtx &&
            String(u.dtx).slice(0, 10) === n &&
            String(u.dtx) <= String(s.dt) &&
            calc(u).pl < 0,
        )
        .pop();
    if (((s.tiltOk = 1), !r)) continue;
    const i =
        (Date.parse(String(s.dt).slice(0, 16)) -
          Date.parse(String(r.dtx).slice(0, 16))) /
        6e4,
      l = numN(r.qty) || 0,
      d = numN(s.qty) || 0,
      c = raizAtivo(s.ativo) === raizAtivo(r.ativo),
      p = [];
    (i >= 0 &&
      i <= 2 &&
      p.push(`entrou ${Math.round(i)} min depois de um stop`),
      c && d > l && l > 0 && p.push(`mão maior depois de perder (${l} → ${d})`),
      p.length && ((s.tilt = p.join(" e ")), e++, n === hjD() && (t = s.tilt)));
  }
  e &&
    (save(),
    t && toast("🧯 Possível tilt: " + t + ". Respire e releia o plano.", 6e3));
}
{
  const e = render0;
  render0 = function () {
    try {
      tiltMarca();
    } catch {}
    e.apply(this, arguments);
  };
}
const PG = { t: 0 };
function pgDados() {
  let e = null;
  try {
    e = travaEstado();
  } catch {}
  const t = e && e.c,
    a = hjD(),
    o = S.trades.filter(
      (l) => l.dtx && String(l.dtx).slice(0, 10) === a && calc(l).pl != null,
    ),
    s = sum(o.map((l) => emBRL(calc(l).pl, moedaT(l)))),
    n = t ? Math.max(0, t.lim - t.perda) : null,
    r = t ? Math.max(0, t.nd - (t.ntr || 0)) : null,
    i = (() => {
      try {
        return mmAtivas().map((l) => ({ nome: l.nome, M: mesaCalc(l), c: l }));
      } catch {
        return [];
      }
    })();
  return { E: e, c: t, P: s, resta: n, trs: r, ms: i, n: o.length };
}
function pgHtml() {
  const e = pgDados(),
    t = e.E,
    a = new Date(),
    o = t && t.pausaAte ? t.pausaAte - Date.now() : 0;
  return `<div class="pg-top"><span>${a.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span><b>Modo pregão</b><button class="x" data-pg="x" aria-label="Sair">✕</button></div>
${t && (t.duro.length || (t.c && t.c.mot.length)) ? `<div class="pg-st r">PARE POR HOJE<small>${esc((t.duro.length ? t.duro : t.c.mot).join(" · "))}</small></div>` : o > 0 ? `<div class="pg-st am">ESFRIANDO<b data-pgcd="${t.pausaAte}">${trMin(o)}</b><small>Depois de um stop, a próxima entrada costuma ser revanche. Levante e respire.</small></div>` : `<div class="pg-st g">PODE OPERAR<small>${e.n ? e.n + " trade(s) encerrado(s) hoje" : "nenhum trade ainda"}</small></div>`}
<div class="pg-g"><div><span>Hoje</span><b class="${cls(e.P)}">${money(e.P)}</b></div><div><span>Ainda pode perder</span><b>${e.resta == null ? "–" : money(e.resta)}</b></div><div><span>Trades restantes</span><b>${e.trs == null ? "–" : e.trs}</b></div></div>
${e.ms.length ? `<div class="pg-ms">${e.ms.map((s) => `<div><span>${esc(s.nome)}</span><b class="${s.M.pode && s.M.pode[1] <= 0 ? "r" : ""}">${s.M.pode ? (s.M.pode[1] <= 0 ? "pare" : mFmt(s.c, s.M.pode[1])) : "–"}</b></div>`).join("")}</div>` : ""}
<div class="pg-b"><button class="btn" data-pg="qk">＋ Registrar trade</button><button class="btn s" data-pg="resp">Respirar 1 minuto</button></div><div id="pgresp"></div>`;
}
function pgAbre() {
  let e = document.getElementById("pgov");
  (e ||
    ((e = document.createElement("div")),
    (e.id = "pgov"),
    document.body.appendChild(e)),
    (e.innerHTML = pgHtml()),
    (document.body.style.overflow = "hidden"),
    clearInterval(PG.t),
    (PG.t = setInterval(() => {
      const t = document.getElementById("pgov");
      if (!t) {
        clearInterval(PG.t);
        return;
      }
      document.getElementById("pgresp").dataset.on || (t.innerHTML = pgHtml());
    }, 5e3)));
  try {
    navigator.wakeLock &&
      navigator.wakeLock
        .request("screen")
        .then((t) => (PG.wl = t))
        .catch(() => {});
  } catch {}
}
function pgFecha() {
  const e = document.getElementById("pgov");
  (e && e.remove(), clearInterval(PG.t), (document.body.style.overflow = ""));
  try {
    PG.wl && PG.wl.release();
  } catch {}
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pg]");
  if (!t) return;
  const a = t.dataset.pg;
  if (a === "x") pgFecha();
  else if (a === "abre") pgAbre();
  else if (a === "qk") (pgFecha(), qkAbre());
  else if (a === "resp") {
    const o = document.getElementById("pgresp");
    o.dataset.on = 1;
    let s = 0;
    const n = ["Inspire… 4", "Segure… 4", "Solte… 4", "Segure… 4"];
    o.innerHTML =
      '<div class="pg-resp"><div class="pg-bola"></div><b id="pgrt">Inspire… 4</b></div>';
    const r = setInterval(() => {
      s++;
      const i = document.getElementById("pgrt");
      if (!i || s >= 60) {
        (clearInterval(r), (o.innerHTML = ""), delete o.dataset.on);
        return;
      }
      i.textContent = n[Math.floor(s / 4) % 4].replace(
        "4",
        String(4 - (s % 4)),
      );
    }, 1e3);
  }
}),
  setInterval(() => {
    document.querySelectorAll("[data-pgcd]").forEach((e) => {
      const t = +e.dataset.pgcd - Date.now();
      e.textContent = t > 0 ? trMin(t) : "pronto";
    });
  }, 1e3),
  (GOR.pregao = () => {
    ((GO.r = null), irPara("home"), setTimeout(pgAbre, 200));
  }),
  (GOR.qk = () => {
    ((GO.r = null),
      (tab = "home"),
      render(),
      setTimeout(() => {
        try {
          qkAbre();
        } catch {}
      }, 250));
  }),
  (GOR.perder = GOR.pregao));
{
  const e = apHtml;
  apHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = hjD(),
        o = evDia(a),
        s = evStats(),
        n = o.map((d) => {
          const c = s.R[d];
          return c && c.n >= 3
            ? `<b>${esc(d)}</b>: nos seus dias de ${esc(d)} a média foi <b class="${cls(c.v / c.n)}">${money(c.v / c.n)}</b> (${c.n} dias${c.v / c.n < s.med ? ", pior que a sua média: opere menor ou fique de fora" : ""})`
            : `<b>${esc(d)}</b>`;
        }),
        r = o.map((d) => EV_TEMA[d]).filter(Boolean)[0],
        i = `${o.length ? `<div style="margin:6px 0"><span class="sm mut">📅 Eventos de hoje</span><div class="sm">${n.join("<br>")}</div>${r ? `<div class="sm" style="margin-top:4px">📚 Ligado à faculdade: <b>${esc(r)}</b> <button class="btn s" data-a="gotab" data-id="estudos" style="padding:3px 8px">Estudar</button></div>` : ""}</div>` : ""}
<div style="margin:6px 0"><span class="sm mut">Como você dormiu?</span>${chipsDia("sono", SONO, a)}</div>${euIdealHtml()}<button class="btn" data-pg="abre" style="width:100%;margin-top:8px">▶ Modo pregão</button>`,
        l = t.lastIndexOf("</div>");
      l > 0 && (t = t.slice(0, l) + i + t.slice(l));
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if ((evGrava(), tab !== "home")) return;
      const t = document.getElementById("app");
      if (!t) return;
      if (!t.querySelector("#pzb")) {
        const n = pausaHtml();
        if (n) {
          const r = document.createElement("div");
          r.innerHTML = n;
          const i = t.querySelector("#apc");
          i ? i.before(r.firstElementChild) : t.prepend(r.firstElementChild);
        }
      }
      const a = diasMais(hjD(), 1),
        o = evStats(),
        s = evDia(a).filter(
          (n) => o.R[n] && o.R[n].n >= 3 && o.R[n].v / o.R[n].n < 0,
        );
      if (s.length && !t.querySelector("#evv")) {
        const n = o.R[s[0]],
          r = document.createElement("div");
        r.innerHTML = `<div class="card sm" id="evv" style="border-color:var(--am)">⚠️ Amanhã tem <b>${esc(s.join(", "))}</b>. Nos seus dias de ${esc(s[0])} a média foi <b class="r">${money(n.v / n.n)}</b> (${n.neg} de ${n.n} dias negativos). Planeje operar menor ou ficar de fora.</div>`;
        const i = t.querySelector("#apc");
        i && i.after(r.firstElementChild);
      }
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || DV !== "ed") return;
      const t = document.getElementById("app"),
        a = t && t.querySelector('.dfase[data-fase="pos"]'),
        o = t && t.querySelector('.dfase[data-fase="pre"]');
      if (a && !a.querySelector("#ctxc")) {
        const s = document.createElement("div");
        ((s.innerHTML = `<div class="card" id="ctxc"><b class="sm">Como foi o mercado hoje?</b>${chipsDia("ctx", CTX, D)}<div class="sm mut">Com o tempo, as Estatísticas mostram em que tipo de dia você ganha e em qual devolve.</div></div>`),
          a.prepend(s.firstElementChild));
      }
      if (o && !o.querySelector("#sonoc")) {
        const s = document.createElement("div");
        ((s.innerHTML = `<div class="card" id="sonoc"><b class="sm">Como você dormiu?</b>${chipsDia("sono", SONO, D)}</div>`),
          o.prepend(s.firstElementChild));
      }
    } catch (t) {
      console.error(t);
    }
  };
}
function siriHtml() {
  const e = location.origin + location.pathname;
  return `<h2>Atalhos da Siri</h2><div class="card"><div class="sm" style="margin-bottom:8px">No app <b>Atalhos</b> do iPhone: novo atalho → <b>Abrir URL</b> → cole o link → dê o nome que vai falar para a Siri.</div>${[
    ["Modo pregão", "pregao", "“E aí Siri, modo pregão”"],
    ["Registrar trade", "qk", "“Siri, registrar trade”"],
    ["Quanto posso perder hoje", "perder", "“Siri, quanto posso perder hoje?”"],
  ]
    .map(
      ([t, a, o]) =>
        `<div style="margin:8px 0"><b class="sm">${t}</b> <span class="sm mut">${o}</span><div style="display:flex;gap:6px;margin-top:4px"><input readonly value="${esc(e + "?go=home&r=" + a)}" style="margin:0;font-size:12px"><button class="btn s" data-siri="${esc(e + "?go=home&r=" + a)}">Copiar</button></div></div>`,
    )
    .join("")}</div>`;
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-siri]");
  if (t)
    try {
      (await navigator.clipboard.writeText(t.dataset.siri),
        toast("Link copiado."));
    } catch {
      toast("Segure no campo e copie.");
    }
});
{
  const e = vMais;
  vMais = function () {
    return e.apply(this, arguments) + siriHtml();
  };
}
{
  const e = TraderStyles.slot("legacy-044");
  ((e.textContent = TraderStyles.css("legacy-044")), TraderStyles.mount(e));
}
ST_ABAS.splice(3, 0, ["sim", "Simulações"], ["fat", "Fatores"]);
function simRows() {
  const e = stRows()
      .map((o) => (o.c ? o : { ...o, c: calc(o) }))
      .filter((o) => o.c && o.c.pl != null),
    t = stDsh(e),
    a = DSH_MO;
  return e
    .map((o) => {
      const s = o.c,
        n = a !== "USD",
        r = (i) => (i == null ? null : n ? emBRL(i, moedaT(o)) : i);
      return {
        t: o,
        dt: String(o.dt || o.dtx || ""),
        d: String(o.dt || o.dtx).slice(0, 10),
        h: /T\d\d/.test(String(o.dt)) ? +String(o.dt).slice(11, 13) : null,
        v: r(s.pl),
        r: s.r != null && isFinite(s.r) ? s.r : null,
        risk: r(s.risk),
        setup: String(o.setup || "").trim() || "Sem setup",
        ok: o.rules !== "n",
        tilt: !!o.tilt,
      };
    })
    .filter((o) => isFinite(o.v))
    .sort((o, s) => o.dt.localeCompare(s.dt));
}
function simRes(e) {
  let t = 0,
    a = 0,
    o = 0;
  const s = [0];
  e.forEach((r) => {
    ((t += r.v), (a = Math.max(a, t)), (o = Math.max(o, a - t)), s.push(t));
  });
  const n = {};
  return (
    e.forEach((r) => (n[r.d] = (n[r.d] || 0) + r.v)),
    {
      tot: t,
      dd: o,
      n: e.length,
      dneg: Object.values(n).filter((r) => r < 0).length,
      dias: Object.keys(n).length,
      curva: s,
    }
  );
}
function simLinhas(e, t) {
  const a = dshLarg(1),
    o = a < 500 ? 170 : 210,
    s = 46,
    n = 10,
    r = 10,
    i = 8,
    l = e.flatMap((f) => f.curva),
    d = Math.max(0, ...l),
    c = Math.min(0, ...l),
    p = d - c || 1,
    u = (f) => r + ((d - f) / p) * (o - r - i),
    m = (f) => {
      const x = f.curva.length,
        v = (g) => s + (g * (a - s - n)) / Math.max(1, x - 1);
      return `<polyline points="${f.curva.map((g, h) => `${v(h).toFixed(1)},${u(g).toFixed(1)}`).join(" ")}" fill="none" stroke="${f.cor}" stroke-width="${f.base ? 2.6 : 1.8}" ${f.base ? "" : 'stroke-dasharray="1 0"'} stroke-linejoin="round" opacity="${f.base ? 1 : 0.9}"/>`;
    };
  return `<svg viewBox="0 0 ${a} ${o}" class="dshsv" role="img"><line x1="${s}" x2="${a - n}" y1="${u(0).toFixed(1)}" y2="${u(0).toFixed(1)}" stroke="${t.mut}" stroke-width=".8"/>${[d, c].map((f) => `<text x="${s - 6}" y="${(u(f) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${t.mut}">${dshK(f)}</text>`).join("")}${e.map(m).join("")}</svg>
<div class="sm" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px">${e.map((f) => `<span><span class="dshdot" style="background:${f.cor}"></span>${esc(f.nome)}</span>`).join("")}</div>`;
}
function simESe(e, t) {
  const a = simRes(e),
    o = [],
    s = e.map((f) =>
      f.r != null && f.r < -1 && f.risk > 0 ? { ...f, v: -f.risk } : f,
    );
  o.push(["Respeitando todos os stops (perda máxima de 1× o risco)", s]);
  const n = {};
  e.forEach((f) => {
    var x;
    if (f.h == null) return;
    const v = n[(x = f.h)] ?? (n[x] = { v: 0, n: 0 });
    ((v.v += f.v), v.n++);
  });
  const r = Object.entries(n)
    .filter(([, f]) => f.n >= 3)
    .sort((f, x) => f[1].v - x[1].v)[0];
  r &&
    r[1].v < 0 &&
    o.push([
      `Sem operar no pior horário (${r[0]}h)`,
      e.filter((f) => f.h !== +r[0]),
    ]);
  const i = {};
  e.forEach((f) => {
    var x;
    const v = i[(x = f.setup)] ?? (i[x] = { v: 0, n: 0 });
    ((v.v += f.v), v.n++);
  });
  const l = Object.entries(i)
    .filter(([, f]) => f.n >= 5)
    .sort((f, x) => x[1].v - f[1].v);
  (l.length > 1 &&
    o.push([
      `Só os 2 melhores setups (${l
        .slice(0, 2)
        .map((f) => f[0])
        .join(" e ")})`,
      e.filter((f) => l.slice(0, 2).some((x) => x[0] === f.setup)),
    ]),
    e.some((f) => !f.ok) &&
      o.push(["Sem quebrar as regras", e.filter((f) => f.ok)]),
    e.some((f) => f.tilt) &&
      o.push(["Sem os trades em tilt", e.filter((f) => !f.tilt)]));
  const d = [],
    c = {};
  (e.forEach((f) => {
    const x = f.d;
    ((c[x] = c[x] || 0), !(c[x] >= 2) && (d.push(f), f.v < 0 && c[x]++));
  }),
    o.push(["Parando depois de 2 stops no dia", d]));
  const p = o.map(([f, x]) => ({ nome: f, ...simRes(x) })),
    u = [t.ac, "#b2aca0", t.am, "#a49d90", "#ac8439", "#c69a49"],
    m = [...p].sort((f, x) => x.tot - f.tot).slice(0, 3);
  return `${simLinhas([{ nome: "Real", curva: a.curva, cor: t.g, base: 1 }, ...m.map((f, x) => ({ nome: f.nome, curva: f.curva, cor: u[x] }))], t)}
${dshTab(["E se…", "Resultado", "Diferença", "Maior queda"], [`<tr><td><b>O que aconteceu</b></td><td class="${cls(a.tot)}">${dshM(a.tot)}</td><td>–</td><td class="r">${dshM(-a.dd)}</td></tr>`, ...p.map((f) => `<tr><td>${esc(f.nome)}</td><td class="${cls(f.tot)}">${dshM(f.tot)}</td><td class="${cls(f.tot - a.tot)}"><b>${f.tot - a.tot >= 0 ? "+" : ""}${dshM(f.tot - a.tot)}</b></td><td class="r">${dshM(-f.dd)}</td></tr>`)])}
<div class="sm" style="margin-top:6px">${p.filter((f) => f.tot > a.tot).length ? `O hábito que mais custou: <b>${esc([...p].sort((f, x) => x.tot - f.tot)[0].nome.toLowerCase())}</b> teria rendido <b class="g">${dshM([...p].sort((f, x) => x.tot - f.tot)[0].tot - a.tot)}</b> a mais.` : "Nenhum desses ajustes melhoraria o resultado: seu processo está consistente."}</div><div class="sm mut">Recalcula com os seus trades reais do período e filtro escolhidos.</div>`;
}
function simGestao(e) {
  const t = simRes(e),
    a = e.filter((p) => p.v > 0),
    o = e.filter((p) => p.v < 0),
    s = a.length ? sum(a.map((p) => p.v)) / a.length : 0,
    n = o.length ? -sum(o.map((p) => p.v)) / o.length : 0,
    r = (p) => {
      const u = [],
        m = {};
      return (
        e.forEach((f) => {
          var x;
          const v =
            m[(x = f.d)] ??
            (m[x] = { cum: 0, n: 0, perdas: 0, seq: 0, parou: 0, perdeu: 0 });
          if (v.parou) return;
          const g = p(f, v);
          g !== null &&
            (u.push(g),
            (v.cum += g.v),
            v.n++,
            g.v < 0
              ? (v.perdas++, v.seq++, (v.perdeu = 1))
              : g.v > 0 && (v.seq = 0),
            g.parar && (v.parou = 1));
        }),
        u
      );
    },
    i = [];
  ([1, 2, 3].forEach((p) =>
    i.push([
      `Parar depois de ${p} stop(s) no dia`,
      r((u, m) => (m.perdas >= p ? null : u)),
    ]),
  ),
    [1, 2, 3].forEach(
      (p) =>
        n &&
        i.push([
          `Limite de perda no dia: ${p}× a perda média (${dshM(p * n)})`,
          r((u, m) => (m.cum <= -p * n ? null : u)),
        ]),
    ),
    [1, 2, 3].forEach(
      (p) =>
        s &&
        i.push([
          `Meta do dia: ${p}× o ganho médio (${dshM(p * s)})`,
          r((u, m) => (m.cum >= p * s ? null : u)),
        ]),
    ),
    [1, 2, 3, 5].forEach((p) =>
      i.push([
        `No máximo ${p} trade(s) por dia`,
        r((u, m) => (m.n >= p ? null : u)),
      ]),
    ),
    i.push([
      "Metade da mão depois de uma perda no dia",
      r((p, u) => (u.perdeu ? { ...p, v: p.v / 2 } : p)),
    ]));
  const l = i.map(([p, u]) => ({ nome: p, ...simRes(u) })),
    d = (p) => p.tot / (p.dd || 1),
    c = [...l].sort((p, u) => d(u) - d(p))[0];
  return `${dshTab(["Regra", "Resultado", "Maior queda", "Dias negativos"], [`<tr><td><b>Sem regra (real)</b></td><td class="${cls(t.tot)}">${dshM(t.tot)}</td><td class="r">${dshM(-t.dd)}</td><td>${t.dneg} de ${t.dias}</td></tr>`, ...l.map((p) => `<tr${p === c ? ' style="background:color-mix(in srgb,var(--g) 10%,transparent)"' : ""}><td>${esc(p.nome)}${p === c ? ' <b class="g">★</b>' : ""}</td><td class="${cls(p.tot)}">${dshM(p.tot)}</td><td class="r">${dshM(-p.dd)}</td><td>${p.dneg} de ${p.dias}</td></tr>`)])}
<div class="sm" style="margin-top:6px">★ Melhor equilíbrio entre resultado e queda: <b>${esc(c.nome)}</b> (${dshM(c.tot)} com queda máxima de ${dshM(c.dd)}).</div><div class="sm mut">Testado nos seus trades reais, na ordem em que aconteceram. Regra boa no passado não garante o futuro, mas regra ruim no passado quase sempre continua ruim.</div>`;
}
function simRuina(e) {
  const t = e.filter((c) => c.r != null).map((c) => c.r);
  if (t.length < 20)
    return `<div class="sm mut">Precisa de pelo menos 20 trades com stop anotado (tem ${t.length}).</div>`;
  const a = t.filter((c) => c > 0),
    o = t.filter((c) => c < 0),
    s = a.length / t.length,
    n = a.length && o.length ? sum(a) / a.length / (-sum(o) / o.length) : 0,
    r = n ? s - (1 - s) / n : 0,
    i = +capRef() || 0,
    l = (c) => {
      let p = 0,
        u = 0;
      const m = [];
      let f = 12345;
      const x = () => (
        (f = (f * 1664525 + 1013904223) % 4294967296),
        f / 4294967296
      );
      for (let v = 0; v < 1500; v++) {
        let g = 1,
          h = 1,
          b = 0,
          y = 0;
        for (let j = 0; j < 200; j++)
          if (
            ((g *= 1 + c * t[Math.floor(x() * t.length)]),
            g > h && (h = g),
            g <= h * 0.8 && (b = 1),
            g <= 0.5)
          ) {
            y = 1;
            break;
          }
        ((p += y), (u += b), m.push(g));
      }
      return (
        m.sort((v, g) => v - g),
        { rz: p / 1500, q20: u / 1500, med: m[750] }
      );
    },
    d = [0.005, 0.01, 0.02, 0.03, 0.05].map((c) => ({ f: c, ...l(c) }));
  return `${dshTab(
    [
      "Risco por trade",
      "Cair 20% do topo",
      "Perder metade da conta",
      "Conta depois de 200 trades (mediana)",
    ],
    d.map(
      (c) =>
        `<tr><td><b>${String(c.f * 100).replace(".", ",")}%</b>${i ? ` <span class="mut">(${money(i * c.f)})</span>` : ""}</td><td class="${c.q20 > 0.5 ? "r" : ""}">${pct0(c.q20)}</td><td class="${c.rz > 0.05 ? "r" : c.rz < 0.01 ? "g" : ""}">${pct0(c.rz)}</td><td class="${cls(c.med - 1)}">${c.med >= 1 ? "+" : ""}${dshN((c.med - 1) * 100, 0)}%</td></tr>`,
    ),
  )}
<div class="sm" style="margin-top:6px">Kelly (o máximo teórico): <b>${r > 0 ? dshN(r * 100, 1) + "%" : "negativo"}</b> por trade. ${r > 0 ? `Profissional usa no máximo metade disso: <b>${dshN(Math.min((r / 2) * 100, 2), 1)}%</b>${i ? ` (${money(i * Math.min(r / 2, 0.02))})` : ""}.` : "Seu histórico ainda não tem vantagem: qualquer risco tende a perder. Opere mínimo até melhorar o setup."}</div>
<div class="sm mut">1.500 sequências sorteadas com os seus ${t.length} resultados em vezes o risco (acerto ${pct0(s)}, ganho ÷ perda ${dshN(n)}).</div>`;
}
function fatDias() {
  const e = eqDias();
  return Object.keys(e).map((t) => ({ d: t, v: e[t], x: S.days[t] || {} }));
}
function fatTab(e, t, a) {
  const o = Object.entries(t).filter(([, i]) => i.length);
  if (o.length < 2) return "";
  const s = o
      .map(([i, l]) => {
        const d = sum(l.map((p) => p.v)),
          c = l.filter((p) => p.v > 0).length;
        return [i, l.length, c / l.length, d / l.length, d];
      })
      .sort((i, l) => l[3] - i[3]),
    n = s[0],
    r = s[s.length - 1];
  return `<h2>${e}</h2><div class="card">${dshTab(
    [
      "",
      a === "d" ? "Dias" : "Trades",
      a === "d" ? "Dias +" : "Acerto",
      "Média",
      "Total",
    ],
    s.map(
      ([i, l, d, c, p]) =>
        `<tr><td>${esc(i)}</td><td>${l}</td><td>${pct0(d)}</td><td class="${cls(c)}">${dshM(c)}</td><td class="${cls(p)}">${dshM(p)}</td></tr>`,
    ),
  )}${n[1] >= 3 && r[1] >= 3 && n[3] > 0 && r[3] < 0 ? `<div class="sm" style="margin-top:6px">Melhor: <b>${esc(n[0])}</b> (${dshM(n[3])} por ${a === "d" ? "dia" : "trade"}). Pior: <b>${esc(r[0])}</b> (${dshM(r[3])}).</div>` : ""}</div>`;
}
function fatHtml() {
  const e = simRows();
  if (!e.length) return '<p class="mut">Sem trades no período.</p>';
  const [t, a] = intervalo(PER, hjD()),
    o = fatDias().filter((l) => !t || (l.d >= t && l.d <= a)),
    s = (l, d) => {
      const c = {};
      return (
        l.forEach((p) => {
          const u = d(p);
          u == null ||
            u === "" ||
            (Array.isArray(u) ? u : [u]).forEach((m) =>
              (c[m] ?? (c[m] = [])).push(p),
            );
        }),
        c
      );
    },
    n = { 8: "turno 8h", 16: "turno 16h", 0: "turno 0h", F: "folga" },
    r = (l) => {
      const d = ((S.ax || {}).tela || {})[l];
      return d == null
        ? null
        : d < 30
          ? "menos de 30 min"
          : d < 90
            ? "30 a 90 min"
            : d < 180
              ? "1h30 a 3h"
              : "mais de 3h";
    };
  let i =
    '<div class="sm mut" style="margin:6px 0 2px">O que acontece ao redor dos seus trades. Os grupos aparecem conforme você marca sono, contexto e nota.</div>';
  return (
    (i += fatTab(
      "Nota do trade (antes de entrar)",
      s(e, (l) => notaABC(l.t) || null),
      "t",
    )),
    (i += fatTab(
      "Tilt",
      s(e, (l) =>
        l.tilt ? "Em tilt (logo depois de stop ou mão maior)" : "Sem tilt",
      ),
      "t",
    )),
    (i += fatTab(
      "Tipo de dia do mercado",
      s(o, (l) => {
        const d = CTX.find((c) => c[0] === l.x.ctx);
        return d ? d[1] : null;
      }),
      "d",
    )),
    (i += fatTab(
      "Sono",
      s(o, (l) => {
        const d = SONO.find((c) => c[0] === l.x.sono);
        return d ? d[1] : null;
      }),
      "d",
    )),
    (i += fatTab(
      "Turno da Gerdau no dia anterior",
      s(o, (l) => {
        const d = tcod(diasMais(l.d, -1));
        return d ? n[d] || d : null;
      }),
      "d",
    )),
    (i += fatTab(
      "Turno no próprio dia",
      s(o, (l) => {
        const d = tcod(l.d);
        return d ? n[d] || d : null;
      }),
      "d",
    )),
    (i += fatTab(
      "Eventos do dia",
      s(o, (l) => {
        const d = evDia(l.d);
        return d.length ? d : "Dia sem evento forte";
      }),
      "d",
    )),
    (i += fatTab(
      "Tempo com o app aberto",
      s(o, (l) => r(l.d)),
      "d",
    )),
    typeof nivBucket == "function" &&
      (i += fatTab(
        "Entrada perto de um nível do dia",
        s(e, (l) => nivBucket(l.t)),
        "t",
      )),
    i
  );
}
function diarioPacote() {
  const e = stRows()
      .map((o) => (o.c ? o : { ...o, c: calc(o) }))
      .filter((o) => o.c && o.c.pl != null)
      .sort((o, s) => String(o.dt).localeCompare(String(s.dt))),
    t = e
      .slice(-180)
      .map((o) => ({
        id: o.id,
        d: String(o.dtx || o.dt).slice(0, 10),
        h: String(o.dt).slice(11, 16),
        at: o.ativo,
        lado: o.side,
        setup: o.setup || "",
        r: o.c.r != null ? +o.c.r.toFixed(2) : null,
        v: +emBRL(o.c.pl, moedaT(o)).toFixed(2),
        erro: o.err && o.err !== "Nenhum" ? o.err : "",
        regras: o.rules === "n" ? "quebrou" : "seguiu",
        emo: o.emo2 || "",
        nota: notaABC(o),
        tilt: o.tilt || "",
        ctx: (S.days[String(o.dt).slice(0, 10)] || {}).ctx || "",
        sono: (S.days[String(o.dt).slice(0, 10)] || {}).sono || "",
        obs: String(o.nota || "").slice(0, 160),
      })),
    a = dshKpi(stDsh(e));
  return {
    resumo: {
      trades: a.n,
      resultado: +a.net.toFixed(2),
      acerto: a.win,
      payoff: a.payoff,
      fator_lucro: a.pf === 1 / 0 ? null : a.pf,
      media_R: a.mr,
      maior_queda: a.dd,
      moeda: DSH_MO,
    },
    trades: t,
  };
}
