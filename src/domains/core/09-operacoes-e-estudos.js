{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    try {
      if (typeof RP == "string" && RP[0] === "w") {
        const [a, o, s] = rng(RP);
        return (
          GO &&
            GO.r === "relsem" &&
            !(S.relsem || {})[s] &&
            setTimeout(() => relIA(s), 400),
          t.replace(
            /(<\/label><div class="mut sm" style="margin-bottom:10px">[^<]*<\/div>)/,
            "$1" + relHtml(a, o, s),
          )
        );
      }
    } catch {}
    return t;
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-relia]");
  t && relIA(t.dataset.relia);
}),
  (GOR.relsem = GOR.rev =
    () => {
      if (tab === "rev") return;
      ((RP = "w0"), irPara("rev"));
      const e = document.getElementById(
        GO.r === "relsem" ? "relsem" : "semrev",
      );
      ((GO.r = null),
        e && setTimeout(() => e.scrollIntoView({ behavior: "smooth" }), 200));
    }));
const COR_APP = () => {
  try {
    return ls.get("diario-cor") === "verde" ? "verde" : "aurora";
  } catch {
    return "aurora";
  }
};
function corAplica() {
  document.documentElement.classList.toggle("aurora", COR_APP() === "aurora");
}
(corAplica(),
  (function () {
    const e = TraderStyles.slot("legacy-029");
    ((e.id = "visual-v3"),
      (e.textContent = TraderStyles.css("legacy-029")),
      TraderStyles.mount(e));
  })());
function vPx(e) {
  const t = numN(e);
  if (t == null) return "—";
  const a = (String(e).split(/[.,]/)[1] || "").length,
    o = Math.abs(t) < 1e3 ? 2 : 0;
  return t.toLocaleString("pt-BR", {
    minimumFractionDigits: o,
    maximumFractionDigits: Math.max(o, Math.min(a, 4)),
  });
}
const f1v = (e) => (+e).toFixed(1).replace(".", ",");
let OPS_D = (() => {
  try {
    return ls.get("diario-ops-d") || "stats";
  } catch {
    return "stats";
  }
})();
function segOps(e) {
  const t = e === "stats" || e === "rev";
  if (t) {
    OPS_D = e;
    try {
      ls.set("diario-ops-d", e);
    } catch {}
  }
  return (
    `<div class="seg hub" style="margin:2px 0 12px">${[
      ["trades", "Day trade"],
      ["swing", "Swing"],
      ["opc", "Opções"],
      ["ativos", "Forex"],
      [OPS_D, "Números"],
    ]
      .map(
        ([a, o]) =>
          `<button class="${a === e || (t && o === "Números") ? "on" : ""}" data-a="gotab" data-id="${a}">${o}</button>`,
      )
      .join("")}</div>` +
    (t
      ? `<div class="hub2">${[
          ["stats", "Estatísticas"],
          ["rev", "Revisão da semana"],
        ]
          .map(
            ([a, o]) =>
              `<button class="${a === e ? "on" : ""}" data-a="gotab" data-id="${a}">${o}</button>`,
          )
          .join("")}</div>`
      : "")
  );
}
const MGRP = [
    ["Hoje", ["mercado:giro", "mercado:pn", "mercado:mu", "mercado:se"]],
    ["Ações", ["mercado:rk", "mercado:saz"]],
    ["Notícias", ["mercado:ag", "mercado:nt", "mercado:eco"]],
    ["Juros", ["juros"]],
    ["Ao vivo", ["live", "graf", "mercado:al"]],
  ],
  MGL = (() => {
    try {
      return ls.get("diario-mgl") || {};
    } catch {
      return {};
    }
  })();
function mGrupos() {
  const e = MGRP.map(([a, o]) => [
      a,
      o.filter((s) => HUB_M.some((n) => n[0] === s)),
    ]),
    t = new Set(e.flatMap((a) => a[1]));
  return (
    HUB_M.forEach((a) => {
      t.has(a[0]) || e[0][1].push(a[0]);
    }),
    e.filter((a) => a[1].length)
  );
}
segM = function (e) {
  const t = mGrupos(),
    a = (n) => (HUB_M.find((r) => r[0] === n) || [n, n])[1];
  let o = t.findIndex((n) => n[1].includes(e));
  if (o < 0) return hubSeg(HUB_M, e);
  MGL[t[o][0]] = e;
  try {
    ls.set("diario-mgl", MGL);
  } catch {}
  const s = (n) =>
    MGL[n[0]] && n[1].includes(MGL[n[0]]) ? MGL[n[0]] : n[1][0];
  return (
    `<div class="seg hub" style="margin:2px 0 12px">${t.map((n, r) => `<button class="${r === o ? "on" : ""}" data-hub="${s(n)}">${n[0]}</button>`).join("")}</div>` +
    (t[o][1].length > 1
      ? `<div class="hub2">${t[o][1].map((n) => `<button class="${n === e ? "on" : ""}" data-hub="${n}">${esc(a(n))}</button>`).join("")}</div>`
      : "")
  );
};
const FER2 = [
  [
    "Gestão de risco",
    [
      [
        "mesa",
        "shield",
        "Mesa proprietária",
        "Regras, meta e quanto posso perder hoje",
      ],
      ["painel", "target", "Painel", "Metas, tamanho da posição e backup"],
      ["contratos", "calc", "Contratos", "Lotes pelo capital e volatilidade"],
      ["carreira", "star", "Plano de transição", "Quando dá para sair da CLT"],
    ],
  ],
  [
    "Carteira e impostos",
    [
      ["carteiras", "wallet", "Carteiras", "Brasil e EUA, evolução"],
      ["analise", "bot", "Análise IA", "Relatório da carteira ou de um ativo"],
      ["imposto", "receipt", "Imposto de renda", "Notas, custos e DARF"],
    ],
  ],
  ["Estudo", [["estudos", "book", "Estudos", "Livros, resumos e simulados"]]],
  [
    "Dados e conta",
    [
      ["import", "inbox", "Importar do Profit", "Automático pela ponte ou CSV"],
      ["conta", "user", "Conta", "Login, sincronização e backup"],
      ["status", "gear", "Status do sistema", "Fontes de dados, IA e avisos"],
    ],
  ],
];
((vMais = function () {
  const e = (o) => (window.icoSvg ? window.icoSvg(o) : ""),
    t = (() => {
      try {
        return ls.get("diario-theme") || "auto";
      } catch {
        return "auto";
      }
    })(),
    a = COR_APP();
  return `<h1>Ferramentas</h1>${FER2.map(([o, s]) => `<h2>${o}</h2><div class="fgr">${s.map(([n, r, i, l]) => `<button class="it" data-a="gotab" data-id="${n}"><span class="ic">${e(r)}</span><span><b>${i}</b><small>${l}</small></span><span class="ch">›</span></button>`).join("")}</div>`).join("")}
<h2>Aparência</h2><div class="seg">${[
    ["auto", "Automático"],
    ["light", "Claro"],
    ["dark", "Escuro"],
  ]
    .map(
      ([o, s]) =>
        `<button class="${t === o ? "on" : ""}" data-a="theme" data-id="${o}">${s}</button>`,
    )
    .join("")}</div>
<div class="seg" style="margin-top:8px">${[
    ["aurora", "Aurora", "linear-gradient(135deg,#86abcb,#b2aca0,#66cc99)"],
    ["verde", "Esmeralda", "linear-gradient(135deg,#2e8a5c,#46c184)"],
  ]
    .map(
      ([o, s, n]) =>
        `<button class="${a === o ? "on" : ""}" data-cor="${o}"><span class="cor-dot" style="background:${n}"></span>${s}</button>`,
    )
    .join("")}</div>`;
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-cor]");
    if (t) {
      try {
        ls.set("diario-cor", t.dataset.cor);
      } catch {}
      (corAplica(), render());
    }
  }),
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target.closest('[data-m2="ferr"]')) return;
      (e.stopImmediatePropagation(), e.preventDefault());
      const t = document.getElementById("mdr2");
      (t && t.remove(),
        (document.body.style.overflow = ""),
        (tab = "mais"),
        render(),
        scrollTo(0, 0));
    },
    !0,
  ));
{
  const e = card;
  card = function (t) {
    try {
      const a = calc(t),
        o = isOpen(t),
        s = t.pplan || t.pin || t.pout,
        n =
          t.tipo === "O"
            ? t.side === "C"
              ? "Comprado"
              : "Lançado"
            : t.side === "C"
              ? "Compra"
              : "Venda",
        r = o
          ? '<span class="tc-ab">● aberto</span>'
          : a.pl == null
            ? '<span class="mut sm">–</span>'
            : `<b class="tc-pl ${cls(a.pl)}">${mT(t, a.pl)}</b>`,
        i = "",
        l =
          a.pl == null
            ? ""
            : pctConta(a.pl, moedaT(t), t.tipo || "D").replace(" da conta", ""),
        d = (p, u, m) =>
          `<div><small>${p}</small><b class="${m || ""}">${u}</b></div>`,
        c =
          (t.err && t.err !== "Nenhum"
            ? '<span class="tag">⚠ erro</span>'
            : "") +
          (t.rules === "n" ? '<span class="tag">fora das regras</span>' : "");
      return (
        `<div class="card row tcard ${o ? "tc-op" : a.pl == null ? "" : a.pl >= 0 ? "tc-g" : "tc-l"}" data-a="edit" data-id="${t.id}" data-s="${esc(((t.ativo || "") + " " + (t.setup || "")).toLowerCase())}"><div class="tc-h">${s ? `<div class="th"><img data-img="${s}"></div>` : ""}<div class="fl"><div class="tc-t"><b>${esc(t.ativo) || '<span class="r">⚠ sem ativo</span>'}</b><span class="tc-sd ${t.side === "C" ? "c" : "v"}">${n}</span></div><div class="mut sm">${fdt(t.dt)}${t.tipo === "O" && t.strike ? " · " + (t.ot === "P" ? "Put" : "Call") + " " + esc(t.strike) : ""}${t.setup ? " · " + esc(t.setup) : ""}</div></div><div class="rt">${r}<div class="sm mut">${i}${i && l ? " · " : ""}${l}</div></div></div><div class="tc-g">${d("Entrada", vPx(t.entry))}${d("Stop", vPx(t.stop), "r")}${o ? d("Alvo", vPx(t.target), "g") : d("Saída", vPx(t.exit), cls(a.pl))}${a.rr != null ? d("R/R", "1:" + f1v(a.rr)) : d("Qtd.", esc(t.qty || "—"))}</div>` +
        (c || o
          ? `<div class="tc-f">${c}${o ? `<button class="btn s" data-a="enc" data-id="${t.id}">Encerrar</button>` : ""}</div>`
          : "") +
        "</div>"
      );
    } catch {
      return e.apply(this, arguments);
    }
  };
}
function convBar(e, t) {
  return e == null || !isFinite(e)
    ? ""
    : ((e = Math.max(0, Math.min(100, Math.round(e)))),
      `<div class="cvl">${t || "Convicção"}</div><div class="cvb"><span class="mono">${e}/100</span><i><b style="width:${e}%"></b></i></div>`);
}
function ideiaHtml(e) {
  const t = calc(e),
    a = numN(e.entry),
    o = numN(e.stop);
  if (a == null || o == null || a === o) return "";
  const s = numN(e.target),
    n = numN(e.exit),
    r = (d) =>
      a
        ? `<em>${d > a ? "+" : ""}${(((d - a) / a) * 100).toFixed(1).replace(".", ",")}%</em>`
        : "",
    i = pctConta(t.risk, moedaT(e), e.tipo || "D")
      .replace("+", "")
      .replace(" da conta", " do capital"),
    l = e.conv != null && e.conv !== "" ? +e.conv : null;
  return `<div class="idt"><span class="idt-b${n != null ? " x" : ""}">${n != null ? "Trade encerrado" : "Ideia de trade"}</span>
<div class="ln"><span>Entrada</span><b class="v">${vPx(e.entry)}</b></div>
<div class="ln"><span>Stop</span><b class="v r">${r(o)}${vPx(e.stop)}</b></div>
${s != null ? `<div class="ln"><span>Alvo</span><b class="v g">${r(s)}${vPx(e.target)}</b></div>` : ""}
${n != null ? `<div class="ln"><span>Saída</span><b class="v ${cls(t.pl)}">${vPx(e.exit)}</b></div>` : ""}<hr>
${t.rr != null ? `<div class="ln"><span>Risco/Retorno</span><b class="v">1:${f1v(t.rr)}</b></div>` : ""}
${t.risk != null ? `<div class="ln"><span>Risco</span><b class="v">${mT(e, t.risk)}</b></div>` : ""}
${i ? `<div class="ln"><span>Dimensionamento</span><b class="v">${i}</b></div>` : ""}
${t.pl != null ? `<div class="ln"><span>Resultado</span><b class="v ${cls(t.pl)}">${mT(e, t.pl)}</b></div>` : ""}
${l != null ? convBar(l) : ""}</div>`;
}
{
  const e = prev;
  prev = function () {
    e.apply(this, arguments);
    try {
      const t = $("#prev");
      if (!t || !T) return;
      const a = ideiaHtml(T);
      if (a) {
        const s = t.innerHTML;
        t.innerHTML = a + (s ? `<div class="sm mut">${s}</div>` : "");
      }
      const o = document.getElementById("cvv");
      o &&
        (o.textContent =
          T.conv != null && T.conv !== ""
            ? T.conv + "/100"
            : "toque para marcar");
    } catch {}
  };
}
{
  const e = sheet;
  sheet = function () {
    const t = e.apply(this, arguments);
    try {
      if (!T || QM) return t;
      const a = T.conv != null && T.conv !== "" ? +T.conv : null;
      return t.replace(
        '<label>Tipo de mercado<select name="mkt">',
        `<label>Convicção no trade · <b id="cvv" class="mono">${a != null ? a + "/100" : "toque para marcar"}</b><input type="range" name="conv" min="0" max="100" step="5" value="${a ?? 50}" style="accent-color:var(--ac)"></label><label>Tipo de mercado<select name="mkt">`,
      );
    } catch {
      return t;
    }
  };
}
{
  const e = olCard;
  olCard = function (t) {
    const a = e.apply(this, arguments);
    try {
      const o = olVeredito(t),
        s = olRR(t),
        n = o.n
          ? convBar(
              (o.ok / o.n) * 100,
              "Regras atendidas · " + o.ok + " de " + o.n,
            )
          : "",
        r = s.length
          ? `<div class="ln" style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--bd);margin-top:4px"><span class="mut">Risco/Retorno</span><b class="mono" style="font-size:18px">1:${f1v(s[0].rr)}</b></div>`
          : "";
      return a.replace(
        '<details class="olr">',
        r +
          (n ? `<div style="margin:6px 0 4px">${n}</div>` : "") +
          '<details class="olr">',
      );
    } catch {
      return a;
    }
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia") return;
      const t = document.getElementById("dfases");
      if (!t || t.classList.contains("stepper")) return;
      (t.classList.add("stepper"),
        [...t.querySelectorAll("button")].forEach((o, s) => {
          const n = (o.querySelector(".sm") || {}).textContent || "",
            r = n.match(/(\d+) de (\d+)/),
            i = r && +r[2] ? Math.min(100, (+r[1] / +r[2]) * 100) : null;
          (o.insertAdjacentHTML(
            "afterbegin",
            `<span class="n">${s + 1}</span>`,
          ),
            i != null &&
              o.insertAdjacentHTML(
                "beforeend",
                `<span class="pg"><b style="width:${i}%"></b></span>`,
              ));
        }));
      const a = {
        pre: ["Antes", "o que preparamos"],
        dur: ["Durante", "o que vivemos"],
        pos: ["Depois", "o que aprendemos"],
      };
      document.querySelectorAll("#app .dfase").forEach((o, s) => {
        const n = o.firstElementChild,
          r = n && n.querySelector("h2");
        if (!r) return;
        const i = (n.querySelector(".sm") || {}).textContent || "",
          l = a[o.dataset.fase] || ["", ""];
        n.outerHTML = `<div class="stp"><span class="n">${s + 1}</span><div><small>${l[0]}</small><b>${esc(r.textContent.trim())}</b></div></div><div class="stp-c">${esc(i || l[1])}</div>`;
      });
    } catch {}
  };
}
const EMO_RAP = [
  ["😰", "Ansioso"],
  ["😌", "Calmo"],
  ["😤", "Com raiva"],
  ["🤩", "Eufórico"],
  ["😴", "Sem foco"],
  ["🎯", "No plano"],
];
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || (typeof DV < "u" && DV === "hist")) return;
      const t = document.getElementById("app"),
        a = document.getElementById("dfases");
      if (!t || !a || a.classList.contains("fixo")) return;
      a.classList.add("fixo");
      const o = (h) => t.querySelector(`.dfase[data-fase="${h}"]`),
        s = o("pre"),
        n = o("dur"),
        r = o("pos");
      if (!s || !n || !r) return;
      const i = (h) => h.querySelector(".stp-c") || h.firstElementChild,
        l = document.getElementById("dd"),
        d = l && l.closest("label") && l.closest("label").parentElement;
      if (d) {
        (d.classList.add("dlin"),
          [...l.closest("label").childNodes].forEach((b) => {
            b.nodeType === 3 && b.remove();
          }));
        const h = [...t.querySelectorAll(":scope > .seg")].find((b) =>
          b.querySelector('[data-a="dv"]'),
        );
        if (h) {
          const b = h.querySelector('[data-a="dv"][data-id="hist"]');
          (b &&
            ((b.className = "btn s dhist"),
            (b.innerHTML =
              (window.icoSvg ? icoSvg("file") : "") + "<span>Histórico</span>"),
            d.append(b)),
            h.remove());
        }
      }
      const c = t.querySelector(".mt-card");
      c && i(n).after(c);
      const p = [...t.querySelectorAll(":scope > .card")].find((h) =>
          /^Resultado do dia/.test((h.textContent || "").trim()),
        ),
        u = document.getElementById("dis");
      {
        let h = i(r);
        [p, u].forEach((b) => {
          b && (h.after(b), (h = b));
        });
      }
      const m = document.getElementById("cnt"),
        f = m && m.closest("h2");
      f &&
        r.contains(f) &&
        f.firstChild?.nodeType === 3 &&
        (f.firstChild.textContent = "Revisão das regras · após operar ");
      const x = [...s.querySelectorAll(":scope > .card")].find((h) =>
        h.querySelector('[data-d="maxP"]'),
      );
      if (x) {
        const h = document.createElement("details");
        ((h.className = "card dlim"),
          (h.innerHTML =
            '<summary class="sm"><b>Limites só de hoje</b> <span class="mut">· opcional, vale só para este dia</span></summary>'),
          [...x.children].forEach((b, y) => {
            y > 0 && h.append(b);
          }),
          x.replaceWith(h));
      }
      const v = document.getElementById("qn");
      if (v && !document.getElementById("emor")) {
        const h = document.createElement("div");
        ((h.id = "emor"),
          (h.className = "emor"),
          (h.innerHTML = EMO_RAP.map(
            ([b, y]) => `<button data-emor="${b} ${y}">${b} ${y}</button>`,
          ).join("")),
          v.parentElement.after(h));
      }
      (c &&
        /checklist de regras/i.test(c.textContent || "") &&
        !c.querySelector("[data-irchk]") &&
        (c.querySelector(".mt-st") || c.firstElementChild).insertAdjacentHTML(
          "afterend",
          '<button class="btn s" data-irchk="1" style="margin:6px 0 4px">Abrir o checklist de regras ›</button>',
        ),
        a.classList.add("fixo"));
      const g = document.getElementById("tape");
      a.style.top =
        (g && getComputedStyle(g).position === "fixed"
          ? g.getBoundingClientRect().bottom
          : 0) +
        6 +
        "px";
    } catch (t) {
      console.error(t);
    }
  };
}
(document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-irchk]")) return;
  const t = document.querySelector('#dfases [data-dfase="pos"]');
  (t && t.click(),
    setTimeout(() => {
      const a = document.getElementById("cnt");
      a &&
        a.closest("h2").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60));
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-emor]");
    if (!t) return;
    const a = document.getElementById("qn"),
      o = document.querySelector('[data-dn="add"]');
    if (!a || !o) return;
    const s = a.value.trim();
    ((a.value = t.dataset.emor + (s ? " · " + s : "")), o.click());
  }),
  (function () {
    const e = TraderStyles.slot("legacy-030");
    ((e.textContent = TraderStyles.css("legacy-030")), TraderStyles.mount(e));
  })());
let FST = null,
  FST_ID = null;
