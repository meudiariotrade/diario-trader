function qkSalva(e) {
  const t = document.getElementById("qkmsg"),
    a = String(QK.ativo || "")
      .trim()
      .toUpperCase();
  if (!a) {
    t && (t.textContent = "Informe o ativo.");
    return;
  }
  if (numN(QK.entry) == null) {
    t && (t.textContent = "Informe a entrada.");
    return;
  }
  const o = padraoAtivo(a),
    s = loc().slice(0, 16),
    n = numN(QK.exit) != null,
    r = {
      id: uid(),
      tipo: o.tipo || "D",
      dt: s,
      ativo: a,
      side: QK.side,
      entry: String(QK.entry),
      stop: String(QK.stop || ""),
      qty: String(QK.qty || o.qty),
      pv: String(o.pv),
      cost: String(o.cost || 0),
      exit: n ? String(QK.exit) : "",
      dtx: n ? s : "",
      setup: o.setup,
      mkt: o.mkt || (typeof MK < "u" ? MK[0] : ""),
      emo: "3",
      rules: "s",
      err: "Nenhum",
      tags: [],
      u: Date.now(),
      rapido: 1,
    };
  (r.tipo === "O" &&
    ((r.ot = "C"), (r.estr = typeof ESTR < "u" ? ESTR[0] : "")),
    S.trades.push(r),
    save(),
    qkFecha(),
    render(),
    window.toast &&
      toast(n ? "Trade salvo e encerrado" : "Trade salvo como aberto", 2500),
    limiteConfere(),
    e &&
      ((AUTO = 0),
      (isNew = 0),
      (T = { ...r }),
      (orig = { pin: T.pin, pout: T.pout, pplan: T.pplan }),
      showSheet()));
}
(document.addEventListener("input", (e) => {
  const t = e.target.closest("#qk [data-qk]");
  if (!t || !QK) return;
  if (
    ((QK[t.dataset.qk] =
      t.dataset.qk === "ativo" ? t.value.toUpperCase() : t.value),
    t.dataset.qk === "ativo")
  ) {
    const r = padraoAtivo(QK.ativo);
    ((QK.qty = QK.qty || r.qty), (QK.tipo = r.tipo));
  }
  const a = qkCalc(),
    o = t.selectionStart,
    s = t.dataset.qk;
  qkDesenha();
  const n = document.querySelector(`#qk [data-qk="${s}"]`);
  if (n) {
    n.focus();
    try {
      n.setSelectionRange(o, o);
    } catch {}
  }
}),
  document.addEventListener("click", (e) => {
    if (!QK) return;
    if (e.target.closest("[data-qkx]")) return qkFecha();
    const t = e.target.closest("[data-qka]");
    if (t) {
      QK.ativo = t.dataset.qka;
      const s = padraoAtivo(QK.ativo);
      return ((QK.qty = s.qty), (QK.tipo = s.tipo), qkDesenha());
    }
    const a = e.target.closest("[data-qks]");
    if (a) return ((QK.side = a.dataset.qks), qkDesenha());
    const o = e.target.closest("[data-qkok]");
    o && qkSalva(o.dataset.qkok === "2");
  }));
let FX = null;
function fxLista() {
  return [...S.trades].sort((e, t) =>
    (t.dtx || t.dt || "").localeCompare(e.dtx || e.dt || ""),
  );
}
function fxRegua(e, t) {
  const a = (A) => numN(e[A]),
    o = a("entry"),
    s = a("stop"),
    n = a("exit"),
    r = ["target", "target2", "target3"].map(a).filter((A) => A != null),
    i = a("mep"),
    l = a("men");
  if (o == null) return '<div class="sm mut">Sem preço de entrada.</div>';
  const d = [o, s, n, i, l, ...r].filter((A) => A != null),
    c = Math.min(...d),
    p = Math.max(...d),
    u = (p - c) * 0.08 || Math.abs(o) * 0.002 || 1,
    m = 340,
    f = 240,
    x = 8,
    v = 118,
    g = (A) => 14 + ((p + u - A) / (p - c + 2 * u)) * (f - 28),
    h = Math.max(...d.map((A) => (String(A).split(".")[1] || "").length), 0),
    b = (A) =>
      (+A).toLocaleString("pt-BR", {
        minimumFractionDigits: Math.min(h, 4),
        maximumFractionDigits: Math.min(h, 4),
      }),
    y = (A, C, I, J) =>
      `<line x1="${x}" x2="${m - v}" y1="${g(A)}" y2="${g(A)}" stroke="${C}" stroke-width="${J ? 1.4 : 2}" ${J ? 'stroke-dasharray="5 4"' : ""}/><text x="${m - v + 8}" y="${g(A) + 4}" font-size="11.5" fill="${C}" font-weight="600">${I} ${b(A)}</text>`,
    j = (A, C, I, J) =>
      `<rect x="${x + 70}" y="${Math.min(g(A), g(C))}" width="${m - v - x - 140}" height="${Math.max(2, Math.abs(g(A) - g(C)))}" fill="${I}" opacity="${J}" rx="4"/>`;
  let k = "";
  return (
    i != null && l != null && (k += j(i, l, "var(--mut)", 0.15)),
    s != null && (k += j(o, s, "var(--r)", 0.18)),
    r.forEach((A) => {
      k += j(o, A, "var(--g)", 0.1);
    }),
    n != null &&
      (k += `<rect x="${x + 100}" y="${Math.min(g(o), g(n))}" width="${m - v - x - 200}" height="${Math.max(3, Math.abs(g(o) - g(n)))}" fill="${t.pl >= 0 ? "var(--g)" : "var(--r)"}" opacity=".85" rx="3"/>`),
    r.forEach((A, C) => {
      k += y(A, "var(--g)", r.length > 1 ? "Alvo " + (C + 1) : "Alvo", 1);
    }),
    s != null && (k += y(s, "var(--r)", "Stop", 1)),
    i != null && (k += y(i, "var(--mut)", "Melhor", 1)),
    l != null && (k += y(l, "var(--mut)", "Pior", 1)),
    (k += y(o, "var(--ac)", "Entrada")),
    n != null && (k += y(n, "var(--tx)", "Saída")),
    `<svg viewBox="0 0 ${m} ${f}" style="width:100%;height:auto" role="img" aria-label="Régua de preços do trade">${k}</svg>
<div class="sm mut" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px"><span><b style="color:var(--r)">■</b> risco planejado</span>${r.length ? '<span><b style="color:var(--g)">■</b> até o alvo</span>' : ""}${n != null ? "<span>barra cheia = o que você realizou</span>" : ""}${i != null && l != null ? '<span><b style="color:var(--mut)">■</b> faixa que o preço percorreu</span>' : ""}</div>`
  );
}
function fxHtml() {
  const e = fxLista(),
    t = e.findIndex((h) => h.id === FX.id),
    a = e[t];
  if (!a) return "";
  const o = calc(a),
    s = isOpen(a),
    n = moedaT(a),
    r = a.tipo || "D",
    i = typeof minutosEntre == "function" ? minutosEntre(a.dt, a.dtx) : null,
    l =
      i == null
        ? ""
        : i < 60
          ? Math.round(i) + " min"
          : i < 1440
            ? (i / 60).toFixed(1).replace(".", ",") + " h"
            : Math.round(i / 1440) + " dias",
    d = s
      ? ["Aberto", "var(--ac)"]
      : o.pl > 0
        ? ["Ganho", "var(--g)"]
        : o.pl < 0
          ? ["Perda", "var(--r)"]
          : ["Zero", "var(--mut)"],
    c = (h, b, y = "") =>
      `<div class="card" style="margin:0;padding:10px"><span class="sm mut">${h}</span><div><b class="${y}" style="font-size:16px">${b}</b></div></div>`,
    p =
      o.r == null
        ? null
        : (o.r >= 0 ? "ganhou " : "perdeu ") +
          Math.abs(o.r).toFixed(1).replace(".", ",") +
          "x o que arriscou",
    u = o.rr != null && o.risk ? o.risk * o.rr : null,
    m = !s && o.pl > 0 && u ? o.pl / u : null,
    f = tagsDe(a),
    x = chkDe(a.setup),
    v = a.chk || {},
    g = [
      ["pplan", "Planejamento"],
      ["pin", "Entrada"],
      ["pout", "Saída"],
    ].filter(([h]) => a[h]);
  return `<div class="fx-top"><button class="btn s ib" data-fx="x" aria-label="Fechar">✕</button><div style="flex:1;min-width:0;text-align:center"><b>${esc(a.ativo || "Trade")}</b><div class="sm mut">${t + 1} de ${e.length}</div></div><button class="btn s ib" data-fx="ant"${t > 0 ? "" : " disabled"} aria-label="Anterior">‹</button><button class="btn s ib" data-fx="prox"${t < e.length - 1 ? "" : " disabled"} aria-label="Próximo">›</button></div>
<div class="fx-body">
<div class="hero" style="margin-top:0"><div class="top"><span class="chip" style="color:${d[1]};border-color:${d[1]}">${d[0]}</span><span class="sm mut">${{ D: "Day trade", S: "Swing", O: "Opção" }[r]} · ${a.side === "C" ? (r === "O" ? "Comprado" : "Compra") : r === "O" ? "Lançado" : "Venda"}${a.setup ? " · " + esc(a.setup) : ""}</span></div>
<div class="big ${s ? "" : cls(o.pl)}" style="margin-top:8px">${s ? "Em aberto" : mT(a, o.pl)}</div>
<div class="sm mut">${s ? (o.risk != null ? "Risco em jogo: " + mT(a, o.risk) : "") : pctConta(o.pl, n, r) + (p ? " · " + p : "")}</div>
<div class="sm mut" style="margin-top:6px">${fdt(a.dt)}${a.dtx ? " → " + fdt(a.dtx) : ""}${l ? " · " + l : ""}</div></div>
<h2>Plano × execução</h2><div class="card">${fxRegua(a, o)}</div>
<div class="kv">${c("Risco planejado", o.risk == null ? "sem stop" : mT(a, o.risk) + (pctConta(o.risk, n, r) ? '<div class="sm mut" style="font-weight:500">' + pctConta(o.risk, n, r).replace("+", "") + "</div>" : ""))}${c("Ganho/risco planejado", o.rr == null ? "sem alvo" : o.rr.toFixed(1).replace(".", ",") + " para 1")}${c("Captura do alvo", m == null ? "–" : Math.round(m * 100) + "%", m != null && m < 0.6 ? "r" : "")}${c("Custos", mT(a, +a.cost || 0))}</div>
<h2>Disciplina</h2><div class="card"><div class="sm">Regras: <b class="${a.rules === "n" ? "r" : "g"}">${a.rules === "n" ? "quebrei" : "segui"}</b>${a.emo ? " · Antes de entrar: " + (EMO[+a.emo - 1] || "") : ""}</div>
${f.length ? `<div class="chips2" style="margin-top:8px">${f.map((h) => `<span class="chip" style="color:var(--r);border-color:color-mix(in srgb,var(--r) 40%,transparent)" title="${esc(catErro(h))}">${esc(h)}</span>`).join("")}</div>` : '<div class="sm g" style="margin-top:6px">Nenhum erro marcado.</div>'}
${x.length ? `<div style="margin-top:10px"><div class="sm mut">Checklist do setup (${x.filter((h, b) => v[b]).length}/${x.length})</div>${x.map((h, b) => `<div class="sm" style="margin-top:4px">${v[b] ? '<span class="g">✓</span>' : '<span class="r">✗</span>'} ${esc(h)}</div>`).join("")}</div>` : ""}</div>
${g.length ? `<h2>Fotos</h2><div class="g${g.length > 1 ? "2" : ""}" style="gap:8px">${g.map(([h, b]) => `<div><div class="sm mut" style="margin-bottom:4px">${b}</div><img data-img="${a[h]}" style="width:100%;border-radius:12px;border:1px solid var(--bd);display:block;min-height:80px;background:var(--card2)"></div>`).join("")}</div>` : ""}
${a.nota ? `<h2>Comentários</h2><div class="card" style="white-space:pre-wrap;line-height:1.5">${esc(a.nota)}</div>` : ""}
<div class="g2" style="margin:16px 0 30px"><button class="btn" data-fx="editar">Editar</button>${s ? '<button class="btn s" data-fx="encerrar">Encerrar</button>' : '<button class="btn s" data-fx="x">Fechar</button>'}</div></div>`;
}
function fxAbre(e) {
  FX = { id: e };
  let t = document.getElementById("fx");
  (t ||
    ((t = document.createElement("div")),
    (t.id = "fx"),
    document.body.appendChild(t)),
    (document.body.style.overflow = "hidden"),
    fxDesenha());
}
function fxDesenha() {
  const e = document.getElementById("fx");
  if (!e || !FX) return;
  e.innerHTML = fxHtml();
  try {
    fillImgs();
  } catch {}
  const t = e.querySelector(".fx-body");
  t && (t.scrollTop = 0);
  try {
    navPinta();
  } catch {}
}
function fxFecha() {
  const e = document.getElementById("fx");
  (e && e.remove(), (FX = null), (document.body.style.overflow = ""));
  try {
    navPinta();
  } catch {}
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-fx]");
    if (t && FX) {
      const o = t.dataset.fx,
        s = fxLista(),
        n = s.findIndex((r) => r.id === FX.id);
      if (o === "x") return fxFecha();
      if (o === "ant" && n > 0) return ((FX.id = s[n - 1].id), fxDesenha());
      if (o === "prox" && n < s.length - 1)
        return ((FX.id = s[n + 1].id), fxDesenha());
      if (o === "editar" || o === "encerrar") {
        const r = FX.id;
        fxFecha();
        const i = S.trades.find((l) => l.id === r);
        if (!i) return;
        ((AUTO = 0),
          (isNew = 0),
          (QM = o === "encerrar" ? 1 : 0),
          (T = { ...i, ...(QM ? { dtx: loc().slice(0, 16) } : {}) }),
          (orig = { pin: T.pin, pout: T.pout, pplan: T.pplan }),
          showSheet());
        return;
      }
      return;
    }
    const a = e.target.closest('#app [data-a="edit"]');
    a &&
      !e.target.closest("button,a,input,select,textarea,label") &&
      S.trades.some((o) => o.id === a.dataset.id) &&
      (e.stopPropagation(), fxAbre(a.dataset.id));
  },
  !0,
),
  document.addEventListener("keydown", (e) => {
    if (FX) {
      if (e.key === "Escape") fxFecha();
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const t = fxLista(),
          a = t.findIndex((s) => s.id === FX.id),
          o = a + (e.key === "ArrowRight" ? 1 : -1);
        t[o] && ((FX.id = t[o].id), fxDesenha());
      }
    }
  }));
const HB_NOMES = {
    hero: "Resultado de hoje",
    adr: "ADRs brasileiras",
    cap: "Capital",
    posso: "Posso operar hoje?",
    turno: "Escala de turno",
    venc: "Vencimentos de opções",
    pos: "Posições abertas",
    lim: "Limites da mesa",
    metas: "Metas de processo",
    cal: "Calendário do mês",
    acoes: "Atalhos",
  },
  HB_PADRAO = [
    "hero",
    "posso",
    "turno",
    "pos",
    "adr",
    "cap",
    "venc",
    "lim",
    "metas",
    "cal",
    "acoes",
  ],
  hbCfg = () => {
    const e = (S.ax || {})["home.layout"] || {},
      t = (e.ordem || []).filter((a) => HB_NOMES[a]);
    return (
      HB_PADRAO.forEach((a) => {
        t.includes(a) || t.push(a);
      }),
      { ordem: t, ocultos: (e.ocultos || []).filter((a) => HB_NOMES[a]) }
    );
  };
function hbAplica() {
  if (tab !== "home") return;
  const e = document.getElementById("app");
  if (!e) return;
  const t = document.getElementById("adr");
  t && t.closest("[data-hb]");
  const a = {};
  if (
    (e.querySelectorAll("[data-hb]").forEach((r) => {
      a[r.dataset.hb] = r;
    }),
    t)
  ) {
    const r = document.createElement("section");
    ((r.dataset.hb = "adr"),
      t.parentNode.insertBefore(r, t),
      r.appendChild(t),
      (a.adr = r));
  }
  const { ordem: o, ocultos: s } = hbCfg(),
    n = document.createElement("div");
  ((n.id = "hb-fim"),
    e.appendChild(n),
    o.forEach((r) => {
      const i = a[r];
      i &&
        ((i.style.display = s.includes(r) ? "none" : ""), e.insertBefore(i, n));
    }),
    (n.innerHTML = `<button class="btn s" style="width:100%;margin:14px 0 4px" data-hbp="1">${window.icoSvg ? window.icoSvg("pen") : ""}Personalizar o Início</button>`));
}
function hbEditor() {
  const { ordem: e, ocultos: t } = hbCfg();
  let a = document.getElementById("hbe");
  (a ||
    ((a = document.createElement("div")),
    (a.id = "hbe"),
    document.body.appendChild(a)),
    (a.innerHTML = `<div class="qk-bk" data-hbx="1"></div><div class="qk-pn"><div class="top"><b style="font-size:20px">Personalizar o Início</b><button class="x" data-hbx="1">✕</button></div><div class="sm mut" style="margin:4px 0 10px">Ligue o que quer ver e use as setas para mudar a ordem.</div>
${e.map((o, s) => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--bd)"><label class="ck" style="flex:1;margin:0"><input type="checkbox" data-hbv="${o}"${t.includes(o) ? "" : " checked"}><span>${HB_NOMES[o]}</span></label><button class="btn s ib" data-hbm="${o}:-1"${s ? "" : " disabled"} aria-label="Subir">↑</button><button class="btn s ib" data-hbm="${o}:1"${s < e.length - 1 ? "" : " disabled"} aria-label="Descer">↓</button></div>`).join("")}
<button class="btn s" style="width:100%;margin-top:12px" data-hbr="1">Voltar ao padrão</button></div>`),
    (document.body.style.overflow = "hidden"));
}
const hbSalva = (e) => {
  (((S.ax ?? (S.ax = {}))["home.layout"] = e), save());
};
(document.addEventListener("click", (e) => {
  if (e.target.closest("[data-hbp]")) return hbEditor();
  if (e.target.closest("[data-hbx]")) {
    const a = document.getElementById("hbe");
    (a && a.remove(), (document.body.style.overflow = ""), render());
    return;
  }
  const t = e.target.closest("[data-hbm]");
  if (t) {
    const [a, o] = t.dataset.hbm.split(":"),
      s = hbCfg(),
      n = s.ordem.indexOf(a),
      r = n + +o;
    r >= 0 &&
      r < s.ordem.length &&
      (([s.ordem[n], s.ordem[r]] = [s.ordem[r], s.ordem[n]]),
      hbSalva(s),
      hbEditor());
    return;
  }
  e.target.closest("[data-hbr]") &&
    (hbSalva({ ordem: HB_PADRAO.slice(), ocultos: [] }), hbEditor());
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-hbv]");
    if (!t) return;
    const a = hbCfg(),
      o = t.dataset.hbv;
    ((a.ocultos = a.ocultos.filter((s) => s !== o)),
      t.checked || a.ocultos.push(o),
      hbSalva(a));
  }));
function limiteConfere() {
  const e = loc().slice(0, 10),
    t = S.days[e] || {},
    a = limPerda(t),
    o = +t.maxT,
    s = dayTr(e),
    n = dayPL(dayFech(e)),
    r = s.length,
    i = "lim." + e;
  if ((S.ax || {})[i]) return;
  let l = "";
  if (
    (a > 0 && n <= -a
      ? (l = `Você atingiu a perda máxima do dia (${money(n)}). Pare por hoje.`)
      : o > 0 &&
        r >= o &&
        (l = `Você chegou ao máximo de ${o} trades hoje. Pare por hoje.`),
    !l)
  )
    return;
  const d = /Pare por hoje/.test(l);
  (d && (((S.ax ?? (S.ax = {}))[i] = 1), save()),
    window.toast && toast("🛑 " + l, 6e3));
  try {
    "Notification" in window &&
      Notification.permission === "granted" &&
      navigator.serviceWorker.ready.then((c) =>
        c.showNotification(d ? "🛑 Pare por hoje" : "⚠️ Perto do limite", {
          body: l,
          tag: "limite-" + e,
          icon: "icon-192.png",
        }),
      );
  } catch {}
}
document.addEventListener("click", (e) => {
  e.target.closest('[data-a="savetrade"]') && setTimeout(limiteConfere, 80);
});
function npComTurno() {
  const e = typeof turnoGet == "function" ? turnoGet() : null,
    t = Object.assign({}, typeof NP < "u" ? NP : {});
  if (e) {
    const a = loc().slice(0, 10),
      o = diasMais(a, 60),
      s = {};
    (Object.keys(e.dias).forEach((n) => {
      n >= diasMais(a, -1) && n <= o && (s[n] = e.dias[n]);
    }),
      (t.turno = { on: e.on ? 1 : 0, niv: e.niv, dias: s }));
  }
  return t;
}
async function turnoPushSync(e) {
  try {
    if (!("serviceWorker" in navigator) || typeof alFn != "function" || !cfg())
      return;
    const t = await navigator.serviceWorker.ready,
      a = await t.pushManager.getSubscription();
    if (!a) return;
    const o = npComTurno(),
      s = JSON.stringify(o) + loc().slice(0, 10);
    if (!e && ls.get("diario-np-h") === s) return;
    (await alFn("inscrever", { sub: a.toJSON(), prefs: o }),
      ls.set("diario-np-h", s));
  } catch {}
}
if (typeof turnoSet == "function") {
  const e = turnoSet;
  turnoSet = function (t) {
    (e(t),
      clearTimeout(turnoSet._t),
      (turnoSet._t = setTimeout(() => turnoPushSync(!0), 1500)));
  };
}
function dolarAuto() {
  const e = (typeof JR < "u" && JR.data && JR.data.ptax) || null;
  if (!e || !(e.v > 0) || (S.ax || {})["g.brl.manual"]) return;
  const t = +(S.ax || {})["g.brl"] || 0;
  Math.abs(t - e.v) < 1e-4 ||
    (((S.ax ?? (S.ax = {}))["g.brl"] = String(e.v)),
    (S.ax["g.brl.data"] = e.d),
    save());
}
if (typeof jrPaint == "function") {
  const e = jrPaint;
  jrPaint = function () {
    (e(), dolarAuto());
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest('[data-axg="brl"]');
  t && ((S.ax ?? (S.ax = {}))["g.brl.manual"] = t.value ? 1 : 0);
});
const BK = { lista: null, err: "", busy: 0 };
async function bkSnapshot() {
  if (!SESS || !cfg()) return;
  const e = loc().slice(0, 10);
  if (ls.get("diario-snap-dia") !== e + "|" + SESS.uid)
    try {
      (await rq("/rest/v1/diario_backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          user_id: SESS.uid,
          dia: e,
          data: pub(),
          criado: new Date().toISOString(),
        }),
      }),
        ls.set("diario-snap-dia", e + "|" + SESS.uid),
        (BK.err = ""));
      try {
        await rq(
          "/rest/v1/diario_backup?user_id=eq." +
            SESS.uid +
            "&dia=lt." +
            diasMais(e, -30),
          { method: "DELETE" },
        );
      } catch {}
    } catch (t) {
      BK.err =
        t.status === 404 || /diario_backup/.test(t.message || "")
          ? 'Falta criar a tabela de cópias: rode o SQL "seguranca-backup.sql" no Supabase.'
          : "Não consegui guardar a cópia de hoje: " + (t.message || t);
    }
}
if (typeof sync == "function") {
  const e = sync;
  sync = async function (t) {
    (await e(t),
      SESS && S.lastSyncAt && Date.now() - S.lastSyncAt < 6e4 && bkSnapshot());
  };
}
async function bkListar() {
  if (SESS) {
    BK.busy = 1;
    try {
      ((BK.lista = await (
        await rq(
          "/rest/v1/diario_backup?select=dia,criado&user_id=eq." +
            SESS.uid +
            "&order=dia.desc&limit=30",
        )
      ).json()),
        (BK.err = ""));
    } catch (e) {
      ((BK.lista = []),
        (BK.err =
          e.status === 404
            ? 'Falta criar a tabela de cópias: rode o SQL "seguranca-backup.sql" no Supabase.'
            : e.message || String(e)));
    }
    ((BK.busy = 0), tab === "conta" && render());
  }
}
async function bkRestaura(e) {
  if (
    confirm(
      "Restaurar a cópia de " +
        e.split("-").reverse().join("/") +
        "? O diário deste aparelho e da nuvem volta a ser igual ao daquele dia. (Antes disso, a situação atual é guardada como cópia de hoje.)",
    )
  )
    try {
      (ls.del("diario-snap-dia"), await bkSnapshot());
      const t = await (
        await rq(
          "/rest/v1/diario_backup?select=data&user_id=eq." +
            SESS.uid +
            "&dia=eq." +
            e,
        )
      ).json();
      if (!t[0] || !t[0].data) throw new Error("Cópia não encontrada.");
      (adopt(t[0].data),
        (S.mt = Date.now()),
        save(),
        render(),
        window.toast && toast("Cópia restaurada.", 3e3));
    } catch (t) {
      window.toast && toast("Não consegui restaurar: " + (t.message || t), 5e3);
    }
}
(function () {
  const e = vConta;
  ((vConta = function () {
    const t = e();
    if (!SESS) return t;
    BK.lista == null && !BK.busy && setTimeout(bkListar, 0);
    const a = BK.lista || [];
    return (
      t +
      `<div class="card"><div class="top"><b>Cópias de segurança</b><span class="sm mut">últimos 30 dias</span></div>
<div class="sm mut" style="margin:4px 0 8px">Uma vez por dia o app guarda uma cópia completa do diário na sua conta, além da sincronização. Se algo der errado, volte para o dia que quiser.</div>
${BK.err ? `<div class="warn">${esc(BK.err)}</div>` : ""}
${
  BK.lista == null
    ? '<div class="sm mut">Carregando…</div>'
    : a.length
      ? a
          .slice(0, 10)
          .map(
            (o) =>
              `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--bd)"><span>${o.dia.split("-").reverse().join("/")}<span class="sm mut"> · ${new Date(o.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></span><button class="btn s" data-bkr="${o.dia}">Restaurar</button></div>`,
          )
          .join("")
      : '<div class="sm mut">Nenhuma cópia ainda. A primeira é feita na próxima sincronização.</div>'
}</div>`
    );
  }),
    document.addEventListener("click", (t) => {
      const a = t.target.closest("[data-bkr]");
      a && bkRestaura(a.dataset.bkr);
    }));
})();
function bkStatus() {
  if (tab !== "home") return;
  const e = document.querySelector("#app .hero");
  if (!e || e.querySelector(".bk-st")) return;
  const t = document.createElement("div");
  if (
    ((t.className = "sm mut bk-st"),
    (t.style.marginTop = "8px"),
    SESS && S.lastSyncAt)
  ) {
    const a = Math.round((Date.now() - S.lastSyncAt) / 6e4);
    t.innerHTML =
      (window.icoSvg ? window.icoSvg("ok") : "") +
      "Salvo na nuvem " +
      (a < 1
        ? "agora"
        : a < 60
          ? "há " + a + " min"
          : "às " + hm(S.lastSyncAt));
  } else
    ((t.innerHTML =
      (window.icoSvg ? window.icoSvg("alert") : "") +
      'Backup automático desligado · <a href="#" data-a="gotab" data-id="conta" style="color:var(--ac)">entrar na conta</a>'),
      (t.style.color = "var(--am)"));
  e.appendChild(t);
}
((function () {
  const e = vStats;
  vStats = function () {
    let t = e();
    if (ST.aba !== "risco") return t;
    const a = stCtx(),
      o = a.rows,
      s = o.flatMap((f) =>
        tagsDe(f).map((x) => ({ ...f, _g: x, _c: catErro(x) })),
      ),
      n = agrupa(s, (f) => f._g).sort((f, x) => f.somaPL - x.somaPL),
      r = agrupa(s, (f) => f._c).sort((f, x) => f.somaPL - x.somaPL),
      i = o.map(chkFrac).filter((f) => f != null),
      l = i.length ? i.reduce((f, x) => f + x, 0) / i.length : null,
      d = o.filter((f) => chkFrac(f) === 1),
      c = o.filter((f) => {
        const x = chkFrac(f);
        return x != null && x < 1;
      }),
      p = (f) =>
        f.length ? f.reduce((x, v) => x + v.c.pl, 0) / f.length : null,
      u = `${l != null ? `<h2>Checklist do setup</h2><div class="kv">${KV("Checklist cumprido", Math.round(l * 100) + "%", "", i.length + " trades com checklist")}${KV("Média: completo × incompleto", a.fs(p(d)) + " × " + a.fs(p(c)), "", "resultado médio por trade")}</div>` : ""}${s.length ? `<h2>Erros por categoria</h2>${stTbl("Categoria", r, a.fs)}<h2>Erros (cada marcação)</h2>${stTbl("Erro", n, a.fs)}` : ""}`,
      m = t.indexOf("<h2>Sequências</h2>");
    return (
      (t = t.replace(
        /<div class="card"><table><tr><th>Erro<\/th>[\s\S]*?<\/table><\/div>/,
        "",
      )),
      m < 0 ? t + u : t.slice(0, m) + u + t.slice(m)
    );
  };
})(),
  (function () {
    const e = TraderStyles.slot("legacy-012");
    ((e.textContent = TraderStyles.css("legacy-012")), TraderStyles.mount(e));
    const t = () => {
      const o = document.getElementById("fabm");
      if (!o || o.querySelector("[data-qkn]")) return;
      const s = document.createElement("button");
      ((s.className = "btn"),
        (s.dataset.qkn = "1"),
        (s.innerHTML =
          (window.icoSvg ? window.icoSvg("bolt") : "") + "Registro rápido"),
        o.insertBefore(s, o.firstChild));
    };
    document.addEventListener("click", (o) => {
      if (o.target.closest("[data-qkn]")) {
        const s = document.getElementById("fabm");
        (s && (s.style.display = "none"), qkAbre());
      }
    });
    const a = render0;
    ((render0 = function () {
      a.apply(this, arguments);
      try {
        (t(), hbAplica(), bkStatus());
      } catch (o) {
        console.error(o);
      }
    }),
      setTimeout(() => {
        try {
          typeof jrLoad == "function" && cfg() && jrLoad(!1);
        } catch {}
        turnoPushSync(!1);
      }, 4e3));
  })());
const dOf = (e) => String(e.dtx || e.dt || "").slice(0, 10),
  fmtD = (e) =>
    String(e || "")
      .split("-")
      .reverse()
      .join("/"),
  dsem = (e) =>
    ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][
      new Date(e + "T12:00").getDay()
    ],
  usdBrl = () => +axg("brl", 5.4) || 5.4,
  pct0 = (e) => (e == null || !isFinite(e) ? "–" : Math.round(e * 100) + "%"),
  ic2 = (e) => (window.icoSvg ? window.icoSvg(e) : ""),
  barra = (e, t) =>
    `<div style="height:8px;border-radius:8px;background:var(--card2);overflow:hidden;margin-top:6px"><div style="height:100%;width:${Math.max(0, Math.min(100, (e || 0) * 100)).toFixed(1)}%;background:${t || "var(--ac)"};border-radius:8px"></div></div>`;
function semResumo(e, t) {
  const a = S.trades
      .map((v) => ({ ...v, c: calc(v) }))
      .filter((v) => v.c.pl != null && dOf(v) >= e && dOf(v) <= t),
    o = (v) => emBRL(v.c.pl, moedaT(v)),
    s = {};
  a.forEach((v) => {
    const g = dOf(v);
    s[g] = (s[g] || 0) + o(v);
  });
  const n = {};
  a.forEach((v) =>
    tagsDe(v).forEach((g) => {
      (((n[g] ?? (n[g] = { v: 0, n: 0 })).v += o(v)), n[g].n++);
    }),
  );
  const r =
      Object.entries(n)
        .filter(([, v]) => v.v < 0)
        .sort((v, g) => v[1].v - g[1].v)[0] || null,
    i = Object.keys(s)
      .map((v) => ({ d: v, l: limPerda(S.days[v] || {}), v: s[v] }))
      .filter((v) => v.l > 0),
    l = a.filter((v) => v.c.r != null && v.c.r < -1.15),
    d = Object.keys(s).sort((v, g) => s[g] - s[v]),
    c = {
      n: a.length,
      soma: somaMoedas(a),
      tot: sum(a.map(o)),
      acerto: a.length ? a.filter((v) => v.c.pl > 0).length / a.length : null,
      dias: s,
      melhor: d.length ? d[0] : null,
      pior: d.length ? d[d.length - 1] : null,
      erro: r,
      lim: i,
      limOk: i.filter((v) => v.v >= -v.l).length,
      estouro: l,
      regras: a.length
        ? a.filter((v) => v.rules !== "n").length / a.length
        : null,
      semStop: a.filter((v) => numN(v.stop) == null).length,
    },
    p = lcItems().filter((v) => v.d >= e && v.d <= t),
    u = (S.ops || []).filter(
      (v) =>
        v.st === "closed" &&
        String(v.dtx || v.dt || "").slice(0, 10) >= e &&
        String(v.dtx || v.dt || "").slice(0, 10) <= t,
    ),
    m = {};
  p.forEach((v) => {
    m[v.d] = (m[v.d] || 0) + v.v;
  });
  const f = Object.keys(m).sort((v, g) => m[g] - m[v]),
    x = {
      n: p.length,
      ops: u.length,
      tot: sum(p.map((v) => v.v)),
      acerto: p.length ? p.filter((v) => v.v > 0).length / p.length : null,
      dias: m,
      melhor: f.length ? f[0] : null,
      pior: f.length ? f[f.length - 1] : null,
      estouro: u.filter((v) => +v.rk > 0 && +v.res < -+v.rk * 1.15),
    };
  return { a: e, b: t, b3: c, fx: x, vazio: !c.n && !x.n };
}
function semPush() {
  const [e, t] = rng("w0"),
    a = semResumo(e, t),
    o = [];
  (a.b3.n &&
    o.push(
      `Brasil: ${mnyMix(a.b3.soma)} em ${a.b3.n} trade${a.b3.n > 1 ? "s" : ""}`,
    ),
    a.fx.n && o.push(`Forex: ${mnyC(a.fx.tot, "USD")}`),
    a.b3.erro && o.push(`erro mais caro: ${a.b3.erro[0]}`));
  const s = a.b3.estouro.length + a.fx.estouro.length;
  s && o.push(`${s} perda${s > 1 ? "s" : ""} além do stop`);
  const n =
    (o.length ? o.join(" · ") + ". " : "Semana sem operações registradas. ") +
    "Toque para fazer a revisão.";
  return {
    id: e,
    titulo: "📋 Revisão da semana",
    corpo: n.length > 240 ? n.slice(0, 237) + "…" : n,
  };
}
const semPassos = (e, t) => {
  const a = [
    ["Stop e limites", !!t.g_stop],
    ["Erro mais caro", !e.b3.erro || !!String(t.g_erro || "").trim()],
    ["Forex", !e.fx.n || !!String(t.g_fx || "").trim()],
    [
      "Plano da próxima semana",
      !!String((t.plano || "") + (t.repetir || "") + (t.parar || "")).trim(),
    ],
    ["Concluir", !!t.feita],
  ];
  return { L: a, ok: a.filter((o) => o[1]).length };
};
function semCard(e, t, a) {
  const o = e.b3,
    s = e.fx,
    n = semPassos(e, a),
    r = (x, v, g = "") =>
      `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid var(--bd)"><span class="sm mut">${x}</span><b class="${g}" style="text-align:right">${v}</b></div>`,
    i = (x) => (x ? dsem(x) + " " + fmtD(x).slice(0, 5) : "–"),
    l = (x, v, g = "") =>
      `<div style="padding:6px 0;border-top:1px solid var(--bd)"><div class="sm mut">${x}</div><b class="${g}">${v}</b></div>`,
    d = (x, v, g, h) => {
      const b = (j) =>
          `${i(j)}<br><span style="white-space:nowrap" class="${cls(v.dias[j])}">${v === o ? money(v.dias[j]) : mnyC(v.dias[j], "USD")}</span>`,
        y = Object.keys(v.dias).length;
      return `<div class="card" style="margin:0;padding:10px 12px"><b>${x}</b>${v.n ? l("Resultado", '<span style="white-space:nowrap">' + g(v) + "</span>", cls(v.tot)) + l("Operações", v.n + (v.acerto != null ? " · " + pct0(v.acerto) + " de acerto" : "")) + (y > 1 ? l("Melhor dia", b(v.melhor)) + l("Pior dia", b(v.pior)) : l("Dia", b(v.melhor))) + (h || "") : '<div class="sm mut" style="margin-top:6px">Nenhuma operação.</div>'}</div>`;
    },
    c = [...new Set([...Object.keys(o.dias), ...Object.keys(s.dias)])].sort(),
    p = (x, v, g, h) =>
      `<button class="btn ${a[x] === v ? "" : "s"}" data-rvb="${x}:${v}"${a[x] === v && h ? ` style="background:${h};border-color:${h}"` : ""}>${g}</button>`,
    u = (x, v, g = "") =>
      `<label>${v}<textarea data-rv="${x}" placeholder="${esc(g)}">${esc(a[x])}</textarea></label>`,
    m = (x, v) =>
      `<h3 style="display:flex;align-items:center;gap:8px;margin:18px 0 6px;text-transform:none;letter-spacing:0;color:var(--tx);font-size:16px"><span style="width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;background:${n.L[x] && n.L[x][1] ? "var(--g)" : "var(--card2)"};color:${n.L[x] && n.L[x][1] ? "#fff" : "var(--tx)"};flex:none">${n.L[x] && n.L[x][1] ? "✓" : x + 1}</span>${v}</h3>`,
    f = `<div class="sm mut" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px">${ic2("clock")}<label class="ck" style="margin:0"><input type="checkbox" data-semon${(NP.on || {}).sem === !1 ? "" : " checked"}><span>Lembrete todo domingo às</span></label><input type="time" data-semh value="${esc(NP.sem || "18:00")}" style="width:auto;padding:4px 8px;margin:0"></div>`;
  return `<section class="card" id="semrev" style="padding:14px">
<div class="top"><b style="font-size:18px">Revisão guiada</b><span class="chip">${n.ok} de 5 passos</span></div>${barra(n.ok / 5, n.ok === 5 ? "var(--g)" : "var(--ac)")}
${a.feita ? `<div class="sm g" style="margin-top:8px">${ic2("ok")} Revisão concluída em ${new Date(a.feita).toLocaleDateString("pt-BR")}.</div>` : ""}
<h3 style="margin:16px 0 6px;text-transform:none;letter-spacing:0;color:var(--tx);font-size:16px">Números da semana</h3>
<div class="g2" style="gap:8px">${d("Brasil (R$)", o, (x) => mnyMix(x.soma), l("Regras seguidas", pct0(o.regras)))}${d("Forex (US$)", s, (x) => mnyC(x.tot, "USD"))}</div>
${c.length ? `<div class="card" style="margin-top:8px;padding:8px 12px"><table><tr><th>Dia</th><th>Brasil</th><th>Forex</th></tr>${c.map((x) => `<tr><td>${i(x)}</td><td class="${cls(o.dias[x] || 0)}">${o.dias[x] != null ? money(o.dias[x]) : "–"}</td><td class="${cls(s.dias[x] || 0)}">${s.dias[x] != null ? mnyC(s.dias[x], "USD") : "–"}</td></tr>`).join("")}</table></div>` : ""}
${m(0, "Stop e limites")}
<div class="sm">${o.n ? `Brasil: ${o.lim.length ? `respeitou a perda máxima do dia em <b>${o.limOk} de ${o.lim.length}</b> dia(s).` : "você não definiu perda máxima nos dias operados (Meu dia)."}` : ""} ${o.estouro.length + s.estouro.length ? `<span class="r">Perdas maiores que o stop planejado: <b>${o.estouro.length}</b> no Brasil${s.n ? ` e <b>${s.estouro.length}</b> no Forex` : ""}.</span>` : o.n || s.n ? '<span class="g">Nenhuma perda passou do stop planejado.</span>' : ""}${o.semStop ? ` <span class="am">${o.semStop} trade(s) sem stop registrado.</span>` : ""}</div>
<div class="sm" style="margin:8px 0 4px">Nesta semana eu tirei o stop, mexi nele ou deixei a perda correr?</div><div class="g2">${p("g_stop", "n", "Não, respeitei", "var(--g)")}${p("g_stop", "s", "Sim, aconteceu", "var(--r)")}</div>
${a.g_stop === "s" ? u("g_stop_txt", "O que eu estava sentindo e o que vou fazer na próxima vez (ex.: ordem de stop na plataforma antes de entrar)?") : ""}
${m(1, "Erro mais caro")}
${o.erro ? `<div class="card" style="margin:0 0 6px">Erro mais caro: <b>${esc(o.erro[0])}</b> <span class="r" style="white-space:nowrap">${money(o.erro[1].v)}</span> <span class="sm mut">(${o.erro[1].n}x)</span></div>${u("g_erro", "Por que aconteceu e o que vai impedir na próxima semana?")}` : '<div class="sm g">Nenhum erro marcado nos trades desta semana.</div>'}
${m(2, "Forex")}
${s.n ? u("g_fx", "Na conta de fora, segui o plano (lote, stop, horário)? O que ajustar?") : '<div class="sm mut">Sem operações no Forex nesta semana.</div>'}
${m(3, "Plano da próxima semana")}
${u("repetir", "O que vou repetir (o que funcionou)?")}${u("parar", "O que vou parar de fazer?")}${u("plano", "Foco para a próxima semana", "Ex.: só 2 trades por dia; stop sempre na plataforma")}
${m(4, "Concluir")}
<button class="btn" style="width:100%" data-rvok="1">${a.feita ? "Revisão concluída ✓" : "Concluir a revisão"}</button>${f}</section>`;
}
(function () {
  const e = vRev;
  ((vRev = function () {
    if (RP[0] !== "w") return e();
    const [o, s, n] = rng(RP),
      r = (S.rev || {})[n] || {},
      i = semResumo(o, s);
    return `<h1>Revisão da semana</h1><label>Período<select id="rp">${opt(
      [
        ["w0", "Esta semana"],
        ["w1", "Semana passada"],
        ["m0", "Este mês"],
        ["m1", "Mês passado"],
      ],
      RP,
    )}</select></label><div class="mut sm" style="margin-bottom:10px">${fmtD(o)} a ${fmtD(s)}</div>${semCard(i, n, r)}<h2>Calendário</h2>${cal()}`;
  }),
    document.addEventListener("click", (o) => {
      var s, n, r, i;
      const l = o.target.closest("[data-rvb]");
      if (l) {
        const [c, p] = l.dataset.rvb.split(":");
        ((((s = S.rev ?? (S.rev = {}))[(n = rng(RP)[2])] ?? (s[n] = {}))[c] =
          p),
          save(),
          render());
        return;
      }
      if (o.target.closest("[data-rvok]")) {
        const c = (r = S.rev ?? (S.rev = {}))[(i = rng(RP)[2])] ?? (r[i] = {});
        ((c.feita = new Date().toISOString()),
          save(),
          render(),
          window.toast &&
            toast("Revisão da semana concluída. Boa semana!", 3e3));
        return;
      }
      const d = o.target.closest("[data-semgo]");
      d && ((RP = d.dataset.semgo), (tab = "rev"), render(), scrollTo(0, 0));
    }),
    document.addEventListener("change", (o) => {
      const s = o.target.closest("[data-semon]"),
        n = o.target.closest("[data-semh]");
      (!s && !n) ||
        ((NP.on = Object.assign({ m: !0, n: !0, ev: !0 }, NP.on || {})),
        s && (NP.on.sem = s.checked),
        n && /^\d\d:\d\d$/.test(n.value) && (NP.sem = n.value),
        alSave(),
        turnoPushSync(!0),
        window.toast &&
          toast(
            NP.on.sem === !1
              ? "Lembrete de domingo desligado."
              : "Lembrete de domingo às " + (NP.sem || "18:00") + ".",
            2500,
          ));
    }));
  const t = npComTurno;
  npComTurno = function () {
    const o = t();
    try {
      o.semana = semPush();
    } catch {}
    return (o.sem || (o.sem = NP.sem || "18:00"), o);
  };
  let a = 0;
  document.addEventListener("click", (o) => {
    o.target.closest('[data-a="savetrade"],[data-qkok]') &&
      (clearTimeout(a), (a = setTimeout(() => turnoPushSync(!1), 8e3)));
  });
})();
function semAviso() {
  if (tab !== "home" || document.getElementById("semav")) return;
  const e = new Date(),
    t = e.getDay(),
    a = t === 0 && e.getHours() >= 12 ? "w0" : t === 1 ? "w1" : null;
  if (!a && t === 5 && e.getHours() >= 17) {
    /* v593: sexta após o fechamento — resumo automático da semana. */
    const [o, s, n] = rng("w0"),
      R0 = semResumo(o, s),
      R = R0.b3 && R0.b3.n ? R0.b3 : R0.fx;
    if (R0.vazio || !R || ((S.rev || {})[n] || {}).feita) return;
    const app = document.getElementById("app");
    if (!app) return;
    const DS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
      dn = (d) => (d ? DS[new Date(d + "T12:00").getDay()] : "—"),
      cor = (v) => (v > 0 ? "var(--g)" : v < 0 ? "var(--r)" : "inherit"),
      brl = (v) => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      linhas = [
        `Resultado <b style="color:${cor(R.tot)};font-variant-numeric:tabular-nums">${brl(R.tot)}</b> · ${R.n} trade(s)${R.acerto == null ? "" : " · " + Math.round(R.acerto * 100) + "% de acerto"}`,
        R.melhor && R.dias[R.melhor] > 0 ? `Melhor dia: <b>${dn(R.melhor)}</b> (${brl(R.dias[R.melhor])})` : "",
        R.pior && R.dias[R.pior] < 0 ? `Pior dia: <b>${dn(R.pior)}</b> (${brl(R.dias[R.pior])})` : "",
        R.erro ? `Erro que mais pesou: <b>${esc(R.erro[0])}</b> (${R.erro[1].n}x · ${brl(R.erro[1].v)})` : "",
      ].filter(Boolean);
    app.insertAdjacentHTML(
      "afterbegin",
      `<div class="card" id="semav"><div class="top"><b>Resumo da semana</b><button class="btn s" data-semgo="w0">Revisar</button></div><div class="sm" style="line-height:1.6">${linhas.join("<br>")}</div></div>`,
    );
    return;
  }
  if (!a) return;
  const [o, s, n] = rng(a);
  if (((S.rev || {})[n] || {}).feita || semResumo(o, s).vazio) return;
  const r = document.getElementById("app");
  r &&
    r.insertAdjacentHTML(
      "afterbegin",
      `<div class="card" id="semav" style="display:flex;align-items:center;gap:10px;border-color:var(--ac)">${ic2("pen")}<div style="flex:1"><b>Revisão da semana pendente</b><div class="sm mut">${fmtD(o).slice(0, 5)} a ${fmtD(s).slice(0, 5)} · 5 passos, uns 10 minutos</div></div><button class="btn" data-semgo="${a}">Fazer</button></div>`,
    );
}
const CDL = {},
  epBR = (e) => {
    const t = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(e || ""));
    return t
      ? Date.parse(`${t[1]}T${t[2] || "12"}:${t[3] || "00"}:00-03:00`) / 1e3
      : NaN;
  };
