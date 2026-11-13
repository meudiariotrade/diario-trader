function mdoInfoHtml(e, t, a) {
  const o = MDO_INFO[e];
  if (!o) return "";
  const [s, n] = MDO_PESO[o.p] || ["–", "mut"];
  return `<div class="mdo-inf"><div class="sm"><b>O que é:</b> ${esc(o.o)}</div><div class="sm" style="margin-top:4px"><b>Peso no seu mercado:</b> <span class="mdo-peso ${n}">${s}</span> <span class="mut">· mexe com ${esc(o.m)}</span></div>
  <div class="mdo-cen${t > 0 ? " on" : ""}"><b>▲ Se sobe ou vem acima</b><div class="sm">${esc(o.s)}</div></div><div class="mdo-cen${t < 0 ? " on" : ""}"><b>▼ Se cai ou vem abaixo</b><div class="sm">${esc(o.b)}</div></div>
  ${a ? `<div class="sm mut">Agora: ${esc(a)}${t ? " (cenário destacado)" : ""}</div>` : ""}</div>`;
}
const MDO_AB = { k: null },
  MDO = {
    v: (() => {
      try {
        return ls.get("diario-mdo") || null;
      } catch {
        return null;
      }
    })(),
    ts: 0,
    busy: 0,
    err: "",
  };
async function mdoCarrega(e) {
  if (MDO.busy || (!e && MDO.v && Date.now() - MDO.ts < 5 * 6e4)) return;
  const t = cfg();
  if (!t) {
    ((MDO.err = "Configure o Supabase na aba Conta."), mdoPaint());
    return;
  }
  ((MDO.busy = 1), (MDO.err = ""), mdoPaint());
  try {
    const a = await fetch(t.url + "/functions/v1/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: t.key },
        body: "{}",
      }),
      o = await a.json();
    if (!a.ok)
      throw new Error(
        a.status === 404
          ? 'Função "macro" não encontrada: publique-a no Supabase.'
          : o.error || "Erro " + a.status,
      );
    ((MDO.v = o), (MDO.ts = Date.now()));
    try {
      ls.set("diario-mdo", o);
    } catch {}
  } catch (a) {
    MDO.err = String(a.message || a);
  }
  ((MDO.busy = 0), mdoPaint());
}
const mdoN = (e, t = 2) =>
    e == null || !isFinite(e)
      ? "–"
      : (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        }),
  mdoPc = (e) => (e == null ? "–" : (e > 0 ? "+" : "") + mdoN(e) + "%");
function cotacaoReferencia(e) {
  if (!e || !e.simboloFonte) return "";
  const t = e.horarioPreco
      ? new Date(e.horarioPreco).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        }) + " BRT"
      : "horário do preço não informado",
    a = /^delayed_streaming_(\d+)$/.exec(e.modoAtualizacao || ""),
    o = a
      ? "atraso informado: " + Math.round(+a[1] / 60) + " min"
      : /^(streaming|realtime)$/.test(e.modoAtualizacao || "")
        ? "tempo real informado pela fonte"
        : "atraso não confirmado";
  return `<details class="quote-reference"><summary>${esc(e.fonte || "Fonte")} · ${esc(e.simboloFonte)}</summary><div>${esc(t)} · ${esc(o)}<br>${esc(e.baseVariacao || "Base da variação não informada")}${e.fechamentoAnterior > 0 ? " · anterior " + esc(e.fechamentoAnterior.toLocaleString("pt-BR", { maximumFractionDigits: 4 })) : ""}<br>Consulta nova não garante negócio novo. Em futuros contínuos, a rolagem pode mudar o contrato de referência.</div></details>`;
}
function mdoTile(e) {
  const t = e.juro ? e.d1bp : e.d1,
    a = Math.min(1, Math.abs(t || 0) / (e.juro ? 10 : 2)),
    o =
      t == null
        ? "transparent"
        : t >= 0
          ? `rgba(34,197,94,${0.1 + a * 0.35})`
          : `rgba(239,68,68,${0.1 + a * 0.35})`,
    s = e.px > 1e3 ? 0 : e.px > 10 ? 2 : e.juro ? 3 : 4,
    n = MDO_INFO[e.s],
    r = n
      ? `<span class="mdo-pp p${n.p}" title="Peso no seu mercado">${"●".repeat(n.p)}</span>`
      : "";
  return `<div class="mdo-t${MDO_AB.k === e.s ? " sel" : ""}" style="background:${o}" data-mdoi="${esc(e.s)}"><div class="sm mdo-n">${r}${esc(e.n)}</div><b>${mdoN(e.px, s)}${e.juro ? "%" : ""}</b><div class="sm">${e.suspeito ? '<span class="am">sem dado confiável</span>' : `<b>${e.juro ? (t > 0 ? "+" : "") + mdoN(t, 1) + " pb" : mdoPc(t)}</b>`} <span class="mut">${e.m1tipo === "mes" ? "mês" : "30d"} ${e.juro ? (e.m1bp > 0 ? "+" : "") + mdoN(e.m1bp, 0) + " pb" : mdoPc(e.m1)}</span></div>${e.ext ? `<div class="sm mdo-ext" title="${esc(e.ext.tipo)} em Nova York">${e.ext.tipo === "pré-mercado" ? "☀️ pré" : e.ext.tipo === "overnight" ? "🌙 24h" : "🌙 pós"} ${mdoN(e.ext.px)} <b class="${e.ext.pct > 0 ? "g" : e.ext.pct < 0 ? "r" : "mut"}">${mdoPc(e.ext.pct)}</b></div>` : ""}${cotacaoReferencia(e)}</div>`;
}
function mdoExt() {
  const e = MDO.v && MDO.v.mercados && MDO.v.mercados.grupos;
  if (!e) return null;
  for (const t of e)
    for (const a of t.itens) if (a.s === "EWZ" && a.ext) return a;
  return null;
}
function mdoPre(e) {
  if (!e) return "";
  const t = mdoExt(),
    a = { positivo: "var(--g)", negativo: "var(--r)", neutro: "#b88c3a" }[
      e.vies
    ],
    o = new Date().getHours(),
    s = new Date().getDay(),
    n = s === 0 && o >= 19,
    r = (s === 6 || s === 0) && !n,
    i = !r && (n || o < 10);
  return `<div class="card mdo-pre" style="border-color:${a}"><div class="top"><b>🌅 Pré-abertura da B3</b><span class="sm mut">${r ? "último pregão (sexta)" : n ? "futuros abertos · prévia de segunda" : i ? "antes das 10h" : "contexto do dia"}${MDO.v && MDO.v.em ? " · atualizado às " + hm(Date.parse(MDO.v.em)) : ""}</span></div>
  ${n || (s === 1 && o < 10) ? '<div class="sm mut" style="margin:2px 0 4px">Os futuros (S&P, Brent) reabrem domingo às 19h e o TradingView entrega com cerca de 15 min de atraso: logo depois da abertura os números ainda podem ser os de sexta.</div>' : ""}<div class="mdo-vies" style="color:${a}">Viés ${esc(e.vies)} <span class="sm mut">(${e.nota > 0 ? "+" : ""}${e.nota})</span></div>
  <div class="mdo-bar"><i style="left:${50 + e.nota / 2}%;background:${a}"></i></div>
  ${t ? `<div class="mdo-ewz"><div><span class="sm mut">${t.ext.tipo === "pré-mercado" ? "☀️ Pré-mercado" : t.ext.tipo === "overnight" ? "🌙 Overnight (24h)" : "🌙 Pós-mercado"} · EWZ (Brasil em NY)</span><div><b>${mdoN(t.ext.px)}</b> <b class="${t.ext.pct > 0 ? "g" : t.ext.pct < 0 ? "r" : "mut"}">${mdoPc(t.ext.pct)}</b></div></div><div class="sm mut" style="text-align:right">fechou ${mdoN(t.ext.fech != null ? t.ext.fech : t.px)}<br>pregão ${mdoPc(t.d1)}</div></div>` : ""}
  ${e.itens.map((l) => `<div class="mdo-pi sm"><span>${esc(l.n)}</span><b class="${l.d1 > 0 ? "g" : l.d1 < 0 ? "r" : "mut"}">${mdoPc(l.d1)}</b><span class="${l.sinal > 0 ? "g" : l.sinal < 0 ? "r" : "mut"}">${esc(l.efeito)}</span></div>`).join("")}
  <div class="sm mut" style="margin-top:6px">Contexto, não sinal: viés positivo não manda comprar na abertura. Use para calibrar a mão e saber de onde pode vir a força ou a pressão do dia.</div></div>`;
}
function mdoSpark(e) {
  const t = (e || []).filter((i) => isFinite(i));
  if (t.length < 2) return "";
  const a = 100,
    o = 24,
    s = Math.min(...t),
    n = Math.max(...t),
    r = (i) => o - 2 - ((i - s) / (n - s || 1)) * (o - 4);
  return `<svg viewBox="0 0 ${a} ${o}" class="mdo-sp" preserveAspectRatio="none"><polyline points="${t.map((i, l) => (l / (t.length - 1)) * a + "," + r(i)).join(" ")}" fill="none" stroke="var(--ac,#709bc2)" stroke-width="1.6"/></svg>`;
}
function mdoBrasil(e) {
  if (!e || !e.ind || !e.ind.length) return "";
  const t = (r) => {
      const i = r.ant != null ? r.v - r.ant : null,
        l = r.un === "índice" ? 1 : 2,
        d = MDO_INFO[r.nome];
      return `<div class="mdo-b${MDO_AB.k === r.nome ? " sel" : ""}" data-mdoi="${esc(r.nome)}"><div class="sm mut">${d ? `<span class="mdo-pp p${d.p}">${"●".repeat(d.p)}</span>` : ""}${esc(r.nome)}</div><b>${mdoN(r.v, l)}${r.un.startsWith("%") ? "%" : ""}</b><span class="sm mut"> ${r.un.startsWith("%") ? r.un.slice(1).trim() : esc(r.un)}</span>
    <div class="sm">${r.mom != null ? `<span class="${r.mom >= 0 ? "g" : "r"}">${mdoPc(r.mom)} no mês</span>${r.yoy != null ? ` · <span class="${r.yoy >= 0 ? "g" : "r"}">${mdoPc(r.yoy)} em 12m</span>` : ""}` : i != null && Math.abs(i) > 1e-9 ? `<span class="mut">antes ${mdoN(r.ant, l)}</span>` : '<span class="mut">estável</span>'}</div>
    ${mdoSpark(r.hist)}<div class="sm mut">${esc(r.d)}</div></div>`;
    },
    a = e.focus || [],
    o = [...new Set(a.map((r) => r.ano))].sort(),
    s = {
      IPCA: "IPCA (%)",
      "PIB Total": "PIB (%)",
      Câmbio: "Dólar (R$)",
      Selic: "Selic (%)",
    },
    n = (r) =>
      r
        ? `${mdoN(r.v)}${r.ant != null && Math.abs(r.v - r.ant) > 1e-9 ? ` <span class="sm ${r.v > r.ant ? "r" : "g"}">${r.v > r.ant ? "▲" : "▼"}</span>` : ""}`
        : "–";
  return `<div class="card"><div class="top"><b>🇧🇷 Brasil em números</b><span class="sm mut">Banco Central</span></div><div class="mdo-bg">${e.ind.map(t).join("")}</div>${(() => {
    const r = e.ind.find((l) => l.nome === MDO_AB.k);
    if (!r) return "";
    const i = r.mom != null ? r.mom : r.ant != null ? r.v - r.ant : 0;
    return mdoInfoHtml(
      r.nome,
      i > 1e-9 ? 1 : i < -1e-9 ? -1 : 0,
      r.mom != null
        ? `${mdoPc(r.mom)} no mês`
        : r.ant != null && Math.abs(r.v - r.ant) > 1e-9
          ? `${mdoN(r.ant)} → ${mdoN(r.v)}`
          : "estável na última leitura",
    );
  })()}
  ${
    a.length
      ? `<h3 style="margin-top:12px">Projeções do mercado (Focus)</h3><table class="mdo-f"><tr><th></th>${o.map((r) => `<th>${r}</th>`).join("")}</tr>${Object.keys(
          s,
        )
          .filter((r) => a.some((i) => i.ind === r))
          .map(
            (r) =>
              `<tr data-mdoi="Focus:${r}" class="${MDO_AB.k === "Focus:" + r ? "sel" : ""}"><td>${s[r]} <span class="sm mut">ⓘ</span></td>${o.map((i) => `<td>${n(a.find((l) => l.ind === r && l.ano === i))}</td>`).join("")}</tr>`,
          )
          .join("")}</table>${(() => {
          if (!String(MDO_AB.k || "").startsWith("Focus:")) return "";
          const r = MDO_AB.k.slice(6),
            i = a.filter((d) => d.ind === r).sort((d, c) => d.ano - c.ano)[0];
          if (!i) return "";
          const l = i.ant != null ? i.v - i.ant : 0;
          return mdoInfoHtml(
            MDO_AB.k,
            l > 1e-9 ? 1 : l < -1e-9 ? -1 : 0,
            i.ant != null
              ? `${i.ano}: ${mdoN(i.ant)} → ${mdoN(i.v)} em ~4 semanas`
              : "",
          );
        })()}<div class="sm mut">Toque numa linha para ver o que significa. ▲▼ = mudança na mediana em ~4 semanas. Projeção de inflação subindo pressiona juros futuros (DI) e pesa na bolsa.</div>`
      : ""
  }</div>`;
}
function vMundo(e) {
  const t = MDO.v || {},
    a = t.mercados,
    o = t.brasil;
  return `<div class="card"><div class="top"><b>Mundo</b><button class="btn s" data-mdo="rf">${MDO.busy ? "…" : "↻ Atualizar"}</button></div>${e || ""}<div class="sm mut">Panorama no estilo do Trading Economics: o que move a B3 antes da abertura, os mercados do mundo e a economia brasileira.</div>${MDO.err ? `<div class="sm r" style="margin-top:6px">${esc(MDO.err)}</div>` : ""}</div>
  ${a ? mdoPre(a.pre) : ""}
  ${
    a
      ? `<div class="card"><div class="top"><b>🗺️ Mapa do mercado</b><span class="sm mut">${a.em ? "às " + hm(Date.parse(a.em)) : ""}</span></div>${a.grupos
          .map((s) => {
            const n = s.itens.find((i) => i.s === MDO_AB.k),
              r = n ? (n.juro ? n.d1bp : n.d1) : null;
            return `<h3 style="margin-top:10px">${esc(s.g)}</h3><div class="mdo-grid">${s.itens.map(mdoTile).join("")}</div>${n ? mdoInfoHtml(n.s, r > 0 ? 1 : r < 0 ? -1 : 0, `${n.n} ${n.juro ? (r > 0 ? "+" : "") + mdoN(r, 1) + " pb" : mdoPc(r)} no dia`) : ""}`;
          })
          .join(
            "",
          )}<div class="sm mut" style="margin-top:8px">Toque em qualquer quadro para ver o que é, o peso no seu mercado e o que acontece se subir ou cair. <b>mês</b> = variação desde o fechamento do mês passado (candle mensal do TradingView); <b>30d</b> = últimos 30 dias, quando o mês não vem. Atualiza sozinho a cada minuto com a aba aberta. ● ● ● = peso alto, ● ● = médio, ● = baixo. Fonte: ${a.fontes ? `TradingView em ${a.fontes.tv} de ${a.fontes.tv + a.fontes.yahoo} ativos${a.fontes.yahoo ? `, Yahoo nos outros ${a.fontes.yahoo}` : ""}` : "Yahoo Finance"}, com atraso. ${a.fontes && a.fontes.suspeitos && a.fontes.suspeitos.length ? `Sem variação confiável hoje: ${esc(a.fontes.suspeitos.join(", "))} (a fonte mandou um número absurdo e o app descartou). ` : ""}Juros em pontos-base (pb).</div></div>`
      : MDO.busy
        ? '<div class="card sm mut">Carregando…</div>'
        : ""
  }
  ${mdoBrasil(o)}`;
}
function mdoPaint() {
  tab !== "mercado" || MKT.tab !== "mu" || render();
}
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "mu"
      ? e.apply(this, arguments)
      : (setTimeout(() => mdoCarrega(), 0), vMundo(""));
  };
}
(document.addEventListener("click", (e) => {
  if (e.target.closest('[data-mdo="rf"]')) {
    mdoCarrega(!0);
    return;
  }
  const t = e.target.closest("[data-mdoi]");
  if (t && tab === "mercado" && MKT.tab === "mu") {
    MDO_AB.k = MDO_AB.k === t.dataset.mdoi ? null : t.dataset.mdoi;
    const a = window.scrollY;
    (render(), window.scrollTo(0, a));
  }
}),
  (function () {
    const e = TraderStyles.slot("legacy-020");
    ((e.textContent = TraderStyles.css("legacy-020")), TraderStyles.mount(e));
  })());
