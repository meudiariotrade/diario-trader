async function iaPerdas() {
  const e = diarioPacote(),
    t = e.trades.filter((s) => s.v < 0);
  if (t.length < 5) {
    toast("Precisa de pelo menos 5 perdas no período.");
    return;
  }
  const a = document.getElementById("iaperd");
  a &&
    (a.innerHTML =
      '<div class="sm mut">A IA está agrupando as suas perdas…</div>');
  try {
    const s = (
      (await anxCall({ modo: "diario", sub: "perdas", perdas: t.slice(-120) }))
        .grupos || []
    )
      .map((n) => {
        const r = (n.ids || []).filter((l) => t.some((d) => d.id === l)),
          i = -sum(t.filter((l) => r.includes(l.id)).map((l) => l.v));
        return { ...n, ids: r, custo: i, n: r.length };
      })
      .filter((n) => n.n)
      .sort((n, r) => r.custo - n.custo);
    (((S.ax ?? (S.ax = {})).perdasIA = { em: Date.now(), G: s }), save());
  } catch (s) {
    toast("IA: " + (s.message || s), 5e3);
  }
  const o = scrollY;
  (render(), scrollTo(0, o));
}
function iaPerdasHtml() {
  const e = (S.ax || {}).perdasIA,
    t = (e && e.G) || [],
    a = sum(t.map((o) => o.custo)) || 1;
  return `<h2>Tipos de perda (IA)</h2><div class="card" id="iaperd">${t.length ? t.map((o) => `<div style="margin:8px 0"><div class="top sm"><b>${esc(o.nome || "")}</b><b class="r">${dshM(-o.custo)}</b></div><div class="dshbar"><i style="width:${((o.custo / a) * 100).toFixed(1)}%;background:var(--r)"></i></div><div class="sm">${esc(o.descricao || "")} <span class="mut">(${o.n} trade(s))</span></div>${o.evitar ? `<div class="sm g" style="margin-top:2px">Como evitar: ${esc(o.evitar)}</div>` : ""}</div>`).join("") + `<div class="sm mut">Agrupado em ${new Date(e.em).toLocaleDateString("pt-BR")}. Os custos são calculados pelo app.</div>` : '<div class="sm mut">A IA lê as suas perdas (setup, horário, erro, emoção e anotações) e separa em padrões, com quanto cada um custou.</div>'}<button class="btn s" data-iad="perdas" style="width:100%;margin-top:8px">${t.length ? "Agrupar de novo" : "Agrupar as minhas perdas"}</button></div>`;
}
async function iaChat() {
  var e;
  const t = document.getElementById("iachq"),
    a = ((t && t.value) || "").trim();
  if (a.length < 3) return;
  const o = (e = S.ax ?? (S.ax = {})).chat ?? (e.chat = []),
    s = document.getElementById("iachr");
  s &&
    (s.innerHTML = '<div class="sm mut">Pensando com os seus números…</div>');
  try {
    const r = await anxCall({
      modo: "diario",
      sub: "chat",
      pergunta: a,
      hist: o.slice(-4),
      dados: diarioPacote(),
    });
    (o.push({ p: a, r: String(r.resposta || ""), em: Date.now() }),
      o.length > 20 && o.splice(0, o.length - 20),
      save());
  } catch (r) {
    toast("IA: " + (r.message || r), 5e3);
  }
  const n = scrollY;
  (render(), scrollTo(0, n));
}
function iaChatHtml() {
  return `<h2>Pergunte ao diário (IA)</h2><div class="card"><div id="iachr">${
    ((S.ax || {}).chat || [])
      .slice(-6)
      .map(
        (e) =>
          `<div class="sm" style="margin:8px 0"><div style="font-weight:700">${esc(e.p)}</div><div style="white-space:pre-wrap;margin-top:3px">${esc(e.r)}</div></div>`,
      )
      .join('<hr style="border:0;border-top:1px solid var(--bd)">') ||
    '<div class="sm mut">Exemplos: "qual meu melhor setup às terças?", "quanto perdi operando ansioso?", "o que muda nos dias em que durmo mal?"</div>'
  }</div>
<div style="display:flex;gap:6px;margin-top:8px"><input id="iachq" placeholder="Pergunte sobre os seus trades" style="margin:0"><button class="btn" data-iad="chat">Perguntar</button></div><div class="sm mut" style="margin-top:4px">A IA recebe só os números e anotações do período escolhido acima.</div></div>`;
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-iad]");
  t && ((t.disabled = !0), t.dataset.iad === "perdas" ? iaPerdas() : iaChat());
}),
  document.addEventListener("keydown", (e) => {
    e.key === "Enter" && e.target.id === "iachq" && iaChat();
  }));
{
  const e = TraderStyles.slot("legacy-045");
  ((e.textContent = TraderStyles.css("legacy-045")), TraderStyles.mount(e));
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab === "stats") {
        const t = document.querySelector(".seg > [data-st].on");
        t && t.scrollIntoView({ inline: "center", block: "nearest" });
      }
    } catch {}
  };
}
{
  const e = vStats;
  vStats = function () {
    let t = e.apply(this, arguments);
    try {
      if (!["sim", "fat", "diag"].includes(ST.aba)) return t;
      const a = dshCor();
      if (ST.aba === "diag") return t + iaPerdasHtml() + iaChatHtml();
      const o = t.indexOf("<h2>Pontos de atenção</h2>"),
        s = o > 0 ? t.slice(0, o) : t;
      if (ST.aba === "fat") return s + fatHtml();
      const n = simRows();
      return n.length < 5
        ? s +
            '<p class="mut">Precisa de pelo menos 5 trades encerrados no período.</p>'
        : s +
            `<h2>E se…</h2><div class="card">${simESe(n, a)}</div><h2>Testar regras de gestão</h2><div class="card">${simGestao(n)}</div><h2>Risco de ruína e tamanho de mão</h2><div class="card">${simRuina(n)}</div>`;
    } catch (a) {
      return (
        console.error(a),
        t +
          `<div class="warn">Não consegui calcular: ${esc(a.message || a)}</div>`
      );
    }
  };
}
const VZ = { rec: null, mr: null, chunks: [], k: null };
function vzBtns(e) {
  return `<div class="g2 vzb" data-vzk="${e}" style="margin:-4px 0 10px"><button class="btn s" data-vz="fala" data-k="${e}">🎙️ Falar</button><button class="btn s" data-vz="ia" data-k="${e}">✨ Organizar com IA</button></div>`;
}
function vzTexto(e, t, a) {
  const o = document.querySelector(`textarea[data-d="${e}"]`);
  o &&
    ((o.value = a ? (o.value ? o.value.trim() + " " : "") + t : t),
    o.dispatchEvent(new Event("input", { bubbles: !0 })));
}
async function vzFala(e, t) {
  const a = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (VZ.rec) {
    try {
      VZ.rec.stop();
    } catch {}
    ((VZ.rec = null), (t.textContent = "🎙️ Falar"));
    return;
  }
  if (VZ.mr) {
    VZ.mr.stop();
    return;
  }
  if (a) {
    const o = new a();
    ((o.lang = "pt-BR"),
      (o.continuous = !0),
      (o.interimResults = !1),
      (o.onresult = (s) => {
        for (let n = s.resultIndex; n < s.results.length; n++)
          s.results[n].isFinal && vzTexto(e, s.results[n][0].transcript, 1);
      }),
      (o.onend = () => {
        ((VZ.rec = null), (t.textContent = "🎙️ Falar"));
      }),
      (o.onerror = () => {
        ((VZ.rec = null), (t.textContent = "🎙️ Falar"), vzGrava(e, t));
      }),
      (VZ.rec = o));
    try {
      (o.start(),
        (t.textContent = "⏹ Parar"),
        toast("Pode falar. Toque em Parar quando terminar."));
    } catch {
      ((VZ.rec = null), vzGrava(e, t));
    }
    return;
  }
  vzGrava(e, t);
}
async function vzGrava(e, t) {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    toast(
      "Este aparelho não grava áudio aqui. Use o microfone do teclado.",
      4e3,
    );
    return;
  }
  try {
    const a = await navigator.mediaDevices.getUserMedia({ audio: !0 }),
      o = new MediaRecorder(a);
    ((VZ.mr = o),
      (VZ.chunks = []),
      (o.ondataavailable = (s) => s.data.size && VZ.chunks.push(s.data)),
      (o.onstop = async () => {
        (a.getTracks().forEach((n) => n.stop()),
          (VZ.mr = null),
          (t.textContent = "🎙️ Falar"));
        const s = new Blob(VZ.chunks, { type: o.mimeType || "audio/mp4" });
        if (!(s.size < 2e3)) {
          ((t.disabled = !0), (t.textContent = "Transcrevendo…"));
          try {
            const n = await new Promise((i) => {
                const l = new FileReader();
                ((l.onload = () => i(String(l.result).split(",")[1])),
                  l.readAsDataURL(s));
              }),
              r = await anxCall({
                modo: "diario",
                sub: "debrief",
                audio: {
                  mime: (o.mimeType || "audio/mp4").split(";")[0],
                  data: n,
                },
                dia: vzDia(),
              });
            (r.transcricao && vzTexto(e, r.transcricao, 1), vzAplica(r));
          } catch (n) {
            toast("IA: " + (n.message || n), 5e3);
          }
          ((t.disabled = !1), (t.textContent = "🎙️ Falar"));
        }
      }),
      o.start(),
      (t.textContent = "⏹ Parar e transcrever"),
      setTimeout(() => {
        VZ.mr === o && o.stop();
      }, 18e4));
  } catch (a) {
    toast("Sem acesso ao microfone: " + (a.message || a), 4e3);
  }
}
function vzDia() {
  const e = S.trades
      .filter((a) => String(a.dtx || a.dt).slice(0, 10) === D)
      .map((a) => {
        const o = calc(a);
        return {
          h: String(a.dt).slice(11, 16),
          at: a.ativo,
          lado: a.side,
          setup: a.setup || "",
          r: o.r != null ? +o.r.toFixed(2) : null,
          v: o.pl,
          erro: a.err && a.err !== "Nenhum" ? a.err : "",
          regras: a.rules,
        };
      }),
    t = S.days[D] || {};
  return { data: D, trades: e, plano: String(t.plano || "").slice(0, 600) };
}
function vzAplica(e) {
  if (!e) return;
  const t = dia$(D),
    a = {
      bem: e.bem,
      aprend: e.aprendizado,
      cond: e.condicoes_erros,
      prevn: e.para_nao_repetir,
    };
  let o = 0;
  (Object.entries(a).forEach(([n, r]) => {
    r && !String(t[n] || "").trim() && ((t[n] = String(r).slice(0, 800)), o++);
  }),
    Array.isArray(e.emocoes) &&
      e.emocoes.length &&
      (t.emoIA = e.emocoes.slice(0, 5).map(String)),
    Array.isArray(e.erros) &&
      e.erros.length &&
      (t.errIA = e.erros.slice(0, 5).map(String)),
    (t.u = Date.now()),
    save());
  const s = scrollY;
  (render(),
    scrollTo(0, s),
    toast(
      o ? `A IA preencheu ${o} campo(s) vazio(s) do debriefing.` : "Pronto.",
    ));
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-vz]");
  if (!t) return;
  const a = t.dataset.k;
  if (t.dataset.vz === "fala") return vzFala(a, t);
  const o = document.querySelector(`textarea[data-d="${a}"]`),
    s = ((o && o.value) || "").trim();
  if (s.length < 15) {
    toast("Escreva ou fale um pouco sobre o dia primeiro.");
    return;
  }
  ((t.disabled = !0), (t.textContent = "Organizando…"));
  try {
    vzAplica(
      await anxCall({
        modo: "diario",
        sub: "debrief",
        texto: s.slice(0, 6e3),
        dia: vzDia(),
      }),
    );
  } catch (n) {
    toast("IA: " + (n.message || n), 5e3);
  }
  ((t.disabled = !1), (t.textContent = "✨ Organizar com IA"));
});
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia") return;
      const t = document.querySelector('#app textarea[data-d="resumo"]');
      if (t && !document.querySelector('.vzb[data-vzk="resumo"]')) {
        const a = t.closest("label") || t,
          o = document.createElement("div");
        ((o.innerHTML = vzBtns("resumo")), a.after(o.firstElementChild));
        const s = S.days[D] || {};
        if ((s.emoIA || []).length || (s.errIA || []).length) {
          const n = document.createElement("div");
          ((n.className = "sm"),
            (n.style.margin = "-4px 0 10px"),
            (n.innerHTML = `${(s.emoIA || []).length ? "Emoções: " + s.emoIA.map(esc).join(", ") : ""}${(s.errIA || []).length ? '<br>Erros: <span class="r">' + s.errIA.map(esc).join(", ") + "</span>" : ""}`),
            document.querySelector('.vzb[data-vzk="resumo"]').after(n));
        }
      }
    } catch {}
  };
}
const FC = { id: null, vis: 0, resp: null },
  FC_INT = [1, 3, 7, 14, 30],
  fcFoto = (e) => e.pplan || e.pin || e.pout;
function fcFila() {
  const e = hjD(),
    t = (S.ax || {}).fc || {};
  return S.trades
    .filter((a) => fcFoto(a) && calc(a).pl != null)
    .map((a) => ({ t: a, s: t[a.id] || { b: 0, n: "" } }))
    .filter((a) => !a.s.n || a.s.n <= e)
    .sort((a, o) => a.s.b - o.s.b || calc(a.t).pl - calc(o.t).pl);
}
function fcHtml() {
  return '<div id="fcw">' + fcHtml0() + "</div>";
}
function fcHtml0() {
  const e = fcFila();
  if (!S.trades.some((s) => fcFoto(s)))
    return '<h2>Flashcards dos seus trades</h2><div class="card sm mut">Adicione fotos aos trades (entrada ou planejamento) para treinar com eles aqui.</div>';
  if (!e.length)
    return '<h2>Flashcards dos seus trades</h2><div class="card sm">✅ Nada para revisar hoje. Os próximos voltam conforme você acerta.</div>';
  const t = (FC.id && e.find((s) => s.t.id === FC.id)) || e[0];
  FC.id = t.t.id;
  const a = t.t,
    o = calc(a);
  return `<h2>Flashcards dos seus trades</h2><div class="card" id="fcc"><div class="top sm"><span class="mut">${e.length} para revisar hoje</span><span class="mut">caixa ${t.s.b + 1} de 5</span></div>
<img data-img="${fcFoto(a)}" style="width:100%;border-radius:12px;border:1px solid var(--bd);margin:8px 0;min-height:120px;background:var(--card2)">
<div class="sm"><b>${esc(a.ativo || "")}</b> · ${a.side === "V" ? "venda" : "compra"} · ${esc(a.setup || "sem setup")} · ${esc(String(a.dt).slice(11, 16))}</div>
${
  FC.vis
    ? `<div class="card" style="margin:10px 0 6px;border-color:${o.pl >= 0 ? "var(--g)" : "var(--r)"}"><b class="${cls(o.pl)}">${o.pl >= 0 ? "Deu certo" : "Deu errado"}: ${mT(a, o.pl)}${o.r != null ? " (" + dshN(o.r) + "×)" : ""}</b><div class="sm">Stop anotado: ${esc(a.stop || "–")} · erro: ${esc(a.err || "Nenhum")}${a.nota ? "<br>" + esc(String(a.nota).slice(0, 220)) : ""}</div></div>
<div class="sm" style="margin-bottom:6px">${(FC.resp === "sim") == o.pl > 0 ? '<b class="g">Sua leitura bateu com o resultado.</b>' : '<b class="r">Sua leitura não bateu.</b> Vale entender o porquê.'}</div><div class="g2"><button class="btn" data-fc="ok">Entendi (próximo)</button><button class="btn s" data-fc="rev">Rever logo</button></div>`
    : '<div class="sm" style="margin:10px 0 6px"><b>Olhando só o gráfico: você entraria de novo?</b> Pense também onde ficaria o stop.</div><div class="g2"><button class="btn" data-fc="sim">Entraria</button><button class="btn s" data-fc="nao">Não entraria</button></div>'
}</div>`;
}
document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-fc]");
  if (!a) return;
  const o = a.dataset.fc;
  if (o === "sim" || o === "nao") ((FC.vis = 1), (FC.resp = o));
  else {
    const n = (t = S.ax ?? (S.ax = {})).fc ?? (t.fc = {}),
      r = S.trades.find((i) => i.id === FC.id);
    if (r) {
      const i = n[r.id] || { b: 0 },
        l = calc(r),
        d = (FC.resp === "sim") == l.pl > 0 && o === "ok",
        c = d ? Math.min(4, i.b + 1) : 0;
      ((n[r.id] = { b: c, n: diasMais(hjD(), FC_INT[c]) }), save());
    }
    ((FC.id = null), (FC.vis = 0), (FC.resp = null));
  }
  const s = document.getElementById("fcw");
  if (s) {
    s.outerHTML = fcHtml();
    try {
      fillImgs();
    } catch {}
  }
});
{
  const e = vEstudos;
  vEstudos = function () {
    const t = e.apply(this, arguments);
    try {
      return t + fcHtml();
    } catch {
      return t;
    }
  };
}
const DW = {
  k: null,
  id: null,
  img: null,
  acoes: [],
  cor: "#e7614c",
  modo: "livre",
  cur: null,
};
async function dwAbre(e) {
  const t = FX && S.trades.find((i) => i.id === FX.id);
  if (!t || !t[e]) return;
  const a = M[t[e]] || (await idb("img", "get", t[e]));
  if (!a) {
    toast("Foto não encontrada neste aparelho.");
    return;
  }
  const o = new Image();
  ((o.src = URL.createObjectURL(a)),
    await new Promise((i) => (o.onload = i)),
    (DW.k = e),
    (DW.id = t.id),
    (DW.img = o),
    (DW.acoes = []),
    (DW.cur = null));
  const s = document.createElement("div");
  ((s.id = "dwov"),
    (s.innerHTML = `<div class="dw-bar"><button class="x" data-dw="x">✕</button><div class="chips2">${[
      ["#e7614c", "vermelho"],
      ["#3aad74", "verde"],
      ["#c69a49", "amarelo"],
      ["#709bc2", "azul"],
    ]
      .map(
        ([i, l]) =>
          `<button data-dwc="${i}" class="${DW.cor === i ? "on" : ""}" aria-label="${l}" style="width:30px;height:30px;padding:0;background:${i};border-radius:50%"></button>`,
      )
      .join("")}</div></div>
<div class="chips2" style="justify-content:center">${[
      ["livre", "✏️ Livre"],
      ["linha", "➖ Linha de preço"],
      ["texto", "🔤 Texto"],
    ]
      .map(
        ([i, l]) =>
          `<button data-dwm="${i}" class="${DW.modo === i ? "on" : ""}">${l}</button>`,
      )
      .join("")}</div>
<div class="dw-cv"><canvas id="dwcv"></canvas></div><div class="g2"><button class="btn s" data-dw="desf">Desfazer</button><button class="btn" data-dw="salva">Salvar na foto</button></div><div class="sm mut" style="text-align:center">A foto original fica guardada: dá para voltar a ela depois.</div>`),
    document.body.appendChild(s),
    (document.body.style.overflow = "hidden"));
  const n = document.getElementById("dwcv");
  ((n.width = o.naturalWidth), (n.height = o.naturalHeight), dwPinta());
  const r = (i) => {
    const l = n.getBoundingClientRect();
    return [
      ((i.clientX - l.left) / l.width) * n.width,
      ((i.clientY - l.top) / l.height) * n.height,
    ];
  };
  (n.addEventListener("pointerdown", (i) => {
    i.preventDefault();
    const l = r(i);
    if (DW.modo === "texto") {
      const d = prompt("Texto:", "Entrada");
      d && (DW.acoes.push({ t: "tx", p: l, tx: d, c: DW.cor }), dwPinta());
      return;
    }
    if (DW.modo === "linha") {
      const d = prompt("Nome da linha (opcional):", "Stop");
      (DW.acoes.push({ t: "ln", y: l[1], tx: d || "", c: DW.cor }), dwPinta());
      return;
    }
    ((DW.cur = { t: "lv", pts: [l], c: DW.cor }),
      DW.acoes.push(DW.cur),
      n.setPointerCapture(i.pointerId));
  }),
    n.addEventListener("pointermove", (i) => {
      DW.cur && (DW.cur.pts.push(r(i)), dwPinta());
    }),
    n.addEventListener("pointerup", () => {
      DW.cur = null;
    }));
}
function dwPinta() {
  const e = document.getElementById("dwcv");
  if (!e) return;
  const t = e.getContext("2d"),
    a = Math.max(2, e.width / 300);
  (t.drawImage(DW.img, 0, 0),
    DW.acoes.forEach((o) => {
      if (
        ((t.strokeStyle = t.fillStyle = o.c),
        (t.lineWidth = a * 1.4),
        (t.lineCap = t.lineJoin = "round"),
        o.t === "lv" &&
          (t.beginPath(),
          o.pts.forEach((s, n) =>
            n ? t.lineTo(s[0], s[1]) : t.moveTo(s[0], s[1]),
          ),
          t.stroke()),
        o.t === "ln" &&
          (t.setLineDash([a * 5, a * 3]),
          t.beginPath(),
          t.moveTo(0, o.y),
          t.lineTo(e.width, o.y),
          t.stroke(),
          t.setLineDash([]),
          o.tx))
      ) {
        t.font = `bold ${a * 9}px system-ui,sans-serif`;
        const s = t.measureText(o.tx).width;
        (t.fillRect(e.width - s - a * 8, o.y - a * 12, s + a * 6, a * 12),
          (t.fillStyle = "#fff"),
          t.fillText(o.tx, e.width - s - a * 5, o.y - a * 3));
      }
      o.t === "tx" &&
        ((t.font = `bold ${a * 10}px system-ui,sans-serif`),
        (t.lineWidth = a * 3),
        (t.strokeStyle = "rgba(0,0,0,0.6)"),
        t.strokeText(o.tx, o.p[0], o.p[1]),
        t.fillText(o.tx, o.p[0], o.p[1]));
    }));
}
(document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-dwc]");
  if (t) {
    ((DW.cor = t.dataset.dwc),
      document
        .querySelectorAll("[data-dwc]")
        .forEach((r) => r.classList.toggle("on", r === t)));
    return;
  }
  const a = e.target.closest("[data-dwm]");
  if (a) {
    ((DW.modo = a.dataset.dwm),
      document
        .querySelectorAll("[data-dwm]")
        .forEach((r) => r.classList.toggle("on", r === a)));
    return;
  }
  const o = e.target.closest("[data-dw]");
  if (!o) return;
  const s = o.dataset.dw,
    n = () => {
      const r = document.getElementById("dwov");
      (r && r.remove(), (document.body.style.overflow = FX ? "hidden" : ""));
    };
  if (s === "x") return n();
  if (s === "desf") {
    (DW.acoes.pop(), dwPinta());
    return;
  }
  if (s === "salva") {
    const r = document.getElementById("dwcv"),
      i = await new Promise((c) => r.toBlob(c, "image/jpeg", 0.88)),
      l = S.trades.find((c) => c.id === DW.id);
    if (!l || !i) return n();
    const d = uid();
    ((M[d] = i),
      await idb("img", "put", i, d),
      l[DW.k + "0"] || (l[DW.k + "0"] = l[DW.k]),
      (l[DW.k] = d),
      (l.u = Date.now()),
      save(),
      n(),
      delete U[d]);
    try {
      fxDesenha();
    } catch {}
    toast("Marcações salvas na foto.");
  }
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-dwab]");
    t && dwAbre(t.dataset.dwab);
    const a = e.target.closest("[data-dwor]");
    if (a) {
      const o = FX && S.trades.find((n) => n.id === FX.id),
        s = a.dataset.dwor;
      o &&
        o[s + "0"] &&
        confirm("Voltar para a foto original, sem as marcações?") &&
        ((o[s] = o[s + "0"]),
        delete o[s + "0"],
        (o.u = Date.now()),
        save(),
        fxDesenha());
    }
  }));
{
  const e = fxHtml;
  fxHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = FX && S.trades.find((o) => o.id === FX.id);
      if (!a) return t;
      ["pplan", "pin", "pout"].forEach((o) => {
        a[o] &&
          (t = t.replace(
            `<img data-img="${a[o]}" style="width:100%;border-radius:12px;border:1px solid var(--bd);display:block;min-height:80px;background:var(--card2)">`,
            (s) =>
              s +
              `<div style="display:flex;gap:6px;margin-top:4px"><button class="btn s" data-dwab="${o}" style="flex:1;padding:6px">✏️ Marcar na foto</button>${a[o + "0"] ? `<button class="btn s" data-dwor="${o}" style="padding:6px">Original</button>` : ""}</div>`,
          ));
      });
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-046");
  ((e.textContent = TraderStyles.css("legacy-046")), TraderStyles.mount(e));
}
{
  const e = photos;
  photos = async function () {
    const t = S.trades.flatMap((o) =>
        ["pin0", "pout0", "pplan0"].map((s) => o[s]).filter(Boolean),
      ),
      a = S.trades;
    try {
      return (
        t.length && (S.trades = a.concat(t.map((o) => ({ pin: o })))),
        await e.apply(this, arguments)
      );
    } finally {
      S.trades = a;
    }
  };
}
function pbDados() {
  const e = {};
  return (
    S.trades.forEach((t) => {
      const a = calc(t);
      if (a.pl == null) return;
      const o = String(t.setup || "").trim();
      o && (e[o] ?? (e[o] = [])).push({ t, c: a });
    }),
    Object.entries(e)
      .filter(([, t]) => t.length >= 2)
      .sort((t, a) => a[1].length - t[1].length)
  );
}
function pbHtml() {
  const e = pbDados();
  if (!e.length) return "";
  const t = (S.ax || {}).pb || {};
  return `<h2>Playbook dos seus setups</h2><div class="sm mut" style="margin:-4px 0 8px">Montado com os seus trades. Revise antes de abrir o mercado.</div>${e
    .map(([a, o]) => {
      const s = o.map((f) => emBRL(f.c.pl, moedaT(f.t))),
        n = o.filter((f) => f.c.r != null).map((f) => f.c.r),
        r = {};
      o.forEach((f) => {
        const x = String(f.t.dt).slice(11, 13);
        (r[x] ?? (r[x] = [])).push(emBRL(f.c.pl, moedaT(f.t)));
      });
      const i = Object.entries(r)
          .filter(([, f]) => f.length >= 2)
          .sort((f, x) => sum(x[1]) / x[1].length - sum(f[1]) / f[1].length)[0],
        l = {};
      (o.forEach((f) => {
        const x = raizAtivo(f.t.ativo) || f.t.ativo;
        l[x] = (l[x] || 0) + emBRL(f.c.pl, moedaT(f.t));
      }),
        (ba = Object.entries(l).sort((f, x) => x[1] - f[1])[0]));
      const d = o.filter((f) => fcFoto(f.t)),
        c = d.sort((f, x) => (x.c.r ?? x.c.pl) - (f.c.r ?? f.c.pl))[0],
        p = d[d.length - 1],
        u = sum(s),
        m = s.filter((f) => f > 0).length / s.length;
      return `<details class="card"><summary><b>${esc(a)}</b> <span class="sm ${cls(u)}" style="float:right">${money(u)}</span><div class="sm mut">${o.length} trades · ${pct0(m)} de acerto${n.length ? " · " + dshN(sum(n) / n.length) + "× risco por trade" : ""}</div></summary>
<div class="sm" style="margin:8px 0">${i ? `Melhor horário: <b>${i[0]}h</b> · ` : ""}${ba ? `melhor ativo: <b>${esc(ba[0])}</b>` : ""}</div>
${
  c
    ? `<div class="g2" style="gap:8px">${[
        ["Melhor exemplo", c],
        p && p !== c ? ["Pior exemplo", p] : null,
      ]
        .filter(Boolean)
        .map(
          ([f, x]) =>
            `<div><div class="sm mut">${f} · <span class="${cls(x.c.pl)}">${x.c.r != null ? dshN(x.c.r) + "×" : mT(x.t, x.c.pl)}</span></div><img data-img="${fcFoto(x.t)}" style="width:100%;border-radius:12px;border:1px solid var(--bd);min-height:60px;background:var(--card2)"></div>`,
        )
        .join("")}</div>`
    : ""
}
<label class="sm" style="margin-top:8px">Quando usar e quando NÃO usar (suas palavras)<textarea data-pbk="${esc(a)}" placeholder="Ex.: só a favor da tendência do 15 min; nunca nos primeiros 15 minutos">${esc(t[a] || "")}</textarea></label></details>`;
    })
    .join("")}`;
}
(document.addEventListener("input", (e) => {
  var t;
  const a = e.target.closest("[data-pbk]");
  a &&
    ((((t = S.ax ?? (S.ax = {})).pb ?? (t.pb = {}))[a.dataset.pbk] = a.value),
    clearTimeout(a._s),
    (a._s = setTimeout(save, 600)));
}),
  document.addEventListener(
    "toggle",
    (e) => {
      if (e.target.matches && e.target.matches("details") && e.target.open)
        try {
          fillImgs();
        } catch {}
    },
    !0,
  ));