function cdlSvg(e, t) {
  const a = e.candles || [];
  if (!a.length)
    return '<div class="sm mut">Sem candles para esse período.</div>';
  const o = 360,
    s = 210,
    n = 6,
    r = 58,
    i = 10,
    l = 22,
    d = a.length,
    c = (o - n - r) / d,
    p = numN(t.entry),
    u = numN(t.stop),
    m = numN(t.exit),
    f = numN(t.target),
    x = !e.proxy;
  let v = Math.min(...a.map((ue) => ue[3])),
    g = Math.max(...a.map((ue) => ue[2]));
  x &&
    [p, u, m, f].forEach((ue) => {
      ue != null &&
        ue > v - (g - v) * 0.6 &&
        ue < g + (g - v) * 0.6 &&
        ((v = Math.min(v, ue)), (g = Math.max(g, ue)));
    });
  const h = (g - v) * 0.06 || 1;
  ((v -= h), (g += h));
  const b = (ue) => i + ((g - ue) / (g - v)) * (s - i - l),
    y = (ue) => n + (ue + 0.5) * c,
    j = (ue) => {
      if (
        !isFinite(ue) ||
        ue < a[0][0] - 86400 * 3 ||
        ue > a[d - 1][0] + 86400 * 3
      )
        return null;
      let ve = 0;
      for (let he = 0; he < d; he++) a[he][0] <= ue && (ve = he);
      return ve;
    },
    k = g > 1e3 ? 0 : g > 20 ? 2 : 4,
    A = (ue) =>
      ue.toLocaleString("pt-BR", {
        minimumFractionDigits: k,
        maximumFractionDigits: k,
      });
  let C = "";
  for (let ue = 0; ue <= 3; ue++) {
    const ve = v + ((g - v) * ue) / 3;
    C += `<line x1="${n}" x2="${o - r}" y1="${b(ve)}" y2="${b(ve)}" stroke="var(--bd)" stroke-width=".6"/><text x="${o - r + 4}" y="${b(ve) + 3}" font-size="9" fill="var(--mut)">${A(ve)}</text>`;
  }
  a.forEach((ue, ve) => {
    const he = ue[4] >= ue[1],
      we = he ? "var(--g)" : "var(--r)",
      Be = b(Math.max(ue[1], ue[4])),
      Ge = b(Math.min(ue[1], ue[4]));
    C += `<line x1="${y(ve)}" x2="${y(ve)}" y1="${b(ue[2])}" y2="${b(ue[3])}" stroke="${we}" stroke-width="1"/><rect x="${y(ve) - Math.max(0.6, c * 0.35)}" y="${Be}" width="${Math.max(1.2, c * 0.7)}" height="${Math.max(0.8, Ge - Be)}" fill="${we}"/>`;
  });
  const I = j(epBR(t.dt)),
    J = t.dtx ? j(epBR(t.dtx)) : null,
    se = (ue, ve, he, we) =>
      ue == null
        ? ""
        : `<line x1="${y(ue)}" x2="${y(ue)}" y1="${i}" y2="${s - l}" stroke="${ve}" stroke-width="1.2" stroke-dasharray="3 3"/><text x="${y(ue) > o - r - 44 ? y(ue) - 3 : y(ue) + 3}" text-anchor="${y(ue) > o - r - 44 ? "end" : "start"}" y="${we ? s - l - 5 : i + 9}" font-size="9.5" font-weight="700" fill="${ve}">${he}</text>`;
  I != null &&
    J != null &&
    J > I &&
    (C += `<rect x="${y(I)}" y="${i}" width="${y(J) - y(I)}" height="${s - i - l}" fill="var(--ac)" opacity=".09"/>`);
  const Ie = (ue, ve, he) =>
    ue == null || !x || ue < v || ue > g
      ? ""
      : `<line x1="${n}" x2="${o - r}" y1="${b(ue)}" y2="${b(ue)}" stroke="${ve}" stroke-width="1" stroke-dasharray="5 3" opacity=".9"/><rect x="${o - r + 1}" y="${b(ue) - 7}" width="${r - 2}" height="13" rx="3" fill="${ve}"/><text x="${o - r + 4}" y="${b(ue) + 3}" font-size="9" fill="#ffffff" font-weight="700">${he}</text>`;
  ((C += se(I, "var(--ac)", "Entrada") + se(J, "var(--tx)", "Saída", 1)),
    (C +=
      Ie(u, "var(--r)", "Stop") +
      Ie(f, "var(--g)", "Alvo") +
      Ie(p, "var(--ac)", "Entr.") +
      Ie(m, "#6b7280", "Saída")),
    x &&
      I != null &&
      p != null &&
      (C += `<circle cx="${y(I)}" cy="${b(p)}" r="4" fill="var(--ac)" stroke="#ffffff" stroke-width="1.5"/>`),
    x &&
      J != null &&
      m != null &&
      (C += `<circle cx="${y(J)}" cy="${b(m)}" r="4" fill="var(--tx)" stroke="var(--bg)" stroke-width="1.5"/>`));
  const Pe = (ue) => {
    const ve = new Date(ue * 1e3);
    return e.intervalo === "1d"
      ? ve.toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
        })
      : ve.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        }) +
          (e.intervalo === "60m"
            ? " " +
              ve.toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
              })
            : "");
  };
  [0, Math.floor(d / 2), d - 1].forEach((ue, ve) => {
    C += `<text x="${ve === 0 ? n : ve === 2 ? o - r : y(ue)}" y="${s - 6}" font-size="9" fill="var(--mut)" text-anchor="${ve === 0 ? "start" : ve === 2 ? "end" : "middle"}">${Pe(a[ue][0])}</text>`;
  });
  const Me =
    { "5m": "5 minutos", "60m": "1 hora", "1d": "1 dia" }[e.intervalo] ||
    e.intervalo;
  return `<svg viewBox="0 0 ${o} ${s}" style="width:100%;height:auto;display:block" role="img" aria-label="Gráfico de candles do trade">${C}</svg>
<div class="sm mut" style="margin-top:6px">${esc(e.simbolo)} · candles de ${Me} · Yahoo Finance (com atraso)${I == null ? " · horário da entrada fora do gráfico" : ""}</div>${e.nota ? `<div class="sm ${e.proxy ? "am" : "mut"}" style="margin-top:4px">${esc(e.nota)}</div>` : ""}`;
}
async function fxCandles(e) {
  const t = document.getElementById("fxc");
  if (!t || !e) return;
  const a = cfg();
  if (!a) {
    t.innerHTML =
      '<div class="sm mut">Entre na conta (Supabase) para ver o gráfico do trade.</div>';
    return;
  }
  const o = [e.id, e.ativo, e.sub, e.dt, e.dtx].join("|");
  CDL[o] ||
    (CDL[o] = fetch(a.url + "/functions/v1/candles", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: a.key },
      body: JSON.stringify({
        ativo: e.ativo,
        sub: e.sub || "",
        de: e.dt,
        ate: e.dtx || "",
      }),
    })
      .then(async (r) => {
        let i = {};
        try {
          i = await r.json();
        } catch {}
        if (!r.ok) {
          const l = i.error || "";
          throw new Error(
            l ||
              (r.status === 404
                ? 'Função "candles" não encontrada: publique-a no Supabase (veja o passo a passo).'
                : "Erro " + r.status),
          );
        }
        return i;
      })
      .catch((r) => ({ erro: r.message || String(r) })));
  const s = await CDL[o];
  s.erro && delete CDL[o];
  const n = document.getElementById("fxc");
  !n ||
    n.dataset.fxc !== e.id ||
    (n.innerHTML = s.erro
      ? `<div class="sm mut">${esc(s.erro)}</div>`
      : cdlSvg(s, e));
}
(function () {
  const e = fxHtml;
  fxHtml = function () {
    let a = e();
    const o = FX && S.trades.find((s) => s.id === FX.id);
    return (
      !a ||
        !o ||
        (o.orig === "profit" &&
          numN(o.stop) == null &&
          (a = a.replace(
            "<h2>Plano × execução</h2>",
            `<div class="warn" style="margin:10px 0">${ic2("bolt")} Importado do Profit. Toque em <b>Editar</b> para completar stop, setup e erros.</div><h2>Plano × execução</h2>`,
          )),
        String(o.ativo || "").trim() &&
          o.dt &&
          (a = a.replace(
            "<h2>Plano × execução</h2>",
            `<h2>Gráfico</h2><div class="card" id="fxc" data-fxc="${esc(o.id)}" style="padding:10px"><div class="sm mut">Carregando o gráfico…</div></div><h2>Plano × execução</h2>`,
          ))),
      a
    );
  };
  const t = fxDesenha;
  fxDesenha = function () {
    (t(), FX && fxCandles(S.trades.find((a) => a.id === FX.id)));
  };
})();
const MESA_PRESETS = {
  euro25: {
    nome: "Euro Global Prop 25k",
    moeda: "USD",
    fonte: "usd",
    capital: 25e3,
    meta: 1500,
    perdaDia: 0,
    perdaTotal: 1500,
    dd: "eod",
    trava: 1,
    consist: 40,
    capDia: 0,
    diasMin: 5,
    diasTipo: "pos",
    prazo: 30,
    pregao: 19,
    contratos: 3,
    obs: "Até 3 minis ou 30 micros. Drawdown no fechamento do dia. Pregão das 19h às 18h.",
  },
  mide: {
    nome: "MIDE Exame Arrojado",
    moeda: "BRL",
    fonte: "b3",
    capital: 0,
    meta: 2400,
    perdaDia: 0,
    perdaTotal: 3300,
    dd: "fixo",
    trava: 0,
    consist: 0,
    capDia: 50,
    diasMin: 5,
    diasTipo: "op",
    prazo: 0,
    pregao: 0,
    contratos: 20,
    obs: "Sem stop diário no exame, mas o resultado de cada dia conta no máximo 50% da meta.",
  },
  euroinv: {
    nome: "Euro Invest Júnior",
    moeda: "BRL",
    fonte: "b3",
    capital: 0,
    meta: 1400,
    perdaDia: 0,
    perdaTotal: 2835,
    dd: "fixo",
    trava: 0,
    consist: 40,
    capDia: 0,
    diasMin: 5,
    diasTipo: "pos",
    prazo: 0,
    pregao: 0,
    contratos: 10,
    obs: "Conta turbinada.",
  },
  fpips: {
    nome: "FundingPips 50k",
    moeda: "USD",
    fonte: "fx",
    capital: 5e4,
    meta: 0,
    perdaDia: 1500,
    perdaTotal: 2500,
    dd: "fixo",
    trava: 0,
    consist: 15,
    capDia: 0,
    diasMin: 7,
    diasTipo: "pos",
    prazo: 0,
    pregao: 0,
    contratos: 0,
    obs: "Perda máxima 5% e diária 3%. Preencha a meta da fase.",
  },
  lvl50: {
    nome: "LVL Funding CME 50k",
    moeda: "USD",
    fonte: "usd",
    capital: 5e4,
    meta: 1800,
    perdaDia: 0,
    perdaTotal: 1500,
    dd: "eod",
    trava: 0,
    consist: 0,
    capDia: 0,
    diasMin: 0,
    diasTipo: "pos",
    prazo: 0,
    pregao: 0,
    cme: 1,
    contratos: 2,
    obs: "Futuros CME na Black Arrow Plus. Até 2 minis, 20 micros ou 100 nanos (o app converte micros e nanos em minis). Perda máxima de US$ 1.500 com drawdown no fechamento do dia, no teste e na conta funded. Sem perda diária, sem prazo, sem regra de mediana e sem restrição de notícias ou abertura. Repasse de 90%.",
  },
  custom: {
    nome: "Minha mesa",
    moeda: "BRL",
    fonte: "b3",
    capital: 0,
    meta: 0,
    perdaDia: 0,
    perdaTotal: 0,
    dd: "fixo",
    trava: 0,
    consist: 0,
    capDia: 0,
    diasMin: 0,
    diasTipo: "pos",
    prazo: 0,
    pregao: 0,
    contratos: 0,
    obs: "",
  },
};
function mesaCfg() {
  const e = (S.ax || {}).mesa;
  if (e && e.preset) return e;
  const t = S.prop || {};
  return +t.meta > 0 || +t.ddTotal > 0
    ? {
        ...MESA_PRESETS.custom,
        preset: "custom",
        capital: +t.cap || 0,
        meta: +t.meta || 0,
        perdaDia: +t.perdaDia || 0,
        perdaTotal: +t.ddTotal || 0,
        dd: t.ddTipo === "fixo" ? "fixo" : "trail",
        consist: +t.consist || 0,
        inicio: "",
        _antigo: 1,
      }
    : null;
}
const mesaSalva = (e) => {
  (delete e._antigo, ((S.ax ?? (S.ax = {})).mesa = e), save());
};
function cmeAbreBR(e) {
  try {
    const t = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "shortOffset",
      }).formatToParts(new Date(e + "T15:00:00Z")),
      a = /GMT([+-]\d+)/.exec(
        (t.find((o) => o.type === "timeZoneName") || {}).value || "",
      );
    return 18 + (-3 - (a ? +a[1] : -5));
  } catch {
    return 19;
  }
}
const mesaDia = (e, t, a) => {
    const o = String(e).slice(0, 10),
      s = +String(e).slice(11, 13) || 0,
      n = a ? cmeAbreBR(o) : t;
    return n > 0 && s >= n ? diasMais(o, 1) : o;
  },
  MESA_MICRO =
    /^(MES|MNQ|MYM|M2K|MGC|MCL|MBT|MET|MHG|SIL|M6E|M6A|M6B|MJY|MSF|MCD|MIR|MNG|MTN|M10|M2Y|MWN|QI|QO)/,
  mesaQtd = (e, t) => {
    if (t == null) return null;
    const a = String(e || "").toUpperCase();
    return /^(NANO|NQN|ESN|N[A-Z]{1,3}N)/.test(a) || /NANO/.test(a)
      ? t / 50
      : MESA_MICRO.test(a)
        ? t / 10
        : t;
  };