function nyAbreBR(e) {
  try {
    const t = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        timeZoneName: "shortOffset",
      }).formatToParts(new Date((e || loc().slice(0, 10)) + "T15:00:00Z")),
      a = /GMT([+-]\d+)/.exec(
        (t.find((n) => n.type === "timeZoneName") || {}).value || "",
      ),
      o = a ? +a[1] : -5,
      s = 570 + (-3 - o) * 60;
    return (
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  } catch {
    return "10:30";
  }
}
function nyMudanca() {
  const e = loc().slice(0, 10),
    t = nyAbreBR(e);
  for (let a = 1; a <= 40; a++) {
    const o = diasMais(e, a),
      s = nyAbreBR(o);
    if (s !== t) return { d: o, b: s };
  }
  return null;
}
function alAbHtml(e) {
  NP.mk = Array.isArray(NP.mk) ? NP.mk : ["b3", "ny", "tk"];
  const t = nyMudanca(),
    a = [
      ["b3", "🇧🇷 B3 10:00"],
      ["ny", `🇺🇸 Nova York ${nyAbreBR()}`],
      ["tk", "🇯🇵 Tóquio 21:00"],
    ];
  return `${e("ab", "🔔 Abertura dos mercados")}<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${a.map(([o, s]) => `<button class="btn${NP.mk.includes(o) ? "" : " s"}" data-alm="${o}">${s}</button>`).join("")}</div>
  <div class="sm mut" style="margin-bottom:8px">Horário de Brasília. Nova York abre às 9h30 de lá e o app acompanha o horário de verão americano sozinho${t ? `: a partir de ${t.d.slice(8, 10)}/${t.d.slice(5, 7)} passa para <b>${t.b}</b>` : ""}. Sem aviso em fim de semana e feriado da bolsa. Em dia de turno, o aviso lembra que é para não operar.</div>
  ${e("trv", "🔒 Lembrete de 15 em 15 min quando o dia travar")}<div class="sm mut" style="margin-bottom:8px">Do momento em que bater a regra do dia até as 22h. Se entrar trade depois da trava, chega um alerta na hora.</div>
  ${e("tr", "🎯 Stop e alvo dos trades abertos")}<div class="sm mut" style="margin-bottom:8px">Usa a cotação da ponte do Profit (precisa estar ligada). Avisa uma vez quando o preço tocar o stop ou cada alvo.</div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-alm]");
  if (!t) return;
  const a = t.dataset.alm;
  ((NP.mk = Array.isArray(NP.mk) ? NP.mk : ["b3", "ny", "tk"]),
    (NP.mk = NP.mk.includes(a)
      ? NP.mk.filter((o) => o !== a)
      : NP.mk.concat(a)));
  try {
    alSave();
  } catch {}
  alPaint();
});
function trAbertos() {
  return S.trades
    .filter((e) => isOpen(e) && lvKey(e))
    .map((e) => ({
      id: String(e.id),
      a: lvKey(e),
      sd: e.side === "V" ? "V" : "C",
      st: +e.stop > 0 ? +e.stop : null,
      al: [e.target, e.target2, e.target3].map(Number).filter((t) => t > 0),
    }))
    .filter((e) => e.st || e.al.length)
    .slice(0, 40);
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e();
    try {
      t.abertos = trAbertos();
    } catch {}
    return t;
  };
}
(document.addEventListener("click", (e) => {
  e.target.closest(
    '[data-a="savetrade"],[data-qkok],[data-a="del"],[data-a="qclose"]',
  ) &&
    (clearTimeout(trAbertos._t),
    (trAbertos._t = setTimeout(() => turnoPushSync(!1), 5e3)));
}),
  (function () {
    const e = window.fetch.bind(window);
    window.fetch = async function (s, n) {
      try {
        const i = typeof s == "string" ? s : (s && s.url) || "";
        if (SESS && /\/functions\/v1\//.test(i)) {
          n = n || {};
          const l = new Headers(n.headers || {}),
            d = l.get("Authorization") || "",
            c = (cfg() || {}).key || "";
          if (!d || d === "Bearer " + c) {
            try {
              await tok();
            } catch {}
            SESS && l.set("Authorization", "Bearer " + SESS.at);
          }
          n = { ...n, headers: l };
        }
      } catch {}
      const r = Date.now();
      try {
        return await e(s, n);
      } catch (i) {
        if (
          !i ||
          i.name === "AbortError" ||
          !o(s, n) ||
          !(
            document.visibilityState !== "visible" ||
            t.hid >= r - 1e3 ||
            Date.now() - t.vis < 6e3
          )
        )
          throw i;
        return (
          await a(),
          await new Promise((l) => setTimeout(l, 1500)),
          e(s, n)
        );
      }
    };
    const t = { hid: 0, vis: 0 };
    document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible"
        ? (t.vis = Date.now())
        : (t.hid = Date.now());
    });
    const a = () =>
      document.visibilityState === "visible"
        ? Promise.resolve()
        : new Promise((s) => {
            const n = () => {
              document.visibilityState === "visible" &&
                (document.removeEventListener("visibilitychange", n), s());
            };
            document.addEventListener("visibilitychange", n);
          });
    function o(s, n) {
      if (typeof s != "string") return !1;
      n = n || {};
      const r = String(n.method || "GET").toUpperCase();
      if (
        /\/auth\/v1\//.test(s) ||
        /\/functions\/v1\/(analise|conta|resumo)/.test(s)
      )
        return !1;
      if (r === "GET" || r === "HEAD") return !0;
      if (n.body && typeof n.body != "string") return !1;
      if (/\/functions\/v1\//.test(s)) return !0;
      if (/\/rest\/v1\//.test(s)) {
        if (r === "PATCH" || r === "DELETE") return !0;
        const i = new Headers(n.headers || {});
        return /merge-duplicates/.test(i.get("Prefer") || "");
      }
      return !1;
    }
    try {
      window.top !== window.self &&
        (window.top.location = window.location.href);
    } catch {
      document.documentElement.innerHTML = "";
    }
  })());
const TERMOS_VER = "2026-10-17",
  TERMOS_CONTATO = "lucianosilva435@hotmail.com.br";
function vTermos() {
  const e = (t, a) =>
    `<h2>${t}</h2><div class="card sm" style="line-height:1.55">${a}</div>`;
  return `<h1>Termos de uso e privacidade</h1><p class="sm mut">Versão de ${fmtD(TERMOS_VER)}. Escrito em linguagem simples, de acordo com a LGPD (Lei 13.709/2018).</p>
${e("1. O que é o app", "O Diário de Trader é um diário pessoal para registrar e estudar as suas operações. <b>Não é recomendação de investimento</b>: análises, radar, sinais e textos da IA são estudo e podem errar. As decisões e os resultados são seus. Para usar é preciso ter 18 anos ou mais.")}
${e("2. Que dados ficam guardados", '<ul style="margin:4px 0 0 18px;padding:0"><li><b>Conta:</b> e-mail e senha (a senha fica criptografada pelo Supabase; ninguém consegue ler).</li><li><b>O que você registra:</b> trades, fotos, dias, anotações, regras, configurações e, se usar, resumos de livros e a ponte do Profit (cotações e operações).</li><li><b>Notificações:</b> o endereço de notificação do seu aparelho e as preferências (horários, trava do dia, stop e alvos dos trades abertos).</li></ul>')}
${e("3. Para que são usados", "Só para o app funcionar para você: sincronizar entre aparelhos, calcular estatísticas, mandar as notificações que você ligou e gerar análises quando você pede. Seus dados <b>não são vendidos</b> nem usados para publicidade.")}
${e("4. Quem ajuda a processar", '<ul style="margin:4px 0 0 18px;padding:0"><li><b>Supabase:</b> banco de dados, login e arquivos (os servidores podem ficar fora do Brasil).</li><li><b>Google Gemini:</b> recebe só o que você manda analisar (foto do gráfico, estatísticas, livro).</li><li><b>Serviço de e-mail:</b> confirmação de cadastro e troca de senha.</li><li><b>Apple e Google:</b> entregam as notificações no aparelho.</li><li><b>Cotações públicas</b> (Yahoo, TradingView, Banco Central, CNN): recebem só o código do ativo, nenhum dado seu.</li></ul>')}
${e("5. Segurança", "Cada conta só consegue ver e alterar os próprios dados (regras de acesso no banco). As conexões são criptografadas. Proteja o seu aparelho com senha ou Face ID: o app guarda uma cópia dos seus dados nele para funcionar sem internet.")}
${e("6. Por quanto tempo", "Enquanto a sua conta existir. Cópias automáticas do diário ficam por até 30 dias. PDFs de livros são apagados depois que o resumo fica pronto.")}
${e("7. Seus direitos", "Você pode, a qualquer momento: <b>ver e baixar</b> os seus dados (Painel → backup), <b>corrigir</b> (no próprio app) e <b>excluir a conta e todos os dados</b> (Conta → Excluir minha conta). Excluir a conta também retira o seu consentimento." + (TERMOS_CONTATO ? ` Dúvidas: <b>${esc(TERMOS_CONTATO)}</b>.` : ""))}
${e("8. Mudanças", "Se estes termos mudarem, o app avisa e mostra a nova versão.")}
<button class="btn s" style="margin-top:12px" data-a="gotab" data-id="${SESS ? "home" : "conta"}">‹ Voltar</button>`;
}
{
  const e = vConta;
  vConta = function () {
    let t = e();
    const a =
      '<button class="btn s" style="margin-top:12px;width:100%" data-a="gotab" data-id="termos">📄 Termos de uso e privacidade</button>';
    return !window.CLOUD_OK || !cfg() || RECOV
      ? t
      : SESS
        ? t +
          `${a}<h2>Zona de perigo</h2><div class="card"><b>Excluir minha conta</b><div class="sm mut" style="margin:4px 0 10px">Apaga para sempre a sua conta e todos os seus dados, aqui e na nuvem.</div><button class="btn d" data-cx="excluir">Excluir minha conta</button></div>`
        : (AM === "up"
            ? (t = t.replace(
                '<button class="btn" style="margin-top:10px;width:100%" data-a="auth">',
                `<label class="ck" style="margin-top:12px;align-items:flex-start"><input type="checkbox" data-termo${SY.termo ? " checked" : ""}><span class="sm">Tenho 18 anos ou mais e li e aceito os <b>Termos de uso e a Política de privacidade</b> (botão abaixo).</span></label><button class="btn" style="margin-top:10px;width:100%" data-a="auth">`,
              ))
            : (t = t.replace(
                '<div class="r sm" style="margin-top:8px">',
                '<button class="btn s" style="margin-top:8px;width:100%" data-cx="esqueci">Esqueci minha senha</button><div class="r sm" style="margin-top:8px">',
              )),
          SY.reenv &&
            (t = t.replace(
              /(<div class="r sm" style="margin-top:8px">[^<]*<\/div>)/,
              '$1<button class="btn s" style="margin-top:8px;width:100%" data-cx="reenviar">Reenviar e-mail de confirmação</button>',
            )),
          t + a);
  };
}
{
  const e = doAuth;
  doAuth = async function (t) {
    (await e(t),
      !SESS &&
        /Confirme seu e-mail|demorou|Conta criada/.test(SY.msg || "") &&
        ((SY.reenv = SY.reenv || SY.email), render()));
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-termo]");
  t && (SY.termo = t.checked);
});
function delHtml() {
  return `<div class="ov" id="delc"><div class="sh"><div class="top"><h2 style="margin:0">Excluir minha conta</h2><button class="x" data-cx="delx">✕</button></div>
<p>Isto apaga <b>para sempre</b> a sua conta e tudo o que é seu: trades, fotos, dias, regras, resumos de livros, radar, cotações da ponte e notificações. <b>Não dá para desfazer.</b></p>
<p class="sm mut">Quer guardar uma cópia antes? Faça o backup completo no Painel.</p>
<label>Sua senha<input id="dsenha" type="password" autocomplete="current-password"></label>
<label>Digite EXCLUIR para confirmar<input id="dconf" autocapitalize="characters" autocomplete="off"></label>
<button class="btn d" data-cx="delgo" style="width:100%;margin-top:12px">Excluir minha conta e os meus dados</button><div class="r sm" id="dmsg" style="margin-top:8px"></div></div></div>`;
}
async function limpaAparelho() {
  const e = syncOwner();
  (window.AULAS?.limparConta && (await window.AULAS.limparConta(e)),
    assertSyncOwner(e),
    (SESS = null),
    (S = {
      trades: [],
      days: {},
      rules: [],
      seed: 1,
      mt: 0,
      ax: { onb: Date.now(), turno: { on: 0, letra: "A", dias: {} } },
    }));
  try {
    Object.keys(localStorage)
      .filter(
        (t) =>
          /^diario-/.test(t) && !["diario-cfg", "diario-theme"].includes(t),
      )
      .forEach((t) => APP_STORAGE.removeItem(t));
  } catch {}
  try {
    db && db.close && db.close();
  } catch {}
  await new Promise((t) => {
    try {
      const a = indexedDB.deleteDatabase("diario-trader");
      a.onsuccess = a.onerror = a.onblocked = () => t();
    } catch {
      t();
    }
  });
}
const CX = {
  async esqueci() {
    const e = (($("#ce") || {}).value || "").trim();
    if (((SY.email = e), !/.+@.+\..+/.test(e))) {
      ((SY.msg =
        "Digite o seu e-mail acima e toque de novo em Esqueci minha senha."),
        render());
      return;
    }
    ((SY.msg = "Enviando…"), render());
    try {
      (await rq(
        "/auth/v1/recover?redirect_to=" +
          encodeURIComponent(location.origin + location.pathname),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e }),
        },
        !1,
      ),
        (SY.msg =
          "Se existir uma conta com esse e-mail, enviamos um link para criar uma senha nova. Veja também o spam."));
    } catch (t) {
      SY.msg = em(t);
    }
    render();
  },
  async reenviar() {
    const e = SY.reenv || (($("#ce") || {}).value || "").trim();
    if (e) {
      ((SY.msg = "Reenviando…"), render());
      try {
        (await rq(
          "/auth/v1/resend",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "signup", email: e }),
          },
          !1,
        ),
          (SY.msg =
            "Enviamos de novo o e-mail de confirmação para " +
            e +
            ". Veja também o spam."));
      } catch (t) {
        SY.msg = em(t);
      }
      render();
    }
  },
  excluir() {
    (document.getElementById("delc")?.remove(),
      document.body.insertAdjacentHTML("beforeend", delHtml()));
  },
  delx() {
    document.getElementById("delc")?.remove();
  },
  async delgo(e) {
    const t = (n) => {
        const r = $("#dmsg");
        r && (r.textContent = n);
      },
      a = $("#dsenha").value,
      o = $("#dconf").value.trim().toUpperCase(),
      s = cfg();
    if (o !== "EXCLUIR") {
      t("Digite EXCLUIR para confirmar.");
      return;
    }
    if (!a) {
      t("Digite a sua senha.");
      return;
    }
    ((e.disabled = !0), t("Excluindo a conta e os dados…"));
    try {
      const n = await rq("/functions/v1/conta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "excluir",
            senha: a,
            confirma: "EXCLUIR",
          }),
        }),
        r = await n.json().catch(() => ({}));
      if (!n.ok || !r.ok) throw new Error(r.error || "Erro " + n.status);
      (await limpaAparelho(),
        document.getElementById("delc")?.remove(),
        (tab = "conta"),
        (SY.msg = "Sua conta e os seus dados foram excluídos."),
        render(),
        setTimeout(() => {
          try {
            location.reload();
          } catch {}
        }, 2500));
    } catch (n) {
      ((e.disabled = !1), t(em(n)));
    }
  },
  turnoon() {
    (turnoSet((e) => {
      e.on = 1;
    }),
      render());
  },
};
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cx]");
  !t || !CX[t.dataset.cx] || (e.preventDefault(), CX[t.dataset.cx](t));
});
function contaNova() {
  const e = S.ax || {};
  return (
    !e.onb &&
    !e.turno &&
    !S.trades.length &&
    !Object.keys(S.days || {}).length &&
    !(S.ops || []).length &&
    (!SESS || !!S.lastSyncAt)
  );
}
function onbHtml() {
  const e = (t, a, o, s) =>
    `<label class="ck"><input type="radio" name="onb-${t}" value="${a}" data-onb="${t}"${s ? " checked" : ""}><span>${o}</span></label>`;
  return `<div class="ov" id="onb"><div class="sh"><h2 style="margin:0 0 4px">👋 Bem-vindo ao Diário de Trader</h2><p class="sm mut">Quatro números para o app calcular o seu risco e travar o dia quando você passar do limite. Dá para mudar depois.</p>
<div class="g2"><label>Capital para operar (R$)<input type="text" inputmode="decimal" data-onb="cap" placeholder="10000"></label><label>Risco por trade (%)<input type="text" inputmode="decimal" data-onb="pct" value="1"></label></div>
<div class="g2"><label>Perda máxima no dia (R$)<input type="text" inputmode="decimal" data-onb="pd" placeholder="200"></label><label>Máximo de trades no dia<input type="text" inputmode="numeric" data-onb="nt" value="3"></label></div>
<div class="sm" style="margin-top:10px"><b>Você trabalha em escala de turno?</b> O app avisa para não operar nos dias de trabalho.</div>${e("turno", "n", "Não", 1)}${e("turno", "s", "Sim, quero cadastrar a minha escala")}
<div class="sm" style="margin-top:10px"><b>Está fazendo teste em mesa proprietária?</b></div>${e("mesa", "n", "Não", 1)}${e("mesa", "s", "Sim, quero acompanhar as regras da mesa")}
<button class="btn" data-onbx="ok" style="width:100%;margin-top:14px">Começar</button><button class="btn s" data-onbx="pular" style="width:100%;margin-top:8px">Pular por enquanto</button></div></div>`;
}
function onbSalva(e) {
  const t = (r) => {
      const i =
        document.querySelector(`[data-onb="${r}"]:checked`) ||
        document.querySelector(`input[data-onb="${r}"]:not([type="radio"])`);
      return i ? i.value : "";
    },
    a = (r) => +String(t(r)).replace(",", ".") || 0,
    o = S.ax ?? (S.ax = {}),
    s = !e && t("turno") === "s",
    n = !e && t("mesa") === "s";
  (e ||
    (a("cap") > 0 && (o["ct.cap"] = a("cap")),
    a("pct") > 0 && (o["ct.pct"] = Math.min(a("pct"), 10)),
    a("nt") > 0 && (o["ct.nd"] = Math.round(a("nt"))),
    (o.trava = {
      ...(o.trava || {}),
      ...(a("pd") > 0 ? { perdaDia: a("pd") } : {}),
      ...(a("nt") > 0 ? { maxTr: Math.round(a("nt")) } : {}),
    })),
    (o.turno = { on: s ? 1 : 0, letra: "A", dias: {}, niv: { ...TNV0 } }),
    (o.onb = Date.now()),
    save(),
    document.getElementById("onb")?.remove(),
    (tab = n ? "mesa" : "home"),
    render(),
    scrollTo(0, 0),
    s &&
      window.toast &&
      toast(
        'Cadastre a sua escala no cartão "Escala de turno" do Início.',
        6e3,
      ));
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-onbx]");
  t && onbSalva(t.dataset.onbx === "pular");
});
{
  const e = render;
  render = function () {
    e.apply(this, arguments);
    try {
      contaNova() &&
        !["conta", "termos"].includes(tab) &&
        !document.getElementById("onb") &&
        document.body.insertAdjacentHTML("beforeend", onbHtml());
    } catch {}
  };
}
{
  const e = turnoCard;
  turnoCard = function () {
    const t = turnoGet();
    return !t.on && !Object.keys(t.dias || {}).length
      ? '<div class="card sm" style="display:flex;align-items:center;gap:8px"><span style="flex:1">🕐 Trabalha em escala de turno? O app avisa para não operar nos dias de trabalho.</span><button class="btn s" data-cx="turnoon">Ativar</button></div>'
      : e();
  };
}
function mesaSemana(e) {
  const t = mesaCalc(e),
    [a, o] = rng("w0"),
    s = t.ks.filter((i) => i >= a && i <= o),
    n = sum(s.map((i) => t.dias[i])),
    r = [...s].sort((i, l) => t.dias[l] - t.dias[i]);
  return {
    M: t,
    a,
    b: o,
    ks: s,
    sem: n,
    melhor: r[0] || null,
    pior: r.length > 1 ? r[r.length - 1] : null,
    falta: t.meta > 0 ? Math.max(0, t.meta - t.lucroEf) : null,
  };
}
function mesaSemHtml(e) {
  const t = mesaSemana(e),
    a = (n) => mFmt(e, n),
    o = t.M,
    s = (n) => `${dsem(n)} ${fmtD(n).slice(0, 5)}`;
  return `<div class="card"><div class="top"><b>📅 Semana na mesa</b><span class="sm mut">${fmtD(t.a).slice(0, 5)} a ${fmtD(t.b).slice(0, 5)}</span></div>
  <div class="kv" style="margin-top:8px">${[
    ["Resultado da semana", a(t.sem), cls(t.sem), t.ks.length + " pregão(ões)"],
    [
      "Falta para a meta",
      t.falta == null ? "–" : t.falta <= 0 ? "Batida ✅" : a(t.falta),
      t.falta === 0 ? "g" : "",
      o.meta > 0 ? "meta " + a(o.meta) : "sem meta",
    ],
    [
      "Folga até a perda máxima",
      o.margem == null ? "–" : a(o.margem),
      o.margem != null && o.pt && o.margem < o.pt * 0.3 ? "r" : "",
      o.pt ? "limite " + a(o.pt) : "sem limite",
    ],
    [
      "Melhor e pior dia",
      t.melhor
        ? `${a(o.dias[t.melhor])}${t.pior ? " / " + a(o.dias[t.pior]) : ""}`
        : "–",
      "",
      t.melhor
        ? s(t.melhor) + (t.pior ? " / " + s(t.pior) : "")
        : "sem operações",
    ],
  ]
    .map(
      ([n, r, i, l]) =>
        `<div class="card" style="margin:0;padding:10px"><span class="sm mut">${n}</span><div><b class="${i}" style="font-size:16px">${r}</b></div><div class="sm mut">${l}</div></div>`,
    )
    .join("")}</div></div>`;
}
{
  const e = vMesa;
  vMesa = function () {
    const t = e(),
      a = mesaCfg();
    if (!a) return t;
    try {
      return t.replace(
        /(<div class="kv" style="margin-top:10px">)/,
        mesaSemHtml(a) + "$1",
      );
    } catch {
      return t;
    }
  };
}
{
  const e = semPush;
  semPush = function () {
    const t = e();
    try {
      const a = mesaCfg();
      if (a && !a._antigo && t) {
        const o = mesaSemana(a),
          s = (r) => mFmt(a, r),
          n =
            `Mesa: ${s(o.sem)} na semana` +
            (o.falta != null
              ? o.falta <= 0
                ? ", meta batida"
                : `, faltam ${s(o.falta)} para a meta`
              : "") +
            (o.M.margem != null ? `, folga ${s(o.M.margem)}` : "") +
            ". ";
        ((t.corpo = n + t.corpo),
          t.corpo.length > 240 && (t.corpo = t.corpo.slice(0, 237) + "…"));
      }
    } catch {}
    return t;
  };
}
((function () {
  const e = TraderStyles.slot("legacy-021");
  ((e.textContent = TraderStyles.css("legacy-021")), TraderStyles.mount(e));
})(),
  Object.values(MESA_PRESETS).forEach((e) => {
    e.fonte = "mesa";
  }));
const MT = { ed: null },
  mtLista = () =>
    (S.mesaTr || []).filter((e) => !((S.del || {})[e.id] >= (e.u || 0)));
{
  const e = mesaItens;
  mesaItens = function (t) {
    if (!t || t.fonte !== "mesa") return e(t);
    let a = mtLista().map((o) => ({
      d: mesaDia(o.dt, +t.pregao || 0, t.cme),
      t: o.dt,
      v: +o.v || 0,
      q:
        o.q === "" || o.q == null
          ? null
          : t.moeda === "USD"
            ? mesaQtd(o.a, +o.q)
            : +o.q,
      a: o.a,
      id: o.id,
    }));
    return (
      t.inicio && (a = a.filter((o) => o.d >= t.inicio)),
      a.sort((o, s) => o.t.localeCompare(s.t))
    );
  };
}
function mesaCandidatos(e) {
  if (!e || e.fonte === "mesa" || e.fonte === "fx") return [];
  const t = String(e.ativos || "")
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter(Boolean),
    a = (o) =>
      !t.length ||
      t.some((s) =>
        String(o || "")
          .toUpperCase()
          .startsWith(s),
      );
  return S.trades
    .map((o) => ({ t: o, c: calc(o) }))
    .filter(
      ({ t: o, c: s }) =>
        s.pl != null &&
        moedaT(o) === (e.fonte === "usd" ? "USD" : "BRL") &&
        a(o.ativo) &&
        (!e.inicio ||
          mesaDia(o.dtx || o.dt, +e.pregao || 0, e.cme) >= e.inicio),
    );
}
function mesaMigraHtml(e) {
  if (e.fonte === "mesa")
    return S.mesaUndo && Date.now() - S.mesaUndo.em < 7 * 864e5
      ? `<div class="card sm">Você moveu ${S.mesaUndo.trades.length} trade(s) do seu diário para a mesa. <button class="btn s" data-mtx="desfaz" style="margin-left:6px">Desfazer</button></div>`
      : "";
  const t = mesaCandidatos(e),
    a = (s) => mFmt(e, s),
    o = e.fonte === "usd" || !!String(e.ativos || "").trim();
  return `<div class="card" style="border-color:var(--am)"><b>⚠️ A mesa está misturada com a sua conta</b><div class="sm" style="margin:6px 0">Hoje os resultados desta mesa saem do seu diário pessoal e entram nas suas estatísticas, no Meu dia e no IR. Separe: as operações da mesa passam a ser lançadas aqui e saem do seu diário.</div>
  ${
    t.length
      ? `<div class="sm mut">Marque o que é da mesa (${t.length} encontrado(s) desde o início do teste):</div><div style="max-height:220px;overflow:auto;margin:6px 0">${t.map(({ t: s, c: n }) => `<label class="ck sm" style="margin:4px 0"><input type="checkbox" data-mtmov="${esc(s.id)}"${o ? " checked" : ""}><span>${fmtD(String(s.dtx || s.dt).slice(0, 10)).slice(0, 5)} · ${esc(s.ativo)} · ${esc(s.qty || "")} · <b class="${cls(n.pl)}">${a(n.pl)}</b></span></label>`).join("")}</div>
  <button class="btn" data-mtx="move" style="width:100%">Mover os marcados para a mesa e separar</button>`
      : ""
  }
  <button class="btn s" data-mtx="separa" style="width:100%;margin-top:8px">${t.length ? "Separar sem mover nada" : "Separar: lançar as operações da mesa aqui"}</button></div>`;
}
function mtLimite(e, t, a) {
  const o = e.moeda === "USD" ? mesaQtd(t, +a) : +a;
  return {
    n: o,
    lim: +e.contratos || 0,
    passa: +e.contratos > 0 && o > +e.contratos,
  };
}
function mesaOpsHtml(e) {
  if (e.fonte !== "mesa") return "";
  const t = MT.ed ? mtLista().find((i) => i.id === MT.ed) : null,
    a = (i) => mFmt(e, i),
    o = e.moeda === "USD" ? "US$" : "R$",
    s = loc().slice(0, 16),
    n = [...mtLista()]
      .sort((i, l) => String(l.dt).localeCompare(String(i.dt)))
      .slice(0, 30),
    r = (i) => esc(t ? (t[i] ?? "") : "");
  return `<h2>Operações da mesa</h2><div class="card"><div class="sm mut" style="margin-bottom:6px">Ficam só aqui: não entram nas estatísticas, no Meu dia, no calendário nem no IR da sua conta.</div>
  <div class="g2"><label>Data e hora da saída<input type="datetime-local" data-mt="dt" value="${t ? esc(t.dt) : s}"></label><label>Ativo<input data-mt="a" value="${r("a")}" placeholder="${e.moeda === "USD" ? "MES, MNQ, ES" : "WIN, WDO"}" autocapitalize="characters" autocomplete="off"></label></div>
  <div class="g3"><label>Lado<select data-mt="sd"><option value="C"${t && t.sd === "V" ? "" : " selected"}>Compra</option><option value="V"${t && t.sd === "V" ? " selected" : ""}>Venda</option></select></label><label>Contratos<input data-mt="q" inputmode="numeric" value="${r("q")}"></label><label>Resultado (${o})<input data-mt="v" inputmode="decimal" value="${r("v")}" placeholder="-150 ou 320"></label></div>
  <div class="g2"><label>Entrada (opcional)<input data-mt="pe" inputmode="decimal" value="${r("pe")}"></label><label>Saída (opcional)<input data-mt="ps" inputmode="decimal" value="${r("ps")}"></label></div>
  <label>Nota (opcional)<input data-mt="nota" value="${r("nota")}" autocomplete="off"></label>
  <div class="sm" id="mtav" style="margin-top:6px"></div>
  <button class="btn" data-mtx="salvar" style="width:100%;margin-top:8px">${t ? "Salvar alteração" : "Salvar operação"}</button>${t ? '<button class="btn s" data-mtx="cancela" style="width:100%;margin-top:6px">Cancelar edição</button>' : ""}</div>
  ${n.length ? `<div class="card">${n.map((i) => `<div class="top" style="padding:6px 0;border-bottom:1px solid var(--bd)"><div class="sm"><b>${esc(i.a)}</b> ${i.sd === "V" ? "venda" : "compra"}${i.q ? ` · ${esc(i.q)} contr.` : ""}<div class="mut">${dsem(String(i.dt).slice(0, 10))} ${fmtD(String(i.dt).slice(0, 10)).slice(0, 5)} ${String(i.dt).slice(11, 16)}${i.nota ? " · " + esc(i.nota) : ""}</div></div><div style="text-align:right"><b class="${cls(+i.v)}">${a(+i.v)}</b><div><button class="btn s" data-mtx="edita" data-id="${esc(i.id)}" style="padding:2px 8px;font-size:12px">Editar</button> <button class="btn s d" data-mtx="apaga" data-id="${esc(i.id)}" style="padding:2px 8px;font-size:12px">Apagar</button></div></div></div>`).join("")}</div>` : ""}`;
}
{
  const e = vMesa;
  vMesa = function () {
    let t = e();
    const a = mesaCfg();
    if (!a) return t;
    try {
      ((t = t.replace(
        "<h1>Mesa proprietária</h1>",
        "<h1>Mesa proprietária</h1>" + mesaMigraHtml(a),
      )),
        (t = t.replace(
          "<h2>Regras da mesa</h2>",
          mesaOpsHtml(a) + "<h2>Regras da mesa</h2>",
        )),
        a.fonte === "mesa" &&
          (t = t.replace(
            "Nenhuma operação desta mesa ainda. Confira a data de início e de onde vêm os trades nas regras abaixo.",
            'Nenhuma operação da mesa ainda: lance a primeira em "Operações da mesa", logo abaixo.',
          )));
    } catch {}
    return t;
  };
}
function mtAviso() {
  const e = mesaCfg(),
    t = document.getElementById("mtav");
  if (!e || !t) return;
  const a = ($('[data-mt="a"]') || {}).value || "",
    o = ($('[data-mt="q"]') || {}).value || "";
  if (!(+o > 0)) {
    t.textContent = "";
    return;
  }
  const s = mtLimite(e, a, o),
    n =
      e.moeda === "USD" && s.n !== +o
        ? ` = ${String(+s.n.toFixed(2)).replace(".", ",")} mini(s)`
        : "";
  t.innerHTML = s.lim
    ? s.passa
      ? `<span class="r">🛑 ${esc(o)} contrato(s)${n}: passa do limite da mesa (${s.lim}).</span>`
      : `<span class="g">✓ ${esc(o)} contrato(s)${n}: dentro do limite (${s.lim}).</span>`
    : "";
}
(document.addEventListener("input", (e) => {
  e.target.closest('[data-mt="a"],[data-mt="q"]') && mtAviso();
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mtx]");
    if (!t) return;
    const a = mesaCfg();
    if (!a) return;
    const o = t.dataset.mtx,
      s = () => {
        (save(), render());
      };
    if (o === "separa") ((a.fonte = "mesa"), mesaSalva(a), s());
    else if (o === "move") {
      const n = [...document.querySelectorAll("[data-mtmov]:checked")].map(
        (l) => l.dataset.mtmov,
      );
      if (!n.length) {
        alert(
          'Marque pelo menos um trade, ou toque em "Separar sem mover nada".',
        );
        return;
      }
      if (
        !confirm(
          `Mover ${n.length} trade(s) do seu diário para a mesa? Eles saem das suas estatísticas.`,
        )
      )
        return;
      const r = S.trades.filter((l) => n.includes(l.id)),
        i = Date.now();
      ((S.mesaTr = S.mesaTr || []),
        r.forEach((l) => {
          (S.mesaTr.push({
            id: "m" + l.id,
            dt: String(l.dtx || l.dt).slice(0, 16),
            a: l.ativo,
            sd: l.side === "V" ? "V" : "C",
            q: l.qty || "",
            v: +calc(l).pl || 0,
            pe: l.entry || "",
            ps: l.exit || "",
            nota: l.nota || "",
            u: i,
          }),
            ((S.del ?? (S.del = {}))[l.id] = i));
        }),
        (S.trades = S.trades.filter((l) => !n.includes(l.id))),
        (S.mesaUndo = { em: i, trades: r, ids: r.map((l) => "m" + l.id) }),
        (a.fonte = "mesa"),
        mesaSalva(a),
        s(),
        window.toast && toast(`${r.length} trade(s) movido(s) para a mesa.`));
    } else if (o === "desfaz") {
      const n = S.mesaUndo;
      if (!n || !confirm("Devolver esses trades para o seu diário?")) return;
      const r = Date.now();
      (n.trades.forEach((i) => {
        (delete (S.del || {})[i.id], S.trades.push({ ...i, u: r }));
      }),
        (S.mesaTr = (S.mesaTr || []).filter((i) => !n.ids.includes(i.id))),
        n.ids.forEach((i) => {
          (S.del ?? (S.del = {}))[i] = r;
        }),
        delete S.mesaUndo,
        s());
    } else if (o === "salvar") {
      const n = (m) => (($(`[data-mt="${m}"]`) || {}).value || "").trim(),
        r = (m) =>
          m === "" ? "" : +String(m).replace(/\./g, "").replace(",", "."),
        i = n("dt"),
        l = n("a").toUpperCase().slice(0, 14),
        d = n("q"),
        c = r(n("v"));
      if (!i || !l || c === "" || !isFinite(c)) {
        alert("Preencha a data, o ativo e o resultado.");
        return;
      }
      const p = mtLimite(a, l, d);
      if (
        p.passa &&
        !confirm(
          `Isso passa do limite da mesa (${p.lim} contrato(s)${a.moeda === "USD" ? " em minis" : ""}). Na conta da mesa isso pode reprovar o teste. Salvar mesmo assim?`,
        )
      )
        return;
      const u = {
        id: MT.ed || "m" + uid(),
        dt: i.slice(0, 16),
        a: l,
        sd: n("sd") === "V" ? "V" : "C",
        q: d.replace(/\D/g, ""),
        v: c,
        pe: n("pe"),
        ps: n("ps"),
        nota: n("nota").slice(0, 200),
        u: Date.now(),
      };
      ((S.mesaTr = (S.mesaTr || []).filter((m) => m.id !== u.id)),
        S.mesaTr.push(u),
        (MT.ed = null),
        s(),
        window.toast && toast("Operação da mesa salva."));
    } else if (o === "edita")
      ((MT.ed = t.dataset.id),
        render(),
        document
          .querySelector('[data-mt="a"]')
          ?.scrollIntoView({ block: "center" }),
        mtAviso());
    else if (o === "cancela") ((MT.ed = null), render());
    else if (o === "apaga") {
      if (!confirm("Apagar esta operação da mesa?")) return;
      const n = t.dataset.id;
      ((S.mesaTr = (S.mesaTr || []).filter((r) => r.id !== n)),
        ((S.del ?? (S.del = {}))[n] = Date.now()),
        MT.ed === n && (MT.ed = null),
        s());
    }
  }));
{
  const e = semPush;
  semPush = function () {
    const t = e();
    return (
      t && t.corpo && (t.corpo = t.corpo.replace("Brasil: ", "Bolsa: ")),
      t
    );
  };
}
const FN_VERSAO = "v90",
  FN_LISTA = [
    ["precos", "Cotações das posições abertas"],
    ["screener", "Faixa de preços do topo e Screener"],
    ["noticias", "Notícias"],
    ["notificar", "Notificações"],
    ["adrs", "ADRs no Início"],
    ["juros", "Juros"],
    ["candles", "Gráficos dos trades e Ao vivo"],
    ["macro", "Mundo"],
    ["sentimento", "Sentimento"],
    ["radar", "Radar"],
    ["analise", "Análise com IA"],
    ["resumo", "Resumo de livros"],
    ["conta", "Excluir conta"],
  ],
  SYS = { busy: 0, res: null, em: 0 };
var sysTesta;
const sysProblemas = () => (SYS.res || []).filter((e) => e.st !== "ok");
function vStatus() {
  const e = cfg(),
    t = SYS.res,
    a = { ok: "✅", velha: "⚠️", nao: "❌", sem: "❌" },
    o = t && t.every((s) => s.st === "sem");
  return `<h1>Status do sistema</h1><p class="sm mut">Testa cada função do Supabase que o app usa e diz o que fazer quando alguma falha. Não mostra nem envia dados seus.</p>
  <div class="card sm"><div>App: <b>${APP_VER}</b> · conferência de versões por serviço</div><div style="margin-top:4px">Endereço do app (para o ALLOWED_ORIGINS): <b style="user-select:all">${esc(location.origin)}</b></div></div>
  <button class="btn" data-sys="testa" style="width:100%" ${SYS.busy ? "disabled" : ""}>${SYS.busy ? "Testando…" : "🩺 Testar agora"}</button>
  ${o ? `<div class="warn" style="margin-top:10px">Nenhuma função respondeu. Quase sempre é o secret <b>ALLOWED_ORIGINS</b> com um endereço diferente de <b>${esc(location.origin)}</b>: apague o secret ou coloque exatamente esse endereço. Se não for isso, confira a internet.</div>` : ""}
  ${
    t
      ? `<div class="card" style="margin-top:10px">${t.map((s) => `<div style="padding:7px 0;border-bottom:1px solid var(--bd)"><div><b>${a[s.st]} ${esc(s.f)}</b> <span class="sm mut">· ${esc(s.l)}</span></div><div class="sm ${s.st === "ok" ? "mut" : s.st === "velha" ? "am" : "r"}">${esc(s.msg)}</div></div>`).join("")}</div>
  <div class="sm mut">Testado às ${hm(SYS.em)}. ${sysProblemas().length ? sysProblemas().length + " função(ões) precisam de atenção." : "Tudo certo."}</div>`
      : ""
  }
  <button class="btn s" style="margin-top:12px" data-a="gotab" data-id="conta">‹ Voltar</button>`;
}
document.addEventListener("click", (e) => {
  e.target.closest('[data-sys="testa"]') && sysTesta();
});
{
  const e = vConta;
  vConta = function () {
    let t = e();
    if (!window.CLOUD_OK || !cfg() || RECOV) return t;
    SESS &&
      !SYS.busy &&
      Date.now() - SYS.em > 6 * 36e5 &&
      setTimeout(() => sysTesta(!0), 50);
    const a = sysProblemas().length,
      o = `<button class="btn s" style="margin-top:8px;width:100%" data-a="gotab" data-id="status">🩺 Status do sistema${a ? ` · <span class="am">${a} com problema</span>` : ""}</button>`;
    return t.replace(
      '<button class="btn s" style="margin-top:12px;width:100%" data-a="gotab" data-id="termos">',
      o +
        '<button class="btn s" style="margin-top:8px;width:100%" data-a="gotab" data-id="termos">',
    );
  };
}
var LST = { n: 60 };
CX.maisTr = () => {
  LST.n += 100;
  const e = scrollY;
  (render(), scrollTo(0, e));
};
{
  const e = () => {
    LST.n = 60;
  };
  document.addEventListener(
    "click",
    (t) => {
      t.target.closest('[data-a="gotab"],[data-tab],[data-a="lt"]') && e();
    },
    !0,
  );
}
{
  const e = numN,
    t = new Map();
  numN = function (a) {
    if (typeof a != "string") return e(a);
    let o = t.get(a);
    return (
      o === void 0 && ((o = e(a)), t.size > 2e4 && t.clear(), t.set(a, o)),
      o
    );
  };
}
{
  const e = moedaAtv,
    t = new Map();
  moedaAtv = function (a) {
    const o = a == null ? "" : String(a);
    let s = t.get(o);
    return (
      s === void 0 && ((s = e(a)), t.size > 5e3 && t.clear(), t.set(o, s)),
      s
    );
  };
}
{
  const e = mtDias,
    t = new Map();
  mtDias = function (a) {
    const o =
      a +
      "|" +
      S.mt +
      "|" +
      loc().slice(0, 10) +
      "|" +
      S.trades.length +
      "|" +
      (S.ops || []).length;
    if (t.has(o)) return t.get(o);
    const s = e(a);
    return (t.size > 20 && t.clear(), t.set(o, s), s);
  };
}
try {
  if (
    "serviceWorker" in navigator &&
    navigator.serviceWorker.addEventListener
  ) {
    const e = navigator.serviceWorker,
      t = !!e.controller;
    (e.addEventListener("controllerchange", () => {
      if (t) {
        if (
          document.querySelector(".ov") ||
          ((document.getElementById("sh") || {}).innerHTML || "").trim()
        ) {
          window.toast &&
            toast(
              "Nova versão do app pronta: feche e abra para atualizar.",
              6e3,
            );
          return;
        }
        try {
          if (sessionStorage.getItem("sw-rl")) return;
          sessionStorage.setItem("sw-rl", "1");
        } catch {}
        location.reload();
      }
    }),
      document.addEventListener("visibilitychange", () => {
        !document.hidden &&
          e.getRegistration &&
          e
            .getRegistration()
            .then((a) => a && a.update())
            .catch(() => {});
      }));
  }
} catch {}
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="lgbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1f22"/><stop offset="1" stop-color="#0a0b0c"/></linearGradient><linearGradient id="lgln" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ac8439"/><stop offset="1" stop-color="#d4b57d"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#lgbg)"/><path d="M150 110 H250 C350 110 404 172 404 256 C404 340 350 402 250 402 H150 Z" fill="none" stroke="#efeeeb" stroke-width="30" stroke-linejoin="round"/><path d="M190 330 L240 276 L278 300 L352 200" fill="none" stroke="url(#lgln)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><path d="M318 196 L362 188 L356 232" fill="none" stroke="#d4b57d" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/></svg>';
if (
  ((function () {
    const e = TraderStyles.slot("legacy-022");
    ((e.id = "visual-v2"),
      (e.textContent = TraderStyles.css("legacy-022")),
      TraderStyles.mount(e));
  })(),
  new MutationObserver(() => {
    const e = document.querySelector("#mdr2 .hd > b, #mdr .mhd > b");
    e &&
      (e.outerHTML = `<div class="mlogo">${LOGO_SVG}<div><b>Diário de Trader</b><small>disciplina é o seu edge</small></div></div>`);
  }).observe(document.body, { childList: !0 }),
  HUB_M.splice(0, HUB_M.length, ...HUB_M.filter((e) => e[0] !== "mercado:cot")),
  MKT.tab === "cot")
) {
  MKT.tab = "mu";
  try {
    ls.set("diario-mkt-tab", "mu");
  } catch {}
}
{
  const e = vMercado;
  vMercado = function () {
    return (
      MKT.tab === "cot" &&
        ((MKT.tab = "mu"),
        setTimeout(() => {
          (irPara("juros"));
        }, 0)),
      e()
    );
  };
}
function jrExtraHtml() {
  const e = JR.data && JR.data.cot;
  if (!e) return "";
  const t = [
    [
      "fef2",
      "Minério · 2º vencimento",
      "curva do minério (o 1º está em Mundo)",
    ],
    [
      "ust2",
      "Treasury 2 anos",
      "juro curto dos EUA (o de 10 anos está em Mundo)",
    ],
    ["ust30", "Treasury 30 anos", "juro longo dos EUA"],
  ].filter(([o]) => e[o]);
  if (!t.length) return "";
  const a = ([o, s, n]) => {
    const r = e[o],
      i = o.startsWith("ust"),
      l = i ? r.cha : r.chp;
    return `<tr style="border-top:1px solid var(--bd)"><td style="padding:8px 2px"><a href="${j2tv(r.s)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">${s}<div class="mut" style="font-size:11px">${esc(n)}</div></a></td><td style="text-align:right"><b>${jrN(r.close, i ? 3 : 2)}${i ? "%" : ""}</b></td><td style="text-align:right" class="${cls(l)}">${i ? j2pb(l == null ? null : l * 100) : l == null ? "–" : (l > 0 ? "+" : "") + jrN(l) + "%"}</td></tr>`;
  };
  return `<div class="card" style="margin-top:8px"><b>Complementos de mercado</b><div class="sm mut" style="margin:2px 0 4px">Petróleo, minério do mês, Treasury de 10 anos e dólar global ficam na aba Mundo.</div><table class="sm" style="width:100%;border-collapse:collapse">${t.map(a).join("")}</table><div class="sm mut" style="margin-top:6px">TradingView, ~15 min de atraso.</div></div>`;
}
{
  const e = vJuros;
  vJuros = function () {
    const t = e(),
      a = '<details class="card" data-jrs="sel"',
      o = t.indexOf(a);
    return o < 0
      ? t + jrExtraHtml()
      : t.slice(0, o) + jrExtraHtml() + t.slice(o);
  };
}
setInterval(async () => {
  try {
    if (
      document.hidden ||
      tab !== "mercado" ||
      MKT.tab !== "mu" ||
      MDO.busy ||
      (MDO.ts && Date.now() - MDO.ts < 55e3)
    )
      return;
    const e = cfg();
    if (!e) return;
    const t = await fetch(e.url + "/functions/v1/macro", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: e.key },
      body: "{}",
    });
    if (!t.ok) return;
    const a = await t.json();
    if (!a || !a.mercados) return;
    ((MDO.v = a), (MDO.ts = Date.now()));
    try {
      ls.set("diario-mdo", a);
    } catch {}
    const o = scrollY;
    (mdoPaint(), scrollTo(0, o));
  } catch {}
}, 15e3);
{
  const e = anxCall;
  anxCall = async function (t) {
    const a = Date.now();
    let o = !1;
    const s = () => {
      document.visibilityState !== "visible" && (o = !0);
    };
    document.addEventListener("visibilitychange", s);
    try {
      return await e(t);
    } catch (n) {
      const r = String((n && n.message) || n);
      throw o &&
        /Failed to fetch|NetworkError|Load failed|conex|network/i.test(r)
        ? new Error(
            'A tela apagou (ou o app saiu da frente) durante a análise e o iPhone cortou a conexão. Deixe o app aberto até terminar, sem bloquear a tela (pode levar até 2 minutos), e toque em "Atualizar relatório" de novo.',
          )
        : /^Erro 54\d|^Erro 50[234]/.test(r)
          ? new Error(
              "O servidor cortou a análise por tempo (" +
                r.replace(/^Erro /, "erro ") +
                '): a IA demorou mais que o limite do Supabase. Tente de novo em instantes. Se repetir, publique a função "analise" mais nova, que avisa antes de estourar o tempo.',
            )
          : /Failed to fetch|NetworkError|Load failed/i.test(r) &&
              Date.now() - a > 2e4
            ? new Error(
                "A conexão caiu no meio da análise (ela leva até 2 minutos). Deixe a tela acesa e tente de novo.",
              )
            : n;
    } finally {
      document.removeEventListener("visibilitychange", s);
    }
  };
}
{
  const e = anxBadge;
  anxBadge = function (t, ...a) {
    try {
      if (t && !t.dia) {
        const o = t.gerado || (t.j && t.j.gerado) || t.ts,
          s = o ? new Date(o) : null;
        if (s && !isNaN(s)) {
          const n = new Date(s.getTime() - s.getTimezoneOffset() * 6e4)
            .toISOString()
            .slice(0, 10);
          t = { ...t, dia: n };
        }
      }
    } catch {}
    return e(t, ...a);
  };
}
const OL_REGRAS = [
    {
      id: "obv",
      t: "OBV está permitindo (confirma a direção)",
      auto: "obv",
      ob: !0,
    },
    {
      id: "tend",
      t: "A favor da tendência (média 20 acima da 50 na compra, abaixo na venda)",
      auto: "tend",
    },
    { id: "mm", t: "Preço do lado certo da média de 20", auto: "mm" },
    {
      id: "vol",
      t: "Volume do último candle acima da média de 20",
      auto: "vol",
    },
    {
      id: "rr",
      t: "Risco/retorno de pelo menos 1:2 no alvo 1",
      auto: "rr",
      ob: !0,
    },
    { id: "nivel", t: "Entrada em suporte/resistência, pivô ou Fibonacci" },
    { id: "agenda", t: "Sem notícia forte na agenda até a entrada" },
    { id: "risco", t: "O stop cabe no meu risco por trade" },
  ],
  OL = { ed: null, arq: !1, au: {}, auMsg: "", busy: !1, px: {}, pxTs: 0 },
  olRegras = () => (Array.isArray(S.olR) && S.olR.length ? S.olR : OL_REGRAS),
  olLista = () =>
    (S.olho || []).filter((e) => !((S.del || {})[e.id] >= (e.u || 0))),
  olN = (e) => {
    if (e == null || e === "") return null;
    const t = String(e).trim(),
      a = +(/,/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t);
    return isFinite(a) ? a : null;
  },
  olF = (e) =>
    e == null
      ? "—"
      : Math.abs(e) >= 1e3
        ? e.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
        : e.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: Math.abs(e) < 10 ? 4 : 2,
          });
function olCalc(e, t) {
  const a = (e || []).filter((u) => Array.isArray(u) && u.length >= 5),
    o = a.length,
    s = a.map((u) => +u[4]),
    n = a.map((u) => +(u[5] || 0)),
    r = (u, m, f = u.length - 1) =>
      f + 1 < m
        ? null
        : u.slice(f + 1 - m, f + 1).reduce((x, v) => x + v, 0) / m,
    i = { n: o, obv: null, mm: null, tend: null, vol: null, txt: {} },
    l = t !== "V";
  if (o < 25)
    return ((i.txt.geral = "Poucos candles para calcular (" + o + ")."), i);
  if (n.filter((u) => u > 0).length / o >= 0.8) {
    const u = [0];
    for (let h = 1; h < o; h++)
      u.push(u[h - 1] + (s[h] > s[h - 1] ? n[h] : s[h] < s[h - 1] ? -n[h] : 0));
    const m = r(u, 20),
      f = u[o - 1] - u[o - 6],
      x = u[o - 1] > m && f > 0,
      v = u[o - 1] < m && f < 0;
    ((i.obv = l ? x : v),
      (i.txt.obv =
        (x
          ? "OBV subindo e acima da média de 20"
          : v
            ? "OBV caindo e abaixo da média de 20"
            : "OBV de lado (sem confirmação)") +
        (i.obv
          ? " → permite a " + (l ? "compra" : "venda")
          : " → não permite a " + (l ? "compra" : "venda"))));
    const g = r(n, 20, o - 2);
    ((i.vol = g > 0 ? n[o - 1] > g : null),
      (i.txt.vol =
        g > 0
          ? `Volume ${((n[o - 1] / g) * 100).toFixed(0)}% da média de 20`
          : "Sem volume"));
  } else
    ((i.txt.obv =
      "Sem volume nos candles deste ativo: confira o OBV no gráfico e marque à mão."),
      (i.txt.vol = i.txt.obv));
  const d = r(s, 20),
    c = r(s, 50),
    p = s[o - 1];
  return (
    (i.mm = l ? p > d : p < d),
    (i.txt.mm = `Preço ${olF(p)} ${p > d ? "acima" : "abaixo"} da média 20 (${olF(d)})`),
    c != null
      ? ((i.tend = l ? d > c : d < c),
        (i.txt.tend = `Média 20 (${olF(d)}) ${d > c ? "acima" : "abaixo"} da 50 (${olF(c)})`))
      : (i.txt.tend = "Poucos candles para a média de 50."),
    i
  );
}
function olRR(e) {
  const t = olN(e.e),
    a = olN(e.st);
  if (t == null || a == null || t === a) return [];
  const o = Math.abs(t - a),
    s = e.sd === "V" ? -1 : 1;
  return (e.al || [])
    .map(olN)
    .filter((n) => n != null)
    .map((n) => ({ a: n, rr: ((n - t) * s) / o }));
}
function olVeredito(e) {
  const t = olRegras(),
    a = e.rg || {};
  let o = 0;
  const s = [],
    n = [];
  t.forEach((i) => {
    a[i.id] === !0 ? o++ : (i.ob ? n : s).push(i);
  });
  const r = n.length ? "bloq" : s.length ? "quase" : "ok";
  return { ok: o, n: t.length, st: r, falta: s, bloq: n };
}
function olPreco(e) {
  const t = String(e || "").toUpperCase(),
    a = typeof lvQ == "function" ? lvQ(t) : null;
  if (a) return { px: a.ult, fonte: a.d ? "com atraso" : "Profit" };
  const o = OL.px[t];
  return o && Date.now() - o.up < 3e5
    ? { px: o.ult, fonte: "com atraso" }
    : null;
}
function olStatus(e) {
  const t = olPreco(e.a);
  if (!t) return "";
  const a = olN(e.e),
    o = olN(e.st),
    s = olN((e.al || [])[0]),
    n = e.sd === "V" ? -1 : 1,
    r = t.px;
  let i = "";
  return (
    o != null && (r - o) * n <= 0
      ? (i = '<span class="r">abaixo do stop: setup invalidado</span>'.replace(
          "abaixo",
          n > 0 ? "abaixo" : "acima",
        ))
      : s != null && (r - s) * n >= 0
        ? (i = '<span class="am">já passou do alvo 1</span>')
        : a != null && (r - a) * n >= 0
          ? (i = '<span class="g">na entrada ou além (acionaria)</span>')
          : a != null &&
            (i = `falta ${Math.abs(((a - r) / r) * 100)
              .toFixed(2)
              .replace(".", ",")}% até a entrada`),
    `<div class="sm" style="margin-top:6px">Agora <b>${olF(r)}</b> <span class="mut">(${t.fonte})</span> · ${i}</div>`
  );
}
function olCard(e) {
  const t = olVeredito(e),
    a = olRR(e),
    o = olRegras(),
    s = e.rg || {},
    n =
      t.st === "ok"
        ? '<span class="olb ok">✓ Dentro das regras</span>'
        : t.st === "bloq"
          ? `<span class="olb no">⛔ Bloqueado: ${esc(t.bloq.map((r) => r.t.split(" (")[0]).join(", "))}</span>`
          : `<span class="olb q">⚠ Falta ${t.falta.length}</span>`;
  return `<div class="card olc${e.arq ? " arq" : ""}" data-olid="${esc(e.id)}">
<div class="top"><span><b style="font-size:16px">${esc(e.a)}</b> <span class="olsd ${e.sd === "V" ? "v" : "c"}">${e.sd === "V" ? "Venda" : "Compra"}</span> <span class="sm mut">${esc(fmtD(e.dia))} · ${esc({ "1d": "Diário", "60m": "60 min", "15m": "15 min" }[e.tf] || "Diário")}</span></span>${n}</div>
<div class="olg"><div><small>Entrada</small><b>${olF(olN(e.e))}</b></div><div><small>Stop</small><b class="r">${olF(olN(e.st))}</b></div>${(
    e.al || []
  )
    .map(olN)
    .map((r, i) =>
      r == null
        ? ""
        : `<div><small>Alvo ${i + 1}${
            a.find((l) => l.a === r)
              ? " · 1:" +
                a
                  .find((l) => l.a === r)
                  .rr.toFixed(1)
                  .replace(".", ",")
              : ""
          }</small><b class="g">${olF(r)}</b></div>`,
    )
    .join("")}</div>
${olStatus(e)}
<details class="olr"><summary class="sm">Regras: <b>${t.ok}/${t.n}</b></summary>${o.map((r) => `<div class="sm olri">${s[r.id] === !0 ? '<span class="g">✓</span>' : s[r.id] === !1 ? '<span class="r">✗</span>' : '<span class="mut">·</span>'} ${esc(r.t)}${r.ob ? ' <span class="mut">(obrigatória)</span>' : ""}${e.au && e.au[r.id] ? `<div class="mut" style="margin-left:16px">${esc(e.au[r.id])}</div>` : ""}</div>`).join("")}${e.auEm ? `<div class="sm mut" style="margin-top:4px">Conferido sozinho em ${esc(new Date(e.auEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}</div>` : ""}</details>
${e.nota ? `<div class="sm mut" style="margin-top:4px">${esc(e.nota)}</div>` : ""}
<div class="olbt"><button class="btn s" data-ol="edita" data-id="${esc(e.id)}">Editar</button><button class="btn s" data-ol="reconf" data-id="${esc(e.id)}">Conferir de novo</button><button class="btn s" data-ol="arq" data-id="${esc(e.id)}">${e.arq ? "Reativar" : "Arquivar"}</button><button class="x" data-ol="apaga" data-id="${esc(e.id)}" aria-label="Apagar">✕</button></div></div>`;
}
function olForm() {
  const e =
      OL.fForm ||
      (OL.ed && OL.ed !== "novo"
        ? olLista().find((n) => n.id === OL.ed) || {}
        : {}),
    t = olRegras(),
    a = OL.rgForm || e.rg || {},
    o = OL.au || {},
    s = (n, r, i, l, d = "") =>
      `<label>${r}<input data-olf="${n}" value="${esc(i ?? "")}" placeholder="${l || ""}" ${d}></label>`;
  return `<div class="card olform"><b>${OL.ed === "novo" ? "Novo trade de olho" : "Editar trade de olho"}</b>
<div class="g2" style="margin-top:8px">${s("a", "Ativo", e.a, "PETR4, WINZ26…", 'autocapitalize="characters"')}${s("dia", "Dia", e.dia || loc().slice(0, 10), "", 'type="date"')}</div>
<div class="g2"><label>Lado<select data-olf="sd"><option value="C"${e.sd !== "V" ? " selected" : ""}>Compra</option><option value="V"${e.sd === "V" ? " selected" : ""}>Venda</option></select></label><label>Tempo gráfico<select data-olf="tf">${[
    ["1d", "Diário"],
    ["60m", "60 min"],
    ["15m", "15 min"],
  ]
    .map(
      ([n, r]) =>
        `<option value="${n}"${(e.tf || "1d") === n ? " selected" : ""}>${r}</option>`,
    )
    .join("")}</select></label></div>
<div class="g2">${s("e", "Entrada", e.e, "0,00", 'inputmode="decimal"')}${s("st", "Stop", e.st, "0,00", 'inputmode="decimal"')}</div>
<div class="g3">${[0, 1, 2].map((n) => s("al" + n, "Alvo " + (n + 1), (e.al || [])[n], n ? "opcional" : "0,00", 'inputmode="decimal"')).join("")}</div>
<div id="olrr" class="sm mut" style="margin:2px 0 6px"></div>
${s("nota", "Nota", e.nota, "Por que esse trade? (opcional)", 'maxlength="200"')}
<div style="margin-top:10px"><b class="sm">Regras de seleção</b> <button class="btn s" data-ol="auto" style="margin-left:6px">${OL.busy ? "Conferindo…" : "🔎 Conferir automático"}</button></div>
<div class="sm mut" style="margin:4px 0 6px">${esc(OL.auMsg || "O app confere sozinho OBV, médias, volume e risco/retorno pelos candles do Yahoo (com atraso). As outras você marca.")}</div>
${t.map((n) => `<label class="olck"><input type="checkbox" data-olrg="${esc(n.id)}"${a[n.id] === !0 ? " checked" : ""}> <span>${esc(n.t)}${n.ob ? ' <span class="mut">(obrigatória)</span>' : ""}${n.auto ? ' <span class="olauto">auto</span>' : ""}${o[n.id] ? `<small class="mut" style="display:block">${esc(o[n.id])}</small>` : ""}</span></label>`).join("")}
<div class="olbt" style="margin-top:10px"><button class="btn" data-ol="salva">Salvar</button><button class="btn s" data-ol="cancela">Cancelar</button></div></div>`;
}
function olRegrasHtml() {
  const e = olRegras();
  return `<details class="olcfg"><summary class="sm">⚙️ Minhas regras de seleção (${e.length})</summary>
${e.map((t, a) => `<div class="olcr"><span class="sm">${esc(t.t)}${t.auto ? ' <span class="olauto">auto</span>' : ""}</span><label class="sm"><input type="checkbox" data-olob="${esc(t.id)}"${t.ob ? " checked" : ""}> obrigatória</label><button class="x" data-ol="rdel" data-id="${esc(t.id)}" aria-label="Remover regra">✕</button></div>`).join("")}
<div class="g2" style="grid-template-columns:1fr auto;align-items:end;margin-top:8px"><label class="sm">Nova regra<input data-olnova placeholder="Ex.: candle de força no fechamento" maxlength="120"></label><button class="btn s" data-ol="radd">Adicionar</button></div>
<button class="btn s" data-ol="rpadrao" style="margin-top:8px">Voltar às regras padrão</button>
<div class="sm mut" style="margin-top:6px">"Obrigatória": se ela não estiver marcada, o trade aparece como bloqueado. As regras com "auto" o app confere sozinho pelos candles (OBV, médias de 20/50, volume e risco/retorno).</div></details>`;
}
function olHtml() {
  const e = olLista().sort(
      (o, s) =>
        String(s.dia).localeCompare(String(o.dia)) || (s.u || 0) - (o.u || 0),
    ),
    t = e.filter((o) => !o.arq),
    a = e.filter((o) => o.arq);
  return `<div class="card olbox" id="olbox"><div class="top"><span><b>👀 Trades de olho</b> <span class="sm mut">${t.length ? t.length + " ativo(s)" : "ideias que você está acompanhando"}</span></span>${OL.ed ? "" : '<button class="btn s" data-ol="novo">+ Adicionar</button>'}</div>
${OL.ed ? olForm() : ""}
${t.length ? t.map(olCard).join("") : OL.ed ? "" : '<div class="sm mut" style="margin:8px 0">Anote aqui os trades que você achou interessantes: ativo, dia, entrada, stop e alvos. O app confere as suas regras (OBV e outras) e mostra quanto falta para a entrada.</div>'}
${a.length ? `<details class="olarq"><summary class="sm mut">Arquivados (${a.length})</summary>${a.slice(0, 30).map(olCard).join("")}</details>` : ""}
${olRegrasHtml()}
<div class="sm mut" style="margin-top:6px">Estudo, não recomendação. O preço vem da ponte do Profit ou, sem ela, com atraso.</div></div>`;
}
function olPinta() {
  const e = document.getElementById("olbox");
  if (!e) return;
  const t = [...e.querySelectorAll("details")].map((s) => s.open),
    a = scrollY,
    o = document.createElement("div");
  ((o.innerHTML = olHtml()),
    e.replaceWith(o.firstElementChild),
    [...document.getElementById("olbox").querySelectorAll("details")].forEach(
      (s, n) => {
        t[n] && (s.open = !0);
      },
    ),
    scrollTo(0, a),
    olRRForm());
}
function olLeForm() {
  const e = (t) =>
    ((document.querySelector(`[data-olf="${t}"]`) || {}).value || "").trim();
  return {
    a: e("a").toUpperCase().replace(/\s+/g, "").slice(0, 16),
    dia: e("dia"),
    sd: e("sd") === "V" ? "V" : "C",
    tf: e("tf") || "1d",
    e: e("e"),
    st: e("st"),
    al: [e("al0"), e("al1"), e("al2")].filter(Boolean),
    nota: e("nota").slice(0, 200),
  };
}
function olRgForm() {
  const e = {};
  return (
    document.querySelectorAll("[data-olrg]").forEach((t) => {
      e[t.dataset.olrg] = t.checked;
    }),
    e
  );
}
function olRRForm() {
  const e = document.getElementById("olrr");
  if (!e) return;
  const t = olLeForm(),
    a = olRR(t),
    o = olN(t.e),
    s = olN(t.st);
  let n = "";
  (o != null &&
    s != null &&
    (t.sd === "C" && s >= o
      ? (n = '<span class="r">Na compra o stop fica abaixo da entrada.</span>')
      : t.sd === "V" && s <= o
        ? (n = '<span class="r">Na venda o stop fica acima da entrada.</span>')
        : (n =
            `Risco ${olF(Math.abs(o - s))} (${((Math.abs(o - s) / o) * 100).toFixed(2).replace(".", ",")}%)` +
            (a.length
              ? " · " +
                a
                  .map(
                    (l, d) =>
                      `alvo ${d + 1} = 1:${l.rr.toFixed(1).replace(".", ",")}`,
                  )
                  .join(" · ")
              : ""))),
    (e.innerHTML = n));
  const r = a.length ? a[0].rr >= 2 : null,
    i = document.querySelector('[data-olrg="rr"]');
  i && r != null && !i.dataset.mexeu && (i.checked = r);
}
async function olAuto(e) {
  const t = olRR(e),
    a = {},
    o = {};
  t.length &&
    ((o.rr = t[0].rr >= 2),
    (a.rr = `Alvo 1 dá 1:${t[0].rr.toFixed(1).replace(".", ",")}`));
  const s = cfg();
  if (!s || !e.a)
    return {
      rg: o,
      au: a,
      msg: "Preencha o ativo para conferir OBV, médias e volume.",
    };
  const n = await fetch(s.url + "/functions/v1/candles", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: s.key },
      body: JSON.stringify({ ativo: e.a, intervalo: e.tf || "1d" }),
    }),
    r = await n.json().catch(() => ({}));
  if (!n.ok) throw new Error(r.error || "Erro " + n.status);
  const i = olCalc(r.candles || [], e.sd);
  for (const p of ["obv", "tend", "mm", "vol"])
    (i[p] != null && (o[p] = i[p]), i.txt[p] && (a[p] = i.txt[p]));
  const l = olRegras(),
    d = Object.keys(o).filter((p) => l.some((u) => u.id === p || u.auto === p)),
    c = !(r.candles || []).some((p) => +p[5] > 0);
  return {
    rg: o,
    au: a,
    msg:
      `Conferido em ${r.simbolo || e.a} (${{ "1d": "diário", "60m": "60 min", "15m": "15 min" }[e.tf || "1d"]}, ${i.n} candles${r.proxy ? ", usando " + r.simbolo + " como referência" : ""}). ${d.length} regra(s) marcadas sozinhas.` +
      (c
        ? ' Este ativo veio sem volume: OBV e volume você marca à mão. Se a função "candles" não foi atualizada, publique a nova.'
        : "") +
      (i.txt.geral ? " " + i.txt.geral : ""),
  };
}
function olAplica(e, t) {
  const a = olRegras(),
    o = { ...e };
  a.forEach((n) => {
    const r = n.auto || n.id;
    t.rg[r] != null && (o[n.id] = t.rg[r]);
  });
  const s = {};
  return (
    a.forEach((n) => {
      const r = n.auto || n.id;
      t.au[r] && (s[n.id] = t.au[r]);
    }),
    { rg: o, au: s }
  );
}
const olSalvaLista = () => {
  (save(), olPinta());
};
function olPintaAuto() {
  const e = document.getElementById("olbox");
  if (!e || OL.ed) return;
  const t = document.activeElement;
  (t && e.contains(t) && /INPUT|SELECT|TEXTAREA/.test(t.tagName)) ||
    (olPintaAuto._h !== olHtml() && (olPinta(), (olPintaAuto._h = olHtml())));
}
(document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-ol]");
  if (!t) return;
  const a = t.dataset.ol,
    o = t.dataset.id;
  if (a === "novo") {
    ((OL.ed = "novo"),
      (OL.au = {}),
      (OL.rgForm = null),
      (OL.fForm = null),
      (OL.auEm = null),
      (OL.auMsg = ""),
      olPinta(),
      document.querySelector('[data-olf="a"]')?.focus());
    return;
  }
  if (a === "cancela") {
    ((OL.ed = null),
      (OL.rgForm = null),
      (OL.fForm = null),
      (OL.auEm = null),
      olPinta());
    return;
  }
  if (a === "edita") {
    const s = olLista().find((n) => n.id === o);
    ((OL.ed = o),
      (OL.au = { ...((s && s.au) || {}) }),
      (OL.rgForm = null),
      (OL.fForm = null),
      (OL.auEm = null),
      (OL.auMsg = ""),
      olPinta(),
      document.getElementById("olbox")?.scrollIntoView({ block: "start" }));
    return;
  }
  if (a === "auto") {
    if (OL.busy) return;
    const s = olLeForm();
    ((OL.fForm = s),
      (OL.rgForm = olRgForm()),
      (OL.busy = !0),
      (OL.auMsg = "Buscando candles…"),
      olPinta());
    try {
      const n = await olAuto(s),
        r = olAplica(OL.rgForm, n);
      ((OL.rgForm = r.rg), (OL.au = r.au), (OL.auMsg = n.msg));
    } catch (n) {
      OL.auMsg = "Não consegui conferir: " + (n.message || n);
    }
    ((OL.busy = !1), (OL.auEm = Date.now()), olPinta());
    return;
  }
  if (a === "salva") {
    const s = olLeForm(),
      n = olN(s.e),
      r = olN(s.st);
    if (!s.a || !s.dia || n == null || r == null || !s.al.length) {
      alert("Preencha ativo, dia, entrada, stop e pelo menos o alvo 1.");
      return;
    }
    if ((s.sd === "C" && r >= n) || (s.sd === "V" && r <= n)) {
      alert(
        s.sd === "C"
          ? "Na compra o stop precisa ficar abaixo da entrada."
          : "Na venda o stop precisa ficar acima da entrada.",
      );
      return;
    }
    const i = OL.ed !== "novo" ? olLista().find((d) => d.id === OL.ed) : null,
      l = {
        ...(i || {}),
        ...s,
        id: i ? i.id : "ol" + uid(),
        rg: olRgForm(),
        au: OL.au || {},
        auEm: OL.auEm || (i && i.auEm) || null,
        arq: i ? !!i.arq : !1,
        u: Date.now(),
      };
    {
      const d = olRR(l);
      ((l.au = { ...l.au }),
        d.length
          ? (l.au.rr = `Alvo 1 dá 1:${d[0].rr.toFixed(1).replace(".", ",")}`)
          : delete l.au.rr);
    }
    ((S.olho = (S.olho || []).filter((d) => d.id !== l.id)),
      S.olho.push(l),
      (OL.ed = null),
      (OL.rgForm = null),
      (OL.au = {}),
      (OL.fForm = null),
      (OL.auEm = null),
      olSalvaLista(),
      window.toast && toast("Trade de olho salvo."),
      olPrecos(!0));
    return;
  }
  if (a === "reconf") {
    const s = olLista().find((n) => n.id === o);
    if (!s) return;
    ((t.textContent = "Conferindo…"), (t.disabled = !0));
    try {
      const n = await olAuto(s),
        r = olAplica(s.rg || {}, n);
      (Object.assign(s, {
        rg: r.rg,
        au: { ...(s.au || {}), ...r.au },
        auEm: Date.now(),
        u: Date.now(),
      }),
        save(),
        window.toast && toast("Regras conferidas de novo.", 2200));
    } catch (n) {
      alert("Não consegui conferir: " + (n.message || n));
    }
    olPinta();
    return;
  }
  if (a === "arq") {
    const s = olLista().find((n) => n.id === o);
    if (!s) return;
    ((s.arq = !s.arq), (s.u = Date.now()), olSalvaLista());
    return;
  }
  if (a === "apaga") {
    if (!confirm("Apagar este trade de olho?")) return;
    ((S.olho = (S.olho || []).filter((s) => s.id !== o)),
      ((S.del ?? (S.del = {}))[o] = Date.now()),
      OL.ed === o && (OL.ed = null),
      olSalvaLista());
    return;
  }
  if (a === "radd") {
    const s = document.querySelector("[data-olnova]"),
      n = ((s && s.value) || "").trim();
    if (!n) return;
    ((S.olR = [...olRegras(), { id: "r" + uid(), t: n.slice(0, 120) }]),
      (S.olRu = Date.now()),
      olSalvaLista());
    return;
  }
  if (a === "rdel") {
    const s = olRegras();
    if (s.length <= 1) {
      alert("Deixe pelo menos uma regra.");
      return;
    }
    const n = s.find((r) => r.id === o);
    if (!n || !confirm(`Remover a regra "${n.t}"?`)) return;
    ((S.olR = s.filter((r) => r.id !== o)),
      (S.olRu = Date.now()),
      olSalvaLista());
    return;
  }
  if (a === "rpadrao") {
    if (!confirm("Voltar às regras padrão? As regras que você criou somem."))
      return;
    ((S.olR = OL_REGRAS.map((s) => ({ ...s }))),
      (S.olRu = Date.now()),
      olSalvaLista());
    return;
  }
}),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-olob]");
    if (t) {
      ((S.olR = olRegras().map((o) =>
        o.id === t.dataset.olob ? { ...o, ob: t.checked } : o,
      )),
        (S.olRu = Date.now()),
        olSalvaLista());
      return;
    }
    const a = e.target.closest("[data-olrg]");
    (a && (a.dataset.mexeu = "1"),
      e.target.closest('[data-olf="sd"]') && olRRForm());
  }),
  document.addEventListener("input", (e) => {
    e.target.closest("[data-olf]") && olRRForm();
  }));
async function olPrecos(e) {
  if (
    tab !== "live" ||
    document.hidden ||
    !SESS ||
    (!e && Date.now() - OL.pxTs < 6e4)
  )
    return;
  const t = cfg();
  if (!t) return;
  const a = /^(WIN|WDO|IND|DOL|BGI|CCM|ICF|WSP|DI1)/,
    o = [
      ...new Set(
        olLista()
          .filter((s) => !s.arq)
          .map((s) => String(s.a).toUpperCase()),
      ),
    ].filter(
      (s) => !a.test(s) && !(typeof lvQ == "function" && lvQ(s) && !lvQ(s).d),
    );
  if (o.length) {
    OL.pxTs = Date.now();
    try {
      const s = await fetch(t.url + "/functions/v1/precos", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: t.key },
          body: JSON.stringify({
            br: o.filter((r) => /\d/.test(r)),
            us: o.filter((r) => !/\d/.test(r)),
          }),
        }),
        n = await s.json();
      if (!s.ok) return;
      for (const r of [n.br || {}, n.us || {}])
        for (const i in r)
          r[i] > 0 && (OL.px[i.toUpperCase()] = { ult: +r[i], up: Date.now() });
      olPintaAuto();
    } catch {}
  }
}
if ((setInterval(() => olPrecos(!1), 15e3), typeof vLive == "function")) {
  const e = vLive;
  vLive = function () {
    return (
      setTimeout(() => {
        (olRRForm(), olPrecos(!1));
      }, 0),
      e
        .apply(this, arguments)
        .replace("<h1>Cotações ao vivo</h1>", "<h1>Ao vivo</h1>" + olHtml())
    );
  };
}
if (typeof lvcPaint == "function") {
  const e = lvcPaint;
  lvcPaint = function () {
    (e.apply(this, arguments), tab === "live" && olPintaAuto());
  };
}
(function () {
  const e = TraderStyles.slot("legacy-023");
  ((e.textContent = TraderStyles.css("legacy-023")), TraderStyles.mount(e));
})();
function jsonTolerante(e) {
  if (typeof e != "string") return null;
  const t = e.replace(/```(?:json)?/gi, ""),
    a = t.indexOf("{");
  if (a < 0) return null;
  const o = t.slice(a),
    s = '"\\/bfnrtu';
  let n = "",
    r = !1,
    i = [],
    l = "";
  const d = (p) => {
    try {
      return JSON.parse(p);
    } catch {
      return;
    }
  };
  for (let p = 0; p < o.length; p++) {
    const u = o[p];
    if (r) {
      if (u === "\\") {
        const m = o[p + 1];
        m !== void 0 && s.includes(m) ? ((n += u + m), p++) : (n += "\\\\");
        continue;
      }
      if (u === '"') {
        ((r = !1), (n += u), (l = '"'));
        continue;
      }
      if (
        u ===
        `
`
      ) {
        n += "\\n";
        continue;
      }
      if (u === "\r") continue;
      if (u === "	") {
        n += "\\t";
        continue;
      }
      n += u;
      continue;
    }
    if (/\s/.test(u)) {
      n += u;
      continue;
    }
    if (
      ((u === '"' || u === "{" || u === "[") &&
        (l === '"' || l === "}" || l === "]" || /[0-9el]/.test(l)) &&
        i.length &&
        (n += ","),
      u === '"')
    ) {
      ((r = !0), (n += u), (l = ""));
      continue;
    }
    if (u === "{" || u === "[") {
      (i.push(u === "{" ? "}" : "]"), (n += u), (l = u));
      continue;
    }
    if (u === "}" || u === "]") {
      if (
        ((n = n.replace(/,\s*$/, "")), i.pop(), (n += u), (l = u), !i.length)
      ) {
        const m = d(n);
        if (m !== void 0) return m;
        break;
      }
      continue;
    }
    ((n += u), (l = u));
  }
  let c = r ? n + '"' : n;
  for (let p = 0; p < 80 && c.length > 1; p++) {
    const u = c.replace(/[\s,:]+$/, ""),
      m = fechamentos(u);
    if (m !== null) {
      const x = d(u + m);
      if (x !== void 0) return x;
    }
    const f = ultimoCorte(c);
    if (f <= 0) break;
    c = c.slice(0, f);
  }
  return null;
}
function fechamentos(e) {
  const t = [];
  let a = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o];
    if (a) {
      s === "\\" ? o++ : s === '"' && (a = !1);
      continue;
    }
    s === '"'
      ? (a = !0)
      : s === "{"
        ? t.push("}")
        : s === "["
          ? t.push("]")
          : (s === "}" || s === "]") && t.pop();
  }
  return a ? null : t.reverse().join("");
}
function ultimoCorte(e) {
  let t = !1,
    a = -1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o];
    if (t) {
      s === "\\" ? o++ : s === '"' && (t = !1);
      continue;
    }
    s === '"'
      ? (t = !0)
      : s === ","
        ? (a = o)
        : (s === "{" || s === "[") && (a = o + 1);
  }
  return a >= e.length ? e.length - 1 : a;
}
function anxConserta(e) {
  try {
    const t = e && e.relatorio;
    if (!t || typeof t.texto_bruto != "string") return e;
    const a = jsonTolerante(t.texto_bruto);
    if (!a || typeof a != "object") return e;
    const o = a.relatorio && typeof a.relatorio == "object" ? a.relatorio : a;
    return (
      Object.keys(o).length && (e.relatorio = { ...o, _consertado: 1 }),
      e
    );
  } catch {
    return e;
  }
}
{
  const e = anxTec;
  anxTec = function (t, ...a) {
    return e(anxConserta(t), ...a);
  };
}
{
  const e = anxFun;
  anxFun = function (t, ...a) {
    return e(anxConserta(t), ...a);
  };
}
{
  const e = anxPos;
  anxPos = function (t, ...a) {
    return e(anxConserta(t), ...a);
  };
}
{
  const e = anxImg;
  anxImg = function (t, ...a) {
    return e(anxConserta(t), ...a);
  };
}
{
  const e = anxItem;
  anxItem = function (t, ...a) {
    return e(anxConserta(t), ...a);
  };
}
const IMPX = {
    plat: (() => {
      try {
        return ls.get("diario-imp-plat") || "profit";
      } catch {
        return "profit";
      }
    })(),
    dest: "auto",
    rowDest: {},
  },
  CME_MULT = {
    ES: 50,
    MES: 5,
    NQ: 20,
    MNQ: 2,
    YM: 5,
    MYM: 0.5,
    RTY: 50,
    M2K: 5,
    CL: 1e3,
    MCL: 100,
    QM: 500,
    GC: 100,
    MGC: 10,
    SI: 5e3,
    SIL: 1e3,
    HG: 25e3,
    NG: 1e4,
    ZB: 1e3,
    ZN: 1e3,
    ZF: 1e3,
    ZT: 2e3,
    "6E": 125e3,
    M6E: 12500,
    "6B": 62500,
    "6J": 125e5,
    "6A": 1e5,
  };
