const EN_TIT = {
  mc_en: "O que significa?",
  mc_pt: "Como se diz em inglês?",
  ouvir: "Toque e escute: o que foi dito?",
  lacuna: "Complete a frase",
  montar: "Monte a frase em inglês",
  falar: "Fale em voz alta",
};
function enLicaoHtml() {
  const e = EN.run,
    t = e.Q[e.i],
    a = e.i / e.Q.length,
    o = e.resp;
  let s = "";
  t.tp === "mc_en"
    ? (s = `<div class="enq">${esc(t.it.en)} ${enSom(t.it.en)}</div>`)
    : t.tp === "mc_pt"
      ? (s = `<div class="enq">${esc(t.it.pt)}</div>`)
      : t.tp === "ouvir"
        ? (s = `<button class="enbig" data-enfala="${esc(t.it.en)}">🔊</button><div class="sm mut" style="text-align:center">toque para ouvir de novo</div>`)
        : t.tp === "lacuna"
          ? (s = `<div class="enq sm2">${esc(t.frase)}</div><div class="sm mut">${esc(t.it.exPt)}</div>`)
          : t.tp === "montar"
            ? (s = `<div class="sm mut" style="margin-bottom:6px">${esc(t.it.exPt)}</div><div class="enmont">${e.sel.map((i, l) => `<button class="entk on" data-entr="${l}">${esc(t.banco[i])}</button>`).join("") || '<span class="mut sm">toque nas palavras abaixo</span>'}</div><div class="enbanco">${t.banco.map((i, l) => `<button class="entk" data-entk="${l}"${e.sel.includes(l) || o ? " disabled" : ""}>${esc(i)}</button>`).join("")}</div>${o ? "" : `<button class="btn" data-enok="1" style="width:100%;margin-top:10px"${e.sel.length ? "" : " disabled"}>Verificar</button>`}`)
            : t.tp === "falar" &&
              (s = `<div class="enq">${esc(t.it.en)} ${enSom(t.it.en)}</div><div class="sm mut" style="text-align:center">${esc(t.it.pt)}</div>${o ? "" : '<button class="enbig" data-enmic="1">🎤</button><button class="btn s" data-enpula="1" style="width:100%;margin-top:6px">Não posso falar agora</button>'}`);
  const n = t.ops
      ? `<div class="enops">${t.ops.map((i) => `<button class="enop${o ? (i === t.ans ? " certo" : i === o.val ? " errado" : "") : ""}" data-eno="${esc(i)}"${o ? " disabled" : ""}>${esc(i)}</button>`).join("")}</div>`
      : "",
    r = o
      ? `<div class="enfb ${o.ok ? "ok" : "no"}"><b>${o.ok ? enEmb(["Mandou bem! 🎉", "Isso aí!", "Perfeito!", "Certinho!"])[0] : "Quase! A resposta é:"}</b>${o.ok ? "" : `<div class="enans">${esc(t.ans)}</div>`}<div class="sm" style="margin-top:6px"><b>${esc(t.it.en)}</b> = ${esc(t.it.pt)}</div><div class="sm">“${esc(t.it.ex)}” ${enSom(t.it.ex)}</div><div class="sm mut">${esc(t.it.exPt)}</div><button class="btn" data-enn="1" style="width:100%;margin-top:10px">Continuar</button></div>`
      : "";
  return `<div class="entop"><button class="btn s" data-enx="1" aria-label="Sair">✕</button><div class="enbar big"><i style="width:${Math.round(a * 100)}%"></i></div><b class="g">${e.xp} XP</b></div><div class="card enl"><div class="sm mut">${EN_TIT[t.tp]}</div>${s}${n}</div>${r}`;
}
function enFimHtml() {
  const e = EN.run,
    t = e.res.filter((r) => r.ok).length,
    a = e.res.length,
    o = [
      ...new Map(
        e.res.filter((r) => !r.ok).map((r) => [r.it.id, r.it]),
      ).values(),
    ],
    s = Math.max(1, Math.round((Date.now() - e.ini) / 6e4)),
    n = enSeq();
  return `<div class="card enfim"><div style="font-size:48px">${t === a ? "🏆" : t / a >= 0.7 ? "🎉" : "💪"}</div><b style="font-size:22px">Lição concluída!</b><div class="enst" style="justify-content:center;margin:10px 0"><span>⚡ <b>+${e.xp}</b> XP</span><span>🎯 <b>${Math.round((t / a) * 100)}%</b></span><span>⏱️ <b>${s}</b> min</span><span>🔥 <b>${n}</b> dia${n === 1 ? "" : "s"}</span></div>
${o.length ? `<div class="sm" style="text-align:left"><b>Para revisar:</b>${o.map((r) => `<div style="padding:4px 0;border-top:1px solid var(--bd)"><b>${esc(r.en)}</b> ${enSom(r.en)} = ${esc(r.pt)}</div>`).join("")}</div>` : '<div class="sm">Sem erros. As palavras voltam em alguns dias para fixar.</div>'}
<button class="btn" data-enl="${e.tema || ""}" style="width:100%;margin-top:12px"${e.modo === "rev" ? ' data-enrev="1"' : ""}>Outra lição</button><button class="btn s" data-enx="1" style="width:100%;margin-top:8px">Voltar</button></div>`;
}
function enView() {
  if (!EN.ok)
    return (
      enCarrega(),
      `<h1>Estudos</h1>${EN_SG()}<div class="card"><p class="mut">Carregando…</p></div>`
    );
  const e = EN.run;
  return e ? `<h1>Inglês</h1>${e.fim ? enFimHtml() : enLicaoHtml()}` : enHome();
}
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "ing"
      ? enView()
      : e
          .apply(this, arguments)
          .replace(
            /(<div class="seg" style="margin:8px 0 10px">[\s\S]*?)(<\/div>)/,
            '$1<button data-ep="esv" data-id="ing">🇺🇸 Inglês</button>$2',
          );
  };
}
(document.addEventListener("click", (e) => {
  const t = (s) => e.target.closest(s);
  let a;
  if ((a = t("[data-enfala]"))) {
    (e.stopPropagation(), enFala(a.dataset.enfala));
    return;
  }
  if ((a = t("[data-enrev]"))) {
    enInicia("rev");
    return;
  }
  if ((a = t("[data-enl]"))) {
    enInicia("lic", a.dataset.enl);
    return;
  }
  if (t("[data-enx]")) {
    ((EN.run = null), render(), scrollTo(0, 0));
    return;
  }
  if (t("[data-enn]")) {
    enProxima();
    return;
  }
  if ((a = t("[data-eno]"))) {
    enResponde(a.dataset.eno);
    return;
  }
  const o = EN.run;
  if ((a = t("[data-entk]"))) {
    o && !o.resp && (o.sel.push(+a.dataset.entk), enRepintarLicao());
    return;
  }
  if ((a = t("[data-entr]"))) {
    o && !o.resp && (o.sel.splice(+a.dataset.entr, 1), enRepintarLicao());
    return;
  }
  if (t("[data-enok]") && o) {
    const s = o.Q[o.i];
    enResponde(o.sel.map((n) => s.banco[n]).join(" "));
    return;
  }
  if (t("[data-enpula]") && o) {
    ((o.Q[o.i] = enPergunta(o.Q[o.i].it, "mc_pt")), enRepintarLicao());
    return;
  }
  if (t("[data-enmic]") && o) {
    const s = enRec();
    if (!s) return;
    const n = new s();
    ((n.lang = "en-US"),
      (n.interimResults = !1),
      (n.maxAlternatives = 3),
      (a = t("[data-enmic]")),
      (a.textContent = "…"),
      (n.onresult = (r) => {
        const i = [...r.results[0]].map((c) => c.transcript),
          l = o.Q[o.i],
          d = i.find((c) => enParecido(c, l.ans));
        enResponde(d || i[0] || "");
      }),
      (n.onerror = () => {
        (toast("Não consegui ouvir. Tente de novo ou pule."),
          enRepintarLicao());
      }));
    try {
      n.start();
    } catch {}
    return;
  }
  if ((a = t("[data-enmeta]"))) {
    ((enS().cfg.meta = +a.dataset.enmeta), save(), render());
    return;
  }
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-encfg]");
    if (!t) return;
    const a = enS().cfg;
    ((a[t.dataset.encfg] =
      t.type === "checkbox" ? (t.checked ? 1 : 0) : +t.value),
      save(),
      t.dataset.encfg === "vel" && enFala("Nice to meet you"),
      render());
  }));
try {
  GOR.ingles = () => {
    ((ESV = "ing"), irPara("estudos"));
  };
} catch {}
((HB_NOMES.en = "Inglês do dia"),
  HB_PADRAO.includes("en") ||
    HB_PADRAO.splice(Math.max(0, HB_PADRAO.indexOf("cal")), 0, "en"));
try {
  HM_ESC.durante.includes("en") || HM_ESC.durante.push("en");
} catch {}
function enInicioHtml() {
  if (!EN.ok)
    return (setTimeout(enCarrega, 1500), '<section data-hb="en"></section>');
  const e = enS(),
    t = e.xp[enHoje()] || 0,
    a = +e.cfg.meta || 30,
    o = enDoDia();
  return `<section data-hb="en"><div class="card enini"><div class="top"><b>🇺🇸 Inglês do dia</b><span class="sm">🔥 ${enSeq()} · ${t}/${a} XP</span></div>${o ? `<div style="margin:6px 0"><b class="enw" style="font-size:20px">${esc(o.en)}</b> ${enSom(o.en)} <span class="sm mut">= ${esc(o.pt)}</span></div>` : ""}<button class="btn s" data-enl="" style="width:100%" data-engo="1">${t >= a ? "Meta batida. Mais uma lição?" : "Fazer a lição de hoje (3 min)"}</button></div></section>`;
}
document.addEventListener(
  "click",
  (e) => {
    if (!e.target.closest("[data-engo]")) return;
    e.stopImmediatePropagation();
    const t = enTemas(),
      a =
        t.find(([o]) => {
          const s = enProg(o);
          return s.apr < s.tot;
        }) || t[0];
    a && enInicia("lic", a[0]);
  },
  !0,
);
{
  const e = vHome;
  vHome = function () {
    const t = e.apply(this, arguments);
    try {
      return t + enInicioHtml();
    } catch {
      return t;
    }
  };
}
{
  const e = TraderStyles.slot("legacy-060");
  ((e.textContent = TraderStyles.css("legacy-060")), TraderStyles.mount(e));
}
const HLV = { busy: 0, ts: 0 };
function hojeAberto() {
  let e = 0,
    t = 0,
    a = 0;
  const o = [];
  return (
    S.trades
      .filter((s) => isOpen(s))
      .forEach((s) => {
        let n = null;
        try {
          n = lvKey(s) ? lvCalc(s) : null;
        } catch {}
        n && isFinite(n.pl)
          ? ((e += emBRL(n.pl, moedaT(s))), t++, o.push(s.ativo))
          : a++;
      }),
    { pl: e, n: t, sem: a, nomes: o }
  );
}
async function hojeVivoPoll() {
  if (
    !(
      HLV.busy ||
      tab !== "home" ||
      document.hidden ||
      typeof SESS > "u" ||
      !SESS ||
      !window.CLOUD_OK
    ) &&
    S.trades.some((e) => isOpen(e) && lvKey(e))
  ) {
    HLV.busy = 1;
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
        (LV.px = { ...LV.px, ...t }),
        (LV.all = e),
        (LV.ts = Date.now()),
        (HLV.ts = Date.now()));
    } catch {}
    ((HLV.busy = 0), hojeVivoPinta());
  }
}
function hojeVivoPinta() {
  if (tab !== "home") return;
  const e = document.querySelector(".hero2");
  if (!e) return;
  const t = hojeAberto(),
    a = e.querySelector("#h2live");
  if (!a) return;
  if (!t.n) {
    a.innerHTML = t.sem
      ? `<span class="sm mut">${t.sem} posição(ões) aberta(s) sem preço ao vivo: ligue a ponte do Profit.</span>`
      : "";
    return;
  }
  const o = loc().slice(0, 10),
    s = dayPL(dayFech(o)),
    n = s + t.pl,
    r = e.querySelector(".big");
  r &&
    (r.removeAttribute("data-count"),
    (r.textContent = money(n)),
    (r.className = "big " + cls(n)));
  const i = LV.ts ? Math.round((Date.now() - LV.ts) / 1e3) : null;
  a.innerHTML = `<span class="h2dot"></span><span class="sm"><b>ao vivo</b> · encerrado <b class="${cls(s)}">${money(s)}</b> + em aberto <b class="${cls(t.pl)}">${money(t.pl)}</b> <span class="mut">(${esc(t.nomes.slice(0, 3).join(", "))}${i != null ? " · há " + i + "s" : ""})</span></span>`;
}
{
  const e = hero;
  hero = function () {
    return e
      .apply(this, arguments)
      .replace(
        '<div class="h2ks">',
        '<div id="h2live" class="h2live"></div><div class="h2ks">',
      );
  };
}
setInterval(() => {
  tab === "home" && !document.hidden && (hojeVivoPoll(), hojeVivoPinta());
}, 3e3);
{
  const e = render0;
  render0 = function () {
    (e.apply(this, arguments),
      tab === "home" &&
        setTimeout(() => {
          (hojeVivoPinta(), hojeVivoPoll());
        }, 900));
  };
}
const EN_F =
    /samantha|ava|allison|susan|karen|moira|tessa|serena|victoria|zoe|kate|fiona|veena|nicky|joelle|female|zira|aria|jenny|libby|sonia|emma|olivia|natasha|michelle|google us english|google uk english female/i,
  EN_M =
    /daniel|alex|fred|aaron|arthur|evan|nathan|tom|gordon|oliver|rishi|reed|male|david|guy|ryan|thomas|liam|eddy|ralph|google uk english male/i,
  enQual = (e) =>
    /premium|enhanced|melhorad|neural|natural|online/i.test(e.name)
      ? 2
      : /siri|google/i.test(e.name)
        ? 1
        : 0;
function enVozes() {
  let e = [];
  try {
    e = speechSynthesis.getVoices().filter((t) => /^en([-_]|$)/i.test(t.lang));
  } catch {}
  return e
    .map((t) => ({
      v: t,
      nome: t.name,
      lang: t.lang,
      gen: EN_F.test(t.name) ? "f" : EN_M.test(t.name) ? "m" : "",
      q: enQual(t),
    }))
    .sort(
      (t, a) =>
        a.q - t.q ||
        /US/i.test(a.lang) - /US/i.test(t.lang) ||
        t.nome.localeCompare(a.nome),
    );
}
function enVozEscolhe() {
  const e = enS().cfg,
    t = enVozes();
  if (!t.length) return null;
  const a = t.find((s) => s.nome === e.vozNome);
  if (a) return a.v;
  const o = e.gen || "f";
  return (t.filter((s) => s.gen === o)[0] || t[0]).v;
}
function enVozPt() {
  try {
    return (
      speechSynthesis.getVoices().find((e) => /^pt[-_]BR/i.test(e.lang)) ||
      speechSynthesis.getVoices().find((e) => /^pt/i.test(e.lang)) ||
      null
    );
  } catch {
    return null;
  }
}
try {
  speechSynthesis.onvoiceschanged = () => {
    ((EN._vz = 1), tab === "estudos" && ESV === "ing" && !EN.run && render());
  };
} catch {}
enFala = function (e, t = {}) {
  try {
    if (!("speechSynthesis" in window)) return;
    t.fila || speechSynthesis.cancel();
    const a = new SpeechSynthesisUtterance(e),
      o = t.pt;
    ((a.lang = o ? "pt-BR" : "en-US"),
      (a.rate = t.rate || +enS().cfg.vel || 0.9));
    const s = o ? enVozPt() : enVozEscolhe();
    return (
      s && ((a.voice = s), (a.lang = s.lang)),
      t.fim && (a.onend = t.fim),
      speechSynthesis.speak(a),
      a
    );
  } catch {}
};
const OUV = { on: 0, tema: "", i: 0, L: [], passo: 0, t: 0 };
function ouvLista(e) {
  const t = enS().r;
  let a = enTodos().filter((s) => !e || s.t === e);
  const o = enDevidas().filter((s) => !e || s.t === e);
  return (
    (a = [
      ...o,
      ...a
        .filter((s) => !o.includes(s))
        .sort(
          (s, n) => ((t[s.id] || {}).box || 0) - ((t[n.id] || {}).box || 0),
        ),
    ]),
    a
  );
}
function ouvInicia(e) {
  if (!("speechSynthesis" in window)) {
    toast("Este aparelho não tem voz para o app.");
    return;
  }
  ((OUV.on = 1),
    (OUV.tema = e || ""),
    (OUV.L = ouvLista(OUV.tema)),
    (OUV.i = 0),
    (OUV.passo = 0),
    render(),
    ouvToca());
}
function ouvPara() {
  ((OUV.on = 0), clearTimeout(OUV.t));
  try {
    speechSynthesis.cancel();
  } catch {}
  render();
}
function ouvToca() {
  if (!OUV.on) return;
  const e = OUV.L[OUV.i];
  if (!e) {
    (ouvPara(), toast("Fim da lista. 🎧"));
    return;
  }
  const t = enS().cfg,
    a = t.ouvRep !== 0,
    o = t.ouvPt !== 0,
    s = [
      [e.en, { rate: 0.7 }],
      ...(a ? [[e.en, {}]] : []),
      ...(o ? [[e.pt, { pt: 1 }]] : []),
      [e.ex, {}],
      ...(o ? [[e.exPt, { pt: 1 }]] : []),
    ];
  if (OUV.passo >= s.length) {
    ((OUV.passo = 0),
      OUV.i++,
      enXp(1),
      ouvPinta(),
      (OUV.t = setTimeout(ouvToca, 900)));
    return;
  }
  const [n, r] = s[OUV.passo];
  (ouvPinta(),
    enFala(n, {
      ...r,
      fim: () => {
        (OUV.passo++, (OUV.t = setTimeout(ouvToca, r.pt ? 500 : 650)));
      },
    }));
}
function ouvPinta() {
  const e = document.getElementById("ouvbox");
  e && (e.outerHTML = ouvHtml());
}
function ouvHtml() {
  const e = OUV.L[OUV.i];
  return !OUV.on || !e
    ? ""
    : `<div class="card enouv" id="ouvbox"><div class="top"><b class="sm">🎧 Ouvindo · ${OUV.i + 1} de ${OUV.L.length}</b><button class="btn s" data-ouvx="1">⏸ Parar</button></div><div class="enw" style="text-align:center;margin:10px 0 2px">${esc(e.en)}</div><div style="text-align:center"><b>${esc(e.pt)}</b></div><div class="sm" style="text-align:center;margin-top:8px">“${esc(e.ex)}”</div><div class="sm mut" style="text-align:center">${esc(e.exPt)}</div>
<div class="g3" style="margin-top:10px"><button class="btn s" data-ouvn="-1">⏮</button><button class="btn s" data-ouvr="1">🔁 De novo</button><button class="btn s" data-ouvn="1">⏭</button></div></div>`;
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if ((a = t("[data-ouv]"))) {
      ouvInicia(a.dataset.ouv);
      return;
    }
    if (t("[data-ouvx]")) {
      ouvPara();
      return;
    }
    if ((a = t("[data-ouvn]"))) {
      clearTimeout(OUV.t);
      try {
        speechSynthesis.cancel();
      } catch {}
      ((OUV.i = Math.max(0, OUV.i + +a.dataset.ouvn)),
        (OUV.passo = 0),
        ouvToca());
      return;
    }
    if (t("[data-ouvr]")) {
      clearTimeout(OUV.t);
      try {
        speechSynthesis.cancel();
      } catch {}
      ((OUV.passo = 0), ouvToca());
      return;
    }
    if ((a = t("[data-engen]"))) {
      const o = enS().cfg;
      ((o.gen = a.dataset.engen),
        delete o.vozNome,
        save(),
        render(),
        enFala((o.gen, "Hi, I am your English teacher.")));
      return;
    }
    if (t("[data-entestv]")) {
      enFala("The market rallied after the jobs report. Nice to meet you.");
      return;
    }
  },
  !0,
),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-envoz]");
    if (!t) return;
    const a = enS().cfg;
    ((a.vozNome = t.value || void 0),
      save(),
      enFala("Hello! Let us learn some English today."));
  }));