function mesaItens(e) {
  const t = String(e.ativos || "")
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter(Boolean),
    a = (s) =>
      !t.length ||
      t.some((n) =>
        String(s || "")
          .toUpperCase()
          .startsWith(n),
      );
  let o = [];
  return (
    e.fonte === "fx"
      ? (o = lcItems().map((s) => ({
          d: s.d,
          t: s.d + "T12:00",
          v: s.v,
          q: null,
        })))
      : (o = S.trades
          .map((s) => ({ ...s, c: calc(s) }))
          .filter(
            (s) =>
              s.c.pl != null &&
              moedaT(s) === (e.fonte === "usd" ? "USD" : "BRL") &&
              a(s.ativo),
          )
          .map((s) => ({
            d: mesaDia(s.dtx || s.dt, +e.pregao || 0, e.cme),
            t: s.dtx || s.dt,
            v: s.c.pl,
            q: e.fonte === "usd" ? mesaQtd(s.ativo, numN(s.qty)) : numN(s.qty),
            a: s.ativo,
          }))),
    e.inicio && (o = o.filter((s) => s.d >= e.inicio)),
    o.sort((s, n) => s.t.localeCompare(n.t))
  );
}
function mesaCalc(e, t) {
  const a = mesaItens(e),
    o = +e.perdaTotal || 0,
    s = +e.perdaDia || 0,
    n = +e.meta || 0,
    r = mesaDia(t || loc().slice(0, 16), +e.pregao || 0, e.cme),
    i = {};
  a.forEach((Ge) => {
    i[Ge.d] = (i[Ge.d] || 0) + Ge.v;
  });
  const l = Object.keys(i).sort(),
    d = (Ge) =>
      o
        ? e.dd === "fixo"
          ? -o
          : e.trava
            ? Math.min(Ge - o, 0)
            : Ge - o
        : -1 / 0;
  let c = 0,
    p = 0,
    u = null,
    m = null;
  (e.dd === "trail"
    ? a.forEach((Ge) => {
        ((c += Ge.v), !u && c <= d(p) && (u = Ge.d), (p = Math.max(p, c)));
      })
    : l.forEach((Ge) => {
        ((c += i[Ge]),
          !u && c <= d(p) && (u = Ge),
          Ge !== r && (p = Math.max(p, c)));
      }),
    s > 0 &&
      l.forEach((Ge) => {
        !m && i[Ge] <= -s && (m = Ge);
      }));
  const f = c,
    x = d(p),
    v = o ? f - x : null,
    g = i[r] || 0,
    h = +e.capDia > 0 && n > 0 ? (n * e.capDia) / 100 : 0,
    b = l.reduce((Ge, Ce) => Ge + (h && i[Ce] > h ? h : i[Ce]), 0),
    y = l.filter((Ge) => i[Ge] > 0),
    j = y.length ? Math.max(...y.map((Ge) => i[Ge])) : 0,
    k = +e.consist > 0 && f > 0 ? j / f : null,
    A = +e.consist > 0 ? (f > 0 ? k <= e.consist / 100 : null) : !0,
    C = +e.consist > 0 && j > 0 ? j / (e.consist / 100) : 0,
    I = e.diasTipo === "op" ? l.length : y.length,
    J = !(+e.diasMin > 0) || I >= +e.diasMin,
    se = s > 0 ? s + Math.min(g, 0) : null,
    Ie = [];
  (se != null && Ie.push(["o limite diário", se]),
    v != null && Ie.push(["o limite de perda total", v]));
  const Pe = (() => {
    const Ge = S.days[loc().slice(0, 10)] || {},
      Ce = limPerda(Ge);
    if (!(Ce > 0) || e.fonte !== "b3") return null;
    const Qe = dayPL(dayTr(loc().slice(0, 10)));
    return Ce + Math.min(Qe, 0);
  })();
  Pe != null && Ie.push(["o seu limite do dia (Meu dia)", Pe]);
  const Me = Ie.length
      ? Ie.reduce((Ge, Ce) => (Ce[1] < Ge[1] ? Ce : Ge))
      : null,
    ue =
      +e.consist > 0 && n > 0
        ? Math.max(0, (Math.max(n, f) * e.consist) / 100)
        : h || null,
    ve = +e.prazo > 0 && e.inicio ? diasMais(e.inicio, +e.prazo - 1) : null,
    he = ve
      ? Math.round(
          (new Date(ve + "T12:00") - new Date(loc().slice(0, 10) + "T12:00")) /
            864e5,
        ) + 1
      : null,
    we =
      +e.contratos > 0
        ? a.filter((Ge) => Ge.q != null && Ge.q > +e.contratos).length
        : 0;
  let Be = ["Em andamento", "var(--ac)"];
  return (
    u
      ? (Be = ["Reprovado: perda total", "var(--r)"])
      : m
        ? (Be = ["Reprovado: perda diária", "var(--r)"])
        : n > 0 && b >= n
          ? (Be =
              J && A !== !1
                ? ["Meta batida", "var(--g)"]
                : [
                    "Meta batida, falta " + (J ? "consistência" : "dias"),
                    "var(--am)",
                  ])
          : he != null && he <= 0 && (Be = ["Prazo encerrado", "var(--r)"]),
    {
      it: a,
      dias: i,
      ks: l,
      saldo: f,
      piso: x,
      pk: p,
      margem: v,
      plHoje: g,
      hoje: r,
      lucroEf: b,
      cap: h,
      maior: j,
      cons: k,
      consOk: A,
      precisaTotal: C,
      nDias: I,
      diasOk: J,
      pode: Me,
      ganhoMaxHoje: ue,
      fimPrazo: ve,
      restam: he,
      acima: we,
      quebra: u,
      diaQ: m,
      st: Be,
      meta: n,
      pt: o,
      pd: s,
    }
  );
}
const mFmt = (e, t) => mnyC(t, e.moeda === "USD" ? "USD" : "BRL");
function mesaMini() {
  const e = mesaCfg();
  if (!e) return "";
  const t = mesaCalc(e);
  return `<div class="card" style="padding:12px 14px"><div class="top"><b>${esc(e.nome)}</b><span class="chip" style="color:${t.st[1]};border-color:${t.st[1]}">${t.st[0]}</span></div>
${t.pode ? `<div class="sm mut" style="margin-top:8px">Hoje você ainda pode perder</div><div style="font-size:22px;font-weight:750" class="${t.pode[1] <= 0 ? "r" : ""}">${t.pode[1] <= 0 ? "Nada: pare por hoje" : mFmt(e, t.pode[1])}</div><div class="sm mut">antes de bater ${t.pode[0]}</div>` : ""}
${t.meta > 0 ? `<div class="sm" style="margin-top:8px;display:flex;justify-content:space-between"><span>Meta ${mFmt(e, t.meta)}</span><b class="${cls(t.lucroEf)}">${mFmt(e, t.lucroEf)}</b></div>${barra(t.lucroEf / t.meta, "var(--g)")}` : ""}
<button class="btn s" style="width:100%;margin-top:10px" data-m2="mesa">Abrir o painel da mesa</button></div>`;
}
function vMesa() {
  const e = mesaCfg(),
    t = `<div class="g2" style="gap:8px">${Object.entries(MESA_PRESETS)
      .map(
        ([c, p]) =>
          `<button class="btn ${e && e.preset === c ? "" : "s"}" data-msp="${c}" style="text-align:left;white-space:normal;line-height:1.25">${esc(p.nome)}</button>`,
      )
      .join("")}</div>`;
  if (!e)
    return `<h1>Mesa proprietária</h1><p class="mut">Escolha a sua mesa para o app acompanhar a meta, a perda máxima, os dias mínimos e a consistência com os seus trades. As regras já vêm preenchidas com o que você anotou; confira no regulamento da mesa e ajuste.</p>${t}`;
  const a = mesaCalc(e),
    o = (c) => mFmt(e, c),
    s = (c, p, u = "", m = "") =>
      `<div class="card" style="margin:0;padding:10px"><span class="sm mut">${c}</span><div><b class="${m}" style="font-size:16px">${p}</b></div>${u ? `<div class="sm mut">${u}</div>` : ""}</div>`,
    n = [];
  (a.cap &&
    a.ks.some((c) => a.dias[c] > a.cap) &&
    n.push(
      `Em ${a.ks.filter((c) => a.dias[c] > a.cap).length} dia(s) o ganho passou de ${o(a.cap)} (${e.capDia}% da meta): o excedente não conta para a meta.`,
    ),
    a.consOk === !1 &&
      n.push(
        `Consistência: o maior dia (${o(a.maior)}) é ${pct0(a.cons)} do lucro. O limite é ${e.consist}%: o lucro total precisa chegar a ${o(a.precisaTotal)}.`,
      ),
    a.acima &&
      n.push(
        `${a.acima} trade(s) com mais de ${e.contratos} contrato(s)${e.fonte === "usd" ? " em minis (10 micros ou 50 nanos = 1 mini)" : ""}.`,
      ),
    a.plHoje > 0 &&
      a.ganhoMaxHoje &&
      a.plHoje >= a.ganhoMaxHoje * 0.9 &&
      n.push(
        `Hoje você já ganhou ${o(a.plHoje)}: perto do máximo recomendado para o dia (${o(a.ganhoMaxHoje)}). Pense em parar.`,
      ));
  const r = a.ks.slice(-15).reverse();
  let i = a.saldo;
  const l = {};
  [...a.ks].reverse().forEach((c) => {
    ((l[c] = i), (i -= a.dias[c]));
  });
  const d = (c, p, u = "number", m = "") =>
    `<label>${p}<input type="${u}" ${u === "number" ? 'step="any" inputmode="decimal"' : ""} data-ms="${c}" value="${esc(e[c] ?? "")}" ${m}></label>`;
  return `<h1>Mesa proprietária</h1>
<div class="hero" style="margin-top:0"><div class="top"><span class="chip" style="color:${a.st[1]};border-color:${a.st[1]}">${a.st[0]}</span><span class="sm mut">${esc(e.nome)}</span></div>
${a.pode ? `<div class="sm mut" style="margin-top:10px">Hoje você ainda pode perder</div><div class="big ${a.pode[1] <= 0 ? "r" : ""}">${a.pode[1] <= 0 ? "Nada: pare por hoje" : o(a.pode[1])}</div><div class="sm mut">antes de bater ${a.pode[0]}${a.plHoje ? ` · hoje: <b class="${cls(a.plHoje)}">${o(a.plHoje)}</b>` : ""}</div>` : '<div class="sm mut" style="margin-top:10px">Preencha a perda máxima (diária ou total) para ver quanto pode perder hoje.</div>'}
${a.ganhoMaxHoje ? `<div class="sm" style="margin-top:6px">Ganho máximo recomendado no dia: <b>${o(a.ganhoMaxHoje)}</b>${e.capDia > 0 ? " (acima disso não conta)" : " (consistência)"}</div>` : ""}
${a.meta > 0 ? `<div class="sm" style="margin-top:12px;display:flex;justify-content:space-between"><span>Meta ${o(a.meta)}</span><b>${pct0(Math.max(0, a.lucroEf) / a.meta)}</b></div>${barra(a.lucroEf / a.meta, "var(--g)")}` : ""}</div>
${n.map((c) => `<div class="warn" style="margin:8px 0">${c}</div>`).join("")}
<div class="kv" style="margin-top:10px">${s("Resultado no teste", o(a.saldo), a.it.length + " operação(ões) desde " + (e.inicio ? fmtD(e.inicio) : "o início"), cls(a.saldo))}
${s("Até a perda total", a.margem == null ? "–" : o(a.margem), a.pt ? (e.dd === "fixo" ? "limite fixo de " + o(a.pt) : "piso em " + o(a.piso) + " (pico " + o(a.pk) + ")") : "sem limite", a.margem != null && a.margem < a.pt * 0.3 ? "r" : "")}
${s(e.diasTipo === "op" ? "Dias operados" : "Dias positivos", a.nDias + (+e.diasMin > 0 ? " de " + e.diasMin : ""), a.diasOk ? "mínimo cumprido" : "faltam " + (e.diasMin - a.nDias), a.diasOk ? "g" : "")}
${s("Consistência", +e.consist > 0 ? (a.cons == null ? "–" : pct0(a.cons)) : "sem regra", +e.consist > 0 ? "maior dia ≤ " + e.consist + "% do lucro" : "", a.consOk === !1 ? "r" : a.consOk ? "g" : "")}
${a.fimPrazo ? s("Prazo", a.restam > 0 ? a.restam + " dia(s)" : "encerrado", "até " + fmtD(a.fimPrazo)) : ""}${+e.contratos > 0 ? s("Contratos", `até ${e.contratos}`, a.acima ? a.acima + " trade(s) acima" : "tudo dentro", a.acima ? "r" : "g") : ""}</div>
${r.length ? `<h2>Dia a dia</h2><div class="card"><table><tr><th>Pregão</th><th>Resultado</th><th>Acumulado</th></tr>${r.map((c) => `<tr><td>${dsem(c)} ${fmtD(c).slice(0, 5)}</td><td class="${cls(a.dias[c])}">${o(a.dias[c])}${a.cap && a.dias[c] > a.cap ? ' <span class="sm am">(conta ' + o(a.cap) + ")</span>" : ""}</td><td>${o(l[c])}</td></tr>`).join("")}</table></div>` : '<p class="mut">Nenhuma operação desta mesa ainda. Confira a data de início e de onde vêm os trades nas regras abaixo.</p>'}
<h2>Regras da mesa</h2>${e._antigo ? '<div class="warn">Usando as regras do Painel antigo. Escolha a sua mesa abaixo para completar.</div>' : ""}${t}
${e.obs ? `<div class="sm mut" style="margin:8px 0">${esc(e.obs)}</div>` : ""}<div class="sm am" style="margin:6px 0 10px">Confira sempre no regulamento atual da mesa: as regras mudam.</div>
<div class="card"><div class="g2">${d("nome", "Nome", "text")}${d("inicio", "Início do teste", "date")}</div>
<div class="g2"><label>Trades que contam<select data-ms="fonte">${opt(
    [
      ["mesa", "Lançados aqui na mesa (separados da sua conta)"],
      ["b3", "Do seu diário em R$ (mistura com a sua conta)"],
      ["usd", "Do seu diário em US$ (mistura com a sua conta)"],
      ["fx", "Da aba Forex (mistura com a sua conta)"],
    ],
    e.fonte,
  )}</select></label>${d("ativos", "Só estes ativos (opcional)", "text", 'placeholder="WIN, WDO"')}</div>
<div class="g2"><label>Moeda<select data-ms="moeda">${opt(
    [
      ["BRL", "R$"],
      ["USD", "US$"],
    ],
    e.moeda,
  )}</select></label>${d("capital", "Tamanho da conta")}</div>
<div class="g2">${d("meta", "Meta de lucro")}${d("perdaTotal", "Perda máxima total")}</div>
<div class="g2"><label>Tipo da perda total<select data-ms="dd">${opt(
    [
      ["fixo", "Fixa (do saldo inicial)"],
      ["eod", "Móvel no fechamento do dia"],
      ["trail", "Móvel a cada trade"],
    ],
    e.dd,
  )}</select></label>${d("perdaDia", "Perda máxima diária (0 = não tem)")}</div>
${e.dd !== "fixo" ? `<label class="ck"><input type="checkbox" data-ms="trava"${e.trava ? " checked" : ""}><span>A perda móvel para de subir no saldo inicial</span></label>` : ""}
<div class="g2">${d("consist", "Consistência: maior dia ≤ % do lucro")}${d("capDia", "Ganho do dia conta até % da meta")}</div>
<div class="g2">${d("diasMin", "Dias mínimos")}<label>Contar dias<select data-ms="diasTipo">${opt(
    [
      ["pos", "Positivos"],
      ["op", "Operados"],
    ],
    e.diasTipo,
  )}</select></label></div>
<div class="g3">${d("prazo", "Prazo (dias)")}${e.cme ? `<label>Pregão começa às<input disabled value="${cmeAbreBR(loc().slice(0, 10))}h (CME)"></label>` : d("pregao", "Pregão começa às (h)")}${d("contratos", e.fonte === "usd" ? "Máx. contratos (em minis)" : "Máx. contratos")}</div>
<label class="ck"><input type="checkbox" data-ms="cme"${e.cme ? " checked" : ""}><span>Pregão da CME: o dia vira às 18h de Nova York (19h de Brasília no horário de verão americano, 20h fora dele), ajustado sozinho</span></label></div>`;
}
(function () {
  (document.addEventListener("click", (o) => {
    const s = o.target.closest("[data-msp]");
    if (!s) return;
    const n = mesaCfg(),
      r = MESA_PRESETS[s.dataset.msp];
    (n &&
      !n._antigo &&
      n.preset !== s.dataset.msp &&
      !confirm("Trocar para " + r.nome + "? As regras serão substituídas.")) ||
      (mesaSalva({
        ...r,
        preset: s.dataset.msp,
        inicio: (n && n.inicio) || loc().slice(0, 10),
      }),
      render());
  }),
    document.addEventListener("change", (o) => {
      const s = o.target.closest("[data-ms]");
      if (!s) return;
      const n = mesaCfg() || { ...MESA_PRESETS.custom, preset: "custom" },
        r = s.dataset.ms;
      ((n[r] =
        s.type === "checkbox"
          ? s.checked
            ? 1
            : 0
          : s.type === "number"
            ? s.value === ""
              ? 0
              : +s.value
            : s.value),
        mesaSalva(n),
        render());
    }),
    (HB_NOMES.lim = "Mesa proprietária"));
  const e = ppOut;
  ppOut = function () {
    if ((e(), tab === "home" && mesaCfg())) {
      const o = document.getElementById("pp");
      if (o) {
        o.innerHTML = mesaMini();
        const s = o.previousElementSibling;
        s && s.tagName === "H2" && (s.textContent = "Mesa proprietária");
      }
    }
  };
  const t = vPainel;
  vPainel = function () {
    return t().replace(
      "<h2>🛡️ Mesa proprietária</h2>",
      '<div class="card" style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b>Painel completo da mesa</b><div class="sm mut">Regras prontas das suas mesas, status do teste e quanto pode perder hoje.</div></div><button class="btn" data-m2="mesa">Abrir</button></div><h2>🛡️ Mesa proprietária (básico)</h2>',
    );
  };
  const a = limiteConfere;
  limiteConfere = function () {
    a();
    try {
      const o = mesaCfg();
      if (!o) return;
      const s = mesaCalc(o),
        n = "mesa.av." + s.hoje;
      if (!s.pode || s.pode[1] > 0 || (S.ax || {})[n]) return;
      (((S.ax ?? (S.ax = {}))[n] = 1),
        save(),
        window.toast &&
          toast(
            "🛑 Mesa: você chegou a " + s.pode[0] + ". Pare por hoje.",
            6e3,
          ));
    } catch {}
  };
})();
const CR_PADRAO = {
    renda: 0,
    custo: 0,
    reserva: 0,
    mesesReserva: 12,
    mesesPos: 12,
    alvo: 0,
    ir: 20,
    irDT: 20,
    irSW: 15,
    irFX: 15,
    fx: 1,
  },
  crCfg = () => ({ ...CR_PADRAO, ...((S.ax || {}).carreira || {}) });
var crMeses;
function crCalc(e) {
  const t = crMeses(e),
    a = t.filter((x) => !x.atual),
    o = +e.alvo || +e.renda || 0,
    s = +e.custo || 0;
  let n = 0;
  for (let x = a.length - 1; x >= 0 && a[x].liq > 0; x--) n++;
  const r = (x) => {
      const v = a.slice(-x);
      return v.length ? sum(v.map((g) => g.liq)) / v.length : null;
    },
    i = a.slice(-6),
    l = i.length ? Math.min(...i.map((x) => x.liq)) : null,
    d = diasMais(loc().slice(0, 10), -90),
    c = S.trades
      .map((x) => ({ ...x, c: calc(x) }))
      .filter((x) => x.c.pl != null && dOf(x) >= d),
    p = c.length ? c.filter((x) => x.rules !== "n").length / c.length : null,
    u = s > 0 ? (+e.reserva || 0) / s : null,
    m = s * (+e.mesesReserva || 0),
    f = [
      {
        t: `${e.mesesPos} meses positivos seguidos`,
        v: `${n} de ${e.mesesPos}`,
        ok: n >= +e.mesesPos,
        f: Math.min(1, n / (+e.mesesPos || 1)),
        falta:
          n >= +e.mesesPos
            ? ""
            : `faltam ${e.mesesPos - n} mês(es) positivos seguidos`,
      },
      {
        t: "Média dos últimos 6 meses ≥ renda alvo",
        v: r(6) == null ? "–" : money(r(6)) + " / " + money(o),
        ok: o > 0 && a.length >= 6 && r(6) >= o,
        f: o > 0 && r(6) != null ? Math.max(0, Math.min(1, r(6) / o)) : 0,
        falta: o
          ? a.length < 6
            ? "precisa de 6 meses de histórico"
            : r(6) >= o
              ? ""
              : "faltam " + money(o - r(6)) + " por mês"
          : "preencha a renda alvo",
      },
      {
        t: "Nenhum mês (6m) com perda maior que 1 mês de custo",
        v: l == null ? "–" : "pior: " + money(l),
        ok: s > 0 && l != null && a.length >= 6 && l >= -s,
        f: l == null || !s ? 0 : l >= -s ? 1 : Math.max(0, 1 - (-l - s) / s),
        falta: s ? "" : "preencha o custo de vida",
      },
      {
        t: `Reserva de ${e.mesesReserva} meses de custo`,
        v: u == null ? "–" : u.toFixed(1).replace(".", ",") + " meses",
        ok: s > 0 && (+e.reserva || 0) >= m,
        f: m > 0 ? Math.min(1, (+e.reserva || 0) / m) : 0,
        falta: s
          ? (+e.reserva || 0) >= m
            ? ""
            : "faltam " + money(m - (+e.reserva || 0))
          : "preencha o custo de vida",
      },
      {
        t: "Disciplina: regras seguidas em 90% dos trades (90 dias)",
        v: pct0(p),
        ok: p != null && p >= 0.9 && c.length >= 20,
        f: p || 0,
        falta:
          c.length < 20
            ? "precisa de pelo menos 20 trades nos últimos 90 dias"
            : "",
      },
    ];
  return {
    M: t,
    fe: a,
    seq: n,
    med3: r(3),
    med6: r(6),
    med12: r(12),
    alvo: o,
    custo: s,
    pior6: l,
    disc: p,
    resM: u,
    crit: f,
    ok: f.filter((x) => x.ok).length,
    pos: a.length ? a.filter((x) => x.liq > 0).length / a.length : null,
  };
}
function crGraf(e) {
  const t = e.M.slice(-12);
  if (!t.length) return "";
  const a = 360,
    o = 170,
    s = 4,
    n = 4,
    r = 14,
    i = 22,
    l = t.map((f) => f.liq).concat(e.alvo ? [e.alvo] : [], [0]),
    d = Math.max(...l) * 1.1 || 1,
    c = Math.min(0, ...l) * 1.1,
    p = (f) => r + ((d - f) / (d - c)) * (o - r - i),
    u = (a - s - n) / t.length;
  let m = `<line x1="${s}" x2="${a - n}" y1="${p(0)}" y2="${p(0)}" stroke="var(--bd)"/>`;
  return (
    t.forEach((f, x) => {
      const v = p(Math.max(0, f.liq)),
        g = Math.abs(p(f.liq) - p(0));
      m += `<rect x="${s + x * u + u * 0.15}" y="${v}" width="${u * 0.7}" height="${Math.max(1, g)}" rx="3" fill="${f.liq >= 0 ? "var(--g)" : "var(--r)"}" opacity="${f.atual ? 0.5 : 1}"/><text x="${s + x * u + u / 2}" y="${o - 6}" font-size="9" text-anchor="middle" fill="var(--mut)">${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+f.k.slice(5) - 1]}</text>`;
    }),
    e.alvo &&
      (m += `<line x1="${s}" x2="${a - n}" y1="${p(e.alvo)}" y2="${p(e.alvo)}" stroke="var(--ac)" stroke-dasharray="5 4"/><text x="${a - n}" y="${p(e.alvo) - 4}" font-size="9.5" text-anchor="end" fill="var(--ac)" font-weight="700">renda alvo</text>`),
    `<svg viewBox="0 0 ${a} ${o}" style="width:100%;height:auto;display:block" role="img" aria-label="Resultado líquido por mês">${m}</svg>`
  );
}
function vCarreira() {
  const e = crCfg(),
    t = crCalc(e),
    a = (n, r) =>
      `<label>${r}<input type="number" step="any" inputmode="decimal" data-cr="${n}" value="${esc(e[n] || "")}"></label>`,
    o = !(+e.renda > 0 || +e.custo > 0),
    s =
      t.ok === 5
        ? [
            "Os números permitem planejar a saída",
            "var(--g)",
            "Monte a data com calma: avise com antecedência, mantenha a reserva intocada e converse com um contador sobre impostos e INSS.",
          ]
        : t.ok >= 3
          ? [
              "Perto, mas ainda não",
              "var(--am)",
              "Mantenha a CLT e feche os critérios que faltam. Sair antes da hora transforma o trading em obrigação de pagar contas, o que piora as decisões.",
            ]
          : [
              "Ainda não: mantenha a CLT",
              "var(--r)",
              "Use o salário como base e construa histórico. O critério que mais pesa é a sequência de meses positivos com disciplina.",
            ];
  return `<h1>Plano de transição</h1><p class="mut sm" style="margin-top:-4px">Quando dá para viver do trading com segurança. Usa os seus resultados (Brasil${e.fx ? " + Forex convertido pelo dólar de hoje" : ""}) já descontando o IR estimado.</p>
${o ? '<div class="warn">Preencha o salário, o custo de vida e a reserva no fim da página para o plano funcionar.</div>' : ""}
<div class="hero" style="margin-top:8px"><div class="top"><span class="chip" style="color:${s[1]};border-color:${s[1]}">${t.ok} de 5 critérios</span><span class="sm mut">prontidão</span></div><div class="big" style="color:${s[1]}">${Math.round((t.ok / 5) * 100)}%</div>${barra(t.ok / 5, s[1])}<div style="margin-top:10px;font-weight:650">${s[0]}</div><div class="sm mut" style="margin-top:4px">${s[2]}</div></div>
<h2>Critérios</h2>${t.crit.map((n) => `<div class="card" style="padding:10px 12px"><div style="display:flex;gap:8px;align-items:flex-start"><b class="${n.ok ? "g" : "r"}" style="flex:none">${n.ok ? "✓" : "✗"}</b><div style="flex:1"><div>${n.t}</div><b style="font-size:15px">${n.v}</b>${barra(n.f, n.ok ? "var(--g)" : "var(--ac)")}${n.falta ? `<div class="sm mut" style="margin-top:4px">${n.falta}</div>` : ""}</div></div></div>`).join("")}
<h2>Resultado por mês (líquido de IR)</h2>${
    t.M.length
      ? `<div class="card">${crGraf(t)}</div>
<div class="kv">${KV("Média 3 meses", t.med3 == null ? "–" : money(t.med3), cls(t.med3 || 0))}${KV("Média 6 meses", t.med6 == null ? "–" : money(t.med6), cls(t.med6 || 0), t.alvo ? "alvo " + money(t.alvo) : "")}${KV("Média 12 meses", t.med12 == null ? "–" : money(t.med12), cls(t.med12 || 0))}${KV("Meses positivos", pct0(t.pos), "", t.seq + " seguido(s) agora")}${KV("Média 6m × custo de vida", t.custo && t.med6 != null ? Math.round((t.med6 / t.custo) * 100) + "%" : "–")}${KV("Reserva", t.resM == null ? "–" : t.resM.toFixed(1).replace(".", ",") + " meses", "", "de custo de vida")}</div>
<div class="card"><table><tr><th>Mês</th><th>Brasil</th>${e.fx ? "<th>Forex</th>" : ""}<th>Líquido</th></tr>${t.M.slice(
          -12,
        )
          .reverse()
          .map(
            (n) =>
              `<tr><td>${n.k.slice(5)}/${n.k.slice(2, 4)}${n.atual ? ' <span class="sm mut">(em curso)</span>' : ""}</td><td class="${cls(n.b3)}">${money(n.b3)}</td>${e.fx ? `<td class="${cls(n.fx)}">${money(n.fx)}</td>` : ""}<td class="${cls(n.liq)}"><b>${money(n.liq)}</b>${n.ir ? `<div class="sm mut">IR ${money(n.ir)}</div>` : ""}</td></tr>`,
          )
          .join("")}</table></div>`
      : '<p class="mut">Sem trades fechados ainda.</p>'
  }
<h2>Seus números</h2><div class="card"><div class="g2">${a("renda", "Salário líquido hoje (R$/mês)")}${a("custo", "Custo de vida (R$/mês)")}</div><div class="g2">${a("alvo", "Renda alvo do trading (R$/mês)")}${a("reserva", "Reserva guardada (R$)")}</div><div class="g3">${a("mesesReserva", "Reserva (meses)")}${a("mesesPos", "Meses positivos seguidos")}</div><div class="g3">${a("irDT", "IR day trade (%)")}${a("irSW", "IR swing e opções (%)")}${a("irFX", "IR exterior/Forex (%)")}</div>
<label class="ck"><input type="checkbox" data-cr="fx"${e.fx ? " checked" : ""}><span>Somar o Forex (convertido em reais)</span></label>
<div class="sm mut" style="margin-top:6px">Se a renda alvo ficar vazia, o app usa o salário. O IR é estimado por tipo, cada um compensando os próprios prejuízos: day trade (mesmo dia) 20%; swing e opções 15%, com isenção do lucro em ações quando as vendas de ações no mês somam até R$ 20 mil; operações em US$ e Forex/mesa pela alíquota informada (a tributação de payout de mesa proprietária varia: confirme com um contador). Não é recomendação financeira: é um termômetro dos seus próprios números.</div></div>`;
}
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-cr]");
  if (!t) return;
  const a = crCfg();
  ((a[t.dataset.cr] =
    t.type === "checkbox"
      ? t.checked
        ? 1
        : 0
      : t.value === ""
        ? 0
        : +t.value),
    ((S.ax ?? (S.ax = {})).carreira = a),
    save(),
    render());
});
const PFX = {
    busy: 0,
    err: "",
    ult: ls.get("diario-pf-ult") || "",
    n: 0,
    off: 0,
  },
  pvDe = (e) => {
    const t = String(e || "").toUpperCase();
    return /^WIN/.test(t)
      ? 0.2
      : /^IND/.test(t)
        ? 1
        : /^WDO/.test(t)
          ? 10
          : /^DOL/.test(t)
            ? 50
            : /^BIT/.test(t)
              ? 0.1
              : null;
  },
  brLocal = (e) => {
    if (!e) return "";
    const t = new Date(e);
    return isNaN(t)
      ? String(e).slice(0, 16)
      : t
          .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
          .slice(0, 16)
          .replace(" ", "T");
  };
function pfTrade(e) {
  const t = +e.preco_entrada,
    a = e.preco_saida == null ? null : +e.preco_saida,
    o = +e.qtd || 1,
    s = e.lado === "V" ? -1 : 1;
  let n = +e.valor_ponto || pvDe(e.ativo);
  !n &&
    e.resultado != null &&
    a != null &&
    a !== t &&
    (n = Math.abs((+e.resultado + (+e.custos || 0)) / ((a - t) * s * o)) || 1);
  const r = brLocal(e.abertura),
    i = a == null ? "" : brLocal(e.fechamento || e.abertura),
    l = String(e.ativo || "").toUpperCase(),
    d = !FUT.test(l) && OPT.test(l),
    c = {
      id: /^imp[0-9a-z]+$/.test(e.id_externo) ? e.id_externo : uid(),
      tipo: d
        ? "O"
        : FUT.test(l) || r.slice(0, 10) === (i || r).slice(0, 10)
          ? "D"
          : "S",
      ativo: l,
      side: s < 0 ? "V" : "C",
      qty: String(o),
      entry: String(t),
      exit: a == null ? "" : String(a),
      stop: e.stop != null ? String(+e.stop) : "",
      target: "",
      pv: String(d ? 1 : n || 1),
      cost: e.custos != null ? String(e.custos) : "",
      dt: r,
      dtx: i,
      setup: "",
      err: "Nenhum",
      rules: "",
      nota: "",
      ext: "profit:" + e.id_externo,
      orig: "profit",
      u: Date.now(),
    };
  if (d)
    try {
      Object.assign(c, optInfo(l, new Date(r + ":00")));
    } catch {}
  return c;
}
function pfJaTem(e) {
  const t = Date.parse(e.dt);
  return S.trades.some(
    (a) =>
      a.orig !== "profit" &&
      String(a.ativo || "").toUpperCase() === e.ativo &&
      a.side === e.side &&
      String(+a.qty) === String(+e.qty) &&
      Math.abs(Date.parse(a.dt) - t) <= 6e5,
  );
}
async function profitImporta(e) {
  if (!(!SESS || !cfg() || PFX.busy || (PFX.off && !e))) {
    PFX.busy = 1;
    try {
      const t = await (
          await rq(
            "/rest/v1/operacoes_profit?select=*&importado=eq.false&order=abertura.asc&limit=500",
          )
        ).json(),
        a = new Set(S.trades.flatMap((r) => [r.ext, r.id]).filter(Boolean)),
        o = [],
        s = [];
      let n = 0;
      ((t || []).forEach((r) => {
        s.push(r.id);
        const i = "profit:" + r.id_externo;
        if (
          a.has(i) ||
          a.has(r.id_externo) ||
          !r.ativo ||
          !isFinite(+r.preco_entrada)
        )
          return;
        const l = pfTrade(r);
        if (pfJaTem(l)) {
          n++;
          return;
        }
        (a.add(i), a.add(l.id), o.push(l));
      }),
        n &&
          !o.length &&
          window.toast &&
          toast(n + " operação(ões) do Profit já estavam no diário.", 3e3),
        o.length
          ? (S.trades.push(...o),
            save(),
            render(),
            window.toast &&
              toast(
                `${o.length} operação(ões) importada(s) do Profit. Complete stop e setup na ficha.`,
                5e3,
              ),
            setTimeout(() => {
              try {
                limiteConfere();
              } catch {}
            }, 300))
          : n &&
            window.toast &&
            toast("Nenhuma operação nova do Profit.", 2500),
        s.length &&
          (await rq("/rest/v1/operacoes_profit?id=in.(" + s.join(",") + ")", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ importado: !0 }),
          })),
        (PFX.n += o.length),
        (PFX.ult = new Date().toISOString()),
        ls.set("diario-pf-ult", PFX.ult),
        (PFX.err = ""),
        (PFX.off = 0));
    } catch (t) {
      ((PFX.err =
        t.status === 404 || /operacoes_profit/.test(t.message || "")
          ? 'Falta criar a tabela: rode o SQL "profit-importacao.sql" no Supabase.'
          : t.message || String(t)),
        t.status === 404 && (PFX.off = 1));
    }
    ((PFX.busy = 0), tab === "import" && render());
  }
}
((function () {
  const e = vImport;
  ((vImport = function () {
    const t = e();
    return (
      `<div class="card" style="padding:14px"><div class="top"><b style="font-size:16px">${ic2("bolt")} Importação automática do Profit</b><span class="chip" style="color:${PFX.err ? "var(--am)" : "var(--g)"};border-color:${PFX.err ? "var(--am)" : "var(--g)"}">${PFX.err ? "atenção" : SESS ? "ligada" : "entre na conta"}</span></div>
<div class="sm mut" style="margin:6px 0">Exporte no Profit o Histórico de ordens (CSV) para a pasta Downloads do computador: a ponte envia as operações encerradas, com o stop, e o app traz para o diário sozinho (ao abrir e a cada 2 minutos). Depois é só completar setup e erros na ficha.</div>
${PFX.err ? `<div class="warn">${esc(PFX.err)}</div>` : ""}<div class="sm">${PFX.ult ? "Última busca: " + new Date(PFX.ult).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Ainda não buscou."}${PFX.n ? " · " + PFX.n + " importada(s) nesta sessão" : ""}</div>
<button class="btn s" style="width:100%;margin-top:10px" data-pfnow="1"${SESS ? "" : " disabled"}>Buscar agora</button></div>` +
      t
    );
  }),
    document.addEventListener("click", (t) => {
      t.target.closest("[data-pfnow]") && profitImporta(!0);
    }),
    setTimeout(() => profitImporta(!1), 6e3),
    setInterval(() => {
      document.visibilityState === "visible" && profitImporta(!1);
    }, 12e4),
    document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" &&
        setTimeout(() => profitImporta(!1), 1500);
    }));
})(),
  (function () {
    const e = render0;
    render0 = function () {
      e.apply(this, arguments);
      try {
        semAviso();
      } catch (t) {
        console.error(t);
      }
    };
  })());
const TVG = { n: 0, dados: {}, obs: null },
  tvEscuro = () => {
    const e = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim(),
      t = /^#?([0-9a-f]{6})$/i.exec(e);
    if (!t) return !0;
    const a = parseInt(t[1], 16);
    return (
      (a >> 16) * 0.299 + ((a >> 8) & 255) * 0.587 + (a & 255) * 0.114 < 128
    );
  },
  tvSimbolo = (e, t) =>
    t ? String(e).toUpperCase() : "BMFBOVESPA:" + String(e).toUpperCase(),
  TV_TEMPOS = [
    ["M", "Mensal", "60M"],
    ["W", "Semanal", "24M"],
    ["D", "Diário", "6M"],
  ];
