const anxLoad = async () => {
    if (ANL) return;
    ANL = 1;
    const e = await idb("kv", "get", "anx");
    if (e && typeof e == "object") {
      const t = new Date(Date.now() - 3888e6).toISOString().slice(0, 10);
      (Object.keys(e).forEach((a) => {
        e[a] && e[a].dia && e[a].dia < t && delete e[a];
      }),
        (ANX.res = e),
        tab === "analise" && render());
    }
  },
  anxN = (e, t = 2) =>
    e == null || e === "" || !isFinite(+e)
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        }),
  anxP = (e) => anxN(e, Math.abs(+e) < 1 ? 4 : 2),
  anxPc = (e) => (e == null || !isFinite(+e) ? "–" : anxN(+e * 100, 1) + "%"),
  anxBig = (e) =>
    e == null || !isFinite(+e)
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          notation: "compact",
          maximumFractionDigits: 1,
        }),
  anxV = (e) =>
    e == null || e === ""
      ? ""
      : Array.isArray(e)
        ? '<ul class="anx">' +
          e.map((t) => "<li>" + anxV(t) + "</li>").join("") +
          "</ul>"
        : typeof e == "object"
          ? Object.entries(e)
              .map(
                ([t, a]) =>
                  `<div class="anx"><b>${esc(t.replace(/_/g, " "))}:</b> ${anxV(a)}</div>`,
              )
              .join("")
          : `<span class="anx">${esc(e)}</span>`,
  anxSec = (e, t) => {
    const a = anxV(t);
    return a ? `<h3>${e}</h3>${a}` : "";
  },
  anxVb = (e, t) => (e ? `<span class="vb ${t}">${esc(e)}</span>` : ""),
  anxVies = (e) => (
    (e = String(e || "").toUpperCase()),
    anxVb(e, e === "ALTA" ? "g" : e === "BAIXA" ? "r" : "n")
  ),
  anxDisc =
    '<p class="sm mut">Conteúdo gerado por IA a partir de dados de terceiros (com atraso) e pode conter erros. Não é recomendação de investimento.</p>',
  anxBar = (e, t, a) =>
    `<div class="sm" style="margin-top:8px">${esc(e)} · ${anxN(t, 1)}%</div><div class="anxb"><i style="width:${Math.min(100, Math.abs(+t) || 0)}%;background:${a || (t < 0 ? "var(--r)" : "var(--ac)")}"></i></div>`,
  anxArr = (e) => (Array.isArray(e) ? e : []);
var anxItens;
async function anxCall(e) {
  const t = cfg();
  if (!t) throw new Error("Configure o Supabase em config.js.");
  if (!SESS) throw new Error("Entre na sua conta (Mais → Conta).");
  await tok();
  const a = new AbortController(),
    o = setTimeout(() => a.abort(), 17e4);
  try {
    const s = await fetch(t.url + "/functions/v1/analise", {
      method: "POST",
      signal: a.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: t.key,
        Authorization: "Bearer " + SESS.at,
      },
      body: JSON.stringify(e),
    });
    if (s.status === 401)
      throw new Error("Entre na sua conta de novo (Mais → Conta).");
    if (s.status === 404)
      throw new Error(
        'A função "analise" ainda não foi publicada no Supabase (veja o README).',
      );
    const n = await s.json().catch(() => ({}));
    if (!s.ok)
      throw new Error(
        (n.erro || "Erro " + s.status) +
          (anxArr(n.erros).length ? " — " + n.erros.join("; ") : ""),
      );
    return n;
  } catch (s) {
    throw s && s.name === "AbortError"
      ? new Error("Demorou demais. Tente de novo.")
      : s;
  } finally {
    clearTimeout(o);
  }
}
async function anxRun(e) {
  if (ANX.busy) return;
  let t = ANX.mk,
    a,
    o,
    s = "";
  const n = (ANX.tkA || "").trim().toUpperCase();
  if (e === "pos") {
    const r = anxPosItens();
    if (!r.length) {
      ((ANX.msg =
        "Nenhuma posição aberta no diário (Day trade, Swing ou Opções)."),
        render());
      return;
    }
    ((a = { modo: "posicoes", itens: r }),
      (o = "pos"),
      (s = r.map((i) => i.id).join(",")));
  } else if (e === "img") {
    if (!ANX.img) {
      ((ANX.msg = "Escolha a foto do gráfico primeiro."), render());
      return;
    }
    a = {
      modo: "imagem",
      img: { mime: "image/jpeg", data: ANX.img.b64 },
      foco: ANX.foco,
    };
    const r = (ANX.tk || "").trim().toUpperCase();
    (r && ((a.tk = r), (a.mk = t)), (o = "img"));
  } else if (n)
    ((t = scB3(n) ? "BR" : "US"),
      (a = {
        modo: e === "tec" ? "tecnica" : "fundamentalista",
        itens: [{ tk: n, mk: t, cl: "acao", q: 0, pm: 0, peso: 100, lu: 0 }],
        avulso: !0,
      }),
      (o = "tk:" + n + ":" + e));
  else {
    const r = anxItens(t);
    if (!r.length) {
      ((ANX.msg =
        "Lance ações, ETFs ou FIIs na carteira deste mercado primeiro (Mais → Carteiras)."),
        render());
      return;
    }
    ((a = { modo: e === "tec" ? "tecnica" : "fundamentalista", itens: r }),
      (o = t + ":" + e),
      (s = r.map((i) => i.tk).join(",")));
  }
  if (e !== "img" && ANX.res[o] && ANX.res[o].dia === loc().slice(0, 10)) {
    if (
      !confirm(
        "Já existe um relatório de hoje para isto. Gerar outro usa cota do Gemini. Continuar?",
      )
    )
      return;
    a.force = !0;
  }
  ((ANX.busy = e), (ANX.msg = ""), (ANX.det = ""), (ANX.ok = ""), render());
  try {
    const r = await anxCall(a);
    (n && e !== "img" && e !== "pos" && (r.unico = n),
      (r.dia = loc().slice(0, 10)),
      s && (r.sig = s),
      (ANX.res[o] = r),
      idb("kv", "put", ANX.res, "anx"));
  } catch (r) {
    const i = em(r);
    ((ANX.msg = anxFriendly(i)), (ANX.det = anxDet(i)));
  }
  ((ANX.busy = ""), render());
}
const anxShrink = (e) =>
  new Promise((t, a) => {
    const o = new Image(),
      s = URL.createObjectURL(e);
    ((o.onload = () => {
      const n = Math.min(1, 1600 / Math.max(o.width, o.height)),
        r = document.createElement("canvas");
      ((r.width = Math.round(o.width * n)),
        (r.height = Math.round(o.height * n)));
      const i = r.getContext("2d");
      ((i.fillStyle = "#fff"),
        i.fillRect(0, 0, r.width, r.height),
        i.drawImage(o, 0, 0, r.width, r.height));
      const l = r.toDataURL("image/jpeg", 0.82);
      (URL.revokeObjectURL(s), t({ b64: l.split(",")[1], url: l }));
    }),
      (o.onerror = () => {
        (URL.revokeObjectURL(s), a(new Error("img")));
      }),
      (o.src = s));
  });
function anxChart(e) {
  const t = anxArr(e.candles).slice(-45);
  if (t.length < 3) return "";
  const a = ANX.pt,
    o = ANX.sh,
    s = 340,
    n = 230,
    r = 4,
    i = 72,
    l = 8,
    d = 18,
    c = Math.max(...t.map((I) => I[2])),
    p = Math.min(...t.map((I) => I[3])),
    u = (c - p) * 0.3,
    m = [];
  [
    ["d", "diario", "D", "var(--ac)", ""],
    ["w", "semanal", "S", "#c2933d", "5 3"],
  ].forEach(([I, J, se, Ie, Pe]) => {
    if (o !== "both" && o !== I) return;
    const Me = (e.pivos || {})[J];
    !Me ||
      !Me[a] ||
      Object.entries(Me[a]).forEach(([ue, ve]) => {
        ve != null &&
          isFinite(ve) &&
          ve >= p - u &&
          ve <= c + u &&
          m.push({ v: +ve, t: se + " " + ue, col: Ie, da: Pe });
      });
  });
  const f = +e.preco_atual,
    x = Math.min(p, ...m.map((I) => I.v)),
    v = Math.max(c, ...m.map((I) => I.v)),
    g = (I) => l + ((v - I) / (v - x || 1)) * (n - l - d),
    h = t.length,
    b = (s - r - i) / h,
    y = (I) => r + b * (I + 0.5),
    j = Math.max(1.5, b * 0.6),
    k = (I) => String(I).slice(8, 10) + "/" + String(I).slice(5, 7);
  let A = `<svg viewBox="0 0 ${s} ${n}" style="width:100%;height:auto" role="img" aria-label="Gráfico de ${esc(e.tk)} com pivôs diários e semanais">`;
  t.forEach((I, J) => {
    const se = I[4] >= I[1] ? "var(--g)" : "var(--r)",
      Ie = y(J).toFixed(1);
    A += `<line x1="${Ie}" x2="${Ie}" y1="${g(I[2]).toFixed(1)}" y2="${g(I[3]).toFixed(1)}" stroke="${se}" stroke-width="1"/><rect x="${(y(J) - j / 2).toFixed(1)}" y="${g(Math.max(I[1], I[4])).toFixed(1)}" width="${j.toFixed(1)}" height="${Math.max(1, Math.abs(g(I[1]) - g(I[4]))).toFixed(1)}" fill="${se}"/>`;
  });
  let C = -99;
  return (
    m
      .sort((I, J) => J.v - I.v)
      .forEach((I) => {
        const J = g(I.v),
          se = Math.max(J, C + 9);
        ((C = se),
          (A += `<line x1="${r}" x2="${s - i}" y1="${J.toFixed(1)}" y2="${J.toFixed(1)}" stroke="${I.col}" stroke-width="1"${I.da ? ` stroke-dasharray="${I.da}"` : ""} opacity=".85"/><text x="${s - i + 3}" y="${(se + 3).toFixed(1)}" font-size="8.5" fill="${I.col}">${esc(I.t)} ${anxP(I.v)}</text>`));
      }),
    isFinite(f) &&
      f >= x &&
      f <= v &&
      (A += `<line x1="${r}" x2="${s - i}" y1="${g(f).toFixed(1)}" y2="${g(f).toFixed(1)}" stroke="var(--mut)" stroke-width="1" stroke-dasharray="1 2"/>`),
    (A += `<text x="${r}" y="${n - 4}" font-size="8" fill="var(--mut)">${esc(k(t[0][0]))}</text><text x="${s - i}" y="${n - 4}" font-size="8" text-anchor="end" fill="var(--mut)">${esc(k(t[h - 1][0]))}</text></svg>`),
    A +
      `<div class="sm mut">Linha azul: pivôs diários · tracejada âmbar: pivôs semanais · pontilhada: preço atual ${anxP(f)}</div>`
  );
}
function anxPivTab(e) {
  const t = ANX.pt,
    a = (e.pivos || {}).diario,
    o = (e.pivos || {}).semanal,
    s =
      t === "camarilla"
        ? ["R4", "R3", "R2", "R1", "S1", "S2", "S3", "S4"]
        : ["R3", "R2", "R1", "P", "S1", "S2", "S3"],
    n = (r, i) => (r && r[t] && r[t][i] != null ? anxP(r[t][i]) : "–");
  return `<div class="anxt"><table><tr><th>Nível</th><th>Diário</th><th>Semanal</th></tr>${s.map((r) => `<tr><td class="${r[0] === "R" ? "r" : r[0] === "S" ? "g" : ""}">${r}</td><td>${n(a, r)}</td><td>${n(o, r)}</td></tr>`).join("")}</table></div><div class="sm mut">Diário: base ${esc(a ? a.base : "sem dado")} · Semanal: base ${esc(o ? o.base : "sem dado")}</div>`;
}
const anxTog = () =>
    `<div class="seg">${[
      ["both", "Diário + semanal"],
      ["d", "Só diário"],
      ["w", "Só semanal"],
    ]
      .map(
        ([e, t]) =>
          `<button class="${ANX.sh === e ? "on" : ""}" data-an="sh" data-v="${e}">${t}</button>`,
      )
      .join("")}</div><div class="seg">${[
      ["classico", "Clássico"],
      ["fibonacci", "Fibonacci"],
      ["camarilla", "Camarilla"],
    ]
      .map(
        ([e, t]) =>
          `<button class="${ANX.pt === e ? "on" : ""}" data-an="pt" data-v="${e}">${t}</button>`,
      )
      .join("")}</div>`,
  anxHead = (e, t) =>
    `<div class="top" style="margin-top:14px"><span class="mut sm">${esc(e.ia)} · ${esc(e.modelo)} · ${esc(new Date(e.gerado).toLocaleString("pt-BR"))}${e.cache ? " · guardado" : ""}</span><button class="btn s" data-an="clr" data-v="${esc(t)}">Limpar</button></div>`,
  anxFoot = (e) =>
    (anxArr(e.avisos).length
      ? `<div class="sm mut" style="margin-top:8px">ℹ️ ${e.avisos.map(esc).join(" · ")}</div>`
      : "") +
    (anxArr(e.erros).length
      ? `<div class="warn" style="margin-top:8px">Sem dados para: ${e.erros.map(esc).join(" · ")}</div>`
      : "") +
    anxDisc,
  anxAiAtivos = (e) => anxArr(e && e.ativos),
  anxRaw = (e) =>
    e && e.texto_bruto
      ? `<div class="card"><div class="mut sm">A IA não devolveu o formato esperado. Texto original:</div><div class="anx">${esc(e.texto_bruto)}</div></div>`
      : "",
  anxTop = (e) =>
    e && e.sumario_executivo
      ? `<h2>Sumário executivo</h2><div class="card">${anxV(e.sumario_executivo)}</div>`
      : "",
  anxRiscos = (e) => {
    if (((e = anxArr(e)), !e.length)) return "";
    const t = (a, o) => (typeof a == "object" && a ? esc(a[o] || "") : "");
    return `<h2>Matriz de riscos</h2><div class="card anxt"><table><tr><th>Risco</th><th>Tipo</th><th>Prob.</th><th>Impacto</th></tr>${e.map((a) => `<tr><td>${esc(typeof a == "string" ? a : a.risco || a.titulo || "")}${a && a.gatilho ? '<div class="sm mut">' + esc(a.gatilho) + "</div>" : ""}</td><td>${t(a, "tipo")}</td><td>${t(a, "probabilidade")}</td><td>${t(a, "impacto")}</td></tr>`).join("")}</table></div>`;
  },
  anxRec = (e) => {
    if (!e) return "";
    if (typeof e != "object")
      return `<h2>Conclusão e recomendação</h2><div class="card">${anxV(e)}</div>`;
    const t = String(e.recomendacao || "").toUpperCase(),
      a = /COMPR|AUMENT/.test(t) ? "g" : /VEND|REDUZ/.test(t) ? "r" : "n",
      o = e.preco_alvo,
      s = Object.fromEntries(
        Object.entries(e).filter(
          ([n]) => !["recomendacao", "preco_alvo"].includes(n),
        ),
      );
    return `<h2>Conclusão e recomendação</h2><div class="card"><div class="top"><span>${anxVb(t, a)}</span><span class="sm">${o != null && o !== "" ? "Preço-alvo: <b>" + esc(typeof o == "number" ? anxP(o) : o) + "</b>" : ""}</span></div>${anxV(s)}</div>`;
  },
  anxBot = (e) =>
    e
      ? (e.resultados_recentes
          ? `<h2>Resultados recentes e notícias</h2><div class="card">${anxV(e.resultados_recentes)}</div>`
          : "") +
        anxRiscos(e.matriz_de_riscos) +
        anxRec(e.conclusao)
      : "";
let PDFB = null;
const pdfLib = (e, t, a) => {
  const o = a();
  return o
    ? Promise.resolve(o)
    : new Promise((s, n) => {
        const r = document.createElement("script");
        ((r.src = t),
          (r.onload = () => {
            const i = a();
            i ? s(i) : n(new Error("Falha ao iniciar " + e + "."));
          }),
          (r.onerror = () =>
            n(new Error("Sem internet para carregar o gerador de PDF."))),
          document.head.appendChild(r));
      });
};
function pdfBar() {
  if (!document.getElementById("pdfov")) return;
  const e = PDFB || {};
  ((document.getElementById("pdfbar").innerHTML =
    `<button data-pv="x" class="pvs">← Voltar</button>${e.blob ? '<button data-pv="s">📤 Salvar / compartilhar</button>' : `<button data-pv="g"${e.busy ? " disabled" : ""}>${e.busy ? "Gerando…" : "📥 Gerar PDF"}</button>`}`),
    (document.getElementById("pdfst").textContent = e.msg || ""));
}
function pdfClose(e) {
  const t = document.getElementById("pdfov");
  (t && t.remove(),
    (document.body.style.overflow = ""),
    (PDFB = null),
    !e && history.state && history.state.pdf && history.back());
}
(window.addEventListener("popstate", () => {
  document.getElementById("pdfov") && pdfClose(1);
}),
  document.addEventListener("keydown", (e) => {
    e.key === "Escape" && document.getElementById("pdfov") && pdfClose();
  }));