function qtdSugerida(e) {
  try {
    const t = numN(e.entry),
      a = numN(e.stop);
    if (t == null || a == null || t === a) return null;
    const o = e.tipo || "D",
      s = +capRef(o) || +gv("ct", "cap", "") || 0,
      n = +gv("ct", "pct", "") || 1;
    if (!(s > 0)) return { semCap: 1 };
    const r = numN(e.pv) || 1,
      i = Math.abs(t - a) * r * (e.tipo, 1),
      l = (s * n) / 100;
    return {
      q: Math.floor(l / i),
      risco: l,
      pct: n,
      porUn: i,
      acao:
        e.tipo !== "O" &&
        /\d$/.test(String(e.ativo || "").trim()) &&
        !/^(WIN|WDO|IND|DOL|BGI|CCM|ICF|WSP|DI1)/i.test(String(e.ativo || "")),
    };
  } catch {
    return null;
  }
}
function qtdHtml(e) {
  const t = qtdSugerida(e);
  if (!t) return "";
  if (t.semCap)
    return '<div class="qsug sm mut">Defina o capital (Configurar capital, na aba da operação) para o app sugerir a quantidade pelo seu risco.</div>';
  if (t.q < 1)
    return `<div class="qsug sm r">O stop custa ${money(t.porUn)} por unidade, mais que o seu risco por trade (${money(t.risco)}). Diminua o stop ou não opere.</div>`;
  const a = t.acao && t.q >= 100 ? Math.floor(t.q / 100) * 100 : t.q,
    o = numN(e.qty),
    s = o != null && o > t.q;
  return `<div class="qsug sm${s ? " acima" : ""}">${s ? "⚠ Acima do seu risco por trade. " : ""}Pelo seu risco (${String(t.pct).replace(".", ",")}% = ${money(t.risco)}): <b class="mono">${a.toLocaleString("pt-BR")}</b> ${t.acao ? "ações" : "contrato(s)"}${o !== a ? ` <button type="button" class="btn s" data-qsug="${a}">Usar</button>` : " ✓"}</div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-qsug]");
  if (!t || !T) return;
  T.qty = t.dataset.qsug;
  const a = document.querySelector('#sh input[name="qty"]');
  (a && (a.value = T.qty), prev());
});
{
  const e = prev;
  prev = function () {
    e.apply(this, arguments);
    try {
      if (!T || QM) return;
      const t = document.querySelector("#sh .fqrow");
      if (!t) return;
      let a = document.getElementById("qsugw");
      (a || ((a = document.createElement("div")), (a.id = "qsugw"), t.after(a)),
        (a.innerHTML = qtdHtml(T)));
    } catch {}
  };
}
{
  const e = showSheet;
  showSheet = function () {
    e.apply(this, arguments);
    try {
      if (!T || QM) return;
      const t = document.querySelector("#sh .sh");
      if (!t || t.querySelector(".fstep")) return;
      FST_ID !== T.id && ((FST_ID = T.id), (FST = "ab"));
      const a = [...t.children],
        o = a[0],
        s = (Pe) => {
          const Me = t.querySelector(`[name="${Pe}"]`);
          if (!Me) return null;
          let ue = Me;
          for (
            ;
            ue &&
            ue.parentElement &&
            ue.parentElement !== t &&
            !ue.parentElement.classList.contains("fpan");

          )
            ue = ue.parentElement;
          return ue;
        },
        n = (Pe) => {
          const Me = t.querySelector(`[name="${Pe}"]`);
          return Me && Me.closest("label");
        },
        r = (Pe) => ((Pe && Pe.textContent) || "").trim(),
        i = document.createElement("div"),
        l = document.createElement("div");
      ((i.className = "fpan"),
        (i.dataset.fp = "ab"),
        (l.className = "fpan"),
        (l.dataset.fp = "en"));
      const d = s("nota");
      d ? (d.before(i), d.before(l)) : t.append(i, l);
      const c = n("exit"),
        p = s("exit");
      if (c && p && p !== c) {
        (p.classList.remove("g3"), p.classList.add("g2", "fqrow"));
        const Pe = document.createElement("div");
        ((Pe.className = "g2"), Pe.append(c));
        const Me = n("dtx");
        (Me && ((Me.style.margin = "0"), Pe.append(Me)), l.append(Pe));
      }
      const u = s("mep");
      if (u) {
        const Pe = u.nextElementSibling;
        (l.append(u), Pe && Pe.classList.contains("mut") && l.append(Pe));
      }
      const m = s("cost");
      m && l.append(m);
      const f = a.find((Pe) => Pe.tagName === "H3" && /Fotos/.test(r(Pe)));
      let x = null;
      if (f) {
        const Pe = f.nextElementSibling;
        if (
          ((x =
            Pe &&
            [...Pe.querySelectorAll(".ph")].find((Me) =>
              /Sa\xedda/.test(r(Me.querySelector("label"))),
            )),
          x)
        ) {
          const Me = document.createElement("div");
          ((Me.className = "g2"),
            (Me.innerHTML = "<div></div>"),
            Me.prepend(x),
            l.append(Me));
        }
        f.textContent = "Fotos da entrada";
      }
      const v = a.find((Pe) => Pe.tagName === "H3" && /Disciplina/.test(r(Pe)));
      v && v.remove();
      const g = a.find(
        (Pe) => Pe.tagName === "LABEL" && /Segui minhas regras/.test(r(Pe)),
      );
      if (g) {
        const Pe = g.nextElementSibling;
        (l.append(g), Pe && l.append(Pe));
      }
      const h = a.find(
          (Pe) => Pe.tagName === "LABEL" && /Erros? cometidos?/.test(r(Pe)),
        ),
        b = d;
      if (h) {
        let Pe = h;
        const Me = [];
        for (; Pe && Pe !== b && Pe !== i && Pe !== l; )
          (Me.push(Pe), (Pe = Pe.nextElementSibling));
        Me.forEach((ue) => l.append(ue));
      }
      const y = a.find(
        (Pe) => Pe.tagName === "LABEL" && /^Tipo de opera\xe7\xe3o/.test(r(Pe)),
      );
      let j = o.nextElementSibling;
      const k = [];
      for (; j && j !== i; ) (k.push(j), (j = j.nextElementSibling));
      k.forEach((Pe) => i.append(Pe));
      const A = s("ativo"),
        C = s("entry"),
        I = s("target2"),
        J = t.querySelector(".fqrow") || s("qty"),
        se = t.querySelector("#prev");
      if (A && i.contains(A)) {
        let Pe = A;
        [C, I, J, se].forEach((Me) => {
          Me && Me !== Pe && (Pe.after(Me), (Pe = Me));
        });
      }
      const Ie = document.createElement("div");
      ((Ie.className = "fstep"),
        (Ie.innerHTML =
          '<button data-fst="ab"><i>1</i>Abertura<small>preços, risco e setup</small></button><button data-fst="en"><i>2</i>Encerramento<small>saída, regras e erros</small></button>'),
        o.after(Ie),
        fstPinta(),
        prev());
    } catch (t) {
      console.error(t);
    }
  };
}
function fstPinta() {
  (document
    .querySelectorAll("#sh [data-fst]")
    .forEach((e) => e.classList.toggle("on", e.dataset.fst === FST)),
    document
      .querySelectorAll("#sh .fpan")
      .forEach((e) => (e.style.display = e.dataset.fp === FST ? "" : "none")));
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("#sh [data-fst]");
  if (!t) return;
  ((FST = t.dataset.fst), fstPinta());
  const a = document.querySelector("#sh .ov");
  a && (a.scrollTop = 0);
}),
  (function () {
    const e = TraderStyles.slot("legacy-031");
    ((e.textContent = TraderStyles.css("legacy-031")), TraderStyles.mount(e));
  })());
function tcBarHtml(e, t) {
  const a = numN(e.entry),
    o = numN(e.stop),
    s = numN(e.target);
  if (a == null || o == null || s == null || s === o) return "";
  const n = (l) => Math.max(0, Math.min(100, ((l - o) / (s - o)) * 100)),
    r = n(a),
    i = t != null ? n(t) : null;
  return `<div class="tc-bar"><div class="tr"><i class="rk" style="width:${r}%"></i><i class="gn" style="left:${r}%;width:${100 - r}%"></i><i class="en" style="left:${r}%"></i>${i != null ? `<i class="px" style="left:${i}%"></i>` : ""}</div><div class="lb"><span class="r">Stop</span>${i != null ? `<span class="mono">agora ${vPx(t)}</span>` : '<span class="mut">sem cotação ao vivo</span>'}<span class="g">Alvo</span></div></div>`;
}
function tcPx(e) {
  try {
    const t = typeof lvCalc == "function" ? lvCalc(e) : null;
    return t ? t.px : null;
  } catch {
    return null;
  }
}
{
  const e = card;
  card = function (t) {
    const a = e.apply(this, arguments);
    try {
      if (!isOpen(t) || !a.includes("tc-g")) return a;
      const o = tcBarHtml(t, tcPx(t));
      return o ? a.replace('<div class="tc-g">', o + '<div class="tc-g">') : a;
    } catch {
      return a;
    }
  };
}
{
  const e = lvPaint;
  lvPaint = function () {
    e.apply(this, arguments);
    try {
      document.querySelectorAll("#app .tcard.tc-op").forEach((t) => {
        const a = S.trades.find((n) => n.id === t.dataset.id),
          o = t.querySelector(".tc-bar");
        if (!a || !o) return;
        const s = tcBarHtml(a, tcPx(a));
        s && (o.outerHTML = s);
      });
    } catch {}
  };
}
{
  const e = vStats;
  vStats = function () {
    let t = e.apply(this, arguments);
    try {
      if (ST.aba !== "geral") return t;
      const a = stCtx(),
        o = a.rows.filter((d) => d.conv != null && d.conv !== "");
      if (!o.length) return t;
      const s = (d) =>
          +d.conv >= 70
            ? "Alta (70+)"
            : +d.conv >= 40
              ? "Média (40–69)"
              : "Baixa (0–39)",
        n = agrupa(o, s, ["Alta (70+)", "Média (40–69)", "Baixa (0–39)"]),
        r = n.find((d) => /^Alta/.test(d.k)),
        i = n.find((d) => /^Baixa/.test(d.k));
      let l = "";
      return (
        r && i && r.n >= 5 && i.n >= 5
          ? (l =
              r.acerto > i.acerto + 0.1
                ? "Quando você está confiante, acerta mais: vale dar mais peso a esses trades (sem passar do seu risco)."
                : r.acerto < i.acerto
                  ? "Sua convicção alta não está acertando mais que a baixa: cuidado com excesso de confiança."
                  : "Ainda não há diferença clara entre convicção alta e baixa.")
          : (l =
              "Marque a convicção nos trades (formulário → Abertura). Com 5+ trades em cada faixa aparece a leitura."),
        t +
          `<h2>Por convicção</h2>${stTbl("Convicção", n, a.fs)}<div class="sm mut" style="margin:6px 2px">${l} ${o.length} de ${a.rows.length} trades com convicção marcada.</div>`
      );
    } catch {
      return t;
    }
  };
}
{
  const e = fxHtml;
  fxHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = S.trades.find((n) => FX && n.id === FX.id);
      if (!a) return t;
      const o = ideiaHtml(a);
      if (!o) return t;
      t = t.replace(
        /<div class="card" style="margin:0;padding:10px"><span class="sm mut">(Risco planejado|Ganho\/risco planejado)<\/span><div>[\s\S]*?<\/b><\/div><\/div>/g,
        "",
      );
      const s = isOpen(a) ? tcBarHtml(a, tcPx(a)) : "";
      return t.replace(
        "<h2>Plano × execução</h2>",
        o.replace('<div class="idt">', '<div class="idt">') +
          (s ? `<div class="card">${s}</div>` : "") +
          "<h2>Plano × execução</h2>",
      );
    } catch {
      return t;
    }
  };
}
(function () {
  const e = TraderStyles.slot("legacy-032");
  ((e.textContent = TraderStyles.css("legacy-032")), TraderStyles.mount(e));
})();
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      if (
        !t ||
        (tab !== "home" &&
          tab !== "conta" &&
          [...t.querySelectorAll(":scope > .warn")].forEach((s) => {
            /backup/i.test(s.textContent || "") && s.remove();
          }),
        tab !== "home")
      )
        return;
      const a = t.querySelector('section[data-hb="posso"] .card');
      (a &&
        !a.classList.contains("pscmp") &&
        (a.classList.add("pscmp"),
        a.insertAdjacentHTML(
          "beforeend",
          '<button class="btn s psv" data-a="gotab" data-id="dia">Ver detalhes no Meu dia ›</button>',
        )),
        t.querySelectorAll("#gg .kv > *").forEach((s) => {
          /^Trades hoje/.test((s.textContent || "").trim()) && s.remove();
        }));
      const o = t.querySelector("#pp");
      if (o && /Preencha os limites/.test(o.textContent || "")) {
        const s = o.closest("section");
        s && (s.style.display = "none");
      }
    } catch {}
  };
}
(function () {
  const e = TraderStyles.slot("legacy-033");
  ((e.textContent = TraderStyles.css("legacy-033")), TraderStyles.mount(e));
})();
const OPM = {
    ncdf(e) {
      const t = 1 / (1 + 0.2316419 * Math.abs(e)),
        a = 0.3989423 * Math.exp((-e * e) / 2),
        o =
          a *
          t *
          (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return e > 0 ? 1 - o : o;
    },
    npdf(e) {
      return Math.exp((-e * e) / 2) / Math.sqrt(2 * Math.PI);
    },
    bs(e, t, a, o, s, n) {
      if (!(e > 0) || !(t > 0)) return 0;
      if (n === "A") return e;
      if (a <= 0 || !(s > 0)) return Math.max(0, n === "C" ? e - t : t - e);
      const r = s * Math.sqrt(a),
        i = (Math.log(e / t) + (o + (s * s) / 2) * a) / r,
        l = i - r;
      return n === "C"
        ? e * OPM.ncdf(i) - t * Math.exp(-o * a) * OPM.ncdf(l)
        : t * Math.exp(-o * a) * OPM.ncdf(-l) - e * OPM.ncdf(-i);
    },
    gregas(e, t, a, o, s, n) {
      if (n === "A") return { d: 1, g: 0, th: 0, ve: 0 };
      if (a <= 0 || !(s > 0) || !(e > 0) || !(t > 0))
        return {
          d: (n === "C" ? e > t : e < t) ? (n === "C" ? 1 : -1) : 0,
          g: 0,
          th: 0,
          ve: 0,
        };
      const r = s * Math.sqrt(a),
        i = (Math.log(e / t) + (o + (s * s) / 2) * a) / r,
        l = i - r,
        d = OPM.npdf(i),
        c = Math.exp(-o * a),
        p = n === "C" ? OPM.ncdf(i) : OPM.ncdf(i) - 1,
        u = d / (e * r),
        m =
          -(e * d * s) / (2 * Math.sqrt(a)) +
          (n === "C" ? -o * t * c * OPM.ncdf(l) : o * t * c * OPM.ncdf(-l));
      return { d: p, g: u, th: m / 365, ve: (e * d * Math.sqrt(a)) / 100 };
    },
    iv(e, t, a, o, s, n) {
      if (!(e > 0) || !(t > 0) || !(a > 0) || !(o > 0) || n === "A")
        return null;
      const r = Math.max(
        0,
        n === "C" ? t - a * Math.exp(-s * o) : a * Math.exp(-s * o) - t,
      );
      if (e < r * 0.999) return null;
      let i = 0.005,
        l = 5;
      if (OPM.bs(t, a, o, s, l, n) < e) return null;
      for (let d = 0; d < 80; d++) {
        const c = (i + l) / 2;
        OPM.bs(t, a, o, s, c, n) > e ? (l = c) : (i = c);
      }
      return (i + l) / 2;
    },
  },
  opR = () => {
    try {
      const e = typeof JR < "u" && JR.data && JR.data.selic && +JR.data.selic.v;
      return Math.log(1 + (e > 0 ? e : 15) / 100);
    } catch {
      return Math.log(1.15);
    }
  },
  opDias = (e, t) =>
    Math.round(
      (new Date(t + "T12:00:00") -
        new Date(String(e).slice(0, 10) + "T12:00:00")) /
        864e5,
    );
function opVencMes(e) {
  const t = ((typeof VENC < "u" && VENC.acoes) || []).find(
    (n) => n.slice(0, 7) === e,
  );
  if (t) return t;
  const [a, o] = e.split("-").map(Number),
    s = new Date(Date.UTC(a, o - 1, 1));
  return (
    s.setUTCDate(1 + ((5 - s.getUTCDay() + 7) % 7) + 14),
    s.toISOString().slice(0, 10)
  );
}
function opPernas(e) {
  if (!e) return [];
  if (Array.isArray(e.legs) && e.legs.length)
    return e.legs.map((o) => ({
      ...o,
      k: numN(o.k),
      pr: numN(o.pr),
      q: numN(o.q) || 0,
    }));
  if ((e.tipo || "D") !== "O") return [];
  const t = numN(e.strike),
    a = numN(e.entry);
  return t == null || a == null || !e.venc
    ? []
    : [
        {
          id: "l0",
          tp: e.ot === "P" ? "P" : "C",
          lado: e.side === "V" ? "V" : "C",
          k: t,
          venc: e.venc,
          pr: a,
          q: numN(e.qty) || 0,
        },
      ];
}
const opSub = (e) =>
  String(e.sub || "")
    .trim()
    .toUpperCase();
function opSpot(e) {
  const t = opSub(e);
  try {
    const o = t && typeof lvQ == "function" ? lvQ(t) : null;
    if (o && o.ult > 0) return { v: +o.ult, f: "agora" };
  } catch {}
  try {
    const o = (OPG.rows || []).find((s) => s.ativo === t);
    if (o && +o.spot > 0) return { v: +o.spot, f: "ponte" };
  } catch {}
  const a = numN(e.spot);
  return a > 0 ? { v: a, f: "na entrada" } : null;
}
function opIVs(e, t) {
  const a = numN(e.spot) || (opSpot(e) || {}).v,
    o = opR(),
    s = String(e.dt || loc()).slice(0, 10);
  return t.map((n) => {
    if (n.tp === "A") return null;
    if (numN(n.iv) > 0) return numN(n.iv) / 100;
    const r = Math.max(1, opDias(s, n.venc)) / 365;
    return OPM.iv(n.pr, a, n.k, r, o, n.tp) || 0.35;
  });
}
function opValor(e, t, a, o, s, n) {
  return e.reduce((r, i, l) => {
    const d = i.lado === "V" ? -1 : 1,
      c = Math.max(0, opDias(o, i.venc)) / 365,
      p = t[l] == null ? 0 : Math.max(0.01, t[l] * (1 + (n || 0))),
      u = i.tp === "A" ? a : OPM.bs(a, i.k, c, s, p, i.tp);
    return r + d * (i.q || 0) * (u - (i.pr || 0));
  }, 0);
}
function opGregas(e, t, a, o, s) {
  const n = { d: 0, g: 0, th: 0, ve: 0 };
  return (
    e.forEach((r, i) => {
      const l = r.lado === "V" ? -1 : 1,
        d = Math.max(0, opDias(o, r.venc)) / 365,
        c = OPM.gregas(a, r.k, d, s, t[i] || 0.35, r.tp);
      ["d", "g", "th", "ve"].forEach((p) => (n[p] += l * (r.q || 0) * c[p]));
    }),
    n
  );
}
function opResumo(e) {
  const t = opPernas(e);
  if (!t.length) return null;
  const a = opSpot(e),
    o = a ? a.v : (t.find((C) => C.k) || {}).k;
  if (!(o > 0)) return null;
  const s = opR(),
    n = opIVs(e, t),
    r =
      t
        .filter((C) => C.tp !== "A")
        .map((C) => C.venc)
        .sort()[0] || loc().slice(0, 10),
    i = loc().slice(0, 10),
    l = t
      .filter((C) => C.tp !== "A" && C.k > 0)
      .map((C) => C.k)
      .concat([o]),
    d = Math.max(0.01, Math.min(...l) * 0.85, o * 0.5),
    c = Math.min(Math.max(...l) * 1.15, o * 1.6),
    p = 240,
    u = [...Array(p + 1)].map((C, I) => d + ((c - d) * I) / p),
    m = u.map((C) => opValor(t, n, C, r, s)),
    f = u.map((C) => opValor(t, n, C, i, s)),
    x = [];
  for (let C = 1; C < u.length; C++) {
    const I = m[C - 1],
      J = m[C];
    (I === 0 && C === 1 && x.push(u[0]),
      ((I < 0 && J >= 0) || (I > 0 && J <= 0)) &&
        x.push(
          u[C - 1] +
            (u[C] - u[C - 1]) * (Math.abs(I) / (Math.abs(I) + Math.abs(J))),
        ));
  }
  const v = opValor(t, n, o * 3, r, s),
    g = opValor(t, n, o * 4, r, s),
    h = opValor(t, n, 1e-4, r, s);
  let b = Math.max(...m, h),
    y = Math.min(...m, h);
  const j = g > v + 1e-6 && g > b,
    k = g < v - 1e-6 && g < y;
  (j || (b = Math.max(b, g)), k || (y = Math.min(y, g)));
  const A = t.reduce(
    (C, I) => C + (I.lado === "V" ? 1 : -1) * (I.q || 0) * (I.pr || 0),
    0,
  );
  return {
    L: t,
    S: o,
    sp: a,
    r: s,
    ivs: n,
    v1: r,
    hoje: i,
    xs: u,
    venc: m,
    agora: f,
    be: x,
    mx: b,
    mn: y,
    ilimG: j,
    ilimP: k,
    net: A,
    gr: opGregas(t, n, o, i, s),
    dte: opDias(i, r),
  };
}
const opM = (e) => (e == null || !isFinite(e) ? "–" : money(e)),
  opN = (e, t = 2) =>
    e == null || !isFinite(e)
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        });
function opGrafico(e, t) {
  const a = e.xs,
    o = e.venc,
    s = e.agora,
    n = o.concat(s, t && t.pl != null ? [t.pl] : []);
  let r = Math.min(0, ...n),
    i = Math.max(0, ...n);
  i - r < 1 && ((i += 1), (r -= 1));
  const l = (f) => 6 + ((f - a[0]) / (a[a.length - 1] - a[0])) * 328,
    d = (f) => 10 + ((i - f) / (i - r)) * 158,
    c = (f) =>
      f
        .map(
          (x, v) =>
            (v ? "L" : "M") + l(a[v]).toFixed(1) + " " + d(x).toFixed(1),
        )
        .join(""),
    p = d(0),
    u =
      `M${l(a[0])} ${p}` +
      o
        .map((f, x) => "L" + l(a[x]).toFixed(1) + " " + d(f).toFixed(1))
        .join("") +
      `L${l(a[a.length - 1])} ${p}Z`,
    m = [0, 0.25, 0.5, 0.75, 1].map((f) => a[0] + (a[a.length - 1] - a[0]) * f);
  return `<svg viewBox="0 0 340 190" style="width:100%;height:auto;display:block" role="img" aria-label="Gráfico de lucro e prejuízo"><defs><clipPath id="opcg"><rect x="0" y="0" width="340" height="${p}"/></clipPath><clipPath id="opcr"><rect x="0" y="${p}" width="340" height="190"/></clipPath></defs>
<path d="${u}" fill="var(--g)" opacity=".16" clip-path="url(#opcg)"/><path d="${u}" fill="var(--r)" opacity=".16" clip-path="url(#opcr)"/>
<line x1="6" x2="334" y1="${p}" y2="${p}" stroke="var(--bd2)"/>
<line x1="${l(e.S)}" x2="${l(e.S)}" y1="10" y2="168" stroke="var(--ac)" stroke-dasharray="4 3"/>
${e.be.map((f) => `<line x1="${l(f)}" x2="${l(f)}" y1="10" y2="168" stroke="var(--mut)" stroke-dasharray="2 3"/>`).join("")}
<path d="${c(s)}" fill="none" stroke="var(--ac)" stroke-width="1.6" stroke-dasharray="5 3"/><path d="${c(o)}" fill="none" stroke="var(--tx)" stroke-width="2"/>
${t && t.x != null && t.pl != null ? `<circle cx="${l(t.x)}" cy="${d(t.pl)}" r="5" fill="#ffffff" stroke="var(--ac)" stroke-width="3"/>` : ""}
${m.map((f, x) => `<text x="${l(f)}" y="184" font-size="10" fill="var(--mut)" text-anchor="${x === 0 ? "start" : x === m.length - 1 ? "end" : "middle"}">${opN(f, 2)}</text>`).join("")}</svg>
<div class="sm mut" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:2px"><span><b style="color:var(--tx)">━</b> no vencimento</span><span><b style="color:var(--ac)">┅</b> hoje</span><span><b style="color:var(--ac)">┆</b> preço do ativo</span>${e.be.length ? "<span>┆ cinza = breakeven</span>" : ""}</div>`;
}
const OPSIM = {};
function opPainel(e, t) {
  const a = opResumo(e);
  if (!a) return "";
  const o = OPSIM[t] || { p: 0, d: 0, v: 0 },
    s = Math.max(0, a.dte),
    n = a.S * (1 + o.p / 100),
    r = diasMais(a.hoje, Math.min(o.d, s)),
    i = opValor(a.L, a.ivs, n, r, a.r, o.v / 100),
    l = a.gr,
    d = a.ivs.filter((m) => m != null),
    c = d.length
      ? Math.round((d.reduce((m, f) => m + f, 0) / d.length) * 100) + "%"
      : "–",
    p = !a.ilimG && !a.ilimP && a.mn < 0 && a.mx > 0 ? a.mx / -a.mn : null,
    u = (m, f, x) =>
      `<div class="ln"><span>${m}</span><b class="v ${x || ""}">${f}</b></div>`;
  return `<div class="idt opp" data-opid="${esc(t)}"><div class="ln" style="padding-top:0"><span>${a.net < 0 ? "Débito (você paga)" : "Crédito (você recebe)"}</span><b class="v ${a.net < 0 ? "r" : "g"}">${opM(Math.abs(a.net))}</b></div>
<div class="sm mut" style="margin:-4px 0 6px">${a.L.length} perna(s) · ${esc(opSub(e) || "ativo")} ${opN(a.S)} <span class="mut">(${a.sp ? a.sp.f : "pelo strike"})</span> · vence em ${a.dte} dia(s)</div>
<div class="opch">${opGrafico(a, { x: n, pl: i })}</div>
${u("Ganho máximo", a.ilimG ? "ilimitado" : opM(a.mx), "g")}${u("Perda máxima", a.ilimP ? "ilimitada" : opM(a.mn), "r")}${p != null ? u("Risco/Retorno", "1:" + f1v(p)) : ""}
${u("Breakeven", a.be.length ? a.be.map((m) => opN(m)).join(" · ") : "–")}<hr>
<div class="opg"><div><small>Delta</small><b class="mono">${opN(l.d, 0)}</b><i>ações equiv.</i></div><div><small>Theta</small><b class="mono ${cls(l.th)}">${opM(l.th)}</b><i>por dia</i></div><div><small>Vega</small><b class="mono">${opM(l.ve)}</b><i>por +1 pp de vol</i></div><div><small>Gama</small><b class="mono">${opN(l.g, 1)}</b><i>Δ por R$ 1</i></div></div>
<div class="sm mut" style="margin:4px 0 8px">Volatilidade implícita média ${c} (calculada pelos prêmios de entrada) · juro ${opN((Math.exp(a.r) - 1) * 100, 1)}% a.a.</div>
<div class="opsim"><b class="sm">Simulador "e se"</b>
<label>Preço do ativo: <b class="mono" data-oss="p">${o.p > 0 ? "+" : ""}${o.p}% · ${opN(n)}</b><input type="range" min="-30" max="30" step="1" value="${o.p}" data-osim="p"></label>
<label>Dias à frente: <b class="mono" data-oss="d">${Math.min(o.d, s)} de ${s}</b><input type="range" min="0" max="${s}" step="1" value="${Math.min(o.d, s)}" data-osim="d"></label>
<label>Volatilidade: <b class="mono" data-oss="v">${o.v > 0 ? "+" : ""}${o.v}%</b><input type="range" min="-50" max="100" step="5" value="${o.v}" data-osim="v"></label>
<div class="ln"><span>Resultado estimado</span><b class="v opres ${cls(i)}">${opM(i)}</b></div></div></div>`;
}
function opSimPinta(e) {
  const t = document.querySelector(`.opp[data-opid="${CSS.escape(e)}"]`);
  if (!t) return;
  const a = e === "__form" ? T : S.trades.find((u) => u.id === e);
  if (!a) return;
  const o = opResumo(a);
  if (!o) return;
  const s = OPSIM[e] || { p: 0, d: 0, v: 0 },
    n = Math.max(0, o.dte),
    r = Math.min(s.d, n),
    i = o.S * (1 + s.p / 100),
    l = opValor(o.L, o.ivs, i, diasMais(o.hoje, r), o.r, s.v / 100),
    d = t.querySelector(".opch");
  d && (d.innerHTML = opGrafico(o, { x: i, pl: l }));
  const c = (u, m) => {
    const f = t.querySelector(`[data-oss="${u}"]`);
    f && (f.textContent = m);
  };
  (c("p", (s.p > 0 ? "+" : "") + s.p + "% · " + opN(i)),
    c("d", r + " de " + n),
    c("v", (s.v > 0 ? "+" : "") + s.v + "%"));
  const p = t.querySelector(".opres");
  p && ((p.textContent = opM(l)), (p.className = "v opres " + cls(l)));
}
document.addEventListener("input", (e) => {
  const t = e.target.closest("[data-osim]");
  if (!t) return;
  const a = t.closest(".opp"),
    o = a && a.dataset.opid;
  o &&
    (((OPSIM[o] ?? (OPSIM[o] = { p: 0, d: 0, v: 0 }))[t.dataset.osim] =
      +t.value),
    opSimPinta(o));
});
const OP_MOD = {
  alta: ["Trava de alta", "Trava de alta"],
  baixa: ["Trava de baixa", "Trava de baixa"],
  cob: ["Venda coberta", "Venda coberta de call"],
  vput: ["Venda de put", "Venda de put"],
  strd: ["Straddle", "Straddle / strangle"],
  borb: ["Borboleta", "Borboleta / condor"],
};
function opProxVenc() {
  const e = loc().slice(0, 10);
  return ((typeof VENC < "u" && VENC.acoes) || []).find((t) => t >= e) || "";
}
function opModelo(e) {
  const t = opSpot(T),
    a = t ? t.v : numN(T.spot) || 0,
    o = a < 20 ? 0.5 : a < 60 ? 1 : a < 150 ? 2 : 5,
    s = a ? Math.round(a / o) * o : "",
    n = numN(T.qty) || 100,
    r = T.venc || opProxVenc(),
    i = (d) => (a ? +(s + d * o).toFixed(2) : ""),
    l =
      {
        alta: [
          ["C", "C", 0],
          ["C", "V", 2],
        ],
        baixa: [
          ["P", "C", 0],
          ["P", "V", -2],
        ],
        cob: [
          ["A", "C", 0],
          ["C", "V", 1],
        ],
        vput: [["P", "V", -1]],
        strd: [
          ["C", "C", 0],
          ["P", "C", 0],
        ],
        borb: [
          ["C", "C", -1],
          ["C", "V", 0, 2],
          ["C", "C", 1],
        ],
      }[e] || [];
  ((T.legs = l.map(([d, c, p, u], m) => ({
    id: "l" + Date.now().toString(36) + m,
    tp: d,
    lado: c,
    k: d === "A" ? "" : i(p),
    venc: d === "A" ? "" : r,
    pr: d === "A" && a ? a : "",
    q: n * (u || 1),
  }))),
    OP_MOD[e] && (T.estr = OP_MOD[e][1]));
}
function opLegsHtml() {
  const e = Array.isArray(T.legs) ? T.legs : [],
    t = opSpot(T),
    a = (
      i,
      l,
    ) => `<div class="opl"><div class="opl1"><button type="button" class="opll ${i.lado === "V" ? "v" : "c"}" data-lgl="${l}">${i.lado === "V" ? "Venda" : "Compra"}</button><select data-lg="${l}:tp"><option value="C"${i.tp === "C" ? " selected" : ""}>Call</option><option value="P"${i.tp === "P" ? " selected" : ""}>Put</option><option value="A"${i.tp === "A" ? " selected" : ""}>Ação</option></select><button type="button" class="x" data-lgx="${l}" aria-label="Remover perna">✕</button></div>
<div class="opl2">${i.tp === "A" ? "" : `<label>Strike<input type="number" step="any" inputmode="decimal" data-lg="${l}:k" value="${esc(i.k ?? "")}"></label><label>Vencimento<input type="date" data-lg="${l}:venc" value="${esc(i.venc || "")}"></label>`}<label>${i.tp === "A" ? "Preço" : "Prêmio"}<input type="number" step="any" inputmode="decimal" data-lg="${l}:pr" value="${esc(i.pr ?? "")}"></label><label>Qtd.<input type="number" step="1" inputmode="numeric" data-lg="${l}:q" value="${esc(i.q ?? "")}"></label></div></div>`,
    o = e.reduce(
      (i, l) =>
        i + (l.lado === "V" ? 1 : -1) * (numN(l.q) || 0) * (numN(l.pr) || 0),
      0,
    ),
    s = e
      .filter((i) => i.tp !== "A" && i.venc)
      .map((i) => i.venc)
      .sort()[0],
    n = opSub(T);
  let r = "";
  try {
    const i = (BAL.v && BAL.v.proximos) || [],
      l =
        n &&
        s &&
        i.find(
          (d) =>
            String(d.tk || "")
              .toUpperCase()
              .slice(0, 4) === n.slice(0, 4) &&
            d.d <= s &&
            d.d >= loc().slice(0, 10),
        );
    l &&
      (r = `<div class="warn sm" style="margin:8px 0">📑 ${esc(n)} divulga balanço em ${esc(fmtD(l.d))}, antes do vencimento: a volatilidade costuma cair depois do resultado e o preço pode dar salto.</div>`);
  } catch {}
  return `<div class="card" id="oplegs"><div class="top"><b>Pernas da estrutura</b><span class="sm mut">gráfico, gregas e simulador</span></div>
${n ? "" : '<div class="sm am" style="margin:4px 0">Informe o subjacente (ex.: PETR4) para o app usar o preço do ativo.</div>'}
<div class="sm mut" style="margin:4px 0 6px">Modelos${t ? ` (ativo a ${opN(t.v)})` : ""}:</div><div class="chips2">${Object.entries(
    OP_MOD,
  )
    .map(([i, [l]]) => `<button type="button" data-lgm="${i}">${l}</button>`)
    .join("")}<button type="button" data-lga="1">+ Perna</button></div>
${e.map(a).join("")}
${e.length ? `<div class="ln2"><span>${o < 0 ? "Débito (você paga)" : "Crédito (você recebe)"}</span><b class="mono ${o < 0 ? "r" : "g"}">${opM(Math.abs(o))}</b></div><button type="button" class="btn s" data-lgu="1" style="width:100%;margin-top:6px">Usar no trade (prêmio líquido, lado e quantidade)</button>` : ""}
${r}<div class="oppw">${e.length ? opPainel(T, "__form") : ""}</div></div>`;
}
function opLegsPinta(e) {
  const t = document.getElementById("oplegs");
  if (!t) return;
  if (e) {
    t.outerHTML = opLegsHtml();
    return;
  }
  const a = t.querySelector(".oppw");
  a && (a.innerHTML = (T.legs || []).length ? opPainel(T, "__form") : "");
  const o = t.querySelector(".ln2 b");
  if (o) {
    const s = (T.legs || []).reduce(
      (n, r) =>
        n + (r.lado === "V" ? 1 : -1) * (numN(r.q) || 0) * (numN(r.pr) || 0),
      0,
    );
    ((o.textContent = opM(Math.abs(s))),
      (o.className = "mono " + (s < 0 ? "r" : "g")),
      (o.previousElementSibling.textContent =
        s < 0 ? "Débito (você paga)" : "Crédito (você recebe)"));
  }
}
(document.addEventListener("input", (e) => {
  const t = e.target.closest("#sh [data-lg]");
  if (!t || !T) return;
  const [a, o] = t.dataset.lg.split(":"),
    s = (T.legs || [])[+a];
  if (s) {
    if (((s[o] = t.value), o === "tp")) {
      opLegsPinta(1);
      return;
    }
    (clearTimeout(opLegsPinta._t),
      (opLegsPinta._t = setTimeout(() => opLegsPinta(0), 150)));
  }
}),
  document.addEventListener("change", (e) => {
    e.target.closest('#sh [data-lg$=":tp"]') && opLegsPinta(1);
  }),
  document.addEventListener("click", (e) => {
    if (!T || !e.target.closest("#sh")) return;
    const t = e.target.closest(
      "[data-lgl],[data-lgx],[data-lgm],[data-lga],[data-lgu]",
    );
    if (t) {
      if (
        (e.preventDefault(),
        (T.legs = Array.isArray(T.legs) ? T.legs : []),
        t.dataset.lgl != null)
      ) {
        const a = T.legs[+t.dataset.lgl];
        a && (a.lado = a.lado === "V" ? "C" : "V");
      } else if (t.dataset.lgx != null) T.legs.splice(+t.dataset.lgx, 1);
      else if (t.dataset.lgm) opModelo(t.dataset.lgm);
      else if (t.dataset.lga) {
        const a = opSpot(T);
        T.legs.push({
          id: "l" + Date.now().toString(36),
          tp: "C",
          lado: "C",
          k: a ? +a.v.toFixed(2) : "",
          venc: T.venc || opProxVenc(),
          pr: "",
          q: numN(T.qty) || 100,
        });
      } else if (t.dataset.lgu) {
        const a = T.legs.filter((i) => numN(i.q) > 0),
          o = a.filter((i) => i.tp !== "A"),
          s = numN((o[0] || a[0] || {}).q) || 1,
          n = a.reduce(
            (i, l) =>
              i +
              (l.lado === "V" ? 1 : -1) * (numN(l.q) || 0) * (numN(l.pr) || 0),
            0,
          );
        ((T.entry = String(+(Math.abs(n) / s).toFixed(4))),
          (T.side = n < 0 ? "C" : "V"),
          (T.qty = String(s)));
        const r = o[0];
        (r &&
          (T.strike || (T.strike = String(r.k)),
          T.venc || (T.venc = r.venc),
          T.ot || (T.ot = r.tp)),
          showSheet());
        return;
      }
      opLegsPinta(1);
    }
  }));
{
  const e = sheet;
  sheet = function () {
    const t = e.apply(this, arguments);
    try {
      if (!T || QM || T.tipo !== "O") return t;
      const a =
          '<div class="mut sm">Em travas e estruturas, use o prêmio líquido: débito = Comprado, crédito = Lançado.</div>',
        o = opRolHtml();
      return t.includes(a)
        ? t.replace(a, o + opLegsHtml())
        : t.replace(
            '<label>Tipo de mercado<select name="mkt">',
            o + opLegsHtml() + '<label>Tipo de mercado<select name="mkt">',
          );
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
function opRolHtml() {
  const e = opSub(T),
    t = S.trades
      .filter(
        (a) =>
          a.id !== T.id && (a.tipo || "D") === "O" && (!e || opSub(a) === e),
      )
      .sort((a, o) => String(o.dt).localeCompare(String(a.dt)))
      .slice(0, 30);
  return !t.length && !T.rolDe
    ? ""
    : `<label>Esta operação é rolagem de<select name="rolDe"><option value="">— não é rolagem —</option>${t.map((a) => `<option value="${esc(a.id)}"${T.rolDe === a.id ? " selected" : ""}>${esc(a.ativo || "?")} · ${esc(fdt(a.dt))}${a.estr ? " · " + esc(a.estr) : ""}</option>`).join("")}</select></label>`;
}
document.addEventListener("change", (e) => {
  const t = e.target.closest('#sh select[name="rolDe"]');
  t && T && ((T.rolDe = t.value || void 0), t.value || delete T.rolDe);
});
function opCadeia(e) {
  const t = new Set([e.id]);
  let a = e,
    o = 0;
  for (; a && a.rolDe && o++ < 30; ) {
    const n = S.trades.find((r) => r.id === a.rolDe);
    if (!n || t.has(n.id)) break;
    (t.add(n.id), (a = n));
  }
  let s = 1;
  for (; s; )
    ((s = 0),
      S.trades.forEach((n) => {
        n.rolDe && t.has(n.rolDe) && !t.has(n.id) && (t.add(n.id), (s = 1));
      }));
  return S.trades
    .filter((n) => t.has(n.id))
    .sort((n, r) => String(n.dt).localeCompare(String(r.dt)));
}
function opAvisos(e) {
  const t = opResumo(e);
  if (!t || !isOpen(e)) return [];
  const a = [];
  return (
    t.dte <= 3 &&
      t.dte >= 0 &&
      a.push(
        `⏳ Vence ${t.dte === 0 ? "hoje" : "em " + t.dte + " dia(s)"} (${fmtD(t.v1)}).`,
      ),
    t.L.forEach((o) => {
      o.lado === "V" &&
        o.tp !== "A" &&
        o.venc === t.v1 &&
        (o.tp === "C" ? t.S > o.k : t.S < o.k) &&
        t.dte <= 7 &&
        a.push(
          `⚠ ${o.tp === "C" ? "Call" : "Put"} vendida no strike ${opN(o.k)} está dentro do dinheiro (ativo a ${opN(t.S)}): risco de exercício.`,
        );
    }),
    a
  );
}
{
  const e = fxHtml;
  fxHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = S.trades.find((i) => FX && i.id === FX.id);
      if (!a || (a.tipo || "D") !== "O") return t;
      const o = opPainel(a, a.id),
        s = opAvisos(a),
        n = opCadeia(a);
      let r =
        (s.length
          ? `<div class="warn sm" style="margin:10px 0">${s.map(esc).join("<br>")}</div>`
          : "") + (o ? `<h2>Estrutura</h2>${o}` : "");
      if (n.length > 1) {
        const i = n.reduce((l, d) => {
          const c = calc(d);
          return l + (c.pl || 0);
        }, 0);
        r += `<h2>Rolagens (${n.length} operações)</h2><div class="card">${n
          .map((l) => {
            const d = calc(l);
            return `<div class="sm" style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd)"><span>${esc(l.ativo)} · ${esc(fdt(l.dt))}</span><b class="${cls(d.pl)}">${d.pl == null ? "aberta" : mT(l, d.pl)}</b></div>`;
          })
          .join(
            "",
          )}<div style="display:flex;justify-content:space-between;margin-top:8px"><b>Total da operação</b><b class="${cls(i)} mono">${money(i)}</b></div></div>`;
      }
      return r
        ? t.replace(
            "<h2>Plano × execução</h2>",
            r + "<h2>Plano × execução</h2>",
          )
        : t;
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
{
  const e = card;
  card = function (t) {
    const a = e.apply(this, arguments);
    try {
      if ((t.tipo || "D") !== "O" || !isOpen(t)) return a;
      const o = opResumo(t);
      if (!o) return a;
      const s = opAvisos(t),
        n = `<div class="sm opln">θ <b class="${cls(o.gr.th)}">${opM(o.gr.th)}</b>/dia · Δ ${opN(o.gr.d, 0)} · vence em ${o.dte} d${t.rolDe ? " · rolagem" : ""}</div>${s.length ? `<div class="sm r opav">${s.map(esc).join("<br>")}</div>` : ""}`;
      return a.replace('<div class="tc-g">', n + '<div class="tc-g">');
    } catch {
      return a;
    }
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#opavh")) return;
      const a = S.trades
        .filter((n) => (n.tipo || "D") === "O" && isOpen(n))
        .flatMap((n) =>
          opAvisos(n).map((r) => esc(n.ativo || "") + ": " + esc(r)),
        );
      if (!a.length) return;
      const o = t.querySelector('section[data-hb="hero"]'),
        s = document.createElement("div");
      ((s.id = "opavh"),
        (s.className = "warn sm"),
        (s.style.margin = "8px 0"),
        (s.innerHTML = "<b>Opções</b><br>" + a.join("<br>")),
        (o || t.firstElementChild).after(s));
    } catch {}
  };
}
function opPush() {
  return S.trades
    .filter((e) => (e.tipo || "D") === "O" && isOpen(e))
    .flatMap((e) =>
      opPernas(e)
        .filter((t) => t.tp !== "A" && t.venc)
        .map((t) => ({
          id: String(e.id).slice(0, 40),
          a: String(e.ativo || "").slice(0, 12),
          sub: opSub(e).slice(0, 8),
          t: t.tp,
          k: +t.k || 0,
          v: t.venc,
          ven: t.lado === "V" ? 1 : 0,
        })),
    )
    .slice(0, 30);
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      t.opc = opPush();
    } catch {}
    return t;
  };
}
try {
  typeof NP < "u" &&
    NP.on &&
    NP.on.opc === void 0 &&
    ((NP.on.opc = !0), ls.set("diario-np", NP));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("opc", "⏳ Opções: vencimento e risco de exercício")}<div class="sm mut" style="margin-bottom:8px">Nos 3 dias antes do vencimento das suas opções abertas (10h) e quando uma opção vendida fica dentro do dinheiro.</div>`
    );
  };
}
function opCapital(e) {
  const t = opPernas(e),
    a = numN(e.qty) || 0,
    o = String(e.estr || "");
  if (t.length) {
    const s = t.find((r) => r.tp === "A" && r.lado === "C");
    if (s) return (s.pr || 0) * (s.q || 0);
    const n = t.filter((r) => r.tp === "P" && r.lado === "V");
    if (n.length) return n.reduce((r, i) => r + (i.k || 0) * (i.q || 0), 0);
  }
  return /coberta/i.test(o)
    ? (numN(e.spot) || 0) * a
    : /venda de put/i.test(o)
      ? (numN(e.strike) || 0) * a
      : 0;
}
function opRendaHtml() {
  const e = Math.exp(opR()) - 1,
    t = S.trades
      .filter((r) => (r.tipo || "D") === "O" && !isOpen(r) && r.dtx)
      .map((r) => ({ t: r, c: calc(r), cap: opCapital(r) }))
      .filter((r) => r.c.pl != null && r.cap > 0);
  if (!t.length)
    return '<div class="card" id="oprenda"><b>Renda com opções</b><div class="sm" style="margin-top:4px;color:var(--mut)">Registre vendas cobertas e vendas de put (estrutura no formulário, ou as pernas com a ação/put vendida) para ver aqui o rendimento sobre o capital comparado com o CDI.</div></div>';
  const a = {};
  t.forEach((r) => {
    const i = String(r.t.dtx).slice(0, 7),
      l = Math.max(1, opDias(r.t.dt, String(r.t.dtx).slice(0, 10)));
    a[i] ?? (a[i] = { pl: 0, cap: 0, cdi: 0, n: 0, d: 0 });
    const d = a[i];
    ((d.pl += emBRL(r.c.pl, moedaT(r.t))),
      (d.cap += r.cap),
      (d.cdi += r.cap * (Math.pow(1 + e, l / 365) - 1)),
      d.n++,
      (d.d += l));
  });
  const o = Object.keys(a).sort().reverse().slice(0, 6),
    s = o.reduce((r, i) => ({ pl: r.pl + a[i].pl, cdi: r.cdi + a[i].cdi }), {
      pl: 0,
      cdi: 0,
    }),
    n = (r) => (r * 100).toFixed(2).replace(".", ",") + "%";
  return `<div class="card" id="oprenda"><div class="top"><b>Renda com opções</b><span class="sm mut">vs CDI ${n(e)} a.a.</span></div>
<div class="kv" style="margin-top:6px">${KV("Resultado (6 meses)", money(s.pl), cls(s.pl))}${KV("O CDI teria rendido", money(s.cdi))}${KV("Diferença", money(s.pl - s.cdi), cls(s.pl - s.cdi))}</div>
<table class="sm" style="width:100%;margin-top:8px;border-collapse:collapse"><tr class="mut"><td>Mês</td><td style="text-align:right">Result.</td><td style="text-align:right">% capital</td><td style="text-align:right">CDI</td></tr>${o
    .map((r) => {
      const i = a[r];
      return `<tr><td>${r.slice(5)}/${r.slice(2, 4)}</td><td style="text-align:right;white-space:nowrap" class="${cls(i.pl)}">${money(i.pl)}</td><td style="text-align:right">${n(i.pl / i.cap)}</td><td style="text-align:right" class="mut">${n(i.cdi / i.cap)}</td></tr>`;
    })
    .join("")}</table>
<div class="sm" style="margin-top:6px;color:var(--mut)">Capital: valor da ação na venda coberta e strike × quantidade na venda de put. CDI no mesmo número de dias de cada operação.</div></div>`;
}
function opEntrada(e) {
  const t = opPernas(e);
  if (!t.length) return {};
  const a = numN(e.spot),
    o = String(e.dt || "").slice(0, 10),
    s = t.filter((l) => l.tp !== "A"),
    n = s.map((l) => l.venc).sort()[0],
    r = n ? opDias(o, n) : null;
  let i = null;
  if (a > 0 && s[0]) {
    const l = opIVs(e, [s[0]]),
      d = Math.max(1, r || 1) / 365;
    i = Math.abs(OPM.gregas(a, s[0].k, d, opR(), l[0] || 0.35, s[0].tp).d);
  }
  return { dte: r, dl: i };
}
function opStatsHtml() {
  const e = S.trades
    .filter((i) => (i.tipo || "D") === "O" && !isOpen(i))
    .map((i) => ({ ...i, c: calc(i), _e: opEntrada(i) }))
    .filter((i) => i.c.pl != null);
  if (!e.length) return "";
  const t = (i) => (i == null ? "–" : (i > 0 ? "+" : "") + money(i)),
    a = (i) =>
      i.estr ||
      (Array.isArray(i.legs) && i.legs.length > 1
        ? i.legs.length + " pernas"
        : "Opção simples"),
    o = (i) => {
      const l = i._e.dte;
      return l == null
        ? "—"
        : l <= 7
          ? "0 a 7 dias"
          : l <= 21
            ? "8 a 21 dias"
            : l <= 45
              ? "22 a 45 dias"
              : "46+ dias";
    },
    s = (i) => {
      const l = i._e.dl;
      return l == null
        ? "—"
        : l < 0.3
          ? "Delta até 0,30 (fora do dinheiro)"
          : l <= 0.6
            ? "Delta 0,30 a 0,60 (no dinheiro)"
            : "Delta acima de 0,60 (dentro)";
    },
    n = e.filter(
      (i) => i.side === "V" && numN(i.entry) > 0 && numN(i.exit) != null,
    ),
    r = n.length
      ? n.reduce(
          (i, l) => i + (numN(l.entry) - numN(l.exit)) / numN(l.entry),
          0,
        ) / n.length
      : null;
  return `<h2>Opções: por estrutura</h2>${stTbl("Estrutura", agrupa(e, a), t)}<h2>Por dias até o vencimento na entrada</h2>${stTbl("DTE", agrupa(e, o, ["0 a 7 dias", "8 a 21 dias", "22 a 45 dias", "46+ dias", "—"]), t)}<h2>Por delta na entrada</h2>${stTbl("Delta", agrupa(e, s), t)}${r != null ? `<div class="kv" style="margin-top:8px">${KV("Prêmio capturado (vendas)", Math.round(r * 100) + "%", r >= 0.5 ? "g" : "", "média do prêmio recebido que ficou com você · " + n.length + " operação(ões)")}</div>` : ""}<div class="sm mut" style="margin:6px 2px">O delta usa o preço do ativo na entrada (campo "Subjacente na entrada") e a volatilidade tirada do próprio prêmio.</div>`;
}
{
  const e = vTrades;
  vTrades = function (t) {
    const a = e.apply(this, arguments);
    try {
      return t !== "O" ? a : XV.O === "an" ? a + opStatsHtml() : a;
    } catch {
      return a;
    }
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "opc" || XV.O === "an") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#oprenda")) return;
      setTimeout(() => {
        try {
          if (tab !== "opc" || XV.O === "an" || t.querySelector("#oprenda"))
            return;
          const a = [...t.querySelectorAll(".card")].find((r) =>
              /^Capital \xb7/.test((r.textContent || "").trim()),
            ),
            o = t.querySelector("h1"),
            s =
              a ||
              (o && o.parentElement && o.parentElement !== t
                ? o.parentElement
                : o) ||
              t.firstElementChild,
            n = document.createElement("div");
          ((n.innerHTML = opRendaHtml()), s.after(n.firstElementChild));
        } catch {}
      }, 0);
    } catch {}
  };
}
const OPG = {
  rows: null,
  ts: 0,
  busy: 0,
  err: "",
  a: (() => {
    try {
      return ls.get("diario-opg-a") || "";
    } catch {
      return "";
    }
  })(),
  m: "",
};
try {
  const e = HUB_M.findIndex((a) => a[0] === "mercado:saz");
  HUB_M.some((a) => a[0] === "mercado:opc") ||
    HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, ["mercado:opc", "Opções"]);
  const t = MGRP.find((a) => a[0] === "Ações");
  t && !t[1].includes("mercado:opc") && t[1].push("mercado:opc");
} catch {}
async function opgCarrega(e) {
  if (!(OPG.busy || (!e && Date.now() - OPG.ts < 55e3))) {
    if (!cfg() || typeof SESS > "u" || !SESS) {
      ((OPG.err =
        "Entre na sua conta (Ferramentas → Conta) para ver a grade que a ponte manda."),
        opgPinta());
      return;
    }
    OPG.busy = 1;
    try {
      const t = await rq(
        "/rest/v1/opcoes_grade?select=ativo,spot,series,updated_at&user_id=eq." +
          SESS.uid,
      );
      ((OPG.rows = await t.json()), (OPG.err = ""), opgHist());
    } catch (t) {
      OPG.err =
        t.status === 404
          ? "A tabela de opções ainda não existe: rode o arquivo opcoes.sql no Supabase e atualize a ponte do Profit."
          : String(t.message || t);
    }
    ((OPG.ts = Date.now()), (OPG.busy = 0), opgPinta());
  }
}
function opgPinta() {
  const e = document.getElementById("opgbox");
  e && (e.outerHTML = opgHtml());
}
function opgVenc(e, t) {
  const a = (e.series || []).find((o) => o.m === t && o.v);
  return a ? a.v : opVencMes(t);
}
const opgIVp = (e) => {
  if (((e = +e), !(e > 0))) return null;
  const t = e > 3 ? e / 100 : e;
  return t > 0.02 && t < 3 ? t : null;
};
function opgSeries(e, t) {
  const a = +e.spot,
    o = opR(),
    s = {},
    n = loc().slice(0, 10);
  return (
    (e.series || [])
      .filter((r) => r.m === t)
      .forEach((r) => {
        const i = r.t + "|" + r.k,
          l =
            (r.n ? 4 : 0) +
            (r.b > 0 && r.a > 0 ? 2 : 0) +
            (r.u ? 1 : 0) +
            (r.oi || 0) / 1e9;
        (!s[i] || l > s[i]._sc) && (s[i] = { ...r, _sc: l });
      }),
    Object.values(s).map((r) => {
      const i = Math.max(0.5, opDias(n, r.v || opVencMes(t))) / 365,
        l = r.b > 0 && r.a > 0 && r.a >= r.b ? (r.b + r.a) / 2 : null,
        d = r.n > 0,
        c = l || r.u || r.f || null,
        p = Math.max(0, r.t === "C" ? a - r.k : r.k - a),
        u = c != null && c >= p * 0.98,
        m = !!(l || d),
        f = opgIVp(r.ivp),
        x = u && m ? OPM.iv(c, a, r.k, i, o, r.t) : null;
      return {
        ...r,
        p: c,
        lq: m,
        velho: !m,
        iv: f || x,
        ivf: f ? "Profit" : x ? "calc" : "",
      };
    })
  );
}
function opgLimpa(e) {
  const t = e.map((a) => a.iv);
  return e.filter((a, o) => {
    const s = t
      .slice(Math.max(0, o - 3), o)
      .concat(t.slice(o + 1, o + 4))
      .filter(Boolean)
      .sort((r, i) => r - i);
    if (s.length < 2) return !0;
    const n = s[Math.floor(s.length / 2)];
    return a.iv < n * 1.5 && a.iv > n / 1.5;
  });
}
function opgAtmIV(e, t) {
  const a = +e.spot,
    o = opgSeries(e, t).filter(
      (r) => r.iv && r.lq && Math.abs(r.k - a) / a < 0.06,
    );
  if (!o.length) return null;
  const s = o.reduce(
      (r, i) => (Math.abs(i.k - a) < Math.abs(r - a) ? i.k : r),
      o[0].k,
    ),
    n = o.filter((r) => Math.abs(r.k - s) < 1e-6).map((r) => r.iv);
  return n.reduce((r, i) => r + i, 0) / n.length;
}
function opgHist() {
  try {
    const e = loc().slice(0, 10);
    let t = 0;
    ((OPG.rows || []).forEach((a) => {
      var o, s;
      const n = [...new Set((a.series || []).map((d) => d.m))].sort(),
        r = n.find((d) => opDias(e, opgVenc(a, d)) >= 7) || n[0];
      if (!r) return;
      const i = opgAtmIV(a, r);
      if (!i) return;
      const l = (o = S.ivh ?? (S.ivh = {}))[(s = a.ativo)] ?? (o[s] = {});
      if (l[e] !== +i.toFixed(4)) {
        l[e] = +i.toFixed(4);
        const d = Object.keys(l).sort();
        (d.slice(0, Math.max(0, d.length - 260)).forEach((c) => delete l[c]),
          (t = 1));
      }
    }),
      t && save());
  } catch {}
}
function opgRank(e) {
  const t = (S.ivh || {})[e] || {},
    a = Object.values(t);
  if (a.length < 20) return { n: a.length };
  const o = t[Object.keys(t).sort().pop()],
    s = Math.min(...a),
    n = Math.max(...a);
  return {
    n: a.length,
    rank: n > s ? (o - s) / (n - s) : null,
    pct: a.filter((r) => r < o).length / a.length,
  };
}
function opgSorriso(e, t) {
  const a = (x) =>
      opgLimpa(
        e
          .filter(
            (v) => v.t === x && v.iv && v.lq && Math.abs(v.k - t) / t <= 0.15,
          )
          .sort((v, g) => v.k - g.k),
      ),
    o = a("C"),
    s = a("P"),
    n = o.concat(s);
  if (n.length < 3) return "";
  const r = 340,
    i = 150,
    l = Math.min(...n.map((x) => x.k)),
    d = Math.max(...n.map((x) => x.k)),
    c = Math.min(...n.map((x) => x.iv)) * 0.9,
    p = Math.max(...n.map((x) => x.iv)) * 1.05,
    u = (x) => 8 + ((x - l) / (d - l || 1)) * (r - 16),
    m = (x) => 8 + ((p - x) / (p - c || 1)) * (i - 28),
    f = (x) =>
      x
        .map(
          (v, g) =>
            (g ? "L" : "M") + u(v.k).toFixed(1) + " " + m(v.iv).toFixed(1),
        )
        .join("");
  return `<svg viewBox="0 0 ${r} ${i}" style="width:100%;height:auto" role="img" aria-label="Sorriso de volatilidade"><line x1="${u(t)}" x2="${u(t)}" y1="6" y2="${i - 20}" stroke="var(--ac)" stroke-dasharray="4 3"/><path d="${f(o)}" fill="none" stroke="var(--g)" stroke-width="2"/><path d="${f(s)}" fill="none" stroke="var(--r)" stroke-width="2"/>
${[
  [l, "start"],
  [(l + d) / 2, "middle"],
  [d, "end"],
]
  .map(
    ([x, v]) =>
      `<text x="${u(x)}" y="${i - 5}" font-size="10" fill="var(--mut)" text-anchor="${v}">${opN(x)}</text>`,
  )
  .join(
    "",
  )}<text x="${r - 8}" y="16" font-size="10" fill="var(--mut)" text-anchor="end">${Math.round(p * 100)}%</text><text x="${r - 8}" y="${i - 24}" font-size="10" fill="var(--mut)" text-anchor="end">${Math.round(c * 100)}%</text></svg>
<div class="sm mut"><b class="g">━</b> calls · <b class="r">━</b> puts · <b style="color:var(--ac)">┆</b> preço do ativo</div>`;
}
function opgHtml() {
  const e = OPG.rows || [];
  if (!e.length)
    return `<div class="card" id="opgbox"><b>Opções</b><div class="sm" style="margin-top:4px;color:var(${OPG.err ? "--am" : "--mut"})">${esc(OPG.err || (OPG.busy || !OPG.ts ? "Carregando…" : "Nenhuma grade ainda. Com a ponte do Profit rodando, as opções de PETR4, VALE3, BOVA11, ITUB4 e BBAS3 aparecem aqui assim que ela terminar de procurar as séries (uns 6 minutos na primeira vez do dia). A tela atualiza sozinha a cada minuto."))}</div><div class="sm" style="margin-top:6px;color:var(--mut)">Atualizado: ${OPG.ts ? new Date(OPG.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "–"}</div></div>`;
  const t = e.find((b) => b.ativo === OPG.a) ? OPG.a : e[0].ativo,
    a = e.find((b) => b.ativo === t),
    o = [...new Set((a.series || []).map((b) => b.m))].sort(),
    s = o.includes(OPG.m)
      ? OPG.m
      : o.find((b) => opDias(loc().slice(0, 10), opgVenc(a, b)) >= 3) || o[0],
    n = s ? opgSeries(a, s) : [],
    r = +a.spot,
    i = [...new Set(n.map((b) => b.k))],
    l = [...new Set(n.filter((b) => b.lq).map((b) => b.k))],
    d = (OPG.todas || !l.length ? i : l).sort((b, y) => b - y),
    c = d.reduce(
      (b, y) => (b == null || Math.abs(y - r) < Math.abs(b - r) ? y : b),
      null,
    ),
    p = s ? opgAtmIV(a, s) : null,
    u = opgRank(t),
    m = n.some((b) => b.ke),
    f = n.some((b) => b.oi != null),
    x = (b, y) =>
      b
        ? `<td class="opgc${(y === "C" ? b.k < r : b.k > r) ? " itm" : ""}${b.velho ? " velho" : ""}" data-opnovo="${esc(b.c)}"><b class="mono">${b.p != null ? opN(b.p) : "–"}</b><small>${b.iv ? Math.round(b.iv * 100) + "%" : b.velho && b.p != null ? "sem negócio hoje" : ""}${f && b.oi != null ? " · " + Math.round(b.oi).toLocaleString("pt-BR") : ""}</small></td>`
        : "<td></td>",
    v = n.some((b) => b.ivf === "Profit") ? "do Profit" : "calculada pelo app",
    g = a.updated_at ? new Date(a.updated_at) : null,
    h = g && Date.now() - g > 10 * 6e4;
  return `<div class="card" id="opgbox"><div class="top"><b>Opções de ${esc(t)}</b><span class="sm ${h ? "am" : "mut"}">${g ? "atualizado " + g.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}</span></div>
<div class="hub2" style="margin:8px 0 6px">${e.map((b) => `<button class="${b.ativo === t ? "on" : ""}" data-opga="${esc(b.ativo)}">${esc(b.ativo)}</button>`).join("")}</div>
<div class="hub2" style="margin:0 0 8px">${o.map((b) => `<button class="${b === s ? "on" : ""}" data-opgm="${b}">vence ${esc(fmtD(opgVenc(a, b)).slice(0, 5))}</button>`).join("")}</div>
<div class="kv">${KV("Ativo", opN(r))}${KV("Vol. implícita (ATM)", p ? Math.round(p * 100) + "%" : "–")}${KV("IV Rank", u.rank != null ? Math.round(u.rank * 100) + "%" : "coletando", u.rank != null ? (u.rank > 0.7 ? "r" : u.rank < 0.3 ? "g" : "") : "", u.rank != null ? (u.rank > 0.7 ? "vol cara: favorece vender" : u.rank < 0.3 ? "vol barata: favorece comprar" : "vol na média") + " · " + u.n + " dias" : u.n + " de 20 dias de histórico")}${KV("Vence em", s ? opDias(loc().slice(0, 10), opgVenc(a, s)) + " dias" : "–")}</div>
${opgSorriso(n, r)}
<div style="overflow-x:auto;margin-top:8px"><table class="opgt"><tr><th>Call</th><th>Strike</th><th>Put</th></tr>${d
    .map(
      (b) =>
        `<tr class="${b === c ? "atm" : ""}">${x(
          n.find((y) => y.t === "C" && y.k === b),
          "C",
        )}<td class="opgk mono">${opN(b)}</td>${x(
          n.find((y) => y.t === "P" && y.k === b),
          "P",
        )}</tr>`,
    )
    .join("")}</table></div>
${i.length > l.length && l.length ? `<button class="btn s" data-opgt="1" style="width:100%;margin-top:8px">${OPG.todas ? "Mostrar só as séries negociadas hoje" : "Mostrar todas as séries (" + i.length + " strikes, inclusive as sem negócio hoje)"}</button>` : ""}
<div class="sm mut" style="margin-top:6px">Preço = meio entre compra e venda (ou o último negócio de hoje). Abaixo do preço, a volatilidade implícita (${v})${f ? " e os contratos em aberto" : ""}. Séries sem negócio hoje ficam apagadas e fora do gráfico, porque o preço delas é velho. Fundo destacado = dentro do dinheiro. Toque numa opção para montar um trade com ela.${m ? " Alguns strikes estão estimados pelo código da série (o RTD não mandou o campo PEX): podem diferir alguns centavos depois de ajuste por dividendo." : ""}</div></div>`;
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "opc"
      ? e.apply(this, arguments)
      : (setTimeout(() => opgCarrega(!1), 0), opgHtml());
  };
}
(setInterval(() => {
  try {
    tab === "mercado" &&
      MKT.tab === "opc" &&
      !document.hidden &&
      opgCarrega(!1);
  } catch {}
}, 6e4),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-opga]"),
      a = e.target.closest("[data-opgm]"),
      o = e.target.closest("[data-opnovo]");
    if (t) {
      ((OPG.a = t.dataset.opga), (OPG.m = ""));
      try {
        ls.set("diario-opg-a", OPG.a);
      } catch {}
      opgPinta();
      return;
    }
    if (a) {
      ((OPG.m = a.dataset.opgm), opgPinta());
      return;
    }
    if (e.target.closest("[data-opgt]")) {
      ((OPG.todas = !OPG.todas), opgPinta());
      return;
    }
    if (o) {
      const s = (OPG.rows || []).find((i) =>
        (i.series || []).some((l) => l.c === o.dataset.opnovo),
      );
      if (!s) return;
      const n = opgSeries(
        s,
        (s.series.find((i) => i.c === o.dataset.opnovo) || {}).m,
      ).find((i) => i.c === o.dataset.opnovo);
      if (!n) return;
      ((AUTO = 0), (isNew = 1), (QM = 0));
      const r = n.v || opVencMes(n.m);
      ((T = {
        id: Date.now().toString(36),
        tipo: "O",
        dt: loc().slice(0, 16),
        ativo: n.c,
        sub: s.ativo,
        side: "C",
        ot: n.t,
        strike: String(n.k),
        venc: r,
        spot: String(s.spot),
        entry: n.p != null ? String(+n.p.toFixed(2)) : "",
        stop: "",
        target: "",
        exit: "",
        qty: "100",
        pv: "1",
        rules: "",
        err: "Nenhum",
        legs: [
          {
            id: "l0",
            tp: n.t,
            lado: "C",
            k: n.k,
            venc: r,
            pr: n.p != null ? +n.p.toFixed(2) : "",
            q: 100,
          },
        ],
      }),
        (orig = {}),
        showSheet());
    }
  }),
  (function () {
    const e = TraderStyles.slot("legacy-034");
    ((e.textContent = TraderStyles.css("legacy-034")), TraderStyles.mount(e));
  })());