const CT_GAT = [
  ["stops2", "Depois de 2 stops seguidos no dia"],
  ["limite", "Quando bater o limite de perda do dia"],
  ["regra", "Quando quebrar uma regra"],
  ["tilt", "Quando o app detectar tilt"],
  ["bom", "Num dia muito bom (acima de 2× o seu dia médio positivo)"],
];
function ctAtivos() {
  const e = hjD(),
    t = S.trades
      .filter((l) => l.dtx && String(l.dtx).slice(0, 10) === e)
      .sort((l, d) => String(l.dtx).localeCompare(String(d.dtx))),
    a = t.map((l) => emBRL(calc(l).pl, moedaT(l))),
    o = [];
  a.length >= 2 &&
    a[a.length - 1] < 0 &&
    a[a.length - 2] < 0 &&
    o.push("stops2");
  try {
    travaEstado().duro.some((l) => /perda/i.test(l)) && o.push("limite");
  } catch {}
  (S.trades.some((l) => String(l.dt).slice(0, 10) === e && l.rules === "n") &&
    o.push("regra"),
    S.trades.some((l) => String(l.dt).slice(0, 10) === e && l.tilt) &&
      o.push("tilt"));
  const s = eqDias(),
    n = Object.values(s).filter((l) => l > 0),
    r = n.length ? sum(n) / n.length : 0,
    i = sum(a);
  return (r > 0 && i > 2 * r && n.length >= 5 && o.push("bom"), o);
}
function ctConfere() {
  const e = (S.ax || {}).cartas || [];
  if (!e.length || document.getElementById("ctov")) return;
  const t = ctAtivos(),
    a = hjD(),
    o = e.find((n) => t.includes(n.g) && n.visto !== a);
  if (!o) return;
  ((o.visto = a), save());
  const s = document.createElement("div");
  ((s.id = "ctov"),
    (s.className = "ov"),
    (s.innerHTML = `<div class="sh" style="max-width:520px"><div class="top"><h2 style="margin:0">✉️ Uma carta sua</h2><button class="x" data-ct="x">✕</button></div><div class="sm mut">Escrita em ${fmtD(o.em)} para este momento: ${esc((CT_GAT.find((n) => n[0] === o.g) || [])[1] || "")}.</div><div class="card" style="white-space:pre-wrap;line-height:1.55;font-size:16px;margin-top:10px">${esc(o.tx)}</div>${o.au ? '<audio id="ctau" controls style="width:100%;margin-top:8px"></audio>' : ""}<button class="btn" data-ct="x" style="width:100%;margin-top:10px">Li. Vou respeitar.</button></div>`),
    document.body.appendChild(s),
    o.au &&
      idb("img", "get", o.au).then((n) => {
        const r = document.getElementById("ctau");
        r && n && ((r.src = URL.createObjectURL(n)), r.play().catch(() => {}));
      }));
}
setInterval(() => {
  try {
    document.hidden || ctConfere();
  } catch {}
}, 3e4);
function ctHtml() {
  return `<h2>Cartas para o seu eu do futuro</h2><div class="card"><div class="sm mut" style="margin-bottom:6px">Escreva (ou grave) agora, com a cabeça fria. O app mostra a carta quando a situação acontecer.</div>
${((S.ax || {}).cartas || []).map((e) => `<div class="sm" style="padding:6px 0;border-bottom:1px solid var(--bd)"><b>${esc((CT_GAT.find((t) => t[0] === e.g) || [])[1] || "")}</b>${e.au ? " · 🎙️ com áudio" : ""}<div class="mut">${esc(String(e.tx).slice(0, 120))}</div><button class="btn s" data-ct="del" data-id="${e.id}" style="padding:3px 8px;margin-top:4px">Apagar</button></div>`).join("")}
<label class="sm" style="margin-top:8px">Quando mostrar<select id="ctg">${CT_GAT.map(([e, t]) => `<option value="${e}">${t}</option>`).join("")}</select></label><textarea id="cttx" placeholder="Ex.: Você já viu esse filme. Depois de 2 stops você sempre devolve o mês. Fecha a plataforma e vai caminhar."></textarea>
<div class="g2"><button class="btn s" data-ct="grava">🎙️ Gravar áudio (opcional)</button><button class="btn" data-ct="salva">Guardar a carta</button></div><div class="sm mut" id="ctst"></div></div>`;
}
const CTR = { mr: null, id: null };
document.addEventListener("click", async (e) => {
  var t;
  const a = e.target.closest("[data-ct]");
  if (!a) return;
  const o = a.dataset.ct;
  if (o === "x") {
    const s = document.getElementById("ctov");
    s && s.remove();
    return;
  }
  if (o === "del") {
    if (!confirm("Apagar esta carta?")) return;
    ((S.ax.cartas = (S.ax.cartas || []).filter((s) => s.id !== a.dataset.id)),
      save(),
      render());
    return;
  }
  if (o === "grava") {
    if (CTR.mr) {
      CTR.mr.stop();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: !0 }),
        n = new MediaRecorder(s),
        r = [];
      ((CTR.mr = n),
        (n.ondataavailable = (i) => i.data.size && r.push(i.data)),
        (n.onstop = async () => {
          (s.getTracks().forEach((d) => d.stop()), (CTR.mr = null));
          const i = new Blob(r, { type: n.mimeType || "audio/mp4" }),
            l = uid();
          (await idb("img", "put", i, l),
            (CTR.id = l),
            (a.textContent = "🎙️ Regravar"),
            (document.getElementById("ctst").textContent =
              "Áudio gravado (fica só neste aparelho)."));
        }),
        n.start(),
        (a.textContent = "⏹ Parar"));
    } catch {
      toast("Sem acesso ao microfone.");
    }
    return;
  }
  if (o === "salva") {
    const s = (document.getElementById("cttx").value || "").trim();
    if (s.length < 5 && !CTR.id) {
      toast("Escreva a carta.");
      return;
    }
    (((t = S.ax ?? (S.ax = {})).cartas ?? (t.cartas = [])).push({
      id: uid(),
      g: document.getElementById("ctg").value,
      tx: s,
      au: CTR.id || "",
      em: hjD(),
    }),
      (CTR.id = null),
      save(),
      render(),
      toast("Carta guardada."));
  }
});
{
  const e = vRegras;
  vRegras = function () {
    const t = e.apply(this, arguments);
    try {
      return t + pbHtml() + ctHtml();
    } catch {
      return t;
    }
  };
}
function nivGrava(e) {
  var t;
  try {
    const a = (t = S.ax ?? (S.ax = {})).niv ?? (t.niv = {});
    let o = 0;
    ((e || []).forEach((s) => {
      var n;
      const r = String(s.ticker || "").toUpperCase();
      if (!/^(WIN|WDO|IND|DOL)/.test(r)) return;
      const i =
          s.dat && /^\d{4}-\d{2}-\d{2}/.test(String(s.dat))
            ? String(s.dat).slice(0, 10)
            : s.dat && /^\d{2}\/\d{2}\/\d{4}/.test(String(s.dat))
              ? String(s.dat).slice(6, 10) +
                "-" +
                String(s.dat).slice(3, 5) +
                "-" +
                String(s.dat).slice(0, 2)
              : hjD(),
        l = r.slice(0, 3),
        d = (n = a[l] ?? (a[l] = {}))[i] ?? (n[i] = {}),
        c = +s.max,
        p = +s.min,
        u = +s.ult,
        m = +s.abe;
      if (!(c > 0 && p > 0 && u > 0)) return;
      ((d.tk = r),
        (d.o = m > 0 ? m : d.o),
        (d.h = Math.max(d.h || 0, c)),
        (d.l = d.l ? Math.min(d.l, p) : p),
        (d.c = u),
        +s.fec > 0 && (d.pc = +s.fec),
        (o = 1));
      const f = Object.keys(a[l]).sort();
      for (; f.length > 40; ) delete a[l][f.shift()];
    }),
      o && save());
  } catch {}
}
setInterval(async () => {
  try {
    if (document.hidden || !SESS || !window.CLOUD_OK) return;
    const e = new Date().getHours();
    if (e < 9 || e > 18) return;
    const t = await (
      await rq("/rest/v1/cotacoes?select=*&user_id=eq." + SESS.uid)
    ).json();
    nivGrava(t);
  } catch {}
}, 5 * 6e4);
{
  const e = lvPoll;
  lvPoll = async function () {
    const t = await e.apply(this, arguments);
    try {
      nivGrava(LV.all);
    } catch {}
    return t;
  };
}
function nivDia(e, t) {
  const a = ((S.ax || {}).niv || {})[e] || {},
    o = Object.keys(a)
      .filter((x) => x < t)
      .sort(),
    s = o.length ? a[o[o.length - 1]] : null,
    n = ((S.ax || {}).nivMan || {})[e],
    r = a[t],
    i = n && n.d === t ? n : s;
  if (!i || !(i.h > 0)) return null;
  const l = +i.h,
    d = +i.l,
    c = +((r && r.pc) || i.c),
    p = (l + d + c) / 3,
    u = e === "WDO" || e === "DOL" ? 10 : e === "WIN" || e === "IND" ? 500 : 0,
    m = [
      ["Máxima de ontem", l],
      ["Mínima de ontem", d],
      ["Fechamento de ontem", c],
      ["Pivô", p],
      ["R1", 2 * p - d],
      ["S1", 2 * p - l],
      ["R2", p + (l - d)],
      ["S2", p - (l - d)],
    ];
  r && r.o && m.push(["Abertura de hoje", r.o]);
  const f = (r && r.c) || c;
  if (u) {
    const x = Math.round(f / u) * u;
    [-2, -1, 0, 1, 2].forEach((v) => m.push(["Número redondo", x + v * u]));
  }
  return {
    raiz: e,
    tk: (r || i).tk || e,
    px: f,
    rng: l - d,
    N: m
      .map(([x, v]) => [x, +(+v).toFixed(e === "WDO" || e === "DOL" ? 1 : 0)])
      .sort((x, v) => v[1] - x[1]),
  };
}
function nivBucket(e) {
  const t = raizAtivo(e.ativo);
  if (!/^(WIN|WDO|IND|DOL)$/.test(t || "")) return null;
  const a = nivDia(t, String(e.dt).slice(0, 10)),
    o = numN(e.entry);
  if (!a || o == null) return null;
  const s = Math.min(...a.N.map((r) => Math.abs(r[1] - o))),
    n = Math.max(a.rng * 0.08, t === "WDO" || t === "DOL" ? 3 : 100);
  return s <= n ? "Perto de um nível" : "No meio, longe dos níveis";
}
function nivHtml() {
  const e = hjD(),
    t = ["WIN", "WDO"].map((o) => nivDia(o, e)).filter(Boolean),
    a = `<details class="sm" style="margin-top:8px"><summary>Digitar máxima, mínima e fechamento de ontem</summary><div class="g3" style="margin-top:6px">${["h", "l", "c"].map((o) => `<label>${{ h: "Máxima", l: "Mínima", c: "Fechamento" }[o]}<input type="number" inputmode="decimal" data-nivm="${o}" placeholder="WIN"></label>`).join("")}</div><div class="g2"><button class="btn s" data-nivs="WIN">Salvar para o WIN</button><button class="btn s" data-nivs="WDO">Salvar para o WDO</button></div></details>`;
  return t.length
    ? `<h2>Níveis do dia</h2><div class="card">${t
        .map(
          (o) =>
            `<div style="margin-bottom:8px"><b class="sm">${esc(o.tk)}</b> <span class="sm mut">agora ${dshN(o.px, o.raiz === "WDO" ? 1 : 0)}</span>${dshTab(
              ["Nível", "Preço", "Distância"],
              o.N.map(([s, n]) => {
                const r = n - o.px;
                return `<tr${Math.abs(r) <= Math.max(o.rng * 0.08, o.raiz === "WDO" ? 3 : 100) ? ' style="background:color-mix(in srgb,var(--am) 14%,transparent)"' : ""}><td>${s}</td><td>${dshN(n, o.raiz === "WDO" ? 1 : 0)}</td><td class="${r > 0 ? "g" : "r"}">${r > 0 ? "+" : ""}${dshN(r, o.raiz === "WDO" ? 1 : 0)}</td></tr>`;
              }),
            )}</div>`,
        )
        .join(
          "",
        )}<div class="sm mut">Amarelo: nível perto do preço. As Estatísticas → Fatores mostram se você ganha mais entrando perto de nível ou no meio do range.</div>${a}</div>`
    : `<h2>Níveis do dia</h2><div class="card sm"><div class="mut">Com a ponte do Profit ligada, o app guarda a máxima, a mínima e o fechamento de cada dia e monta os níveis de hoje. Enquanto isso, você pode digitar.</div>${a}</div>`;
}
document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-nivs]");
  if (!a) return;
  const o = (s) =>
    +((document.querySelector(`[data-nivm="${s}"]`) || {}).value || 0);
  if (!(o("h") > 0 && o("l") > 0 && o("c") > 0)) {
    toast("Preencha máxima, mínima e fechamento.");
    return;
  }
  ((((t = S.ax ?? (S.ax = {})).nivMan ?? (t.nivMan = {}))[a.dataset.nivs] = {
    d: hjD(),
    h: o("h"),
    l: o("l"),
    c: o("c"),
  }),
    save(),
    render());
});
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || DV !== "ed" || (typeof MDM < "u" && MDM === "us"))
        return;
      const t = document.getElementById("app"),
        a = t && t.querySelector('.dfase[data-fase="pre"]');
      if (a && !a.querySelector("#nivc")) {
        const o = document.createElement("div");
        ((o.id = "nivc"), (o.innerHTML = nivHtml()), a.appendChild(o));
      }
    } catch (t) {
      console.error(t);
    }
  };
}
const IBV = { busy: 0, err: "" };
async function ibvCarrega() {
  const e = ls.get("diario-ibov");
  if ((e && Date.now() - e.ts < 12 * 36e5) || IBV.busy) return e;
  IBV.busy = 1;
  try {
    const t = cfg();
    if (!t) throw new Error("sem Supabase");
    await tok().catch(() => {});
    const a = await fetch(t.url + "/functions/v1/candles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: t.key,
          ...(typeof SESS < "u" && SESS
            ? { Authorization: "Bearer " + SESS.at }
            : {}),
        },
        body: JSON.stringify({ ativo: "WIN", intervalo: "1d" }),
      }),
      o = await a.json();
    if (!a.ok) throw new Error(o.error || "Erro " + a.status);
    const s = {
      ts: Date.now(),
      c: (o.candles || []).map((n) => [
        new Date(n[0] * 1e3).toISOString().slice(0, 10),
        n[4],
      ]),
    };
    return (
      ls.set("diario-ibov", s),
      (IBV.err = ""),
      (IBV.busy = 0),
      tab === "carreira" && render(),
      s
    );
  } catch (t) {
    return ((IBV.err = t.message || String(t)), (IBV.busy = 0), e);
  }
}
function cdiAno() {
  const e = (typeof JR < "u" && JR.data) || {};
  return e.cdi && +e.cdi.v > 0
    ? +e.cdi.v
    : e.selic && +e.selic.v > 0
      ? +e.selic.v - 0.1
      : null;
}
function bmHtml() {
  const e = +capRef() || 0,
    t = hjD(),
    a = eqDias(),
    o = cdiAno(),
    s = ls.get("diario-ibov");
  !s && !IBV.busy && setTimeout(ibvCarrega, 0);
  const n = [
      ["Este ano", t.slice(0, 4) + "-01-01"],
      ["Últimos 12 meses", diasMais(t, -364)],
    ].map(([l, d]) => {
      const c = sum(
          Object.keys(a)
            .filter((f) => f >= d && f <= t)
            .map((f) => a[f]),
        ),
        p = Math.max(
          1,
          Math.round(
            (((new Date(t + "T12:00:00Z") - new Date(d + "T12:00:00Z")) /
              864e5) *
              252) /
              365,
          ),
        ),
        u = o != null ? Math.pow(1 + o / 100, p / 252) - 1 : null;
      let m = null;
      if (s && s.c && s.c.length) {
        const f = s.c.find((g) => g[0] >= d) || null,
          x = s.c[s.c.length - 1],
          v = [...s.c].reverse().find((g) => g[0] < d) || f;
        v && x && (m = x[1] / v[1] - 1);
      }
      return { n: l, a: d, res: c, tr: e ? c / e : null, cdiP: u, ib: m };
    }),
    r = dshCor(),
    i = (l, d, c) =>
      d == null
        ? ""
        : `<div class="sm" style="display:flex;justify-content:space-between;margin-top:6px"><span>${l}</span><b class="${cls(d)}">${d >= 0 ? "+" : ""}${dshN(d * 100, 1)}%</b></div><div class="dshbar"><i style="width:${Math.min(100, (Math.abs(d) * 100) / Math.max(0.01, ...n.flatMap((p) => [p.tr, p.cdiP, p.ib].filter((u) => u != null).map(Math.abs)))).toFixed(1)}%;background:${d < 0 ? r.r : c}"></i></div>`;
  return `<h2>Seu trading × CDI × Ibovespa</h2><div class="card">${e ? "" : '<div class="sm mut">Defina o capital da conta (Contratos ou Capital) para comparar em porcentagem.</div>'}
${n
  .map(
    (
      l,
    ) => `<div style="margin:6px 0 12px"><b class="sm">${l.n}</b>${i("Seu trading", l.tr, r.ac)}${i("CDI (renda fixa sem risco)", l.cdiP, r.am)}${i("Ibovespa", l.ib, "#b2aca0")}
${e && l.cdiP != null ? `<div class="sm" style="margin-top:6px">${l.res >= e * l.cdiP ? `<b class="g">Você venceu o CDI</b> por ${money(l.res - e * l.cdiP)}.` : `<b class="r">O CDI teria rendido ${money(e * l.cdiP)}</b> com o mesmo capital, sem tela e sem risco (você fez ${money(l.res)}).`}</div>` : ""}</div>`,
  )
  .join("")}
<div class="sm mut">CDI ${o != null ? dshN(o, 2) + "% ao ano (Banco Central)" : "indisponível: abra Mercado → Juros uma vez"} · Ibovespa ${s ? "pelo Yahoo, fechamento diário" : IBV.busy ? "carregando…" : IBV.err ? "indisponível (" + esc(IBV.err) + ")" : "carregando…"} · Seu trading = resultado ÷ capital (${e ? money(e) : "não definido"}).</div></div>`;
}
function salHtml() {
  const e = crCfg(),
    t = Object.assign(
      { saque: 50, reinv: 30, res: 20, rep: 80 },
      (S.ax || {}).sal || {},
    ),
    a = crMeses(e)
      .filter((p) => !p.atual)
      .slice(-6),
    o = (() => {
      const p = {};
      try {
        (S.mesaTr || []).forEach((u) => {
          const m = String(u.dt).slice(0, 7);
          p[m] = (p[m] || 0) + (+u.v || 0);
        });
      } catch {}
      return p;
    })(),
    s = a.map((p) => {
      const u = o[p.k] || 0,
        m = p.liq + (u > 0 ? (u * t.rep) / 100 : u);
      return {
        k: p.k,
        ent: m,
        sal: (Math.max(0, m) * t.saque) / 100,
        rei: (Math.max(0, m) * t.reinv) / 100,
        res: (Math.max(0, m) * t.res) / 100,
      };
    }),
    n = s.length ? sum(s.map((p) => p.sal)) / s.length : 0,
    r = +e.custo || 0,
    i = (p, u) =>
      `<label>${u}<input type="number" inputmode="decimal" data-sal="${p}" value="${t[p]}"></label>`,
    l = +capRef() || 0,
    d = l && s.length ? sum(s.map((p) => p.ent)) / s.length / l : null;
  let c = null;
  if (r && d > 0 && n < r) {
    let p = l;
    for (let u = 1; u <= 120; u++)
      if (((p += (p * d * t.reinv) / 100), (p * d * t.saque) / 100 >= r)) {
        c = u;
        break;
      }
  }
  return `<h2>Salário do trader</h2><div class="card"><div class="sm mut" style="margin-bottom:6px">Como dividir o que entra: uma parte vira salário, uma volta para a conta e uma vai para a reserva.</div><div class="g3">${i("saque", "Salário (%)")}${i("reinv", "Reinvestir (%)")}${i("res", "Reserva (%)")}</div>${i("rep", "Repasse das mesas (%)")}
${
  s.length
    ? dshTab(
        ["Mês", "Entrou", "Salário", "Reinvestir", "Reserva"],
        s.map(
          (p) =>
            `<tr><td>${p.k.slice(5)}/${p.k.slice(2, 4)}</td><td class="${cls(p.ent)}">${money(p.ent)}</td><td>${money(p.sal)}</td><td>${money(p.rei)}</td><td>${money(p.res)}</td></tr>`,
        ),
      )
    : '<div class="sm mut">Sem meses fechados ainda.</div>'
}
<div class="sm" style="margin-top:6px">Salário médio: <b>${money(n)}</b>/mês${r ? ` · cobre <b class="${n >= r ? "g" : ""}">${pct0(n / r)}</b> do seu custo de vida (${money(r)})` : " · preencha o custo de vida acima para comparar"}.${c ? ` Mantendo o ritmo e reinvestindo ${t.reinv}%, o salário cobre o custo de vida em cerca de <b>${c} mês(es)</b>.` : ""}</div>${Math.abs(t.saque + t.reinv + t.res - 100) > 0.5 ? '<div class="warn" style="margin-top:6px">As três partes somam ' + (t.saque + t.reinv + t.res) + "%: ajuste para 100%.</div>" : ""}</div>`;
}
document.addEventListener("change", (e) => {
  var t;
  const a = e.target.closest("[data-sal]");
  if (!a) return;
  ((((t = S.ax ?? (S.ax = {})).sal ?? (t.sal = {}))[a.dataset.sal] =
    +a.value || 0),
    save());
  const o = scrollY;
  (render(), scrollTo(0, o));
});
{
  const e = vCarreira;
  vCarreira = function () {
    const t = e.apply(this, arguments);
    try {
      return t + bmHtml() + salHtml();
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
function irMeses(e) {
  const t = {},
    a = (r, i, l) => {
      const d = t[r] ?? (t[r] = { dt: 0, cm: 0, ex: 0, cost: 0 });
      d[i] += l;
    };
  S.trades.forEach((r) => {
    const i = calc(r);
    if (i.pl == null) return;
    const l = String(r.dtx || r.dt).slice(0, 10);
    if (!l.startsWith(String(e))) return;
    const d = l.slice(0, 7);
    if (ehUS(r)) {
      a(d, "ex", emBRL(i.pl, moedaT(r)));
      return;
    }
    const c =
      (r.tipo || "D") === "D" ||
      String(r.dt).slice(0, 10) === String(r.dtx || "").slice(0, 10);
    (a(d, c ? "dt" : "cm", i.pl), a(d, "cost", +r.cost || 0));
  });
  try {
    lcItems().forEach((r) => {
      r.d &&
        r.d.startsWith(String(e)) &&
        a(r.d.slice(0, 7), "ex", (+r.v || 0) * usdBrl());
    });
  } catch {}
  let o = 0,
    s = 0;
  const n = [];
  for (let r = 1; r <= 12; r++) {
    const i = e + "-" + String(r).padStart(2, "0"),
      l = t[i] || { dt: 0, cm: 0, ex: 0, cost: 0 };
    let d = 0,
      c = 0;
    if (l.dt < 0) o += -l.dt;
    else {
      const u = Math.min(o, l.dt);
      ((o -= u), (d = l.dt - u));
    }
    if (l.cm < 0) s += -l.cm;
    else {
      const u = Math.min(s, l.cm);
      ((s -= u), (c = l.cm - u));
    }
    const p = d * 0.2 + c * 0.15;
    n.push({ m: i, ...l, pdt: o, pcm: s, ir: p, darf: p >= 10 ? p : 0 });
  }
  return n;
}
function custosHtml() {
  const e = +hjD().slice(0, 4),
    t = irMeses(e),
    a = dshCor(),
    o = sum(t.map((g) => g.dt + g.cm + g.ex)),
    s = sum(t.map((g) => g.cost)),
    n = sum(((S.ax || {}).mesas || []).map((g) => +g.taxa || 0)),
    r = sum(t.map((g) => g.darf)),
    i = (() => {
      try {
        return sum(
          (S.mesaTr || [])
            .filter((g) => String(g.dt).startsWith(String(e)))
            .map((g) => +g.v || 0),
        );
      } catch {
        return 0;
      }
    })(),
    l = o + s + i,
    /* v599: o imposto estimado nunca passa do ganho bruto (meses de lucro num ano de prejuízo). */
    r599 = Math.min(r, Math.max(0, l)),
    d = l - s - n - r599,
    c = dshLarg(1),
    p = 170,
    u = [
      ["Ganho bruto", l, a.g],
      ["Corretagem e taxas da bolsa", -s, a.r],
      ["Taxas das mesas", -n, a.r],
      ["Imposto (estimado)", -r599, a.r],
      ["Ficou com você", d, d >= 0 ? a.ac : a.r],
    ].filter((g, h) => h === 0 || h === 4 || g[1]),
    m = Math.max(1, ...u.map((g) => Math.abs(g[1]))),
    f = (c - 20) / u.length;
  /* v599: escala com valores negativos dentro da área do gráfico; rótulo de valor das barras vermelhas
     fica abaixo da barra e o nome da coluna sempre embaixo, sem sobrepor. */
  let x = 0;
  const pares = u.map((g, h) => {
      const b = h === u.length - 1;
      let y, j;
      (h === 0 || b ? ((y = 0), (j = g[1])) : ((y = x), (j = x + g[1])), b || (x = h === 0 ? g[1] : x + g[1]));
      return [y, j];
    }),
    hi = Math.max(0, ...pares.flat()),
    lo = Math.min(0, ...pares.flat()),
    k = (J) => 22 + ((hi - J) / (hi - lo || 1)) * (p - 66);
  const v = u
    .map((g, h) => {
      const [y, j] = pares[h],
        A = Math.min(k(y), k(j)),
        C = Math.max(2, Math.abs(k(y) - k(j))),
        I = 10 + h * f + f * 0.15,
        neg = g[1] < 0,
        ty = neg ? A + C + 13 : A - 5;
      return `<rect x="${I.toFixed(1)}" y="${A.toFixed(1)}" width="${(f * 0.7).toFixed(1)}" height="${C.toFixed(1)}" rx="4" fill="${g[2]}"/><text x="${(I + f * 0.35).toFixed(1)}" y="${ty.toFixed(1)}" font-size="11" text-anchor="middle" font-weight="700" fill="${g[2]}" style="font-variant-numeric:tabular-nums">${dshK(g[1])}</text><text x="${(I + f * 0.35).toFixed(1)}" y="${p - 6}" font-size="10" text-anchor="middle" fill="${a.mut}">${esc(g[0].split(" ")[0])}</text>`;
    })
    .join("");
  return `<h2>Para onde foi o dinheiro em ${e}</h2><div class="card"><svg viewBox="0 0 ${c} ${p}" class="dshsv" role="img">${v}</svg>${dshTab(
    ["", "Valor", "do bruto"],
    u.map(
      (g) =>
        `<tr><td>${g[0]}</td><td class="${cls(g[1])}">${money(g[1])}</td><td>${l > 0 ? pct0(Math.abs(g[1]) / l) : "–"}</td></tr>`,
    ),
  )}
<div class="sm" style="margin-top:6px">${l > 0 ? `De cada R$ 100 que o mercado te deu, <b>R$ ${dshN(((s + n + r599) / l) * 100, 0)}</b> ficaram com corretora, bolsa, mesas e governo.` : "Ano ainda sem ganho bruto."} Taxas das mesas: preencha em Mesa → Esta mesa.</div></div>`;
}
function contadorHtml() {
  const e = [
    ...new Set(
      S.trades
        .map((t) => String(t.dtx || t.dt).slice(0, 4))
        .filter((t) => /^\d{4}$/.test(t)),
    ),
  ]
    .sort()
    .reverse();
  return e.length
    ? `<h2>Pacote para o contador</h2><div class="card"><div class="sm" style="margin-bottom:8px">Renda variável mês a mês (day trade e operações comuns), prejuízos a compensar, imposto estimado e resultado no exterior. Em PDF para ler e em CSV para o contador.</div><div class="g3"><label>Ano<select id="ctano">${e.map((t) => `<option>${t}</option>`).join("")}</select></label><button class="btn s" data-ctr="pdf" style="align-self:end">PDF</button><button class="btn s" data-ctr="csv" style="align-self:end">CSV</button></div><div class="sm mut">Estimativa feita pelo app com os seus trades: o contador confere. A isenção de R$ 20 mil em vendas de ações não é aplicada.</div></div>`
    : "";
}
function contadorTabela(e) {
  const t = irMeses(e),
    a = (o) => money(o);
  return `<div id="ctrw"><h1>Renda variável ${e}</h1><div class="sm mut">Gerado pelo Diário de Trader em ${new Date().toLocaleDateString("pt-BR")}. Estimativa: conferir com o contador.</div>
<h2>Mês a mês</h2><div class="card">${dshTab(["Mês", "Day trade", "Comum (swing e opções)", "Prejuízo a compensar DT", "Prejuízo a compensar comum", "IR estimado", "Exterior (em R$)"], t.map((o) => `<tr><td>${o.m.slice(5)}/${o.m.slice(0, 4)}</td><td>${a(o.dt)}</td><td>${a(o.cm)}</td><td>${a(o.pdt)}</td><td>${a(o.pcm)}</td><td>${a(o.darf)}</td><td>${a(o.ex)}</td></tr>`).concat([`<tr><td><b>Total</b></td><td><b>${a(sum(t.map((o) => o.dt)))}</b></td><td><b>${a(sum(t.map((o) => o.cm)))}</b></td><td></td><td></td><td><b>${a(sum(t.map((o) => o.darf)))}</b></td><td><b>${a(sum(t.map((o) => o.ex)))}</b></td></tr>`]))}</div>
<h2>Observações</h2><div class="card sm">Day trade: 20% sobre o lucro do mês, compensando prejuízos de day trade. Operações comuns: 15%, compensando prejuízos comuns. DARF só quando o imposto do mês passa de R$ 10. Resultado no exterior (EUA e Forex) segue regras próprias e é declarado à parte. Custos já descontados do resultado de cada trade.</div></div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-ctr]");
  if (!t) return;
  const a =
    +(document.getElementById("ctano") || {}).value || +hjD().slice(0, 4);
  if (t.dataset.ctr === "csv") {
    const n = irMeses(a),
      r = (c) => (+c).toFixed(2).replace(".", ","),
      i = [
        "Mes;Day trade;Comum;Prejuizo DT;Prejuizo comum;IR estimado;Exterior em R$",
      ].concat(
        n.map((c) =>
          [c.m, r(c.dt), r(c.cm), r(c.pdt), r(c.pcm), r(c.darf), r(c.ex)].join(
            ";",
          ),
        ),
      ).join(`
`),
      l = new Blob(["\uFEFF" + i], { type: "text/csv" }),
      d = new File([l], `renda-variavel-${a}.csv`, { type: "text/csv" });
    (async () => {
      try {
        if (navigator.canShare && navigator.canShare({ files: [d] })) {
          await navigator.share({ files: [d], title: "Renda variável " + a });
          return;
        }
      } catch (p) {
        if (p && p.name === "AbortError") return;
      }
      const c = document.createElement("a");
      ((c.href = URL.createObjectURL(l)),
        (c.download = d.name),
        document.body.appendChild(c),
        c.click(),
        c.remove());
    })();
    return;
  }
  const o = document.createElement("div");
  o.innerHTML = contadorTabela(a);
  const s = o.firstElementChild;
  ((s.id = "anx_rep"),
    (s.style.display = "none"),
    document.body.appendChild(s));
  try {
    anxPdf();
  } finally {
    s.remove();
  }
  try {
    ((PDFB.tt = "Renda variável " + a),
      (PDFB.name = `renda-variavel-${a}.pdf`));
    const n = document.querySelector("#pdfbody h1");
    (n && (n.textContent = PDFB.tt), pdfBar());
  } catch {}
});
{
  const e = vImposto;
  vImposto = function () {
    const t = e.apply(this, arguments);
    try {
      /* v599: gráfico de custos em Apuração e Custos; pacote do contador em Apuração e Espelho IRPF. */
      const aba = (typeof VW < "u" && VW.IR) || "ap";
      return t + (aba === "ap" || aba === "cu" ? custosHtml() : "") + (aba === "ap" || aba === "es" ? contadorHtml() : "");
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-mmpapel]");
    if (t) {
      ((MM.papel = !MM.papel), t.classList.toggle("on", MM.papel));
      return;
    }
    e.target.closest("[data-msp]") &&
      MM.nova &&
      MM.papel &&
      ((MM.papel = !1),
      setTimeout(() => {
        try {
          mmLista();
          const a = S.ax.mesa;
          if (!a) return;
          ((a.papel = 1),
            (a.fonte = a.moeda === "USD" ? "usd" : "b3"),
            (a.inicio = hjD()),
            +a.prazo > 0 || (a.prazo = 14),
            /no papel/.test(a.nome) || (a.nome += " (no papel)"),
            save(),
            render(),
            toast(
              "Mesa no papel: conta com os trades do seu diário a partir de hoje.",
              5e3,
            ));
        } catch {}
      }, 0));
  },
  !0,
);
{
  const e = mmBarra;
  mmBarra = function () {
    let t = e.apply(this, arguments);
    return (
      MM.nova &&
        (t = t.replace(
          '<button class="btn s" data-mmcanc="1"',
          `<div style="margin:8px 0"><button class="chip${MM.papel ? " on" : ""}" data-mmpapel="1" style="cursor:pointer">🧪 Testar no papel primeiro (sem pagar a taxa)</button></div><button class="btn s" data-mmcanc="1"`,
        )),
      t
    );
  };
}
{
  const e = mmRodape;
  mmRodape = function (t) {
    let a = e.apply(this, arguments);
    try {
      ((a = a.replace(
        '<div class="g2" style="margin-top:8px">',
        `<label class="sm" style="margin-top:8px">Taxas já pagas nesta mesa (R$)<input type="number" inputmode="decimal" data-mmtaxa value="${esc(t.taxa || "")}" placeholder="0"></label><div class="g2" style="margin-top:8px">`,
      )),
        t.papel &&
          (a = a.replace(
            '<h2>Esta mesa</h2><div class="card">',
            `<h2>Esta mesa</h2><div class="card"><div class="sm" style="margin-bottom:8px">🧪 <b>No papel</b>: usa os trades do seu diário com as regras desta mesa. ${(() => {
              try {
                const o = mesaCalc(t);
                return /Meta batida/.test(o.st[0])
                  ? '<b class="g">Você teria aprovado: agora vale pagar a taxa.</b>'
                  : /Reprovado/.test(o.st[0])
                    ? '<b class="r">Você teria sido reprovado: economizou a taxa.</b>'
                    : "Ainda em andamento.";
              } catch {
                return "";
              }
            })()}</div>`,
          )));
    } catch {}
    return a;
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-mmtaxa]");
  if (!t) return;
  const a = mesaCfg();
  a && ((a.taxa = +t.value || 0), save());
});
function pcSemanas(e) {
  const t = hjD(),
    a = [];
  let o = segundaDe(t);
  for (let s = 0; s < e; s++) {
    const n = s === 0 ? t : diasMais(o, 4),
      r = [];
    for (let m = o; m <= n; m = diasMais(m, 1)) r.push(m);
    const i = S.trades.filter((m) => {
        const f = String(m.dt).slice(0, 10);
        return f >= o && f <= n;
      }),
      l = [...new Set(i.map((m) => String(m.dt).slice(0, 10)))],
      d = l.filter(
        (m) =>
          !i.some(
            (f) =>
              String(f.dt).slice(0, 10) === m &&
              (f.rules === "n" || (f.err && f.err !== "Nenhum")),
          ),
      ),
      c = l.filter(
        (m) =>
          String((S.days[m] || {}).resumo || "").trim() ||
          String(
            (((S.days[m] || {}).noite || {}).deb || {}).resumo || "",
          ).trim(),
      ),
      p = i.filter((m) => calc(m).pl != null),
      u = p.map((m) => calc(m).r).filter((m) => m != null && isFinite(m));
    (a.push({
      a: o,
      b: n,
      dias: l.length,
      limpo: d.length,
      deb: c.length,
      trades: i.length,
      regras: i.length
        ? i.filter((m) => m.rules !== "n").length / i.length
        : null,
      trava: !i.some((m) => m.err === "Operei com a trava ativa"),
      tilt: i.filter((m) => m.tilt).length,
      rev: !!((S.ax || {}).rvg || {})[o],
      R: u.length ? +sum(u).toFixed(2) : null,
      v: sum(p.map((m) => emBRL(calc(m).pl, moedaT(m)))),
    }),
      (o = diasMais(o, -7)));
  }
  return a;
}
function pcResumo() {
  const e = (S.ax || {}).parc || {},
    t = pcSemanas(5).map((o) => ({
      ...o,
      v: e.valores ? +o.v.toFixed(2) : null,
    }));
  let a = [];
  try {
    a = mmAtivas().map((o) => {
      const s = mesaCalc(o);
      return {
        n: o.nome,
        st: s.st[0],
        v: e.valores ? +s.saldo.toFixed(2) : null,
        meta:
          s.meta > 0
            ? Math.round((Math.max(0, s.lucroEf) / s.meta) * 100)
            : null,
      };
    });
  } catch {}
  return {
    nome: String(e.nome || "").slice(0, 40),
    em: new Date().toISOString(),
    semanas: t,
    mesas: a,
    valores: !!e.valores,
  };
}
async function pcPublica(e) {
  const t = (S.ax || {}).parc;
  if (!(!t || !t.token || !SESS))
    try {
      (await rq("/rest/v1/parceiro?on_conflict=user_id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          token: t.token,
          resumo: pcResumo(),
          atualizado: new Date().toISOString(),
        }),
      }),
        (t.pub = Date.now()),
        save(),
        e || toast("Resumo atualizado para o seu parceiro."));
    } catch (a) {
      ((t.err =
        a.status === 404 || /parceiro/.test(a.message || "")
          ? 'Falta rodar o SQL "parceiro.sql" no Supabase.'
          : a.message || String(a)),
        e || toast(t.err, 5e3));
    }
}
setInterval(() => {
  try {
    const e = (S.ax || {}).parc;
    e &&
      e.token &&
      !document.hidden &&
      Date.now() - (e.pub || 0) > 3 * 36e5 &&
      pcPublica(!0);
  } catch {}
}, 6e4);
function pcLink() {
  const e = (S.ax || {}).parc;
  return e && e.token
    ? location.origin + location.pathname + "?parceiro=" + e.token
    : "";
}
function pcHtml() {
  const e = (S.ax || {}).parc || {},
    t = pcLink();
  return `<h2>Parceiro de responsabilidade</h2><div class="card"><div class="sm mut" style="margin-bottom:6px">Um mentor ou amigo recebe um link que mostra só a sua disciplina da semana: dias no plano, regras seguidas, trava respeitada, debriefings e revisão. Ele não entra na sua conta nem vê seus trades.</div>
<label>Seu nome (como o parceiro vai ver)<input data-parc="nome" value="${esc(e.nome || "")}" placeholder="Luciano"></label><label class="ck"><input type="checkbox" data-parc="valores"${e.valores ? " checked" : ""}><span>Mostrar também os valores em R$</span></label>
${t ? `<div style="display:flex;gap:6px;margin-top:8px"><input readonly value="${esc(t)}" style="margin:0;font-size:12px"><button class="btn s" data-pc="copia">Copiar</button></div><div class="g2" style="margin-top:8px"><button class="btn s" data-pc="pub">Atualizar agora</button><button class="btn s d" data-pc="off">Parar de compartilhar</button></div><div class="sm mut" style="margin-top:4px">${e.err ? '<span class="r">' + esc(e.err) + "</span>" : e.pub ? "Atualizado em " + new Date(e.pub).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + ". Atualiza sozinho com o app aberto." : ""}</div>` : '<button class="btn" data-pc="cria" style="width:100%;margin-top:8px">Criar link para o parceiro</button>'}</div>
<h2>Modo família</h2><div class="card"><div class="sm mut" style="margin-bottom:8px">Um resumo simples da semana, sem valores, para dividir com quem acompanha a sua decisão de sair da CLT.</div><button class="btn s" data-pc="fam" style="width:100%">Compartilhar a semana</button></div>`;
}
function famTexto() {
  const e = pcSemanas(1)[0];
  return `Minha semana no trading (${fmtD(e.a).slice(0, 5)} a ${fmtD(e.b).slice(0, 5)}):
• Operei ${e.dias} dia(s) e segui o plano em ${e.limpo}
• Regras seguidas em ${e.regras == null ? "–" : Math.round(e.regras * 100) + "%"} dos trades
• ${e.trava ? "Respeitei a trava todos os dias" : "Operei com a trava ativa em algum momento"}
• Debriefing em ${e.deb} dia(s)${
    e.rev
      ? `
• Fiz a revisão da semana`
      : ""
  }
Processo antes do resultado.`;
}
(document.addEventListener("change", (e) => {
  var t;
  const a = e.target.closest("[data-parc]");
  if (!a) return;
  const o = (t = S.ax ?? (S.ax = {})).parc ?? (t.parc = {});
  ((o[a.dataset.parc] = a.type === "checkbox" ? a.checked : a.value),
    save(),
    o.token && pcPublica(!0));
}),
  document.addEventListener("click", async (e) => {
    var t;
    const a = e.target.closest("[data-pc]");
    if (!a) return;
    const o = a.dataset.pc,
      s = (t = S.ax ?? (S.ax = {})).parc ?? (t.parc = {});
    if (o === "cria") {
      if (!SESS) {
        toast("Entre na sua conta para criar o link.");
        return;
      }
      const n = new Uint8Array(18);
      (crypto.getRandomValues(n),
        (s.token = [...n]
          .map((r) => r.toString(36).padStart(2, "0"))
          .join("")
          .slice(0, 28)),
        save(),
        await pcPublica(),
        render());
      return;
    }
    if (o === "copia") {
      try {
        (await navigator.clipboard.writeText(pcLink()), toast("Link copiado."));
      } catch {
        toast("Segure no campo e copie.");
      }
      return;
    }
    if (o === "pub") {
      (await pcPublica(), render());
      return;
    }
    if (o === "off") {
      if (!confirm("Parar de compartilhar? O link deixa de funcionar.")) return;
      if (!SESS?.uid) {
        ((s.err =
          "Entre na sua conta para desativar o compartilhamento com segurança."),
          toast(s.err, 5e3),
          render());
        return;
      }
      try {
        const n = await rq(
            "/rest/v1/parceiro?user_id=eq." +
              encodeURIComponent(SESS.uid) +
              "&token=eq." +
              encodeURIComponent(s.token || ""),
            {
              method: "DELETE",
              headers: {
                Prefer: "return=representation",
                Accept: "application/json",
              },
            },
          ),
          r = await n.json();
        if (
          !Array.isArray(r) ||
          !r.some((i) => i && i.user_id === SESS.uid && i.token === s.token)
        )
          throw new Error("Exclusão não confirmada pelo servidor");
      } catch {
        ((s.err =
          "Não foi possível revogar o link no servidor. O compartilhamento pode continuar ativo. Conecte-se à internet e tente novamente."),
          toast(s.err, 6500),
          render());
        return;
      }
      (delete S.ax.parc,
        save(),
        render(),
        toast(
          "Compartilhamento desativado no servidor. O link anterior foi revogado.",
          4500,
        ));
      return;
    }
    if (o === "fam") {
      const n = famTexto();
      try {
        if (navigator.share) {
          await navigator.share({ text: n });
          return;
        }
      } catch (r) {
        if (r && r.name === "AbortError") return;
      }
      try {
        (await navigator.clipboard.writeText(n), toast("Texto copiado."));
      } catch {}
    }
  }));
{
  const e = vMais;
  vMais = function () {
    return e.apply(this, arguments) + pcHtml();
  };
}
((function () {
  const e = new URLSearchParams(location.search).get("parceiro");
  if (!e || !/^[a-z0-9]{20,40}$/.test(e)) return;
  const t = document.createElement("div");
  ((t.id = "pcv"),
    (t.innerHTML =
      '<div class="pcv-in"><div class="sm mut">Carregando…</div></div>'));
  const a = () => {
    (document.body.appendChild(t), (document.body.style.overflow = "hidden"));
  };
  document.body ? a() : addEventListener("DOMContentLoaded", a);
  const o = TraderStyles.slot("legacy-047");
  ((o.textContent = TraderStyles.css("legacy-047")),
    TraderStyles.mount(o),
    (async () => {
      try {
        async function s(p) {
          const u = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ t: p }),
          };
          try {
            const f = await (
              await rq("/functions/v1/parceiro-leitura", u, !1)
            ).json();
            if (!f || !f.resumo)
              throw new Error("Link inválido ou desativado.");
            return f;
          } catch (m) {
            const f = String((m && m.message) || "");
            if (
              !(
                m &&
                m.status === 404 &&
                /function not found|requested function was not found/i.test(f)
              )
            )
              throw m;
            return await (await rq("/rest/v1/rpc/parceiro_ver", u, !1)).json();
          }
        }
        const n = await s(e),
          r = n && n.resumo;
        if (!r) throw new Error("Link inválido ou desativado.");
        const i = r.semanas || [],
          l = i[0] || {},
          d = (p, u, m = "") =>
            `<div class="card" style="margin:0;padding:10px"><span class="sm mut">${p}</span><div><b class="${m}" style="font-size:18px">${u}</b></div></div>`,
          c = (p) => (p == null ? "–" : Math.round(p * 100) + "%");
        t.querySelector(".pcv-in").innerHTML =
          `<h1>Disciplina de ${esc(r.nome || "trader")}</h1><div class="sm mut">Atualizado em ${new Date(n.atualizado || r.em).toLocaleString("pt-BR")}. Só leitura.</div>
<h2>Esta semana</h2><div class="wk">${d("Dias operados", l.dias ?? "–")}${d("Dias seguindo o plano", `${l.limpo ?? "–"} de ${l.dias ?? "–"}`, l.limpo === l.dias && l.dias ? "g" : "")}${d("Regras seguidas", c(l.regras), l.regras >= 0.9 ? "g" : l.regras != null && l.regras < 0.7 ? "r" : "")}${d("Trava", l.trava ? "respeitada" : "desrespeitada", l.trava ? "g" : "r")}${d("Debriefings", `${l.deb ?? "–"} de ${l.dias ?? "–"}`)}${d("Revisão da semana", l.rev ? "feita" : "pendente", l.rev ? "g" : "")}${l.tilt ? d("Trades em tilt", l.tilt, "r") : ""}${r.valores && l.v != null ? d("Resultado", money(l.v), l.v >= 0 ? "g" : "r") : ""}</div>
<h2>Últimas semanas</h2><div class="card"><div style="overflow-x:auto"><table class="dshtb"><tr><th>Semana</th><th>Dias no plano</th><th>Regras</th><th>Trava</th><th>Debrief.</th>${r.valores ? "<th>Resultado</th>" : ""}</tr>${i.map((p) => `<tr><td>${String(p.a).slice(8, 10)}/${String(p.a).slice(5, 7)}</td><td>${p.limpo}/${p.dias}</td><td>${c(p.regras)}</td><td class="${p.trava ? "g" : "r"}">${p.trava ? "ok" : "não"}</td><td>${p.deb}/${p.dias}</td>${r.valores ? `<td class="${p.v >= 0 ? "g" : "r"}">${p.v == null ? "–" : money(p.v)}</td>` : ""}</tr>`).join("")}</table></div></div>
${(r.mesas || []).length ? `<h2>Mesas proprietárias</h2><div class="card">${r.mesas.map((p) => `<div class="sm" style="padding:6px 0"><b>${esc(p.n)}</b> · ${esc(p.st)}${p.meta != null ? " · " + p.meta + "% da meta" : ""}${p.v != null ? " · " + money(p.v) : ""}</div>`).join("")}</div>` : ""}
<div class="sm mut" style="margin-top:14px">Gerado pelo Diário de Trader. Cobre o processo, não o resultado: disciplina é o que a pessoa controla.</div>`;
      } catch (s) {
        t.querySelector(".pcv-in").innerHTML =
          `<h1>Diário de Trader</h1><div class="warn">${esc(s.message || String(s))}</div>`;
      }
    })());
})(),
  (balHtml = function () {
    const e = BAL.v,
      t = (d) => {
        const c = new Date(d + "T12:00:00");
        return (
          ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][c.getDay()] +
          " " +
          d.slice(8, 10) +
          "/" +
          d.slice(5, 7)
        );
      },
      a = (d) => {
        const c =
            d.conf === "cvm"
              ? '<b class="g">✓</b> '
              : d.conf === "com"
                ? '<b style="color:var(--ac)">●</b> '
                : '<span class="mut">≈</span> ',
          p =
            d.hora || d.quando
              ? ` <span class="mut" style="font-size:11px">${d.hora ? esc(d.hora) : d.quando === "antes" ? "antes da abertura" : d.quando === "depois" ? "após o fech." : "no pregão"}</span>`
              : "",
          u = `display:inline-block;border-radius:8px;padding:2px 7px;margin:2px 3px 2px 0;font-size:13px;text-decoration:none;color:inherit;${d.conf === "cvm" ? "background:color-mix(in srgb,var(--g) 14%,transparent);border:1px solid color-mix(in srgb,var(--g) 40%,transparent)" : d.conf === "com" ? "background:color-mix(in srgb,var(--ac) 12%,transparent);border:1px solid color-mix(in srgb,var(--ac) 35%,transparent)" : "background:rgba(127,127,127,0.1);border:1px dashed rgba(127,127,127,0.35)"}`,
          m =
            esc(d.nome) +
            (d.conf === "cvm"
              ? " · entregue à CVM"
              : d.conf === "com"
                ? " · data confirmada pela empresa"
                : " · data estimada");
        return d.link
          ? `<a href="${esc(urlSegura(d.link))}" target="_blank" rel="noopener" title="${m}" style="${u}">${c}${esc(d.tk)}${p}</a>`
          : `<span title="${m}" style="${u}">${c}${esc(d.tk)}${p}</span>`;
      };
    if (!e)
      return `<div class="card" id="balbox" style="margin-bottom:10px"><b>📑 Balanços</b><div class="sm ${BAL.err ? "am" : "mut"}" style="margin-top:4px">${esc(BAL.err || "Carregando…")}</div></div>`;
    const o = {};
    (e.proximos || []).forEach((d) => (o[d.d] = o[d.d] || []).push(d));
    const s = (d, c) =>
        c && c.length
          ? `<div style="margin-top:8px"><div class="sm mut">${d}</div>${c.slice(0, 30).map(a).join("")}${c.length > 30 ? `<span class="sm mut"> +${c.length - 30}</span>` : ""}</div>`
          : "",
      n = e.fontes || [],
      r = n.length
        ? n
            .map(
              (d) =>
                `<span class="${d.ok ? "" : "r"}">${d.ok ? "✓" : "✗"} ${esc(d.nome)}${d.ok ? ` (${d.n})` : d.erro ? ": " + esc(d.erro) : ""}</span>`,
            )
            .join(" · ")
        : esc(e.fonte || "TradingView"),
      i = e.hoje_lista || [],
      l = i.filter((d) => d.conf === "cvm").length;
    return `<div class="card" id="balbox" style="margin-bottom:10px"><div class="top"><b>📑 Balanços da B3</b><span class="sm mut">${l ? l + " já saíram hoje" : "maiores primeiro"}</span></div>
${s(e.ontem && e.ontem.length ? "Divulgaram em " + t(e.ontem[0].d) : "", e.ontem)}${s("Hoje", i)}${Object.keys(
      o,
    )
      .sort()
      .slice(0, 6)
      .map((d) => s(t(d), o[d]))
      .join("")}
${!(e.ontem || []).length && !i.length && !(e.proximos || []).length ? '<div class="sm mut">Nenhum balanço nos próximos 7 dias.</div>' : ""}
<div class="sm" style="margin-top:8px"><b class="g">✓</b> saiu (documento entregue à CVM, toque para abrir) · <b style="color:var(--ac)">●</b> data confirmada pela empresa em comunicado · <span class="mut">≈</span> data estimada (pode mudar)</div><div class="sm mut" style="margin-top:4px">Fontes: ${r}. Horários de Brasília.</div></div>`;
  }));
{
  const e = opGrafico;
  opGrafico = function (t, a) {
    let o = e.apply(this, arguments);
    try {
      if (!a || a.x == null) return o;
      const s = 340,
        n = 190,
        r = 6,
        i = 6,
        l = 10,
        d = 22,
        c = t.xs,
        p = c[0],
        u = c[c.length - 1],
        m = t.venc,
        f = t.agora,
        x = m.concat(f, a.pl != null ? [a.pl] : []);
      let v = Math.min(0, ...x),
        g = Math.max(0, ...x);
      g - v < 1 && ((g += 1), (v -= 1));
      const h = (ue) => r + ((ue - p) / (u - p)) * (s - r - i),
        b = (ue) => l + ((g - ue) / (g - v)) * (n - l - d),
        y = Math.max(p, Math.min(u, a.x)),
        j = opValor(t.L, t.ivs, y, t.v1, t.r),
        k = h(y),
        A = b(j),
        C = a.pl != null ? b(a.pl) : A,
        I = (ue) => (ue >= 0 ? "var(--g)" : "var(--r)"),
        J = `${opN(y)} · venc. ${j >= 0 ? "+" : ""}${opM(j)}`,
        se = Math.min(200, J.length * 6.2 + 14),
        Ie = Math.max(2, Math.min(s - se - 2, k - se / 2)),
        Pe = `<line x1="${k}" x2="${k}" y1="${l}" y2="${n - d}" stroke="${I(j)}" stroke-width="1.5"/>
<rect x="${Ie}" y="${l}" width="${se}" height="20" rx="10" fill="${I(j)}" opacity=".95"/><text x="${Ie + se / 2}" y="${l + 14}" font-size="11" font-weight="700" text-anchor="middle" fill="#ffffff">${esc(J)}</text>
<circle cx="${k}" cy="${A}" r="5" fill="${I(j)}" stroke="#ffffff" stroke-width="2"/>
<circle cx="${k}" cy="${C}" r="16" fill="var(--ac)" opacity=".18"/><circle cx="${k}" cy="${C}" r="9" fill="#ffffff" stroke="var(--ac)" stroke-width="3.5" style="cursor:grab"/>`;
      o = o
        .replace(
          /<circle cx="[^"]*" cy="[^"]*" r="5" fill="#fff" stroke="var\(--ac\)" stroke-width="3"\/>/,
          "",
        )
        .replace(
          '<svg viewBox="0 0 340 190"',
          `<svg viewBox="0 0 340 190" data-opx0="${p}" data-opx1="${u}" data-ops="${t.S}" style="touch-action:pan-y;cursor:ew-resize"`,
        )
        .replace("</svg>", Pe + "</svg>");
      const Me = a.dd != null ? a.dd : 0;
      o += `<div class="opdr sm"><span>Se ${esc(opSub(t.t || {}) || "o ativo")} for a <b>${opN(y)}</b> (${y >= t.S ? "+" : ""}${opN((y / t.S - 1) * 100, 1)}%):</span><span>no vencimento <b class="${cls(j)}">${opM(j)}</b>${a.pl != null ? ` · na data do simulador <b class="${cls(a.pl)}">${opM(a.pl)}</b>` : ""}</span><span class="mut">Arraste a bolinha para os lados. ${j >= 0 ? "Zona de lucro" : "Zona de prejuízo"}${t.be.length ? " · breakeven " + t.be.map((ue) => opN(ue)).join(" e ") : ""}.</span></div>`;
    } catch (s) {
      console.error(s);
    }
    return o;
  };
}
const OPD = { id: null, svg: null };
function opDrag(e) {
  var t;
  const a = OPD.svg;
  if (!a) return;
  const o = a.getBoundingClientRect(),
    s = 340,
    n = 6,
    r = 6,
    i = +a.dataset.opx0,
    l = +a.dataset.opx1,
    d = +a.dataset.ops;
  if (!(d > 0)) return;
  const c = Math.max(
      0,
      Math.min(1, (((e.clientX - o.left) / o.width) * s - n) / (s - n - r)),
    ),
    p = i + (l - i) * c,
    u = OPSIM[(t = OPD.id)] ?? (OPSIM[t] = { p: 0, d: 0, v: 0 });
  u.p = Math.round((p / d - 1) * 1e3) / 10;
  const m = document.querySelector(`.opp[data-opid="${CSS.escape(OPD.id)}"]`),
    f = m && m.querySelector('[data-osim="p"]');
  (f && (f.value = Math.max(-30, Math.min(30, Math.round(u.p)))),
    opSimPinta(OPD.id),
    (OPD.svg = m && m.querySelector(".opch svg")));
}
(document.addEventListener("pointerdown", (e) => {
  const t = e.target.closest && e.target.closest(".opp .opch svg[data-opx0]");
  if (!t) return;
  const a = t.closest(".opp");
  ((OPD.id = a.dataset.opid), (OPD.svg = t), opDrag(e));
}),
  document.addEventListener("pointermove", (e) => {
    OPD.svg && (e.buttons || e.pointerType === "touch") && opDrag(e);
  }),
  ["pointerup", "pointercancel"].forEach((e) =>
    document.addEventListener(e, () => {
      OPD.svg = null;
    }),
  ));
{
  const e = TraderStyles.slot("legacy-048");
  ((e.textContent = TraderStyles.css("legacy-048")), TraderStyles.mount(e));
}
{
  const e = opResumo;
  opResumo = function (t) {
    const a = e.apply(this, arguments);
    return (a && (a.t = t), a);
  };
}
const OA = {
    tk: "",
    sub: "",
    k: null,
    venc: "",
    row: null,
    srow: null,
    ts: 0,
    t: 0,
    err: "",
    pedido: 0,
  },
  oaParse = (e) => {
    const t = /^([A-Z]{4})([A-X])(\d{1,3})([A-Z0-9]{0,3})$/.exec(
      String(e || "").toUpperCase(),
    );
    if (!t) return null;
    const a = t[2].charCodeAt(0) - 65,
      o = a < 12;
    return {
      raiz: t[1],
      tp: o ? "C" : "P",
      mes: (o ? a : a - 12) + 1,
      num: +t[3],
    };
  };
function oaGrade(e) {
  for (const t of OPG.rows || []) {
    const a = (t.series || []).find((o) => o.c === e);
    if (a) {
      const o = opgSeries(t, a.m),
        s = o.find((n) => n.c === e) || a;
      return { row: t, x: s };
    }
  }
  return null;
}
function oaSubPalpite(e) {
  const t = (OPG.rows || []).find((o) => String(o.ativo).startsWith(e));
  if (t) return t.ativo;
  const a = ((typeof LV < "u" && LV.all) || [])
    .map((o) => String(o.ticker).toUpperCase())
    .filter((o) => o.startsWith(e) && /^[A-Z]{4}(3|4|5|6|11)$/.test(o));
  return a.length
    ? a.sort()[a.length > 1 && a.includes(e + "4") ? a.indexOf(e + "4") : 0]
    : e +
        ([
          "BBDC",
          "ITUB",
          "PETR",
          "GGBR",
          "GOAU",
          "USIM",
          "CMIG",
          "ITSA",
          "BRAP",
        ].includes(e)
          ? "4"
          : [
                "BOVA",
                "SANB",
                "KLBN",
                "TAEE",
                "BPAC",
                "ENGI",
                "IGTI",
                "SMAL",
              ].includes(e)
            ? "11"
            : "3");
}
function oaPede() {
  const e = S.ax ?? (S.ax = {}),
    t = (e.ponteOpc || []).filter(
      (a) => a.tk !== OA.tk && Date.now() - a.em < 3 * 36e5,
    );
  (t.push({ tk: OA.tk, sub: OA.sub, em: Date.now() }),
    (e.ponteOpc = t.slice(-8)),
    (OA.pedido = Date.now()),
    save());
  try {
    typeof SESS < "u" && SESS && sync();
  } catch {}
}
async function oaBusca() {
  if (!(!OA.tk || typeof SESS > "u" || !SESS || !cfg())) {
    try {
      const e = await rq(
          `/rest/v1/cotacoes?select=*&user_id=eq.${SESS.uid}&ticker=in.(${encodeURIComponent(OA.tk)},${encodeURIComponent(OA.sub)})`,
        ),
        t = await e.json();
      ((OA.row = t.find((a) => a.ticker === OA.tk) || OA.row),
        (OA.srow = t.find((a) => a.ticker === OA.sub) || OA.srow),
        (OA.err = ""));
    } catch (e) {
      OA.err = e.message || String(e);
    }
    ((OA.ts = Date.now()), oaPinta());
  }
}
function oaDados() {
  const e = oaParse(OA.tk);
  if (!e) return null;
  const t = oaGrade(OA.tk),
    a = OA.row || {},
    o = a.updated_at && Date.now() - Date.parse(a.updated_at) < 9e4,
    s = loc().slice(0, 10),
    n = +a.ocp > 0 && o ? +a.ocp : t && t.x.b > 0 ? t.x.b : null,
    r = +a.ovd > 0 && o ? +a.ovd : t && t.x.a > 0 ? t.x.a : null,
    i = +a.ult > 0 ? +a.ult : (t && (t.x.u || t.x.p)) || null,
    l = OA.k || (+a.pex > 0 ? +a.pex : t ? t.x.k : null),
    d =
      OA.venc ||
      (a.ven && /^\d{4}-\d{2}-\d{2}/.test(a.ven)
        ? String(a.ven).slice(0, 10)
        : t && t.x.v
          ? t.x.v
          : (() => {
              const Be = +s.slice(0, 4),
                Ge = String(e.mes).padStart(2, "0");
              let Ce = opVencMes(Be + "-" + Ge);
              return (Ce < s && (Ce = opVencMes(Be + 1 + "-" + Ge)), Ce);
            })()),
    c = typeof lvQ == "function" ? lvQ(OA.sub) : null,
    p =
      c && c.ult > 0
        ? c.ult
        : OA.srow && +OA.srow.ult > 0
          ? +OA.srow.ult
          : t
            ? +t.row.spot
            : null;
  if (!(l > 0) || !(p > 0))
    return {
      p: e,
      b: n,
      a: r,
      u: i,
      K: l,
      venc: d,
      S: p,
      g: t,
      r: a,
      fresco: o,
      falta: l > 0 ? "preço do ativo" : "strike",
    };
  const u = Math.max(0.5, opDias(s, d)) / 365,
    m = opR(),
    f = n && r && r >= n ? (n + r) / 2 : null,
    x = f || i,
    v = opgIVp(a.ivp) || (t && t.x.iv) || null,
    g = v || (x ? OPM.iv(x, p, l, u, m, e.tp) : null) || 0.35,
    h = r || i,
    b = n || i,
    y = g * Math.sqrt(u),
    j = (Be) => OPM.ncdf((Math.log(p / Be) + (m - (g * g) / 2) * u) / y),
    k = e.tp === "C" ? l + h : l - h,
    A = e.tp === "C" ? l + b : l - b,
    C = e.tp === "C" ? j(k) : 1 - j(k),
    I = e.tp === "C" ? 1 - j(A) : j(A),
    J = e.tp === "C" ? j(l) : 1 - j(l),
    se = OPM.gregas(p, l, u, m, g, e.tp),
    Ie = p * y,
    Pe = Math.abs(k / p - 1),
    Me = n && r ? r - n : null,
    ue = Me != null && f ? Me / f : null,
    ve = opgRank(OA.sub),
    he = t ? opgAtmIV(t.row, t.x.m) : null,
    we = OPM.bs(p, l, u, m, he || g, e.tp);
  return {
    p: e,
    b: n,
    a: r,
    u: i,
    mid: f,
    K: l,
    venc: d,
    S: p,
    T: u,
    dte: opDias(s, d),
    iv: g,
    ivf: v ? "Profit" : "calculada",
    pa: h,
    pb: b,
    beC: k,
    beV: A,
    probC: C,
    probV: I,
    itm: J,
    G: se,
    mov: Ie,
    precisa: Pe,
    spr: Me,
    sprP: ue,
    rk: ve,
    atm: he,
    justo: we,
    neg: +a.neg || (t && t.x.n) || 0,
    oi: +a.cab || (t && t.x.oi) || null,
    qoc: +a.qoc || null,
    qov: +a.qov || null,
    g: t,
    r: a,
    fresco: o,
  };
}
function oaCrit(e) {
  const t = [],
    a = (l, d, c) => t.push({ ok: l, t: d, w: c }),
    o = e.sprP,
    s = e.neg >= 20 || (e.oi || 0) >= 5e3,
    n = [],
    r = [],
    i = (l, d, c) => l.push({ ok: d, t: c });
  return (
    o != null &&
      i(
        n,
        o <= 0.06,
        o <= 0.06
          ? `spread baixo (${pct0(o)} do preço)`
          : o <= 0.12
            ? `spread médio (${pct0(o)}): use ordem limitada no meio`
            : `spread alto (${pct0(o)}): você já entra perdendo ${pct0(o / 2)}`,
      ),
    i(
      n,
      s,
      s
        ? `liquidez ok (${e.neg} negócios hoje${e.oi ? `, ${Math.round(e.oi).toLocaleString("pt-BR")} em aberto` : ""})`
        : `pouca liquidez (${e.neg} negócios hoje): difícil sair no preço`,
    ),
    e.rk && e.rk.rank != null
      ? i(
          n,
          e.rk.rank < 0.5,
          e.rk.rank < 0.3
            ? `volatilidade barata (IV Rank ${pct0(e.rk.rank)}): bom para comprar`
            : e.rk.rank < 0.5
              ? `volatilidade na média baixa (IV Rank ${pct0(e.rk.rank)})`
              : `volatilidade cara (IV Rank ${pct0(e.rk.rank)}): comprar fica caro`,
        )
      : e.atm &&
        i(
          n,
          e.iv <= e.atm * 1.08,
          e.iv <= e.atm * 1.08
            ? `vol. desta série (${pct0(e.iv)}) em linha com a do dinheiro (${pct0(e.atm)})`
            : `vol. desta série (${pct0(e.iv)}) acima da do dinheiro (${pct0(e.atm)}): prêmio caro`,
        ),
    i(
      n,
      e.precisa <= e.mov / e.S,
      `para empatar o ativo precisa ir a ${opN(e.beC)} (${e.p.tp === "C" ? "+" : "−"}${pct0(e.precisa)}); o movimento esperado até o vencimento é ±${pct0(e.mov / e.S)}`,
    ),
    i(
      n,
      e.dte >= 15,
      e.dte >= 15
        ? `${e.dte} dias até o vencimento: o tempo ainda corre devagar`
        : `só ${e.dte} dias: o tempo derrete o prêmio rápido (theta ${opM(e.G.th * 100)} por dia em 100 opções)`,
    ),
    i(
      n,
      e.probC >= 0.35,
      `chance estimada de lucro no vencimento: ${pct0(e.probC)}`,
    ),
    i(
      r,
      e.rk && e.rk.rank != null ? e.rk.rank >= 0.5 : e.atm ? e.iv >= e.atm : !1,
      e.rk && e.rk.rank != null
        ? `IV Rank ${pct0(e.rk.rank)}: ${e.rk.rank >= 0.5 ? "prêmio gordo para vender" : "prêmio magro para vender"}`
        : "IV Rank ainda coletando (20 dias)",
    ),
    i(
      r,
      e.probV >= 0.65,
      `chance estimada de ficar com o prêmio: ${pct0(e.probV)} (empate em ${opN(e.beV)})`,
    ),
    o != null && i(r, o <= 0.08, `spread ${pct0(o)}`),
    i(r, s, s ? "liquidez ok" : "pouca liquidez"),
    { com: n, ven: r }
  );
}
function oaHtml() {
  if (!OA.tk) return "";
  const e = oaDados(),
    t = OA.row,
    a =
      t && t.updated_at
        ? Math.round((Date.now() - Date.parse(t.updated_at)) / 1e3)
        : null,
    o = SESS
      ? t && a != null && a < 90
        ? `<span class="g">● ao vivo</span> · Profit há ${a}s`
        : Date.now() - OA.pedido < 6e4
          ? "Pedindo ao Profit… a ponte confere os pedidos a cada 15 s."
          : t
            ? `<span class="am">dado de ${new Date(t.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>: a ponte está rodando com a versão nova?`
            : '<span class="am">Sem dado da ponte ainda.</span> Ela precisa estar rodando (versão nova) com o Profit aberto.'
      : '<span class="am">Entre na sua conta para receber os dados da ponte.</span>',
    s = `<div class="top"><b style="font-size:20px">${esc(OA.tk)}</b><button class="x" data-oa="x">✕</button></div><div class="sm mut">${e ? (e.p.tp === "C" ? "Call" : "Put") + " de " + esc(OA.sub) : ""}${e && e.K ? " · strike " + opN(e.K) : ""}${e && e.venc ? " · vence " + fmtD(e.venc) + (e.dte != null ? ` (${e.dte} dias)` : "") : ""}</div><div class="sm" style="margin:4px 0 8px">${o}</div>`;
  if (!e)
    return (
      s +
      '<div class="warn">Código de opção inválido. Ex.: ITUBX440, PETRK325.</div>'
    );
  const n = `<div class="oa-lv"><div><span>Compra (bid)</span><b class="g">${e.b ? opN(e.b) : "–"}</b><i>${e.qoc ? Math.round(e.qoc).toLocaleString("pt-BR") : ""}</i></div><div><span>Último</span><b>${e.u ? opN(e.u) : "–"}</b><i>${e.neg ? e.neg + " neg." : ""}</i></div><div><span>Venda (ask)</span><b class="r">${e.a ? opN(e.a) : "–"}</b><i>${e.qov ? Math.round(e.qov).toLocaleString("pt-BR") : ""}</i></div></div>
<div class="sm" style="text-align:center;margin:4px 0 10px">${e.spr != null ? `Spread <b>${opN(e.spr)}</b> (${pct0(e.sprP)} do preço) · meio ${opN(e.mid)}` : "Sem compra e venda do Profit: " + (t && !("ocp" in t) ? "rode o cotacoes-opcoes.sql e atualize a ponte" : "aguardando o livro")}</div>`;
  if (e.falta)
    return (
      s +
      n +
      `<div class="card sm">Falta o ${e.falta}. ${e.falta === "strike" ? '<label>Strike<input type="number" step="0.01" inputmode="decimal" data-oak="k" placeholder="44,00"></label>' : `<label>Ativo-objeto<input data-oak="sub" value="${esc(OA.sub)}"></label>`}</div>`
    );
  const r = oaCrit(e),
    i = (u) => u.filter((m) => m.ok).length,
    l = (u) =>
      u
        .map(
          (m) =>
            `<div class="sm" style="margin:3px 0">${m.ok ? '<b class="g">✓</b>' : '<b class="r">✗</b>'} ${m.t}</div>`,
        )
        .join(""),
    d = (u, m, f, x = "") =>
      `<div class="card" style="margin:0;padding:9px 10px"><span class="sm mut">${u}</span><div><b class="${x}" style="font-size:16px">${m}</b></div>${f ? `<div class="sm mut">${f}</div>` : ""}</div>`,
    c = e.mid ? e.mid / e.justo - 1 : null,
    p = {
      id: "__oa",
      tipo: "O",
      dt: loc().slice(0, 16),
      ativo: OA.tk,
      sub: OA.sub,
      spot: String(e.S),
      legs: [
        {
          id: "l0",
          tp: e.p.tp,
          lado: "C",
          k: e.K,
          venc: e.venc,
          pr: +(+e.pa).toFixed(2),
          q: 100,
          iv: +(e.iv * 100).toFixed(2),
        },
      ],
    };
  return (
    s +
    n +
    `<div class="kv">${d("Ativo-objeto", opN(e.S), esc(OA.sub))}${d("Vol. implícita", pct0(e.iv), e.ivf + (e.rk && e.rk.rank != null ? ` · IV Rank ${pct0(e.rk.rank)}` : ""))}${e.atm ? d("Preço justo (vol. do dinheiro)", opN(e.justo), c != null ? (c > 0.05 ? `mercado ${pct0(c)} acima: caro` : c < -0.05 ? `mercado ${pct0(-c)} abaixo: barato` : "mercado em linha") : "", c > 0.05 ? "r" : c < -0.05 ? "g" : "") : d("Contratos em aberto", e.oi ? Math.round(e.oi).toLocaleString("pt-BR") : "–", e.neg ? e.neg + " negócios hoje" : "")}${d("Delta", opN(e.G.d, 2), `theta ${opM(e.G.th * 100)}/dia em 100`)}</div>
<h2>Para comprar</h2><div class="card"><div class="top"><b>${i(r.com)} de ${r.com.length} a favor</b>${(() => {
      const u = i(r.com),
        m = u >= r.com.length - 1 && e.probC >= 0.3,
        f = u <= r.com.length / 2;
      return `<span class="chip ${m ? "g" : f ? "r" : "am"}" style="border-color:currentColor">${m ? "condições boas" : f ? "condições fracas" : e.probC < 0.3 ? "mistas: chance de lucro baixa" : "condições mistas"}</span>`;
    })()}</div>${l(r.com)}<div class="sm mut" style="margin-top:4px">Comprando 100 a ${opN(e.pa)}: arrisca ${money(e.pa * 100)}${e.p.tp === "C" ? ", ganho ilimitado acima de " + opN(e.beC) : ", ganho até " + money(e.beC * 100) + " se o ativo for a zero"}.</div></div>
<h2>Para vender</h2><div class="card"><div class="top"><b>${i(r.ven)} de ${r.ven.length} a favor</b></div>${l(r.ven)}<div class="sm am" style="margin-top:4px">Venda ${e.p.tp === "C" ? "de call descoberta tem risco ilimitado" : "de put obriga a comprar a ação no strike"}: use trava ou garantia.</div></div>
${e.pa > 0 ? `<h2>Lucro e prejuízo (comprando 100)</h2><div class="card">${opPainel(p, "__oa")}</div>` : ""}
<div class="g2" style="margin:12px 0"><button class="btn" data-oa="trade">Montar trade</button><button class="btn s" data-oa="atualiza">Atualizar agora</button></div>
<div class="sm mut" style="margin-bottom:20px">Chances calculadas pelo modelo de Black-Scholes com a volatilidade implícita: são estimativas, não garantia. A decisão é sua.</div>`
  );
}
function oaPinta() {
  const e = document.getElementById("oaov");
  if (!e) return;
  const t = e.scrollTop;
  (document.activeElement &&
    e.contains(document.activeElement) &&
    document.activeElement.tagName === "INPUT") ||
    ((e.querySelector(".oa-in").innerHTML = oaHtml()), (e.scrollTop = t));
}
function oaAbre(e) {
  var t;
  e = String(e || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const a = oaParse(e);
  if (!a) {
    toast("Código de opção inválido. Ex.: ITUBX440");
    return;
  }
  const o = oaGrade(e);
  (Object.assign(OA, {
    tk: e,
    sub: o ? o.row.ativo : oaSubPalpite(a.raiz),
    k: null,
    venc: "",
    row: null,
    srow: null,
    err: "",
  }),
    oaPede());
  let s = document.getElementById("oaov");
  (s ||
    ((s = document.createElement("div")),
    (s.id = "oaov"),
    (s.innerHTML = '<div class="oa-in"></div>'),
    document.body.appendChild(s)),
    (document.body.style.overflow = "hidden"),
    oaPinta(),
    oaBusca(),
    clearInterval(OA.t),
    (OA.t = setInterval(() => {
      if (!document.getElementById("oaov")) {
        clearInterval(OA.t);
        return;
      }
      document.hidden || oaBusca();
    }, 3e3)));
  const n = (t = S.ax ?? (S.ax = {})).oaHist ?? (t.oaHist = []);
  n.includes(e) || (n.unshift(e), n.splice(8));
}
function oaFecha() {
  const e = document.getElementById("oaov");
  (e && e.remove(), clearInterval(OA.t), (document.body.style.overflow = ""));
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-oa]");
    if (t) {
      const s = t.dataset.oa;
      if (s === "x") oaFecha();
      else if (s === "atualiza") (oaPede(), oaBusca());
      else if (s === "trade") {
        const n = oaDados();
        if (!n || !n.K) return;
        (oaFecha(),
          (AUTO = 0),
          (isNew = 1),
          (QM = 0),
          (T = {
            id: Date.now().toString(36),
            tipo: "O",
            dt: loc().slice(0, 16),
            ativo: OA.tk,
            sub: OA.sub,
            side: "C",
            ot: n.p.tp,
            strike: String(n.K),
            venc: n.venc,
            spot: String(n.S),
            entry: n.pa ? String(+(+n.pa).toFixed(2)) : "",
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
                tp: n.p.tp,
                lado: "C",
                k: n.K,
                venc: n.venc,
                pr: n.pa ? +(+n.pa).toFixed(2) : "",
                q: 100,
              },
            ],
          }),
          (orig = {}),
          showSheet());
      }
      return;
    }
    const a = e.target.closest("[data-oago]");
    if (a) {
      const s = document.getElementById("oatk");
      oaAbre(a.dataset.oago || (s && s.value));
      return;
    }
    const o = e.target.closest("[data-opnovo]");
    o &&
      !(typeof OPG < "u" && OPG.alerta) &&
      (e.stopImmediatePropagation(), oaAbre(o.dataset.opnovo));
  },
  !0,
),
  document.addEventListener("keydown", (e) => {
    e.key === "Enter" && e.target.id === "oatk" && oaAbre(e.target.value);
  }),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-oak]");
    t &&
      (t.dataset.oak === "k"
        ? (OA.k = +String(t.value).replace(",", ".") || null)
        : ((OA.sub = String(t.value).toUpperCase().trim()), oaPede()),
      t.blur(),
      oaPinta(),
      oaBusca());
  }));
function oaCard() {
  const e = (S.ax || {}).oaHist || [];
  return `<div class="card" id="oacard"><b>🔎 Analisar uma opção</b><div class="sm mut" style="margin:2px 0 8px">Digite o código que você viu no Profit: o app pede à ponte e mostra compra, venda, spread, preço justo e a chance de lucro, ao vivo.</div><div style="display:flex;gap:6px"><input id="oatk" placeholder="Ex.: ITUBX440" autocapitalize="characters" autocomplete="off" style="margin:0;text-transform:uppercase"><button class="btn" data-oago="">Analisar</button></div>${e.length ? `<div class="chips2" style="margin-top:8px">${e.map((t) => `<button data-oago="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}</div>`;
}
{
  const e = opgHtml;
  opgHtml = function () {
    let t = e.apply(this, arguments);
    try {
      return (
        (t = t.replace(
          /(<td class="opgc[^"]*" data-opnovo="([^"]*)"><b class="mono">[^<]*<\/b><small>)/g,
          (a, o, s) => {
            let n = null;
            for (const r of OPG.rows || [])
              if (((n = (r.series || []).find((i) => i.c === s)), n)) break;
            return n && n.b > 0 && n.a > 0
              ? o +
                  `<span class="opba"><span class="g">${opN(n.b)}</span> × <span class="r">${opN(n.a)}</span></span>`
              : o;
          },
        )),
        (t = t.replace(
          "Toque numa opção para montar um trade com ela.",
          "Verde × vermelho = melhor compra × melhor venda (quando o Profit manda). Toque numa opção para analisar ao vivo.",
        )),
        t
      );
    } catch {
      return t;
    }
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      if (!t) return;
      const a = t.querySelectorAll("#oacard");
      a.forEach((s, n) => {
        n && s.remove();
      });
      const o = t.querySelector("#opgbox");
      if (
        (tab === "opgrade" || (tab === "mercado" && MKT.tab === "opc")) &&
        o &&
        !a.length
      ) {
        const s = document.createElement("div");
        ((s.innerHTML = oaCard()), o.before(s.firstElementChild));
      }
    } catch {}
  };
}
setInterval(() => {
  try {
    if (
      (document.querySelectorAll("#oacard").forEach((e, t) => {
        t && e.remove();
      }),
      tab === "opgrade" && !document.getElementById("oacard"))
    ) {
      const e = document.getElementById("opgbox");
      if (e) {
        const t = document.createElement("div");
        ((t.innerHTML = oaCard()), e.before(t.firstElementChild));
      }
    }
  } catch {}
}, 1500);
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "opc" || XV.O === "an") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#oacard")) return;
      const a = document.createElement("div");
      a.innerHTML = oaCard();
      const o = t.querySelector("h1");
      (o && o.parentElement && o.parentElement !== t
        ? o.parentElement
        : o || t.firstElementChild
      ).after(a.firstElementChild);
    } catch {}
  };
}
{
  const e = TraderStyles.slot("legacy-049");
  ((e.textContent = TraderStyles.css("legacy-049")), TraderStyles.mount(e));
}
const MODS = [
    ["dt", "Day trade", "candle", "B3: mini índice, mini dólar e ações no dia"],
    ["sw", "Swing trade", "chart", "Posições de dias e semanas"],
    ["op", "Opções", "target", "Operações, grade ao vivo e análise"],
    ["fx", "Forex", "globe", "Pares, capital e lucros"],
    ["us", "EUA", "globe", "Futuros e ações americanas"],
  ],
  MOD_SUB = {
    dt: [
      ["ops", "Operações"],
      ["an", "Análise"],
      ["num", "Números"],
    ],
    sw: [
      ["ops", "Operações"],
      ["an", "Análise"],
      ["num", "Números"],
    ],
    op: [
      ["ops", "Operações"],
      ["grade", "Grade ao vivo"],
      ["an", "Análise"],
      ["num", "Números"],
    ],
    fx: [
      ["ops", "Operações"],
      ["num", "Números"],
    ],
    us: [
      ["ops", "Operações"],
      ["an", "Análise"],
      ["num", "Números"],
    ],
  },
  MOD_TP = { dt: "D", us: "D", sw: "S", op: "O" };
let STMOD = "",
  STMK = "all";
const MOD_TIPO = {
  dt: ["D", "br"],
  sw: ["S", "all"],
  op: ["O", "all"],
  fx: ["F", "all"],
  us: ["all", "us"],
};
function modAtual() {
  return tab === "opgrade" || tab === "opc"
    ? "op"
    : tab === "swing"
      ? "sw"
      : tab === "ativos"
        ? "fx"
        : tab === "trades"
          ? OPMK === "us"
            ? "us"
            : "dt"
          : (tab === "stats" && STMOD) || "";
}
function modSubAtual() {
  return tab === "opgrade"
    ? "grade"
    : tab === "opc"
      ? XV.O === "an"
        ? "an"
        : "ops"
      : tab === "trades"
        ? XV.D === "an"
          ? "an"
          : "ops"
        : tab === "swing"
          ? XV.S === "an"
            ? "an"
            : "ops"
          : tab === "stats"
            ? STMOD
              ? "num"
              : "geral"
            : tab === "rev"
              ? "rev"
              : "ops";
}
function modVai(e, t) {
  ((t = t || "ops"),
    e && !(MOD_SUB[e] || []).some((a) => a[0] === t) && (t = "ops"));
  try {
    ls.set("diario-mod", e);
  } catch {}
  if (!e)
    ((STMOD = ""),
      (TIPO = "all"),
      (STMK = "all"),
      (tab = t === "rev" ? "rev" : "stats"));
  else if (t === "num")
    ((STMOD = e),
      (TIPO = MOD_TIPO[e][0]),
      (STMK = MOD_TIPO[e][1]),
      (tab = "stats"));
  else if (e === "dt" || e === "us") {
    OPMK = e === "us" ? "us" : "br";
    try {
      ls.set("diario-opm", OPMK);
    } catch {}
    ((tab = "trades"), (XV.D = t === "an" ? "an" : ""));
  } else
    e === "sw"
      ? ((tab = "swing"), (XV.S = t === "an" ? "an" : ""))
      : e === "fx"
        ? (tab = "ativos")
        : e === "op" &&
          (t === "grade"
            ? (tab = "opgrade")
            : ((tab = "opc"), (XV.O = t === "an" ? "an" : "")));
  if (["trades", "swing", "opc"].includes(tab))
    try {
      LT = tab;
    } catch {}
  (irPara(tab), scrollTo(0, 0));
}
function modHeader() {
  const e = modAtual(),
    t = modSubAtual(),
    a = `<div class="seg hub modchips" style="margin:2px 0 8px">${MODS.map(([s, n]) => `<button class="${s === e ? "on" : ""}" data-modgo="${s}">${n}</button>`).join("")}<button class="${e ? "" : "on"}" data-modgo="">Geral</button></div>`,
    o = e
      ? MOD_SUB[e]
      : [
          ["geral", "Estatísticas gerais"],
          ["rev", "Revisão da semana"],
        ];
  return `<div class="modh"><button class="modv" data-modhub="1">‹ Operações</button></div>${a}<div class="hub2" style="margin-bottom:10px">${o.map(([s, n]) => `<button class="${s === t ? "on" : ""}" data-modsub="${s}">${n}</button>`).join("")}</div>`;
}
((segOps = function () {
  return modHeader();
}),
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest("[data-modgo]");
      if (t) {
        const s = t.dataset.modgo;
        modVai(s, s ? (modSubAtual() === "num" ? "num" : "ops") : "geral");
        return;
      }
      const a = e.target.closest("[data-modsub]");
      if (a) {
        modVai(modAtual(), a.dataset.modsub);
        return;
      }
      if (e.target.closest("[data-modhub]")) {
        (irPara("ops"), scrollTo(0, 0));
        return;
      }
      const o = e.target.closest("[data-modcard]");
      o && modVai(o.dataset.modcard, "ops");
    },
    !0,
  ));
{
  const e = stRows;
  stRows = function () {
    const t = e.apply(this, arguments);
    return STMK === "br"
      ? t.filter((a) => !a.forex && moedaT(a) !== "USD")
      : STMK === "us"
        ? t.filter((a) => !a.forex && moedaT(a) === "USD")
        : t;
  };
}
var modDe;
function modLinhas() {
  const e = S.trades
    .map((t) => ({ t, c: calc(t) }))
    .map((t) => ({ ...t, m: modDe(t.t) }));
  try {
    fxPer("0000-00-00", "9999-12-31").forEach((t) =>
      e.push({ t, c: t.c, m: "fx" }),
    );
  } catch {}
  return e;
}
function vOpsHub() {
  const e = hjD(),
    t = e.slice(0, 7),
    a = modLinhas(),
    o = (n) => emBRL(n.c.pl, moedaT(n.t)),
    s = ([n, r, i, l]) => {
      const d = a.filter((x) => x.m === n),
        c = d.filter((x) => x.c.pl != null),
        p = sum(
          c.filter((x) => String(x.t.dtx || x.t.dt).slice(0, 10) === e).map(o),
        ),
        u = c.filter((x) => String(x.t.dtx || x.t.dt).slice(0, 7) === t),
        m = sum(u.map(o)),
        f = d.filter((x) => x.c.pl == null && !x.t.dtx && !x.t.lanc).length;
      return `<button class="modc" data-modcard="${n}"><span class="ic">${window.icoSvg ? window.icoSvg(i) : ""}</span><span class="tx"><b>${r}</b><small>${l}</small><span class="sm">${f ? `<span class="chip" style="padding:1px 7px;margin-right:4px">${f} aberta(s)</span>` : ""}${u.length ? `mês <b class="${cls(m)}">${money(m)}</b> · ${u.length} trade(s)` : '<span class="mut">sem trades no mês</span>'}</span></span><span class="hj ${cls(p)}">${p ? money(p) : ""}<i>${p ? "hoje" : ""}</i></span></button>`;
    };
  return `<h1>Operações</h1><div class="sm mut" style="margin:-6px 0 10px">Escolha a modalidade: tudo dela fica lá dentro.</div><div class="modg">${MODS.map(s).join("")}</div>
<h2>Visão geral</h2><div class="g2"><button class="btn s" data-modgo="">📊 Estatísticas gerais</button><button class="btn s" data-a="gotab" data-id="rev">📅 Revisão da semana</button></div><button class="btn s" data-a="gotab" data-id="mesa" style="width:100%;margin-top:8px">🛡️ Mesa e risco</button>`;
}
function vOpGrade() {
  return (setTimeout(() => opgCarrega(!1), 0), opgHtml());
}
(setInterval(() => {
  try {
    tab === "opgrade" && !document.hidden && opgCarrega(!1);
  } catch {}
}, 6e4),
  (GOR.opc = () => {
    ((GO.r = null), (GXV.vw = "grade"), irPara("opgrade"));
  }),
  (GOR.renda = () => {
    ((GO.r = null), (GXV.vw = "renda"), irPara("opgrade"));
  }));