function enVozHtml() {
  const e = enS().cfg,
    t = enVozes(),
    a = enVozEscolhe(),
    o = e.gen || "f",
    s = t.some((i) => i.gen === "f"),
    n = t.some((i) => i.gen === "m"),
    r = t.filter((i) => i.q === 2).length;
  return `<div class="card"><b>🗣️ Voz do professor</b><div class="seg" style="margin:8px 0"><button class="${o === "f" ? "on" : ""}" data-engen="f">👩 Mulher${s ? "" : " (sem no aparelho)"}</button><button class="${o === "m" ? "on" : ""}" data-engen="m">👨 Homem${n ? "" : " (sem no aparelho)"}</button></div>
${
  t.length
    ? `<label class="sm">Voz em inglês<select data-envoz="1"><option value="">Automática (a melhor ${o === "m" ? "masculina" : "feminina"})</option>${t.map((i) => `<option value="${esc(i.nome)}"${e.vozNome === i.nome ? " selected" : ""}>${esc(i.nome)} · ${esc(i.lang)}${i.q === 2 ? " · natural" : ""}${i.gen ? " · " + (i.gen === "f" ? "mulher" : "homem") : ""}</option>`).join("")}</select></label>
<div class="sm mut" style="margin-top:4px">Tocando: <b>${esc(a ? a.name : "padrão")}</b> <button class="btn s" data-entestv="1" style="padding:3px 9px">▶ Testar</button></div>`
    : '<div class="sm mut">As vozes do aparelho ainda não carregaram. Abra de novo em alguns segundos.</div>'
}
${r ? "" : '<div class="sm" style="margin-top:8px;line-height:1.5">Para uma voz bem mais natural (parece gente), baixe uma voz "Premium" no iPhone: <b>Ajustes → Acessibilidade → Conteúdo Falado → Vozes → Inglês</b>. Boas opções: <b>Ava (Premium)</b> ou <b>Zoe (Premium)</b> para mulher e <b>Evan (Melhorada)</b> ou <b>Nathan (Melhorada)</b> para homem. Depois feche e abra o app e escolha aqui. Se não aparecer na lista, o iPhone não liberou essa voz para apps da web: as outras continuam funcionando.</div>'}</div>`;
}
{
  const e = enHome;
  enHome = function () {
    let t = e.apply(this, arguments);
    try {
      const a = `${ouvHtml()}<div class="card enouvc"><div class="top"><b>🎧 Modo Ouvir</b><span class="sm mut">para absorver</span></div><div class="sm mut" style="margin:4px 0 8px">O professor fala a palavra devagar, depois normal, o significado em português e uma frase de exemplo. Bom para o carro ou antes de dormir.</div><button class="btn" data-ouv="" style="width:100%">▶ Ouvir as palavras de hoje</button>
<label class="ck" style="margin-top:8px"><input type="checkbox" data-encfg="ouvPt"${enS().cfg.ouvPt !== 0 ? " checked" : ""}><span>Falar a tradução em português</span></label><label class="ck"><input type="checkbox" data-encfg="ouvRep"${enS().cfg.ouvRep !== 0 ? " checked" : ""}><span>Repetir cada palavra duas vezes</span></label></div>`;
      t = t
        .replace("<h2>Trilha</h2>", a + "<h2>Trilha</h2>")
        .replace(
          /(<button class="entema[^"]*" data-enl="(\w+)">[\s\S]*?<\/button>)/g,
          (o, s, n) =>
            `<div class="entrw">${s}<button class="btn s enouvt" data-ouv="${n}" aria-label="Ouvir este tema">🎧</button></div>`,
        )
        .replace("<h2>Ajustes</h2>", "<h2>Ajustes</h2>" + enVozHtml());
    } catch {}
    return t;
  };
}
document.addEventListener(
  "change",
  (e) => {
    const t = e.target.closest('[data-encfg="ouvPt"],[data-encfg="ouvRep"]');
    t &&
      (e.stopImmediatePropagation(),
      (enS().cfg[t.dataset.encfg] = t.checked ? 1 : 0),
      save());
  },
  !0,
);
{
  const e = render0;
  render0 = function () {
    if (OUV.on && !(tab === "estudos" && ESV === "ing")) {
      OUV.on = 0;
      try {
        speechSynthesis.cancel();
      } catch {}
    }
    return e.apply(this, arguments);
  };
}
{
  const e = TraderStyles.slot("legacy-061");
  ((e.textContent = TraderStyles.css("legacy-061")), TraderStyles.mount(e));
}
enFala = function (e, t = {}) {
  try {
    if (!("speechSynthesis" in window)) {
      t.fim && setTimeout(t.fim, 400);
      return;
    }
    const a = speechSynthesis;
    !t.fila && (a.speaking || a.pending) && a.cancel();
    const o = new SpeechSynthesisUtterance(e),
      s = t.pt;
    ((o.lang = s ? "pt-BR" : "en-US"),
      (o.rate = t.rate || +enS().cfg.vel || 0.9),
      (o.volume = 1));
    const n = s ? enVozPt() : enVozEscolhe();
    n && ((o.voice = n), (o.lang = n.lang));
    let r = 0;
    const i = () => {
      r || ((r = 1), clearTimeout(o._wd), t.fim && t.fim());
    };
    return (
      (o.onend = i),
      (o.onerror = i),
      (o._wd = setTimeout(
        i,
        Math.max(1800, (String(e).length * 95) / (o.rate || 1) + 1500),
      )),
      a.speak(o),
      a.paused && a.resume(),
      o
    );
  } catch {
    t.fim && setTimeout(t.fim, 400);
  }
};
function enSomAviso() {
  return '<div class="card sm" id="ensom"><b>🔈 Não está ouvindo?</b><div style="margin:4px 0 6px;line-height:1.5">No iPhone, a voz do app fica muda quando o <b>modo silencioso</b> está ligado (o sininho cortado no topo da tela). Desligue na chave lateral ou na Central de Controle e aumente o volume. Fone Bluetooth também funciona.</div><button class="btn s" data-entestv="1">▶ Testar o som</button></div>';
}
{
  const e = enHome;
  enHome = function () {
    const t = e.apply(this, arguments);
    try {
      return t.replace(
        '<div class="card enouvc">',
        enSomAviso() + '<div class="card enouvc">',
      );
    } catch {
      return t;
    }
  };
}
((ouvHtml = ((e) =>
  function () {
    return e
      .apply(this, arguments)
      .replace(
        'data-ouvn="-1">⏮</button>',
        'data-ouvn="-1">‹ Anterior</button>',
      )
      .replace('data-ouvn="1">⏭</button>', 'data-ouvn="1">Próxima ›</button>')
      .replace(">⏸ Parar<", ">Parar<");
  })(ouvHtml)),
  (FN_ESPERADA.analise = "v199"),
  (FN_ESPERADA.notificar = "v199"));
const SEG_SEL = "#app .seg,#app .hub,#app .chips2,#app .cqtabs",
  segSig = (e) =>
    (e.className || "") +
    "|" +
    [...e.children]
      .slice(0, 14)
      .map((t) => (t.textContent || "").trim().slice(0, 14))
      .join(",");
function segGuarda() {
  const e = new Map();
  return (
    document.querySelectorAll(SEG_SEL).forEach((t) => {
      t.scrollWidth > t.clientWidth + 4 && e.set(segSig(t), t.scrollLeft);
    }),
    e
  );
}
function segRestaura(e) {
  document.querySelectorAll(SEG_SEL).forEach((t) => {
    if (t.scrollWidth <= t.clientWidth + 4) return;
    const a = segSig(t);
    e && e.has(a) && (t.scrollLeft = e.get(a));
    const o = t.querySelector(":scope>.on");
    if (!o) return;
    const s = t.getBoundingClientRect(),
      n = o.getBoundingClientRect();
    n.left < s.left + 6
      ? (t.scrollLeft -= s.left + 6 - n.left + 28)
      : n.right > s.right - 6 && (t.scrollLeft += n.right - (s.right - 6) + 28);
  });
}
{
  const e = render0;
  render0 = function () {
    const t = segGuarda(),
      a = e.apply(this, arguments);
    try {
      (segRestaura(t), requestAnimationFrame(() => segRestaura(t)));
    } catch {}
    return a;
  };
}
{
  const e = cqPinta;
  cqPinta = function () {
    const t = segGuarda();
    e.apply(this, arguments);
    try {
      segRestaura(t);
    } catch {}
  };
}
try {
  HUB_AV.some((a) => a[0] === "mercado:cq") ||
    HUB_AV.splice(1, 0, ["mercado:cq", "Cotações"]);
  const e = MGRP.find((a) => a[0] === "Hoje");
  e && (e[1] = e[1].filter((a) => a !== "mercado:cq"));
  const t = HUB_M.findIndex((a) => a[0] === "mercado:cq");
  t >= 0 && HUB_M.splice(t, 1);
} catch {}
const enPrTxt = (e) => {
    const t = window.EN_DATA && window.EN_DATA.pr;
    return (t && t[String(e.en).toLowerCase()]) || "";
  },
  enPr = (e) => {
    const t = enPrTxt(e);
    return t ? `<div class="enpr">🗣️ <i>${esc(t)}</i></div>` : "";
  };