const GXV = {
    vw: (() => {
      try {
        return ls.get("diario-opg-vw") || "grade";
      } catch {
        return "grade";
      }
    })(),
    vm: "prox",
    fx: 0.2,
  },
  gxBig = (e) => {
    if (e == null || !isFinite(e)) return "–";
    const t = Math.abs(e),
      a = e < 0 ? "-" : "";
    return t >= 1e9
      ? a + "R$ " + (t / 1e9).toFixed(2).replace(".", ",") + " bi"
      : t >= 1e6
        ? a + "R$ " + (t / 1e6).toFixed(1).replace(".", ",") + " mi"
        : t >= 1e3
          ? a + "R$ " + (t / 1e3).toFixed(0) + " mil"
          : a + "R$ " + Math.round(t);
  };
function gxCalc(e) {
  const t = +e.spot;
  if (!(t > 0)) return null;
  const a = loc().slice(0, 10),
    o = opR(),
    s = [...new Set((e.series || []).map((A) => A.m))].sort(),
    n = s.find((A) => opDias(a, opgVenc(e, A)) >= 1) || s[0],
    r = GXV.vm === "prox" ? [n] : s,
    i = [];
  if (
    (r.forEach((A) => {
      if (!A) return;
      const C = opgAtmIV(e, A) || 0.3;
      opgSeries(e, A).forEach((I) => {
        I.oi > 0 &&
          I.k > 0 &&
          i.push({
            k: I.k,
            t: I.t,
            oi: +I.oi,
            iv: I.iv || C,
            T: Math.max(0.5, opDias(a, I.v || opgVenc(e, A))) / 365,
            m: A,
          });
      });
    }),
    !i.length)
  )
    return { S: t, vazio: 1, m0: n };
  const l = GXV.fx,
    d = 120,
    c = [...Array(d + 1)].map((A, C) => t * (1 - l) + (t * 2 * l * C) / d),
    p = (A) => {
      let C = 0,
        I = 0;
      for (const J of i) {
        const se = OPM.gregas(A, J.k, J.T, o, J.iv, J.t);
        ((C += J.oi * se.d * A),
          (I += (J.t === "C" ? 1 : -1) * J.oi * se.g * A * A * 0.01));
      }
      return { d: C, g: I };
    },
    u = c.map(p),
    m = u.map((A) => A.d),
    f = u.map((A) => A.g),
    x = p(t),
    v = (A) => {
      let C = null;
      for (let I = 1; I < A.length; I++) {
        const J = A[I - 1],
          se = A[I];
        if ((J < 0 && se >= 0) || (J > 0 && se <= 0)) {
          const Ie =
            c[I - 1] +
            ((c[I] - c[I - 1]) * Math.abs(J)) / (Math.abs(J) + Math.abs(se));
          (C == null || Math.abs(Ie - t) < Math.abs(C - t)) && (C = Ie);
        }
      }
      return C;
    },
    g = {};
  i.forEach((A) => {
    const C = +A.k.toFixed(2);
    (g[C] ?? (g[C] = { c: 0, p: 0 }), (g[C][A.t === "C" ? "c" : "p"] += A.oi));
  });
  const h = Object.keys(g)
      .map(Number)
      .sort((A, C) => A - C),
    b = h.reduce((A, C) => (g[C].c > (g[A] || { c: -1 }).c ? C : A), h[0]),
    y = h.reduce((A, C) => (g[C].p > (g[A] || { p: -1 }).p ? C : A), h[0]),
    j = i.filter((A) => A.m === n),
    k = h.reduce((A, C) => {
      const I = j.reduce(
        (J, se) =>
          J +
          se.oi *
            (se.t === "C" ? Math.max(0, C - se.k) : Math.max(0, se.k - C)),
        0,
      );
      return !A || I < A.v ? { K: C, v: I } : A;
    }, null);
  return {
    S: t,
    xs: c,
    dex: m,
    gex: f,
    dexS: x.d,
    gexS: x.g,
    flipG: v(f),
    flipD: v(m),
    por: g,
    ks: h,
    cw: b,
    pw: y,
    dor: k && k.K,
    n: i.length,
    m0: n,
    ms: s,
  };
}
function gxGraf(e, t, a) {
  const o = e.xs;
  let s = Math.min(0, ...t),
    n = Math.max(0, ...t);
  n - s <= 0 && ((n = 1), (s = -1));
  const r = (u) => 4 + ((u - o[0]) / (o[o.length - 1] - o[0])) * 332,
    i = (u) => 8 + ((n - u) / (n - s)) * 142,
    l = i(0),
    d =
      `M${r(o[0])} ${l}` +
      t
        .map((u, m) => "L" + r(o[m]).toFixed(1) + " " + i(u).toFixed(1))
        .join("") +
      `L${r(o[o.length - 1])} ${l}Z`,
    c = "gx" + a,
    p = a === "g" ? e.flipG : e.flipD;
  return `<svg viewBox="0 0 340 170" style="width:100%;height:auto;display:block" role="img" aria-label="Perfil ${a === "g" ? "GEX" : "DEX"}"><defs><clipPath id="${c}a"><rect x="0" y="0" width="340" height="${l}"/></clipPath><clipPath id="${c}b"><rect x="0" y="${l}" width="340" height="170"/></clipPath></defs>
<path d="${d}" fill="var(--g)" opacity=".22" clip-path="url(#${c}a)"/><path d="${d}" fill="var(--r)" opacity=".22" clip-path="url(#${c}b)"/><line x1="4" x2="336" y1="${l}" y2="${l}" stroke="var(--bd2)"/>
<path d="${t.map((u, m) => (m ? "L" : "M") + r(o[m]).toFixed(1) + " " + i(u).toFixed(1)).join("")}" fill="none" stroke="var(--tx)" stroke-width="1.8"/>
<line x1="${r(e.S)}" x2="${r(e.S)}" y1="8" y2="150" stroke="var(--ac)" stroke-dasharray="4 3"/><text x="${r(e.S) + 3}" y="17" font-size="9.5" fill="var(--ac)">spot ${opN(e.S)}</text>
${p != null ? `<line x1="${r(p)}" x2="${r(p)}" y1="8" y2="150" stroke="var(--am)" stroke-dasharray="2 3"/><text x="${r(p) + 3}" y="29" font-size="9.5" fill="var(--am)">flip ${opN(p)}</text>` : ""}
<text x="336" y="16" font-size="9" fill="var(--mut)" text-anchor="end">${gxBig(n)}</text><text x="336" y="147" font-size="9" fill="var(--mut)" text-anchor="end">${gxBig(s)}</text>
${[
  [o[0], "start"],
  [e.S, "middle"],
  [o[o.length - 1], "end"],
]
  .map(
    ([u, m]) =>
      `<text x="${r(u)}" y="165" font-size="9.5" fill="var(--mut)" text-anchor="${m}">${opN(u)}</text>`,
  )
  .join("")}</svg>`;
}
function gxBarras(e) {
  const t = e.ks.filter((o) => Math.abs(o - e.S) / e.S <= GXV.fx);
  if (!t.length) return "";
  const a = Math.max(...t.map((o) => Math.max(e.por[o].c, e.por[o].p)), 1);
  return `<div class="gxb">${t.map((o) => `<div class="gxr${Math.abs(o - e.S) === Math.min(...t.map((s) => Math.abs(s - e.S))) ? " atm" : ""}"><span class="gxk mono">${opN(o)}</span><span class="gxp"><i style="width:${(e.por[o].p / a) * 100}%"></i></span><span class="gxc"><i style="width:${(e.por[o].c / a) * 100}%"></i></span></div>`).join("")}</div>
<div class="sm mut" style="display:flex;justify-content:space-between;margin-top:2px"><span><b class="r">■</b> puts em aberto</span><span>calls em aberto <b class="g">■</b></span></div>`;
}
function gxHtml(e) {
  const t = gxCalc(e);
  if (!t) return '<div class="sm mut">Sem preço do ativo.</div>';
  if (t.vazio)
    return `<div class="warn sm" style="margin-top:8px">A ponte ainda não mandou os contratos em aberto (campo CAB do RTD) para ${esc(e.ativo)}. Com a ponte nova rodando no pregão, eles chegam junto com a grade.</div>`;
  const a = t.dexS >= 0,
    o = t.gexS >= 0,
    s = [
      [
        1,
        1,
        "Viés altista com mercado mais estável: os formadores tendem a vender nas altas e comprar nas quedas, amortecendo os movimentos.",
      ],
      [
        1,
        0,
        "Viés altista com possibilidade de aceleração e mais instabilidade: os formadores tendem a comprar quando sobe e vender quando cai.",
      ],
      [
        0,
        1,
        "Viés baixista/defensivo, porém com mais amortecimento: quedas tendem a ser freadas perto das paredes de put.",
      ],
      [
        0,
        0,
        "Viés baixista/defensivo com possibilidade de movimentos amplificados: quedas podem acelerar.",
      ],
    ],
    n = s.find((i) => !!i[0] === a && !!i[1] === o),
    r = (i, l, d) =>
      `<button class="${i ? "on" : ""}" data-gx="${l}" data-v="${d}">${esc(d === "prox" ? "Próximo vencimento" : d === "todos" ? "Todos os vencimentos" : "±" + Math.round(d * 100) + "%")}</button>`;
  return `<div class="hub2" style="margin:8px 0 4px">${r(GXV.vm === "prox", "vm", "prox")}${r(GXV.vm === "todos", "vm", "todos")}</div><div class="hub2" style="margin:0 0 8px">${[0.1, 0.2, 0.3].map((i) => r(GXV.fx === i, "fx", i)).join("")}</div>
<div class="kv">${KV("DEX líquido", gxBig(t.dexS), t.dexS >= 0 ? "g" : "r", t.dexS >= 0 ? "positivo" : "negativo")}${KV("GEX líquido (por 1%)", gxBig(t.gexS), t.gexS >= 0 ? "g" : "r", t.gexS >= 0 ? "positivo" : "negativo")}${KV("Flip do gama", t.flipG != null ? opN(t.flipG) : "–", "", t.flipG != null ? (t.S > t.flipG ? "preço acima do flip" : "preço abaixo do flip") : "sem cruzamento na faixa")}${KV("Máxima dor", t.dor != null ? opN(t.dor) : "–", "", "vencimento " + esc(fmtD(opgVenc(e, t.m0)).slice(0, 5)))}${KV("Parede de call", opN(t.cw), "g", "mais calls em aberto")}${KV("Parede de put", opN(t.pw), "r", "mais puts em aberto")}</div>
<h2>Mapa de interpretação</h2><table class="gxm"><tr><th>DEX</th><th>GEX</th><th>Leitura</th></tr>${s.map((i) => `<tr class="${i === n ? "cur" : ""}"><td class="${i[0] ? "g" : "r"}">${i[0] ? "Positivo" : "Negativo"}</td><td class="${i[1] ? "g" : "r"}">${i[1] ? "Positivo" : "Negativo"}</td><td>${i[2]}${i === n ? ' <b class="gxsa">situação atual</b>' : ""}</td></tr>`).join("")}</table>
<h2>Perfil do GEX · gama</h2><div class="card">${gxGraf(t, t.gex, "g")}<div class="sm" style="margin-top:4px;color:var(--mut)">Quanto os formadores precisariam comprar (+) ou vender (−) a cada 1% de movimento, se o preço estivesse em cada ponto. Acima do flip o gama é positivo (mercado mais amortecido); abaixo, negativo (movimentos amplificados).</div></div>
<h2>Perfil do DEX · delta</h2><div class="card">${gxGraf(t, t.dex, "d")}<div class="sm" style="margin-top:4px;color:var(--mut)">Exposição a delta em R$ das opções em aberto para cada preço. Positivo: predominam posições que ganham com alta; negativo: com queda.</div></div>
<h2>Contratos em aberto por strike</h2><div class="card">${gxBarras(t)}</div>
<div class="sm mut" style="margin:8px 2px 0">${t.n} séries com contratos em aberto. Convenção usada: os formadores de mercado estão do lado oposto (vendidos nas calls e comprados nas puts do público). No Brasil, muita pessoa física vende call coberta, então em alguns ativos o sinal pode estar invertido: use como leitura de apoio, não como sinal de entrada. Contratos em aberto são do pregão anterior (a B3 apura uma vez por dia).</div>`;
}
{
  const e = opgHtml;
  opgHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = OPG.rows || [];
      if (!a.length) return t;
      const o = a.find((i) => i.ativo === OPG.a) ? OPG.a : a[0].ativo,
        s = a.find((i) => i.ativo === o),
        n = `<div class="seg" style="margin:8px 0 4px;display:grid;grid-template-columns:1fr 1fr 1fr"><button class="${GXV.vw === "grade" || !GXV.vw ? "on" : ""}" data-gxv="grade">Grade</button><button class="${GXV.vw === "gex" ? "on" : ""}" data-gxv="gex">DEX × GEX</button><button class="${GXV.vw === "renda" ? "on" : ""}" data-gxv="renda">💡 Ideias</button></div>`;
      let r = t.replace(
        /(<div class="hub2" style="margin:8px 0 6px">[\s\S]*?<\/div>)/,
        "$1" + n,
      );
      if (GXV.vw === "gex" || GXV.vw === "renda") {
        const i = r.indexOf('<div class="hub2" style="margin:0 0 8px">');
        r =
          (i > 0 ? r.slice(0, i) : r.replace(/<\/div>$/, "")) +
          (GXV.vw === "gex" ? gxHtml(s) : rrdHtml()) +
          "</div>";
      }
      return (
        GXV.vw === "renda" &&
          (r = r.replace(
            /<div class="hub2" style="margin:8px 0 6px">[\s\S]*?<\/div>/,
            "",
          )),
        r
      );
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-gxv]");
  if (t) {
    GXV.vw = t.dataset.gxv;
    try {
      ls.set("diario-opg-vw", GXV.vw);
    } catch {}
    opgPinta();
    return;
  }
  const a = e.target.closest("[data-gx]");
  a &&
    (a.dataset.gx === "vm" ? (GXV.vm = a.dataset.v) : (GXV.fx = +a.dataset.v),
    opgPinta());
}),
  (function () {
    const e = TraderStyles.slot("legacy-035");
    ((e.textContent = TraderStyles.css("legacy-035")), TraderStyles.mount(e));
  })());