try {
  const e = HUB_M.findIndex((t) => t[0] === "mercado:opc");
  (e >= 0 && HUB_M.splice(e, 1),
    MGRP.forEach((t) => {
      const a = t[1].indexOf("mercado:opc");
      a >= 0 && t[1].splice(a, 1);
    }),
    MKT.tab === "opc" && (MKT.tab = "rk"));
} catch {}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest('#bnav [data-k="trades"]') &&
      (e.stopImmediatePropagation(),
      e.preventDefault(),
      irPara("ops"),
      scrollTo(0, 0));
  },
  !0,
);
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = [
        "ops",
        "opgrade",
        "trades",
        "swing",
        "opc",
        "ativos",
        "stats",
        "rev",
      ].includes(tab);
      document.querySelectorAll("#bnav [data-k]").forEach((a) => {
        a.dataset.k === "trades"
          ? a.classList.toggle("on", t)
          : t && a.classList.remove("on");
      });
    } catch {}
  };
}
setTimeout(() => {
  try {
    navPinta();
  } catch {}
}, 0);
function modComp() {
  const e = modLinhas().filter((l) => l.c.pl != null),
    [t, a] = intervalo(PER, hjD()),
    o = dshCor(),
    s = {
      dt: o.ac,
      sw: "#b2aca0",
      op: o.am,
      fx: "#ac8439",
      us: "#a49d90",
      ex: "#a49d90",
    },
    n = MODS.map(([l, d]) => {
      const c = e
          .filter(
            (g) =>
              g.m === l &&
              (!t ||
                (String(g.t.dtx || g.t.dt).slice(0, 10) >= t &&
                  String(g.t.dtx || g.t.dt).slice(0, 10) <= a)),
          )
          .sort((g, h) =>
            String(g.t.dtx || g.t.dt).localeCompare(String(h.t.dtx || h.t.dt)),
          ),
        p = c.map((g) => emBRL(g.c.pl, moedaT(g.t))),
        u = c.map((g) => g.c.r).filter((g) => g != null && isFinite(g)),
        m = p.filter((g) => g > 0),
        f = p.filter((g) => g < 0);
      let x = 0;
      const v = [0, ...p.map((g) => (x += g))];
      return {
        k: l,
        l: d,
        n: c.length,
        tot: sum(p),
        ac: c.length ? m.length / c.length : null,
        mr: u.length ? sum(u) / u.length : null,
        pf: f.length ? sum(m) / -sum(f) : m.length ? 1 / 0 : null,
        curva: v,
        cor: s[l],
      };
    }).filter((l) => l.n);
  if (n.length < 1) return "";
  const r = [...n].sort(
      (l, d) => (d.mr ?? d.tot / d.n) - (l.mr ?? l.tot / l.n),
    )[0],
    i = Math.max(...n.map((l) => Math.abs(l.tot))) || 1;
  return `<h2>Por modalidade</h2><div class="card">${n.map((l) => `<div class="dshrr" data-modgo="${l.k}" style="cursor:pointer"><div class="top sm"><b><span class="dshdot" style="background:${l.cor}"></span>${l.l}</b><b class="${cls(l.tot)}">${money(l.tot)}</b></div><div class="dshbar"><i style="width:${Math.max(2, (Math.abs(l.tot) / i) * 100).toFixed(1)}%;background:${l.tot >= 0 ? o.g : o.r}"></i></div><div class="sm mut">${l.n} trade(s) · ${pct0(l.ac)} de acerto${l.mr != null ? " · " + dshN(l.mr) + "× risco por trade" : ""} · fator de lucro ${dshN(l.pf)}</div></div>`).join("")}
${
  n.length > 1
    ? simLinhas(
        n.map((l) => ({ nome: l.l, curva: l.curva, cor: l.cor })),
        o,
      )
    : ""
}${n.length > 1 ? `<div class="sm" style="margin-top:6px">Onde o seu processo rende mais por trade: <b>${r.l}</b>${r.mr != null ? ` (${dshN(r.mr)} R por trade)` : ""}. Toque numa modalidade para ver os números dela.</div>` : ""}</div>`;
}
function modExtra(e, t) {
  const a = dshCor(),
    o = (i) => emBRL(i.c.pl, moedaT(i)),
    s = (i) => +String(i.dt).slice(11, 13),
    n = t.filter((i) => i.c && i.c.pl != null);
  if (!n.length) return "";
  const r = (i, l, d) => {
    const c = {};
    n.forEach((u) => {
      const m = l(u);
      m != null && (c[m] ?? (c[m] = [])).push(u);
    });
    const p = d
      ? d.filter((u) => c[u])
      : Object.keys(c).sort((u, m) => sum(c[m].map(o)) - sum(c[u].map(o)));
    return p.length < 2 && !d
      ? ""
      : `<h2>${i}</h2><div class="card">${dshTab(
          ["", "Trades", "Acerto", "Média", "Total"],
          p.map((u) => {
            const m = c[u],
              f = sum(m.map(o));
            return `<tr><td>${esc(u)}</td><td>${m.length}</td><td>${pct0(m.filter((x) => o(x) > 0).length / m.length)}</td><td class="${cls(f / m.length)}">${money(f / m.length)}</td><td class="${cls(f)}">${money(f)}</td></tr>`;
          }),
        )}</div>`;
  };
  if (e === "dt") {
    const i = (d) => {
        const c = numN(d.entry),
          p = numN(d.exit);
        return c != null && p != null
          ? (p - c) * (d.side === "V" ? -1 : 1)
          : null;
      },
      l = {};
    return (
      n.forEach((d) => {
        const c = raizAtivo(d.ativo);
        if (!/^(WIN|WDO|IND|DOL)$/.test(c || "")) return;
        const p = i(d);
        if (p == null) return;
        const u = String(d.dtx || d.dt).slice(0, 10);
        (l[c] ?? (l[c] = {}))[u] = (l[c][u] || 0) + p;
      }),
      Object.entries(l)
        .map(([d, c]) => {
          const p = Object.keys(c).sort().slice(-25),
            u = sum(Object.values(c));
          return `<h2>Pontos por dia · ${d}</h2>${pchBarras(
            "pts" + d,
            p.map((m) => c[m]),
            p.map((m) => m.slice(8) + "/" + m.slice(5, 7)),
            (m) => dshN(m, d === "WDO" || d === "DOL" ? 1 : 0) + " pts",
          )}<div class="sm mut" style="margin:-4px 2px 8px">Total no período: <b class="${cls(u)}">${dshN(u, d === "WDO" || d === "DOL" ? 1 : 0)} pontos</b> · média por dia ${dshN(u / Object.keys(c).length, 1)}</div>`;
        })
        .join("") +
        r(
          "Por janela do pregão",
          (d) => {
            const c = s(d);
            return c < 10
              ? "Abertura (até 10h)"
              : c < 12
                ? "Manhã (10h às 12h)"
                : c < 14
                  ? "Almoço (12h às 14h)"
                  : c < 16
                    ? "Tarde (14h às 16h)"
                    : "Fechamento (16h em diante)";
          },
          [
            "Abertura (até 10h)",
            "Manhã (10h às 12h)",
            "Almoço (12h às 14h)",
            "Tarde (14h às 16h)",
            "Fechamento (16h em diante)",
          ],
        )
    );
  }
  if (e === "sw") {
    const i = (f) =>
        f.dtx
          ? Math.max(
              0,
              Math.round(
                (Date.parse(String(f.dtx).slice(0, 10)) -
                  Date.parse(String(f.dt).slice(0, 10))) /
                  864e5,
              ),
            )
          : null,
      l = n.filter((f) => o(f) > 0),
      d = n.filter((f) => o(f) < 0),
      c = (f) => {
        const x = f.map(i).filter((v) => v != null);
        return x.length ? sum(x) / x.length : null;
      },
      p = +capRef("S") || 0,
      u = c(l),
      m = c(d);
    return (
      `<h2>Duração e retorno</h2><div class="kv">${KV("Ganhos ficam", u == null ? "–" : dshN(u, 1) + " dias", "g")}${KV("Perdas ficam", m == null ? "–" : dshN(m, 1) + " dias", "r", u != null && m != null ? (u > m ? "bom: deixa o lucro correr" : "atenção: segura a perda mais que o ganho") : "")}${KV("Retorno médio por trade", p ? pct0(sum(n.map(o)) / n.length / p) : "–", "", p ? "sobre o capital do swing" : "defina o capital do swing")}${KV("Maior ganho", money(Math.max(...n.map(o))), "g")}</div>` +
      r(
        "Por tempo na posição",
        (f) => {
          const x = i(f);
          return x == null
            ? null
            : x <= 2
              ? "Até 2 dias"
              : x <= 7
                ? "3 a 7 dias"
                : x <= 20
                  ? "8 a 20 dias"
                  : "Mais de 20 dias";
        },
        ["Até 2 dias", "3 a 7 dias", "8 a 20 dias", "Mais de 20 dias"],
      )
    );
  }
  if (e === "op")
    try {
      return opRendaHtml() + opStatsHtml();
    } catch {
      return "";
    }
  return e === "fx"
    ? r(
        "Por sessão (horário de Brasília)",
        (i) => {
          if (i.lanc) return null;
          const l = s(i);
          return l >= 19 || l < 4
            ? "Ásia (19h às 4h)"
            : l < 9
              ? "Londres (4h às 9h)"
              : l < 11
                ? "Londres + NY (9h às 11h)"
                : "Nova York (11h às 19h)";
        },
        [
          "Ásia (19h às 4h)",
          "Londres (4h às 9h)",
          "Londres + NY (9h às 11h)",
          "Nova York (11h às 19h)",
        ],
      ) + r("Por par", (i) => String(i.ativo || "").toUpperCase() || null)
    : e === "us"
      ? r(
          "Por sessão (horário de Brasília)",
          (i) => {
            const l = s(i);
            return l >= 5 && l < 10
              ? "Pré-mercado (5h às 10h30)"
              : l >= 10 && l < 17
                ? "Pregão regular (10h30 às 17h)"
                : "Noite e pós (17h às 5h)";
          },
          [
            "Pré-mercado (5h às 10h30)",
            "Pregão regular (10h30 às 17h)",
            "Noite e pós (17h às 5h)",
          ],
        ) + r("Por ativo", (i) => raizAtivo(i.ativo) || i.ativo)
      : "";
}
{
  const e = vStats;
  vStats = function () {
    let t = e.apply(this, arguments);
    try {
      if (STMOD) {
        const a = (MODS.find((o) => o[0] === STMOD) || [])[1];
        if (
          ((t = t.replace("<h1>Estatísticas</h1>", `<h1>Números · ${a}</h1>`)),
          ST.aba === "geral")
        ) {
          const o = stRows().map((r) => (r.c ? r : { ...r, c: calc(r) })),
            s = modExtra(STMOD, o),
            n = t.indexOf("<h2>Curva de capital e quedas</h2>");
          s && (t = n > 0 ? t.slice(0, n) + s + t.slice(n) : t + s);
        }
      } else if (
        ((t = t.replace(
          "<h1>Estatísticas</h1>",
          "<h1>Estatísticas gerais</h1>",
        )),
        ST.aba === "geral")
      ) {
        const a = modComp(),
          o = t.indexOf("<h2>Curva de capital e quedas</h2>");
        a && (t = o > 0 ? t.slice(0, o) + a + t.slice(o) : t + a);
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
      const t = document.getElementById("app");
      if (
        t &&
        ["trades", "swing", "opc"].includes(tab) &&
        (t.querySelectorAll('[data-a="xv"]').forEach((o) => {
          const s = o.closest(".seg");
          s && s.remove();
        }),
        tab === "opc")
      ) {
        const o = t.querySelector("#oacard");
        o && o.remove();
      }
      const a = t && t.querySelector(".modchips .on");
      a &&
        (a.parentElement.scrollLeft = Math.max(
          0,
          a.offsetLeft - a.parentElement.clientWidth / 2 + a.clientWidth / 2,
        ));
    } catch {}
    try {
      if (tab === "stats" && STMOD) {
        const t = document.getElementById("tp"),
          a = t && t.closest("label");
        a && (a.style.display = "none");
      }
    } catch {}
  };
}
{
  const e = render0;
  render0 = function () {
    (tab === "stats" &&
      (STMOD && TIPO !== MOD_TIPO[STMOD][0] && (STMOD = ""),
      STMOD || (STMK = "all")),
      e.apply(this, arguments));
  };
}
document.addEventListener(
  "change",
  (e) => {
    e.target && e.target.id === "tp" && STMOD && (STMOD = "");
  },
  !0,
);
var mrHeader;
{
  const e = vMesa;
  vMesa = function () {
    const t = e.apply(this, arguments);
    return (
      mrHeader("mesa") +
      t.replace("<h1>Mesa proprietária</h1>", "<h1>Mesa e risco</h1>")
    );
  };
}
{
  const e = vPainel;
  vPainel = function () {
    const t = e.apply(this, arguments);
    return (
      mrHeader("painel") + t.replace(/<h1>[^<]*<\/h1>/, "<h1>Mesa e risco</h1>")
    );
  };
}
try {
  FER2.forEach((e) => {
    const t = e[1].findIndex((o) => o[0] === "painel");
    t >= 0 && e[1].splice(t, 1);
    const a = e[1].find((o) => o[0] === "mesa");
    a &&
      ((a[2] = "Mesa e risco"),
      (a[3] = "Mesas, metas, limites, trava e backup"));
  });
} catch {}
(new MutationObserver(() => {
  const e = document.querySelector("#mdr2 .pn");
  if (!e || e.dataset.m111) return;
  e.dataset.m111 = 1;
  const t = e.querySelector('[data-m2="ops"]');
  if (t && !e.querySelector("[data-modmenu]")) {
    const a = document.createElement("div");
    ((a.className = "modmenu"),
      (a.innerHTML = MODS.map(
        ([o, s]) => `<button data-modmenu="${o}">${s}</button>`,
      ).join("")),
      t.after(a));
  }
  (e.querySelectorAll('[data-m2="painel"]').forEach((a) => a.remove()),
    e
      .querySelectorAll('[data-m2="mesa"] b')
      .forEach((a) => (a.textContent = "Mesa e risco")),
    setTimeout(() => {
      e.isConnected && delete e.dataset.m111;
    }, 0));
}).observe(document.body, { childList: !0, subtree: !0 }),
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest("[data-modmenu]");
      if (t) {
        const a = document.getElementById("mdr2");
        (a && a.remove(),
          (document.body.style.overflow = ""),
          modVai(t.dataset.modmenu, "ops"));
        return;
      }
      if (e.target.closest('#mdr2 [data-m2="ops"]')) {
        e.stopImmediatePropagation();
        const a = document.getElementById("mdr2");
        (a && a.remove(),
          (document.body.style.overflow = ""),
          irPara("ops"),
          scrollTo(0, 0));
      }
    },
    !0,
  ));
{
  const e = TraderStyles.slot("legacy-050");
  ((e.textContent = TraderStyles.css("legacy-050")), TraderStyles.mount(e));
}
MOD_SUB.op.splice(2, 0, ["fl", "Fluxo EWZ"]);
{
  const e = modAtual;
  modAtual = function () {
    return tab === "opfluxo" ? "op" : e.apply(this, arguments);
  };
}
{
  const e = modSubAtual;
  modSubAtual = function () {
    return tab === "opfluxo" ? "fl" : e.apply(this, arguments);
  };
}
{
  const e = modVai;
  modVai = function (t, a) {
    if (t === "op" && a === "fl") {
      try {
        ls.set("diario-mod", "op");
      } catch {}
      (irPara("opfluxo"), scrollTo(0, 0));
      return;
    }
    return e.apply(this, arguments);
  };
}
function vOpFluxo() {
  const e = MKT.tab;
  MKT.tab = "fl";
  try {
    return (
      setTimeout(() => {
        try {
          flwCarrega(!1);
        } catch {}
      }, 0),
      vMercado()
    );
  } finally {
    MKT.tab = e;
  }
}
(setInterval(() => {
  try {
    tab === "opfluxo" && !document.hidden && flwCarrega(!1);
  } catch {}
}, 6e4),
  (GOR.ewz = () => {
    ((GO.r = null), irPara("opfluxo"));
  }));