function enTap(e) {
  return String(e || "")
    .split(/([A-Za-z][A-Za-z'\u2019-]*[A-Za-z]|[A-Za-z])/)
    .map((t, a) =>
      a % 2
        ? `<span class="entap" data-entap="${esc(t)}">${esc(t)}</span>`
        : esc(t),
    )
    .join("");
}
const enUnesc = (e) => {
  const t = document.createElement("textarea");
  return ((t.innerHTML = e), t.value);
};
function enSignif(e) {
  const t = window.EN_DATA;
  if (!t) return "";
  const a = e.toLowerCase().replace(/[\u2019']/g, "'"),
    o = t.dic || {},
    s = enTodos().find((n) => n.en.toLowerCase() === a);
  if (s) return s.pt;
  if (o[a]) return o[a];
  for (const n of [
    a.replace(/'s$/, ""),
    a.replace(/ies$/, "y"),
    a.replace(/es$/, ""),
    a.replace(/s$/, ""),
    a.replace(/ed$/, ""),
    a.replace(/ed$/, "e"),
    a.replace(/ing$/, ""),
    a.replace(/ing$/, "e"),
  ])
    if (n && n !== a) {
      const r = enTodos().find((i) => i.en.toLowerCase() === n);
      if (r) return r.pt;
      if (o[n]) return o[n];
    }
  return "";
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-entap]"),
      a = document.getElementById("enpop");
    if (!t) {
      a && !e.target.closest("#enpop") && a.remove();
      return;
    }
    (e.stopPropagation(), e.preventDefault(), EN.ok || enCarrega());
    const o = t.dataset.entap,
      s = enSignif(o),
      n = t.getBoundingClientRect();
    a?.remove();
    const r = document.createElement("div");
    ((r.id = "enpop"),
      (r.innerHTML = `<b>${esc(o)}</b> <button class="enspk" data-enfala="${esc(o)}">🔊</button><div class="sm">${s ? esc(s) : '<span class="mut">sem tradução no dicionário · toque no 🔊 para ouvir</span>'}</div>`),
      document.body.appendChild(r));
    const i = Math.max(
        8,
        Math.min(
          innerWidth - r.offsetWidth - 8,
          n.left + n.width / 2 - r.offsetWidth / 2,
        ),
      ),
      l = n.top - r.offsetHeight - 8;
    ((r.style.left = i + "px"),
      (r.style.top = (l < 60 ? n.bottom + 8 : l) + "px"),
      enFala(o));
  },
  !0,
);
const EN_U = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ],
  EN_D = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
function numEn(e) {
  if (((e = Math.round(Math.abs(e))), !e)) return "zero";
  const t = (o) => {
      const s = [];
      return (
        o >= 100 &&
          (s.push(EN_U[Math.floor(o / 100)] + " hundred"), (o %= 100)),
        o >= 20
          ? s.push(
              EN_D[Math.floor(o / 10)] + (o % 10 ? "-" + EN_U[o % 10] : ""),
            )
          : o > 0 && s.push(EN_U[o]),
        s.join(" ")
      );
    },
    a = [];
  return (
    [
      [1e9, "billion"],
      [1e6, "million"],
      [1e3, "thousand"],
    ].forEach(([o, s]) => {
      e >= o && (a.push(t(Math.floor(e / o)) + " " + s), (e %= o));
    }),
    e > 0 && a.push(t(e)),
    a.join(" ")
  );
}
function decEn(e, t) {
  const [a, o] = Math.abs(e).toFixed(t).split(".");
  return (
    numEn(+a) +
    (o
      ? " point " +
        o
          .split("")
          .map((s) => EN_U[+s])
          .join(" ")
      : "")
  );
}
const fmtBR = (e, t) =>
  Number(e).toLocaleString("pt-BR", {
    minimumFractionDigits: t,
    maximumFractionDigits: t,
  });
function numGera() {
  const e = (i, l) => i + Math.floor(Math.random() * (l - i + 1)),
    t = [
      () => {
        const i = e(1150, 1420) * 100 + e(0, 19) * 5;
        return {
          v: i,
          dp: 0,
          fala: `The mini index is at ${numEn(i)} points.`,
          pt: "O mini índice está em … pontos.",
        };
      },
      () => {
        const i = e(480, 620) / 100;
        return {
          v: i,
          dp: 2,
          fala: `The dollar is at ${decEn(i, 2)} reais.`,
          pt: "O dólar está em … reais.",
        };
      },
      () => {
        const i = e(1, 45) / 10,
          l = Math.random() < 0.5;
        return {
          v: l ? i : -i,
          dp: 1,
          suf: "%",
          fala: `Stocks are ${l ? "up" : "down"} ${decEn(i, 1)} percent.`,
          pt: `As ações ${l ? "sobem" : "caem"} …%.`,
        };
      },
      () => {
        const i = e(40, 120) * 1e3 + e(0, 999);
        return {
          v: i,
          dp: 0,
          fala: `Bitcoin is trading at ${numEn(i)} dollars.`,
          pt: "O bitcoin está em … dólares.",
        };
      },
      () => {
        const i = e(1, 99) * 10;
        return {
          v: i,
          dp: 0,
          fala: `I made ${numEn(i)} reais today.`,
          pt: "Eu ganhei … reais hoje.",
        };
      },
      () => {
        const i = e(1, 30);
        return {
          v: i,
          dp: 0,
          fala: `I lost ${numEn(i)} points on this trade.`,
          pt: "Perdi … pontos neste trade.",
        };
      },
      () => {
        const i = e(1500, 4500) / 100;
        return {
          v: i,
          dp: 2,
          fala: `Petrobras is at ${decEn(i, 2)}.`,
          pt: "A Petrobras está em …",
        };
      },
      () => {
        const i = (e(1, 15) * 25) / 100;
        return {
          v: i,
          dp: 2,
          suf: "%",
          fala: `The rate is ${decEn(i, 2)} percent.`,
          pt: "A taxa está em …%.",
        };
      },
    ],
    a = t[e(0, t.length - 1)](),
    o = Math.abs(a.v),
    s = [
      o * 10,
      o / 10,
      o +
        (a.dp
          ? Math.pow(10, -a.dp) * e(1, 9)
          : e(1, 9) * (o > 1e3 ? 100 : o > 100 ? 10 : 1)),
      +String(Math.round(o * Math.pow(10, a.dp)))
        .split("")
        .reverse()
        .join("") / Math.pow(10, a.dp),
    ].filter((i) => i > 0 && Math.abs(i - o) > 1e-9),
    n = [...new Set([o, ...enEmb(s)].map((i) => +i.toFixed(a.dp)))].slice(0, 4);
  for (; n.length < 4; )
    n.push(+(o + n.length * (a.dp ? 0.07 : 7)).toFixed(a.dp));
  const r = (i) =>
    ((a.v < 0 && i === o) || a.v < 0 ? "-" : "") +
    fmtBR(i, a.dp) +
    (a.suf || "");
  return { ...a, ans: r(o), ops: enEmb(n.map(r)) };
}
function numLicao() {
  return {
    modo: "num",
    tema: "",
    Q: Array.from({ length: 10 }, (e, t) => {
      const a = numGera();
      return t % 2 && "speechSynthesis" in window
        ? { tp: "nouvir", ...a }
        : {
            tp: "nler",
            ...a,
            opsEn: enEmb([
              a.fala,
              ...[0, 1, 2].map(() => numGera()).map((o) => o.fala),
            ]),
          };
    }),
    i: 0,
    res: [],
    xp: 0,
    sel: [],
    resp: null,
    fim: 0,
    ini: Date.now(),
  };
}
function cardsLicao(e) {
  const t = enS().r,
    a = enTodos().filter((r) => !e || r.t === e),
    o = enDevidas().filter((r) => !e || r.t === e),
    s = a
      .filter((r) => !o.includes(r))
      .sort(
        (r, i) => ((t[r.id] || {}).box ?? -1) - ((t[i.id] || {}).box ?? -1),
      ),
    n = [...enEmb(o), ...s].slice(0, 20);
  return n.length
    ? {
        modo: "cards",
        tema: e,
        C: n,
        i: 0,
        vira: 0,
        ok: 0,
        no: 0,
        xp: 0,
        ini: Date.now(),
      }
    : null;
}
{
  const e = enInicia;
  enInicia = function (t, a) {
    if (t === "num") {
      if (!EN.ok) {
        enCarrega();
        return;
      }
      ((EN.run = numLicao()),
        (ESV = "ing"),
        irPara("estudos"),
        scrollTo(0, 0),
        numAuto());
      return;
    }
    if (t === "cards") {
      if (!EN.ok) {
        enCarrega();
        return;
      }
      const n = cardsLicao(a);
      if (!n) {
        toast("Nada para revisar aqui.");
        return;
      }
      ((EN.run = n),
        (ESV = "ing"),
        irPara("estudos"),
        scrollTo(0, 0),
        setTimeout(() => enFala(n.C[0].en), 250));
      return;
    }
    if (t === "chat") {
      if (!EN.ok) {
        enCarrega();
        return;
      }
      ((EN.chat = { cena: a || "", hist: [], busy: 0, err: "" }),
        (EN.run = null),
        (ESV = "ing"),
        irPara("estudos"),
        scrollTo(0, 0),
        chatEnvia(""));
      return;
    }
    const o = window.EN_DATA,
      s = enS();
    if (
      t === "lic" &&
      a &&
      o &&
      o.dica &&
      o.dica[a] &&
      !(s.dicaVista || {})[a]
    ) {
      ((EN.dica = a),
        (ESV = "ing"),
        irPara("estudos"),
        scrollTo(0, 0));
      return;
    }
    return e.apply(this, arguments);
  };
}
function numAuto() {
  const e = EN.run;
  if (e && e.modo === "num" && !e.fim) {
    const t = e.Q[e.i];
    t.tp === "nouvir" && setTimeout(() => enFala(t.fala), 250);
  }
}
{
  const e = enProxima;
  enProxima = function () {
    const t = EN.run;
    if (t && t.modo === "num") {
      if (((t.resp = null), t.i++, t.i >= t.Q.length)) {
        t.fim = 1;
        const o = 5 + (t.res.every((s) => s.ok) ? 10 : 0);
        ((t.xp += o), enXp(o), enMin(t));
      }
      (save(), render(), scrollTo(0, 0), numAuto());
      return;
    }
    const a = t && t.fim;
    (e.apply(this, arguments), t && t.fim && !a && enMin(t));
  };
}
function enMin(e) {
  const t = enS(),
    a = enHoje();
  (t.min ?? (t.min = {}),
    (t.min[a] =
      (t.min[a] || 0) + Math.max(1, Math.round((Date.now() - e.ini) / 6e4))),
    save());
}
function numHtml() {
  const e = EN.run,
    t = e.Q[e.i],
    a = e.resp,
    o = e.i / e.Q.length,
    s =
      t.tp === "nouvir"
        ? `<button class="enbig" data-enfala="${esc(t.fala)}">🔊</button><div class="sm mut" style="text-align:center">${esc(t.pt)} Qual número você ouviu?</div><div class="enops">${t.ops.map((r) => `<button class="enop${a ? (r === t.ans ? " certo" : r === a.val ? " errado" : "") : ""}" data-ennum="${esc(r)}"${a ? " disabled" : ""}>${esc(r)}</button>`).join("")}</div>`
        : `<div class="enq">${esc(t.ans)}</div><div class="sm mut" style="text-align:center">${esc(t.pt)} Qual frase em inglês diz esse número?</div><div class="enops">${t.opsEn.map((r) => `<button class="enop${a ? (r === t.fala ? " certo" : r === a.val ? " errado" : "") : ""}" data-ennum="${esc(r)}"${a ? " disabled" : ""}>${esc(r)}</button>`).join("")}</div>`,
    n = a
      ? `<div class="enfb ${a.ok ? "ok" : "no"}"><b>${a.ok ? "Isso aí!" : "A resposta era:"}</b><div class="sm" style="margin-top:4px">${enTap(t.fala)} ${enSom(t.fala)}</div><div class="sm mut">= ${esc(t.ans)}</div><button class="btn" data-enn="1" style="width:100%;margin-top:10px">Continuar</button></div>`
      : "";
  return `<div class="entop"><button class="btn s" data-enx="1">✕</button><div class="enbar big"><i style="width:${Math.round(o * 100)}%"></i></div><b class="g">${e.xp} XP</b></div><div class="card enl"><div class="sm mut">🔢 Números e preços</div>${s}</div>${n}`;
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-ennum]");
    if (!t) return;
    e.stopImmediatePropagation();
    const a = EN.run;
    if (!a || a.resp) return;
    const o = a.Q[a.i],
      s = t.dataset.ennum,
      n = o.tp === "nouvir" ? s === o.ans : s === o.fala;
    ((a.resp = { ok: n, val: s }),
      a.res.push({ ok: n }),
      n && ((a.xp += 10), enXp(10)),
      save(),
      render());
  },
  !0,
);
function cardsHtml() {
  const e = EN.run,
    t = e.C[e.i];
  return !t || e.i >= e.C.length
    ? `<div class="card enfim"><div style="font-size:40px">🃏</div><b style="font-size:20px">Cartões revisados!</b><div class="enst" style="justify-content:center;margin:10px 0"><span>✅ <b>${e.ok}</b> sei</span><span>🔁 <b>${e.no}</b> para rever</span><span>⚡ <b>+${e.xp}</b> XP</span></div><button class="btn" data-encards="${esc(e.tema || "")}" style="width:100%">Mais cartões</button><button class="btn s" data-enx="1" style="width:100%;margin-top:8px">Voltar</button></div>`
    : `<div class="entop"><button class="btn s" data-enx="1">✕</button><div class="enbar big"><i style="width:${Math.round((e.i / e.C.length) * 100)}%"></i></div><b class="sm">${e.i + 1}/${e.C.length}</b></div>
<div class="encard${e.vira ? " vira" : ""}" id="encard" data-envira="1"><div class="enface">${e.vira ? `<div class="enw">${esc(t.pt)}</div><div class="sm" style="margin-top:8px">${esc(t.en)} ${enSom(t.en)}</div><div class="sm" style="margin-top:10px">“${enTap(t.ex)}” ${enSom(t.ex)}</div><div class="sm mut">${esc(t.exPt)}</div>` : `<div class="enw">${esc(t.en)}</div>${enPr(t)}<div class="sm mut" style="margin-top:12px">toque para virar · arraste: ← não sei · sei →</div>`}</div></div>
<div class="g2" style="margin-top:12px"><button class="btn s" data-encd="0">← Não sei</button><button class="btn" data-encd="1">Sei →</button></div>`;
}
function cardsResp(e) {
  const t = EN.run;
  if (!t || t.modo !== "cards") return;
  const a = t.C[t.i];
  (enRegistra(a, e),
    e ? (t.ok++, (t.xp += 3), enXp(3)) : t.no++,
    t.i++,
    (t.vira = 0),
    t.i >= t.C.length && enMin(t),
    save(),
    render());
  const o = t.C[t.i];
  o && setTimeout(() => enFala(o.en), 200);
}
document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if ((a = t("[data-encd]"))) {
      cardsResp(a.dataset.encd === "1");
      return;
    }
    if (t("[data-envira]") && !t("[data-enfala],[data-entap]")) {
      const o = EN.run;
      o && o.modo === "cards" && ((o.vira = o.vira ? 0 : 1), render());
      return;
    }
    if ((a = t("[data-encards]"))) {
      enInicia("cards", a.dataset.encards);
      return;
    }
    if (t("[data-ennumgo]")) {
      enInicia("num");
      return;
    }
    if ((a = t("[data-endica]"))) {
      const o = enS();
      (((o.dicaVista ?? (o.dicaVista = {}))[a.dataset.endica] = 1), save());
      const s = a.dataset.endica;
      ((EN.dica = null), enInicia("lic", s));
      return;
    }
    if (t("[data-endicax]")) {
      ((EN.dica = null), render());
      return;
    }
    if ((a = t("[data-endicav]"))) {
      ((EN.dica = a.dataset.endicav), render(), scrollTo(0, 0));
      return;
    }
  },
  !0,
);
{
  let e = null;
  (document.addEventListener(
    "touchstart",
    (t) => {
      e = t.target.closest("#encard") ? t.touches[0].clientX : null;
    },
    { passive: !0 },
  ),
    document.addEventListener(
      "touchend",
      (t) => {
        if (e == null) return;
        const a = t.changedTouches[0].clientX - e;
        ((e = null), Math.abs(a) > 70 && cardsResp(a > 0));
      },
      { passive: !0 },
    ));
}
function dicaHtml(e) {
  const t = window.EN_DATA,
    a = enTemas().find((s) => s[0] === e) || [e, e, "💡"],
    o = enTodos()
      .filter((s) => s.t === e)
      .slice(0, 6);
  return `<div class="card endica"><div style="font-size:36px">${a[2]}</div><b style="font-size:20px">${esc(a[1])}</b><p style="line-height:1.55;margin:10px 0">${esc(t.dica[e])}</p><div class="sm" style="margin-bottom:10px">${o.map((s) => `<div class="endl"><b>${esc(s.en)}</b> ${enSom(s.en)} <span class="mut">= ${esc(s.pt)}</span>${enPrTxt(s) ? `<div class="sm"><i>🗣️ ${esc(enPrTxt(s))}</i></div>` : ""}</div>`).join("")}</div><button class="btn" data-endica="${esc(e)}" style="width:100%">Entendi, vamos praticar</button><button class="btn s" data-endicax="1" style="width:100%;margin-top:8px">Voltar</button></div>`;
}
const EN_CENAS = [
  ["Apresentar-se", "Introduce yourself: name, job, city, what you study"],
  [
    "Suporte da mesa",
    "You call the support of a prop trading firm because your account has a problem",
  ],
  [
    "Explicar seu trade",
    "Explain to a friend a trade you made today: entry, stop and result",
  ],
  [
    "No trabalho",
    "At the steel plant: talk with a foreign engineer about a machine breakdown",
  ],
  [
    "Notícia do mercado",
    "Talk about today's market news in very simple English",
  ],
  ["Conversa livre", "Free conversation about the student's day"],
];
async function chatEnvia(e) {
  const t = EN.chat;
  if (!(!t || t.busy)) {
    ((e = String(e || "").trim()),
      e && t.hist.push({ q: "a", t: e }),
      (t.busy = 1),
      (t.err = ""),
      render(),
      chatRola());
    try {
      const a = await anxCall({
        modo: "ingles",
        cena: t.cena,
        texto: e,
        hist: t.hist.slice(-10).map((o) => ({ q: o.q, t: o.t })),
      });
      if (a.erro) throw new Error(a.erro);
      (t.hist.push({
        q: "p",
        t: a.resposta,
        tr: a.traducao,
        cor: a.correcao,
        ex: a.explicacao,
        sug: a.sugestao,
      }),
        e && (enXp(5), save()),
        setTimeout(() => enFala(a.resposta), 150));
    } catch (a) {
      t.err = /fun\xe7\xe3o|404|analise|modo/i.test(String(a.message || a))
        ? 'Para conversar, publique a função "analise" nova (v199) no Supabase.'
        : String(a.message || a);
    }
    ((t.busy = 0), render(), chatRola());
  }
}
function chatRola() {
  setTimeout(() => {
    const e = document.getElementById("enchatfim");
    e && e.scrollIntoView({ block: "end", behavior: "smooth" });
  }, 60);
}
function chatHtml() {
  const e = EN.chat,
    t = (EN_CENAS.find((o) => o[1] === e.cena) || ["Conversa"])[0],
    a = [...e.hist].reverse().find((o) => o.q === "p" && o.sug);
  return `<div class="entop"><button class="btn s" data-enchx="1">✕</button><b style="flex:1">💬 ${esc(t)}</b></div><div class="enchat">${e.hist.map((o, s) => (o.q === "a" ? `<div class="enmsg a">${esc(o.t)}</div>` : `<div class="enmsg p"><div>${enTap(o.t)} ${enSom(o.t)}</div>${o.tr ? `<details class="sm"><summary class="mut">ver tradução</summary>${esc(o.tr)}</details>` : ""}${o.cor ? `<div class="encor"><b>✏️ Melhor dizer:</b> ${esc(o.cor)} ${enSom(o.cor)}${o.ex ? `<div class="sm mut">${esc(o.ex)}</div>` : ""}</div>` : ""}</div>`)).join("")}${e.busy ? '<div class="enmsg p mut">digitando…</div>' : ""}<div id="enchatfim"></div></div>
${e.err ? `<div class="warn sm">${esc(e.err)}</div>` : ""}${a ? `<button class="ensug" data-ensug="${esc(a.sug)}">💡 ${esc(a.sug)}</button>` : ""}
<div class="eninp"><input id="enchtx" placeholder="Escreva em inglês (ou em português, que eu ajudo)" autocomplete="off">${enRec() ? '<button class="btn s" data-enchmic="1" aria-label="Falar">🎤</button>' : ""}<button class="btn" data-enchok="1">Enviar</button></div>
<div class="sm mut" style="margin-top:6px">A IA responde em inglês simples, fala em voz alta e corrige você em português. Toque numa palavra para ver o significado.</div>`;
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if ((a = t("[data-enchat]"))) {
      enInicia("chat", a.dataset.enchat);
      return;
    }
    if (t("[data-enchx]")) {
      ((EN.chat = null), render());
      return;
    }
    if (t("[data-enchok]")) {
      const o = document.getElementById("enchtx");
      if (o && o.value.trim()) {
        const s = o.value;
        ((o.value = ""), chatEnvia(s));
      }
      return;
    }
    if ((a = t("[data-ensug]"))) {
      const o = document.getElementById("enchtx");
      o && ((o.value = a.dataset.ensug), o.focus());
      return;
    }
    if (t("[data-enchmic]")) {
      const o = enRec();
      if (!o) return;
      const s = new o();
      ((s.lang = "en-US"),
        (s.interimResults = !1),
        (s.onresult = (n) => {
          const r = n.results[0][0].transcript;
          chatEnvia(r);
        }),
        (s.onerror = () => toast("Não consegui ouvir.")));
      try {
        (s.start(), toast("Pode falar…", 2500));
      } catch {}
      return;
    }
  },
  !0,
),
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "enchtx") {
      e.preventDefault();
      const t = e.target.value;
      ((e.target.value = ""), t.trim() && chatEnvia(t));
    }
  }));
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e.apply(this, arguments);
    try {
      const a = enS();
      t.en = {
        on: a.cfg.lemb ? 1 : 0,
        h: a.cfg.lembH || "20:30",
        feito: (a.xp[enHoje()] || 0) >= 10 ? enHoje() : "",
        seq: enSeq(),
      };
    } catch {}
    return t;
  };
}
{
  const e = enXp;
  enXp = function () {
    const t = (enS().xp[enHoje()] || 0) >= 10;
    if ((e.apply(this, arguments), !t && (enS().xp[enHoje()] || 0) >= 10))
      try {
        turnoPushSync(!0);
      } catch {}
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-enlemb]");
  if (!t) return;
  const a = enS().cfg;
  (t.dataset.enlemb === "on"
    ? (a.lemb = t.checked ? 1 : 0)
    : (a.lembH = t.value),
    save());
  try {
    turnoPushSync(!0);
  } catch {}
  toast(
    a.lemb
      ? `Lembrete de inglês às ${a.lembH || "20:30"} (em dia de turno, muda o horário sozinho).`
      : "Lembrete de inglês desligado.",
    4e3,
  );
});
{
  const e = enView;
  enView = function () {
    if (EN.ok) {
      if (EN.chat) return `<h1>Inglês</h1>${chatHtml()}`;
      if (EN.dica) return `<h1>Inglês</h1>${dicaHtml(EN.dica)}`;
      const t = EN.run;
      if (t && t.modo === "num")
        return `<h1>Inglês</h1>${t.fim ? enFimNum() : numHtml()}`;
      if (t && t.modo === "cards") return `<h1>Inglês</h1>${cardsHtml()}`;
    }
    return e.apply(this, arguments);
  };
}
function enFimNum() {
  const e = EN.run;
  return `<div class="card enfim"><div style="font-size:40px">🔢</div><b style="font-size:20px">Números treinados!</b><div class="enst" style="justify-content:center;margin:10px 0"><span>🎯 <b>${e.res.filter((t) => t.ok).length}/${e.res.length}</b></span><span>⚡ <b>+${e.xp}</b> XP</span></div><button class="btn" data-ennumgo="1" style="width:100%">Mais números</button><button class="btn s" data-enx="1" style="width:100%;margin-top:8px">Voltar</button></div>`;
}
{
  const e = enHome;
  enHome = function () {
    let t = e.apply(this, arguments);
    try {
      const a = enS().cfg,
        o = `<div class="engrid"><button class="enatal" data-encards=""><span>🃏</span><b>Cartões</b><small>2 min, arrastando</small></button><button class="enatal" data-ennumgo="1"><span>🔢</span><b>Números e preços</b><small>pontos, dólar, %</small></button></div>
<div class="card"><div class="top"><b>💬 Conversar com o professor</b><span class="sm mut">IA</span></div><div class="sm mut" style="margin:4px 0 8px">Escolha uma situação. Ele fala em inglês simples, você responde escrevendo ou falando, e ele corrige em português.</div><div class="enchips">${EN_CENAS.map(([s, n]) => `<button class="btn s" data-enchat="${esc(n)}">${esc(s)}</button>`).join("")}</div></div>`;
      ((t = t.replace(
        '<div class="card endia">',
        o + '<div class="card endia">',
      )),
        (t = t.replace(
          /(<div class="card endia">[\s\S]*?<div class="enw">[^<]*<\/div>)/,
          (s) => {
            const n = enDoDia();
            return n ? s + enPr(n) : s;
          },
        )),
        (t = t.replace(
          /\u201c([^\u201d<]*)\u201d/g,
          (s, n) => "“" + enTap(enUnesc(n)) + "”",
        )),
        (t = t.replace(
          /(<div class="entrw">)(<button class="entema[^"]*" data-enl="(som|ser|verb|perg)">[\s\S]*?<\/button>)/g,
          (s, n, r, i) =>
            `${n}${r}<button class="btn s enouvt" data-endicav="${i}" aria-label="Dica do tema">💡</button>`,
        )),
        (t = t.replace(
          "<h2>Ajustes</h2>",
          `<h2>Ajustes</h2><div class="card"><b>⏰ Lembrete diário</b><label class="ck" style="margin-top:6px"><input type="checkbox" data-enlemb="on"${a.lemb ? " checked" : ""}><span>Me avisar se eu ainda não estudei no dia</span></label><label class="sm">Horário<input type="time" data-enlemb="h" value="${esc(a.lembH || "20:30")}"></label><div class="sm mut" style="margin-top:4px">Em dia de turno das 8h às 17h o aviso vai para 18h30; no turno das 16h, para 14h30. Não avisa se você já fez 10 XP no dia.</div></div>`,
        )));
    } catch {}
    return t;
  };
}
{
  const e = enLicaoHtml;
  enLicaoHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = EN.run.Q[EN.run.i];
      ((a.tp === "mc_en" || a.tp === "falar") &&
        (t = t.replace(
          /(<div class="enq">[\s\S]*?<\/div>)/,
          (o) => o + enPr(a.it),
        )),
        EN.run.resp &&
          (t = t
            .replace(
              /(<div class="sm" style="margin-top:6px"><b>[^<]*<\/b> = [^<]*<\/div>)/,
              (o) => o + enPr(a.it),
            )
            .replace(
              /\u201c([^\u201d<]*)\u201d/g,
              (o, s) => "“" + enTap(enUnesc(s)) + "”",
            )));
    } catch {}
    return t;
  };
}
{
  const e = ouvHtml;
  ouvHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = OUV.L[OUV.i];
      a &&
        (t = t
          .replace(
            /(<div class="enw"[^>]*>[^<]*<\/div>)/,
            (o) =>
              o +
              enPr(a).replace(
                'class="enpr"',
                'class="enpr" style="text-align:center"',
              ),
          )
          .replace(
            /\u201c([^\u201d<]*)\u201d/g,
            (o, s) => "“" + enTap(enUnesc(s)) + "”",
          ));
    } catch {}
    return t;
  };
}
{
  const e = agHtml;
  agHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = AG.v[AG.sem];
      if (!a || !t) return t;
      const { out: o } = agFiltra(a.eventos || []),
        s = {};
      o.forEach((l) => {
        (s[agDia(l.em)] = s[agDia(l.em)] || []).push(l);
      });
      const n = Object.keys(s)
          .sort()
          .flatMap((l) => s[l]),
        r = document.createElement("div");
      r.innerHTML = t;
      const i = r.querySelectorAll(".ag-ev");
      return i.length !== n.length
        ? t
        : (i.forEach((l, d) => {
            const c = n[d];
            if (!c.orig || c.orig === c.t) return;
            const p = l.querySelector(".ag-tx");
            p &&
              p.insertAdjacentHTML(
                "beforeend",
                `<div class="sm agen">🇺🇸 ${enTap(c.orig)}</div>`,
              );
          }),
          r.innerHTML);
    } catch {
      return t;
    }
  };
}
const FOCO = (() => {
    try {
      return (
        JSON.parse(APP_STORAGE.getItem("diario-foco") || "null") || { on: 0 }
      );
    } catch {
      return { on: 0 };
    }
  })(),
  FOCO_MAT = [
    ["ing", "Inglês"],
    ["cnpi", "CNPI-T"],
    ["fac", "Faculdade"],
    ["liv", "Livros"],
    ["trade", "Revisar trades"],
    ["out", "Outro"],
  ],
  focoSalva = () => {
    try {
      APP_STORAGE.setItem("diario-foco", JSON.stringify(FOCO));
    } catch {}
  },
  focoLog = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).foco ?? (e.foco = []);
  };