function cmeMult(e) {
  const t = String(e || "")
    .toUpperCase()
    .replace(/^[@\/]/, "")
    .replace(/[\s.].*$/, "")
    .match(
      /^(M2K|M6E|MES|MNQ|MYM|MCL|MGC|SIL|6[EBJA]|ES|NQ|YM|RTY|CL|QM|GC|SI|HG|NG|ZB|ZN|ZF|ZT)(?:[FGHJKMNQUVXZ]\d{1,2}|\d{0,2}!?|)$/,
    );
  return t ? CME_MULT[t[1]] : null;
}
const impNum = (e) => {
  let t = String(e ?? "")
    .replace(/R\$|US\$|\$|\s/g, "")
    .replace(/[^\d,.\-]/g, "");
  if (!t || t === "-") return null;
  /,\d{1,8}$/.test(t)
    ? (t = t.replace(/\./g, "").replace(",", "."))
    : /^-?\d{1,3}(\.\d{3})+$/.test(t)
      ? (t = t.replace(/\./g, ""))
      : (t = t.replace(/,/g, ""));
  const a = +t;
  return isFinite(a) ? a : null;
};
function impData(e, t) {
  const a = (String(e || "") + " " + String(t || "")).trim();
  let o = a.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (o) {
    const s = +o[3] < 100 ? 2e3 + +o[3] : +o[3];
    return new Date(
      s,
      +o[2] - 1,
      +o[1],
      +(o[4] || 0),
      +(o[5] || 0),
      +(o[6] || 0),
    );
  }
  return (
    (o = a.match(
      /(\d{4})-(\d{2})-(\d{2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    )),
    o
      ? new Date(
          +o[1],
          +o[2] - 1,
          +o[3],
          +(o[4] || 0),
          +(o[5] || 0),
          +(o[6] || 0),
        )
      : null
  );
}
const impLado = (e) => {
  const t = String(e || "")
    .trim()
    .toUpperCase();
  return /^(C|COMPRA|BUY|B|COMPRADO|LONG|C\/)/.test(t)
    ? "C"
    : /^(V|VENDA|SELL|S|VENDIDO|SHORT)/.test(t)
      ? "V"
      : null;
};
function impGenerico(e) {
  const t = e
    .replace(/\r/g, "")
    .split(
      `
`,
    )
    .filter((A) => A.trim());
  if (t.length < 2) throw new Error("Arquivo vazio.");
  const a = [";", ",", "	"]
      .map((A) => [
        A,
        t.slice(0, 15).reduce((C, I) => C + I.split(A).length, 0),
      ])
      .sort((A, C) => C[1] - A[1])[0][0],
    o = (A) => {
      const C = [];
      let I = "",
        J = !1;
      for (const se of A) {
        if (se === '"') {
          J = !J;
          continue;
        }
        se === a && !J ? (C.push(I.trim()), (I = "")) : (I += se);
      }
      return (C.push(I.trim()), C);
    },
    s = (A) =>
      String(A || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    n = {
      ativo:
        /^(ativo|simbolo|papel|ticker|instrumento|contrato|ativo\/contrato|symbol|codigo|asset)$/,
      lado: /^(lado|c\/v|natureza|operacao|side|direcao|sentido|compra\/venda|tipo de operacao)$/,
      qtd: /(qtd|quantidade|qtde|lotes?|contratos|quantity|volume)/,
      preco: /(preco medio|preco exec|preco|price|avg)/,
      data: /^(data|data\/hora|data e hora|hora|horario|dt|criacao|criado em|executad[ao] em|abertura|time|date|datetime)/,
      hora: /^(hora|horario|time)$/,
      status: /(status|estado|situacao)/,
      entrada: /(preco (de )?entrada|entrada|preco abertura|open price|entry)/,
      saida: /(preco (de )?saida|saida|preco fechamento|close price|exit)/,
      res: /(resultado|p&l|pnl|lucro|ganho|profit)/,
      dt1: /(fechamento|saida em|data saida|data de saida|close time|encerramento)/,
    };
  let r = -1,
    i = [];
  for (let A = 0; A < Math.min(40, t.length); A++) {
    const C = o(t[A]).map(s);
    if (
      ["ativo", "lado", "qtd", "preco", "data"].filter((I) =>
        C.some((J) => n[I].test(J)),
      ).length >= 3 &&
      C.some((I) => n.ativo.test(I))
    ) {
      ((r = A), (i = C));
      break;
    }
  }
  if (r < 0)
    throw new Error(
      "Não reconheci as colunas desse arquivo. Ele precisa ter pelo menos ativo, lado (compra/venda), quantidade, preço e data. Me mande um exemplo do arquivo para ajustar.",
    );
  const l = (A, C = []) =>
      i.findIndex((I, J) => n[A].test(I) && !C.includes(J)),
    d = l("ativo"),
    c = l("lado"),
    p =
      i.findIndex((A) => /exec/.test(A) && n.qtd.test(A)) >= 0
        ? i.findIndex((A) => /exec/.test(A) && n.qtd.test(A))
        : l("qtd"),
    u = l("status"),
    m = l("res"),
    f = i.findIndex(
      (A) =>
        n.entrada.test(A) &&
        /preco|price|entrada|entry/.test(A) &&
        !/data|hora|time/.test(A),
    ),
    x = i.findIndex(
      (A) =>
        n.saida.test(A) &&
        /preco|price|saida|exit/.test(A) &&
        !/data|hora|time/.test(A),
    ),
    v =
      i.findIndex((A) => /preco medio|avg/.test(A)) >= 0
        ? i.findIndex((A) => /preco medio|avg/.test(A))
        : i.findIndex((A) => /preco exec/.test(A)) >= 0
          ? i.findIndex((A) => /preco exec/.test(A))
          : l("preco"),
    g = l("data"),
    h = i.findIndex((A, C) => n.hora.test(A) && C !== g),
    b = l("dt1", [g]),
    y = t
      .slice(r + 1)
      .map(o)
      .filter((A) => A.length >= Math.max(d, p) + 1 && A[d]);
  if (f >= 0 && x >= 0 && f !== x) {
    const A = [];
    if (
      (y.forEach((C) => {
        const I = String(C[d]).toUpperCase().trim(),
          J = impLado(C[c]),
          se = impNum(C[p]),
          Ie = impNum(C[f]),
          Pe = impNum(C[x]),
          Me = impData(C[g], h >= 0 ? C[h] : ""),
          ue = b >= 0 ? impData(C[b]) : Me;
        !I ||
          !J ||
          !(se > 0) ||
          Ie == null ||
          !Me ||
          A.push({
            a: I,
            side: J,
            t0: Me,
            t1: ue || Me,
            op: [[Ie, Math.abs(se)]],
            cl: Pe != null ? [[Pe, Math.abs(se)]] : [],
            open: Pe == null ? 1 : 0,
            res: m >= 0 ? impNum(C[m]) : null,
          });
      }),
      !A.length)
    )
      throw new Error(
        "Reconheci as colunas, mas nenhuma operação completa (ativo, lado, quantidade, entrada e data).",
      );
    return { orders: [], trs: A };
  }
  const j = (A) =>
      u < 0 ||
      (/exec|preench|fill|total|conclu|negoci|trade/i.test(String(A || "")) &&
        !/cancel|rejeit|parcialmente cancel/i.test(String(A || ""))),
    k = [];
  if (
    (y.forEach((A) => {
      if (!j(u >= 0 ? A[u] : "")) return;
      const C = String(A[d]).toUpperCase().trim(),
        I = impLado(A[c]),
        J = impNum(A[p]),
        se = impNum(A[v]),
        Ie = impData(A[g], h >= 0 ? A[h] : "");
      !C ||
        !I ||
        !(J > 0) ||
        se == null ||
        !Ie ||
        k.push({
          a: C,
          lado: I,
          st: "Executada",
          cr: Ie,
          stop: null,
          tipo: "",
          fills: [[Ie, se, Math.abs(J)]],
        });
    }),
    !k.length)
  )
    throw new Error(
      "Reconheci as colunas, mas nenhuma ordem executada com ativo, lado, quantidade, preço e data.",
    );
  return { orders: k, trs: impTrips(k) };
}
{
  const e = impLoad;
  impLoad = function (t) {
    IMPX.rowDest = {};
    let a = null;
    try {
      (e(t), (a = !0));
    } catch (s) {
      a = s;
    }
    if (a === !0) {
      ((IM.fonte =
        IMPX.plat === "blackarrow" ||
        (/CME|COMEX|NYMEX|CBOT/.test(t.slice(0, 3e3)) && IMPX.plat !== "profit")
          ? "BlackArrow"
          : "Profit"),
        impRefresh());
      return;
    }
    const o = impGenerico(t);
    if (!o.trs.length)
      throw new Error("Não encontrei operações nesse arquivo.");
    ((IM = {
      orders: o.orders,
      trs: o.trs,
      cfg: impDefaults(o.orders, o.trs),
      off: new Set(),
      fonte: IMPX.plat === "blackarrow" ? "BlackArrow" : (IMPX.plat, "CSV"),
    }),
      impRefresh());
  };
}
{
  const e = impBuild;
  impBuild = function () {
    const t = e();
    return (
      t.forEach((a, o) => {
        const s = IM.trs[o] || {},
          n = cmeMult(a.t.ativo);
        (n &&
          ((a.t.pv = n),
          (a.cme = 1),
          a.t.exit !== "" &&
            (a.pl =
              (a.t.exit - a.t.entry) *
                (a.t.side === "C" ? 1 : -1) *
                a.t.qty *
                n -
              (a.t.cost || 0))),
          s.res != null && isFinite(s.res) && ((a.pl = s.res), (a.resArq = 1)),
          IM.fonte &&
            IM.fonte !== "Profit" &&
            ((a.t.setup = "Importado da " + IM.fonte),
            (a.t.nota = a.t.nota.replace(
              "Custos não vêm no relatório.",
              "Importado de " + IM.fonte + ".",
            ))));
      }),
      t
    );
  };
}
{
  const e = impRefresh;
  impRefresh = function () {
    e();
    const t = new Set((S.mesaTr || []).map((a) => a.id));
    IM.rows.forEach((a) => {
      t.has("m" + a.t.id) && IM.dup.add(a.t.id);
    });
  };
}
const IMP_DEST = [
    ["auto", "Automático (como o app detecta)"],
    ["D", "Day trade"],
    ["S", "Swing trade"],
    ["O", "Opções"],
    ["mesa", "Mesa proprietária"],
  ],
  impDestDe = (e) => IMPX.rowDest[e.id] || IMPX.dest;
{
  const e = vImport;
  vImport = function () {
    const t = e(),
      a = `<div class="card" style="margin:8px 0"><div class="g2"><label>Plataforma<select data-imppl><option value="profit"${IMPX.plat === "profit" ? " selected" : ""}>Profit (histórico de ordens)</option><option value="blackarrow"${IMPX.plat === "blackarrow" ? " selected" : ""}>BlackArrow</option><option value="outra"${IMPX.plat === "outra" ? " selected" : ""}>Outra (CSV com colunas)</option></select></label>
<label>Mandar para<select data-impds>${IMP_DEST.map(([o, s]) => `<option value="${o}"${IMPX.dest === o ? " selected" : ""}>${s}</option>`).join("")}</select></label></div>
<div class="sm mut" style="margin-top:6px">${IMPX.plat === "profit" ? "No Profit: histórico de ordens → exportar CSV." : "Na BlackArrow (ou outra plataforma): exporte o histórico de ordens ou de operações em CSV. O app reconhece as colunas pelo nome (ativo, lado, quantidade, preço, data; ou entrada, saída e resultado). Futuros da CME (ES, MES, NQ, MNQ, CL, GC…) usam o multiplicador em dólar."} Você pode mudar o destino de cada operação na lista.</div></div>`;
    return t
      .replace('<label class="btn s"', a + '<label class="btn s"')
      .replace(
        "📂 Escolher arquivo CSV",
        "📂 Escolher arquivo CSV" +
          (IMPX.plat === "profit"
            ? " do Profit"
            : IMPX.plat === "blackarrow"
              ? " da BlackArrow"
              : ""),
      );
  };
}
{
  const e = impPrev;
  impPrev = function () {
    let t = e();
    return (
      !IM ||
        !IM.rows ||
        (IM.rows.forEach((a) => {
          const o = a.t;
          if (IM.dup.has(o.id)) return;
          const s = impDestDe(o),
            n = `data-a="imptog" data-id="${o.id}"`,
            r = t.indexOf(n);
          if (r < 0) return;
          const i = t.indexOf("</div></div>", r);
          if (i < 0) return;
          const l = `<div class="sm" style="margin-top:4px"><select data-impdr="${o.id}" style="padding:4px 6px;font-size:13px;width:auto">${IMP_DEST.map(([d, c]) => `<option value="${d}"${s === d ? " selected" : ""}>${d === "auto" ? "Automático: " + (o.tipo === "D" ? "Day trade" : o.tipo === "O" ? "Opção" : "Swing") : c}</option>`).join("")}</select>${a.cme ? ' <span class="am">CME · US$</span>' : ""}${a.resArq ? ' <span class="mut">resultado do arquivo</span>' : ""}${s === "mesa" && o.exit === "" ? ' <span class="r">aberta: não vai para a mesa</span>' : ""}</div>`;
          t = t.slice(0, i) + l + t.slice(i);
        }),
        IM.rows.forEach((a) => {
          if (!a.cme || a.pl == null) return;
          const o = t.indexOf(`data-id="${a.t.id}"`);
          if (o < 0) return;
          const s = t.indexOf('<div class="rt ', o);
          if (s < 0) return;
          const n = t.indexOf(">", s) + 1,
            r = t.indexOf("</div>", n);
          t =
            t.slice(0, n) +
            "US$ " +
            (+a.pl).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) +
            t.slice(r);
        })),
      t
    );
  };
}
(document.addEventListener(
  "click",
  (e) => {
    e.target.closest("[data-impdr]") && e.stopPropagation();
  },
  !0,
),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-imppl]");
    if (t) {
      IMPX.plat = t.value;
      try {
        ls.set("diario-imp-plat", t.value);
      } catch {}
      render();
      return;
    }
    const a = e.target.closest("[data-impds]");
    if (a) {
      ((IMPX.dest = a.value), (IMPX.rowDest = {}), render());
      return;
    }
    const o = e.target.closest("[data-impdr]");
    o && ((IMPX.rowDest[o.dataset.impdr] = o.value), render());
  }),
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target.closest('[data-a="impgo"]') || !IM || !IM.rows) return;
      (e.stopPropagation(), e.preventDefault());
      const t = IM.rows.filter(
        (l) => !IM.dup.has(l.t.id) && !IM.off.has(l.t.id),
      );
      let a = 0,
        o = 0,
        s = 0,
        n = 0;
      const r = { D: 0, S: 0, O: 0 };
      (t.forEach((l) => {
        const d = impDestDe(l.t);
        if (d === "mesa") {
          if (l.t.exit === "" || l.pl == null) {
            n++;
            return;
          }
          ((S.mesaTr = S.mesaTr || []),
            S.mesaTr.push({
              id: "m" + l.t.id,
              dt: String(l.t.dt).slice(0, 16),
              a: l.t.ativo,
              sd: l.t.side,
              q: String(l.t.qty),
              v: +(+l.pl).toFixed(2),
              pe: l.t.entry,
              ps: l.t.exit,
              nota: "Importado " + (IM.fonte ? "da " + IM.fonte : "do arquivo"),
              u: Date.now(),
            }),
            s++);
          return;
        }
        const c = d === "auto" ? l.t.tipo : d;
        if (IM.upd.has(l.t.id)) {
          const u = S.trades.find((m) => m.id === l.t.id);
          u &&
            ((u.exit = l.t.exit), (u.dtx = l.t.dtx), (u.u = Date.now()), o++);
          return;
        }
        const p = { ...l.t, tipo: c, u: Date.now() };
        (c === "O" && l.t.tipo !== "O" && (p.estr = p.estr || "Outra"),
          S.trades.push(p),
          a++,
          (r[c] = (r[c] || 0) + 1));
      }),
        save());
      const i = [
        r.D ? r.D + " day trade" : "",
        r.S ? r.S + " swing" : "",
        r.O ? r.O + " opções" : "",
        s ? s + " na mesa proprietária" : "",
      ]
        .filter(Boolean)
        .join(" · ");
      ((IM = {
        msg:
          "✅ " +
          (a + s) +
          " operação(ões) importada(s)" +
          (i ? " (" + i + ")" : "") +
          (o ? " e " + o + " aberta(s) encerrada(s)" : "") +
          (n
            ? ". " +
              n +
              " aberta(s) não foram para a mesa (a mesa só recebe operações fechadas)."
            : "."),
      }),
        render());
    },
    !0,
  ),
  document.addEventListener(
    "change",
    async (e) => {
      const t = e.target;
      if (t.id !== "impf" || !t.files || !t.files[0]) return;
      e.stopPropagation();
      const a = await t.files[0].arrayBuffer();
      let o;
      try {
        o = new TextDecoder("utf-8", { fatal: !0 }).decode(a);
      } catch {
        o = new TextDecoder("windows-1252").decode(a);
      }
      try {
        impLoad(o.replace(/^\ufeff/, ""));
      } catch (s) {
        IM = { err: s.message || "Não consegui ler o arquivo." };
      }
      ((t.value = ""), render());
    },
    !0,
  ));