const JE = {
  a: (() => {
    try {
      return ls.get("diario-je") || "base";
    } catch {
      return "base";
    }
  })(),
};
try {
  const e = HUB_M.findIndex((a) => a[0] === "juros");
  HUB_M.some((a) => a[0] === "mercado:jedu") ||
    HUB_M.splice(e < 0 ? HUB_M.length : e + 1, 0, [
      "mercado:jedu",
      "Entenda os juros",
    ]);
  const t = MGRP.find((a) => a[0] === "Juros");
  t && !t[1].includes("mercado:jedu") && t[1].push("mercado:jedu");
} catch {}
function jeAcha(e, t, a = 0) {
  if (!e || typeof e != "object" || a > 6) return null;
  if (t(e)) return e;
  for (const o in e) {
    const s = jeAcha(e[o], t, a + 1);
    if (s) return s;
  }
  return null;
}
function jeNums() {
  const e = (typeof JR < "u" && JR.data) || {},
    t = new Date().getFullYear(),
    a = (c) =>
      c == null || !isFinite(c) ? "–" : (+c).toFixed(2).replace(".", ",") + "%",
    o = jeAcha(
      typeof MDO < "u" ? MDO.v : null,
      (c) => c.s === "^TNX" || (/Treasury 10/.test(c.n || "") && c.px != null),
    ),
    s = jeAcha(
      typeof PNL < "u" ? PNL : null,
      (c) => c && (c.k === "ust2" || c.id === "ust2") && c.px != null,
    ),
    n = e.focus || {},
    r = e.copom || {},
    i = e.selic && e.selic.v,
    l = e.ipca12 && e.ipca12.v,
    d = o && +o.px;
  return `<div class="kv">${[
    ["Selic hoje", a(i), "taxa básica do Brasil"],
    ["IPCA 12 meses", a(l), "inflação do Brasil (meta 3%)"],
    [
      "Juro real (Selic − IPCA)",
      e.real != null ? a(e.real) : "–",
      "quanto o juro ganha da inflação",
    ],
    [
      "Selic esperada fim de " + t,
      a(n.selic && n.selic[t]),
      "mediana do Focus",
    ],
    ["Treasury 10 anos (EUA)", d ? a(d) : "–", "juro de referência do mundo"],
    [
      "Diferencial Brasil − EUA",
      i && d ? (i - d).toFixed(2).replace(".", ",") + " pontos" : "–",
      "quanto o Brasil paga a mais",
    ],
  ]
    .map(([c, p, u]) => KV(c, p, "", u))
    .join(
      "",
    )}</div>${r.proxima ? `<div class="sm" style="margin:6px 2px;color:var(--mut)">Próximo Copom: decisão em ${esc(fmtD(r.proxima.decisao))} (daqui a ${r.proxima.dias} dia${r.proxima.dias === 1 ? "" : "s"}), por volta das 18h30.</div>` : ""}`;
}
const JE_ABAS = [
  ["base", "O básico"],
  ["br", "Brasil"],
  ["eua", "Estados Unidos"],
  ["dif", "Brasil × EUA"],
  ["imp", "O que muda no mercado"],
  ["trade", "No seu dia de trade"],
  ["dic", "Dicionário"],
];
function jeBox(e, t) {
  return `<div class="card jeb"><b>${e}</b><div class="sm" style="margin-top:6px;line-height:1.6">${t}</div></div>`;
}
function jeSeta(e, t, a) {
  return `<div class="jes"><span>${e}</span><i>→</i><span>${t}</span>${a ? `<i>→</i><span>${a}</span>` : ""}</div>`;
}
function jeConteudo(e) {
  const t = (a) => `<p style="margin:6px 0">${a}</p>`;
  switch (e) {
    case "base":
      return (
        jeBox(
          "Juro é o preço do dinheiro no tempo",
          t(
            'Quem empresta abre mão de usar o dinheiro agora e cobra por isso. Quem pega emprestado paga para antecipar o consumo ou o investimento. Esse "aluguel do dinheiro" é o juro.',
          ) +
            t(
              "Exemplo: R$ 1.000 aplicados a 15% ao ano viram R$ 1.150 em um ano. Se a inflação foi 5%, os preços também subiram: o seu ganho de verdade (o <b>juro real</b>) foi de uns 9,5%.",
            ),
        ) +
        jeBox(
          "Quem decide a taxa",
          t(
            "Cada país tem um <b>banco central</b> que define a taxa básica: no Brasil é o <b>Banco Central</b> (Selic); nos EUA é o <b>Fed</b> (Fed Funds). Essa taxa vale para empréstimos de um dia entre bancos e serve de piso para todas as outras: financiamento, cartão, CDB, Tesouro.",
          ) +
            t(
              "Já os juros mais longos (2, 5, 10 anos) não são decididos por ninguém: são negociados no mercado todos os dias e mostram o que os investidores <b>esperam</b> dos juros e da inflação lá na frente.",
            ),
        ) +
        jeBox(
          "Por que o banco central sobe ou corta",
          t("A arma do banco central contra a inflação é o juro.") +
            jeSeta(
              "Inflação alta",
              "BC <b>sobe</b> os juros",
              "crédito caro, consumo esfria, preços desaceleram",
            ) +
            jeSeta(
              "Economia fraca e inflação controlada",
              "BC <b>corta</b> os juros",
              "crédito barato, consumo e investimento voltam",
            ) +
            t(
              "O efeito leva de 6 a 18 meses para aparecer na economia. Por isso o BC olha muito para a <b>inflação esperada</b>, não só para a de hoje.",
            ),
        ) +
        jeBox(
          "A curva de juros",
          t(
            "Se você ligar as taxas de vários prazos (1 mês, 1 ano, 5 anos, 10 anos) num gráfico, tem a <b>curva de juros</b>.",
          ) +
            t(
              "<b>Curva subindo</b> (longo mais alto que o curto): o normal, porque emprestar por mais tempo tem mais risco. <b>Curva invertida</b> (curto mais alto): o mercado acha que os juros vão cair na frente, muitas vezes porque espera a economia desacelerar.",
            ),
        )
      );
    case "br":
      return (
        jeBox(
          "Selic e Copom",
          t(
            "A <b>Selic</b> é a taxa básica do Brasil. Quem define é o <b>Copom</b>, que se reúne 8 vezes por ano (a cada 45 dias, mais ou menos). A decisão sai na quarta-feira por volta das 18h30, junto com um comunicado. Uma semana depois sai a <b>ata</b>, explicando o raciocínio.",
          ) +
            t(
              "A meta de inflação do Brasil é <b>3% ao ano</b>, com tolerância de 1,5 ponto para cima ou para baixo. Se a inflação fica muito acima, o BC tende a subir ou manter a Selic alta.",
            ),
        ) +
        jeBox(
          "CDI e o seu dinheiro",
          t(
            'O <b>CDI</b> anda praticamente colado na Selic. É a referência da renda fixa: um CDB "100% do CDI" rende quase a Selic. Por isso, <b>Selic alta = renda fixa rendendo muito</b>, sem risco de bolsa.',
          ),
        ) +
        jeBox(
          "DI futuro: a aposta do mercado",
          t(
            "Na B3 existe o <b>DI futuro</b> (DI1), que negocia qual será o CDI médio até uma data. O DI1F29, por exemplo, mostra o juro médio que o mercado espera até janeiro de 2029.",
          ) +
            t(
              "Quando o DI longo <b>sobe</b>, o mercado está pedindo mais juro para emprestar ao Brasil por mais tempo, em geral por <b>medo de inflação ou das contas do governo</b> (risco fiscal). Isso costuma derrubar a bolsa e pode subir o dólar.",
            ) +
            t(
              "Os detalhes e as calculadoras estão na aba ao lado, <b>Juros e DI</b>.",
            ),
        ) +
        jeBox(
          "Risco fiscal: por que o Brasil paga caro",
          t(
            "Se o governo gasta mais do que arrecada e a dívida cresce, o investidor fica com medo de inflação e de calote no futuro. Para continuar emprestando, ele exige juros maiores. Por isso notícias sobre gastos, arcabouço fiscal e meta de resultado primário mexem tanto com o DI longo, o dólar e a bolsa.",
          ),
        ) +
        jeBox(
          "Focus: o termômetro das expectativas",
          t(
            "Toda segunda-feira de manhã, o BC divulga o <b>Boletim Focus</b>: a mediana das previsões de economistas para Selic, inflação, PIB e dólar. Mudanças no Focus mostram para onde o mercado acha que os juros vão.",
          ),
        )
      );
    case "eua":
      return (
        jeBox(
          "O Fed e a taxa dos EUA",
          t(
            "O <b>Fed</b> (Federal Reserve) é o banco central americano. A reunião se chama <b>FOMC</b> e acontece 8 vezes por ano. A decisão sai às 15h de Brasília (16h de novembro a março, quando os EUA estão fora do horário de verão), e meia hora depois o presidente do Fed dá uma entrevista que muitas vezes mexe mais que a própria decisão.",
          ) +
            t(
              'A taxa do Fed é um <b>intervalo</b> (por exemplo, "de 4,25% a 4,50%"). A meta de inflação de lá é <b>2%</b>.',
            ),
        ) +
        jeBox(
          "Treasuries: os títulos do governo americano",
          t(
            "São os títulos do Tesouro dos EUA, considerados os mais seguros do mundo. O rendimento (<b>yield</b>) deles é a referência para todo o planeta.",
          ) +
            t(
              "<b>Treasury de 2 anos:</b> reflete o que se espera do Fed nos próximos meses. <b>Treasury de 10 anos:</b> reflete crescimento, inflação e o risco das contas do governo americano. É o número mais olhado do mundo financeiro.",
            ) +
            t(
              "Quando o yield sobe, o preço do título cai (e vice-versa): os dois andam em sentidos opostos.",
            ),
        ) +
        jeBox(
          "Por que o mundo inteiro olha para os juros americanos",
          t(
            "O dólar é a moeda do comércio e das reservas do mundo. Se um título americano, sem risco, passa a pagar mais, o investidor global tira dinheiro de lugares mais arriscados (como o Brasil) e leva para os EUA.",
          ) +
            jeSeta(
              "Juros dos EUA sobem",
              "dinheiro volta para os EUA",
              "dólar sobe no mundo, bolsas emergentes caem",
            ),
        ) +
        jeBox(
          "O que move os juros americanos",
          t(
            "<b>CPI</b> (inflação ao consumidor) e <b>PCE</b> (a inflação preferida do Fed), o <b>payroll</b> (relatório de emprego, na primeira sexta do mês), o PIB, as falas dos diretores do Fed e o tamanho da dívida americana. Inflação ou emprego mais fortes que o esperado = juros sobem.",
          ) +
            t(
              "<b>Curva invertida</b> nos EUA (2 anos pagando mais que 10 anos) foi, historicamente, um sinal de recessão à frente.",
            ),
        )
      );
    case "dif":
      return (
        jeBox(
          "Diferencial de juros",
          t(
            'É a diferença entre o que o Brasil e os EUA pagam. Se a Selic está em 15% e o Treasury em 4%, o Brasil paga uns 11 pontos a mais. Esse "prêmio" existe porque o Brasil é visto como mais arriscado (inflação, contas públicas, câmbio).',
          ),
        ) +
        jeBox(
          "Carry trade: o dinheiro que vem atrás do juro",
          t(
            "Investidores pegam dinheiro barato lá fora (onde o juro é baixo), trocam por reais e aplicam aqui a juros altos. Enquanto o real não desvaloriza muito, eles ganham a diferença.",
          ) +
            jeSeta(
              "Diferencial grande e estável",
              "dólar entra no Brasil",
              "<b>real se valoriza</b> (dólar cai)",
            ) +
            jeSeta(
              "Diferencial encolhe ou o medo aumenta",
              "esse dinheiro sai rápido",
              "<b>dólar sobe</b> forte",
            ),
        ) +
        jeBox(
          "Quando um mexe, o outro sente",
          t(
            "Se o Fed sobe juros e o Brasil não acompanha, o diferencial cai e o dólar tende a subir aqui. Isso pressiona a inflação brasileira (importados ficam mais caros), e o Copom pode ter que manter a Selic alta por mais tempo.",
          ) +
            t(
              "Por isso o DI longo brasileiro costuma <b>subir junto</b> quando o Treasury de 10 anos sobe forte.",
            ),
        )
      );
    case "imp":
      return (
        jeBox(
          "Resumo: o que costuma acontecer",
          `<table class="jet"><tr><th>Se…</th><th>Bolsa (Ibovespa)</th><th>Dólar</th><th>Renda fixa</th></tr>
<tr><td>Selic sobe</td><td class="r">tende a cair</td><td class="g">tende a cair</td><td class="g">rende mais</td></tr>
<tr><td>Selic cai</td><td class="g">tende a subir</td><td class="r">tende a subir</td><td class="r">rende menos</td></tr>
<tr><td>DI longo sobe (medo fiscal)</td><td class="r">cai</td><td class="r">sobe</td><td>títulos prefixados perdem valor</td></tr>
<tr><td>Juros dos EUA sobem</td><td class="r">cai</td><td class="r">sobe</td><td>DI tende a subir junto</td></tr>
<tr><td>Juros dos EUA caem</td><td class="g">sobe</td><td class="g">cai</td><td>alívio no DI</td></tr></table><div class="sm" style="margin-top:6px;color:var(--mut)">São tendências, não regras: o que move o preço é a <b>surpresa</b> em relação ao esperado. Uma alta de juros que todo mundo já esperava pode até fazer a bolsa subir.</div>`,
        ) +
        jeBox(
          "Por que juro alto derruba a bolsa",
          t(
            "<b>1. Concorrência:</b> se a renda fixa paga 15% sem risco, menos gente aceita o risco da bolsa.",
          ) +
            t(
              '<b>2. Valor das empresas:</b> o preço justo de uma ação é o lucro futuro "trazido a valor presente". Quanto maior o juro, menos vale o lucro de daqui a 5 ou 10 anos.',
            ) +
            t(
              "<b>3. Dívidas e consumo:</b> empresas endividadas pagam mais juros e o consumidor compra menos a prazo.",
            ),
        ) +
        jeBox(
          "Quem sofre e quem aguenta",
          t(
            "<b>Sofrem mais com juro alto:</b> varejo, construtoras, empresas de crescimento e small caps, empresas muito endividadas.",
          ) +
            t(
              "<b>Aguentam melhor:</b> bancos e seguradoras (ganham com o juro), elétricas com contratos corrigidos pela inflação, exportadoras (Vale, Petrobras, frigoríficos, papel e celulose), que ganham com o dólar alto.",
            ),
        )
      );
    case "trade":
      return (
        jeBox(
          "Datas que você precisa marcar",
          '<ul class="jel"><li><b>Copom</b> (quarta, ~18h30): o mercado reage no dia seguinte na abertura. O app já avisa na véspera.</li><li><b>Ata do Copom</b> (terça seguinte, 8h): pode mexer no DI e no índice logo cedo.</li><li><b>IPCA e IPCA-15</b> (9h): surpresa na inflação mexe forte no DI curto.</li><li><b>FOMC</b> (quarta, 15h de Brasília; 16h de novembro a março): fim de pregão agitado, cuidado com stops curtos.</li><li><b>Payroll e CPI americanos</b> (9h30 de Brasília; 10h30 de novembro a março): movimentos fortes no dólar e no índice perto da abertura.</li></ul>',
        ) +
        jeBox(
          "Mini índice (WIN) e juros",
          t(
            "No dia a dia, o WIN costuma andar <b>ao contrário do DI</b>: DI subindo (taxas abrindo) pesa no índice; DI caindo alivia. Antes de entrar, olhe se o DI1F29 e o Treasury de 10 anos estão subindo ou caindo forte no dia.",
          ) +
            t(
              "Dia de Copom e de FOMC: o índice pode ficar parado até a decisão e depois andar muito de uma vez. Diminua a mão ou espere a poeira baixar.",
            ),
        ) +
        jeBox(
          "Mini dólar (WDO) e juros",
          t(
            "O WDO sente os <b>juros americanos</b>: Treasury subindo costuma fortalecer o dólar. E sente o <b>diferencial</b>: notícia que faz o mercado esperar Selic mais baixa (ou fiscal pior) tende a subir o dólar aqui.",
          ),
        ) +
        jeBox(
          "Checklist rápido antes de operar",
          '<ul class="jel"><li>Tem Copom, FOMC, IPCA, payroll ou CPI hoje?</li><li>O DI longo está subindo ou caindo forte? E o Treasury de 10 anos?</li><li>O dólar está andando junto (sinal de fluxo para fora) ou não?</li><li>Se o dia é de decisão: posição menor ou ficar de fora até sair.</li></ul>',
        )
      );
    case "dic":
      return jeBox(
        "Palavras que aparecem nas notícias",
        '<ul class="jel"><li><b>Ponto-base (pb):</b> 0,01 ponto percentual. "Subiu 50 pb" = subiu 0,50 ponto.</li><li><b>Hawkish:</b> tom duro, a favor de juros altos para combater a inflação.</li><li><b>Dovish:</b> tom suave, mais aberto a cortar juros.</li><li><b>Yield:</b> rendimento de um título.</li><li><b>Prefixado:</b> taxa fixa combinada na compra. <b>Pós-fixado:</b> acompanha o CDI ou a Selic.</li><li><b>IPCA+:</b> paga a inflação mais um juro real.</li><li><b>Marcação a mercado:</b> o preço de um título muda todo dia conforme os juros; se os juros sobem, o prefixado perde valor antes do vencimento.</li><li><b>Inclinação da curva:</b> diferença entre o juro longo e o curto.</li><li><b>Prêmio de risco:</b> juro a mais que o investidor exige por correr risco.</li><li><b>Carry trade:</b> pegar dinheiro barato num país e aplicar onde o juro é alto.</li><li><b>Fiscal:</b> contas do governo (quanto arrecada, quanto gasta e quanto deve).</li></ul>',
      );
  }
  return "";
}
function jeHtml() {
  return `<div class="card" id="jebox"><div class="top"><b>Entenda os juros</b><span class="sm mut">para quem está começando</span></div><div id="jenum" style="margin-top:8px">${jeNums()}</div>
<div class="hub2" style="margin:10px 0 4px">${JE_ABAS.map(([e, t]) => `<button class="${JE.a === e ? "on" : ""}" data-je="${e}">${t}</button>`).join("")}</div></div>${jeConteudo(JE.a)}<div class="sm" style="margin:10px 2px 20px;color:var(--mut)">Conteúdo educativo, não é recomendação de investimento.</div>`;
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "jedu"
      ? e.apply(this, arguments)
      : (setTimeout(() => {
          try {
            jrLoad(!1);
          } catch {}
          try {
            mdoCarrega(!1);
          } catch {}
          let t = 0;
          const a = setInterval(() => {
            const o = document.getElementById("jenum");
            if (!o || ++t > 8) return clearInterval(a);
            o.innerHTML = jeNums();
          }, 1500);
        }, 0),
        jeHtml());
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-je]");
  if (!t) return;
  JE.a = t.dataset.je;
  try {
    ls.set("diario-je", JE.a);
  } catch {}
  render();
  const a = document.getElementById("jebox");
  a && a.scrollIntoView({ block: "start" });
}),
  (function () {
    const e = TraderStyles.slot("legacy-036");
    ((e.textContent = TraderStyles.css("legacy-036")), TraderStyles.mount(e));
  })());