try {
  const e = HUB_M.findIndex((t) => t[0] === "mercado:fl");
  (e >= 0 && HUB_M.splice(e, 1),
    MGRP.forEach((t) => {
      const a = t[1].indexOf("mercado:fl");
      a >= 0 && t[1].splice(a, 1);
    }),
    MKT.tab === "fl" && (MKT.tab = "rk"));
} catch {}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      tab === "opfluxo" &&
        document
          .querySelectorAll("#bnav [data-k]")
          .forEach((t) => t.classList.toggle("on", t.dataset.k === "trades"));
    } catch {}
  };
}
const GRUPOS = [
  [
    ["imposto", "Imposto de renda"],
    ["import", "Importar do Profit"],
  ],
  [
    ["conta", "Conta"],
    ["status", "Status do sistema"],
  ],
  [
    ["carteiras", "Carteira"],
    ["analise", "Análises clássicas"],
  ],
  [
    ["mesa", "Mesas proprietárias"],
    ["painel", "Metas, limites e backup"],
    ["contratos", "Contratos"],
  ],
];
function grpHeader(e) {
  const t = GRUPOS.find((a) => a.some((o) => o[0] === e));
  return t
    ? `<div class="hub2 grph" style="margin:2px 0 10px">${t.map(([a, o]) => `<button class="${a === e ? "on" : ""}" data-a="gotab" data-id="${a}">${o}</button>`).join("")}</div>`
    : "";
}
mrHeader = function (e) {
  return grpHeader(e);
};
{
  const e = vContratos;
  vContratos = function () {
    const t = e.apply(this, arguments);
    return (
      grpHeader("contratos") +
      t.replace(/<h1>[^<]*<\/h1>/, "<h1>Mesa e risco</h1>")
    );
  };
}
{
  const e = vImposto;
  vImposto = function () {
    return grpHeader("imposto") + e.apply(this, arguments);
  };
}
{
  const e = vImport;
  vImport = function () {
    return grpHeader("import") + e.apply(this, arguments);
  };
}
{
  const e = vConta;
  vConta = function () {
    return grpHeader("conta") + e.apply(this, arguments);
  };
}
{
  const e = vStatus;
  vStatus = function () {
    return grpHeader("status") + e.apply(this, arguments);
  };
}
{
  const e = vCarteiras;
  vCarteiras = function () {
    return grpHeader("carteiras") + e.apply(this, arguments);
  };
}
{
  const e = vAnalise;
  vAnalise = function () {
    return grpHeader("analise") + e.apply(this, arguments);
  };
}
try {
  const e = ["contratos", "analise", "import", "status", "painel", "estudos"],
    t = {
      mesa: ["Mesa e risco", "Mesas, metas, limites, contratos e backup"],
      carteiras: [
        "Carteira e análise IA",
        "Posições, desempenho, radar e relatórios da IA",
      ],
      imposto: ["Imposto e importação", "IR, DARF e importar do Profit"],
      conta: ["Conta e sistema", "Login, sincronização, backup e status"],
    };
  FER2.forEach((a) => {
    for (let o = a[1].length - 1; o >= 0; o--) {
      const s = a[1][o];
      e.includes(s[0])
        ? a[1].splice(o, 1)
        : t[s[0]] && ((s[2] = t[s[0]][0]), (s[3] = t[s[0]][1]));
    }
  });
  for (let a = FER2.length - 1; a >= 0; a--)
    FER2[a][1].length || FER2.splice(a, 1);
} catch {}
(new MutationObserver(() => {
  const e = document.querySelector("#mdr2 .pn");
  !e ||
    e.dataset.m112 === e.innerHTML.length + "" ||
    (["contratos", "analise", "import", "status", "painel"].forEach((t) =>
      e.querySelectorAll(`.it[data-m2="${t}"]`).forEach((a) => a.remove()),
    ),
    Object.entries({
      imposto: "Imposto e importação",
      carteiras: "Carteira e análise IA",
      mesa: "Mesa e risco",
    }).forEach(([t, a]) =>
      e.querySelectorAll(`.it[data-m2="${t}"] b`).forEach((o) => {
        o.textContent !== a && (o.textContent = a);
      }),
    ),
    (e.dataset.m112 = e.innerHTML.length + ""));
}).observe(document.body, { childList: !0, subtree: !0 }),
  (function () {
    const e = [
      "ops",
      "opgrade",
      "opfluxo",
      "trades",
      "swing",
      "opc",
      "ativos",
      "stats",
      "rev",
    ];
    let t = null;
    const a = () => {
        const n = document.getElementById("bnav");
        if (!n) return;
        const r = e.includes(tab);
        n.querySelectorAll("[data-k]").forEach((i) => {
          const l =
            i.dataset.k === "trades" ? r : r ? !1 : i.classList.contains("on");
          i.classList.contains("on") !== l && i.classList.toggle("on", l);
        });
      },
      o = () => {
        const n = document.getElementById("bnav");
        if (!n) {
          setTimeout(o, 500);
          return;
        }
        ((t = new MutationObserver(a)), t.observe(n, { childList: !0 }), a());
      };
    o();
    const s = render0;
    render0 = function () {
      (s.apply(this, arguments), a());
    };
  })());
