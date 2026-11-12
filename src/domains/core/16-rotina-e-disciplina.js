document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("#sh [data-setup-pick]");
  !t ||
    !T ||
    ((T.setup = t.dataset.setupPick), T.chk || (T.chk = {}), showSheet());
});
const GATE_D = () => loc().slice(0, 10),
  gateHoje = (e) =>
    S.trades.filter(
      (t) =>
        String(t.dt || "").slice(0, 10) === e ||
        String(t.dtx || "").slice(0, 10) === e,
    ),
  gateTxt = (e) => esc(String(e || ""));
function gateHtml(e) {
  return e.tipo === "manha"
    ? `<div class="gc"><div class="sm mut">☀️ Antes de operar</div><h2>Checklist de regras de hoje</h2><p class="sm">Até as 17h o app fica travado até você marcar as regras de hoje. Marque cada uma que leu e vai seguir.</p>${e.R.map((t) => `<label class="gi"><input type="checkbox" data-gate-chk="${gateTxt(t.id)}"${e.c[t.id] ? " checked" : ""}><span>${gateTxt(t.t)}</span></label>`).join("")}<div class="sm mut" style="margin-top:8px">Faltam ${e.pend.length} de ${e.R.length}.</div></div>`
    : `<div class="gc"><div class="sm mut">🌙 Depois das 17h</div><h2>Diário de pós-operação</h2><p class="sm">Envie os trades de hoje do Profit (ponte ou CSV em Ferramentas → Importar) e confira cada um. Toda operação precisa da foto da entrada; as encerradas também precisam da foto da saída.</p>${
        e.T0.length
          ? e.T0.map((t) => {
              const a = e.falta.find((o) => o.t === t);
              return `<div class="gi"><div style="flex:1;min-width:0"><b>${gateTxt(t.ativo || "?")}</b> <span class="sm mut">${gateTxt(t.setup || "")}</span>${a ? `<div class="sm r">${gateTxt(a.motivo)}</div>` : '<div class="sm g">Completo</div>'}</div>${a ? `<button type="button" class="btn s" data-gate-edit="${gateTxt(t.id)}">Corrigir</button>` : ""}</div>`;
            }).join("")
          : '<div class="sm mut">Nenhum trade registrado hoje.</div>'
      }<button type="button" class="gb" data-gate-ok="1"${e.falta.length ? " disabled" : ""}>${e.falta.length ? "Corrija " + e.falta.length + " trade(s) para liberar" : "Diário de hoje conferido"}</button></div>`;
}
function gateAtualiza() {
  let e = null;
  try {
    e = gateEstado();
  } catch {}
  let t = document.getElementById("gateov");
  if (!e || (typeof T < "u" && T)) {
    t && t.remove();
    return;
  }
  t ||
    ((t = document.createElement("div")),
    (t.id = "gateov"),
    document.body.appendChild(t));
  const a = gateHtml(e);
  t.dataset.h !== a && ((t.dataset.h = a), (t.innerHTML = a));
}
(document.addEventListener("change", (e) => {
  var t;
  const a = e.target.closest && e.target.closest("#gateov [data-gate-chk]");
  if (!a) return;
  const o = GATE_D(),
    s = (t = S.days)[o] ?? (t[o] = { chk: {} });
  (((s.chk ?? (s.chk = {}))[a.dataset.gateChk] = a.checked),
    (s.u = Date.now()),
    save(),
    gateAtualiza());
}),
  document.addEventListener("click", (e) => {
    var t;
    const a = e.target.closest && e.target.closest("#gateov [data-gate-ok]");
    if (a) {
      if (a.disabled) return;
      const s = GATE_D(),
        n = (t = S.days)[s] ?? (t[s] = { chk: {} });
      ((n.posop = Date.now()),
        (n.u = Date.now()),
        save(),
        gateAtualiza(),
        toast("Diário de hoje conferido. Bom descanso."));
      return;
    }
    const o = e.target.closest && e.target.closest("#gateov [data-gate-edit]");
    if (o) {
      const s = S.trades.find((n) => n.id === o.dataset.gateEdit);
      s &&
        ((AUTO = 0),
        (isNew = 0),
        (T = { ...s }),
        (orig = { pin: T.pin, pout: T.pout, pplan: T.pplan }),
        showSheet());
    }
  }));
{
  const e = showSheet;
  showSheet = function () {
    e.apply(this, arguments);
    try {
      (errosAplica(), setupsAplica(), gateAtualiza());
    } catch {}
  };
}
{
  const e = render;
  render = function () {
    e.apply(this, arguments);
    try {
      gateAtualiza();
    } catch {}
  };
}
(setInterval(() => {
  try {
    gateAtualiza();
  } catch {}
}, 6e4),
  setTimeout(() => {
    try {
      gateAtualiza();
    } catch {}
  }, 1500));