let CN_BANCO = window.CN_BANCO_DATA || { ct: [], cb: [] };
const CNB = { ok: !!window.CN_BANCO_DATA, busy: 0 };
function cnBancoCarrega() {
  if (CNB.ok || CNB.busy) return;
  CNB.busy = 1;
  const e = document.createElement("script");
  ((e.src = "cnpi.js"),
    (e.onload = () => {
      if (
        ((CNB.busy = 0),
        window.CN_BANCO_DATA &&
          ((CN_BANCO = window.CN_BANCO_DATA), (CNB.ok = 1), tab === "estudos"))
      ) {
        const t = scrollY;
        (render(), scrollTo(0, t));
      }
    }),
    (e.onerror = () => {
      ((CNB.busy = 0),
        toast(
          "Suba o arquivo cnpi.js no GitHub (junto com o app.js) para o simulado do CNPI.",
          5e3,
        ));
    }),
    document.head.appendChild(e));
}
const CN_TEMAS = {
    t1: "Princípios da análise técnica",
    t2: "Teoria de Dow",
    t3: "Retas, tendências, suportes e resistências",
    t4: "Formações gráficas e gaps",
    t5: "Ondas de Elliott e Fibonacci",
    t6: "Candlestick",
    t7: "Indicadores",
    t8: "Stops, risco e estratégias",
    t9: "Volume e contratos em aberto",
    t10: "Combinando técnicas",
    b1: "Sistema Financeiro Nacional",
    b2: "Mercado de capitais",
    b3: "Renda fixa",
    b4: "Derivativos",
    b5: "Conceitos econômicos",
    b6: "Conduta e relacionamento",
    b7: "Governança, RI e sustentabilidade",
  },
  CN_PROVA = {
    ct: { nome: "CT1 · Análise técnica", n: 60, min: 110, ok: 40 },
    cb: { nome: "CB · Conteúdo brasileiro", n: 60, min: 110, ok: 40 },
  },
  CN_BOX = [0, 1, 3, 7, 21, 45],
  CN = { run: null, busy: "" },
  cnS = () => {
    var e, t, a;
    return (
      S.cnpi ?? (S.cnpi = { r: {}, sims: [], ia: [] }),
      (e = S.cnpi).r ?? (e.r = {}),
      (t = S.cnpi).sims ?? (t.sims = []),
      (a = S.cnpi).ia ?? (a.ia = []),
      S.cnpi
    );
  },
  cnTodas = () => [
    ...CN_BANCO.ct.map((e) => ({ ...e, p: "ct" })),
    ...CN_BANCO.cb.map((e) => ({ ...e, p: "cb" })),
    ...cnS().ia.map((e) => ({ ...e, p: e.t[0] === "b" ? "cb" : "ct", ia: 1 })),
  ],
  cnHoje = () => loc().slice(0, 10);