function tvWidget(e, t, a, o, s) {
  e.innerHTML =
    '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
  const n = document.createElement("script");
  return (
    (n.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"),
    (n.async = !0),
    (n.innerHTML = JSON.stringify({
      autosize: !0,
      symbol: t,
      interval: o || "D",
      range: s || (a ? "6M" : "3M"),
      timezone: "America/Sao_Paulo",
      theme: tvEscuro() ? "dark" : "light",
      style: "1",
      locale: "br",
      allow_symbol_change: !!a,
      hide_side_toolbar: !a,
      hide_top_toolbar: !1,
      withdateranges: !!a,
      save_image: !1,
      calendar: !1,
      support_host: "https://www.tradingview.com",
    })),
    n
  );
}
function tvMontaUm(e) {
  if (e.dataset.ok) return;
  e.dataset.ok = 1;
  const t = TVG.dados[e.id];
  if (!t) return;
  const a = e.querySelector(".lwc-svg"),
    o = [...e.querySelectorAll(".lwc-cv")];
  let s = 0;
  o.forEach((n) => {
    const r = n.querySelector(".tvg-box"),
      i = tvWidget(r, tvSimbolo(t.tk, t.us), 0, n.dataset.iv, n.dataset.rg);
    ((n.style.cssText +=
      ";display:block;position:absolute;left:-9999px;width:" +
      (e.clientWidth || 340) +
      "px"),
      (i.onload = () => {
        ((n.style.position = ""),
          (n.style.left = ""),
          (n.style.width = ""),
          !s++ && a && (a.style.display = "none"));
      }),
      (i.onerror = () => {
        n.style.display = "none";
      }),
      r.querySelector(".tradingview-widget-container").appendChild(i));
  });
}
function tvMonta() {
  const e = [...document.querySelectorAll(".lwc:not([data-ok])")].filter(
    (t) => !t.closest("#pdfov"),
  );
  if (e.length) {
    if (!("IntersectionObserver" in window)) {
      e.forEach(tvMontaUm);
      return;
    }
    (TVG.obs ||
      (TVG.obs = new IntersectionObserver(
        (t) =>
          t.forEach((a) => {
            a.isIntersecting &&
              (TVG.obs.unobserve(a.target), tvMontaUm(a.target));
          }),
        { rootMargin: "300px 0px" },
      )),
      e.forEach((t) => TVG.obs.observe(t)));
  }
}
function tvAbre(e, t) {
  const a = document.getElementById("tvfs");
  a && a.remove();
  const o = tvSimbolo(e, t === "US"),
    s = document.createElement("div");
  ((s.id = "tvfs"),
    (s.dataset.noswipe = 1),
    (s.innerHTML = `<div class="fx-top"><button class="btn s ib" data-tvx="1" aria-label="Fechar">✕</button><div style="flex:1;text-align:center"><b>${esc(e)}</b><div class="sm mut">TradingView</div></div><a class="btn s" href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(o)}" target="_blank" rel="noopener">App</a></div><div class="tvfs-cv" style="flex:1;min-height:0"></div>`),
    document.body.appendChild(s),
    (document.body.style.overflow = "hidden"));
  const n = s.querySelector(".tvfs-cv"),
    r = tvWidget(n, o, 1);
  n.querySelector(".tradingview-widget-container").appendChild(r);
}
(function () {
  const e = TraderStyles.slot("legacy-013");
  ((e.textContent = TraderStyles.css("legacy-013")), TraderStyles.mount(e));
  const t = anxChart;
  ((anxChart = function (o) {
    const s = t(o);
    if (!s) return s;
    const n = s.lastIndexOf("</svg>") + 6,
      r = s.slice(0, n),
      i = s.slice(n),
      l = "tvg" + ++TVG.n,
      d = o.moeda === "USD";
    TVG.dados[l] = { tk: o.tk, us: d };
    const c = Object.keys(TVG.dados);
    return (
      c.length > 60 && delete TVG.dados[c[0]],
      `<div class="lwc" id="${l}" data-noswipe="1"><div class="lwc-svg">${r}${i}</div>${TV_TEMPOS.map(([p, u, m]) => `<div class="lwc-cv" data-iv="${p}" data-rg="${m}" style="display:none"><div class="tvg-t">${u}</div><div class="tvg-box"></div></div>`).join("")}</div>
<div class="lwc-bt" style="display:flex;gap:6px;margin-top:8px"><button class="btn s" data-tvopen="${esc(o.tk)}|${d ? "US" : "BR"}" style="flex:1">⤢ Abrir em tela cheia</button></div><div class="sm mut" style="margin-top:4px">Gráficos do TradingView: mensal (tendência primária), semanal (intermediária) e diário (entrada). Os pivôs calculados estão na tabela abaixo.</div>`
    );
  }),
    document.addEventListener("click", (o) => {
      const s = o.target.closest("[data-tvopen]");
      if (s) {
        const [n, r] = s.dataset.tvopen.split("|");
        tvAbre(n, r);
        return;
      }
      if (o.target.closest("[data-tvx]")) {
        const n = document.getElementById("tvfs");
        (n && n.remove(), (document.body.style.overflow = ""));
      }
    }),
    document.addEventListener("keydown", (o) => {
      if (o.key === "Escape") {
        const s = document.getElementById("tvfs");
        s && (s.remove(), (document.body.style.overflow = ""));
      }
    }));
  const a = render0;
  render0 = function () {
    (a.apply(this, arguments), setTimeout(tvMonta, 0));
  };
})();
function anxMtf(e, t) {
  const a = e && e.mtf,
    o =
      t && t.multitempo && typeof t.multitempo == "object" ? t.multitempo : {};
  if (!a && !Object.keys(o).length) return "";
  const s = (i) => (i === "alta" ? "g" : i === "baixa" ? "r" : "mut"),
    n = (i, l) =>
      l
        ? `<tr><td><b>${i}</b></td><td class="${s(l.tendencia)}">${esc(l.tendencia)}</td><td style="white-space:nowrap;font-size:12px">MM${l.media_rapida.n} ${anxP(l.media_rapida.valor)} ${l.media_rapida.inclinacao === "subindo" ? '<span class="g">↑</span>' : l.media_rapida.inclinacao === "caindo" ? '<span class="r">↓</span>' : "→"}<br>MM${l.media_lenta.n} ${anxP(l.media_lenta.valor)}${l.media_200 ? `<br>MM200 ${l.media_200.valor != null ? anxP(l.media_200.valor) + " " + (l.media_200.preco_acima ? '<span class="g" title="preço acima">▲</span>' : '<span class="r" title="preço abaixo">▼</span>') : '<span class="mut">—</span>'}` : ""}</td><td>${anxN(l.rsi14, 0)}</td><td>${l.posicao_na_faixa_pct == null ? "–" : l.posicao_na_faixa_pct + "%"}</td></tr>`
        : "",
    r = a ? a.alinhamento : "";
  return (
    `<h3>Leitura multi-tempo (mensal → semanal → diário)</h3>${a ? `<div class="anxt"><table><tr><th>Tempo</th><th>Tendência</th><th>Médias</th><th>RSI</th><th>Na faixa</th></tr>${n("Mensal", a.mensal)}${n("Semanal", a.semanal)}${n("Diário", a.diario)}</table></div><div class="sm" style="margin:6px 0">Alinhamento: ${anxVb(r, /ALTA/.test(r) ? "g" : /BAIXA/.test(r) ? "r" : "w")} <span class="mut">· Médias de 20, 50 e 200 períodos em cada tempo. Tendência de alta = preço acima da MM20, MM20 acima da MM50 e subindo (baixa é o contrário). ▲/▼ = preço acima/abaixo da MM200; "—" = histórico curto para ela. "Na faixa" = onde o preço está entre a mínima (0%) e a máxima (100%) do período</span></div>` : ""}` +
    [
      ["mensal", "Mensal"],
      ["semanal", "Semanal"],
      ["diario", "Diário"],
    ]
      .map(([i, l]) =>
        o[i]
          ? `<div class="sm" style="margin-top:4px"><b>${l}:</b> ${esc(typeof o[i] == "string" ? o[i] : anxTx(o[i]))}</div>`
          : "",
      )
      .join("") +
    (o.leitura_top_down
      ? `<div style="margin-top:6px">${anxV(o.leitura_top_down)}</div>`
      : "")
  );
}
function anxValRef(e) {
  const t = e && e.val;
  if (!t) return "";
  const a = (n) =>
      n == null
        ? ""
        : ` <span class="${n >= 0 ? "g" : "r"}">(${n > 0 ? "+" : ""}${anxN(n, 1)}%)</span>`,
    o = (n, r, i) =>
      `<tr><td>${n}${i ? `<div class="sm mut">${esc(i)}</div>` : ""}</td><td>${r}</td></tr>`,
    s = [
      t.graham && t.graham.valor != null
        ? o(
            "Graham",
            anxP(t.graham.valor) + a(t.graham.upside_pct),
            t.graham.conta,
          )
        : "",
      t.bazin_6pct && t.bazin_6pct.valor != null
        ? o(
            "Bazin (6% a.a.)",
            anxP(t.bazin_6pct.valor) + a(t.bazin_6pct.upside_pct),
            t.bazin_6pct.conta,
          )
        : "",
      t.alvo_medio_analistas && t.alvo_medio_analistas.valor != null
        ? o(
            "Alvo médio dos analistas",
            anxP(t.alvo_medio_analistas.valor) +
              a(t.alvo_medio_analistas.upside_pct),
          )
        : "",
      t.earnings_yield_pct != null
        ? o(
            "Earnings yield (1 ÷ P/L)",
            anxN(t.earnings_yield_pct, 1) +
              "%" +
              (t.premio_earnings_yield_sobre_selic_pp != null
                ? ` <span class="${t.premio_earnings_yield_sobre_selic_pp >= 0 ? "g" : "r"}">(${t.premio_earnings_yield_sobre_selic_pp > 0 ? "+" : ""}${anxN(t.premio_earnings_yield_sobre_selic_pp, 1)} p.p. vs Selic)</span>`
                : ""),
          )
        : "",
      t.roe_menos_selic_pp != null
        ? o(
            "ROE − Selic",
            `<span class="${t.roe_menos_selic_pp >= 0 ? "g" : "r"}">${t.roe_menos_selic_pp > 0 ? "+" : ""}${anxN(t.roe_menos_selic_pp, 1)} p.p.</span>`,
          )
        : "",
      t.fcf_yield_pct != null
        ? o(
            "FCF yield (caixa livre ÷ valor de mercado)",
            anxN(t.fcf_yield_pct, 1) + "%",
          )
        : "",
      t.posicao_52s_pct != null
        ? o("Posição na faixa de 52 semanas", t.posicao_52s_pct + "%")
        : "",
    ].join("");
  return s
    ? `<h3>Referências de valuation (calculadas)</h3><div class="anxt"><table><tr><th>Método</th><th>Valor</th></tr>${s}</table></div><div class="sm mut" style="margin-top:4px">Preço atual ${anxP(t.preco)}. ${esc(t.observacao || "")}</div>`
    : "";
}
function anxCen(e) {
  if (((e = anxArr(e).filter((n) => n && typeof n == "object")), !e.length))
    return "";
  const t = e.every(
      (n) =>
        isFinite(+n.probabilidade_pct) && n.preco != null && isFinite(+n.preco),
    ),
    a = e.reduce((n, r) => n + (+r.probabilidade_pct || 0), 0),
    o =
      t && a > 0
        ? e.reduce((n, r) => n + +r.preco * +r.probabilidade_pct, 0) / a
        : null,
    s = (n) => (/otim/i.test(n) ? "g" : /pess/i.test(n) ? "r" : "");
  return `<h3>Cenários</h3><div class="anxt"><table><tr><th>Cenário</th><th>Prob.</th><th>Preço</th></tr>${e.map((n) => `<tr><td class="${s(n.cenario)}"><b>${esc(String(n.cenario || "").replace(/^./, (r) => r.toUpperCase()))}</b>${n.premissas ? `<div class="sm mut" style="font-weight:400">${esc(anxTx(n.premissas))}</div>` : ""}</td><td>${isFinite(+n.probabilidade_pct) ? anxN(n.probabilidade_pct, 0) + "%" : "–"}</td><td>${n.preco == null ? "sem dado" : anxP(n.preco)}</td></tr>`).join("")}</table></div>${o != null ? `<div class="sm" style="margin-top:4px">Preço ponderado pelas probabilidades: <b>${anxP(o)}</b></div>` : ""}`;
}
function anxMacro(e, t) {
  const a = t && t.macro,
    o = e && e.contexto_macro,
    s = typeof o == "string" && /^\s*sem dado\.?\s*$/i.test(o) ? "" : o;
  return !a && !s
    ? ""
    : `<h2>Contexto macro</h2><div class="card">${a ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"><span class="chip">Selic ${anxN(a.selic_pct, 2)}%</span><span class="chip">IPCA 12m ${anxN(a.ipca12_pct, 2)}%</span><span class="chip">Juro real ${anxN(a.juro_real_pct, 2)}%</span></div>${a.obs ? `<div class="sm mut" style="margin-bottom:6px">${esc(a.obs)}</div>` : ""}` : ""}${s ? anxV(s) : ""}</div>`;
}
function anxEnt(e) {
  if (!e || typeof e != "object" || (!e.compra && !e.venda)) return "";
  const t = (a, o) => {
    if (!a) return "";
    const s =
        a.vs_tempo_maior === "A FAVOR"
          ? "g"
          : a.vs_tempo_maior === "CONTRA"
            ? "r"
            : "w",
      n = (r, i) =>
        i
          ? `<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-top:1px solid var(--bd)"><span class="sm mut">${r}</span><b style="text-align:right;font-size:14px">${esc(i)}</b></div>`
          : "";
    return `<div class="card" style="margin:6px 0;border-left:3px solid ${o}"><div class="top"><b style="color:${o}">${a.lado === "COMPRA" ? "▲ Compra" : "▼ Venda"}</b>${anxVb(a.vs_tempo_maior === "A FAVOR" ? "a favor do tempo maior" : a.vs_tempo_maior === "CONTRA" ? "contra o tempo maior" : "tempo maior neutro", s)}</div>
<div class="sm mut" style="margin:4px 0 6px">${esc(a.tempo)}</div>${a.gatilho ? `<div class="sm" style="margin-bottom:6px"><b>Gatilho:</b> ${esc(a.gatilho)}</div>` : ""}${n("Entrada", a.entrada)}${n("Stop", a.stop)}${n("Alvo 1", a.alvo_1)}${n("Alvo 2", a.alvo_2)}${a.atende_3_para_1 ? "" : '<div class="sm am" style="margin-top:4px">Sem entrada com risco/retorno de 3:1 por enquanto: espere o gatilho.</div>'}</div>`;
  };
  return `<h3>Pontos de entrada (compra e venda)</h3>${t(e.compra, "var(--g)")}${t(e.venda, "var(--r)")}<div class="sm mut">Números calculados pelo servidor (níveis e ATR); o gatilho é a leitura da IA. Stop é para ficar na plataforma, sempre.</div>`;
}
function anxDec(e) {
  const t = e && e.decisao;
  if (!t && !e.para_quem_tem && !e.para_quem_nao_tem) return "";
  const a = t ? t.zona : "",
    o =
      a === "COMPRAR"
        ? "g"
        : a === "VENDER" || a === "REDUZIR"
          ? "r"
          : a === "MANTER"
            ? "w"
            : "n",
    s = t && t.posicao,
    n = (r, i, l = "") =>
      `<div><span class="sm mut">${r}</span><b class="${l}" style="display:block;font-size:18px">${i}</b></div>`;
  return `<div class="card" style="margin:10px 0;border:1px solid var(--ac)"><div class="top"><b>Decisão</b>${a && a !== "SEM DADO" ? anxVb(a, o) : anxVb("sem preço justo", "n")}</div>
${
  t && t.preco_justo != null
    ? `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">${n("Preço justo", anxP(t.preco_justo))}${n("Comprar até", anxP(t.preco_teto), "g")}${n("Potencial", (t.upside_pct > 0 ? "+" : "") + anxN(t.upside_pct, 1) + "%", cls(t.upside_pct))}</div>
<div class="sm mut" style="margin-top:6px">Preço atual ${esc(t.situacao || "")}. Margem de segurança de ${t.margem_pct}% pela qualidade do negócio. Conta: ${esc(t.conta || "")}</div>`
    : t
      ? `<div class="sm mut" style="margin-top:6px">Sem preço justo: ${esc(t.conta || "faltaram dados nos cenários")}.</div>`
      : ""
}
${s ? `<div class="sm" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bd)">Sua posição: preço médio <b>${anxP(s.preco_medio)}</b>${s.quantidade ? " · " + anxN(s.quantidade, 0) + " ações" : ""}${s.peso_pct != null ? " · " + anxN(s.peso_pct, 1) + "% da carteira" : ""} · resultado <b class="${cls(s.resultado_pct)}">${(s.resultado_pct > 0 ? "+" : "") + anxN(s.resultado_pct, 1)}%</b></div>` : ""}
${e.para_quem_tem ? `<div style="margin-top:8px"><b class="sm">Se você tem:</b> ${esc(anxTx(e.para_quem_tem))}</div>` : ""}${e.para_quem_nao_tem ? `<div style="margin-top:6px"><b class="sm">Se você não tem:</b> ${esc(anxTx(e.para_quem_nao_tem))}</div>` : ""}</div>`;
}
if (typeof rsCard == "function") {
  const e = rsCard;
  rsCard = function (t) {
    let a = e(t);
    const o = typeof RS < "u" && RS.jobs ? RS.jobs[t.id] : null;
    if (
      o &&
      typeof rsPend == "function" &&
      rsPend(o) &&
      o.erro &&
      /sozinho/.test(o.erro)
    ) {
      const s = a.lastIndexOf("</div>");
      s > 0 &&
        (a =
          a.slice(0, s) +
          `<div class="sm" style="margin-top:8px;padding:8px 10px;border-radius:12px;background:color-mix(in srgb,var(--am) 14%,transparent);color:var(--tx)">⏳ ${esc(o.erro)}</div>` +
          a.slice(s));
    }
    return a;
  };
}
if (
  ((function () {
    const e =
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";
    let t = document.querySelector('meta[name="viewport"]');
    (t ||
      ((t = document.createElement("meta")),
      (t.name = "viewport"),
      document.head.appendChild(t)),
      t.setAttribute("content", e));
    const a = TraderStyles.slot("legacy-014");
    ((a.textContent = TraderStyles.css("legacy-014")), TraderStyles.mount(a));
    const o = (s) => {
      s.preventDefault();
    };
    (["gesturestart", "gesturechange", "gestureend"].forEach((s) =>
      document.addEventListener(s, o, { passive: !1 }),
    ),
      document.addEventListener(
        "touchmove",
        (s) => {
          s.touches && s.touches.length > 1 && s.preventDefault();
        },
        { passive: !1 },
      ));
  })(),
  (window.tapeVivo = (e) => {
    if (!/^[A-Z]{4}\d{1,2}$/.test(e) || typeof LV > "u") return null;
    const t = (LV.all || []).find((o) => String(o.ticker).toUpperCase() === e);
    if (
      !t ||
      !(+t.ult > 0) ||
      Date.now() - (Date.parse(t.updated_at) || 0) > 12e4
    )
      return null;
    const a =
      t.var != null && t.var !== "" && isFinite(+t.var) && Math.abs(+t.var) < 90
        ? +t.var
        : +t.fec > 0 && +t.ult / +t.fec > 0.3 && +t.ult / +t.fec < 3
          ? (+t.ult / +t.fec - 1) * 100
          : null;
    return a == null ? null : { px: +t.ult, chg: a };
  }),
  typeof lvcPaint == "function")
) {
  const e = lvcPaint;
  lvcPaint = function () {
    e.apply(this, arguments);
    try {
      window.tapeRedraw && window.tapeRedraw();
    } catch {}
  };
}
function fxComoTrade(e) {
  const t = +e.res,
    a = +e.rk > 0 ? +e.rk : null,
    o = e.dt || e.dtx || "",
    s = e.dtx || e.dt || "";
  return {
    id: "fx:" + e.id,
    tipo: "F",
    ativo: e.s,
    side: e.side,
    entry: e.entry,
    stop: e.stop,
    target: e.target,
    dt: o,
    dtx: s,
    moeda: "USD",
    setup: e.setup || "",
    nota: e.nota || "",
    rules: e.rules || "",
    err: e.err || "",
    tags: e.tags || [],
    forex: 1,
    c: { pl: t, risk: a, r: a ? t / a : null, rr: null },
  };
}
(function () {
  const e = stRows;
  stRows = function () {
    const a = TIPO === "F" ? [] : e();
    if (TIPO !== "all" && TIPO !== "F") return a;
    const o = loc().slice(0, 10),
      s = fxPer("0000-00-00", "9999-12-31").filter((n) =>
        noPeriodo((n.dtx || n.dt || "").slice(0, 10), PER, o),
      );
    return a.concat(s);
  };
  const t = vStats;
  vStats = function () {
    let a = t();
    const o = (S.ops || []).filter((n) => n.st === "closed").length,
      s = (S.lanc || []).length;
    return (
      (TIPO === "all" || TIPO === "F") &&
        (o || s) &&
        (a = a.replace(
          '<div class="sm mut" style="margin:-2px 0 8px">O período vale pela data de saída de cada trade.</div>',
          `<div class="sm mut" style="margin:-2px 0 8px">O período vale pela data de saída de cada trade. Forex incluído: ${o} operação(ões) encerrada(s)${s ? ` e ${s} lucro(s) lançado(s)` : ""}, em US$ (convertido para R$ nos totais).</div>`,
        )),
      a
    );
  };
})();
function fxLanc(e) {
  return {
    id: "fxl:" + e.id,
    tipo: "F",
    ativo: e.s || "Forex",
    side: "",
    dt: e.d + "T00:00",
    dtx: e.d + "T00:00",
    moeda: "USD",
    err: "",
    rules: "",
    tags: [],
    forex: 1,
    lanc: 1,
    c: { pl: +e.v, risk: null, r: null, rr: null },
  };
}
function fxPer(e, t) {
  const a = (r) => r !== "" && r != null && isFinite(+r),
    o = (r) => r && r >= e && r <= t,
    s = (S.ops || [])
      .filter(
        (r) =>
          r.st === "closed" &&
          a(r.res) &&
          o(String(r.dtx || r.dt || "").slice(0, 10)),
      )
      .map((r) => {
        const i = fxComoTrade(r);
        return ((i.dtx = String(r.dtx || r.dt).slice(0, 16)), i);
      }),
    n = (S.lanc || []).filter((r) => a(r.v) && o(r.d)).map(fxLanc);
  return s.concat(n);
}
const fxDia = (e) => fxPer(e, e);
(function () {
  const e = capRef;
  capRef = function (t) {
    if (t === "F") {
      const a = +gv("cap", "F_ini", "") || 0;
      return a > 0 ? emBRL(a, "USD") : e();
    }
    return e(t);
  };
})();
function fxCapCalc() {
  const e = (l) => gv("cap", "F_" + l, ""),
    t = e("ini");
  if (t === "" || !isFinite(+t)) return null;
  const a = e("desde"),
    o = +e("ap") || 0,
    s = lcItems()
      .filter((l) => !a || l.d >= a)
      .sort((l, d) => l.d.localeCompare(d.d)),
    n = sum(s.map((l) => +l.v || 0));
  let r = +t + o;
  const i = [{ v: r, l: "Início" }];
  return (
    s.forEach((l) => {
      ((r += +l.v || 0),
        i.push({ v: r, l: l.d.slice(8, 10) + "/" + l.d.slice(5, 7) }));
    }),
    {
      ini: +t,
      ap: o,
      res: n,
      at: +t + o + n,
      n: s.length,
      pct: +t ? (n / +t) * 100 : null,
      curve: i,
    }
  );
}
function fxCapCard() {
  const e = fxCapCalc(),
    t = (n) => gv("cap", "F_" + n, ""),
    a = (n) => mnyC(n, "USD"),
    o = (n, r, i, l = "number") =>
      `<label>${r}<input type="${l}"${l === "number" ? ' step="any" inputmode="decimal"' : ""} data-ax="cap.F_${n}" value="${esc(t(n))}" placeholder="${i}"></label>`;
  let s = "";
  if (e && e.curve.length > 1) {
    const n = e.curve.map((h) => h.v),
      r = n.length,
      i = Math.min(...n),
      l = Math.max(...n),
      d = (l - i) * 0.1 || Math.abs(l) * 0.05 || 1,
      c = i - d,
      p = l + d,
      u = (h) => ((h / (r - 1)) * 296 + 2).toFixed(1),
      m = (h) => (66 - ((h - c) / (p - c)) * 60).toFixed(1),
      f = n[r - 1] >= n[0],
      x = f ? "var(--g)" : "var(--r)";
    let v = n[0],
      g = 0;
    (n.forEach((h) => {
      ((v = Math.max(v, h)), (g = Math.max(g, v - h)));
    }),
      (s = `<svg viewBox="0 0 300 72" style="width:100%;height:auto;margin-top:8px" role="img" aria-label="Curva de capital do Forex"><line x1="0" x2="300" y1="${m(n[0])}" y2="${m(n[0])}" stroke="var(--bd)" stroke-dasharray="3"/><polyline fill="none" stroke="${x}" stroke-width="2" points="${n.map((h, b) => u(b) + "," + m(h)).join(" ")}"/><circle cx="${u(r - 1)}" cy="${m(n[r - 1])}" r="3.5" fill="${x}"/></svg><div class="top sm mut"><span>Mín. ${a(i)}</span><span>Máx. ${a(l)}</span></div><div class="sm mut">Queda máxima: <b class="${g > 0 ? "r" : ""}">${a(g)}</b> · linha tracejada = capital de partida.</div>`));
  }
  return `<div class="card"><div class="top"><b>💰 Capital · Forex</b>${e ? `<span class="sm ${cls(e.res)}">${e.res >= 0 ? "+" : ""}${a(e.res)}</span>` : ""}</div>
${e ? `<div style="font-size:28px;font-weight:700;margin-top:4px" class="${e.at <= 0 ? "r" : ""}">${a(e.at)}</div><div class="mut sm">Inicial ${a(e.ini)}${e.ap ? " · aportes/saques " + a(e.ap) : ""} · ${e.n} resultado(s)${e.pct != null ? " · " + (e.pct >= 0 ? "+" : "") + f2(e.pct) + "% sobre o inicial" : ""} · ≈ ${money(emBRL(e.at, "USD"))}</div>${s}` : '<div class="mut sm" style="margin-top:6px">Informe o saldo inicial da conta (em US$) para acompanhar a evolução do capital.</div>'}
<details style="margin-top:8px"><summary class="sm">⚙️ Configurar capital${e ? " · inicial " + a(e.ini) : " (toque para preencher)"}</summary><div class="g2" style="margin-top:6px">${o("ini", "Saldo inicial (US$)", "2000")}${o("desde", "Contar a partir de", "", "date")}</div>${o("ap", "Aportes (+) ou saques (−) acumulados (US$)", "0")}</div></details></div>`;
}
(function () {
  const e = vAtivos;
  vAtivos = function () {
    const a = e(),
      o = a.indexOf("</div>", a.indexOf('<div class="seg">'));
    return o < 0 ? a : a.slice(0, o + 6) + fxCapCard() + a.slice(o + 6);
  };
  const t = capTotal;
  capTotal = function () {
    const a = fxCapCalc();
    if (!a) return t();
    const o = ["D", "O", "S"]
        .map((c) => ({ tp: c, c: capCalc(c) }))
        .filter((c) => c.c),
      s = emBRL(a.at, "USD"),
      n = emBRL(a.ini + a.ap, "USD"),
      r = emBRL(a.res, "USD"),
      i = sum(o.map((c) => c.c.at)) + s,
      l = sum(o.map((c) => c.c.ini + c.c.ap)) + n,
      d = sum(o.map((c) => c.c.res)) + r;
    return `<div class="card"><div class="top"><b>💰 Capital total</b><span class="sm ${cls(d)}">${d >= 0 ? "+" : ""}${money(d)}</span></div><div style="font-size:28px;font-weight:700;margin-top:4px" class="${i <= 0 ? "r" : ""}">${money(i)}</div><div class="mut sm">Inicial ${money(l)}${l ? " · " + (d >= 0 ? "+" : "") + f2((d / l) * 100) + "%" : ""} · Forex convertido pelo dólar de hoje</div>${o.map((c) => `<div class="top sm" style="margin-top:6px"><span>${CAPN[c.tp]}</span><b class="${c.c.at <= 0 ? "r" : ""}">${money(c.c.at)}</b></div>`).join("")}<div class="top sm" style="margin-top:6px"><span>Forex</span><b class="${a.at <= 0 ? "r" : ""}">${mnyC(a.at, "USD")} <span class="mut" style="font-weight:400">(${money(s)})</span></b></div></div>`;
  };
})();
const DIA_DUP_ROT = [
    "Defini o risco máximo do dia (R) e o máximo de trades",
    "Fiz o ensaio mental do que pode dar errado",
  ],
  DIA_DUP_REG = [
    "Faço autoavaliação e ensaio mental antes de abrir o mercado",
    "Faço o debriefing no fim do dia",
    "Registro todo trade com resultado e fotos",
  ];
function diaLimpa() {
  if ((S.ax || {})["dia.v2"]) return !1;
  (S.ax ?? (S.ax = {}))["dia.v2"] = 1;
  let e = 0;
  if (S.rot && Array.isArray(S.rot.m)) {
    const t = S.rot.m.length;
    ((S.rot.m = S.rot.m.filter((a) => !DIA_DUP_ROT.includes(a.t))),
      (e += t - S.rot.m.length));
  }
  if (Array.isArray(S.rules)) {
    const t = S.rules.length;
    ((S.rules = S.rules.filter((a) => !DIA_DUP_REG.includes(a.t))),
      (e += t - S.rules.length));
  }
  return (save(), e > 0);
}
let DFASE = null;
const diaFaseAuto = () => {
  if (D !== loc().slice(0, 10)) return D < loc().slice(0, 10) ? "pos" : "pre";
  const e = new Date().getHours();
  return e < 9 ? "pre" : e < 18 ? "dur" : "pos";
};
function diaOrganiza() {
  if (tab !== "dia" || (typeof DV < "u" && DV === "hist")) return;
  const e = document.getElementById("app");
  if (!e || e.querySelector("#dfases")) return;
  if (diaLimpa()) {
    render();
    return;
  }
  const t = [...e.children],
    a = (Xe) => (Xe.textContent || "").trim(),
    o = (Xe) => t.find(Xe),
    s = o((Xe) => Xe.tagName === "H2" && /Antes do mercado/.test(a(Xe))),
    n = o((Xe) => Xe.tagName === "H2" && /Checklist de regras/.test(a(Xe))),
    r = o((Xe) => Xe.tagName === "H2" && /Depois do mercado/.test(a(Xe)));
  if (!s || !n || !r) return;
  const i = (Xe) => t.indexOf(Xe),
    l = (Xe, ot) => t.slice(i(Xe) + 1, i(ot)),
    d = o(
      (Xe) =>
        Xe.classList.contains("card") && /^Resumo autom\xe1tico/.test(a(Xe)),
    ),
    c = o(
      (Xe) =>
        Xe.classList.contains("warn") && /rotina da manh\xe3/i.test(a(Xe)),
    ),
    p = o(
      (Xe) =>
        Xe.classList.contains("card") && !!Xe.querySelector('[data-d="maxP"]'),
    ),
    u = o((Xe) => Xe.tagName === "DETAILS" && /Trades do dia/.test(a(Xe))),
    m = o(
      (Xe) => Xe.classList.contains("card") && /Notas r\xe1pidas/.test(a(Xe)),
    ),
    f = l(s, n),
    x = t[i(n) + 1],
    v = l(x, r),
    g = t.slice(i(r) + 1),
    h = g.find((Xe) => Xe.dataset && Xe.dataset.a === "dsave"),
    b =
      h &&
      h.nextElementSibling &&
      /salvo automaticamente/.test(a(h.nextElementSibling))
        ? h.nextElementSibling
        : null;
  if ((c && c.remove(), d)) {
    const Xe = d.querySelector("b");
    Xe && (Xe.textContent = "Resultado do dia");
  }
  const y = (Xe) => {
      const ot = document.createElement("div");
      return ((ot.className = "dfase"), (ot.dataset.fase = Xe), ot);
    },
    j = y("pre"),
    k = y("dur"),
    A = y("pos"),
    C = (Xe, ot) => {
      const Ke = document.createElement("div");
      return (
        (Ke.innerHTML = `<h2 style="margin-top:14px">${Xe}</h2>${ot ? `<div class="sm mut" style="margin:-4px 0 8px">${ot}</div>` : ""}`),
        Ke
      );
    };
  j.append(
    C(
      "Preparação",
      "Antes de abrir o mercado: rotina, estado, limites e plano.",
    ),
  );
  const I = v.find((Xe) => Xe.id === "rot-n"),
    J = v.find((Xe) => Xe.id === "rtd");
  (f.forEach((Xe) => {
    (j.append(Xe), Xe.id === "rot-m" && p && j.append(p));
  }),
    p && !j.contains(p) && j.append(p),
    I && j.append(I),
    J && j.append(J),
    v.filter((Xe) => Xe !== I && Xe !== J).forEach((Xe) => j.append(Xe)),
    k.append(
      C(
        "Durante o pregão",
        "Anote o que sente e o que vê; seus trades do dia ficam aqui.",
      ),
    ),
    m && k.append(m),
    u && ((u.open = !0), k.append(u)),
    !u &&
      !m &&
      k.insertAdjacentHTML(
        "beforeend",
        '<p class="mut">Nenhum trade hoje.</p>',
      ),
    A.append(
      C(
        "Debriefing",
        "Depois do mercado: avalie o processo, não só o resultado.",
      ),
    ),
    (n.textContent = "Regras que segui hoje "));
  const se = document.createElement("span");
  ((se.className = "mut sm"),
    (se.id = "cnt"),
    n.querySelector("#cnt") || n.append(se),
    A.append(n, x),
    g.filter((Xe) => Xe !== h && Xe !== b).forEach((Xe) => A.append(Xe)));
  const Ie = A.querySelector('input[data-d="nota"]');
  if (Ie) {
    const Xe = Ie.closest("label");
    Xe &&
      Xe.firstChild &&
      Xe.firstChild.nodeType === 3 &&
      (Xe.firstChild.textContent = "Minha nota para o dia (0 a 10): ");
  }
  const Pe = A.querySelector('select[data-d="erros"]'),
    Me = S.days[D] || {},
    ue = ["cond", "prevn"]
      .map((Xe) => {
        const ot = A.querySelector(`textarea[data-d="${Xe}"]`);
        return ot && ot.closest("label");
      })
      .filter(Boolean),
    ve = () => {
      const Xe = Pe ? Pe.value : "";
      ue.forEach((ot) => {
        const Ke = ot.querySelector("textarea");
        ot.style.display = Xe === "s" || (Ke && Ke.value.trim()) ? "" : "none";
      });
    };
  (Pe && (Pe.addEventListener("change", ve), ve()),
    (DFASE = DFASE && DFASE.d === D ? DFASE : { d: D, f: diaFaseAuto() }));
  const he = rotS().m.length,
    we = rotDone(Me, "m"),
    Be = we + (String(Me.plano || "").trim() ? 1 : 0),
    Ge = he + 1,
    Ce = chkN(Me.chk),
    Qe =
      ["resumo", "erros", "bem", "aprend"].filter((Xe) =>
        String(Me[Xe] || "").trim(),
      ).length + (Me.nota !== void 0 && Me.nota !== "" ? 1 : 0),
    de = dayTr(D).length,
    Se = document.createElement("div");
  ((Se.id = "dfases"),
    (Se.className = "seg"),
    (Se.style.cssText =
      "margin:14px 0 4px;display:grid;grid-template-columns:repeat(3,1fr)"));
  const Ve = (Xe, ot, Ke) =>
    `<button class="${DFASE.f === Xe ? "on" : ""}" data-dfase="${Xe}" style="display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 2px;min-width:0"><span style="font-size:14px;white-space:nowrap">${ot}</span><span class="sm mut" style="font-weight:500;white-space:nowrap">${Ke}</span></button>`;
  Se.innerHTML =
    Ve("pre", "Antes", Be + " de " + Ge) +
    Ve("dur", "Durante", de + " trade" + (de === 1 ? "" : "s")) +
    Ve("pos", "Depois", Qe + (Ce ? 1 : 0) + " de 6");
  const Je = (Xe) => Xe,
    Ye = e.querySelector("#dis") || d || e.querySelector("#svs");
  (Ye ? Ye.after(Se) : e.append(Se),
    Se.after(j, k, A),
    [j, k, A].forEach((Xe) => {
      /* Tela única: só a fase escolhida fica montada; as outras saem do DOM. */
      Xe.dataset.fase === DFASE.f || Xe.remove();
    }),
    s.remove(),
    r.remove(),
    h && (A.append(h), b && A.append(b)));
  try {
    cnt();
  } catch {}
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-dfase]");
  if (!t) return;
  ((DFASE = { d: D, f: t.dataset.dfase }), render());
  const a = document.getElementById("dfases");
  a &&
    a.getBoundingClientRect().top < 0 &&
    a.scrollIntoView({ block: "start" });
}),
  (function () {
    const e = render0;
    render0 = function () {
      e.apply(this, arguments);
      try {
        diaOrganiza();
      } catch (t) {
        console.error(t);
      }
    };
  })());
const opQuando = (e) =>
    String(e.st === "closed" ? e.dtx || e.dt || "" : e.dt || ""),
  opDataTxt = (e) => {
    const t = opQuando(e);
    if (t.length < 10) return "";
    const a = t.length >= 16 ? " às " + t.slice(11, 16) : "";
    return (
      (e.st === "closed" ? " em " : " desde ") +
      t.slice(8, 10) +
      "/" +
      t.slice(5, 7) +
      "/" +
      t.slice(2, 4) +
      a
    );
  };
function opDiaRot(e) {
  const t = loc().slice(0, 10);
  return e === t
    ? "Hoje"
    : e === diasMais(t, -1)
      ? "Ontem"
      : dsem(e) +
        " " +
        e.slice(8, 10) +
        "/" +
        e.slice(5, 7) +
        "/" +
        e.slice(0, 4);
}
function opLista(e) {
  const t = new Map();
  return (
    e.forEach((a) => {
      const o = opQuando(a).slice(0, 10) || "sem data";
      (t.get(o) || t.set(o, []).get(o)).push(a);
    }),
    [...t.entries()]
      .map(([a, o]) => {
        const s = o.filter((r) => r.st === "closed" && isFinite(+r.res)),
          n = sum(s.map((r) => +r.res));
        return (
          `<div class="top" style="margin:14px 2px 4px"><b class="sm" style="text-transform:uppercase;letter-spacing:.04em;color:var(--mut)">${a === "sem data" ? a : opDiaRot(a)}</b>${s.length ? `<span class="sm ${cls(n)}"><b>${n >= 0 ? "+" : ""}${mnyC(n, "USD")}</b> · ${s.length} op.</span>` : ""}</div>` +
          o.map(opCard).join("")
        );
      })
      .join("")
  );
}
function opFormDatas() {
  const e = !!(OD.dtx || OD.x || OD.res),
    t = (a, o) =>
      `<label>${o}<input type="number" step="any" inputmode="decimal" data-od="${a}" value="${esc(OD[a] || "")}"></label>`;
  return `<label>Abertura (data e hora) <span class="mut" style="font-weight:400">· em branco = agora</span><input type="datetime-local" data-od="dt" value="${esc(OD.dt || "")}"></label>
