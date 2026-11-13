{
  const e = turnoGet;
  turnoGet = function () {
    const t = e.apply(this, arguments);
    if (t && escValida(t.esc)) {
      const a = escDias(t.esc, t.troca);
      t.dias = ESC_COPY ? { ...a } : a;
    }
    return t;
  };
}
{
  const e = turnoSet;
  turnoSet = function (t) {
    const a = ((S.ax || {}).turno || {}).esc;
    ESC_COPY = 1;
    try {
      e.call(this, (o) => {
        if ((t(o), !!escValida(o.esc))) {
          if (o.esc !== a) o.troca = {};
          else if (!Object.keys(o.dias || {}).length) o.troca = {};
          else {
            const s = escDias(o.esc, {}),
              n = {};
            (new Set([...Object.keys(s), ...Object.keys(o.dias)]).forEach(
              (r) => {
                const i = s[r] || "",
                  l = o.dias[r] || "";
                i !== l && (n[r] = l);
              },
            ),
              (o.troca = n));
          }
          o.dias = {};
        }
      });
    } finally {
      ESC_COPY = 0;
    }
  };
}
const ESC_OP = [
  ["A", "A"],
  ["B", "B"],
  ["C", "C"],
  ["D", "D"],
  ["ADM", "ADM"],
  ["", "Manual"],
];
function escHtml(e) {
  const t = escValida(e.esc) ? e.esc : "",
    a = Object.keys(e.troca || {}).length;
  return `<div class="esccard"><div class="sm" style="margin-bottom:6px"><b>Escala fixa</b> · escolha a sua letra e o app preenche todos os dias sozinho</div><div class="escop">${ESC_OP.map(([o, s]) => `<button class="${t === o ? "on" : ""}" data-esc="${o}">${s}</button>`).join("")}</div>
<div class="sm mut" style="margin-top:6px">${t === "ADM" ? "ADM: segunda a sexta das 8h às 17h; sábado e domingo de folga. Feriados: toque no dia para marcar folga." : t ? `Letra ${t}: ciclo de 4 semanas da Gerdau Ouro Branco (8, 16, 0 e folga), que se repete sozinho. Trocou um turno ou pegou folga? Toque no dia no calendário: fica guardado como troca${a ? ` (${a} troca${a > 1 ? "s" : ""} agora · <button class="lnk" data-esc="limpatroca">desfazer trocas</button>)` : ""}.` : "Manual: você marca cada dia no calendário ou importa a tabela."}</div></div>`;
}
{
  const e = turnoCard;
  turnoCard = function () {
    let t = e.apply(this, arguments);
    try {
      const a = turnoGet();
      (escValida(a.esc) &&
        (t = t.replace(
          /Escala de turno \xb7 letra [^<]*/,
          a.esc === "ADM"
            ? "Escala ADM (seg a sex, 8h às 17h)"
            : "Escala de turno · letra " + esc(a.esc) + " (automática)",
        )),
        TSV
          ? (t = t.replace(
              '<hr style="border:0;border-top:1px solid #8883;margin:10px 0">',
              '<hr style="border:0;border-top:1px solid #8883;margin:10px 0">' +
                escHtml(a),
            ))
          : !escValida(a.esc) &&
            a.on &&
            (t = t.replace(
              /<\/div>\s*$/,
              '<div class="sm" style="margin-top:8px"><button class="lnk" data-a="tsv">Escolha a sua letra (A, B, C, D ou ADM)</button> e o app preenche a escala sozinho.</div></div>',
            )));
    } catch {}
    return t;
  };
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-esc]");
    if (!t) return;
    e.stopPropagation();
    const a = t.dataset.esc;
    if (a === "limpatroca") {
      (turnoSet((o) => {
        o.dias = {};
      }),
        toast("Trocas desfeitas: a escala voltou ao ciclo normal."),
        render());
      return;
    }
    (turnoSet((o) => {
      ((o.esc = a), a && ((o.letra = a), (o.on = 1)));
    }),
      toast(
        a
          ? a === "ADM"
            ? "Escala ADM ativada."
            : `Escala da letra ${a} ativada: o app preenche todos os dias.`
          : "Escala manual: os dias que já estavam ficam para você editar.",
        4e3,
      ),
      render());
  },
  !0,
);
{
  const e = TraderStyles.slot("legacy-067");
  ((e.textContent = TraderStyles.css("legacy-067")), TraderStyles.mount(e));
}
FN_ESPERADA.notificar = "v207";
function pascoa(e) {
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
  return `${e}-${String(m).padStart(2, "0")}-${String(f).padStart(2, "0")}`;
}
const FER_C = {};
function feriados(e) {
  if (FER_C[e]) return FER_C[e];
  const t = pascoa(e),
    a = (s) => diasMais(t, s),
    o = {};
  return (
    [
      ["01-01", "Confraternização"],
      ["04-21", "Tiradentes"],
      ["05-01", "Dia do Trabalho"],
      ["09-07", "Independência"],
      ["10-12", "Nossa Senhora Aparecida"],
      ["11-02", "Finados"],
      ["11-15", "Proclamação da República"],
      ["11-20", "Consciência Negra"],
      ["12-25", "Natal"],
    ].forEach(([s, n]) => (o[e + "-" + s] = n)),
    (o[a(-48)] = "Carnaval"),
    (o[a(-47)] = "Carnaval"),
    (o[a(-2)] = "Sexta-feira Santa"),
    (o[a(60)] = "Corpus Christi"),
    (FER_C[e] = o)
  );
}
const feriadoDe = (e) => feriados(+e.slice(0, 4))[e] || "",
  pregaoB3 = (e) => {
    const t = new Date(e + "T12:00:00Z").getUTCDay();
    if (t === 0 || t === 6 || feriadoDe(e)) return !1;
    const a = e.slice(5);
    return a !== "12-24" && a !== "12-31";
  };
{
  const e = escCod;
  escCod = function (t, a) {
    const o = e.apply(this, arguments);
    return t === "ADM" && o === "8" && feriadoDe(a) ? "F" : o;
  };
}
const feriasDe = (e) => (Array.isArray(e && e.ferias) ? e.ferias : []),
  emFerias = (e, t) => feriasDe(e).some((a) => t >= a.de && t <= a.ate);
{
  const e = turnoGet;
  turnoGet = function () {
    const t = e.apply(this, arguments);
    if (!ESC_COPY && feriasDe(t).length) {
      const a = { ...t.dias };
      (feriasDe(t).forEach((o) => {
        let s = o.de,
          n = 0;
        for (; s <= o.ate && n < 400; )
          ((a[s] = "F"), (s = diasMais(s, 1)), n++);
      }),
        (t.dias = a));
    }
    return t;
  };
}
function janTurno(e) {
  const t = tcod(e),
    a = turnoGet();
  if (!t) return null;
  if (emFerias(a, e)) return { nv: "g", txt: "Férias: dia livre." };
  const o = tcod(diasMais(e, 1)),
    s = tdRes(),
    n = tdCat(e),
    r = s[n],
    i =
      r && r.n >= 5 && r.v / r.n < 0
        ? ` Nos seus dias assim, a média por trade é ${money(r.v / r.n)}: vá com a mão menor.`
        : "";
  return t === "8"
    ? {
        nv: "r",
        txt: `Turno das 8h às 17h: não opere.${feriadoDe(e) ? " (Feriado: " + feriadoDe(e) + ".)" : ""}`,
      }
    : t === "16"
      ? {
          nv: "a",
          txt:
            "Turno 16h–00h: dá para operar das 9h às 14h30 e parar a tempo de ir para o trabalho." +
            i,
        }
      : t === "0"
        ? {
            nv: "a",
            txt:
              "Você sai do turno da madrugada às 8h: durma antes. Se for operar, só à tarde e com a mão menor." +
              i,
          }
        : {
            nv: "g",
            txt:
              "Folga: dia livre para operar." +
              (o === "0"
                ? " Hoje à meia-noite você entra no turno 00h–08h: descanse à tarde."
                : "") +
              i,
          };
}
const TD_N = {
    folga: "Folga",
    t16: "Antes do turno das 16h",
    t0: "Depois da madrugada (turno 0)",
    t8: "Dia de turno 8h (operou mesmo assim)",
  },
  tdCat = (e) => {
    const t = tcod(e);
    return t === "16"
      ? "t16"
      : t === "0"
        ? "t0"
        : t === "8"
          ? "t8"
          : t === "F"
            ? "folga"
            : "";
  };
let TD_M = null;
function tdRes() {
  const e = S.trades.length + "|" + (S.mt || 0);
  if (TD_M && TD_M.k === e) return TD_M.v;
  const t = {};
  return (
    S.trades.forEach((a) => {
      const o = calc(a);
      if (o.pl == null) return;
      const s = String(a.dtx || a.dt).slice(0, 10),
        n = tdCat(s);
      if (!n) return;
      const r = t[n] ?? (t[n] = { n: 0, v: 0, g: 0 });
      r.n++;
      const i = emBRL(o.pl, moedaT(a));
      ((r.v += i), i > 0 && r.g++);
    }),
    (TD_M = { k: e, v: t }),
    t
  );
}
function tdHtml() {
  const e = tdRes(),
    t = Object.keys(TD_N).filter((a) => e[a]);
  return t.length
    ? `<table class="sm"><tr><th>Tipo de dia</th><th>Trades</th><th>Acerto</th><th>Média</th><th>Total</th></tr>${t
        .map((a) => {
          const o = e[a];
          return `<tr><td>${TD_N[a]}</td><td>${o.n}</td><td>${Math.round((o.g / o.n) * 100)}%</td><td class="${cls(o.v / o.n)}">${money(o.v / o.n)}</td><td class="${cls(o.v)}">${money(o.v)}</td></tr>`;
        })
        .join("")}</table>`
    : '<div class="sm mut">Quando tiver trades em dias com escala marcada, aqui aparece o seu resultado em cada tipo de dia.</div>';
}
function mesLivre(e) {
  let t = e + "-01",
    a = { livre: 0, manha: 0, tarde: 0, bloq: 0, resta: 0 };
  const o = loc().slice(0, 10);
  for (; t.startsWith(e); ) {
    if (pregaoB3(t)) {
      const s = tcod(t),
        n = turnoGet(),
        r = emFerias(n, t),
        i =
          r || s === "F" || !s
            ? "livre"
            : s === "16"
              ? "manha"
              : s === "0"
                ? "tarde"
                : "bloq";
      (a[i]++, t >= o && (i === "livre" || i === "manha") && a.resta++);
    }
    t = diasMais(t, 1);
  }
  return a;
}
const ESCV = { on: 0, dia: "" };
function quatroHtml(e) {
  if (!e) return "";
  const t = ["A", "B", "C", "D"].map((o) => [o, escCod(o, e)]),
    a = (o) =>
      o === "F"
        ? "folga"
        : o === "8"
          ? "8h–17h"
          : o === "16"
            ? "16h–00h"
            : "00h–08h";
  return `<div class="esc4" id="esc4"><b class="sm">${new Date(e + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}${feriadoDe(e) ? " · " + esc(feriadoDe(e)) : ""}</b><div class="esc4g">${t.map(([o, s]) => `<div class="${s === "F" ? "f" : ""}"><span>${o}</span><b>${s}</b><small>${a(s)}</small></div>`).join("")}</div><div class="sm mut">De folga: ${
    t
      .filter((o) => o[1] === "F")
      .map((o) => o[0])
      .join(", ") || "ninguém"
  }.</div></div>`;
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest('[data-a="tsc"]');
    if (!t || !ESCV.on) return;
    (e.stopImmediatePropagation(),
      e.preventDefault(),
      (ESCV.dia = t.dataset.id));
    const a = document.getElementById("esc4w");
    a ? (a.innerHTML = quatroHtml(ESCV.dia)) : render();
  },
  !0,
);
function icsGera(e = 90) {
  const t = loc().slice(0, 10),
    a = (i) => String(i).padStart(2, "0"),
    o = (i, l) => i.replace(/-/g, "") + "T" + a(l) + "0000",
    s = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
    n = [],
    r = {
      8: [8, 17, "Turno 8h–17h"],
      16: [16, 24, "Turno 16h–00h"],
      0: [0, 8, "Turno 00h–08h"],
    };
  for (let i = 0; i < e; i++) {
    const l = diasMais(t, i),
      d = tcod(l);
    if (!r[d] || emFerias(turnoGet(), l)) continue;
    const [c, p, u] = r[d],
      m = p === 24 ? o(diasMais(l, 1), 0) : o(l, p);
    n.push(
      [
        "BEGIN:VEVENT",
        `UID:turno-${l}-${d}@diario-de-trader`,
        `DTSTAMP:${s}`,
        `DTSTART;TZID=America/Sao_Paulo:${o(l, c)}`,
        `DTEND;TZID=America/Sao_Paulo:${m}`,
        `SUMMARY:${u} (Gerdau)`,
        "DESCRIPTION:Escala gerada pelo Diário de Trader. Se trocar turno\\, exporte de novo.",
        "END:VEVENT",
      ].join(`\r
`),
    );
  }
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Diario de Trader//Escala//PT",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:Escala Gerdau",
      "BEGIN:VTIMEZONE",
      "TZID:America/Sao_Paulo",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:-0300",
      "TZOFFSETTO:-0300",
      "TZNAME:BRT",
      "END:STANDARD",
      "END:VTIMEZONE",
      ...n,
      "END:VCALENDAR",
    ].join(`\r
`) +
    `\r
`
  );
}
function esc133Html(e) {
  const t = feriasDe(e),
    a = loc().slice(0, 10);
  return `<div class="esccard"><div class="top"><b class="sm">👥 Ver as 4 letras de um dia</b><label class="ck sm" style="margin:0"><input type="checkbox" data-escv="1"${ESCV.on ? " checked" : ""}><span>ligado</span></label></div><div class="sm mut">Ligado, tocar num dia mostra quem está em cada turno (bom para combinar troca) em vez de mudar o seu dia.</div><div id="esc4w">${ESCV.on ? quatroHtml(ESCV.dia || a) : ""}</div></div>
<div class="esccard"><b class="sm">🏖️ Férias</b>${t.length ? t.map((o, s) => `<div class="facr"><span class="sm">${fmtD(o.de)} a ${fmtD(o.ate)}</span><button class="x" data-ferx="${s}" aria-label="Apagar">✕</button></div>`).join("") : '<div class="sm mut">Os dias de férias viram folga, sem mexer no ciclo. Quando acabam, a escala volta sozinha.</div>'}
<div class="g2" style="margin-top:6px"><label class="sm">De<input type="date" id="ferde" value="${a}"></label><label class="sm">Até<input type="date" id="ferate" value="${diasMais(a, 29)}"></label></div><button class="btn s" data-feradd="1" style="width:100%;margin-top:6px">Adicionar férias</button></div>
<div class="esccard"><b class="sm">📅 Calendário do iPhone</b><div class="sm mut" style="margin:4px 0 6px">Gera um arquivo com os próximos 90 dias de turno. No iPhone, abra o arquivo e toque em "Adicionar todos". Se trocar turno, exporte de novo.</div><button class="btn s" data-ics="1" style="width:100%">Exportar a escala (90 dias)</button></div>
<div class="esccard"><b class="sm">📊 Seu resultado por tipo de dia</b><div class="sm mut" style="margin:4px 0 6px">Fica em Estatísticas → Fatores ("Turno no próprio dia" e "Turno da Gerdau no dia anterior"), junto com os outros fatores do seu resultado.</div><button class="btn s" data-tdlink="1" style="width:100%">Abrir em Estatísticas → Fatores</button></div>`;
}
{
  const e = turnoCard;
  turnoCard = function () {
    let t = e.apply(this, arguments);
    try {
      const a = turnoGet();
      if (!a.on) return t;
      const o = loc().slice(0, 10),
        s = janTurno(o),
        n = o.slice(0, 7),
        r = mesLivre(n),
        i = new Date(o + "T12:00").toLocaleDateString("pt-BR", {
          month: "long",
        }),
        l = `${s ? `<div class="sm tjan" style="border-left:3px solid ${{ r: "var(--r)", a: "#c2933d", g: "var(--g)" }[s.nv]}">${esc(s.txt)}</div>` : ""}<div class="sm mut" style="margin:6px 0">📆 ${i[0].toUpperCase() + i.slice(1)}: <b>${r.livre}</b> pregão(ões) livre(s) + <b>${r.manha}</b> com a manhã livre (turno 16h)${r.tarde ? ` + ${r.tarde} depois da madrugada` : ""}.</div>`;
      ((t = t.replace(
        '<div style="display:flex;gap:4px">',
        l + '<div style="display:flex;gap:4px">',
      )),
        TSV &&
          (t = t.replace(
            '<div class="sm" style="margin:10px 0 4px">O que cada turno faz com o aviso',
            esc133Html(a) +
              '<div class="sm" style="margin:10px 0 4px">O que cada turno faz com o aviso',
          )));
    } catch (a) {
      console.error(a);
    }
    return t;
  };
}
(document.addEventListener("change", (e) => {
  e.target.dataset &&
    e.target.dataset.escv &&
    ((ESCV.on = e.target.checked ? 1 : 0), (ESCV.dia = ""), render());
}),
  document.addEventListener("click", (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if (t("[data-feradd]")) {
      const o = document.getElementById("ferde").value,
        s = document.getElementById("ferate").value;
      if (!o || !s || s < o) {
        toast("Confira as datas das férias.");
        return;
      }
      (turnoSet((n) => {
        n.ferias = [...feriasDe(n), { de: o, ate: s }].slice(-10);
      }),
        toast("Férias marcadas: " + fmtD(o) + " a " + fmtD(s) + "."),
        render());
      return;
    }
    if ((a = t("[data-ferx]"))) {
      const o = +a.dataset.ferx;
      (turnoSet((s) => {
        s.ferias = feriasDe(s).filter((n, r) => r !== o);
      }),
        render());
      return;
    }
    if (t("[data-ics]")) {
      const o = icsGera(90);
      if (!/BEGIN:VEVENT/.test(o)) {
        toast("Nenhum turno nos próximos 90 dias.");
        return;
      }
      try {
        saveFile("escala-gerdau.ics", o, "text/calendar");
      } catch {
        toast("Não consegui gerar o arquivo.");
      }
    }
  }));
{
  const e = turnoModoHtml;
  turnoModoHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = janTurno(loc().slice(0, 10));
      a &&
        (t = t.replace(
          /(<div class="sm mut" style="margin:4px 0 10px">)[^<]*/,
          "$1" + esc(a.txt),
        ));
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-068");
  ((e.textContent = TraderStyles.css("legacy-068")), TraderStyles.mount(e));
}
{
  const e = semTurnoHtml;
  semTurnoHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = mesLivre(loc().slice(0, 7));
      return t.replace(
        /Dias livres para operar at\xe9 o fim do m\xeas: <b>\d+<\/b> \(contando hoje\)\./,
        `Pregões para operar até o fim do mês: <b>${a.resta}</b> (folga ou manhã livre antes do turno das 16h; sem fins de semana e feriados da bolsa).`,
      );
    } catch {
      return t;
    }
  };
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest("[data-tdlink]") &&
      (e.stopPropagation(),
      (TSV = !1),
      typeof STMOD < "u" && (STMOD = null),
      irPara("stats"),
      scrollTo(0, 0),
      setTimeout(() => {
        const t = [...document.querySelectorAll("#app button")].find(
          (a) => (a.textContent || "").trim() === "Fatores",
        );
        t && t.click();
      }, 120));
  },
  !0,
);
function metaMesHtml(e) {
  const t = (S.ax || {}).metaMes,
    a = ((S.ax || {}).rvm || {})[e],
    o = rvmDados(e);
  return `<div id="rvmmeta" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--bd)"><b class="sm">🎯 Meta de processo para ${esc(rvmNome(hjD().slice(0, 7)))}</b><div class="sm mut" style="margin:2px 0 6px">Comportamento, não dinheiro. Aparece no Início no fim de semana.</div><div class="rvmmeta">${RVM_METAS.map(
    ([s, n]) => {
      const r = s === "erro" && o.err.length ? "Zerar: " + o.err[0][0] : n;
      return `<button class="${t && t.mes === hjD().slice(0, 7) && t.tipo === s ? "on" : ""}" data-rvmm2="${s}" data-ym="${e}">${esc(r)}</button>`;
    },
  ).join(
    "",
  )}</div>${a ? '<div class="sm g" style="margin-top:6px">✓ Revisão do mês feita.</div>' : ""}</div>`;
}
document.addEventListener("click", (e) => {
  var t;
  const a = e.target.closest("[data-rvmm2]");
  if (!a) return;
  const o = a.dataset.ym,
    s = a.dataset.rvmm2,
    n = rvmDados(o),
    r = RVM_METAS.find((l) => l[0] === s);
  if (!r) return;
  (((S.ax ?? (S.ax = {})).metaMes = {
    mes: hjD().slice(0, 7),
    tipo: s,
    txt: s === "erro" && n.err.length ? "Zerar: " + n.err[0][0] : r[1],
  }),
    (((t = S.ax ?? (S.ax = {})).rvm ?? (t.rvm = {}))[o] = Date.now()),
    save(),
    toast("Meta do mês: " + S.ax.metaMes.txt, 3500));
  const i = scrollY;
  (render(), scrollTo(0, i));
});
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("relmes");
      if (t && !t.querySelector("#rvmmeta")) {
        const [a] = rng(RP),
          o = a.slice(0, 7);
        o < hjD().slice(0, 7) &&
          t.insertAdjacentHTML("beforeend", metaMesHtml(o));
      }
    } catch {}
  };
}
const TIPO_D = (e) => {
  const t = turnoGet(),
    a = new Date(e + "T12:00").getDay();
  if (a === 0 || a === 6) return ["Estuda", "var(--ac)"];
  if (emFerias(t, e)) return ["Opera", "var(--g)"];
  const o = t.dias[e],
    s = (o && t.niv[o]) || "g";
  return s === "r"
    ? ["Revisa", "var(--r)"]
    : s === "a"
      ? ["Cuidado", "var(--am)"]
      : ["Opera", "var(--g)"];
};
{
  const e = turnoCard;
  turnoCard = function () {
    let t = e.apply(this, arguments);
    try {
      if (!turnoGet().on) return t;
      const a = loc().slice(0, 10);
      let o = 0;
      t = t.replace(
        /(<div style="margin-top:3px;padding:6px 0;border-radius:8px;border:[^"]*;font-weight:700">[^<]*<\/div>)(<\/div>)/g,
        (s, n, r) => {
          const i = diasMais(a, o++),
            [l, d] = TIPO_D(i);
          return n + `<div class="tday" style="color:${d}">${l}</div>` + r;
        },
      );
    } catch {}
    return t;
  };
}
{
  const e = semTurnoHtml;
  semTurnoHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        /<b class="sm">O que fazer em cada dia<\/b>[\s\S]*?<div style="display:flex;gap:4px;margin-top:6px">[\s\S]*?<\/div><\/div><\/div>(?=<div class="sm")/,
        "",
      );
  };
}
function treinoHtml() {
  const e = gtStats(),
    t = (() => {
      try {
        return fcFila().length;
      } catch {
        return 0;
      }
    })(),
    a = (() => {
      try {
        return rpyS().length;
      } catch {
        return 0;
      }
    })(),
    o = (s, n, r, i, l) =>
      `<button class="tritem" data-treino="${s}"><span class="tric">${n}</span><span><b>${r}</b><small>${i}</small></span><span class="trx">${l || "›"}</span></button>`;
  return `<h1>Estudos</h1>${estSeg("treino")}<div class="card"><b>🎯 Treino</b><div class="sm mut" style="margin:2px 0 8px">Tudo para treinar a leitura e a execução sem arriscar dinheiro.</div>
${o("gt", "📈", "Leitura de gráfico", "Gráfico real cortado: alta, lateral ou queda?", e.n ? Math.round((e.ok / e.n) * 100) + "%" : "")}
${o("rpy", "▶️", "Replay de pregão", "Um pregão passado candle a candle, com entrada, stop e alvo", a ? a + "×" : "")}
${o("cnpi", "🎓", "Padrões no gráfico (CNPI-T)", "Identificar o padrão e projetar o alvo")}
${o("fc", "🃏", "Flashcards dos seus trades", "Seus prints: o que você faria?", t ? t + " hoje" : "")}</div>${fcHtml()}`;
}
{
  const e = fcHtml;
  fcHtml = function () {
    return tab === "estudos" && ESV !== "treino"
      ? ""
      : e.apply(this, arguments);
  };
}
estSeg = function (e) {
  return EN_SG()
    .replace(' class="on"', "")
    .replace(
      "</div>",
      `<button${e === "foco" ? ' class="on"' : ""} data-ep="esv" data-id="foco">⏱️ Foco</button><button${e === "treino" || e === "gt" ? ' class="on"' : ""} data-ep="esv" data-id="treino">🎯 Treino</button></div>`,
    );
};
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV === "treino"
      ? treinoHtml()
      : e
          .apply(this, arguments)
          .replace(
            '<button data-ep="esv" data-id="gt">📈 Gráfico</button>',
            '<button data-ep="esv" data-id="treino">🎯 Treino</button>',
          )
          .replace(
            '<button class="on" data-ep="esv" data-id="gt">📈 Gráfico</button>',
            '<button class="on" data-ep="esv" data-id="treino">🎯 Treino</button>',
          );
  };
}
{
  const e = focoHtml;
  focoHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        '<button data-ep="esv" data-id="gt">📈 Gráfico</button>',
        '<button data-ep="esv" data-id="treino">🎯 Treino</button>',
      );
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-treino]");
  if (!t) return;
  const a = t.dataset.treino;
  if (a === "gt") {
    ((ESV = "gt"), render(), scrollTo(0, 0));
    return;
  }
  if (a === "rpy") {
    (irPara("dtrpy"), scrollTo(0, 0));
    return;
  }
  if (a === "cnpi") {
    ((ESV = "cnpi"),
      render(),
      setTimeout(() => {
        const o = [...document.querySelectorAll("#app h2")].find((s) =>
          /Padr\xf5es no gr\xe1fico/.test(s.textContent),
        );
        o && o.scrollIntoView({ block: "start" });
      }, 120));
    return;
  }
  if (a === "fc") {
    const o = document.getElementById("fcw");
    o && o.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}),
  (GOR.treino = () => {
    ((GO.r = null), (ESV = "treino"), irPara("estudos"));
  }));