function focoInicia(e, t, a) {
  ((FOCO.on = 1),
    (FOCO.fase = a || "foco"),
    (FOCO.min = e),
    (FOCO.mat = t || FOCO.mat || "ing"),
    (FOCO.fim = Date.now() + e * 6e4),
    (FOCO.ini = Date.now()),
    focoSalva(),
    render());
}
function estMeta() {
  return EstudosModelo.meta((S.ax || {}).focoMeta);
}
function estDefinirMeta(value) {
  const min = EstudosModelo.minutos(value);
  if (min === null) {
    toast("Informe uma meta inteira entre 30 e 6000 minutos.");
    return false;
  }
  (S.ax ?? (S.ax = {})).focoMeta = min;
  save();
  render();
  return true;
}
function estSessoesDisponiveis(date, mat) {
  const subject = estMat(mat);
  return subject
    ? EstudosModelo.sessoes(focoLog(), date, subject.foco || "out")
    : [];
}
function estAtualizaSessoes() {
  const select = document.getElementById("esttempo");
  if (!select) return;
  const date = document.getElementById("estd")?.value || enHoje();
  const mat = document.getElementById("estmat")?.value;
  const previous = select.value;
  select.innerHTML =
    '<option value="manual">Nova sessão: adicionar minutos</option>' +
    estSessoesDisponiveis(date, mat)
      .map(
        ({ entry, index }) =>
          `<option value="${index}">Já contado: ${entry.min} min · ${esc(estNome(entry))}</option>`,
      )
      .join("");
  if ([...select.options].some((option) => option.value === previous))
    select.value = previous;
}
function estProximasAcoes() {
  const actions = [],
    revisions = estRevHoje(),
    cycle = estCicloCalc().prox,
    weak = estMapa().dif[0];
  if (revisions.length)
    actions.push({
      view: "est",
      label: `Revisar ${revisions.length} tópico(s)`,
      motivo: "Revisões previstas para hoje ou pendentes.",
    });
  if (cycle)
    actions.push({
      view: "foco",
      mat: estMat(cycle.k)?.foco || "out",
      label: `Estudar ${cycle.n}`,
      motivo: `Faltam ${estHm(cycle.falta)} na distribuição do seu ciclo.`,
    });
  if (weak)
    actions.push({
      view: "sim",
      label: "Abrir treino por tema",
      motivo: `${weak.top}: ${Math.round(weak.pc * 100)}% de acerto em ${weak.q} questões registradas.`,
    });
  if (!actions.length)
    actions.push(
      {
        view: "ciclo",
        label: "Definir meu ciclo de estudos",
        motivo:
          "Distribua o tempo entre suas matérias para receber a próxima atividade.",
      },
      {
        view: "liv",
        label: "Explorar minha biblioteca",
        motivo: "Escolha um livro ou uma aula para começar.",
      },
    );
  return actions.slice(0, 3);
}
function focoPara(e) {
  if (FOCO.on && FOCO.fase === "foco" && e) {
    const t = Math.round((Date.now() - FOCO.ini) / 6e4);
    t >= 1 && (focoLog().push({ d: enHoje(), min: t, mat: FOCO.mat }), save());
  }
  ((FOCO.on = 0), focoSalva(), render());
}
function focoTick() {
  if (!FOCO.on) return;
  const e = FOCO.fim - Date.now(),
    t = document.getElementById("fococlk");
  if (e <= 0) {
    if (FOCO.fase === "foco") {
      (focoLog().push({ d: enHoje(), min: FOCO.min, mat: FOCO.mat }),
        save(),
        toast("⏱️ Foco concluído! Pausa de 5 minutos.", 6e3));
      try {
        navigator.vibrate && navigator.vibrate([200, 100, 200]);
      } catch {}
      try {
        enFala("Great job! Take a short break.");
      } catch {}
      focoInicia(5, FOCO.mat, "pausa");
    } else {
      toast("Pausa terminou. Bora mais um?", 5e3);
      try {
        navigator.vibrate && navigator.vibrate(200);
      } catch {}
      ((FOCO.on = 0), focoSalva(), tab === "estudos" && render());
    }
    return;
  }
  if (t) {
    const a = Math.ceil(e / 1e3);
    t.textContent =
      String(Math.floor(a / 60)).padStart(2, "0") +
      ":" +
      String(a % 60).padStart(2, "0");
  }
}
setInterval(focoTick, 1e3);
function semEstudo() {
  const t = enHoje(),
    e = segundaDe(t),
    a = Array.from({ length: 7 }, (u, p) => diasMais(e, p)),
    o = enS(),
    s = focoLog().filter((u) => u.d >= e && u.d <= t),
    r = {};
  (a.forEach((u) => (r[u] = 0)),
    s.forEach((u) => {
      r[u.d] != null && (r[u.d] += u.min);
    }));
  const n = o.min || {};
  a.forEach((u) => {
    if (u <= t) r[u] += n[u] || 0;
  });
  const i = sum(a.map((u) => (u <= t ? o.xp[u] || 0 : 0))),
    l = (() => {
      try {
        return Object.values(cnS().r).filter((u) => u.d >= e).length;
      } catch {
        return 0;
      }
    })(),
    d = (() => {
      try {
        let u = 0;
        return (
          plL().forEach((p) =>
            (p.materias || []).forEach((m) =>
              (m.top || []).forEach((f) => {
                f.feito &&
                  new Date(f.feito).toISOString().slice(0, 10) >= e &&
                  u++;
              }),
            ),
          ),
          u
        );
      } catch {
        return 0;
      }
    })(),
    c = {};
  return (
    s.forEach((u) => (c[u.mat] = (c[u.mat] || 0) + u.min)),
    Object.values(n).length &&
      (c.ing =
        (c.ing || 0) +
        a.filter((day) => day <= t).reduce((u, p) => u + (n[p] || 0), 0)),
    {
      dias: a,
      por: r,
      tot: sum(Object.values(r)),
      xp: i,
      cn: l,
      pl: d,
      mats: c,
    }
  );
}
function focoHtml() {
  const t = semEstudo(),
    e = estMeta().min,
    a = dshCor(),
    o = Math.max(30, ...Object.values(t.por)),
    s = Math.min(1, t.tot / e),
    r = 30,
    n = 2 * Math.PI * r,
    i = FOCO.on
      ? `<div class="card enfocoon"><div class="sm mut">${FOCO.fase === "foco" ? "Foco" : "Pausa"} \xb7 ${esc((FOCO_MAT.find((l) => l[0] === FOCO.mat) || [])[1] || "")}</div><div id="fococlk" class="fococlk">${(() => {
          const l = Math.max(0, Math.ceil((FOCO.fim - Date.now()) / 1e3));
          return (
            String(Math.floor(l / 60)).padStart(2, "0") +
            ":" +
            String(l % 60).padStart(2, "0")
          );
        })()}</div><div class="g2"><button class="btn s" data-focox="1">Parar${FOCO.fase === "foco" ? " e salvar" : ""}</button><button class="btn s" data-focoz="1">Descartar</button></div></div>`
      : `<div class="card"><b>\u23f1\ufe0f Cron\xf4metro de foco</b><div class="sm mut" style="margin:4px 0 8px">25 minutos estudando sem celular na m\xe3o, 5 de pausa. O tempo entra sozinho no painel da semana.</div><label class="sm">Mat\xe9ria<select id="focomat">${FOCO_MAT.map(([l, d]) => `<option value="${l}"${(FOCO.mat || "ing") === l ? " selected" : ""}>${d}</option>`).join("")}</select></label><div class="g3" style="margin-top:8px"><button class="btn" data-focogo="25">25 min</button><button class="btn s" data-focogo="15">15 min</button><button class="btn s" data-focogo="50">50 min</button></div></div>`;
  return `<h1>Estudos</h1>${EN_SG().replace(' class="on"', "").replace("</div>", '<button class="on" data-ep="esv" data-id="foco">\u23f1\ufe0f Foco</button></div>')}${i}\n<div class="card"><div class="top"><b>\ud83d\udcca Sua semana de estudo</b><span class="sm mut">desde segunda</span></div><div style="display:flex;align-items:center;gap:14px;margin-top:8px"><svg viewBox="0 0 72 72" width="80" height="80"><circle cx="36" cy="36" r="${r}" fill="none" stroke="${a.ac}" stroke-opacity=".18" stroke-width="8"/>${s > 0 ? `<circle cx="36" cy="36" r="${r}" fill="none" stroke="${a.ac}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(n * s).toFixed(1)} ${n.toFixed(1)}" transform="rotate(-90 36 36)"/>` : ""}<text x="36" y="34" font-size="15" font-weight="800" text-anchor="middle" fill="${a.tx}">${t.tot}</text><text x="36" y="47" font-size="8.5" text-anchor="middle" fill="${a.mut}">de ${e} min</text></svg>\n<div class="enst" style="flex:1"><span>\u26a1 <b>${t.xp}</b> XP de ingl\xeas</span><span>\ud83c\udf93 <b>${t.cn}</b> quest\xf5es CNPI-T</span><span>\ud83d\udcd8 <b>${t.pl}</b> t\xf3picos da faculdade</span></div></div>\n<div class="fbars">${t.dias.map((l) => `<div><i style="height:${Math.round((t.por[l] / o) * 100)}%;background:${l === enHoje() ? a.ac : "color-mix(in srgb," + a.ac + " 55%,transparent)"}"></i><small>${diaCurto(l, enHoje())}</small><b>${t.por[l] || ""}</b></div>`).join("")}</div>\n${
    Object.keys(t.mats).length
      ? `<div class="sm" style="margin-top:8px">${Object.entries(t.mats)
          .sort((l, d) => d[1] - l[1])
          .map(
            ([l, d]) =>
              `${esc((FOCO_MAT.find((c) => c[0] === l) || [l, l])[1])} <b>${d} min</b>`,
          )
          .join(" \xb7 ")}</div>`
      : ""
  }\n</div>`;
}
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "foco"
      ? focoHtml()
      : e
          .apply(this, arguments)
          .replace(
            /(<div class="seg" style="margin:8px 0 10px">[\s\S]*?)(<\/div>)/,
            (t, a, o) =>
              a.includes('data-id="foco"')
                ? t
                : a +
                  '<button data-ep="esv" data-id="foco">⏱️ Foco</button>' +
                  o,
          );
  };
}
(document.addEventListener("click", (e) => {
  const t = (o) => e.target.closest(o);
  let a;
  if ((a = t("[data-focogo]"))) {
    const o = document.getElementById("focomat");
    focoInicia(+a.dataset.focogo, o ? o.value : "ing", "foco");
    return;
  }
  if (t("[data-focox]")) {
    focoPara(!0);
    return;
  }
  if (t("[data-focoz]")) {
    focoPara(!1);
    return;
  }
}),
  document.addEventListener("change", (e) => {
    (e.target.id === "focometa" &&
      (((S.ax ?? (S.ax = {})).focoMeta = +e.target.value), save(), render()),
      e.target.id === "focomat" && ((FOCO.mat = e.target.value), focoSalva()));
  }));
{
  const e = TraderStyles.slot("legacy-062");
  ((e.textContent = TraderStyles.css("legacy-062")), TraderStyles.mount(e));
}
let avKey = (e) => HUB_AV.some((t) => t[0] === "mercado:" + e);
{
  const e = render0;
  render0 = function () {
    try {
      tab === "mercado" &&
        typeof MKT < "u" &&
        !avKey(MKT.tab) &&
        (MKT.ultM = MKT.tab);
    } catch {}
    return e.apply(this, arguments);
  };
}
window.addEventListener(
  "click",
  (e) => {
    if (
      !(
        !e.target.closest('#bnav [data-k="mercado"],[data-m2="mercado"]') ||
        typeof MKT > "u"
      ) &&
      (avKey(MKT.tab) || tab === "live" || tab === "graf")
    ) {
      MKT.tab = MKT.ultM && !avKey(MKT.ultM) ? MKT.ultM : "mu";
      try {
        ls.set("diario-mkt-tab", MKT.tab);
      } catch {}
    }
  },
  !0,
);
const MDU = { k: null, par: null, obj: null, rules: null, n: 0 },
  usView = () =>
    typeof MDM < "u" &&
    MDM === "us" &&
    (tab === "regras" || (tab === "dia" && DV !== "hist"));
function usObjDe(e) {
  var t;
  const a = (t = S.days)[e] ?? (t[e] = { chk: {} });
  if (!a.us || typeof a.us != "object") {
    const o = a.noite || {},
      s = o.deb || {},
      n = { chk: {}, u: Date.now() };
    (a.usd && (n.usd = a.usd),
      (n.noite = a.noite || {}),
      DEB_K.forEach((r) => {
        s[r] != null && String(s[r]).trim() !== "" && (n[r] = s[r]);
      }),
      (a.us = n));
  }
  return (a.us.chk || (a.us.chk = {}), a.us.noite || (a.us.noite = {}), a.us);
}
function usRulesDe() {
  return (
    Array.isArray(S.rulesUS) ||
      ((S.rulesUS = (S.rules || []).map((e) => ({ ...e, id: uid() }))),
      (S.mt = Date.now())),
    S.rulesUS
  );
}
function usSolta() {
  if (!MDU.k) return;
  const e = MDU.k,
    t = MDU.par,
    a = S.days[e];
  (a && a !== MDU.obj && a !== t && (t.us = a), (S.days[e] = t));
  const o = t.us;
  (o && (o.u || 0) > (t.u || 0) && (t.u = o.u),
    MDU.rules &&
      (S.rules !== MDU.rules && (S.rulesUS = S.rules), (S.rules = MDU.rules)),
    (MDU.k = null),
    (MDU.par = null),
    (MDU.obj = null),
    (MDU.rules = null));
}
function usPrende() {
  var e;
  const t = usView();
  if ((MDU.k && (!t || MDU.k !== D) && usSolta(), !t || MDU.k || !S || !S.days))
    return;
  const a = (e = S.days)[D] ?? (e[D] = { chk: {} }),
    o = usObjDe(D);
  ((MDU.k = D),
    (MDU.par = a),
    (MDU.obj = o),
    (S.days[D] = o),
    (MDU.rules = S.rules),
    (S.rules = usRulesDe()));
}
{
  const e = render0;
  render0 = function () {
    try {
      tab === "dia" &&
        (typeof GO < "u" &&
          (GO.r === "n" || GO.r === "m") &&
          ((DSES.d = D), (DSES.s = GO.r)),
        typeof dsAtual == "function" && dsAtual());
    } catch {}
    const t = !!MDU.k;
    usPrende();
    try {
      return e.apply(this, arguments);
    } finally {
      t ? usPrende() : usSolta();
    }
  };
}
([
  "click",
  "input",
  "change",
  "keydown",
  "keyup",
  "focusout",
  "touchend",
  "submit",
].forEach((e) => {
  (window.addEventListener(
    e,
    () => {
      usView() && (usPrende(), setTimeout(usSolta, 0));
    },
    !0,
  ),
    window.addEventListener(e, () => {
      MDU.k && usSolta();
    }));
}),
  (mdmDeb = function () {
    var e;
    return (e = S.days)[D] ?? (e[D] = { chk: {}, noite: {} });
  }));
function mdFiltra(e, t) {
  const a = S.trades;
  S.trades = a.filter((o) => (t ? ehUS(o) : !ehUS(o)));
  try {
    DT_IDX = null;
  } catch {}
  try {
    return e();
  } finally {
    S.trades = a;
    try {
      DT_IDX = null;
    } catch {}
  }
}
{
  const e = plExec;
  plExec = function () {
    const t = arguments;
    return tab !== "dia"
      ? e.apply(this, t)
      : mdFiltra(() => e.apply(this, t), MDM === "us");
  };
}
{
  const e = vDia;
  vDia = function () {
    const t = arguments;
    if (DV === "hist") return e.apply(this, t);
    const a = MDM === "us",
      o = S.ops,
      s = S.lanc;
    a || ((S.ops = []), (S.lanc = []));
    try {
      return mdFiltra(() => e.apply(this, t), a);
    } finally {
      a || ((S.ops = o), (S.lanc = s));
    }
  };
}
{
  const e = vDiaHist;
  vDiaHist = function () {
    const t = MDM === "us",
      a = S.days;
    let o;
    if (t) {
      const n = {};
      (Object.keys(a).forEach((r) => {
        a[r] && a[r].us && (n[r] = a[r].us);
      }),
        (S.days = n));
    }
    const s = MDM;
    MDM = "br";
    try {
      o = mdFiltra(() => e.apply(this, arguments), t);
    } finally {
      ((MDM = s), (S.days = a));
    }
    return (
      (o = o.replace(/<div class="seg" id="mdmsw"[\s\S]*?<\/div>/, "")),
      t &&
        (o = o.replace(
          /Nenhum[^<]*registrad[^<]*/,
          "Nenhum dia nos EUA registrado ainda.",
        )),
      o
    );
  };
}
((mdmSwitch = function () {
  return "";
}),
  (segD = function (e) {
    const t = modsOn().includes("ex"),
      a = e === "regras" ? "regras" : DV === "hist" ? "hist" : "ed";
    return `<div class="seg hub mdhub" style="margin:2px 0 8px;display:grid;grid-template-columns:${t ? "1fr 1fr" : "1fr"}"><button class="${MDM !== "us" ? "on" : ""}" data-mdd="br">🇧🇷 Brasil</button>${t ? `<button class="${MDM === "us" ? "on" : ""}" data-mdd="us">🇺🇸 EUA</button>` : ""}</div><div class="hub2" style="margin-bottom:10px">${[
      ["ed", "Dia"],
      ["hist", "Histórico"],
      ["regras", "Regras"],
    ]
      .map(
        ([o, s]) =>
          `<button class="${o === a ? "on" : ""}" data-mdv="${o}">${s}</button>`,
      )
      .join("")}</div>`;
  }),
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest("[data-mdd]");
      if (t) {
        (e.stopPropagation(),
          usSolta(),
          mdmSet(t.dataset.mdd),
          typeof DFASE < "u" && DFASE && (DFASE.d = D),
          render(),
          scrollTo(0, 0));
        return;
      }
      const a = e.target.closest("[data-mdv]");
      if (a) {
        (e.stopPropagation(), usSolta());
        const o = a.dataset.mdv;
        (o === "regras" ? (tab = "regras") : ((tab = "dia"), (DV = o)),
          irPara(tab),
          scrollTo(0, 0));
      }
    },
    !0,
  ));
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" && tab !== "regras") return;
      const t = document.getElementById("app"),
        a = t.querySelector("h1");
      if (!a || a.querySelector(".mdtag")) return;
      (a.insertAdjacentHTML(
        "beforeend",
        ` <span class="mdtag${MDM === "us" ? " us" : ""}">${MDM === "us" ? "EUA" : "Brasil"}</span>`,
      ),
        tab === "regras" &&
          !t.querySelector("#mdrgnota") &&
          a.insertAdjacentHTML(
            "afterend",
            `<div class="sm mut" id="mdrgnota" style="margin:-4px 0 8px">${MDM === "us" ? "Regras da sessão nos EUA. São separadas das do Brasil: mudar aqui não mexe nas da B3." : "Regras da B3. As do EUA ficam na aba EUA."}</div>`,
          ),
        t.querySelectorAll("#app > .seg:not(.hub)").forEach((o) => {
          o.querySelector('[data-a="dv"]') && o.remove();
        }));
    } catch {}
  };
}
{
  const e = TraderStyles.slot("legacy-063");
  ((e.textContent = TraderStyles.css("legacy-063")), TraderStyles.mount(e));
}
const v200on = () => {
    try {
      return (
        !navigator.webdriver || APP_STORAGE.getItem("diario-v200") === "on"
      );
    } catch {
      return !0;
    }
  },
  fcDia = (e, t) => {
    var a;
    return e ? usObjDe(t) : ((a = S.days)[t] ?? (a[t] = { chk: {} }));
  },
  trDoDia = (e, t) =>
    S.trades
      .filter(
        (a) =>
          String(a.dtx || a.dt).slice(0, 10) === e && (t ? ehUS(a) : !ehUS(a)),
      )
      .sort((a, o) => String(a.dt).localeCompare(String(o.dt))),
  plT = (e) => {
    const t = calc(e);
    return t.pl == null ? null : emBRL(t.pl, moedaT(e));
  };