const AG = { v: {}, ts: {}, busy: 0, err: "", sem: 0, rot: 0 };
try {
  const e = ls.get("diario-agenda");
  e && e.v && (AG.v = e.v);
} catch {}
const AG_FL = {
    BR: "🇧🇷",
    US: "🇺🇸",
    CN: "🇨🇳",
    EU: "🇪🇺",
    DE: "🇩🇪",
    GB: "🇬🇧",
    JP: "🇯🇵",
    CA: "🇨🇦",
  },
  AG_NM = {
    BR: "Brasil",
    US: "EUA",
    CN: "China",
    EU: "Zona do Euro",
    DE: "Alemanha",
    GB: "Reino Unido",
    JP: "Japão",
    CA: "Canadá",
  },
  AG_DS = [
    "DOMINGO",
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO",
  ],
  agDia = (e) =>
    new Date(e).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }),
  agHora = (e) =>
    new Date(e).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
async function agCarrega(e) {
  const t = AG.sem;
  if (
    AG.busy ||
    (!e && AG.v[t] && Date.now() - (AG.ts[t] || 0) < 10 * 6e4) ||
    (!e && AG.err && Date.now() - (AG.errTs || 0) < 2 * 6e4)
  )
    return;
  const a = cfg();
  if (!a) {
    ((AG.err = "Configure o Supabase na aba Conta."), agPaint());
    return;
  }
  ((AG.busy = 1), (AG.err = ""), agPaint());
  try {
    const o = await fetch(a.url + "/functions/v1/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: a.key },
        body: JSON.stringify({ modo: "agenda", semana: t }),
      }),
      s = await o.json().catch(() => ({}));
    if (!o.ok)
      throw new Error(
        o.status === 404
          ? 'Função "macro" não encontrada: publique-a no Supabase.'
          : s.error || "Erro " + o.status,
      );
    if (!Array.isArray(s.eventos))
      throw new Error(
        'Para ver a semana inteira, publique a nova versão da função "macro" no Supabase. Enquanto isso, segue o quadro do TradingView.',
      );
    ((AG.v[t] = s), (AG.ts[t] = Date.now()));
    try {
      ls.set("diario-agenda", { v: AG.v });
    } catch {}
  } catch (o) {
    ((AG.err = String(o.message || o)), (AG.errTs = Date.now()));
  }
  ((AG.busy = 0), agPaint());
}
function agPaint() {
  if (tab !== "mercado" || MKT.tab !== "ag") return;
  const e = window.scrollY;
  (render(), window.scrollTo(0, e));
}
function agFiltra(e) {
  const t = String(MKT.ct || ""),
    a = t.split(",").length > 3,
    o = a ? null : new Set(t.toUpperCase().split(",")),
    s = new Set(
      String(MKT.im || "0,1")
        .split(",")
        .map(Number),
    );
  let n = 0;
  return {
    out: e.filter((r) =>
      (o && !o.has(r.p)) || !s.has(r.imp)
        ? !1
        : r.rotina && !AG.rot
          ? (n++, !1)
          : !0,
    ),
    rot: n,
  };
}
const agImp = (e) =>
  `<span class="ag-imp i${e + 2}" title="${["baixa", "média", "alta"][e + 1]} importância">${"<i></i>".repeat(3)}</span>`;