const HG_AB = (() => {
  try {
    return JSON.parse(APP_STORAGE.getItem("diario-hg") || "{}");
  } catch {
    return {};
  }
})();
function hgGrupo(e, t, a, o, s, n) {
  if (((s = s.filter(Boolean)), s.length < 2)) return;
  const r = document.createElement("div");
  ((r.className = "card hgr"), (r.id = t));
  const i = HG_AB[t] != null ? HG_AB[t] : n;
  ((r.innerHTML = `<details${i ? " open" : ""}><summary><b>${a}</b><span class="sm mut">${o}</span></summary><div class="hgin"></div></details>`),
    s[0].before(r));
  const l = r.querySelector(".hgin");
  (s.forEach((d) => {
    (d.classList.add("hgfilho"), l.appendChild(d));
  }),
    r.querySelector("details").addEventListener("toggle", (d) => {
      HG_AB[t] = d.target.open;
      try {
        APP_STORAGE.setItem("diario-hg", JSON.stringify(HG_AB));
      } catch {}
    }));
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      const t = document.getElementById("app");
      if (!t) return;
      if (typeof SESS > "u" || !SESS) {
        const i = t.querySelector("#sdb");
        i && /n\xe3o est\xe1 conectado/.test(i.textContent || "") && i.remove();
      }
      if (
        (/Backup autom\xe1tico desligado/.test(
          (t.querySelector('section[data-hb="hero"]') || {}).textContent || "",
        ) &&
          [...t.querySelectorAll(":scope > .warn")].forEach((i) => {
            /backup/i.test(i.textContent || "") && i.remove();
          }),
        t.querySelector("#fdscard"))
      ) {
        const i = t.querySelector("#rvgb");
        i && i.remove();
      }
      if (document.body.classList.contains("pc") || t.querySelector(".hgr"))
        return;
      const a = (i) => t.querySelector(i),
        o = (i) => a(`section[data-hb="${i}"]`),
        s = o("posso"),
        n = o("lim"),
        r = a("#apc");
      (hgGrupo(
        t,
        "hg-hoje",
        "☀️ Hoje",
        "posso operar, plano e limites",
        [
          s && s.firstElementChild ? s : null,
          r,
          n && n.textContent.trim() ? n : null,
        ],
        !0,
      ),
        hgGrupo(
          t,
          "hg-pat",
          "💰 Patrimônio",
          "capital, curva e compartilhar",
          [o("cap"), a("#eqc"), a("#shrper")],
          !1,
        ),
        hgGrupo(
          t,
          "hg-prog",
          "🏆 Progresso",
          "sequências, metas e conquistas",
          [a("#stk"), o("metas"), a("#cqc")],
          !1,
        ));
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = TraderStyles.slot("legacy-069");
  ((e.textContent = TraderStyles.css("legacy-069")), TraderStyles.mount(e));
}
{
  const e = apHtml;
  apHtml = function () {
    const t = e.apply(this, arguments);
    try {
      return (((S.ax || {})["home.layout"] || {}).ocultos || []).includes(
        "posso",
      )
        ? t
        : t.replace(
            /<div style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><span style="width:22px;text-align:center">[^<]*<\/span><div style="flex:1"><span class="sm mut">(?:Trava|Resolver antes|Turno)<\/span><div class="[^"]*" style="font-weight:600">[^<]*<\/div><\/div><\/div>/g,
            "",
          );
    } catch {
      return t;
    }
  };
}
let UNDO = null;
function undoFim() {
  if (!UNDO) return;
  const e = UNDO;
  ((UNDO = null),
    clearTimeout(e.tm),
    document.getElementById("undobar")?.remove(),
    e.fotos.forEach((t) => {
      try {
        idb("img", "delete", t);
      } catch {}
    }));
}
(document.addEventListener(
  "click",
  (e) => {
    if (!e.target.closest('[data-a="deltrade"]') || !delArm || !T) return;
    (e.stopImmediatePropagation(), e.preventDefault(), undoFim());
    const t = S.trades.find((n) => n.id === T.id);
    if (!t) {
      closeSheet(1);
      return;
    }
    const a = S.trades.indexOf(t),
      o = ["pin", "pout", "pplan"].map((n) => t[n]).filter(Boolean);
    (S.trades.splice(a, 1),
      ((S.del ?? (S.del = {}))[t.id] = Date.now()),
      save(),
      closeSheet(1),
      render(),
      (UNDO = { t, i: a, fotos: o, tm: setTimeout(undoFim, 1e4) }));
    const s = document.createElement("div");
    ((s.id = "undobar"),
      (s.innerHTML = `<span>Trade ${esc(t.ativo || "")} excluído.</span><button data-undo="1">Desfazer</button>`),
      document.body.appendChild(s));
  },
  !0,
),
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-undo]") || !UNDO) return;
    const t = UNDO;
    ((UNDO = null),
      clearTimeout(t.tm),
      document.getElementById("undobar")?.remove(),
      S.del && delete S.del[t.t.id],
      (t.t.u = Date.now()),
      S.trades.splice(Math.min(t.i, S.trades.length), 0, t.t),
      save(),
      render(),
      toast("Trade de volta."));
  }));
{
  const e = TraderStyles.slot("legacy-070");
  ((e.textContent = TraderStyles.css("legacy-070")), TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v210";
try {
  HUB_M.some((t) => t[0] === "mercado:jr") ||
    HUB_M.unshift(["mercado:jr", "Jornal"]);
  const e = MGRP.find((t) => t[0] === "Hoje");
  e && !e[1].includes("mercado:jr") && e[1].unshift("mercado:jr");
} catch {}
const JRN = { v: null, busy: 0, err: "", ab: {}, fala: 0, tent: {} },
  JR_COR = {
    Mercados: "#ac8439",
    Macroeconomia: "#709bc2",
    "Juros e política monetária": "#b2aca0",
    "Contas públicas": "#c2943e",
    Empresas: "#37a46d",
    Internacional: "#a49d90",
    Commodities: "#806128",
    "Eleições e economia": "#e7614c",
    Câmbio: "#339966",
  },
  jrCor = (e) => JR_COR[e] || "var(--ac)";
async function jrCarrega(e) {
  if (!JRN.busy && !(!e && JRN.v && JRN.v.dia + JRN.v.edicao === jrAgoraK())) {
    ((JRN.busy = 1), (JRN.err = ""), jrPinta());
    try {
      const t = await anxCall({ modo: "jornal", force: !!e });
      if (t.erro) throw new Error(t.erro);
      if (!t.manchete)
        throw new Error(
          'Para ler o jornal, publique a função "analise" nova (v210) no Supabase.',
        );
      JRN.v = t;
      try {
        APP_STORAGE.setItem("diario-jornal", JSON.stringify(t));
      } catch {}
    } catch (t) {
      JRN.err = /modo|desconhecid|404|analise/i.test(String(t.message || t))
        ? 'Para ler o jornal, publique a função "analise" nova (v210) no Supabase.'
        : String(t.message || t);
    }
    ((JRN.busy = 0), jrPinta());
  }
}
try {
  const e = JSON.parse(APP_STORAGE.getItem("diario-jornal") || "null");
  e && e.manchete && (JRN.v = e);
} catch {}
function jrPinta() {
  if (tab === "mercado" && MKT.tab === "jr") {
    const e = document.getElementById("jrbox");
    if (e) e.innerHTML = jrCorpo();
    else {
      const t = scrollY;
      (render(), scrollTo(0, t));
    }
  }
}
const jrPar = (e) =>
    String(e || "")
      .split(/\n\s*\n/)
      .map((t) => `<p>${esc(t)}</p>`)
      .join(""),
  jrMin = (e) =>
    Math.max(1, Math.round(String(e || "").split(/\s+/).length / 200)),
  jrNums = (e) =>
    (e || []).length
      ? `<div class="jrnums">${e.map((t) => `<div><small>${esc(t.rotulo)}</small><b>${esc(t.valor)}</b></div>`).join("")}</div>`
      : "";
function jrMateria(e, t, a) {
  const o = a || JRN.ab[t];
  return `<article class="jrart${a ? " jrman" : ""}" id="jra-${t}"><div class="jrchap" style="color:${jrCor(e.editoria)}">${esc(e.editoria)}${e.chapeu ? " · " + esc(e.chapeu) : ""}</div>
<h2 class="jrtit">${esc(e.titulo)}</h2>${e.linha_fina ? `<div class="jrfina">${esc(e.linha_fina)}</div>` : ""}${a ? jrNums(e.numeros) : ""}
${o ? `<div class="jrtxt">${jrPar(e.texto)}</div>${a ? "" : jrNums(e.numeros)}${e.por_que_importa ? `<div class="jrpq"><b>Por que importa</b> ${esc(e.por_que_importa)}</div>` : ""}<div class="jrbar"><span class="sm mut">${jrMin(e.texto)} min de leitura</span><span><button class="btn s" data-jrouve="${t}">🔊 Ouvir</button> <button class="btn s" data-jrsh="${t}">Compartilhar</button>${a ? "" : ` <button class="btn s" data-jrab="${t}">Fechar</button>`}</span></div>` : `<button class="jrler" data-jrab="${t}">Ler a matéria · ${jrMin(e.texto)} min</button>`}</article>`;
}
function jrCorpo() {
  const e = JRN.v;
  if (!e)
    return JRN.busy
      ? '<div class="jrvaz">Fechando a edição: a redação está pesquisando os fatos do dia… (até 1 minuto)</div>'
      : `<div class="jrvaz">${esc(JRN.err || "Toque em atualizar para abrir a edição de hoje.")}</div>`;
  const t = new Date(
      (e.dia || loc().slice(0, 10)) + "T12:00",
    ).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    a = e.gerado
      ? new Date(e.gerado).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        })
      : "",
    o = (e.cotacoes || [])
      .map(
        (s) =>
          `<span class="jrind"><small>${esc(s.n || s.k)}</small><b>${s.px != null ? Number(s.px).toLocaleString("pt-BR", { maximumFractionDigits: s.px > 1e3 ? 0 : 2 }) : "–"}</b>${s.d1 != null ? `<i class="${s.d1 >= 0 ? "g" : "r"}">${s.d1 >= 0 ? "▲" : "▼"} ${Math.abs(s.d1).toFixed(2).replace(".", ",")}%</i>` : ""}</span>`,
      )
      .join("");
  return `<header class="jrcab"><div class="jrnome">Jornal do Pregão</div><div class="jrdata"><span class="cap1">${esc(t)}</span> · ${esc(e.nome || "")}${a ? " · fechada às " + a : ""}</div></header>
${o ? `<div class="jrinds">${o}</div>` : ""}${JRN.err ? `<div class="warn sm">${esc(JRN.err)}</div>` : ""}
${jrMateria(e.manchete, "m", !0)}
${(e.em_poucas_linhas || []).length ? `<section class="jrsec"><h3>Em poucas linhas</h3><ul class="jrpl">${e.em_poucas_linhas.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>` : ""}
<section class="jrsec"><h3>Mais do dia</h3>${(e.materias || []).map((s, n) => jrMateria(s, n)).join("")}</section>
${e.analise ? `<section class="jrsec jranal"><h3>Análise</h3><h2 class="jrtit">${esc(e.analise.titulo)}</h2><div class="jrtxt">${jrPar(e.analise.texto)}</div><div class="sm mut">Análise da redação, com os dados do dia. Não é recomendação de investimento.</div></section>` : ""}
${(e.agenda || []).length ? `<section class="jrsec"><h3>Agenda</h3>${e.agenda.map((s) => `<div class="jrag"><b>${esc(s.quando || "")}</b><div><div>${esc(s.evento)}</div>${s.por_que ? `<div class="sm mut">${esc(s.por_que)}</div>` : ""}</div></div>`).join("")}<button class="btn s" data-hub="mercado:ag" style="margin-top:6px">Agenda completa</button></section>` : ""}
<section class="jrsec"><h3>Giro do pregão</h3><div class="sm mut" style="margin-bottom:6px">Os boletins da pré-abertura, do meio do dia e do fechamento continuam no Giro.</div><button class="btn s" data-hub="mercado:giro">Abrir o Giro</button></section>
${
  (e.manchetes_externas || []).length
    ? `<section class="jrsec"><h3>Na imprensa</h3><div class="sm mut" style="margin-bottom:6px">Manchetes de outros veículos usadas como pista pela redação (os textos acima são próprios). Para ler as matérias originais, veja a aba Notícias.</div>${e.manchetes_externas
        .slice(0, 12)
        .map(
          (s) =>
            `<div class="jrimp"><span class="sm mut">${new Date(s.d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} · ${esc(s.f)}</span><div>${esc(s.t)}</div></div>`,
        )
        .join("")}</section>`
    : ""
}
${(e.fontes || []).length ? `<div class="sm mut jrfont">Fontes: ${e.fontes.map((s) => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.titulo || "link")}</a>` : esc(s.titulo))).join(" · ")}</div>` : ""}
<div class="sm mut" style="margin-top:8px">Edição escrita pela IA com pesquisa na internet e os números do app. Confira os fatos antes de repassar. Não é recomendação de investimento.</div>`;
}
function vJornal() {
  if (!JRN.v && !JRN.busy && !JRN.err) setTimeout(() => jrCarrega(!1), 0);
  else if (JRN.v && !JRN.busy) {
    const e = JRN.v.dia + JRN.v.edicao,
      t = jrAgoraK();
    e !== t &&
      !JRN.tent[t] &&
      ((JRN.tent[t] = 1), setTimeout(() => jrCarrega(!1), 0));
  }
  return `<div class="card jrcard"><div class="top"><b>📰 Jornal</b><button class="btn s" data-jrrf="1">${JRN.busy ? "…" : "↻ Atualizar"}</button></div><div id="jrbox">${jrCorpo()}</div></div>`;
}
var jrAgoraK;
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab === "jr" ? vJornal() : e.apply(this, arguments);
  };
}
function jrTexto(e) {
  const t = JRN.v;
  if (!t) return null;
  const a = e === "m" ? t.manchete : (t.materias || [])[+e];
  return a
    ? `${a.titulo}. ${a.linha_fina || ""}. ${a.texto} ${a.por_que_importa ? "Por que importa: " + a.por_que_importa : ""}`
    : null;
}
function jrOuve(e) {
  try {
    const t = window.speechSynthesis;
    if (!t) return toast("Este aparelho não lê em voz alta.");
    if (JRN.fala) {
      (t.cancel(), (JRN.fala = 0), jrPinta());
      return;
    }
    const a = jrTexto(e);
    if (!a) return;
    const o = a.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [a],
      s = (t.getVoices() || []).find((i) => /^pt(-|_)BR/i.test(i.lang));
    JRN.fala = 1;
    let n = 0;
    const r = () => {
      if (!JRN.fala || n >= o.length) {
        JRN.fala = 0;
        return;
      }
      const i = new SpeechSynthesisUtterance(o[n++].trim());
      ((i.lang = "pt-BR"),
        s && (i.voice = s),
        (i.rate = 1.02),
        (i.onend = r),
        (i.onerror = r),
        t.speak(i));
    };
    (t.cancel(), r());
  } catch {
    toast("Não consegui ler em voz alta.");
  }
}
document.addEventListener("click", (e) => {
  const t = (o) => e.target.closest(o);
  let a;
  if (t("[data-jrrf]")) {
    jrCarrega(!0);
    return;
  }
  if ((a = t("[data-jrab]"))) {
    const o = a.dataset.jrab;
    ((JRN.ab[o] = !JRN.ab[o]),
      jrPinta(),
      JRN.ab[o] &&
        setTimeout(
          () =>
            document
              .getElementById("jra-" + o)
              ?.scrollIntoView({ block: "start", behavior: "smooth" }),
          60,
        ));
    return;
  }
  if ((a = t("[data-jrouve]"))) {
    jrOuve(a.dataset.jrouve);
    return;
  }
  if ((a = t("[data-jrsh]"))) {
    const o = jrTexto(a.dataset.jrsh);
    if (!o) return;
    const s =
      o +
      `

— Jornal do Pregão (Diário de Trader)`;
    navigator.share
      ? navigator.share({ text: s }).catch(() => {})
      : navigator.clipboard?.writeText(s).then(() => toast("Matéria copiada."));
  }
});
try {
  typeof MKT < "u" && !MKT.ultM && (MKT.ultM = "jr");
} catch {}
{
  const e = TraderStyles.slot("legacy-071");
  ((e.textContent = TraderStyles.css("legacy-071")), TraderStyles.mount(e));
}
((FN_ESPERADA.analise = "v211"), (FN_ESPERADA.notificar = "v211"));
const GR_SL = [
  ["07", "7h", "Giro das 7h", 420],
  ["0910", "9h10", "Abertura do futuro (9h10)", 550],
  ["10", "10h", "Abertura da bolsa (10h)", 600],
  ["12", "12h", "Giro do meio-dia", 720],
  ["15", "15h", "Giro das 15h", 900],
  ["1720", "17h20", "Fechamento (17h20)", 1040],
];
GR_SL.forEach(([e, , t]) => {
  GR_N[e] = t;
});
function grSlot() {
  const e = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
    ),
    t = e.getHours() * 60 + e.getMinutes();
  let a = null;
  return (
    GR_SL.forEach((o) => {
      t >= o[3] && (a = o[0]);
    }),
    a
  );
}
const grIdx = (e) => GR_SL.findIndex((t) => t[0] === e);
((grCarrega = async function (e, t) {
  const a = loc().slice(0, 10),
    o = a + e;
  if (GR.busy || (!t && GR.v[o])) return;
  const s = grSlot();
  if (!t && (s == null || grIdx(e) > grIdx(s))) {
    ((GR.err[o] =
      `O ${(GR_N[e] || "giro").toLowerCase()} sai às ${GR_SL[grIdx(e)][1]}.`),
      grPinta());
    return;
  }
  ((GR.busy = e), (GR.err[o] = ""), grPinta());
  try {
    const n = await anxCall({ modo: "giro", slot: e, force: !!t });
    GR.v[o] = n;
  } catch (n) {
    GR.err[o] = String(n.message || n);
  }
  ((GR.busy = ""), grPinta());
}),
  (vGiro = function () {
    const e = grSlot();
    (!GR.j || grIdx(GR.j) < 0) && (GR.j = e || "07");
    const t = GR.j;
    return (
      setTimeout(() => grCarrega(t), 0),
      `<div class="card"><div class="top"><b>📰 Giro do mercado</b><span class="sm mut">6 por dia</span></div>
  <div class="seg grsl" style="margin:8px 0">${GR_SL.map(([a, o]) => {
    const s = e == null || grIdx(a) > grIdx(e);
    return `<button class="${t === a ? "on" : ""}${s ? " grfut" : ""}" data-grj="${a}">${o}</button>`;
  }).join("")}</div>
  <div class="sm mut" style="margin:-2px 0 6px">${esc(GR_N[t] || "")}</div><div id="grbox">${grCorpo()}</div></div>`
    );
  }));
{
  const e = grCorpo;
  grCorpo = function () {
    (!GR.j || grIdx(GR.j) < 0) && (GR.j = grSlot() || "07");
    let t = e.apply(this, arguments);
    try {
      GR.j === grSlot() &&
        !/data-gr="rf"/.test(t) &&
        (t = t.replace(
          '<button class="btn s" data-gr="sh">',
          '<button class="btn s" data-gr="rf">↻ Atualizar</button><button class="btn s" data-gr="sh">',
        ));
    } catch {}
    return t;
  };
}
try {
  GR_SL.forEach(([e, , t]) => {
    DG_NOME["giro:" + e] = t;
  });
} catch {}
{
  const e = TraderStyles.slot("legacy-072");
  ((e.textContent = TraderStyles.css("legacy-072")), TraderStyles.mount(e));
}
try {
  const e = MGRP.find((a) => a[0] === "Hoje"),
    t = MGRP.findIndex((a) => a[0] === "Juros");
  if (e) {
    const a = ["juros", "mercado:jedu"].filter((s) =>
      HUB_M.some((n) => n[0] === s),
    );
    e[1] = e[1].filter((s) => !a.includes(s));
    const o = e[1].indexOf("mercado:mu");
    e[1].splice(o < 0 ? e[1].length : o + 1, 0, ...a);
  }
  t >= 0 && MGRP.splice(t, 1);
} catch {}
((FN_ESPERADA.analise = "v213"), (FN_ESPERADA.notificar = "v213"));
try {
  const e = MGRP.find((a) => a[0] === "Hoje");
  e && (e[1] = e[1].filter((a) => a !== "juros"));
  const t = HUB_M.findIndex((a) => a[0] === "juros");
  t >= 0 && HUB_M.splice(t, 1);
} catch {}
{
  const e = vMercado;
  vMercado = function () {
    const t = e.apply(this, arguments);
    if (MKT.tab !== "mu") return t;
    let a = "";
    try {
      a = vJuros().replace(
        "<h1>Juros e DI</h1>",
        '<h2 class="mujrh" style="margin:22px 0 8px">💹 Juros e DI</h2>',
      );
    } catch {}
    return t + `<div id="mujr">${a}</div>`;
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      tab === "mercado" &&
        MKT.tab === "mu" &&
        document.getElementById("mujr") &&
        setTimeout(jrAfter, 0);
    } catch {}
  };
}
((GOR.jurosmu = () => {
  ((GO.r = null),
    (MKT.tab = "mu"),
    irPara("mercado"),
    setTimeout(
      () => document.getElementById("mujr")?.scrollIntoView({ block: "start" }),
      150,
    ));
}),
  (GOR.jornal = () => {
    tab === "mercado" && ((GO.r = null), (MKT.tab = "jr"), render());
  }));
try {
  if (typeof NP < "u") {
    NP.on = NP.on || {};
    let e = 0;
    (NP.on.jr === void 0 && ((NP.on.jr = !0), (e = 1)),
      NP.on.pl === void 0 && ((NP.on.pl = !0), (e = 1)),
      e && ls.set("diario-np", NP));
  }
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("jr", "📰 Jornal do Pregão pronto (6h30; fim de semana 8h)")}<div class="sm mut" style="margin-bottom:8px">Chega com a manchete do dia. Toque para abrir a edição.</div>${t("pl", "⚡ Plantão dos indicadores")}<div class="sm mut" style="margin-bottom:8px">Uma matéria curta uns 15 minutos depois de cada dado forte do Brasil e dos EUA (IPCA, Copom, payroll, CPI, Fed…), com o número divulgado e a reação.</div>`
    );
  };
}
try {
  ((DG_NOME.jornal = "Jornal 6h30"), (DG_NOME.plantao = "Plantão"));
} catch {}
((JRN.arq = null), (JRN.pv = {}), (JRN.pl = []), (JRN.plTs = 0), (JRN.g = {}));
const jrVer = () => JRN.arq || JRN.v,
  jrK = (e) => (e ? (e.dia || "") + (e.edicao || "") : "");
function jrMeusAtivos() {
  const e = new Set();
  try {
    S.trades
      .filter((t) => isOpen(t) && t.ativo)
      .forEach((t) => e.add(String(t.ativo).toUpperCase()));
  } catch {}
  try {
    (S.olho || []).forEach((t) => t && t.a && e.add(String(t.a).toUpperCase()));
  } catch {}
  try {
    const t = {};
    (((S.cart || {}).lanc || []).forEach((a) => {
      a.tk &&
        (t[a.tk] = (t[a.tk] || 0) + (a.tp === "V" ? -1 : 1) * (+a.q || 1));
    }),
      Object.keys(t)
        .filter((a) => t[a] > 0)
        .forEach((a) => e.add(String(a).toUpperCase())));
  } catch {}
  return [...e].slice(0, 25);
}
function jrResumoEd(e) {
  const t = (a) =>
    `${a.editoria}: ${a.titulo}. ${a.linha_fina || ""} ${a.por_que_importa || ""}`;
  return [
    t(e.manchete),
    ...(e.materias || []).map(t),
    ...(e.em_poucas_linhas || []).map((a) => "• " + a),
  ]
    .join(
      `
`,
    )
    .slice(0, 6500);
}
const JRV_LS = "diario-jr-voce";
try {
  const e = JSON.parse(APP_STORAGE.getItem(JRV_LS) || "null");
  e && e.k && (JRN.pv[e.k] = e);
} catch {}
async function jrVoce(e) {
  const t = JRN.v;
  if (!t || JRN.pvBusy) return;
  const a = jrMeusAtivos(),
    o = jrK(t),
    s = a.join(","),
    n = JRN.pv[o];
  if (!(!e && n && (n.sig === s || n.err))) {
    if (!a.length) {
      ((JRN.pv[o] = { k: o, sig: s, itens: [], vazio: 1 }), jrPvPinta());
      return;
    }
    ((JRN.pvBusy = 1), jrPvPinta());
    try {
      const r = await anxCall({
        modo: "jornal_voce",
        ativos: a,
        edicao: jrResumoEd(t),
      });
      if (r.erro) throw new Error(r.erro);
      if (!Array.isArray(r.itens))
        throw new Error(
          'Publique a função "analise" nova (v213) para ver o Para você.',
        );
      JRN.pv[o] = { k: o, sig: s, itens: r.itens, resumo: r.resumo || "" };
      try {
        APP_STORAGE.setItem(JRV_LS, JSON.stringify(JRN.pv[o]));
      } catch {}
    } catch (r) {
      JRN.pv[o] = {
        k: o,
        sig: s,
        itens: [],
        err: /modo|desconhecid|404/i.test(String(r.message || r))
          ? 'Publique a função "analise" nova (v213) para ver o Para você.'
          : String(r.message || r),
      };
    }
    ((JRN.pvBusy = 0), jrPvPinta());
  }
}
function jrPvHtml() {
  if (JRN.arq) return "";
  const e = JRN.v;
  if (!e) return "";
  const t = JRN.pv[jrK(e)];
  let a;
  return (
    JRN.pvBusy
      ? (a =
          '<div class="sm mut">Ligando a edição de hoje aos seus ativos…</div>')
      : t
        ? t.vazio
          ? (a =
              '<div class="sm mut">Adicione ativos na Lista de olho ou na Carteira, ou tenha um trade aberto, para a redação ligar as notícias a eles.</div>')
          : t.err
            ? (a = `<div class="sm am">${esc(t.err)}</div>`)
            : (a =
                (t.itens.length
                  ? t.itens
                      .map(
                        (o) =>
                          `<div class="jrpvi"><b>${esc(o.ativo)}</b><div>${esc(o.texto)}</div></div>`,
                      )
                      .join("")
                  : "") +
                  (t.resumo
                    ? `<div class="sm mut" style="margin-top:4px">${esc(t.resumo)}</div>`
                    : "") ||
                '<div class="sm mut">Nada da edição de hoje mexe diretamente com os seus ativos.</div>')
        : (a = '<div class="sm mut">…</div>'),
    `<section class="jrsec jrpv"><h3>🎯 Para você</h3>${a}<div class="sm mut" style="margin-top:6px">Relaciona a edição com os seus ativos (trades abertos, Lista de olho e Carteira). Não é recomendação.${t && !JRN.pvBusy ? ' <button class="lnk" data-jrpv="1">Refazer</button>' : ""}</div></section>`
  );
}
function jrPvPinta() {
  const e = document.querySelector("#jrbox .jrpv");
  e && (e.outerHTML = jrPvHtml());
}
const JR_GL = {
    Selic:
      "Taxa básica de juros da economia, definida pelo Copom. Serve de referência para empréstimos, financiamentos e aplicações.",
    Copom:
      "Comitê de Política Monetária do Banco Central. Reúne-se a cada 45 dias para decidir a Selic.",
    "IPCA-15":
      "Prévia da inflação oficial, medida do meio do mês anterior ao meio do mês de referência.",
    IPCA: "Índice oficial de inflação do Brasil, medido pelo IBGE. É a referência da meta de inflação.",
    "IGP-M":
      "Índice de preços da FGV muito usado em contratos de aluguel. Pesa bastante preço no atacado e commodities.",
    PIB: "Produto Interno Bruto: a soma de tudo o que o país produz. Mede o tamanho e o crescimento da economia.",
    "IBC-Br":
      "Índice de atividade do Banco Central, uma espécie de prévia mensal do PIB.",
    "DI futuro":
      "Contrato da B3 que mostra a taxa de juros que o mercado espera para cada data futura.",
    "curva de juros":
      "As taxas de juros de vários prazos lado a lado. Inclinada para cima: o mercado espera juros mais altos à frente.",
    "juros futuros":
      "As taxas negociadas hoje para datas futuras (DI futuro). Mostram o que o mercado espera da Selic.",
    "juro real":
      "Juro descontada a inflação. É o ganho de verdade de quem empresta.",
    "inflação implícita":
      "Inflação que o mercado espera, tirada da diferença entre título prefixado e título atrelado ao IPCA.",
    "NTN-B":
      "Título do Tesouro que paga IPCA mais uma taxa fixa (Tesouro IPCA+).",
    "Tesouro Direto":
      "Programa para pessoas físicas comprarem títulos públicos.",
    "superávit primário":
      "Quando o governo arrecada mais do que gasta, sem contar os juros da dívida.",
    "déficit primário":
      "Quando o governo gasta mais do que arrecada, sem contar os juros da dívida.",
    "arcabouço fiscal":
      "Regra que limita o crescimento dos gastos do governo e define metas para as contas públicas.",
    "dívida bruta":
      "Tudo o que o governo deve. Medida em % do PIB, é a principal régua de risco fiscal.",
    fiscal:
      "Tudo o que envolve as contas do governo: arrecadação, gastos e dívida.",
    Focus:
      "Pesquisa semanal do Banco Central com as projeções do mercado para inflação, PIB, Selic e dólar.",
    CDI: "Taxa dos empréstimos entre bancos, quase igual à Selic. Referência da renda fixa.",
    DXY: "Índice do dólar contra seis moedas fortes (euro, iene, libra…). Sobe quando o dólar ganha força no mundo.",
    Treasuries:
      "Títulos do Tesouro americano. O rendimento deles influencia juros e moedas no mundo todo.",
    Fed: "Federal Reserve, o banco central dos Estados Unidos.",
    payroll:
      "Relatório mensal de empregos dos EUA (criação de vagas fora do setor agrícola). Mexe muito com juros e dólar.",
    CPI: "Índice de preços ao consumidor dos EUA, a inflação americana.",
    PCE: "Medida de inflação preferida pelo Fed, ligada aos gastos das famílias americanas.",
    PMI: "Pesquisa com gerentes de compras. Acima de 50 indica atividade crescendo; abaixo, encolhendo.",
    Ibovespa:
      "Principal índice da bolsa brasileira, com as ações mais negociadas.",
    "mini índice":
      "Contrato futuro (WIN) que acompanha o Ibovespa, muito usado no day trade.",
    "mini dólar":
      "Contrato futuro (WDO) do dólar, em pontos. 5.400 pontos = R$ 5,40.",
    "fluxo estrangeiro":
      "Dinheiro de investidores de fora entrando ou saindo da bolsa brasileira.",
    "risco-país":
      "Quanto o mercado cobra a mais para emprestar ao Brasil do que aos EUA. Medido pelo CDS.",
    CDS: "Seguro contra calote de um país ou empresa. Quanto mais caro, maior o risco percebido.",
    spread:
      "Diferença entre duas taxas ou preços, como entre o juro cobrado e o pago pelo banco.",
    hawkish:
      "Postura dura de um banco central, inclinado a subir ou manter juros altos contra a inflação.",
    dovish: "Postura branda de um banco central, inclinado a cortar juros.",
    "política monetária":
      "Ações do banco central sobre juros e dinheiro em circulação para controlar a inflação.",
    "política fiscal": "Decisões do governo sobre impostos e gastos.",
    "balança comercial":
      "Exportações menos importações. Superávit quando o país vende mais do que compra.",
    "conta corrente":
      "Tudo o que o país recebe e paga ao exterior: comércio, serviços, juros e lucros.",
    commodities:
      "Matérias-primas negociadas no mundo todo, como petróleo, minério, soja e ouro.",
    Brent:
      "Petróleo de referência internacional, negociado em Londres. Influencia o preço da Petrobras.",
    "minério de ferro":
      "Principal produto da Vale. O preço segue muito a demanda da China.",
    dividendos: "Parte do lucro que a empresa distribui aos acionistas.",
    Ebitda:
      "Lucro antes de juros, impostos, depreciação e amortização. Mostra o resultado da operação.",
    "lucro líquido":
      "O que sobra para a empresa depois de todos os custos, juros e impostos.",
    valuation: "Estimativa de quanto uma empresa vale.",
    "carry trade":
      "Pegar dinheiro barato num país e aplicar onde o juro é mais alto, como no Brasil.",
    volatilidade:
      "Tamanho das oscilações de preço. Alta volatilidade = movimentos maiores e mais risco.",
    VIX: "Índice do medo de Wall Street, tirado das opções do S&P 500.",
    "termos de troca":
      "Relação entre preços das exportações e das importações de um país.",
    BCE: "Banco Central Europeu.",
    rating:
      "Nota de crédito dada por agências (S&P, Moody's, Fitch). Quanto melhor, menor o juro cobrado.",
    recessão:
      "Queda da atividade econômica. Costuma ser marcada por dois trimestres seguidos de PIB negativo.",
    estagflação: "Economia parada com inflação alta ao mesmo tempo.",
    núcleo:
      "Medida de inflação que tira os itens mais voláteis, como alimentos e energia.",
    IOF: "Imposto sobre operações financeiras, como câmbio, crédito e seguros.",
    Caged:
      "Cadastro do Ministério do Trabalho com as vagas formais abertas e fechadas no mês.",
    "S&P 500": "Índice com as 500 maiores empresas da bolsa americana.",
  },
  JR_GLK = Object.keys(JR_GL).sort((e, t) => t.length - e.length),
  jrGlRe = JR_GLK.map((e) => [
    e,
    new RegExp(
      "(^|[^\\p{L}\\p{N}])(" +
        e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        ")(?![\\p{L}\\p{N}-])",
      "iu",
    ),
  ]);