let FCH = null;
function fchAbre(e, t) {
  (usSolta(),
    (t = t || hjD()),
    e == null && (e = typeof MDM < "u" && MDM === "us"),
    (FCH = { us: !!e, k: t, i: 0, disc: fcDia(e, t).disc || 0, frase: "" }));
  let a = document.getElementById("fchov");
  (a ||
    ((a = document.createElement("div")),
    (a.id = "fchov"),
    (a.className = "ov"),
    document.body.appendChild(a)),
    (document.body.style.overflow = "hidden"),
    fchPinta());
}
function fchFecha() {
  (document.getElementById("fchov")?.remove(),
    (document.body.style.overflow = ""),
    (FCH = null));
}
function fchPinta() {
  const e = document.getElementById("fchov");
  if (!e || !FCH) return;
  const { us: t, k: a, i: o } = FCH,
    s = trDoDia(a, t),
    n = s.filter((u) => plT(u) != null),
    r = sum(n.map(plT)),
    i = fcDia(t, a),
    l = ["Trades", "Regras", "Disciplina", "Uma frase", "Pronto"],
    d = t ? "EUA" : "B3",
    c = new Date(a + "T12:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  let p = "";
  if (o === 0)
    p = `<div class="sm mut">Os trades de hoje na ${d}${S.trades.some((u) => u.orig === "profit") ? " (os que vieram da ponte do Profit já estão aqui)" : ""}.</div>
${
  s.length
    ? `<div class="fchl">${s
        .map((u) => {
          const m = plT(u);
          return `<div class="fchr"><span><b>${esc(u.ativo || "")}</b> <span class="mut sm">${String(u.dt).slice(11, 16)} · ${u.side === "V" ? "venda" : "compra"}</span></span><b class="${m == null ? "mut" : cls(m)}">${m == null ? "aberto" : money(m)}</b></div>`;
        })
        .join(
          "",
        )}</div><div class="fchtot">Resultado do dia <b class="${cls(r)}">${money(r)}</b></div>`
    : `<div class="card" style="margin-top:8px"><b>Sem trades hoje na ${d}.</b><div class="sm mut">Dia sem operar também conta: dá para fechar com a nota de disciplina e uma frase.</div></div>`
}`;
  else if (o === 1)
    p = n.length
      ? `<div class="sm mut">Em cada trade: seguiu as suas regras?</div><div class="fchl">${n.map((u) => `<div class="fchr"><span><b>${esc(u.ativo || "")}</b> <span class="sm ${cls(plT(u))}">${money(plT(u))}</span></span><span class="fchyn"><button class="${u.rules === "s" ? "on g" : ""}" data-fchr="${u.id}|s">Sim</button><button class="${u.rules === "n" ? "on r" : ""}" data-fchr="${u.id}|n">Não</button></span></div>`).join("")}</div>`
      : '<div class="sm mut">Sem trades encerrados para conferir. Pode seguir.</div>';
  else if (o === 2)
    p = `<div class="sm mut">De 1 a 5, quanto você seguiu o plano hoje (operando ou não)?</div><div class="fchst">${[1, 2, 3, 4, 5].map((u) => `<button class="${FCH.disc >= u ? "on" : ""}" data-fchd="${u}" aria-label="${u}">★</button>`).join("")}</div><div class="sm" style="text-align:center">${["", "Fugi do plano", "Muitos deslizes", "Na média", "Quase tudo certo", "Disciplina total"][FCH.disc] || "&nbsp;"}</div>`;
  else if (o === 3)
    p = `<div class="sm mut">Uma frase sobre hoje. O que você quer lembrar amanhã?</div><textarea id="fchtx" rows="3" placeholder="ex.: esperei o setup e parei no limite; ou: entrei por impulso depois do stop">${esc(FCH.frase)}</textarea>`;
  else {
    const u = (t ? usRulesDe() : S.rules).length,
      m = chkN(i.chk),
      f = n.filter((v) => v.rules === "n").length,
      x = fchFimMes(a);
    p = `<div class="fchok">✅</div><div style="text-align:center"><b style="font-size:18px">Dia fechado</b></div><div class="kv" style="margin-top:10px">${KV("Resultado", money(r), cls(r))}${KV("Disciplina", FCH.disc ? FCH.disc + " de 5" : "–")}${KV("Regras quebradas", String(f), f ? "r" : "g")}${u ? KV("Checklist", m + "/" + u) : ""}</div>
${x ? `<button class="btn s" data-fch="pdf" style="width:100%;margin-top:10px">📄 Fechou o mês: gerar o PDF de ${x}</button>` : ""}`;
  }
  e.innerHTML = `<div class="ovbox fchbox"><div class="top"><b>🧾 Fechar o dia · ${d}</b><button class="x" data-fch="x" aria-label="Fechar">✕</button></div><div class="sm mut cap1">${esc(c)}</div>
<div class="fchp">${l.map((u, m) => `<i class="${m < o ? "f" : m === o ? "a" : ""}"></i>`).join("")}</div><div class="sm" style="margin:2px 0 8px"><b>${o + 1}. ${l[o]}</b></div>${p}
<div class="g2" style="margin-top:14px">${o < 4 ? `<button class="btn s" data-fch="ant"${o ? "" : " disabled"}>‹ Voltar</button><button class="btn" data-fch="prox">${o < 3 ? "Próximo ›" : "Concluir ✓"}</button>` : '<button class="btn s" data-fch="dia">Abrir o Meu dia</button><button class="btn" data-fch="x">Fechar</button>'}</div></div>`;
}
function fchFimMes(e) {
  const t = new Date(e + "T12:00:00Z");
  let a = new Date(t);
  do a.setUTCDate(a.getUTCDate() + 1);
  while (a.getUTCDay() === 0 || a.getUTCDay() === 6);
  return a.getUTCMonth() === t.getUTCMonth()
    ? ""
    : [
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
      ][t.getUTCMonth()];
}
function fchGrava() {
  const { us: e, k: t } = FCH,
    a = fcDia(e, t);
  FCH.disc &&
    ((a.disc = FCH.disc),
    (a.nota == null || a.nota === "" || +a.nota == 0) &&
      (a.nota = String(FCH.disc * 2)));
  const o = FCH.frase.trim();
  (o &&
    (a.resumo =
      a.resumo && String(a.resumo).trim()
        ? String(a.resumo).trim() +
          `
` +
          o
        : o),
    (a.fech = Date.now()),
    (a.u = Date.now()));
  const s = S.days[t];
  (s && e && (s.u = a.u), save());
}
document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if (!document.getElementById("fchov")) {
      (a = t("[data-fchgo]")) &&
        (e.stopPropagation(), fchAbre(a.dataset.fchgo === "us"));
      return;
    }
    if ((a = t("[data-fchr]"))) {
      const [o, s] = a.dataset.fchr.split("|"),
        n = S.trades.find((r) => r.id === o);
      (n && ((n.rules = s), (n.u = Date.now()), save()), fchPinta());
      return;
    }
    if ((a = t("[data-fchd]"))) {
      ((FCH.disc = +a.dataset.fchd), fchPinta());
      return;
    }
    if ((a = t("[data-fch]"))) {
      const o = a.dataset.fch;
      if (o === "x") {
        (fchFecha(), render());
        return;
      }
      if (o === "ant") {
        ((FCH.i = Math.max(0, FCH.i - 1)), fchPinta());
        return;
      }
      if (o === "prox") {
        const s = document.getElementById("fchtx");
        (s && (FCH.frase = s.value),
          FCH.i === 3 && fchGrava(),
          FCH.i++,
          fchPinta());
        return;
      }
      if (o === "dia") {
        const s = FCH.us,
          n = FCH.k;
        (fchFecha(),
          mdmSet(s ? "us" : "br"),
          (D = n),
          (DV = "ed"),
          irPara("dia"),
          scrollTo(0, 0));
        return;
      }
      if (o === "pdf") {
        const s = FCH.us;
        fchFecha();
        try {
          modPdf(s ? "ex" : "dt", !1);
        } catch {
          toast("Não consegui gerar o PDF.");
        }
        return;
      }
    }
  },
  !0,
);
function fchPend() {
  if (!v200on()) return null;
  const e = new Date().getHours(),
    t = hjD();
  if (e < 17) return null;
  const a = new Date().getDay(),
    o = fcDiaLe(t, !1),
    s = fcDiaLe(t, !0);
  return !o.fech && (trDoDia(t, !1).length || (a > 0 && a < 6 && e >= 18))
    ? "br"
    : !s.fech && trDoDia(t, !0).length && e >= 18
      ? "us"
      : null;
}
const fcDiaLe = (e, t) => {
  const a = S.days[e] || {};
  return t ? a.us || {} : a;
};
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      if (!t) return;
      if (tab === "home" && !t.querySelector("#fchb")) {
        const a = fchPend();
        if (a) {
          const o = t.querySelector('section[data-hb="hero"]'),
            s = `<div class="card fchcv" id="fchb"><div class="top"><b>🧾 Fechar o dia${a === "us" ? " (EUA)" : ""}</b><button class="btn${new Date().getHours() >= 17 ? " fch-ambar" : ""}" data-fchgo="${a}">Começar</button></div><div class="sm mut">4 passos, 2 minutos: trades, regras, nota de disciplina e uma frase.</div></div>`;
          o
            ? o.insertAdjacentHTML("afterend", s)
            : t.insertAdjacentHTML("afterbegin", s);
        }
      }
      if (tab === "dia" && DV !== "hist" && !t.querySelector("#fchd")) {
        const a = t.querySelector('.dfase[data-fase="pos"]'),
          o = MDM === "us",
          s = fcDiaLe(D, o),
          n = `<div class="card fchcv" id="fchd"><div class="top"><b>🧾 ${s.fech ? "Dia fechado" : "Fechamento guiado"}</b><button class="btn${s.fech ? " s" : ""}" data-fchgo="${o ? "us" : "br"}">${s.fech ? "Refazer" : "Fechar o dia"}</button></div><div class="sm mut">${s.fech ? "Feito às " + hm(s.fech) + (s.disc ? " · disciplina " + s.disc + "/5" : "") : "Trades, regras, disciplina e uma frase, num passo a passo."}</div></div>`;
        a && a.insertAdjacentHTML("afterbegin", n);
      }
    } catch {}
  };
}
{
  const e = fchAbre;
  fchAbre = function (t, a) {
    e(t, a || (tab === "dia" ? D : hjD()));
  };
}
function ruimCalc() {
  const e = [];
  try {
    const { hj: t, P: a } = pHoje();
    if (!t.length) return e;
    const o = pCore(t, a),
      s = typeof trCfg == "function" ? trCfg() : {},
      n = +s.maxStops || 2;
    if (o.mot.length) return e;
    (o.lim > 0 &&
      o.perda >= 0.8 * o.lim &&
      e.push({
        k: "perto" + Math.floor((o.perda / o.lim) * 10),
        t: "Perto do limite de perda",
        s: `Hoje: ${money(-o.perda)} de ${money(-o.lim)}. Sobra ${money(o.lim - o.perda)} até o dia travar.`,
      }),
      o.seq >= 1 &&
        o.seq === n - 1 &&
        e.push({
          k: "seq" + o.seq,
          t:
            o.seq === 1
              ? "Um stop: mais um e o dia trava"
              : `${o.seq} stops seguidos: mais um e o dia trava`,
          s: "É agora que bate a vontade de recuperar. Respire, releia o plano e só entre no setup.",
        }));
    try {
      const r = mesaCfg();
      if (r && +r.perdaDia > 0) {
        const i = mesaCalc(r);
        i &&
          i.pode &&
          isFinite(i.pode[1]) &&
          i.pode[1] > 0 &&
          i.pode[1] <= 0.3 * r.perdaDia &&
          e.push({
            k: "mesa",
            t: "A mesa está quase no limite do dia",
            s: `Na mesa, você ainda pode perder ${mFmt(r, i.pode[1])} hoje.`,
          });
      }
    } catch {}
  } catch {}
  return e;
}
function ruimChecar() {
  var e;
  if (v200on())
    try {
      const t = hjD(),
        a = (e = S.ax ?? (S.ax = {})).ruim ?? (e.ruim = {}),
        o = a[t] ?? (a[t] = {}),
        s = ruimCalc().filter((i) => !o[i.k]);
      if (
        (Object.keys(a).forEach((i) => {
          i < diasMais(t, -10) && delete a[i];
        }),
        !s.length || document.getElementById("ruimov"))
      )
        return;
      const n = s[0];
      (s.forEach((i) => (o[i.k] = 1)), save());
      const r = document.createElement("div");
      ((r.id = "ruimov"),
        (r.innerHTML = `<div class="ruimbox"><div style="font-size:48px">⚠️</div><b style="font-size:22px">${esc(n.t)}</b><div style="margin:8px 0 4px">${esc(n.s)}</div><div class="sm" style="opacity:.85">${
          s.length > 1
            ? esc(
                s
                  .slice(1)
                  .map((i) => i.t)
                  .join(" · "),
              )
            : "Hoje o melhor trade pode ser não fazer mais nenhum."
        }</div>
<button class="btn risk-close-day" data-ruim="fch">Parar e fechar o dia</button><button class="btn s risk-dismiss" data-ruim="x">Entendi</button></div>`),
        (r.dataset.us = typeof MDM < "u" && MDM === "us" ? "1" : ""),
        document.body.appendChild(r));
      try {
        navigator.vibrate && navigator.vibrate([300, 120, 300, 120, 300]);
      } catch {}
      try {
        document.hidden &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          navigator.serviceWorker &&
          navigator.serviceWorker.ready.then((i) =>
            i.showNotification("⚠️ " + n.t, { body: n.s, tag: "ruim-" + n.k }),
          );
      } catch {}
    } catch {}
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-ruim]");
  if (!t) return;
  const a = document.getElementById("ruimov"),
    o = a && a.dataset.us === "1";
  (a?.remove(), t.dataset.ruim === "fch" && fchAbre(o, hjD()));
}),
  setInterval(() => {
    document.hidden || ruimChecar();
  }, 2e4));
{
  let e = 0;
  const t = render0;
  render0 = function () {
    (t.apply(this, arguments),
      clearTimeout(e),
      (e = setTimeout(ruimChecar, 600)));
  };
}
{
  const e = modExtra;
  modExtra = function (t, a) {
    let o = e.apply(this, arguments) || "";
    try {
      const s = a.filter((c) => c.c && c.c.pl != null),
        n = (c) => emBRL(c.c.pl, moedaT(c));
      if (!s.length) return o;
      const r = {};
      s.forEach((c) => {
        var p;
        if (c.err && c.err !== "Nenhum") {
          const u = r[(p = c.err)] ?? (r[p] = { n: 0, v: 0 });
          (u.n++, (u.v += n(c)));
        }
      });
      const i = Object.entries(r).sort((c, p) => p[1].n - c[1].n);
      i.length &&
        (o += `<h2>Erros mais repetidos</h2><div class="card">${dshTab(
          ["Erro", "Vezes", "Resultado"],
          i
            .slice(0, 8)
            .map(
              ([c, p]) =>
                `<tr><td>${esc(c)}</td><td>${p.n}</td><td class="${cls(p.v)}">${money(p.v)}</td></tr>`,
            ),
        )}</div>`);
      const l = s.filter((c) => c.rules === "s"),
        d = s.filter((c) => c.rules === "n");
      (l.length || d.length) &&
        (o += `<h2>Disciplina</h2><div class="card">${dshTab(
          ["", "Trades", "Acerto", "Resultado"],
          [
            ["Seguindo as regras", l],
            ["Quebrando regra", d],
          ]
            .filter((c) => c[1].length)
            .map(([c, p]) => {
              const u = sum(p.map(n));
              return `<tr><td>${c}</td><td>${p.length}</td><td>${pct0(p.filter((m) => n(m) > 0).length / p.length)}</td><td class="${cls(u)}">${money(u)}</td></tr>`;
            }),
        )}</div>`);
    } catch {}
    return o;
  };
}
async function enNoticia() {
  if (!EN.ok) {
    enCarrega();
    return;
  }
  toast("Buscando a notícia de hoje…", 2500);
  try {
    MKT.items || (await mkLoad(!0));
  } catch {}
  const e = (MKT.items || []).filter((o) => o && o.t);
  if (!e.length) {
    toast("Não consegui as notícias agora. Tente de novo em instantes.", 4e3);
    return;
  }
  const t = e.find((o) => String(o.d || "").slice(0, 10) === hjD()) || e[0],
    a = String(t.t).slice(0, 120);
  ((EN.chat = {
    cena: `Notícia de hoje: "${a}". Explique em inglês bem simples e faça 3 perguntas fáceis, uma por vez.`.slice(
      0,
      200,
    ),
    nome: "📰 Notícia de hoje",
    hist: [],
    busy: 0,
    err: "",
  }),
    (EN.run = null),
    (ESV = "ing"),
    irPara("estudos"),
    scrollTo(0, 0),
    chatEnvia(""));
}
{
  const e = chatHtml;
  chatHtml = function () {
    let t = e.apply(this, arguments);
    return (
      EN.chat &&
        EN.chat.nome &&
        (t = t.replace(/\ud83d\udcac [^<]*<\/b>/, esc(EN.chat.nome) + "</b>")),
      t
    );
  };
}
{
  const e = enHome;
  enHome = function () {
    let t = e.apply(this, arguments);
    try {
      t = t.replace(
        '<div class="enchips">',
        '<button class="btn" data-ennews="1" style="width:100%;margin:0 0 8px">📰 Inglês com a notícia de hoje</button><div class="enchips">',
      );
    } catch {}
    return t;
  };
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest("[data-ennews]") && (e.stopPropagation(), enNoticia());
  },
  !0,
);
const facL = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).fac ?? (e.fac = []);
  },
  facProx = (e) => {
    const t = hjD(),
      a = diasMais(t, e);
    return facL()
      .filter((o) => o.d >= t && o.d <= a)
      .sort((o, s) => o.d.localeCompare(s.d));
  },
  facFalta = (e) => {
    const t = Math.round(
      (new Date(e + "T12:00") - new Date(hjD() + "T12:00")) / 864e5,
    );
    return t === 0 ? "hoje" : t === 1 ? "amanhã" : "em " + t + " dias";
  };