function anxPdf() {
  const e = document.getElementById("anx_rep");
  if (!e) return;
  const t = document.getElementById("pdfov");
  if ((t && (t.remove(), (PDFB = null)), !TraderStyles.find("pdfcss"))) {
    const p = TraderStyles.slot("legacy-005");
    ((p.id = "pdfcss"),
      (p.textContent = TraderStyles.css("legacy-005")),
      TraderStyles.mount(p));
  }
  const a = e.cloneNode(!0);
  a.querySelectorAll("button,.seg,input,label").forEach((p) => p.remove());
  const o = (ANX.tkA || "").trim().toUpperCase(),
    s =
      ANX.m === "tec"
        ? "técnico"
        : ANX.m === "fun"
          ? "fundamentalista"
          : ANX.m === "pos"
            ? "das posições abertas"
            : "do gráfico",
    n =
      ANX.m === "img"
        ? "foto"
        : ANX.m === "pos"
          ? "posições"
          : o || "carteira " + ANX.mk,
    r = "Relatório " + s + " · " + n;
  PDFB = {
    tt: r,
    busy: 0,
    blob: null,
    msg: "",
    name:
      [
        "relatorio",
        ANX.m === "tec"
          ? "tecnico"
          : ANX.m === "fun"
            ? "fundamentalista"
            : ANX.m === "pos"
              ? "posicoes"
              : "grafico",
        ANX.m === "img" || ANX.m === "pos" ? "" : o || ANX.mk,
        loc().slice(0, 10),
      ]
        .filter(Boolean)
        .join("-") + ".pdf",
  };
  const i = document.createElement("div");
  ((i.id = "pdfov"),
    (i.innerHTML = `<div class="pvbar" id="pdfbar"></div><div id="pdfst"></div><div id="pdfbody"><h1>${esc(r)}</h1><div class="sm mut">Gerado em ${esc(new Date().toLocaleString("pt-BR"))}</div></div>`),
    i.addEventListener("click", (p) => {
      const u = p.target.closest("[data-pv]");
      if (!u) return;
      const m = u.dataset.pv;
      m === "x" ? pdfClose() : m === "g" ? pdfGen() : m === "s" && pdfShare();
    }),
    document.body.appendChild(i),
    (document.body.style.overflow = "hidden"),
    (history.state && history.state.pdf) || history.pushState({ pdf: 1 }, ""));
  const l = i.querySelector("#pdfbody"),
    d = [...a.children];
  for (let p = 0; p < d.length; p++) {
    const u = d[p];
    if (/^H[23]$/.test(u.tagName) && d[p + 1]) {
      const m = document.createElement("div");
      (m.append(u, d[p + 1]), l.append(m), p++);
    } else l.append(u);
  }
  const c = getComputedStyle(i);
  (l.querySelectorAll("svg *").forEach((p) => {
    [...p.attributes].forEach((u) => {
      u.value.includes("var(") &&
        p.setAttribute(
          u.name,
          u.value.replace(
            /var\((--[\w-]+)\)/g,
            (m, f) => c.getPropertyValue(f).trim() || "#888",
          ),
        );
    });
  }),
    (i.scrollTop = 0),
    pdfBar());
}
async function pdfGen() {
  const e = PDFB;
  if (!(!e || e.busy)) {
    ((e.busy = 1),
      (e.msg = "Preparando o PDF… pode levar alguns segundos."),
      pdfBar());
    try {
      const t = await pdfLib(
          "html2canvas",
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
          () => window.html2canvas,
        ),
        a = await pdfLib(
          "jsPDF",
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
          () => window.jspdf && window.jspdf.jsPDF,
        ),
        o = new a({
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: !0,
        }),
        s = 210,
        n = 297,
        r = 14,
        i = s - 2 * r,
        l = n - 2 * r,
        d = [...document.getElementById("pdfbody").children];
      (window.TraderAssetIdentity?.decorate(document.getElementById("pdfbody")),
        await window.TraderAssetIdentity?.readyForExport?.(
          document.getElementById("pdfbody"),
        ));
      let c = r;
      for (let p = 0; p < d.length; p++) {
        e.msg = "Preparando o PDF… " + (p + 1) + "/" + d.length;
        const u = document.getElementById("pdfst");
        u && PDFB === e && (u.textContent = e.msg);
        const m = await t(d[p], {
          scale: 1.6,
          backgroundColor: "#ffffff",
          useCORS: !0,
          logging: !1,
        });
        if (!m.width || !m.height) continue;
        const f = (m.height * i) / m.width;
        if (f <= l)
          (c + f > n - r && (o.addPage(), (c = r)),
            o.addImage(m.toDataURL("image/jpeg", 0.9), "JPEG", r, c, i, f),
            (c += f + 2));
        else {
          c > r && (o.addPage(), (c = r));
          const x = Math.floor((m.width * l) / i);
          for (let v = 0; v < m.height; v += x) {
            const g = Math.min(x, m.height - v),
              h = document.createElement("canvas");
            ((h.width = m.width), (h.height = g));
            const b = h.getContext("2d");
            ((b.fillStyle = "#fff"),
              b.fillRect(0, 0, h.width, g),
              b.drawImage(m, 0, v, m.width, g, 0, 0, m.width, g),
              v > 0 && (o.addPage(), (c = r)));
            const y = (g * i) / m.width;
            (o.addImage(h.toDataURL("image/jpeg", 0.9), "JPEG", r, c, i, y),
              (c = r + y + 2));
          }
        }
      }
      (window.TraderExportBrand?.jsPdf(o, e),
        (e.blob = o.output("blob")),
        (e.msg =
          'PDF pronto. Toque em "Salvar / compartilhar" e escolha "Salvar em Arquivos".'));
    } catch (t) {
      e.msg = "Não consegui gerar o PDF: " + ((t && t.message) || t);
    }
    ((e.busy = 0), PDFB === e && pdfBar());
  }
}
async function pdfShare() {
  const e = PDFB;
  if (!e || !e.blob) return;
  const t = new File([e.blob], e.name, { type: "application/pdf" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [t] })) {
      await navigator.share({ files: [t], title: e.tt });
      return;
    }
  } catch (o) {
    if (o && o.name === "AbortError") return;
  }
  if (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    ((e.msg =
      "Este iOS não permite compartilhar arquivo daqui. Atualize o iOS ou abra o app pelo Safari."),
      pdfBar());
    return;
  }
  const a = document.createElement("a");
  ((a.href = URL.createObjectURL(e.blob)),
    (a.download = e.name),
    document.body.appendChild(a),
    a.click(),
    a.remove(),
    setTimeout(() => URL.revokeObjectURL(a.href), 4e4),
    (e.msg = "Download iniciado."),
    pdfBar());
}
function anxTec(e, t) {
  const a = e.relatorio || {},
    o = anxArr(e.ativos),
    s = (r) =>
      anxAiAtivos(a).find((i) => String(i.ticker || "").toUpperCase() === r) ||
      {};
  let n =
    anxHead(e, t) +
    anxRaw(a) +
    anxTop(a) +
    (a.visao_geral
      ? `<h2>Visão geral</h2><div class="card">${anxV(a.visao_geral)}</div>`
      : "");
  return (
    (n += `<h2>Painel técnico</h2><div class="card anxt"><table><tr><th>Ativo</th><th>Preço</th><th>Dia</th><th>RSI</th><th>vs SMA20</th><th>ATR%</th><th>Viés</th></tr>${o
      .map((r) => {
        const i = r.ind || {},
          l = String(s(r.tk).vies || "").toUpperCase();
        return `<tr><td>${esc(r.tk)}</td><td>${anxP(r.preco_atual)}</td><td class="${cls(i.var_1d_pct)}">${anxN(i.var_1d_pct)}%</td><td>${anxN(i.rsi14, 0)}</td><td class="${cls(i.dist_sma20_pct)}">${anxN(i.dist_sma20_pct, 1)}%</td><td>${anxN(i.atr14_pct, 1)}</td><td class="${l === "ALTA" ? "g" : l === "BAIXA" ? "r" : "mut"}">${esc(l || "–")}</td></tr>`;
      })
      .join("")}</table></div>`),
    (n += `<h2>Gráficos e pivôs</h2>${anxTog()}`),
    o.forEach((r) => {
      const i = s(r.tk),
        l = r.ind || {};
      n += `<div class="card"><div class="top"><span><b>${esc(r.tk)}</b> <span class="mut sm">${r.moeda === "USD" ? "US$" : "R$"} ${anxP(r.preco_atual)}</span></span>${anxVies(i.vies)}</div>${anxV(i.resumo)}${anxChart(r)}${anxPivTab(r)}
 <div><span class="chip">RSI ${anxN(l.rsi14, 0)}</span><span class="chip">SMA20 ${anxP(l.sma20)}</span><span class="chip">SMA50 ${anxP(l.sma50)}</span>${l.sma200 != null ? `<span class="chip">SMA200 ${anxP(l.sma200)}</span>` : ""}<span class="chip">ATR ${anxN(l.atr14_pct, 1)}%</span><span class="chip">Volume ${anxN(l.volume_vs_media20, 1)}× média</span></div>${anxArr(r.avisos).length ? `<div class="sm mut" style="margin-top:6px">${r.avisos.map(esc).join(" · ")}</div>` : ""}
 ${anxMtf(r, i)}${anxSec("Tendência", i.tendencia)}${anxSec("Pivôs diários", i.pivos_diarios)}${anxSec("Pivôs semanais", i.pivos_semanais)}${anxSec("Confluências", i.confluencias)}${anxSec("Indicadores", i.indicadores)}${anxSec("Força e volume", i.forca_e_volume)}${anxEnt(i.entradas)}${anxSec("Plano de trade (lado do viés)", i.plano_de_trade)}${anxSec("Zonas de interesse (entrada e saída)", i.zonas_de_interesse)}${anxSec("Cenário de alta", i.cenario_alta)}${anxSec("Cenário de baixa", i.cenario_baixa)}</div>`;
    }),
    n +
      anxBot(a) +
      (anxArr(a.alertas).length
        ? `<h2>Alertas técnicos</h2><div class="card">${anxV(a.alertas)}</div>`
        : "") +
      anxFoot(e)
  );
}
function anxFun(e, t) {
  const a = e.relatorio || {},
    o = anxArr(e.ativos),
    s = {},
    n = (l) =>
      anxAiAtivos(a).find((d) => String(d.ticker || "").toUpperCase() === l) ||
      {};
  anxItens(ANX.mk).forEach((l) => (s[l.tk] = l.peso));
  const r = {};
  o.forEach((l) => {
    const d = (l.fund && l.fund.setor) || "Sem dado";
    r[d] = (r[d] || 0) + (s[l.tk] || 0);
  });
  let i =
    anxHead(e, t) +
    anxRaw(a) +
    anxTop(a) +
    (a.visao_geral
      ? `<h2>Visão geral</h2><div class="card">${anxV(a.visao_geral)}</div>`
      : "");
  return (
    (i += anxMacro(a, e)),
    e.unico ||
      (i += `<h2>Concentração</h2><div class="card">${Object.entries(r)
        .sort((l, d) => d[1] - l[1])
        .map(([l, d]) => anxBar(l, d))
        .join("")}<h3>Por ativo</h3>${o
        .slice()
        .sort((l, d) => (s[d.tk] || 0) - (s[l.tk] || 0))
        .map((l) => anxBar(l.tk, s[l.tk] || 0, "var(--g)"))
        .join(
          "",
        )}${a.concentracao ? `<div style="margin-top:10px">${anxV(a.concentracao)}</div>` : ""}</div>`),
    (i += `<h2>Painel fundamentalista</h2><div class="card anxt"><table><tr><th>Ativo</th><th>P/L</th><th>P/VP</th><th>ROE</th><th>Mrg. líq.</th><th>Dív/PL</th></tr>${o
      .map((l) => {
        const d = l.fund || {};
        return `<tr><td>${esc(l.tk)}</td><td>${anxN(d.pl, 1)}</td><td>${anxN(d.p_vp, 2)}</td><td>${anxPc(d.roe)}</td><td>${anxPc(d.margem_liquida)}</td><td>${d.divida_pl_pct == null ? "–" : anxN(d.divida_pl_pct, 0) + "%"}</td></tr>`;
      })
      .join(
        "",
      )}</table></div><div class="sm mut">Dados de brapi, Twelve Data e Yahoo Finance (fontes não oficiais). Dividend yield e dívida/PL podem vir em escalas diferentes entre ativos.</div>`),
    o.forEach((l) => {
      const d = l.fund || {},
        c = n(l.tk),
        p = String(c.qualidade || "").toUpperCase(),
        u = String(c.valuation || "").toUpperCase(),
        m = (b, y) => `<div>${b}<b>${y}</b></div>`,
        f = d.analistas_compra_forte_e_compra || 0,
        x = d.analistas_manter || 0,
        v = d.analistas_venda_e_venda_forte || 0,
        g = f + x + v,
        h =
          d.alvo_medio_analistas && d.preco
            ? (d.alvo_medio_analistas / d.preco - 1) * 100
            : null;
      i += `<div class="card"><div class="top"><span><b>${esc(l.tk)}</b> <span class="mut sm">${esc(d.nome || "")}</span></span><span>${anxVb(p && "Qualidade " + p, p === "ALTA" ? "g" : p === "BAIXA" ? "r" : "w")}${anxVb(u && u, u === "BARATO" ? "g" : u === "CARO" ? "r" : u === "JUSTO" ? "w" : "n")}</span></div>
  <div class="sm mut">${esc(d.setor || "Setor sem dado")}${d.industria ? " · " + esc(d.industria) : ""}${l.cobertura === "baixa" ? ' · <span class="r">cobertura de dados baixa</span>' : ""}</div>${anxV(c.resumo)}
  <div class="anxm">${m("P/L", anxN(d.pl, 1))}${m("P/VP", anxN(d.p_vp, 2))}${m("EV/EBITDA", anxN(d.ev_ebitda, 1))}${m("ROE", anxPc(d.roe))}${m("Margem líq.", anxPc(d.margem_liquida))}${m("Dív/PL", d.divida_pl_pct == null ? "–" : anxN(d.divida_pl_pct, 0) + "%")}${m("Cresc. receita", anxPc(d.crescimento_receita))}${m("Cresc. lucro", anxPc(d.crescimento_lucro))}${m("Valor de mercado", anxBig(d.valor_mercado))}${m("Dividend yield", d.dividend_yield == null ? "–" : anxN(+d.dividend_yield < 1 ? d.dividend_yield * 100 : d.dividend_yield, 1) + "%")}${m("Payout", anxPc(d.payout))}${m("Beta", anxN(d.beta, 2))}</div>
  ${[
    ["Margem bruta", d.margem_bruta],
    ["Margem EBITDA", d.margem_ebitda],
    ["Margem operacional", d.margem_operacional],
    ["Margem líquida", d.margem_liquida],
  ]
    .filter((b) => b[1] != null)
    .map((b) => anxBar(b[0], b[1] * 100))
    .join("")}
  ${g ? `<div class="sm" style="margin-top:10px">Consenso de analistas (${g}): ${f} compra · ${x} manter · ${v} venda${h != null ? ` · alvo médio ${h >= 0 ? "+" : ""}${anxN(h, 1)}% vs preço` : ""}</div><div class="anxb"><i style="width:${(f / g) * 100}%;background:var(--g)"></i><i style="width:${(x / g) * 100}%;background:#c2933d"></i><i style="width:${(v / g) * 100}%;background:var(--r)"></i></div>` : ""}
  ${anxDec(c)}${anxSec("Tese de investimento", c.tese_de_investimento)}${anxSec("Vantagens competitivas", c.vantagens_competitivas)}${anxValRef(l)}${anxCen(c.cenarios)}${anxSec("Métodos de valuation", c.valuation_metodos)}${anxSec("Governança", c.governanca)}${anxSec("Pontos fortes", c.pontos_fortes)}${anxSec("Pontos de atenção", c.pontos_de_atencao)}${anxSec("Rentabilidade e margens", c.rentabilidade_e_margens)}${anxSec("Endividamento e caixa", c.endividamento_e_caixa)}${anxSec("Dividendos", c.dividendos)}${anxSec("Valuation", c.valuation_leitura)}${anxSec("Perspectivas de crescimento", c.perspectivas_de_crescimento)}${anxSec("Riscos e catalisadores", c.riscos_e_catalisadores)}</div>`;
    }),
    i +
      anxBot(a) +
      (anxArr(a.alertas).length
        ? `<h2>Alertas fundamentalistas</h2><div class="card">${anxV(a.alertas)}</div>`
        : "") +
      anxFoot(e)
  );
}
function anxImg(e, t) {
  const a = e.relatorio || {};
  let o = anxHead(e, t) + anxRaw(a);
  o += `<div class="card"><div class="top"><span><b>${esc(a.ativo_lido || "Ativo não identificado")}</b> <span class="mut sm">${esc(a.timeframe_lido || "")}</span></span>${anxVies(a.vies)}</div>${anxV(a.resumo)}${anxSec("Tendência", a.tendencia)}${anxSec("Estrutura", a.estrutura)}${anxSec("Suportes", a.suportes)}${anxSec("Resistências", a.resistencias)}${anxSec("Padrões", a.padroes)}${anxSec("Indicadores visíveis", a.indicadores_visiveis)}${anxSec("Cenário de alta", a.cenario_alta)}${anxSec("Cenário de baixa", a.cenario_baixa)}${anxSec("Limitações da leitura", a.limitacoes)}</div>`;
  const s = anxArr(e.ativos);
  return (
    s.length &&
      (o +=
        `<h2>Pivôs calculados</h2>${anxTog()}` +
        s
          .map(
            (n) =>
              `<div class="card"><b>${esc(n.tk)}</b>${anxChart(n)}${anxPivTab(n)}</div>`,
          )
          .join("")),
    o + anxFoot(e)
  );
}
function vAnalise() {
  anxLoad();
  const e = ANX.mk,
    t = ANX.m,
    a = (c, p, u) =>
      `<div class="seg wr">${u.map(([m, f]) => `<button class="${m === p ? "on" : ""}" data-an="${c}" data-v="${m}">${f}</button>`).join("")}</div>`,
    o = carCalc()[e].pos.filter((c) =>
      ["acao", "etf", "fii"].includes(c.cl),
    ).length,
    s = (ANX.tkA || "").trim().toUpperCase(),
    n =
      t === "img"
        ? "img"
        : t === "pos"
          ? "pos"
          : s
            ? "tk:" + s + ":" + t
            : e + ":" + t,
    r = ANX.res[n],
    i = ANX.busy === t,
    l = (c) =>
      `<button class="btn" style="width:100%;margin-top:10px" data-an="run" data-v="${t}"${ANX.busy ? " disabled" : ""}>${i ? "Gerando… pode levar até 2 minutos" : r ? (r.dia === loc().slice(0, 10) ? "Gerar de novo (usa cota do Gemini)" : "Atualizar relatório") : c}</button>`;
  let d =
    "<h1>Análise IA</h1>" +
    (SESS
      ? ""
      : '<div class="warn" style="margin-bottom:8px">Entre na sua conta (Mais → Conta) para usar as análises.</div>') +
    a("mk", e, [
      ["BR", "🇧🇷 Brasil"],
      ["US", "🇺🇸 EUA"],
    ]) +
    a("m", t, [
      ["tec", "📈 Técnica"],
      ["fun", "🏦 Fundamentos"],
      ["img", "🖼️ Foto"],
      ["pos", "📌 Posições"],
    ]);
  return (
    t !== "img" &&
      t !== "pos" &&
      (d += `<div class="card"><label>Analisar um ativo específico<input id="anx_ta" autocapitalize="characters" autocomplete="off" placeholder="${e === "BR" ? "PETR4, VALE3…" : "AAPL, MSFT…"}" value="${esc(ANX.tkA)}"></label><div class="sm mut" style="margin-top:6px">Digite um ticker (ex.: PETR4 ou AAPL) para analisar só esse ativo. Deixe vazio para analisar a carteira. O mercado (B3 ou EUA) é detectado pelo ticker.</div></div>`),
    t === "tec"
      ? (d += `<div class="card"><b>📈 Analista técnico CNPI-P · Gemini</b><div class="sm mut">Leitura <b>mensal → semanal → diária</b> (top-down), estrutura de topos e fundos, pivôs diários e semanais, médias, RSI, ATR e volume. Cotações: ${e === "BR" ? "brapi (B3)" : "Twelve Data (EUA)"}, com atraso. Não comenta fundamentos.</div><div class="sm mut" style="margin-top:6px">${s ? "Ativo avulso: " + esc(s) + " (" + (scB3(s) ? "B3 via brapi" : "EUA via Twelve Data") + ")" : o ? o + " ativo(s) elegível(is)" + (o > 12 ? " · analisando os 12 maiores" : "") : "Nenhuma ação, ETF ou FII lançado neste mercado."}</div>${l("Gerar relatório técnico")}</div>`)
      : t === "fun"
        ? (d += `<div class="card"><b>🏦 Analista fundamentalista CNPI-P · Gemini</b><div class="sm mut">Tese, qualidade (ROE x Selic), caixa, endividamento, dividendos, valuation por vários métodos (múltiplos, Graham, Bazin, alvo dos analistas) e cenários com probabilidade. Dados: brapi (B3), Twelve Data (EUA) e Yahoo Finance (fonte não oficial). Não comenta gráfico.</div><div class="sm mut" style="margin-top:6px">${s ? "Ativo avulso: " + esc(s) + " (" + (scB3(s) ? "B3 via brapi" : "EUA via Twelve Data") + ")" : o ? o + " ativo(s) elegível(is)" + (o > 12 ? " · analisando os 12 maiores" : "") : "Nenhuma ação, ETF ou FII lançado neste mercado."}</div>${l("Gerar relatório fundamentalista")}</div>`)
        : t === "pos"
          ? (d += `<div class="card"><b>📌 Revisão das posições abertas · Gemini</b><div class="sm mut">Revisa seus trades em aberto (day trade, swing e opções): se o stop faz sentido pelo ATR e pelos pivôs, a distância até os alvos e os vencimentos. Usa cotações da brapi/Twelve Data quando o ativo existe lá; opções usam o subjacente.</div><div class="sm mut" style="margin-top:6px">${anxPosItens().length} posição(ões) aberta(s) no diário</div>${l("Revisar posições abertas")}</div>`)
          : (d += `<div class="card"><b>🖼️ Foto do gráfico · Gemini</b><div class="sm mut">Envie um print ou foto do gráfico e o analista técnico sênior lê tendência, níveis e padrões. Se informar o ticker, o app junta os pivôs calculados com dados reais.</div>
  <label class="btn s" style="margin-top:10px;color:var(--tx);text-align:center">${ANX.img ? "Trocar foto" : "Escolher foto do gráfico"}<input type="file" accept="image/*" hidden id="anx_f"></label>${ANX.img ? `<div style="margin-top:8px"><img src="${ANX.img.url}" alt="Gráfico enviado" style="width:100%;border-radius:8px;border:1px solid var(--bd)"><button class="btn s" style="margin-top:6px" data-an="imgx">Remover foto</button></div>` : ""}
  <div class="g2"><label>Ticker (opcional)<input id="anx_tk" autocapitalize="characters" placeholder="${e === "BR" ? "PETR4" : "AAPL"}" value="${esc(ANX.tk)}"></label><label>Contexto (opcional)<input id="anx_foco" placeholder="ex.: gráfico semanal" maxlength="200" value="${esc(ANX.foco)}"></label></div>${l("Analisar foto")}</div>`),
    ANX.msg &&
      (d += `<div class="warn" style="margin-top:8px">${esc(ANX.msg)}${ANX.det && ANX.det !== ANX.msg ? `<div class="sm mut" style="margin-top:4px">Detalhe técnico: ${esc(ANX.det)}</div>` : ""}</div>`),
    ANX.ok &&
      (d += `<div class="sm" style="margin-top:8px;color:var(--g)">${esc(ANX.ok)}</div>`),
    d +
      (r
        ? anxBadge(r, t, e, s) +
          '<button class="btn" style="width:100%;margin-top:10px" data-an="pdf">📄 Gerar PDF do relatório</button><div id="anx_rep">' +
          (t === "tec"
            ? anxTec
            : t === "fun"
              ? anxFun
              : t === "pos"
                ? anxPos
                : anxImg)(r, n) +
          "</div>" +
          anxSaveBox(r, n, t)
        : anxDisc)
  );
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-an]");
  if (!t) return;
  const a = t.dataset.an,
    o = t.dataset.v;
  a === "mk"
    ? ((ANX.mk = o), (ANX.msg = ""), render())
    : a === "m"
      ? ((ANX.m = o), (ANX.msg = ""), render())
      : a === "run"
        ? anxRun(o)
        : a === "sh"
          ? ((ANX.sh = o), render())
          : a === "pt"
            ? ((ANX.pt = o), render())
            : a === "pdf"
              ? anxPdf()
              : a === "imgx"
                ? ((ANX.img = null), render())
                : a === "clr"
                  ? (delete ANX.res[o],
                    idb("kv", "put", ANX.res, "anx"),
                    render())
                  : a === "save"
                    ? anxSave(o)
                    : a === "savepos" && anxSavePos();
}),
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (!(t.id !== "anx_f" || !t.files[0])) {
      try {
        ((ANX.img = await anxShrink(t.files[0])), (ANX.msg = ""));
      } catch {
        ANX.msg = "Não consegui ler essa imagem.";
      }
      ((t.value = ""), render());
    }
  }),
  document.addEventListener("input", (e) => {
    const t = e.target;
    t.id === "anx_tk"
      ? (ANX.tk = t.value)
      : t.id === "anx_foco"
        ? (ANX.foco = t.value)
        : t.id === "anx_ta" &&
          (ANX.tkA = t.value.replace(/[^A-Za-z0-9.\-]/g, ""));
  }));