function glMarca(e) {
  const t = new Set(),
    a = [];
  return e
    .split(/(<[^>]+>)/)
    .map((o) => {
      if (!o || o[0] === "<") return o;
      let s = o;
      for (const [n, r] of jrGlRe) {
        if (t.has(n)) continue;
        const i = r.exec(s);
        if (!i) continue;
        t.add(n);
        const l = i.index + i[1].length;
        (a.push(`<span class="jrgl" data-gl="${esc(n)}">${i[2]}</span>`),
          (s =
            s.slice(0, l) +
            "" +
            (a.length - 1) +
            "" +
            s.slice(l + i[2].length)));
      }
      return s;
    })
    .join("")
    .replace(/\u0001(\d+)\u0002/g, (o, s) => a[+s]);
}
(document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest("[data-gl]"),
      a = document.getElementById("glpop");
    if (!t) {
      a && !e.target.closest("#glpop") && a.remove();
      return;
    }
    (e.stopPropagation(), a && a.remove());
    const o = t.dataset.gl,
      s = JR_GL[o];
    if (!s) return;
    const n = document.createElement("div");
    ((n.id = "glpop"),
      (n.innerHTML = `<b>${esc(o)}</b><div>${esc(s)}</div>`),
      document.body.appendChild(n));
    const r = t.getBoundingClientRect(),
      i = Math.min(300, innerWidth - 24);
    ((n.style.width = i + "px"),
      (n.style.left =
        Math.max(
          12,
          Math.min(innerWidth - i - 12, r.left + r.width / 2 - i / 2),
        ) + "px"));
    const l =
      r.bottom + 8 + n.offsetHeight > innerHeight
        ? r.top - 8 - n.offsetHeight
        : r.bottom + 8;
    n.style.top = Math.max(8, l) + "px";
  },
  !0,
),
  addEventListener(
    "scroll",
    () => {
      const e = document.getElementById("glpop");
      e && e.remove();
    },
    { passive: !0 },
  ));
function jrTextoEd(e) {
  if (!e) return "";
  const t = (a) => `${a.titulo}. ${a.linha_fina || ""}. ${a.texto}`;
  return [
    `Jornal do Pregão. ${e.nome || ""}.`,
    "Manchete. " + t(e.manchete),
    ...(e.materias || []).map(
      (a, o) =>
        `${o ? "Próxima matéria" : "Mais do dia"}. ${a.editoria}. ` + t(a),
    ),
    e.analise ? `Análise. ${e.analise.titulo}. ${e.analise.texto}` : "",
  ].filter(Boolean).join(`\u0020
`);
}
function jrFala(e, t) {
  try {
    const a = window.speechSynthesis;
    if (!a) return toast("Este aparelho não lê em voz alta.");
    if (JRN.fala) {
      (a.cancel(), (JRN.fala = 0), jrBtnFala());
      return;
    }
    const o = e.match(/[^.!?\n]+[.!?\n]+|\S[^.!?\n]*$/g) || [e],
      s = (a.getVoices() || []).find((i) => /^pt(-|_)BR/i.test(i.lang));
    JRN.fala = t || 1;
    let n = 0;
    jrBtnFala();
    const r = () => {
      if (!JRN.fala || n >= o.length) {
        ((JRN.fala = 0), jrBtnFala());
        return;
      }
      const i = o[n++].trim();
      if (!i) return r();
      const l = new SpeechSynthesisUtterance(i);
      ((l.lang = "pt-BR"),
        s && (l.voice = s),
        (l.rate = 1.02),
        (l.onend = r),
        (l.onerror = r),
        a.speak(l));
    };
    (a.cancel(), r());
  } catch {
    toast("Não consegui ler em voz alta.");
  }
}
function jrBtnFala() {
  const e = document.querySelector("[data-jrtudo]");
  e &&
    (e.textContent =
      JRN.fala === "ed" ? "⏹ Parar a leitura" : "🔊 Ouvir a edição");
}
async function jrPlantoes(e) {
  if (!(JRN.arq || (!e && Date.now() - JRN.plTs < 5 * 6e4))) {
    JRN.plTs = Date.now();
    try {
      const t = await anxCall({ modo: "plantoes" });
      if (Array.isArray(t.itens)) {
        JRN.pl = t.itens.filter((o) => o && o.titulo && o.id);
        const a = document.querySelector("#jrbox .jrplw");
        a && (a.outerHTML = jrPlHtml());
      }
    } catch {}
  }
}
function jrPlHtml() {
  return JRN.arq || !JRN.pl.length
    ? '<div class="jrplw"></div>'
    : `<div class="jrplw"><section class="jrsec jrpl2"><h3>⚡ Plantão</h3>${JRN.pl
        .map((e, t) => {
          const a = "p" + t,
            o = JRN.ab[a],
            s = e.em
              ? new Date(e.em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                })
              : "";
          return `<article class="jrplit"><div class="jrchap" style="color:#e7614c">Plantão${s ? " · " + s : ""}${e.pais ? " · " + esc(e.pais) : ""}</div><h4>${esc(e.titulo)}</h4>${e.linha_fina ? `<div class="jrfina">${esc(e.linha_fina)}</div>` : ""}${jrNums(e.numeros)}
${o ? `<div class="jrtxt">${glMarca(jrPar(e.texto))}</div><button class="jrler" data-jrab="${a}">Fechar</button>` : `<button class="jrler" data-jrab="${a}">Ler</button>`}</article>`;
        })
        .join("")}</section></div>`;
}
const JRA_LS = "diario-jr-arq";
function jrArqLe() {
  try {
    const e = JSON.parse(APP_STORAGE.getItem(JRA_LS) || "[]");
    return Array.isArray(e) ? e : [];
  } catch {
    return [];
  }
}
function jrArqGuarda(e) {
  if (!e || !e.manchete) return;
  const t = jrK(e),
    a = jrArqLe();
  if (a.length && a[0].k === t && a[0].g === e.gerado) return;
  const { manchetes_externas: o, cache: s, ...n } = e,
    r = [
      { k: t, g: e.gerado || "", v: n },
      ...a.filter((i) => i.k !== t),
    ].slice(0, 30);
  for (let i = r.length; i > 0; i--)
    try {
      APP_STORAGE.setItem(JRA_LS, JSON.stringify(r.slice(0, i)));
      return;
    } catch {}
}
const jrNomeEd = (e) =>
  `${new Date((e.dia || "") + "T12:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} · ${e.nome || e.edicao || ""}`;