function agHtml() {
  const e = AG.v[AG.sem];
  if (!e)
    return AG.busy
      ? '<div class="sm mut" style="padding:12px 0">Carregando a agenda…</div>'
      : "";
  const { out: t, rot: a } = agFiltra(e.eventos || []),
    o = Date.now(),
    s = agDia(new Date().toISOString()),
    n = t.find((p) => Date.parse(p.em) > o - 5 * 6e4),
    r = {};
  t.forEach((p) => {
    (r[agDia(p.em)] = r[agDia(p.em)] || []).push(p);
  });
  const i = [];
  t.filter((p) => p.imp === 1).forEach((p) => {
    const u =
      p.p + p.t.replace(/ (mensal|anual|tri\/tri|pr\xe9via|final)$/, "");
    i.some((m) => m.k === u) || i.push({ k: u, e: p });
  });
  const l = Object.keys(r).sort(),
    d = (p) => {
      const u =
          (Date.parse(p.em) < o - 3e5 && !p.atual) || Date.parse(p.em) < o - 3e5
            ? " pas"
            : "",
        m = [
          p.atual
            ? `<span><span class="mut">Atual</span> <b>${esc(p.atual)}</b></span>`
            : "",
          p.proj
            ? `<span><span class="mut">Proj.</span> ${esc(p.proj)}</span>`
            : "",
          p.ant
            ? `<span><span class="mut">Ant.</span> ${esc(p.ant)}</span>`
            : "",
        ]
          .filter(Boolean)
          .join("");
      return `<div class="ag-ev${u}${n && p === n ? " prox" : ""}"><div class="ag-h">${agHora(p.em)}</div><div class="ag-fl">${AG_FL[p.p] || ""}</div><div class="ag-tx"><div><b>${esc(AG_NM[p.p] || p.p)}:</b> ${esc(p.t)}${p.per ? ` <span class="mut">(${esc(p.per)})</span>` : ""} ${agImp(p.imp)}${n && p === n ? ' <span class="ag-tag">próximo</span>' : ""}</div>${m ? `<div class="ag-n sm">${m}</div>` : ""}</div></div>`;
    },
    c = (p) => {
      const u = new Date(p + "T12:00:00-03:00"),
        m = u.getUTCDay(),
        f = m === 0;
      if (p < s && AG.sem === 0) {
        const x = r[p].length;
        return `<details class="ag-dia ag-pas" data-agd="${p}"${(AG.ab || {})[p] ? " open" : ""}><summary class="ag-dh" style="cursor:pointer;list-style:none;opacity:.6"><b>${p.slice(8, 10)}/${p.slice(5, 7)}</b> <span>${f ? "DOMINGO" : AG_DS[m]}</span> <span class="mut sm">· ${x} evento(s) · já passou</span> <span class="mut" style="float:right">${(AG.ab || {})[p] ? "▾" : "▸"}</span></summary>${r[p].map(d).join("")}</details>`;
      }
      return `<div class="ag-dia${p === s ? " hoje" : ""}"><div class="ag-dh">${f ? '<span>ANTES DA SEMANA</span> <span class="mut">domingo ' + p.slice(8, 10) + "/" + p.slice(5, 7) + "</span>" : `<b>${p.slice(8, 10)}/${p.slice(5, 7)}</b> <span>${AG_DS[m]}</span>`}${p === s ? ' <span class="ag-tag">hoje</span>' : ""}</div>${r[p].map(d).join("")}</div>`;
    };
  return `${
    i.length
      ? `<div class="ag-dest"><div class="sm mut">Destaques da semana</div><div>${i
          .slice(0, 10)
          .map(
            ({ e: p }) =>
              `<span class="ag-chip">${AG_FL[p.p] || ""} ${esc(p.t.replace(/ (mensal|anual|tri\/tri)$/, ""))} <span class="mut">${AG_DS[new Date(agDia(p.em) + "T12:00:00-03:00").getUTCDay()].slice(0, 3).toLowerCase()}</span></span>`,
          )
          .join("")}</div></div>`
      : ""
  }
  ${l.length ? l.map(c).join("") : '<div class="sm mut" style="padding:12px 0">Nenhum evento com esses filtros nesta semana.</div>'}
  <div class="sm mut" style="margin-top:8px">Horários de Brasília. ${t.length} evento(s)${a ? ` · ${a} de rotina escondido(s) (leilões de títulos, inspeções de grãos, estoques semanais) <button class="btn s" data-ag="rot" style="padding:2px 8px">mostrar</button>` : AG.rot ? ' <button class="btn s" data-ag="rot" style="padding:2px 8px">esconder rotina</button>' : ""}. Fonte: calendário econômico do TradingView${e.em ? ", às " + hm(Date.parse(e.em)) : ""}; o Focus de segunda (8h25) o app acrescenta quando não vem. ${agImp(1)} alta · ${agImp(0)} média · ${agImp(-1)} baixa.</div>`;
}
function vAgenda(e) {
  const t = AG.v[AG.sem],
    a = AG.err && !t;
  return `<div class="card"><div class="top"><b>Agenda econômica</b><button class="btn s" data-ag="rf">${AG.busy ? "…" : "↻ Atualizar"}</button></div>${e}
  ${mkRow(["Esta semana", "Próxima semana"].map((o, s) => `<button class="btn${AG.sem === s ? "" : " s"}" data-ag="sem" data-v="${s}">${o}</button>`).join(""))}
  <div class="sm mut">País</div>${mkRow(MK_CT.map(([o, s]) => mkBtn("ct", o, s, MKT.ct === o)).join(""))}<div class="sm mut">Importância</div>${mkRow(MK_IM.map(([o, s]) => mkBtn("im", o, s, MKT.im === o)).join(""))}
  ${AG.err ? `<div class="sm ${a ? "am" : "r"}" style="margin:6px 0">${esc(AG.err)}</div>` : ""}
  ${a ? '<div id="mkcal" style="min-height:560px"></div><div class="sm mut" style="margin-top:6px">Quadro do TradingView (mostra só parte dos eventos).</div>' : `<div id="agbox">${agHtml()}</div>`}</div>`;
}
{
  const e = vMercado;
  vMercado = function () {
    if (MKT.tab !== "ag") return e.apply(this, arguments);
    const t = MKT.tab,
      a =
        '<div class="seg mk-seg" style="margin:10px 0">' +
        mkBtn("tab", "ag", "Agenda", t === "ag") +
        mkBtn("tab", "nt", "Notícias", t === "nt") +
        mkBtn("tab", "cot", "Cotações", t === "cot") +
        mkBtn("tab", "se", "Sentimento", t === "se") +
        mkBtn("tab", "al", "Alertas", t === "al") +
        "</div>";
    return vAgenda(a);
  };
}
{
  const e = mkCal;
  mkCal = function () {
    (document.getElementById("mkcal") && e(), setTimeout(() => agCarrega(), 0));
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-ag]");
  if (!t) return;
  const a = t.dataset.ag;
  a === "rf"
    ? agCarrega(!0)
    : a === "sem"
      ? ((AG.sem = +t.dataset.v || 0), (AG.err = ""), agCarrega(!0))
      : a === "rot" && ((AG.rot = AG.rot ? 0 : 1), agPaint());
}),
  (function () {
    const e = TraderStyles.slot("legacy-024");
    ((e.textContent = TraderStyles.css("legacy-024")), TraderStyles.mount(e));
  })());