const CSV_NOME = {
  dt: "Day trade",
  sw: "Swing trade",
  op: "Opções",
  ex: "EUA e Forex",
  all: "Todos os trades",
};
function csvEscolha() {
  const e = modAtual(),
    t = ["dt", "sw", "op", "ex"].includes(e) ? e : null,
    a = (s, n, r) =>
      `<button type="button" class="btn${r ? "" : " s"}" data-csvm="${s}">${n}</button>`;
  let o = document.getElementById("csvch");
  (o && o.remove(),
    (o = document.createElement("div")),
    (o.id = "csvch"),
    (o.innerHTML = `<div class="csvc"><h2>Exportar CSV de quê?</h2><p class="sm mut">Escolha uma modalidade para o arquivo não vir misturado.</p><div class="csvg">${t ? a(t, "Só " + CSV_NOME[t] + " (aba atual)", 1) : ""}${[
      "dt",
      "sw",
      "op",
      "ex",
    ]
      .filter((s) => s !== t)
      .map((s) => a(s, "Só " + CSV_NOME[s], 0))
      .join(
        "",
      )}${a("all", CSV_NOME.all, 0)}</div><button type="button" class="btn s" data-csvm="x" style="width:100%">Cancelar</button></div>`),
    document.body.appendChild(o));
}
{
  const e = csv;
  csv = async function (t) {
    if (t === void 0) {
      csvEscolha();
      return;
    }
    if (t === "x") return;
    const a = S.trades,
      o = saveFile;
    (t !== "all" && (S.trades = a.filter((s) => modDe(s) === t)),
      (saveFile = function (s, n, r) {
        return o(t === "all" ? s : s.replace(".csv", "-" + t + ".csv"), n, r);
      }));
    try {
      return await e();
    } finally {
      ((S.trades = a), (saveFile = o));
    }
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("#csvch [data-csvm]");
  if (!t) return;
  const a = t.dataset.csvm,
    o = document.getElementById("csvch");
  (o && o.remove(), a !== "x" && csv(a));
});
{
  const e = TraderStyles.slot("legacy-086");
  ((e.id = "diario158"),
    (e.textContent = TraderStyles.css("legacy-086")),
    TraderStyles.mount(e));
}
function jrSpark(e, t) {
  e = (e || []).filter(
    (u) =>
      u && [1, 2, 3, 4].every((m) => typeof u[m] == "number" && isFinite(u[m])),
  );
  const a = 320,
    o = 110,
    s = 6,
    n = e.length;
  if (n < 2) return "";
  const r = Math.max(...e.map((u) => u[2] / t)),
    i = Math.min(...e.map((u) => u[3] / t)),
    l = (u) => s + ((r - u) * (o - 2 * s)) / Math.max(1e-9, r - i),
    d = (a - 2 * s) / n,
    c = Math.max(1.2, Math.min(9, d * 0.68));
  let p = "";
  return (
    e.forEach((u, m) => {
      const f = u[1] / t,
        x = u[2] / t,
        v = u[3] / t,
        g = u[4] / t,
        h = s + d * (m + 0.5),
        b = g >= f ? "var(--g)" : "var(--r)",
        y = l(f),
        j = l(g),
        k = Math.min(y, j),
        A = Math.max(1, Math.abs(j - y));
      ((p += `<line x1="${h.toFixed(1)}" x2="${h.toFixed(1)}" y1="${l(x).toFixed(1)}" y2="${l(v).toFixed(1)}" stroke="${b}" stroke-width="1"/>`),
        (p += `<rect x="${(h - c / 2).toFixed(1)}" y="${k.toFixed(1)}" width="${c.toFixed(1)}" height="${A.toFixed(1)}" fill="${b}"/>`));
    }),
    `<svg viewBox="0 0 ${a} ${o}" preserveAspectRatio="none" style="width:100%;height:110px;display:block" role="img" aria-label="Gráfico de velas do dia">${p}</svg>`
  );
}
JRN.varr = JRN.varr || null;
async function varrCarrega(e) {
  if (JRN.varrBusy) return;
  const t = loc().slice(0, 10),
    a = JRN.varr;
  if (
    !(!e && a && a.dia === t && !a.parcial) &&
    !(!e && JRN.varrTs && Date.now() - JRN.varrTs < 10 * 6e4)
  ) {
    ((JRN.varrBusy = 1), (JRN.varrTs = Date.now()), (JRN.varrErr = ""));
    try {
      const o = await anxCall({ modo: "varredura", force: !!e });
      o && o.erro ? (JRN.varrErr = o.erro) : o && o.ranking && (JRN.varr = o);
    } catch (o) {
      JRN.varrErr = /modo|desconhecid|404/i.test(String(o.message || o))
        ? 'Para ver a varredura, publique a função "analise" nova no Supabase.'
        : String(o.message || o);
    }
    ((JRN.varrBusy = 0), jrPinta());
  }
}
function varrHtml() {
  const e = JRN.varr;
  if (!e || !e.ranking || !e.ranking.length)
    return `<section class="jrsec"><h3>Oportunidades fundamentalistas</h3><div class="sm mut">${JRN.varrBusy ? "Calculando o valor justo das ações do Ibovespa… (pode levar um minuto)" : esc(JRN.varrErr || "Varredura de hoje ainda não saiu.")}</div></section>`;
  const t = (s) =>
      s == null
        ? "–"
        : Number(s).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
    a = (s) =>
      s == null
        ? "–"
        : (s >= 0 ? "+" : "") + Number(s).toFixed(1).replace(".", ",") + "%",
    o = e.ranking
      .map(
        (s) =>
          `<tr><td><b>${esc(s.tk)}</b></td><td>${t(s.preco)}</td><td>${t(s.graham)}</td><td>${t(s.bazin)}</td><td class="g"><b>${a(s.potencial_medio_pct)}</b></td></tr>`,
      )
      .join("");
  return `<section class="jrsec"><h3>Oportunidades fundamentalistas</h3>
${e.resumo ? `<p class="jrtxt">${esc(e.resumo)}</p>` : ""}
<div class="jrvtab"><table><thead><tr><th>Ação</th><th>Preço</th><th>Graham</th><th>Bazin</th><th>Potencial</th></tr></thead><tbody>${o}</tbody></table></div>
${(e.destaques || []).length ? `<ul class="jrpl">${e.destaques.map((s) => `<li><b>${esc(s.tk)}</b>: ${esc(s.leitura)}</li>`).join("")}</ul>` : ""}
<div class="sm mut">${esc(e.metodo || "")}. Triagem por números, não é recomendação de compra. Lista de ${e.universo} ações; analisadas ${e.analisadas}${e.parcial ? " (parcial, atualiza sozinho)" : ""}.</div></section>`;
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      if (JRN.v && JRN.v.manchete) {
        const a = loc().slice(0, 10);
        (!JRN.varr || JRN.varr.dia !== a || JRN.varr.parcial) &&
          setTimeout(() => varrCarrega(!1), 0);
        const o = t.indexOf('<section class="jrsec"><h3>Agenda</h3>'),
          s = varrHtml();
        o > 0 ? (t = t.slice(0, o) + s + t.slice(o)) : (t += s);
      }
    } catch {}
    return t;
  };
}
function profitSemFoto() {
  return (S.trades || []).filter(
    (e) => e.orig === "profit" && (!e.pin || (numN(e.exit) != null && !e.pout)),
  );
}
function profitAtualiza() {
  let e = document.getElementById("profitalert");
  const t = profitSemFoto();
  if (!t.length || (typeof T < "u" && T)) {
    e && e.remove();
    return;
  }
  const a = `<div class="pfa-t">⚠️ ${t.length} ${t.length > 1 ? "operações importadas do Profit estão" : "operação importada do Profit está"} sem foto</div><div class="sm">Anexe a foto da entrada e, se a operação já fechou, a da saída. Sem foto, o diário do fim do dia fica travado.</div><div class="pfa-l">${t
    .slice(0, 6)
    .map(
      (o) =>
        `<button class="btn s" data-pfa="${esc(o.id)}">${esc(o.ativo || "?")} · ${esc(String(o.dt || "").slice(0, 10))}</button>`,
    )
    .join(
      "",
    )}${t.length > 6 ? `<span class="sm mut">e mais ${t.length - 6}</span>` : ""}</div>`;
  (e ||
    ((e = document.createElement("div")),
    (e.id = "profitalert"),
    (document.getElementById("app") || document.body).prepend(e)),
    e.dataset.h !== a && ((e.dataset.h = a), (e.innerHTML = a)));
}
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("[data-pfa]");
  if (!t) return;
  const a = S.trades.find((o) => o.id === t.dataset.pfa);
  a &&
    ((AUTO = 0),
    (isNew = 0),
    (T = { ...a }),
    (orig = { pin: T.pin, pout: T.pout, pplan: T.pplan }),
    showSheet());
});
{
  const e = render;
  render = function () {
    e.apply(this, arguments);
    try {
      profitAtualiza();
    } catch {}
  };
}
{
  const e = TraderStyles.slot("legacy-087");
  ((e.id = "diario159"),
    (e.textContent = TraderStyles.css("legacy-087")),
    TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v231";
const GATE_PLANO = ["p_limite", "p_meta", "p_stop"],
  GATE_MENT = [
    ["m_umdia", "Um dia de cada vez."],
    ["m_erro", "Um trade incorreto não significa que sou incorreto."],
    ["m_aprend", "Encaro o mercado com a humildade de um aprendiz."],
    [
      "m_maior",
      "Uma operação vencedora não me dá direito a aumentar o risco na próxima.",
    ],
  ],
  GATE_NOME = {
    estado: "o estado (1 a 5)",
    p_limite: "o limite de perda do dia",
    p_meta: "a meta do dia",
    p_stop: "a saída de cada operação",
  },
  GATE_DICAS = [
    [
      "Antes de entrar em qualquer operação, saiba onde sairá, no ganho ou na perda.",
    ],
    ["Estabeleça sua estimativa de gain e limite de loss."],
    ["Não coloque dinheiro de sua sobrevivência no mercado."],
    ["Aceite e aprenda que suas emoções fazem parte da profissão."],
    ["Ganhar dinheiro é mais importante que estar certo."],
    ["Dinheiro é um objetivo, mas não a medida do sucesso."],
    [
      "Um trade incorreto não significa que você é incorreto, perdedor, incompetente...",
    ],
    ["Seja flexível com suas decisões operacionais, pois o mercado muda."],
  ],
  normT = (e) =>
    String(e || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
function regrasUnicas() {
  const e = new Set();
  return (S.rules || []).filter((t) => {
    const a = normT(t.t);
    return !a || e.has(a) ? !1 : (e.add(a), !0);
  });
}
function ajusta160() {
  if (!S || !S.ax || S.ax["chk.v235"] || !Array.isArray(S.rules)) return;
  S.ax["chk.v235"] = 1;
  const e = regrasUnicas();
  e.length !== S.rules.length && ((S.rules = e), save());
}
{
  const e = render;
  render = function () {
    return (
      S && S.ax && !S.ax["chk.v235"] && ajusta160(),
      e.apply(this, arguments)
    );
  };
}
function gateEstado() {
  const e = new Date(),
    t = e.getDay(),
    a = e.getHours();
  if (t === 0 || t === 6) return null;
  if (a >= 8 && a < 17) {
    const o = GATE_D(),
      s = S.days[o] || {},
      n = s.chk || {},
      r = s.cl || {},
      i = [...(s.estado ? [] : ["estado"]), ...GATE_PLANO.filter((l) => !r[l])];
    return i.length ? { tipo: "manha", falta: i, dia: s, c: n, cl: r } : null;
  }
  return gateEstado158(a);
}
function gateEstado158(e) {
  if (e >= 17) {
    const t = GATE_D();
    if ((S.days[t] || {}).posop) return null;
    const a = gateHoje(t),
      o = a
        .map((s) => ({
          t: s,
          motivo: s.pin
            ? numN(s.exit) != null && !s.pout
              ? "falta a foto da saída"
              : ""
            : "falta a foto da entrada",
        }))
        .filter((s) => s.motivo);
    return { tipo: "tarde", T0: a, falta: o };
  }
  return null;
}
function gateManhaHtml(e) {
  const t = e.c || {},
    a = e.cl || {},
    o = e.dia.estado || 0,
    s = GATE_DICAS[new Date().getDate() % GATE_DICAS.length][0],
    n = ["", "Muito mal", "Mal", "Neutro", "Bem", "Muito bem"],
    r = [1, 2, 3, 4, 5]
      .map(
        (d) =>
          `<button type="button" class="gest${o === d ? " on" : ""}" data-gate-est="${d}">${d}<small>${n[d]}</small></button>`,
      )
      .join(""),
    i = (d, c, p) =>
      `<label class="gchk"><input type="checkbox" ${d}="${c}"${(d === "data-gcl" ? a[c] : t[c]) ? " checked" : ""}><span>${esc(p)}</span></label>`,
    l = regrasUnicas();
  return `<div class="gc"><div class="sm mut">☀️ Antes de operar</div><h2>Checklist de hoje</h2>
<p class="sm">O preparo obrigatório é exigido ao iniciar um registro operacional. Consultas continuam disponíveis. Regras pessoais e mentalidade são opcionais.</p>
<div class="gsec"><b>1. Como estou agora? <span class="sm mut">(obrigatório)</span></b><div class="gest-l">${r}</div></div>
<div class="gsec"><b>2. Plano de hoje <span class="sm mut">(obrigatório)</span></b>
${i("data-gcl", "p_limite", "Defini o limite de perda do dia, em vezes o risco")}
${i("data-gcl", "p_meta", "Defini a meta do dia, ou o ganho que já me basta")}
${i("data-gcl", "p_stop", "Sei onde saio de cada operação: stop e alvo")}</div>
${l.length ? `<div class="gsec"><b>3. Minhas regras <span class="sm mut">(opcional)</span></b>${l.map((d) => i("data-gate-chk", d.id, d.t)).join("")}</div>` : ""}
<div class="gsec"><b>4. Mentalidade <span class="sm mut">(opcional)</span></b>${GATE_MENT.map(([d, c]) => i("data-gcl", d, c)).join("")}</div>
<div class="gdica sm">“${esc(s)}” <span class="mut">Psicologia Financeira, Celso Sant'Ana</span></div>
${e.falta.length ? `<div class="sm mut" style="margin-top:8px">Falta: ${e.falta.map((d) => esc(GATE_NOME[d] || d)).join(", ")}</div>` : ""}</div>`;
}
{
  const e = gateHtml;
  gateHtml = function (t) {
    return t && t.tipo === "manha"
      ? gateManhaHtml(t)
      : e.apply(this, arguments);
  };
}
(document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest && e.target.closest("#gateov [data-gate-est]");
  if (!a) return;
  const o = GATE_D(),
    s = (t = S.days)[o] ?? (t[o] = { chk: {} });
  ((s.estado = +a.dataset.gateEst), (s.u = Date.now()), save(), gateAtualiza());
}),
  document.addEventListener("change", (e) => {
    var t;
    const a = e.target.closest && e.target.closest("#gateov [data-gcl]");
    if (!a) return;
    const o = GATE_D(),
      s = (t = S.days)[o] ?? (t[o] = { chk: {} });
    (((s.cl ?? (s.cl = {}))[a.dataset.gcl] = a.checked),
      (s.u = Date.now()),
      save(),
      gateAtualiza());
  }));
{
  const e = TraderStyles.slot("legacy-088");
  ((e.id = "diario160"),
    (e.textContent = TraderStyles.css("legacy-088")),
    TraderStyles.mount(e));
}
function xlsEsc(e) {
  return String(e ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function xlsAba(e, t) {
  const a = (o) => {
    const s = String(o ?? "");
    return `<Cell><Data ss:Type="${/^-?\d+(\.\d+)?$/.test(s) && s.length < 15 ? "Number" : "String"}">${xlsEsc(s)}</Data></Cell>`;
  };
  return `<Worksheet ss:Name="${xlsEsc(e).slice(0, 31)}"><Table>${t.map((o) => "<Row>" + o.map(a).join("") + "</Row>").join("")}</Table></Worksheet>`;
}
function xlsArquivo(e) {
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${e.join("")}</Workbook>`;
}
function csvParaLinhas(e) {
  e = String(e || "").replace(/^\ufeff/, "");
  const t = [];
  let a = [],
    o = "",
    s = !1;
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    s
      ? r === '"'
        ? e[n + 1] === '"'
          ? ((o += '"'), n++)
          : (s = !1)
        : (o += r)
      : r === '"'
        ? (s = !0)
        : r === ","
          ? (a.push(o), (o = ""))
          : r ===
              `
`
            ? (a.push(o), t.push(a), (a = []), (o = ""))
            : r !== "\r" && (o += r);
  }
  return ((o !== "" || a.length) && (a.push(o), t.push(a)), t);
}
function checklistLinhas() {
  const e = [
      "data",
      "estado (1 a 5)",
      "plano definido (de 3)",
      "regras marcadas",
      "regras no total",
      "mentalidade (de 4)",
      "diário pós-operação",
      "trades do dia",
      "× risco do dia",
    ],
    t = new Set(
      Object.keys(S.days || {}).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    );
  (S.trades || []).forEach((s) => {
    const n = String(s.dt || "").slice(0, 10);
    /^\d{4}-\d{2}-\d{2}$/.test(n) && t.add(n);
  });
  const a = S.rules || [],
    o = [e];
  return (
    [...t].sort().forEach((s) => {
      const n = S.days[s] || {},
        r = n.chk || {},
        i = n.cl || {},
        l = (S.trades || []).filter(
          (c) => String(c.dt || "").slice(0, 10) === s,
        ),
        d = l
          .map((c) => calc(c).r)
          .filter((c) => typeof c == "number" && isFinite(c));
      o.push([
        s,
        n.estado || "",
        GATE_PLANO.filter((c) => i[c]).length,
        a.filter((c) => r[c.id]).length,
        a.length,
        ["m_umdia", "m_erro", "m_aprend", "m_maior"].filter((c) => i[c]).length,
        n.posop ? "sim" : "não",
        l.length,
        d.length ? +d.reduce((c, p) => c + p, 0).toFixed(2) : "",
      ]);
    }),
    o
  );
}
{
  const e = csv;
  csv = async function (t) {
    if (t === void 0 || t === "x") return e(t);
    let a = null;
    const o = saveFile;
    saveFile = async function (r, i) {
      a = i;
    };
    try {
      await e(t);
    } finally {
      saveFile = o;
    }
    if (a == null) return;
    const s = [
        xlsAba("Operações", csvParaLinhas(a)),
        xlsAba("Checklist", checklistLinhas()),
      ],
      n = t === "all" ? "diario-trades.xls" : "diario-trades-" + t + ".xls";
    return saveFile(n, xlsArquivo(s), "application/vnd.ms-excel");
  };
}
const jrEdOcultas = () => {
    try {
      return jrEdP().oc || [];
    } catch {
      return [];
    }
  },
  jrItens = (e) => {
    const t = jrEdOcultas();
    return [
      e && e.manchete,
      ...((e && e.materias) || []).filter((a) => a && !t.includes(a.editoria)),
    ].filter((a) => a && a.titulo);
  },
  JR_DIR = {
    alta: ["▲", "up", "favorece alta"],
    baixa: ["▼", "dn", "favorece baixa"],
    misto: ["↕", "eq", "efeito misto"],
    "": ["•", "eq", "sem direção clara"],
  },
  JR_GLIFO = {
    Mercados: "B3",
    Macroeconomia: "PIB",
    "Juros e política monetária": "%",
    "Contas públicas": "R$",
    Empresas: "S.A.",
    Internacional: "Global",
    Commodities: "Brent",
    "Eleições e economia": "Voto",
    Câmbio: "US$",
  },
  jrHash = (e) => {
    let t = 0;
    for (const a of String(e || "")) t = (t * 31 + a.charCodeAt(0)) | 0;
    return "i" + Math.abs(t).toString(36);
  },
  jrTemImp = (e) =>
    !!(e && ((e.ativos || []).length || (e.setores || []).length));
function jrResumo(e) {
  const t = jrItens(e).slice(0, 5);
  return t.length >= 3 ? t : [];
}
function jrResumoHtml(e) {
  const t = jrResumo(e);
  return t.length
    ? `<section class="jrsec jrexec"><h3>Resumo executivo</h3><ol class="jrexl">${t.map((a) => `<li><b>${esc(a.titulo)}</b>${a.por_que_importa ? `<span>${esc(a.por_que_importa)}</span>` : ""}</li>`).join("")}</ol></section>`
    : "";
}
function jrImpAgg(e) {
  const t = new Map();
  return (
    jrItens(e).forEach((a) => {
      const o = a.impacto || {};
      (o.ativos || []).forEach((s) => {
        const n = String(s || "")
          .toUpperCase()
          .trim();
        if (!n) return;
        const r = t.get(n) || { a: n, d: new Set(), n: 0 };
        (o.direcao && r.d.add(o.direcao), r.n++, t.set(n, r));
      });
    }),
    [...t.values()]
      .map((a) => ({
        a: a.a,
        n: a.n,
        dir: a.d.size === 1 ? [...a.d][0] : a.d.size > 1 ? "misto" : "",
      }))
      .sort((a, o) => o.n - a.n)
      .slice(0, 14)
  );
}
function jrSetAgg(e) {
  const t = new Map();
  return (
    jrItens(e).forEach((a) =>
      ((a.impacto || {}).setores || []).forEach((o) => {
        const s = String(o || "").trim();
        s && t.set(s, (t.get(s) || 0) + 1);
      }),
    ),
    [...t.entries()]
      .map(([a, o]) => ({ s: a, n: o }))
      .sort((a, o) => o.n - a.n)
      .slice(0, 10)
  );
}
const jrChip = (e, t, a) => {
  const [o, s, n] = JR_DIR[t] || JR_DIR[""];
  return `<span class="jrchip ${s}" title="${esc(n)}">${o} ${esc(e)}${a > 1 ? ` <small>×${a}</small>` : ""}</span>`;
};
function jrImpTxt(e) {
  if (!jrTemImp(e)) return "";
  const t = (JR_DIR[e.direcao] || JR_DIR[""])[2];
  return [
    (e.ativos || []).join(", "),
    (e.setores || []).length ? "setores: " + e.setores.join(", ") : "",
    t,
  ]
    .filter(Boolean)
    .join(" · ");
}
function jrImpHtml(e) {
  const t = jrImpAgg(e),
    a = jrSetAgg(e);
  return !t.length && !a.length
    ? ""
    : `<section class="jrsec jrimpac"><h3>Impacto nos ativos</h3>${t.length ? `<div class="jrchips">${t.map((o) => jrChip(o.a, o.dir, o.n)).join("")}</div>` : ""}${a.length ? `<div class="jrsets"><small>Setores</small> ${a.map((o) => `<span>${esc(o.s)}${o.n > 1 ? ` <small>×${o.n}</small>` : ""}</span>`).join("")}</div>` : ""}<div class="sm mut" style="margin-top:8px">▲ a notícia favorece alta · ▼ favorece baixa · ↕ efeito misto. Leitura da redação, não é recomendação.</div></section>`;
}
function jrImpLinha(e) {
  const t = e && e.impacto;
  return jrTemImp(t)
    ? `<div class="jrimp1"><small>Impacto</small>${(t.ativos || []).map((a) => jrChip(a, t.direcao, 1)).join("")}${(t.setores || []).map((a) => `<span class="jrset1">${esc(a)}</span>`).join("")}</div>`
    : "";
}
function jrTecDados(e) {
  const t = JRN.g && JRN.g[e];
  if (!t || !Array.isArray(t.d)) return null;
  const a = t.d.filter(
    (u) =>
      u && [1, 2, 3, 4].every((m) => typeof u[m] == "number" && isFinite(u[m])),
  );
  if (a.length < 20) return null;
  const [o, s, n] = JRG_TK[e],
    r = a[0][1] / n,
    i = Math.max(...a.map((u) => u[2])) / n,
    l = Math.min(...a.map((u) => u[3])) / n,
    d = a[a.length - 1][4] / n,
    c = (i + l + d) / 3,
    p = d > c && d > r ? "Alta" : d < c && d < r ? "Baixa" : "Lateral";
  return {
    k: e,
    tk: o,
    nome: s,
    div: n,
    O: r,
    H: i,
    L: l,
    C: d,
    P: c,
    R1: 2 * c - l,
    S1: 2 * c - i,
    tend: p,
    dia: t.dia,
    n: a.length,
  };
}
const jrNumF = (e, t) =>
  e.toLocaleString("pt-BR", {
    minimumFractionDigits: t > 1 ? 4 : 0,
    maximumFractionDigits: t > 1 ? 4 : 0,
  });
var jrTecHtml;
{
  const e = jrGraf;
  jrGraf = async function (t) {
    const a = await e.apply(this, arguments);
    try {
      const o = document.getElementById("jrtec");
      o && (o.outerHTML = jrTecHtml());
    } catch {}
    return a;
  };
}
function jrIlu(e) {
  const t = jrCor(e.editoria) || "#373a3f",
    a = JR_GLIFO[e.editoria] || "B3",
    o = jrHash(e.titulo);
  return `<figure class="jrilu" aria-hidden="true"><svg viewBox="0 0 600 190" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${o}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t}"/><stop offset="1" stop-color="#070708"/></linearGradient><pattern id="${o}p" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="14" stroke="#ffffff" stroke-opacity=".08" stroke-width="2"/></pattern></defs><rect width="600" height="190" fill="url(#${o})"/><rect width="600" height="190" fill="url(#${o}p)"/><line x1="24" y1="136" x2="200" y2="136" stroke="#ffffff" stroke-opacity=".6" stroke-width="2"/><text x="576" y="128" text-anchor="end" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="${a.length > 3 ? 82 : 116}" fill="#ffffff" fill-opacity=".92">${esc(a)}</text><text x="24" y="158" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="700" letter-spacing="2.5" fill="#ffffff" fill-opacity=".88">${esc(String(e.editoria || "").toUpperCase())}</text></svg></figure>`;
}
{
  const e = jrMateria;
  jrMateria = function (t, a, o) {
    let s = e.apply(this, arguments);
    try {
      o &&
        t &&
        t.titulo &&
        (s = s.replace('<h2 class="jrtit">', jrIlu(t) + '<h2 class="jrtit">'));
      const n = jrImpLinha(t);
      if (n) {
        const r = s.indexOf('<div class="jrbar">');
        r > 0 && (s = s.slice(0, r) + n + s.slice(r));
      }
    } catch {}
    return s;
  };
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = JRN.v;
      if (!a || !a.manchete) return t;
      {
        const s = t.search(/<div class="jrinds"[^>]*>/);
        if (s >= 0) {
          const n = t.indexOf("</div>", s);
          if (n > 0) {
            const r = t
              .slice(s, t.indexOf(">", s) + 1)
              .replace('class="jrinds"', 'class="jrinds jrmk"');
            t =
              t.slice(0, s) +
              '<section class="jrsec jrmkt"><h3>Painel de mercado</h3>' +
              r +
              t.slice(t.indexOf(">", s) + 1, n) +
              "</div></section>" +
              t.slice(n + 6);
          }
        }
      }
      const o = t.indexOf('id="jra-m"');
      if (o > 0) {
        const s = t.indexOf("</article>", o);
        if (s > 0) {
          const n = s + 10;
          t = t.slice(0, n) + jrResumoHtml(a) + jrImpHtml(a) + t.slice(n);
        }
      }
      {
        const s = t.search(
          /<section class="jrsec"><h3( class="jrh3b")?>Mais do dia/,
        );
        s > 0 &&
          (t =
            t.slice(0, s) +
            jrTecHtml() +
            '<section class="jrsec jrmais">' +
            t.slice(s + 23));
      }
      t = t.replace(
        '<section class="jrsec"><h3>Agenda</h3>',
        '<section class="jrsec jragenda"><h3>Agenda econômica</h3>',
      );
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-089");
  ((e.id = "jornal161"),
    (e.textContent = TraderStyles.css("legacy-089")),
    TraderStyles.mount(e));
}
((FN_ESPERADA.analise = "v232"), (FN_ESPERADA.notificar = "v232"));
const DSH_MOD = {
  dt: "Day trade",
  sw: "Swing trade",
  op: "Opções",
  ex: "EUA e Forex",
  all: "Todas as modalidades",
};
function dshEscolha() {
  let e = document.getElementById("dshch");
  (e && e.remove(), (e = document.createElement("div")), (e.id = "dshch"));
  const t = modAtual(),
    a = ["dt", "sw", "op", "ex"].includes(t) ? t : null,
    o = (s, n, r) =>
      `<button type="button" class="btn${r ? "" : " s"}" data-dshm="${s}">${n}</button>`;
  ((e.innerHTML = `<div class="csvc"><h2>PDF do Painel de quê?</h2><p class="sm mut">Escolha a modalidade para o relatório não vir misturado.</p><div class="csvg">${a ? o(a, "Só " + DSH_MOD[a] + " (aba atual)", 1) : ""}${[
    "dt",
    "sw",
    "op",
    "ex",
  ]
    .filter((s) => s !== a)
    .map((s) => o(s, "Só " + DSH_MOD[s], 0))
    .join("")}${o("all", DSH_MOD.all, 0)}</div>${o("x", "Cancelar", 0)}</div>`),
    document.body.appendChild(e));
}
{
  const e = dshPdf;
  dshPdf = function (t) {
    if (t === void 0) {
      dshEscolha();
      return;
    }
    if (t === "x") return;
    const a = S.trades,
      o = lcItems;
    t !== "all" &&
      ((S.trades = a.filter((s) => modDe(s) === t)),
      t !== "ex" &&
        (lcItems = function () {
          return [];
        }));
    try {
      e();
    } finally {
      ((S.trades = a), (lcItems = o));
    }
    if (t !== "all")
      try {
        ((PDFB.tt = String(PDFB.tt || "Dashboard") + " · " + DSH_MOD[t]),
          (PDFB.name = String(PDFB.name || "dashboard.pdf").replace(
            /\.pdf$/,
            "-" + t + ".pdf",
          )));
        const s = document.querySelector("#pdfbody h1");
        (s && (s.textContent = PDFB.tt), pdfBar());
      } catch {}
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("#dshch [data-dshm]");
  if (!t) return;
  const a = t.dataset.dshm;
  (document.getElementById("dshch")?.remove(), dshPdf(a));
});
const JRC = { busy: 0, msg: "", etapa: "" };
let JRC_LOAD = 0;
function jrcCarrega() {
  if (!JRC_LOAD) {
    JRC_LOAD = 1;
    try {
      Promise.resolve(idb("kv", "get", "anx"))
        .then((e) => {
          e &&
            typeof e == "object" &&
            ((ANX.res = { ...e, ...(ANX.res || {}) }), jrPinta());
        })
        .catch(() => {});
    } catch {}
  }
}
function jrcRes() {
  const e = {};
  return (
    ["BR", "US"].forEach((t) =>
      ["fun", "tec"].forEach((a) => {
        const o = ANX.res && ANX.res[t + ":" + a];
        o && (e[t + ":" + a] = o);
      }),
    ),
    e
  );
}
function jrcAtivos() {
  const e = new Map();
  for (const [t, a] of Object.entries(jrcRes())) {
    const o = t.slice(3);
    for (const s of anxArr(((a || {}).relatorio || {}).ativos)) {
      const n = String(s.ticker || "").toUpperCase();
      if (!n) continue;
      const r = e.get(n) || { tk: n };
      ((r[o] = s), e.set(n, r));
    }
  }
  return [...e.values()];
}
function jrcUlt() {
  const e = Object.values(jrcRes())
    .map((t) => t && t.dia)
    .filter(Boolean)
    .sort();
  return e[e.length - 1] || "";
}
async function jrcAnalisa() {
  if (JRC.busy) return;
  const e = ["BR", "US"].filter((a) => {
    try {
      return anxItens(a).length > 0;
    } catch {
      return !1;
    }
  });
  if (!e.length) {
    ((JRC.msg =
      "Lance suas ações, ETFs ou FIIs na carteira primeiro (Mais → Carteiras)."),
      jrPinta());
    return;
  }
  ((JRC.busy = 1), (JRC.msg = ""));
  const t = [];
  for (const a of e) {
    const o = anxItens(a);
    for (const s of ["fun", "tec"]) {
      ((JRC.etapa =
        (a === "BR" ? "Brasil" : "EUA") +
        ", " +
        (s === "fun" ? "fundamentalista" : "técnica")),
        jrPinta());
      try {
        const n = await anxCall({
          modo: s === "tec" ? "tecnica" : "fundamentalista",
          itens: o,
        });
        if (!n || n.erro) throw new Error((n && n.erro) || "sem resposta");
        ((n.dia = loc().slice(0, 10)),
          (n.sig = o.map((r) => r.tk).join(",")),
          ((ANX.res ?? (ANX.res = {}))[a + ":" + s] = n));
      } catch (n) {
        t.push(
          (a === "BR" ? "Brasil" : "EUA") +
            " " +
            (s === "fun" ? "fundamentalista" : "técnica") +
            ": " +
            ((n && n.message) || n),
        );
      }
    }
  }
  try {
    idb("kv", "put", ANX.res, "anx");
  } catch {}
  ((JRC.busy = 0),
    (JRC.etapa = ""),
    (JRC.msg = t.length ? "Parte da análise não saiu. " + t.join(" · ") : ""),
    jrPinta());
}
const jrcTag = (e, t) => `<span class="jrtag ${t}">${esc(e)}</span>`,
  jrcCls = (e) =>
    /BARATO|ALTA/.test(e) ? "up" : /CARO|BAIXA/.test(e) ? "dn" : "eq";
function jrcCard(e) {
  const t = e.fun || {},
    a = e.tec || {},
    o = a.gatilhos || {},
    s = (n, r) =>
      r && typeof r == "string" ? `<p><small>${n}</small>${esc(r)}</p>` : "";
  return `<div class="jrcc"><div class="jrcc-h"><b>${esc(e.tk)}</b><span>${t.valuation ? jrcTag(t.valuation.toLowerCase(), jrcCls(t.valuation)) : ""}${t.qualidade ? jrcTag("qualidade " + t.qualidade.toLowerCase(), "eq") : ""}${a.vies ? jrcTag("viés " + a.vies.toLowerCase(), jrcCls(a.vies)) : ""}</span></div>
${s("Fundamentos", t.resumo)}${s("Para quem tem", t.para_quem_tem)}${s("Técnica", a.resumo)}${s("Suportes e resistências", a.zonas_de_interesse)}${o.compra || o.venda ? `<p><small>Gatilhos</small>${o.compra ? "Compra: " + esc(o.compra) + " " : ""}${o.venda ? "Venda: " + esc(o.venda) : ""}</p>` : ""}</div>`;
}
function jrcHtml() {
  jrcCarrega();
  const e = jrcAtivos(),
    t = jrcUlt(),
    a = `<button class="btn" data-jrcart="1"${JRC.busy ? " disabled" : ""}>${JRC.busy ? "⏳ Analisando (" + esc(JRC.etapa) + ")…" : e.length ? "↻ Atualizar análise da carteira" : "📊 Analisar minha carteira"}</button>`;
  return `<section class="jrsec jrcart" id="jrcart"><h3>Sua carteira</h3><p class="sm mut" style="margin:0 0 8px">Análise fundamentalista e técnica de cada ativo da sua carteira. Só roda quando você tocar no botão${t ? ` · última análise em ${t.slice(8, 10)}/${t.slice(5, 7)}` : ""}.</p>${a}${JRC.msg ? `<div class="warn sm" style="margin-top:8px">${esc(JRC.msg)}</div>` : ""}${e.length ? `<div class="jrccs">${e.map(jrcCard).join("")}</div><div class="sm mut" style="margin-top:8px">Leitura da IA com os dados da sua carteira. Não é recomendação de investimento.</div>` : ""}</section>`;
}
document.addEventListener("click", (e) => {
  e.target.closest && e.target.closest("[data-jrcart]") && jrcAnalisa();
});
function jeLogo(e) {
  return `<svg class="jelogo" viewBox="0 0 40 40" width="${e}" height="${e}" aria-hidden="true"><rect x="4" y="23" width="6" height="13" rx="1" fill="#1f2023"/><rect x="13" y="17" width="6" height="19" rx="1" fill="#1f2023"/><rect x="22" y="11" width="6" height="25" rx="1" fill="#ac8439"/><path d="M4 18 L15 10 L22 14 L35 4" stroke="#ac8439" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 4 h6 v6" stroke="#ac8439" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = JRN.v;
      if (!a || !a.manchete) return t;
      t = t.replace(
        '<div class="jrnome">Jornal do Pregão</div>',
        `<div class="jrnome">${jeLogo(34)}<span>Jornal do Pregão</span></div><div class="jrtag2">INFORMAÇÃO · MERCADOS · ANÁLISE</div>`,
      );
      const o = t.indexOf('<section class="jrsec jrmais">'),
        s = jrcHtml();
      o > 0 ? (t = t.slice(0, o) + s + t.slice(o)) : (t += s);
    } catch {}
    return t;
  };
}
const JEPG = { W: 794, H: 1123 },
  jeEsc = (e) => esc(String(e ?? "")),
  jeNumTxt = (e) =>
    e == null || !isFinite(e)
      ? "–"
      : Number(e).toLocaleString("pt-BR", {
          maximumFractionDigits:
            Math.abs(e) >= 1e3 ? 0 : Math.abs(e) < 10 ? 4 : 2,
        }),
  jePct = (e) =>
    e == null || !isFinite(e)
      ? ""
      : `<i class="${e > 0 ? "up" : e < 0 ? "dn" : "eq"}">${e > 0 ? "▲" : e < 0 ? "▼" : "■"} ${(e > 0 ? "+" : "") + Number(e).toFixed(2).replace(".", ",")}%</i>`,
  JE_ICO = {
    diario:
      '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    empresas:
      '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    economia:
      '<path d="M3 21h18M4 10h16M12 3l8 4H4l8-4zM6 10v8M10 10v8M14 10v8M18 10v8" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    mundo:
      '<circle cx="12" cy="12" r="9" stroke="#ffffff" stroke-width="2" fill="none"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="#ffffff" stroke-width="2" fill="none"/>',
    agenda:
      '<rect x="3" y="5" width="18" height="16" rx="2" stroke="#ffffff" stroke-width="2" fill="none"/><path d="M3 10h18M8 3v4M16 3v4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>',
    carteira:
      '<rect x="3" y="7" width="18" height="13" rx="2" stroke="#ffffff" stroke-width="2" fill="none"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" stroke="#ffffff" stroke-width="2" fill="none"/>',
    tec: '<path d="M3 17l5-6 4 3 7-9" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  jeIco = (e, t = 22) =>
    `<svg viewBox="0 0 24 24" width="${t}" height="${t}" aria-hidden="true">${JE_ICO[e] || JE_ICO.diario}</svg>`;
function jeBan(e, t, a, o) {
  return `<div class="jeban"><div class="jeban-i">${jeIco(e, 24)}</div><div class="jeban-t"><b>${jeEsc(t)}${o ? " <small>(continuação)</small>" : ""}</b>${a ? `<span>${jeEsc(a)}</span>` : ""}</div><svg class="jeban-art" viewBox="0 0 260 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 L30 52 L55 56 L85 40 L110 44 L140 28 L170 34 L200 18 L230 22 L260 6" stroke="#bc903f" stroke-width="2" fill="none" opacity=".9"/><path d="M0 66 L40 60 L80 62 L120 50 L160 54 L200 40 L260 30" stroke="#bc903f" stroke-width="1" fill="none" opacity=".45"/></svg></div>`;
}
const jeFita = (e, t = "diario") =>
    `<div class="jefita">${jeIco(t, 16)}<b>${jeEsc(e)}</b></div>`,
  jeBarra = (e, t) =>
    t
      ? `<div class="jebarra"><div class="jebarra-i">${jeIco("tec", 22)}</div><div><b>${jeEsc(e)}</b><span>${jeEsc(t)}</span></div></div>`
      : "";
function jeSpark(e) {
  const t = JRN.g && JRN.g[e];
  if (!t || !Array.isArray(t.d) || t.d.length < 5) return "";
  const a = t.d.map((c) => c[4]).filter((c) => isFinite(c));
  if (a.length < 5) return "";
  const o = Math.max(...a),
    s = Math.min(...a),
    n = 150,
    r = 34,
    i = (c) => (c * n) / (a.length - 1),
    l = (c) => r - 2 - ((c - s) * (r - 4)) / Math.max(1e-9, o - s),
    d = a[a.length - 1] >= a[0] ? "#2e8a5c" : "#d34e3a";
  return `<svg class="jespk" viewBox="0 0 ${n} ${r}" preserveAspectRatio="none"><polyline fill="none" stroke="${d}" stroke-width="1.6" points="${a.map((c, p) => i(p).toFixed(1) + "," + l(c).toFixed(1)).join(" ")}"/></svg>`;
}
const jeSparkDe = (e) => {
  const t = (String(e.k || "") + " " + String(e.n || "")).toLowerCase();
  return /\bwin\b|mini \xedndice|mini indice/.test(t)
    ? jeSpark("win")
    : /\bwdo\b|d\xf3lar futuro|dolar futuro/.test(t)
      ? jeSpark("wdo")
      : "";
};
function jeCot(e, t) {
  return `<div class="jecot${t ? " esc" : ""}"><small>${jeEsc(String(e.n || e.k || "").toUpperCase())}</small><b>${jeNumTxt(e.px)}</b>${jePct(e.d1)}${t ? "" : jeSparkDe(e)}</div>`;
}
function jeHeroArt() {
  const e = [
    [0, 120],
    [34, 90],
    [60, 140],
    [96, 70],
    [128, 110],
    [160, 60],
    [196, 130],
    [230, 85],
    [262, 150],
    [300, 95],
    [334, 125],
    [370, 80],
    [404, 140],
    [440, 100],
    [476, 65],
    [512, 120],
    [548, 90],
    [584, 135],
    [620, 75],
    [656, 115],
    [692, 95],
  ];
  return `<svg class="jehero-art" viewBox="0 0 730 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="jehg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2c30"/><stop offset="1" stop-color="#131416"/></linearGradient></defs><rect width="730" height="300" fill="url(#jehg)"/>${[60, 120, 180, 240].map((t) => `<line x1="0" x2="730" y1="${t}" y2="${t}" stroke="#ffffff" stroke-opacity=".05"/>`).join("")}${e.map(([t, a]) => `<rect x="${t}" y="${300 - a}" width="30" height="${a}" fill="#1b1d1f" opacity=".85"/>`).join("")}<polyline points="0,250 70,230 130,238 200,200 260,210 330,170 390,180 460,130 520,142 590,96 650,104 730,52" fill="none" stroke="#bc903f" stroke-width="3" opacity=".9"/><polyline points="0,262 90,248 170,252 250,226 340,232 430,196 520,200 620,160 730,140" fill="none" stroke="#bc903f" stroke-width="1.4" opacity=".35"/></svg>`;
}
const jePar1 = (e) => {
  const t = String(e || "").split(/\n\s*\n/)[0] || "";
  return t.length > 520 ? t.slice(0, t.lastIndexOf(" ", 500)) + "…" : t;
};
function jeNumBox(e) {
  return (
    (e = (e || []).slice(0, 6)),
    e.length
      ? `<div class="jenums n${Math.min(e.length, 4)}">${e
          .map((t) => {
            const a = String(t.valor || ""),
              o = /^\s*\+/.test(a) ? "up" : /^\s*[-\u2212]/.test(a) ? "dn" : "";
            return `<div><small>${jeEsc(t.rotulo)}</small><b class="${o}">${jeEsc(a)}</b></div>`;
          })
          .join("")}</div>`
      : ""
  );
}
function jeImp(e) {
  return jrTemImp(e)
    ? `<div class="jeimp">${(e.ativos || [])
        .map((t) => {
          const [a, o] = JR_DIR[e.direcao] || JR_DIR[""];
          return `<span class="jechip ${o}">${a} ${jeEsc(t)}</span>`;
        })
        .join(
          "",
        )}${(e.setores || []).map((t) => `<span class="jechip set">${jeEsc(t)}</span>`).join("")}</div>`
    : "";
}
function jeMat(e, t = {}) {
  return !e || !e.titulo
    ? ""
    : `<article class="jemat"><div class="jechap" style="color:${jrCor(e.editoria)}">${jeEsc(String(e.editoria || "").toUpperCase())}${e.chapeu ? " · " + jeEsc(String(e.chapeu).toUpperCase()) : ""}</div><h3>${jeEsc(e.titulo)}</h3>${e.linha_fina ? `<p class="jefina">${jeEsc(e.linha_fina)}</p>` : ""}${jeNumBox(e.numeros)}${t.semTexto ? "" : `<p class="jetx">${jeEsc(jePar1(e.texto))}</p>`}${e.por_que_importa ? `<div class="jepq">“${jeEsc(e.por_que_importa)}”</div>` : ""}${jeImp(e.impacto)}</article>`;
}
const JE_ED = {
    empresas: ["Empresas"],
    economia: [
      "Macroeconomia",
      "Juros e política monetária",
      "Contas públicas",
      "Câmbio",
    ],
    mundo: ["Internacional", "Commodities"],
  },
  jeGrupo = (e) =>
    Object.keys(JE_ED).find((t) => JE_ED[t].includes(e.editoria)) || "diario",
  jeTk = (e) => {
    const t = ((e.impacto || {}).ativos || [])[0];
    return t
      ? String(t).toUpperCase()
      : String(e.chapeu || e.editoria || "").split(/\s+/)[0];
  };
function jeVal(e) {
  const t = String(e || "")
    .replace(/\s/g, "")
    .match(/(-?[\d.]+(?:,\d+)?)(bi|mi|mil)?/i);
  if (!t) return null;
  const a = +t[1].replace(/\./g, "").replace(",", ".");
  if (!isFinite(a)) return null;
  const o = (t[2] || "").toLowerCase();
  return o === "bi" ? a : o === "mi" ? a / 1e3 : o === "mil" ? a / 1e6 : null;
}
function jeGrafEmp(e) {
  const t = e
    .map((d) => {
      const c = d.numeros || [],
        p = c.find((x) => /receita/i.test(x.rotulo)),
        u = c.find((x) => /lucro/i.test(x.rotulo)),
        m = p && jeVal(p.valor),
        f = u && jeVal(u.valor);
      return m != null && f != null ? { tk: jeTk(d), r: m, l: f } : null;
    })
    .filter(Boolean)
    .slice(0, 6);
  if (t.length < 2) return "";
  const a = Math.max(...t.flatMap((d) => [d.r, d.l]), 1e-9),
    o = 660,
    s = 190,
    n = Math.min(46, (o - 40) / t.length / 2.6),
    r = (o - 40) / t.length,
    i = (d) => s - 26 - (Math.max(0, d) / a) * (s - 50),
    l = (d) => d.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `<div class="jebox"><div class="jebox-h"><b>Desempenho das empresas que divulgaram (R$ bi)</b><span><i class="lg n"></i>Receita <i class="lg g"></i>Lucro</span></div><svg viewBox="0 0 ${o} ${s}" class="jegraf">${t
    .map((d, c) => {
      const p = 30 + r * c + r / 2;
      return `<rect x="${(p - n - 2).toFixed(1)}" y="${i(d.r).toFixed(1)}" width="${n.toFixed(1)}" height="${(s - 26 - i(d.r)).toFixed(1)}" fill="#51555d"/><rect x="${(p + 2).toFixed(1)}" y="${i(d.l).toFixed(1)}" width="${n.toFixed(1)}" height="${(s - 26 - i(d.l)).toFixed(1)}" fill="#ac8439"/><text x="${(p - n / 2 - 2).toFixed(1)}" y="${(i(d.r) - 4).toFixed(1)}" text-anchor="middle" font-size="11">${l(d.r)}</text><text x="${(p + 2 + n / 2).toFixed(1)}" y="${(i(d.l) - 4).toFixed(1)}" text-anchor="middle" font-size="11">${l(d.l)}</text><text x="${p.toFixed(1)}" y="${s - 8}" text-anchor="middle" font-size="12" font-weight="700">${jeEsc(d.tk)}</text>`;
    })
    .join(
      "",
    )}<line x1="20" x2="${o - 10}" y1="${s - 26}" y2="${s - 26}" stroke="#989da6"/></svg><div class="jenota">Valores lidos dos números das matérias de balanço. Lucro negativo aparece sem barra.</div></div>`;
}
function jeVarr() {
  const e = JRN.varr;
  if (!e || !(e.ranking || []).length) return "";
  const t = (a) =>
    a == null
      ? "–"
      : Number(a).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  return `<div class="jebox">${jeFita("Oportunidades fundamentalistas", "empresas")}${e.resumo ? `<p class="jetx">${jeEsc(e.resumo)}</p>` : ""}<table class="jetab"><thead><tr><th>Ação</th><th>Preço</th><th>Graham</th><th>Bazin</th><th>Potencial</th></tr></thead><tbody>${e.ranking.map((a) => `<tr><td><b>${jeEsc(a.tk)}</b></td><td>${t(a.preco)}</td><td>${t(a.graham)}</td><td>${t(a.bazin)}</td><td class="up"><b>${(a.potencial_medio_pct >= 0 ? "+" : "") + String(a.potencial_medio_pct).replace(".", ",")}%</b></td></tr>`).join("")}</tbody></table><div class="jenota">Graham e Bazin, média do potencial de alta. Triagem por números, não é recomendação de compra.</div></div>`;
}
function jeTec() {
  const e = ["win", "wdo"].map(jrTecDados).filter(Boolean);
  return e.length
    ? `<div class="jebox">${jeFita("Análise técnica", "tec")}<div class="jetecs">${e
        .map((t) => {
          const a = (o) => jrNumF(o, t.div);
          return `<div class="jetec"><div class="jetec-h"><b>${jeEsc(t.tk)}</b><span class="jetag ${t.tend === "Alta" ? "up" : t.tend === "Baixa" ? "dn" : "eq"}">${t.tend}</span></div><div>Suporte <b class="up">${a(t.S1)}</b> · Resistência <b class="dn">${a(t.R1)}</b></div><div class="jenota">Pivô ${a(t.P)} · mínima ${a(t.L)} · máxima ${a(t.H)} · último ${a(t.C)}</div></div>`;
        })
        .join(
          "",
        )}</div><div class="jenota">Pivô clássico do pregão (candles de 5 min). Não é recomendação.</div></div>`
    : "";
}
function jeSecoes(e) {
  const t = jrEdOcultas(),
    a = (e.materias || []).filter(
      (c) => c && c.titulo && !t.includes(c.editoria),
    ),
    o = { diario: [], empresas: [], economia: [], mundo: [] };
  a.forEach((c) => o[jeGrupo(c)].push(c));
  const s = e.cotacoes || [],
    n = s.filter((c) =>
      /s&p|nasdaq|dow|dxy|brent|ouro|stoxx|nikkei|vix|treasur/i.test(
        (c.n || "") + " " + (c.k || ""),
      ),
    ),
    r = s.filter((c) => !n.includes(c)),
    i = [],
    l = e.manchete;
  i.push({
    capa: 1,
    blocos: [
      `<div class="jehero">${jeHeroArt()}<div class="jehero-t"><span class="jeed">${jeEsc(String(l.editoria || "Mercados").toUpperCase())}</span><h1>${jeEsc(l.titulo)}</h1>${l.linha_fina ? `<p>${jeEsc(l.linha_fina)}</p>` : ""}</div></div>`,
      r.length
        ? `<div class="jecots">${r
            .slice(0, 8)
            .map((c) => jeCot(c))
            .join("")}</div>`
        : "",
      jeBarra("Por que importa", l.por_que_importa),
      `<div class="jemat jeman">${jeNumBox(l.numeros)}<p class="jetx">${jeEsc(
        String(l.texto || "")
          .split(/\n\s*\n/)
          .slice(0, 2)
          .join(" "),
      )}</p>${jeImp(l.impacto)}</div>`,
    ],
  });
  const d = o.diario[0] || a[0];
  if (
    (i.push({
      ico: "diario",
      tit: "Diário de Trader",
      sub: "Panorama, notícias e oportunidades do dia",
      blocos: [
        `<div class="jeduo"><div class="jebox">${jeFita("Em poucas linhas")}${
          (e.em_poucas_linhas || []).length
            ? `<ul class="jelist">${e.em_poucas_linhas
                .slice(0, 8)
                .map((c) => `<li>${jeEsc(c)}</li>`)
                .join("")}</ul>`
            : '<p class="jenota">Sem notas nesta edição.</p>'
        }</div>${d ? `<div class="jebox jedest">${jrIlu(d)}<b>${jeEsc(d.titulo)}</b>${d.linha_fina ? `<p>${jeEsc(d.linha_fina)}</p>` : ""}</div>` : ""}</div>`,
        (() => {
          const c = jrResumo(e);
          return c.length
            ? `<div class="jebox">${jeFita("Resumo executivo")}<ol class="jeol">${c.map((p) => `<li><b>${jeEsc(p.titulo)}</b>${p.por_que_importa ? ` — ${jeEsc(p.por_que_importa)}` : ""}</li>`).join("")}</ol></div>`
            : "";
        })(),
        ...(o.diario.length
          ? [jeFita("Mais do dia"), ...o.diario.map((c) => jeMat(c))]
          : []),
      ],
    }),
    o.empresas.length || (JRN.varr && (JRN.varr.ranking || []).length))
  ) {
    const c = o.empresas;
    i.push({
      ico: "empresas",
      tit: "Empresas e resultados",
      sub: "Balanços e destaques das companhias",
      blocos: [
        c.length
          ? `<div class="jebox">${jeFita("Destaques do trimestre", "empresas")}${c
              .slice(0, 6)
              .map((p) => {
                const u = (p.numeros || [])[0];
                return `<div class="jedt"><span class="jebadge">${jeEsc(jeTk(p))}</span><div><b>${jeEsc(p.titulo)}</b>${u ? `<span>${jeEsc(u.rotulo)}: ${jeEsc(u.valor)}</span>` : ""}</div></div>`;
              })
              .join("")}</div>`
          : "",
        jeGrafEmp(c),
        ...c.map((p) => jeMat(p)),
        jeVarr(),
        c[0] ? jeBarra("Fique de olho", c[0].por_que_importa) : "",
      ],
    });
  }
  {
    const c = (typeof JR < "u" && JR.data) || {},
      p = s.find(
        (x) => /^d[o\xf3]lar(?!.*futuro)/i.test(x.n || "") || x.k === "dolar",
      ),
      u = (x) =>
        Number(x).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + "%",
      m = [
        c.selic && c.selic.v != null
          ? ["Juros (Selic)", u(c.selic.v), "meta do Copom"]
          : null,
        c.cdi && c.cdi.v != null ? ["CDI", u(c.cdi.v), "ao ano"] : null,
        c.ipca12 && c.ipca12.v != null
          ? ["Inflação (IPCA)", u(c.ipca12.v), "em 12 meses"]
          : null,
        p
          ? [
              "Dólar comercial",
              "R$ " + jeNumTxt(p.px),
              p.d1 != null
                ? (p.d1 >= 0 ? "▲ +" : "▼ ") +
                  Number(p.d1).toFixed(2).replace(".", ",") +
                  "%"
                : "",
            ]
          : null,
      ].filter(Boolean);
    let f = "";
    try {
      f = c.curva && c.curva.length > 1 ? j2CurvaSvg(c.curva) : "";
    } catch {}
    (o.economia.length || m.length || e.analise) &&
      i.push({
        ico: "economia",
        tit: "Economia brasileira",
        sub: "Juros, câmbio e cenário fiscal",
        blocos: [
          m.length
            ? `<div class="jekpis n${m.length}">${m.map(([x, v, g]) => `<div><small>${jeEsc(x)}</small><b>${jeEsc(v)}</b><span>${jeEsc(g)}</span></div>`).join("")}</div>`
            : "",
          e.analise && e.analise.texto
            ? `<div class="${f ? "jeduo" : "jeuno"}"><div class="jebox"><b class="jebt">${jeEsc(e.analise.titulo || "Cenário")}</b><p class="jetx">${jeEsc(
                String(e.analise.texto)
                  .split(/\n\s*\n/)
                  .slice(0, 2)
                  .join(" ")
                  .slice(0, 900),
              )}</p></div>${f ? `<div class="jebox"><b class="jebt">Curva de juros (DI futuro)</b>${f}</div>` : ""}</div>`
            : f
              ? `<div class="jebox"><b class="jebt">Curva de juros (DI futuro)</b>${f}</div>`
              : "",
          ...o.economia.map((x) => jeMat(x)),
          o.economia[0]
            ? jeBarra("Por que importa", o.economia[0].por_que_importa)
            : "",
        ],
      });
  }
  (o.mundo.length || n.length || ["win", "wdo"].some((c) => jrTecDados(c))) &&
    i.push({
      ico: "mundo",
      tit: "Mercado internacional",
      sub: "O que movimenta o mundo",
      blocos: [
        n.length
          ? `<div class="jecots esc">${n
              .slice(0, 8)
              .map((c) => jeCot(c, 1))
              .join("")}</div>`
          : "",
        ...o.mundo.map((c) => jeMat(c)),
        jeTec(),
      ],
    });
  {
    const c = jrcAtivos();
    c.length &&
      i.push({
        ico: "carteira",
        tit: "Sua carteira",
        sub: "Análise fundamentalista e técnica de cada ativo",
        blocos: c.map((p) => `<div class="jebox">${jrcCard(p)}</div>`),
      });
  }
  {
    const c = e.agenda || [],
      p = c.filter((v) => /balan/i.test(v.evento || "")),
      u = c.filter((v) => !p.includes(v)),
      m = jrResumo(e),
      f = jrImpAgg(e),
      x = GATE_DICAS[new Date().getDate() % GATE_DICAS.length][0];
    i.push({
      ico: "agenda",
      tit: "Agenda econômica",
      sub: "Principais eventos e resumo do dia",
      blocos: [
        u.length
          ? `<table class="jetab jeag"><thead><tr><th>Quando</th><th>Evento</th><th>Por que importa</th></tr></thead><tbody>${u.map((v) => `<tr><td><b>${jeEsc(v.quando)}</b></td><td>${jeEsc(v.evento)}</td><td>${jeEsc(v.por_que || "")}</td></tr>`).join("")}</tbody></table>`
          : "",
        p.length
          ? `<div class="jebox">${jeFita("Eventos corporativos", "empresas")}<ul class="jelist">${p.map((v) => `<li><b>${jeEsc(v.quando)}</b> · ${jeEsc(String(v.evento).replace(/^Balan\xe7o:\s*/i, ""))}</li>`).join("")}</ul></div>`
          : "",
        f.length
          ? `<div class="jebox">${jeFita("Impacto nos ativos", "tec")}<div class="jeimp">${f
              .map((v) => {
                const [g, h] = JR_DIR[v.dir] || JR_DIR[""];
                return `<span class="jechip ${h}">${g} ${jeEsc(v.a)}${v.n > 1 ? " ×" + v.n : ""}</span>`;
              })
              .join("")}</div></div>`
          : "",
        `<div class="jeduo"><div class="jeresumo"><b>Resumo do dia</b><ul>${(m.length ? m : jrItens(e).slice(0, 4)).map((v) => `<li>${jeEsc(v.titulo)}</li>`).join("")}</ul></div><div class="jedica"><span>“${jeEsc(x)}”</span><small>Psicologia Financeira, Celso Sant'Ana</small></div></div>`,
        `<div class="jefim">${jeLogo(40)}<div><b>Jornal do Pregão</b><small>INFORMAÇÃO · MERCADOS · ANÁLISE</small></div><span>Edição escrita pela IA com pesquisa na internet e os números do app. Confira os fatos antes de repassar. Não é recomendação de investimento.</span></div>`,
      ],
    });
  }
  return i;
}
function jeCab(e, t) {
  const a = new Date(
    (e.dia || loc().slice(0, 10)) + "T12:00",
  ).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `<header class="jeh${t ? " capa" : ""}"><div class="jeh-l">${jeLogo(t ? 54 : 34)}<div><div class="jeh-n">Jornal do Pregão</div><div class="jeh-t">INFORMAÇÃO · MERCADOS · ANÁLISE</div></div></div><div class="jeh-r"><span class="cap1">${jeEsc(a)}</span><br>${jeEsc(e.nome || "")} | <span class="jepg"></span></div></header>`;
}
const jeUsado = (e) => {
    const t = e.lastElementChild;
    return t ? t.offsetTop - e.offsetTop + t.offsetHeight : 0;
  },
  jeEstoura = (e) => e.scrollHeight > e.clientHeight + 2;
function jeDivide(e, t) {
  const a = t.querySelector(".jetx");
  if (!a) return null;
  const o = t.outerHTML,
    s = a.textContent.split(/\s+/).filter(Boolean);
  if (s.length < 40) return null;
  const n = [...t.children],
    r = n.slice(n.indexOf(a) + 1);
  r.forEach((c) => c.remove());
  let i = 0,
    l = s.length;
  for (; i < l; ) {
    const c = Math.ceil((i + l) / 2);
    ((a.textContent = s.slice(0, c).join(" ") + " (continua)"),
      jeEstoura(e) ? (l = c - 1) : (i = c));
  }
  if (i < 25 || s.length - i < 12) return ((t.outerHTML = o), null);
  a.textContent = s.slice(0, i).join(" ") + " (continua)";
  const d = (t.querySelector("h3") || {}).textContent || "";
  return `<article class="jemat jecont"><div class="jechap">CONTINUAÇÃO · ${jeEsc(d)}</div><p class="jetx">${jeEsc(s.slice(i).join(" "))}</p>${r.map((c) => c.outerHTML).join("")}</article>`;
}
function jeMonta(e) {
  let t = document.getElementById("jeroot");
  (t && t.remove(),
    (t = document.createElement("div")),
    (t.id = "jeroot"),
    document.body.appendChild(t));
  const a = [],
    o = (n, r) => {
      const i = document.createElement("div");
      ((i.className = "jep"),
        (i.innerHTML =
          jeCab(e, n.capa && !r && !a.length) +
          '<div class="jeb"></div><footer class="jef"><span>Jornal do Pregão</span><span class="jepg"></span></footer>'),
        t.appendChild(i),
        a.push(i));
      const l = i.querySelector(".jeb");
      return (
        n.tit &&
          l.insertAdjacentHTML("beforeend", jeBan(n.ico, n.tit, n.sub, r)),
        l
      );
    };
  let s = null;
  for (const n of jeSecoes(e)) {
    s && !n.capa && s.clientHeight - jeUsado(s) >= s.clientHeight * 0.45
      ? (s.insertAdjacentHTML("beforeend", jeBan(n.ico, n.tit, n.sub, 0)),
        jeEstoura(s) && (s.lastElementChild.remove(), (s = o(n, 0))))
      : (s = o(n, 0));
    let r = s.children.length;
    for (const i of n.blocos) {
      if (!i) continue;
      s.insertAdjacentHTML("beforeend", i);
      let l = s.lastElementChild;
      if (!jeEstoura(s)) continue;
      const d =
        s.clientHeight - (l.offsetTop - s.offsetTop) >= 170
          ? jeDivide(s, l)
          : null;
      if (
        (d
          ? ((s = o(n, 1)),
            (r = s.children.length),
            s.insertAdjacentHTML("beforeend", d),
            (l = s.lastElementChild))
          : s.children.length - r > 1 &&
            (l.remove(),
            (s = o(n, 1)),
            (r = s.children.length),
            s.insertAdjacentHTML("beforeend", i),
            (l = s.lastElementChild)),
        jeEstoura(s))
      ) {
        const c = l.offsetTop - s.offsetTop;
        ((l.style.maxHeight = Math.max(80, s.clientHeight - c - 6) + "px"),
          l.classList.add("jecorta"));
      }
    }
  }
  return (
    a.forEach((n, r) =>
      n
        .querySelectorAll(".jepg")
        .forEach((i) => (i.textContent = `Página ${r + 1} de ${a.length}`)),
    ),
    { root: t, pages: a }
  );
}
async function jeH2c() {
  return (
    window.html2canvas ||
    (await pdfLib(
      "html2canvas",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      () => window.html2canvas,
    ))
  );
}
let JE_BUSY = 0;
{
  const e = jrPdf;
  jrPdf = async function () {
    const t = jrVer();
    if (!t || !t.manchete) return toast("Abra uma edição primeiro.");
    if (JE_BUSY) return;
    JE_BUSY = 1;
    let a = document.createElement("div");
    ((a.id = "jeov"),
      (a.innerHTML =
        "<div><b>Montando o jornal em PDF…</b><span>As páginas ficam prontas em alguns segundos.</span></div>"),
      document.body.appendChild(a));
    let o = null;
    try {
      const s = await jeH2c(),
        n = await rpLib();
      ((o = jeMonta(t)),
        window.TraderAssetIdentity?.decorate(o.root),
        await window.TraderAssetIdentity?.readyForExport?.(o.root),
        await new Promise((p) => setTimeout(p, 60)));
      const r = await n.PDFDocument.create();
      for (const p of o.pages) {
        const u = (
            await s(p, {
              scale: 2,
              backgroundColor: "#ffffff",
              logging: !1,
              useCORS: !0,
              width: JEPG.W,
              height: JEPG.H,
              windowWidth: JEPG.W,
            })
          ).toDataURL("image/jpeg", 0.9),
          m = atob(u.split(",")[1]),
          f = new Uint8Array(m.length);
        for (let v = 0; v < m.length; v++) f[v] = m.charCodeAt(v);
        const x = await r.embedJpg(f);
        r.addPage([595.28, 841.89]).drawImage(x, {
          x: 0,
          y: 0,
          width: 595.28,
          height: 841.89,
        });
      }
      r.setTitle("Jornal do Pregão · " + (t.dia || ""));
      const i = await r.save(),
        l = new Blob([i], { type: "application/pdf" }),
        d = `jornal-${t.dia || loc().slice(0, 10)}-${t.edicao || ""}.pdf`;
      ((window.__jrpdf = i.length),
        (window.__jrpdfPag = r.getPageCount()),
        (window.__jePag = o.pages.length),
        o.root.remove(),
        (o = null),
        a.remove(),
        (a = null),
        (JE_BUSY = 0));
      try {
        const p = new File([l], d, { type: "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [p] })) {
          await navigator.share({ files: [p], title: "Jornal do Pregão" });
          return;
        }
      } catch (p) {
        if (p && p.name === "AbortError") return;
      }
      const c = document.createElement("a");
      ((c.href = URL.createObjectURL(l)),
        (c.download = d),
        document.body.appendChild(c),
        c.click(),
        setTimeout(() => {
          (URL.revokeObjectURL(c.href), c.remove());
        }, 4e3),
        toast("PDF salvo."));
    } catch (s) {
      (o && o.root.remove(), a && a.remove(), (JE_BUSY = 0));
      try {
        errAdd("jornal · PDF editorial", s.message || s);
      } catch {}
      return (
        toast(
          "Sem internet para o layout editorial; gerando o PDF simples.",
          3500,
        ),
        e.apply(this, arguments)
      );
    } finally {
      JE_BUSY = 0;
    }
  };
}
{
  const e = TraderStyles.slot("legacy-125");
  ((e.id = "jornal162"),
    (e.textContent = TraderStyles.css("legacy-125", [JEPG.W, JEPG.W, JEPG.H])),
    TraderStyles.mount(e));
}
const EPEET = [
  ["Sinto-me seguro para encarar o mercado hoje", 1],
  ["Percebo meu corpo tenso e os músculos contraídos", -1],
  ["Minha respiração está lenta e tranquila", 1],
  ["Percebo-me ansioso para que minhas operações deem certo hoje", -1],
  ["Percebo não haver distrações em minha mente", 1],
  ["Sinto-me triste ou com raiva pelas minhas perdas passadas", -1],
  ["Acredito que estou focado e sou capaz de me enxergar alcançando a meta", 1],
  ["Percebo meu corpo agitado e inquieto", -1],
  ["Percebo que estou no controle de meus pensamentos", 1],
  ["Sinto-me sonolento e cansado", -1],
  ["Sinto-me despreocupado com relação à minha situação financeira", 1],
  ["Estou com preocupações da vida cotidiana em minha mente", -1],
  ["Percebo meu corpo descansado e relaxado", 1],
  ['Me vejo "batendo meta" ou "stopando" ainda na abertura', -1],
];
function epeetNota(e) {
  e = e || {};
  const t = EPEET.filter((r, i) => +e[i] >= 1 && +e[i] <= 5).length;
  if (!t) return null;
  let a = 0;
  EPEET.forEach(([, r], i) => {
    const l = +e[i];
    l >= 1 && l <= 5 && (a += r > 0 ? l : 6 - l);
  });
  const o = t === 14 ? a : Math.round((a / t) * 14),
    s = o >= 52 ? "up" : o <= 32 ? "dn" : "eq",
    n = o >= 52 ? "estável" : o <= 32 ? "instável" : "neutro";
  return { n: o, q: t, cls: s, txt: n };
}
function epeetHtml(e) {
  const t = e.epeet || {},
    a = epeetNota(t);
  return `<div class="gsec"><b>5. Escala emocional <span class="sm mut">(opcional)</span></b>
<p class="sm mut" style="margin:4px 0 8px">1 discordo completamente · 2 discordo parcialmente · 3 indiferente · 4 concordo parcialmente · 5 concordo completamente</p>
${EPEET.map(([o], s) => `<div class="epq"><span>${s + 1}. ${esc(o)}</span><div class="epb">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${+t[s] === n ? "on" : ""}" data-ep="${s}" data-epv="${n}" aria-label="${n}">${n}</button>`).join("")}</div></div>`).join("")}
${a ? `<div class="epres ${a.cls}">Termômetro: <b>${a.n} de 70</b> · ${a.txt}${a.q < 14 ? ` <span class="sm">(${a.q} de 14 respondidas; a conta estima o total)</span>` : ""}</div>` : ""}
<div class="sm mut" style="margin-top:6px">Afirmações da escala EPEET-14 (Psicologia Financeira, Celso Sant'Ana). A conta é simplificada pelo app: as afirmações de mau estado contam ao contrário, de 14 (instável) a 70 (estável). Não é a pontuação oficial da escala.</div></div>`;
}
{
  const e = gateEstado;
  gateEstado = function () {
    const t = e.apply(this, arguments);
    if (t) return t.tipo === "manha" ? { ...t, pronto: !1 } : t;
    const a = new Date(),
      o = a.getDay(),
      s = a.getHours();
    if (o === 0 || o === 6 || s < 8 || s >= 17) return null;
    const n = GATE_D(),
      r = S.days[n] || {};
    return r.ckok
      ? null
      : {
          tipo: "manha",
          falta: [],
          dia: r,
          c: r.chk || {},
          cl: r.cl || {},
          pronto: !0,
        };
  };
}
{
  const e = gateManhaHtml;
  gateManhaHtml = function (t) {
    let a = e.apply(this, arguments);
    const o = a.indexOf('<div class="gdica');
    o > 0 && (a = a.slice(0, o) + epeetHtml(t.dia || {}) + a.slice(o));
    const s = `<button type="button" class="btn gfim" data-gate-fim="1"${t.pronto ? "" : " disabled"}>${t.pronto ? "Concluir checklist e começar o dia" : "Preencha o obrigatório para concluir"}</button>`;
    return a.replace(/<\/div>\s*$/, s + "</div>");
  };
}
{
  const e = gateAtualiza;
  gateAtualiza = function () {
    const t = document.getElementById("gateov"),
      a = t ? t.scrollTop : 0,
      o = e.apply(this, arguments),
      s = document.getElementById("gateov");
    return (s && a && (s.scrollTop = a), o);
  };
}
document.addEventListener("click", (e) => {
  var t, a;
  const o = e.target.closest && e.target.closest("#gateov [data-ep]");
  if (o) {
    const n = GATE_D(),
      r = (t = S.days)[n] ?? (t[n] = { chk: {} });
    (((r.epeet ?? (r.epeet = {}))[o.dataset.ep] = +o.dataset.epv),
      (r.u = Date.now()),
      save(),
      gateAtualiza());
    return;
  }
  const s = e.target.closest && e.target.closest("#gateov [data-gate-fim]");
  if (s) {
    if (s.disabled) return;
    const n = GATE_D(),
      r = (a = S.days)[n] ?? (a[n] = { chk: {} });
    ((r.ckok = Date.now()),
      (r.u = Date.now()),
      save(),
      gateAtualiza(),
      toast("Preparo obrigatório concluído. Bom pregão."));
  }
});
{
  const e = checklistLinhas;
  checklistLinhas = function () {
    const t = e.apply(this, arguments);
    t[0].push("escala emocional (14 a 70)", "checklist concluído");
    for (let a = 1; a < t.length; a++) {
      const o = S.days[t[a][0]] || {},
        s = epeetNota(o.epeet);
      t[a].push(s ? s.n : "", o.ckok ? "sim" : "não");
    }
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-090");
  ((e.id = "diario163"),
    (e.textContent = TraderStyles.css("legacy-090")),
    TraderStyles.mount(e));
}
async function jvPdfBytes(...args) {
  await DiarioChunks.load("pdf-documentos.js");
  return DiarioChunks.functions.jvPdfBytes.apply(this, args);
}
{
  const e = jrPdf;
  jrPdf = async function () {
    const t = jrVer();
    if (!t || !t.manchete) return toast("Abra uma edição primeiro.");
    toast("Montando o PDF do jornal…", 2200);
    try {
      const { bytes: a, paginas: o } = await jvPdfBytes(t),
        s = new Blob([a], { type: "application/pdf" }),
        n = `jornal-${t.dia || loc().slice(0, 10)}-${t.edicao || ""}.pdf`;
      ((window.__jrpdf = a.length),
        (window.__jrpdfPag = o),
        (window.__jvPag = o));
      try {
        const i = new File([s], n, { type: "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [i] })) {
          await navigator.share({ files: [i], title: "Jornal do Pregão" });
          return;
        }
      } catch (i) {
        if (i && i.name === "AbortError") return;
      }
      const r = document.createElement("a");
      ((r.href = URL.createObjectURL(s)),
        (r.download = n),
        document.body.appendChild(r),
        r.click(),
        setTimeout(() => {
          (URL.revokeObjectURL(r.href), r.remove());
        }, 4e3),
        toast("PDF salvo."));
    } catch (a) {
      try {
        errAdd("jornal · PDF editorial (vetor)", a.message || a);
      } catch {}
      return e.apply(this, arguments);
    }
  };
}
function jvFotoImg(e) {
  return (async () => {
    for (const t of e) {
      const a = await new Promise((o) => {
        const s = new Image();
        ((s.onload = () => o(s.naturalWidth ? s : null)),
          (s.onerror = () => o(null)),
          (s.src = t));
      });
      if (a) return a;
    }
    return null;
  })();
}
function jvCrop(e, t, a = 1e3, o = 0.3) {
  try {
    const s = e.naturalWidth,
      n = e.naturalHeight;
    let r = s,
      i = s / t;
    i > n && ((i = n), (r = n * t));
    const l = (s - r) / 2,
      d = (n - i) * o,
      c = Math.min(a, Math.round(r)),
      p = Math.round(c / t),
      u = document.createElement("canvas");
    ((u.width = c),
      (u.height = p),
      u.getContext("2d").drawImage(e, l, d, r, i, 0, 0, c, p));
    const m = u.toDataURL("image/jpeg", 0.9),
      f = atob(m.split(",")[1]),
      x = new Uint8Array(f.length);
    for (let v = 0; v < f.length; v++) x[v] = f.charCodeAt(v);
    return x;
  } catch {
    return null;
  }
}
async function jvFotoBytes(e, t) {
  for (const a of e)
    try {
      const o = await fetch(a, { cache: "no-cache" }),
        s = (o.headers.get("content-type") || "").toLowerCase();
      if (!o.ok || !/image\/(jpe?g|png)/.test(s)) continue;
      const n = new Uint8Array(await o.arrayBuffer());
      if (n.length < 200) continue;
      return { bytes: n, png: /png/.test(s) };
    } catch (o) {
      t && jvFotoErro(a + ": " + (o.message || o));
    }
  return (
    t && jvFotoErro("nenhuma foto da capa encontrada (" + e.join(", ") + ")"),
    null
  );
}
function jvFotoErro(e) {
  try {
    errAdd("jornal · foto do PDF", e);
  } catch {}
  try {
    (window.__jvFotoErros ?? (window.__jvFotoErros = [])).push(String(e));
  } catch {}
}
const JV_FOTOS = [
  "diario",
  "empresas",
  "economia",
  "mundo",
  "carteira",
  "agenda",
];
{
  const e = jrMateria;
  jrMateria = function (t, a, o) {
    let s = e.apply(this, arguments);
    try {
      o &&
        t &&
        t.titulo &&
        (s = s.replace(
          /<figure class="jrilu"[\s\S]*?<\/figure>/,
          `<figure class="jrilu jrfoto" aria-hidden="true"><span>${esc(String(t.editoria || "").toUpperCase())}</span></figure>`,
        ));
    } catch {}
    return s;
  };
}
{
  const e = TraderStyles.slot("legacy-091");
  ((e.id = "jornal165"),
    (e.textContent = TraderStyles.css("legacy-091")),
    TraderStyles.mount(e));
}
const jrDM = (e) => (e ? e.slice(8, 10) + "/" + e.slice(5, 7) : ""),
  jrFmtR = (e) =>
    (e >= 0 ? "+" : "") + Number(e).toFixed(2).replace(".", ",") + "×";
function jrOntem() {
  const e = loc().slice(0, 10),
    t = (m) => String(m.dtx || m.dt || "").slice(0, 10),
    a = (S.trades || []).filter((m) => {
      try {
        return calc(m).pl != null;
      } catch {
        return !1;
      }
    }),
    o = [
      ...new Set(
        a.map(t).filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m) && m < e),
      ),
    ].sort(),
    s = o[o.length - 1];
  if (!s) return null;
  const n = a.filter((m) => t(m) === s),
    r = n.map((m) => ({ t: m, c: calc(m) })),
    i = r.reduce((m, f) => {
      let x = 0;
      try {
        x = emBRL(f.c.pl, moedaT(f.t));
      } catch {
        x = f.c.pl;
      }
      return m + (+x || 0);
    }, 0),
    l = r.map((m) => m.c.r).filter((m) => m != null && isFinite(m)),
    d = r.filter((m) => m.c.pl > 0).length,
    c = [
      ...new Set(
        n
          .flatMap((m) => String(m.err || "").split(/\s*[,;|]\s*/))
          .filter((m) => m && m !== "Nenhum"),
      ),
    ],
    p = S.days[s] || {};
  let u = null;
  try {
    u = epeetNota(p.epeet);
  } catch {}
  return {
    d: s,
    n: n.length,
    brl: i,
    R: l.reduce((m, f) => m + f, 0),
    temR: l.length > 0,
    acerto: n.length ? Math.round((d / n.length) * 100) : 0,
    erros: c,
    fora: n.filter((m) => m.rules === "n").length,
    estado: p.estado || null,
    ep: u,
    ckok: !!p.ckok,
    posop: !!p.posop,
  };
}
function jrHoje() {
  const e = loc().slice(0, 10),
    t = S.days[e] || {};
  let a = null,
    o = 0,
    s = null;
  try {
    a = janTurno(e);
  } catch {}
  try {
    o = limPerda(t);
  } catch {}
  try {
    s = travaEstado();
  } catch {}
  const n = new Date().getDay(),
    r = n === 0 || n === 6,
    i = r
      ? "eq"
      : a
        ? a.nv === "r"
          ? "dn"
          : a.nv === "g"
            ? "up"
            : "eq"
        : "up",
    l = r
      ? "Fim de semana: bolsa fechada"
      : i === "dn"
        ? "Hoje: não opere"
        : i === "eq"
          ? "Hoje: opere com cautela"
          : "Hoje: dia de operar",
    d = r
      ? "Bom dia para estudar e revisar a semana."
      : a
        ? a.txt
        : "Sem escala de turno cadastrada. Cadastre em Meu dia para o jornal avisar os dias de turno.";
  return {
    nv: i,
    tit: l,
    msg: d,
    lp: o,
    ck: !!t.ckok,
    trava: s ? !!s.travado : null,
  };
}
function jrHojeHtml() {
  const e = jrHoje();
  return `<section class="jrsec jrhoje"><h3>Hoje você opera?</h3><div class="jrhoje-c ${e.nv}"><b>${esc(e.tit)}</b><span>${esc(e.msg)}</span></div>
<div class="jrkp3"><div><small>Limite de perda hoje</small><b>${e.lp > 0 ? money(e.lp) : "não definido"}</b></div><div><small>Checklist da manhã</small><b class="${e.ck ? "g" : "r"}">${e.ck ? "concluído" : "pendente"}</b></div>${e.trava != null ? `<div><small>Trava do app</small><b class="${e.trava ? "r" : "g"}">${e.trava ? "travado" : "liberado"}</b></div>` : ""}</div></section>`;
}
function jrOntemHtml() {
  const e = jrOntem();
  if (!e) return "";
  const t = e.brl > 0 ? "up" : e.brl < 0 ? "dn" : "eq";
  return `<section class="jrsec jrmeu"><h3>Seu pregão de ${jrDM(e.d)}</h3><div class="jrkp4">
<div class="${t}"><small>Resultado</small><b>${money(e.brl)}</b>${e.temR ? `<span>${jrFmtR(e.R)}</span>` : ""}</div>
<div><small>Trades</small><b>${e.n}</b><span>acerto ${e.acerto}%</span></div>
<div class="${e.fora ? "dn" : "up"}"><small>Fora das regras</small><b>${e.fora}</b><span>${e.fora ? "reveja o que levou a isso" : "disciplina em dia"}</span></div>
<div><small>Estado antes</small><b>${e.estado ? e.estado + "/5" : "–"}</b>${e.ep ? `<span>escala ${e.ep.n} · ${e.ep.txt}</span>` : ""}</div></div>
${e.erros.length ? `<div class="sm" style="margin-top:8px"><b>Erros marcados:</b> ${esc(e.erros.join(", "))}</div>` : '<div class="sm mut" style="margin-top:8px">Nenhum erro marcado nesse dia.</div>'}
${e.posop ? "" : '<div class="sm am" style="margin-top:4px">O diário pós-operação desse dia ficou sem conferir.</div>'}</section>`;
}
function jrPlano(e) {
  const t = jrTecDados(e);
  if (!t) return null;
  const a = t.H - t.L;
  return { ...t, R2: t.P + a, S2: t.P - a, hoje: t.dia === loc().slice(0, 10) };
}
function jrPre() {
  try {
    const e = MDO && MDO.v && MDO.v.pre;
    return !e || !e.vies
      ? null
      : {
          vies: e.vies,
          nota: e.nota,
          itens: (e.itens || [])
            .slice()
            .sort((t, a) => Math.abs(a.sinal || 0) - Math.abs(t.sinal || 0))
            .slice(0, 4),
        };
  } catch {
    return null;
  }
}
jrTecHtml = function () {
  const e = ["win", "wdo"].map(jrPlano).filter(Boolean),
    t = jrPre();
  if (!e.length && !t)
    return '<section class="jrsec jrtec" id="jrtec" hidden></section>';
  const a = (o) => {
    const s = (r) => jrNumF(r, o.div),
      n = o.tend === "Alta" ? "up" : o.tend === "Baixa" ? "dn" : "eq";
    return `<div class="jrtc"><div class="jrtc-h"><b>${esc(o.tk)}</b><span class="jrtag ${n}">${o.tend}</span></div>
<div class="jrniv"><div class="dn"><small>R2</small><b>${s(o.R2)}</b></div><div class="dn"><small>R1</small><b>${s(o.R1)}</b></div><div><small>Pivô</small><b>${s(o.P)}</b></div><div class="up"><small>S1</small><b>${s(o.S1)}</b></div><div class="up"><small>S2</small><b>${s(o.S2)}</b></div></div>
<div class="jrcen"><p><b class="g">Alta:</b> acima de ${s(o.R1)}, o próximo alvo é ${s(o.R2)}. Perder o pivô (${s(o.P)}) enfraquece a alta.</p><p><b class="r">Baixa:</b> abaixo de ${s(o.S1)}, o próximo alvo é ${s(o.S2)}. Voltar acima do pivô enfraquece a queda.</p></div>
<div class="sm mut">${o.hoje ? "Níveis do pregão de hoje (ainda em andamento)." : "Calculado com a máxima, a mínima e o fechamento do pregão de " + jrDM(o.dia) + "."}</div></div>`;
  };
  return `<section class="jrsec jrtec" id="jrtec"><h3>Plano do pregão: WIN e WDO</h3>${t ? `<div class="jrpre ${t.vies === "positivo" ? "up" : t.vies === "negativo" ? "dn" : "eq"}"><b>Viés da pré-abertura: ${esc(t.vies)}${t.nota != null ? ` (nota ${esc(String(t.nota))})` : ""}</b>${t.itens.length ? `<ul>${t.itens.map((o) => `<li>${esc(o.n)} <span class="${o.d1 > 0 ? "g" : o.d1 < 0 ? "r" : "mut"}">${o.d1 != null ? (o.d1 > 0 ? "+" : "") + Number(o.d1).toFixed(2).replace(".", ",") + "%" : ""}</span> · ${esc(o.efeito || "")}</li>`).join("")}</ul>` : ""}</div>` : ""}${e.length ? `<div class="jrtcs">${e.map(a).join("")}</div>` : ""}<div class="sm mut" style="margin-top:8px">Pivô clássico: P = (máxima + mínima + fechamento) ÷ 3; R1 = 2P − mínima; S1 = 2P − máxima; R2 e S2 somam e subtraem a amplitude do pregão. Contexto, não é recomendação.</div></section>`;
};
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      if (!JRN.v || !JRN.v.manchete) return t;
      const a = jrHojeHtml() + jrOntemHtml(),
        o = t.indexOf('<section class="jrsec jrmkt">');
      if (o >= 0) {
        const s = t.indexOf("</section>", o);
        if (s > 0) {
          const n = s + 10;
          t = t.slice(0, n) + a + t.slice(n);
        }
      } else {
        const s = t.indexOf("<article");
        s > 0 && (t = t.slice(0, s) + a + t.slice(s));
      }
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-092");
  ((e.id = "jornal166"),
    (e.textContent = TraderStyles.css("legacy-092")),
    TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v233";
const JRMD = () => {
  try {
    return APP_STORAGE.getItem("diario-jr-meudia") === "1";
  } catch {
    return !1;
  }
};
{
  const e = jrHojeHtml;
  jrHojeHtml = function () {
    return JRMD()
      ? e
          .apply(this, arguments)
          .replace(
            "<h3>Hoje você opera?</h3>",
            '<h3 class="jrh3b">Hoje você opera? <button class="lnk" data-jrmd="0">ocultar</button></h3>',
          )
      : '<div class="jrmdbar"><button class="btn s" data-jrmd="1">👤 Mostrar meu dia no jornal</button><span class="sm mut">turno, limite de perda e seu pregão anterior (aparece também no PDF)</span></div>';
  };
}
{
  const e = jrOntemHtml;
  jrOntemHtml = function () {
    return JRMD() ? e.apply(this, arguments) : "";
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("[data-jrmd]");
  if (t) {
    try {
      APP_STORAGE.setItem("diario-jr-meudia", t.dataset.jrmd);
    } catch {}
    jrPinta();
  }
});
const jrPctTx = (e) =>
    e == null || !isFinite(e)
      ? "–"
      : (e > 0 ? "▲ +" : e < 0 ? "▼ " : "■ ") +
        Number(e).toFixed(2).replace(".", ",") +
        "%",
  jrPxTx = (e) =>
    e == null || !isFinite(e)
      ? "–"
      : Number(e).toLocaleString("pt-BR", {
          maximumFractionDigits:
            Math.abs(e) >= 1e3 ? 0 : Math.abs(e) < 10 ? 4 : 2,
        });
function jr5Html(e) {
  const t = (e.cinco_coisas || []).filter((a) => a && a.titulo);
  return t.length
    ? `<section class="jrsec jr5"><h3>5 coisas para saber antes da abertura</h3><ol class="jr5l">${t.map((a) => `<li><b>${esc(a.titulo)}</b>${a.texto ? `<span>${esc(a.texto)}</span>` : ""}</li>`).join("")}</ol></section>`
    : "";
}
function jrFechHtml(e) {
  const t = (e.cotacoes || []).filter((a) => a && a.px != null);
  return t.length
    ? `<section class="jrsec jrfech"><h3>Fechamento da véspera</h3>${e.fechamento_texto ? `<p class="jrtx2">${esc(e.fechamento_texto)}</p>` : ""}<div class="jrvtab"><table><thead><tr><th>Ativo</th><th>Último</th><th>Variação</th></tr></thead><tbody>${t.map((a) => `<tr><td><b>${esc(a.n || a.k)}</b></td><td>${jrPxTx(a.px)}</td><td class="${a.d1 > 0 ? "g" : a.d1 < 0 ? "r" : "mut"}"><b>${jrPctTx(a.d1)}</b></td></tr>`).join("")}</tbody></table></div></section>`
    : "";
}
function jrIndHtml(e) {
  const t = (typeof JR < "u" && JR.data) || {},
    a = (n) =>
      Number(n).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%",
    o = (e.cotacoes || [])
      .filter((n) =>
        /\bdi\b|di\d|jan\/\d/i.test((n.n || "") + " " + (n.k || "")),
      )
      .slice(0, 2),
    s = [
      t.selic && t.selic.v != null
        ? ["Selic", a(t.selic.v), "meta do Copom"]
        : null,
      t.cdi && t.cdi.v != null ? ["CDI", a(t.cdi.v), "ao ano"] : null,
      t.ipca12 && t.ipca12.v != null
        ? ["IPCA", a(t.ipca12.v), "em 12 meses"]
        : null,
      ...o.map((n) => [n.n || n.k, a(n.px), n.d1 != null ? jrPctTx(n.d1) : ""]),
    ].filter(Boolean);
  if (!s.length) {
    try {
      JR.data || jrLoad(!1);
    } catch {}
    return "";
  }
  return `<section class="jrsec jrind2"><h3>Indicadores</h3><div class="jrkp4">${s.map(([n, r, i]) => `<div><small>${esc(n)}</small><b>${esc(r)}</b><span>${esc(i)}</span></div>`).join("")}</div></section>`;
}
function jrGdHtml(e) {
  const t = e.grafico_do_dia;
  return !t || !t.ativo
    ? ""
    : `<section class="jrsec jrgd"><h3>Gráfico do dia</h3>${t.titulo ? `<h2 class="jrtit">${esc(t.titulo)}</h2>` : ""}${t.texto ? `<p class="jrtx2">${esc(t.texto)}</p>` : ""}${jrGrafHtml(t.ativo === "di" ? "di" : t.ativo)}</section>`;
}
function jrPlacarL(e) {
  const t = jrEdOcultas();
  return (e.materias || []).filter(
    (a) =>
      a &&
      a.editoria === "Empresas" &&
      !t.includes(a.editoria) &&
      (a.placar || a.consenso || /balan/i.test(a.chapeu || "")),
  );
}
const JR_PLC = {
  acima: ["acima do esperado", "up"],
  "em linha": ["em linha", "eq"],
  abaixo: ["abaixo do esperado", "dn"],
};
function jrPlacarHtml(e) {
  const t = jrPlacarL(e);
  return t.length
    ? `<section class="jrsec jrplacar"><h3>Placar dos balanços</h3>${t
        .map((a) => {
          const o = JR_PLC[a.placar];
          return `<div class="jrplc"><span class="jrbdg">${esc(jeTk(a))}</span><div><b>${esc(a.titulo)}</b>${a.consenso ? `<span class="sm mut">${esc(a.consenso)}</span>` : ""}</div>${o ? `<span class="jrtag ${o[1]}">${o[0]}</span>` : '<span class="jrtag eq">sem consenso</span>'}</div>`;
        })
        .join(
          "",
        )}<div class="sm mut" style="margin-top:6px">Comparação com a expectativa dos analistas, quando a pesquisa encontrou o consenso.</div></section>`
    : "";
}
let JR_RK_T = 0;
function jrRkHtml() {
  try {
    typeof RK < "u" &&
      !RK.v &&
      !RK.busy &&
      Date.now() - JR_RK_T > 10 * 6e4 &&
      ((JR_RK_T = Date.now()),
      Promise.resolve(rkCarrega(!1))
        .then(() => jrPinta())
        .catch(() => {}));
  } catch {}
  const e = typeof RK < "u" && RK.v;
  if (!e) return "";
  const t = (e.altas || [])
      .filter((s) => s.var > 0)
      .sort((s, n) => n.var - s.var)
      .slice(0, 5),
    a = (e.baixas || [])
      .filter((s) => s.var < 0)
      .sort((s, n) => s.var - n.var)
      .slice(0, 5);
  if (!t.length && !a.length) return "";
  const o = (s, n) =>
    s
      .map(
        (r) =>
          `<div class="jrrk"><b>${esc(r.tk)}</b><span class="sm mut">${esc(r.nome || "")}</span><b class="${n}">${(r.var > 0 ? "+" : "") + Number(r.var).toFixed(2).replace(".", ",")}%</b></div>`,
      )
      .join("");
  return `<section class="jrsec jrrks"><h3>Maiores altas e baixas do Ibovespa</h3><div class="jrrk2"><div><div class="jrrkt g">▲ Altas</div>${o(t, "g")}</div><div><div class="jrrkt r">▼ Baixas</div>${o(a, "r")}</div></div></section>`;
}
function jrMesaHtml(e) {
  const t = e.mesa;
  return !t || !t.texto
    ? ""
    : `<section class="jrsec jrmesa"><h3>Coluna da mesa</h3>${t.titulo ? `<h2 class="jrtit">${esc(t.titulo)}</h2>` : ""}<div class="jrtxt">${jrPar(t.texto)}</div><div class="sm mut">Opinião da redação, com os dados do dia. Não é recomendação de investimento.</div></section>`;
}
const JR_IMP = {
  alto: ["Alto", "dn"],
  medio: ["Médio", "eq"],
  baixo: ["Baixo", "up"],
};
function jrObsHtml(e) {
  const t = e.agenda || [];
  return t.length
    ? `<section class="jrsec jragenda"><h3>O que observar hoje · Agenda econômica</h3>${t
        .map((a) => {
          const o = JR_IMP[a.impacto];
          return `<div class="jrob"><div class="jrob-h"><b>${esc(a.quando || "")}</b>${a.pais ? `<span>${esc(a.pais)}</span>` : ""}${o ? `<span class="jrtag ${o[1]}">impacto ${o[0].toLowerCase()}</span>` : ""}</div><div class="jrob-e">${esc(a.evento)}</div>${a.consenso || a.anterior ? `<div class="jrob-n">${a.consenso ? `Consenso: <b>${esc(a.consenso)}</b>` : ""}${a.consenso && a.anterior ? " · " : ""}${a.anterior ? `Anterior: <b>${esc(a.anterior)}</b>` : ""}</div>` : ""}${a.por_que ? `<div class="sm mut">${esc(a.por_que)}</div>` : ""}</div>`;
        })
        .join(
          "",
        )}<button class="btn s" data-hub="mercado:ag" style="margin-top:8px">Agenda completa</button></section>`
    : "";
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = JRN.v;
      if (!a || !a.manchete) return t;
      const o = jr5Html(a) + jrFechHtml(a) + jrIndHtml(a) + jrGdHtml(a),
        s = t.indexOf("<article");
      s > 0 && (t = t.slice(0, s) + o + t.slice(s));
      const n = t.search(/<section class="jrsec jragenda">/),
        r = jrPlacarHtml(a) + jrRkHtml() + jrMesaHtml(a);
      if (n >= 0) {
        const i = t.indexOf("</section>", n);
        t = t.slice(0, n) + r + jrObsHtml(a) + t.slice(i + 10);
      } else {
        const i = t.indexOf('<section class="jrsec"><h3>Giro do pregão</h3>'),
          l = r + jrObsHtml(a);
        i > 0 ? (t = t.slice(0, i) + l + t.slice(i)) : (t += l);
      }
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-093");
  ((e.id = "jornal167"),
    (e.textContent = TraderStyles.css("legacy-093")),
    TraderStyles.mount(e));
}
FN_ESPERADA.juros = "v125";
function jrFocusRows() {
  const e = (typeof JR < "u" && JR.data && JR.data.focus) || null;
  if (!e) return null;
  const t = Object.keys(e.ipca || e.selic || {}).sort(),
    a = t[0],
    o = t[1];
  if (!a) return null;
  const s = (l, d, c) => {
      const p = e[l] || {},
        u = (e.ant || {})[l] || {};
      return p[a] == null && p[o] == null
        ? null
        : { k: l, nome: d, f: c, v1: p[a], v2: p[o], p1: u[a], p2: u[o] };
    },
    n = (l) =>
      Number(l).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%",
    r = (l) =>
      "R$ " +
      Number(l).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    i = [
      s("ipca", "IPCA", n),
      s("selic", "Selic (fim do ano)", n),
      s("pib", "PIB", n),
      s("cambio", "Dólar (fim do ano)", r),
    ].filter(Boolean);
  return i.length
    ? { a1: a, a2: o, L: i, data: e.data, reu: e.reuniao, i12: e.ipca12m }
    : null;
}
const jrFocusSeta = (e, t) =>
  e == null || t == null ? "" : e > t ? "▲" : e < t ? "▼" : "=";
function jrFocusHtml() {
  const e = jrFocusRows();
  if (!e) {
    try {
      JR.data || jrLoad(!1);
    } catch {}
    return "";
  }
  const t = (a, o, s) =>
    a == null
      ? "–"
      : `${s(a)}${o != null && o !== a ? ` <small class="mut">${jrFocusSeta(a, o)} era ${s(o)}</small>` : ""}`;
  return `<section class="jrsec jrfocus"><h3>Boletim Focus</h3><div class="jrvtab"><table><thead><tr><th>Projeção do mercado</th><th>${esc(e.a1)}</th><th>${esc(e.a2 || "")}</th></tr></thead><tbody>${e.L.map((a) => `<tr><td><b>${esc(a.nome)}</b></td><td>${t(a.v1, a.p1, a.f)}</td><td>${t(a.v2, a.p2, a.f)}</td></tr>`).join("")}</tbody></table></div>
${e.reu ? `<div class="sm" style="margin-top:6px">Próxima reunião do Copom (${esc(e.reu.reuniao)}): o mercado espera a Selic em <b>${Number(e.reu.mediana).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</b>.</div>` : ""}
${e.i12 ? `<div class="sm">IPCA esperado para os próximos 12 meses: <b>${Number(e.i12.v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</b>.</div>` : ""}
<div class="sm mut" style="margin-top:4px">Mediana das projeções dos economistas consultados pelo Banco Central${e.data ? " · dados de " + jrDM(e.data) + "/" + e.data.slice(0, 4) : ""}. ▲▼ = mudança contra a semana anterior.</div></section>`;
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      if (!JRN.v || !JRN.v.manchete) return t;
      const a = jrFocusHtml();
      if (!a) return t;
      const o = t.indexOf('<section class="jrsec jrind2">');
      if (o >= 0) {
        const s = t.indexOf("</section>", o) + 10;
        t = t.slice(0, s) + a + t.slice(s);
      } else {
        const s = t.indexOf("<article");
        s > 0 && (t = t.slice(0, s) + a + t.slice(s));
      }
    } catch {}
    return t;
  };
}
const FIN_CAT = [
    "Alimentação",
    "Mercado",
    "Transporte",
    "Casa e contas",
    "Saúde",
    "Lazer",
    "Besteiras e impulso",
    "Assinaturas",
    "Educação",
    "Casamento",
    "Outros",
  ],
  finNum = (e) => {
    let t = String(e ?? "")
      .trim()
      .replace(/[R$\s]/g, "");
    t.includes(",") && (t = t.replace(/\./g, "").replace(",", "."));
    const a = +t;
    return isFinite(a) ? a : NaN;
  },
  FIN_FORMAS = ["Pix", "Débito", "Dinheiro", "Boleto"],
  FIN = { t: "plano", m: loc().slice(0, 7) },
  finD = () => {
    var e;
    const t = S.fin ?? (S.fin = {});
    return (
      t.g ?? (t.g = []),
      t.res ?? (t.res = []),
      t.cas ?? (t.cas = { meta: 6e4, ap: [], data: "" }),
      (e = t.cas).ap ?? (e.ap = []),
      +t.cas.meta > 0 || (t.cas.meta = 6e4),
      t.renda ?? (t.renda = {}),
      t
    );
  },
  finMes = (e, t) => {
    const [a, o] = e.split("-").map(Number);
    return new Date(Date.UTC(a, o - 1 + t, 1)).toISOString().slice(0, 7);
  },
  finNomeMes = (e) => {
    const t = new Date(e + "-15T12:00").toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  fm0 = (e) =>
    (e < 0 ? "-" : "") +
    "R$ " +
    Math.round(Math.abs(+e || 0)).toLocaleString("pt-BR"),
  finSoma = (e) => e.reduce((t, a) => t + (+a.v || 0), 0);
function finMedia3() {
  const e = finD(),
    t = loc().slice(0, 7),
    a = [1, 2, 3].map((s) => finMes(t, -s)),
    o = a
      .map((s) => finSoma(e.g.filter((n) => String(n.d).startsWith(s))))
      .filter((s) => s > 0);
  return o.length ? o.reduce((s, n) => s + n, 0) / o.length : 0;
}
function finRitmo(e) {
  const t = loc().slice(0, 7),
    a = [0, 1, 2]
      .map((o) => finMes(t, -o))
      .map((o) => finSoma(e.filter((s) => String(s.d).startsWith(o))))
      .reduce((o, s) => o + s, 0);
  return a > 0 ? a / 3 : 0;
}
function finPrev(e, t) {
  if (e <= 0) return "Meta batida! 🎉";
  if (!(t > 0))
    return "Lance depósitos para o app estimar quando você chega lá.";
  const a = Math.ceil(e / t),
    o = new Date();
  return (
    o.setMonth(o.getMonth() + a),
    `No ritmo atual (${money(t)}/mês), você chega lá em ${a} ${a > 1 ? "meses" : "mês"} (${o.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}).`
  );
}
const finBarra = (e, t) =>
    `<div class="finbar"><div style="width:${Math.max(0, Math.min(100, e * 100)).toFixed(1)}%;background:${t || "var(--g)"}"></div></div>`,
  finChips = () =>
    `<div class="finchips">${[
      ["plano", "📈 Plano"],
      ["gastos", "💳 Gastos"],
      ["res", "🛟 Reserva"],
      ["cas", "💍 Casamento"],
    ]
      .map(
        ([e, t]) =>
          `<button type="button" class="${FIN.t === e ? "on" : ""}" data-fin-t="${e}">${t}</button>`,
      )
      .join("")}</div>`;
function finGastosHtml() {
  const e = finD(),
    t = FIN.m,
    a = e.g
      .filter((m) => String(m.d).startsWith(t))
      .sort((m, f) => String(f.d).localeCompare(String(m.d))),
    o = finSoma(a),
    s = finSoma(e.g.filter((m) => String(m.d).startsWith(finMes(t, -1)))),
    n = +e.renda[t] || 0,
    r = FIN_CAT.map((m) => [m, finSoma(a.filter((f) => f.cat === m))])
      .filter((m) => m[1] > 0)
      .sort((m, f) => f[1] - m[1]),
    i = r.length ? r[0][1] : 1,
    l = [
      ...new Set([...FIN_FORMAS, ...e.g.map((m) => m.cart).filter(Boolean)]),
    ],
    d = [...new Set(a.map((m) => m.cart || "Sem forma"))]
      .map((m) => [m, finSoma(a.filter((f) => (f.cart || "Sem forma") === m))])
      .sort((m, f) => f[1] - m[1]),
    c = finSoma(a.filter((m) => m.cat === "Besteiras e impulso")),
    p = s > 0 ? (o / s - 1) * 100 : null,
    u = loc().slice(0, 10);
  return `<div class="card"><div class="top"><b>💳 Controle financeiro</b><span class="finmes"><button class="btn s" data-fin-m="-1" aria-label="Mês anterior">‹</button><b>${esc(finNomeMes(t))}</b><button class="btn s" data-fin-m="1" aria-label="Próximo mês">›</button></span></div>
<p class="sm mut">Lance cada gasto (cartões, contas e as besteiras do dia a dia). O app soma por categoria e por cartão, compara com o mês anterior e mostra quanto sobra para a reserva e para o casamento.</p>
<div class="fing"><label>Data<input type="date" id="fin_d" value="${t === u.slice(0, 7) ? u : t + "-01"}"></label><label>Descrição<input id="fin_desc" placeholder="Ex.: lanche, Netflix, gasolina"></label>
<label>Categoria<select id="fin_cat">${FIN_CAT.map((m) => `<option>${m}</option>`).join("")}</select></label><label>Cartão ou forma<input id="fin_cart" list="fin_cartl" placeholder="Ex.: Nubank, Pix"><datalist id="fin_cartl">${l.map((m) => `<option value="${esc(m)}">`).join("")}</datalist></label>
<label>Valor (R$)<input type="text" inputmode="decimal" id="fin_v" placeholder="0,00"></label><button class="btn" data-fin-add="1">Adicionar gasto</button></div>
<div id="fin_msg" class="sm r"></div>
<div class="kv fin4"><div class="card"><span class="mut sm">Gastos do mês</span><b>${money(o)}</b><span class="mut sm">${p == null ? "sem mês anterior" : (p > 0 ? "▲ " : "▼ ") + Math.abs(p).toFixed(0) + "% contra o mês anterior"}</span></div>
<div class="card"><span class="mut sm">Renda do mês</span><b><input type="text" inputmode="decimal" class="finrenda" data-fin-renda="${t}" value="${n ? String(n).replace(".", ",") : ""}" placeholder="salário + extras"></b><span class="mut sm">opcional</span></div>
<div class="card"><span class="mut sm">Sobra do mês</span><b class="${n - o >= 0 ? "g" : "r"}">${n ? money(n - o) : "–"}</b><span class="mut sm">${n ? (n - o >= 0 ? "pode ir para a reserva ou o casamento" : "gastou mais do que entrou") : "informe a renda"}</span></div>
<div class="card"><span class="mut sm">Besteiras e impulso</span><b class="${c > 0 ? "r" : ""}">${money(c)}</b><span class="mut sm">${o > 0 ? ((c / o) * 100).toFixed(0) + "% dos gastos" : ""}</span></div></div>
${r.length ? `<h3 class="fint">Por categoria</h3>${r.map(([m, f]) => `<div class="fincat"><span>${esc(m)}</span><div class="finbar"><div style="width:${((f / i) * 100).toFixed(1)}%;background:${m === "Besteiras e impulso" ? "var(--r)" : "var(--g)"}"></div></div><b>${money(f)}</b></div>`).join("")}` : ""}
${d.length ? `<h3 class="fint">Por cartão ou forma de pagamento</h3><div class="fincarts">${d.map(([m, f]) => `<span><small>${esc(m)}</small><b>${money(f)}</b></span>`).join("")}</div>` : ""}
<h3 class="fint">Lançamentos (${a.length})</h3>${a.length ? `<div class="jrvtab fintab"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Cartão</th><th>Valor</th><th></th></tr></thead><tbody>${a.map((m) => `<tr><td>${esc(String(m.d).slice(8, 10) + "/" + String(m.d).slice(5, 7))}</td><td>${esc(m.desc || "")}</td><td>${esc(m.cat || "")}</td><td>${esc(m.cart || "")}</td><td><b>${money(+m.v)}</b></td><td><button class="lnk" data-fin-del="g:${esc(m.id)}" aria-label="Apagar">🗑</button></td></tr>`).join("")}</tbody></table></div>` : '<p class="sm mut">Nenhum gasto lançado neste mês.</p>'}
<button class="btn s" data-fin-xls="1" style="margin-top:10px">Exportar para Excel</button></div>`;
}
function finApHtml(e, t) {
  const a = t.slice().sort((s, n) => String(n.d).localeCompare(String(s.d))),
    o = loc().slice(0, 10);
  return `<div class="fing fing3"><label>Data<input type="date" id="fin_${e}_d" value="${o}"></label><label>Valor (R$)<input type="text" inputmode="decimal" id="fin_${e}_v" placeholder="Ex.: 300,00"></label><label>Observação<input id="fin_${e}_o" placeholder="opcional"></label>
<button class="btn" data-fin-ap="${e}">Guardar</button><button class="btn s" data-fin-ap="${e}" data-fin-ret="1">Retirar</button></div>
${a.length ? `<div class="jrvtab fintab"><table><thead><tr><th>Data</th><th>Valor</th><th>Observação</th><th></th></tr></thead><tbody>${a.map((s) => `<tr><td>${esc(String(s.d).slice(8, 10) + "/" + String(s.d).slice(5, 7) + "/" + String(s.d).slice(0, 4))}</td><td class="${+s.v >= 0 ? "g" : "r"}"><b>${money(+s.v)}</b></td><td>${esc(s.obs || "")}</td><td><button class="lnk" data-fin-del="${e}:${esc(s.id)}" aria-label="Apagar">🗑</button></td></tr>`).join("")}</tbody></table></div>` : '<p class="sm mut">Nenhum depósito ainda. Comece com qualquer valor: o importante é o hábito.</p>'}`;
}
function finResHtml() {
  const e = finD(),
    t = crCfg(),
    a = +t.custo || 0,
    o = +t.mesesReserva || 6,
    s = a * o,
    n = finSoma(e.res),
    r = Math.max(0, s - n),
    i = finMedia3();
  return `<div class="card"><div class="top"><b>🛟 Reserva de emergência</b></div>
<p class="sm mut">Dinheiro para imprevistos, guardado em lugar seguro e com liquidez diária (Tesouro Selic ou CDB de liquidez diária). Não é para operar. A meta é o seu custo de vida multiplicado pelo número de meses.</p>
<div class="g2"><label>Custo de vida (R$/mês)<input type="number" step="any" inputmode="decimal" data-cr="custo" value="${esc(t.custo || "")}"></label><label>Meses de reserva<input type="number" step="1" inputmode="numeric" data-cr="mesesReserva" value="${esc(t.mesesReserva || 6)}"></label></div>
${i > 0 && Math.abs(i - a) > 1 ? `<div class="sm" style="margin:6px 0">Pelo controle financeiro, você gastou em média <b>${money(i)}</b>/mês nos últimos meses. <button class="lnk" data-fin-usacusto="${i.toFixed(2)}">Usar como custo de vida</button></div>` : ""}
<div class="finmeta"><div><small>Guardado</small><b class="g">${fm0(n)}</b></div><div><small>Meta</small><b>${s > 0 ? fm0(s) : "–"}</b></div><div><small>Falta</small><b>${s > 0 ? fm0(r) : "–"}</b></div></div>${s > 0 ? "" : '<div class="sm mut" style="margin-top:4px">Informe o custo de vida para calcular a meta.</div>'}
${s > 0 ? finBarra(n / s) + `<div class="sm" style="margin:6px 0 10px">${((n / s) * 100).toFixed(0)}% da meta · ${finPrev(r, finRitmo(e.res))}</div>` : ""}
${finApHtml("res", e.res)}<div class="sm mut" style="margin-top:6px">A soma dos depósitos atualiza a "Reserva guardada" do Plano de transição.</div></div>`;
}
function finCasHtml() {
  const e = finD(),
    t = e.cas,
    a = +t.meta || 6e4,
    o = finSoma(t.ap),
    s = Math.max(0, a - o);
  let n = "";
  if (t.data) {
    const r = new Date(t.data + "T12:00"),
      i =
        (r.getFullYear() - new Date().getFullYear()) * 12 +
        r.getMonth() -
        new Date().getMonth();
    n =
      i > 0
        ? `Para chegar até ${r.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}, guarde <b>${money(s / i)}</b> por mês (${i} ${i > 1 ? "meses" : "mês"}).`
        : "A data do casamento já chegou ou é este mês.";
  }
  return `<div class="card"><div class="top"><b>💍 Casamento</b></div>
<p class="sm mut">Meta da festa. Cada vez que guardar dinheiro para o casamento, lance aqui: a barra vai enchendo.</p>
<div class="g2"><label>Meta (R$)<input type="text" inputmode="decimal" data-fin-cas="meta" value="${esc(String(a).replace(".", ","))}"></label><label>Data do casamento<input type="date" data-fin-cas="data" value="${esc(t.data || "")}"></label></div>
<div class="finmeta"><div><small>Guardado</small><b class="g">${fm0(o)}</b></div><div><small>Meta</small><b>${fm0(a)}</b></div><div><small>Falta</small><b>${fm0(s)}</b></div></div>
${finBarra(o / a, "#b38838")}<div class="sm" style="margin:6px 0 10px">${((o / a) * 100).toFixed(0)}% da meta · ${n || finPrev(s, finRitmo(t.ap))}</div>
${finApHtml("cas", t.ap)}</div>`;
}
{
  const e = vCarreira;
  vCarreira = function () {
    const t = FIN.t;
    return t === "plano"
      ? e
          .apply(this, arguments)
          .replace(
            "<h1>Plano de transição</h1>",
            "<h1>Plano de transição</h1>" + finChips(),
          )
      : `<h1>Plano de transição</h1>${finChips()}${t === "gastos" ? finGastosHtml() : t === "res" ? finResHtml() : finCasHtml()}`;
  };
}
function finSyncRes() {
  const e = finD();
  e.res.length &&
    ((S.ax ?? (S.ax = {})).carreira = {
      ...crCfg(),
      reserva: +finSoma(e.res).toFixed(2),
    });
}
function finXls() {
  const e = finD(),
    t = [...new Set(e.g.map((n) => String(n.d).slice(0, 7)))].sort(),
    a = [
      ["data", "descrição", "categoria", "cartão ou forma", "valor"],
      ...e.g
        .slice()
        .sort((n, r) => String(n.d).localeCompare(String(r.d)))
        .map((n) => [
          n.d,
          n.desc || "",
          n.cat || "",
          n.cart || "",
          (+n.v).toFixed(2),
        ]),
    ],
    o = [
      ["mês", "renda", "gastos", "sobra", ...FIN_CAT],
      ...t.map((n) => {
        const r = e.g.filter((d) => String(d.d).startsWith(n)),
          i = finSoma(r),
          l = +e.renda[n] || 0;
        return [
          n,
          l ? l.toFixed(2) : "",
          i.toFixed(2),
          l ? (l - i).toFixed(2) : "",
          ...FIN_CAT.map((d) =>
            finSoma(r.filter((c) => c.cat === d)).toFixed(2),
          ),
        ];
      }),
    ],
    s = (n) => [
      ["data", "valor", "observação"],
      ...n
        .slice()
        .sort((r, i) => String(r.d).localeCompare(String(i.d)))
        .map((r) => [r.d, (+r.v).toFixed(2), r.obs || ""]),
    ];
  saveFile(
    "controle-financeiro-" + loc().slice(0, 10) + ".xls",
    xlsArquivo([
      xlsAba("Gastos", a),
      xlsAba("Resumo por mês", o),
      xlsAba("Reserva de emergência", s(e.res)),
      xlsAba("Casamento", s(e.cas.ap)),
    ]),
    "application/vnd.ms-excel",
  );
}
(document.addEventListener("click", (e) => {
  const t = (o) => e.target.closest && e.target.closest(o);
  let a;
  if ((a = t("[data-fin-t]"))) {
    ((FIN.t = a.dataset.finT), render());
    return;
  }
  if ((a = t("[data-fin-m]"))) {
    ((FIN.m = finMes(FIN.m, +a.dataset.finM)), render());
    return;
  }
  if ((a = t("[data-fin-add]"))) {
    const o = finNum(document.getElementById("fin_v").value),
      s = document.getElementById("fin_d").value,
      n = document.getElementById("fin_desc").value.trim();
    if (!(o > 0) || !s) {
      const r = document.getElementById("fin_msg");
      r && (r.textContent = "Informe a data e um valor maior que zero.");
      return;
    }
    (finD().g.push({
      id: uid(),
      d: s,
      desc: n,
      cat: document.getElementById("fin_cat").value,
      cart: document.getElementById("fin_cart").value.trim(),
      v: +o.toFixed(2),
      u: Date.now(),
    }),
      (FIN.m = s.slice(0, 7)),
      save(),
      render(),
      toast("Gasto lançado."));
    return;
  }
  if ((a = t("[data-fin-ap]"))) {
    const o = a.dataset.finAp,
      s = finNum(document.getElementById("fin_" + o + "_v").value),
      n = document.getElementById("fin_" + o + "_d").value;
    if (!(s > 0) || !n) {
      toast("Informe a data e um valor maior que zero.");
      return;
    }
    const r = {
        id: uid(),
        d: n,
        v: +(a.dataset.finRet ? -s : s).toFixed(2),
        obs: document.getElementById("fin_" + o + "_o").value.trim(),
        u: Date.now(),
      },
      i = finD();
    (o === "res" ? (i.res.push(r), finSyncRes()) : i.cas.ap.push(r),
      save(),
      render(),
      toast(a.dataset.finRet ? "Retirada lançada." : "Depósito guardado."));
    return;
  }
  if ((a = t("[data-fin-del]"))) {
    const [o, s] = a.dataset.finDel.split(":"),
      n = finD();
    if (!confirm("Apagar este lançamento?")) return;
    (o === "g"
      ? (n.g = n.g.filter((r) => r.id !== s))
      : o === "res"
        ? ((n.res = n.res.filter((r) => r.id !== s)),
          n.res.length
            ? finSyncRes()
            : ((S.ax ?? (S.ax = {})).carreira = { ...crCfg(), reserva: 0 }))
        : (n.cas.ap = n.cas.ap.filter((r) => r.id !== s)),
      save(),
      render());
    return;
  }
  if ((a = t("[data-fin-usacusto]"))) {
    (((S.ax ?? (S.ax = {})).carreira = {
      ...crCfg(),
      custo: +a.dataset.finUsacusto,
    }),
      save(),
      render());
    return;
  }
  if (t("[data-fin-xls]")) {
    finXls();
    return;
  }
}),
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!(!t || !t.closest)) {
      if (t.matches("[data-fin-renda]")) {
        ((finD().renda[t.dataset.finRenda] = finNum(t.value) || 0),
          save(),
          render());
        return;
      }
      if (t.matches("[data-fin-cas]")) {
        const a = finD().cas;
        ((a[t.dataset.finCas] =
          t.dataset.finCas === "meta" ? finNum(t.value) || 6e4 : t.value),
          save(),
          render());
        return;
      }
    }
  }));
{
  const e = TraderStyles.slot("legacy-094");
  ((e.id = "fin168"),
    (e.textContent = TraderStyles.css("legacy-094")),
    TraderStyles.mount(e));
}
const JV_IMAGENS = {
    capa: "assets/editorial/capa.jpg",
    diario: "assets/editorial/diario.jpg",
    empresas: "assets/editorial/empresas.jpg",
    mundo: "assets/editorial/mundo.jpg",
  },
  jvImagensCache = new Map();
async function jvB64(e) {
  const t = JV_IMAGENS[e];
  if (!t) return null;
  if (!jvImagensCache.has(t)) {
    const a = fetch(t)
      .then(async (o) => {
        if (!o.ok) throw new Error("Imagem editorial indisponível: " + t);
        return new Uint8Array(await o.arrayBuffer());
      })
      .catch((o) => {
        throw (jvImagensCache.delete(t), o);
      });
    jvImagensCache.set(t, a);
  }
  try {
    return await jvImagensCache.get(t);
  } catch {
    return null;
  }
}
{
  const e = jvFotoBytes;
  jvFotoBytes = async function (t) {
    for (const a of t || []) {
      const o = /(?:img\/jornal\/|jornal-)(\w+)\.jpg$/.exec(a),
        s = o ? o[1] : /touro-hero/.test(a) ? "capa" : null,
        n = s && (await jvB64(s));
      if (n)
        return (
          (window.__jvFotoUsadas ?? (window.__jvFotoUsadas = [])).push(s),
          { bytes: n, png: !1 }
        );
    }
    return e.apply(this, arguments);
  };
}
function chkN(e) {
  if (!e) return 0;
  const t = new Set((S.rules || []).map((a) => String(a.id)));
  try {
    typeof usRulesDe == "function" &&
      (usRulesDe() || []).forEach((a) => t.add(String(a.id)));
  } catch {}
  return Object.entries(e).filter(([a, o]) => o && t.has(String(a))).length;
}
{
  const e = TraderStyles.slot("legacy-126");
  ((e.id = "jornal169"),
    (e.textContent = TraderStyles.css("legacy-126", [JV_IMAGENS.capa])),
    TraderStyles.mount(e));
}
((chipsDia = function (e, t, a) {
  const o = (S.days[a] || {})[e] || "";
  return `<select class="selch" data-dchs="${e}" data-d="${a}" style="margin:4px 0"><option value="">— escolher —</option>${t.map(([s, n]) => `<option value="${s}"${o === s ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest && e.target.closest("[data-dchs]");
    if (!t) return;
    const a = dia$(t.dataset.d);
    ((a[t.dataset.dchs] = t.value), (a.u = Date.now()), save());
  }));
{
  const e = rotMHtml;
  rotMHtml = function () {
    let t = e.apply(this, arguments);
    const a = modsOn();
    if (a.length < 2) return t;
    const o = a.includes(ROTM_AB) ? ROTM_AB : a[0],
      s = S.days[D] || {},
      n = `<select class="selch" data-rotms="1" style="margin:6px 0">${a
        .map((r) => {
          const i = (s.rm || {})[r] || {},
            l = rotM(r).filter((c, p) => i[p]).length,
            d = MODS.find((c) => c[0] === r);
          return `<option value="${r}"${r === o ? " selected" : ""}>${esc(d ? d[1] : r)} · ${l} de ${rotM(r).length}</option>`;
        })
        .join("")}</select>`;
    return t.replace(
      /<div class="chips2" style="margin:6px 0">[\s\S]*?<\/div>/,
      n,
    );
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest && e.target.closest("[data-rotms]");
  t && ((ROTM_AB = t.value), (ROTM_ED = !1), rotMPinta());
});
{
  const e = TraderStyles.slot("legacy-095");
  ((e.id = "diario170"),
    (e.textContent = TraderStyles.css("legacy-095")),
    TraderStyles.mount(e));
}
const JRCAR = () => {
  try {
    return APP_STORAGE.getItem("diario-jr-carteira") === "1";
  } catch {
    return !1;
  }
};
{
  const e = jrcHtml;
  jrcHtml = function () {
    return JRCAR()
      ? e
          .apply(this, arguments)
          .replace(
            "<h3>Sua carteira</h3>",
            '<h3 class="jrh3b">Sua carteira <button class="lnk" data-jrcar="0">tirar do jornal</button></h3>',
          )
      : '<div class="jrmdbar"><button class="btn s" data-jrcar="1">💼 Incluir minha carteira no jornal</button><span class="sm mut">análise fundamentalista e técnica de cada ativo seu (aparece também no PDF)</span></div>';
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("[data-jrcar]");
  if (t) {
    try {
      APP_STORAGE.setItem("diario-jr-carteira", t.dataset.jrcar);
    } catch {}
    jrPinta();
  }
});
const JVO = { busy: 0, etapa: "", msg: "", r: null };
let JVO_LOAD = 0;
const JVO_N = 4;
function jvoCarrega() {
  if (!JVO_LOAD) {
    JVO_LOAD = 1;
    try {
      Promise.resolve(idb("kv", "get", "jvo"))
        .then((e) => {
          e && (e.fun || e.tec) && !JVO.r && ((JVO.r = e), jrPinta());
        })
        .catch(() => {});
    } catch {}
  }
}
var jvoTks, jvoAnalisa;
document.addEventListener("click", (e) => {
  e.target.closest && e.target.closest("[data-jvo]") && jvoAnalisa();
});
const jvoS = (e) =>
  typeof e == "string"
    ? e.trim()
    : Array.isArray(e)
      ? e.filter((t) => typeof t == "string" && t.trim()).join(" · ")
      : "";
var jvoAtivos;
function jvoNoticias() {
  const e = ((JVO.r || {}).fun || {}).relatorio || {},
    t = e.resultados_recentes || {},
    a = [];
  return (
    jvoS(t.ultimo_balanco) && a.push(jvoS(t.ultimo_balanco)),
    anxArr(t.noticias_relevantes).forEach((o) => {
      const s = jvoS(o);
      s && s !== "sem dado" && a.push(s);
    }),
    a.slice(0, 10)
  );
}
const jvoR$ = (e) =>
  e == null || e === ""
    ? ""
    : isFinite(+e)
      ? "R$ " +
        Number(e).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : String(e);
function jvoCampos(e) {
  const t = e.fun || {},
    a = e.tec || {},
    o = a.gatilhos || {},
    s = a.plano_de_trade || {},
    n = t.decisao || {},
    r =
      n.preco_justo != null
        ? [
            "Preço justo " + jvoR$(n.preco_justo),
            n.preco_teto != null
              ? "preço-teto para comprar " + jvoR$(n.preco_teto)
              : "",
            n.upside_pct != null
              ? "potencial " +
                (n.upside_pct >= 0 ? "+" : "") +
                String(n.upside_pct).replace(".", ",") +
                "%"
              : "",
            n.zona && n.zona !== "SEM DADO"
              ? "zona: " + String(n.zona).toLowerCase()
              : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : "",
    i = anxArr(t.cenarios)
      .filter((c) => c && c.cenario)
      .map(
        (c) =>
          `${c.cenario} (${c.probabilidade_pct ?? "?"}%): ${c.preco != null ? jvoR$(c.preco) : "sem preço"}${c.premissas ? " · " + jvoS(c.premissas) : ""}`,
      ).join(`
`),
    l = [
      s.entrada && "entrada " + s.entrada,
      s.stop && "stop " + s.stop,
      s.alvo_1 && "alvo 1 " + s.alvo_1,
      s.alvo_2 && "alvo 2 " + s.alvo_2,
      s.risco_retorno && "risco/retorno " + s.risco_retorno,
    ]
      .filter(Boolean)
      .join(" · "),
    d = [
      ["Fundamentos e notícias", null],
      ["Tese", jvoS(t.tese_de_investimento) || jvoS(t.resumo)],
      ["Preço justo", r],
      ["O negócio", jvoS(t.vantagens_competitivas)],
      ["Rentabilidade e margens", jvoS(t.rentabilidade_e_margens)],
      ["Dívida e caixa", jvoS(t.endividamento_e_caixa)],
      ["Valuation", jvoS(t.valuation_leitura) || jvoS(t.valuation_metodos)],
      ["Dividendos", jvoS(t.dividendos)],
      ["Crescimento", jvoS(t.perspectivas_de_crescimento)],
      ["Riscos e catalisadores", jvoS(t.riscos_e_catalisadores)],
      ["Cenários", i],
      ["Análise técnica", null],
      ["Leitura do gráfico", jvoS(a.resumo)],
      [
        "Tendência",
        jvoS(a.multitempo && a.multitempo.leitura_top_down) ||
          jvoS(a.tendencia),
      ],
      ["Suportes e resistências", jvoS(a.zonas_de_interesse)],
      [
        "Gatilhos",
        [
          o.compra ? "Compra: " + jvoS(o.compra) : "",
          o.venda ? "Venda: " + jvoS(o.venda) : "",
        ]
          .filter(Boolean)
          .join(" · "),
      ],
      [
        "Plano de trade",
        l + (s.invalidacao ? (l ? ". " : "") + jvoS(s.invalidacao) : ""),
      ],
      ["Conclusão", null],
      ["Para quem não tem", jvoS(t.para_quem_nao_tem)],
      ["Pontos fortes", jvoS(t.pontos_fortes)],
      ["Pontos de atenção", jvoS(t.pontos_de_atencao)],
    ];
  return d.filter((c, p) => {
    if (c[1] != null) return !!c[1];
    for (let u = p + 1; u < d.length && d[u][1] != null; u++)
      if (d[u][1]) return !0;
    return !1;
  });
}
function jvoTags(e) {
  const t = e.fun || {},
    a = e.tec || {};
  return [
    t.valuation && [t.valuation.toLowerCase(), jrcCls(t.valuation)],
    t.qualidade && ["qualidade " + t.qualidade.toLowerCase(), "eq"],
    a.vies && ["viés " + a.vies.toLowerCase(), jrcCls(a.vies)],
  ].filter(Boolean);
}
function jvoHtml() {
  jvoCarrega();
  const e = jvoAtivos(),
    t = JVO.r,
    a = jvoTks(),
    o = loc().slice(0, 10),
    s = t && (t.dia !== o || (t.tks || []).join() !== a.join()),
    n = `<button class="btn" data-jvo="1"${JVO.busy ? " disabled" : ""}>${JVO.busy ? "⏳ Analisando (" + esc(JVO.etapa) + ")… pode levar 2 minutos" : e.length ? "↻ Refazer a análise completa" : "🔎 Análise completa das " + a.length + " mais baratas"}</button>`,
    r = jvoNoticias();
  return `<div class="jvo"><h4>Cenário completo: técnica, fundamentos e notícias</h4>
<p class="sm mut" style="margin:0 0 8px">O preço justo é só a triagem. Aqui a IA estuda ${esc(a.join(", "))}: notícias e balanços recentes, rentabilidade, dívida, dividendos, cenários e o gráfico (tendência, suportes, gatilhos). Só roda quando você tocar no botão${t ? ` · última análise em ${t.dia.slice(8, 10)}/${t.dia.slice(5, 7)}` : ""}.</p>${n}
${JVO.msg ? `<div class="warn sm" style="margin-top:8px">${esc(JVO.msg)}</div>` : ""}${s && e.length && !JVO.busy ? '<div class="sm am" style="margin-top:6px">Essa análise é de outro dia ou de outra lista. Toque em refazer para atualizar.</div>' : ""}
${r.length ? `<div class="jvon"><b>Notícias e resultados das empresas</b><ul>${r.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
${e
  .map(
    (i, l) =>
      `<details class="jvoc"${l === 0 ? " open" : ""}><summary><b>${esc(i.tk)}</b><span>${jvoTags(
        i,
      )
        .map(([d, c]) => jrcTag(d, c))
        .join("")}</span></summary>${jvoCampos(i)
        .map(([d, c]) =>
          c == null
            ? `<div class="jvog">${esc(d)}</div>`
            : `<p><small>${esc(d)}</small>${esc(c).replace(/\n/g, "<br>")}</p>`,
        )
        .join("")}</details>`,
  )
  .join("")}
${e.length ? '<div class="sm mut" style="margin-top:6px">Leitura da IA com dados das empresas, notícias e o gráfico. Não é recomendação de investimento.</div>' : ""}</div>`;
}
{
  const e = varrHtml;
  varrHtml = function () {
    const t = e.apply(this, arguments);
    try {
      return !JRN.varr || !(JRN.varr.ranking || []).length
        ? t
        : t.replace(/<\/section>\s*$/, jvoHtml() + "</section>");
    } catch {
      return t;
    }
  };
}
{
  const e = TraderStyles.slot("legacy-096");
  ((e.id = "jornal171"),
    (e.textContent = TraderStyles.css("legacy-096")),
    TraderStyles.mount(e));
}
const jvoFunDe = (e) => {
  const t = JVO.r || {},
    a = (t.funs || {})[e];
  return a
    ? anxArr((a.relatorio || {}).ativos).find(
        (o) => String(o.ticker || "").toUpperCase() === e,
      ) ||
        anxArr((a.relatorio || {}).ativos)[0] ||
        null
    : anxArr(((t.fun || {}).relatorio || {}).ativos).find(
        (o) => String(o.ticker || "").toUpperCase() === e,
      ) || null;
};
jvoAtivos = function () {
  const e = JVO.r;
  if (!e) return [];
  const t = anxArr(((e.tec || {}).relatorio || {}).ativos);
  return (e.tks || [])
    .map((a) => ({
      tk: a,
      fun: jvoFunDe(a),
      tec: t.find((o) => String(o.ticker || "").toUpperCase() === a) || null,
      rel: ((e.funs || {})[a] || {}).relatorio || null,
      erroF: (e.erros || {})[a] || "",
    }))
    .filter((a) => a.fun || a.tec);
};
{
  const e = jvoNoticias;
  jvoNoticias = function () {
    return JVO.r && JVO.r.funs ? [] : e.apply(this, arguments);
  };
}
{
  const e = jvoCampos;
  jvoCampos = function (t) {
    const a = e.apply(this, arguments),
      o = t.rel || {},
      s = o.resultados_recentes || {},
      n = [
        jvoS(s.ultimo_balanco),
        ...anxArr(s.noticias_relevantes).map(jvoS),
      ].filter((p) => p && !/^sem dado/i.test(p)).join(`
`),
      r = jvoS(o.sumario_executivo),
      i = jvoS(o.contexto_macro),
      l = jvoS(t.fun && t.fun.governanca),
      d = [
        ["Resumo executivo", r],
        ["Notícias e resultados recentes", n],
        ["Cenário macro", i],
      ].filter((p) => p[1]);
    if (!t.fun)
      return [
        ["Fundamentos e notícias", null],
        [
          "Aviso",
          "A parte fundamentalista desta ação não saiu desta vez" +
            (t.erroF ? " (" + t.erroF + ")" : "") +
            '. Toque em "Refazer a análise completa" no jornal.',
        ],
        ...a,
      ];
    const c = a.findIndex((p) => p[0] === "Fundamentos e notícias");
    if ((c >= 0 && a.splice(c + 1, 0, ...d), l)) {
      const p = a.findIndex((u) => u[0] === "Riscos e catalisadores");
      a.splice(p >= 0 ? p : a.length, 0, ["Governança", l]);
    }
    return a;
  };
}
jvoAnalisa = async function () {
  if (JVO.busy) return;
  const e = jvoTks();
  if (!e.length) {
    ((JVO.msg = "A varredura de hoje ainda não saiu."), jrPinta());
    return;
  }
  ((JVO.busy = 1), (JVO.msg = ""));
  const t = { dia: loc().slice(0, 10), tks: e, tec: null, funs: {}, erros: {} },
    a = [];
  let o = 0;
  const s = () => {
    ((JVO.etapa = `fundamentos e notícias ${o} de ${e.length}`), jrPinta());
  };
  s();
  const n = async (d) => {
      let c = "";
      for (let p = 0; p < 2; p++)
        try {
          const u = await anxCall({
            modo: "fundamentalista",
            itens: [{ tk: d, mk: "BR" }],
            avulso: !0,
            jornal: !0,
          });
          if (!u || u.erro) throw new Error((u && u.erro) || "sem resposta");
          if (!anxArr((u.relatorio || {}).ativos).length)
            throw new Error("a IA não devolveu a análise");
          t.funs[d] = u;
          return;
        } catch (u) {
          if (
            ((c = String((u && u.message) || u)),
            /[Ll]imite di[a\xe1]rio/.test(c))
          )
            break;
        }
      ((t.erros[d] = c.slice(0, 140)),
        a.push(d + " fundamentalista: " + c.slice(0, 80)));
    },
    r = [...e],
    i = async () => {
      for (; r.length; ) {
        const d = r.shift();
        (await n(d), o++, s());
      }
    },
    l = (async () => {
      try {
        const d = await anxCall({
          modo: "tecnica",
          itens: e.map((c) => ({ tk: c, mk: "BR" })),
          avulso: !0,
          jornal: !0,
        });
        if (!d || d.erro) throw new Error((d && d.erro) || "sem resposta");
        t.tec = d;
      } catch (d) {
        a.push("técnica: " + ((d && d.message) || d));
      }
    })();
  if ((await Promise.all([i(), i(), l]), t.tec || Object.keys(t.funs).length)) {
    JVO.r = t;
    try {
      idb("kv", "put", t, "jvo");
    } catch {}
  }
  ((JVO.busy = 0),
    (JVO.etapa = ""),
    (JVO.msg = a.length ? "Parte da análise não saiu: " + a.join(" · ") : ""),
    jrPinta());
};
{
  const e = jvoCampos;
  jvoCampos = function (t) {
    const a = e.apply(this, arguments),
      o = (t.tec || {}).plano_de_trade || {},
      s = (l) =>
        l != null && !/^\s*[\u2013\u2014-]?\s*$/.test(String(l))
          ? String(l)
          : "",
      n = [
        s(o.entrada) && "entrada " + s(o.entrada),
        s(o.stop) && "stop " + s(o.stop),
        s(o.alvo_1) && "alvo 1 " + s(o.alvo_1),
        s(o.alvo_2) && "alvo 2 " + s(o.alvo_2),
        s(o.risco_retorno) && "risco/retorno " + s(o.risco_retorno),
      ]
        .filter(Boolean)
        .join(" · "),
      r = jvoS(o.invalidacao),
      i = a.findIndex((l) => l[0] === "Plano de trade");
    if (i >= 0) {
      const l = n + (r ? (n ? ". " : "") + r : "");
      l ? (a[i] = ["Plano de trade", l]) : a.splice(i, 1);
    }
    return a;
  };
}
const jvTkOk = (e) => /^[A-Z]{4}\d{1,2}$/.test(e),
  jvF2 = (e) =>
    e == null || !isFinite(+e)
      ? "–"
      : Number(e).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
  jvPc = (e) =>
    e == null || !isFinite(+e)
      ? "–"
      : (e > 0 ? "+" : "") + Number(e).toFixed(1).replace(".", ",") + "%",
  jrObs = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).jrObs ?? (e.jrObs = []);
  },
  JVO_ALVO = () => {
    let e = "";
    try {
      e = APP_STORAGE.getItem("diario-jvo-alvo") || "";
    } catch {}
    return ["baratas", "lista", "ambas"].includes(e)
      ? e
      : jrObs().length
        ? "ambas"
        : "baratas";
  },
  JVO_MAX = 8;
jvoTks = function () {
  const e = JRN.varr,
    t =
      e && Array.isArray(e.ranking)
        ? e.ranking.slice(0, JVO_N).map((n) => String(n.tk).toUpperCase())
        : [],
    a = JVO_ALVO(),
    o = jrObs(),
    s = a === "lista" ? o.slice() : a === "baratas" ? t : [...o, ...t];
  return [...new Set(s)].slice(0, JVO_MAX);
};
function jvoObsHtml() {
  const e = jrObs(),
    t = JVO_ALVO();
  return `<div class="jvobs"><b>Sua lista de observação</b>
<div class="jvobs-add"><input id="jvobsin" placeholder="Ticker, ex.: WEGE3" autocapitalize="characters" autocomplete="off" value="${esc(JVO.obsTx || "")}"><button class="btn s" data-jvobs-add="1">Adicionar</button></div>
${e.length ? `<div class="jvobs-l">${e.map((a) => `<span class="jvobs-t">${esc(a)}<button type="button" data-jvobs-del="${esc(a)}" aria-label="Tirar ${esc(a)}">×</button></span>`).join("")}</div>` : '<div class="sm mut">Adicione as ações que você acompanha. Elas entram na análise completa mesmo que não estejam baratas.</div>'}
<label class="sm" style="display:block;margin-top:8px">O que analisar<select data-jvo-alvo="1">${[
    ["ambas", "A minha lista e as mais baratas"],
    ["lista", "Só a minha lista"],
    ["baratas", "Só as mais baratas da varredura"],
  ]
    .map(
      ([a, o]) =>
        `<option value="${a}"${t === a ? " selected" : ""}>${o}</option>`,
    )
    .join("")}</select></label>
<div class="sm mut" style="margin-top:4px">Um toque analisa todas (até ${JVO_MAX} ações): fundamentos e notícias de cada uma, mais a técnica. Cada ação conta 1 análise no seu limite diário, e a técnica conta mais 1 a cada 4 ações.</div></div>`;
}
function jvoObsAdd() {
  const e = document.getElementById("jvobsin");
  if (!e) return;
  const t = jrObs();
  let a = 0;
  for (const o of String(e.value || "")
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter(Boolean)) {
    if (!jvTkOk(o)) {
      toast(o + ": ticker inválido (ex.: PETR4).");
      continue;
    }
    if (!t.includes(o)) {
      if (t.length >= JVO_MAX) {
        toast("A lista tem no máximo " + JVO_MAX + " ações.");
        break;
      }
      (t.push(o), a++);
    }
  }
  ((JVO.obsTx = ""), (e.value = ""), a && (save(), jrPinta()));
}
(document.addEventListener("input", (e) => {
  e.target && e.target.id === "jvobsin" && (JVO.obsTx = e.target.value);
}),
  document.addEventListener("click", (e) => {
    const t = (o) => e.target.closest && e.target.closest(o);
    let a;
    if (t("[data-jvobs-add]")) {
      jvoObsAdd();
      return;
    }
    if ((a = t("[data-jvobs-del]"))) {
      const o = a.dataset.jvobsDel,
        s = jrObs(),
        n = s.indexOf(o);
      n >= 0 && (s.splice(n, 1), save(), jrPinta());
      return;
    }
    if ((a = t("[data-jval]"))) {
      jvoAlerta(a.dataset.jval);
      return;
    }
    if (t("[data-jvp]")) {
      jvpAtualiza(!0);
      return;
    }
  }),
  document.addEventListener("keydown", (e) => {
    e.key === "Enter" &&
      e.target &&
      e.target.id === "jvobsin" &&
      (e.preventDefault(), jvoObsAdd());
  }),
  document.addEventListener("change", (e) => {
    const t = e.target.closest && e.target.closest("[data-jvo-alvo]");
    if (t) {
      try {
        APP_STORAGE.setItem("diario-jvo-alvo", t.value);
      } catch {}
      jrPinta();
    }
  }));
const jvHist = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).jvoHist ?? (e.jvoHist = []);
  },
  jvoTecA = (e, t) => (
    (t = t || JVO.r || {}),
    anxArr((t.tec || {}).ativos).find(
      (a) => String(a.tk || "").toUpperCase() === e,
    ) || null
  );
function jvoGuarda(e) {
  if (!e) return;
  const t = jvHist(),
    a = e.dia;
  for (const o of e.tks || []) {
    const s = jvoFunDe(o) || {},
      n = jvoTecA(o, e),
      r =
        anxArr(((e.tec || {}).relatorio || {}).ativos).find(
          (p) => String(p.ticker || "").toUpperCase() === o,
        ) || {},
      i = ((JRN.varr || {}).ranking || []).find((p) => p.tk === o),
      l =
        (n && +n.preco_atual) ||
        (s.decisao && s.decisao.preco_atual) ||
        (i && +i.preco) ||
        null;
    if (!(l > 0)) continue;
    const d = {
        dia: a,
        tk: o,
        px: +(+l).toFixed(2),
        pj:
          s.decisao && s.decisao.preco_justo != null
            ? +s.decisao.preco_justo
            : null,
        val: s.valuation || "",
        vies: r.vies || "",
      },
      c = t.findIndex((p) => p.tk === o && p.dia === a);
    c >= 0 ? (t[c] = d) : t.push(d);
  }
  for (; t.length > 80; ) t.shift();
  save();
}
{
  const e = jvoAnalisa;
  jvoAnalisa = async function () {
    await e.apply(this, arguments);
    try {
      JVO.r && JVO.r.dia === loc().slice(0, 10) && jvoGuarda(JVO.r);
    } catch {}
  };
}
const JVP = { px: {}, ts: 0, busy: 0, err: "" };
try {
  const e = JSON.parse(APP_STORAGE.getItem("diario-jvp") || "null");
  e && e.px && ((JVP.px = e.px), (JVP.ts = e.ts || 0));
} catch {}
async function jvpAtualiza(e) {
  if (JVP.busy) return;
  const t = loc().slice(0, 10),
    a = [
      ...new Set(
        jvHist()
          .filter((s) => s.dia < t)
          .map((s) => s.tk),
      ),
    ].slice(0, 40);
  if (!a.length || (!e && Date.now() - JVP.ts < 30 * 6e4)) return;
  const o = cfg();
  if (!o || typeof SESS > "u" || !SESS) {
    ((JVP.err = "Entre na sua conta para atualizar o placar."), jrPinta());
    return;
  }
  ((JVP.busy = 1), (JVP.err = ""), jrPinta());
  try {
    await tok();
    const s = await fetch(o.url + "/functions/v1/precos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: o.key,
          Authorization: "Bearer " + SESS.at,
        },
        body: JSON.stringify({ br: a, us: [] }),
      }),
      n = await s.json().catch(() => ({}));
    if (!s.ok) throw new Error(n.erro || "Erro " + s.status);
    for (const [r, i] of Object.entries(n.br || {})) +i > 0 && (JVP.px[r] = +i);
    JVP.ts = Date.now();
    try {
      APP_STORAGE.setItem(
        "diario-jvp",
        JSON.stringify({ px: JVP.px, ts: JVP.ts }),
      );
    } catch {}
  } catch (s) {
    JVP.err =
      "Não consegui os preços agora: " +
      String((s && s.message) || s).slice(0, 100);
  }
  ((JVP.busy = 0), jrPinta());
}
const jvpDir = (e) => {
  const t = /BARATO/.test(e.val) || e.vies === "ALTA",
    a = /CARO/.test(e.val) || e.vies === "BAIXA";
  return t && !a ? 1 : a && !t ? -1 : 0;
};
function jvpLinhas() {
  const e = loc().slice(0, 10);
  return jvHist()
    .filter((t) => t.dia < e && JVP.px[t.tk] > 0)
    .map((t) => {
      const a = JVP.px[t.tk],
        o = (a / t.px - 1) * 100,
        s = jvpDir(t),
        n = Math.round(
          (new Date(e + "T12:00") - new Date(t.dia + "T12:00")) / 864e5,
        );
      return {
        ...t,
        now: a,
        ret: o,
        dir: s,
        dias: n,
        ok: s ? (s > 0 ? o > 0 : o < 0) : null,
      };
    })
    .sort((t, a) => a.dia.localeCompare(t.dia) || t.tk.localeCompare(a.tk))
    .slice(0, 20);
}
function jvpResumo(e) {
  const t = e.filter((s) => s.ok != null),
    a = t.filter((s) => s.ok).length,
    o = e.filter((s) => s.dir > 0);
  return {
    n: t.length,
    acertos: a,
    taxa: t.length ? a / t.length : null,
    medUp: o.length ? o.reduce((s, n) => s + n.ret, 0) / o.length : null,
    nUp: o.length,
  };
}
function jvpHtml() {
  const e = jvHist(),
    t = loc().slice(0, 10),
    a = e.filter((i) => i.dia < t);
  if (!a.length) return "";
  setTimeout(() => jvpAtualiza(!1), 0);
  const o = jvpLinhas(),
    s = jvpResumo(o),
    n = (i) => i.slice(8, 10) + "/" + i.slice(5, 7),
    r = (i) => (i > 0 ? "alta" : i < 0 ? "queda" : "neutra");
  return `<div class="jvp"><h4>Placar das análises</h4><p class="sm mut" style="margin:0 0 8px">Cada análise completa fica guardada. Aqui o app compara o preço daquele dia com o de hoje, para você ver se a leitura funcionou.</p>
${s.n ? `<div class="jrkp3"><div><small>Acertou a direção</small><b class="${s.taxa >= 0.5 ? "g" : "r"}">${s.acertos} de ${s.n}</b></div>${s.medUp != null ? `<div><small>Média das que deram alta</small><b class="${s.medUp >= 0 ? "g" : "r"}">${jvPc(s.medUp)}</b></div>` : ""}<div><small>Análises guardadas</small><b>${a.length}</b></div></div>` : ""}
${o.length ? `<div class="jrvtab"><table><thead><tr><th>Ação</th><th>Dia</th><th>Leitura</th><th>Preço</th><th>Hoje</th><th>Variação</th></tr></thead><tbody>${o.map((i) => `<tr><td><b>${esc(i.tk)}</b></td><td>${n(i.dia)}</td><td>${r(i.dir)}</td><td>${jvF2(i.px)}</td><td>${jvF2(i.now)}</td><td class="${i.ret >= 0 ? "g" : "r"}"><b>${jvPc(i.ret)}</b>${i.ok == null ? "" : i.ok ? " ✓" : " ✗"}</td></tr>`).join("")}</tbody></table></div>` : `<div class="sm mut">${JVP.busy ? "Buscando os preços de hoje…" : "Toque em atualizar para buscar os preços de hoje."}</div>`}
${JVP.err ? `<div class="warn sm" style="margin-top:6px">${esc(JVP.err)}</div>` : ""}
<button class="btn s" data-jvp="1" style="margin-top:8px"${JVP.busy ? " disabled" : ""}>${JVP.busy ? "⏳ Buscando preços…" : "↻ Atualizar placar"}</button>
<div class="sm mut" style="margin-top:6px">Leitura: alta = ação barata ou com viés de alta; queda = cara ou com viés de baixa. Poucos dias ainda dizem pouco: o placar fica mais confiável com semanas de análises.</div></div>`;
}
function jvoNiveis(e) {
  const t = jvoTecA(e);
  if (!t || !t.plano) return null;
  const a = t.plano.compra,
    o = t.plano.venda;
  return {
    px: +t.preco_atual || null,
    compra: a && +a.entrada > 0 ? +a.entrada : null,
    venda: o && +o.entrada > 0 ? +o.entrada : null,
  };
}
const jvoTemAl = (e, t, a) =>
  ((S.ax || {}).alpx || []).some(
    (o) => o.c === e && o.op === t && Math.abs(o.v - a) < 0.005 && !o.fired,
  );
function jvoAlBtns(e) {
  const t = jvoNiveis(e);
  if (!t || (!t.compra && !t.venda)) return "";
  const a = (o, s, n) => {
    const r = jvoTemAl(e, o, s);
    return `<button type="button" class="btn s jval${r ? " on" : ""}" data-jval="${e}|${o}|${s}"${r ? " disabled" : ""}>${r ? "✓ Alerta criado: " : "🔔 "}${n} ${jvF2(s)}</button>`;
  };
  return `<div class="jvals">${t.compra ? a(">", t.compra, "Avisar se passar de") : ""}${t.venda ? a("<", t.venda, "Avisar se cair abaixo de") : ""}</div>`;
}
function jvoAlerta(e) {
  var t;
  const [a, o, s] = e.split("|"),
    n = +s;
  if (!jvTkOk(a) || !(n > 0) || ![">", "<"].includes(o)) return;
  const r = (t = S.ax ?? (S.ax = {})).alpx ?? (t.alpx = []);
  if (r.filter((i) => !i.fired).length >= 20) {
    toast("Você já tem 20 alertas ativos. Apague algum em Mercado → Cotações.");
    return;
  }
  if (!jvoTemAl(a, o, n)) {
    (r.push({
      id: "j" + Date.now().toString(36),
      s: "BMFBOVESPA:" + a,
      c: a,
      op: o,
      v: n,
      dp: 2,
      em: Date.now(),
      orig: "jornal",
    }),
      save());
    try {
      turnoPushSync(!0);
    } catch {}
    (toast(
      `Alerta criado: ${a} ${o === ">" ? "acima de" : "abaixo de"} ${jvF2(n)}. Chega como notificação no celular.`,
      5e3,
    ),
      jrPinta());
  }
}
{
  const e = jvoHtml;
  jvoHtml = function () {
    let t = e.apply(this, arguments);
    return (
      (t = t.replace(
        /(<details class="jvoc"[^>]*><summary><b>)([A-Z0-9]+)(<\/b>[\s\S]*?<\/summary>)/g,
        (a, o, s, n) => o + s + n + jvoAlBtns(s),
      )),
      (t = t.replace(
        /(<h4>Cen\xe1rio completo: t\xe9cnica, fundamentos e not\xedcias<\/h4>)/,
        "$1" + jvoObsHtml(),
      )),
      (t = t.replace(
        /O pre\xe7o justo \xe9 s\xf3 a triagem\. Aqui a IA estuda ([^:]*):/,
        (a, o) =>
          "O preço justo é só a triagem. Aqui a IA estuda " +
          (o || "a sua lista") +
          ":",
      )),
      t + jvpHtml()
    );
  };
}
{
  const e = varrHtml;
  varrHtml = function () {
    const t = e.apply(this, arguments);
    try {
      if ((!JRN.varr || !(JRN.varr.ranking || []).length) && jrObs().length)
        return t.replace(/<\/section>\s*$/, jvoHtml() + "</section>");
    } catch {}
    return t;
  };
}
function semPadroes() {
  const e = loc().slice(0, 10),
    t = diasMais(e, -60),
    a = S.trades
      .map((l) => ({ ...l, c: calc(l) }))
      .filter(
        (l) =>
          l.c.pl != null && dOf(l) >= t && dOf(l) <= e && moedaT(l) !== "USD",
      )
      .map((l) => ({
        t: l,
        d: dOf(l),
        v: emBRL(l.c.pl, moedaT(l)),
        h: +String(l.dt || "").slice(11, 13),
      }));
  if (a.length < 5) return null;
  const o = {};
  a.forEach((l) => {
    var d;
    (((o[(d = l.d)] ?? (o[d] = { v: 0, n: 0 })).v += l.v), o[l.d].n++);
  });
  const s = Object.keys(o),
    n = (l, d) => {
      const c = {};
      return (
        s.forEach((p) => {
          const u = d(S.days[p] || {}, p);
          u != null && (c[u] ?? (c[u] = [])).push(o[p].v);
        }),
        Object.entries(c)
          .filter(([, p]) => p.length >= 2)
          .map(([p, u]) => ({
            k: p,
            n: u.length,
            med: u.reduce((m, f) => m + f, 0) / u.length,
          }))
      );
    },
    r = [],
    i = (l, d, c) => {
      if (l.length < 2) return;
      const p = l.slice().sort((f, x) => x.med - f.med),
        u = p[0],
        m = p[p.length - 1];
      u.med - m.med < 1 ||
        r.push({
          t: c,
          txt: `Nos dias em que ${d[m.k] || m.k}, seu resultado médio foi ${money(m.med)} (${m.n} dias). Quando ${d[u.k] || u.k}: ${money(u.med)} (${u.n} dias).`,
          peso: Math.abs(u.med - m.med),
        });
    };
  (i(
    n("sono", (l) => l.sono || null),
    { b: "dormiu bem", m: "dormiu mais ou menos", r: "dormiu mal" },
    "Sono",
  ),
    i(
      n("estado", (l) =>
        +l.estado >= 4
          ? "alto"
          : +l.estado >= 1 && +l.estado <= 2
            ? "baixo"
            : +l.estado == 3
              ? "medio"
              : null,
      ),
      {
        alto: "você estava bem antes de operar (4 ou 5)",
        medio: "você estava neutro (3)",
        baixo: "você estava mal antes de operar (1 ou 2)",
      },
      "Como você estava",
    ),
    i(
      n("ck", (l) => (l.ckok ? "s" : Object.keys(l).length ? "n" : null)),
      { s: "concluiu o checklist", n: "não concluiu o checklist" },
      "Checklist",
    ));
  {
    const l = n("ep", (d) => {
      try {
        const c = epeetNota(d.epeet);
        return c ? c.cls : null;
      } catch {
        return null;
      }
    });
    i(
      l,
      {
        up: "a escala emocional deu estável",
        eq: "a escala deu neutro",
        dn: "a escala deu instável",
      },
      "Escala emocional",
    );
  }
  {
    const l = {};
    a.forEach((c) => {
      if (!(c.h >= 0)) return;
      const p =
        c.h < 10
          ? "antes das 10h"
          : c.h < 12
            ? "das 10h às 12h"
            : c.h < 14
              ? "das 12h às 14h"
              : c.h < 16
                ? "das 14h às 16h"
                : "depois das 16h";
      (((l[p] ?? (l[p] = { v: 0, n: 0, g: 0 })).v += c.v),
        l[p].n++,
        c.v > 0 && l[p].g++);
    });
    const d = Object.entries(l).filter(([, c]) => c.n >= 3);
    if (d.length >= 2) {
      d.sort((u, m) => m[1].v - u[1].v);
      const c = d[0],
        p = d[d.length - 1];
      p[1].v < c[1].v &&
        r.push({
          t: "Horário",
          txt: `Seu melhor horário é ${c[0]}: ${money(c[1].v)} em ${c[1].n} trades (${Math.round((c[1].g / c[1].n) * 100)}% de acerto). O pior é ${p[0]}: ${money(p[1].v)} em ${p[1].n} trades (${Math.round((p[1].g / p[1].n) * 100)}% de acerto).`,
          peso: c[1].v - p[1].v,
        });
    }
  }
  {
    const l = [
        "domingo",
        "segunda",
        "terça",
        "quarta",
        "quinta",
        "sexta",
        "sábado",
      ],
      d = {};
    s.forEach((p) => {
      const u = new Date(p + "T12:00").getDay();
      (d[u] ?? (d[u] = [])).push(o[p].v);
    });
    const c = Object.entries(d)
      .filter(([, p]) => p.length >= 2)
      .map(([p, u]) => [
        l[p],
        u.reduce((m, f) => m + f, 0) / u.length,
        u.length,
      ]);
    if (c.length >= 2) {
      c.sort((m, f) => f[1] - m[1]);
      const p = c[0],
        u = c[c.length - 1];
      p[1] - u[1] >= 1 &&
        r.push({
          t: "Dia da semana",
          txt: `Na ${p[0]} você ganha em média ${money(p[1])} por dia; na ${u[0]}, ${money(u[1])}.`,
          peso: p[1] - u[1],
        });
    }
  }
  {
    const l = a.filter((c) => c.t.rules === "n"),
      d = a.filter((c) => c.t.rules !== "n");
    if (l.length >= 2 && d.length >= 2) {
      const c = (p) => p.reduce((u, m) => u + m.v, 0);
      r.push({
        t: "Regras",
        txt: `Trades fora das regras: ${money(c(l))} em ${l.length} trades. Dentro das regras: ${money(c(d))} em ${d.length} trades.`,
        peso: Math.abs(c(d) / d.length - c(l) / l.length),
      });
    }
  }
  {
    const l = [],
      d = {};
    if (
      (a
        .slice()
        .sort((c, p) => String(c.t.dt).localeCompare(String(p.t.dt)))
        .forEach((c) => {
          var p;
          (d[(p = c.d)] ?? (d[p] = [])).push(c);
        }),
      Object.values(d).forEach((c) => {
        for (let p = 1; p < c.length; p++) c[p - 1].v < 0 && l.push(c[p]);
      }),
      l.length >= 3)
    ) {
      const c = l.filter((u) => u.v > 0).length,
        p = l.reduce((u, m) => u + m.v, 0);
      r.push({
        t: "Depois de uma perda",
        txt: `No trade seguinte a uma perda, no mesmo dia, você acertou ${Math.round((c / l.length) * 100)}% e somou ${money(p)} (${l.length} trades).${p < 0 ? " Sinal de operar para recuperar: considere uma pausa depois de cada stop." : ""}`,
        peso: Math.abs(p),
      });
    }
  }
  return {
    de: t,
    ate: e,
    n: a.length,
    dias: s.length,
    P: r.sort((l, d) => d.peso - l.peso),
  };
}
function semPadroesHtml() {
  const e = semPadroes();
  return e
    ? `<h2>Padrões dos últimos 60 dias</h2><div class="card"><div class="sm mut" style="margin-bottom:6px">${e.n} trades em ${e.dias} dias (Brasil). Ordem: o padrão que mais pesou no seu resultado primeiro.</div>
${e.P.length ? e.P.map((t) => `<div class="sempad"><b>${esc(t.t)}</b><span>${esc(t.txt)}</span></div>`).join("") : '<div class="sm mut">Ainda não apareceu diferença clara. Marque o sono, como você estava e o checklist todo dia para o app achar os padrões.</div>'}
<div class="sm mut" style="margin-top:6px">Padrões com poucos dias podem ser coincidência. Use como pista, não como regra.</div></div>`
    : '<h2>Padrões dos últimos 60 dias</h2><div class="card sm mut">Com pelo menos 5 trades nos últimos 60 dias, o app mostra aqui os seus padrões: sono, como você estava, checklist, horário, dia da semana, regras e o que acontece depois de uma perda.</div>';
}
{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    if (RP[0] !== "w") return t;
    const a = t.indexOf("<h2>Calendário</h2>");
    return a > 0
      ? t.slice(0, a) + semPadroesHtml() + t.slice(a)
      : t + semPadroesHtml();
  };
}
{
  const e = semAviso;
  semAviso = function () {
    const t = e.apply(this, arguments);
    try {
      if (
        new Date().getDay() !== 6 ||
        tab !== "home" ||
        document.getElementById("semav")
      )
        return t;
      const [a, o, s] = rng("w0");
      if (((S.rev || {})[s] || {}).feita || semResumo(a, o).vazio) return t;
      const n = document.getElementById("app");
      if (!n) return t;
      const r = document.createElement("div");
      ((r.id = "semav"),
        (r.className = "card"),
        (r.innerHTML =
          '<div class="top"><b>📋 Revisão da semana</b><button class="btn s" data-semgo="w0">Fazer agora</button></div><div class="sm mut">Sábado é um bom dia para revisar: resultado, erros e os seus padrões dos últimos 60 dias.</div>'));
      const i = n.querySelector("section,.hero,h1");
      i && i.parentNode === n ? n.insertBefore(r, i.nextSibling) : n.prepend(r);
    } catch {}
    return t;
  };
}
function mesaRitmo(e, t) {
  if (!(t.meta > 0)) return null;
  const a = Math.max(0, t.meta - t.lucroEf),
    o = t.ks.length,
    s = o ? t.lucroEf / o : 0,
    n = a > 0 && s > 0 ? Math.ceil(a / s) : null,
    r = a > 0 && t.restam > 0 ? a / t.restam : null;
  return {
    falta: a,
    med: s,
    n: o,
    dias: n,
    porDia: r,
    acimaCons: r && t.ganhoMaxHoje && r > t.ganhoMaxHoje,
  };
}
function mesaRitmoHtml(e, t, a) {
  const o = mesaRitmo(e, t);
  if (!o) return "";
  const s = (n) => mFmt(e, n);
  return o.falta <= 0
    ? `<div class="sm g" style="margin-top:8px">Meta de lucro batida.${t.diasOk ? (t.consOk === !1 ? " Falta a consistência." : "") : " Faltam dias mínimos."}</div>`
    : a
      ? `<div class="sm" style="margin-top:6px">Falta <b>${s(o.falta)}</b> para a meta${o.dias ? ` · no seu ritmo, uns <b>${o.dias}</b> pregões` : ""}</div>`
      : `<div class="card mesarit"><b>Ritmo até a meta</b><div class="kv" style="margin-top:6px">
<div class="card" style="margin:0;padding:10px"><span class="sm mut">Falta</span><div><b style="font-size:16px">${s(o.falta)}</b></div></div>
<div class="card" style="margin:0;padding:10px"><span class="sm mut">Média por pregão</span><div><b class="${cls(o.med)}" style="font-size:16px">${o.n ? s(o.med) : "–"}</b></div><div class="sm mut">${o.n} pregão(ões) operado(s)</div></div>
<div class="card" style="margin:0;padding:10px"><span class="sm mut">No seu ritmo</span><div><b style="font-size:16px">${o.dias ? o.dias + " pregão(ões)" : o.n ? "ritmo negativo" : "–"}</b></div></div>
${o.porDia ? `<div class="card" style="margin:0;padding:10px"><span class="sm mut">Para fechar no prazo</span><div><b style="font-size:16px">${s(o.porDia)}/dia</b></div><div class="sm mut">${t.restam} dia(s) de prazo</div></div>` : ""}</div>
${o.acimaCons ? `<div class="warn sm" style="margin-top:8px">Para fechar no prazo você precisaria de ${s(o.porDia)} por dia, acima do ganho máximo recomendado pela consistência (${s(t.ganhoMaxHoje)}). Não force: um dia grande demais reprova a consistência.</div>` : ""}
${o.n && o.med <= 0 ? '<div class="warn sm" style="margin-top:8px">Seu resultado médio por pregão está negativo. Antes de pensar na meta, foque em não perder: lote menor e só o setup principal.</div>' : ""}</div>`;
}
{
  const e = vMesa;
  vMesa = function () {
    const t = e.apply(this, arguments);
    try {
      const a = mesaCfg();
      if (!a) return t;
      const o = mesaCalc(a),
        s = t.indexOf('<div class="kv" style="margin-top:10px">');
      return s > 0 ? t.slice(0, s) + mesaRitmoHtml(a, o, !1) + t.slice(s) : t;
    } catch {
      return t;
    }
  };
}
{
  const e = mesaMini;
  mesaMini = function () {
    const t = e.apply(this, arguments);
    try {
      const a = mesaCfg();
      if (!a || !t) return t;
      const o = mesaCalc(a),
        s =
          '<button class="btn s" style="width:100%;margin-top:10px" data-m2="mesa">';
      return t.replace(s, mesaRitmoHtml(a, o, !0) + s);
    } catch {
      return t;
    }
  };
}
function crSaida() {
  const e = crCfg(),
    t = crCalc(e),
    a = t.fe,
    o = t.custo,
    s = t.alvo,
    n = +e.mesesPos || 0,
    r = [];
  if (
    (r.push({
      t: `${n} meses positivos seguidos`,
      k: Math.max(0, n - t.seq),
      obs:
        t.seq >= n
          ? "cumprido"
          : `faltam ${n - t.seq} mês(es) positivos, sem nenhum negativo no meio`,
    }),
    s > 0)
  ) {
    let c = null;
    for (let p = 0; p <= 6; p++)
      if (
        !(a.length + p < 6) &&
        (a
          .slice(-(6 - p))
          .map((u) => u.liq)
          .reduce((u, m) => u + m, 0) +
          p * s) /
          6 >=
          s - 0.5
      ) {
        c = p;
        break;
      }
    r.push({
      t: "Média de 6 meses na renda alvo",
      k: c,
      obs:
        c === 0
          ? "cumprido"
          : `se render ${money(s)} líquidos por mês a partir de agora`,
    });
  } else
    r.push({
      t: "Média de 6 meses na renda alvo",
      k: null,
      obs: "preencha a renda alvo ou o salário",
    });
  if (o > 0) {
    const c = a.slice(-6);
    let p = Math.max(0, 6 - a.length);
    for (let u = 0; u < c.length; u++)
      if (c[c.length - 1 - u].liq < -o) {
        p = Math.max(p, 6 - u);
        break;
      }
    r.push({
      t: "6 meses sem perder mais que 1 mês de custo",
      k: p,
      obs: p === 0 ? "cumprido" : "até o mês ruim sair da janela de 6 meses",
    });
  }
  {
    const c = o * (+e.mesesReserva || 0),
      p = +e.reserva || 0,
      u = Math.max(0, c - p),
      m = finRitmo(finD().res);
    r.push({
      t: `Reserva de ${e.mesesReserva || 0} meses`,
      k: o ? (u <= 0 ? 0 : m > 0 ? Math.ceil(u / m) : null) : null,
      obs: o
        ? u <= 0
          ? "cumprido"
          : m > 0
            ? `faltam ${money(u)}, guardando ${money(m)}/mês`
            : `faltam ${money(u)}: lance os depósitos na aba Reserva para o app calcular`
        : "preencha o custo de vida",
    });
  }
  const i = t.crit[4],
    l = r.filter((c) => c.k != null),
    d = r.every((c) => c.k != null) ? Math.max(...r.map((c) => c.k)) : null;
  return { itens: r, k: d, disc: i, R: t, c: e };
}
function crSaidaHtml() {
  const e = crSaida(),
    t = (c) => {
      const p = new Date();
      return (
        p.setDate(1),
        p.setMonth(p.getMonth() + c),
        p.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      );
    },
    a = finD(),
    o = a.cas,
    s = +o.meta || 6e4,
    n = finSoma(o.ap),
    r = Math.max(0, s - n),
    i = finRitmo(o.ap),
    l = r > 0 && i > 0 ? Math.ceil(r / i) : null,
    d =
      e.k == null
        ? "Ainda sem data: faltam informações"
        : e.k === 0
          ? e.disc.ok
            ? "Os números já permitem planejar a saída"
            : "Só falta a disciplina"
          : `Mais cedo: ${t(e.k)}`;
  return `<div class="card crsai"><b>📅 Quando dá para largar a CLT</b><div class="crsai-d">${esc(d)}</div>
<div class="sm mut" style="margin-bottom:6px">${e.k > 0 ? "Se tudo der certo daqui para frente. O critério mais demorado decide a data." : "Cada critério com o tempo que ainda falta."}</div>
${e.itens.map((c) => `<div class="crsai-i"><b class="${c.k === 0 ? "g" : c.k == null ? "mut" : ""}">${c.k === 0 ? "✓" : c.k == null ? "?" : c.k + " m"}</b><div><div>${esc(c.t)}</div><div class="sm mut">${esc(c.obs)}</div></div></div>`).join("")}
<div class="crsai-i"><b class="${e.disc.ok ? "g" : "am"}">${e.disc.ok ? "✓" : "!"}</b><div><div>Disciplina nas regras (90% dos trades)</div><div class="sm mut">${e.disc.ok ? "cumprido" : esc(e.disc.falta || "hoje em " + e.disc.v) + ". Não depende do tempo: depende de seguir o plano"}</div></div></div>
<div class="crsai-c"><b>💍 Casamento:</b> ${r <= 0 ? "meta batida" : l ? `no ritmo atual (${money(i)}/mês) você chega aos ${fm0(s)} em ${t(l)}` : `faltam ${fm0(r)}; lance os depósitos para o app estimar`}${o.data ? `, e o casamento está marcado para ${new Date(o.data + "T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}` : ""}.${l && e.k > 0 && l > e.k ? " O casamento termina depois da data de saída: considere sair só depois da festa paga." : ""}</div></div>`;
}
{
  const e = vCarreira;
  vCarreira = function () {
    const t = e.apply(this, arguments);
    try {
      if (typeof FIN < "u" && FIN.t && FIN.t !== "plano") return t;
      const a = t.indexOf("<h2>Critérios</h2>");
      return a > 0 ? t.slice(0, a) + crSaidaHtml() + t.slice(a) : t;
    } catch {
      return t;
    }
  };
}
{
  const e = TraderStyles.slot("legacy-097");
  ((e.id = "diario173"),
    (e.textContent = TraderStyles.css("legacy-097")),
    TraderStyles.mount(e));
}
const MESA_OFF = () => !!(S.ax || {}).mesaOff;
function mesaOffAjusta() {
  try {
    if (navigator.webdriver && APP_STORAGE.getItem("diario-teste-legado"))
      return;
    S &&
      S.ax &&
      !S.ax["mesa.v251"] &&
      ((S.ax["mesa.v251"] = 1), (S.ax.mesaOff = 1), save());
  } catch {}
}
{
  const e = mesaCfg;
  mesaCfg = function () {
    return MESA_OFF() ? null : e.apply(this, arguments);
  };
}
{
  const e = mmLista;
  mmLista = function () {
    const t = e.apply(this, arguments);
    return MESA_OFF() ? [] : t;
  };
}
{
  const e = grpHeader;
  grpHeader = function (t) {
    let a = e.apply(this, arguments);
    return (
      MESA_OFF() &&
        (a = a.replace(
          /<button class="[^"]*" data-a="gotab" data-id="mesa">Mesas propriet\xe1rias<\/button>/,
          "",
        )),
      a
    );
  };
}
{
  const e = vPainel;
  vPainel = function () {
    let t = e.apply(this, arguments);
    return MESA_OFF()
      ? ((t = t
          .replace(
            /<div class="card" style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b>Painel completo da mesa[\s\S]*?(?=<h2>\ud83c\udfaf)/,
            "",
          )
          .replace("<h1>Mesa e risco</h1>", "<h1>Metas e risco</h1>")),
        t +
          '<div class="card sm mut" style="margin-top:14px">🛡️ A mesa proprietária está desligada. Seus dados de mesa continuam guardados. <button class="lnk" data-mesaon="1">Religar a mesa</button></div>')
      : t;
  };
}
{
  const e = vMesa;
  vMesa = function () {
    return MESA_OFF()
      ? vPainel()
      : e
          .apply(this, arguments)
          .replace(
            /(<h1>[^<]*<\/h1>)/,
            '$1<div class="sm" style="margin:-4px 0 8px"><button class="lnk" data-mesaoff="1">Não uso mais mesa: desligar</button></div>',
          );
  };
}
document.addEventListener("click", (e) => {
  const t = (a) => e.target.closest && e.target.closest(a);
  if (t("[data-mesaon]")) {
    (((S.ax ?? (S.ax = {})).mesaOff = 0),
      save(),
      mesaMenu(),
      render(),
      toast("Mesa proprietária religada."));
    return;
  }
  if (t("[data-mesaoff]")) {
    if (
      !confirm(
        "Desligar a mesa proprietária? Ela some do app, mas os dados ficam guardados.",
      )
    )
      return;
    (((S.ax ?? (S.ax = {})).mesaOff = 1),
      save(),
      mesaMenu(),
      render(),
      toast("Mesa desligada. Para religar: Painel, no fim da página."));
    return;
  }
});
function mesaMenu() {
  const e = MESA_OFF();
  try {
    FER2.forEach((t) => {
      const a = t[1].find((o) => o[0] === "mesa");
      a &&
        ((a[2] = e ? "Metas e risco" : "Mesa e risco"),
        (a[3] = e
          ? "Metas, limites, trava, contratos e backup"
          : "Mesas, metas, limites, trava e backup"));
    });
  } catch {}
  try {
    const t = IMP_DEST.findIndex((a) => a[0] === "mesa");
    e && t >= 0
      ? IMP_DEST.splice(t, 1)
      : !e && t < 0 && IMP_DEST.push(["mesa", "Mesa proprietária"]);
  } catch {}
}
{
  const e = render0;
  render0 = function () {
    return (
      mesaOffAjusta(),
      MESA_OFF() !== mesaMenu._o && ((mesaMenu._o = MESA_OFF()), mesaMenu()),
      e.apply(this, arguments)
    );
  };
}
const DUO_TAM = 6,
  DUO_VMAX = 5,
  DUO_REGEN = 3 * 36e5,
  duoS = () => {
    const e = enS(),
      t = e.duo ?? (e.duo = {});
    return (
      t.lic ?? (t.lic = {}),
      t.conv ?? (t.conv = {}),
      t.vid ?? (t.vid = { n: DUO_VMAX, ts: Date.now() }),
      e.cfg.vidas == null && (e.cfg.vidas = 1),
      e.cfg["meta.v251"] ||
        ((e.cfg["meta.v251"] = 1),
        [50, 100, 150].includes(+e.cfg.meta) || (e.cfg.meta = 100)),
      t
    );
  },
  DUO = { aba: "trilha" };
try {
  const e = APP_STORAGE.getItem("diario-duo-aba");
  (e && (DUO.aba = e),
    navigator.webdriver &&
      APP_STORAGE.getItem("diario-teste-legado") &&
      (DUO.aba = "pratica"));
} catch {}
function duoVidas() {
  const e = duoS(),
    t = e.vid;
  if (t.n < DUO_VMAX) {
    const a = Math.floor((Date.now() - t.ts) / DUO_REGEN);
    a > 0 &&
      ((t.n = Math.min(DUO_VMAX, t.n + a)),
      (t.ts = t.n >= DUO_VMAX ? Date.now() : t.ts + a * DUO_REGEN));
  } else t.ts = Date.now();
  return t;
}
const duoVidasOn = () => !!enS().cfg.vidas;
function duoProxVida() {
  const e = duoVidas();
  return e.n >= DUO_VMAX
    ? ""
    : new Date(e.ts + DUO_REGEN).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
}
function duoPerdeVida() {
  if (!duoVidasOn()) return;
  const e = duoVidas();
  (e.n >= DUO_VMAX && (e.ts = Date.now()),
    (e.n = Math.max(0, e.n - 1)),
    save());
}
function duoGanhaVida(e = 1) {
  const t = duoVidas();
  ((t.n = Math.min(DUO_VMAX, t.n + e)),
    t.n >= DUO_VMAX && (t.ts = Date.now()),
    save());
}
function duoUnid() {
  const e = enTemas(),
    t = enTodos(),
    a = enS().r,
    o = duoS();
  let s = !0;
  return e.map(([n, r, i], l) => {
    const d = t.filter((h) => h.t === n),
      c = Math.max(1, Math.ceil(d.length / DUO_TAM)),
      p = [];
    for (let h = 0; h < c; h++) {
      const b = d.slice(h * DUO_TAM, (h + 1) * DUO_TAM),
        y =
          (o.lic[n + ":" + h] || 0) > 0 ||
          (b.length > 0 && b.every((j) => a[j.id]));
      p.push({ j: h, ws: b, feita: y });
    }
    const u = p.some((h) => h.feita),
      m = l === 0 || s || u;
    let f = !0;
    p.forEach((h) => {
      ((h.aberta = m && (f || h.feita)), (f = h.feita));
    });
    const x = p.every((h) => h.feita),
      v = { feita: !!o.conv[n], aberta: m && x },
      g = {
        k: n,
        nome: r,
        ic: i,
        u: l,
        lic: p,
        conv: v,
        aberta: m,
        todas: x,
        ok: x && v.feita,
      };
    return ((s = x), g);
  });
}
function duoAtual(e) {
  e = e || duoUnid();
  for (const t of e) {
    if (!t.aberta) continue;
    const a = t.lic.find((o) => o.aberta && !o.feita);
    if (a) return { u: t, l: a };
    if (t.conv.aberta && !t.conv.feita) return { u: t, conv: 1 };
  }
  return null;
}
function duoLicao(e, t) {
  const a = duoUnid().find((i) => i.k === e);
  if (!a) return null;
  const o = a.lic[t];
  if (!o || !o.ws.length) return null;
  const s = enS().r,
    n = o.ws,
    r = [];
  return (
    n.forEach((i) => r.push(enPergunta(i, s[i.id] ? "mc_pt" : "mc_en"))),
    n.length >= 3 && r.push(duoPares(n.slice(0, 5))),
    enEmb(n)
      .slice(0, 4)
      .forEach((i) =>
        r.push(
          enPergunta(
            i,
            enEmb(["lacuna", "ouvir", "montar", "mc_pt", "falar"])[0],
          ),
        ),
      ),
    enEmb(enDevidas().filter((i) => !n.includes(i)))
      .slice(0, 1)
      .forEach((i) =>
        r.push(enPergunta(i, enEmb(["mc_pt", "ouvir", "lacuna"])[0])),
      ),
    {
      modo: "lic",
      tema: e,
      duoJ: t,
      Q: r,
      i: 0,
      res: [],
      xp: 0,
      sel: [],
      resp: null,
      fim: 0,
      ini: Date.now(),
    }
  );
}
function duoPares(e) {
  const t = e.map((a, o) => o);
  return {
    tp: "pares",
    it: e[0],
    ws: e,
    esq: enEmb(t),
    dir: enEmb(t),
    feitos: [],
    sel: null,
    erro: null,
    erros: 0,
    errou: {},
  };
}