function jrArqLista(e) {
  const t = jrArqLe(),
    a = jrK(JRN.v);
  e = enNormTx(e);
  const o = t
    .filter((s) => s.k !== a || JRN.arq)
    .map((s) => {
      const n = s.v;
      if (!e) return { x: s, hit: "" };
      const r = [n.manchete, ...(n.materias || [])],
        i = r.find((l) =>
          enNormTx(l.titulo + " " + l.linha_fina + " " + l.texto).includes(e),
        );
      return i ? { x: s, hit: i.titulo } : null;
    })
    .filter(Boolean);
  return t.length
    ? o.length
      ? o
          .slice(0, 30)
          .map(
            ({ x: s, hit: n }) =>
              `<button class="jrarqi" data-jrarq="${esc(s.k)}"><small>${esc(jrNomeEd(s.v))}</small><b>${esc(s.v.manchete.titulo)}</b>${n && n !== s.v.manchete.titulo ? `<span class="sm mut">Encontrado em: ${esc(n)}</span>` : ""}</button>`,
          )
          .join("")
      : `<div class="sm mut">${e ? "Nada encontrado nas edições guardadas." : "Ainda não há edições anteriores guardadas neste aparelho."}</div>`
    : '<div class="sm mut">As edições que você abrir ficam guardadas aqui (até 30).</div>';
}
const enNormTx = (e) =>
  String(e || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
function jrArqHtml() {
  return `<section class="jrsec jrarq"><h3>🗂️ Arquivo</h3><input id="jrarqq" type="search" placeholder="Buscar nas edições anteriores (ex.: Copom, Petrobras)" value="${esc(JRN.arqQ || "")}" autocomplete="off"><div id="jrarql">${jrArqLista(JRN.arqQ || "")}</div></section>`;
}
document.addEventListener("input", (e) => {
  if (e.target.id !== "jrarqq") return;
  JRN.arqQ = e.target.value;
  const t = document.getElementById("jrarql");
  t && (t.innerHTML = jrArqLista(JRN.arqQ));
});
const JRG_TK = {
  win: ["WIN", "Mini índice · hoje (5 min)", 1],
  wdo: ["WDO", "Dólar futuro · hoje (5 min, R$)", 1e3],
};
async function jrGraf(e) {
  const t = JRN.g[e];
  if (t && (t.busy || Date.now() - t.ts < 5 * 6e4)) return;
  const a = cfg();
  if (a) {
    JRN.g[e] = { busy: 1, ts: Date.now(), d: t && t.d };
    try {
      const o = await fetch(a.url + "/functions/v1/candles", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: a.key },
          body: JSON.stringify({ ativo: JRG_TK[e][0], intervalo: "5m" }),
        }),
        s = await o.json();
      if (!o.ok) throw new Error(s.error || "Erro " + o.status);
      const n = (s.candles || []).filter((i) => Array.isArray(i) && i[4] > 0),
        r = n.length ? brtDia(n[n.length - 1][0]) : "";
      JRN.g[e] = {
        ts: Date.now(),
        d: n.filter((i) => brtDia(i[0]) === r),
        dia: r,
      };
    } catch (o) {
      JRN.g[e] = { ts: Date.now(), err: String(o.message || o) };
    }
    document
      .querySelectorAll(`.jrgr[data-g="${e}"]`)
      .forEach((o) => (o.outerHTML = jrGrafHtml(e)));
  }
}
function jrGrafHtml(e) {
  if (e === "di") {
    let n = "";
    try {
      n =
        JR.data && JR.data.curva && JR.data.curva.length > 1
          ? j2CurvaSvg(JR.data.curva)
          : "";
    } catch {}
    if (!n)
      try {
        (jrLoad(!1),
          setTimeout(
            () =>
              document
                .querySelectorAll('.jrgr[data-g="di"]')
                .forEach((r) => (r.outerHTML = jrGrafHtml("di"))),
            4e3,
          ));
      } catch {}
    return `<figure class="jrgr" data-g="di"><figcaption>Curva de juros (DI futuro)</figcaption>${n || '<div class="sm mut">Carregando a curva…</div>'}</figure>`;
  }
  const t = JRN.g[e],
    [, a, o] = JRG_TK[e];
  (!t || (!t.d && !t.err)) && setTimeout(() => jrGraf(e), 0);
  let s;
  if (t && t.d && t.d.length > 1) {
    const n = t.d,
      r = n[0][1] / o,
      i = n[n.length - 1][4] / o,
      l = (i / r - 1) * 100,
      d = (c) =>
        c.toLocaleString("pt-BR", {
          minimumFractionDigits: o > 1 ? 4 : 0,
          maximumFractionDigits: o > 1 ? 4 : 0,
        });
    s = `${jrSpark(n, o)}<div class="jrgrl"><span>Abertura ${d(r)}</span><b class="${l >= 0 ? "g" : "r"}">${d(i)} (${l >= 0 ? "+" : ""}${l.toFixed(2).replace(".", ",")}%)</b></div>${t.dia && t.dia !== loc().slice(0, 10) ? `<div class="sm mut">Pregão de ${t.dia.slice(8, 10)}/${t.dia.slice(5, 7)}</div>` : ""}`;
  } else
    s = `<div class="sm mut">${t && t.err ? "Gráfico indisponível agora." : "Carregando…"}</div>`;
  return `<figure class="jrgr" data-g="${e}"><figcaption>${a}</figcaption>${s}</figure>`;
}
const JRG_ED = {
  Mercados: "win",
  "Eleições e economia": "win",
  Empresas: "win",
  Câmbio: "wdo",
  Internacional: "wdo",
  "Juros e política monetária": "di",
  Macroeconomia: "di",
  "Contas públicas": "di",
};
function jrGrafSec() {
  return `<section class="jrsec"><h3>📈 Gráficos do dia</h3><div class="jrgrs">${jrGrafHtml("win")}${jrGrafHtml("wdo")}${jrGrafHtml("di")}</div></section>`;
}
const JR_LIVE = {
  ibov: "^BVSP",
  dolar: "BRL=X",
  dxy: "DX-Y.NYB",
  spx: "^GSPC",
  ndq: "^IXIC",
  dji: "^DJI",
  wti: "CL=F",
  ouro: "GC=F",
  btc: "BTC-USD",
};
function jrIndsHtml(e) {
  let t = 0;
  const a = (window.tapeDados && window.tapeDados()) || {};
  return {
    h: (e.cotacoes || [])
      .map((o) => {
        let s = o.px,
          n = o.d1;
        const r = !JRN.arq && JR_LIVE[o.k],
          i = r && a[r];
        return (
          i &&
            i.px != null &&
            ((s = +i.px), (n = i.chg != null ? +i.chg : n), (t = 1)),
          `<span class="jrind"><small>${esc(o.n || o.k)}</small><b>${s != null ? Number(s).toLocaleString("pt-BR", { maximumFractionDigits: s > 1e3 ? 0 : o.k === "dolar" ? 4 : 2 }) : "–"}</b>${n != null ? `<i class="${n >= 0 ? "g" : "r"}">${n >= 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(2).replace(".", ",")}%</i>` : ""}</span>`
        );
      })
      .join(""),
    viv: t,
  };
}
setInterval(() => {
  try {
    if (
      document.hidden ||
      JRN.arq ||
      tab !== "mercado" ||
      MKT.tab !== "jr" ||
      !JRN.v
    )
      return;
    const e = document.getElementById("jrinds");
    if (!e) return;
    const t = jrIndsHtml(JRN.v);
    e.innerHTML = t.h;
    const a = document.getElementById("jrviv");
    (a && (a.hidden = !t.viv), jrPlantoes(!1));
  } catch {}
}, 2e4);
{
  const e = jrTexto;
  jrTexto = function (t) {
    if (!JRN.arq) return e.apply(this, arguments);
    const a = JRN.v;
    JRN.v = JRN.arq;
    try {
      return e.apply(this, arguments);
    } finally {
      JRN.v = a;
    }
  };
}
{
  const e = jrMateria;
  jrMateria = function (t, a, o) {
    let s = e.apply(this, arguments);
    try {
      const n = JRG_ED[t.editoria];
      n &&
        (o || JRN.ab[a]) &&
        (s = s.replace(
          /(<div class="jrtxt">[\s\S]*?<\/div>)/,
          `$1${jrGrafHtml(n)}`,
        ));
    } catch {}
    return s;
  };
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    const t = JRN.v;
    JRN.arq && (JRN.v = JRN.arq);
    let a;
    try {
      a = e.apply(this, arguments);
    } finally {
      JRN.v = t;
    }
    const o = jrVer();
    if (!o) return a;
    try {
      JRN.arq ||
        (jrArqGuarda(o),
        setTimeout(() => {
          (jrVoce(!1), jrPlantoes(!1));
        }, 0));
      const s = jrIndsHtml(o);
      ((a = a
        .replace(
          /<div class="jrinds">[\s\S]*?<\/div>/,
          `<div class="jrinds" id="jrinds">${s.h}</div>`,
        )
        .replace(
          "</header>",
          `<div class="jrhbar"><span id="jrviv" class="jrviv"${s.viv ? "" : " hidden"}>● ao vivo</span><button class="btn s" data-jrtudo="1">${JRN.fala === "ed" ? "⏹ Parar a leitura" : "🔊 Ouvir a edição"}</button></div></header>`,
        )),
        JRN.arq &&
          (a = a.replace(
            '<header class="jrcab">',
            `<div class="jrarqb">🗂️ Edição do arquivo · <b>${esc(jrNomeEd(o))}</b><button class="btn s" data-jrhoje="1">Voltar para hoje</button></div><header class="jrcab">`,
          )),
        (a = a.replace(/(<\/article>)/, `$1${jrPvHtml()}`)),
        (a = a.replace(/(<article class="jrart jrman")/, `${jrPlHtml()}$1`)));
      const n = a.indexOf('<section class="jrsec"><h3>Mais do dia</h3>');
      (n > 0 && (a = a.slice(0, n) + jrGrafSec() + a.slice(n)),
        (a = a.replace(/<div class="jrtxt">([\s\S]*?)<\/div>/g, (r, i) =>
          i.includes("data-gl") ? r : `<div class="jrtxt">${glMarca(i)}</div>`,
        )),
        (a += jrArqHtml()));
    } catch (s) {
      console.error(s);
    }
    return a;
  };
}
document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if (t("[data-jrtudo]")) {
      JRN.fala ? jrFala("") : jrFala(jrTextoEd(jrVer()), "ed");
      return;
    }
    if (t("[data-jrpv]")) {
      jrVoce(!0);
      return;
    }
    if ((a = t("[data-jrarq]"))) {
      const o = jrArqLe().find((s) => s.k === a.dataset.jrarq);
      if (!o) return;
      (o.k === jrK(JRN.v) ? (JRN.arq = null) : (JRN.arq = o.v),
        (JRN.ab = {}),
        jrPinta(),
        document.querySelector(".jrcard")?.scrollIntoView({ block: "start" }));
      return;
    }
    if (t("[data-jrhoje]")) {
      ((JRN.arq = null),
        (JRN.ab = {}),
        jrPinta(),
        document.querySelector(".jrcard")?.scrollIntoView({ block: "start" }));
      return;
    }
  },
  !0,
);
{
  const e = jrOuve;
  jrOuve = function () {
    if (JRN.fala === "ed") {
      try {
        speechSynthesis.cancel();
      } catch {}
      ((JRN.fala = 0), jrBtnFala());
    }
    return e.apply(this, arguments);
  };
}
{
  const e = TraderStyles.slot("legacy-073");
  ((e.textContent = TraderStyles.css("legacy-073")), TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v214";
const lsJ = (e, t) => {
    try {
      return JSON.parse(APP_STORAGE.getItem(e) || "null") ?? t;
    } catch {
      return t;
    }
  },
  lsS = (e, t) => {
    try {
      APP_STORAGE.setItem(e, JSON.stringify(t));
    } catch {}
  },
  jrDiaMais = (e) => diasMais(loc().slice(0, 10), e),
  JRC_V = {
    acertou: ["✅", "Acertou", "var(--g)"],
    parcial: ["🟡", "Acertou em parte", "var(--am)"],
    errou: ["❌", "Errou", "var(--r)"],
  };
function jrPlacar() {
  const e = loc().slice(0, 7),
    t = { acertou: 0, parcial: 0, errou: 0 },
    a = new Set();
  return (
    [JRN.v, ...jrArqLe().map((o) => o.v)].forEach((o) => {
      !o ||
        !o.conferencia ||
        String(o.dia || "").slice(0, 7) !== e ||
        a.has(o.dia) ||
        (a.add(o.dia),
        t[o.conferencia.veredito] != null && t[o.conferencia.veredito]++);
    }),
    t.acertou + t.parcial + t.errou
      ? `<div class="jrplac">Placar da redação em ${new Date(e + "-15T12:00").toLocaleDateString("pt-BR", { month: "long" })}: <b class="g">${t.acertou} acerto${t.acertou === 1 ? "" : "s"}</b> · <b class="am">${t.parcial} em parte</b> · <b class="r">${t.errou} erro${t.errou === 1 ? "" : "s"}</b></div>`
      : ""
  );
}
function jrConfHtml(e) {
  const t = e && e.conferencia;
  if (!t) return "";
  const [a, o, s] = JRC_V[t.veredito] || JRC_V.parcial;
  return `<section class="jrsec jrconf"><h3>🔎 A manhã acertou?</h3><div class="jrconfv" style="color:${s}">${a} ${o}</div>${t.texto ? `<div class="jrconft">${esc(t.texto)}</div>` : ""}
${(t.pontos || []).length ? `<div class="jrconfp">${t.pontos.map((n) => `<div><span>${n.ok ? "✅" : "❌"}</span><div><small>A manhã esperava</small> ${esc(n.previsto)}<br><small>Aconteceu</small> ${esc(n.aconteceu)}</div></div>`).join("")}</div>` : ""}${jrPlacar()}</section>`;
}
const GLR_LS = "diario-gl-rev",
  GLR_PASSO = [1, 3, 7, 15, 30],
  glrLe = () => lsJ(GLR_LS, {});
function glrAdd(e) {
  const t = glrLe(),
    a = String(e || "");
  let o = 0;
  for (const [s, n] of jrGlRe)
    n.test(a) && !t[s] && ((t[s] = { n: 0, prox: jrDiaMais(1) }), o++);
  return (o && lsS(GLR_LS, t), o);
}
function glrHtml() {
  if (JRN.arq) return "";
  const e = glrLe(),
    t = loc().slice(0, 10),
    a = Object.keys(e).filter((s) => e[s].prox <= t && JR_GL[s]);
  if (!a.length) return "";
  const o = a[0];
  return `<section class="jrsec jrglr"><h3>📚 Revisão do glossário <span class="sm mut">${a.length} para hoje</span></h3><div class="jrglrc"><b>${esc(o)}</b><div class="jrglrx" hidden>${esc(JR_GL[o])}</div><button class="btn s" data-glrver="1">Ver explicação</button><span class="jrglrb" hidden><button class="btn s" data-glr="${esc(o)}" data-ok="1">Lembrei</button> <button class="btn s" data-glr="${esc(o)}" data-ok="0">Não lembrei</button></span></div></section>`;
}
const JRQ_LS = "diario-jr-quiz";
JRN.qz = lsJ(JRQ_LS, null);
async function jrQuiz() {
  const e = jrVer();
  if (!(!e || JRN.qzBusy)) {
    ((JRN.qzBusy = 1), (JRN.qzErr = ""), jrQzPinta());
    try {
      const t = await anxCall({
        modo: "jornal_quiz",
        edicao:
          jrResumoEd(e) +
          (e.analise
            ? `
Análise: ` +
              e.analise.titulo +
              ". " +
              String(e.analise.texto).slice(0, 900)
            : ""),
      });
      if (t.erro) throw new Error(t.erro);
      if (!Array.isArray(t.perguntas) || !t.perguntas.length)
        throw new Error(
          'Publique a função "analise" nova (v214) para fazer o quiz.',
        );
      ((JRN.qz = { k: jrK(e), perguntas: t.perguntas, resp: [] }),
        lsS(JRQ_LS, JRN.qz));
    } catch (t) {
      JRN.qzErr = /modo|desconhecid|404/i.test(String(t.message || t))
        ? 'Publique a função "analise" nova (v214) para fazer o quiz.'
        : String(t.message || t);
    }
    ((JRN.qzBusy = 0), jrQzPinta());
  }
}
function jrQzHtml() {
  const e = jrVer();
  if (!e) return "";
  const t = JRN.qz && JRN.qz.k === jrK(e) ? JRN.qz : null;
  let a;
  if (JRN.qzBusy) a = '<div class="sm mut">Preparando as perguntas…</div>';
  else if (!t)
    a = `<div class="sm mut" style="margin-bottom:6px">3 perguntas sobre os mecanismos econômicos das matérias de hoje, para fixar o que você leu.</div>${JRN.qzErr ? `<div class="sm am">${esc(JRN.qzErr)}</div>` : ""}<button class="btn s" data-jrqz="1">Fazer o quiz</button>`;
  else {
    const o = t.resp.filter((s, n) => s === t.perguntas[n].c).length;
    a =
      t.perguntas
        .map((s, n) => {
          const r = t.resp[n];
          return `<div class="jrqp"><b>${n + 1}. ${esc(s.p)}</b>${s.ops.map((i, l) => `<button class="jrqo${r == null ? "" : l === s.c ? " ok" : l === r ? " no" : ""}" data-jrqo="${n}" data-j="${l}"${r == null ? "" : " disabled"}>${esc(i)}</button>`).join("")}${r != null ? `<div class="sm ${r === s.c ? "g" : "r"}">${r === s.c ? "Certo!" : "Não foi dessa vez."} <span class="mut">${esc(s.exp)}</span></div>` : ""}</div>`;
        })
        .join("") +
      (t.resp.filter((s) => s != null).length === t.perguntas.length
        ? `<div class="jrqres">Você acertou <b>${o} de ${t.perguntas.length}</b>.${o < t.perguntas.length ? " Os termos das perguntas que você errou entram na revisão do glossário." : ""}</div>`
        : "");
  }
  return `<section class="jrsec jrqz"><h3>🧠 Quiz da edição</h3>${a}</section>`;
}
function jrQzPinta() {
  const e = document.querySelector("#jrbox .jrqz");
  e && (e.outerHTML = jrQzHtml());
}
const JRE_LS = "diario-jr-ed",
  jrEdP = () => {
    const e = lsJ(JRE_LS, {});
    return {
      fav: Array.isArray(e.fav) ? e.fav : [],
      oc: Array.isArray(e.oc) ? e.oc : [],
    };
  };
function jrEdChips() {
  const e = jrEdP();
  return `<div class="jredp"${JRN.edAb ? "" : " hidden"}><div class="sm mut" style="margin-bottom:6px">Toque para alternar: normal → ⭐ favorita (aparece primeiro) → 🚫 oculta.</div>${Object.keys(
    JR_COR,
  )
    .map((t) => {
      const a = e.fav.includes(t) ? "⭐ " : e.oc.includes(t) ? "🚫 " : "";
      return `<button class="jredc${e.oc.includes(t) ? " oc" : ""}" data-jred="${esc(t)}" style="border-color:${jrCor(t)}">${a}${esc(t)}</button>`;
    })
    .join("")}</div>`;
}
function jrEdOrdena(e, t) {
  const a = jrEdP();
  return e.replace(
    /<section class="jrsec"><h3>Mais do dia<\/h3>([\s\S]*?)<\/section>/,
    (o, s) => {
      const n = s
        .split(/(?=<article class="jrart" id="jra-)/)
        .filter((l) => l.startsWith("<article"));
      let r = 0;
      const i = n
        .map((l) => {
          const d = +(/id="jra-(\d+)"/.exec(l) || [])[1],
            c = (t.materias || [])[d] || {};
          return { x: l, e: c.editoria, i: d };
        })
        .filter((l) => (a.oc.includes(l.e) ? (r++, !1) : !0))
        .sort(
          (l, d) =>
            (a.fav.includes(d.e) ? 1 : 0) - (a.fav.includes(l.e) ? 1 : 0) ||
            l.i - d.i,
        );
      return `<section class="jrsec"><h3 class="jrh3b">Mais do dia <button class="lnk" data-jredab="1">⚙️ Editorias</button></h3>${jrEdChips()}${i.map((l) => l.x).join("")}${r ? `<div class="sm mut" style="margin-top:6px">${r} matéria${r > 1 ? "s" : ""} de editoria oculta.</div>` : ""}</section>`;
    },
  );
}
{
  const e = jrTextoEd;
  jrTextoEd = function (t) {
    const a = jrEdP();
    return e.call(
      this,
      t && {
        ...t,
        materias: (t.materias || []).filter((o) => !a.oc.includes(o.editoria)),
      },
    );
  };
}
const JRS_LS = "diario-jr-salvas",
  jrSalvas = () => {
    const e = lsJ(JRS_LS, []);
    return Array.isArray(e) ? e : [];
  };
function jrMatDe(e) {
  const t = jrVer();
  return t ? (e === "m" ? t.manchete : (t.materias || [])[+e] || null) : null;
}
function jrSalvasHtml() {
  const e = jrSalvas();
  return e.length
    ? `<section class="jrsec jrsalv"><details${JRN.svAb ? " open" : ""} data-jrsvab="1"><summary><h3 style="display:inline">🔖 Salvas para ler (${e.length})</h3></summary>${e
        .map(
          (
            t,
          ) => `<article class="jrsvi"><div class="jrchap" style="color:${jrCor(t.editoria)}">${esc(t.editoria)} · ${esc(t.dia.split("-").reverse().slice(0, 2).join("/"))}</div><b>${esc(t.titulo)}</b>
${JRN.svOpen === t.id ? `<div class="jrtxt">${jrPar(t.texto)}</div>${t.por_que_importa ? `<div class="jrpq"><b>Por que importa</b> ${esc(t.por_que_importa)}</div>` : ""}` : ""}<div class="jrsvb"><button class="lnk" data-jrsvo="${t.id}">${JRN.svOpen === t.id ? "Fechar" : "Ler"}</button> · <button class="lnk" data-jrsvx="${t.id}">Remover</button></div></article>`,
        )
        .join("")}</details></section>`
    : "";
}
function jrReacao(e, t) {
  const a = JRN.g[t],
    [, o, s] = JRG_TK[t],
    n = Date.parse(e.em) / 1e3;
  if (!isFinite(n)) return "";
  if (!a || (!a.d && !a.err))
    return (
      setTimeout(() => jrGraf(t), 0),
      `<figure class="jrgr jrplg" data-g="${t}" data-pl="${esc(e.id)}"><figcaption>${o.split(" · ")[0]} na divulgação</figcaption><div class="sm mut">Carregando…</div></figure>`
    );
  const r = (a.d || []).filter((g) => g[0] >= n - 1800 && g[0] <= n + 3600);
  if (r.length < 3) return "";
  const i = [...r].reverse().find((g) => g[0] < n),
    l = r
      .filter((g) => g[0] >= n)
      .slice(0, 7)
      .pop();
  if (!i || !l) return "";
  const d = i[4] / s,
    c = l[4] / s,
    p = (c / d - 1) * 100,
    u = (g) =>
      g.toLocaleString("pt-BR", {
        minimumFractionDigits: s > 1 ? 4 : 0,
        maximumFractionDigits: s > 1 ? 4 : 0,
      }),
    m = 320,
    f = r.findIndex((g) => g[0] >= n),
    x = 6 + (f * (m - 12)) / Math.max(1, r.length - 1),
    v = jrSpark(r, s).replace(
      "</svg>",
      `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="0" y2="110" stroke="#e7614c" stroke-width="1.5"/></svg>`,
    );
  return `<figure class="jrgr jrplg" data-g="${t}" data-pl="${esc(e.id)}"><figcaption>${o.split(" · ")[0]} na divulgação</figcaption>${v}<div class="jrgrl"><span>Antes ${u(d)}</span><b class="${p >= 0 ? "g" : "r"}">30 min depois ${u(c)} (${p >= 0 ? "+" : ""}${p.toFixed(2).replace(".", ",")}%)</b></div></figure>`;
}
{
  const e = jrPlHtml;
  jrPlHtml = function () {
    return e
      .apply(this, arguments)
      .replace(
        /<button class="jrler" data-jrab="p(\d+)">Fechar<\/button>/g,
        (t, a) => {
          const o = JRN.pl[+a];
          return !o ||
            !o.em ||
            brtDia(Math.floor(Date.parse(o.em) / 1e3)) !== loc().slice(0, 10)
            ? t
            : `<div class="jrgrs">${jrReacao(o, "win")}${jrReacao(o, "wdo")}</div>` +
                t;
        },
      );
  };
}
{
  const e = jrGraf;
  jrGraf = async function (t) {
    await e.apply(this, arguments);
    try {
      document.querySelectorAll(`.jrplg[data-g="${t}"]`).forEach((a) => {
        const o = JRN.pl.find((s) => s.id === a.dataset.pl);
        a.outerHTML = (o && jrReacao(o, t)) || "";
      });
    } catch {}
  };
}
const jrCorta = (e, t) =>
  e.length <= t
    ? e
    : [
        ...e.slice(0, t - 1),
        e[t - 1].replace(/[\s,.;:\u2013-]*\S{0,12}$/, "") + "…",
      ];
function jrQuebra(e, t, a) {
  const o = String(t || "").split(/\s+/),
    s = [];
  let n = "";
  return (
    o.forEach((r) => {
      const i = n ? n + " " + r : r;
      e.measureText(i).width > a && n ? (s.push(n), (n = r)) : (n = i);
    }),
    n && s.push(n),
    s
  );
}
function jrImagem() {
  const e = jrVer();
  if (!e) return null;
  const t = 1080,
    a = 1350,
    o = document.createElement("canvas");
  ((o.width = t), (o.height = a));
  const s = o.getContext("2d");
  ((s.fillStyle = "#111213"),
    s.fillRect(0, 0, t, a),
    (s.fillStyle = "#d7c5a3"),
    s.fillRect(0, 0, t, 150),
    (s.fillStyle = "#111"),
    (s.font = 'bold 64px Georgia, "Times New Roman", serif'),
    (s.textAlign = "center"),
    s.fillText("Jornal do Pregão", t / 2, 92),
    (s.font = "26px Georgia, serif"),
    (s.fillStyle = "#555"),
    s.fillText(
      new Date((e.dia || loc().slice(0, 10)) + "T12:00").toLocaleDateString(
        "pt-BR",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" },
      ) +
        " · " +
        (e.nome || ""),
      t / 2,
      132,
    ),
    (s.textAlign = "left"));
  let n = 220;
  const r = e.manchete;
  ((s.fillStyle = JR_COR[r.editoria] || "#ac8439"),
    (s.font = "bold 28px system-ui, sans-serif"),
    s.fillText(
      String(r.editoria || "").toUpperCase() +
        (r.chapeu ? " · " + r.chapeu.toUpperCase() : ""),
      70,
      n,
    ),
    (n += 30),
    (s.fillStyle = "#fff"),
    (s.font = 'bold 60px Georgia, "Times New Roman", serif'),
    jrCorta(jrQuebra(s, r.titulo, t - 140), 5).forEach((d) => {
      ((n += 70), s.fillText(d, 70, n));
    }),
    r.linha_fina &&
      ((n += 30),
      (s.fillStyle = "#bec1c6"),
      (s.font = "32px Georgia, serif"),
      jrCorta(jrQuebra(s, r.linha_fina, t - 140), 3).forEach((d) => {
        ((n += 44), s.fillText(d, 70, n));
      })));
  const i = (e.cotacoes || []).slice(0, 6);
  i.length &&
    ((n += 50),
    (s.fillStyle = "#1f2023"),
    s.fillRect(50, n, t - 100, Math.ceil(i.length / 3) * 110 + 20),
    i.forEach((d, c) => {
      const p = 80 + (c % 3) * ((t - 160) / 3),
        u = n + 45 + Math.floor(c / 3) * 110;
      ((s.fillStyle = "#8a96a3"),
        (s.font = "24px system-ui, sans-serif"),
        s.fillText(String(d.n || d.k).slice(0, 18), p, u),
        (s.fillStyle = "#fff"),
        (s.font = "bold 34px system-ui, sans-serif"),
        s.fillText(
          d.px != null
            ? Number(d.px).toLocaleString("pt-BR", {
                minimumFractionDigits: d.px < 100 ? 2 : 0,
                maximumFractionDigits: d.px > 1e3 ? 0 : d.px < 10 ? 4 : 2,
              })
            : "–",
          p,
          u + 40,
        ),
        d.d1 != null &&
          ((s.fillStyle = d.d1 >= 0 ? "#3aad74" : "#e7614c"),
          (s.font = "bold 24px system-ui, sans-serif"),
          s.fillText(
            (d.d1 >= 0 ? "▲ " : "▼ ") +
              Math.abs(d.d1).toFixed(2).replace(".", ",") +
              "%",
            p + s.measureText("").width,
            u + 72,
          )));
    }),
    (n += Math.ceil(i.length / 3) * 110 + 20));
  const l = (e.em_poucas_linhas || []).slice(0, 4);
  if (l.length && n < a - 260) {
    ((n += 60),
      (s.fillStyle = "#d7c5a3"),
      (s.font = "bold 30px Georgia, serif"),
      s.fillText("Em poucas linhas", 70, n),
      (s.font = "28px system-ui, sans-serif"),
      (s.fillStyle = "#d4d6da"));
    for (const d of l) {
      const c = jrCorta(jrQuebra(s, "• " + d, t - 140), 2);
      if (n + c.length * 38 > a - 110) break;
      (c.forEach((p) => {
        ((n += 40), s.fillText(p, 70, n));
      }),
        (n += 6));
    }
  }
  return (
    (s.fillStyle = "#8a96a3"),
    (s.font = "22px system-ui, sans-serif"),
    s.fillText(
      "Diário de Trader · texto da IA com os dados do dia · não é recomendação de investimento",
      70,
      a - 50,
    ),
    o
  );
}
async function jrImgShare() {
  const e = jrImagem();
  if (!e) return;
  const t = await new Promise((s) => e.toBlob(s, "image/png"));
  if (!t) return toast("Não consegui gerar a imagem.");
  const a = `jornal-${jrVer().dia || "hoje"}.png`;
  window.__jrimg = t.size;
  try {
    const s = new File([t], a, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [s] })) {
      await navigator.share({ files: [s], title: "Jornal do Pregão" });
      return;
    }
  } catch (s) {
    if (s && s.name === "AbortError") return;
  }
  const o = document.createElement("a");
  ((o.href = URL.createObjectURL(t)),
    (o.download = a),
    document.body.appendChild(o),
    o.click(),
    setTimeout(() => {
      (URL.revokeObjectURL(o.href), o.remove());
    }, 2e3),
    toast("Imagem salva."));
}
function jrPergunta(e) {
  const t = jrMatDe(e);
  if (t) {
    ((ECO.rascunho = `Sobre a matéria do Jornal do Pregão "${t.titulo}" (${t.linha_fina || ""}): ${String(
      t.texto || "",
    )
      .replace(/\s+/g, " ")
      .slice(0, 700)}

Minha dúvida: `),
      (MKT.tab = "eco"));
    try {
      ls.set("diario-mkt-tab", "eco");
    } catch {}
    (render(),
      scrollTo(0, 0),
      setTimeout(() => {
        const a = document.getElementById("eco_tx");
        a &&
          ((a.value = ECO.rascunho),
          a.focus(),
          a.setSelectionRange(a.value.length, a.value.length));
      }, 80));
  }
}
{
  const e = jrMateria;
  jrMateria = function (t, a) {
    return e
      .apply(this, arguments)
      .replace(
        `<button class="btn s" data-jrsh="${a}">Compartilhar</button>`,
        `<button class="btn s" data-jrsh="${a}">Compartilhar</button> <button class="btn s" data-jrsv="${a}">${jrSalvas().some((o) => o.titulo === t.titulo) ? "🔖 Salva" : "🔖 Salvar"}</button> <button class="btn s" data-jrask="${a}">❓ Perguntar</button>`,
      );
  };
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    const a = jrVer();
    if (!a || !a.manchete) return t;
    try {
      t = t.replace(
        '<button class="btn s" data-jrtudo="1">',
        '<button class="btn s" data-jrimg="1">🖼️ Imagem</button> <button class="btn s" data-jrtudo="1">',
      );
      const o = t.indexOf('<section class="jrsec"><h3>📈 Gráficos do dia</h3>');
      (o > 0 && (t = t.slice(0, o) + jrConfHtml(a) + glrHtml() + t.slice(o)),
        (t = jrEdOrdena(t, a)));
      const s = t.indexOf('<section class="jrsec jrarq">'),
        n = jrQzHtml() + jrSalvasHtml();
      t = s > 0 ? t.slice(0, s) + n + t.slice(s) : t + n;
    } catch (o) {
      console.error(o);
    }
    return t;
  };
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if (t("[data-jrimg]")) {
      jrImgShare();
      return;
    }
    if ((a = t("[data-jrask]"))) {
      jrPergunta(a.dataset.jrask);
      return;
    }
    if ((a = t("[data-jrsv]"))) {
      const o = jrMatDe(a.dataset.jrsv),
        s = jrVer();
      if (!o) return;
      let n = jrSalvas();
      (n.some((r) => r.titulo === o.titulo)
        ? ((n = n.filter((r) => r.titulo !== o.titulo)),
          toast("Removida das salvas."))
        : (n.unshift({
            id: Date.now().toString(36),
            dia: s.dia || loc().slice(0, 10),
            editoria: o.editoria,
            titulo: o.titulo,
            linha_fina: o.linha_fina || "",
            texto: o.texto,
            por_que_importa: o.por_que_importa || "",
          }),
          (n = n.slice(0, 50)),
          toast("Salva para ler depois.")),
        lsS(JRS_LS, n),
        jrPinta());
      return;
    }
    if ((a = t("[data-jrsvo]"))) {
      ((JRN.svAb = 1),
        (JRN.svOpen = JRN.svOpen === a.dataset.jrsvo ? null : a.dataset.jrsvo),
        jrPinta());
      return;
    }
    if ((a = t("[data-jrsvx]"))) {
      ((JRN.svAb = 1),
        lsS(
          JRS_LS,
          jrSalvas().filter((o) => o.id !== a.dataset.jrsvx),
        ),
        jrPinta());
      return;
    }
    if (t("[data-jredab]")) {
      JRN.edAb = !JRN.edAb;
      const o = document.querySelector("#jrbox .jredp");
      o && (o.hidden = !JRN.edAb);
      return;
    }
    if ((a = t("[data-jred]"))) {
      const o = jrEdP(),
        s = a.dataset.jred;
      (o.fav.includes(s)
        ? ((o.fav = o.fav.filter((n) => n !== s)), o.oc.push(s))
        : o.oc.includes(s)
          ? (o.oc = o.oc.filter((n) => n !== s))
          : o.fav.push(s),
        lsS(JRE_LS, o),
        (JRN.edAb = 1),
        jrPinta());
      return;
    }
    if (t("[data-jrqz]")) {
      jrQuiz();
      return;
    }
    if ((a = t("[data-jrqo]"))) {
      const o = JRN.qz,
        s = +a.dataset.jrqo,
        n = +a.dataset.j;
      if (!o || o.resp[s] != null) return;
      o.resp[s] = n;
      const r = o.perguntas[s];
      (n !== r.c && glrAdd(r.p + " " + r.ops[r.c] + " " + r.exp),
        lsS(JRQ_LS, o),
        jrQzPinta());
      return;
    }
    if (t("[data-glrver]")) {
      const o = t(".jrglrc");
      ((o.querySelector(".jrglrx").hidden = !1),
        (o.querySelector(".jrglrb").hidden = !1),
        t("[data-glrver]").remove());
      return;
    }
    if ((a = t("[data-glr]"))) {
      const o = glrLe(),
        s = a.dataset.glr,
        n = o[s];
      if (!n) return;
      (a.dataset.ok === "1"
        ? (n.n++,
          n.n >= GLR_PASSO.length
            ? delete o[s]
            : (n.prox = jrDiaMais(GLR_PASSO[n.n])))
        : ((n.n = 0), (n.prox = jrDiaMais(1))),
        lsS(GLR_LS, o),
        jrPinta());
      return;
    }
  },
  !0,
),
  document.addEventListener(
    "toggle",
    (e) => {
      e.target.matches &&
        e.target.matches("[data-jrsvab]") &&
        (JRN.svAb = e.target.open);
    },
    !0,
  ));
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "mercado" || MKT.tab !== "mu") return;
      const t = document.getElementById("app");
      if (!t || t.querySelector(".mujump")) return;
      const a = [
          ...t.querySelectorAll(":scope > .card, :scope > div > .card"),
        ].filter((i) => !i.closest("#mujr")),
        o = [];
      a.slice(1).forEach((i) => {
        const l = i.querySelector("b"),
          d = ((l && l.textContent) || "").split(" · ")[0].trim();
        d && d.length < 40 && !o.some((c) => c[0] === d) && o.push([d, i]);
      });
      const s = document.getElementById("mujr");
      if ((s && o.push(["💹 Juros e DI", s]), !o.length)) return;
      const n = document.createElement("div");
      ((n.className = "mujump"),
        o.slice(0, 7).forEach(([i, l], d) => {
          const c = document.createElement("button");
          ((c.textContent = i.length > 24 ? i.slice(0, 23) + "…" : i),
            (c.onclick = () =>
              l.scrollIntoView({ block: "start", behavior: "smooth" })),
            n.appendChild(c));
        }));
      const r = a[0];
      r && r.after(n);
    } catch {}
  };
}
{
  const e = TraderStyles.slot("legacy-074");
  ((e.textContent = TraderStyles.css("legacy-074")), TraderStyles.mount(e));
}
((FN_ESPERADA.analise = "v215"), (FN_ESPERADA.notificar = "v215"));
const JR_DEMORA =
  /n\xe3o respondeu a tempo|servidor ia cortar|PRAZO|demorou demais|Failed to fetch|NetworkError|Load failed|aborted|timeout/i;
{
  const e = jrCarrega;
  jrCarrega = async function (t) {
    if (JRN.busy) return;
    JRN.t0 = Date.now();
    const a = setInterval(() => {
      const o = document.querySelector("#jrbox .jrvaz[data-esp]");
      o ? (o.innerHTML = jrEsperaTx()) : JRN.busy || clearInterval(a);
    }, 1e3);
    try {
      await e.apply(this, arguments);
    } finally {
      clearInterval(a);
    }
    JRN.err && JR_DEMORA.test(JRN.err)
      ? ((JRN.err =
          "A redação demorou mais que o normal para fechar a edição." +
          (JRN.auto
            ? " Toque em ↻ Atualizar para tentar de novo."
            : " Tentando de novo sozinho em 30 segundos…")),
        JRN.auto ||
          ((JRN.auto = 1),
          setTimeout(() => {
            tab === "mercado" && MKT.tab === "jr" && !JRN.busy && jrCarrega(!0);
          }, 3e4)),
        jrPinta())
      : JRN.err || (JRN.auto = 0);
  };
}
var jrEsperaTx;
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    const a = jrVer();
    try {
      if (!a && JRN.busy)
        return `<div class="jrvaz" data-esp="1">${jrEsperaTx()}</div>`;
      (a &&
        a.antiga &&
        !JRN.arq &&
        (t =
          `<div class="jrarqb">⏳ ${esc(a.aviso || "Esta é a última edição pronta.")}<button class="btn s" data-jrrf="1">${JRN.busy ? "…" : "Tentar a nova"}</button></div>` +
          t),
        a &&
          a.parcial &&
          !JRN.arq &&
          (t = t.replace(
            '<section class="jrsec"><h3 class="jrh3b">Mais do dia',
            '<div class="sm mut" style="margin:8px 0">Parte das matérias não ficou pronta a tempo nesta edição.</div><section class="jrsec"><h3 class="jrh3b">Mais do dia',
          )));
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-075");
  ((e.textContent = TraderStyles.css("legacy-075")), TraderStyles.mount(e));
}
try {
  const e = HUB_M.findIndex((t) => t[0] === "mercado:jedu");
  (e >= 0 && HUB_M.splice(e, 1),
    MGRP.forEach((t) => {
      t[1] = t[1].filter((a) => a !== "mercado:jedu");
    }));
} catch {}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "estudos") return;
      const t = [...document.querySelectorAll("#app .seg")].find((s) =>
        s.querySelector('[data-ep="esv"][data-id="liv"]'),
      );
      if (!t) return;
      const a = new Set();
      [...t.querySelectorAll('[data-ep="esv"]')].forEach((s) => {
        a.has(s.dataset.id) ? s.remove() : a.add(s.dataset.id);
      });
      let o = t.querySelector('[data-id="juros"]');
      (o ||
        ((o = document.createElement("button")),
        (o.dataset.ep = "esv"),
        (o.dataset.id = "juros"),
        (o.textContent = "💹 Juros"),
        t.appendChild(o)),
        ESV === "juros" &&
          (t
            .querySelectorAll("button")
            .forEach((s) => s.classList.remove("on")),
          o.classList.add("on")));
    } catch {}
  };
}
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV !== "juros"
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
        `<h1>Estudos</h1>${estSeg("juros")}${jeHtml()}<button class="btn s" data-jrmu="1" style="margin-top:8px">📊 Ver os juros ao vivo (Mercado → Mundo)</button>`);
  };
}
{
  const e = vMercado;
  vMercado = function () {
    return (
      MKT.tab === "jedu" &&
        ((MKT.tab = "mu"),
        setTimeout(() => {
          ((ESV = "juros"), irPara("estudos"), scrollTo(0, 0));
        }, 0)),
      e.apply(this, arguments)
    );
  };
}
GOR.jedu = () => {
  ((GO.r = null), (ESV = "juros"), irPara("estudos"));
};
{
  const e = vJuros;
  vJuros = function () {
    return (
      e.apply(this, arguments) +
      '<div class="sm" style="margin-top:8px">📚 Está começando? <button class="lnk" data-jedu="1">Entenda os juros</button> (em Estudos)</div>'
    );
  };
}
(document.addEventListener("click", (e) => {
  if (e.target.closest("[data-jedu]")) {
    (GOR.jedu(), scrollTo(0, 0));
    return;
  }
  e.target.closest("[data-jrmu]") && GOR.jurosmu();
}),
  (FN_ESPERADA.analise = "v217"),
  (FN_ESPERADA.notificar = "v217"));