function fabDisp() {
  return ["home", "trades", "swing", "opc"].includes(tab) ? "" : "none";
}
function fabVis() {
  const e = $("#fab");
  if ((e && !T && (e.style.display = fabDisp()), fabDisp() === "none")) {
    const t = $("#fabm");
    t && (t.style.display = "none");
  }
}
function tipoMud() {
  T.tipo === "O" && (T.ot || (T.ot = "C"), T.estr || (T.estr = ESTR[0]));
}
(function () {
  const e = TraderStyles.slot("legacy-006");
  ((e.textContent = TraderStyles.css("legacy-006")), TraderStyles.mount(e));
})();
function anxDet(e) {
  return (
    (e = String(e || "")
      .replace(/\s+/g, " ")
      .trim()),
    e.length > 220 ? e.slice(0, 220) + "…" : e
  );
}
function anxFriendly(e) {
  e = String(e || "");
  const t = [
    [
      /GEMINI_API_KEY n[\xe3a]o configurada/i,
      "A chave do Gemini ainda não foi cadastrada no Supabase (GEMINI_API_KEY).",
    ],
    [
      /Gemini 429|RESOURCE_EXHAUSTED|quota|rate.?limit/i,
      "Sem cota do Gemini agora. Espere alguns minutos e tente de novo, ou troque para um modelo Flash (variáveis GEMINI_MODEL_TEC e GEMINI_MODEL_FUN no Supabase).",
    ],
    [
      /Gemini 50[0234]|overloaded|UNAVAILABLE|high demand/i,
      "O Gemini está sobrecarregado neste momento. Tente de novo em instantes.",
    ],
    [
      /Gemini 404|is not found|not supported for generateContent/i,
      "O modelo do Gemini configurado não foi encontrado. Confira o nome em GEMINI_MODEL no Supabase.",
    ],
    [
      /Gemini 40[13]|API key|API_KEY_INVALID|PERMISSION_DENIED/i,
      "O Gemini recusou a chave de acesso. Confira GEMINI_API_KEY no Supabase.",
    ],
    [
      /Gemini 400/i,
      "O Gemini não aceitou o pedido. Se for foto, tente uma imagem menor ou mais nítida.",
    ],
    [
      /Gemini n[\xe3a]o devolveu/i,
      "O Gemini não devolveu resposta. Tente de novo.",
    ],
    [
      /brapi 40[13]/i,
      "A brapi recusou o token. Confira BRAPI_TOKEN no Supabase.",
    ],
    [
      /brapi 429/i,
      "Limite de consultas da brapi atingido. Espere um pouco e tente de novo.",
    ],
    [
      /brapi 400|brapi sem hist/i,
      "A brapi não devolveu o histórico deste ativo (ticker inexistente ou histórico fora do plano grátis). Confira o ticker e tente de novo.",
    ],
    [
      /brapi/i,
      "A brapi (cotações da B3) não respondeu. Tente de novo em instantes.",
    ],
    [
      /Twelve Data.*(credit|limit|minute|run out)/i,
      "Limite da Twelve Data atingido (cotações dos EUA). Espere um minuto e tente de novo.",
    ],
    [
      /Twelve Data/i,
      "A Twelve Data (cotações dos EUA) não devolveu dados deste ativo. Confira o ticker.",
    ],
    [
      /Yahoo/i,
      "O Yahoo Finance (fundamentos) não respondeu. Tente de novo em instantes.",
    ],
    [
      /hist[\xf3o]rico curto/i,
      "Este ativo tem poucos candles para a análise técnica.",
    ],
  ];
  for (const [a, o] of t) if (a.test(e)) return o;
  return e;
}
function anxPosItens() {
  return S.trades
    .filter(isOpen)
    .sort((e, t) => t.dt.localeCompare(e.dt))
    .slice(0, 15)
    .map((e) => {
      const t = String(e.sub || "")
          .trim()
          .toUpperCase(),
        a =
          t ||
          String(e.ativo || "")
            .trim()
            .toUpperCase(),
        o = scB3(a) ? "BR" : /^[A-Z]{1,5}$/.test(a) ? "US" : "";
      return {
        id: e.id,
        ativo: String(e.ativo || "").toUpperCase(),
        tipo: e.tipo || "D",
        lado: e.side,
        entrada: +e.entry || null,
        stop: +e.stop || null,
        alvos: [e.target, e.target2, e.target3]
          .map((s) => +s || null)
          .filter(Boolean),
        qtd: +e.qty || null,
        dt: e.dt,
        ...(e.tipo === "O"
          ? {
              opcao: e.ot === "P" ? "PUT" : "CALL",
              strike: +e.strike || null,
              venc: e.venc || "",
              estrutura: e.estr || "",
            }
          : {}),
        tk: o ? a : "",
        mk: o,
      };
    });
}
const iaCol = (e) => (
  (e = String(e || "").toUpperCase()),
  /COMPR|ALTA|BARAT|AUMENT|NO ALVO/.test(e)
    ? "g"
    : /VEND|BAIXA|CARO|ENCERR|REDUZ|PERTO DO STOP|VENCENDO/.test(e)
      ? "r"
      : "n"
);
function anxPos(e, t) {
  const a = e.relatorio || {},
    o = anxArr(a.posicoes);
  let s = anxHead(e, t) + anxRaw(a) + anxTop(a);
  return (
    (s += o.length
      ? "<h2>Posições</h2>" +
        o
          .map((n) => {
            const r = S.trades.find((i) => i.id === n.id);
            return `<div class="card"><div class="top"><span><b>${esc(n.ativo || (r && r.ativo) || "")}</b>${r ? ` <span class="mut sm">${fdt(r.dt)}</span>` : ""}</span><span>${anxVb(n.acao_sugerida, iaCol(n.acao_sugerida))}</span></div>${n.situacao ? `<div class="sm mut" style="margin-top:4px">${esc(n.situacao)}</div>` : ""}${anxSec("Stop", n.stop)}${anxSec("Alvos", n.alvos)}${anxSec("Vencimento", n.vencimento)}${n.novo_stop ? anxSec("Novo stop sugerido", n.novo_stop) : ""}${anxSec("Justificativa", n.justificativa)}</div>`;
          })
          .join("")
      : '<p class="mut">A IA não devolveu posições.</p>'),
    s +
      (anxArr(a.alertas).length
        ? `<h2>Alertas</h2><div class="card">${anxV(a.alertas)}</div>`
        : "") +
      anxFoot(e)
  );
}
function anxBadge(e, t, a, o) {
  const s = loc().slice(0, 10);
  let n =
    e.dia === s
      ? "✅ Relatório de hoje, guardado no aparelho (reabrir não gasta cota)."
      : "📅 Relatório de " +
        (e.dia
          ? e.dia.slice(8, 10) + "/" + e.dia.slice(5, 7)
          : "data desconhecida") +
        '. Toque em "Atualizar relatório" para renovar.';
  const r =
    t === "pos"
      ? anxPosItens()
          .map((i) => i.id)
          .join(",")
      : t === "img" || o
        ? ""
        : anxItens(a)
            .map((i) => i.tk)
            .join(",");
  return (
    r &&
      e.sig &&
      e.sig !== r &&
      (n +=
        t === "pos"
          ? " Suas posições abertas mudaram desde então."
          : " A carteira mudou desde então."),
    `<div class="sm mut" style="margin-top:10px">${esc(n)}</div>`
  );
}
const anxTx = (e) =>
  Array.isArray(e)
    ? e.map(anxTx).join(" ")
    : e && typeof e == "object"
      ? Object.values(e).map(anxTx).join(" ")
      : String(e ?? "");