function facHtml() {
  const e = hjD(),
    t = facL()
      .filter((o) => o.d >= diasMais(e, -1))
      .sort((o, s) => o.d.localeCompare(s.d)),
    a = { prova: "📝 Prova", trab: "📎 Trabalho", ent: "📬 Entrega" };
  return `<div class="card" id="faccard"><div class="top"><b>🎓 Provas e trabalhos</b><span class="sm mut">faculdade</span></div>
${
  t.length
    ? t
        .map((o) => {
          const s = typeof turnoTxt == "function" ? turnoTxt(o.d) : "";
          return `<div class="facr"><div><b>${esc(o.t)}</b><div class="sm mut">${a[o.tp] || ""} · ${fmtD(o.d).slice(0, 5)} · <b style="color:${o.d <= diasMais(e, 3) ? "var(--am)" : "inherit"}">${facFalta(o.d)}</b>${s ? " · " + esc(s) : ""}</div></div><button class="x" data-facx="${o.id}" aria-label="Apagar">✕</button></div>`;
        })
        .join("")
    : '<div class="sm mut" style="margin:4px 0">Nada marcado. Anote as datas para o app lembrar no Início.</div>'
}
<div class="g2" style="margin-top:8px"><label class="sm">O quê<input id="factx" placeholder="ex.: Prova de Micro I"></label><label class="sm">Data<input id="facdt" type="date" value="${diasMais(e, 7)}"></label></div>
<div style="display:flex;gap:6px;margin-top:6px"><select id="factp" style="flex:1">${Object.entries(
    a,
  )
    .map(([o, s]) => `<option value="${o}">${s}</option>`)
    .join(
      "",
    )}</select><button class="btn" data-facadd="1">Adicionar</button></div>
<div class="sm mut" style="margin-top:6px">Faltando 7 dias, aparece no Início; nos dias de turno, o app mostra junto com o modo estudo.</div></div>`;
}
{
  const e = focoHtml;
  focoHtml = function () {
    return e.apply(this, arguments) + facHtml();
  };
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-facadd]")) {
    const a = document.getElementById("factx").value.trim(),
      o = document.getElementById("facdt").value,
      s = document.getElementById("factp").value;
    if (!a || !o) {
      toast("Escreva o que é e a data.");
      return;
    }
    (facL().push({ id: uid(), t: a.slice(0, 80), d: o, tp: s }),
      save(),
      render());
    return;
  }
  const t = e.target.closest("[data-facx]");
  t &&
    (((S.ax ?? (S.ax = {})).fac = facL().filter(
      (a) => a.id !== t.dataset.facx,
    )),
    save(),
    render());
});
function facAviso() {
  const e = facProx(7);
  return e.length
    ? `<div class="card" id="facav"><div class="top"><b>🎓 Faculdade</b><button class="btn s" data-facver="1">Ver</button></div>${e
        .slice(0, 3)
        .map(
          (t) =>
            `<div class="sm" style="margin-top:4px">${t.tp === "prova" ? "📝" : t.tp === "trab" ? "📎" : "📬"} <b>${esc(t.t)}</b> · ${facFalta(t.d)}</div>`,
        )
        .join("")}</div>`
    : "";
}
document.addEventListener("click", (e) => {
  e.target.closest("[data-facver]") &&
    ((ESV = "foco"),
    irPara("estudos"),
    setTimeout(
      () =>
        document.getElementById("faccard")?.scrollIntoView({ block: "start" }),
      80,
    ));
});
const turnoModo = () => {
  if (!v200on()) return !1;
  try {
    if ((S.ax || {}).modoTurno === 0) return !1;
    const e = new Date().getHours();
    return (
      typeof turnoNv == "function" && turnoNv(hjD()) === "r" && e >= 5 && e < 18
    );
  } catch {
    return !1;
  }
};
function turnoModoHtml() {
  const e = (() => {
      try {
        return cnDevidas().length;
      } catch {
        return 0;
      }
    })(),
    t = (() => {
      try {
        return enDevidas().length;
      } catch {
        return 0;
      }
    })();
  return `<div class="card tmcard" id="tmcard"><div class="top"><b>🏭 Dia de turno · modo estudo</b><button class="btn s" data-tm="off" style="padding:4px 10px">desligar</button></div><div class="sm mut" style="margin:4px 0 10px">Hoje não é dia de operar. O mercado fica de lado e o Início mostra o que dá para fazer nos intervalos.</div>
<div class="tmg"><button data-tm="en"><span>🇺🇸</span><b>Lição de inglês</b><small>3 a 5 min${t ? " · " + t + " para revisar" : ""}</small></button><button data-tm="cards"><span>🃏</span><b>Cartões</b><small>2 min</small></button><button data-tm="cnpi"><span>🎓</span><b>CNPI-T</b><small>${e ? "revisão: " + e + " questões" : "treino rápido (10)"}</small></button><button data-tm="foco"><span>⏱️</span><b>Foco 25 min</b><small>quando chegar em casa</small></button></div></div>`;
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t) return;
      const a = t.querySelector('section[data-hb="hero"]');
      let o = t.querySelector("#fchb") || a;
      const s = facAviso();
      if (
        (s &&
          !t.querySelector("#facav") &&
          (o
            ? o.insertAdjacentHTML("afterend", s)
            : t.insertAdjacentHTML("afterbegin", s)),
        !turnoModo() || t.querySelector("#tmcard"))
      )
        return;
      ((o = t.querySelector("#facav") || t.querySelector("#fchb") || a),
        o
          ? o.insertAdjacentHTML("afterend", turnoModoHtml())
          : t.insertAdjacentHTML("afterbegin", turnoModoHtml()));
      const n = t.querySelector("#tmcard"),
        r = t.querySelector('section[data-hb="en"]');
      (r && n && n.after(r),
        ["adr", "venc", "cal"].forEach((i) => {
          const l = t.querySelector(`section[data-hb="${i}"]`);
          l && (l.style.display = "none");
        }),
        document.body.classList.add("tmodo"));
    } catch {}
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tm]");
  if (!t) return;
  const a = t.dataset.tm;
  if (a === "off") {
    (((S.ax ?? (S.ax = {})).modoTurno = 0),
      save(),
      toast(
        "Modo turno desligado. Para ligar de novo: Mais → Aparência.",
        4500,
      ),
      render());
    return;
  }
  if (a === "en") {
    ((ESV = "ing"),
      (EN.run = null),
      irPara("estudos"),
      setTimeout(() => {
        const o = document.querySelector(".enhero [data-enl]");
        o && o.click();
      }, 300));
    return;
  }
  if (a === "cards") {
    enInicia("cards", "");
    return;
  }
  if (a === "cnpi") {
    ((ESV = "cnpi"),
      irPara("estudos"),
      setTimeout(() => {
        try {
          cnInicia(cnDevidas().length ? "rev" : "rap", "ct");
        } catch {}
      }, 200));
    return;
  }
  a === "foco" && ((ESV = "foco"), irPara("estudos"), scrollTo(0, 0));
});
const INI_OP = [
  ["home", "Início"],
  ["live", "Ao vivo"],
  ["dia:br", "Meu dia · Brasil"],
  ["dia:us", "Meu dia · EUA"],
  ["ing", "Inglês"],
];
function iniAplica() {
  try {
    if (sessionStorage.getItem("diario-ini")) return;
    sessionStorage.setItem("diario-ini", "1");
  } catch {
    return;
  }
  if (location.search.includes("go=")) return;
  const e = (S.ax || {}).inicio;
  !e ||
    e === "home" ||
    tab !== "home" ||
    (e === "live"
      ? (tab = "live")
      : e === "ing"
        ? ((tab = "estudos"), (ESV = "ing"))
        : e.startsWith("dia:") &&
          (mdmSet(e.slice(4)),
          (tab = "dia"),
          (D = loc().slice(0, 10)),
          (DV = "ed")),
    irPara(tab));
}
(setTimeout(iniAplica, 1200),
  (GOR.fechar = () => {
    ((GO.r = null), setTimeout(() => fchAbre(null, hjD()), 300));
  }),
  (GOR.diaus = () => {
    ((GO.r = null),
      mdmSet("us"),
      (tab = "dia"),
      (D = loc().slice(0, 10)),
      (DV = "ed"),
      irPara(tab));
  }),
  (GOR.diabr = () => {
    ((GO.r = null),
      mdmSet("br"),
      (tab = "dia"),
      (D = loc().slice(0, 10)),
      (DV = "ed"),
      irPara(tab));
  }),
  (GOR.ing = () => {
    ((GO.r = null), (ESV = "ing"), irPara("estudos"));
  }));
{
  const e = siriHtml;
  siriHtml = function () {
    const t = location.origin + location.pathname,
      a = [
        ["Fechar o dia", "home&r=fechar"],
        ["Ao vivo", "live"],
        ["Meu dia · Brasil", "home&r=diabr"],
        ["Meu dia · EUA", "home&r=diaus"],
        ["Lição de inglês", "home&r=ing"],
      ];
    let o = e.apply(this, arguments);
    const s = a
        .map(
          ([r, i]) =>
            `<div style="margin:8px 0"><b class="sm">${r}</b><div style="display:flex;gap:6px;margin-top:4px"><input readonly value="${esc(t + "?go=" + i)}" style="margin:0;font-size:12px"><button class="btn s" data-siri="${esc(t + "?go=" + i)}">Copiar</button></div></div>`,
        )
        .join(""),
      n = (S.ax || {}).inicio || "home";
    return (
      o +
      `<div class="card" id="inicard"><b>Abrir o app direto em</b><select id="iniop" style="margin-top:6px">${INI_OP.map(([r, i]) => `<option value="${r}"${n === r ? " selected" : ""}>${i}</option>`).join("")}</select><div class="sm mut" style="margin-top:4px">Vale quando o app abre do zero. Para ter um ícone de cada tela, use os links abaixo no app Atalhos (Abrir URL) e escolha "Adicionar à Tela de Início".</div>${s}
<label class="ck" style="margin-top:8px"><input type="checkbox" id="tmop"${(S.ax || {}).modoTurno === 0 ? "" : " checked"}><span>Modo turno: em dia de turno das 8h às 17h, o Início mostra estudo no lugar do mercado</span></label></div>`
    );
  };
}
document.addEventListener("change", (e) => {
  (e.target.id === "iniop" &&
    (((S.ax ?? (S.ax = {})).inicio = e.target.value),
    save(),
    toast("Pronto. Na próxima vez que abrir, o app vai direto para lá.")),
    e.target.id === "tmop" &&
      (((S.ax ?? (S.ax = {})).modoTurno = e.target.checked ? 1 : 0), save()));
});
{
  const e = TraderStyles.slot("legacy-064");
  ((e.textContent = TraderStyles.css("legacy-064")), TraderStyles.mount(e));
}
const HUB_SS = [
  ["mercado:saz", "Sazonalidade"],
  ["mercado:se", "Sentimento"],
];
try {
  (HUB_SS.forEach(([e]) => {
    const t = HUB_M.findIndex((a) => a[0] === e);
    t >= 0 && HUB_M.splice(t, 1);
  }),
    MGRP.forEach((e) => {
      e[1] = e[1].filter((t) => !HUB_SS.some((a) => a[0] === t));
    }));
} catch {}
const ssKey = (e) => HUB_SS.some((t) => t[0] === "mercado:" + e);
{
  const e = segM;
  segM = function (t) {
    return HUB_SS.some((a) => a[0] === t)
      ? `<div class="seg hub" style="margin:2px 0 12px;display:grid;grid-template-columns:1fr 1fr">${HUB_SS.map(([a, o]) => `<button class="${a === t ? "on" : ""}" data-hub="${a}">${o}</button>`).join("")}</div>`
      : e.apply(this, arguments);
  };
}
window.addEventListener(
  "click",
  (e) => {
    if (!e.target.closest('[data-m2="sazsen"]')) return;
    (e.stopPropagation(),
      e.preventDefault(),
      document.getElementById("mdr2")?.remove(),
      (document.body.style.overflow = ""));
    const t = (() => {
      try {
        return ls.get("diario-ss");
      } catch {
        return null;
      }
    })();
    MKT.tab = t === "se" ? "se" : "saz";
    try {
      ls.set("diario-mkt-tab", MKT.tab);
    } catch {}
    (irPara("mercado"), scrollTo(0, 0));
  },
  !0,
);
{
  const e = render0;
  render0 = function () {
    try {
      tab === "mercado" && ssKey(MKT.tab) && ls.set("diario-ss", MKT.tab);
    } catch {}
    return e.apply(this, arguments);
  };
}
{
  const e = avKey;
  avKey = (t) => e(t) || ssKey(t);
}
FN_ESPERADA.analise = "v202";
const GR_LT = {
    alta: ["▲ Alta", "var(--g)"],
    queda: ["▼ Queda", "var(--r)"],
    lateral: ["◆ Lateral", "var(--am)"],
  },
  grCtxHtml = (e) => {
    const t = (e && e.contexto) || [];
    if (!t.length && !(e && e.leitura)) return "";
    const a = GR_LT[e.leitura];
    return `<div class="grctx">${a ? `<div class="grlt" style="color:${a[1]};border-color:${a[1]}">${a[0]}</div>` : ""}${
      t.length
        ? `<div class="sm" style="font-weight:700;margin:2px 0 4px">Por que o mercado está assim</div>${t
            .map((o) => {
              const s = String(o).match(/^([^:]{2,18}):\s*(.*)$/);
              return `<div class="grci">${s ? `<b>${esc(s[1])}</b> ${esc(s[2])}` : esc(o)}</div>`;
            })
            .join("")}`
        : ""
    }</div>`;
  };
{
  const e = grCorpo;
  grCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = GR.j || grAgora(),
        o = GR.v[loc().slice(0, 10) + a];
      if (o) {
        const s = grCtxHtml(o);
        if (s) {
          const n = t.indexOf('<div style="line-height:1.55');
          if (n > 0) {
            const r = t.indexOf("</div>", n) + 6;
            t = t.slice(0, r) + s + t.slice(r);
          }
        }
      }
    } catch {}
    return t;
  };
}
{
  const e = grTexto;
  grTexto = function (t) {
    let a = e.apply(this, arguments);
    try {
      const o = (t && t.contexto) || [];
      if (o.length || t.leitura) {
        const s = GR_LT[t.leitura];
        a +=
          `

${s ? s[0] + " · " : ""}Por que o mercado está assim
` +
          o.map((n) => "• " + n).join(`
`);
      }
    } catch {}
    return a;
  };
}
{
  const e = TraderStyles.slot("legacy-065");
  ((e.textContent = TraderStyles.css("legacy-065")), TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v204";
{
  const e = dgCorpo;
  dgCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = DG.ia || {};
      if (a.erro || !("openrouter" in a)) return t;
      const o = a.openrouter || {},
        s = o.teste && /^respondeu/.test(o.teste),
        n = `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--bd,#f4f3f1)"><span>${o.chave ? (s ? "✅" : "⚠️") : "➖"}</span><span><b>OpenRouter (segunda IA, gratuita)</b><div class="sm mut">${o.chave ? `Teste: ${esc(o.teste || "—")}${o.ms ? ` (${(o.ms / 1e3).toFixed(1).replace(".", ",")}s)` : ""}${(o.modelos || []).length ? " · modelos " + esc(o.modelos.join(", ")) : ""}. Atende primeiro o professor de inglês e as questões do CNPI-T e da faculdade; nas outras análises, entra quando o Gemini falha.` : "Sem chave: crie OPENROUTER_API_KEY nos segredos do Supabase para o Gemini ter reserva."}</div></span></div>`,
        r = t.indexOf("IA do Google (Gemini)");
      if (r < 0) return t;
      const i = t.indexOf("</span></div>", r);
      return i < 0 ? t : t.slice(0, i + 13) + n + t.slice(i + 13);
    } catch {
      return t;
    }
  };
}
const GT = {
    tk: "",
    tf: "1d",
    cache: {},
    C: null,
    cut: 0,
    resp: null,
    busy: 0,
    err: "",
    cego: 1,
    nome: "",
  },
  GT_AT = [
    ["WIN", "Mini índice"],
    ["WDO", "Mini dólar"],
    ["PETR4", "Petrobras"],
    ["VALE3", "Vale"],
    ["ITUB4", "Itaú"],
    ["BBAS3", "Banco do Brasil"],
    ["BTC", "Bitcoin"],
  ],
  GT_VIS = 60,
  GT_FUT = 10,
  gtS = () => {
    var e;
    const t = S.ax ?? (S.ax = {});
    return (t.gt ?? (t.gt = { h: [] }), (e = t.gt).h ?? (e.h = []), t.gt);
  };