const kwN = (e) =>
    String(e || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  kwL = () => (Array.isArray(NP.kw) ? NP.kw : []);
function kwSalva(e) {
  NP.kw = e.slice(0, 12);
  try {
    alSave();
  } catch {}
  try {
    (clearTimeout(kwSalva._t),
      (kwSalva._t = setTimeout(() => turnoPushSync(!0), 1500)));
  } catch {}
}
const kwRe = (e) =>
  new RegExp(
    "(^|[^a-z0-9])" +
      kwN(e).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      "($|[^a-z0-9])",
  );
function kwDe(e) {
  const t = kwN(`${e.titulo} ${e.linha_fina || ""} ${e.texto || ""}`);
  return kwL().filter((a) => kwRe(a).test(t));
}
try {
  NP.on && NP.on.kw === void 0 && ((NP.on.kw = !0), alSave());
} catch {}
{
  const e = alAbHtml;
  alAbHtml = function (t) {
    return (
      e.apply(this, arguments) +
      `${t("kw", "🔎 Palavras que você acompanha no jornal")}<div class="sm mut" style="margin-bottom:8px">${kwL().length ? "Avisa quando a edição ou um plantão falar de: <b>" + kwL().map(esc).join(", ") + "</b>." : 'Cadastre as palavras no Jornal (seção "Palavras que você acompanha").'}</div>`
    );
  };
}
function kwHtml() {
  return JRN.arq
    ? ""
    : `<section class="jrsec jrkw"><h3>🔎 Palavras que você acompanha</h3><div class="sm mut" style="margin-bottom:6px">Você recebe um aviso quando a edição ou um plantão falar delas, e as matérias ganham uma etiqueta.</div>
<div class="jrkwl">${kwL()
        .map(
          (e) =>
            `<span class="jrkwc">${esc(e)}<button data-kwx="${esc(e)}" aria-label="Tirar">✕</button></span>`,
        )
        .join("")}</div>
<div class="jrkwf"><input id="kwin" placeholder="Ex.: Petrobras, Copom, minério" maxlength="30" autocomplete="off"><button class="btn s" data-kwadd="1">Adicionar</button></div></section>`;
}
const JRL_LS = "diario-jr-leit",
  jrLeit = () => {
    const e = lsJ(JRL_LS, {});
    return { fs: Math.max(-2, Math.min(4, +e.fs || 0)), sep: !!e.sep };
  };
function jrLeitAplica() {
  const e = document.querySelector(".jrcard");
  if (!e) return;
  const t = jrLeit();
  (e.style.setProperty("--jrfs", String(1 + t.fs * 0.1)),
    e.classList.toggle("jrsep", t.sep));
  const a = e.querySelector("[data-jrsep]");
  a && a.classList.toggle("on", t.sep);
}
{
  const e = vJornal;
  vJornal = function () {
    const t = jrLeit();
    return e
      .apply(this, arguments)
      .replace(
        '<div class="card jrcard">',
        `<div class="card jrcard${t.sep ? " jrsep" : ""}" style="--jrfs:${1 + t.fs * 0.1}">`,
      );
  };
}
function jrAulaHtml(e) {
  const t = e && e.aula;
  return t
    ? `<section class="jrsec jraula"><h3>🎓 Aula de domingo</h3><div class="jrchap" style="color:var(--ac)">${esc(t.conceito || "Economia")}</div><h2 class="jrtit">${esc(t.titulo || t.conceito)}</h2><div class="jrtxt">${jrPar(t.texto)}</div>
${(t.perguntas || []).length ? `<div class="jraulq"><b>Para pensar</b>${t.perguntas.map((a) => `<details><summary>${esc(a.p)}</summary><div>${esc(a.r || "")}</div></details>`).join("")}</div>` : ""}<div class="sm mut">Conceito ligado às notícias da semana, para a faculdade de Economia.</div></section>`
    : "";
}
const JRT_SUG = [
  "Copom",
  "Selic",
  "Inflação",
  "Fiscal",
  "Dólar",
  "Petrobras",
  "Eleições",
  "Fed",
  "China",
  "Minério",
];
function jrTempoLista(e) {
  if (kwN(e).length < 2) return "";
  const t = kwRe(e),
    a = [],
    o = new Set();
  [JRN.v, ...jrArqLe().map((n) => n.v)].forEach((n) => {
    if (!n || !n.manchete) return;
    const r = jrK(n);
    o.has(r) || (o.add(r), a.push(n));
  });
  const s = [];
  return (
    a.forEach((n) =>
      [n.manchete, ...(n.materias || [])].forEach((r) => {
        r &&
          r.titulo &&
          t.test(kwN(`${r.titulo} ${r.linha_fina || ""} ${r.texto || ""}`)) &&
          s.push({ v: n, m: r });
      }),
    ),
    s.sort((n, r) => (jrK(n.v) < jrK(r.v) ? -1 : 1)),
    s.length
      ? `<div class="jrtl">${s
          .slice(-25)
          .map(
            ({ v: n, m: r }) =>
              `<button class="jrtli" data-jrarq="${esc(jrK(n))}"><span class="jrtld">${esc(new Date((n.dia || "") + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))}<small>${esc(n.edicao === "manha" ? "manhã" : n.edicao === "meio" ? "tarde" : n.edicao === "tarde" ? "noite" : "fds")}</small></span><span><small style="color:${jrCor(r.editoria)}">${esc(r.editoria)}</small><b>${esc(r.titulo)}</b>${r.linha_fina ? `<span class="sm mut">${esc(r.linha_fina)}</span>` : ""}</span></button>`,
          )
          .join("")}</div>`
      : `<div class="sm mut">Nenhuma matéria sobre "${esc(e)}" nas edições guardadas neste aparelho.</div>`
  );
}
function jrTempoHtml() {
  const e = JRN.tq || "";
  return `<section class="jrsec jrtempo"><h3>🕰️ Linha do tempo</h3><div class="sm mut" style="margin-bottom:6px">Como um assunto andou nas edições, do mais antigo ao mais novo.</div>
<div class="jrtsug">${JRT_SUG.map((t) => `<button class="jredc${kwN(t) === kwN(e) ? " on" : ""}" data-jrtq="${esc(t)}">${esc(t)}</button>`).join("")}</div><input id="jrtqi" type="search" placeholder="Ou digite um assunto" value="${esc(e)}" autocomplete="off"><div id="jrtres">${jrTempoLista(e)}</div></section>`;
}
document.addEventListener("input", (e) => {
  if (e.target.id !== "jrtqi") return;
  JRN.tq = e.target.value;
  const t = document.getElementById("jrtres");
  t && (t.innerHTML = jrTempoLista(JRN.tq));
});
function jrNotasDe(e) {
  var t;
  const a = (t = S.ax ?? (S.ax = {})).jrn ?? (t.jrn = {});
  return Array.isArray(a[e]) ? a[e] : [];
}
function jrNotaHtml(e, t) {
  const a = jrVer();
  if (!a) return "";
  const o = a.dia || loc().slice(0, 10),
    s = jrNotasDe(o).find((n) => n.t === e.titulo);
  return JRN.nota === t
    ? `<div class="jrnota"><textarea id="jrnotatx" rows="3" placeholder="O que você achou? O que espera que aconteça no pregão?">${esc(s ? s.n : "")}</textarea><div style="display:flex;gap:6px;margin-top:6px"><button class="btn s" data-jrnsv="${t}">Salvar no Meu dia</button><button class="btn s" data-jrnota="${t}">Cancelar</button></div></div>`
    : s
      ? `<div class="jrnota jrnotav"><small>📝 Sua nota (vai para o Meu dia de ${esc(o.split("-").reverse().slice(0, 2).join("/"))})</small><div>${esc(s.n)}</div></div>`
      : "";
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "dia" || (typeof DV < "u" && DV === "hist")) return;
      const t = document.getElementById("app"),
        a = jrNotasDe(D);
      if (!t || !a.length || t.querySelector("#jrnotas")) return;
      const o = document.createElement("div");
      ((o.className = "card"),
        (o.id = "jrnotas"),
        (o.innerHTML = `<b>📰 Suas notas do jornal</b><div class="sm mut" style="margin:2px 0 6px">O que você pensou lendo as matérias deste dia. A leitura bateu com o pregão?</div>${a.map((s, n) => `<div class="jrnd"><div class="sm"><b>${esc(s.t)}</b></div><div>${esc(s.n)}</div><div class="jrndb"><button class="btn s${s.ok === !0 ? " on" : ""}" data-jrnok="${n}" data-v="1">✅ Bateu</button><button class="btn s${s.ok === !1 ? " on" : ""}" data-jrnok="${n}" data-v="0">❌ Não bateu</button></div></div>`).join("")}`),
        t.appendChild(o));
    } catch {}
  };
}
{
  const e = jrMateria;
  jrMateria = function (t, a, o) {
    let s = e.apply(this, arguments);
    try {
      const n = kwDe(t);
      (n.length &&
        (s = s.replace(
          /(<div class="jrchap"[^>]*>[\s\S]*?<\/div>)/,
          `$1<div class="jrkwt">${n.map((r) => `<span>🔎 ${esc(r)}</span>`).join("")}</div>`,
        )),
        (o || JRN.ab[a]) &&
          ((s = s.replace(
            `<button class="btn s" data-jrask="${a}">❓ Perguntar</button>`,
            `<button class="btn s" data-jrask="${a}">❓ Perguntar</button> <button class="btn s" data-jrnota="${a}">📝 Nota</button>`,
          )),
          (s = s.replace(/<\/article>$/, jrNotaHtml(t, a) + "</article>"))));
    } catch {}
    return s;
  };
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    const a = jrVer();
    if (!a || !a.manchete) return t;
    try {
      t = t.replace(
        '<button class="btn s" data-jrimg="1">',
        '<span class="jrleit"><button class="btn s" data-jrfs="-1" aria-label="Letra menor">A−</button><button class="btn s" data-jrfs="1" aria-label="Letra maior">A+</button><button class="btn s" data-jrsep="1" aria-label="Modo leitura">📖</button></span> <button class="btn s" data-jrimg="1">',
      );
      const o = t.indexOf('<section class="jrsec"><h3>Giro do pregão</h3>');
      o > 0
        ? (t = t.slice(0, o) + jrAulaHtml(a) + t.slice(o))
        : (t += jrAulaHtml(a));
      const s = t.indexOf('<div class="jrplw">'),
        n = kwHtml(),
        r = t.indexOf('<section class="jrsec jrarq">');
      t =
        r > 0
          ? t.slice(0, r) + jrTempoHtml() + n + t.slice(r)
          : t + jrTempoHtml() + n;
    } catch (o) {
      console.error(o);
    }
    return t;
  };
}
{
  const e = jrPinta;
  jrPinta = function () {
    e.apply(this, arguments);
    try {
      jrLeitAplica();
    } catch {}
  };
}
(document.addEventListener(
  "click",
  (e) => {
    var t;
    const a = (s) => e.target.closest(s);
    let o;
    if (a("[data-kwadd]")) {
      const s = document.getElementById("kwin"),
        n = ((s && s.value) || "").trim().slice(0, 30);
      if (n.length < 2) return toast("Escreva pelo menos 2 letras.");
      const r = kwL();
      if (!r.some((i) => kwN(i) === kwN(n))) {
        if (r.length >= 12) return toast("Até 12 palavras.");
        (kwSalva([...r, n]),
          toast(`Vou avisar quando o jornal falar de "${n}".`));
      }
      (jrPinta(),
        setTimeout(() => document.getElementById("kwin")?.focus(), 50));
      return;
    }
    if ((o = a("[data-kwx]"))) {
      (kwSalva(kwL().filter((s) => s !== o.dataset.kwx)), jrPinta());
      return;
    }
    if ((o = a("[data-jrfs]"))) {
      const s = jrLeit();
      ((s.fs = Math.max(-2, Math.min(4, s.fs + +o.dataset.jrfs))),
        lsS(JRL_LS, s),
        jrLeitAplica());
      return;
    }
    if (a("[data-jrsep]")) {
      const s = jrLeit();
      ((s.sep = !s.sep), lsS(JRL_LS, s), jrLeitAplica());
      return;
    }
    if ((o = a("[data-jrtq]"))) {
      ((JRN.tq =
        kwN(JRN.tq || "") === kwN(o.dataset.jrtq) ? "" : o.dataset.jrtq),
        jrPinta(),
        setTimeout(
          () =>
            document
              .querySelector(".jrtempo")
              ?.scrollIntoView({ block: "nearest" }),
          40,
        ));
      return;
    }
    if ((o = a("[data-jrnota]"))) {
      ((JRN.nota = JRN.nota === o.dataset.jrnota ? null : o.dataset.jrnota),
        jrPinta(),
        JRN.nota &&
          setTimeout(() => document.getElementById("jrnotatx")?.focus(), 50));
      return;
    }
    if ((o = a("[data-jrnsv]"))) {
      const s = jrMatDe(o.dataset.jrnsv),
        n = jrVer(),
        r = (document.getElementById("jrnotatx") || {}).value || "";
      if (!s || !n) return;
      const i = n.dia || loc().slice(0, 10),
        l = (t = S.ax ?? (S.ax = {})).jrn ?? (t.jrn = {}),
        d = jrNotasDe(i).filter((c) => c.t !== s.titulo);
      (r.trim() &&
        d.push({
          t: s.titulo,
          n: r.trim().slice(0, 1e3),
          ok: null,
          em: Date.now(),
        }),
        d.length ? (l[i] = d) : delete l[i],
        save(),
        (JRN.nota = null),
        toast(r.trim() ? "Nota salva no Meu dia." : "Nota apagada."),
        jrPinta());
      return;
    }
    if ((o = a("[data-jrnok]"))) {
      const s = jrNotasDe(D),
        n = s[+o.dataset.jrnok];
      if (!n) return;
      const r = o.dataset.v === "1";
      ((n.ok = n.ok === r ? null : r), save());
      const i = scrollY;
      (render(), scrollTo(0, i));
      return;
    }
  },
  !0,
),
  document.addEventListener("keydown", (e) => {
    e.key === "Enter" &&
      e.target.id === "kwin" &&
      (e.preventDefault(), document.querySelector("[data-kwadd]")?.click());
  }));
{
  const e = TraderStyles.slot("legacy-076");
  ((e.textContent = TraderStyles.css("legacy-076")), TraderStyles.mount(e));
}
((FN_ESPERADA.analise = "v218"), (FN_ESPERADA.notificar = "v218"));
const jrDorme = (e) => new Promise((t) => setTimeout(t, e));
jrCarrega = async function (e) {
  if (
    JRN.busy ||
    (!e && JRN.v && !JRN.v.antiga && JRN.v.dia + JRN.v.edicao === jrAgoraK())
  )
    return;
  ((JRN.busy = 1), (JRN.err = ""), (JRN.t0 = Date.now()), jrPinta());
  const t = setInterval(() => {
    const a = document.querySelector("#jrbox .jrvaz[data-esp]");
    a && (a.innerHTML = jrEsperaTx());
    const o = document.querySelector("#jrbox .jresp b");
    o && (o.textContent = Math.round((Date.now() - JRN.t0) / 1e3) + "s");
  }, 1e3);
  try {
    let a = await anxCall({ modo: "jornal", force: !!e }),
      o = 0;
    for (; a && a.gerando && o < 40; )
      (a.desde && (JRN.t0 = Math.min(JRN.t0, +a.desde)),
        a.ultima &&
          (!JRN.v || JRN.v.antiga) &&
          (JRN.v = {
            ...a.ultima,
            antiga: !0,
            aviso:
              "A edição nova está sendo fechada (leva de 1 a 2 minutos). Enquanto isso, esta é a última edição pronta.",
          }),
        jrPinta(),
        await jrDorme(6e3),
        (a = await anxCall({ modo: "jornal" })),
        o++);
    if (a && a.gerando) throw new Error("demorou demais");
    if (a.erro) throw new Error(a.erro);
    if (!a.manchete)
      throw new Error(
        'Para ler o jornal, publique a função "analise" nova (v218) no Supabase.',
      );
    ((JRN.v = a), (JRN.auto = 0));
    try {
      APP_STORAGE.setItem("diario-jornal", JSON.stringify(a));
    } catch {}
  } catch (a) {
    const o = String(a.message || a);
    ((JRN.err = JR_DEMORA.test(o)
      ? "A redação demorou mais que o normal para fechar a edição." +
        (JRN.auto
          ? " Toque em ↻ Atualizar para tentar de novo."
          : " Tentando de novo sozinho em 30 segundos…")
      : /modo|desconhecid|404/i.test(o)
        ? 'Para ler o jornal, publique a função "analise" nova (v218) no Supabase.'
        : o),
      JR_DEMORA.test(o) &&
        !JRN.auto &&
        ((JRN.auto = 1),
        setTimeout(() => {
          tab === "mercado" && MKT.tab === "jr" && !JRN.busy && jrCarrega(!1);
        }, 3e4)));
  } finally {
    (clearInterval(t), (JRN.busy = 0), jrPinta());
  }
};
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    const a = jrVer();
    try {
      a &&
        a.antiga &&
        JRN.busy &&
        !JRN.arq &&
        (t = t.replace(
          '<div class="jrarqb">⏳ ',
          '<div class="jrarqb jresp">⏳ <b>' +
            Math.round((Date.now() - (JRN.t0 || Date.now())) / 1e3) +
            "s</b> · ",
        ));
    } catch {}
    return t;
  };
}
((FN_ESPERADA.analise = "v219"),
  (FN_ESPERADA.analise = "v220"),
  (GR.ult = null),
  (GR.ultErr = ""),
  (GR.ultBusy = 0),
  (GR.escolheu = 0));
const grFds = () => {
    const e = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
    ).getDay();
    return e === 0 || e === 6;
  },
  grModoUlt = () => !GR.escolheu && (grSlot() == null || grFds());
async function grUltimo() {
  if (!(GR.ultBusy || (GR.ult && Date.now() - GR.ult._ts < 10 * 6e4))) {
    ((GR.ultBusy = 1), (GR.ultErr = ""));
    try {
      const e = await anxCall({
        modo: "giro",
        ultimo: 1,
        hoje_tambem: grFds() ? 1 : 0,
      });
      if (e.erro) throw new Error(e.erro);
      if (!e.texto)
        throw new Error(
          'Publique a função "analise" nova (v220) para ver o último giro.',
        );
      GR.ult = { ...e, _ts: Date.now() };
    } catch (e) {
      GR.ultErr = String(e.message || e);
    }
    if (((GR.ultBusy = 0), tab === "mercado" && MKT.tab === "giro")) {
      const e = scrollY;
      (render(), scrollTo(0, e));
    }
  }
}
{
  const e = vGiro;
  vGiro = function () {
    if (!grModoUlt()) return e.apply(this, arguments);
    !GR.ult && !GR.ultBusy && !GR.ultErr && setTimeout(grUltimo, 0);
    const t = GR.ult,
      a = grSlot(),
      o = grFds();
    let s;
    if (t) {
      const i = loc().slice(0, 10),
        l = i + "1720",
        d = GR.v[l],
        c = GR.j,
        p = GR.err[l],
        u = GR.busy;
      ((GR.v[l] = t), (GR.j = "1720"), (GR.err[l] = ""), (GR.busy = ""));
      try {
        s = grCorpo().replace(
          /<button class="btn s" data-gr="rf">[^<]*<\/button>/,
          "",
        );
      } finally {
        (d === void 0 ? delete GR.v[l] : (GR.v[l] = d),
          (GR.j = c),
          p === void 0 ? delete GR.err[l] : (GR.err[l] = p),
          (GR.busy = u));
      }
    } else
      s = `<div class="sm ${GR.ultErr ? "am" : "mut"}" style="padding:10px 0">${esc(GR.ultErr || "Buscando o último giro…")}</div>`;
    const n =
        t && t.dia_giro
          ? new Date(t.dia_giro + "T12:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
            })
          : "",
      r = t ? GR_N[t.slot_giro] || "Giro" : "";
    return `<div class="card"><div class="top"><b>📰 Giro do mercado</b><span class="sm mut">6 por dia</span></div>
  <div class="grult">${o ? "Fim de semana: não tem giro." : "O primeiro giro de hoje sai às <b>7h</b>."} ${t ? `Enquanto isso, o último pronto: <b>${esc(r)}</b> de <span class="cap1">${esc(n)}</span>.` : ""}</div>
  <div class="seg grsl" style="margin:8px 0">${GR_SL.map(([i, l]) => `<button class="${o || a == null || grIdx(i) > grIdx(a) ? "grfut" : ""}" data-grj="${i}">${l}</button>`).join("")}</div>
  <div id="grbox">${s}</div></div>`;
  };
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest("[data-grj]") && (GR.escolheu = 1);
  },
  !0,
);
{
  const e = TraderStyles.slot("legacy-077");
  ((e.textContent = TraderStyles.css("legacy-077")), TraderStyles.mount(e));
}
((FN_ESPERADA.analise = "v221"),
  (JRN.prontas = 0),
  (jrEsperaTx = function () {
    const e = Math.round((Date.now() - (JRN.t0 || Date.now())) / 1e3),
      t = JRN.prontas || 0;
    return `Fechando a edição: 4 partes sendo escritas ao mesmo tempo · <b>${t} de 4 prontas</b> · ${e}s<div class="jrbarw"><i style="width:${Math.min(95, Math.max(t * 25, (e / 90) * 100)).toFixed(0)}%"></i></div><div class="sm mut" style="margin-top:6px">Costuma levar de 40 segundos a 2 minutos. Pode sair desta tela: a edição fica pronta para todo mundo.</div>`;
  }));
{
  const e = anxCall;
  anxCall = async function (t) {
    const a = await e.apply(this, arguments);
    try {
      (t &&
        t.modo === "jornal" &&
        a &&
        a.gerando &&
        (JRN.prontas = +a.prontas || 0),
        t && t.modo === "jornal" && a && a.motivo && (JRN.motivo = a.motivo));
    } catch {}
    return a;
  };
}
{
  const e = jrCarrega;
  jrCarrega = async function () {
    return ((JRN.prontas = 0), (JRN.motivo = ""), e.apply(this, arguments));
  };
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    const a = jrVer();
    try {
      (a &&
        a.antiga &&
        !JRN.busy &&
        !JRN.arq &&
        JRN.motivo &&
        (t = t.replace(
          /(<div class="jrarqb">\u23f3 [^<]*)/,
          `$1 <span class="sm">${esc(JRN.motivo)}</span>`,
        )),
        a &&
          a.antiga &&
          JRN.busy &&
          !JRN.arq &&
          (t = t.replace(
            /(<div class="jrarqb jresp">\u23f3 <b>\d+s<\/b>)/,
            `$1 · ${JRN.prontas || 0} de 4 partes prontas`,
          )));
    } catch {}
    return t;
  };
}
FN_ESPERADA.analise = "v225";
const JR_PNOME = {
  A: "Manchete e análise",
  B1: "Matérias principais",
  B2: "Outras matérias",
  C: "Em poucas linhas e agenda",
  D: "Balanços do dia",
};
((JRN.plist = ["A", "B1", "B2", "C"]),
  (JRN.atu = null),
  (JRN.pst = {}),
  (jrCarrega = async function (e) {
    if (
      JRN.busy ||
      (!e && JRN.v && !JRN.v.antiga && JRN.v.dia + JRN.v.edicao === jrAgoraK())
    )
      return;
    ((JRN.busy = 1),
      (JRN.err = ""),
      (JRN.motivo = ""),
      (JRN.t0 = Date.now()),
      (JRN.pst = {}),
      (JRN.perr = {}),
      (JRN.pr = {}),
      (JRN.prontas = 0),
      (JRN.atu = null),
      (JRN.plist = ["A", "B1", "B2", "C"]),
      jrPinta());
    const t = setInterval(() => {
      const a = document.querySelector("#jrbox .jrvaz[data-esp]");
      a && (a.innerHTML = jrEsperaTx());
      const o = document.querySelector("#jrbox .jresp");
      o && (o.outerHTML = jrPartesBanner());
    }, 1e3);
    try {
      let a = await anxCall({ modo: "jornal", force: !!e, partes: 1 });
      if (a && a.manchete && !a.faltando) JRN.v = a;
      else {
        if (a && a.gerando)
          throw new Error(
            'Publique a função "analise" nova (v222) no Supabase.',
          );
        if (a && a.faltando) {
          ((JRN.plist =
            Array.isArray(a.partes) && a.partes.length
              ? a.partes
              : ["A", "B1", "B2", "C"]),
            a.atualizar && a.ultima
              ? ((JRN.v = a.ultima), (JRN.atu = a.novos || ["novo"]))
              : a.ultima &&
                (!JRN.v || JRN.v.antiga) &&
                (JRN.v = {
                  ...a.ultima,
                  antiga: !0,
                  aviso:
                    "A edição nova está sendo escrita. Enquanto isso, esta é a última edição pronta.",
                }),
            jrPinta());
          const o = await Promise.all(
            JRN.plist.map(async (n) => {
              JRN.pst[n] = "…";
              try {
                const r = await anxCall({
                  modo: "jornal_parte",
                  parte: n,
                  force: !!e || !!a.atualizar,
                });
                return r.erro
                  ? ((JRN.pst[n] = "✗"), (JRN.perr[n] = r.erro), 0)
                  : ((JRN.pst[n] = "✓"),
                    r.r && (JRN.pr[n] = r.r),
                    JRN.prontas++,
                    1);
              } catch (r) {
                return (
                  (JRN.pst[n] = "✗"),
                  (JRN.perr[n] = String(r.message || r)),
                  0
                );
              } finally {
                jrPinta();
              }
            }),
          );
          if (
            ((JRN.motivo =
              JRN.perr.A ||
              JRN.perr.B1 ||
              JRN.perr.B2 ||
              JRN.perr.C ||
              JRN.perr.D ||
              ""),
            !o.some(Boolean))
          )
            throw new Error(
              JRN.motivo || "Nenhuma parte da edição ficou pronta.",
            );
          const s = await anxCall({
            modo: "jornal_junta",
            partes_prontas: JRN.pr,
          });
          if (s.erro) throw new Error(s.erro);
          if (!s.manchete) throw new Error("A edição veio vazia.");
          JRN.v = s;
        } else
          throw a && a.erro
            ? new Error(a.erro)
            : new Error(
                'Para ler o jornal, publique a função "analise" nova (v222) no Supabase.',
              );
      }
      JRN.auto = 0;
      try {
        APP_STORAGE.setItem("diario-jornal", JSON.stringify(JRN.v));
      } catch {}
    } catch (a) {
      const o = String(a.message || a);
      ((JRN.err =
        (JR_DEMORA.test(o)
          ? "A redação demorou mais que o normal para fechar a edição. "
          : "") +
        o
          .replace(/^A IA \([^)]*\) /, "A IA ")
          .replace(/;? ?se repetir sempre[^.]*\./, ".")),
        !JRN.auto && !/publique/i.test(o)
          ? ((JRN.auto = 1),
            (JRN.err +=
              " Tentando de novo sozinho em 30 segundos (só as partes que faltaram)…"),
            setTimeout(() => {
              tab === "mercado" &&
                MKT.tab === "jr" &&
                !JRN.busy &&
                jrCarrega(!1);
            }, 3e4))
          : JRN.auto &&
            (JRN.err += " Toque em ↻ Atualizar para tentar de novo."));
    } finally {
      (clearInterval(t), (JRN.busy = 0), jrPinta());
    }
  }));
