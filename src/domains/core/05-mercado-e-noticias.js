function rsMd(e, t) {
  const a = t.resultado || {},
    o = [
      "# " + (a.titulo || e.t),
      a.autor || e.a ? "*" + (a.autor || e.a) + "*" : "",
      "",
    ];
  (a.tese_central && o.push("## Tese central", "", a.tese_central, ""),
    (a.resumo_executivo || []).length &&
      o.push(
        "## Resumo executivo",
        "",
        ...a.resumo_executivo.flatMap((n) => [n, ""]),
      ),
    (a.ideias_principais || []).length &&
      o.push(
        "## Ideias principais",
        "",
        ...a.ideias_principais.map(
          (n, r) => `${r + 1}. **${n.titulo}**: ${n.explicacao}`,
        ),
        "",
      ),
    (a.conceitos_chave || []).length &&
      o.push(
        "## Conceitos-chave",
        "",
        ...a.conceitos_chave.map((n) => `- **${n.termo}**: ${n.definicao}`),
        "",
      ),
    (a.aplicacao_no_trading || []).length &&
      o.push(
        "## Como aplicar no trading",
        "",
        ...a.aplicacao_no_trading.map(
          (n) => `- **${n.ideia}**: ${n.como_aplicar}`,
        ),
        "",
      ));
  const s = rsPartes(t);
  return (
    s.length &&
      o.push(
        "# Resumo capítulo a capítulo",
        "",
        ...s.flatMap((n) => [n.texto, ""]),
      ),
    (a.perguntas_de_revisao || []).length &&
      o.push(
        "## Perguntas de revisão",
        "",
        ...a.perguntas_de_revisao.map((n, r) => `${r + 1}. ${n}`),
        "",
      ),
    o.push(
      "---",
      "Resumo gerado por IA (Gemini) a partir do PDF. Pode haver imprecisões: confira no livro.",
    ),
    o.join(`
`)
  );
}
const rsArq = (e, t) =>
  String(e.t || "resumo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) +
  "-resumo." +
  t;
function rsBaixa(e, t, a) {
  const o = document.createElement("a");
  ((o.href = URL.createObjectURL(new Blob([t], { type: a }))),
    (o.download = e),
    document.body.appendChild(o),
    o.click(),
    setTimeout(() => {
      (URL.revokeObjectURL(o.href), o.remove());
    }, 2e3));
}
function rsHtmlImpressao(e, t) {
  const a = t.resultado || {},
    o = rsPartes(t),
    s = a.completo || {},
    n = new Date().toLocaleDateString("pt-BR"),
    r = mdHtml(
      rsMd(e, { resultado: a, longo: null })
        .split(
          `
`,
        )
        .slice(3)
        .filter((i) => !/^---$|Resumo gerado por IA/.test(i)).join(`
`),
    );
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(a.titulo || e.t)} — resumo</title><style>
@page{size:A4;margin:2.5cm 2.3cm}*{box-sizing:border-box}body{font:12pt/1.62 Georgia,'Times New Roman',serif;color:#111111;margin:0}
.capa{height:24cm;display:flex;flex-direction:column;justify-content:center;text-align:center;page-break-after:always}.capa h1{font-size:30pt;margin:0 0 8px}.capa .a{font-size:15pt;color:#444444}.capa .m{margin-top:40px;color:#666666;font-size:10.5pt}
h1{font-size:20pt}h2{font-size:17pt;margin:0 0 8px;page-break-after:avoid}h3{font-size:13.5pt;margin:16px 0 8px;page-break-after:avoid}h4,h5{font-size:12pt;margin:16px 0 4px}
p{margin:0 0 8px;text-align:justify;orphans:3;widows:3}li{margin:4px 0}blockquote{margin:8px 0;padding-left:12px;border-left:1px solid #999999;color:#333333}
.parte{page-break-before:always}.sum li{margin:4px 0}.nota{font-size:9.5pt;color:#666666;margin-top:32px}code{font-size:10.5pt}
@media screen{body{max-width:820px;margin:20px auto;padding:0 16px}}</style></head><body>
<div class="capa"><h1>${esc(a.titulo || e.t)}</h1><div class="a">${esc(a.autor || e.a || "")}</div><div class="m">Resumo capítulo a capítulo${s.paginas ? " · " + rsPagTxt(s.paginas) : ""}<br>Gerado por IA em ${n} a partir do PDF</div></div>
<h2>Sumário</h2><ol class="sum"><li>Visão geral</li>${o.map((i) => `<li>${esc(i.titulo)}</li>`).join("")}</ol>
<div class="parte"><h2>Visão geral</h2>${r}</div>
${o.map((i) => `<div class="parte">${mdHtml(i.texto)}</div>`).join("")}
<p class="nota">Resumo gerado por IA (Gemini) a partir do PDF enviado. Pode haver imprecisões: confira no livro.</p>
<script>window.onload=function(){setTimeout(function(){try{window.print()}catch(e){}},500)}<\/script></body></html>`;
}
function rsPdf(e, t) {
  const a = rsHtmlImpressao(e, t);
  let o = null;
  try {
    o = window.open(
      URL.createObjectURL(new Blob([a], { type: "text/html" })),
      "_blank",
    );
  } catch {}
  o
    ? window.toast &&
      toast('Na tela de impressão, escolha "Salvar como PDF".', 4e3)
    : (rsBaixa(rsArq(e, "html"), a, "text/html"),
      window.toast &&
        toast(
          "Baixei o arquivo .html: abra e use Imprimir → Salvar como PDF.",
          5e3,
        ));
}
function vPrompts() {
  const e = rspLista(),
    t = rspPref("def", "");
  return `<div class="card"><b>Prompt usado automaticamente</b><div class="sm mut" style="margin:4px 0 6px">Vale para os resumos gerados ao adicionar um livro. No livro você pode escolher outro na hora.</div><select data-ep="def">${rspOpts(t)}</select></div>
<div class="top" style="margin-top:12px"><h2 style="margin:0">Meus prompts (${e.length})</h2><button class="btn" data-ep="pnovo">+ Novo prompt</button></div>
${e.length ? e.map((a) => `<div class="card"><div class="top"><input data-epn="${a.id}" value="${esc(a.n)}" placeholder="Nome do prompt" style="flex:1;font-weight:600"><button class="x" data-ep="pdel" data-id="${a.id}">✕</button></div><textarea data-epx="${a.id}" rows="4" placeholder="O que a IA deve fazer" style="width:100%;margin-top:6px">${esc(a.x)}</textarea><div class="sm mut">${(a.x || "").length}/4000 caracteres${t === "u:" + a.id ? " · <b>usado automaticamente</b>" : ""}</div></div>`).join("") : '<p class="mut sm">Nenhum prompt ainda. Crie um ou copie um modelo abaixo.</p>'}
<h2 style="margin-top:16px">Modelos prontos</h2><div class="sm mut" style="margin-bottom:6px">Use direto no livro ou copie para editar do seu jeito.</div>
${RSP0.map((a, o) => `<div class="card"><div class="top"><b>${esc(a[0])}</b><button class="btn s" data-ep="pcop" data-id="${o}">Copiar</button></div><div class="sm" style="margin-top:4px">${esc(a[1])}</div></div>`).join("")}
<div class="sm mut" style="margin:10px 0">Dica: o prompt muda foco, profundidade e estilo do resumo. Ele não desliga as regras de fidelidade ao livro (a IA não inventa capítulos nem citações).</div>`;
}
(function () {
  const e = TraderStyles.slot("legacy-009");
  ((e.textContent = TraderStyles.css("legacy-009")), TraderStyles.mount(e));
  const t = vEstudos;
  ((vEstudos = function () {
    const o = `<div class="seg" style="margin:8px 0 10px"><button class="${ESV === "liv" ? "on" : ""}" data-ep="esv" data-id="liv">📚 Livros</button><button class="${ESV === "pr" ? "on" : ""}" data-ep="esv" data-id="pr">🧩 Meus prompts</button></div>`;
    if (ESV === "pr") return `<h1>Estudos</h1>${o}${vPrompts()}`;
    let s = t();
    s = s.replace("</p>", "</p>" + o);
    const n = "<span>✨ Gerar resumo com IA ao adicionar</span></label>";
    return (
      s.includes(n) &&
        (s = s.replace(
          n,
          () =>
            n +
            `<div class="g2" style="margin-top:6px"><label>Tipo<select id="rsmodo0"><option value="padrao"${rspPref("modo", "padrao") === "padrao" ? " selected" : ""}>📄 Padrão</option>${RS_PAGS.map((r) => `<option value="c${r}"${rspPref("modo", "padrao") === "completo" && +rspPref("pag", 100) === r ? " selected" : ""}>📚 Completo · ${r} pág. (com PDF)</option>`).join("")}</select></label><label>Prompt<select id="rsp0">${rspOpts(rspPref("def", ""))}</select></label></div>`,
        )),
      (S.books || []).forEach((r) => {
        const i = RS.jobs[r.id];
        if (
          !i ||
          i.modo !== "completo" ||
          !rsPend(i) ||
          !i.progresso ||
          !i.progresso.partes
        )
          return;
        const l = rsChip(i);
        s = s.replace(
          `<div class="sm" style="margin-top:2px">${l}</div>`,
          () =>
            `<div class="sm" style="margin-top:2px">📚 ${i.progresso.prontas}/${i.progresso.partes} partes · ${rsPagTxt(i.progresso.paginas)}</div>`,
        );
      }),
      s
    );
  }),
    document.addEventListener(
      "click",
      (o) => {
        if (!o.target.closest('[data-a="addbook"]')) return;
        const s = (document.getElementById("rsmodo0") || {}).value || "padrao",
          n = (document.getElementById("rsp0") || {}).value || "",
          r = document.getElementById("rspdf"),
          i = r && r.files && r.files[0],
          l = s[0] === "c" && !!i;
        (s[0] === "c" &&
          !i &&
          window.toast &&
          toast(
            "Resumo completo precisa do PDF: vou fazer o resumo padrão.",
            4500,
          ),
          (RSNEXT = {
            modo: l ? "completo" : "padrao",
            paginas: l ? +s.slice(1) : 100,
            prompt: rspTexto(n),
          }),
          setTimeout(() => {
            RSNEXT = null;
          }, 3e3));
      },
      !0,
    ),
    document.addEventListener("change", (o) => {
      const s = o.target;
      if (s.id === "rspsel") {
        const n = document.getElementById("rsptx");
        n && (n.value = rspTexto(s.value));
      } else if (s.id === "rsxsel") {
        const n = document.getElementById("rsxtx");
        n && (n.value = rspTexto(s.value));
      } else if (s.dataset && s.dataset.ep === "def")
        (rspSetPref("def", s.value), render());
      else if (s.dataset && s.dataset.epn) {
        const n = rspLista().map((r) =>
          r.id === s.dataset.epn
            ? { ...r, n: s.value.trim().slice(0, 60), u: Date.now() }
            : r,
        );
        rspSet(n);
      } else if (s.dataset && s.dataset.epx) {
        const n = rspLista().map((r) =>
          r.id === s.dataset.epx
            ? { ...r, x: s.value.slice(0, 4e3), u: Date.now() }
            : r,
        );
        (rspSet(n), render());
      }
    }),
    document.addEventListener("click", async (o) => {
      const s = o.target.closest("[data-ep]");
      if (!s || s.tagName === "SELECT") return;
      const n = s.dataset.ep,
        r = s.dataset.id,
        i = (S.books || []).find((d) => d.id === r);
      if (n === "esv") {
        ((ESV = r), render(), scrollTo(0, 0));
        return;
      }
      if (n === "modo") {
        (rspSetPref("modo", r), render());
        return;
      }
      if (n === "pag") {
        (rspSetPref("pag", +r), render());
        return;
      }
      if (n === "pnovo") {
        (rspSet([
          { id: uid(), n: "Novo prompt", x: "", u: Date.now() },
          ...rspLista(),
        ]),
          render(),
          setTimeout(() => {
            const d = document.querySelector("[data-epx]");
            d && d.focus();
          }, 50));
        return;
      }
      if (n === "pcop") {
        const d = RSP0[+r];
        (rspSet([
          { id: uid(), n: d[0], x: d[1], u: Date.now() },
          ...rspLista(),
        ]),
          window.toast && toast("Copiado para Meus prompts"),
          render());
        return;
      }
      if (n === "pdel") {
        if (!confirm("Apagar este prompt?")) return;
        (rspSet(rspLista().filter((d) => d.id !== r)),
          rspPref("def", "") === "u:" + r && rspSetPref("def", ""),
          render());
        return;
      }
      if (!i) return;
      const l = RS.jobs[i.id];
      if (n === "gen") {
        const d = document.getElementById("rspdf2"),
          c = (d && d.files && d.files[0]) || null,
          p = rsPdfErro(c);
        if (p) {
          window.toast && toast(p, 5e3);
          return;
        }
        const u = rspPref("modo", "padrao");
        if (u === "completo" && !c) {
          window.toast &&
            toast("Anexe o PDF do livro para o resumo completo.", 4500);
          return;
        }
        const m = ((document.getElementById("rsptx") || {}).value || "").trim();
        if (
          l &&
          RS.novo === i.id &&
          !confirm("Gerar um novo resumo? O atual será substituído.")
        )
          return;
        ((RS.novo = null),
          rsCriar(
            i,
            ((document.getElementById("rsfoco") || {}).value || "").trim(),
            c,
            { modo: u, paginas: +rspPref("pag", 100), prompt: m },
          ));
      } else if (n === "novo") {
        ((RS.novo = i.id), render());
        const d = document.getElementById("rs-card");
        d && d.scrollIntoView({ block: "start" });
      } else if (n === "cancnovo") ((RS.novo = null), render());
      else if (n === "ler" || n === "pdf" || n === "md") {
        s.disabled = !0;
        const d = await rsFull(i, rsPend(l) || (l && l.status === "erro"));
        if (((s.disabled = !1), !d)) return;
        n === "ler"
          ? rlAbre(i, d, 0)
          : n === "md"
            ? rsBaixa(rsArq(i, "md"), rsMd(i, d), "text/markdown")
            : rsPdf(i, d);
      } else if (n === "carrega") (await rsFull(i, 1), render());
      else if (n === "extra") {
        const d = ((document.getElementById("rsxtx") || {}).value || "").trim(),
          c = document.getElementById("rsxsel");
        if (d.length < 3) {
          window.toast && toast("Escreva o prompt ou escolha um modelo.");
          return;
        }
        const p =
          c && c.value ? c.options[c.selectedIndex].text : d.slice(0, 50);
        ((RS.extraBusy[i.id] = 1), render());
        try {
          const u = await rsFn("extra", { id: l.id, titulo: p, prompt: d }),
            m = RS.full[i.id] || (await rsFull(i, 1));
          (m && (m.extras = u.extras),
            window.toast && toast("Resposta pronta ✓"));
        } catch (u) {
          window.toast && toast(u.message, 5e3);
        }
        (delete RS.extraBusy[i.id], render());
      } else if (n === "xdel") {
        if (!confirm("Apagar esta resposta?")) return;
        try {
          const d = await rsFn("extra_apagar", { id: l.id, eid: s.dataset.x });
          RS.full[i.id] && (RS.full[i.id].extras = d.extras);
        } catch (d) {
          window.toast && toast(d.message, 4e3);
        }
        render();
      } else if (n === "xnote" || n === "xcopy") {
        const d = ((RS.full[i.id] || {}).extras || []).find(
          (c) => c.id === s.dataset.x,
        );
        if (!d) return;
        if (n === "xcopy")
          try {
            (await navigator.clipboard.writeText(d.texto),
              window.toast && toast("Copiado"));
          } catch {
            window.toast && toast("Não consegui copiar.");
          }
        else
          ((i.notes ?? (i.notes = [])).unshift({
            id: uid(),
            t: "IA: " + d.titulo,
            p: "",
            x: d.texto,
            u: Date.now(),
          }),
            save(),
            render(),
            window.toast && toast("Salvo nas anotações"));
      }
    }));
  const a = vLivro;
  vLivro = function () {
    const o = a(),
      s = (S.books || []).find((r) => r.id === BID),
      n = s && RS.jobs[s.id];
    return (
      n &&
        n.status === "concluido" &&
        !RS.full[s.id] &&
        !RS.fullBusy &&
        SESS &&
        Date.now() - (RS.fullTry[s.id] || 0) > 6e4 &&
        (RS.fullTry[s.id] = Date.now()) &&
        setTimeout(() => {
          rsFull(s).then((r) => {
            r && tab === "livro" && BID === s.id && rsRefresh();
          });
        }, 0),
      o
    );
  };
})();
var QZ = { n: 30, nivel: "progressivo", parte: -1, busy: {}, run: null };
const QZ_NIV = ["fácil", "média", "difícil"],
  QZ_COR = { fácil: "var(--g)", média: "#a57d34", difícil: "var(--r)" },
  qzLista = (e) =>
    ((RS.full[e.id] || {}).extras || []).filter((t) => t.tipo === "quiz"),
  qzHist = (e) => (S.ax || {})["rsq." + e.id] || [];
function qzStats(e, t) {
  const a = qzHist(e).filter((s) => s.q === t && !s.parcial);
  if (!a.length) return "";
  const o = a.reduce((s, n) => (n.a / n.t > s.a / s.t ? n : s));
  return `Melhor: <b>${o.a}/${o.t}</b> · ${a.length} tentativa${a.length > 1 ? "s" : ""}`;
}
function qzCard(e, t) {
  const a = RS.full[e.id],
    o = rsPartes(a),
    s = qzLista(e),
    n = QZ.busy[e.id],
    r = (i, l, d) =>
      `<button class="${QZ[i] == l ? "on" : ""}" data-qz="set" data-k="${i}" data-v="${l}" data-id="${e.id}">${d}</button>`;
  return `<div class="card" style="margin:10px 0"><div class="top"><b>🎯 Simulado</b>${s.length ? `<span class="sm mut">${s.length} gerado${s.length > 1 ? "s" : ""}</span>` : ""}</div>
<div class="sm mut" style="margin:4px 0 8px">A IA monta perguntas de múltipla escolha a partir deste resumo, das mais leves às mais difíceis. Você responde aqui e vê a explicação de cada uma.</div>
<div class="sm" style="margin-bottom:4px">Quantidade</div><div class="seg" style="margin-bottom:8px">${r("n", 10, "10")}${r("n", 20, "20")}${r("n", 30, "30")}</div>
<div class="sm" style="margin-bottom:4px">Dificuldade</div><div class="seg" style="margin-bottom:8px">${r("nivel", "progressivo", "Fácil → difícil")}${r("nivel", "dificil", "Só difíceis")}</div>
${o.length ? `<label>Assunto<select data-qz="parte" data-id="${e.id}"><option value="-1">Livro inteiro</option>${o.map((i, l) => `<option value="${l}"${QZ.parte === l ? " selected" : ""}>${esc(i.titulo)}</option>`).join("")}</select></label>` : ""}
<button class="btn" style="width:100%;margin-top:8px" data-qz="gen" data-id="${e.id}"${n ? " disabled" : ""}>${n ? "⏳ Montando as perguntas… (até 2 min)" : "✨ Gerar " + QZ.n + " perguntas"}</button>
${a ? s.map((i) => `<div style="display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;padding:8px 0;border-top:1px solid var(--bd);margin-top:8px"><div style="min-width:0"><div class="sm"><b>${esc(i.titulo)}</b></div><div class="sm mut">${new Date(i.criado).toLocaleDateString("pt-BR")}${qzStats(e, i.id) ? " · " + qzStats(e, i.id) : " · ainda não respondido"}</div></div><button class="btn" data-qz="play" data-id="${e.id}" data-q="${i.id}">▶️ Responder</button><button class="x" data-qz="del" data-id="${e.id}" data-q="${i.id}" aria-label="Apagar simulado">✕</button></div>`).join("") : `<button class="btn s" style="margin-top:8px" data-ep="carrega" data-id="${e.id}">Ver simulados anteriores</button>`}
</div>`;
}
function qzAbre(e, t, a) {
  QZ.run = {
    b: e,
    quiz: t,
    ordem: a || t.perguntas.map((s, n) => n),
    i: 0,
    resp: {},
    parcial: !!a,
    fim: 0,
  };
  let o = document.getElementById("qz");
  (o ||
    ((o = document.createElement("div")),
    (o.id = "qz"),
    document.body.appendChild(o)),
    (document.body.style.overflow = "hidden"),
    qzDesenha());
}
function qzFecha() {
  const e = document.getElementById("qz");
  (e && e.remove(),
    (QZ.run = null),
    (document.body.style.overflow = ""),
    render());
}
function qzResultado() {
  const e = QZ.run,
    t = e.quiz.perguntas,
    a = {};
  let o = 0;
  return (
    e.ordem.forEach((s) => {
      const n = t[s],
        r = e.resp[s] === n.correta;
      ((a[n.nivel] = a[n.nivel] || [0, 0]),
        a[n.nivel][1]++,
        r && (a[n.nivel][0]++, o++));
    }),
    {
      a: o,
      t: e.ordem.length,
      por: a,
      erradas: e.ordem.filter((s) => e.resp[s] !== t[s].correta),
    }
  );
}
function qzDesenha() {
  const e = QZ.run;
  if (!e) return;
  const t = document.getElementById("qz");
  if (!t) return;
  const a = e.quiz.perguntas,
    o = e.ordem.length;
  if (e.fim) {
    const c = qzResultado(),
      p = Math.round((c.a / c.t) * 100),
      u = p >= 80 ? "var(--g)" : p >= 60 ? "#a57d34" : "var(--r)",
      m =
        p >= 90
          ? "Excelente, você domina o conteúdo."
          : p >= 70
            ? "Bom resultado. Revise as que errou."
            : p >= 50
              ? "Na média. Vale reler os capítulos das erradas."
              : "Releia o resumo e tente de novo daqui a alguns dias.";
    t.innerHTML = `<div class="qz-top"><button class="btn s" data-qz="x">✕</button><b style="flex:1">Resultado</b></div><div class="qz-body">
<div style="text-align:center;margin:10px 0 16px"><div style="font-size:48px;font-weight:800;color:${u}">${c.a}/${c.t}</div><div class="mut">${p}% de acerto · ${m}</div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${QZ_NIV.map(
      (f) => {
        const x = c.por[f];
        return `<div class="card" style="margin:0;text-align:center;padding:10px"><div class="sm" style="color:${QZ_COR[f]};font-weight:700">${f}</div><b style="font-size:20px">${x ? x[0] + "/" + x[1] : "–"}</b></div>`;
      },
    ).join("")}</div>
${
  c.erradas.length
    ? `<h3 style="margin:18px 0 6px">Para revisar (${c.erradas.length})</h3>${c.erradas
        .map((f) => {
          const x = a[f];
          return `<div class="card" style="padding:10px"><div class="sm" style="color:${QZ_COR[x.nivel]}">${x.nivel}${x.tema ? " · " + esc(x.tema) : ""}</div><div style="margin:4px 0"><b>${esc(x.pergunta)}</b></div><div class="sm r">Você: ${e.resp[f] == null ? "(sem resposta)" : esc(x.alternativas[e.resp[f]])}</div><div class="sm g">Certa: ${esc(x.alternativas[x.correta])}</div>${x.explicacao ? `<div class="sm mut" style="margin-top:4px">${esc(x.explicacao)}</div>` : ""}</div>`;
        })
        .join("")}`
    : '<div class="card" style="text-align:center">🏆 Nenhum erro!</div>'
}
<div style="display:grid;gap:8px;margin:14px 0 40px">${c.erradas.length ? `<button class="btn" data-qz="erradas">🔁 Refazer só as ${c.erradas.length} que errei</button><button class="btn s" data-qz="notas">📝 Salvar as erradas nas anotações do livro</button>` : ""}<button class="btn s" data-qz="tudo">Refazer tudo</button><button class="btn s" data-qz="x">Fechar</button></div></div>`;
    return;
  }
  const s = e.ordem[e.i],
    n = a[s],
    r = e.resp[s],
    i = r != null,
    l = "ABCD",
    d = e.ordem
      .slice(0, e.i + (i ? 1 : 0))
      .filter((c) => e.resp[c] === a[c].correta).length;
  t.innerHTML = `<div class="qz-top"><button class="btn s" data-qz="x">✕</button><div style="flex:1;min-width:0"><div class="sm"><b>${e.i + 1}</b> de ${o}${e.parcial ? " · revisão" : ""} <span class="mut">· ${d} certa${d === 1 ? "" : "s"}</span></div><div style="height:4px;border-radius:2px;background:var(--bd);margin-top:4px;overflow:hidden"><div style="height:100%;width:${Math.round(((e.i + (i ? 1 : 0)) / o) * 100)}%;background:var(--ac)"></div></div></div></div>
<div class="qz-body"><div class="sm" style="margin-bottom:6px"><span style="color:${QZ_COR[n.nivel]};font-weight:700">● ${n.nivel}</span>${n.tema ? ' <span class="mut">· ' + esc(n.tema) + "</span>" : ""}</div>
<div style="font-size:18px;font-weight:600;line-height:1.4;margin-bottom:14px">${esc(n.pergunta)}</div>
${n.alternativas
  .map((c, p) => {
    const u = i
      ? p === n.correta
        ? "border-color:var(--g);background:color-mix(in srgb,var(--g) 18%,transparent)"
        : p === r
          ? "border-color:var(--r);background:color-mix(in srgb,var(--r) 18%,transparent)"
          : "opacity:.55"
      : "";
    return `<button class="qz-op" data-qz="r" data-i="${p}" ${i ? "disabled" : ""} style="${u}"><b>${l[p]}</b><span>${esc(c)}</span>${i && p === n.correta ? " ✓" : i && p === r ? " ✗" : ""}</button>`;
  })
  .join("")}
${i ? `<div class="card" style="margin-top:10px;border-left:3px solid ${r === n.correta ? "var(--g)" : "var(--r)"}"><b>${r === n.correta ? "✅ Certo!" : "❌ Não foi dessa vez."}</b>${n.explicacao ? `<div class="sm" style="margin-top:4px;line-height:1.5">${esc(n.explicacao)}</div>` : ""}</div><button class="btn" style="width:100%;margin:10px 0 40px" data-qz="prox">${e.i < o - 1 ? "Próxima ›" : "Ver resultado"}</button>` : ""}
</div>`;
}
function qzSalvaTentativa() {
  const e = QZ.run,
    t = qzResultado(),
    a = qzHist(e.b).slice(-29);
  (a.push({
    q: e.quiz.id,
    d: Date.now(),
    a: t.a,
    t: t.t,
    parcial: e.parcial ? 1 : 0,
    n: Object.fromEntries(Object.entries(t.por)),
  }),
    ((S.ax ?? (S.ax = {}))["rsq." + e.b.id] = a),
    save());
}
(function () {
  const e = TraderStyles.slot("legacy-010");
  ((e.textContent = TraderStyles.css("legacy-010")), TraderStyles.mount(e));
  const t = rsCard;
  ((rsCard = function (a) {
    const o = t(a),
      s = RS.jobs[a.id];
    if (!s || s.status !== "concluido" || RS.novo === a.id) return o;
    const n = o.indexOf(
      '<div class="card" style="margin:10px 0"><div class="top"><b>🧩 Perguntar ao resumo</b>',
    );
    return n < 0 ? o + qzCard(a, s) : o.slice(0, n) + qzCard(a, s) + o.slice(n);
  }),
    document.addEventListener("change", (a) => {
      const o = a.target.closest('[data-qz="parte"]');
      o && (QZ.parte = +o.value);
    }),
    document.addEventListener("keydown", (a) => {
      QZ.run && a.key === "Escape" && qzFecha();
    }),
    document.addEventListener("click", async (a) => {
      var o;
      const s = a.target.closest("[data-qz]");
      if (!s || s.tagName === "SELECT") return;
      const n = s.dataset.qz,
        r = QZ.run;
      if (n === "x") return qzFecha();
      if (n === "r" && r) {
        const d = r.ordem[r.i];
        if (r.resp[d] != null) return;
        ((r.resp[d] = +s.dataset.i),
          navigator.vibrate &&
            navigator.vibrate(
              r.resp[d] === r.quiz.perguntas[d].correta ? 15 : [30, 40, 30],
            ),
          qzDesenha());
        return;
      }
      if (n === "prox" && r) {
        (r.i < r.ordem.length - 1 ? r.i++ : ((r.fim = 1), qzSalvaTentativa()),
          qzDesenha());
        const d = document.querySelector("#qz .qz-body");
        d && (d.scrollTop = 0);
        return;
      }
      if (n === "erradas" && r) {
        const d = qzResultado().erradas;
        qzAbre(r.b, r.quiz, d);
        return;
      }
      if (n === "tudo" && r) {
        qzAbre(r.b, r.quiz);
        return;
      }
      if (n === "notas" && r) {
        const d = qzResultado(),
          c = r.quiz.perguntas,
          p = d.erradas.map((u, m) => {
            const f = c[u];
            return `${m + 1}. [${f.nivel}] ${f.pergunta}
   Certa: ${f.alternativas[f.correta]}${
     f.explicacao
       ? `
   Por quê: ` + f.explicacao
       : ""
   }`;
          }).join(`

`);
        (((o = r.b).notes ?? (o.notes = [])).unshift({
          id: uid(),
          t: `Simulado: ${d.erradas.length} para revisar (${d.a}/${d.t})`,
          p: "",
          x: p,
          u: Date.now(),
        }),
          save(),
          window.toast && toast("Salvo nas anotações do livro"));
        return;
      }
      const i = (S.books || []).find((d) => d.id === s.dataset.id);
      if (!i) return;
      const l = RS.jobs[i.id];
      if (n === "set") {
        ((QZ[s.dataset.k] = s.dataset.k === "n" ? +s.dataset.v : s.dataset.v),
          render());
        return;
      }
      if (n === "gen") {
        if (!l) return;
        ((QZ.busy[i.id] = 1), render());
        try {
          const d = await rsFn("quiz", {
              id: l.id,
              n: QZ.n,
              nivel: QZ.nivel,
              parte: QZ.parte,
            }),
            c = RS.full[i.id] || (await rsFull(i, 1));
          (c && (c.extras = d.extras),
            delete QZ.busy[i.id],
            render(),
            window.toast &&
              toast("Simulado pronto: " + d.item.n + " perguntas"),
            qzAbre(i, d.item));
        } catch (d) {
          (delete QZ.busy[i.id],
            render(),
            window.toast && toast(d.message, 5e3));
        }
        return;
      }
      if (n === "play") {
        const d = qzLista(i).find((c) => c.id === s.dataset.q);
        d && qzAbre(i, d);
        return;
      }
      if (n === "del") {
        if (!confirm("Apagar este simulado?")) return;
        try {
          const d = await rsFn("extra_apagar", { id: l.id, eid: s.dataset.q });
          RS.full[i.id] && (RS.full[i.id].extras = d.extras);
        } catch (d) {
          window.toast && toast(d.message, 4e3);
        }
        render();
      }
    }));
})();
const JR = { data: ls.get("diario-jr"), busy: 0, err: "" },
  jrN = (e, t = 2) =>
    e == null || !isFinite(e)
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        }),
  jrNum = (e) => {
    const t = parseFloat(
      String(e || "")
        .trim()
        .replace(/\./g, "")
        .replace(",", "."),
    );
    return isFinite(t) ? t : null;
  };
var jrPanelHtml, jrPaint, jrLoad, vCot, cotAfter;
const jrPU = (e, t) => 1e5 / Math.pow(1 + e / 100, t / 252),
  jrTaxa = (e, t) => (Math.pow(1e5 / e, 252 / t) - 1) * 100,
  jrFwd = (e, t, a, o) =>
    (Math.pow(
      Math.pow(1 + a / 100, o / 252) / Math.pow(1 + e / 100, t / 252),
      252 / (o - t),
    ) -
      1) *
    100;
function jrEaster(e) {
  const t = e % 19,
    a = Math.floor(e / 100),
    o = e % 100,
    s = Math.floor(a / 4),
    n = a % 4,
    r = Math.floor((a + 8) / 25),
    i = Math.floor((a - r + 1) / 3),
    l = (19 * t + a - s - i + 15) % 30,
    d = Math.floor(o / 4),
    c = o % 4,
    p = (32 + 2 * n + 2 * d - l - c) % 7,
    u = Math.floor((t + 11 * l + 22 * p) / 451),
    m = Math.floor((l + p - 7 * u + 114) / 31),
    f = ((l + p - 7 * u + 114) % 31) + 1;
  return new Date(e, m - 1, f);
}
const jrHol = {};
function jrHolidays(e) {
  if (jrHol[e]) return jrHol[e];
  const t = jrEaster(e),
    a = new Set(),
    o = (s) => s.getFullYear() + "-" + s.getMonth() + "-" + s.getDate();
  return (
    [
      [0, 1],
      [3, 21],
      [4, 1],
      [8, 7],
      [9, 12],
      [10, 2],
      [10, 15],
      [10, 20],
      [11, 25],
    ].forEach(([s, n]) => a.add(e + "-" + s + "-" + n)),
    [-48, -47, -2, 60].forEach((s) => {
      const n = new Date(t);
      (n.setDate(n.getDate() + s), a.add(o(n)));
    }),
    (jrHol[e] = a)
  );
}
const jrBD = (e) => {
  const t = e.getDay();
  return (
    t !== 0 &&
    t !== 6 &&
    !jrHolidays(e.getFullYear()).has(
      e.getFullYear() + "-" + e.getMonth() + "-" + e.getDate(),
    )
  );
};
function jrVenc(e, t) {
  const a = new Date(e, t, 1);
  for (; !jrBD(a); ) a.setDate(a.getDate() + 1);
  return a;
}
function jrDu(e) {
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  let a = 0;
  const o = new Date(e);
  for (o.setHours(12, 0, 0, 0); t < o; )
    (jrBD(t) && a++, t.setDate(t.getDate() + 1));
  return a;
}
function jrDuMes(e) {
  const t = /^(\d{4})-(\d{2})$/.exec(e || "");
  return t ? jrDu(jrVenc(+t[1], +t[2] - 1)) : null;
}
const jrCod = "FGHJKMNQUVXZ",
  jrContrato = (e) => {
    const t = /^(\d{4})-(\d{2})$/.exec(e || "");
    return t ? "DI1" + jrCod[+t[2] - 1] + String(t[1]).slice(2) : "";
  };
function jrCalc() {
  const e = document.getElementById("jr-o1"),
    t = document.getElementById("jr-o2"),
    a = (o) => jrNum((document.getElementById(o) || {}).value);
  if (e) {
    const o = a("jr-t"),
      s = a("jr-du"),
      n = a("jr-pu");
    let r = "";
    if (s > 0 && n > 0)
      r = `Taxa implícita: <b>${jrN(jrTaxa(n, s), 3)}% a.a.</b>`;
    else if (s > 0 && o != null) {
      const i = jrPU(o, s),
        l = jrPU(o + 0.1, s);
      r = `PU: <b>R$ ${jrN(i, 2)}</b><br>Se a taxa subir 0,10 ponto, o PU cai <b>R$ ${jrN(i - l, 2)}</b> por contrato. Quem está comprado em taxa ganha esse valor, quem está vendido perde.`;
    } else
      r =
        '<span class="mut">Preencha taxa e dias úteis, ou PU e dias úteis.</span>';
    e.innerHTML = r;
  }
  if (t) {
    const o = a("jr-t1"),
      s = a("jr-d1"),
      n = a("jr-t2"),
      r = a("jr-d2");
    t.innerHTML =
      o != null && n != null && s > 0 && r > s
        ? `Taxa a termo entre os dois vencimentos: <b>${jrN(jrFwd(o, s, n, r), 3)}% a.a.</b>`
        : '<span class="mut">Preencha as duas taxas e os dias úteis (o segundo prazo tem que ser maior).</span>';
  }
}
let JRO = ls.get("diario-jr-open") || "sel";
function vJuros() {
  const e = (n, r, i) =>
      `<details class="card" data-jrs="${n}"${JRO === n ? " open" : ""} style="margin-top:8px"><summary><b>${r}</b></summary><div class="sm" style="margin-top:8px;line-height:1.5">${i}</div></details>`,
    t = (n) => `<p style="margin:8px 0">${n}</p>`,
    a = new Date().getFullYear() + 1,
    o = a + "-01",
    s = jrDuMes(o);
  return `<h1>Juros e DI</h1><div class="card"><div class="top"><b>Painel de juros</b><button class="btn s" data-mk="jr" aria-label="Atualizar">↻</button></div><div id="jrp" style="margin-top:8px">${jrPanelHtml()}</div></div>
${e("sel", "1. Selic, CDI e o Copom", t("A <b>Selic meta</b> é a taxa básica de juros da economia. Quem decide é o <b>Copom</b>, o comitê do Banco Central. Ele se reúne <b>8 vezes por ano</b>, em dois dias, e o resultado sai na quarta-feira à noite.") + t("A <b>Selic over</b> (ou efetiva) é a taxa que de fato se paga nos empréstimos de um dia entre bancos com títulos públicos. Ela fica colada na meta, em geral uns 0,10 ponto abaixo. O <b>CDI</b> é parecido: é a taxa dos empréstimos de um dia entre bancos, sem lastro em título público, e anda praticamente junto com a Selic.") + t("<b>Por que o Copom mexe nela?</b> O objetivo é manter a inflação perto da meta (hoje 3% ao ano, com tolerância de 1,5 ponto para cima ou para baixo). Inflação alta: o BC sobe os juros, o crédito encarece, o consumo esfria e os preços perdem força. Economia fraca e inflação sob controle: ele pode cortar.") + t("<b>Efeito nos mercados (tendência, não regra):</b> juros altos deixam a renda fixa mais atraente e pressionam ações de empresas endividadas e sensíveis a crédito, como construção e varejo. Juros em queda costumam ajudar a bolsa e essas empresas."))}
${e("real", "2. Juro real", t("Juro real é o que sobra do juro depois de descontar a inflação. A conta é <b>(1 + Selic) ÷ (1 + inflação) − 1</b>.") + t("O painel acima usa o IPCA dos últimos 12 meses (juro real <b>ex-post</b>). O mercado também olha o juro real <b>ex-ante</b>, que usa a inflação esperada para os próximos 12 meses (pesquisa Focus). É esse que mostra o quanto a política está apertada ou frouxa."))}
${e("di", "3. O que é o DI futuro (DI1)", t("É um contrato da B3 que negocia a <b>taxa média do DI (CDI) entre hoje e o vencimento</b>. A cotação do contrato é uma <b>taxa de juros efetiva ao ano, base 252 dias úteis</b>.") + t("O contrato vale <b>R$ 100.000 no vencimento</b>. Antes disso, o valor é o <b>PU</b> (preço unitário), que é R$ 100.000 trazidos a valor presente pela taxa: <b>PU = 100.000 ÷ (1 + taxa)^(dias úteis ÷ 252)</b>.") + t("<b>Taxa e PU andam em sentidos opostos.</b> Taxa sobe, PU cai. Por isso se diz <b>comprado em taxa</b> (ganha se os juros sobem) e <b>vendido em taxa</b> (ganha se os juros caem).") + t("<b>Vencimentos:</b> o contrato vence no 1º dia útil do mês. As letras dos meses são F (jan), G (fev), H (mar), J (abr), K (mai), M (jun), N (jul), Q (ago), U (set), V (out), X (nov) e Z (dez). Exemplo: <b>DI1F27</b> = vence em janeiro de 2027.") + t("O resultado é ajustado todo dia, então ganhos e perdas entram na conta diariamente. Bancos e empresas usam para se proteger de juros, e fundos usam para apostar na direção deles."))}
${e("curva", "4. Como ler a curva de juros futuros", t("Cada vencimento do DI1 é um ponto (<b>vértice</b>) da curva. A taxa de um vértice é, aproximadamente, a <b>média do CDI que o mercado espera até aquela data</b>, mais um prêmio de risco.") + t("<b>Vértices curtos</b> (próximos meses) refletem o que o mercado espera do próximo Copom. <b>Vértices longos</b> (2 a 5 anos) refletem inflação futura, risco fiscal e juros lá fora (os Treasuries dos EUA).") + t("<b>Curva inclinada para cima:</b> taxas longas maiores que as curtas. <b>Curva invertida:</b> juros altos hoje e o mercado esperando cortes. O que importa para o dia a dia é a <b>variação</b>: DI subindo (taxa subindo) pressiona o índice, e DI caindo costuma aliviar.") + t("<b>Taxa a termo:</b> dá para extrair a taxa que o mercado projeta <i>entre</i> dois vértices. Use a calculadora logo abaixo."))}
${e("move", "5. O que move os DIs", '<ul style="margin:8px 0 0 18px;padding:0"><li>Decisão e comunicado do Copom, e a ata uma semana depois</li><li>IPCA e prévias de inflação (a surpresa em relação ao esperado é o que mexe)</li><li>Relatório Focus, toda segunda-feira de manhã</li><li>Risco fiscal: contas do governo, arcabouço, gastos</li><li>Juros nos EUA: Fed e rendimento do Treasury de 10 anos</li><li>Dólar, petróleo e atividade econômica</li></ul>')}
${e(
  "calc",
  "6. Calculadora: taxa, PU e dias úteis",
  t(
    "Escolha o mês de vencimento (o app estima os dias úteis) ou digite os dias úteis você mesmo.",
  ) +
    `<label>Vencimento (mês)<input type="month" id="jr-mes" value="${o}"></label><div class="sm mut" id="jr-cod" style="margin:-4px 0 6px">${esc(jrContrato(o))}</div>
<div class="g2"><label>Dias úteis<input id="jr-du" inputmode="numeric" value="${s ?? ""}"></label><label>Taxa (% a.a.)<input id="jr-t" inputmode="decimal" placeholder="ex.: 14,20"></label></div>
<label>PU (opcional, para achar a taxa)<input id="jr-pu" inputmode="decimal" placeholder="ex.: 85.000,00"></label>
<div class="card" id="jr-o1" style="margin-top:8px"><span class="mut">Preencha taxa e dias úteis.</span></div>
<div class="sm mut" style="margin-top:6px">Os dias úteis são uma estimativa (fins de semana e feriados nacionais). Confira com a B3 antes de operar.</div>`,
)}
${e(
  "fwd",
  "7. Calculadora: taxa a termo entre dois vértices",
  t(
    "Exemplo: se o DI1F27 está em 14,0% com 80 dias úteis e o DI1F28 em 13,0% com 330 dias úteis, a calculadora mostra a taxa embutida entre esses dois vencimentos.",
  ) +
    `<div class="g2"><label>Taxa 1 (% a.a.)<input id="jr-t1" inputmode="decimal" placeholder="14,00"></label><label>Dias úteis 1<input id="jr-d1" inputmode="numeric" placeholder="80"></label></div>
<div class="g2"><label>Taxa 2 (% a.a.)<input id="jr-t2" inputmode="decimal" placeholder="13,00"></label><label>Dias úteis 2<input id="jr-d2" inputmode="numeric" placeholder="330"></label></div>
<div class="card" id="jr-o2" style="margin-top:8px"><span class="mut">Preencha os campos.</span></div>`,
)}
${e("gloss", "8. Glossário rápido", '<ul style="margin:8px 0 0 18px;padding:0"><li><b>Copom:</b> comitê do Banco Central que define a Selic</li><li><b>Selic meta:</b> taxa básica decidida pelo Copom</li><li><b>CDI:</b> taxa dos empréstimos de um dia entre bancos, quase igual à Selic over</li><li><b>DI1:</b> contrato futuro da taxa de DI na B3</li><li><b>PU:</b> preço unitário, o valor do contrato em reais</li><li><b>Vértice:</b> um vencimento da curva de juros</li><li><b>Dias úteis (du):</b> contagem usada na base 252</li><li><b>Prêmio de risco:</b> parte da taxa que remunera incerteza, além da expectativa de Selic</li><li><b>Focus:</b> pesquisa semanal do BC com as projeções de analistas</li><li><b>Carry:</b> ganho de manter uma posição pela diferença de juros</li></ul>')}
<div class="sm mut" style="margin:12px 0">Conteúdo educativo, não é recomendação de investimento.</div>`;
}
function jrAfter() {
  (jrPaint(), jrLoad(!1), jrCalc());
}
const j2d = (e) => {
    const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(e || "");
    return t ? t[3] + "/" + t[2] : (e || "").slice(0, 5);
  },
  j2pb = (e) =>
    e == null
      ? "–"
      : (e > 0 ? "+" : "") +
        String(Math.round(e * 10) / 10).replace(".", ",") +
        " pb",
  j2pc = (e, t = 2) => (e == null || !isFinite(e) ? "–" : jrN(e, t) + "%"),
  j2tv = (e) =>
    "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(e),
  J2META = 3,
  J2TETO = 4.5;
function j2dec(e, t) {
  if (e == null || t == null) return "";
  const a = Math.round((t - e) * 100);
  return a === 0
    ? "manutenção"
    : a < 0
      ? "corte de " + -a + " pb"
      : "alta de " + a + " pb";
}
jrPanelHtml = function () {
  const e = JR.data;
  if (!e)
    return `<div class="mut sm" style="padding:8px 0">${esc(JR.err || (JR.busy ? "Buscando dados do Banco Central…" : "Sem dados ainda."))}</div>`;
  const t = e.selic,
    a = e.focus || {},
    o = e.copom || {},
    s = new Date().getFullYear(),
    n = e.curva_info,
    r = (c, p, u, m) =>
      `<div class="card" style="margin:0;padding:10px"><span class="mut sm">${c}</span><div><b style="font-size:20px${m ? ";color:" + m : ""}">${p}</b></div><span class="mut sm" style="line-height:1.3;display:block">${u || ""}</span></div>`,
    i =
      t && t.completo
        ? t.mud_pb
          ? `${t.mud_pb < 0 ? "corte" : "alta"} de ${Math.abs(t.mud_pb)} pb em ${esc(t.desde)}`
          : `sem mudança desde ${esc(t.desde)}`
        : t
          ? "desde " + esc(t.desde)
          : "",
    l = e.ipca12
      ? e.ipca12.v > J2TETO
        ? "var(--r)"
        : e.ipca12.v > J2META
          ? "#a57d34"
          : "var(--g)"
      : "";
  let d = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
${r("Selic meta", t ? j2pc(t.v) : "–", i)}
${r("CDI · Selic over", e.cdi ? j2pc(e.cdi.v) : "–", (e.over ? "over " + j2pc(e.over.v) + " · " : "") + (e.cdi ? esc(e.cdi.d) : ""))}
${r("IPCA 12 meses", e.ipca12 ? j2pc(e.ipca12.v) : "–", (e.ipcaMes ? "no mês: " + j2pc(e.ipcaMes.v) + " (" + esc(e.ipcaMes.d.slice(3)) + ")" : "") + `<br>meta ${J2META}% · teto ${jrN(J2TETO, 1)}%`, l)}
${r("Juro real", e.real != null ? j2pc(e.real) : "–", "ex-post (Selic − IPCA 12m)" + (e.real_exante ? `<br>ex-ante <b>${j2pc(e.real_exante.v)}</b> (DI 1 ano − IPCA esperado)` : ""))}
</div>`;
  if (o.proxima) {
    const c = a.reuniao,
      p = c ? j2dec(t && t.v, c.mediana) : "",
      u = new Date(o.proxima.decisao + "T12:00:00");
    d += `<div class="card" style="margin:8px 0 0;padding:10px;border-left:3px solid var(--ac)"><div class="top"><b>🏛️ Próximo Copom</b><span class="sm mut">em ${o.proxima.dias} dia${o.proxima.dias === 1 ? "" : "s"}</span></div>
<div class="sm" style="margin-top:4px">${j2d(o.proxima.inicio)} e ${u.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · decisão na quarta à noite (~18h30) · ${o.restantes_ano > 1 ? o.restantes_ano + " reuniões até o fim do ano" : "última do ano"}</div>
${c ? `<div class="sm" style="margin-top:4px">Focus espera <b>${j2pc(c.mediana)}</b>${p ? " → <b>" + p + "</b>" : ""}</div>` : ""}
${n && n.curto_vs_cdi_pb != null ? `<div class="sm" style="margin-top:4px">Curva: ${esc(n.curto)} está <b>${j2pb(n.curto_vs_cdi_pb)}</b> ${n.curto_vs_cdi_pb < 0 ? "abaixo" : "acima"} do CDI → o mercado ${n.curto_vs_cdi_pb <= -15 ? "precifica cortes" : n.curto_vs_cdi_pb >= 15 ? "precifica altas" : "não precifica mudança grande"} até esse vencimento.</div>` : ""}</div>`;
  }
  if (a.selic || a.ipca) {
    const c = (p, u, m) =>
      `<tr><td>${p}</td><td style="text-align:right"><b>${j2pc(u)}</b></td><td style="text-align:right"><b>${j2pc(m)}</b></td></tr>`;
    d += `<div class="card" style="margin:8px 0 0;padding:10px"><div class="top"><b>📊 Focus (mediana do mercado)</b><span class="sm mut">${a.data ? j2d(a.data) : ""}</span></div>
<table class="sm" style="width:100%;margin-top:4px;border-collapse:collapse"><tr class="mut"><td></td><td style="text-align:right">fim de ${s}</td><td style="text-align:right">fim de ${s + 1}</td></tr>${c("Selic", a.selic && a.selic[s], a.selic && a.selic[s + 1])}${c("IPCA", a.ipca && a.ipca[s], a.ipca && a.ipca[s + 1])}</table>
${a.ipca12m ? `<div class="sm mut" style="margin-top:4px">IPCA esperado para os próximos 12 meses: <b>${j2pc(a.ipca12m.v)}</b></div>` : ""}</div>`;
  }
  if (e.ipcaMes && e.ipcaMes.hist && e.ipcaMes.hist.length > 2) {
    const c = e.ipcaMes.hist,
      p = Math.max(0.5, ...c.map((m) => Math.abs(m.v))),
      u = 100 / c.length;
    d += `<div class="card" style="margin:8px 0 0;padding:10px"><b class="sm">IPCA mês a mês</b><svg viewBox="0 0 100 34" preserveAspectRatio="none" style="width:100%;height:60px;margin-top:6px">${c
      .map((m, f) => {
        const x = (Math.abs(m.v) / p) * 15;
        return `<rect x="${f * u + u * 0.15}" y="${m.v >= 0 ? 17 - x : 17}" width="${u * 0.7}" height="${Math.max(0.4, x)}" fill="${m.v >= 0 ? "var(--r)" : "var(--g)"}" opacity=".8"><title>${esc(m.m)}: ${jrN(m.v)}%</title></rect>`;
      })
      .join(
        "",
      )}<line x1="0" x2="100" y1="17" y2="17" stroke="var(--bd)" stroke-width=".3"/></svg><div class="sm mut" style="display:flex;justify-content:space-between"><span>${esc(c[0].m)}</span><span>${esc(c[c.length - 1].m)}: ${j2pc(c[c.length - 1].v)}</span></div></div>`;
  }
  return (
    d +
    (JR.err
      ? `<div class="warn" style="margin-top:8px">${esc(JR.err)}</div>`
      : "") +
    `<div class="sm mut" style="margin-top:6px">Banco Central (SGS e Focus)${JR.ts ? " · atualizado às " + hm(JR.ts) : ""}</div>`
  );
};
function j2CurvaSvg(e) {
  const t = { l: 34, r: 8, t: 10, b: 22 },
    a = e.map((p) => p.du),
    o = e.flatMap((p) => [p.taxa, p.ant]).filter((p) => p != null),
    s = Math.min(...a),
    n = Math.max(...a),
    r = Math.min(...o) - 0.1,
    i = Math.max(...o) + 0.1,
    l = (p) => t.l + ((p - s) / (n - s || 1)) * (320 - t.l - t.r),
    d = (p) => t.t + ((i - p) / (i - r || 1)) * (150 - t.t - t.b),
    c = (p) =>
      e
        .filter((u) => u[p] != null)
        .map(
          (u, m) =>
            (m ? "L" : "M") + l(u.du).toFixed(1) + "," + d(u[p]).toFixed(1),
        )
        .join("");
  return `<svg viewBox="0 0 320 150" style="width:100%;height:auto;margin-top:6px" role="img" aria-label="Curva de juros futuros">
${[r + 0.1, (r + i) / 2, i - 0.1].map((p) => `<line x1="${t.l}" x2="${320 - t.r}" y1="${d(p)}" y2="${d(p)}" stroke="var(--bd)" stroke-width=".5"/><text x="${t.l - 4}" y="${d(p) + 3}" font-size="9" text-anchor="end" fill="var(--mut)">${jrN(p, 2)}</text>`).join("")}
<path d="${c("ant")}" fill="none" stroke="var(--mut)" stroke-width="1.2" stroke-dasharray="3 3"/>
<path d="${c("taxa")}" fill="none" stroke="var(--ac)" stroke-width="2"/>
${e.map((p) => `<circle cx="${l(p.du)}" cy="${d(p.taxa)}" r="2.6" fill="var(--ac)"><title>${p.cod}: ${jrN(p.taxa, 3)}%</title></circle>`).join("")}
${e
  .filter(
    (p, u) =>
      u === 0 ||
      (p.cod.startsWith("DI1F") && u % 2 === 0) ||
      u === e.length - 1,
  )
  .map(
    (p) =>
      `<text x="${l(p.du)}" y="142" font-size="8.5" text-anchor="middle" fill="var(--mut)">${p.cod.slice(3)}</text>`,
  )
  .join("")}
</svg><div class="sm mut" style="display:flex;gap:12px;justify-content:center"><span><b style="color:var(--ac)">━</b> hoje</span><span>┅ fechamento anterior</span></div>`;
}
function jrCurvaHtml() {
  const e = JR.data,
    t = e && e.curva,
    a = e && e.curva_info;
  if (!t || t.length < 2)
    return e && e.tv && !e.tv.ok
      ? `<div class="sm mut">A curva vem do TradingView, que não respondeu agora (${esc(e.tv.erro || "")}).</div>`
      : '<div class="sm mut">Sem dados da curva ainda.</div>';
  const o = (s) => (s == null ? "" : s > 0 ? "r" : s < 0 ? "g" : "");
  return `${a ? `<div class="sm" style="margin:2px 0 4px;line-height:1.45">Curva <b>${esc(a.forma)}</b>: ${esc(a.longo)} − ${esc(a.curto)} = <b>${j2pb(a.inclinacao_pb)}</b>.${a.dia ? ` Hoje os DIs estão <b>${esc(a.dia)}</b> (média ${j2pb(a.var_media_pb)}).` : ""}${a.taxa_1a != null ? ` Taxa de 1 ano: <b>${j2pc(a.taxa_1a, 3)}</b>.` : ""}</div>` : ""}
${j2CurvaSvg(t)}
<div style="overflow-x:auto;margin-top:6px"><table class="sm" style="width:100%;border-collapse:collapse;white-space:nowrap">
<tr class="mut"><td style="padding:4px 2px">Vértice</td><td style="text-align:right">Taxa</td><td style="text-align:right">Var.</td><td style="text-align:right">PU (R$)</td><td style="text-align:right">du</td><td style="text-align:right">Termo</td></tr>
${t.map((s) => `<tr style="border-top:1px solid var(--bd)"><td style="padding:6px 2px"><a href="${j2tv("BMFBOVESPA:" + s.cod.slice(0, 4) + s.venc.slice(0, 4))}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><b>${esc(s.cod)}</b><div class="mut" style="font-size:11px">${esc(s.rotulo)}</div></a></td><td style="text-align:right"><b>${jrN(s.taxa, 3)}</b></td><td style="text-align:right" class="${o(s.var_pb)}">${j2pb(s.var_pb)}</td><td style="text-align:right">${jrN(s.pu, 0)}</td><td style="text-align:right">${s.du}</td><td style="text-align:right" class="mut">${s.termo == null ? "–" : jrN(s.termo, 2)}</td></tr>`).join("")}
</table></div>
<div class="sm mut" style="margin-top:6px;line-height:1.45">Taxa em % ao ano (base 252). <b>Var.</b> em pontos-base (1 pb = 0,01 ponto): <span class="r">positivo = taxa subindo</span>, que costuma pesar no Ibovespa. <b>Termo</b> = taxa embutida entre o vértice anterior e este. TradingView, ~15 min de atraso. Toque no vértice para abrir o gráfico.</div>`;
}
function jrCotHtml() {
  const e = JR.data,
    t = e && e.cot;
  if (!t || !Object.keys(t).length) return "";
  const a = {
      wti: "WTI (USOIL)",
      brent: "Brent (UKOIL)",
      fef1: "Minério · 1º venc.",
      fef2: "Minério · 2º venc.",
      dce: "Minério Dalian (China)",
      ust2: "Treasury 2 anos",
      ust10: "Treasury 10 anos",
      ust30: "Treasury 30 anos",
      dxy: "DXY (dólar global)",
    },
    o = (n) => {
      const r = t[n];
      if (!r)
        return `<tr style="border-top:1px solid var(--bd)"><td style="padding:7px 2px">${a[n]}</td><td colspan="2" class="mut" style="text-align:right">sem cotação</td></tr>`;
      const i = n.startsWith("ust"),
        l =
          n === "dce"
            ? "DCE · yuan por tonelada"
            : n.startsWith("fef")
              ? r.alt >= 2
                ? "COMEX " + r.s.split(":")[1] + " · SGX indisponível"
                : "SGX " + r.s.split(":")[1]
              : r.s;
      return `<tr style="border-top:1px solid var(--bd)"><td style="padding:7px 2px"><a href="${j2tv(r.s)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">${a[n]}<div class="mut" style="font-size:11px">${esc(l)}</div></a></td><td style="text-align:right"><b>${jrN(r.close, i ? 3 : 2)}${i ? "%" : ""}</b></td><td style="text-align:right" class="${cls(i ? r.cha : r.chp)}">${i ? j2pb(r.cha == null ? null : r.cha * 100) : r.chp == null ? "–" : (r.chp > 0 ? "+" : "") + jrN(r.chp) + "%"}</td></tr>`;
    },
    s = (n, r) =>
      `<tr><td colspan="3" class="mut" style="padding:10px 2px 2px;font-weight:700;letter-spacing:.04em;font-size:11px">${n}</td></tr>` +
      r.map(o).join("");
  return `<table class="sm" style="width:100%;border-collapse:collapse">${s("PETRÓLEO E MINÉRIO", ["wti", "brent", "fef1", "fef2"].concat(t.dce ? ["dce"] : []))}${s("JUROS E DÓLAR LÁ FORA", ["ust2", "ust10", "ust30", "dxy"])}</table>
<div class="sm mut" style="margin-top:6px">TradingView, ~15 min de atraso. Minério: contrato FEF da SGX (Singapura); quando a SGX não libera a cotação, mostra o contrato TIO da COMEX, que é o mesmo minério 62% Fe em US$/t. Dalian (DCE) é o minério negociado na China, em yuan; negocia na madrugada do Brasil.</div>`;
}
((jrPaint = function () {
  const e = document.getElementById("jrp");
  e && (e.innerHTML = jrPanelHtml());
  const t = document.getElementById("jrc");
  t && (t.innerHTML = jrCurvaHtml());
  const a = document.getElementById("mkq");
  a && JR.data && JR.data.cot && Object.keys(JR.data.cot).length
    ? ((a.style.minHeight = ""), (a.innerHTML = jrCotHtml()))
    : a &&
      JR.data &&
      !a.dataset.w &&
      !JR.busy &&
      ((a.dataset.w = 1), cotWidget());
}),
  (jrLoad = async function (e) {
    if (JR.busy || (!e && JR.data && JR.ts && Date.now() - JR.ts < 18e4))
      return;
    const t = cfg();
    if (!t) {
      ((JR.err = "Configure o Supabase na aba Conta para ver os juros."),
        jrPaint());
      return;
    }
    ((JR.busy = 1), (JR.err = ""), jrPaint());
    try {
      let a;
      try {
        a = await fetch(t.url + "/functions/v1/juros", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: t.key },
          body: "{}",
        });
      } catch {
        throw new Error("Sem conexão. Mostrando o último valor salvo.");
      }
      let o = {};
      try {
        o = await a.json();
      } catch {}
      if (!a.ok)
        throw new Error(
          o.error ||
            (a.status === 404
              ? 'Função "juros" não encontrada: publique-a no Supabase.'
              : "Erro " + a.status),
        );
      ((JR.data = o), (JR.ts = Date.now()), ls.set("diario-jr", o));
    } catch (a) {
      JR.err = a.message || String(a);
    }
    ((JR.busy = 0), jrPaint());
  }));
function cotWidget() {
  const e = document.getElementById("mkq");
  if (!e) return;
  const t = new Date().getFullYear(),
    a = [1, 2, 3, 4, 5, 6, 7, 8, 10].map((s) => ({
      name: "BMFBOVESPA:DI1F" + (t + s),
      displayName: "DI1F" + String(t + s).slice(2) + " (jan/" + (t + s) + ")",
    }));
  ((e.style.minHeight = "560px"),
    (e.innerHTML =
      '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>'));
  const o = document.createElement("script");
  ((o.src =
    "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js"),
    (o.async = !0),
    (o.innerHTML = JSON.stringify({
      width: "100%",
      height: 720,
      symbolsGroups: [
        {
          name: "Petróleo e minério",
          symbols: [
            { name: "TVC:USOIL", displayName: "WTI (USOIL)" },
            { name: "TVC:UKOIL", displayName: "Brent (UKOIL)" },
            {
              name: "COMEX:TIO1!",
              displayName: "Minério 62% (COMEX, 1º venc.)",
            },
            {
              name: "COMEX:TIO2!",
              displayName: "Minério 62% (COMEX, 2º venc.)",
            },
            { name: "DCE:I1!", displayName: "Minério Dalian (DCE, yuan/t)" },
          ],
        },
        {
          name: "DI futuro (B3)",
          symbols: [
            { name: "BMFBOVESPA:DI11!", displayName: "DI1 contínuo" },
          ].concat(a),
        },
        {
          name: "Juros lá fora",
          symbols: [
            { name: "TVC:US02Y", displayName: "Treasury 2 anos" },
            { name: "TVC:US10Y", displayName: "Treasury 10 anos" },
          ],
        },
      ],
      showSymbolLogo: !1,
      colorTheme: mkDark() ? "dark" : "light",
      isTransparent: !0,
      locale: "br",
    })),
    e.firstChild.appendChild(o));
}
((vCot = function (e) {
  return `<div class="card"><div class="top"><b>Cotações</b><button class="btn s" data-mk="cr" aria-label="Atualizar">↻</button></div>${e}
<h3 style="margin-top:6px">Juros do Brasil</h3><div id="jrp">${jrPanelHtml()}</div>
<h3 style="margin-top:14px">Curva de juros · DI futuro (B3)</h3><div id="jrc">${jrCurvaHtml()}</div>
<h3 style="margin-top:14px">Petróleo, minério e juros lá fora</h3><div id="mkq">${jrCotHtml()}</div>
<div class="sm mut" style="margin-top:8px">Quer entender os números? Veja a aba Juros e DI no menu.</div></div>`;
}),
  (cotAfter = function () {
    (jrPaint(), jrLoad(!1));
  }),
  (function () {
    const e = vJuros;
    ((vJuros = function () {
      const t = e(),
        a = t.indexOf('<details class="card" data-jrs="sel"');
      return a < 0
        ? t
        : t.slice(0, a) +
            `<div class="card" style="margin-top:8px"><b>📈 Curva de juros futuros (DI1)</b><div id="jrc" style="margin-top:6px">${jrCurvaHtml()}</div></div>
` +
            t.slice(a);
    }),
      setInterval(() => {
        !document.hidden &&
          (document.getElementById("jrp") || document.getElementById("jrc")) &&
          jrLoad(!1);
      }, 6e4));
  })(),
  (function () {
    const e = render0;
    ((render0 = function () {
      (e(), tab === "juros" && jrAfter());
    }),
      document.addEventListener(
        "toggle",
        (a) => {
          const o = a.target;
          o &&
            o.dataset &&
            o.dataset.jrs &&
            o.open &&
            ((JRO = o.dataset.jrs), ls.set("diario-jr-open", JRO));
        },
        !0,
      ));
    const t = (a) => {
      const o = a.target;
      if (!(!o.id || o.id.indexOf("jr-") !== 0)) {
        if (o.id === "jr-mes") {
          const s = jrDuMes(o.value),
            n = document.getElementById("jr-du"),
            r = document.getElementById("jr-cod");
          (n && s != null && (n.value = s),
            r && (r.textContent = jrContrato(o.value)));
        }
        jrCalc();
      }
    };
    (document.addEventListener("input", t),
      document.addEventListener("change", t),
      document.addEventListener("click", (a) => {
        const o = a.target.closest('[data-mk="cr"],[data-mk="jr"]');
        o && (jrLoad(!0), o.dataset.mk === "cr" && cotAfter());
      }));
  })());
function moedaAtv(e) {
  const t = String(e || "")
    .toUpperCase()
    .replace(/\s/g, "");
  return !t ||
    /^(WIN|WDO|IND|DOL|BGI|CCM|ICF|SFI|DI1|BIT|ETR)[FGHJKMNQUVXZ]?\d{0,2}$/.test(
      t,
    )
    ? "BRL"
    : /^(M?ES|M?NQ|M?YM|M2K|RTY|M?CL|M?GC|SI|SIL|NG|HG|ZB|ZN|ZF|6[EJBACS]|M6[EAB]|MBT|MET|VX)([FGHJKMNQUVXZ]\d{1,2})?!?$/.test(
          t,
        )
      ? "USD"
      : /^[A-Z]{4}\d{1,2}F?$/.test(t) || /^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(t)
        ? "BRL"
        : /^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY|XAU|XAG)(USD|JPY|CHF|CAD|EUR|GBP|AUD|NZD)$/.test(
              t,
            ) ||
            /USDT?$/.test(t) ||
            /^(BTC|ETH|SOL|XRP)/.test(t) ||
            /^(US30|US100|NAS100|SPX500|US500|GER40|DJI|NDX|SPX)/.test(t) ||
            /^[A-Z]{1,5}(\.[A-Z])?$/.test(t)
          ? "USD"
          : "BRL";
}
function moedaT(e) {
  return (e && e.moeda) || moedaAtv(e && e.ativo);
}
function mnyC(e, t) {
  return e == null || !isFinite(e)
    ? "–"
    : t === "USD"
      ? (e < 0 ? "-" : "") + "US$ " + NF_2.format(Math.abs(e))
      : money(e);
}
function mT(e, t) {
  return mnyC(t, moedaT(e));
}
function emBRL(e, t) {
  return t === "USD" ? e * (+axg("brl", 5.4) || 5.4) : e;
}
function capRef(e) {
  const t = (o) => +gv("cap", o + "_ini", "") || 0;
  if (e) {
    const o = t(e);
    if (o > 0) return o;
  }
  const a = +gv("ct", "cap", 0) || 0;
  return a > 0 ? a : t("D") + t("S") + t("O");
}
function pctConta(e, t, a) {
  const o = capRef(a);
  if (e == null || !isFinite(e) || !o) return "";
  const s = (emBRL(e, t || "BRL") / o) * 100;
  return (
    (s > 0 ? "+" : "") +
    s.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    "% da conta"
  );
}
function riscoTrade() {
  return ((+gv("ct", "cap", 0) || 0) * (+gv("ct", "pct", 0) || 0)) / 100;
}
function somaMoedas(e) {
  const t = {};
  return (
    e.forEach((a) => {
      const o = a.c || calc(a);
      if (o.pl != null) {
        const s = moedaT(a);
        t[s] = (t[s] || 0) + o.pl;
      }
    }),
    t
  );
}
function mediaMoedas(e) {
  const t = {},
    a = {};
  return (
    e.forEach((o) => {
      const s = o.c || calc(o);
      if (s.pl != null) {
        const n = moedaT(o);
        ((t[n] = (t[n] || 0) + s.pl), (a[n] = (a[n] || 0) + 1));
      }
    }),
    Object.keys(t).forEach((o) => (t[o] /= a[o])),
    t
  );
}
function mnyMix(e) {
  const t = Object.keys(e);
  return t.length
    ? t
        .sort()
        .map((a) => mnyC(e[a], a))
        .join(" · ")
    : money(0);
}
function totBRL(e) {
  return Object.entries(e).reduce((t, [a, o]) => t + emBRL(o, a), 0);
}
const dayPL = (e) =>
  sum(e.filter((t) => t.c.pl != null).map((t) => emBRL(t.c.pl, moedaT(t))));
function limPerda(e) {
  return +e.maxP > 0
    ? +e.maxP
    : +e.maxR > 0 && riscoTrade() > 0
      ? +e.maxR * riscoTrade()
      : 0;
}
function numN(e) {
  if (e == null) return null;
  if (typeof e == "number") return isFinite(e) ? e : null;
  const t = String(e).trim();
  if (
    t === "" ||
    t === "-" ||
    !/^[+-]?(\d+([.,]\d*)?|[.,]\d+)(e[+-]?\d+)?$/i.test(t)
  )
    return null;
  const a = Number(t.replace(",", "."));
  return isFinite(a) ? a : null;
}
function isOpen(e) {
  return numN(e.exit) == null;
}
function calc(e) {
  const t = e.side === "C" ? 1 : -1,
    a = numN(e.pv) || 1,
    o = numN(e.qty) || 0,
    s = numN(e.entry),
    n = numN(e.stop),
    r = numN(e.exit),
    i = numN(e.cost) || 0,
    l = numN(e.target),
    d = r != null && s != null,
    c = s != null && n != null ? Math.abs(s - n) * o * a : null,
    p = d ? (r - s) * t * o * a - i : null,
    u = d && c > 0 ? p / c : null,
    m =
      s != null && n != null && l != null && s !== n
        ? Math.abs(l - s) / Math.abs(s - n)
        : null;
  return { risk: c, pl: p, r: u, rr: m, semStop: s != null && n == null };
}
function diasMais(e, t) {
  const a = new Date(e + "T12:00:00Z");
  return (a.setUTCDate(a.getUTCDate() + t), a.toISOString().slice(0, 10));
}
function segundaDe(e) {
  const t = new Date(e + "T12:00:00Z");
  return diasMais(e, -((t.getUTCDay() + 6) % 7));
}
function intervalo(e, t) {
  switch (e) {
    case "hoje":
      return [t, t];
    case "sem":
      return [segundaDe(t), t];
    case "7":
      return [diasMais(t, -6), t];
    case "30":
      return [diasMais(t, -29), t];
    case "mes":
      return [t.slice(0, 8) + "01", t];
    case "ano":
      return [t.slice(0, 4) + "-01-01", t];
    default:
      return [null, null];
  }
}
function noPeriodo(e, t, a) {
  const [o, s] = intervalo(t, a);
  return !o || (e >= o && e <= s);
}
const PERIODOS = [
  ["all", "Tudo"],
  ["hoje", "Hoje"],
  ["sem", "Esta semana"],
  ["7", "Últimos 7 dias"],
  ["30", "Últimos 30 dias"],
  ["mes", "Este mês"],
  ["ano", "Este ano"],
];
function quando(e) {
  const t = e.dtx || e.dt || "";
  return t.length === 10 ? t + "T23:59" : t;
}
function cmpCron(e, t) {
  const a = quando(e),
    o = quando(t);
  if (a !== o) return a < o ? -1 : 1;
  const s = e.dt || "",
    n = t.dt || "";
  return s < n ? -1 : s > n ? 1 : 0;
}
function ordenaCron(e) {
  return e
    .map((t, a) => ({ t, i: a }))
    .sort((t, a) => cmpCron(t.t, a.t) || t.i - a.i)
    .map((t) => t.t);
}
const _soma = (e) => e.reduce((t, a) => t + a, 0),
  _media = (e) => (e.length ? _soma(e) / e.length : null);
function _grupo(e, t) {
  const a = t.filter((s) => s.c.r != null).map((s) => s.c.r),
    o = t.map((s) => s.c.pl);
  return {
    k: e,
    n: t.length,
    nR: a.length,
    acerto: t.length ? o.filter((s) => s > 0).length / t.length : null,
    mediaR: _media(a),
    somaR: _soma(a),
    somaPL: _soma(o),
    mediaPL: _media(o),
  };
}
function agrupa(e, t, a) {
  const o = new Map();
  e.forEach((n) => {
    const r = t(n) || "—";
    (o.has(r) || o.set(r, []), o.get(r).push(n));
  });
  const s = [...o].map(([n, r]) => _grupo(n, r));
  return (a && s.sort((n, r) => a.indexOf(n.k) - a.indexOf(r.k)), s);
}
const SEM = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  semDe = (e) =>
    e && e.length >= 10
      ? SEM[new Date(e.slice(0, 10) + "T12:00:00Z").getUTCDay()]
      : null,
  horaDe = (e) => (e && e.length >= 13 ? e.slice(11, 13) + "h" : null),
  minutosEntre = (e, t) => {
    if (!e || !t || e.length < 16 || t.length < 16) return null;
    const a =
      (Date.parse(t.slice(0, 16) + ":00Z") -
        Date.parse(e.slice(0, 16) + ":00Z")) /
      6e4;
    return a >= 0 ? a : null;
  },
  SQN_ESCALA = [
    [1.6, "Abaixo do tradável"],
    [2, "Fraco, mas operável"],
    [2.5, "Médio"],
    [3, "Bom"],
    [5, "Excelente"],
    [7, "Soberbo"],
    [1 / 0, "Santo Graal"],
  ],
  qualSQN = (e) =>
    e == null ? "sem dado" : SQN_ESCALA.find(([t]) => e < t)[1];
function revancheDe(e, t = 15) {
  const a = (l) => Date.parse(String(l).slice(0, 16) + ":00Z"),
    o = e
      .filter((l) => l.c.r < 0 && l.dtx && l.dtx.length >= 16)
      .map((l) => ({ t: l, f: a(l.dtx) }))
      .filter((l) => isFinite(l.f)),
    s = [],
    n = [],
    r = [],
    i = [];
  return (
    e.forEach((l) => {
      const d = l.dt && l.dt.length >= 16 ? a(l.dt) : NaN,
        c =
          isFinite(d) &&
          o.some((p) => p.t !== l && d >= p.f && d - p.f <= t * 6e4);
      ((c ? s : n).push(l.c.r), (c ? r : i).push(l.c.pl));
    }),
    s.length < 5 || n.length < 5
      ? null
      : {
          janelaMin: t,
          rev: { n: s.length, exp: _media(s), expPL: _media(r) },
          resto: { n: n.length, exp: _media(n), expPL: _media(i) },
        }
  );
}
function estat(e) {
  const t = ordenaCron(e.filter((Ke) => Ke.c && Ke.c.pl != null)),
    a = t.length,
    o = t.map((Ke) => Ke.c.pl),
    s = o.filter((Ke) => Ke > 0),
    n = o.filter((Ke) => Ke < 0),
    r = _soma(s),
    i = _soma(n),
    l = _media(s),
    d = _media(n),
    c = t.filter((Ke) => Ke.c.r != null),
    p = c.map((Ke) => Ke.c.r),
    u = p.length,
    m = _media(p),
    f = u > 1 ? Math.sqrt(_soma(p.map((Ke) => (Ke - m) ** 2)) / (u - 1)) : null,
    x = f ? m / f : null,
    v = [];
  let g = 0,
    h = 0,
    b = 0,
    y = [],
    j = 0,
    k = -1;
  p.forEach((Ke, at) => {
    ((g += Ke),
      v.push(g),
      (h = Math.max(h, g)),
      (b = g - h),
      y.push(b),
      -b > j && ((j = -b), (k = at)));
  });
  const A = [];
  let C = 0,
    I = 0,
    J = 0,
    se = 0;
  o.forEach((Ke) => {
    ((C += Ke),
      A.push(C),
      (I = Math.max(I, C)),
      (J = C - I),
      -J > se && (se = -J));
  });
  let Ie = 0,
    Pe = 0,
    Me = 0,
    ue = 0;
  o.forEach((Ke) => {
    (Ke > 0
      ? (Me++, (ue = 0))
      : Ke < 0
        ? (ue++, (Me = 0))
        : ((Me = 0), (ue = 0)),
      (Ie = Math.max(Ie, Me)),
      (Pe = Math.max(Pe, ue)));
  });
  const ve = new Map();
  t.forEach((Ke) => {
    const at = (Ke.dtx || Ke.dt || "").slice(0, 10),
      rt = ve.get(at) || { k: at, pl: 0, r: 0, n: 0 };
    ((rt.pl += Ke.c.pl), (rt.r += Ke.c.r || 0), rt.n++, ve.set(at, rt));
  });
  const he = [...ve.values()].sort((Ke, at) => (Ke.k < at.k ? -1 : 1)),
    we = he.map((Ke) => Ke.pl),
    Be = [],
    Ge = [];
  t.forEach((Ke) => {
    const at = minutosEntre(Ke.dt, Ke.dtx);
    at != null && (Ke.c.pl > 0 ? Be : Ke.c.pl < 0 ? Ge : []).push(at);
  });
  const Ce = c
      .filter((Ke) => Ke.c.pl > 0 && Ke.c.rr > 0)
      .map((Ke) => Ke.c.r / Ke.c.rr),
    Qe = (Ke) => !(Ke.err && Ke.err !== "Nenhum"),
    de = t.filter((Ke) => Qe(Ke) && Ke.rules !== "n"),
    Se = t.filter((Ke) => Ke.rules === "n"),
    Ve = t.filter((Ke) => !Qe(Ke)),
    Je = {};
  t.forEach((Ke) => {
    const at = semDe(Ke.dt),
      rt = horaDe(Ke.dt);
    if (!at || !rt) return;
    const dt = at + "|" + rt;
    (Je[dt] ?? (Je[dt] = { n: 0, somaR: 0 }),
      Je[dt].n++,
      (Je[dt].somaR += Ke.c.r || 0));
  });
  const Ye = p.filter((Ke) => Ke < -1.05).length,
    Xe = p.filter((Ke) => Ke < 0).length,
    ot = (Ke) => numN(Ke) || 0;
  return {
    rows: t,
    n: a,
    nR: u,
    semStop: a - u,
    resultado: _soma(o),
    ganhoBruto: r,
    perdaBruta: i,
    custos: _soma(t.map((Ke) => ot(Ke.cost))),
    acerto: a ? s.length / a : null,
    nGanhos: s.length,
    nPerdas: n.length,
    mediaGanho: l,
    mediaPerda: d,
    payoff: d ? l / -d : null,
    profitFactor: i < 0 ? r / -i : null,
    expectativaPL: a ? _soma(o) / a : null,
    mediaR: m,
    desvioR: f,
    sqn: x == null ? null : x * Math.sqrt(Math.min(u, 100)),
    sqn100: x == null ? null : x * 10,
    mediaGanhoR: _media(p.filter((Ke) => Ke > 0)),
    mediaPerdaR: _media(p.filter((Ke) => Ke < 0)),
    maiorR: u ? Math.max(...p) : null,
    menorR: u ? Math.min(...p) : null,
    perdasAcima1R: Ye,
    nPerdasR: Xe,
    curvaR: v,
    ddR: y,
    ddMaxR: j,
    ddMaxEm: k >= 0 ? c[k].dtx || c[k].dt : null,
    ddAtualR: y.length ? -y[y.length - 1] : 0,
    curvaPL: A,
    ddMaxPL: se,
    ddAtualPL: A.length ? I - C : 0,
    maxSeqGanhos: Ie,
    maxSeqPerdas: Pe,
    seqAtual: Me
      ? { tipo: "ganho", n: Me }
      : ue
        ? { tipo: "perda", n: ue }
        : null,
    dias: he,
    diasGanhos: we.filter((Ke) => Ke > 0).length,
    diasPerdidos: we.filter((Ke) => Ke < 0).length,
    melhorDia: we.length ? Math.max(...we) : null,
    piorDia: we.length ? Math.min(...we) : null,
    durGanhoMin: _media(Be),
    durPerdaMin: _media(Ge),
    nDurGanho: Be.length,
    nDurPerda: Ge.length,
    captura: _media(Ce),
    nCaptura: Ce.length,
    maiorPL: o.length ? Math.max(...o) : null,
    menorPL: o.length ? Math.min(...o) : null,
    regras: {
      plErros: _soma(Ve.map((Ke) => Ke.c.pl)),
      plSemErro: _soma(t.filter(Qe).map((Ke) => Ke.c.pl)),
      mediaPlOk: _media(de.map((Ke) => Ke.c.pl)),
      mediaPlQuebrou: _media(Se.map((Ke) => Ke.c.pl)),
      ok: de.length,
      quebrou: Se.length,
      erros: Ve.length,
      mediaOk: _media(de.filter((Ke) => Ke.c.r != null).map((Ke) => Ke.c.r)),
      mediaQuebrou: _media(
        Se.filter((Ke) => Ke.c.r != null).map((Ke) => Ke.c.r),
      ),
      rErros: _soma(Ve.map((Ke) => Ke.c.r || 0)),
      rSemErro: _soma(t.filter(Qe).map((Ke) => Ke.c.r || 0)),
    },
    porDia: agrupa(t, (Ke) => semDe(Ke.dt), [
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
      "Dom",
    ]),
    porHora: agrupa(t, (Ke) => horaDe(Ke.dt)).sort((Ke, at) =>
      Ke.k < at.k ? -1 : 1,
    ),
    porSetup: agrupa(t, (Ke) => Ke.setup),
    porMercado: agrupa(t, (Ke) => Ke.mkt),
    porAtivo: agrupa(t, (Ke) => (Ke.ativo || "").toUpperCase()),
    porErro: agrupa(Ve, (Ke) => Ke.err),
    heat: Je,
    revanche: revancheDe(c),
  };
}
const _f = (e, t = 2) => (e == null ? "–" : e.toFixed(t).replace(".", ",")),
  _R = (e) => (e == null ? "–" : (e > 0 ? "+" : "") + _f(e) + "×"),
  _pct = (e) => (e == null ? "–" : _f(e * 100, 0) + "%");
function diagnosticos(e, t) {
  const a = [],
    o = (i, l, d, c) => a.push({ nivel: i, id: l, titulo: d, texto: c }),
    s =
      t ||
      ((i) =>
        i == null
          ? "–"
          : (i < 0 ? "-" : "") +
            "R$ " +
            Math.abs(i).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })),
    n = (i) => (i == null ? "–" : (i > 0 ? "+" : "") + s(i));
  if (!e.n) return a;
  (e.semStop > 0 &&
    o(
      "alerta",
      "sem-stop",
      `${e.semStop} trade(s) fechado(s) sem stop`,
      "Sem o stop inicial o app não consegue medir quanto você arriscou. Esses trades entram no resultado, mas ficam fora das contas de risco (perdas maiores que o planejado, captura do alvo e qualidade do sistema). Preencha o stop inicial.",
    ),
    e.n < 30 &&
      o(
        "info",
        "amostra",
        `Amostra pequena (${e.n} trades)`,
        "Com menos de 30 trades os números ainda oscilam muito. Use como pista, não como conclusão.",
      ),
    e.nR >= 20 &&
      e.mediaR != null &&
      (e.mediaR <= 0
        ? o(
            "alerta",
            "expectancia",
            `Média negativa: ${n(e.expectativaPL)} por trade`,
            `Em ${e.n} trades você perde em média ${s(Math.abs(e.expectativaPL || 0))} por operação. Nesse ritmo o sistema perde dinheiro mesmo com disciplina; revise setup, stop e alvo antes de aumentar a mão.`,
          )
        : o(
            "ok",
            "expectancia",
            `Média positiva: ${n(e.expectativaPL)} por trade`,
            `Em ${e.n} trades você ganha em média ${s(e.expectativaPL)} por operação. Qualidade do sistema: ${qualSQN(e.sqn100).toLowerCase()} (nota ${_f(e.sqn100)}).`,
          )),
    e.nPerdasR >= 5 &&
      e.perdasAcima1R / e.nPerdasR > 0.3 &&
      o(
        "alerta",
        "stop-nao-respeitado",
        `${e.perdasAcima1R} de ${e.nPerdasR} perdas passaram do stop planejado`,
        `Perder mais do que o risco planejado indica stop movido, não executado ou mão maior que o plano. A pior perda foi ${s(e.menorPL)}.`,
      ),
    e.nCaptura >= 5 &&
      e.captura != null &&
      e.captura < 0.6 &&
      o(
        "alerta",
        "saida-cedo",
        `Você realiza só ${_pct(e.captura)} do ganho planejado`,
        `Nos ${e.nCaptura} ganhos com alvo definido, você saiu em média com ${_pct(e.captura)} do que ganharia no alvo. Há sinal de saída antecipada; compare com o que o preço fez depois.`,
      ),
    e.nDurGanho >= 5 &&
      e.nDurPerda >= 5 &&
      e.durGanhoMin < e.durPerdaMin * 0.7 &&
      o(
        "alerta",
        "ganho-curto-perda-longa",
        "Ganhos duram menos que perdas",
        `Ganhos ficam em média ${_f(e.durGanhoMin, 0)} min e perdas ${_f(e.durPerdaMin, 0)} min. É o padrão de realizar rápido e segurar o que dá errado.`,
      ),
    e.regras.erros >= 3 &&
      e.regras.rErros < 0 &&
      o(
        "alerta",
        "custo-erros",
        `Trades com erro custaram ${s(e.regras.plErros)}`,
        `${e.regras.erros} trades tiveram erro registrado e somam ${n(e.regras.plErros)}; os demais somam ${n(e.regras.plSemErro)}.`,
      ),
    e.regras.quebrou >= 5 &&
      e.regras.mediaOk != null &&
      e.regras.mediaQuebrou != null &&
      e.regras.mediaQuebrou < e.regras.mediaOk &&
      o(
        "alerta",
        "regras",
        "Quebrar regras piora o resultado",
        `Seguindo as regras a média é ${n(e.regras.mediaPlOk)} por trade; quebrando, ${n(e.regras.mediaPlQuebrou)} (${e.regras.quebrou} trades).`,
      ));
  const r = (i, l) => {
    const d = i
      .filter((c) => c.n >= 8 && c.nR >= 8 && c.mediaR < 0)
      .sort((c, p) => c.somaR - p.somaR)[0];
    d &&
      o(
        "info",
        "fraco-" + l,
        `Ponto fraco: ${l} ${d.k}`,
        `${d.n} trades, média de ${n(d.mediaPL)} por trade, total ${n(d.somaPL)}. Considere evitar ou reduzir a mão aqui.`,
      );
  };
  if (
    (r(e.porDia, "dia da semana"),
    r(e.porHora, "horário"),
    r(e.porSetup, "setup"),
    e.dias.length >= 10)
  ) {
    const i = e.dias.map((p) => p.n).sort((p, u) => p - u),
      l = i[Math.floor(i.length / 2)],
      d = e.dias.filter((p) => p.n > l),
      c = e.dias.filter((p) => p.n <= l);
    if (d.length >= 3 && c.length >= 3) {
      const p = _media(d.map((m) => m.r / m.n)),
        u = _media(c.map((m) => m.r / m.n));
      if (p < u - 0.2) {
        const m = _media(d.map((x) => x.pl / x.n)),
          f = _media(c.map((x) => x.pl / x.n));
        o(
          "alerta",
          "overtrading",
          "Dias com mais trades rendem menos",
          `Em dias acima de ${l} trade(s) a média é ${n(m)} por trade, contra ${n(f)} nos demais. Pode ser excesso de operações.`,
        );
      }
    }
  }
  return (
    e.revanche &&
      e.revanche.rev.exp < e.revanche.resto.exp - 0.2 &&
      o(
        "alerta",
        "revanche",
        "Trades logo depois de uma perda rendem menos",
        `Entradas até ${e.revanche.janelaMin} min depois de uma perda: ${n(e.revanche.rev.expPL)} por trade (${e.revanche.rev.n} trades), contra ${n(e.revanche.resto.expPL)} nos demais. Pode ser revanche; espere antes de operar de novo.`,
      ),
    e.seqAtual &&
      e.seqAtual.tipo === "perda" &&
      e.seqAtual.n >= 3 &&
      o(
        "alerta",
        "sequencia",
        `${e.seqAtual.n} perdas seguidas`,
        "Sequência de perdas é o momento de maior risco emocional. Considere parar o dia e revisar os últimos trades.",
      ),
    e.ddMaxR > 0 &&
      e.ddAtualR > 0 &&
      e.ddAtualR >= e.ddMaxR * 0.5 &&
      o(
        "info",
        "drawdown",
        `Você está ${s(e.ddAtualPL)} abaixo do seu melhor momento`,
        `O maior recuo da conta até hoje foi de ${s(e.ddMaxPL)}; o recuo atual já está perto da metade disso.`,
      ),
    e.profitFactor != null &&
      e.n >= 20 &&
      e.profitFactor < 1 &&
      o(
        "alerta",
        "profit-factor",
        `Ganhos não cobrem as perdas (fator ${_f(e.profitFactor)})`,
        `Para cada R$ 1 perdido você ganhou ${s(e.profitFactor)}. Abaixo de 1 o resultado fica negativo.`,
      ),
    e.ganhoBruto > 0 &&
      e.custos / e.ganhoBruto > 0.3 &&
      o(
        "info",
        "custos",
        `Custos consomem ${_pct(e.custos / e.ganhoBruto)} dos ganhos brutos`,
        `Corretagem e taxas somam ${s(e.custos)} contra ${s(e.ganhoBruto)} de ganho bruto.`,
      ),
    a
  );
}
const ST = {
    aba: ls.get("diario-st-aba") || "geral",
    ia: Object.assign(
      { busy: 0, err: "", rel: null, chave: "", em: 0 },
      ls.get("diario-st-ia") || {},
      { busy: 0, err: "" },
    ),
  },
  ST_ABAS = [
    ["geral", "Geral"],
    ["risco", "Risco"],
    ["onde", "Quando e onde"],
    ["diag", "Diagnóstico"],
  ],
  frN = (e) => (e == null ? "–" : fr(e)),
  f2N = (e) => (e == null ? "–" : f2(e)),
  pcN = (e) => (e == null ? "–" : pc(e));
function stRows() {
  const e = loc().slice(0, 10);
  return S.trades
    .filter((t) => TIPO === "all" || (t.tipo || "D") === TIPO)
    .map((t) => ({ ...t, c: calc(t) }))
    .filter(
      (t) =>
        t.c.pl != null && noPeriodo((t.dtx || t.dt || "").slice(0, 10), PER, e),
    );
}
function stCtx() {
  const e = stRows(),
    t = [...new Set(e.map(moedaT))],
    a = t.length > 1,
    o = a ? "BRL" : t[0] || "BRL";
  return {
    rows: a
      ? e.map((s) => ({
          ...s,
          c: {
            ...s.c,
            pl: emBRL(s.c.pl, moedaT(s)),
            risk: s.c.risk == null ? null : emBRL(s.c.risk, moedaT(s)),
          },
        }))
      : e,
    mo: o,
    mix: a,
    fm: (s) => mnyC(s, o),
    fs: (s) => (s == null ? "–" : (s > 0 ? "+" : "") + mnyC(s, o)),
  };
}
const stTbl = (e, t, a) =>
  t.length
    ? tbl(
        [e, "Nº", "Acerto", "Média", "Total"],
        t
          .map(
            (o) =>
              `<tr><td>${esc(o.k)}</td><td>${o.n}</td><td>${pcN(o.acerto)}</td><td class="${cls(o.mediaPL)}">${a(o.mediaPL)}</td><td class="${cls(o.somaPL)}">${a(o.somaPL)}</td></tr>`,
          )
          .join(""),
      )
    : "";
function stHeat(e, t) {
  const a = {};
  e.rows.forEach((d) => {
    const c = semDe(d.dt),
      p = horaDe(d.dt);
    if (!c || !p) return;
    const u = c + "|" + p;
    (a[u] ?? (a[u] = { n: 0, pl: 0 }), a[u].n++, (a[u].pl += d.c.pl));
  });
  const o = Object.keys(a);
  if (!o.length) return "";
  const s = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].filter((d) =>
      o.some((c) => c.startsWith(d + "|")),
    ),
    n = [...new Set(o.map((d) => d.split("|")[1]))].sort(),
    r = Math.max(...Object.values(a).map((d) => Math.abs(d.pl)), 1),
    i = (d) => {
      const c = Math.abs(d);
      return (
        (d < 0 ? "-" : d > 0 ? "+" : "") +
        (c >= 1e3
          ? (c / 1e3).toFixed(1).replace(".", ",") + "k"
          : Math.round(c))
      );
    },
    l = (d, c) => {
      const p = a[d + "|" + c];
      if (!p) return "<td></td>";
      const u = Math.min(0.85, 0.18 + (Math.abs(p.pl) / r) * 0.67);
      return `<td style="background:${p.pl >= 0 ? `rgba(46,160,67,${u})` : `rgba(229,83,75,${u})`};text-align:center;padding:6px 4px;font-size:12px" title="${p.n} trade(s): ${t(p.pl)}">${i(p.pl)}<div style="opacity:.75;font-size:10px">${p.n}x</div></td>`;
    };
  return `<div class="card" style="overflow-x:auto"><table style="min-width:${70 + n.length * 54}px"><tr><th></th>${n.map((d) => `<th>${d}</th>`).join("")}</tr>${s.map((d) => `<tr><th>${d}</th>${n.map((c) => l(d, c)).join("")}</tr>`).join("")}</table></div><div class="sm mut">Resultado somado por dia da semana e hora de entrada. Verde ganha, vermelho perde; o número pequeno é a quantidade de trades.</div>`;
}
const ST_NIV = {
    alerta: ["⚠️", "var(--r)"],
    info: ["ℹ️", "#a57d34"],
    ok: ["✅", "var(--g)"],
  },
  stDiagHtml = (e) =>
    e.length
      ? e
          .map((t) => {
            const [a, o] = ST_NIV[t.nivel] || ST_NIV.info;
            return `<div class="card" style="border-left:4px solid ${o};margin:8px 0"><b>${a} ${esc(t.titulo)}</b><div class="sm" style="margin-top:4px;line-height:1.5">${esc(t.texto)}</div></div>`;
          })
          .join("")
      : '<p class="mut">Nenhum ponto de atenção com os dados atuais.</p>';
function stPacote(e, t, a) {
  a = a || stCtx();
  const o = (n) => (n == null ? null : +(+n).toFixed(2)),
    s = (n) =>
      n
        .slice(0, 8)
        .map((r) => ({
          grupo: r.k,
          trades: r.n,
          acerto_pct: r.acerto == null ? null : Math.round(r.acerto * 100),
          media_por_trade: o(r.mediaPL),
          total: o(r.somaPL),
        }));
  return {
    resumo: {
      periodo: (PERIODOS.find((n) => n[0] === PER) || [])[1] || PER,
      tipo: TIPO,
      moeda: a.mo === "USD" ? "dólar (US$)" : "real (R$)",
      trades_fechados: e.n,
      trades_sem_stop: e.semStop,
      resultado: o(e.resultado),
      media_por_trade: o(e.expectativaPL),
      acerto_pct: e.acerto == null ? null : Math.round(e.acerto * 100),
      fator_de_lucro: o(e.profitFactor),
      ganho_medio_sobre_perda_media: o(e.payoff),
      ganho_medio: o(e.mediaGanho),
      perda_media: o(e.mediaPerda),
      maior_ganho: o(e.maiorPL),
      maior_perda: o(e.menorPL),
      perdas_maiores_que_o_stop: e.perdasAcima1R,
      perdas_com_stop_definido: e.nPerdasR,
      maior_recuo_da_conta: o(e.ddMaxPL),
      recuo_atual: o(e.ddAtualPL),
      qualidade_do_sistema_sqn: o(e.sqn100),
      max_seq_ganhos: e.maxSeqGanhos,
      max_seq_perdas: e.maxSeqPerdas,
      seq_atual: e.seqAtual,
      captura_do_alvo_pct:
        e.captura == null ? null : Math.round(e.captura * 100),
      duracao_ganhos_min: o(e.durGanhoMin),
      duracao_perdas_min: o(e.durPerdaMin),
      custos: o(e.custos),
      regras_seguidas: e.regras.ok,
      regras_quebradas: e.regras.quebrou,
      trades_com_erro: e.regras.erros,
      resultado_dos_trades_com_erro: o(e.regras.plErros),
      media_seguindo_regras: o(e.regras.mediaPlOk),
      media_quebrando_regras: o(e.regras.mediaPlQuebrou),
      observacao_para_a_ia:
        "Fale sempre em dinheiro (R$ ou US$) e em porcentagem. Não use R-múltiplo nem a letra R para resultados; o usuário não usa essa medida.",
    },
    diagnosticos: t.map((n) => ({
      nivel: n.nivel,
      titulo: n.titulo,
      texto: n.texto,
    })),
    grupos: {
      por_dia_da_semana: s(e.porDia),
      por_hora: s(e.porHora),
      por_setup: s(e.porSetup),
      por_mercado: s(e.porMercado),
      por_erro: s(e.porErro),
    },
  };
}
async function stIA(e, t) {
  if (ST.ia.busy) return;
  const a = stPacote(e, t),
    o = hs(JSON.stringify(a));
  ((ST.ia.busy = 1), (ST.ia.err = ""), render());
  try {
    const s = await anxCall({
      modo: "estatisticas",
      resumo: a.resumo,
      diagnosticos: a.diagnosticos,
      grupos: a.grupos,
    });
    ((ST.ia.rel = s.relatorio || null),
      (ST.ia.chave = o),
      (ST.ia.em = Date.now()),
      ls.set("diario-st-ia", { rel: ST.ia.rel, chave: o, em: ST.ia.em }),
      ST.ia.rel ||
        (ST.ia.err = "A IA não devolveu a interpretação. Tente de novo."));
  } catch (s) {
    ST.ia.err = s.message || String(s);
  }
  ((ST.ia.busy = 0), render());
}
const stT = (e) =>
  typeof e == "string"
    ? esc(e)
    : e && typeof e == "object"
      ? Object.entries(e)
          .map(([t, a]) => `<b>${esc(t)}:</b> ${esc(String(a))}`)
          .join(" · ")
      : "";
function stIAHtml(e, t) {
  const a = ST.ia,
    o = hs(JSON.stringify(stPacote(e, t))),
    s = a.rel,
    n = (i) => (Array.isArray(i) ? i : []);
  let r = `<div class="card" style="margin:12px 0"><div class="top"><b>🤖 Leitura da IA</b></div><div class="sm mut" style="margin:4px 0 8px">Todos os números abaixo foram calculados pelo app. A IA só explica o que eles significam e sugere um plano de ação.</div>${`<button class="btn" data-st="ia"${a.busy ? " disabled" : ""}>${a.busy ? "Interpretando…" : s ? "🤖 Interpretar de novo" : "🤖 Interpretar com IA"}</button>`}${a.err ? `<div class="warn" style="margin-top:8px">${esc(a.err)}</div>` : ""}`;
  if (s) {
    a.chave !== o &&
      (r +=
        '<div class="sm mut" style="margin-top:8px">Os números mudaram desde esta leitura. Gere de novo para atualizar.</div>');
    const i = (c, p) =>
        p ? `<div style="margin-top:12px"><b>${c}</b>${p}</div>` : "",
      l = (c) =>
        n(c)
          .map((p) => `<p style="margin:6px 0;line-height:1.5">${stT(p)}</p>`)
          .join(""),
      d = (c) =>
        n(c)
          .map(
            (p) =>
              `<div class="card" style="margin:6px 0"><b>${esc(p.tema || "")}</b>${p.evidencia ? `<div class="sm mut" style="margin-top:2px">${esc(p.evidencia)}</div>` : ""}<div class="sm" style="margin-top:4px">${esc(p.acao || p.por_que_importa || "")}</div></div>`,
          )
          .join("");
    r +=
      i("Leitura geral", l(s.leitura_geral)) +
      i("Pontos fortes", d(s.pontos_fortes)) +
      i("Pontos de melhoria", d(s.pontos_de_melhoria)) +
      i("Padrões de comportamento", l(s.padroes_de_comportamento)) +
      i(
        "Plano para os próximos 20 trades",
        n(s.plano_proximos_20_trades).length
          ? '<ol style="margin:6px 0;padding-left:20px">' +
              n(s.plano_proximos_20_trades)
                .map((c) => `<li style="margin:4px 0">${stT(c)}</li>`)
                .join("") +
              "</ol>"
          : "",
      ) +
      i("Alertas", l(s.alertas)) +
      `<div class="sm mut" style="margin-top:10px">Gerada por IA${a.em ? " em " + new Date(a.em).toLocaleDateString("pt-BR") : ""}. Não é recomendação de investimento.</div>`;
  }
  return r + "</div>";
}
function vStats() {
  const e =
      '<div class="top"><h1>Estatísticas</h1><button class="btn s" data-a="csv" id="csvb">Exportar CSV</button></div>',
    t =
      perSel() +
      tipoSel() +
      '<div class="sm mut" style="margin:-2px 0 8px">O período vale pela data de saída de cada trade.</div>',
    a = stCtx(),
    o = a.fm,
    s = a.fs,
    n = estat(a.rows),
    r = TIPO === "all" ? void 0 : TIPO,
    i = (x) => pctConta(x, a.mo, r);
  if (!n.n)
    return (
      e +
      t +
      '<p class="mut">Feche trades (com saída) para ver as estatísticas. Quanto mais trades, mais confiáveis ficam os números: o ideal é juntar de 100 a 200.</p>'
    );
  const l = diagnosticos(n, o),
    d = l.filter((x) => x.nivel === "alerta").length,
    c = `<div class="seg" style="margin:8px 0">${ST_ABAS.map(([x, v]) => `<button class="${ST.aba === x ? "on" : ""}" data-st="${x}">${v}${x === "diag" && d ? ` <span style="color:var(--r)">●${d}</span>` : ""}</button>`).join("")}</div>`,
    p = `<div class="kv" style="margin-top:8px">${KV("Resultado", s(n.resultado), cls(n.resultado), n.n + " trades" + (i(n.resultado) ? " · " + i(n.resultado) : ""))}${KV("Média por trade", s(n.expectativaPL), cls(n.expectativaPL), "quanto você ganha ou perde, em média, por operação")}${KV("Acerto", pcN(n.acerto), "", n.nGanhos + " ganhos · " + n.nPerdas + " perdas")}${KV("Ganho médio ÷ perda média", n.payoff == null ? "–" : f2(n.payoff) + "x", "", "ganho médio " + o(n.mediaGanho) + " · perda média " + o(n.mediaPerda == null ? null : -n.mediaPerda))}${KV("Fator de lucro", f2N(n.profitFactor), n.profitFactor != null && n.profitFactor < 1 ? "r" : "", "ganhos brutos ÷ perdas brutas (acima de 1 = lucro)")}${KV("Maior recuo da conta", o(n.ddMaxPL), n.ddMaxPL > 0 ? "r" : "", "atual " + o(n.ddAtualPL) + (i(-n.ddMaxPL) ? " · " + i(-n.ddMaxPL).replace(" da conta", " da conta no pior momento") : ""))}</div>`,
    u =
      (a.mix
        ? `<div class="sm mut" style="margin-top:8px">Você tem trades em R$ e em US$: os valores desta tela foram convertidos para R$ (dólar a ${f2(+axg("brl", 5.4) || 5.4)}).</div>`
        : "") +
      (n.n < 30
        ? `<div class="warn" style="margin-top:8px">Amostra pequena (${n.n} trades): use os números como pista, não como conclusão.</div>`
        : ""),
    m = n.rows.map(
      (x) => fdt(x.dtx || x.dt).slice(0, 5) + " " + (x.ativo || ""),
    );
  let f = "";
  if (ST.aba === "geral") {
    const x = n.dias.slice(-20);
    let v = -1 / 0;
    const g = n.curvaPL.map((b) => ((v = Math.max(v, b)), b - v)),
      h = n.rows.slice(-30);
    f = `<h2>Evolução do resultado</h2>${lineChart("eq", n.curvaPL, m, (b) => s(b))}<h2>Recuos da conta</h2>${lineChart("dd", g, m, (b) => o(b))}<div class="sm mut">Quanto o resultado acumulado caiu em relação ao melhor momento anterior.</div><h2>Resultado por dia</h2>${barChart(
      "dia",
      x.map((b) => b.pl),
      x.map((b) => b.k.slice(8) + "/" + b.k.slice(5, 7)),
    )}<div class="kv">${KV("Dias ganhos / perdidos", n.diasGanhos + " / " + n.diasPerdidos)}${KV("Melhor / pior dia", s(n.melhorDia) + " / " + s(n.piorDia))}</div><h2>Últimos ${h.length} trades</h2>${barChart(
      "tr",
      h.map((b) => b.c.pl),
      h.map((b) => fdt(b.dtx || b.dt).slice(0, 5)),
    )}`;
  } else if (ST.aba === "risco") {
    const x = n.regras;
    f = `<div class="kv" style="margin-top:8px">${KV("Ganho médio", o(n.mediaGanho), "g")}${KV("Perda média", o(n.mediaPerda), "r")}${KV("Maior ganho / maior perda", s(n.maiorPL) + " / " + s(n.menorPL))}${KV("Perdas maiores que o stop planejado", n.perdasAcima1R + " de " + n.nPerdasR, n.nPerdasR && n.perdasAcima1R > n.nPerdasR * 0.3 ? "r" : "", "se muitas perdas passam do stop, ele não está sendo respeitado")}${KV("Qualidade do sistema", f2N(n.sqn100), "", qualSQN(n.sqn100) + " (nota SQN, padrão de 100 trades)")}${KV("Captura do alvo", n.captura == null ? "–" : pc(n.captura), n.captura != null && n.captura < 0.6 ? "r" : "", "quanto do ganho planejado até o alvo você realiza (" + n.nCaptura + " ganhos)")}${KV("Duração: ganhos × perdas", durFmt(n.durGanhoMin) + " × " + durFmt(n.durPerdaMin))}</div>
<div class="rings">${ring((n.acerto || 0) * 100, "Acerto")}${ring(n.n ? (x.ok / n.n) * 100 : 0, "Regras seguidas", "var(--g)")}${ring(n.n ? ((n.n - x.erros) / n.n) * 100 : 0, "Sem erro", "#c2933d")}</div>
<h2>Disciplina e erros</h2><div class="kv">${KV("Trades sem erro", pcN(n.n ? (n.n - x.erros) / n.n : null), x.erros ? "" : "g")}${KV("Erros a cada 100 trades", f2(n.n ? (x.erros / n.n) * 100 : 0))}${KV("Resultado dos trades com erro", s(x.plErros), cls(x.plErros))}${KV("Média: regras seguidas × quebradas", s(x.mediaPlOk) + " × " + s(x.mediaPlQuebrou), "", "resultado médio por trade em cada grupo")}</div>${stTbl("Erro", n.porErro, s)}
<h2>Sequências</h2><div class="kv">${KV("Maior sequência de ganhos", n.maxSeqGanhos, "g")}${KV("Maior sequência de perdas", n.maxSeqPerdas, "r")}${KV("Sequência atual", n.seqAtual ? n.seqAtual.n + " " + n.seqAtual.tipo + (n.seqAtual.n > 1 ? "s" : "") : "–", n.seqAtual ? (n.seqAtual.tipo === "ganho" ? "g" : "r") : "")}</div>`;
  } else if (ST.aba === "onde") {
    const x = n.rows.filter((v) => v.tipo === "O");
    f = `<h2>Mapa de calor: dia × hora</h2>${stHeat(n, s)}<h2>Por dia da semana</h2>${stTbl("Dia", n.porDia, s)}<h2>Por horário de entrada</h2>${stTbl("Hora", n.porHora, s)}<h2>Por setup</h2>${stTbl("Setup", n.porSetup, s)}<h2>Por tipo de mercado</h2>${stTbl("Mercado", n.porMercado, s)}<h2>Por ativo</h2>${stTbl(
      "Ativo",
      n.porAtivo
        .slice()
        .sort((v, g) => g.n - v.n)
        .slice(0, 15),
      s,
    )}${
      x.length
        ? `<h2>Opções por estrutura</h2>${stTbl(
            "Estrutura",
            agrupa(x, (v) => v.estr),
            s,
          )}`
        : ""
    }`;
  } else f = `<h2>Pontos de atenção</h2>${stDiagHtml(l)}${stIAHtml(n, l)}`;
  return e + t + c + p + u + f;
}
((function () {
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-st]");
    if (!t) return;
    const a = t.dataset.st;
    if (a === "ia") {
      const o = stCtx(),
        s = estat(o.rows);
      stIA(s, diagnosticos(s, o.fm));
      return;
    }
    ((ST.aba = a), ls.set("diario-st-aba", a), render());
  });
})(),
  (function () {
    const e = TraderStyles.css("legacy-124"),
      t = TraderStyles.slot("legacy-124");
    ((t.id = "tema"), (t.textContent = e));
    const a = () => TraderStyles.mount(t);
    (a(), setTimeout(a, 0), addEventListener("load", a));
    const o = {
        home: "M3 11l9-8 9 8M5 10v10h14V10",
        bar: "M4 20V10M10 20V4M16 20v-7M2 20h20",
        up: "M3 17l6-6 4 4 8-8M15 7h6v6",
        down: "M3 7l6 6 4-4 8 8M15 17h6v-6",
        cam: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
        wave: "M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
        target:
          "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01",
        wallet: "M3 7h15a3 3 0 013 3v7a3 3 0 01-3 3H3zM3 7V5h13v2M17 14h.01",
        receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4",
        clip: "M9 4h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h6",
        gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H3a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1.3z",
        bank: "M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
        book: "M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5",
        spark:
          "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 3v4M17 5h4",
        puzzle:
          "M10 4a2 2 0 114 0v2h4v4h-2a2 2 0 100 4h2v4h-4v-2a2 2 0 10-4 0v2H6v-4h2a2 2 0 100-4H6V6h4z",
        ok: "M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-6",
        alert:
          "M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01",
        no: "M12 21a9 9 0 100-18 9 9 0 000 18zM9 9l6 6M15 9l-6 6",
        info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5h.01",
        flame:
          "M12 3c1 4 6 6 6 11a6 6 0 01-12 0c0-3 2-5 3-6 0 3 1 4 2 4 0-4-1-6 1-9z",
        folder: "M3 6h6l2 2h10v11H3z",
        cal: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4",
        news: "M4 5h13v14a2 2 0 002 2H6a2 2 0 01-2-2zM17 9h3v10a2 2 0 01-2 2M7 9h7M7 13h7M7 17h4",
        bell: "M6 16v-5a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0",
        bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
        moon: "M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z",
        sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
        pen: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
        redo: "M20 11a8 8 0 00-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.9L20 16M20 20v-4h-4",
        dl: "M12 3v12M7 10l5 5 5-5M4 21h16",
        ul: "M12 21V9M7 14l5-5 5 5M4 3h16",
        print: "M6 9V3h12v6M6 17H4v-6h16v6h-2M7 14h10v7H7z",
        play: "M7 4l13 8-13 8z",
        trophy:
          "M8 4h8v5a4 4 0 01-8 0zM8 6H4a4 4 0 004 4M16 6h4a4 4 0 01-4 4M12 13v4M8 21h8",
        wait: "M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9",
        stop: "M8 3h8l5 5v8l-5 5H8l-5-5V8zM8 12h8",
        search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5",
        link: "M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1",
        bulb: "M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.7 1 2.5h6c0-.8.2-1.7 1-2.5A6 6 0 0012 3z",
        key: "M8 15a4 4 0 100-8 4 4 0 000 8zM11 11h10M18 11v3M15 11v2",
        user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
        help: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01",
        bot: "M5 8h14v11H5zM12 4v4M9 13h.01M15 13h.01M9 16h6",
        globe:
          "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
        candle: "M8 3v4M8 17v4M6 7h4v10H6zM16 3v5M16 14v7M14 8h4v6h-4z",
        dollar: "M12 3v18M16 7h-6a3 3 0 000 6h4a3 3 0 010 6H8",
        box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
        pin: "M12 21s7-6 7-11a7 7 0 00-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z",
        lock: "M5 11h14v10H5zM8 11V7a4 4 0 018 0v4",
        mail: "M3 5h18v14H3zM3 5l9 7 9-7",
        star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
        eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
        clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 3",
        file: "M6 3h9l4 4v14H6zM14 3v5h5",
        paper:
          "M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8",
        save: "M5 3h12l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7",
        calc: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01",
        inbox: "M4 13h4l2 3h4l2-3h4M4 13l3-8h10l3 8v7H4z",
        phone: "M7 2h10v20H7zM11 18h2",
        chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
        list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
        grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
        menu: "M4 7h16M4 12h16M4 17h16",
        swap: "M7 4l-4 4 4 4M3 8h14M17 20l4-4-4-4M21 16H7",
        shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
        heart:
          "M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z",
        coffee:
          "M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 10h2a2 2 0 010 4h-2M8 2v3M12 2v3",
      },
      s = {
        "📸": "cam",
        "📷": "cam",
        "🌊": "wave",
        "🎯": "target",
        "💰": "wallet",
        "💵": "wallet",
        "💸": "wallet",
        "💲": "dollar",
        "🧾": "receipt",
        "📋": "clip",
        "📊": "bar",
        "📈": "up",
        "📉": "down",
        "⚙": "gear",
        "🏛": "bank",
        "📚": "book",
        "📘": "book",
        "📖": "book",
        "📕": "book",
        "📗": "book",
        "✨": "spark",
        "🧩": "puzzle",
        "✅": "ok",
        "✔": "ok",
        "☑": "ok",
        "⚠": "alert",
        "❌": "no",
        "❗": "alert",
        "‼": "alert",
        ℹ: "info",
        "🔥": "flame",
        "📂": "folder",
        "📁": "folder",
        "🗂": "folder",
        "📅": "cal",
        "🗓": "cal",
        "📆": "cal",
        "📰": "news",
        "🔔": "bell",
        "⚡": "bolt",
        "🌙": "moon",
        "☀": "sun",
        "🌅": "sun",
        "✏": "pen",
        "📝": "pen",
        "🖊": "pen",
        "🔁": "redo",
        "🔄": "redo",
        "⬇": "dl",
        "📥": "inbox",
        "⬆": "ul",
        "📤": "ul",
        "🖨": "print",
        "▶": "play",
        "🏆": "trophy",
        "⏳": "wait",
        "⌛": "wait",
        "🛑": "stop",
        "⛔": "stop",
        "🔎": "search",
        "🔍": "search",
        "🔗": "link",
        "💡": "bulb",
        "🔑": "key",
        "🔐": "lock",
        "🔒": "lock",
        "👤": "user",
        "❓": "help",
        "❔": "help",
        "🤖": "bot",
        "🌎": "globe",
        "🌍": "globe",
        "🌐": "globe",
        "🕯": "candle",
        "📦": "box",
        "📌": "pin",
        "📍": "pin",
        "✉": "mail",
        "📧": "mail",
        "⭐": "star",
        "🌟": "star",
        "👁": "eye",
        "⏰": "clock",
        "🕒": "clock",
        "⏱": "clock",
        "📄": "file",
        "📃": "file",
        "📑": "file",
        "📎": "paper",
        "💾": "save",
        "🧮": "calc",
        "📱": "phone",
        "📏": "chart",
        "🧭": "target",
        "🏠": "home",
        "🎉": "spark",
        "🧠": "bulb",
        "🛡": "shield",
        "❤": "heart",
        "☕": "coffee",
        "🔀": "swap",
        "📣": "bell",
        "🧪": "spark",
        "🗒": "list",
        "📜": "file",
        "🔬": "search",
      },
      n = {
        "🟢": "var(--g)",
        "🟡": "var(--am)",
        "🟠": "#cca65e",
        "🔴": "var(--r)",
        "⚪": "var(--mut)",
        "🔵": "var(--ac)",
        "🟣": "#bcb7ae",
        "⚫": "var(--tx)",
      },
      r = (b) =>
        `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${o[b]}"/></svg>`;
    window.icoSvg = r;
    const i =
        /(?:\p{Regional_Indicator}{2}|(?:\p{Extended_Pictographic})(?:\ufe0f|\u20e3|\p{Emoji_Modifier}|\u200d\p{Extended_Pictographic}\ufe0f?)*)\s?/gu,
      l = /^[\u{1F600}-\u{1F64F}\u{1F910}-\u{1F92F}\u{1F970}-\u{1F97A}]/u,
      d = "INPUT,TEXTAREA,SELECT,SCRIPT,STYLE,SVG,svg,OPTION,IFRAME,CODE,PRE";
    function c(b) {
      const y = b.nodeValue;
      if (
        !y ||
        !/[\u2190-\u2bff\u{1F000}-\u{1FAFF}\ufe0f]/u.test(y) ||
        ((i.lastIndex = 0), !i.test(y))
      )
        return;
      i.lastIndex = 0;
      const j = document.createDocumentFragment();
      let k = 0,
        A,
        C = 0;
      for (; (A = i.exec(y)); ) {
        const I = A[0].trim(),
          J = I.replace(/[\ufe0f\u20e3]|\p{Emoji_Modifier}/gu, "").split(
            "‍",
          )[0];
        if (
          !l.test(J) &&
          !(
            /^[\u2190-\u21ff\u25a0-\u25ff\u2600-\u2603\u2190-\u2199]$/u.test(
              J,
            ) && !s[J]
          )
        ) {
          if (
            (A.index > k &&
              j.appendChild(document.createTextNode(y.slice(k, A.index))),
            n[J])
          ) {
            const se = document.createElement("span");
            ((se.className = "dot"),
              (se.style.background = n[J]),
              j.appendChild(se));
          } else if (s[J]) {
            const se = document.createElement("span");
            ((se.innerHTML = r(s[J])), j.appendChild(se.firstChild));
          }
          ((k = A.index + A[0].length), (C = 1));
        }
      }
      C &&
        (k < y.length && j.appendChild(document.createTextNode(y.slice(k))),
        b.parentNode.replaceChild(j, b));
    }
    function p(b) {
      if (
        !b ||
        (b.nodeType !== 1 && b.nodeType !== 11) ||
        (b.closest &&
          b.closest(".tradingview-widget-container,[contenteditable]"))
      )
        return;
      const y = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, {
          acceptNode: (k) => {
            const A = k.parentElement;
            return !A ||
              A.closest(d) ||
              A.closest(".tradingview-widget-container,.noico")
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT;
          },
        }),
        j = [];
      for (; y.nextNode(); ) j.push(y.currentNode);
      (j.forEach(c), u(b));
    }
    function u(b) {
      (b.querySelectorAll
        ? b.querySelectorAll(
            ".card > div.sm.mut:last-child, .card > p.sm.mut:last-child, .card > p.mut:last-child",
          )
        : []
      ).forEach((y) => {
        if (
          y.dataset.h ||
          y.classList.contains("hint") ||
          ((y.dataset.h = 1),
          y.textContent.trim().length < 150 ||
            y.querySelector(
              "input,button,select,textarea,a,b[data-rs-t],[data-rs-up]",
            ))
        )
          return;
        const j = document.createElement("button");
        ((j.className = "hint-t"),
          (j.type = "button"),
          (j.innerHTML = r("info") + "Sobre estes dados"),
          y.classList.add("hint"),
          y.parentNode.insertBefore(j, y));
      });
    }
    document.addEventListener("click", (b) => {
      const y = b.target.closest(".hint-t");
      if (!y) return;
      const j = y.nextElementSibling;
      j &&
        (j.classList.toggle("on"),
        (y.innerHTML =
          r("info") +
          (j.classList.contains("on") ? "Ocultar" : "Sobre estes dados")));
    });
    let m = new Set(),
      f = 0;
    const x = () => {
      f = 0;
      const b = [...m];
      (m.clear(),
        b.forEach((y) => {
          y.isConnected && p(y);
        }));
    };
    (new MutationObserver((b) => {
      for (const y of b)
        y.addedNodes.forEach((j) => {
          j.nodeType === 1
            ? m.add(j)
            : j.nodeType === 3 && j.parentElement && m.add(j.parentElement);
        });
      m.size && !f && ((f = 1), requestAnimationFrame(x));
    }).observe(document.documentElement, { childList: !0, subtree: !0 }),
      document.addEventListener("DOMContentLoaded", () => p(document.body)));
    const v = [
        ["home", "home", "Início"],
        ["dia", "moon", "Meu dia"],
        ["novo", "", ""],
        ["trades", "chart", "Operações"],
        ["mercado", "news", "Mercado"],
      ],
      g = (b) =>
        b === "home"
          ? "home"
          : ["dia", "regras"].includes(b)
            ? "dia"
            : ["trades", "swing", "opc", "ativos", "stats", "rev"].includes(b)
              ? "trades"
              : ["mercado", "live", "juros", "graf"].includes(b)
                ? "mercado"
                : "";
    function h() {
      let b = document.getElementById("bnav");
      b ||
        ((b = document.createElement("div")),
        (b.id = "bnav"),
        b.setAttribute("role", "navigation"),
        b.setAttribute("aria-label", "Navegação principal"),
        document.body.appendChild(b),
        b.addEventListener("click", (k) => {
          const A = k.target.closest("button");
          if (!A) return;
          const C = A.dataset.k;
          C !== "novo" &&
            ((tab =
              C === "trades" ? (typeof LT < "u" && LT ? LT : "trades") : C),
            typeof render == "function" && render(),
            scrollTo(0, 0));
        }));
      const y = g(typeof tab < "u" ? tab : "home");
      b.innerHTML = v
        .map(([k, A, C]) =>
          k === "novo"
            ? '<button data-k="novo" data-a="fab" class="mais" aria-label="Novo trade"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>'
            : `<button data-k="${k}" class="${y === k ? "on" : ""}" aria-label="${C}"${y === k ? ' aria-current="page"' : ""}>${r(A).replace('class="ico"', "")}<span>${C}</span></button>`,
        )
        .join("");
      const j = !!(
        document.getElementById("rl") ||
        document.getElementById("qz") ||
        (typeof T < "u" && T)
      );
      document.body.classList.toggle("semnav", j);
    }
    if (((window.navPinta = h), typeof render0 == "function")) {
      const b = render0;
      render0 = function () {
        b.apply(this, arguments);
        try {
          h();
        } catch {}
      };
    }
    document.addEventListener("click", () =>
      setTimeout(() => {
        try {
          h();
        } catch {}
      }, 0),
    );
  })());
const HUB_M = [
    ["mercado:mu", "Mundo"],
    ["mercado:ag", "Agenda"],
    ["mercado:nt", "Notícias"],
    ["mercado:se", "Sentimento"],
    ["mercado:cot", "Cotações"],
    ["juros", "Juros e DI"],
    ["live", "Ao vivo"],
    ["graf", "Gráficos"],
    ["mercado:al", "Alertas"],
  ],
  HUB_D = [
    ["dia", "Meu dia"],
    ["regras", "Regras"],
  ];
function hubSeg(e, t) {
  return `<div class="seg hub" style="margin:2px 0 12px">${e.map(([a, o]) => `<button class="${a === t ? "on" : ""}" data-hub="${a}">${o}</button>`).join("")}</div>`;
}
var segM, segD;
(function () {
  const e = TraderStyles.slot("legacy-011");
  ((e.textContent = TraderStyles.css("legacy-011")), TraderStyles.mount(e));
  const t = (p) => (window.icoSvg ? window.icoSvg(p) : ""),
    a = [
      ["home", "home", "Início", "Resumo do dia"],
      [
        "ops",
        "chart",
        "Operações",
        "Day trade, swing, opções, forex e estatísticas",
      ],
      ["live", "bolt", "Ao vivo", "Trades de olho, radar e cotações do Profit"],
      ["mercado", "news", "Mercado", "Mundo, agenda, notícias, juros e DI"],
      [
        "sazsen",
        "wave",
        "Sazonalidade e sentimento",
        "Padrões do calendário e humor do mercado",
      ],
      ["dia", "moon", "Meu dia", "Rotina, diário e regras"],
      ["estudos", "book", "Estudos", "Livros, resumos e simulados"],
      [
        "ferr",
        "grid",
        "Ferramentas",
        "Mesa, plano de transição, impostos e mais",
      ],
    ],
    o = [
      [
        "mesa",
        "shield",
        "Mesa proprietária",
        "Regras, meta e quanto posso perder hoje",
      ],
      ["carreira", "star", "Plano de transição", "Quando dá para sair da CLT"],
      ["painel", "target", "Painel", "Metas, tamanho da posição e backup"],
      ["contratos", "calc", "Contratos", "Lotes pelo capital e volatilidade"],
      ["carteiras", "wallet", "Carteiras", "Brasil e EUA, evolução"],
      ["analise", "bot", "Análise IA", "Relatório da carteira"],
      ["imposto", "receipt", "Imposto de renda", "Notas, custos e DARF"],
      ["import", "inbox", "Importar do Profit", "Automático pela ponte ou CSV"],
    ],
    s = (p) =>
      p === "home"
        ? "home"
        : p === "live"
          ? "live"
          : ["trades", "swing", "opc", "ativos", "stats", "rev"].includes(p)
            ? "ops"
            : ["mercado", "live", "juros", "graf"].includes(p)
              ? "mercado"
              : ["dia", "regras"].includes(p)
                ? "dia"
                : ["estudos", "livro"].includes(p)
                  ? "estudos"
                  : o.some((u) => u[0] === p)
                    ? "ferr"
                    : "";
  let n = 0;
  function r() {
    const p = document.querySelector("#mdr2 .pn");
    if (!p) return;
    if (window.DIARIO_NAV) {
      window.DIARIO_NAV.menu(p);
      return;
    }
    const u =
      tab === "mercado" &&
      typeof MKT < "u" &&
      ["saz", "se", "lab"].includes(MKT.tab)
        ? "sazsen"
        : s(tab);
    n
      ? (p.innerHTML = `<div class="hd"><button data-m2="voltar">‹ Menu</button><button data-m2="x" aria-label="Fechar">✕</button></div><div style="padding:0 6px 8px"><b style="font-size:20px">Ferramentas</b></div>${o.map(([m, f, x, v]) => `<button class="it${tab === m ? " on" : ""}" data-m2="${m}"><span class="ic">${t(f)}</span><span><b>${x}</b><small>${v}</small></span></button>`).join("")}`)
      : (p.innerHTML = `<div class="hd"><b>Menu</b><button data-m2="x" aria-label="Fechar">✕</button></div>${a.map(([m, f, x, v]) => `<button class="it${u === m ? " on" : ""}" data-m2="${m}"><span class="ic">${t(f)}</span><span><b>${x}</b><small>${v}</small></span>${m === "ferr" ? '<span class="ch">›</span>' : ""}</button>`).join("")}<div class="ft"><button data-m2="conta">${t("user")}Conta</button><button data-m2="mais">${t("sun")}Aparência</button></div>`);
  }
  function i() {
    (l(), (n = s(tab) === "ferr" ? 1 : 0));
    const p = document.createElement("div");
    ((p.id = "mdr2"),
      (p.innerHTML =
        '<div class="bk" data-m2="x"></div><aside class="pn" role="dialog" aria-label="Menu"></aside>'),
      document.body.appendChild(p),
      (document.body.style.overflow = "hidden"),
      r());
  }
  function l() {
    const p = document.getElementById("mdr2");
    p && p.remove();
    const u = document.getElementById("mdr");
    (u && u.remove(), (document.body.style.overflow = ""));
  }
  function d(p) {
    ((tab = p),
      ["trades", "swing", "opc"].includes(p) && (LT = p),
      l(),
      render(),
      scrollTo(0, 0));
  }
  (document.addEventListener(
    "click",
    (p) => {
      if (p.target.closest("#mbtn")) {
        (p.stopPropagation(), p.preventDefault(), i());
        return;
      }
      const u = p.target.closest("[data-m2]");
      if (u) {
        const f = u.dataset.m2;
        return f === "x"
          ? l()
          : f === "ferr"
            ? ((n = 1), r())
            : f === "voltar"
              ? ((n = 0), r())
              : f === "ops"
                ? d(typeof LT < "u" && LT ? LT : "trades")
                : f === "estudos"
                  ? (typeof ESV < "u" && (ESV = "liv"), d("estudos"))
                  : d(f);
      }
      const m = p.target.closest("[data-hub]");
      if (m) {
        const [f, x] = m.dataset.hub.split(":");
        (x && typeof MKT < "u" && ((MKT.tab = x), ls.set("diario-mkt-tab", x)),
          p.stopPropagation(),
          d(f));
        return;
      }
    },
    !0,
  ),
    document.addEventListener("keydown", (p) => {
      p.key === "Escape" && document.getElementById("mdr2") && l();
    }));
  const c = render0;
  render0 = function () {
    c.apply(this, arguments);
    const p = document.querySelector("#app .hub"),
      u = p && p.querySelector(".on");
    if (u) {
      const m = u.offsetLeft - (p.clientWidth - u.offsetWidth) / 2;
      p.scrollLeft = Math.max(0, m);
    }
    if (p) {
      const m = () =>
        p.classList.toggle(
          "fim",
          p.scrollLeft + p.clientWidth >= p.scrollWidth - 4,
        );
      (m(), p.addEventListener("scroll", m, { passive: !0 }));
    }
  };
})();
const TAGS_ERRO = [
    [
      "Emocional",
      [
        "Entrei por dica/emoção (fora do sistema)",
        "Saí cedo por emoção",
        "Precisava estar certo (realizei cedo/segurei perda)",
        "Revanche depois de uma perda",
        "Medo de ficar de fora (FOMO)",
      ],
    ],
    [
      "Gestão de risco",
      [
        "Não saí no stop",
        "Risco grande demais",
        "Mexi no stop",
        "Aumentei a mão no prejuízo",
      ],
    ],
    [
      "Processo e análise",
      [
        "Não segui minha rotina",
        "Operei fora do tipo de mercado",
        "Foquei na entrada, não no risco/retorno",
        "Entrei sem saída predeterminada",
        "Operei demais (perdi o controle)",
        "Entrei atrasado",
      ],
    ],
    ["Outros", ["Outro"]],
  ],
  catErro = (e) => {
    for (const [t, a] of TAGS_ERRO) if (a.includes(e)) return t;
    return "Outros";
  },
  tagsDe = (e) =>
    Array.isArray(e.tags) && e.tags.length
      ? e.tags
      : e.err && e.err !== "Nenhum"
        ? [e.err]
        : [],
  chkSetups = () => (S.ax || {})["chk.setups"] || {},
  chkDe = (e) => {
    const t = chkSetups(),
      a = Object.keys(t).find(
        (o) =>
          o.trim().toLowerCase() ===
          String(e || "")
            .trim()
            .toLowerCase(),
      );
    return a ? t[a].filter(Boolean) : [];
  },
  chkFrac = (e) => {
    const t = chkDe(e.setup);
    if (!t.length) return null;
    const a = e.chk || {};
    return t.filter((o, s) => a[s]).length / t.length;
  },
  setupsConhecidos = () =>
    [
      ...new Set([
        ...Object.keys(chkSetups()),
        ...S.trades.map((e) => (e.setup || "").trim()).filter(Boolean),
      ]),
    ].slice(0, 40);
(function () {
  const e = sheet;
  ((sheet = function () {
    let t = e();
    const a = T;
    if (!a) return t;
    const o = setupsConhecidos();
    t = t.replace(
      '<label>Setup / estratégia<input name="setup"',
      () =>
        `<datalist id="dl-setups">${o.map((i) => `<option value="${esc(i)}">`).join("")}</datalist><label>Setup / estratégia<input name="setup" list="dl-setups"`,
    );
    const s = chkDe(a.setup);
    if (s.length) {
      const i = a.chk || {},
        l = s.filter((c, p) => i[p]).length,
        d = `<div class="card" style="margin:8px 0"><div class="top"><b>Checklist do setup</b><span class="sm ${l === s.length ? "g" : "mut"}">${l}/${s.length}</span></div>${s.map((c, p) => `<label class="ck" style="margin-top:8px"><input type="checkbox" data-ck="${p}"${i[p] ? " checked" : ""}><span>${esc(c)}</span></label>`).join("")}</div>`;
      t = t.replace(
        /(<label>Setup \/ estrat\xe9gia<input[^>]*><\/label>)/,
        (c) => c + d,
      );
    }
    const n = tagsDe(a),
      r = `<label>Erros cometidos (erro = não seguir suas regras)</label>${TAGS_ERRO.map(([i, l]) => `<div class="sm mut" style="margin:8px 0 2px">${i}</div><div class="chips2">${l.map((d) => `<button class="${n.includes(d) ? "on r" : ""}" data-tg="${esc(d)}">${esc(d)}</button>`).join("")}</div>`).join("")}${n.length ? "" : '<div class="sm g" style="margin-top:6px">Nenhum erro marcado.</div>'}`;
    return (
      (t = t.replace(
        /<label>Erro cometido[^<]*<select name="err">[\s\S]*?<\/select><\/label>/,
        () => r,
      )),
      t
    );
  }),
    document.addEventListener("click", (t) => {
      const a = t.target.closest("#sh [data-tg]");
      if (!a || !T) return;
      const o = a.dataset.tg,
        s = tagsDe(T).slice(),
        n = s.indexOf(o);
      (n < 0 ? s.push(o) : s.splice(n, 1),
        (T.tags = s),
        (T.err = s[0] || "Nenhum"),
        showSheet());
    }),
    document.addEventListener("change", (t) => {
      const a = t.target.closest("#sh [data-ck]");
      if (a && T) {
        (((T.chk ?? (T.chk = {}))[a.dataset.ck] = a.checked), showSheet());
        return;
      }
      const o = t.target.closest('#sh input[name="setup"]');
      o && T && ((T.setup = o.value), T.chk || (T.chk = {}), showSheet());
    }));
})();
const raizAtivo = (e) => {
  const t = String(e || "")
      .toUpperCase()
      .trim(),
    a =
      t.match(/^([A-Z]{3})[FGHJKMNQUVXZ]\d{2}$/) ||
      t.match(/^([A-Z]{2,4})[FGHJKMNQUVXZ]\d{1,2}$/);
  return a ? a[1] : t;
};
function padraoAtivo(e) {
  const t = raizAtivo(e),
    a = [...S.trades]
      .filter((o) => raizAtivo(o.ativo) === t && t)
      .sort((o, s) => (s.dt || "").localeCompare(o.dt || ""))[0];
  return {
    pv:
      a && +a.pv
        ? +a.pv
        : t === "WIN"
          ? 0.2
          : t === "WDO"
            ? 10
            : t === "MES"
              ? 5
              : t === "MNQ"
                ? 2
                : t === "ES"
                  ? 50
                  : t === "NQ"
                    ? 20
                    : 1,
    qty: a && +a.qty ? +a.qty : 1,
    setup: (a && a.setup) || "",
    tipo: (a && a.tipo) || "D",
    mkt: a ? a.mkt : void 0,
    cost: a && a.cost != null ? a.cost : 0,
  };
}
let QK = null;
function qkAbre() {
  if (typeof pBloq == "function" && !pBloq()) return;
  const e = [
    ...new Set(
      [...S.trades]
        .sort((a, o) => (o.dt || "").localeCompare(a.dt || ""))
        .map((a) => (a.ativo || "").toUpperCase())
        .filter(Boolean),
    ),
  ].slice(0, 6);
  ((QK = {
    ativo: e[0] || "",
    side: "C",
    entry: "",
    stop: "",
    qty: "",
    exit: "",
    tipo: "D",
    rec: e,
  }),
    Object.assign(QK, {
      qty: padraoAtivo(QK.ativo).qty,
      tipo: padraoAtivo(QK.ativo).tipo,
    }));
  let t = document.getElementById("qk");
  (t ||
    ((t = document.createElement("div")),
    (t.id = "qk"),
    document.body.appendChild(t)),
    (document.body.style.overflow = "hidden"),
    qkDesenha());
}
function qkFecha() {
  const e = document.getElementById("qk");
  (e && e.remove(), (QK = null), (document.body.style.overflow = ""));
  try {
    navPinta();
  } catch {}
}
function qkCalc() {
  const e = padraoAtivo(QK.ativo),
    t = numN(QK.entry),
    a = numN(QK.stop),
    o = numN(QK.qty) || 0,
    s = numN(QK.exit),
    n = QK.side === "C" ? 1 : -1,
    r = moedaAtv(QK.ativo),
    i = t != null && a != null ? Math.abs(t - a) * o * e.pv : null,
    l = t != null && s != null ? (s - t) * n * o * e.pv - (+e.cost || 0) : null;
  return { p: e, risco: i, res: l, mo: r };
}
function qkDesenha() {
  const e = document.getElementById("qk");
  if (!e || !QK) return;
  const t = qkCalc(),
    a = (o, s, n) =>
      `<label>${s}<input data-qk="${o}" value="${esc(QK[o])}" inputmode="decimal" placeholder="${n || ""}"></label>`;
  e.innerHTML = `<div class="qk-bk" data-qkx="1"></div><div class="qk-pn" role="dialog" aria-label="Registro rápido">
<div class="top"><b style="font-size:20px">Registro rápido</b><button class="x" data-qkx="1" aria-label="Fechar">✕</button></div>
<label>Ativo<input data-qk="ativo" value="${esc(QK.ativo)}" autocapitalize="characters" autocomplete="off" placeholder="WINZ26"></label>
${QK.rec.length ? `<div class="chips2">${QK.rec.map((o) => `<button class="${o === QK.ativo ? "on" : ""}" data-qka="${esc(o)}">${esc(o)}</button>`).join("")}</div>` : ""}
<div class="seg" style="margin-top:10px"><button class="${QK.side === "C" ? "on" : ""}" data-qks="C" style="${QK.side === "C" ? "color:var(--g)" : ""}">Compra</button><button class="${QK.side === "V" ? "on" : ""}" data-qks="V" style="${QK.side === "V" ? "color:var(--r)" : ""}">Venda</button></div>
<div class="g3">${a("entry", "Entrada")}${a("stop", "Stop")}${a("qty", "Qtd.")}</div>
${a("exit", "Saída (se já saiu)", "deixe vazio se está aberto")}
<div class="sm" style="margin:10px 0 2px;line-height:1.5">${t.risco != null ? `Risco: <b>${mnyC(t.risco, t.mo)}</b>${pctConta(t.risco, t.mo, QK.tipo) ? " (" + pctConta(t.risco, t.mo, QK.tipo).replace("+", "") + ")" : ""}` : '<span class="mut">Preencha entrada e stop para ver o risco.</span>'}${t.res != null ? ` · Resultado: <b class="${cls(t.res)}">${mnyC(t.res, t.mo)}</b>` : ""}</div>
<div class="sm mut">Usa ${t.p.pv} ${t.mo === "USD" ? "US$" : "R$"} por ponto${t.p.setup ? ' e o setup "' + esc(t.p.setup) + '"' : ""} do seu último ${esc(raizAtivo(QK.ativo) || "trade")}.</div>
<div id="qkmsg" class="r sm" style="margin-top:6px"></div>
<div class="g2" style="margin-top:10px"><button class="btn" data-qkok="1">Salvar</button><button class="btn s" data-qkok="2">Salvar e completar</button></div></div>`;
}