const HUB_AV = [
  ["live", "Ao vivo"],
  ["mercado:rk", "Altas e baixas"],
  ["graf", "Gráficos"],
  ["mercado:al", "Alertas"],
];
try {
  ["live", "graf", "mercado:al", "mercado:rk"].forEach((a) => {
    const o = HUB_M.findIndex((s) => s[0] === a);
    o >= 0 && HUB_M.splice(o, 1);
  });
  for (let a = MGRP.length - 1; a >= 0; a--)
    MGRP[a][0] === "Ao vivo" && MGRP.splice(a, 1);
  const e = MGRP.find((a) => a[0] === "Ações"),
    t = MGRP.find((a) => a[0] === "Hoje");
  (e &&
    ((e[1] = e[1].filter((a) => a !== "mercado:rk")),
    t &&
      e[1].forEach((a) => {
        t[1].includes(a) || t[1].push(a);
      }),
    MGRP.splice(MGRP.indexOf(e), 1)),
    HUB_M.some((a) => a[0] === "mercado:saz") ||
      HUB_M.push(["mercado:saz", "Sazonalidade"]));
} catch {}
{
  const e = segM;
  segM = function (t) {
    return HUB_AV.some((a) => a[0] === t)
      ? `<div class="seg hub" style="margin:2px 0 12px">${HUB_AV.map(([a, o]) => `<button class="${a === t ? "on" : ""}" data-hub="${a}">${o}</button>`).join("")}</div>`
      : e.apply(this, arguments);
  };
}
(MODS.splice(
  0,
  MODS.length,
  ["dt", "Day trade", "candle", "B3: mini índice, mini dólar e ações no dia"],
  [
    "sw",
    "Swing trade",
    "chart",
    "Posições de dias e semanas, backtest e scanner",
  ],
  ["op", "Opções", "target", "Carteira, grade ao vivo, fluxo EWZ e análise"],
  ["ex", "EUA e Forex", "globe", "Futuros, ações americanas e Forex"],
),
  Object.keys(MOD_SUB).forEach((e) => delete MOD_SUB[e]),
  Object.assign(MOD_SUB, {
    dt: [
      ["ops", "Operações"],
      ["an", "Análise"],
      ["rpy", "Replay"],
      ["num", "Números"],
    ],
    sw: [
      ["ops", "Operações"],
      ["an", "Análise"],
      ["bt", "Backtest e scanner"],
      ["num", "Números"],
    ],
    op: [
      ["ops", "Operações"],
      ["cart", "Carteira"],
      ["grade", "Grade ao vivo"],
      ["fl", "Fluxo EWZ"],
      ["an", "Análise"],
      ["num", "Números"],
    ],
    ex: [
      ["ops", "Futuros e ações"],
      ["fx", "Forex"],
      ["an", "Análise"],
      ["num", "Números"],
    ],
  }),
  (MOD_TIPO.ex = ["all", "usfx"]));
{
  const e = stRows;
  stRows = function () {
    if (STMK !== "usfx") return e.apply(this, arguments);
    const t = STMK;
    STMK = "all";
    try {
      return e
        .apply(this, arguments)
        .filter((a) => a.forex || moedaT(a) === "USD");
    } finally {
      STMK = t;
    }
  };
}
modDe = function (e) {
  if (e.forex) return "ex";
  const t = e.tipo || "D";
  return t === "O"
    ? "op"
    : t === "F" || moedaT(e) === "USD"
      ? "ex"
      : t === "S"
        ? "sw"
        : "dt";
};
const MOD_TAB = {
  opgrade: ["op", "grade"],
  opfluxo: ["op", "fl"],
  opcart: ["op", "cart"],
  swbt: ["sw", "bt"],
  dtrpy: ["dt", "rpy"],
  ativos: ["ex", "fx"],
};
((modAtual = function () {
  return MOD_TAB[tab]
    ? MOD_TAB[tab][0]
    : tab === "opc"
      ? "op"
      : tab === "swing"
        ? "sw"
        : tab === "trades"
          ? OPMK === "us"
            ? "ex"
            : "dt"
          : (tab === "stats" && STMOD) || "";
}),
  (modSubAtual = function () {
    return MOD_TAB[tab]
      ? MOD_TAB[tab][1]
      : tab === "opc"
        ? XV.O === "an"
          ? "an"
          : "ops"
        : tab === "trades"
          ? XV.D === "an"
            ? "an"
            : "ops"
          : tab === "swing"
            ? XV.S === "an"
              ? "an"
              : "ops"
            : tab === "stats"
              ? STMOD
                ? "num"
                : "geral"
              : tab === "rev"
                ? "rev"
                : "ops";
  }),
  (modVai = function (e, t) {
    (e === "us" && (e = "ex"),
      e === "fx" && ((e = "ex"), (!t || t === "ops") && (t = "fx")),
      (t = t || "ops"),
      e && !(MOD_SUB[e] || []).some((a) => a[0] === t) && (t = "ops"));
    try {
      ls.set("diario-mod", e);
    } catch {}
    if (!e)
      ((STMOD = ""),
        (TIPO = "all"),
        (STMK = "all"),
        (tab = t === "rev" ? "rev" : "stats"));
    else if (t === "num")
      ((STMOD = e),
        (TIPO = MOD_TIPO[e][0]),
        (STMK = MOD_TIPO[e][1]),
        (tab = "stats"));
    else {
      const a = {
        "op:grade": "opgrade",
        "op:fl": "opfluxo",
        "op:cart": "opcart",
        "sw:bt": "swbt",
        "dt:rpy": "dtrpy",
        "ex:fx": "ativos",
      }[e + ":" + t];
      if (a) tab = a;
      else if (e === "dt" || e === "ex") {
        OPMK = e === "ex" ? "us" : "br";
        try {
          ls.set("diario-opm", OPMK);
        } catch {}
        ((tab = "trades"), (XV.D = t === "an" ? "an" : ""));
      } else
        e === "sw"
          ? ((tab = "swing"), (XV.S = t === "an" ? "an" : ""))
          : e === "op" && ((tab = "opc"), (XV.O = t === "an" ? "an" : ""));
    }
    if (["trades", "swing", "opc"].includes(tab))
      try {
        LT = tab;
      } catch {}
    (irPara(tab), scrollTo(0, 0));
  }));
{
  const e = modExtra;
  modExtra = function (t, a) {
    return t !== "ex"
      ? e.apply(this, arguments)
      : e(
          "us",
          a.filter((o) => !o.forex),
        ) +
          e(
            "fx",
            a.filter((o) => o.forex),
          );
  };
}
function vDtReplay() {
  return rpyHtml();
}
function vSwBt() {
  return btHtml();
}
((GOR.replay = () => {
  ((GO.r = null), modVai("dt", "rpy"));
}),
  (GOR.backtest = () => {
    ((GO.r = null), modVai("sw", "bt"));
  }),
  (GOR.scanner = () => {
    ((GO.r = null),
      modVai("sw", "bt"),
      setTimeout(() => {
        const e = document.getElementById("scanner");
        e && e.scrollIntoView({ behavior: "smooth" });
      }, 250));
  }));
{
  const e = vEstudos;
  vEstudos = function () {
    return (
      (ESV === "rpy" || ESV === "bt") && (ESV = "liv"),
      e
        .apply(this, arguments)
        .replace(/<button[^>]*data-id="rpy"[^>]*>[^<]*<\/button>/g, "")
        .replace(/<button[^>]*data-id="bt"[^>]*>[^<]*<\/button>/g, "")
    );
  };
}
(function () {
  const e = ["opcart", "swbt", "dtrpy"],
    t = render0;
  render0 = function () {
    t.apply(this, arguments);
    try {
      e.includes(tab) &&
        document
          .querySelectorAll("#bnav [data-k]")
          .forEach((a) => a.classList.toggle("on", a.dataset.k === "trades"));
    } catch {}
  };
})();
const modsOn = () => {
  const e = (S.ax || {}).modsOn;
  return Array.isArray(e) && e.length
    ? e.filter((t) => MODS.some((a) => a[0] === t))
    : MODS.map((t) => t[0]);
};
{
  const e = modHeader;
  modHeader = function () {
    const t = e.apply(this, arguments),
      a = modsOn(),
      o = modAtual();
    return t.replace(
      /<button class="[^"]*" data-modgo="(dt|sw|op|ex)">[^<]*<\/button>/g,
      (s, n) => (a.includes(n) || n === o ? s : ""),
    );
  };
}
const vh113 = vOpsHub;
vOpsHub = function () {
  const e = modsOn(),
    t = OPSV.todas,
    a = OPSV.ed;
  let o = vh113.apply(this, arguments);
  t ||
    (o = o.replace(
      /<button class="modc" data-modcard="(\w+)">[\s\S]*?<\/span><\/button>/g,
      (n, r) => (e.includes(r) ? n : ""),
    ));
  const s = `<div class="card" style="margin-top:10px"><div class="top"><b class="sm">Minhas modalidades</b><button class="btn s" data-opsv="ed" style="padding:4px 10px">${a ? "Pronto" : "Escolher"}</button></div>${a ? `<div class="sm mut" style="margin:4px 0 6px">Marque o que você opera: o Início, os atalhos e o checklist do Meu dia mostram só essas.</div><div class="chips2">${MODS.map(([n, r]) => `<button class="${e.includes(n) ? "on" : ""}" data-modon="${n}">${r}</button>`).join("")}</div>` : `<div class="sm mut" style="margin-top:4px">${e.length === MODS.length ? "Todas" : e.map((n) => MODS.find((r) => r[0] === n)[1]).join(" · ")}${e.length < MODS.length ? ` · <a href="#" data-opsv="todas">${t ? "mostrar só as minhas" : "mostrar todas"}</a>` : ""}</div>`}</div>`;
  return o.replace("<h2>Visão geral</h2>", s + "<h2>Visão geral</h2>");
};
const OPSV = { todas: !1, ed: !1 };
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-opsv]");
  if (t) {
    (e.preventDefault(),
      (OPSV[t.dataset.opsv] = !OPSV[t.dataset.opsv]),
      render());
    return;
  }
  const a = e.target.closest("[data-modon]");
  if (a) {
    const o = modsOn(),
      s = a.dataset.modon,
      n = o.includes(s) ? o.filter((r) => r !== s) : [...o, s];
    if (!n.length) {
      toast("Deixe pelo menos uma.");
      return;
    }
    (((S.ax ?? (S.ax = {})).modsOn = MODS.map((r) => r[0]).filter((r) =>
      n.includes(r),
    )),
      save(),
      render());
  }
});
function modHojeHtml() {
  const e = hjD(),
    t = modLinhas(),
    a = modsOn(),
    o = (s) => emBRL(s.c.pl, moedaT(s.t));
  return `<div class="card" id="modhj" style="padding:12px"><div class="top" style="margin-bottom:8px"><b class="sm">Hoje por modalidade</b><button class="btn s" data-modhub="1" style="padding:3px 9px">Operações ›</button></div><div class="modhjg">${a
    .map((s) => {
      const n = t.filter(
          (d) =>
            d.m === s &&
            d.c.pl != null &&
            String(d.t.dtx || d.t.dt).slice(0, 10) === e,
        ),
        r = t.filter((d) => d.m === s && d.c.pl == null && !d.t.dtx).length,
        i = sum(n.map(o)),
        l = MODS.find((d) => d[0] === s)[1];
      return `<button class="modhj" data-modcard="${s}"><small>${l}</small><b class="${cls(i)}">${n.length ? money(i) : "–"}</b><i>${n.length ? n.length + " trade(s)" : r ? r + " aberta(s)" : "sem trades"}</i></button>`;
    })
    .join("")}</div></div>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#modhj")) return;
      const a = t.querySelector("#apc") || t.querySelector("h2");
      if (!a) return;
      const o = document.createElement("div");
      ((o.innerHTML = modHojeHtml()), a.after(o.firstElementChild));
    } catch {}
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab === "dia" && !modsOn().includes("ex")) {
        const t = document.getElementById("mdmsw");
        (t && t.remove(),
          typeof MDM < "u" && MDM === "us" && (mdmSet("br"), render()));
      }
    } catch {}
  };
}
const ROTM_PAD = {
    dt: [
      "Níveis do dia marcados (máxima, mínima, fechamento)",
      "Limite de perda e número de trades definidos",
      "Horário das notícias do dia conferido",
      "Setup do dia escolhido",
    ],
    sw: [
      "Tendência no diário e no semanal conferida",
      "Stop e alvo das posições atualizados",
      "Balanços e eventos das empresas da carteira conferidos",
    ],
    op: [
      "IV Rank e vencimento conferidos",
      "Liquidez ok (spread e negócios)",
      "Risco máximo da estrutura definido",
      "Posições perto do vencimento revisadas (exercício)",
    ],
    ex: [
      "Sessão definida (pré, regular ou noite)",
      "Agenda americana conferida (CPI, payroll, Fed)",
      "Contratos/lote dentro do risco em US$",
    ],
  },
  rotM = (e) => {
    const t = ((S.ax || {}).rotMod || {})[e];
    return Array.isArray(t) && t.length ? t : ROTM_PAD[e];
  };
let ROTM_AB = null,
  ROTM_ED = !1;
function rotMHtml() {
  const e = modsOn(),
    t = e.includes(ROTM_AB) ? ROTM_AB : e[0];
  if (!t) return "";
  const a = S.days[D] || {},
    o = (a.rm || {})[t] || {},
    s = rotM(t),
    n = s.filter((r, i) => o[i]).length;
  return `<div class="card" id="rotm"><div class="top"><b class="sm">Checklist por modalidade</b><span class="sm ${n === s.length ? "g" : "mut"}">${n}/${s.length}</span></div>${
    e.length > 1
      ? `<div class="chips2" style="margin:6px 0">${e
          .map((r) => {
            const i = (a.rm || {})[r] || {},
              l = rotM(r).filter((d, c) => i[c]).length;
            return `<button class="${r === t ? "on" : ""}" data-rotm="${r}">${MODS.find((d) => d[0] === r)[1]} ${l}/${rotM(r).length}</button>`;
          })
          .join("")}</div>`
      : ""
  }
${
  ROTM_ED
    ? `<textarea id="rotmtx" style="min-height:110px">${esc(
        s.join(`
`),
      )}</textarea><div class="g2"><button class="btn s" data-rotmed="salva">Salvar</button><button class="btn s" data-rotmed="pad">Voltar ao padrão</button></div>`
    : s
        .map(
          (r, i) =>
            `<label class="ck"><input type="checkbox" data-rotmi="${t}|${i}"${o[i] ? " checked" : ""}><span>${esc(r)}</span></label>`,
        )
        .join("") +
      '<button class="btn s" data-rotmed="ed" style="margin-top:6px;padding:4px 10px">Editar itens</button>'
}</div>`;
}
(document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-rotm]");
  if (a) {
    ((ROTM_AB = a.dataset.rotm), (ROTM_ED = !1), rotMPinta());
    return;
  }
  const o = e.target.closest("[data-rotmed]");
  if (!o) return;
  const s = modsOn(),
    n = s.includes(ROTM_AB) ? ROTM_AB : s[0],
    r = o.dataset.rotmed;
  if (r === "ed") ROTM_ED = !0;
  else {
    const i = (t = S.ax ?? (S.ax = {})).rotMod ?? (t.rotMod = {});
    if (r === "salva") {
      const l = (document.getElementById("rotmtx").value || "")
        .split(
          `
`,
        )
        .map((d) => d.trim())
        .filter(Boolean)
        .slice(0, 15);
      l.length && (i[n] = l);
    } else delete i[n];
    ((ROTM_ED = !1), save());
  }
  rotMPinta();
}),
  document.addEventListener("change", (e) => {
    var t;
    const a = e.target.closest("[data-rotmi]");
    if (!a) return;
    const [o, s] = a.dataset.rotmi.split("|"),
      n = dia$(D);
    ((((t = n.rm ?? (n.rm = {}))[o] ?? (t[o] = {}))[s] = a.checked ? 1 : 0),
      (n.u = Date.now()),
      save(),
      rotMPinta());
  }));
function rotMPinta() {
  const e = document.getElementById("rotm");
  if (e) {
    const t = document.createElement("div");
    ((t.innerHTML = rotMHtml()), e.replaceWith(t.firstElementChild || t));
  }
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || DV !== "ed") return;
      const t = document.querySelector('#app .dfase[data-fase="pre"]');
      if (t && !t.querySelector("#rotm")) {
        const a = document.createElement("div");
        a.innerHTML = rotMHtml();
        const o = t.querySelector("#sonoc");
        o ? o.after(a.firstElementChild) : t.prepend(a.firstElementChild);
      }
    } catch {}
  };
}
function vOpCart() {
  const e = S.trades.filter((d) => (d.tipo || "D") === "O" && isOpen(d));
  if (!e.length)
    return '<h1>Carteira de opções</h1><div class="card sm mut">Nenhuma opção aberta. Quando houver, aqui aparecem as gregas somadas, quanto você ganha ou perde por dia com o tempo (theta) e o que acontece se o mercado andar.</div>';
  const t = {},
    a = hjD();
  e.forEach((d) => {
    const c = opResumo(d);
    if (!c) return;
    const p = opSub(d) || "?";
    (t[p] ?? (t[p] = [])).push({ t: d, R: c });
  });
  const o = [-0.1, -0.05, -0.02, 0, 0.02, 0.05, 0.1],
    s = { d: 0, th: 0, ve: 0, pl: 0, cen: o.map(() => 0), dlr: 0 },
    n = (d) => (Math.abs(d) < 0.005 ? 0 : d),
    r = Object.entries(t).map(([d, c]) => {
      const p = c[0].R.S,
        u = { d: 0, g: 0, th: 0, ve: 0 },
        m = sum(c.map((g) => opValor(g.R.L, g.R.ivs, g.R.S, a, g.R.r))),
        f = o.map((g) =>
          sum(c.map((h) => opValor(h.R.L, h.R.ivs, h.R.S * (1 + g), a, h.R.r))),
        );
      (c.forEach((g) =>
        ["d", "g", "th", "ve"].forEach((h) => (u[h] += g.R.gr[h])),
      ),
        (s.d += u.d * p),
        (s.th += u.th),
        (s.ve += u.ve),
        (s.pl += m),
        f.forEach((g, h) => (s.cen[h] += g)));
      const x = c.map((g) => g.R.dte).filter((g) => g != null),
        v = x.length ? Math.min(...x) : null;
      return { k: d, S0: p, g: u, pl: m, cen: f, n: c.length, prox: v };
    }),
    i = dshCor(),
    l = (d) => `<td class="${cls(d)}">${dshK(d)}</td>`;
  return `<h1>Carteira de opções</h1><div class="sm mut" style="margin:-6px 0 10px">${e.length} posição(ões) aberta(s) em ${r.length} ativo(s). Valores de hoje, pelo modelo, com o preço atual do ativo.</div>
<div class="dshk">${[
    [
      "Resultado agora",
      money(n(s.pl)),
      "se encerrasse tudo pelo modelo",
      cls(n(s.pl)),
    ],
    [
      "Theta por dia",
      money(s.th),
      s.th >= 0 ? "o tempo trabalha a seu favor" : "o tempo come o prêmio",
      cls(s.th),
    ],
    [
      "Delta total",
      money(s.d),
      "R$ que você ganha a cada 1% de alta ≈ " + money(s.d / 100),
      "",
    ],
    ["Vega total", money(s.ve), "por +1 ponto de volatilidade", cls(s.ve)],
  ]
    .map(
      ([d, c, p, u]) =>
        `<div class="dshkt"><span class="sm mut">${d}</span><b class="${u}">${c}</b><span class="sm mut">${p}</span></div>`,
    )
    .join("")}</div>
<h2>Por ativo</h2><div class="card">${dshTab(
    ["Ativo", "Posições", "Delta (ações)", "Theta/dia", "Resultado", "Vence"],
    r.map(
      (d) =>
        `<tr><td><b>${esc(d.k)}</b> <span class="mut">${opN(d.S0)}</span></td><td>${d.n}</td><td>${opN(d.g.d, 0)}</td><td class="${cls(d.g.th)}">${money(d.g.th)}</td><td class="${cls(d.pl)}">${money(d.pl)}</td><td class="${d.prox != null && d.prox <= 5 ? "r" : ""}">${d.prox != null ? d.prox + " d" : "–"}</td></tr>`,
    ),
  )}</div>
<h2>E se o mercado andar hoje?</h2><div class="card">${dshTab(["Ativo", ...o.map((d) => (d > 0 ? "+" : "") + Math.round(d * 100) + "%")], r.map((d) => `<tr><td>${esc(d.k)}</td>${d.cen.map(l).join("")}</tr>`).concat([`<tr><td><b>Total</b></td>${s.cen.map((d) => `<td class="${cls(d)}"><b>${dshK(d)}</b></td>`).join("")}</tr>`]))}
<div class="sm" style="margin-top:6px">${s.cen[0] < 0 && Math.abs(s.cen[0]) > Math.abs(s.cen[6]) ? `Sua carteira sofre mais numa queda forte: <b class="r">${money(s.cen[0])}</b> se tudo cair 10%.` : s.cen[6] < 0 ? `Sua carteira sofre numa alta forte: <b class="r">${money(s.cen[6])}</b> se tudo subir 10%.` : "Sem perda grande nos cenários de ±10%."}</div></div>
${(() => {
  try {
    return strHtml();
  } catch {
    return "";
  }
})()}`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab === "opc") {
        const t = document.getElementById("opstress");
        t && t.remove();
      }
    } catch {}
  };
}
function modPdf(e, t) {
  const a = hjD();
  let o = a.slice(0, 7);
  if (t) {
    const p = new Date(a.slice(0, 8) + "15T12:00:00Z");
    (p.setUTCMonth(p.getUTCMonth() - 1), (o = p.toISOString().slice(0, 7)));
  }
  const s = (MODS.find((p) => p[0] === e) || [])[1] || "",
    n = modLinhas()
      .filter(
        (p) =>
          p.m === e &&
          p.c.pl != null &&
          String(p.t.dtx || p.t.dt).slice(0, 7) === o,
      )
      .map((p) => (p.t.c ? p.t : { ...p.t, c: p.c }));
  if (!n.length) {
    toast("Sem trades encerrados de " + s + " nesse mês.");
    return;
  }
  const r = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ],
    i = `${s} · ${r[+o.slice(5) - 1]} de ${o.slice(0, 4)}`;
  DSH_COR = DSH_CLARO;
  let l;
  try {
    const p = stDsh(n),
      u = dshKpi(p);
    l = `<div><h1>${esc(i)}</h1><h2>Resumo</h2>${dshTiles(u, null)}<h2>Curva de capital e quedas</h2><div class="card">${dshEq(p, DSH_COR)}</div>${modExtra(e, n)}
<h2>Trades do mês</h2><div class="card">${dshTab(
      ["Data", "Ativo", "Lado", "Resultado", "× risco"],
      n
        .sort((m, f) =>
          String(m.dtx || m.dt).localeCompare(String(f.dtx || f.dt)),
        )
        .map(
          (m) =>
            `<tr><td>${fmtD(String(m.dtx || m.dt).slice(0, 10)).slice(0, 5)}</td><td>${esc(m.ativo || m.s || "")}</td><td>${m.side === "V" ? "venda" : m.side === "C" ? "compra" : ""}</td><td class="${cls(m.c.pl)}">${mT(m, m.c.pl)}</td><td>${m.c.r != null ? dshN(m.c.r) : "–"}</td></tr>`,
        ),
    )}</div></div>`;
  } finally {
    DSH_COR = null;
  }
  const d = document.createElement("div");
  d.innerHTML = l;
  const c = d.firstElementChild;
  ((c.id = "anx_rep"),
    (c.style.display = "none"),
    document.body.appendChild(c));
  try {
    anxPdf();
  } finally {
    c.remove();
  }
  try {
    ((PDFB.tt = i), (PDFB.name = `${e}-${o}.pdf`));
    const p = document.querySelector("#pdfbody h1");
    (p && (p.textContent = i), pdfBar());
  } catch {}
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-modpdf]");
  t && modPdf(STMOD || modAtual(), t.dataset.modpdf === "ant");
});
{
  const e = vStats;
  vStats = function () {
    const t = e.apply(this, arguments);
    return STMOD
      ? t.replace(
          /(<h1>N\xfameros \xb7 [^<]*<\/h1>)/,
          '$1<div class="g2" style="margin:-4px 0 8px"><button class="btn s" data-modpdf="este">📄 PDF deste mês</button><button class="btn s" data-modpdf="ant">📄 PDF do mês passado</button></div>',
        )
      : t;
  };
}
const BUSCA = [
    [
      "Início",
      "resumo do dia home",
      () => {
        tab = "home";
      },
    ],
    [
      "Modo pregão",
      "pregão trava foco",
      () => {
        ((tab = "home"), setTimeout(pgAbre, 200));
      },
    ],
    [
      "Operações",
      "modalidades",
      () => {
        tab = "ops";
      },
    ],
    ["Day trade", "mini índice win wdo b3", () => modVai("dt", "ops")],
    ["Replay (treino)", "replay treino candles", () => modVai("dt", "rpy")],
    ["Swing trade", "swing posições", () => modVai("sw", "ops")],
    [
      "Backtest e scanner",
      "backtest scanner setups regras",
      () => modVai("sw", "bt"),
    ],
    ["Opções: operações", "opções trades", () => modVai("op", "ops")],
    [
      "Carteira de opções",
      "gregas theta delta cenários stress",
      () => modVai("op", "cart"),
    ],
    [
      "Grade de opções ao vivo",
      "grade séries strike compra venda spread analisar opção",
      () => modVai("op", "grade"),
    ],
    ["Fluxo EWZ", "ewz boletas fluxo", () => modVai("op", "fl")],
    [
      "EUA e Forex",
      "eua futuros americanas mes mnq",
      () => modVai("ex", "ops"),
    ],
    ["Forex", "forex pares lucros fundingpips", () => modVai("ex", "fx")],
    [
      "Estatísticas gerais",
      "estatísticas números resultado acerto fator lucro",
      () => modVai("", "geral"),
    ],
    [
      "Simulações (e se, ruína)",
      "simulações e se ruína kelly regras de gestão",
      () => {
        (modVai("", "geral"), (ST.aba = "sim"), render());
      },
    ],
    [
      "Fatores (sono, turno, contexto)",
      "fatores sono turno contexto eventos nota",
      () => {
        (modVai("", "geral"), (ST.aba = "fat"), render());
      },
    ],
    [
      "Revisão da semana",
      "revisão calendário metas do mês",
      () => modVai("", "rev"),
    ],
    [
      "Ao vivo",
      "ao vivo cotações profit trades de olho radar",
      () => {
        tab = "live";
      },
    ],
    [
      "Altas e baixas",
      "altas baixas ranking ações",
      () => {
        ((tab = "mercado"), (MKT.tab = "rk"));
      },
    ],
    [
      "Alertas",
      "alertas preço",
      () => {
        ((tab = "mercado"), (MKT.tab = "al"));
      },
    ],
    [
      "Gráficos",
      "gráficos tradingview",
      () => {
        tab = "graf";
      },
    ],
    [
      "Balanços",
      "balanços resultados cvm itr",
      () => {
        ((tab = "mercado"), (MKT.tab = "pn"));
      },
    ],
    [
      "Agenda econômica",
      "agenda payroll copom cpi eventos",
      () => {
        ((tab = "mercado"), (MKT.tab = "ag"));
      },
    ],
    [
      "Notícias",
      "notícias",
      () => {
        ((tab = "mercado"), (MKT.tab = "nt"));
      },
    ],
    [
      "Juros e DI",
      "juros di selic cdi curva",
      () => {
        tab = "juros";
      },
    ],
    [
      "Sazonalidade",
      "sazonalidade",
      () => {
        ((tab = "mercado"), (MKT.tab = "saz"));
      },
    ],
    [
      "Meu dia",
      "rotina diário debriefing plano",
      () => {
        tab = "dia";
      },
    ],
    [
      "Minhas regras",
      "regras playbook cartas",
      () => {
        tab = "regras";
      },
    ],
    [
      "Mesa e risco",
      "mesa proprietária metas limites backup prop",
      () => {
        tab = "mesa";
      },
    ],
    [
      "Contratos",
      "contratos lote tamanho posição",
      () => {
        tab = "contratos";
      },
    ],
    [
      "Imposto de renda",
      "imposto ir darf contador",
      () => {
        tab = "imposto";
      },
    ],
    [
      "Importar do Profit",
      "importar profit csv relatório",
      () => {
        tab = "import";
      },
    ],
    [
      "Plano de transição",
      "clt transição salário cdi ibovespa carreira",
      () => {
        tab = "carreira";
      },
    ],
    [
      "Carteiras",
      "carteiras investimentos",
      () => {
        tab = "carteiras";
      },
    ],
    [
      "Análise IA",
      "análise ia gemini relatório",
      () => {
        tab = "analise";
      },
    ],
    [
      "Estudos",
      "estudos livros cnpi flashcards planos faculdade",
      () => {
        tab = "estudos";
      },
    ],
    [
      "Conta",
      "conta login sincronização backup",
      () => {
        tab = "conta";
      },
    ],
    [
      "Status do sistema",
      "status funções versões",
      () => {
        tab = "status";
      },
    ],
    [
      "Ferramentas",
      "ferramentas bloqueio face id siri parceiro família avisos",
      () => {
        tab = "mais";
      },
    ],
  ],
  semAc = (e) =>
    String(e || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
function buscaRes(e) {
  if (((e = semAc(e).trim()), e.length < 2)) return [];
  const t = e.split(/\s+/);
  return BUSCA.map((a, o) => {
    const s = semAc(a[0] + " " + a[1]);
    return [
      t.every((n) => s.includes(n))
        ? semAc(a[0]).startsWith(t[0])
          ? 3
          : semAc(a[0]).includes(t[0])
            ? 2
            : 1
        : 0,
      o,
    ];
  })
    .filter((a) => a[0])
    .sort((a, o) => o[0] - a[0])
    .slice(0, 8)
    .map((a) => a[1]);
}
(new MutationObserver(() => {
  const e = document.querySelector("#mdr2 .pn");
  if (!e || e.querySelector("#bsq")) return;
  const t = e.querySelector(".hd");
  if (!t) return;
  const a = document.createElement("div");
  ((a.className = "bsw"),
    (a.innerHTML =
      '<input id="bsq" type="search" placeholder="🔍 Buscar no app (ex.: DARF, contratos)" autocomplete="off"><div id="bsr"></div>'),
    t.after(a));
}).observe(document.body, { childList: !0, subtree: !0 }),
  document.addEventListener("input", (e) => {
    if (e.target.id !== "bsq") return;
    const t = document.getElementById("bsr");
    if (!t) return;
    const a = buscaRes(e.target.value);
    t.innerHTML = a.length
      ? a
          .map(
            (o) =>
              `<button class="bsi" data-bsi="${o}">${esc(BUSCA[o][0])}</button>`,
          )
          .join("")
      : e.target.value.trim().length > 1
        ? '<div class="sm mut" style="padding:6px">Nada encontrado.</div>'
        : "";
  }),
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest("[data-bsi]");
      if (!t) return;
      e.stopPropagation();
      const a = document.getElementById("mdr2");
      (a && a.remove(), (document.body.style.overflow = ""));
      const o = BUSCA[+t.dataset.bsi][2];
      /* Rota única: os atalhos da busca definem a tela e a troca passa por irPara (mantém subabas). */
      (o(), /modVai/.test(String(o)) || irPara(tab), scrollTo(0, 0));
    },
    !0,
  ));
{
  const e = TraderStyles.slot("legacy-051");
  ((e.textContent = TraderStyles.css("legacy-051")), TraderStyles.mount(e));
}
{
  const e = render0;
  render0 = function () {
    (tab === "estudos" &&
      (ESV === "rpy" || ESV === "bt") &&
      ((tab = ESV === "rpy" ? "dtrpy" : "swbt"), (ESV = "liv")),
      e.apply(this, arguments));
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      tab === "estudos" && ESV === "cnpi" && !CNB.ok && cnBancoCarrega();
    } catch {}
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t) return;
      const a = t.querySelector(".trv-top");
      a && a.remove();
      const o = t.querySelector("#apc");
      if (o) {
        [...o.querySelectorAll("div")].forEach((n) => {
          /^\ud83d\udd12|^Trava/.test((n.textContent || "").trim()) &&
            n.querySelector(".sm.mut") &&
            /Trava/.test(n.textContent) &&
            n.children.length <= 3 &&
            n.parentElement === o &&
            n.remove();
        });
        const s = o.querySelector(".top .chip.r");
        s && s.remove();
      }
    } catch {}
  };
}
try {
  const e = S.ax ?? (S.ax = {});
  if (!e.hb187) {
    e.hb187 = 1;
    const t = e["home.layout"];
    t
      ? (t.ocultos = [...new Set([...(t.ocultos || []), "venc"])])
      : (e["home.layout"] = {
          ordem: [
            "hero",
            "posso",
            "pos",
            "turno",
            "cap",
            "lim",
            "cal",
            "acoes",
            "metas",
            "adr",
            "venc",
          ],
          ocultos: ["venc"],
        });
  }
} catch {}
{
  const e = vencHtml;
  let t = 0;
  vencHtml = function () {
    return t ? "" : e.apply(this, arguments);
  };
  const a = agHtml;
  agHtml = function () {
    t = 1;
    try {
      return a.apply(this, arguments);
    } finally {
      t = 0;
    }
  };
}
{
  const e = vOpCart;
  vOpCart = function () {
    const t = e.apply(this, arguments);
    let a = "";
    try {
      a = vencHtml();
    } catch {}
    return t.replace(
      /(<h1>Carteira de op\xe7\xf5es<\/h1><div class="sm mut"[^>]*>[^<]*<\/div>|<h1>Carteira de op\xe7\xf5es<\/h1>)/,
      "$1" + a,
    );
  };
}
BUSCA.push([
  "Vencimentos de opções",
  "vencimento calendário opções b3 exercício",
  () => modVai("op", "cart"),
]);
const AV_GRP = {
    tr: "dts",
    ol: "dts",
    opc: "op",
    opciv: "op",
    ewz: "op",
    n: "ex",
  },
  AV_NOME = {
    geral: "Geral (todas as modalidades)",
    dts: "Day trade e Swing",
    op: "Opções",
    ex: "EUA e Forex",
  };
{
  const e = alHtml;
  alHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = document.createElement("div");
      a.innerHTML = t;
      const o = [...a.querySelectorAll("label.ck")].filter((c) =>
        c.querySelector('input[data-al^="on."]'),
      );
      if (o.length < 3) return t;
      const s = [...a.children].find(
          (c) =>
            c.tagName === "H3" && /Pr\xf3ximos eventos/.test(c.textContent),
        ),
        n = { geral: [], dts: [], op: [], ex: [] };
      o.forEach((c) => {
        const p = c.querySelector("input").dataset.al.slice(3),
          u = AV_GRP[p] || "geral",
          m = [c];
        let f = c.nextSibling;
        for (
          ;
          f &&
          f !== s &&
          !(
            f.nodeType === 1 &&
            ((f.matches("label.ck") &&
              f.querySelector('input[data-al^="on."]')) ||
              f.tagName === "H3")
          );

        )
          (m.push(f), (f = f.nextSibling));
        n[u].push(m);
      });
      const r = modsOn(),
        i = {
          geral: 1,
          dts: r.includes("dt") || r.includes("sw"),
          op: r.includes("op"),
          ex: r.includes("ex"),
        },
        l = document.createElement("div");
      Object.entries(n).forEach(([c, p]) => {
        if (!p.length) return;
        const u = document.createElement("details");
        ((u.className = "avg"),
          i[c] && (u.open = !0),
          (u.innerHTML = `<summary><b>${AV_NOME[c]}</b>${i[c] ? "" : ' <span class="sm mut">(você não opera)</span>'}</summary>`),
          p.forEach((m) => m.forEach((f) => u.appendChild(f))),
          l.appendChild(u));
      });
      const d = [...a.children].find(
        (c) => c.tagName === "H3" && /Quando avisar/.test(c.textContent),
      );
      return (d ? d.after(l) : a.prepend(l), a.innerHTML);
    } catch (a) {
      return (console.error(a), t);
    }
  };
}
const FAB_TXT = {
  dt: "Day trade (B3)",
  sw: "Swing trade",
  op: "Opção",
  ex: "Day trade nos EUA (US$)",
};
document.addEventListener("click", (e) => {
  if (!e.target.closest('[data-a="fab"]')) return;
  const t = modAtual();
  setTimeout(() => {
    try {
      const a = document.getElementById("fabm");
      if (
        !a ||
        (a
          .querySelectorAll(".fabsug")
          .forEach((n) => n.classList.remove("fabsug")),
        !t || a.style.display === "none")
      )
        return;
      if (t === "ex" && tab === "ativos") {
        ((a.style.display = "none"),
          typeof AV < "u" && (AV = "op"),
          render(),
          setTimeout(() => {
            const n = document.querySelector("#app [data-od]");
            n &&
              (n.scrollIntoView({ behavior: "smooth", block: "center" }),
              n.focus());
          }, 150));
        return;
      }
      const o = t === "sw" ? "S" : t === "op" ? "O" : "D",
        s = a.querySelector(`[data-a="new"][data-tp="${o}"]`);
      if (!s) return;
      (s.classList.add("fabsug"),
        s.parentElement.prepend(s),
        s.dataset.t0 || (s.dataset.t0 = s.innerHTML),
        (s.innerHTML = s.dataset.t0.replace(
          />([^<>]+)</,
          ">Novo trade: " + FAB_TXT[t] + "<",
        )));
    } catch {}
  }, 0);
});
const metaMod = (e) => ((S.ax || {}).metaMod || {})[e] || {};
function mmDados(e) {
  const t = hjD(),
    a = t.slice(0, 7),
    o = modLinhas().filter((r) => r.m === e && r.c.pl != null),
    s = (r) => emBRL(r.c.pl, moedaT(r.t)),
    n = (r) => String(r.t.dtx || r.t.dt);
  return {
    mes: sum(o.filter((r) => n(r).slice(0, 7) === a).map(s)),
    hoje: sum(o.filter((r) => n(r).slice(0, 10) === t).map(s)),
  };
}
function metaModHtml(e) {
  const t = metaMod(e),
    a = mmDados(e),
    o = (MODS.find((l) => l[0] === e) || [])[1],
    s = +t.meta > 0 ? Math.max(0, a.mes) / t.meta : null,
    n = +t.lim > 0 ? Math.max(0, -a.hoje) / t.lim : null,
    r = dshCor(),
    i = (l, d, c) => {
      const p = 2 * Math.PI * 26,
        u = Math.max(0, Math.min(1, l || 0));
      return `<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="26" fill="none" stroke="${d}" stroke-opacity=".18" stroke-width="7"/>${u > 0 ? `<circle cx="32" cy="32" r="26" fill="none" stroke="${d}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(p * u).toFixed(1)} ${p.toFixed(1)}" transform="rotate(-90 32 32)"/>` : ""}<text x="32" y="36" font-size="13" font-weight="700" text-anchor="middle" fill="${r.tx}">${c}</text></svg>`;
    };
  return `<div class="card" id="metamod"><b class="sm">Meta e limite · ${esc(o)}</b><div style="display:flex;gap:14px;align-items:center;margin:8px 0">${i(s, r.g, s == null ? "–" : Math.round(s * 100) + "%")}<div class="sm" style="flex:1">Mês: <b class="${cls(a.mes)}">${money(a.mes)}</b>${+t.meta > 0 ? ` de ${money(t.meta)}` : ""}<br>Hoje: <b class="${cls(a.hoje)}">${money(a.hoje)}</b>${+t.lim > 0 ? ` · limite de perda ${money(t.lim)}${n >= 1 ? ' <b class="r">(batido: pare)</b>' : ` (usou ${Math.round(n * 100)}%)`}` : ""}</div>${i(n, n >= 1 ? r.r : r.am, n == null ? "–" : Math.round(n * 100) + "%")}</div>
<div class="g2"><label class="sm">Meta do mês (R$)<input type="number" inputmode="decimal" data-metam="${e}|meta" value="${esc(t.meta || "")}" placeholder="ex.: 2000"></label><label class="sm">Limite de perda no dia (R$)<input type="number" inputmode="decimal" data-metam="${e}|lim" value="${esc(t.lim || "")}" placeholder="ex.: 300"></label></div></div>`;
}
document.addEventListener("change", (e) => {
  var t, a;
  const o = e.target.closest("[data-metam]");
  if (!o) return;
  const [s, n] = o.dataset.metam.split("|");
  ((((a = (t = S.ax ?? (S.ax = {})).metaMod ?? (t.metaMod = {}))[s] ??
    (a[s] = {}))[n] = +o.value || 0),
    save());
  const r = scrollY;
  (render(), scrollTo(0, r));
});
{
  const e = vStats;
  vStats = function () {
    const t = e.apply(this, arguments);
    if (!STMOD) return t;
    try {
      return t.replace(
        /(<div class="g2" style="margin:-4px 0 8px"><button class="btn s" data-modpdf="este">[\s\S]*?<\/div>)/,
        "$1" + metaModHtml(STMOD),
      );
    } catch {
      return t;
    }
  };
}
{
  const e = modHojeHtml;
  modHojeHtml = function () {
    let t = e.apply(this, arguments);
    try {
      modsOn().forEach((a) => {
        const o = metaMod(a);
        +o.lim > 0 &&
          -mmDados(a).hoje >= +o.lim &&
          (t = t.replace(
            new RegExp(`(data-modcard="${a}"><small>[^<]*)</small>`),
            '$1 <b class="r">· limite batido</b></small>',
          ));
      });
    } catch {}
    return t;
  };
}
{
  const e = limiteConfere;
  limiteConfere = function () {
    e.apply(this, arguments);
    try {
      const t = hjD();
      modsOn().forEach((a) => {
        const o = metaMod(a);
        if (!(+o.lim > 0)) return;
        const s = "mmlim." + a + "." + t;
        (S.ax || {})[s] ||
          (-mmDados(a).hoje >= +o.lim &&
            ((S.ax[s] = 1),
            save(),
            toast(
              "🛑 " +
                (MODS.find((n) => n[0] === a) || [])[1] +
                ": você bateu o limite de perda do dia dessa modalidade.",
              5e3,
            )));
      });
    } catch {}
  };
}
{
  const e = pgHtml;
  pgHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = modsOn()
        .map((o) => {
          const s = metaMod(o);
          if (!(+s.lim > 0)) return "";
          const n = mmDados(o),
            r = +s.lim + Math.min(0, n.hoje);
          return `<div><span>${(MODS.find((i) => i[0] === o) || [])[1]}</span><b class="${r <= 0 ? "r" : ""}">${r <= 0 ? "pare" : money(r)}</b></div>`;
        })
        .filter(Boolean);
      a.length &&
        (t = t.replace(
          '<div class="pg-b">',
          `<div class="pg-ms">${a.join("")}</div><div class="pg-b">`,
        ));
    } catch {}
    return t;
  };
}
function rvModHtml() {
  if (typeof RP != "string" || RP[0] !== "w") return "";
  const [e, t, a] = rng(RP),
    o = String(e).slice(0, 10),
    s = String(t).slice(0, 10),
    n = modLinhas().filter(
      (i) =>
        i.c.pl != null &&
        String(i.t.dtx || i.t.dt).slice(0, 10) >= o &&
        String(i.t.dtx || i.t.dt).slice(0, 10) <= s,
    ),
    r = ((S.ax || {}).rvMod || {})[a] || {};
  return `<h2>Semana por modalidade</h2><div class="card" id="rvmod"><div class="sm mut">Cada modalidade tem o seu ajuste: o que funciona no day trade não é o mesmo das opções.</div>${modsOn()
    .map((i) => {
      const l = n.filter((f) => f.m === i),
        d = l.map((f) => emBRL(f.c.pl, moedaT(f.t))),
        c = l.map((f) => f.c.r).filter((f) => f != null && isFinite(f)),
        p = sum(d),
        u = (MODS.find((f) => f[0] === i) || [])[1],
        m = l.filter((f) => f.t.err && f.t.err !== "Nenhum").length;
      return `<div style="padding:8px 0;border-top:1px solid var(--bd)"><div class="top sm"><b>${u}</b><b class="${cls(p)}">${l.length ? money(p) : "sem trades"}</b></div>${l.length ? `<div class="sm mut">${l.length} trade(s) · ${pct0(d.filter((f) => f > 0).length / d.length)} de acerto${c.length ? " · " + dshN(sum(c) / c.length) + "×" : ""}${m ? ` · <span class="r">${m} com erro</span>` : ""}</div>` : ""}<textarea data-rvmod="${esc(a)}|${i}" placeholder="O que ajustar em ${u} na próxima semana" style="min-height:56px;margin-top:6px">${esc(r[i] || "")}</textarea></div>`;
    })
    .join("")}</div>`;
}
document.addEventListener("input", (e) => {
  var t, a;
  const o = e.target.closest("[data-rvmod]");
  if (!o) return;
  const [s, n] = o.dataset.rvmod.split("|");
  ((((a = (t = S.ax ?? (S.ax = {})).rvMod ?? (t.rvMod = {}))[s] ?? (a[s] = {}))[
    n
  ] = o.value),
    clearTimeout(o._s),
    (o._s = setTimeout(save, 600)));
});
{
  const e = vRev;
  vRev = function () {
    const t = e.apply(this, arguments);
    try {
      const a = rvModHtml();
      if (!a) return t;
      const o = t.indexOf("<h2>Revisão do período</h2>");
      return o > 0 ? t.slice(0, o) + a + t.slice(o) : t + a;
    } catch {
      return t;
    }
  };
}
function filaPend() {
  const e = +S.lastSyncAt || 0,
    t = (a) => (a || []).filter((o) => (+o.u || 0) > e).length;
  return (
    t(S.trades) +
    Object.values(S.days || {}).filter((a) => (+a.u || 0) > e).length +
    t(S.ops) +
    t(S.mesaTr) +
    t(S.lanc)
  );
}
function filaPinta() {
  try {
    const e = typeof SESS < "u" && !!SESS,
      t = e ? filaPend() : 0,
      a = !navigator.onLine;
    let o = document.getElementById("filap");
    if (
      !(
        e &&
        t > 0 &&
        (a ||
          (SY && /erro|falh|n\xe3o/i.test(SY.msg || "")) ||
          Date.now() - (+S.lastSyncAt || 0) > 5 * 6e4)
      )
    ) {
      o && o.remove();
      return;
    }
    (o ||
      ((o = document.createElement("button")),
      (o.id = "filap"),
      o.addEventListener("click", () => {
        try {
          sync(!0);
        } catch {}
        toast(
          navigator.onLine
            ? "Sincronizando…"
            : "Sem internet: sobe sozinho quando a conexão voltar.",
        );
      }),
      document.body.appendChild(o)),
      (o.innerHTML = `${a ? "📴" : "⏳"} ${t} alteração(ões) esperando para subir${a ? " · sem internet" : " · toque para enviar"}`));
  } catch {}
}
(setInterval(filaPinta, 5e3),
  addEventListener("online", filaPinta),
  addEventListener("offline", filaPinta));
{
  const e = vConta;
  vConta = function () {
    const t = e.apply(this, arguments);
    try {
      if (typeof SESS > "u" || !SESS) return t;
      const a = filaPend();
      return t.replace(
        /(<div class="hub2 grph"[\s\S]*?<\/div>)/,
        `$1<div class="card sm">${a ? `⏳ <b>${a}</b> alteração(ões) feitas neste aparelho ainda não subiram para a nuvem.${navigator.onLine ? ' <button class="btn s" data-filasync="1" style="padding:3px 9px">Enviar agora</button>' : " Sem internet agora: sobem sozinhas quando a conexão voltar."}` : "✅ Tudo o que você fez neste aparelho já está na nuvem."}</div>`,
      );
    } catch {
      return t;
    }
  };
}
{
  const e = TraderStyles.slot("legacy-052");
  ((e.textContent = TraderStyles.css("legacy-052")), TraderStyles.mount(e));
}
(document.addEventListener("click", (e) => {
  if (e.target.closest("[data-filasync]")) {
    try {
      sync(!0);
    } catch {}
    toast("Sincronizando…");
  }
}),
  (FN_ESPERADA.notificar = "v188"));