const SET = {
    v: (() => {
      try {
        return ls.get("diario-setores") || null;
      } catch {
        return null;
      }
    })(),
    ts: 0,
    busy: 0,
    err: "",
    reg: (() => {
      try {
        return ls.get("diario-setores-reg") || "us";
      } catch {
        return "us";
      }
    })(),
  },
  SET_P = [
    ["d", "Hoje"],
    ["w", "5 dias"],
    ["m", "1 mês"],
    ["t", "3 meses"],
  ];
async function setCarrega(e) {
  if (SET.busy || (!e && (SET.v || SET.err) && Date.now() - SET.ts < 3 * 6e4))
    return;
  const t = cfg();
  if (t) {
    ((SET.busy = 1), (SET.err = ""), setPaint());
    try {
      const a = await fetch(t.url + "/functions/v1/macro", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: t.key },
          body: JSON.stringify({ modo: "setores" }),
        }),
        o = await a.json().catch(() => ({}));
      if (!a.ok) throw new Error(o.error || "Erro " + a.status);
      if (!("us" in o) && !("br" in o))
        throw new Error(
          'Para ver os setores, publique a nova versão da função "macro" no Supabase.',
        );
      ((SET.v = o), (SET.ts = Date.now()));
      try {
        ls.set("diario-setores", o);
      } catch {}
    } catch (a) {
      ((SET.err = String(a.message || a)), (SET.ts = Date.now() - 15e4));
    }
    ((SET.busy = 0), setPaint());
  }
}
function setPaint() {
  if (tab !== "mercado" || MKT.tab !== "mu") return;
  const e = window.scrollY;
  (render(), window.scrollTo(0, e));
}
function setPainel(e, t, a, o) {
  const s = e.filter((i) => i[t] != null).sort((i, l) => l[t] - i[t]);
  if (!s.length) return "";
  const n = Math.max(...s.map((i) => Math.abs(i[t])), 0.5) * 1.05,
    r = (i) => {
      const l = (Math.abs(i[t]) / n) * 50,
        d = i[t] >= 0;
      return `<div class="set-r"><span class="set-n">${esc(i.n)}</span><span class="set-b"><i class="set-z"></i><i class="set-bar ${d ? "g" : "r"}" style="left:${d ? 50 : 50 - l}%;width:${Math.max(l, 0.6)}%"></i></span><b class="set-v ${d ? "g" : "r"}">${(i[t] > 0 ? "+" : "") + mdoN(i[t])}%</b></div>`;
    };
  return `<div class="set-p"><div class="set-h"><b>${a}</b>${o && o[t] != null ? `<span class="sm mut">${esc(o.n)} <b class="${o[t] >= 0 ? "g" : "r"}">${(o[t] > 0 ? "+" : "") + mdoN(o[t])}%</b></span>` : ""}</div>${s.map(r).join("")}</div>`;
}
function setHtml() {
  const e = SET.v,
    t = e && e[SET.reg],
    a = `<div style="display:flex;gap:6px;margin:8px 0">${[
      ["us", "🇺🇸 EUA (S&P 500)"],
      ["br", "🇧🇷 Brasil (B3)"],
    ]
      .map(
        ([s, n]) =>
          `<button class="btn${SET.reg === s ? "" : " s"}" data-set="reg" data-v="${s}">${n}</button>`,
      )
      .join("")}</div>`;
  let o = "";
  return (
    t && t.setores && t.setores.length
      ? (o = `<div class="set-g">${SET_P.map(([s, n]) => setPainel(t.setores, s, n, t.ref)).join("")}</div>
    ${t.destaques && t.destaques.length ? `<div class="set-d"><b>Destaques</b>${t.destaques.map((s, n) => `<div class="sm"><span class="set-num">${n + 1}</span>${esc(s.txt)}</div>`).join("")}</div>` : ""}`)
      : e && !t
        ? (o =
            '<div class="sm mut">O TradingView não mandou esses setores agora. Toque em ↻ para tentar de novo.</div>')
        : SET.busy && (o = '<div class="sm mut">Carregando os setores…</div>'),
    `<div class="card"><div class="top"><b>📊 Setores · ranking por período</b><button class="btn s" data-set="rf">${SET.busy ? "…" : "↻"}</button></div>${a}
  ${SET.err ? `<div class="sm am" style="margin:4px 0">${esc(SET.err)}</div>` : ""}${o}
  <div class="sm mut" style="margin-top:8px">Do melhor para o pior em cada período. ${SET.reg === "us" ? "EUA: ETFs setoriais do S&P 500 (XLK, XLE, XLF…)." : "Brasil: índices setoriais da B3 (IFNC, IMAT, IEEX…). Petróleo não tem índice próprio: está dentro de Materiais básicos e do Ibovespa."} Fonte: TradingView${e && e.em ? ", às " + hm(Date.parse(e.em)) : ""}, com atraso.</div></div>`
  );
}
{
  const e = vMundo;
  vMundo = function (t) {
    setTimeout(() => setCarrega(), 0);
    const a = e.apply(this, arguments),
      o = a.indexOf('<div class="card"><div class="top"><b>🗺️');
    return o >= 0 ? a.slice(0, o) + setHtml() + a.slice(o) : a + setHtml();
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-set]");
  if (t)
    if (t.dataset.set === "rf") setCarrega(!0);
    else {
      SET.reg = t.dataset.v;
      try {
        ls.set("diario-setores-reg", SET.reg);
      } catch {}
      setPaint();
    }
}),
  (function () {
    const e = TraderStyles.slot("legacy-025");
    ((e.textContent = TraderStyles.css("legacy-025")), TraderStyles.mount(e));
  })());