function gtMedia(e, t, a) {
  if (t + 1 < a) return null;
  let o = 0;
  for (let s = t - a + 1; s <= t; s++) o += e[s][4];
  return o / a;
}
function gtAtr(e, t, a = 14) {
  let o = 0,
    s = 0;
  for (let n = Math.max(1, t - a + 1); n <= t; n++)
    ((o += Math.max(
      e[n][2] - e[n][3],
      Math.abs(e[n][2] - e[n - 1][4]),
      Math.abs(e[n][3] - e[n - 1][4]),
    )),
      s++);
  return s ? o / s : 0;
}
function gtCtx(e, t) {
  const a = e[t][4],
    o = gtMedia(e, t, 20),
    s = gtMedia(e, t, 50);
  return o == null || s == null
    ? "Sem tendência clara"
    : a > o && o > s
      ? "Tendência de alta"
      : a < o && o < s
        ? "Tendência de baixa"
        : "Sem tendência clara";
}
function gtReal(e, t) {
  const a = gtAtr(e, t),
    o = e[t][4],
    s = e[Math.min(e.length - 1, t + GT_FUT)][4],
    n = a > 0 ? (s - o) / a : 0;
  return {
    mv: n,
    pct: (s / o - 1) * 100,
    res: n > 1 ? "alta" : n < -1 ? "queda" : "lateral",
  };
}
function gtSorteia() {
  const e = GT.C;
  if (!e || e.length < GT_VIS + GT_FUT + 60) return !1;
  const t = Math.max(GT_VIS + 50, 60),
    a = e.length - GT_FUT - 1;
  return (
    (GT.cut = t + Math.floor(Math.random() * (a - t + 1))),
    (GT.resp = null),
    !0
  );
}
async function gtCarrega(e) {
  const t = cfg();
  if (!t) {
    ((GT.err = "Configure o Supabase na aba Conta."), render());
    return;
  }
  ((!e || e === "?") &&
    (e = GT_AT[Math.floor(Math.random() * GT_AT.length)][0]),
    (GT.tk = e),
    (GT.nome = (GT_AT.find((o) => o[0] === e) || [e, e])[1]));
  const a = e + "|" + GT.tf;
  if (GT.cache[a]) {
    ((GT.C = GT.cache[a]),
      gtSorteia() || (GT.err = "Histórico curto demais."),
      render());
    return;
  }
  ((GT.busy = 1), (GT.err = ""), render());
  try {
    const o = await fetch(t.url + "/functions/v1/candles", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: t.key },
        body: JSON.stringify({ ativo: e, intervalo: GT.tf }),
      }),
      s = await o.json();
    if (!o.ok) throw new Error(s.error || "Erro " + o.status);
    const n = (s.candles || []).filter((r) => Array.isArray(r) && r[4] > 0);
    if (n.length < GT_VIS + GT_FUT + 60)
      throw new Error("Histórico curto demais para este ativo.");
    ((GT.cache[a] = n), (GT.C = n), gtSorteia());
  } catch (o) {
    ((GT.err = String(o.message || o)), (GT.C = null));
  }
  ((GT.busy = 0), render());
}
function gtSvg(e, t, a, o) {
  const s = e.slice(t, o + 1),
    n = Math.max(...s.map((f) => f[2])),
    r = Math.min(...s.map((f) => f[3])),
    i = s.length,
    l = 328 / i,
    d = (f) => 6 + ((n - f) / (n - r || 1)) * 178,
    c = dshCor();
  let p = "",
    u = "";
  s.forEach((f, x) => {
    const v = f[4] >= f[1],
      g = 6 + l * x + l / 2,
      h = t + x > a,
      b = v ? c.g : c.r,
      y = h ? 0.9 : 1;
    p += `<line x1="${g.toFixed(1)}" x2="${g.toFixed(1)}" y1="${d(f[2]).toFixed(1)}" y2="${d(f[3]).toFixed(1)}" stroke="${b}" stroke-width="1" opacity="${y}"/><rect x="${(g - l * 0.35).toFixed(1)}" width="${(l * 0.7).toFixed(1)}" y="${d(Math.max(f[1], f[4])).toFixed(1)}" height="${Math.max(1, Math.abs(d(f[1]) - d(f[4]))).toFixed(1)}" fill="${h ? "none" : b}" stroke="${b}" opacity="${y}"/>`;
    const j = gtMedia(e, t + x, 20);
    j != null && (u += `${u ? "L" : "M"}${g.toFixed(1)} ${d(j).toFixed(1)}`);
  });
  const m = 6 + l * (a - t + 1);
  return `<svg viewBox="0 0 340 190" class="gtsvg">${u ? `<path d="${u}" fill="none" stroke="${c.ac}" stroke-width="1.4" opacity=".75"/>` : ""}${p}${o > a ? `<line x1="${m}" x2="${m}" y1="0" y2="190" stroke="${c.mut}" stroke-dasharray="3 3"/>` : ""}</svg>`;
}
function gtStats() {
  const e = gtS().h,
    t = e.filter((i) => i.ok).length;
  let a = 0,
    o = 0,
    s = 0;
  e.forEach((i) => {
    ((s = i.ok ? s + 1 : 0), (o = Math.max(o, s)));
  });
  for (let i = e.length - 1; i >= 0 && e[i].ok; i--) a++;
  const n = {};
  e.forEach((i) => {
    var l;
    const d = n[(l = i.ctx)] ?? (n[l] = { n: 0, ok: 0 });
    (d.n++, i.ok && d.ok++);
  });
  const r = {};
  return (
    e.forEach((i) => {
      var l;
      const d = r[(l = i.real)] ?? (r[l] = { n: 0, ok: 0 });
      (d.n++, i.ok && d.ok++);
    }),
    { n: e.length, ok: t, seq: a, best: o, ctx: n, res: r }
  );
}
function gtHtml() {
  const e = GT.C,
    t = gtStats(),
    a = estSeg("gt"),
    o = `<div class="card"><div class="top"><b>📈 Treino de leitura de gráfico</b><span class="sm mut">${t.n ? `${t.ok}/${t.n} · sequência ${t.seq}` : "novo"}</span></div><div class="sm mut" style="margin:4px 0 8px">Gráficos reais do passado, cortados num ponto qualquer. Você diz o que vem nos próximos ${GT_FUT} candles e o app mostra o que aconteceu. A linha colorida é a média de 20.</div>
<div class="chips2">${GT_AT.map(([p, u]) => `<button class="${GT.tk === p ? "on" : ""}" data-gtk="${p}">${p}</button>`).join("")}<button data-gtk="?">🎲 Sortear</button></div>
<div class="g2" style="margin-top:8px"><label class="sm">Tempo gráfico<select id="gttf"><option value="1d"${GT.tf === "1d" ? " selected" : ""}>Diário (2 anos)</option><option value="60m"${GT.tf === "60m" ? " selected" : ""}>60 min (3 meses)</option></select></label><label class="ck sm" style="align-self:end"><input type="checkbox" id="gtcego"${GT.cego ? " checked" : ""}><span>Esconder o nome e a data</span></label></div></div>`;
  if (GT.busy)
    return `<h1>Estudos</h1>${a}${o}<div class="card sm mut">Carregando o histórico…</div>`;
  if (GT.err)
    return `<h1>Estudos</h1>${a}${o}<div class="warn">${esc(GT.err)}</div>`;
  if (!e) return `<h1>Estudos</h1>${a}${o}${gtStatsHtml(t)}`;
  const s = GT.cut,
    n = s - GT_VIS + 1,
    r = GT.resp,
    i = gtReal(e, s),
    l = gtCtx(e, s),
    d = new Date((e[s][0] - 3 * 3600) * 1e3).toISOString().slice(0, 10),
    c = [
      ["alta", "▲ Alta", "g"],
      ["lateral", "◆ Lateral", "am"],
      ["queda", "▼ Queda", "r"],
    ];
  return `<h1>Estudos</h1>${a}${o}<div class="card"><div class="top"><b>${r || !GT.cego ? esc(GT.tk + " · " + GT.nome) : "Ativo escondido"}</b><span class="sm mut">${r || !GT.cego ? fmtD(d) : ""} · ${GT.tf === "1d" ? "diário" : "60 min"}</span></div>
${gtSvg(e, n, s, r ? s + GT_FUT : s)}
${r ? `<div class="enfb ${r.ok ? "ok" : "no"}"><b>${r.ok ? "Acertou!" : "Não foi desta vez."}</b> Você disse <b>${r.resp}</b>; nos ${GT_FUT} candles seguintes foi <b>${i.res}</b> (${i.pct >= 0 ? "+" : ""}${i.pct.toFixed(1).replace(".", ",")}%, ${i.mv >= 0 ? "+" : ""}${i.mv.toFixed(1).replace(".", ",")} ATR).<div class="sm mut" style="margin-top:4px">Contexto no corte: ${esc(l)}. Alta ou queda = andou mais de 1 ATR (o tamanho médio de um candle) a favor; menos que isso, lateral.</div></div><button class="btn" data-gtn="1" style="width:100%;margin-top:10px">Próximo gráfico</button>` : `<div class="sm" style="margin:8px 0 6px;text-align:center">Nos próximos ${GT_FUT} candles, o preço vai…</div><div class="g3">${c.map(([p, u, m]) => `<button class="btn s gtop ${m}" data-gtr="${p}">${u}</button>`).join("")}</div>`}</div>${gtStatsHtml(t)}`;
}
function gtStatsHtml(e) {
  if (!e.n) return "";
  const t = (o) => (o.n ? Math.round((o.ok / o.n) * 100) + "%" : "–"),
    a = Object.entries(e.ctx)
      .filter(([, o]) => o.n >= 5)
      .sort((o, s) => o[1].ok / o[1].n - s[1].ok / s[1].n);
  return `<div class="card"><b>Seu desempenho</b><div class="enst" style="margin:6px 0"><span>🎯 <b>${t(e)}</b> de acerto</span><span>🔥 sequência <b>${e.seq}</b> (melhor ${e.best})</span><span>📊 <b>${e.n}</b> gráficos</span></div>
<table class="sm"><tr><th>Contexto</th><th>Gráficos</th><th>Acerto</th></tr>${Object.entries(
    e.ctx,
  )
    .map(
      ([o, s]) => `<tr><td>${esc(o)}</td><td>${s.n}</td><td>${t(s)}</td></tr>`,
    )
    .join("")}</table>
<div class="sm mut" style="margin-top:6px">Por resultado: ${Object.entries(
    e.res,
  )
    .map(([o, s]) => `${o} ${t(s)}`)
    .join(
      " · ",
    )}. ${a.length ? `Onde você mais erra: <b>${esc(a[0][0].toLowerCase())}</b>.` : "Com 5 gráficos de um contexto, o app mostra onde você mais erra."} Acertar por sorte dá cerca de 33%.</div></div>`;
}
(document.addEventListener("click", (e) => {
  const t = (o) => e.target.closest(o);
  let a;
  if ((a = t("[data-gtk]"))) {
    gtCarrega(a.dataset.gtk);
    return;
  }
  if ((a = t("[data-gtr]"))) {
    if (!GT.C || GT.resp) return;
    const o = gtReal(GT.C, GT.cut),
      s = a.dataset.gtr;
    GT.resp = { resp: s, ok: s === o.res };
    const n = gtS().h;
    (n.push({
      d: hjD(),
      tk: GT.tk,
      tf: GT.tf,
      ctx: gtCtx(GT.C, GT.cut),
      resp: s,
      real: o.res,
      ok: GT.resp.ok,
    }),
      n.length > 400 && n.splice(0, n.length - 400),
      save(),
      render());
    return;
  }
  if (t("[data-gtn]")) {
    if (GT.cego && Math.random() < 0.35) {
      gtCarrega("?");
      return;
    }
    (gtSorteia(), render(), scrollTo(0, 0));
  }
}),
  document.addEventListener("change", (e) => {
    (e.target.id === "gttf" &&
      ((GT.tf = e.target.value), GT.tk ? gtCarrega(GT.tk) : render()),
      e.target.id === "gtcego" &&
        ((GT.cego = e.target.checked ? 1 : 0), render()));
  }));
var estSeg;
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "gt"
      ? gtHtml()
      : e
          .apply(this, arguments)
          .replace(
            /(<div class="seg" style="margin:8px 0 10px">[\s\S]*?)(<\/div>)/,
            (t, a, o) =>
              a.includes('data-id="gt"')
                ? t
                : a +
                  '<button data-ep="esv" data-id="gt">📈 Gráfico</button>' +
                  o,
          );
  };
}
GOR.grafico = () => {
  ((GO.r = null), (ESV = "gt"), irPara("estudos"));
};
const ELEI = [
    ["2026-10-04", "2026-10-25"],
    ["2030-10-06", "2030-10-27"],
  ],
  fdsHoje = () => {
    const e = new Date().getDay();
    return e === 0 || e === 6;
  };
function fdsEventos() {
  const e = AG.v[0];
  return !e || !Array.isArray(e.eventos)
    ? null
    : e.eventos
        .filter((t) => t.imp === 1 && (t.p === "BR" || t.p === "US"))
        .sort((t, a) => String(t.em).localeCompare(String(a.em)))
        .slice(0, 7);
}
let FDS_T = 0,
  FDS_FIM = 0;
