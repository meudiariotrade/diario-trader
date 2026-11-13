try {
  (function () {
    "use strict";
    const v = document;
    window.DIARIO_V420 = 1;
    const It = {
        home: '<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
        cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
        trade: '<path d="M4 7h16m-5-4 5 4-5 4M20 17H4m5-4-5 4 5 4"/>',
        bars: '<path d="M4 20v-4m5 4v-8m5 8V8m5 12V4"/>',
        book: '<path d="M12 6c-3-2-6-2-10-2v16c4 0 7 0 10 2m0-16c3-2 6-2 10-2v16c-4 0-7 0-10 2z"/>',
        monitor:
          '<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
        grad: '<path d="m2 10 10-5 10 5-10 5zm4 3v5c4 3 8 3 12 0v-5m4-3v8"/>',
        check: '<path d="m4 12 5 5L20 6"/>',
        checksq:
          '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
        news: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h9M8 11h9M8 15h5M5 7h1M5 11h1M5 15h1"/>',
        alert: '<path d="m12 3 10 18H2zm0 6v5m0 3v.1"/>',
        spark:
          '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
        target:
          '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        shield:
          '<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
        up: '<path d="m4 17 6-6 4 4 6-8M15 7h5v5"/>',
        bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
        plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
        sliders:
          '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
        right: '<path d="m9 5 7 7-7 7"/>',
        left: '<path d="m15 5-7 7 7 7"/>',
        arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
        folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
        layers: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
        crosshair:
          '<circle cx="12" cy="12" r="8"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="2"/>',
        doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
        image:
          '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
        warn: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v.1"/>',
        pencil: '<path d="m4 17 11-11 4 4L8 21H4zm9-9 4 4"/>',
        coins:
          '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"/>',
        wallet: '<path d="M3 7h16v12H3zM3 7l12-3v3M16 13h2"/>',
        trophy:
          '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 2 4 4 4m8-4h4c0 3-2 4-4 4M12 13v4m-4 4h8"/>',
        timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
        list: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
        expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
        down: '<path d="m6 9 6 6 6-6"/>',
        tools:
          '<path d="M14 7a4 4 0 0 1-5 5l-6 6 3 3 6-6a4 4 0 0 1 5-5l-3-3 3-3a4 4 0 0 0-3 3z"/>',
      },
      p = (t, e = 20) =>
        `<svg viewBox="0 0 24 24" width="${e}" height="${e}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${It[t] || It.bars}</svg>`,
      b = (t) => {
        try {
          if (typeof esc == "function") return esc(t);
        } catch {}
        return String(t ?? "").replace(
          /[&<>"']/g,
          (e) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[e],
        );
      },
      G = (t) =>
        Number.isFinite(+t)
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(+t)
          : "—",
      j = (t) => (Number.isFinite(+t) ? (t > 0 ? "+" : "") + G(t) : "—"),
      Q = (t, e = 2) =>
        Number.isFinite(t)
          ? (t > 0 ? "+" : "") +
            t.toLocaleString("pt-BR", {
              minimumFractionDigits: e,
              maximumFractionDigits: e,
            }) +
            "%"
          : "—",
      _ = (t, e = 2) =>
        Number.isFinite(+t)
          ? (+t).toLocaleString("pt-BR", {
              minimumFractionDigits: e,
              maximumFractionDigits: e,
            })
          : "—",
      q = (t) => {
        if (t === "" || t == null || ((t = +t), !Number.isFinite(t)))
          return "—";
        const e = Math.abs(t),
          a = e >= 1e5 ? 0 : e < 10 ? 4 : 2;
        return t.toLocaleString("pt-BR", {
          minimumFractionDigits: a,
          maximumFractionDigits: a,
        });
      },
      L = (t) => (t > 0 ? "v-pos" : t < 0 ? "v-neg" : ""),
      f = (t, e) => {
        try {
          const a = t();
          return a === void 0 ? e : a;
        } catch {
          return e;
        }
      },
      et = () => f(() => tab, ""),
      V = () =>
        f(() => loc().slice(0, 10), new Date().toISOString().slice(0, 10)),
      ft = () => f(() => (typeof D == "string" ? D : V()), V()),
      Tt = () => f(() => typeof MDM < "u" && MDM === "us", !1),
      ct = () => f(() => (Array.isArray(S.trades) ? S.trades : []), []),
      nt = (t) => String(t.dtx || t.dt || "").slice(0, 10),
      R = (t) =>
        f(() => {
          const e = typeof cBRL == "function" ? cBRL(t) : calc(t);
          return Number.isFinite(e?.pl) ? e.pl : null;
        }, null),
      T = (t) =>
        f(() => {
          const e = calc(t).r;
          return Number.isFinite(e) ? e : null;
        }, null),
      Nt = (t) =>
        f(() => {
          const e = calc(t).risk;
          return Number.isFinite(e) ? e : 0;
        }, 0),
      Gt = (t) => f(() => isOpen(t), !1),
      pt = (t) => ct().filter((e) => R(e) !== null && (!t || nt(e) === t)),
      Jt = () => ct().filter(Gt),
      lt = (t, e) => t.reduce((a, r) => a + (e(r) || 0), 0),
      yt = () =>
        f(() => {
          const t = ["D", "S", "O"].map((a) => capCalc(a)).filter(Boolean);
          if (t.length) return t.reduce((a, r) => a + r.at, 0);
          const e = +S?.prop?.cap;
          return e > 0 ? e : null;
        }, null),
      ut = (t = ft()) =>
        f(() => {
          const e = S.days[t] || {};
          return Tt() ? e.us || {} : e;
        }, {}),
      Et = () =>
        f(
          () =>
            Tt()
              ? Array.isArray(S.rulesUS)
                ? S.rulesUS
                : S.rules || []
              : S.rules || [],
          [],
        ),
      at = (t) =>
        ["pre", "during", "post"].includes(t?.phase)
          ? t.phase
          : [0, 2].includes(Number(t?.cat))
            ? "pre"
            : "during",
      Yt = () => {
        const t = +ut().metaDia;
        if (t > 0) return t;
        const e = f(() => +S.prop.metaDia, 0);
        return e > 0 ? e : null;
      },
      St = () => {
        const t = +ut().maxP;
        if (t > 0) return t;
        const e = f(() => +S.prop.perdaDia, 0);
        return e > 0 ? e : null;
      },
      Ct = () => {
        const t = +(ut().pl2 || {}).max;
        if (t > 0) return t;
        const e = f(() => pCore([], 0).nd, null);
        return e > 0 ? e : null;
      },
      wt = (t) => String(t).split("-").reverse().join("/"),
      Kt = (t) =>
        new Date(t + "T12:00:00")
          .toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          .replace(/^./, (e) => e.toUpperCase()),
      E = (t) => {
        const e = yt();
        return e && Number.isFinite(t) ? (t / e) * 100 : null;
      },
      jt = () => f(() => segundaDe(V()), V().slice(0, 8) + "01");
    function Ft() {
      try {
        const t = new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit",
            weekday: "short",
            hour12: !1,
          }).formatToParts(new Date()),
          e = (r) => (t.find((n) => n.type === r) || {}).value || "",
          a = +e("hour") * 60 + +e("minute");
        return /s[áa]b|dom/i.test(e("weekday"))
          ? "fechado"
          : a < 540
            ? "pre"
            : a <= 1105
              ? "pregao"
              : "pos";
      } catch {
        return "pregao";
      }
    }
    const Qt = {
      IBOV: ["IBOV", "TVC:IBOV", "BMFBOVESPA:IBOV", "^BVSP"],
      "S&P 500": ["SPX", "SP:SPX", "S&P 500", "US500", "^GSPC"],
      NASDAQ: ["NDX", "NASDAQ:NDX", "NAS100", "IXIC", "^IXIC"],
      DXY: ["DXY", "TVC:DXY"],
      "USD/BRL": ["USDBRL", "FX_IDC:USDBRL", "USD/BRL", "BRL=X"],
      PETR4: ["PETR4", "BMFBOVESPA:PETR4"],
      "DI Jan/27": ["DI1F27", "BMFBOVESPA:DI1F2027", "DI1F2027"],
    };
    function ht(t) {
      const e = (Qt[t] || [t]).map((n) => n.toUpperCase());
      let a = null;
      const r = (n, l) => {
        if (
          ![n?.s, n?.c, n?.pedido, n?.simbolo, n?.tk]
            .filter(Boolean)
            .map((i) => String(i).toUpperCase())
            .some((i) => e.includes(i) || e.includes(i.split(":").pop()))
        )
          return;
        const o = +n.px;
        if (!(o > 0)) return;
        const u = n.d1 != null ? +n.d1 : null;
        (!a || l >= a.ts) &&
          (a = { px: o, d1: Number.isFinite(u) ? u : null, ts: l });
      };
      try {
        const n = CQ.d || {};
        for (const l in n) {
          const s = n[l],
            o = Date.parse(s?.em) || CQ.ts?.[l] || 0;
          (s?.itens || []).forEach((u) => r(u, o));
        }
      } catch {}
      try {
        const n = window.TRM?.TR?.dados || {};
        for (const [l, s] of Object.entries(n)) {
          if (!l.startsWith("cot|")) continue;
          const o = Date.parse(s?.v?.em) || s.ts || 0;
          Date.now() - o > 12 * 36e5 ||
            (s?.v?.itens || []).forEach((u) => r(u, o));
        }
      } catch {}
      try {
        (AD.data?.itens || []).forEach((n) => r(n, AD.data.ts || 0));
      } catch {}
      return a;
    }
    function Wt(t) {
      if (!t) return null;
      const e = String(t).toUpperCase(),
        a = ht(e);
      if (a) return a.px;
      const r = e.replace(/[FGHJKMNQUVXZ]\d{2}$/, "");
      if (r !== e) {
        const n = ht(r);
        if (n) return n.px;
      }
      return null;
    }
    const C = (t, e, a, r, n = "") =>
        `<section class="v4-card ${n}"><header class="v4-head"><h2>${p(t, 22)}<span>${e}</span></h2>${a || ""}</header>${r}</section>`,
      st = (t, e) =>
        `<button type="button" class="v4-link" ${e}>${t} ${p("right", 15)}</button>`,
      gt = (t) => `<p class="v4-empty">${t}</p>`,
      Zt = {
        home: {
          title: "Ferramentas do Início",
          groups: [
            ["hoje", "Posso operar?", (t) => t.id === "hg-hoje"],
            [
              "escala",
              "Escala de turno",
              (t) =>
                /^(Escala de turno|Trabalha em escala)/i.test(W(t)) ||
                t.matches('[data-hb="turno"]'),
            ],
            [
              "rotina",
              "Rotina",
              (t) => t.matches(".routine-card,.studio-routine"),
            ],
            ["modal", "Modalidades", (t) => /^Hoje por modalidade/i.test(W(t))],
            [
              "cal",
              "Calendário",
              (t) => /^Calendário/i.test(W(t)) || /^\+ Day trade/i.test(W(t)),
            ],
            [
              "monitor",
              "Monitor",
              (t) => t.matches("#market-watch-shortcut,.trhome"),
            ],
            [
              "ingles",
              "Inglês do dia",
              (t) =>
                t.matches('[data-hb="en"]') || /^Inglês do dia/i.test(W(t)),
            ],
            ["pat", "Patrimônio", (t) => t.id === "hg-pat"],
            ["mais", "Mais", () => !0],
          ],
        },
        dia: {
          title: "Diário completo do dia",
          always: (t) => t.matches(".dlin,#svs"),
          hide: (t) => t.matches(".platform-area") || t.tagName === "H1",
          groups: [
            ["plano", "Plano × execução", (t) => t.id === "plcard"],
            ["pre", "Antes", (t) => t.matches("#dfases,.dfase"), "pre"],
            ["dur", "Durante", (t) => t.matches("#dfases,.dfase"), "dur"],
            ["pos", "Depois", (t) => t.matches("#dfases,.dfase"), "pos"],
            ["ferr", "Ferramentas", () => !0],
          ],
        },
        ops: {
          title: "Ferramentas de operação",
          hide: (t) =>
            t.matches(".platform-area") ||
            t.tagName === "H1" ||
            (t.matches(".sm.mut") &&
              /Escolha a modalidade/.test(t.textContent)),
          groups: [
            [
              "mod",
              "Modalidades",
              (t) => t.matches(".modg") || /^Minhas modalidades/.test(W(t)),
            ],
            ["geral", "Visão geral", () => !0],
          ],
        },
        stats: {
          title: "Estatísticas completas",
          hide: (t) => t.matches(".platform-area"),
          groups: [["est", "Estatísticas", () => !0]],
        },
      },
      W = (t) => (t.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
      Bt = "diario-v420-tools";
    let Mt = (() => {
      try {
        return JSON.parse(localStorage.getItem(Bt) || "{}");
      } catch {
        return {};
      }
    })();
    function te() {
      try {
        localStorage.setItem(Bt, JSON.stringify(Mt));
      } catch {}
    }
    function ee(t, e) {
      const a = Zt[t];
      if (!a || !e) return;
      const r = e.closest("#dt393-workspace") || e;
      r.classList.add("v4-tools-ws");
      const n = [...e.children].filter(
          (i) => !i.classList.contains("v420-proxied"),
        ),
        l = {};
      if (
        (n.forEach((i) => {
          if (
            (i.removeAttribute("data-v4g"),
            i.classList.remove("v4-off"),
            a.hide && a.hide(i))
          ) {
            i.classList.add("v420-proxied");
            return;
          }
          if (a.always && a.always(i)) {
            i.setAttribute("data-v4g", "*");
            return;
          }
          for (const [h, , M] of a.groups)
            if (M(i)) {
              const y = ["pre", "dur", "pos"].includes(h) ? "fases" : h;
              (i.setAttribute("data-v4g", y), (l[y] = 1));
              break;
            }
        }),
        t === "home")
      ) {
        se(e, r);
        return;
      }
      /* Grupos já desmontados nesta mesma tela continuam com aba (a troca remonta a tela). */
      ((e.dataset.v4grupos || "").split(",").filter(Boolean).forEach((g) => (l[g] = 1)),
        (e.dataset.v4grupos = Object.keys(l).join(",")));
      const s = a.groups.filter(
        ([i]) => l[["pre", "dur", "pos"].includes(i) ? "fases" : i],
      );
      if (!s.length) return;
      let o = Mt[t];
      if (t === "dia") {
        const i = f(() => (DFASE && DFASE.d === ft() ? DFASE.f : null), null);
        (!o || ["pre", "dur", "pos"].includes(o)) &&
          (o = i && ["pre", "dur", "pos"].includes(i) ? i : o || "plano");
      }
      s.some(([i]) => i === o) || (o = s[0][0]);
      const u = v.createElement("div");
      ((u.className = "v4-tools-head"),
        (u.innerHTML = `<h2>${p("tools", 20)}<span>${a.title}</span></h2><div class="v4-tabs" role="tablist">${s.map(([i, h]) => `<button type="button" role="tab" data-v4tool="${i}" data-v4route="${t}" class="${i === o ? "on" : ""}" aria-selected="${i === o}">${h}</button>`).join("")}</div>`),
        r.querySelector(".v4-tools-head")?.remove(),
        r.prepend(u),
        Ot(t, o, e, !1));
    }
    function Ot(t, e, a, r) {
      if (((a = a || v.querySelector("#dt393-workspace .dt393-native")), !a))
        return;
      const n = ["pre", "dur", "pos"].includes(e) ? "fases" : e;
      /* Tela única (CLAUDE.md): grupos fora da aba ativa saem do DOM; trocar de aba remonta a tela. */
      if (r && Mt[t] !== e) {
        ((Mt[t] = e), te());
        if (["pre", "dur", "pos"].includes(e))
          try {
            DFASE = { d: ft(), f: e };
          } catch {}
        try {
          render();
          return;
        } catch {}
      }
      if (
        (a.setAttribute("data-v4act", n),
        [...a.children].forEach((l) => {
          const s = l.getAttribute("data-v4g");
          !s || s === "*" || s === n || l.remove();
        }),
        v
          .querySelectorAll(`[data-v4tool][data-v4route="${t}"]`)
          .forEach((l) => {
            const s = l.dataset.v4tool === e;
            (l.classList.toggle("on", s),
              l.setAttribute("aria-selected", String(s)));
          }),
        ["pre", "dur", "pos"].includes(e))
      ) {
        const l = a.querySelector(`#dfases [data-dfase="${e}"]`);
        l && !l.classList.contains("on") && l.click();
      }
      r && ((Mt[t] = e), te());
    }
    const Dt = {
      hoje: ["Posso operar?", "shield"],
      escala: ["Escala de turno", "cal"],
      cal: ["Calendário", "cal"],
      ingles: ["Inglês do dia", "grad"],
      pat: ["Patrimônio", "wallet"],
    };
    let J = null;
    const ae = (t) =>
      t.matches(
        "#studio-intro,.studio-intro,#studio-shortcuts,.studio-shortcuts,.brand116",
      ) || /^RESUMO DO DIA/i.test(W(t));
    function se(t, e) {
      e.querySelector(".v4-tools-head")?.remove();
      const a = J && Dt[J] ? J : null;
      (v.body.classList.toggle("v4-homeview", !!a),
        t.setAttribute("data-v4act", a || "mais"));
      let r = 0;
      [...t.children].forEach((l) => {
        const s = l.getAttribute("data-v4g");
        if (!s || s === "*") return;
        let o = a ? s !== a : s !== "mais";
        (!a && s === "mais" && ae(l) && (o = !0),
          !o && !a && r++,
          o && l.remove());
      });
      const n = v.createElement("div");
      a
        ? (t.querySelectorAll(`[data-v4g="${a}"] details`).forEach((l) => {
            l.dataset.v427 || ((l.open = !0), (l.dataset.v427 = "1"));
          }),
          (n.className = "v4-tools-head v4-viewhead"),
          (n.innerHTML = `<button type="button" class="v4-back" data-v4homeback="1">${p("left", 18)}<span>Início</span></button><h2>${p(Dt[a][1], 20)}<span>${Dt[a][0]}</span></h2>`),
          e.prepend(n))
        : r &&
          ((n.className = "v4-tools-head v4-morehead"),
          (n.innerHTML = `<h2>${p("list", 20)}<span>Últimos registros</span></h2>`),
          e.prepend(n));
    }
    function Pt(t) {
      J = Dt[t] ? t : null;
      try {
        (irPara("home"), scrollTo(0, 0));
      } catch {}
    }
    window.addEventListener(
      "click",
      (t) => {
        const e = t.target.closest?.("[data-v4home]");
        if (e) {
          (t.preventDefault(), t.stopImmediatePropagation());
          try {
            v.querySelector("#dt394-drawer [data-dt394-close]")?.click();
          } catch {}
          Pt(e.dataset.v4home);
          return;
        }
        if (t.target.closest?.("[data-v4homeback]")) {
          (t.preventDefault(), t.stopImmediatePropagation(), Pt(null));
          return;
        }
        t.target.closest?.('[data-dt393-route="home"]') && (J = null);
      },
      !0,
    );
    const oe = [
      "home",
      "dia",
      "regras",
      "ops",
      "trades",
      "swing",
      "opc",
      "ativos",
      "fx",
      "stats",
      "rev",
      "dash",
      "opgrade",
      "opfluxo",
      "opcart",
      "swbt",
      "dtrpy",
    ];
    function re(t) {
      if (!t) return;
      v.getElementById("v4-subnav")?.remove();
      const e = t.querySelector(":scope > .modh"),
        a = [...t.querySelectorAll(":scope > .seg.hub, :scope > .hub2")];
      if (
        (t
          .querySelectorAll(":scope > .platform-area")
          .forEach((o) => o.classList.add("v420-proxied")),
        !a.length && !e)
      )
        return;
      const r = v.createElement("div");
      ((r.id = "v4-subnav"),
        (r.className = "v4-subnav"),
        r.setAttribute("role", "navigation"),
        r.setAttribute("aria-label", "Sub-abas"));
      const n = [];
      let l = "";
      if (e) {
        const o = e.querySelector("button,a") || e;
        ((l += `<button type="button" class="v4-back" data-v4p="${n.push(o) - 1}">${p("left", 18)}<span>${b(W(o).replace(/^‹\s*/, ""))}</span></button>`),
          e.classList.add("v420-proxied"));
      }
      (a.forEach((o, u) => {
        const i = [...o.querySelectorAll("button")];
        ((l += `<div class="v4-tabs ${u === 0 ? "v4-primary" : "v4-secondary"}">${i.map((h) => `<button type="button" class="${h.classList.contains("on") ? "on" : ""}" data-v4p="${n.push(h) - 1}">${b(W(h))}</button>`).join("")}</div>`),
          o.classList.add("v420-proxied"));
      }),
        (r.innerHTML = l),
        (r.__p = n),
        v.getElementById("app").prepend(r),
        // v567: medir depois da pintura (antes forçava o layout da tela inteira no meio da troca de aba).
        requestAnimationFrame(() =>
          r.querySelectorAll(".v4-tabs").forEach((o) => {
            const u = o.querySelector(".on");
            u && (o.scrollLeft = Math.max(0, u.offsetLeft - 24));
          }),
        ));
    }
    function ne() {
      try {
        const t = pHoje(),
          e = pCore(t.hj, t.P),
          a = e.lim,
          r = e.perda,
          n = Et(),
          l = (S.days[V()] || {}).chk || {},
          s = n.filter((M) => l[M.id]).length,
          o = f(() => turnoNv(V()), "g"),
          u = f(() => turnoTxt(V()), ""),
          i = e.mot.length
            ? "r"
            : r >= a * 0.8 || (n.length && s < n.length) || o === "a"
              ? "a"
              : "g",
          h = e.mot.length
            ? e.mot.join(" · ")
            : o === "a" && u
              ? u
              : n.length && s < n.length
                ? `Checklist ${s}/${n.length}`
                : r >= a * 0.8
                  ? "Perto do limite de perda"
                  : "Dentro dos limites";
        return {
          st: i,
          label: { r: "Pare por hoje", a: "Atenção", g: "Pode operar" }[i],
          why: h,
          rest: Math.max(0, a - r),
          lim: a,
          trades: t.hj.length,
          nd: e.nd,
        };
      } catch {
        return null;
      }
    }
    function le() {
      const t = V(),
        e = pt(t),
        a = lt(e, R),
        r = jt(),
        n = pt().filter((c) => nt(c) >= r && nt(c) <= t),
        l = lt(n, R),
        s = yt(),
        o = ne(),
        u = Ft(),
        i = St() ?? o?.lim ?? null,
        h = o ? o.rest : i != null ? Math.max(0, i - Math.max(0, -a)) : null,
        M = {
          pre: "Pré-abertura",
          pregao: "Pregão aberto",
          pos: "Pregão encerrado",
          fechado: "Mercado fechado",
        }[u],
        y = `<div class="v4-kpis">
    <div><small>Capital</small><strong>${s != null ? G(s) : '<button type="button" class="v4-inline" data-dt414-go="painel">Configurar</button>'}</strong></div>
    <div><small>P&amp;L do dia</small><strong class="${L((window.vivoDia?vivoDia(a):a))}" data-v568-base="${a}">${j((window.vivoDia?vivoDia(a):a))}</strong>${window.vivoNota?vivoNota():""}<em class="${L(a)}">${E(a) != null ? "(" + Q(E(a)) + ")" : e.length + " encerrado(s)"}</em></div>
    <div><small>P&amp;L da semana</small><strong class="${L(l)}">${j(l)}</strong><em class="${L(l)}">${E(l) != null ? "(" + Q(E(l)) + ")" : n.length + " trade(s)"}</em></div>
    <div><small>Risco disponível</small><strong>${h != null ? G(h) : "—"}</strong><em>${h != null && E(h) != null ? "(" + _(E(h)) + "% do capital)" : "limite de perda do dia"}</em></div></div>`,
        P = o
          ? `<button type="button" class="v4-gate v4-gate-${o.st}" data-v4tool="hoje" data-v4route="home" data-v4scroll="1">${p(o.st === "g" ? "shield" : "alert", 18)}<b>${o.label}</b><span>${b(o.why)}</span>${p("right", 16)}</button>`
          : "",
        $ = `<div class="v4-phase" role="group" aria-label="Fase do dia">${[
          ["pre", "Pré-mercado"],
          ["pregao", "Pregão"],
          ["pos", "Pós-mercado"],
        ]
          .map(
            ([c, w]) =>
              `<button type="button" data-v4phase="${c}" class="${u === c ? "on" : ""}" ${u === c ? 'aria-current="true"' : ""}><i></i>${w}${u === c && c === "pregao" ? " <small>(aberto)</small>" : ""}</button>`,
          )
          .join("")}</div>`,
        Z = `<div class="v4-tiles">${[
          ["bars", "Mercado", "Ações, índices, moedas e mais", "mercado"],
          [
            "monitor",
            "Terminal",
            "Gráficos, comparativos e indicadores",
            "term",
          ],
          ["book", "Operações", "Trades, histórico e desempenho", "ops"],
          ["grad", "Estudos", "Aulas, trilhas e materiais", "estudos"],
          ["checksq", "Checklist", "Setup, plano e disciplina", "regras"],
        ]
          .map(
            ([c, w, k, it]) =>
              `<button type="button" class="v4-tile" data-dt393-route="${it}">${p(c, 26)}<b>${w}</b><small>${k}</small>${p("arrow", 18)}</button>`,
          )
          .join("")}</div>`,
        H = f(() => {
          const c = AG.v[0];
          return c && Array.isArray(c.eventos)
            ? c.eventos
                .slice()
                .sort((w, k) => String(w.em).localeCompare(String(k.em)))
            : [];
        }, []);
      let z = H.filter(
          (c) =>
            String(c.em).slice(0, 10) === t ||
            f(() => agDia(c.em) === agDia(new Date().toISOString()), !1),
        ).slice(0, 4),
        B = !1;
      z.length ||
        ((z = H.filter(
          (c) =>
            Date.parse(c.em) > Date.now() && (c.imp === 1 || c.imp == null),
        ).slice(0, 4)),
        (B = z.length > 0));
      const Y = (c) => {
          const w = new Date(c);
          return isNaN(w)
            ? ""
            : w.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Sao_Paulo",
              });
        },
        U = (c) => {
          const w = new Date(c);
          return isNaN(w)
            ? ""
            : w.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                timeZone: "America/Sao_Paulo",
              });
        },
        ot = z.length
          ? z
              .map(
                (c) =>
                  `<li><time>${B ? U(c.em) + " " : ""}${Y(c.em)}</time><span>${b(c.t || c.n || "Evento")}${c.p ? ` <small>(${b(c.p)})</small>` : ""}</span><b>${b(c.a ?? c.at ?? c.c ?? "")}</b></li>`,
              )
              .join("")
          : '<li class="v4-none">Sem eventos carregados.</li>';
      let x = f(() => (MKT.items || []).slice(0, 3), []),
        m = null;
      if (x.length)
        try {
          localStorage.setItem(
            "diario-v423-news",
            JSON.stringify({
              ts: f(() => MKT.ts, Date.now()) || Date.now(),
              items: x,
            }),
          );
        } catch {}
      else
        try {
          const c = JSON.parse(
            localStorage.getItem("diario-v423-news") || "null",
          );
          c && Array.isArray(c.items) && ((x = c.items), (m = c.ts));
        } catch {}
      const F = x.length
          ? x
              .map(
                (c) =>
                  `<li><time>${Y(c.d)}</time><span>${b(c.t || c.titulo || "")}</span></li>`,
              )
              .join("") +
            (m
              ? `<li class="v4-none">Última consulta: ${new Date(m).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</li>`
              : "")
          : '<li class="v4-none">Abra Notícias para carregar as manchetes.</li>',
        X = ["IBOV", "USD/BRL", "S&P 500", "DXY", "PETR4"]
          .map((c) => [c, ht(c)])
          .filter(([, c]) => c && c.d1 != null && Math.abs(c.d1) >= 1)
          .slice(0, 3),
        rt = X.length
          ? X.map(
              ([c, w]) =>
                `<li><i class="${w.d1 > 0 ? "dot-g" : "dot-r"}"></i><span><b>${b(c)}</b> ${w.d1 > 0 ? "sobe" : "cai"} ${Q(w.d1)} hoje</span></li>`,
            ).join("")
          : '<li class="v4-none">Sem movimentos fortes nas cotações recebidas.</li>',
        K = C(
          "bars",
          "Panorama do dia",
          st("Ver mais", 'data-dt393-route="mercado"'),
          `<div class="v4-pano">
    <div><h3>${p("cal", 18)} ${B ? "Agenda (próximos)" : "Agenda (hoje)"}</h3><ul class="v4-list">${ot}</ul>${st("Ver agenda", 'data-v4mkt="ag"')}</div>
    <div><h3>${p("news", 18)} Notícias-chave</h3><ul class="v4-list">${F}</ul>${st("Ver notícias", 'data-v4mkt="nt"')}</div>
    <div><h3 class="v4-gold">${p("alert", 18)} Alertas macro</h3><ul class="v4-list v4-alerts">${rt}</ul>${st("Abrir radar", 'data-dt393-route="term"')}</div></div>`,
        ),
        $t = C(
          "spark",
          'Central de Inteligência <span class="v4-iachip">IA</span>',
          st("Ver análises", 'data-v4ia="1"'),
          `<p class="v4-sub">Sugestões com base no mercado, no seu plano e no seu histórico. Sem ordens automáticas.</p><div class="v4-ia"><div class="v4-iaart" aria-hidden="true"><span>${p("bars", 30)}<b>IA</b></span></div><div class="v4-ialist">
    <button type="button" data-dt393-route="term">${p("crosshair", 22)}<span><b>Radar global e oportunidades</b><small>Fluxo, juros, índices e ativos no Terminal.</small></span>${p("right", 16)}</button>
    <button type="button" data-dt393-route="ops">${p("shield", 22)}<span><b>Revisar operações e risco</b><small>Posições abertas, stops e risco consumido.</small></span>${p("right", 16)}</button>
    <button type="button" data-dt393-route="stats">${p("up", 22)}<span><b>Avaliar resultados e consistência</b><small>Curva, win rate e pontos de atenção.</small></span>${p("right", 16)}</button></div></div>`,
          "v4-iacard",
        ),
        d = C(
          "bolt",
          "Atalhos rápidos",
          "",
          `<div class="v4-short">
    <button type="button" data-dt393-route="term">${p("monitor", 24)}<span>Abrir Terminal</span></button>
    <button type="button" data-dt393-action="newtrade">${p("plus", 24)}<span>Registrar trade</span></button>
    <button type="button" data-qkn="1">${p("bolt", 24)}<span>Registro rápido</span></button>
    <button type="button" data-dt393-route="stats">${p("book", 24)}<span>Rever Diário</span></button>
    <button type="button" data-v4mkt="nt">${p("news", 24)}<span>Ver notícias</span></button>
    <button type="button" class="v4-round" data-v4custom="1" aria-label="Personalizar o Início">${p("sliders", 24)}</button></div>`,
          "v4-gold-icon",
        );
      return `<div class="v4-page v4-home">
    ${C("cal", `Resumo do dia<small class="v4-date">${Kt(t)}</small>`, `<button type="button" class="v4-pill" data-dt393-route="mercado">${p("up", 16)} ${M}${p("right", 14)}</button>`, y + P, "v4-summary")}
    ${$}${Z}${K}${$t}${d}</div>`;
    }
    let qt = null;
    /* v589: estado emocional de 1 toque, fase do checklist pelo horário e contagem até a abertura (Supabase: estado_diario). */
    const EMO589 = [
        ["calmo", "Calmo"],
        ["focado", "Focado"],
        ["ansioso", "Ansioso"],
        ["cansado", "Cansado"],
        ["euforico", "Eufórico"],
      ],
      hora589 = () =>
        f(() => {
          const g = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()),
            N = (O) => +(g.find((vt) => vt.type === O) || {}).value || 0;
          return N("hour") * 60 + N("minute");
        }, 12 * 60),
      fase589 = () => {
        const g = hora589();
        return g < 540 ? "pre" : g < 1020 ? "during" : "post";
      },
      dia589 = (g) => f(() => S.days[g] || (S.days[g] = { chk: {} }), {}),
      enviado589 = new Map();
    let fila589 = null;
    function sinc589(g, N = {}) {
      const O = f(() => SESS, null);
      if (!O || !O.uid || f(() => window.DIARIO_DEMO, !1)) return;
      const tt = dia589(g),
        vt = {
          user_id: O.uid,
          dia: g,
          emotional_state: tt.emocao || null,
          emocao_em: tt.emocaoEm || null,
          pre_concluido_em: tt.preOkEm || null,
          meta_diaria: N.meta > 0 ? +(+N.meta).toFixed(2) : null,
          stop_diario: N.stop > 0 ? +(+N.stop).toFixed(2) : null,
        },
        K = JSON.stringify(vt);
      if (enviado589.get(g) === K) return;
      (clearTimeout(fila589),
        (fila589 = setTimeout(() => {
          f(() =>
            rq("/rest/v1/estado_diario?on_conflict=user_id,dia", {
              method: "POST",
              headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
              body: K,
            })
              .then(() => enviado589.set(g, K))
              .catch(() => {}),
          );
        }, 900)));
    }
    function cont589(g) {
      const N = Math.max(0, Math.round((g - Date.now()) / 1e3)),
        O = (tt) => String(tt).padStart(2, "0");
      return O(Math.floor(N / 3600)) + ":" + O(Math.floor((N % 3600) / 60)) + ":" + O(N % 60);
    }
    (f(() =>
      document.addEventListener("click", (g) => {
        const N = g.target.closest?.("[data-v589-emo]");
        if (!N || N.closest(".v503-fantasma")) return;
        const O = N.dataset.v589Dia,
          tt = dia589(O),
          vt = N.dataset.v589Emo;
        (tt.emocao === vt
          ? ((tt.emocao = ""), (tt.emocaoEm = null))
          : ((tt.emocao = vt), (tt.emocaoEm = new Date().toISOString())),
          (tt.u = Date.now()),
          f(() => save()),
          sinc589(O, { meta: f(() => Yt(), null), stop: f(() => St(), null) }),
          f(() => render()));
      }),
    ),
      f(() => {
        const g = () => {
          const N = document.querySelector("#app:not(.v503-fantasma)"),
            O = N && (N.querySelector(".v4-day > .v4-emo") || N.querySelector(":scope > .v4-emo"));
          if (!O) return;
          N.querySelectorAll(":scope > .v4-emo").forEach((vt) => vt !== O && vt.remove());
          const tt = N.querySelector(":scope > .v4-subnav");
          tt ? tt.nextElementSibling !== O && tt.after(O) : N.firstElementChild !== O && N.prepend(O);
        };
        (document.addEventListener("diario:render", () => requestAnimationFrame(() => requestAnimationFrame(g))),
          new MutationObserver(() => {
            const N = document.querySelector("#app:not(.v503-fantasma)");
            N && N.querySelector(".v4-emo") && requestAnimationFrame(g);
          }).observe(document.getElementById("app") || document.body, { childList: !0 }));
      }),
      f(() =>
        setInterval(() => {
          for (const g of document.querySelectorAll("#app:not(.v503-fantasma) [data-v589-abertura]")) {
            const N = +g.dataset.v589Abertura;
            N - Date.now() <= 0 ? f(() => render()) : (g.querySelector("b").textContent = cont589(N));
          }
        }, 1e3),
      ));
    function ie() {
      const t = ft(),
        e = ut(t),
        a = pt(t),
        r = lt(a, R),
        n = yt(),
        l = Yt(),
        s = St(),
        o = Ct(),
        u = ct().filter((g) => String(g.dt || "").slice(0, 10) === t),
        i = e.pl2 || {},
        h = f(
          () =>
            (i.mods || []).map(
              (g) => (PL_MOD.find((N) => N[0] === g) || [g, g])[1],
            ),
          [],
        ),
        M = h.length ? h.join(" + ") : i.vies ? "Viés " + i.vies : "",
        y = C(
          "target",
          "Plano do dia",
          `<div class="v4-datechip"><button type="button" data-a="dprev" aria-label="Dia anterior">${p("left", 16)}</button><label>${p("cal", 16)}<input type="date" data-v4date value="${t}" aria-label="Data do diário"><span>${wt(t)}</span></label><button type="button" data-a="dnext" aria-label="Próximo dia">${p("right", 16)}</button></div>`,
          `<div class="v4-kpis">
    <div><small>Objetivo</small><strong class="${l ? "v-pos" : ""}">${l ? j(l) : '<button type="button" class="v4-inline" data-v4tool="plano" data-v4route="dia" data-v4scroll="1">Definir</button>'}</strong><em>${l && E(l) != null ? "(" + Q(E(l)) + " do capital)" : "meta do dia"}</em></div>
    <div><small>Risco limite</small><strong class="${s ? "v-neg" : ""}">${s ? "-" + G(s) : "—"}</strong><em>${s && E(s) != null ? "(-" + _(E(s)) + "% do capital)" : "perda máxima do dia"}</em></div>
    <div><small>Máx. de trades</small><strong>${o ?? "—"}</strong><em>(realizados: ${u.length})</em></div>
    <div><small>Foco operacional</small>${M ? `<button type="button" class="v4-focus" data-v4tool="plano" data-v4route="dia" data-v4scroll="1">${p("bars", 16)} ${b(M)} ${p("down", 14)}</button>` : '<button type="button" class="v4-inline" data-v4tool="plano" data-v4route="dia" data-v4scroll="1">Escolher</button>'}</div></div>`,
          "v4-plan",
        ),
        P = Et(),
        A = e.chk || {},
        $ = P.filter((g) => A[g.id]).length,
        I = P.length ? Math.round(($ / P.length) * 100) : 0,
        Z = Ft(),
        H = qt || fase589(),
        z = { pre: "Pré-mercado", during: "Durante", post: "Pós-mercado" },
        B = ["pre", "during", "post"]
          .map((g) => {
            const N = P.filter((vt) => at(vt) === g),
              O = N.filter((vt) => A[vt.id]).length,
              tt = N.length && O === N.length;
            return `<button type="button" data-dt393-action="checkphase" data-phase="${g}" class="${g === H ? "active" : ""} ${tt ? "full" : ""}" aria-pressed="${g === H}">${p(tt ? "check" : g === "during" ? "arrow" : "target", 16)} ${z[g]} <small>(${O}/${N.length})</small></button>`;
          })
          .join(""),
        nH = P.filter((g) => at(g) === H),
        fH = nH.filter((g) => A[g.id]).length,
        pH = nH.length ? Math.round((fH / nH.length) * 100) : 0,
        preL = P.filter((g) => at(g) === "pre"),
        preOk = preL.length > 0 && preL.every((g) => A[g.id]),
        hoje589 = t === V(),
        dRaiz = f(() => S.days[t] || {}, {}),
        abre589 = f(() => {
          const g = new Date(t + "T09:00:00-03:00").getTime();
          return hoje589 && !preOk && f(() => pregaoB3(t), !/s[áa]b|dom/i.test(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(new Date()))) && g > Date.now() ? g : 0;
        }, 0),
        hist589 = f(() => {
          if (!dRaiz.emocao) return "";
          const g = Object.keys(S.days || {}).filter((N) => N !== t && (S.days[N] || {}).emocao === dRaiz.emocao),
            N = g.map((O) => pt(O)).filter((O) => O.length).map((O) => lt(O, R));
          if (N.length < 2) return `<p class="v4-emo-hist">Ainda há poucos dias registrados como ${b((EMO589.find(([O]) => O === dRaiz.emocao) || [])[1] || "")} para comparar.</p>`;
          const O = N.reduce((tt, vt) => tt + vt, 0) / N.length,
            tt = N.filter((vt) => vt > 0).length;
          return `<p class="v4-emo-hist">Dias ${b((EMO589.find(([vt]) => vt === dRaiz.emocao) || [])[1] || "")}: resultado médio <b class="${L(O)}">${j(O)}</b> · ${tt} de ${N.length} dias positivos</p>`;
        }, ""),
        emo589 = `<section class="v4-emo" aria-label="Estado emocional agora"><div class="v4-emo-head"><b>Como você está agora?</b>${abre589 ? `<span class="v4-countdown" data-v589-abertura="${abre589}" role="timer" aria-label="Tempo até a abertura do pregão">Abertura em <b>${cont589(abre589)}</b></span>` : ""}</div><div class="v4-emo-row" role="radiogroup" aria-label="Estado emocional">${EMO589.map(([g, N]) => `<button type="button" role="radio" aria-checked="${dRaiz.emocao === g}" class="${dRaiz.emocao === g ? "on" : ""}" data-v589-emo="${g}" data-v589-dia="${t}">${N}</button>`).join("")}</div>${hist589}</section>`,
        Y = P.map(
          (g) =>
            `<div class="dt393-checkitem v4-check" data-rule-phase="${at(g)}" ${at(g) !== H ? "hidden" : ""}><label><input type="checkbox" data-chk="${b(g.id)}" ${A[g.id] ? "checked" : ""}/><span>${b(g.t)}</span></label><select data-dt393-rule-phase="${b(g.id)}" aria-label="Fase da regra"><option value="pre" ${at(g) === "pre" ? "selected" : ""}>Pré</option><option value="during" ${at(g) === "during" ? "selected" : ""}>Durante</option><option value="post" ${at(g) === "post" ? "selected" : ""}>Pós</option></select></div>`,
        ).join(""),
        U = C(
          "list",
          "Checklist operacional",
          `<button type="button" class="v4-progress" data-dt393-route="regras" aria-label="Editar regras"><span><b>${z[H]}</b> · ${fH} de ${nH.length}</span><i><b style="width:${pH}%"></b></i>${p("right", 16)}</button>`,
          `<div class="dt393-phase dt393-phase-inner v4-cphase">${B}</div><div class="dt393-checklist v4-checklist">${Y || '<p class="v4-empty">Cadastre suas regras no Checklist.</p>'}<div class="dt393-phase-empty v4-empty" ${P.some((g) => at(g) === H) ? "hidden" : ""}>Nenhuma regra nesta fase.</div></div>`,
        ),
        ot = f(() => pHoje(), null),
        x = f(() => pCore(ot.hj, ot.P), null),
        risco589 = f(() => {
          const g = s || (x ? x.lim : 0);
          if (!(g > 0)) return "";
          const N = Math.max(0, -(window.vivoDia ? vivoDia(r) : r) || 0) + (hoje589 ? lt(Jt(), Nt) : 0),
            O = Math.round((N / g) * 100),
            tt = O > 80 ? "alto" : O > 50 ? "medio" : "ok";
          return `<div class="v4-risk589 ${tt}">${p("shield", 18)}<span>Risco usado</span><b>${O}% · ${G(N)}</b><i role="progressbar" aria-label="Risco consumido do limite do dia" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(O, 100)}"><em style="width:${Math.min(O, 100)}%"></em></i></div>`;
        }, ""),
        m = C(
          "coins",
          "Capital e metas",
          st("Ajustar", 'data-dt414-go="painel"'),
          `<div class="v4-rows">
    <div>${p("wallet", 18)}<span>Capital operacional</span><b>${n != null ? G(n) : "—"}</b></div>
    <div>${p("target", 18)}<span>Limite de perda (dia)</span><b class="v-neg">${s ? "-" + G(s) : x ? "-" + G(x.lim) : "—"}</b></div>
    <div>${p("trophy", 18)}<span>Meta de ganho (dia)</span><b class="v-pos">${l ? j(l) : "—"}</b></div>${risco589}
    <div>${p("timer", 18)}<span>Resultado do dia</span><b class="${L((window.vivoDia?vivoDia(r):r))}" data-v568-base="${r}">${j((window.vivoDia?vivoDia(r):r))}</b>${window.vivoNota?vivoNota():""}</div></div>`,
        ),
        F = [
          ["IBOV", "IBOV"],
          ["USD/BRL", "Dólar (USD/BRL)"],
          ["DI Jan/27", "Juros (DI Jan/27)"],
          ["S&P 500", "S&P 500"],
        ]
          .map(([g, N]) => {
            const O = ht(g);
            return `<div><span>${N}</span><b>${O ? q(O.px) : "—"}</b><em class="${L(O?.d1)}">${O && O.d1 != null ? Q(O.d1) : ""}</em></div>`;
          })
          .join(""),
        X = C(
          "bars",
          "Cenário atual",
          st("Mercado", 'data-dt393-route="mercado"'),
          `<div class="v4-quotes">${F}</div>${e.mkt != null && e.mkt !== "" ? `<p class="v4-sub">Tipo de mercado: <b>${b(f(() => MK[e.mkt], e.mkt))}</b></p>` : ""}`,
        ),
        rt = f(
          () =>
            [...v.querySelectorAll("#dfases [data-dfase]")].map((N) => [
              N.dataset.dfase,
              (N.textContent || "").replace(/\s+/g, " ").trim(),
            ]),
          [],
        ),
        K = [
          ["pre", "Antes do pregão", "Rotina, estado, limites e plano"],
          ["dur", "Durante o pregão", "Trades, emoções e notas rápidas"],
          ["pos", "Depois do pregão", "Fechamento guiado e debriefing"],
        ],
        $t = f(() => (DFASE && DFASE.d === t ? DFASE.f : "pre"), "pre"),
        d = !!(
          String(e.plano || "").trim() ||
          i.vies ||
          (i.mods || []).length ||
          i.max
        ),
        c = !!(String(e.resumo || "").trim() || e.bem || e.prevn),
        w = [
          d ? "Plano registrado" : "Plano ainda não registrado",
          u.length
            ? `${u.length} trade(s) registrado(s)`
            : "Nenhum trade registrado",
          c ? "Revisão feita" : "Revisão pendente",
        ],
        k = [d, u.length > 0, c].filter(Boolean).length,
        it = C(
          "list",
          "Etapas do dia",
          `<span class="v4-muted">${k} de 3 com registro</span>`,
          `<div class="v4-rbar" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${k}" aria-label="Etapas com registro"><b style="width:${Math.round((k / 3) * 100)}%"></b></div><div class="v4-steps">${K.map(
            ([g, N, O], tt) => {
              const vt = [d, u.length > 0, c][tt];
              return `<button type="button" data-v4tool="${g}" data-v4route="dia" data-v4scroll="1" class="${$t === g ? "on" : ""} ${vt ? "ok" : ""}"><i>${vt ? p("check", 16) : tt + 1}</i><span><b>${N}</b><small>${O}</small><em>${w[tt]}</em></span>${p("right", 16)}</button>`;
            },
          ).join("")}</div>`,
        ),
        dt = C(
          "pencil",
          "Observações rápidas",
          "",
          `<textarea class="v4-notes" data-d="plano" maxlength="2000" placeholder="Cenário, níveis, o que vou operar…" aria-label="Plano e observações do dia">${b(e.plano || "")}</textarea><small class="v4-count">${String(e.plano || "").length}/2000 · salvo no Plano do dia</small>`,
        );
      (hoje589 &&
        preOk &&
        !dRaiz.preOkEm &&
        queueMicrotask(() => {
          const g = dia589(t);
          g.preOkEm || ((g.preOkEm = new Date().toISOString()), (g.u = Date.now()), f(() => save()));
        }),
        queueMicrotask(() => sinc589(t, { meta: l, stop: s })));
      /* v593: dia de turno (escala cadastrada) aparece no topo do Meu dia. */
      const turno593 = f(() => {
        const c = tcod(t);
        return c && c !== "F" && turnoNv(t) === "r"
          ? `<p class="v4-turno" role="status"><b>Dia de turno</b> <span>${b(TH[c] || "")}</span> · plano: não operar</p>`
          : "";
      }, "");
      return `<div class="v4-page v4-day">${turno593}${emo589}${y}${U}<div class="v4-two">${m}${X}</div><div class="v4-two">${it}${dt}</div></div>`;
    }
    let At = "risk",
      bt = { k: "dt", d: 1 };
    function de() {
      const t = V(),
        e = Jt(),
        a = pt(t),
        r = lt(a, R),
        n = yt(),
        l = e.filter((d) => d.side === "C").length,
        s = e.length - l,
        o = lt(e, Nt),
        u = E(o),
        i = St(),
        h = E(i),
        M = [
          ...new Set(
            e
              .concat(a)
              .map((d) => d.setup)
              .filter(Boolean),
          ),
        ],
        y = (d, c, w, k, it = "", extra = "") =>
          `<div class="v4-stat">${p(d, 24)}<span>${c}</span><strong class="${it}">${w}</strong><small>${k}</small>${extra}</div>`,
        /* v595: barra fina do risco consumido em relação ao limite (CLAUDE.md: verde ≤ 50%, âmbar 51–80%, vermelho > 80%). */
        barra595 =
          u != null && h != null && h > 0
            ? (() => {
                const pct = Math.max(0, Math.min(100, (u / h) * 100)),
                  cls = pct > 80 ? "alto" : pct > 50 ? "medio" : "ok";
                return `<i class="v595-riscobar ${cls}" role="progressbar" aria-label="Risco consumido do limite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><em style="width:${pct.toFixed(1)}%"></em></i>`;
              })()
            : "",
        P = `<div class="v4-stats">
    ${y("folder", "Operações abertas", String(e.length), `(${l} compradas / ${s} vendidas)`)}
    ${y("bars", "Resultado do dia", j(r), E(r) != null ? Q(E(r)) : a.length + " encerrada(s)", L(r))}
    ${y("shield", "Risco consumido", u != null ? _(u) + "%" : G(o), h != null ? `(limite: ${_(h)}%)` : "pelos stops abertos", "", barra595)}
    ${y("crosshair", "Setups ativos", String(M.length), M.length ? "(" + b(M.slice(0, 3).join(", ")) + ")" : "nenhum hoje")}</div>`,
        A = e
          .map((d) => {
            const c = Wt(d.ativo),
              w = +d.entry,
              k = d.side === "C" ? 1 : -1,
              it = f(() => +d.qty * (+d.pv || 1), 0),
              dt = c != null && Number.isFinite(w) ? (c - w) * k * it : null,
              g = Nt(d),
              N = dt != null && g > 0 ? dt / g : null,
              O =
                c != null && Number.isFinite(w)
                  ? ((c - w) / w) * 100 * k
                  : null,
              tt =
                c != null &&
                d.target &&
                ((k > 0 && c >= +d.target) || (k < 0 && c <= +d.target))
                  ? ["Alvo atingido", "gold"]
                  : c != null &&
                      d.stop &&
                      ((k > 0 && c <= +d.stop) || (k < 0 && c >= +d.stop))
                    ? ["No stop", "red"]
                    : ["Em andamento", ""];
            return `<tr data-a="edit" data-id="${b(d.id)}" class="${k > 0 ? "b-buy" : "b-sell"}"><td><b>${b(d.ativo || "—")}</b><small>${b(d.setup || "")}</small></td><td><span class="v4-side ${k > 0 ? "buy" : "sell"}">${k > 0 ? "Compra" : "Venda"}</span></td><td>${q(d.entry)}</td><td>${c != null ? q(c) : "—"}</td>
     <td class="${L(dt)}">${At === "risk" ? (N != null ? _(N) + "×" : "—") : dt != null ? j(dt) : "—"}<small>${O != null ? Q(O) : ""}</small></td><td><small>S: ${d.stop != null && d.stop !== "" ? q(d.stop) : "—"}</small><small>A: ${d.target != null && d.target !== "" ? q(d.target) : "—"}</small></td><td><span class="v4-status ${tt[1]}">${tt[0]}</span></td></tr>`;
          })
          .join(""),
        $ = C(
          "layers",
          "Posições monitoradas",
          `<div class="v4-seg"><button type="button" data-v4opsview="risk" class="${At === "risk" ? "on" : ""}">% Risco</button><button type="button" data-v4opsview="rs" class="${At === "rs" ? "on" : ""}">R$ Resultado</button></div>`,
          e.length
            ? `<div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Ativo</th><th>Lado</th><th>Entrada</th><th>Atual</th><th>Resultado</th><th>Stop / Alvo</th><th>Status</th></tr></thead><tbody>${A}</tbody></table></div><p class="v4-foot">"Atual" usa somente cotações já recebidas pelo app. Toque numa linha para abrir o trade.</p>`
            : gt("Nenhuma operação aberta registrada."),
        ),
        I = bt.k,
        Z = bt.d,
        H =
          {
            ativo: (d) => d.ativo || "",
            setup: (d) => d.setup || "",
            entry: (d) => +d.entry,
            exit: (d) => +d.exit,
            pl: R,
            r: T,
            dt: (d) => d.dtx || d.dt,
          }[I] || ((d) => d.dt),
        z = a.slice().sort((d, c) => {
          const w = H(d),
            k = H(c);
          return (w > k ? 1 : w < k ? -1 : 0) * Z;
        }),
        B = (d, c) =>
          `<th><button type="button" data-v4sort="${d}" class="${I === d ? "on" : ""}">${c} ${I === d ? (Z > 0 ? "▲" : "▼") : "⇅"}</button></th>`,
        Y = C(
          "trade",
          "Trades do dia",
          `<span class="v4-muted">${a.length} trade(s)</span>`,
          a.length
            ? `<div class="v4-tablewrap"><table class="v4-table"><thead><tr>${B("ativo", "Ativo")}${B("setup", "Setup")}${B("entry", "Entrada")}${B("exit", "Saída")}${B("pl", "Resultado")}${B("r", "× risco")}<th></th></tr></thead><tbody>${z.map((d) => `<tr class="${R(d) >= 0 ? "b-buy" : "b-sell"}"><td><b>${b(d.ativo || "—")}</b></td><td>${b(d.setup || "—")}</td><td>${q(d.entry)}</td><td>${q(d.exit)}</td><td class="${L(R(d))}">${j(R(d))}</td><td class="${L(T(d))}">${T(d) != null ? (T(d) > 0 ? "+" : "") + _(T(d)) + "×" : "—"}</td><td><button type="button" class="v4-icon" data-a="edit" data-id="${b(d.id)}" aria-label="Abrir trade">${p("doc", 18)}</button></td></tr>`).join("")}</tbody></table></div>`
            : gt("Nenhum trade encerrado hoje."),
        ),
        U = a
          .concat(e)
          .sort((d, c) =>
            String(c.dtx || c.dt).localeCompare(String(d.dtx || d.dt)),
          )[0],
        ot = C(
          "pencil",
          "Revisão rápida",
          "",
          `<p class="v4-sub">Registre os pontos principais desta sessão.</p><div class="v4-actions">
    ${U ? `<button type="button" data-a="edit" data-id="${b(U.id)}">${p("image", 20)} Adicionar print ao último trade</button>` : `<button type="button" data-dt393-action="newtrade">${p("image", 20)} Registrar trade com print</button>`}
    <button type="button" data-qkn="1">${p("bolt", 20)} Registro rápido</button>
    ${U ? `<button type="button" data-a="edit" data-id="${b(U.id)}">${p("warn", 20)} Marcar erro emocional</button>` : ""}
    <button type="button" class="v4-primarybtn" data-v4deb="1">${p("book", 20)} Registrar aprendizado no diário</button></div>`,
        ),
        x = [],
        m = a.filter((d) => T(d) != null).sort((d, c) => T(c) - T(d))[0];
      m &&
        T(m) > 0 &&
        x.push(
          `Melhor execução: ${b(m.ativo)}${m.setup ? " (" + b(m.setup) + ")" : ""} com ${_(T(m))} R.`,
        );
      const F = e.filter((d) => d.stop == null || d.stop === "");
      F.length &&
        x.push(`${F.length} posição(ões) aberta(s) sem stop cadastrado.`);
      const X = Ct(),
        rt = ct().filter((d) => String(d.dt || "").slice(0, 10) === t).length;
      (X &&
        rt >= X &&
        x.push(`Você já fez ${rt} de ${X} trades permitidos hoje.`),
        a.length >= 2 &&
          r > 0 &&
          x.push(
            `Dia positivo em ${a.length} trades (${j(r)}). Considere encerrar a sessão no lucro.`,
          ));
      const K = a.filter((d) => R(d) < 0 && T(d) != null && T(d) < -1.05);
      K.length &&
        x.push(`${K.length} perda(s) acima de 1 R: o stop foi respeitado?`);
      const $t = C(
        "spark",
        "Sugestões",
        '<span class="v4-ctx">Contexto: suas operações</span>',
        `<p class="v4-sub">Calculadas a partir dos seus trades de hoje.</p><ul class="v4-tips">${x.length ? x.map((d) => `<li>${p("check", 18)}<span>${d}</span></li>`).join("") : '<li class="v4-none">Registre trades para receber sugestões.</li>'}</ul>${st("Perguntar à IA", 'data-v4ia="1"')}`,
      );
      return `<div class="v4-page v4-ops">${P}${$}${Y}<div class="v4-two">${ot}${$t}</div></div>`;
    }
    let mt = "3M",
      kt = !1;
    function ce() {
      const t = pt().sort((s, o) => nt(s).localeCompare(nt(o))),
        e = V(),
        a = { "1M": 30, "3M": 91, "6M": 182, "1A": 365 }[mt];
      let r =
        mt === "YTD"
          ? e.slice(0, 4) + "-01-01"
          : mt === "Máx"
            ? "0000"
            : a
              ? f(() => diasMais(e, -a), "0000")
              : "0000";
      const n = {};
      t.forEach((s) => {
        const o = nt(s);
        o >= r && (n[o] = (n[o] || 0) + (R(s) || 0));
      });
      let l = 0;
      return Object.keys(n)
        .sort()
        .map((s) => ({ d: s, v: n[s], acc: (l += n[s]) }));
    }
    function pe() {
      const t = ce();
      if (t.length < 2)
        return '<div class="v4-chartempty">Registre trades encerrados em pelo menos dois dias deste período para ver a curva.</div>';
      if (kt)
        return `<div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Dia</th><th>Resultado</th><th>Acumulado</th></tr></thead><tbody>${t
          .slice()
          .reverse()
          .map(
            ($) =>
              `<tr><td>${wt($.d)}</td><td class="${L($.v)}">${j($.v)}</td><td class="${L($.acc)}">${j($.acc)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`;
      const e = 600,
        a = 230,
        r = [10, 58, 24, 8],
        n = t.map(($) => $.acc),
        l = Math.min(0, ...n),
        s = Math.max(0, ...n),
        o = Math.max(1, s - l),
        u = ($) => r[3] + ($ / (t.length - 1)) * (e - r[1] - r[3]),
        i = ($) => r[0] + (1 - ($ - l) / o) * (a - r[0] - r[2]),
        h = t
          .map(($, I) => `${u(I).toFixed(1)},${i($.acc).toFixed(1)}`)
          .join(" "),
        M = `${u(0).toFixed(1)},${i(l).toFixed(1)} ${h} ${u(t.length - 1).toFixed(1)},${i(l).toFixed(1)}`,
        y = [0, 0.25, 0.5, 0.75, 1].map(($) => l + $ * o),
        P = [0, Math.floor((t.length - 1) / 2), t.length - 1]
          .map(
            ($) =>
              `<text x="${u($).toFixed(1)}" y="${a - 6}" text-anchor="${$ === 0 ? "start" : $ === t.length - 1 ? "end" : "middle"}">${wt(t[$].d).slice(0, 5)}</text>`,
          )
          .join(""),
        A = t[t.length - 1].acc;
      return `<div class="v4-legend"><span><i class="w"></i>Diário de Trader (resultado acumulado)</span><b class="${L(A)}">${j(A)}</b></div>
  <svg class="v4-chart" viewBox="0 0 ${e} ${a}" preserveAspectRatio="none" role="img" aria-label="Resultado acumulado no período ${mt}: ${j(A)}">
   ${y.map(($) => `<path class="grid" d="M${r[3]} ${i($).toFixed(1)}H${e - r[1]}"/><text class="yl" x="${e - r[1] + 6}" y="${(i($) + 4).toFixed(1)}">${Math.round($).toLocaleString("pt-BR")}</text>`).join("")}
   <path class="zero" d="M${r[3]} ${i(0).toFixed(1)}H${e - r[1]}"/>
   <polygon class="area" points="${M}"/><polyline class="line" points="${h}"/>${P}</svg>`;
    }
    function ue() {
      const t = ft(),
        e = pt(t),
        a = lt(e, R),
        r = e.filter((m) => R(m) > 0).length,
        n = e.length ? (r / e.length) * 100 : null,
        l = ct().filter((m) => String(m.dt || "").slice(0, 10) === t).length,
        s = Ct(),
        o = lt(
          e.filter((m) => R(m) < 0),
          (m) => -R(m),
        ),
        u = St(),
        i = `<div class="v4-kpis">
    <div><small>Resultado do dia</small><strong class="${L(a)}">${j(a)}</strong><em class="${L(a)}">${E(a) != null ? Q(E(a)) : ""}</em></div>
    <div><small>Win rate</small><strong>${n == null ? "—" : _(n, 1) + "%"}</strong><em>${r} de ${e.length} trades</em></div>
    <div><small>Risco usado</small><strong>${E(o) != null ? _(E(o)) + "%" : G(o)}</strong><em>${u ? "(limite: " + (E(u) != null ? _(E(u)) + "%" : G(u)) + ")" : "perdas do dia"}</em></div>
    <div><small>Nº de trades</small><strong>${l}</strong><em>${s ? "(planejado: até " + s + ")" : ""}</em></div></div>`,
        h = C(
          "book",
          "Resumo do dia",
          `<div class="v4-datechip"><button type="button" data-a="dprev" aria-label="Dia anterior">${p("left", 16)}</button><label>${p("cal", 16)}<input type="date" data-v4date value="${t}" aria-label="Data"><span>${wt(t)}</span></label><button type="button" data-a="dnext" aria-label="Próximo dia">${p("right", 16)}</button></div>`,
          i,
        ),
        M = ["1M", "3M", "6M", "YTD", "1A", "Máx"],
        y = C(
          "up",
          "Performance",
          `<button type="button" class="v4-icon" data-dt393-route="dash" aria-label="Análise completa">${p("expand", 18)}</button>`,
          `<div class="v4-chartbar"><div class="v4-seg">${M.map((m) => `<button type="button" data-v4per="${m}" class="${m === mt ? "on" : ""}">${m}</button>`).join("")}</div><button type="button" class="v4-chip ${kt ? "on" : ""}" data-v4table="1">Tabela</button></div>${pe()}<p class="v4-foot">Curva do seu diário. A comparação com o IBOV só aparece quando houver série histórica verificada.</p>`,
          "v4-perf",
        ),
        P = Et(),
        A = ut(t).chk || {},
        $ = ["pre", "during", "post"]
          .map((m) => {
            const F = P.filter((K) => at(K) === m),
              X = F.filter((K) => A[K.id]).length,
              rt = F.length && X === F.length;
            return `<span class="v4-chip ${rt ? "on" : ""}">${p(rt ? "check" : "target", 14)} ${{ pre: "Pré-mercado", during: "Durante", post: "Pós-mercado" }[m]} <small>${X}/${F.length}</small></span>`;
          })
          .join(""),
        I = ut(t),
        Z = C(
          "list",
          "Checklist e cenário",
          `<button type="button" class="v4-icon" data-dt393-route="dia" aria-label="Abrir Meu dia">${p("right", 18)}</button>`,
          `<div class="v4-split"><div class="v4-chips">${$}</div><div><h3>${p("doc", 16)} Plano do dia (resumo)</h3><p class="v4-text">${I.plano ? b(String(I.plano).slice(0, 280)) : "Plano não preenchido para esta data."}</p></div></div>`,
        ),
        H = C(
          "trade",
          "Operações do dia",
          "",
          e.length
            ? `<div class="v4-oplist">${e.map((m) => `<details><summary class="${R(m) >= 0 ? "b-buy" : "b-sell"}"><b>${b(m.ativo || "—")}</b><span>${b(m.setup || "—")}</span><em class="${L(R(m))}">${j(R(m))}</em><em class="${L(T(m))}">${T(m) != null ? (T(m) > 0 ? "+" : "") + _(T(m)) + "×" : "—"}</em>${p("down", 16)}</summary><div class="v4-opdet"><span>Lado <b>${m.side === "C" ? "Compra" : "Venda"}</b></span><span>Entrada <b>${q(m.entry)}</b></span><span>Saída <b>${q(m.exit)}</b></span><span>Stop <b>${q(m.stop)}</b></span><span>Alvo <b>${q(m.target)}</b></span><span>Qtd. <b>${b(m.qty ?? "—")}</b></span>${m.err && m.err !== "Nenhum" ? `<span class="v-neg">Erro <b>${b(m.err)}</b></span>` : ""}<button type="button" data-a="edit" data-id="${b(m.id)}">Abrir trade</button></div></details>`).join("")}</div>`
            : gt("Ainda não há trades encerrados neste dia."),
        ),
        z = [I.resumo, I.bem, I.prevn].filter(Boolean),
        B = jt(),
        Y = {};
      ct().forEach((m) => {
        nt(m) >= B &&
          m.err &&
          m.err !== "Nenhum" &&
          (Y[m.err] = (Y[m.err] || 0) + 1);
      });
      const U = Object.entries(Y)
        .sort((m, F) => F[1] - m[1])
        .map(([m, F]) => `<li>${b(m)} <small>(${F}x na semana)</small></li>`);
      I.cond && U.push(`<li>${b(String(I.cond).slice(0, 160))}</li>`);
      const ot = C(
          "pencil",
          "Anotações e lições",
          "",
          z.length
            ? `<ul class="v4-bul">${z.map((m) => `<li>${b(String(m).slice(0, 200))}</li>`).join("")}</ul>`
            : gt("Escreva o debriefing do dia para ver suas lições aqui."),
        ),
        x = C(
          "crosshair",
          "Pontos de atenção",
          "",
          U.length
            ? `<ul class="v4-bar">${U.join("")}</ul>`
            : gt("Nenhum erro marcado nesta semana."),
        );
      return `<div class="v4-page v4-journal">${h}${y}${Z}${H}<div class="v4-two">${ot}${x}</div><button type="button" class="v4-cta" data-v4deb="1">${p("book", 22)} Registrar revisão</button></div>`;
    }
    const me = [
        ["home", "Início", "home"],
        ["dia", "Meu dia", "cal"],
        ["ops", "Operações", "trade"],
        ["mercado", "Mercado", "bars"],
        ["estudos", "Estudos", "grad"],
      ],
      Vt = {
        home: "home",
        dia: "dia",
        regras: "dia",
        ops: "ops",
        trades: "ops",
        swing: "ops",
        opc: "ops",
        ativos: "ops",
        fx: "ops",
        opgrade: "ops",
        opfluxo: "ops",
        opcart: "ops",
        swbt: "ops",
        dtrpy: "ops",
        mercado: "mercado",
        juros: "mercado",
        live: "mercado",
        graf: "mercado",
        estudos: "estudos",
        livro: "estudos",
      };
    function ve() {
      let t = v.getElementById("v4-bnav");
      t ||
        ((t = v.createElement("nav")),
        (t.id = "v4-bnav"),
        t.setAttribute("aria-label", "Navegação principal"),
        v.body.appendChild(t));
      const e = Vt[et()] || "";
      t.innerHTML = me
        .map(
          ([a, r, n]) =>
            `<button type="button" data-dt393-route="${a}" class="${e === a ? "on" : ""}" ${e === a ? 'aria-current="page"' : ""}>${p(n, 24)}<span>${r}</span></button>`,
        )
        .join("");
    }
    function Ht() {
      (v.body.classList.remove("v4-own-ticker"),
        v.querySelectorAll(".v4-ticker").forEach((l) => l.remove()));
    }
    const he = [
        [
          "Principal",
          [
            ["r", "home", "Início", "home"],
            ["r", "dia", "Meu dia", "cal"],
            ["r", "ops", "Operações", "trade"],
            ["r", "stats", "Diário", "book"],
            ["r", "mercado", "Mercado", "bars"],
            ["r", "estudos", "Estudos", "grad"],
          ],
        ],
        [
          "Rotina e disciplina",
          [
            ["h", "hoje", "Posso operar?", "shield"],
            ["r", "regras", "Checklist e regras", "checksq"],
            ["h", "escala", "Escala de turno", "cal"],
            ["h", "cal", "Calendário", "cal"],
            ["r", "rev", "Revisão da semana", "list"],
            ["q", "1", "Registro rápido de trade", "bolt"],
          ],
        ],
        [
          "Mercado ao vivo",
          [
            ["r", "term", "Terminal", "monitor"],
            ["r", "graf", "Gráficos TradingView", "up"],
            ["r", "juros", "Juros e DI", "coins"],
          ],
        ],
        [
          "Patrimônio e risco",
          [
            ["r", "carteiras", "Carteira", "wallet"],
            ["h", "pat", "Patrimônio", "up"],
            ["g", "painel", "Capital, risco e backup", "shield"],
            ["g", "contratos", "Calculadora de contratos", "list"],
            ["g", "imposto", "Imposto de renda", "doc"],
          ],
        ],
        [
          "Estudos e evolução",
          [
            ["h", "ingles", "Inglês do dia", "grad"],
            ["g", "carreira", "Plano de transição", "arrow"],
          ],
        ],
        [
          "Conta e sistema",
          [
            ["g", "conta", "Conta e sincronização", "folder"],
            ["g", "import", "Importar do Profit", "layers"],
            ["g", "status", "Status do sistema", "alert"],
            ["g", "mais", "Configurações", "sliders"],
            ["g", "termos", "Termos de uso", "doc"],
          ],
        ],
      ],
      ge = [
        "trades",
        "swing",
        "opc",
        "ativos",
        "fx",
        "dtrpy",
        "swbt",
        "live",
        "mesa",
      ],
      zt = [
        [
          ["r", "home", "Início", "home"],
          [
            ["h", "hoje", "Posso operar?"],
            ["h", "escala", "Escala de turno"],
            ["h", "cal", "Calendário"],
            ["h", "pat", "Patrimônio"],
            ["h", "ingles", "Inglês do dia"],
          ],
        ],
        [
          ["r", "dia", "Meu dia", "cal"],
          [
            ["r", "regras", "Checklist e regras"],
            ["q", "1", "Registro rápido"],
          ],
        ],
        [
          ["r", "ops", "Operações", "trade"],
          [["r", "import", "Importar do Profit"]],
        ],
        [
          ["r", "stats", "Diário", "book"],
          [
            ["r", "rev", "Revisão da semana"],
            ["g", "carreira", "Plano de transição"],
          ],
        ],
        [
          ["r", "mercado", "Mercado", "bars"],
          [
            ["r", "graf", "Gráficos"],
            ["r", "juros", "Juros e DI"],
            ["x", "ls", "Long & Short"],
          ],
        ],
        [["r", "term", "Terminal", "monitor"], []],
        [
          ["r", "estudos", "Estudos", "grad"],
          [["x", "ar", "Alta Renda e Investimentos"]],
        ],
        [
          ["r", "carteiras", "Carteira", "wallet"],
          [],
        ],
        [["r", "imposto", "Imposto de renda", "doc"], []],
        [
          ["g", "mais", "Configurações", "sliders"],
          [
            ["r", "mercado:al", "Alertas"],
            ["g", "conta", "Conta"],
            ["g", "status", "Status"],
            ["g", "termos", "Termos"],
          ],
        ],
      ];
    function Lt() {
      const t = v.querySelector("#dt394-drawer .dt394-nav-list");
      if (!t || t.dataset.v420) return;
      t.querySelectorAll(
        ge
          .map((s) => `[data-dt393-route="${s}"],[data-dt414-go="${s}"]`)
          .join(","),
      ).forEach((s) => {
        s.dataset.v420used = "1";
      });
      const e = (s) => s?.dataset?.dt394Filter || "",
        a = (s, o) => {
          if (s === "h") return null;
          const u =
            s === "q"
              ? "[data-qkn]"
              : s === "g"
                ? `[data-dt414-go="${o}"],[data-dt393-route="${o}"]`
                : `[data-dt393-route="${o}"],[data-dt414-go="${o}"]`;
          return [...t.querySelectorAll(u)].find((i) => !i.dataset.v420used);
        },
        r = v.createDocumentFragment(),
        n = ([s, o, u, i], h) => {
          const M = s === "x" ? null : a(s, o),
            y = v.createElement("button");
          return (
            (y.type = "button"),
            s === "x"
              ? (y.dataset.v512 = o)
              : s === "q"
                ? (y.dataset.qkn = "1")
                : s === "g"
                  ? (y.dataset.dt414Go = o)
                  : s === "h"
                    ? ((y.dataset.dt393Route = "home"), (y.dataset.v4home = o))
                    : (y.dataset.dt393Route = o),
            (y.dataset.dt394Filter = (u + " " + e(M)).toLowerCase()),
            M &&
              ((M.dataset.v420used = "1"),
              M.classList.contains("active") && y.classList.add("active")),
            (y.className = h),
            (y.innerHTML = i
              ? `${p(i, 20)}<span>${u}</span>${p("right", 17)}`
              : `<span>${u}</span>`),
            y
          );
        };
      zt
        ? zt.forEach(([s, o]) => {
            const u = v.createElement("div");
            if (
              ((u.className = "v420-menu-sec v512-grp"),
              u.appendChild(n(s, "v512-main")),
              o.length)
            ) {
              const i = v.createElement("div");
              ((i.className = "v512-chips"),
                o.forEach((h) => i.appendChild(n(h, "v512-chip"))),
                u.appendChild(i));
            }
            r.appendChild(u);
          })
        : he.forEach(([s, o]) => {
            const u = v.createElement("div");
            ((u.className = "v420-menu-sec"),
              (u.innerHTML = `<h3>${s}</h3>`),
              o.forEach(([i, h, M, y]) => {
                const P = a(i, h),
                  A = v.createElement("button");
                ((A.type = "button"),
                  i === "q"
                    ? (A.dataset.qkn = "1")
                    : i === "g"
                      ? (A.dataset.dt414Go = h)
                      : i === "h"
                        ? ((A.dataset.dt393Route = "home"),
                          (A.dataset.v4home = h))
                        : (A.dataset.dt393Route = h),
                  (A.dataset.dt394Filter = (M + " " + e(P)).toLowerCase()),
                  P &&
                    ((P.dataset.v420used = "1"),
                    P.classList.contains("active") &&
                      A.classList.add("active")),
                  (A.innerHTML = `${p(y, 20)}<span>${M}</span>${p("right", 17)}`),
                  u.appendChild(A));
              }),
              r.appendChild(u));
          });
      const l = [...t.querySelectorAll("button")].filter(
        (s) => !s.dataset.v420used && !s.closest(".v420-menu-sec"),
      );
      if (l.length) {
        const s = v.createElement("div");
        ((s.className = "v420-menu-sec"),
          (s.innerHTML = "<h3>Outros</h3>"),
          l.forEach((o) => s.appendChild(o)),
          r.appendChild(s));
      }
      (["dt414-drawer-access", "v419-drawer"].forEach((s) => {
        const o = v.getElementById(s);
        o && ((o.innerHTML = ""), (o.hidden = !0), r.appendChild(o));
      }),
        (t.innerHTML = ""),
        t.appendChild(r),
        (t.dataset.v420 = "1"),
        Rt());
    }
    try {
      const t = v.createElement("style");
      ((t.textContent =
        "#dt394-drawer .v512-grp{margin:0 0 8px!important;padding:0!important}#dt394-drawer .v512-grp h3{display:none}#dt394-drawer .v512-chips{display:none;flex-wrap:wrap;gap:8px;margin:8px 0 4px 4px}#dt394-drawer.v512-busca .v512-chips{display:flex}#dt394-drawer .v512-chips button.v512-chip{width:auto!important;min-height:40px!important;padding:8px 12px!important;border-radius:999px!important;font-size:13px!important;display:inline-flex!important;align-items:center;gap:0!important;margin:0!important}#dt394-drawer .v512-chip svg{display:none}#dt394-drawer .v512-chip.active,#dt394-drawer .v512-chip[aria-current]{outline:1px solid #b58b3d}"),
        v.head.appendChild(t));
    } catch {}
    function Rt() {
      const t = Vt[et()] || et();
      v.querySelectorAll("#dt394-drawer .v420-menu-sec button").forEach((e) => {
        const a = e.dataset.dt393Route || e.dataset.dt414Go,
          r = e.dataset.v4home,
          n = r
            ? et() === "home" && J === r
            : a === "home" && J
              ? !1
              : a === et() ||
                (a === t &&
                  !v.querySelector(
                    `#dt394-drawer [data-dt393-route="${et()}"],#dt394-drawer [data-dt414-go="${et()}"]`,
                  ));
        (e.classList.toggle("active", !!n),
          n
            ? e.setAttribute("aria-current", "page")
            : e.removeAttribute("aria-current"));
      });
    }
    v.addEventListener("input", (t) => {
      t.target.id === "dt394-nav-search" &&
        (v
          .getElementById("dt394-drawer")
          ?.classList.toggle("v512-busca", !!t.target.value.trim()),
        setTimeout(() => {
          v.querySelectorAll("#dt394-drawer .v420-menu-sec").forEach((e) => {
            const a = [...e.querySelectorAll("button")].some(
              (r) => !r.hidden && getComputedStyle(r).display !== "none",
            );
            e.classList.toggle("v420-empty", !a);
          });
        }, 0));
    });
    const be = { home: le, dia: ie, ops: de, stats: ue };
    function xt() {
      const t = et(),
        e = v.getElementById("app");
      if (!e) return;
      (v.body.classList.toggle("v4-on", !0),
        t !== "home" && J && (J = null),
        v.body.classList.toggle("v4-homeview", t === "home" && !!J),
        (v.body.dataset.v4route = t),
        ve(),
        Ht());
      try {
        (Lt(), Rt());
      } catch {}
      const a = e.querySelector("#dt393-workspace .dt393-native");
      oe.includes(t) ? re(a) : v.getElementById("v4-subnav")?.remove();
      const r = be[t];
      if (!r || (t === "dia" && f(() => DV === "hist", !1))) return;
      let n;
      try {
        n = r();
      } catch (o) {
        console.warn("v420 " + t, o);
        return;
      }
      e.querySelectorAll(".v4-panel").forEach((o, u) => {
        u > 0 && o.remove();
      });
      let l = e.querySelector(".v4-panel");
      const s = e.querySelector(".dt393-page");
      if (
        (!l && s && s.parentElement !== e && (l = s.parentElement),
        !l || l === e)
      ) {
        l = v.createElement("div");
        const o = e.querySelector("#dt393-workspace");
        o ? o.before(l) : e.appendChild(l);
      }
      (s && !l.contains(s) && s.remove(),
        (l.className = "v4-panel"),
        (l.innerHTML = n),
        v.getElementById("v419-mais")?.remove(),
        e.querySelector("#dt393-workspace")?.classList.remove("v419-recolhido"),
        ee(t, a));
    }
    function Ut() {
      if (typeof window.render0 != "function" || window.render0.__v420)
        return !1;
      const t = window.render0,
        e = function () {
          const a = t.apply(this, arguments);
          try {
            xt();
          } catch (r) {
            console.warn("v420", r);
          }
          return a;
        };
      return ((e.__v420 = 1), (window.render0 = e), !0);
    }
    (v.addEventListener(
      "click",
      (t) => {
        const e = t.target.closest("[data-v4p]");
        if (e) {
          const h = e.closest("#v4-subnav")?.__p?.[+e.dataset.v4p];
          h && (t.preventDefault(), h.click());
          return;
        }
        const a = t.target.closest("[data-v4tool]");
        if (a && a.dataset.v4route === "home") {
          (t.preventDefault(), Pt(a.dataset.v4tool));
          return;
        }
        if (a) {
          (t.preventDefault(),
            Ot(a.dataset.v4route, a.dataset.v4tool, null, !0),
            a.dataset.v4scroll &&
              v
                .querySelector(".v4-tools-head")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }));
          return;
        }
        const r = t.target.closest("[data-v4phase]");
        if (r) {
          t.preventDefault();
          const i = r.dataset.v4phase;
          try {
            if (i === "pos" && typeof GOR < "u" && GOR.deb) {
              (GOR.deb(), scrollTo(0, 0));
              return;
            }
          } catch {}
          try {
            ((D = V()),
              (DFASE = { d: V(), f: i === "pre" ? "pre" : "dur" }),
              (Mt.dia = i === "pre" ? "pre" : "dur"),
              irPara("dia"),
              scrollTo(0, 0));
          } catch {}
          return;
        }
        const n = t.target.closest("[data-v4mkt]");
        if (n) {
          t.preventDefault();
          const i = n.dataset.v4mkt;
          try {
            (window.DIARIO_NAV?.navigate
              ? window.DIARIO_NAV.navigate("mercado:" + i)
              : (irPara("mercado:" + i)),
              scrollTo(0, 0));
          } catch {}
          return;
        }
        if (t.target.closest("[data-v4ia]")) {
          (t.preventDefault(), v.querySelector(".wf-chat-launcher")?.click());
          return;
        }
        if (t.target.closest("[data-v4custom]")) {
          t.preventDefault();
          const i = [
            ...v.querySelectorAll(
              "#app .studio-intro button, #app .studio-tool",
            ),
          ].find((h) => /Personalizar/i.test(h.textContent));
          i && i.click();
          return;
        }
        if (t.target.closest("[data-v4deb]")) {
          t.preventDefault();
          try {
            (GOR.deb(), scrollTo(0, 0));
          } catch {
            try {
              (irPara("dia"));
            } catch {}
          }
          return;
        }
        const l = t.target.closest("[data-v4opsview]");
        if (l) {
          (t.preventDefault(), (At = l.dataset.v4opsview), render());
          return;
        }
        const s = t.target.closest("[data-v4sort]");
        if (s) {
          t.preventDefault();
          const i = s.dataset.v4sort;
          ((bt = bt.k === i ? { k: i, d: -bt.d } : { k: i, d: 1 }), render());
          return;
        }
        const o = t.target.closest("[data-v4per]");
        if (o) {
          (t.preventDefault(), (mt = o.dataset.v4per), render());
          return;
        }
        if (t.target.closest("[data-v4table]")) {
          (t.preventDefault(), (kt = !kt), render());
          return;
        }
        const u = t.target.closest(".v4-cphase [data-phase]");
        u && (qt = u.dataset.phase);
      },
      !0,
    ),
      v.addEventListener("change", (t) => {
        const e = t.target.closest("[data-v4date]");
        if (e && e.value)
          try {
            ((D = e.value), render());
          } catch {}
      }),
      v.addEventListener("input", (t) => {
        const e = t.target.closest(".v4-notes");
        if (e) {
          const a = e.parentElement.querySelector(".v4-count");
          a &&
            (a.textContent = e.value.length + "/2000 · salvo no Plano do dia");
        }
      }));
    function _t() {
      Ut();
      try {
        xt();
      } catch {}
    }
    v.readyState === "loading"
      ? v.addEventListener("DOMContentLoaded", _t, { once: !0 })
      : _t();
    let Xt = 0;
    const $e = setInterval(() => {
      if ((Xt++, Ut()))
        try {
          xt();
        } catch {}
      try {
        Lt();
      } catch {}
      Xt > 10 && clearInterval($e);
    }, 700);
    (v.addEventListener("click", (t) => {
      t.target.closest('[data-dt393-action="menu"]') &&
        setTimeout(() => {
          try {
            (Lt(), Rt());
          } catch {}
        }, 0);
    }),
      setInterval(() => {
        if (!v.hidden)
          try {
            Ht();
          } catch {}
      }, 15e3));
  })();
} catch (e) {
  console.error("[v522] falha em redesign-v420.js", e);
}
try {
  /* Diário de Trader v421 — gráfico do Terminal no estilo Bloomberg (GP / COMP).
   * Cabeçalho do ativo (último, variação, abertura, máxima, mínima, anterior), barra de ferramentas,
   * eixo duplo (L1/R1) ou base 100, razão A/B, médias móveis, eventos-chave (agenda + seus trades),
   * gráficos prontos, tabela e acompanhamento por toque.
   * Dados: somente candles reais do Terminal (TRM.tec.velas / pegaVelas → função "candles", Yahoo). */
  (function (root) {
    "use strict";
    const doc = root.document;
    if (!doc) return;
    const KEY = "diario-v421-gp";
    const SYMS = {
      IBOV: "Ibovespa",
      SPX: "S&P 500",
      NDX: "Nasdaq 100",
      DXY: "Índice do dólar (DXY)",
      USDBRL: "Dólar (USD/BRL)",
      VIX: "VIX",
      BRENT: "Petróleo Brent",
      WTI: "Petróleo WTI",
      OURO: "Ouro",
      COBRE: "Cobre",
      PRATA: "Prata",
      EWZ: "EWZ (ETF Brasil)",
      PETR4: "Petrobras PN",
      VALE3: "Vale ON",
      ITUB4: "Itaú PN",
      BBAS3: "Banco do Brasil",
      WEGE3: "WEG",
      BOVA11: "BOVA11",
      BTCUSD: "Bitcoin",
    };
    const ECON = {
      "BC:SELIC": ["selic", "Selic meta (% a.a.)"],
      "BC:CDI": ["cdi", "CDI (% a.a.)"],
      "BC:IPCA12": ["ipca12", "IPCA 12 meses (%)"],
      "BC:IPCA": ["ipca", "IPCA mensal (%)"],
      "BC:IGPM": ["igpm", "IGP-M mensal (%)"],
      "BC:IBCBR": ["ibcbr", "IBC-Br (prévia do PIB)"],
      "BC:DESEMP": ["desemprego", "Desemprego PNAD (%)"],
      "BC:PTAX": ["ptax", "Dólar PTAX (R$)"],
    };
    const isEcon = (s) => !!ECON[s];
    const REL = {
      IBOV: ["SPX", "EWZ", "USDBRL", "BOVA11", "BC:SELIC", "BC:IBCBR"],
      PETR4: ["BRENT", "WTI", "PETR3", "PRIO3", "EWZ", "IBOV"],
      PETR3: ["PETR4", "BRENT", "IBOV"],
      VALE3: ["COBRE", "CSNA3", "GGBR4", "IBOV", "EWZ"],
      ITUB4: ["BBDC4", "BBAS3", "SANB11", "IBOV", "BC:SELIC"],
      BBAS3: ["ITUB4", "BBDC4", "IBOV", "BC:SELIC"],
      WEGE3: ["IBOV", "USDBRL", "SPX"],
      BOVA11: ["IBOV", "EWZ"],
      USDBRL: ["DXY", "BC:PTAX", "BC:SELIC", "IBOV", "EWZ"],
      SPX: ["NDX", "VIX", "DXY", "IBOV"],
      NDX: ["SPX", "VIX", "DXY"],
      DXY: ["USDBRL", "OURO", "SPX"],
      VIX: ["SPX", "NDX"],
      OURO: ["DXY", "PRATA", "USDBRL"],
      PRATA: ["OURO", "COBRE"],
      COBRE: ["VALE3", "OURO"],
      BRENT: ["WTI", "PETR4", "USDBRL"],
      WTI: ["BRENT", "PETR4"],
      EWZ: ["IBOV", "USDBRL", "SPX"],
      BTCUSD: ["NDX", "OURO", "DXY"],
    };
    const related = (s) =>
      (REL[s] || ["IBOV", "SPX", "USDBRL", "DXY"]).filter((x) => x !== s);
    const PRESETS = [
      ["IBOV", "SPX", "Ibovespa × S&P 500"],
      ["IBOV", "USDBRL", "Ibovespa × Dólar"],
      ["EWZ", "IBOV", "EWZ × Ibovespa"],
      ["PETR4", "BRENT", "Petrobras × Brent"],
      ["VALE3", "COBRE", "Vale × Cobre (metais)"],
      ["NDX", "VIX", "Nasdaq × VIX"],
      ["USDBRL", "DXY", "Dólar × DXY"],
      ["OURO", "DXY", "Ouro × DXY"],
      ["IBOV", "BC:SELIC", "Ibovespa × Selic"],
      ["IBOV", "BC:IPCA12", "Ibovespa × IPCA 12 meses"],
      ["IBOV", "BC:IBCBR", "Ibovespa × IBC-Br"],
      ["USDBRL", "BC:SELIC", "Dólar × Selic"],
    ];
    const PER = [
      ["1D", "5m", 1],
      ["3D", "15m", 3],
      ["1M", "60m", 31],
      ["6M", "1d", 183],
      ["YTD", "1d", -1],
      ["1A", "1d", 366],
      ["2A", "1d", 731],
      ["Máx", "1d", 99999],
    ];
    const def = {
      a: "IBOV",
      b: "SPX",
      per: "1A",
      freq: "D",
      mode: "dual",
      ma: [],
      ev: true,
      table: false,
    };
    let st = (() => {
      try {
        return Object.assign(
          {},
          def,
          JSON.parse(localStorage.getItem(KEY) || "{}"),
        );
      } catch (e) {
        return { ...def };
      }
    })();
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(st));
      } catch (e) {}
    };
    const esc = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    const fin = (n) => typeof n === "number" && Number.isFinite(n);
    const dec = (v) => {
      const a = Math.abs(v);
      return a >= 10000 ? 0 : a < 10 ? 4 : 2;
    };
    const nf = (v, d) =>
      fin(v)
        ? v.toLocaleString("pt-BR", {
            minimumFractionDigits: d ?? dec(v),
            maximumFractionDigits: d ?? dec(v),
          })
        : "—";
    const pc = (v) => (fin(v) ? (v > 0 ? "+" : "") + nf(v, 2) + "%" : "—");
    const name = (s) => SYMS[s] || (ECON[s] ? ECON[s][1] : s);
    const tec = () => root.TRM?.tec;
    const perDef = () => PER.find((p) => p[0] === st.per) || PER[5];
    const ivOf = () => perDef()[1];
    const g = (f, d) => {
      try {
        const v = f();
        return v === undefined ? d : v;
      } catch (e) {
        return d;
      }
    };

    /* ---------- dados ---------- */
    const econ = new Map(),
      econErr = new Map();
    try {
      const c = JSON.parse(localStorage.getItem("diario-v422-econ") || "{}");
      Object.entries(c).forEach(([k, v]) => {
        if (v && Array.isArray(v.pontos)) econ.set(k, v);
      });
    } catch (e) {}
    function econSave() {
      try {
        const o = {};
        econ.forEach((v, k) => (o[k] = v));
        localStorage.setItem("diario-v422-econ", JSON.stringify(o));
      } catch (e) {}
    }
    async function fetchEcon(sym, force) {
      const id = ECON[sym][0],
        k = sym;
      const have = econ.get(k);
      if (!force && have && Date.now() - (have.ts || 0) < 6 * 36e5) return;
      if (!force && Date.now() - (asked.get(k) || 0) < 90000) return;
      asked.set(k, Date.now());
      try {
        if (typeof rq !== "function")
          throw Error("Conexão do app indisponível.");
        const r = await rq("/functions/v1/series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serie: id,
            desde: new Date().getFullYear() - 6,
          }),
        });
        const j = await r.json();
        if (!Array.isArray(j.pontos))
          throw Error(j.error || "Resposta inesperada.");
        econ.set(k, { ...j, ts: Date.now() });
        econErr.delete(k);
        econSave();
      } catch (e) {
        econErr.set(
          k,
          e && e.status === 404
            ? 'A função "series" ainda não foi publicada no Supabase.'
            : e && e.status === 401
              ? "Entre na sua conta para carregar os indicadores."
              : String((e && e.message) || e),
        );
      }
    }
    function bars(sym, iv) {
      if (isEcon(sym)) {
        const v = econ.get(sym);
        return (v?.pontos || []).map((p) => [p[0], p[1], p[1], p[1], p[1], 0]);
      }
      const L = g(() => tec().velas(sym, iv)?.L, []) || [];
      return L.filter(
        (x) => Array.isArray(x) && fin(x[0]) && fin(x[4]) && x[4] > 0,
      ).sort((a, b) => a[0] - b[0]);
    }
    function meta(sym, iv) {
      if (isEcon(sym)) {
        const v = econ.get(sym);
        return v ? v.fonte + " · " + v.unidade : "";
      }
      return g(() => tec().velas(sym, iv)?.nota || "", "");
    }
    function errOf(sym, iv) {
      if (isEcon(sym)) return econErr.get(sym) || "";
      return g(() => tec().erroVelas?.(sym, iv) || "", "");
    }
    const asked = new Map();
    async function fetchSym(sym, iv, force) {
      if (isEcon(sym)) return fetchEcon(sym, force);
      const k = sym + "|" + iv;
      if (!force && Date.now() - (asked.get(k) || 0) < 90000) return;
      asked.set(k, Date.now());
      try {
        await tec()?.pegaVelas?.(sym, iv);
      } catch (e) {}
    }
    function cut(list) {
      const p = perDef();
      if (!list.length) return list;
      const now = Date.now() / 1000;
      let from = -Infinity;
      if (p[2] === -1)
        from = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
      else if (p[2] < 99999) {
        // intradiário: últimos N pregões presentes na série
        if (p[1] !== "1d") {
          const days = [
            ...new Set(
              list.map((x) => new Date(x[0] * 1000).toISOString().slice(0, 10)),
            ),
          ].slice(-p[2]);
          const first = days[0];
          return list.filter(
            (x) => new Date(x[0] * 1000).toISOString().slice(0, 10) >= first,
          );
        }
        from = now - p[2] * 86400;
      }
      return list.filter((x) => x[0] >= from);
    }
    function resample(list) {
      if (st.freq === "D" || ivOf() !== "1d") return list;
      const m = new Map();
      for (const r of list) {
        const d = new Date(r[0] * 1000);
        let k;
        if (st.freq === "M") k = d.getUTCFullYear() + "-" + d.getUTCMonth();
        else {
          const t = new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
          );
          t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
          k = t.toISOString().slice(0, 10);
        }
        const c = m.get(k);
        if (!c) m.set(k, [r[0], r[1], r[2], r[3], r[4], r[5] || 0]);
        else {
          c[0] = r[0];
          c[2] = Math.max(c[2], r[2]);
          c[3] = Math.min(c[3], r[3]);
          c[4] = r[4];
          c[5] += r[5] || 0;
        }
      }
      return [...m.values()];
    }
    const sma = (vals, n) =>
      vals.map((_, i) =>
        i < n - 1
          ? null
          : vals.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n,
      );
    function align(A, B) {
      if (isEcon(st.b)) {
        let j = 0,
          last = null;
        const out = [];
        for (const r of A) {
          while (j < B.length && B[j][0] <= r[0] + 86400) {
            last = B[j];
            j++;
          }
          out.push([r, last]);
        }
        return out;
      }
      // junta pela data (diário) ou pelo horário mais próximo (intradiário)
      const key = (t) =>
        ivOf() === "1d"
          ? new Date(t * 1000).toISOString().slice(0, 10)
          : Math.round(t / 300);
      const mb = new Map(B.map((r) => [key(r[0]), r]));
      return A.map((r) => [r, mb.get(key(r[0])) || null]);
    }

    /* ---------- cabeçalho do ativo ---------- */
    function header(sym) {
      const d = bars(sym, "1d");
      const intr = bars(sym, "5m");
      if (!d.length && !intr.length)
        return `<div class="gp-hdr"><b class="gp-tk">${esc(sym)}</b><span class="gp-muted">${esc(name(sym))} · sem dados ainda</span></div>`;
      const last = intr.length ? intr[intr.length - 1] : d[d.length - 1];
      const today = d[d.length - 1],
        prev = d.length > 1 ? d[d.length - 2][4] : null;
      // candle diário do dia pode estar incompleto: usa intradiário quando houver
      const dayKey = new Date(last[0] * 1000).toISOString().slice(0, 10);
      const dayBars = intr.filter(
        (x) => new Date(x[0] * 1000).toISOString().slice(0, 10) === dayKey,
      );
      const o = dayBars.length ? dayBars[0][1] : today[1],
        h = dayBars.length ? Math.max(...dayBars.map((x) => x[2])) : today[2],
        l = dayBars.length ? Math.min(...dayBars.map((x) => x[3])) : today[3];
      const px = last[4];
      const pv =
        new Date(today[0] * 1000).toISOString().slice(0, 10) === dayKey
          ? prev
          : today[4];
      const ch = fin(pv) ? px - pv : null,
        chp = fin(pv) ? (px / pv - 1) * 100 : null;
      const at = new Date(last[0] * 1000).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      const up = ch > 0,
        dn = ch < 0;
      const spark = d.slice(-30).map((x) => x[4]);
      let sp = "";
      if (spark.length > 2) {
        const mn = Math.min(...spark),
          mx = Math.max(...spark),
          r = mx - mn || 1;
        sp = `<svg class="gp-spark" viewBox="0 0 60 18" aria-hidden="true"><polyline points="${spark.map((v, i) => `${((i / (spark.length - 1)) * 60).toFixed(1)},${(17 - ((v - mn) / r) * 16).toFixed(1)}`).join(" ")}"/></svg>`;
      }
      return `<div class="gp-hdr" aria-label="Resumo de ${esc(name(sym))}">
   <div class="gp-l1"><b class="gp-tk">${esc(sym)}</b><span class="gp-arrow ${up ? "up" : dn ? "dn" : ""}">${up ? "↑" : dn ? "↓" : "·"}</span><b class="gp-px ${up ? "up" : dn ? "dn" : ""}">${nf(px)}</b><span class="gp-ch ${up ? "up" : dn ? "dn" : ""}">${fin(ch) ? (ch > 0 ? "+" : "") + nf(ch) : "—"} <small>${pc(chp)}</small></span>${sp}</div>
   <div class="gp-l2"><em><span class="gp-at">At</span> ${at}</em><em><span>O</span>${nf(o)}</em><em><span>H</span>${nf(h)}</em><em><span>L</span>${nf(l)}</em><em><span>Prev</span>${nf(pv)}</em></div></div>`;
    }

    /* ---------- gráfico ---------- */
    function events(t0, t1, sym) {
      const out = [];
      if (!st.ev) return out;
      try {
        const a = AG.v[0];
        (a?.eventos || [])
          .filter((e) => e.imp === 1)
          .forEach((e) => {
            const t = Date.parse(e.em) / 1000;
            if (t >= t0 && t <= t1)
              out.push({
                t,
                k: "ev",
                l: String(e.t || "Evento") + (e.p ? " (" + e.p + ")" : ""),
              });
          });
      } catch (e) {}
      try {
        const base = (s) =>
          String(s || "")
            .toUpperCase()
            .replace(/[FGHJKMNQUVXZ]\d{2}$/, "");
        const map = {
          IBOV: ["WIN", "IND", "IBOV", "BOVA11"],
          USDBRL: ["WDO", "DOL", "USDBRL"],
        };
        const ok = map[sym] || [sym];
        (S.trades || []).forEach((x) => {
          const b = base(x.ativo);
          if (!ok.some((o) => b === o || b.startsWith(o))) return;
          const t =
            Date.parse(String(x.dt || "").slice(0, 16) + ":00-03:00") / 1000;
          if (t >= t0 && t <= t1)
            out.push({
              t,
              k: x.side === "C" ? "buy" : "sell",
              l:
                (x.side === "C" ? "Compra " : "Venda ") +
                (x.ativo || "") +
                (x.setup ? " · " + x.setup : ""),
            });
        });
      } catch (e) {}
      return out.sort((a, b) => a.t - b.t).slice(-40);
    }
    let lastGeom = null;

    /* v526 — Janela do GP: mantém os candles originais, exibe tempo deslocável e
   eixo de preço ajustável sem alterar os dados carregados. */
    const gpView = {
      key: "",
      count: 0,
      offset: 0,
      max: 0,
      priceZoom: 1,
      priceShift: 0,
      fraction: 0,
    };
    const VIEWS_KEY = "diario-gp-enquadramentos-v531";
    let savedViews = {};
    try {
      const v = JSON.parse(localStorage.getItem(VIEWS_KEY) || "{}");
      if (v && typeof v === "object" && !Array.isArray(v)) savedViews = v;
    } catch (_) {}
    const gpKey = () =>
      [st.a, st.b || "", st.per, st.freq, st.mode, ivOf()].join("|");
    function viewWrite() {
      try {
        const entries = Object.entries(savedViews)
          .sort((a, b) => (b[1]?.savedAt || 0) - (a[1]?.savedAt || 0))
          .slice(0, 25);
        savedViews = Object.fromEntries(entries);
        localStorage.setItem(VIEWS_KEY, JSON.stringify(savedViews));
      } catch (_) {}
    }
    function viewStore() {
      if (!gpView.key) return;
      savedViews[gpView.key] = {
        count: gpView.count,
        offset: gpView.offset,
        priceZoom: gpView.priceZoom,
        priceShift: gpView.priceShift,
        savedAt: Date.now(),
      };
      viewWrite();
    }
    function viewRestore(key) {
      const v = savedViews[key];
      if (!v || typeof v !== "object") return false;
      gpView.count = Number(v.count) || gpView.count;
      gpView.offset = Number(v.offset) || 0;
      gpView.priceZoom = clip(v.priceZoom, 0.2, 6);
      gpView.priceShift = clip(v.priceShift, -10, 10);
      gpView.fraction = 0;
      return true;
    }
    const clip = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
    function navInit(all) {
      if (all.length < 2) return all;
      const key = gpKey();
      if (gpView.key !== key) {
        gpView.key = key;
        gpView.count = Math.max(2, resample(cut(bars(st.a, ivOf()))).length);
        gpView.offset = 0;
        gpView.priceZoom = 1;
        gpView.priceShift = 0;
        gpView.fraction = 0;
        viewRestore(key);
      }
      gpView.max = all.length;
      gpView.count = Math.max(
        2,
        Math.min(gpView.count || all.length, all.length),
      );
      gpView.offset = clip(
        gpView.offset,
        0,
        Math.max(0, all.length - gpView.count),
      );
      return all.slice(
        all.length - gpView.count - gpView.offset,
        all.length - gpView.offset,
      );
    }
    function navPriceBounds(bounds) {
      const low = bounds[0],
        high = bounds[1],
        span = Math.max(1e-10, high - low);
      const mid = (low + high) / 2 + gpView.priceShift * span;
      const radius = (span * gpView.priceZoom) / 2;
      return [mid - radius, mid + radius];
    }
    function navPan(dx, dy, width, height, mode) {
      if ((mode === "hand" || mode === "time") && gpView.max > gpView.count) {
        gpView.fraction += (dx / Math.max(20, width)) * gpView.count;
        const step = Math.trunc(gpView.fraction);
        gpView.fraction -= step;
        const next = clip(gpView.offset + step, 0, gpView.max - gpView.count);
        if (next !== gpView.offset + step) gpView.fraction = 0;
        gpView.offset = next;
      }
      if (mode === "hand" || mode === "price")
        gpView.priceShift = clip(
          gpView.priceShift + (dy / Math.max(20, height)) * gpView.priceZoom,
          -10,
          10,
        );
      viewStore();
    }
    function navZoom(factor, anchor) {
      if (gpView.max < 2) return;
      const prev = gpView.count;
      const next = clip(
        Math.round(prev * factor),
        Math.min(12, gpView.max),
        gpView.max,
      );
      const a = anchor == null ? 0.5 : clip(anchor, 0, 1);
      gpView.offset = clip(
        Math.round(gpView.offset + (prev - next) * (1 - a)),
        0,
        gpView.max - next,
      );
      gpView.count = next;
      gpView.fraction = 0;
      viewStore();
    }
    function navReset() {
      delete savedViews[gpKey()];
      viewWrite();
      gpView.key = "";
      gpView.offset = 0;
      gpView.count = 0;
      gpView.max = 0;
      gpView.priceZoom = 1;
      gpView.priceShift = 0;
      gpView.fraction = 0;
    }
    function svg() {
      const iv = ivOf();
      const A = navInit(resample(bars(st.a, iv))),
        B = st.b
          ? isEcon(st.b)
            ? bars(st.b, iv)
            : resample(bars(st.b, iv))
          : [];
      const W = 720,
        H = 360,
        L = 56,
        R = 62,
        T = 14,
        Bm = 40;
      const cw = W - L - R,
        chh = H - T - Bm;
      if (A.length < 2) {
        const e = errOf(st.a, iv);
        const login = /conta|login|401/i.test(e) || g(() => !SESS, false);
        return {
          html: `<div class="gp-empty"><b>Sem histórico de ${esc(name(st.a))} para ${esc(st.per)}.</b><span>${esc(e || "O app ainda não recebeu os candles deste ativo.")}</span>${login ? '<button type="button" data-dt414-go="conta">Entrar na conta</button>' : '<button type="button" data-gp="reload">Carregar histórico</button>'}</div>`,
          ok: false,
        };
      }
      let pa = A.map((r) => r[4]),
        pb = null,
        pairs = null;
      if (B.length >= 2) {
        pairs = align(A, B);
        pb = pairs.map(([, b]) => (b ? b[4] : null));
      }
      let mode = st.mode;
      if (!pb) mode = "single";
      if (isEcon(st.b) && mode !== "single") mode = "dual";
      if (pb && pb.every((v) => v == null)) {
        pb = null;
        mode = "single";
      }
      // séries no espaço de desenho
      let sa = pa,
        sb = pb,
        labelA = st.a,
        labelB = isEcon(st.b) ? ECON[st.b][1].replace(/\s*\(.*\)$/, "") : st.b;
      if (mode === "base") {
        const a0 = pa[0];
        const fb = pb.find((v) => v != null);
        sa = pa.map((v) => (v / a0) * 100);
        sb = pb.map((v) => (v == null ? null : (v / fb) * 100));
      }
      if (mode === "ratio") {
        const r = pairs.map(([a, b]) => (b ? a[4] / b[4] : null));
        const f0 = r.find((v) => v != null);
        sa = r.map((v) => (v == null ? null : (v / f0) * 100));
        sb = null;
        labelA = st.a + " / " + st.b;
      }
      const xs = A.map((r) => r[0]);
      const t0 = xs[0],
        t1 = xs[xs.length - 1];
      const X = (i) => L + (i / (xs.length - 1)) * cw;
      const rng = (v) => {
        const f = v.filter(fin);
        let lo = Math.min(...f),
          hi = Math.max(...f);
        const m = (hi - lo) * 0.08 || Math.abs(hi) * 0.01 || 1;
        return [lo - m, hi + m];
      };
      const both = mode === "base" ? rng([...sa, ...(sb || [])]) : null;
      const [ra0, ra1] = navPriceBounds(both || rng(sa));
      const [rb0, rb1] = sb ? (both ? [ra0, ra1] : rng(sb)) : [0, 1];
      const YA = (v) => T + (1 - (v - ra0) / (ra1 - ra0)) * chh,
        YB = (v) => T + (1 - (v - rb0) / (rb1 - rb0)) * chh;
      const path = (s, Y) => {
        let d = "",
          pen = false;
        s.forEach((v, i) => {
          if (v == null) {
            pen = false;
            return;
          }
          d += (pen ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1);
          pen = true;
        });
        return d;
      };
      const dA = path(sa, YA);
      const area =
        dA +
        `L${X(sa.length - 1).toFixed(1)},${(T + chh).toFixed(1)}L${X(0).toFixed(1)},${(T + chh).toFixed(1)}Z`;
      const dB = sb ? path(sb, mode === "base" ? YA : YB) : "";
      // eixos (principal à direita = R1, como no Bloomberg)
      const ticks = (a0, a1, n = 6) =>
        Array.from({ length: n }, (_, i) => a0 + ((a1 - a0) * i) / (n - 1));
      const fmtAx = (v) =>
        mode === "base" || mode === "ratio"
          ? nf(v, 1)
          : nf(v, Math.abs(v) >= 1000 ? 0 : Math.abs(v) < 10 ? 2 : 1);
      let grid = "",
        ax = "";
      ticks(ra0, ra1).forEach((v) => {
        const y = YA(v).toFixed(1);
        grid += `<path class="gp-g" d="M${L} ${y}H${W - R}"/>`;
        ax += `<text class="gp-ax" x="${W - R + 8}" y="${+y + 4}">${fmtAx(v)}</text><path class="gp-tick" d="M${W - R} ${y}h5"/>`;
      });
      if (sb && mode === "dual")
        ticks(rb0, rb1).forEach((v) => {
          const y = YB(v).toFixed(1);
          ax += `<text class="gp-ax gp-axl" x="${L - 8}" y="${+y + 4}" text-anchor="end">${fmtAx(v)}</text><path class="gp-tick" d="M${L - 5} ${y}h5"/>`;
        });
      // eixo do tempo
      let xl = "";
      const nX = 6;
      for (let i = 0; i < nX; i++) {
        const idx = Math.round((i * (xs.length - 1)) / (nX - 1));
        const d = new Date(xs[idx] * 1000);
        const x = X(idx).toFixed(1);
        const lab =
          iv === "1d"
            ? d
                .toLocaleDateString("pt-BR", {
                  month: "short",
                  timeZone: "America/Sao_Paulo",
                })
                .replace(".", "")
            : d.toLocaleString("pt-BR", {
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Sao_Paulo",
              });
        const yr =
          iv === "1d" &&
          (i === 0 ||
            new Date(
              xs[Math.round(((i - 1) * (xs.length - 1)) / (nX - 1))] * 1000,
            ).getFullYear() !== d.getFullYear())
            ? d.getFullYear()
            : "";
        grid += `<path class="gp-g" d="M${x} ${T}V${T + chh}"/>`;
        xl += `<text class="gp-ax" x="${x}" y="${H - Bm + 16}" text-anchor="middle">${lab}</text>${yr ? `<text class="gp-ax gp-yr" x="${x}" y="${H - Bm + 31}" text-anchor="middle">${yr}</text>` : ""}`;
      }
      // médias móveis da série principal (em preço; não em razão)
      let mas = "";
      const colors = { 20: "#cfab69", 50: "#b6b1a6", 200: "#ed8c7d" };
      if (mode !== "ratio")
        st.ma.forEach((n) => {
          const m = sma(pa, n).map((v) =>
            v == null ? null : mode === "base" ? (v / pa[0]) * 100 : v,
          );
          if (m.filter((v) => v != null).length > 1)
            mas += `<path class="gp-ma" stroke="${colors[n]}" d="${path(m, YA)}"/>`;
        });
      // eventos-chave
      const evs = events(t0, t1, st.a);
      let evg = "";
      evs.forEach((e, i) => {
        let j = 0;
        while (j < xs.length - 1 && xs[j + 1] <= e.t) j++;
        const x = X(j).toFixed(1);
        if (e.k === "ev")
          evg += `<g class="gp-ev" data-gp-ev="${i}"><path d="M${x} ${T}V${T + chh}"/><rect x="${+x - 6}" y="${T + chh - 12}" width="12" height="12" rx="2"/><text x="${x}" y="${T + chh - 3}" text-anchor="middle">E</text><title>${esc(e.l)}</title></g>`;
        else {
          const y = YA(sa[j] ?? sa[sa.length - 1]);
          evg += `<g class="gp-trade ${e.k}"><path d="${e.k === "buy" ? `M${x} ${(y + 6).toFixed(1)}l-6 10h12z` : `M${x} ${(y - 6).toFixed(1)}l-6 -10h12z`}"/><title>${esc(e.l)}</title></g>`;
        }
      });
      // etiquetas do último valor nos eixos
      const lastA = sa[sa.length - 1],
        lastB = sb ? [...sb].reverse().find((v) => v != null) : null;
      const tagR = `<g class="gp-tag gp-tag-a"><rect x="${W - R + 2}" y="${(YA(lastA) - 9).toFixed(1)}" width="${R - 4}" height="18" rx="2"/><text x="${W - R / 2}" y="${(YA(lastA) + 4).toFixed(1)}" text-anchor="middle">${fmtAx(lastA)}</text></g>`;
      const tagL =
        lastB != null
          ? mode === "dual"
            ? `<g class="gp-tag gp-tag-b"><rect x="2" y="${(YB(lastB) - 9).toFixed(1)}" width="${L - 4}" height="18" rx="2"/><text x="${L / 2}" y="${(YB(lastB) + 4).toFixed(1)}" text-anchor="middle">${fmtAx(lastB)}</text></g>`
            : `<g class="gp-tag gp-tag-b"><rect x="${W - R + 2}" y="${(YA(lastB) - 9).toFixed(1)}" width="${R - 4}" height="18" rx="2"/><text x="${W - R / 2}" y="${(YA(lastB) + 4).toFixed(1)}" text-anchor="middle">${fmtAx(lastB)}</text></g>`
          : "";
      const legendRows = [
        [labelA, mode === "dual" ? "R1" : "", sa[sa.length - 1], "#fff"],
      ].concat(
        sb ? [[labelB, mode === "dual" ? "L1" : "", lastB, "#6d9ac1"]] : [],
      );
      const legend = `<g class="gp-legend"><rect x="${L + 8}" y="${T + 6}" width="210" height="${18 + legendRows.length * 16}" rx="3"/><text class="gp-lt" x="${L + 113}" y="${T + 19}" text-anchor="middle">${mode === "base" ? "Base 100" : mode === "ratio" ? "Razão (base 100)" : "Último preço"}</text>${legendRows.map((r, i) => `<rect x="${L + 16}" y="${T + 26 + i * 16}" width="9" height="9" fill="${r[3]}"/><text class="gp-lv" x="${L + 30}" y="${T + 34 + i * 16}">${esc(r[0])}${r[1] ? " (" + r[1] + ")" : ""}</text><text class="gp-lv" x="${L + 210}" y="${T + 34 + i * 16}" text-anchor="end">${fmtAx(r[2])}</text>`).join("")}</g>`;
      lastGeom = { xs, A, B: pairs, sa, sb, X, L, R, W, T, chh, mode, fmtAx };
      return {
        html: `<svg class="gp-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de ${esc(labelA)}${sb ? " e " + esc(labelB) : ""}, período ${esc(st.per)}">
    <defs><clipPath id="gp421-plot-clip"><rect x="${L}" y="${T}" width="${cw}" height="${chh}"/></clipPath></defs>
    <rect class="gp-bg" x="${L}" y="${T}" width="${cw}" height="${chh}"/>${grid}
    <g class="gp-view-series" clip-path="url(#gp421-plot-clip)"><path class="gp-area" d="${area}"/>${dB ? `<path class="gp-lb" d="${dB}"/>` : ""}<path class="gp-la" d="${dA}"/>${mas}${evg}</g>
    <path class="gp-frame" d="M${L} ${T}V${T + chh}H${W - R}V${T}"/>${ax}${xl}${tagR}${tagL}${legend}
    <g class="gp-cross" hidden><path class="gp-cv" d=""/><rect class="gp-cbox" rx="3"/><text class="gp-ct"></text></g></svg>`,
        ok: true,
      };
    }
    function table() {
      const iv = ivOf();
      const A = resample(cut(bars(st.a, iv))),
        B = st.b
          ? isEcon(st.b)
            ? bars(st.b, iv)
            : resample(cut(bars(st.b, iv)))
          : [];
      if (!A.length)
        return '<div class="gp-empty"><b>Sem dados para a tabela.</b></div>';
      const rows = (B.length ? align(A, B) : A.map((a) => [a, null]))
        .slice(-60)
        .reverse();
      const fd = (t) =>
        new Date(t * 1000).toLocaleString(
          "pt-BR",
          iv === "1d"
            ? { day: "2-digit", month: "2-digit", year: "2-digit" }
            : {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              },
        );
      return `<div class="gp-tablewrap"><table class="gp-table"><thead><tr><th>Data</th><th>${esc(st.a)}</th><th>Var.</th>${B.length ? `<th>${esc(isEcon(st.b) ? ECON[st.b][1] : st.b)}</th><th>Var.</th>` : ""}</tr></thead><tbody>${rows
        .map(([a, b], i) => {
          const pa = rows[i + 1]?.[0]?.[4],
            pb = rows[i + 1]?.[1]?.[4];
          return `<tr><td>${fd(a[0])}</td><td>${nf(a[4])}</td><td class="${a[4] >= pa ? "up" : "dn"}">${pa ? pc((a[4] / pa - 1) * 100) : ""}</td>${B.length ? `<td>${b ? nf(b[4]) : "—"}</td><td class="${b && pb ? (b[4] >= pb ? "up" : "dn") : ""}">${b && pb ? pc((b[4] / pb - 1) * 100) : ""}</td>` : ""}</tr>`;
        })
        .join("")}</tbody></table></div>`;
    }

    /* ---------- componente ---------- */
    const opt = (sel, allowNone) =>
      (allowNone
        ? `<option value=""${!sel ? " selected" : ""}>— nenhum —</option>`
        : "") +
      `<optgroup label="Ativos">` +
      Object.keys(SYMS)
        .map(
          (k) =>
            `<option value="${k}"${k === sel ? " selected" : ""}>${esc(k)} · ${esc(SYMS[k])}</option>`,
        )
        .join("") +
      `</optgroup>` +
      (allowNone
        ? `<optgroup label="Indicadores (Banco Central)">` +
          Object.keys(ECON)
            .map(
              (k) =>
                `<option value="${k}"${k === sel ? " selected" : ""}>${esc(ECON[k][1])}</option>`,
            )
            .join("") +
          `</optgroup>`
        : "") +
      (sel && !SYMS[sel] && !ECON[sel]
        ? `<option value="${esc(sel)}" selected>${esc(sel)}</option>`
        : "");
    function shell() {
      return `<section id="v421-gp" class="gp" aria-label="Gráfico do Terminal">
  <div class="gp-head" data-gp-head></div>
  <div class="gp-bar1">
    <span class="gp-type">Gráfico de linha</span>
    <label class="gp-sel gp-a"><span class="sr">Ativo principal</span><select data-gp-a>${opt(st.a)}</select></label>
    <div class="gp-menuwrap"><button type="button" class="gp-btn" data-gp="presets" aria-expanded="false">Gráficos prontos ▾</button><div class="gp-menu" data-gp-menu hidden>${PRESETS.map(([a, b, l], i) => `<button type="button" data-gp-preset="${i}">${esc(l)}</button>`).join("")}</div></div>
    <div class="gp-seg" role="group" aria-label="Escala"><button type="button" data-gp-mode="dual">Eixo duplo</button><button type="button" data-gp-mode="base">Base 100</button><button type="button" data-gp-mode="ratio">Razão A/B</button></div>
  </div>
  <div class="gp-bar2">
    <div class="gp-per" role="group" aria-label="Período">${PER.map(([p]) => `<button type="button" data-gp-per="${p}">${p}</button>`).join("")}</div>
    <select class="gp-freq" data-gp-freq aria-label="Frequência"><option value="D">Diário</option><option value="S">Semanal</option><option value="M">Mensal</option></select>
    <div class="gp-ma-group" role="group" aria-label="Médias móveis"><span>Médias</span>${[20, 50, 200].map((n) => `<button type="button" data-gp-ma="${n}">${n}</button>`).join("")}</div>
    <button type="button" class="gp-chk" data-gp="ev"><i></i>Eventos-chave</button>
    <button type="button" class="gp-btn" data-gp="table">Tabela</button>
  </div>
  <div class="gp-bar3">
    <label class="gp-sel gp-b"><span>+ Adicionar dado</span><select data-gp-b>${opt(st.b, true)}</select></label>
    <div class="gp-menuwrap"><button type="button" class="gp-btn" data-gp="rel" aria-expanded="false">Relacionados ▾</button><div class="gp-menu" data-gp-relmenu hidden></div></div>
    <label class="gp-free"><input type="text" data-gp-free placeholder="outro ticker (ex.: ITUB4, AAPL, GC=F)" autocapitalize="characters" spellcheck="false" aria-label="Adicionar outro ticker"><button type="button" data-gp="free">OK</button></label>
    <button type="button" class="gp-btn gp-icon" data-gp="reload" aria-label="Atualizar histórico">↻</button>
    <button type="button" class="gp-btn gp-icon" data-gp="full" aria-label="Tela cheia">⤢</button>
    <button type="button" class="gp-btn gp-icon" data-gp="help" aria-label="Ajuda do Terminal">?</button>
  </div>
  <div class="gp-navigation" role="toolbar" aria-label="Mover e ajustar o gráfico">
    <button type="button" data-gp-nav="hand" title="Deslocar preço e tempo juntos" aria-pressed="true">✋ Mover</button>
    <button type="button" data-gp-nav="price" title="Arrastar apenas a escala de preço" aria-pressed="false">↕ Preço</button>
    <button type="button" data-gp-nav="time" title="Arrastar apenas as datas" aria-pressed="false">↔ Tempo</button>
    <button type="button" data-gp-nav="zin" title="Ampliar o período visível" aria-label="Mais zoom">＋</button>
    <button type="button" data-gp-nav="zout" title="Afastar o gráfico" aria-label="Menos zoom">－</button>
    <button type="button" data-gp-nav="reset" title="Restaurar preço e tempo" aria-label="Restaurar gráfico">⟲</button>
  </div>
  <div class="gp-plot" data-gp-plot></div>
  <div class="gp-source-warning" data-gp-source-status role="status" aria-live="polite" hidden></div>
  <footer class="gp-foot" data-gp-foot></footer>
  </section>`;
    }
    function syncControls(el) {
      el.querySelectorAll(
        '[data-gp-nav="hand"],[data-gp-nav="price"],[data-gp-nav="time"]',
      ).forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String((st.navMode || "hand") === b.dataset.gpNav),
        ),
      );
      el.querySelectorAll("[data-gp-per]").forEach((b) =>
        b.classList.toggle("on", b.dataset.gpPer === st.per),
      );
      el.querySelectorAll("[data-gp-mode]").forEach((b) => {
        const m = isEcon(st.b) ? "dual" : st.mode;
        b.classList.toggle("on", b.dataset.gpMode === m);
        b.disabled = !st.b || (isEcon(st.b) && b.dataset.gpMode !== "dual");
      });
      el.querySelectorAll("[data-gp-ma]").forEach((b) =>
        b.classList.toggle("on", st.ma.includes(+b.dataset.gpMa)),
      );
      el.querySelector('[data-gp="ev"]')?.classList.toggle("on", st.ev);
      el.querySelector('[data-gp="table"]')?.classList.toggle("on", st.table);
      const f = el.querySelector("[data-gp-freq]");
      if (f) {
        f.value = st.freq;
        f.disabled = ivOf() !== "1d";
      }
      const a = el.querySelector("[data-gp-a]");
      if (a && a.value !== st.a) a.innerHTML = opt(st.a);
      const b = el.querySelector("[data-gp-b]");
      if (b && b.value !== (st.b || "")) b.innerHTML = opt(st.b, true);
    }
    function paint() {
      const el = doc.getElementById("v421-gp");
      if (!el) return;
      syncControls(el);
      el.querySelector("[data-gp-head]").innerHTML = header(st.a);
      const plot = el.querySelector("[data-gp-plot]");
      if (st.table) {
        plot.innerHTML = table();
        lastGeom = null;
      } else {
        const r = svg();
        plot.innerHTML = r.html;
      }
      const iv = ivOf(),
        na = bars(st.a, iv).length,
        nb = st.b ? bars(st.b, iv).length : 0;
      const notes = [meta(st.a, iv), st.b ? meta(st.b, iv) : ""].filter(
        Boolean,
      );
      const error = errOf(st.a, iv),
        secondaryError = st.b ? errOf(st.b, iv) : "";
      const sourceWarning = [
        error ? st.a + ": " + error : "",
        secondaryError ? st.b + ": " + secondaryError : "",
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 250);
      const gpNotice = el.querySelector("[data-gp-source-status]");
      if (gpNotice) {
        gpNotice.hidden = !sourceWarning;
        gpNotice.textContent = sourceWarning
          ? "Fonte indisponível ou com falha — " +
            sourceWarning +
            " · Atualize o histórico para tentar novamente."
          : "";
      }
      el.querySelector("[data-gp-foot]").innerHTML =
        `<span>${esc(name(st.a))}${st.b ? " × " + esc(name(st.b)) : ""} · ${iv === "1d" ? "diário" : iv} · ${na}${st.b ? "/" + nb : ""} pontos · Yahoo Finance (com atraso)${isEcon(st.b) ? " · indicador: Banco Central (SGS), vale até a próxima divulgação" : ""}</span>${notes.length ? `<span class="gp-note">${esc([...new Set(notes)].join(" · "))}</span>` : ""}${st.b && isEcon(st.b) && econErr.get(st.b) ? `<span class="gp-err">${esc(econErr.get(st.b))}</span>` : ""}${ivOf() === "1d" && ["Máx", "2A"].includes(st.per) ? '<span class="gp-note">A fonte gratuita entrega até 2 anos de histórico diário.</span>' : ""}`;
    }
    async function load(force) {
      const iv = ivOf();
      const jobs = [fetchSym(st.a, iv, force)];
      if (st.b) jobs.push(fetchSym(st.b, iv, force));
      // cabeçalho usa diário + 5 min
      jobs.push(fetchSym(st.a, "1d", force));
      if (iv !== "5m") jobs.push(fetchSym(st.a, "5m", force));
      paint();
      await Promise.allSettled(jobs);
      paint();
    }
    function mount() {
      // v428: outra camada pode indicar onde o gráfico fica (ex.: Mercado → Cotações); sem isso, Terminal como antes
      const host = g(() => root.V428_gpHost && root.V428_gpHost(), null);
      let ref = null,
        dash = null;
      if (host && host.ref) {
        ref = host.ref;
      } else {
        if (g(() => tab, "") !== "term") return;
        dash = doc.getElementById("tf413");
        if (!dash) return;
        ref = dash.querySelector(".tf413-main");
        if (!ref) return;
      }
      const ex = doc.getElementById("v421-gp");
      if (ex) {
        if (ex.nextElementSibling !== ref && ref.parentNode) ref.before(ex);
        return;
      }
      const wrap = doc.createElement("div");
      wrap.innerHTML = shell();
      ref.before(wrap.firstElementChild);
      if (dash) dash.classList.add("v421-has-gp");
      try {
        root.V428_gpMounted && root.V428_gpMounted();
      } catch (e) {}
      load(false);
    }
    // v428: leitura e troca do que o gráfico mostra (cada sub-aba guarda o seu)
    root.DIARIO_V421 = {
      get: () => JSON.parse(JSON.stringify(st)),
      set: (o) => {
        Object.assign(st, o || {});
        save();
        try {
          syncControls();
        } catch (e) {}
        load(false);
      },
      syms: SYMS,
      econ: ECON,
      presets: PRESETS,
    };

    /* ---------- interação ---------- */
    doc.addEventListener("click", (e) => {
      const el = e.target.closest("#v421-gp");
      if (!el) return;
      const t = e.target.closest(
        "[data-gp],[data-gp-per],[data-gp-mode],[data-gp-ma],[data-gp-preset],[data-gp-rel],[data-gp-nav]",
      );
      if (!t) return;
      e.preventDefault();
      if (t.dataset.gpNav) {
        const mode = t.dataset.gpNav;
        if (["hand", "price", "time"].includes(mode)) {
          st.navMode = mode;
          save();
          syncControls(el);
          return;
        }
        if (mode === "zin") navZoom(0.75, 0.5);
        if (mode === "zout") navZoom(1.33, 0.5);
        if (mode === "reset") navReset();
        paint();
        return;
      }
      if (t.dataset.gpRel) {
        st.b = t.dataset.gpRel;
        if (st.mode === "single") st.mode = "dual";
        save();
        const m = el.querySelector("[data-gp-relmenu]");
        m.hidden = true;
        el.querySelector('[data-gp="rel"]').setAttribute(
          "aria-expanded",
          "false",
        );
        load(false);
        return;
      }
      if (t.dataset.gpPer) {
        st.per = t.dataset.gpPer;
        save();
        load(false);
        return;
      }
      if (t.dataset.gpMode) {
        st.mode = t.dataset.gpMode;
        save();
        paint();
        return;
      }
      if (t.dataset.gpMa) {
        const n = +t.dataset.gpMa;
        st.ma = st.ma.includes(n)
          ? st.ma.filter((x) => x !== n)
          : [...st.ma, n];
        save();
        paint();
        return;
      }
      if (t.dataset.gpPreset != null) {
        const p = PRESETS[+t.dataset.gpPreset];
        st.a = p[0];
        st.b = p[1];
        if (st.mode === "single") st.mode = "dual";
        save();
        el.querySelector("[data-gp-menu]").hidden = true;
        el.querySelector('[data-gp="presets"]').setAttribute(
          "aria-expanded",
          "false",
        );
        load(false);
        return;
      }
      const a = t.dataset.gp;
      if (a === "presets") {
        const m = el.querySelector("[data-gp-menu]");
        m.hidden = !m.hidden;
        t.setAttribute("aria-expanded", String(!m.hidden));
        if (!m.hidden) {
          const r = t.getBoundingClientRect();
          const w = Math.min(260, innerWidth - 16);
          m.style.width = w + "px";
          m.style.left =
            Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
          const below = r.bottom + 4;
          const h = m.offsetHeight;
          m.style.top =
            (below + h > innerHeight - 8 ? Math.max(8, r.top - h - 4) : below) +
            "px";
        }
        return;
      }
      if (a === "rel") {
        const m = el.querySelector("[data-gp-relmenu]");
        m.innerHTML =
          `<p class="gp-menuhead">Comparar ${esc(st.a)} com</p>` +
          related(st.a)
            .map(
              (x) =>
                `<button type="button" data-gp-rel="${esc(x)}">${esc(isEcon(x) ? ECON[x][1] : x + " · " + name(x))}</button>`,
            )
            .join("");
        m.hidden = !m.hidden;
        t.setAttribute("aria-expanded", String(!m.hidden));
        if (!m.hidden) {
          const r = t.getBoundingClientRect();
          const w = Math.min(280, innerWidth - 16);
          m.style.width = w + "px";
          m.style.left =
            Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
          const h = m.offsetHeight;
          m.style.top =
            (r.bottom + 4 + h > innerHeight - 8
              ? Math.max(8, r.top - h - 4)
              : r.bottom + 4) + "px";
        }
        return;
      }
      if (a === "ev") {
        st.ev = !st.ev;
        save();
        paint();
        return;
      }
      if (a === "table") {
        st.table = !st.table;
        save();
        paint();
        return;
      }
      if (a === "reload") {
        load(true);
        return;
      }
      if (a === "help") {
        const h = doc.querySelector(
          '#tf413 .tf413-main [data-tf413-cmd="HELP"]',
        );
        if (h) h.click();
        else {
          const i = doc.getElementById("trcmd");
          if (i) {
            i.value = "HELP";
            i.closest(".trcmdw")?.querySelector('[data-tr="go"]')?.click();
          }
        }
        return;
      }
      if (a === "full") {
        el.classList.toggle("gp-full");
        doc.body.classList.toggle(
          "gp-noscroll",
          el.classList.contains("gp-full"),
        );
        paint();
        return;
      }
      if (a === "free") {
        const i = el.querySelector("[data-gp-free]");
        const v = String(i.value || "")
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9=.^:!-]/g, "")
          .slice(0, 16);
        if (v) {
          st.b = v;
          save();
          i.value = "";
          load(false);
        }
        return;
      }
    });
    doc.addEventListener("change", (e) => {
      const el = e.target.closest("#v421-gp");
      if (!el) return;
      if (e.target.matches("[data-gp-a]")) {
        st.a = e.target.value;
        save();
        load(false);
      }
      if (e.target.matches("[data-gp-b]")) {
        st.b = e.target.value || "";
        save();
        load(false);
      }
      if (e.target.matches("[data-gp-freq]")) {
        st.freq = e.target.value;
        save();
        paint();
      }
    });
    addEventListener(
      "scroll",
      () => {
        const rm = doc.querySelector("#v421-gp [data-gp-relmenu]");
        if (rm && !rm.hidden) rm.hidden = true;
        const m = doc.querySelector("#v421-gp [data-gp-menu]");
        if (m && !m.hidden) {
          m.hidden = true;
          doc
            .querySelector('#v421-gp [data-gp="presets"]')
            ?.setAttribute("aria-expanded", "false");
        }
      },
      { passive: true },
    );
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const el = doc.querySelector("#v421-gp.gp-full");
        if (el) {
          el.classList.remove("gp-full");
          doc.body.classList.remove("gp-noscroll");
          paint();
        }
      }
      if (e.key === "Enter" && e.target.matches?.("#v421-gp [data-gp-free]")) {
        e.preventDefault();
        e.target.parentElement.querySelector('[data-gp="free"]').click();
      }
    });
    doc.addEventListener("click", (e) => {
      if (!e.target.closest(".gp-menuwrap")) {
        const r = doc.querySelector("#v421-gp [data-gp-relmenu]");
        if (r && !r.hidden) {
          r.hidden = true;
          doc
            .querySelector('#v421-gp [data-gp="rel"]')
            ?.setAttribute("aria-expanded", "false");
        }
        const m = doc.querySelector("#v421-gp [data-gp-menu]");
        if (m && !m.hidden) {
          m.hidden = true;
          doc
            .querySelector('#v421-gp [data-gp="presets"]')
            ?.setAttribute("aria-expanded", "false");
        }
      }
    });

    /* v526 — Mouse e toque no GP principal. Prévia acompanha a mão;
   apenas ao soltar são recalculados os pontos e os dois eixos. */
    let gpDrag = null;
    const pointOf = (e) => ({ x: e.clientX, y: e.clientY });
    const gapOf = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    function gpPointerDown(e) {
      const svgEl = e.target.closest?.("#v421-gp .gp-svg");
      if (!svgEl || e.button > 0 || st.table) return;
      const rect = svgEl.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      if (!gpDrag || gpDrag.svg !== svgEl)
        gpDrag = {
          svg: svgEl,
          rect,
          points: new Map(),
          starts: new Map(),
          pinch: false,
          startPinch: null,
          finalPinch: null,
        };
      gpDrag.points.set(e.pointerId, pointOf(e));
      gpDrag.starts.set(e.pointerId, pointOf(e));
      if (gpDrag.points.size === 2) {
        gpDrag.pinch = true;
        gpDrag.startPinch = [...gpDrag.points.values()].map((p) => ({ ...p }));
        gpDrag.finalPinch = gpDrag.startPinch;
        gpDrag.svg
          .querySelector(".gp-view-series")
          ?.removeAttribute("transform");
      }
      try {
        svgEl.setPointerCapture?.(e.pointerId);
      } catch (_) {}
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    function gpPointerMove(e) {
      const d = gpDrag;
      if (!d || !d.points.has(e.pointerId)) return;
      d.points.set(e.pointerId, pointOf(e));
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
      if (d.pinch) {
        if (d.points.size === 2)
          d.finalPinch = [...d.points.values()].map((p) => ({ ...p }));
        return;
      }
      const p = [...d.points.values()][0],
        start = [...d.starts.values()][0];
      const dx = p.x - start.x,
        dy = p.y - start.y;
      const mode = st.navMode || "hand";
      const x =
        mode === "price" ? 0 : clip((dx / d.rect.width) * 720, -720, 720);
      const y =
        mode === "time" ? 0 : clip((dy / d.rect.height) * 360, -360, 360);
      const series = d.svg.querySelector(".gp-view-series");
      if (series)
        series.setAttribute(
          "transform",
          "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ")",
        );
    }
    function gpPointerFinish(e, cancelled) {
      const d = gpDrag;
      if (!d || !d.points.has(e.pointerId)) return;
      d.points.set(e.pointerId, pointOf(e));
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
      if (d.pinch && d.points.size === 2)
        d.finalPinch = [...d.points.values()].map((p) => ({ ...p }));
      d.points.delete(e.pointerId);
      if (d.points.size) return;
      gpDrag = null;
      d.svg.querySelector(".gp-view-series")?.removeAttribute("transform");
      if (cancelled) return;
      if (d.pinch && d.startPinch && d.finalPinch) {
        const initial = gapOf(...d.startPinch),
          final = gapOf(...d.finalPinch);
        if (initial > 18 && final > 18 && Math.abs(initial - final) > 7) {
          const anchor = clip(
            ((d.startPinch[0].x + d.startPinch[1].x) / 2 - d.rect.left) /
              d.rect.width,
            0,
            1,
          );
          navZoom(clip(initial / final, 0.4, 2.5), anchor);
          paint();
        }
        return;
      }
      const start = [...d.starts.values()][0],
        dx = e.clientX - start.x,
        dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) < 6) return;
      navPan(dx, dy, d.rect.width, d.rect.height, st.navMode || "hand");
      paint();
    }
    doc.addEventListener("pointerdown", gpPointerDown, true);
    doc.addEventListener("pointermove", gpPointerMove, {
      capture: true,
      passive: false,
    });
    doc.addEventListener("pointerup", (e) => gpPointerFinish(e, false), true);
    doc.addEventListener(
      "pointercancel",
      (e) => gpPointerFinish(e, true),
      true,
    );
    root.addEventListener("blur", () => {
      gpDrag?.svg
        ?.querySelector(".gp-view-series")
        ?.removeAttribute("transform");
      gpDrag = null;
    });
    doc.addEventListener(
      "wheel",
      (e) => {
        const svgEl = e.target.closest?.("#v421-gp .gp-svg");
        if (!(e.ctrlKey || e.metaKey) || !svgEl) return;
        const rect = svgEl.getBoundingClientRect();
        if (e.cancelable) e.preventDefault();
        e.stopImmediatePropagation();
        navZoom(
          e.deltaY < 0 ? 0.85 : 1.18,
          clip((e.clientX - rect.left) / Math.max(20, rect.width), 0, 1),
        );
        paint();
      },
      { capture: true, passive: false },
    );

    // acompanhamento (Track) por toque ou mouse
    function track(ev) {
      const svgEl = ev.target.closest?.("#v421-gp .gp-svg");
      if (!svgEl || !lastGeom) return;
      const pt = ev.touches ? ev.touches[0] : ev;
      const r = svgEl.getBoundingClientRect();
      const G = lastGeom;
      const vx = ((pt.clientX - r.left) / r.width) * G.W;
      let i = Math.round(((vx - G.L) / (G.W - G.L - G.R)) * (G.xs.length - 1));
      i = Math.max(0, Math.min(G.xs.length - 1, i));
      const x = G.X(i);
      const c = svgEl.querySelector(".gp-cross");
      c.hidden = false;
      c.querySelector(".gp-cv").setAttribute(
        "d",
        `M${x.toFixed(1)} ${G.T}V${G.T + G.chh}`,
      );
      const d = new Date(G.xs[i] * 1000).toLocaleString(
        "pt-BR",
        ivOf() === "1d"
          ? { day: "2-digit", month: "2-digit", year: "numeric" }
          : {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            },
      );
      const va = G.A[i][4],
        vb = G.B?.[i]?.[1]?.[4];
      const txt = `${d} · ${st.a} ${nf(va)}${vb != null ? " · " + st.b + " " + nf(vb) : ""}`;
      const tEl = c.querySelector(".gp-ct");
      tEl.textContent = txt;
      const w = Math.min(G.W - 20, txt.length * 6.6 + 16);
      let bx = x + 10;
      if (bx + w > G.W - G.R) bx = x - 10 - w;
      tEl.setAttribute("x", (bx + 8).toFixed(1));
      tEl.setAttribute("y", (G.T + G.chh - 12).toFixed(1));
      const box = c.querySelector(".gp-cbox");
      box.setAttribute("x", bx.toFixed(1));
      box.setAttribute("y", (G.T + G.chh - 28).toFixed(1));
      box.setAttribute("width", w.toFixed(1));
      box.setAttribute("height", "22");
    }
    doc.addEventListener("pointermove", track, { passive: true });
    doc.addEventListener(
      "touchmove",
      (e) => {
        if (e.target.closest?.("#v421-gp .gp-svg")) track(e);
      },
      { passive: true },
    );
    doc.addEventListener(
      "pointerleave",
      (e) => {
        const c = doc.querySelector("#v421-gp .gp-cross");
        if (c && e.target === doc.documentElement) c.hidden = true;
      },
      true,
    );

    /* ---------- montagem ---------- */
    function hook() {
      if (typeof root.render0 !== "function" || root.render0.__v421)
        return false;
      const prev = root.render0;
      const f = function () {
        const o = prev.apply(this, arguments);
        try {
          mount();
        } catch (e) {
          console.warn("v421", e);
        }
        return o;
      };
      f.__v421 = 1;
      root.render0 = f;
      return true;
    }
    hook();
    // o painel do Terminal é montado de forma assíncrona; confere só enquanto a aba Terminal estiver aberta
    setInterval(() => {
      if (doc.hidden) return;
      if (
        g(() => tab, "") === "term" ||
        g(() => root.V428_gpHost && root.V428_gpHost(), null)
      ) {
        if (!root.render0?.__v421) hook();
        mount();
      }
    }, 1200);
    // atualiza o preço do cabeçalho e o gráfico sem redesenhar a página
    setInterval(() => {
      if (
        !doc.hidden &&
        g(() => tab, "") === "term" &&
        doc.getElementById("v421-gp")
      )
        load(false);
    }, 60000);
    root.DIARIO_GP421 = {
      paint,
      load,
      state: () => st,
      view: () => ({ ...gpView }),
      reset: navReset,
    };
  })(window);
} catch (e) {
  console.error("[v522] falha em terminal-gp-v421.js", e);
}
try {
  (function (l) {
    "use strict";
    const i = l.document;
    if (!i) return;
    const p = (t, a) => {
        try {
          const e = t();
          return e === void 0 ? a : e;
        } catch {
          return a;
        }
      },
      m = (t) =>
        String(t ?? "").replace(
          /[&<>"']/g,
          (a) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[a],
        ),
      s = (t) =>
        Number.isFinite(+t)
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            }).format(+t)
          : "—",
      c = (t) =>
        +String(t || "")
          .replace(/\./g, "")
          .replace(",", ".") || 0;
    function u() {
      if (typeof l.onbHtml != "function" || l.onbHtml.__v423) return;
      const t = l.onbHtml,
        a = function () {
          let e = t.apply(this, arguments);
          return (
            (e = e
              .replace(
                'data-onb="cap" placeholder="10000"',
                'data-onb="cap" placeholder="ex.: 10.000"',
              )
              .replace(
                'data-onb="pd" placeholder="200"',
                'data-onb="pd" placeholder="automático"',
              )
              .replace(
                /(<label>Máximo de trades no dia<input[^>]*><\/label><\/div>)/,
                '$1<p class="v423-onbhint" id="v423-onbhint" aria-live="polite"></p>',
              )),
            e
          );
        };
      ((a.__v423 = 1), (l.onbHtml = a));
    }
    function I() {
      const t = i.getElementById("onb");
      if (!t) return;
      const a = t.querySelector('input[data-onb="cap"]'),
        e = t.querySelector('input[data-onb="pd"]'),
        o = t.querySelector('input[data-onb="nt"]');
      if (
        (a && a.placeholder === "10000" && (a.placeholder = "ex.: 10.000"),
        e && e.placeholder === "200" && (e.placeholder = "automático"),
        o && !i.getElementById("v423-onbhint"))
      ) {
        const n = i.createElement("p");
        ((n.className = "v423-onbhint"),
          (n.id = "v423-onbhint"),
          n.setAttribute("aria-live", "polite"),
          (o.closest(".g2") || o.parentElement).after(n));
      }
    }
    function f() {
      I();
      const t = i.getElementById("onb"),
        a = i.getElementById("v423-onbhint");
      if (!t || !a) return;
      const e = (L) => t.querySelector(`input[data-onb="${L}"]`)?.value,
        o = c(e("cap")) || 1e4,
        n = Math.min(c(e("pct")) || 1, 10),
        r = Math.round(c(e("nt")) || 3),
        A = c(e("pd")),
        E = ((o * n) / 100) * r;
      a.innerHTML =
        A > 0
          ? `O dia trava ao perder <b>${s(A)}</b>. Risco por trade: <b>${s((o * n) / 100)}</b>.`
          : `Sem perda máxima preenchida, o app usa <b>${s(E)}</b> por dia (${s((o * n) / 100)} de risco × ${r} trades)${c(e("cap")) ? "" : ", com capital de exemplo de R$ 10.000"}.`;
    }
    i.addEventListener("input", (t) => {
      t.target.closest?.("#onb [data-onb]") && f();
    });
    function b() {
      const t = [],
        a = p(() => loc().slice(0, 10), new Date().toISOString().slice(0, 10));
      try {
        const e = pHoje(),
          o = pCore(e.hj, e.P);
        o.mot.length
          ? t.push({
              k: "r",
              ic: "⛔",
              t: "Pare por hoje",
              d: o.mot.join(" · "),
              go: "dia",
            })
          : o.perda >= o.lim * 0.8 &&
            t.push({
              k: "a",
              ic: "⚠️",
              t: "Perto do limite de perda",
              d: `Perda ${s(o.perda)} de ${s(o.lim)}`,
              go: "dia",
            });
      } catch {}
      try {
        if (turnoNv(a) !== "g") {
          const e = turnoTxt(a);
          e &&
            t.push({
              k: "a",
              ic: "🏭",
              t: "Escala de turno hoje",
              d: e,
              go: "home",
            });
        }
      } catch {}
      try {
        const e = S.rules || [],
          o = (S.days[a] || {}).chk || {},
          n = e.filter((r) => o[r.id]).length;
        e.length &&
          n < e.length &&
          t.push({
            k: "i",
            ic: "☑️",
            t: "Checklist do dia",
            d: `${n} de ${e.length} regras marcadas`,
            go: "dia",
          });
      } catch {}
      try {
        const e = S.ax?.alpx || [],
          o = e.filter(
            (r) =>
              r.fired &&
              String(new Date(r.fired).toISOString()).slice(0, 10) === a,
          ),
          n = e.filter((r) => !r.fired);
        (o.forEach((r) =>
          t.push({
            k: "g",
            ic: "🔔",
            t: `Alerta disparou: ${r.c}`,
            d: `${r.op === ">" ? "acima de" : "abaixo de"} ${r.v}`,
            mkt: "cq",
          }),
        ),
          n.length &&
            t.push({
              k: "i",
              ic: "🔔",
              t: "Alertas de preço ativos",
              d: `${n.length} esperando`,
              mkt: "cq",
            }));
      } catch {}
      try {
        const e = Date.now();
        (AG.v[0]?.eventos || [])
          .filter(
            (n) =>
              n.imp === 1 &&
              Date.parse(n.em) > e - 30 * 6e4 &&
              String(n.em).slice(0, 10) === a,
          )
          .sort((n, r) => Date.parse(n.em) - Date.parse(r.em))
          .slice(0, 4)
          .forEach((n) =>
            t.push({
              k: "i",
              ic: "📅",
              t:
                new Date(n.em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                }) +
                " · " +
                (n.t || "Evento"),
              d: (n.p ? n.p + " · " : "") + "alto impacto",
              mkt: "ag",
            }),
          );
      } catch {}
      try {
        const e = +new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            hour12: !1,
          }).format(new Date()),
          o = S.days[a] || {},
          n = (S.trades || []).some(
            (r) => String(r.dt || "").slice(0, 10) === a,
          );
        e >= 18 &&
          n &&
          !o.resumo &&
          t.push({
            k: "i",
            ic: "📝",
            t: "Debriefing pendente",
            d: "Você operou hoje e ainda não fechou o dia",
            deb: 1,
          });
      } catch {}
      return t;
    }
    function h() {
      const t = b();
      let a = i.getElementById("v423-bell");
      (a ||
        ((a = i.createElement("div")),
        (a.id = "v423-bell"),
        (a.className = "v423-bell"),
        a.setAttribute("role", "dialog"),
        a.setAttribute("aria-modal", "true"),
        a.setAttribute("aria-label", "Avisos"),
        i.body.appendChild(a)),
        (a.innerHTML = `<button type="button" class="v423-bell-bg" data-v423-close aria-label="Fechar avisos"></button><section class="v423-bell-panel"><header><h2>Avisos de hoje</h2><button type="button" data-v423-close aria-label="Fechar">✕</button></header>
   ${t.length ? `<ul>${t.map((e) => `<li class="v423-${e.k}"><button type="button" ${e.go ? `data-v423-go="${e.go}"` : e.mkt ? `data-v423-mkt="${e.mkt}"` : e.deb ? 'data-v423-deb="1"' : ""}><span class="ic" aria-hidden="true">${e.ic}</span><span><b>${m(e.t)}</b><small>${m(e.d)}</small></span><i aria-hidden="true">›</i></button></li>`).join("")}</ul>` : '<p class="v423-none">Nenhum aviso agora. Tudo dentro do plano.</p>'}
   <footer><button type="button" data-v423-go="mais">Configurar alertas e notificações</button></footer></section>`),
        (a.hidden = !1),
        i.body.classList.add("v423-bell-open"),
        a
          .querySelector(".v423-bell-panel button")
          ?.focus({ preventScroll: !0 }));
    }
    function d() {
      const t = i.getElementById("v423-bell");
      (t && (t.hidden = !0), i.body.classList.remove("v423-bell-open"));
    }
    function v() {
      const t = i.querySelector('[aria-label="Abrir notificações"]');
      if (!t) return;
      const a = p(
        () =>
          b().filter((e) => e.k === "r" || e.k === "a" || e.k === "g").length,
        0,
      );
      (t.classList.toggle("v423-has", a > 0),
        t.setAttribute("aria-label", "Abrir notificações"),
        (t.title = a ? `${a} aviso(s) importante(s)` : "Avisos"));
    }
    (l.addEventListener(
      "click",
      (t) => {
        if (t.target.closest?.('[aria-label="Abrir notificações"]')) {
          (t.preventDefault(), t.stopImmediatePropagation(), h());
          return;
        }
        if (!t.target.closest?.("#v423-bell")) return;
        if (t.target.closest("[data-v423-close]")) {
          (t.preventDefault(), d());
          return;
        }
        const o = t.target.closest("[data-v423-go]");
        if (o) {
          (t.preventDefault(), t.stopImmediatePropagation(), d());
          try {
            (irPara(o.dataset.v423Go), scrollTo(0, 0));
          } catch {}
          return;
        }
        const n = t.target.closest("[data-v423-mkt]");
        if (n) {
          (t.preventDefault(), t.stopImmediatePropagation(), d());
          try {
            (l.DIARIO_NAV?.navigate
              ? l.DIARIO_NAV.navigate("mercado:" + n.dataset.v423Mkt)
              : (irPara("mercado:" + n.dataset.v423Mkt)),
              scrollTo(0, 0));
          } catch {}
          return;
        }
        if (t.target.closest("[data-v423-deb]")) {
          (t.preventDefault(), t.stopImmediatePropagation(), d());
          try {
            (GOR.deb(), scrollTo(0, 0));
          } catch {}
        }
      },
      !0,
    ),
      i.addEventListener("keydown", (t) => {
        t.key === "Escape" &&
          i.body.classList.contains("v423-bell-open") &&
          d();
      }));
    function g() {
      p(() => tab, "") === "term" &&
        i.querySelectorAll("#app .trbar .trbtn").forEach((t) => {
          if (t.dataset.v423) return;
          const a = (t.textContent || "").trim();
          /^\+\s*Painel$/i.test(a)
            ? ((t.dataset.v423 = "1"),
              t.setAttribute("aria-label", "Novo painel"),
              (t.innerHTML =
                '<span class="v423-short">+</span><span class="v423-long">+ Painel</span>'))
            : /Menu$/i.test(a) &&
              ((t.dataset.v423 = "1"),
              t.setAttribute("aria-label", "Menu do Terminal"),
              (t.innerHTML =
                '<span class="v423-short">☰</span><span class="v423-long">☰ Menu</span>'));
        });
    }
    function y() {
      (u(), f(), v(), g());
    }
    function k() {
      if (typeof l.render0 != "function" || l.render0.__v423) return !1;
      const t = l.render0,
        a = function () {
          const e = t.apply(this, arguments);
          try {
            y();
          } catch {}
          return e;
        };
      return ((a.__v423 = 1), (l.render0 = a), !0);
    }
    (u(), k());
    let $ = 0;
    const D = setInterval(() => {
      ($++, u(), k());
      try {
        y();
      } catch {}
      $ > 10 && clearInterval(D);
    }, 700);
    (setInterval(() => {
      if (!i.hidden)
        try {
          (v(), g());
        } catch {}
    }, 2e4),
      (l.DIARIO_V423 = { items: b, panel: h }));
  })(window);
} catch (e) {
  console.error("[v522] falha em acabamento-v423.js", e);
}
try {
  (function (i) {
    "use strict";
    const a = i.document;
    if (!a) return;
    const p = (e, t) => {
        try {
          const n = e();
          return n === void 0 ? t : n;
        } catch {
          return t;
        }
      },
      M = (e) =>
        String(e || "")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
    function h(e) {
      if (!Array.isArray(e) || e.length < 2) return null;
      const t = new Map(),
        n = [];
      for (const o of e) {
        if (!o || typeof o != "object") continue;
        const c = M(o.t) ? (o.cat ?? "") + "|" + M(o.t) : "\0" + n.length;
        (t.has(c) || (t.set(c, []), n.push(c)), t.get(c).push(o));
      }
      const s = {},
        r = [];
      for (const o of n) {
        const c = t.get(o),
          u = c.reduce((l, f) => (String(f.id) < String(l.id) ? f : l));
        for (const l of c)
          if (l !== u) {
            l.id !== u.id && (s[l.id] = u.id);
            for (const [f, O] of Object.entries(l))
              u[f] == null && O != null && (u[f] = O);
          }
        r.push(u);
      }
      return Object.keys(s).length || r.length !== e.length
        ? { lista: r, mapa: s }
        : null;
    }
    function L(e, t) {
      if (!e || typeof e != "object") return !1;
      let n = !1;
      for (const [s, r] of Object.entries(t))
        s in e &&
          (e[s] ? (e[r] = !0) : r in e || (e[r] = e[s]), delete e[s], (n = !0));
      return n;
    }
    let y = !1;
    function d() {
      if (y || typeof S != "object" || !S) return 0;
      y = !0;
      try {
        let e = 0;
        const t = Date.now(),
          n = h(S.rules),
          s = h(S.rulesUS);
        if (!n && !s) return 0;
        if (n) {
          ((S.rules = n.lista),
            (e += Object.keys(n.mapa).length),
            (S.del = S.del || {}));
          for (const r of Object.keys(n.mapa))
            S.del[r] = Math.max(+S.del[r] || 0, t);
        }
        s && ((S.rulesUS = s.lista), (e += Object.keys(s.mapa).length));
        for (const r of Object.values(S.days || {})) {
          if (!r || typeof r != "object") continue;
          let o = !1;
          (n && L(r.chk, n.mapa) && (o = !0),
            s && r.us && L(r.us.chk, s.mapa) && (o = !0),
            o && (r.u = Math.max(+r.u || 0, t)));
        }
        S.mt = t;
        try {
          save();
        } catch {
          try {
            persist();
          } catch {}
        }
        try {
          console.info("[v427] regras repetidas unidas:", e);
        } catch {}
        return e;
      } finally {
        y = !1;
      }
    }
    function T() {
      if (typeof i.mergeIn != "function" || i.mergeIn.__v427) return;
      const e = i.mergeIn,
        t = function () {
          const n = e.apply(this, arguments);
          try {
            setTimeout(d, 0);
          } catch {}
          return n;
        };
      t.__v427 = 1;
      try {
        i.mergeIn = t;
      } catch {}
    }
    const _ =
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
      B =
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
    function C() {
      const e = a.getElementById("privb");
      if (!e) return !1;
      const t = e.getAttribute("aria-pressed");
      return t != null
        ? t === "true"
        : /mostrar/i.test(e.getAttribute("aria-label") || "") ||
            a.body.classList.contains("priv") ||
            a.documentElement.classList.contains("priv");
    }
    function m() {
      const e = a.querySelector(".dt393-topbar .dt393-topactions");
      if (!e || !a.getElementById("privb")) return;
      let t = e.querySelector(".v427-eye");
      t ||
        ((t = a.createElement("button")),
        (t.type = "button"),
        (t.className = "v427-eye"),
        e.insertBefore(t, e.firstChild));
      const n = C(),
        s = n ? "1" : "0";
      (t.dataset.s !== s && ((t.dataset.s = s), (t.innerHTML = n ? B : _)),
        t.setAttribute(
          "aria-label",
          n ? "Mostrar valores" : "Esconder valores",
        ),
        t.setAttribute("aria-pressed", n ? "true" : "false"),
        (t.title = n ? "Mostrar valores" : "Esconder valores"),
        a.body.classList.add("v427-eye-top"));
    }
    a.addEventListener("click", (e) => {
      if (!e.target.closest?.(".v427-eye")) return;
      e.preventDefault();
      const n = a.getElementById("privb");
      (n && n.click(), setTimeout(m, 30), setTimeout(m, 300));
    });
    let g = 0,
      b = !1;
    function x() {
      b ||
        ((b = !0),
        requestAnimationFrame(() => {
          b = !1;
          const e = i.scrollY || a.documentElement.scrollTop || 0,
            t = e > g + 6,
            n = e < g - 6;
          (e < 80
            ? a.body.classList.remove("v427-fab-hide")
            : t
              ? a.body.classList.add("v427-fab-hide")
              : n && a.body.classList.remove("v427-fab-hide"),
            (t || n || e < 80) && (g = e));
        }));
    }
    i.addEventListener("scroll", x, { passive: !0 });
    let I = 0;
    function E() {
      if (
        !(
          typeof i.turnoPushSync != "function" &&
          typeof turnoPushSync != "function"
        )
      ) {
        try {
          typeof trvMarca == "function" &&
            typeof travaEstado == "function" &&
            trvMarca(travaEstado());
        } catch {}
        (clearTimeout(I),
          (I = setTimeout(() => {
            try {
              turnoPushSync(!1);
            } catch {}
          }, 1200)));
      }
    }
    a.addEventListener("click", (e) => {
      e.target.closest?.('[data-a="savetrade"],[data-trv="ok"]') &&
        setTimeout(E, 400);
    });
    const k = i.matchMedia
      ? i.matchMedia("(prefers-color-scheme: light)")
      : null;
    function q() {
      return (
        p(() => ls.get("diario-theme"), null) ||
        p(() => JSON.parse(localStorage.getItem("diario-theme")), null) ||
        "auto"
      );
    }
    function v() {
      const t = q() === "light",
        n = p(() => tab, "") === "term",
        s = t && !n,
        r = a.documentElement;
      if (s) {
        if (!a.getElementById("v427-claro-css")) {
          const c = a.createElement("link");
          ((c.id = "v427-claro-css"),
            (c.rel = "stylesheet"),
            (c.href = "tema-claro-v427.css?v=427"),
            a.head.appendChild(c));
        }
        r.getAttribute("data-v427-tema") !== "claro" &&
          r.setAttribute("data-v427-tema", "claro");
      } else
        r.hasAttribute("data-v427-tema") && r.removeAttribute("data-v427-tema");
      const o = a.querySelector('meta[name="theme-color"]');
      if (o) {
        const c = s ? "#efeeeb" : "#09090a";
        o.content !== c && (o.content = c);
      }
    }
    (k && k.addEventListener && k.addEventListener("change", v),
      a.addEventListener("click", (e) => {
        e.target.closest?.('[data-a="theme"]') && setTimeout(v, 30);
      }),
      v());
    function j() {
      (m(), v());
    }
    function D() {
      if (typeof i.render0 != "function" || i.render0.__v427) return !1;
      const e = i.render0,
        t = function () {
          const n = e.apply(this, arguments);
          try {
            j();
          } catch {}
          return n;
        };
      return ((t.__v427 = 1), (i.render0 = t), !0);
    }
    function w() {
      (T(), D());
      try {
        d();
      } catch {}
      try {
        j();
      } catch {}
    }
    w();
    let A = 0;
    const F = setInterval(() => {
      (A++, w(), A > 12 && clearInterval(F));
    }, 700);
    (setInterval(() => {
      if (!a.hidden)
        try {
          (d(), E());
        } catch {}
    }, 6e4),
      (i.DIARIO_V427 = {
        dedupeRules: d,
        dedupeList: h,
        eyeButton: m,
        travaPush: E,
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em acabamento-v427.js", e);
}
try {
  (function (i) {
    "use strict";
    const r = i.document;
    if (!r) return;
    const g = (t, e) => {
        try {
          const a = t();
          return a === void 0 ? e : a;
        } catch {
          return e;
        }
      },
      m = (t) =>
        String(t ?? "").replace(
          /[&<>"']/g,
          (e) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[e],
        ),
      p = {
        get: (t, e) => {
          try {
            const a = JSON.parse(localStorage.getItem(t));
            return a ?? e;
          } catch {
            return e;
          }
        },
        set: (t, e) => {
          try {
            localStorage.setItem(t, JSON.stringify(e));
          } catch {}
        },
      },
      f = {
        HOME: { t: "Comparativo de Ativos", m: "GP", def: null },
        GP: {
          t: "Gráfico de Preço",
          m: "GP",
          def: { a: "IBOV", b: "", mode: "dual", per: "1A", ev: !0, table: !1 },
        },
        GLOBAL: {
          t: "Radar Global",
          m: "WEI",
          def: { a: "IBOV", b: "SPX", mode: "base", per: "6M", table: !1 },
        },
        MON: {
          t: "Fluxo e Monitor",
          m: "MON",
          def: { a: "EWZ", b: "IBOV", mode: "base", per: "1M", table: !1 },
        },
        NEWSBR: {
          t: "Notícias do Dia",
          m: "TOP",
          def: { a: "IBOV", b: "USDBRL", mode: "dual", per: "1D", table: !1 },
        },
        DIFUT: {
          t: "Juros e Curva DI",
          m: "DI",
          def: {
            a: "USDBRL",
            b: "BC:SELIC",
            mode: "dual",
            per: "2A",
            table: !1,
          },
        },
        ECO: {
          t: "Agenda Econômica",
          m: "ECO",
          def: {
            a: "IBOV",
            b: "BC:IPCA12",
            mode: "dual",
            per: "1A",
            ev: !0,
            table: !1,
          },
        },
      },
      M = {
        fav: { a: "IBOV", b: "SPX" },
        fut: { a: "IBOV", b: "SPX" },
        idx: { a: "IBOV", b: "SPX" },
        br: { a: "IBOV", b: "EWZ" },
        us: { a: "SPX", b: "NDX" },
        adr: { a: "EWZ", b: "IBOV" },
        fx: { a: "USDBRL", b: "DXY" },
        cmd: { a: "BRENT", b: "OURO" },
        cri: { a: "BTCUSD", b: "NDX" },
        jur: { a: "USDBRL", b: "BC:SELIC" },
      },
      P = {
        fav: "Desempenho dos Favoritos",
        fut: "Desempenho dos Futuros",
        idx: "Desempenho dos Índices",
        br: "Desempenho das Ações BR",
        us: "Desempenho do Setor EUA",
        adr: "Desempenho das ADRs",
        fx: "Desempenho das Moedas",
        cmd: "Desempenho das Commodities",
        cri: "Desempenho das Criptos",
        jur: "Juros × Câmbio",
      };
    let s = p.get("diario-v428-tpage", "HOME");
    f[s] || (s = "HOME");
    const d = p.get("diario-v428-ctx", {});
    let l = null,
      v = !1;
    const b = () => g(() => tab, ""),
      E = () =>
        b() === "term" &&
        r.body.classList.contains("tf413-home") &&
        !!r.getElementById("tf413"),
      h = () =>
        b() === "mercado" &&
        g(() => MKT.tab, "") === "cq" &&
        !!r.querySelector("#cotbox");
    function y() {
      return E() ? "T:" + s : h() ? "M:" + g(() => CQ.aba, "fut") : null;
    }
    const D = (t) => ({
      a: t.a,
      b: t.b,
      mode: t.mode,
      per: t.per,
      freq: t.freq,
      ma: t.ma,
      ev: t.ev,
      table: t.table,
    });
    function V(t) {
      return t.startsWith("T:")
        ? f[t.slice(2)]?.def || null
        : { ...(M[t.slice(2)] || M.fut), mode: "base", per: "1A", table: !1 };
    }
    function I() {
      const t = y(),
        e = i.DIARIO_V421;
      if (!t || !e || t === l) return;
      (d["T:HOME"] || (d["T:HOME"] = D(e.get())),
        l && (d[l] = D(e.get())),
        (l = t));
      const a = d[t] || V(t);
      (a && e.set(a), p.set("diario-v428-ctx", d), u());
    }
    ((i.V428_gpHost = function () {
      if (!h()) return null;
      const t =
        r.querySelector("#cotbox .m409-chart-card") ||
        r.querySelector("#cotbox .m408-workspace");
      return t ? { ref: t } : null;
    }),
      (i.V428_gpMounted = function () {
        setTimeout(() => {
          (I(), u());
        }, 0);
      }));
    const q = { "1D": 1, "3D": 3, "1M": 31, "6M": 183, "1A": 366, "2A": 731 };
    function B(t) {
      return t.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    function w(t) {
      const e = new Date();
      let a;
      if (t === "YTD") a = new Date(e.getFullYear(), 0, 1);
      else {
        if (t === "Máx") return ["início", "hoje"];
        a = new Date(Date.now() - (q[t] || 366) * 864e5);
      }
      return [B(a), B(e)];
    }
    const R =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>';
    function H() {
      const t = l || y() || "";
      if (t.startsWith("M:"))
        return { t: P[t.slice(2)] || "Desempenho", m: "COMP" };
      const e = f[s] || f.HOME;
      return { t: e.t, m: e.m };
    }
    function u() {
      const t = r.getElementById("v421-gp");
      if (!t) return;
      const e = g(() => i.DIARIO_V421.get(), { per: "1A" }),
        { t: a, m: n } = H();
      let o = t.querySelector(".t428-title");
      (o ||
        ((o = r.createElement("div")),
        (o.className = "t428-title"),
        (o.innerHTML = `<button type="button" class="t428-name" data-t428-presets aria-haspopup="true" aria-label="Escolher um gráfico pronto">${R}<b></b><span aria-hidden="true">▾</span></button><span class="t428-mn"></span><button type="button" class="t428-ic" data-gp="full" aria-label="Ampliar o gráfico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button><button type="button" class="t428-ic" data-gp="help" aria-label="Ajuda do gráfico"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>`),
        t.prepend(o)),
        (o.querySelector("b").textContent = a),
        (o.querySelector(".t428-mn").textContent = n + " <GO>"));
      let c = t.querySelector(".t428-range");
      c ||
        ((c = r.createElement("div")),
        (c.className = "t428-range"),
        o.after(c));
      const [T, x] = w(e.per),
        k = T + "|" + x;
      c.dataset.s !== k &&
        ((c.dataset.s = k),
        (c.innerHTML = `<span>Período</span><i>${m(T)}</i><em>–</em><i>${m(x)}</i>`));
    }
    (r.addEventListener("click", (t) => {
      if (t.target.closest?.("[data-t428-presets]")) {
        (t.preventDefault(), t.stopPropagation());
        const a = r.querySelector('#v421-gp .gp-bar1 [data-gp="presets"]');
        a && setTimeout(() => a.click(), 0);
        return;
      }
      t.target.closest?.("#v421-gp") && setTimeout(u, 60);
    }),
      r.addEventListener("change", (t) => {
        t.target.closest?.("#v421-gp") && setTimeout(u, 60);
      }));
    function O() {
      r.querySelectorAll("#tf413 [data-tf415-nav]").forEach((t) => {
        const e = t.dataset.tf415Nav,
          a = E() ? e === s : e === "WORKSPACES";
        (t.classList.toggle("on", a),
          a
            ? t.setAttribute("aria-current", "page")
            : t.removeAttribute("aria-current"));
      });
    }
    function N() {
      const t = r.getElementById("tf413");
      if (!t) return;
      const e = t.querySelector(".tf413-layout");
      if (!e) return;
      let a = t.querySelector(".t428-adv");
      if (s === "HOME") {
        a?.remove();
        return;
      }
      const n = f[s];
      a ||
        ((a = r.createElement("div")), (a.className = "t428-adv"), e.after(a));
      const o = s;
      a.dataset.p !== o &&
        ((a.dataset.p = o),
        (a.innerHTML = `<div><b>Painel avançado ${m(n.m)}</b><small>A versão completa por comandos, com mais colunas, filtros e exportação (CSV).</small></div><button type="button" data-t428-adv="${m(s)}">Abrir painel avançado</button>`));
    }
    function S() {
      const t = r.getElementById("tf413");
      if (!E()) {
        r.body.removeAttribute("data-t428");
        return;
      }
      (r.body.setAttribute("data-t428", s),
        t &&
          ([...t.classList]
            .filter((e) => e.startsWith("t428-p-"))
            .forEach((e) => t.classList.remove(e)),
          t.classList.add("t428-p-" + s)),
        O(),
        N(),
        I(),
        u());
    }
    (i.addEventListener(
      "click",
      (t) => {
        if (v) return;
        const e = t.target.closest?.("[data-t428-adv]");
        if (e) {
          (t.preventDefault(), t.stopImmediatePropagation());
          const o = e.dataset.t428Adv,
            c = r.querySelector(`#tf413 [data-tf415-nav="${o}"]`);
          if (c) {
            v = !0;
            try {
              c.click();
            } finally {
              v = !1;
            }
          }
          (r.body.removeAttribute("data-t428"), setTimeout(O, 60));
          return;
        }
        const a = t.target.closest?.("#tf413 [data-tf415-nav]");
        if (!a) return;
        const n = a.dataset.tf415Nav;
        if (n === "WORKSPACES") {
          (r.body.removeAttribute("data-t428"), setTimeout(O, 60));
          return;
        }
        if (f[n]) {
          if (((s = n), p.set("diario-v428-tpage", s), n === "HOME")) {
            setTimeout(S, 40);
            return;
          }
          if (
            (t.preventDefault(),
            t.stopImmediatePropagation(),
            !r.body.classList.contains("tf413-home"))
          ) {
            const o = r.querySelector('#tf413 [data-tf415-nav="HOME"]');
            if (o) {
              v = !0;
              try {
                o.click();
              } finally {
                v = !1;
              }
            }
          }
          (setTimeout(S, 40),
            setTimeout(
              () =>
                r.getElementById("tf413")?.scrollIntoView({ block: "start" }),
              60,
            ));
        }
      },
      !0,
    ),
      r.addEventListener("click", (t) => {
        const e = t.target.closest?.("body.v428-cot #cotbox .m403-source-note");
        e && e.classList.toggle("v428-open");
      }));
    function _() {
      if (b() === "estudos") r.body.classList.remove("v428-chips");
    }
    function A() {
      try {
        _();
      } catch {}
      if (
        (b() === "term" ? S() : r.body.removeAttribute("data-t428"),
        h()
          ? (r.body.classList.add("v428-cot"), I(), u())
          : r.body.classList.remove("v428-cot"),
        !y() && l)
      ) {
        const t = i.DIARIO_V421;
        (t && ((d[l] = D(t.get())), p.set("diario-v428-ctx", d)), (l = null));
      }
    }
    function C() {
      if (typeof i.render0 != "function" || i.render0.__v428) return !1;
      const t = i.render0,
        e = function () {
          const a = t.apply(this, arguments);
          try {
            A();
          } catch (n) {
            console.warn("v428", n);
          }
          return a;
        };
      return ((e.__v428 = 1), (i.render0 = e), !0);
    }
    C();
    let L = 0;
    const W = setInterval(() => {
      (L++, C());
      try {
        A();
      } catch {}
      L > 15 && clearInterval(W);
    }, 700);
    (setInterval(() => {
      if (!r.hidden)
        try {
          (b() === "term" || h()) && A();
        } catch {}
    }, 1500),
      (i.DIARIO_V428 = {
        get page() {
          return s;
        },
        applyPage: S,
        decorate: u,
        context: y,
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em bloomberg-v428.js", e);
}
try {
  (function (A) {
    "use strict";
    const m = A.document;
    if (!m) return;
    const y = (t, e) => {
        try {
          const n = t();
          return n === void 0 ? e : n;
        } catch {
          return e;
        }
      },
      s = 1080,
      d = 1350,
      j = "#0e0f10",
      nt = "#1d1e21",
      v = "#cfab69",
      x = "#ffffff",
      R = "#37a56e",
      b = "#e76653",
      G = "#b6b9bf",
      h =
        '"HelveticaNeue-CondensedBlack","Helvetica Neue Condensed Black","Arial Narrow Bold","Roboto Condensed","Oswald",Impact,"Arial Black",sans-serif',
      E = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
      lt = [
        ["^BVSP", "IBOVESPA", 0],
        ["^GSPC", "S&P 500", 0],
        ["^IXIC", "NASDAQ", 0],
        ["ES=F", "S&P FUTURO", 0],
        ["NQ=F", "NASDAQ FUTURO", 0],
        ["BRL=X", "DÓLAR", 4],
        ["DX-Y.NYB", "DXY", 2],
        ["BZ=F", "PETRÓLEO", 2],
        ["GC=F", "OURO", 0],
        ["BTC-USD", "BITCOIN", 0],
        ["ETH-USD", "ETHEREUM", 0],
        ["TIO=F", "MINÉRIO", 2],
        ["^N225", "NIKKEI", 0],
        ["^GDAXI", "DAX", 0],
      ];
    function at(t) {
      return y(() => {
        const e = A.imgQ ? A.imgQ(t) : null;
        return e && Number.isFinite(+e.px)
          ? { px: +e.px, d1: Number.isFinite(+e.d1) ? +e.d1 : null }
          : null;
      }, null);
    }
    function rt() {
      return lt
        .map(([t, e, n]) => ({ s: t, n: e, d: n, q: at(t) }))
        .filter((t) => t.q);
    }
    function _() {
      return y(() => A.jrVer && A.jrVer(), null) || y(() => JRN.v, null);
    }
    const D = (t, e) =>
        Number(t).toLocaleString("pt-BR", {
          minimumFractionDigits: e,
          maximumFractionDigits: e,
        }),
      B = (t) => (t == null ? "—" : (t > 0 ? "+" : "") + D(t, 2) + "%"),
      Q = (t) => t[Math.floor(Math.random() * t.length)];
    function ot() {
      return new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      });
    }
    function I(t, e) {
      const n = t.createLinearGradient(0, 0, s, d);
      (n.addColorStop(0, nt),
        n.addColorStop(0.55, j),
        n.addColorStop(1, "#17181a"),
        (t.fillStyle = n),
        t.fillRect(0, 0, s, d),
        t.save(),
        (t.globalAlpha = 0.14));
      let a = d * 0.42;
      for (let i = 0; i < 46; i++) {
        const o = 20 + i * 23,
          r = a;
        a += (Math.random() - 0.5) * 42;
        const f = Math.min(r, a) - Math.random() * 26,
          p = Math.max(r, a) + Math.random() * 26;
        ((t.strokeStyle = t.fillStyle = a < r ? R : b),
          t.fillRect(o - 1, f, 2, p - f),
          t.fillRect(o - 7, Math.min(r, a), 14, Math.max(4, Math.abs(a - r))));
      }
      (t.restore(),
        t.save(),
        (t.globalAlpha = 0.9),
        [
          [R, 0],
          [v, 26],
          ["#4a7eab", 52],
        ].forEach(([i, o]) => {
          ((t.fillStyle = i),
            t.beginPath(),
            t.moveTo(0, d - 260 + o),
            t.lineTo(170 - o, d),
            t.lineTo(150 - o, d),
            t.lineTo(0, d - 235 + o),
            t.closePath(),
            t.fill(),
            t.beginPath(),
            t.moveTo(s, d - 260 + o),
            t.lineTo(s - 170 + o, d),
            t.lineTo(s - 150 + o, d),
            t.lineTo(s, d - 235 + o),
            t.closePath(),
            t.fill());
        }),
        t.restore());
      const l = t.createRadialGradient(
        s / 2,
        d * 0.45,
        200,
        s / 2,
        d * 0.45,
        900,
      );
      (l.addColorStop(0, "rgba(0,0,0,0)"),
        l.addColorStop(1, "rgba(0,0,0,0.55)"),
        (t.fillStyle = l),
        t.fillRect(0, 0, s, d));
    }
    let L = "Jornal do Pregão";
    function M(t) {
      (t.save(),
        (t.fillStyle = v),
        t.fillRect(s / 2 - 330, d - 70, 200, 2),
        t.fillRect(s / 2 + 130, d - 70, 200, 2),
        (t.fillStyle = x),
        (t.font = `800 30px ${E}`),
        (t.textAlign = "center"),
        t.fillText("DIÁRIO DE TRADER", s / 2, d - 60),
        (t.fillStyle = G),
        (t.font = `500 18px ${E}`),
        t.fillText(
          L + " · " + ot() + " · não é recomendação de investimento",
          s / 2,
          d - 28,
        ),
        t.restore());
    }
    function N(t, e, n, a, l, i, o) {
      const r = String(e || "")
        .toUpperCase()
        .split(/\s+/)
        .filter(Boolean);
      for (let f = a; f >= 40; f -= 4) {
        t.font = `${i} ${f}px ${o}`;
        const p = [];
        let u = "";
        for (const g of r) {
          const $ = u ? u + " " + g : g;
          t.measureText($).width > n && u ? (p.push(u), (u = g)) : (u = $);
        }
        if (
          (u && p.push(u),
          p.length <= l && p.every((g) => t.measureText(g).width <= n))
        )
          return { s: f, linhas: p };
      }
      return (
        (t.font = `${i} 40px ${o}`),
        { s: 40, linhas: [String(e).toUpperCase().slice(0, 60)] }
      );
    }
    function T(t, e, n, a, l = 150, i = 2) {
      const o = N(t, e, s - 140, l, i, "900", h);
      return (
        t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = a),
        (t.shadowColor = "rgba(0,0,0,0.55)"),
        (t.shadowBlur = 18),
        (t.font = `900 ${o.s}px ${h}`),
        o.linhas.forEach((r, f) => t.fillText(r, s / 2, n + f * o.s * 1.02)),
        t.restore(),
        n + o.linhas.length * o.s * 1.02
      );
    }
    function J(t, e, n, a = 3) {
      if (!e) return n;
      (t.save(),
        (t.fillStyle = "#e7e5e2"),
        (t.textAlign = "center"),
        (t.font = `500 30px ${E}`));
      const l = String(e).split(/\s+/),
        i = [];
      let o = "";
      for (const r of l) {
        const f = o ? o + " " + r : r;
        t.measureText(f).width > s - 200 && o ? (i.push(o), (o = r)) : (o = f);
      }
      return (
        o && i.push(o),
        i
          .slice(0, a)
          .forEach((r, f) =>
            t.fillText(
              f === a - 1 && i.length > a ? r + "…" : r,
              s / 2,
              n + f * 42,
            ),
          ),
        t.restore(),
        n + Math.min(i.length, a) * 42
      );
    }
    function Y(t, e, n, a, l, i) {
      (t.save(),
        (t.strokeStyle = i ? R : b),
        (t.lineWidth = 6),
        (t.lineJoin = "round"),
        (t.shadowColor = i ? R : b),
        (t.shadowBlur = 16),
        t.beginPath());
      let o = i ? n + l * 0.8 : n + l * 0.2;
      for (let r = 0; r <= 14; r++) {
        const f = e + (r * a) / 14;
        ((o += (i ? -1 : 1) * l * 0.045 + (Math.random() - 0.5) * l * 0.12),
          (o = Math.max(n, Math.min(n + l, o))),
          r ? t.lineTo(f, o) : t.moveTo(f, o));
      }
      (t.stroke(), t.restore());
    }
    function it(t, e, n, a, l) {
      (t.save(), (t.font = `800 34px ${E}`));
      const i = t.measureText(e).width + 44;
      ((t.fillStyle = l),
        t.beginPath(),
        t.roundRect
          ? t.roundRect(n - i / 2, a - 44, i, 62, 14)
          : t.rect(n - i / 2, a - 44, i, 62),
        t.fill(),
        (t.fillStyle = "#101113"),
        (t.textAlign = "center"),
        t.fillText(e, n, a),
        t.restore());
    }
    const st = [
      "QUEM VENCE HOJE?",
      "QUEM PUXA O MERCADO?",
      "A HISTÓRIA PODE SE REPETIR?",
      "PARA ONDE VAI O DINHEIRO?",
      "QUEM DITA O RITMO?",
    ];
    function ft(t, e, n) {
      const l = [
          ["^BVSP", "^GSPC"],
          ["BRL=X", "^BVSP"],
          ["BZ=F", "^BVSP"],
          ["BTC-USD", "GC=F"],
          ["^GSPC", "^IXIC"],
          ["DX-Y.NYB", "GC=F"],
        ].filter(
          ([c, U]) => e.some((C) => C.s === c) && e.some((C) => C.s === U),
        ),
        [i, o] = l.length ? Q(l) : [e[0]?.s, e[1]?.s],
        r = e.find((c) => c.s === i),
        f = e.find((c) => c.s === o);
      if (!r || !f) return !1;
      I(t);
      const p = t.createLinearGradient(0, 0, 0, d);
      (p.addColorStop(0, "rgba(207,171,105,0)"),
        p.addColorStop(0.3, v),
        p.addColorStop(0.7, v),
        p.addColorStop(1, "rgba(207,171,105,0)"),
        t.save(),
        (t.fillStyle = p),
        (t.shadowColor = v),
        (t.shadowBlur = 30),
        t.fillRect(s / 2 - 2, 40, 4, d * 0.62),
        t.restore());
      const u = (c, U) => {
        const C = N(t, c.n, s / 2 - 120, 110, 2, "900", h);
        (t.save(),
          (t.textAlign = "center"),
          (t.fillStyle = x),
          (t.font = `900 ${C.s}px ${h}`),
          C.linhas.forEach((vt, At) => t.fillText(vt, U, 290 + At * C.s)),
          t.restore(),
          Y(t, U - 190, 450, 380, 240, (c.q.d1 || 0) >= 0),
          t.save(),
          (t.textAlign = "center"),
          (t.fillStyle = x),
          (t.font = `800 64px ${E}`),
          t.fillText(D(c.q.px, c.d), U, 790),
          t.restore(),
          it(t, B(c.q.d1), U, 880, (c.q.d1 || 0) >= 0 ? R : b));
      };
      (u(r, s / 4),
        u(f, (s * 3) / 4),
        t.save(),
        (t.textAlign = "center"),
        (t.font = `900 96px ${h}`));
      const g = t.measureText("VERSUS").width;
      ((t.fillStyle = j),
        t.fillRect(s / 2 - g / 2 - 20, 70, g + 40, 100),
        (t.fillStyle = v),
        t.fillText("VERSUS", s / 2, 150),
        t.restore());
      const $ = Q(st),
        P = $.split(" "),
        V = Math.ceil(P.length / 2);
      let k = T(t, P.slice(0, V).join(" "), 1035, x, 120, 1);
      return (T(t, P.slice(V).join(" "), k, v, 130, 1), M(t), !0);
    }
    function ut(t, e, n) {
      const a = n && n.manchete;
      if (!a || !a.titulo) return !1;
      (I(t),
        t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = v),
        (t.font = `800 34px ${E}`),
        t.fillText(
          String(a.editoria || "MANCHETE DO DIA").toUpperCase(),
          s / 2,
          150,
        ),
        t.restore());
      const l = e.find((o) => o.s === "^BVSP") || e[0];
      l && Y(t, 140, 230, s - 280, 330, (l.q.d1 || 0) >= 0);
      let i = T(t, a.titulo, 700, x, 118, 4);
      return (
        (i = J(t, a.linha_fina || a.por_que_importa, i + 20, 3)),
        l &&
          (t.save(),
          (t.textAlign = "center"),
          (t.fillStyle = G),
          (t.font = `600 28px ${E}`),
          t.fillText(
            `${l.n} ${D(l.q.px, l.d)} (${B(l.q.d1)})`,
            s / 2,
            Math.min(i + 60, d - 130),
          ),
          t.restore()),
        M(t),
        !0
      );
    }
    function dt(t, e, n) {
      const a = e
        .filter((p) => p.q.d1 != null)
        .sort((p, u) => Math.abs(u.q.d1) - Math.abs(p.q.d1))[0];
      if (!a) return !1;
      I(t);
      const l = a.q.d1 >= 0;
      (t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = v),
        (t.font = `900 86px ${h}`),
        t.fillText("O NÚMERO DO DIA", s / 2, 190),
        t.restore(),
        t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = l ? R : b),
        (t.shadowColor = l ? R : b),
        (t.shadowBlur = 40));
      const i = B(a.q.d1),
        o = N(t, i, s - 120, 330, 1, "900", h);
      ((t.font = `900 ${o.s}px ${h}`), t.fillText(i, s / 2, 560), t.restore());
      let r = T(t, a.n, 700, x, 130, 1);
      (t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = "#e7e5e2"),
        (t.font = `700 52px ${E}`),
        t.fillText(D(a.q.px, a.d), s / 2, r + 30),
        t.restore());
      const f =
        y(() => n.em_poucas_linhas[0], "") ||
        (l
          ? "A maior alta entre os mercados acompanhados hoje."
          : "A maior queda entre os mercados acompanhados hoje.");
      return (J(t, f, r + 120, 3), M(t), !0);
    }
    function pt(t, e, n) {
      const a = y(
        () =>
          [n.manchete, ...(n.materias || [])]
            .filter((i) => i && i.titulo)
            .slice(0, 3),
        [],
      );
      if (a.length < 3) return !1;
      I(t);
      let l = T(t, "3 coisas que mexem", 150, x, 120, 1);
      return (
        (l = T(t, "com o mercado hoje", l, v, 120, 1)),
        (l += 40),
        a.forEach((i, o) => {
          (t.save(),
            (t.fillStyle = v),
            (t.font = `900 150px ${h}`),
            (t.textAlign = "left"),
            t.fillText(String(o + 1), 80, l + 120),
            t.restore());
          const r = N(t, i.titulo, s - 300, 64, 3, "800", E);
          (t.save(),
            (t.fillStyle = x),
            (t.font = `800 ${r.s}px ${E}`),
            (t.textAlign = "left"),
            r.linhas.forEach((f, p) =>
              t.fillText(f, 210, l + 40 + p * r.s * 1.12),
            ),
            (t.fillStyle = v),
            (t.font = `700 24px ${E}`),
            t.fillText(
              String(i.editoria || "").toUpperCase(),
              210,
              l + 40 + r.linhas.length * r.s * 1.12 + 6,
            ),
            t.restore(),
            (l += Math.max(190, r.linhas.length * r.s * 1.12 + 90)),
            o < 2 &&
              ((t.fillStyle = "rgba(207,171,105,0.35)"),
              t.fillRect(80, l - 30, s - 160, 2)));
        }),
        M(t),
        !0
      );
    }
    function mt(t, e, n) {
      const a = e.filter((u) => u.q.d1 != null),
        l = a
          .filter((u) => u.q.d1 > 0)
          .sort((u, g) => g.q.d1 - u.q.d1)
          .slice(0, 4),
        i = a
          .filter((u) => u.q.d1 < 0)
          .sort((u, g) => u.q.d1 - g.q.d1)
          .slice(0, 4);
      if (!l.length || !i.length) return !1;
      (I(t),
        t.save(),
        (t.globalAlpha = 0.22),
        (t.fillStyle = R),
        t.fillRect(0, 0, s / 2, d),
        (t.fillStyle = b),
        t.fillRect(s / 2, 0, s / 2, d),
        t.restore());
      const o = N(t, "TOURO", s / 2 - 120, 150, 1, "900", h);
      (t.save(),
        (t.textAlign = "center"),
        (t.font = `900 ${o.s}px ${h}`),
        (t.fillStyle = R),
        t.fillText("TOURO", s / 4, 230),
        (t.fillStyle = b),
        t.fillText("URSO", (s * 3) / 4, 230),
        (t.fillStyle = v),
        (t.font = `900 70px ${h}`),
        t.fillText("×", s / 2, 205),
        t.restore());
      const r = (u, g, $) =>
        u.forEach((P, V) => {
          const k = 370 + V * 150;
          (t.save(),
            (t.textAlign = "center"),
            (t.fillStyle = x),
            (t.font = `800 44px ${E}`),
            t.fillText(P.n, g, k),
            (t.fillStyle = $),
            (t.font = `900 58px ${h}`),
            t.fillText(B(P.q.d1), g, k + 62),
            t.restore());
        });
      (r(l, s / 4, R), r(i, (s * 3) / 4, b));
      const f =
          l.length >= i.length
            ? ["OS COMPRADORES", "MANDAM HOJE?"]
            : ["QUEM VAI", "SEGURAR A QUEDA?"],
        p = T(t, f[0], 1040, x, 110, 1);
      return (T(t, f[1], p, v, 120, 1), M(t), !0);
    }
    function X() {
      return y(() => {
        const t = A.loc
            ? A.loc().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          e = ((A.S && A.S.trades) || S.trades || [])
            .map((r) => ({ ...r, c: calc(r) }))
            .filter(
              (r) =>
                r.c &&
                r.c.pl != null &&
                String(r.dtx || r.dt || "").slice(0, 10) === t,
            );
        if (!e.length) return null;
        const n = e.filter((r) => Number.isFinite(r.c.r)),
          a = n.reduce((r, f) => r + f.c.r, 0),
          l = e.filter((r) => r.c.pl > 0).length,
          i = e.filter(
            (r) => r.rules !== "n" && !(r.err && r.err !== "Nenhum"),
          ).length,
          o = e.reduce((r, f) => r + f.c.pl, 0);
        return {
          n: e.length,
          gan: l,
          acerto: l / e.length,
          regras: i / e.length,
          somaR: n.length ? a : null,
          pos: o >= 0,
        };
      }, null);
    }
    function ht(t) {
      const e = X();
      if (!e) return !1;
      I(t);
      const n = e.pos ? R : b;
      (t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = v),
        (t.font = `900 92px ${h}`),
        t.fillText("MEU FECHAMENTO", s / 2, 190),
        t.restore());
      const a =
        e.somaR != null
          ? (e.somaR > 0 ? "+" : "") + D(e.somaR, 1) + "×"
          : e.pos
            ? "DIA POSITIVO"
            : "DIA NEGATIVO";
      (t.save(),
        (t.textAlign = "center"),
        (t.fillStyle = n),
        (t.shadowColor = n),
        (t.shadowBlur = 40));
      const l = N(t, a, s - 140, 280, 1, "900", h);
      ((t.font = `900 ${l.s}px ${h}`),
        t.fillText(l.linhas[0], s / 2, 500),
        t.restore(),
        e.somaR != null &&
          (t.save(),
          (t.textAlign = "center"),
          (t.fillStyle = "#e7e5e2"),
          (t.font = `700 40px ${E}`),
          t.fillText("VEZES O RISCO QUE EU CORRI", s / 2, 575),
          t.restore()));
      const i = (p, u, g) => {
        (t.save(),
          (t.textAlign = "center"),
          (t.fillStyle = x),
          (t.font = `900 92px ${h}`),
          t.fillText(g, p, 760),
          (t.fillStyle = G),
          (t.font = `700 30px ${E}`),
          t.fillText(u, p, 810),
          t.restore());
      };
      (i(s / 6, "TRADES", String(e.n)),
        i(s / 2, "ACERTO", D(e.acerto * 100, 0) + "%"),
        i((s * 5) / 6, "NAS REGRAS", D(e.regras * 100, 0) + "%"),
        (t.fillStyle = "rgba(207,171,105,0.35)"),
        t.fillRect(80, 880, s - 160, 2));
      const o =
          e.regras >= 1
            ? e.pos
              ? ["PLANO SEGUIDO,", "RESULTADO VEIO."]
              : ["PERDI NO PLANO.", "AMANHÃ TEM MAIS."]
            : e.pos
              ? ["GANHEI, MAS", "FUGI DAS REGRAS."]
              : ["DIA DE", "APRENDER."],
        r = T(t, o[0], 1030, x, 110, 1);
      T(t, o[1], r, v, 110, 1);
      const f = L;
      return ((L = "Meu diário de trade"), M(t), (L = f), !0);
    }
    const Z = [
      ["versus", ft],
      ["pergunta", ut],
      ["numero", dt],
      ["pontos", pt],
      ["touro", mt],
    ];
    let K = "";
    function F(t) {
      const e = m.createElement("canvas");
      ((e.width = s), (e.height = d));
      const n = e.getContext("2d");
      if (!n) return null;
      const a = rt(),
        l = _();
      if (t === "dia") {
        try {
          if (ht(n)) return e;
        } catch (o) {
          console.warn("capa dia", o);
        }
        return null;
      }
      const i = t
        ? Z.filter(([o]) => o === t)
        : Z.filter(([o]) => o !== K).sort(() => Math.random() - 0.5);
      for (const [o, r] of i) {
        n.clearRect(0, 0, s, d);
        try {
          if (r(n, a, l)) return ((K = o), e);
        } catch (f) {
          console.warn("capa", o, f);
        }
      }
      return null;
    }
    async function gt(t) {
      const e = await new Promise((l) => t.toBlob(l, "image/png"));
      if (!e) {
        y(() => toast("Não consegui gerar a imagem."));
        return;
      }
      const n = "capa-jornal-" + new Date().toISOString().slice(0, 10) + ".png";
      try {
        const l = new File([e], n, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [l] })) {
          await navigator.share({
            files: [l],
            title: "Capa do Jornal do Pregão",
          });
          return;
        }
      } catch (l) {
        if (l && l.name === "AbortError") return;
      }
      const a = m.createElement("a");
      ((a.href = URL.createObjectURL(e)),
        (a.download = n),
        m.body.appendChild(a),
        a.click(),
        setTimeout(() => {
          (URL.revokeObjectURL(a.href), a.remove());
        }, 2e3),
        y(() => toast("Imagem salva.")));
    }
    let q = null;
    function w(t, e) {
      if (((q = t instanceof HTMLCanvasElement ? t : F(e)), !q)) {
        y(
          () =>
            toast(
              e === "dia"
                ? "Registre ao menos um trade encerrado hoje para montar a capa do seu fechamento."
                : "Abra o Jornal do Pregão e aguarde as cotações para gerar a capa.",
            ),
          null,
        );
        return;
      }
      let n = m.getElementById("v429-capa");
      (n ||
        ((n = m.createElement("div")),
        (n.id = "v429-capa"),
        n.setAttribute("role", "dialog"),
        n.setAttribute("aria-modal", "true"),
        n.setAttribute("aria-label", "Capa do Jornal do Pregão"),
        m.body.appendChild(n)),
        (n.innerHTML = `<div class="v429-bar"><button type="button" data-v429="x">← Voltar</button><button type="button" data-v429="nova">🎲 Outra capa</button><button type="button" data-v429="dia">Meu fechamento</button><button type="button" data-v429="s" class="v429-pri">Compartilhar / salvar</button></div><div class="v429-img"><img alt="Capa gerada para o Jornal do Pregão" src="${q.toDataURL("image/png")}"></div><p class="v429-nota">Capa montada com a edição de hoje e as cotações do app. Toque em “Outra capa” para sortear outro modelo.</p>`),
        (n.hidden = !1),
        m.body.classList.add("v429-open"),
        n.querySelector('[data-v429="nova"]').focus({ preventScroll: !0 }));
    }
    function W() {
      const t = m.getElementById("v429-capa");
      (t && (t.hidden = !0), m.body.classList.remove("v429-open"));
    }
    (m.addEventListener("click", (t) => {
      const e = t.target.closest?.("[data-v429]");
      if (e) {
        t.preventDefault();
        const a = e.dataset.v429;
        a === "x"
          ? W()
          : a === "nova"
            ? w()
            : a === "dia"
              ? w(null, "dia")
              : a === "s" && q && gt(q);
        return;
      }
      if (t.target.closest?.("[data-v430-thumb]")) {
        (t.preventDefault(), w(O.cv || null));
        return;
      }
      t.target.closest?.("[data-v429-capa]") && (t.preventDefault(), w());
    }),
      m.addEventListener("keydown", (t) => {
        t.key === "Escape" && m.body.classList.contains("v429-open") && W();
      }));
    function H() {
      m.querySelectorAll("[data-jrimg]").forEach((t) => {
        if (
          t.parentElement &&
          !t.parentElement.querySelector("[data-v429-capa]")
        ) {
          const e = m.createElement("button");
          ((e.type = "button"),
            (e.className = t.className + " v429-btn"),
            e.setAttribute("data-v429-capa", "1"),
            (e.textContent = "🎲 Capa do dia"),
            t.after(e));
        }
      });
    }
    const O = { k: "", cv: null, url: "" };
    function z() {
      const t = m.querySelector("[data-jrimg]");
      if (!t || !t.parentElement) return;
      const e = _();
      if (!e || !e.manchete) return;
      const n =
        (e.dia || "") +
        "|" +
        (e.edicao || "") +
        "|" +
        String(e.manchete.titulo || "").slice(0, 40);
      if (O.k !== n) {
        const i = F();
        if (!i) return;
        ((O.k = n), (O.cv = i));
        try {
          O.url = i.toDataURL("image/jpeg", 0.72);
        } catch {
          O.url = "";
        }
      }
      if (!O.url) return;
      const a = t.parentElement;
      let l =
        a.parentElement &&
        a.parentElement.querySelector(":scope>[data-v430-thumb]");
      (l ||
        ((l = m.createElement("button")),
        (l.type = "button"),
        (l.className = "v430-thumb"),
        l.setAttribute("data-v430-thumb", "1"),
        a.after(l)),
        l.dataset.k !== n &&
          ((l.dataset.k = n),
          (l.innerHTML = `<img alt="" src="${O.url}"><span><b>Capa de hoje pronta</b><small>Toque para ver, sortear outra ou compartilhar.</small></span>`)));
    }
    function tt() {
      if (typeof A.render0 != "function" || A.render0.__v429) return !1;
      const t = A.render0,
        e = function () {
          const n = t.apply(this, arguments);
          try {
            (H(), z());
          } catch {}
          return n;
        };
      return ((e.__v429 = 1), (A.render0 = e), !0);
    }
    tt();
    let et = 0;
    const St = setInterval(() => {
      (et++, tt());
      try {
        H();
      } catch {}
      et > 15 && clearInterval(St);
    }, 800);
    (setInterval(() => {
      if (!m.hidden)
        try {
          (H(), z());
        } catch {}
    }, 3e3),
      (A.DIARIO_V429 = { gerar: F, abrir: w, diaStats: X }));
  })(window);
} catch (e) {
  console.error("[v522] falha em capas-v429.js", e);
}
try {
  (function (l) {
    "use strict";
    const s = l.document;
    if (!s) return;
    const r = (e, t) => {
        try {
          const n = e();
          return n === void 0 ? t : n;
        } catch {
          return t;
        }
      },
      $ = () =>
        r(() => loc().slice(0, 10), new Date().toISOString().slice(0, 10)),
      M = () => {
        const e = new Date();
        return e.getHours() * 60 + e.getMinutes();
      };
    function A() {
      const e = $(),
        t = r(() => tcod(e), "");
      if (!t) return null;
      const n = r(() => janTurno(e), null);
      if (n && n.nv === "g") return null;
      const a = M();
      return t === "8" && a >= 360 && a < 1080
        ? "Hoje você está no turno das 8h às 17h. O combinado é não operar."
        : t === "16" && a >= 870 && a < 1439
          ? "Hoje tem turno das 16h. O combinado é parar às 14h30 para sair a tempo."
          : null;
    }
    let E = null,
      g = 0,
      h = !1;
    s.addEventListener(
      "click",
      (e) => {
        const t = e.target.closest && e.target.closest("button,[data-a],a");
        t && !t.closest("#v430-turno") && (E = t);
      },
      !0,
    );
    function _(e) {
      let t = s.getElementById("v430-turno");
      (t ||
        ((t = s.createElement("div")),
        (t.id = "v430-turno"),
        (t.className = "v430-ov"),
        t.setAttribute("role", "dialog"),
        t.setAttribute("aria-modal", "true"),
        t.setAttribute("aria-labelledby", "v430-turno-t"),
        s.body.appendChild(t)),
        (t.innerHTML = `<div class="v430-sh"><h2 id="v430-turno-t">Dia de turno</h2><p>${e}</p><p class="v430-mut">Se for registrar um trade que você já fez, confirme: ele fica com a etiqueta “Dia de turno” para aparecer nas suas estatísticas.</p><div class="v430-acts"><button type="button" class="v430-pri" data-v430t="nao">Não vou operar</button><button type="button" data-v430t="sim">Registrar mesmo assim</button></div></div>`),
        (t.hidden = !1),
        t.querySelector('[data-v430t="nao"]').focus({ preventScroll: !0 }));
    }
    function x() {
      const e = s.getElementById("v430-turno");
      e && (e.hidden = !0);
    }
    (s.addEventListener(
      "click",
      (e) => {
        const t = e.target.closest && e.target.closest("[data-v430t]");
        if (t)
          if (
            (e.preventDefault(),
            e.stopPropagation(),
            x(),
            t.dataset.v430t === "sim")
          ) {
            ((g = Date.now() + 4e3),
              (h = !0),
              r(() => {
                (((S.ax ?? (S.ax = {})).turnoViol = (
                  (S.ax || {}).turnoViol || []
                )
                  .concat([
                    { d: $(), h: new Date().toTimeString().slice(0, 5) },
                  ])
                  .slice(-200)),
                  save());
              }));
            const n = E;
            n && s.contains(n) && setTimeout(() => n.click(), 0);
          } else r(() => toast("Boa decisão. Hoje o foco é o trabalho.", 2500));
      },
      !0,
    ),
      s.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const t = s.getElementById("v430-turno");
          t && !t.hidden && x();
        }
      }));
    function C() {
      h &&
        ((h = !1),
        setTimeout(() => {
          r(() => {
            if (typeof T < "u" && T && isNew) {
              const e = Array.isArray(T.tags) ? T.tags : [];
              (e.includes("Dia de turno") ||
                (T.tags = e.concat(["Dia de turno"])),
                (T.turno = 1));
            }
          });
        }, 0));
    }
    function D() {
      if (
        typeof l.pBloq != "function" &&
        r(() => typeof pBloq, "") !== "function"
      )
        return !1;
      const e = r(() => pBloq, null);
      if (!e || e.__v430) return !!e;
      const t = function () {
        const n = e.apply(this, arguments);
        if (!n) return n;
        if (Date.now() < g) return ((g = 0), C(), !0);
        const a = A();
        return a ? (_(a), !1) : !0;
      };
      t.__v430 = 1;
      try {
        pBloq = t;
      } catch {
        l.pBloq = t;
      }
      return !0;
    }
    const f = (e, t = 2) =>
        e == null || !isFinite(e)
          ? "–"
          : Number(e).toLocaleString("pt-BR", {
              minimumFractionDigits: t,
              maximumFractionDigits: t,
            }),
      y = (e) =>
        e == null || !isFinite(e) ? "–" : (e > 0 ? "+" : "") + f(e, 2) + "×",
      b = (e) => (e == null || !isFinite(e) ? "–" : f(e * 100, 0) + "%");
    function B(e, t) {
      return r(
        () =>
          S.trades
            .map((n) => ({ ...n, c: calc(n) }))
            .filter((n) => {
              if (!n.c || n.c.pl == null) return !1;
              const a = String(n.dtx || n.dt || "").slice(0, 10);
              return (!e || a >= e) && (!t || a <= t);
            }),
        [],
      );
    }
    function N() {
      const e = r(() => rng(RP), null);
      if (!e) return "";
      const t = B(e[0], e[1]),
        n = B("", ""),
        a = r(() => estat(t), null),
        m = r(() => estat(n), null),
        v =
          '<div class="v430-vt-h"><b>Semana no padrão Van Tharp</b><small>Medido em vezes o risco: +2× quer dizer que o trade pagou o dobro do que você arriscou até o stop.</small></div>';
      if (!a || !a.n)
        return `<div class="card v430-vt" data-v430vt="1">${v}<p class="v430-mut">Nenhum trade encerrado neste período.</p></div>`;
      const i = a.n
          ? t.filter((o) => o.rules !== "n" && !(o.err && o.err !== "Nenhum"))
              .length / a.n
          : null,
        u = a.nR
          ? t.filter((o) => Number.isFinite(o.c.r) && o.c.r < -1.05).length
          : 0,
        c = t.filter(
          (o) =>
            o.turno ||
            (Array.isArray(o.tags) && o.tags.includes("Dia de turno")),
        ).length,
        q = a.sqn100 == null ? "–" : f(a.sqn100, 1),
        k = r(() => qualSQN(a.sqn100), ""),
        p = (o, H, V, I) =>
          `<div class="v430-vt-c"><small>${o}</small><b class="${V || ""}">${H}</b>${I ? `<em>${I}</em>` : ""}</div>`,
        w = (o) =>
          o == null ? "" : o > 0 ? "v430-pos" : o < 0 ? "v430-neg" : "";
      let d;
      a.semStop > 0 && a.semStop >= a.n / 2
        ? (d = `${a.semStop} de ${a.n} trades sem stop registrado: sem stop não dá para medir o risco. Anote o stop antes de entrar.`)
        : u > 0
          ? (d = `${u} perda(s) maiores que o stop planejado: o stop não foi respeitado. Na próxima semana, stop no sistema antes da entrada.`)
          : i != null && i < 0.8
            ? (d = `Você seguiu as regras em ${b(i)} dos trades. A meta é 100%: resultado fora do plano não ensina nada.`)
            : c > 0
              ? (d = `${c} trade(s) em dia de turno. Esses dias são para o trabalho: proteja o descanso e o capital.`)
              : a.mediaR != null && a.mediaR < 0
                ? (d =
                    "Expectativa negativa na semana, mesmo dentro das regras. Revise o setup com mais trades antes de aumentar a mão.")
                : a.nR < 10
                  ? (d =
                      "Semana dentro das regras. Ainda são poucos trades para julgar o sistema: siga registrando.")
                  : (d =
                      "Semana dentro das regras e com expectativa positiva. Mantenha o tamanho de posição e repita o processo.");
      const F =
        a.nR < 10
          ? `<p class="v430-mut">Amostra pequena (${a.nR} trade${a.nR === 1 ? "" : "s"} com stop). O SQN fica confiável a partir de uns 30 trades.</p>`
          : "";
      return `<div class="card v430-vt" data-v430vt="1">${v}<div class="v430-vt-g">
    ${p("Média por trade", y(a.mediaR), w(a.mediaR), "o risco" + (m && m.mediaR != null ? " · histórico " + y(m.mediaR) : ""))}
    ${p("Soma no período", y(a.mediaR != null ? a.mediaR * a.nR : null), w(a.mediaR), "o risco · " + a.n + " trade" + (a.n === 1 ? "" : "s"))}
    ${p("SQN", q, "", k ? String(k).toLowerCase() : "")}
    ${p("Acerto", b(a.acerto), "", a.payoff != null ? "payoff " + f(a.payoff, 2) : "")}
    ${p("Nas regras", b(i), i != null && i < 0.8 ? "v430-neg" : "", c ? c + " em dia de turno" : "")}
    ${p("Perdas maiores que o stop", String(u), u ? "v430-neg" : "", a.mediaPerdaR != null ? "perda média " + f(Math.abs(a.mediaPerdaR), 2) + "× o risco" : "")}
  </div>${F}<p class="v430-dica"><b>Para a próxima semana:</b> ${d}</p></div>`;
    }
    function R() {
      if (r(() => tab, "") !== "rev") return;
      const e = s.getElementById("app");
      if (!e) return;
      const t = [...e.querySelectorAll("h1")].find((c) =>
        /Revis[aã]o da semana/i.test(c.textContent),
      );
      if (!t) return;
      const n =
          r(() => RP, "") +
          "|" +
          r(() => S.trades.length, 0) +
          "|" +
          r(() => S.trades.reduce((c, q) => Math.max(c, q.u || 0), 0), 0),
        a = e.querySelector("[data-v430vt]");
      if (a && a.dataset.k === n) return;
      const m = N();
      if (!m) return;
      const v = s.createElement("div");
      v.innerHTML = m;
      const i = v.firstElementChild;
      if (((i.dataset.k = n), a)) {
        a.replaceWith(i);
        return;
      }
      const u = [...e.querySelectorAll("h2")].find(
        (c) =>
          /Calend[aá]rio/i.test(c.textContent) && t.parentElement.contains(c),
      );
      u ? u.before(i) : t.parentElement.appendChild(i);
    }
    function L() {
      if (typeof l.render0 != "function" || l.render0.__v430) return;
      const e = l.render0,
        t = function () {
          const n = e.apply(this, arguments);
          try {
            R();
          } catch {}
          return n;
        };
      ((t.__v430 = 1), (l.render0 = t));
    }
    let j = 0;
    const P = setInterval(() => {
      (j++, D(), L());
      try {
        R();
      } catch {}
      j > 20 && clearInterval(P);
    }, 700);
    (setInterval(() => {
      if (!s.hidden) {
        D();
        try {
          R();
        } catch {}
      }
    }, 2500),
      (l.DIARIO_V430 = { turnoRisco: A, quadro: N }));
  })(window);
} catch (e) {
  console.error("[v522] falha em novidades-v430.js", e);
}
try {
  (function (c) {
    "use strict";
    const a = c.document;
    if (!a) return;
    const f = "diario-v430-ferr",
      v = () => {
        try {
          return localStorage.getItem(f) === "1";
        } catch {
          return !1;
        }
      },
      g = (t) => {
        try {
          localStorage.setItem(f, t ? "1" : "0");
        } catch {}
      },
      y = () => c.matchMedia && c.matchMedia("(max-width:760px)").matches,
      b = (t, e = 20) =>
        `<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t}</svg>`,
      A = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      E =
        '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>';
    function x() {
      a.querySelectorAll("#trst").forEach((t) => {
        const e = (I) => {
            const h = t.querySelector("b." + I);
            return (h && parseInt(h.textContent, 10)) || 0;
          },
          r = e("tg"),
          o = e("am"),
          s = e("tr"),
          i = r + o + s;
        let n =
          t.parentElement &&
          t.parentElement.querySelector(":scope>.v430-fontes");
        if (!i) {
          (n && (n.hidden = !0), t.classList.remove("v430-st"));
          return;
        }
        (n ||
          ((n = a.createElement("button")),
          (n.type = "button"),
          (n.className = "v430-fontes"),
          t.before(n)),
          (n.hidden = !1),
          t.classList.add("v430-st"));
        const d = `Fontes: ${r}/${i} ao vivo` + (o ? ` · ${o} com atraso` : "");
        n.dataset.t !== d &&
          ((n.dataset.t = d),
          (n.innerHTML = `<i class="${r ? "ok" : o ? "at" : "off"}" aria-hidden="true"></i>${d}<span aria-hidden="true">›</span>`),
          n.setAttribute(
            "aria-label",
            d + ". Toque para ver o detalhe de cada fonte.",
          ));
      });
    }
    a.addEventListener("click", (t) => {
      const e = t.target.closest && t.target.closest(".v430-fontes");
      if (!e) return;
      t.preventDefault();
      const r = e.parentElement && e.parentElement.querySelector("#trst .trlk");
      r && r.click();
    });
    function S() {
      const t = a.querySelector(".trm .trbar");
      if (!t) return;
      if (!t.querySelector(".v430-lupa")) {
        const r = a.createElement("button");
        ((r.type = "button"),
          (r.className = "trbtn v430-lupa"),
          r.setAttribute("aria-label", "Buscar ou digitar comando"),
          (r.innerHTML = b(A)),
          t.prepend(r));
      }
      if (a.querySelector(".trm .trmerc") && !t.querySelector(".v430-mais")) {
        const r = a.createElement("button");
        ((r.type = "button"),
          (r.className = "trbtn v430-mais"),
          r.setAttribute(
            "aria-label",
            "Atalhos: Jornal do Pregão, Notícias, Agenda e outros",
          ),
          r.setAttribute("aria-haspopup", "dialog"),
          (r.innerHTML = b(E)),
          t.appendChild(r));
      }
    }
    function q(t) {
      t.classList.remove("v430-busca");
    }
    (a.addEventListener(
      "click",
      (t) => {
        const e = t.target.closest && t.target.closest(".v430-lupa");
        if (e) {
          t.preventDefault();
          const i = e.closest(".trbar");
          i.classList.toggle("v430-busca");
          const n = i.querySelector("#trcmd");
          i.classList.contains("v430-busca") &&
            n &&
            setTimeout(() => n.focus(), 0);
          return;
        }
        if (t.target.closest && t.target.closest(".v430-mais")) {
          (t.preventDefault(), L());
          return;
        }
        const o = t.target.closest && t.target.closest("[data-v430at]");
        if (o) {
          t.preventDefault();
          const i = +o.dataset.v430at;
          l();
          const n = a.querySelectorAll(".trm .trmerc button")[i];
          n && setTimeout(() => n.click(), 0);
          return;
        }
        if (t.target.closest && t.target.closest("[data-v430fx]")) {
          (t.preventDefault(), l());
          return;
        }
        const s = a.getElementById("v430-atalhos");
        s && !s.hidden && t.target === s && l();
      },
      !0,
    ),
      a.addEventListener("focusout", (t) => {
        const e = t.target;
        if (e && e.id === "trcmd" && !e.value) {
          const r = e.closest(".trbar");
          r &&
            setTimeout(() => {
              a.activeElement !== e && q(r);
            }, 150);
        }
      }));
    function L() {
      const t = [...a.querySelectorAll(".trm .trmerc button")];
      if (!t.length) return;
      let e = a.getElementById("v430-atalhos");
      (e ||
        ((e = a.createElement("div")),
        (e.id = "v430-atalhos"),
        (e.className = "v430-ov"),
        e.setAttribute("role", "dialog"),
        e.setAttribute("aria-modal", "true"),
        e.setAttribute("aria-label", "Atalhos do Terminal"),
        a.body.appendChild(e)),
        (e.innerHTML = `<div class="v430-sh v430-atl"><h2>Atalhos</h2><div class="v430-atl-g">${t.map((o, s) => `<button type="button" data-v430at="${s}">${o.textContent.trim().replace(/[<>&]/g, "")}</button>`).join("")}</div><button type="button" class="v430-atl-x" data-v430fx>Fechar</button></div>`),
        (e.hidden = !1));
      const r = e.querySelector("[data-v430at]");
      r && r.focus({ preventScroll: !0 });
    }
    function l() {
      const t = a.getElementById("v430-atalhos");
      t && (t.hidden = !0);
    }
    a.addEventListener("keydown", (t) => {
      t.key === "Escape" && l();
    });
    function m() {
      a.querySelectorAll("#v421-gp").forEach((t) => {
        const e = t.querySelector(".gp-bar2");
        if (!e) return;
        t.classList.toggle("v430-ferr", v());
        let r = e.querySelector(".v430-ferr-bt");
        r ||
          ((r = a.createElement("button")),
          (r.type = "button"),
          (r.className = "gp-btn v430-ferr-bt"),
          e.prepend(r));
        const o = t.classList.contains("v430-ferr"),
          s = o ? "Menos ferramentas ▴" : "Ferramentas ▾";
        r.textContent !== s &&
          ((r.textContent = s),
          r.setAttribute("aria-expanded", o ? "true" : "false"),
          r.setAttribute(
            "aria-label",
            o
              ? "Recolher ferramentas do gráfico"
              : "Mostrar ferramentas: gráficos prontos, eixo, adicionar dado e relacionados",
          ));
      });
    }
    a.addEventListener(
      "click",
      (t) => {
        t.target.closest &&
          t.target.closest(".v430-ferr-bt") &&
          (t.preventDefault(), t.stopPropagation(), g(!v()), m());
      },
      !0,
    );
    function k() {
      a.querySelectorAll("#tf413 .tf413-side .tf413-empty").forEach((t) => {
        if (t.querySelector(".v430-acao")) return;
        const e = a.createElement("button");
        ((e.type = "button"),
          (e.className = "v430-acao"),
          (e.textContent = "Tentar de novo"),
          t.appendChild(e));
      });
    }
    a.addEventListener(
      "click",
      (t) => {
        const e = t.target.closest && t.target.closest(".v430-acao");
        if (!e) return;
        t.preventDefault();
        const r = a.querySelector("#tf413 [data-tf413-refresh]");
        if (((e.disabled = !0), (e.textContent = "Buscando…"), r)) r.click();
        else
          try {
            render0();
          } catch {}
        setTimeout(() => {
          if (a.contains(e)) {
            ((e.disabled = !1), (e.textContent = "Tentar de novo"));
            try {
              toast(
                "Ainda sem resposta da fonte. Confira a conexão e se a conta está conectada (Mais → Conta).",
                3500,
              );
            } catch {}
          }
        }, 6e3);
      },
      !0,
    );
    function u() {
      try {
        x();
      } catch {}
      try {
        S();
      } catch {}
      try {
        m();
      } catch {}
      try {
        k();
      } catch {}
    }
    function C() {
      if (typeof c.render0 != "function" || c.render0.__v430t) return;
      const t = c.render0,
        e = function () {
          const r = t.apply(this, arguments);
          return (u(), r);
        };
      ((e.__v430t = 1), (c.render0 = e));
    }
    let p = 0;
    const T = setInterval(() => {
      (p++, C(), u(), p > 20 && clearInterval(T));
    }, 600);
    (setInterval(() => {
      a.hidden || u();
    }, 1500),
      (c.DIARIO_V430T = { tudo: u, celular: y }));
  })(window);
} catch (e) {
  console.error("[v522] falha em terminal-v430.js", e);
}
try {
  (function (i) {
    "use strict";
    const o = i.document;
    if (!o) return;
    const l = (t) => {
      try {
        return t();
      } catch {
        return;
      }
    };
    function d() {
      const t = o.querySelector("#trst");
      if (!t) return null;
      const e = t.querySelector("b.tg");
      return e ? parseInt(e.textContent, 10) || 0 : null;
    }
    function u() {
      o.querySelectorAll(".v430-fontes").forEach((t) => {
        let e =
          t.parentElement &&
          t.parentElement.querySelector(":scope>.v431-ponte");
        const n = d(),
          a = !t.hidden && n === 0;
        (!e &&
          a &&
          ((e = o.createElement("button")),
          (e.type = "button"),
          (e.className = "v431-ponte"),
          (e.textContent = "Como ligar a ponte do Profit"),
          e.setAttribute("aria-haspopup", "dialog"),
          t.after(e)),
          e && (e.hidden = !a));
      });
    }
    function c() {
      let t = o.getElementById("v431-ponte");
      (t ||
        ((t = o.createElement("div")),
        (t.id = "v431-ponte"),
        (t.className = "v430-ov"),
        t.setAttribute("role", "dialog"),
        t.setAttribute("aria-modal", "true"),
        t.setAttribute("aria-labelledby", "v431-ponte-t"),
        o.body.appendChild(t)),
        (t.innerHTML = `<div class="v430-sh v431-sh"><h2 id="v431-ponte-t">Ligar a ponte do Profit</h2>
  <p>A ponte é o programa que leva as cotações do Profit, ao vivo, para o app. Ela roda no seu computador, então o app não consegue ligá-la sozinho.</p>
  <ol><li>No computador, abra o <b>Profit</b> e entre na sua conta.</li><li>Rode a ponte: <b>ponte_profit.py</b>.</li><li>Deixe a janela da ponte aberta durante o pregão.</li><li>Volte aqui: o selo passa a mostrar as fontes <b>ao vivo</b> em até 1 minuto.</li></ol>
  <p class="v430-mut">Sem a ponte, o Terminal usa fontes gratuitas com atraso de 15 minutos ou mais.</p>
  <div class="v430-acts"><button type="button" class="v430-pri" data-v431="teste">Testar conexões agora</button><button type="button" data-v431="x">Fechar</button></div></div>`),
        (t.hidden = !1),
        t.querySelector('[data-v431="teste"]').focus({ preventScroll: !0 }));
    }
    function r() {
      const t = o.getElementById("v431-ponte");
      t && (t.hidden = !0);
    }
    (o.addEventListener(
      "click",
      (t) => {
        if (t.target.closest && t.target.closest(".v431-ponte")) {
          (t.preventDefault(), c());
          return;
        }
        const e = t.target.closest && t.target.closest("[data-v431]");
        if (e) {
          (t.preventDefault(),
            t.stopPropagation(),
            r(),
            e.dataset.v431 === "teste" &&
              (l(() => {
                irPara("conta");
              }),
              setTimeout(() => {
                const a = o.getElementById("dgcard");
                if (a) {
                  a.scrollIntoView({ block: "start" });
                  const s = a.querySelector("[data-dg2]");
                  s && !s.disabled && s.click();
                } else
                  l(() =>
                    toast('Abra Mais → Conta e toque em "Testar tudo".', 3500),
                  );
              }, 500)));
          return;
        }
        const n = o.getElementById("v431-ponte");
        n && !n.hidden && t.target === n && r();
      },
      !0,
    ),
      o.addEventListener("keydown", (t) => {
        t.key === "Escape" && r();
      }),
      setInterval(() => {
        if (!o.hidden)
          try {
            u();
          } catch {}
      }, 1500),
      (i.DIARIO_V431 = { abrir: c }));
  })(window);
} catch (e) {
  console.error("[v522] falha em terminal-v431.js", e);
}
try {
  (function (b) {
    "use strict";
    const n = b.document;
    if (!n) return;
    const y = (t, e) => {
        try {
          const o = t();
          return o === void 0 ? e : o;
        } catch {
          return e;
        }
      },
      A = "diario-v432-ind",
      S = () => {
        try {
          return localStorage.getItem(A) === "1";
        } catch {
          return !1;
        }
      },
      C = (t) =>
        String(t || "")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase(),
      q = [
        "Ativo em foco",
        "Buscar",
        "Painéis e espaços",
        "Dados e inteligência",
        "Rotina",
        "Ajuda e saída",
      ],
      D = [
        [/^atalhos/, null, null, !0],
        [/^buscar ou digitar comando$/, null, null, !0],
        [
          /^\d+$/,
          "Dados e inteligência",
          (t) => `Problemas nos dados (${t.trim()})`,
        ],
        [/^favorit/, "Ativo em foco"],
        [/^pesquisar /, "Ativo em foco"],
        [/^grafico$/, "Ativo em foco", "Gráfico do ativo"],
        [/^fundamentos/, "Ativo em foco"],
        [/^comandos$/, "Buscar", "Lista de comandos"],
        [/^pesquisa$/, "Buscar", "Pesquisa de ativos"],
        [/^fluxo$/, "Rotina", "Fluxo do dia"],
        [/^rotina/, "Rotina"],
        [/^planejar/, "Rotina", "Planejar sessão"],
        [/^observador/, "Rotina", "Observador"],
        [/^espacos$/, "Painéis e espaços", "Trocar de espaço"],
        [/^workspaces$/, "Painéis e espaços", "Gerenciar espaços"],
        [/^$/, "Painéis e espaços", "Renomear ou excluir este espaço"],
        [/^organizar$/, "Painéis e espaços", "Layouts por horário"],
        [
          /^auto/,
          "Painéis e espaços",
          (t) =>
            "Troca automática de layout: " +
            (/deslig/i.test(t) ? "desligada" : "ligada"),
        ],
        [
          /radar|acoes brasil|exterior|cripto|macro/,
          "Dados e inteligência",
          (t, e) =>
            /radar proativo/i.test(e)
              ? "Radar proativo"
              : /▾/.test(e) && !/intelig/i.test(e)
                ? "Lista do radar: " + e.replace("▾", "").trim() + " ▾"
                : null,
        ],
        [/consulta|qualidade|dados|automac|intelig/, "Dados e inteligência"],
        [/^guia$/, "Ajuda e saída", "Guia do Terminal"],
        [/^sair$/, "Ajuda e saída", "Sair do Terminal"],
      ];
    let f = !1;
    function g(t) {
      const e = t.querySelector(".tr341-content");
      if (
        !e ||
        e.dataset.v432 === e.childElementCount + "|" + e.textContent.length
      )
        return;
      const o = [...e.querySelectorAll("button[data-tr341-action]")];
      if (!o.length) return;
      f = !0;
      const i = new Set(),
        c = {};
      q.forEach((a) => (c[a] = []));
      for (const a of o) {
        const r = a.textContent.trim(),
          p = C(r).replace(/^[^\w]+/, "");
        let l = null,
          u = null,
          P = !1,
          v = !1;
        if (/[☆★]/.test(r))
          ((v = !0),
            (l = "Ativo em foco"),
            (u = "☆ Favoritar " + r.replace(/[☆★]/g, "").trim()));
        else
          for (const [d, k, h, w] of D)
            if (d.test(p)) {
              ((v = !0),
                (l = k),
                (P = !!w),
                (u = typeof h == "function" ? h(r, r) : h));
              break;
            }
        if (P) continue;
        if (!v) {
          const d =
            a.closest("section")?.querySelector("h3")?.textContent || "";
          l = /pesquisa/i.test(d)
            ? "Buscar"
            : /organiza/i.test(d)
              ? "Painéis e espaços"
              : /intelig/i.test(d)
                ? "Dados e inteligência"
                : "Ajuda e saída";
        }
        const R = (u || r).replace(/\s+/g, " ").trim(),
          $ = C(R);
        i.has($) ||
          (i.add($),
          (a.textContent = R),
          a.dataset.v432o == null && (a.dataset.v432o = r),
          (c[l] || c["Ajuda e saída"]).push(a));
      }
      const s = n.createDocumentFragment();
      for (const a of q) {
        if (!c[a].length) continue;
        const r = n.createElement("section");
        r.className = "tr341-group v432-grp";
        const p = n.createElement("h3");
        p.textContent = a;
        const l = n.createElement("div");
        ((l.className = "tr341-items"),
          c[a].forEach((u) => l.appendChild(u)),
          r.append(p, l),
          s.appendChild(r));
      }
      (e.replaceChildren(s),
        (e.dataset.v432 = e.childElementCount + "|" + e.textContent.length),
        (f = !1));
    }
    const I = new MutationObserver(() => {
      if (f) return;
      const t = n.querySelector("dialog.tr341-dialog");
      if (t && (t.open || t.hasAttribute("open")))
        try {
          g(t);
        } catch {
          f = !1;
        }
    });
    function L() {
      const t = n.querySelector("dialog.tr341-dialog");
      if (t && !t.dataset.v432obs) {
        ((t.dataset.v432obs = "1"),
          I.observe(t, {
            childList: !0,
            subtree: !0,
            attributes: !0,
            attributeFilter: ["open"],
          }));
        try {
          g(t);
        } catch {}
      }
    }
    const j = /^(tf|style)\|/;
    function x() {
      n.querySelectorAll("#trgrid .trp").forEach((t) => {
        (t.querySelectorAll(".trph .trmx").forEach((e) => {
          e.dataset.v432 ||
            ((e.dataset.v432 = "1"),
            e.setAttribute("aria-label", "Ampliar painel"));
        }),
          t.querySelectorAll(".g9bar").forEach((e) => {
            if (!e.querySelector(".v432-ind")) {
              const s = n.createElement("button");
              ((s.type = "button"),
                (s.className = "g9b v432-ind"),
                e.appendChild(s));
            }
            e.querySelectorAll(
              ":scope>button:not(.v432-ind),:scope>input",
            ).forEach((s) => {
              const a = s.dataset.g9 || "";
              s.classList.toggle("v432-pri", j.test(a));
            });
            const o = S();
            e.classList.toggle("v432-aberto", o);
            const i = e.querySelector(".v432-ind"),
              c = o ? "Menos ▴" : "Indicadores ▾";
            i.textContent !== c &&
              ((i.textContent = c),
              i.setAttribute("aria-expanded", o ? "true" : "false"),
              i.setAttribute(
                "aria-label",
                o
                  ? "Recolher indicadores e zoom"
                  : "Mostrar indicadores (médias, RSI, MACD, Fibo), zoom e escala",
              ));
          }),
          t.querySelectorAll(".trerr").forEach((e) => {
            if (
              !/entre na sua conta/i.test(e.textContent) ||
              e.querySelector(".v432-conta")
            )
              return;
            const o = n.createElement("button");
            ((o.type = "button"),
              (o.className = "v432-conta"),
              (o.textContent = "Entrar na conta"),
              e.appendChild(o));
          }));
      });
    }
    n.addEventListener(
      "click",
      (t) => {
        if (t.target.closest && t.target.closest(".v432-ind")) {
          (t.preventDefault(), t.stopPropagation());
          try {
            localStorage.setItem(A, S() ? "0" : "1");
          } catch {}
          x();
          return;
        }
        t.target.closest &&
          t.target.closest(".v432-conta") &&
          (t.preventDefault(),
          t.stopPropagation(),
          y(() => {
            (irPara("conta"), scrollTo(0, 0));
          }));
      },
      !0,
    );
    function m() {
      try {
        L();
      } catch {}
      try {
        x();
      } catch {}
    }
    let E = 0;
    const F = setInterval(() => {
      (E++, m(), E > 20 && clearInterval(F));
    }, 700);
    (setInterval(() => {
      !n.hidden && y(() => tab, "") === "term" && m();
    }, 1500),
      (b.DIARIO_V432 = { tudo: m, arrumaMenu: g }));
  })(window);
} catch (e) {
  console.error("[v522] falha em terminal-v432.js", e);
}
try {
  (function (l) {
    "use strict";
    const o = l.document;
    if (!o) return;
    const p = "diario-v433-formato",
      f = ["ajustar", "169", "916"],
      v = { ajustar: "Ajustar", 169: "16:9", 916: "9:16" },
      y = (t, e) => {
        try {
          const n = localStorage.getItem(t);
          return n ?? e;
        } catch {
          return e;
        }
      },
      w = (t, e) => {
        try {
          localStorage.setItem(t, e);
        } catch {}
      },
      E = () => {
        try {
          return +JSON.parse(localStorage.getItem("aulas-vel")) || 1;
        } catch {
          return 1;
        }
      },
      I = (t) =>
        String(t).replace(
          /[&<>"']/g,
          (e) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[e],
        );
    function m(t) {
      const e = y(p, "ajustar");
      f.forEach((a) => t.classList.toggle("v433-f" + a, a === e));
      const n = t.querySelector(".v433-fmt");
      n &&
        ((n.textContent = v[e]),
        n.setAttribute(
          "aria-label",
          "Formato da tela: " + v[e] + ". Toque para trocar.",
        ));
    }
    function S(t) {
      const e = t.querySelector(".aup-top");
      if (!e || e.querySelector(".v433-fmt")) return;
      const n = e.querySelector(".aup-ix") || e.lastElementChild,
        a = o.createElement("button");
      ((a.type = "button"),
        (a.className = "v433-fmt"),
        (a.title = "Formato da tela"),
        e.insertBefore(a, n));
      const s = t;
      if (!!(s.requestFullscreen || s.webkitRequestFullscreen)) {
        const i = o.createElement("button");
        ((i.type = "button"),
          (i.className = "v433-fs"),
          i.setAttribute("aria-label", "Tela cheia"),
          (i.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'),
          e.insertBefore(i, n));
      }
      m(t);
    }
    o.addEventListener(
      "click",
      (t) => {
        if (t.target.closest && t.target.closest(".v433-fmt")) {
          (t.preventDefault(), t.stopPropagation());
          const a = f.indexOf(y(p, "ajustar"));
          w(p, f[(a + 1) % f.length]);
          const s = o.getElementById("aup");
          s && (m(s), d(s));
          return;
        }
        if (t.target.closest && t.target.closest(".v433-fs")) {
          (t.preventDefault(), t.stopPropagation());
          const a = o.getElementById("aup");
          if (!a) return;
          const s = o.fullscreenElement || o.webkitFullscreenElement;
          try {
            if (s) (o.exitFullscreen || o.webkitExitFullscreen).call(o);
            else {
              (a.requestFullscreen || a.webkitRequestFullscreen).call(a);
              try {
                screen.orientation &&
                  screen.orientation.lock &&
                  screen.orientation.lock("landscape").catch(() => {});
              } catch {}
            }
          } catch {}
          return;
        }
      },
      !0,
    );
    let b = 0;
    const q = () =>
        l.matchMedia &&
        l.matchMedia("(orientation:landscape) and (max-height:540px)").matches,
      x = (t) => {
        const e = t.querySelector(".aup-pp");
        return !!(e && /pausar/i.test(e.getAttribute("aria-label") || ""));
      };
    function d(t) {
      (t.classList.remove("v433-esconde"),
        clearTimeout(b),
        (b = setTimeout(() => {
          q() &&
            x(t) &&
            !t.querySelector(
              ".aup-idx:not([hidden]),#aupoptions:not([hidden])",
            ) &&
            t.classList.add("v433-esconde");
        }, 3200)));
    }
    o.addEventListener(
      "pointerdown",
      (t) => {
        const e = o.getElementById("aup");
        if (e && e.contains(t.target)) {
          const n = e.classList.contains("v433-esconde");
          (d(e),
            n &&
              t.target.closest(".aup-stage") &&
              (t.preventDefault(), t.stopPropagation()));
        }
      },
      !0,
    );
    const r = { txt: "", spans: [], t: 0, ini: 0, dur: 0, bound: 0, mexe: !1 };
    function L(t) {
      const e = (t.textContent || "").trim();
      if (!e || e === r.txt || t.querySelector(".mut")) return;
      ((r.txt = e), clearInterval(r.t));
      const n = e.split(/(\s+)/);
      let a = 0;
      ((r.mexe = !0),
        (t.innerHTML = n
          .map((s) => {
            const c = a;
            return (
              (a += s.length),
              /\s/.test(s) || !s
                ? s
                : `<span class="v433-w" data-c="${c}">${I(s)}</span>`
            );
          })
          .join("")),
        (r.mexe = !1),
        (r.spans = [...t.querySelectorAll(".v433-w")]),
        (r.ini = performance.now()),
        (r.dur = Math.max(1200, (e.length / 14.5 / E()) * 1e3)),
        (r.t = setInterval(() => {
          if (!r.spans.length || !r.spans[0].isConnected) {
            clearInterval(r.t);
            return;
          }
          if (performance.now() - r.bound < 1200) return;
          const s = o.getElementById("aup");
          if (s && !x(s)) return;
          const c = Math.min(1, (performance.now() - r.ini) / r.dur),
            i = Math.floor(c * r.spans.length);
          (M(i), c >= 1 && clearInterval(r.t));
        }, 90)));
    }
    function M(t) {
      r.spans.forEach((e, n) => {
        (e.classList.toggle("dito", n < t),
          e.classList.toggle("agora", n === t));
      });
    }
    function F(t) {
      let e = 0;
      for (let n = 0; n < r.spans.length && +r.spans[n].dataset.c <= t; n++)
        e = n;
      M(e);
    }
    try {
      const t = l.speechSynthesis;
      if (t && !t.__v433) {
        const e = t.speak.bind(t);
        ((t.speak = function (n) {
          try {
            const a = ((n && n.text) || "").trim();
            n.addEventListener("boundary", (s) => {
              (s.name && s.name !== "word") ||
                (a &&
                  r.txt &&
                  a.replace(/\s+/g, " ") === r.txt.replace(/\s+/g, " ") &&
                  ((r.bound = performance.now()), F(s.charIndex || 0)));
            });
          } catch {}
          return e(n);
        }),
          (t.__v433 = 1));
      }
    } catch {}
    function k(t) {
      const e = o.getElementById("aupct"),
        n = ((e && e.textContent) || "") + "|" + t.className;
      t.dataset.v433 !== n &&
        ((t.dataset.v433 = n),
        !(
          l.matchMedia &&
          l.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) &&
          (t
            .querySelectorAll("svg path,svg polyline,svg line")
            .forEach((a, s) => {
              if (a.dataset.v433) return;
              a.dataset.v433 = "1";
              let c = 0;
              try {
                c = a.getTotalLength ? a.getTotalLength() : 0;
              } catch {}
              !c ||
                c < 8 ||
                ((a.style.strokeDasharray = c + " " + c),
                (a.style.strokeDashoffset = c),
                a.getBoundingClientRect(),
                (a.style.transition = `stroke-dashoffset ${Math.min(1400, 500 + c * 1.2)}ms cubic-bezier(.4,.1,.2,1) ${Math.min(s * 40, 600)}ms`),
                requestAnimationFrame(() => {
                  a.style.strokeDashoffset = "0";
                }),
                setTimeout(() => {
                  ((a.style.strokeDasharray = ""),
                    (a.style.strokeDashoffset = ""),
                    (a.style.transition = ""));
                }, 2400));
            }),
          t.classList.remove("v433-in"),
          t.offsetWidth,
          t.classList.add("v433-in")));
    }
    let u = null,
      g = null;
    function h() {
      const t = o.getElementById("aup");
      if (!t) {
        ((g = null), u && (u.disconnect(), (u = null)));
        return;
      }
      if (t === g) return;
      ((g = t), S(t), d(t));
      const e = t.querySelector("#aupcap"),
        n = t.querySelector("#aupvis");
      ((u = new MutationObserver((a) => {
        for (const s of a)
          (e && (s.target === e || e.contains(s.target)) && !r.mexe && L(e),
            n && (s.target === n || n.contains(s.target)) && k(n),
            s.target.classList &&
              s.target.classList.contains("aup-pp") &&
              d(t));
      })),
        u.observe(t, {
          childList: !0,
          subtree: !0,
          characterData: !0,
          attributes: !0,
          attributeFilter: ["aria-label"],
        }),
        n && n.innerHTML && k(n),
        e && L(e));
    }
    (new MutationObserver(() => h()).observe(o.body, { childList: !0 }),
      setInterval(h, 1500),
      (l.DIARIO_V433 = { liga: h, aplicaFormato: m }));
  })(window);
} catch (e) {
  console.error("[v522] falha em aulas-v433.js", e);
}
try {
  (function (l) {
    "use strict";
    const d = l.document;
    if (!d) return;
    const m = "aulas-videos",
      x = ["9x16", "16x9", "1x1"],
      A = {
        "9x16": "Em pé 9:16",
        "16x9": "Deitado 16:9",
        "1x1": "Quadrado 1:1",
      },
      f = (t, a) => {
        try {
          const e = t();
          return e === void 0 ? a : e;
        } catch {
          return a;
        }
      },
      p = (t) =>
        String(t ?? "").replace(
          /[&<>"']/g,
          (a) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[a],
        ),
      s = { ts: 0, nomes: null, busy: 0, pedido: 0 },
      S = () => f(() => !!(SESS && SESS.uid && cfg()), !1);
    async function y(t) {
      if (!S()) return null;
      if ((!t && s.nomes && Date.now() - s.ts < 12e4) || s.busy) return s.nomes;
      s.busy = 1;
      try {
        await tok();
        const a = cfg(),
          r = await (
            await fetch(a.url + "/storage/v1/object/list/" + m, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: a.key,
                Authorization: "Bearer " + SESS.at,
              },
              body: JSON.stringify({
                prefix: SESS.uid + "/",
                limit: 1e3,
                sortBy: { column: "name", order: "asc" },
              }),
            })
          )
            .json()
            .catch(() => []);
        ((s.nomes = new Set((Array.isArray(r) ? r : []).map((o) => o.name))),
          (s.ts = Date.now()));
      } catch {
        ((s.nomes = s.nomes || new Set()), (s.ts = Date.now()));
      } finally {
        s.busy = 0;
      }
      return s.nomes;
    }
    const B = (t) =>
      s.nomes ? x.filter((a) => s.nomes.has(t + "-" + a + ".mp4")) : [];
    async function T(t, a) {
      await tok();
      const e = cfg(),
        r = SESS.uid + "/" + t + "-" + a + ".mp4",
        o = await fetch(e.url + "/storage/v1/object/sign/" + m + "/" + r, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: e.key,
            Authorization: "Bearer " + SESS.at,
          },
          body: JSON.stringify({ expiresIn: 3600 }),
        }),
        n = await o.json().catch(() => ({}));
      if (!o.ok || !n.signedURL)
        throw new Error(n.message || n.error || "Vídeo indisponível");
      return e.url + "/storage/v1" + n.signedURL;
    }
    function u() {
      const t = d.querySelectorAll(".au-study-row");
      if (!(!t.length || !S())) {
        if (!s.nomes) {
          !s.busy &&
            !s.pedido &&
            ((s.pedido = 1),
            y(!1).then(() => {
              ((s.pedido = 0), s.nomes && u());
            }));
          return;
        }
        (Date.now() - s.ts > 12e4 &&
          !s.busy &&
          !s.pedido &&
          ((s.pedido = 1),
          y(!0).then(() => {
            ((s.pedido = 0), u());
          })),
          t.forEach((a) => {
            const e = a.querySelector("[data-auopen]");
            if (!e) return;
            const r = e.dataset.auopen,
              o = B(r);
            let n = a.querySelector(".v434-vid");
            if (!o.length) {
              n && n.remove();
              return;
            }
            (n ||
              ((n = d.createElement("button")),
              (n.type = "button"),
              (n.className = "v434-vid"),
              /* v596: no card vertical o botão Vídeo vai para a linha de ações (com duração e favorito). */
              a.querySelector(".v596-aula-acoes")
                ? a.querySelector(".v596-aula-acoes").prepend(n)
                : e.after(n)),
              (n.dataset.id = r),
              (n.dataset.fs = o.join(",")));
            const i = "▶ Iniciar aula";
            n.textContent !== i &&
              ((n.textContent = i),
              n.setAttribute("aria-label", "Iniciar o vídeo desta aula"));
          }));
      }
    }
    function v(t) {
      const a =
        f(() => (AU.lista || []).find((e) => e.id === t), null) ||
        f(() => l.AULAS.getLista().find((e) => e.id === t), null);
      return a ? `Aula ${a.numero} · ${a.titulo}` : "Aula em vídeo";
    }
    /* v597 — Sala de aula: controles próprios abaixo do vídeo (a barra de tempo nunca cobre a legenda gravada
       no vídeo), velocidade, concluir aula e anotações (salvas em aulas.progresso no Supabase). */
    const VEL597 = [1, 1.25, 1.5, 2],
      mmss597 = (x) => {
        x = Math.max(0, Math.floor(+x || 0));
        const hh = Math.floor(x / 3600),
          mm = Math.floor((x % 3600) / 60),
          ss = String(x % 60).padStart(2, "0");
        return hh ? hh + ":" + String(mm).padStart(2, "0") + ":" + ss : mm + ":" + ss;
      },
      vel597 = () => {
        const v = +f(() => localStorage.getItem("v597-vel"), 1);
        return VEL597.includes(v) ? v : 1;
      };
    function estudo597(t) {
      const au = l.AULAS || {},
        feita = f(() => au.concluida(t), !1),
        notas = f(() => au.notas(t), ""),
        v = vel597();
      return `<div class="v597-bar" data-v597-bar>
    <button type="button" class="v598-pula" data-v598-pula="-15" aria-label="Voltar 15 segundos">-15s</button>
    <button type="button" class="v597-pp" data-v597-pp aria-label="Reproduzir">▶</button>
    <button type="button" class="v598-pula" data-v598-pula="15" aria-label="Avançar 15 segundos">+15s</button>
    <input type="range" class="v597-seek" data-v597-seek min="0" max="1000" value="0" step="1" aria-label="Posição do vídeo">
    <span class="v597-tempo" data-v597-tempo>0:00 / 0:00</span>
    <button type="button" class="v597-fs" data-v597-fs aria-label="Tela cheia">⛶</button></div>
  <div class="v597-estudo">
    <div class="v597-vel" role="group" aria-label="Velocidade">${VEL597.map((x) => `<button type="button" data-v597-vel="${x}" class="${x === v ? "on" : ""}" aria-pressed="${x === v}">${String(x).replace(".", ",")}x</button>`).join("")}</div>
    <button type="button" class="v598-audio" data-v598-audio aria-pressed="false">🎧 Ouvir com a tela bloqueada</button>
    <button type="button" class="v597-feita${feita ? " on" : ""}" data-v597-feita aria-pressed="${feita}">${feita ? "Aula concluída ✓" : "Marcar aula como concluída ✓"}</button>
    <details class="v597-notas"${notas ? " open" : ""}><summary>Anotações desta aula</summary><textarea data-v597-notas rows="4" maxlength="8000" placeholder="Insights, dúvidas e o que aplicar no pregão">${p(notas)}</textarea><small data-v597-salvo aria-live="polite"></small></details>
  </div>`;
    }
    /* v598 — mídia ativa da sala de aula: o vídeo ou, no modo "tela bloqueada", um <audio> com a mesma faixa
       (o iOS mantém áudio tocando com a tela bloqueada; vídeo, não). Media Session mostra título e controles. */
    const midia597 = (ov) => (ov && ov.__aud) || ov?.querySelector("video");
    function pinta597(ov) {
      const m = midia597(ov);
      if (!ov || !m) return;
      const pp = ov.querySelector("[data-v597-pp]"),
        sk = ov.querySelector("[data-v597-seek]"),
        tm = ov.querySelector("[data-v597-tempo]"),
        dur = m.duration || 0;
      (tm && (tm.textContent = mmss597(m.currentTime) + " / " + mmss597(dur)),
        sk && !sk.dataset.arrasta && (sk.value = dur ? Math.round((m.currentTime / dur) * 1e3) : 0),
        pp && ((pp.textContent = m.paused ? "▶" : "❚❚"), pp.setAttribute("aria-label", m.paused ? "Reproduzir" : "Pausar")));
      sessao598(ov, m);
    }
    function pula598(ov, seg) {
      const m = midia597(ov);
      if (!m) return;
      const dur = m.duration || 0;
      m.currentTime = Math.max(0, Math.min(dur ? dur - 0.25 : m.currentTime + seg, m.currentTime + seg));
      pinta597(ov);
    }
    function sessao598(ov, m) {
      try {
        if (!("mediaSession" in navigator) || !m) return;
        const ms = navigator.mediaSession,
          titulo = ov.querySelector(".v434-top b")?.textContent || "Aula";
        (ms.metadata?.title !== titulo &&
          (ms.metadata = new MediaMetadata({ title: titulo, artist: "Diário de Trader", album: "Estudos" })),
          (ms.playbackState = m.paused ? "paused" : "playing"));
        if (ov.__ms598 === m) return;
        ov.__ms598 = m;
        const h = (acao, fn) => {
          try {
            ms.setActionHandler(acao, fn);
          } catch {}
        };
        (h("play", () => midia597(ov)?.play()),
          h("pause", () => midia597(ov)?.pause()),
          h("seekbackward", (d) => pula598(ov, -(d?.seekOffset || 15))),
          h("seekforward", (d) => pula598(ov, d?.seekOffset || 15)),
          h("seekto", (d) => {
            const x = midia597(ov);
            x && d && typeof d.seekTime == "number" && ((x.currentTime = d.seekTime), pinta597(ov));
          }));
        try {
          m.duration && ms.setPositionState?.({ duration: m.duration, playbackRate: m.playbackRate || 1, position: Math.min(m.currentTime, m.duration) });
        } catch {}
      } catch {}
    }
    function prende598(ov, m) {
      ["timeupdate", "loadedmetadata", "play", "pause", "ended", "ratechange"].forEach((ev) => m.addEventListener(ev, () => pinta597(ov)));
      m.addEventListener("loadedmetadata", () => (m.playbackRate = vel597()));
      m.playbackRate = vel597();
    }
    function liga597(ov, vid) {
      if (!ov || !vid) return;
      (ov.__aud && (ov.__aud.pause(), (ov.__aud = null)), (ov.__ms598 = null));
      const sk = ov.querySelector("[data-v597-seek]");
      (prende598(ov, vid), vid.addEventListener("click", () => (vid.paused ? vid.play() : vid.pause())));
      sk &&
        (sk.addEventListener("input", () => {
          sk.dataset.arrasta = "1";
          const m = midia597(ov),
            dur = m?.duration || 0;
          dur && (m.currentTime = (sk.value / 1e3) * dur);
          const tm = ov.querySelector("[data-v597-tempo]");
          tm && m && (tm.textContent = mmss597(m.currentTime) + " / " + mmss597(dur));
        }),
        sk.addEventListener("change", () => delete sk.dataset.arrasta));
      pinta597(ov);
    }
    /* Alterna vídeo ↔ só áudio (mesma faixa e posição), por toque do usuário — exigência do iOS. */
    function audio598(ov, btn) {
      const vid = ov.querySelector("video");
      if (!vid) return;
      if (ov.__aud) {
        const a = ov.__aud,
          t = a.currentTime,
          tocando = !a.paused;
        (a.pause(), a.removeAttribute("src"), a.load(), (ov.__aud = null), (vid.currentTime = t), tocando && vid.play().catch(() => {}));
        (btn.classList.remove("on"), btn.setAttribute("aria-pressed", "false"), (btn.textContent = "🎧 Ouvir com a tela bloqueada"));
        return pinta597(ov);
      }
      const a = new Audio(vid.currentSrc || vid.src);
      ((a.preload = "auto"), (a.currentTime = vid.currentTime), prende598(ov, a), vid.pause(), (ov.__aud = a));
      a.play().catch(() => {});
      (btn.classList.add("on"), btn.setAttribute("aria-pressed", "true"), (btn.textContent = "📺 Voltar ao vídeo"));
      pinta597(ov);
    }
    d.addEventListener("click", (ev) => {
      const ov = d.getElementById("v434-ov");
      if (!ov || ov.hidden || !ev.target.closest) return;
      const vid = midia597(ov),
        id = ov.dataset.id;
      if (ev.target.closest("[data-v597-pp]")) return vid && (vid.paused ? vid.play() : vid.pause());
      const pj = ev.target.closest("[data-v598-pula]");
      if (pj) return pula598(ov, +pj.dataset.v598Pula);
      const au = ev.target.closest("[data-v598-audio]");
      if (au) return audio598(ov, au);
      if (ev.target.closest("[data-v597-fs]")) {
        const v = ov.querySelector("video");
        if (!v) return;
        try {
          v.webkitEnterFullscreen ? v.webkitEnterFullscreen() : v.requestFullscreen?.();
        } catch {}
        return;
      }
      const vb = ev.target.closest("[data-v597-vel]");
      if (vb) {
        const v = +vb.dataset.v597Vel;
        (f(() => localStorage.setItem("v597-vel", String(v))), vid && (vid.playbackRate = v));
        ov.querySelectorAll("[data-v597-vel]").forEach((b) => {
          const on = b === vb;
          (b.classList.toggle("on", on), b.setAttribute("aria-pressed", String(on)));
        });
        return;
      }
      const fb = ev.target.closest("[data-v597-feita]");
      if (fb && id) {
        const sim = fb.getAttribute("aria-pressed") !== "true";
        f(() => l.AULAS.marcarConcluida(id, sim));
        (fb.classList.toggle("on", sim),
          fb.setAttribute("aria-pressed", String(sim)),
          (fb.textContent = sim ? "Aula concluída ✓" : "Marcar aula como concluída ✓"));
        f(() => typeof tab < "u" && tab === "estudos" && render());
      }
    });
    let notas597 = 0;
    d.addEventListener("input", (ev) => {
      const ta = ev.target.closest?.("#v434-ov [data-v597-notas]");
      if (!ta) return;
      const ov = d.getElementById("v434-ov"),
        id = ov?.dataset.id,
        aviso = ov?.querySelector("[data-v597-salvo]");
      (clearTimeout(notas597),
        aviso && (aviso.textContent = "Salvando…"),
        (notas597 = setTimeout(() => {
          (f(() => l.AULAS.salvarNotas(id, ta.value)), aviso && (aviso.textContent = "Salvo"));
        }, 800)));
    });
    async function h(t, a, e) {
      e = e || a[0];
      let r = d.getElementById("v434-ov");
      (r ||
        ((r = d.createElement("div")),
        (r.id = "v434-ov"),
        r.setAttribute("role", "dialog"),
        r.setAttribute("aria-modal", "true"),
        d.body.appendChild(r)),
        (r.innerHTML = `<div class="v434-box"><div class="v434-top"><b>${p(v(t))}</b><button type="button" class="v434-x" data-v434x aria-label="Fechar">✕</button></div>
  ${a.length > 1 ? `<div class="v434-fmts">${a.map((o) => `<button type="button" data-v434f="${o}" class="${o === e ? "on" : ""}">${A[o]}</button>`).join("")}</div>` : ""}
  <div class="v434-play"><div class="v434-load">Carregando o vídeo…</div></div>
  ${estudo597(t)}
  <div class="v434-acts"><button type="button" class="v434-pri" data-v434share>Compartilhar</button><a class="v434-dl" data-v434dl href="#" download>Baixar</a></div></div>`),
        (r.hidden = !1),
        (r.dataset.id = t),
        (r.dataset.fs = a.join(",")),
        (r.dataset.f = e));
      try {
        const o = await T(t, e);
        r.dataset.u = o;
        const n = r.querySelector(".v434-play");
        ((n.innerHTML = `<video src="${p(o)}" playsinline preload="metadata"></video>`),
          liga597(r, n.querySelector("video")),
          n.querySelector("video").addEventListener(
            "error",
            () => {
              r.dataset.id === t && r.dataset.f === e && I(r, o, n);
            },
            { once: !0 },
          ));
        const c = r.querySelector("[data-v434dl]");
        c.href =
          o +
          "&download=" +
          encodeURIComponent(
            v(t).replace(/[\\/:*?"<>|]+/g, "") + " (" + e + ").mp4",
          );
      } catch (o) {
        r.querySelector(".v434-play").innerHTML =
          `<div class="v434-load">Não abriu: ${p(o.message || o)}</div>`;
      }
    }
    const b = {};
    async function w(t, a) {
      if (b[t]) return b[t];
      const e = await fetch(t);
      if (!e.ok) throw new Error("o servidor respondeu " + e.status);
      const r = +e.headers.get("content-length") || 0,
        o = e.body && e.body.getReader ? e.body.getReader() : null;
      let n;
      if (o) {
        const i = [];
        let c = 0;
        for (;;) {
          const { done: M, value: k } = await o.read();
          if (M) break;
          (i.push(k), (c += k.length), a && r && a(c / r));
        }
        n = new Blob(i, { type: "video/mp4" });
      } else n = new Blob([await e.arrayBuffer()], { type: "video/mp4" });
      return ((b[t] = n), n);
    }
    async function I(t, a, e) {
      e.innerHTML =
        '<div class="v434-load">Preparando o vídeo no aparelho… <b>0%</b></div>';
      try {
        const r = await w(a, (n) => {
          const i = e.querySelector("b");
          i && (i.textContent = Math.round(n * 100) + "%");
        });
        if (t.hidden || t.dataset.u !== a) return;
        const o = URL.createObjectURL(r);
        ((t.dataset.blob = o),
          (e.innerHTML = `<video src="${o}" playsinline autoplay></video>`),
          liga597(t, e.querySelector("video")));
      } catch (r) {
        e.innerHTML = `<div class="v434-load">Não consegui abrir o vídeo: ${p(r.message || r)}. Use “Baixar”.</div>`;
      }
    }
    function E() {
      const t = d.getElementById("v434-ov");
      if (!t) return;
      const a = t.querySelector("video");
      /* v598: encerra também o modo só áudio e os controles da tela de bloqueio. */
      (t.__aud && (t.__aud.pause(), (t.__aud = null)), (t.__ms598 = null));
      f(() => (navigator.mediaSession.playbackState = "none"));
      if ((a && a.pause(), t.dataset.blob)) {
        try {
          URL.revokeObjectURL(t.dataset.blob);
        } catch {}
        delete t.dataset.blob;
      }
      ((t.hidden = !0), (t.innerHTML = ""));
    }
    (d.addEventListener(
      "click",
      async (t) => {
        const a = t.target.closest && t.target.closest(".v434-vid");
        if (a) {
          (t.preventDefault(),
            t.stopPropagation(),
            h(a.dataset.id, a.dataset.fs.split(",")));
          return;
        }
        const e = d.getElementById("v434-ov");
        if (!e || e.hidden) return;
        if (t.target === e || t.target.closest("[data-v434x]")) {
          (t.preventDefault(), E());
          return;
        }
        const r = t.target.closest("[data-v434f]");
        if (r) {
          (t.preventDefault(),
            h(e.dataset.id, e.dataset.fs.split(","), r.dataset.v434f));
          return;
        }
        if (t.target.closest("[data-v434share]")) {
          t.preventDefault();
          const o = e.dataset.u;
          if (!o) return;
          try {
            const n = await w(o),
              i = new File(
                [n],
                v(e.dataset.id).replace(/[\\/:*?"<>|]+/g, "") + ".mp4",
                { type: "video/mp4" },
              );
            if (navigator.canShare && navigator.canShare({ files: [i] })) {
              await navigator.share({ files: [i], title: v(e.dataset.id) });
              return;
            }
            if (navigator.share) {
              await navigator.share({ url: o, title: v(e.dataset.id) });
              return;
            }
          } catch (n) {
            if (n && n.name === "AbortError") return;
          }
          try {
            (await navigator.clipboard.writeText(o),
              f(() => toast("Link do vídeo copiado (vale por 1 hora).", 3e3)));
          } catch {}
        }
      },
      !0,
    ),
      d.addEventListener("keydown", (t) => {
        t.key === "Escape" && E();
      }));
    function j() {
      if (typeof l.render0 != "function" || l.render0.__v434) return;
      const t = l.render0,
        a = function () {
          const e = t.apply(this, arguments);
          try {
            u();
          } catch {}
          return e;
        };
      ((a.__v434 = 1), (l.render0 = a));
    }
    function g(t) {
      try {
        let a = 0;
        const e = [];
        for (let n = 0; n < localStorage.length; n++) {
          const i = localStorage.key(n),
            c = localStorage.getItem(i) || "";
          ((a += i.length + c.length),
            i.indexOf("aulas-rot-v1:") >= 0 && e.push([i, c.length]));
        }
        let r = !0;
        try {
          (localStorage.setItem("__v435_teste", "x".repeat(65536)),
            localStorage.removeItem("__v435_teste"));
        } catch {
          r = !1;
        }
        if (!t && r && a < 36e5) return 0;
        e.sort((n, i) => i[1] - n[1]);
        let o = 0;
        for (const [n] of e)
          if (
            (localStorage.removeItem(n),
            o++,
            o >= e.length || (!t && o >= Math.ceil(e.length / 2)))
          )
            break;
        return o;
      } catch {
        return 0;
      }
    }
    try {
      g(!1);
    } catch {}
    l.addEventListener &&
      l.addEventListener("error", (t) => {
        /quota/i.test(String((t && t.message) || "")) && g(!0);
      });
    let L = 0;
    const q = setInterval(() => {
      (L++, j());
      try {
        u();
      } catch {}
      L > 20 && clearInterval(q);
    }, 800);
    (setInterval(() => {
      if (!d.hidden)
        try {
          u();
        } catch {}
    }, 4e3),
      (l.DIARIO_V434 = { lista: y, abrir: h, liberaEspaco: g }));
  })(window);
} catch (e) {
  console.error("[v522] falha em aulas-v434.js", e);
}
try {
  (function (e) {
    "use strict";
    const i = e.document;
    if (!i) return;
    const f = 12;
    function a() {
      const n = i.getElementById("app");
      if (!n) return;
      const o = n.querySelectorAll(
        "*:not(svg):not(svg *):not(canvas):not([data-v502fs])",
      );
      let s = 0;
      for (const t of o) {
        if (s > 4e3) break;
        if (
          (s++,
          !t.firstChild ||
            (t.firstChild.nodeType !== 3 && !t.childNodes.length))
        )
          continue;
        let u = !1;
        for (const p of t.childNodes)
          if (p.nodeType === 3 && p.nodeValue.trim()) {
            u = !0;
            break;
          }
        if (!u) continue;
        const c = parseFloat(getComputedStyle(t).fontSize);
        c &&
          c < f - 0.2 &&
          (t.style.setProperty("font-size", f + "px", "important"),
          t.setAttribute("data-v502fs", String(c)));
      }
    }
    let l = 0;
    const r = () => {
      (clearTimeout(l),
        (l = setTimeout(() => {
          try {
            a();
          } catch {}
        }, 120)));
    };
    function v() {
      if (typeof e.render0 != "function" || e.render0.__v502) return;
      const n = e.render0,
        o = function () {
          const s = n.apply(this, arguments);
          return (r(), s);
        };
      ((o.__v502 = 1), (e.render0 = o));
    }
    let d = 0;
    const y = setInterval(() => {
      (d++, v(), r(), d > 20 && clearInterval(y));
    }, 700);
    (setInterval(() => {
      i.hidden || r();
    }, 3e3),
      (e.DIARIO_V502 = { ajusta: a }));
  })(window);
} catch (e) {
  console.error("[v522] falha em design-v502.js", e);
}
try {
  (function (n) {
    "use strict";
    const t = n.document;
    if (!t) return;
    const i = t.createElement("style");
    ((i.textContent =
      "html body #app #dt393-workspace .v504-aberto:not(#v504a):not(#v504b),#app .v504-aberto{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}#app .v504-aberto>.hgin{padding:0!important}#app .v504-aberto>.hgin>.hgfilho{margin:0 0 12px!important}"),
      (t.head || t.documentElement).appendChild(i));
    function a() {
      if (!t.body || !t.body.classList.contains("v4-homeview")) return;
      const o = t.querySelector("#dt393-workspace .dt393-native");
      o &&
        o
          .querySelectorAll(
            ":scope > [data-v4g]:not(.v4-off) .hgr, :scope > .hgr[data-v4g]:not(.v4-off)",
          )
          .forEach((r) => {
            const e = r.querySelector(":scope > details");
            if (!e) return;
            const d = e.querySelector(":scope > .hgin");
            d &&
              ((e.open = !0),
              r.appendChild(d),
              (e.hidden = !0),
              (e.style.display = "none"),
              r.classList.add("v504-aberto"));
          });
    }
    let c = 0;
    const p = () => {
      clearTimeout(c);
      try {
        a();
      } catch {}
      c = setTimeout(() => {
        try {
          a();
        } catch {}
      }, 60);
    };
    function l() {
      if (typeof n.render0 != "function" || n.render0.__v504) return;
      const o = n.render0,
        r = function () {
          const e = o.apply(this, arguments);
          return (p(), e);
        };
      ((r.__v504 = 1), (n.render0 = r));
    }
    let s = 0;
    const u = setInterval(() => {
      (s++, l(), s > 20 && clearInterval(u));
    }, 700);
    n.DIARIO_V504 = { abre: a };
  })(window);
} catch (e) {
  console.error("[v522] falha em inicio-v504.js", e);
}
try {
  (function (f) {
    "use strict";
    const i = f.document;
    if (!i) return;
    const p = (e, o) => {
        try {
          const t = e();
          return t === void 0 ? o : t;
        } catch {
          return o;
        }
      },
      J = (e) =>
        String(e ?? "").replace(
          /[&<>"']/g,
          (o) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[o],
        ),
      j = (e) =>
        p(
          () =>
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(e),
          "R$ " + e,
        ),
      E = [
        [
          "pre",
          2,
          "Dormi bem e estou sem pressa, raiva ou necessidade de ganhar hoje",
          "sono",
          /dormi|sono/i,
        ],
        [
          "pre",
          2,
          "Conferi a escala: hoje não estou de turno no horário do pregão",
          "turno",
          /turno|escala/i,
        ],
        [
          "pre",
          0,
          "Conferi a agenda econômica: horários de notícias fortes (Copom, payroll, CPI, leilões)",
          "agenda",
          /agenda|not[ií]cia/i,
        ],
        [
          "pre",
          0,
          "Olhei o contexto: S&P futuro, dólar, DI, ADRs, petróleo e minério",
          "contexto",
          /contexto|s&p|adr/i,
        ],
        [
          "pre",
          0,
          "Marquei os níveis: máxima, mínima e fechamento de ontem, ajuste, VWAP e gaps",
          "niveis",
          /n[ií]veis|vwap|ajuste/i,
        ],
        [
          "pre",
          0,
          "Conferi o contrato vigente e a data de vencimento/rolagem",
          "venc",
          /vencimento|rolagem|contrato vigente/i,
        ],
        [
          "pre",
          1,
          "Defini o limite de perda do dia em R$ e o número máximo de trades",
          "limite",
          /limite de perda|perda m[aá]xima/i,
        ],
        [
          "pre",
          0,
          "Escrevi o plano: viés, setup do dia e o que me tira do mercado",
          "plano",
          /escrevi o plano|plano escrito/i,
        ],
        [
          "pre",
          1,
          "Plataforma pronta: stop/OCO configurado e a quantidade certa de contratos na boleta",
          "plataforma",
          /oco|boleta|plataforma pronta/i,
        ],
        [
          "during",
          0,
          "Antes de cada entrada: o setup está no meu plano (nada fora dele)",
          null,
          /s[oó] entro com setup|setup est[aá] no/i,
        ],
        [
          "during",
          1,
          'Stop enviado junto com a entrada, nunca "stop mental"',
          null,
          /stop inicial|stop enviado/i,
        ],
        [
          "during",
          1,
          "O risco do trade cabe no limite (contratos × pontos × valor do ponto)",
          "risco",
          /risco m[aá]ximo|risco do trade/i,
        ],
        ["during", 1, "Alvo de pelo menos 2 vezes o risco", null, /alvo/i],
        [
          "during",
          1,
          "Não movo o stop contra a posição",
          null,
          /mov\w* o stop/i,
        ],
        [
          "during",
          0,
          "Não entro nos 5 minutos antes e depois de notícia forte",
          null,
          /5 minutos|minutos antes/i,
        ],
        [
          "during",
          3,
          "Depois de 2 stops seguidos, paro e faço a pausa",
          "stops",
          /2 stops|dois stops|stops seguidos/i,
        ],
        [
          "during",
          3,
          "Não opero para recuperar perda (sem vingança)",
          null,
          /recuperar|vingan/i,
        ],
        [
          "post",
          2,
          "Importei as operações do Profit para o diário",
          "import",
          /import/i,
        ],
        ["post", 2, "Salvei o print de cada trade no gráfico", null, /print/i],
        [
          "post",
          0,
          "Classifiquei cada trade: segui o plano ou não",
          null,
          /classifiquei|segui o plano/i,
        ],
        [
          "post",
          3,
          "Anotei o erro do dia e a lição em uma frase",
          null,
          /li[cç][aã]o|erro do dia/i,
        ],
        [
          "post",
          0,
          "Marquei os níveis e o viés para amanhã",
          null,
          /amanh[aã]/i,
        ],
        [
          "post",
          1,
          "Conferi o resultado do dia em R$ e em vezes o risco",
          null,
          /resultado do dia/i,
        ],
      ],
      M = {
        pre: ["Pré-mercado", "antes das 9h · prepare o dia"],
        during: ["Durante", "9h às 18h30 · antes de cada entrada"],
        post: ["Pós-mercado", "depois das 18h30 · feche o dia"],
      };
    function T() {
      const e = new Date().toLocaleString("en-US", {
          timeZone: "America/Sao_Paulo",
          hour12: !1,
        }),
        o = new Date(e);
      return { h: o.getHours(), m: o.getMinutes(), d: o };
    }
    function k() {
      const { h: e, m: o } = T(),
        t = e * 60 + o;
      return t < 540 ? "pre" : t < 1110 ? "during" : "post";
    }
    const A = "FGHJKMNQUVXZ",
      g = (e, o, t) => new Date(Date.UTC(e, o, t, 12)),
      K = (e) => {
        const o = e.getUTCDay();
        return o !== 0 && o !== 6;
      };
    function Q(e, o) {
      const t = g(e, o, 15);
      let r = null;
      for (let a = -3; a <= 3; a++) {
        const n = g(e, o, 15 + a);
        n.getUTCDay() === 3 &&
          (!r || Math.abs(a) < Math.abs(r.k)) &&
          (r = { x: n, k: a });
      }
      return r.x;
    }
    function X(e, o) {
      let t = g(e, o, 1);
      for (; !K(t); ) t = g(e, o, t.getUTCDate() + 1);
      return t;
    }
    function L() {
      const { d: e } = T(),
        o = g(e.getFullYear(), e.getMonth(), e.getDate());
      let t = o.getUTCFullYear(),
        r = o.getUTCMonth(),
        a = null;
      for (let s = 0; s < 14 && !a; s++) {
        const l = (r + s) % 12,
          d = t + Math.floor((r + s) / 12);
        if ((l + 1) % 2) continue;
        const c = Q(d, l);
        c >= o && (a = { cod: "WIN" + A[l] + String(d).slice(2), v: c });
      }
      let n = null;
      for (let s = 0; s < 3 && !n; s++) {
        const l = (r + s) % 12,
          d = t + Math.floor((r + s) / 12),
          c = X(d, l);
        c > o && (n = { cod: "WDO" + A[l] + String(d).slice(2), v: c });
      }
      const b = (s) => Math.round((s - o) / 864e5),
        x = (s) =>
          String(s.getUTCDate()).padStart(2, "0") +
          "/" +
          String(s.getUTCMonth() + 1).padStart(2, "0");
      return {
        win: a && { ...a, dias: b(a.v), data: x(a.v) },
        wdo: n && { ...n, dias: b(n.v), data: x(n.v) },
      };
    }
    const P = () =>
        p(() => {
          const e = S.days[D] || {};
          return typeof MDM < "u" && MDM === "us" ? e.us || {} : e;
        }, {}),
      $ = () =>
        p(
          () => S.trades.filter((e) => String(e.dt || "").slice(0, 10) === D),
          [],
        );
    function H() {
      const e = P();
      if (+e.maxP > 0) return +e.maxP;
      const o = p(() => +S.prop.perdaDia, 0);
      if (o > 0) return o;
      const t = [...i.querySelectorAll("#app *")].find(
          (a) =>
            a.children.length === 0 &&
            /^Limite de perda \(dia\)$/.test((a.textContent || "").trim()),
        ),
        r =
          t && t.closest("div,li") && t.closest("div,li").parentElement
            ? (t.closest("div,li").parentElement.textContent || "").match(
                /R\$\s*[\d.]+,\d{2}/,
              )
            : null;
      return r ? r[0] : null;
    }
    function N(e) {
      const o = P();
      if (e === "sono") {
        const t = o.sono;
        return t === "b"
          ? ["ok", "Você marcou: dormi bem"]
          : t === "m"
            ? [
                "av",
                "Você marcou: mais ou menos — considere operar com menos contratos",
              ]
            : t === "r"
              ? [
                  "ruim",
                  "Você marcou: dormi mal — dia para operar menor ou não operar",
                ]
              : ["?", 'Marque como dormiu em "Posso operar?"', "hoje"];
      }
      if (e === "turno") {
        const t = p(() => tcod(D), ""),
          r = { 8: "08h–17h", 16: "16h–00h", 0: "00h–08h" };
        return t
          ? t === "F"
            ? ["ok", "Hoje: folga"]
            : t === "8" || t === 8
              ? [
                  "ruim",
                  "Hoje: turno 8 (" +
                    r[8] +
                    ") — pregão inteiro em horário de trabalho",
                ]
              : t === "16" || t === 16
                ? [
                    "av",
                    "Hoje: turno 16 (" +
                      r[16] +
                      ") — dá para operar só até ~15h",
                  ]
                : t === "0" || t === 0
                  ? [
                      "av",
                      "Hoje: turno 0 (" +
                        r[0] +
                        ") — você vem da noite sem dormir; cuidado",
                    ]
                  : ["?", "Hoje: turno " + t]
          : ["?", "Escala de turno não configurada"];
      }
      if (e === "limite") {
        const t = H(),
          r = +o.maxT || +(o.pl2 && o.pl2.max) || 0;
        return t
          ? [
              "ok",
              "Limite: " +
                (typeof t == "number" ? j(t) : t) +
                (r ? " · até " + r + " trades" : ""),
            ]
          : ["?", "Limite de perda ainda não definido no Plano do dia"];
      }
      if (e === "plano") {
        const t = o.pl2 || {};
        return !!(
          String(o.plano || "").trim() ||
          t.vies ||
          (t.mods || []).length ||
          t.max
        )
          ? ["ok", "Plano registrado" + (t.vies ? " · viés de " + t.vies : "")]
          : ["?", "Plano ainda não escrito hoje"];
      }
      if (e === "venc") {
        const t = L(),
          r = [];
        let a = "ok";
        for (const n of [t.win, t.wdo])
          n &&
            (r.push(
              n.cod +
                " vence " +
                n.data +
                (n.dias === 0
                  ? " (hoje)"
                  : " (em " + n.dias + " dia" + (n.dias > 1 ? "s" : "") + ")"),
            ),
            n.dias <= 3 && (a = n.dias <= 1 ? "ruim" : "av"));
        return [a, r.join(" · ") + (a !== "ok" ? " — atenção à rolagem" : "")];
      }
      if (e === "risco") {
        const t = H();
        return [
          "info",
          "WIN: R$ 0,20 por ponto por contrato · WDO: R$ 10,00 por ponto por contrato" +
            (t ? " · limite do dia: " + (typeof t == "number" ? j(t) : t) : ""),
        ];
      }
      if (e === "stops") {
        const t = $()
          .filter((a) => a.exit != null && a.exit !== "")
          .sort((a, n) =>
            String(a.dtx || a.dt).localeCompare(String(n.dtx || n.dt)),
          );
        let r = 0;
        for (let a = t.length - 1; a >= 0; a--) {
          const n = t[a];
          if (
            (+n.exit - +n.entry) * (n.side === "S" || n.side === "V" ? -1 : 1) <
            0
          )
            r++;
          else break;
        }
        return r >= 2
          ? ["ruim", r + " stops seguidos agora — hora da pausa"]
          : ["ok", r ? "1 stop no último trade" : "Sem stops seguidos agora"];
      }
      if (e === "import") {
        const t = $().length;
        return t
          ? ["ok", t + " operação(ões) de hoje no diário"]
          : ["?", "Nenhuma operação de hoje no diário ainda"];
      }
      return e === "agenda"
        ? ["link", "", "agenda"]
        : e === "contexto"
          ? ["link", "", "cotacoes"]
          : e === "niveis"
            ? ["link", "", "term"]
            : null;
    }
    const ee = {
      agenda: "Abrir agenda ›",
      cotacoes: "Ver cotações ›",
      term: "Abrir Terminal ›",
      hoje: "Posso operar? ›",
    };
    function te(e) {
      try {
        if (e === "term") {
          (irPara("term"), scrollTo(0, 0));
          return;
        }
        if (e === "hoje") {
          const t = i.querySelector('[data-v4home="hoje"]');
          if (t) {
            t.click();
            return;
          }
        }
        (irPara("mercado"), scrollTo(0, 0));
        const o = e === "agenda" ? "Agenda" : "Cotações e Panorama";
        setTimeout(() => {
          const t = [
            ...i.querySelectorAll("#app .m403-primary-tabs button"),
          ].find((r) => (r.textContent || "").trim().startsWith(o));
          t && t.click();
        }, 120);
      } catch {}
    }
    const z = i.createElement("style");
    ((z.textContent = `
.v505-auto{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:4px 0 0;font-size:12px;line-height:1.35;color:var(--d-muted,#9ca0a9)}
.v505-auto i{font-style:normal;font-weight:700}
.v505-auto.ok i{color:var(--d-pos,#4ec489)}.v505-auto.av i{color:var(--d-data,#cfab69)}.v505-auto.ruim i{color:var(--d-neg,#eb7f6f)}.v505-auto.info i,.v505-auto.q i{color:var(--d-muted,#9ca0a9)}
.v505-auto button{border:0;background:none;color:var(--d-accent,#b58b3d);font:inherit;font-weight:700;padding:8px 0;min-height:40px;cursor:pointer}
.v505-fase{margin:4px 0 8px;font-size:13px;color:var(--d-muted,#9ca0a9)}
.v505-fase b{color:var(--d-text,#efeeeb)}
.v505-modelo{margin:12px 0 4px;padding:16px;border:1px dashed var(--d-line,#373a3f);border-radius:8px;background:rgba(181,139,61,0.05)}
.v505-modelo b{display:block;font-size:15px;color:var(--d-text,#efeeeb);margin-bottom:4px}
.v505-modelo p{margin:0 0 8px;font-size:13px;color:var(--d-muted,#9ca0a9);line-height:1.45}
.v505-modelo button{min-height:40px;padding:0 16px;border-radius:8px;border:0;background:var(--d-accent-strong,#3b3e43);color:#ffffff;font-weight:700;font-size:14px;cursor:pointer}
.v505-novo{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;color:var(--d-accent,#b58b3d);border:1px solid currentColor;vertical-align:1px}
/* editor de regras: texto inteiro, quebrando linha, sem cortar */
html body #app .card.g2:has(> textarea.v505-rt):not(#v505a):not(#v505b){grid-template-columns:minmax(0,1fr) auto!important;align-items:start}
#app textarea.v505-rt{width:100%;min-height:44px;resize:none;overflow:hidden;font:inherit;font-size:15px;line-height:1.4;padding:8px 12px;border-radius:8px;border:1px solid var(--d-line,#373a3f);background:var(--d-raised,#17181a);color:var(--d-text,#efeeeb);box-sizing:border-box}
#app input.v505-oculto{display:none!important}
`),
      (i.head || i.documentElement).appendChild(z));
    let m = null;
    f.addEventListener(
      "click",
      (e) => {
        const o =
          e.target.closest &&
          e.target.closest(
            '.dt393-phase [data-phase],[data-dt393-action="checkphase"]',
          );
        o &&
          ((m = { d: p(() => D, ""), f: o.dataset.phase, jan: k() }),
          setTimeout(q, 30));
      },
      !0,
    );
    function I(e) {
      const o = i.querySelectorAll("#app .dt393-phase [data-phase]");
      if (!o.length) return;
      o.forEach((a) => {
        const n = a.dataset.phase === e;
        (a.classList.toggle("active", n),
          a.setAttribute("aria-pressed", String(n)));
      });
      let t = 0;
      i.querySelectorAll("#app .dt393-checklist [data-rule-phase]").forEach(
        (a) => {
          ((a.hidden = a.dataset.rulePhase !== e), a.hidden || t++);
        },
      );
      const r = i.querySelector("#app .dt393-phase-empty");
      r && (r.hidden = t > 0);
    }
    function oe(e) {
      e = String(e || "");
      for (const o of E) if (o[3] && o[4].test(e)) return o[3];
      return null;
    }
    function R(e) {
      ((e.style.height = "auto"),
        (e.style.height = Math.max(44, e.scrollHeight) + "px"));
    }
    function O() {
      i.querySelectorAll("#app input[data-rid]:not(.v505-oculto)").forEach(
        (e) => {
          const o = i.createElement("textarea");
          ((o.className = "v505-rt"),
            (o.rows = 1),
            (o.value = e.value),
            o.setAttribute("aria-label", "Texto da regra"),
            o.addEventListener("input", () => {
              ((e.value = o.value),
                e.dispatchEvent(new Event("input", { bubbles: !0 })),
                R(o));
            }),
            o.addEventListener("change", () => {
              ((e.value = o.value),
                e.dispatchEvent(new Event("change", { bubbles: !0 })));
            }),
            o.addEventListener("blur", () => {
              e.dispatchEvent(new Event("blur", { bubbles: !1 }));
            }),
            e.classList.add("v505-oculto"),
            e.after(o),
            R(o));
        },
      );
    }
    function C() {
      const e = p(() => S.rules, []);
      return E.filter(
        ([, , o, , t]) =>
          !e.some(
            (r) =>
              t.test(String(r.t || "")) ||
              String(r.t || "")
                .trim()
                .toLowerCase() === o.toLowerCase(),
          ),
      );
    }
    function U() {
      const e = C();
      if (!e.length) return 0;
      const o = Date.now();
      for (const [t, r, a, n] of e)
        S.rules.push({ id: uid(), cat: r, t: a, phase: t, v505: n || 1, u: o });
      try {
        save();
      } catch {}
      try {
        render();
      } catch {}
      return e.length;
    }
    function q() {
      const e = i.querySelector("#app .dt393-checklist");
      if (!e) return;
      const o = p(() => D, "");
      m && (m.d !== o || m.jan !== k()) && (m = null);
      const t = i.querySelector("#app .dt393-phase [data-phase].active");
      m && t && t.dataset.phase !== m.f && I(m.f);
      const r =
        (i.querySelector("#app .dt393-phase [data-phase].active") || {}).dataset
          ?.phase || "pre";
      let a = e.parentElement.querySelector(":scope > .v505-fase");
      a ||
        ((a = i.createElement("div")),
        (a.className = "v505-fase"),
        e.before(a));
      const n = M[r] || M.pre,
        b = k() === r ? " · <b>agora</b>" : "",
        x = `<b>${n[0]}</b> — ${n[1]}${b}`;
      a.innerHTML !== x && (a.innerHTML = x);
      const s = p(() => S.rules, []);
      e.querySelectorAll(".dt393-checkitem").forEach((c) => {
        const y = c.querySelector("input[data-chk]");
        if (!y) return;
        const h = s.find((ne) => ne.id === y.dataset.chk);
        let u = c.querySelector(".v505-auto");
        const _ = h ? (typeof h.v505 == "string" ? h.v505 : oe(h.t)) : null,
          B = _ ? N(_) : null;
        if (!B) {
          u && u.remove();
          return;
        }
        const [v, Y, w] = B,
          Z =
            (Y
              ? `<span><i>${v === "ok" ? "✓" : v === "av" ? "!" : v === "ruim" ? "✕" : v === "info" ? "ⓘ" : v === "link" ? "" : "?"}</i> ${J(Y)}</span>`
              : "") +
            (w
              ? `<button type="button" data-v505vai="${w}">${ee[w]}</button>`
              : ""),
          G = c.querySelector("label > span") || c.querySelector("label") || c;
        ((!u || u.parentElement !== G) &&
          (u && u.remove(), (u = i.createElement("div")), G.appendChild(u)),
          (u.className = "v505-auto " + (v === "?" ? "q" : v)),
          u.innerHTML !== Z && (u.innerHTML = Z));
      });
      const l = C();
      let d = e.parentElement.querySelector(":scope > .v505-modelo");
      if (l.length >= 4) {
        d ||
          ((d = i.createElement("div")),
          (d.className = "v505-modelo"),
          e.after(d));
        const c = { pre: 0, during: 0, post: 0 };
        l.forEach((h) => c[h[0]]++);
        const y = `<b>Checklist profissional para WIN/WDO</b><p>Adiciona ${l.length} itens que faltam: ${c.pre} no pré-mercado, ${c.during} durante e ${c.post} no pós. Suas regras atuais continuam; você pode editar ou apagar qualquer item depois em Regras.</p><button type="button" data-v505modelo="1">Adicionar ${l.length} itens</button>`;
        d.innerHTML !== y && (d.innerHTML = y);
      } else d && d.remove();
    }
    i.addEventListener(
      "click",
      (e) => {
        const o = e.target.closest && e.target.closest("[data-v505vai]");
        if (o) {
          (e.preventDefault(), e.stopPropagation(), te(o.dataset.v505vai));
          return;
        }
        if (e.target.closest && e.target.closest("[data-v505modelo]")) {
          (e.preventDefault(), e.stopPropagation());
          const r = U();
          p(() =>
            toast(
              r
                ? r + " itens adicionados ao seu checklist."
                : "Seu checklist já tem todos os itens.",
              2600,
            ),
          );
        }
      },
      !0,
    );
    let F = 0;
    const V = () => {
      clearTimeout(F);
      try {
        q();
      } catch {}
      try {
        O();
      } catch {}
      F = setTimeout(() => {
        try {
          q();
        } catch {}
        try {
          O();
        } catch {}
      }, 80);
    };
    function ae() {
      if (typeof f.render0 != "function" || f.render0.__v505) return;
      const e = f.render0,
        o = function () {
          const t = e.apply(this, arguments);
          return (V(), t);
        };
      ((o.__v505 = 1), (f.render0 = o));
    }
    let W = 0;
    const re = setInterval(() => {
      (W++, ae(), V(), W > 20 && clearInterval(re));
    }, 700);
    (setInterval(() => {
      if (!i.hidden)
        try {
          q();
        } catch {}
    }, 3e4),
      (f.DIARIO_V505 = {
        MODELO: E,
        contratos: L,
        auto: N,
        faltando: C,
        aplicaModelo: U,
        faseAgora: k,
        aplicaFase: I,
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em checklist-v505.js", e);
}