function cnEmbaralha(e) {
  e = e.slice();
  for (let t = e.length - 1; t > 0; t--) {
    const a = Math.floor(Math.random() * (t + 1));
    [e[t], e[a]] = [e[a], e[t]];
  }
  return e;
}
function cnDevidas() {
  const e = cnS().r,
    t = cnHoje();
  return cnTodas().filter((a) => e[a.id] && e[a.id].next && e[a.id].next <= t);
}
function cnStats(e) {
  const t = cnS().r,
    a = cnTodas().filter(e || (() => 1));
  let o = 0,
    s = 0,
    n = 0;
  return (
    a.forEach((r) => {
      const i = t[r.id];
      i && i.n && (n++, (o += i.n), (s += i.ok));
    }),
    { tot: a.length, vis: n, n: o, ok: s, pc: o ? s / o : null }
  );
}
function cnInicia(e, t) {
  let a = [];
  const o = cnTodas();
  if (e === "sim") {
    const s = CN_PROVA[t],
      n = o.filter((d) => d.p === t),
      r = [...new Set(n.map((d) => d.t))],
      i = {};
    n.forEach((d) => {
      var c;
      return (i[(c = d.t)] ?? (i[c] = [])).push(d);
    });
    const l = Math.min(s.n, n.length);
    for (
      r.forEach((d) => {
        i[d] = cnEmbaralha(i[d]);
      });
      a.length < l;

    ) {
      let d = 0;
      for (const c of r)
        i[c].length && a.length < l && (a.push(i[c].shift()), (d = 1));
      if (!d) break;
    }
    a = cnEmbaralha(a);
  } else if (e === "tema") {
    const s = cnS().r;
    a = cnEmbaralha(o.filter((n) => n.t === t))
      .sort((n, r) => ((s[n.id] || {}).n || 0) - ((s[r.id] || {}).n || 0))
      .slice(0, 10);
  } else if (e === "rev") a = cnEmbaralha(cnDevidas()).slice(0, 20);
  else if (e === "erros") {
    const s = cnS().r;
    a = cnEmbaralha(o.filter((n) => s[n.id] && s[n.id].ult === 0)).slice(0, 20);
  } else {
    const s = cnS().r;
    ((a = cnEmbaralha(o.filter((n) => n.p === (t || "ct")))
      .sort((n, r) => ((s[n.id] || {}).n || 0) - ((s[r.id] || {}).n || 0))
      .slice(0, 10)),
      (a = cnEmbaralha(a)));
  }
  if (!a.length) {
    toast("Nada para responder aqui agora.");
    return;
  }
  ((CN.run = {
    modo: e,
    arg: t,
    L: a.map((s) => ({
      ...s,
      ord: cnEmbaralha([0, 1, 2, 3].slice(0, s.o.length)),
    })),
    i: 0,
    resp: {},
    marc: {},
    ini: Date.now(),
    fim: e === "sim" ? Date.now() + CN_PROVA[t].min * 6e4 : null,
    acabou: 0,
  }),
    render(),
    scrollTo(0, 0));
}
function cnRegistra(e, t) {
  var a;
  const o = cnS().r,
    s = o[(a = e.id)] ?? (o[a] = { n: 0, ok: 0, box: 0 });
  (s.n++,
    t && s.ok++,
    (s.ult = t ? 1 : 0),
    (s.box = t ? Math.min(5, (s.box || 0) + 1) : 0),
    (s.next = diasMais(cnHoje(), t ? CN_BOX[s.box] : 1)),
    (s.d = cnHoje()));
}
function cnFinaliza() {
  const e = CN.run;
  if (!e || e.acabou) return;
  e.acabou = 1;
  let t = 0;
  const a = {};
  (e.L.forEach((o, s) => {
    var n;
    const r = e.resp[s],
      i = r != null && o.ord[r] === o.c;
    (i && t++,
      a[(n = o.t)] ?? (a[n] = [0, 0]),
      a[o.t][1]++,
      i && a[o.t][0]++,
      e.modo === "sim" && r != null
        ? cnRegistra(o, i)
        : e.modo === "sim" && cnRegistra(o, !1));
  }),
    e.modo === "sim" &&
      cnS().sims.unshift({
        d: Date.now(),
        p: e.arg,
        ac: t,
        tot: e.L.length,
        dur: Math.round((Date.now() - e.ini) / 6e4),
        tem: a,
      }),
    (cnS().sims = cnS().sims.slice(0, 40)),
    (e.res = { ac: t, tot: e.L.length, tem: a }),
    save(),
    render(),
    scrollTo(0, 0));
}
function cnTempo() {
  const e = CN.run;
  if (!e || !e.fim) return "";
  const t = Math.max(0, Math.round((e.fim - Date.now()) / 1e3));
  return (
    String(Math.floor(t / 60)).padStart(2, "0") +
    ":" +
    String(t % 60).padStart(2, "0")
  );
}
setInterval(() => {
  try {
    const e = CN.run;
    if (!e || !e.fim || e.acabou) return;
    const t = document.getElementById("cnt-tempo");
    (t && (t.textContent = cnTempo()),
      Date.now() >= e.fim &&
        (toast("Tempo esgotado: o simulado foi encerrado."), cnFinaliza()));
  } catch {}
}, 1e3);
const cnLetra = (e) => "ABCD"[e];
function cnQuestaoHtml() {
  const e = CN.run,
    t = e.L[e.i],
    a = e.resp[e.i],
    o = e.modo === "sim",
    s = !o && a != null,
    n = e.L.length,
    r = Object.keys(e.resp).length;
  return `<div class="card cnq"><div class="top"><span class="sm mut">${o ? esc(CN_PROVA[e.arg].nome) : e.modo === "rev" ? "Revisão do dia" : e.modo === "erros" ? "Revisando erros" : "Treino"} · questão ${e.i + 1} de ${n}</span>${o ? `<b class="mono" id="cnt-tempo">${cnTempo()}</b>` : ""}</div>
<div class="cnbar"><b style="width:${(r / n) * 100}%"></b></div>
<div class="sm" style="margin:8px 0 2px;color:var(--ac)">${esc(CN_TEMAS[t.t] || "")}${t.ia ? " · gerada por IA" : ""}</div>
<div class="cnp">${esc(t.q)}</div>
${t.ord.map((i, l) => `<button class="cno ${s ? (i === t.c ? "ok" : l === a ? "no" : "") : l === a ? "sel" : ""}" data-cno="${l}"${s ? " disabled" : ""}><b>${cnLetra(l)}</b><span>${esc(t.o[i])}</span></button>`).join("")}
${s ? `<div class="cnex ${t.ord[a] === t.c ? "g" : "r"}"><b>${t.ord[a] === t.c ? "Certo!" : "Resposta: " + cnLetra(t.ord.indexOf(t.c))}</b> ${esc(t.e)}<div class="sm" style="margin-top:4px;color:var(--mut)">Referência: ${esc(t.r)}</div></div>` : ""}
<div class="cnnav"><button class="btn s" data-cnn="ant"${e.i ? "" : " disabled"}>‹ Anterior</button>${o ? `<button class="btn s" data-cnn="marca">${e.marc[e.i] ? "★ Marcada" : "☆ Marcar"}</button>` : ""}${e.i < n - 1 ? '<button class="btn" data-cnn="prox">Próxima ›</button>' : `<button class="btn" data-cnn="fim">${o ? "Entregar simulado" : "Concluir"}</button>`}</div>
${o ? `<div class="cngr">${e.L.map((i, l) => `<button class="${l === e.i ? "cur" : ""}${e.resp[l] != null ? " r" : ""}${e.marc[l] ? " m" : ""}" data-cng="${l}">${l + 1}</button>`).join("")}</div><button class="btn s" data-cnn="fim" style="width:100%;margin-top:8px">Entregar agora (${r} de ${n} respondidas)</button>` : ""}
<button class="btn s d" data-cnn="sair" style="width:100%;margin-top:8px">Sair ${o ? "sem entregar" : ""}</button></div>`;
}
function cnResultadoHtml() {
  const e = CN.run,
    { ac: t, tot: a, tem: o } = e.res,
    s = e.modo === "sim",
    n = s ? CN_PROVA[e.arg] : null,
    r = s && t >= Math.ceil((n.ok * a) / n.n),
    i = a ? t / a : 0;
  return `<div class="card cnq"><b style="font-size:18px">${s ? (r ? "Aprovado neste simulado 🎉" : "Ainda não: continue treinando") : "Treino concluído"}</b>
<div class="kv" style="margin-top:8px">${KV("Acertos", t + " de " + a, i >= 0.67 ? "g" : "r", Math.round(i * 100) + "%")}${s ? KV("Mínimo para aprovar", Math.ceil((n.ok * a) / n.n) + " de " + a, "", "na prova: " + n.ok + " de " + n.n) : ""}${s ? KV("Tempo", Math.round((Date.now() - e.ini) / 6e4) + " min", "", "limite " + n.min + " min") : ""}</div>
<h2>Por tema</h2>${Object.entries(o)
    .sort((l, d) => l[1][0] / l[1][1] - d[1][0] / d[1][1])
    .map(
      ([l, [d, c]]) =>
        `<div class="cnt"><span>${esc(CN_TEMAS[l] || l)}</span><b class="${d / c >= 0.67 ? "g" : "r"}">${d}/${c}</b></div>`,
    )
    .join("")}
${
  s
    ? `<h2>Gabarito</h2>${e.L.map((l, d) => {
        const c = e.resp[d],
          p = c != null && l.ord[c] === l.c;
        return `<details class="cngb"><summary><b class="${p ? "g" : "r"}">${p ? "✓" : "✗"} ${d + 1}.</b> ${esc(l.q.slice(0, 90))}${l.q.length > 90 ? "…" : ""}</summary><div class="sm" style="margin:6px 0">Sua resposta: ${c != null ? cnLetra(c) + ") " + esc(l.o[l.ord[c]]) : "—"}<br>Correta: <b>${cnLetra(l.ord.indexOf(l.c))}) ${esc(l.o[l.c])}</b><br>${esc(l.e)} <span style="color:var(--mut)">(${esc(l.r)})</span></div></details>`;
      }).join("")}`
    : ""
}
<div class="g2" style="margin-top:12px"><button class="btn" data-cnn="sair">Voltar</button>${e.L.some((l, d) => !(e.resp[d] != null && l.ord[e.resp[d]] === l.c)) ? '<button class="btn s" data-cnm="erros">Revisar erros</button>' : ""}</div></div>`;
}
function cnHomeHtml() {
  const e = cnS(),
    t = cnStats((l) => l.p === "ct"),
    a = cnStats((l) => l.p === "cb"),
    o = cnDevidas().length,
    s = cnTodas().filter((l) => (e.r[l.id] || {}).ult === 0).length,
    n = (l) =>
      `<div class="cnbar sm"><b style="width:${l.tot ? (l.vis / l.tot) * 100 : 0}%"></b></div><div class="sm" style="color:var(--mut);margin-top:3px">${l.vis} de ${l.tot} questões vistas${l.pc != null ? " · acerto " + Math.round(l.pc * 100) + "%" : ""}</div>`,
    r = (l) => {
      const d = cnStats((c) => c.t === l);
      return `<button class="cntm" data-cnm="tema" data-v="${l}"><span>${esc(CN_TEMAS[l])}</span><i class="cnbar"><b style="width:${d.pc != null ? d.pc * 100 : 0}%;background:${d.pc == null ? "var(--bd2)" : d.pc >= 0.67 ? "var(--g)" : d.pc >= 0.5 ? "var(--am)" : "var(--r)"}"></b></i><small>${d.pc != null ? Math.round(d.pc * 100) + "%" : "novo"} · ${d.tot}</small></button>`;
    },
    i = e.sims.slice(0, 5);
  return `<div class="card"><div class="top"><b>CNPI-T · Analista técnico</b><span class="sm mut">Apimec / FGV</span></div>
<div class="sm" style="margin:6px 0;color:var(--mut)">Duas provas: <b>CB</b> (conteúdo brasileiro) e <b>CT1</b> (análise técnica), cada uma com 60 questões em 1h50; aprovação com 40 acertos. Questões originais no formato da prova, cobrindo o programa oficial.</div>
<div class="g2" style="margin-top:8px"><div><b class="sm">CT1</b>${n(t)}</div><div><b class="sm">CB</b>${n(a)}</div></div></div>
<div class="g2" style="margin-top:8px"><button class="btn" data-cnm="sim" data-v="ct">Simulado CT1<br><small>60 questões · 1h50</small></button><button class="btn" data-cnm="sim" data-v="cb">Simulado CB<br><small>${Math.min(60, CN_BANCO.cb.length + e.ia.filter((l) => l.t[0] === "b").length)} questões · 1h50</small></button></div>
<div class="g2" style="margin-top:8px"><button class="btn s" data-cnm="rap" data-v="ct">Treino rápido CT1 (10)</button><button class="btn s" data-cnm="rap" data-v="cb">Treino rápido CB (10)</button></div>
<div class="g2" style="margin-top:8px"><button class="btn s" data-cnm="rev"${o ? "" : " disabled"}>Revisão de hoje (${o})</button><button class="btn s" data-cnm="erros"${s ? "" : " disabled"}>Refazer erros (${s})</button></div>
${
  i.length
    ? `<h2>Últimos simulados</h2><div class="card">${i
        .map((l) => {
          const d = CN_PROVA[l.p],
            c = l.ac >= Math.ceil((d.ok * l.tot) / d.n);
          return `<div class="cnt"><span>${esc(new Date(l.d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))} · ${l.p === "ct" ? "CT1" : "CB"} · ${l.dur} min</span><b class="${c ? "g" : "r"}">${l.ac}/${l.tot} ${c ? "aprovado" : ""}</b></div>`;
        })
        .join("")}</div>`
    : ""
}
<h2>CT1 · treino por tema</h2><div class="card cntms">${Object.keys(CN_TEMAS)
    .filter((l) => l[0] === "t")
    .map(r)
    .join("")}</div>
<h2>CB · treino por tema</h2><div class="card cntms">${Object.keys(CN_TEMAS)
    .filter((l) => l[0] === "b")
    .map(r)
    .join("")}</div>
<h2>Mais questões com IA</h2><div class="card"><div class="sm" style="color:var(--mut)">A IA escreve questões novas (originais) sobre o tema escolhido, no formato da prova, com explicação. Elas entram no seu banco e nos simulados.</div>
<div class="g2" style="margin-top:6px"><label>Tema<select id="cn-tema">${Object.entries(
    CN_TEMAS,
  )
    .map(
      ([l, d]) =>
        `<option value="${l}">${l[0] === "t" ? "CT1" : "CB"} · ${esc(d)}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Quantidade<select id="cn-n"><option>5</option><option selected>10</option><option>15</option></select></label></div>
<button class="btn s" data-cnm="ia" style="width:100%;margin-top:6px"${CN.busy ? " disabled" : ""}>${CN.busy ? esc(CN.busy) : "Gerar questões"}</button>${e.ia.length ? `<div class="sm" style="margin-top:6px;color:var(--mut)">${e.ia.length} questões geradas pela IA no seu banco.</div>` : ""}</div>
<details class="card" style="margin-top:8px"><summary><b>Programa oficial e bibliografia</b></summary><div class="sm" style="margin-top:8px;line-height:1.6">
<b>CT1 (Análise técnica):</b> princípios (tipos de gráfico, escalas aritmética e logarítmica, gráficos contínuos de futuros, correção pela inflação); Teoria de Dow; retas, canais, suportes e resistências; formações gráficas e gaps; Ondas de Elliott e Fibonacci; candlestick (martelo, enforcado, engolfo, harami, estrelas, doji star, bebê abandonado e outros); indicadores (médias, MACD, Bollinger, IFR, momento, estocástico, OBV, divergências); stops e estratégias; volume e contratos em aberto; combinação de técnicas.<br>
<b>CB:</b> Sistema Financeiro Nacional, mercado de capitais, renda fixa, derivativos, conceitos econômicos, conduta e relacionamento, governança, RI e sustentabilidade.<br>
<b>Bibliografia indicada pela Apimec (CT1):</b> Murphy, <i>Technical Analysis of the Financial Markets</i>; Edwards e Magee, <i>Technical Analysis of Stock Trends</i>; Pring, <i>Technical Analysis Explained</i>; Kirkpatrick e Dahlquist, <i>Technical Analysis</i>; Pearl, <i>DeMark Indicators</i>. Em português, muito usado nos cursos: Flávio Lemos, <i>Análise Técnica dos Mercados Financeiros</i>.<br>
Dica: se você tiver o livro em PDF na aba Livros, o resumo dele também gera simulados próprios ali.<br>
<a href="https://www.apimecbrasil.com.br/certificacao/sobre-o-cnpi/" target="_blank" rel="noopener">Página oficial da certificação (Apimec)</a></div></details>`;
}
async function cnGeraIA() {
  const e = (document.getElementById("cn-tema") || {}).value || "t1",
    t = +((document.getElementById("cn-n") || {}).value || 10);
  ((CN.busy = "Gerando questões…"), render());
  try {
    const a = cnTodas()
        .filter((s) => s.t === e)
        .slice(0, 25)
        .map((s) => s.q),
      o = (
        (
          await anxCall({
            modo: "cnpi",
            tema: e,
            nome: CN_TEMAS[e],
            n: t,
            existentes: a,
          })
        ).questoes || []
      )
        .filter(
          (s) =>
            s &&
            s.q &&
            Array.isArray(s.o) &&
            s.o.length === 4 &&
            s.c >= 0 &&
            s.c < 4,
        )
        .map((s) => ({
          id:
            "g" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 6),
          t: e,
          q: String(s.q),
          o: s.o.map(String),
          c: +s.c,
          e: String(s.e || ""),
          r: String(s.r || "Gerada pela IA"),
        }));
    if (!o.length)
      throw new Error("A IA não devolveu questões válidas. Tente de novo.");
    (cnS().ia.push(...o), save(), toast(o.length + " questões novas no banco"));
  } catch (a) {
    toast(String(a.message || a));
  }
  ((CN.busy = ""), render());
}
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "cnpi"
      ? `<h1>Estudos</h1>${CN.run ? "" : '<div class="seg" style="margin:8px 0 10px"><button data-ep="esv" data-id="liv">📚 Livros</button><button data-ep="esv" data-id="pr">🧩 Meus prompts</button><button class="on" data-ep="esv" data-id="cnpi">🎓 CNPI-T</button></div>'}${CN.run ? (CN.run.acabou ? cnResultadoHtml() : cnQuestaoHtml()) : cnHomeHtml()}`
      : e
          .apply(this, arguments)
          .replace(
            'data-id="pr">🧩 Meus prompts</button>',
            'data-id="pr">🧩 Meus prompts</button><button data-ep="esv" data-id="cnpi">🎓 CNPI-T</button>',
          );
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cnm]"),
    a = e.target.closest("[data-cno]"),
    o = e.target.closest("[data-cnn]"),
    s = e.target.closest("[data-cng]");
  if (!t && !a && !o && !s) return;
  if (t) {
    const l = t.dataset.cnm,
      d = t.dataset.v;
    return l === "ia"
      ? cnGeraIA()
      : l === "sim" &&
          !confirm(
            "Começar o simulado agora? São " + CN_PROVA[d].min + " minutos.",
          )
        ? void 0
        : cnInicia(l, d);
  }
  const n = CN.run;
  if (!n) return;
  if (a && !n.acabou) {
    const l = +a.dataset.cno;
    if (n.modo !== "sim" && n.resp[n.i] != null) return;
    if (((n.resp[n.i] = l), n.modo !== "sim")) {
      const d = n.L[n.i];
      (cnRegistra(d, d.ord[l] === d.c),
        save(),
        navigator.vibrate &&
          navigator.vibrate(d.ord[l] === d.c ? 15 : [30, 40, 30]));
    }
    render();
    return;
  }
  if (s) {
    ((n.i = +s.dataset.cng), render());
    return;
  }
  const r = o.dataset.cnn;
  if (r === "ant" && n.i > 0) n.i--;
  else if (r === "prox" && n.i < n.L.length - 1) n.i++;
  else if (r === "marca") n.marc[n.i] = !n.marc[n.i];
  else if (r === "fim") {
    if (
      n.modo === "sim" &&
      Object.keys(n.resp).length < n.L.length &&
      !confirm("Há questões sem resposta. Entregar mesmo assim?")
    )
      return;
    cnFinaliza();
    return;
  } else if (r === "sair") {
    if (
      n.modo === "sim" &&
      !n.acabou &&
      !confirm("Sair sem entregar? O simulado será descartado.")
    )
      return;
    CN.run = null;
  }
  render();
  const i = document.querySelector(".cnq");
  i && i.scrollIntoView({ block: "start" });
}),
  (function () {
    const e = TraderStyles.slot("legacy-037");
    ((e.textContent = TraderStyles.css("legacy-037")), TraderStyles.mount(e));
  })());
const RRD = {
  tp: (() => {
    try {
      return ls.get("diario-rd-tp") || "cc";
    } catch {
      return "cc";
    }
  })(),
  pr: (() => {
    try {
      return +ls.get("diario-rd-pr") || 0.25;
    } catch {
      return 0.25;
    }
  })(),
};
function rrdLista() {
  const e = OPG.rows || [],
    t = loc().slice(0, 10),
    a = opR(),
    o = Math.exp(a) - 1,
    s = [];
  return (
    e.forEach((n) => {
      const r = +n.spot;
      if (!(r > 0)) return;
      const i = [...new Set((n.series || []).map((d) => d.m))].sort(),
        l = opgRank(n.ativo);
      i.forEach((d) => {
        const c = opgSeries(n, d),
          p = opgAtmIV(n, d) || 0.3;
        c.forEach((u) => {
          if (!u.lq || !(u.p >= 0.05) || !(u.k > 0)) return;
          const m = u.v || opgVenc(n, d),
            f = opDias(t, m);
          if (f < 5 || f > 120) return;
          const x = f / 365,
            v = u.iv || p,
            g = v * Math.sqrt(x),
            h = (Math.log(r / u.k) + (a - (v * v) / 2) * x) / g;
          if (RRD.tp === "cc" && u.t === "C" && u.k > r) {
            const b = OPM.ncdf(h),
              y = u.p / r,
              j = (u.k - r + u.p) / r,
              k = Math.pow(1 + y, 365 / f) - 1;
            s.push({
              row: n,
              x: u,
              venc: m,
              dias: f,
              pe: b,
              ret: y,
              retEx: j,
              an: k,
              xc: o > 0 ? k / o : null,
              rk: l,
              cap: r * 100,
              dist: u.k / r - 1,
            });
          }
          if (RRD.tp === "vp" && u.t === "P" && u.k < r) {
            const b = OPM.ncdf(-h),
              y = u.p / u.k,
              j = Math.pow(1 + y, 365 / f) - 1;
            s.push({
              row: n,
              x: u,
              venc: m,
              dias: f,
              pe: b,
              ret: y,
              an: j,
              xc: o > 0 ? j / o : null,
              rk: l,
              cap: u.k * 100,
              dist: u.k / r - 1,
            });
          }
        });
      });
    }),
    s
      .filter((n) => n.pe <= RRD.pr && n.pe >= 0.03)
      .sort((n, r) => r.an * (1 - r.pe) - n.an * (1 - n.pe))
  );
}
function rrdBal(e) {
  try {
    const t = (BAL.v && BAL.v.proximos) || [],
      a = e.row.ativo.slice(0, 4);
    return t.find(
      (o) =>
        String(o.tk || "")
          .toUpperCase()
          .slice(0, 4) === a &&
        o.d <= e.venc &&
        o.d >= loc().slice(0, 10),
    );
  } catch {
    return null;
  }
}
function rrdHtml() {
  setTimeout(() => {
    try {
      balCarrega();
    } catch {}
  }, 0);
  const e = rrdLista(),
    t = Math.exp(opR()) - 1,
    a = (s) => (s * 100).toFixed(1).replace(".", ",") + "%",
    o = (s, n, r, i) =>
      `<button class="${i ? "on" : ""}" data-rrd="${s}" data-v="${n}">${r}</button>`;
  return `<div class="hub2" style="margin:8px 0 4px">${o("tp", "cc", "Venda coberta de call", RRD.tp === "cc")}${o("tp", "vp", "Venda de put", RRD.tp === "vp")}</div>
<div class="hub2" style="margin:0 0 8px">${o("pr", ".15", "Conservador (exercício ≤ 15%)", RRD.pr === 0.15)}${o("pr", ".25", "Moderado (≤ 25%)", RRD.pr === 0.25)}${o("pr", ".4", "Agressivo (≤ 40%)", RRD.pr === 0.4)}</div>
${
  e.length
    ? e
        .slice(0, 8)
        .map((s, n) => {
          const r = rrdBal(s);
          return `<div class="card rrdc"><div class="top"><b>${n + 1}. ${esc(s.row.ativo)} · ${s.x.t === "C" ? "call" : "put"} ${opN(s.x.k)}</b><span class="sm mut">${esc(s.x.c)} · vence ${esc(fmtD(s.venc).slice(0, 5))} (${s.dias} d)</span></div>
<div class="rrdg"><div><small>Prêmio</small><b class="mono">R$ ${opN(s.x.p)}</b><i>${a(s.ret)} no período</i></div><div><small>Ao ano</small><b class="mono g">${a(s.an)}</b><i>${s.xc != null ? s.xc.toFixed(1).replace(".", ",") + "× o CDI" : ""}</i></div><div><small>Chance de exercício</small><b class="mono ${s.pe > 0.3 ? "r" : s.pe > 0.15 ? "am" : "g"}">${Math.round(s.pe * 100)}%</b><i>strike ${s.dist > 0 ? "+" : ""}${a(s.dist)} do preço</i></div><div><small>IV Rank</small><b class="mono">${s.rk.rank != null ? Math.round(s.rk.rank * 100) + "%" : "–"}</b><i>${s.rk.rank != null ? (s.rk.rank > 0.6 ? "vol cara: bom para vender" : s.rk.rank < 0.3 ? "vol barata" : "na média") : "coletando"}</i></div></div>
${s.x.t === "C" ? `<div class="sm" style="color:var(--mut)">Se for exercida: ${a(s.retEx)} no período (prêmio + alta até o strike). Capital: ${money(s.cap)} por lote de 100.</div>` : `<div class="sm" style="color:var(--mut)">Se for exercida, você compra ${esc(s.row.ativo)} a ${opN(s.x.k)} − prêmio = ${opN(s.x.k - s.x.p)} por ação. Capital reservado: ${money(s.cap)} por lote de 100.</div>`}
${r ? `<div class="warn sm" style="margin-top:6px">📑 Balanço em ${esc(fmtD(r.d))}, antes do vencimento: risco de salto no preço.</div>` : ""}
<button class="btn s" data-rrdm="${n}" style="width:100%;margin-top:8px">Montar esta operação</button></div>`;
        })
        .join("")
    : `<div class="card sm" style="color:var(--mut)">Nenhuma opção passou no filtro agora. ${OPG.rows && OPG.rows.length ? "Fora do pregão quase não há ofertas; tente com o mercado aberto ou um perfil mais agressivo." : "Com a ponte do Profit rodando, a grade chega e o radar se monta sozinho."}</div>`
}
<div class="sm" style="margin:8px 2px;color:var(--mut)">Ordenado pelo retorno anualizado ajustado à chance de exercício (pelo modelo de Black-Scholes, com a volatilidade do Profit). CDI de referência: ${a(t)} ao ano. Só entram séries com negócio hoje ou com ofertas dos dois lados. Estudo, não recomendação.</div>`;
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-rrd]");
  if (t) {
    t.dataset.rrd === "tp" ? (RRD.tp = t.dataset.v) : (RRD.pr = +t.dataset.v);
    try {
      (ls.set("diario-rd-tp", RRD.tp), ls.set("diario-rd-pr", RRD.pr));
    } catch {}
    opgPinta();
    return;
  }
  const a = e.target.closest("[data-rrdm]");
  if (!a) return;
  const o = rrdLista()[+a.dataset.rrdm];
  if (!o) return;
  const s = +o.row.spot,
    n = +o.x.p.toFixed(2),
    r = o.x.t === "C";
  ((AUTO = 0),
    (isNew = 1),
    (QM = 0),
    (T = {
      id: Date.now().toString(36),
      tipo: "O",
      dt: loc().slice(0, 16),
      ativo: o.x.c,
      sub: o.row.ativo,
      side: "V",
      ot: o.x.t,
      strike: String(o.x.k),
      venc: o.venc,
      spot: String(s),
      entry: String(n),
      stop: "",
      target: "",
      exit: "",
      qty: "100",
      pv: "1",
      rules: "",
      err: "Nenhum",
      estr: r ? "Venda coberta de call" : "Venda de put",
      legs: r
        ? [
            { id: "l0", tp: "A", lado: "C", pr: s, q: 100 },
            {
              id: "l1",
              tp: "C",
              lado: "V",
              k: o.x.k,
              venc: o.venc,
              pr: n,
              q: 100,
            },
          ]
        : [
            {
              id: "l0",
              tp: "P",
              lado: "V",
              k: o.x.k,
              venc: o.venc,
              pr: n,
              q: 100,
            },
          ],
    }),
    (orig = {}),
    showSheet());
}),
  (function () {
    const e = TraderStyles.slot("legacy-038");
    ((e.textContent = TraderStyles.css("legacy-038")), TraderStyles.mount(e));
  })());
try {
  typeof NP < "u" &&
    NP.on &&
    NP.on.opciv === void 0 &&
    ((NP.on.opciv = !0), ls.set("diario-np", NP));
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("opciv", "📈 Opções: volatilidade cara (IV Rank acima de 80%)")}<div class="sm mut" style="margin-bottom:8px">Avisa no pregão quando a volatilidade de PETR4, VALE3 e dos outros ativos da grade fica perto da máxima do seu histórico (precisa de 20 dias de histórico) e quando uma opção chega no preço do seu alerta.</div>`
    );
  };
}
function opIvResumo() {
  const e = {};
  return (
    Object.entries(S.ivh || {}).forEach(([t, a]) => {
      const o = Object.values(a || {}).filter((s) => s > 0);
      o.length &&
        (e[t] = { mn: Math.min(...o), mx: Math.max(...o), n: o.length });
    }),
    e
  );
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      ((t.opa = (S.opa || []).slice(0, 20)), (t.ivh = opIvResumo()));
    } catch {}
    return t;
  };
}
const opaSync = () => {
  try {
    turnoPushSync(!0);
  } catch {}
};
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-opnovo]");
    if (!t || !OPG.alerta) return;
    (e.stopImmediatePropagation(), e.preventDefault());
    const a = t.dataset.opnovo,
      o = (OPG.rows || []).find((l) => (l.series || []).some((d) => d.c === a)),
      s =
        o &&
        opgSeries(o, (o.series.find((l) => l.c === a) || {}).m).find(
          (l) => l.c === a,
        ),
      n = s && s.p != null ? +s.p.toFixed(2) : null,
      r = prompt(
        `Avisar quando ${a} chegar a quanto (R$)?${n != null ? " Agora: " + opN(n) : ""}`,
        n != null ? String(n).replace(".", ",") : "",
      );
    if (r == null) return;
    const i = +String(r).replace(/\./g, "").replace(",", ".");
    if (!(i > 0)) {
      toast("Valor inválido");
      return;
    }
    ((S.opa ?? (S.opa = [])).push({
      c: a,
      op: n != null && i < n ? "<=" : ">=",
      v: i,
      d: loc().slice(0, 10),
    }),
      (S.opa = S.opa.slice(-20)),
      save(),
      opaSync(),
      toast(
        `Alerta criado: ${a} ${n != null && i < n ? "≤" : "≥"} R$ ${opN(i)}`,
      ),
      (OPG.alerta = !1),
      opgPinta());
  },
  !0,
),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-opal]");
    if (!t) return;
    const a = t.dataset.opal;
    if (a === "modo") {
      ((OPG.alerta = !OPG.alerta), opgPinta());
      return;
    }
    ((S.opa = (S.opa || []).filter((o, s) => s !== +a)),
      save(),
      opaSync(),
      opgPinta());
  }));
{
  const e = opgHtml;
  opgHtml = function () {
    const t = e.apply(this, arguments);
    try {
      if (!(OPG.rows || []).length || (GXV.vw && GXV.vw !== "grade")) return t;
      const a = S.opa || [],
        o = `<div class="opal"><button class="btn s${OPG.alerta ? " on" : ""}" data-opal="modo" style="width:100%">${OPG.alerta ? "Toque numa opção da tabela para criar o alerta (ou toque aqui para cancelar)" : "🔔 Criar alerta de preço de uma opção"}</button>${a.length ? `<div class="sm" style="margin-top:6px">${a.map((s, n) => `<div class="cnt"><span>${esc(s.c)} ${s.op === "<=" ? "≤" : "≥"} R$ ${opN(s.v)}</span><button class="x" data-opal="${n}" aria-label="Apagar alerta">✕</button></div>`).join("")}</div>` : ""}</div>`;
      return t.replace(
        '<div style="overflow-x:auto;margin-top:8px"><table class="opgt">',
        o + '<div style="overflow-x:auto;margin-top:8px"><table class="opgt">',
      );
    } catch {
      return t;
    }
  };
}
((GOR.renda = () => {
  tab === "mercado" &&
    ((GO.r = null), (MKT.tab = "opc"), (GXV.vw = "renda"), render());
}),
  (GOR.opc = () => {
    tab === "mercado" &&
      ((GO.r = null), (MKT.tab = "opc"), (GXV.vw = "grade"), render());
  }),
  (function () {
    const e = TraderStyles.slot("legacy-039");
    ((e.textContent = TraderStyles.css("legacy-039")), TraderStyles.mount(e));
  })());