function jrPartesLinha() {
  return (JRN.plist || ["A", "B1", "B2", "C"])
    .map(
      (e) =>
        `<span class="jrpt ${JRN.pst[e] === "✓" ? "ok" : JRN.pst[e] === "✗" ? "no" : ""}">${JRN.pst[e] || "…"} ${JR_PNOME[e]}</span>`,
    )
    .join("");
}
function jrPartesBanner() {
  return `<div class="jresp jrptw"><b>${Math.round((Date.now() - (JRN.t0 || Date.now())) / 1e3)}s</b> · ${JRN.prontas || 0} de ${(JRN.plist || []).length || 4} partes prontas<div class="jrpts">${jrPartesLinha()}</div></div>`;
}
jrEsperaTx = function () {
  const e = Math.round((Date.now() - (JRN.t0 || Date.now())) / 1e3),
    t = JRN.prontas || 0;
  return `Escrevendo a edição em ${(JRN.plist || []).length || 4} partes ao mesmo tempo · <b>${t} de ${(JRN.plist || []).length || 4} prontas</b> · ${e}s<div class="jrbarw"><i style="width:${Math.min(95, Math.max(t * 25, (e / 90) * 100)).toFixed(0)}%"></i></div><div class="jrpts" style="margin-top:8px">${jrPartesLinha()}</div><div class="sm mut" style="margin-top:6px">Costuma levar de 30 segundos a 2 minutos. Pode sair desta tela: as partes prontas ficam guardadas.</div>`;
};
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      const a = jrVer();
      (a &&
        a.antiga &&
        JRN.busy &&
        !JRN.arq &&
        ((t = t.replace(
          /<div class="jrarqb jresp">\u23f3 <b>\d+s<\/b>( \xb7 \d+ de \d+ partes prontas)? \xb7 /,
          '<div class="jrarqb">⏳ ',
        )),
        (t = t.replace(
          '<div class="jrarqb">⏳ ',
          jrPartesBanner() + '<div class="jrarqb">⏳ ',
        ))),
        !JRN.busy &&
          JRN.err &&
          a &&
          (t = t.replace(
            '<header class="jrcab">',
            `<div class="warn sm" style="margin-bottom:8px">${esc(JRN.err)}</div><header class="jrcab">`,
          )));
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-078");
  ((e.textContent = TraderStyles.css("legacy-078")), TraderStyles.mount(e));
}
((FN_ESPERADA.analise = "v225"),
  (FN_ESPERADA.macro = "v224"),
  (FN_ESPERADA.notificar = "v224"),
  (FN_ESPERADA.analise = "v225"));
{
  const e = jrMateria;
  jrMateria = function (t, a, o) {
    let s = e.apply(this, arguments);
    try {
      if (t && t.link && /^https:\/\/www\.rad\.cvm\.gov\.br\//.test(t.link)) {
        const n = `<div class="jrbalt">📑 Balanço${t.pdf ? " · lido do documento oficial entregue à CVM" : ""}</div>`;
        s = s.replace(/(<h2 class="jrtit">)/, n + "$1");
        const r = `<a class="btn s" href="${esc(t.link)}" target="_blank" rel="noopener">📄 Documento na CVM</a>`;
        s.includes('data-jrsh="' + a + '"')
          ? (s = s.replace(
              `<button class="btn s" data-jrsh="${a}">Compartilhar</button>`,
              `${r} <button class="btn s" data-jrsh="${a}">Compartilhar</button>`,
            ))
          : (s = s.replace(
              /(<button class="jrler" data-jrab="[^"]*">)/,
              `<div style="margin:4px 0">${r}</div>$1`,
            ));
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
      JRN.busy &&
        JRN.atu &&
        !JRN.arq &&
        (t = t.replace(
          '<header class="jrcab">',
          `<div class="jrarqb">📑 Saiu balanço novo (${esc(JRN.atu.join(", "))}): escrevendo a matéria e atualizando o jornal…</div>${jrPartesBanner()}<header class="jrcab">`,
        ));
    } catch {}
    return t;
  };
}
{
  const e = TraderStyles.slot("legacy-079");
  ((e.textContent = TraderStyles.css("legacy-079")), TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v226";
function jrBalApp() {
  try {
    const e = BAL && BAL.v;
    if (!e) return null;
    const t = (a) =>
      (a || [])
        .slice(0, 60)
        .map((o) => ({
          tk: o.tk,
          nome: o.nome,
          d: o.d,
          hora: o.hora || null,
          quando: o.quando || null,
          conf: o.conf || "est",
          cap: o.cap || 0,
          link: o.link || "",
        }));
    return {
      ontem: t(e.ontem),
      hoje_lista: t(e.hoje_lista),
      proximos: t(e.proximos),
    };
  } catch {
    return null;
  }
}
{
  const e = anxCall;
  anxCall = async function (t) {
    try {
      if (
        t &&
        (t.modo === "jornal" || (t.modo === "jornal_parte" && t.parte === "D"))
      ) {
        if (!BAL.v || Date.now() - (BAL.ts || 0) > 30 * 6e4)
          try {
            await Promise.race([
              balCarrega(),
              new Promise((o) => setTimeout(o, 8e3)),
            ]);
          } catch {}
        const a = jrBalApp();
        a && (t = { ...t, bal: a });
      }
    } catch {}
    return e.call(this, t);
  };
}
{
  const e = jrMateria;
  jrMateria = function (t, a, o) {
    let s = e.apply(this, arguments);
    try {
      if (
        t &&
        t.fonte_url &&
        /^https?:\/\//.test(t.fonte_url) &&
        (o || JRN.ab[a])
      ) {
        let n = "";
        try {
          n = new URL(t.fonte_url).hostname.replace(/^www\./, "");
        } catch {}
        s = s.replace(
          /<\/article>$/,
          `<div class="sm" style="margin-top:6px">🔗 Fonte dos números: <a href="${esc(urlSegura(t.fonte_url))}" target="_blank" rel="noopener">${esc(n || "link")}</a></div></article>`,
        );
      }
    } catch {}
    return s;
  };
}
((FN_ESPERADA.analise = "v227"), (FN_ESPERADA.notificar = "v227"));
const ERR_LS = "diario-erros",
  erLista0 = () => {
    const e = lsJ(ERR_LS, []);
    return Array.isArray(e) ? e : [];
  };
function errAdd(e, t) {
  try {
    if (
      ((t = String(t || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400)),
      !t)
    )
      return;
    const a = erLista0();
    if (a[0] && a[0].onde === e && a[0].msg === t && Date.now() - a[0].t < 6e4)
      return;
    (a.unshift({
      t: Date.now(),
      onde: String(e || "app").slice(0, 40),
      msg: t,
    }),
      lsS(ERR_LS, a.slice(0, 60)));
  } catch {}
}
const ERR_IGN =
  /Entre na sua conta|Limite di\xe1rio|liberadas s\xf3 para o dono|Configure o Supabase|AbortError|The user aborted|cancel/i;
{
  const e = anxCall;
  anxCall = async function (t) {
    const a =
      String((t && t.modo) || "?") + (t && t.parte ? ":" + t.parte : "");
    try {
      const o = await e.apply(this, arguments);
      return (
        o && o.erro && !ERR_IGN.test(o.erro) && errAdd("IA · " + a, o.erro),
        o
      );
    } catch (o) {
      throw (
        ERR_IGN.test(String(o.message || o)) ||
          errAdd("IA · " + a, o.message || o),
        o
      );
    }
  };
}
(addEventListener("error", (e) => {
  try {
    if (!e || !e.message) return;
    errAdd(
      "app (código)",
      `${e.message}${e.filename ? " · " + String(e.filename).split("/").pop() + ":" + e.lineno : ""}`,
    );
  } catch {}
}),
  addEventListener("unhandledrejection", (e) => {
    try {
      const t = String((e && e.reason && (e.reason.message || e.reason)) || "");
      t && !ERR_IGN.test(t) && errAdd("app (promessa)", t);
    } catch {}
  }));
const ERRS = { srv: null, busy: 0, err: "" };
async function errServidor() {
  ((ERRS.busy = 1), (ERRS.err = ""), errPinta());
  try {
    const e = await anxCall({ modo: "erros" });
    if (e.erro) throw new Error(e.erro);
    if (!Array.isArray(e.erros))
      throw new Error(
        'Publique a função "analise" nova (v227) para ver os erros do servidor.',
      );
    ERRS.srv = e.erros;
  } catch (e) {
    ERRS.err = String(e.message || e);
  }
  ((ERRS.busy = 0), errPinta());
}
const errHora = (e) =>
  new Date(e).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
function errLista() {
  const e = erLista0().map((a) => ({
      t: a.t,
      onde: a.onde,
      msg: a.msg,
      de: "app",
    })),
    t = (ERRS.srv || []).map((a) => ({
      t: Date.parse(a.t),
      onde: "servidor · " + a.modo + (a.cron ? " (automático)" : ""),
      msg: a.msg,
      de: "srv",
    }));
  return [...e, ...t].sort((a, o) => o.t - a.t).slice(0, 40);
}
function errHtml() {
  const e = errLista();
  return `<div class="card" id="errcard" style="margin-top:10px"><div class="top"><b>🧯 Últimos erros</b><span><button class="btn s" data-err="srv">${ERRS.busy ? "…" : "Erros do servidor"}</button> <button class="btn s" data-err="copia">Copiar relatório</button></span></div>
<div class="sm mut" style="margin:4px 0 6px">Quando algo falhar, toque em "Copiar relatório" e me mande o texto: ele traz o motivo exato, a hora e as versões.</div>${ERRS.err ? `<div class="sm am">${esc(ERRS.err)}</div>` : ""}
${e.length ? `<div class="errl">${e.map((t) => `<div class="erri"><div class="sm"><b>${esc(t.onde)}</b> <span class="mut">${errHora(t.t)}</span></div><div class="sm">${esc(t.msg)}</div></div>`).join("")}</div><button class="btn s" data-err="limpa" style="margin-top:6px">Limpar os deste aparelho</button>` : '<div class="sm g">Nenhum erro registrado neste aparelho. 👍</div>'}</div>`;
}
function errPinta() {
  const e = document.getElementById("errcard");
  e && (e.outerHTML = errHtml());
}
async function errRelatorio() {
  ERRS.srv || (await errServidor().catch(() => {}));
  const e = VER.res || {},
    t = [
      `Diário de Trader ${typeof APP_VER < "u" ? APP_VER : ""} · ${new Date().toLocaleString("pt-BR")}`,
      `Aparelho: ${navigator.userAgent.slice(0, 140)}`,
      `Funções: ${
        Object.keys(e).length
          ? Object.entries(e)
              .map(([a, o]) => a + " " + o)
              .join(", ")
          : "(abra o Status para conferir)"
      }`,
      "",
      ...errLista()
        .slice(0, 30)
        .map((a) => `[${errHora(a.t)}] ${a.onde}: ${a.msg}`),
    ].join(`
`);
  try {
    (await navigator.clipboard.writeText(t),
      toast("Relatório copiado. Cole na conversa.", 3e3));
  } catch {
    navigator.share
      ? navigator.share({ text: t }).catch(() => {})
      : toast("Não consegui copiar.");
  }
  return t;
}
{
  const e = vStatus;
  vStatus = function () {
    return e.apply(this, arguments) + errHtml() + fxuHtml();
  };
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-err]");
  if (!t) return;
  const a = t.dataset.err;
  a === "srv"
    ? errServidor()
    : a === "copia"
      ? errRelatorio()
      : a === "limpa" && (lsS(ERR_LS, []), errPinta());
});
const VER = {
  res: lsJ("diario-ver", {}).res || {},
  ts: lsJ("diario-ver", {}).ts || 0,
  busy: 0,
};
async function verChecar(e) {
  if (
    (navigator.webdriver && !APP_STORAGE.getItem("diario-ver-teste")) ||
    VER.busy ||
    (!e && Date.now() - VER.ts < 6 * 36e5)
  )
    return;
  const t = cfg();
  if (t) {
    VER.busy = 1;
    try {
      const a = ["analise", "notificar", "macro"],
        o = {};
      (await Promise.all(
        a.map(async (s) => {
          try {
            const n = await (
              await fetch(t.url + "/functions/v1/" + s + "?versao=1", {
                headers: { apikey: t.key },
                signal: AbortSignal.timeout(8e3),
              })
            )
              .json()
              .catch(() => null);
            n && n.versao && (o[s] = n.versao);
          } catch {}
        }),
      ),
        Object.keys(o).length &&
          ((VER.res = o),
          (VER.ts = Date.now()),
          lsS("diario-ver", { res: o, ts: VER.ts })));
    } catch {}
    if (((VER.busy = 0), tab === "home")) {
      const a = scrollY;
      (render(), scrollTo(0, a));
    }
  }
}
function verVelhas() {
  const e = (t) => +String(t || "").replace(/\D/g, "") || 0;
  return Object.entries(VER.res || {})
    .filter(([t, a]) => FN_ESPERADA[t] && e(a) < e(FN_ESPERADA[t]))
    .map(([t, a]) => ({ f: t, v: a, esp: FN_ESPERADA[t] }));
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home") return;
      setTimeout(() => verChecar(!1), 1500);
      const t = verVelhas(),
        a = document.getElementById("app");
      if (!t.length || !a || a.querySelector("#verav")) return;
      const o = document.createElement("div");
      ((o.id = "verav"),
        (o.className = "warn sm"),
        (o.style.margin = "0 0 10px"),
        (o.innerHTML = `⚠️ <b>Falta publicar no Supabase:</b> ${t.map((n) => `${esc(n.f)} (está na ${esc(n.v)}, a nova é a ${esc(n.esp)})`).join(", ")}. Sem isso, algumas telas novas não funcionam. <button class="lnk" data-gotostatus="1">Ver no Status</button>`));
      const s = a.querySelector('section[data-hb="hero"]');
      s ? s.before(o) : a.prepend(o);
    } catch {}
  };
}
document.addEventListener("click", (e) => {
  e.target.closest("[data-gotostatus]") &&
    (irPara("status"), scrollTo(0, 0));
});
const USO_LS = "diario-uso",
  OC_LS = "diario-oculto",
  TEL_LS = "diario-telas",
  USOT = (() => {
    const e = lsJ(USO_LS, null);
    return e && e.ini ? e : { ini: Date.now(), k: {} };
  })(),
  ocL = () => {
    const e = lsJ(OC_LS, []);
    return Array.isArray(e) ? e : [];
  },
  FX_NUNCA = new Set([
    "home",
    "status",
    "mais",
    "dia",
    "trades",
    "mercado",
    "estudos:liv",
  ]);
function usoChave() {
  try {
    return tab === "mercado"
      ? HUB_M.some((e) => e[0] === "mercado:" + MKT.tab)
        ? "mercado:" + MKT.tab
        : "mercado"
      : tab === "estudos"
        ? "estudos:" + (ESV || "liv")
        : tab;
  } catch {
    return tab;
  }
}
let usoUlt = "";
{
  const e = render0;
  render0 = function () {
    var t;
    e.apply(this, arguments);
    try {
      const a = usoChave();
      if (a && a !== usoUlt) {
        usoUlt = a;
        const o = (t = USOT.k)[a] ?? (t[a] = { n: 0, u: 0 });
        (o.n++, (o.u = Date.now()), lsS(USO_LS, USOT));
      }
      fxuAplica();
    } catch {}
  };
}
function telasCat() {
  const e = lsJ(TEL_LS, {});
  try {
    HUB_M.forEach(([t, a]) => {
      e[t] || (e[t] = "Mercado › " + a);
    });
  } catch {}
  return (
    Object.entries({
      liv: "Livros",
      pr: "Prompts",
      cnpi: "CNPI-T",
      pl: "Planos",
      ing: "Inglês",
      foco: "Foco",
      treino: "Treino",
      juros: "Juros",
    }).forEach(([t, a]) => {
      e["estudos:" + t] || (e["estudos:" + t] = "Estudos › " + a);
    }),
    e
  );
}
function telasLerMenu() {
  const e = document.getElementById("mdr") || document.getElementById("mdr2");
  if (!e) return;
  const t = lsJ(TEL_LS, {});
  let a = 0;
  (e.querySelectorAll('[data-a="gotab"][data-id]').forEach((o) => {
    const s = o.dataset.id,
      n = (o.querySelector("b") || o).textContent.trim();
    s && n && t[s] !== n && ((t[s] = n), a++);
  }),
    a && lsS(TEL_LS, t));
}
new MutationObserver(() => {
  (document.getElementById("mdr") || document.getElementById("mdr2")) &&
    (telasLerMenu(), fxuAplica());
}).observe(document.body, { childList: !0, subtree: !1 });
function fxuAplica() {
  const e = ocL();
  if (!e.length) return;
  const t = usoChave();
  e.forEach((a) => {
    if (a === t || a === tab) return;
    const o = a.startsWith("estudos:")
      ? `[data-ep="esv"][data-id="${a.slice(8)}"]`
      : `[data-a="gotab"][data-id="${a}"],#app .hub2 [data-hub="${a}"],#app .seg.hub [data-hub="${a}"]`;
    try {
      document.querySelectorAll(o).forEach((s) => {
        s.classList.contains("on") || (s.style.display = "none");
      });
    } catch {}
  });
}
const FXC = { ab: 0 };
function fxuHtml() {
  const e = telasCat(),
    t = ocL(),
    a = Math.floor((Date.now() - USOT.ini) / 864e5),
    o = 30,
    s = Object.entries(e)
      .filter(([d]) => !FX_NUNCA.has(d))
      .map(([d, c]) => {
        const p = USOT.k[d] || { n: 0, u: 0 };
        return { k: d, l: c, n: p.n, u: p.u, oc: t.includes(d) };
      }),
    n = (d) => !d.n || Date.now() - d.u > 30 * 864e5,
    r = s
      .filter((d) => !d.oc && n(d))
      .sort((d, c) => d.n - c.n || d.l.localeCompare(c.l)),
    i = s
      .filter((d) => d.n && !n(d))
      .sort((d, c) => c.n - d.n)
      .slice(0, 6),
    l = (d) =>
      `<div class="fxi"><span>${esc(d.l)}<small>${d.n ? d.n + "× · última " + new Date(d.u).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "nunca aberta"}</small></span><button class="btn s" data-fx="${esc(d.k)}">${d.oc ? "Mostrar" : "Esconder"}</button></div>`;
  return `<div class="card" id="fxcard" style="margin-top:10px"><div class="top"><b>🧹 Faxina pelo seu uso</b><span class="sm mut">${a < o ? `contando há ${a} dia${a === 1 ? "" : "s"}` : `${a} dias de uso`}</span></div>
<div class="sm mut" style="margin:4px 0 8px">${a < o ? `O app está contando as telas que você abre. Com ${o} dias a sugestão fica confiável (faltam ${o - a}). Esconder não apaga nada.` : "Telas que você não abriu nos últimos 30 dias. Esconder tira do menu e das abas, sem apagar nada."}</div>
${Object.keys(lsJ(TEL_LS, {})).length < 5 ? '<div class="sm am" style="margin-bottom:6px">Abra o menu ☰ uma vez para o app conhecer todas as telas.</div>' : ""}${i.length ? `<div class="sm" style="margin-bottom:6px"><b>Mais usadas:</b> ${i.map((d) => esc(d.l.split(" › ").pop()) + " (" + d.n + "×)").join(", ")}</div>` : ""}
${r.length ? `<details${FXC.ab ? " open" : ""} data-fxab="1"><summary class="sm"><b>${r.length} tela${r.length > 1 ? "s" : ""} sem uso</b> — ver e esconder</summary>${r.map(l).join("")}${a >= o ? '<button class="btn s" data-fx="__todas" style="margin-top:6px">Esconder todas as sem uso</button>' : ""}</details>` : '<div class="sm g">Você usa todas as telas. 👍</div>'}
${t.length ? `<div class="sm" style="margin-top:8px">Escondidas: ${t.map((d) => esc((e[d] || d).split(" › ").pop())).join(", ")} <button class="lnk" data-fx="__mostra">Mostrar tudo</button></div>` : ""}</div>`;
}
function fxuPinta() {
  const e = document.getElementById("fxcard");
  e && (e.outerHTML = fxuHtml());
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-fx]");
  if (!t) return;
  const a = t.dataset.fx;
  let o = ocL();
  if (((FXC.ab = 1), a === "__mostra")) o = [];
  else if (a === "__todas") {
    const s = telasCat();
    o = [
      ...new Set([
        ...o,
        ...Object.keys(s).filter(
          (n) =>
            !FX_NUNCA.has(n) &&
            (!USOT.k[n] ||
              !USOT.k[n].n ||
              Date.now() - USOT.k[n].u > 30 * 864e5),
        ),
      ]),
    ];
  } else o = o.includes(a) ? o.filter((s) => s !== a) : [...o, a];
  if ((lsS(OC_LS, o), a === "__mostra")) {
    const s = scrollY;
    (render(), scrollTo(0, s), toast("Todas as telas de volta."));
  } else fxuPinta();
  fxuAplica();
}),
  document.addEventListener(
    "toggle",
    (e) => {
      e.target.matches &&
        e.target.matches("[data-fxab]") &&
        (FXC.ab = e.target.open);
    },
    !0,
  ));
{
  const e = TraderStyles.slot("legacy-080");
  ((e.textContent = TraderStyles.css("legacy-080")), TraderStyles.mount(e));
}
FN_ESPERADA.macro = "v228";
async function jrPdf() {
  const e = jrVer();
  if (!e || !e.manchete) return toast("Abra uma edição primeiro.");
  toast("Montando o PDF da edição…", 2500);
  try {
    const t = await rpLib(),
      a = new Date((e.dia || loc().slice(0, 10)) + "T12:00").toLocaleDateString(
        "pt-BR",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" },
      ),
      o = await rpNovo(t, {
        titulo: "Jornal do Pregão · " + a,
        cabecalho: "Jornal do Pregão · " + (e.nome || ""),
        data: a,
        tipo: "Jornal",
      }),
      { C: s, M: n } = o;
    (o.rect(0, 0, o.W, 92, { fill: o.hex("#d7c5a3") }),
      o.t("Jornal do Pregão", o.W / 2, 26, {
        s: 30,
        f: "b",
        c: o.hex("#111111"),
        al: "c",
      }),
      o.t(a + " · " + (e.nome || ""), o.W / 2, 66, {
        s: 10,
        c: s.mut,
        al: "c",
      }),
      (o.y = 112));
    const r = (e.cotacoes || []).slice(0, 8);
    r.length &&
      o.kpis(
        r.map((u) => ({
          l: u.n || u.k,
          v:
            u.px != null
              ? Number(u.px).toLocaleString("pt-BR", {
                  maximumFractionDigits: u.px > 1e3 ? 0 : u.px < 10 ? 4 : 2,
                })
              : "–",
          d:
            u.d1 != null
              ? (u.d1 >= 0 ? "+" : "") +
                u.d1.toFixed(2).replace(".", ",") +
                "% no dia"
              : "",
          c: u.d1 > 0 ? s.g : u.d1 < 0 ? s.r : s.tx,
        })),
        { cols: 4, h: 52, vs: 13 },
      );
    const i = (u, m) => {
      if (!(!u || !u.titulo)) {
        {
          const f = Math.max(40, o.CW / 5.2),
            x = (g) => Math.ceil(String(g || "").length / f),
            v =
              36 +
              x(u.titulo) * (m ? 24 : 18) +
              (u.linha_fina ? x(u.linha_fina) * 14 : 0) +
              ((u.numeros || []).length
                ? u.numeros.length > 4
                  ? 100
                  : 50
                : 0) +
              String(u.texto || "")
                .split(/\n\s*\n/)
                .reduce((g, h) => g + x(h) * 15 + 6, 0) +
              (u.por_que_importa ? 54 : 0) +
              (jrTemImp(u.impacto) ? 20 : 0);
          o.need(Math.min(v, m ? 320 : 250));
        }
        ((o.y += m ? 6 : 10),
          o.t(
            (
              (u.editoria || "") + (u.chapeu ? " · " + u.chapeu : "")
            ).toUpperCase(),
            n,
            o.y,
            { s: 8, f: "b", c: o.hex(JR_COR[u.editoria] || "#3b3e43") },
          ),
          (o.y += 13),
          o.para(u.titulo, { s: m ? 19 : 14, f: "b", lh: 1.22, gap: 4 }),
          u.linha_fina &&
            o.para(u.linha_fina, { s: m ? 11 : 10, c: s.mut, f: "i", gap: 6 }),
          u.numeros &&
            u.numeros.length &&
            o.kpis(
              u.numeros.slice(0, 6).map((f) => ({ l: f.rotulo, v: f.valor })),
              {
                cols: u.numeros.length > 4 ? 3 : Math.min(4, u.numeros.length),
                h: 42,
                vs: 12,
              },
            ),
          o.para(String(u.texto || "").split(/\n\s*\n/), { s: 10.2, gap: 6 }),
          u.por_que_importa &&
            o.caixa("Por que importa", [u.por_que_importa], {
              s: 9.5,
              barra: s.ac,
            }),
          jrTemImp(u.impacto) && o.nota("Impacto: " + jrImpTxt(u.impacto)),
          (u.link || u.fonte_url) &&
            o.nota(
              (u.fonte_url ? "Fonte dos números: " + u.fonte_url : "") +
                (u.link
                  ? (u.fonte_url ? " · " : "") + "Documento na CVM: " + u.link
                  : ""),
            ),
          o.ln(n, o.y + 2, n + o.CW, o.y + 2, { c: s.bd, w: 0.6 }),
          (o.y += 10));
      }
    };
    i(e.manchete, !0);
    {
      const u = jrResumo(e);
      u.length &&
        (o.h2("Resumo executivo"),
        o.bul(
          u.map(
            (m) =>
              m.titulo + (m.por_que_importa ? " — " + m.por_que_importa : ""),
          ),
        ));
    }
    {
      const u = jrImpAgg(e),
        m = jrSetAgg(e);
      (u.length || m.length) &&
        (o.h2("Impacto nos ativos"),
        u.length &&
          o.tab(
            [
              { l: "Ativo", w: 30 },
              { l: "Efeito provável", w: 50 },
              { l: "Matérias", w: 40 },
            ],
            u.map((f) => [
              { t: f.a, f: "b" },
              (JR_DIR[f.dir] || JR_DIR[""])[2],
              String(f.n),
            ]),
          ),
        m.length &&
          o.nota(
            "Setores: " +
              m.map((f) => f.s + (f.n > 1 ? " (" + f.n + ")" : "")).join(" · "),
          ),
        o.nota("Leitura da redação, não é recomendação."));
    }
    {
      const u = ["win", "wdo"].map(jrTecDados).filter(Boolean);
      u.length &&
        (o.h2("Análise técnica"),
        o.tab(
          [
            { l: "Ativo", w: 18 },
            { l: "Tendência", w: 20 },
            { l: "Resistência (R1)", w: 28 },
            { l: "Pivô", w: 24 },
            { l: "Suporte (S1)", w: 28 },
          ],
          u.map((m) => [
            { t: m.tk, f: "b" },
            m.tend,
            jrNumF(m.R1, m.div),
            jrNumF(m.P, m.div),
            jrNumF(m.S1, m.div),
          ]),
        ),
        o.nota(
          "Pivô clássico com a máxima, a mínima e o último preço do pregão (candles de 5 min). Não é recomendação.",
        ));
    }
    ((e.em_poucas_linhas || []).length &&
      (o.h2("Em poucas linhas"), o.bul(e.em_poucas_linhas)),
      (e.materias || []).length &&
        (o.h2("Mais do dia"), e.materias.forEach((u) => i(u, !1))));
    {
      const u = JRN.varr;
      if (u && (u.ranking || []).length) {
        const m = (f) =>
          f == null
            ? "–"
            : Number(f).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
        (o.h2("Oportunidades fundamentalistas"),
          u.resumo && o.para(u.resumo, { s: 10.2, gap: 6 }),
          o.tab(
            [
              { l: "Ação", w: 20 },
              { l: "Preço", w: 24 },
              { l: "Graham", w: 24 },
              { l: "Bazin", w: 24 },
              { l: "Potencial", w: 28 },
            ],
            u.ranking.map((f) => [
              { t: f.tk, f: "b" },
              m(f.preco),
              m(f.graham),
              m(f.bazin),
              (f.potencial_medio_pct >= 0 ? "+" : "") +
                String(f.potencial_medio_pct).replace(".", ",") +
                "%",
            ]),
          ),
          (u.destaques || []).forEach((f) =>
            o.caixa(f.tk, [f.leitura], { s: 9.3 }),
          ),
          o.nota(
            "Graham e Bazin, média do potencial de alta. Triagem por números, não é recomendação de compra.",
          ));
      }
    }
    (e.conferencia &&
      e.conferencia.texto &&
      (o.h2("A manhã acertou?"),
      o.caixa(
        (JRC_V[e.conferencia.veredito] || ["", ""])[1],
        [
          e.conferencia.texto,
          ...(e.conferencia.pontos || []).map((u) => ({
            b: `${u.ok ? "Acertou" : "Errou"}: esperava ${u.previsto}; aconteceu ${u.aconteceu}`,
          })),
        ],
        { s: 9.5 },
      )),
      e.analise &&
        e.analise.texto &&
        (o.h2("Análise", e.analise.titulo),
        o.para(String(e.analise.texto).split(/\n\s*\n/), { s: 10.2, gap: 6 }),
        o.nota(
          "Análise da redação, com os dados do dia. Não é recomendação de investimento.",
        )),
      e.aula &&
        e.aula.texto &&
        (o.h2("Aula de domingo", e.aula.titulo || e.aula.conceito),
        o.para(String(e.aula.texto).split(/\n\s*\n/), { s: 10.2, gap: 6 }),
        (e.aula.perguntas || []).forEach((u) =>
          o.caixa(u.p, [u.r || ""], { s: 9.3 }),
        )),
      (e.agenda || []).length &&
        (o.h2("Agenda econômica"),
        o.tab(
          [
            { l: "Quando", w: 26 },
            { l: "Evento", w: 44 },
            { l: "Por que importa", w: 50 },
          ],
          e.agenda.map((u) => [
            { t: u.quando, f: "b" },
            u.evento,
            u.por_que || "",
          ]),
        )),
      (JRN.pl || []).length &&
        !JRN.arq &&
        (o.h2("Plantão"),
        JRN.pl.forEach((u) => {
          (o.h3(u.titulo),
            u.linha_fina && o.para(u.linha_fina, { s: 9.5, c: s.mut, f: "i" }),
            o.para(String(u.texto || "").split(/\n\s*\n/), { s: 10, gap: 5 }));
        })),
      (e.fontes || []).length &&
        (o.h2("Fontes"),
        o.bul(
          e.fontes.map((u) => (u.titulo || "") + (u.url ? " — " + u.url : "")),
          { s: 8.5 },
        )),
      o.nota(
        "Edição escrita pela IA com pesquisa na internet e os números do app. Confira os fatos antes de repassar. Não é recomendação de investimento.",
      ),
      rpRodape(o));
    const l = await o.doc.save(),
      d = new Blob([l], { type: "application/pdf" }),
      c = `jornal-${e.dia || loc().slice(0, 10)}-${e.edicao || ""}.pdf`;
    ((window.__jrpdf = l.length), (window.__jrpdfPag = o.doc.getPageCount()));
    try {
      const u = new File([d], c, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [u] })) {
        await navigator.share({ files: [u], title: "Jornal do Pregão" });
        return;
      }
    } catch (u) {
      if (u && u.name === "AbortError") return;
    }
    const p = document.createElement("a");
    ((p.href = URL.createObjectURL(d)),
      (p.download = c),
      document.body.appendChild(p),
      p.click(),
      setTimeout(() => {
        (URL.revokeObjectURL(p.href), p.remove());
      }, 4e3),
      toast("PDF salvo."));
  } catch (t) {
    toast("Não consegui gerar o PDF: " + (t.message || t), 4e3);
    try {
      errAdd("jornal · PDF", t.message || t);
    } catch {}
  }
}
{
  const e = jrCorpo;
  jrCorpo = function () {
    let t = e.apply(this, arguments);
    try {
      t = t.replace(
        '<button class="btn s" data-jrimg="1">🖼️ Imagem</button>',
        '<button class="btn s" data-jrpdf="1">📄 PDF</button> <button class="btn s" data-jrimg="1">🖼️ Imagem</button>',
      );
    } catch {}
    return t;
  };
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest("[data-jrpdf]") && jrPdf();
  },
  !0,
);
{
  const e = mdoPre;
  mdoPre = function (t) {
    let a = e.apply(this, arguments);
    try {
      if (!t) return a;
      (t.forca === "forte" &&
        (a = a.replace(
          /(<div class="mdo-vies"[^>]*>Vi\xe9s [^<]*)/,
          (o) => o.replace(/\s*$/, "") + " forte ",
        )),
        t.alerta &&
          (a = a.replace(
            '<div class="mdo-bar">',
            `<div class="mdo-alerta" style="background:color-mix(in srgb,var(--${t.nota > 0 ? "g" : "r"}) 12%,transparent)">${t.nota > 0 ? "🚀" : "⚠️"} ${esc(t.alerta)}</div><div class="mdo-bar">`,
          )));
    } catch {}
    return a;
  };
}
{
  const e = TraderStyles.slot("legacy-081");
  ((e.textContent = TraderStyles.css("legacy-081")), TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v229";
function b3Fechada() {
  const e = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
    ),
    t = e.getHours() * 60 + e.getMinutes(),
    a = e.getDay();
  return a === 0 || a === 6 || t < 540;
}
function ultPregao() {
  let e = new Date(loc().slice(0, 10) + "T12:00:00");
  for (e.setDate(e.getDate() - 1); e.getDay() === 0 || e.getDay() === 6; )
    e.setDate(e.getDate() - 1);
  return (
    ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][e.getDay()] +
    " " +
    String(e.getDate()).padStart(2, "0") +
    "/" +
    String(e.getMonth() + 1).padStart(2, "0")
  );
}
{
  const e = jrIndsHtml;
  jrIndsHtml = function (t) {
    const a = e.apply(this, arguments);
    try {
      if (!JRN.arq && b3Fechada()) {
        const o = ultPregao();
        a.h = a.h.replace(
          /(<span class="jrind"><small>)([^<]*)(<\/small>)/g,
          (s, n, r, i) =>
            /Ibovespa|Mini|WIN|WDO|futuro|\bDI\b|DI1|Small|IFIX/i.test(r)
              ? `${n}${r}${i}<small class="jrfech">fech. ${o}</small>`
              : s,
        );
      }
    } catch {}
    return a;
  };
}
{
  const e = TraderStyles.slot("legacy-082");
  ((e.textContent = TraderStyles.css("legacy-082")), TraderStyles.mount(e));
}
FN_ESPERADA.analise = "v230";
const FAC_GRADE = {
    nome: "Economia · período 4 (2026)",
    curso: "Ciências Econômicas (UniFatecie)",
    materias: [
      [
        "Sustentabilidade Corporativa e ESG – Resiliência e Valor",
        [
          ["Desenvolvimento sustentável e o Relatório Brundtland", 1],
          ["Tripé da sustentabilidade (triple bottom line)", 1],
          ["O que é ESG: ambiental, social e governança", 1],
          ["Governança corporativa e os níveis de listagem da B3", 2],
          ["Riscos climáticos e transição energética", 2],
          ["Mercado de carbono e créditos de carbono", 2],
          ["Relatórios e indicadores: GRI, ISSB e o ISE B3", 2],
          ["Greenwashing: como reconhecer", 1],
          ["Resiliência empresarial e gestão de riscos", 2],
          ["ODS da ONU e a Agenda 2030", 1],
        ],
      ],
      [
        "História Econômica Geral",
        [
          ["Feudalismo e a transição para o capitalismo", 2],
          ["Mercantilismo e as grandes navegações", 2],
          ["Revolução Industrial", 2],
          ["Capitalismo no século XIX e o imperialismo", 2],
          ["Crise de 1929 e a Grande Depressão", 2],
          ["Bretton Woods e os anos dourados do pós-guerra", 3],
          ["Choques do petróleo e a crise dos anos 1970", 2],
          ["Neoliberalismo, globalização e a crise de 2008", 2],
        ],
      ],
      [
        "Introdução ao Curso de Ciências Econômicas",
        [
          ["O que é Economia: escassez e escolha", 1],
          [
            "Custo de oportunidade e fronteira de possibilidades de produção",
            2,
          ],
          ["Microeconomia × Macroeconomia", 1],
          ["Fluxo circular da renda", 1],
          ["Oferta, demanda e formação de preços", 2],
          ["Os grandes números: PIB, inflação e desemprego", 2],
          ["Moeda, juros e o Banco Central", 2],
          ["O papel do Estado na economia", 2],
          [
            "Escolas do pensamento econômico: clássicos, Keynes e monetaristas",
            3,
          ],
          ["O economista: áreas de atuação e ética", 1],
        ],
      ],
      [
        "Gestão Orçamentária",
        [
          ["Conceito e funções do orçamento empresarial", 1],
          ["Planejamento estratégico e orçamento", 2],
          ["Orçamento de vendas", 2],
          ["Orçamento de produção e de compras", 2],
          ["Orçamento de despesas operacionais", 2],
          ["Orçamento de capital (investimentos)", 3],
          ["Fluxo de caixa projetado", 3],
          ["DRE e balanço projetados", 3],
          ["Controle orçamentário e análise de variações", 2],
          ["Orçamento base zero e orçamento flexível", 2],
          ["Orçamento público: PPA, LDO e LOA", 2],
        ],
      ],
    ],
  },
  FAC = {
    aula: null,
    busy: "",
    err: "",
    jn: null,
    jnBusy: 0,
    jnErr: "",
    flash: null,
    emAb: null,
  };