function fdsAgenda() {
  if (AG.v[0] || AG.busy || FDS_T) return;
  const e = AG.sem;
  AG.sem = 0;
  try {
    agCarrega(!0);
  } catch {}
  AG.sem = e;
  let t = 0;
  FDS_T = setInterval(() => {
    (t++,
      (AG.v[0] || (!AG.busy && t > 1) || t > 12) &&
        (clearInterval(FDS_T), (FDS_FIM = 1), tab === "home" && render()));
  }, 1500);
}
function fdsHtml() {
  const t = hjD(),
    e = semEstudo(),
    a = estMeta().min,
    o = fdsEventos(),
    s = typeof rvgFeita == "function" && rvgFeita(),
    r = (S.ax || {}).metaMes,
    n = ELEI.find(([l, d]) => t <= d && diasMais(t, 10) >= l);
  let i = "";
  if (n) {
    const [l, d] = n,
      c = t <= l ? l : d,
      u = Math.round((new Date(c + "T12:00") - new Date(t + "T12:00")) / 864e5);
    i = `\ud83d\uddf3\ufe0f ${c === l ? "1\xba" : "2\xba"} turno da elei\xe7\xe3o presidencial ${u === 0 ? "\xe9 hoje" : u === 1 ? "\xe9 amanh\xe3" : "em " + u + " dias"}: segunda o mercado reage ao resultado (estatais, bancos, juros e d\xf3lar costumam se mexer mais).`;
  }
  return (
    o || fdsAgenda(),
    `<div class="card fdscard" id="fdscard"><div class="top"><b>\ud83c\udf24\ufe0f Fim de semana</b><span class="sm mut">mercado fechado</span></div>\n${i ? `<div class="sm fdsel">${i}</div>` : ""}\n<div class="fdsl"><div><b class="sm">Revis\xe3o da semana</b><div class="sm mut">${s ? "feita \u2713" : "5 passos, uns 10 minutos"}</div></div>${s ? "" : '<button class="btn s" data-rvg="abre">Come\xe7ar</button>'}</div>\n<div class="fdsl"><div><b class="sm">Semana que vem</b>${o ? (o.length ? o.map((l) => `<div class="sm">${AG_FL[l.p] || ""} <span class="mut">${AG_DS[new Date(agDia(l.em) + "T12:00:00-03:00").getUTCDay()].slice(0, 3).toLowerCase()} ${agHora(l.em)}</span> ${esc(l.t)}</div>`).join("") : '<div class="sm mut">Sem eventos de alta import\xe2ncia no Brasil e nos EUA.</div>') : FDS_FIM ? '<div class="sm mut">Agenda indispon\xedvel agora (veja em Mercado \u2192 Agenda).</div>' : '<div class="sm mut">Carregando a agenda\u2026</div>'}</div></div>\n<div class="fdsl"><div><b class="sm">Estudo da semana</b><div class="sm mut">${e.tot} de ${a} minutos \xb7 ${e.xp} XP de ingl\xeas</div></div><span style="display:flex;gap:6px"><button class="btn s" data-fds="gt">\ud83d\udcc8 Gr\xe1fico</button><button class="btn s" data-fds="en">\ud83c\uddfa\ud83c\uddf8 Ingl\xeas</button></span></div>\n${r && r.mes === t.slice(0, 7) ? `<div class="sm" style="margin-top:6px">\ud83c\udfaf Meta do m\xeas: <b>${esc(r.txt)}</b></div>` : ""}</div>`
  );
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-fds]");
  t &&
    (t.dataset.fds === "gt"
      ? ((ESV = "gt"), irPara("estudos"), scrollTo(0, 0))
      : ((ESV = "ing"), irPara("estudos"), scrollTo(0, 0)));
});
let RVM = null;
const rvmAnt = () => {
    const e = new Date(hjD().slice(0, 8) + "15T12:00:00Z");
    return (e.setUTCMonth(e.getUTCMonth() - 1), e.toISOString().slice(0, 7));
  },
  RVM_MESES = [
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
  rvmNome = (e) => RVM_MESES[+e.slice(5, 7) - 1] + " de " + e.slice(0, 4);
function rvmDados(e) {
  const t = modLinhas()
      .filter(
        (r) =>
          r.c && r.c.pl != null && String(r.t.dtx || r.t.dt).slice(0, 7) === e,
      )
      .map((r) => ({ ...r, v: emBRL(r.c.pl, moedaT(r.t)) })),
    a = {};
  t.forEach((r) => {
    var i;
    const l = a[(i = r.m)] ?? (a[i] = { n: 0, v: 0, g: 0 });
    (l.n++, (l.v += r.v), r.v > 0 && l.g++);
  });
  const o = {};
  t.forEach((r) => {
    const i = String(r.t.dtx || r.t.dt).slice(0, 10);
    o[i] = (o[i] || 0) + r.v;
  });
  const s = Object.entries(o).sort((r, i) => r[1] - i[1]),
    n = {};
  return (
    t.forEach((r) => {
      r.t.err && r.t.err !== "Nenhum" && (n[r.t.err] = (n[r.t.err] || 0) + 1);
    }),
    {
      L: t,
      por: a,
      tot: sum(t.map((r) => r.v)),
      pior: s[0],
      melhor: s[s.length - 1],
      nd: s.length,
      err: Object.entries(n).sort((r, i) => i[1] - r[1]),
      quebr: t.filter((r) => r.t.rules === "n").length,
    }
  );
}
const RVM_METAS = [
  ["fech", "Fechar o dia (fechamento guiado) em todos os dias que operar"],
  ["stop", "Nenhum trade sem stop"],
  ["lim", "Parar no limite de perda todos os dias"],
  ["regra", "No máximo 2 trades quebrando regra no mês"],
  ["max", "No máximo 3 trades por dia"],
  ["erro", "Zerar o erro que mais repeti"],
];
function rvmAbre(e) {
  ((e = e || rvmAnt()), (RVM = { ym: e, i: 0, meta: "" }));
  let t = document.getElementById("rvmov");
  (t ||
    ((t = document.createElement("div")),
    (t.id = "rvmov"),
    document.body.appendChild(t)),
    (document.body.style.overflow = "hidden"),
    rvmPinta());
}
function rvmFecha() {
  (document.getElementById("rvmov")?.remove(),
    (document.body.style.overflow = ""),
    (RVM = null));
}
function rvmPinta() {
  const e = document.getElementById("rvmov");
  if (!e || !RVM) return;
  const { ym: t, i: a } = RVM,
    o = rvmDados(t),
    s = [
      "Resultado",
      "Erros e regras",
      "Melhor e pior dia",
      "Meta do próximo mês",
      "Pronto",
    ];
  let n = "";
  const r = (i) =>
    ({ fx: "Forex" })[i] || (typeof MOD_NOME == "function" ? MOD_NOME(i) : i);
  (a === 0
    ? (n = o.L.length
        ? `<div class="fchl">${Object.entries(o.por)
            .map(
              ([i, l]) =>
                `<div class="fchr"><span><b>${esc(r(i))}</b> <span class="sm mut">${l.n} trades · acerto ${Math.round((l.g / l.n) * 100)}%</span></span><b class="${cls(l.v)}">${money(l.v)}</b></div>`,
            )
            .join(
              "",
            )}</div><div class="fchtot">Total do mês <b class="${cls(o.tot)}">${money(o.tot)}</b></div><div class="sm mut">${o.nd} dias operados.</div>`
        : `<div class="card"><b>Sem trades encerrados em ${rvmNome(t)}.</b><div class="sm mut">Dá para fazer a revisão mesmo assim e escolher a meta do mês.</div></div>`)
    : a === 1
      ? (n = `${
          o.err.length
            ? `<div class="sm mut">Erros marcados nos trades:</div><div class="fchl">${o.err
                .slice(0, 5)
                .map(
                  ([i, l]) =>
                    `<div class="fchr"><span>${esc(i)}</span><b>${l}×</b></div>`,
                )
                .join("")}</div>`
            : '<div class="sm">Nenhum erro marcado nos trades do mês.</div>'
        }<div class="sm" style="margin-top:8px">Trades quebrando regra: <b class="${o.quebr ? "r" : "g"}">${o.quebr}</b></div>`)
      : a === 2
        ? (n = o.nd
            ? `<div class="kv">${KV("Melhor dia", o.melhor ? fmtD(o.melhor[0]).slice(0, 5) + " · " + money(o.melhor[1]) : "–", "g")}${KV("Pior dia", o.pior ? fmtD(o.pior[0]).slice(0, 5) + " · " + money(o.pior[1]) : "–", "r")}</div><div class="sm mut" style="margin-top:8px">Vale abrir esses dois dias no Meu dia e reler o que você escreveu.</div>`
            : '<div class="sm mut">Sem dias operados no mês.</div>')
        : a === 3
          ? (n = `<div class="sm mut">Escolha uma meta de processo (comportamento, não dinheiro) para ${rvmNome(hjD().slice(0, 7))}:</div><div class="rvmmeta">${RVM_METAS.map(([i, l]) => `<button class="${RVM.meta === i ? "on" : ""}" data-rvmm="${i}">${esc(i === "erro" && o.err.length ? "Zerar: " + o.err[0][0] : l)}</button>`).join("")}</div>`)
          : (n = `<div class="fchok">🗓️</div><div style="text-align:center"><b style="font-size:18px">Revisão de ${rvmNome(t)} feita</b>${RVM.meta ? `<div class="sm" style="margin-top:6px">Meta: <b>${esc(((S.ax || {}).metaMes || {}).txt || "")}</b></div>` : ""}</div><div class="g2" style="margin-top:12px">${[
              "dt",
              "sw",
              "op",
              "ex",
            ]
              .filter((i) => o.por[i])
              .map(
                (i) =>
                  `<button class="btn s" data-rvmpdf="${i}">📄 PDF · ${esc(r(i))}</button>`,
              )
              .join("")}</div>`),
    (e.innerHTML = `<div class="fchbox"><div class="top"><b>🗓️ Revisão do mês · ${esc(rvmNome(t))}</b><button class="x" data-rvm="x" aria-label="Fechar">✕</button></div><div class="fchp">${s.map((i, l) => `<i class="${l < a ? "f" : l === a ? "a" : ""}"></i>`).join("")}</div><div class="sm" style="margin:2px 0 8px"><b>${a + 1}. ${s[a]}</b></div>${n}
<div class="g2" style="margin-top:14px">${a < 4 ? `<button class="btn s" data-rvm="ant"${a ? "" : " disabled"}>‹ Voltar</button><button class="btn" data-rvm="prox">${a < 3 ? "Próximo ›" : "Concluir ✓"}</button>` : '<span></span><button class="btn" data-rvm="x">Fechar</button>'}</div></div>`));
}
document.addEventListener(
  "click",
  (e) => {
    var t;
    const a = (s) => e.target.closest(s);
    let o;
    if ((o = a("[data-rvmgo]"))) {
      GOR.relmes();
      return;
    }
    if (RVM) {
      if ((o = a("[data-rvmm]"))) {
        ((RVM.meta = o.dataset.rvmm), rvmPinta());
        return;
      }
      if ((o = a("[data-rvmpdf]"))) {
        const s = o.dataset.rvmpdf;
        rvmFecha();
        try {
          modPdf(s, !0);
        } catch {}
        return;
      }
      if ((o = a("[data-rvm]"))) {
        const s = o.dataset.rvm;
        if (s === "x") {
          (rvmFecha(), render());
          return;
        }
        if (s === "ant") {
          ((RVM.i = Math.max(0, RVM.i - 1)), rvmPinta());
          return;
        }
        if (s === "prox") {
          if (RVM.i === 3) {
            const n = rvmDados(RVM.ym),
              r = RVM_METAS.find((i) => i[0] === RVM.meta);
            (r &&
              ((S.ax ?? (S.ax = {})).metaMes = {
                mes: hjD().slice(0, 7),
                tipo: r[0],
                txt:
                  r[0] === "erro" && n.err.length
                    ? "Zerar: " + n.err[0][0]
                    : r[1],
              }),
              (((t = S.ax ?? (S.ax = {})).rvm ?? (t.rvm = {}))[RVM.ym] =
                Date.now()),
              save());
          }
          (RVM.i++, rvmPinta());
        }
      }
    }
  },
  !0,
);
const rvmPend = () => {
  if (+hjD().slice(8, 10) > 7) return !1;
  const e = rvmAnt();
  return (
    !((S.ax || {}).rvm || {})[e] &&
    S.trades.some((t) => String(t.dtx || t.dt).slice(0, 7) === e)
  );
};
GOR.mes = () => {
  ((GO.r = null), GOR.relmes());
};
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home" || !v200on()) return;
      const t = document.getElementById("app");
      if (!t) return;
      const a = t.querySelector('section[data-hb="hero"]');
      if (rvmPend() && !t.querySelector("#rvmb")) {
        const o = `<div class="card fchcv" id="rvmb"><div class="top"><b>🗓️ Revisão de ${esc(rvmNome(rvmAnt()))}</b><button class="btn" data-rvmgo="1">Começar</button></div><div class="sm mut">O relatório do mês (resultado, erros, setups, comparação com o mês anterior e PDF) e a meta de processo do mês novo.</div></div>`;
        a
          ? a.insertAdjacentHTML("afterend", o)
          : t.insertAdjacentHTML("afterbegin", o);
      }
      if (fdsHoje() && !t.querySelector("#fdscard")) {
        const o = t.querySelector("#rvmb") || a;
        (o
          ? o.insertAdjacentHTML("afterend", fdsHtml())
          : t.insertAdjacentHTML("afterbegin", fdsHtml()),
          ["adr", "venc", "posso", "lim"].forEach((s) => {
            const n = t.querySelector(`section[data-hb="${s}"]`);
            n && (n.style.display = "none");
          }));
      }
    } catch (t) {
      console.error(t);
    }
  };
}
const ditNorm = (e) =>
  String(e || "")
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
function enDiff(e, t) {
  const a = ditNorm(e),
    o = ditNorm(t),
    s = a.length,
    n = o.length,
    r = Array.from({ length: s + 1 }, () => new Array(n + 1).fill(0));
  for (let c = s - 1; c >= 0; c--)
    for (let p = n - 1; p >= 0; p--)
      r[c][p] =
        a[c] === o[p]
          ? r[c + 1][p + 1] + 1
          : Math.max(r[c + 1][p], r[c][p + 1]);
  const i = new Array(s).fill(!1);
  let l = 0,
    d = 0;
  for (; l < s && d < n; )
    a[l] === o[d]
      ? ((i[l] = !0), l++, d++)
      : r[l + 1][d] >= r[l][d + 1]
        ? l++
        : d++;
  return { pal: a, ok: i, nota: s ? i.filter(Boolean).length / s : 0 };
}
function ditInicia() {
  if (!EN.ok) {
    enCarrega();
    return;
  }
  const e = enS(),
    t = enTodos().filter((s) => e.r[s.id] && s.ex),
    a = t.length >= 8 ? t : enTodos().filter((s) => s.ex),
    o = enEmb(a)
      .filter((s) => ditNorm(s.ex).length <= 12)
      .slice(0, 8);
  ((EN.dit = { L: o, i: 0, resp: null, xp: 0, ok: 0, ini: Date.now() }),
    (EN.run = null),
    (EN.chat = null),
    (ESV = "ing"),
    irPara("estudos"),
    scrollTo(0, 0),
    setTimeout(() => enFala(o[0].ex), 300));
}
function ditHtml() {
  const e = EN.dit,
    t = e.L[e.i];
  if (!t)
    return `<div class="card enfim"><div style="font-size:40px">✍️</div><b style="font-size:20px">Ditado concluído!</b><div class="enst" style="justify-content:center;margin:10px 0"><span>🎯 <b>${e.ok}/${e.L.length}</b></span><span>⚡ <b>+${e.xp}</b> XP</span></div><button class="btn" data-ditgo="1" style="width:100%">Outro ditado</button><button class="btn s" data-ditx="1" style="width:100%;margin-top:8px">Voltar</button></div>`;
  const a = e.resp;
  return `<div class="entop"><button class="btn s" data-ditx="1">✕</button><div class="enbar big"><i style="width:${Math.round((e.i / e.L.length) * 100)}%"></i></div><b class="g">${e.xp} XP</b></div>
<div class="card enl"><div class="sm mut">✍️ Ditado: escute e escreva o que ouviu</div><div style="display:flex;gap:8px;justify-content:center;margin:10px 0"><button class="enbig" data-enfala="${esc(t.ex)}">🔊</button><button class="btn s" data-ditlento="1" style="align-self:center">🐢 Devagar</button></div>
${a ? `<div class="ditres">${a.pal.map((o, s) => `<span class="${a.ok[s] ? "g" : "r"}">${esc(o)}</span>`).join(" ")}</div><div class="sm" style="margin-top:6px">“${enTap(t.ex)}”</div><div class="sm mut">${esc(t.exPt)}</div><div class="sm" style="margin-top:4px">Você escreveu: <i>${esc(a.dig || "(nada)")}</i></div>` : '<textarea id="dittx" rows="2" placeholder="Escreva aqui em inglês" autocapitalize="off" autocomplete="off" spellcheck="false"></textarea><button class="btn" data-ditok="1" style="width:100%;margin-top:8px">Verificar</button>'}</div>
${a ? `<div class="enfb ${a.nota >= 0.8 ? "ok" : "no"}"><b>${a.nota >= 1 ? "Perfeito!" : a.nota >= 0.8 ? "Quase perfeito!" : "Escute de novo com calma."}</b> ${Math.round(a.nota * 100)}% das palavras.<button class="btn" data-ditn="1" style="width:100%;margin-top:10px">Continuar</button></div>` : ""}`;
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    if (t("[data-ditgo]")) {
      (e.stopPropagation(), ditInicia());
      return;
    }
    const a = EN.dit;
    if (a) {
      if (t("[data-ditx]")) {
        ((EN.dit = null), render());
        return;
      }
      if (t("[data-ditlento]")) {
        const o = enS().cfg,
          s = o.vel;
        o.vel = 0.6;
        try {
          enFala(a.L[a.i].ex);
        } finally {
          setTimeout(() => {
            o.vel = s;
          }, 50);
        }
        return;
      }
      if (t("[data-ditok]")) {
        const o = document.getElementById("dittx"),
          s = o ? o.value : "",
          n = enDiff(a.L[a.i].ex, s);
        ((n.dig = s), (a.resp = n));
        const r = n.nota >= 0.8 ? 10 : 3;
        (n.nota >= 0.8 && a.ok++, (a.xp += r), enXp(r), save(), render());
        return;
      }
      if (t("[data-ditn]")) {
        if ((a.i++, (a.resp = null), a.i >= a.L.length))
          try {
            enMin(a);
          } catch {}
        (save(), render(), scrollTo(0, 0));
        const o = a.L[a.i];
        o && setTimeout(() => enFala(o.ex), 300);
      }
    }
  },
  !0,
),
  document.addEventListener("keydown", (e) => {
    e.key === "Enter" &&
      e.target.id === "dittx" &&
      (e.preventDefault(), document.querySelector("[data-ditok]")?.click());
  }));
function enTradeCena() {
  const e = S.trades
      .filter((s) => s.dt)
      .sort((s, n) =>
        String(n.dtx || n.dt).localeCompare(String(s.dtx || s.dt)),
      ),
    t = e[0];
  if (!t) return null;
  const a = calc(t),
    o = a.pl == null ? null : emBRL(a.pl, moedaT(t));
  return `Ajude o aluno a contar em inglês simples o trade dele: ${t.ativo || ""} ${t.side === "V" ? "venda" : "compra"}, entrada ${t.entry || "?"}, saída ${t.exit || "aberto"}${o != null ? ", " + (o >= 0 ? "ganho" : "perda") + " " + money(Math.abs(o)) : ""}. Peça para ele descrever.`.slice(
    0,
    200,
  );
}
document.addEventListener(
  "click",
  (e) => {
    if (!e.target.closest("[data-entrade]")) return;
    if ((e.stopPropagation(), !EN.ok)) {
      enCarrega();
      return;
    }
    const t = enTradeCena();
    if (!t) {
      toast("Registre um trade primeiro.");
      return;
    }
    ((EN.chat = {
      cena: t,
      nome: "📝 Meu trade em inglês",
      hist: [],
      busy: 0,
      err: "",
    }),
      (EN.run = null),
      (EN.dit = null),
      (ESV = "ing"),
      irPara("estudos"),
      scrollTo(0, 0),
      chatEnvia(""));
  },
  !0,
);
{
  const e = enView;
  enView = function () {
    return EN.ok && EN.dit && !EN.chat
      ? `<h1>Inglês</h1>${ditHtml()}`
      : e.apply(this, arguments);
  };
}
{
  const e = enHome;
  enHome = function () {
    let t = e.apply(this, arguments);
    try {
      t = t
        .replace(
          '<button class="enatal" data-ennumgo="1">',
          '<button class="enatal" data-ditgo="1"><span>✍️</span><b>Ditado</b><small>escute e escreva</small></button><button class="enatal" data-ennumgo="1">',
        )
        .replace(
          '<div class="enchips">',
          '<div class="enchips"><button class="btn s" data-entrade="1">📝 Meu trade de hoje</button>',
        );
    } catch {}
    return t;
  };
}
{
  const e = fchPinta;
  fchPinta = function () {
    e.apply(this, arguments);
    try {
      if (FCH && FCH.i === 4) {
        const t = document.querySelector("#fchov .fchbox");
        if (t && !t.querySelector("[data-entrade]") && S.trades.length) {
          const a = t.querySelector(".g2:last-child");
          a &&
            a.insertAdjacentHTML(
              "beforebegin",
              '<button class="btn s" data-entrade="1" data-fch="x" style="width:100%;margin-top:8px">🇺🇸 Contar este dia em inglês para o professor</button>',
            );
        }
      }
    } catch {}
  };
}
let RSP = null;
function rspAbre() {
  rspFecha();
  const e = document.createElement("div");
  ((e.id = "rspov"),
    document.body.appendChild(e),
    (RSP = { ini: Date.now(), fase: -1, tm: 0 }),
    (document.body.style.overflow = "hidden"),
    rspTick(),
    (RSP.tm = setInterval(rspTick, 250)));
}
function rspFecha() {
  (RSP && clearInterval(RSP.tm),
    (RSP = null),
    document.getElementById("rspov")?.remove(),
    (document.body.style.overflow = ""));
}
const RSP_F = [
  ["Inspire", "grow"],
  ["Segure", "hold"],
  ["Solte o ar", "shrink"],
  ["Segure", "hold0"],
];
function rspTick() {
  const e = document.getElementById("rspov");
  if (!e || !RSP) return;
  const t = (Date.now() - RSP.ini) / 1e3,
    a = 64;
  if (t >= a) {
    (clearInterval(RSP.tm),
      (e.innerHTML =
        '<div class="rspbox"><div style="font-size:40px">🧭</div><b style="font-size:20px">O próximo trade está no seu plano?</b><div class="sm" style="opacity:.8;margin:6px 0 14px">Setup, stop e tamanho definidos antes de entrar.</div><button class="btn" data-rsp="sim" style="width:100%">Sim, está no plano</button><button class="btn s" data-rsp="nao" style="width:100%;margin-top:8px">Não: hoje vou só observar</button></div>'));
    return;
  }
  const o = Math.floor(t / 4) % 4,
    s = 4 - Math.floor(t % 4);
  if (o !== RSP.fase) {
    RSP.fase = o;
    try {
      navigator.vibrate &&
        navigator.vibrate(o === 0 ? 60 : o === 2 ? [40, 60, 40] : 20);
    } catch {}
    e.innerHTML = `<div class="rspbox"><div class="sm" style="opacity:.75">Respiração quadrada · ${Math.ceil((a - t) / 16)} ciclo(s)</div><div class="rspc ${RSP_F[o][1]}"></div><b class="rspt">${RSP_F[o][0]}</b><div class="rspn" id="rspn">${s}</div><button class="btn s" data-rsp="x" style="margin-top:14px">Sair</button></div>`;
  }
  const n = document.getElementById("rspn");
  n && (n.textContent = s);
}
document.addEventListener(
  "click",
  (e) => {
    var t;
    const a = e.target.closest("[data-rsp]");
    if (!a) return;
    e.stopPropagation();
    const o = a.dataset.rsp;
    if (o === "go") {
      rspAbre();
      return;
    }
    if (o === "sim" || o === "nao") {
      const s = (t = S.ax ?? (S.ax = {})).resp ?? (t.resp = []);
      (s.push({ d: hjD(), h: hm(), plano: o === "sim" }),
        s.length > 200 && s.splice(0, s.length - 200),
        save(),
        o === "nao" &&
          toast(
            "Boa decisão. Observar também é treino: anote o que você vê.",
            4500,
          ));
    }
    rspFecha();
  },
  !0,
);
const rspBtn =
  '<button class="btn s rspgo" data-rsp="go">🫁 Respirar 1 minuto</button>';
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.querySelector("#app .trv-top");
      if (
        (t &&
          /Pausa depois do stop/.test(t.textContent) &&
          !t.querySelector("[data-rsp]") &&
          t.insertAdjacentHTML("beforeend", " " + rspBtn),
        tab === "home")
      ) {
        const a = document.querySelector('#app section[data-hb="posso"]');
        a &&
          !a.querySelector("[data-rsp]") &&
          travaEstado().pausaAte &&
          a.insertAdjacentHTML(
            "beforeend",
            '<div class="sm" style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">Na pausa depois do stop: ' +
              rspBtn +
              "</div>",
          );
      }
    } catch {}
  };
}
new MutationObserver(() => {
  document.querySelectorAll(".trv-b.am").forEach((e) => {
    /Pausa depois do stop/.test(e.textContent) &&
      !e.querySelector("[data-rsp]") &&
      e.insertAdjacentHTML(
        "beforeend",
        '<div style="margin-top:8px">' + rspBtn + "</div>",
      );
  });
}).observe(document.body, { childList: !0, subtree: !0 });
{
  const e = dgCorpo;
  dgCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = (DG.fontes || []).find((l) =>
        /Banco Central/.test(l.fonte || ""),
      );
      if (!a || a.ok || !/sem resposta|timeout|demor/i.test(a.detalhe || ""))
        return t;
      const o = t.indexOf("<b>Banco Central</b>");
      if (o < 0) return t;
      const s = t.lastIndexOf("❌", o);
      s >= 0 && o - s < 120 && (t = t.slice(0, s) + "⚠️" + t.slice(s + 1));
      const n = t.indexOf("</div>", o),
        r = new Date().getDay(),
        i = r === 0 || r === 6;
      n > 0 &&
        (t =
          t.slice(0, n) +
          ` · <span style="color:var(--am)">lento, não fora do ar: o site do Banco Central demorou para responder${i ? ". No fim de semana não há dado novo (Selic e PTAX só mudam em dia útil); o app usa o último valor" : "; o app usa o último valor que recebeu"}.</span>` +
          t.slice(n));
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-066");
  ((e.textContent = TraderStyles.css("legacy-066")), TraderStyles.mount(e));
}
{
  const e = focoHtml;
  focoHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        'data-id="foco">⏱️ Foco</button></div>',
        'data-id="foco">⏱️ Foco</button><button data-ep="esv" data-id="gt">📈 Gráfico</button></div>',
      );
  };
}
{
  const e = turnoModoHtml;
  turnoModoHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        '<button data-tm="foco">',
        '<button data-fds="gt"><span>📈</span><b>Treino de gráfico</b><small>2 min, sem risco</small></button><button data-tm="foco">',
      );
  };
}
const ESC_REF = "2026-10-17",
  ESC_A =
    "16,16,F,0,0,8,8,F,F,16,16,F,0,0,8,8,8,F,16,16,F,0,0,0,8,8,F,16".split(","),
  ESC_OFF = { A: 0, B: 7, C: 14, D: 21 },
  escValida = (e) => e === "ADM" || ESC_OFF[e] != null;
function escCod(e, t) {
  if (e === "ADM") {
    const s = new Date(t + "T12:00:00Z").getUTCDay();
    return s === 0 || s === 6 ? "F" : "8";
  }
  const a = ESC_OFF[e];
  if (a == null) return "";
  const o = Math.round(
    (Date.parse(t + "T12:00:00Z") - Date.parse(ESC_REF + "T12:00:00Z")) / 864e5,
  );
  return ESC_A[(((o + a) % 28) + 28) % 28];
}
let ESC_M = null,
  ESC_COPY = 0;
function escDias(e, t) {
  const a = loc().slice(0, 10),
    o = e + "|" + a + "|" + JSON.stringify(t || {});
  if (ESC_M && ESC_M.k === o) return ESC_M.v;
  const s = {};
  for (let n = -120; n <= 400; n++) {
    const r = diasMais(a, n),
      i = escCod(e, r);
    i && (s[r] = i);
  }
  return (
    Object.entries(t || {}).forEach(([n, r]) => {
      r ? (s[n] = r) : delete s[n];
    }),
    (ESC_M = { k: o, v: s }),
    s
  );
}