async function rpAbrir(e, t, a) {
  const o = document.getElementById("pdfov");
  if ((o && o.remove(), !TraderStyles.find("pdfcss2"))) {
    const i = TraderStyles.slot("legacy-026");
    ((i.id = "pdfcss2"),
      (i.textContent = TraderStyles.css("legacy-026")),
      TraderStyles.mount(i));
  }
  const s = (PDFB = {
      tt: e,
      busy: 1,
      blob: null,
      msg: "Montando o PDF…",
      name: t,
    }),
    n = document.createElement("div");
  ((n.id = "pdfov"),
    (n.innerHTML =
      '<div class="pvbar" id="pdfbar"></div><div id="pdfst"></div><div id="pdfprev"></div>'));
  const r = async () => {
    ((s.busy = 1), (s.msg = "Montando o PDF…"), pdfBar());
    try {
      const i = await a();
      if (PDFB !== s) return;
      ((s.blob = new Blob([i], { type: "application/pdf" })),
        (s.busy = 0),
        (s.msg =
          'PDF pronto. Toque em "Salvar / compartilhar" para mandar pelo WhatsApp, e-mail ou salvar em Arquivos.'),
        pdfBar(),
        rpPrevia(i));
    } catch (i) {
      if ((console.error(i), PDFB !== s)) return;
      ((s.busy = 0),
        (s.msg = "Não consegui gerar o PDF: " + (i.message || i)),
        pdfBar());
    }
  };
  (n.addEventListener("click", (i) => {
    const l = i.target.closest("[data-pv]");
    if (!l) return;
    const d = l.dataset.pv;
    d === "x" ? pdfClose() : d === "s" ? pdfShare() : d === "g" && r();
  }),
    document.body.appendChild(n),
    (document.body.style.overflow = "hidden"),
    (history.state && history.state.pdf) || history.pushState({ pdf: 1 }, ""),
    pdfBar(),
    r());
}
const rpAgora = () =>
  new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