function mesNum(e, t) {
  const a = S.trades
      .map((I) => ({ ...I, c: calc(I) }))
      .filter((I) => {
        const J = String(I.dtx || I.dt).slice(0, 10);
        return J >= e && J <= t && I.c.pl != null;
      })
      .concat(typeof fxPer == "function" ? fxPer(e, t) : []),
    o = (I) => emBRL(I.c.pl, moedaT(I)),
    s = a.map(o),
    n = a.length,
    r = s.filter((I) => I > 0).reduce((I, J) => I + J, 0),
    i = -s.filter((I) => I < 0).reduce((I, J) => I + J, 0),
    l = s.reduce((I, J) => I + J, 0),
    d = a
      .slice()
      .sort((I, J) =>
        String(I.dtx || I.dt).localeCompare(String(J.dtx || J.dt)),
      );
  let c = 0,
    p = 0,
    u = 0;
  d.forEach((I) => {
    ((c += o(I)), (p = Math.max(p, c)), (u = Math.min(u, c - p)));
  });
  const m = {};
  a.forEach((I) => {
    const J = String(I.dtx || I.dt).slice(0, 10);
    m[J] = (m[J] || 0) + o(I);
  });
  const f = Object.values(m),
    x = {};
  a.forEach((I) => {
    (typeof tagsDe == "function"
      ? tagsDe(I)
      : I.err && I.err !== "Nenhum"
        ? [I.err]
        : []
    ).forEach((J) => {
      (x[J] ?? (x[J] = { n: 0, pl: 0 }), x[J].n++, (x[J].pl += o(I)));
    });
  });
  const v = {};
  a.forEach((I) => {
    const J = I.setup || "(sem setup)";
    (v[J] ?? (v[J] = { n: 0, pl: 0, w: 0 }),
      v[J].n++,
      (v[J].pl += o(I)),
      o(I) > 0 && v[J].w++);
  });
  const g = {};
  a.forEach((I) => {
    const J = I.forex
      ? "Forex"
      : { D: "Day trade", S: "Swing", O: "Opções" }[I.tipo || "D"] || "Outros";
    (g[J] ?? (g[J] = { n: 0, pl: 0 }), g[J].n++, (g[J].pl += o(I)));
  });
  const h = [];
  for (let I = e; I <= t && I <= ymd(new Date()); I = addD(I, 1)) {
    const J = new Date(I + "T12:00:00").getDay();
    J > 0 && J < 6 && h.push(I);
  }
  const b = h.filter((I) => {
      try {
        return prepDe(S.days[I] || {}, "m").feita;
      } catch {
        return !1;
      }
    }).length,
    y = a.filter(
      (I) => (I.tipo || "D") === "O" && typeof opCapital == "function",
    ),
    j = y
      .map((I) => ({
        pl: o(I),
        cap: opCapital(I),
        d: Math.max(1, opDias(I.dt, String(I.dtx).slice(0, 10))),
      }))
      .filter((I) => I.cap > 0),
    k = Math.exp(opR()) - 1,
    A = S.cnpi || {},
    C = (A.sims || []).filter((I) => {
      const J = new Date(I.d).toISOString().slice(0, 10);
      return J >= e && J <= t;
    });
  return {
    a: e,
    b: t,
    n,
    P: l,
    acerto: n ? s.filter((I) => I > 0).length / n : null,
    pf: i > 0 ? r / i : null,
    med: n ? l / n : null,
    maior: n ? Math.max(...s) : null,
    menor: n ? Math.min(...s) : null,
    dd: u,
    diasPos: f.filter((I) => I > 0).length,
    diasNeg: f.filter((I) => I < 0).length,
    regras: n ? a.filter((I) => I.rules !== "n").length / n : null,
    erros: Object.entries(x).sort((I, J) => I[1].pl - J[1].pl),
    setups: Object.entries(v).sort((I, J) => J[1].pl - I[1].pl),
    tipos: g,
    util: h.length,
    prep: b,
    renda: j.length
      ? {
          pl: j.reduce((I, J) => I + J.pl, 0),
          cdi: j.reduce(
            (I, J) => I + J.cap * (Math.pow(1 + k, J.d / 365) - 1),
            0,
          ),
          n: j.length,
        }
      : null,
    sims: C.length,
    simOk: C.filter((I) => I.ac >= Math.ceil((40 * I.tot) / 60)).length,
  };
}
function mesAnterior(e) {
  const t = new Date(e + "T12:00:00"),
    a = new Date(t.getFullYear(), t.getMonth() - 1, 1),
    o = new Date(t.getFullYear(), t.getMonth(), 0);
  return [ymd(a), ymd(o)];
}
const mesNome = (e) =>
  new Date(e + "T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
function mesDelta(e, t, a, o) {
  if (e == null || t == null) return "";
  const s = e - t;
  return Math.abs(s) < 1e-9
    ? '<span class="mut">= mês anterior</span>'
    : `<span class="${(o ? s < 0 : s > 0) ? "g" : "r"}">${s > 0 ? "▲" : "▼"} ${a(Math.abs(s))}</span> <span class="mut">vs mês anterior</span>`;
}
function relMesHtml(e, t, a) {
  const o = mesNum(e, t),
    [s, n] = mesAnterior(e),
    r = mesNum(s, n),
    i = (S.relmes || {})[a],
    l = (c) => (c == null ? "–" : Math.round(c * 100) + "%"),
    d = (c, p, u, m) =>
      `<div class="card" style="margin:0;padding:8px 10px"><div class="sm mut">${c}</div><b class="${u || ""}">${p}</b>${m ? `<div class="sm">${m}</div>` : ""}</div>`;
  return `<section class="card" id="relmes" style="padding:14px;margin-bottom:12px"><div class="top"><b style="font-size:18px">📊 Fechamento de ${esc(mesNome(e))}</b><button class="btn s" data-mespdf="${a}">PDF</button></div>
${
  o.n
    ? `<div class="g2" style="gap:8px;margin:8px 0">${d(
        "Resultado",
        money(o.P),
        cls(o.P),
        mesDelta(o.P, r.n ? r.P : null, (c) => money(c)),
      )}${d(
        "Operações",
        o.n,
        "",
        mesDelta(o.n, r.n || null, (c) => String(Math.round(c))),
      )}${d(
        "Acerto",
        l(o.acerto),
        "",
        mesDelta(o.acerto, r.acerto, (c) => Math.round(c * 100) + " pp"),
      )}${d("Fator de lucro", o.pf != null ? o.pf.toFixed(2).replace(".", ",") : "–", o.pf != null ? (o.pf >= 1 ? "g" : "r") : "")}
${d(
  "Seguiu as regras",
  l(o.regras),
  "",
  mesDelta(o.regras, r.regras, (c) => Math.round(c * 100) + " pp"),
)}${d("Maior recuo no mês", money(o.dd), o.dd < 0 ? "r" : "")}${d("Dias positivos × negativos", o.diasPos + " × " + o.diasNeg)}${d("Preparação da manhã", o.prep + " de " + o.util + " dias úteis")}</div>
<div style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th>Modalidade</th><th>Ops.</th><th>Resultado</th></tr>${Object.entries(
        o.tipos,
      )
        .map(
          ([c, p]) =>
            `<tr><td>${esc(c)}</td><td>${p.n}</td><td class="${cls(p.pl)}">${money(p.pl)}</td></tr>`,
        )
        .join("")}</table></div>
${o.setups.length ? `<div class="sm" style="margin-top:8px">Melhor setup: <b>${esc(o.setups[0][0])}</b> <span class="${cls(o.setups[0][1].pl)}">${money(o.setups[0][1].pl)}</span>${o.setups.length > 1 ? ` · Pior: <b>${esc(o.setups[o.setups.length - 1][0])}</b> <span class="${cls(o.setups[o.setups.length - 1][1].pl)}">${money(o.setups[o.setups.length - 1][1].pl)}</span>` : ""}</div>` : ""}
${
  o.erros.length
    ? `<div class="sm" style="margin-top:4px">Erros mais caros: ${o.erros
        .slice(0, 3)
        .map(
          ([c, p]) =>
            `<b>${esc(c)}</b> (${p.n}x, <span class="${cls(p.pl)}">${money(p.pl)}</span>)`,
        )
        .join(
          " · ",
        )}${r.erros.length ? ` <span class="mut">· mês anterior: ${r.erros.reduce((c, p) => c + p[1].n, 0)} erros, agora ${o.erros.reduce((c, p) => c + p[1].n, 0)}</span>` : ""}</div>`
    : '<div class="sm g" style="margin-top:4px">Nenhum erro marcado no mês 👏</div>'
}
${o.renda ? `<div class="sm" style="margin-top:4px">Renda com opções: <b class="${cls(o.renda.pl)}">${money(o.renda.pl)}</b> em ${o.renda.n} operação(ões); o CDI teria rendido ${money(o.renda.cdi)} no mesmo capital e prazo.</div>` : ""}`
    : '<p class="mut sm">Sem operações encerradas neste mês.</p>'
}
${o.sims ? `<div class="sm" style="margin-top:4px">CNPI-T: ${o.sims} simulado(s) no mês, ${o.simOk} com nota de aprovação.</div>` : ""}
<div style="margin-top:10px"><div class="top"><b class="sm">🧭 Comentário da IA</b><button class="btn s" data-mesia="${a}"${o.n ? "" : " disabled"}>${i ? "↻ Refazer" : "Gerar"}</button></div><div id="mesbox">${i ? coachHtml(i, "📌 Para o próximo mês") : '<div class="sm mut">A IA compara o mês com o anterior e aponta o que mudou, os padrões e o foco para o próximo mês.</div>'}</div></div></section>`;
}
async function mesIA(e) {
  if (COACH.busy) return;
  COACH.busy = "m";
  const [t, a] = rng(RP),
    o = mesNum(t, a),
    [s, n] = mesAnterior(t),
    r = mesNum(s, n),
    i = document.getElementById("mesbox");
  i && (i.innerHTML = '<div class="sm mut">A IA está lendo o seu mês…</div>');
  const l = (p) => ({
      ...p,
      erros: p.erros
        .slice(0, 6)
        .map(([u, m]) => ({
          erro: u,
          vezes: m.n,
          resultado: Math.round(m.pl),
        })),
      setups: p.setups
        .slice(0, 8)
        .map(([u, m]) => ({
          setup: u,
          ops: m.n,
          acertos: m.w,
          resultado: Math.round(m.pl),
        })),
    }),
    d = S.trades
      .map((p) => ({ ...p, c: calc(p) }))
      .filter((p) => {
        const u = String(p.dtx || p.dt).slice(0, 10);
        return u >= t && u <= a && p.c.pl != null;
      })
      .slice(0, 150)
      .map((p) => ({
        data: String(p.dt).slice(0, 16),
        ativo: p.ativo,
        tipo: p.tipo || "D",
        lado: p.side,
        setup: p.setup || "",
        r: p.c.r != null ? +p.c.r.toFixed(2) : null,
        resultado: Math.round(emBRL(p.c.pl, moedaT(p))),
        regras: p.rules,
        erro: p.err || "",
        conviccao: p.conv || "",
      }));
  try {
    const p = await anxCall({
      modo: "coach",
      periodo: "mes",
      dados: {
        mes: mesNome(t),
        este_mes: l(o),
        mes_anterior: l(r),
        operacoes: d,
        regras_escritas: S.rules.map((u) => u.t).slice(0, 25),
      },
    });
    (((S.relmes ?? (S.relmes = {}))[e] = p), save());
  } catch (p) {
    toast(String(p.message || p));
  }
  COACH.busy = "";
  const c = document.getElementById("relmes");
  if (c) {
    const [p, u, m] = rng(RP);
    c.outerHTML = relMesHtml(p, u, m);
  }
}
async function mesPdf() {
  const [e, t, a] = rng(RP),
    o = mesNum(e, t),
    [s, n] = mesAnterior(e),
    r = mesNum(s, n),
    i = (S.relmes || {})[a],
    l = document.getElementById("pdfov");
  l && l.remove();
  const d = (PDFB = {
      tt: "Fechamento de " + mesNome(e),
      busy: 1,
      blob: null,
      msg: "Montando o PDF…",
      name: "fechamento-" + e.slice(0, 7) + ".pdf",
    }),
    c = document.createElement("div");
  ((c.id = "pdfov"),
    (c.innerHTML =
      '<div class="pvbar" id="pdfbar"></div><div id="pdfst"></div><div id="pdfprev"></div>'),
    c.addEventListener("click", (p) => {
      const u = p.target.closest("[data-pv]");
      u &&
        (u.dataset.pv === "x"
          ? pdfClose()
          : u.dataset.pv === "s" && pdfShare());
    }),
    document.body.appendChild(c),
    (document.body.style.overflow = "hidden"),
    pdfBar());
  try {
    const p = await rpLib(),
      u = await rpNovo(p, {
        titulo: "Fechamento de " + mesNome(e),
        tipo: "Relatório mensal",
        cabecalho: "Fechamento de " + mesNome(e),
        data: new Date().toLocaleDateString("pt-BR"),
      }),
      m = u.C,
      f = (g) => (g == null ? "–" : Math.round(g * 100) + "%"),
      x = (g) => rpTx(money(g));
    (rpCapa(u, {
      tipo: "Relatório mensal",
      titulo: "Fechamento do mês",
      sub: mesNome(e) + " · " + o.n + " operações",
      data: "Gerado em " + rpAgora(),
    }),
      u.h2(
        "Números do mês",
        "Comparação com " + mesNome(s) + " entre parênteses.",
      ),
      u.kpis([
        {
          l: "RESULTADO",
          v: x(o.P),
          c: o.P >= 0 ? m.g : m.r,
          d: "(" + x(r.P) + ")",
        },
        { l: "OPERAÇÕES", v: String(o.n), d: "(" + r.n + ")" },
        { l: "ACERTO", v: f(o.acerto), d: "(" + f(r.acerto) + ")" },
        {
          l: "FATOR DE LUCRO",
          v: o.pf != null ? o.pf.toFixed(2).replace(".", ",") : "–",
          d:
            "(" +
            (r.pf != null ? r.pf.toFixed(2).replace(".", ",") : "–") +
            ")",
        },
        { l: "SEGUIU AS REGRAS", v: f(o.regras), d: "(" + f(r.regras) + ")" },
        { l: "MAIOR RECUO", v: x(o.dd), c: m.r },
        { l: "DIAS + / −", v: o.diasPos + " / " + o.diasNeg },
        {
          l: "PREPARAÇÃO",
          v: o.prep + "/" + o.util,
          d: "manhãs com rotina feita",
        },
      ]),
      Object.keys(o.tipos).length &&
        (u.h2("Por modalidade"),
        u.tab(
          [
            { l: "Modalidade", w: 3 },
            { l: "Operações", w: 1.3, al: "r" },
            { l: "Resultado", w: 2, al: "r" },
          ],
          Object.entries(o.tipos).map(([g, h]) => [
            g,
            h.n,
            { t: money(h.pl), c: h.pl >= 0 ? m.g : m.r },
          ]),
        )),
      o.setups.length &&
        (u.h2("Por setup"),
        u.tab(
          [
            { l: "Setup", w: 3 },
            { l: "Ops.", w: 1, al: "r" },
            { l: "Acertos", w: 1.2, al: "r" },
            { l: "Resultado", w: 2, al: "r" },
          ],
          o.setups
            .slice(0, 10)
            .map(([g, h]) => [
              g,
              h.n,
              h.w,
              { t: money(h.pl), c: h.pl >= 0 ? m.g : m.r },
            ]),
        )),
      o.erros.length &&
        (u.h2("Erros do mês"),
        u.tab(
          [
            { l: "Erro", w: 4 },
            { l: "Vezes", w: 1, al: "r" },
            { l: "Resultado", w: 2, al: "r" },
          ],
          o.erros
            .slice(0, 10)
            .map(([g, h]) => [
              g,
              h.n,
              { t: money(h.pl), c: h.pl >= 0 ? m.g : m.r },
            ]),
        )),
      o.renda &&
        (u.h2("Renda com opções"),
        u.para(
          `Resultado ${money(o.renda.pl)} em ${o.renda.n} operação(ões). O CDI teria rendido ${money(o.renda.cdi)} no mesmo capital e prazo.`,
        )),
      i &&
        (u.h2("Comentário da IA"),
        i.resumo && u.para(i.resumo),
        (i.pontos_fortes || []).length &&
          (u.h3("Pontos fortes"), u.bul(i.pontos_fortes)),
        (i.a_melhorar || []).length &&
          (u.h3("A melhorar"), u.bul(i.a_melhorar)),
        (i.padroes || []).length && (u.h3("Padrões"), u.bul(i.padroes)),
        (i.plano || []).length && (u.h3("Para o próximo mês"), u.bul(i.plano)),
        i.nota_disciplina != null &&
          u.para(
            "Nota de disciplina: " +
              String(i.nota_disciplina).replace(".", ",") +
              " de 10.",
          )),
      rpRodape(u));
    const v = await u.doc.save();
    if (PDFB !== d) return;
    ((d.blob = new Blob([v], { type: "application/pdf" })),
      (d.busy = 0),
      (d.msg = 'PDF pronto. Toque em "Salvar / compartilhar".'),
      pdfBar(),
      rpPrevia(v));
  } catch (p) {
    if ((console.error(p), PDFB !== d)) return;
    (c.remove(),
      (PDFB = null),
      (document.body.style.overflow = ""),
      toast("Não consegui montar o PDF: " + (p.message || p), 4e3));
  }
}
{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    try {
      if (typeof RP == "string" && RP[0] === "m") {
        const [a, o, s] = rng(RP);
        return (
          GO &&
            GO.r === "relmes" &&
            !(S.relmes || {})[s] &&
            setTimeout(() => mesIA(s), 400),
          t.replace(
            /(<\/label><div class="mut sm"[^>]*>[^<]*<\/div>)/,
            "$1" + relMesHtml(a, o, s),
          )
        );
      }
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-mesia]");
  if (t) return mesIA(t.dataset.mesia);
  e.target.closest("[data-mespdf]") && mesPdf();
}),
  (GOR.relmes = () => {
    if (tab === "rev" && RP === "m1") return;
    ((RP = "m1"), irPara("rev"));
    const e = document.getElementById("relmes");
    e && setTimeout(() => e.scrollIntoView({ behavior: "smooth" }), 200);
  }));
var RPY = {
  tk: "",
  tf: "5m",
  dados: null,
  dia: "",
  i: 0,
  ini: 0,
  pos: null,
  busy: 0,
  err: "",
  cego: 1,
  msg: "",
};
const rpyDia = (e) => new Date((e - 3 * 3600) * 1e3).toISOString().slice(0, 10),
  rpyHora = (e) => new Date((e - 3 * 3600) * 1e3).toISOString().slice(11, 16);
function rpyS() {
  return S.replay ?? (S.replay = []);
}
function rpyAtivos() {
  const e = {};
  return (
    S.trades.slice(-200).forEach((t) => {
      t.ativo && !t.forex && (e[String(t.ativo).toUpperCase()] = 1);
    }),
    Object.keys(e)
      .slice(0, 8)
      .concat(["WIN", "PETR4", "VALE3"])
      .filter((t, a, o) => o.indexOf(t) === a)
      .slice(0, 10)
  );
}
function rpyDias() {
  const e = (RPY.dados || {}).candles || [],
    t = [];
  return (
    e.forEach((a) => {
      const o = rpyDia(a[0]);
      t.includes(o) || t.push(o);
    }),
    t
  );
}
async function rpyCarrega() {
  const e = cfg(),
    t = (RPY.tk || "").toUpperCase().trim();
  if (!t) {
    toast("Escolha o ativo.");
    return;
  }
  if (!e) {
    ((RPY.err = "Configure o Supabase na aba Conta."), render());
    return;
  }
  ((RPY.busy = 1), (RPY.err = ""), render());
  try {
    const a = await fetch(e.url + "/functions/v1/candles", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: e.key },
        body: JSON.stringify({ ativo: t, intervalo: RPY.tf }),
      }),
      o = await a.json();
    if (!a.ok) throw new Error(o.error || "Erro " + a.status);
    if (!(o.candles || []).length)
      throw new Error("Sem candles para esse ativo.");
    RPY.dados = o;
    const s = rpyDias().slice(1, -1);
    if (!s.length) throw new Error("Histórico curto demais para o replay.");
    rpyComeca(s[Math.floor(Math.random() * s.length)]);
  } catch (a) {
    ((RPY.err = String(a.message || a)), (RPY.dados = null));
  }
  ((RPY.busy = 0), render());
}
function rpyComeca(e) {
  const t = RPY.dados.candles;
  ((RPY.dia = e),
    (RPY.ini = t.findIndex((a) => rpyDia(a[0]) === e)),
    (RPY.i = RPY.ini),
    (RPY.pos = null),
    (RPY.msg = ""),
    (RPY.ops = []));
}
function rpyFimDia() {
  const e = RPY.dados.candles;
  let t = RPY.i;
  for (; t + 1 < e.length && rpyDia(e[t + 1][0]) === RPY.dia; ) t++;
  return t;
}
function rpyAvanca(e) {
  if (!RPY.dados) return;
  const t = RPY.dados.candles,
    a = rpyFimDia();
  for (let o = 0; o < e && RPY.i < a; o++) {
    RPY.i++;
    const s = RPY.pos;
    if (!s) continue;
    const n = t[RPY.i],
      r = s.lado === "C",
      i = r ? n[3] <= s.st : n[2] >= s.st,
      l = s.al != null && (r ? n[2] >= s.al : n[3] <= s.al);
    if (i || l) {
      rpyFecha(i ? s.st : s.al, i ? "stop" : "alvo");
      break;
    }
  }
  (RPY.i >= a && RPY.pos && rpyFecha(t[a][4], "fim do dia"), render());
}
function rpyFecha(e, t) {
  const a = RPY.pos;
  if (!a) return;
  const o = a.lado === "C" ? e - a.e : a.e - e,
    s = Math.abs(a.e - a.st),
    n = s > 0 ? o / s : null,
    r = {
      d: RPY.dia,
      a: RPY.tk.toUpperCase(),
      tf: RPY.tf,
      lado: a.lado,
      e: a.e,
      st: a.st,
      al: a.al,
      sai: e,
      pts: +o.toFixed(4),
      r: n != null ? +n.toFixed(2) : null,
      mot: t,
      he: a.h,
      hs: rpyHora(RPY.dados.candles[RPY.i][0]),
      ts: Date.now(),
    };
  (rpyS().push(r),
    S.replay.length > 300 && S.replay.splice(0, S.replay.length - 300),
    (RPY.ops ?? (RPY.ops = [])).push(r),
    (RPY.pos = null),
    (RPY.msg = `${t === "stop" ? "🛑 Stop" : t === "alvo" ? "🎯 Alvo" : "⏹ Encerrado"}: ${o >= 0 ? "+" : ""}${rpyFmt(o)} pts${n != null ? " (" + (n >= 0 ? "+" : "") + n.toFixed(2).replace(".", ",") + "×)" : ""}`),
    save());
}
const rpyFmt = (e) =>
  (+e).toLocaleString("pt-BR", {
    maximumFractionDigits: Math.abs(e) >= 1e3 ? 0 : 2,
  });
function rpyEntra(e) {
  const t = RPY.dados.candles,
    a = t[RPY.i],
    o = a[4],
    s = (d) => {
      const c = document.getElementById(d);
      return c && c.value !== "" ? +String(c.value).replace(",", ".") : null;
    };
  let n = s("rpyst"),
    r = s("rpyal");
  const i = t.slice(Math.max(RPY.ini - 30, 0), RPY.i + 1),
    l =
      i.slice(-14).reduce((d, c) => d + (c[2] - c[3]), 0) /
      Math.min(14, i.length);
  if (
    (n == null && (n = e === "C" ? o - 1.5 * l : o + 1.5 * l),
    e === "C" ? n >= o : n <= o)
  ) {
    toast(
      "O stop precisa ficar " +
        (e === "C" ? "abaixo" : "acima") +
        " da entrada.",
    );
    return;
  }
  if (r != null && (e === "C" ? r <= o : r >= o)) {
    toast(
      "O alvo precisa ficar " +
        (e === "C" ? "acima" : "abaixo") +
        " da entrada.",
    );
    return;
  }
  ((RPY.pos = {
    lado: e,
    e: o,
    st: +n.toFixed(4),
    al: r != null ? +r.toFixed(4) : null,
    h: rpyHora(a[0]),
    i0: RPY.i,
  }),
    (RPY.msg = ""),
    render());
}
function rpyInd() {
  return Object.assign(
    { m9: 1, m20: 1, vw: 1, vol: 1 },
    (S.ax || {}).rpyInd || {},
  );
}
function rpyCalc() {
  const e = RPY.dados;
  if (e._calc) return e._calc;
  const t = e.candles,
    a = t.length,
    o = [],
    s = [],
    n = [];
  let r = null,
    i = 0,
    l = 0,
    d = 0,
    c = "";
  for (let p = 0; p < a; p++) {
    const u = t[p];
    ((r = r == null ? u[4] : r + ((u[4] - r) * 2) / 10),
      o.push(p >= 8 ? r : null),
      (i += u[4]),
      p >= 20 && (i -= t[p - 20][4]),
      s.push(p >= 19 ? i / 20 : null));
    const m = rpyDia(u[0]);
    m !== c && ((l = 0), (d = 0), (c = m));
    const f = (u[2] + u[3] + u[4]) / 3;
    ((l += f * (u[5] || 0)),
      (d += u[5] || 0),
      n.push(d > 0 && RPY.tf !== "60m" ? l / d : null));
  }
  return (e._calc = { e9: o, m20: s, vw: n });
}
function rpySvg() {
  const e = RPY.dados.candles,
    t = Math.max(0, RPY.i - 59),
    a = e.slice(t, RPY.i + 1),
    o = RPY.pos,
    s = RPY.trade,
    n = rpyInd(),
    r = rpyCalc(),
    i = 340,
    l = 200,
    d = 4,
    c = n.vol ? 30 : 0,
    p = l - c,
    u = [];
  s &&
    RPY.i >= s.ti &&
    (u.push(s.e, s.st),
    s.al != null && u.push(s.al),
    RPY.i >= s.tx && u.push(s.sai));
  let m = Math.max(...a.map((C) => C[2]), ...u),
    f = Math.min(...a.map((C) => C[3]), ...u);
  o &&
    ((m = Math.max(m, o.st, o.al ?? o.e, o.e)),
    (f = Math.min(f, o.st, o.al ?? o.e, o.e)));
  const x = m - f || 1,
    v = (C) => d + ((m - C) / x) * (p - 2 * d),
    g = i / 60,
    h = (C) => (C - t) * g + g / 2,
    b = Math.max(1, ...a.map((C) => C[5] || 0));
  let y = "";
  a.forEach((C, I) => {
    const J = I * g + g / 2,
      se = C[4] >= C[1],
      Ie = se ? "var(--g,#2e8b5d)" : "var(--r,#dc3e26)",
      Pe =
        t + I === RPY.ini
          ? `<line x1="${J - g / 2}" x2="${J - g / 2}" y1="0" y2="${l}" stroke="var(--mut)" stroke-dasharray="2 3" stroke-width=".6"/>`
          : "";
    (n.vol &&
      C[5] &&
      (y += `<rect x="${J - g * 0.35}" y="${l - (C[5] / b) * (c - 4)}" width="${g * 0.7}" height="${(C[5] / b) * (c - 4)}" fill="${Ie}" opacity=".35"/>`),
      (y +=
        Pe +
        `<line x1="${J}" x2="${J}" y1="${v(C[2])}" y2="${v(C[3])}" stroke="${Ie}" stroke-width="1"/><rect x="${J - g * 0.35}" y="${Math.min(v(C[1]), v(C[4]))}" width="${g * 0.7}" height="${Math.max(1, Math.abs(v(C[1]) - v(C[4])))}" fill="${Ie}"/>`));
  });
  const j = (C, I, J) => {
    let se = "";
    for (let Ie = t; Ie <= RPY.i; Ie++) {
      const Pe = C[Ie];
      Pe == null ||
        Pe > m ||
        Pe < f ||
        (se += (se ? "L" : "M") + h(Ie).toFixed(1) + " " + v(Pe).toFixed(1));
    }
    return se
      ? `<path d="${se}" fill="none" stroke="${I}" stroke-width="${J}"/>`
      : "";
  };
  (n.m9 && (y += j(r.e9, "#c2943e", 1.2)),
    n.m20 && (y += j(r.m20, "#709bc2", 1.2)),
    n.vw && (y += j(r.vw, "#afa99d", 1.2)));
  const k = (C, I, J) =>
    `<line x1="0" x2="${i}" y1="${v(C)}" y2="${v(C)}" stroke="${I}" stroke-width="1" stroke-dasharray="4 3"/><text x="${i - 2}" y="${v(C) - 2}" font-size="8.5" text-anchor="end" fill="${I}">${J} ${rpyFmt(C)}</text>`;
  (o &&
    ((y +=
      k(o.e, "var(--ac,#86abcb)", "entrada") +
      k(o.st, "var(--r,#dc3e26)", "stop")),
    o.al != null && (y += k(o.al, "var(--g,#2e8b5d)", "alvo"))),
    s &&
      RPY.i >= s.ti &&
      ((y +=
        k(s.e, "var(--ac,#86abcb)", "sua entrada") +
        k(s.st, "var(--r,#dc3e26)", "stop")),
      s.al != null && (y += k(s.al, "var(--g,#2e8b5d)", "alvo")),
      s.ti >= t &&
        (y += `<text x="${h(s.ti)}" y="${v(s.e) + (s.lado === "C" ? 12 : -5)}" font-size="11" text-anchor="middle" fill="var(--ac,#86abcb)">${s.lado === "C" ? "▲" : "▼"}</text>`),
      RPY.i >= s.tx &&
        ((y += k(s.sai, "var(--am,#a98136)", "sua saída")),
        s.tx >= t &&
          (y += `<circle cx="${h(s.tx)}" cy="${v(s.sai)}" r="3" fill="var(--am,#a98136)"/>`))));
  const A = [
    n.m9 ? '<tspan fill="#c2943e">MME9</tspan>' : "",
    n.m20 ? '<tspan fill="#709bc2"> MM20</tspan>' : "",
    n.vw && r.vw.some((C) => C != null)
      ? '<tspan fill="#afa99d"> VWAP</tspan>'
      : "",
  ].join("");
  return `<svg viewBox="0 0 ${i} ${l}" style="width:100%;height:auto;background:var(--card2,transparent);border-radius:12px" role="img" aria-label="Gráfico do replay">${y}${A ? `<text x="4" y="10" font-size="8.5">${A}</text>` : ""}</svg>
<div class="rpyind" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${[
    ["m9", "MME 9"],
    ["m20", "MM 20"],
    ["vw", "VWAP"],
    ["vol", "Volume"],
  ]
    .map(
      ([C, I]) =>
        `<button class="chip${n[C] ? " on" : ""}" data-rpyi="${C}" style="font-size:11.5px;${n[C] ? "border-color:var(--ac);color:var(--ac)" : ""}">${I}</button>`,
    )
    .join("")}</div>`;
}
function rpyStats(e) {
  const t = e.length,
    a = e.filter((s) => s.pts > 0).length,
    o = e.filter((s) => s.r != null).map((s) => s.r);
  return {
    n: t,
    ac: t ? a / t : null,
    rm: o.length ? o.reduce((s, n) => s + n, 0) / o.length : null,
    rt: o.reduce((s, n) => s + n, 0),
  };
}
function rpyHtml() {
  const e = rpyS(),
    t = rpyStats(e),
    a = rpyAtivos(),
    o = `<div class="card"><b>▶️ Treino com replay</b><div class="sm" style="color:var(--mut);margin:4px 0 8px">Um pregão passado aparece candle a candle, sem você ver o que vem depois. Decida a entrada, o stop e o alvo como se fosse ao vivo. O resultado sai em pontos e em vezes o risco.</div>
<div class="g2"><label>Ativo<input id="rpytk" list="rpyl" value="${esc(RPY.tk || a[0] || "WIN")}" autocapitalize="characters"><datalist id="rpyl">${a.map((r) => `<option value="${esc(r)}">`).join("")}</datalist></label><label>Tempo gráfico<select id="rpytf">${opt(
      [
        ["5m", "5 minutos (últimos 5 dias)"],
        ["15m", "15 minutos (último mês)"],
        ["60m", "60 minutos (3 meses)"],
      ],
      RPY.tf,
    )}</select></label></div>
<label class="sm" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" id="rpycego" ${RPY.cego ? "checked" : ""} style="width:auto"> Esconder a data (dia surpresa)</label>
<button class="btn" data-rpy="novo" style="margin-top:8px"${RPY.busy ? " disabled" : ""}>${RPY.busy ? "Carregando…" : RPY.dados ? "🎲 Outro dia" : "Começar o replay"}</button>${RPY.err ? `<div class="sm r" style="margin-top:6px">${esc(RPY.err)}</div>` : ""}</div>`;
  let s = "";
  if (RPY.dados && RPY.dia) {
    const r = RPY.dados.candles,
      i = r[RPY.i],
      l = rpyFimDia(),
      d = RPY.pos,
      c = RPY.ops || [],
      p = rpyStats(c);
    s = `<div class="card"><div class="top"><b>${esc(RPY.tk.toUpperCase())} · ${RPY.cego && RPY.i < l ? "dia surpresa" : fmtD(RPY.dia)}</b><span class="sm mut">${rpyHora(i[0])} · ${RPY.i - RPY.ini + 1}/${l - RPY.ini + 1}</span></div>
${rpySvg()}<div class="sm" style="margin:6px 0">Último: <b>${rpyFmt(i[4])}</b> · máx ${rpyFmt(i[2])} · mín ${rpyFmt(i[3])}${RPY.dados.proxy ? ` <span class="mut">(referência ${esc(RPY.dados.simbolo)})</span>` : ""}</div>
${RPY.msg ? `<div class="sm" style="margin:4px 0;font-weight:700">${esc(RPY.msg)}</div>` : ""}
${d ? `<div class="sm">Posição: <b>${d.lado === "C" ? "comprado" : "vendido"}</b> em ${rpyFmt(d.e)} (${d.h}) · resultado agora <b class="${cls(d.lado === "C" ? i[4] - d.e : d.e - i[4])}">${rpyFmt(d.lado === "C" ? i[4] - d.e : d.e - i[4])} pts</b></div><div class="g2" style="margin-top:6px"><button class="btn s" data-rpy="sair">Sair a mercado</button><button class="btn s" data-rpy="be">Stop no zero a zero</button></div>` : RPY.i < l ? `<div class="g2"><label>Stop (vazio = 1,5 × amplitude média)<input id="rpyst" inputmode="decimal"></label><label>Alvo (opcional)<input id="rpyal" inputmode="decimal"></label></div><div class="g2" style="margin-top:6px"><button class="btn s" data-rpy="C" style="background:var(--g,#2e8b5d);color:#ffffff">Comprar ${rpyFmt(i[4])}</button><button class="btn s" data-rpy="V" style="background:var(--r,#dc3e26);color:#ffffff">Vender ${rpyFmt(i[4])}</button></div>` : ""}
${RPY.i < l ? '<div class="g3" style="margin-top:8px"><button class="btn s" data-rpy="p1">▶ 1 candle</button><button class="btn s" data-rpy="p5">⏩ 5</button><button class="btn s" data-rpy="pf">⏭ Fim do dia</button></div>' : `<div class="sm" style="margin-top:8px">Fim do pregão de ${fmtD(RPY.dia)}. Neste dia: ${p.n} operação(ões)${p.n ? `, ${p.rt >= 0 ? "+" : ""}${p.rt.toFixed(2).replace(".", ",")}× no total` : ""}.</div>`}</div>`;
  }
  const n = e.length
    ? `<div class="card"><b>Seu histórico de replay</b><div class="g3" style="gap:8px;margin:8px 0"><div><div class="sm mut">Operações</div><b>${t.n}</b></div><div><div class="sm mut">Acerto</div><b>${t.ac != null ? Math.round(t.ac * 100) + "%" : "–"}</b></div><div><div class="sm mut">Média × risco</div><b class="${cls(t.rm || 0)}">${t.rm != null ? t.rm.toFixed(2).replace(".", ",") : "–"}</b></div></div>
<div style="overflow-x:auto"><table style="width:100%;font-size:12px"><tr><th>Dia</th><th>Ativo</th><th>Lado</th><th>Saída</th><th>× risco</th></tr>${e
        .slice(-12)
        .reverse()
        .map(
          (r) =>
            `<tr><td>${r.d.slice(8, 10)}/${r.d.slice(5, 7)} ${r.he}</td><td>${esc(r.a)} ${r.tf}</td><td>${r.lado === "C" ? "Compra" : "Venda"}</td><td>${esc(r.mot)}</td><td class="${cls(r.pts)}">${r.r != null ? r.r.toFixed(2).replace(".", ",") : rpyFmt(r.pts)}</td></tr>`,
        )
        .join("")}</table></div></div>`
    : "";
  return o + s + n;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-rpy]");
  if (!t) return;
  const a = t.dataset.rpy;
  if (a === "novo") {
    const o = document.getElementById("rpytk"),
      s = document.getElementById("rpytf"),
      n = document.getElementById("rpycego"),
      r = o ? o.value.toUpperCase().trim() : RPY.tk;
    if (
      (n && (RPY.cego = n.checked ? 1 : 0),
      RPY.dados && r === RPY.tk && s && s.value === RPY.tf)
    ) {
      const i = rpyDias()
        .slice(1, -1)
        .filter((l) => l !== RPY.dia);
      if (i.length) {
        (rpyComeca(i[Math.floor(Math.random() * i.length)]), render());
        return;
      }
    }
    ((RPY.tk = r), s && (RPY.tf = s.value), rpyCarrega());
    return;
  }
  if (RPY.dados) {
    if (a === "C" || a === "V") return rpyEntra(a);
    if (a === "sair") {
      (rpyFecha(RPY.dados.candles[RPY.i][4], "saída a mercado"), render());
      return;
    }
    if (a === "be" && RPY.pos) {
      ((RPY.pos.st = RPY.pos.e), render());
      return;
    }
    a === "p1"
      ? rpyAvanca(1)
      : a === "p5"
        ? rpyAvanca(5)
        : a === "pf" && rpyAvanca(9999);
  }
});
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "rpy"
      ? `<h1>Estudos</h1>${((a) => '<div class="seg" style="margin:8px 0 10px"><button data-ep="esv" data-id="liv">📚 Livros</button><button data-ep="esv" data-id="pr">🧩 Prompts</button><button data-ep="esv" data-id="cnpi">🎓 CNPI-T</button><button class="on" data-ep="esv" data-id="rpy">▶️ Replay</button></div>')()}${rpyHtml()}`
      : e
          .apply(this, arguments)
          .replace("🧩 Meus prompts</button>", "🧩 Prompts</button>")
          .replace(
            /(data-id="cnpi">\ud83c\udf93 CNPI-T<\/button>)/,
            '$1<button data-ep="esv" data-id="rpy">▶️ Replay</button>',
          );
  };
}
GOR.replay = () => {
  ((tab = "estudos"), (ESV = "rpy"), render());
};
function mapRs() {
  return S.trades
    .map((e) => ({ t: e, c: calc(e) }))
    .filter((e) => e.c.pl != null && e.c.r != null && isFinite(e.c.r))
    .map((e) => Math.max(-3, Math.min(10, +e.c.r)));
}
function mapSim(e, t, a, o, s, n = 1e3, r = 11) {
  let i = r >>> 0;
  const l = () => (
      (i ^= i << 13),
      (i >>>= 0),
      (i ^= i >>> 17),
      (i ^= i << 5),
      (i >>>= 0),
      i / 4294967296
    ),
    d = +e.meta || 0,
    c = +e.perdaTotal || 0,
    p = +e.perdaDia || 0,
    u = +e.consist || 0,
    m = +e.capDia > 0 && d > 0 ? (d * e.capDia) / 100 : 0,
    f = +e.diasMin || 0,
    x = Math.max(
      1,
      Math.min(60, t.restam != null && t.restam > 0 ? t.restam : 60),
    );
  let v = 0,
    g = 0;
  const h = [],
    b = t.ks.map((y) => t.dias[y]);
  for (let y = 0; y < n; y++) {
    let j = t.saldo,
      k = t.pk,
      A = t.lucroEf,
      C = b.slice(),
      I = 0;
    for (let J = 1; J <= x && !I; J++) {
      let se = 0;
      const Ie = Math.max(0, ...C),
        Pe = u > 0 && d > 0 ? (Math.max(d, j) * u) / 100 : 0,
        Me = m || Pe || 1 / 0;
      for (
        let Be = 0;
        Be < s && !((p > 0 && p + Math.min(se, 0) < o) || se >= Me);
        Be++
      ) {
        const Ge = a[Math.floor(l() * a.length)] * o;
        if (((se += Ge), (j += Ge), e.dd === "trail")) {
          const Ce = e.trava ? Math.min(k - c, 0) : k - c;
          if (c && j <= Ce) {
            I = 2;
            break;
          }
          k = Math.max(k, j);
        } else if (e.dd === "fixo" && c && j <= -c) {
          I = 2;
          break;
        }
        if (p > 0 && se <= -p) {
          I = 2;
          break;
        }
      }
      if (!I && e.dd === "eod" && c) {
        const Be = e.trava ? Math.min(k - c, 0) : k - c;
        j <= Be ? (I = 2) : (k = Math.max(k, j));
      }
      if (I) break;
      (se !== 0 && C.push(se), (A += m && se > m ? m : se));
      const ue = C.filter((Be) => Be > 0),
        ve = e.diasTipo === "op" ? C.length : ue.length,
        he = ue.length ? Math.max(...ue) : 0,
        we = !(u > 0) || (j > 0 && he / j <= u / 100);
      d > 0 && A >= d && ve >= f && we && ((I = 1), h.push(J));
    }
    I === 1 ? v++ : I === 2 && g++;
  }
  return (
    h.sort((y, j) => y - j),
    {
      ap: v / n,
      rp: g / n,
      ab: (n - v - g) / n,
      dias: h.length ? h[Math.floor(h.length / 2)] : null,
      maxD: x,
    }
  );
}
function mapHtml(e) {
  const t = mesaCalc(e),
    a = (b) => mFmt(e, b),
    o = mapRs(),
    s = e.sim || {},
    n = e.moeda === "USD" ? "US$" : "R$";
  if (t.quebra || t.diaQ) return "";
  if (!(+e.meta > 0))
    return '<h2>Chance de aprovação</h2><div class="card sm" style="color:var(--mut)">Preencha a meta de lucro nas regras abaixo para o app calcular a sua chance de passar.</div>';
  if (o.length < 10)
    return `<h2>Chance de aprovação</h2><div class="card sm" style="color:var(--mut)">Precisa de pelo menos 10 trades encerrados com stop no diário (para o app conhecer o seu resultado em vezes o risco). Você tem ${o.length}.</div>`;
  const r = t.ks.length ? t.it.length / t.ks.length : 0,
    i = Math.max(1, Math.min(20, Math.round(+s.tpd || r || 3))),
    l = +e.perdaTotal || +e.meta,
    d = [0.03, 0.05, 0.075, 0.1, 0.15, 0.2].map((b) =>
      Math.max(1, Math.round((l * b) / 5) * 5),
    ),
    c = +s.risco > 0 ? +s.risco : d[2];
  (d.includes(c) || d.push(c), d.sort((b, y) => b - y));
  const p = d.map((b) => ({ v: b, ...mapSim(e, t, o, b, i) })),
    u = p.find((b) => b.v === c),
    m = +s.stopC || 0,
    f = (b) => (m > 0 ? Math.floor(b / m) : null),
    x = p.filter((b) => !m || f(b.v) >= 1),
    v = (x.length ? x : p)
      .slice()
      .sort(
        (b, y) => y.ap - b.ap || b.rp - y.rp || (b.dias ?? 99) - (y.dias ?? 99),
      )[0],
    g = o.reduce((b, y) => b + y, 0) / o.length,
    h = (b) => Math.round(b * 100) + "%";
  return `<h2>Chance de aprovação</h2><div class="card" id="mapc"><div class="sm" style="color:var(--mut)">O app sorteia 1.000 sequências de dias com o seu histórico real (${o.length} trades, média de ${f2(g)}× por trade) e as regras desta mesa, partindo de onde você está hoje. Prazo simulado: ${u.maxD} pregões.</div>
<div class="g3" style="margin:8px 0"><label>Risco por trade (${n})<input type="number" inputmode="decimal" data-msim="risco" value="${c}"></label><label>Trades por dia<input type="number" inputmode="numeric" data-msim="tpd" value="${i}"></label><label>Stop por contrato (${n}, opcional)<input type="number" inputmode="decimal" data-msim="stopC" value="${esc(s.stopC || "")}"></label></div>
<div class="g3" style="gap:8px;text-align:center"><div><div class="sm mut">Aprovar</div><b class="g" style="font-size:22px">${h(u.ap)}</b></div><div><div class="sm mut">Reprovar</div><b class="r" style="font-size:22px">${h(u.rp)}</b></div><div><div class="sm mut">Não termina</div><b style="font-size:22px">${h(u.ab)}</b></div></div>
${u.dias ? `<div class="sm" style="text-align:center;margin-top:4px">Quando aprova, leva em média <b>${u.dias}</b> pregão(ões).</div>` : ""}
<div style="overflow-x:auto;margin-top:10px"><table style="width:100%;font-size:13px"><tr><th>Risco por trade</th>${m ? "<th>Contratos</th>" : ""}<th>Aprovar</th><th>Reprovar</th></tr>${p.map((b) => `<tr${b === v && g > 0 ? ' style="font-weight:700"' : ""}><td>${a(b.v)}${b === v && g > 0 ? " ⭐" : ""}${b.v === c ? " (atual)" : ""}</td>${m ? `<td>${f(b.v)}</td>` : ""}<td class="g">${h(b.ap)}</td><td class="r">${h(b.rp)}</td></tr>`).join("")}</table></div>
${g <= 0 ? "" : `<div class="sm" style="margin-top:8px">${v.v === c ? "Você já está no risco que dá a maior chance de aprovação." : `A maior chance sai com <b>${a(v.v)}</b> por trade${m ? ` (${f(v.v)} contrato(s))` : ""}. <button class="btn s" data-msimuse="${v.v}">Usar esse risco</button>`}</div>`}
${g <= 0 ? '<div class="warn" style="margin-top:8px">Seu histórico tem média negativa em vezes o risco: nenhum tamanho de mão resolve isso. Antes de aumentar a mão, melhore o setup (veja Mão por setup nas Estatísticas).</div>' : ""}
<div class="sm" style="color:var(--mut);margin-top:6px">Simulação com base no passado: não é garantia. O app para o dia quando a próxima perda estouraria o limite diário ou quando o ganho do dia chega no teto da consistência, como um trader disciplinado faria.</div></div>`;
}
{
  const e = vMesa;
  vMesa = function () {
    const t = e.apply(this, arguments);
    try {
      const a = mesaCfg();
      if (a && !a._antigo)
        return t.replace(
          "<h2>Regras da mesa</h2>",
          mapHtml(a) + "<h2>Regras da mesa</h2>",
        );
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
(document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-msim]");
  if (!t) return;
  const a = mesaCfg();
  if (
    a &&
    (((a.sim ?? (a.sim = {}))[t.dataset.msim] = t.value),
    mesaSalva(a),
    document.getElementById("mapc"))
  ) {
    const o = scrollY;
    (render(), scrollTo(0, o));
  }
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-msimuse]");
    if (!t) return;
    const a = mesaCfg();
    if (!a) return;
    (((a.sim ?? (a.sim = {})).risco = t.dataset.msimuse), mesaSalva(a));
    const o = scrollY;
    (render(), scrollTo(0, o));
  }));
