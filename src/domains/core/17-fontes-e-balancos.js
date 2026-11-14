function duoInicia(e, t) {
  if (!EN.ok) {
    enCarrega();
    return;
  }
  if (duoVidasOn() && duoVidas().n <= 0) {
    ((EN.semVida = 1),
      (ESV = "ing"),
      irPara("estudos"),
      scrollTo(0, 0));
    return;
  }
  const a = duoLicao(e, +t);
  if (!a) {
    toast("Lição vazia.");
    return;
  }
  ((EN.run = a),
    (EN.semVida = 0),
    (ESV = "ing"),
    irPara("estudos"),
    scrollTo(0, 0),
    enAutoFala());
}
const DUO_CONV_N = 4;
function duoConv(e) {
  const t = duoUnid().find((o) => o.k === e);
  if (!t) return;
  const a = t.lic
    .flatMap((o) => o.ws)
    .slice(0, 8)
    .map((o) => o.en)
    .join(", ");
  ((EN.duoConv = { tema: e, n: 0 }),
    enInicia(
      "chat",
      `Unit test about "${t.nome}". Talk with the student in a simple real-life situation about this topic and help him use these words: ${a}`,
    ));
}
{
  const e = chatEnvia;
  chatEnvia = async function (t) {
    const a = EN.duoConv;
    a && String(t || "").trim() && a.n++;
    const o = await e.apply(this, arguments);
    try {
      const s = duoS();
      a &&
        a.n >= DUO_CONV_N &&
        !s.conv[a.tema] &&
        ((s.conv[a.tema] = Date.now()),
        enXp(30),
        save(),
        toast("🏆 Prova da unidade concluída! +30 XP", 4500),
        render());
    } catch {}
    return o;
  };
}
{
  const e = chatHtml;
  chatHtml = function () {
    let t = e.apply(this, arguments);
    const a = EN.duoConv;
    if (!a) return t;
    const o = duoUnid().find((n) => n.k === a.tema),
      s = !!duoS().conv[a.tema];
    return t.replace(
      /(<div class="entop">[\s\S]*?<\/div>)/,
      `$1<div class="duoprova">🏆 Prova da unidade${o ? ": " + esc(o.nome) : ""} · ${s ? '<b class="g">concluída</b>' : `responda <b>${Math.min(a.n, DUO_CONV_N)} de ${DUO_CONV_N}</b> vezes em inglês`}</div>`,
    );
  };
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest && e.target.closest("[data-enchx]") && (EN.duoConv = null);
  },
  !0,
);
function duoParesHtml() {
  const e = EN.run,
    t = e.Q[e.i],
    a = e.i / e.Q.length,
    o = duoVidas(),
    s = t.feitos.length === t.ws.length,
    n = t.ws.length - t.feitos.length,
    r = s
      ? "Todos os pares concluídos. Toque em Continuar."
      : t.duoMsg ||
        (t.sel
          ? t.sel[0] === "e"
            ? "Palavra escolhida. Agora toque na tradução à direita."
            : "Tradução escolhida. Agora toque na palavra à esquerda."
          : "Toque em uma palavra à esquerda e depois na tradução à direita."),
    i = (l, d) => {
      const c = t.ws[d],
        p = t.feitos.includes(d),
        u = !!(t.sel && t.sel[0] === l && t.sel[1] === d),
        m = !!(t.erro && t.erro.some((f) => f[0] === l && f[1] === d));
      return `<button type="button" class="duopar${p ? " feito" : ""}${u ? " sel" : ""}${m ? " erro" : ""}" data-duopar="${l}|${d}" aria-pressed="${u}" aria-label="${l === "e" ? "Palavra" : "Tradução"}: ${esc(l === "e" ? c.en : c.pt)}${p ? ", combinação concluída" : ""}" ${p ? " disabled" : ""}>${esc(l === "e" ? c.en : c.pt)}</button>`;
    };
  return `<div class="entop"><button class="btn s" data-enx="1" aria-label="Sair">✕</button><div class="enbar big"><i style="width:${Math.round(a * 100)}%"></i></div>${duoVidasOn() ? `<b class="duovid">❤️ ${o.n}</b>` : ""}<b class="g">${e.xp} XP</b></div>
 <div class="card enl dt402-match"><div class="dt402-match-heading"><span>Combine as palavras</span><strong>${t.feitos.length} de ${t.ws.length} pares</strong></div><p class="dt402-match-status${t.erro ? " erro" : ""}${t.duoLastCorrect ? " acertou" : ""}" role="status" aria-live="polite">${esc(r)}</p><div class="duopares"><div aria-label="Coluna de palavras em inglês">${t.esq.map((l) => i("e", l)).join("")}</div><div aria-label="Coluna de traduções">${t.dir.map((l) => i("p", l)).join("")}</div></div>
 ${s ? `<div class="enfb ${t.erros ? "no" : "ok"}"><b>${t.erros ? "Pares completos, com " + t.erros + " erro" + (t.erros > 1 ? "s" : "") : "Mandou bem! 🎉"}</b></div><button class="btn" data-enn="1" style="width:100%;margin-top:10px;padding:13px">Continuar</button>` : ""}</div>`;
}
function duoPar(e, t) {
  const a = EN.run;
  if (!a) return;
  const o = a.Q[a.i];
  if (!o || o.tp !== "pares" || o.feitos.includes(t)) return;
  if (((o.erro = null), (o.duoLastCorrect = !1), !o.sel || o.sel[0] === e)) {
    ((o.sel = [e, t]),
      (o.duoMsg = ""),
      e === "e" && enFala(o.ws[t].en),
      render());
    return;
  }
  const s = o.sel,
    n = e === "e" ? t : s[1],
    r = e === "p" ? t : s[1];
  if (((o.sel = null), n === r)) {
    (o.feitos.push(n),
      (o.duoLastCorrect = !0),
      (o.duoMsg =
        "Correto! " +
        (o.ws.length - o.feitos.length) +
        " par(es) restante(s)."));
    try {
      navigator.vibrate && navigator.vibrate(12);
    } catch {}
    if (o.feitos.length === o.ws.length) {
      const i = !o.erros;
      ((a.resp = { ok: i, val: "" }),
        a.res.push({ it: o.it, ok: i, tp: "pares" }),
        o.ws.forEach((d, c) => enRegistra(d, !o.errou[c])));
      const l = i ? 10 : 5;
      ((a.xp += l), enXp(l), save());
    }
  } else
    (o.erros++,
      (o.errou[n] = 1),
      (o.erro = [
        ["e", n],
        ["p", r],
      ]),
      (o.duoMsg = "Ainda não corresponde. Tente novamente."),
      duoPerdeVida(),
      duoVidasOn() && duoVidas().n <= 0 && ((EN.semVida = 1), (EN.run = null)));
  render();
}
(document.addEventListener("click", (e) => {
  const t = (o) => e.target.closest && e.target.closest(o);
  let a;
  if ((a = t("[data-duopar]"))) {
    const [o, s] = a.dataset.duopar.split("|");
    duoPar(o, +s);
    return;
  }
  if ((a = t("[data-duol]"))) {
    const [o, s] = a.dataset.duol.split("|");
    duoInicia(o, s);
    return;
  }
  if ((a = t("[data-duoconv]"))) {
    duoConv(a.dataset.duoconv);
    return;
  }
  if ((a = t("[data-duolock]"))) {
    toast("Termine a lição anterior para abrir esta.");
    return;
  }
  if (t("[data-duonext]")) {
    const o = duoAtual();
    if (((EN.run = null), !o)) {
      render();
      return;
    }
    o.conv ? duoConv(o.u.k) : duoInicia(o.u.k, o.l.j);
    return;
  }
  if ((a = t("[data-duoaba]"))) {
    DUO.aba = a.dataset.duoaba;
    try {
      APP_STORAGE.setItem("diario-duo-aba", DUO.aba);
    } catch {}
    (render(), scrollTo(0, 0));
    return;
  }
  if (t("[data-duorev]")) {
    ((EN.semVida = 0), duoPratica());
    return;
  }
  if (t("[data-duosv]")) {
    ((EN.semVida = 0), (EN.run = null), render());
    return;
  }
  if ((a = t("[data-duometa]"))) {
    ((enS().cfg.meta = +a.dataset.duometa), save(), render());
    return;
  }
}),
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest && e.target.closest(".duoun-h [data-ouv]")) {
        DUO.aba = "pratica";
        try {
          APP_STORAGE.setItem("diario-duo-aba", "pratica");
        } catch {}
      }
    },
    !0,
  ),
  document.addEventListener("change", (e) => {
    const t = e.target.closest && e.target.closest("[data-duovidas]");
    t && ((enS().cfg.vidas = t.checked ? 1 : 0), save(), render());
  }));
function duoPratica() {
  if (enDevidas().length) {
    ((EN.duoRev = 1), enInicia("rev"));
    return;
  }
  const e = enS().r,
    t = enTodos().filter((a) => e[a.id]);
  if (!t.length) {
    ((EN.run = null), render(), toast("Ainda não há palavras para praticar."));
    return;
  }
  ((EN.run = {
    modo: "rev",
    Q: enEmb(t)
      .slice(0, 8)
      .map((a) =>
        enPergunta(a, enEmb(["mc_pt", "ouvir", "lacuna", "mc_en"])[0]),
      ),
    i: 0,
    res: [],
    xp: 0,
    sel: [],
    resp: null,
    fim: 0,
    ini: Date.now(),
  }),
    (EN.duoRev = 1),
    (ESV = "ing"),
    irPara("estudos"),
    scrollTo(0, 0),
    enAutoFala());
}
{
  const e = enResponde;
  enResponde = function (t) {
    const a = EN.run,
      o = e.apply(this, arguments);
    try {
      a &&
        a.resp &&
        !a.resp.ok &&
        a.duoJ != null &&
        (duoPerdeVida(),
        duoVidasOn() && duoVidas().n <= 0 && (EN.semVida = 1),
        render());
    } catch {}
    return o;
  };
}
{
  const e = enProxima;
  enProxima = function () {
    const t = EN.run;
    if (EN.semVida && t && t.duoJ != null && !t.fim) {
      ((EN.run = null), render(), scrollTo(0, 0));
      return;
    }
    const a = e.apply(this, arguments);
    try {
      if (t && t.fim && !t._duoFim) {
        if (((t._duoFim = 1), t.duoJ != null)) {
          const o = duoS(),
            s = t.tema + ":" + t.duoJ;
          ((o.lic[s] = (o.lic[s] || 0) + 1), save());
        }
        t.modo === "rev" &&
          EN.duoRev &&
          ((EN.duoRev = 0),
          duoGanhaVida(1),
          toast("❤️ +1 vida pela revisão", 3e3));
        try {
          enMin(t);
        } catch {}
        render();
      }
    } catch {}
    return a;
  };
}
{
  const e = enFimHtml;
  enFimHtml = function () {
    let t = e.apply(this, arguments);
    const a = EN.run;
    try {
      const o = enSeq(),
        s = enS(),
        n = s.xp[enHoje()] || 0,
        r = +s.cfg.meta || 100,
        i = `<div class="duofim"><div class="duofogo">🔥 ${o}</div><div class="sm">${o === 1 ? "dia de ofensiva" : "dias de ofensiva"}</div><div class="sm" style="margin-top:4px">Meta de hoje: <b>${Math.min(n, r)}/${r} XP</b>${n >= r ? " ✅" : ""}</div></div>`;
      ((t = t.replace(
        '<div class="card enfim">',
        '<div class="card enfim">' + i,
      )),
        a &&
          a.duoJ != null &&
          (t = t.replace(
            /<button class="btn" data-enl="[^"]*"[^>]*>Outra li\xe7\xe3o<\/button>/,
            '<button class="btn" data-duonext="1" style="width:100%;margin-top:12px;padding:14px">Continuar a trilha</button>',
          )));
    } catch {}
    return t;
  };
}
function duoSemVidaHtml() {
  return `<div class="card enfim"><div style="font-size:48px">💔</div><b style="font-size:20px">Você ficou sem vidas</b><p class="sm" style="margin:8px 0 14px">Faça uma revisão rápida para ganhar uma vida, ou espere: volta 1 vida a cada 3 horas${duoProxVida() ? " (próxima às " + duoProxVida() + ")" : ""}.</p>
<button class="btn" data-duorev="1" style="width:100%;padding:13px">🔁 Revisar e ganhar 1 vida</button><button class="btn s" data-duosv="1" style="width:100%;margin-top:8px">Voltar para a trilha</button>
<div class="sm mut" style="margin-top:10px">Não quer vidas? Desligue em Praticar → Ajustes da trilha.</div></div>`;
}
const DUO_IC = {
    star: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>',
    chk: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    trof: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="currentColor"><path d="M7 3h10v3h3v2a5 5 0 0 1-5 5 5 5 0 0 1-2 2.6V18h3v3H8v-3h3v-2.4A5 5 0 0 1 9 13a5 5 0 0 1-5-5V6h3zm-1 5a3 3 0 0 0 1 2.2V8zm12 0v2.2A3 3 0 0 0 19 8z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10zm2.5 0h5V7a2.5 2.5 0 0 0-5 0z"/></svg>',
  },
  DUO_ZZ = [0, 46, 72, 46, 0, -46, -72, -46];
function duoSemana() {
  const e = enS().xp,
    t = enHoje(),
    a = [];
  for (let o = 6; o >= 0; o--) {
    const s = diasMais(t, -o),
      n = new Date(s + "T12:00").getDay();
    a.push({ d: s, l: "DSTQQSS"[n], ok: (e[s] || 0) >= 10, hj: o === 0 });
  }
  return a;
}
function duoHome() {
  const e = enS(),
    t = duoUnid(),
    a = duoAtual(t),
    o = enHoje(),
    s = e.xp[o] || 0,
    n = +e.cfg.meta || 100,
    r = enSeq(),
    i = duoVidas(),
    l = enNivel(),
    d = enDevidas().length,
    c = Math.min(1, s / n);
  let p = 0;
  const u = (f, x, v, g) =>
      `<div class="duono-w" style="transform:translateX(${DUO_ZZ[p++ % DUO_ZZ.length]}px)">${f === "atual" ? `<div class="duobal">${esc(g)}</div>` : ""}<button class="duono ${f}" ${x} aria-label="${esc(g)}">${v}</button></div>`,
    m = t
      .map((f) => {
        const x = f.lic.filter((v) => v.feita).length;
        return `<div class="duoun${f.aberta ? "" : " fech"}"><div class="duoun-h"><div><small>UNIDADE ${f.u + 1}</small><b>${esc(f.nome)}</b><span>${x} de ${f.lic.length} lições${f.conv.feita ? " · prova feita" : ""}</span></div><span class="duoun-bt">${window.EN_DATA && EN_DATA.dica && EN_DATA.dica[f.k] ? `<button class="btn s enouvt" data-endicav="${f.k}" aria-label="Dica do tema">💡</button>` : ""}<button class="btn s enouvt" data-ouv="${f.k}" aria-label="Ouvir este tema"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg></button></span><span class="duoun-ic">${f.ok ? DUO_IC.trof : f.todas ? DUO_IC.chk : DUO_IC.star}</span></div>
<div class="duopath">${f.lic
          .map((v) => {
            const g = a && a.l && a.u.k === f.k && a.l.j === v.j;
            return u(
              g
                ? "atual"
                : v.feita
                  ? "feito"
                  : v.aberta
                    ? "aberto"
                    : "trancado",
              v.aberta || v.feita
                ? `data-duol="${f.k}|${v.j}"`
                : 'data-duolock="1"',
              v.feita && !g
                ? DUO_IC.chk
                : v.aberta || g
                  ? DUO_IC.star
                  : DUO_IC.lock,
              g ? "Começar" : "Lição " + (v.j + 1),
            );
          })
          .join("")}
${u(a && a.conv && a.u.k === f.k ? "atual trof" : f.conv.feita ? "feito trof" : f.conv.aberta ? "aberto trof" : "trancado trof", f.conv.aberta ? `data-duoconv="${f.k}"` : 'data-duolock="1"', f.conv.aberta || f.conv.feita ? DUO_IC.trof : DUO_IC.lock, a && a.conv && a.u.k === f.k ? "Prova de conversa" : "Prova da unidade")}</div></div>`;
      })
      .join("");
  return `<div class="duotop"><span title="Ofensiva">🔥 <b>${r}</b></span><span title="XP de hoje">⚡ <b>${s}</b></span>${duoVidasOn() ? `<span title="Vidas">❤️ <b>${i.n}</b></span>` : ""}<span title="Nível">⭐ <b>${l.n}</b></span></div>
<div class="card duometa"><div class="duometa-t"><b>Meta de hoje</b><span>${Math.min(s, n)}/${n} XP · ${Math.round(n / 10)} min</span></div><div class="enbar"><i style="width:${Math.round(c * 100)}%"></i></div>
<div class="duosem">${duoSemana()
    .map(
      (f) =>
        `<span class="${f.ok ? "ok" : ""}${f.hj ? " hj" : ""}"><small>${f.l}</small><b>${f.ok ? "🔥" : "·"}</b></span>`,
    )
    .join("")}</div>
${duoVidasOn() && i.n < DUO_VMAX ? `<div class="sm mut" style="margin-top:6px">❤️ ${i.n} de ${DUO_VMAX} vidas · próxima às ${duoProxVida()}</div>` : ""}</div>
<div class="duoatalhos">${d ? `<button class="btn s" data-enrev="1">🔁 Revisar ${d}</button>` : ""}<button class="btn s" data-ennews="1">📰 Notícia de hoje</button></div>
${m}`;
}
function duoSeg() {
  return `<div class="seg duoseg"><button class="${DUO.aba === "trilha" ? "on" : ""}" data-duoaba="trilha">🛤️ Trilha</button><button class="${DUO.aba === "pratica" ? "on" : ""}" data-duoaba="pratica">🏋️ Praticar</button></div>`;
}
function duoAjustes() {
  const e = enS(),
    t = +e.cfg.meta || 100;
  return `<h2>Ajustes da trilha</h2><div class="card"><div class="sm" style="margin-bottom:6px">Meta diária</div><div class="seg">${[
    [50, "5 min"],
    [100, "10 min"],
    [150, "15 min"],
  ]
    .map(
      ([a, o]) =>
        `<button class="${t === a ? "on" : ""}" data-duometa="${a}">${o}</button>`,
    )
    .join("")}</div>
<label class="ck" style="margin-top:10px"><input type="checkbox" data-duovidas="1"${duoVidasOn() ? " checked" : ""}><span>Vidas: perder 1 a cada erro nas lições (volta 1 a cada 3 horas ou com uma revisão)</span></label>
<div class="sm mut" style="margin-top:6px">Cada lição tem cerca de 12 exercícios (uns 4 minutos). A meta conta XP: 10 por acerto e bônus no fim da lição.</div></div>`;
}
{
  const e = enView;
  enView = function () {
    if (!EN.ok) return e.apply(this, arguments);
    if ((duoS(), EN.semVida && !EN.run && !EN.chat))
      return `<h1>Inglês</h1>${duoSemVidaHtml()}`;
    const t = EN.run;
    if (t && !t.fim && t.Q && t.Q[t.i] && t.Q[t.i].tp === "pares" && !EN.chat)
      return `<h1>Inglês</h1>${duoParesHtml()}`;
    if (t || EN.chat || EN.dica || EN.dit) return e.apply(this, arguments);
    if (DUO.aba === "pratica") {
      let o = e.apply(this, arguments);
      return (
        (o = o
          .replace(/<h2>Trilha<\/h2>[\s\S]*?(?=<h2>)/, "")
          .replace(
            /<div class="sm" style="margin-bottom:6px">Meta di\xe1ria<\/div><div class="seg">[\s\S]*?<\/div>/,
            "",
          )
          .replace(/<h2>Ajustes<\/h2>/, duoAjustes() + "<h2>Mais ajustes</h2>")
          .replace(
            /(<h1>Estudos<\/h1>[\s\S]*?<div class="seg"[\s\S]*?<\/div>)/,
            "$1" + duoSeg(),
          )),
        o
      );
    }
    const a = e
      .apply(this, arguments)
      .match(/^[\s\S]*?<h1>Estudos<\/h1>\s*(<div class="seg"[\s\S]*?<\/div>)/);
    return `<h1>Estudos</h1>${a ? a[1] : ""}${duoSeg()}${duoHome()}`;
  };
}
{
  const e = enLicaoHtml;
  enLicaoHtml = function () {
    const t = e.apply(this, arguments),
      a = EN.run;
    return !a || a.duoJ == null || !duoVidasOn()
      ? t
      : t.replace(
          /(<b class="g">\d+ XP<\/b>)/,
          `<b class="duovid">❤️ ${duoVidas().n}</b>$1`,
        );
  };
}
{
  const e = TraderStyles.slot("legacy-098");
  ((e.id = "duo174"),
    (e.textContent = TraderStyles.css("legacy-098")),
    TraderStyles.mount(e));
}
jrAgoraK = function () {
  const e = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
    ),
    t = e.getHours() * 60 + e.getMinutes(),
    a = e.getDay(),
    o = loc().slice(0, 10);
  if (t < 360) {
    const s = diasMais(o, -1),
      n = (a + 6) % 7;
    return s + (n === 0 || n === 6 ? "fds" : "tarde");
  }
  return (
    o +
    (a === 0 || a === 6
      ? "fds"
      : t < 720
        ? "manha"
        : t < 1050
          ? "meio"
          : "tarde")
  );
};
const JR_EDN = {
  manha: "Edição da manhã",
  meio: "Edição da tarde",
  tarde: "Edição da noite",
  fds: "Edição de fim de semana",
};
function jrNomeFix() {
  [JRN.v, JRN.arq].forEach((e) => {
    try {
      e &&
        e.edicao &&
        JR_EDN[e.edicao] &&
        e.nome !== JR_EDN[e.edicao] &&
        (e.nome = JR_EDN[e.edicao]);
    } catch {}
  });
}
{
  const e = render0;
  render0 = function () {
    return (jrNomeFix(), e.apply(this, arguments));
  };
}
{
  const e = jrPdf;
  jrPdf = function () {
    return (jrNomeFix(), e.apply(this, arguments));
  };
}
{
  const e = jvPdfBytes;
  jvPdfBytes = function (t) {
    jrNomeFix();
    try {
      t && t.edicao && JR_EDN[t.edicao] && (t.nome = JR_EDN[t.edicao]);
    } catch {}
    return e.apply(this, arguments);
  };
}
const EST = { v: "hoje", f: {} };
try {
  const e = APP_STORAGE.getItem("diario-est-v");
  e && (EST.v = e);
} catch {}
const estReg = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).estReg ?? (e.estReg = []);
  },
  estRev = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).estRev ?? (e.estRev = []);
  },
  estCiclo = () => {
    var e;
    return (e = S.ax ?? (S.ax = {})).estCiclo ?? (e.estCiclo = {});
  },
  EST_TIPOS = [
    ["teoria", "Teoria"],
    ["aula", "Aula"],
    ["leitura", "Leitura"],
    ["questoes", "Questões"],
    ["revisao", "Revisão"],
  ],
  EST_REV = [1, 7, 30];
function estMats() {
  const e = [];
  try {
    plL().forEach((t) =>
      (t.materias || []).forEach((a) =>
        e.push({
          k: "pl:" + a.id,
          n: a.nome,
          P: t,
          m: a,
          foco: t.tipo === "cnpi" ? "cnpi" : "fac",
        }),
      ),
    );
  } catch {}
  return (
    [
      ["cnpi", "CNPI-T", "cnpi"],
      ["ing", "Inglês", "ing"],
      ["liv", "Livros", "liv"],
      ["trade", "Revisar trades", "trade"],
    ].forEach(([t, a, o]) => {
      e.some((s) => s.n === a) || e.push({ k: t, n: a, foco: o });
    }),
    ((S.ax || {}).estMatX || []).forEach((t) => {
      e.some((a) => a.n === t) || e.push({ k: "x:" + t, n: t, foco: "out" });
    }),
    e
  );
}
const estMat = (e) => estMats().find((t) => t.k === e),
  estTops = (e) => {
    const t = estMat(e);
    return t && t.m
      ? (t.m.top || []).map((a) => a.t)
      : [
          ...new Set(
            estReg()
              .filter((a) => a.mat === e && a.top)
              .map((a) => a.top),
          ),
        ];
  },
  estMin = (e, t) => focoLog().filter((a) => a.d >= e && a.d <= t),
  estNome = (e) =>
    e.n || (FOCO_MAT.find((t) => t[0] === e.mat) || [])[1] || e.mat || "Outro",
  estHm = (e) => (
    (e = Math.round(e || 0)),
    e >= 60
      ? Math.floor(e / 60) +
        "h" +
        (e % 60 ? String(e % 60).padStart(2, "0") : "")
      : e + " min"
  ),
  estPc = (e, t) => (t ? Math.round((e / t) * 100) : null);
function estSalva() {
  const field = (id) => document.getElementById(id);
  const mat = field("estmat")?.value,
    subject = estMat(mat);
  if (!subject) {
    toast("Escolha a matéria.");
    return;
  }
  const date = field("estd")?.value || enHoje();
  if (!EstudosModelo.realizada(date, enHoje())) {
    toast(
      "Informe uma data válida até hoje. Use o Ciclo para planejar estudos futuros.",
    );
    return;
  }
  const number = (id) => {
    const raw = String(field(id)?.value || "0").replace(",", ".");
    const value = Number(raw);
    return Number.isFinite(value) && Number.isInteger(value) && value >= 0
      ? value
      : null;
  };
  let min = number("estmin");
  const q = number("estq"),
    ok = number("estok"),
    pag = number("estpag");
  if (
    [min, q, ok, pag].some((value) => value === null) ||
    min > 1440 ||
    q > 10000 ||
    pag > 10000
  ) {
    toast(
      "Informe quantidades inteiras e válidas. O tempo deve ser de até 1440 minutos.",
    );
    return;
  }
  if (ok > q) {
    toast("Acertos não podem superar o total de questões.");
    return;
  }
  const origin = field("esttempo")?.value || "manual";
  let session = null;
  if (origin !== "manual") {
    const match = estSessoesDisponiveis(date, mat).find(
      (item) => String(item.index) === origin,
    );
    if (!match) {
      toast(
        "Esta sessão já foi vinculada ou não corresponde à matéria e à data. Selecione novamente.",
      );
      return;
    }
    session = match.entry;
    if (min && min !== session.min) {
      toast(
        `Esta sessão já tem ${session.min} minutos. Use esse tempo ou selecione uma nova sessão.`,
      );
      return;
    }
    min = session.min;
  }
  if (!min && !q && !pag) {
    toast("Informe o tempo, as questões ou as páginas.");
    return;
  }
  const top = String(field("esttop")?.value || "")
    .trim()
    .slice(0, 90);
  const tipo = field("esttipo")?.value || "teoria";
  const record = {
    id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    d: date,
    mat,
    n: subject.n,
    top,
    tipo,
    min,
    q,
    ok,
    pag,
    nota: String(field("estnota")?.value || "")
      .trim()
      .slice(0, 400),
    em: Date.now(),
  };
  estReg().push(record);
  if (session) {
    session.reg = record.id;
    session.n = subject.n;
  } else if (min)
    focoLog().push({
      d: date,
      min,
      mat: subject.foco || "out",
      n: subject.n,
      reg: record.id,
    });
  if (top && ["teoria", "aula", "leitura"].includes(tipo)) {
    const revisions = estRev();
    if (
      !revisions.some(
        (item) => !item.feita && item.mat === mat && item.top === top,
      )
    )
      EST_REV.forEach((days, index) =>
        revisions.push({
          id: record.id + "v" + index,
          mat,
          n: subject.n,
          top,
          d: diasMais(date, days),
          n2: index + 1,
          feita: 0,
        }),
      );
    const topic = (subject.m?.top || []).find((item) => item.t === top);
    if (topic && !topic.feito) topic.feito = Date.now();
  }
  if (tipo === "revisao" && top) {
    const revision = estRev()
      .filter(
        (item) =>
          !item.feita &&
          item.mat === mat &&
          item.top === top &&
          item.d <= diasMais(enHoje(), 3),
      )
      .sort((a, b) => a.d.localeCompare(b.d))[0];
    if (revision) revision.feita = Date.now();
  }
  EST.f = { mat, tipo };
  save();
  toast(
    session
      ? "Estudo vinculado. O tempo já estava contabilizado."
      : "Estudo registrado.",
    4000,
  );
  EST.v = "hoje";
  render();
  scrollTo(0, 0);
}
function estSeq() {
  const t = new Set(
    focoLog()
      .filter((o) => o.min > 0 && EstudosModelo.realizada(o.d, enHoje()))
      .map((o) => o.d),
  );
  try {
    Object.entries(enS().min || {}).forEach(([o, s]) => {
      s > 0 && EstudosModelo.realizada(o, enHoje()) && t.add(o);
    });
  } catch {}
  let e = enHoje(),
    a = 0;
  for (t.has(e) || (e = diasMais(e, -1)); t.has(e); )
    (a++, (e = diasMais(e, -1)));
  return { n: a, dias: t };
}
function estDesemp(t) {
  const e = diasMais(enHoje(), -(t - 1)),
    a = estReg().filter((i) => i.d >= e && i.d <= enHoje()),
    o = {},
    s = {};
  estMin(e, enHoje()).forEach((i) => {
    const l = estNome(i);
    o[l] = (o[l] || 0) + i.min;
  });
  try {
    const i = enS().min || {};
    Object.entries(i).forEach(([l, d]) => {
      l >= e && l <= enHoje() && (o.Inglês = (o.Inglês || 0) + d);
    });
  } catch {}
  a.filter((i) => i.q).forEach((i) => {
    const l = i.n;
    (((s[l] ?? (s[l] = { q: 0, ok: 0 })).q += i.q), (s[l].ok += i.ok));
  });
  const r = a.reduce((i, l) => i + (l.pag || 0), 0),
    n = a.filter((i) => i.tipo === "aula").length;
  return {
    T: o,
    Q: s,
    pag: r,
    aulas: n,
    min: Object.values(o).reduce((i, l) => i + l, 0),
  };
}
function estMapa() {
  const t = {};
  estReg()
    .filter((a) => a.q && a.top && EstudosModelo.realizada(a.d, enHoje()))
    .forEach((a) => {
      const o = a.n + "|" + a.top;
      (((t[o] ?? (t[o] = { n: a.n, top: a.top, q: 0, ok: 0 })).q += a.q),
        (t[o].ok += a.ok));
    });
  const e = Object.values(t)
    .filter((a) => a.q >= 5)
    .map((a) => ({ ...a, pc: a.ok / a.q }));
  return {
    dif: e
      .filter((a) => a.pc < 0.7)
      .sort((a, o) => a.pc - o.pc)
      .slice(0, 8),
    fac: e
      .filter((a) => a.pc >= 0.85)
      .sort((a, o) => o.pc - a.pc)
      .slice(0, 6),
  };
}
function estConq() {
  const t = estReg().filter((record) =>
      EstudosModelo.realizada(record.d, enHoje()),
    ),
    e = focoLog().filter((record) =>
      EstudosModelo.realizada(record.d, enHoje()),
    ),
    a = e.reduce((i, l) => i + (l.min || 0), 0),
    o = t.reduce((i, l) => i + (l.q || 0), 0),
    s = estRev().filter((i) => i.feita).length,
    r = estSeq().n;
  let n = 0;
  try {
    n = cnStats().n || 0;
  } catch {}
  return [
    [
      "\ud83c\udf31",
      "Primeiro passo",
      "Registrou o primeiro estudo",
      t.length + e.length >= 1,
    ],
    ["\ud83d\udd25", "Uma semana firme", "7 dias seguidos estudando", r >= 7],
    ["\ud83c\udfc5", "M\xeas de disciplina", "30 dias seguidos", r >= 30],
    ["\u23f1\ufe0f", "10 horas", "10 horas de estudo registradas", a >= 600],
    ["\ud83d\udcda", "50 horas", "50 horas de estudo", a >= 3e3],
    ["\ud83c\udf93", "100 horas", "100 horas de estudo", a >= 6e3],
    [
      "\u270f\ufe0f",
      "Cem quest\xf5es",
      "100 quest\xf5es registradas",
      o + n >= 100,
    ],
    ["\ud83c\udfaf", "Mil quest\xf5es", "1.000 quest\xf5es", o + n >= 1e3],
    ["\ud83d\udd01", "Revis\xe3o em dia", "20 revis\xf5es feitas", s >= 20],
    [
      "\ud83e\udde0",
      "Mem\xf3ria de elefante",
      "100 revis\xf5es feitas",
      s >= 100,
    ],
  ];
}
function estChips() {
  return `<div class="chips2 estchips">${[
    ["hoje", "Hoje"],
    ["reg", "+ Registrar"],
    ["edital", "Edital"],
    ["desemp", "Desempenho"],
    ["ciclo", "Ciclo"],
    ["conq", "Conquistas"],
  ]
    .map(
      ([e, t]) =>
        `<button class="${EST.v === e ? "on" : ""}" data-estv="${e}">${t}</button>`,
    )
    .join("")}</div>`;
}
function estRevHoje() {
  const e = enHoje();
  return estRev()
    .filter((t) => !t.feita && t.d <= e)
    .sort((t, a) => t.d.localeCompare(a.d));
}
function estCicloCalc() {
  const t = estCiclo(),
    e = segundaDe(enHoje()),
    a = estMin(e, enHoje()),
    o = estMats(),
    s = Object.entries(t)
      .filter(([, n]) => +n > 0)
      .map(([n, i]) => {
        const l = o.find((c) => c.k === n);
        if (!l) return null;
        const d =
          a
            .filter(
              (c) =>
                c.n === l.n ||
                (!c.n &&
                  (FOCO_MAT.find((u) => u[0] === c.mat) || [])[1] === l.n),
            )
            .reduce((c, u) => c + u.min, 0) +
          (l.k === "ing"
            ? (() => {
                try {
                  const c = enS().min || {};
                  return Object.entries(c)
                    .filter(([u]) => u >= e && u <= enHoje())
                    .reduce((u, [, p]) => u + p, 0);
                } catch {
                  return 0;
                }
              })()
            : 0);
        return {
          k: n,
          n: l.n,
          alvo: +i * 60,
          feito: d,
          falta: Math.max(0, +i * 60 - d),
        };
      })
      .filter(Boolean),
    r =
      s
        .filter((n) => n.falta > 0)
        .sort((n, i) => i.falta / i.alvo - n.falta / n.alvo)[0] || null;
  return { L: s, prox: r };
}
function estHoje() {
  const t = estRevHoje(),
    e = estCicloCalc(),
    a = estSeq(),
    o = semEstudo(),
    s = estMeta().min,
    r = enHoje(),
    n = estReg().filter((i) => i.d === r);
  return `<div class="kv"><div class="card" style="margin:0;padding:10px"><span class="sm mut">Sequ\xeancia</span><div><b style="font-size:18px">\ud83d\udd25 ${a.n} dia${a.n === 1 ? "" : "s"}</b></div></div>\n<div class="card" style="margin:0;padding:10px"><span class="sm mut">Semana</span><div><b style="font-size:18px">${estHm(o.tot)}</b></div><div class="sm mut">${estMeta().definida ? "meta" : "meta sugerida"} ${estHm(s)}</div></div>\n<div class="card" style="margin:0;padding:10px"><span class="sm mut">Revis\xf5es hoje</span><div><b style="font-size:18px" class="${t.length ? "am" : "g"}">${t.length}</b></div></div></div>\n${e.prox ? `<div class="card estprox"><span class="sm mut">Pr\xf3xima no seu ciclo</span><b>${esc(e.prox.n)}</b><span class="sm">faltam ${estHm(e.prox.falta)} nesta semana</span><button class="btn" data-estfoco="${esc(e.prox.k)}">\u23f1\ufe0f Come\xe7ar 25 min</button></div>` : '<div class="card sm mut">Monte o seu <button class="lnk" data-estv="ciclo">ciclo de estudos</button>: horas por semana para cada mat\xe9ria. O app diz qual estudar agora.</div>'}\n<h2>Revis\xf5es de hoje</h2>${t.length ? `<div class="card">${t.map((i) => `<div class="estrv"><div><b>${esc(i.top)}</b><div class="sm mut">${esc(i.n)} \xb7 ${i.n2}\xaa revis\xe3o (${EST_REV[i.n2 - 1]} dia${EST_REV[i.n2 - 1] > 1 ? "s" : ""})${i.d < r ? ' \xb7 <span class="r">atrasada</span>' : ""}</div></div><div class="estrv-b"><button class="btn s" data-estrevok="${i.id}">\u2713 Revisei</button><button class="btn s" data-estrevad="${i.id}">Amanh\xe3</button></div></div>`).join("")}</div>` : '<div class="card sm mut">Nenhuma revis\xe3o para hoje. Cada teoria, aula ou leitura registrada com o t\xf3pico ganha revis\xf5es em 1, 7 e 30 dias, como nas plataformas de concurso.</div>'}\n<h2>Hoje</h2>${n.length ? `<div class="card">${n.map((i) => `<div class="estrg"><b>${esc(i.n)}</b>${i.top ? " \xb7 " + esc(i.top) : ""}<div class="sm mut">${esc((EST_TIPOS.find((l) => l[0] === i.tipo) || [])[1] || "")}${i.min ? " \xb7 " + estHm(i.min) : ""}${i.q ? ` \xb7 ${i.ok}/${i.q} quest\xf5es (${estPc(i.ok, i.q)}%)` : ""}${i.pag ? " \xb7 " + i.pag + " p\xe1ginas" : ""}</div>${i.nota ? `<div class="sm">\ud83d\udcdd ${esc(i.nota)}</div>` : ""}</div>`).join("")}</div>` : ""}\n<button class="btn" data-estv="reg" style="width:100%;margin-top:8px;padding:13px">+ Registrar estudo</button>`;
}
function estRegHtml() {
  const subjects = estMats(),
    form = EST.f || {};
  const mat = form.mat && estMat(form.mat) ? form.mat : (subjects[0] || {}).k;
  const sessions = estSessoesDisponiveis(enHoje(), mat);
  return `<div class="card"><b>Registrar estudo</b>
<label>Matéria<select id="estmat" data-estmat="1">${subjects.map((subject) => `<option value="${esc(subject.k)}"${subject.k === mat ? " selected" : ""}>${esc(subject.n)}</option>`).join("")}</select></label>
<label>Tópico<input id="esttop" list="esttopl" placeholder="Ex.: Oferta e demanda" autocomplete="off"><datalist id="esttopl">${estTops(
    mat,
  )
    .map((topic) => `<option value="${esc(topic)}">`)
    .join("")}</datalist></label>
<label>O que fez<select id="esttipo">${EST_TIPOS.map(([value, label]) => `<option value="${value}"${(form.tipo || "teoria") === value ? " selected" : ""}>${label}</option>`).join("")}</select></label>
<label>Contagem do tempo<select id="esttempo"><option value="manual">Nova sessão: adicionar minutos</option>${sessions.map(({ entry, index }) => `<option value="${index}">Já contado: ${entry.min} min · ${esc(estNome(entry))}</option>`).join("")}</select></label>
<p class="sm mut">Se você já usou o Foco nesta sessão, escolha o tempo já contado. As notas e revisões serão salvas sem somar os minutos novamente.</p>
<div class="g2"><label>Tempo (min)<input id="estmin" type="number" step="1" inputmode="numeric" min="0" placeholder="50"></label><label>Data<input id="estd" type="date" max="${enHoje()}" value="${enHoje()}"></label></div>
<div class="g3"><label>Questões<input id="estq" type="number" inputmode="numeric" min="0" placeholder="0"></label><label>Acertos<input id="estok" type="number" inputmode="numeric" min="0" placeholder="0"></label><label>Páginas<input id="estpag" type="number" inputmode="numeric" min="0" placeholder="0"></label></div>
<label>Anotação<textarea id="estnota" rows="2" placeholder="O que ficou de mais importante (opcional)"></textarea></label>
<button class="btn" data-estsalva="1" style="width:100%;margin-top:6px;padding:13px">Salvar estudo</button>
<div class="sm mut" style="margin-top:6px">Teoria, aula ou leitura com tópico ganham revisões em 1, 7 e 30 dias.</div></div>
<details class="card"><summary>Adicionar outra matéria</summary><div class="estadd"><input id="estmatx" placeholder="Ex.: Inglês para entrevista"><button class="btn s" data-estmatx="1">Adicionar</button></div><div class="sm mut">As matérias dos seus Planos de estudo já aparecem na lista.</div></details>`;
}
function estEditalHtml() {
  const e = (() => {
      try {
        return plL();
      } catch {
        return [];
      }
    })(),
    t = estReg(),
    a = estRev();
  return e.some((o) => (o.materias || []).length)
    ? e
        .map((o) =>
          (o.materias || [])
            .map((s) => {
              const n = "pl:" + s.id,
                r = s.top || [],
                i = r.filter((d) => d.feito).length,
                l = r.length ? i / r.length : 0;
              return `<details class="card estedt"${l < 1 ? " open" : ""}><summary><div><b>${esc(s.nome)}</b><div class="sm mut">${esc(o.nome || "")} · ${i} de ${r.length} tópicos</div></div><b class="${l >= 1 ? "g" : ""}">${Math.round(l * 100)}%</b></summary><div class="enbar"><i style="width:${Math.round(l * 100)}%"></i></div>
<table class="estedtt"><tr><th>Tópico</th><th>Teoria</th><th>Rev.</th><th>Questões</th></tr>${r
                .map((d) => {
                  const c = t.filter((x) => x.mat === n && x.top === d.t),
                    p = c.reduce((x, v) => x + (v.q || 0), 0),
                    u = c.reduce((x, v) => x + (v.ok || 0), 0),
                    m = a.filter(
                      (x) => x.mat === n && x.top === d.t && x.feita,
                    ).length,
                    f = estPc(u, p);
                  return `<tr><td>${esc(d.t)}</td><td>${d.feito ? '<b class="g">✓</b>' : '<span class="mut">–</span>'}</td><td>${m ? m + "/3" : '<span class="mut">0</span>'}</td><td>${p ? `<b class="${f >= 80 ? "g" : f < 60 ? "r" : "am"}">${u}/${p}</b>` : '<span class="mut">–</span>'}</td></tr>`;
                })
                .join("")}</table></details>`;
            })
            .join(""),
        )
        .join("")
    : '<div class="card sm mut">O edital verticalizado usa as matérias e tópicos dos seus <button class="lnk" data-ep="esv" data-id="pl">Planos de estudo</button>. Crie um plano (faculdade ou CNPI-T) e os tópicos aparecem aqui, um por linha, com teoria, revisões e questões.</div>';
}
function estDesempHtml() {
  const e = estDesemp(7),
    t = estDesemp(30),
    a = estSeq(),
    o = enHoje(),
    s = estMapa();
  let n = null;
  try {
    n = cnStats();
  } catch {}
  const r = diasMais(segundaDe(o), -77),
    i = [];
  for (let u = r; u <= o; u = diasMais(u, 1)) i.push(u);
  const l = {};
  focoLog().forEach((u) => {
    l[u.d] = (l[u.d] || 0) + u.min;
  });
  try {
    Object.entries(enS().min || {}).forEach(([u, m]) => {
      l[u] = (l[u] || 0) + m;
    });
  } catch {}
  const d = (u) => (u ? (u < 30 ? 1 : u < 60 ? 2 : u < 120 ? 3 : 4) : 0),
    c = Math.max(1, ...Object.values(t.T)),
    p = Object.entries(t.Q).map(([u, m]) => [u, m.q, m.ok]);
  return (
    n && n.n && p.push(["CNPI-T (treino do app)", n.n, n.ok]),
    `<div class="kv"><div class="card" style="margin:0;padding:10px"><span class="sm mut">Últimos 7 dias</span><div><b style="font-size:18px">${estHm(e.min)}</b></div></div><div class="card" style="margin:0;padding:10px"><span class="sm mut">Últimos 30 dias</span><div><b style="font-size:18px">${estHm(t.min)}</b></div><div class="sm mut">${t.pag} páginas · ${t.aulas} aulas</div></div><div class="card" style="margin:0;padding:10px"><span class="sm mut">Sequência</span><div><b style="font-size:18px">🔥 ${a.n}</b></div></div></div>
<h2>Constância</h2><div class="card"><div class="estheat">${i.map((u) => `<i class="h${d(l[u])}${u === o ? " hj" : ""}" title="${u}: ${estHm(l[u] || 0)}"></i>`).join("")}</div><div class="sm mut" style="margin-top:6px">Últimas 12 semanas. Quanto mais escuro, mais tempo de estudo no dia.</div></div>
<h2>Tempo por matéria (30 dias)</h2><div class="card">${
      Object.keys(t.T).length
        ? Object.entries(t.T)
            .sort((u, m) => m[1] - u[1])
            .map(
              ([u, m]) =>
                `<div class="estbar"><span>${esc(u)}</span><div><i style="width:${Math.round((m / c) * 100)}%"></i></div><b>${estHm(m)}</b></div>`,
            )
            .join("")
        : '<span class="sm mut">Use o Foco ou registre estudos para ver aqui.</span>'
    }</div>
<h2>Questões</h2><div class="card">${
      p.length
        ? `<table><tr><th>Matéria</th><th>Feitas</th><th>Acerto</th></tr>${p
            .map(([u, m, f]) => {
              const x = estPc(f, m);
              return `<tr><td>${esc(u)}</td><td>${m}</td><td><b class="${x >= 80 ? "g" : x < 60 ? "r" : "am"}">${x}%</b></td></tr>`;
            })
            .join("")}</table>`
        : '<span class="sm mut">Registre questões (feitas e acertos) para ver o seu aproveitamento.</span>'
    }</div>
<h2>Mapa de dificuldades e facilidades</h2><div class="card">${s.dif.length || s.fac.length ? `${s.dif.length ? `<div class="sm"><b class="r">Precisa de atenção</b></div>${s.dif.map((u) => `<div class="estmp"><span>${esc(u.top)} <small class="mut">${esc(u.n)}</small></span><b class="r">${Math.round(u.pc * 100)}%</b></div>`).join("")}` : ""}${s.fac.length ? `<div class="sm" style="margin-top:8px"><b class="g">Você domina</b></div>${s.fac.map((u) => `<div class="estmp"><span>${esc(u.top)} <small class="mut">${esc(u.n)}</small></span><b class="g">${Math.round(u.pc * 100)}%</b></div>`).join("")}` : ""}` : '<span class="sm mut">Com pelo menos 5 questões registradas por tópico, o app separa o que você domina (85% ou mais) do que precisa de atenção (menos de 70%).</span>'}</div>`
  );
}
function estCicloHtml() {
  const e = estCiclo(),
    t = estMats(),
    a = estCicloCalc();
  return `<div class="card"><b>Ciclo de estudos</b><p class="sm mut" style="margin:4px 0 8px">Diga quantas horas por semana quer dar a cada matéria. O app soma o que você estudou (Foco, registros e o Inglês) e mostra qual matéria está mais atrasada: é a próxima do ciclo.</p>
${t.map((o) => `<div class="estcl"><span>${esc(o.n)}</span><input type="number" inputmode="decimal" min="0" step="0.5" data-estcl="${esc(o.k)}" value="${e[o.k] ? esc(String(e[o.k])) : ""}" placeholder="0"><small>h/sem</small></div>`).join("")}</div>
${
  a.L.length
    ? `<h2>Esta semana</h2><div class="card">${a.L.map((o) => {
        const s = Math.min(1, o.feito / o.alvo);
        return `<div class="estbar"><span>${esc(o.n)}${a.prox && a.prox.k === o.k ? ' <b class="am">← próxima</b>' : ""}</span><div><i style="width:${Math.round(s * 100)}%"></i></div><b>${estHm(o.feito)} / ${estHm(o.alvo)}</b></div>`;
      }).join("")}</div>`
    : ""
}`;
}
const EST_MED =
  '<svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path d="M7 2h4l1 5-3 1zM17 2h-4l-1 5 3 1z" fill="#709bc2"/><circle cx="12" cy="15" r="7" fill="#bb8e3b" stroke="#86662a" stroke-width="1.5"/><path d="M12 11.3l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#ffffff"/></svg>';
function estConqHtml() {
  const e = estConq();
  return `<div class="estcq">${e.map(([t, a, o, s]) => `<div class="card estcqi${s ? " ok" : ""}"><span class="estmed">${EST_MED}</span><b>${esc(a)}</b><small>${esc(o)}</small>${s ? "<em>conquistada</em>" : ""}</div>`).join("")}</div><div class="sm mut">${e.filter((t) => t[3]).length} de ${e.length} conquistas.</div>`;
}
function estHtml() {
  const e = EST.v;
  let t = "";
  try {
    t = estSeg("est");
  } catch {
    t = EN_SG();
  }
  return (
    (t = t
      .replace(/ class="on"/g, "")
      .replace(
        /(<div class="seg"[^>]*>)/,
        '$1<button class="on" data-ep="esv" data-id="est">📒 Meu estudo</button>',
      )),
    `<h1>Estudos</h1>${t}${estChips()}${e === "reg" ? estRegHtml() : e === "edital" ? estEditalHtml() : e === "desemp" ? estDesempHtml() : e === "ciclo" ? estCicloHtml() : e === "conq" ? estConqHtml() : estHoje()}`
  );
}
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "est"
      ? estHtml()
      : e
          .apply(this, arguments)
          .replace(
            /(<div class="seg" style="margin:8px 0 10px">)/,
            '$1<button data-ep="esv" data-id="est">📒 Meu estudo</button>',
          );
  };
}
{
  const e = focoHtml;
  focoHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        /(<div class="seg" style="margin:8px 0 10px">)/,
        '$1<button data-ep="esv" data-id="est">📒 Meu estudo</button>',
      );
  };
}
(document.addEventListener("click", (e) => {
  var t;
  const a = (s) => e.target.closest && e.target.closest(s);
  let o;
  if ((o = a("[data-estv]"))) {
    EST.v = o.dataset.estv;
    try {
      APP_STORAGE.setItem("diario-est-v", EST.v);
    } catch {}
    (ESV !== "est" && ((ESV = "est"), (tab = "estudos")),
      irPara(tab),
      scrollTo(0, 0));
    return;
  }
  if (a("[data-estsalva]")) {
    estSalva();
    return;
  }
  if ((o = a("[data-estrevok]"))) {
    const s = estRev().find((n) => n.id === o.dataset.estrevok);
    s && ((s.feita = Date.now()), save(), toast("Revisão feita ✓"), render());
    return;
  }
  if ((o = a("[data-estrevad]"))) {
    const s = estRev().find((n) => n.id === o.dataset.estrevad);
    s && ((s.d = diasMais(enHoje(), 1)), save(), render());
    return;
  }
  if ((o = a("[data-estfoco]"))) {
    const s = estMat(o.dataset.estfoco);
    ((ESV = "foco"), focoInicia(25, s ? s.foco : "out"));
    return;
  }
  if (a("[data-estmatx]")) {
    const s = document.getElementById("estmatx"),
      n = String((s && s.value) || "")
        .trim()
        .slice(0, 60);
    if (!n) return;
    const r = (t = S.ax ?? (S.ax = {})).estMatX ?? (t.estMatX = []);
    (r.includes(n) || r.push(n),
      (EST.f = { ...EST.f, mat: "x:" + n }),
      save(),
      render());
    return;
  }
}),
  document.addEventListener("change", (e) => {
    if (e.target.id === "esttempo") {
      const value = e.target.value,
        entry = focoLog()[Number(value)];
      if (value !== "manual" && entry)
        document.getElementById("estmin").value = entry.min;
      return;
    }
    if (e.target.id === "estd" || e.target.matches("[data-estmat]"))
      estAtualizaSessoes();
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("[data-estmat]")) {
      EST.f = { ...EST.f, mat: t.value };
      const o = document.getElementById("esttopl");
      o &&
        (o.innerHTML = estTops(t.value)
          .map((s) => `<option value="${esc(s)}">`)
          .join(""));
      return;
    }
    const a = t.closest("[data-estcl]");
    if (a) {
      const o = estCiclo(),
        s = +String(a.value).replace(",", ".") || 0;
      (s > 0 ? (o[a.dataset.estcl] = s) : delete o[a.dataset.estcl],
        save(),
        render());
    }
  }));
{
  const e = TraderStyles.slot("legacy-099");
  ((e.id = "est175"),
    (e.textContent = TraderStyles.css("legacy-099")),
    TraderStyles.mount(e));
}
try {
  ((FN_ESPERADA.analise = "v234"), (FN_ESPERADA.notificar = "v233"));
} catch {}
const corPro = () => {
  let e = "";
  try {
    e = ls.get("diario-cor") || "";
  } catch {}
  return !e || e === "pro";
};
{
  const e = corAplica;
  corAplica = function () {
    const t = e.apply(this, arguments),
      a = document.documentElement,
      o = corPro();
    return (
      a.classList.toggle("pro", o),
      o && a.classList.remove("edge", "aurora"),
      t
    );
  };
}
corAplica();
{
  const e = vMais;
  vMais = function () {
    let t = e.apply(this, arguments);
    try {
      const a = corPro()
        ? "pro"
        : (() => {
            try {
              return ls.get("diario-cor");
            } catch {
              return "";
            }
          })();
      ((t = t.replace(
        /(<button class=")(?:on)?(" data-cor="[a-z]+">)/g,
        "$1$2",
      )),
        (t = t.replace(
          /(<div class="seg" style="margin-top:8px">)(<button class="" data-cor=")/,
          '$1<button class="" data-cor="pro"><span class="cor-dot" style="background:linear-gradient(135deg,#0d0d0e,#6695be 60%,#86abcb)"></span>Executivo</button>$2',
        )),
        (t = t.replace(
          `class="" data-cor="${a}"`,
          `class="on" data-cor="${a}"`,
        )));
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-100");
  ((e.id = "pro176"),
    (e.textContent = TraderStyles.css("legacy-100")),
    TraderStyles.mount(e));
}
{
  const e = TraderStyles.slot("legacy-101");
  ((e.id = "pro177"),
    (e.textContent = TraderStyles.css("legacy-101")),
    TraderStyles.mount(e));
}
const IMGPRO = {
  n: 0,
  stack:
    '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};
function imgProRgb(e) {
  e = String(e || "").trim();
  let t;
  return (t = /^#([0-9a-f]{3})$/i.exec(e))
    ? t[1].split("").map((a) => parseInt(a + a, 16))
    : (t = /^#([0-9a-f]{6})/i.exec(e))
      ? [0, 2, 4].map((a) => parseInt(t[1].slice(a, a + 2), 16))
      : (t = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(e))
        ? [+t[1], +t[2], +t[3]]
        : null;
}
const imgProLum = ([e, t, a]) => (0.2126 * e + 0.7152 * t + 0.0722 * a) / 255,
  imgProSat = ([e, t, a]) => {
    const o = Math.max(e, t, a),
      s = Math.min(e, t, a);
    return o ? (o - s) / o : 0;
  };
(function () {
  const e = CanvasRenderingContext2D.prototype,
    t = Object.getOwnPropertyDescriptor(e, "font");
  t &&
    t.set &&
    Object.defineProperty(e, "font", {
      configurable: !0,
      get: t.get,
      set(o) {
        if (IMGPRO.n && typeof o == "string") {
          const s = /^(.*?\d+(?:\.\d+)?px(?:\/[\d.]+(?:px)?)?)\s+.+$/.exec(o);
          s && (o = s[1] + " " + IMGPRO.stack);
        }
        t.set.call(this, o);
      },
    });
  const a = e.fillText;
  e.fillText = function (o, s, n, r) {
    if (IMGPRO.n)
      try {
        const i = this.fillStyle;
        if (typeof i == "string") {
          const l = imgProRgb(i);
          if (l && imgProSat(l) < 0.3) {
            const d = imgProLum(l),
              c = +((/(\d+(?:\.\d+)?)px/.exec(this.font) || [])[1] || 20),
              p = Math.min(this.measureText(String(o)).width, 40);
            let u =
              this.textAlign === "right" || this.textAlign === "end"
                ? s - p - 3
                : this.textAlign === "center"
                  ? s - p / 2 - 2
                  : s - 3;
            const m = this.getTransform ? this.getTransform() : null;
            let f = u,
              x = n - c * 1.05;
            (m &&
              ((f = m.a * u + m.c * x + m.e), (x = m.b * u + m.d * x + m.f)),
              (f = Math.max(0, Math.min(this.canvas.width - 1, Math.round(f)))),
              (x = Math.max(
                0,
                Math.min(this.canvas.height - 1, Math.round(x)),
              )));
            const v = this.getImageData(f, x, 1, 1).data,
              g = imgProLum([v[0], v[1], v[2]]);
            if (v[3] > 200) {
              if (g > 0.62 && d > 0.42) {
                (this.save(), (this.fillStyle = "#393c41"));
                const h = a.call(this, o, s, n, r);
                return (this.restore(), h);
              }
              if (g < 0.32 && d < 0.62) {
                (this.save(), (this.fillStyle = "#d3d5d9"));
                const h = a.call(this, o, s, n, r);
                return (this.restore(), h);
              }
            }
          }
        }
      } catch {}
    return r == null ? a.call(this, o, s, n) : a.call(this, o, s, n, r);
  };
})();
const imgProEnv = (e) =>
  function () {
    IMGPRO.n++;
    let t;
    try {
      t = e.apply(this, arguments);
    } catch (a) {
      throw (IMGPRO.n--, a);
    }
    return t && typeof t.then == "function"
      ? t.finally(() => {
          IMGPRO.n--;
        })
      : (IMGPRO.n--, t);
  };
try {
  imgDesenha = imgProEnv(imgDesenha);
} catch {}
try {
  rkDesenha = imgProEnv(rkDesenha);
} catch {}
try {
  grDesenha = imgProEnv(grDesenha);
} catch {}
try {
  jrImagem = imgProEnv(jrImagem);
} catch {}
try {
  shrGera = imgProEnv(shrGera);
} catch {}
try {
  shrGeraPer = imgProEnv(shrGeraPer);
} catch {}
try {
  dshImg = imgProEnv(dshImg);
} catch {}
try {
  const e = Object.getOwnPropertyDescriptor(window, "html2canvas");
  if (e && e.get)
    Object.defineProperty(window, "html2canvas", {
      configurable: !0,
      get() {
        const t = e.get.call(window);
        return t && imgProEnv(t);
      },
      set(t) {
        e.set && e.set.call(window, t);
      },
    });
  else {
    let t = window.html2canvas;
    Object.defineProperty(window, "html2canvas", {
      configurable: !0,
      get() {
        return t && imgProEnv(t);
      },
      set(a) {
        t = a;
      },
    });
  }
} catch {}
{
  const e = TraderStyles.slot("legacy-102");
  ((e.id = "pro178"),
    (e.textContent = TraderStyles.css("legacy-102")),
    TraderStyles.mount(e));
}
try {
  ls.get("diario-cor-v256") ||
    (ls.set("diario-cor-v256", "1"), ls.set("diario-cor", "pro"), corAplica());
} catch {}
function menosFix(e) {
  try {
    if (!e) return;
    const t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, {
        acceptNode: (o) =>
          /-\s?(R\$|US\$|\$|\u20ac)/.test(o.nodeValue) &&
          !(
            o.parentElement &&
            o.parentElement.closest("input,textarea,select,script,style")
          )
            ? 1
            : 3,
      }),
      a = [];
    for (; t.nextNode(); ) a.push(t.currentNode);
    a.forEach((o) => {
      o.nodeValue = o.nodeValue.replace(
        /(^|[\s(+\xb7:=])-\s?(R\$|US\$|\$|\u20ac)/g,
        "$1−$2",
      );
    });
  } catch {}
}
{
  const e = render0;
  render0 = function () {
    const t = e.apply(this, arguments);
    return (menosFix(document.getElementById("app")), t);
  };
}
try {
  new MutationObserver((e) => {
    for (const t of e)
      for (const a of t.addedNodes)
        a.nodeType === 1 && !a.closest("input,textarea") && menosFix(a);
  }).observe(document.getElementById("app") || document.body, {
    childList: !0,
    subtree: !0,
  });
} catch {}
{
  const e = TraderStyles.slot("legacy-103");
  ((e.id = "pro179"),
    (e.textContent = TraderStyles.css("legacy-103")),
    TraderStyles.mount(e));
}
{
  const e = TraderStyles.slot("legacy-104");
  ((e.id = "pro180"),
    (e.textContent = TraderStyles.css("legacy-104")),
    TraderStyles.mount(e));
}
const IMGD = { n: 0, touro: null, logo: null };
try {
  ((IMGD.touro = new Image()), (IMGD.touro.src = JV_IMAGENS.capa));
} catch {}
const imgdPal = {
  pag: "#0f1011",
  card: "#16171a",
  esc: "#202125",
  linha: "rgba(255,255,255,0.09)",
  tx: "#f0efed",
  tx2: "#b4b7be",
  g: "#3aad74",
  r: "#e86d5a",
  am: "#c9a156",
};
function imgdCor(e, t) {
  if (typeof e != "string") return e;
  const a = imgProRgb(e);
  if (!a) return e;
  const o = imgProLum(a),
    s = imgProSat(a),
    [n, r, i] = a,
    l = r > n + 20 && r >= i,
    d = n > r + 30 && n > i + 20,
    c = n > 150 && r > 110 && i < 90;
  if (t === "tx")
    return s < 0.45 || o < 0.18
      ? o < 0.4
        ? imgdPal.tx
        : o < 0.72
          ? imgdPal.tx2
          : e
      : o < 0.38
        ? l
          ? "#caa45f"
          : d
            ? "#ed8b7c"
            : c
              ? imgdPal.am
              : imgdPal.tx
        : l
          ? imgdPal.g
          : d
            ? imgdPal.r
            : e;
  if (t === "st") return s < 0.25 && o > 0.7 ? imgdPal.linha : e;
  if (s < 0.2)
    return o >= 0.985
      ? imgdPal.card
      : o > 0.93
        ? imgdPal.pag
        : o > 0.8
          ? imgdPal.linha
          : o < 0.22
            ? imgdPal.esc
            : "#25272a";
  if (o > 0.82) {
    const p = Math.min(n, r, i),
      u = 255 / Math.max(1, Math.max(n, r, i) - p),
      m = Math.round((n - p) * u * 0.85),
      f = Math.round((r - p) * u * 0.85),
      x = Math.round((i - p) * u * 0.85);
    return `rgba(${m},${f},${x},0.18)`;
  }
  return o < 0.22
    ? l
      ? "#1f2124"
      : d
        ? "#4a1c15"
        : "#202125"
    : l
      ? imgdPal.g
      : d
        ? imgdPal.r
        : e;
}
(function () {
  const e = CanvasRenderingContext2D.prototype,
    t = (a, o) => {
      const s = e[a];
      e[a] = function () {
        if (IMGD.n) {
          const n = o === "st" ? "strokeStyle" : "fillStyle",
            r = this[n];
          if (typeof r == "string") {
            let i = imgdCor(r, o);
            if (
              a === "fillRect" &&
              this.canvas &&
              Math.abs(arguments[2] * arguments[3]) >=
                0.3 * this.canvas.width * this.canvas.height
            ) {
              const l = imgProRgb(r);
              l && imgProSat(l) < 0.45 && (i = imgdPal.pag);
            }
            this[n] = i;
            try {
              return s.apply(this, arguments);
            } finally {
              this[n] = r;
            }
          }
        }
        return s.apply(this, arguments);
      };
    };
  (t("fillRect", "fi"),
    t("fill", "fi"),
    t("fillText", "tx"),
    t("stroke", "st"),
    t("strokeRect", "st"),
    t("strokeText", "tx"));
})();
function imgdTouro(e, t, a, o) {
  const s = IMGD.touro;
  if (!s || !s.complete || !s.naturalWidth) return;
  const n = Math.round(t * 0.55),
    r = document.createElement("canvas");
  ((r.width = n), (r.height = a));
  const i = r.getContext("2d"),
    l = Math.max(n / s.naturalWidth, a / s.naturalHeight),
    d = s.naturalWidth * l,
    c = s.naturalHeight * l;
  (i.drawImage(s, n - d, (a - c) * 0.35, d, c),
    (i.globalCompositeOperation = "destination-in"));
  const p = i.createLinearGradient(0, 0, n, 0);
  (p.addColorStop(0, "rgba(0,0,0,0)"),
    p.addColorStop(0.5, "rgba(0,0,0,0.55)"),
    p.addColorStop(1, "rgb(0,0,0)"),
    (i.fillStyle = p),
    i.fillRect(0, 0, n, a),
    e.save(),
    (e.globalAlpha = o),
    (e.globalCompositeOperation = "screen"),
    e.drawImage(r, t - n, 0),
    e.restore());
}
function imgdFaixa(e) {
  try {
    const t = e.getContext("2d"),
      a = e.width,
      o = (r) => {
        const i = t.getImageData(8, r, 1, 1).data;
        return [i[0], i[1], i[2]];
      },
      s = o(6);
    if (imgProLum(s) > 0.3) return;
    let n = 10;
    for (; n < 300; n += 2) {
      const r = o(n);
      if (
        Math.abs(r[0] - s[0]) + Math.abs(r[1] - s[1]) + Math.abs(r[2] - s[2]) >
        24
      )
        break;
    }
    if (n < 60 || n >= 300) return;
    imgdTouro(t, a, n, 0.55);
  } catch {}
}
function imgdCabPanorama(e) {
  if (window.TraderExportBrand)
    return window.TraderExportBrand.panoramaHeader(e);
  try {
    const t = e.getContext("2d"),
      a = e.width,
      o = e.__folga ? IMG_FOLGA.top : 0,
      s = o + 150;
    e.__folga &&
      ((t.fillStyle = imgdPal.pag),
      t.fillRect(0, e.height - IMG_FOLGA.bot, a, IMG_FOLGA.bot));
    const n = t.createLinearGradient(0, 0, a, s);
    (n.addColorStop(0, "#16171a"),
      n.addColorStop(1, "#121214"),
      (t.fillStyle = n),
      t.fillRect(0, 0, a, s),
      imgdTouro(t, a, s, 0.85));
    const r = MDO.v && MDO.v.mercados && MDO.v.mercados.pre,
      i = r && r.vies;
    if (i) {
      const u = t.createLinearGradient(a * 0.55, 0, a, 0);
      (u.addColorStop(0, "rgba(0,0,0,0)"),
        u.addColorStop(
          1,
          i === "negativo"
            ? "rgba(220,62,38,0.22)"
            : i === "positivo"
              ? "rgba(58,173,116,0.18)"
              : "rgba(184,140,58,0.15)",
        ),
        (t.fillStyle = u),
        t.fillRect(a * 0.55, 0, a * 0.45, s));
    }
    ((t.fillStyle = "rgba(255,255,255,0.08)"), t.fillRect(0, s - 1, a, 1));
    const l = 136;
    {
      const u = o + 38,
        m = 72,
        f = 18;
      (t.save(),
        t.beginPath(),
        t.moveTo(44 + f, u),
        t.arcTo(44 + m, u, 44 + m, u + m, f),
        t.arcTo(44 + m, u + m, 44, u + m, f),
        t.arcTo(44, u + m, 44, u, f),
        t.arcTo(44, u, 44 + m, u, f),
        t.closePath());
      const x = t.createLinearGradient(44, u, 44 + m, u + m);
      (x.addColorStop(0, "#202125"),
        x.addColorStop(1, "#131416"),
        (t.fillStyle = x),
        t.fill(),
        (t.strokeStyle = "rgba(202,164,95,0.35)"),
        (t.lineWidth = 1.5),
        t.stroke(),
        (t.strokeStyle = "#caa45f"),
        (t.lineWidth = 5),
        (t.lineCap = "round"),
        (t.lineJoin = "round"),
        t.beginPath(),
        t.moveTo(60, u + 52),
        t.lineTo(74, u + 38),
        t.lineTo(84, u + 46),
        t.lineTo(100, u + 24),
        t.stroke(),
        t.beginPath(),
        t.moveTo(90, u + 22),
        t.lineTo(101, u + 22),
        t.lineTo(101, u + 33),
        t.stroke(),
        t.restore());
    }
    const d = new Date(),
      c = d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      }),
      p = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    t.save();
    try {
      t.letterSpacing = "3px";
    } catch {}
    if (
      ((t.font = "600 24px " + IMGPRO.stack),
      (t.fillStyle = "#c4c6cb"),
      (t.textAlign = "left"),
      t.fillText("PANORAMA DO MERCADO", l, o + 66),
      t.restore(),
      (t.font = "700 42px " + IMGPRO.stack),
      (t.fillStyle = "#ffffff"),
      t.fillText(
        c.charAt(0).toUpperCase() + c.slice(1) + " · " + p,
        l,
        o + 114,
      ),
      i)
    ) {
      const u =
          i === "positivo"
            ? "#2e8b5d"
            : i === "negativo"
              ? "#dc3e26"
              : "#9d7731",
        m =
          (i === "positivo" ? "▲  " : i === "negativo" ? "▼  " : "■  ") +
          "Viés " +
          i;
      t.font = "700 28px " + IMGPRO.stack;
      const f = t.measureText(m).width + 56,
        x = a - 48 - f,
        v = o + 46,
        g = 58;
      (t.save(), (t.shadowColor = u), (t.shadowBlur = 24), t.beginPath());
      const h = 29;
      (t.moveTo(x + h, v),
        t.arcTo(x + f, v, x + f, v + g, h),
        t.arcTo(x + f, v + g, x, v + g, h),
        t.arcTo(x, v + g, x, v, h),
        t.arcTo(x, v, x + f, v, h),
        t.closePath());
      const b = t.createLinearGradient(x, v, x, v + g);
      (b.addColorStop(0, u),
        b.addColorStop(
          1,
          i === "negativo"
            ? "#992c1b"
            : i === "positivo"
              ? "#35373d"
              : "#705523",
        ),
        (t.fillStyle = b),
        t.fill(),
        t.restore(),
        (t.fillStyle = "#ffffff"),
        (t.textAlign = "center"),
        t.fillText(m, x + f / 2, v + 39),
        (t.textAlign = "left"));
    }
  } catch {}
}
const imgdEnv = (e, t) =>
  function () {
    IMGD.n++;
    let a;
    try {
      a = e.apply(this, arguments);
    } finally {
      IMGD.n--;
    }
    try {
      a && a.getContext && (t ? t(a) : imgdFaixa(a));
    } catch {}
    return a;
  };
try {
  imgDesenha = imgdEnv(imgDesenha, imgdCabPanorama);
} catch {}
function imgdFaixaFix(e) {
  return (t) => {
    try {
      const a = t.getContext("2d"),
        o = t.width,
        s = (t.__folga ? IMG_FOLGA.top : 0) + e;
      (imgdTouro(a, o, s, 0.6),
        (a.fillStyle = "rgba(255,255,255,0.08)"),
        a.fillRect(0, s - 1, o, 1),
        t.__folga &&
          ((a.fillStyle = imgdPal.pag),
          a.fillRect(0, t.height - IMG_FOLGA.bot, o, IMG_FOLGA.bot)));
    } catch {}
  };
}
try {
  rkDesenha = imgdEnv(rkDesenha, imgdFaixaFix(150));
} catch {}
try {
  grDesenha = imgdEnv(grDesenha, imgdFaixaFix(140));
} catch {}
try {
  jrImagem = imgdEnv(jrImagem, imgdFaixaFix(150));
} catch {}
const BAL_PREF = {
    USIM: "USIM5",
    ITUB: "ITUB4",
    SANB: "SANB11",
    BBDC: "BBDC4",
    PETR: "PETR4",
    VALE: "VALE3",
    GGBR: "GGBR4",
    GOAU: "GOAU4",
    CMIG: "CMIG4",
    CPLE: "CPLE6",
    BRKM: "BRKM5",
    ELET: "ELET3",
    AXIA: "AXIA3",
    ISAE: "ISAE4",
    TAEE: "TAEE11",
    KLBN: "KLBN11",
    ENGI: "ENGI11",
    ALUP: "ALUP11",
    BPAC: "BPAC11",
    SAPR: "SAPR11",
    POMO: "POMO4",
    RAPT: "RAPT4",
    ITSA: "ITSA4",
    BRAP: "BRAP4",
    CSNA: "CSNA3",
    TRPL: "TRPL4",
    CESP: "CESP6",
    UNIP: "UNIP6",
    BEEF: "BEEF3",
    EMAE: "EMAE4",
    CEBR: "CEBR6",
    PNVL: "PNVL3",
    BRSR: "BRSR6",
    BMGB: "BMGB4",
    BIDI: "BIDI11",
    SULA: "SULA11",
    IGTI: "IGTI11",
  },
  BAL_ALIAS = {
    IRANI: "RANI",
    JSL: "JSLG",
    VAMOS: "VAMO",
    SANTANDER: "SANB",
    ITAU: "ITUB",
    BRADESCO: "BBDC",
    PETROBRAS: "PETR",
    USIMINAS: "USIM",
    GERDAU: "GGBR",
    CEMIG: "CMIG",
    COPEL: "CPLE",
    ELETROBRAS: "ELET",
    AMBEV: "ABEV",
    WEG: "WEGE",
    SUZANO: "SUZB",
    KLABIN: "KLBN",
    EMBRAER: "EMBR",
  },
  balTkOk = (e) => /^[A-Z]{4}\d{1,2}$/.test(e);
function balRank(e) {
  const t = /^([A-Z]{4})(\d{1,2})$/.exec(e);
  return t
    ? BAL_PREF[t[1]] === e
      ? 0
      : { 11: 1, 4: 2, 3: 3, 5: 4, 6: 5 }[t[2]] || 9
    : 99;
}
function balUnicoLista(e) {
  if (!Array.isArray(e)) return e;
  const t = new Map(),
    a = [];
  for (const o of e) {
    if (!o || !o.tk) continue;
    const s = String(o.tk).toUpperCase();
    let n = balTkOk(s) ? s.slice(0, 4) + "|" + (o.d || "") : null;
    if (!n) {
      let r = s.replace(/[^A-Z]/g, "");
      r = BAL_ALIAS[r] || r;
      for (const i of t.keys()) {
        const l = i.split("|")[0];
        if (
          r.length >= 3 &&
          l.startsWith(r.slice(0, Math.min(4, r.length))) &&
          i.split("|")[1] === (o.d || "")
        ) {
          n = i;
          break;
        }
      }
      n || (n = "n:" + r + "|" + (o.d || ""));
    }
    (t.has(n) || (t.set(n, []), a.push(n)), t.get(n).push(o));
  }
  for (const o of [...a])
    if (o.startsWith("n:")) {
      const [s, n] = o.slice(2).split("|"),
        r = a.find(
          (i) =>
            !i.startsWith("n:") &&
            i.split("|")[1] === n &&
            i.split("|")[0].startsWith(s.slice(0, Math.min(4, s.length))),
        );
      r && (t.get(r).push(...t.get(o)), t.delete(o), a.splice(a.indexOf(o), 1));
    }
  return a.map((o) => {
    const s = t.get(o),
      n = s
        .map((l) => String(l.tk).toUpperCase())
        .filter(balTkOk)
        .sort((l, d) => balRank(l) - balRank(d)),
      r = s.find((l) => l.conf === "cvm"),
      i = { ...(r || s[0]) };
    return (
      n.length && (i.tk = n[0]),
      r &&
        ((i.conf = "cvm"),
        (i.hora = r.hora || (s.find((l) => l.hora) || {}).hora || i.hora)),
      (i.cap = Math.max(...s.map((l) => +l.cap || 0)) || i.cap),
      s.length > 1 &&
        (i.outros = [
          ...new Set(s.map((l) => String(l.tk).toUpperCase())),
        ].filter((l) => l !== i.tk)),
      i
    );
  });
}
function balUnico(e) {
  try {
    if (!e || typeof e != "object") return e;
    const t = { ...e };
    return (
      ["ontem", "hoje_lista", "proximos"].forEach((a) => {
        Array.isArray(t[a]) && (t[a] = balUnicoLista(t[a]));
      }),
      t
    );
  } catch {
    return e;
  }
}
try {
  let e = BAL.v;
  (Object.defineProperty(BAL, "v", {
    configurable: !0,
    enumerable: !0,
    get() {
      return e;
    },
    set(t) {
      e = balUnico(t);
    },
  }),
    (BAL.v = e));
} catch {}
((SHR.at = (() => {
  try {
    return ls.get("diario-shr-at") === "0" ? 0 : 1;
  } catch {
    return 1;
  }
})()),
  (SHR.mod = SHR.mod || "all"));
const SHR_MODS = [
    ["all", "Tudo"],
    ["dt", "Day trade"],
    ["sw", "Swing"],
    ["op", "Opções"],
    ["ex", "EUA e Forex"],
  ],
  shrModOk = (e, t) => {
    try {
      const a = moedaT(e) === "USD";
      if (t === "ex") return a;
      if (a) return !1;
      const o = e.tipo || "D";
      return t === "dt"
        ? o === "D"
        : t === "sw"
          ? o === "S"
          : t === "op"
            ? o === "O"
            : !0;
    } catch {
      return !0;
    }
  };
{
  const e = perDados;
  perDados = function (t) {
    const a = SHR.mod || "all";
    let o;
    if (a === "all") o = e.apply(this, arguments);
    else {
      const s = S.trades;
      S.trades = s.filter((n) => shrModOk(n, a));
      try {
        o = e.apply(this, arguments);
      } finally {
        S.trades = s;
      }
    }
    try {
      (a !== "all" &&
        (o.sub = o.sub + " · " + (SHR_MODS.find((s) => s[0] === a) || [])[1]),
        !SHR.at &&
          o.best &&
          (o.best = { ...o.best, t: { ...o.best.t, ativo: "" } }));
    } catch {}
    return o;
  };
}
{
  const e = shrGera;
  shrGera = function (t) {
    if (!SHR.at && t) {
      const a = t._fx
        ? "FOREX"
        : { D: "DAY TRADE", S: "SWING", O: "OPÇÃO" }[t.tipo || "D"] || "TRADE";
      t = { ...t, ativo: a, a, s: a };
    }
    return e.call(this, t);
  };
}
{
  const e = shrAbre;
  shrAbre = async function (t) {
    const a = await e.apply(this, arguments);
    try {
      const o = document.getElementById("shrov");
      if (!o) return a;
      const s = o.querySelector("[data-shrrs]"),
        n = s && s.closest("label");
      if (
        (n &&
          !o.querySelector("[data-shrat]") &&
          n.insertAdjacentHTML(
            "afterend",
            `<label class="ck"><input type="checkbox" data-shrat="1"${SHR.at ? " checked" : ""}><span>Mostrar os ativos (tickers)</span></label>`,
          ),
        String(t).startsWith("per:") && !o.querySelector("[data-shrmod]"))
      ) {
        const r = o.querySelector(".seg"),
          i = `<div class="seg" style="margin-top:8px">${SHR_MODS.map(([l, d]) => `<button class="${(SHR.mod || "all") === l ? "on" : ""}" data-shrmod="${l}">${d}</button>`).join("")}</div>`;
        r && r.insertAdjacentHTML("afterend", i);
      }
    } catch {}
    return a;
  };
}
(document.addEventListener("change", (e) => {
  const t = e.target.closest && e.target.closest("[data-shrat]");
  if (t) {
    SHR.at = t.checked ? 1 : 0;
    try {
      ls.set("diario-shr-at", SHR.at ? "1" : "0");
    } catch {}
    SHR.id && shrAbre(SHR.id);
  }
}),
  document.addEventListener(
    "click",
    (e) => {
      const t = (o) => e.target.closest && e.target.closest(o);
      let a;
      if ((a = t("[data-shrmod]"))) {
        ((SHR.mod = a.dataset.shrmod), SHR.id && shrAbre(SHR.id));
        return;
      }
      if ((a = t("[data-shrper]"))) {
        ((SHR.mod = a.dataset.shrper), shrAbre("per:d"));
        return;
      }
    },
    !0,
  ));
function shrModAtual() {
  const e = document.getElementById("app");
  return e
    ? tab === "trades"
      ? "dt"
      : tab === "swing"
        ? "sw"
        : tab === "opc"
          ? "op"
          : [...e.querySelectorAll(".seg>button.on,.hub2>button.on")]
                .map((t) => t.textContent.trim())
                .some((t) => /EUA|Forex/i.test(t))
            ? "ex"
            : null
    : null;
}
{
  const e = render0;
  render0 = function () {
    const t = e.apply(this, arguments);
    try {
      const a = shrModAtual();
      if (!a) return t;
      const o = document.getElementById("app");
      if (o.querySelector("[data-shrper]")) return t;
      const s = [...o.querySelectorAll("button")].find((r) =>
          /Novo trade/i.test(r.textContent),
        ),
        n = `<button class="btn s shrperb" data-shrper="${a}" aria-label="Gerar imagem do resultado">${SHR_CAM}<span>Imagem</span></button>`;
      if (s) s.insertAdjacentHTML("beforebegin", n);
      else {
        const r = o.querySelector("h1");
        r &&
          r.insertAdjacentHTML(
            "afterend",
            `<div style="margin:-6px 0 10px">${n}</div>`,
          );
      }
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-105");
  ((e.textContent = TraderStyles.css("legacy-105")), TraderStyles.mount(e));
}
try {
  FN_ESPERADA.analise = "v235";
} catch {}
const IUD_L = [
    ["Liquidez corrente", (e) => e.liquidez && e.liquidez.corrente, 2],
    ["Liquidez seca", (e) => e.liquidez && e.liquidez.seca, 2],
    ["Liquidez imediata", (e) => e.liquidez && e.liquidez.imediata, 2],
    [
      "Capitais de terceiros ÷ PL",
      (e) => e.endividamento.capitais_terceiros_sobre_pl,
      2,
    ],
    [
      "Dívida no curto prazo",
      (e) => e.endividamento.composicao_curto_prazo_pct,
      1,
      "%",
    ],
    ["Imobilização do PL", (e) => e.endividamento.imobilizacao_do_pl, 2],
    ["Cobertura de juros", (e) => e.endividamento.cobertura_de_juros, 1, "x"],
    [
      "Prazo médio de estocagem",
      (e) => e.rotatividade && e.rotatividade.prazo_medio_estocagem_dias,
      0,
      " d",
    ],
    [
      "Prazo médio de recebimento",
      (e) => e.rotatividade && e.rotatividade.prazo_medio_recebimento_dias,
      0,
      " d",
    ],
    [
      "Prazo médio de pagamento",
      (e) => e.rotatividade && e.rotatividade.prazo_medio_pagamento_dias,
      0,
      " d",
    ],
    [
      "Ciclo financeiro",
      (e) => e.rotatividade && e.rotatividade.ciclo_financeiro_dias,
      0,
      " d",
    ],
    ["Margem líquida", (e) => e.rentabilidade.margem_liquida_pct, 1, "%"],
    ["Giro do ativo", (e) => e.rentabilidade.giro_do_ativo, 2],
    [
      "Retorno sobre o ativo",
      (e) => e.rentabilidade.retorno_sobre_ativo_pct,
      1,
      "%",
    ],
    ["Retorno sobre o PL", (e) => e.rentabilidade.retorno_sobre_pl_pct, 1, "%"],
    [
      "Grau de alavancagem financeira",
      (e) => e.rentabilidade.grau_alavancagem_financeira,
      2,
    ],
    ["Termômetro de Kanitz", (e) => e.kanitz, 2],
  ],
  iudN = (e, t, a) =>
    e == null || !isFinite(e)
      ? "–"
      : Number(e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        }) + (a || ""),
  IUD_TX = [
    ["horizontal_vertical", "Análise horizontal e vertical"],
    ["liquidez", "Liquidez"],
    ["endividamento", "Endividamento e estrutura de capital"],
    ["rotatividade", "Rotatividade: prazos e ciclos"],
    ["rentabilidade_e_alavancagem", "Rentabilidade e alavancagem"],
    ["visao_de_conjunto", "Visão de conjunto"],
  ];
function iudLinhas(e) {
  if (!e || !Array.isArray(e.anos) || !e.anos.length) return [];
  const t = e.anos,
    a = t[t.length - 1],
    o = t.length > 1 ? t[0] : null;
  return IUD_L.map(([s, n, r, i]) => {
    let l = null,
      d = null;
    try {
      d = n(a);
    } catch {}
    try {
      l = o ? n(o) : null;
    } catch {}
    return [s, l, d, r, i];
  }).filter((s) => s[2] != null);
}
function iudHtml(e, t) {
  const a = e && e.hist && e.hist.balancos,
    o = (t && t.analise_de_balancos) || {},
    s = iudLinhas(a);
  if (!(s.length || IUD_TX.some(([d]) => o[d]))) return "";
  const n = (a && a.anos) || [],
    r = n[n.length - 1],
    i = n.length > 1 ? n[0] : null,
    l = [
      ...new Set([
        ...((a && a.alertas) || []),
        ...anxArr(o.alertas).filter((d) => typeof d == "string" && d.trim()),
      ]),
    ];
  return `<div class="iudb"><h3>📒 Análise de balanços <span class="sm mut">roteiro de Iudícibus</span></h3>
${s.length ? `<div class="anxt"><table><tr><th>Índice</th>${i ? `<th>${i.ano}</th>` : ""}<th>${r.ano}</th></tr>${s.map(([d, c, p, u, m]) => `<tr><td>${esc(d)}</td>${i ? `<td>${iudN(c, u, m)}</td>` : ""}<td><b>${iudN(p, u, m)}</b></td></tr>`).join("")}</table></div>` : ""}
${a && a.horizontal_base100 && a.horizontal_base100.receita != null ? `<div class="sm" style="margin:6px 0">Análise horizontal (${a.horizontal_base100.de} = 100): receita <b>${a.horizontal_base100.receita}</b> · lucro <b>${a.horizontal_base100.lucro_liquido ?? "–"}</b> em ${a.horizontal_base100.ate}.</div>` : ""}
${IUD_TX.map(([d, c]) => (o[d] ? `<h4>${c}</h4>${anxV(o[d])}` : "")).join("")}
${l.length ? `<div class="iudal">${l.map((d) => `<div>• ${esc(d)}</div>`).join("")}</div>` : ""}
${a && a.banco ? '<div class="sm mut">Instituição financeira: índices de liquidez, estoque e prazos não se aplicam.</div>' : ""}
<div class="sm mut" style="margin-top:6px">${esc(((a && a.observacoes) || []).join(" "))}</div></div>`;
}
{
  const e = anxFun;
  anxFun = function (t, a) {
    let o = e.apply(this, arguments);
    try {
      const s = t.relatorio || {},
        n = anxArr(t.ativos),
        r = (d) =>
          anxArr(s.ativos).find(
            (c) => String(c.ticker || "").toUpperCase() === d,
          ) || {},
        i = '<div class="card"><div class="top"><span><b>',
        l = o.split(i);
      if (l.length < 2) return o;
      for (let d = 1; d < l.length; d++) {
        const c = (l[d].match(/^([^<]+)<\/b>/) || [])[1];
        if (!c) continue;
        const p = n.find(
            (x) => String(x.tk).toUpperCase() === c.trim().toUpperCase(),
          ),
          u = iudHtml(p, r(c.trim().toUpperCase()));
        if (!u) continue;
        const m = l[d],
          f = m.lastIndexOf("</div>");
        f < 0 || (l[d] = m.slice(0, f) + u + m.slice(f));
      }
      return l.join(i);
    } catch {
      return o;
    }
  };
}
try {
  const e = rpFunAtivo;
  rpFunAtivo = function (t, a, o) {
    const s = e.apply(this, arguments);
    try {
      const n = a && a.hist && a.hist.balancos,
        r = (o && o.analise_de_balancos) || {},
        i = iudLinhas(n);
      if (!i.length && !IUD_TX.some(([u]) => r[u])) return s;
      t.h2("Análise de balanços (roteiro de Iudícibus)", null, 60);
      const l = (n && n.anos) || [],
        d = l.length > 1 ? l[0] : null,
        c = l[l.length - 1];
      (i.length &&
        t.bul(
          i.map(
            ([u, m, f, x, v]) =>
              `${u}: ${iudN(f, x, v)}${d ? ` (em ${d.ano}: ${iudN(m, x, v)})` : ""}`,
          ),
          {},
        ),
        IUD_TX.forEach(([u, m]) => {
          r[u] && (t.h3(m), t.para(rpTexto(r[u])));
        }));
      const p = [
        ...new Set([
          ...((n && n.alertas) || []),
          ...anxArr(r.alertas).filter((u) => typeof u == "string" && u.trim()),
        ]),
      ];
      p.length && (t.h3("Sinais de alerta"), t.bul(p, { dot: t.C.r }));
    } catch {}
    return s;
  };
} catch {}
{
  const e = jvoCampos;
  jvoCampos = function (t) {
    const a = e.apply(this, arguments);
    try {
      const o = (t.fun && t.fun.analise_de_balancos) || {},
        s = IUD_TX.map(([i, l]) => [l, jvoS(o[i])]).filter((i) => i[1]),
        n = anxArr(o.alertas).filter((i) => typeof i == "string" && i.trim());
      if ((n.length && s.push(["Sinais de alerta", n.join(" · ")]), !s.length))
        return a;
      const r = a.findIndex((i) => i[0] === "Análise técnica" && i[1] == null);
      a.splice(
        r >= 0 ? r : a.length,
        0,
        ["Análise de balanços (Iudícibus)", null],
        ...s,
      );
    } catch {}
    return a;
  };
}
{
  const e = TraderStyles.slot("legacy-106");
  ((e.textContent = TraderStyles.css("legacy-106")), TraderStyles.mount(e));
}
(function () {
  let e = [],
    t = [],
    a = {},
    o = [],
    s = [],
    n = [],
    r = {},
    i = { caps: [] };
  const l = { ok: 0, busy: 0, erro: 0 };
  function d(w) {
    ((e = [
      w.BIB_HULL,
      w.BIB_CNPI,
      w.BIB_MC,
      w.BIB_RF,
      w.BIB_CFP,
      w.BIB_AR,
    ].filter(Boolean)),
      (t = w.SIMQ),
      (a = w.SIMIMG),
      (o = w.MCQ),
      (s = w.HULLQ || []),
      (n = w.ESTR || []),
      (r = w.CNPI_TOP),
      (i = w.BIB_MC),
      (l.ok = 1));
    try {
      Object.assign(window, {
        SIMQ: t,
        SIMIMG: a,
        MCQ: o,
        BIB: e,
        HULLQ: s,
        ESTR: n,
      });
    } catch {}
  }
  function c() {
    if (l.ok) return !0;
    if (window.EST_DATA) return (d(window.EST_DATA), !0);
    if (l.busy) return !1;
    l.busy = 1;
    const w = document.createElement("script");
    return (
      (w.src = "estudos.js?v=522"),
      (w.onload = () => {
        if (
          ((l.busy = 0),
          window.EST_DATA && (d(window.EST_DATA), tab === "estudos"))
        ) {
          const H = scrollY;
          (render(), scrollTo(0, H));
        }
      }),
      (w.onerror = () => {
        ((l.busy = 0), (l.erro = 1), tab === "estudos" && render());
      }),
      document.head.appendChild(w),
      !1
    );
  }
  const p = () =>
      l.erro
        ? '<div class="card warn"><b>Falta o arquivo estudos.js</b><div class="sm">Suba o <b>estudos.js</b> no GitHub junto com o app.js e o sw.js. É ele que traz os livros, cartões e simulados.</div><button class="btn s" data-e2retenta="1" style="margin-top:8px">Tentar de novo</button></div>'
        : '<div class="card"><div class="sm mut">Carregando livros e simulados…</div></div>',
    u = { bib: null, cap: null, fc: null, ses: null, res: null };
  try {
    const w = JSON.parse(APP_STORAGE.getItem("diario-est2") || "null");
    w && w.ses && w.ses.ids && w.ses.ids.length && (u.ses = w.ses);
  } catch {}
  const m = () => {
      try {
        APP_STORAGE.setItem("diario-est2", JSON.stringify({ ses: u.ses }));
      } catch {}
    },
    f = () => {
      var w;
      return (w = S.ax ?? (S.ax = {})).estLido ?? (w.estLido = {});
    },
    x = () => {
      var w;
      return (w = S.ax ?? (S.ax = {})).estFc ?? (w.estFc = {});
    },
    v = () => {
      var w;
      return (w = S.ax ?? (S.ax = {})).estSim ?? (w.estSim = []);
    },
    g = () => {
      var w;
      return (w = S.ax ?? (S.ax = {})).estErr ?? (w.estErr = {});
    },
    h = (w) => {
      for (const H of e)
        for (const N of H.caps) if (N.id === w) return { B: H, c: N };
      return null;
    },
    b = () => {
      if (!l.ok) return [];
      const w = [];
      return (
        e.forEach((H) =>
          H.caps.forEach((N) =>
            (N.c || []).forEach((W, Te) =>
              w.push({
                id: N.id + "#" + Te,
                cap: N.id,
                B: H,
                c: N,
                f: W[0],
                v: W[1],
              }),
            ),
          ),
        ),
        w
      );
    },
    y = [0, 1, 3, 7, 15, 30, 60],
    j = () => {
      const w = x(),
        H = enHoje();
      return b().filter((N) => w[N.id] && w[N.id].p <= H);
    },
    k = () => {
      const w = x();
      return b().filter((H) => !w[H.id]);
    },
    A = () =>
      (t || []).map((w) => ({
        id: "cg" + w[0] + "-" + w[1],
        b: "cg",
        s: w[0],
        n: w[1],
        q: w[2],
        o: w[3],
        r: w[4],
        tp: w[5],
        img: a[w[0] + "-" + w[1]] || null,
      })),
    C = () =>
      o.map((w) => ({
        id: "mc" + w[1],
        b: "mc",
        c: w[0],
        n: w[1],
        q: w[2],
        o: w[3],
        r: w[4],
        tp: "mc" + w[0],
      })),
    I = () =>
      (s || []).map((w, H) => ({
        id: "hq" + H,
        b: "hull",
        c: w[0],
        n: H + 1,
        q: w[1],
        o: w[2],
        r: w[3],
        e: w[4],
        tp: "h" + w[0],
      })),
    J = () => A().concat(C(), I()),
    se = (w) => J().find((H) => H.id === w),
    Ie = (w) => {
      w = w.slice();
      for (let H = w.length - 1; H > 0; H--) {
        const N = Math.floor(Math.random() * (H + 1));
        [w[H], w[N]] = [w[N], w[H]];
      }
      return w;
    },
    Pe = (w) =>
      w.b === "cg"
        ? r[w.tp] || "Outros"
        : w.b === "hull"
          ? "Hull · cap. " + w.c
          : "Pinheiro · cap. " + w.c,
    Me = (w) =>
      w.b === "cg" ? "cg-" + w.tp : w.b === "hull" ? "h" + w.c : "mc" + w.c,
    ue = (w) =>
      esc(w)
        .replace(/\s(?=(?:I{1,3}|IV|V|VI)\s?[\u2013-]\s)/g, "<br>")
        .replace(/\s\u2022\s/g, "<br>• ")
        .replace(
          /\s(?=(Est\xe1 correto|Est\xe3o corretas|\xc9 correto|Com base|Assinale|Considerando que|Analisando))/g,
          "<br>",
        ),
    ve = "abcde";
  function he(w) {
    const H = estMats();
    return w === "cnpi"
      ? H.find((N) => N.foco === "cnpi") || H.find((N) => N.k === "cnpi")
      : H.find((N) => N.k === "liv") ||
          H.find((N) => N.n === "Livros") ||
          H.find((N) => N.foco === "liv");
  }
  function we({
    foco: w,
    top: H,
    tipo: N,
    min: W = 0,
    q: Te = 0,
    ok: V = 0,
    pag: ae = 0,
  }) {
    const ee = he(w);
    if (!ee) return;
    const le = enHoje(),
      Y = {
        id: "r" + Date.now().toString(36),
        d: le,
        mat: ee.k,
        n: ee.n,
        top: String(H || "").slice(0, 90),
        tipo: N,
        min: W,
        q: Te,
        ok: V,
        pag: ae,
        nota: "",
        em: Date.now(),
      };
    if (
      (estReg().push(Y),
      W &&
        focoLog().push({
          d: le,
          min: W,
          mat: ee.foco || "out",
          n: ee.n,
          reg: Y.id,
        }),
      Y.top && ["teoria", "aula", "leitura"].includes(N))
    ) {
      const q = estRev();
      q.some((L) => !L.feita && L.mat === ee.k && L.top === Y.top) ||
        EST_REV.forEach((L, F) =>
          q.push({
            id: "v" + Date.now().toString(36) + F,
            mat: ee.k,
            n: ee.n,
            top: Y.top,
            d: diasMais(le, L),
            n2: F + 1,
            feita: 0,
          }),
        );
    }
  }
  function Be(w) {
    const H = f();
    return w.caps.filter((N) => H[N.id]).length;
  }
  function Ge() {
    const w = j().length,
      H = k().length,
      N = b().length;
    return `<div class="card e2fc"><div><b>Cartões de revisão</b><div class="sm mut">${w ? `<b class="am">${w}</b> para revisar hoje` : "Nada vencido hoje"} · ${N - H} de ${N} já estudados</div></div>
  <div class="e2row">${w ? `<button class="btn" data-e2fc="due">Revisar ${w}</button>` : ""}<button class="btn s" data-e2fc="novos">Aprender 10 novos</button></div></div>
  <div class="card e2opc"><div><b>Opções na prática</b><div class="sm mut">${n.length} estratégias com gráfico de resultado e o laboratório Black-Scholes, gregas e árvore binomial (Hull).</div></div><div class="e2row"><button class="btn" data-e2estr="lista">Guia de estratégias</button><button class="btn s" data-e2labo="1">Laboratório</button></div></div>
  <div class="e2libs">${e
    .map((W) => {
      const Te = Be(W),
        V = W.caps.length;
      return `<button class="card e2lib" data-e2bib="${W.id}" style="--bc:${W.cor}"><i></i><span><b>${esc(W.t)}</b><small>${esc(W.a)}</small><em><span style="width:${Math.round((Te / V) * 100)}%"></span></em><small>${Te} de ${V} capítulos lidos · ${W.caps.reduce((ae, ee) => ae + (ee.c || []).length, 0)} cartões</small></span></button>`;
    })
    .join("")}</div>
  <div class="sm mut" style="margin-top:8px">Os resumos, dicas e cartões foram montados a partir dos seus PDFs: <i>O mercado de renda fixa no Brasil</i>, <i>Mercado de Capitais</i> (Pinheiro), a apostila CFP® e os 5 simulados do CNPI CG.</div>`;
  }
  function Ce(w) {
    const H = f();
    return `<button class="lnk e2back" data-e2bib="">‹ Biblioteca</button><h2 style="margin:6px 0 2px">${esc(w.t)}</h2><div class="sm mut" style="margin-bottom:10px">${esc(w.a)}</div>
  ${w.id === "hull" ? `<div class="e2row" style="margin-bottom:12px"><button class="btn" data-e2estr="lista">Guia de estratégias (${n.length})</button><button class="btn s" data-e2labo="1">Laboratório de opções</button><button class="btn s" data-e2hull="1">Questões do Hull</button></div>` : ""}
  <div class="card" style="padding:6px 14px">${w.caps.map((N, W) => `<button class="e2cap" data-e2cap="${N.id}"><span class="e2n${H[N.id] ? " ok" : ""}">${H[N.id] ? "✓" : W + 1}</span><span><b>${esc(N.t)}</b><small>${(N.r || []).length} pontos · ${(N.c || []).length} cartões${N.f ? " · fórmulas" : ""}</small></span><span class="mut">›</span></button>`).join("")}</div>`;
  }
  function Qe(w) {
    const H = h(w);
    if (!H) return Ge();
    const { B: N, c: W } = H,
      Te = f(),
      V = N.caps.indexOf(W),
      ae = N.caps[V + 1],
      ee = N.caps[V - 1],
      le =
        N.id === "cg"
          ? A().filter((Y) => Y.tp === W.tp).length
          : N.id === "mc"
            ? C().filter((Y) => "mc" + Y.c === W.id).length
            : 0;
    return `<button class="lnk e2back" data-e2bib="${N.id}">‹ ${esc(N.t)}</button>
  <h2 style="margin:6px 0 2px">${esc(W.t)}</h2><div class="sm mut" style="margin-bottom:10px">Capítulo ${V + 1} de ${N.caps.length}${Te[W.id] ? " · lido em " + new Date(Te[W.id]).toLocaleDateString("pt-BR") : ""}</div>
  <div class="card"><div class="seclb">Resumo</div><ul class="e2ul">${W.r.map((Y) => `<li>${esc(Y)}</li>`).join("")}</ul></div>
  ${W.d && W.d.length ? `<div class="card e2dica"><div class="seclb">Dicas de prova</div><ul class="e2ul">${W.d.map((Y) => `<li>${esc(Y)}</li>`).join("")}</ul></div>` : ""}
  ${W.f && W.f.length ? `<div class="card"><div class="seclb">Fórmulas</div>${W.f.map((Y) => `<div class="e2f">${esc(Y)}</div>`).join("")}</div>` : ""}
  <div class="card"><div class="seclb">Cartões (${(W.c || []).length})</div>${(W.c || []).map(([Y, q]) => `<details class="e2det"><summary>${esc(Y)}</summary><div>${esc(q)}</div></details>`).join("")}
  <div class="e2row" style="margin-top:10px"><button class="btn s" data-e2fc="cap:${W.id}">Treinar estes cartões</button>${le ? `<button class="btn s" data-e2qcap="${W.id}">Fazer ${Math.min(le, 15)} questões do tema</button>` : ""}</div></div>
  <div class="e2row">${Te[W.id] ? `<button class="btn s" data-e2lido="${W.id}" data-x="1">Desmarcar leitura</button>` : `<button class="btn" data-e2lido="${W.id}">Marcar como lido</button>`}</div>
  <div class="sm mut" style="margin:6px 0 12px">Ao marcar como lido, entra no seu registro de estudo e as revisões de 1, 7 e 30 dias são agendadas.</div>
  <div class="e2nav">${ee ? `<button class="btn s" data-e2cap="${ee.id}">‹ ${esc(ee.t)}</button>` : "<span></span>"}${ae ? `<button class="btn s" data-e2cap="${ae.id}">${esc(ae.t)} ›</button>` : ""}</div>`;
  }
  function de(w) {
    let H;
    if (
      (w === "due"
        ? (H = j())
        : w === "novos"
          ? (H = k().slice(0, 10))
          : w.startsWith("cap:")
            ? (H = b().filter((N) => N.cap === w.slice(4)))
            : (H = []),
      !H.length)
    ) {
      toast(
        w === "novos"
          ? "Você já estudou todos os cartões."
          : "Nenhum cartão aqui.",
      );
      return;
    }
    ((u.fc = {
      ids: Ie(H.map((N) => N.id)),
      i: 0,
      vira: !1,
      ok: 0,
      err: 0,
      t0: Date.now(),
    }),
      (EST.v = "bib"),
      render(),
      scrollTo(0, 0));
  }
  function Se() {
    const w = u.fc,
      H = w.ids[w.i];
    if (!H) return Je();
    const N = b().find((W) => W.id === H);
    return N
      ? `<div class="e2top"><button class="lnk" data-e2fcsai="1">‹ Sair</button><span class="sm mut">${w.i + 1} de ${w.ids.length}</span></div><div class="e2pb"><i style="width:${Math.round((w.i / w.ids.length) * 100)}%"></i></div>
  <div class="card e2card"><small class="mut">${esc(N.B.t)} · ${esc(N.c.t)}</small><div class="e2q">${esc(N.f)}</div>${w.vira ? `<div class="e2a">${esc(N.v)}</div>` : ""}</div>
  ${w.vira ? '<div class="e2g3"><button class="btn s e2err" data-e2fcr="0">Errei</button><button class="btn s" data-e2fcr="1">Difícil</button><button class="btn e2ok" data-e2fcr="2">Acertei</button></div>' : '<button class="btn" style="width:100%" data-e2fcv="1">Mostrar resposta</button>'}`
      : (w.i++, Se());
  }
  function Ve(w) {
    const H = u.fc,
      N = H.ids[H.i],
      W = x(),
      Te = W[N] || { cx: 0 };
    (w === 0
      ? ((Te.cx = 1), H.err++, H.ids.push(N))
      : w === 1
        ? (Te.cx = Math.max(1, Te.cx))
        : ((Te.cx = Math.min(y.length - 1, (Te.cx || 0) + 1)), H.ok++),
      (Te.p = diasMais(enHoje(), w === 0 ? 0 : y[Te.cx])),
      (Te.u = Date.now()),
      (W[N] = Te),
      H.i++,
      (H.vira = !1),
      save(),
      render());
  }
  function Je() {
    const w = u.fc,
      H = Math.max(1, Math.round((Date.now() - w.t0) / 6e4));
    return `<div class="card e2res"><b class="g" style="font-size:22px">Sessão concluída</b><div class="sm mut">${w.ok} acertos · ${w.err} para rever · ${H} min</div>
  <div class="e2row" style="justify-content:center;margin-top:10px"><button class="btn" data-e2fcfim="1">Concluir e registrar</button></div></div>`;
  }
  function Ye(w) {
    const H = v().filter((N) => N.b === w);
    return H.length ? Math.max(...H.map((N) => N.pc)) : null;
  }
  function Xe() {
    const w = v(),
      H = Object.keys(g()).filter((W) => se(W)),
      N = Object.entries(r).map(([W, Te]) => [
        W,
        Te + " (" + A().filter((V) => V.tp === W).length + ")",
      ]);
    return `${be()}<div class="card"><b>CNPI · Conteúdo Global</b><div class="sm mut">5 simulados de 60 questões com gabarito (Academia Rafael Toro, jul/2024). Meta para aprovação: 70%.</div>
  <label>Modo<select id="e2modo" class="selch"><option value="treino">Treino: correção a cada questão</option><option value="prova">Prova: cronômetro e correção no fim</option></select></label>
  <div class="e2sims">${[1, 2, 3, 4, 5]
    .map((W) => {
      const Te = Ye("cg" + W);
      return `<button class="e2sim" data-e2sim="cg${W}"><b>Simulado ${W}</b><small>60 questões</small>${Te != null ? `<em class="${Te >= 70 ? "g" : "am"}">melhor ${Te}%</em>` : '<em class="mut">não feito</em>'}</button>`;
    })
    .join("")}</div></div>
  <div class="card"><b>Treino por tema</b><div class="sm mut">Questões sorteadas dos 5 simulados.</div>
  <div class="g2"><label>Tema<select id="e2tema" class="selch"><option value="all">Todos os temas (300)</option>${N.map(([W, Te]) => `<option value="${W}">${esc(Te)}</option>`).join("")}</select></label>
  <label>Quantidade<select id="e2qtd" class="selch">${[10, 20, 30, 60].map((W) => `<option value="${W}">${W} questões</option>`).join("")}</select></label></div>
  <button class="btn" data-e2tema="1">Começar treino</button></div>
  <div class="card"><b>Mercado de Capitais (Pinheiro)</b><div class="sm mut">${C().length} questões dos testes de verificação do livro, com gabarito.</div>
  <label>Capítulo<select id="e2mccap" class="selch"><option value="all">Todos os capítulos</option>${i.caps
    .map((W, Te) => {
      const V = C().filter((ae) => ae.c === Te + 1).length;
      return V
        ? `<option value="${Te + 1}">${Te + 1}. ${esc(W.t)} (${V})</option>`
        : "";
    })
    .join("")}</select></label>
  <button class="btn" data-e2mc="1">Começar</button></div>
  ${xe()}
  <div class="card"><b>Caderno de erros</b><div class="sm mut">${H.length ? `${H.length} questões que você errou. Acertou duas vezes seguidas, ela sai do caderno.` : "Vazio. As questões que você errar aparecem aqui para revisar."}</div>${H.length ? `<button class="btn" data-e2err="1">Revisar ${Math.min(H.length, 20)} erros</button>` : ""}</div>
  ${X()}${
    w.length
      ? `<div class="card"><b>Histórico</b>${w
          .slice(-8)
          .reverse()
          .map(
            (W) =>
              `<div class="e2h"><span>${esc(W.t)}<small class="mut"> · ${new Date(W.em).toLocaleDateString("pt-BR")}${W.min ? " · " + estHm(W.min) : ""}</small></span><b class="${W.pc >= 70 ? "g" : "am"}">${W.ok}/${W.q} · ${W.pc}%</b></div>`,
          )
          .join("")}</div>`
      : ""
  }`;
  }
  function ot(w, H, N, W) {
    if (!w.length) {
      toast("Nenhuma questão.");
      return;
    }
    ((u.ses = {
      ids: w,
      t: H,
      b: N,
      modo: W || "treino",
      i: 0,
      resp: {},
      t0: Date.now(),
    }),
      (u.res = null),
      m(),
      (EST.v = "sim"),
      render(),
      scrollTo(0, 0));
  }
  function Ke() {
    const w = u.ses,
      H = w.ids[w.i],
      N = se(H);
    if (!N) return "";
    const W = w.resp[H],
      Te = w.modo === "prova",
      V = !Te && W != null,
      ae = Math.floor((Date.now() - w.t0) / 6e4),
      ee = N.o
        .map((Y, q) => {
          let L = "";
          return (
            V
              ? q === N.r
                ? (L = " ok")
                : q === W && (L = " err")
              : Te && q === W && (L = " sel"),
            `<button class="e2op${L}" data-e2op="${q}"${V ? " disabled" : ""}><b>${ve[q]})</b><span>${esc(Y)}</span></button>`
          );
        })
        .join(""),
      le = h(Me(N));
    return `<div class="e2top"><button class="lnk" data-e2sai="1">‹ Sair</button><span class="sm mut">${esc(w.t)} · ${w.i + 1} de ${w.ids.length}${Te ? ` · <span data-e2rel>${ae} min</span>` : ""}</span></div>
  <div class="e2pb"><i style="width:${Math.round((Object.keys(w.resp).length / w.ids.length) * 100)}%"></i></div>
  <div class="card e2qc"><small class="mut">${N.b === "cg" ? "Simulado " + N.s + " · questão " + N.n : "Pinheiro · teste " + N.n} · ${esc(Pe(N))}</small>
  ${N.img ? `<div class="e2imgw"><img class="e2img" src="data:image/jpeg;base64,${N.img}" alt="Tabela ou gráfico da questão"></div><small class="mut">Arraste para os lados para ver a tabela inteira.</small>` : ""}<div class="e2qt">${ue(N.q)}</div><div class="e2ops">${ee}</div>
  ${V ? `<div class="e2fb ${W === N.r ? "ok" : "err"}"><b>${W === N.r ? "Certo!" : "Resposta certa: " + ve[N.r] + ")"}</b>${le ? `<button class="lnk" data-e2cap="${le.c.id}">Estudar: ${esc(le.c.t)} ›</button>` : ""}</div>${z(N, W)}` : ""}</div>
  <div class="e2nav">${w.i > 0 ? '<button class="btn s" data-e2nv="-1">‹ Anterior</button>' : "<span></span>"}${w.i < w.ids.length - 1 ? `<button class="btn${V ? "" : " s"}" data-e2nv="1">Próxima ›</button>` : `<button class="btn" data-e2fim="1">${Te ? "Entregar prova" : "Ver resultado"}</button>`}</div>
  ${Te ? `<div class="e2grid">${w.ids.map((Y, q) => `<button class="${q === w.i ? "cur " : ""}${w.resp[Y] != null ? "r" : ""}" data-e2go="${q}">${q + 1}</button>`).join("")}</div>` : ""}`;
  }
  function at() {
    const w = u.ses;
    if (!w) return;
    const H = w.ids.map(se).filter(Boolean),
      N = g();
    let W = 0;
    const Te = {};
    if (
      w.modo === "prova" &&
      Object.keys(w.resp).length < H.length &&
      !u.confirma
    ) {
      ((u.confirma = 1),
        toast(
          `Faltam ${H.length - Object.keys(w.resp).length} questões. Toque de novo para entregar.`,
          4e3,
        ));
      return;
    }
    ((u.confirma = 0),
      H.forEach((ee) => {
        const le = w.resp[ee.id],
          Y = le === ee.r;
        Y && W++;
        const q = Pe(ee);
        ((Te[q] ?? (Te[q] = [0, 0]))[0]++,
          Y && Te[q][1]++,
          le != null &&
            (Y
              ? N[ee.id] &&
                ((N[ee.id].s = (N[ee.id].s || 0) + 1),
                N[ee.id].s >= 2 && delete N[ee.id])
              : (N[ee.id] = {
                  e: ((N[ee.id] || {}).e || 0) + 1,
                  s: 0,
                  d: enHoje(),
                })));
      }));
    const V = Math.max(1, Math.round((Date.now() - w.t0) / 6e4)),
      ae = Math.round((W / H.length) * 100);
    (v().push({
      b: w.b,
      t: w.t,
      q: H.length,
      ok: W,
      pc: ae,
      min: V,
      em: Date.now(),
      tp: Object.fromEntries(Object.entries(Te).map(([ee, le]) => [ee, le])),
    }),
      we({
        foco: "cnpi",
        top: w.t,
        tipo: "questoes",
        min: V,
        q: H.length,
        ok: W,
      }),
      (u.res = {
        t: w.t,
        q: H.length,
        ok: W,
        pc: ae,
        min: V,
        tp: Te,
        err: H.filter((ee) => w.resp[ee.id] !== ee.r).map((ee) => ({
          id: ee.id,
          r: w.resp[ee.id],
        })),
      }),
      (u.ses = null),
      m(),
      save(),
      render(),
      scrollTo(0, 0));
  }
  function rt() {
    const w = u.res;
    return `<div class="card e2res"><small class="mut">${esc(w.t)}</small><b class="${w.pc >= 70 ? "g" : "am"}" style="font-size:40px">${w.pc}%</b><div>${w.ok} de ${w.q} certas · ${estHm(w.min)}</div>
  <div class="sm ${w.pc >= 70 ? "g" : "am"}" style="margin-top:4px">${w.pc >= 70 ? "Acima da meta de 70%." : "Abaixo da meta de 70%. Revise os temas mais fracos."}</div></div>
  <div class="card"><b>Por tema</b>${Object.entries(w.tp)
    .sort((H, N) => H[1][1] / H[1][0] - N[1][1] / N[1][0])
    .map(([H, [N, W]]) => {
      const Te = Math.round((W / N) * 100);
      return `<div class="estbar"><span>${esc(H)}</span><div><i style="width:${Te}%;background:${Te >= 70 ? "var(--g)" : "var(--am)"}"></i></div><b>${W}/${N}</b></div>`;
    })
    .join("")}</div>
  ${
    w.err.length
      ? `<div class="card"><b>Questões que você errou (${w.err.length})</b>${w.err
          .slice(0, 30)
          .map((H) => {
            const N = se(H.id);
            return N
              ? `<details class="e2det"><summary>${esc(N.q.slice(0, 110))}${N.q.length > 110 ? "…" : ""}</summary><div>${N.img ? `<img class="e2img" src="data:image/jpeg;base64,${N.img}" alt="">` : ""}<div class="e2qt">${ue(N.q)}</div>${N.o.map((W, Te) => `<div class="e2rv${Te === N.r ? " ok" : Te === H.r ? " err" : ""}"><b>${ve[Te]})</b> ${esc(W)}</div>`).join("")}${z(N, H.r)}</div></details>`
              : "";
          })
          .join("")}</div>`
      : ""
  }
  <div class="e2row"><button class="btn" data-e2novo="1">Voltar aos simulados</button>${w.err.length ? '<button class="btn s" data-e2err="1">Revisar erros agora</button>' : ""}</div>
  <div class="sm mut" style="margin-top:6px">Registrado no seu estudo (CNPI): ${w.q} questões, ${w.ok} acertos.</div>`;
  }
  {
    const w = estChips;
    estChips = function () {
      return w
        .apply(this, arguments)
        .replace(
          '<button class="' +
            (EST.v === "reg" ? "on" : "") +
            '" data-estv="reg">',
          `<button class="${EST.v === "bib" ? "on" : ""}" data-estv="bib">Biblioteca</button><button class="${EST.v === "sim" ? "on" : ""}" data-estv="sim">Simulados</button>$&`,
        );
    };
  }
  {
    const w = estHtml;
    estHtml = function () {
      const H = EST.v;
      if (H !== "bib" && H !== "sim") return w.apply(this, arguments);
      let N = "";
      try {
        N = estSeg("est");
      } catch {
        N = EN_SG();
      }
      N = N.replace(/ class="on"/g, "").replace(
        /(<div class="seg"[^>]*>)/,
        '$1<button class="on" data-ep="esv" data-id="est">📒 Meu estudo</button>',
      );
      let W;
      return (
        c()
          ? H === "bib"
            ? (W = u.fc
                ? Se()
                : u.estr
                  ? u.estr === "lista"
                    ? Q()
                    : re(u.estr)
                  : u.lab
                    ? ie()
                    : u.cap
                      ? Qe(u.cap)
                      : u.bib
                        ? Ce(e.find((Te) => Te.id === u.bib))
                        : Ge())
            : H === "sim" && (W = u.ses ? Ke() : u.res ? rt() : Xe())
          : (W = p()),
        `<h1>Estudos</h1>${N}${(H === "bib" && u.fc) || (H === "sim" && u.ses) ? "" : estChips()}<div class="e2">${W}</div>`
      );
    };
  }
  {
    const w = estHoje;
    estHoje = function () {
      c();
      const H = j().length,
        N = v(),
        W = N[N.length - 1],
        Te = `<div class="card e2fc" style="margin-top:10px"><div><b>Biblioteca e simulados</b><div class="sm mut">${H ? `<b class="am">${H}</b> cartões para revisar` : "Cartões em dia"}${W ? ` · último simulado: <b class="${W.pc >= 70 ? "g" : "am"}">${W.pc}%</b>` : ""}${u.ses ? ' · <b class="am">simulado em andamento</b>' : ""}</div>${$e()}</div><div class="e2row">${H ? '<button class="btn s" data-e2fc="due">Revisar</button>' : ""}<button class="btn s" data-estv="sim">${u.ses ? "Continuar" : "Simulados"}</button></div></div>`;
      return w.apply(this, arguments) + Te;
    };
  }
  {
    const w = estConq;
    estConq = function () {
      const H = w.apply(this, arguments),
        N = v(),
        W = Object.keys(f()).length,
        Te = Object.keys(x()).length;
      return H.concat([
        [
          "📝",
          "Primeiro simulado",
          "Terminou um simulado ou treino",
          N.length >= 1,
        ],
        [
          "🏆",
          "Acima da meta",
          "70% ou mais num simulado completo do CNPI",
          N.some((V) => /^cg\d$/.test(V.b) && V.pc >= 70),
        ],
        [
          "🎖️",
          "Os cinco simulados",
          "Fez os 5 simulados completos do CNPI",
          [1, 2, 3, 4, 5].every((V) => N.some((ae) => ae.b === "cg" + V)),
        ],
        ["📖", "Leitor", "10 capítulos da biblioteca lidos", W >= 10],
        ["🗂️", "Cem cartões", "100 cartões estudados", Te >= 100],
      ]);
    };
  }
  document.addEventListener(
    "click",
    (w) => {
      const H = (W) => w.target.closest && w.target.closest(W);
      let N;
      if ((N = H("[data-e2bib]"))) {
        ((u.estr = null),
          (u.lab = null),
          (u.bib = N.dataset.e2bib || null),
          (u.cap = null),
          (EST.v = "bib"),
          render(),
          scrollTo(0, 0));
        return;
      }
      if ((N = H("[data-e2cap]"))) {
        const W = h(N.dataset.e2cap);
        if (!W) return;
        ((u.estr = null),
          (u.lab = null),
          (u.bib = W.B.id),
          (u.cap = W.c.id),
          (u.fc = null),
          (EST.v = "bib"),
          render(),
          scrollTo(0, 0));
        return;
      }
      if ((N = H("[data-e2lido]"))) {
        const W = f(),
          Te = N.dataset.e2lido,
          V = h(Te);
        if (N.dataset.x) {
          (delete W[Te], save(), render());
          return;
        }
        ((W[Te] = Date.now()),
          we({
            foco: V.B.mat,
            top:
              (V.B.id === "cg"
                ? "CNPI · "
                : V.B.id === "mc"
                  ? "Pinheiro · "
                  : V.B.id === "rf"
                    ? "Renda fixa · "
                    : "CFP · ") + V.c.t,
            tipo: "leitura",
            min: 0,
            pag: 0,
          }),
          save(),
          toast("Capítulo lido. Revisões marcadas para 1, 7 e 30 dias.", 3500),
          render());
        return;
      }
      if ((N = H("[data-e2fc]"))) {
        de(N.dataset.e2fc);
        return;
      }
      if (H("[data-e2fcv]")) {
        u.fc && ((u.fc.vira = !0), render());
        return;
      }
      if ((N = H("[data-e2fcr]"))) {
        u.fc && Ve(+N.dataset.e2fcr);
        return;
      }
      if (H("[data-e2fcsai]") || H("[data-e2fcfim]")) {
        const W = u.fc;
        if (W && W.i > 0) {
          const Te = Math.max(1, Math.round((Date.now() - W.t0) / 6e4));
          (we({
            foco: "liv",
            top: "Cartões da biblioteca",
            tipo: "revisao",
            min: Te,
            q: W.ok + W.err,
            ok: W.ok,
          }),
            save());
        }
        ((u.fc = null), render(), scrollTo(0, 0));
        return;
      }
      if ((N = H("[data-e2sim]"))) {
        const W = +N.dataset.e2sim.slice(2),
          Te = (document.getElementById("e2modo") || {}).value || "treino";
        ot(
          A()
            .filter((V) => V.s === W)
            .map((V) => V.id),
          "CNPI CG · Simulado " + W,
          "cg" + W,
          Te,
        );
        return;
      }
      if (H("[data-e2tema]")) {
        const W = (document.getElementById("e2tema") || {}).value || "all",
          Te = +((document.getElementById("e2qtd") || {}).value || 10),
          V = (document.getElementById("e2modo") || {}).value || "treino";
        ot(
          Ie(A().filter((ae) => W === "all" || ae.tp === W))
            .slice(0, Te)
            .map((ae) => ae.id),
          "Treino · " + (W === "all" ? "todos os temas" : r[W]),
          "tema",
          V,
        );
        return;
      }
      if (H("[data-e2mc]")) {
        const W = (document.getElementById("e2mccap") || {}).value || "all",
          Te = (document.getElementById("e2modo") || {}).value || "treino";
        ot(
          Ie(C().filter((V) => W === "all" || V.c === +W)).map((V) => V.id),
          "Pinheiro · " + (W === "all" ? "todos os capítulos" : "cap. " + W),
          "mc",
          Te,
        );
        return;
      }
      if ((N = H("[data-e2qcap]"))) {
        const W = h(N.dataset.e2qcap);
        if (!W) return;
        const Te =
          W.B.id === "cg"
            ? A().filter((V) => V.tp === W.c.tp)
            : C().filter((V) => "mc" + V.c === W.c.id);
        ot(
          Ie(Te)
            .slice(0, 15)
            .map((V) => V.id),
          "Treino · " + W.c.t,
          "tema",
          "treino",
        );
        return;
      }
      if (H("[data-e2err]")) {
        ot(
          Ie(Object.keys(g()).filter((W) => se(W))).slice(0, 20),
          "Caderno de erros",
          "err",
          "treino",
        );
        return;
      }
      if ((N = H("[data-e2op]"))) {
        const W = u.ses;
        if (!W) return;
        const Te = W.ids[W.i];
        if (W.modo !== "prova" && W.resp[Te] != null) return;
        ((W.resp[Te] = +N.dataset.e2op),
          m(),
          W.modo === "prova" && W.i < W.ids.length - 1
            ? (W.i++, render(), scrollTo(0, 0))
            : render());
        return;
      }
      if ((N = H("[data-e2nv]"))) {
        const W = u.ses;
        if (!W) return;
        ((W.i = Math.max(0, Math.min(W.ids.length - 1, W.i + +N.dataset.e2nv))),
          m(),
          render(),
          scrollTo(0, 0));
        return;
      }
      if ((N = H("[data-e2go]"))) {
        const W = u.ses;
        if (!W) return;
        ((W.i = +N.dataset.e2go), render(), scrollTo(0, 0));
        return;
      }
      if (H("[data-e2fim]")) {
        at();
        return;
      }
      if (H("[data-e2sai]")) {
        ((u.ses = null), m(), render(), scrollTo(0, 0));
        return;
      }
      if (H("[data-e2novo]")) {
        ((u.res = null), render(), scrollTo(0, 0));
        return;
      }
      if (H("[data-e2retenta]")) {
        ((l.erro = 0), c(), render());
        return;
      }
      (N = H("[data-estv]")) &&
        (N.dataset.estv === "bib" && !u.fc && ((u.cap = null), (u.bib = null)),
        N.dataset.estv === "sim" && u.res && !u.ses && (u.res = null));
    },
    !0,
  );
  {
    const w = TraderStyles.slot("legacy-107");
    ((w.id = "est185"),
      (w.textContent = TraderStyles.css("legacy-107")),
      TraderStyles.mount(w));
  }
  try {
    Object.assign(window, { E2: u, E2D: l, e2Carrega: c });
  } catch {}
  setInterval(() => {
    try {
      const w = document.querySelector("[data-e2rel]");
      w &&
        u.ses &&
        (w.textContent = Math.floor((Date.now() - u.ses.t0) / 6e4) + " min");
    } catch {}
  }, 15e3);
  try {
    FN_ESPERADA.analise = "v236";
  } catch {}
  const dt = (w) => Math.exp((-w * w) / 2) / Math.sqrt(2 * Math.PI);
  function vt(w) {
    const H = 1 / (1 + 0.2316419 * Math.abs(w)),
      N = 0.3989422804014327 * Math.exp((-w * w) / 2),
      W =
        N *
        H *
        (0.31938153 +
          H *
            (-0.356563782 +
              H * (1.781477937 + H * (-1.821255978 + H * 1.330274429))));
    return w > 0 ? 1 - W : W;
  }
  function ft(w, H, N, W, Te, V, ae = 0) {
    if (W <= 1e-9 || V <= 0)
      return {
        p: Math.max(w === "C" ? H - N : N - H, 0),
        d: w === "C" ? (H > N ? 1 : 0) : H < N ? -1 : 0,
        g: 0,
        t: 0,
        v: 0,
        rho: 0,
        n2: w === "C" ? (H > N ? 1 : 0) : H < N ? 1 : 0,
      };
    const ee = V * Math.sqrt(W),
      le = (Math.log(H / N) + (Te - ae + (V * V) / 2) * W) / ee,
      Y = le - ee,
      q = Math.exp(-ae * W),
      L = Math.exp(-Te * W),
      F = (q * dt(le)) / (H * ee),
      O = (H * q * Math.sqrt(W) * dt(le)) / 100;
    return w === "C"
      ? {
          p: H * q * vt(le) - N * L * vt(Y),
          d: q * vt(le),
          g: F,
          v: O,
          t:
            ((-H * q * dt(le) * V) / (2 * Math.sqrt(W)) -
              Te * N * L * vt(Y) +
              ae * H * q * vt(le)) /
            252,
          rho: (N * W * L * vt(Y)) / 100,
          n2: vt(Y),
          d1: le,
          d2: Y,
        }
      : {
          p: N * L * vt(-Y) - H * q * vt(-le),
          d: q * (vt(le) - 1),
          g: F,
          v: O,
          t:
            ((-H * q * dt(le) * V) / (2 * Math.sqrt(W)) +
              Te * N * L * vt(-Y) -
              ae * H * q * vt(-le)) /
            252,
          rho: (-N * W * L * vt(-Y)) / 100,
          n2: vt(-Y),
          d1: le,
          d2: Y,
        };
  }
  function ht(w, H, N, W, Te, V, ae = 0) {
    let ee = 0.001,
      le = 5;
    const Y = (q) => ft(w, N, W, Te, V, q, ae).p - H;
    if (Y(ee) > 0 || Y(le) < 0) return null;
    for (let q = 0; q < 80; q++) {
      const L = (ee + le) / 2;
      Y(L) > 0 ? (le = L) : (ee = L);
    }
    return (ee + le) / 2;
  }
  function qe(w, H, N, W, Te, V, ae, ee, le = 0) {
    const Y = W / ae,
      q = Math.exp(V * Math.sqrt(Y)),
      L = 1 / q,
      F = Math.exp((Te - le) * Y),
      O = (F - L) / (q - L),
      ne = Math.exp(-Te * Y);
    let Ee = [];
    for (let Ae = 0; Ae <= ae; Ae++) {
      const ge = H * Math.pow(q, Ae) * Math.pow(L, ae - Ae);
      Ee.push(Math.max(w === "C" ? ge - N : N - ge, 0));
    }
    for (let Ae = ae - 1; Ae >= 0; Ae--)
      for (let ge = 0; ge <= Ae; ge++) {
        let je = ne * (O * Ee[ge + 1] + (1 - O) * Ee[ge]);
        if (ee) {
          const Ze = H * Math.pow(q, ge) * Math.pow(L, Ae - ge);
          je = Math.max(je, w === "C" ? Ze - N : N - Ze);
        }
        Ee[ge] = je;
      }
    return { p: Ee[0], u: q, d: L, pr: O };
  }
  const Le = (w) => Math.log(1 + w),
    ke = (w, H = 2) =>
      w == null || !isFinite(w)
        ? "—"
        : Number(w).toLocaleString("pt-BR", {
            minimumFractionDigits: H,
            maximumFractionDigits: H,
          });
  function ze(w) {
    return {
      S: 100,
      vol: 30,
      dc: 21,
      dl: 63,
      ju: 14,
      ks: w.ks.map((H) => +H.toFixed(2)),
    };
  }
  function Ue(w, H) {
    const N = Le(H.ju / 100),
      W = H.dc / 252,
      Te = Math.max(H.dl, H.dc + 1) / 252;
    return w.L.map((V) => {
      const ae = V.v === "L" ? Te : W,
        ee = V.k != null ? (H.ks[V.k] * H.S) / 100 : null;
      let le = 0;
      return (
        V.t === "C" || V.t === "P"
          ? (le = ft(V.t, H.S, ee, ae, N, H.vol / 100).p)
          : V.t === "S"
            ? (le = H.S)
            : V.t === "B" && (le = H.S * Math.exp(-N * W)),
        { ...V, K: ee, T: ae, pr: le }
      );
    });
  }
  function We(w, H, N, W) {
    const Te = Le(W.ju / 100);
    let V = 0;
    for (const ae of w) {
      const ee = ae.T - N;
      ae.t === "S"
        ? (V += ae.q * H)
        : ae.t === "B"
          ? (V += ae.q * (ee <= 1e-9 ? W.S : W.S * Math.exp(-Te * ee)))
          : (V += ae.q * ft(ae.t, H, ae.K, Math.max(ee, 0), Te, W.vol / 100).p);
    }
    return V;
  }
  function Re(w, H) {
    const N = Ue(w, H),
      W = N.reduce((E, P) => E + P.q * P.pr, 0),
      Te = Math.min(
        ...N.filter((E) => E.t === "C" || E.t === "P")
          .map((E) => E.T)
          .concat([H.dc / 252]),
      ),
      V = H.S * 0.55,
      ae = H.S * 1.45,
      ee = 240,
      le = [],
      Y = [];
    for (let E = 0; E <= ee; E++) {
      const P = V + ((ae - V) * E) / ee;
      (le.push([P, We(N, P, Te, H) - W]), Y.push([P, We(N, P, 0, H) - W]));
    }
    const q = le.map((E) => E[1]),
      L = Math.max(...q),
      F = Math.min(...q),
      O = (le[ee][1] - le[ee - 1][1]) / ((ae - V) / ee),
      ne = We(N, 1e-4, Te, H) - W,
      Ee = [];
    for (let E = 1; E <= ee; E++) {
      const [P, B] = le[E - 1],
        [G, te] = le[E];
      ((B < 0 && te >= 0) || (B > 0 && te <= 0)) &&
        Ee.push(P + ((G - P) * (0 - B)) / (te - B));
    }
    const Ae = Le(H.ju / 100),
      ge = { d: 0, g: 0, t: 0, v: 0 };
    N.forEach((E) => {
      if (E.t === "S") {
        ge.d += E.q;
        return;
      }
      if (E.t === "B") return;
      const P = ft(E.t, H.S, E.K, E.T, Ae, H.vol / 100);
      ((ge.d += E.q * P.d),
        (ge.g += E.q * P.g),
        (ge.t += E.q * P.t),
        (ge.v += E.q * P.v));
    });
    const je = Math.max(L, ne),
      Ze = Math.min(F, ne),
      He = O > 1e-4 ? "Ilimitado" : je <= 0 ? "Nenhum" : ke(je),
      ce =
        O < -1e-4
          ? "Ilimitada"
          : Ze >= 0
            ? "Nenhuma (lucro mínimo " + ke(Ze) + ")"
            : ke(Ze);
    return {
      legs: N,
      custo: W,
      pts: le,
      hoje: Y,
      gMax: He,
      pMax: ce,
      be: Ee,
      G: ge,
      h: Te,
    };
  }
  function K(w, H, N = 340, W = 190, Te) {
    const V = w.pts.map((je) => je[0]),
      ae = w.pts.concat(Te ? [] : w.hoje).map((je) => je[1]),
      ee = V[0],
      le = V[V.length - 1];
    let Y = Math.min(...ae, 0),
      q = Math.max(...ae, 0);
    const L = (q - Y) * 0.08 || 1;
    ((Y -= L), (q += L));
    const F = (je) =>
        ((je - ee) / (le - ee)) * (N - (Te ? 4 : 44)) + (Te ? 2 : 40),
      O = (je) =>
        W - (Te ? 2 : 18) - ((je - Y) / (q - Y)) * (W - (Te ? 4 : 26)),
      ne = O(0),
      Ee = (je) =>
        je
          .map(
            (Ze, He) =>
              (He ? "L" : "M") +
              F(Ze[0]).toFixed(1) +
              "," +
              O(Ze[1]).toFixed(1),
          )
          .join(""),
      Ae = (je) => {
        let Ze = "";
        return (
          w.pts.forEach((He, ce) => {
            const E = je > 0 ? Math.max(He[1], 0) : Math.min(He[1], 0);
            Ze +=
              (ce ? "L" : "M") + F(He[0]).toFixed(1) + "," + O(E).toFixed(1);
          }),
          Ze +
            "L" +
            F(le).toFixed(1) +
            "," +
            ne.toFixed(1) +
            "L" +
            F(ee).toFixed(1) +
            "," +
            ne.toFixed(1) +
            "Z"
        );
      };
    if (Te)
      return `<svg viewBox="0 0 ${N} ${W}" width="${N}" height="${W}" aria-hidden="true"><path d="${Ae(1)}" fill="rgba(58,173,116,0.25)"/><path d="${Ae(-1)}" fill="rgba(231,97,76,0.22)"/><line x1="0" x2="${N}" y1="${ne}" y2="${ne}" stroke="currentColor" stroke-opacity=".25"/><path d="${Ee(w.pts)}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
    const ge = [Y + L, 0, q - L].filter((je, Ze, He) => He.indexOf(je) === Ze);
    return `<svg class="e2pay" viewBox="0 0 ${N} ${W}" role="img" aria-label="Gráfico de resultado da estratégia">
  <path d="${Ae(1)}" fill="rgba(58,173,116,0.18)"/><path d="${Ae(-1)}" fill="rgba(231,97,76,0.16)"/>
  <line x1="40" x2="${N - 4}" y1="${ne}" y2="${ne}" stroke="currentColor" stroke-opacity=".35"/>
  <line x1="${F(H.S)}" x2="${F(H.S)}" y1="6" y2="${W - 18}" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="3 3"/>
  <path d="${Ee(w.hoje)}" fill="none" stroke="#86abcb" stroke-width="1.4" stroke-dasharray="5 4"/>
  <path d="${Ee(w.pts)}" fill="none" stroke="var(--g)" stroke-width="2.2"/>
  ${w.be.map((je) => `<circle cx="${F(je)}" cy="${ne}" r="3.5" fill="#c9a156"/>`).join("")}
  ${ge.map((je) => `<text x="36" y="${O(je) + 4}" text-anchor="end" font-size="10" fill="currentColor" opacity=".6">${ke(je, 1)}</text>`).join("")}
  ${[ee, H.S, le].map((je) => `<text x="${F(je)}" y="${W - 4}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".6">${ke(je, 0)}</text>`).join("")}
  </svg><div class="e2leg"><span><i style="background:var(--g)"></i>no vencimento${w.legs.some((je) => je.v === "L") ? " da opção curta" : ""}</span><span><i style="background:#86abcb"></i>hoje (Black-Scholes)</span><span><i style="background:#c9a156;border-radius:50%"></i>equilíbrio</span></div>`;
  }
  const pe = [
    "Uma opção",
    "Opção + ação",
    "Travas (spreads)",
    "Borboletas e condors",
    "Volatilidade",
    "Tempo",
    "Outras",
  ];
  function Q() {
    const w = { S: 100, vol: 30, dc: 21, dl: 63, ju: 14 };
    return `<button class="lnk e2back" data-e2bib="hull">‹ Opções (Hull)</button><h2 style="margin:6px 0 2px">Guia de estratégias</h2><div class="sm mut" style="margin-bottom:10px">${n.length} montagens do capítulo 12 do Hull e as mais usadas na B3. Toque para ver o gráfico, os números e quando usar.</div>
  ${pe
    .map((H) => {
      const N = n.filter((W) => W.g === H);
      return N.length
        ? `<div class="seclb" style="margin:14px 0 6px">${esc(H)}</div><div class="e2els">${N.map(
            (W) => {
              const Te = Re(W, { ...w, ks: W.ks });
              return `<button class="e2el" data-e2estr="${W.id}"><span class="e2elg">${K(Te, { ...w, ks: W.ks }, 84, 40, 1)}</span><span><b>${esc(W.n)}</b><small>${esc(W.vis)}</small></span></button>`;
            },
          ).join("")}</div>`
        : "";
    })
    .join("")}`;
  }
  function re(w) {
    const H = n.find((ae) => ae.id === w);
    if (!H) return Q();
    (!u.ep || u.ep.id !== w) && (u.ep = { id: w, ...ze(H) });
    const N = u.ep,
      W = Re(H, N),
      Te = (ae) =>
        ae.t === "S"
          ? "Ação"
          : ae.t === "B"
            ? "Título zero-cupom"
            : (ae.t === "C" ? "Call" : "Put") +
              " " +
              ke(ae.K) +
              (ae.v === "L" ? " (longa)" : ""),
      V = (ae, ee, le) =>
        `<label>${ee}<input type="number" inputmode="decimal" step="${le || 1}" data-e2ep="${ae}" value="${N[ae]}"></label>`;
    return `<button class="lnk e2back" data-e2estr="lista">‹ Guia de estratégias</button>
  <h2 style="margin:6px 0 2px">${esc(H.n)}</h2><div class="e2row" style="margin-bottom:10px"><span class="chip">${esc(H.vis)}</span><span class="chip">${esc(H.g)}</span></div>
  <div class="card">${K(W, N)}
  <div class="e2k4"><div><small>${W.custo >= 0 ? "Débito (paga)" : "Crédito (recebe)"}</small><b>${ke(Math.abs(W.custo))}</b></div><div><small>Ganho máximo</small><b class="g">${W.gMax}</b></div><div><small>Perda máxima</small><b class="r">${W.pMax}</b></div><div><small>Equilíbrio</small><b>${W.be.length ? W.be.map((ae) => ke(ae)).join(" e ") : "—"}</b></div></div>
  <div class="e2k4"><div><small>Delta</small><b>${ke(W.G.d, 2)}</b></div><div><small>Gama</small><b>${ke(W.G.g, 3)}</b></div><div><small>Teta/dia</small><b>${ke(W.G.t, 3)}</b></div><div><small>Vega/1%</small><b>${ke(W.G.v, 3)}</b></div></div>
  <div class="sm mut">Montagem: ${W.legs.map((ae) => `${ae.q > 0 ? "compra" : "vende"} ${Math.abs(ae.q) > 1 ? Math.abs(ae.q) + "× " : ""}${Te(ae)}${ae.t === "C" || ae.t === "P" ? " por " + ke(ae.pr) : ""}`).join(" · ")}. Valores por ação (1 lote = 100).</div></div>
  <details class="card e2par"><summary><b>Mudar os números</b><span class="sm mut">preço, strikes, volatilidade e prazo</span></summary>
  <div class="g2">${V("S", "Preço do ativo", 0.01)}${V("vol", "Volatilidade (% a.a.)", 1)}${V("dc", "Dias úteis até o vencimento", 1)}${V("ju", "Juros (% a.a.)", 0.25)}${H.L.some((ae) => ae.v === "L") ? V("dl", "Dias úteis da opção longa", 1) : ""}</div>
  <div class="g2">${N.ks.map((ae, ee) => `<label>Strike ${ee + 1} (% do preço)<input type="number" step="0.5" data-e2epk="${ee}" value="${ae}"></label>`).join("")}</div>
  <button class="btn s" data-e2epr="1">Voltar ao padrão</button></details>
  <div class="card"><div class="seclb">O que é</div><p>${esc(H.o)}</p><div class="seclb">Quando usar</div><p>${esc(H.qd)}</p>
  <div class="e2k3"><div><small>Ganho máximo</small><span>${esc(H.gm)}</span></div><div><small>Perda máxima</small><span>${esc(H.pm)}</span></div><div><small>Ponto de equilíbrio</small><span>${esc(H.be)}</span></div></div>
  <div class="seclb">Gregas da posição</div><p>${esc(H.gr)}</p></div>
  <div class="card e2dica"><div class="seclb">Riscos e cuidados</div><ul class="e2ul">${H.ri.map((ae) => `<li>${esc(ae)}</li>`).join("")}</ul></div>
  <div class="card"><div class="seclb">Exemplo</div><p>${esc(H.ex)}</p></div>
  <div class="e2row" style="margin-bottom:12px"><button class="btn s" data-e2cap="h12">Ler o capítulo 12</button><button class="btn s" data-e2cap="h19">Letras gregas</button></div>`;
  }
  function ie() {
    (!u.lab || !("S" in u.lab)) &&
      (u.lab = {
        S: 38,
        K: 40,
        du: 21,
        ju: 14,
        vol: 35,
        q: 0,
        pm: "",
        tp: "C",
        N: 100,
      });
    const w = u.lab,
      H = Le(w.ju / 100),
      N = w.du / 252,
      W = ft("C", w.S, w.K, N, H, w.vol / 100, w.q / 100),
      Te = ft("P", w.S, w.K, N, H, w.vol / 100, w.q / 100),
      V = +w.pm > 0 ? ht(w.tp, +w.pm, w.S, w.K, N, H, w.q / 100) : null,
      ae = qe("C", w.S, w.K, N, H, w.vol / 100, w.N, 1, w.q / 100),
      ee = qe("P", w.S, w.K, N, H, w.vol / 100, w.N, 1, w.q / 100),
      le = qe("P", w.S, w.K, N, H, w.vol / 100, w.N, 0, w.q / 100),
      Y =
        W.p +
        w.K * Math.exp(-H * N) -
        (Te.p + w.S * Math.exp((-w.q / 100) * N)),
      q = (F, O, ne) =>
        `<label>${O}<input type="number" inputmode="decimal" step="${ne || 1}" data-e2lab="${F}" value="${w[F]}"></label>`,
      L = (F, O, ne, Ee = 2) =>
        `<tr><td>${F}</td><td class="mono">${ke(O, Ee)}</td><td class="mono">${ke(ne, Ee)}</td></tr>`;
    return `<button class="lnk e2back" data-e2bib="hull">‹ Opções (Hull)</button><h2 style="margin:6px 0 2px">Laboratório de opções</h2><div class="sm mut" style="margin-bottom:10px">Black-Scholes-Merton (cap. 15), gregas (cap. 19), volatilidade implícita e árvore binomial americana (cap. 13 e 21).</div>
  <div class="card"><div class="g2">${q("S", "Preço do ativo (S)", 0.01)}${q("K", "Strike (K)", 0.01)}${q("du", "Dias úteis até o vencimento", 1)}${q("vol", "Volatilidade (% a.a.)", 0.5)}${q("ju", "Juros (% a.a., Selic/DI)", 0.25)}${q("q", "Dividend yield (% a.a.)", 0.25)}</div></div>
  <div class="card"><table class="e2tb"><thead><tr><th></th><th>Call</th><th>Put</th></tr></thead><tbody>
  ${L("Preço (europeia)", W.p, Te.p)}${L("Valor intrínseco", Math.max(w.S - w.K, 0), Math.max(w.K - w.S, 0))}${L("Valor tempo", W.p - Math.max(w.S - w.K, 0), Te.p - Math.max(w.K - w.S, 0))}
  ${L("Delta", W.d, Te.d, 3)}${L("Gama", W.g, Te.g, 4)}${L("Teta (por dia útil)", W.t, Te.t, 4)}${L("Vega (por 1 p.p. de vol)", W.v, Te.v, 4)}${L("Rô (por 1 p.p. de juros)", W.rho, Te.rho, 4)}
  ${L("Prob. de exercício N(d2)", W.n2 * 100, Te.n2 * 100, 1)}${L("Americana (árvore " + w.N + " passos)", ae.p, ee.p)}</tbody></table>
  <div class="sm mut" style="margin-top:6px">d1 = ${ke(W.d1, 4)} · d2 = ${ke(W.d2, 4)} · prêmio pelo exercício antecipado da put: ${ke(ee.p - le.p, 4)} · paridade put-call: diferença ${ke(Y, 6)} (zero = sem arbitragem).</div></div>
  <div class="card"><b>Volatilidade implícita</b><div class="sm mut">Digite o prêmio negociado na B3 para descobrir a vol que o mercado está cobrando.</div>
  <div class="g2"><label>Tipo<select class="selch" data-e2lab="tp"><option value="C"${w.tp === "C" ? " selected" : ""}>Call</option><option value="P"${w.tp === "P" ? " selected" : ""}>Put</option></select></label>${q("pm", "Prêmio de mercado", 0.01)}</div>
  ${+w.pm > 0 ? `<div class="e2fb ${V ? "ok" : "err"}"><b>${V ? "Vol implícita: " + ke(V * 100, 1) + "% a.a." : "Prêmio fora dos limites de arbitragem"}</b>${V ? `<span class="sm">${V * 100 > w.vol ? "acima" : "abaixo"} da vol que você digitou (${ke(w.vol, 1)}%)</span>` : ""}</div>` : ""}</div>
  <div class="card"><b>Árvore binomial</b><div class="sm mut">u = ${ke(ae.u, 4)} · d = ${ke(ae.d, 4)} · p neutra ao risco = ${ke(ae.pr, 4)}</div>${q("N", "Passos da árvore", 10)}</div>
  <div class="sm mut" style="margin:0 0 12px">Conversões: juros anuais efetivos viram taxa contínua (ln(1+i)); prazo em dias úteis ÷ 252.</div>`;
  }
  const R = () => {
    var w;
    return (w = S.ax ?? (S.ax = {})).estExp ?? (w.estExp = {});
  };
  function z(w, H) {
    if (w.e)
      return `<div class="e2exp"><b>Explicação</b><p>${esc(w.e)}</p></div>`;
    const N = R()[w.id];
    return N
      ? `<div class="e2exp"><b>Por que é a ${ve[w.r]})</b><p>${esc(N.explicacao)}</p>${N.conta ? `<div class="e2f" style="white-space:normal">${esc(N.conta)}</div>` : ""}${N.erro_marcado && H != null && H !== w.r ? `<p class="sm"><b>Sobre a ${ve[H]}):</b> ${esc(N.erro_marcado)}</p>` : ""}${N.dica ? `<p class="sm am"><b>Dica:</b> ${esc(N.dica)}</p>` : ""}<small class="mut">Explicação gerada por IA a partir do gabarito oficial.</small></div>`
      : (u.expBusy || {})[w.id]
        ? '<div class="e2exp"><span class="sm mut">Pedindo a explicação para a IA…</span></div>'
        : `<button class="btn s e2expb" data-e2exp="${w.id}" data-sel="${H ?? ""}">Por que é a ${ve[w.r]})? Explicar com IA</button>`;
  }
  async function oe(w, H) {
    const N = se(w);
    if (!N) return;
    (((u.expBusy ?? (u.expBusy = {}))[w] = 1), render());
    try {
      const Te = await anxCall({
        modo: "explica",
        q: N.q,
        o: N.o,
        c: N.r,
        r: H === "" || H == null ? null : +H,
        tema: Pe(N),
      });
      Te && Te.explicacao
        ? ((R()[w] = {
            explicacao: Te.explicacao,
            conta: Te.conta || "",
            erro_marcado: Te.erro_marcado || "",
            dica: Te.dica || "",
          }),
          save())
        : toast((Te && Te.erro) || "A IA não respondeu. Tente de novo.", 4e3);
    } catch (Te) {
      toast(
        /v236|404|failed|fetch/i.test(String(Te))
          ? "Publique a função analise v236 no Supabase para usar a explicação por IA."
          : String(Te.message || Te),
        5e3,
      );
    }
    delete u.expBusy[w];
    const W = scrollY;
    (render(), scrollTo(0, W));
  }
  function me() {
    const w = v().slice(-15),
      H = {};
    (w.forEach((W) =>
      Object.entries(W.tp || {}).forEach(([Te, [V, ae]]) => {
        const ee = H[Te] ?? (H[Te] = [0, 0]);
        ((ee[0] += V), (ee[1] += ae));
      }),
    ),
      Object.keys(g()).forEach((W) => {
        const Te = se(W);
        if (!Te) return;
        const V = Pe(Te);
        H[V] ?? (H[V] = [0, 0]);
      }));
    const N = (W) => {
      const Te = Object.entries(r).find(([, ae]) => ae === W);
      if (Te) return "cg-" + Te[0];
      let V = /Pinheiro \xb7 cap\. (\d+)/.exec(W);
      return V
        ? "mc" + V[1]
        : ((V = /Hull \xb7 cap\. (\d+)/.exec(W)), V ? "h" + V[1] : null);
    };
    return Object.entries(H)
      .filter(([, W]) => W[0] >= 4)
      .map(([W, [Te, V]]) => ({
        k: W,
        q: Te,
        o: V,
        pc: Math.round((V / Te) * 100),
        cap: N(W),
      }))
      .filter((W) => W.pc < 80)
      .sort((W, Te) => W.pc - Te.pc)
      .slice(0, 3);
  }
  function be() {
    const w = me();
    if (!w.length)
      return v().length
        ? ""
        : '<div class="card e2plan"><b>Seu plano</b><div class="sm mut">Faça um simulado ou treino: o app monta o plano da semana com os seus temas mais fracos.</div></div>';
    const H = ["Seg/Ter", "Qua/Qui", "Sex"];
    return `<div class="card e2plan"><b>Plano da semana</b><div class="sm mut">Montado com os temas em que você mais erra. No sábado, um simulado completo para medir a evolução.</div>
  ${w
    .map((N, W) => {
      const Te = N.cap && h(N.cap);
      return `<div class="e2pl"><span class="e2pld">${H[W]}</span><div><b>${esc(N.k)}</b><small class="${N.pc >= 70 ? "g" : N.pc >= 50 ? "am" : "r"}">${N.pc}% de acerto em ${N.q} questões</small>
  <div class="e2row">${Te ? `<button class="btn s" data-e2cap="${Te.c.id}">Reler</button><button class="btn s" data-e2fc="cap:${Te.c.id}">Cartões</button><button class="btn s" data-e2qcap="${Te.c.id}">15 questões</button>` : ""}</div></div></div>`;
    })
    .join("")}</div>`;
  }
  function X() {
    const w = v()
      .filter((V) => V.q >= 10)
      .slice(-20);
    if (w.length < 2) return "";
    const H = 320,
      N = 110,
      W = (V) => 8 + (V * (H - 16)) / (w.length - 1),
      Te = (V) => N - 10 - (V / 100) * (N - 20);
    return `<div class="card"><b>Evolução das notas</b><div class="sm mut">Últimos ${w.length} simulados e treinos com 10+ questões. Linha tracejada: meta de 70%.</div>
  <svg viewBox="0 0 ${H} ${N}" class="e2evo" role="img" aria-label="Evolução das notas"><line x1="8" x2="${H - 8}" y1="${Te(70)}" y2="${Te(70)}" stroke="#c9a156" stroke-dasharray="4 4"/>
  <path d="${w.map((V, ae) => (ae ? "L" : "M") + W(ae).toFixed(1) + "," + Te(V.pc).toFixed(1)).join("")}" fill="none" stroke="var(--g)" stroke-width="2"/>${w.map((V, ae) => `<circle cx="${W(ae)}" cy="${Te(V.pc)}" r="3" fill="${V.pc >= 70 ? "var(--g)" : "#c9a156"}"/>`).join("")}</svg></div>`;
  }
  function xe() {
    const w = I().length;
    if (!w) return "";
    const H = [...new Set(I().map((N) => N.c))];
    return `<div class="card"><b>Opções e derivativos (Hull)</b><div class="sm mut">${w} questões com explicação, feitas a partir do conteúdo do livro.</div>
  <label>Capítulo<select id="e2hcap" class="selch"><option value="all">Todos (${w})</option>${H.map((N) => `<option value="${N}">${esc(((h("h" + N) || {}).c || {}).t || "Cap. " + N)} (${I().filter((W) => W.c === N).length})</option>`).join("")}</select></label>
  <button class="btn" data-e2hull="1">Começar</button></div>`;
  }
  function $e() {
    try {
      const w = enHoje(),
        H = tcod(w);
      if (!H) return "";
      const N = {
        8: "Turno das 8h às 17h: sem trade hoje. À noite, 25 min de leitura e os cartões do dia.",
        16: "Turno das 16h à meia-noite: estude de manhã (melhor horário) e revise os cartões no intervalo.",
        0: "Turno da madrugada: descanse. Só os cartões, se der.",
        F: "Folga: bom dia para um simulado completo ou um capítulo novo.",
      };
      return N[H]
        ? `<div class="sm" style="margin-top:4px">${esc(N[H])}</div>`
        : "";
    } catch {
      return "";
    }
  }
  (document.addEventListener("change", (w) => {
    const H = w.target;
    if (!(!H || !H.closest)) {
      if (H.matches("[data-e2ep]")) {
        const N = u.ep;
        if (!N) return;
        const W = +String(H.value).replace(",", ".");
        if (isFinite(W) && W > 0) {
          N[H.dataset.e2ep] = W;
          const Te = scrollY;
          (render(), scrollTo(0, Te));
        }
        return;
      }
      if (H.matches("[data-e2epk]")) {
        const N = u.ep;
        if (!N) return;
        const W = +String(H.value).replace(",", ".");
        if (isFinite(W) && W > 0) {
          N.ks[+H.dataset.e2epk] = W;
          const Te = scrollY;
          (render(), scrollTo(0, Te));
        }
        return;
      }
      if (H.matches("[data-e2lab]")) {
        const N = u.lab;
        if (!N) return;
        const W = H.dataset.e2lab;
        if (W === "tp") N.tp = H.value;
        else if (W === "pm") N.pm = H.value;
        else {
          const V = +String(H.value).replace(",", ".");
          isFinite(V) &&
            (V > 0 || W === "q") &&
            (N[W] = W === "N" ? Math.max(2, Math.min(500, Math.round(V))) : V);
        }
        const Te = scrollY;
        (render(), scrollTo(0, Te));
        return;
      }
    }
  }),
    document.addEventListener(
      "click",
      (w) => {
        const H = (W) => w.target.closest && w.target.closest(W);
        let N;
        if ((N = H("[data-e2estr]"))) {
          ((u.estr = N.dataset.e2estr),
            (u.lab = null),
            (u.cap = null),
            (u.bib = "hull"),
            (EST.v = "bib"),
            render(),
            scrollTo(0, 0));
          return;
        }
        if (H("[data-e2labo]")) {
          ((u.lab = u.lab || {}),
            (u.estr = null),
            (u.cap = null),
            (u.bib = "hull"),
            (EST.v = "bib"),
            render(),
            scrollTo(0, 0));
          return;
        }
        if (H("[data-e2epr]")) {
          const W = n.find((Te) => Te.id === (u.ep || {}).id);
          (W && (u.ep = { id: W.id, ...ze(W) }), render());
          return;
        }
        if ((N = H("[data-e2exp]"))) {
          oe(N.dataset.e2exp, N.dataset.sel);
          return;
        }
        if (H("[data-e2hull]")) {
          const W = (document.getElementById("e2hcap") || {}).value || "all",
            Te = (document.getElementById("e2modo") || {}).value || "treino";
          ot(
            Ie(I().filter((V) => W === "all" || V.c === +W)).map((V) => V.id),
            "Hull · " + (W === "all" ? "opções e derivativos" : "cap. " + W),
            "hull",
            Te,
          );
          return;
        }
      },
      !0,
    ));
  const fe = [
    [
      "call option",
      "opção de compra",
      "He bought a call option on Petrobras.",
      "Ele comprou uma opção de compra de Petrobras.",
    ],
    [
      "put option",
      "opção de venda",
      "A put option protects your portfolio.",
      "Uma opção de venda protege sua carteira.",
    ],
    [
      "strike price",
      "preço de exercício",
      "The strike price is forty reais.",
      "O preço de exercício é quarenta reais.",
    ],
    [
      "premium",
      "prêmio",
      "The premium was too expensive.",
      "O prêmio estava caro demais.",
    ],
    [
      "expiration date",
      "data de vencimento",
      "The expiration date is next Friday.",
      "O vencimento é na próxima sexta.",
    ],
    [
      "in the money",
      "dentro do dinheiro",
      "Your call is in the money now.",
      "Sua call está dentro do dinheiro agora.",
    ],
    [
      "out of the money",
      "fora do dinheiro",
      "Most out of the money options expire worthless.",
      "A maioria das opções fora do dinheiro vence sem valor.",
    ],
    [
      "at the money",
      "no dinheiro",
      "At the money options have the most time value.",
      "Opções no dinheiro têm o maior valor tempo.",
    ],
    [
      "to exercise",
      "exercer",
      "I will exercise the option tomorrow.",
      "Vou exercer a opção amanhã.",
    ],
    [
      "to write an option",
      "lançar uma opção",
      "She wrote covered calls every month.",
      "Ela lançou calls cobertas todo mês.",
    ],
    [
      "covered call",
      "lançamento coberto",
      "A covered call generates extra income.",
      "O lançamento coberto gera renda extra.",
    ],
    [
      "protective put",
      "put protetora",
      "Buy a protective put before earnings.",
      "Compre uma put protetora antes do balanço.",
    ],
    [
      "spread",
      "trava, spread",
      "A bull spread limits both risk and reward.",
      "A trava de alta limita o risco e o ganho.",
    ],
    [
      "straddle",
      "straddle (call e put no mesmo strike)",
      "Traders bought straddles before the Fed meeting.",
      "Traders compraram straddles antes da reunião do Fed.",
    ],
    [
      "implied volatility",
      "volatilidade implícita",
      "Implied volatility jumped after the news.",
      "A volatilidade implícita saltou depois da notícia.",
    ],
    [
      "time decay",
      "perda de valor com o tempo (teta)",
      "Time decay hurts option buyers.",
      "A perda de valor com o tempo prejudica quem compra opções.",
    ],
    [
      "hedge",
      "proteção, fazer hedge",
      "We hedge the dollar exposure with futures.",
      "Fazemos hedge da exposição ao dólar com futuros.",
    ],
    [
      "margin call",
      "chamada de margem",
      "He received a margin call after the drop.",
      "Ele recebeu uma chamada de margem depois da queda.",
    ],
    [
      "futures contract",
      "contrato futuro",
      "The futures contract settles daily.",
      "O contrato futuro tem ajuste diário.",
    ],
    [
      "open interest",
      "contratos em aberto",
      "Open interest rose to a record.",
      "Os contratos em aberto subiram a um recorde.",
    ],
    [
      "underlying asset",
      "ativo subjacente",
      "The underlying asset is the Ibovespa index.",
      "O ativo subjacente é o índice Ibovespa.",
    ],
    [
      "breakeven",
      "ponto de equilíbrio",
      "The breakeven is the strike plus the premium.",
      "O ponto de equilíbrio é o strike mais o prêmio.",
    ],
    [
      "payoff",
      "resultado (no vencimento)",
      "Draw the payoff before you trade.",
      "Desenhe o resultado antes de operar.",
    ],
    [
      "to roll over",
      "rolar (a posição)",
      "We roll over the position every month.",
      "Rolamos a posição todo mês.",
    ],
    [
      "swap",
      "swap (troca de indexadores)",
      "The company entered a swap to fix its rate.",
      "A empresa fez um swap para fixar a taxa.",
    ],
  ];
  function Fe(w) {
    try {
      if (!w || w._opc || !Array.isArray(w.temas)) return;
      ((w._opc = 1),
        w.temas.push(["opc", "Opções e derivativos", "🎯"]),
        fe.forEach((H) => w.itens.push(["opc", ...H])));
      try {
        EN._L = null;
      } catch {}
    } catch {}
  }
  try {
    let w = window.EN_DATA;
    (w && Fe(w),
      Object.defineProperty(window, "EN_DATA", {
        configurable: !0,
        get() {
          return w;
        },
        set(H) {
          ((w = H), Fe(H));
        },
      }));
  } catch {}
  {
    const w = TraderStyles.slot("legacy-108");
    ((w.id = "est186"),
      (w.textContent = TraderStyles.css("legacy-108")),
      TraderStyles.mount(w));
  }
})();
{
  const e = TraderStyles.slot("legacy-109");
  ((e.id = "fix187"),
    (e.textContent = TraderStyles.css("legacy-109")),
    TraderStyles.mount(e));
}
const T187 = Date.now();
function trv187() {
  try {
    if (ls.get("diario-trv187") || Date.now() - T187 > 12e4) return;
    const e = (S.ax || {}).trava;
    if (e && typeof e == "object") {
      let t = 0;
      ("off" in e && (delete e.off, (t = 1)),
        Object.keys(e).every((a) => a === "on") &&
          !e.on &&
          (delete S.ax.trava, (t = 1)),
        t && (save(), ls.set("diario-trv187", "1")));
    }
  } catch {}
}
trv187();
{
  const e = render0;
  render0 = function () {
    return (trv187(), e.apply(this, arguments));
  };
}
const ATALHO188 =
  () => `<div class="card e2atalho"><div><b>Biblioteca e simulados</b><div class="sm mut">Opções (Hull) com guia de estratégias e laboratório, CNPI, Renda fixa, Mercado de Capitais e CFP.</div></div>
<div class="e2row"><button class="btn" data-e2at="bib">Biblioteca</button><button class="btn s" data-e2at="hull">Opções (Hull)</button><button class="btn s" data-e2at="estr">Estratégias</button><button class="btn s" data-e2at="sim">Simulados</button></div></div>`;
try {
  const e = vEstudos;
  vEstudos = function () {
    const t = e.apply(this, arguments);
    return typeof ESV < "u" && ESV === "est"
      ? t
      : t.replace(
          /(<div class="seg"[^>]*>[\s\S]*?<\/div>)/,
          "$1" + ATALHO188(),
        );
  };
} catch {}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest && e.target.closest("[data-e2at]");
    if (!t) return;
    const a = t.dataset.e2at;
    try {
      ((ESV = "est"), (tab = "estudos"), (EST.v = a === "sim" ? "sim" : "bib"));
      try {
        APP_STORAGE.setItem("diario-est-v", EST.v);
      } catch {}
      const o = window.E2 || {};
      ((o.fc = null),
        (o.cap = null),
        (o.lab = null),
        (o.estr = null),
        (o.bib = null),
        a === "hull" && (o.bib = "hull"),
        a === "estr" && (o.estr = "lista"),
        irPara(tab),
        scrollTo(0, 0));
    } catch {}
  },
  !0,
);
try {
  const e = vContratos;
  vContratos = function () {
    let t = e.apply(this, arguments);
    try {
      MESA_OFF() &&
        (t = t.replace("<h1>Mesa e risco</h1>", "<h1>Contratos e risco</h1>"));
    } catch {}
    return t.replace(
      "Máx. de stops no dia",
      "Máx. de trades no dia (base da perda máxima)",
    );
  };
} catch {}
function lim188() {
  try {
    const { hj: e, P: t } = pHoje(),
      a = pCore(e, t),
      o = typeof trCfg == "function" ? trCfg() : {},
      s = (r) => (typeof money == "function" ? money(r) : "R$ " + r),
      n = [
        a.lim > 0 ? "perda máxima " + s(a.lim) : "",
        a.nd > 0 ? "até " + a.nd + " trade" + (a.nd > 1 ? "s" : "") : "",
        +o.maxStops > 0 ? "pare em " + o.maxStops + " stops seguidos" : "",
        +o.pausaMin > 0
          ? "pausa de " + o.pausaMin + " min depois de um stop"
          : "",
      ].filter(Boolean);
    return n.length
      ? `<div class="lim188"><b>Valendo hoje:</b> ${n.join(" · ")}.${o.on ? " A trava fecha o dia quando bater." : ' <span class="am">A trava está desligada.</span>'}</div>`
      : "";
  } catch {
    return "";
  }
}
try {
  const e = limHtml;
  limHtml = function () {
    return e.apply(this, arguments) + lim188();
  };
} catch {}
{
  const e = render0;
  render0 = function () {
    const t = e.apply(this, arguments),
      a = () => {
        try {
          document
            .querySelectorAll('#app [data-a="cday"]')
            .forEach((o, s, n) => {
              if (s === n.length - 1) {
                const r = o.parentElement;
                r.scrollWidth > r.clientWidth &&
                  !r.dataset.rolou &&
                  ((r.scrollLeft = r.scrollWidth), (r.dataset.rolou = 1));
              }
            });
        } catch {}
      };
    (a(), setTimeout(a, 60), setTimeout(a, 400));
    try {
      MESA_OFF() &&
        document.querySelectorAll('#app [data-id="mesa"]').forEach((o) => {
          /Mesa e risco/.test(o.textContent) &&
            (o.textContent = o.textContent.replace(
              "Mesa e risco",
              "Metas e risco",
            ));
        });
    } catch {}
    return t;
  };
}
function net188() {
  try {
    let e = document.getElementById("net188");
    if (navigator.onLine) {
      e && e.remove();
      return;
    }
    e ||
      ((e = document.createElement("div")),
      (e.id = "net188"),
      e.setAttribute("role", "status"),
      (e.textContent =
        "Sem internet. O diário funciona normal; cotações, notícias e IA voltam quando a conexão voltar."),
      document.body.appendChild(e));
  } catch {}
}
(addEventListener("online", () => {
  net188();
  try {
    toast("Conexão de volta.");
  } catch {}
}),
  addEventListener("offline", net188),
  setTimeout(net188, 1500));
{
  const e = TraderStyles.slot("legacy-110");
  ((e.id = "fix188"),
    (e.textContent = TraderStyles.css("legacy-110")),
    TraderStyles.mount(e));
}
((function () {
  try {
    ((FN_ESPERADA.terminal = "v279"),
      (FN_ESPERADA.macro = "v277"),
      (FN_ESPERADA.notificar = "v279"),
      (FN_ESPERADA.analise = "v279"));
  } catch {}
  const e = {
    foco: 0,
    dados: {},
    busy: {},
    err: {},
    px: {},
    flash: {},
    ant: {},
    hist: [],
    hi: -1,
    ws: null,
    wsSyms: "",
    fh: null,
    fhSyms: "",
    profit: {},
    pTs: 0,
    eqs: { mk: "brazil", f: {} },
    omon: {},
    mob: 0,
    ultEco: {},
    log: [],
    fst: {},
    src: {},
    pf: { ok: 0, err: "", ts: 0, n: 0 },
    max: -1,
  };
  try {
    e.hist = JSON.parse(APP_STORAGE.getItem("diario-term-hist") || "[]");
  } catch {}
  const t = 28,
    a = (E, P, B, G) => ({ x: E, y: P, w: B, h: G }),
    o = {
      br: {
        n: "Ações Brasil",
        p: ["MON", "PETR4 G", "ECO", "TOP", "TECH"],
        g: [
          a(0, 0, 4, 13),
          a(4, 0, 5, 17),
          a(0, 13, 4, 13),
          a(4, 17, 5, 9),
          a(9, 0, 3, 26),
        ],
      },
      ext: {
        n: "Exterior",
        p: ["WEI", "SPY G", "WIRP", "N EUA", "FX"],
        g: [
          a(0, 0, 4, 14),
          a(4, 0, 5, 16),
          a(9, 0, 3, 14),
          a(4, 16, 5, 10),
          a(0, 14, 4, 12),
        ],
      },
      cri: {
        n: "Cripto",
        p: ["CRYP", "BTCUSD G", "BTCUSD G 60M", "N BITCOIN"],
        g: [a(0, 0, 4, 13), a(4, 0, 8, 15), a(4, 15, 8, 11), a(0, 13, 4, 13)],
      },
      macro: {
        n: "Macro e juros",
        p: ["ECO", "WIRP", "ECST", "GC"],
        g: [a(0, 0, 6, 13), a(6, 0, 6, 13), a(0, 13, 6, 13), a(6, 13, 6, 13)],
      },
      opc: {
        n: "Opções",
        p: ["PETR4 OMON", "PETR4 G", "PETR4 OV", "N PETR4"],
        g: [a(0, 0, 6, 15), a(6, 0, 6, 15), a(0, 15, 6, 11), a(6, 15, 6, 11)],
      },
      mer: {
        n: "Mercado (jornal, notícias, agenda)",
        p: ["JORNAL", "NEWS", "ECO", "WEI"],
        g: [a(0, 0, 6, 13), a(6, 0, 6, 17), a(0, 13, 6, 13), a(6, 17, 6, 9)],
      },
      ia: {
        n: "Central de inteligência",
        p: ["IA", "WMAP", "NEWS", "STAT"],
        g: [a(0, 0, 5, 26), a(5, 0, 7, 15), a(5, 15, 4, 11), a(9, 15, 3, 11)],
      },
    };
  (Object.assign(o, {
    dt: {
      n: "Day trade (WIN e WDO)",
      p: ["WIN G 5M", "WDO G 5M", "MON", "EVT", "ECO"],
      t: [
        ["WIN G 5M", "WIN G 15M", "WIN G 60M"],
        ["WDO G 5M", "WDO G 15M"],
        null,
        ["EVT", "ALC"],
        ["ECO", "TOP"],
      ],
      g: [
        a(0, 0, 8, 16),
        a(0, 16, 8, 10),
        a(8, 0, 4, 10),
        a(8, 10, 4, 8),
        a(8, 18, 4, 8),
      ],
    },
    sw: {
      n: "Swing trade",
      p: ["TECH", "PETR4 G", "SETORES", "NEWS"],
      t: [
        ["TECH", "ALC"],
        ["PETR4 G", "VALE3 G", "ITUB4 G", "COMP PETR4 VALE3 IBOV"],
        ["SETORES", "EQS"],
        ["NEWS", "EVT"],
      ],
      g: [a(0, 0, 3, 26), a(3, 0, 6, 17), a(9, 0, 3, 26), a(3, 17, 6, 9)],
    },
    pre: {
      n: "Pré-abertura",
      p: ["WEI", "ECO", "FX", "TOP", "WIRP"],
      t: [
        ["WEI", "WMAP"],
        ["ECO", "AGENDA"],
        ["FX", "CMDTY", "CRYP"],
        ["TOP", "FIRST"],
        ["WIRP", "GC"],
      ],
      g: [
        a(0, 0, 5, 14),
        a(5, 0, 4, 14),
        a(9, 0, 3, 14),
        a(0, 14, 6, 12),
        a(6, 14, 6, 12),
      ],
    },
    dq: {
      n: "Qualidade dos dados",
      p: ["DQ", "AUD", "STAT"],
      t: [null, ["AUD", "AUD IA"], null],
      g: [a(0, 0, 7, 26), a(7, 0, 5, 15), a(7, 15, 5, 11)],
    },
    tm: { n: "Máquina do tempo", p: ["TM"], g: [a(0, 0, 12, 26)] },
  }),
    (o.br.t = [
      null,
      ["PETR4 G", "VALE3 G", "ITUB4 G"],
      ["ECO", "EVT"],
      ["TOP", "NEWS"],
      ["TECH", "ALC"],
    ]),
    (o.ia.t = [
      ["IA", "EVT"],
      ["WMAP", "SETORES"],
      ["NEWS", "TOP"],
      ["STAT", "DQ"],
    ]));
  const s = o;
  window.trWsPad = o;
  function n(E) {
    const P = E <= 1 ? 1 : E <= 4 ? 2 : 3,
      B = Math.ceil(E / P),
      G = Math.floor(12 / P),
      te = Math.max(6, Math.floor(26 / B));
    return Array.from({ length: E }, (_, ye) =>
      a(
        (ye % P) * G,
        Math.floor(ye / P) * te,
        ye % P === P - 1 ? 12 - (ye % P) * G : G,
        te,
      ),
    );
  }
  const r = () => {
      const E = S.ax ?? (S.ax = {});
      E.term ??
        (E.term = {
          mon: [
            "WINFUT",
            "WDOFUT",
            "IBOV",
            "PETR4",
            "VALE3",
            "ITUB4",
            "BBAS3",
            "BOVA11",
            "PRIO3",
            "WEGE3",
          ],
          fh: "",
        });
      const P = E.term;
      return (
        P.mon ?? (P.mon = []),
        P.wss ||
          ((P.wss = JSON.parse(JSON.stringify(o))),
          Object.entries(P.lays || {}).forEach(([B, G]) => {
            G &&
              Array.isArray(G.p) &&
              (P.wss[B] = { n: G.n || B, p: G.p.slice(), g: n(G.p.length) });
          }),
          (P.ws = P.wss[P.lay] ? P.lay : "br"),
          delete P.lay,
          delete P.lays,
          delete P.p),
        P.m268 ||
          ((P.m268 = 1),
          P.wss.mer || (P.wss.mer = JSON.parse(JSON.stringify(o.mer)))),
        P.m269 ||
          ((P.m269 = 1),
          ["dt", "sw", "pre", "dq", "tm"].forEach((B) => {
            P.wss[B] || (P.wss[B] = JSON.parse(JSON.stringify(o[B])));
          }),
          ["br", "ia"].forEach((B) => {
            const G = P.wss[B];
            G &&
              !G.t &&
              G.p.length === o[B].p.length &&
              (G.t = JSON.parse(JSON.stringify(o[B].t)));
          })),
        P.wss[P.ws] || (P.ws = Object.keys(P.wss)[0] || "br"),
        P.wss[P.ws] || (P.wss[P.ws] = JSON.parse(JSON.stringify(o.br))),
        P
      );
    },
    i = () => {
      if (window.TRPOP) return window.TRPOP;
      const E = r(),
        P = E.wss[E.ws];
      if (
        ((!Array.isArray(P.p) || !P.p.length) && (P.p = ["HELP"]),
        !Array.isArray(P.g) || P.g.length !== P.p.length)
      ) {
        const B = n(P.p.length);
        P.g = P.p.map((G, te) => (P.g && P.g[te]) || B[te]);
      }
      return P;
    },
    l = () => innerWidth >= 980,
    d = (E) =>
      String(E ?? "").replace(
        /[&<>"]/g,
        (P) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[P],
      ),
    c = (E, P = 2) =>
      E == null || !isFinite(E)
        ? "—"
        : Number(E).toLocaleString("pt-BR", {
            minimumFractionDigits: P,
            maximumFractionDigits: P,
          }),
    p = (E, P = 2) =>
      E == null || !isFinite(E) ? "—" : (E > 0 ? "+" : "") + c(E, P) + "%",
    u = (E) =>
      E == null || !isFinite(E) || E === 0 ? "" : E > 0 ? "tg" : "tr",
    m = (E) => {
      if (E == null || !isFinite(E)) return "—";
      const P = Math.abs(E);
      return P >= 1e12
        ? c(E / 1e12, 2) + " tri"
        : P >= 1e9
          ? c(E / 1e9, 2) + " bi"
          : P >= 1e6
            ? c(E / 1e6, 1) + " mi"
            : P >= 1e3
              ? c(E / 1e3, 1) + " mil"
              : c(E, 0);
    },
    f = (E) => {
      try {
        return new Date(E).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "";
      }
    },
    x = (E) => {
      try {
        return new Date(E).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
      } catch {
        return "";
      }
    };
  function v(E, P, B) {
    (e.log.unshift({
      ts: Date.now(),
      fonte: E,
      msg: String(P || "").slice(0, 160),
      ok: !!B,
    }),
      e.log.length > 80 && (e.log.length = 80));
  }
  function g(E, P, B, G) {
    const te = e.fst[E] || { n: 0, falhas: 0 };
    ((te.ts = Date.now()),
      (te.ok = P),
      (te.ms = B),
      te.n++,
      (te.tot = (te.tot || 0) + (B || 0)),
      P
        ? (te.err = "")
        : (te.falhas++, (te.err = String(G || "").slice(0, 160))),
      (e.fst[E] = te));
  }
  async function h(E, P = {}, B = 2e4) {
    const G = E + "|" + JSON.stringify(P),
      te = e.dados[G];
    if (te && Date.now() - te.ts < B) return te.v;
    if (e.busy[G]) return te ? te.v : null;
    e.busy[G] = 1;
    const _ = performance.now();
    try {
      const ye = await (
        await rq("/functions/v1/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: E, ...P }),
        })
      ).json();
      if (ye && ye.error) throw new Error(ye.error);
      return (
        (e.dados[G] = { ts: Date.now(), v: ye }),
        delete e.err[G],
        g("srv:" + E, !0, Math.round(performance.now() - _)),
        ye
      );
    } catch (ye) {
      return (
        (e.err[G] =
          ye.status === 404
            ? 'Publique a função "terminal" no Supabase (terminal-index.ts).'
            : String(ye.message || ye)),
        g("srv:" + E, !1, Math.round(performance.now() - _), e.err[G]),
        v("Servidor (" + E + ")", e.err[G], !1),
        te ? te.v : null
      );
    } finally {
      delete e.busy[G];
    }
  }
  const b = (E, P = {}) => {
    const B = E + "|" + JSON.stringify(P);
    return {
      v: (e.dados[B] || {}).v || null,
      err: e.err[B] || "",
      busy: !!e.busy[B],
      ts: (e.dados[B] || {}).ts || 0,
    };
  };
  async function y(E, P) {
    const B = "cd|" + E + "|" + P,
      G = e.dados[B];
    if (G && Date.now() - G.ts < (P === "1d" ? 3e5 : 6e4)) return G.v;
    if (((e.candleRetry ??= {}), e.candleRetry[B] > Date.now() || e.busy[B]))
      return G?.v || null;
    e.busy[B] = 1;
    const te = performance.now();
    try {
      const _ = await (
        await rq("/functions/v1/candles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: E, intervalo: P }),
        })
      ).json();
      if (_.error) throw new Error(_.error);
      return (
        (e.dados[B] = { ts: Date.now(), v: _ }),
        delete e.err[B],
        delete e.candleRetry[B],
        g("candles", !0, Math.round(performance.now() - te)),
        _
      );
    } catch (_) {
      return (
        (e.candleRetry[B] = Date.now() + 6e4),
        (e.err[B] = String(_.message || _)),
        g("candles", !1, Math.round(performance.now() - te), e.err[B]),
        v("Gráficos (Yahoo) " + E, e.err[B], !1),
        G?.v || null
      );
    } finally {
      delete e.busy[B];
    }
  }
  async function j() {
    if (
      !SESS ||
      !window.CLOUD_OK ||
      document.hidden ||
      Date.now() - e.pTs < 2500
    )
      return;
    e.pTs = Date.now();
    const E = performance.now();
    try {
      const P = await (
        await rq("/rest/v1/cotacoes?select=*&user_id=eq." + SESS.uid)
      ).json();
      e.pf.todas = (P || []).map((_) => ({
        tk: String(_.ticker).toUpperCase(),
        up: Date.parse(_.updated_at) || 0,
        px: +_.ult,
        hor: _.hor || "",
      }));
      const B = {};
      (P || []).forEach((_) => {
        const ye = Date.parse(_.updated_at) || 0;
        Date.now() - ye < 10 * 6e4 &&
          (B[String(_.ticker).toUpperCase()] = {
            px: +_.ult,
            ab: +_.abe || null,
            max: +_.max || null,
            min: +_.min || null,
            fec: +_.fec || null,
            d1:
              _.var != null && _.var !== ""
                ? +_.var
                : +_.fec > 0
                  ? (+_.ult / +_.fec - 1) * 100
                  : null,
            neg: +_.neg || null,
            hor: _.hor || "",
            dat: _.dat || "",
            up: ye,
          });
      });
      const G = Object.keys(e.profit).length,
        te = Object.keys(B).length;
      ((e.profit = B),
        (e.pf = {
          ...e.pf,
          ok: 1,
          err: "",
          ts: Date.now(),
          n: te,
          ms: Math.round(performance.now() - E),
        }),
        !G != !te &&
          v(
            "Ponte do Profit",
            te
              ? "recebendo " + te + " ativos"
              : "sem atualização nos últimos 10 min",
            !!te,
          ));
    } catch (P) {
      ((e.pf = { ...e.pf, ok: 0, err: String(P.message || P), ts: Date.now() }),
        v("Ponte do Profit", "erro ao ler: " + e.pf.err, !1));
    }
  }
  const k = (E) => {
      let P = null;
      for (const [B, G] of Object.entries(e.profit))
        new RegExp("^" + E + "[FGHJKMNQUVXZ]\\d{2}$").test(B) &&
          (!P || G.up > P.up) &&
          (P = G);
      return P;
    },
    A = (E) => {
      const P = String(E || "")
          .toUpperCase()
          .replace(/^BMFBOVESPA:/, ""),
        B = e.profit[P] || e.profit[P.replace(/1!$/, "FUT")];
      if (B) return B;
      const G = /^(WIN|WDO|IND|DOL)(FUT|1!|N)$/.exec(P);
      return G
        ? k(G[1]) ||
            (G[1] === "WIN"
              ? e.profit.WINFUT
              : G[1] === "WDO"
                ? e.profit.WDOFUT
                : null)
        : null;
    };
  function C(E, P, B) {
    P = P || {};
    const G = A(E),
      te = B && e.px["BIN:" + B],
      _ = e.px["FH:" + E];
    let ye;
    return (
      G && G.px
        ? (ye = {
            px: G.px,
            d1: G.d1,
            max: G.max,
            min: G.min,
            fonte: "Profit",
            ts: G.up,
            rt: Date.now() - G.up < 12e4,
            k: "PF:" + E,
          })
        : te
          ? (ye = {
              px: te.px,
              d1: te.d1 != null ? te.d1 : P.d1,
              fonte: "Binance",
              ts: te.ts,
              rt: !0,
              k: "BIN:" + B,
            })
          : _
            ? (ye = {
                px: _.px,
                d1: P.d1,
                fonte: "Finnhub",
                ts: _.ts,
                horarioPreco: _.horarioPreco || null,
                atraso: !1,
                rt: !0,
                k: "FH:" + E,
              })
            : (ye = {
                px: P.px,
                d1: P.d1,
                max: P.max,
                min: P.min,
                simboloFonte: P.simboloFonte,
                horarioPreco: P.horarioPreco,
                modoAtualizacao: P.modoAtualizacao,
                fonte: P.px == null ? "—" : P.fonte || "TradingView",
                ts:
                  P.px == null
                    ? 0
                    : (P.horarioPreco
                        ? Date.parse(P.horarioPreco)
                        : P.dado_em
                          ? Date.parse(P.dado_em)
                          : 0) ||
                      P._em ||
                      Date.now(),
                rt: P.atraso === !1,
                atraso: P.atraso !== !1,
                k: "",
              }),
      E &&
        (e.src[String(E).toUpperCase()] = {
          ...ye,
          em: Date.now(),
          falha: ye.px == null,
        }),
      ye
    );
  }
  function I(E) {
    if (!E || E.px == null)
      return '<span class="trsrc fl" title="Sem cotação agora">falha</span>';
    const P = E.ts ? Math.max(0, Math.round((Date.now() - E.ts) / 1e3)) : null;
    return E.fonte === "Profit"
      ? `<span class="trsrc ${E.rt ? "rt" : "st"}" title="Ponte do Profit, atualizado há ${P}s${E.rt ? "" : " (parado)"}">PF ${P < 60 ? P + "s" : Math.round(P / 60) + "m"}</span>`
      : E.fonte === "Binance"
        ? '<span class="trsrc rt" title="Binance, tempo real">BIN</span>'
        : E.fonte === "Finnhub"
          ? '<span class="trsrc rt" title="Finnhub, tempo real">FH</span>'
          : E.rt
            ? '<span class="trsrc rt" title="TradingView, tempo real">TV</span>'
            : '<span class="trsrc dl" title="TradingView: confira o atraso e o horário na fonte">TV atraso</span>';
  }
  function J(E, P) {
    ((e.binReq = e.binReq || {}),
      (e.binReq[P || "cri"] = E || []),
      (E = [...new Set(Object.values(e.binReq).flat())]));
    const B = E.slice().sort().join("/");
    if (!B) {
      if (e.ws) {
        try {
          e.ws.close();
        } catch {}
        ((e.ws = null), (e.wsSyms = ""));
      }
      return;
    }
    if (!(e.ws && e.wsSyms === B && [0, 1].includes(e.ws.readyState)))
      try {
        e.ws && e.ws.close();
        const G = new WebSocket(
          "wss://stream.binance.com:9443/stream?streams=" +
            E.map((te) => te + "@miniTicker").join("/"),
        );
        ((e.wsStarted = Date.now()),
          (e.wsSyms = B),
          (e.ws = G),
          (G.onopen = () =>
            v("Binance", "conectado (" + E.length + " pares)", !0)),
          (G.onclose = () => v("Binance", "conexão fechada", !1)),
          (G.onmessage = (te) => {
            try {
              const _ = JSON.parse(te.data).data;
              if (!_ || !_.s) return;
              const ye = +_.c,
                Oe = +_.o;
              Ie(
                "BIN:" + _.s.toLowerCase(),
                ye,
                Oe > 0 ? (ye / Oe - 1) * 100 : null,
              );
            } catch {}
          }),
          (G.onerror = () => {
            ((e.wsSyms = ""),
              v(
                "Binance",
                "erro na conexão (o site pode estar bloqueado na sua rede)",
                !1,
              ));
          }));
      } catch (G) {
        v("Binance", G.message, !1);
      }
  }
  function se(E) {
    E = [
      ...new Set(
        [...(E || []), ...(e.fhAuto || [])].filter((_) =>
          /^[A-Z.]{1,10}$/.test(_),
        ),
      ),
    ].slice(0, 40);
    const P = r().fh,
      B = E.slice().sort().join(",");
    if (((e.fhWanted = E), !P || !B)) {
      (clearTimeout(e.fhRetry), (e.fhRetry = null));
      const _ = e.fh;
      ((e.fh = null), (e.fhSyms = ""), (e.fhAberto = 0));
      try {
        _?.close();
      } catch {}
      return;
    }
    if (
      e.fh &&
      e.fhSyms === B &&
      e.fhKey === P &&
      [0, 1].includes(e.fh.readyState)
    )
      return;
    (clearTimeout(e.fhRetry), (e.fhRetry = null));
    const G = e.fh;
    e.fh = null;
    try {
      G?.close();
    } catch {}
    if (
      (e.fhKey !== P && ((e.fhRecusa = 0), (e.fhAttempt = 0)),
      (e.fhKey = P),
      e.fhRecusa)
    )
      return;
    const te = () => {
      if (e.fhRecusa || document.hidden || navigator.onLine === !1) return;
      clearTimeout(e.fhRetry);
      const _ = Math.min(6e4, 2e3 * 2 ** Math.min(e.fhAttempt || 0, 5));
      ((e.fhAttempt = (e.fhAttempt || 0) + 1),
        (e.fhRetry = setTimeout(() => {
          ((e.fhRetry = null), se(e.fhWanted || E));
        }, _)));
    };
    try {
      const _ = new WebSocket(
        "wss://ws.finnhub.io?token=" + encodeURIComponent(P),
      );
      ((e.fh = _),
        (e.fhSyms = B),
        (e.fhAberto = 0),
        (e.fhStarted = Date.now()),
        (_.onopen = () => {
          e.fh === _ &&
            ((e.fhAberto = 1),
            (e.fhAttempt = 0),
            (e.fhRecusa = 0),
            v("Finnhub", "conectado (" + E.length + " ativos)", !0),
            E.forEach((ye) =>
              _.send(JSON.stringify({ type: "subscribe", symbol: ye })),
            ));
        }),
        (_.onclose = () => {
          e.fh === _ &&
            ((e.fh = null),
            (e.fhSyms = ""),
            (e.fhAberto = 0),
            v("Finnhub", "conexão interrompida; retomada automática", !1),
            te());
        }),
        (_.onerror = () => {
          e.fh === _ &&
            v("Finnhub", "conexão indisponível; tentando novamente", !1);
        }),
        (_.onmessage = (ye) => {
          if (e.fh === _)
            try {
              const Oe = JSON.parse(ye.data);
              if (Oe.type === "error") {
                (/api.?key|token|unauthor|authentication|invalid.*key/i.test(
                  Oe.msg || "",
                ) && ((e.fhRecusa = 1), clearTimeout(e.fhRetry), _.close()),
                  v(
                    "Finnhub",
                    "provedor recusou a assinatura; confira o diagnóstico",
                    !1,
                  ));
                return;
              }
              (Oe.data || []).forEach((De) => {
                De.s &&
                  +De.p > 0 &&
                  (Ie("FH:" + De.s, +De.p, null),
                  (e.px["FH:" + De.s].horarioPreco = Number.isFinite(+De.t)
                    ? new Date(+De.t).toISOString()
                    : null));
              });
            } catch {}
        }));
    } catch {
      te();
    }
  }
  function Ie(E, P, B) {
    if (!(P > 0)) return;
    const G = e.px[E];
    ((e.px[E] = { px: P, d1: B ?? (G ? G.d1 : null), ts: Date.now() }),
      G &&
        G.px !== P &&
        ((e.flash[E] = P > G.px ? "up" : "dn"),
        document
          .querySelectorAll(`[data-tk="${CSS.escape(E)}"]`)
          .forEach((te) => {
            ((te.textContent = c(P, te.dataset.dp ? +te.dataset.dp : 2)),
              te.classList.remove("fup", "fdn"),
              te.offsetWidth,
              te.classList.add(P > G.px ? "fup" : "fdn"));
          })));
  }
  const Pe = {
      HELP: "Lista de comandos",
      WEI: "Bolsas do mundo",
      FX: "Moedas",
      WCRS: "Moedas",
      CMDTY: "Commodities",
      GLCO: "Commodities",
      CRYP: "Cripto ao vivo (Binance)",
      BTMM: "Juros e mercado monetário",
      MON: "Seu monitor (ao vivo pelo Profit)",
      ADR: "ADRs brasileiras",
      MOST: "Mais negociadas · MOST ALTA · MOST BAIXA · MOST EUA",
      IMAP: "Mapa de calor da B3",
      ECO: "Agenda com resultado no minuto",
      ECST: "Indicadores de 6 países",
      ECFC: "Projeções do Focus",
      CENB: "Bancos centrais",
      WIRP: "Probabilidade do Copom e do Fed",
      GC: "Curvas de juros (DI e Treasuries)",
      TD: "Tesouro Direto",
      YAS: "Tesouro Direto e calculadora",
      TOP: "Manchetes",
      FIRST: "Agências (Reuters, Estadão, Valor)",
      N: "Notícias de um ativo ou tema · N PETR4",
      NI: "Notícias por tema · NI JUROS",
      EQS: "Filtro de ações",
      PORT: "Sua carteira aberta",
      ALRT: "Alertas de preço",
      ASKB: "Pergunte à IA · ASKB o que o Copom deve fazer?",
      BI: "Relatório da IA sobre um setor · BI bancos",
      BTST: "Backtest (abre a tela)",
      REPLAY: "Replay do pregão (abre a tela)",
      JORNAL: "Jornal do Pregão (abre a tela)",
      GRADE: "Grade de opções (abre a tela)",
    },
    Me = {
      Q: "Cotação e resumo",
      DES: "Ficha da empresa",
      GP: "Gráfico diário",
      GIP: "Gráfico de 5 minutos",
      FA: "Balanços (roteiro do Iudícibus)",
      ANR: "Analistas e preço-alvo",
      EE: "Resultados e projeções",
      ERN: "Resultados e projeções",
      RV: "Comparação com os pares",
      DVD: "Dividendos",
      N: "Notícias",
      OMON: "Grade de opções (ponte do Profit)",
      OV: "Precificação de opções",
      TRAN: "Resumo do último resultado (IA)",
    },
    ue = {},
    ve = {
      WCRS: "FX",
      GLCO: "CMDTY",
      ERN: "EE",
      YAS: "TD",
      LAUNCHPAD: "MON",
      MOV: "MOST",
      FXIP: "FX",
      WB: "GC",
      FWCV: "GC",
      CRVF: "GC",
      ECOF: "ECO",
      ECOW: "ECO",
    };
  function he(E) {
    const P = String(E || "")
      .trim()
      .toUpperCase()
      .replace(/\s+<GO>$/, "")
      .replace(/\s+GO$/, "");
    if (!P) return null;
    const B = P.split(/\s+/);
    let G = ve[B[0]] || B[0];
    if (Pe[G])
      return ["N", "NI", "ASKB", "BI"].includes(G) || (ue[G] && ue[G].livre)
        ? { f: G, arg: String(E).trim().split(/\s+/).slice(1).join(" ") }
        : { f: G, arg: B.slice(1).join(" ") };
    const te = B[0].replace(/[^A-Z0-9.!:]/g, "");
    let _ = ve[B[1]] || B[1] || "Q";
    return _ === "N"
      ? { f: "N", arg: te }
      : (Me[_] || (_ = "Q"), { f: _, tk: te, arg: B.slice(2).join(" ") });
  }
  function we(E) {
    E = String(E || "")
      .toUpperCase()
      .trim();
    const P = Object.keys(Pe)
      .map((B) => [B, Pe[B]])
      .concat(
        Object.keys(Me)
          .filter((B) => !["Q", "ERN"].includes(B))
          .map((B) => ["<ativo> " + B, Me[B]]),
      );
    return E
      ? P.filter(
          ([B, G]) => B.includes(E) || G.toUpperCase().includes(E),
        ).slice(0, 8)
      : P.slice(0, 8);
  }
  function Be(E, P) {
    const B = he(E);
    if (!B) {
      toast("Comando vazio.");
      return;
    }
    try {
      window.trUso && window.trUso(E, B);
    } catch {}
    const G = i();
    if (
      ((P = P ?? e.foco),
      (window.trTela && window.trTela(B.f)) ||
        (window.trAtivo &&
          B.tk &&
          B.f === "Q" &&
          String(E).trim().split(/\s+/).length === 1 &&
          window.trAtivo(B.tk)))
    )
      return;
    const te = G.p[P];
    ((G.p[P] =
      (ue[B.f] && ue[B.f].livre) ||
      String(E).trim().toUpperCase().startsWith("ASKB") ||
      String(E).trim().toUpperCase().startsWith("BI ") ||
      String(E).trim().toUpperCase().startsWith("N ") ||
      String(E).trim().toUpperCase().startsWith("NI ")
        ? String(E).trim()
        : String(E).trim().toUpperCase()),
      (e.hist = [G.p[P]]
        .concat(e.hist.filter((ye) => ye !== G.p[P]))
        .slice(0, 30)));
    try {
      APP_STORAGE.setItem("diario-term-hist", JSON.stringify(e.hist));
    } catch {}
    e.hi = -1;
    const _ = Ce(G, P);
    if (_) {
      const ye = _.indexOf(te);
      _[ye >= 0 ? ye : 0] = G.p[P];
    }
    if (
      (save(),
      l() || (e.mob = P),
      !document.querySelector(`#trp${P} .trpc`) || _)
    ) {
      render();
      return;
    }
    (Ye(P), ot(P));
  }
  function Ge() {
    document.body.classList.add("trmon");
    try {
      if (typeof GO < "u" && GO.r === "eco") {
        const De = i();
        (De.p.includes("ECO") || (De.p[0] = "ECO"), (GO.r = null));
      }
    } catch {}
    const E = r(),
      P = i(),
      B = l(),
      G = P.p.length;
    (e.foco >= G && (e.foco = 0),
      e.mob >= G && (e.mob = 0),
      e.max >= G && (e.max = -1));
    const te = `<div class="trbar">${B && !window.TRPOP ? '<button class="trbtn trmenub" data-tr="menu" title="Menu do app" aria-label="Abrir o menu do app"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>' : ""}<span class="trlogo">DIÁRIO<b>TERMINAL</b></span><div class="trcmdw"><input id="trcmd" class="trcmd" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Digite um comando: PETR4 G, WEI, ECO, WIRP, IA, HELP" aria-label="Comando do terminal"><button class="trgo" data-tr="go">GO</button><div id="trsug" class="trsug" hidden></div></div>
  <select class="trlay" data-trlay aria-label="Espaço de trabalho">${Object.entries(
    E.wss,
  )
    .map(
      ([De, Ne]) =>
        `<option value="${d(De)}"${E.ws === De ? " selected" : ""}>${d(Ne.n)}</option>`,
    )
    .join("")}<option value="__novo">+ Novo espaço…</option></select>
  <button class="trbtn" data-tr="addp" title="Abrir mais um painel">+ Painel</button>${B ? '<button class="trbtn" data-tr="org" title="Arrumar os painéis lado a lado">Organizar</button>' : ""}<button class="trbtn" data-tr="wsmenu" title="Renomear, duplicar ou excluir este espaço">${B ? "Espaço ▾" : "⋯"}</button><button class="trbtn" data-tr="sair">Sair</button></div>
  <div id="trtape" class="trtape">${typeof window.trTapeHtml == "function" ? window.trTapeHtml() : ""}</div>`,
      _ = B
        ? ""
        : `<div class="trtabs">${P.p.map((De, Ne) => `<button class="${Ne === e.mob ? "on" : ""}" data-trmob="${Ne}">${Ne + 1} ${d(String(De).split(" ").slice(0, 2).join(" ").slice(0, 12))}</button>`).join("")}</div>`,
      ye = B ? Math.max(...P.g.map((De) => De.y + De.h)) * t : 0,
      Oe = P.p
        .map(
          (De, Ne) =>
            `<section class="trp${Ne === e.foco ? " foco" : ""}${!B && Ne !== e.mob ? " oculto" : ""}${e.max === Ne ? " maxi" : ""}" id="trp${Ne}" data-trp="${Ne}"${B ? ` style="${Se(P.g[Ne])}"` : ""}><div class="trph"${B ? ' data-trdrag="1" title="Arraste para mover"' : ""}><b>${Ne + 1}</b>${de(P, Ne, De)}<span class="trpd">${Ce(P, Ne) ? "" : d(Ve(De))}</span><button class="trx" data-tr="csv" data-i="${Ne}" title="Exportar para planilha">CSV</button><button class="trx" data-tr="att" data-i="${Ne}" title="Atualizar">↻</button>${B && !window.TRPOP ? `<button class="trx" data-tr="pop" data-i="${Ne}" title="Abrir em outra janela (outro monitor)">⧉</button>` : ""}<button class="trx trmx" data-tr="maxi" data-i="${Ne}" title="Ampliar este painel">${e.max === Ne ? "⤡ Reduzir" : "⤢ Ampliar"}</button>${G > 1 ? `<button class="trx" data-tr="fecha" data-i="${Ne}" title="Fechar painel">✕</button>` : ""}</div><div class="trpb" id="trb${Ne}">${rt(De, Ne)}</div>${B ? '<i class="trrs" data-trrs="1" title="Arraste para redimensionar"></i>' : ""}</section>`,
        )
        .join("");
    return (
      setTimeout(() => {
        (P.p.forEach((De, Ne) => ot(Ne)), He());
      }, 0),
      `<div class="trm">${te}${_}<div class="trgrid${B ? " pc" : ""}" id="trgrid"${B ? ` style="height:${ye}px"` : ""}>${Oe}</div><div class="trrod"><span>F1 ajuda · F2 comando · F8 bolsas · F9 juros · F10 moedas · Tab troca de painel · ↑ histórico · arraste o título para mover e o canto para redimensionar</span><span id="trst">${Je()}</span></div></div>`
    );
  }
  const Ce = (E, P) =>
      E.t && Array.isArray(E.t[P]) && E.t[P].length ? E.t[P] : null,
    Qe = (E) => {
      const P = String(E).trim();
      return P.length > 16 ? P.slice(0, 15) + "…" : P;
    };
  function de(E, P, B) {
    const G = Ce(E, P);
    return G
      ? `<span class="trabas">${G.map((te, _) => `<span class="trab${te === B ? " on" : ""}"><button data-trtab="${P}|${_}" title="${d(te)}">${d(Qe(te))}</button><i data-trtabx="${P}|${_}" title="Fechar aba">×</i></span>`).join("")}<button class="trx" data-trtab="${P}|+" title="Nova aba">+</button></span><span class="trpc" hidden>${d(B)}</span>`
      : `<span class="trpc">${d(B)}</span><button class="trx trtb+" data-trtab="${P}|+" title="Nova aba neste painel">+</button>`;
  }
  const Se = (E) =>
      `left:calc(${((E.x / 12) * 100).toFixed(4)}% + 3px);top:${E.y * t + 3}px;width:calc(${((E.w / 12) * 100).toFixed(4)}% - 6px);height:${E.h * t - 6}px`,
    Ve = (E) => {
      const P = he(E);
      return P ? (P.tk ? Me[P.f] || "" : Pe[P.f] || "") : "";
    };
  function Je() {
    const E = Object.values(e.src).filter((De) => Date.now() - De.em < 12e4),
      P = E.filter((De) => De.rt && !De.falha).length,
      B = E.filter((De) => !De.rt && !De.falha).length,
      G = E.filter((De) => De.falha).length,
      te = E.length
        ? `<b class="tg">${P} tempo real</b> · <b class="am">${B} atrasados</b>${G ? ` · <b class="tr">${G} com falha</b>` : ""} · `
        : "",
      _ = Object.keys(e.profit).length,
      ye = e.ws && e.ws.readyState === 1,
      Oe = e.fh && e.fh.readyState === 1;
    return (
      te +
      `<button class="trlk" data-trcmd="STAT">fontes</button> · ${_ ? '<i class="tg">●</i> Profit ao vivo (' + _ + ")" : "<i>●</i> Profit desligado"} · ${ye ? '<i class="tg">●</i> Binance' : "<i>●</i> Binance"} · ${Oe ? '<i class="tg">●</i> Finnhub' : r().fh ? "<i>●</i> Finnhub" : "Finnhub sem chave"}`
    );
  }
  function Ye(E) {
    const P = document.getElementById("trb" + E);
    if (!P) return;
    const B = i(),
      G = B.p[E];
    P.innerHTML = rt(G, E);
    const te = document.querySelector(`#trp${E} .trpc`);
    te && (te.textContent = G);
    const _ = document.querySelector(`#trp${E} .trpd`);
    _ && (_.textContent = Ve(G));
  }
  function Xe() {
    i().p.forEach((P, B) => Ye(B));
    const E = document.getElementById("trst");
    E && (E.innerHTML = Je());
  }
  async function ot(E) {
    const P = i().p[E],
      B = he(P);
    if (B) {
      try {
        if (ue[B.f] && (!ue[B.f].tk || B.tk))
          ue[B.f].load && (await ue[B.f].load(B, E));
        else
          switch (B.f) {
            case "WEI":
              await h("mundo", { g: "wei" });
              break;
            case "FX":
              await h("mundo", { g: "fx" });
              break;
            case "CMDTY":
              await h("mundo", { g: "cmd" });
              break;
            case "CRYP":
              await h("mundo", { g: "cri" });
              break;
            case "BTMM":
              await Promise.all([
                h("mundo", { g: "jur" }),
                h("copom", {}, 6e4),
              ]);
              break;
            case "ADR":
              await h("cot", {
                s: [
                  "EWZ",
                  "PBR",
                  "VALE",
                  "ITUB",
                  "BBD",
                  "ABEV",
                  "SBS",
                  "ERJ",
                  "GGB",
                  "SID",
                  "SUZ",
                  "NU",
                  "XP",
                  "STNE",
                  "PAGS",
                  "BSBR",
                ],
              });
              break;
            case "MON":
              await h("cot", { s: r().mon }, 15e3);
              break;
            case "MOST":
              await h("most", Ke(B.arg), 3e4);
              break;
            case "IMAP":
              await h("most", { mk: "brazil", ord: "vol" }, 6e4);
              break;
            case "ECO":
              await h("agenda", {}, 6e4);
              break;
            case "ECST":
            case "ECFC":
            case "CENB":
              (await h("macro", {}, 30 * 6e4),
                B.f === "CENB" &&
                  (await Promise.all([
                    h("copom", {}, 6e4),
                    h("fed", {}, 3e5),
                  ])));
              break;
            case "WIRP":
              await Promise.all([h("copom", {}, 6e4), h("fed", {}, 3e5)]);
              break;
            case "GC":
              await Promise.all([
                h("copom", {}, 6e4),
                h("mundo", { g: "jur" }),
              ]);
              break;
            case "TD":
              await h("titulos", {}, 3e5);
              break;
            case "TOP":
            case "FIRST":
            case "NI":
              await h("noticias", {}, 12e4);
              break;
            case "N":
              await h("noticias", { q: B.arg || B.tk || "" }, 18e4);
              break;
            case "EQS":
              e.eqs.run && (await h("eqs", { mk: e.eqs.mk, f: e.eqs.f }, 6e4));
              break;
            case "PORT":
              await h("cot", { s: X() }, 15e3);
              break;
            case "Q":
              await Promise.all([
                h("cot", { s: [B.tk] }, 15e3),
                y(B.tk, "1d"),
                h("fund", { tk: B.tk }, 6e5),
              ]);
              break;
            case "GP":
              await y(B.tk, "1d");
              break;
            case "GIP":
              await y(B.tk, "5m");
              break;
            case "DES":
            case "FA":
            case "ANR":
            case "EE":
            case "RV":
            case "DVD":
              await h("fund", { tk: B.tk }, 6e5);
              break;
            case "OMON":
              await F(B.tk);
              break;
            case "OV":
              await h("cot", { s: [B.tk] }, 15e3);
              break;
            case "ALRT":
              break;
          }
      } catch {}
      document.getElementById("trb" + E) && Ye(E);
    }
  }
  const Ke = (E) => (
      (E = String(E || "").toUpperCase()),
      {
        mk: /EUA|US/.test(E) ? "america" : "brazil",
        ord: /ALTA/.test(E) ? "alta" : /BAIXA/.test(E) ? "baixa" : "vol",
      }
    ),
    at = (E, P) =>
      E
        ? `<div class="trerr">${d(E)}</div>`
        : `<div class="trload">${P === !1 ? "Sem dados." : "Carregando…"}</div>`;
  function rt(E, P) {
    const B = he(E);
    if (!B) return at("Comando vazio.");
    try {
      if (ue[B.f] && (!ue[B.f].tk || B.tk)) return ue[B.f].body(B, P);
      switch (B.f) {
        case "HELP":
          return vt();
        case "WEI":
          return ht("wei");
        case "FX":
          return ht("fx");
        case "CMDTY":
          return ht("cmd");
        case "CRYP":
          return ht("cri");
        case "BTMM":
          return ht("jur") + R(!0);
        case "ADR":
          return qe(
            {
              s: [
                "EWZ",
                "PBR",
                "VALE",
                "ITUB",
                "BBD",
                "ABEV",
                "SBS",
                "ERJ",
                "GGB",
                "SID",
                "SUZ",
                "NU",
                "XP",
                "STNE",
                "PAGS",
                "BSBR",
              ],
            },
            "ADRs em Nova York",
          );
        case "MON":
          return Le();
        case "MOST":
          return ke(B.arg);
        case "IMAP":
          return ze();
        case "ECO":
          return Ue();
        case "ECST":
          return pe();
        case "ECFC":
          return Q();
        case "CENB":
          return re();
        case "WIRP":
          return R();
        case "GC":
          return z();
        case "TD":
          return oe();
        case "TOP":
          return me("", 0);
        case "FIRST":
          return me("", 1);
        case "N":
          return me(B.arg || B.tk, 0);
        case "NI":
          return me("", 0, B.arg);
        case "EQS":
          return be();
        case "PORT":
          return xe();
        case "ALRT":
          return $e();
        case "ASKB":
          return fe(B.arg, P);
        case "BI":
          return fe(
            "Faça um relatório setorial curto (estilo Bloomberg Intelligence) sobre: " +
              B.arg +
              ". Inclua: principais empresas da B3, motores do setor, riscos, o que acompanhar e múltiplos típicos.",
            P,
          );
        case "Q":
          return H(B.tk);
        case "GP":
          return W(B.tk, "1d");
        case "GIP":
          return W(B.tk, "5m");
        case "DES":
          return V(B.tk);
        case "FA":
          return ee(B.tk);
        case "ANR":
          return le(B.tk);
        case "EE":
          return Y(B.tk);
        case "RV":
          return q(B.tk);
        case "DVD":
          return L(B.tk);
        case "OMON":
          return ge(B.tk);
        case "OV":
          return je(B.tk, P);
        case "TRAN":
          return fe(
            `Resuma o último resultado trimestral e a teleconferência de ${B.tk}: números principais contra o consenso, o que a diretoria disse (guidance), pontos positivos, negativos e como o mercado reagiu.`,
            P,
          );
        default:
          return vt();
      }
    } catch (G) {
      return at("Erro ao desenhar: " + G.message);
    }
  }
  const dt = (E, P, B) =>
    `<table class="trt"${B ? ` data-csv="${B}"` : ""}><thead><tr>${E.map((G) => `<th>${G}</th>`).join("")}</tr></thead><tbody>${P.join("")}</tbody></table>`;
  function vt() {
    const E = Object.entries(Pe)
      .map(([P, B]) => `<tr><td class="tk">${P}</td><td>${d(B)}</td></tr>`)
      .concat(
        Object.entries(Me)
          .filter(([P]) => P !== "ERN")
          .map(
            ([P, B]) =>
              `<tr><td class="tk">PETR4 ${P}</td><td>${d(B)}</td></tr>`,
          ),
      );
    return `<div class="trnote">Digite o comando e Enter (ou GO). Clique num painel para ele receber o próximo comando. No celular, as abas de cima trocam de painel.</div>${dt(["Comando", "O que faz"], E)}
  <div class="trnote">Ações dos EUA ao vivo: cole a sua chave gratuita do Finnhub <input id="trfh" class="trin" value="${d(r().fh || "")}" placeholder="chave do finnhub.io" style="width:180px"> <button class="trbtn" data-tr="fh">Salvar</button></div>`;
  }
  function ft(E, P) {
    const B = (E.pedido || String(E.s || "").split(":")[1] || "").replace(
        /1!$/,
        "",
      ),
      G = C(
        E.pedido || (String(E.s || "").startsWith("BMFBOVESPA:") ? B : E.s),
        E,
        E.r,
      );
    return `<tr data-trgo="${d(B)}"><td class="tk">${d(E.n || E.pedido || E.s)}</td><td class="num"${G.k ? ` data-tk="${d(G.k)}" data-dp="${P ?? 2}"` : ""}>${c(G.px, P ?? 2)}</td><td class="num ${u(G.d1)}">${p(G.d1)}</td><td class="num">${I(G)}</td></tr>`;
  }
  function ht(E) {
    const P = b("mundo", { g: E });
    if (!P.v) return at(P.err);
    E === "cri" &&
      J(P.v.grupos.flatMap((G) => G.itens.map((te) => te.r)).filter(Boolean));
    const B = Date.parse(P.v.em);
    return (
      P.v.grupos
        .map(
          (G) =>
            `<div class="trsec">${d(G.nome)}</div>${dt(
              ["Ativo", "Último", "Var.", "Fonte"],
              G.itens.map((te) => ft({ ...te, _em: B }, te.dp)),
              "m" + E,
            )}`,
        )
        .join("") +
      `<div class="trfont">Fonte: ${d(P.v.fonte)}${E === "cri" ? " + Binance ao vivo" : ""} · ${f(P.v.em)}</div>`
    );
  }
  function qe(E, P) {
    const B = b("cot", E);
    return B.v
      ? `<div class="trsec">${d(P)}</div>` +
          dt(
            ["Ativo", "Último", "Var.", "Fonte"],
            B.v.itens.map((G) =>
              ft({ ...G, n: G.pedido, _em: Date.parse(B.v.em) }, 2),
            ),
            "cot",
          ) +
          `<div class="trfont">${f(B.v.em)} · TradingView</div>`
      : at(B.err);
  }
  function Le() {
    const E = r(),
      P = b("cot", { s: E.mon }),
      B = E.mon.filter(
        (ye) => /^[A-Z]{1,5}$/.test(ye) && !/^(IBOV|WIN|WDO)/.test(ye),
      );
    se(B);
    const G =
        '<div class="trrow"><input id="trmonadd" class="trin" placeholder="Adicionar ativo (ex.: BBDC4)"><button class="trbtn" data-tr="monadd">+</button></div>',
      te = P.v ? Date.parse(P.v.em) : 0,
      _ = E.mon.map((ye) => {
        const Oe = ((P.v && P.v.itens) || []).find(
            (Ne) => Ne.pedido === ye,
          ) || { pedido: ye, s: ye, px: P.v ? null : void 0 },
          De = C(ye, { ...Oe, _em: te });
        return `<tr data-trgo="${d(ye.replace(/FUT$/, ""))}"><td class="tk">${d(ye)}</td><td class="num"${De.k ? ` data-tk="${d(De.k)}"` : ""}>${c(De.px)}</td><td class="num ${u(De.d1)}">${p(De.d1)}</td><td class="num">${c(De.max)}</td><td class="num">${c(De.min)}</td><td class="num">${P.v || De.fonte !== "—" ? I(De) : ""}</td><td><button class="trx" data-tr="monrm" data-v="${d(ye)}" aria-label="Tirar">✕</button></td></tr>`;
      });
    return (
      G +
      dt(["Ativo", "Último", "Var.", "Máx.", "Mín.", "Fonte", ""], _, "mon") +
      '<div class="trfont">Prioridade: ponte do Profit (B3 ao vivo) → Finnhub (EUA ao vivo) → TradingView (tempo real ou 15 min). <b>PF 3s</b> = Profit há 3 s · <b>15m</b> = atrasado · <button class="trlk" data-trcmd="STAT">ver todas as fontes</button></div>'
    );
  }
  function ke(E) {
    const P = Ke(E),
      B = b("most", P);
    return B.v
      ? `<div class="trsec">${{ vol: "Mais negociadas", alta: "Maiores altas", baixa: "Maiores baixas" }[P.ord] + (P.mk === "america" ? " (EUA)" : " (B3)")} <span class="mut">MOST · MOST ALTA · MOST BAIXA · MOST EUA</span></div>` +
          dt(
            ["Ativo", "Último", "Var.", "Financeiro"],
            B.v.itens.map(
              (G) =>
                `<tr data-trgo="${d(G.s.split(":")[1])}"><td class="tk">${d(G.s.split(":")[1])}</td><td class="num">${c(G.px)}</td><td class="num ${u(G.d1)}">${p(G.d1)}</td><td class="num">${m(G.fin)}</td></tr>`,
            ),
            "most",
          )
      : at(B.err);
  }
  function ze() {
    const E = b("most", { mk: "brazil", ord: "vol" });
    if (!E.v) return at(E.err);
    const P = E.v.itens.slice(0, 40),
      B = P.reduce((G, te) => G + (te.fin || 0), 0) || 1;
    return `<div class="trimap">${P.map((G) => {
      const te = G.d1 || 0,
        _ = Math.min(1, Math.abs(te) / 4),
        ye =
          te >= 0
            ? `rgba(34,197,94,${0.15 + _ * 0.7})`
            : `rgba(239,68,68,${0.15 + _ * 0.7})`,
        Oe = Math.max(9, Math.sqrt((G.fin || 0) / B) * 100);
      return `<button data-trgo="${d(G.s.split(":")[1])}" style="flex-basis:${Oe.toFixed(1)}%;background:${ye}"><b>${d(G.s.split(":")[1])}</b><span>${p(te, 1)}</span></button>`;
    }).join(
      "",
    )}</div><div class="trfont">Tamanho = volume financeiro; cor = variação do dia. TradingView, 15 min.</div>`;
  }
  function Ue() {
    const E = b("agenda");
    if (!E.v) return at(E.err);
    const P = Date.now(),
      B = E.v.itens
        .filter((_) => _.imp >= 2 && Date.parse(_.d) > P - 36 * 36e5)
        .slice(0, 80);
    (B.forEach((_) => {
      _.atual &&
        !e.ultEco[_.id] &&
        ((e.ultEco[_.id] = 1),
        e.ecoIni &&
          _.imp === 3 &&
          toast(
            `${_.pais}: ${_.t} saiu ${_.atual} (proj. ${_.prev || "—"})`,
            6e3,
          ));
    }),
      (e.ecoIni = 1));
    let G = "";
    const te = [];
    return (
      B.forEach((_) => {
        const ye = x(_.d);
        ye !== G &&
          ((G = ye),
          te.push(
            `<tr class="trdia"><td colspan="6">${new Date(_.d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}</td></tr>`,
          ));
        const Oe = _.sur,
          De = Date.parse(_.d) > P,
          Ne = Math.round((Date.parse(_.d) - P) / 6e4);
        te.push(
          `<tr class="${_.imp === 3 ? "imp" : ""}"><td class="num">${f(_.d)}</td><td>${d({ EUA: "EUA", Brasil: "BR", "Zona do Euro": "EUR", "Reino Unido": "UK", Japão: "JP", China: "CN", Alemanha: "DE" }[_.pais] || _.pais)}</td><td>${d(_.t)}${De && Ne <= 90 ? ` <span class="am">em ${Ne} min</span>` : ""}</td><td class="num ${Oe ? (Oe.tom === "forte" ? "tg" : Oe.tom === "fraca" ? "tr" : "") : ""}"><b>${d(_.atual || "")}</b></td><td class="num mut">${d(_.prev || "")}</td><td class="num mut">${d(_.ant || "")}</td></tr>`,
        );
      }),
      dt(["Hora", "País", "Evento", "Saiu", "Proj.", "Ant."], te, "eco") +
        `<div class="trfont">${d(E.v.fonte)}${E.v.aviso ? " · " + d(E.v.aviso) : ""} · atualiza a cada minuto · verde/vermelho = acima/abaixo do esperado</div>`
    );
  }
  const We = (E, P = 70, B = 18) => {
      const G = (E || [])
        .map((Oe) => Oe[1])
        .filter((Oe) => isFinite(Oe))
        .slice(-24);
      if (G.length < 2) return "";
      const te = Math.min(...G),
        _ = Math.max(...G),
        ye = _ - te || 1;
      return `<svg width="${P}" height="${B}" viewBox="0 0 ${P} ${B}" class="trspk"><path d="${G.map((Oe, De) => (De ? "L" : "M") + ((De * (P - 2)) / (G.length - 1) + 1).toFixed(1) + "," + (B - 1 - ((Oe - te) / ye) * (B - 2)).toFixed(1)).join("")}" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;
    },
    Re = (E) =>
      E.atual == null
        ? `<span class="am" title="${d(E.erro || "sem dado")}">sem resposta</span>`
        : `<b>${c(E.atual, E.un === "mil" ? 0 : 2)}</b>${E.un === "%" ? "%" : ""}`,
    K = (E) => {
      const P =
        (E && E.falhas) ||
        (E && E.paises
          ? E.paises.flatMap((G) =>
              G.itens
                .filter((te) => te.atual == null)
                .map((te) => ({
                  pais: G.nome,
                  nome: te.nome,
                  fonte: te.fonte,
                  erro: te.erro,
                })),
            )
          : []);
      if (!P.length) return "";
      const B = {};
      return (
        P.forEach((G) => {
          (B[G.fonte] = B[G.fonte] || []).push(G.pais + ": " + G.nome);
        }),
        `<div class="trnote am">⚠ ${P.length} indicador${P.length > 1 ? "es" : ""} sem resposta agora. ${Object.entries(
          B,
        )
          .map(([G, te]) => `<b>${d(G)}</b> (${te.length})`)
          .join(
            " · ",
          )}. O servidor tenta de novo em 5 minutos; a causa está na VARR (varredura das fontes).</div>`
      );
    };
  ((window.trMacVal = Re), (window.trMacFalhas = K));
  function pe() {
    const E = b("macro");
    return E.v
      ? K(E.v) +
          E.v.paises
            .map(
              (P) =>
                `<div class="trsec">${d(P.nome)}</div>` +
                dt(
                  ["Indicador", "Atual", "Anterior", "Período", ""],
                  P.itens.map(
                    (B) =>
                      `<tr><td>${d(B.nome)}</td><td class="num">${Re(B)}</td><td class="num mut">${c(B.anterior, B.un === "mil" ? 0 : 2)}</td><td class="mut">${d(B.periodo || "")}</td><td>${We(B.serie)}</td></tr>`,
                  ),
                  "ecst" + P.id,
                ),
            )
            .join("") +
          `<div class="trfont">Banco Central, IBGE, FRED, BIS, OCDE e Eurostat · ${f(E.v.gerado)}</div>`
      : at(E.err);
  }
  function Q() {
    const E = b("macro");
    if (!E.v) return at(E.err);
    const P = E.v.focus;
    return P
      ? `<div class="trsec">Focus de ${d(P.data)} (contra ${d(P.antes)})</div>` +
          dt(
            ["Indicador", "Ano", "Mediana", "4 sem. antes", "Mudou"],
            P.itens.map(
              (B) =>
                `<tr><td>${d(B.ind)}</td><td>${B.ref}</td><td class="num"><b>${c(B.v)}</b></td><td class="num mut">${c(B.ant)}</td><td class="num ${u(B.v != null && B.ant != null ? (B.ind === "PIB Total" ? 1 : -1) * (B.v - B.ant) : null)}">${B.v != null && B.ant != null ? (B.v - B.ant > 0 ? "+" : "") + c(B.v - B.ant) : ""}</td></tr>`,
            ),
            "focus",
          )
      : at("O Focus não respondeu agora.");
  }
  function re() {
    const E = b("macro"),
      P = b("copom").v,
      B = b("fed").v;
    if (!E.v) return at(E.err);
    const G = E.v.paises.map((te) => {
      const _ = te.itens.find((ye) => ye.o === "juros");
      return `<tr><td>${d(te.nome)}</td><td class="num"><b>${c(_ && _.atual)}%</b></td><td class="num mut">${c(_ && _.anterior)}%</td><td class="mut">${d((_ && _.periodo) || "")}</td><td>${te.id === "BR" && P && P.reunioes[0] ? `Copom ${x(P.reunioes[0].decisao + "T12:00:00Z")}: ${P.reunioes[0].mov_pb > 0 ? "+" : ""}${P.reunioes[0].mov_pb} pb` : te.id === "US" && B && B.reunioes[0] ? `Fed ${x(B.reunioes[0].decisao + "T12:00:00Z")}: ${B.reunioes[0].mov_pb > 0 ? "+" : ""}${B.reunioes[0].mov_pb} pb` : ""}</td></tr>`;
    });
    return dt(
      ["Banco central", "Taxa", "Anterior", "Desde", "Próxima (implícita)"],
      G,
      "cenb",
    );
  }
  function ie(E) {
    return E.map(
      (P) =>
        `<span class="trpb2"><i style="width:${P.p}%"></i><em>${P.mov_pb > 0 ? "+" : ""}${P.mov_pb} pb: ${c(P.p, 0)}%</em></span>`,
    ).join("");
  }
  function R(E) {
    const P = b("copom"),
      B = b("fed");
    let G = "";
    return (
      P.v
        ? (G +=
            `<div class="trfont">${d((P.v.avisos || []).join(" · "))}</div><div class="trsec">Copom · Selic ${c(P.v.selic)}% · CDI ${c(P.v.cdi)}%</div>` +
            dt(
              ["Reunião", "Implícito", "Selic esperada", "Probabilidades"],
              P.v.reunioes
                .slice(0, E ? 2 : 4)
                .map(
                  (te) =>
                    `<tr><td>${x(te.decisao + "T12:00:00Z")}</td><td class="num ${u(-te.mov_pb)}">${te.mov_pb > 0 ? "+" : ""}${te.mov_pb} pb</td><td class="num"><b>${c(te.selic_esperada)}%</b></td><td>${ie(te.probs)}</td></tr>`,
                ),
              "copom",
            ))
        : (G += at(P.err)),
      E ||
        (B.v
          ? (G +=
              `<div class="trsec">Fed · faixa ${c(B.v.faixa[0])}–${c(B.v.faixa[1])}% · efetiva ${c(B.v.efetiva)}%</div>` +
              dt(
                ["Reunião", "Implícito", "Teto esperado", "Probabilidades"],
                B.v.reunioes.map(
                  (te) =>
                    `<tr><td>${x(te.decisao + "T12:00:00Z")}</td><td class="num ${u(-te.mov_pb)}">${te.mov_pb > 0 ? "+" : ""}${te.mov_pb} pb</td><td class="num"><b>${c(te.teto_esperado)}%</b></td><td>${ie(te.probs)}</td></tr>`,
                ),
                "fed",
              ))
          : (G += at(B.err))),
      G +
        '<div class="trfont">Calculado pela curva de DI1 (como o WIRP) e pelos futuros de fed funds (como o FedWatch). Não é recomendação.</div>'
    );
  }
  function z() {
    const E = b("copom"),
      P = b("mundo", { g: "jur" });
    let B = E.v?.avisos?.length
      ? `<div class="trfont">${d(E.v.avisos.join(" · "))}</div>`
      : "";
    if (E.v && E.v.curva.length > 1) {
      const G = E.v.curva,
        te = 360,
        _ = 150,
        ye = Math.min(...G.map((_e) => _e.taxa)) - 0.1,
        Oe = Math.max(...G.map((_e) => _e.taxa)) + 0.1,
        De = (_e) => 20 + (_e * (te - 30)) / (G.length - 1),
        Ne = (_e) => _ - 18 - ((_e - ye) / (Oe - ye)) * (_ - 30);
      B +=
        `<div class="trsec">Curva pré (DI1)</div><svg viewBox="0 0 ${te} ${_}" class="trsvg"><path d="${G.map((_e, lt) => (lt ? "L" : "M") + De(lt) + "," + Ne(_e.taxa)).join("")}" fill="none" stroke="#c2933d" stroke-width="2"/>${G.map((_e, lt) => `<circle cx="${De(lt)}" cy="${Ne(_e.taxa)}" r="2.5" fill="#c2933d"/>`).join("")}${G.filter(
          (_e, lt) => lt % 2 === 0,
        )
          .map(
            (_e, lt) =>
              `<text x="${De(lt * 2)}" y="${_ - 4}" font-size="9" text-anchor="middle" fill="#888888">${_e.cod.slice(3)}</text>`,
          )
          .join(
            "",
          )}<text x="4" y="12" font-size="9" fill="#888888">${c(Oe, 2)}%</text><text x="4" y="${_ - 20}" font-size="9" fill="#888888">${c(ye, 2)}%</text></svg>` +
        dt(
          ["Vértice", "Taxa", "Var. (pb)"],
          G.map(
            (_e) =>
              `<tr><td class="tk">${_e.cod}</td><td class="num">${c(_e.taxa, 3)}</td><td class="num ${u(_e.var_pb)}">${_e.var_pb != null ? (_e.var_pb > 0 ? "+" : "") + _e.var_pb : ""}</td></tr>`,
          ),
          "di",
        );
    } else B += at(E.err);
    return (
      P.v &&
        (B += P.v.grupos
          .map(
            (G) =>
              `<div class="trsec">${d(G.nome)}</div>` +
              dt(
                ["Título", "Taxa", "Var."],
                G.itens.map(
                  (te) =>
                    `<tr><td>${d(te.n)}</td><td class="num">${c(te.px, 3)}</td><td class="num ${u(te.dabs)}">${te.dabs != null ? (te.dabs > 0 ? "+" : "") + c(te.dabs * 100, 0) + " pb" : ""}</td></tr>`,
                ),
              ),
          )
          .join("")),
      B
    );
  }
  function oe() {
    const E = b("titulos");
    if (!E.v) return at(E.err);
    const P = E.v.tesouro;
    let B = "";
    P.length
      ? (P[0].data_base &&
          (B += `<div class="trnote">Preços e taxas do fechamento de ${P[0].data_base.split("-").reverse().join("/")} (Tesouro Transparente). O site do Tesouro Direto parou de publicar os preços ao vivo para outros sistemas em 2025.</div>`),
        (B += dt(
          ["Título", "Vencimento", "Taxa compra", "PU compra", "Taxa venda"],
          P.map(
            (De) =>
              `<tr data-trtd="${d(De.nome)}|${De.venc}|${De.taxa_compra || ""}"><td>${d(De.nome)}</td><td>${De.venc.split("-").reverse().join("/")}</td><td class="num"><b>${De.taxa_compra != null ? c(De.taxa_compra) + "%" : "—"}</b></td><td class="num">${c(De.pu_compra)}</td><td class="num mut">${De.taxa_venda != null ? c(De.taxa_venda) + "%" : "—"}</td></tr>`,
          ),
          "td",
        )))
      : (B += `<div class="trerr">O site do Tesouro Direto não respondeu ao servidor${E.v.tesouro_erro ? " (" + d(E.v.tesouro_erro) + ")" : ""}. A curva de juros segue em GC.</div>`);
    const G = e.yas || { tx: 13, du: 756 },
      te = 1e3 / Math.pow(1 + G.tx / 100, G.du / 252),
      _ = G.du / 252,
      ye = _ / (1 + G.tx / 100),
      Oe = te * ye * 1e-4;
    return (
      (B += `<div class="trsec">Calculadora (prefixado sem cupom, como o Tesouro Prefixado)</div><div class="trrow"><label>Taxa % a.a. <input class="trin" type="number" step="0.01" data-tryas="tx" value="${G.tx}"></label><label>Dias úteis <input class="trin" type="number" data-tryas="du" value="${G.du}"></label></div>
  <div class="trkv"><span>PU <b>${c(te)}</b></span><span>Duration <b>${c(_, 2)} anos</b></span><span>Duration modificada <b>${c(ye, 2)}</b></span><span>DV01 <b>R$ ${c(Oe, 4)}</b></span><span>Se a taxa subir 1 p.p. <b class="tr">${p(-ye)}</b></span></div>`),
      B
    );
  }
  function me(E, P, B) {
    const G = b("noticias", E ? { q: E } : {});
    if (!G.v) return at(G.err);
    let te = G.v.itens;
    if ((P && (te = te.filter((_) => _.ag)), B)) {
      const _ = B.toLowerCase();
      te = te.filter(
        (ye) =>
          (ye.tags || []).some((Oe) =>
            Oe.toLowerCase().startsWith(_.slice(0, 4)),
          ) || ye.t.toLowerCase().includes(_),
      );
    }
    return `<div class="trnews">${
      te
        .slice(0, 60)
        .map(
          (_) =>
            `<a href="${d(_.l)}" target="_blank" rel="noopener"><span class="num mut">${f(_.d)}</span><span class="am">${d(_.f)}</span><span>${d(_.t)}</span></a>`,
        )
        .join("") || '<div class="trload">Nada agora.</div>'
    }</div><div class="trfont">Só manchete e link · ${d((G.v.fontes || []).length)} fontes${G.v.falharam && G.v.falharam.length ? " · fora do ar: " + d(G.v.falharam.join(", ")) : ""}</div>`;
  }
  function be() {
    const E = e.eqs,
      P = E.f,
      B = E.run ? b("eqs", { mk: E.mk, f: P }) : null,
      G = (_, ye, Oe) =>
        `<label>${ye}<input class="trin" type="number" step="${Oe}" data-treqs="${_}" value="${P[_] ?? ""}"></label>`;
    let te = `<div class="trrow"><select class="trin" data-treqs="mk"><option value="brazil"${E.mk === "brazil" ? " selected" : ""}>B3</option><option value="america"${E.mk === "america" ? " selected" : ""}>EUA</option></select>${G("plMax", "P/L até", "0.5")}${G("pvpMax", "P/VPA até", "0.1")}${G("dyMin", "DY desde %", "0.5")}${G("roeMin", "ROE desde %", "1")}<button class="trbtn" data-tr="eqs">Filtrar</button></div>`;
    return B
      ? B.v
        ? te +
          dt(
            ["Ativo", "Preço", "P/L", "P/VPA", "DY", "ROE", "Setor"],
            B.v.itens.map(
              (_) =>
                `<tr data-trgo="${d(_.s.split(":")[1])}"><td class="tk">${d(_.s.split(":")[1])}</td><td class="num">${c(_.px)}</td><td class="num">${c(_.pl, 1)}</td><td class="num">${c(_.pvp, 2)}</td><td class="num">${c(_.dy, 1)}%</td><td class="num">${c(_.roe, 1)}%</td><td class="mut">${d(_.setor || "")}</td></tr>`,
            ),
            "eqs",
          )
        : te + at(B.err)
      : te + '<div class="trnote">Escolha os limites e toque em Filtrar.</div>';
  }
  function X() {
    try {
      return [
        ...new Set(
          S.trades
            .filter((E) => isOpen(E))
            .map((E) =>
              String(E.ativo || "")
                .toUpperCase()
                .replace(/(FUT|[FGHJKMNQUVXZ]\d\d)$/, (P) =>
                  /^WIN|^WDO/.test(E.ativo) ? "FUT" : P,
                ),
            )
            .filter(Boolean),
        ),
      ].slice(0, 40);
    } catch {
      return [];
    }
  }
  function xe() {
    let E = [];
    try {
      E = S.trades.filter((te) => isOpen(te));
    } catch {}
    if (!E.length)
      return '<div class="trnote">Nenhuma posição aberta no diário. Abra trades em Operações e eles aparecem aqui com o preço ao vivo.</div>';
    const P = b("cot", { s: X() });
    let B = 0;
    const G = E.map((te) => {
      const _ = String(te.ativo || "").toUpperCase(),
        ye = A(_),
        Oe = ((P.v && P.v.itens) || []).find((it) => it.pedido === _),
        De = ye && ye.px ? ye.px : Oe && Oe.px,
        Ne = +te.qty || 0,
        _e = +te.entry || 0,
        lt = +te.pv || 1,
        et = te.side === "V" ? -1 : 1,
        nt = De ? (De - _e) * Ne * lt * et : null;
      return (
        nt && (B += nt),
        `<tr data-trgo="${d(_)}"><td class="tk">${d(_)}</td><td>${te.side === "V" ? "Vendido" : "Comprado"}</td><td class="num">${c(Ne, 0)}</td><td class="num">${c(_e)}</td><td class="num">${c(De)}</td><td class="num ${u(nt)}">${nt != null ? c(nt) : "—"}</td><td class="num mut">${+te.stop ? c(+te.stop) : "sem stop"}</td></tr>`
      );
    });
    return (
      dt(
        ["Ativo", "Lado", "Qtd.", "Entrada", "Último", "Resultado R$", "Stop"],
        G,
        "port",
      ) +
      `<div class="trkv"><span>Resultado aberto <b class="${u(B)}">R$ ${c(B)}</b></span></div>`
    );
  }
  function $e() {
    const E = ((S.ax || {}).alpx || []).filter((P) => !P.fired);
    return (
      '<div class="trrow"><input id="tralk" class="trin" placeholder="Ativo (PETR4)" style="width:110px"><select id="tralo" class="trin"><option value=">">sobe acima de</option><option value="<">cai abaixo de</option></select><input id="tralv" class="trin" type="number" step="0.01" placeholder="Preço" style="width:100px"><button class="trbtn" data-tr="alrt">Criar</button></div>' +
      (E.length
        ? dt(
            ["Ativo", "Condição", "Preço", ""],
            E.map(
              (P) =>
                `<tr><td class="tk">${d(P.c)}</td><td>${P.op === ">" ? "acima de" : "abaixo de"}</td><td class="num">${c(P.v)}</td><td><button class="trx" data-tr="alrm" data-v="${d(P.id)}">✕</button></td></tr>`,
            ),
            "alrt",
          )
        : '<div class="trnote">Nenhum alerta ativo. O aviso chega no celular (notificações ligadas).</div>')
    );
  }
  function fe(E, P) {
    if (((E = String(E || "").trim()), !E))
      return '<div class="trnote">Escreva a pergunta depois de ASKB. Ex.: ASKB o que muda para a bolsa se o Copom cortar 0,5?</div>';
    const B = "ask|" + E,
      G = e.dados[B];
    if (
      (!G &&
        !e.busy[B] &&
        ((e.busy[B] = 1),
        (async () => {
          try {
            const _ = Fe(),
              ye = await anxCall({
                modo: "economista",
                texto:
                  E +
                  (_
                    ? `

Dados do terminal agora:
` + _
                    : ""),
              });
            e.dados[B] = { ts: Date.now(), v: ye.resposta || ye };
          } catch (_) {
            e.err[B] = String(_.message || _);
          }
          (delete e.busy[B], Xe());
        })()),
      !G)
    )
      return e.err[B]
        ? at(e.err[B])
        : '<div class="trload">A IA está pensando (até 1 min)…</div>';
    const te = G.v || {};
    return `<div class="trask"><b class="am">${d(te.titulo || "Resposta")}</b>${te.resumo ? `<p>${d(te.resumo)}</p>` : ""}${(te.explicacao || []).map((_) => `<p>${d(_)}</p>`).join("")}
  ${
    (te.impactos || []).length
      ? dt(
          ["Mercado", "Direção", "Por quê"],
          te.impactos.map(
            (_) =>
              `<tr><td>${d(_.mercado)}</td><td class="${/alta|sobe/i.test(_.direcao) ? "tg" : /baixa|cai/i.test(_.direcao) ? "tr" : ""}">${d(_.direcao)}</td><td>${d(_.porque)}</td></tr>`,
          ),
        )
      : ""
  }
  ${(te.cenarios || []).map((_) => `<p><b>${d(_.nome)} (${_.probabilidade_pct}%)</b> ${d(_.descricao)}</p>`).join("")}${(te.o_que_observar || []).length ? `<p class="mut">Acompanhar: ${d(te.o_que_observar.join(" · "))}</p>` : ""}</div>`;
  }
  function Fe() {
    const E = [],
      P = (B) =>
        B
          ? new Date(B).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "?";
    E.push("Agora: " + P(Date.now()) + " (horário de Brasília do aparelho).");
    try {
      const B = b("copom");
      B.v &&
        E.push(
          `Selic ${B.v.selic}%, CDI ${B.v.cdi}%, próximo Copom implícito ${B.v.reunioes[0] ? B.v.reunioes[0].mov_pb + " pb" : "?"} [fonte: curva de DI1 com 15 min de atraso e Banco Central; dado de ${P(B.ts)}]`,
        );
      const G = b("fed");
      G.v &&
        E.push(
          `Fed faixa ${G.v.faixa.join("-")}%, próxima reunião implícita ${G.v.reunioes[0] ? G.v.reunioes[0].mov_pb + " pb" : "?"} [fonte: futuros de fed funds e FRED; dado de ${P(G.ts)}]`,
        );
      const te = b("mundo", { g: "wei" });
      te.v &&
        E.push(
          "Bolsas: " +
            te.v.grupos[0].itens
              .slice(0, 4)
              .map((_) => {
                const ye = C(
                  String(_.s || "").startsWith("BMFBOVESPA:")
                    ? _.s.split(":")[1]
                    : _.s,
                  { ..._, _em: Date.parse(te.v.em) },
                );
                return `${_.n} ${p(ye.d1)} [${ye.fonte}${ye.rt ? " tempo real" : " atrasado 15 min"}, dado de ${P(ye.ts)}]`;
              })
              .join(", "),
        );
    } catch {}
    return E.join(`
`);
  }
  function w(E) {
    const P = b("cot", { s: [E] }),
      B = P.v && P.v.itens[0],
      G = C(E, B ? { ...B, _em: Date.parse(P.v.em) } : {});
    return (
      !P.v && !P.busy && !P.err && h("cot", { s: [E] }, 15e3),
      `<div class="trah"><b class="tk">${d(E)}</b><span class="mut">${d((B && B.n) || "")}</span><span class="num big"${G.k ? ` data-tk="${d(G.k)}"` : ""}>${c(G.px)}</span><span class="num ${u(G.d1)}">${p(G.d1)}</span>${G.px != null ? I(G) : ""}</div>${cotacaoReferencia(B)}`
    );
  }
  function H(E) {
    const P = b("fund", { tk: E }).v,
      B = (P && P.tv) || {},
      G = (P && P.yahoo) || {},
      te = G.numeros || {};
    return (
      w(E) +
      N(E, "1d", 120, !0) +
      `<div class="trkv">${[
        ["Valor de mercado", m(B.market_cap_basic || te.valor_mercado)],
        ["P/L", c(B.price_earnings_ttm || te.pl, 1)],
        ["P/VPA", c(B.price_book_ratio || te.pvp, 2)],
        [
          "DY",
          B.dividend_yield_recent != null
            ? c(B.dividend_yield_recent, 1) + "%"
            : "—",
        ],
        [
          "ROE",
          B.return_on_equity != null ? c(B.return_on_equity, 1) + "%" : "—",
        ],
        ["Beta", c(B.beta_1_year || te.beta, 2)],
        ["Máx. 52 sem.", c(B.price_52_week_high)],
        ["Mín. 52 sem.", c(B.price_52_week_low)],
        ["No ano", p(B["Perf.YTD"])],
      ]
        .map(([_, ye]) => `<span>${_} <b>${ye}</b></span>`)
        .join(
          "",
        )}</div><div class="trnote">Mais: ${["DES", "FA", "ANR", "EE", "RV", "DVD", "GP", "GIP", "OMON", "N"].map((_) => `<button class="trlk" data-trcmd="${d(E)} ${_}">${_}</button>`).join(" ")}</div>`
    );
  }
  function N(E, P, B, G) {
    const te = "cd|" + E + "|" + P,
      _ = e.dados[te];
    if (!_) return e.err[te] ? at(e.err[te]) : at();
    let ye = (_.v.candles || []).slice(-(B || 160));
    if (!ye.length) return at("Sem candles.");
    const Oe = A(E);
    if (Oe && Oe.px && P === "1d") {
      const pt = ye[ye.length - 1].slice();
      ((pt[4] = Oe.px),
        (pt[2] = Math.max(pt[2], Oe.px)),
        (pt[3] = Math.min(pt[3], Oe.px)),
        (ye = ye.slice(0, -1).concat([pt])));
    }
    const De = G ? 360 : 560,
      Ne = G ? 120 : 240,
      _e = G ? 0 : 40,
      lt = ye.map((pt) => pt[4]),
      et = Math.min(...ye.map((pt) => pt[3])),
      nt = Math.max(...ye.map((pt) => pt[2])),
      it = nt - et || 1,
      xt = (De - 40) / ye.length,
      bt = (pt) => 4 + pt * xt + xt / 2,
      tt = (pt) => Ne - _e - 14 - ((pt - et) / it) * (Ne - _e - 22) + 4,
      ut = (pt) =>
        lt.map((wt, jt) =>
          jt + 1 < pt
            ? null
            : lt.slice(jt + 1 - pt, jt + 1).reduce((Mt, Ct) => Mt + Ct, 0) / pt,
        ),
      $t = (pt, wt) => {
        let jt = "";
        return (
          pt.forEach((Mt, Ct) => {
            Mt != null &&
              (jt +=
                (jt ? "L" : "M") + bt(Ct).toFixed(1) + "," + tt(Mt).toFixed(1));
          }),
          jt
            ? `<path d="${jt}" fill="none" stroke="${wt}" stroke-width="1.2"/>`
            : ""
        );
      },
      Et = Math.max(...ye.map((pt) => pt[5] || 0)) || 1;
    return `<svg viewBox="0 0 ${De} ${Ne}" class="trsvg">${ye
      .map((pt, wt) => {
        const jt = pt[4] >= pt[1],
          Mt = jt ? "#3aad74" : "#e7614c";
        return `<line x1="${bt(wt)}" x2="${bt(wt)}" y1="${tt(pt[2])}" y2="${tt(pt[3])}" stroke="${Mt}"/><rect x="${bt(wt) - xt * 0.35}" y="${tt(Math.max(pt[1], pt[4]))}" width="${Math.max(1, xt * 0.7)}" height="${Math.max(1, Math.abs(tt(pt[1]) - tt(pt[4])))}" fill="${Mt}"/>${_e ? `<rect x="${bt(wt) - xt * 0.35}" y="${Ne - ((pt[5] || 0) / Et) * _e}" width="${Math.max(1, xt * 0.7)}" height="${((pt[5] || 0) / Et) * _e}" fill="${Mt}" opacity=".35"/>` : ""}`;
      })
      .join("")}
  ${P === "1d" ? $t(ut(20), "#86abcb") + $t(ut(50), "#c9a156") + $t(ut(200), "#c0bbb2") : $t(ut(9), "#86abcb") + $t(ut(20), "#c9a156")}<text x="${De - 34}" y="12" font-size="10" fill="#aaaaaa">${c(nt)}</text><text x="${De - 34}" y="${Ne - _e - 16}" font-size="10" fill="#aaaaaa">${c(et)}</text></svg>${G ? "" : `<div class="trfont">${P === "1d" ? "Médias 20 (azul), 50 (amarelo) e 200 (rosa)" : "Médias 9 (azul) e 20 (amarelo)"} · ${d(_.v.simbolo || "")}${_.v.nota ? " · " + d(_.v.nota) : ""}</div>`}`;
  }
  function W(E, P) {
    return w(E) + N(E, P, P === "1d" ? 220 : 156);
  }
  const Te = (E) => b("fund", { tk: E });
  function V(E) {
    const P = Te(E);
    if (!P.v) return w(E) + at(P.err);
    const B = P.v.yahoo || {},
      G = B.perfil || {},
      te = B.numeros || {},
      _ = B.eventos || {},
      ye = P.v.tv || {};
    return (
      w(E) +
      `<div class="trkv"><span>Setor <b>${d(G.setor || ye.sector || "—")}</b></span><span>Indústria <b>${d(G.industria || ye.industry || "—")}</b></span><span>Funcionários <b>${c(G.funcionarios || ye.number_of_employees, 0)}</b></span><span>Sede <b>${d(G.cidade || "—")}</b></span></div>${G.resumo ? `<p class="trp1">${d(G.resumo)}</p>` : ""}
  ${dt(
    ["Indicador", "Valor"],
    [
      ["Receita (12m)", m(te.receita)],
      ["EBITDA", m(te.ebitda)],
      [
        "Margem líquida",
        te.margem_liq != null ? c(te.margem_liq * 100, 1) + "%" : "—",
      ],
      ["ROE", te.roe != null ? c(te.roe * 100, 1) + "%" : "—"],
      ["Dívida total", m(te.divida)],
      ["Caixa", m(te.caixa)],
      ["Liquidez corrente", c(te.liq_corrente, 2)],
      ["P/L (projetado)", c(te.pl_proj, 1)],
      ["EV/EBITDA", c(te.ev_ebitda, 1)],
      ["Fluxo de caixa livre", m(te.fcl)],
      ["Próximo resultado", (_.resultado || []).join(" a ") || "—"],
    ].map(
      ([Oe, De]) => `<tr><td>${Oe}</td><td class="num"><b>${De}</b></td></tr>`,
    ),
    "des",
  )}<div class="trfont">${d((P.v.fontes || []).join(" · "))}</div>`
    );
  }
  const ae = [
    ["liquidez", "corrente", "Liquidez corrente", 2],
    ["liquidez", "seca", "Liquidez seca", 2],
    [
      "endividamento",
      "capitais_terceiros_sobre_pl",
      "Capitais de terceiros / PL",
      2,
    ],
    ["endividamento", "cobertura_de_juros", "Cobertura de juros", 1],
    ["rotatividade", "ciclo_financeiro_dias", "Ciclo financeiro (dias)", 0],
    ["rentabilidade", "margem_liquida_pct", "Margem líquida %", 1],
    ["rentabilidade", "giro_do_ativo", "Giro do ativo", 2],
    ["rentabilidade", "retorno_sobre_pl_pct", "ROE %", 1],
    [
      "rentabilidade",
      "grau_alavancagem_financeira",
      "Alavancagem financeira",
      2,
    ],
  ];
  function ee(E) {
    const P = Te(E);
    if (!P.v) return w(E) + at(P.err);
    const B = P.v.balancos,
      G = P.v.sec;
    let te = w(E);
    if (B && B.anos && B.anos.length) {
      const _ = B.anos;
      te +=
        '<div class="trsec">Análise de balanços (roteiro do Iudícibus)</div>' +
        dt(
          ["Índice"].concat(_.map((ye) => ye.ano)),
          [
            ["", "receita", "Receita", -1],
            ["", "lucro_liquido", "Lucro líquido", -1],
          ]
            .concat(ae)
            .map(
              ([ye, Oe, De, Ne]) =>
                `<tr><td>${De}</td>${_.map((_e) => {
                  const lt = ye ? (_e[ye] || {})[Oe] : _e[Oe];
                  return `<td class="num">${Ne < 0 ? m(lt) : c(lt, Ne)}</td>`;
                }).join("")}</tr>`,
            )
            .concat(
              _.some((ye) => ye.kanitz != null)
                ? [
                    `<tr><td>Termômetro de Kanitz</td>${_.map((ye) => `<td class="num ${ye.kanitz > 0 ? "tg" : ye.kanitz < -3 ? "tr" : "am"}">${c(ye.kanitz, 2)}</td>`).join("")}</tr>`,
                  ]
                : [],
            ),
          "fa",
        ) +
        ((B.alertas || []).length
          ? `<div class="trnote">${B.alertas.map((ye) => "• " + d(ye)).join("<br>")}</div>`
          : "");
    }
    if (G && G.anos && G.anos.length) {
      const _ = G.anos;
      te +=
        '<div class="trsec">SEC (balanço oficial, US$)</div>' +
        dt(
          ["Conta"].concat(_.map((ye) => ye.ano)),
          [
            ["receita", "Receita"],
            ["lucro_operacional", "Lucro operacional"],
            ["lucro_liquido", "Lucro líquido"],
            ["ativo", "Ativo total"],
            ["patrimonio", "Patrimônio"],
            ["caixa", "Caixa"],
            ["divida_lp", "Dívida longa"],
            ["fco", "Caixa das operações"],
            ["capex", "Investimentos"],
            ["lpa", "LPA diluído"],
          ].map(
            ([ye, Oe]) =>
              `<tr><td>${Oe}</td>${_.map((De) => `<td class="num">${ye === "lpa" ? c(De[ye]) : m(De[ye])}</td>`).join("")}</tr>`,
          ),
          "sec",
        );
    }
    return (
      !(B && B.anos && B.anos.length) &&
        !(G && G.anos && G.anos.length) &&
        (te += at("Sem balanços para este ativo agora.")),
      te
    );
  }
  function le(E) {
    const P = Te(E);
    if (!P.v) return w(E) + at(P.err);
    const B = (P.v.yahoo || {}).analistas || {},
      G = ((P.v.yahoo || {}).numeros || {}).preco || (P.v.tv || {}).close,
      te = B.alvo_medio && G ? (B.alvo_medio / G - 1) * 100 : null,
      _ = B.votos || {},
      ye =
        ["compra_forte", "compra", "neutro", "venda", "venda_forte"].reduce(
          (Oe, De) => Oe + (_[De] || 0),
          0,
        ) || 1;
    return (
      w(E) +
      `<div class="trkv"><span>Preço-alvo médio <b>${c(B.alvo_medio)}</b></span><span>Potencial <b class="${u(te)}">${p(te, 1)}</b></span><span>Máximo <b>${c(B.alvo_max)}</b></span><span>Mínimo <b>${c(B.alvo_min)}</b></span><span>Analistas <b>${c(B.n, 0)}</b></span><span>Nota (1 compra … 5 venda) <b>${c(B.nota, 1)}</b></span></div>
  <div class="trvot">${[
    ["compra_forte", "Compra forte", "#2e8b5d"],
    ["compra", "Compra", "#3aad74"],
    ["neutro", "Neutro", "#a3a3a3"],
    ["venda", "Venda", "#ed8b7c"],
    ["venda_forte", "Venda forte", "#dc3e26"],
  ]
    .map(
      ([Oe, De, Ne]) =>
        `<span style="flex:${(_[Oe] || 0) / ye};background:${Ne}" title="${De}: ${_[Oe] || 0}">${_[Oe] ? De.split(" ")[0] + " " + _[Oe] : ""}</span>`,
    )
    .join("")}</div><div class="trfont">Yahoo Finance (consenso)</div>`
    );
  }
  function Y(E) {
    const P = Te(E);
    if (!P.v) return w(E) + at(P.err);
    const B = P.v.yahoo || {};
    return (
      w(E) +
      '<div class="trsec">Resultados × consenso (LPA)</div>' +
      dt(
        ["Trimestre", "LPA", "Esperado", "Surpresa"],
        (B.resultados || []).map(
          (G) =>
            `<tr><td>${d(G.trimestre)}</td><td class="num">${c(G.lpa)}</td><td class="num mut">${c(G.esperado)}</td><td class="num ${u(G.surpresa_pct)}">${p(G.surpresa_pct, 1)}</td></tr>`,
        ),
        "ee",
      ) +
      '<div class="trsec">Projeções</div>' +
      dt(
        ["Período", "LPA", "Receita", "Crescimento"],
        (B.projecoes || []).map(
          (G) =>
            `<tr><td>${{ "0q": "Trimestre atual", "+1q": "Próximo trimestre", "0y": "Ano atual", "+1y": "Próximo ano" }[G.periodo] || G.periodo}</td><td class="num">${c(G.lpa)}</td><td class="num">${m(G.receita)}</td><td class="num ${u(G.cresc)}">${G.cresc != null ? p(G.cresc * 100, 1) : "—"}</td></tr>`,
        ),
        "proj",
      )
    );
  }
  function q(E) {
    const P = Te(E);
    if (!P.v) return w(E) + at(P.err);
    const B = P.v.pares || [],
      G = (te) => {
        const _ = B.map((ye) => ye[te])
          .filter((ye) => ye != null && isFinite(ye) && ye > 0)
          .sort((ye, Oe) => ye - Oe);
        return _.length ? _[Math.floor(_.length / 2)] : null;
      };
    return (
      w(E) +
      dt(
        [
          "Empresa",
          "P/L",
          "P/VPA",
          "EV/EBITDA",
          "DY %",
          "ROE %",
          "Margem %",
          "Valor de mercado",
        ],
        B.map(
          (te) =>
            `<tr class="${te.s.endsWith(":" + E) ? "eu" : ""}" data-trgo="${d(te.s.split(":")[1])}"><td class="tk">${d(te.s.split(":")[1])}</td><td class="num">${c(te.pl, 1)}</td><td class="num">${c(te.pvp, 2)}</td><td class="num">${c(te.ev_ebitda, 1)}</td><td class="num">${c(te.dy, 1)}</td><td class="num">${c(te.roe, 1)}</td><td class="num">${c(te.ml, 1)}</td><td class="num">${m(te.vm)}</td></tr>`,
        ).concat([
          `<tr class="trmed"><td>Mediana</td><td class="num">${c(G("pl"), 1)}</td><td class="num">${c(G("pvp"), 2)}</td><td class="num">${c(G("ev_ebitda"), 1)}</td><td class="num">${c(G("dy"), 1)}</td><td class="num">${c(G("roe"), 1)}</td><td class="num">${c(G("ml"), 1)}</td><td></td></tr>`,
        ]),
        "rv",
      ) +
      `<div class="trfont">Pares do setor ${d((P.v.tv || {}).sector || "")} · TradingView</div>`
    );
  }
  function L(E) {
    const P = Te(E);
    if (!P.v) return w(E) + at(P.err);
    const B = (P.v.yahoo || {}).proventos || {};
    return (
      w(E) +
      `<div class="trkv"><span>Dividend yield <b>${B.dy != null ? c(B.dy * 100, 2) + "%" : P.v.tv && P.v.tv.dividend_yield_recent != null ? c(P.v.tv.dividend_yield_recent, 2) + "%" : "—"}</b></span><span>Proventos por ação (12m) <b>${c(B.taxa_anual)}</b></span><span>Payout <b>${B.payout != null ? c(B.payout * 100, 0) + "%" : "—"}</b></span><span>Última data com <b>${B.data_com ? B.data_com.split("-").reverse().join("/") : "—"}</b></span></div><div class="trnote">O histórico ano a ano está na análise fundamentalista do app (Análise IA).</div>`
    );
  }
  async function F(E) {
    if (!SESS) return;
    const P = "om|" + E;
    if (!(e.dados[P] && Date.now() - e.dados[P].ts < 3e4))
      try {
        const B = await (
          await rq(
            "/rest/v1/opcoes_grade?select=ativo,spot,series,updated_at&ativo=eq." +
              encodeURIComponent(E) +
              "&user_id=eq." +
              SESS.uid,
          )
        ).json();
        ((e.dados[P] = { ts: Date.now(), v: (B && B[0]) || null }),
          delete e.err[P]);
      } catch (B) {
        e.err[P] = String(B.message || B);
      }
  }
  const O = (E) => {
    const P = 1 / (1 + 0.2316419 * Math.abs(E)),
      B = 0.3989422804014327 * Math.exp((-E * E) / 2),
      G =
        B *
        P *
        (0.31938153 +
          P *
            (-0.356563782 +
              P * (1.781477937 + P * (-1.821255978 + P * 1.330274429))));
    return E > 0 ? 1 - G : G;
  };
  function ne(E, P, B, G, te, _) {
    if (!(G > 0) || !(_ > 0))
      return { p: Math.max(E === "C" ? P - B : B - P, 0), d: null };
    const ye = _ * Math.sqrt(G),
      Oe = (Math.log(P / B) + (te + (_ * _) / 2) * G) / ye,
      De = Oe - ye,
      Ne = Math.exp(-te * G);
    return E === "C"
      ? { p: P * O(Oe) - B * Ne * O(De), d: O(Oe) }
      : { p: B * Ne * O(-De) - P * O(-Oe), d: O(Oe) - 1 };
  }
  const Ee = (E, P, B, G, te, _) => {
      let ye = 0.01,
        Oe = 4;
      if (!(P > 0) || !(te > 0)) return null;
      const De = (Ne) => ne(E, B, G, te, _, Ne).p - P;
      if (De(ye) > 0 || De(Oe) < 0) return null;
      for (let Ne = 0; Ne < 60; Ne++) {
        const _e = (ye + Oe) / 2;
        De(_e) > 0 ? (Oe = _e) : (ye = _e);
      }
      return (ye + Oe) / 2;
    },
    Ae = (E) => {
      try {
        let P = 0;
        const B = new Date(),
          G = new Date(E + "T12:00:00");
        for (; B < G; ) {
          B.setDate(B.getDate() + 1);
          const te = B.getDay();
          te && te < 6 && P++;
        }
        return P;
      } catch {
        return 0;
      }
    };
  function ge(E) {
    const P = "om|" + E,
      B = e.dados[P];
    if (!B)
      return (
        w(E) +
        at(
          e.err[P] ||
            (SESS ? "" : "Entre na sua conta para ver a grade da ponte."),
        )
      );
    const G = B.v;
    if (!G || !Array.isArray(G.series) || !G.series.length)
      return (
        w(E) +
        `<div class="trnote">Sem grade de ${d(E)}. A grade vem da ponte do Profit: inclua ${d(E)} em "opcoes_ativos" no config da ponte. Ativos com grade aparecem em <button class="trlk" data-trcmd="GRADE">GRADE</button>.</div>`
      );
    const te = A(E),
      _ = (te && te.px) || +G.spot,
      ye = [...new Set(G.series.map((it) => it.m))].sort(),
      Oe = e.omon[E] && ye.includes(e.omon[E]) ? e.omon[E] : ye[0],
      De = G.series.filter((it) => it.m === Oe),
      Ne = [...new Set(De.map((it) => it.k))].sort((it, xt) => it - xt),
      _e = Math.log(1 + ((b("copom").v || {}).cdi || 14) / 100),
      lt =
        (De.find((it) => it.v) || {}).v ||
        (typeof opVencMes == "function" ? opVencMes(Oe) : null),
      et = lt ? Math.max(1, Ae(lt)) / 252 : null,
      nt = (it, xt) => {
        if (!it) return "<td></td><td></td><td></td><td></td>";
        const bt = it.u || (it.b && it.a ? (it.b + it.a) / 2 : it.f),
          tt =
            (typeof opgIVp == "function" ? opgIVp(it.ivp) : null) ||
            (et ? Ee(xt, bt, _, it.k, et, _e) : null),
          ut = et && tt ? ne(xt, _, it.k, et, _e, tt).d : null;
        return `<td class="num">${c(it.b)}</td><td class="num">${c(it.a)}</td><td class="num"><b>${c(it.u)}</b></td><td class="num mut">${tt ? c(tt * 100, 0) : ""}${ut != null ? " · Δ" + c(ut, 2) : ""}</td>`;
      };
    return (
      w(E) +
      `<div class="trrow">${ye.map((it) => `<button class="trbtn${it === Oe ? " on" : ""}" data-tromon="${d(E)}|${it}">${it.split("-").reverse().join("/")}</button>`).join("")}<span class="mut">${lt ? "vence " + lt.split("-").reverse().join("/") : ""} · spot ${c(_)}</span></div>` +
      dt(
        [
          "Compra",
          "Venda",
          "Último",
          "Vol·Δ",
          "Strike",
          "Compra",
          "Venda",
          "Último",
          "Vol·Δ",
        ],
        Ne.map((it) => {
          const xt = De.find((tt) => tt.k === it && tt.t === "C"),
            bt = De.find((tt) => tt.k === it && tt.t === "P");
          return `<tr class="${Math.abs(it - _) / _ < 0.01 ? "atm" : ""}">${nt(xt, "C")}<td class="num tk">${c(it)}</td>${nt(bt, "P")}</tr>`;
        }),
        "omon",
      ) +
      `<div class="trfont">Calls à esquerda, puts à direita · vol. implícita do Profit ou calculada (Black-Scholes) · ponte do Profit, ${f(G.updated_at)}</div>`
    );
  }
  function je(E, P) {
    const B = b("cot", { s: [E] }),
      G = B.v && B.v.itens[0],
      te = A(E),
      _ = (te && te.px) || (G && G.px);
    if (!_) return w(E) + at(B.err);
    const ye =
        e.ov && e.ov.tk === E
          ? e.ov
          : (e.ov = {
              tk: E,
              K: Math.round(_),
              du: 21,
              vol: 35,
              ju: (b("copom").v || {}).cdi || 14,
            }),
      Oe = ye.du / 252,
      De = Math.log(1 + ye.ju / 100),
      Ne = ne("C", _, ye.K, Oe, De, ye.vol / 100),
      _e = ne("P", _, ye.K, Oe, De, ye.vol / 100),
      lt = (et, nt, it) =>
        `<label>${nt}<input class="trin" type="number" step="${it}" data-trov="${et}" value="${ye[et]}"></label>`;
    return (
      w(E) +
      `<div class="trrow">${lt("K", "Strike", "0.01")}${lt("du", "Dias úteis", "1")}${lt("vol", "Vol. % a.a.", "0.5")}${lt("ju", "Juros % a.a.", "0.25")}</div>` +
      dt(
        ["", "Call", "Put"],
        [
          ["Prêmio justo", c(Ne.p), c(_e.p)],
          ["Delta", c(Ne.d, 3), c(_e.d, 3)],
          [
            "Valor intrínseco",
            c(Math.max(_ - ye.K, 0)),
            c(Math.max(ye.K - _, 0)),
          ],
        ].map(
          ([et, nt, it]) =>
            `<tr><td>${et}</td><td class="num"><b>${nt}</b></td><td class="num"><b>${it}</b></td></tr>`,
        ),
        "ov",
      ) +
      '<div class="trnote">Gregas completas, vol. implícita e árvore binomial no Laboratório (Estudos → Biblioteca → Opções).</div>'
    );
  }
  let Ze = null;
  function He() {
    Ze ||
      (Ze = setInterval(() => {
        if (tab !== "term") {
          (clearInterval(Ze),
            (Ze = null),
            (e.binReq = {}),
            J([]),
            se([]),
            document.body.classList.remove("trmon"));
          return;
        }
        j().then(() => {
          const P = document.getElementById("trst");
          (P && (P.innerHTML = Je()),
            i().p.forEach((G, te) => {
              const _ = he(G);
              if (!_) return;
              const ye = document.activeElement;
              if (
                ye &&
                ye.closest &&
                ye.closest("#trp" + te) &&
                /INPUT|SELECT|TEXTAREA/.test(ye.tagName)
              )
                return;
              const Oe = ue[_.f],
                De =
                  Oe &&
                  Oe.vivo &&
                  (!Oe.tk || _.tk) &&
                  (typeof Oe.vivo != "function" || Oe.vivo(_, te));
              (["MON", "PORT", "Q", "OMON"].includes(_.f) || De) && Ye(te);
            }));
          const B = document.getElementById("trtape");
          B && window.trTapeHtml && (B.innerHTML = window.trTapeHtml());
        });
        const E = Date.now();
        (!e.uR || E - e.uR > 2e4) &&
          ((e.uR = E), i().p.forEach((P, B) => ot(B)));
      }, 3e3));
  }
  (document.addEventListener("keydown", (E) => {
    if (tab !== "term") return;
    const P = document.getElementById("trcmd");
    if (E.key === "F1") {
      (E.preventDefault(), Be("HELP"));
      return;
    }
    if (
      E.key === "F2" ||
      (E.key === "/" &&
        document.activeElement !== P &&
        !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName))
    ) {
      (E.preventDefault(), P && P.focus());
      return;
    }
    if (E.key === "F8") {
      (E.preventDefault(), Be("WEI"));
      return;
    }
    if (E.key === "F9") {
      (E.preventDefault(), Be("GC"));
      return;
    }
    if (E.key === "F10") {
      (E.preventDefault(), Be("FX"));
      return;
    }
    if (E.key === "Tab" && l() && document.activeElement === P) {
      E.preventDefault();
      const B = i().p.length;
      ((e.foco = (e.foco + (E.shiftKey ? B - 1 : 1)) % B),
        document
          .querySelectorAll(".trp")
          .forEach((G, te) => G.classList.toggle("foco", te === e.foco)));
      return;
    }
    if (document.activeElement === P) {
      if (E.key === "Enter") {
        E.preventDefault();
        const B = P.value;
        P.value = "";
        const G = document.getElementById("trsug");
        (G && (G.hidden = !0), B.trim() && Be(B));
        return;
      }
      if (E.key === "ArrowUp") {
        (E.preventDefault(),
          (e.hi = Math.min(e.hist.length - 1, e.hi + 1)),
          e.hist[e.hi] && (P.value = e.hist[e.hi]));
        return;
      }
      if (E.key === "ArrowDown") {
        (E.preventDefault(),
          (e.hi = Math.max(-1, e.hi - 1)),
          (P.value = e.hi >= 0 ? e.hist[e.hi] : ""));
        return;
      }
      if (E.key === "Escape") {
        P.value = "";
        const B = document.getElementById("trsug");
        B && (B.hidden = !0);
      }
    }
  }),
    document.addEventListener("input", (E) => {
      if (E.target && E.target.id === "trcmd") {
        const P = document.getElementById("trsug");
        if (!P) return;
        const B = we(E.target.value);
        ((P.innerHTML = B.map(
          ([G, te]) =>
            `<button data-trsug="${d(G.replace("<ativo> ", ""))}"><b>${d(G)}</b> ${d(te)}</button>`,
        ).join("")),
          (P.hidden = !B.length || !E.target.value.trim()));
      }
    }),
    document.addEventListener("change", (trMudaRef = (E) => {
      const P = E.target;
      if (!(!P || !P.closest || tab !== "term")) {
        if (P.matches("[data-trlay]")) {
          const B = r();
          if (P.value === "__novo") {
            const G = (
              prompt(
                "Nome do novo espaço (ex.: Exterior, Cripto, Swing):",
                "Meu espaço",
              ) || ""
            )
              .trim()
              .slice(0, 30);
            if (!G) {
              P.value = B.ws;
              return;
            }
            const te = confirm(
                "Começar com uma cópia dos painéis atuais? (Cancelar = espaço vazio com 4 painéis)",
              )
                ? JSON.parse(JSON.stringify(i()))
                : { p: ["WEI", "HELP", "ECO", "TOP"], g: n(4) },
              _ = "u" + Date.now().toString(36);
            ((B.wss[_] = { n: G, p: te.p, g: te.g }), (B.ws = _));
          } else B.ws = P.value;
          ((e.foco = 0), (e.mob = 0), (e.max = -1), save(), render());
          return;
        }
        if (P.matches("[data-treqs]")) {
          const B = P.dataset.treqs;
          if (B === "mk") e.eqs.mk = P.value;
          else {
            const G = +String(P.value).replace(",", ".");
            P.value === "" || !isFinite(G)
              ? delete e.eqs.f[B]
              : (e.eqs.f[B] = G);
          }
          return;
        }
        if (P.matches("[data-tryas]")) {
          e.yas = e.yas || { tx: 13, du: 756 };
          const B = +P.value;
          (B > 0 && (e.yas[P.dataset.tryas] = B),
            i().p.forEach((G, te) => {
              /^(TD|YAS)/.test(G) && Ye(te);
            }));
          return;
        }
        if (P.matches("[data-trov]")) {
          const B = +P.value;
          (e.ov && B > 0 && (e.ov[P.dataset.trov] = B),
            i().p.forEach((G, te) => {
              / OV$/.test(G) && Ye(te);
            }));
          return;
        }
      }
    })),
    document.addEventListener("click", (trCliqueRef = (E) => {
      var P;
      if (tab !== "term") return;
      const B = (_) => E.target.closest && E.target.closest(_);
      let G;
      if ((G = B("[data-trsug]"))) {
        Be(G.dataset.trsug);
        const _ = document.getElementById("trcmd");
        _ && (_.value = "");
        const ye = document.getElementById("trsug");
        ye && (ye.hidden = !0);
        return;
      }
      if ((G = B("[data-trcmd]"))) {
        Be(G.dataset.trcmd);
        return;
      }
      if ((G = B("[data-trgo]"))) {
        const _ = G.closest("[data-trp]"),
          ye = _ ? +_.dataset.trp : e.foco,
          Oe = i().p.length;
        Be(G.dataset.trgo + " Q", l() && Oe > 1 ? (ye + 1) % Oe : ye);
        return;
      }
      if ((G = B("[data-trtabx]"))) {
        const [_, ye] = G.dataset.trtabx.split("|"),
          Oe = +_,
          De = +ye,
          Ne = i(),
          _e = Ce(Ne, Oe);
        if (!_e) return;
        const lt = _e[De] === Ne.p[Oe];
        (_e.splice(De, 1),
          _e.length < 2
            ? ((Ne.p[Oe] = _e[0] || Ne.p[Oe]), (Ne.t[Oe] = null))
            : lt && (Ne.p[Oe] = _e[Math.max(0, De - 1)]),
          save(),
          render());
        return;
      }
      if ((G = B("[data-trtab]"))) {
        const [_, ye] = G.dataset.trtab.split("|"),
          Oe = +_,
          De = i();
        if (((De.t = De.t || De.p.map(() => null)), ye === "+"))
          (De.t[Oe] || (De.t[Oe] = [De.p[Oe]]),
            De.t[Oe].push("HELP"),
            (De.p[Oe] = "HELP"));
        else {
          const Ne = Ce(De, Oe);
          Ne && Ne[+ye] && (De.p[Oe] = Ne[+ye]);
        }
        ((e.foco = Oe),
          l() || (e.mob = Oe),
          save(),
          render(),
          ye === "+" &&
            setTimeout(() => {
              const Ne = document.getElementById("trcmd");
              Ne && Ne.focus();
            }, 60));
        return;
      }
      if ((G = B("[data-trmob]"))) {
        ((e.mob = +G.dataset.trmob),
          (e.foco = e.mob),
          document.querySelectorAll(".trp").forEach((_, ye) => {
            (_.classList.toggle("oculto", ye !== e.mob),
              _.classList.toggle("foco", ye === e.mob));
          }),
          document
            .querySelectorAll("[data-trmob]")
            .forEach((_, ye) => _.classList.toggle("on", ye === e.mob)));
        return;
      }
      if ((G = B("[data-tromon]"))) {
        const [_, ye] = G.dataset.tromon.split("|");
        ((e.omon[_] = ye),
          i().p.forEach((Oe, De) => {
            Oe.startsWith(_ + " OMON") && Ye(De);
          }));
        return;
      }
      if ((G = B("[data-tr]"))) {
        const _ = G.dataset.tr,
          ye = +G.dataset.i;
        if (_ === "go") {
          const Oe = document.getElementById("trcmd");
          Oe && Oe.value.trim()
            ? (Be(Oe.value), (Oe.value = ""))
            : Oe && Oe.focus();
          return;
        }
        if (_ === "menu") {
          document.body.classList.toggle("trmenu");
          return;
        }
        if (_ === "sair") {
          (document.body.classList.remove("trmon"),
            irPara("home"),
            scrollTo(0, 0));
          return;
        }
        if (_ === "att") {
          (Object.keys(e.dados).forEach((Oe) => {
            e.dados[Oe].ts = 0;
          }),
            ot(ye));
          return;
        }
        if (_ === "csv") {
          const Oe = document.querySelectorAll(`#trb${ye} table`);
          if (!Oe.length) {
            toast("Este painel não tem tabela.");
            return;
          }
          const De = [];
          Oe.forEach((et) =>
            et
              .querySelectorAll("tr")
              .forEach((nt) =>
                De.push(
                  [...nt.children]
                    .map(
                      (it) =>
                        '"' + it.textContent.replace(/"/g, '""').trim() + '"',
                    )
                    .join(";"),
                ),
              ),
          );
          const Ne = new Blob(
              [
                "\uFEFF" +
                  De.join(`
`),
              ],
              { type: "text/csv" },
            ),
            _e = URL.createObjectURL(Ne),
            lt = document.createElement("a");
          ((lt.href = _e),
            (lt.download =
              "terminal-" +
              i().p[ye].replace(/\W+/g, "-").toLowerCase() +
              ".csv"),
            document.body.appendChild(lt),
            lt.click(),
            setTimeout(() => {
              (URL.revokeObjectURL(_e), lt.remove());
            }, 500));
          return;
        }
        if (_ === "addp") {
          const Oe = i(),
            De = Math.max(0, ...Oe.g.map((Ne) => Ne.y + Ne.h));
          (Oe.p.push("HELP"),
            Oe.g.push(a(0, De, 6, 12)),
            Oe.t && Oe.t.push(null),
            (e.foco = Oe.p.length - 1),
            (e.mob = e.foco),
            save(),
            render(),
            setTimeout(() => {
              const Ne = document.getElementById("trp" + e.foco);
              Ne && Ne.scrollIntoView({ block: "nearest" });
              const _e = document.getElementById("trcmd");
              _e && _e.focus();
            }, 50),
            toast("Painel novo: digite o comando para ele."));
          return;
        }
        if (_ === "fecha") {
          const Oe = i();
          if (Oe.p.length < 2) return;
          (Oe.p.splice(ye, 1),
            Oe.g.splice(ye, 1),
            Oe.t && Oe.t.splice(ye, 1),
            (e.foco = 0),
            (e.mob = Math.min(e.mob, Oe.p.length - 1)),
            (e.max = -1),
            save(),
            render());
          return;
        }
        if (_ === "org") {
          const Oe = i();
          ((Oe.g = n(Oe.p.length)), (e.max = -1), save(), render());
          return;
        }
        if (_ === "maxi") {
          ((e.max = e.max === ye ? -1 : ye),
            e.max >= 0 && !l() && (e.mob = ye),
            render());
          return;
        }
        if (_ === "pop") {
          const Oe = i().p[ye],
            De = location.pathname + "?go=term&pop=" + encodeURIComponent(Oe);
          window.open(De, "_blank", "width=980,height=720") ||
            toast(
              "O navegador bloqueou a janela nova: permita pop-ups para este site.",
            );
          return;
        }
        if (_ === "wsmenu") {
          const Oe = r(),
            De = i(),
            Ne = (
              prompt(
                `Espaço "${De.n}": digite 1 para renomear, 2 para duplicar, 3 para excluir, 4 para voltar ao padrão, 5 para organizar por assunto, 6 para montar um espaço por tema (macro, opções, cripto…)`,
                "",
              ) || ""
            ).trim();
          if (Ne === "1") {
            const _e = (prompt("Novo nome:", De.n) || "").trim().slice(0, 30);
            _e && (De.n = _e);
          } else if (Ne === "2") {
            const _e = "u" + Date.now().toString(36);
            ((Oe.wss[_e] = {
              ...JSON.parse(JSON.stringify(De)),
              n: De.n + " (cópia)",
            }),
              (Oe.ws = _e));
          } else if (Ne === "3") {
            if (Object.keys(Oe.wss).length < 2)
              return toast("Precisa ter pelo menos um espaço.");
            if (!confirm(`Excluir o espaço "${De.n}"?`)) return;
            (delete Oe.wss[Oe.ws], (Oe.ws = Object.keys(Oe.wss)[0]));
          } else if (Ne === "5") {
            if (window.trOrganiza) return window.trOrganiza();
          } else if (Ne === "6") {
            Be("ESPACO");
            return;
          } else if (Ne === "4") {
            if (window.trTemas && window.trTemas[Oe.ws]) {
              window.trMontaTema(Oe.ws);
              return;
            }
            o[Oe.ws]
              ? (Oe.wss[Oe.ws] = JSON.parse(JSON.stringify(o[Oe.ws])))
              : (De.g = n(De.p.length));
          } else return;
          ((e.foco = 0), (e.mob = 0), (e.max = -1), save(), render());
          return;
        }
        if (_ === "monadd") {
          const Oe = String(
            (document.getElementById("trmonadd") || {}).value || "",
          )
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9!]/g, "");
          if (!Oe) return;
          const De = r();
          (De.mon.includes(Oe) || De.mon.push(Oe),
            save(),
            delete e.dados["cot|" + JSON.stringify({ s: De.mon })],
            i().p.forEach((Ne, _e) => {
              Ne === "MON" && ot(_e);
            }));
          return;
        }
        if (_ === "monrm") {
          const Oe = r();
          ((Oe.mon = Oe.mon.filter((De) => De !== G.dataset.v)),
            save(),
            i().p.forEach((De, Ne) => {
              De === "MON" && (Ye(Ne), ot(Ne));
            }));
          return;
        }
        if (_ === "eqs") {
          ((e.eqs.run = 1),
            i().p.forEach((Oe, De) => {
              Oe === "EQS" && (Ye(De), ot(De));
            }));
          return;
        }
        if (_ === "fh") {
          const Oe =
            window.trFhErro &&
            window.trFhErro(
              String(
                (document.getElementById("trfh") || {}).value || "",
              ).trim(),
            );
          if (Oe) {
            toast(Oe, 7e3);
            return;
          }
          ((r().fh = String((document.getElementById("trfh") || {}).value || "")
            .trim()
            .slice(0, 60)),
            save(),
            toast(
              r().fh
                ? "Chave salva: ações dos EUA ao vivo no MON."
                : "Chave apagada.",
            ));
          return;
        }
        if (_ === "alrt") {
          const Oe = String(
              (document.getElementById("tralk") || {}).value || "",
            )
              .trim()
              .toUpperCase(),
            De = (document.getElementById("tralo") || {}).value,
            Ne = +String(
              (document.getElementById("tralv") || {}).value || "",
            ).replace(",", ".");
          if (!Oe || !(Ne > 0)) return toast("Informe o ativo e o preço.");
          const _e = (P = S.ax ?? (S.ax = {})).alpx ?? (P.alpx = []);
          if (_e.filter((lt) => !lt.fired).length >= 20)
            return toast("Você já tem 20 alertas ativos.");
          (_e.push({
            id: "t" + Date.now().toString(36),
            s: /^[A-Z]{4}\d/.test(Oe) ? "BMFBOVESPA:" + Oe : Oe,
            c: Oe,
            op: De,
            v: Ne,
            dp: 2,
            em: Date.now(),
            orig: "terminal",
          }),
            save());
          try {
            turnoPushSync(!0);
          } catch {}
          (toast("Alerta criado."),
            i().p.forEach((lt, et) => {
              lt === "ALRT" && Ye(et);
            }));
          return;
        }
        if (_ === "alrm") {
          const Oe = S.ax || {};
          ((Oe.alpx = (Oe.alpx || []).filter((De) => De.id !== G.dataset.v)),
            save(),
            i().p.forEach((De, Ne) => {
              De === "ALRT" && Ye(Ne);
            }));
          return;
        }
        return;
      }
      const te = B("[data-trp]");
      te &&
        l() &&
        ((e.foco = +te.dataset.trp),
        document
          .querySelectorAll(".trp")
          .forEach((_, ye) => _.classList.toggle("foco", ye === e.foco)));
    })));
  /* v594: ações do Terminal sem depender da barra antiga (.trbar) montada.
     O Início do Terminal chama estas funções direto; na tela de Painéis os botões continuam chamando o mesmo código. */
  var trMudaRef, trCliqueRef;
  {
    const falso = (el) => ({ target: el, preventDefault() {}, stopPropagation() {}, button: 0 }),
      trAcao = (tr) => {
        const b = document.createElement("button");
        ((b.dataset.tr = tr), trCliqueRef && trCliqueRef(falso(b)));
      },
      A = window.TerminalAcoes;
    A &&
      (A.registrar("@add", () => trAcao("addp")),
      A.registrar("@organize", () => trAcao("org")),
      A.registrar("@rename", () => trAcao("wsmenu")),
      A.registrar("espaco", (v) => {
        const s = document.createElement("select"),
          o = document.createElement("option");
        ((o.value = v), s.append(o), (s.value = v), s.setAttribute("data-trlay", ""), trMudaRef && trMudaRef(falso(s)));
      }));
  }
  let ce = null;
  (document.addEventListener("pointerdown", (E) => {
    if (tab !== "term" || !l() || E.button > 0) return;
    const P = E.target.closest && E.target.closest("[data-trdrag],[data-trrs]");
    if (!P || E.target.closest("button,input,select")) return;
    const B = P.closest(".trp"),
      G = document.getElementById("trgrid");
    if (!B || !G) return;
    const te = +B.dataset.trp,
      _ = i(),
      ye = _.g[te];
    if (ye) {
      (E.preventDefault(),
        (e.foco = te),
        document.querySelectorAll(".trp").forEach((Oe, De) => {
          (Oe.classList.toggle("foco", De === te),
            (Oe.style.zIndex = De === te ? 5 : ""));
        }),
        (ce = {
          i: te,
          rs: !!P.dataset.trrs,
          x0: E.clientX,
          y0: E.clientY,
          g0: { ...ye },
          cw: G.clientWidth / 12,
          sec: B,
          grid: G,
        }),
        B.classList.add("arrastando"));
      try {
        P.setPointerCapture(E.pointerId);
      } catch {}
    }
  }),
    document.addEventListener("pointermove", (E) => {
      if (!ce) return;
      const P = Math.round((E.clientX - ce.x0) / ce.cw),
        B = Math.round((E.clientY - ce.y0) / t),
        G = { ...ce.g0 };
      (ce.rs
        ? ((G.w = Math.max(2, Math.min(12 - G.x, ce.g0.w + P))),
          (G.h = Math.max(4, ce.g0.h + B)))
        : ((G.x = Math.max(0, Math.min(12 - G.w, ce.g0.x + P))),
          (G.y = Math.max(0, ce.g0.y + B))),
        (ce.g = G),
        ce.sec.setAttribute("style", Se(G) + ";z-index:6"));
      const te =
        Math.max(
          ...i().g.map((_, ye) => (ye === ce.i ? G.y + G.h : _.y + _.h)),
        ) * t;
      ce.grid.style.height = te + "px";
    }),
    document.addEventListener("pointerup", () => {
      if (!ce) return;
      const E = ce;
      if (((ce = null), E.sec.classList.remove("arrastando"), !E.g)) return;
      const P = i();
      P.g[E.i] = E.g;
      const B = (_, ye) =>
        _.x < ye.x + ye.w &&
        ye.x < _.x + _.w &&
        _.y < ye.y + ye.h &&
        ye.y < _.y + _.h;
      let G = !0,
        te = 0;
      for (; G && te++ < 50; )
        ((G = !1),
          P.g.forEach((_, ye) => {
            ye !== E.i &&
              P.g.forEach((Oe, De) => {
                De !== ye &&
                  (De === E.i || De < ye) &&
                  B(_, Oe) &&
                  ((_.y = Oe.y + Oe.h), (G = !0));
              });
          }));
      if (
        (save(),
        P.g.forEach((_, ye) => {
          const Oe = document.getElementById("trp" + ye);
          Oe &&
            Oe.setAttribute("style", Se(_) + (ye === E.i ? ";z-index:5" : ""));
        }),
        (E.grid.style.height =
          Math.max(...P.g.map((_) => _.y + _.h)) * t + "px"),
        E.rs)
      ) {
        const _ = i().p[E.i];
        /\bG\b|GP|GIP|COMP|WMAP/.test(_) && Ye(E.i);
      }
    }),
    document.addEventListener(
      "click",
      (E) => {
        !document.body.classList.contains("trmenu") ||
          (E.target.closest && E.target.closest('[data-tr="menu"]')) ||
          (E.target.closest &&
            E.target.closest("#mdr2 .pn, #mdr2 .bk, #mdr2 > div") &&
            !E.target.closest("button")) ||
          setTimeout(() => document.body.classList.remove("trmenu"), 0);
      },
      !0,
    ),
    addEventListener("resize", () => {
      tab === "term" &&
        (clearTimeout(e.rz),
        (e.rz = setTimeout(() => {
          const E = l(),
            P = document.querySelector(".trgrid");
          P && P.classList.contains("pc") !== E && render();
        }, 250)));
    }),
    (window.vTerm = Ge),
    (window.TR = e),
    (window.trParse = he),
    (window.trRoda = Be),
    (window.TRM = {
      trBinance: J,
      trFinnhub: se,
      TR: e,
      TS: r,
      EXT: ue,
      FN: Pe,
      FN_TK: Me,
      ALIAS: ve,
      trFn: h,
      trGet: b,
      trCandles: y,
      profitDe: A,
      melhorPx: C,
      srcTag: I,
      logF: v,
      fst: g,
      esc2: d,
      nf: c,
      pc: p,
      cls: u,
      big: m,
      hm: f,
      dm: x,
      tabela: dt,
      carregando: at,
      cabAtivo: w,
      pinta: Ye,
      pintaTodos: Xe,
      carrega: ot,
      roda: Be,
      layAtual: i,
      ehPC: l,
      parse: he,
      statusFontes: Je,
      RH: t,
      ctxTerm: () => Fe(),
    }));
  try {
    FER2.forEach((E) => {
      Array.isArray(E[1]) &&
        E[0] &&
        /Mercado|Ferr|An\xe1lise|Carteira/i.test(String(E[0])) &&
        !E[1].some((P) => P[0] === "term") &&
        E[1].unshift([
          "term",
          "bar",
          "Terminal",
          "Cotações, macro, empresas e notícias no estilo Bloomberg",
        ]);
    });
  } catch {}
  {
    const E = render0;
    render0 = function () {
      tab !== "term" && document.body.classList.remove("trmon", "trmenu");
      const P = E.apply(this, arguments);
      try {
        if (tab === "mercado") {
          const B = document.querySelector("#app .seg.hub");
          B &&
            !B.querySelector("[data-trabre]") &&
            B.insertAdjacentHTML(
              "beforeend",
              '<button data-trabre="1" class="trabre">Terminal</button>',
            );
        }
        if (tab === "home") {
          const B = document.getElementById("app");
          if (B && !B.querySelector(".trhome")) {
            const G = document.createElement("button");
            ((G.className = "trhome"),
              (G.dataset.trabre = "1"),
              (G.innerHTML =
                "<b>TERMINAL</b><span>Cotações ao vivo, Copom implícito, agenda, empresas e notícias</span>"));
            const te = B.querySelector("section,.card");
            te && te.parentNode
              ? te.parentNode.insertBefore(G, te.nextSibling)
              : B.appendChild(G);
          }
        }
      } catch {}
      return P;
    };
  }
  document.addEventListener(
    "click",
    (E) => {
      E.target.closest &&
        E.target.closest("[data-trabre]") &&
        (irPara("term"), scrollTo(0, 0));
    },
    !0,
  );
  {
    const E = TraderStyles.slot("legacy-111");
    ((E.id = "term189"),
      (E.textContent = TraderStyles.css("legacy-111")),
      TraderStyles.mount(E));
  }
})(),
  (function () {
    const e = window.TRM;
    if (!e) return;
    const t = (q) => {
        const L = document.getElementById("trb" + q);
        return (L && L.clientWidth) || 0;
      },
      {
        trBinance: a,
        TR: o,
        TS: s,
        EXT: n,
        FN: r,
        FN_TK: i,
        ALIAS: l,
        trFn: d,
        trGet: c,
        trCandles: p,
        profitDe: u,
        melhorPx: m,
        srcTag: f,
        logF: x,
        esc2: v,
        nf: g,
        pc: h,
        cls: b,
        big: y,
        hm: j,
        dm: k,
        tabela: A,
        carregando: C,
        cabAtivo: I,
        pinta: J,
        carrega: se,
        roda: Ie,
        layAtual: Pe,
        ehPC: Me,
      } = e;
    ((o.zoom = {}),
      (o.pan = {}),
      (o.gm = {}),
      (o.cmp = {}),
      (o.nw = { mk: "todos", rel: "todas", tl: 0, q: "" }),
      (o.map = { modo: "bolsa", reg: "mundo", sel: "076" }),
      (o.ia = {}),
      (o.setOrd = "d1"));
    const ue = () => {
        const q = s();
        return (
          q.ind ??
            (q.ind = {
              m9: 1,
              m20: 1,
              m50: 1,
              m200: 1,
              vol: 1,
              rsi: 1,
              macd: 1,
              atr: 1,
              fib: 0,
              sr: 1,
            }),
          q.ind
        );
      },
      ve = () => {
        const q = s();
        return (
          (!Array.isArray(q.tech) || !q.tech.length) &&
            (q.tech = (q.mon || []).slice(0, 14)),
          q.tech
        );
      },
      he = (q) => {
        const L = Pe().p.length;
        return Me() && L > 1 ? (q + 1) % L : q;
      },
      we = (q, L) => {
        const F = new Array(q.length).fill(null);
        let O = 0;
        for (let ne = 0; ne < q.length; ne++)
          ((O += q[ne]),
            ne >= L && (O -= q[ne - L]),
            ne >= L - 1 && (F[ne] = O / L));
        return F;
      },
      Be = (q, L) => {
        const F = new Array(q.length).fill(null),
          O = 2 / (L + 1);
        let ne = null,
          Ee = 0,
          Ae = 0;
        for (let ge = 0; ge < q.length; ge++) {
          const je = q[ge];
          je != null &&
            (ne == null
              ? ((Ae += je), Ee++, Ee === L && ((ne = Ae / L), (F[ge] = ne)))
              : ((ne = je * O + ne * (1 - O)), (F[ge] = ne)));
        }
        return F;
      };
    function Ge(q, L = 14) {
      const F = new Array(q.length).fill(null);
      let O = 0,
        ne = 0;
      for (let Ee = 1; Ee < q.length; Ee++) {
        const Ae = q[Ee] - q[Ee - 1],
          ge = Math.max(Ae, 0),
          je = Math.max(-Ae, 0);
        Ee <= L
          ? ((O += ge),
            (ne += je),
            Ee === L &&
              ((O /= L),
              (ne /= L),
              (F[Ee] = ne === 0 ? 100 : 100 - 100 / (1 + O / ne))))
          : ((O = (O * (L - 1) + ge) / L),
            (ne = (ne * (L - 1) + je) / L),
            (F[Ee] = ne === 0 ? 100 : 100 - 100 / (1 + O / ne)));
      }
      return F;
    }
    function Ce(q) {
      const L = Be(q, 12),
        F = Be(q, 26),
        O = q.map((Ee, Ae) =>
          L[Ae] != null && F[Ae] != null ? L[Ae] - F[Ae] : null,
        ),
        ne = Be(O, 9);
      return {
        m: O,
        sig: ne,
        h: O.map((Ee, Ae) =>
          Ee != null && ne[Ae] != null ? Ee - ne[Ae] : null,
        ),
      };
    }
    function Qe(q, L = 14) {
      const F = new Array(q.length).fill(null);
      let O = null,
        ne = 0;
      for (let Ee = 1; Ee < q.length; Ee++) {
        const Ae = Math.max(
          q[Ee][2] - q[Ee][3],
          Math.abs(q[Ee][2] - q[Ee - 1][4]),
          Math.abs(q[Ee][3] - q[Ee - 1][4]),
        );
        Ee <= L
          ? ((ne += Ae), Ee === L && ((O = ne / L), (F[Ee] = O)))
          : ((O = (O * (L - 1) + Ae) / L), (F[Ee] = O));
      }
      return F;
    }
    function de(q, L, F) {
      const O = q.slice(-220),
        ne = 3,
        Ee = [];
      for (let He = ne; He < O.length - ne; He++) {
        const ce = O[He][2],
          E = O[He][3];
        let P = !0,
          B = !0;
        for (let G = He - ne; G <= He + ne; G++)
          (O[G][2] > ce && (P = !1), O[G][3] < E && (B = !1));
        (P && Ee.push(ce), B && Ee.push(E));
      }
      const Ae = (F || L * 0.01) * 0.6,
        ge = [];
      Ee.sort((He, ce) => He - ce).forEach((He) => {
        const ce = ge[ge.length - 1];
        ce && He - ce.v <= Ae
          ? ((ce.s += He), ce.n++, (ce.v = ce.s / ce.n))
          : ge.push({ v: He, s: He, n: 1 });
      });
      const je = ge
          .filter((He) => He.v < L)
          .sort((He, ce) => ce.v - He.v)
          .slice(0, 3),
        Ze = ge
          .filter((He) => He.v > L)
          .sort((He, ce) => He.v - ce.v)
          .slice(0, 3);
      return {
        sup: je.map((He) => ({ v: He.v, n: He.n })),
        res: Ze.map((He) => ({ v: He.v, n: He.n })),
      };
    }
    function Se(q) {
      const L = q.slice(-120);
      if (L.length < 10) return null;
      let F = -1e18,
        O = 1e18,
        ne = 0,
        Ee = 0;
      L.forEach((ge, je) => {
        (ge[2] > F && ((F = ge[2]), (ne = je)),
          ge[3] < O && ((O = ge[3]), (Ee = je)));
      });
      const Ae = ne > Ee;
      return {
        sobe: Ae,
        hi: F,
        lo: O,
        niv: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((ge) => ({
          r: ge,
          v: Ae ? F - (F - O) * ge : O + (F - O) * ge,
        })),
      };
    }
    function Ve(q, L) {
      if (!q || q.length < 30) return null;
      const F = q.map((et) => et[4]),
        O = F.length,
        ne = L || F[O - 1],
        Ee = we(F, 9),
        Ae = we(F, 20),
        ge = we(F, 50),
        je = we(F, 200),
        Ze = Ge(F),
        He = Qe(q),
        ce = He[O - 1] || null,
        E = (et) => et[O - 1],
        P = [],
        B = (et, nt, it, xt, bt) => {
          for (let tt = 1; tt <= 3; tt++) {
            const ut = O - tt;
            if (
              !(
                ut < 1 ||
                et[ut] == null ||
                nt[ut] == null ||
                et[ut - 1] == null ||
                nt[ut - 1] == null
              )
            ) {
              if (et[ut - 1] <= nt[ut - 1] && et[ut] > nt[ut]) {
                P.push({ t: it, d: "alta", b: tt, tipo: bt });
                break;
              }
              if (et[ut - 1] >= nt[ut - 1] && et[ut] < nt[ut]) {
                P.push({ t: xt, d: "baixa", b: tt, tipo: bt });
                break;
              }
            }
          }
        };
      (B(
        Ee,
        Ae,
        "MM9 cruzou para cima da MM20",
        "MM9 cruzou para baixo da MM20",
        "curto",
      ),
        B(
          F,
          je,
          "Preço rompeu a MM200 para cima",
          "Preço perdeu a MM200",
          "longo",
        ),
        B(
          ge,
          je,
          "Cruz dourada (MM50 acima da MM200)",
          "Cruz da morte (MM50 abaixo da MM200)",
          "longo",
        ));
      for (let et = 1; et <= 3; et++) {
        const nt = O - et;
        if (!(nt < 1 || Ze[nt] == null || Ze[nt - 1] == null)) {
          if (Ze[nt - 1] < 30 && Ze[nt] >= 30) {
            P.push({
              t: "RSI saiu da sobrevenda",
              d: "alta",
              b: et,
              tipo: "rsi",
            });
            break;
          }
          if (Ze[nt - 1] > 70 && Ze[nt] <= 70) {
            P.push({
              t: "RSI saiu da sobrecompra",
              d: "baixa",
              b: et,
              tipo: "rsi",
            });
            break;
          }
        }
      }
      const G = q.slice(-250),
        te = Math.max(...G.map((et) => et[2])),
        _ = Math.min(...G.map((et) => et[3]));
      (ne >= te * 0.995 &&
        P.push({
          t: "Na máxima de 52 semanas",
          d: "alta",
          b: 0,
          tipo: "extremo",
        }),
        ne <= _ * 1.005 &&
          P.push({
            t: "Na mínima de 52 semanas",
            d: "baixa",
            b: 0,
            tipo: "extremo",
          }));
      const ye = E(ge) != null && ge[O - 6] != null ? E(ge) - ge[O - 6] : 0,
        Oe =
          E(je) == null
            ? E(ge) != null && ne > E(ge) && ye > 0
              ? "alta"
              : E(ge) != null && ne < E(ge) && ye < 0
                ? "baixa"
                : "lateral"
            : ne > E(ge) && E(ge) > E(je) && ye > 0
              ? "alta"
              : ne < E(ge) && E(ge) < E(je) && ye < 0
                ? "baixa"
                : "lateral",
        De = de(q, ne, ce),
        Ne = Se(q),
        _e = [];
      (De.sup.forEach((et, nt) =>
        _e.push({
          tipo: "Suporte" + (et.n > 1 ? " (" + et.n + " toques)" : ""),
          v: et.v,
        }),
      ),
        De.res.forEach((et) =>
          _e.push({
            tipo: "Resistência" + (et.n > 1 ? " (" + et.n + " toques)" : ""),
            v: et.v,
          }),
        ),
        E(je) != null && _e.push({ tipo: "MM200", v: E(je) }),
        E(ge) != null && _e.push({ tipo: "MM50", v: E(ge) }),
        Ne &&
          Ne.niv
            .filter((et) => [0.382, 0.5, 0.618].includes(et.r))
            .forEach((et) =>
              _e.push({ tipo: "Fibo " + g(et.r * 100, 1) + "%", v: et.v }),
            ),
        _e.forEach((et) => {
          ((et.dist = (et.v / ne - 1) * 100),
            (et.datr = ce ? Math.abs(et.v - ne) / ce : null));
        }),
        _e.sort((et, nt) => Math.abs(et.dist) - Math.abs(nt.dist)));
      const lt = _e.filter(
        (et) => Math.abs(et.dist) <= 1 || (et.datr != null && et.datr <= 0.5),
      );
      return {
        px: ne,
        tend: Oe,
        rsi: E(Ze),
        atr: ce,
        atrPct: ce ? (ce / ne) * 100 : null,
        m9: E(Ee),
        m20: E(Ae),
        m50: E(ge),
        m200: E(je),
        niv: _e,
        perto: lt,
        ev: P,
        sr: De,
        fb: Ne,
        h52: te,
        l52: _,
      };
    }
    function Je(q) {
      const L = String(q || "")
          .toUpperCase()
          .replace(/^.*:/, ""),
        F = {
          IBOV: ["WIN", 1, "Ibovespa à vista"],
          WINFUT: ["WIN", 1, ""],
          WDOFUT: ["WDO", 1, ""],
          USDBRL: ["WDO", 0.001, "Dólar à vista"],
          DOLAR: ["WDO", 0.001, "Dólar à vista"],
          SPX: ["US500", 1, "Futuro do S&P 500"],
          NDX: ["NAS100", 1, "Futuro do Nasdaq"],
          DJI: ["US30", 1, "Futuro do Dow"],
          BTCUSDT: ["BTCUSD", 1, ""],
          ETHUSDT: ["ETHUSD", 1, ""],
        }[L];
      return F
        ? { a: F[0], mult: F[1], nota: F[2] }
        : { a: L, mult: 1, nota: "" };
    }
    function Ye(q, L) {
      const F = Je(q),
        O = o.dados["cd|" + F.a + "|" + L];
      if (!O || !O.v) return null;
      let ne = O.v.candles || [];
      return (
        F.mult !== 1 &&
          (ne = ne.map((Ee) => [
            Ee[0],
            Ee[1] * F.mult,
            Ee[2] * F.mult,
            Ee[3] * F.mult,
            Ee[4] * F.mult,
            Ee[5],
          ])),
        { L: ne, meta: O.v, nota: F.nota || O.v.nota || "" }
      );
    }
    const Xe = (q, L) => p(Je(q).a, L),
      ot = (q, L) => o.err["cd|" + Je(q).a + "|" + L] || "",
      Ke = (q) => {
        const L = u(String(q).replace(/^IBOV$/, "IBOV"));
        return L && L.px ? L.px : (o.px["FH:" + q] || {}).px || null;
      };
    function at(q, L, F) {
      var O;
      const ne = (O = S.ax ?? (S.ax = {})).alpx ?? (O.alpx = []);
      if (ne.filter((ge) => !ge.fired).length >= 20)
        return toast("Você já tem 20 alertas ativos.");
      const Ee =
          Ke(q) ||
          ((Ye(q, "1d") || {}).L || []).slice(-1).map((ge) => ge[4])[0],
        Ae = Ee && L < Ee ? "<" : ">";
      (ne.push({
        id: "t" + Date.now().toString(36),
        s: /^[A-Z]{4}\d/.test(q) ? "BMFBOVESPA:" + q : q,
        c: q,
        op: Ae,
        v: +L.toFixed(2),
        dp: 2,
        em: Date.now(),
        orig: F || "terminal",
      }),
        save());
      try {
        turnoPushSync(!0);
      } catch {}
      toast(
        `Alerta: ${q} ${Ae === "<" ? "abaixo de" : "acima de"} ${g(L)} (${F || "terminal"}).`,
      );
    }
    const rt = [
      ["5m", "5M"],
      ["15m", "15M"],
      ["60m", "60M"],
      ["1d", "D"],
    ];
    function dt(q) {
      const L = String(q.arg || "").toUpperCase();
      return /\b5M\b/.test(L)
        ? "5m"
        : /\b15M\b/.test(L)
          ? "15m"
          : /\b(60M|1H)\b/.test(L)
            ? "60m"
            : /\bD\b/.test(L)
              ? "1d"
              : q.f === "GIP"
                ? "5m"
                : "1d";
    }
    function vt(q, L) {
      const F = q.tk,
        O = dt(q),
        ne = Ye(F, O),
        Ee = ue(),
        Ae = `<div class="g9bar">${rt.map(([ct, gt]) => `<button class="g9b${ct === O ? " on" : ""}" data-g9="tf|${ct}|${L}">${gt}</button>`).join("")}<span class="g9sep"></span>${[
          ["m9", "9"],
          ["m20", "20"],
          ["m50", "50"],
          ["m200", "200"],
          ["vol", "Vol"],
          ["rsi", "RSI"],
          ["macd", "MACD"],
          ["atr", "ATR"],
          ["fib", "Fibo"],
          ["sr", "S/R"],
        ]
          .map(
            ([ct, gt]) =>
              `<button class="g9b g9i${Ee[ct] ? " on" : ""}" data-g9="ind|${ct}|${L}">${gt}</button>`,
          )
          .join(
            "",
          )}<span class="g9sep"></span><button class="g9b${(window.TraderTerminalChartStyle || "line") === "line" ? " on" : ""}" data-g9="style|line|${L}" title="Gráfico de linha">Linha</button><button class="g9b${window.TraderTerminalChartStyle === "candles" ? " on" : ""}" data-g9="style|candles|${L}" title="Exibir candles originais">Candles</button><span class="g9sep"></span><button class="g9b" data-g9="zoom|-|${L}" title="Reduzir zoom">−</button><button class="g9b" data-g9="zoom|+|${L}" title="Ampliar zoom">+</button><button class="g9b" data-g9="page|0.5|${L}" aria-label="Histórico anterior">←</button><button class="g9b" data-g9="page|-0.5|${L}" aria-label="Histórico seguinte">→</button><button class="g9b" data-g9="latest|0|${L}">Último</button><button class="g9b" data-g9="reset|0|${L}">Ajustar</button><button class="g9b" data-g9axis="scale" data-panel="${L}" aria-label="Alternar escala logarítmica">${window.TerminalChart.axis(L).log ? "LOG" : "Linear"}</button><button class="g9b" data-g9axis="priceauto" data-panel="${L}">Auto preço</button><input class="trin g9cmp" data-g9cmpin="${L}" placeholder="Comparar com…" aria-label="Comparar com outro ativo"></div>`;
      if (!ne || !ne.L.length)
        return (
          I(F) +
          Ae +
          C(ot(F, O) || "Sem histórico disponível para este intervalo.")
        );
      let ge = ne.L.slice();
      const je = null,
        Ze = window.TerminalChart.view(
          ge.length,
          o.zoom[L] || (O === "1d" ? 140 : 120),
          o.pan[L] || 0,
        ),
        He = Ze.count,
        ce = Ze.start,
        E = ge.map((ct) => ct[4]),
        P = we(E, 9),
        B = we(E, 20),
        G = we(E, 50),
        te = we(E, 200),
        _ = Ge(E),
        ye = Ce(E),
        Oe = Qe(ge),
        De = Ve(ge, je),
        Ne = document.getElementById("trb" + L),
        _e = Math.max(240, Math.round(((Ne && Ne.clientWidth) || 620) - 14)),
        lt = Math.max(260, Math.round(((Ne && Ne.clientHeight) || 420) - 118)),
        et = (Ee.rsi ? 1 : 0) + (Ee.macd ? 1 : 0),
        nt = et ? Math.max(52, Math.round(lt * 0.17)) : 0,
        it = lt - et * (nt + 6),
        xt = _e,
        bt = 58,
        tt = xt - bt,
        ut = ge.slice(ce, Ze.end),
        $t = ut.length,
        Et =
          tt /
          ($t +
            (window.TerminalChart.padding
              ? window.TerminalChart.padding(L, $t)
              : Math.max(2, Math.round($t * 0.14)))),
        pt = (ct) => ct * Et + Et / 2,
        wt = Math.max(...ut.map((ct) => ct[2])),
        jt = Math.min(...ut.map((ct) => ct[3])),
        Mt = wt - jt || wt * 0.01,
        Ct = window.TerminalChart.price(
          L,
          jt - Mt * 0.04 > 0 ? jt - Mt * 0.04 : jt,
          wt + Mt * 0.04,
        ),
        Rt = Ct.high,
        Lt = Ct.low,
        At = (ct) => 6 + Ct.ratio(ct) * (it - 24),
        Dt = wt < 5 ? 4 : wt > 5e3 ? 0 : 2;
      let St = `<svg class="g9svg" viewBox="0 0 ${xt} ${lt}" width="${xt}" height="${lt}" data-g9svg="${L}" tabindex="0" role="img" aria-label="Gráfico de ${v(F)}. Mais e menos para zoom; setas para navegar; Home para ajustar."><text x="${tt / 2}" y="${it * 0.42}" text-anchor="middle" class="g9watermark">${v(F)}</text><text x="${tt / 2}" y="${it * 0.42 + 25}" text-anchor="middle" class="g9watermark-sub">${v(ne.meta.simbolo || F)} · ${O}</text>`;
      for (let ct = 0; ct <= 4; ct++) {
        const gt = Ct.at(1 - ct / 4),
          mt = At(gt);
        St += `<line x1="0" x2="${tt}" y1="${mt}" y2="${mt}" class="g9gr"/><text x="${tt + 4}" y="${mt + 3}" class="g9tx">${g(gt, Dt)}</text>`;
      }
      const Ut = Math.max(1, Math.round($t / 6));
      for (let ct = 0; ct < $t; ct += Ut) {
        const gt = new Date(ut[ct][0] * 1e3);
        St += `<text x="${pt(ct)}" y="${it - 6}" class="g9tx" text-anchor="${pt(ct) < 24 ? "start" : "middle"}">${O === "1d" ? gt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : gt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</text>`;
      }
      if (Ee.vol) {
        const ct = Math.max(...ut.map((mt) => mt[5] || 0)) || 1,
          gt = (it - 24) * 0.18;
        ut.forEach((mt, kt) => {
          const yt = ((mt[5] || 0) / ct) * gt;
          yt > 0 &&
            (St += `<rect x="${pt(kt) - Et * 0.35}" y="${it - 18 - yt}" width="${Math.max(1, Et * 0.7)}" height="${yt}" class="${mt[4] >= mt[1] ? "g9vu" : "g9vd"}"/>`);
        });
      }
      if (
        ((St += `<defs><clipPath id="priceclip${L}"><rect x="0" y="6" width="${tt}" height="${it - 24}"/></clipPath></defs><g clip-path="url(#priceclip${L})">`),
        (window.TraderTerminalChartStyle || "line") === "candles")
      )
        ut.forEach((ct, gt) => {
          const mt = ct[4] >= ct[1],
            kt = mt ? "#3aad74" : "#e7614c";
          St += `<line x1="${pt(gt)}" x2="${pt(gt)}" y1="${At(ct[2])}" y2="${At(ct[3])}" stroke="${kt}"/><rect x="${pt(gt) - Et * 0.36}" y="${At(Math.max(ct[1], ct[4]))}" width="${Math.max(1, Et * 0.72)}" height="${Math.max(1, Math.abs(At(ct[1]) - At(ct[4])))}" fill="${kt}"/>`;
        });
      else {
        const ct = ut
          .map(
            (gt, mt) =>
              `${mt ? "L" : "M"}${pt(mt).toFixed(2)} ${At(gt[4]).toFixed(2)}`,
          )
          .join(" ");
        if (ct) {
          const gt = pt(0).toFixed(2),
            mt = pt($t - 1).toFixed(2),
            kt = (it - 18).toFixed(2);
          St += `<defs><linearGradient id="g9ln${L}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#595e67" stop-opacity=".44"/><stop offset="1" stop-color="#32353a" stop-opacity=".04"/></linearGradient></defs><path d="${ct} L${mt} ${kt} L${gt} ${kt} Z" fill="url(#g9ln${L})"/><path d="${ct}" fill="none" stroke="#f4f3f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="${mt}" cy="${At(ut[$t - 1][4])}" r="3.2" fill="#6896be" stroke="#f4f3f1" stroke-width="1.2"/>`;
        }
      }
      St += "</g>";
      const Ot = (ct, gt, mt = 1.3) => {
        let kt = "";
        for (let yt = 0; yt < $t; yt++) {
          const Tt = ct[ce + yt];
          Tt == null ||
            Tt > Rt ||
            Tt < Lt ||
            (kt +=
              (kt ? "L" : "M") + pt(yt).toFixed(1) + "," + At(Tt).toFixed(1));
        }
        return kt
          ? `<path d="${kt}" fill="none" stroke="${gt}" stroke-width="${mt}" clip-path="url(#priceclip${L})"/>`
          : "";
      };
      (Ee.m9 && (St += Ot(P, "#c39a4d")),
        Ee.m20 && (St += Ot(B, "#86abcb")),
        Ee.m50 && (St += Ot(G, "#c9a156")),
        Ee.m200 && (St += Ot(te, "#c0bbb2", 1.6)));
      const Bt = (ct, gt, mt, kt) =>
        ct < Lt || ct > Rt
          ? ""
          : `<line x1="0" x2="${tt}" y1="${At(ct)}" y2="${At(ct)}" stroke="${gt}" stroke-width="1" ${kt ? 'stroke-dasharray="5 4"' : ""} opacity=".85"/><text x="4" y="${At(ct) - 3}" class="g9tx" fill="${gt}">${mt}</text>`;
      if (
        (Ee.sr &&
          De &&
          (De.sr.sup.forEach((ct) => {
            St += Bt(ct.v, "#5fca94", `S ${g(ct.v, Dt)}`, 1);
          }),
          De.sr.res.forEach((ct) => {
            St += Bt(ct.v, "#ed8b7c", `R ${g(ct.v, Dt)}`, 1);
          })),
        Ee.fib)
      ) {
        const ct = Se(ut);
        ct &&
          ct.niv.forEach((gt) => {
            St += Bt(gt.v, "#c2943e", `${g(gt.r * 100, 1)}% ${g(gt.v, Dt)}`, 0);
          });
      }
      const Pt = E[E.length - 1];
      St += `<line x1="0" x2="${tt}" y1="${At(Pt)}" y2="${At(Pt)}" stroke="#c2933d" stroke-dasharray="2 3"/><rect x="${tt + 1}" y="${At(Pt) - 8}" width="${bt - 2}" height="16" fill="#c2933d"/><text x="${tt + 4}" y="${At(Pt) + 4}" class="g9tx" fill="#000000" style="font-weight:700">${g(Pt, Dt)}</text>`;
      let qt = it + 6;
      if (Ee.rsi) {
        const ct = (mt) => qt + 4 + ((100 - mt) / 100) * (nt - 8);
        St += `<rect x="0" y="${qt}" width="${tt}" height="${nt}" class="g9sub"/><line x1="0" x2="${tt}" y1="${ct(70)}" y2="${ct(70)}" class="g9gr2"/><line x1="0" x2="${tt}" y1="${ct(30)}" y2="${ct(30)}" class="g9gr2"/>`;
        let gt = "";
        for (let mt = 0; mt < $t; mt++) {
          const kt = _[ce + mt];
          kt != null &&
            (gt +=
              (gt ? "L" : "M") + pt(mt).toFixed(1) + "," + ct(kt).toFixed(1));
        }
        ((St += `<path d="${gt}" fill="none" stroke="#c9c5bc" stroke-width="1.3"/><text x="4" y="${qt + 12}" class="g9tx">RSI 14: ${g(_[_.length - 1], 1)}</text><text x="${tt + 4}" y="${ct(70) + 3}" class="g9tx">70</text><text x="${tt + 4}" y="${ct(30) + 3}" class="g9tx">30</text>`),
          (qt += nt + 6));
      }
      if (Ee.macd) {
        const ct = [];
        for (let yt = 0; yt < $t; yt++)
          [ye.m[ce + yt], ye.sig[ce + yt], ye.h[ce + yt]].forEach((Tt) => {
            Tt != null && ct.push(Tt);
          });
        const gt = Math.max(1e-9, ...ct.map(Math.abs)),
          mt = (yt) => qt + nt / 2 - (yt / gt) * (nt / 2 - 4);
        St += `<rect x="0" y="${qt}" width="${tt}" height="${nt}" class="g9sub"/><line x1="0" x2="${tt}" y1="${mt(0)}" y2="${mt(0)}" class="g9gr2"/>`;
        for (let yt = 0; yt < $t; yt++) {
          const Tt = ye.h[ce + yt];
          Tt != null &&
            (St += `<rect x="${pt(yt) - Et * 0.35}" y="${Math.min(mt(0), mt(Tt))}" width="${Math.max(1, Et * 0.7)}" height="${Math.max(0.5, Math.abs(mt(Tt) - mt(0)))}" fill="${Tt >= 0 ? "#3aad74" : "#e7614c"}" opacity=".55"/>`);
        }
        const kt = (yt, Tt) => {
          let Ft = "";
          for (let It = 0; It < $t; It++) {
            const Nt = yt[ce + It];
            Nt != null &&
              (Ft +=
                (Ft ? "L" : "M") + pt(It).toFixed(1) + "," + mt(Nt).toFixed(1));
          }
          return `<path d="${Ft}" fill="none" stroke="${Tt}" stroke-width="1.2"/>`;
        };
        St +=
          kt(ye.m, "#86abcb") +
          kt(ye.sig, "#c9a156") +
          `<text x="4" y="${qt + 12}" class="g9tx">MACD 12/26/9: ${g(ye.m[ye.m.length - 1], Dt > 2 ? 4 : 3)} · sinal ${g(ye.sig[ye.sig.length - 1], Dt > 2 ? 4 : 3)}</text>`;
      }
      ((St += `<line class="g9cx" x1="-10" x2="-10" y1="0" y2="${lt}"/><line class="g9cy" x1="0" x2="${tt}" y1="-10" y2="-10"/><text class="g9cursor-price" x="${tt + 3}" y="-10"></text><rect x="0" y="0" width="${tt}" height="${lt}" fill="transparent" data-g9hit="${L}"/></svg>`),
        (o.gm[L] = {
          tk: F,
          iv: O,
          L: ut,
          ini: ce,
          bw: Et,
          cw: tt,
          chartHeight: it,
          priceHigh: Rt,
          priceLow: Lt,
          priceAxis: Ct,
          all: ge,
          m9: P,
          m20: B,
          m50: G,
          m200: te,
          R: _,
          A: Oe,
          dp: Dt,
          ult: Ke(F),
        }));
      const Ht = `<div class="g9leg" id="g9leg${L}">${ft(L, $t - 1)}</div>`;
      let Vt = "";
      if (De) {
        const ct = { alta: "tg", baixa: "tr", lateral: "am" }[De.tend],
          gt = De.niv
            .slice(0, 5)
            .map(
              (mt) =>
                `<span class="g9niv">${v(mt.tipo)} <b>${g(mt.v, Dt)}</b> <em class="${b(mt.dist)}">${h(mt.dist, 1)}</em><button class="g9al" data-g9="alerta|${mt.v}|${L}|${v(mt.tipo)}" title="Avisar no celular quando chegar aqui">🔔</button></span>`,
            )
            .join("");
        Vt = `<div class="g9rod"><span>Tendência <b class="${ct}">${De.tend}</b></span>${Ee.atr && De.atr ? `<span>ATR 14 <b>${g(De.atr, Dt)}</b> (${g(De.atrPct, 1)}%)</span>` : ""}<span>RSI <b>${g(De.rsi, 0)}</b></span>${De.ev.map((mt) => `<span class="g9ev ${mt.d === "alta" ? "tg" : "tr"}">${v(mt.t)}${mt.b ? ` (${mt.b} ${mt.b > 1 ? "velas" : "vela"})` : ""}</span>`).join("")}</div><div class="g9rod">${gt}</div>`;
      }
      return (
        I(F) +
        Ae +
        `<p class="trfont g9help">Arraste na horizontal ou use as setas. Pinça / Ctrl + rolagem: zoom. Duplo toque: ajustar. ${Ze.offset ? "Histórico · " + Ze.offset + " velas antes da última" : "Últimas velas disponíveis"}.</p>` +
        Ht +
        St +
        Vt +
        `<div class="trfont">${v(ne.meta.simbolo || "")} · ${O === "1d" ? "diário" : O} · Yahoo${ne.nota ? " · " + v(ne.nota) : ""} · OHLC preservado da fonte histórica; a cotação do cabeçalho é consultada separadamente · S/R = topos e fundos agrupados; não é recomendação.</div>`
      );
    }
    function ft(q, L) {
      const F = o.gm[q];
      if (!F || !F.L[L]) return "";
      const O = F.L[L],
        ne = F.ini + L,
        Ee = F.dp,
        Ae = new Date(O[0] * 1e3),
        ge = ue(),
        je = (Ze) => (Ze && Ze[ne] != null ? g(Ze[ne], Ee) : "—");
      return `<b>${F.iv === "1d" ? Ae.toLocaleDateString("pt-BR") : Ae.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</b> A ${g(O[1], Ee)} M ${g(O[2], Ee)} m ${g(O[3], Ee)} F <b class="${b(O[4] - O[1])}">${g(O[4], Ee)}</b> V ${y(O[5])}${ge.m9 ? ` <i style="color:#4dc388">9 ${je(F.m9)}</i>` : ""}${ge.m20 ? ` <i style="color:#86abcb">20 ${je(F.m20)}</i>` : ""}${ge.m50 ? ` <i style="color:#c9a156">50 ${je(F.m50)}</i>` : ""}${ge.m200 ? ` <i style="color:#c0bbb2">200 ${je(F.m200)}</i>` : ""}${ge.rsi ? ` <i style="color:#c9c5bc">RSI ${F.R[ne] != null ? g(F.R[ne], 1) : "—"}</i>` : ""}${ge.atr ? ` ATR ${je(F.A)}` : ""}`;
    }
    document.addEventListener("pointermove", (q) => {
      const L = q.target && q.target.dataset && q.target.dataset.g9hit;
      if (L == null) return;
      const F = +L,
        O = o.gm[F];
      if (!O) return;
      const ne = q.target.ownerSVGElement,
        Ee = ne.getBoundingClientRect(),
        Ae = (q.clientX - Ee.left) * (ne.viewBox.baseVal.width / Ee.width),
        ge = Math.max(0, Math.min(O.L.length - 1, Math.floor(Ae / O.bw))),
        je = document.getElementById("g9leg" + F);
      je && (je.innerHTML = ft(F, ge));
      const Ze = (q.clientY - Ee.top) * (ne.viewBox.baseVal.height / Ee.height),
        He = ne.querySelector(".g9cy"),
        ce = ne.querySelector(".g9cursor-price");
      He &&
        ce &&
        Ze >= 6 &&
        Ze <= O.chartHeight - 18 &&
        (He.setAttribute("y1", Ze),
        He.setAttribute("y2", Ze),
        ce.setAttribute("y", Ze - 3),
        (ce.textContent = g(
          O.priceAxis.at((Ze - 6) / (O.chartHeight - 24)),
          O.dp,
        )));
      const E = ne.querySelector(".g9cx");
      if (E) {
        const P = ge * O.bw + O.bw / 2;
        (E.setAttribute("x1", P), E.setAttribute("x2", P));
      }
    });
    async function ht(q) {
      await Promise.all([Xe(q.tk, dt(q)), d("cot", { s: [q.tk] }, 15e3)]);
    }
    ((i.G = "Gráfico com indicadores · PETR4 G 15M"),
      (i.GP = "Gráfico diário com indicadores"),
      (i.GIP = "Gráfico intradiário (5 min)"),
      ["G", "GP", "GIP"].forEach((q) => {
        n[q] = {
          tk: !0,
          vivo: (L, F) => {
            const O = Ke(L.tk),
              ne = o.gm[F];
            return O != null && !!ne && ne.ult !== O;
          },
          load: ht,
          body: vt,
        };
      }),
      (r.COMP = "Comparar ativos · COMP PETR4 VALE3 IBOV"));
    const qe = [
        ["1M", 21],
        ["3M", 63],
        ["6M", 126],
        ["1A", 252],
        ["2A", 500],
      ],
      Le = (q) =>
        String(q.arg || "")
          .toUpperCase()
          .split(/[\s,;]+/)
          .filter(Boolean)
          .slice(0, 6);
    ((n.COMP = {
      livre: !0,
      load: async (q) => {
        await Promise.all(Le(q).map((L) => Xe(L, "1d")));
      },
      body: (q, L) => {
        const F = Le(q);
        if (F.length < 1)
          return '<div class="trnote">Escreva os ativos: COMP PETR4 VALE3 IBOV</div>';
        const O = o.cmp[L] || 126,
          ne = F.map((et) => ({ t: et, V: Ye(et, "1d") })),
          Ee = ne.filter((et) => et.V && et.V.L.length > 5),
          Ae = `<div class="g9bar">${qe.map(([et, nt]) => `<button class="g9b${nt === O ? " on" : ""}" data-g9="per|${nt}|${L}">${et}</button>`).join("")}<input class="trin g9cmp" data-g9cmpadd="${L}" placeholder="+ ativo"></div>`;
        if (!Ee.length)
          return Ae + C(F.map((et) => ot(et, "1d")).filter(Boolean)[0] || "");
        const ge = (et) => Math.floor(et[0] / 86400),
          je = Ee.map((et) => new Map(et.V.L.map((nt) => [ge(nt), nt[4]]))),
          Ze = [...je[0].keys()]
            .slice(-O)
            .filter((et) => je.every((nt) => nt.has(et)));
        if (Ze.length < 5)
          return Ae + C("Poucos dias em comum entre os ativos.");
        const He = [
            "#c2933d",
            "#86abcb",
            "#caa45f",
            "#bbb6ab",
            "#c9c5bc",
            "#c39a4d",
          ],
          ce = Ee.map((et, nt) => {
            const it = je[nt].get(Ze[0]);
            return Ze.map((xt) => (je[nt].get(xt) / it) * 100);
          }),
          E = document.getElementById("trb" + L),
          P = Math.max(320, ((E && E.clientWidth) || 620) - 14),
          B = Math.max(200, Math.round(((E && E.clientHeight) || 400) - 190)),
          G = Math.min(...ce.flat()),
          te = Math.max(...ce.flat()),
          _ = (et) => (et / (Ze.length - 1)) * (P - 50),
          ye = (et) => 8 + ((te - et) / (te - G || 1)) * (B - 26);
        let Oe = `<svg class="g9svg" viewBox="0 0 ${P} ${B}" width="${P}" height="${B}"><line x1="0" x2="${P - 50}" y1="${ye(100)}" y2="${ye(100)}" class="g9gr2"/>`;
        for (let et = 0; et <= 3; et++) {
          const nt = G + ((te - G) * et) / 3;
          Oe += `<text x="${P - 46}" y="${ye(nt) + 3}" class="g9tx">${g(nt - 100, 1)}%</text>`;
        }
        (ce.forEach((et, nt) => {
          Oe += `<path d="${et.map((it, xt) => (xt ? "L" : "M") + _(xt).toFixed(1) + "," + ye(it).toFixed(1)).join("")}" fill="none" stroke="${He[nt]}" stroke-width="1.6"/>`;
        }),
          (Oe += "</svg>"));
        const De = (et) => et.slice(1).map((nt, it) => Math.log(nt / et[it])),
          Ne = (et) => {
            const nt = De(et),
              it = nt.reduce((xt, bt) => xt + bt, 0) / nt.length;
            return (
              Math.sqrt(
                (nt.reduce((xt, bt) => xt + (bt - it) ** 2, 0) /
                  (nt.length - 1)) *
                  252,
              ) * 100
            );
          },
          _e = (et) => {
            let nt = et[0],
              it = 0;
            return (
              et.forEach((xt) => {
                ((nt = Math.max(nt, xt)), (it = Math.min(it, xt / nt - 1)));
              }),
              it * 100
            );
          },
          lt = (et, nt) => {
            const it = De(et),
              xt = De(nt),
              bt = it.reduce((pt, wt) => pt + wt, 0) / it.length,
              tt = xt.reduce((pt, wt) => pt + wt, 0) / xt.length;
            let ut = 0,
              $t = 0,
              Et = 0;
            return (
              it.forEach((pt, wt) => {
                ((ut += (pt - bt) * (xt[wt] - tt)),
                  ($t += (pt - bt) ** 2),
                  (Et += (xt[wt] - tt) ** 2));
              }),
              ut / Math.sqrt($t * Et)
            );
          };
        return (
          Ae +
          Oe +
          A(
            [
              "Ativo",
              "Retorno",
              "Volatilidade a.a.",
              "Maior queda",
              "Correlação c/ " + v(Ee[0].t),
              "",
            ],
            Ee.map(
              (et, nt) =>
                `<tr data-g9g="${v(et.t)}"><td class="tk"><i style="color:${He[nt]}">■</i> ${v(et.t)}</td><td class="num ${b(ce[nt][ce[nt].length - 1] - 100)}">${h(ce[nt][ce[nt].length - 1] - 100, 1)}</td><td class="num">${g(Ne(ce[nt]), 1)}%</td><td class="num tr">${g(_e(ce[nt]), 1)}%</td><td class="num">${nt ? g(lt(ce[0], ce[nt]), 2) : "—"}</td><td><button class="trx" data-g9="rmcmp|${v(et.t)}|${L}">✕</button></td></tr>`,
            ),
            "comp",
          ) +
          `<div class="trfont">Base 100 no início do período (${Ze.length} pregões em comum) · fechamento diário (Yahoo)</div>`
        );
      },
    }),
      (r.TECH = "Ativos perto de suporte, resistência, médias ou Fibonacci"));
    async function ke() {
      const q = ve();
      for (let L = 0; L < q.length; L += 3)
        await Promise.all(q.slice(L, L + 3).map((F) => Xe(F, "1d")));
    }
    function ze(q) {
      const L = Ye(q, "1d");
      return L ? Ve(L.L, Ke(q)) : null;
    }
    ((n.TECH = {
      vivo: !1,
      load: ke,
      body: (q, L) => {
        const F = ve(),
          O = F.map((je) => ({ t: je, a: ze(je) })),
          ne = O.filter((je) => je.a),
          Ee = O.filter((je) => !je.a);
        ne.sort(
          (je, Ze) =>
            (Ze.a.perto.length ? 1 : 0) - (je.a.perto.length ? 1 : 0) ||
            Math.abs((je.a.niv[0] || {}).dist || 99) -
              Math.abs((Ze.a.niv[0] || {}).dist || 99),
        );
        const Ae = `<div class="trrow"><input class="trin" id="g9tadd" placeholder="+ ativo" style="width:90px"><button class="trbtn" data-g9="tadd||${L}">+</button></div>`,
          ge = (je) => {
            const Ze = je.a,
              He = Ze.niv[0],
              ce = { alta: "tg", baixa: "tr", lateral: "am" }[Ze.tend],
              E = Ze.perto.length;
            return `<div class="g9t${E ? " perto" : ""}" data-g9g="${v(je.t)}"><div class="g9t1"><b class="tk">${v(je.t)}</b><span class="num">${g(Ze.px)}</span><span class="${ce}">${Ze.tend === "alta" ? "▲" : Ze.tend === "baixa" ? "▼" : "◆"} ${Ze.tend}</span><span class="mut">RSI ${g(Ze.rsi, 0)}</span><button class="trx" data-g9="trm|${v(je.t)}|${L}" aria-label="Tirar">✕</button></div>
    ${He ? `<div class="g9t2">${E ? '<b class="am">PERTO</b> ' : ""}${v(He.tipo)} ${g(He.v)} <em class="${b(He.dist)}">${h(He.dist, 1)}</em>${He.datr != null ? ` · ${g(He.datr, 1)} ATR` : ""}</div>` : ""}${
      Ze.ev.length
        ? `<div class="g9t3">${Ze.ev
            .slice(0, 2)
            .map(
              (P) =>
                `<span class="${P.d === "alta" ? "tg" : "tr"}">${v(P.t)}</span>`,
            )
            .join(" · ")}</div>`
        : ""
    }</div>`;
          };
        return (
          Ae +
          ne.map(ge).join("") +
          (Ee.length
            ? `<div class="trfont">${Ee.map((je) => v(je.t) + (ot(je.t, "1d") ? ": " + v(ot(je.t, "1d")) : "")).join(" · ")} carregando…</div>`
            : "") +
          '<div class="trfont">"Perto" = até 1% ou meia ATR de um suporte, resistência, MM50/MM200 ou Fibonacci 38,2/50/61,8% · diário · toque para abrir o gráfico.</div>'
        );
      },
    }),
      (r.SETORES = "Comparação entre setores · SETORES EUA"),
      (l.SECT = "SETORES"),
      (l.BI = "BI"),
      (n.SETORES = {
        load: (q) =>
          d(
            "setores",
            { mk: /EUA|US/i.test(q.arg) ? "america" : "brazil" },
            3e5,
          ),
        body: (q, L) => {
          const F = /EUA|US/i.test(q.arg) ? "america" : "brazil",
            O = c("setores", { mk: F });
          if (!O.v) return C(O.err);
          const ne = o.setOrd,
            Ee = O.v.setores
              .slice()
              .sort((ge, je) => (je[ne] ?? -99) - (ge[ne] ?? -99)),
            Ae = Math.max(...Ee.map((ge) => Math.abs(ge[ne] || 0)), 0.5);
          return (
            `<div class="g9bar">${[
              ["d1", "Dia"],
              ["sem", "Semana"],
              ["mes", "Mês"],
              ["ano", "Ano"],
            ]
              .map(
                ([ge, je]) =>
                  `<button class="g9b${ge === ne ? " on" : ""}" data-g9="sord|${ge}|${L}">${je}</button>`,
              )
              .join(
                "",
              )}<span class="mut" style="margin-left:6px">${F === "america" ? "EUA" : "B3"}</span></div>` +
            A(
              [
                "Setor",
                "",
                "Dia",
                "Semana",
                "Mês",
                "Ano",
                "Sobem/caem",
                "Maiores",
              ],
              Ee.map(
                (ge) =>
                  `<tr><td>${v(ge.nome)}</td><td style="width:70px"><span class="g9bar2"><i class="${(ge[ne] || 0) >= 0 ? "up" : "dn"}" style="width:${(Math.abs(ge[ne] || 0) / Ae) * 100}%"></i></span></td><td class="num ${b(ge.d1)}">${h(ge.d1)}</td><td class="num ${b(ge.sem)}">${h(ge.sem, 1)}</td><td class="num ${b(ge.mes)}">${h(ge.mes, 1)}</td><td class="num ${b(ge.ano)}">${h(ge.ano, 1)}</td><td class="num">${ge.alta}/${ge.baixa}</td><td class="mut">${ge.lideres.map((je) => `<span data-g9g="${v(je.s)}" class="g9lk">${v(je.s)} <em class="${b(je.d1)}">${h(je.d1, 1)}</em></span>`).join(" ")}</td></tr>`,
              ),
              "setores",
            ) +
            `<div class="trfont">${v(O.v.fonte)} · ${j(O.v.em)}</div>`
          );
        },
      }));
    const Ue = [
        ["todos", "Todas"],
        ["br", "Brasil"],
        ["eua", "EUA"],
        ["mundo", "Mundo"],
        ["emp", "Empresas"],
        ["juros", "Juros e BCs"],
        ["cmd", "Commodities"],
        ["cri", "Cripto"],
      ],
      We = {
        br: /brasil|ibovespa|\bb3\b|copom|selic|ipca|\breal\b|haddad|lula|tesouro|banco central|petrobras|\bvale\b|ita\xfa|bradesco|caged|igp/i,
        eua: /\beua\b|estados unidos|\bfed\b|powell|wall street|s&p|nasdaq|dow jones|treasur|payroll|trump|\bu\.s\.|federal reserve/i,
        mundo:
          /china|europa|\bbce\b|\becb\b|jap\xe3o|zona do euro|alemanha|reino unido|opep|guerra|global|\xe1sia|argentina|m\xe9xico/i,
        juros:
          /juros|selic|copom|\bfed\b|taxa b\xe1sica|treasur|infla\xe7\xe3o|ipca|\bcpi\b|\bbce\b|yield|curva/i,
        cmd: /petr\xf3leo|brent|\bwti\b|min\xe9rio|ouro|soja|milho|caf\xe9|commodit|\boil\b|gold|cobre|a\xe7\xfacar|boi/i,
        cri: /bitcoin|cripto|ethereum|\bbtc\b|solana|stablecoin/i,
        emp: /\b[A-Z]{4}(3|4|11)\b|lucro|balan\xe7o|resultado trimestral|dividend|jcp|aquisi\xe7\xe3o|fus\xe3o|ipo|guidance|petrobras|vale|ita\xfa|bradesco|ambev|weg|magalu|embraer|nvidia|apple|tesla|microsoft/i,
      },
      Re = {
        PETR: "petrobras",
        VALE: "vale",
        ITUB: "itaú|itau",
        BBAS: "banco do brasil",
        BBDC: "bradesco",
        WEGE: "\\bweg\\b",
        PRIO: "prio\\b|petrorio",
        ABEV: "ambev",
        MGLU: "magazine luiza|magalu",
        B3SA: "\\bb3\\b",
        SUZB: "suzano",
        GGBR: "gerdau",
        CSNA: "\\bcsn\\b",
        EMBR: "embraer",
        RENT: "localiza",
        ELET: "eletrobras",
        BOVA: "ibovespa",
      },
      K = [
        [/petr\xf3leo|brent|\bwti\b|opep|\boil\b/i, "Petróleo", "PETR4, PRIO3"],
        [
          /min\xe9rio|china|a\xe7o|siderurg/i,
          "Mineração e siderurgia",
          "VALE3, GGBR4, CSNA3",
        ],
        [
          /selic|copom|juros|ipca|infla\xe7\xe3o/i,
          "Bancos, varejo e construção",
          "ITUB4, MGLU3, CYRE3",
        ],
        [
          /d\xf3lar|c\xe2mbio|real\b/i,
          "Exportadoras × importadoras",
          "SUZB3, EMBR3 × varejo",
        ],
        [
          /\bfed\b|treasur|payroll|powell/i,
          "Bolsa global e emergentes",
          "IBOV, EWZ",
        ],
        [/soja|milho|safra|agro|boi/i, "Agronegócio", "SLCE3, BEEF3"],
        [/bitcoin|cripto/i, "Cripto", "BTC, HASH11"],
        [
          /energia el\xe9trica|aneel|tarifa|hidrel/i,
          "Elétricas",
          "ELET3, EQTL3",
        ],
        [
          /fiscal|arcabou\xe7o|d\xe9ficit|d\xedvida p\xfablica/i,
          "Juros longos e bancos",
          "DI longo, BBAS3",
        ],
      ];
    function pe(q) {
      const L = q.t,
        F = s().mon || [];
      let O = 1;
      return (
        q.ag && O++,
        /copom|\bfed\b|payroll|ipca|\bcpi\b|\bpib\b|selic|juros|powell|gal\xedpolo|tarifa/i.test(
          L,
        ) && O++,
        F.some((ne) => {
          const Ee = ne.slice(0, 4),
            Ae = Re[Ee];
          return (
            new RegExp("\\b" + ne + "\\b").test(L) ||
            (Ae && new RegExp(Ae, "i").test(L))
          );
        }) && O++,
        Date.now() - Date.parse(q.d) < 2 * 36e5 && (O += 0.5),
        Math.min(3, Math.floor(O))
      );
    }
    const Q = (q) => Object.keys(We).filter((L) => We[L].test(q.t)),
      re = (q) => K.filter(([L]) => L.test(q.t)).slice(0, 2);
    ((r.NEWS =
      "Central de notícias (mercado, empresa, relevância, linha do tempo)"),
      (l.NC = "NEWS"),
      (l.CN = "NEWS"),
      (n.NEWS = {
        load: async () => {
          const q = o.nw.q;
          await Promise.all([
            d("noticias", {}, 12e4),
            d("agenda", {}, 6e4),
            q ? d("noticias", { q }, 18e4) : null,
          ]);
        },
        body: (q, L) => {
          const F = o.nw,
            O = c("noticias", F.q ? { q: F.q } : {}),
            ne = c("agenda"),
            Ee = `<div class="g9bar">${Ue.map(([ce, E]) => `<button class="g9b${F.mk === ce ? " on" : ""}" data-g9="nmk|${ce}|${L}">${E}</button>`).join("")}<span class="g9sep"></span>${[
              ["todas", "Todas"],
              ["media", "★★+"],
              ["alta", "★★★"],
            ]
              .map(
                ([ce, E]) =>
                  `<button class="g9b${F.rel === ce ? " on" : ""}" data-g9="nrel|${ce}|${L}">${E}</button>`,
              )
              .join(
                "",
              )}<button class="g9b${F.tl ? " on" : ""}" data-g9="ntl||${L}">Linha do tempo</button>
    <input class="trin g9cmp" data-g9nq="${L}" value="${v(F.q)}" placeholder="Empresa ou tema (Enter)"><button class="g9b" data-g9="npdf||${L}" title="Relatório do dia em PDF (Jornal do Pregão)">PDF do dia</button><button class="g9b" data-g9="nimg||${L}" title="Imagem do fechamento para compartilhar">Imagem</button></div>`;
          if (!O.v) return Ee + C(O.err);
          let Ae = O.v.itens.map((ce) => ({ ...ce, r: pe(ce), cl: Q(ce) }));
          (F.mk !== "todos" && (Ae = Ae.filter((ce) => ce.cl.includes(F.mk))),
            F.rel === "media" && (Ae = Ae.filter((ce) => ce.r >= 2)),
            F.rel === "alta" && (Ae = Ae.filter((ce) => ce.r >= 3)),
            (Ae = Ae.slice(0, 80)));
          const ge = (ce) =>
            `<div class="g9n"><span class="num mut">${j(ce.d)}</span><span class="g9st" title="Relevância">${"★".repeat(ce.r)}<i>${"★".repeat(3 - ce.r)}</i></span><a href="${v(ce.l)}" target="_blank" rel="noopener">${v(ce.t)}</a><span class="am">${v(ce.f)}${ce.ag ? " · agência" : ""}</span>${re(
              ce,
            )
              .map(
                ([, E, P]) =>
                  `<span class="g9imp" title="Impacto potencial por regra automática: confira a notícia">pode afetar: ${v(E)} (${v(P)})</span>`,
              )
              .join("")}</div>`;
          let je = "";
          if (F.tl) {
            let ce = "";
            Ae.forEach((E) => {
              const P =
                new Date(E.d).toLocaleString("pt-BR", {
                  weekday: "short",
                  hour: "2-digit",
                }) + "h";
              (P !== ce &&
                ((ce = P), (je += `<div class="g9tlh">${v(P)}</div>`)),
                (je += `<div class="g9tl">${ge(E)}</div>`));
            });
          } else je = Ae.map(ge).join("");
          const Ze = ne.v
              ? ne.v.itens
                  .filter(
                    (ce) =>
                      ce.imp === 3 &&
                      Math.abs(Date.parse(ce.d) - Date.now()) < 30 * 36e5,
                  )
                  .slice(0, 12)
              : [],
            He = `<div class="g9cal"><div class="trsec">Calendário (alto impacto)</div>${Ze.length ? Ze.map((ce) => `<div class="g9ce${Date.parse(ce.d) < Date.now() ? " foi" : ""}"><span class="num">${k(ce.d)} ${j(ce.d)}</span><span>${v(ce.pais)}</span><span>${v(ce.t)}</span><b class="${ce.sur ? (ce.sur.tom === "forte" ? "tg" : ce.sur.tom === "fraca" ? "tr" : "") : ""}">${v(ce.atual || "")}</b><em class="mut">${v(ce.prev ? "proj. " + ce.prev : "")}</em></div>`).join("") : '<div class="trnote">Sem eventos de alto impacto nas próximas horas.</div>'}<button class="trlk" data-trcmd="ECO">agenda completa</button></div>`;
          return (
            Ee +
            `<div class="g9nw${t(L) >= 680 ? " pc" : ""}"><div>${je || '<div class="trload">Nada com esse filtro agora.</div>'}</div>${He}</div><div class="trfont">${Ae.length} manchetes · relevância: agência, tema macro, ativos do seu monitor e horário · "pode afetar" é regra automática, não análise · ${v((O.v.fontes || []).length)} fontes${O.v.falharam && O.v.falharam.length ? " · fora do ar: " + v(O.v.falharam.join(", ")) : ""}</div>`
          );
        },
      }),
      (r.WMAP = "Mapa mundial: bolsas, moedas e juros por país"),
      (l.MAP = "WMAP"),
      (l.MAPA = "WMAP"));
    const ie = [
        ["840", "EUA", "US", "SP:SPX", "TVC:DXY", 0, "TVC:US10Y"],
        ["124", "Canadá", "", "TSX:TSX", "FX:USDCAD", 1, "TVC:CA10Y"],
        ["484", "México", "", "BMV:ME", "FX_IDC:USDMXN", 1, "TVC:MX10Y"],
        [
          "076",
          "Brasil",
          "BR",
          "BMFBOVESPA:IBOV",
          "FX_IDC:USDBRL",
          1,
          "TVC:BR10Y",
        ],
        ["032", "Argentina", "", "BCBA:IMV", "FX_IDC:USDARS", 1, ""],
        ["152", "Chile", "", "BCS:SP_IPSA", "FX_IDC:USDCLP", 1, ""],
        ["170", "Colômbia", "", "BVC:ICAP", "FX_IDC:USDCOP", 1, "TVC:CO10Y"],
        ["604", "Peru", "", "BVL:SPBLPGPT", "FX_IDC:USDPEN", 1, ""],
        ["826", "Reino Unido", "GB", "TVC:UKX", "FX:GBPUSD", 0, "TVC:GB10Y"],
        ["276", "Alemanha", "XM", "XETR:DAX", "FX:EURUSD", 0, "TVC:DE10Y"],
        ["250", "França", "XM", "EURONEXT:PX1", "FX:EURUSD", 0, "TVC:FR10Y"],
        ["380", "Itália", "XM", "INDEX:FTSEMIB", "FX:EURUSD", 0, "TVC:IT10Y"],
        ["724", "Espanha", "XM", "BME:IBC", "FX:EURUSD", 0, "TVC:ES10Y"],
        ["528", "Holanda", "XM", "EURONEXT:AEX", "FX:EURUSD", 0, "TVC:NL10Y"],
        ["756", "Suíça", "", "SIX:SMI", "FX:USDCHF", 1, "TVC:CH10Y"],
        ["752", "Suécia", "", "OMXSTO:OMXS30", "FX:USDSEK", 1, ""],
        [
          "620",
          "Portugal",
          "XM",
          "EURONEXT:PSI20",
          "FX:EURUSD",
          0,
          "TVC:PT10Y",
        ],
        ["578", "Noruega", "", "OSL:OBX", "FX:USDNOK", 1, ""],
        ["616", "Polônia", "", "GPW:WIG20", "FX_IDC:USDPLN", 1, ""],
        ["792", "Turquia", "", "BIST:XU100", "FX_IDC:USDTRY", 1, "TVC:TR10Y"],
        ["392", "Japão", "JP", "TVC:NI225", "FX:USDJPY", 1, "TVC:JP10Y"],
        ["156", "China", "CN", "SSE:000001", "FX_IDC:USDCNY", 1, "TVC:CN10Y"],
        [
          "410",
          "Coreia do Sul",
          "",
          "TVC:KOSPI",
          "FX_IDC:USDKRW",
          1,
          "TVC:KR10Y",
        ],
        ["356", "Índia", "", "NSE:NIFTY", "FX_IDC:USDINR", 1, "TVC:IN10Y"],
        ["036", "Austrália", "", "ASX:XJO", "FX:AUDUSD", 0, "TVC:AU10Y"],
        ["554", "Nova Zelândia", "", "NZX:NZ50G", "FX:NZDUSD", 0, ""],
        [
          "710",
          "África do Sul",
          "",
          "JSE:J203",
          "FX_IDC:USDZAR",
          1,
          "TVC:ZA10Y",
        ],
        ["682", "Arábia Saudita", "", "TADAWUL:TASI", "", 0, ""],
        [
          "360",
          "Indonésia",
          "",
          "IDX:COMPOSITE",
          "FX_IDC:USDIDR",
          1,
          "TVC:ID10Y",
        ],
        ["764", "Tailândia", "", "SET:SET", "FX_IDC:USDTHB", 1, ""],
        ["458", "Malásia", "", "MYX:FBMKLCI", "FX_IDC:USDMYR", 1, ""],
        ["643", "Rússia", "", "", "", 0, ""],
        ["158", "Taiwan", "", "TWSE:TAIEX", "FX_IDC:USDTWD", 1, ""],
      ].map(([q, L, F, O, ne, Ee, Ae]) => ({
        iso: q,
        n: L,
        mac: F,
        idx: O,
        fx: ne,
        inv: Ee,
        y: Ae,
      })),
      R = Object.fromEntries(ie.map((q) => [q.iso, q])),
      z = () => [
        ...new Set(ie.flatMap((q) => [q.idx, q.fx, q.y]).filter(Boolean)),
      ],
      oe = {
        124: [3, 1],
        840: [3, 2],
        484: [3, 3],
        170: [4, 4],
        604: [4, 5],
        "076": [5, 5],
        152: [4, 6],
        "032": [5, 6],
        826: [9, 1],
        528: [10, 1],
        578: [11, 0],
        752: [12, 0],
        620: [8, 2],
        724: [9, 2],
        250: [10, 2],
        276: [11, 2],
        616: [12, 1],
        756: [10, 3],
        380: [11, 3],
        792: [13, 3],
        643: [14, 1],
        682: [13, 4],
        710: [11, 7],
        356: [15, 4],
        156: [16, 3],
        410: [18, 2],
        392: [19, 2],
        158: [18, 4],
        764: [16, 5],
        458: [16, 6],
        360: [17, 7],
        "036": [18, 8],
        554: [20, 9],
      },
      me = {
        mundo: null,
        america: [150, 40, 330, 390],
        europa: [440, 50, 190, 150],
        asia: [620, 60, 330, 260],
      };
    function be() {
      const q = c("cot", { s: z() }),
        L = {};
      return (
        ((q.v && q.v.itens) || []).forEach((F) => {
          L[F.pedido] = F;
        }),
        { o: L, R: q }
      );
    }
    function X(q, L, F) {
      let O = null,
        ne = 2;
      if (F === "bolsa") {
        const Ae = L[q.idx];
        O = Ae && Ae.px != null ? Ae.d1 : null;
      } else if (F === "moeda") {
        const Ae = L[q.fx];
        ((O =
          Ae && Ae.px != null && Ae.d1 != null
            ? q.inv
              ? -Ae.d1
              : Ae.d1
            : null),
          (ne = 1));
      } else {
        const Ae = L[q.y];
        ((O = Ae && Ae.px != null && Ae.dabs != null ? -Ae.dabs * 100 : null),
          (ne = 15));
      }
      if (O == null || !isFinite(O)) return { c: "#262626", v: null };
      const Ee = Math.min(1, Math.abs(O) / ne);
      return {
        c:
          O >= 0
            ? `rgba(34,197,94,${0.25 + Ee * 0.7})`
            : `rgba(239,68,68,${0.25 + Ee * 0.7})`,
        v: O,
      };
    }
    function xe() {
      let q = c("mapa").v;
      if (!q)
        try {
          const L = JSON.parse(
            APP_STORAGE.getItem("diario-term-mapa") || "null",
          );
          L && L.paises && (q = L);
        } catch {}
      return q;
    }
    ((n.WMAP = {
      load: async () => {
        const q = await d("mapa", {}, 864e5);
        if (q && q.paises)
          try {
            APP_STORAGE.setItem("diario-term-mapa", JSON.stringify(q));
          } catch {}
        await Promise.all([
          d("cot", { s: z() }, 2e4),
          d("mundo", { g: "cmd" }),
          d("mundo", { g: "fx" }),
          d("mundo", { g: "cri" }),
          d("setores", { mk: "brazil" }, 3e5),
          d("macro", {}, 30 * 6e4),
        ]);
      },
      body: (q, L) => {
        const F = o.map,
          { o: O, R: ne } = be(),
          Ee = xe(),
          Ae = F.modo,
          ge = `<div class="g9bar">${[
            ["bolsa", "Bolsas"],
            ["moeda", "Moedas"],
            ["juros", "Juros 10 anos"],
          ]
            .map(
              ([De, Ne]) =>
                `<button class="g9b${Ae === De ? " on" : ""}" data-g9="mmodo|${De}|${L}">${Ne}</button>`,
            )
            .join("")}<span class="g9sep"></span>${[
            ["mundo", "Mundo"],
            ["america", "Américas"],
            ["europa", "Europa"],
            ["asia", "Ásia"],
          ]
            .map(
              ([De, Ne]) =>
                `<button class="g9b${F.reg === De ? " on" : ""}" data-g9="mreg|${De}|${L}">${Ne}</button>`,
            )
            .join("")}</div>`;
        let je = "";
        Ee && Ee.paises
          ? (je = `<svg class="g9map" viewBox="${(me[F.reg] || [0, 0, Ee.w, Ee.h]).join(" ")}" preserveAspectRatio="xMidYMid meet">${Ee.paises
              .map((De) => {
                const Ne = R[De.id],
                  _e = Ne ? X(Ne, O, Ae) : { c: "#1a1a1a", v: null };
                return `<path d="${De.d}" fill="${_e.c}" class="${Ne ? "g9pm" : ""}${F.sel === De.id ? " sel" : ""}"${Ne ? ` data-g9="msel|${De.id}|${L}"` : ""}><title>${v(Ne ? Ne.n : De.n)}${_e.v != null ? " " + h(Ae === "juros" ? -_e.v / 100 : _e.v) : ""}</title></path>`;
              })
              .join("")}</svg>`)
          : (je = `<div class="g9tiles">${ie
              .filter((De) => oe[De.iso])
              .map((De) => {
                const Ne = X(De, O, Ae),
                  [_e, lt] = oe[De.iso];
                return `<button style="grid-column:${_e + 1};grid-row:${lt + 1};background:${Ne.c}" class="${F.sel === De.iso ? "sel" : ""}" data-g9="msel|${De.iso}|${L}" title="${v(De.n)}">${v(De.n.slice(0, 3).toUpperCase())}<em>${Ne.v != null ? (Ae === "juros" ? g(-Ne.v, 0) + "pb" : h(Ne.v, 1)) : "—"}</em></button>`;
              })
              .join(
                "",
              )}</div><div class="trfont">${c("mapa").err ? "Mapa em blocos: " + v(c("mapa").err) : "Carregando o mapa…"}</div>`);
        const Ze = R[F.sel] || R["076"],
          He = O[Ze.idx],
          ce = O[Ze.fx],
          E = O[Ze.y],
          P = c("macro").v,
          B = P && Ze.mac ? P.paises.find((De) => De.id === Ze.mac) : null,
          G = `<div class="g9pais"><div class="trsec">${v(Ze.n)}</div><div class="trkv">${Ze.idx ? `<span>${v((He && He.n) || "Índice")} <b>${He && He.px != null ? g(He.px, 0) : "—"}</b> <b class="${b(He && He.d1)}">${h(He && He.d1)}</b></span>` : ""}${Ze.fx ? `<span>${v(Ze.fx.split(":")[1])} <b>${ce && ce.px != null ? g(ce.px, 4) : "—"}</b> <b class="${b(ce && ce.d1)}">${h(ce && ce.d1)}</b></span>` : ""}${Ze.y ? `<span>Juro 10 anos <b>${E && E.px != null ? g(E.px, 3) + "%" : "—"}</b> ${E && E.dabs != null ? `<b class="${b(-E.dabs)}">${E.dabs > 0 ? "+" : ""}${g(E.dabs * 100, 0)} pb</b>` : ""}</span>` : ""}</div>
    ${B && window.trMacFalhas ? trMacFalhas({ paises: [B] }) : ""}${
      B
        ? A(
            ["Indicador", "Atual", "Anterior", "Período"],
            B.itens.map(
              (De) =>
                `<tr><td>${v(De.nome)}</td><td class="num">${window.trMacVal ? trMacVal(De) : g(De.atual)}</td><td class="num mut">${g(De.anterior, De.un === "mil" ? 0 : 2)}</td><td class="mut">${v(De.periodo || "")}</td></tr>`,
            ),
          )
        : '<div class="trnote">Indicadores macro detalhados: Brasil, EUA, zona do euro, Reino Unido, Japão e China (ECST).</div>'
    }
    <div class="trrow"><button class="trbtn" data-g9="mnews|${v(Ze.n)}|${L}">Notícias de ${v(Ze.n)}</button>${Ze.iso === "076" ? `<button class="trbtn" data-g9="gopen|IBOV|${L}">Gráfico do Ibovespa</button>` : Ze.iso === "840" ? `<button class="trbtn" data-g9="gopen|SPX|${L}">Gráfico do S&P 500</button>` : ""}</div></div>`,
          te = (De, Ne, _e) =>
            Ne.length
              ? `<div class="g9fx"><div class="trsec">${De} <button class="trlk" data-trcmd="${_e}">abrir</button></div><div class="g9fxl">${Ne.map(
                  ([lt, et, nt, it]) => {
                    const xt = Math.min(1, Math.abs(et || 0) / 2);
                    return `<span style="background:${et == null ? "#1f1f1f" : et >= 0 ? `rgba(34,197,94,${0.2 + xt * 0.7})` : `rgba(239,68,68,${0.2 + xt * 0.7})`}"${it ? ` data-g9g="${v(it)}"` : ""}><b>${v(lt)}</b><em>${h(et, nt ?? 1)}</em></span>`;
                  },
                ).join("")}</div></div>`
              : "",
          _ = (De) => {
            const Ne = c("mundo", { g: De }).v;
            return Ne ? Ne.grupos.flatMap((_e) => _e.itens) : [];
          },
          ye = c("setores", { mk: "brazil" }).v,
          Oe =
            te(
              "Setores (B3)",
              ye ? ye.setores.map((De) => [De.nome, De.d1, 1]) : [],
              "SETORES",
            ) +
            te(
              "Commodities",
              _("cmd").map((De) => [De.n, De.d1]),
              "CMDTY",
            ) +
            te(
              "Moedas",
              _("fx").map((De) => [De.n, De.d1, 2]),
              "FX",
            ) +
            te(
              "Cripto",
              _("cri").map((De) => [
                De.n,
                (o.px["BIN:" + De.r] || {}).d1 ?? De.d1,
                1,
                De.r ? De.r.toUpperCase().replace("USDT", "USD") : "",
              ]),
              "CRYP",
            );
        return (
          ge +
          `<div class="g9mw${t(L) >= 640 ? " pc" : ""}"><div>${je}<div class="g9leg2"><i style="background:rgba(231,97,76,0.9)"></i>${Ae === "juros" ? "juro subindo" : Ae === "moeda" ? "moeda local perdendo" : "queda"} <i style="background:rgba(173,133,58,0.9)"></i>${Ae === "juros" ? "juro caindo" : Ae === "moeda" ? "moeda local ganhando" : "alta"} · toque num país</div></div>${G}</div>${Oe}<div class="trfont">TradingView (tempo real ou 15 min, conforme a bolsa) · ${ne.v ? j(ne.v.em) : ""}${Ee && Ee.fonte ? " · contornos: " + v(Ee.fonte) : ""}</div>`
        );
      },
    }),
      (r.IA =
        "Central de inteligência: dados, leitura técnica e fundamentalista, setores, notícias e cenários · IA PETR4"),
      (l.BRIEF = "IA"),
      (l.INTEL = "IA"));
    const $e = {
        PETR: "Petrobras",
        VALE: "Vale",
        ITUB: "Itaú Unibanco",
        BBAS: "Banco do Brasil",
        BBDC: "Bradesco",
        SANB: "Santander Brasil",
        BPAC: "BTG Pactual",
        WEGE: "WEG",
        PRIO: "PRIO",
        ABEV: "Ambev",
        MGLU: "Magazine Luiza",
        B3SA: "B3",
        SUZB: "Suzano",
        GGBR: "Gerdau",
        GOAU: "Gerdau",
        CSNA: "CSN",
        USIM: "Usiminas",
        EMBR: "Embraer",
        RENT: "Localiza",
        ELET: "Eletrobras",
        EQTL: "Equatorial",
        SBSP: "Sabesp",
        CMIG: "Cemig",
        CPLE: "Copel",
        RADL: "Raia Drogasil",
        RAIL: "Rumo",
        JBSS: "JBS",
        BRFS: "BRF",
        BEEF: "Minerva",
        KLBN: "Klabin",
        VIVT: "Vivo",
        TIMS: "TIM",
        LREN: "Lojas Renner",
        HAPV: "Hapvida",
        RDOR: "Rede D'Or",
        CYRE: "Cyrela",
        MRVE: "MRV",
        AZUL: "Azul",
        GOLL: "Gol",
        CSAN: "Cosan",
        UGPA: "Ultrapar",
        VBBR: "Vibra",
        BBSE: "BB Seguridade",
        CXSE: "Caixa Seguridade",
        TOTS: "Totvs",
        NTCO: "Natura",
        ASAI: "Assaí",
        CRFB: "Carrefour Brasil",
        HYPE: "Hypera",
        SLCE: "SLC Agrícola",
        CMIN: "CSN Mineração",
        BRAP: "Bradespar",
        ENEV: "Eneva",
        RECV: "PetroRecôncavo",
        ALOS: "Allos",
        IRBR: "IRB",
      },
      fe = {
        VALE: 'mineradora OR minério OR "Vale S.A." OR VALE3 OR níquel OR Samarco',
        PRIO: "petróleo OR petroleira OR PRIO3",
        B3SA: 'bolsa OR B3SA3 OR "B3 S.A."',
        GOLL: "aérea OR companhia OR GOLL4",
        AZUL: "aérea OR companhia OR AZUL4",
        VIVT: "Telefônica OR VIVT3 OR operadora",
        TIMS: "operadora OR TIMS3 OR telefonia",
        RAIL: "ferrovia OR Rumo",
        BEEF: "frigorífico",
        ALOS: "shoppings",
        ASAI: "atacarejo",
        CMIN: "mineração",
      },
      Fe =
        /a[\xe7c][\xf5o]es?\b|bolsa|ibovespa|\bb3\b|lucro|preju[\xedi]zo|receita|balan[\xe7c]o|resultado|dividend|jcp|proventos|guidance|analistas?|pre[\xe7c]o-alvo|recompra|mineradora|min[\xe9e]rio|produ[\xe7c][\xe3a]o|petr[\xf3o]leo|investidor|mercado|ebitda|d[\xedi]vida|empresa|companhia|ceo|presidente|cvm|acionista|valor de mercado/i,
      w = (q) => {
        const L = String(q).slice(0, 4),
          F = $e[L];
        return F
          ? fe[L]
            ? `${q} OR ("${F}" (${fe[L]}))`
            : `${q} OR "${F}"`
          : q;
      },
      H = (q, L) => {
        const F = String(q.t || ""),
          O = String(L).slice(0, 4),
          ne = $e[O];
        return new RegExp("\\b" + L + "\\b|\\b" + O + "(3|4|11)\\b", "i").test(
          F,
        )
          ? !0
          : !ne ||
              !new RegExp(
                "(^|[^\\wÀ-ú])" +
                  ne.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                  "(?![\\wÀ-ú-])",
                "i",
              ).test(F) ||
              (/vale[- ](refei|alimenta|transporte|g[\xe1a]s|cultura)|vale do |port vale|vale a pena/i.test(
                F,
              ) &&
                O === "VALE")
            ? !1
            : fe[O]
              ? Fe.test(F) ||
                new RegExp(
                  fe[O].replace(/"/g, "")
                    .split(/\s+OR\s+/)
                    .join("|"),
                  "i",
                ).test(F)
              : !0;
      };
    async function N(q) {
      const L = q.arg
        ? q.arg
            .split(/\s+/)[0]
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
        : "";
      if (L) {
        await Promise.all([
          d("copom", {}, 6e4),
          d("fed", {}, 3e5),
          d("macro", {}, 30 * 6e4),
          d("mundo", { g: "wei" }),
          d("fund", { tk: L }, 6e5),
          d("cot", { s: [L, "IBOV"] }, 15e3),
          d("noticias", { q: w(L) }, 18e4),
          d(
            "setores",
            { mk: /^[A-Z]{4}\d/.test(L) ? "brazil" : "america" },
            3e5,
          ),
          Xe(L, "1d"),
          Xe("IBOV", "1d"),
        ]);
        return;
      }
      (await Promise.all([
        d("copom", {}, 6e4),
        d("fed", {}, 3e5),
        d("macro", {}, 30 * 6e4),
        d("mundo", { g: "wei" }),
        d("mundo", { g: "fx" }),
        d("noticias", {}, 12e4),
        d("setores", { mk: "brazil" }, 3e5),
      ]),
        await ke());
    }
    function W(q) {
      const L = Ye(q, "1d");
      if (!L || L.L.length < 30) return null;
      const F = Ke(q),
        O = Ve(L.L, F);
      if (!O) return null;
      const ne = L.L.map((ge) => ge[4]),
        Ee = (ge) =>
          ne.length > ge
            ? +((O.px / ne[ne.length - 1 - ge] - 1) * 100).toFixed(2)
            : null,
        Ae = (ge) => (ge == null ? null : +(+ge).toFixed(2));
      return {
        ativo: q,
        fonte:
          "velas diárias do Yahoo" + (F ? " + preço ao vivo do Profit" : ""),
        dado_em: new Date(L.L[L.L.length - 1][0] * 1e3)
          .toISOString()
          .slice(0, 10),
        preco: Ae(O.px),
        tendencia: O.tend,
        mm9: Ae(O.m9),
        mm20: Ae(O.m20),
        mm50: Ae(O.m50),
        mm200: Ae(O.m200),
        rsi14: O.rsi != null ? +O.rsi.toFixed(1) : null,
        atr14: Ae(O.atr),
        atr_pct: O.atrPct != null ? +O.atrPct.toFixed(2) : null,
        suportes: O.sr.sup.map((ge) => Ae(ge.v)),
        resistencias: O.sr.res.map((ge) => Ae(ge.v)),
        fibonacci: O.fb
          ? {
              direcao: O.fb.sobe ? "retração de alta" : "retração de baixa",
              topo: Ae(O.fb.hi),
              fundo: Ae(O.fb.lo),
              n38: Ae(O.fb.niv[2].v),
              n50: Ae(O.fb.niv[3].v),
              n62: Ae(O.fb.niv[4].v),
            }
          : null,
        maxima_52s: Ae(O.h52),
        minima_52s: Ae(O.l52),
        retorno_1m_pct: Ee(21),
        retorno_3m_pct: Ee(63),
        retorno_12m_pct: Ee(250),
        eventos: O.ev.map(
          (ge) =>
            ge.t + (ge.b ? ` (há ${ge.b} vela${ge.b > 1 ? "s" : ""})` : ""),
        ),
        perto_de: O.perto.map(
          (ge) => `${ge.tipo} ${g(ge.v)} (${h(ge.dist, 1)})`,
        ),
      };
    }
    function Te(q) {
      const L = c("copom").v,
        F = c("fed").v,
        O = c("macro").v,
        ne = c("mundo", { g: "wei" }).v,
        Ee = q ? null : c("mundo", { g: "fx" }).v,
        Ae = (q ? c("noticias", { q: w(q) }) : c("noticias")).v,
        ge = c("setores", {
          mk: q && !/^[A-Z]{4}\d/.test(q) ? "america" : "brazil",
        }).v,
        je = q ? c("fund", { tk: q }).v : null,
        Ze = [],
        He = new Set();
      [ne, Ee].forEach((Ne) => {
        Ne &&
          Ne.grupos.forEach((_e) =>
            _e.itens.slice(0, 4).forEach((lt) => {
              if (lt.px != null && !He.has(lt.n) && He.add(lt.n)) {
                const et = m(
                  String(lt.s || "").startsWith("BMFBOVESPA:")
                    ? lt.s.split(":")[1]
                    : lt.s,
                  { ...lt, _em: Date.parse(Ne.em) },
                );
                Ze.push({
                  n: lt.n,
                  px: +(+et.px).toFixed(4),
                  d1: et.d1 != null ? +(+et.d1).toFixed(2) : null,
                  fonte: et.fonte,
                  dado_em: et.ts ? new Date(et.ts).toISOString() : null,
                  atraso: !et.rt,
                });
              }
            }),
          );
      });
      const ce = (q ? [] : ve())
          .map((Ne) => {
            const _e = ze(Ne),
              lt = Ye(Ne, "1d"),
              et =
                lt && lt.L.length
                  ? new Date(lt.L[lt.L.length - 1][0] * 1e3)
                      .toISOString()
                      .slice(0, 10)
                  : null;
            return _e
              ? {
                  ativo: Ne,
                  dado_em: et,
                  fonte_preco: (m(Ne, {}) || {}).fonte,
                  px: +_e.px.toFixed(2),
                  tendencia: _e.tend,
                  rsi: _e.rsi != null ? +_e.rsi.toFixed(0) : null,
                  mm50: _e.m50 != null ? +_e.m50.toFixed(2) : null,
                  mm200: _e.m200 != null ? +_e.m200.toFixed(2) : null,
                  suporte: _e.sr.sup[0] ? +_e.sr.sup[0].v.toFixed(2) : null,
                  resistencia: _e.sr.res[0] ? +_e.sr.res[0].v.toFixed(2) : null,
                  eventos: _e.ev.map((nt) => nt.t),
                }
              : null;
          })
          .filter(Boolean),
        E = Ae
          ? q
            ? Ae.itens
                .filter((Ne) => H(Ne, q))
                .sort((Ne, _e) => (Ne.d < _e.d ? 1 : -1))
                .slice(0, 15)
                .map((Ne) => ({ ...Ne, r: pe(Ne) }))
            : Ae.itens
                .map((Ne) => ({ ...Ne, r: pe(Ne) }))
                .sort((Ne, _e) => _e.r - Ne.r || (Ne.d < _e.d ? 1 : -1))
                .slice(0, 10)
          : [],
        P = q ? W(q) : null,
        B = q ? W("IBOV") : null,
        G = je && je.tv ? je.tv.sector : null,
        te = ge && G ? ge.setores.find((Ne) => Ne.setor === G) : null,
        _ = q
          ? m(
              q,
              ((c("cot", { s: [q, "IBOV"] }).v || {}).itens || []).find(
                (Ne) => Ne.pedido === q,
              ) || {},
            )
          : null,
        ye = (je && je.yahoo) || {},
        Oe =
          je && je.balancos && je.balancos.anos && je.balancos.anos.length
            ? je.balancos.anos[je.balancos.anos.length - 1]
            : null,
        De = je
          ? {
              ativo: q,
              setor: (je.tv || {}).sector || null,
              preco: (je.tv || {}).close ?? null,
              pl: (je.tv || {}).price_earnings_ttm ?? null,
              pvp: (je.tv || {}).price_book_ratio ?? null,
              dy: (je.tv || {}).dividend_yield_recent ?? null,
              roe: (je.tv || {}).return_on_equity ?? null,
              alvo_medio: ((je.yahoo || {}).analistas || {}).alvo_medio ?? null,
              analistas: ((je.yahoo || {}).analistas || {}).n ?? null,
              kanitz:
                je.balancos && je.balancos.anos && je.balancos.anos.length
                  ? je.balancos.anos[je.balancos.anos.length - 1].kanitz
                  : null,
              alertas_balanco: je.balancos ? je.balancos.alertas : [],
              fonte: "TradingView e Yahoo",
            }
          : null;
      return {
        gerado: new Date().toISOString(),
        foco: q || null,
        ativo: q
          ? {
              codigo: q,
              preco: _ && _.px != null ? +(+_.px).toFixed(2) : null,
              var_dia_pct: _ && _.d1 != null ? +(+_.d1).toFixed(2) : null,
              fonte: _ ? _.fonte : null,
              dado_em: _ && _.ts ? new Date(_.ts).toISOString() : null,
              atraso: _ ? !_.rt : null,
              tecnico: P,
              ibov_tecnico: B
                ? {
                    tendencia: B.tendencia,
                    retorno_1m_pct: B.retorno_1m_pct,
                    rsi14: B.rsi14,
                    eventos: B.eventos,
                  }
                : null,
              setor: te
                ? {
                    nome: te.nome,
                    dia: te.d1,
                    semana: te.sem,
                    mes: te.mes,
                    ano: te.ano,
                    lideres: te.lideres,
                    fonte: "TradingView",
                  }
                : null,
              pares:
                je && je.pares
                  ? je.pares
                      .filter((Ne) => !/\d{1,2}F$/.test(String(Ne.s)))
                      .slice(0, 8)
                      .map((Ne) => ({
                        ativo: String(Ne.s).split(":").pop(),
                        pl: Ne.pl,
                        pvp: Ne.pvp,
                        dy: Ne.dy,
                        roe: Ne.roe,
                        ev_ebitda: Ne.ev_ebitda,
                        margem: Ne.ml,
                      }))
                  : null,
              analistas: ye.analistas || null,
              resultados: (ye.resultados || []).slice(0, 4),
              projecoes: ye.projecoes || null,
              proventos: ye.proventos || null,
              proximo_resultado: (ye.eventos || {}).resultado || null,
              balanco_ultimo_ano: Oe
                ? {
                    ano: Oe.ano,
                    receita: Oe.receita,
                    lucro_liquido: Oe.lucro_liquido,
                    liquidez: Oe.liquidez,
                    endividamento: Oe.endividamento,
                    rentabilidade: Oe.rentabilidade,
                    kanitz: Oe.kanitz,
                  }
                : null,
              alertas_balanco: je && je.balancos ? je.balancos.alertas : null,
              perfil: ye.perfil
                ? {
                    setor: ye.perfil.setor,
                    industria: ye.perfil.industria,
                    resumo: String(ye.perfil.resumo || "").slice(0, 500),
                  }
                : null,
            }
          : null,
        qualidade:
          typeof window.trDqResumo == "function" ? window.trDqResumo() : null,
        macro: {
          fonte: "Banco Central, curva de DI1 e futuros de fed funds",
          dado_em: L ? L.em : null,
          selic: L ? L.selic : null,
          cdi: L ? L.cdi : null,
          copom: L
            ? L.reunioes
                .slice(0, 3)
                .map((Ne) => ({
                  reuniao: Ne.decisao,
                  mov_pb_implicito: Ne.mov_pb,
                  selic_esperada: Ne.selic_esperada,
                  probabilidades: Ne.probs,
                }))
            : null,
          fed: F
            ? {
                faixa: F.faixa,
                efetiva: F.efetiva,
                reunioes: F.reunioes
                  .slice(0, 3)
                  .map((Ne) => ({
                    reuniao: Ne.decisao,
                    mov_pb_implicito: Ne.mov_pb,
                    probabilidades: Ne.probs,
                  })),
              }
            : null,
          focus: O && O.focus ? O.focus.itens : null,
          paises: O
            ? O.paises.map((Ne) => ({
                pais: Ne.nome,
                itens: Ne.itens
                  .filter((_e) => _e.atual != null)
                  .map((_e) => ({
                    n: _e.nome,
                    atual: _e.atual,
                    anterior: _e.anterior,
                    periodo: _e.periodo,
                  })),
              }))
            : null,
        },
        mercados: Ze.length ? { fonte: "TradingView", itens: Ze } : null,
        setores:
          ge && !q
            ? {
                fonte: "TradingView",
                itens: ge.setores.map((Ne) => ({
                  setor: Ne.nome,
                  dia: Ne.d1,
                  semana: Ne.sem,
                  mes: Ne.mes,
                })),
              }
            : null,
        tecnico: ce.length
          ? {
              fonte: "calculado pelo app com candles diários (Yahoo)",
              itens: ce,
            }
          : null,
        fundamentos: De,
        noticias:
          E.length || (q && Ae)
            ? {
                fonte: q
                  ? "manchetes sobre " + q + " (Google Notícias, só título)"
                  : "manchetes (só título)",
                itens: E.map((Ne) => ({
                  titulo: Ne.t,
                  fonte: Ne.f,
                  hora: j(Ne.d),
                  publicada_em: Ne.d,
                  relevancia: Ne.r,
                })),
              }
            : null,
      };
    }
    n.IA = {
      livre: !0,
      load: N,
      body: (q, L) => {
        const F = q.arg
            ? q.arg
                .split(/\s+/)[0]
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
            : "",
          O = Te(F),
          ne = "ia|" + F,
          Ee = o.ia[ne],
          Ae = (ce, E) => `<span class="g9tag ${ce}">${E}</span>`,
          ge = O.macro,
          je = ge.copom && ge.copom[0],
          Ze = ge.fed && ge.fed.reunioes && ge.fed.reunioes[0];
        let He = `<div class="g9ia"><div class="g9iah"><b>CENTRAL DE INTELIGÊNCIA</b>${F ? ` · ${v(F)}` : ""}<span class="mut"> · ${Ae("ok", "DADO")} vem das fontes · ${Ae("in", "LEITURA")} é interpretação · ${Ae("ce", "CENÁRIO")} é condicional, não previsão</span></div>`;
        if (
          ((He += `<div class="trsec">${Ae("ok", "DADO")} Cenário econômico</div><div class="trkv">${ge.selic != null ? `<span>Selic <b>${g(ge.selic)}%</b></span>` : ""}${je ? `<span>Próximo Copom (${k(je.reuniao + "T12:00:00Z")}) <b class="${b(-je.mov_pb_implicito)}">${je.mov_pb_implicito > 0 ? "+" : ""}${je.mov_pb_implicito} pb</b> implícitos · ${je.probabilidades.map((ce) => `${ce.mov_pb > 0 ? "+" : ""}${ce.mov_pb}: ${g(ce.p, 0)}%`).join(" / ")}</span>` : ""}${ge.fed ? `<span>Fed ${g(ge.fed.faixa[0])}–${g(ge.fed.faixa[1])}%${Ze ? ` · próxima ${Ze.mov_pb_implicito > 0 ? "+" : ""}${Ze.mov_pb_implicito} pb` : ""}</span>` : ""}${(
            ge.focus || []
          )
            .filter((ce) => ce.ind === "IPCA")
            .slice(0, 1)
            .map((ce) => `<span>Focus IPCA ${ce.ref} <b>${g(ce.v)}%</b></span>`)
            .join("")}</div>`),
          O.ativo)
        ) {
          const ce = O.ativo,
            E = ce.tecnico;
          ((He = He.replace(
            "Cenário econômico",
            "Cenário econômico (contexto)",
          )),
            (He += `<div class="trsec">${Ae("ok", "DADO")} ${v(F)} agora</div><div class="trkv"><span>Preço <b>${g(ce.preco)}</b></span><span>Dia <b class="${b(ce.var_dia_pct)}">${h(ce.var_dia_pct)}</b></span><span class="mut">${v(ce.fonte || "")}${ce.dado_em ? " · " + j(ce.dado_em) : ""}${ce.atraso ? " · atrasado" : ""}</span></div>`),
            E &&
              (He += `<div class="trsec">${Ae("ok", "DADO")} Técnico de ${v(F)} (calculado)</div><div class="trkv"><span>Tendência <b class="${{ alta: "tg", baixa: "tr", lateral: "am" }[E.tendencia]}">${E.tendencia}</b></span><span>MM20 <b>${g(E.mm20)}</b></span><span>MM50 <b>${g(E.mm50)}</b></span><span>MM200 <b>${g(E.mm200)}</b></span><span>RSI <b>${g(E.rsi14, 0)}</b></span><span>ATR <b>${g(E.atr14)}</b> (${g(E.atr_pct, 1)}%)</span><span>Suportes <b>${E.suportes.map((P) => g(P)).join(" · ") || "—"}</b></span><span>Resistências <b>${E.resistencias.map((P) => g(P)).join(" · ") || "—"}</b></span><span>1 mês <b class="${b(E.retorno_1m_pct)}">${h(E.retorno_1m_pct, 1)}</b></span><span>12 meses <b class="${b(E.retorno_12m_pct)}">${h(E.retorno_12m_pct, 1)}</b></span></div>${E.eventos.length ? `<div class="g9li">${E.eventos.map(v).join(" · ")}</div>` : ""}${E.perto_de.length ? `<div class="g9li am">Perto de: ${E.perto_de.map(v).join(" · ")}</div>` : ""}`),
            ce.setor &&
              (He += `<div class="trsec">${Ae("ok", "DADO")} Setor: ${v(ce.setor.nome)}</div><div class="trkv"><span>Dia <b class="${b(ce.setor.dia)}">${h(ce.setor.dia)}</b></span><span>Semana <b class="${b(ce.setor.semana)}">${h(ce.setor.semana, 1)}</b></span><span>Mês <b class="${b(ce.setor.mes)}">${h(ce.setor.mes, 1)}</b></span><span>Ano <b class="${b(ce.setor.ano)}">${h(ce.setor.ano, 1)}</b></span>${(ce.pares || []).length ? `<span>Pares <b>${ce.pares.map((P) => P.ativo).join(", ")}</b> <button class="trlk" data-trcmd="${v(F)} RV">comparar</button></span>` : ""}</div>`));
        } else
          O.mercados &&
            (He += `<div class="trkv">${O.mercados.itens
              .slice(0, 8)
              .map(
                (ce) =>
                  `<span>${v(ce.n)} <b class="${b(ce.d1)}">${h(ce.d1)}</b></span>`,
              )
              .join("")}</div>`);
        if (O.tecnico) {
          const ce = O.tecnico.itens,
            E = ce.filter((P) => P.eventos.length);
          He +=
            `<div class="trsec">${Ae("ok", "DADO")} Técnico do seu monitor (calculado)</div><div class="trkv">${[
              "alta",
              "lateral",
              "baixa",
            ]
              .map(
                (P) =>
                  `<span>${P} <b class="${{ alta: "tg", baixa: "tr", lateral: "am" }[P]}">${
                    ce
                      .filter((B) => B.tendencia === P)
                      .map((B) => B.ativo)
                      .join(", ") || "—"
                  }</b></span>`,
              )
              .join("")}</div>` +
            (E.length
              ? `<div class="trsec">${Ae("ok", "DADO")} Sinais de mudança de tendência</div>` +
                E.map(
                  (P) =>
                    `<div class="g9li" data-g9g="${v(P.ativo)}"><b class="tk">${v(P.ativo)}</b> ${P.eventos.map(v).join(" · ")}</div>`,
                ).join("")
              : '<div class="trnote">Nenhum cruzamento de médias, rompimento da MM200 ou saída de RSI extremo nos últimos 3 pregões.</div>');
        }
        if (O.setores) {
          const ce = O.setores.itens;
          He += `<div class="trsec">${Ae("ok", "DADO")} Setores hoje</div><div class="trkv">${(ce.length <= 6 ? ce : ce.slice(0, 3).concat(ce.slice(-3))).map((E) => `<span>${v(E.setor)} <b class="${b(E.dia)}">${h(E.dia)}</b></span>`).join("")} <button class="trlk" data-trcmd="SETORES">todos</button></div>`;
        }
        if (O.fundamentos) {
          const ce = O.fundamentos;
          He += `<div class="trsec">${Ae("ok", "DADO")} Fundamentos de ${v(F)}</div><div class="trkv"><span>P/L <b>${g(ce.pl, 1)}</b></span><span>P/VPA <b>${g(ce.pvp, 2)}</b></span><span>DY <b>${ce.dy != null ? g(ce.dy, 1) + "%" : "—"}</b></span><span>ROE <b>${ce.roe != null ? g(ce.roe, 1) + "%" : "—"}</b></span><span>Alvo médio <b>${g(ce.alvo_medio)}</b> (${g(ce.analistas, 0)} analistas)</span>${ce.kanitz != null ? `<span>Kanitz <b>${g(ce.kanitz, 2)}</b></span>` : ""}</div>`;
        }
        if (
          (O.noticias &&
            (He +=
              `<div class="trsec">${Ae("ok", "DADO")} ${F ? "Notícias sobre " + v(F) : "Notícias mais relevantes"}</div>` +
              (O.noticias.itens.length
                ? ""
                : `<div class="trnote">Nenhuma manchete sobre ${v(F)} agora (as que só citavam o nome em outro sentido foram descartadas).</div>`) +
              O.noticias.itens
                .slice(0, F ? 10 : 6)
                .map(
                  (ce) =>
                    `<div class="g9li"><span class="g9st">${"★".repeat(ce.relevancia)}</span> ${v(ce.titulo)} <em class="am">${v(ce.fonte)} ${v(ce.hora)}</em></div>`,
                )
                .join("")),
          (He += `<div class="g9iab"><button class="trbtn on" data-g9="iagera|${v(F)}|${L}">${Ee && Ee.v ? "Gerar de novo" : "Gerar leitura da IA"}</button><span class="mut">${F ? "Relatório completo sobre " + v(F) + " (técnico, fundamentos, setor, pares, notícias e cenários). " : ""}A IA recebe só os dados acima e separa o que é dado, leitura e cenário. Números que ela citar e que não estão nos dados são marcados como leitura.</span></div>`),
          Ee &&
            Ee.busy &&
            (He +=
              '<div class="trload">A IA está lendo os dados (até 1 min)…</div>'),
          Ee && Ee.err && (He += C(Ee.err)),
          Ee && Ee.v)
        ) {
          const ce = Ee.v;
          He += `<div class="g9iar"><div class="trsec">Leitura da IA · ${j(ce.gerado || Ee.ts)}</div>${ce.resumo ? `<p>${v(ce.resumo)}</p>` : ""}
    ${ce.confirmados.length ? `<div class="trsec">${Ae("ok", "DADO")} confirmado nos dados</div>` + ce.confirmados.map((E) => `<div class="g9li">${v(E.fato)} <em class="mut">${v(E.fonte)}</em></div>`).join("") : ""}
    ${ce.interpretacoes.length ? `<div class="trsec">${Ae("in", "LEITURA")} interpretação</div>` + ce.interpretacoes.map((E) => `<div class="g9li">${v(E.texto)}${E.base ? ` <em class="mut">base: ${v(E.base)}</em>` : ""}</div>`).join("") : ""}
    ${
      ce.tecnico.length
        ? `<div class="trsec">${Ae("in", "LEITURA")} técnica</div>` +
          A(
            ["Ativo", "Tendência", "Mudança", "Leitura"],
            ce.tecnico.map(
              (E) =>
                `<tr><td class="tk">${v(E.ativo)}</td><td class="${{ alta: "tg", baixa: "tr", lateral: "am" }[E.tendencia]}">${E.tendencia}</td><td>${v(E.mudanca || "—")}</td><td style="white-space:normal">${v(E.leitura)}</td></tr>`,
            ),
          )
        : ""
    }
    ${ce.fundamentos ? `<div class="trsec">${Ae("in", "LEITURA")} fundamentalista</div><p>${v(ce.fundamentos)}</p>` : ""}
    ${ce.setores.length ? `<div class="trsec">${Ae("in", "LEITURA")} setores</div>` + ce.setores.map((E) => `<div class="g9li"><b>${v(E.setor)}</b> ${v(E.leitura)}</div>`).join("") : ""}
    ${ce.noticias.length ? `<div class="trsec">${Ae("in", "LEITURA")} notícias</div>` + ce.noticias.map((E) => `<div class="g9li"><b>${v(E.titulo)}</b> ${v(E.por_que_importa)}</div>`).join("") : ""}
    <div class="trsec">${Ae("ce", "CENÁRIO")} condicionais</div><div class="g9cen">${[
      ["otimista", "Otimista", "tg"],
      ["neutro", "Neutro", "am"],
      ["pessimista", "Pessimista", "tr"],
    ]
      .map(([E, P, B]) => {
        const G = ce.cenarios[E] || {};
        return `<div class="g9cc"><b class="${B}">${P}</b><p>${v(G.descricao || "—")}</p>${(G.gatilhos || []).length ? `<div class="mut">Gatilhos: ${G.gatilhos.map(v).join(" · ")}</div>` : ""}${G.invalida ? `<div class="mut">Invalida: ${v(G.invalida)}</div>` : ""}</div>`;
      })
      .join("")}</div>
    ${ce.riscos.length ? '<div class="trsec">Riscos</div>' + ce.riscos.map((E) => `<div class="g9li">${v(E)}</div>`).join("") : ""}${ce.acompanhar.length ? '<div class="trsec">O que acompanhar</div>' + ce.acompanhar.map((E) => `<div class="g9li">${v(E)}</div>`).join("") : ""}${ce.lacunas.length ? `<div class="trfont">Faltou: ${ce.lacunas.map(v).join(" · ")}</div>` : ""}
    <div class="trfont">Gerado por IA a partir dos dados do terminal. Cenários não são previsão nem recomendação de compra ou venda.</div></div>`;
        }
        return He + "</div>";
      },
    };
    async function V(q, L) {
      const F = "ia|" + q;
      ((o.ia[F] = { ...(o.ia[F] || {}), busy: 1, err: "" }), J(L));
      try {
        const O = await anxCall({ modo: "central", contexto: Te(q) });
        if (O.erro) throw new Error(O.erro);
        o.ia[F] = { v: O, ts: Date.now() };
      } catch (O) {
        o.ia[F] = { ...(o.ia[F] || {}), busy: 0, err: String(O.message || O) };
      }
      Pe().p.forEach((O, ne) => {
        /^(IA|BRIEF|INTEL)\b/i.test(O) && J(ne);
      });
    }
    ((r.STAT =
      "Fontes e atualização: o que está em tempo real, atrasado ou com falha"),
      (l.FONTES = "STAT"),
      (l.STATUS = "STAT"));
    const ae = (q) => {
        if (!q) return "—";
        const L = Math.round((Date.now() - q) / 1e3);
        return L < 60
          ? L + " s"
          : L < 3600
            ? Math.round(L / 60) + " min"
            : Math.round(L / 3600) + " h";
      },
      ee = () => {
        const q = new Date(),
          L = q.getDay(),
          F = q.getHours() + q.getMinutes() / 60;
        return L > 0 && L < 6 && F >= 9 && F < 18.5;
      };
    n.STAT = {
      vivo: !0,
      load: () =>
        Promise.all([
          d("copom", {}, 6e4),
          d("fed", {}, 3e5),
          d("titulos", {}, 3e5),
          d("agenda", {}, 6e4),
          d("noticias", {}, 12e4),
          Xe("PETR4", "1d"),
        ]),
      body: (q, L) => {
        const F = t(L) < 600,
          O = o.pf,
          ne = O.todas || [],
          Ee = ne.length ? Math.max(...ne.map((tt) => tt.up)) : 0,
          Ae = o.fst,
          ge = (tt, ut) => `<span class="g9dot ${tt}"></span>${ut}`,
          je = Object.entries(Ae).filter(([tt]) => tt.startsWith("srv:")),
          Ze = je.length ? Math.max(...je.map(([, tt]) => tt.ts)) : 0,
          He = je.filter(([, tt]) => !tt.ok),
          ce = je.length
            ? Math.round(
                je.reduce((tt, [, ut]) => tt + (ut.ms || 0), 0) / je.length,
              )
            : null,
          E = (tt) => c(tt).v,
          P = (c("titulos").v || {}).tesouro_erro,
          B = c("noticias").v,
          G = c("agenda").v,
          te = o.ws,
          _ = o.fh,
          ye = [
            [
              "Ponte do Profit (B3)",
              SESS
                ? O.err
                  ? ge("vm", "erro: " + O.err)
                  : ne.length
                    ? Date.now() - Ee < 12e4
                      ? ge(
                          "vd",
                          `ao vivo · ${Object.keys(o.profit).length} ativos`,
                        )
                      : Date.now() - Ee < 10 * 6e4
                        ? ge("am", "parada há " + ae(Ee))
                        : ge(
                            ee() ? "vm" : "cz",
                            ee()
                              ? "parada (PC ou Profit desligado?)"
                              : "fora do pregão",
                          )
                    : ge("cz", "sem dados")
                : ge("cz", "entre na conta"),
              ae(Ee),
              O.ms != null ? O.ms + " ms" : "—",
              "tempo real (pelo seu PC)",
              "prioridade 1 para ativos da B3",
            ],
            [
              "Servidor do terminal",
              He.length
                ? ge("am", He.length + " ação(ões) com falha")
                : je.length
                  ? ge("vd", "ok")
                  : ge("cz", "sem chamadas ainda"),
              ae(Ze),
              ce != null ? ce + " ms" : "—",
              "cache de 15 s a 30 min",
              He.map(([tt, ut]) => tt.slice(4) + ": " + ut.err).join(" · "),
            ],
            [
              "TradingView (via servidor)",
              je.length
                ? ge(
                    He.some(([tt]) => /cot|mundo|most/.test(tt)) ? "am" : "vd",
                    "ok",
                  )
                : ge("cz", "—"),
              ae(
                Math.max(
                  ...["srv:cot", "srv:mundo", "srv:most"].map(
                    (tt) => (Ae[tt] || {}).ts || 0,
                  ),
                ),
              ),
              "—",
              "tempo real ou 15 min, por ativo",
              "prioridade 2 (quando o Profit está fechado)",
            ],
            [
              "Gráficos (Yahoo)",
              Ae.candles
                ? ge(
                    Ae.candles.ok ? "vd" : "vm",
                    Ae.candles.ok ? "ok" : "falha",
                  )
                : ge("cz", "—"),
              ae((Ae.candles || {}).ts),
              Ae.candles && Ae.candles.ms != null ? Ae.candles.ms + " ms" : "—",
              "velas com até 15 min",
              "a última vela usa o preço do Profit quando ele está ligado",
            ],
            [
              "Binance (cripto)",
              te
                ? ge(
                    te.readyState === 1 ? "vd" : "am",
                    te.readyState === 1 ? "conectado" : "conectando…",
                  )
                : ge("vm", "não conectou"),
              ae(
                Object.entries(o.px)
                  .filter(([tt]) => tt.startsWith("BIN:"))
                  .map(([, tt]) => tt.ts)
                  .sort()
                  .pop(),
              ),
              "—",
              "tempo real",
              te && te.readyState === 1
                ? ""
                : "Liga sozinho com o terminal aberto. Se não conectar: suba o index.html da v267/v268 (ele libera a Binance) ou a sua rede bloqueia o site.",
            ],
            [
              "Finnhub (ações dos EUA)",
              s().fh
                ? window.trFhErro(s().fh)
                  ? ge("vm", "chave errada")
                  : o.fhRecusa
                    ? ge("vm", "chave recusada pelo Finnhub")
                    : _
                      ? ge(
                          _.readyState === 1 ? "vd" : "am",
                          _.readyState === 1 ? "conectado" : "conectando…",
                        )
                      : ge("cz", "desligado")
                : ge("cz", "sem chave"),
              ae(
                Object.entries(o.px)
                  .filter(([tt]) => tt.startsWith("FH:"))
                  .map(([, tt]) => tt.ts)
                  .sort()
                  .pop(),
              ),
              "—",
              "tempo real (só ações dos EUA no MON)",
              "__FH__",
            ],
            [
              "Banco Central e DI (Copom)",
              E("copom")
                ? ge("vd", "ok")
                : c("copom").err
                  ? ge("vm", c("copom").err)
                  : ge("cz", "—"),
              ae(c("copom").ts),
              "—",
              "diário (DI com 15 min)",
              "",
            ],
            [
              "Tesouro Direto",
              c("titulos").v
                ? ge(P ? "am" : "vd", P ? "site não respondeu" : "ok")
                : ge("cz", "—"),
              ae(c("titulos").ts),
              "—",
              "várias vezes ao dia",
              P || "",
            ],
            [
              "Agenda econômica",
              G ? ge(G.aviso ? "am" : "vd", G.fonte) : ge("cz", "—"),
              ae(c("agenda").ts),
              "—",
              "resultado no minuto",
              (G && G.aviso) || "",
            ],
            [
              "Notícias",
              B
                ? ge(
                    B.falharam && B.falharam.length ? "am" : "vd",
                    `${(B.fontes || []).length} fontes`,
                  )
                : ge("cz", "—"),
              ae(c("noticias").ts),
              "—",
              "minutos (só manchete)",
              B && B.falharam && B.falharam.length
                ? "fora do ar: " + B.falharam.join(", ")
                : "",
            ],
          ],
          Oe = window.trFhErro(s().fh || ""),
          De = `<span class="g9fh">${Oe ? `<b class="tr">${v(Oe)}</b> ` : s().fh ? (o.fhRecusa ? '<b class="tr">O Finnhub recusou a chave: confira se copiou inteira.</b> ' : "Chave salva. Ela só é usada para ações dos EUA que estejam no MON. ") : "Crie a chave grátis em finnhub.io (Get free API key) e cole aqui:"}<input class="trin" id="g9fhk" value="${v(s().fh || "")}" placeholder="chave do Finnhub"><button class="trbtn" data-g9="fhk||${L}">Salvar</button></span>`,
          Ne = (tt) => (tt[5] === "__FH__" ? De : v(tt[5])),
          _e = F
            ? `<div class="g9cards">${ye.map((tt) => `<div class="g9card"><div class="g9c1"><b>${tt[0]}</b><span>${tt[1]}</span></div><div class="g9c2">última ${tt[2]} · ${tt[3]} · ${tt[4]}</div>${tt[5] ? `<div class="g9c3">${Ne(tt)}</div>` : ""}</div>`).join("")}</div>`
            : A(
                ["Fonte", "Estado", "Última", "Latência", "Modo", "Observação"],
                ye.map(
                  (tt) =>
                    `<tr><td><b>${tt[0]}</b></td><td>${tt[1]}</td><td class="num">${tt[2]}</td><td class="num">${tt[3]}</td><td class="mut">${tt[4]}</td><td class="mut" style="white-space:normal">${Ne(tt)}</td></tr>`,
                ),
                "fontes",
              ),
          lt = Object.entries(o.src)
            .filter(([, tt]) => Date.now() - tt.em < 10 * 6e4)
            .sort(
              (tt, ut) =>
                (ut[1].falha ? 1 : 0) - (tt[1].falha ? 1 : 0) ||
                (tt[1].rt ? 1 : 0) - (ut[1].rt ? 1 : 0),
            ),
          et = (tt) =>
            tt.falha
              ? "o servidor não achou cotação para este símbolo agora"
              : "",
          nt = lt.length
            ? F
              ? `<div class="g9cards">${lt
                  .slice(0, 60)
                  .map(
                    ([tt, ut]) =>
                      `<div class="g9card g9ca"><b class="tk">${v(tt.replace(/^.*:/, ""))}</b><span class="num">${g(ut.px)}</span>${f(ut)}<span class="mut">${v(ut.fonte)} · ${ut.ts ? ae(ut.ts) : "—"}</span>${ut.falha ? `<div class="g9c3 tr">${et(ut)}</div>` : ""}</div>`,
                  )
                  .join("")}</div>`
              : A(
                  ["Ativo", "Fonte usada", "Último", "Idade", "Modo", ""],
                  lt
                    .slice(0, 60)
                    .map(
                      ([tt, ut]) =>
                        `<tr><td class="tk">${v(tt.replace(/^.*:/, ""))}</td><td>${v(ut.fonte)}</td><td class="num">${g(ut.px)}</td><td class="num">${ut.ts ? ae(ut.ts) : "—"}</td><td>${f(ut)}</td><td class="mut tr">${et(ut)}</td></tr>`,
                    ),
                  "ativos",
                )
            : '<div class="trnote">Abra um monitor (MON, WEI…) para listar os ativos.</div>',
          it = ne
            .filter((tt) => Date.now() - tt.up > 12e4)
            .sort((tt, ut) => tt.up - ut.up)
            .slice(0, 20),
          xt =
            it.length && ee()
              ? `<div class="trsec">Ativos da ponte sem atualização há mais de 2 min</div><div class="trkv">${it.map((tt) => `<span>${v(tt.tk)} <b class="am">${ae(tt.up)}</b></span>`).join("")}</div>`
              : "",
          bt = o.log.length
            ? o.log
                .slice(0, 30)
                .map(
                  (tt) =>
                    `<div class="g9log"><span class="num mut">${new Date(tt.ts).toLocaleTimeString("pt-BR")}</span><span class="g9dot ${tt.ok ? "vd" : "vm"}"></span><b>${v(tt.fonte)}</b> ${v(tt.msg)}</div>`,
                )
                .join("")
            : '<div class="trnote">Nenhuma mudança registrada ainda.</div>';
        return (
          `<div class="g9bar"><button class="g9b" data-g9="stest||${L}">Testar conexões agora</button><span class="mut" style="margin-left:6px">Regra: Profit ao vivo → Binance/Finnhub → TradingView. Cada preço mostra a etiqueta da fonte.</span></div>` +
          _e +
          xt +
          '<div class="trsec">Ativos na tela</div>' +
          nt +
          '<div class="trsec">Histórico de atualizações e falhas</div>' +
          bt
        );
      },
    };
    const le = [
      ["IBOV", "BMFBOVESPA:IBOV", 0, "IBOV"],
      ["Dólar", "FX_IDC:USDBRL", 4, "USDBRL"],
      ["S&P 500", "SP:SPX", 2, "SPX"],
      ["Nasdaq", "NASDAQ:NDX", 2, "NDX"],
      ["Bitcoin", "BINANCE:BTCUSDT", 0, "BTCUSD"],
      ["Brent", "TVC:UKOIL", 2, ""],
      ["DXY", "TVC:DXY", 2, ""],
      ["Treasury 10a", "TVC:US10Y", 3, ""],
      ["DI jan/27", "BMFBOVESPA:DI1F2027", 3, ""],
    ];
    (setInterval(() => {
      try {
        if (tab === "term" && !document.hidden) {
          a(["btcusdt"], "base");
          const q = document.getElementById("trtape");
          if (q && innerWidth < 980 && Date.now() > (o.tapeP || 0)) {
            q.scrollLeft += 1;
            const L = q.scrollWidth / 2;
            q.scrollLeft >= L && (q.scrollLeft -= L);
          }
        }
      } catch {}
    }, 40),
      document.addEventListener(
        "pointerdown",
        (q) => {
          q.target.closest &&
            q.target.closest("#trtape") &&
            (o.tapeP = Date.now() + 5e3);
        },
        !0,
      ),
      (window.trTapeHtml = function () {
        const q = le.map((ne) => ne[1]),
          L = c("cot", { s: q });
        if (
          (!L.v && !L.busy && Date.now() - (o.tapeT || 0) > 2e4
            ? ((o.tapeT = Date.now()), d("cot", { s: q }, 2e4))
            : L.v &&
              Date.now() - L.ts > 2e4 &&
              !L.busy &&
              d("cot", { s: q }, 2e4),
          !L.v)
        )
          return '<span class="mut">carregando cotações…</span>';
        const F = Date.parse(L.v.em),
          O = le
            .map(([ne, Ee, Ae, ge]) => {
              const je = L.v.itens.find((He) => He.pedido === Ee) || {},
                Ze = m(
                  Ee.startsWith("BMFBOVESPA:") ? Ee.split(":")[1] : Ee,
                  { ...je, _em: F },
                  Ee === "BINANCE:BTCUSDT" ? "btcusdt" : null,
                );
              return `<span${ge ? ` data-trcmd="${ge} G"` : ""}><em>${v(ne)}</em><b>${g(Ze.px, Ae)}</b><i class="${b(Ze.d1)}">${h(Ze.d1)}</i>${f(Ze)}</span>`;
            })
            .join("");
        return innerWidth < 980 ? O + '<span class="g9sep2"></span>' + O : O;
      }),
      (window.TRM.tec = {
        chartView(q, L, F, O) {
          if (["scale", "priceauto", "pricezoom", "pricepan"].includes(L)) {
            (window.TerminalChart.axis(q, L, F), J(q));
            return;
          }
          L === "reset" && window.TerminalChart.axis(q, "reset");
          const ne = o.gm[q];
          if (!ne?.all?.length) return;
          const Ee = window.TerminalChart.view(
            ne.all.length,
            o.zoom[q] || (ne.iv === "1d" ? 140 : 120),
            o.pan[q] || 0,
          );
          if (L === "move") {
            const ge = window.TerminalChart.axis(q),
              je = Ee.count * F.time + (ge.fraction || 0),
              Ze = Math.trunc(je);
            ((ge.fraction = je - Ze),
              window.TerminalChart.axis(q, "pricepan", F.price),
              (L = "pan"),
              (F = Ze));
          }
          L === "page" && ((L = "pan"), (F = Ee.count * F));
          const Ae = window.TerminalChart.change(ne.all.length, Ee, L, F, O);
          ((o.zoom[q] = Ae.count), (o.pan[q] = Ae.offset), J(q));
        },
        anTec: Ve,
        velas: Ye,
        pegaVelas: Xe,
        tecDe: ze,
        candAlias: Je,
        relev: pe,
        classes: Q,
        impactos: re,
        lista: ve,
        criaAlerta: at,
        sma: we,
        rsi: Ge,
        atr: Qe,
        niveisSR: de,
        pxVivo: Ke,
        erroVelas: ot,
        vizinho: he,
        larg: t,
      }));
    const Y = (q) =>
      Pe().p.forEach((L, F) => {
        q.test(L) && J(F);
      });
    (document.addEventListener(
      "click",
      async (q) => {
        if (tab !== "term") return;
        const L = q.target.closest && q.target.closest("[data-g9g]");
        if (L && !q.target.closest("[data-g9]")) {
          q.stopPropagation();
          const He = L.closest("[data-trp]"),
            ce = He ? +He.dataset.trp : o.foco;
          Ie(L.dataset.g9g + " G", he(ce));
          return;
        }
        const F = q.target.closest && q.target.closest("[data-g9]");
        if (!F) return;
        q.stopPropagation();
        const [O, ne, Ee, Ae] = F.dataset.g9.split("|"),
          ge = +Ee,
          je = Pe(),
          Ze = e.parse(je.p[ge] || "");
        if (O === "style") {
          window.TraderTerminalChartStyle =
            ne === "candles" ? "candles" : "line";
          try {
            localStorage.setItem(
              "dt-terminal-chart-style",
              window.TraderTerminalChartStyle,
            );
          } catch {}
          J(ge);
          return;
        }
        if (O === "tf" && Ze) {
          ((je.p[ge] = Ze.tk + " G " + (ne === "1d" ? "D" : ne.toUpperCase())),
            save(),
            J(ge),
            se(ge));
          return;
        }
        if (O === "ind") {
          const He = ue();
          ((He[ne] = He[ne] ? 0 : 1), save(), Y(/\bG\b|\bGP\b|\bGIP\b/));
          return;
        }
        if (["zoom", "page", "latest", "reset"].includes(O)) {
          window.TRM.tec.chartView(
            ge,
            O,
            O === "zoom" ? (ne === "+" ? 1 / 1.4 : 1.4) : +ne,
          );
          return;
        }
        if (O === "alerta" && Ze) {
          at(Ze.tk, +ne, "terminal: " + (Ae || "nível"));
          return;
        }
        if (O === "per") {
          ((o.cmp[ge] = +ne), J(ge));
          return;
        }
        if (O === "rmcmp" && Ze) {
          const He = Le(Ze).filter((ce) => ce !== ne);
          ((je.p[ge] = He.length ? "COMP " + He.join(" ") : "HELP"),
            save(),
            J(ge),
            se(ge));
          return;
        }
        if (O === "tadd") {
          const He = document.getElementById("g9tadd"),
            ce = String((He && He.value) || "")
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "");
          if (!ce) return;
          const E = ve();
          (E.includes(ce) || E.push(ce), save(), J(ge), se(ge));
          return;
        }
        if (O === "trm") {
          const He = s();
          ((He.tech = ve().filter((ce) => ce !== ne)), save(), J(ge));
          return;
        }
        if (O === "sord") {
          ((o.setOrd = ne), J(ge));
          return;
        }
        if (O === "nmk") {
          ((o.nw.mk = ne), J(ge));
          return;
        }
        if (O === "nrel") {
          ((o.nw.rel = ne), J(ge));
          return;
        }
        if (O === "ntl") {
          ((o.nw.tl = o.nw.tl ? 0 : 1), J(ge));
          return;
        }
        if (O === "npdf" || O === "nimg") {
          try {
            if (typeof jrVer == "function" && jrVer() && jrVer().manchete) {
              O === "npdf" ? jrPdf() : jrImgShare();
              return;
            }
          } catch {}
          (toast(
            "Abrindo o Jornal do Pregão: gere a edição de hoje e toque em PDF ou Imagem.",
            3500,
          ),
            (tab = "mercado"));
          try {
            MKT.tab = "jr";
          } catch {}
          (irPara(tab), scrollTo(0, 0));
          return;
        }
        if (O === "mmodo") {
          ((o.map.modo = ne), J(ge));
          return;
        }
        if (O === "mreg") {
          ((o.map.reg = ne), J(ge));
          return;
        }
        if (O === "msel") {
          ((o.map.sel = ne), J(ge));
          return;
        }
        if (O === "mnews") {
          Ie("N " + ne, he(ge));
          return;
        }
        if (O === "gopen") {
          Ie(ne + " G", he(ge));
          return;
        }
        if (O === "iagera") {
          V(ne, ge);
          return;
        }
        if (O === "fhk") {
          const He = String(
              (document.getElementById("g9fhk") || {}).value || "",
            )
              .trim()
              .slice(0, 60),
            ce = window.trFhErro(He);
          if (ce) {
            toast(ce, 7e3);
            return;
          }
          ((s().fh = He),
            save(),
            e.trFinnhub([]),
            toast(
              He
                ? "Chave do Finnhub salva: ações dos EUA ao vivo no MON."
                : "Chave apagada.",
            ),
            J(ge));
          return;
        }
        if (O === "stest") {
          (Object.keys(o.dados).forEach((He) => {
            o.dados[He].ts = 0;
          }),
            (o.pTs = 0),
            x("Teste", "conferindo todas as fontes…", !0),
            await Promise.all([
              d("cot", { s: ["PETR4", "SP:SPX"] }),
              d("copom"),
              d("agenda"),
              d("noticias"),
              d("titulos"),
              Xe("PETR4", "1d"),
            ]),
            J(ge));
          return;
        }
      },
      !0,
    ),
      document.addEventListener(
        "keydown",
        (q) => {
          if (tab !== "term" || q.key !== "Enter") return;
          const L = q.target;
          if (!(!L || !L.dataset)) {
            if (L.dataset.g9cmpin != null) {
              const F = +L.dataset.g9cmpin,
                O = e.parse(Pe().p[F]),
                ne = String(L.value || "")
                  .trim()
                  .toUpperCase();
              O && ne && (q.preventDefault(), Ie("COMP " + O.tk + " " + ne, F));
            } else if (L.dataset.g9cmpadd != null) {
              const F = +L.dataset.g9cmpadd,
                O = e.parse(Pe().p[F]),
                ne = String(L.value || "")
                  .trim()
                  .toUpperCase();
              O &&
                ne &&
                (q.preventDefault(),
                Ie("COMP " + Le(O).concat(ne.split(/\s+/)).join(" "), F));
            } else if (L.dataset.g9nq != null) {
              (q.preventDefault(),
                (o.nw.q = String(L.value || "")
                  .trim()
                  .slice(0, 60)));
              const F = +L.dataset.g9nq;
              (J(F), se(F));
            } else if (L.id === "g9tadd") {
              q.preventDefault();
              const F = L.parentElement.querySelector("[data-g9]");
              F && F.click();
            }
          }
        },
        !0,
      ));
    {
      const q = TraderStyles.slot("legacy-112");
      ((q.id = "term190"),
        (q.textContent = TraderStyles.css("legacy-112")),
        TraderStyles.mount(q));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e) return;
    const {
        TR: t,
        FN: a,
        EXT: o,
        ALIAS: s,
        esc2: n,
        hm: r,
        layAtual: i,
        pinta: l,
      } = e,
      d = {
        JORNAL: [
          "mercado",
          "jr",
          "Jornal do Pregão",
          "Edição do dia com áudio, PDF e imagem",
        ],
        GIRO: ["mercado", "giro", "Giro", "Giro do mercado"],
        PAINEL: ["mercado", "pn", "Painel", "Painel do mercado"],
        MUNDO: [
          "mercado",
          "mu",
          "Mundo",
          "Bolsas, moedas e commodities do mundo",
        ],
        AGENDA: [
          "mercado",
          "ag",
          "Agenda",
          "Calendário econômico (TradingView)",
        ],
        NOTICIAS: [
          "mercado",
          "nt",
          "Notícias do dia",
          "Notícias por categoria",
        ],
        ECONOMISTA: [
          "mercado",
          "eco",
          "Economista IA",
          "Chat com o economista: notícias e cenários",
        ],
        SENT: ["mercado", "se", "Sentimento", "Humor do mercado"],
        SAZ: ["mercado", "saz", "Sazonalidade", "Padrões do calendário"],
        RANK: ["mercado", "rk", "Altas e baixas", "Ranking do dia"],
        ALERTAS: ["mercado", "al", "Alertas", "Gerenciar alertas"],
        FLUXO: ["mercado", "fl", "Fluxo EWZ", "Fluxo do EWZ"],
        JEDU: ["mercado", "jedu", "Entenda os juros", "Aula sobre juros"],
        JUROS: ["juros", "", "Juros e DI", "Curva de juros e DI"],
        AOVIVO: [
          "live",
          "",
          "Ao vivo",
          "Trades de olho, radar e cotações do Profit",
        ],
        GRAF: ["graf", "", "Gráficos", "Gráficos do app"],
        BTST: ["swbt", "", "Backtest", "Backtest de setups"],
        REPLAY: ["dtrpy", "", "Replay do pregão", "Replay do pregão"],
        GRADE: ["opgrade", "", "Grade de opções", "Grade de opções ao vivo"],
      };
    (Object.assign(s, {
      ECOIA: "ECONOMISTA",
      HOJE: "JORNAL",
      CAL: "AGENDA",
      SAZON: "SAZ",
    }),
      Object.entries(d).forEach(([f, x]) => {
        a[f] = x[3] + " (tela cheia)";
      }));
    const c = (f) => {
      const x = d[f];
      if (!x) return !1;
      try {
        ((tab = x[0]), x[1] && (MKT.tab = x[1]));
      } catch {}
      return ((t.voltar = 1), irPara(tab), scrollTo(0, 0), !0);
    };
    window.trTela = (f) => !!d[f] && c(f);
    const p = () => {
      try {
        const f = typeof jrVer == "function" ? jrVer() : null;
        if (!f || !f.manchete) return "";
        const x = (v) =>
          typeof v == "string" ? v : (v && (v.titulo || v.t || v.texto)) || "";
        return (
          `<div class="g9li"><b>${n(x(f.manchete))}</b></div>` +
          (f.materias || [])
            .slice(0, 6)
            .map((v) => `<div class="g9li">${n(x(v))}</div>`)
            .join("")
        );
      } catch {
        return "";
      }
    };
    (Object.keys(d).forEach((f) => {
      o[f] = {
        body: (x, v) => {
          const g = d[f],
            h = f === "JORNAL" ? p() : "";
          return `<div class="trsec">${n(g[2])}</div><div class="trnote">${n(g[3])}. Abre a tela completa, com todas as funções de antes.</div>${h || (f === "JORNAL" ? '<div class="trnote">A edição de hoje aparece aqui depois que você abrir o Jornal.</div>' : "")}
  <div class="trrow"><button class="trbtn on" data-trtela="${f}">Abrir ${n(g[2])}</button>${f === "JORNAL" && h ? '<button class="trbtn" data-g9="npdf||' + v + '">PDF</button><button class="trbtn" data-g9="nimg||' + v + '">Imagem</button>' : ""}</div>`;
        },
      };
    }),
      document.addEventListener(
        "click",
        (f) => {
          const x = f.target.closest && f.target.closest("[data-trtela]");
          x && (f.preventDefault(), f.stopPropagation(), c(x.dataset.trtela));
        },
        !0,
      ),
      document.addEventListener(
        "click",
        (f) => {
          f.target.closest &&
            f.target.closest('#bnav [data-k="mercado"],[data-m2="mercado"]') &&
            (f.preventDefault(),
            f.stopPropagation(),
            irPara("term"),
            scrollTo(0, 0));
        },
        !0,
      ));
    const u = [
        "JORNAL",
        "NOTICIAS",
        "AGENDA",
        "ECONOMISTA",
        "MUNDO",
        "GIRO",
        "PAINEL",
        "SENT",
        "ALERTAS",
        "JUROS",
      ],
      m = () =>
        `<div class="trmerc">${u.map((f) => `<button data-trtela="${f}">${n(d[f][2])}</button>`).join("")}</div>`;
    window.trMercHtml = m;
    {
      const f = render0;
      render0 = function () {
        const x = f.apply(this, arguments);
        try {
          const v = document.querySelector('#bnav [data-k="mercado"]');
          if (v) {
            const h = v.querySelector("span");
            (h && (h.textContent = "Terminal"),
              v.setAttribute("aria-label", "Terminal"),
              tab === "term" &&
                (document.querySelectorAll("#bnav button").forEach((b) => {
                  (b.classList.remove("on"), b.removeAttribute("aria-current"));
                }),
                v.classList.add("on"),
                v.setAttribute("aria-current", "page")));
          }
          document.querySelectorAll('[data-m2="mercado"]').forEach((h) => {
            const b = h.querySelector("b"),
              y = h.querySelector("small");
            (b && (b.textContent = "Terminal"),
              y &&
                (y.textContent =
                  "Cotações, gráficos, notícias, jornal, agenda e IA"),
              tab === "term" && h.classList.add("on"));
          });
          const g = Object.values(d).some(
            (h) =>
              h[0] === tab && (!h[1] || (typeof MKT < "u" && MKT.tab === h[1])),
          );
          if (tab === "mercado" || (g && t.voltar)) {
            const h = document.getElementById("app");
            if (h && !h.querySelector(".trvolta")) {
              const b = document.createElement("div");
              ((b.className = "trvolta"),
                (b.innerHTML = `<button data-trabre="1" class="trv1">◀ TERMINAL</button><input class="trv2" id="trvcmd" placeholder="comando (ex.: PETR4 G)" autocomplete="off" autocapitalize="characters" spellcheck="false">${m()}`),
                h.insertBefore(b, h.firstChild));
            }
            document
              .querySelectorAll("#app .seg.hub [data-trabre]")
              .forEach((b) => b.remove());
          }
          if ((tab !== "mercado" && !g && (t.voltar = 0), tab === "term")) {
            const h = document.querySelector(".trm .trtape");
            h &&
              !document.querySelector(".trm .trmerc") &&
              h.insertAdjacentHTML("afterend", m());
          }
        } catch {}
        return x;
      };
    }
    document.addEventListener("keydown", (f) => {
      if (f.key !== "Enter" || !f.target || f.target.id !== "trvcmd") return;
      const x = String(f.target.value || "").trim();
      if (!x) return;
      f.preventDefault();
      const v = e.parse(x);
      if (v && d[v.f]) {
        c(v.f);
        return;
      }
      (irPara("term"), setTimeout(() => e.roda(x), 50));
    });
    {
      const f = TraderStyles.slot("legacy-113");
      ((f.id = "term191"),
        (f.textContent = TraderStyles.css("legacy-113")),
        TraderStyles.mount(f));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e || !e.tec) return;
    const {
        TR: t,
        TS: a,
        EXT: o,
        FN: s,
        ALIAS: n,
        trFn: r,
        trGet: i,
        profitDe: l,
        melhorPx: d,
        srcTag: c,
        logF: p,
        esc2: u,
        nf: m,
        pc: f,
        cls: x,
        big: v,
        hm: g,
        dm: h,
        tabela: b,
        carregando: y,
        pinta: j,
        carrega: k,
        roda: A,
        layAtual: C,
        ehPC: I,
      } = e,
      {
        anTec: J,
        velas: se,
        pegaVelas: Ie,
        tecDe: Pe,
        relev: Me,
        impactos: ue,
        lista: ve,
        criaAlerta: he,
        sma: we,
        rsi: Be,
        niveisSR: Ge,
        pxVivo: Ce,
        vizinho: Qe,
        larg: de,
      } = e.tec,
      Se = {
        get: (R, z) => {
          try {
            const oe = APP_STORAGE.getItem(R);
            return oe ? JSON.parse(oe) : z;
          } catch {
            return z;
          }
        },
        set: (R, z) => {
          try {
            APP_STORAGE.setItem(R, JSON.stringify(z));
          } catch {}
        },
      },
      Ve = (R) =>
        R
          ? new Date(R).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "—",
      Je = (R) => {
        if (!R) return "—";
        const z = Math.round((Date.now() - R) / 1e3);
        return z < 60
          ? z + " s"
          : z < 3600
            ? Math.round(z / 60) + " min"
            : z < 86400
              ? Math.round(z / 3600) + " h"
              : Math.round(z / 86400) + " d";
      },
      Ye = () => {
        const R = new Date(),
          z = R.getDay(),
          oe = R.getHours() + R.getMinutes() / 60;
        return z > 0 && z < 6 && oe >= 10 && oe < 18;
      },
      Xe = (R) => R;
    if (
      ((t.log = (t.log || [])
        .concat(Se.get("diario-term-log", []))
        .slice(0, 300)),
      (t.audQ = Se.get("diario-term-audq", {})),
      (t.audIA = Se.get("diario-term-audia", [])),
      (t.dq = Se.get("diario-term-dq", { iss: {} })),
      (t.dq.iss = t.dq.iss || {}),
      setInterval(() => {
        (Se.set("diario-term-log", t.log.slice(0, 300)),
          Se.set("diario-term-audq", t.audQ),
          Se.set("diario-term-dq", t.dq));
      }, 2e4),
      addEventListener("pagehide", () => {
        (Se.set("diario-term-log", t.log.slice(0, 300)),
          Se.set("diario-term-audq", t.audQ),
          Se.set("diario-term-dq", t.dq));
      }),
      setInterval(() => {
        try {
          Object.entries(t.src).forEach(([z, oe]) => {
            if (oe.px == null) return;
            const me = t.audQ[z] || (t.audQ[z] = []),
              be = me[0];
            (be && be.px === oe.px && be.fonte === oe.fonte) ||
              (me.unshift({
                px: oe.px,
                fonte: oe.fonte,
                dado: oe.ts || null,
                chegou: Date.now(),
                rt: !!oe.rt,
              }),
              me.length > 40 && (me.length = 40));
          });
          const R = Object.keys(t.audQ);
          R.length > 80 &&
            R.sort(
              (z, oe) =>
                (t.audQ[z][0] || {}).chegou - (t.audQ[oe][0] || {}).chegou,
            )
              .slice(0, R.length - 80)
              .forEach((z) => delete t.audQ[z]);
        } catch {}
      }, 3e3),
      typeof anxCall == "function")
    ) {
      const R = anxCall;
      anxCall = async function (z) {
        const oe = Date.now(),
          me = "ia" + oe.toString(36);
        let be = "";
        try {
          be = JSON.stringify(z || {});
        } catch {}
        const X = {
          id: me,
          ts: oe,
          modo: String((z || {}).modo || "?"),
          tam: be.length,
          enviado: be.length > 24e3 ? be.slice(0, 24e3) + "…(cortado)" : be,
        };
        try {
          const xe = await R.apply(this, arguments);
          ((X.ms = Date.now() - oe),
            (X.ia = (xe && (xe.ia || xe.provedor)) || ""),
            (X.modelo = (xe && (xe.modelo || xe.model)) || ""),
            (X.gerado = (xe && (xe.gerado || xe.em)) || ""),
            (X.erro = xe && xe.erro ? String(xe.erro).slice(0, 200) : ""),
            (X.versao = (xe && (xe.versao || xe.edicao || xe.id)) || ""));
          try {
            const $e = JSON.stringify(xe);
            X.resposta = $e.length > 8e3 ? $e.slice(0, 8e3) + "…(cortado)" : $e;
          } catch {}
          return (ot(X), xe);
        } catch (xe) {
          throw (
            (X.ms = Date.now() - oe),
            (X.erro = String(xe.message || xe).slice(0, 200)),
            ot(X),
            p("IA (" + X.modo + ")", X.erro, !1),
            xe
          );
        }
      };
    }
    function ot(R) {
      (t.audIA.unshift(R), (t.audIA = t.audIA.slice(0, 25)));
      let z = t.audIA;
      for (; z.length > 3 && JSON.stringify(z).length > 9e5; )
        z = z.slice(0, -1);
      ((t.audIA = z), Se.set("diario-term-audia", z));
    }
    ((s.DQ =
      "Qualidade dos dados: origem, divergências, cotações paradas, falhas e confiabilidade"),
      (n.QUAL = "DQ"),
      (n.QUALIDADE = "DQ"));
    function Ke() {
      const R = {};
      return (
        Object.entries(t.dados).forEach(([z, oe]) => {
          if (!oe || !oe.v) return;
          const me = Date.parse(oe.v.em) || oe.ts,
            be = (X) => {
              if (!X || X.px == null) return;
              const xe =
                String(X.pedido || "").toUpperCase() ||
                String(X.s || "")
                  .split(":")
                  .pop();
              R[xe] = { px: +X.px, atraso: X.atraso !== !1, em: me, s: X.s };
            };
          z.startsWith("cot|")
            ? (oe.v.itens || []).forEach(be)
            : z.startsWith("mundo|") &&
              (oe.v.grupos || []).forEach((X) =>
                X.itens.forEach((xe) =>
                  be({
                    ...xe,
                    pedido: String(xe.s || "").startsWith("BMFBOVESPA:")
                      ? xe.s.split(":")[1]
                      : "",
                  }),
                ),
              );
        }),
        R
      );
    }
    const at = (R) => ({ "WIN1!": "WINFUT", "WDO1!": "WDOFUT" })[R] || R;
    function rt() {
      const R = Date.now(),
        z = [],
        oe = [],
        me = (ne, Ee, Ae, ge, je, Ze) =>
          z.push({
            id: ne,
            cat: Ee,
            nome: Ae,
            st: ge,
            n: je,
            obs: Ze || "",
            em: R,
          }),
        be = (ne, Ee, Ae, ge, je) =>
          oe.push({
            k: ne + "|" + Ee,
            chk: ne,
            item: Ee,
            dado: Ae,
            coment: ge,
            grav: je || "erro",
          }),
        X = (t.pf && t.pf.todas) || [],
        xe = X.filter((ne) => R - ne.up > 12e4 && R - ne.up < 6 * 36e5);
      X.length
        ? (me(
            "pf",
            "Cotações",
            "Cotações paradas (Profit)",
            Ye() && xe.length ? "erro" : "ok",
            Ye() ? xe.length : 0,
            Ye()
              ? "mais de 2 min sem atualizar no pregão"
              : "fora do pregão: parar é normal",
          ),
          Ye() &&
            xe.forEach((ne) =>
              be("pf", ne.tk, ne.up, `Profit sem atualizar há ${Je(ne.up)}`),
            ))
        : me(
            "pf",
            "Cotações",
            "Ponte do Profit enviando dados",
            SESS ? "aviso" : "off",
            0,
            SESS
              ? "Nenhuma cotação da ponte. O PC com o Profit está ligado?"
              : "Entre na conta.",
          );
      const $e = Ke();
      let fe = 0,
        Fe = 0;
      (Object.entries(t.profit || {}).forEach(([ne, Ee]) => {
        const Ae = $e[ne] || $e[at(ne)] || $e[ne.replace(/FUT$/, "1!")];
        if (!Ae || !(Ee.px > 0) || !(Ae.px > 0)) return;
        fe++;
        const ge = (Ee.px / Ae.px - 1) * 100,
          je = Ae.atraso ? 1.5 : 0.3;
        Math.abs(ge) > je &&
          (Fe++,
          be(
            "div",
            ne,
            Ee.up,
            `Profit ${m(Ee.px)} × TradingView ${m(Ae.px)} (${f(ge)}; tolerância ${m(je, 1)}%${Ae.atraso ? " porque o TradingView está 15 min atrasado" : ""})`,
          ));
      }),
        me(
          "div",
          "Cotações",
          "Divergência Profit × TradingView",
          Fe ? "erro" : fe ? "ok" : "off",
          Fe,
          fe ? `${fe} ativos comparados` : "sem ativos nas duas fontes agora",
        ));
      const w = Object.entries(t.src).filter(([, ne]) => R - ne.em < 10 * 6e4),
        H = w.filter(([, ne]) => ne.falha),
        N = w.filter(([, ne]) => !ne.rt && !ne.falha);
      (me(
        "falha",
        "Cotações",
        "Ativos sem cotação",
        H.length ? "erro" : "ok",
        H.length,
        "o servidor não achou o símbolo",
      ),
        H.forEach(([ne]) =>
          be(
            "falha",
            ne.replace(/^.*:/, ""),
            null,
            "Sem cotação em nenhuma fonte",
          ),
        ),
        me(
          "atr",
          "Cotações",
          "Cotações atrasadas na tela",
          N.length ? "aviso" : "ok",
          N.length,
          "TradingView com 15 min; normal sem Profit/Finnhub",
        ));
      let W = 0;
      (w.forEach(([ne, Ee]) => {
        Ee.d1 != null &&
          Math.abs(Ee.d1) >= 15 &&
          !/BIN|CRY|BTC|ETH/.test(ne) &&
          (W++,
          be(
            "sus",
            ne.replace(/^.*:/, ""),
            Ee.ts,
            `Variação de ${f(Ee.d1)} no dia: confira se o dado está certo`,
            "aviso",
          ));
      }),
        me(
          "sus",
          "Cotações",
          "Variações anormais (dado suspeito)",
          W ? "aviso" : "ok",
          W,
          "acima de 15% no dia",
        ));
      const Te = Object.fromEntries(
          Object.entries(t.fst).filter(([, ne]) => R - ne.ts < 10 * 6e4),
        ),
        V = Object.entries(Te).filter(([ne]) => ne.startsWith("srv:")),
        ae = V.filter(([, ne]) => !ne.ok);
      (me(
        "srv",
        "Integrações",
        "Servidor do terminal",
        ae.length ? "erro" : V.length ? "ok" : "off",
        ae.length,
        ae.map(([ne, Ee]) => ne.slice(4) + ": " + Ee.err).join(" · "),
      ),
        ae.forEach(([ne, Ee]) => be("srv", ne.slice(4), Ee.ts, Ee.err)),
        me(
          "yh",
          "Integrações",
          "Gráficos (Yahoo)",
          Te.candles ? (Te.candles.ok ? "ok" : "erro") : "off",
          Te.candles && !Te.candles.ok ? 1 : 0,
          (Te.candles && Te.candles.err) || "",
        ));
      const ee = t.ws,
        le = t.fh;
      (me(
        "bin",
        "Integrações",
        "Binance (cripto ao vivo)",
        ee && ee.readyState === 1 ? "ok" : ee ? "aviso" : "erro",
        ee && ee.readyState === 1 ? 0 : 1,
        ee && ee.readyState === 1
          ? ""
          : "não conectou: confira se o index.html novo foi publicado",
      ),
        me(
          "fh",
          "Integrações",
          "Finnhub (EUA ao vivo)",
          a().fh
            ? le && le.readyState === 1
              ? "ok"
              : t.fhRecusa
                ? "erro"
                : t.fhWanted?.length
                  ? (t.fhAttempt || 0) < 3
                    ? "conectando"
                    : "aviso"
                  : "off"
            : "off",
          0,
          a().fh
            ? t.fhRecusa
              ? "Assinatura recusada pelo provedor"
              : t.fhWanted?.length
                ? "Retomada automática ao abrir o app; verifica a conexão"
                : "Sem ativos dos EUA selecionados"
            : "Sem chave Finnhub configurada (opcional)",
        ));
      const Y = i("noticias").v,
        q = i("agenda").v,
        L = i("titulos").v;
      (me(
        "nt",
        "Integrações",
        "Fontes de notícias",
        Y ? (Y.falharam && Y.falharam.length ? "aviso" : "ok") : "off",
        Y && Y.falharam ? Y.falharam.length : 0,
        Y && Y.falharam && Y.falharam.length
          ? "fora do ar: " + Y.falharam.join(", ")
          : "",
      ),
        ((Y && Y.falharam) || []).forEach((ne) =>
          be(
            "nt",
            ne,
            i("noticias").ts,
            "Fonte de notícias não respondeu",
            "aviso",
          ),
        ),
        me(
          "ag",
          "Integrações",
          "Agenda com resultado",
          q ? (q.aviso ? "aviso" : "ok") : "off",
          q && q.aviso ? 1 : 0,
          (q && q.aviso) || "",
        ),
        me(
          "td",
          "Integrações",
          "Tesouro Direto",
          L ? (L.tesouro_erro ? "aviso" : "ok") : "off",
          L && L.tesouro_erro ? 1 : 0,
          (L && L.tesouro_erro) || "",
        ));
      const F = t.audIA.filter((ne) => ne.modo === "central").slice(0, 5),
        O = F.filter((ne) => !/dado_em|publicada_em/.test(ne.enviado || ""));
      return (
        me(
          "ia",
          "IA",
          "Dados enviados à IA com data e origem",
          O.length ? "erro" : F.length ? "ok" : "off",
          O.length,
          F.length
            ? `${F.length} últimas leituras da central conferidas`
            : "nenhuma leitura da central ainda",
        ),
        { C: z, iss: oe }
      );
    }
    function dt() {
      const R = t.fst,
        z = [],
        oe = (H, N, W) =>
          Math.round(
            Math.max(
              0,
              Math.min(100, (H ? 1 - N / H : 0) * 100 * (W ? 1 : 0.6)),
            ),
          ),
        me = (t.pf && t.pf.todas) || [],
        be = me.length ? Math.max(...me.map((H) => H.up)) : 0;
      z.push([
        "Ponte do Profit",
        me.length
          ? Math.round(Date.now() - be < 12e4 ? 100 : Ye() ? 40 : 85)
          : 0,
        me.length ? "atualizado há " + Je(be) : "sem dados",
      ]);
      const X = (H) => {
          const N = Object.entries(R).filter(([ee]) => ee.startsWith(H)),
            W = N.reduce((ee, [, le]) => ee + le.n, 0),
            Te = N.reduce((ee, [, le]) => ee + le.falhas, 0),
            V = Math.max(0, ...N.map(([, ee]) => ee.ts || 0)),
            ae = N.reduce((ee, [, le]) => ee + (le.tot || 0), 0);
          return { n: W, f: Te, u: V, med: W ? Math.round(ae / W) : null };
        },
        xe = X("srv:"),
        $e = X("candles");
      (z.push([
        "Servidor do terminal (TradingView, BC, notícias)",
        xe.n ? oe(xe.n, xe.f, Date.now() - xe.u < 12e4) : 0,
        xe.n
          ? `${xe.n - xe.f}/${xe.n} ok · ${xe.med} ms em média`
          : "sem chamadas",
      ]),
        z.push([
          "Gráficos (Yahoo)",
          $e.n ? oe($e.n, $e.f, !0) : 0,
          $e.n ? `${$e.n - $e.f}/${$e.n} ok · ${$e.med} ms` : "sem chamadas",
        ]));
      const fe = Object.entries(t.px)
        .filter(([H]) => H.startsWith("BIN:"))
        .map(([, H]) => H.ts)
        .sort()
        .pop();
      z.push([
        "Binance",
        t.ws && t.ws.readyState === 1
          ? fe && Date.now() - fe < 6e4
            ? 100
            : 80
          : 0,
        t.ws && t.ws.readyState === 1
          ? "último preço há " + Je(fe)
          : "desconectada",
      ]);
      const Fe = Object.entries(t.px)
        .filter(([H]) => H.startsWith("FH:"))
        .map(([, H]) => H.ts)
        .sort()
        .pop();
      z.push([
        "Finnhub",
        a().fh ? (t.fh && t.fh.readyState === 1 ? (Fe ? 100 : 80) : 20) : 0,
        a().fh
          ? t.fh && t.fh.readyState === 1
            ? "conectado"
            : "desconectado"
          : "sem chave",
      ]);
      const w = t.audIA.slice(0, 10);
      return (
        z.push([
          "IA (Gemini)",
          w.length
            ? Math.round((w.filter((H) => !H.erro).length / w.length) * 100)
            : 0,
          w.length
            ? `${w.filter((H) => !H.erro).length}/${w.length} respostas ok · ${Math.round(w.reduce((H, N) => H + (N.ms || 0), 0) / w.length / 1e3)} s em média`
            : "sem chamadas",
        ]),
        z
      );
    }
    ((window.trChecagens = rt),
      (window.trTvCache = Ke),
      (window.trDqResumo = () => {
        try {
          const { C: R } = rt();
          return {
            problemas: R.filter((z) => z.st === "erro").map(
              (z) => z.nome + (z.n ? ` (${z.n})` : ""),
            ),
            avisos: R.filter((z) => z.st === "aviso").map((z) => z.nome),
          };
        } catch {
          return null;
        }
      }),
      (t.dqSel = t.dqSel || {}),
      (t.dqF = t.dqF || { st: "abertos" }),
      (o.DQ = {
        vivo: !0,
        load: () =>
          Promise.all([
            r("noticias", {}, 12e4),
            r("agenda", {}, 6e4),
            r("titulos", {}, 3e5),
          ]),
        body: (R, z) => {
          const { C: oe, iss: me } = rt(),
            be = Date.now(),
            X = t.dq.iss,
            xe = de(z) < 780;
          (me.forEach((F) => {
            const O = X[F.k] || (X[F.k] = { prim: be, st: "aberto" });
            ((O.ult = be),
              (O.item = F.item),
              (O.chk = F.chk),
              (O.dado = F.dado),
              (O.coment = F.coment),
              (O.grav = F.grav),
              O.st === "resolvido" &&
                !O.manual &&
                ((O.st = "aberto"), delete O.resolv));
          }),
            Object.entries(X).forEach(([F, O]) => {
              (me.some((ne) => ne.k === F) ||
                (O.st === "aberto" &&
                  ((O.st = "resolvido"), (O.resolv = be), (O.auto = 1)),
                delete O.manual),
                be - (O.ult || 0) > 7 * 864e5 && delete X[F]);
            }));
          const $e = {
              ok: '<span class="g9dot vd"></span>Ok',
              erro: '<span class="g9dot vm"></span>Erro',
              aviso: '<span class="g9dot am"></span>Atenção',
              off: '<span class="g9dot cz"></span>Sem dados',
              conectando: '<span class="g9dot cz"></span>Reconectando',
            },
            fe = [...new Set(oe.map((F) => F.cat))],
            Fe = `<div class="dqcats">${fe
              .map((F) => {
                const O = oe.filter((Ae) => Ae.cat === F),
                  ne = O.some((Ae) => Ae.st === "erro"),
                  Ee = O.some((Ae) => Ae.st === "aviso");
                return `<span class="dqcat ${ne ? "e" : Ee ? "a" : "o"}">${ne ? "✕" : Ee ? "!" : "✓"} ${u(F)}</span>`;
              })
              .join("")}</div>`,
            w = xe
              ? `<div class="g9cards">${oe.map((F) => `<div class="g9card"><div class="g9c1"><b>${u(F.nome)}</b><span>${$e[F.st]}${F.n ? ` · ${F.n}` : ""}</span></div>${F.obs ? `<div class="g9c3">${u(F.obs)}</div>` : ""}</div>`).join("")}</div>`
              : b(
                  [
                    "Estado",
                    "Problemas",
                    "Checagem",
                    "Categoria",
                    "Verificado",
                    "Observação",
                  ],
                  oe.map(
                    (F) =>
                      `<tr><td>${$e[F.st]}</td><td class="num">${F.n || 0}</td><td>${u(F.nome)}</td><td><span class="dqtag">${u(F.cat)}</span></td><td class="mut">agora</td><td class="mut" style="white-space:normal">${u(F.obs)}</td></tr>`,
                  ),
                  "checagens",
                ),
            H = dt(),
            N = (F) =>
              `<span class="dqbar"><i style="width:${F}%;background:${F >= 80 ? "#3aad74" : F >= 50 ? "#c2943e" : "#e7614c"}"></i></span> <b>${F}</b>`,
            W =
              '<div class="trsec">Confiabilidade de cada fonte (0 a 100)</div>' +
              (xe
                ? `<div class="g9cards">${H.map((F) => `<div class="g9card"><div class="g9c1"><b>${u(F[0])}</b><span>${N(F[1])}</span></div><div class="g9c3">${u(F[2])}</div></div>`).join("")}</div>`
                : b(
                    ["Fonte", "Confiabilidade", "Detalhe"],
                    H.map(
                      (F) =>
                        `<tr><td>${u(F[0])}</td><td>${N(F[1])}</td><td class="mut">${u(F[2])}</td></tr>`,
                    ),
                    "confiab",
                  )),
            Te = t.fst,
            V = Object.entries(Te).sort(
              (F, O) => (O[1].ts || 0) - (F[1].ts || 0),
            ),
            ae =
              '<div class="trsec">Monitor das APIs</div>' +
              (V.length
                ? b(
                    [
                      "Endpoint",
                      "Chamadas",
                      "Sucesso",
                      "Latência média",
                      "Última",
                      "Último erro",
                    ],
                    V.map(
                      ([F, O]) =>
                        `<tr><td class="tk">${u(F.replace("srv:", "terminal/"))}</td><td class="num">${O.n}</td><td class="num ${O.falhas ? "am" : "tg"}">${m((1 - O.falhas / O.n) * 100, 0)}%</td><td class="num">${O.n ? Math.round((O.tot || 0) / O.n) + " ms" : "—"}</td><td class="num">${Je(O.ts)}</td><td class="mut" style="white-space:normal">${u(O.err || "")}</td></tr>`,
                    ),
                    "apis",
                  )
                : '<div class="trnote">Sem chamadas ainda.</div>'),
            ee = t.dqF.st,
            le = Object.entries(X)
              .filter(
                ([, F]) =>
                  ee === "todos" ||
                  (ee === "abertos" ? F.st === "aberto" : F.st !== "aberto"),
              )
              .sort((F, O) => (O[1].ult || 0) - (F[1].ult || 0))
              .slice(0, 80),
            Y = {
              pf: "Profit parado",
              div: "Divergência",
              falha: "Sem cotação",
              sus: "Variação anormal",
              srv: "Servidor",
              nt: "Notícias",
            },
            q =
              `<div class="dqih"><b>Problemas</b>${["abertos", "resolvidos", "todos"].map((F) => `<button class="g9b${ee === F ? " on" : ""}" data-g9q="dqf|${F}|${z}">${F[0].toUpperCase() + F.slice(1)}</button>`).join("")}<span class="g9sep"></span><button class="g9b" data-g9q="dqres||${z}">Marcar como resolvido</button><button class="g9b" data-g9q="dqign||${z}">Ignorar</button></div>` +
              (le.length
                ? xe
                  ? `<div class="g9cards">${le.map(([F, O]) => `<label class="g9card"><div class="g9c1"><span><input type="checkbox" data-dqk="${u(F)}"${t.dqSel[F] ? " checked" : ""}> <b class="tk">${u(O.item)}</b> · ${u(Y[O.chk] || O.chk)}</span><span class="${O.st === "aberto" ? "tr" : "mut"}">${O.st}</span></div><div class="g9c3">${u(O.coment || "")}</div><div class="g9c2">dado ${O.dado ? Ve(O.dado) : "—"} · registrado ${Ve(O.prim)}${O.resolv ? " · resolvido " + Ve(O.resolv) : ""}</div></label>`).join("")}</div>`
                  : b(
                      [
                        "",
                        "Item",
                        "Checagem",
                        "Data do dado",
                        "Registrado em",
                        "Estado",
                        "Resolvido em",
                        "Comentário",
                      ],
                      le.map(
                        ([F, O]) =>
                          `<tr><td><input type="checkbox" data-dqk="${u(F)}"${t.dqSel[F] ? " checked" : ""}></td><td class="tk">${u(O.item)}</td><td>${u(Y[O.chk] || O.chk)}</td><td class="num">${O.dado ? Ve(O.dado) : "—"}</td><td class="num">${Ve(O.prim)}</td><td class="${O.st === "aberto" ? "tr" : "mut"}">• ${O.st}</td><td class="num">${O.resolv ? Ve(O.resolv) : ""}</td><td class="mut" style="white-space:normal">${u(O.coment || "")}</td></tr>`,
                      ),
                      "problemas",
                    )
                : '<div class="trnote">Nenhum problema neste filtro.</div>'),
            L =
              '<div class="trsec">Histórico de falhas das integrações</div>' +
              (t.log.length
                ? t.log
                    .slice(0, 40)
                    .map(
                      (F) =>
                        `<div class="g9log"><span class="num mut">${Ve(F.ts)}</span><span class="g9dot ${F.ok ? "vd" : "vm"}"></span><b>${u(F.fonte)}</b> ${u(F.msg)}</div>`,
                    )
                    .join("")
                : '<div class="trnote">Nada registrado.</div>');
          return (
            Fe +
            w +
            q +
            W +
            ae +
            L +
            '<div class="trfont">As checagens rodam sozinhas a cada 3 s com o terminal aberto. Problemas que somem são marcados como resolvidos automaticamente. O histórico fica guardado neste aparelho por 7 dias.</div>'
          );
        },
      }),
      (s.EVT =
        "Acontecimentos relevantes: resultados, movimentos atípicos, regiões técnicas, BC e volume"),
      (n.EVENTOS = "EVT"),
      (n.EV = "EVT"));
    const vt = () =>
      ["IBOV", "USDBRL", "UKOIL"]
        .concat(ve().filter((R) => /\d$/.test(R)))
        .slice(0, 12);
    async function ft() {
      await Promise.all([
        r("noticias", {}, 12e4),
        r("agenda", {}, 6e4),
        r("mundo", { g: "wei" }),
        r("mundo", { g: "fx" }),
        r("mundo", { g: "cmd" }),
        r("cot", { s: ve() }, 15e3),
      ]);
      const R = vt();
      for (let z = 0; z < R.length; z += 4)
        await Promise.all(R.slice(z, z + 4).map((oe) => Ie(oe, "1d")));
    }
    const ht = { IBOV: "Ibovespa", USDBRL: "Dólar", UKOIL: "Petróleo Brent" },
      qe = {
        PETR: "Petróleo",
        PRIO: "Petróleo",
        VALE: "Mineração",
        GGBR: "Siderurgia",
        CSNA: "Siderurgia",
        ITUB: "Bancos",
        BBAS: "Bancos",
        BBDC: "Bancos",
        SANB: "Bancos",
        WEGE: "Bens de capital",
        ABEV: "Bebidas",
        MGLU: "Varejo",
        ELET: "Elétricas",
        SUZB: "Papel e celulose",
        EMBR: "Aeroespacial",
        B3SA: "Financeiro",
      };
    function Le() {
      const R = Date.now(),
        z = [],
        oe = Ke(),
        me = (w) =>
          oe[w] ||
          oe[{ IBOV: "IBOV", USDBRL: "USDBRL", UKOIL: "UKOIL" }[w]] ||
          null,
        be = (w, H, N, W, Te, V, ae, ee, le) =>
          z.push({
            id: w,
            hora: H,
            tipo: N,
            tit: W,
            fatos: Te,
            ativos: V,
            setores: ae,
            leitura: ee,
            cmd: le,
          });
      vt().forEach((w) => {
        const H = se(w, "1d");
        if (!H || H.L.length < 40) return;
        const N = H.L.map((F) => F[4]),
          W = [];
        for (let F = Math.max(1, N.length - 61); F < N.length - 1; F++)
          W.push(N[F] / N[F - 1] - 1);
        const Te = Math.sqrt(W.reduce((F, O) => F + O * O, 0) / W.length) * 100,
          V = Ce(w),
          ae =
            oe[w] ||
            Object.values(oe).find((F) =>
              String(F.s || "").endsWith(":" + w),
            ) ||
            (w === "USDBRL"
              ? oe["FX_IDC:USDBRL"] ||
                Object.values(oe).find((F) => F.s === "FX_IDC:USDBRL")
              : null) ||
            (w === "UKOIL"
              ? Object.values(oe).find((F) => F.s === "TVC:UKOIL")
              : null),
          ee = V || (ae && ae.px) || N[N.length - 1],
          le =
            new Date(H.L[H.L.length - 1][0] * 1e3).toDateString() ===
            new Date().toDateString()
              ? N[N.length - 2]
              : N[N.length - 1],
          Y = (ee / le - 1) * 100,
          q = V
            ? "Profit"
            : ae
              ? ae.atraso
                ? "TradingView (15 min)"
                : "TradingView"
              : "Yahoo (fechamento)";
        if (!(Math.abs(Y) < 25)) return;
        Te > 0 &&
          Math.abs(Y) >= Math.max(2 * Te, 0.6) &&
          be(
            "mov|" + w,
            R,
            "mov",
            `${ht[w] || w} com movimento atípico`,
            [
              `${ht[w] || w} ${f(Y)} hoje, ${m(Math.abs(Y) / Te, 1)}× a variação típica de ${m(Te, 2)}% (desvio dos últimos 60 pregões) · ${q}, ${g(V ? (l(w) || {}).up : ae ? ae.em : R)}`,
            ],
            [w],
            w === "USDBRL"
              ? ["Exportadoras", "Importadoras", "Juros"]
              : w === "UKOIL"
                ? ["Petróleo (PETR4, PRIO3)", "Companhias aéreas"]
                : w === "IBOV"
                  ? ["Bolsa toda"]
                  : [qe[w.slice(0, 4)] || "Setor do ativo"],
            Y > 0
              ? "Movimento acima do normal para cima."
              : "Movimento acima do normal para baixo.",
            w + " G",
          );
        const L = J(H.L, V || null);
        if (L) {
          L.ev
            .filter((O) => O.b <= 1 && O.tipo !== "curto")
            .forEach((O) =>
              be(
                "tec|" + w + "|" + O.t,
                R,
                "tec",
                `${ht[w] || w}: ${O.t.toLowerCase()}`,
                [
                  `${O.t} · preço ${m(L.px)} · MM200 ${m(L.m200)} · RSI ${m(L.rsi, 0)} (velas diárias do Yahoo; última vela com ${V ? "preço do Profit" : "fechamento"})`,
                ],
                [w],
                [qe[w.slice(0, 4)] || (ht[w] ? "Mercado" : "Setor do ativo")],
                O.d === "alta"
                  ? "Sinal técnico de força."
                  : "Sinal técnico de fraqueza.",
                w + " G",
              ),
            );
          const F = Ge(H.L.slice(0, -1), N[N.length - 2] || ee, L.atr).sup[0];
          F &&
            N[N.length - 2] > F.v &&
            ee < F.v &&
            be(
              "sup|" + w,
              R,
              "tec",
              `${ht[w] || w} perdeu o suporte de ${m(F.v)}`,
              [
                `Preço ${m(ee)} abaixo do suporte ${m(F.v)} (${F.n} toques), que segurava até ontem`,
              ],
              [w],
              [qe[w.slice(0, 4)] || "Mercado"],
              "Rompimento de suporte costuma atrair vendas; confira o fechamento.",
              w + " G",
            );
        }
      });
      const X = i("cot", { s: ve() }).v,
        xe = new Date(),
        $e = Math.max(
          0.15,
          Math.min(1, (xe.getHours() * 60 + xe.getMinutes() - 600) / 420),
        );
      X &&
        Ye() &&
        X.itens.forEach((w) => {
          const H = se(w.pedido, "1d");
          if (!H || !w.vol) return;
          const N = H.L.slice(-21, -1)
            .map((V) => V[5])
            .filter((V) => V > 0);
          if (N.length < 10) return;
          const W = N.reduce((V, ae) => V + ae, 0) / N.length,
            Te = w.vol / (W * $e);
          Te >= 2 &&
            be(
              "vol|" + w.pedido,
              R,
              "vol",
              `${w.pedido}: volume fora do padrão`,
              [
                `Volume ${v(w.vol)} até agora, ${m(Te, 1)}× o normal para este horário (média de 20 pregões ${v(W)}) · TradingView ${w.atraso ? "15 min" : "tempo real"}`,
              ],
              [w.pedido],
              [qe[w.pedido.slice(0, 4)] || "Setor do ativo"],
              "Volume alto confirma o movimento do dia ou indica notícia.",
              w.pedido + " G",
            );
        });
      const fe = i("agenda").v;
      fe &&
        fe.itens
          .filter(
            (w) =>
              w.atual &&
              R - Date.parse(w.d) < 12 * 36e5 &&
              R >= Date.parse(w.d),
          )
          .forEach((w) => {
            const H =
              /selic|copom|interest rate decision|fed funds|taxa de juros|rate decision/i.test(
                w.t,
              );
            (!H && !(w.imp === 3 && w.sur && w.sur.tom !== "neutro")) ||
              be(
                "eco|" + w.id,
                Date.parse(w.d),
                H ? "bc" : "eco",
                H
                  ? `${w.pais}: decisão de juros (${w.t})`
                  : `${w.pais}: ${w.t} ${w.sur.dir} do esperado`,
                [
                  `${w.t}: saiu ${w.atual} (projeção ${w.prev || "—"}, anterior ${w.ant || "—"}) · ${fe.fonte}, ${g(w.d)}`,
                ],
                [
                  w.pais === "Brasil" ? "IBOV" : "SPX",
                  w.pais === "Brasil" ? "USDBRL" : "DXY",
                ],
                H
                  ? ["Bancos", "Varejo", "Construção", "Juros futuros"]
                  : ["Juros", "Moeda do país"],
                w.sur ? w.sur.efeito : "Decisão de política monetária.",
                "ECO",
              );
          });
      const Fe = i("noticias").v;
      return (
        Fe &&
          Fe.itens
            .filter(
              (w) =>
                R - Date.parse(w.d) < 24 * 36e5 &&
                /resultado|lucro|preju\xedzo|balan\xe7o|receita l\xedquida|earnings|guidance/i.test(
                  w.t,
                ),
            )
            .slice(0, 12)
            .forEach((w) => {
              const H = Object.entries({
                PETR4: /petrobras/i,
                VALE3: /\bvale\b/i,
                ITUB4: /ita\xfa|itau/i,
                BBAS3: /banco do brasil/i,
                BBDC4: /bradesco/i,
                WEGE3: /\bweg\b/i,
                ABEV3: /ambev/i,
                MGLU3: /magalu|magazine/i,
                SUZB3: /suzano/i,
                GGBR4: /gerdau/i,
                EMBR3: /embraer/i,
                B3SA3: /\bb3\b/i,
                PRIO3: /prio\b/i,
              })
                .filter(([, N]) => N.test(w.t))
                .map(([N]) => N)
                .concat(w.t.match(/\b[A-Z]{4}(3|4|11)\b/g) || []);
              H.length &&
                be(
                  "res|" + w.l,
                  Date.parse(w.d),
                  "res",
                  `${H[0]} divulga resultado`,
                  [`“${w.t}” · ${w.f}, ${g(w.d)}`],
                  [...new Set(H)],
                  [
                    ...new Set(
                      H.map((N) => qe[N.slice(0, 4)] || "Setor da empresa"),
                    ),
                  ],
                  "Reação depende do resultado contra o consenso (veja EE).",
                  H[0] + " EE",
                );
            }),
        Fe &&
          Fe.itens
            .filter(
              (w) =>
                R - Date.parse(w.d) < 6 * 36e5 && Me(w) >= 3 && ue(w).length,
            )
            .slice(0, 6)
            .forEach((w) => {
              const H = ue(w);
              be(
                "nt|" + w.l,
                Date.parse(w.d),
                "nt",
                w.t,
                [`${w.f}, ${g(w.d)}`],
                H.map((N) => N[2])
                  .join(", ")
                  .split(/,\s*/)
                  .slice(0, 4),
                H.map((N) => N[1]),
                "Regra automática de impacto: confira a matéria.",
                "N " + w.t.split(" ").slice(0, 4).join(" "),
              );
            }),
        z.sort((w, H) => H.hora - w.hora)
      );
    }
    ((t.evtVisto = t.evtVisto || new Set()),
      (o.EVT = {
        vivo: !0,
        load: ft,
        body: (R, z) => {
          const oe = Le(),
            me = {
              mov: "⚡",
              tec: "📐",
              vol: "📊",
              eco: "📅",
              bc: "🏦",
              res: "📄",
              nt: "📰",
            },
            be = oe.filter((X) => !t.evtVisto.has(X.id));
          return (
            t.evtIni &&
              be.length &&
              toast(`${me[be[0].tipo]} ${be[0].tit}`, 5e3),
            be.forEach((X) => t.evtVisto.add(X.id)),
            (t.evtIni = 1),
            oe.length
              ? oe
                  .map(
                    (
                      X,
                    ) => `<div class="evt"><div class="evt1"><span class="evti">${me[X.tipo] || "•"}</span><b>${u(X.tit)}</b><span class="mut num">${g(X.hora)}</span></div>
    ${X.fatos.map((xe) => `<div class="evt2"><span class="g9tag ok">FATO</span> ${u(xe)}</div>`).join("")}
    <div class="evt2"><span class="g9tag in">POSSÍVEL IMPACTO</span> ${X.ativos.map((xe) => `<span class="g9lk" data-g9g="${u(xe)}">${u(xe)}</span>`).join(" ")} · ${u(X.setores.join(", "))} <em class="mut">(regra automática)</em></div>
    <div class="evt2 mut">${u(X.leitura)}</div><div class="evt3"><button class="g9b" data-g9q="evcmd|${u(X.cmd)}|${z}">Abrir</button><button class="g9b" data-g9q="evia|${u(X.tit + ". " + X.fatos.join(" "))}|${z}">Perguntar à IA</button></div></div>`,
                  )
                  .join("") +
                '<div class="trfont">FATO = número tirado da fonte indicada, com horário · POSSÍVEL IMPACTO = regra automática, não análise · não é recomendação.</div>'
              : '<div class="trnote">Nenhum acontecimento relevante detectado agora. O terminal confere movimentos atípicos (Ibovespa, dólar, Brent e seu monitor), regiões técnicas, volume, decisões de juros, dados com surpresa e resultados.</div>'
          );
        },
      }),
      (s.TM =
        "Máquina do tempo: cotações, notícias, agenda e indicadores de um dia e horário · TM 2026-10-15 14:30"),
      (n.TEMPO = "TM"),
      (n.MAQUINA = "TM"),
      setInterval(() => {
        try {
          if (tab !== "term") return;
          const R = Se.get("diario-term-fotos", []),
            z = R[R.length - 1];
          if (z && Date.now() - z.ts < 15 * 6e4) return;
          const oe = {};
          Object.entries(t.src).forEach(([be, X]) => {
            X.px != null &&
              Date.now() - X.em < 5 * 6e4 &&
              (oe[be.replace(/^.*:/, "")] = [X.px, X.fonte, X.ts]);
          });
          const me = (i("noticias").v || { itens: [] }).itens
            .slice(0, 8)
            .map((be) => [be.t, be.f, be.d]);
          if (!Object.keys(oe).length) return;
          for (R.push({ ts: Date.now(), cot: oe, nt: me }); R.length > 500; )
            R.shift();
          Se.set("diario-term-fotos", R);
        } catch {}
      }, 6e4),
      (t.tm = t.tm || {
        dia: new Date(Date.now() - 864e5 * 7).toISOString().slice(0, 10),
        hora: "14:00",
        ativos: "",
      }));
    const ke = () =>
      (
        t.tm.ativos ||
        "IBOV USDBRL PETR4 VALE3 ITUB4 " +
          ve()
            .filter((R) => /\d$/.test(R))
            .slice(0, 3)
            .join(" ")
      )
        .toUpperCase()
        .split(/[\s,;]+/)
        .filter(Boolean)
        .filter((R, z, oe) => oe.indexOf(R) === z)
        .slice(0, 10);
    async function ze(R, z, oe) {
      const me = e.tec.candAlias(R),
        be = "tm|" + me.a + "|" + z + "|" + oe;
      if (t.dados[be]) return t.dados[be].v;
      try {
        const X = await (
          await rq("/functions/v1/candles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ativo: me.a,
              de: z + "T10:00",
              ate: z + "T18:00",
            }),
          })
        ).json();
        if (X.error) throw new Error(X.error);
        const xe = {
          ...X,
          candles: (X.candles || []).map(($e) => [
            $e[0],
            $e[1] * me.mult,
            $e[2] * me.mult,
            $e[3] * me.mult,
            $e[4] * me.mult,
            $e[5],
          ]),
        };
        return ((t.dados[be] = { ts: Date.now(), v: xe }), xe);
      } catch (X) {
        return ((t.err[be] = String(X.message || X)), null);
      }
    }
    ((o.TM = {
      livre: !0,
      load: async (R) => {
        const z = /(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}:\d{2}))?/.exec(
          R.arg || "",
        );
        z && ((t.tm.dia = z[1]), z[2] && (t.tm.hora = z[2].padStart(5, "0")));
        const oe = t.tm.dia;
        await Promise.all(
          [
            r("noticias", { dia: oe }, 6 * 36e5),
            r("agenda", { dia: oe }, 18e5),
            r("macro", {}, 30 * 6e4),
          ]
            .concat(ke().map((me) => Ie(me, "1d")))
            .concat(ke().map((me) => ze(me, oe, t.tm.hora))),
        );
      },
      body: (R, z) => {
        const { dia: oe, hora: me } = t.tm,
          be = Date.parse(oe + "T" + me + ":00-03:00"),
          X = ke(),
          xe = de(z) < 640,
          $e = `<div class="g9bar tmf"><label>Dia <input class="trin" type="date" data-tm="dia" value="${oe}" max="${new Date().toISOString().slice(0, 10)}"></label><label>Horário <input class="trin" type="time" data-tm="hora" value="${me}"></label><label>Ativos <input class="trin" data-tm="ativos" value="${u(t.tm.ativos || X.join(" "))}" style="width:200px"></label><button class="trbtn on" data-g9q="tmgo||${z}">Viajar</button>${[
            ["−1 dia", -1],
            ["+1 dia", 1],
          ]
            .map(
              ([O, ne]) =>
                `<button class="g9b" data-g9q="tmd|${ne}|${z}">${O}</button>`,
            )
            .join("")}</div>`;
        if (!isFinite(be))
          return $e + '<div class="trnote">Escolha um dia e um horário.</div>';
        const fe = X.map((O) => {
            const ne = se(O, "1d"),
              Ee = t.dados["tm|" + e.tec.candAlias(O).a + "|" + oe + "|" + me],
              Ae = ne ? ne.L : [],
              ge = Ae.findIndex(
                (P) => new Date(P[0] * 1e3).toISOString().slice(0, 10) >= oe,
              ),
              je =
                Ee && Ee.v && Ee.v.candles
                  ? Ee.v.candles.filter((P) => P[0] * 1e3 <= be).pop()
                  : null,
              Ze = ge >= 0 ? Ae[ge] : null,
              He = ge > 0 ? Ae[ge - 1] : null,
              ce = (P) =>
                ge >= 0 && Ae[ge + P]
                  ? (Ae[ge + P][4] / Ze[4] - 1) * 100
                  : null,
              E =
                Ae.length && Ze
                  ? (Ae[Ae.length - 1][4] / Ze[4] - 1) * 100
                  : null;
            return {
              tk: O,
              ic: je,
              dd: Ze,
              ant: He,
              dep1: ce(1),
              dep5: ce(5),
              dep20: ce(20),
              hoje: E,
              int: Ee && Ee.v ? Ee.v.intervalo : "",
            };
          }),
          Fe = b(
            [
              "Ativo",
              `Às ${me}`,
              "Fechamento",
              "Var. do dia",
              "+1 dia",
              "+5 dias",
              "+20 dias",
              "Até hoje",
            ],
            fe.map(
              (O) =>
                `<tr data-g9g="${u(O.tk)}"><td class="tk">${u(O.tk)}</td><td class="num">${O.ic ? m(O.ic[4]) : "—"}${O.ic ? `<em class="mut"> ${new Date(O.ic[0] * 1e3).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</em>` : ""}</td><td class="num">${O.dd ? m(O.dd[4]) : "—"}</td><td class="num ${x(O.dd && O.ant ? O.dd[4] - O.ant[4] : null)}">${O.dd && O.ant ? f((O.dd[4] / O.ant[4] - 1) * 100) : "—"}</td>${[O.dep1, O.dep5, O.dep20, O.hoje].map((ne) => `<td class="num ${x(ne)}">${f(ne)}</td>`).join("")}</tr>`,
            ),
            "tmcot",
          ),
          w = Se.get("diario-term-fotos", [])
            .filter((O) => Math.abs(O.ts - be) <= 30 * 6e4)
            .sort((O, ne) => Math.abs(O.ts - be) - Math.abs(ne.ts - be))[0],
          H = w
            ? `<div class="trsec">Foto do terminal gravada neste aparelho às ${g(w.ts)}</div><div class="trkv">${Object.entries(
                w.cot,
              )
                .slice(0, 14)
                .map(
                  ([O, ne]) =>
                    `<span>${u(O)} <b>${m(ne[0])}</b> <em class="mut">${u(ne[1])}</em></span>`,
                )
                .join("")}</div>`
            : "",
          N = i("noticias", { dia: oe }),
          W = N.v ? N.v.itens : [],
          Te = W.filter((O) => Date.parse(O.d) <= be),
          V = W.filter((O) => Date.parse(O.d) > be),
          ae = (O) =>
            O.slice(0, 25)
              .map(
                (ne) =>
                  `<div class="g9n"><span class="num mut">${h(ne.d)} ${g(ne.d)}</span><span></span><a href="${u(ne.l)}" target="_blank" rel="noopener">${u(ne.t)}</a><span class="am">${u(ne.f)}</span></div>`,
              )
              .join(""),
          ee =
            `<div class="trsec">Notícias publicadas até ${me} (${Te.length})</div>` +
            (N.v
              ? ae(Te) ||
                '<div class="trnote">Nenhuma encontrada no arquivo.</div>'
              : y(N.err)) +
            (V.length
              ? `<details><summary class="trsec" style="cursor:pointer">Publicadas depois (${V.length})</summary>${ae(V)}</details>`
              : ""),
          le = i("agenda", { dia: oe }),
          Y = le.v
            ? le.v.itens.filter((O) => O.d.slice(0, 10) === oe && O.imp >= 2)
            : [],
          q =
            '<div class="trsec">Agenda econômica do dia</div>' +
            (le.v
              ? Y.length
                ? b(
                    ["Hora", "País", "Evento", "Saiu", "Proj.", "Ant.", ""],
                    Y.map(
                      (O) =>
                        `<tr class="${Date.parse(O.d) <= be ? "" : "mut"}"><td class="num">${g(O.d)}</td><td>${u(O.pais)}</td><td>${u(O.t)}</td><td class="num"><b>${u(O.atual || "")}</b></td><td class="num mut">${u(O.prev || "")}</td><td class="num mut">${u(O.ant || "")}</td><td class="mut">${Date.parse(O.d) <= be ? "já tinha saído" : "ainda não"}</td></tr>`,
                    ),
                    "tmag",
                  )
                : '<div class="trnote">Sem eventos importantes nesse dia.</div>'
              : y(le.err)),
          L = i("macro").v,
          F = `<div class="trsec">Indicadores que valiam no dia</div><div class="trkv">${
            (L
              ? L.paises
                  .filter((O) => ["BR", "US"].includes(O.id))
                  .flatMap((O) =>
                    O.itens.map((ne) => {
                      const Ee = (ne.serie || [])
                        .filter((Ae) => String(Ae[0]) <= oe)
                        .pop();
                      return Ee
                        ? `<span>${u(O.nome)} · ${u(ne.nome)} <b>${m(Ee[1], ne.un === "mil" ? 0 : 2)}${ne.un === "%" ? "%" : ""}</b> <em class="mut">${u(String(Ee[0]))}</em></span>`
                        : "";
                    }),
                  )
                  .join("")
              : "") || '<span class="mut">carregando…</span>'
          }</div>`;
        return (
          $e +
          `<div class="tmtit">⏱ ${new Date(be).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div><div class="trsec">Cotações e o que veio depois</div>` +
          Fe +
          H +
          `<div class="${xe ? "" : "tmcols"}"><div>${ee}</div><div>${q}${F}</div></div><div class="trfont">Preço no horário: velas de 5 min (até 58 dias atrás) ou de 60 min (até 2 anos), do Yahoo. Notícias: arquivo do Google Notícias (manchete e link). Agenda: TradingView. A foto aparece quando o terminal estava aberto neste aparelho naquele horário.</div>`
        );
      },
    }),
      (s.ALC =
        "Alertas combinados: média, RSI, suporte/resistência, volume, divergência, resultado, dado econômico"),
      (n.ALERTA = "ALC"),
      (n.ALERTAS2 = "ALC"));
    const Ue = () => {
        const R = S.ax ?? (S.ax = {});
        return (R.alc ?? (R.alc = []), R.alc);
      },
      We = {
        mm: "Preço e média móvel",
        rsi: "RSI",
        sr: "Perto de suporte/resistência",
        vol: "Volume fora do padrão",
        var: "Variação do dia",
        div: "Divergência com outro ativo",
        res: "Resultado divulgado hoje",
        eco: "Dado econômico importante saiu",
      },
      Re = (R) =>
        R.t === "mm"
          ? `preço ${{ acima: "acima da", abaixo: "abaixo da", cruza_cima: "cruza para cima da", cruza_baixo: "cruza para baixo da" }[R.dir]} MM${R.n}`
          : R.t === "rsi"
            ? `RSI ${R.op} ${R.v}`
            : R.t === "sr"
              ? `até ${m(R.dist, 1)}% de suporte/resistência`
              : R.t === "vol"
                ? `volume ≥ ${m(R.x, 1)}× o normal`
                : R.t === "var"
                  ? `variação do dia ${R.op} ${m(R.v, 1)}%`
                  : R.t === "div"
                    ? `diferença ≥ ${m(R.x, 1)} p.p. contra ${R.tk2}`
                    : R.t === "res"
                      ? "resultado divulgado hoje"
                      : "dado econômico importante saiu";
    function K(R) {
      const z = se(R.tk, "1d");
      if (!z || z.L.length < 25) return null;
      const oe = Ke()[R.tk] || {},
        me = Ce(R.tk),
        be = z.L,
        X =
          new Date(be[be.length - 1][0] * 1e3).toDateString() ===
          new Date().toDateString(),
        xe = me || oe.px || be[be.length - 1][4],
        $e = be.map((W) => W[4]);
      X ? ($e[$e.length - 1] = xe) : $e.push(xe);
      const fe = $e.slice(0, -1),
        Fe = X ? be[be.length - 2][4] : be[be.length - 1][4],
        w = (xe / Fe - 1) * 100,
        H = (W, Te) =>
          W.length >= Te
            ? W.slice(-Te).reduce((V, ae) => V + ae, 0) / Te
            : null,
        N = R.c.map((W) => {
          if (W.t === "mm") {
            const Te = H($e, W.n),
              V = H(fe, W.n),
              ae = fe[fe.length - 1];
            return Te == null
              ? !1
              : W.dir === "acima"
                ? xe > Te
                : W.dir === "abaixo"
                  ? xe < Te
                  : W.dir === "cruza_cima"
                    ? ae <= V && xe > Te
                    : ae >= V && xe < Te;
          }
          if (W.t === "rsi") {
            const Te = Be($e),
              V = Te[Te.length - 1];
            return V != null && (W.op === "<" ? V < W.v : V > W.v);
          }
          if (W.t === "sr") {
            const Te = J(be, xe);
            return (
              !!Te &&
              Te.niv
                .filter((V) => /Suporte|Resist/.test(V.tipo))
                .some((V) => Math.abs(V.dist) <= W.dist)
            );
          }
          if (W.t === "var") return W.op === ">" ? w > W.v : w < W.v;
          if (W.t === "div") {
            const Te = se(W.tk2, "1d");
            if (!Te) return null;
            const V = Te.L,
              ae = Ce(W.tk2) || (Ke()[W.tk2] || {}).px || V[V.length - 1][4],
              ee =
                new Date(V[V.length - 1][0] * 1e3).toDateString() ===
                new Date().toDateString(),
              le = ee ? V[V.length - 2][4] : V[V.length - 1][4];
            return Math.abs(w - (ae / le - 1) * 100) >= W.x;
          }
          if (W.t === "vol") {
            if (!X || !oe) return null;
            const Te = be
                .slice(-21, -1)
                .map((le) => le[5])
                .filter((le) => le > 0),
              V = Te.reduce((le, Y) => le + Y, 0) / Te.length,
              ae = new Date(),
              ee = Math.max(
                0.15,
                Math.min(1, (ae.getHours() * 60 + ae.getMinutes() - 600) / 420),
              );
            return be[be.length - 1][5] / (V * ee) >= W.x;
          }
          return null;
        });
      return {
        r: N,
        ok: R.lg === "ou" ? N.some((W) => W === !0) : N.every((W) => W === !0),
        px: xe,
        d1: w,
      };
    }
    t.alcNovo = t.alcNovo || {
      tk: "PETR4",
      nome: "",
      lg: "e",
      c: [
        { t: "mm", n: 20, dir: "cruza_cima" },
        { t: "vol", x: 1.5 },
      ],
    };
    const pe = (R, z) => {
      const oe = (xe, $e, fe) =>
          `<select class="trin" data-alc="${z}|${xe}">${$e.map(([Fe, w]) => `<option value="${Fe}"${String(fe) === String(Fe) ? " selected" : ""}>${w}</option>`).join("")}</select>`,
        me = (xe, $e, fe) =>
          `<input class="trin" type="number" step="${fe || 1}" data-alc="${z}|${xe}" value="${$e}" style="width:72px">`,
        be = oe("t", Object.entries(We), R.t),
        X =
          R.t === "mm"
            ? oe(
                "dir",
                [
                  ["cruza_cima", "cruza para cima"],
                  ["cruza_baixo", "cruza para baixo"],
                  ["acima", "acima"],
                  ["abaixo", "abaixo"],
                ],
                R.dir,
              ) +
              " MM " +
              me("n", R.n || 20)
            : R.t === "rsi"
              ? oe(
                  "op",
                  [
                    ["<", "abaixo de"],
                    [">", "acima de"],
                  ],
                  R.op,
                ) + me("v", R.v ?? 30)
              : R.t === "sr"
                ? "até " + me("dist", R.dist ?? 1, 0.1) + "%"
                : R.t === "vol"
                  ? me("x", R.x ?? 2, 0.1) + "× a média"
                  : R.t === "var"
                    ? oe(
                        "op",
                        [
                          [">", "maior que"],
                          ["<", "menor que"],
                        ],
                        R.op,
                      ) +
                      me("v", R.v ?? 3, 0.1) +
                      "%"
                    : R.t === "div"
                      ? `contra <input class="trin" data-alc="${z}|tk2" value="${u(R.tk2 || "PETR3")}" style="width:80px"> diferença ≥ ` +
                        me("x", R.x ?? 2, 0.1) +
                        " p.p."
                      : "";
      return `<div class="alcc">${be} ${X}<button class="trx" data-g9q="alcrm|${z}|0">✕</button></div>`;
    };
    if (
      ((o.ALC = {
        vivo: !1,
        load: async () => {
          const R = [
            ...new Set(
              Ue()
                .flatMap((z) => [
                  z.tk,
                  ...z.c.filter((oe) => oe.t === "div").map((oe) => oe.tk2),
                ])
                .concat([t.alcNovo.tk]),
            ),
          ].slice(0, 12);
          await Promise.all(
            R.map((z) => Ie(z, "1d")).concat([r("cot", { s: R }, 15e3)]),
          );
        },
        body: (R, z) => {
          const oe = Ue(),
            me = t.alcNovo,
            be = `<div class="alcf"><div class="trsec">Novo alerta combinado</div><div class="trrow"><label>Ativo <input class="trin" data-alc="tk" value="${u(me.tk)}" style="width:90px"></label><label>Nome <input class="trin" data-alc="nome" value="${u(me.nome)}" placeholder="ex.: rompimento com volume" style="width:190px"></label>${`<select class="trin" data-alc="lg"><option value="e"${me.lg === "e" ? " selected" : ""}>todas as condições</option><option value="ou"${me.lg === "ou" ? " selected" : ""}>qualquer condição</option></select>`}</div>
    ${me.c.map(($e, fe) => pe($e, fe)).join("")}<div class="trrow"><button class="g9b" data-g9q="alcadd||${z}">+ condição</button><button class="trbtn on" data-g9q="alcsalva||${z}">Criar alerta</button></div></div>`,
            X = oe.length
              ? oe
                  .map(($e) => {
                    const fe = K($e);
                    return `<div class="alci${$e.on === !1 ? " off" : ""}"><div class="g9c1"><b class="tk" data-g9g="${u($e.tk)}">${u($e.tk)}</b><span>${u($e.nome || "alerta combinado")}</span><span class="${fe && fe.ok ? "tg" : "mut"}">${fe ? (fe.ok ? "● condições atendidas agora" : "○ ainda não") : "…"}</span></div>
    <div class="g9c3">${$e.c.map((Fe, w) => `<span class="alcst ${fe && fe.r[w] === !0 ? "s" : fe && fe.r[w] === !1 ? "n" : ""}">${fe && fe.r[w] === !0 ? "✓" : fe && fe.r[w] === !1 ? "✗" : "?"} ${u(Re(Fe))}</span>`).join($e.lg === "ou" ? " <b>ou</b> " : " <b>e</b> ")}</div>
    <div class="evt3"><button class="g9b" data-g9q="alcon|${u($e.id)}|${z}">${$e.on === !1 ? "Ativar" : "Pausar"}</button><button class="g9b" data-g9q="alcdel|${u($e.id)}|${z}">Excluir</button></div></div>`;
                  })
                  .join("")
              : '<div class="trnote">Nenhum alerta combinado ainda.</div>',
            xe = ((S.ax || {}).alpx || []).filter(($e) => !$e.fired);
          return (
            be +
            `<div class="trsec">Seus alertas combinados (${oe.length}/10)</div>` +
            X +
            `<div class="trsec">Alertas de preço (${xe.length})</div>` +
            (xe.length
              ? xe
                  .map(
                    ($e) =>
                      `<div class="g9li"><b class="tk">${u($e.c)}</b> ${$e.op === ">" ? "acima de" : "abaixo de"} ${m($e.v)} <em class="mut">${u($e.orig || "")}</em></div>`,
                  )
                  .join("")
              : '<div class="trnote">Nenhum. Crie pelo 🔔 nos gráficos ou em ALRT.</div>') +
            '<div class="trfont">O servidor confere os alertas combinados a cada 5 minutos no pregão (10h às 18h15), com o app fechado, e manda no celular uma vez por dia por alerta. Média e RSI usam velas diárias; o preço vem do Profit quando ele está ligado, senão do Yahoo (15 min). O estado "agora" é calculado aqui no app.</div>'
          );
        },
      }),
      typeof npComTurno == "function")
    ) {
      const R = npComTurno;
      npComTurno = function () {
        const z = R.apply(this, arguments);
        try {
          z.alc = Ue()
            .filter((oe) => oe.on !== !1)
            .slice(0, 10)
            .map((oe) => ({
              id: oe.id,
              tk: oe.tk,
              nome: oe.nome,
              lg: oe.lg,
              c: oe.c,
            }));
        } catch {}
        return z;
      };
    }
    ((s.AUD =
      "Auditoria: de onde veio cada preço, quando chegou e o que foi enviado à IA · AUD PETR4 · AUD IA"),
      (n.AUDIT = "AUD"),
      (n.LOG = "AUD"),
      (t.audSel = t.audSel || null),
      (o.AUD = {
        livre: !0,
        vivo: !1,
        body: (R, z) => {
          const oe = String(R.arg || "")
              .trim()
              .toUpperCase(),
            me = oe === "IA" ? "ia" : oe === "LOG" ? "log" : oe ? "tk" : "res",
            be = `<div class="g9bar">${[
              ["", "Resumo"],
              ["IA", "IA"],
              ["LOG", "Integrações"],
            ]
              .map(
                ([xe, $e]) =>
                  `<button class="g9b${(me === "res" && !xe) || (xe && oe === xe) ? " on" : ""}" data-g9q="aud|${xe}|${z}">${$e}</button>`,
              )
              .join(
                "",
              )}<input class="trin g9cmp" data-g9aud="${z}" placeholder="Ativo (Enter)" value="${me === "tk" ? u(oe) : ""}"></div>`;
          if (me === "tk") {
            const xe = Object.keys(t.audQ).find(
                (fe) => fe.replace(/^.*:/, "") === oe || fe === oe,
              ),
              $e = xe ? t.audQ[xe] : [];
            return (
              be +
              `<div class="trsec">${u(oe)}: preços recebidos (${$e.length})</div>` +
              ($e.length
                ? b(
                    [
                      "Preço",
                      "Fonte",
                      "Horário do dado",
                      "Chegou ao app",
                      "Atraso",
                      "Modo",
                    ],
                    $e.map(
                      (fe) =>
                        `<tr><td class="num"><b>${m(fe.px)}</b></td><td>${u(fe.fonte)}</td><td class="num">${Ve(fe.dado)}</td><td class="num">${Ve(fe.chegou)}</td><td class="num">${fe.dado ? Math.max(0, Math.round((fe.chegou - fe.dado) / 1e3)) + " s" : "—"}</td><td>${fe.rt ? '<span class="trsrc rt">tempo real</span>' : '<span class="trsrc dl">atrasado</span>'}</td></tr>`,
                    ),
                    "audq",
                  )
                : '<div class="trnote">Nada registrado para este ativo. Abra-o num painel (MON, G…) e os preços passam a ser gravados.</div>')
            );
          }
          if (me === "ia") {
            const xe = t.audIA,
              $e = xe.find((fe) => fe.id === t.audSel);
            return (
              be +
              b(
                [
                  "Quando",
                  "Função",
                  "Modelo",
                  "Duração",
                  "Enviado",
                  "Resultado",
                ],
                xe.map(
                  (fe) =>
                    `<tr class="${fe.id === t.audSel ? "eu" : ""}" data-g9q="audia|${fe.id}|${z}" style="cursor:pointer"><td class="num">${Ve(fe.ts)}</td><td>${u(fe.modo)}</td><td>${u([fe.ia, fe.modelo].filter(Boolean).join(" · ") || "—")}</td><td class="num">${fe.ms != null ? m(fe.ms / 1e3, 1) + " s" : "—"}</td><td class="num">${m(fe.tam / 1024, 1)} KB</td><td class="${fe.erro ? "tr" : "tg"}">${fe.erro ? u(fe.erro) : "ok" + (fe.gerado ? " · " + u(String(fe.gerado).slice(0, 19).replace("T", " ")) : "")}</td></tr>`,
                ),
                "audia",
              ) +
              ($e
                ? `<div class="trsec">Enviado à IA em ${Ve($e.ts)} (${u($e.modo)})</div><pre class="audpre">${u(Q($e.enviado))}</pre><div class="trsec">Resposta${$e.versao ? " · versão " + u($e.versao) : ""}</div><pre class="audpre">${u(Q($e.resposta || ""))}</pre>`
                : '<div class="trnote">Toque numa linha para ver exatamente o que foi enviado e o que voltou.</div>')
            );
          }
          if (me === "log")
            return (
              be +
              (t.log.length
                ? t.log
                    .slice(0, 120)
                    .map(
                      (xe) =>
                        `<div class="g9log"><span class="num mut">${Ve(xe.ts)}</span><span class="g9dot ${xe.ok ? "vd" : "vm"}"></span><b>${u(xe.fonte)}</b> ${u(xe.msg)}</div>`,
                    )
                    .join("")
                : '<div class="trnote">Nada registrado.</div>')
            );
          const X = Object.keys(t.audQ)
            .sort(
              (xe, $e) =>
                (t.audQ[$e][0] || {}).chegou - (t.audQ[xe][0] || {}).chegou,
            )
            .slice(0, 30);
          return (
            be +
            '<div class="trsec">Último preço de cada ativo</div>' +
            (X.length
              ? b(
                  [
                    "Ativo",
                    "Preço",
                    "Fonte",
                    "Horário do dado",
                    "Chegou",
                    "Registros",
                  ],
                  X.map((xe) => {
                    const $e = t.audQ[xe][0];
                    return `<tr data-g9q="audtk|${u(xe.replace(/^.*:/, ""))}|${z}" style="cursor:pointer"><td class="tk">${u(xe.replace(/^.*:/, ""))}</td><td class="num">${m($e.px)}</td><td>${u($e.fonte)}</td><td class="num">${Ve($e.dado)}</td><td class="num">${Ve($e.chegou)}</td><td class="num">${t.audQ[xe].length}</td></tr>`;
                  }),
                  "audres",
                )
              : '<div class="trnote">Ainda sem preços registrados.</div>') +
            '<div class="trsec">Últimas chamadas à IA</div>' +
            (t.audIA
              .slice(0, 5)
              .map(
                (xe) =>
                  `<div class="g9li" data-g9q="audia|${xe.id}|${z}" style="cursor:pointer">${Ve(xe.ts)} · <b>${u(xe.modo)}</b> · ${u(xe.modelo || xe.ia || "")} · ${xe.erro ? '<span class="tr">erro</span>' : "ok"}</div>`,
              )
              .join("") || '<div class="trnote">Nenhuma.</div>') +
            '<div class="trfont">Tudo fica guardado neste aparelho: últimos 40 preços de até 80 ativos e as últimas 25 chamadas à IA (com o texto enviado).</div>'
          );
        },
      }));
    const Q = (R) => {
        try {
          return JSON.stringify(JSON.parse(R), null, 1);
        } catch {
          return R;
        }
      },
      re = (R) => ({
        n: "Ativo: " + R,
        p: [R + " G", R + " Q", "N " + R, R + " FA", "IA " + R],
        t: [
          [R + " G", R + " G 15M", "COMP " + R + " IBOV"],
          [R + " Q", R + " DES", R + " ANR", R + " DVD", R + " EE"],
          ["N " + R, "AUD " + R],
          [R + " FA", R + " RV", R + " OMON"],
          null,
        ],
        g: [
          { x: 0, y: 0, w: 7, h: 17 },
          { x: 7, y: 0, w: 5, h: 10 },
          { x: 7, y: 10, w: 5, h: 7 },
          { x: 0, y: 17, w: 7, h: 9 },
          { x: 7, y: 17, w: 5, h: 9 },
        ],
      });
    window.trAtivo = (R) => {
      if (!/^[A-Z0-9.!]{3,12}$/.test(R) || window.TRPOP) return !1;
      const z = a();
      return (
        z.ws !== "atv" && (t.wsAnt = z.ws),
        (z.wss.atv = re(R)),
        (z.ws = "atv"),
        (t.foco = 0),
        (t.mob = 0),
        (t.max = -1),
        save(),
        render(),
        !0
      );
    };
    let ie = 0;
    document.addEventListener("input", (R) => {
      if (!R.target || R.target.id !== "trcmd") return;
      const z = String(R.target.value || "")
        .trim()
        .toUpperCase();
      (clearTimeout(ie),
        !(!/^[A-Z0-9.]{2,12}$/.test(z) || s[z]) &&
          (ie = setTimeout(async () => {
            const oe = [...new Set(ve().concat(a().mon || []))]
                .filter((X) => X.startsWith(z))
                .slice(0, 4)
                .map((X) => ({ tk: X, n: "do seu monitor", bolsa: "" })),
              me = (X) => {
                const xe = document.getElementById("trsug");
                !xe ||
                  String(document.getElementById("trcmd").value || "")
                    .trim()
                    .toUpperCase() !== z ||
                  (xe.querySelectorAll(".trsa").forEach(($e) => $e.remove()),
                  xe.insertAdjacentHTML(
                    "afterbegin",
                    X.map(
                      ($e) =>
                        `<button class="trsa" data-trsug="${u($e.tk)}"><b>${u($e.tk)}</b> ${u($e.n)} <em>${u($e.bolsa)}</em></button>`,
                    ).join(""),
                  ),
                  X.length && (xe.hidden = !1));
              };
            me(oe);
            const be = await r("busca", { q: z }, 864e5);
            be &&
              be.itens &&
              me(
                oe.concat(
                  be.itens
                    .filter((X) => !oe.some((xe) => xe.tk === X.tk))
                    .slice(0, 6)
                    .map((X) => ({
                      tk: X.tk,
                      n: X.n,
                      bolsa: [X.bolsa, X.tipo].filter(Boolean).join(" · "),
                    })),
                ),
              );
          }, 250)));
    });
    try {
      const R = new URL(location.href),
        z = R.searchParams.get("pop");
      if (z) {
        ((window.TRPOP = {
          n: "Janela",
          p: [z.slice(0, 80)],
          g: [{ x: 0, y: 0, w: 12, h: 26 }],
          t: null,
        }),
          document.body.classList.add("trpop"),
          (t.max = 0));
        const oe = window.save;
        try {
          save = function () {};
        } catch {}
        setTimeout(() => {
          (irPara("term"));
        }, 400);
      }
    } catch {}
    (document.addEventListener(
      "keydown",
      (R) => {
        if (tab !== "term") return;
        const z = document.getElementById("trcmd");
        if ((R.ctrlKey || R.metaKey) && R.key.toLowerCase() === "k") {
          (R.preventDefault(), z && (z.focus(), z.select()));
          return;
        }
        if (R.altKey && /^[1-9]$/.test(R.key)) {
          const me = +R.key - 1;
          me < C().p.length &&
            (R.preventDefault(),
            (t.foco = me),
            (t.mob = me),
            I()
              ? document
                  .querySelectorAll(".trp")
                  .forEach((be, X) => be.classList.toggle("foco", X === me))
              : render());
          return;
        }
        if (R.key === "Escape" && t.max >= 0 && document.activeElement !== z) {
          ((t.max = -1), render());
          return;
        }
        if (
          R.key === "Escape" &&
          document.activeElement === z &&
          !z.value &&
          a().ws === "atv" &&
          t.wsAnt
        ) {
          ((a().ws = t.wsAnt), render());
          return;
        }
        const oe = { F3: "EVT", F4: "ALC", F6: "TM", F7: "DQ" }[R.key];
        oe && (R.preventDefault(), A(oe));
      },
      !0,
    ),
      document.addEventListener("dblclick", (R) => {
        if (tab !== "term") return;
        const z = R.target.closest && R.target.closest(".trph");
        if (!z || R.target.closest("button")) return;
        const oe = +z.closest(".trp").dataset.trp;
        ((t.max = t.max === oe ? -1 : oe), render());
      }));
    {
      const R = window.vTerm;
      window.vTerm = function () {
        try {
          if (typeof GO < "u" && GO.r === "alc") {
            GO.r = null;
            const z = C();
            z.p.includes("ALC") || ((z.p[0] = "ALC"), z.t && (z.t[0] = null));
          }
        } catch {}
        return R.apply(this, arguments);
      };
    }
    (document.addEventListener(
      "click",
      async (R) => {
        if (tab !== "term") return;
        const z = R.target.closest && R.target.closest("[data-g9q]");
        if (!z) return;
        R.stopPropagation();
        const [oe, me, be] = z.dataset.g9q.split("|"),
          X = +be;
        if (oe === "dqf") {
          ((t.dqF.st = me), j(X));
          return;
        }
        if (oe === "dqres" || oe === "dqign") {
          const xe = Object.keys(t.dqSel).filter(($e) => t.dqSel[$e]);
          if (!xe.length) return toast("Marque um ou mais problemas.");
          (xe.forEach(($e) => {
            const fe = t.dq.iss[$e];
            fe &&
              ((fe.st = oe === "dqres" ? "resolvido" : "ignorado"),
              (fe.resolv = Date.now()),
              (fe.manual = 1));
          }),
            (t.dqSel = {}),
            Se.set("diario-term-dq", t.dq),
            j(X));
          return;
        }
        if (oe === "evcmd") {
          A(me, Qe(X));
          return;
        }
        if (oe === "evia") {
          A(
            "ASKB " +
              me +
              " O que isso pode significar para o mercado? Separe fato de interpretação.",
            Qe(X),
          );
          return;
        }
        if (oe === "tmgo") {
          (k(X), j(X));
          return;
        }
        if (oe === "tmd") {
          const xe = new Date(t.tm.dia + "T12:00:00Z");
          (xe.setUTCDate(xe.getUTCDate() + +me),
            xe <= new Date() && (t.tm.dia = xe.toISOString().slice(0, 10)),
            j(X),
            k(X));
          return;
        }
        if (oe === "alcadd") {
          (t.alcNovo.c.length < 5 &&
            t.alcNovo.c.push({ t: "rsi", op: "<", v: 30 }),
            j(X));
          return;
        }
        if (oe === "alcrm") {
          (t.alcNovo.c.splice(+me, 1), j(X));
          return;
        }
        if (oe === "alcsalva") {
          const xe = t.alcNovo,
            $e = String(xe.tk || "")
              .trim()
              .toUpperCase();
          if (!/^[A-Z0-9.!]{3,12}$/.test($e)) return toast("Informe o ativo.");
          if (!xe.c.length) return toast("Adicione uma condição.");
          const fe = Ue();
          if (fe.length >= 10) return toast("Máximo de 10 alertas combinados.");
          (fe.push({
            id: "c" + Date.now().toString(36),
            tk: $e,
            nome: xe.nome || xe.c.map(Re).join(" + "),
            lg: xe.lg,
            c: JSON.parse(JSON.stringify(xe.c)),
            on: !0,
            em: Date.now(),
          }),
            save());
          try {
            turnoPushSync(!0);
          } catch {}
          (toast(
            "Alerta combinado criado. O servidor confere a cada 5 min no pregão.",
          ),
            k(X),
            j(X));
          return;
        }
        if (oe === "alcon") {
          const xe = Ue().find(($e) => $e.id === me);
          if (xe) {
            ((xe.on = xe.on === !1), save());
            try {
              turnoPushSync(!0);
            } catch {}
          }
          j(X);
          return;
        }
        if (oe === "alcdel") {
          const xe = S.ax;
          ((xe.alc = Ue().filter(($e) => $e.id !== me)), save());
          try {
            turnoPushSync(!0);
          } catch {}
          j(X);
          return;
        }
        if (oe === "aud") {
          const xe = C();
          ((xe.p[X] = ("AUD " + me).trim()), save(), j(X));
          return;
        }
        if (oe === "audtk") {
          const xe = C();
          ((xe.p[X] = "AUD " + me), save(), j(X));
          return;
        }
        if (oe === "audia") {
          t.audSel = me;
          const xe = C();
          (xe.p[X] !== "AUD IA" && ((xe.p[X] = "AUD IA"), save()), j(X));
          return;
        }
      },
      !0,
    ),
      document.addEventListener(
        "change",
        (R) => {
          const z = R.target;
          if (!(!z || !z.dataset || tab !== "term")) {
            if (z.dataset.dqk) {
              t.dqSel[z.dataset.dqk] = z.checked;
              return;
            }
            if (z.dataset.tm) {
              t.tm[z.dataset.tm] = String(z.value || "").trim();
              return;
            }
            if (z.dataset.alc) {
              const [oe, me] = z.dataset.alc.split("|"),
                be = t.alcNovo;
              if (me == null) {
                be[oe] = oe === "tk" ? String(z.value).toUpperCase() : z.value;
                return;
              }
              const X = be.c[+oe];
              if (!X) return;
              if (me === "t") {
                be.c[+oe] = {
                  t: z.value,
                  ...{
                    mm: { n: 20, dir: "cruza_cima" },
                    rsi: { op: "<", v: 30 },
                    sr: { dist: 1 },
                    vol: { x: 2 },
                    var: { op: ">", v: 3 },
                    div: { tk2: "PETR3", x: 2 },
                    res: {},
                    eco: {},
                  }[z.value],
                };
                const xe = z.closest("[data-trp]");
                xe && j(+xe.dataset.trp);
                return;
              }
              X[me] = ["n", "v", "dist", "x"].includes(me)
                ? +String(z.value).replace(",", ".")
                : me === "tk2"
                  ? String(z.value).toUpperCase()
                  : z.value;
            }
          }
        },
        !0,
      ),
      document.addEventListener(
        "keydown",
        (R) => {
          if (
            !(R.key !== "Enter" || !R.target || R.target.dataset == null) &&
            R.target.dataset.g9aud != null
          ) {
            R.preventDefault();
            const z = +R.target.dataset.g9aud,
              oe = String(R.target.value || "")
                .trim()
                .toUpperCase(),
              me = C();
            ((me.p[z] = oe ? "AUD " + oe : "AUD"), save(), j(z));
          }
        },
        !0,
      ));
    {
      const R = TraderStyles.slot("legacy-114");
      ((R.id = "term192"),
        (R.textContent = TraderStyles.css("legacy-114")),
        TraderStyles.mount(R));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e) return;
    const { TR: t } = e;
    window.trFhErro = (s) => (
      (s = String(s || "").trim()),
      s
        ? /^(live|test)_/i.test(s)
          ? "Essa chave é da FinImpulse (app.finimpulse.com), não do Finnhub. O terminal usa o Finnhub: crie a chave grátis em finnhub.io → Get free API key."
          : /\s/.test(s) || s.length < 15 || s.length > 50
            ? "Isso não parece uma chave do Finnhub (ela tem uns 20 letras e números, sem espaços). Copie de finnhub.io/dashboard."
            : ""
        : ""
    );
    let a = null;
    (addEventListener("beforeinstallprompt", (s) => {
      (s.preventDefault(), (a = s));
      try {
        render();
      } catch {}
    }),
      addEventListener("appinstalled", () => {
        a = null;
        try {
          toast(
            "Diário de Trader instalado. Abra pelo ícone da área de trabalho.",
          );
        } catch {}
      }));
    const o = () => {
      try {
        return (
          matchMedia("(display-mode: standalone)").matches ||
          navigator.standalone === !0
        );
      } catch {
        return !1;
      }
    };
    window.trInstalar = async () => {
      if (a) {
        a.prompt();
        try {
          await a.userChoice;
        } catch {}
        a = null;
        return;
      }
      const s = navigator.userAgent,
        n = /Safari/.test(s) && !/Chrome|Chromium|Edg/.test(s);
      alert(
        n
          ? "Para instalar no Mac (Safari): menu Arquivo → Adicionar ao Dock."
          : `Para instalar no PC (Chrome ou Edge):

1. Clique no ícone de instalar no fim da barra de endereço (um monitor com seta), ou
2. Menu ⋮ → "Transmitir, salvar e compartilhar" → "Instalar página como app" (no Edge: ⋯ → Aplicativos → Instalar este site como aplicativo).

Depois ele abre em janela própria, sem a barra do navegador, com ícone na área de trabalho e na barra de tarefas. As atualizações chegam sozinhas.`,
      );
    };
    {
      const s = render0;
      render0 = function () {
        const n = s.apply(this, arguments);
        try {
          if (tab === "term" && !o() && innerWidth >= 980) {
            const r = document.querySelector('.trbar [data-tr="sair"]');
            r &&
              !document.querySelector(".trinst") &&
              r.insertAdjacentHTML(
                "beforebegin",
                '<button class="trbtn trinst" onclick="trInstalar()" title="Instalar o Diário de Trader como aplicativo no computador">⬇ Instalar no PC</button>',
              );
          }
        } catch {}
        return n;
      };
    }
    {
      const s = TraderStyles.slot("legacy-115");
      ((s.textContent = TraderStyles.css("legacy-115")), TraderStyles.mount(s));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e || !e.tec || !window.trChecagens) return;
    const {
        TR: t,
        TS: a,
        EXT: o,
        FN: s,
        ALIAS: n,
        trFn: r,
        trGet: i,
        profitDe: l,
        melhorPx: d,
        srcTag: c,
        logF: p,
        esc2: u,
        nf: m,
        pc: f,
        tabela: x,
        pinta: v,
        layAtual: g,
        roda: h,
      } = e,
      { lista: b, larg: y } = e.tec,
      j = (Me) => {
        if (!Me) return "—";
        const ue = Math.round((Date.now() - Me) / 1e3);
        return ue < 60
          ? ue + " s"
          : ue < 3600
            ? Math.round(ue / 60) + " min"
            : ue < 86400
              ? Math.round(ue / 3600) + " h"
              : Math.round(ue / 86400) + " d";
      },
      k = () => {
        const Me = new Date(),
          ue = Me.getDay(),
          ve = Me.getHours() + Me.getMinutes() / 60;
        return ue > 0 && ue < 6 && ve >= 10 && ve < 18;
      };
    ((s.DQ =
      "DATA CENTER: integridade, fontes, divergências, atrasos e validação antes da IA"),
      Object.assign(n, { DC: "DQ", DATACENTER: "DQ", DATA: "DQ" }));
    const A = () =>
      [...new Set(b().concat(a().mon || []))]
        .filter((Me) => !/FUT$/.test(Me))
        .slice(0, 12);
    function C(Me) {
      const ue = [];
      return (
        Object.values(t.audQ || {}).forEach((ve) => {
          const he = ve.filter((we) => we.fonte === Me);
          for (let we = 0; we < he.length - 1 && we < 10; we++) {
            const Be = he[we].chegou - he[we + 1].chegou;
            Be > 0 && Be < 36e5 && ue.push(Be);
          }
        }),
        ue.length
          ? (ue.sort((ve, he) => ve - he), ue[Math.floor(ue.length / 2)])
          : null
      );
    }
    const I = (Me) =>
      Me == null
        ? "—"
        : Me < 6e4
          ? "~" + Math.round(Me / 1e3) + " s"
          : "~" + Math.round(Me / 6e4) + " min";
    function J() {
      const Me = i("valida", { s: A() }).v,
        ue = window.trTvCache();
      return A().map((ve) => {
        const he = l(ve),
          we = ue[ve],
          Be = (Me && Me.itens[ve]) || {},
          Ge = Be.brapi,
          Ce = Be.twelve,
          Qe = [
            ["Profit", he && he.px, he && he.up],
            ["TradingView", we && we.px, we && we.em],
            ["brapi", Ge && Ge.px, Ge && Date.parse(Ge.em)],
            ["Twelve Data", Ce && Ce.px, Ce && Date.parse(Ce.em)],
          ].filter((Xe) => Xe[1] > 0);
        if (Qe.length < 2)
          return {
            tk: ve,
            L: Qe,
            dif: null,
            vered: Qe.length ? "uma fonte só" : "sem dados",
          };
        const de = Qe.map((Xe) => Xe[1]).sort((Xe, ot) => Xe - ot),
          Se = de[Math.floor(de.length / 2)],
          Ve = Math.max(...Qe.map((Xe) => Math.abs(Xe[1] / Se - 1) * 100)),
          Je = we && we.atraso ? 1.5 : 0.4,
          Ye = Qe.filter((Xe) => Math.abs(Xe[1] / Se - 1) * 100 > Je).map(
            (Xe) => Xe[0],
          );
        return {
          tk: ve,
          L: Qe,
          dif: Ve,
          vered: Ye.length
            ? Qe.length >= 3 && Ye.length === 1
              ? Ye[0] + " fora do consenso"
              : "divergente"
            : "ok",
          tol: Je,
        };
      });
    }
    function se() {
      const Me = t.fst,
        ue = (de) => Me["srv:" + de],
        ve = (de, Se) =>
          `<span class="g9dot ${de === !0 ? "vd" : de === !1 ? "vm" : de === "a" ? "am" : "cz"}"></span>${Se}`,
        he = i("valida", { s: A() }).v,
        we = t.pf || {},
        Be = we.todas || [],
        Ge = Be.length ? Math.max(...Be.map((de) => de.up)) : 0,
        Ce = t.ws,
        Qe = t.fh;
      return [
        [
          "Ponte do Profit",
          "B3 ao vivo: cotações, grade de opções",
          "PC → tabela cotacoes (Supabase) → app a cada 3 s",
          I(C("Profit")),
          "nenhum",
          "MON, gráficos, alertas, carteira, IA",
          Be.length
            ? Date.now() - Ge < 12e4
              ? ve(!0, "ao vivo")
              : ve(k() ? !1 : "a", "parada há " + j(Ge))
            : ve(null, "sem dados"),
        ],
        [
          "TradingView (screener)",
          "cotações, múltiplos, setores, mapa, DI e juros",
          'servidor "terminal"',
          "a cada pedido (cache 15–30 s)",
          "0 a 15 min (por bolsa)",
          "quase tudo",
          ue("cot")
            ? ve(ue("cot").ok, ue("cot").ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "Yahoo Finance",
          "velas, balanços, analistas, resultados",
          'servidores "candles" e "terminal"',
          "cache 2–10 min",
          "até 15 min",
          "gráficos, TECH, FA, ANR, EE, máquina do tempo",
          Me.candles
            ? ve(Me.candles.ok, Me.candles.ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "Binance",
          "cripto",
          "direto no app (WebSocket)",
          "contínuo",
          "nenhum",
          "CRYP, faixa do topo",
          Ce && Ce.readyState === 1
            ? ve(!0, "conectada")
            : ve(!1, "desconectada"),
        ],
        [
          "Finnhub",
          "ações dos EUA",
          "direto no app (WebSocket)",
          "contínuo",
          "nenhum",
          "MON (ações dos EUA)",
          a().fh
            ? Qe && Qe.readyState === 1
              ? ve(!0, "conectado")
              : ve(!1, "desconectado")
            : ve(null, "sem chave"),
        ],
        [
          "brapi",
          "B3 (validação e contingência)",
          'servidor "terminal" (segredo BRAPI_TOKEN)',
          "cache 60 s",
          "~15 min",
          "DATA CENTER, reserva quando o TradingView falha",
          he
            ? he.brapi
              ? ve(!0, "configurada")
              : ve(null, "não configurada")
            : ve(null, "—"),
        ],
        [
          "Twelve Data",
          "EUA e moedas (validação e contingência)",
          'servidor "terminal" (segredo TWELVE_API_KEY)',
          "cache 60 s",
          "tempo real a 15 min",
          "DATA CENTER, reserva quando o TradingView falha",
          he
            ? he.twelve
              ? ve(!0, "configurada")
              : ve(null, "não configurada")
            : ve(null, "—"),
        ],
        [
          "Banco Central (SGS, Focus) e DI",
          "Selic, CDI, IPCA, Focus, Copom implícito",
          'servidor "terminal"',
          "diário (DI 15 min)",
          "1 dia",
          "ECST, ECFC, WIRP, IA",
          ue("copom")
            ? ve(ue("copom").ok, ue("copom").ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "FRED, BIS, OCDE, Eurostat",
          "macro de 6 países",
          'servidor "terminal"',
          "cache 30 min",
          "dias a semanas (publicação)",
          "ECST, mapa, IA",
          ue("macro")
            ? ve(ue("macro").ok, ue("macro").ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "Calendário (TradingView)",
          "agenda com o número divulgado",
          'servidor "terminal" e "notificar"',
          "1 min",
          "minutos",
          "ECO, EVT, alertas",
          ue("agenda")
            ? ve(ue("agenda").ok, ue("agenda").ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "Tesouro Direto",
          "títulos públicos",
          'servidor "terminal"',
          "cache 5 min",
          "minutos",
          "TD",
          ue("titulos")
            ? ve(ue("titulos").ok, ue("titulos").ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "Notícias (RSS e Google Notícias)",
          "manchetes e links",
          'servidor "terminal"',
          "cache 2–3 min",
          "minutos",
          "TOP, NEWS, EVT, IA",
          ue("noticias")
            ? ve(ue("noticias").ok, ue("noticias").ok ? "ok" : "falha")
            : ve(null, "—"),
        ],
        [
          "Gemini (IA)",
          "relatórios e leituras",
          'servidor "analise"',
          "sob demanda",
          "—",
          "IA, ASKB, Jornal, Economista",
          (t.audIA || [])[0]
            ? ve(!t.audIA[0].erro, t.audIA[0].erro ? "última falhou" : "ok")
            : ve(null, "—"),
        ],
      ];
    }
    function Ie() {
      const { C: Me, iss: ue } = window.trChecagens(),
        ve = Date.now(),
        he = Object.entries(t.src).filter(([, Ve]) => ve - Ve.em < 10 * 6e4),
        we = new Set(ue.filter((Ve) => Ve.chk === "div").map((Ve) => Ve.item)),
        Be = new Set(ue.filter((Ve) => Ve.chk === "pf").map((Ve) => Ve.item)),
        Ge = he.filter(
          ([Ve, Je]) =>
            Je.falha ||
            we.has(Ve.replace(/^.*:/, "")) ||
            Be.has(Ve.replace(/^.*:/, "")),
        ).length,
        Ce = he.length ? (1 - Ge / he.length) * 100 : null,
        Qe = se().filter(
          (Ve) =>
            !/sem chave|n\xe3o configurada|sem dados|\u2014<\/?/.test(Ve[6]) &&
            !/cz/.test(Ve[6]),
        ),
        de = Qe.filter((Ve) => /vd/.test(Ve[6])).length,
        Se = he.filter(([, Ve]) => !Ve.rt && !Ve.falha).length + Be.size;
      return {
        ativas: de,
        total: Qe.length,
        integ: Ce,
        div: we.size,
        atr: Se,
        erros: Me.filter((Ve) => Ve.st === "erro"),
      };
    }
    t.dc = t.dc || { aba: "painel" };
    {
      const Me = o.DQ.body,
        ue = o.DQ.load;
      ((o.DQ.load = async (ve, he) => {
        await Promise.all([
          ue && ue(ve, he),
          r("valida", { s: A() }, 6e4),
          r("cot", { s: A() }, 15e3),
        ]);
      }),
        (o.DQ.body = (ve, he) => {
          const we = Ie(),
            Be = t.dc.aba,
            Ge = y(he) < 780,
            Ce = (de, Se, Ve, Je) =>
              `<div class="dct"><span>${de}</span><b class="${Je}">${Se}</b><em>${Ve}</em></div>`;
          let Qe = `<div class="dch"><b>DATA CENTER</b> <span class="mut">monitoramento de dados</span></div><div class="dcts">${Ce("FONTES ATIVAS", `${String(we.ativas).padStart(2, "0")}/${String(we.total).padStart(2, "0")}`, "conexões monitoradas", we.ativas === we.total ? "tg" : "am")}${Ce("INTEGRIDADE", we.integ == null ? "—" : m(we.integ, 1) + "%", "ativos na tela sem problema", we.integ == null ? "" : we.integ >= 98 ? "tg" : we.integ >= 90 ? "am" : "tr")}${Ce("DIVERGÊNCIAS", String(we.div).padStart(2, "0"), "Profit × outras fontes", we.div ? "am" : "tg")}${Ce("ATRASADOS", String(we.atr).padStart(2, "0"), "15 min ou parados", we.atr ? "tr" : "tg")}</div>`;
          if (
            ((Qe += `<div class="g9bar">${[
              ["painel", "Checagens"],
              ["fontes", "Mapa das fontes"],
              ["comp", "Comparação entre fontes"],
              ["val", "Validação da IA"],
            ]
              .map(
                ([de, Se]) =>
                  `<button class="g9b${Be === de ? " on" : ""}" data-dc="aba|${de}|${he}">${Se}</button>`,
              )
              .join(
                "",
              )}<label class="dcpush"><input type="checkbox" data-dc="push"${a().dqPush ? " checked" : ""}> avisar no celular se a ponte do Profit parar no pregão</label></div>`),
            Be === "fontes")
          ) {
            const de = se();
            return (
              (Qe += Ge
                ? `<div class="g9cards">${de.map((Se) => `<div class="g9card"><div class="g9c1"><b>${Se[0]}</b><span>${Se[6]}</span></div><div class="g9c3">${u(Se[1])}</div><div class="g9c2">entra por: ${u(Se[2])} · atualiza ${u(Se[3])} · atraso ${u(Se[4])} · usado em ${u(Se[5])}</div></div>`).join("")}</div>`
                : x(
                    [
                      "Fonte",
                      "Fornece",
                      "Entra por",
                      "Atualização",
                      "Atraso",
                      "Usado em",
                      "Estado",
                    ],
                    de.map(
                      (Se) =>
                        `<tr><td><b>${Se[0]}</b></td><td class="mut" style="white-space:normal">${u(Se[1])}</td><td class="mut" style="white-space:normal">${u(Se[2])}</td><td>${u(Se[3])}</td><td>${u(Se[4])}</td><td class="mut" style="white-space:normal">${u(Se[5])}</td><td>${Se[6]}</td></tr>`,
                    ),
                    "mapa",
                  ) +
                  '<div class="trfont">Atualização do Profit = intervalo mediano observado entre preços novos (auditoria).</div>'),
              Qe
            );
          }
          if (Be === "comp") {
            const de = i("valida", { s: A() }).v,
              Se = J(),
              Ve = (Je, Ye) => {
                const Xe = Je.find((ot) => ot[0] === Ye);
                return Xe ? m(Xe[1]) : '<span class="mut">—</span>';
              };
            return (
              (Qe += x(
                [
                  "Ativo",
                  "Profit",
                  "TradingView",
                  "brapi",
                  "Twelve Data",
                  "Maior diferença",
                  "Veredito",
                ],
                Se.map(
                  (Je) =>
                    `<tr><td class="tk">${u(Je.tk)}</td><td class="num">${Ve(Je.L, "Profit")}</td><td class="num">${Ve(Je.L, "TradingView")}</td><td class="num">${Ve(Je.L, "brapi")}</td><td class="num">${Ve(Je.L, "Twelve Data")}</td><td class="num">${Je.dif == null ? "—" : m(Je.dif, 2) + "%"}</td><td class="${Je.vered === "ok" ? "tg" : /fora|diverg/.test(Je.vered) ? "tr" : "mut"}">${u(Je.vered)}</td></tr>`,
                ),
                "comparacao",
              )),
              de &&
                (!de.brapi || !de.twelve) &&
                (Qe += `<div class="trnote">Para ter 3 ou 4 fontes por ativo, crie as chaves grátis e cadastre no Supabase → Edge Functions → Secrets:${de.brapi ? "" : " <b>BRAPI_TOKEN</b> (brapi.dev, ações da B3)"}${!de.brapi && !de.twelve ? " e" : ""}${de.twelve ? "" : " <b>TWELVE_API_KEY</b> (twelvedata.com, EUA e moedas)"}. Com 3 fontes, o painel aponta qual delas está fora do consenso. Elas também viram reserva quando o TradingView não acha um ativo.</div>`),
              Qe +
                '<div class="trfont">Tolerância: 0,4% (1,5% quando o TradingView está 15 min atrasado). Consenso pela mediana das fontes.</div>'
            );
          }
          if (Be === "val") {
            const de = (t.audIA || []).find((Ve) =>
              /validacao/.test(Ve.enviado || ""),
            );
            let Se = null;
            try {
              Se = de ? JSON.parse(de.enviado).contexto.validacao : null;
            } catch {}
            return (
              (Qe +=
                '<div class="trnote">Antes de qualquer envio à IA, o app confere cada número: fonte, horário do dado, atraso, divergência entre fontes e cotação parada. O que não tem fonte é retirado; o que tem ressalva vai marcado. A IA é instruída a avisar a limitação em vez de completar o dado, e o servidor transforma em "leitura" qualquer número que ela cite e que não esteja nos dados.</div>'),
              (Qe += Se
                ? `<div class="trsec">Última validação · ${new Date(Se.verificado_em).toLocaleString("pt-BR")}</div><div class="trkv">${Object.entries(
                    Se.resumo,
                  )
                    .map(
                      ([Ve, Je]) =>
                        `<span>${u(Ve.replace("_", " "))} <b class="${Ve === "ok" ? "tg" : Je ? "am" : ""}">${Je}</b></span>`,
                    )
                    .join(
                      "",
                    )}</div>${Se.problemas.length ? Se.problemas.map((Ve) => `<div class="g9li am">${u(Ve)}</div>`).join("") : '<div class="g9li tg">Nenhum problema nos dados enviados.</div>'}<div class="trfont">Regras: ${u(Se.regras.join(" · "))}</div>`
                : '<div class="trnote">Nenhuma leitura da IA desde que a validação começou. Gere uma em IA ou IA PETR4.</div>'),
              Qe
            );
          }
          return Qe + Me(ve, he);
        }));
    }
    if (
      (document.addEventListener(
        "click",
        (Me) => {
          const ue =
            Me.target.closest && Me.target.closest('[data-dc^="aba|"]');
          if (!ue) return;
          Me.stopPropagation();
          const [, ve, he] = ue.dataset.dc.split("|");
          ((t.dc.aba = ve), v(+he));
        },
        !0,
      ),
      document.addEventListener(
        "change",
        (Me) => {
          const ue = Me.target;
          if (!(!ue || !ue.dataset || ue.dataset.dc !== "push")) {
            ((a().dqPush = ue.checked), save());
            try {
              turnoPushSync(!0);
            } catch {}
            toast(
              ue.checked
                ? "Você será avisado se a ponte do Profit parar no pregão (precisa das notificações ligadas)."
                : "Aviso desligado.",
            );
          }
        },
        !0,
      ),
      typeof npComTurno == "function")
    ) {
      const Me = npComTurno;
      npComTurno = function () {
        const ue = Me.apply(this, arguments);
        try {
          ue.dqp = !!(S.ax && S.ax.term && S.ax.term.dqPush);
        } catch {}
        return ue;
      };
    }
    function Pe(Me) {
      if (!Me || typeof Me != "object") return Me;
      const ue = Date.now(),
        ve = { ok: 0, atrasado: 0, parado: 0, divergente: 0, sem_fonte: 0 },
        he = [],
        { iss: we } = window.trChecagens(),
        Be = new Set(we.filter((de) => de.chk === "div").map((de) => de.item)),
        Ge = new Set(we.filter((de) => de.chk === "pf").map((de) => de.item)),
        Ce = (de, Se, Ve) => {
          if (!de) return de;
          if (de.preco == null && de.px == null)
            return (
              ve.sem_fonte++,
              he.push(`${Se}: sem cotação em nenhuma fonte (retirado)`),
              null
            );
          const Je = de.dado_em ? Date.parse(de.dado_em) : null,
            Ye = Je && ue - Je > 30 * 6e4 && k();
          let Xe = "ok";
          return (
            Ve && Be.has(Ve)
              ? ((Xe = "divergente"),
                he.push(`${Se}: preço diverge entre Profit e TradingView`))
              : Ve && Ge.has(Ve)
                ? ((Xe = "parado"), he.push(`${Se}: Profit sem atualizar`))
                : Ye
                  ? ((Xe = "parado"),
                    he.push(
                      `${Se}: dado de ${new Date(Je).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}, mais de 30 min no pregão`,
                    ))
                  : de.atraso && (Xe = "atrasado"),
            ve[Xe]++,
            { ...de, qualidade: Xe }
          );
        },
        Qe = JSON.parse(JSON.stringify(Me));
      if (
        (Qe.mercados &&
          Array.isArray(Qe.mercados.itens) &&
          (Qe.mercados.itens = Qe.mercados.itens
            .map((de) => Ce(de, de.n, null))
            .filter(Boolean)),
        Qe.ativo)
      ) {
        const de = Ce(
          { ...Qe.ativo, px: Qe.ativo.preco },
          Qe.ativo.codigo,
          Qe.ativo.codigo,
        );
        de
          ? (delete de.px, (Qe.ativo = de))
          : (Qe.ativo = {
              codigo: Qe.ativo.codigo,
              preco: null,
              tecnico: Qe.ativo.tecnico,
              qualidade: "sem_fonte",
            });
      }
      return (
        Qe.tecnico &&
          Array.isArray(Qe.tecnico.itens) &&
          (Qe.tecnico.itens = Qe.tecnico.itens.map((de) => ({
            ...de,
            qualidade: Be.has(de.ativo)
              ? "divergente"
              : Ge.has(de.ativo)
                ? "parado"
                : "ok",
          }))),
        (Qe.validacao = {
          verificado_em: new Date().toISOString(),
          resumo: ve,
          problemas: [...new Set(he)].slice(0, 12),
          regras: [
            "cada número leva fonte e horário",
            "sem fonte = retirado",
            "divergência Profit × TradingView acima da tolerância = divergente",
            "Profit sem atualizar há mais de 2 min no pregão = parado",
            "dado com mais de 30 min no pregão = parado",
            "TradingView com atraso = atrasado",
          ],
        }),
        Qe
      );
    }
    if (((window.trValidaCtx = Pe), typeof anxCall == "function")) {
      const Me = anxCall;
      anxCall = function (ue) {
        try {
          if (ue && ue.modo === "central" && ue.contexto)
            ue = { ...ue, contexto: Pe(ue.contexto) };
          else if (
            ue &&
            ue.modo === "economista" &&
            typeof ue.texto == "string"
          ) {
            const { C: ve } = window.trChecagens(),
              he = ve.filter((we) => we.st === "erro").map((we) => we.nome);
            he.length &&
              (ue = {
                ...ue,
                texto:
                  ue.texto +
                  `

Validação do app: atenção a ` +
                  he.join(", ") +
                  ". Se usar esses dados, avise a limitação.",
              });
          }
        } catch {}
        return Me.call(this, ue);
      };
    }
    ((t.dcEst = t.dcEst || {}),
      setInterval(() => {
        try {
          if (tab !== "term") return;
          const { C: Me } = window.trChecagens(),
            ue = Date.now();
          Me.forEach((we) => {
            const Be = t.dcEst[we.id];
            (we.st === "erro" &&
              Be &&
              Be !== "erro" &&
              ue - (t["dcT" + we.id] || 0) > 30 * 6e4 &&
              ((t["dcT" + we.id] = ue),
              toast(
                "⚠ DATA CENTER: " + we.nome + (we.n ? " (" + we.n + ")" : ""),
                6e3,
              ),
              p("DATA CENTER", we.nome + ": " + (we.obs || "erro"), !1)),
              (t.dcEst[we.id] = we.st));
          });
          const ve = Me.filter((we) => we.st === "erro").length,
            he = document.querySelector(".trm .trbar");
          if (he) {
            let we = he.querySelector(".dcbadge");
            (ve &&
              !we &&
              (he
                .querySelector(".trcmdw")
                .insertAdjacentHTML(
                  "afterend",
                  '<button class="trbtn dcbadge" data-trcmd="DQ" title="Problemas nos dados: abrir o DATA CENTER"></button>',
                ),
              (we = he.querySelector(".dcbadge"))),
              we && (ve ? (we.textContent = "⚠ " + ve) : we.remove()));
          }
        } catch {}
      }, 5e3));
    {
      const Me = window.vTerm;
      window.vTerm = function () {
        try {
          if (typeof GO < "u" && GO.r === "dq") {
            GO.r = null;
            const ue = g();
            ue.p.includes("DQ") || ((ue.p[0] = "DQ"), ue.t && (ue.t[0] = null));
          }
        } catch {}
        return Me.apply(this, arguments);
      };
    }
    {
      const Me = TraderStyles.slot("legacy-116");
      ((Me.id = "term193"),
        (Me.textContent = TraderStyles.css("legacy-116")),
        TraderStyles.mount(Me));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e) return;
    const {
        TR: t,
        FN: a,
        ALIAS: o,
        EXT: s,
        esc2: n,
        nf: r,
        tabela: i,
        carregando: l,
        pinta: d,
        roda: c,
        layAtual: p,
      } = e,
      u = (k) =>
        new Date(k).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      m = () => {
        const k = S.ax ?? (S.ax = {});
        return (
          k.pano ?? (k.pano = { on: !1, h: ["07:00", "10:00"], fech: 30 }),
          k.pano
        );
      },
      f = (k) => {
        try {
          const A = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/New_York",
            timeZoneName: "shortOffset",
          })
            .formatToParts(k)
            .find((C) => C.type === "timeZoneName").value;
          return /-4/.test(A) ? 1020 : 1080;
        } catch {
          return 1080;
        }
      },
      x = () => {
        const k = m(),
          A = k.h.slice();
        if (k.fech != null) {
          const C = f(new Date()) + k.fech;
          A.push(
            String(Math.floor(C / 60)).padStart(2, "0") +
              ":" +
              String(C % 60).padStart(2, "0"),
          );
        }
        return [...new Set(A)].sort();
      };
    if (typeof npComTurno == "function") {
      const k = npComTurno;
      npComTurno = function () {
        const A = k.apply(this, arguments);
        try {
          const C = m();
          A.pano = { on: !!C.on, h: C.h.slice(0, 6), fech: C.fech };
        } catch {}
        return A;
      };
    }
    async function v(k) {
      const A = k
          ? "id=eq." + encodeURIComponent(k)
          : "order=gerado.desc&limit=1",
        C = await (
          await rq("/rest/v1/panorama_fotos?select=id,slot,gerado,dados&" + A)
        ).json();
      if (!Array.isArray(C) || !C[0])
        throw new Error(
          "Ainda não há foto guardada. Ela sai no próximo horário configurado.",
        );
      return C[0];
    }
    function g(k) {
      const A = k.dados || {},
        C = Date.parse(k.gerado),
        I = window.Date,
        J = {
          mdo: [MDO.v, MDO.ts],
          ad: AD.data,
          ag: [AG.v[0], AG.ts[0]],
          fe: [FE.v, FE.ts],
          bal: [BAL.v, BAL.ts],
        };
      try {
        (A.mdo && ((MDO.v = A.mdo), (MDO.ts = Date.now())),
          A.ad && (AD.data = { ...A.ad, ts: Date.now() }),
          A.ag && ((AG.v[0] = A.ag), (AG.ts[0] = Date.now())),
          A.fe && ((FE.v = A.fe), (FE.ts = Date.now())),
          A.bal && ((BAL.v = A.bal), (BAL.ts = Date.now())));
        class se extends I {
          constructor(...Pe) {
            Pe.length ? super(...Pe) : super(C);
          }
          static now() {
            return C;
          }
        }
        return ((window.Date = se), imgDesenha());
      } finally {
        ((window.Date = I),
          (MDO.v = J.mdo[0]),
          (MDO.ts = J.mdo[1]),
          (AD.data = J.ad),
          (AG.v[0] = J.ag[0]),
          (AG.ts[0] = J.ag[1]),
          (FE.v = J.fe[0]),
          (FE.ts = J.fe[1]),
          (BAL.v = J.bal[0]),
          (BAL.ts = J.bal[1]));
      }
    }
    window.trAbrePano = async function (k) {
      try {
        toast("Abrindo o panorama guardado…", 1500);
        const A = await v(k);
        try {
          // v613: logos oficiais também no panorama guardado (1ª passada lista os ativos).
          if (window.DiarioLogos) { try { g(A); } catch {} await Promise.race([window.DiarioLogos.carregaPendentes(), new Promise((r) => setTimeout(r, 12e3))]); }
        } catch {}
        const C = g(A),
          I = await new Promise((se) => C.toBlob(se, "image/jpeg", 0.92)),
          J = u(A.gerado);
        ((IMG.blob = I),
          (IMG.nome =
            "mercado-" +
            A.slot.slice(0, 10) +
            "-" +
            J.replace(":", "h") +
            ".jpg"),
          (IMG.titulo = "Panorama do mercado – " + J),
          (IMG.legenda = null),
          imgMostra(URL.createObjectURL(I)));
      } catch (A) {
        alert(
          "Não consegui abrir o panorama: " +
            (A.status === 404 || /panorama_fotos/.test(String(A.message))
              ? "rode o arquivo automacao.sql no Supabase (SQL Editor)."
              : A.message || A),
        );
      }
    };
    {
      const k = render0;
      render0 = function () {
        if (tab === "pano") {
          const A = typeof GO < "u" ? GO.r : null;
          try {
            GO.r = null;
          } catch {}
          ((tab = "term"), setTimeout(() => window.trAbrePano(A), 300));
        }
        return k.apply(this, arguments);
      };
    }
    t.panoL = t.panoL || null;
    async function h() {
      try {
        const k = await rq(
          "/rest/v1/panorama_fotos?select=id,slot,gerado&order=gerado.desc&limit=12",
        );
        ((t.panoL = await k.json()), (t.panoErr = ""));
      } catch (k) {
        t.panoErr =
          k.status === 404
            ? "Rode o arquivo automacao.sql no Supabase para guardar as fotos."
            : String(k.message || k);
      }
    }
    function b(k) {
      const A = m(),
        C = x(),
        I = f(new Date()),
        J = t.panoL;
      return `<div class="${k ? "pano9" : "card pano9c"}"><div class="${k ? "trsec" : ""}"><b>📸 Foto automática do panorama</b></div>
  <div class="sm mut" style="margin:4px 0 8px">O servidor guarda o panorama nos horários abaixo, mesmo com o app fechado, e avisa no celular. Ao tocar no aviso, a imagem já abre pronta para mandar no grupo.</div>
  <label class="pano9l"><input type="checkbox" data-pano="on"${A.on ? " checked" : ""}> Ligado (dias de pregão)</label>
  <label class="pano9l">Horários fixos <input class="${k ? "trin" : ""}" data-pano="h" value="${n(A.h.join(", "))}" placeholder="07:00, 10:00" style="width:150px"></label>
  <label class="pano9l"><input type="checkbox" data-pano="fechon"${A.fech != null ? " checked" : ""}> Depois do fechamento da B3: <input class="${k ? "trin" : ""}" type="number" min="0" max="240" step="5" data-pano="fech" value="${A.fech ?? 30}" style="width:64px"> min</label>
  <div class="sm mut">Hoje a B3 fecha às ${String(I / 60)}h${I === 1020 ? " (horário de verão americano)" : ""}; as fotos de hoje saem às <b>${C.join(" · ") || "—"}</b>. Quando o horário da B3 muda, o horário da foto do fechamento muda junto.</div>
  <div class="pano9b"><button class="${k ? "trbtn" : "btn s"}" data-pano="ver">Abrir a última foto</button></div>
  ${J && J.length ? `<div class="sm mut" style="margin-top:6px">Fotos guardadas:</div><div class="pano9f">${J.map((se) => `<button class="${k ? "g9b" : "btn s"}" data-pano="abre" data-id="${se.id}">${n(se.slot.slice(8, 10) + "/" + se.slot.slice(5, 7) + " " + se.slot.slice(11))}</button>`).join("")}</div>` : t.panoErr ? `<div class="sm am">${n(t.panoErr)}</div>` : ""}
  <div class="sm mut" style="margin-top:6px">Precisa das notificações ligadas neste aparelho.</div></div>`;
    }
    {
      const k = vPainelMk;
      vPainelMk = function () {
        return (
          !t.panoL &&
            !t.panoBusy &&
            SESS &&
            ((t.panoBusy = 1),
            h().then(() => {
              t.panoBusy = 0;
              const A = document.getElementById("panobox");
              A && (A.outerHTML = '<div id="panobox">' + b(!1) + "</div>");
            })),
          k.apply(this, arguments) + '<div id="panobox">' + b(!1) + "</div>"
        );
      };
    }
    ((a.PANO =
      "Foto automática do panorama: horários, fotos guardadas e imagem pronta"),
      (o.FOTO = "PANO"),
      (o.PANORAMA = "PANO"),
      (s.PANO = { load: h, body: () => b(!0) }),
      document.addEventListener(
        "change",
        (k) => {
          const A = k.target;
          if (!A || !A.dataset || !A.dataset.pano) return;
          const C = m(),
            I = A.dataset.pano;
          if (I === "on") C.on = A.checked;
          else if (I === "h")
            C.h = String(A.value || "")
              .split(/[\s,;]+/)
              .map((se) => se.replace("h", ":").replace(/^(\d):/, "0$1:"))
              .filter((se) => /^([01]\d|2[0-3]):[0-5]\d$/.test(se))
              .slice(0, 6);
          else if (I === "fechon") C.fech = A.checked ? (C.fech ?? 30) : null;
          else if (I === "fech") {
            const se = Math.round(+A.value);
            se >= 0 && se <= 240 && (C.fech = se);
          }
          save();
          try {
            turnoPushSync(!0);
          } catch {}
          toast(
            C.on
              ? "Foto automática: " + x().join(" · ")
              : "Foto automática desligada.",
          );
          const J = document.getElementById("panobox");
          J && (J.innerHTML = b(!1));
          try {
            p().p.forEach((se, Ie) => {
              /^(PANO|FOTO|PANORAMA)\b/.test(se) && d(Ie);
            });
          } catch {}
        },
        !0,
      ),
      document.addEventListener(
        "click",
        (k) => {
          const A =
            k.target.closest &&
            k.target.closest('[data-pano="ver"],[data-pano="abre"]');
          A &&
            (k.preventDefault(),
            k.stopPropagation(),
            window.trAbrePano(A.dataset.id || null));
        },
        !0,
      ),
      (a.AUTO =
        "Automações: o que roda sozinho, quando, se deu certo, falhas e limites"),
      (o.AUTOMACAO = "AUTO"),
      (o.ENGINE = "AUTO"),
      (t.auto = t.auto || { aba: "tarefas", L: null, err: "" }));
    async function y() {
      try {
        const k = await rq(
          "/rest/v1/automacao_log?select=em,tarefa,ok,detalhe,ms&order=em.desc&limit=300",
        );
        ((t.auto.L = await k.json()), (t.auto.err = ""));
      } catch (k) {
        t.auto.err =
          k.status === 404
            ? "Rode o arquivo automacao.sql no Supabase (SQL Editor) para o servidor registrar as execuções."
            : String(k.message || k);
      }
    }
    const j = [
      [
        "Mercado",
        "Cotações ao vivo (Profit, Binance, Finnhub) e TradingView com atraso",
        "app aberto",
        "a cada 3 s",
        "STAT",
      ],
      [
        "Mercado",
        "Monitor de índices e ativos, gráficos e indicadores",
        "app aberto",
        "3 s a 5 min",
        "MON",
      ],
      [
        "Mercado",
        "Mudanças relevantes (movimento atípico, região técnica, volume)",
        "app aberto",
        "a cada 3 s",
        "EVT",
      ],
      [
        "Mercado",
        "Dados atrasados ou parados",
        "app aberto",
        "a cada 3 s",
        "DQ",
      ],
      ["Mercado", "Alertas de preço", "servidor", "a cada minuto", "ALRT"],
      [
        "Mercado",
        "Alertas combinados (média, RSI, volume, divergência, resultado)",
        "servidor",
        "a cada 5 min no pregão",
        "ALC",
        "alertas combinados",
      ],
      [
        "IA",
        "Jornal do Pregão (edição do dia)",
        "servidor",
        "6h30 (fim de semana 8h)",
        "JORNAL",
      ],
      [
        "IA",
        "Giro do mercado",
        "servidor",
        "7h, 9h10, 10h, 12h, 15h e 17h20",
        "GIRO",
      ],
      [
        "IA",
        "Central de inteligência e relatório por ativo (com validação)",
        "sob demanda",
        "quando você pede",
        "IA",
      ],
      [
        "Notícias",
        "Busca em 13 fontes, sem duplicadas, com relevância e ativos relacionados",
        "servidor (pelo app)",
        "a cada 2 min",
        "NEWS",
      ],
      [
        "Notícias",
        "Resultado do indicador no minuto (aviso)",
        "servidor",
        "a cada minuto, 6h às 22h",
        "ECO",
        "resultado no minuto",
      ],
      [
        "Economia",
        "Indicadores de 6 países, Focus, Copom e Fed implícitos",
        "servidor (pelo app)",
        "30 min / 1 min",
        "ECST",
      ],
      [
        "Economia",
        "Calendário econômico",
        "servidor (pelo app)",
        "a cada minuto",
        "ECO",
      ],
      [
        "Infraestrutura",
        "Monitor de APIs, falhas, integridade e confiabilidade",
        "app aberto",
        "a cada 3 s",
        "DQ",
      ],
      [
        "Infraestrutura",
        "Aviso de ponte do Profit parada",
        "servidor",
        "a cada minuto no pregão",
        "DQ",
        "ponte do Profit",
      ],
      [
        "Relatórios",
        "Foto automática do panorama (imagem pronta)",
        "servidor",
        "seus horários + fechamento da B3",
        "PANO",
        "panorama",
      ],
      [
        "Relatórios",
        "Relatório da carteira com IA (individuais com mudança relevante + consolidado)",
        "servidor",
        "fechamento da B3 + folga, dias úteis",
        "",
        "carteira",
      ],
      [
        "Relatórios",
        "Exportação em PDF e imagem (Jornal e panorama)",
        "sob demanda",
        "quando você pede",
        "JORNAL",
      ],
      [
        "Acompanhamento",
        "Trades de olho, trades abertos e briefing da manhã",
        "servidor",
        "a cada minuto / 9h30",
        "AOVIVO",
      ],
      [
        "Acompanhamento",
        "Fotos do terminal para a máquina do tempo",
        "app aberto",
        "a cada 15 min",
        "TM",
      ],
      [
        "Administrativo",
        "Limpeza de registros antigos",
        "servidor",
        "todo dia às 3h",
        "AUTO",
        "limpeza",
      ],
      [
        "Administrativo",
        "Histórico de preços e chamadas à IA (auditoria)",
        "app aberto",
        "contínuo",
        "AUD",
      ],
      [
        "Administrativo",
        "Ciclo do servidor de notificações",
        "servidor",
        "a cada minuto (registro a cada 15 min)",
        "AUTO",
        "ciclo",
      ],
    ];
    ((s.AUTO = {
      vivo: !1,
      load: y,
      body: (k, A) => {
        const C = t.auto,
          I = C.L || [],
          J = (ve) => I.find((he) => he.tarefa === ve),
          se = new Date().toISOString().slice(0, 10),
          Ie = C.aba,
          Pe = `<div class="g9bar">${[
            ["tarefas", "Tarefas"],
            ["hoje", "Agenda de hoje"],
            ["exec", "Execuções"],
            ["limites", "Custos e limites"],
          ]
            .map(
              ([ve, he]) =>
                `<button class="g9b${Ie === ve ? " on" : ""}" data-au="${ve}|${A}">${he}</button>`,
            )
            .join(
              "",
            )}</div>${C.err ? `<div class="trnote am">${n(C.err)}</div>` : ""}`;
        if (Ie === "hoje") {
          const ve = m(),
            he = f(new Date()),
            we = (Ge) =>
              String(Math.floor(Ge / 60)).padStart(2, "0") +
              ":" +
              String(Ge % 60).padStart(2, "0"),
            Be = [
              ["03:00", "Final do dia", "Limpeza de registros antigos"],
              ["06:30", "Início do dia", "Jornal do Pregão"],
              [
                "07:00",
                "Início do dia",
                "Giro do mercado" +
                  (ve.on && ve.h.includes("07:00")
                    ? " + foto do panorama"
                    : ""),
              ],
              ["09:10", "Antes da abertura", "Giro (abertura do futuro)"],
              ["09:30", "Antes da abertura", "Briefing da manhã"],
              [
                "10:00",
                "Abertura",
                "Giro" +
                  (ve.on && ve.h.includes("10:00")
                    ? " + foto do panorama"
                    : "") +
                  "; monitor do pregão começa",
              ],
              [
                "10:00–" + we(he),
                "Durante o pregão",
                "Alertas de preço (1 min), combinados (5 min), ponte do Profit, resultado no minuto",
              ],
              ["12:00 · 15:00", "Durante o pregão", "Giro"],
              ["17:20", "Fechamento", "Giro do fechamento"],
              [
                we(he),
                "Fechamento",
                "B3 fecha hoje" +
                  (he === 1020 ? " (horário de verão americano)" : ""),
              ],
            ];
          return (
            ve.on &&
              ve.fech != null &&
              Be.push([
                we(he + ve.fech),
                "Fechamento",
                "Foto do panorama do fechamento",
              ]),
            ve.on &&
              ve.h
                .filter((Ge) => !["07:00", "10:00"].includes(Ge))
                .forEach((Ge) =>
                  Be.push([Ge, "Seu horário", "Foto do panorama"]),
                ),
            Be.sort((Ge, Ce) => Ge[0].localeCompare(Ce[0])),
            Pe +
              i(
                ["Horário", "Momento", "O que roda sozinho"],
                Be.map(
                  (Ge) =>
                    `<tr><td class="num">${n(Ge[0])}</td><td>${n(Ge[1])}</td><td style="white-space:normal">${n(Ge[2])}</td></tr>`,
                ),
                "agauto",
              ) +
              '<div class="trfont">Dias sem pregão: o servidor pula as fotos do panorama e os avisos do pregão. O horário do fechamento acompanha a B3, que muda com o horário de verão americano. O resumo semanal sai no horário configurado em Notificações.</div>'
          );
        }
        if (Ie === "exec")
          return (
            Pe +
            (I.length
              ? i(
                  ["Quando", "Tarefa", "Resultado", "Detalhe", "Tempo"],
                  I.slice(0, 150).map(
                    (ve) =>
                      `<tr><td class="num">${new Date(ve.em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td><td>${n(ve.tarefa)}</td><td class="${ve.ok ? "tg" : "tr"}">${ve.ok ? "ok" : "falhou"}</td><td class="mut" style="white-space:normal">${n(ve.detalhe || "")}</td><td class="num">${ve.ms ? r(ve.ms / 1e3, 1) + " s" : ""}</td></tr>`,
                  ),
                  "execs",
                )
              : '<div class="trnote">Nenhuma execução registrada ainda.</div>')
          );
        if (Ie === "limites") {
          const ve = (t.audIA || []).filter(
              (de) => new Date(de.ts).toISOString().slice(0, 10) === se,
            ),
            he = {};
          ve.forEach((de) => {
            he[de.modo] = (he[de.modo] || 0) + 1;
          });
          const we = t.fst || {},
            Be = Object.values(we).reduce((de, Se) => de + Se.n, 0),
            Ge = Object.values(we).reduce((de, Se) => de + Se.falhas, 0),
            Ce = I.filter((de) => de.em.slice(0, 10) === se),
            Qe = {};
          return (
            Ce.forEach((de) => {
              Qe[de.tarefa] = (Qe[de.tarefa] || 0) + 1;
            }),
            Pe +
              `<div class="trsec">Uso hoje neste aparelho</div><div class="trkv"><span>Chamadas à IA <b>${ve.length}</b></span>${Object.entries(
                he,
              )
                .map(([de, Se]) => `<span>${n(de)} <b>${Se}</b></span>`)
                .join(
                  "",
                )}<span>Chamadas às funções nesta sessão <b>${Be}</b> (${Ge} falhas)</span></div>
      <div class="trsec">Execuções do servidor hoje</div><div class="trkv">${
        Object.entries(Qe)
          .map(([de, Se]) => `<span>${n(de)} <b>${Se}</b></span>`)
          .join("") || '<span class="mut">—</span>'
      }</div>
      <div class="trsec">Limites das fontes (planos grátis)</div>` +
              i(
                ["Fonte", "Limite", "Como o app se protege"],
                [
                  [
                    "Gemini (IA)",
                    'limite diário por usuário no servidor "analise"',
                    "cache por edição; o Jornal não pede de novo a mesma edição; IA só sob demanda",
                  ],
                  [
                    "Twelve Data",
                    "800 créditos/dia e 8/min",
                    "até 8 símbolos por chamada, cache de 60 s, só na validação e na reserva",
                  ],
                  [
                    "brapi",
                    "depende do seu plano",
                    "um ativo por chamada, cache de 60 s, só na validação e na reserva",
                  ],
                  [
                    "TradingView",
                    "sem limite publicado",
                    "cache de 15 s a 30 min no servidor",
                  ],
                  [
                    "Yahoo Finance",
                    "sem limite publicado",
                    "cache de 2 a 10 min",
                  ],
                  [
                    "Finnhub",
                    "60 chamadas/min",
                    "conexão única para todas as ações",
                  ],
                ].map(
                  (de) =>
                    `<tr><td>${n(de[0])}</td><td>${n(de[1])}</td><td class="mut" style="white-space:normal">${n(de[2])}</td></tr>`,
                ),
                "limites",
              ) +
              '<div class="trfont">O consumo exato de cada chave está no painel de cada serviço; aqui aparece o que o app registra.</div>'
          );
        }
        const Me = (ve) => {
            if (!ve[5]) return '<span class="mut">—</span>';
            const he = J(ve[5]);
            return he
              ? `<span class="${he.ok ? "tg" : "tr"}">${he.ok ? "ok" : "falhou"}</span> <em class="mut">${new Date(he.em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</em>`
              : '<span class="mut">sem registro</span>';
          },
          ue = [...new Set(j.map((ve) => ve[0]))];
        return (
          Pe +
          ue
            .map(
              (ve) =>
                `<div class="trsec">${n(ve)}</div>` +
                i(
                  ["Tarefa", "Onde roda", "Quando", "Última execução", ""],
                  j
                    .filter((he) => he[0] === ve)
                    .map(
                      (he) =>
                        `<tr><td style="white-space:normal">${n(he[1])}</td><td class="mut">${n(he[2])}</td><td class="mut">${n(he[3])}</td><td>${Me(he)}</td><td><button class="trlk" data-trcmd="${n(he[4])}">abrir</button></td></tr>`,
                    ),
                ),
            )
            .join("") +
          '<div class="trfont">"Servidor" roda 24 h, com o app fechado, na função "notificar" (a cada minuto). Para não repetir, cada aviso tem uma chave única. O Jornal tenta de novo sozinho as partes que falharam.</div>'
        );
      },
    }),
      document.addEventListener(
        "click",
        (k) => {
          const A = k.target.closest && k.target.closest("[data-au]");
          if (!A) return;
          k.stopPropagation();
          const [C, I] = A.dataset.au.split("|");
          ((t.auto.aba = C), d(+I));
        },
        !0,
      ));
    {
      const k = TraderStyles.slot("legacy-117");
      ((k.textContent = TraderStyles.css("legacy-117")), TraderStyles.mount(k));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e || !e.tec) return;
    const {
        TR: t,
        TS: a,
        EXT: o,
        FN: s,
        ALIAS: n,
        trFn: r,
        trGet: i,
        esc2: l,
        nf: d,
        pc: c,
        cls: p,
        big: u,
        tabela: m,
        carregando: f,
        pinta: x,
        roda: v,
        layAtual: g,
      } = e,
      { lista: h, larg: b, vizinho: y } = e.tec,
      j = () => ({
        extra: [...new Set((a().mon || []).concat(h()))]
          .filter((Q) => /^[A-Z]{4}\d{1,2}$/.test(Q))
          .slice(0, 12),
      }),
      k = () => r("hist", j(), 6 * 36e5),
      A = () => i("hist", j()).v,
      C = {
        IBOV: "Ibovespa",
        USDBRL: "Dólar",
        BRENT: "Petróleo Brent",
        US10Y: "Treasury 10a",
        SPX: "S&P 500",
        OURO: "Ouro",
        DXY: "DXY",
        VIX: "VIX",
        COBRE: "Cobre",
        BTC: "Bitcoin",
        VALE3: "Vale",
        PETR4: "Petrobras",
      },
      I = (Q) => C[Q] || Q,
      J = (Q) => Q === "US10Y";
    function se(Q) {
      const re = A() && A().series[Q];
      if (!re) return null;
      const ie = new Map();
      for (let R = 1; R < re.c.length; R++)
        ie.set(
          re.d[R],
          J(Q)
            ? (re.c[R] - re.c[R - 1]) * 100
            : (re.c[R] / re.c[R - 1] - 1) * 100,
        );
      return ie;
    }
    function Ie(Q, re) {
      const ie = A() && A().series[Q];
      if (!ie) return null;
      const R = new Map();
      for (let z = 0; z + re < ie.c.length; z++)
        R.set(
          ie.d[z],
          J(Q)
            ? (ie.c[z + re] - ie.c[z]) * 100
            : (ie.c[z + re] / ie.c[z] - 1) * 100,
        );
      return R;
    }
    const Pe = (Q) => {
        const re = Q.filter((me) => me != null && isFinite(me)),
          ie = re.length;
        if (!ie) return { n: 0 };
        const R = re.reduce((me, be) => me + be, 0) / ie,
          z = re.slice().sort((me, be) => me - be),
          oe =
            ie > 1
              ? Math.sqrt(
                  re.reduce((me, be) => me + (be - R) ** 2, 0) / (ie - 1),
                )
              : 0;
        return {
          n: ie,
          media: R,
          mediana: z[Math.floor(ie / 2)],
          sd: oe,
          pos: (re.filter((me) => me > 0).length / ie) * 100,
          ic: ie > 1 ? (1.96 * oe) / Math.sqrt(ie) : null,
        };
      },
      Me = (Q, re, ie) =>
        re == null || !isFinite(re)
          ? "—"
          : J(Q)
            ? (re > 0 ? "+" : "") + d(re, ie ?? 0) + " pb"
            : c(re, ie ?? 2);
    function ue(Q, re) {
      const ie = Q.length;
      if (ie < 10) return null;
      const R = Q.reduce((X, xe) => X + xe, 0) / ie,
        z = re.reduce((X, xe) => X + xe, 0) / ie;
      let oe = 0,
        me = 0,
        be = 0;
      for (let X = 0; X < ie; X++)
        ((oe += (Q[X] - R) * (re[X] - z)),
          (me += (Q[X] - R) ** 2),
          (be += (re[X] - z) ** 2));
      return oe / Math.sqrt(me * be);
    }
    function ve(Q, re) {
      const ie = Q.map(se);
      if (ie.some((z) => !z)) return null;
      let R = [...ie[0].keys()].filter((z) => ie.every((oe) => oe.has(z)));
      return (
        re && (R = R.slice(-re)),
        { D: R, cols: ie.map((z) => R.map((oe) => z.get(oe))) }
      );
    }
    const he = (Q) =>
        Q && Q.length
          ? `${Q[0].split("-").reverse().join("/")} a ${Q[Q.length - 1].split("-").reverse().join("/")}`
          : "",
      we = (Q) =>
        `Amostra de ${Q} ${Q === 1 ? "dia" : "dias"}${Q < 30 ? " (pequena: leia com cuidado)" : ""}. Retornos de fechamento a fechamento, sem custos. Passado não garante repetição; relação não é causa.`,
      Be = {
        IBOV: "BMFBOVESPA:IBOV",
        USDBRL: "FX_IDC:USDBRL",
        BRENT: "TVC:UKOIL",
        US10Y: "TVC:US10Y",
        SPX: "SP:SPX",
        OURO: "TVC:GOLD",
        DXY: "TVC:DXY",
        VIX: "TVC:VIX",
        COBRE: "COMEX:HG1!",
        BTC: "BINANCE:BTCUSDT",
        VALE3: "VALE3",
        PETR4: "PETR4",
      },
      Ge = () => r("cot", { s: Object.values(Be) }, 2e4);
    function Ce(Q) {
      const re = i("cot", { s: Object.values(Be) }).v;
      if (!re) return null;
      const ie = re.itens.find((R) => R.pedido === Be[Q]);
      return !ie || ie.px == null
        ? null
        : {
            px: ie.px,
            v: J(Q) ? (ie.dabs != null ? ie.dabs * 100 : null) : ie.d1,
            fonte: ie.fonte || "TradingView",
            atraso: ie.atraso !== !1,
            em: re.em,
          };
    }
    function Qe(Q, re = 500) {
      const ie = se(Q);
      if (!ie) return null;
      const R = [...ie.values()].slice(-re);
      return Pe(R).sd;
    }
    const de = ["USDBRL", "BRENT", "US10Y", "SPX"];
    function Se() {
      const Q = [],
        re = {};
      [
        "IBOV",
        "USDBRL",
        "BRENT",
        "US10Y",
        "SPX",
        "OURO",
        "DXY",
        "VIX",
        "VALE3",
        "PETR4",
      ].forEach((X) => {
        const xe = Ce(X),
          $e = Qe(X);
        xe &&
          xe.v != null &&
          ((re[X] = $e ? xe.v / $e : null),
          Q.push({
            k: X,
            v: xe.v,
            z: re[X],
            fonte: xe.fonte,
            atraso: xe.atraso,
            em: xe.em,
          }));
      });
      const ie = [],
        R = (X) =>
          re[X] == null ? 0 : re[X] >= 0.3 ? 1 : re[X] <= -0.3 ? -1 : 0;
      (R("USDBRL") > 0 &&
        R("SPX") < 0 &&
        ie.push([
          "Aversão a risco",
          "dólar sobe e bolsa americana cai juntos",
          "tr",
        ]),
        R("USDBRL") < 0 &&
          R("SPX") > 0 &&
          ie.push([
            "Apetite a risco",
            "dólar cai e bolsa americana sobe",
            "tg",
          ]),
        re.US10Y != null &&
          re.US10Y >= 1 &&
          ie.push([
            "Juros americanos pressionando",
            "Treasury 10 anos sobe mais que o normal: costuma pesar em emergentes e no real",
            "tr",
          ]),
        re.US10Y != null &&
          re.US10Y <= -1 &&
          ie.push([
            "Alívio nos juros americanos",
            "Treasury 10 anos cai mais que o normal",
            "tg",
          ]),
        re.BRENT != null &&
          Math.abs(re.BRENT) >= 1.5 &&
          ie.push([
            re.BRENT > 0
              ? "Choque de alta no petróleo"
              : "Queda forte do petróleo",
            `Brent ${c(Ce("BRENT").v)}: efeito direto em Petrobras e PRIO, e na inflação`,
            re.BRENT > 0 ? "am" : "tr",
          ]),
        re.VIX != null &&
          re.VIX >= 1.5 &&
          ie.push([
            "Medo em alta (VIX)",
            "volatilidade americana subindo forte",
            "tr",
          ]),
        R("USDBRL") > 0 &&
          R("IBOV") < 0 &&
          R("SPX") >= 0 &&
          ie.push([
            "Pressão local",
            "dólar sobe e Ibovespa cai sem o exterior negativo: sinal de risco doméstico (fiscal, juros, política)",
            "tr",
          ]));
      const z = [];
      (["VALE3", "PETR4"].forEach((X) => {
        const xe = ve(["IBOV", X], 250),
          $e = Ce(X),
          fe = Ce("IBOV");
        if (!xe || !$e || !fe || $e.v == null || fe.v == null) return;
        const [Fe, w] = xe.cols,
          H = Fe.reduce((q, L) => q + L, 0) / Fe.length,
          N = w.reduce((q, L) => q + L, 0) / w.length;
        let W = 0,
          Te = 0;
        Fe.forEach((q, L) => {
          ((W += (q - H) * (w[L] - N)), (Te += (q - H) ** 2));
        });
        const V = W / Te,
          ae = w.map((q, L) => q - V * Fe[L]),
          ee = Pe(ae).sd,
          le = V * fe.v,
          Y = $e.v - le;
        ee &&
          Math.abs(Y) >= 1.5 * ee &&
          z.push({ k: X, v: $e.v, esp: le, dif: Y, z: Y / ee, beta: V });
      }),
        z.forEach((X) =>
          ie.push([
            `${I(X.k)} fora do padrão`,
            `${X.k} ${c(X.v)} quando o esperado pelo Ibovespa seria ${c(X.esp)} (beta ${d(X.beta, 2)}): diferença de ${d(X.z, 1)} desvios`,
            X.dif > 0 ? "tg" : "tr",
          ]),
        ));
      let oe = de.filter((X) => R(X) !== 0),
        me = null;
      for (let X = 0; X < 4 && oe.length; X++) {
        const xe = oe.map(se),
          $e = oe.map((V) => Qe(V, 2500));
        if (xe.some((V) => !V)) break;
        const fe = se("IBOV"),
          Fe = Ie("IBOV", 1),
          w = Ie("IBOV", 5),
          H = [...xe[0].keys()].filter((V) =>
            xe.every(
              (ae, ee) =>
                ae.has(V) &&
                Math.sign(ae.get(V)) === R(oe[ee]) &&
                Math.abs(ae.get(V)) >= 0.3 * $e[ee],
            ),
          ),
          N = (V, ae) =>
            A().series.IBOV.d.indexOf(ae) >= 0 ? V.get(ae) : null,
          W = H.map((V) => {
            const ae = A().series.IBOV,
              ee = ae.d.indexOf(V);
            return ee >= 0 && ee + 1 < ae.c.length
              ? (ae.c[ee + 1] / ae.c[ee] - 1) * 100
              : null;
          }),
          Te = H.map((V) => {
            const ae = A().series.IBOV,
              ee = ae.d.indexOf(V);
            return ee >= 0 && ee + 5 < ae.c.length
              ? (ae.c[ee + 5] / ae.c[ee] - 1) * 100
              : null;
          });
        if (H.length >= 15 || oe.length === 1) {
          me = {
            usar: oe,
            D: H,
            ibov: Pe(H.map((V) => fe && fe.get(V))),
            ib1: Pe(W),
            ib5: Pe(Te),
            vale: Pe(
              H.map((V) => {
                const ae = se("VALE3");
                return ae && ae.get(V);
              }),
            ),
            petr: Pe(
              H.map((V) => {
                const ae = se("PETR4");
                return ae && ae.get(V);
              }),
            ),
          };
          break;
        }
        oe = oe
          .slice()
          .sort((V, ae) => Math.abs(re[ae] || 0) - Math.abs(re[V] || 0))
          .slice(0, -1);
      }
      const be = ie.some(
        (X) => X[0] === "Aversão a risco" || X[0] === "Pressão local",
      )
        ? "risk-off"
        : ie.some((X) => X[0] === "Apetite a risco")
          ? "risk-on"
          : "neutro";
      return { fatos: Q, rel: ie, an: me, regime: be, z: re };
    }
    ((s.REL =
      "Relações entre mercados agora: dólar, petróleo, juros, bolsas e commodities, com dias parecidos no histórico"),
      (n.RELACOES = "REL"),
      (n.CONTEXTO = "REL"),
      (o.REL = {
        vivo: !1,
        load: () => Promise.all([k(), Ge()]),
        body: (Q, re) => {
          const ie = A();
          if (!ie) return f(i("hist", j()).err || "");
          const R = Se(),
            z = (be, X) => `<span class="g9tag ${be}">${X}</span>`;
          let oe = `<div class="g9bar"><span class="relreg ${R.regime === "risk-off" ? "tr" : R.regime === "risk-on" ? "tg" : "am"}">Regime agora: <b>${R.regime}</b></span><button class="g9b" data-rl="ia|${re}">Leitura da IA</button><button class="g9b" data-rl="cen|${re}">Cenários</button><button class="g9b" data-rl="hist|${re}">Biblioteca histórica</button></div>`;
          ((oe +=
            `<div class="trsec">${z("ok", "FATO")} Movimentos de hoje</div>` +
            m(
              ["Mercado", "Hoje", "Tamanho", "Fonte"],
              R.fatos.map(
                (be) =>
                  `<tr><td>${l(I(be.k))}</td><td class="num ${p(be.k === "US10Y" || be.k === "VIX" || be.k === "USDBRL" ? -be.v : be.v)}">${Me(be.k, be.v)}</td><td class="num">${be.z == null ? "—" : d(Math.abs(be.z), 1) + "× o normal"}</td><td class="mut">${l(be.fonte)}${be.atraso ? " · 15 min" : ""}</td></tr>`,
              ),
              "relhoje",
            )),
            (oe +=
              `<div class="trsec">${z("in", "RELAÇÕES")} identificadas (regras)</div>` +
              (R.rel.length
                ? R.rel
                    .map(
                      (be) =>
                        `<div class="g9li"><b class="${be[2]}">${l(be[0])}</b> · ${l(be[1])}</div>`,
                    )
                    .join("")
                : '<div class="trnote">Nenhum movimento fora do normal entre os mercados agora.</div>')));
          const me = R.an;
          return (
            me && me.D.length
              ? (oe +=
                  `<div class="trsec">${z("ok", "HISTÓRICO")} Dias parecidos com hoje</div><div class="trnote">Dias em que ${me.usar.map((be) => `${I(be)} ${R.z[be] > 0 ? "subiu" : "caiu"}`).join(", ")} (cada um pelo menos 0,3 desvio). ${he(me.D)}.</div>` +
                  m(
                    [
                      "O que aconteceu",
                      "Média",
                      "Mediana",
                      "Subiu em",
                      "Amostra",
                    ],
                    [
                      ["Ibovespa no mesmo dia", me.ibov],
                      ["Ibovespa no dia seguinte", me.ib1],
                      ["Ibovespa em 5 dias", me.ib5],
                      ["Vale no mesmo dia", me.vale],
                      ["Petrobras no mesmo dia", me.petr],
                    ].map(
                      ([be, X]) =>
                        `<tr><td>${be}</td><td class="num ${p(X.media)}">${c(X.media)}</td><td class="num">${c(X.mediana)}</td><td class="num">${X.pos != null ? d(X.pos, 0) + "%" : "—"}</td><td class="num">${X.n}</td></tr>`,
                    ),
                    "relhist",
                  ) +
                  `<div class="trfont">${l(we(me.D.length))}</div>`)
              : (oe +=
                  '<div class="trnote">Sem motores fora do normal hoje para buscar dias parecidos.</div>'),
            oe + `<div class="trfont">${l(ie.fonte)}</div>`
          );
        },
      }));
    const Ve = {
      copom: [
        "2023-02-01",
        "2023-03-22",
        "2023-05-03",
        "2023-06-21",
        "2023-08-02",
        "2023-09-20",
        "2023-11-01",
        "2023-12-13",
        "2024-01-31",
        "2024-03-20",
        "2024-05-08",
        "2024-06-19",
        "2024-07-31",
        "2024-09-18",
        "2024-11-06",
        "2024-12-11",
        "2025-01-29",
        "2025-03-19",
        "2025-05-07",
        "2025-06-18",
        "2025-07-30",
        "2025-09-17",
        "2025-11-05",
        "2025-12-10",
        "2026-01-28",
        "2026-03-18",
        "2026-05-06",
        "2026-06-17",
        "2026-08-05",
        "2026-09-16",
      ],
      fomc: [
        "2023-02-01",
        "2023-03-22",
        "2023-05-03",
        "2023-06-14",
        "2023-07-26",
        "2023-09-20",
        "2023-11-01",
        "2023-12-13",
        "2024-01-31",
        "2024-03-20",
        "2024-05-01",
        "2024-06-12",
        "2024-07-31",
        "2024-09-18",
        "2024-11-07",
        "2024-12-18",
        "2025-01-29",
        "2025-03-19",
        "2025-05-07",
        "2025-06-18",
        "2025-07-30",
        "2025-09-17",
        "2025-10-29",
        "2025-12-10",
        "2026-01-28",
        "2026-03-18",
        "2026-04-29",
        "2026-06-17",
        "2026-07-29",
        "2026-09-16",
        "2026-10-28",
      ],
    };
    function Je() {
      const Q = [],
        re = new Date();
      for (let ie = 2017; ie <= re.getFullYear(); ie++)
        for (let R = 0; R < 12; R++) {
          const z = new Date(Date.UTC(ie, R, 1));
          for (; z.getUTCDay() !== 5; ) z.setUTCDate(z.getUTCDate() + 1);
          z < re && Q.push(z.toISOString().slice(0, 10));
        }
      return Q;
    }
    const Ye = {
      copom: [
        "Decisão do Copom",
        "depois do fechamento: a reação da B3 é no dia seguinte",
        1,
      ],
      fomc: [
        "Decisão do Fed (FOMC)",
        "16h/15h de Brasília: o dia mostra parte da reação, o seguinte o resto",
        0,
      ],
      payroll: [
        "Payroll (emprego nos EUA)",
        "primeira sexta do mês, antes da abertura (regra; em alguns meses a data muda)",
        0,
      ],
    };
    function Xe(Q, re) {
      const ie = Q === "payroll" ? Je() : Ve[Q],
        R = ["IBOV", "USDBRL", "US10Y", "SPX"],
        z = A();
      if (!z) return null;
      const oe = z.series.IBOV;
      if (!oe) return null;
      const me = (X) => {
          const xe = oe.d.findIndex(($e) => $e >= X);
          return xe >= 0 ? oe.d[xe + re] : null;
        },
        be = ie.map(me).filter(Boolean);
      return R.map((X) => {
        const xe = se(X);
        if (!xe) return null;
        const $e = be.map((w) => xe.get(w)).filter((w) => w != null),
          fe = [...xe.values()].slice(-2500),
          Fe = (w) => Pe(w.map(Math.abs)).media;
        return { k: X, ...Pe($e), absEv: Fe($e), absTodos: Fe(fe), dias: be };
      }).filter(Boolean);
    }
    function ot() {
      const Q = A();
      if (!Q || !Q.selic) return [];
      const { d: re, v: ie } = Q.selic,
        R = [];
      for (let me = 1; me < ie.length; me++)
        ie[me] !== ie[me - 1] &&
          R.push({ d: re[me], de: ie[me - 1], para: ie[me] });
      const z = [];
      R.forEach((me) => {
        const be = me.para > me.de ? "alta" : "queda",
          X = z[z.length - 1];
        X && X.dir === be && Date.parse(me.d) - Date.parse(X.fim) < 200 * 864e5
          ? ((X.fim = me.d), (X.para = me.para), X.n++)
          : z.push({
              dir: be,
              ini: me.d,
              fim: me.d,
              de: me.de,
              para: me.para,
              n: 1,
            });
      });
      const oe = (me, be, X) => {
        const xe = Q.series[me];
        if (!xe) return null;
        const $e = xe.d.findIndex((w) => w >= be),
          fe = xe.d.findIndex((w) => w >= X),
          Fe = fe < 0 ? xe.d.length - 1 : fe;
        return $e >= 0 ? (xe.c[Fe] / xe.c[$e] - 1) * 100 : null;
      };
      return z.map((me, be) => {
        const X = z[be + 1]
          ? z[be + 1].ini
          : new Date().toISOString().slice(0, 10);
        return {
          ...me,
          fimPer: X,
          ibov: oe("IBOV", me.ini, X),
          dolar: oe("USDBRL", me.ini, X),
        };
      });
    }
    function Ke(Q, re) {
      const ie = ve(Q, re);
      return ie
        ? {
            ks: Q,
            n: ie.D.length,
            D: ie.D,
            m: Q.map((R, z) => Q.map((oe, me) => ue(ie.cols[z], ie.cols[me]))),
          }
        : null;
    }
    const at = (Q) => {
      if (Q == null) return "#111";
      const re = Math.min(1, Math.abs(Q));
      return Q >= 0
        ? `rgba(37,99,235,${0.15 + re * 0.8})`
        : `rgba(220,38,38,${0.15 + re * 0.8})`;
    };
    function rt(Q, re) {
      return `<table class="hm9"><tr><th></th>${Q.ks.map((ie) => `<th>${l(I(ie).split(" ")[0])}</th>`).join("")}</tr>${Q.ks.map((ie, R) => `<tr><th>${l(I(ie).split(" ")[0])}</th>${Q.m[R].map((z, oe) => `<td style="background:${at(R === oe ? null : z)}">${R === oe ? "—" : d(z, 2)}</td>`).join("")}</tr>`).join("")}</table>`;
    }
    function dt(Q) {
      const re = A() && A().series[Q];
      if (!re) return null;
      const ie = {};
      re.d.forEach((oe, me) => {
        ie[oe.slice(0, 7)] = re.c[me];
      });
      const R = Object.keys(ie).sort(),
        z = {};
      for (let oe = 1; oe < R.length; oe++)
        z[R[oe]] = (ie[R[oe]] / ie[R[oe - 1]] - 1) * 100;
      return {
        out: Array.from({ length: 12 }, (oe, me) => ({
          m: me + 1,
          ...Pe(
            Object.entries(z)
              .filter(([be]) => +be.slice(5) === me + 1)
              .map(([, be]) => be),
          ),
        })),
        de: R[1],
        ate: R[R.length - 1],
      };
    }
    ((t.hs = t.hs || { aba: "corr", jan: 250, ev: "copom", ativo: "IBOV" }),
      (s.HIST =
        "Biblioteca histórica: correlação, Copom, Fed, payroll, volatilidade por horário, ciclos e sazonalidade"),
      (n.BIBLIOTECA = "HIST"),
      (n.HISTORICO = "HIST"),
      (o.HIST = {
        load: k,
        body: (Q, re) => {
          const ie = A();
          if (!ie) return f(i("hist", j()).err || "");
          const R = t.hs,
            z = R.aba;
          let oe = `<div class="g9bar">${[
            ["corr", "Correlação"],
            ["ev", "Copom, Fed e payroll"],
            ["hora", "Volatilidade por horário"],
            ["ciclo", "Ciclos da Selic"],
            ["saz", "Sazonalidade"],
          ]
            .map(
              ([me, be]) =>
                `<button class="g9b${z === me ? " on" : ""}" data-hs="aba|${me}|${re}">${be}</button>`,
            )
            .join("")}</div>`;
          if (z === "corr") {
            const me = [
                "IBOV",
                "USDBRL",
                "SPX",
                "BRENT",
                "US10Y",
                "OURO",
                "VALE3",
                "PETR4",
                "BTC",
              ].filter((X) => ie.series[X]),
              be = Ke(me, R.jan);
            oe +=
              `<div class="g9bar">${[
                [60, "60 dias"],
                [250, "1 ano"],
                [750, "3 anos"],
                [2500, "10 anos"],
              ]
                .map(
                  ([X, xe]) =>
                    `<button class="g9b${R.jan === X ? " on" : ""}" data-hs="jan|${X}|${re}">${xe}</button>`,
                )
                .join("")}</div>` +
              (be
                ? rt(be) +
                  `<div class="trfont">Correlação das variações diárias (azul = andam juntos, vermelho = em sentidos opostos). ${be.n} dias em comum, ${he(be.D)}. Correlação muda com o tempo e não indica causa.</div>`
                : f("Séries insuficientes."));
          } else if (z === "ev") {
            const me = R.ev,
              be = Ye[me];
            ((oe += `<div class="g9bar">${Object.entries(Ye)
              .map(
                ([xe, $e]) =>
                  `<button class="g9b${me === xe ? " on" : ""}" data-hs="ev|${xe}|${re}">${$e[0]}</button>`,
              )
              .join(
                "",
              )}</div><div class="trnote">${l(be[0])}: ${l(be[1])}.</div>`),
              [
                [0, "No dia do evento"],
                [1, "No dia seguinte"],
              ].forEach(([xe, $e]) => {
                const fe = Xe(me, xe);
                fe &&
                  (oe +=
                    `<div class="trsec">${$e}</div>` +
                    m(
                      [
                        "Mercado",
                        "Média",
                        "Mediana",
                        "Subiu em",
                        "Mexe (média absoluta)",
                        "Dia comum",
                        "Amostra",
                      ],
                      fe.map(
                        (Fe) =>
                          `<tr><td>${l(I(Fe.k))}</td><td class="num ${p(Fe.media)}">${Me(Fe.k, Fe.media)}</td><td class="num">${Me(Fe.k, Fe.mediana)}</td><td class="num">${Fe.pos != null ? d(Fe.pos, 0) + "%" : "—"}</td><td class="num">${Me(Fe.k, Fe.absEv)}</td><td class="num mut">${Me(Fe.k, Fe.absTodos)}</td><td class="num">${Fe.n}</td></tr>`,
                      ),
                      "ev" + xe,
                    ));
              }));
            const X = Xe(me, 0);
            ((oe += `<div class="trfont">${X && X[0] ? l(we(X[0].n)) + " Períodos: " + (me === "payroll" ? "desde 2017 (regra da 1ª sexta)" : "2023 a 2026 (datas oficiais)") + '. "Mexe" compara o tamanho médio do movimento com um dia comum.' : ""}</div>`),
              me === "copom" &&
                typeof SZ < "u" &&
                SZ.v &&
                SZ.v.copom &&
                (oe +=
                  '<div class="trnote">Desde 2000, separado por alta e corte de juros: <button class="trlk" data-trtela="SAZ">Sazonalidade → Copom</button></div>'));
          } else if (z === "hora") {
            const me = ie.horas;
            if (!me) return oe + f("Sem velas de 60 min agora.");
            const be = (X, xe) => {
              const $e = Math.max(...X.map((fe) => fe.media));
              return (
                `<div class="trsec">${xe}</div>` +
                X.map(
                  (fe) =>
                    `<div class="vh9"><span class="num">${String(fe.h).padStart(2, "0")}h</span><i style="width:${(fe.media / $e) * 100}%"></i><b>${d(fe.media, 2)}%</b><em class="mut">${fe.n}</em></div>`,
                ).join("")
              );
            };
            oe +=
              be(
                me.ibov,
                "Ibovespa: movimento médio em cada hora (velas de 60 min)",
              ) +
              be(me.dolar, "Dólar: movimento médio em cada hora") +
              '<div class="trfont">Últimos 60 dias, horário de Brasília; número à direita = quantidade de velas. A primeira e a última hora costumam mexer mais. Amostra curta: confira de novo em alguns meses.</div>';
          } else if (z === "ciclo") {
            const me = ot();
            oe += me.length
              ? m(
                  [
                    "Ciclo",
                    "Começou",
                    "Última mudança",
                    "Selic",
                    "Ibovespa no período",
                    "Dólar no período",
                  ],
                  me.map(
                    (be) =>
                      `<tr><td class="${be.dir === "alta" ? "tr" : "tg"}">${be.dir === "alta" ? "Alta" : "Queda"} (${be.n} ${be.n > 1 ? "decisões" : "decisão"})</td><td class="num">${be.ini.split("-").reverse().join("/")}</td><td class="num">${be.fim.split("-").reverse().join("/")}</td><td class="num">${d(be.de)}% → ${d(be.para)}%</td><td class="num ${p(be.ibov)}">${c(be.ibov, 1)}</td><td class="num ${p(-be.dolar)}">${c(be.dolar, 1)}</td></tr>`,
                  ),
                  "ciclos",
                ) +
                `<div class="trfont">Ciclo = mudanças seguidas da Selic no mesmo sentido; período vai até o começo do ciclo seguinte (ou hoje). ${me.length} ciclos em 10 anos: amostra pequena, cada ciclo teve um contexto diferente.</div>`
              : f("Sem a série da Selic agora.");
          } else {
            const me = Object.keys(ie.series),
              be = me.includes(R.ativo) ? R.ativo : "IBOV",
              X = dt(be),
              xe = [
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
              $e = new Date().getMonth() + 1;
            oe +=
              `<div class="g9bar">${me.map((fe) => `<button class="g9b${fe === be ? " on" : ""}" data-hs="ativo|${fe}|${re}">${l(I(fe).split(" ")[0])}</button>`).join("")}</div>` +
              (X
                ? m(
                    ["Mês", "Média", "Mediana", "Subiu em", "Anos"],
                    X.out.map(
                      (fe) =>
                        `<tr class="${fe.m === $e ? "eu" : ""}"><td>${xe[fe.m - 1]}${fe.m === $e ? " (agora)" : ""}</td><td class="num ${p(fe.media)}">${c(fe.media)}</td><td class="num">${c(fe.mediana)}</td><td class="num">${fe.pos != null ? d(fe.pos, 0) + "%" : "—"}</td><td class="num">${fe.n}</td></tr>`,
                    ),
                    "saz",
                  ) +
                  `<div class="trfont">${l(I(be))}, ${X.de} a ${X.ate}: só ~10 anos por mês, amostra pequena. Para o Ibovespa desde 2000, eleições e fim de ano: <button class="trlk" data-trtela="SAZ">Sazonalidade completa</button></div>`
                : "");
          }
          return (
            oe +
            `<div class="trfont">${l(ie.fonte)}${ie.falhas && ie.falhas.length ? " · sem dados agora: " + l(ie.falhas.join(", ")) : ""}</div>`
          );
        },
      }));
    const vt = {
        us10y_sobe: ["US10Y", 1, "Juros americanos sobem"],
        us10y_cai: ["US10Y", -1, "Juros americanos caem"],
        dolar_sobe: ["USDBRL", 1, "Dólar sobe"],
        dolar_cai: ["USDBRL", -1, "Dólar cai"],
        brent_sobe: ["BRENT", 1, "Petróleo sobe"],
        brent_cai: ["BRENT", -1, "Petróleo cai"],
        spx_cai: ["SPX", -1, "Bolsa americana cai forte"],
        vix_sobe: ["VIX", 1, "Medo sobe (VIX)"],
        ouro_sobe: ["OURO", 1, "Ouro sobe"],
      },
      ft = {
        US10Y: [
          "Leilões do Tesouro americano com demanda fraca",
          "Inflação (CPI/PCE) acima do esperado",
          "Discurso duro do Fed",
          "DXY subindo junto",
        ],
        USDBRL: [
          "DI futuro abrindo",
          "Fluxo estrangeiro saindo da B3",
          "Notícia fiscal negativa",
          "DXY forte lá fora",
        ],
        BRENT: [
          "Estoques americanos (EIA) caindo",
          "Notícia da OPEP+ ou de oferta",
          "Tensão geopolítica no Oriente Médio",
        ],
        SPX: [
          "VIX acima de 20",
          "Resultados de big techs fracos",
          "Juros americanos subindo",
        ],
        VIX: [
          "Queda forte das bolsas",
          "Notícia geopolítica",
          "Crédito (high yield) piorando",
        ],
        OURO: [
          "Dólar global (DXY) caindo",
          "Juros reais americanos caindo",
          "Bancos centrais comprando",
        ],
      };
    t.cn = t.cn || { k: "us10y_sobe", hz: 1, q: 80 };
    function ht() {
      const Q = t.cn,
        [re, ie] = vt[Q.k],
        R = se(re);
      if (!R) return null;
      const z = [...R.entries()].slice(-2500),
        oe = z
          .map(([, fe]) => ie * fe)
          .filter((fe) => fe > 0)
          .sort((fe, Fe) => fe - Fe),
        me = oe.length ? oe[Math.floor(oe.length * (Q.q / 100))] : 0,
        be = z.filter(([, fe]) => ie * fe >= me).map(([fe]) => fe),
        X = Object.keys(A().series).filter((fe) => fe !== re),
        xe = Q.hz,
        $e = X.map((fe) => {
          const Fe = A().series[fe],
            w = new Map(Fe.d.map((W, Te) => [W, Te])),
            H = be
              .map((W) => {
                const Te = w.get(W);
                if (Te == null || Te < 1) return null;
                const V = Fe.c[Te - 1],
                  ae = Fe.c[Math.min(Fe.c.length - 1, Te + xe - 1)];
                return J(fe) ? (ae - V) * 100 : (ae / V - 1) * 100;
              })
              .filter((W) => W != null),
            N = Pe(H);
          return {
            k: fe,
            ...N,
            t: N.sd ? N.media / (N.sd / Math.sqrt(N.n)) : 0,
          };
        });
      return {
        drv: re,
        dir: ie,
        lim: me,
        dias: be,
        r: $e.sort((fe, Fe) => Math.abs(Fe.t) - Math.abs(fe.t)),
      };
    }
    ((s.CEN =
      "Cenários condicionais: o que costuma acontecer com dólar, ouro, bolsas e ações quando um mercado se move"),
      (n.CENARIO = "CEN"),
      (n.CENARIOS = "CEN"),
      (o.CEN = {
        load: k,
        body: (Q, re) => {
          if (!A()) return f(i("hist", j()).err || "");
          const ie = t.cn,
            R = ht();
          let z = `<div class="g9bar">${Object.entries(vt)
            .map(
              ([oe, me]) =>
                `<button class="g9b${ie.k === oe ? " on" : ""}" data-cn="k|${oe}|${re}">${l(me[2])}</button>`,
            )
            .join("")}</div><div class="g9bar">Prazo ${[
            [1, "mesmo dia"],
            [5, "5 pregões"],
          ]
            .map(
              ([oe, me]) =>
                `<button class="g9b${ie.hz === oe ? " on" : ""}" data-cn="hz|${oe}|${re}">${me}</button>`,
            )
            .join("")} · Intensidade ${[
            [50, "metade maior"],
            [80, "20% maiores"],
            [95, "5% maiores"],
          ]
            .map(
              ([oe, me]) =>
                `<button class="g9b${ie.q === oe ? " on" : ""}" data-cn="q|${oe}|${re}">${me}</button>`,
            )
            .join("")}</div>`;
          return R
            ? ((z += `<div class="trnote"><b>Cenário: ${l(vt[ie.k][2])}</b> — dias em que ${l(I(R.drv))} ${R.dir > 0 ? "subiu" : "caiu"} pelo menos ${Me(R.drv, R.dir * R.lim, 2)} (${R.dias.length} dias, ${he(R.dias)}). Abaixo, o que os outros mercados fizeram ${ie.hz === 1 ? "no mesmo dia" : "em 5 pregões, contando o dia"}.</div>`),
              (z += m(
                [
                  "Mercado",
                  "Média",
                  "Intervalo (95%)",
                  "Subiu em",
                  "Amostra",
                  "Força",
                ],
                R.r.map(
                  (oe) =>
                    `<tr data-g9g="${/^[A-Z]{4}\d/.test(oe.k) ? l(oe.k) : ""}"><td>${l(I(oe.k))}</td><td class="num ${p(J(oe.k) || oe.k === "VIX" || oe.k === "USDBRL" ? -oe.media : oe.media)}"><b>${Me(oe.k, oe.media)}</b></td><td class="num mut">${oe.ic != null ? Me(oe.k, oe.media - oe.ic) + " a " + Me(oe.k, oe.media + oe.ic) : "—"}</td><td class="num">${oe.pos != null ? d(oe.pos, 0) + "%" : "—"}</td><td class="num">${oe.n}</td><td class="num">${Math.abs(oe.t) >= 3 ? '<b class="am">forte</b>' : Math.abs(oe.t) >= 2 ? "média" : '<span class="mut">fraca</span>'}</td></tr>`,
                ),
                "cen",
              )),
              (z +=
                '<div class="trsec">O que confirmaria ou enfraqueceria o cenário</div>' +
                (ft[R.drv] || [])
                  .map((oe) => `<div class="g9li">✓ ${l(oe)}</div>`)
                  .join("") +
                '<div class="g9li mut">✗ O movimento perder força no dia seguinte, ou os mercados ligados não acompanharem.</div>'),
              z +
                `<div class="trfont">"Força" = o quanto a média se afasta de zero considerando a amostra (forte ≈ estatisticamente clara). ${l(we(R.dias.length))} Não é previsão: organiza possibilidades. Toque numa ação para abrir o gráfico.</div>`)
            : z + f("Sem a série desse mercado.");
        },
      }),
      (s.PESQ =
        "Central de pesquisa: compara empresas (múltiplos, resultados, estimativas e fundamentos) · PESQ PETR4 PRIO3 VALE3"),
      (n.PESQUISA = "PESQ"),
      (n.COMPARA = "PESQ"));
    const qe = (Q) =>
      String(Q.arg || "")
        .toUpperCase()
        .split(/[\s,;]+/)
        .filter((re) => /^[A-Z0-9.]{2,12}$/.test(re))
        .slice(0, 6);
    o.PESQ = {
      livre: !0,
      load: (Q) => Promise.all(qe(Q).map((re) => r("fund", { tk: re }, 6e5))),
      body: (Q, re) => {
        const ie = qe(Q);
        if (ie.length < 2)
          return '<div class="trnote">Escreva duas ou mais empresas: PESQ PETR4 PRIO3 RECV3</div>';
        const R = ie.map((X) => ({ tk: X, v: i("fund", { tk: X }).v }));
        if (R.every((X) => !X.v))
          return f(
            ie.map((X) => i("fund", { tk: X }).err).filter(Boolean)[0] || "",
          );
        const z = (X, xe) => {
            try {
              return xe(X.v);
            } catch {
              return null;
            }
          },
          oe = [
            ["Preço", (X) => X.tv.close, 2, 0],
            ["No ano", (X) => X.tv["Perf.YTD"], "%", 1],
            ["Valor de mercado", (X) => X.tv.market_cap_basic, "big", 0],
            ["P/L", (X) => X.tv.price_earnings_ttm, 1, -1],
            ["P/VPA", (X) => X.tv.price_book_ratio, 2, -1],
            ["EV/EBITDA", (X) => X.tv.enterprise_value_ebitda_ttm, 1, -1],
            ["Dividend yield", (X) => X.tv.dividend_yield_recent, "%", 1],
            ["ROE", (X) => X.tv.return_on_equity, "%", 1],
            ["Margem líquida", (X) => X.tv.net_margin, "%", 1],
            ["Dívida / patrimônio", (X) => X.tv.debt_to_equity, 2, -1],
            [
              "Crescimento da receita (12m)",
              (X) => X.yahoo.numeros.cresc_receita * 100,
              "%",
              1,
            ],
            ["Preço-alvo médio", (X) => X.yahoo.analistas.alvo_medio, 2, 0],
            [
              "Potencial até o alvo",
              (X) => (X.yahoo.analistas.alvo_medio / X.tv.close - 1) * 100,
              "%",
              1,
            ],
            [
              "Nota dos analistas (1 compra … 5 venda)",
              (X) => X.yahoo.analistas.nota,
              1,
              -1,
            ],
            [
              "Surpresa no último resultado",
              (X) => X.yahoo.resultados[0].surpresa_pct,
              "%",
              1,
            ],
            [
              "Revisão do LPA do ano em 30 dias",
              (X) => {
                const xe = (X.yahoo.projecoes || []).find(
                  ($e) => $e.periodo === "0y",
                );
                return xe &&
                  xe.revisao &&
                  xe.revisao.atual != null &&
                  xe.revisao.d30
                  ? (xe.revisao.atual / xe.revisao.d30 - 1) * 100
                  : null;
              },
              "%",
              1,
            ],
            [
              "Revisões para cima / para baixo (30d)",
              (X) => {
                const xe = (X.yahoo.projecoes || []).find(
                  ($e) => $e.periodo === "0y",
                );
                return xe && xe.revisoes
                  ? `${xe.revisoes.sobe30 ?? 0} / ${xe.revisoes.desce30 ?? 0}`
                  : null;
              },
              "txt",
              0,
            ],
          ],
          me = (X, xe) =>
            X == null || (typeof X == "number" && !isFinite(X))
              ? "—"
              : xe === "%"
                ? d(X, 1) + "%"
                : xe === "big"
                  ? u(X)
                  : xe === "txt"
                    ? l(X)
                    : d(X, xe);
        let be = m(
          ["Indicador"].concat(ie),
          oe.map(([X, xe, $e, fe]) => {
            const Fe = R.map((N) => z(N, xe)),
              w = Fe.filter((N) => typeof N == "number" && isFinite(N)),
              H =
                fe === 1
                  ? Math.max(...w)
                  : fe === -1
                    ? Math.min(...w.filter((N) => N > 0))
                    : null;
            return `<tr><td>${X}</td>${Fe.map((N) => `<td class="num${H != null && N === H && w.length > 1 ? " pq9b" : ""}">${me(N, $e)}</td>`).join("")}</tr>`;
          }),
          "pesq",
        );
        return (
          (be +=
            '<div class="trsec">Mudanças nos fundamentos (último balanço anual × anterior)</div>' +
            R.map((X) => {
              const xe = (X.v && X.v.balancos && X.v.balancos.anos) || [];
              if (xe.length < 2)
                return `<div class="g9li"><b class="tk">${X.tk}</b> <span class="mut">sem dois anos de balanço</span></div>`;
              const $e = xe[xe.length - 1],
                fe = xe[xe.length - 2],
                Fe = [
                  [
                    "ROE",
                    (w) => w.rentabilidade.retorno_sobre_pl_pct,
                    "p.p.",
                    1,
                  ],
                  [
                    "margem líquida",
                    (w) => w.rentabilidade.margem_liquida_pct,
                    "p.p.",
                    1,
                  ],
                  [
                    "liquidez corrente",
                    (w) => w.liquidez && w.liquidez.corrente,
                    "",
                    1,
                  ],
                  [
                    "capitais de terceiros/PL",
                    (w) => w.endividamento.capitais_terceiros_sobre_pl,
                    "",
                    -1,
                  ],
                ]
                  .map(([w, H, N, W]) => {
                    let Te, V;
                    try {
                      ((Te = H($e)), (V = H(fe)));
                    } catch {}
                    if (Te == null || V == null) return "";
                    const ae = Te - V,
                      ee = ae * W > 0;
                    return `<span class="${Math.abs(ae) < 0.01 ? "mut" : ee ? "tg" : "tr"}">${w} ${d(V, 2)} → ${d(Te, 2)}</span>`;
                  })
                  .filter(Boolean);
              return `<div class="g9li"><b class="tk">${X.tk}</b> ${fe.ano}→${$e.ano}: ${Fe.join(" · ") || "—"}</div>`;
            }).join("")),
          (be +=
            '<div class="trsec">Resultados trimestrais (LPA × esperado)</div>' +
            m(
              ["Trimestre"].concat(ie),
              [
                ...new Set(
                  R.flatMap((X) =>
                    ((X.v && X.v.yahoo && X.v.yahoo.resultados) || []).map(
                      (xe) => xe.trimestre,
                    ),
                  ),
                ),
              ]
                .sort()
                .reverse()
                .slice(0, 4)
                .map(
                  (X) =>
                    `<tr><td>${X}</td>${R.map((xe) => {
                      const $e = (
                        (xe.v && xe.v.yahoo && xe.v.yahoo.resultados) ||
                        []
                      ).find((fe) => fe.trimestre === X);
                      return `<td class="num ${$e ? p($e.surpresa_pct) : ""}">${$e ? d($e.lpa) + " (" + c($e.surpresa_pct, 1) + ")" : "—"}</td>`;
                    }).join("")}</tr>`,
                ),
              "pesqres",
            )),
          be +
            `<div class="g9bar"><button class="g9b" data-pq="ia|${re}">Relatório comparativo (IA)</button><button class="g9b" data-pq="pares|${re}">Comparar preços (COMP)</button></div><div class="trfont">Verde = melhor da linha. TradingView e Yahoo (consenso). Revisão do LPA = estimativa do ano hoje contra 30 dias atrás. Não é recomendação.</div>`
        );
      },
    };
    const Le = () => {
      const Q = a();
      return (
        Q.uso ?? (Q.uso = { c: {}, a: {}, w: {}, ini: Date.now() }),
        Q.uso
      );
    };
    window.trUso = (Q, re) => {
      const ie = Le();
      re.f && (ie.c[re.f] = (ie.c[re.f] || 0) + 1);
      const R =
        re.tk ||
        (/^[A-Z]{4}\d{1,2}$/.test(String(re.arg || "").split(/\s+/)[0])
          ? String(re.arg).split(/\s+/)[0]
          : "");
      R && (ie.a[R] = (ie.a[R] || 0) + 1);
      const z = a().ws;
      ((ie.w[z] = (ie.w[z] || 0) + 1),
        ["c", "a", "w"].forEach((oe) => {
          const me = Object.entries(ie[oe]);
          me.length > 60 &&
            (me.sort((be, X) => X[1] - be[1]),
            (ie[oe] = Object.fromEntries(me.slice(0, 40))));
        }));
    };
    const ke = (Q, re) =>
      Object.entries(Q || {})
        .sort((ie, R) => R[1] - ie[1])
        .slice(0, re);
    ((s.PERFIL =
      "Seu perfil de uso: ativos, comandos, mercados e relatórios que você mais usa (sem decidir por você)"),
      (n.PREFERENCIAS = "PERFIL"),
      (o.PERFIL = {
        body: (Q, re) => {
          const ie = Le(),
            R = a().mon || [],
            z = ke(ie.a, 10),
            oe = ke(ie.c, 10),
            me = ke(ie.w, 5),
            be = {};
          (t.audIA || []).forEach((w) => {
            be[w.modo] = (be[w.modo] || 0) + 1;
          });
          const X = a().ind || {},
            xe = ((S.ax || {}).alpx || []).filter((w) => !w.fired).length,
            $e = ((S.ax || {}).alc || []).length,
            fe = z.filter(([w]) => !R.includes(w)).slice(0, 4),
            Fe = a().wss || {};
          return `<div class="trsec">Ativos que você mais consulta</div><div class="trkv">${z.map(([w, H]) => `<span data-g9g="${l(w)}" class="g9lk">${l(w)} <b>${H}</b></span>`).join("") || '<span class="mut">ainda aprendendo…</span>'}</div>
  ${fe.length ? `<div class="g9li am">Você consulta ${fe.map((w) => w[0]).join(", ")} com frequência e eles não estão no MON. <button class="g9b" data-pf="mon|${fe.map((w) => w[0]).join(",")}|${re}">Adicionar ao monitor</button></div>` : ""}
  <div class="trsec">Comandos favoritos</div><div class="trkv">${oe.map(([w, H]) => `<span>${l(w)} <b>${H}</b></span>`).join("") || '<span class="mut">—</span>'}</div>
  ${oe.length >= 3 ? `<div class="g9li"><button class="g9b" data-pf="ws||${re}">Criar o espaço "Meus favoritos" com eles</button></div>` : ""}
  <div class="trsec">Espaços mais usados</div><div class="trkv">${me.map(([w, H]) => `<span>${l((Fe[w] || {}).n || w)} <b>${H}</b></span>`).join("") || '<span class="mut">—</span>'}</div>
  <div class="trsec">Indicadores ligados nos gráficos</div><div class="trkv">${Object.entries(
    X,
  )
    .filter(([, w]) => w)
    .map(
      ([w]) =>
        `<span>${l({ m9: "MM9", m20: "MM20", m50: "MM50", m200: "MM200", vol: "Volume", rsi: "RSI", macd: "MACD", atr: "ATR", fib: "Fibonacci", sr: "S/R" }[w] || w)}</span>`,
    )
    .join("")}</div>
  <div class="trsec">Relatórios e alertas</div><div class="trkv">${Object.entries(
    be,
  )
    .map(([w, H]) => `<span>IA ${l(w)} <b>${H}</b></span>`)
    .join(
      "",
    )}<span>Alertas de preço <b>${xe}</b></span><span>Alertas combinados <b>${$e}</b></span></div>
  <div class="trsec">Últimas consultas</div><div class="trkv">${(t.hist || [])
    .slice(0, 15)
    .map((w) => `<span class="g9lk" data-trcmd="${l(w)}">${l(w)}</span>`)
    .join("")}</div>
  <div class="trfont">O terminal só registra o que você usa (neste aparelho e na sua conta) para sugerir atalhos. Nada é feito sem você tocar. Contando desde ${new Date(ie.ini).toLocaleDateString("pt-BR")}.</div>`;
        },
      }),
      document.addEventListener("focusin", (Q) => {
        if (!Q.target || Q.target.id !== "trcmd" || Q.target.value) return;
        const re = document.getElementById("trsug");
        if (!re) return;
        const ie = Le(),
          R = ke(ie.a, 4)
            .map(([z]) => [z, "ativo que você mais consulta"])
            .concat(
              ke(ie.c, 4)
                .filter(([z]) => !/^(Q|G|GP|GIP)$/.test(z))
                .map(([z]) => [z, s[z] || ""]),
            );
        R.length &&
          ((re.innerHTML = R.map(
            ([z, oe]) =>
              `<button data-trsug="${l(z)}"><b>${l(z)}</b> ${l(String(oe).slice(0, 60))}</button>`,
          ).join("")),
          (re.hidden = !1));
      }),
      document.addEventListener("focusout", (Q) => {
        Q.target &&
          Q.target.id === "trcmd" &&
          setTimeout(() => {
            const re = document.getElementById("trsug");
            re && !re.matches(":hover") && (re.hidden = !0);
          }, 200);
      }),
      document.addEventListener(
        "click",
        async (Q) => {
          const re =
            Q.target.closest &&
            Q.target.closest(
              "[data-hs],[data-cn],[data-rl],[data-pq],[data-pf]",
            );
          if (!re) return;
          Q.stopPropagation();
          const ie = re.dataset;
          if (ie.hs) {
            const [R, z, oe] = ie.hs.split("|");
            (R === "aba"
              ? (t.hs.aba = z)
              : R === "jan"
                ? (t.hs.jan = +z)
                : R === "ev"
                  ? (t.hs.ev = z)
                  : R === "ativo" && (t.hs.ativo = z),
              x(+oe));
            return;
          }
          if (ie.cn) {
            const [R, z, oe] = ie.cn.split("|");
            (R === "k" ? (t.cn.k = z) : (t.cn[R] = +z), x(+oe));
            return;
          }
          if (ie.rl) {
            const [R, z] = ie.rl.split("|");
            if (R === "cen") {
              v("CEN", y(+z));
              return;
            }
            if (R === "hist") {
              v("HIST", y(+z));
              return;
            }
            const oe = Se();
            v(
              "ASKB Relacione os movimentos de hoje e diga o que eles podem significar para a bolsa brasileira, separando fato de interpretação. Movimentos: " +
                oe.fatos
                  .map((me) => `${I(me.k)} ${Me(me.k, me.v)}`)
                  .join(", ") +
                ". Relações vistas: " +
                oe.rel.map((me) => me[0]).join(", ") +
                (oe.an
                  ? `. Em ${oe.an.D.length} dias parecidos desde ${oe.an.D[0]}, o Ibovespa teve média de ${d(oe.an.ibov.media, 2)}% no dia e ${d(oe.an.ib1.media, 2)}% no dia seguinte.`
                  : ""),
              y(+z),
            );
            return;
          }
          if (ie.pq) {
            const [R, z] = ie.pq.split("|"),
              oe = e.parse(g().p[+z]),
              me = qe(oe);
            if (R === "pares") {
              v("COMP " + me.join(" "), y(+z));
              return;
            }
            const be = me
              .map((X) => {
                const xe = i("fund", { tk: X }).v;
                if (!xe) return "";
                const $e = xe.tv || {},
                  fe = (xe.yahoo || {}).analistas || {};
                return `${X}: P/L ${d($e.price_earnings_ttm, 1)}, P/VPA ${d($e.price_book_ratio, 2)}, ROE ${d($e.return_on_equity, 1)}%, DY ${d($e.dividend_yield_recent, 1)}%, margem ${d($e.net_margin, 1)}%, alvo ${d(fe.alvo_medio)} (preço ${d($e.close)})`;
              })
              .filter(Boolean)
              .join("; ");
            v(
              "ASKB Faça um relatório comparativo entre " +
                me.join(", ") +
                " usando só estes dados (TradingView e Yahoo): " +
                be +
                ". Compare valuation, rentabilidade, dividendos e o que o consenso espera; diga os riscos de cada uma; separe fato de interpretação; sem recomendação.",
              y(+z),
            );
            return;
          }
          if (ie.pf) {
            const [R, z, oe] = ie.pf.split("|");
            if (R === "mon") {
              const me = a();
              (z.split(",").forEach((be) => {
                me.mon.includes(be) || me.mon.push(be);
              }),
                save(),
                toast("Adicionado ao MON."),
                x(+oe));
              return;
            }
            if (R === "ws") {
              const me = a(),
                be = ke(Le().c, 6)
                  .map(([X]) => X)
                  .filter(
                    (X) =>
                      s[X] &&
                      !["HELP", "BTST", "REPLAY", "JORNAL", "GRADE"].includes(
                        X,
                      ),
                  )
                  .slice(0, 4);
              if (be.length < 2)
                return toast("Use mais alguns comandos primeiro.");
              ((me.wss.fav = {
                n: "Meus favoritos",
                p: be,
                g: be.map((X, xe) => ({
                  x: (xe % 2) * 6,
                  y: Math.floor(xe / 2) * 13,
                  w: 6,
                  h: 13,
                })),
              }),
                (me.ws = "fav"),
                save(),
                render());
              return;
            }
          }
        },
        !0,
      ));
    try {
      HUB_SS.splice(0, HUB_SS.length, ["mercado:lab", "Painel"]);
    } catch {}
    try {
      const Q = avKey;
      avKey = (re) => Q(re) || re === "saz" || re === "se" || re === "lab";
    } catch {}
    {
      const Q = segM;
      segM = function (re) {
        return re === "mercado:lab" ||
          re === "mercado:saz" ||
          re === "mercado:se"
          ? ""
          : Q.apply(this, arguments);
      };
    }
    {
      const Q = sntPaint;
      sntPaint = function () {
        if (tab === "mercado" && MKT.tab === "lab") {
          render();
          return;
        }
        return Q.apply(this, arguments);
      };
    }
    const ze = (Q, re, ie, R, z) =>
        `<div class="sw9k"><span>${Q}</span><b class="${R || ""}">${re}</b>${ie ? `<em>${ie}</em>` : ""}${z || ""}</div>`,
      Ue = (Q, re) => {
        const ie = Q.filter((X) => X != null);
        if (ie.length < 2) return "";
        const R = Math.min(...ie),
          z = Math.max(...ie),
          oe = z - R || 1,
          me = 110,
          be = 26;
        return `<svg class="sw9s" viewBox="0 0 ${me} ${be}"><path d="${ie.map((X, xe) => (xe ? "L" : "M") + ((xe * (me - 2)) / (ie.length - 1) + 1).toFixed(1) + "," + (be - 2 - ((X - R) / oe) * (be - 4)).toFixed(1)).join("")}" fill="none" stroke="${re || "#86abcb"}" stroke-width="1.6"/></svg>`;
      };
    function We() {
      const Q = A() && A().series.IBOV;
      if (!Q) return null;
      const re = new Date().getFullYear(),
        ie = {};
      Q.d.forEach((be, X) => {
        const xe = +be.slice(0, 4);
        (ie[xe] || (ie[xe] = [])).push(Q.c[X]);
      });
      const R = Object.keys(ie)
        .map(Number)
        .filter((be) => be < re && ie[be].length > 200);
      if (!R.length) return null;
      const z = 252,
        oe = Array.from({ length: z }, (be, X) => {
          const xe = R.map(($e) => {
            const fe = ie[$e],
              Fe = fe[0];
            return (
              (fe[
                Math.min(
                  fe.length - 1,
                  Math.round((X / (z - 1)) * (fe.length - 1)),
                )
              ] /
                Fe -
                1) *
              100
            );
          });
          return Pe(xe).media;
        }),
        me = ie[re] ? ie[re].map((be) => (be / ie[re][0] - 1) * 100) : [];
      return { med: oe, at: me, anos: R };
    }
    function Re(Q, re) {
      const ie = We();
      if (!ie) return '<div class="sw9load">Carregando o histórico…</div>';
      const R = ie.med.concat(ie.at),
        z = Math.min(...R, 0),
        oe = Math.max(...R, 0),
        me = oe - z || 1,
        be = (fe) => 8 + (fe * (Q - 60)) / 251,
        X = (fe) => 10 + ((oe - fe) / me) * (re - 30),
        xe = (fe, Fe, w, H) =>
          `<path d="${fe.map((N, W) => (W ? "L" : "M") + be(W).toFixed(1) + "," + X(N).toFixed(1)).join("")}" fill="none" stroke="${Fe}" stroke-width="${w}"${H ? ' stroke-dasharray="5 4"' : ""}/>`,
        $e = [
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
      return `<svg class="sw9g" viewBox="0 0 ${Q} ${re}"><defs><linearGradient id="sw9a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#709bc2" stop-opacity=".35"/><stop offset="1" stop-color="#709bc2" stop-opacity="0"/></linearGradient></defs>
    ${[0, 1, 2, 3]
      .map((fe) => {
        const Fe = z + (me * fe) / 3;
        return `<line x1="8" x2="${Q - 52}" y1="${X(Fe)}" y2="${X(Fe)}" stroke="#373a3f" stroke-dasharray="2 4"/><text x="${Q - 48}" y="${X(Fe) + 4}" fill="#7ca4c7" font-size="11">${d(Fe, 0)}%</text>`;
      })
      .join("")}
    ${$e.map((fe, Fe) => `<text x="${be(Fe * 21 + 10)}" y="${re - 6}" fill="#787e89" font-size="10" text-anchor="middle">${fe}</text>`).join("")}
    ${ie.at.length > 1 ? `<path d="${ie.at.map((fe, Fe) => (Fe ? "L" : "M") + be(Fe).toFixed(1) + "," + X(fe).toFixed(1)).join("")}L${be(ie.at.length - 1)},${X(z)}L${be(0)},${X(z)}Z" fill="url(#sw9a)"/>` : ""}
    ${xe(ie.med, "#c9c5bc", 1.6, 1)}${ie.at.length > 1 ? xe(ie.at, "#86abcb", 2.4) : ""}</svg><div class="sw9leg"><i style="background:#86abcb"></i>Ibovespa em ${new Date().getFullYear()} <i style="background:#c9c5bc"></i>média de ${ie.anos.length} anos (${ie.anos[0]}–${ie.anos[ie.anos.length - 1]})</div>`;
    }
    const K = { b: 0, c: 0, s: 0 };
    function pe() {
      setTimeout(() => {
        try {
          const N = () => tab === "mercado" && MKT.tab === "lab";
          !A() &&
            !K.b &&
            ((K.b = 1),
            k().then(
              () => {
                ((K.b = 0), N() && A() && render());
              },
              () => {
                K.b = 0;
              },
            ));
          const W = i("cot", { s: Object.values(Be) });
          if (
            (!K.c &&
              Date.now() - W.ts > 6e4 &&
              Date.now() - (K.ct || 0) > 6e4 &&
              ((K.c = 1),
              (K.ct = Date.now()),
              Ge().then(
                () => {
                  ((K.c = 0), N() && render());
                },
                () => {
                  K.c = 0;
                },
              )),
            !K.s)
          ) {
            K.s = 1;
            const Te = JSON.stringify([
              typeof SNT < "u" && SNT.ts,
              typeof SZ < "u" && SZ.v && SZ.v.gerado,
            ]);
            (Promise.all([
              typeof sntCarrega == "function" ? sntCarrega() : 0,
              typeof szCarrega == "function" ? szCarrega() : 0,
            ])
              .catch(() => {})
              .then(() => {
                N() &&
                  JSON.stringify([SNT.ts, SZ.v && SZ.v.gerado]) !== Te &&
                  render();
              }),
              setTimeout(() => {
                K.s = 0;
              }, 6e4));
          }
        } catch {}
      }, 0);
      const Q = (typeof SNT < "u" && SNT.v) || {},
        re = Q.b3 || {},
        ie = Q.eua || {},
        R = Q.cripto || {},
        z = A(),
        oe = z ? Se() : null,
        me = (N) =>
          N == null
            ? ""
            : N <= 25
              ? "tr"
              : N <= 45
                ? "am"
                : N <= 55
                  ? ""
                  : (N <= 75, "tg"),
        be = z ? Ke(["IBOV", "USDBRL"], 60) : null,
        m6 = (() => { try { return m606Carrega(), (M606.v && M606.v.ibov) || null; } catch { return null; } })(),
        X = be && be.m[0][1] != null ? be.m[0][1] : m6 && m6.corr60 != null ? m6.corr60 : null,
        xe = z && se("IBOV"),
        $e0 = xe ? Pe([...xe.values()].slice(-20)).sd * Math.sqrt(252) : null,
        $e = $e0 != null && isFinite($e0) ? $e0 : m6 && m6.vol20 != null ? m6.vol20 : null,
        rg6 = oe ? null : (() => { try { const mp = M606.v && M606.v.mapa; if (!mp) return null; const g = (k) => { const x = mp.find((y) => y.k === k); return x && x.d1 != null ? x.d1 : null; }, pts = [[g("S&P 500"), 1, 0.3], [g("EWZ"), 1, 0.5], [g("DXY"), -1, 0.25], [g("USD/BRL"), -1, 0.4], [g("BTC"), 1, 1.5]].filter((x) => x[0] != null); const sc = pts.reduce((a, [v, sg, lim]) => a + (Math.abs(v) >= lim ? Math.sign(v) * sg : 0), 0); return { regime: sc >= 2 ? "risk-on" : sc <= -2 ? "risk-off" : "neutro", n: pts.length }; } catch { return null; } })(),
        fe = z
          ? Ke(
              ["IBOV", "USDBRL", "SPX", "BRENT", "US10Y", "OURO"].filter(
                (N) => z.series[N],
              ),
              250,
            )
          : null,
        Fe = re.valor,
        w = (z && z.horas && z.horas.ibov) || [],
        H = Math.max(...w.map((N) => N.media), 0.01);
      return `<div class="sw9"><div class="sw9hd"><div><div class="sw9brand">✦ Painel de mercado</div><div class="sw9sub">Sazonalidade, sentimento e relações entre mercados · amostra, período e limitações em cada número</div></div>
    <div class="sw9tabs">${[
      ["REL", "Relações"],
      ["HIST", "Biblioteca"],
      ["CEN", "Cenários"],
      ["PESQ", "Pesquisa"],
    ]
      .map(([N, W]) => `<button data-sw="${N}">${W}</button>`)
      .join("")}</div></div>
  <div class="sw9ks">${ze("SENTIMENTO B3", Fe == null ? "—" : Math.round(Fe), l(re.rotulo || ""), me(Fe), Ue((re.hist || []).map((N) => N.v)))}${ze("MEDO & GANÂNCIA EUA", ie.valor == null ? "—" : Math.round(ie.valor), l(ie.rotulo || ""), me(ie.valor))}${ze("CRIPTO", R.valor == null ? "—" : Math.round(R.valor), l(R.rotulo || ""), me(R.valor))}${(() => { const rg = oe ? oe.regime : rg6 ? rg6.regime : null; return ze("REGIME AGORA", rg || "—", oe ? oe.rel.length + " relações" : rg6 ? "S&P, EWZ, DXY, dólar e BTC hoje" : "", rg === "risk-off" ? "tr" : rg === "risk-on" ? "tg" : "am"); })()}${ze("CORRELAÇÃO IBOV × DÓLAR", X == null ? "—" : d(X, 2), "60 dias", X != null && X < -0.4 ? "am" : "")}${ze("VOLATILIDADE IBOV", $e == null ? "—" : d($e, 1) + "%", "20 dias, anualizada")}</div>
  <div class="sw9grid">
   <div class="sw9c sw9big"><div class="sw9t">IBOVESPA NO ANO × SAZONALIDADE <span>retorno acumulado</span></div>${Re(760, 260)}</div>
   <div class="sw9c"><div class="sw9t">RELAÇÕES AGORA <span>regras + histórico</span></div>${
     oe
       ? (oe.rel
           .slice(0, 4)
           .map(
             (N) =>
               `<div class="sw9r"><b class="${N[2]}">${l(N[0])}</b><em>${l(N[1])}</em></div>`,
           )
           .join("") ||
           '<div class="sw9load">Nenhum movimento fora do normal.</div>') +
         (oe.an
           ? `<div class="sw9r"><b>Dias parecidos: ${oe.an.D.length}</b><em>Ibovespa no dia seguinte: média ${c(oe.an.ib1.media)}, subiu em ${d(oe.an.ib1.pos, 0)}%</em></div>`
           : "")
       : '<div class="sw9load">Carregando…</div>'
   }<button class="sw9lk" data-sw="REL">abrir no terminal ›</button></div>
   <div class="sw9sec" id="sw9snt"><div class="sw9t">MEDO E GANÂNCIA <span>B3 calculado pelo app · EUA · cripto (alternative.me)</span></div><div class="sw9full">${typeof vSent == "function" ? vSent("") : ""}</div></div>
   <div class="sw9sec" id="sw9saz"><div class="sw9t">SAZONALIDADE <span>Ibovespa, dólar e setores desde 2000: fim de ano, eleições, mês a mês e Copom</span></div><div class="sw9full">${typeof vSaz == "function" ? vSaz("") : ""}</div>${(() => {
     const N = z && Xe("copom", 1),
       W = N && N.find((Te) => Te.k === "IBOV");
     return W && W.n
       ? `<div class="sw9r"><b>Copom recente: últimas ${W.n} reuniões (2023–2026)</b><em>Ibovespa no dia seguinte: média <span class="${p(W.media)}">${c(W.media)}</span> · mexe ${d(W.absEv, 2)}% contra ${d(W.absTodos, 2)}% num dia comum</em></div>`
       : "";
   })()}</div>
   <div class="sw9c"><div class="sw9t">CORRELAÇÃO ENTRE MERCADOS <span>1 ano</span></div>${fe ? rt(fe) : '<div class="sw9load">Carregando…</div>'}<button class="sw9lk" data-sw="HIST">biblioteca histórica ›</button></div>
   <div class="sw9c"><div class="sw9t">VOLATILIDADE POR HORÁRIO <span>Ibovespa, 60 dias</span></div>${w.length ? w.map((N) => `<div class="sw9h"><span>${String(N.h).padStart(2, "0")}h</span><i style="width:${(N.media / H) * 100}%"></i><b>${d(N.media, 2)}%</b></div>`).join("") : '<div class="sw9load">Carregando…</div>'}</div>
   <div class="sw9c"><div class="sw9t">CENÁRIOS CONDICIONAIS <span>o que costuma acontecer</span></div><div class="sw9cbs">${Object.entries(
     vt,
   )
     .map(
       ([N, W]) =>
         `<button class="sw9cb" data-sw="CEN" data-cen="${N}">${l(W[2])} ›</button>`,
     )
     .join("")}</div></div>
  </div>
  <div class="sw9ft"><span>◇ Evidência antes de opinião</span><span>◇ Amostra e período em cada número</span><span>◇ Relação não é causa</span><span>◇ Não é recomendação</span></div></div>`;
    }
    {
      const Q = vMercado;
      vMercado = function () {
        if (MKT.tab === "saz" || MKT.tab === "se") {
          ((K.ir = MKT.tab === "se" ? "sw9snt" : "sw9saz"), (MKT.tab = "lab"));
          try {
            (ls.set("diario-mkt-tab", "lab"), ls.set("diario-ss", "lab"));
          } catch {}
        }
        if (MKT.tab !== "lab") return Q.apply(this, arguments);
        if (K.ir) {
          const re = K.ir;
          ((K.ir = null),
            setTimeout(() => {
              const ie = document.getElementById(re);
              ie && ie.scrollIntoView({ block: "start" });
            }, 120));
        }
        return pe();
      };
    }
    (document.addEventListener(
      "click",
      (Q) => {
        const re = Q.target.closest && Q.target.closest("[data-sw]");
        if (!re) return;
        (Q.preventDefault(),
          Q.stopPropagation(),
          re.dataset.cen && (t.cn.k = re.dataset.cen),
          irPara("term"));
        let ie = re.dataset.sw;
        if (ie === "PESQ") {
          const R = ke(Le().a, 3).map((me) => me[0]),
            z = (a().mon || []).filter((me) => /^[A-Z]{4}\d{1,2}$/.test(me)),
            oe = [...new Set(R.concat(z))].slice(0, 3);
          ie = "PESQ " + (oe.length >= 2 ? oe.join(" ") : "PETR4 PRIO3 VALE3");
        }
        setTimeout(() => v(ie), 80);
      },
      !0,
    ),
      window.addEventListener(
        "click",
        (Q) => {
          Q.target.closest &&
            Q.target.closest('[data-m2="sazsen"]') &&
            setTimeout(() => {
              MKT.tab = "lab";
              try {
                ls.set("diario-mkt-tab", "lab");
              } catch {}
              (irPara("mercado"), scrollTo(0, 0));
            }, 0);
        },
        !0,
      ));
    {
      const Q = render0;
      render0 = function () {
        const re = Q.apply(this, arguments);
        try {
          tab === "mercado" &&
            MKT.tab === "lab" &&
            document
              .querySelectorAll('[data-m2="sazsen"]')
              .forEach((ie) => ie.classList.add("on"));
        } catch {}
        return re;
      };
    }
    ((s.SAZSENT = "Painel de sazonalidade e sentimento"),
      (o.SAZSENT = {
        body: () => '<div class="trnote">Abrindo o painel…</div>',
        load: () => {
          ((MKT.tab = "lab"), irPara("mercado"), scrollTo(0, 0));
        },
      }));
    {
      const Q = TraderStyles.slot("legacy-118");
      ((Q.id = "intel195"),
        (Q.textContent = TraderStyles.css("legacy-118")),
        TraderStyles.mount(Q));
    }
  })(),
  (function () {
    const e = window.TRM;
    if (!e) return;
    const {
        TR: t,
        TS: a,
        EXT: o,
        FN: s,
        ALIAS: n,
        trFn: r,
        trGet: i,
        esc2: l,
        nf: d,
        tabela: c,
        carregando: p,
        pinta: u,
        roda: m,
        layAtual: f,
        ehPC: x,
        parse: v,
      } = e,
      g = (de, Se, Ve, Je) => ({ x: de, y: Se, w: Ve, h: Je }),
      h = [
        "PETR4",
        "VALE3",
        "BOVA11",
        "ITUB4",
        "BBAS3",
        "BBDC4",
        "B3SA3",
        "ABEV3",
        "PRIO3",
        "MGLU3",
        "WEGE3",
        "SUZB3",
        "GGBR4",
        "CSNA3",
        "USIM5",
        "ELET3",
        "RENT3",
        "LREN3",
        "HAPV3",
        "COGN3",
        "CMIG4",
        "PETR3",
        "BBSE3",
        "EMBR3",
        "AZUL4",
        "CSAN3",
        "BRFS3",
        "JBSS3",
        "RADL3",
        "RAIL3",
        "VBBR3",
        "CPLE6",
        "SBSP3",
        "TAEE11",
        "KLBN11",
      ],
      b = (de) => /^[A-Z]{4}\d{1,2}$/.test(de),
      y = () =>
        Object.entries((a().uso || {}).a || {})
          .sort((de, Se) => Se[1] - de[1])
          .map((de) => de[0]),
      j = (de) =>
        [
          ...new Set(
            y()
              .filter(b)
              .concat(
                (a().mon || []).filter((Se) => b(Se) && !/11$/.test(Se)),
                ["PETR4", "VALE3", "ITUB4", "BBAS3"],
              ),
          ),
        ].slice(0, de),
      k = () => j(1)[0],
      A = () =>
        y().find((de) => h.includes(de)) ||
        (a().mon || []).find((de) => h.includes(de)) ||
        "PETR4",
      C = [
        ["bc", "Bancos centrais", /^(WIRP|CENB)$/],
        ["curva", "Curvas de juros", /^(GC|TD|YAS|BTMM|JUROS|JEDU)$/],
        ["ind", "Indicadores", /^(ECST|ECFC)$/],
        ["agenda", "Agenda", /^(ECO|AGENDA)$/],
        [
          "news",
          "Notícias",
          /^(TOP|FIRST|NEWS|N|NI|JORNAL|GIRO|NOTICIAS|TRAN)$/,
        ],
        ["mundo", "Mundo", /^(WEI|WMAP|FX|WCRS|CMDTY|GLCO|ADR|MUNDO)$/],
        ["graf", "Gráficos", /^(G|GP|GIP|COMP)$/],
        ["opc", "Opções", /^(OMON|OV|GRADE)$/],
        ["empresa", "Empresa", /^(Q|DES|FA|ANR|EE|ERN|RV|DVD|PESQ)$/],
        ["b3", "Bolsa hoje", /^(MON|MOST|IMAP|SETORES|EQS|RANK|PAINEL)$/],
        ["cripto", "Cripto", /^(CRYP)$/],
        ["tec", "Técnica e alertas", /^(TECH|ALC|ALRT|ALERTAS|EVT)$/],
        [
          "intel",
          "Inteligência",
          /^(IA|REL|CEN|HIST|ASKB|BI|ECONOMISTA|PERFIL|SAZ|SENT|SAZSENT)$/,
        ],
        ["dados", "Dados e automações", /^(STAT|DQ|AUD|AUTO|VARR|TM|PANO)$/],
        ["carteira", "Carteira", /^(PORT|BTST|REPLAY|FLUXO)$/],
      ],
      I = (de) => {
        const Se = v(de),
          Ve = Se ? Se.f : String(de).split(/\s+/)[0],
          Je = C.find((Ye) => Ye[2].test(Ve));
        return Je ? Je[0] : "outros";
      },
      J = (de) => (C.find((Se) => Se[0] === de) || [0, "Outros"])[1],
      se = {
        macro: {
          n: "Macro e juros",
          d: "Bancos centrais, curvas de juros, Tesouro, indicadores, Focus, agenda e notícias de juros",
          grupos: () => [
            ["WIRP", "CENB"],
            ["GC", "TD", "BTMM", "YAS"],
            ["ECST", "ECFC"],
            ["ECO", "AGENDA"],
            ["NI JUROS", "NI INFLACAO", "FIRST"],
            ["WMAP", "CEN", "HIST"],
          ],
        },
        opc: {
          n: "Opções",
          d: "Grade de opções, precificação, gráfico, técnica e notícias do ativo que você mais usa",
          grupos: () => {
            const de = A();
            return [
              [de + " OMON", "GRADE"],
              [de + " G", de + " GIP"],
              [de + " OV"],
              ["TECH", "ALC"],
              ["N " + de, de + " EE", de + " DVD"],
            ];
          },
        },
        br: {
          n: "Ações Brasil",
          d: "Monitor, seus gráficos, setores, notícias, técnica e ficha da empresa",
          grupos: () => {
            const de = k();
            return [
              ["MON"],
              j(3).map((Se) => Se + " G"),
              ["SETORES", "IMAP", "MOST"],
              ["TOP", "N " + de, "FIRST"],
              ["TECH", "ALC"],
              [de + " DES", de + " FA", de + " ANR"],
            ];
          },
        },
        ext: {
          n: "Exterior",
          d: "Bolsas do mundo, S&P 500, moedas, commodities, Fed, ADRs e notícias dos EUA",
          grupos: () => [
            ["WEI", "WMAP"],
            ["SPY G", "QQQ G"],
            ["FX", "CMDTY"],
            ["WIRP", "CENB", "GC"],
            ["ADR"],
            ["N EUA", "TOP"],
          ],
        },
        cri: {
          n: "Cripto",
          d: "Cripto ao vivo, gráficos e notícias",
          grupos: () => [
            ["CRYP"],
            ["BTCUSD G", "ETHUSD G", "BTCUSD G 60M"],
            ["N BITCOIN", "N CRIPTO"],
          ],
        },
        mer: {
          n: "Mercado (jornal, notícias, agenda)",
          d: "Jornal do Pregão, giro, notícias, agenda e mundo",
          grupos: () => [
            ["JORNAL", "GIRO"],
            ["NEWS", "TOP", "FIRST"],
            ["ECO", "AGENDA"],
            ["WEI", "WMAP"],
          ],
        },
        ia: {
          n: "Central de inteligência",
          d: "IA, relações entre mercados, cenários, biblioteca histórica, pesquisa e fontes",
          grupos: () => [
            ["IA", "EVT"],
            ["REL", "CEN", "HIST"],
            ["WMAP", "SETORES"],
            ["NEWS", "TOP"],
            ["PESQ " + j(3).join(" "), "PERFIL"],
            ["STAT", "DQ", "VARR"],
          ],
        },
        dt: {
          n: "Day trade (WIN e WDO)",
          d: "WIN e WDO em vários tempos, monitor, eventos, agenda e manchetes",
          grupos: () => [
            ["WIN G 5M", "WIN G 15M", "WIN G 60M"],
            ["WDO G 5M", "WDO G 15M"],
            ["MON"],
            ["EVT", "ALC", "REL"],
            ["ECO", "TOP"],
          ],
        },
        sw: {
          n: "Swing trade",
          d: "Técnica, gráficos dos seus ativos, setores, notícias e pesquisa",
          grupos: () => [
            ["TECH", "ALC"],
            j(4).map((de) => de + " G"),
            ["SETORES", "EQS"],
            ["NEWS", "EVT"],
            ["PESQ " + j(3).join(" ")],
          ],
        },
        pre: {
          n: "Pré-abertura",
          d: "Mundo, agenda, moedas, manchetes, juros e relações antes do pregão",
          grupos: () => [
            ["WEI", "WMAP"],
            ["ECO", "AGENDA"],
            ["FX", "CMDTY", "CRYP"],
            ["TOP", "FIRST"],
            ["WIRP", "GC"],
            ["REL"],
          ],
        },
        dq: {
          n: "Qualidade dos dados",
          d: "Qualidade, varredura das fontes, auditoria e automações",
          grupos: () => [["DQ", "STAT"], ["VARR"], ["AUD", "AUD IA"], ["AUTO"]],
        },
      },
      Ie = {
        MACRO: "macro",
        JUROS: "macro",
        OPCOES: "opc",
        OPÇÕES: "opc",
        OPC: "opc",
        ACOES: "br",
        AÇÕES: "br",
        BRASIL: "br",
        BR: "br",
        EXTERIOR: "ext",
        EUA: "ext",
        CRIPTO: "cri",
        CRYPTO: "cri",
        MERCADO: "mer",
        NOTICIAS: "mer",
        IA: "ia",
        INTELIGENCIA: "ia",
        DAYTRADE: "dt",
        DT: "dt",
        DAY: "dt",
        SWING: "sw",
        SW: "sw",
        PRE: "pre",
        PRÉ: "pre",
        DADOS: "dq",
        QUALIDADE: "dq",
      };
    function Pe(de) {
      const Se = {
        1: [g(0, 0, 12, 26)],
        2: [g(0, 0, 7, 26), g(7, 0, 5, 26)],
        3: [g(0, 0, 6, 26), g(6, 0, 6, 13), g(6, 13, 6, 13)],
        4: [g(0, 0, 7, 15), g(7, 0, 5, 15), g(0, 15, 7, 11), g(7, 15, 5, 11)],
        5: [
          g(0, 0, 5, 26),
          g(5, 0, 4, 13),
          g(9, 0, 3, 13),
          g(5, 13, 4, 13),
          g(9, 13, 3, 13),
        ],
        6: [
          g(0, 0, 5, 15),
          g(5, 0, 4, 15),
          g(9, 0, 3, 15),
          g(0, 15, 4, 11),
          g(4, 15, 4, 11),
          g(8, 15, 4, 11),
        ],
      };
      return JSON.parse(JSON.stringify(Se[Math.max(1, Math.min(6, de))]));
    }
    function Me(de) {
      for (
        de = de
          .map((Se) => [...new Set(Se.filter(Boolean))])
          .filter((Se) => Se.length);
        de.length > 6;

      ) {
        const Se = de.pop();
        de[5] = de[5].concat(Se);
      }
      return {
        p: de.map((Se) => Se[0]),
        t: de.map((Se) => (Se.length > 1 ? Se : null)),
        g: Pe(de.length),
      };
    }
    const ue = (de) => JSON.stringify([de.p, de.t || null, de.g]);
    function ve(de) {
      const Se = se[de];
      let Ve = Se.grupos().map((ot) => ot.slice());
      const Je = new Set(Ve.flat().map(I)),
        Ye = new Set(Ve.flat().map((ot) => ot.toUpperCase()));
      Object.entries((a().uso || {}).c || {})
        .filter(
          ([ot, Ke]) =>
            Ke >= 3 &&
            s[ot] &&
            !Ye.has(ot) &&
            !/^(HELP|Q|G|GP|GIP|N|NI|ASKB|BI|PESQ|COMP)$/.test(ot) &&
            Je.has(I(ot)),
        )
        .sort((ot, Ke) => Ke[1] - ot[1])
        .slice(0, 3)
        .map((ot) => ot[0])
        .forEach((ot) => {
          const Ke = I(ot),
            at = Ve.findIndex((rt) => rt.some((dt) => I(dt) === Ke));
          at >= 0 ? Ve[at].push(ot) : Ve[Ve.length - 1].push(ot);
        });
      const Xe = { n: Se.n, ...Me(Ve), tema: de };
      return ((Xe.auto = ue(Xe)), Xe);
    }
    function he(de) {
      const Se = [];
      de.p.forEach((Ke, at) => {
        (de.t && Array.isArray(de.t[at]) && de.t[at].length
          ? de.t[at]
          : [Ke]
        ).forEach((rt) => {
          Se.includes(rt) || Se.push(rt);
        });
      });
      const Ve = [],
        Je = {};
      Se.forEach((Ke) => {
        const at = I(Ke);
        (Je[at] || ((Je[at] = []), Ve.push(at)), Je[at].push(Ke));
      });
      let Ye = Ve.map((Ke) => Je[Ke]);
      const Xe = [
        ["curva", "bc"],
        ["ind", "bc"],
        ["agenda", "news"],
        ["empresa", "graf"],
        ["cripto", "mundo"],
        ["carteira", "b3"],
        ["dados", "intel"],
        ["opc", "graf"],
      ];
      for (const [Ke, at] of Xe) {
        if (Ye.length <= 6) break;
        const rt = Ve.indexOf(Ke),
          dt = Ve.indexOf(at);
        rt >= 0 &&
          dt >= 0 &&
          ((Ye[dt] = Ye[dt].concat(Ye[rt])),
          Ye.splice(rt, 1),
          Ve.splice(rt, 1));
      }
      const ot = Me(Ye);
      return (
        (de.p = ot.p),
        (de.t = ot.t),
        (de.g = ot.g),
        de.auto && (de.auto = ue(de)),
        de
      );
    }
    ((window.trOrganiza = () => {
      const de = f();
      (he(de),
        (t.foco = 0),
        (t.mob = 0),
        (t.max = -1),
        save(),
        render(),
        toast("Painéis agrupados por assunto e arrumados."));
    }),
      (window.trMontaTema = (de) => {
        const Se = a();
        return se[de]
          ? ((Se.wss[de] = ve(de)),
            (Se.ws = de),
            (t.foco = 0),
            (t.mob = 0),
            (t.max = -1),
            save(),
            render(),
            !0)
          : !1;
      }),
      (window.trTemas = se),
      (window.trFamDe = I));
    const we = (de, Se) => !Se || (Se.auto && Se.auto === ue(Se));
    function Be(de) {
      const Se = a(),
        Ve = Se.wss[de];
      if (!se[de] || !we(de, Ve)) return !1;
      const Je = ve(de);
      return (
        Ve && Ve.n && (Je.n = Ve.n),
        Ve && ue(Ve) === ue(Je) ? !1 : ((Se.wss[de] = Je), !0)
      );
    }
    function Ge() {
      const de = a();
      if (de.m277) return;
      de.m277 = 1;
      const Se = window.trWsPad || {};
      Object.keys(se).forEach((Ve) => {
        const Je = de.wss[Ve];
        if (!Je) {
          de.wss[Ve] = ve(Ve);
          return;
        }
        const Ye = Se[Ve];
        if (
          Ye &&
          JSON.stringify(Je.p) === JSON.stringify(Ye.p) &&
          JSON.stringify(Je.g) === JSON.stringify(Ye.g)
        ) {
          const Xe = ve(Ve);
          ((Xe.n = Je.n), (de.wss[Ve] = Xe));
        }
      });
      try {
        save();
      } catch {}
    }
    window.addEventListener(
      "change",
      (de) => {
        const Se = de.target;
        !Se ||
          !Se.matches ||
          !Se.matches("[data-trlay]") ||
          (se[Se.value] && Be(Se.value));
      },
      !0,
    );
    {
      const de = render0;
      render0 = function () {
        try {
          if (tab === "term" && !t.temaVisto) {
            ((t.temaVisto = 1), Ge());
            const Se = a();
            Be(Se.ws) && save();
          }
        } catch {}
        return de.apply(this, arguments);
      };
    }
    ((s.ESPACO =
      "Espaços inteligentes: ESPACO MACRO, ESPACO OPCOES, ESPACO CRIPTO… monta o espaço do tema sozinho"),
      (n.WS = "ESPACO"),
      (n.ESPAÇO = "ESPACO"),
      (n.TEMA = "ESPACO"),
      (s.ORG =
        "Organiza o espaço atual: junta o que é do mesmo assunto em abas e arruma a grade"),
      (n.ORGANIZAR = "ORG"),
      (o.ESPACO = {
        livre: !0,
        body: (de, Se) =>
          '<div class="trnote">Escolha um tema. O espaço junta tudo do assunto em abas e se atualiza sozinho com os ativos que você mais usa (enquanto você não mexer nele).</div>' +
          Object.entries(se)
            .map(
              ([Ve, Je]) =>
                `<div class="g9li"><button class="g9b" data-wsx="${Ve}"><b>${l(Je.n)}</b></button> <span class="mut">${l(Je.d)}</span></div>`,
            )
            .join("") +
          '<div class="trfont">Atalho: ESPACO MACRO · ESPACO OPCOES · ESPACO CRIPTO · ORG organiza o espaço em que você está.</div>',
      }),
      (o.ORG = {
        body: () =>
          '<div class="trnote">Use o botão <b>Organizar</b> (ou ORG no campo de comando) para agrupar os painéis deste espaço por assunto.</div>',
      }));
    function Ce(de) {
      const Se = String(de || "")
          .trim()
          .toUpperCase()
          .split(/\s+/),
        Ve = n[Se[0]] || Se[0];
      if (Ve === "ORG") return (window.trOrganiza(), !0);
      if (Ve === "ESPACO" && Se[1]) {
        const Je =
          Ie[
            Se.slice(1)
              .join("")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          ] ||
          Ie[Se[1]] ||
          (se[Se[1].toLowerCase()] ? Se[1].toLowerCase() : null);
        return Je
          ? (window.trMontaTema(Je),
            toast('Espaço "' + se[Je].n + '" montado.'),
            !0)
          : (toast("Tema não encontrado. Use ESPACO para ver a lista."), !0);
      }
      return !1;
    }
    (window.addEventListener(
      "keydown",
      (de) => {
        if (
          !(de.key !== "Enter" || !de.target || de.target.id !== "trcmd") &&
          Ce(de.target.value)
        ) {
          (de.preventDefault(),
            de.stopImmediatePropagation(),
            (de.target.value = ""));
          const Se = document.getElementById("trsug");
          Se && (Se.hidden = !0);
        }
      },
      !0,
    ),
      window.addEventListener(
        "click",
        (de) => {
          const Se =
            de.target.closest &&
            de.target.closest(
              '[data-tr="go"],[data-trsug],[data-trcmd],[data-wsx],[data-tr="org"]',
            );
          if (!Se) return;
          if (Se.dataset.wsx) {
            (de.stopImmediatePropagation(), window.trMontaTema(Se.dataset.wsx));
            return;
          }
          if (Se.dataset.tr === "org") {
            (de.stopImmediatePropagation(), window.trOrganiza());
            return;
          }
          const Ve =
            Se.dataset.tr === "go"
              ? (document.getElementById("trcmd") || {}).value
              : Se.dataset.trsug || Se.dataset.trcmd;
          if (Ce(Ve)) {
            de.stopImmediatePropagation();
            const Je = document.getElementById("trcmd");
            Je && (Je.value = "");
            const Ye = document.getElementById("trsug");
            Ye && (Ye.hidden = !0);
          }
        },
        !0,
      ));
    const Qe = (de) => {
      const Se = String(de || "");
      return /\b400\b/.test(Se)
        ? "pedido recusado: a fonte mudou as regras de consulta"
        : /\b40[13]\b/.test(Se)
          ? "bloqueado ou sem chave de acesso"
          : /\b404\b/.test(Se)
            ? "endereço mudou ou saiu do ar"
            : /\b406\b/.test(Se)
              ? "período pedido maior do que a fonte aceita"
              : /\b429\b/.test(Se)
                ? "limite de consultas atingido (espere alguns minutos)"
                : /\b5\d\d\b/.test(Se)
                  ? "a fonte está fora do ar agora"
                  : /timeout|abort|timed out/i.test(Se)
                    ? "demorou demais para responder"
                    : /vazio/i.test(Se)
                      ? "respondeu sem dados"
                      : Se;
    };
    ((s.VARR =
      "Varredura: testa agora cada fonte de dados e mostra quais painéis ficam sem informação"),
      (n.VARREDURA = "VARR"),
      (n.SCAN = "VARR"),
      (o.VARR = {
        load: () => r("varredura", {}, 5 * 6e4),
        body: (de, Se) => {
          const Ve = i("varredura"),
            Je = Object.entries(t.err || {})
              .filter(([, rt]) => rt)
              .map(([rt, dt]) => [rt.split("|")[0], dt]),
            Ye = Je.length
              ? '<div class="trsec">Painéis com erro agora neste aparelho</div>' +
                c(
                  ["Consulta", "Erro"],
                  [...new Map(Je).entries()].map(
                    ([rt, dt]) =>
                      `<tr><td>${l(rt)}</td><td class="r">${l(Qe(dt))}</td></tr>`,
                  ),
                  "varrloc",
                )
              : "";
          if (!Ve.v)
            return (
              (Ve.busy ? p("Testando as fontes… (até 25 s)") : p(Ve.err)) + Ye
            );
          const Xe = Ve.v.itens,
            ot = Xe.filter((rt) => rt.ok).length,
            Ke = i("macro").v,
            at = Ke && window.trMacFalhas ? trMacFalhas(Ke) : "";
          return (
            `<div class="trkv"><span>Fontes ok <b class="g">${ot}</b></span><span>Com problema <b class="${Xe.length - ot ? "r" : ""}">${Xe.length - ot}</b></span><span>Testado às <b>${new Date(Ve.v.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b></span><button class="g9b" data-varr="${Se}">Testar de novo</button></div>` +
            c(
              [
                "Fonte",
                "Situação",
                "Tempo",
                "Painéis que usam",
                "O que aconteceu",
              ],
              Xe.slice()
                .sort((rt, dt) => rt.ok - dt.ok)
                .map(
                  (rt) =>
                    `<tr><td>${l(rt.nome)}</td><td class="${rt.ok ? "g" : "r"}"><b>${rt.ok ? "ok" : "falhou"}</b></td><td class="num mut">${d(rt.ms / 1e3, 1)} s</td><td>${rt.usado.map((dt) => (s[dt] || o[dt] ? `<span class="g9lk" data-trcmd="${l(dt)}">${l(dt)}</span>` : `<span class="mut">${l(dt)}</span>`)).join(" ")}</td><td class="${rt.ok ? "mut" : "r"}">${rt.ok ? "—" : l(Qe(rt.erro))}<div class="mut" style="font-size:10.5px">${rt.ok ? "" : l(rt.erro || "")}</div></td></tr>`,
                ),
              "varr",
            ) +
            at +
            Ye +
            `<div class="trfont">A varredura roda no servidor (função "terminal") sem usar cópias guardadas. brapi ${Ve.v.chaves.brapi ? "ligada" : "sem chave"} · Twelve Data ${Ve.v.chaves.twelve ? "ligada" : "sem chave"}.</div>`
          );
        },
      }),
      document.addEventListener("click", (de) => {
        const Se = de.target.closest && de.target.closest("[data-varr]");
        if (!Se) return;
        const Ve = "varredura|{}";
        (t.dados[Ve] && (t.dados[Ve].ts = 0), delete t.err[Ve]);
        const Je = +Se.dataset.varr;
        (u(Je), r("varredura", {}, 0).finally(() => u(Je)));
      }));
  })(),
  (function () {
    const e = window.TRM || {},
      t = (window.PF = {
        aba: "geral",
        per: "1M",
        amb: "pos",
        sel: null,
        modo: "res",
        hf: "tudo",
        rel: null,
        relErr: "",
        relBusy: 0,
        busy: "",
        msg: "",
        q: {},
        qts: 0,
        qBusy: 0,
        meta: 0,
        histBusy: 0,
        radar: 0,
        form: null,
        rv: null,
        pg: "1A",
        cfgRemoto: null,
        cfgSig: "",
        ia: "cons",
      });
    try {
      const K = (S.ax || {})["pf.aba"];
      K && (t.aba = K);
    } catch {}
    const a = {
      acao: "Ações",
      fii: "FIIs",
      etf: "ETFs",
      bdr: "BDRs",
      acao_ext: "Ações internacionais",
      etf_ext: "ETFs internacionais",
      cripto: "Criptomoedas",
      tesouro: "Tesouro Direto",
      rf: "Renda fixa",
      outro: "Outros",
    };
    try {
      Object.assign(CCL, {
        bdr: "BDRs",
        acao_ext: "Ações internacionais",
        etf_ext: "ETFs internacionais",
        cripto: "Criptomoedas",
      });
    } catch {}
    const o = {
        acao: "#709bc2",
        fii: "#c2943e",
        etf: "#ad853a",
        bdr: "#afa99d",
        acao_ext: "#ac8439",
        etf_ext: "#ac8439",
        cripto: "#b88c3a",
        tesouro: "#9ca0a9",
        rf: "#7a808c",
        outro: "#6b7280",
      },
      s = [
        "#709bc2",
        "#c2943e",
        "#3aad74",
        "#afa99d",
        "#37a46d",
        "#e7614c",
        "#b88c3a",
        "#339966",
        "#a49d90",
        "#9ca0a9",
        "#39aa71",
        "#6b7280",
      ],
      n = (K) =>
        ["acao", "bdr", "acao_ext"].includes(K)
          ? "acao"
          : K === "fii"
            ? "fii"
            : ["etf", "etf_ext"].includes(K)
              ? "etf"
              : K === "cripto"
                ? "cripto"
                : "rf",
      r = [
        "BTC",
        "ETH",
        "SOL",
        "XRP",
        "ADA",
        "DOGE",
        "BNB",
        "AVAX",
        "DOT",
        "LINK",
        "MATIC",
        "POL",
        "LTC",
        "TRX",
        "TON",
        "SHIB",
        "UNI",
        "ATOM",
        "USDT",
        "USDC",
        "NEAR",
        "APT",
        "ARB",
        "OP",
        "PEPE",
        "SUI",
      ],
      i = [
        "BOVA11",
        "IVVB11",
        "SMAL11",
        "HASH11",
        "BOVV11",
        "DIVO11",
        "NASD11",
        "GOLD11",
        "XINA11",
        "BBSD11",
        "ECOO11",
        "FIND11",
        "MATB11",
        "PIBB11",
        "SPXI11",
        "ACWI11",
        "EURP11",
        "WRLD11",
        "QBTC11",
        "ETHE11",
        "BITH11",
        "B5P211",
        "IMAB11",
        "IRFM11",
        "FIXA11",
        "LFTS11",
        "BDIV11",
        "TECK11",
        "SPXB11",
        "BOVB11",
        "XFIX11",
        "DEBB11",
        "NTNS11",
        "HTEK11",
        "UTEC11",
        "SOLH11",
        "QETH11",
        "BITI11",
        "GOVE11",
        "META11",
        "ESGB11",
        "BOVX11",
        "AUPO11",
        "CASH11",
        "LFTB11",
        "B5MB11",
        "IB5M11",
        "USDB11",
      ],
      l = [
        "TAEE11",
        "KLBN11",
        "SANB11",
        "ALUP11",
        "BPAC11",
        "ENGI11",
        "SAPR11",
        "IGTI11",
        "AESB11",
        "CPLE11",
        "RNEW11",
        "BIDI11",
        "INTB11",
        "STBP11",
        "PPLA11",
        "SULA11",
        "TIET11",
        "BRBI11",
        "CXSE11",
        "ENEV11",
        "GGPS11",
        "VIVA11",
        "JHSF11",
        "AZEV11",
        "PACT11",
      ],
      d = [
        "VOO",
        "SPY",
        "IVV",
        "QQQ",
        "VTI",
        "VT",
        "VEA",
        "VWO",
        "SCHD",
        "VNQ",
        "GLD",
        "SLV",
        "TLT",
        "IEF",
        "SHY",
        "BND",
        "AGG",
        "VIG",
        "VYM",
        "DIA",
        "IWM",
        "EEM",
        "EFA",
        "XLK",
        "XLF",
        "XLE",
        "XLV",
        "ARKK",
        "SOXX",
        "SMH",
        "JEPI",
        "JEPQ",
        "QQQM",
        "SPLG",
        "SCHX",
        "VXUS",
        "BNDX",
        "IAU",
        "HYG",
        "LQD",
        "EWZ",
        "VUG",
        "VTV",
        "SCHG",
        "IBIT",
        "FBTC",
        "ETHA",
        "SGOV",
        "BIL",
        "URTH",
        "ACWI",
        "IJH",
        "IJR",
        "MDY",
        "XLY",
        "XLP",
        "XLI",
        "XLU",
        "XLB",
        "XLC",
        "XLRE",
        "VGT",
        "VHT",
        "VOX",
        "VPU",
        "VDE",
      ];
    function c(K) {
      const pe = String(K || "")
        .toUpperCase()
        .trim();
      if (/^(TESOURO|LTN|NTN|LFT)/.test(pe)) return { cl: "tesouro", mk: "BR" };
      if (/^(CDB|LCI|LCA|CRI|CRA|DEB|LC |LF |POUP|CAIXA)/.test(pe))
        return { cl: "rf", mk: "BR" };
      const Q = pe.replace(/(USDT|BRL|USD)$/, "");
      return r.includes(Q) && !/\d/.test(pe)
        ? { cl: "cripto", mk: "CR" }
        : /^[A-Z]{4}3[2-5]$/.test(pe)
          ? { cl: "bdr", mk: "BR" }
          : /^[A-Z0-9]{4}11$/.test(pe)
            ? {
                cl: i.includes(pe) ? "etf" : l.includes(pe) ? "acao" : "fii",
                mk: "BR",
              }
            : /^[A-Z]{4}\d{1,2}F?$/.test(pe)
              ? { cl: "acao", mk: "BR" }
              : /^[A-Z][A-Z.\-]{0,5}$/.test(pe)
                ? { cl: d.includes(pe) ? "etf_ext" : "acao_ext", mk: "US" }
                : { cl: "outro", mk: "BR" };
    }
    const p = (K) => K.mk === "US",
      u = (K) =>
        K.cl === "cripto"
          ? "Global"
          : K.mk === "US"
            ? "EUA"
            : K.cl === "bdr"
              ? "EUA (via BDR)"
              : "Brasil",
      m = {
        Finance: "Financeiro",
        "Energy Minerals": "Petróleo e gás",
        "Non-Energy Minerals": "Mineração e siderurgia",
        Utilities: "Energia e saneamento",
        "Retail Trade": "Varejo",
        "Consumer Non-Durables": "Consumo básico",
        "Consumer Durables": "Bens duráveis",
        "Consumer Services": "Serviços ao consumidor",
        "Process Industries": "Indústria de base",
        "Producer Manufacturing": "Bens de capital",
        Transportation: "Transporte e logística",
        "Technology Services": "Tecnologia",
        "Electronic Technology": "Tecnologia (hardware)",
        "Health Services": "Saúde",
        "Health Technology": "Saúde (farma)",
        Communications: "Telecom",
        "Industrial Services": "Serviços industriais",
        "Commercial Services": "Serviços",
        "Distribution Services": "Distribuição",
        Miscellaneous: "Outros",
      },
      f = () => {
        const K = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} });
        return K.meta ?? (K.meta = {});
      };
    function x(K) {
      const pe = f()[K.tk] || {};
      return K.cl === "fii"
        ? "Fundos imobiliários"
        : ["etf", "etf_ext"].includes(K.cl)
          ? "ETFs"
          : K.cl === "cripto"
            ? "Cripto"
            : ["tesouro", "rf"].includes(K.cl)
              ? "Renda fixa"
              : pe.setor
                ? m[pe.setor] || pe.setor
                : "Sem setor";
    }
    const v = (K) => (f()[K] || {}).nome || "",
      g = (K) => window.CarteiraCalculo.num(K) ?? 0;
    function h() {
      return ((S.cart || {}).lanc || [])
        .slice()
        .sort(
          (K, pe) =>
            (K.d || "").localeCompare(pe.d || "") ||
            (K.tp === "E") - (pe.tp === "E"),
        );
    }
    function b(K, pe, Q) {
      return window.CarteiraCalculo.apply(K, pe, Q, c);
    }
    const y = (K) => {
        const pe = ((S.cart || {}).px || {})[K.mk + ":" + K.tk];
        return pe && +pe.p > 0 ? pe : null;
      },
      j = () => +(S.cart || {}).fx || 0;
    function k() {
      const K = {},
        pe = h().filter(($e) => $e.d <= loc().slice(0, 10));
      let Q = 0,
        re = !1,
        ie = 0;
      const R = j();
      pe.forEach(($e) => {
        const fe = b(K, $e, R);
        ((Q += fe.caixa),
          (ie += fe.prov),
          ($e.tp === "A" || $e.tp === "R") && (re = !0));
      });
      const z = Object.values(K)
          .filter(($e) => $e.q > 1e-9)
          .map(($e) => {
            const fe = y($e),
              Fe = p($e),
              w = Fe ? R || 0 : 1,
              H = fe ? +fe.p : $e.c / $e.q,
              N = $e.q * H * w,
              W = Fe ? $e.cR : $e.c;
            return {
              ...$e,
              pm: $e.c / $e.q,
              pa: H,
              tem: !!fe,
              d1: fe && fe.d1 != null ? +fe.d1 : null,
              pxEm: fe ? fe.em || fe.d : null,
              v: N,
              custo: W,
              lu: N - W,
              pc: W > 0 ? (N / W - 1) * 100 : 0,
              provR: Fe ? $e.prov * (R || 0) : $e.prov,
              moeda: Fe ? "USD" : "BRL",
              setor: x($e),
              regiao: u($e),
              nome: v($e.tk),
            };
          })
          .sort(($e, fe) => fe.v - $e.v),
        oe = z.reduce(($e, fe) => $e + fe.v, 0),
        me = z.reduce(($e, fe) => $e + fe.custo, 0);
      z.forEach(($e) => {
        $e.peso = oe > 0 ? ($e.v / oe) * 100 : 0;
      });
      const be = Object.values(K).filter(
          ($e) => $e.q <= 1e-9 && ($e.real || $e.prov),
        ),
        X = Object.values(K).reduce(
          ($e, fe) => $e + (p(fe) ? fe.real * (R || 0) : fe.real),
          0,
        ),
        xe = z.reduce(
          ($e, fe) =>
            $e + (fe.d1 != null ? fe.v - fe.v / (1 + fe.d1 / 100) : 0),
          0,
        );
      return {
        pos: z,
        fech: be,
        v: oe,
        c: me,
        res: oe - me,
        resPct: me > 0 ? (oe / me - 1) * 100 : 0,
        prov: ie,
        real: X,
        caixa: re ? Q : null,
        dia: xe,
        diaPct: oe - xe > 0 ? (xe / (oe - xe)) * 100 : 0,
        fx: R,
      };
    }
    try {
      carCalc = function () {
        const K = k(),
          pe = (Q) => {
            const re = K.pos
                .filter((R) => (Q === "BR" ? R.mk !== "US" : R.mk === "US"))
                .map((R) => ({
                  mk: R.mk === "CR" ? "BR" : R.mk,
                  tk: R.tk,
                  cl: R.cl,
                  q: R.q,
                  c: R.c,
                  pm: R.pm,
                  pa: R.pa,
                  tem: R.tem,
                  v: Q === "US" ? R.q * R.pa : R.v,
                  lu: Q === "US" ? R.q * R.pa - R.c : R.lu,
                  pc: R.pc,
                })),
              ie = h()
                .filter((R) => R.tp === "P" && (R.mk === "US") == (Q === "US"))
                .reduce(
                  (R, z) => R + (g(z.q) ? g(z.p) * g(z.q) : g(z.p)) - g(z.cs),
                  0,
                );
            return {
              v: re.reduce((R, z) => R + z.v, 0),
              c: re.reduce((R, z) => R + z.c, 0),
              pos: re,
              prov: ie,
              real: 0,
            };
          };
        return { BR: pe("BR"), US: pe("US") };
      };
    } catch {}
    try {
      anxItens = function (K) {
        const pe = carCalc()[K],
          Q = pe.v || 1;
        return pe.pos
          .filter((re) =>
            ["acao", "etf", "fii", "bdr", "acao_ext", "etf_ext"].includes(
              re.cl,
            ),
          )
          .slice(0, 12)
          .map((re) => ({
            tk: re.tk,
            mk: K,
            cl: ["bdr", "acao_ext"].includes(re.cl)
              ? "acao"
              : re.cl === "etf_ext"
                ? "etf"
                : re.cl,
            q: +(+re.q).toFixed(4),
            pm: +(+re.pm).toFixed(2),
            peso: +((re.v / Q) * 100).toFixed(1),
            lu: +(+re.pc).toFixed(2),
          }));
      };
    } catch {}
    const A = () => {
        const K = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} });
        return K.wl ?? (K.wl = []);
      },
      C = () => {
        const K = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} });
        return (
          K.radar ??
          (K.radar = {
            sr: 1.5,
            mm: !0,
            rsiLo: 30,
            rsiHi: 70,
            volX: 1.5,
            res: 7,
            fund: !0,
            news: !0,
            conc: 20,
            setor: 40,
            ia: !0,
          })
        );
      },
      I = () => {
        const K = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} });
        return K.rel ?? (K.rel = { on: !1, off: 20 });
      },
      J = (K) =>
        K.cl === "cripto"
          ? "BINANCE:" + K.tk.replace(/(USDT|BRL|USD)$/, "") + "BRL"
          : ["tesouro", "rf", "outro"].includes(K.cl)
            ? null
            : K.mk === "US"
              ? K.tk
              : "BMFBOVESPA:" + K.tk;
    function se() {
      const K = k(),
        pe = new Map();
      return (
        K.pos.forEach((Q) => pe.set(Q.k, { mk: Q.mk, tk: Q.tk, cl: Q.cl })),
        A()
          .filter((Q) => !Q.virou)
          .forEach((Q) => {
            const re = Q.mk + ":" + Q.tk;
            pe.has(re) || pe.set(re, { mk: Q.mk, tk: Q.tk, cl: Q.cl, wl: 1 });
          }),
        [...pe.values()]
      );
    }
    async function Ie(K) {
      if (
        t.qBusy ||
        !e.trFn ||
        (!K && Date.now() - Math.max(t.qts, t.qTry || 0) < 5 * 6e4)
      )
        return;
      const pe = se(),
        Q = pe.map(J).filter(Boolean);
      if (!(!Q.length && !K)) {
        ((t.qBusy = 1), (t.qTry = Date.now()));
        try {
          const re = await e.trFn(
            "cot",
            { s: [...new Set(Q.concat("FX_IDC:USDBRL"))] },
            K ? 0 : 6e4,
          );
          if (re && re.itens) {
            const ie = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} }),
              R = loc().slice(0, 10),
              z = re.em || new Date().toISOString();
            let oe = 0;
            (re.itens.forEach((me) => {
              if (me.pedido === "FX_IDC:USDBRL") {
                me.px > 0 && (ie.fx = +me.px);
                return;
              }
              const be = pe.find((X) => J(X) === me.pedido);
              !be ||
                !(me.px > 0) ||
                (((ie.px ?? (ie.px = {}))[be.mk + ":" + be.tk] = {
                  p: +me.px,
                  d: R,
                  d1: me.d1,
                  em: z,
                  src: me.fonte || "TradingView",
                  atraso: me.atraso !== !1,
                }),
                (t.q[be.tk] = me),
                oe++);
            }),
              (t.qts = Date.now()),
              (t.qMsg = `${oe} cotação(ões) às ${hm()}`),
              save());
          }
        } catch (re) {
          t.qMsg = "Cotações: " + em(re);
        }
        ((t.qBusy = 0),
          tab === "carteiras" && (t.qts >= t.qTry || K) && render());
      }
    }
    async function Pe() {
      if (t.meta || !e.trFn) return;
      const K = se().filter((R) =>
          ["acao", "bdr", "acao_ext", "fii"].includes(R.cl),
        ),
        pe = f(),
        Q = t.metaTry || (t.metaTry = {}),
        re = K.filter(
          (R) =>
            (!pe[R.tk] || Date.now() - (pe[R.tk].ts || 0) > 3 * 864e5) &&
            Date.now() - (Q[R.tk] || 0) > 30 * 6e4,
        ).slice(0, 6);
      if (!re.length) return;
      ((t.meta = 1),
        re.forEach((R) => {
          Q[R.tk] = Date.now();
        }));
      let ie = 0;
      for (const R of re)
        try {
          const z = await e.trFn("fund", { tk: R.tk }, 6e5);
          if (z) {
            const oe = z.yahoo || {},
              me = z.tv || {},
              be = oe.analistas || {},
              X = (oe.projecoes || []).find(($e) => $e.periodo === "0y") || {},
              xe = pe[R.tk] || {};
            ((ie = 1),
              (pe[R.tk] = {
                ...xe,
                nome: me.description || (oe.perfil || {}).nome || xe.nome || "",
                setor: me.sector || (oe.perfil || {}).setor || xe.setor || "",
                prox: ((oe.eventos || {}).resultado || [])[0] || null,
                ts: Date.now(),
                fs: {
                  pl: me.price_earnings_ttm,
                  pvp: me.price_book_ratio,
                  dy: me.dividend_yield_recent,
                  roe: me.return_on_equity,
                  ml: me.net_margin,
                  de: me.debt_to_equity,
                  alvo: be.alvo_medio,
                  nota: be.nota,
                  rev:
                    X.revisao && X.revisao.d30
                      ? (X.revisao.atual / X.revisao.d30 - 1) * 100
                      : null,
                  cr:
                    (oe.numeros || {}).cresc_receita != null
                      ? oe.numeros.cresc_receita * 100
                      : null,
                  em: Date.now(),
                },
                fsAnt: xe.fs || null,
              }));
          }
        } catch {}
      ((t.meta = 0), ie && (save(), tab === "carteiras" && render()));
    }
    const Me = (K) =>
      K.cl === "cripto"
        ? K.tk.replace(/(USDT|BRL|USD)$/, "") + "-BRL"
        : ["tesouro", "rf", "outro"].includes(K.cl)
          ? null
          : K.mk === "US"
            ? K.tk
            : K.tk + ".SA";
    function ue() {
      const K = h(),
        pe = new Map();
      K.forEach((ie) => {
        if (["C", "V", "P", "E"].includes(ie.tp)) {
          const R = { mk: ie.mk || "BR", tk: ie.tk, cl: ie.cl || c(ie.tk).cl },
            z = Me(R);
          z && /^[A-Z0-9 .\-]{1,24}$/i.test(R.tk) && pe.set(R.tk, [R.tk, z]);
        }
      });
      const Q = [...pe.values()].slice(0, 26).concat([
          ["__IBOV", "^BVSP"],
          ["__SPX", "^GSPC"],
          ["__USD", "BRL=X"],
        ]),
        re = (K.find((ie) => ie.tp === "C") || {}).d || loc().slice(0, 10);
      return { y: Q, desde: re };
    }
    const ve = () => {
      if (!e.trGet) return { v: null, err: "", busy: !1 };
      const K = e.trGet("histp", ue());
      return K.v
        ? ((t.histUlt = K.v), K)
        : t.histUlt
          ? { ...K, v: t.histUlt }
          : K;
    };
    async function he() {
      if (t.histBusy || !e.trFn || !h().length) return;
      const K = ue(),
        pe = e.trGet("histp", K);
      if (pe.v && Date.now() - pe.ts < 6 * 36e5) return;
      const Q = JSON.stringify(K),
        re = t.histTry || (t.histTry = {});
      if (Date.now() - (re[Q] || 0) < 10 * 6e4) return;
      ((t.histBusy = 1), (re[Q] = Date.now()));
      let ie = null;
      try {
        ((ie = await e.trFn("histp", K, 6 * 36e5)), ie && (t.histUlt = ie));
      } catch {}
      ((t.histBusy = 0),
        (t.perfCache = null),
        tab === "carteiras" && ie && render());
    }
    function we() {
      const K = ve().v;
      if (!K || !K.series || !K.series.__IBOV) return null;
      const pe = JSON.stringify([
        K.gerado,
        (S.cart || {}).lanc && S.cart.lanc.length,
        j(),
      ]);
      if (t.perfCache && t.perfSig === pe) return t.perfCache;
      const Q = h(),
        re = (Q.find((Ae) => Ae.tp === "C") || {}).d;
      if (!re) return null;
      const ie = K.series,
        R = ie.__IBOV.d.filter((Ae) => Ae >= re);
      if (R.length < 2) return null;
      const z = {};
      Object.entries(ie).forEach(([Ae, ge]) => {
        const je = new Map();
        (ge.d.forEach((Ze, He) => je.set(Ze, ge.c[He])), (z[Ae] = je));
      });
      const oe = {},
        me = (Ae, ge) => {
          const je = z[Ae];
          return (je && je.has(ge) && (oe[Ae] = je.get(ge)), oe[Ae]);
        },
        be = {};
      Q.filter((Ae) => Ae.tp === "E").forEach((Ae) => {
        const ge = g(Ae.f),
          je =
            Ae.ev === "desd"
              ? ge
              : Ae.ev === "grup" && ge > 0
                ? 1 / ge
                : Ae.ev === "bonif"
                  ? 1 + ge / 100
                  : 1;
        je > 0 && je !== 1 && (be[Ae.tk] = be[Ae.tk] || []).push([Ae.d, je]);
      });
      const X = (Ae, ge) =>
          (be[Ae] || []).reduce((je, [Ze, He]) => (Ze > ge ? je * He : je), 1),
        xe = {},
        $e = [],
        fe = [],
        Fe = [],
        w = [],
        H = [],
        N = {},
        W = {},
        Te = {};
      let V = 0,
        ae = 0,
        ee = 1,
        le = null,
        Y = 0;
      Object.keys(z).forEach((Ae) => {
        const ge = ie[Ae];
        for (let je = 0; je < ge.d.length && ge.d[je] < R[0]; je++)
          oe[Ae] = ge.c[je];
      });
      for (let Ae = 0; Ae < R.length; Ae++) {
        const ge = R[Ae],
          je = me("__USD", ge) || j() || 0;
        let Ze = 0,
          He = 0;
        const ce = {},
          E = {};
        for (; V < Q.length && Q[V].d <= ge; ) {
          const te = Q[V++],
            _ = b(xe, te, je);
          ((Ze += _.fluxo),
            (He += _.prov),
            _.k &&
              ((ce[_.k] = (ce[_.k] || 0) + _.fluxo),
              (E[_.k] = (E[_.k] || 0) + _.prov)));
        }
        let P = 0;
        const B = {};
        Object.values(xe).forEach((te) => {
          if (te.q <= 1e-9) {
            B[te.k] = 0;
            return;
          }
          const _ = me(te.tk, ge),
            ye = p(te) ? je : 1,
            Oe =
              _ != null ? te.q * X(te.tk, ge) * _ * ye : p(te) ? te.cR : te.c;
          ((B[te.k] = Oe), (P += Oe), (Te[te.k] = te.cl));
        });
        const G =
          ae > 0 ? (P + He - Ze) / ae - 1 : Ze > 0 ? (P + He) / Ze - 1 : 0;
        ((ee *= 1 + (isFinite(G) ? G : 0)),
          Object.keys(B).forEach((te) => {
            const _ = (t._vk || {})[te] || 0,
              ye = B[te] - _ - (ce[te] || 0) + (E[te] || 0);
            ((N[te] = N[te] || []),
              (N[te][Ae] = ye),
              (W[te] = W[te] || []),
              (W[te][Ae] = E[te] || 0));
          }),
          (t._vk = B),
          (Y += Ze),
          $e.push(P),
          fe.push(ee),
          Fe.push(isFinite(G) ? G : 0),
          w.push(P - ae - Ze + He),
          H.push(Y),
          (ae = P),
          (le = je));
      }
      t._vk = null;
      const q = (Ae) => {
          const ge = z[Ae];
          if (!ge) return null;
          let je = null;
          return R.map((Ze) => (ge.has(Ze) && (je = ge.get(Ze)), je));
        },
        L = q("__IBOV"),
        F = q("__SPX"),
        O = q("__USD");
      let ne = null;
      if (K.cdi && K.cdi.d) {
        const Ae = new Map();
        K.cdi.d.forEach((je, Ze) => Ae.set(je, K.cdi.v[Ze]));
        let ge = 1;
        ne = R.map(
          (je, Ze) => (
            Ze > 0 && Ae.has(je) && (ge *= 1 + Ae.get(je) / 100),
            ge
          ),
        );
      }
      const Ee = {
        D: R,
        V: $e,
        I: fe,
        R: Fe,
        PNL: w,
        INV: H,
        pnlK: N,
        provK: W,
        cl: Te,
        ib: L,
        sp:
          F && O
            ? F.map((Ae, ge) =>
                Ae != null && O[ge] != null ? Ae * O[ge] : null,
              )
            : null,
        spUSD: F,
        cdi: ne,
        falhas: K.falhas || [],
        fonte: K.fonte,
        gerado: K.gerado,
      };
      return ((t.perfCache = Ee), (t.perfSig = pe), Ee);
    }
    const Be = { "1D": 1, "1S": 5, "1M": 21, "6M": 126, "1A": 252, TUDO: 1e9 },
      Ge = {
        "1D": "Dia",
        "1S": "Semana",
        "1M": "Mês",
        "6M": "Semestre",
        "1A": "Ano",
        TUDO: "Tudo",
      };
    function Ce(K, pe) {
      if (!K) return null;
      const Q = K.D.length,
        re = Math.max(0, Q - 1 - (Be[pe] || 21)),
        ie = Q - 1,
        R = (fe) =>
          fe && fe[re] != null && fe[ie] != null && fe[re] > 0
            ? (fe[ie] / fe[re] - 1) * 100
            : null,
        z = K.R.slice(re + 1, ie + 1),
        oe = z.length ? z.reduce((fe, Fe) => fe + Fe, 0) / z.length : 0,
        me =
          z.length > 1
            ? Math.sqrt(
                z.reduce((fe, Fe) => fe + (Fe - oe) ** 2, 0) / (z.length - 1),
              )
            : null;
      let be = -1e18,
        X = 0;
      for (let fe = re; fe <= ie; fe++)
        ((be = Math.max(be, K.I[fe])),
          (X = Math.min(X, (K.I[fe] / be - 1) * 100)));
      const xe = {};
      Object.keys(K.pnlK).forEach((fe) => {
        let Fe = 0,
          w = 0;
        for (let H = re + 1; H <= ie; H++)
          ((Fe += K.pnlK[fe][H] || 0), (w += K.provK[fe][H] || 0));
        xe[fe] = { pnl: Fe, prov: w, cl: K.cl[fe] };
      });
      const $e = K.PNL.slice(re + 1, ie + 1).reduce((fe, Fe) => fe + Fe, 0);
      return {
        i0: re,
        i1: ie,
        ret: R(K.I),
        ib: R(K.ib),
        cdi: R(K.cdi),
        sp: R(K.sp),
        vol: me != null ? me * Math.sqrt(252) * 100 : null,
        dd: X,
        pnl: $e,
        contrib: xe,
        dias: ie - re,
        de: K.D[re],
        ate: K.D[ie],
      };
    }
    function Qe(K) {
      if (!K) return [];
      const pe = {};
      K.D.forEach((R, z) => {
        pe[R.slice(0, 7)] = z;
      });
      const Q = Object.keys(pe).sort(),
        re = [];
      let ie = 0;
      return (
        Q.forEach((R) => {
          const z = pe[R];
          (re.push({
            m: R,
            r: (K.I[z] / K.I[ie] - 1) * 100,
            ib: K.ib && K.ib[ie] ? (K.ib[z] / K.ib[ie] - 1) * 100 : null,
            cdi: K.cdi ? (K.cdi[z] / K.cdi[ie] - 1) * 100 : null,
          }),
            (ie = z));
        }),
        re
      );
    }
    ((window.pfCalc = k),
      (window.pfHistArgs = ue),
      (window.perfCalc = we),
      (window.perfPer = Ce),
      (window.classificaAtivo = c));
    const de = (K) =>
      K.cl === "cripto" ? K.tk.replace(/(USDT|BRL|USD)$/, "") + "USD" : K.tk;
    function Se(K) {
      if (!e.tec || ["tesouro", "rf", "outro"].includes(K.cl)) return null;
      const pe = e.tec.velas(de(K), "1d");
      if (!pe || !pe.L || pe.L.length < 30) return null;
      const Q = e.tec.anTec(pe.L);
      if (!Q) return null;
      const re = pe.L.map((X) => X[4]),
        ie = re.slice(1).map((X, xe) => Math.log(X / re[xe])),
        R = (X) => {
          const xe = X.reduce(($e, fe) => $e + fe, 0) / X.length;
          return Math.sqrt(
            X.reduce(($e, fe) => $e + (fe - xe) ** 2, 0) / (X.length - 1),
          );
        },
        z = e.tec.atr ? e.tec.atr(pe.L) : null,
        oe = z ? z.filter((X) => X != null) : [],
        me =
          oe.length > 70
            ? oe.slice(-70, -10).reduce((X, xe) => X + xe, 0) / 60
            : null,
        be = oe.length ? oe[oe.length - 1] : null;
      return (
        (Q.vol1a =
          ie.length > 40 ? R(ie.slice(-252)) * Math.sqrt(252) * 100 : null),
        (Q.vol20 =
          ie.length > 20 ? R(ie.slice(-20)) * Math.sqrt(252) * 100 : null),
        (Q.atrX = me && be ? be / me : null),
        (Q.dd52 = Q.h52 ? (Q.px / Q.h52 - 1) * 100 : null),
        (Q.L = pe.L),
        (Q.ate = pe.L[pe.L.length - 1][0]),
        Q
      );
    }
    async function Ve() {
      if (t.vBusy || !e.tec) return;
      const K = t.vTry || (t.vTry = {}),
        pe = se()
          .filter((re) => !["tesouro", "rf", "outro"].includes(re.cl))
          .slice(0, 24),
        Q = pe.filter(
          (re) =>
            !e.tec.velas(de(re), "1d") &&
            Date.now() - (K[re.tk] || 0) > 10 * 6e4,
        );
      if (Q.length) {
        ((t.vBusy = 1),
          Q.forEach((re) => {
            K[re.tk] = Date.now();
          }));
        for (let re = 0; re < Q.length; re += 4)
          await Promise.all(
            Q.slice(re, re + 4).map((ie) =>
              e.tec.pegaVelas(de(ie), "1d").catch(() => null),
            ),
          );
        ((t.vBusy = 0),
          Q.some((re) => e.tec.velas(de(re), "1d")) &&
            ((t.radar = 0), tab === "carteiras" && render()));
      }
    }
    function Je(K, pe) {
      const Q = Se(K),
        re = f()[K.tk] || {},
        ie = re.fs || null,
        R = n(K.cl),
        z = {};
      if (["tesouro", "rf", "outro"].includes(K.cl))
        z.tec = {
          est: "na",
          txt: "Renda fixa e outros não têm leitura técnica.",
          cob: null,
        };
      else if (!Q)
        z.tec = { est: "sem", txt: "Sem velas diárias ainda.", cob: 0 };
      else {
        const fe =
            [Q.m20, Q.m50, Q.m200, Q.rsi, Q.atr].filter((H) => H != null)
              .length / 5,
          Fe = Q.m200 != null && Q.px > Q.m200,
          w =
            Q.tend === "alta" && (Q.m200 == null || Fe)
              ? "bom"
              : Q.tend === "baixa" && (Q.m200 == null || !Fe)
                ? "ruim"
                : "neutro";
        z.tec = {
          est: w,
          txt: `Tendência ${Q.tend}; preço ${Q.m200 == null ? "sem MM200 (histórico curto)" : Fe ? "acima da MM200" : "abaixo da MM200"}; RSI ${Q.rsi != null ? Q.rsi.toFixed(0) : "—"}${Q.ev.length ? "; " + Q.ev[0].t.toLowerCase() : ""}.`,
          cob: fe,
        };
      }
      if (R === "acao" || R === "fii")
        if (!ie)
          z.fun = {
            est: "sem",
            txt: "Fundamentos ainda não carregados.",
            cob: 0,
          };
        else if (R === "fii") {
          const fe = [
              ["dy", ie.dy, (N) => N >= 8, (N) => N < 6, "DY "],
              ["pvp", ie.pvp, (N) => N <= 1.05, (N) => N > 1.2, "P/VP "],
            ],
            Fe = fe.filter((N) => N[1] != null),
            w = Fe.filter((N) => N[2](N[1])).length,
            H = Fe.filter((N) => N[3](N[1])).length;
          z.fun = {
            est: Fe.length
              ? w === Fe.length
                ? "bom"
                : H
                  ? "ruim"
                  : "neutro"
              : "sem",
            txt:
              Fe.map(
                (N) => N[4] + (N[0] === "dy" ? Ye(N[1]) + "%" : Xe(N[1])),
              ).join(" · ") || "Sem DY e P/VP.",
            cob: Fe.length / 2,
          };
        } else {
          const fe = [
              ["ROE", ie.roe, (N) => N >= 15, (N) => N < 5, "%"],
              ["Margem líq.", ie.ml, (N) => N >= 10, (N) => N < 0, "%"],
              ["Dív./PL", ie.de, (N) => N <= 1, (N) => N > 2.5, ""],
              [
                "P/L",
                ie.pl,
                (N) => N > 0 && N <= 15,
                (N) => N <= 0 || N > 35,
                "",
              ],
              ["Revisão LPA 30d", ie.rev, (N) => N >= 1, (N) => N <= -3, "%"],
              ["Cresc. receita", ie.cr, (N) => N >= 5, (N) => N < 0, "%"],
            ],
            Fe = fe.filter((N) => N[1] != null && isFinite(N[1])),
            w = Fe.filter((N) => N[2](N[1])),
            H = Fe.filter((N) => N[3](N[1]));
          z.fun = {
            est: Fe.length
              ? w.length >= 3 && H.length <= 1
                ? "bom"
                : H.length >= 2
                  ? "ruim"
                  : "neutro"
              : "sem",
            txt:
              (w.length
                ? "A favor: " +
                  w.map((N) => N[0] + " " + Ye(N[1]) + N[4]).join(", ") +
                  ". "
                : "") +
                (H.length
                  ? "Contra: " +
                    H.map((N) => N[0] + " " + Ye(N[1]) + N[4]).join(", ") +
                    "."
                  : "") || "Indicadores na faixa neutra.",
            cob: Fe.length / fe.length,
          };
        }
      else
        z.fun = {
          est: "na",
          txt: `Fundamentos de empresa não se aplicam a ${(a[K.cl] || K.cl).toLowerCase()}.`,
          cob: null,
        };
      const oe = K.peso || 0;
      if (!Q && !["tesouro", "rf"].includes(K.cl))
        z.risco = {
          est: "sem",
          txt: `Peso ${Ye(oe)}%; sem histórico para volatilidade.`,
          cob: 0.3,
        };
      else {
        const fe = Q ? Q.vol1a : null,
          Fe = Q ? Q.dd52 : null,
          w = (fe != null && fe > 45) || (Fe != null && Fe < -30) || oe > 25,
          H = (fe == null || fe < 25) && (Fe == null || Fe > -15) && oe < 15;
        z.risco = {
          est: w ? "ruim" : H ? "bom" : "neutro",
          txt: `Volatilidade ${fe != null ? Ye(fe) + "% a.a." : "—"} · ${Fe != null ? Ye(Fe) + "% da máxima de 52 semanas" : "sem máxima de 52 semanas"} · peso ${Ye(oe)}%.`,
          cob: ([fe, Fe].filter((N) => N != null).length / 2) * 0.7 + 0.3,
        };
      }
      const me = y(K),
        be = me ? (Date.now() - Date.parse(me.em || me.d)) / 36e5 : null,
        X = Ke(K.tk),
        xe = X ? (Date.now() - Date.parse(X.gerado)) / 864e5 : null,
        $e =
          be != null && be < 30 && xe != null && xe <= 7
            ? "bom"
            : be == null || be > 120 || xe == null
              ? "ruim"
              : "neutro";
      return (
        (z.atual = {
          est: $e,
          txt: `Cotação ${be == null ? "sem preço (usando o preço médio)" : be < 1 ? "de agora há pouco" : be < 30 ? "de hoje" : "de " + Math.round(be / 24) + " dia(s) atrás"} · relatório da IA ${xe == null ? "ainda não feito" : xe < 1 ? "de hoje" : "de " + Math.floor(xe) + " dia(s) atrás"}${R === "acao" && re.ts ? ` · fundamentos de ${new Date(re.ts).toLocaleDateString("pt-BR")}` : ""}.`,
          cob:
            [me, X, R === "acao" || R === "fii" ? re.ts : 1].filter(Boolean)
              .length / 3,
        }),
        z
      );
    }
    const Ye = (K) =>
        K == null || !isFinite(K)
          ? "—"
          : (+K).toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            }),
      Xe = (K) =>
        K == null || !isFinite(K)
          ? "—"
          : (+K).toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            });
    function ot(K) {
      const pe = { tec: {}, fun: {}, risco: {}, atual: {} },
        Q = { tec: [0, 0], fun: [0, 0], risco: [0, 0], atual: [0, 0] },
        re = {};
      return (
        K.pos.forEach((ie) => {
          const R = Je(ie, K);
          Object.keys(pe).forEach((z) => {
            const oe = R[z].est;
            ((pe[z][oe] = (pe[z][oe] || 0) + ie.peso),
              R[z].cob != null &&
                ((Q[z][0] += R[z].cob * ie.peso), (Q[z][1] += ie.peso)),
              oe === "ruim" &&
                (!re[z] || ie.peso > re[z].peso) &&
                (re[z] = { tk: ie.tk, peso: ie.peso, txt: R[z].txt }));
          });
        }),
        {
          D: pe,
          cob: Object.fromEntries(
            Object.entries(Q).map(([ie, R]) => [
              ie,
              R[1] ? (R[0] / R[1]) * 100 : null,
            ]),
          ),
          pior: re,
        }
      );
    }
    function Ke(K) {
      return (
        (t.rel || []).find((pe) => pe.tipo === "ativo" && pe.tk === K) || null
      );
    }
    const at = () =>
      (t.rel || []).find((K) => K.tipo === "consolidado") || null;
    async function rt(K) {
      if (!(t.relBusy || (t.rel && !K))) {
        if (((t.relBusy = 1), !t.rel))
          try {
            const pe = await idb("kv", "get", "pfrel");
            Array.isArray(pe) && (t.rel = pe);
          } catch {}
        try {
          if (typeof SESS > "u" || !SESS)
            throw new Error("Entre na sua conta para ver os relatórios da IA.");
          const pe = await rq(
            "/rest/v1/carteira_relatorios?select=id,tipo,tk,ref,gerado,fontes,dados_em,modelo,prompt_ver,exec_id,validacao,meta,conteudo,dados&order=gerado.desc&limit=200",
          );
          ((t.rel = await pe.json()), (t.relErr = ""));
          try {
            idb("kv", "put", t.rel, "pfrel");
          } catch {}
        } catch (pe) {
          ((t.relErr =
            pe.status === 404 || /carteira_relatorios/.test(String(pe.message))
              ? "Rode o arquivo carteira.sql no Supabase para guardar os relatórios."
              : em(pe)),
            (t.rel = t.rel || []));
        }
        ((t.relBusy = 0), tab === "carteiras" && render());
      }
    }
    function dt(K) {
      const pe = f()[K.tk] || {},
        Q = y(K);
      return {
        tk: K.tk,
        mk: K.mk,
        cl: K.cl,
        q: +K.q.toFixed(8),
        pm: +K.pm.toFixed(6),
        nome: pe.nome || "",
        setor: K.setor,
        regiao: K.regiao,
        moeda: K.moeda,
        prov: +(K.provR || 0).toFixed(2),
        prox: pe.prox || null,
        px_manual: ["tesouro", "rf", "outro"].includes(K.cl) && Q ? +Q.p : null,
        primeira: K.first,
      };
    }
    function vt() {
      const K = we();
      if (!K) return null;
      const pe = Ce(K, "1A"),
        Q = Ce(K, "1M"),
        re = Ce(K, "1D"),
        ie = Ce(K, "TUDO");
      return {
        calculado_em: new Date().toISOString(),
        rent_dia_pct: ft(re.ret),
        rent_mes_pct: ft(Q.ret),
        rent_ano_pct: ft(pe.ret),
        rent_total_pct: ft(ie.ret),
        ibov_ano_pct: ft(pe.ib),
        cdi_ano_pct: ft(pe.cdi),
        volatilidade_ano_pct: ft(pe.vol),
        drawdown_max_ano_pct: ft(pe.dd),
        metodo:
          "cota diária (TWR): compras e vendas são fluxos; proventos contam como ganho",
      };
    }
    const ft = (K) => (K == null || !isFinite(K) ? null : +K.toFixed(2));
    async function ht(K) {
      if (typeof SESS > "u" || !SESS) return !1;
      const pe = k(),
        Q = I(),
        re = {
          on: !!Q.on,
          off: Q.off || 20,
          itens: pe.pos.map(dt),
          wl: A()
            .filter((R) => !R.virou)
            .map((R) => R.tk),
          metricas: vt(),
        },
        ie = JSON.stringify([
          re.on,
          re.off,
          re.itens.map((R) => [R.tk, R.q, R.pm, R.cl]),
        ]);
      if (!K && ie === t.cfgSig && Date.now() - (t.cfgTs || 0) < 6 * 36e5)
        return !0;
      try {
        return (
          await rq("/rest/v1/carteira_cfg?on_conflict=user_id", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify({
              cfg: re,
              atualizado: new Date().toISOString(),
            }),
          }),
          (t.cfgSig = ie),
          (t.cfgTs = Date.now()),
          (t.cfgErr = ""),
          !0
        );
      } catch (R) {
        return (
          (t.cfgErr =
            R.status === 404
              ? "Rode o arquivo carteira.sql no Supabase."
              : em(R)),
          !1
        );
      }
    }
    async function qe() {
      if (!(typeof SESS > "u" || !SESS))
        try {
          const K = await (
            await rq("/rest/v1/carteira_cfg?select=estado,atualizado&limit=1")
          ).json();
          t.cfgRemoto = (K && K[0]) || null;
        } catch {}
    }
    async function Le(K, pe) {
      if (!t.busy) {
        ((t.busy = "rel:" + K.tk), (t.msg = ""), render());
        try {
          const Q = await anxCall({
            modo: "carteira_ativo",
            item: dt(
              K.q
                ? K
                : {
                    ...K,
                    q: 0,
                    pm: 0,
                    provR: 0,
                    first: null,
                    setor: x(K),
                    regiao: u(K),
                    moeda: p(K) ? "USD" : "BRL",
                  },
            ),
            force: !!pe,
          });
          if (Q.row) {
            t.rel = [Q.row].concat(
              (t.rel || []).filter((re) => re.id !== Q.row.id),
            );
            try {
              idb("kv", "put", t.rel, "pfrel");
            } catch {}
          }
          ((t.msg = Q.reaproveitado
            ? `${K.tk}: sem mudança relevante desde o último relatório (${(Q.motivos || []).join("; ")}). Use “Refazer mesmo assim” se quiser.`
            : `Relatório de ${K.tk} pronto.`),
            !Q.reaproveitado && Q.row && (t.rv = Q.row.id));
        } catch (Q) {
          t.msg = em(Q);
        }
        ((t.busy = ""), render());
      }
    }
    async function ke() {
      if (!t.busy) {
        ((t.busy = "cons"), (t.msg = "Preparando os dados…"), render());
        try {
          if (!(await ht(!0)))
            throw new Error(
              t.cfgErr || "Não consegui enviar a carteira ao servidor.",
            );
          ((t.msg = "A IA está escrevendo o relatório consolidado…"), render());
          const K = await anxCall({ modo: "carteira_consolidado" });
          if (K.row) {
            t.rel = [K.row].concat(
              (t.rel || []).filter((pe) => pe.id !== K.row.id),
            );
            try {
              idb("kv", "put", t.rel, "pfrel");
            } catch {}
            t.rv = K.row.id;
          }
          t.msg = "Relatório consolidado pronto.";
        } catch (K) {
          t.msg = em(K);
        }
        ((t.busy = ""), render());
      }
    }
    async function ze() {
      if (!t.busy) {
        ((t.busy = "auto"), (t.msg = "Enviando a carteira…"), render());
        try {
          if (!(await ht(!0)))
            throw new Error(
              t.cfgErr || "Não consegui enviar a carteira ao servidor.",
            );
          for (let K = 0; K < 10; K++) {
            const pe = await anxCall({ modo: "carteira_auto", ms: 11e4 });
            if (
              ((t.msg = `Rodada: ${pe.feitos.length} relatório(s) novo(s), ${pe.reap.length} sem mudança, ${pe.pendentes.length} pendente(s)${pe.falhas.length ? ", " + pe.falhas.length + " falha(s)" : ""}${pe.cons ? " · consolidado pronto" : ""}`),
              render(),
              pe.cons ||
                pe.erro_cons ||
                (!pe.pendentes.length && !pe.cons && K > 0))
            ) {
              pe.erro_cons && (t.msg += " · consolidado: " + pe.erro_cons);
              break;
            }
          }
          await rt(!0);
        } catch (K) {
          t.msg = em(K);
        }
        ((t.busy = ""), render());
      }
    }
    const Ue = { alta: 3, média: 2, baixa: 1 },
      We = () => {
        const K = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} });
        return K.alog ?? (K.alog = []);
      };
    async function Re(K) {
      if (t.radarBusy || (!K && Date.now() - t.radar < 30 * 6e4)) return;
      t.radarBusy = 1;
      const pe = C(),
        Q = k(),
        re = se(),
        ie = new Date().toISOString(),
        R = loc().slice(0, 10),
        z = [],
        oe = ($e, fe, Fe, w, H, N) =>
          z.some((x) => x.id === fe + "|" + $e + "|" + Fe) ||
          z.push({
            id: fe + "|" + $e + "|" + Fe,
            tk: $e,
            tipo: fe,
            em: ie,
            fonte: w,
            motivo: H,
            rel: N,
            sit: "novo",
          });
      re.forEach(($e) => {
        const fe = Se($e);
        if (!fe) return;
        const Fe = $e.tk + ($e.wl ? " (watchlist)" : "");
        (fe.niv
          .filter(
            (w) => Math.abs(w.dist) <= pe.sr && /Suporte|Resist/.test(w.tipo),
          )
          .slice(0, 1)
          .forEach((w) =>
            oe(
              $e.tk,
              "sr",
              R + w.tipo.slice(0, 3),
              "cálculo do app (velas diárias)",
              `${Fe} a ${Ye(Math.abs(w.dist))}% d${w.tipo.startsWith("Sup") ? "o suporte" : "a resistência"} em ${Xe(w.v)} (${w.tipo.toLowerCase()})`,
              "média",
            ),
          ),
          pe.mm &&
            fe.ev
              .filter((w) => ["curto", "longo"].includes(w.tipo))
              .forEach((w) =>
                oe(
                  $e.tk,
                  "mm",
                  R + w.t,
                  "cálculo do app (médias móveis)",
                  `${Fe}: ${w.t}`,
                  w.tipo === "longo" ? "alta" : "média",
                ),
              ),
          fe.rsi != null &&
            (fe.rsi <= pe.rsiLo || fe.rsi >= pe.rsiHi) &&
            oe(
              $e.tk,
              "rsi",
              R,
              "cálculo do app (RSI 14)",
              `${Fe}: RSI em ${Ye(fe.rsi)} (${fe.rsi <= pe.rsiLo ? "abaixo de " + pe.rsiLo : "acima de " + pe.rsiHi})`,
              "média",
            ),
          fe.atrX != null &&
            fe.atrX >= pe.volX &&
            oe(
              $e.tk,
              "vol",
              R,
              "cálculo do app (ATR 14 contra a média de 60 dias)",
              `${Fe}: volatilidade ${Ye(fe.atrX)}× a média recente`,
              fe.atrX >= pe.volX * 1.4 ? "alta" : "média",
            ));
      });
      const me = f();
      (re.forEach(($e) => {
        const fe = me[$e.tk];
        if (fe) {
          if (fe.prox) {
            const Fe = (Date.parse(fe.prox) - Date.parse(R)) / 864e5;
            Fe >= 0 &&
              Fe <= pe.res &&
              oe(
                $e.tk,
                "res",
                fe.prox,
                "Yahoo Finance (calendário)",
                `${$e.tk} divulga resultado ${Fe === 0 ? "hoje" : "em " + Math.round(Fe) + " dia(s)"} (${fe.prox.split("-").reverse().join("/")})`,
                Fe <= 2 ? "alta" : "média",
              );
          }
          if (pe.fund && fe.fs && fe.fsAnt) {
            const Fe = fe.fsAnt,
              w = fe.fs,
              H = [];
            (Fe.pl &&
              w.pl &&
              Math.abs(w.pl / Fe.pl - 1) >= 0.15 &&
              H.push(`P/L ${Ye(Fe.pl)} → ${Ye(w.pl)}`),
              Fe.dy != null &&
                w.dy != null &&
                Math.abs(w.dy - Fe.dy) >= 1 &&
                H.push(`DY ${Ye(Fe.dy)}% → ${Ye(w.dy)}%`),
              Fe.roe != null &&
                w.roe != null &&
                Math.abs(w.roe - Fe.roe) >= 3 &&
                H.push(`ROE ${Ye(Fe.roe)}% → ${Ye(w.roe)}%`),
              Fe.alvo &&
                w.alvo &&
                Math.abs(w.alvo / Fe.alvo - 1) >= 0.1 &&
                H.push(`preço-alvo médio ${Xe(Fe.alvo)} → ${Xe(w.alvo)}`),
              Fe.nota &&
                w.nota &&
                Math.abs(w.nota - Fe.nota) >= 0.3 &&
                H.push(`nota dos analistas ${Ye(Fe.nota)} → ${Ye(w.nota)}`),
              H.length &&
                oe(
                  $e.tk,
                  "fund",
                  String(w.em).slice(0, 10),
                  "TradingView e Yahoo (fundamentos)",
                  `${$e.tk}: ${H.join(" · ")}`,
                  H.length >= 2 ? "alta" : "média",
                ));
          }
        }
      }),
        Q.pos.forEach(($e) => {
          $e.peso >= pe.conc &&
            oe(
              $e.tk,
              "conc",
              R.slice(0, 7),
              "cálculo do app (pesos)",
              `${$e.tk} pesa ${Ye($e.peso)}% da carteira (limite configurado: ${pe.conc}%)`,
              $e.peso >= pe.conc * 1.5 ? "alta" : "média",
            );
        }));
      const be = {};
      if (
        (Q.pos.forEach(($e) => {
          be[$e.setor] = (be[$e.setor] || 0) + $e.peso;
        }),
        Object.entries(be).forEach(([$e, fe]) => {
          fe >= pe.setor &&
            $e !== "Renda fixa" &&
            oe(
              "Carteira",
              "conc",
              $e + R.slice(0, 7),
              "cálculo do app (setores)",
              `Setor ${$e} soma ${Ye(fe)}% da carteira (limite: ${pe.setor}%)`,
              "média",
            );
        }),
        pe.ia)
      ) {
        const $e = {};
        ((t.rel || [])
          .filter((fe) => fe.tipo === "ativo")
          .forEach((fe) => {
            ($e[fe.tk] = $e[fe.tk] || []).push(fe);
          }),
          Object.entries($e).forEach(([fe, Fe]) => {
            if (Fe.length < 2) return;
            const w =
                Fe[1].conteudo &&
                Fe[1].conteudo.tecnica &&
                Fe[1].conteudo.tecnica.tendencias,
              H =
                Fe[0].conteudo &&
                Fe[0].conteudo.tecnica &&
                Fe[0].conteudo.tecnica.tendencias;
            if (w && H) {
              const N = ["curto", "medio", "longo"].filter(
                (W) => w[W] && H[W] && w[W] !== H[W] && H[W] !== "sem dado",
              );
              N.length &&
                oe(
                  fe,
                  "ia",
                  Fe[0].ref,
                  "relatórios da IA (comparação)",
                  `${fe}: a IA mudou a tendência de ${N.map((W) => W.replace("medio", "médio") + " prazo (" + w[W] + " → " + H[W] + ")").join(", ")}`,
                  N.includes("longo") ? "alta" : "média",
                );
            }
            Fe[0].conteudo &&
              Fe[0].conteudo.reavaliar &&
              Fe[0].conteudo.reavaliar.sim &&
              oe(
                fe,
                "ia",
                "reav" + Fe[0].ref,
                "relatório da IA",
                `${fe}: a IA pediu reavaliação — ${Fe[0].conteudo.reavaliar.motivo}`,
                "alta",
              );
          }));
      }
      if (pe.news && e.trFn) {
        const $e = Q.pos
            .filter((Fe) => !["tesouro", "rf", "outro"].includes(Fe.cl))
            .slice(0, 6),
          fe =
            /fato relevante|resultado|lucro|preju[i\xed]zo|dividend|jcp|recompra|cvm|rebaix|investiga|recupera[c\xe7][a\xe3]o judicial|aquisi[c\xe7][a\xe3]o|fus[a\xe3]o|guidance|downgrade|upgrade/i;
        for (const Fe of $e)
          try {
            const w = await e.trFn("noticias", { q: Fe.tk }, 18e5);
            ((w && w.itens) || [])
              .filter(
                (H) =>
                  Date.now() - Date.parse(H.d) < 36e5 * 30 &&
                  (H.t || "")
                    .toUpperCase()
                    .includes(Fe.tk.replace(/\d+$/, "").slice(0, 4)),
              )
              .slice(0, 4)
              .forEach((H) => {
                const tt = pfNoticiaPT(Fe.tk, H.t || "", H.f || "notícias");
                oe(Fe.tk, "news", R + "|" + tt.chave, H.f || "notícias", tt.motivo, fe.test(H.t) || tt.alta ? "alta" : "baixa");
              });
          } catch {}
      }
      const X = We(),
        xe = new Set(X.map(($e) => $e.id));
      (z.forEach(($e) => {
        xe.has($e.id) || X.unshift($e);
      }),
        X.length > 400 && (X.length = 400),
        (t.radar = Date.now()),
        (t.radarBusy = 0),
        save(),
        tab === "carteiras" && render());
    }
    (Object.assign(window, {
      pfQAtualiza: Ie,
      pfHist: he,
      pfRel: rt,
      pfRadar: Re,
      pfVelas: Ve,
      pfMeta: Pe,
      pfScore: Je,
      pfScoreCart: ot,
      pfTec: Se,
      pfGeraAtivo: Le,
      pfGeraCons: ke,
      pfRodada: ze,
      pfCfgSync: ht,
      pfCfgLe: qe,
      pfUltRel: Ke,
      pfUltCons: at,
      pfPerMeses: Qe,
      pfMetricas: vt,
    }),
      Object.assign((window.PFX = window.PFX || {}), {
        C2: a,
        COR: o,
        PAL: s,
        famDe: n,
        classifica: c,
        setorDe: x,
        regiaoDe: u,
        nomeDe: v,
        lancs: h,
        pxDe: y,
        ehUSD: p,
        simTV: J,
        WL: A,
        RCFG: C,
        RELCFG: I,
        ALOG: We,
        META: f,
        PER: Be,
        PER_N: Ge,
        nf1: Ye,
        nf2: Xe,
        num: g,
        RELV: Ue,
        ativosVistos: se,
        velaTk: de,
      }));
  })(),
  (function () {
    const e = window.PF,
      t = window.PFX,
      a = window.TRM || {};
    if (!e || !t) return;
    const {
        C2: o,
        COR: s,
        PAL: n,
        famDe: r,
        classifica: i,
        setorDe: l,
        regiaoDe: d,
        lancs: c,
        pxDe: p,
        ehUSD: u,
        WL: m,
        RCFG: f,
        RELCFG: x,
        ALOG: v,
        META: g,
        PER: h,
        PER_N: b,
        nf1: y,
        nf2: j,
        num: k,
        ativosVistos: A,
        velaTk: C,
      } = t,
      I = (V) =>
        V == null || !isFinite(V)
          ? "—"
          : (+V).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
      J = (V) =>
        V == null || !isFinite(V)
          ? "—"
          : (+V).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            }),
      se = (V, ae) => (u(V) ? J(ae) : I(ae)),
      Ie = (V, ae = 2) =>
        V == null || !isFinite(V)
          ? "—"
          : (V > 0 ? "+" : "") +
            (+V).toLocaleString("pt-BR", {
              minimumFractionDigits: ae,
              maximumFractionDigits: ae,
            }) +
            "%",
      Pe = (V) =>
        V == null || !isFinite(V) || Math.abs(V) < 1e-9
          ? ""
          : V > 0
            ? "up"
            : "dn",
      Me = (V) =>
        (+V).toLocaleString("pt-BR", { maximumFractionDigits: V < 1 ? 8 : 4 }),
      ue = (V) =>
        V ? String(V).slice(0, 10).split("-").reverse().join("/") : "—",
      ve = (V) =>
        V
          ? new Date(V).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      he = (V, ae = 18) =>
        `<svg viewBox="0 0 24 24" width="${ae}" height="${ae}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${V}</svg>`,
      we = {
        home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
        lista: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
        ia: '<path d="M12 3a4 4 0 0 0-4 4v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5 4 4 0 0 0 8 0 3 3 0 0 0 2-5 3 3 0 0 0-2-5V7a4 4 0 0 0-4-4z"/><path d="M12 7v10"/>',
        des: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
        radar:
          '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
        hist: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
        mala: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
        att: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
        rel: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        x: '<path d="M18 6L6 18M6 6l12 12"/>',
        lixo: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
        mais: '<path d="M12 5v14M5 12h14"/>',
      },
      Be = [
        ["geral", "Visão Geral", we.home],
        ["ativos", "Meus Ativos", we.lista],
        ["ia", "Análise IA", we.ia],
        ["des", "Desempenho", we.des],
        ["radar", "Radar", we.radar],
        ["hist", "Histórico", we.hist],
      ];
    function Ge(V, ae, ee = {}) {
      const le = ee.w || 760,
        Y = ee.h || 230,
        q = 8,
        L = 62,
        F = 12,
        O = 22,
        ne = V.flatMap((ye) => ye.v.filter((Oe) => Oe != null && isFinite(Oe)));
      if (ne.length < 2)
        return `<div class="pfvz">${ee.vazio || "Sem dados suficientes para o gráfico."}</div>`;
      let Ee = Math.min(...ne),
        Ae = Math.max(...ne);
      ee.zero && ((Ee = Math.min(Ee, 0)), (Ae = Math.max(Ae, 0)));
      const ge = (Ae - Ee) * 0.06 || 1;
      ((Ee -= ge), (Ae += ge));
      const je = ae.length,
        Ze = (ye) => q + (ye * (le - q - L)) / Math.max(1, je - 1),
        He = (ye) => F + ((Ae - ye) / (Ae - Ee)) * (Y - F - O),
        ce = (ye) => {
          let Oe = "",
            De = !1;
          return (
            ye.forEach((Ne, _e) => {
              if (Ne == null || !isFinite(Ne)) {
                De = !1;
                return;
              }
              ((Oe +=
                (De ? "L" : "M") + Ze(_e).toFixed(1) + "," + He(Ne).toFixed(1)),
                (De = !0));
            }),
            Oe
          );
        },
        E = ee.fmt || ((ye) => y(ye));
      let P = "";
      for (let ye = 0; ye <= 3; ye++) {
        const Oe = Ee + ((Ae - Ee) * ye) / 3;
        P += `<line x1="${q}" x2="${le - L}" y1="${He(Oe).toFixed(1)}" y2="${He(Oe).toFixed(1)}" class="pfgl"/><text x="${le - L + 6}" y="${(He(Oe) + 4).toFixed(1)}" class="pfgt">${E(Oe)}</text>`;
      }
      const B = [0, Math.floor(je / 3), Math.floor((2 * je) / 3), je - 1]
          .filter((ye, Oe, De) => De.indexOf(ye) === Oe)
          .map(
            (ye) =>
              `<text x="${Ze(ye).toFixed(1)}" y="${Y - 5}" class="pfgt" text-anchor="${ye === 0 ? "start" : ye === je - 1 ? "end" : "middle"}">${ee.rot ? ee.rot(ae[ye]) : ue(ae[ye]).slice(0, 5) + (ee.ano ? "/" + String(ae[ye]).slice(2, 4) : "")}</text>`,
          )
          .join(""),
        G = V[0],
        te =
          ee.area && G
            ? `<path d="${ce(G.v)}L${Ze(je - 1).toFixed(1)},${(Y - O).toFixed(1)}L${Ze(G.v.findIndex((ye) => ye != null)).toFixed(1)},${(Y - O).toFixed(1)}Z" fill="url(#pfgrad)"/>`
            : "",
        _ =
          G && G.v[je - 1] != null
            ? `<g><rect x="${le - L + 2}" y="${(He(G.v[je - 1]) - 9).toFixed(1)}" width="${L - 4}" height="18" rx="4" fill="${G.cor}"/><text x="${le - L + 6}" y="${(He(G.v[je - 1]) + 4).toFixed(1)}" class="pfgt pfgtu">${E(G.v[je - 1])}</text></g>`
            : "";
      return (
        `<svg class="pfsvg" viewBox="0 0 ${le} ${Y}" role="img" aria-label="${esc(ee.titulo || "gráfico")}"><defs><linearGradient id="pfgrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cfab69" stop-opacity=".28"/><stop offset="1" stop-color="#cfab69" stop-opacity="0"/></linearGradient></defs>${P}${te}${V.map((ye) => `<path d="${ce(ye.v)}" fill="none" stroke="${ye.cor}" stroke-width="${ye.w || 1.8}"${ye.dash ? ' stroke-dasharray="5 4"' : ""} stroke-linejoin="round"/>`).join("")}${B}${_}</svg>` +
        (V.length > 1 || ee.leg
          ? `<div class="pfleg">${V.map((ye) => `<span><i style="background:${ye.cor}"></i>${esc(ye.nome)}</span>`).join("")}</div>`
          : "")
      );
    }
    function Ce(V, ae, ee) {
      const le = V.reduce((ne, Ee) => ne + Ee.v, 0);
      if (!(le > 0)) return '<div class="pfvz">Sem posições.</div>';
      let Y = -Math.PI / 2,
        q = "";
      const L = 62,
        F = 44,
        O = 72;
      return (
        V.forEach((ne) => {
          const Ee = ne.v / le,
            Ae = Y + Ee * Math.PI * 2 - 1e-4,
            ge = Ee > 0.5 ? 1 : 0,
            je = (Ze, He) =>
              [O + He * Math.cos(Ze), O + He * Math.sin(Ze)]
                .map((ce) => ce.toFixed(2))
                .join(" ");
          ((q +=
            Ee >= 0.9999
              ? `<circle cx="${O}" cy="${O}" r="${(L + F) / 2}" fill="none" stroke="${ne.cor}" stroke-width="${L - F}"/>`
              : `<path d="M${je(Y, L)} A${L} ${L} 0 ${ge} 1 ${je(Ae, L)} L${je(Ae, F)} A${F} ${F} 0 ${ge} 0 ${je(Y, F)}Z" fill="${ne.cor}"/>`),
            (Y = Ae + 1e-4));
        }),
        `<div class="pfdon"><svg viewBox="0 0 144 144" class="pfdsvg" role="img" aria-label="distribuição">${q}<text x="72" y="70" text-anchor="middle" class="pfdc">${ae || ""}</text><text x="72" y="86" text-anchor="middle" class="pfds">${ee || ""}</text></svg><div class="pfdl">${V.map((ne) => `<div><i style="background:${ne.cor}"></i><span>${esc(ne.nome)}</span><b>${y((ne.v / le) * 100)}%</b></div>`).join("")}</div></div>`
      );
    }
    const Qe = (V, ae) => {
        const ee = Math.max(...V.map((le) => Math.abs(le.v)), 1e-9);
        return V.map(
          (le) =>
            `<div class="pfbar"><span>${esc(le.nome)}</span><i><b style="width:${(Math.abs(le.v) / ee) * 100}%;background:${le.cor || "#709bc2"}"></b></i><em>${ae ? ae(le.v) : y(le.v) + "%"}</em></div>`,
        ).join("");
      },
      de = (V, ae) => {
        const ee = {};
        return (
          V.forEach((le) => {
            const Y = ae(le);
            ee[Y] = (ee[Y] || 0) + le.v;
          }),
          Object.entries(ee).sort((le, Y) => Y[1] - le[1])
        );
      },
      Se = (V, ae, ee = "", le = "") =>
        `<section class="pfc ${le}"><header><h3>${V}</h3>${ee}</header>${ae}</section>`,
      Ve = (V, ae, ee, le) =>
        `<button class="pfch${V === ae ? " on" : ""}" data-pf="${le}|${V}">${ee}</button>`,
      Je = (V) =>
        `<div class="pfchs">${Object.keys(h)
          .map((ae) => Ve(ae, e.per, b[ae], V || "per"))
          .join("")}</div>`,
      Ye = {
        bom: ["Favorável", "g"],
        neutro: ["Neutro", "b"],
        ruim: ["Desfavorável", "r"],
        sem: ["Sem dados", "m"],
        na: ["Não se aplica", "m"],
      },
      Xe = [
        ["tec", "Técnica", Ye],
        ["fun", "Fundamentalista", Ye],
        [
          "risco",
          "Risco",
          {
            bom: ["Baixo", "g"],
            neutro: ["Moderado", "b"],
            ruim: ["Elevado", "r"],
            sem: ["Sem dados", "m"],
            na: ["Não se aplica", "m"],
          },
        ],
        [
          "atual",
          "Atualidade dos dados",
          {
            bom: ["Em dia", "g"],
            neutro: ["Atenção", "b"],
            ruim: ["Desatualizado", "r"],
            sem: ["Sem dados", "m"],
            na: ["—", "m"],
          },
        ],
      ],
      ot = {
        validado: [
          "Validado",
          "g",
          "Todos os números dos fatos conferem com os dados recebidos.",
        ],
        com_limitacoes: [
          "Com limitações",
          "b",
          "Números conferidos, mas faltaram dados (veja as lacunas).",
        ],
        revisar: [
          "Revisar",
          "r",
          "Há fato com número que não está nos dados: leia com atenção.",
        ],
      },
      Ke = (V) => {
        const ae = ot[(V || {}).estado] || ["Sem validação", "m", ""];
        return `<span class="pfst ${ae[1]}" title="${esc(ae[2])}">${ae[0]}</span>`;
      };
    function at(V, ae) {
      if (ae === "1D") {
        const L = e.q[V];
        return L && L.d1 != null ? +L.d1 : null;
      }
      let ee = null;
      try {
        ee = TRM.trGet("histp", pfHistArgs()).v;
      } catch {}
      const le = ee && ee.series && ee.series[V];
      if (!le || le.c.length < 2) return null;
      const Y = le.c.length,
        q = Math.min(Y - 1, h[ae] || 21);
      return (le.c[Y - 1] / le.c[Y - 1 - q] - 1) * 100;
    }
    function rt() {
      setTimeout(() => {
        try {
          (pfQAtualiza(),
            pfHist(),
            pfRel(),
            pfMeta(),
            pfVelas(),
            pfRadar(),
            x().on && pfCfgSync(!1));
        } catch (V) {
          console.warn(V);
        }
      }, 0);
    }
    function dt() {
      rt();
      const V = pfCalc(),
        ae = !c().length && !m().length;
      let ee = `<div class="pf"><div class="pfhd"><div class="pftit"><span class="pfico">${he(we.mala, 26)}</span><div><h1>Carteira</h1><p>Sua central de investimentos com inteligência</p></div></div>
  <div class="pfacts"><span class="pfmut pfsm">${esc(e.qMsg || "")}${V.fx ? ` · dólar ${j(V.fx)}` : ""}</span><button class="pfbt" data-pf="att">${he(we.att, 15)}<span class="pfhl"> Atualizar</span></button><button class="pfbt" data-pf="form|C">${he(we.mais, 15)} Movimentação</button><button class="pfbt pfam" data-pf="aba|ia">${he(we.rel, 15)}<span class="pfhl"> ${x().on ? "Relatório agendado" : "Agendar relatório"}</span></button></div></div>`;
      return (
        ae &&
          (ee +=
            '<section class="pfc pfvazia"><h3>Comece pela sua carteira</h3><p>Registre uma compra (ações, FIIs, ETFs, BDRs, ações e ETFs dos EUA, cripto, Tesouro ou renda fixa) ou acompanhe ativos na watchlist sem ter posição. A classe, o setor e a moeda são reconhecidos sozinhos.</p><div class="pfrow"><button class="pfbt pfam" data-pf="form|C">Registrar compra</button><button class="pfbt" data-pf="form|W">Adicionar à watchlist</button><button class="pfbt" data-pf="go|import">Importar notas do Profit</button></div></section>'),
        (ee +=
          vt(V) +
          `<div class="pftabs" role="tablist" aria-label="Áreas da carteira">${Be.map(([le, Y, q]) => `<button role="tab" aria-selected="${e.aba === le}" class="${e.aba === le ? "on" : ""}" data-pf="aba|${le}">${he(q, 16)}<span>${Y}</span></button>`).join("")}</div>`),
        e.msg &&
          (ee += `<div class="pfmsg">${esc(e.msg)}${e.busy ? ' <span class="pfspin"></span>' : ""}<button class="pfx" data-pf="msgx" aria-label="fechar">${he(we.x, 14)}</button></div>`),
        (ee +=
          { geral: ft, ativos: ze, ia: Q, des: X, radar: xe, hist: $e }[
            e.aba
          ]?.(V) || ""),
        (ee += Fe(V)),
        ee + "</div>"
      );
    }
    function vt(V) {
      const ae = perfCalc(),
        ee = ae && perfPer(ae, "1M"),
        le = ae && perfPer(ae, "1A"),
        Y = m().filter((L) => !L.virou).length,
        q = (L, F, O, ne) =>
          `<div class="pfk"><span>${L}</span><b class="${ne || ""}">${F}</b>${O ? `<em class="${ne || ""}">${O}</em>` : ""}</div>`;
      return `<div class="pfks">${q("Patrimônio atual", I(V.v), V.caixa != null ? "caixa " + I(V.caixa) : "")}${q("Custo de aquisição", I(V.c))}${q("Resultado total", I(V.res), Ie(V.resPct), Pe(V.res))}${q("Resultado do dia", I(V.dia), Ie(V.diaPct), Pe(V.dia))}${q("Rentabilidade no mês", ee ? Ie(ee.ret) : "—", ee && ee.cdi != null ? "CDI " + Ie(ee.cdi) : "", Pe(ee && ee.ret))}${q("Rentabilidade no ano", le ? Ie(le.ret) : "—", le && le.ib != null ? "Ibovespa " + Ie(le.ib) : "", Pe(le && le.ret))}${q("Proventos acumulados", I(V.prov), V.real ? "vendas: " + I(V.real) : "")}${q("Ativos", V.pos.length + " em posição", Y + " na watchlist")}</div>`;
    }
    function ft(V) {
      const ae = perfCalc(),
        ee = ae && perfPer(ae, e.per),
        le = ae
          ? (() => {
              const ce = ee.i0,
                E = ae.D.slice(ce),
                P = ae.V.slice(ce),
                B = ae.INV.slice(ce);
              return Ge(
                [
                  { nome: "Patrimônio", v: P, cor: "#cfab69", w: 2.2 },
                  {
                    nome: "Capital investido",
                    v: B,
                    cor: "#7a808c",
                    dash: 1,
                    w: 1.4,
                  },
                ],
                E,
                {
                  area: 1,
                  fmt: (G) =>
                    G >= 1e6
                      ? "R$ " + y(G / 1e6) + " mi"
                      : "R$ " +
                        (G / 1e3).toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        }) +
                        " mil",
                  ano: e.per === "TUDO" || e.per === "1A",
                  titulo: "Evolução patrimonial",
                },
              );
            })()
          : ht(),
        Y = `${Je()}${ee ? `<span class="pfsm ${Pe(ee.ret)}">${Ie(ee.ret)} no período</span>` : ""}`,
        q = de(V.pos, (ce) => ce.cl).map(([ce, E]) => ({
          nome: o[ce] || ce,
          v: E,
          cor: s[ce] || "#888",
        })),
        L = de(V.pos, (ce) => ce.setor).map(([ce, E], P) => ({
          nome: ce,
          v: E,
          cor: n[P % n.length],
        })),
        F = de(V.pos, (ce) => ce.regiao).map(([ce, E], P) => ({
          nome: ce,
          v: V.v ? (E / V.v) * 100 : 0,
          cor: ["#709bc2", "#37a46d", "#afa99d", "#b88c3a"][P % 4],
        })),
        O = de(V.pos, (ce) => ce.moeda).map(([ce, E]) => ({
          nome: ce === "USD" ? "Dólar" : "Real",
          v: V.v ? (E / V.v) * 100 : 0,
          cor: ce === "USD" ? "#3aad74" : "#709bc2",
        })),
        ne = V.pos
          .map((ce) => ({ o: ce, r: at(ce.tk, e.per) }))
          .filter((ce) => ce.r != null)
          .sort((ce, E) => E.r - ce.r),
        Ee = ne.slice(0, 3),
        Ae = ne
          .slice(-3)
          .reverse()
          .filter((ce) => !Ee.includes(ce)),
        ge = `<div class="pfmp"><div><h4 class="up">▲ Melhores</h4>${Ee.map((ce) => `<p data-pf="sel|${ce.o.k}"><span>${esc(ce.o.tk)}</span><b class="${Pe(ce.r)}">${Ie(ce.r)}</b></p>`).join("") || '<p class="pfmut">—</p>'}</div><div><h4 class="dn">▼ Piores</h4>${Ae.map((ce) => `<p data-pf="sel|${ce.o.k}"><span>${esc(ce.o.tk)}</span><b class="${Pe(ce.r)}">${Ie(ce.r)}</b></p>`).join("") || '<p class="pfmut">—</p>'}</div></div><p class="pfnota">Variação do preço no período (${b[e.per].toLowerCase()}).</p>`,
        je =
          v()
            .filter((ce) => ce.sit === "novo")
            .sort(
              (ce, E) =>
                t.RELV[E.rel] - t.RELV[ce.rel] || E.em.localeCompare(ce.em),
            )
            .slice(0, 5)
            .map(
              (ce) =>
                `<div class="pfal"><span class="pfrv ${ce.rel === "alta" ? "r" : ce.rel === "média" ? "a" : "b"}">${ce.rel}</span><p>${esc(ce.motivo)}</p><em>${new Date(ce.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</em></div>`,
            )
            .join("") || '<p class="pfmut">Nenhum alerta novo.</p>',
        Ze = pfUltCons(),
        He = Ze
          ? `<div class="pfiah">${Ke(Ze.validacao)}<span class="pfsm pfmut">${ve(Ze.gerado)}</span></div><p class="pfiat">${esc((Ze.conteudo.resumo_executivo.fatos || [])[0] || "")}</p>${(Ze.conteudo.pontos_positivos || []).length ? `<h4>Pontos positivos</h4>${Ze.conteudo.pontos_positivos.map((ce) => `<p class="pfok">✓ ${esc(ce)}</p>`).join("")}` : ""}${(Ze.conteudo.pontos_de_atencao || []).length ? `<h4>Pontos de atenção</h4>${Ze.conteudo.pontos_de_atencao.map((ce) => `<p class="pfwa">! ${esc(ce)}</p>`).join("")}` : ""}<button class="pfbt pfam pfw" data-pf="rv|${Ze.id}">Ver relatório completo →</button>`
          : `<p class="pfmut">${e.relErr ? esc(e.relErr) : "Ainda não há relatório consolidado."}</p><button class="pfbt pfam pfw" data-pf="cons">Gerar agora</button>`;
      return `<div class="pfg pfg3">${Se(`${he(we.des, 16)} Evolução patrimonial`, le, Y, "pfs2")}${Se("Alocação por classe", Ce(q, "100%", I(V.v)))}</div>
  <div class="pfg pfg3">${Se("Distribuição por setor", Ce(L, L.length + "", L.length === 1 ? "setor" : "setores"))}${Se("Distribuição geográfica e moeda", Qe(F) + '<div class="pfsep"></div>' + Qe(O))}${Se("Melhores e piores", ge)}</div>
  <div class="pfg pfg3">${Se("Alertas relevantes", je, '<button class="pflk" data-pf="aba|radar">Ver todos →</button>')}${Se(`${he(we.ia, 16)} Análise da IA`, He, '<button class="pflk" data-pf="aba|ia">Abrir →</button>', "pfia")}${Se("Risco e concentração", Le(V, ae))}</div>
  <div class="pfg pfg3">${Se("Portfolio Intelligence Scorecard", ke(V), '<span class="pfsm pfmut">por peso na carteira</span>', "pfs2")}${Se(
    "Maiores posições",
    V.pos
      .slice(0, 6)
      .map(
        (ce) =>
          `<p class="pflin" data-pf="sel|${ce.k}"><span><b>${esc(ce.tk)}</b> <em>${esc(o[ce.cl] || ce.cl)}</em></span><span>${y(ce.peso)}%</span><b class="${Pe(ce.pc)}">${Ie(ce.pc)}</b></p>`,
      )
      .join("") || '<p class="pfmut">—</p>',
    '<button class="pflk" data-pf="aba|ativos">Ver todos →</button>',
  )}</div>`;
    }
    function ht() {
      const V = (S.cart || {}).snap || {},
        ae = Object.keys(V).sort(),
        ee = ae.map(
          (le) =>
            ((V[le].BR || {}).v || 0) +
            ((V[le].US || {}).v || 0) * (+(S.cart || {}).fx || 0),
        );
      return ae.length >= 2
        ? Ge(
            [
              {
                nome: "Patrimônio (registros diários do app)",
                v: ee,
                cor: "#cfab69",
              },
            ],
            ae,
            {
              area: 1,
              leg: 1,
              fmt: (le) =>
                "R$ " +
                (le / 1e3).toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                }) +
                " mil",
            },
          )
        : `<div class="pfvz">${e.histBusy ? "Buscando o histórico de cotações…" : qe() || "O gráfico aparece quando o histórico de cotações chegar."}</div>`;
    }
    const qe = () => {
      try {
        return TRM.trGet("histp", pfHistArgs()).err || "";
      } catch {
        return "";
      }
    };
    function Le(V, ae) {
      if (!V.pos.length) return '<p class="pfmut">Sem posições.</p>';
      const ee = V.pos.map((Ee) => Ee.peso / 100),
        le = ee.reduce((Ee, Ae) => Ee + Ae * Ae, 0),
        Y = {};
      V.pos.forEach((Ee) => {
        Y[Ee.setor] = (Y[Ee.setor] || 0) + Ee.peso;
      });
      const q = Object.entries(Y).sort((Ee, Ae) => Ae[1] - Ee[1])[0],
        L = V.pos
          .filter((Ee) => Ee.moeda === "USD" || Ee.cl === "cripto")
          .reduce((Ee, Ae) => Ee + Ae.peso, 0),
        F = ae && perfPer(ae, "1A"),
        O = f(),
        ne = (Ee, Ae, ge) =>
          `<p class="pflin"><span>${Ee}</span><b class="${ge ? "dn" : ""}">${Ae}</b></p>`;
      return (
        ne(
          "Maior posição",
          `${esc(V.pos[0].tk)} · ${y(V.pos[0].peso)}%`,
          V.pos[0].peso >= O.conc,
        ) +
        ne(
          "3 maiores posições",
          y(V.pos.slice(0, 3).reduce((Ee, Ae) => Ee + Ae.peso, 0)) + "%",
        ) +
        ne("Número efetivo de ativos", le ? y(1 / le) : "—") +
        ne(
          "Maior setor",
          q ? `${esc(q[0])} · ${y(q[1])}%` : "—",
          q && q[1] >= O.setor,
        ) +
        ne("Exposição ao dólar e cripto", y(L) + "%") +
        ne(
          "Volatilidade (12 meses)",
          F && F.vol != null ? y(F.vol) + "% a.a." : "—",
        ) +
        ne("Queda máxima (12 meses)", F ? Ie(F.dd, 1) : "—", F && F.dd < -15) +
        '<p class="pfnota">Número efetivo = 1 ÷ soma dos pesos ao quadrado: quanto mais perto do total de ativos, mais diversificado.</p>'
      );
    }
    function ke(V) {
      if (!V.pos.length) return '<p class="pfmut">Sem posições.</p>';
      const ae = pfScoreCart(V);
      return `<div class="pfsc">${Xe.map(([ee, le, Y]) => {
        const q = ae.D[ee],
          L = Object.values(q).reduce((ne, Ee) => ne + Ee, 0) || 1,
          F = ["bom", "neutro", "ruim", "sem", "na"],
          O = ae.pior[ee];
        return `<div class="pfscd"><div class="pfsch"><b>${le}</b><span class="pfsm pfmut">cobertura ${ae.cob[ee] != null ? Math.round(ae.cob[ee]) + "%" : "—"}</span></div><div class="pfstk">${F.filter(
          (ne) => q[ne],
        )
          .map(
            (ne) =>
              `<i class="${Y[ne][1]}" style="width:${(q[ne] / L) * 100}%" title="${Y[ne][0]} ${y(q[ne])}%"></i>`,
          )
          .join("")}</div><div class="pfscl">${F.filter((ne) => q[ne])
          .map(
            (ne) =>
              `<span><i class="${Y[ne][1]}"></i>${Y[ne][0]} ${y(q[ne])}%</span>`,
          )
          .join(
            "",
          )}</div><p class="pfsm">${O ? `Maior peso em “${Y.ruim ? Y.ruim[0] : ""}”: <b>${esc(O.tk)}</b> (${y(O.peso)}%) — ${esc(O.txt)}` : "Nenhuma posição em estado desfavorável."}</p></div>`;
      }).join(
        "",
      )}</div><p class="pfnota">Quatro dimensões independentes, sem nota única: cada ativo recebe estado, justificativa e cobertura (abra um ativo para ver).</p>`;
    }
    function ze(V) {
      const ae = e.amb;
      let ee = `<div class="pfbar2"><div class="pfchs">${Ve("pos", ae, "Posições (" + V.pos.length + ")", "amb")}${Ve("wl", ae, "Watchlist (" + m().filter((le) => !le.virou).length + ")", "amb")}${Ve("mov", ae, "Movimentações (" + c().length + ")", "amb")}</div><div class="pfrow"><button class="pfbt pfam" data-pf="form|C">${he(we.mais, 15)} Movimentação</button><button class="pfbt" data-pf="form|W">${he(we.mais, 15)} Watchlist</button></div></div>`;
      if (ae === "pos")
        ((ee += `<section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th>Classe</th><th class="n">Qtd</th><th class="n">Preço médio</th><th class="n">Custo</th><th class="n">Preço atual</th><th class="n">Valor (R$)</th><th class="n">Resultado</th><th class="n">Rent.</th><th class="n">Proventos</th><th class="n">Peso</th><th class="n">Dia</th><th>1ª compra</th></tr></thead><tbody>${V.pos.map((le) => `<tr data-pf="sel|${le.k}" tabindex="0"><td><b>${esc(le.tk)}</b><em>${esc(le.nome || le.setor)}</em></td><td><span class="pfcl" style="--c:${s[le.cl]}">${esc(o[le.cl] || le.cl)}</span></td><td class="n">${Me(le.q)}</td><td class="n">${se(le, le.pm)}</td><td class="n">${I(le.custo)}${le.mk === "US" ? `<em>${J(le.c)}</em>` : ""}</td><td class="n">${le.tem ? se(le, le.pa) : '<span class="pfmut" title="sem cotação: usando o preço médio">—</span>'}</td><td class="n">${I(le.v)}${le.mk === "US" ? `<em>${J(le.q * le.pa)}</em>` : ""}</td><td class="n ${Pe(le.lu)}">${I(le.lu)}</td><td class="n ${Pe(le.pc)}">${Ie(le.pc)}</td><td class="n">${le.provR ? I(le.provR) : "—"}</td><td class="n">${y(le.peso)}%</td><td class="n ${Pe(le.d1)}">${Ie(le.d1)}</td><td>${ue(le.first)}</td></tr>`).join("") || '<tr><td colspan="13" class="pfmut">Nenhuma posição.</td></tr>'}</tbody></table></div></section>`),
          V.fech.length &&
            (ee += Se(
              "Posições encerradas",
              `<div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th class="n">Resultado das vendas</th><th class="n">Proventos</th></tr></thead><tbody>${V.fech.map((le) => `<tr><td>${esc(le.tk)}</td><td class="n ${Pe(le.real)}">${se(le, le.real)}</td><td class="n">${se(le, le.prov)}</td></tr>`).join("")}</tbody></table></div>`,
            )));
      else if (ae === "wl") {
        const le = m().filter((Y) => !Y.virou);
        ee += `<section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th class="n">Cotação</th><th class="n">Dia</th><th>Tendência</th><th class="n">RSI</th><th>MM200</th><th>Fundamentos</th><th class="n">Alertas</th><th>Última IA</th><th></th></tr></thead><tbody>${
          le
            .map((Y) => {
              const q = { ...Y, k: Y.mk + ":" + Y.tk },
                L = p(q),
                F = pfTec(q),
                O = (g()[Y.tk] || {}).fs,
                ne = r(Y.cl),
                Ee = pfUltRel(Y.tk),
                Ae = v().filter(
                  (je) => je.tk === Y.tk && je.sit === "novo",
                ).length,
                ge =
                  ne === "acao" && O
                    ? `P/L ${y(O.pl)} · DY ${y(O.dy)}% · ROE ${y(O.roe)}%`
                    : ne === "fii" && O
                      ? `DY ${y(O.dy)}% · P/VP ${j(O.pvp)}`
                      : ne === "acao" || ne === "fii"
                        ? "carregando…"
                        : "não se aplica";
              return `<tr data-pf="sel|${q.k}" tabindex="0"><td><b>${esc(Y.tk)}</b><em>${esc(o[Y.cl] || Y.cl)}${Y.nota ? " · " + esc(Y.nota) : ""}</em></td><td class="n">${L ? se(q, L.p) : "—"}</td><td class="n ${Pe(L && L.d1)}">${Ie(L && L.d1)}</td><td>${F ? `<span class="pftd ${F.tend}">${F.tend}</span>` : "—"}</td><td class="n">${F && F.rsi != null ? y(F.rsi) : "—"}</td><td>${F && F.m200 != null ? (F.px > F.m200 ? "acima" : "abaixo") : "—"}</td><td class="pfsm">${ge}</td><td class="n">${Ae || "—"}</td><td class="pfsm">${Ee ? ue(Ee.ref) + " · " + esc((Ee.conteudo.tecnica || {}).tendencias ? Ee.conteudo.tecnica.tendencias.curto : "") : "—"}</td><td><button class="pfbt pfmini" data-pf="virar|${esc(Y.tk)}">Virar posição</button><button class="pfbt pfmini" data-pf="wlrm|${esc(Y.tk)}" aria-label="remover">${he(we.x, 12)}</button></td></tr>`;
            })
            .join("") ||
          '<tr><td colspan="10" class="pfmut">Nenhum ativo na watchlist.</td></tr>'
        }</tbody></table></div></section><p class="pfnota">Acompanhe sem ter posição. “Virar posição” registra a compra e mantém o histórico de análises e alertas do ativo.</p>`;
      } else ee += Re(c().slice().reverse(), !0);
      return ee;
    }
    const Ue = {
        C: "Compra",
        V: "Venda",
        P: "Provento",
        A: "Aporte",
        R: "Retirada",
        E: "Evento corporativo",
      },
      We = { desd: "Desdobramento", grup: "Grupamento", bonif: "Bonificação" };
    function Re(V, ae) {
      return `<section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Data</th><th>Tipo</th><th>Ativo</th><th class="n">Qtd</th><th class="n">Preço / valor</th><th class="n">Custos</th><th>Detalhe</th>${ae ? "<th></th>" : ""}</tr></thead><tbody>${V.map((ee) => `<tr><td>${ue(ee.d)}</td><td><span class="pfmv ${ee.tp}">${Ue[ee.tp] || ee.tp}</span></td><td>${esc(ee.tk || "—")}</td><td class="n">${k(ee.q) ? Me(k(ee.q)) : "—"}</td><td class="n">${ee.tp === "E" ? (ee.ev === "bonif" ? y(k(ee.f)) + "%" : "fator " + j(k(ee.f))) : ee.mk === "US" ? J(k(ee.p)) : I(k(ee.p))}</td><td class="n">${k(ee.cs) ? I(k(ee.cs)) : "—"}</td><td class="pfsm">${(ee.tp === "E" && We[ee.ev]) || ""}${ee.sub ? esc(ee.sub) : ""}${ee.nota ? " " + esc(ee.nota) : ""}${ee.src ? " · importado das notas" : ""}</td>${ae ? `<td><button class="pfbt pfmini pflixo" data-pf="del|${ee.id}" aria-label="Excluir movimentação" title="Excluir movimentação">${he(we.lixo, 14)}</button></td>` : ""}</tr>`).join("") || '<tr><td colspan="8" class="pfmut">Nenhuma movimentação.</td></tr>'}</tbody></table></div></section>`;
    }
    function K() {
      let V = !1;
      try {
        V = /EDT/.test(
          new Date().toLocaleString("en-US", {
            timeZone: "America/New_York",
            timeZoneName: "short",
          }),
        );
      } catch {}
      return V ? 1020 : 1080;
    }
    const pe = (V) =>
      String(Math.floor(V / 60)).padStart(2, "0") +
      ":" +
      String(V % 60).padStart(2, "0");
    function Q(V) {
      const ae = x(),
        ee = K(),
        le = ee + (+ae.off || 20),
        Y = e.cfgRemoto && e.cfgRemoto.estado;
      e.cfgLido ||
        ((e.cfgLido = 1),
        pfCfgLe().then(() => {
          tab === "carteiras" && render();
        }));
      let q = `<div class="pfg pfg3">${Se(
        "Relatório automático",
        `<label class="pftg"><input type="checkbox" data-pfi="relon"${ae.on ? " checked" : ""}> Gerar todo dia útil, depois do fechamento</label>
    <label class="pfsm">Folga depois do fechamento <select data-pfi="reloff">${[10, 20, 30, 45, 60].map((L) => `<option value="${L}"${(+ae.off || 20) === L ? " selected" : ""}>${L} min</option>`).join("")}</select></label>
    <p class="pfsm">Hoje a B3 fecha às <b>${pe(ee)}</b> ${ee === 1080 ? "(Nova York fora do horário de verão)" : "(Nova York no horário de verão)"} → relatório às <b>${pe(le)}</b>.${le > 1050 ? " Fica depois da janela de 16h30 a 17h30 porque antes disso os preços do dia ainda não fecharam." : ""}</p>
    <p class="pfnota">Cada ativo só ganha relatório novo quando algo relevante mudou (preço ±3%, tendência, RSI, fundamentos, notícias, resultado) ou depois de 7 dias; os outros reaproveitam o último. Aviso no celular quando ficar pronto (com as notificações ligadas).</p>
    ${Y && Y.ref ? `<p class="pfsm">Rodada de ${ue(Y.ref)}: ${Y.feitos.length} novo(s), ${Y.reap.length} sem mudança${Y.falhas.length ? ", " + Y.falhas.length + " falha(s)" : ""}${Y.cons ? " · consolidado pronto" : Y.erro_cons ? " · consolidado: " + esc(Y.erro_cons) : ""}.</p>` : ""}${e.cfgErr ? `<p class="pfsm dn">${esc(e.cfgErr)}</p>` : ""}`,
      )}
    ${Se("Gerar agora", `<button class="pfbt pfam pfw" data-pf="cons"${e.busy ? " disabled" : ""}>Relatório consolidado da carteira</button><button class="pfbt pfw" data-pf="rodada"${e.busy ? " disabled" : ""}>Rodada completa (ativos com mudança + consolidado)</button><p class="pfnota">Cada relatório gerado conta uma análise do seu limite diário de IA. Os ativos sem mudança relevante não gastam.</p>`)}
    ${Se("Como a IA trabalha", '<p class="pfsm"><b class="pfF">Fatos</b> só com números que vieram dos dados (o servidor confere cada número). <b class="pfI">Interpretações</b> são a leitura do analista. <b class="pfH">Hipóteses</b> dizem o que confirma e o que invalida.</p><p class="pfsm">Indicador sem dado aparece como “sem dado”; indicador que não se aplica à classe (P/L em ETF, cripto, renda fixa) não é usado. Sem recomendação de compra ou venda.</p>')}</div>`;
      if (
        ((q += `<div class="pfchs">${Ve("cons", e.ia, "Consolidado", "iasub")}${Ve("ativos", e.ia, "Por ativo", "iasub")}${Ve("lista", e.ia, "Todos os relatórios", "iasub")}${Ve("ferr", e.ia, "Ferramentas clássicas", "iasub")}</div>`),
        e.ia === "cons")
      ) {
        const L = pfUltCons();
        q += L
          ? `<section class="pfc">${be(L, !0)}</section>`
          : `<section class="pfc"><p class="pfmut">${e.relBusy ? "Carregando…" : e.relErr ? esc(e.relErr) : "Nenhum relatório consolidado ainda. Gere agora ou ligue o agendamento."}</p></section>`;
      } else if (e.ia === "ativos") {
        const L = V.pos
          .map((F) => ({ o: F, pos: 1 }))
          .concat(
            m()
              .filter((F) => !F.virou && !V.pos.some((O) => O.tk === F.tk))
              .map((F) => ({
                o: { ...F, k: F.mk + ":" + F.tk, q: 0 },
                pos: 0,
              })),
          );
        q += `<section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th>Último relatório</th><th>Curto</th><th>Médio</th><th>Longo</th><th>Validação</th><th>Reavaliar?</th><th></th></tr></thead><tbody>${
          L.map(({ o: F, pos: O }) => {
            const ne = pfUltRel(F.tk),
              Ee = ne && ne.conteudo.tecnica && ne.conteudo.tecnica.tendencias,
              Ae = e.busy === "rel:" + F.tk,
              ge = (je) => (je ? `<span class="pftd ${je}">${je}</span>` : "—");
            return `<tr><td><b>${esc(F.tk)}</b><em>${O ? "posição" : "watchlist"} · ${esc(o[F.cl] || F.cl)}</em></td><td>${ne ? ve(ne.gerado) + (ne.meta && ne.meta.origem === "agendado" ? " · agendado" : "") : "—"}</td><td>${ge(Ee && Ee.curto)}</td><td>${ge(Ee && Ee.medio)}</td><td>${ge(Ee && Ee.longo)}</td><td>${ne ? Ke(ne.validacao) : "—"}</td><td>${ne && ne.conteudo.reavaliar && ne.conteudo.reavaliar.sim ? '<span class="pfst r">Sim</span>' : ne ? "Não" : "—"}</td><td class="pfnw">${["tesouro", "rf", "outro"].includes(F.cl) ? '<span class="pfsm pfmut">sem cotação pública</span>' : `<button class="pfbt pfmini" data-pf="gera|${F.k}|${O}"${e.busy ? " disabled" : ""}>${Ae ? "Gerando…" : ne ? "Atualizar" : "Gerar"}</button>${ne ? `<button class="pfbt pfmini" data-pf="gera|${F.k}|${O}|1"${e.busy ? " disabled" : ""}>Refazer mesmo assim</button><button class="pfbt pfmini" data-pf="rv|${ne.id}">Ler</button>` : ""}`}</td></tr>`;
          }).join("") ||
          '<tr><td colspan="8" class="pfmut">Sem ativos.</td></tr>'
        }</tbody></table></div></section>`;
      } else
        e.ia === "lista"
          ? (q += re(e.rel || []))
          : (q += `<section class="pfc"><p class="pfsm">As análises de antes continuam aqui, do mesmo jeito: técnica com pivôs e Fibonacci, fundamentalista com valuation, posições abertas do diário e leitura de foto do gráfico.</p><div class="pfrow">${[
              ["tec", "Técnica"],
              ["fun", "Fundamentalista"],
              ["pos", "Posições abertas"],
              ["img", "Foto do gráfico"],
            ]
              .map(
                ([L, F]) =>
                  `<button class="pfbt" data-pf="ferr|${L}">${F}</button>`,
              )
              .join("")}</div></section>`);
      return q;
    }
    function re(V) {
      return `<section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Gerado</th><th>Tipo</th><th>Ativo</th><th>Referência</th><th>Validação</th><th>Origem</th><th>Modelo</th><th></th></tr></thead><tbody>${V.map((ae) => `<tr><td>${ve(ae.gerado)}</td><td>${ae.tipo === "consolidado" ? "Consolidado" : "Individual"}</td><td>${esc(ae.tk || "Carteira")}</td><td>${ue(ae.ref)}</td><td>${Ke(ae.validacao)}</td><td>${ae.meta && ae.meta.origem === "agendado" ? "agendado" : "pedido no app"}</td><td class="pfsm">${esc(ae.modelo || "")}</td><td><button class="pfbt pfmini" data-pf="rv|${ae.id}">Ler</button></td></tr>`).join("") || `<tr><td colspan="8" class="pfmut">${e.relErr ? esc(e.relErr) : "Nenhum relatório ainda."}</td></tr>`}</tbody></table></div></section>`;
    }
    const ie = [
        ["resumo_executivo", "Resumo executivo"],
        ["desempenho", "Desempenho"],
        ["tecnica", "Análise técnica"],
        ["fundamentos", "Fundamentos (ou análise específica da classe)"],
        ["noticias_eventos", "Notícias e eventos"],
        ["riscos", "Riscos"],
        ["comparacao_historica", "Comparação histórica"],
      ],
      R = [
        ["resumo_executivo", "Resumo executivo"],
        ["desempenho", "Desempenho geral"],
        ["distribuicao", "Distribuição patrimonial"],
        ["setores", "Concentração por setor"],
        ["tecnica_consolidada", "Análise técnica consolidada"],
        ["fundamentos_consolidados", "Análise fundamentalista consolidada"],
        ["exposicao_macro", "Exposição macroeconômica"],
        ["riscos", "Principais riscos"],
        ["destaques", "Destaques positivos e negativos"],
        ["mudancas", "Mudanças desde o relatório anterior"],
        ["conclusao", "Conclusão analítica"],
      ],
      z = { confirmada: "g", contrariada: "r", "em aberto": "b" };
    function oe(V, ae, ee) {
      if (!ee) return "";
      const le = (q, L, F) =>
        q && q.length
          ? `<div class="pfsb ${L}"><h5>${F}</h5><ul>${q.map((O) => `<li>${esc(O)}</li>`).join("")}</ul></div>`
          : "";
      let Y =
        le(ee.fatos, "pfF", "Fatos") +
        le(ee.interpretacoes, "pfI", "Interpretações") +
        le(ee.hipoteses, "pfH", "Hipóteses");
      return (
        ee.tendencias &&
          (Y =
            `<div class="pftds">${["curto", "medio", "longo"].map((q) => `<span>${q === "medio" ? "Médio" : q[0].toUpperCase() + q.slice(1)} prazo <b class="pftd ${ee.tendencias[q]}">${ee.tendencias[q]}</b></span>`).join("")}</div>` +
            Y),
        V === "destaques" &&
          (Y =
            le(ee.positivos, "pfF", "Positivos") +
            le(ee.negativos, "pfH", "Negativos")),
        ["melhorou", "piorou", "mudancas_de_tendencia", "novos_riscos"].forEach(
          (q) => {
            ee[q] &&
              ee[q].length &&
              (Y += le(
                ee[q],
                q === "melhorou" ? "pfF" : q === "piorou" ? "pfH" : "pfI",
                {
                  melhorou: "O que melhorou",
                  piorou: "O que piorou",
                  mudancas_de_tendencia: "Mudanças de tendência",
                  novos_riscos: "Novos riscos",
                }[q],
              ));
          },
        ),
        ee.hipoteses_anteriores &&
          ee.hipoteses_anteriores.length &&
          (Y += `<div class="pfsb"><h5>Hipóteses anteriores</h5>${ee.hipoteses_anteriores.map((q) => `<p class="pfha"><span class="pfst ${z[q.situacao] || "b"}">${esc(q.situacao)}</span> ${esc(q.hipotese)}${q.evidencia ? ` <em>— ${esc(q.evidencia)}</em>` : ""}</p>`).join("")}</div>`),
        ee.reavaliar &&
          Array.isArray(ee.reavaliar) &&
          ee.reavaliar.length &&
          (Y += `<div class="pfsb pfH"><h5>Ativos para reavaliar</h5><ul>${ee.reavaliar.map((q) => `<li><b>${esc(q.tk)}</b> — ${esc(q.motivo)}</li>`).join("")}</ul></div>`),
        Y ? `<section class="pfrs"><h4>${ae}</h4>${Y}</section>` : ""
      );
    }
    function me(V) {
      const ae = V?.dados || {},
        le = (
          V?.tipo === "ativo"
            ? [
                {
                  ticker: V.tk,
                  periodo: ae.fundamentos?.data_ultimo_trimestre_na_fonte,
                  moeda: ae.fundamentos?.moeda_contabil,
                  dados_trimestrais:
                    ae.fundamentos?.balancos_trimestrais_disponiveis,
                },
              ]
            : Array.isArray(ae.balancos_trimestrais_da_fonte)
              ? ae.balancos_trimestrais_da_fonte
              : []
        )
          .filter((O) => O && O.ticker)
          .map((O) => {
            const Ae =
              (Array.isArray(O.dados_trimestrais) ? O.dados_trimestrais : [])
                .filter(
                  (ge) =>
                    ge &&
                    /^\d{4}-\d{2}-\d{2}$/.test(String(ge.periodo || "")) &&
                    (Number.isFinite(ge.receita) || Number.isFinite(ge.lucro)),
                )
                .sort((ge, je) => je.periodo.localeCompare(ge.periodo))[0] ||
              null;
            return {
              tk: String(O.ticker),
              q: Ae,
              moeda: O.moeda || Ae?.moeda || null,
            };
          }),
        Y = (O, ne) =>
          Number.isFinite(O)
            ? (ne === "BRL" ? "R$ " : ne === "USD" ? "US$ " : "") +
              (Math.abs(O) >= 1e9
                ? (O / 1e9).toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  }) + " bi"
                : Math.abs(O) >= 1e6
                  ? (O / 1e6).toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    }) + " mi"
                  : O.toLocaleString("pt-BR", { maximumFractionDigits: 0 }))
            : "sem dado",
        q = (O) => {
          if (!O) return "Não confirmado";
          const ne = +O.periodo.slice(5, 7),
            Ee = O.periodo.slice(2, 4);
          return (
            Math.ceil(ne / 3) +
            "T" +
            Ee +
            " · " +
            O.periodo.slice(8, 10) +
            "/" +
            O.periodo.slice(5, 7) +
            "/" +
            O.periodo.slice(0, 4)
          );
        },
        L = le.some((O) => O.q),
        F = le
          .map(
            (O) =>
              `<tr><td><b>${esc(O.tk)}</b></td><td>${esc(q(O.q))}</td><td>${esc(Y(O.q?.receita, O.moeda))}</td><td>${esc(Y(O.q?.lucro, O.moeda))}</td></tr>`,
          )
          .join("");
      return `<section class="pfrs" style="border-left:4px solid #2e8a5c;background:var(--card,transparent);padding:14px;margin:12px 0"><h4 style="margin:0 0 8px">Últimos resultados trimestrais disponíveis</h4>${F && L ? `<div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th>Último trimestre</th><th>Receita</th><th>Lucro</th></tr></thead><tbody>${F}</tbody></table></div>` : "<p>Sem resultados trimestrais nesta versão do relatório. A tabela anual até 2025 não comprova atualização contábil até 2026.</p>"}<p class="pfnota">Fonte: Yahoo Finance, séries trimestrais secundárias salvas no relatório. Data = encerramento do trimestre, não divulgação. Não é validação automática do último documento oficial na CVM/RI. O histórico anual de 2025 permanece abaixo apenas como comparação.</p></section>`;
    }
    function be(V, ae) {
      V = window.DiarioRelatorios?.capture("carteira", V).conteudo || V;
      const ee = V.conteudo || {},
        le = V.validacao || {},
        Y = V.tipo === "ativo",
        q = ee.identificacao || {};
      let L = `<div class="pfrh"><div><h3>${Y ? `Relatório individual · ${esc(V.tk)}` : "Relatório consolidado da carteira"}</h3><p class="pfsm pfmut">Referência ${ue(V.ref)} · gerado ${ve(V.gerado)} · dados até ${esc(V.dados_em || "—")} · edição ${esc(V.exec_id || V.id || "sem identificador")}</p></div>${Ke(le)}</div>`;
      return (
        (L += me(V)),
        Y &&
          (L += `<section class="pfrs"><h4>1. Identificação</h4><p class="pfsm">${esc(q.ticker || V.tk)} · ${esc(q.nome || "")} · ${esc(q.classe || "")} · ${esc(q.mercado || "")} · ${esc(q.moeda || "")}</p></section>`),
        (L += (Y ? ie : R)
          .map(([F, O], ne) => oe(F, (Y ? ne + 2 : ne + 1) + ". " + O, ee[F]))
          .join("")),
        Y &&
          ((ee.monitorar || []).length &&
            (L += `<section class="pfrs"><h4>9. Pontos de monitoramento</h4><ul>${ee.monitorar.map((F) => `<li>${esc(F)}</li>`).join("")}</ul></section>`),
          ee.reavaliar &&
            ee.reavaliar.sim &&
            (L += `<p class="pfwa">! Reavaliar: ${esc(ee.reavaliar.motivo)}</p>`)),
        (L += `<section class="pfrs pfmeta"><h4>${Y ? "10. " : ""}Fontes e rastreabilidade</h4><p class="pfsm"><b>Fontes:</b> ${(V.fontes || []).map(esc).join(" · ") || "—"}</p><p class="pfsm"><b>Modelo:</b> ${esc(V.modelo || "—")} · <b>Prompt:</b> ${esc(V.prompt_ver || "—")} · <b>Execução:</b> <code>${esc(V.exec_id || "—")}</code> · <b>Origem:</b> ${V.meta && V.meta.origem === "agendado" ? "agendamento" : "pedido no app"}</p>${V.meta && (V.meta.motivos || []).length ? `<p class="pfsm"><b>Por que foi refeito:</b> ${V.meta.motivos.map(esc).join("; ")}</p>` : ""}${V.meta && (V.meta.reaproveitados || []).length ? `<p class="pfsm"><b>Ativos sem mudança relevante (relatório anterior mantido):</b> ${V.meta.reaproveitados.map(esc).join(", ")}</p>` : ""}
    <p class="pfsm"><b>Validação:</b> ${esc((ot[le.estado] || ["—"])[0])} · ${le.conferidos || 0} números conferidos</p>${(le.problemas || []).length ? `<ul class="pfprob">${le.problemas.map((F) => `<li>${esc(F)}</li>`).join("")}</ul>` : ""}${(le.lacunas || []).length ? `<p class="pfsm"><b>Lacunas:</b> ${le.lacunas.map(esc).join("; ")}</p>` : ""}<p class="pfnota">Conteúdo gerado por IA a partir de dados de terceiros (com atraso). Não é recomendação de investimento.</p></section>`),
        ae &&
          (L += `<div class="pfrow"><button class="pfbt pfam" data-pf="rv|${V.id}">Abrir em tela cheia</button></div>`),
        L
      );
    }
    function X(V) {
      const ae = perfCalc();
      if (!ae)
        return `<section class="pfc"><p class="pfmut">${c().length ? (e.histBusy ? "Buscando o histórico de cotações…" : qe() || "O desempenho aparece quando o histórico de cotações chegar.") : "Registre movimentações para ver o desempenho."}</p></section>`;
      const ee = perfPer(ae, e.per),
        le = ee.i0,
        Y = ae.D.slice(le),
        q = (te) =>
          te
            ? te
                .slice(le)
                .map((_) => (_ != null && te[le] ? (_ / te[le]) * 100 : null))
            : null,
        L = (te, _, ye) =>
          `<div class="pfk"><span>${te}</span><b class="${ye || ""}">${_}</b></div>`,
        F = c()
          .filter((te) => te.tp === "P" && te.d >= ee.de && te.d <= ee.ate)
          .reduce(
            (te, _) =>
              te +
              ((k(_.q) ? k(_.p) * k(_.q) : k(_.p)) - k(_.cs)) *
                (_.mk === "US" ? V.fx || 0 : 1),
            0,
          );
      let O = `<div class="pfbar2">${Je()}<span class="pfsm pfmut">${ue(ee.de)} a ${ue(ee.ate)} · ${ee.dias} pregão(ões)</span></div><div class="pfks">${L("Rentabilidade", Ie(ee.ret), Pe(ee.ret))}${L("Ibovespa", Ie(ee.ib), Pe(ee.ib))}${L("CDI", Ie(ee.cdi), Pe(ee.cdi))}${L("S&P 500 em reais", Ie(ee.sp), Pe(ee.sp))}${L("Volatilidade anualizada", ee.vol != null ? y(ee.vol) + "%" : "—")}${L("Queda máxima", Ie(ee.dd, 1), ee.dd < 0 ? "dn" : "")}${L("Resultado no período", I(ee.pnl), Pe(ee.pnl))}${L("Proventos no período", I(F))}</div>`;
      const ne = [];
      let Ee = -1e18;
      (ae.I.slice(le).forEach((te) => {
        ((Ee = Math.max(Ee, te)), ne.push((te / Ee - 1) * 100));
      }),
        (O += `<div class="pfg pfg3">${Se(
          "Carteira × índices (base 100)",
          Ge(
            [
              { nome: "Carteira", v: q(ae.I), cor: "#cfab69", w: 2.4 },
              { nome: "Ibovespa", v: q(ae.ib), cor: "#709bc2" },
              { nome: "CDI", v: q(ae.cdi), cor: "#9ca0a9", dash: 1 },
              { nome: "S&P 500 (R$)", v: q(ae.sp), cor: "#ad853a" },
            ],
            Y,
            { ano: 1, titulo: "comparação" },
          ),
          "",
          "pfs2",
        )}${Se("Queda a partir do topo (drawdown)", Ge([{ nome: "Drawdown", v: ne, cor: "#e7614c" }], Y, { zero: 1, fmt: (te) => y(te) + "%", ano: 1, w: 420, h: 300 }))}</div>`));
      const Ae = pfPerMeses(ae),
        ge = [...new Set(Ae.map((te) => te.m.slice(0, 4)))].sort().reverse(),
        je = [
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
        Ze = (te) =>
          te == null
            ? ""
            : `background:${te >= 0 ? `rgba(34,197,94,${Math.min(0.55, 0.08 + Math.abs(te) / 14)})` : `rgba(239,68,68,${Math.min(0.55, 0.08 + Math.abs(te) / 14)})`}`,
        He = (te, _) => {
          const ye = Ae.filter((Oe) => Oe.m.startsWith(te) && Oe[_] != null);
          return ye.length
            ? (ye.reduce((Oe, De) => Oe * (1 + De[_] / 100), 1) - 1) * 100
            : null;
        };
      O += Se(
        "Rentabilidade mês a mês (cota)",
        `<div class="pftw"><table class="pft pfhm"><thead><tr><th>Ano</th>${je.map((te) => `<th class="n">${te}</th>`).join("")}<th class="n">Ano</th><th class="n">Ibovespa</th><th class="n">CDI</th></tr></thead><tbody>${ge
          .map(
            (te) =>
              `<tr><td><b>${te}</b></td>${je
                .map((_, ye) => {
                  const Oe = Ae.find(
                    (De) => De.m === te + "-" + String(ye + 1).padStart(2, "0"),
                  );
                  return `<td class="n" style="${Ze(Oe && Oe.r)}">${Oe ? y(Oe.r) : ""}</td>`;
                })
                .join(
                  "",
                )}<td class="n"><b class="${Pe(He(te, "r"))}">${Ie(He(te, "r"), 1)}</b></td><td class="n">${Ie(He(te, "ib"), 1)}</td><td class="n">${Ie(He(te, "cdi"), 1)}</td></tr>`,
          )
          .join(
            "",
          )}</tbody></table></div><p class="pfnota">O primeiro mês conta a partir da primeira compra.</p>`,
      );
      const ce = Object.values(ee.contrib).reduce((te, _) => te + _.pnl, 0),
        E = Object.entries(ee.contrib)
          .filter(([, te]) => Math.abs(te.pnl) > 0.005 || te.prov)
          .sort((te, _) => _[1].pnl - te[1].pnl),
        P = {};
      (E.forEach(([te, _]) => {
        P[_.cl] = (P[_.cl] || 0) + _.pnl;
      }),
        (O += `<div class="pfg pfg3">${Se("Resultado e contribuição por ativo", `<div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th class="n">Resultado (R$)</th><th class="n">dos quais proventos</th><th class="n">Contribuição</th></tr></thead><tbody>${E.map(([te, _]) => `<tr><td>${esc(te.split(":")[1])}</td><td class="n ${Pe(_.pnl)}">${I(_.pnl)}</td><td class="n">${_.prov ? I(_.prov) : "—"}</td><td class="n">${ce ? y((_.pnl / Math.abs(ce)) * 100) + "%" : "—"}</td></tr>`).join("") || '<tr><td colspan="4" class="pfmut">—</td></tr>'}</tbody></table></div>`, "", "pfs2")}${Se(
          "Resultado por classe",
          Qe(
            Object.entries(P)
              .sort((te, _) => _[1] - te[1])
              .map(([te, _]) => ({
                nome: o[te] || te,
                v: _,
                cor: _ >= 0 ? "#3aad74" : "#e7614c",
              })),
            I,
          ),
        )}</div>`));
      const B = {};
      c()
        .filter((te) => te.tp === "P")
        .forEach((te) => {
          const _ = te.d.slice(0, 7);
          B[_] =
            (B[_] || 0) +
            ((k(te.q) ? k(te.p) * k(te.q) : k(te.p)) - k(te.cs)) *
              (te.mk === "US" ? V.fx || 0 : 1);
        });
      const G = Object.keys(B).sort().slice(-12);
      return (
        (O += Se(
          "Proventos por mês (últimos 12 com pagamento)",
          G.length
            ? Qe(
                G.map((te) => ({
                  nome: te.slice(5) + "/" + te.slice(2, 4),
                  v: B[te],
                  cor: "#cfab69",
                })),
                I,
              )
            : '<p class="pfmut">Nenhum provento registrado.</p>',
        )),
        (O += `<p class="pfnota">Método: cota diária (TWR). Compras e vendas são fluxos e não contam como ganho; proventos contam; ativos em dólar usam o câmbio de cada dia; eventos corporativos ajustam a quantidade. Renda fixa sem cotação pública entra pelo custo. ${ae.falhas.length ? "Sem histórico: " + ae.falhas.map(esc).join(", ") + "." : ""} Fonte: ${esc(ae.fonte || "")}.</p>`),
        O
      );
    }
    function xe(V) {
      const ae = f(),
        ee = e.rf || "novo",
        le = v()
          .filter((L) => ee === "todos" || L.sit === ee)
          .sort(
            (L, F) => F.em.localeCompare(L.em) || t.RELV[F.rel] - t.RELV[L.rel],
          ),
        Y = (L, F, O) =>
          `<label class="pfsm">${F}<input type="number" step="any" data-pfi="rc|${L}" value="${ae[L]}">${O || ""}</label>`,
        q = (L, F) =>
          `<label class="pftg"><input type="checkbox" data-pfi="rcb|${L}"${ae[L] ? " checked" : ""}> ${F}</label>`;
      return `<div class="pfg pfg3">${Se("Condições do radar", `<div class="pfrc">${Y("sr", "Perto de suporte/resistência (%)")}${Y("rsiLo", "RSI abaixo de")}${Y("rsiHi", "RSI acima de")}${Y("volX", "Volatilidade (× média)")}${Y("res", "Resultado nos próximos (dias)")}${Y("conc", "Concentração por ativo (%)")}${Y("setor", "Concentração por setor (%)")}</div><div class="pfrc">${q("mm", "Cruzamento de médias")}${q("fund", "Mudanças nos fundamentos")}${q("news", "Notícias relevantes")}${q("ia", "Mudanças na análise da IA")}</div><div class="pfrow"><button class="pfbt pfam" data-pf="radar">Verificar agora</button><span class="pfsm pfmut">${e.radarBusy ? "verificando…" : e.radar ? "última verificação " + hm(e.radar) : ""}</span></div><p class="pfnota">O radar só avisa. Nenhuma ordem é enviada.</p>`, "", "pfs2")}${Se(
        "Resumo",
        [
          ["novo", "Novos"],
          ["visto", "Vistos"],
          ["resolvido", "Resolvidos"],
        ]
          .map(
            ([L, F]) =>
              `<p class="pflin"><span>${F}</span><b>${v().filter((O) => O.sit === L).length}</b></p>`,
          )
          .join("") +
          `<p class="pflin"><span>Alta relevância (novos)</span><b class="dn">${v().filter((L) => L.sit === "novo" && L.rel === "alta").length}</b></p>`,
      )}</div>
  <div class="pfchs">${[
    ["novo", "Novos"],
    ["visto", "Vistos"],
    ["resolvido", "Resolvidos"],
    ["todos", "Todos"],
  ]
    .map(([L, F]) => Ve(L, ee, F, "rf"))
    .join("")}</div>
  <section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Ativo</th><th>Horário</th><th>Motivo</th><th>Fonte</th><th>Relevância</th><th>Situação</th><th></th></tr></thead><tbody>${
    le
      .slice(0, 150)
      .map(
        (L) =>
          `<tr><td><b>${esc(L.tk)}</b></td><td>${ve(L.em)}</td><td>${esc(L.motivo)}</td><td class="pfsm">${esc(L.fonte)}</td><td><span class="pfrv ${L.rel === "alta" ? "r" : L.rel === "média" ? "a" : "b"}">${L.rel}</span></td><td><select data-pfi="sit|${esc(L.id)}">${["novo", "visto", "resolvido"].map((F) => `<option${L.sit === F ? " selected" : ""}>${F}</option>`).join("")}</select></td><td class="pfnw">${L.tk !== "Carteira" ? `<button class="pfbt pfmini" data-pf="seltk|${esc(L.tk)}">Abrir</button>` : ""}${L.tipo === "sr" ? `<button class="pfbt pfmini" data-pf="alpx|${esc(L.tk)}|${esc(L.motivo)}">Alerta de preço</button>` : ""}</td></tr>`,
      )
      .join("") || '<tr><td colspan="7" class="pfmut">Nada aqui.</td></tr>'
  }</tbody></table></div></section>`;
    }
    function $e(V) {
      const ae = e.hf,
        ee = [],
        le = (q, L, F, O, ne) =>
          ee.push({ d: q, tipo: L, tit: F, txt: O, extra: ne || "" });
      ((ae === "tudo" || ae === "rel") &&
        (e.rel || []).forEach((q) =>
          le(
            q.gerado,
            "rel",
            q.tipo === "consolidado"
              ? "Relatório consolidado"
              : "Relatório de " + q.tk,
            ((q.conteudo.resumo_executivo &&
              q.conteudo.resumo_executivo.fatos) ||
              [])[0] || "",
            `${Ke(q.validacao)} <button class="pfbt pfmini" data-pf="rv|${q.id}">Ler</button>`,
          ),
        ),
        (ae === "tudo" || ae === "mov") &&
          c()
            .filter((q) => ["C", "V", "A", "R"].includes(q.tp))
            .forEach((q) =>
              le(
                q.d,
                "mov",
                Ue[q.tp] + (q.tk ? " " + q.tk : ""),
                q.tp === "A" || q.tp === "R"
                  ? I(k(q.p))
                  : `${Me(k(q.q))} × ${q.mk === "US" ? J(k(q.p)) : I(k(q.p))}`,
              ),
            ),
        (ae === "tudo" || ae === "ev") &&
          c()
            .filter((q) => q.tp === "E" || q.tp === "P")
            .forEach((q) =>
              le(
                q.d,
                "ev",
                q.tp === "P"
                  ? "Provento " + q.tk
                  : (We[q.ev] || "Evento") + " " + q.tk,
                q.tp === "P"
                  ? I((k(q.q) ? k(q.p) * k(q.q) : k(q.p)) - k(q.cs))
                  : q.ev === "bonif"
                    ? y(k(q.f)) + "% em ações"
                    : "fator " + j(k(q.f)),
              ),
            ),
        (ae === "tudo" || ae === "al") &&
          v().forEach((q) =>
            le(
              q.em,
              "al",
              "Alerta · " + q.tk,
              q.motivo,
              `<span class="pfrv ${q.rel === "alta" ? "r" : q.rel === "média" ? "a" : "b"}">${q.rel}</span> <span class="pfsm pfmut">${q.sit}</span>`,
            ),
          ),
        ae === "hip" &&
          (e.rel || []).forEach((q) => {
            const L = q.conteudo || {},
              F = [];
            (Object.values(L).forEach((O) => {
              O &&
                Array.isArray(O.hipoteses) &&
                O.hipoteses.forEach((ne) => F.push(ne));
            }),
              F.forEach((O) =>
                le(q.gerado, "hip", "Hipótese · " + (q.tk || "carteira"), O),
              ),
              [L.comparacao_historica, L.mudancas].forEach((O) => {
                ((O && O.hipoteses_anteriores) || []).forEach((ne) =>
                  le(
                    q.gerado,
                    "hip",
                    "Avaliação · " + (q.tk || "carteira"),
                    ne.hipotese + (ne.evidencia ? " — " + ne.evidencia : ""),
                    `<span class="pfst ${z[ne.situacao] || "b"}">${esc(ne.situacao)}</span>`,
                  ),
                );
              }));
          }),
        ae === "cmp" &&
          (e.rel || []).forEach((q) => {
            const L = q.conteudo.comparacao_historica || q.conteudo.mudancas;
            if (!L) return;
            const F = [
              ...(L.melhorou || []).map((O) => "↑ " + O),
              ...(L.piorou || []).map((O) => "↓ " + O),
              ...(L.mudancas_de_tendencia || []).map((O) => "↔ " + O),
              ...(L.novos_riscos || []).map((O) => "⚠ " + O),
            ];
            F.length &&
              le(
                q.gerado,
                "cmp",
                "Comparação · " + (q.tk || "carteira"),
                F.join(" · "),
                `<button class="pfbt pfmini" data-pf="rv|${q.id}">Ler</button>`,
              );
          }));
      let Y = `<div class="pfchs">${[
        ["tudo", "Tudo"],
        ["rel", "Relatórios"],
        ["mov", "Alterações de posição"],
        ["ev", "Proventos e eventos"],
        ["al", "Alertas"],
        ["hip", "Hipóteses"],
        ["cmp", "Comparações"],
        ["cot", "Cotações"],
      ]
        .map(([q, L]) => Ve(q, ae, L, "hf"))
        .join("")}</div>`;
      if (ae === "cot") {
        const q = perfCalc(),
          L = (S.cart || {}).snap || {},
          F = q
            ? q.D.map((O, ne) => [O, q.V[ne], q.I[ne]])
                .reverse()
                .slice(0, 260)
            : Object.keys(L)
                .sort()
                .reverse()
                .map((O) => [O, (L[O].BR || {}).v || 0, null]);
        return (
          Y +
          `<section class="pfc"><div class="pftw"><table class="pft"><thead><tr><th>Data</th><th class="n">Patrimônio</th><th class="n">Cota (base 1)</th><th class="n">Dia</th></tr></thead><tbody>${F.map((O, ne) => `<tr><td>${ue(O[0])}</td><td class="n">${I(O[1])}</td><td class="n">${O[2] != null ? O[2].toFixed(4).replace(".", ",") : "—"}</td><td class="n ${Pe(F[ne + 1] && O[2] != null ? O[2] / F[ne + 1][2] - 1 : null)}">${F[ne + 1] && O[2] != null ? Ie((O[2] / F[ne + 1][2] - 1) * 100) : "—"}</td></tr>`).join("")}</tbody></table></div><p class="pfnota">${q ? "Valores reconstruídos com os fechamentos diários (Yahoo) e as suas movimentações." : "Registros diários gravados pelo app."}</p></section>`
        );
      }
      return (
        ee.sort((q, L) => String(L.d).localeCompare(String(q.d))),
        Y +
          `<section class="pfc pftl">${
            ee
              .slice(0, 300)
              .map(
                (q) =>
                  `<div class="pfte ${q.tipo}"><span class="pftd2">${String(q.d).length > 10 ? ve(q.d) : ue(q.d)}</span><div><b>${esc(q.tit)}</b><p>${esc(q.txt)}</p></div><div class="pfnw">${q.extra}</div></div>`,
              )
              .join("") || '<p class="pfmut">Nada registrado ainda.</p>'
          }</section>`
      );
    }
    const fe = (V, ae) =>
      `<div class="pfvt"><button class="pfbt" data-pf="${V}">◀ Voltar</button><b>${esc(ae || "")}</b><button class="pfmx" data-pf="${V}" aria-label="fechar">${he(we.x, 18)}</button></div>`;
    function Fe(V) {
      let ae = "";
      if ((e.sel && (ae += w(V)), e.form && (ae += N()), e.rv)) {
        const ee = (e.rel || []).find((le) => String(le.id) === String(e.rv));
        ee &&
          (ae += `<div class="pfmd" role="dialog" aria-modal="true" data-pfbk="rvx"><div class="pfmb pfprint">${fe("rvx", "Relatório")}${be(ee)}<div class="pfrow"><button class="pfbt" data-pf="print">Imprimir ou salvar em PDF</button><button class="pfbt pfam" data-pf="rvx">◀ Voltar para a carteira</button></div></div></div>`);
      }
      return ae;
    }
    function w(V) {
      const ae = e.sel,
        ee =
          V.pos.find((je) => je.k === ae) ||
          (() => {
            const je = m().find((ce) => ce.mk + ":" + ce.tk === ae),
              [Ze, He] = ae.split(":");
            return je
              ? { ...je, k: ae, q: 0 }
              : { mk: Ze, tk: He, cl: i(He).cl, k: ae, q: 0 };
          })(),
        le = pfTec(ee),
        Y = p(ee),
        q = pfScore({ ...ee, peso: ee.peso || 0 }, V),
        L = g()[ee.tk] || {},
        F = L.fs,
        O = r(ee.cl),
        ne = (e.rel || []).filter((je) => je.tk === ee.tk),
        Ee = c().filter((je) => je.tk === ee.tk),
        Ae = e.modo === "det";
      let ge = `<div class="pfmd" role="dialog" aria-modal="true" data-pfbk="selx"><div class="pfmb">${fe("selx", ee.tk)}
  <div class="pfdh"><div><h2>${esc(ee.tk)} <span class="pfcl" style="--c:${s[ee.cl]}">${esc(o[ee.cl] || ee.cl)}</span></h2><p class="pfsm pfmut">${esc(L.nome || "")} · ${esc(l(ee))} · ${esc(d(ee))} · ${u(ee) ? "US$" : "R$"}</p></div><div class="pfdp"><b>${Y ? (u(ee) ? J(Y.p) : I(Y.p)) : "—"}</b><span class="${Pe(Y && Y.d1)}">${Ie(Y && Y.d1)}</span><em class="pfsm pfmut">${Y ? (Y.src || "") + (Y.atraso ? " · 15 min" : "") + " · " + ve(Y.em || Y.d) : "sem cotação"}</em></div></div>
  <div class="pfchs">${Ve("res", e.modo, "Resumo", "modo")}${Ve("det", e.modo, "Detalhado", "modo")}<span class="pfsep2"></span><button class="pfbt pfmini" data-pf="gera|${ae}|${ee.q ? 1 : 0}"${e.busy ? " disabled" : ""}>${e.busy === "rel:" + ee.tk ? "Gerando…" : ne.length ? "Atualizar relatório IA" : "Gerar relatório IA"}</button><button class="pfbt pfmini" data-pf="term|${esc(ee.tk)}">Abrir no terminal</button>${ee.q ? "" : `<button class="pfbt pfmini" data-pf="virar|${esc(ee.tk)}">Registrar compra</button>`}${!ee.q && !m().some((je) => je.tk === ee.tk && !je.virou) ? `<button class="pfbt pfmini" data-pf="wladd|${esc(ee.tk)}">Watchlist</button>` : ""}${Ee.length ? `<button class="pfbt pfmini pflixo" data-pf="delativo|${esc(ae)}" title="Excluir ativo e movimentações">${he(we.lixo, 14)} Excluir ativo</button>` : ""}</div>
  <div class="pfsc pfsc4">${Xe.map(([je, Ze, He]) => {
    const ce = q[je],
      E = He[ce.est] || ["—", "m"];
    return `<div class="pfscd"><div class="pfsch"><b>${Ze}</b><span class="pfst ${E[1]}">${E[0]}</span></div><p class="pfsm">${esc(ce.txt)}</p><p class="pfsm pfmut">Cobertura ${ce.cob == null ? "—" : Math.round(ce.cob * 100) + "%"}</p></div>`;
  }).join("")}</div>`;
      if (
        (ee.q &&
          (ge += `<div class="pfks pfks6"><div class="pfk"><span>Quantidade</span><b>${Me(ee.q)}</b></div><div class="pfk"><span>Preço médio</span><b>${se(ee, ee.pm)}</b></div><div class="pfk"><span>Custo total</span><b>${I(ee.custo)}</b></div><div class="pfk"><span>Valor de mercado</span><b>${I(ee.v)}</b></div><div class="pfk"><span>Resultado</span><b class="${Pe(ee.lu)}">${I(ee.lu)} (${Ie(ee.pc)})</b></div><div class="pfk"><span>Proventos recebidos</span><b>${I(ee.provR)}</b></div></div>`),
        ["tesouro", "rf", "outro"].includes(ee.cl) &&
          (ge += `<div class="pfc"><label class="pfsm">Preço atual (manual, sem cotação pública)<input type="number" step="any" data-pfi="pxm|${ae}" value="${Y ? Y.p : ""}"></label></div>`),
        le)
      ) {
        const je = le.L,
          Ze =
            e.pg === "3M"
              ? 63
              : e.pg === "6M"
                ? 126
                : e.pg === "2A"
                  ? 500
                  : 252,
          He = je.map((B) => B[4]),
          ce = (B) => a.tec.sma(He, B),
          E = (B) => B.slice(-Ze),
          P = E(
            je.map((B) =>
              typeof B[0] == "number"
                ? new Date(B[0] * (B[0] < 1e11 ? 1e3 : 1))
                    .toISOString()
                    .slice(0, 10)
                : String(B[0]).slice(0, 10),
            ),
          );
        ge += `<section class="pfc"><header><h3>Gráfico histórico</h3><div class="pfchs">${["3M", "6M", "1A", "2A"].map((B) => Ve(B, e.pg, B, "pg")).join("")}</div></header>${Ge(
          [
            { nome: "Preço", v: E(He), cor: "#eae9e6", w: 1.8 },
            { nome: "MM9", v: E(ce(9)), cor: "#cfab69", w: 1.1 },
            { nome: "MM20", v: E(ce(20)), cor: "#709bc2", w: 1.1 },
            { nome: "MM50", v: E(ce(50)), cor: "#afa99d", w: 1.1 },
            { nome: "MM200", v: E(ce(200)), cor: "#e7614c", w: 1.3 },
          ],
          P,
          { h: 250, fmt: (B) => j(B), ano: Ze > 200 },
        )}
    ${Ae ? Ge([{ nome: "RSI 14", v: E(a.tec.rsi(He)), cor: "#ac8439" }], P, { h: 110, fmt: (B) => Math.round(B) + "", leg: 1 }) + H(E(je.map((B) => B[5]))) + "" : ""}</section>`;
      } else
        ["tesouro", "rf", "outro"].includes(ee.cl) ||
          (ge += '<p class="pfmut pfsm">Carregando velas diárias…</p>');
      if (Ae) {
        (le &&
          (ge += Se(
            "Técnica",
            `<div class="pftw"><table class="pft"><tbody>${[
              ["Tendência", le.tend],
              ["MM9 · MM20", j(le.m9) + " · " + j(le.m20)],
              [
                "MM50 · MM200",
                j(le.m50) +
                  " · " +
                  (le.m200 != null ? j(le.m200) : "sem dado (histórico curto)"),
              ],
              ["RSI 14", y(le.rsi)],
              [
                "Volatilidade 20 dias · 12 meses",
                (le.vol20 != null ? y(le.vol20) + "%" : "—") +
                  " · " +
                  (le.vol1a != null ? y(le.vol1a) + "% a.a." : "—"),
              ],
              [
                "ATR (14)",
                le.atr != null ? j(le.atr) + " (" + y(le.atrPct) + "%)" : "—",
              ],
              ["Máxima e mínima de 52 semanas", j(le.h52) + " · " + j(le.l52)],
            ]
              .map(
                ([He, ce]) =>
                  `<tr><td>${He}</td><td class="n">${esc(String(ce))}</td></tr>`,
              )
              .join("")}</tbody></table></div><h4>Suportes e resistências</h4>${
              le.niv
                .filter((He) => /Suporte|Resist/.test(He.tipo))
                .slice(0, 6)
                .map(
                  (He) =>
                    `<p class="pflin"><span>${esc(He.tipo)}</span><b>${j(He.v)}</b><em class="${Pe(He.dist)}">${Ie(He.dist, 1)}</em></p>`,
                )
                .join("") || '<p class="pfmut">—</p>'
            }${le.ev.length ? "<h4>Sinais recentes</h4>" + le.ev.map((He) => `<p class="pfsm">• ${esc(He.t)}</p>`).join("") : ""}`,
          )),
          (ge += Se(
            O === "acao"
              ? "Indicadores fundamentalistas"
              : O === "fii"
                ? "Indicadores do FII"
                : "Análise da classe",
            O === "acao" && F
              ? `<div class="pfkv">${[
                  ["P/L", y(F.pl)],
                  ["P/VP", j(F.pvp)],
                  ["Dividend yield", y(F.dy) + "%"],
                  ["ROE", y(F.roe) + "%"],
                  ["Margem líquida", y(F.ml) + "%"],
                  ["Dívida/PL", j(F.de)],
                  ["Preço-alvo médio", j(F.alvo)],
                  ["Nota dos analistas (1 compra · 5 venda)", y(F.nota)],
                  [
                    "Revisão do LPA (30 dias)",
                    F.rev != null ? Ie(F.rev, 1) : "—",
                  ],
                  ["Crescimento da receita", F.cr != null ? Ie(F.cr, 1) : "—"],
                ]
                  .map(([He, ce]) => `<span>${He}<b>${ce}</b></span>`)
                  .join(
                    "",
                  )}</div><p class="pfnota">TradingView e Yahoo, ${ve(F.em)}. ROIC e fluxo de caixa aparecem no relatório da IA quando a fonte traz.</p>`
              : O === "fii" && F
                ? `<div class="pfkv"><span>Dividend yield<b>${y(F.dy)}%</b></span><span>P/VP<b>${j(F.pvp)}</b></span></div><p class="pfnota">Lucro, margens e endividamento de empresa não se aplicam a FII.</p>`
                : O === "acao" || O === "fii"
                  ? '<p class="pfmut">Carregando…</p>'
                  : `<p class="pfsm">Indicadores fundamentalistas de empresa não se aplicam a ${esc((o[ee.cl] || ee.cl).toLowerCase())}. A leitura usa preço, volatilidade${["etf", "etf_ext"].includes(ee.cl) ? ", o que o fundo replica" : ""} e a posição.</p>`,
          )));
        const je = a.trGet ? a.trGet("noticias", { q: ee.tk }).v : null,
          Ze = e.ntTry || (e.ntTry = {});
        (!je &&
          a.trFn &&
          !["tesouro", "rf", "outro"].includes(ee.cl) &&
          Date.now() - (Ze[ee.tk] || 0) > 5 * 6e4 &&
          ((Ze[ee.tk] = Date.now()),
          a
            .trFn("noticias", { q: ee.tk }, 30 * 6e4)
            .then((He) => {
              He && e.sel === ae && render();
            })
            .catch(() => {})),
          (ge += `<div class="pfg pfg3">${Se(
            "Notícias relevantes",
            je
              ? (je.itens || [])
                  .slice(0, 6)
                  .map(
                    (He) =>
                      `<p class="pfnt"><a href="${esc(He.l)}" target="_blank" rel="noopener">${esc(He.t)}</a><em>${esc(He.f || "")} · ${ve(He.d)}</em></p>`,
                  )
                  .join("") || '<p class="pfmut">Nada nos últimos dias.</p>'
              : '<p class="pfmut">Carregando…</p>',
            "",
            "pfs2",
          )}${Se(
            "Eventos",
            `${L.prox ? `<p class="pflin"><span>Próximo resultado</span><b>${ue(L.prox)}</b></p>` : ""}${
              Ee.filter((He) => He.tp === "P" || He.tp === "E")
                .slice(-8)
                .reverse()
                .map(
                  (He) =>
                    `<p class="pflin"><span>${ue(He.d)} · ${He.tp === "P" ? "Provento" : We[He.ev] || "Evento"}</span><b>${He.tp === "P" ? I((k(He.q) ? k(He.p) * k(He.q) : k(He.p)) - k(He.cs)) : He.ev === "bonif" ? y(k(He.f)) + "%" : "× " + j(k(He.f))}</b></p>`,
                )
                .join("") ||
              (L.prox ? "" : '<p class="pfmut">Nenhum evento registrado.</p>')
            }`,
          )}</div>`),
          (ge += Se("Movimentações", Re(Ee.slice().reverse(), !0))));
      }
      return (
        (ge += Se(
          "Histórico das análises da IA",
          ne.length
            ? ne
                .map(
                  (je) =>
                    `<p class="pflin"><span>${ve(je.gerado)} · ${Ke(je.validacao)}</span><span class="pfsm">${esc(((je.conteudo.resumo_executivo || {}).fatos || [])[0] || "").slice(0, 110)}</span><button class="pfbt pfmini" data-pf="rv|${je.id}">Ler</button></p>`,
                )
                .join("")
            : '<p class="pfmut">Nenhum relatório deste ativo ainda.</p>',
        )),
        ge +
          '<div class="pfrow"><button class="pfbt pfam" data-pf="selx">◀ Voltar para a carteira</button></div></div></div>'
      );
    }
    function H(V) {
      const ae = Math.max(...V, 1),
        ee = 760,
        le = 60,
        Y = ee / V.length;
      return `<svg class="pfsvg" viewBox="0 0 ${ee} ${le}" role="img" aria-label="volume">${V.map((q, L) => `<rect x="${(L * Y).toFixed(1)}" y="${(le - (q / ae) * (le - 4)).toFixed(1)}" width="${Math.max(1, Y - 1).toFixed(1)}" height="${((q / ae) * (le - 4)).toFixed(1)}" fill="#373a3f"/>`).join("")}</svg><div class="pfleg"><span><i style="background:#373a3f"></i>Volume</span></div>`;
    }
    function N() {
      const V = e.form,
        ae = V.tp,
        ee = V.tk ? i(V.tk) : null,
        le = (L, F, O = "number", ne = "") =>
          `<label>${F}<input data-pfi="f|${L}" type="${O}"${O === "number" ? ' step="any" inputmode="decimal"' : ""} value="${esc(V[L] ?? "")}"${ne}></label>`,
        Y = [
          ["C", "Compra"],
          ["V", "Venda"],
          ["P", "Provento"],
          ["E", "Evento corporativo"],
          ["A", "Aporte"],
          ["R", "Retirada"],
          ["W", "Watchlist"],
        ];
      let q = `<div class="pfmd" role="dialog" aria-modal="true" data-pfbk="formx"><div class="pfmb pfmbs">${fe("formx", "Cancelar")}<h2>${ae === "W" ? "Adicionar à watchlist" : "Nova movimentação"}</h2><div class="pfchs">${Y.map(([L, F]) => Ve(L, ae, F, "ftp")).join("")}</div><div class="pfform">`;
      return (
        ae !== "A" &&
          ae !== "R" &&
          (q +=
            le(
              "tk",
              "Ativo (ex.: PETR4, HGLG11, IVVB11, AAPL34, VOO, BTC, Tesouro IPCA 2035)",
              "text",
              ' autocapitalize="characters" autocomplete="off"',
            ) +
            `<label>Classe<select data-pfi="f|cl"><option value="auto"${!V.cl || V.cl === "auto" ? " selected" : ""}>Automática${ee ? " (" + (o[ee.cl] || ee.cl) + ")" : ""}</option>${Object.entries(
              o,
            )
              .map(
                ([L, F]) =>
                  `<option value="${L}"${V.cl === L ? " selected" : ""}>${F}</option>`,
              )
              .join("")}</select></label>`),
        ae !== "W" && (q += le("d", "Data", "date")),
        (ae === "C" || ae === "V") &&
          (q +=
            le("q", "Quantidade") +
            le("p", "Preço unitário (na moeda do ativo)") +
            le("cs", "Custos (corretagem, emolumentos)") +
            le("fx", "Dólar do dia (só ativos dos EUA; opcional)")),
        ae === "P" &&
          (q +=
            `<label>Tipo<select data-pfi="f|sub">${["Dividendo", "JCP", "Rendimento", "Juros", "Outro"].map((L) => `<option${V.sub === L ? " selected" : ""}>${L}</option>`).join("")}</select></label>` +
            le("p", "Valor líquido recebido (total)") +
            le("cs", "IR ou taxas (se não descontados)")),
        ae === "E" &&
          (q +=
            `<label>Evento<select data-pfi="f|ev">${Object.entries(We)
              .map(
                ([L, F]) =>
                  `<option value="${L}"${V.ev === L ? " selected" : ""}>${F}</option>`,
              )
              .join("")}</select></label>` +
            (V.ev === "bonif"
              ? le("f", "Bonificação (% de ações novas)") +
                le("p", "Custo atribuído por ação nova")
              : le(
                  "f",
                  V.ev === "grup"
                    ? "Fator do grupamento (ex.: 10 para 10 → 1)"
                    : "Fator do desdobramento (ex.: 2 para 1 → 2)",
                ))),
        (ae === "A" || ae === "R") && (q += le("p", "Valor (R$)")),
        (q += le("nota", "Anotação (opcional)", "text")),
        (q += `</div>${V.err ? `<p class="pfsm dn">${esc(V.err)}</p>` : ""}<div class="pfrow"><button class="pfbt pfam" data-pf="salva">Salvar</button><button class="pfbt" data-pf="formx">Cancelar</button></div><p class="pfnota">A classe, o mercado (B3, EUA ou cripto), o setor e a moeda são reconhecidos pelo código. Cripto é registrada em reais.</p></div></div>`),
        q
      );
    }
    function W() {
      const V = e.form,
        ae = V.tp,
        ee = String(V.tk || "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, " "),
        le = i(ee),
        Y = V.cl && V.cl !== "auto" ? V.cl : le.cl,
        q = ["acao_ext", "etf_ext"].includes(Y)
          ? "US"
          : Y === "cripto"
            ? "CR"
            : ["acao", "fii", "etf", "bdr", "tesouro", "rf"].includes(Y)
              ? "BR"
              : le.mk;
      if (ae === "W") {
        if (!ee) return ((V.err = "Informe o ativo."), render());
        const F = m();
        return (
          F.some((O) => O.tk === ee && !O.virou) ||
            F.push({
              tk: ee,
              mk: q,
              cl: Y,
              add: loc().slice(0, 10),
              nota: V.nota || "",
            }),
          (e.form = null),
          save(),
          (e.qts = 0),
          (e.radar = 0),
          (e.amb = "wl"),
          render()
        );
      }
      if (ae !== "A" && ae !== "R" && !ee)
        return ((V.err = "Informe o ativo."), render());
      if (!V.d) return ((V.err = "Informe a data."), render());
      if ((ae === "C" || ae === "V") && !(k(V.q) > 0 && k(V.p) > 0))
        return ((V.err = "Informe quantidade e preço."), render());
      if ((ae === "P" || ae === "A" || ae === "R") && !(k(V.p) > 0))
        return ((V.err = "Informe o valor."), render());
      if (ae === "E" && !(k(V.f) > 0))
        return ((V.err = "Informe o fator do evento."), render());
      if (ae === "V") {
        const F = pfCalc().pos.find((O) => O.tk === ee);
        if (!F || F.q + 1e-9 < k(V.q))
          return (
            (V.err = `Você tem ${F ? Me(F.q) : 0} de ${ee}: a venda é maior que a posição.`),
            render()
          );
      }
      const L = {
        id: uid(),
        tp: ae,
        mk: ae === "A" || ae === "R" ? "BR" : q,
        cl: ae === "A" || ae === "R" ? "" : Y,
        tk: ae === "A" || ae === "R" ? "" : ee,
        d: V.d,
        q: ae === "C" || ae === "V" ? String(k(V.q)) : "",
        p: String(k(V.p)),
        cs: String(k(V.cs)),
        nota: V.nota || "",
        u: Date.now(),
      };
      if (
        (ae === "E" && ((L.ev = V.ev || "desd"), (L.f = String(k(V.f)))),
        ae === "P" && (L.sub = V.sub || "Dividendo"),
        k(V.fx) > 0 && (L.fx = String(k(V.fx))),
        ((S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} })).lanc = (
          S.cart.lanc || []
        ).concat(L)),
        V.wl)
      ) {
        const F = m().find((O) => O.tk === ee && !O.virou);
        F && (F.virou = V.d);
      }
      ((e.form = null),
        (e.perfCache = null),
        (e.qts = 0),
        save(),
        toast((Ue[ae] || "Movimentação") + " registrada."),
        render());
    }
    (document.addEventListener(
      "click",
      (V) => {
        var ae;
        if (typeof tab > "u" || tab !== "carteiras") return;
        const ee = V.target.closest && V.target.closest("[data-pf]");
        if (!ee) return;
        const [le, Y, q, L] = ee.dataset.pf.split("|");
        if (le === "aba") {
          ((e.aba = Y), ((S.ax ?? (S.ax = {}))["pf.aba"] = Y), render());
          return;
        }
        if (le === "per") {
          ((e.per = Y), render());
          return;
        }
        if (le === "amb") {
          ((e.amb = Y), render());
          return;
        }
        if (le === "iasub") {
          ((e.ia = Y), render());
          return;
        }
        if (le === "hf") {
          ((e.hf = Y), render());
          return;
        }
        if (le === "rf") {
          ((e.rf = Y), render());
          return;
        }
        if (le === "modo") {
          ((e.modo = Y), render());
          return;
        }
        if (le === "pg") {
          ((e.pg = Y), render());
          return;
        }
        if (le === "att") {
          (pfQAtualiza(!0), (e.radar = 0), (e.meta = 0), pfRadar(!0));
          return;
        }
        if (le === "sel") {
          ((e.sel = Y), (e.modo = e.modo || "res"), render());
          return;
        }
        if (le === "seltk") {
          const F = A().find((O) => O.tk === Y) || { mk: i(Y).mk, tk: Y };
          ((e.sel = F.mk + ":" + F.tk), render());
          return;
        }
        if (le === "selx") {
          ((e.sel = null), Te(), render());
          return;
        }
        if (le === "rv") {
          ((e.rv = Y), render());
          return;
        }
        if (le === "rvx") {
          ((e.rv = null), Te(), render());
          return;
        }
        if (le === "msgx") {
          ((e.msg = ""), render());
          return;
        }
        if (le === "print") {
          (document.body.classList.add("pfimp"),
            setTimeout(() => {
              (window.print(),
                setTimeout(() => document.body.classList.remove("pfimp"), 500));
            }, 50));
          return;
        }
        if (le === "form") {
          ((e.form = { tp: Y, d: loc().slice(0, 10), cl: "auto", ev: "desd" }),
            render());
          return;
        }
        if (le === "formx") {
          ((e.form = null), Te(), render());
          return;
        }
        if (le === "ftp") {
          ((e.form.tp = Y), (e.form.err = ""), render());
          return;
        }
        if (le === "virar") {
          const F = m().find((O) => O.tk === Y && !O.virou);
          ((e.form = {
            tp: "C",
            tk: Y,
            cl: F ? F.cl : "auto",
            d: loc().slice(0, 10),
            wl: 1,
          }),
            (e.sel = null),
            render());
          return;
        }
        if (le === "salva") {
          W();
          return;
        }
        if (le === "delativo") {
          const [mk, tk] = String(Y).split(":"),
            F = (S.cart.lanc || []).filter((O) => O.tk === tk && (O.mk || "BR") === mk);
          if (!F.length || !confirm(`Excluir ${tk} e ${F.length} movimentação(ões)? O patrimônio e o preço médio são recalculados na hora.`)) return;
          const O = Date.now();
          ((S.cart.lanc = (S.cart.lanc || []).filter((ne) => !F.includes(ne))),
            F.forEach((ne) => ((S.del ?? (S.del = {}))[ne.id] = O)),
            S.cart.meta && delete S.cart.meta[tk],
            S.cart.px && delete S.cart.px[mk + ":" + tk],
            S.cart.alog && (S.cart.alog = S.cart.alog.filter((ne) => ne.tk !== tk)),
            (e.rel = (e.rel || []).filter((ne) => ne.tk !== tk)),
            (e.sel = null),
            (e.perfCache = null),
            save(),
            render(),
            toast(tk + " excluído da carteira."));
          try {
            !window.DIARIO_DEMO && SESS && SESS.uid && rq("/rest/v1/carteira_relatorios?tk=eq." + encodeURIComponent(tk) + "&tipo=eq.ativo", { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => {});
          } catch {}
          return;
        }
        if (le === "del") {
          const F = (S.cart.lanc || []).find((O) => O.id === Y);
          if (!confirm(F ? `Excluir ${({ C: "compra", V: "venda", P: "provento", E: "evento" })[F.tp] || "movimentação"} de ${F.tk} em ${String(F.d || "").split("-").reverse().join("/")}?` : "Excluir esta movimentação?")) return;
          ((S.cart.lanc = (S.cart.lanc || []).filter((F) => F.id !== Y)),
            ((S.del ?? (S.del = {}))[Y] = Date.now()),
            (e.perfCache = null),
            save(),
            render());
          return;
        }
        if (le === "wlrm") {
          const F = m(),
            O = F.findIndex((ne) => ne.tk === Y && !ne.virou);
          (O >= 0 && F.splice(O, 1), save(), render());
          return;
        }
        if (le === "wladd") {
          const F = i(Y);
          (m().push({
            tk: Y,
            mk: F.mk,
            cl: F.cl,
            add: loc().slice(0, 10),
            nota: "",
          }),
            save(),
            toast(Y + " na watchlist."),
            render());
          return;
        }
        if (le === "gera") {
          const F = pfCalc(),
            O =
              F.pos.find((ne) => ne.k === Y) ||
              (() => {
                const ne = m().find((Ee) => Ee.mk + ":" + Ee.tk === Y);
                return ne ? { ...ne, k: Y, q: 0 } : null;
              })();
          O && pfGeraAtivo(O, L === "1");
          return;
        }
        if (le === "cons") {
          pfGeraCons();
          return;
        }
        if (le === "rodada") {
          pfRodada();
          return;
        }
        if (le === "radar") {
          (pfRadar(!0), render());
          return;
        }
        if (le === "term") {
          ((e.sel = null),
            irPara("term"),
            setTimeout(() => {
              try {
                TRM.roda(Y + " G");
              } catch {}
            }, 80));
          return;
        }
        if (le === "go") {
          (irPara(Y));
          return;
        }
        if (le === "ferr") {
          tab = "analise";
          try {
            ((ANX.m = Y), (ANX.tkA = ""));
          } catch {}
          (irPara(tab), scrollTo(0, 0));
          return;
        }
        if (le === "alpx") {
          const F = +String(
            prompt(
              "Avisar quando " + Y + " chegar a qual preço?",
              (q.match(/em ([\d.,]+)/) || [])[1] || "",
            ) || "",
          )
            .replace(/\./g, "")
            .replace(",", ".");
          if (!(F > 0)) return;
          const O = A().find((Ee) => Ee.tk === Y) || { tk: Y, mk: "BR" },
            ne = p(O);
          (((ae = S.ax ?? (S.ax = {})).alpx ?? (ae.alpx = [])).push({
            id: "p" + Date.now().toString(36),
            s: O.mk === "BR" ? "BMFBOVESPA:" + Y : Y,
            c: Y,
            op: ne && +ne.p > F ? "<=" : ">=",
            v: F,
            dp: 2,
            em: Date.now(),
            orig: "carteira",
          }),
            save());
          try {
            turnoPushSync(!0);
          } catch {}
          toast(
            "Alerta de preço criado (aviso no celular com as notificações ligadas).",
          );
          return;
        }
      },
      !0,
    ),
      document.addEventListener(
        "change",
        (V) => {
          var ae;
          if (typeof tab > "u" || tab !== "carteiras") return;
          const ee = V.target;
          if (!ee || !ee.dataset || !ee.dataset.pfi) return;
          const [le, Y] = ee.dataset.pfi.split("|");
          if (le === "f") {
            if (!e.form) return;
            if (((e.form[Y] = ee.value), Y === "tk")) {
              const q = document.querySelector(
                  '[data-pfi="f|cl"] option[value="auto"]',
                ),
                L = ee.value.trim() ? i(ee.value) : null;
              q &&
                (q.textContent =
                  "Automática" + (L ? " (" + (o[L.cl] || L.cl) + ")" : ""));
              return;
            }
            (Y === "cl" || Y === "ev") && render();
            return;
          }
          if (le === "rc") {
            const q = +String(ee.value).replace(",", ".");
            (isFinite(q) && (f()[Y] = q), save());
            return;
          }
          if (le === "rcb") {
            ((f()[Y] = ee.checked), save());
            return;
          }
          if (le === "sit") {
            const q = v().find((L) => L.id === ee.dataset.pfi.slice(4));
            q && ((q.sit = ee.value), save(), render());
            return;
          }
          if (le === "relon") {
            ((x().on = ee.checked),
              save(),
              pfCfgSync(!0).then((q) => {
                (toast(
                  q
                    ? ee.checked
                      ? "Relatório automático ligado."
                      : "Relatório automático desligado."
                    : "Não consegui avisar o servidor: " + (e.cfgErr || ""),
                ),
                  render());
              }));
            return;
          }
          if (le === "reloff") {
            ((x().off = +ee.value), save(), pfCfgSync(!0).then(() => render()));
            return;
          }
          if (le === "pxm") {
            const [q, L] = Y.split(":");
            ((((ae = S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} })).px ??
              (ae.px = {}))[Y] = {
              p: +String(ee.value).replace(",", ".") || 0,
              d: loc().slice(0, 10),
              em: new Date().toISOString(),
              src: "manual",
            }),
              save(),
              render());
            return;
          }
        },
        !0,
      ),
      document.addEventListener(
        "input",
        (V) => {
          const ae = V.target;
          if (
            typeof tab > "u" ||
            tab !== "carteiras" ||
            !ae ||
            !ae.dataset ||
            !ae.dataset.pfi
          )
            return;
          const [ee, le] = ae.dataset.pfi.split("|");
          ee === "f" && e.form && (e.form[le] = ae.value);
        },
        !0,
      ),
      document.addEventListener("keydown", (V) => {
        V.key === "Escape" &&
          typeof tab < "u" &&
          tab === "carteiras" &&
          (e.sel || e.form || e.rv) &&
          (e.rv ? (e.rv = null) : e.form ? (e.form = null) : (e.sel = null),
          render());
      }));
    function Te() {
      if (e._hist && !e.sel && !e.form && !e.rv) {
        ((e._hist = 0), (e._ignora = 1));
        try {
          history.back();
        } catch {}
      }
    }
    (window.addEventListener("popstate", () => {
      if (e._ignora) {
        e._ignora = 0;
        return;
      }
      if (e._hist && (e.sel || e.form || e.rv)) {
        if (
          ((e._hist = 0),
          e.rv ? (e.rv = null) : e.form ? (e.form = null) : (e.sel = null),
          e.sel || e.form || e.rv)
        ) {
          e._hist = 1;
          try {
            history.pushState({ pf: 1 }, "");
          } catch {}
        }
        render();
      }
    }),
      document.addEventListener(
        "click",
        (V) => {
          if (typeof tab > "u" || tab !== "carteiras") return;
          const ae =
            V.target.classList && V.target.classList.contains("pfmd")
              ? V.target
              : null;
          if (ae && ae.dataset.pfbk) {
            const ee = ae.dataset.pfbk;
            (ee === "rvx"
              ? (e.rv = null)
              : ee === "formx"
                ? (e.form = null)
                : (e.sel = null),
              Te(),
              render());
          }
        },
        !0,
      ));
    {
      const V = render0;
      render0 = function () {
        const ae = e._tabAnt;
        e._tabAnt = typeof tab < "u" ? tab : "";
        try {
          tab === "carteiras" &&
            ae &&
            ae !== "carteiras" &&
            !(typeof GO < "u" && GO.r) &&
            ((e.aba = "geral"), (e.sel = null), (e.form = null), (e.rv = null));
        } catch {}
        const ee = V.apply(this, arguments);
        try {
          if (tab === "carteiras") {
            const le = document.getElementById("tape"),
              Y = le ? Math.max(0, le.getBoundingClientRect().bottom) : 0;
            (document.documentElement.style.setProperty("--pftop", Y + "px"),
              (e.sel || e.form || e.rv) &&
                !e._hist &&
                ((e._hist = 1), history.pushState({ pf: 1 }, "")));
          }
        } catch {}
        return ee;
      };
    }
    vCarteiras = function () {
      return (
        (typeof grpHeader == "function" ? grpHeader("carteiras") : "") + dt()
      );
    };
    {
      const V = render0;
      render0 = function () {
        try {
          tab === "carteiras" &&
            typeof GO < "u" &&
            GO.r &&
            !e._goVisto &&
            ((e._goVisto = 1),
            (e.aba = "ia"),
            (e.rv = GO.r),
            (GO.r = null),
            pfRel(!0));
        } catch {}
        return V.apply(this, arguments);
      };
    }
    {
      const V = TraderStyles.slot("legacy-119");
      ((V.id = "pf197"),
        (V.textContent = TraderStyles.css("legacy-119")),
        TraderStyles.mount(V));
    }
  })(),
  (function () {
    const e = () => document.body.classList.contains("pc");
    function t() {
      if (document.getElementById("pcmenub")) return;
      const a = document.createElement("button");
      ((a.id = "pcmenub"),
        (a.type = "button"),
        (a.title = "Menu do app"),
        a.setAttribute("aria-label", "Abrir o menu do app"),
        (a.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'),
        a.addEventListener("click", (o) => {
          (o.stopPropagation(), document.body.classList.toggle("pcmenu"));
        }),
        document.body.appendChild(a));
    }
    (document.addEventListener("click", (a) => {
      !document.body.classList.contains("pcmenu") ||
        (a.target.closest && a.target.closest("#pcmenub")) ||
        (a.target.closest &&
          a.target.closest("#mdr2 .pn") &&
          !a.target.closest("button,[data-m2],a")) ||
        setTimeout(() => document.body.classList.remove("pcmenu"), 0);
    }),
      document.addEventListener("keydown", (a) => {
        a.key === "Escape" && document.body.classList.remove("pcmenu");
      }));
    {
      const a = render0;
      render0 = function () {
        const o = a.apply(this, arguments);
        try {
          (t(), document.body.classList.add("pcfull"));
        } catch {}
        return o;
      };
    }
    try {
      (t(), document.body.classList.add("pcfull"));
    } catch {}
    {
      const a = {},
        o = (s, n) =>
          function (r) {
            if (!(!r && Date.now() - (a[s] || 0) < 2e4))
              return ((a[s] = Date.now()), n.apply(this, arguments));
          };
      try {
        mdoCarrega = o("mdo", mdoCarrega);
      } catch {}
      try {
        agCarrega = o("ag", agCarrega);
      } catch {}
      try {
        setCarrega = o("set", setCarrega);
      } catch {}
      try {
        sntCarrega = o("snt", sntCarrega);
      } catch {}
      try {
        szCarrega = o("sz", szCarrega);
      } catch {}
    }
    {
      const a = TraderStyles.slot("legacy-120");
      ((a.id = "pc198"),
        (a.textContent = TraderStyles.css("legacy-120")),
        TraderStyles.mount(a));
    }
  })());

/* v605: títulos de notícias da carteira sempre em português (traduz/sintetiza títulos em inglês pelo assunto)
   e uma chave por assunto e dia, para não repetir o mesmo alerta. */
function pfNoticiaPT(tk, t, fonte) {
  const s = String(t || "").replace(/\s+/g, " ").trim(),
    n = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(),
    ing = /\b(the|and|with|for|its|how|does|why|what|stock|stocks|shares|price|prices|gold|etf|fund|week|says|after|amid|record|rises?|falls?|could|will)\b/i.test(s),
    pt = /[ãõçáéíóúâêô]/i.test(s) || (/\b(de|do|da|dos|das|para|com|após|sobre|ações|bolsa|lucro|alta|queda|veja)\b/i.test(s) && !ing),
    T = [
      [/dividend|distribution|payout|provent|jcp/, "proventos e dividendos", 1],
      [/earnings|results?\b|revenue|profit|quarter|\bq[1-4]\b|resultado|lucro|balanco|receita/, "resultados trimestrais", 1],
      [/downgrade|upgrade|price target|rating|analyst|rebaix|recomend|preco-alvo/, "recomendação de analistas", 1],
      [/buyback|repurchase|recompra/, "recompra de ações", 1],
      [/merger|acquisition|acquire|fusao|aquisicao/, "fusão ou aquisição", 1],
      [/lawsuit|investigation|\bsec\b|\bcvm\b|investiga/, "investigação ou processo", 1],
      [/gold|ouro|bullion|precious metal/, "preço do ouro", 0],
      [/inflows?|outflows?|\bflows?\b|assets under|\baum\b|fluxo/, "fluxo de recursos do ETF", 0],
      [/\bfed\b|rate cuts?|rate hikes?|interest rates?|juros|treasur|yields?/, "juros e Federal Reserve", 0],
      [/dollar|currency|cambio|dolar/, "dólar e câmbio", 0],
      [/expense ratio|\bfees?\b|taxa de administracao/, "custos do ETF", 0],
      [/record high|all-time high|rall|surg|jump|soar|dispara|maxima/, "forte alta", 0],
      [/\bfall|drop|slump|plung|tumbl|despenca|tomba|queda/, "forte queda", 0],
    ],
    m = T.find(([re]) => re.test(n)),
    tema = m ? m[1] : "notícia sobre o ativo";
  if (pt) return { chave: m ? tema : n.slice(0, 40), motivo: `${tk}: ${s}`, alta: m ? m[2] : 0 };
  return { chave: tema, motivo: `${tk}: ${tema.charAt(0).toUpperCase() + tema.slice(1)} — destaque de ${fonte}`, alta: m ? m[2] : 0 };
}
/* v605: limpeza única dos ativos de demonstração (por id exato do lançamento; não afeta outros ativos nem outras contas).
   O servidor já foi limpo com cópia de segurança (tabela limpeza_backup); aqui o aparelho acompanha e não recria nada. */
function pfLimpa605() {
  try {
    const c = S && S.cart;
    if (!c || c.lp605 === 2) return;
    const ids = ["l8fw78um", "o4he4t5y", "7jyd8fbm", "ltkz1r2h", "p7ezz8ek", "xkgrjmd3", "50aefyfp"],
      tks = ["WEGE3", "BBAS3", "MXRF11", "VALE3", "PETR4", "IVV"],
      tinha = (c.lanc || []).some((l) => ids.includes(l.id)) || c.lp605 === 1,
      agora = Date.now();
    if (tinha) {
      ((c.lanc = (c.lanc || []).filter((l) => !ids.includes(l.id))), ids.forEach((i) => ((S.del ?? (S.del = {}))[i] = (S.del || {})[i] || agora)));
      const resta = new Set((c.lanc || []).map((l) => l.tk));
      tks.filter((t) => !resta.has(t)).forEach((t) => {
        (c.meta && delete c.meta[t], c.px && (delete c.px["BR:" + t], delete c.px["US:" + t]));
        c.alog && (c.alog = c.alog.filter((a) => a.tk !== t));
      });
      (c.lanc || []).some((l) => (l.mk || "BR") === "BR") || Object.values(c.snap || {}).forEach((v) => v && delete v.BR);
    }
    (c.alog || []).forEach((a) => {
      if (a && a.tipo === "news" && a.motivo && !a.pt605) {
        const tit = String(a.motivo).replace(new RegExp("^" + a.tk + ":\\s*"), ""),
          r = pfNoticiaPT(a.tk, tit, a.fonte || "notícias");
        ((a.motivo = r.motivo), (a.tema = r.chave), (a.pt605 = 1));
      }
    });
    if (c.alog) {
      const vistos = new Set();
      c.alog = c.alog.filter((a) => {
        if (!a || a.tipo !== "news") return !0;
        const k = a.tk + "|" + String(a.em || "").slice(0, 10) + "|" + (a.tema || a.motivo);
        return vistos.has(k) ? !1 : (vistos.add(k), !0);
      });
    }
    c.lp605 = 2;
    typeof save == "function" && save();
  } catch {}
}
(function reg605(n) {
  try {
    if (window.TraderUI && window.TraderUI.onRender) return window.TraderUI.onRender("limpa605", () => S && S.cart && S.cart.lp605 !== 2 && !window.DIARIO_DEMO && (pfLimpa605(), render()));
  } catch {}
  n < 60 && setTimeout(() => reg605(n + 1), 250);
})(0);