function rpRodapeDados(e, t) {
  const a = e.doc.getPages(),
    o = a.length;
  a.forEach((s, n) => {
    ((e.pg = s),
      e.ln(e.M, e.H - 40, e.W - e.M, e.H - 40, { c: e.C.bd, w: 0.7 }),
      e.t(t, e.M, e.H - 32, { s: 6.8, c: e.C.mut, w: e.CW - 70 }),
      e.t(`Página ${n + 1} de ${o}`, e.W - e.M, e.H - 32, {
        s: 7.2,
        f: "b",
        c: e.C.mut,
        al: "r",
      }));
  });
}
async function rpSetores(e) {
  const t = await rpLib(),
    a = "Gerado em " + rpAgora(),
    o = await rpNovo(t, {
      titulo: "Setores · ranking por período",
      cabecalho: "Setores · ranking por período",
      tipo: "Desempenho por setor",
      data: a,
    });
  rpCapa(o, {
    tipo: "Desempenho por setor",
    titulo: "Setores: EUA e Brasil",
    sub: "Do melhor para o pior em cada período: hoje, 5 dias, 1 mês e 3 meses",
    data: a,
  });
  const s = [
    ["d", "Hoje"],
    ["w", "5 dias"],
    ["m", "1 mês"],
    ["t", "3 meses"],
  ];
  for (const [n, r, i] of [
    [
      "us",
      "EUA · setores do S&P 500",
      "ETFs setoriais do S&P 500 (XLK, XLE, XLF e outros).",
    ],
    [
      "br",
      "Brasil · índices setoriais da B3",
      "IFNC, IMAT, IEEX, UTIL, ICON, IMOB, INDX, IFIX, SMLL e IDIV. Petróleo não tem índice próprio: está em Materiais básicos e no Ibovespa.",
    ],
  ]) {
    const l = e && e[n];
    if (!(!l || !l.setores || !l.setores.length)) {
      (n === "br" && o.y > o.TOP + 40 && o.add(),
        o.h2(r, i, 300),
        l.destaques &&
          l.destaques.length &&
          o.caixa(
            "Destaques",
            l.destaques.map((d) => ({ b: d.txt })),
            { barra: o.C.ac },
          ));
      for (const [d, c] of s) {
        const p = l.setores
          .filter((u) => u[d] != null)
          .sort((u, m) => m[d] - u[d]);
        p.length &&
          (o.need(40 + p.length * 22),
          o.h3(
            c +
              (l.ref && l.ref[d] != null
                ? `  ·  ${l.ref.n} ${(l.ref[d] > 0 ? "+" : "") + rpNum(l.ref[d], 2)}%`
                : ""),
          ),
          rpBarras(o, {
            itens: p.map((u) => ({
              l: u.n,
              v: u[d],
              c: u[d] >= 0 ? o.C.g : o.C.r,
              txt: (u[d] > 0 ? "+" : "") + rpNum(u[d], 2) + "%",
            })),
            un: "%",
            lw: 150,
          }));
      }
    }
  }
  return (
    rpRodapeDados(
      o,
      'Dados do TradingView, com atraso. "5 dias" = variação da semana. Material informativo, não é recomendação de investimento.',
    ),
    await o.doc.save()
  );
}
document.addEventListener("click", (e) => {
  e.target.closest('[data-set="pdf"]') &&
    SET.v &&
    rpAbrir(
      "Setores · ranking por período",
      "setores-" + loc().slice(0, 10) + ".pdf",
      () => rpSetores(SET.v),
    );
});
{
  const e = setHtml;
  setHtml = function () {
    const t = e();
    return SET.v
      ? t.replace(
          '<button class="btn s" data-set="rf">',
          '<button class="btn s" data-set="pdf" style="margin-right:6px">📄 PDF</button><button class="btn s" data-set="rf">',
        )
      : t;
  };
}
const ECO = {
    l: (() => {
      try {
        return ls.get("diario-eco") || [];
      } catch {
        return [];
      }
    })(),
    busy: 0,
    err: "",
    rascunho: "",
  },
  ECO_SUG = [
    "O que o próximo Copom pode fazer com os juros futuros (DI)?",
    "Explique o payroll e o efeito no dólar e no WDO",
    "Por que o minério de Dalian importa para a VALE3?",
    "O que significa curva de juros inclinando?",
  ];
function ecoSalva() {
  try {
    ls.set("diario-eco", ECO.l.slice(-20));
  } catch {}
}
async function ecoPergunta(e) {
  if (((e = String(e || "").trim()), e.length < 3 || ECO.busy)) return;
  const t = e.match(/https?:\/\/\S+/),
    a = t ? t[0] : "";
  ((ECO.busy = 1), (ECO.err = ""), (ECO.rascunho = ""), ecoPaint());
  try {
    const o = await anxCall({
      modo: "economista",
      texto: e,
      link: a,
      hist: ECO.l
        .slice(-4)
        .map((s) => ({
          p: s.q,
          r: [s.r.resumo, ...(s.r.explicacao || []).slice(0, 2)].join(" "),
        })),
    });
    if (!o || !o.resposta)
      throw new Error(
        o && o.erro
          ? o.erro
          : 'Para usar o Economista, publique a nova versão da função "analise" no Supabase.',
      );
    (ECO.l.push({
      id: Date.now().toString(36),
      q: e,
      em: new Date().toISOString(),
      r: o.resposta,
    }),
      ecoSalva());
  } catch (o) {
    ((ECO.err = String(o.message || o)), (ECO.rascunho = e));
  }
  ((ECO.busy = 0),
    ecoPaint(),
    ECO.err ||
      setTimeout(() => {
        const o = document.querySelector(".eco-it");
        o && o.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60));
}
function ecoPaint() {
  if (tab !== "mercado" || MKT.tab !== "eco") return;
  const e = document.getElementById("eco_tx"),
    t = e ? e.value : null,
    a = window.scrollY;
  render();
  const o = document.getElementById("eco_tx");
  (o && t != null && !ECO.busy && !ECO.rascunho && (o.value = t),
    window.scrollTo(0, a));
}
const ECO_DIR = {
  alta: ["▲", "g", "alta"],
  baixa: ["▼", "r", "baixa"],
  neutro: ["●", "mut", "neutro"],
  incerto: ["?", "am", "incerto"],
};
function ecoResp(e) {
  const t = e.r || {},
    a = (o) =>
      o && o.length
        ? `<ul class="eco-ul">${o.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
        : "";
  return `<div class="card eco-it" data-eco-id="${esc(e.id)}">
  <div class="eco-q">${esc(e.q.length > 400 ? e.q.slice(0, 400) + "…" : e.q)}</div>
  <div class="top" style="margin-top:8px"><b style="font-size:18px">${esc(t.titulo || "Resposta")}</b><span class="eco-cf ${t.confianca === "alta" ? "g" : t.confianca === "média" ? "am" : "r"}">confiança ${esc(t.confianca || "–")}</span></div>
  ${t.resumo ? `<div class="eco-res">${esc(t.resumo)}</div>` : ""}
  ${(t.explicacao || []).map((o) => `<p class="eco-p">${esc(o)}</p>`).join("")}
  ${t.fatos && t.fatos.length ? `<h3>Fatos confirmados</h3>${a(t.fatos)}` : ""}
  ${
    t.impactos && t.impactos.length
      ? `<h3>Efeito nos mercados</h3><div class="eco-imp">${t.impactos
          .map((o) => {
            const s = ECO_DIR[o.direcao] || ECO_DIR.incerto;
            return `<div><b>${esc(o.mercado)}</b><span class="${s[1]}">${s[0]} ${s[2]}</span><div class="sm mut">${esc(o.porque)}</div></div>`;
          })
          .join("")}</div>`
      : ""
  }
  ${t.cenarios && t.cenarios.length ? `<h3>Cenários</h3>${t.cenarios.map((o) => `<div class="eco-cen"><div class="top"><b>${esc(o.nome)}</b><b>${o.probabilidade_pct}%</b></div><div class="eco-pb"><i style="width:${o.probabilidade_pct}%"></i></div><div class="sm">${esc(o.descricao)}</div>${o.gatilhos ? `<div class="sm mut">Confirma se: ${esc(o.gatilhos)}</div>` : ""}</div>`).join("")}` : ""}
  ${t.o_que_observar && t.o_que_observar.length ? `<h3>O que observar</h3>${a(t.o_que_observar)}` : ""}
  ${t.visoes && t.visoes.length ? `<h3>Como as escolas leem</h3>${t.visoes.map((o) => `<div class="sm" style="margin:4px 0"><b>${esc(o.escola)}:</b> ${esc(o.argumento)}</div>`).join("")}` : ""}
  ${t.contraponto ? `<div class="eco-ctr"><b>Contraponto</b><div class="sm">${esc(t.contraponto)}</div></div>` : ""}
  ${t.glossario && t.glossario.length ? `<details class="eco-gl"><summary>Glossário (${t.glossario.length})</summary>${t.glossario.map((o) => `<div class="sm"><b>${esc(o.termo)}:</b> ${esc(o.significado)}</div>`).join("")}</details>` : ""}
  ${t.fontes && t.fontes.length ? `<div class="sm mut" style="margin-top:8px">Fontes: ${esc(t.fontes.join(" · "))}</div>` : ""}
  <div class="eco-ac"><span class="sm mut">${esc(new Date(e.em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}</span><span><button class="btn s" data-eco="pdf" data-v="${esc(e.id)}">📄 PDF</button> <button class="btn s" data-eco="del" data-v="${esc(e.id)}" aria-label="Apagar">🗑</button></span></div></div>`;
}