function anxItem(e, t, a) {
  const o = e.relatorio || {},
    s = anxArr(o.ativos),
    n =
      t === "img"
        ? "img"
        : t === "pos"
          ? "pos"
          : /:fun$/.test(t)
            ? "fun"
            : "tec",
    r =
      s.find((d) => String(d.ticker || "").toUpperCase() === a) ||
      (s.length === 1 ? s[0] : null),
    i = o.conclusao && typeof o.conclusao == "object" ? o.conclusao : {},
    l = {
      id: uid(),
      m: n,
      tk: a || String((r && r.ticker) || o.ativo_lido || "").toUpperCase(),
      g: e.gerado || new Date().toISOString(),
      mod: e.modelo || "",
      dia: e.dia || loc().slice(0, 10),
    };
  if (
    ((l.txt = anxTx(r ? r.resumo : o.sumario_executivo || o.resumo).slice(
      0,
      900,
    )),
    (l.rec = String(i.recomendacao || "").toUpperCase()),
    (l.vies = String(
      (r && (r.vies || r.valuation)) || o.vies || "",
    ).toUpperCase()),
    i.preco_alvo != null && i.preco_alvo !== "" && (l.alvo = i.preco_alvo),
    r && r.plano_de_trade && typeof r.plano_de_trade == "object")
  ) {
    const d = r.plano_de_trade;
    l.plano =
      "Entrada " +
      anxTx(d.entrada || "–") +
      " · Stop " +
      anxTx(d.stop || "–") +
      " · Alvo 1 " +
      anxTx(d.alvo_1 || "–") +
      " · Alvo 2 " +
      anxTx(d.alvo_2 || "–") +
      " · ganho/risco " +
      anxTx(d.risco_retorno || "–");
  }
  return l;
}
function anxSaveBox(e, t, a) {
  if (a === "pos")
    return '<div class="card" style="margin-top:12px"><b>💾 Guardar no diário</b><div class="sm mut">Anexa a análise de cada posição ao respectivo trade, para comparar com o resultado depois.</div><button class="btn" style="width:100%;margin-top:8px" data-an="savepos">Guardar em cada trade</button></div>';
  const o = loc().slice(0, 10),
    s = e.relatorio || {},
    n = new Set(
      [
        ...anxArr(e.ativos).map((d) => String(d.tk || "").toUpperCase()),
        String(s.ativo_lido || "").toUpperCase(),
        String(ANX.tk || "").toUpperCase(),
      ].filter(Boolean),
    ),
    r = (d) =>
      [d.ativo, d.sub].some((c) => c && n.has(String(c).trim().toUpperCase())),
    i = S.trades
      .slice()
      .sort((d, c) => r(c) - r(d) || c.dt.localeCompare(d.dt))
      .slice(0, 30),
    l = [
      ["d:" + o, "📅 Meu dia de hoje"],
      ...i.map((d) => [
        d.id,
        (r(d) ? "★ " : "") +
          (d.ativo || "sem ativo") +
          " · " +
          fdt(d.dt) +
          " · " +
          (isOpen(d)
            ? "aberto"
            : calc(d).pl == null
              ? "fechado"
              : mT(d, calc(d).pl)),
      ]),
    ];
  return `<div class="card" style="margin-top:12px"><b>💾 Guardar no diário</b><div class="sm mut">Anexa um resumo deste relatório a um trade ou ao dia, para comparar depois com o resultado.</div><label>Anexar a<select id="anx_dest">${opt(l, l[0][0])}</select></label><button class="btn" style="width:100%;margin-top:8px" data-an="save" data-v="${esc(t)}">Anexar</button></div>`;
}
function anxSave(e) {
  var t;
  const a = ANX.res[e],
    o = $("#anx_dest");
  if (!a || !o) return;
  const s = o.value;
  let n, r, i;
  if (s.slice(0, 2) === "d:") {
    const d = s.slice(2);
    ((n = (t = S.days)[d] ?? (t[d] = { chk: {} })),
      (r = (ANX.tkA || "").trim().toUpperCase()),
      (i = "ao dia " + d.slice(8, 10) + "/" + d.slice(5, 7)));
  } else {
    if (((n = S.trades.find((d) => d.id === s)), !n)) return;
    ((r = String(n.sub || n.ativo || "")
      .trim()
      .toUpperCase()),
      (i = "ao trade " + (n.ativo || "")));
  }
  const l = anxItem(a, e, r);
  if ((n.ia || []).some((d) => d.g === l.g && d.m === l.m && d.tk === l.tk)) {
    ((ANX.ok = "Este relatório já está guardado " + i + "."), render());
    return;
  }
  ((n.ia = [...(n.ia || []), l]),
    (n.u = Date.now()),
    save(),
    (ANX.ok =
      "✓ Relatório guardado " +
      i +
      '. Ele aparece em "Relatórios de IA guardados".'),
    render());
}
function anxSavePos() {
  const e = ANX.res.pos;
  if (!e) return;
  const t = anxArr((e.relatorio || {}).posicoes);
  let a = 0;
  (t.forEach((o) => {
    const s = S.trades.find((i) => i.id === o.id);
    if (!s) return;
    const n = anxTx(o.novo_stop),
      r = e.gerado || new Date().toISOString();
    (s.ia || []).some((i) => i.g === r && i.m === "pos") ||
      ((s.ia = [
        ...(s.ia || []),
        {
          id: uid(),
          m: "pos",
          tk: String(o.ativo || s.ativo || "").toUpperCase(),
          g: r,
          mod: e.modelo || "",
          dia: e.dia || loc().slice(0, 10),
          rec: String(o.acao_sugerida || "").toUpperCase(),
          vies: String(o.situacao || "").toUpperCase(),
          txt: [
            o.stop && "Stop: " + anxTx(o.stop),
            o.alvos && "Alvos: " + anxTx(o.alvos),
            o.vencimento && "Vencimento: " + anxTx(o.vencimento),
            o.justificativa && anxTx(o.justificativa),
          ]
            .filter(Boolean)
            .join(" · ")
            .slice(0, 900),
          plano: n && !/sem dado/i.test(n) ? "Novo stop sugerido: " + n : "",
        },
      ]),
      (s.u = Date.now()),
      a++);
  }),
    a && save(),
    (ANX.ok = a
      ? "✓ Análise guardada em " + a + " trade(s)."
      : "Nada novo para guardar (já guardado ou posição não encontrada)."),
    render());
}
function iaBlock(e, t, a) {
  if (!Array.isArray(e) || !e.length) return "";
  const o = {
    tec: "Técnica",
    fun: "Fundamentalista",
    img: "Foto do gráfico",
    pos: "Revisão de posição",
  };
  return (
    `<h3>🤖 Relatórios de IA guardados</h3>${t && t.pl != null ? `<div class="sm mut">${a === "d" ? "Resultado do dia" : "Resultado do trade"}: <b class="${cls(t.pl)}">${money(t.pl)}</b>${pctConta(t.pl) ? " · " + pctConta(t.pl) : ""}</div>` : `<div class="sm mut">${a === "d" ? "Sem trades encerrados neste dia ainda." : "Trade ainda aberto: compare com o relatório quando encerrar."}</div>`}` +
    e
      .map(
        (s, n) =>
          `<details class="card"><summary class="sm"><b>${esc(o[s.m] || "IA")}</b> · ${esc(s.tk || "")} · ${esc(new Date(s.g).toLocaleDateString("pt-BR"))} ${s.rec ? anxVb(s.rec, iaCol(s.rec)) : s.vies ? anxVb(s.vies, iaCol(s.vies)) : ""}</summary>${s.txt ? `<div class="sm" style="margin-top:6px">${esc(s.txt)}</div>` : ""}${s.plano ? `<div class="sm mut" style="margin-top:4px">${esc(s.plano)}</div>` : ""}${s.alvo != null ? `<div class="sm mut">Preço-alvo da IA: ${esc(s.alvo)}</div>` : ""}<button class="btn s" style="margin-top:8px" data-a="iadel" data-id="${n}" data-w="${a}">Remover</button></details>`,
      )
      .join("")
  );
}
function anxDel(e, t) {
  const a = +e;
  if (t === "t") {
    if (!T) return;
    const o = (T.ia || []).filter((n, r) => r !== a);
    T.ia = o;
    const s = S.trades.find((n) => n.id === T.id);
    (s && ((s.ia = o.slice()), (s.u = Date.now()), save()), showSheet());
  } else {
    const o = S.days[D];
    if (!o) return;
    ((o.ia = (o.ia || []).filter((s, n) => n !== a)),
      (o.u = Date.now()),
      save(),
      render());
  }
}
((async () => {
  (applyTheme(), await open());
  try {
    navigator.storage &&
      navigator.storage.persist &&
      navigator.storage.persist();
  } catch {}
  const e = await idb("kv", "get", "s");
  (e && (S = Object.assign(S, e)),
    fixS(),
    S.seed || (seedRules(), (S.seed = 1), persist()),
    !S.mt &&
      (S.trades.length || Object.keys(S.days).length || S.prop) &&
      (S.mt = Date.now()),
    (SESS = ls.get("diario-sess")),
    !window.DIARIO_DEMO && window.CLOUD_OK && cfg() && (await hashAuth()),
    render(),
    SESS && sync());
})(),
  !window.DIARIO_DEMO &&
    "serviceWorker" in navigator &&
    navigator.serviceWorker.register("sw.js").catch(() => {}),
  (function () {
    const e = matchMedia("(prefers-reduced-motion: reduce)").matches,
      t = ["home", "mercado", "trades", "swing", "opc", "dia", "stats"],
      a = TraderStyles.slot("legacy-007");
    ((a.textContent = TraderStyles.css("legacy-007")), TraderStyles.mount(a));
    const o = (b, y, j) => {
        const k = document.createElement(b);
        return (
          (k.id = y),
          j && (k.innerHTML = j),
          document.body.appendChild(k),
          k
        );
      },
      s = o("div", "ptr", "<span>↓</span>"),
      /* Sem botão flutuante (CLAUDE.md): o "voltar ao topo" é tocar no cabeçalho. O botão fica fora da página. */
      n = document.createElement("button"),
      r = o("div", "tst");
    (n.setAttribute("aria-label", "Voltar ao topo"),
      r.setAttribute("role", "status"),
      document.addEventListener("click", (b) => {
        const y = b.target.closest?.("#dt393-global-head");
        !y ||
          b.target.closest("button,a,input,select,textarea,label,[role=button],[data-dt393-route],[data-dt393-action]") ||
          scrollY <= 0 ||
          scrollTo({ top: 0, behavior: e ? "auto" : "smooth" });
      }));
    let i;
    window.toast = function (b, y) {
      ((r.textContent = b),
        r.classList.add("on"),
        clearTimeout(i),
        (i = setTimeout(() => r.classList.remove("on"), y || 2200)));
    };
    const l = (b) => {
        try {
          navigator.vibrate && navigator.vibrate(b || 8);
        } catch {}
      },
      d = (b) => t.indexOf(b);
    let c = tab;
    const p = render0;
    render0 = function () {
      if ((p(), tab === c)) return;
      const b = d(c),
        y = d(tab);
      if (((c = tab), e)) return;
      const j = document.getElementById("app");
      if (!j || !j.animate) return;
      const k = b >= 0 && y >= 0 ? (y > b ? 1 : -1) : 0;
      j.animate(
        [
          {
            opacity: 0,
            transform: k ? "translateX(" + k * 28 + "px)" : "translateY(10px)",
          },
          { opacity: 1, transform: "none" },
        ],
        { duration: 200, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    };
    const u = (b) => {
      if (
        !b ||
        !b.closest ||
        b.closest(
          "input,textarea,select,canvas,iframe,video,#lb,#mdr,#zz,.pv,.tradingview-widget-container,[data-noswipe]",
        ) ||
        T ||
        document.body.style.overflow === "hidden"
      )
        return !0;
      for (let y = b; y && y !== document.body; y = y.parentElement) {
        const j = getComputedStyle(y).overflowX;
        if (
          (j === "auto" || j === "scroll") &&
          y.scrollWidth > y.clientWidth + 4
        )
          return !0;
      }
      return !1;
    };
    let m = null;
    (document.addEventListener(
      "touchstart",
      (b) => {
        if (b.touches.length !== 1) {
          m = null;
          return;
        }
        const y = b.touches[0];
        m = {
          x: y.clientX,
          y: y.clientY,
          t0: Date.now(),
          edge: y.clientX < 16,
          top: scrollY <= 0,
          ok: !u(b.target),
          mode: null,
          dx: 0,
          dy: 0,
        };
      },
      { passive: !0 },
    ),
      document.addEventListener(
        "touchmove",
        (b) => {
          if (!m) return;
          const y = b.touches[0];
          if (((m.dx = y.clientX - m.x), (m.dy = y.clientY - m.y), !m.mode)) {
            if (Math.abs(m.dx) < 10 && Math.abs(m.dy) < 10) return;
            m.mode =
              Math.abs(m.dx) > Math.abs(m.dy) * 1.4
                ? "h"
                : m.dy > 0 &&
                    m.top &&
                    m.ok &&
                    scrollY <= 0 &&
                    !["mercado", "term"].includes(
                      document.getElementById("app")?.dataset.tela,
                    )
                  ? "p"
                  : "v";
          }
          if (m.mode === "p") {
            const j = Math.min(m.dy, 120) * 0.6;
            ((s.style.opacity = Math.min(1, j / 40)),
              (s.style.transform = "translateY(" + (j - 40) + "px)"),
              (s.firstChild.style.transform = "rotate(" + j * 5 + "deg)"),
              s.classList.toggle("go", j >= 45));
          }
        },
        { passive: !0 },
      ),
      document.addEventListener(
        "touchend",
        () => {
          if (!m) return;
          const b = m,
            y = Date.now() - b.t0;
          m = null;
          const j = y < 600;
          if (b.mode === "p") {
            if (Math.min(b.dy, 120) * 0.6 >= 45) {
              (l(12),
                s.classList.add("spin"),
                (s.style.transform = "translateY(8px)"),
                (s.firstChild.style.transform = ""));
              const k = () => {
                (s.classList.remove("spin", "go"),
                  (s.style.opacity = 0),
                  (s.style.transform = "translateY(-60px)"));
              };
              typeof SESS < "u" && SESS
                ? Promise.resolve(sync(!0)).finally(() => setTimeout(k, 300))
                : (render(), setTimeout(k, 500));
            } else
              ((s.style.opacity = 0),
                (s.style.transform = "translateY(-60px)"),
                s.classList.remove("go"));
            return;
          }
        },
        { passive: !0 },
      ));
    let f = null;
    (document.addEventListener(
      "touchstart",
      (b) => {
        const y = b.target.closest && b.target.closest("#mdr .mpn");
        f =
          y && b.touches.length === 1
            ? {
                x: b.touches[0].clientX,
                y: b.touches[0].clientY,
                p: y,
                dx: 0,
                on: 0,
              }
            : null;
      },
      { passive: !0 },
    ),
      document.addEventListener(
        "touchmove",
        (b) => {
          if (!f) return;
          const y = b.touches[0],
            j = y.clientX - f.x,
            k = y.clientY - f.y;
          if (!f.on)
            if (Math.abs(j) > 12 && Math.abs(j) > Math.abs(k) * 1.5 && j < 0)
              f.on = 1;
            else return;
          ((f.dx = Math.min(0, j)),
            (f.p.style.animation = "none"),
            (f.p.style.transform = "translateX(" + f.dx + "px)"));
          const A = f.p.previousElementSibling;
          A && (A.style.opacity = Math.max(0, 1 + f.dx / 300));
        },
        { passive: !0 },
      ),
      document.addEventListener(
        "touchend",
        () => {
          if (!f) return;
          const b = f;
          if (((f = null), !!b.on))
            if (b.dx < -90) {
              l();
              const y = document.querySelector('#mdr [data-m="x"]');
              y && y.click();
            } else {
              ((b.p.style.transition = "transform .15s ease"),
                (b.p.style.transform = ""));
              const y = b.p.previousElementSibling;
              (y && (y.style.opacity = ""),
                setTimeout(() => {
                  b.p.style.transition = "";
                }, 180));
            }
        },
        { passive: !0 },
      ),
      document.addEventListener(
        "click",
        (b) => {
          b.target.closest(
            ".btn,.chip,.seg button,.mit,[data-seg],[data-dseg],#fab",
          ) && l(6);
        },
        !0,
      ));
    let x = 0;
    (addEventListener(
      "scroll",
      () => {
        x ||
          ((x = 1),
          requestAnimationFrame(() => {
            ((x = 0),
              n.classList.toggle(
                "on",
                scrollY > 700 && !document.getElementById("mdr"),
              ));
          }));
      },
      { passive: !0 },
    ),
      n.addEventListener("click", () => {
        (l(), scrollTo({ top: 0, behavior: e ? "auto" : "smooth" }));
      }));
    let v = 0,
      g = !1;
    const h = () => {
      (clearTimeout(v),
        (v = setTimeout(() => {
          !navigator.onLine &&
            document.visibilityState === "visible" &&
            ((g = !0),
            toast(
              "Sem conexão — o diário continua salvando neste aparelho",
              3200,
            ));
        }, 6e3)));
    };
    (addEventListener("offline", h),
      document.addEventListener("visibilitychange", () => {
        (clearTimeout(v),
          document.visibilityState === "visible" && !navigator.onLine && h());
      }),
      addEventListener("online", () => {
        (clearTimeout(v),
          g && toast("Conexão de volta"),
          (g = !1),
          typeof SESS < "u" && SESS && sync());
      }));
  })());
const MKT = {
    tab: ls.get("diario-mkt-tab") || "ag",
    ct: ls.get("diario-mkt-ct") || "br,us",
    im: ls.get("diario-mkt-im") || "0,1",
    nf: "all",
    items: null,
    ts: 0,
    busy: 0,
    err: "",
    tm: null,
  },
  MK_CT = [
    ["br,us", "Brasil + EUA"],
    ["br", "Brasil"],
    ["us", "EUA"],
    ["br,us,eu,cn,gb,jp,de", "Mundo"],
  ],
  MK_IM = [
    ["-1,0,1", "Todos"],
    ["0,1", "Médio e alto"],
    ["1", "Só alto"],
  ],
  MK_NF = [
    ["all", "Todas"],
    ["urgente", "Urgente"],
    ["ibovespa", "Ibovespa"],
    ["dolar", "Dólar"],
    ["juros", "Juros"],
  ],
  mkBtn = (e, t, a, o) =>
    `<button class="btn${o ? "" : " s"}" data-mk="${e}" data-v="${esc(t)}">${esc(a)}</button>`,
  mkRow = (e) =>
    `<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">${e}</div>`,
  mkDark = () => {
    const e = document.documentElement.getAttribute("data-theme");
    return e
      ? e === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
  },
  mkNorm = (e) =>
    String(e || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
  mkAgo = (e) => {
    const t = Math.max(0, Math.round((Date.now() - new Date(e)) / 6e4));
    if (t < 1) return "agora";
    if (t < 60) return "há " + t + " min";
    const a = Math.floor(t / 60);
    return a < 24
      ? "há " + a + " h"
      : new Date(e).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
  },
  mkDia = (e) =>
    new Date(e).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
function vMercado() {
  const e = MKT.tab,
    t =
      '<div class="seg mk-seg" style="margin:10px 0">' +
      mkBtn("tab", "ag", "Agenda", e === "ag") +
      mkBtn("tab", "nt", "Notícias", e === "nt") +
      mkBtn("tab", "cot", "Cotações", e === "cot") +
      mkBtn("tab", "al", "Alertas", e === "al") +
      "</div>";
  return e === "cot"
    ? vCot(t)
    : e === "al"
      ? vAlertas(t)
      : e === "ag"
        ? `<div class="card"><div class="top"><b>Agenda econômica</b></div>${t}<div class="sm mut">País</div>${mkRow(MK_CT.map(([a, o]) => mkBtn("ct", a, o, MKT.ct === a)).join(""))}<div class="sm mut">Importância</div>${mkRow(MK_IM.map(([a, o]) => mkBtn("im", a, o, MKT.im === a)).join(""))}<div id="mkcal" style="min-height:560px"></div><div class="sm mut" style="margin-top:6px">Horários no fuso do seu aparelho. Dados do TradingView.</div></div>`
        : `<div class="card"><div class="top"><b>Notícias do dia</b><button class="btn s" data-mk="rf" aria-label="Atualizar notícias">↻ Atualizar</button></div>${t}${mkRow(MK_NF.map(([a, o]) => mkBtn("nf", a, o, MKT.nf === a)).join(""))}<div id="mknews"></div><div class="sm mut" style="margin-top:8px">Fonte: Money Times. Toque na manchete para ler a matéria no site.</div></div>`;
}
function mkCal() {
  const e = document.getElementById("mkcal");
  if (!e) return;
  e.innerHTML =
    '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
  const t = document.createElement("script");
  ((t.src =
    "https://s3.tradingview.com/external-embedding/embed-widget-events.js"),
    (t.async = !0),
    (t.innerHTML = JSON.stringify({
      colorTheme: mkDark() ? "dark" : "light",
      isTransparent: !0,
      locale: "br",
      countryFilter: MKT.ct,
      importanceFilter: MKT.im,
      width: "100%",
      height: 560,
    })),
    e.firstChild.appendChild(t));
}
function mkPaint() {
  const e = document.getElementById("mknews");
  if (!e) return;
  if (MKT.busy && !MKT.items) {
    e.innerHTML =
      '<div class="mut sm" style="padding:12px 0">Buscando notícias…</div>';
    return;
  }
  if (!MKT.items) {
    e.innerHTML = `<div class="warn">${esc(MKT.err || "Sem notícias por enquanto.")}</div>`;
    return;
  }
  const t = mkDia(new Date().toISOString());
  let a = MKT.items.slice();
  if (MKT.nf !== "all") {
    const n = MKT.nf;
    a = a.filter((r) =>
      (r.c || []).some((i) => {
        const l = mkNorm(i);
        return n === "juros"
          ? l.includes("juros") || l.includes("selic")
          : l.includes(n);
      }),
    );
  }
  const o = a.filter((n) => mkDia(n.d) === t);
  let s = "";
  if (
    (o.length >= 5
      ? (a = o)
      : ((a = a.slice(0, 15)),
        (s =
          '<div class="sm mut" style="margin-bottom:6px">Poucas notícias hoje, mostrando as mais recentes.</div>')),
    (a = a.slice(0, 25)),
    !a.length)
  ) {
    e.innerHTML =
      '<div class="mut sm" style="padding:12px 0">Nenhuma notícia neste filtro.</div>';
    return;
  }
  e.innerHTML =
    (MKT.err
      ? `<div class="warn" style="margin-bottom:8px">${esc(MKT.err)} Mostrando a última cópia.</div>`
      : "") +
    s +
    a
      .map((n) => {
        const r = (n.c || []).some((i) => mkNorm(i) === "urgente");
        return `<a class="card" href="${esc(urlSegura(n.l))}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;color:var(--tx);margin:6px 0"><div style="font-weight:600;line-height:1.35">${r ? '<span style="color:var(--r);font-size:12px;margin-right:6px">URGENTE</span>' : ""}${esc(n.t)}</div><div class="sm mut" style="margin-top:4px">${esc(mkAgo(n.d))}${n.a ? " · " + esc(n.a) : ""}</div></a>`;
      })
      .join("");
}
async function mkLoad(e) {
  if (MKT.busy || (!e && MKT.items && Date.now() - MKT.ts < 3e5)) return;
  const t = cfg();
  if (!t) {
    ((MKT.err = "Configure o Supabase na aba Conta para carregar as notícias."),
      mkPaint());
    return;
  }
  if (!SESS) {
    ((MKT.err = "Entre na sua conta para consultar as notícias."), mkPaint());
    return;
  }
  try {
    await tok();
  } catch (a) {
    ((MKT.err = a.message || "Sessão expirada"), mkPaint());
    return;
  }
  ((MKT.busy = 1), (MKT.err = ""), mkPaint());
  try {
    let a;
    try {
      a = await fetch(t.url + "/functions/v1/noticias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: t.key,
          Authorization: "Bearer " + SESS.at,
        },
        body: "{}",
      });
    } catch {
      throw new Error(
        'Sem conexão com a função "noticias". Confira se ela foi publicada e se há internet.',
      );
    }
    if (!a.ok) {
      let s = "";
      try {
        s = (await a.json()).error || "";
      } catch {}
      throw new Error(
        a.status === 401
          ? "A função exige login: publique com --no-verify-jwt."
          : a.status === 404
            ? 'Função "noticias" não encontrada: publique-a no Supabase.'
            : s || "Erro " + a.status,
      );
    }
    const o = await a.json();
    if (!Array.isArray(o.itens))
      throw new Error("Resposta inesperada da função.");
    ((MKT.items = o.itens), (MKT.ts = Date.now()));
  } catch (a) {
    MKT.err = a.message || String(a);
  }
  ((MKT.busy = 0), tab === "mercado" && MKT.tab === "nt" && mkPaint());
}
function mkAfter() {
  if ((MKT.tm && (clearInterval(MKT.tm), (MKT.tm = null)), MKT.tab === "cot")) {
    cotAfter();
    return;
  }
  if (MKT.tab === "al") {
    alAfter();
    return;
  }
  if (MKT.tab === "ag") {
    mkCal();
    return;
  }
  (mkPaint(),
    mkLoad(!1),
    (MKT.tm = setInterval(() => {
      tab === "mercado" && MKT.tab === "nt" && !document.hidden
        ? mkLoad(!0)
        : tab !== "mercado" && (clearInterval(MKT.tm), (MKT.tm = null));
    }, 3e5)));
}
(function () {
  const e = render0;
  ((render0 = function () {
    (e(), tab === "mercado" && mkAfter());
  }),
    document.addEventListener("click", (t) => {
      const a = t.target.closest("[data-mk]");
      if (!a) return;
      const o = a.dataset.mk,
        s = a.dataset.v;
      o === "tab"
        ? ((MKT.tab = s), ls.set("diario-mkt-tab", s), render())
        : o === "ct"
          ? ((MKT.ct = s), ls.set("diario-mkt-ct", s), render())
          : o === "im"
            ? ((MKT.im = s), ls.set("diario-mkt-im", s), render())
            : o === "nf"
              ? ((MKT.nf = s), render())
              : o === "rf" && mkLoad(!0);
    }));
})();
const ROT0 = {
    m: [
      "Olhei a agenda econômica e as notícias do dia",
      "Marquei meus níveis e cenários dos ativos",
      "Li minhas regras e o erro que não quero repetir hoje",
      "Conferi capital e limites da mesa ou corretora",
    ],
    n: [
      "Vi a agenda e as notícias dos EUA para esta noite",
      "Conferi posições abertas e stops antes da sessão",
      "Revisei o plano e o limite de risco da sessão",
      "Chequei meu estado emocional (sem revanche)",
    ],
  },
  rotS = () =>
    S.rot && Array.isArray(S.rot.m) && Array.isArray(S.rot.n)
      ? S.rot
      : (S.rot = {
          m: ROT0.m.map((e, t) => ({ id: "m" + (t + 1), t: e })),
          n: ROT0.n.map((e, t) => ({ id: "n" + (t + 1), t: e })),
        }),
  rotDone = (e, t) =>
    rotS()[t].filter((a) => e && e.rt && e.rt[t] && e.rt[t][a.id]).length;
let DT_IDX = null;
const dtIdx = () => {
    if (DT_IDX && DT_IDX.n === S.trades.length && DT_IDX.a === S.trades)
      return DT_IDX.m;
    const e = {};
    return (
      S.trades.forEach((t) => {
        const a = String(t.dt || "").slice(0, 10);
        (e[a] || (e[a] = [])).push(t);
      }),
      (DT_IDX = { m: e, n: S.trades.length, a: S.trades }),
      queueMicrotask(() => {
        DT_IDX = null;
      }),
      e
    );
  },
  dayTr = (e) =>
    (dtIdx()[e] || [])
      .map((t) => ({ ...t, c: calc(t) }))
      .concat(typeof fxDia == "function" ? fxDia(e) : []),
  dayR = (e) => sum(e.filter((t) => t.c.r != null).map((t) => t.c.r)),
  isWk = (e) => {
    const t = new Date(e + "T12:00").getDay();
    return t === 0 || t === 6;
  },
  addD = (e, t) => {
    const a = new Date(e + "T12:00");
    return (a.setDate(a.getDate() + t), isoD(a));
  };
function dscore(e) {
  const t = S.days[e] || {},
    a = dayTr(e);
  if (
    !a.length &&
    !t.rt &&
    !(t.chk && Object.keys(t.chk).length) &&
    !(typeof dHas == "function" && dHas(t))
  )
    return null;
  const o = [],
    s = rotS().m.length;
  (s && o.push([rotDone(t, "m") / s, 30]),
    S.rules.length && o.push([chkN(t.chk) / S.rules.length, 20]),
    a.length &&
      o.push([
        a.filter((l) => !(l.err && l.err !== "Nenhum") && l.rules !== "n")
          .length / a.length,
        35,
      ]));
  const n = limPerda(t),
    r = +t.maxT;
  (n > 0 || r > 0) &&
    o.push([
      (r > 0 && a.length > r) || (n > 0 && dayPL(dayFech(e)) <= -n) ? 0 : 1,
      15,
    ]);
  const i = sum(o.map((l) => l[1]));
  return i ? Math.round((sum(o.map((l) => l[0] * l[1])) / i) * 100) : null;
}
function streak() {
  const e = loc().slice(0, 10),
    t = rotS().m.length;
  if (!t) return 0;
  let a = 0,
    o = e;
  for (let s = 0; s < 150; s++, o = addD(o, -1))
    if (!isWk(o)) {
      if (rotDone(S.days[o], "m") === t) a++;
      else if (o !== e) break;
    }
  return a;
}
const scCol = (e) =>
  e == null
    ? "var(--bd)"
    : e >= 80
      ? "var(--g)"
      : e >= 50
        ? "#a57d34"
        : "var(--r)";
function disHtml() {
  const e = dscore(D),
    t = streak(),
    a = loc().slice(0, 10),
    o = [];
  for (let s = 13; s >= 0; s--) {
    const n = addD(a, -s),
      r = dscore(n);
    o.push(
      `<button data-a="cday" data-id="${n}" aria-label="${n}" title="${n}${r != null ? ": " + r + "%" : ""}" style="width:100%;aspect-ratio:1;border-radius:8px;border:${n === D ? "2px solid var(--tx)" : "1px solid var(--bd)"};background:${r == null ? "transparent" : scCol(r)};opacity:${isWk(n) && r == null ? 0.35 : 1};color:${r == null ? "var(--mut)" : "#fff"};font-size:11px;padding:0">${+n.slice(8)}</button>`,
    );
  }
  return `<div class="top"><b>Disciplina</b><span class="sm mut">${t ? "🔥 " + t + (t > 1 ? " dias" : " dia") + " com a rotina da manhã completa" : "Complete a rotina da manhã para iniciar uma sequência"}</span></div>
<div style="display:flex;align-items:center;gap:10px;margin:10px 0 8px"><b style="font-size:28px;color:${scCol(e)}">${e == null ? "–" : e + "%"}</b><div class="sm mut" style="line-height:1.35">${e == null ? "A nota do dia aparece conforme você marca rotinas e registra trades." : "Pontuação de disciplina: rotinas, regras, trades dentro das regras e limites respeitados."}</div></div>
<div style="display:grid;grid-template-columns:repeat(14,1fr);gap:3px">${o.join("")}</div><div class="sm mut" style="margin-top:4px">Últimos 14 dias. Toque para abrir o dia.</div>`;
}
function limHtml() {
  const e = S.days[D] || {},
    t = dayTr(D),
    a = dayPL(dayFech(D)),
    o = limPerda(e),
    s = +e.maxT,
    n = [],
    r = (l, d, c) => {
      const p = l > 1 ? "var(--r)" : l > 0.6 ? "#a57d34" : "var(--g)";
      return `<div style="margin:8px 0"><div class="sm" style="display:flex;justify-content:space-between"><span>${d}</span><b style="color:${p}">${c}</b></div><div style="height:6px;border-radius:3px;background:var(--bd);overflow:hidden;margin-top:3px"><div style="height:100%;width:${Math.min(100, l * 100)}%;background:${p};transition:width .3s"></div></div></div>`;
    };
  (s > 0 && n.push(r(t.length / s, "Trades do dia", t.length + " de " + s)),
    o > 0 &&
      n.push(
        r(
          Math.max(0, -a) / o,
          "Perda do dia",
          money(Math.min(0, a)) + " de -" + money(o),
        ),
      ));
  const i = (s > 0 && t.length >= s) || (o > 0 && a <= -o);
  return n.length
    ? n.join("") +
        (i
          ? '<div class="warn" style="margin-top:8px">🛑 Limite do dia atingido. Pelo seu plano, é hora de parar de operar.</div>'
          : "")
    : '<div class="sm mut" style="margin-top:6px">Defina seus limites para acompanhar em tempo real e receber o alerta de parar.</div>';
}
function tlHtml() {
  const e = dayTr(D).sort((t, a) => t.dt.localeCompare(a.dt));
  return e.length
    ? `<details class="card" style="margin-top:8px"><summary class="sm"><b>Trades do dia (${e.length})</b></summary>${e.map((t) => `<div class="sm" style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--bd)"><span>${t.lanc ? "" : esc(t.dt.slice(11, 16)) + " · "}${esc(t.ativo || "")} ${t.forex ? "· Forex" : t.side === "C" ? "C" : "V"}${t.err && t.err !== "Nenhum" ? " ⚠️" : ""}</span><b class="${cls(t.c.pl)}">${t.c.pl == null ? "aberto" : mT(t, t.c.pl)}</b></div>`).join("")}</details>`
    : "";
}
function ntHtml() {
  const e = ((S.days[D] || {}).nt || [])
    .map((t, a) => ({ ...t, i: a }))
    .reverse();
  return (
    '<div style="display:flex;gap:6px"><input id="qn" placeholder="O que está sentindo ou vendo agora?" style="margin:0;flex:1"><button class="btn" data-dn="add">Anotar</button></div>' +
    (e.length
      ? e
          .map(
            (t) =>
              `<div class="sm" style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--bd)"><span class="mut" style="flex:none">${esc(t.h)}</span><span style="flex:1;overflow-wrap:anywhere">${esc(t.x)}</span><button class="x" data-dn="del" data-i="${t.i}" aria-label="Apagar nota">✕</button></div>`,
          )
          .join("")
      : '<div class="sm mut" style="margin-top:6px">Anote rápido durante o pregão. Depois use no debriefing.</div>')
  );
}
function rotCard(e, t, a) {
  const o = S.days[D] || {},
    s = rotS()[e],
    n = rotDone(o, e),
    r = s.length ? n / s.length : 0;
  return `<div class="card" id="rot-${e}"><div class="top"><b>${t}</b><span class="sm ${r === 1 ? "g" : "mut"}" data-rc="${e}">${n}/${s.length}</span></div><div class="sm mut" style="margin:2px 0 6px">${a}</div>${s.map((i) => `<label class="ck"><input type="checkbox" data-rt="${e}:${i.id}"${o.rt && o.rt[e] && o.rt[e][i.id] ? " checked" : ""}><span>${esc(i.t)}</span></label>`).join("") || '<span class="mut sm">Sem itens. Adicione abaixo.</span>'}<div style="height:4px;border-radius:2px;background:var(--bd);margin-top:8px;overflow:hidden"><div data-rb="${e}" style="height:100%;width:${r * 100}%;background:var(--g);transition:width .25s"></div></div></div>`;
}
let ROTO = 0;
function rotEdit() {
  const e = (t, a) =>
    `<div class="sm" style="margin:10px 0 4px"><b>${a}</b></div>${rotS()
      [t].map(
        (o) =>
          `<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin:4px 0"><input data-rot="${t}:${o.id}" value="${esc(o.t)}" style="margin:0"><button class="x" data-rtx="del" data-k="${t}" data-id="${o.id}" aria-label="Remover item">✕</button></div>`,
      )
      .join(
        "",
      )}<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin:6px 0"><input id="rtn-${t}" placeholder="Novo item" style="margin:0"><button class="btn s" data-rtx="add" data-k="${t}">Adicionar</button></div>`;
  return `<details class="card" id="rtd"${ROTO ? " open" : ""}><summary class="sm"><b>✏️ Editar itens das rotinas</b></summary>${e("m", "Rotina da manhã")}${e("n", "Abertura americana")}</details>`;
}
function lastLesson() {
  for (let e = 1; e <= 10; e++) {
    const t = addD(D, -e),
      a = S.days[t];
    if (a && (a.prevn || a.aprend)) {
      const o = new Date(t + "T12:00").toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      return `<div class="card" style="margin-top:8px"><div class="sm mut">💡 Do seu debriefing de ${esc(o)}</div>${a.prevn ? `<div style="margin-top:4px"><b>Para não repetir:</b> ${esc(a.prevn)}</div>` : ""}${a.aprend ? `<div style="margin-top:4px"><b>Aprendizado:</b> ${esc(a.aprend)}</div>` : ""}</div>`;
    }
  }
  return "";
}
const vDia0 = vDia;
((vDia = function () {
  const e = vDia0();
  if (DV === "hist") return e;
  const t = D === loc().slice(0, 10),
    a = S.days[D] || {},
    o = `${t && new Date().getHours() >= 8 && rotS().m.length && rotDone(a, "m") < rotS().m.length ? '<div class="warn" style="margin-bottom:8px">☀️ A rotina da manhã ainda está pendente.</div>' : ""}<div class="card" id="dis">${disHtml()}</div>
<div class="card" style="margin-top:8px"><b>🛑 Limites do dia</b><div class="g2" style="margin-top:6px"><label>Perda máxima (R$)<input type="number" inputmode="decimal" step="10" min="0" data-d="maxP" value="${esc(a.maxP || (limPerda(a) ? Math.round(limPerda(a)) : ""))}" placeholder="ex.: 300"></label><label>Máx. de trades<input type="number" inputmode="numeric" step="1" min="0" data-d="maxT" value="${esc(a.maxT || "")}" placeholder="ex.: 5"></label></div><div id="limr">${limHtml()}</div></div>${tlHtml()}${lastLesson()}
<div class="card" style="margin-top:8px"><b>📝 Notas rápidas do pregão</b><div id="ntx" style="margin-top:6px">${ntHtml()}</div></div>`,
    s =
      rotCard("n", "🌐 Abertura americana", "Faça antes da sessão noturna.") +
      rotEdit(),
    n = `<label>Como estou ao fim do dia?</label><div class="chips2">${EMO.map((l, d) => `<button class="${a.energia2 == d + 1 ? "on" : ""}" data-dseg="energia2" data-v="${d + 1}">${l}</button>`).join("")}</div>`;
  let r = e;
  const i = (l, d) => {
    r.includes(l) && (r = r.replace(l, () => d));
  };
  return (
    i(
      "<h2>☀️ Antes do mercado</h2>",
      o +
        "<h2>☀️ Antes do mercado</h2>" +
        rotCard("m", "Rotina da manhã", "Faça antes de abrir o mercado."),
    ),
    i(
      "<h2>🌙 Depois do mercado (debriefing)</h2>",
      s + "<h2>🌙 Depois do mercado (debriefing)</h2>",
    ),
    i(
      "<label>Aprendizado principal<textarea",
      n + "<label>Aprendizado principal<textarea",
    ),
    r
  );
}),
  (function () {
    const e = (t) => {
      const a = S.days[D] || {},
        o = rotS()[t],
        s = rotDone(a, t);
      (document.querySelectorAll('[data-rc="' + t + '"]').forEach((r) => {
        ((r.textContent = s + "/" + o.length),
          (r.className = "sm " + (s === o.length && o.length ? "g" : "mut")));
      }),
        document.querySelectorAll('[data-rb="' + t + '"]').forEach((r) => {
          r.style.width = (o.length ? (s / o.length) * 100 : 0) + "%";
        }));
      const n = document.getElementById("dis");
      (n && (n.innerHTML = disHtml()),
        o.length &&
          s === o.length &&
          window.toast &&
          toast(
            t === "m"
              ? "✅ Rotina da manhã completa"
              : "✅ Abertura americana pronta",
          ));
    };
    (document.addEventListener("change", (t) => {
      var a, o;
      const s = t.target;
      if (!s.dataset || !s.dataset.rt) return;
      const [n, r] = s.dataset.rt.split(":"),
        i = (a = S.days)[D] ?? (a[D] = { chk: {} });
      ((((o = i.rt ?? (i.rt = { m: {}, n: {} }))[n] ?? (o[n] = {}))[r] =
        s.checked),
        (i.u = Date.now()),
        save(),
        e(n));
    }),
      document.addEventListener("input", (t) => {
        const a = t.target;
        if (a.dataset) {
          if (a.dataset.rot) {
            const [o, s] = a.dataset.rot.split(":"),
              n = rotS()[o].find((r) => r.id === s);
            n && ((n.t = a.value), (S.mt = Date.now()), save());
            return;
          }
          if (
            a.dataset.d === "maxR" ||
            a.dataset.d === "maxP" ||
            a.dataset.d === "maxT"
          ) {
            const o = document.getElementById("limr");
            o && (o.innerHTML = limHtml());
            const s = document.getElementById("dis");
            s && (s.innerHTML = disHtml());
          }
        }
      }),
      document.addEventListener(
        "toggle",
        (t) => {
          t.target && t.target.id === "rtd" && (ROTO = t.target.open);
        },
        !0,
      ),
      document.addEventListener("click", (t) => {
        var a;
        const o = t.target.closest("[data-rtx]");
        if (o) {
          const n = o.dataset.k;
          if (o.dataset.rtx === "del")
            ((rotS()[n] = rotS()[n].filter((r) => r.id !== o.dataset.id)),
              (S.mt = Date.now()),
              save(),
              render());
          else {
            const r = document.getElementById("rtn-" + n),
              i = r && r.value.trim();
            i &&
              (rotS()[n].push({ id: uid(), t: i }),
              (S.mt = Date.now()),
              save(),
              (ROTO = 1),
              render());
          }
          return;
        }
        const s = t.target.closest("[data-dn]");
        if (s) {
          const n = (a = S.days)[D] ?? (a[D] = { chk: {} });
          if (s.dataset.dn === "add") {
            const i = document.getElementById("qn"),
              l = i && i.value.trim();
            if (!l) return;
            (n.nt ?? (n.nt = [])).push({
              h: new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              x: l,
            });
          } else (n.nt || []).splice(+s.dataset.i, 1);
          ((n.u = Date.now()), save());
          const r = document.getElementById("ntx");
          if ((r && (r.innerHTML = ntHtml()), s.dataset.dn === "add")) {
            const i = document.getElementById("qn");
            i && i.focus();
          }
        }
      }),
      document.addEventListener("keydown", (t) => {
        if (t.key === "Enter" && t.target && t.target.id === "qn") {
          t.preventDefault();
          const a = document.querySelector('[data-dn="add"]');
          a && a.click();
        }
      }));
  })());