function facPlano() {
  return plL().find((e) => e.id === (S.ax || {}).facPlano) || null;
}
function facMonta() {
  const e = ymd(new Date()),
    t = {
      id: plId(),
      tipo: "eco",
      nome: FAC_GRADE.nome,
      curso: FAC_GRADE.curso,
      fim: addD(e, 75),
      horas: 6,
      dias: [1, 2, 3, 4, 5, 6],
      lembrete: "20:00",
      criado: e,
      materias: FAC_GRADE.materias.map(([a, o]) => ({
        id: plId(),
        nome: a,
        prova: "",
        ementa: "",
        top: o.map(([s, n]) => ({ id: plId(), t: s, d: n })),
      })),
    };
  return (
    plL().push(t),
    ((S.ax ?? (S.ax = {})).facPlano = t.id),
    (S.ax.plAtivo = t.id),
    save(),
    facMats(),
    t
  );
}
function facMats() {
  const e = facPlano();
  e &&
    e.materias.forEach((t) => {
      const a = "fac:" + t.id,
        o = FOCO_MAT.findIndex((s) => s[0] === a);
      o < 0
        ? FOCO_MAT.splice(FOCO_MAT.findIndex((s) => s[0] === "fac") + 1, 0, [
            a,
            "🎓 " + t.nome,
          ])
        : (FOCO_MAT[o][1] = "🎓 " + t.nome);
    });
}
try {
  facMats();
} catch {}
const facDisc = () => {
  const e = facPlano();
  return e ? e.materias : [];
};
function facMinSemana(e) {
  const t = enHoje(),
    a = segundaDe(t);
  return sum(
    focoLog()
      .filter((o) => o.d >= a && o.mat === "fac:" + e)
      .map((o) => o.min),
  );
}
function facMinTotalSemana() {
  const e = enHoje(),
    t = segundaDe(e);
  return sum(
    focoLog()
      .filter((a) => a.d >= t && String(a.mat).startsWith("fac"))
      .map((a) => a.min),
  );
}
function facSeq() {
  const e = new Set(
    focoLog()
      .filter((o) => String(o.mat).startsWith("fac"))
      .map((o) => o.d),
  );
  try {
    facPlano().materias.forEach((o) =>
      o.top.forEach((s) => {
        s.feito && e.add(new Date(s.feito).toISOString().slice(0, 10));
      }),
    );
  } catch {}
  let t = 0,
    a = enHoje();
  for (e.has(a) || (a = diasMais(a, -1)); e.has(a); )
    (t++, (a = diasMais(a, -1)));
  return t;
}
const facProxTop = (e) => e.top.find((t) => !t.feito) || null;
function facProva(e) {
  const t = hjD(),
    a = facL()
      .filter((o) => o.d >= t && o.disc === e.id)
      .sort((o, s) => o.d.localeCompare(s.d))[0];
  return a
    ? { d: a.d, t: a.t, tp: a.tp }
    : e.prova && e.prova >= t
      ? { d: e.prova, t: "Prova", tp: "prova" }
      : null;
}
const FAC_LS = "diario-fac-aulas",
  facAulas = () => {
    const e = lsJ(FAC_LS, {});
    return e && typeof e == "object" ? e : {};
  };
async function facAula(e, t, a) {
  const o = facPlano(),
    s = o && o.materias.find((l) => l.id === e),
    n = s && s.top.find((l) => l.id === t);
  if (!n) return;
  const r = e + "|" + t,
    i = facAulas();
  if (((FAC.aula = { mid: e, tid: t }), (FAC.err = ""), i[r] && !a)) {
    ((FAC.flash = null), facPinta(), scrollTo(0, 0));
    return;
  }
  ((FAC.busy = r), facPinta(), scrollTo(0, 0));
  try {
    const l = await anxCall({
      modo: "aula_disc",
      disciplina: s.nome,
      topico: n.t,
      curso: o.curso,
      ementa: s.ementa || "",
    });
    if (l.erro) throw new Error(l.erro);
    if (!l.explicacao)
      throw new Error(
        'Publique a função "analise" nova (v230) para ter as aulas.',
      );
    const d = facAulas();
    d[r] = { ...l, em: Date.now() };
    const c = Object.keys(d);
    (c.length > 40 &&
      c
        .sort((p, u) => d[p].em - d[u].em)
        .slice(0, c.length - 40)
        .forEach((p) => delete d[p]),
      lsS(FAC_LS, d));
  } catch (l) {
    FAC.err = String(l.message || l);
  }
  ((FAC.busy = ""), facPinta());
}
function facAulaHtml() {
  const e = FAC.aula;
  if (!e) return "";
  const t = facPlano(),
    a = t && t.materias.find((r) => r.id === e.mid),
    o = a && a.top.find((r) => r.id === e.tid);
  if (!o) return "";
  const s = facAulas()[e.mid + "|" + e.tid],
    n = `<div class="top"><b>📖 ${esc(o.t)}</b><button class="btn s" data-facv="fecha">✕</button></div><div class="sm mut">${esc(a.nome)}</div>`;
  return FAC.busy === e.mid + "|" + e.tid
    ? `<div class="card facaula">${n}<div class="sm mut" style="padding:14px 0">Preparando a aula e procurando um exemplo real e atual… (até 1 minuto)</div></div>`
    : s
      ? `<div class="card facaula">${n}<div class="jrtxt facx">${jrPar(s.explicacao)}</div>
${s.exemplo ? `<div class="facex"><b>🌎 Exemplo real: ${esc(s.exemplo.titulo || "")}</b><div class="jrtxt">${jrPar(s.exemplo.texto)}</div>${s.exemplo.fonte_url ? `<div class="sm">🔗 <a href="${esc(urlSegura(s.exemplo.fonte_url))}" target="_blank" rel="noopener">Fonte do exemplo</a></div>` : ""}</div>` : ""}
${(s.pontos || []).length ? `<div class="facpk"><b>📌 Para revisar</b><ul>${s.pontos.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>` : ""}
${s.pergunta ? `<details class="facpq"><summary>🤔 ${esc(s.pergunta.p)}</summary><div>${esc(s.pergunta.r)}</div></details>` : ""}
<div class="facbt"><button class="btn${o.feito ? " s" : ""}" data-facfeito="${e.mid}|${e.tid}">${o.feito ? "✓ Estudado" : "✅ Marcar como estudado"}</button><button class="btn s" data-facflash="${e.mid}|${e.tid}">🃏 Flashcards (${(s.flash || []).length})</button><button class="btn s" data-plq="${e.mid}|${e.tid}">🧠 Questões</button><button class="btn s" data-facfoco="${e.mid}">⏱️ 25 min</button><button class="btn s" data-facaula="${e.mid}|${e.tid}" data-novo="1">↻ Outra versão</button></div>
${FAC.flash && FAC.flash.k === e.mid + "|" + e.tid ? facFlashHtml(s) : ""}</div>`
      : `<div class="card facaula">${n}${FAC.err ? `<div class="warn sm">${esc(FAC.err)}</div>` : ""}<button class="btn" data-facaula="${e.mid}|${e.tid}">Tentar de novo</button></div>`;
}
function facFlashHtml(e) {
  const t = FAC.flash,
    a = e.flash || [];
  if (!a.length) return "";
  const o = t.i % a.length,
    s = a[t.ordem[o % t.ordem.length]];
  return `<div class="facfl" data-facvira="1"><div class="sm mut">${o + 1} de ${a.length} · toque para virar</div><div class="facflc">${esc(t.virado ? s.v : s.f)}</div></div><div class="facbt"><button class="btn s" data-facfln="0">😕 Não sabia</button><button class="btn s" data-facfln="1">😎 Sabia</button></div>`;
}
async function facJornal() {
  const e = JRN.v;
  if (!e || !e.manchete) {
    toast("Abra o Jornal de hoje primeiro (Mercado → Jornal).");
    return;
  }
  ((FAC.jnBusy = 1), (FAC.jnErr = ""), facPinta());
  try {
    const t = await anxCall({
      modo: "jornal_aula",
      disciplinas: facDisc().map((a) => a.nome),
      edicao:
        jrResumoEd(e) +
        (e.analise
          ? `
Análise: ` +
            e.analise.titulo +
            ". " +
            String(e.analise.texto).slice(0, 800)
          : ""),
    });
    if (t.erro) throw new Error(t.erro);
    if (!Array.isArray(t.itens))
      throw new Error('Publique a função "analise" nova (v230).');
    ((FAC.jn = { k: jrK(e), itens: t.itens }), lsS("diario-fac-jn", FAC.jn));
  } catch (t) {
    FAC.jnErr = String(t.message || t);
  }
  ((FAC.jnBusy = 0), facPinta());
}
FAC.jn = lsJ("diario-fac-jn", null);
function facJnHtml() {
  const e = JRN.v,
    t = FAC.jn && e && FAC.jn.k === jrK(e);
  return `<div class="card"><div class="top"><b>📰 Exemplos reais de hoje</b><button class="btn s" data-facjn="1">${FAC.jnBusy ? "…" : t ? "↻" : "Ligar o jornal às matérias"}</button></div><div class="sm mut" style="margin:2px 0 6px">A notícia de hoje que melhor mostra um conceito de cada disciplina sua.</div>
${FAC.jnErr ? `<div class="sm am">${esc(FAC.jnErr)}</div>` : ""}${t ? FAC.jn.itens.map((a) => `<div class="facjn"><div class="sm"><b>${esc(a.disc)}</b>${a.conceito ? ' · <span class="g">' + esc(a.conceito) + "</span>" : ""}</div>${a.materia ? `<div class="sm mut">📰 ${esc(a.materia)}</div>` : ""}<div class="sm" style="line-height:1.5;margin-top:2px">${esc(a.texto)}</div></div>`).join("") : ""}</div>`;
}
function facHubHtml() {
  const e = facPlano();
  if (!e)
    return `<h1>Estudos</h1>${estSeg("fac")}<div class="card"><b>🎓 Monte sua grade</b><div class="sm" style="margin:6px 0">Ciências Econômicas · período 4 (2026): Sustentabilidade Corporativa e ESG, História Econômica Geral, Introdução ao Curso de Ciências Econômicas e Gestão Orçamentária.</div><div class="sm mut" style="margin-bottom:8px">Cada disciplina vem com os tópicos mais comuns; depois você cola a ementa de cada uma e a IA ajusta para o seu plano de ensino.</div><button class="btn" data-facmonta="1" style="width:100%">Montar minha grade</button></div>${facHtml()}`;
  const t = +(S.ax || {}).facMeta || 300,
    a = facMinTotalSemana(),
    o = Math.min(1, a / t),
    s = facSeq(),
    n = ymd(new Date()),
    r = plAgenda(e, n),
    i = (r.ag[n] || [])
      .filter((d) => d.tp === "est" || d.tp === "rev")
      .slice(0, 3),
    l = (d) => {
      const c = d.top.filter((f) => f.feito).length,
        p = facProxTop(d),
        u = facProva(d),
        m = facMinSemana(d.id);
      return `<div class="card facd"><div class="top"><b>${esc(d.nome)}</b><span class="sm mut">${c}/${d.top.length}</span></div><div class="cnbar" style="margin:6px 0"><b style="width:${d.top.length ? (c / d.top.length) * 100 : 0}%"></b></div>
<div class="sm">${u ? `<span class="${u.d <= diasMais(hjD(), 7) ? "am" : ""}">📝 ${esc(u.t)} ${facFalta(u.d)} (${fmtD(u.d).slice(0, 5)})</span> · ` : ""}⏱️ ${m} min nesta semana</div>
${p ? `<div class="sm" style="margin-top:6px">Próximo: <b>${esc(p.t)}</b></div>` : '<div class="sm g" style="margin-top:6px">Todos os tópicos estudados. 🎉</div>'}
<div class="facbt">${p ? `<button class="btn" data-facaula="${d.id}|${p.id}">📖 Aula com exemplo real</button>` : ""}<button class="btn s" data-facfoco="${d.id}">⏱️ Estudar 25 min</button>${p ? `<button class="btn s" data-plq="${d.id}|${p.id}">🧠 Questões</button>` : ""}<button class="btn s" data-facem="${d.id}">📎 Ementa${d.ementa ? " ✓" : ""}</button></div>
${FAC.emAb === d.id ? `<div class="facem"><textarea id="facemtx" rows="6" placeholder="Cole aqui a ementa ou o plano de ensino da disciplina (do AVA da UniFatecie)">${esc(d.ementa || "")}</textarea><div class="facbt"><button class="btn" data-facemsv="${d.id}">Salvar e ajustar os tópicos com a IA</button><button class="btn s" data-facem="${d.id}">Cancelar</button></div><div class="sm mut">Os tópicos que você já estudou ficam; os outros são refeitos seguindo a ementa.</div></div>` : ""}
<details class="factp"><summary class="sm">Ver os ${d.top.length} tópicos</summary>${d.top.map((f) => `<div class="factpi"><span class="sm">${f.feito ? "✅" : "▫️"} ${esc(f.t)}</span><button class="lnk" data-facaula="${d.id}|${f.id}">aula</button></div>`).join("")}</details></div>`;
    };
  return `<h1>Estudos</h1>${estSeg("fac")}${facAulaHtml()}
<div class="card facmeta"><div class="top"><b>🎓 ${esc(e.curso || "Faculdade")}</b><span class="sm mut">${esc(e.nome)}</span></div>
<div class="facnum"><div><b>${Math.floor(a / 60)}h${String(a % 60).padStart(2, "0")}</b><span class="sm mut">de ${Math.round(t / 60)}h nesta semana</span></div><div><b>${s}🔥</b><span class="sm mut">dia${s === 1 ? "" : "s"} seguido${s === 1 ? "" : "s"} estudando</span></div></div>
<div class="cnbar" style="margin:6px 0"><b style="width:${o * 100}%"></b></div>
<div class="sm mut">Meta da semana: <select data-facmeta="1">${[120, 180, 240, 300, 420, 600].map((d) => `<option value="${d}"${d === t ? " selected" : ""}>${d / 60}h</option>`).join("")}</select> · conta o cronômetro de foco das disciplinas</div>
${i.length ? `<div class="sm" style="margin-top:8px"><b>Hoje no seu plano:</b> ${i.map((d) => `<button class="lnk" data-facaula="${d.m.id}|${d.x.id}">${d.tp === "rev" ? "🔁 " : ""}${esc(d.x.t)}</button>`).join(" · ")}</div>` : ""}</div>
${facJnHtml()}${facDisc().map(l).join("")}${facHtml()}
<div class="sm mut" style="margin:8px 0">A agenda completa até a prova, as revisões em 1 dia, 1 semana e 1 mês e o lembrete ficam em <button class="lnk" data-ep="esv" data-id="pl">🗓️ Planos</button>.</div>`;
}
function facPinta() {
  if (tab === "estudos" && ESV === "fac") {
    const e = scrollY;
    (render(), scrollTo(0, e));
  }
}
{
  const e = vEstudos;
  vEstudos = function () {
    return ESV !== "fac" ? e.apply(this, arguments) : facHubHtml();
  };
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "estudos") return;
      const t = [...document.querySelectorAll("#app .seg")].find((o) =>
        o.querySelector('[data-ep="esv"][data-id="liv"]'),
      );
      if (!t) return;
      let a = t.querySelector('[data-id="fac"]');
      if (!a) {
        ((a = document.createElement("button")),
          (a.dataset.ep = "esv"),
          (a.dataset.id = "fac"),
          (a.textContent = "🎓 Faculdade"));
        const o = t.querySelector('[data-id="juros"]');
        o ? t.insertBefore(a, o) : t.appendChild(a);
      }
      ESV === "fac" &&
        (t.querySelectorAll("button").forEach((o) => o.classList.remove("on")),
        a.classList.add("on"));
    } catch {}
  };
}
GOR.faculdade = () => {
  ((GO.r = null), (ESV = "fac"), irPara("estudos"));
};
{
  const e = facHtml;
  facHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = facDisc();
      if (!a.length) return t;
      ((t = t.replace(
        '<div style="display:flex;gap:6px;margin-top:6px"><select id="factp"',
        `<label class="sm" style="display:block;margin-top:6px">Disciplina<select id="facdisc"><option value="">—</option>${a.map((o) => `<option value="${o.id}">${esc(o.nome)}</option>`).join("")}</select></label><div style="display:flex;gap:6px;margin-top:6px"><select id="factp"`,
      )),
        facL().forEach((o) => {
          if (!o.disc) return;
          const s = a.find((n) => n.id === o.disc);
          s &&
            (t = t.replace(
              `<b>${esc(o.t)}</b><div class="sm mut">`,
              `<b>${esc(o.t)}</b><div class="sm mut">🎓 ${esc(s.nome)} · `,
            ));
        }));
    } catch {}
    return t;
  };
}
document.addEventListener(
  "click",
  (e) => {
    if (!e.target.closest("[data-facadd]")) return;
    const t = document.getElementById("facdisc"),
      a = t ? t.value : "";
    a &&
      setTimeout(() => {
        const o = facL(),
          s = o[o.length - 1];
        if (s && !s.disc) {
          s.disc = a;
          const n = facDisc().find((r) => r.id === a);
          (n &&
            s.tp === "prova" &&
            (!n.prova || s.d < n.prova) &&
            (n.prova = s.d),
            save(),
            render());
        }
      }, 0);
  },
  !0,
);
{
  const e = facAviso;
  facAviso = function () {
    let t = e.apply(this, arguments);
    try {
      facProx(7).forEach((a) => {
        if (!a.disc) return;
        const o = facDisc().find((s) => s.id === a.disc);
        o && (t = t.replace(esc(a.t), esc(a.t) + " · " + esc(o.nome)));
      });
    } catch {}
    return t;
  };
}
{
  const e = anxCall;
  anxCall = async function (t) {
    try {
      t &&
        t.modo === "jornal_quiz" &&
        facDisc().length &&
        (t = { ...t, disciplinas: facDisc().map((a) => a.nome) });
    } catch {}
    return e.call(this, t);
  };
}
{
  const e = jrQzHtml;
  jrQzHtml = function () {
    let t = e.apply(this, arguments);
    try {
      const a = JRN.qz;
      a &&
        a.perguntas &&
        a.perguntas.forEach((o, s) => {
          o.disc &&
            (t = t.replace(
              `<div class="jrqp"><b>${s + 1}. `,
              `<div class="jrqp"><span class="jrqd">🎓 ${esc(o.disc)}</span><b>${s + 1}. `,
            ));
        });
    } catch {}
    return t;
  };
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if (t("[data-facmonta]")) {
      (facMonta(),
        toast(
          "Grade montada! Cole a ementa de cada disciplina para ajustar os tópicos.",
          4e3,
        ),
        facPinta());
      return;
    }
    if ((a = t("[data-facaula]"))) {
      const [o, s] = a.dataset.facaula.split("|");
      ((tab = "estudos"),
        (ESV = "fac"),
        ((S.ax ?? (S.ax = {})).plAtivo = (S.ax || {}).facPlano),
        facAula(o, s, !!a.dataset.novo));
      return;
    }
    if (t('[data-facv="fecha"]')) {
      ((FAC.aula = null), (FAC.flash = null), facPinta());
      return;
    }
    if ((a = t("[data-facfeito]"))) {
      const [o, s] = a.dataset.facfeito.split("|"),
        n = facPlano(),
        r = n && n.materias.find((l) => l.id === o),
        i = r && r.top.find((l) => l.id === s);
      if (!i) return;
      ((i.feito = i.feito ? 0 : Date.now()),
        (i.rv = 0),
        save(),
        i.feito &&
          toast(
            "Boa! A revisão deste tópico entra no plano amanhã, em 1 semana e em 1 mês.",
            3500,
          ),
        facPinta());
      return;
    }
    if ((a = t("[data-facflash]"))) {
      const o = a.dataset.facflash,
        s = facAulas()[o];
      if (!s || !(s.flash || []).length) return;
      const n = s.flash.length;
      ((FAC.flash = {
        k: o,
        i: 0,
        virado: 0,
        ordem: [...Array(n).keys()].sort(() => Math.random() - 0.5),
        ok: 0,
      }),
        facPinta(),
        setTimeout(
          () =>
            document
              .querySelector(".facfl")
              ?.scrollIntoView({ block: "center" }),
          60,
        ));
      return;
    }
    if (t("[data-facvira]")) {
      FAC.flash && ((FAC.flash.virado = !FAC.flash.virado), facPinta());
      return;
    }
    if ((a = t("[data-facfln]"))) {
      const o = FAC.flash;
      if (!o) return;
      (a.dataset.facfln === "1"
        ? o.ok++
        : o.ordem.push(o.ordem[o.i % o.ordem.length]),
        o.i++,
        (o.virado = 0),
        o.i >= o.ordem.length &&
          (toast(
            `Fim dos flashcards: ${o.ok} de ${o.ordem.length} de primeira.`,
            3500,
          ),
          (FAC.flash = null)),
        facPinta());
      return;
    }
    if ((a = t("[data-facfoco]"))) {
      const o = a.dataset.facfoco;
      (facMats(),
        focoInicia(25, "fac:" + o),
        (ESV = "foco"),
        irPara("estudos"),
        scrollTo(0, 0));
      return;
    }
    if ((a = t("[data-facem]"))) {
      ((FAC.emAb = FAC.emAb === a.dataset.facem ? null : a.dataset.facem),
        facPinta());
      return;
    }
    if ((a = t("[data-facemsv]"))) {
      const o = a.dataset.facemsv,
        s = facPlano(),
        n = s && s.materias.find((i) => i.id === o),
        r = (document.getElementById("facemtx") || {}).value || "";
      if (
        !n ||
        ((n.ementa = r.trim().slice(0, 4e3)),
        save(),
        (FAC.emAb = null),
        facPinta(),
        !n.ementa)
      )
        return;
      (toast("Ajustando os tópicos de " + n.nome + " com a ementa…", 3e3),
        anxCall({
          modo: "topicos",
          curso: s.curso,
          materia: n.nome,
          ementa: n.ementa,
        })
          .then((i) => {
            const l = (i.topicos || []).filter((c) => c && c.t);
            if (!l.length)
              throw new Error(i.erro || "A IA não devolveu os tópicos.");
            const d = n.top.filter((c) => c.feito);
            ((n.top = [
              ...d,
              ...l
                .filter(
                  (c) =>
                    !d.some(
                      (p) => p.t.toLowerCase() === String(c.t).toLowerCase(),
                    ),
                )
                .map((c) => ({ id: plId(), t: c.t, d: c.d || 2 })),
            ]),
              save(),
              toast(l.length + " tópicos seguindo a ementa.", 3e3),
              facPinta());
          })
          .catch((i) => toast(String(i.message || i), 4e3)));
      return;
    }
    if (t("[data-facjn]")) {
      facJornal();
      return;
    }
  },
  !0,
),
  document.addEventListener("change", (e) => {
    e.target.matches &&
      e.target.matches("[data-facmeta]") &&
      (((S.ax ?? (S.ax = {})).facMeta = +e.target.value), save(), facPinta());
  }));
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      if (tab !== "home" || !facPlano()) return;
      const t = document.getElementById("app");
      if (!t || t.querySelector("#facatr")) return;
      const a = new Date().getDay(),
        o = +(S.ax || {}).facMeta || 300,
        s = facMinTotalSemana();
      if ((a < 4 && a !== 0) || s >= o * 0.6) return;
      const n = facDisc()
        .map((l) => ({ m: l, p: facProxTop(l) }))
        .find((l) => l.p);
      if (!n) return;
      const r = document.createElement("div");
      ((r.id = "facatr"),
        (r.className = "card"),
        (r.innerHTML = `<div class="top"><b>🎓 Faculdade: ${Math.floor(s / 60)}h${String(s % 60).padStart(2, "0")} de ${Math.round(o / 60)}h na semana</b></div><div class="sm" style="margin:4px 0 8px">Que tal 25 minutos de <b>${esc(n.m.nome)}</b> agora? Próximo tópico: ${esc(n.p.t)}.</div><div class="facbt"><button class="btn s" data-facfoco="${n.m.id}">⏱️ Estudar 25 min</button><button class="btn s" data-facaula="${n.m.id}|${n.p.id}">📖 Aula</button></div>`));
      const i =
        t.querySelector("#facav") ||
        t.querySelector('section[data-hb="metas"]');
      i ? i.before(r) : t.appendChild(r);
    } catch {}
  };
}
{
  const e = TraderStyles.slot("legacy-083");
  ((e.textContent = TraderStyles.css("legacy-083")), TraderStyles.mount(e));
}
document.addEventListener(
  "click",
  (e) => {
    e.target.closest("[data-plq]") &&
      tab === "estudos" &&
      ESV === "fac" &&
      (S.ax || {}).facPlano &&
      (S.ax.plAtivo = S.ax.facPlano);
  },
  !0,
);
const CURSO_ECO = [
    ["SUSTENTABILIDADE CORPORATIVA E ESG – ESTRATÉGIA ESG INTEGRADA", 10],
    ["FORMAÇÃO SOCIOCULTURAL E SUSTENTÁVEL", 70],
    ["FUNDAMENTOS DA ADMINISTRAÇÃO", 70],
    ["INTRODUÇÃO AO CURSO DE CIÊNCIAS ECONÔMICAS", 60],
    ["ECONOMIA", 60],
    ["GESTÃO DE CUSTOS", 60],
    [
      "SUSTENTABILIDADE CORPORATIVA E ESG – GOVERNANÇA SUSTENTÁVEL APLICADA",
      10,
    ],
    [
      "SUSTENTABILIDADE CORPORATIVA E ESG – ECOSSISTEMA SOCIOAMBIENTAL INOVADOR",
      15,
    ],
    ["EMPREENDEDORISMO E INOVAÇÃO", 60],
    ["GESTÃO DE PESSOAS", 60],
    ["SUSTENTABILIDADE CORPORATIVA E ESG – RESILIÊNCIA E VALOR", 15],
    ["GESTÃO ORÇAMENTÁRIA", 60],
    ["HISTÓRIA ECONÔMICA GERAL", 60],
    ["GESTÃO DE INVESTIMENTOS – 1", 10],
    ["HISTÓRIA DO PENSAMENTO ECONÔMICO", 70],
    ["MÉTODOS QUANTITATIVOS MATEMÁTICOS", 70],
    ["DIREITO EMPRESARIAL", 70],
    ["GESTÃO DE INVESTIMENTOS – 2", 10],
    ["CONTABILIDADE GERAL", 70],
    ["FUNDAMENTOS DO COMÉRCIO INTERNACIONAL", 70],
    ["ECONOMIA POLÍTICA", 70],
    ["ACE – SUSTENTABILIDADE – CIÊNCIAS ECONÔMICAS", 100],
    ["GESTÃO DE INVESTIMENTOS – 3", 15],
    ["ANÁLISE DE INVESTIMENTOS", 70],
    ["PSICOLOGIA ORGANIZACIONAL", 70],
    ["ECONOMIA MONETÁRIA", 70],
    ["GESTÃO DE INVESTIMENTOS – 4", 15],
    ["MERCADO DE CAPITAIS", 70],
    ["TEORIA MICROECONÔMICA", 70],
    ["ECONOMIA BRASILEIRA CONTEMPORÂNEA", 70],
    ["LABORATÓRIO DE ANÁLISES DE DADOS ECONÔMICOS: MICROECONOMIA APLICADA", 35],
    ["LIDERANÇA E GESTÃO COLABORATIVA – 1", 25],
    ["TRABALHO DE CONCLUSÃO DE CURSO – CIÊNCIAS ECONÔMICAS", 60],
    ["FORMAÇÃO ECONÔMICA DO BRASIL", 70],
    ["MATEMÁTICA FINANCEIRA", 70],
    ["ECONOMIA INDUSTRIAL", 70],
    ["LIDERANÇA E GESTÃO COLABORATIVA – 2", 25],
    ["ANTROPOLOGIA CULTURAL", 70],
    ["MÉTODOS QUANTITATIVOS ESTATÍSTICOS", 70],
    ["CONTABILIDADE PÚBLICA E ORÇAMENTO", 70],
    [
      "LABORATÓRIO DE ANÁLISES DE DADOS ECONÔMICOS: MACROECONOMIA E BASES OFICIAIS",
      35,
    ],
    ["ACE – CULTURAL – CIÊNCIAS ECONÔMICAS", 100],
    ["LIDERANÇA E GESTÃO COLABORATIVA – 3", 25],
    ["ECONOMIA E FINANÇAS INTERNACIONAIS", 70],
    ["METODOLOGIA DA PESQUISA E DO TRABALHO CIENTÍFICO", 70],
    ["DESENVOLVIMENTO ECONÔMICO E MODELOS DE CRESCIMENTO", 70],
    ["LIDERANÇA E GESTÃO COLABORATIVA – 4", 25],
    ["DIREITO INDIVIDUAL DO TRABALHO", 70],
    ["MACROECONOMIA", 70],
    ["ECONOMETRIA", 70],
    ["LABORATÓRIO DE ANÁLISES DE DADOS ECONÔMICOS: ECONOMETRIA APLICADA", 30],
    ["ACE – INCLUSÃO – CIÊNCIAS ECONÔMICAS", 100],
  ],
  CURSO_TRADER =
    /MERCADO DE CAPITAIS|AN\xc1LISE DE INVESTIMENTOS|GEST\xc3O DE INVESTIMENTOS|MATEM\xc1TICA FINANCEIRA|ECONOMIA MONET\xc1RIA|MACROECONOMIA|ECONOMETRIA|M\xc9TODOS QUANTITATIVOS ESTAT\xcdSTICOS|ECONOMIA E FINAN\xc7AS INTERNACIONAIS|CONTABILIDADE GERAL|ECONOMIA BRASILEIRA CONTEMPOR\xc2NEA/,
  CURSO_ATUAIS = [
    "SUSTENTABILIDADE CORPORATIVA E ESG – RESILIÊNCIA E VALOR",
    "HISTÓRIA ECONÔMICA GERAL",
    "INTRODUÇÃO AO CURSO DE CIÊNCIAS ECONÔMICAS",
    "GESTÃO ORÇAMENTÁRIA",
  ],
  cursoNome = (e) => {
    const t = new Set([
      "de",
      "do",
      "da",
      "dos",
      "das",
      "e",
      "em",
      "a",
      "o",
      "ao",
      "à",
    ]);
    return String(e)
      .toLowerCase()
      .split(" ")
      .map((a, o) =>
        /^(esg|ace|tcc)$/.test(a)
          ? a.toUpperCase()
          : o && t.has(a)
            ? a
            : a.charAt(0).toUpperCase() + a.slice(1),
      )
      .join(" ")
      .replace(/ \u2013 (\d)$/, " $1");
  },
  cursoK = (e) =>
    String(e)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim(),
  CURSO_EXT = /^ACE /;