function msSetups() {
  const e = S.trades
    .map((t) => ({ ...t, c: calc(t) }))
    .filter((t) => t.c.pl != null);
  return expSetups(e);
}
function msMult(e) {
  if (!e || e.n < 20)
    return {
      m: 1,
      nota: e ? `poucos trades (${e.n} de 20) para ajustar a mão` : "",
      tag: "–",
    };
  if (e.exp <= 0)
    return {
      m: 0.25,
      nota: `expectativa negativa (${f2(e.exp)}× em ${e.n} trades): pause ou opere com mão mínima até corrigir`,
      tag: "⏸ pausar",
      r: 1,
    };
  const t = e.sqn ?? 0,
    [a, o] =
      t < 1.6
        ? [0.5, "½ mão"]
        : t < 2
          ? [0.75, "¾ mão"]
          : t < 3
            ? [1, "mão cheia"]
            : t < 5
              ? [1.25, "1¼ mão"]
              : [1.5, "1½ mão"];
  return { m: a, nota: `SQN ${f2(t)} (${sqnTxt(t)}) em ${e.n} trades`, tag: o };
}
function msDe(e) {
  const t = String(e || "").trim();
  if (!t) return null;
  const a = msSetups().find((o) => o.k === t);
  return a ? { x: a, ...msMult(a) } : null;
}
{
  const e = qtdSugerida;
  qtdSugerida = function (t) {
    const a = e.apply(this, arguments);
    try {
      if (a && !a.semCap && t && t.setup) {
        const o = msDe(t.setup);
        if (o && o.m !== 1) {
          const s = a.risco * o.m;
          return {
            ...a,
            risco: s,
            q: Math.floor(s / a.porUn),
            pct: +(a.pct * o.m).toFixed(2),
            ms: o,
          };
        }
        if (o) return { ...a, ms: o };
      }
    } catch {}
    return a;
  };
}
{
  const e = qtdHtml;
  qtdHtml = function (t) {
    const a = e.apply(this, arguments);
    try {
      const o = qtdSugerida(t);
      if (a && o && o.ms && o.ms.x && o.ms.x.n >= 20)
        return a.replace(
          /<\/div>$/,
          `<div class="${o.ms.r ? "r" : "mut"}" style="margin-top:3px">Setup ${esc(t.setup)}: ${o.ms.tag} (${esc(o.ms.nota)}).</div></div>`,
        );
    } catch {}
    return a;
  };
}
{
  const e = stExtrasRisco;
  stExtrasRisco = function (t) {
    const a = e.apply(this, arguments);
    try {
      const o = expSetups(t);
      if (!o.length) return a;
      const s = +gv("ct", "pct", "") || 1;
      return (
        a +
        `<h2>Mão por setup (Van Tharp)</h2><div class="sm mut" style="margin-bottom:6px">O risco de cada setup acompanha a qualidade dele. Setup com SQN alto recebe mais risco; setup fraco recebe menos; expectativa negativa pede pausa. A quantidade sugerida no formulário já usa esse ajuste (a partir de 20 trades no setup). Base: ${String(s).replace(".", ",")}% por trade.</div>
<div class="card" style="overflow-x:auto;padding:6px 8px"><table style="width:100%;font-size:13px"><tr><th style="text-align:left">Setup</th><th>Trades</th><th>SQN</th><th>Mão</th><th>Risco</th></tr>${o
          .map((n) => {
            const r = msMult(n);
            return `<tr><td>${esc(n.k)}</td><td style="text-align:right">${n.n}</td><td style="text-align:right">${n.sqn != null ? f2(n.sqn) : "–"}</td><td style="text-align:right" class="${r.r ? "r" : ""}">${r.tag}</td><td style="text-align:right">${n.n < 20 ? "–" : String(+(s * r.m).toFixed(2)).replace(".", ",") + "%"}</td></tr>`;
          })
          .join("")}</table></div>`
      );
    } catch (o) {
      console.error(o);
    }
    return a;
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-rpyi]");
  if (!t) return;
  const a = rpyInd();
  ((a[t.dataset.rpyi] = a[t.dataset.rpyi] ? 0 : 1),
    ((S.ax ?? (S.ax = {})).rpyInd = a),
    save(),
    render());
});
function rptAlvoStop(e) {
  const t = RPY.dados.candles,
    a = e.lado === "C";
  for (let s = e.ti + 1; s < t.length; s++) {
    const n = t[s];
    if (a ? n[3] <= e.st : n[2] >= e.st) return { px: e.st, k: s, m: "stop" };
    if (e.al != null && (a ? n[2] >= e.al : n[3] <= e.al))
      return { px: e.al, k: s, m: "alvo" };
  }
  const o = t.length - 1;
  return { px: t[o][4], k: o, m: "fim dos dados" };
}
function rptRes(e, t) {
  const a = e.lado === "C" ? t - e.e : e.e - t,
    o = Math.abs(e.e - e.st);
  return { pts: a, r: o > 0 ? a / o : null };
}
async function rptAbre(e) {
  const t = S.trades.find((d) => d.id === e),
    a = cfg();
  if (!t) return;
  if (!a) {
    toast("Configure o Supabase na aba Conta.");
    return;
  }
  const o = numN(t.entry),
    s = numN(t.stop),
    n = numN(t.exit);
  if (o == null || s == null) {
    toast("Esse trade não tem entrada e stop para o replay.");
    return;
  }
  const r = String(t.dt).slice(0, 10),
    i = String(t.dtx || t.dt).slice(0, 10),
    l = r === i;
  ((tab = "estudos"),
    (ESV = "rpy"),
    (RPY.busy = 1),
    (RPY.err = ""),
    (RPY.trade = null),
    (RPY.dados = null),
    render(),
    scrollTo(0, 0));
  try {
    const d = await fetch(a.url + "/functions/v1/candles", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: a.key },
        body: JSON.stringify({
          ativo: t.ativo,
          sub: t.sub || "",
          de: l ? r + "T10:30" : t.dt,
          ate: l ? r + "T16:30" : t.dtx || "",
        }),
      }),
      c = await d.json();
    if (!d.ok) throw new Error(c.error || "Erro " + d.status);
    const p = c.candles || [];
    if (p.length < 5) throw new Error("Poucos candles para esse trade.");
    const u = (h) => {
        const b = Date.parse(String(h).slice(0, 16) + ":00-03:00");
        return isFinite(b) ? b / 1e3 : null;
      },
      m = u(t.dt),
      f = u(t.dtx || ""),
      x = (h) => {
        if (h == null) return null;
        let b = 0;
        for (let y = 0; y < p.length; y++) p[y][0] <= h && (b = y);
        return b;
      };
    ((RPY.dados = { ...c, candles: p }),
      (RPY.tk = String(t.ativo || "").toUpperCase()),
      (RPY.tf = c.intervalo || "5m"),
      (RPY.dia = rpyDia(p[0][0])),
      (RPY.ini = 0),
      (RPY.i = Math.max(0, Math.min(x(m) - 12, p.length - 1))),
      (RPY.pos = null),
      (RPY.msg = ""),
      (RPY.ops = []),
      (RPY.cego = 0));
    const v = x(m),
      g = n != null ? (x(f) ?? p.length - 1) : p.length - 1;
    ((RPY.trade = {
      id: t.id,
      lado: t.side === "V" ? "V" : "C",
      e: o,
      st: s,
      al: numN(t.target),
      sai: n ?? p[g][4],
      ti: v,
      tx: Math.max(v, g),
      aberto: n == null,
    }),
      (RPY.i = Math.min(RPY.i, v)));
  } catch (d) {
    ((RPY.err = String(d.message || d)),
      (RPY.trade = null),
      (RPY.dados = null));
  }
  ((RPY.busy = 0), render());
}
function rptHtml() {
  const e = RPY.trade,
    t = RPY.dados.candles,
    a = t[RPY.i],
    o = t.length - 1,
    s = RPY.i >= o;
  let n = "";
  if (s || RPY.i >= e.tx) {
    const r = rptRes(e, e.sai),
      i = rptAlvoStop(e),
      l = rptRes(e, i.px),
      d = rptRes(e, t[o][4]),
      c = (u) =>
        u == null
          ? "–"
          : (u >= 0 ? "+" : "") + u.toFixed(2).replace(".", ",") + "×",
      p = (u) => (u >= 0 ? "+" : "") + rpyFmt(u) + " pts";
    n = `<div class="card" style="margin-top:8px"><b class="sm">Comparando</b><table style="width:100%;font-size:13px;margin-top:4px"><tr><td>${e.aberto ? "Agora (trade aberto)" : "Sua saída"} em ${rpyFmt(e.sai)}</td><td class="${cls(r.pts)}">${p(r.pts)}</td><td class="${cls(r.pts)}">${c(r.r)}</td></tr>
<tr><td>Segurando até o ${i.m} (${rpyFmt(i.px)})</td><td class="${cls(l.pts)}">${p(l.pts)}</td><td class="${cls(l.pts)}">${c(l.r)}</td></tr><tr><td>Saindo no último candle (${rpyFmt(t[o][4])})</td><td class="${cls(d.pts)}">${p(d.pts)}</td><td class="${cls(d.pts)}">${c(d.r)}</td></tr></table>
<div class="sm" style="margin-top:6px">${l.r != null && r.r != null ? (l.r > r.r + 0.2 ? `Segurar o plano teria rendido ${c(l.r - r.r)} a mais. Vale rever o motivo da saída antecipada.` : r.r > l.r + 0.2 ? `Sua saída foi melhor que esperar o alvo ou o stop (${c(r.r - l.r)}).` : "Sua saída ficou perto do que o plano daria.") : ""}</div></div>`;
  }
  return `<div class="card"><div class="top"><b>${esc(RPY.tk)} · seu trade de ${fmtD(rpyDia(t[e.ti][0]))}</b><span class="sm mut">${rpyHora(a[0])} · ${RPY.tf}</span></div>${rpySvg()}
<div class="sm" style="margin:6px 0">${RPY.i < e.ti ? `Faltam ${e.ti - RPY.i} candle(s) até a sua entrada. Pense: você entraria aqui?` : `${e.lado === "C" ? "Compra" : "Venda"} em ${rpyFmt(e.e)}, stop ${rpyFmt(e.st)}${e.al != null ? ", alvo " + rpyFmt(e.al) : ""}.`}</div>
${s ? "" : '<div class="g3"><button class="btn s" data-rpt="1">▶ 1 candle</button><button class="btn s" data-rpt="5">⏩ 5</button><button class="btn s" data-rpt="fim">⏭ Até o fim</button></div>'}${n}
<button class="btn s" data-rpt="sair" style="width:100%;margin-top:8px">Sair do replay do trade</button></div>`;
}
{
  const e = rpyHtml;
  rpyHtml = function () {
    return RPY.trade && RPY.dados
      ? rptHtml()
      : RPY.busy && !RPY.dados
        ? '<div class="card sm mut">Carregando os candles…</div>'
        : e.apply(this, arguments);
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-rpt]"),
    a = e.target.closest("[data-rpytr]");
  if (a) {
    (e.preventDefault(),
      typeof FX < "u" && FX && fxFecha(),
      rptAbre(a.dataset.rpytr));
    return;
  }
  if (!t || !RPY.trade) return;
  const o = t.dataset.rpt,
    s = RPY.dados.candles.length - 1;
  if (o === "sair") {
    ((RPY.trade = null), (RPY.dados = null), render());
    return;
  }
  ((RPY.i = o === "fim" ? s : Math.min(s, RPY.i + +o)), render());
});
{
  const e = fxHtml;
  fxHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = FX && S.trades.find((o) => o.id === FX.id);
      t &&
        a &&
        numN(a.entry) != null &&
        numN(a.stop) != null &&
        !a.forex &&
        (t = t.replace(
          "<h2>Gráfico</h2>",
          `<h2>Gráfico</h2><button class="btn s" data-rpytr="${esc(a.id)}" style="width:100%;margin-bottom:8px">▶️ Rever este trade candle a candle</button>`,
        ));
    } catch {}
    return t;
  };
}
const CNG = {
    oco: {
      n: "Ombro-cabeça-ombro (OCO)",
      k: [
        [0, 0.18],
        [0.14, 0.6],
        [0.24, 0.4],
        [0.4, 0.92],
        [0.55, 0.4],
        [0.68, 0.62],
        [0.8, 0.4],
        [1, 0.12],
      ],
      e: "Três topos, o do meio mais alto (cabeça), e uma linha de pescoço ligando os fundos. O rompimento do pescoço para baixo confirma a reversão de alta para baixa.",
      alvo: { neck: 0.4, ext: 0.92, dir: -1 },
    },
    ocoi: {
      n: "Ombro-cabeça-ombro invertido (OCOI)",
      inv: "oco",
      e: "Três fundos, o do meio mais baixo (cabeça). O rompimento do pescoço para cima confirma a reversão de baixa para alta.",
      alvo: { neck: 0.6, ext: 0.08, dir: 1 },
    },
    td: {
      n: "Topo duplo",
      k: [
        [0, 0.15],
        [0.25, 0.86],
        [0.45, 0.45],
        [0.66, 0.85],
        [0.84, 0.45],
        [1, 0.14],
      ],
      e: "Dois topos no mesmo nível com um fundo entre eles. Perder esse fundo (a linha de confirmação) confirma a reversão para baixa.",
      alvo: { neck: 0.45, ext: 0.86, dir: -1 },
    },
    fd: {
      n: "Fundo duplo",
      inv: "td",
      e: "Dois fundos no mesmo nível com um topo entre eles. Romper esse topo confirma a reversão para alta.",
      alvo: { neck: 0.55, ext: 0.14, dir: 1 },
    },
    tasc: {
      n: "Triângulo ascendente",
      k: [
        [0, 0.05],
        [0.12, 0.78],
        [0.24, 0.42],
        [0.38, 0.78],
        [0.5, 0.56],
        [0.62, 0.78],
        [0.72, 0.66],
        [0.82, 0.78],
        [1, 1],
      ],
      e: "Resistência horizontal e fundos cada vez mais altos: os compradores pressionam. É altista; o rompimento da resistência projeta a altura da base do triângulo.",
    },
    tdesc: {
      n: "Triângulo descendente",
      inv: "tasc",
      e: "Suporte horizontal e topos cada vez mais baixos: os vendedores pressionam. É baixista; a perda do suporte projeta a altura da base do triângulo.",
    },
    tsim: {
      n: "Triângulo simétrico",
      k: [
        [0, 0.1],
        [0.12, 0.9],
        [0.26, 0.3],
        [0.4, 0.78],
        [0.52, 0.42],
        [0.64, 0.68],
        [0.74, 0.5],
        [0.82, 0.6],
        [1, 0.95],
      ],
      e: "Topos descendentes e fundos ascendentes convergindo. Normalmente é de continuação da tendência anterior; o rompimento costuma ocorrer entre 2/3 e 3/4 do caminho até o vértice.",
    },
    band: {
      n: "Bandeira de alta",
      k: [
        [0, 0.04],
        [0.3, 0.8],
        [0.38, 0.68],
        [0.46, 0.76],
        [0.54, 0.62],
        [0.62, 0.7],
        [0.7, 0.56],
        [0.78, 0.63],
        [1, 1],
      ],
      e: "Uma subida forte (mastro) seguida de um pequeno canal inclinado contra a tendência. É de continuação: o alvo mínimo é o tamanho do mastro projetado a partir do rompimento.",
      alvo: { band: 1 },
    },
    cuasc: {
      n: "Cunha ascendente",
      k: [
        [0, 0.08],
        [0.12, 0.44],
        [0.22, 0.3],
        [0.36, 0.62],
        [0.46, 0.5],
        [0.58, 0.72],
        [0.66, 0.64],
        [0.76, 0.8],
        [0.84, 0.74],
        [1, 0.22],
      ],
      e: "Topos e fundos subindo, mas convergindo (a alta perde força). É baixista, tanto em tendência de alta (reversão) quanto em baixa (continuação).",
    },
    cudesc: {
      n: "Cunha descendente",
      inv: "cuasc",
      e: "Topos e fundos caindo, mas convergindo (a queda perde força). É altista.",
    },
  },
  CNG_CANDLE = {
    mart: {
      n: "Martelo",
      e: "Corpo pequeno no alto do candle e sombra inferior de pelo menos duas vezes o corpo, depois de uma queda. Sinal de possível reversão para alta, que pede confirmação no candle seguinte.",
    },
    est: {
      n: "Estrela cadente",
      e: "Corpo pequeno na parte de baixo e sombra superior longa, depois de uma alta. Sinal de possível reversão para baixa.",
    },
    eng: {
      n: "Engolfo de alta",
      e: "Depois de uma queda, um candle de alta cujo corpo engole por completo o corpo do candle de baixa anterior. Sinal de reversão para alta.",
    },
    enb: {
      n: "Engolfo de baixa",
      e: "Depois de uma alta, um candle de baixa cujo corpo engole por completo o corpo do candle de alta anterior. Sinal de reversão para baixa.",
    },
    doji: {
      n: "Doji",
      e: "Abertura e fechamento praticamente iguais: indecisão. Depois de uma tendência longa, alerta para possível reversão.",
    },
  };