const NP = Object.assign(
  { m: "08:00", n: "18:50", lead: 5, cur: ["USD"], imp: "high" },
  ls.get("diario-np") || {},
);
((NP.on = Object.assign(
  { m: !0, n: !0, ev: !0, ab: !0, tr: !0, trv: !0 },
  NP.on || {},
)),
  Array.isArray(NP.mk) || (NP.mk = ["b3", "ny", "tk"]));
const AL = {
    ok: null,
    msg: "",
    busy: 0,
    sub: null,
    ev: null,
    evTs: 0,
    evErr: "",
    sy: null,
  },
  AL_CUR = [
    ["USD", "EUA"],
    ["EUR", "Euro"],
    ["GBP", "Reino Unido"],
    ["JPY", "Japão"],
    ["CNY", "China"],
    ["CAD", "Canadá"],
    ["AUD", "Austrália"],
  ],
  alSup = () =>
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window,
  alSave = () => ls.set("diario-np", NP),
  u8 = (e) => {
    const t = (e + "=".repeat((4 - (e.length % 4)) % 4))
        .replace(/-/g, "+")
        .replace(/_/g, "/"),
      a = atob(t);
    return Uint8Array.from(a, (o) => o.charCodeAt(0));
  };
async function alFn(e, t) {
  const a = cfg();
  if (!a) throw new Error("Configure o Supabase na aba Conta.");
  if (!SESS?.at)
    throw new Error(
      "Entre na sua conta em Mais → Conta para registrar este computador.",
    );
  if ((await tok(), !SESS?.at))
    throw new Error("Sessão expirada; entre novamente.");
  let o;
  try {
    o = await fetch(a.url + "/functions/v1/notificar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: a.key,
        Authorization: "Bearer " + SESS.at,
      },
      body: JSON.stringify(Object.assign({ acao: e }, t || {})),
    });
  } catch {
    throw new Error(
      'Sem conexão com a função "notificar". Confira a internet e se ela foi publicada.',
    );
  }
  let s = {};
  try {
    s = await o.json();
  } catch {}
  if (!o.ok)
    throw new Error(
      s.error ||
        (o.status === 404
          ? 'Função "notificar" não encontrada: publique-a no Supabase.'
          : o.status === 401
            ? "A função exige login: publique com --no-verify-jwt."
            : "Erro " + o.status),
    );
  return s;
}
async function alState() {
  if (!alSup()) {
    AL.ok = "nosup";
    return;
  }
  if (Notification.permission === "denied") {
    AL.ok = "denied";
    return;
  }
  try {
    const e = await navigator.serviceWorker.ready;
    AL.sub = await e.pushManager.getSubscription();
  } catch {
    AL.sub = null;
  }
  AL.ok = AL.sub && Notification.permission === "granted" ? "on" : "off";
}
async function alEnable() {
  ((AL.busy = 1), (AL.msg = ""), alPaint());
  try {
    if (!alSup())
      throw new Error("Este navegador não suporta notificações push.");
    if ((await Notification.requestPermission()) !== "granted")
      throw new Error(
        "Permissão negada. Libere as notificações nas configurações do navegador ou do app instalado.",
      );
    const e = await navigator.serviceWorker.ready,
      t = (await alFn("chave")).chave;
    let a = await e.pushManager.getSubscription();
    (a ||
      (a = await e.pushManager.subscribe({
        userVisibleOnly: !0,
        applicationServerKey: u8(t),
      })),
      await alFn("inscrever", { sub: a.toJSON(), prefs: npComTurno() }),
      (AL.sub = a),
      (AL.ok = "on"),
      (AL.msg = "Notificações ativadas neste aparelho."));
  } catch (e) {
    AL.msg = e.message || String(e);
  }
  ((AL.busy = 0), await alState(), alPaint());
}
async function alDisable() {
  ((AL.busy = 1), (AL.msg = ""), alPaint());
  try {
    if (AL.sub) {
      try {
        await alFn("cancelar", { endpoint: AL.sub.endpoint });
      } catch {}
      await AL.sub.unsubscribe();
    }
    ((AL.sub = null), (AL.msg = "Notificações desativadas neste aparelho."));
  } catch (e) {
    AL.msg = e.message || String(e);
  }
  ((AL.busy = 0), await alState(), alPaint());
}
async function alTest() {
  ((AL.busy = 1), (AL.msg = ""), alPaint());
  try {
    if (!AL.sub)
      throw Error(
        "Este PC não está inscrito. Clique em Ativar notificações antes de testar.",
      );
    (await alFn("teste", { endpoint: AL.sub.endpoint }),
      (AL.msg =
        "Servidor aceitou o teste push. Isso ainda não confirma exibição no Windows; se não apareceu, faça o teste local e verifique permissões."));
  } catch (e) {
    AL.msg = e.message || String(e);
  }
  ((AL.busy = 0), alPaint());
}
async function alLocalTest() {
  ((AL.busy = 1), (AL.msg = "Testando exibição local do Windows…"), alPaint());
  try {
    if (!alSup()) throw Error("Este navegador não suporta notificações push.");
    if (Notification.permission !== "granted")
      throw Error(
        "Permissão atual: " +
          Notification.permission +
          ". Ative notificações primeiro.",
      );
    (await (
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((t, a) =>
          setTimeout(
            () => a(Error("Service Worker não ficou pronto em 8 segundos.")),
            8e3,
          ),
        ),
      ])
    ).showNotification("🖥️ Teste local · Diário Trader", {
      body: "Se esta notificação apareceu, o Windows permite exibição local. O push remoto ainda precisa ser testado.",
      tag: "diario-teste-local-346",
      icon: "icon-192.png",
    }),
      (AL.msg =
        "Teste local solicitado ao Windows. Se não aparecer, verifique Sistema → Notificações, o aplicativo/navegador e Não incomodar. Este teste não valida o servidor."));
  } catch (e) {
    AL.msg = "Falha no teste local: " + (e.message || String(e));
  }
  ((AL.busy = 0), alPaint());
}
async function alDiag() {
  ((AL.busy = 1),
    (AL.msg = "Verificando conexão e inscrição deste PC…"),
    alPaint());
  try {
    const e = alSup(),
      t = typeof Notification < "u" ? Notification.permission : "indisponível";
    let a = null,
      o = "indisponível";
    if (e) {
      const n = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((r, i) =>
          setTimeout(
            () => i(Error("Service Worker não ficou pronto em 8 segundos.")),
            8e3,
          ),
        ),
      ]);
      ((o = n.active?.state || "não ativo"),
        (a = await n.pushManager.getSubscription()));
    }
    const s = [
      "Permissão: " + t,
      "Service Worker: " + o,
      "Inscrição push: " + (a ? "presente" : "ausente"),
    ];
    if (!SESS?.at) s.push("Conta: é preciso entrar em Mais → Conta");
    else {
      const n = await alFn("diag");
      s.push(
        "Servidor push: " + String(n.push || "sem resposta"),
        "Banco: " + String(n.banco || "sem resposta"),
        "Chaves públicas configuradas: " +
          (n.vapidPublicTamanho > 0 ? "sim" : "não"),
      );
    }
    AL.msg =
      s.join(" · ") +
      ". Se não aparecer no Windows: Configurações → Sistema → Notificações → permitir navegador/aplicativo e desativar Não incomodar.";
  } catch (e) {
    AL.msg = "Diagnóstico: " + (e.message || String(e));
  }
  ((AL.busy = 0), await alState(), alPaint());
}
function alPush() {
  (alSave(),
    clearTimeout(AL.sy),
    !(AL.ok !== "on" || !AL.sub) &&
      (AL.sy = setTimeout(() => {
        alFn("inscrever", { sub: AL.sub.toJSON(), prefs: npComTurno() })
          .then(() => {
            ((AL.msg = "Preferências salvas."), alPaint());
          })
          .catch((e) => {
            ((AL.msg = e.message), alPaint());
          });
      }, 700)));
}
async function alLoadEv(e) {
  if (!(!e && AL.ev && Date.now() - AL.evTs < 18e5))
    try {
      const t = await alFn("eventos");
      ((AL.ev = t.itens || []), (AL.evTs = Date.now()), (AL.evErr = ""));
    } catch (t) {
      AL.evErr = t.message || String(t);
    }
}
const alWhen = (e) => {
    const t = new Date(e),
      a = t.toLocaleDateString("pt-BR", {
        weekday: "short",
        timeZone: "America/Sao_Paulo",
      }),
      o = t.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
    return a.replace(".", "") + " " + o;
  },
  alIn = (e) => {
    const t = Math.round((new Date(e) - Date.now()) / 6e4);
    if (t <= 0) return "agora";
    if (t < 60) return "em " + t + " min";
    const a = Math.floor(t / 60);
    return a < 24 ? "em " + a + " h" : "em " + Math.floor(a / 24) + " d";
  },
  alEvList = () => {
    if (!AL.ev)
      return `<div class="mut sm">${esc(AL.evErr || "Carregando eventos…")}</div>`;
    const e = AL.ev
      .filter(
        (t) =>
          NP.cur.includes(t.cur) &&
          (NP.imp === "med" || t.imp === "high") &&
          new Date(t.d) > Date.now() - 36e5,
      )
      .slice(0, 10);
    return e.length
      ? e
          .map(
            (t) =>
              `<div class="card" style="margin:6px 0"><div style="font-weight:600;line-height:1.3">${t.imp === "high" ? '<span style="color:var(--r);font-size:12px;margin-right:6px">ALTO</span>' : '<span class="mut" style="font-size:12px;margin-right:6px">MÉDIO</span>'}${esc(t.t)} <span class="mut sm">(${esc(t.cur)})</span></div><div class="sm mut" style="margin-top:3px">${esc(alWhen(t.d))} · ${esc(alIn(t.d))}${t.f ? " · prev. " + esc(t.f) : ""}${t.p ? " · ant. " + esc(t.p) : ""}</div></div>`,
          )
          .join("") +
          (AL.evErr ? `<div class="sm mut">${esc(AL.evErr)}</div>` : "")
      : '<div class="mut sm">Nenhum evento com esses filtros nos próximos dias.</div>';
  };