function cursoSt() {
  var e;
  const t = (e = S.ax ?? (S.ax = {})).curso ?? (e.curso = { st: {} });
  return (
    t.ini ||
      ((t.ini = 1),
      CURSO_ATUAIS.forEach((a) => {
        t.st[a] || (t.st[a] = "cur");
      })),
    t.st
  );
}
function cursoMat(e) {
  const t = facPlano();
  if (!t) return null;
  const a = cursoK(e),
    o = cursoK(cursoNome(e));
  return (
    t.materias.find((s) => {
      const n = cursoK(s.nome);
      return n === a || n === o || (a.startsWith(n) && n.length > 12);
    }) || null
  );
}
function cursoMigra() {
  const e = facPlano();
  if (!e) return;
  let t = 0;
  if (
    (e.materias.forEach((a) => {
      a.nome === "Sustentabilidade Corporativa e ESG" &&
        ((a.nome = "Sustentabilidade Corporativa e ESG – Resiliência e Valor"),
        (t = 1));
    }),
    t)
  ) {
    save();
    try {
      facMats();
    } catch {}
  }
}
try {
  cursoMigra();
} catch {}
{
  const e = facMonta;
  facMonta = function () {
    const t = e.apply(this, arguments);
    return (cursoMigra(), cursoSt(), save(), t);
  };
}
async function cursoCursando(e) {
  const t = facPlano() || facMonta();
  if (cursoMat(e)) return;
  const a = { id: plId(), nome: cursoNome(e), prova: "", ementa: "", top: [] };
  (t.materias.push(a), save());
  try {
    facMats();
  } catch {}
  if (!CURSO_EXT.test(e)) {
    toast("Montando os tópicos de " + a.nome + "…", 2500);
    try {
      ((
        (await anxCall({ modo: "topicos", curso: t.curso, materia: a.nome }))
          .topicos || []
      )
        .filter((o) => o && o.t)
        .forEach((o) => a.top.push({ id: plId(), t: o.t, d: o.d || 2 })),
        save(),
        toast(
          a.top.length +
            " tópicos em " +
            a.nome +
            ". Cole a ementa para ajustar.",
          3500,
        ));
    } catch (o) {
      toast(
        "Disciplina adicionada; os tópicos ficam para depois (" +
          (o.message || o) +
          ").",
        4e3,
      );
    }
    facPinta();
  }
}
function cursoHtml() {
  const e = cursoSt(),
    t = CURSO_ECO.map(([c, p], u) => ({
      n: c,
      h: p,
      i: u,
      s: e[c] || "",
      tr: CURSO_TRADER.test(c),
      ext: CURSO_EXT.test(c),
    })),
    a = sum(t.map((c) => c.h)),
    o = sum(t.filter((c) => c.s === "ok").map((c) => c.h)),
    s = t.filter((c) => c.s === "ok").length,
    n = t.filter((c) => c.s === "cur"),
    r = [
      "MERCADO DE CAPITAIS",
      "ANÁLISE DE INVESTIMENTOS",
      "MATEMÁTICA FINANCEIRA",
      "ECONOMIA MONETÁRIA",
      "MACROECONOMIA",
      "MÉTODOS QUANTITATIVOS ESTATÍSTICOS",
      "ECONOMETRIA",
      "CONTABILIDADE GERAL",
      "ECONOMIA E FINANÇAS INTERNACIONAIS",
      "ECONOMIA BRASILEIRA CONTEMPORÂNEA",
    ],
    i = (c) => {
      const p = r.indexOf(c);
      return p < 0 ? 99 : p;
    },
    l = t
      .filter((c) => c.tr && !c.s)
      .sort((c, p) => i(c.n) - i(p.n))
      .slice(0, 4),
    d = (c) =>
      `<div class="cur ${c.s ? "st-" + c.s : ""}"><button class="curst" data-curst="${c.i}" aria-label="Mudar a situação" title="Tocar muda: a cursar → cursando → concluída"><span class="curbox">${c.s === "ok" ? "✓" : c.s === "cur" ? "•" : ""}</span></button><span class="sm">${esc(cursoNome(c.n))}${c.tr ? ' <span class="curtr">🎯 trader</span>' : ""}${c.ext ? ' <span class="mut">(extensão)</span>' : ""}</span><span class="sm mut">${c.h}h</span></div>`;
  return `<details class="card" id="curso"${FAC.cursoAb ? " open" : ""} data-cursoab="1"><summary><b>🗺️ Meu curso: ${s} de ${t.length} disciplinas</b><span class="sm mut"> · ${Math.round((o / a) * 100)}% de ${a.toLocaleString("pt-BR")}h</span></summary>
<div class="cnbar" style="margin:8px 0"><b style="width:${(o / a) * 100}%"></b></div>
<div class="sm" style="margin-bottom:6px">📘 Cursando agora: ${n.map((c) => esc(cursoNome(c.n))).join(", ") || "—"}</div>
${l.length ? `<div class="sm curad">🎯 Ligadas ao seu objetivo de trader e ainda por vir: ${l.map((c) => `<button class="lnk" data-curadi="${c.i}">${esc(cursoNome(c.n))}</button>`).join(" · ")}<div class="mut" style="margin-top:2px">Toque para adiantar o estudo (entra no seu plano).</div></div>` : ""}
<div class="sm mut" style="margin:6px 0">Toque no quadradinho: vazio = a cursar → • cursando (entra no plano) → ✓ concluída.</div>${t.map(d).join("")}
<div class="sm mut" style="margin-top:6px">Mais as Atividades Acadêmicas Complementares.</div></details>`;
}
{
  const e = facHubHtml;
  facHubHtml = function () {
    const t = cursoSt(),
      a = facPlano();
    let o = null;
    a &&
      ((o = a.materias),
      (a.materias = a.materias.filter((n) => {
        const r = CURSO_ECO.find(([i]) => cursoMat(i) === n);
        return !r || t[r[0]] !== "ok";
      })));
    let s;
    try {
      s = e.apply(this, arguments);
    } finally {
      a && o && (a.materias = o);
    }
    try {
      if (a) {
        const n = s.indexOf(
          '<div class="card"><div class="top"><b>📰 Exemplos reais de hoje',
        );
        s = n > 0 ? s.slice(0, n) + cursoHtml() + s.slice(n) : s + cursoHtml();
      }
    } catch {}
    return s;
  };
}
(document.addEventListener(
  "click",
  (e) => {
    const t = (o) => e.target.closest(o);
    let a;
    if ((a = t("[data-curst]"))) {
      e.preventDefault();
      const o = cursoSt(),
        [s] = CURSO_ECO[+a.dataset.curst] || [];
      if (!s) return;
      const n = { "": "cur", cur: "ok", ok: "" }[o[s] || ""];
      ((o[s] = n),
        n || delete o[s],
        save(),
        (FAC.cursoAb = 1),
        n === "cur"
          ? cursoCursando(s)
          : n === "ok" && toast("✅ " + cursoNome(s) + " concluída!", 2500),
        facPinta());
      return;
    }
    if ((a = t("[data-curadi]"))) {
      const o = cursoSt(),
        [s] = CURSO_ECO[+a.dataset.curadi] || [];
      if (!s) return;
      ((o[s] = "cur"), save(), (FAC.cursoAb = 1), cursoCursando(s), facPinta());
      return;
    }
  },
  !0,
),
  document.addEventListener(
    "toggle",
    (e) => {
      e.target.matches &&
        e.target.matches("[data-cursoab]") &&
        (FAC.cursoAb = e.target.open);
    },
    !0,
  ));
{
  const e = TraderStyles.slot("legacy-084");
  ((e.textContent = TraderStyles.css("legacy-084")), TraderStyles.mount(e));
}
{
  const e = TraderStyles.slot("legacy-085");
  ((e.id = "vis157"),
    (e.textContent = TraderStyles.css("legacy-085")),
    TraderStyles.mount(e));
}
try {
  let e = window.html2canvas;
  Object.defineProperty(window, "html2canvas", {
    configurable: !0,
    get() {
      return e;
    },
    set(t) {
      e =
        typeof t == "function"
          ? async function (a, o) {
              const s = window.scrollX,
                n = window.scrollY;
              try {
                return ((n || s) && window.scrollTo(0, 0), await t(a, o));
              } finally {
                (n || s) && window.scrollTo(s, n);
              }
            }
          : t;
    },
  });
} catch {}
const IMG_FOLGA = { top: 170, bot: 90 };
function imgFolga(e) {
  try {
    if (!e || !e.width || e.__folga) return e;
    const t = e.width,
      a = e.height,
      o = document.createElement("canvas");
    ((o.width = t), (o.height = a + IMG_FOLGA.top + IMG_FOLGA.bot));
    const s = o.getContext("2d"),
      n = e.getContext("2d"),
      r = (i, l) => {
        const d = n.getImageData(i, l, 1, 1).data;
        return `rgb(${d[0]},${d[1]},${d[2]})`;
      };
    return (
      (s.fillStyle = r(4, 4)),
      s.fillRect(0, 0, t, IMG_FOLGA.top + 2),
      (s.fillStyle = r(4, a - 4)),
      s.fillRect(0, IMG_FOLGA.top + a - 2, t, IMG_FOLGA.bot + 2),
      s.drawImage(e, 0, IMG_FOLGA.top),
      (o.__folga = 1),
      o
    );
  } catch {
    return e;
  }
}
{
  const e = (t) =>
    function () {
      const a = t.apply(this, arguments);
      return a && typeof a.then == "function" ? a.then(imgFolga) : imgFolga(a);
    };
  try {
    imgDesenha = e(imgDesenha);
  } catch {}
  try {
    jrImagem = e(jrImagem);
  } catch {}
  try {
    grDesenha = e(grDesenha);
  } catch {}
  try {
    rkDesenha = e(rkDesenha);
  } catch {}
}
window.addEventListener(
  "click",
  (e) => {
    if (
      !(
        e.target.closest &&
        e.target.closest('#sh [data-a="savetrade"],#sh [data-qkok]')
      ) ||
      typeof T > "u" ||
      !T
    )
      return;
    const t = S.trades.find((n) => n.id === T.id),
      a = numN(T.exit) != null && (!t || numN(t.exit) == null);
    let o = "";
    if (
      (isNew && !T.pin
        ? (o =
            "Anexe a foto da entrada antes de salvar. Sem foto de entrada a operação não entra no diário.")
        : a &&
          !T.pout &&
          (o = "Anexe a foto da saída antes de encerrar a operação."),
      !o)
    )
      return;
    (e.preventDefault(), e.stopImmediatePropagation());
    const s = document.getElementById("msg");
    s
      ? ((s.textContent = o),
        s.scrollIntoView && s.scrollIntoView({ block: "center" }))
      : toast(o, 4e3);
  },
  !0,
);
let ERRO_ABERTO = null;
function errosBloco(e) {
  const t = tagsDe(e),
    a = ERRO_ABERTO === e.id,
    o = t.length
      ? t
          .map(
            (n) =>
              `<span class="errpill">${esc(n)}<button type="button" data-tg="${esc(n)}" aria-label="Tirar este erro">×</button></span>`,
          )
          .join("")
      : '<span class="sm mut">Nenhum erro marcado.</span>',
    s = TAGS_ERRO.map(
      ([n, r]) =>
        `<div class="errcat">${esc(n)}</div>${r.map((i) => `<label class="errit"><input type="checkbox" data-tg="${esc(i)}"${t.includes(i) ? " checked" : ""}><span>${esc(i)}</span></label>`).join("")}`,
    ).join("");
  return `<div class="errbox"><div class="sm mut" style="margin:10px 0 4px">Erros cometidos (erro = não seguir suas regras)</div><div class="errsel">${o}</div><button type="button" class="errbtn" data-erro-open="1"><span>${t.length ? t.length + " erro(s) marcado(s)" : "Escolher os erros"}</span><span aria-hidden="true">${a ? "▴" : "▾"}</span></button>${a ? `<div class="errlist">${s}</div>` : ""}</div>`;
}
function errosAplica() {
  const e = document.getElementById("sh");
  if (!e || !T) return;
  const t = [...e.querySelectorAll("label")].find((n) =>
    /^Erros cometidos/.test((n.textContent || "").trim()),
  );
  if (!t || t.closest(".errbox")) return;
  const a = [];
  let o = t.nextElementSibling;
  for (
    ;
    o &&
    o.tagName === "DIV" &&
    (o.classList.contains("chips2") || o.classList.contains("sm"));

  )
    (a.push(o), (o = o.nextElementSibling));
  const s = document.createElement("div");
  ((s.innerHTML = errosBloco(T).trim()),
    t.replaceWith(s.firstElementChild),
    a.forEach((n) => n.remove()));
}
document.addEventListener("click", (e) => {
  !(e.target.closest && e.target.closest("#sh [data-erro-open]")) ||
    !T ||
    ((ERRO_ABERTO = ERRO_ABERTO === T.id ? null : T.id), showSheet());
});
const SETUPS_PADRAO = [
  "Halt na média",
  "Abertura do à vista (seguindo as principais ações)",
  "Abertura do americano",
  "Abertura do futuros",
  "Setup Michael Jackson",
];
function setupsAplica() {
  const e = document.getElementById("sh");
  if (!e || !T) return;
  const t = document.getElementById("dl-setups");
  if (t) {
    const o = new Set([...t.querySelectorAll("option")].map((s) => s.value));
    [...SETUPS_PADRAO].reverse().forEach((s) => {
      if (!o.has(s)) {
        const n = document.createElement("option");
        ((n.value = s), t.prepend(n));
      }
    });
  }
  const a = e.querySelector('input[name="setup"]');
  if (a && !e.querySelector("[data-setup-pick]")) {
    const o = document.createElement("div");
    ((o.className = "chips2"),
      (o.style.marginTop = "6px"),
      (o.innerHTML = SETUPS_PADRAO.map(
        (s) =>
          `<button type="button" class="${T.setup === s ? "on" : ""}" data-setup-pick="${esc(s)}">${esc(s)}</button>`,
      ).join("")),
      (a.closest("label") || a).insertAdjacentElement("afterend", o));
  }
}