<details${e ? " open" : ""} style="margin-top:8px"><summary class="sm">📅 Registrar trade antigo já encerrado</summary><label>Encerramento (data e hora)<input type="datetime-local" data-od="dtx" value="${esc(OD.dtx || "")}"></label><div class="g3">${t("x", "Saída (preço)")}${t("res", "Resultado US$")}${t("cost", "Custos US$")}</div><div class="sm mut" style="margin-top:4px">Com o encerramento e a saída (ou o resultado), a operação já entra como encerrada, com as datas certas.</div></details>`;
}
const opAviso = (e) => {
  const t = document.getElementById("opv");
  (t && (t.innerHTML = `<span class="r">${esc(e)}</span>`),
    window.toast && toast(e, 3500));
};
function opNova(e) {
  const t = String(OD.dt || loc().slice(0, 16)).slice(0, 16),
    a = { id: uid(), dt: t, st: "plan", ...e };
  if (!OD.dtx) return a;
  const o = (r) => r != null && r !== "" && isFinite(+r),
    s = String(OD.dtx).slice(0, 16);
  if (!o(OD.x) && !o(OD.res))
    return (
      opAviso(
        "Para registrar como encerrada, informe a saída ou o resultado em US$.",
      ),
      null
    );
  if (s < t)
    return (opAviso("O encerramento não pode ser antes da abertura."), null);
  const n = o(OD.res) ? +OD.res : opRes(a, OD.x, OD.cost);
  return Object.assign(a, {
    st: "closed",
    x: o(OD.x) ? OD.x : "",
    cost: +OD.cost || 0,
    res: +(+n).toFixed(2),
    dtx: s,
  });
}
const RD = {
    l: [],
    cfg: null,
    ts: 0,
    err: "",
    lado: "C",
    ab: null,
    busy: 0,
    run: 0,
    msg: "",
  },
  rdHoje = () => {
    const e = new Date();
    return (
      e.getFullYear() +
      "-" +
      String(e.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(e.getDate()).padStart(2, "0")
    );
  },
  rdN = (e) =>
    e == null || e === "" || !isFinite(+e)
      ? "—"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
async function rdLoad(e) {
  if (
    !(RD.busy || !SESS || !window.CLOUD_OK) &&
    !(!e && Date.now() - RD.ts < 6e4)
  ) {
    RD.busy = 1;
    try {
      const [t, a] = await Promise.all([
        rq(
          "/rest/v1/radar_sinais?select=*&user_id=eq." +
            SESS.uid +
            "&dia=eq." +
            rdHoje() +
            "&order=score.desc",
        ).then((o) => o.json()),
        rq("/rest/v1/radar_cfg?select=*&user_id=eq." + SESS.uid).then((o) =>
          o.json(),
        ),
      ]);
      ((RD.l = Array.isArray(t) ? t : []),
        (RD.cfg = (a && a[0]) || null),
        (RD.err = ""));
    } catch (t) {
      RD.err =
        t.status === 404 || /radar_|schema cache/.test(String(t.message))
          ? "tabela"
          : String(t.message || t);
    }
    ((RD.ts = Date.now()), (RD.busy = 0), rdPaint());
  }
}
const RD_FR = [0.618, 1, 1.618],
  rdPct = (e) =>
    (e * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%",
  RD_TFN = { D: "diário", W: "semanal", M: "mensal" },
  rdTf = () => (S.ax || {})["rd.tf"] || "D",
  rdMeu = (e) => {
    const t = ((S.ax || {}).rdfib || {})[e.ticker + e.lado];
    return t && t.dia === rdHoje() ? t : null;
  },
  rdData = (e, t) => {
    if (!e) return "";
    const [a, o, s] = e.split("-");
    return t === "M"
      ? [
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
        ][+o - 1] +
          "/" +
          a.slice(2)
      : t === "W"
        ? "sem. " + s + "/" + o + "/" + a.slice(2)
        : s + "/" + o + "/" + a.slice(2);
  };
function rdFibTf(e) {
  const t = e.fib || null,
    a = t && t.tempos,
    o = rdTf();
  return a && a[o]
    ? { f: a[o], tf: o, falta: null }
    : a
      ? { f: a[t.tf] || t, tf: t.tf || "D", falta: o in a ? o : null }
      : { f: t, tf: "D", falta: null };
}
function rdPlano(e) {
  const t = rdMeu(e),
    a = rdFibTf(e),
    o = t || a.f,
    s = +e.entrada;
  if (
    !o ||
    ![o.modo === "2p" ? o.b : o.a, o.b, o.c].every(
      (l) => isFinite(+l) && +l > 0,
    )
  )
    return {
      meu: !1,
      tf: a.tf,
      stop: +e.stop,
      alvos: [e.alvo1, e.alvo2]
        .filter((l) => l != null)
        .map((l, d) => ({
          r: RD_FR[d],
          v: +l,
          rr: Math.abs(l - s) / Math.abs(s - e.stop),
        })),
    };
  const n = e.lado === "C" ? 1 : -1,
    r = (s - +o.c) * n,
    i = o.modo === "2p";
  return {
    meu: !!t,
    dois: i,
    tf: a.tf,
    falta: a.falta,
    f: a.f,
    a: +o.a,
    b: +o.b,
    c: +o.c,
    stop: +o.c,
    alvos: RD_FR.map((l) => {
      const d = i ? +o.b + (+o.b - +o.c) * l : +o.c + (+o.b - +o.a) * l;
      return { r: l, v: d, rr: r > 0 ? ((d - s) * n) / r : null };
    }),
  };
}
function rdSvg(e, t) {
  const a = t.f,
    o = (a && a.cs) || [];
  if (o.length < 3) return "";
  const s = 360,
    n = 230,
    r = 4,
    i = 70,
    l = 14,
    d = 20,
    c = o.length,
    p = (s - r - i) / c,
    u = e.lado === "C",
    m = [t.stop, ...t.alvos.map((se) => se.v), +e.entrada].filter((se) =>
      isFinite(se),
    );
  let f = Math.min(...o.map((se) => se[3]), ...m),
    x = Math.max(...o.map((se) => se[2]), ...m);
  const v = (x - f) * 0.05 || 1;
  ((f -= v), (x += v));
  const g = (se) => l + ((x - se) / (x - f)) * (n - l - d),
    h = (se) => r + (se + 0.5) * p,
    b = (se) => rdN(se);
  let y = "";
  o.forEach((se, Ie) => {
    const Pe = se[4] >= se[1],
      Me = Pe ? "var(--g,#3aad74)" : "var(--r,#e7614c)",
      ue = g(Math.max(se[1], se[4])),
      ve = g(Math.min(se[1], se[4]));
    y += `<line x1="${h(Ie)}" x2="${h(Ie)}" y1="${g(se[2])}" y2="${g(se[3])}" stroke="${Me}" stroke-width="1" opacity=".85"/><rect x="${h(Ie) - Math.max(0.5, p * 0.32)}" y="${ue}" width="${Math.max(1, p * 0.64)}" height="${Math.max(0.8, ve - ue)}" fill="${Me}" opacity=".85"/>`;
  });
  const j = (se) => o.findIndex((Ie) => Ie[0] === se),
    k = j(a.da),
    A = j(a.db),
    C = j(a.dc),
    I = C >= 0 && !t.meu ? h(C) : r,
    J = (se, Ie, Pe, Me) =>
      se < f || se > x
        ? ""
        : `<line x1="${I}" x2="${s - i}" y1="${g(se)}" y2="${g(se)}" stroke="${Ie}" stroke-width="${Me ? 1.4 : 1}" stroke-dasharray="${Me ? "" : "5 3"}"/><rect x="${s - i + 1}" y="${g(se) - 7}" width="${i - 2}" height="14" rx="3" fill="${Ie}"/><text x="${s - i + 4}" y="${g(se) + 3.5}" font-size="9" fill="#ffffff" font-weight="700">${Pe}</text>`;
  if (
    (t.alvos.forEach((se) => {
      y += J(se.v, "#2e8b5d", rdPct(se.r) + " " + b(se.v));
    }),
    (y += J(t.stop, "#dc3e26", "Stop " + b(t.stop), 1)),
    (y += `<line x1="${r}" x2="${s - i}" y1="${g(+e.entrada)}" y2="${g(+e.entrada)}" stroke="#709bc2" stroke-width=".8" stroke-dasharray="2 3"/><circle cx="${h(c - 1)}" cy="${g(+e.entrada)}" r="3.5" fill="#709bc2" stroke="#ffffff" stroke-width="1.2"/>`),
    t.dois && (y += J(+a.b, "#52565e", "0% " + b(a.b))),
    !t.meu && (t.dois || k >= 0) && A >= 0 && C >= 0)
  ) {
    const se = t.dois
      ? [
          [A, a.b, "B", u ? 0 : 1],
          [C, a.c, "C", u ? 1 : 0],
        ]
      : [
          [k, a.a, "A", u ? 1 : 0],
          [A, a.b, "B", u ? 0 : 1],
          [C, a.c, "C", u ? 1 : 0],
        ];
    ((y += `<polyline points="${se.map((Ie) => h(Ie[0]) + "," + g(Ie[1])).join(" ")}" fill="none" stroke="#c2943e" stroke-width="1.6" stroke-dasharray="4 2"/>`),
      se.forEach(([Ie, Pe, Me, ue]) => {
        const ve = g(Pe),
          he = ue ? ve + 15 : ve - 8,
          we = he > 9 && he < n - d - 1;
        y += `<circle cx="${h(Ie)}" cy="${ve}" r="4" fill="#c2943e" stroke="#ffffff" stroke-width="1.2"/><text x="${we ? h(Ie) : h(Ie) - 8}" y="${we ? he : ve + 4}" text-anchor="${we ? "middle" : "end"}" font-size="11" font-weight="800" fill="#c2943e">${Me}</text>`;
      }));
  }
  return (
    [0, Math.floor(c / 2), c - 1].forEach((se, Ie) => {
      y += `<text x="${Ie === 0 ? r : Ie === 2 ? s - i : h(se)}" y="${n - 5}" font-size="9" fill="var(--mut,#9ca0a9)" text-anchor="${Ie === 0 ? "start" : Ie === 2 ? "end" : "middle"}">${rdData(o[se][0], t.tf)}</text>`;
    }),
    `<svg class="rd-svg" viewBox="0 0 ${s} ${n}" role="img" aria-label="Gráfico ${RD_TFN[t.tf]} com os pivôs e a projeção de Fibonacci">${y}</svg>`
  );
}
function rdVivoTxt(e) {
  const t =
    typeof LV < "u" && LV.px && LV.px[e.ticker] ? +LV.px[e.ticker].ult : 0;
  if (!(t > 0) || !(+e.entrada > 0)) return "";
  const a = e.lado === "C",
    o = rdPlano(e),
    s = (t / e.entrada - 1) * 100 * (a ? 1 : -1),
    n = a ? t <= o.stop : t >= o.stop,
    r = o.alvos.filter((i) => (a ? t >= i.v : t <= i.v));
  return `Agora <b>${rdN(t)}</b> · <span class="${s >= 0 ? "g" : "r"}">${s >= 0 ? "+" : ""}${rdN(s)}% ${s >= 0 ? "a favor" : "contra"}</span>${n ? ' · <b class="r">bateu o stop</b>' : r.length ? ` · <b class="g">atingiu ${rdPct(r[r.length - 1].r)}</b>` : ""}`;
}
function rdItem(e) {
  const t = Array.isArray(e.setups) ? e.setups : [],
    a = e.score >= 75 ? "g" : e.score >= 60 ? "y" : "m",
    o = e.ticker + e.lado,
    s = RD.ab === o,
    n = Array.isArray(e.contra) ? e.contra : [],
    r = rdPlano(e),
    i = e.lado === "C",
    l = typeof LV < "u" && LV.px && LV.px[e.ticker] ? +LV.px[e.ticker].ult : 0,
    d = (e.fib && e.fib.tempos) || null,
    c = r.alvos
      .map(
        (x) =>
          `<div class="rd-fa${l > 0 && (i ? l >= x.v : l <= x.v) ? " ok" : ""}"><small>${rdPct(x.r)}</small><b>${rdN(x.v)}</b><small>${x.rr != null && isFinite(x.rr) ? rdN(x.rr) + ":1" : ""}</small></div>`,
      )
      .join(""),
    p = r.f || {},
    u = rdMeu(e) || r.f || e.fib || {},
    m = i ? ["fundo", "topo", "fundo"] : ["topo", "fundo", "topo"],
    f =
      (!r.meu && r.dois && p.db
        ? `<div class="rd-piv"><div><b class="rd-p">B</b> ${m[1] === "topo" ? "topo" : "fundo"} <b>${rdN(p.b)}</b> em ${rdData(p.db, r.tf)} <span class="mut">· pivô: o rompimento dele é a <b>entrada</b> (0%)</span></div><div><b class="rd-p">C</b> ${m[2]} <b>${rdN(p.c)}</b> em ${rdData(p.dc, r.tf)} <span class="mut">· fim da correção = <b class="r">stop</b></span></div><div class="mut">Expansão de Fibonacci (2 pontos): alvos = B ${i ? "+" : "−"} (${i ? "B − C" : "C − B"}) × proporção: ${r.alvos.map((x) => `${rdN(p.b)} ${i ? "+" : "−"} ${rdN(Math.abs(p.b - p.c))} × ${String(x.r).replace(".", ",")} = <b>${rdN(x.v)}</b>`).join(" · ")}</div></div>`
        : "") ||
      (!r.meu && p.da
        ? `<div class="rd-piv"><div><b class="rd-p">A</b> ${m[0]} <b>${rdN(p.a)}</b> em ${rdData(p.da, r.tf)} <span class="mut">· origem do impulso</span></div><div><b class="rd-p">B</b> ${m[1]} <b>${rdN(p.b)}</b> em ${rdData(p.db, r.tf)} <span class="mut">· fim do impulso</span></div><div><b class="rd-p">C</b> ${m[2]} <b>${rdN(p.c)}</b> em ${rdData(p.dc, r.tf)} <span class="mut">· fim da correção = <b class="r">stop</b></span></div><div class="mut">Alvos = C ${i ? "+" : "−"} (${i ? "B − A" : "A − B"}) × proporção: ${r.alvos.map((x) => `${rdN(p.c)} ${i ? "+" : "−"} ${rdN(Math.abs(p.b - p.a))} × ${String(x.r).replace(".", ",")} = <b>${rdN(x.v)}</b>`).join(" · ")}</div></div>`
        : "");
  return `<div class="rd-it${e.ativo ? "" : " off"}" data-rdab="${esc(o)}">
  <div class="rd-l1"><b>${esc(e.ticker)}</b><span class="rd-sc ${a}" title="Pontuação do setup (0 a 100)">${e.score}</span><span class="rd-st">${esc(t.map((x) => x.nome).join(" + "))}</span></div>
  <div class="rd-fib"><div class="rd-fh sm">${r.meu ? "📐 Alvos do <b>seu</b> Fibonacci" : `Alvos · Fibonacci no <b>${RD_TFN[r.tf]}</b>`}</div><div class="rd-fg">${c}</div></div>
  <div class="rd-l2"><span>Entrada <b>${rdN(e.entrada)}</b></span><span>Stop no ${i ? "fundo" : "topo"} do pivô <b class="r">${rdN(r.stop)}</b></span></div>
  <div class="rd-l3 sm" data-rdv="${esc(o)}">${rdVivoTxt(e)}</div>
  ${e.comentario && !r.meu && (!e.fib || !e.fib.tf || r.tf === e.fib.tf) ? `<div class="rd-ia">✨ ${esc(e.comentario)}</div>` : ""}
  ${n.length ? `<div class="rd-ct">⚠️ ${esc(n.join(" · "))}</div>` : ""}
  ${
    s
      ? `<div class="rd-det">
    ${d ? `<div class="seg rd-tf">${["D", "W", "M"].map((x) => `<button class="${r.tf === x && !r.meu ? "on" : ""}${d[x] ? "" : " sem"}" data-rdtf="${x}">${RD_TFN[x][0].toUpperCase() + RD_TFN[x].slice(1)}${d[x] ? "" : " ·  —"}</button>`).join("")}</div>` : ""}
    ${r.falta ? `<div class="sm am">Sem pivô válido no ${RD_TFN[r.falta]} (o preço já perdeu o último ${i ? "fundo" : "topo"} ou a correção passou da origem). Mostrando o ${RD_TFN[r.tf]}.</div>` : ""}
    <button class="btn rd-mt" data-rdmt="${esc(o)}">➕ Montar trade com este plano</button>
    ${r.meu ? "" : rdSvg(e, r)}${f}
    ${t.map((x) => `<div>• ${esc(x.detalhe)}</div>`).join("")}
    <div class="mut">RSI ${rdN(e.rsi)} · tendência diária ${esc(e.tendencia || "—")}${e.vol_rel != null ? ` · volume projetado ${rdN(e.vol_rel)}× a média` : ""} · no radar desde ${hm(Date.parse(e.primeiro))}</div>
    <div class="rd-meu"><div class="sm"><b>📐 Traçar meu Fibonacci</b> <span class="mut">(expansão de 2 pontos: ${i ? "B = topo que vai romper (entrada) · C = fundo da correção (stop)" : "B = fundo que vai perder (entrada) · C = topo da correção (stop)"})</span></div>
      <div class="rd-mg">${["b", "c"].map((x) => `<label>${x === "b" ? (i ? "B · topo" : "B · fundo") : i ? "C · fundo" : "C · topo"}<input inputmode="decimal" data-rdf="${x}" value="${u[x] != null ? String(+(+u[x]).toFixed(2)).replace(".", ",") : ""}"></label>`).join("")}</div>
      <div class="rd-bt"><button class="btn s" data-rdfok="${esc(o)}">Calcular alvos</button>${r.meu ? `<button class="btn s" data-rdfauto="${esc(o)}">Voltar ao automático</button>` : ""}<button class="btn s" data-rdtv="${esc(e.ticker)}">📈 Ver no TradingView</button></div>
      <div class="sm r" data-rdferr></div></div>
  </div>`
      : '<div class="rd-mais sm mut">Toque para ver o gráfico com os pivôs, escolher diário/semanal/mensal ou traçar seu Fibonacci</div>'
  }
  </div>`;
}
function rdFibSalva(e, t) {
  const a = RD.l.find((u) => u.ticker + u.lado === e);
  if (!a) return;
  S.ax ?? (S.ax = {});
  const o = { ...(S.ax.rdfib || {}) };
  for (const u of Object.keys(o)) o[u].dia !== rdHoje() && delete o[u];
  if (t) {
    (delete o[e], (S.ax.rdfib = o), save(), rdPaint());
    return;
  }
  const s = document.querySelector(`[data-rdab="${e}"]`),
    n = (u) => {
      const m = String((s.querySelector(`[data-rdf="${u}"]`) || {}).value || "")
        .trim()
        .replace(/\./g, "")
        .replace(",", ".");
      return m === "" ? NaN : +m;
    },
    r = n("b"),
    i = n("c"),
    l = i,
    d = s.querySelector("[data-rdferr]"),
    c = a.lado === "C",
    p = [r, i].every((u) => isFinite(u) && u > 0)
      ? c && !(r > i)
        ? "Na compra: o topo (B) tem que ser maior que o fundo (C)."
        : !c && !(r < i)
          ? "Na venda: o fundo (B) tem que ser menor que o topo (C)."
          : ""
      : "Preencha o topo e o fundo com preços.";
  if (p) {
    d && (d.textContent = p);
    return;
  }
  ((o[e] = { a: l, b: r, c: i, modo: "2p", dia: rdHoje() }),
    (S.ax.rdfib = o),
    save(),
    (RD.ab = e),
    rdPaint());
}
function rdPaint() {
  const e = document.getElementById("rdbox");
  if (!e) return;
  if (!SESS || !window.CLOUD_OK) {
    e.innerHTML =
      '<div class="mut sm">Entre na sua conta (aba Conta) para ver o radar.</div>';
    return;
  }
  if (RD.err === "tabela") {
    e.innerHTML =
      '<div class="mut sm">Radar ainda não instalado: rode o <b>radar.sql</b> no Supabase e publique a função <b>radar</b>.</div>';
    return;
  }
  if (!RD.ts) {
    e.innerHTML = '<div class="mut sm">Carregando…</div>';
    return;
  }
  const t = RD.l.filter((c) => c.ativo),
    a = t.filter((c) => c.lado === "C"),
    o = t.filter((c) => c.lado === "V"),
    s = RD.lado === "C" ? a : o,
    n = RD.l.filter((c) => !c.ativo && c.lado === RD.lado),
    r = RD.cfg || {},
    i = r.ultima ? Date.parse(r.ultima) : 0,
    l = i && new Date(i).toDateString() === new Date().toDateString(),
    d = +(r.score_min || 75);
  e.innerHTML = `<div class="rd-hd sm">${l ? `<span class="rd-dot"></span>Monitorando ${r.analisados || 0} ativos${r.cripto !== !1 ? " (ações e cripto)" : ""} · última varredura ${hm(i)}${r.pendentes ? ` · ${r.pendentes} ainda carregando o histórico` : ""}` : '<span class="mut">Sem varredura hoje. O radar roda de 15 em 15 min, das 10h às 17h45, com a ponte do Profit ligada.</span>'}</div>
  <div class="seg rd-seg"><button class="${RD.lado === "C" ? "on" : ""}" data-rdlado="C">🟢 Compra (${a.length})</button><button class="${RD.lado === "V" ? "on" : ""}" data-rdlado="V">🔴 Venda (${o.length})</button><button class="${RD.lado === "P" ? "on" : ""}" data-rdlado="P">📊 Placar</button></div>
  ${RD.lado === "P" ? rdPlacarHtml() : s.length ? s.map(rdItem).join("") : `<div class="mut sm" style="padding:10px 2px">Nenhum setup de ${RD.lado === "C" ? "compra" : "venda"} agora. O radar só mostra quando há gatilho e espaço até o próximo nível (risco/retorno de pelo menos 1,2:1).</div>`}
  ${n.length && RD.lado !== "P" ? `<details class="rd-sai"><summary class="sm mut">Saíram do radar hoje (${n.length})</summary>${n.map(rdItem).join("")}</details>` : ""}
  <div class="rd-ft"><button class="btn s" data-rdnow="1"${RD.run ? " disabled" : ""}>${RD.run ? "Varrendo…" : "🔄 Varrer agora"}</button>
  <label class="sm rd-pu"><input type="checkbox" data-rdpush${r.push !== !1 ? " checked" : ""}> Notificar score ≥ <select data-rdmin>${[60, 65, 70, 75, 80, 85, 90].map((c) => `<option value="${c}"${d === c ? " selected" : ""}>${c}</option>`).join("")}</select></label><label class="sm rd-pu"><input type="checkbox" data-rdcr${r.cripto !== !1 ? " checked" : ""}> ₿ Incluir cripto (24h)</label></div>
  ${RD.msg ? `<div class="sm r" style="margin-top:6px">${esc(RD.msg)}</div>` : ""}`;
}
function rdVivo() {
  document.querySelectorAll("[data-rdv]").forEach((e) => {
    const t = RD.l.find((a) => a.ticker + a.lado === e.dataset.rdv);
    t && (e.innerHTML = rdVivoTxt(t));
  });
}
async function rdAgora() {
  const e = cfg();
  if (!e || !SESS) {
    ((RD.msg = "Entre na sua conta."), rdPaint());
    return;
  }
  ((RD.run = 1), (RD.msg = ""), rdPaint());
  try {
    await tok();
    const t = await fetch(e.url + "/functions/v1/radar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: e.key,
        Authorization: "Bearer " + SESS.at,
      },
      body: JSON.stringify({ acao: "agora" }),
    });
    let a = {};
    try {
      a = await t.json();
    } catch {}
    if (!t.ok)
      throw new Error(
        t.status === 404
          ? 'Função "radar" não encontrada: publique-a no Supabase.'
          : a.error || "Erro " + t.status,
      );
    !a.ativos_ponte && !a.cripto
      ? (RD.msg =
          "Nenhuma ação da ponte com cotação de hoje. Deixe a ponte do Profit ligada (ou ligue a cripto no radar).")
      : window.toast &&
        toast(`Radar: ${a.sinais} sinais em ${a.analisados} ações`, 3e3);
  } catch (t) {
    RD.msg = String(t.message || t);
  }
  ((RD.run = 0), await rdLoad(!0), rdPaint());
}
async function rdCfgSalva() {
  const e = document.querySelector("[data-rdpush]"),
    t = document.querySelector("[data-rdmin]"),
    a = document.querySelector("[data-rdcr]");
  if (!e || !t || !SESS) return;
  const o = {
    user_id: SESS.uid,
    push: e.checked,
    score_min: +t.value,
    ...(a ? { cripto: a.checked } : {}),
  };
  RD.cfg = Object.assign(RD.cfg || {}, o);
  try {
    (await rq("/rest/v1/radar_cfg?on_conflict=user_id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(o),
    }),
      window.toast &&
        toast(
          o.push
            ? `Vai avisar sinais com score ≥ ${o.score_min}`
            : "Avisos do radar desligados",
          2500,
        ));
  } catch (s) {
    ((RD.msg = /cripto/i.test(s.message || "")
      ? "Para ligar a cripto no radar, rode o radar-cripto.sql no Supabase."
      : "Não salvei a preferência: " + (s.message || s)),
      rdPaint());
  }
}
if (typeof vLive == "function") {
  const e = vLive;
  vLive = function () {
    return (
      setTimeout(() => {
        (rdPaint(), rdLoad());
      }, 0),
      e
        .apply(this, arguments)
        .replace(
          "<h1>Cotações ao vivo</h1>",
          '<h1>Cotações ao vivo</h1><div class="card rd"><div class="rd-tt"><b>🎯 Radar de oportunidades</b><span class="sm mut">IA de olho no pregão</span></div><div id="rdbox"><div class="mut sm">Carregando…</div></div><div class="mut sm rd-av">Setups calculados por regras (rompimento de 20 dias, pullback na média de 20, RSI e cruzamento de médias) com o preço do Profit; stop e alvos pelos níveis e pelo ATR. A IA comenta só os melhores. Não é recomendação: confirme no gráfico e respeite seu risco.</div></div>',
        )
    );
  };
}
if (typeof lvcPaint == "function") {
  const e = lvcPaint;
  lvcPaint = function () {
    (e.apply(this, arguments), tab === "live" && (rdVivo(), rdLoad()));
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target;
  let a;
  if ((a = t.closest("[data-rdlado]"))) {
    ((RD.lado = a.dataset.rdlado),
      (RD.ab = null),
      rdPaint(),
      RD.lado === "P" && rdPlacarLoad());
    return;
  }
  if ((a = t.closest("[data-rdmt]"))) {
    rdMontar(a.dataset.rdmt);
    return;
  }
  if ((a = t.closest("[data-rdtv]"))) {
    typeof tvAbre == "function" && tvAbre(a.dataset.rdtv, "BR");
    return;
  }
  if (t.closest("[data-rdnow]")) {
    RD.run || rdAgora();
    return;
  }
  if ((a = t.closest("[data-rdtf]"))) {
    (((S.ax ?? (S.ax = {}))["rd.tf"] = a.dataset.rdtf), save(), rdPaint());
    return;
  }
  if ((a = t.closest("[data-rdfok]"))) {
    rdFibSalva(a.dataset.rdfok);
    return;
  }
  if ((a = t.closest("[data-rdfauto]"))) {
    rdFibSalva(a.dataset.rdfauto, !0);
    return;
  }
  t.closest(".rd-meu") ||
    t.closest(".rd-ft,select,input,details>summary") ||
    ((a = t.closest("[data-rdab]")) &&
      ((RD.ab = RD.ab === a.dataset.rdab ? null : a.dataset.rdab), rdPaint()));
}),
  document.addEventListener("change", (e) => {
    e.target.closest &&
      e.target.closest("[data-rdpush],[data-rdmin],[data-rdcr]") &&
      rdCfgSalva();
  }),
  (function () {
    const e = TraderStyles.slot("legacy-015");
    ((e.textContent = TraderStyles.css("legacy-015")), TraderStyles.mount(e));
  })());
const RDP = { l: null, ts: 0, err: "" };
async function rdPlacarLoad(e) {
  if (!SESS || (!e && RDP.l && Date.now() - RDP.ts < 5 * 6e4)) return;
  const t = diasMais(rdHoje(), -30);
  try {
    ((RDP.l = await (
      await rq(
        "/rest/v1/radar_sinais?select=dia,ticker,lado,score,setups,entrada,stop,tf:fib->>tf,resultado&user_id=eq." +
          SESS.uid +
          "&dia=gte." +
          t +
          "&order=dia.asc",
      )
    ).json()),
      (RDP.err = ""));
  } catch (a) {
    RDP.err = /resultado/.test(String(a.message))
      ? "coluna"
      : String(a.message || a);
  }
  ((RDP.ts = Date.now()), RD.lado === "P" && rdPaint());
}
function rdPlacarAgg(e) {
  const t = {},
    a = [];
  (e || [])
    .slice()
    .sort((n, r) => n.dia.localeCompare(r.dia))
    .forEach((n) => {
      const r = n.ticker + n.lado;
      (t[r] && diasMais(t[r], 7) > n.dia) || ((t[r] = n.dia), a.push(n));
    });
  const o = {},
    s = (n, r) => {
      o[n] ?? (o[n] = { n: 0, fim: 0, alvo: 0, stop: 0, R: 0, ab: 0 });
      const i = o[n],
        l = r.resultado;
      if ((i.n++, !l || !l.fim)) {
        i.ab++;
        return;
      }
      (i.fim++,
        l.status === "stop"
          ? i.stop++
          : l.nivel && l.nivel !== "stop" && i.alvo++,
        (i.R += +l.r || 0));
    };
  return (
    a.forEach((n) => {
      (s("Todos", n),
        s(n.lado === "C" ? "Compra" : "Venda", n),
        (n.setups || []).forEach((r) => s("Setup: " + r.nome, n)),
        s(
          "Tempo: " +
            ({ D: "diário", W: "semanal", M: "mensal" }[n.tf] || "diário"),
          n,
        ),
        s(
          "Score " +
            (n.score >= 75 ? "75+" : n.score >= 60 ? "60–74" : "abaixo de 60"),
          n,
        ));
    }),
    { G: o, ok: a }
  );
}
function rdPlacarHtml() {
  if (RDP.err === "coluna")
    return '<div class="mut sm" style="padding:8px 2px">Falta a coluna do placar: rode no SQL Editor <code>alter table public.radar_sinais add column if not exists resultado jsonb;</code></div>';
  if (RDP.err) return `<div class="sm r">${esc(RDP.err)}</div>`;
  if (!RDP.l)
    return '<div class="mut sm" style="padding:8px 2px">Carregando o placar…</div>';
  const { G: e, ok: t } = rdPlacarAgg(RDP.l),
    a = (r, i) => (i ? Math.round((r / i) * 100) + "%" : "—");
  if (!t.length)
    return '<div class="mut sm" style="padding:8px 2px">Ainda não há sinais nos últimos 30 dias. O placar se monta sozinho conforme o radar roda.</div>';
  const o = (r) =>
      r === "Todos"
        ? 0
        : r === "Compra"
          ? 1
          : r === "Venda"
            ? 2
            : r.startsWith("Setup")
              ? 3
              : r.startsWith("Tempo")
                ? 4
                : 5,
    s = Object.entries(e)
      .sort((r, i) => o(r[0]) - o(i[0]) || i[1].n - r[1].n)
      .map(
        ([r, i]) =>
          `<tr><td>${esc(r)}</td><td>${i.n}${i.ab ? `<div class="sm mut">${i.ab} em aberto</div>` : ""}</td><td class="g">${a(i.alvo, i.fim)}</td><td class="r">${a(i.stop, i.fim)}</td><td class="${i.R >= 0 ? "g" : "r"}">${i.fim ? rdN(i.R / i.fim) : "—"}</td></tr>`,
      )
      .join(""),
    n = t
      .filter((r) => r.resultado && r.resultado.fim)
      .slice(-8)
      .reverse();
  return `<div class="sm mut" style="margin:2px 0 6px">Últimos 30 dias. Cada sinal é medido a partir do pregão seguinte, com o stop no pivô e os alvos de Fibonacci do sinal; stop e alvo no mesmo dia contam como stop. Termina no stop, no 161,8% ou após 20 pregões.</div>
  <div style="overflow-x:auto"><table class="rd-pt"><tr><th>Grupo</th><th>Sinais</th><th>Alvo ≥61,8%</th><th>Stop</th><th>Média × risco</th></tr>${s}</table></div>
  ${n.length ? `<div class="sm" style="margin-top:8px"><b>Últimos encerrados</b></div>${n.map((r) => `<div class="sm rd-pf"><span>${r.dia.slice(8, 10)}/${r.dia.slice(5, 7)} · <b>${esc(r.ticker)}</b> ${r.lado === "C" ? "compra" : "venda"}</span><span class="${r.resultado.status === "stop" ? "r" : r.resultado.r >= 0 ? "g" : "r"}">${r.resultado.status === "stop" ? "stop" : r.resultado.status === "expirou" ? "expirou" : r.resultado.nivel} · ${rdN(r.resultado.r)}× · ${r.resultado.dias}d</span></div>`).join("")}` : ""}
  <div class="sm mut" style="margin-top:6px">Poucos sinais ainda dizem pouco: espere juntar pelo menos 30 encerrados num grupo antes de confiar no número.</div>`;
}
function rdMontar(e) {
  const t = RD.l.find((c) => c.ticker + c.lado === e);
  if (!t || (typeof pBloq == "function" && !pBloq())) return;
  const a = rdPlano(t),
    o = +t.entrada,
    s = Math.abs(o - a.stop),
    n = +gv("ct", "cap", "") || +capRef("S") || 0,
    r = +gv("ct", "pct", "") || 1,
    i = (n * r) / 100,
    l = s > 0 && i > 0 ? Math.floor(i / s / 100) * 100 : 0,
    d = a.alvos.map((c) => +(+c.v).toFixed(2));
  ((AUTO = 0),
    (isNew = 1),
    (orig = {}),
    (T = {
      tipo: "S",
      id: uid(),
      dt: loc().slice(0, 16),
      ativo: t.ticker,
      side: t.lado,
      entry: String(o),
      stop: String(+a.stop.toFixed(2)),
      target: String(d[0] || ""),
      target2: String(d[1] || ""),
      target3: String(d[2] || ""),
      qty: l > 0 ? l : 100,
      pv: 1,
      cost: 0,
      emo: "3",
      rules: "s",
      err: "Nenhum",
      mkt: MK[0],
      setup: ((t.setups || [])[0] || {}).nome || "Radar",
      nota:
        `Radar ${rdHoje().split("-").reverse().join("/")}: ${(t.setups || []).map((c) => c.nome).join(" + ")} · Fibonacci ${a.meu ? "traçado por mim" : RD_TFN[a.tf]} · stop no pivô ${rdN(a.stop)} · alvos ${d.map(rdN).join(" / ")}` +
        (l > 0
          ? ` · lote ${l} = risco de ${money(l * s)} (${r}% de ${money(n)})`
          : ""),
    }),
    showSheet());
}
function sqnDe(e) {
  const t = e.length;
  if (t < 2) return null;
  const a = e.reduce((s, n) => s + n, 0) / t,
    o = Math.sqrt(e.reduce((s, n) => s + (n - a) ** 2, 0) / (t - 1));
  return o > 0 ? (a / o) * Math.sqrt(Math.min(t, 100)) : null;
}
function expSetups(e) {
  const t = {};
  return (
    e.forEach((a) => {
      const o = a.c && a.c.r;
      if (o == null || !isFinite(o)) return;
      const s = String(a.setup || "").trim() || "(sem setup)";
      (t[s] ?? (t[s] = [])).push(+o);
    }),
    Object.entries(t)
      .map(([a, o]) => ({
        k: a,
        n: o.length,
        exp: o.reduce((s, n) => s + n, 0) / o.length,
        acerto: o.filter((s) => s > 0).length / o.length,
        sqn: sqnDe(o),
      }))
      .sort((a, o) => o.n - a.n)
  );
}
const sqnTxt = (e) =>
  e == null
    ? "–"
    : e < 1.6
      ? "fraco"
      : e < 2
        ? "abaixo da média"
        : e < 2.5
          ? "médio"
          : e < 3
            ? "bom"
            : e < 5
              ? "excelente"
              : "excepcional";
function monteCarlo(e, t, a = 100, o = 2e3, s = 7) {
  if (e.length < 5) return null;
  let n = s >>> 0;
  const r = () => (
      (n ^= n << 13),
      (n >>>= 0),
      (n ^= n >>> 17),
      (n ^= n << 5),
      (n >>>= 0),
      n / 4294967296
    ),
    i = [],
    l = [],
    d = [];
  for (let p = 0; p < o; p++) {
    let u = 1,
      m = 1,
      f = 0,
      x = 0,
      v = 0;
    for (let g = 0; g < a; g++) {
      const h = e[Math.floor(r() * e.length)];
      if (((u *= 1 + (h * t) / 100), u <= 0)) {
        ((u = 0), (f = 1));
        break;
      }
      ((m = Math.max(m, u)),
        (f = Math.max(f, 1 - u / m)),
        h < 0 ? (x++, (v = Math.max(v, x))) : (x = 0));
    }
    (i.push((u - 1) * 100), l.push(f * 100), d.push(v));
  }
  const c = (p, u) => {
    const m = p.slice().sort((f, x) => f - x);
    return m[Math.min(m.length - 1, Math.floor(u * m.length))];
  };
  return {
    n: a,
    sims: o,
    pct: t,
    medFim: c(i, 0.5),
    pior5Fim: c(i, 0.05),
    medDD: c(l, 0.5),
    pior5DD: c(l, 0.95),
    medSeq: c(d, 0.5),
    pior5Seq: c(d, 0.95),
    pNeg: i.filter((p) => p < 0).length / o,
    pDD20: l.filter((p) => p >= 20).length / o,
  };
}
function fxSessao(e) {
  const t = +String(e || "").slice(11, 13),
    a = +String(e || "").slice(14, 16),
    o = t * 60 + a;
  return String(e || "").slice(11, 16)
    ? o >= 1200 || o < 240
      ? "Ásia (20h–4h)"
      : o < 630
        ? "Londres (4h–10h30)"
        : o < 1080
          ? "Nova York (10h30–18h)"
          : "Fim de NY (18h–20h)"
    : "Sem horário";
}
function fxGrupos(e, t) {
  const a = {};
  return (
    e.forEach((o) => {
      const s = t(o);
      (a[s] ?? (a[s] = [])).push(o);
    }),
    Object.entries(a)
      .map(([o, s]) => {
        const n = s.map((r) => +r.c.pl || 0);
        return {
          k: o,
          n: s.length,
          pl: n.reduce((r, i) => r + i, 0),
          acerto: n.filter((r) => r > 0).length / s.length,
          media: n.reduce((r, i) => r + i, 0) / s.length,
        };
      })
      .sort((o, s) => s.pl - o.pl)
  );
}
function stExtrasRisco(e) {
  const t = expSetups(e),
    a = e
      .map((i) => i.c && i.c.r)
      .filter((i) => i != null && isFinite(i))
      .map(Number),
    o = +gv("ct", "pct", "") || 1,
    s = monteCarlo(a, o),
    n = t.length
      ? `<div class="card" style="overflow-x:auto;padding:6px 8px"><table style="width:100%;font-size:13px"><tr><th style="text-align:left">Setup</th><th>Trades</th><th>Expectativa</th><th>Acerto</th><th>SQN</th></tr>${t.map((i) => `<tr><td>${esc(i.k)}</td><td style="text-align:right">${i.n}</td><td style="text-align:right" class="${i.exp >= 0 ? "g" : "r"}">${f2(i.exp)}×</td><td style="text-align:right">${Math.round(i.acerto * 100)}%</td><td style="text-align:right">${i.sqn == null ? "–" : f2(i.sqn)}<div class="sm mut">${i.n < 30 ? "amostra pequena" : sqnTxt(i.sqn)}</div></td></tr>`).join("")}</table></div>`
      : '<p class="sm mut">Registre o stop dos trades para calcular o R de cada um.</p>',
    r = s
      ? `<div class="kv">${KV("Resultado em 100 trades (mediana)", (s.medFim >= 0 ? "+" : "") + f2(s.medFim) + "%", s.medFim >= 0 ? "g" : "r", "nos 5% piores casos: " + (s.pior5Fim >= 0 ? "+" : "") + f2(s.pior5Fim) + "%")}${KV("Maior queda da conta", f2(s.medDD) + "%", "", "nos 5% piores casos: " + f2(s.pior5DD) + "%")}${KV("Perdas seguidas", String(s.medSeq), "", "nos 5% piores casos: " + s.pior5Seq + " seguidas")}${KV("Chance de terminar no negativo", Math.round(s.pNeg * 100) + "%", s.pNeg > 0.2 ? "r" : "g", "queda de 20% ou mais: " + Math.round(s.pDD20 * 100) + "%")}</div><div class="sm mut">${s.sims.toLocaleString("pt-BR")} sequências sorteadas a partir dos seus ${a.length} trades com R, arriscando ${String(o).replace(".", ",")}% da conta por trade (o risco configurado em Contratos). Mostra o que é normal acontecer com o seu sistema: se a sua mesa ou o seu emocional não aguentam o pior caso, reduza o risco por trade.</div>`
      : '<p class="sm mut">A simulação precisa de pelo menos 5 trades com stop registrado.</p>';
  return `<h2>Expectativa e SQN por setup</h2><div class="sm mut" style="margin-bottom:6px">Expectativa = quanto cada setup paga por trade, em vezes o risco, em média. SQN (Van Tharp): abaixo de 1,6 fraco · 2 a 2,5 médio · 2,5 a 3 bom · acima de 3 excelente. Precisa de 30+ trades por setup para valer.</div>${n}<h2>Simulação de Monte Carlo (próximos 100 trades)</h2>${r}`;
}
function stExtrasFx(e) {
  const t = e.filter((s) => s.forex && s.c && s.c.pl != null);
  if (!t.length) return "";
  const a = (s, n) =>
      `<div class="card" style="overflow-x:auto;padding:6px 8px"><table style="width:100%;font-size:13px"><tr><th style="text-align:left">${s}</th><th>Trades</th><th>Acerto</th><th>Média</th><th>Total</th></tr>${n.map((r) => `<tr><td>${esc(r.k)}</td><td style="text-align:right">${r.n}</td><td style="text-align:right">${Math.round(r.acerto * 100)}%</td><td style="text-align:right" class="${r.media >= 0 ? "g" : "r"}">${mnyC(r.media, "USD")}</td><td style="text-align:right" class="${r.pl >= 0 ? "g" : "r"}">${mnyC(r.pl, "USD")}</td></tr>`).join("")}</table></div>`,
    o = t.filter((s) => !s.lanc);
  return `<h2>Forex por sessão</h2><div class="sm mut" style="margin-bottom:6px">Pela hora de entrada, em Brasília. Lucros lançados sem operação ficam fora (não têm horário).</div>${
    o.length
      ? a(
          "Sessão",
          fxGrupos(o, (s) => fxSessao(s.dt)),
        )
      : '<p class="sm mut">Sem operações com horário.</p>'
  }<h2>Forex por par</h2>${a(
    "Par",
    fxGrupos(t, (s) => String(s.ativo || "—").toUpperCase()),
  )}`;
}
{
  const e = vStats;
  vStats = function () {
    let t = e();
    try {
      if (typeof ST < "u" && (ST.aba === "risco" || ST.aba === "onde")) {
        const a = stRows()
          .map((o) => (o.c ? o : { ...o, c: calc(o) }))
          .filter((o) => o.c && o.c.pl != null);
        a.length &&
          (t += ST.aba === "risco" ? stExtrasRisco(a) : stExtrasFx(a));
      }
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
function cBRL(e) {
  const t = calc(e);
  return moedaT(e) === "USD"
    ? {
        ...t,
        pl: t.pl == null ? null : emBRL(t.pl, "USD"),
        risk: t.risk == null ? null : emBRL(t.risk, "USD"),
      }
    : t;
}
function dayFech(e) {
  return S.trades
    .map((t) => ({ ...t, c: calc(t) }))
    .filter((t) => t.c.pl != null && String(t.dtx || t.dt).slice(0, 10) === e)
    .concat(typeof fxDia == "function" ? fxDia(e) : []);
}
function abertosHoje() {
  const e = loc().slice(0, 10);
  return (
    S.trades.filter((t) => isOpen(t) && String(t.dt).slice(0, 10) === e)
      .length +
    (S.ops || []).filter(
      (t) => t.st === "open" && String(t.dt || "").slice(0, 10) === e,
    ).length
  );
}
function riscoAberto() {
  const e = (n, r) => +gv("ct", n, r),
    t = e("cap", 1e4),
    a = e("pct", 2),
    o = (t * a) / 100,
    s = [];
  return (
    S.trades.filter(isOpen).forEach((n) => {
      const r = calc(n),
        i = r.risk == null ? null : emBRL(r.risk, moedaT(n));
      s.push({
        n: n.ativo || "?",
        r: i,
        sem: r.risk == null,
        alto: i != null && o > 0 && i > o * 1.5,
      });
    }),
    (S.ops || [])
      .filter((n) => n.st === "open")
      .forEach((n) => {
        const r = +n.rk > 0 ? emBRL(+n.rk, "USD") : null;
        s.push({
          n: n.s || "Forex",
          r,
          sem: r == null,
          alto: r != null && o > 0 && r > o * 1.5,
        });
      }),
    {
      itens: s,
      tot: sum(s.map((n) => n.r || 0)),
      sem: s.filter((n) => n.sem),
      alto: s.filter((n) => n.alto),
      porTrade: o,
    }
  );
}
{
  const e = posso;
  posso = function (t, a, o) {
    let s = e(t, a, o);
    try {
      const n = riscoAberto();
      if (!n.itens.length) return s;
      const r = pCore(t, a),
        i = Math.max(0, r.lim - r.perda),
        l = n.tot > i,
        d = [
          `Risco aberto: <b class="${l ? "r" : ""}">${money(n.tot)}</b> em ${n.itens.length} posição(ões) · cabe ${money(i)} no dia`,
        ];
      (l &&
        d.push(
          '<b class="r">Se todos os stops baterem, você passa do limite de perda do dia.</b> Reduza a mão ou suba os stops antes de abrir outro trade.',
        ),
        n.sem.length &&
          d.push(
            `<b class="r">${n.sem.length} posição(ões) sem stop:</b> ${esc(n.sem.map((c) => c.n).join(", "))}. Sem stop o risco é ilimitado; registre o stop agora.`,
          ),
        n.alto.length &&
          d.push(
            `<span class="am">Risco acima do plano (mais de 1,5× ${money(n.porTrade)} por trade):</span> ${esc(n.alto.map((c) => c.n).join(", "))}.`,
          ),
        (s = s.replace(
          /<\/div><\/div>$/,
          `</div><div class="sm rd-heat" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bd)">${d.join("<br>")}</div></div>`,
        )));
    } catch {}
    return s;
  };
}
const TR_PAD = {
  on: 1,
  perdaDia: 0,
  meta: 0,
  maxTr: 0,
  maxStops: 2,
  pausaMin: 15,
  chk: 1,
  semStop: 1,
  lucro: 1,
  turno: 1,
};
function trCfg() {
  const e = S.ax || {},
    t = loc().slice(0, 10),
    a = e.travaNova;
  if (a && a.desde <= t) {
    (((S.ax ?? (S.ax = {})).trava = { ...(e.trava || {}), ...a.cfg }),
      delete S.ax.travaNova);
    try {
      save();
    } catch {}
  }
  return { ...TR_PAD, ...((S.ax || {}).trava || {}) };
}
const TRV = { passe: 0, aberto: 0 };
function travaEstado() {
  const e = trCfg(),
    { td: t, hj: a, P: o } = pHoje(),
    s = pCore(a, o),
    n = e.on ? s.mot.slice() : [],
    r = [];
  let i = 0;
  if (e.on && +e.pausaMin > 0) {
    const l = a
        .filter((c) => c.dtx)
        .sort((c, p) => String(c.dtx).localeCompare(String(p.dtx))),
      d = l[l.length - 1];
    if (d && d.c.pl < 0) {
      const c =
        new Date(String(d.dtx).slice(0, 16)).getTime() + e.pausaMin * 6e4;
      c > Date.now() && (i = c);
    }
  }
  if (e.on && e.semStop) {
    const l = riscoAberto();
    l.sem.length &&
      r.push({
        id: "stop",
        txt: `${l.sem.length} posição(ões) aberta(s) sem stop: ${l.sem.map((d) => d.n).join(", ")}`,
        acao: "Registre o stop na ficha da posição.",
      });
  }
  if (e.on && e.chk) {
    const l = (S.rules || []).length,
      d = chkN((S.days[t] || {}).chk);
    l &&
      d < l &&
      r.push({
        id: "chk",
        txt: `checklist de regras ${d}/${l}`,
        acao: "Feche o checklist de regras em Meu dia.",
      });
  }
  return {
    cf: e,
    duro: n,
    resolver: r,
    pausaAte: i,
    c: s,
    P: o,
    hj: a,
    travado: !!(n.length || r.length || i),
  };
}
const trMin = (e) => {
  const t = Math.ceil(e / 6e4);
  return t >= 60
    ? Math.floor(t / 60) + "h" + String(t % 60).padStart(2, "0")
    : t + " min";
};
function trViol(e, t) {
  (((S.ax ?? (S.ax = {})).viol = ((S.ax || {}).viol || [])
    .concat([
      {
        d: loc().slice(0, 10),
        h: hm(),
        mot: [
          ...e.duro,
          ...e.resolver.map((a) => a.txt),
          ...(e.pausaAte ? ["pausa depois do stop"] : []),
        ],
        a: t || "",
      },
    ])
    .slice(-300)),
    save());
}
pBloq = function () {
  const e = travaEstado();
  return e.travado
    ? TRV.passe && Date.now() < TRV.passe
      ? ((TRV.passe = 0),
        setTimeout(() => {
          try {
            typeof T < "u" &&
              T &&
              isNew &&
              ((T.err = "Operei com a trava ativa"),
              (T.trava = 1),
              showSheet());
          } catch {}
        }, 0),
        !0)
      : (trvAbre(e), !1)
    : !0;
};
function trvHtml(e) {
  const t = (a, o) => `<li class="${o || ""}">${a}</li>`;
  return `<div class="ov" id="trv"><div class="sh trv-sh"><div class="top"><h2 style="margin:0">🔒 Operação travada</h2><button class="x" data-trv="x">✕</button></div>
  ${e.duro.length ? `<div class="trv-b r"><b>Regra dura: acabou o dia</b><ul>${e.duro.map((a) => t(esc(a))).join("")}</ul><div class="sm">Isso não se resolve hoje. Feche a plataforma, faça o debriefing e volte amanhã.</div></div>` : ""}
  ${e.pausaAte ? `<div class="trv-b am"><b>⏸️ Pausa depois do stop</b><div>Faltam <b data-trv-cd="${e.pausaAte}">${trMin(e.pausaAte - Date.now())}</b>. Levante, respire, releia o plano. Entrar agora é revanche.</div></div>` : ""}
  ${e.resolver.length ? `<div class="trv-b"><b>Resolva antes de entrar</b><ul>${e.resolver.map((a) => t(`${esc(a.txt)}<div class="sm mut">${esc(a.acao)}</div>`)).join("")}</ul>${e.resolver.some((a) => a.id === "chk") ? '<button class="btn s" data-trv="dia">Abrir o checklist</button>' : ""}</div>` : ""}
  <details class="trv-v"><summary class="sm mut">Já operei mesmo assim (registrar como violação)</summary>
    <div class="sm" style="margin:6px 0">Isto <b>não libera</b> novos trades: serve só para o diário não mentir. O trade fica marcado como "Operei com a trava ativa" e conta na sua nota de disciplina.</div>
    <label>Digite: QUEBREI MINHA REGRA<input data-trv-frase autocomplete="off" autocapitalize="characters"></label>
    <button class="btn" data-trv="ok" disabled data-trv-ate="${Date.now() + 2e4}">Aguarde 20 s</button></details>
  </div></div>`;
}
function trvAbre(e) {
  const t = document.getElementById("trv");
  (t && t.remove(),
    document.body.insertAdjacentHTML("beforeend", trvHtml(e)),
    (TRV.aberto = 1),
    trvTick());
}
function trvFecha() {
  const e = document.getElementById("trv");
  (e && e.remove(), (TRV.aberto = 0));
}
function trvTick() {
  if (!document.getElementById("trv")) return;
  document.querySelectorAll("[data-trv-cd]").forEach((a) => {
    const o = +a.dataset.trvCd - Date.now();
    a.textContent = o > 0 ? trMin(o) : "0 min";
  });
  const e = document.querySelector('[data-trv="ok"]'),
    t = document.querySelector("[data-trv-frase]");
  if (e) {
    const a = +e.dataset.trvAte - Date.now(),
      o = t && t.value.trim().toUpperCase() === "QUEBREI MINHA REGRA";
    ((e.disabled = a > 0 || !o),
      (e.textContent =
        a > 0
          ? `Aguarde ${Math.ceil(a / 1e3)} s`
          : o
            ? "Registrar a violação"
            : "Digite a frase"));
  }
  setTimeout(trvTick, 1e3);
}
(document.addEventListener("input", (e) => {
  if (e.target.closest && e.target.closest("[data-trv-frase]")) {
    const t = document.querySelector('[data-trv="ok"]');
    if (t && +t.dataset.trvAte <= Date.now()) {
      const a = e.target.value.trim().toUpperCase() === "QUEBREI MINHA REGRA";
      ((t.disabled = !a),
        (t.textContent = a ? "Registrar a violação" : "Digite a frase"));
    }
  }
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-trv]");
    if (!t) return;
    const a = t.dataset.trv;
    if (a === "x") {
      trvFecha();
      return;
    }
    if (a === "dia") {
      (trvFecha(),
        (tab = "dia"),
        (D = loc().slice(0, 10)),
        (DV = "ed"),
        render());
      return;
    }
    if (a === "ok") {
      if (t.disabled) return;
      ((TRV.passe = Date.now() + 12e4),
        trvFecha(),
        window.toast &&
          toast(
            "Toque de novo para lançar o trade (vale 2 min). Ele vai entrar como violação.",
            4500,
          ),
        render());
    }
  }));
{
  const e = bkBanner;
  bkBanner = function () {
    e();
    try {
      const t = travaEstado();
      if (!t.duro.length && !t.pausaAte) return;
      const a = document.getElementById("app");
      if (!a || a.querySelector(".trv-top")) return;
      a.insertAdjacentHTML(
        "afterbegin",
        `<div class="trv-top">${t.duro.length ? `🔒 <b>Travado até amanhã:</b> ${esc(t.duro.join(" · "))}` : `⏸️ <b>Pausa depois do stop:</b> faltam ${trMin(t.pausaAte - Date.now())}`}</div>`,
      );
    } catch {}
  };
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest('[data-a="opgo"]') &&
      (pBloq() || (e.stopImmediatePropagation(), e.preventDefault()));
  },
  !0,
);
function mtDias(e) {
  const t = diasMais(loc().slice(0, 10), -e),
    a = {},
    o = (s, n, r) => {
      (a[s] ?? (a[s] = { k: s, pl: 0, ts: [] }),
        (a[s].pl += r),
        a[s].ts.push(n));
    };
  return (
    S.trades.forEach((s) => {
      const n = calc(s);
      if (n.pl == null) return;
      const r = String(s.dtx || s.dt).slice(0, 10);
      r >= t && o(r, { ...s, c: n }, emBRL(n.pl, moedaT(s)));
    }),
    typeof fxPer == "function" &&
      fxPer(t, "9999-12-31").forEach((s) =>
        o(s.dtx.slice(0, 10), s, emBRL(s.c.pl, "USD")),
      ),
    Object.values(a).sort((s, n) => s.k.localeCompare(n.k))
  );
}
function mentorAchados() {
  const e = trCfg(),
    { hj: t, P: a } = pHoje(),
    o = pCore(t, a).lim,
    s = pCore(t, a).nd,
    n = mtDias(30),
    r = [];
  if (!n.length) return r;
  const i = n.filter((k) => k.pl > 0),
    l = i.length ? sum(i.map((k) => k.pl)) / i.length : 0,
    d = n.reduce((k, A) => (A.pl < k.pl ? A : k), n[0]);
  o > 0 &&
    d.pl < -o * 1.2 &&
    r.push({
      g: 3,
      t: `Seu pior dia (${d.k.slice(8)}/${d.k.slice(5, 7)}) foi ${money(d.pl)}: ${(Math.abs(d.pl) / o).toFixed(1).replace(".", ",")}× o seu limite de ${money(o)}.`,
      f:
        l > 0
          ? `Um dia assim apaga ${Math.round(Math.abs(d.pl) / l)} dias bons. O limite só existe se for respeitado: a trava agora fecha o dia sozinha quando ele chega.`
          : "O limite só existe se for respeitado: a trava agora fecha o dia sozinha.",
    });
  const c = n.filter((k) => o > 0 && k.pl <= -o);
  c.length >= 2 &&
    r.push({
      g: 3,
      t: `${c.length} dias nos últimos 30 bateram o limite de perda.`,
      f: "Se o limite é batido com frequência, ele está alto demais para a sua mão ou o stop está sendo arrastado. Reduza o tamanho até passar 20 pregões sem bater.",
    });
  const p = n.filter((k) => k.ts.length > s);
  p.length &&
    r.push({
      g: 2,
      t: `Passou do máximo de ${s} trades em ${p.length} dia(s).`,
      f: `Resultado desses dias: ${money(sum(p.map((k) => k.pl)))}. Overtrading quase sempre é tentativa de recuperar. A trava agora conta inclusive os trades abertos.`,
    });
  let u = 0,
    m = 0;
  const f = +e.pausaMin || 15;
  (n.forEach((k) => {
    const A = k.ts
      .filter((C) => C.dt && C.dtx)
      .sort((C, I) => String(C.dt).localeCompare(String(I.dt)));
    A.forEach((C, I) => {
      const J = A.slice(0, I)
        .filter((se) => se.c.pl < 0 && String(se.dtx) <= String(C.dt))
        .pop();
      J &&
        (new Date(String(C.dt).slice(0, 16)) -
          new Date(String(J.dtx).slice(0, 16))) /
          6e4 <
          f &&
        (u++, (m += emBRL(C.c.pl, moedaT(C))));
    });
  }),
    u >= 2 &&
      r.push({
        g: m < 0 ? 3 : 1,
        t: `${u} entradas em menos de ${f} min depois de um stop (resultado ${money(m)}).`,
        f: "Isso é revanche. A pausa depois do stop agora é obrigatória: o app não deixa abrir trade antes do tempo.",
      }));
  const x = n
    .flatMap((k) => k.ts)
    .filter((k) => !k.forex && k.c && k.c.semStop).length;
  x &&
    r.push({
      g: 3,
      t: `${x} trade(s) sem stop registrado nos últimos 30 dias.`,
      f: "Sem stop não existe risco definido. A trava agora bloqueia novos trades enquanto houver posição aberta sem stop.",
    });
  const v = n.filter((k) => {
    let A = 0,
      C = 0;
    return (
      k.ts
        .slice()
        .sort((I, J) => String(I.dtx).localeCompare(String(J.dtx)))
        .forEach((I) => {
          ((A += emBRL(I.c.pl, moedaT(I))), (C = Math.max(C, A)));
        }),
      o > 0 && C >= o * 0.5 && A <= C * 0.5
    );
  });
  v.length &&
    r.push({
      g: 2,
      t: `Em ${v.length} dia(s) você chegou a estar bem positivo e devolveu metade ou mais.`,
      f: "Dia verde se protege. A trava agora fecha o dia quando você devolve metade do pico.",
    });
  const g = diasMais(loc().slice(0, 10), -7),
    h = ((S.ax || {}).viol || []).filter((k) => k.d >= g);
  h.length &&
    r.push({
      g: 3,
      t: `${h.length} violação(ões) da trava nos últimos 7 dias.`,
      f: "Cada violação é um aviso de que o seu emocional está decidindo. Depois de 2 na semana, opere com metade da mão até completar 5 pregões limpos.",
    });
  const b = n.flatMap((k) => k.ts).filter((k) => k.c && k.c.pl != null),
    y = b.filter((k) => k.c.pl > 0),
    j = b.filter((k) => k.c.pl < 0);
  if (y.length >= 5 && j.length >= 5) {
    const k = sum(y.map((C) => emBRL(C.c.pl, moedaT(C)))) / y.length,
      A = -sum(j.map((C) => emBRL(C.c.pl, moedaT(C)))) / j.length;
    A > k * 1.2 &&
      r.push({
        g: 2,
        t: `Sua perda média (${money(A)}) é maior que o ganho médio (${money(k)}).`,
        f: "Você corta ganho cedo ou deixa perda correr. Saia no stop técnico sem negociar e deixe pelo menos metade da posição ir até o alvo.",
      });
  }
  return r.sort((k, A) => A.g - k.g);
}
function mentorNota(e) {
  const t = mtDias(400).find((p) => p.k === e),
    a = ((S.ax || {}).viol || []).filter((p) => p.d === e).length,
    o = trCfg(),
    s = [];
  if (!t && !a) return null;
  const n = t ? t.ts : [],
    { lim: r, nd: i } = pCore([], 0);
  (a && s.push(a + " violação(ões) da trava"),
    n.some((p) => !p.forex && p.c && p.c.semStop) && s.push("trade sem stop"),
    n.some((p) => p.err === "Operei com a trava ativa") &&
      s.push("operou travado"),
    t && r > 0 && t.pl < -r && s.push("passou do limite de perda"),
    n.length > i && s.push("passou do máximo de trades"));
  const l = n
    .filter((p) => p.dt && p.dtx)
    .sort((p, u) => String(p.dt).localeCompare(String(u.dt)));
  let d = 0;
  (l.forEach((p, u) => {
    const m = l
      .slice(0, u)
      .filter((f) => f.c.pl < 0 && String(f.dtx) <= String(p.dt))
      .pop();
    m &&
      (new Date(String(p.dt).slice(0, 16)) -
        new Date(String(m.dtx).slice(0, 16))) /
        6e4 <
        (+o.pausaMin || 15) &&
      d++;
  }),
    d && s.push(d + " entrada(s) de revanche"));
  {
    let p = 0,
      u = 0,
      m = 0;
    const f = +o.maxStops || 2,
      x = n
        .filter((v) => v.dtx)
        .sort((v, g) => String(v.dtx).localeCompare(String(g.dtx)));
    (n
      .filter((v) => v.dt)
      .forEach((v) => {
        ((p = 0),
          (u = 0),
          x
            .filter((g) => g !== v && String(g.dtx) <= String(v.dt))
            .forEach((g) => {
              const h = emBRL(g.c.pl, moedaT(g));
              ((p += h), (u = h < 0 ? u + 1 : 0));
            }),
          ((r > 0 && p <= -r) || u >= f) && m++);
      }),
      m &&
        s.push(m + " entrada(s) depois de bater o limite ou os stops do dia"));
  }
  const c = s.length;
  return {
    nota: c === 0 ? "A" : c === 1 ? "B" : c === 2 ? "C" : c === 3 ? "D" : "E",
    f: s,
    pl: t ? t.pl : 0,
    ruim: s.length > 0,
  };
}
function mentorHtml() {
  const e = loc().slice(0, 10);
  if (D !== e) {
    const m = mentorNota(D);
    return m
      ? `<div class="card mt-card"><div class="top"><b>🧭 Mentor</b><span class="mt-nota n${m.nota}">${m.nota}</span></div><div class="sm">${m.f.length ? "O que pesou: " + esc(m.f.join(" · ")) + "." : "Dia limpo: regras respeitadas."}</div></div>`
      : "";
  }
  const t = travaEstado(),
    a = t.cf,
    o = riscoAberto(),
    s = t.c,
    n = Math.max(0, s.lim - s.perda),
    r = mentorNota(e),
    i = mentorAchados().slice(0, 3),
    l = t.duro.length
      ? ["🔒 Travado até amanhã", "r"]
      : t.pausaAte
        ? ["⏸️ Pausa depois do stop", "am"]
        : t.resolver.length
          ? ["⚠️ Resolva antes de operar", "am"]
          : a.on
            ? ["✅ Liberado, dentro do plano", "g"]
            : ["Trava desligada", "mut"],
    d = (m, f) => {
      const x = f > 0 ? Math.min(100, (m / f) * 100) : 0;
      return `<div class="mt-bar"><i style="width:${x}%;background:${x >= 100 ? "var(--r)" : x >= 70 ? "#c2933d" : "var(--g)"}"></i></div>`;
    },
    c = (S.ax || {}).travaNova,
    p = (m, f, x) =>
      `<label>${f}<input type="number" step="any" inputmode="decimal" data-trc="${m}" value="${esc(a[m] || "")}" placeholder="${x}"></label>`,
    u = (m, f) =>
      `<label class="ck"><input type="checkbox" data-trc="${m}"${a[m] ? " checked" : ""}><span>${f}</span></label>`;
  return `<div class="card mt-card"><div class="top"><b>🧭 Mentor</b>${r ? `<span class="mt-nota n${r.nota}" title="Nota de hoje">${r.nota}</span>` : ""}</div>
  <div class="mt-st ${l[1]}">${l[0]}</div>
  ${a.castigo ? `<div class="sm am">🩹 Dia de recuperação (${esc(a.castigo)}): perda máxima ${money(a.perdaDia)} e no máximo ${a.maxTr} trade(s) hoje.</div>` : ""}
  ${t.duro.length ? `<div class="sm r">${esc(t.duro.join(" · "))}. Feche a plataforma e vá para o debriefing.</div>` : ""}
  ${t.pausaAte ? `<div class="sm">Próxima entrada liberada em <b>${trMin(t.pausaAte - Date.now())}</b>.</div>` : ""}
  ${t.resolver.map((m) => `<div class="sm am">• ${esc(m.txt)}: ${esc(m.acao)}</div>`).join("")}
  <div class="mt-kpi"><div><span class="sm mut">Perda do dia</span><b>${money(s.perda)}</b><span class="sm mut">de ${money(s.lim)}</span>${d(s.perda, s.lim)}</div>
  <div><span class="sm mut">Trades</span><b>${s.ntr != null ? s.ntr : t.hj.length}</b><span class="sm mut">de ${s.nd}</span>${d(s.ntr || 0, s.nd)}</div>
  <div><span class="sm mut">Stops seguidos</span><b>${s.seq}</b><span class="sm mut">de ${a.maxStops || 2}</span>${d(s.seq, +a.maxStops || 2)}</div>
  <div><span class="sm mut">Risco aberto</span><b class="${o.tot > n ? "r" : ""}">${money(o.tot)}</b><span class="sm mut">cabe ${money(n)}</span>${d(o.tot, n || 1)}</div></div>
  ${i.length ? `<div class="mt-cob"><div class="sm"><b>O que o mentor está vendo (últimos 30 dias)</b></div>${i.map((m) => `<div class="mt-ach g${m.g}"><div>${esc(m.t)}</div><div class="sm mut">${esc(m.f)}</div></div>`).join("")}</div>` : ""}
  <details class="mt-reg"><summary class="sm"><b>⚙️ Regras da trava</b>${c ? ` <span class="am">(mudança vale a partir de ${c.desde.slice(8)}/${c.desde.slice(5, 7)})</span>` : ""}</summary>
    <div class="g2">${p("perdaDia", "Perda máxima do dia (R$)", money(s.lim).replace("R$", "").trim())}${p("meta", "Meta do dia (R$, para parar)", "opcional")}</div>
    <div class="g3">${p("maxTr", "Máx. de trades", "3")}${p("maxStops", "Stops seguidos", "2")}${p("pausaMin", "Pausa após stop (min)", "15")}</div>
    ${u("on", "Trava ligada")}${u("semStop", "Travar com posição sem stop")}${u("chk", "Exigir o checklist de regras")}${u("lucro", "Parar se devolver metade do lucro do dia")}${u("turno", "Travar em dia de turno")}
    <div class="sm mut">Com o dia travado, afrouxar uma regra (subir limite, desligar a trava) só vale a partir de amanhã. Apertar vale na hora. Vale a regra mais rígida entre esta e o limite do dia preenchido abaixo.</div></details>
  <div class="sm mut" style="margin-top:6px">A trava bloqueia lançar trades no app. Ela não bloqueia a corretora: configure também o limite de perda diária na sua plataforma ou corretora, se ela oferecer.</div></div>`;
}
document.addEventListener("change", (e) => {
  const t = e.target.closest && e.target.closest("[data-trc]");
  if (!t) return;
  const a = t.dataset.trc,
    o =
      t.type === "checkbox"
        ? t.checked
          ? 1
          : 0
        : t.value === ""
          ? 0
          : +t.value,
    s = trCfg(),
    n =
      a === "perdaDia" || a === "meta" || a === "maxTr" || a === "maxStops"
        ? +s[a] > 0 && (o === 0 || o > +s[a])
        : a === "pausaMin"
          ? o < (+s.pausaMin || 0)
          : s[a] && !o,
    r = travaEstado();
  if (n && r.travado) {
    const i = diasMais(loc().slice(0, 10), 1),
      l = (S.ax.travaNova && S.ax.travaNova.cfg) || {};
    ((S.ax.travaNova = { desde: i, cfg: { ...l, [a]: o } }),
      save(),
      window.toast &&
        toast(
          "Dia travado: essa mudança afrouxa a regra e só vale amanhã.",
          4e3,
        ),
      render());
    return;
  }
  (((S.ax ?? (S.ax = {})).trava = { ...((S.ax || {}).trava || {}), [a]: o }),
    save(),
    render());
});
{
  const e = vDia;
  vDia = function () {
    const t = e.apply(this, arguments);
    if (typeof DV < "u" && DV === "hist") return t;
    try {
      const a = mentorHtml();
      if (!a) return t;
      const o = t.indexOf(
        '<div class="card" style="margin-top:12px"><b>Resumo automático</b>',
      );
      return o >= 0 ? t.slice(0, o) + a + t.slice(o) : t + a;
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
{
  const e = posso;
  posso = function (t, a, o) {
    let s = e(t, a, o);
    try {
      const n = travaEstado();
      (n.pausaAte &&
        !n.duro.length &&
        (s = s.replace(
          /(<div class="sm" style="margin:6px 0">)/,
          `$1<b class="am">⏸️ Pausa depois do stop: faltam ${trMin(n.pausaAte - Date.now())}.</b> `,
        )),
        n.duro.length &&
          (s = s
            .replace(">Pare por hoje<", ">🔒 Travado até amanhã<")
            .replace(
              "Novo trade pede confirmação.",
              "O app não deixa lançar trade novo hoje.",
            )));
    } catch {}
    return s;
  };
}
((crMeses = function (e) {
  const t = {},
    a = (p) =>
      t[p] ??
      (t[p] = {
        dt: 0,
        sw: 0,
        swAcoes: 0,
        vendas: 0,
        ext: 0,
        b3: 0,
        fx: 0,
        n: 0,
      }),
    o = (p) => /^[A-Z]{4}(3|4|5|6|11)$/.test(String(p || "").toUpperCase());
  (S.trades.forEach((p) => {
    const u = calc(p);
    if (u.pl == null) return;
    const m = a(dOf(p).slice(0, 7)),
      f = emBRL(u.pl, moedaT(p));
    if ((m.n++, (m.b3 += f), moedaT(p) === "USD")) {
      m.ext += f;
      return;
    }
    if (
      (p.tipo || "D") === "D" ||
      String(p.dt).slice(0, 10) === String(p.dtx || p.dt).slice(0, 10)
    ) {
      m.dt += f;
      return;
    }
    if (((m.sw += f), p.tipo !== "O" && o(p.ativo))) {
      const x = numN(p.qty) || 0,
        v = numN(p.pv) || 1,
        g = (p.side === "C" ? numN(p.exit) : numN(p.entry)) || 0;
      ((m.vendas += g * x * v), (m.swAcoes += f));
    }
  }),
    e.fx &&
      lcItems().forEach((p) => {
        const u = a(p.d.slice(0, 7)),
          m = p.v * usdBrl();
        ((u.fx += m), (u.ext += m), u.n++);
      }));
  const s = Object.keys(t)
    .filter((p) => /^\d{4}-\d{2}$/.test(p))
    .sort();
  if (!s.length) return [];
  const n = [],
    r = loc().slice(0, 7),
    i = { dt: 0, sw: 0, ext: 0 },
    l = (p, u, m) => {
      if (u < 0) return ((i[p] += -u), 0);
      const f = Math.max(0, u - i[p]);
      return ((i[p] = Math.max(0, i[p] - u)), (f * m) / 100);
    };
  let d = +s[0].slice(0, 4),
    c = +s[0].slice(5, 7);
  for (;;) {
    const p = d + "-" + String(c).padStart(2, "0");
    if (p > r) break;
    const u = t[p] || {
        dt: 0,
        sw: 0,
        swAcoes: 0,
        vendas: 0,
        ext: 0,
        b3: 0,
        fx: 0,
        n: 0,
      },
      m = u.vendas > 0 && u.vendas <= 2e4 && u.swAcoes > 0,
      f = m ? u.sw - u.swAcoes : u.sw,
      x = l("dt", u.dt, +e.irDT || 20),
      v = l("sw", f, +e.irSW || 15),
      g = l("ext", u.ext, e.irFX === 0 ? 0 : +e.irFX || 15),
      h = x + v + g,
      b = u.b3 + u.fx;
    (n.push({
      k: p,
      b3: u.b3,
      fx: u.fx,
      bruto: b,
      ir: h,
      irDet: { dt: x, sw: v, ext: g },
      isento: m ? u.swAcoes : 0,
      vendas: u.vendas,
      liq: b - h,
      n: u.n,
      atual: p === r,
    }),
      ++c > 12 && ((c = 1), d++));
  }
  return n;
}),
  (function () {
    const e = TraderStyles.slot("legacy-016");
    ((e.textContent = TraderStyles.css("legacy-016")), TraderStyles.mount(e));
  })());
function trvMarca(e) {
  const t = loc().slice(0, 10),
    a = "trava." + t,
    o = e.duro.filter((s) => !/^dia de turno/.test(s));
  return !o.length || !e.cf.on
    ? (S.ax || {})[a] || null
    : ((S.ax || {})[a]
        ? JSON.stringify(S.ax[a].mot) !== JSON.stringify(o) &&
          ((S.ax[a].mot = o), save())
        : (((S.ax ?? (S.ax = {}))[a] = { desde: loc().slice(11, 16), mot: o }),
          save()),
      S.ax[a]);
}
function travaPush() {
  const e = loc().slice(0, 10),
    t = (S.ax || {})["trava." + e],
    a = ((S.ax || {}).viol || []).filter((o) => o.d === e).length;
  return t || a
    ? { dia: e, desde: t ? t.desde : "", mot: t ? t.mot : [], viol: a }
    : null;
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      t.trava = travaPush();
    } catch {}
    return t;
  };
}
{
  const e = trCfg;
  trCfg = function () {
    const t = e(),
      a = (S.ax || {}).castigo;
    if (!t.on || !a || a.dia !== loc().slice(0, 10)) return t;
    const o = (r, i) => +gv("ct", r, i),
      s = +t.maxTr || o("nd", 3),
      n =
        +t.perdaDia ||
        +(S.prop || {}).perdaDia ||
        ((o("cap", 1e4) * o("pct", 2)) / 100) * s;
    return {
      ...t,
      perdaDia: Math.round((n / 2) * 100) / 100,
      maxTr: Math.max(1, Math.floor(s / 2)),
      castigo: a.motivo || "violação de ontem",
    };
  };
}
function trvVigia() {
  const e = trCfg();
  if (!e.on) return;
  const t = loc().slice(0, 10),
    a = (S.ax || {})["trava." + t],
    o = e.turno !== 0 && typeof turnoNv == "function" && turnoNv(t) === "r";
  if (!a && !o) return;
  const s = new Set((S.ax || {}).violAck || []),
    n = (l) =>
      String(l || "").slice(0, 10) === t &&
      (o || String(l).slice(11, 16) > a.desde),
    r = [];
  if (
    (S.trades.forEach((l) => {
      !s.has(l.id) && n(l.dt) && r.push({ id: l.id, n: l.ativo, t: l });
    }),
    (S.ops || []).forEach((l) => {
      l.st !== "plan" &&
        !s.has("fx:" + l.id) &&
        n(l.dt) &&
        r.push({ id: "fx:" + l.id, n: l.s });
    }),
    !r.length)
  )
    return;
  r.forEach((l) => {
    l.t &&
      (!l.t.err || l.t.err === "Nenhum") &&
      ((l.t.err = "Operei com a trava ativa"), (l.t.u = Date.now()));
  });
  const i = a ? a.mot : ["dia de turno"];
  ((S.ax.violAck = [...s, ...r.map((l) => l.id)].slice(-500)),
    (S.ax.viol = (S.ax.viol || [])
      .concat(
        r.map((l) => ({
          d: t,
          h: hm(),
          mot: i,
          a: "trade " + (l.n || "") + " depois da trava",
        })),
      )
      .slice(-300)),
    (S.ax.castigo = {
      dia: diasMais(t, 1),
      motivo: `${r.length} trade(s) depois da trava em ${t.slice(8)}/${t.slice(5, 7)}`,
    }),
    save(),
    trvBronca(r, i, a ? a.desde : ""),
    clearTimeout(trvVigia._t),
    (trvVigia._t = setTimeout(() => {
      try {
        turnoPushSync(!1);
      } catch {}
    }, 1500)));
}
function trvBronca(e, t, a) {
  const o = document.getElementById("trvb");
  (o && o.remove(),
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="ov" id="trvb"><div class="sh trv-sh trvb"><h2 style="margin:0 0 8px">🚨 Você operou com a trava ativa</h2>
  <div>${a ? `Às <b>${esc(a)}</b> o seu dia travou por <b>${esc(t.join(", "))}</b>.` : `Hoje é <b>${esc(t.join(", "))}</b>: o plano era não operar.`} Depois disso entrou: <b>${esc(e.map((n) => n.n || "?").join(", "))}</b>.</div>
  <div style="margin:10px 0">Isso não é detalhe. É exatamente o comportamento que transforma um dia ruim numa conta quebrada, e que numa mesa proprietária reprova o teste na hora. O mercado não deve nada a você hoje.</div>
  <div class="trv-b r"><b>Consequências</b><ul><li>Hoje virou <b>dia ruim</b> na disciplina e a sequência de dias limpos zerou.</li><li>Amanhã é <b>dia de recuperação</b>: metade da perda máxima e metade dos trades.</li><li>O trade ficou marcado como "Operei com a trava ativa".</li></ul></div>
  <div class="sm">Agora: feche a plataforma e escreva no debriefing o que você sentiu um minuto antes de entrar.</div>
  <button class="btn" data-trvb disabled data-ate="${Date.now() + 1e4}" style="width:100%;margin-top:10px">Aguarde 10 s</button></div></div>`,
    ));
  const s = () => {
    const n = document.querySelector("[data-trvb]");
    if (!n) return;
    const r = +n.dataset.ate - Date.now();
    ((n.disabled = r > 0),
      (n.textContent =
        r > 0
          ? `Aguarde ${Math.ceil(r / 1e3)} s`
          : "Entendi. Vou fechar a plataforma."),
      r > 0 && setTimeout(s, 500));
  };
  s();
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-trvb]");
  !t ||
    t.disabled ||
    (document.getElementById("trvb").remove(),
    (tab = "dia"),
    (D = loc().slice(0, 10)),
    (DV = "ed"),
    render());
});
function diaRuim(e) {
  try {
    const t = mentorNota(e);
    return !!(t && t.ruim);
  } catch {
    return !1;
  }
}
{
  const e = dscore;
  dscore = function (t) {
    const a = e(t);
    return diaRuim(t) ? (a == null ? 10 : Math.min(a, 20)) : a;
  };
}
{
  const e = disHtml;
  disHtml = function () {
    let t = e();
    try {
      const a = mentorNota(D);
      a &&
        a.ruim &&
        (t += `<div class="trv-top" style="margin-top:8px">🚩 <b>Dia ruim:</b> ${esc(a.f.join(" · "))}.</div>`);
    } catch {}
    return t;
  };
}
{
  const e = bkBanner;
  bkBanner = function () {
    e();
    try {
      const t = travaEstado();
      (trvMarca(t),
        trvVigia(),
        clearTimeout(bkBanner._s),
        (bkBanner._s = setTimeout(() => {
          try {
            turnoPushSync(!1);
          } catch {}
        }, 3e3)));
    } catch {}
  };
}
function notasTrades(e, t) {
  const a = diasMais(e, -t),
    o = new Set((S.ax || {}).notaVista || []),
    s = [],
    n = (r) => (
      (r = String(r || "").trim()),
      r && !/^Radar \d/.test(r) ? r : ""
    );
  return (
    S.trades.forEach((r) => {
      const i = n(r.nota),
        l = String(r.dtx || r.dt || "").slice(0, 10);
      if (!i || l < a || l > e || o.has(r.id)) return;
      const d = calc(r);
      s.push({
        id: r.id,
        d: l,
        h: String(r.dtx || r.dt).slice(11, 16),
        a: r.ativo || "—",
        lado: r.side === "V" ? "Venda" : "Compra",
        pl: d.pl,
        mo: moedaT(r),
        n: i,
        err: r.err && r.err !== "Nenhum" ? r.err : "",
      });
    }),
    (S.ops || []).forEach((r) => {
      const i = n(r.nota),
        l = String(r.dtx || r.dt || "").slice(0, 10);
      !i ||
        l < a ||
        l > e ||
        o.has("fx:" + r.id) ||
        s.push({
          id: "fx:" + r.id,
          d: l,
          h: String(r.dtx || r.dt).slice(11, 16),
          a: r.s || "Forex",
          lado: r.side === "V" ? "Venda" : "Compra",
          pl:
            r.st === "closed" && r.res !== "" && r.res != null ? +r.res : null,
          mo: "USD",
          n: i,
          err: "",
        });
    }),
    s.sort((r, i) => (i.d + i.h).localeCompare(r.d + r.h))
  );
}
function notasHtml() {
  const e = notasTrades(D, 10);
  if (!e.length) return "";
  const t = (a) =>
    new Date(a + "T12:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  return `<div class="card nt-obs" style="margin-top:8px"><div class="top"><span class="sm mut">📌 Pontos para observar · das anotações dos seus trades</span><span class="sm mut">${e.length}</span></div>
  ${e
    .slice(0, 6)
    .map(
      (
        a,
      ) => `<div class="nt-it"><div class="sm"><b>${esc(a.a)}</b> · ${a.lado} · ${t(a.d)}${a.h ? " " + a.h : ""}${a.pl != null ? ` · <span class="${a.pl >= 0 ? "g" : "r"}">${mnyC(a.pl, a.mo)}</span>` : ""}${a.err ? ` · <span class="am">${esc(a.err)}</span>` : ""}</div>
  <div class="nt-tx">“${esc(a.n)}”</div><button class="btn s nt-ok" data-ntok="${esc(a.id)}">✓ Já absorvi</button></div>`,
    )
    .join("")}
  ${e.length > 6 ? `<div class="sm mut">+ ${e.length - 6} anotação(ões) mais antigas nos últimos 10 dias.</div>` : ""}
  <div class="sm mut" style="margin-top:4px">Releia antes de operar. Marque “Já absorvi” quando virar regra ou não precisar mais lembrar.</div></div>`;
}
{
  const e = lastLesson;
  lastLesson = function () {
    let t = "";
    try {
      t = e();
    } catch {}
    try {
      t += notasHtml();
    } catch {}
    return t;
  };
}
((function () {
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.querySelector("#app .nt-obs"),
        a = document.querySelector('#app .dfase[data-fase="pre"]');
      t && a && !a.contains(t) && a.append(t);
    } catch {}
  };
})(),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-ntok]");
    t &&
      (((S.ax ?? (S.ax = {})).notaVista = ((S.ax || {}).notaVista || [])
        .concat(t.dataset.ntok)
        .slice(-1e3)),
      save(),
      render());
  }),
  (function () {
    const e = TraderStyles.slot("legacy-017");
    ((e.textContent = TraderStyles.css("legacy-017")), TraderStyles.mount(e));
  })());
const LVK = {},
  LVGC = {},
  LVG = {
    tk: "",
    tf: (() => {
      try {
        return ls.get("diario-lvg-tf") || "5m";
      } catch {
        return "5m";
      }
    })(),
    hist: null,
    meta: null,
    err: "",
    sel: null,
    busy: 0,
  },
  LVG_TF = { "5m": 300, "15m": 900, "60m": 3600, "1d": 86400 },
  LVG_NOME = {
    "5m": "5 min",
    "15m": "15 min",
    "60m": "60 min",
    "1d": "Diário",
  };
function lvTicks() {
  (LV.all || []).forEach((e) => {
    const t = String(e.ticker).toUpperCase(),
      a = +e.ult,
      o = Date.parse(e.updated_at) || 0;
    if (!(a > 0) || !o) return;
    const s = LVK[t] ?? (LVK[t] = []),
      n = s[s.length - 1];
    (!n || o > n[0]) &&
      (s.push([o, a]), s.length > 8e3 && s.splice(0, s.length - 8e3));
  });
}
const brtDia = (e) => new Date((e - 10800) * 1e3).toISOString().slice(0, 10);
function lvgBars(e, t, a, o, s) {
  const n = LVG_TF[t],
    r = (e || []).map((f) => ({ t: f[0], o: f[1], h: f[2], l: f[3], c: f[4] })),
    i = a && +a.ult > 0 ? +a.ult : null,
    l = Math.floor(s / 1e3);
  if (!i) return r;
  if (t === "1d") {
    const f = brtDia(l),
      x = (o || [])
        .filter((k) => brtDia(Math.floor(k[0] / 1e3)) === f)
        .map((k) => k[1]),
      v = r[r.length - 1],
      g = v && brtDia(v.t) === f,
      h = +a.abe > 0 ? +a.abe : g ? v.o : x[0] || i,
      b = Math.max(+a.max || 0, i, h, ...x, g ? v.h : 0),
      y = Math.min(+a.min > 0 ? +a.min : 1 / 0, i, h, ...x, g ? v.l : 1 / 0),
      j = {
        t: g ? v.t : Date.parse(f + "T13:00:00Z") / 1e3,
        o: h,
        h: b,
        l: y,
        c: i,
        vivo: 1,
      };
    return (g ? (r[r.length - 1] = j) : r.push(j), r);
  }
  const d = (f) => Math.floor(f / n) * n,
    c = r.length ? r[r.length - 1].t : 0,
    p = new Map();
  (o || []).forEach(([f, x]) => {
    const v = d(Math.floor(f / 1e3));
    if (v < c) return;
    const g = p.get(v);
    g
      ? ((g.h = Math.max(g.h, x)), (g.l = Math.min(g.l, x)), (g.c = x))
      : p.set(v, { t: v, o: x, h: x, l: x, c: x });
  });
  const u = d(l);
  (!p.has(u) && c !== u && p.set(u, { t: u, o: i, h: i, l: i, c: i }),
    [...p.values()]
      .sort((f, x) => f.t - x.t)
      .forEach((f) => {
        if (f.t === c) {
          const x = r[r.length - 1];
          ((x.h = Math.max(x.h, f.h)),
            (x.l = Math.min(x.l, f.l)),
            (x.c = f.c),
            (x.vivo = 1));
        } else r.push({ ...f, vivo: 1 });
      }));
  const m = r[r.length - 1];
  return (
    m &&
      m.t === u &&
      ((m.c = i),
      (m.h = Math.max(m.h, i)),
      (m.l = Math.min(m.l, i)),
      (m.vivo = 1)),
    r
  );
}
function lvgLinhas(e) {
  const t = [];
  S.trades
    .filter((o) => isOpen(o) && lvKey(o) === e)
    .forEach((o) => {
      const s = numN(o.entry),
        n = numN(o.stop);
      (s && t.push({ v: s, c: "#709bc2", l: "Entrada" }),
        n && t.push({ v: n, c: "#dc3e26", l: "Stop" }),
        [o.target, o.target2, o.target3]
          .map(numN)
          .filter(Boolean)
          .forEach((r, i) =>
            t.push({ v: r, c: "#ac8439", l: "Alvo " + (i + 1) }),
          ));
    });
  const a = ((typeof RD < "u" && RD.l) || []).find(
    (o) => o.ticker === e && o.ativo,
  );
  return (
    a &&
      (t.push({ v: +a.stop, c: "#c2943e", l: "Radar stop", d: 1 }),
      ((a.fib && a.fib.alvos) || []).forEach((o) =>
        t.push({
          v: +o.v,
          c: "#c2943e",
          l: "Radar " + String(o.r * 100).replace(".", ",") + "%",
          d: 1,
        }),
      )),
    t.filter((o) => isFinite(o.v) && o.v > 0)
  );
}
function lvgSvg(e, t, a, o) {
  const s = e.slice(-70),
    n = s.length;
  if (!n)
    return '<div class="sm mut" style="padding:30px 0;text-align:center">Sem candles ainda.</div>';
  const r = 360,
    i = 250,
    l = 4,
    d = 62,
    c = 10,
    p = 20,
    u = (r - l - d) / n,
    m = s[n - 1];
  let f = Math.min(...s.map((C) => C.l)),
    x = Math.max(...s.map((C) => C.h));
  const v = x - f || Math.abs(x) * 0.01 || 1;
  a.forEach((C) => {
    C.v > f - v * 0.35 &&
      C.v < x + v * 0.35 &&
      ((f = Math.min(f, C.v)), (x = Math.max(x, C.v)));
  });
  const g = (x - f) * 0.05 || 1;
  ((f -= g), (x += g));
  const h = (C) => c + ((x - C) / (x - f)) * (i - c - p),
    b = (C) => l + (C + 0.5) * u,
    y = (C) =>
      C.toLocaleString("pt-BR", {
        minimumFractionDigits: x > 1e3 ? 0 : 2,
        maximumFractionDigits: x > 1e3 ? 0 : 2,
      });
  let j = "";
  for (let C = 0; C <= 4; C++) {
    const I = f + ((x - f) * C) / 4;
    j += `<line x1="${l}" x2="${r - d}" y1="${h(I)}" y2="${h(I)}" stroke="var(--bd)" stroke-width=".5"/><text x="${r - d + 4}" y="${h(I) + 3}" font-size="9" fill="var(--mut,#9ca0a9)">${y(I)}</text>`;
  }
  (s.forEach((C, I) => {
    const J = C.c >= C.o,
      se = J ? "#3aad74" : "#e7614c",
      Ie = h(Math.max(C.o, C.c)),
      Pe = h(Math.min(C.o, C.c));
    j += `<line x1="${b(I)}" x2="${b(I)}" y1="${h(C.h)}" y2="${h(C.l)}" stroke="${se}" stroke-width="1"/><rect x="${b(I) - Math.max(0.6, u * 0.34)}" y="${Ie}" width="${Math.max(1.2, u * 0.68)}" height="${Math.max(0.8, Pe - Ie)}" fill="${se}"${C.vivo ? ' stroke="#ffffff" stroke-width=".6"' : ""}/>`;
  }),
    o != null &&
      s[o] &&
      (j += `<line x1="${b(o)}" x2="${b(o)}" y1="${c}" y2="${i - p}" stroke="var(--mut,#9ca0a9)" stroke-dasharray="2 2"/>`));
  const k = (C, I, J, se) =>
    C < f || C > x
      ? ""
      : `<line x1="${l}" x2="${r - d}" y1="${h(C)}" y2="${h(C)}" stroke="${I}" stroke-width="1" ${se ? 'stroke-dasharray="5 3"' : ""}/><rect x="${r - d + 1}" y="${h(C) - 7}" width="${d - 2}" height="14" rx="3" fill="${I}"/><text x="${r - d + 4}" y="${h(C) + 3.5}" font-size="8.5" fill="#ffffff" font-weight="700">${J}</text>`;
  (a.forEach((C) => {
    j += k(C.v, C.c, C.l, C.d);
  }),
    (j += k(m.c, m.vivo ? "#588bb8" : "#7a808c", y(m.c))));
  const A = (C) =>
    t === "1d"
      ? brtDia(C.t).slice(8) + "/" + brtDia(C.t).slice(5, 7)
      : new Date((C.t - 10800) * 1e3).toISOString().slice(11, 16);
  return (
    [0, Math.floor(n / 2), n - 1].forEach((C, I) => {
      j += `<text x="${I === 0 ? l : I === 2 ? r - d : b(C)}" y="${i - 5}" font-size="9" fill="var(--mut,#9ca0a9)" text-anchor="${I === 0 ? "start" : I === 2 ? "end" : "middle"}">${A(s[C])}</text>`;
    }),
    `<svg class="lvg-svg" viewBox="0 0 ${r} ${i}" data-n="${n}" data-cw="${u}" data-pl="${l}" role="img" aria-label="Gráfico de candles">${j}</svg>`
  );
}
async function lvgCarrega() {
  const e = LVG.tk,
    t = LVG.tf,
    a = e + "|" + t,
    o = cfg();
  if (((LVG.err = ""), LVGC[a] && Date.now() - LVGC[a].ts < 12e4)) {
    ((LVG.hist = LVGC[a].v.proxy ? [] : LVGC[a].v.candles),
      (LVG.meta = LVGC[a].v),
      lvgDesenha());
    return;
  }
  if (!o) {
    ((LVG.err = "Configure o Supabase na aba Conta."), lvgDesenha());
    return;
  }
  ((LVG.busy = 1), lvgDesenha());
  try {
    const s = await fetch(o.url + "/functions/v1/candles", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: o.key },
        body: JSON.stringify({ ativo: e, intervalo: t }),
      }),
      n = await s.json();
    if (!s.ok) throw new Error(n.error || "Erro " + s.status);
    ((LVGC[a] = { ts: Date.now(), v: n }),
      LVG.tk === e &&
        LVG.tf === t &&
        ((LVG.hist = n.proxy ? [] : n.candles), (LVG.meta = n)));
  } catch (s) {
    LVG.tk === e &&
      ((LVG.hist = []), (LVG.meta = null), (LVG.err = String(s.message || s)));
  }
  ((LVG.busy = 0), lvgDesenha());
}
function lvgDesenha() {
  const e = document.getElementById("lvg");
  if (!e) return;
  const t = LVG.tk,
    a =
      (LV.all || []).find((m) => String(m.ticker).toUpperCase() === t) || null,
    o = lvgBars(LVG.hist || [], LVG.tf, a, LVK[t] || [], Date.now()),
    s = lvgLinhas(t),
    n = +(a || {}).ult || 0,
    r = +(a || {}).fec || 0,
    i =
      a && a.var != null && a.var !== ""
        ? +a.var
        : r > 0 && n
          ? (n / r - 1) * 100
          : null,
    l = o.slice(-70),
    d = LVG.sel != null && l[LVG.sel] ? l[LVG.sel] : l[l.length - 1],
    c = (m) =>
      m == null
        ? "–"
        : (+m).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
  ((e.querySelector(".lvg-px").innerHTML = n
    ? `<b>${c(n)}</b> <span class="${i >= 0 ? "g" : "r"}">${i == null ? "" : (i >= 0 ? "+" : "") + c(i) + "%"}</span> <span class="sm mut">${esc((a || {}).hor || "")}</span>`
    : '<span class="mut">sem cotação da ponte</span>'),
    (e.querySelector(".lvg-ohlc").innerHTML = d
      ? `<span class="sm">${d.vivo ? '<b class="g">● ao vivo</b> · ' : ""}A ${c(d.o)} · M ${c(d.h)} · m ${c(d.l)} · F ${c(d.c)}</span>`
      : ""),
    (e.querySelector(".lvg-cv").innerHTML =
      LVG.busy && !l.length
        ? '<div class="sm mut" style="padding:30px 0;text-align:center">Carregando…</div>'
        : lvgSvg(o, LVG.tf, s, LVG.sel)));
  const p = LVG.meta,
    u = p && p.proxy;
  e.querySelector(".lvg-nota").innerHTML =
    (LVG.err ? `<div class="r">${esc(LVG.err)}</div>` : "") +
    (u
      ? `<div class="am">${esc(t)} não tem histórico gratuito: os candles são montados só com o preço do Profit desde que o app recebeu as cotações (deixe esta tela aberta para o gráfico ir crescendo).</div>`
      : "<div>Histórico: Yahoo Finance (com atraso de ~15 min). Candles com borda branca: montados agora com o preço do Profit, em tempo real.</div>") +
    (s.length
      ? "<div>Linhas: seus trades abertos e o sinal do radar de hoje.</div>"
      : "");
}
function lvgAbre(e) {
  ((LVG.tk = e), (LVG.sel = null), (LVG.hist = null), (LVG.meta = null));
  const t = document.getElementById("lvg");
  t && t.remove();
  const a = document.createElement("div");
  ((a.id = "lvg"),
    (a.dataset.noswipe = 1),
    (a.innerHTML = `<div class="fx-top"><button class="btn s ib" data-lvgx="1" aria-label="Fechar">✕</button><div style="flex:1;text-align:center"><b>${esc(e)}</b><div class="lvg-px sm"></div></div><button class="btn s" data-lvgtv="1">TV</button></div>
  <div class="seg lvg-tf">${Object.keys(LVG_TF)
    .map(
      (o) =>
        `<button class="${LVG.tf === o ? "on" : ""}" data-lvgtf="${o}">${LVG_NOME[o]}</button>`,
    )
    .join("")}</div>
  <div class="lvg-ohlc"></div><div class="lvg-cv"></div><div class="lvg-nota sm mut"></div>`),
    document.body.appendChild(a),
    (document.body.style.overflow = "hidden"),
    lvgDesenha(),
    lvgCarrega());
}
function lvgFecha() {
  const e = document.getElementById("lvg");
  (e && e.remove(), (document.body.style.overflow = ""));
}
if (
  (document.addEventListener("click", (e) => {
    const t = e.target.closest("#lvcb tr");
    if (t && t.querySelector("td b")) {
      const s = t
        .querySelector("td b")
        .textContent.replace(/[^A-Z0-9$]/gi, "")
        .toUpperCase();
      if (s) {
        lvgAbre(s);
        return;
      }
    }
    if (!document.getElementById("lvg")) return;
    let a;
    if (e.target.closest("[data-lvgx]")) {
      lvgFecha();
      return;
    }
    if ((a = e.target.closest("[data-lvgtf]"))) {
      LVG.tf = a.dataset.lvgtf;
      try {
        ls.set("diario-lvg-tf", LVG.tf);
      } catch {}
      ((LVG.sel = null),
        document
          .querySelectorAll("[data-lvgtf]")
          .forEach((s) => s.classList.toggle("on", s === a)),
        (LVG.hist = null),
        lvgCarrega());
      return;
    }
    if (e.target.closest("[data-lvgtv]")) {
      const s = LVG.tk;
      (lvgFecha(),
        typeof tvAbre == "function" &&
          tvAbre(
            s,
            /^[A-Z]{4}\d/.test(s) || /^(WIN|WDO|IND|DOL)/.test(s) ? "BR" : "US",
          ));
      return;
    }
    const o = e.target.closest(".lvg-svg");
    if (o) {
      const s = o.getBoundingClientRect(),
        n = ((e.clientX - s.left) / s.width) * 360,
        r = Math.floor((n - +o.dataset.pl) / +o.dataset.cw);
      ((LVG.sel = r >= 0 && r < +o.dataset.n ? r : null), lvgDesenha());
    }
  }),
  typeof lvcPaint == "function")
) {
  const e = lvcPaint;
  lvcPaint = function () {
    e.apply(this, arguments);
    try {
      (lvTicks(), document.getElementById("lvg") && lvgDesenha());
    } catch {}
  };
}
{
  const e = vLive;
  vLive = function () {
    return e
      .apply(this, arguments)
      .replace(
        '<div class="mut sm">Atualiza a cada ~3 s',
        '<div class="mut sm">📈 Toque num ativo para ver o gráfico (histórico + candle do Profit em tempo real). Atualiza a cada ~3 s',
      );
  };
}
(function () {
  const e = TraderStyles.slot("legacy-018");
  ((e.textContent = TraderStyles.css("legacy-018")), TraderStyles.mount(e));
})();
const SNT = {
  v: (() => {
    try {
      return ls.get("diario-snt") || null;
    } catch {
      return null;
    }
  })(),
  ts: 0,
  busy: 0,
  err: "",
  ab: null,
};
async function sntCarrega(e) {
  if (SNT.busy || (!e && SNT.v && Date.now() - SNT.ts < 10 * 6e4)) return;
  const t = cfg();
  if (!t) {
    ((SNT.err = "Configure o Supabase na aba Conta."), sntPaint());
    return;
  }
  ((SNT.busy = 1), (SNT.err = ""), sntPaint());
  try {
    const a = await fetch(t.url + "/functions/v1/sentimento", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: t.key },
        body: "{}",
      }),
      o = await a.json();
    if (!a.ok)
      throw new Error(
        a.status === 404
          ? 'Função "sentimento" não encontrada: publique-a no Supabase.'
          : o.error || "Erro " + a.status,
      );
    ((SNT.v = o), (SNT.ts = Date.now()));
    try {
      ls.set("diario-snt", o);
    } catch {}
  } catch (a) {
    SNT.err = String(a.message || a);
  }
  ((SNT.busy = 0), sntPaint());
}
const sntCor = (e) =>
  e == null
    ? "#7a808c"
    : e < 25
      ? "#dc3e26"
      : e < 45
        ? "#c69a49"
        : e <= 55
          ? "#b88c3a"
          : e <= 75
            ? "#39aa71"
            : "#2e8b5d";
function sntGauge(e) {
  const t = (n) => [
      110 + 90 * Math.cos(Math.PI * (1 - n)),
      112 - 90 * Math.sin(Math.PI * (1 - n)),
    ],
    [a, o] = t(e == null ? 0.5 : e / 100),
    s = (n, r, i) => {
      const [l, d] = t(n),
        [c, p] = t(r);
      return `<path d="M${l} ${d} A90 90 0 0 1 ${c} ${p}" stroke="${i}" stroke-width="16" fill="none" stroke-linecap="${n === 0 || r === 1 ? "round" : "butt"}"/>`;
    };
  return `<svg viewBox="0 0 220 134" class="snt-g" role="img" aria-label="Medidor ${e ?? "sem dado"}">${s(0, 0.25, "#dc3e26")}${s(0.25, 0.45, "#c69a49")}${s(0.45, 0.55, "#b88c3a")}${s(0.55, 0.75, "#39aa71")}${s(0.75, 1, "#2e8b5d")}
  <circle cx="${a}" cy="${o}" r="11" fill="var(--bg,#111)" stroke="${sntCor(e)}" stroke-width="5"/><text x="110" y="94" text-anchor="middle" font-size="40" font-weight="800" fill="var(--tx,#fff)">${e ?? "–"}</text>
  <text x="20" y="132" text-anchor="middle" font-size="10" fill="var(--mut,#9ca0a9)">0</text><text x="200" y="132" text-anchor="middle" font-size="10" fill="var(--mut,#9ca0a9)">100</text></svg>`;
}
function sntSpark(e) {
  const t = (e || []).filter((r) => r.v != null);
  if (t.length < 2) return "";
  const a = 300,
    o = 46,
    s = (r) => (r / (t.length - 1)) * a,
    n = (r) => o - 4 - (r / 100) * (o - 8);
  return `<svg viewBox="0 0 ${a} ${o}" class="snt-sp" preserveAspectRatio="none"><line x1="0" x2="${a}" y1="${n(50)}" y2="${n(50)}" stroke="var(--bd)" stroke-dasharray="3 3"/><polyline points="${t.map((r, i) => s(i) + "," + n(r.v)).join(" ")}" fill="none" stroke="${sntCor(t[t.length - 1].v)}" stroke-width="2"/></svg>`;
}
function sntLeitura(e, t) {
  if (e == null) return "";
  const a =
    t === "cripto"
      ? "cripto"
      : t === "eua"
        ? "bolsa americana"
        : "bolsa brasileira";
  return e < 25
    ? `Medo extremo na ${a}: quando todo mundo está vendendo, as quedas tendem a ficar exageradas. Não é sinal de compra sozinho: espere o seu setup confirmar e reduza a mão (a volatilidade está alta).`
    : e < 45
      ? `Medo na ${a}: o mercado está defensivo. Favoreça operações a favor da tendência curta e stops técnicos bem definidos.`
      : e <= 55
        ? "Neutro: o sentimento não ajuda nem atrapalha. Vale o seu plano e o gráfico."
        : e <= 75
          ? `Ganância na ${a}: tendência de alta costuma continuar, mas pullbacks ficam mais rasos. Cuidado com entradas atrasadas em rompimentos esticados.`
          : `Ganância extrema na ${a}: euforia. Proteja lucros, não aumente a mão no topo e desconfie de rompimentos sem volume.`;
}
function sntCard(e, t, a) {
  if (!a)
    return `<div class="card snt"><b>${t}</b><div class="sm mut" style="margin-top:6px">Sem dados agora.</div></div>`;
  const o = SNT.ab === e,
    s = (r, i) =>
      r == null || i == null
        ? ""
        : `<span class="${r - i >= 0 ? "g" : "r"}">${r - i >= 0 ? "+" : ""}${r - i}</span>`,
    n = a.data ? a.data.split("-").reverse().slice(0, 2).join("/") : "";
  return `<div class="card snt" data-sntab="${e}"><div class="top"><b>${t}</b><span class="sm mut">${n}</span></div>
  <div class="snt-wrap">${sntGauge(a.valor)}<div class="snt-rot" style="color:${sntCor(a.valor)}">${esc(a.rotulo || "")}</div></div>
  <div class="snt-cmp sm"><span>Ontem <b>${a.ontem ?? "–"}</b> ${s(a.valor, a.ontem)}</span><span>Semana <b>${a.semana ?? "–"}</b></span><span>Mês <b>${a.mes ?? "–"}</b></span></div>
  ${sntSpark(a.hist)}<div class="sm mut" style="text-align:right">últimos 30 dias</div>
  <div class="sm snt-lei">${esc(sntLeitura(a.valor, e))}</div>
  ${o && a.componentes && a.componentes.length ? `<div class="snt-comps">${a.componentes.map((r) => `<div class="snt-c"><div class="sm">${esc(r.nome)}</div><div class="snt-bar"><i style="width:${r.nota == null ? 0 : r.nota}%;background:${sntCor(r.nota)}"></i></div><div class="sm mut">${r.nota == null ? "sem dado" : r.nota + " · " + esc(r.leitura)}</div></div>`).join("")}</div>` : a.componentes && a.componentes.length ? '<div class="sm mut">Toque para ver o que compõe o índice.</div>' : ""}
  <div class="sm mut snt-fonte">Fonte: ${esc(a.fonte || "")}</div></div>`;
}
function vSent(e) {
  const t = SNT.v || {};
  return `<div class="card"><div class="top"><b>Medo e Ganância</b><button class="btn s" data-snt="rf">${SNT.busy ? "…" : "↻ Atualizar"}</button></div>${e || ""}<div class="sm mut">Termômetro do humor do mercado de 0 (medo extremo) a 100 (ganância extrema). Use como contexto: os extremos costumam marcar exageros.</div>${SNT.err ? `<div class="sm r" style="margin-top:6px">${esc(SNT.err)}</div>` : ""}</div>
  <div id="sntbox">${sntCard("b3", "🇧🇷 B3", t.b3)}${sntCard("eua", "🇺🇸 EUA", t.eua)}${sntCard("cripto", "₿ Cripto", t.cripto)}</div>
  ${t.gerado ? `<div class="sm mut">Atualizado às ${hm(Date.parse(t.gerado))}. B3: índice calculado pelo app (não existe um índice oficial da B3). Cripto: dados de alternative.me.</div>` : ""}`;
}
function sntPaint() {
  tab !== "mercado" || MKT.tab !== "se" || render();
}
{
  const e = vMercado;
  vMercado = function () {
    if (MKT.tab !== "se") return e.apply(this, arguments);
    setTimeout(() => sntCarrega(), 0);
    const t = MKT.tab,
      a =
        '<div class="seg mk-seg" style="margin:10px 0">' +
        mkBtn("tab", "ag", "Agenda", t === "ag") +
        mkBtn("tab", "nt", "Notícias", t === "nt") +
        mkBtn("tab", "cot", "Cotações", t === "cot") +
        mkBtn("tab", "se", "Sentimento", t === "se") +
        mkBtn("tab", "al", "Alertas", t === "al") +
        "</div>";
    return vSent(a);
  };
}
(document.addEventListener("click", (e) => {
  if (e.target.closest('[data-snt="rf"]')) {
    sntCarrega(!0);
    return;
  }
  const t = e.target.closest("[data-sntab]");
  t &&
    !e.target.closest("a,button") &&
    ((SNT.ab = SNT.ab === t.dataset.sntab ? null : t.dataset.sntab), render());
}),
  (function () {
    const e = TraderStyles.slot("legacy-019");
    ((e.textContent = TraderStyles.css("legacy-019")), TraderStyles.mount(e));
  })());
const MDO_INFO = {
    "^BVSP": {
      o: "Principal índice da B3: carteira com as ações mais negociadas do Brasil.",
      p: 3,
      m: "Ibovespa e WIN",
      s: "O mini índice (WIN) acompanha. Fluxo comprador; tendência de alta favorece compras em pullback.",
      b: "WIN cai junto. Aversão a risco local; tendência de baixa favorece vendas em repique.",
    },
    "^GSPC": {
      o: "As 500 maiores empresas dos EUA. Termômetro do apetite por risco no mundo.",
      p: 3,
      m: "Ibovespa, WIN e dólar",
      s: "Apetite por risco: estrangeiro compra emergentes, Ibovespa tende a subir e o dólar a cair.",
      b: "Aversão a risco: estrangeiro sai de emergentes, Ibovespa pressionado e dólar (WDO) sobe.",
    },
    "^IXIC": {
      o: "Bolsa de tecnologia dos EUA. Muito sensível aos juros americanos.",
      p: 2,
      m: "Humor global",
      s: "Juros americanos aliviando e apetite por risco: ajuda o humor das bolsas.",
      b: "Geralmente juros americanos subindo: pesa em bolsas e emergentes.",
    },
    "^DJI": {
      o: "As 30 maiores empresas tradicionais dos EUA.",
      p: 1,
      m: "Humor global",
      s: "Confirma apetite por risco quando acompanha o S&P.",
      b: "Confirma aversão a risco quando acompanha o S&P.",
    },
    "^GDAXI": {
      o: "Bolsa da Alemanha. A Europa abre antes do Brasil e mostra o humor da manhã.",
      p: 2,
      m: "Abertura da B3",
      s: "Manhã positiva lá fora: abertura da B3 tende a ser melhor.",
      b: "Manhã negativa: abertura da B3 tende a ser pressionada.",
    },
    "^FTSE": {
      o: "Bolsa de Londres, cheia de mineradoras e petroleiras.",
      p: 1,
      m: "Commodities",
      s: "Commodities fortes: ajuda VALE e PETR.",
      b: "Commodities fracas: pesa em VALE e PETR.",
    },
    "^STOXX50E": {
      o: "As 50 maiores empresas da zona do euro.",
      p: 2,
      m: "Abertura da B3",
      s: "Humor europeu positivo antes da abertura.",
      b: "Humor europeu negativo antes da abertura.",
    },
    "^N225": {
      o: "Bolsa do Japão. Fecha antes da B3 abrir.",
      p: 1,
      m: "Humor asiático",
      s: "Ásia positiva na madrugada.",
      b: "Ásia negativa; queda forte com iene subindo indica aversão a risco global.",
    },
    "^HSI": {
      o: "Bolsa de Hong Kong, a vitrine da China para o mundo.",
      p: 2,
      m: "Minério, VALE e siderúrgicas",
      s: "China melhor: mais demanda por minério e aço, bom para VALE3 e siderúrgicas.",
      b: "China pior: pesa em minério, VALE3 e siderúrgicas.",
    },
    "000001.SS": {
      o: "Bolsa de Xangai (China continental). Reage a estímulos do governo chinês.",
      p: 2,
      m: "Minério e commodities",
      s: "Estímulo ou otimismo com a China: bom para commodities e para a B3.",
      b: "Pessimismo com a China: ruim para commodities.",
    },
    "ES=F": {
      o: "Contrato futuro do S&P 500. Negocia quase 24h e mostra como Nova York deve abrir.",
      p: 3,
      m: "Abertura da B3 e WIN",
      s: "Antes das 10h: indica abertura mais positiva para o WIN.",
      b: "Antes das 10h: indica abertura pressionada para o WIN.",
    },
    "NQ=F": {
      o: "Contrato futuro da Nasdaq. Mostra o humor com tecnologia e juros antes de NY abrir.",
      p: 2,
      m: "Humor global",
      s: "Apetite por risco na madrugada.",
      b: "Aversão a risco na madrugada.",
    },
    EWZ: {
      o: "Fundo de ações brasileiras negociado em Nova York, em dólar. Mostra o que o estrangeiro fez com o Brasil.",
      p: 3,
      m: "Abertura do Ibovespa e WIN",
      s: "Estrangeiro comprando Brasil: abertura tende a ser positiva.",
      b: "Estrangeiro vendendo Brasil: abertura tende a ser negativa.",
    },
    "BRL=X": {
      o: "Quantos reais custa um dólar (dólar à vista).",
      p: 3,
      m: "WDO, Ibovespa e exportadoras",
      s: "Real se desvalorizando: WDO sobe; costuma vir com Ibovespa caindo. Exportadoras (VALE, SUZB, EMBR) se beneficiam.",
      b: "Real se valorizando: WDO cai; bom para o Ibovespa, varejo e aéreas.",
    },
    "DX-Y.NYB": {
      o: "Índice do dólar contra seis moedas fortes (euro, iene, libra e outras).",
      p: 3,
      m: "WDO e emergentes",
      s: "Dólar forte no mundo: pressiona moedas emergentes (WDO tende a subir) e as bolsas emergentes.",
      b: "Dólar fraco no mundo: alívio para o real e para a B3.",
    },
    "EURUSD=X": {
      o: "Euro contra dólar. É o maior peso do DXY e anda ao contrário dele.",
      p: 2,
      m: "Dólar global",
      s: "Dólar enfraquecendo no mundo: bom para emergentes.",
      b: "Dólar se fortalecendo no mundo: ruim para emergentes.",
    },
    "JPY=X": {
      o: "Quantos ienes custa um dólar.",
      p: 2,
      m: "Apetite por risco global",
      s: "Iene fraco: ambiente de apetite por risco (operações de carry trade).",
      b: "Queda forte = iene se valorizando: desmonte de carry trade e aversão a risco global, ruim para emergentes.",
    },
    "GBPUSD=X": {
      o: "Libra esterlina contra dólar.",
      p: 1,
      m: "Dólar global",
      s: "Dólar mais fraco no mundo.",
      b: "Dólar mais forte no mundo.",
    },
    "AUDUSD=X": {
      o: "Dólar australiano: moeda ligada a commodities e à China.",
      p: 2,
      m: "Minério e VALE",
      s: "Commodities e China fortes: bom para VALE3.",
      b: "Commodities e China fracas: ruim para VALE3.",
    },
    "CNY=X": {
      o: "Quantos yuans custa um dólar.",
      p: 2,
      m: "Commodities",
      s: "Yuan se desvalorizando: sinal de economia chinesa fraca, ruim para commodities.",
      b: "Yuan se valorizando: China mais forte, bom para commodities.",
    },
    "MXN=X": {
      o: "Peso mexicano contra dólar: a moeda emergente que mais anda junto com o real.",
      p: 2,
      m: "WDO",
      s: "Emergentes sob pressão: o real tende a acompanhar (WDO sobe).",
      b: "Alívio para emergentes: o real tende a acompanhar (WDO cai).",
    },
    "BZ=F": {
      o: "Petróleo Brent, a referência de preço da Petrobras.",
      p: 3,
      m: "PETR4, PRIO3 e inflação",
      s: "PETR4 e PRIO3 sobem (peso grande no Ibovespa). Também pressiona a inflação e os juros futuros.",
      b: "Petroleiras caem; alívio para a inflação.",
    },
    "CL=F": {
      o: "Petróleo WTI, a referência americana.",
      p: 2,
      m: "Petroleiras",
      s: "Mesma lógica do Brent: bom para petroleiras.",
      b: "Ruim para petroleiras; alívio para a inflação.",
    },
    "DCE:I": {
      o: "Minério de ferro negociado na bolsa de Dalian (China), em yuan por tonelada. A China é a maior compradora do minério da Vale, e Dalian negocia de madrugada no horário do Brasil: na pré-abertura já mostra como a China reagiu. Cotação do Sina Finance (contrato contínuo I0).",
      p: 3,
      m: "VALE3, CSNA3, GGBR4 e CMIN3",
      s: "China pagando mais pelo minério: VALE3 e siderúrgicas tendem a abrir em alta e ajudar o Ibovespa.",
      b: "Minério caindo em Dalian: VALE3 e siderúrgicas pressionadas na abertura.",
    },
    "TIO=F": {
      o: "Minério de ferro, o principal produto da Vale (uma das maiores ações do Ibovespa).",
      p: 3,
      m: "VALE3, CSNA3, GGBR4 e CMIN3",
      s: "VALE3 e siderúrgicas sobem e ajudam o Ibovespa.",
      b: "VALE3 e siderúrgicas caem e pesam no Ibovespa.",
    },
    "GC=F": {
      o: "Ouro: proteção em momentos de medo e contra o dólar.",
      p: 1,
      m: "Sentimento",
      s: "Alta forte: medo no mercado ou dólar fraco.",
      b: "Queda: apetite por risco.",
    },
    "SI=F": {
      o: "Prata: metal de proteção e de uso industrial.",
      p: 1,
      m: "Sentimento",
      s: "Segue o ouro, com mais volatilidade.",
      b: "Segue o ouro, com mais volatilidade.",
    },
    "HG=F": {
      o: 'Cobre, o "Dr. Copper": termômetro do crescimento da economia global.',
      p: 2,
      m: "Emergentes e commodities",
      s: "Expectativa de crescimento global: bom para emergentes.",
      b: "Expectativa de desaceleração global.",
    },
    "ZS=F": {
      o: "Soja: o principal produto do agronegócio brasileiro.",
      p: 1,
      m: "Agro e real",
      s: "Mais dólares entrando no Brasil (real mais forte) e bom para o agro (SLCE3).",
      b: "Menos dólares entrando; ruim para o agro.",
    },
    "ZC=F": {
      o: "Milho.",
      p: 1,
      m: "Inflação de alimentos",
      s: "Pressiona a inflação de alimentos.",
      b: "Alivia a inflação de alimentos.",
    },
    "KC=F": {
      o: "Café: o Brasil é o maior produtor do mundo.",
      p: 1,
      m: "Agro e inflação",
      s: "Bom para exportadores; pressiona a inflação.",
      b: "Ruim para exportadores; alivia a inflação.",
    },
    "^TNX": {
      o: 'Juro dos títulos de 10 anos do governo americano: o "preço do dinheiro" no mundo.',
      p: 3,
      m: "Dólar, DI e bolsas",
      s: "Dinheiro volta para os EUA: dólar sobe, DI sobe, bolsas (principalmente emergentes e tecnologia) caem.",
      b: "Alívio: bom para bolsas e emergentes; dólar e DI tendem a cair.",
    },
    "^FVX": {
      o: "Juro dos títulos de 5 anos dos EUA: mostra o que o mercado espera do Fed.",
      p: 2,
      m: "Dólar e juros",
      s: "Mercado espera Fed mais duro: dólar forte.",
      b: "Mercado espera cortes do Fed: alívio para emergentes.",
    },
    "BTC-USD": {
      o: "Bitcoin: termômetro do apetite por risco especulativo.",
      p: 1,
      m: "Sentimento (HASH11)",
      s: "Apetite por risco alto.",
      b: "Aversão a risco; quedas fortes às vezes antecipam estresse.",
    },
    "SOL-USD": {
      o: "Solana: cripto de uma rede rápida e barata, muito usada por aplicativos e memecoins. Bem mais volátil que o Bitcoin.",
      p: 1,
      m: "Sentimento cripto",
      s: "Apetite por risco em cripto (costuma subir mais que o BTC na alta).",
      b: "Aversão a risco em cripto (costuma cair mais que o BTC na queda).",
    },
    "XRP-USD": {
      o: "XRP: cripto ligada a pagamentos internacionais. Reage muito a notícias regulatórias nos EUA.",
      p: 1,
      m: "Sentimento cripto",
      s: "Apetite por risco ou notícia regulatória boa.",
      b: "Aversão a risco ou notícia regulatória ruim.",
    },
    "BNB-USD": {
      o: "BNB: cripto da corretora Binance, a maior do mundo.",
      p: 1,
      m: "Sentimento cripto",
      s: "Apetite por risco em cripto.",
      b: "Aversão a risco em cripto ou notícia ruim sobre a Binance.",
    },
    "ETH-USD": {
      o: "Ethereum, a segunda maior cripto.",
      p: 1,
      m: "Sentimento",
      s: "Apetite por risco.",
      b: "Aversão a risco.",
    },
    "Selic meta": {
      o: "Taxa básica de juros, definida pelo Copom a cada 45 dias.",
      p: 3,
      m: "DI, Ibovespa e dólar",
      s: "Alta ou alta acima do esperado: DI sobe, bolsa cai (renda fixa fica mais atraente), real tende a se valorizar.",
      b: "Corte ou corte maior que o esperado: bolsa sobe (varejo, construção e bancos médios), DI cai.",
    },
    "IPCA 12 meses": {
      o: "Inflação oficial acumulada em 12 meses (IBGE). A meta é 3%.",
      p: 3,
      m: "DI e Ibovespa",
      s: "Acima do esperado: mais chance de juros altos por mais tempo; DI sobe e o Ibovespa cai.",
      b: "Abaixo do esperado: abre espaço para cortes; DI cai e a bolsa sobe.",
    },
    "IPCA do mês": {
      o: "Inflação oficial do mês. Sai às 9h e mexe forte no DI e no WIN no dia da divulgação.",
      p: 3,
      m: "DI e WIN no dia",
      s: "Acima do consenso: DI dispara e o WIN costuma cair logo na abertura.",
      b: "Abaixo do consenso: DI cai e o WIN costuma subir.",
    },
    "Desemprego (PNAD)": {
      o: "Taxa de desocupação medida pelo IBGE (trimestre móvel).",
      p: 2,
      m: "Juros e varejo",
      s: "Desemprego maior: economia desacelerando; ajuda a expectativa de cortes, mas pesa no varejo.",
      b: "Desemprego menor: economia aquecida, pressão sobre a inflação e juros altos por mais tempo.",
    },
    "Dívida bruta / PIB": {
      o: "Tamanho da dívida do governo em relação ao PIB: o termômetro do risco fiscal.",
      p: 2,
      m: "DI longo, dólar e bolsa",
      s: "Risco fiscal maior: DI longo sobe, real se desvaloriza e a bolsa fica pressionada.",
      b: "Alívio fiscal: bom para juros longos, real e bolsa.",
    },
    "Atividade (IBC-Br)": {
      o: 'Índice do Banco Central que funciona como uma "prévia do PIB" mensal.',
      p: 2,
      m: "Bolsa e juros",
      s: "Acima do esperado: economia forte, bom para lucros das empresas, mas pressiona inflação e juros.",
      b: "Abaixo do esperado: desaceleração; aumenta a expectativa de cortes de juros.",
    },
    "Dólar PTAX": {
      o: "Dólar oficial calculado pelo Banco Central (média do dia). É a referência de liquidação do WDO.",
      p: 2,
      m: "WDO no vencimento",
      s: "Real mais fraco na média do dia.",
      b: "Real mais forte na média do dia.",
    },
    "Focus:IPCA": {
      o: "Inflação que o mercado espera para o ano (pesquisa Focus do Banco Central, toda segunda).",
      p: 3,
      m: "DI e Ibovespa",
      s: "Expectativa subindo (desancorando): Copom tende a ser mais duro; DI sobe, bolsa cai.",
      b: "Expectativa caindo: abre espaço para cortes de juros; bom para a bolsa.",
    },
    "Focus:PIB Total": {
      o: "Crescimento do PIB esperado pelo mercado para o ano.",
      p: 2,
      m: "Bolsa (empresas cíclicas)",
      s: "Mais crescimento esperado: lucros maiores, bom para cíclicas.",
      b: "Menos crescimento esperado: ruim para cíclicas.",
    },
    "Focus:Câmbio": {
      o: "Dólar esperado pelo mercado para o fim do ano.",
      p: 2,
      m: "WDO e inflação",
      s: "Real mais fraco esperado: inflação importada e pressão sobre os juros.",
      b: "Real mais forte esperado: alívio para a inflação.",
    },
    "Focus:Selic": {
      o: "Selic esperada pelo mercado para o fim do ano.",
      p: 3,
      m: "DI e Ibovespa",
      s: "Juros mais altos esperados: ruim para a bolsa.",
      b: "Juros mais baixos esperados: bom para a bolsa.",
    },
  },
  MDO_PESO = { 3: ["Alto", "r"], 2: ["Médio", "am"], 1: ["Baixo", "mut"] };