function alHtml() {
  const e = (o, s, n) =>
    `<button class="btn${n ? " s" : ""}" data-alb="${o}"${AL.busy ? " disabled" : ""}>${s}</button>`;
  let t;
  AL.ok == null
    ? (t = '<div class="mut sm">Verificando…</div>')
    : AL.ok === "nosup"
      ? (t =
          '<div class="warn">Este navegador não suporta notificações push. No iPhone, instale o app na Tela de Início e abra por lá (iOS 16.4 ou mais novo).</div>')
      : AL.ok === "denied"
        ? (t =
            '<div class="warn">As notificações estão bloqueadas para este app. Libere nas configurações do navegador ou do app instalado e volte aqui.</div>')
        : AL.ok === "off"
          ? (t = `<div class="sm" style="margin-bottom:8px">Receba lembretes dos checklists e um aviso antes das notícias importantes, mesmo com o app fechado.</div>${e("on", "🔔 Ativar notificações")}`)
          : (t = `<div class="sm g" style="margin-bottom:8px">✅ Ativas neste aparelho</div><div style="display:flex;gap:6px;flex-wrap:wrap">${e("test", "Enviar teste", 1)}${e("off", "Desativar", 1)}</div>`);
  const a = (o, s) =>
    `<label class="ck"><input type="checkbox" data-al="on.${o}"${NP.on[o] ? " checked" : ""}><span>${s}</span></label>`;
  return `${t}<div style="margin:10px 0">${e("diag", "🔎 Diagnosticar notificações do PC", 1)} ${e("local", "🖥️ Testar aviso local do Windows", 1)}</div>${AL.msg ? `<div class="sm" style="margin-top:8px">${esc(AL.msg)}</div>` : ""}
<h3 style="margin-top:14px">Quando avisar</h3>
${a("m", "☀️ Checklist da manhã")}<label>Horário<input type="time" data-al="m" value="${esc(NP.m)}"></label>
${a("n", "🌐 Checklist da abertura americana")}<label>Horário<input type="time" data-al="n" value="${esc(NP.n)}"></label>
${a("ev", "⏰ Notícias importantes")}
<div class="g2"><label>Avisar antes<select data-al="lead">${opt(
    [
      [3, "3 min"],
      [5, "5 min"],
      [10, "10 min"],
      [15, "15 min"],
      [30, "30 min"],
    ],
    NP.lead,
  )}</select></label><label>Impacto<select data-al="imp">${opt(
    [
      ["high", "Só alto"],
      ["med", "Médio e alto"],
    ],
    NP.imp,
  )}</select></label></div>
<div class="sm mut" style="margin-top:6px">Países</div>
<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${AL_CUR.map(([o, s]) => `<button class="btn${NP.cur.includes(o) ? "" : " s"}" data-alc="${o}">${esc(s)}</button>`).join("")}</div>
${typeof alAbHtml == "function" ? alAbHtml(a) : ""}<div class="sm mut">Checklists: segunda a sexta, horário de Brasília. O calendário vem do Forex Factory e não inclui eventos do Brasil.</div>
<h3 style="margin-top:14px">Próximos eventos</h3>${alEvList()}`;
}
function alPaint() {
  const e = document.getElementById("alx");
  e && (e.innerHTML = alHtml());
}
function vAlertas(e) {
  return `<div class="card"><div class="top"><b>Alertas</b></div>${e}<div id="alx">${alHtml()}</div></div>`;
}
async function alAfter() {
  (alPaint(),
    await alState(),
    alPaint(),
    AL.ev ? alLoadEv().then(alPaint) : (await alLoadEv(), alPaint()));
}
((function () {
  (document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-alc]");
    if (t) {
      const s = t.dataset.alc,
        n = NP.cur.indexOf(s);
      (n >= 0 ? NP.cur.length > 1 && NP.cur.splice(n, 1) : NP.cur.push(s),
        alPush(),
        alPaint());
      return;
    }
    const a = e.target.closest("[data-alb]");
    if (!a) return;
    const o = a.dataset.alb;
    o === "on"
      ? alEnable()
      : o === "off"
        ? alDisable()
        : o === "test"
          ? alTest()
          : o === "diag"
            ? alDiag()
            : o === "local" && alLocalTest();
  }),
    document.addEventListener("change", (e) => {
      const t = e.target,
        a = t.dataset && t.dataset.al;
      a &&
        (a.startsWith("on.")
          ? (NP.on[a.slice(3)] = t.checked)
          : a === "m" || a === "n"
            ? /^\d\d:\d\d$/.test(t.value) && (NP[a] = t.value)
            : a === "lead"
              ? (NP.lead = +t.value)
              : a === "imp" && (NP.imp = t.value),
        alPush(),
        alPaint());
    }));
})(),
  (function () {
    const e = "America/Sao_Paulo",
      t = ls.get("diario-nl") || {},
      a = (n) => {
        ((t[n] = Date.now()),
          Object.keys(t).forEach((r) => {
            Date.now() - t[r] > 2 * 864e5 && delete t[r];
          }),
          ls.set("diario-nl", t));
      };
    async function o(n, r, i, l) {
      try {
        await (
          await navigator.serviceWorker.ready
        ).showNotification(r, {
          body: i,
          tag: n,
          icon: "icon-192.png",
          badge: "icon-192.png",
          data: l,
        });
      } catch {}
    }
    async function s() {
      if (!alSup() || Notification.permission !== "granted") return;
      const n = new Date(),
        r = Object.fromEntries(
          new Intl.DateTimeFormat("en-CA", {
            timeZone: e,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          })
            .formatToParts(n)
            .map((p) => [p.type, p.value]),
        ),
        i = r.year + "-" + r.month + "-" + r.day,
        l = +r.hour * 60 + +r.minute,
        d = !["Sat", "Sun"].includes(r.weekday),
        c = (p) => +p.slice(0, 2) * 60 + +p.slice(3, 5);
      (d &&
        NP.on.m &&
        l - c(NP.m) >= 0 &&
        l - c(NP.m) < 3 &&
        !t["m" + i] &&
        (a("m" + i),
        o(
          "chk-m-" + i,
          "☀️ Hora do checklist da manhã",
          "Revise a agenda, defina seu risco do dia e marque a rotina antes de operar.",
          { go: "dia", r: "m" },
        )),
        d &&
          NP.on.n &&
          l - c(NP.n) >= 0 &&
          l - c(NP.n) < 3 &&
          !t["n" + i] &&
          (a("n" + i),
          o(
            "chk-n-" + i,
            "🌐 Checklist da abertura americana",
            "Faça o checklist de novo antes da sessão noturna. Confirme seu limite de risco.",
            { go: "dia", r: "n" },
          )),
        NP.on.ev &&
          ((!AL.ev || Date.now() - AL.evTs > 18e5) && (await alLoadEv()),
          (AL.ev || []).forEach((p) => {
            if (
              !NP.cur.includes(p.cur) ||
              (NP.imp === "high" && p.imp !== "high")
            )
              return;
            const u = (new Date(p.d) - n) / 6e4,
              m = "e" + p.id + NP.lead;
            u > 0 &&
              u <= NP.lead &&
              !t[m] &&
              (a(m),
              o(
                "ev-" + p.id,
                "⏰ Em " +
                  Math.max(1, Math.round(u)) +
                  " min: " +
                  p.t +
                  " (" +
                  p.cur +
                  ")",
                (p.imp === "high" ? "Alto" : "Médio") +
                  " impacto às " +
                  alWhen(p.d).split(" ").pop() +
                  (p.f ? " · Previsão " + p.f : "") +
                  (p.p ? " · Anterior " + p.p : ""),
                { go: "mercado" },
              ));
          })));
    }
    (setInterval(() => {
      document.hidden || s();
    }, 3e4),
      document.addEventListener("visibilitychange", () => {
        document.hidden || s();
      }));
  })());
const GO = { r: null, book: null };
(function () {
  const e = (o, s) =>
      [
        "dia",
        "mercado",
        "home",
        "estudos",
        "livro",
        "rev",
        "mesa",
        "carreira",
        "import",
        "live",
        "trades",
        "dash",
        "stats",
        "ops",
        "opgrade",
        "opfluxo",
        "opcart",
        "swbt",
        "dtrpy",
        "term",
        "pano",
        "carteiras",
      ].includes(o)
        ? (o === "rev" && (RP = "w0"),
          o === "livro"
            ? ((GO.book = s || null), (tab = "estudos"), !0)
            : ((tab = o),
              o === "dia" && ((D = loc().slice(0, 10)), (DV = "ed")),
              (GO.r = s || null),
              !0))
        : !1,
    t = new URLSearchParams(location.search);
  (t.get("go") &&
    (e(t.get("go"), t.get("r")),
    history.replaceState(null, "", location.pathname + location.hash)),
    "serviceWorker" in navigator &&
      navigator.serviceWorker.addEventListener("message", (o) => {
        const s = o.data || {};
        s.go && e(s.go, s.r) && (render(), scrollTo(0, 0));
      }));
  const a = render0;
  render0 = function () {
    if ((a(), GO.book && (S.books || []).some((o) => o.id === GO.book))) {
      ((BID = GO.book),
        (BV = "not"),
        (GO.book = null),
        irPara("livro"));
      return;
    }
    if (GO.r && tab === "dia") {
      const o = document.getElementById("rot-" + GO.r);
      ((GO.r = null),
        o &&
          setTimeout(() => {
            (o.scrollIntoView({ behavior: "smooth", block: "center" }),
              o.animate &&
                o.animate(
                  [
                    { boxShadow: "0 0 0 3px var(--ac)" },
                    { boxShadow: "0 0 0 0 transparent" },
                  ],
                  { duration: 1600, easing: "ease-out" },
                ));
          }, 120));
    }
  };
})();
const ADR0 = [
    "EWZ",
    "WEGZY",
    "BBSEY",
    "BDORY",
    "SUZ",
    "SID",
    "GGB",
    "ITUB",
    "PBR",
    "VALE",
    "ABEV",
    "BBD",
  ],
  AD = {
    list: (ls.get("diario-adr") || ADR0).slice(),
    data: ls.get("diario-adr-d"),
    busy: 0,
    err: "",
    sort: ls.get("diario-adr-o") || "lista",
    edit: 0,
    tm: null,
  };
ls.get("diario-adr-ewz") ||
  (AD.list.includes("EWZ") ||
    (AD.list.unshift("EWZ"),
    ls.get("diario-adr") && ls.set("diario-adr", AD.list)),
  ls.set("diario-adr-ewz", 1));
const adN = (e) =>
    e == null
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
  adP = (e) => (e == null ? "–" : (e > 0 ? "+" : "") + adN(e) + "%"),
  adSt = {
    overnight: "Overnight · madrugada",
    pre: "🟡 Pré-mercado",
    reg: "🟢 Pregão aberto",
    post: "🟠 Pós-mercado",
    closed: "⚪ Fechado",
  },
  adState = (e) => {
    const t = {};
    return (
      e.forEach((a) => {
        t[a.state] = (t[a.state] || 0) + 1;
      }),
      Object.keys(t).sort((a, o) => t[o] - t[a])[0] || "closed"
    );
  };
function adRow(e) {
  return window.TraderAdr.render(e);
}
function adrHtml() {
  let e = ((AD.data && AD.data.itens) || []).filter((r) =>
    AD.list.includes(r.s),
  );
  const t = e.find((r) => r.s === "EWZ");
  e = e.filter((r) => r.s !== "EWZ");
  const a = [...e, ...(t ? [t] : [])].some(
      (r) => window.TraderAdr.view(r).active?.kind === "overnight",
    )
      ? "overnight"
      : e.length
        ? adState(e)
        : t
          ? t.state
          : "closed",
    o = e.length ? window.TraderAdr.mean(e) : null;
  AD.sort === "alta"
    ? (e = e
        .slice()
        .sort(
          (r, i) =>
            (window.TraderAdr.view(i).change ?? -1 / 0) -
            (window.TraderAdr.view(r).change ?? -1 / 0),
        ))
    : AD.sort === "queda"
      ? (e = e
          .slice()
          .sort(
            (r, i) =>
              (window.TraderAdr.view(r).change ?? 1 / 0) -
              (window.TraderAdr.view(i).change ?? 1 / 0),
          ))
      : (e = e
          .slice()
          .sort((r, i) => AD.list.indexOf(r.s) - AD.list.indexOf(i.s)));
  const s = (r, i) =>
      `<button class="${AD.sort === r ? "on" : ""}" data-adr="o:${r}">${i}</button>`,
    n = AD.edit
      ? `<div class="card" style="margin:8px 0"><div style="display:flex;flex-wrap:wrap;gap:6px">${AD.list.map((r) => `<button class="btn s" data-adr="x:${esc(r)}" aria-label="Remover ${esc(r)}">${esc(r)} ✕</button>`).join("")}</div><div style="display:grid;grid-template-columns:1fr auto auto;gap:6px;margin-top:8px"><input id="adn" placeholder="Novo ticker (ex.: ERJ)" autocapitalize="characters" style="margin:0"><button class="btn" data-adr="add">Adicionar</button><button class="btn s" data-adr="reset">Padrão</button></div></div>`
      : "";
  return `<div class="top"><b>🇧🇷 ADRs brasileiras</b><span class="sm">${adSt[a]}</span></div>
<div class="sm mut" style="margin:4px 0 8px">Média ${a === "overnight" ? "overnight" : e.some((r) => window.TraderAdr.view(r).active) ? "da sessão estendida" : "regular"} ${o == null ? "–" : `<b class="${cls(o)}">${adP(o)}</b>`}${AD.data ? " · atualizado às " + hm(AD.data.ts) : ""}${AD.busy ? " · buscando…" : ""}</div>
<div style="display:flex;gap:6px;align-items:center"><div class="seg" style="flex:1">${s("lista", "Lista")}${s("alta", "Altas")}${s("queda", "Quedas")}</div><button class="btn s ib" data-adr="rf" aria-label="Atualizar" ${AD.busy ? "disabled" : ""}>↻</button><button class="btn ib${AD.edit ? "" : " s"}" data-adr="ed" aria-label="Editar lista">✏️</button></div>${n}
${AD.err ? `<div class="warn" style="margin-top:8px">${esc(AD.err)}</div>` : ""}
${t ? adRow(t) : ""}
<div style="margin-top:6px">${e.length ? e.map(adRow).join("") : `<div class="mut sm" style="padding:12px 0">${AD.busy ? "Buscando cotações…" : "Sem cotações ainda."}</div>`}</div>
<div class="sm mut" style="margin-top:6px">${esc((AD.data && AD.data.fonte) || "Fonte não informada")}. Preços em USD. Variação do overnight contra o fechamento regular; não é somada à variação do pregão. A média usa a sessão ativa quando confirmada e exclui o EWZ. Consulte a referência individual de cada preço.</div>`;
}
function adrPaint() {
  const e = document.getElementById("adr");
  e && (e.innerHTML = adrHtml());
}
async function adrLoad(e) {
  if (AD.busy) return;
  const t = (AD.data && AD.data.itens) || [],
    a = t.length && adState(t) === "closed";
  if (!e && AD.data && Date.now() - AD.data.ts < (a ? 3e5 : 5e4)) return;
  const o = cfg();
  if (!o) {
    ((AD.err = "Configure o Supabase na aba Conta para ver as cotações."),
      adrPaint());
    return;
  }
  ((AD.busy = 1), (AD.err = ""), adrPaint());
  try {
    let s;
    try {
      s = await fetch(o.url + "/functions/v1/adrs", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: o.key },
        body: JSON.stringify({ symbols: AD.list }),
      });
    } catch {
      throw new Error("Sem conexão. Mostrando a última cotação salva.");
    }
    let n = {};
    try {
      n = await s.json();
    } catch {}
    if (!s.ok)
      throw new Error(
        n.error ||
          (s.status === 404
            ? 'Função "adrs" não encontrada: publique-a no Supabase.'
            : s.status === 401
              ? "A função exige login: publique com --no-verify-jwt."
              : "Erro " + s.status),
      );
    ((AD.data = {
      ts: Date.now(),
      itens: n.itens || [],
      fonte: n.fonte || "",
      atraso: !!n.atraso,
    }),
      ls.set("diario-adr-d", AD.data),
      (n.erros || []).length &&
        (AD.err =
          "Sem dados de: " +
          n.erros.map((r) => String(r).split(":")[0]).join(", ") +
          "."));
  } catch (s) {
    AD.err = s.message || String(s);
  }
  ((AD.busy = 0), adrPaint());
}
function adrAfter() {
  (adrPaint(),
    adrLoad(!1),
    !AD.tm &&
      (AD.tm = setInterval(() => {
        if (tab !== "home") {
          (clearInterval(AD.tm), (AD.tm = null));
          return;
        }
        document.hidden || adrLoad(!1);
      }, 3e4)));
}
(function () {
  const e = vHome;
  vHome = function () {
    const a = e(),
      o = `<div class="card" id="adr" style="margin-top:12px">${adrHtml()}</div>`;
    let s = "";
    try {
      s = capTotal();
    } catch {}
    if (s && a.includes(s)) return a.replace(s, () => o + s);
    const n = "<h2>Posições abert";
    return a.includes(n) ? a.replace(n, () => o + n) : o + a;
  };
  const t = render0;
  ((render0 = function () {
    (t(), tab === "home" && adrAfter());
  }),
    document.addEventListener("visibilitychange", () => {
      !document.hidden && tab === "home" && adrLoad(!1);
    }),
    document.addEventListener("click", (a) => {
      const o = a.target.closest("[data-adr]");
      if (!o) return;
      const s = o.dataset.adr;
      if (s === "rf") {
        adrLoad(!0);
        return;
      }
      if (s === "ed") {
        ((AD.edit = !AD.edit), adrPaint());
        return;
      }
      if (s.startsWith("o:")) {
        ((AD.sort = s.slice(2)), ls.set("diario-adr-o", AD.sort), adrPaint());
        return;
      }
      if (s.startsWith("x:")) {
        AD.list.length > 1 &&
          ((AD.list = AD.list.filter((n) => n !== s.slice(2))),
          ls.set("diario-adr", AD.list),
          adrPaint(),
          adrLoad(!0));
        return;
      }
      if (s === "reset") {
        ((AD.list = ADR0.slice()),
          ls.set("diario-adr", AD.list),
          adrPaint(),
          adrLoad(!0));
        return;
      }
      if (s === "add") {
        const n = document.getElementById("adn"),
          r = n && n.value.trim().toUpperCase();
        if (
          !r ||
          !/^[A-Z0-9.\-]{1,10}$/.test(r) ||
          AD.list.includes(r) ||
          AD.list.length >= 40
        )
          return;
        (AD.list.push(r),
          ls.set("diario-adr", AD.list),
          adrPaint(),
          adrLoad(!0));
      }
    }));
})();
const RS_MAX = 50 * 1024 * 1024,
  RS = {
    up: {},
    jobs: ls.get("diario-rs") || {},
    loading: 0,
    loadedAt: 0,
    poll: null,
    clock: null,
    err: "",
    started: 0,
    auto: ls.get("diario-rs-auto") !== !1,
  },
  RS_PEND = ["na_fila", "processando"],
  rsPend = (e) => !!e && RS_PEND.includes(e.status),
  rsChip = (e) =>
    ({
      na_fila: "⏳ Na fila",
      processando: "⚙️ Gerando…",
      concluido: "✅ Resumo concluído",
      erro: "⚠️ Erro",
    })[e.status] || "",
  rsMin = (e) => {
    const t = Math.max(0, Math.round((Date.now() - new Date(e)) / 1e3));
    return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  },
  rsParado = (e) =>
    e.status === "processando" &&
    Date.now() - new Date(e.atualizado || e.criado) >
      (e.erro && /sozinho/.test(e.erro) ? 35 : 6) * 6e4;
async function rsFn(e, t) {
  const a = cfg();
  if (!a) throw new Error("Configure o Supabase na aba Conta.");
  if (!SESS || !SESS.at)
    throw new Error("Entre na sua conta (Mais → Conta) para gerar resumos.");
  await tok();
  let o;
  try {
    o = await fetch(a.url + "/functions/v1/resumo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: a.key,
        Authorization: "Bearer " + SESS.at,
      },
      body: JSON.stringify(Object.assign({ acao: e }, t || {})),
    });
  } catch {
    throw new Error(
      "Sem conexão. Se o pedido já foi enviado, o resumo continua sendo gerado no servidor.",
    );
  }
  let s = {};
  try {
    s = await o.json();
  } catch {}
  if (!o.ok)
    throw new Error(
      s.erro ||
        (o.status === 404
          ? 'Função "resumo" não encontrada: publique-a no Supabase.'
          : o.status === 401
            ? "Entre na sua conta de novo (Mais → Conta)."
            : "Erro " + o.status),
    );
  return s;
}
const rsTela = () => tab === "estudos" || tab === "livro";
function rsRefresh() {
  if (!rsTela()) return;
  const e = document.activeElement;
  (e && /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && e.value) || render();
}
var rsLoad;
function rsPoll() {
  const e = Object.values(RS.jobs).some(rsPend);
  (e &&
    !RS.poll &&
    (RS.poll = setInterval(() => {
      document.hidden || rsLoad(!0);
    }, 6e3)),
    !e && RS.poll && (clearInterval(RS.poll), (RS.poll = null)),
    e &&
      !RS.clock &&
      (RS.clock = setInterval(() => {
        document.querySelectorAll("[data-rs-t]").forEach((t) => {
          t.textContent = rsMin(t.dataset.rsT);
        });
      }, 1e3)),
    !e && RS.clock && (clearInterval(RS.clock), (RS.clock = null)));
}
const rsPdfErro = (e) =>
  e
    ? e.type === "application/pdf" || /\.pdf$/i.test(e.name)
      ? e.size <= 0
        ? "O PDF está vazio."
        : e.size > RS_MAX
          ? "O PDF passa de 50 MB (" +
            (e.size / 1048576).toFixed(1).replace(".", ",") +
            " MB). Escolha um arquivo menor."
          : ""
      : "Envie um arquivo PDF."
    : "";
function rsUpload(e, t, a) {
  return new Promise((o, s) => {
    const n = cfg();
    if (!n) return s(new Error("Configure o Supabase na aba Conta."));
    tok()
      .then(() => {
        const r = SESS.uid + "/" + t.id + "-" + Date.now() + ".pdf",
          i = new XMLHttpRequest();
        (i.open("POST", n.url + "/storage/v1/object/livros/" + r),
          i.setRequestHeader("apikey", n.key),
          i.setRequestHeader("Authorization", "Bearer " + SESS.at),
          i.setRequestHeader("Content-Type", "application/pdf"),
          i.setRequestHeader("x-upsert", "false"),
          (i.timeout = 10 * 6e4),
          (i.upload.onprogress = (l) => {
            l.lengthComputable &&
              a &&
              a(Math.round((l.loaded / l.total) * 100));
          }),
          (i.onload = () => {
            if (i.status >= 200 && i.status < 300) return o(r);
            let l = "";
            try {
              l = JSON.parse(i.responseText).message || "";
            } catch {}
            s(
              new Error(
                i.status === 413
                  ? "O PDF passa do limite de envio do servidor (50 MB)."
                  : l || "Não consegui enviar o PDF (erro " + i.status + ").",
              ),
            );
          }),
          (i.onerror = () =>
            s(new Error("Falha de rede no envio do PDF. Tente de novo."))),
          (i.ontimeout = () => s(new Error("O envio do PDF demorou demais."))),
          i.send(e));
      })
      .catch(s);
  });
}
function rsUpUi(e, t) {
  (document.querySelectorAll('[data-rs-up="' + e + '"]').forEach((a) => {
    a.textContent = t + "%";
  }),
    document.querySelectorAll('[data-rs-upbar="' + e + '"]').forEach((a) => {
      a.style.width = t + "%";
    }));
}
var rsCriar;
const rsPushHint = () =>
  typeof Notification < "u" && Notification.permission === "granted"
    ? "Você também recebe uma notificação quando terminar."
    : "Quer ser avisado com o app fechado? Ative em Mercado → Alertas.";
function rsView(e, t) {
  const a = t.resultado;
  if (!a)
    return '<div class="sm mut" style="margin:6px 0">Carregando o resumo…</div>';
  const o = (l, d, c) =>
      `<details class="rs-sec"${c ? " open" : ""}><summary><b>${l}</b></summary><div class="sm" style="margin-top:6px;line-height:1.55">${d}</div></details>`,
    s = (l) =>
      (l || []).map((d) => `<p style="margin:6px 0">${esc(d)}</p>`).join(""),
    n = (l, d, c) =>
      (l || [])
        .map(
          (p) =>
            `<div style="margin:8px 0"><b>${esc(p[d])}</b><div>${esc(p[c])}</div></div>`,
        )
        .join(""),
    r =
      { alta: "var(--g)", média: "#a57d34", baixa: "var(--r)" }[a.confianca] ||
      "var(--mut)",
    i = t.concluido ? new Date(t.concluido).toLocaleDateString("pt-BR") : "";
  return `<div class="sm mut" style="margin-top:4px">${esc(a.autor || e.a || "")}${a.ano_publicacao && a.ano_publicacao !== "sem dado" ? " · " + esc(a.ano_publicacao) : ""}${a.tema ? " · " + esc(a.tema) : ""}</div>
<div class="sm" style="margin:6px 0">Confiança da IA: <b style="color:${r}">${esc(a.confianca)}</b>${a.nota_confianca ? " · " + esc(a.nota_confianca) : ""}</div>
${a.tese_central ? `<div class="card" style="margin:8px 0"><div class="sm mut">Tese central</div><div style="margin-top:2px">${esc(a.tese_central)}</div></div>` : ""}
${a.resumo_executivo.length ? o("📄 Resumo executivo", s(a.resumo_executivo), 1) : ""}
${a.ideias_principais.length ? o("💡 Ideias principais (" + a.ideias_principais.length + ")", n(a.ideias_principais, "titulo", "explicacao")) : ""}
${a.estrutura.length ? o("🗂️ Estrutura do livro", n(a.estrutura, "parte", "resumo")) : ""}
${a.conceitos_chave.length ? o("🔑 Conceitos-chave", n(a.conceitos_chave, "termo", "definicao")) : ""}
${a.aplicacao_no_trading.length ? o("🎯 Como aplicar no trading", n(a.aplicacao_no_trading, "ideia", "como_aplicar")) : ""}
${a.criticas_e_limites.length ? o("⚖️ Críticas e limites", s(a.criticas_e_limites)) : ""}
${a.para_quem_e ? o("👤 Para quem é", s([a.para_quem_e])) : ""}
${a.perguntas_de_revisao.length ? o("❓ Perguntas de revisão", '<ol style="margin:6px 0;padding-left:20px">' + a.perguntas_de_revisao.map((l) => `<li style="margin:4px 0">${esc(l)}</li>`).join("") + "</ol>") : ""}
${a.fontes_consultadas.length ? o("🔗 Fontes consultadas", s(a.fontes_consultadas)) : ""}
<div class="sm mut" style="margin:8px 0">${a.origem === "pdf" ? "Baseado no PDF que você enviou." : "Baseado no conhecimento do modelo e em busca na web, sem leitura do livro."} Gerado por IA${i ? " em " + i : ""}. Pode haver imprecisões, confira no livro.</div>
<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" data-rs="note" data-id="${e.id}">📝 Salvar nas anotações</button><button class="btn s" data-rs="again" data-id="${e.id}">Gerar de novo</button><button class="btn s" data-rs="del" data-id="${e.id}">Apagar</button></div>`;
}
var rsCard;
function rsNote(e) {
  const t = RS.jobs[e.id],
    a = t && t.resultado;
  if (!a) return;
  const o = [
    "Tese central: " + a.tese_central,
    "",
    "Ideias principais:",
    ...a.ideias_principais.map(
      (s, n) => n + 1 + ". " + s.titulo + ": " + s.explicacao,
    ),
    "",
    "Como aplicar no trading:",
    ...a.aplicacao_no_trading.map(
      (s) => "• " + s.ideia + ": " + s.como_aplicar,
    ),
  ].join(`
`);
  ((e.notes ?? (e.notes = [])).unshift({
    id: uid(),
    t: "Resumo (IA): " + (a.titulo || e.t),
    p: "",
    x: o,
    u: Date.now(),
  }),
    save(),
    render(),
    window.toast && toast("Anotação criada com os pontos principais"));
}
(function () {
  const e = TraderStyles.slot("legacy-008");
  ((e.textContent = TraderStyles.css("legacy-008")), TraderStyles.mount(e));
  const t = vEstudos;
  vEstudos = function () {
    let s = t();
    const n =
      '<button class="btn" style="margin-top:10px" data-a="addbook">+ Adicionar livro</button>';
    (s.includes(n) &&
      (s = s.replace(
        n,
        () =>
          `<label style="margin-top:8px">📎 PDF do livro (opcional, até 50 MB)<input type="file" id="rspdf" accept="application/pdf,.pdf"></label><label class="ck" style="margin-top:8px"><input type="checkbox" id="rsauto"${RS.auto ? " checked" : ""}><span>✨ Gerar resumo com IA ao adicionar</span></label>` +
          n,
      )),
      (S.books || []).forEach((i) => {
        const l = RS.jobs[i.id];
        if (!l) return;
        const d = s.indexOf('data-a="openbook" data-id="' + i.id + '"');
        if (d < 0) return;
        const c = s.indexOf("</div></div></div>", d);
        if (c < 0) return;
        const p = `<div class="sm" style="margin-top:2px">${rsChip(l)}</div>`;
        s = s.slice(0, c + 6) + p + s.slice(c + 6);
      }));
    const r = Object.values(RS.jobs).filter(rsPend);
    if (r.length) {
      const i = '<details class="card est-book-add">';
      s.includes(i) &&
        (s = s.replace(
          i,
          () =>
            `<div class="card" style="margin-bottom:8px"><b>⏳ Gerando resumo${r.length > 1 ? "s" : ""}</b>${r.map((l) => `<div class="sm" style="margin-top:4px">${esc(l.titulo)} · <b data-rs-t="${esc(l.criado)}">${rsMin(l.criado)}</b></div>`).join("")}<div class="sm mut" style="margin-top:4px">Pode sair da tela. ${rsPushHint()}</div></div>` +
            i,
        ));
    }
    return s;
  };
  const a = vLivro;
  vLivro = function () {
    const s = a(),
      n = (S.books || []).find((l) => l.id === BID);
    if (!n) return s;
    const r = "</select></label>",
      i = s.indexOf(r);
    return i < 0
      ? s
      : s.slice(0, i + r.length) + rsCard(n) + s.slice(i + r.length);
  };
  const o = render0;
  ((render0 = function () {
    (o(),
      !RS.started && SESS && ((RS.started = 1), rsLoad(!0)),
      rsTela() && (rsLoad(!1), rsPoll()));
  }),
    document.addEventListener(
      "click",
      (s) => {
        if (!s.target.closest('[data-a="addbook"]')) return;
        const n = (u) =>
            ((document.getElementById(u) || {}).value || "").trim(),
          r = document.getElementById("rsauto"),
          i = n("bt"),
          l = n("ba"),
          d = document.getElementById("rspdf"),
          c = (d && d.files && d.files[0]) || null;
        if (
          (r && ((RS.auto = r.checked), ls.set("diario-rs-auto", RS.auto)),
          !i || !(c || (r && r.checked)))
        )
          return;
        const p = rsPdfErro(c);
        if (p) {
          window.toast && toast(p + " O livro foi adicionado sem resumo.", 5e3);
          return;
        }
        setTimeout(() => {
          const u = (S.books || []).find(
            (m) =>
              m.t === i && (m.a || "") === l && Date.now() - (m.u || 0) < 5e3,
          );
          u && rsCriar(u, "", c);
        }, 60);
      },
      !0,
    ),
    document.addEventListener("click", async (s) => {
      const n = s.target.closest("[data-rs]");
      if (!n) return;
      const r = (S.books || []).find((d) => d.id === n.dataset.id);
      if (!r) return;
      const i = RS.jobs[r.id],
        l = n.dataset.rs;
      if (l === "gen") {
        const d = document.getElementById("rspdf2"),
          c = (d && d.files && d.files[0]) || null,
          p = rsPdfErro(c);
        if (p) {
          window.toast && toast(p, 5e3);
          return;
        }
        rsCriar(
          r,
          ((document.getElementById("rsfoco") || {}).value || "").trim(),
          c,
        );
      } else if (l === "again")
        confirm("Gerar um novo resumo? O atual será substituído.") &&
          rsCriar(r, "");
      else if (l === "note") rsNote(r);
      else if (l === "retry" && i) {
        try {
          (await rsFn("retomar", { id: i.id }),
            (i.status = "na_fila"),
            (i.atualizado = new Date().toISOString()),
            (i.erro = null),
            ls.set("diario-rs", RS.jobs));
        } catch (d) {
          window.toast && toast(d.message, 4e3);
        }
        (rsRefresh(), rsPoll());
      } else if (l === "del" && i) {
        if (!confirm("Apagar este resumo?")) return;
        try {
          await rsFn("apagar", { id: i.id });
        } catch {}
        (delete RS.jobs[r.id], ls.set("diario-rs", RS.jobs), rsRefresh());
      }
    }),
    document.addEventListener("visibilitychange", () => {
      !document.hidden &&
        SESS &&
        Object.values(RS.jobs).some(rsPend) &&
        rsLoad(!0);
    }));
})();
var ESV = "liv",
  RSNEXT = null;
const RS_PAGS = [50, 100, 150, 200],
  RS_PPAG = 400;
((RS.full = RS.full || {}), (RS.extraBusy = {}), (RS.fullTry = {}));
const RSP0 = [
    [
      "Regras para o meu plano",
      "Transforme as ideias do livro em regras objetivas que eu possa colocar no meu plano de trading: quando entrar, quando não operar, onde colocar o stop, como dimensionar a posição e quando sair. Para cada regra, diga de qual capítulo ela vem.",
    ],
    [
      "Checklist pré-operação",
      "Monte um checklist de 10 a 15 itens para eu revisar antes de cada operação, baseado no livro. Itens curtos, de marcar sim ou não.",
    ],
    [
      "Flashcards",
      "Crie 30 flashcards (pergunta e resposta curtas) com os conceitos mais importantes, do básico ao avançado.",
    ],
    [
      "Questões de prova",
      "Crie 15 questões de múltipla escolha (4 alternativas) com gabarito comentado, cobrindo os principais conceitos.",
    ],
    [
      "Explicar simples",
      "Explique os 10 conceitos mais difíceis em linguagem simples, cada um com um exemplo prático de day trade no mini índice (WIN).",
    ],
    [
      "Plano de estudo",
      "Monte um plano de estudo de 4 semanas para eu dominar este conteúdo, com metas por semana e exercícios práticos para fazer no meu diário de trades.",
    ],
    [
      "Erros que o livro evita",
      "Liste os erros de trader que o livro ajuda a evitar e, para cada um, o sinal de alerta e o que fazer no momento.",
    ],
  ],
  rspLista = () => ((S.ax || {}).rsp || []).filter((e) => e && e.id),
  rspSet = (e) => {
    (((S.ax ?? (S.ax = {})).rsp = e), save());
  },
  rspPref = (e, t) => (S.ax || {})["rs." + e] ?? t,
  rspSetPref = (e, t) => {
    (((S.ax ?? (S.ax = {}))["rs." + e] = t), save());
  };
function rspTexto(e) {
  if (!e) return "";
  if (e.startsWith("u:")) {
    const t = rspLista().find((a) => a.id === e.slice(2));
    return t ? t.x : "";
  }
  if (e.startsWith("m:")) {
    const t = RSP0[+e.slice(2)];
    return t ? t[1] : "";
  }
  return "";
}
function rspOpts(e, t) {
  const a = rspLista();
  return `<option value="">${esc(t || "Nenhum (prompt padrão do app)")}</option>${a.length ? `<optgroup label="Meus prompts">${a.map((o) => `<option value="u:${o.id}"${e === "u:" + o.id ? " selected" : ""}>${esc(o.n || "Sem nome")}</option>`).join("")}</optgroup>` : ""}<optgroup label="Modelos prontos">${RSP0.map((o, s) => `<option value="m:${s}"${e === "m:" + s ? " selected" : ""}>${esc(o[0])}</option>`).join("")}</optgroup>`;
}
const rsPagTxt = (e) =>
  "≈ " + (e || 0).toLocaleString("pt-BR") + " página" + (e === 1 ? "" : "s");
function mdHtml(e) {
  const t = (l) =>
      esc(l)
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<i>$2</i>")
        .replace(/`([^`]+)`/g, "<code>$1</code>"),
    a = String(e || "").replace(/\r/g, "").split(`
`);
  let o = "",
    s = null,
    n = [];
  const r = () => {
      n.length && ((o += "<p>" + t(n.join(" ")) + "</p>"), (n = []));
    },
    i = () => {
      s && ((o += "</" + s + ">"), (s = null));
    };
  for (const l of a) {
    let d;
    if (!l.trim()) {
      (r(), i());
      continue;
    }
    if ((d = l.match(/^(#{1,5})\s+(.*)/))) {
      (r(), i());
      const c = Math.min(5, d[1].length + 1);
      o += `<h${c}>${t(d[2])}</h${c}>`;
      continue;
    }
    if ((d = l.match(/^\s*[-*\u2022]\s+(.*)/))) {
      (r(),
        s !== "ul" && (i(), (o += "<ul>"), (s = "ul")),
        (o += "<li>" + t(d[1]) + "</li>"));
      continue;
    }
    if ((d = l.match(/^\s*\d+[.)]\s+(.*)/))) {
      (r(),
        s !== "ol" && (i(), (o += "<ol>"), (s = "ol")),
        (o += "<li>" + t(d[1]) + "</li>"));
      continue;
    }
    if ((d = l.match(/^>\s?(.*)/))) {
      (r(), i(), (o += "<blockquote>" + t(d[1]) + "</blockquote>"));
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) {
      (r(), i(), (o += "<hr>"));
      continue;
    }
    (i(), n.push(l.trim()));
  }
  return (r(), i(), o);
}
async function rsFull(e, t) {
  const a = RS.jobs[e.id];
  if (!a) return null;
  const o = RS.full[e.id];
  if (o && o.id === a.id && !t && o.at > Date.parse(a.atualizado || 0) - 1)
    return o;
  if (RS.fullBusy) return o || null;
  RS.fullBusy = 1;
  try {
    const s = (await rsFn("obter", { id: a.id })).item;
    return (
      (RS.full[e.id] = {
        id: s.id,
        at: Date.now(),
        longo: s.longo,
        extras: s.extras || [],
        prompt: s.prompt || "",
        resultado: s.resultado,
      }),
      RS.full[e.id]
    );
  } catch (s) {
    return (window.toast && toast(s.message, 4e3), o || null);
  } finally {
    RS.fullBusy = 0;
  }
}
const rsPartes = (e) =>
    ((e && e.longo && e.longo.partes) || []).filter((t) => t.texto),
  rsLidas = (e) => (S.ax || {})["rsl." + e.id] || [];
((rsLoad = async function (e) {
  if (!(RS.loading || !SESS) && !(!e && Date.now() - RS.loadedAt < 15e3)) {
    RS.loading = 1;
    try {
      const t = await rsFn("listar"),
        a = {},
        o = [];
      let s = 0;
      for (const n of t.itens || []) {
        const r = RS.jobs[n.book_id],
          i = r && r.id === n.id,
          l = Object.assign({}, i ? r : {}, n);
        if (
          n.status === "concluido" &&
          (!l.resultado || (i && r.concluido !== n.concluido))
        )
          try {
            l.resultado = (await rsFn("obter", { id: n.id })).item.resultado;
          } catch {}
        (i && rsPend(r) && n.status === "concluido" && o.push(n),
          (!i ||
            r.status !== n.status ||
            JSON.stringify(r.progresso || null) !==
              JSON.stringify(n.progresso || null)) &&
            (s = 1),
          (a[n.book_id] = l));
      }
      (Object.keys(RS.jobs).some((n) => !a[n]) && (s = 1),
        (RS.jobs = a),
        ls.set("diario-rs", a),
        (RS.err = ""),
        (RS.loadedAt = Date.now()),
        o.forEach((n) => {
          (delete RS.full[n.book_id],
            window.toast &&
              toast(
                (n.modo === "completo"
                  ? "📚 Resumo completo pronto: "
                  : "📖 Resumo concluído: ") + n.titulo,
                4e3,
              ));
        }),
        s && rsRefresh());
    } catch (t) {
      RS.err = t.message;
    }
    ((RS.loading = 0), rsPoll());
  }
}),
  (rsCriar = async function (e, t, a, o) {
    ((o = o ||
      RSNEXT || {
        modo: rspPref("modo", "padrao"),
        paginas: rspPref("pag", 100),
        prompt: rspTexto(rspPref("def", "")),
      }),
      (RSNEXT = null),
      (RS.err = ""));
    try {
      if (o.modo === "completo" && !a)
        throw new Error(
          "O resumo completo (50+ páginas) é feito a partir do PDF: anexe o arquivo do livro.",
        );
      let s;
      try {
        const l = await navigator.serviceWorker.ready,
          d = await l.pushManager.getSubscription();
        s = d && d.endpoint;
      } catch {}
      let n;
      if (a) {
        const l = rsPdfErro(a);
        if (l) throw new Error(l);
        ((RS.up[e.id] = { p: 0 }), rsRefresh());
        try {
          n = await rsUpload(a, e, (d) => {
            ((RS.up[e.id].p = d), rsUpUi(e.id, d));
          });
        } finally {
          delete RS.up[e.id];
        }
      }
      const r = await rsFn("criar", {
          book_id: e.id,
          titulo: e.t,
          autor: e.a || "",
          foco: t || "",
          endpoint: s,
          arquivo: n,
          modo: o.modo,
          paginas: o.paginas,
          prompt: o.prompt || "",
        }),
        i = new Date().toISOString();
      ((RS.jobs[e.id] = {
        id: r.id,
        book_id: e.id,
        titulo: e.t,
        autor: e.a || "",
        status: r.status || "na_fila",
        criado: i,
        atualizado: i,
        modo: o.modo,
        paginas: o.modo === "completo" ? o.paginas : null,
        progresso: null,
      }),
        delete RS.full[e.id],
        ls.set("diario-rs", RS.jobs),
        window.toast &&
          toast(
            o.modo === "completo"
              ? "Resumo completo na fila: leva de 15 a 40 min. Pode fechar o app, avisamos quando terminar."
              : "Resumo na fila. Pode sair da tela, avisamos quando terminar.",
            4500,
          ));
    } catch (s) {
      ((RS.err = s.message), window.toast && toast(s.message, 4500));
    }
    (rsRefresh(), rsPoll());
  }));
function rsForm(e) {
  const t = rspPref("modo", "padrao"),
    a = rspPref("pag", 100),
    o = rspPref("def", "");
  return `<div class="sm mut" style="margin:6px 0 8px">Escolha o tipo de resumo. Tudo roda em segundo plano: pode sair da tela.</div>
<div class="seg" style="margin-bottom:8px"><button class="${t === "padrao" ? "on" : ""}" data-ep="modo" data-id="padrao">📄 Padrão</button><button class="${t === "completo" ? "on" : ""}" data-ep="modo" data-id="completo">📚 Completo</button></div>
${t === "completo" ? `<div class="card" style="margin:0 0 8px;background:var(--bg)"><div class="sm"><b>Resumo completo, capítulo a capítulo</b>, com no mínimo:</div><div class="seg" style="margin:6px 0">${RS_PAGS.map((s) => `<button class="${+a === s ? "on" : ""}" data-ep="pag" data-id="${s}">${s} pág.</button>`).join("")}</div><div class="sm mut">Feito a partir do <b>PDF</b> (obrigatório). O Gemini lê o sumário, faz o resumo geral e escreve cada capítulo em profundidade, com páginas citadas, pontos-chave e aplicação no trading. Leva de 15 a 40 min e usa várias chamadas ao Gemini (custa mais que o padrão). Página = A4, fonte 12, ~${RS_PPAG} palavras.</div></div>` : '<div class="sm mut" style="margin-bottom:8px">Resumo estruturado (tese, ideias, conceitos, aplicação no trading, perguntas). 30 s a 2 min. Com PDF usa o texto real do livro; sem PDF usa o que o Gemini conhece do livro.</div>'}
<label>🧩 Prompt (opcional)<select id="rspsel">${rspOpts(o)}</select></label>
<textarea id="rsptx" rows="3" placeholder="Escreva aqui o que você quer além do padrão (ex.: foque em gestão de risco e traga exemplos com mini índice)" style="width:100%;margin-top:4px">${esc(rspTexto(o))}</textarea>
<div class="sm mut" style="margin-bottom:6px">Seus prompts ficam em Estudos → 🧩 Meus prompts. As regras de fidelidade ao livro continuam valendo.</div>
<label>Foco (opcional)<input id="rsfoco" placeholder="ex.: gestão de risco e psicologia"></label>
<label>📎 PDF do livro ${t === "completo" ? "<b>(obrigatório)</b>" : "(opcional)"}, até 50 MB<input type="file" id="rspdf2" accept="application/pdf,.pdf"></label>
<div class="sm mut">O arquivo vai para o Gemini (Google) e é apagado do seu armazenamento e do Gemini assim que o resumo fica pronto.</div>
<button class="btn" style="margin-top:8px;width:100%" data-ep="gen" data-id="${e.id}">✨ Gerar ${t === "completo" ? "resumo completo (mín. " + a + " páginas)" : "resumo"}</button>`;
}
function rsAndamento(e, t) {
  const a = t.progresso || {},
    o = a.meta_paginas || t.paginas || 100,
    s = (a.partes || 0) + 2,
    n = (a.prontas || 0) + (a.geral ? 1 : 0) + (a.partes ? 1 : 0),
    r = Math.min(99, Math.round((n / Math.max(s, 3)) * 100)),
    i = a.partes
      ? a.geral
        ? a.etapa === "parte"
          ? `Escrevendo a parte ${a.parte} de ${a.partes}…`
          : a.etapa === "fim"
            ? "Finalizando…"
            : "Na fila…"
        : "Fazendo o resumo geral…"
      : "Lendo o sumário do livro…",
    l = a.partes
      ? Math.max(1, Math.round((a.partes - (a.prontas || 0)) * 1.5))
      : null;
  return `<div class="sm" style="margin:8px 0 4px"><b>${i}</b> <span class="mut">· <b data-rs-t="${esc(t.criado)}">${rsMin(t.criado)}</b></span></div>
<div style="height:6px;border-radius:3px;background:var(--bd);overflow:hidden"><div style="height:100%;width:${r}%;background:var(--ac);transition:width .4s"></div></div>
<div class="sm mut" style="margin-top:6px">${a.palavras ? a.palavras.toLocaleString("pt-BR") + " palavras · " + rsPagTxt(a.paginas) + " de " + o : "Meta: " + o + " páginas"}${l ? " · faltam ~" + l + " min" : ""}</div>
${t.erro ? `<div class="sm" style="margin-top:4px;color:#a57d34">Tentando de novo: ${esc(t.erro)}</div>` : ""}
${a.prontas ? `<button class="btn s" style="margin-top:8px" data-ep="ler" data-id="${e.id}">📖 Ler o que já está pronto (${a.prontas} parte${a.prontas > 1 ? "s" : ""})</button>` : ""}
<div class="sm mut" style="margin-top:6px">Pode fechar o app. ${rsPushHint()}</div>`;
}
function rsCompletoCard(e, t) {
  const a = t.resultado || {},
    o = a.completo,
    s = RS.full[e.id],
    n = rsLidas(e).length;
  if (!o && t.modo !== "completo") return "";
  const r = o ? o.partes : rsPartes(s).length;
  return `<div class="card" style="margin:10px 0;border:1px solid var(--ac)"><div class="top"><b>📚 Resumo completo</b><span class="sm mut">${o ? r + " partes · " + rsPagTxt(o.paginas) : ""}</span></div>
${o ? `<div class="sm mut" style="margin:4px 0">${o.palavras.toLocaleString("pt-BR")} palavras · meta ${o.meta_paginas} páginas${n ? " · " + n + "/" + r + " partes lidas" : ""}</div>` : ""}
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn" data-ep="ler" data-id="${e.id}">📖 Ler</button><button class="btn s" data-ep="pdf" data-id="${e.id}">🖨️ Salvar em PDF</button><button class="btn s" data-ep="md" data-id="${e.id}">⬇️ Baixar texto (.md)</button></div></div>`;
}
function rsExtrasCard(e, t) {
  const a = RS.full[e.id],
    o = ((a && a.extras) || []).filter((n) => n.tipo !== "quiz"),
    s = RS.extraBusy[e.id];
  return `<div class="card" style="margin:10px 0"><div class="top"><b>🧩 Perguntar ao resumo</b></div>
<div class="sm mut" style="margin:4px 0 6px">Rode um prompt seu (ou um modelo) em cima deste resumo: flashcards, checklist, regras para o seu plano…</div>
<select id="rsxsel">${rspOpts("", "Escrever agora…")}</select>
<textarea id="rsxtx" rows="3" placeholder="Ex.: crie um checklist pré-operação com base no livro" style="width:100%;margin-top:4px"></textarea>
<button class="btn" style="margin-top:6px;width:100%" data-ep="extra" data-id="${e.id}"${s ? " disabled" : ""}>${s ? "⏳ Gerando… (até 2 min)" : "▶️ Rodar prompt"}</button>
${a ? o.map((n) => `<details class="rs-sec"><summary><b>${esc(n.titulo)}</b> <span class="sm mut">· ${new Date(n.criado).toLocaleDateString("pt-BR")}</span></summary><div class="sm mut" style="margin:6px 0;white-space:pre-wrap">${esc(n.prompt)}</div><div class="md">${mdHtml(n.texto)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn s" data-ep="xnote" data-id="${e.id}" data-x="${n.id}">📝 Salvar nas anotações</button><button class="btn s" data-ep="xcopy" data-id="${e.id}" data-x="${n.id}">📋 Copiar</button><button class="btn s d" data-ep="xdel" data-id="${e.id}" data-x="${n.id}">Apagar</button></div></details>`).join("") : `<button class="btn s" style="margin-top:8px" data-ep="carrega" data-id="${e.id}">Ver respostas anteriores</button>`}
</div>`;
}
rsCard = function (e) {
  const t = RS.jobs[e.id];
  let a =
    '<div class="card" id="rs-card" style="margin:10px 0"><div class="top"><b>✨ Resumo com IA</b>' +
    (t
      ? `<span class="sm">${t.modo === "completo" && rsPend(t) ? "📚 Completo · " : ""}${rsChip(t)}</span>`
      : "") +
    "</div>";
  return (
    SESS
      ? RS.up[e.id]
        ? (a += `<div class="sm" style="margin:8px 0 6px">⬆️ Enviando o PDF… <b data-rs-up="${e.id}">${RS.up[e.id].p}%</b></div><div style="height:4px;border-radius:2px;background:var(--bd);overflow:hidden"><div data-rs-upbar="${e.id}" style="height:100%;width:${RS.up[e.id].p}%;background:var(--ac)"></div></div><div class="sm mut" style="margin-top:6px">Mantenha o app aberto até o envio terminar. Depois pode sair da tela.</div>`)
        : !t || RS.novo === e.id
          ? (a +=
              rsForm(e) +
              (t
                ? `<button class="btn s" style="margin-top:6px;width:100%" data-ep="cancnovo" data-id="${e.id}">Cancelar e voltar ao resumo atual</button>`
                : ""))
          : rsPend(t)
            ? (a +=
                (t.modo === "completo"
                  ? rsAndamento(e, t)
                  : `<div class="sm" style="margin:8px 0 6px">${t.status === "na_fila" ? "Na fila…" : "Gerando o resumo…"} <b data-rs-t="${esc(t.criado)}">${rsMin(t.criado)}</b></div><div style="height:4px;border-radius:2px;background:var(--bd);overflow:hidden"><div class="rs-bar"></div></div><div class="sm mut" style="margin-top:6px">Pode sair desta tela. ${rsPushHint()}</div>`) +
                (rsParado(t)
                  ? `<button class="btn s" style="margin-top:8px" data-rs="retry" data-id="${e.id}">Parece travado: tentar de novo</button>`
                  : ""))
            : t.status === "erro"
              ? (a += `<div class="warn" style="margin:8px 0">${esc(t.erro || "Não consegui gerar o resumo.")}</div>${t.progresso && t.progresso.prontas ? `<div class="sm mut" style="margin-bottom:6px">${t.progresso.prontas} de ${t.progresso.partes} partes já prontas (${rsPagTxt(t.progresso.paginas)}).</div>` : ""}<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" data-rs="retry" data-id="${e.id}">${t.modo === "completo" ? "Continuar de onde parou" : "Tentar de novo"}</button>${t.progresso && t.progresso.prontas ? `<button class="btn s" data-ep="ler" data-id="${e.id}">📖 Ler o que ficou pronto</button>` : ""}<button class="btn s" data-rs="del" data-id="${e.id}">Descartar</button></div>`)
              : (a += rsView(e, t))
      : (a +=
          '<div class="sm mut" style="margin-top:6px">Entre na sua conta (Mais → Conta) para gerar resumos.</div>'),
    a +
      (RS.err
        ? `<div class="sm mut" style="margin-top:6px">${esc(RS.err)}</div>`
        : "") +
      "</div>" +
      (t && t.status === "concluido" && RS.novo !== e.id
        ? rsCompletoCard(e, t) + rsExtrasCard(e, t)
        : "")
  );
};
const rsView0 = rsView;
rsView = function (e, t) {
  return rsView0(e, t).replace(
    `data-rs="again" data-id="${e.id}"`,
    `data-ep="novo" data-id="${e.id}"`,
  );
};
let RL = null;
function rlAbre(e, t, a) {
  const o = rsPartes(t);
  if (!o.length) {
    window.toast && toast("Ainda não há partes prontas.");
    return;
  }
  RL = {
    b: e,
    f: t,
    i: Math.max(0, Math.min(a || 0, o.length - 1)),
    fs: +(ls.get("diario-rl-fs") || 17),
  };
  let s = document.getElementById("rl");
  (s ||
    ((s = document.createElement("div")),
    (s.id = "rl"),
    document.body.appendChild(s)),
    rlDesenha(),
    (document.body.style.overflow = "hidden"));
}
function rlFecha() {
  const e = document.getElementById("rl");
  (e && e.remove(), (RL = null), (document.body.style.overflow = ""), render());
}
function rlDesenha() {
  if (!RL) return;
  const e = document.getElementById("rl");
  if (!e) return;
  const t = rsPartes(RL.f),
    a = t[RL.i],
    o = rsLidas(RL.b),
    s = o.includes(a.titulo);
  e.innerHTML = `<div class="rl-top"><button class="btn s" data-rl="x">✕</button><select data-rl="sel" style="flex:1;min-width:0">${t.map((r, i) => `<option value="${i}"${i === RL.i ? " selected" : ""}>${o.includes(r.titulo) ? "✓ " : ""}${i + 1}. ${esc(r.titulo)}</option>`).join("")}</select><button class="btn s" data-rl="a-">A−</button><button class="btn s" data-rl="a+">A+</button></div>
<div class="rl-body md" style="font-size:${RL.fs}px">${RL.i === 0 && RL.f.resultado && RL.f.resultado.tese_central ? `<div class="card" style="margin-bottom:14px"><div class="sm mut">Tese central</div>${esc(RL.f.resultado.tese_central)}</div>` : ""}${mdHtml(a.texto)}
<div class="sm mut" style="margin:18px 0 8px">${(a.palavras || 0).toLocaleString("pt-BR")} palavras${a.paginas ? " · p. " + esc(a.paginas) + " do PDF" : ""} · parte ${RL.i + 1} de ${t.length}</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:40px"><button class="btn s" data-rl="ant"${RL.i ? "" : " disabled"}>‹ Anterior</button><button class="btn ${s ? "s" : ""}" data-rl="lida">${s ? "✓ Lida" : "Marcar como lida"}</button><button class="btn s" data-rl="prox"${RL.i < t.length - 1 ? "" : " disabled"}>Próxima ›</button></div></div>`;
  const n = e.querySelector(".rl-body");
  n && (n.scrollTop = 0);
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-rl]");
  if (!t || !RL) return;
  const a = t.dataset.rl,
    o = rsPartes(RL.f);
  if (a === "x") return rlFecha();
  if (a === "ant" && RL.i > 0) RL.i--;
  else if (a === "prox" && RL.i < o.length - 1) RL.i++;
  else if (a === "a+" || a === "a-")
    ((RL.fs = Math.max(13, Math.min(24, RL.fs + (a === "a+" ? 1 : -1)))),
      ls.set("diario-rl-fs", RL.fs));
  else if (a === "lida") {
    const s = o[RL.i].titulo,
      n = rsLidas(RL.b).slice(),
      r = n.indexOf(s);
    (r < 0 ? n.push(s) : n.splice(r, 1),
      ((S.ax ?? (S.ax = {}))["rsl." + RL.b.id] = n),
      save(),
      r < 0 && RL.i < o.length - 1 && RL.i++);
  } else return;
  rlDesenha();
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest('[data-rl="sel"]');
    t && RL && ((RL.i = +t.value), rlDesenha());
  }),
  document.addEventListener("keydown", (e) => {
    if (RL)
      if (e.key === "Escape") rlFecha();
      else if (e.key === "ArrowRight") {
        const t = rsPartes(RL.f);
        RL.i < t.length - 1 && (RL.i++, rlDesenha());
      } else e.key === "ArrowLeft" && RL.i > 0 && (RL.i--, rlDesenha());
  }));
