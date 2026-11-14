/* Diário de Trader v522 — camadas. Gerado a partir de: calendario-mercado-v379.js, interface.js, editorial-financeiro-v379.js, diagnostico-v386.js, icon-pack-v425.js, identidade-ativos-v390.js, mercado-visual-v388.js, terminal-mobile-v385.js, design-v402.js, mercado-v403.js, mercado-v404.js, panorama-v405.js, mercado-v406.js, mercado-v408.js, mercado-v409.js, mercado-v410.js, terminal-v413.js, recuperacao-v414.js, terminal-controls-v418.js, ajustes-v419.js, redesign-v420.js, terminal-gp-v421.js, acabamento-v423.js, acabamento-v427.js, bloomberg-v428.js, capas-v429.js, novidades-v430.js, terminal-v430.js, terminal-v431.js, terminal-v432.js, aulas-v433.js, aulas-v434.js, design-v502.js, inicio-v504.js, checklist-v505.js, planilha-v506.js, planilha-v507.js, rigidez-v508.js, extras-v512.js, extras-v514.js, extras-v516.js, extras-v517.js, extras-v518.js, extras-v519.js, extras-v520.js, estabiliza-v503.js */
try {
  (function (i, d) {
    const f = d();
    (typeof module == "object" && module.exports && (module.exports = f),
      i && (i.TraderCalendario = f));
  })(
    typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : null,
    function () {
      "use strict";
      const i = {
          2026: [
            "2026-01-01",
            "2026-02-16",
            "2026-02-17",
            "2026-04-03",
            "2026-04-21",
            "2026-05-01",
            "2026-06-04",
            "2026-09-07",
            "2026-10-12",
            "2026-11-02",
            "2026-11-20",
            "2026-12-24",
            "2026-12-25",
            "2026-12-31",
          ],
        },
        d = {
          2026: [
            "2026-01-01",
            "2026-01-19",
            "2026-02-16",
            "2026-04-03",
            "2026-05-25",
            "2026-06-19",
            "2026-07-03",
            "2026-09-07",
            "2026-11-26",
            "2026-12-25",
          ],
          2027: [
            "2027-01-01",
            "2027-01-18",
            "2027-02-15",
            "2027-03-26",
            "2027-05-31",
            "2027-06-18",
            "2027-07-05",
            "2027-09-06",
            "2027-11-25",
            "2027-12-24",
          ],
        },
        f = { "2026-11-27": 780, "2026-12-24": 780, "2027-11-26": 780 },
        o = (e, r) => {
          const a = Object.fromEntries(
            new Intl.DateTimeFormat("en-US", {
              timeZone: r,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h23",
            })
              .formatToParts(e)
              .filter((t) => t.type !== "literal")
              .map((t) => [t.type, t.value]),
          );
          return {
            date: a.year + "-" + a.month + "-" + a.day,
            year: +a.year,
            weekday: a.weekday,
            mins: +a.hour * 60 + +a.minute,
          };
        },
        y = (e) => {
          if (e instanceof Date) return e.getTime();
          if (typeof e == "number")
            return e > 1e12 ? e : e > 1e9 ? e * 1e3 : NaN;
          if (typeof e == "string" && e.trim()) {
            const r = Date.parse(e);
            return Number.isFinite(r) ? r : NaN;
          }
          return NaN;
        };
      function p(e = new Date()) {
        const r = e instanceof Date ? e : new Date(e);
        if (!Number.isFinite(r.getTime()))
          return { show: !1, reason: "data_invalida" };
        const a = o(r, "America/Sao_Paulo"),
          t = o(r, "America/New_York"),
          n = {
            brDate: a.date,
            usDate: t.date,
            brTime: a.mins,
            usTime: t.mins,
            show: !1,
          };
        if (!i[a.year] || !d[t.year])
          return { ...n, reason: "calendario_nao_verificado" };
        if (!i[a.year].includes(a.date))
          return { ...n, reason: "b3_sem_feriado" };
        if (
          ["Sat", "Sun"].includes(a.weekday) ||
          ["Sat", "Sun"].includes(t.weekday)
        )
          return { ...n, reason: "fim_de_semana" };
        if (a.date !== t.date)
          return { ...n, reason: "datas_de_mercado_diferentes" };
        if (d[t.year].includes(t.date)) return { ...n, reason: "nyse_feriado" };
        const m = f[t.date] || 960;
        return t.mins < 570 || t.mins >= m
          ? { ...n, reason: "nyse_fora_da_sessao_regular" }
          : {
              ...n,
              show: !0,
              reason: "b3_feriado_nyse_aberta",
              usCloseMins: m,
            };
      }
      function b(e, r, a = new Date()) {
        const t = y(e && e.ts),
          n = a.getTime();
        if (!Number.isFinite(t) || t > n + 6e4 || n - t > 5 * 6e4)
          return { ok: !1, reason: "consulta_adr_desatualizada", valid: 0 };
        if (!Array.isArray(e.itens))
          return { ok: !1, reason: "sem_cotacoes", valid: 0 };
        const m = o(a, "America/New_York").date,
          s = new Set();
        for (const u of e.itens) {
          if (!u || typeof u.s != "string" || u.s.toUpperCase() === "EWZ")
            continue;
          let _;
          try {
            _ = r(u);
          } catch {
            continue;
          }
          const c = _ && _.regular;
          if (
            !c ||
            !Number.isFinite(c.px) ||
            c.px <= 0 ||
            !Number.isFinite(c.chp)
          )
            continue;
          const l = y(c.at);
          !Number.isFinite(l) ||
            l > n + 6e4 ||
            n - l > 30 * 6e4 ||
            (o(new Date(l), "America/New_York").date === m &&
              s.add(u.s.toUpperCase()));
        }
        return s.size >= 2
          ? {
              ok: !0,
              reason: "cotacoes_validas",
              valid: s.size,
              symbols: [...s],
            }
          : {
              ok: !1,
              reason: "adrs_sem_cotacoes_recentes_suficientes",
              valid: s.size,
              symbols: [...s],
            };
      }
      function w(e, r, a) {
        const t = p(e);
        if (!t.show) return t;
        const n = b(r, a, e instanceof Date ? e : new Date(e));
        return {
          ...t,
          show: n.ok,
          reason: n.ok ? t.reason : n.reason,
          quotes: n,
        };
      }
      return Object.freeze({
        assess: p,
        quoteCheck: b,
        visibility: w,
        datePart: o,
        millis: y,
        calendarYears: [2026],
      });
    },
  );
} catch (e) {
  console.error("[v522] falha em calendario-mercado-v379.js", e);
}
try {
  ((function (s) {
    "use strict";
    if (s.TraderUI) return;
    const l = new Map(),
      r = new Map(),
      j = [],
      O = () => s.performance?.now?.() ?? Date.now();
    function G(z, M, E) {
      if (typeof M != "string" || !/^[a-z][a-z0-9-]{1,63}$/.test(M))
        throw new TypeError("Identificador de módulo inválido.");
      const u = typeof E == "function" ? { after: E } : { ...E };
      if (!u || (!u.before && !u.after))
        throw new TypeError("Informe um callback.");
      for (const P of ["before", "after"])
        if (u[P] != null && typeof u[P] != "function")
          throw new TypeError("Callback inválido.");
      return (
        z.set(M, u),
        () => {
          z.get(M) === u && z.delete(M);
        }
      );
    }
    function o(z, M, E, u) {
      const P = O();
      let m = !0;
      try {
        const c = [...M.values()],
          q = new Map();
        for (let g = c.length - 1; g >= 0; g--) {
          const R = c[g];
          R.before && q.set(R, R.before.apply(E, u));
        }
        const H = z.apply(E, u);
        for (const g of c) g.after && g.after.call(E, q.get(g), ...u);
        return ((m = !1), H);
      } finally {
        (j.push({
          kind: M === l ? "render" : "sheet",
          ms: Math.max(0, O() - P),
          failed: m,
        }),
          j.length > 100 && j.shift());
      }
    }
    const F = render0;
    render0 = function () {
      return o(F, l, this, [...arguments]);
    };
    const N = showSheet;
    showSheet = function () {
      return o(N, r, this, [...arguments]);
    };
    let e = null;
    const i = "dialog[open],.pfmd,#sh .ov,.wf-chat-panel:not([hidden])";
    function B() {
      if (!s.document?.documentElement) return;
      const z = [...document.querySelectorAll(i)].some(
        (M) => !M.hidden && getComputedStyle(M).display !== "none",
      );
      if (z && !e) {
        const M = document.body;
        e = { x: s.scrollX || 0, y: s.scrollY || 0, styles: {} };
        for (const E of ["position", "top", "left", "right", "width"])
          e.styles[E] = M.style[E];
        (M.classList.add("ui-overlay-open"),
          (M.style.position = "fixed"),
          (M.style.top = -e.y + "px"),
          (M.style.left = "0"),
          (M.style.right = "0"),
          (M.style.width = "100%"));
      } else if (!z && e) {
        const M = e;
        e = null;
        const E = document.body;
        for (const [u, P] of Object.entries(M.styles)) E.style[u] = P;
        (E.classList.remove("ui-overlay-open"), s.scrollTo(M.x, M.y));
      }
    }
    let Y = !1;
    (s.document?.body &&
      s.MutationObserver &&
      new s.MutationObserver(() => {
        Y ||
          ((Y = !0),
          queueMicrotask(() => {
            ((Y = !1), B());
          }));
      }).observe(document.body, {
        childList: !0,
        subtree: !0,
        attributes: !0,
        attributeFilter: ["open", "hidden", "class"],
      }),
      (s.TraderUI = Object.freeze({
        refreshScroll: B,
        onRender: (z, M) => G(l, z, M),
        onSheet: (z, M) => G(r, z, M),
        inspect: () => ({ render: [...l.keys()], sheet: [...r.keys()] }),
        metrics: () => {
          const z = j
            .filter((M) => M.kind === "render")
            .map((M) => M.ms)
            .sort((M, E) => M - E);
          return {
            samples: z.length,
            p95: z.length ? z[Math.ceil(z.length * 0.95) - 1] : null,
            last: j.at(-1)?.ms ?? null,
            failures: j.filter((M) => M.failed).length,
          };
        },
      })));
  })(window),
    (function (s) {
      "use strict";
      const l = {
          abertura: {
            name: "Pré-abertura",
            panels: ["WEI", "ECO", "WIRP", "TOP"],
          },
          brasil: {
            name: "Pesquisa Brasil",
            panels: ["MON", "PETR4 G", "PETR4 FA", "N PETR4"],
          },
          exterior: {
            name: "Pesquisa EUA",
            panels: ["WEI", "SPY G", "SPY FA", "N EUA"],
          },
          macro: {
            name: "Macro e juros",
            panels: ["WIRP", "ECST", "GC", "ECO"],
          },
        },
        r = [
          ["PESQUISA", "Ficha integrada do ativo"],
          ["COMPF", "Comparar fundamentos"],
          ["RADAR", "Filtros de empresas"],
          ["RISCO", "Pesquisa da carteira"],
          ["FLUXO", "Negócios recebidos da ponte"],
          ["MESA", "Espaços de trabalho integrados"],
          ["ATIVO", "Dossiê: gráfico, fundamentos e notícias"],
          ["COMPARAR", "Comparar de dois a quatro ativos"],
          ["VOLTAR", "Voltar ao espaço anterior"],
          ["GUIA", "Guia rápido do terminal"],
        ],
        j = () => s.TRM,
        O = (m) => /^[A-Z0-9.!:]{1,18}$/.test(m),
        G = (m) =>
          String(m || "")
            .trim()
            .toUpperCase()
            .replace(/\s+(?:<GO>|GO)$/, "");
      function o(m, c, q) {
        const H = document.createElement(m);
        return (c && (H.textContent = c), q && (H.className = q), H);
      }
      function F(m, c) {
        const q = o("button", m, "trpro-button");
        return ((q.type = "button"), q.addEventListener("click", c), q);
      }
      function N(m) {
        document.getElementById("trpro-dialog")?.close();
        const c = o("dialog", null, "trpro-dialog");
        ((c.id = "trpro-dialog"), c.setAttribute("aria-label", m));
        const q = o("header");
        return (
          q.append(
            o("h2", m),
            F("Fechar", () => c.close()),
          ),
          c.append(q),
          c.addEventListener("close", () => c.remove()),
          document.body.append(c),
          c.showModal(),
          c
        );
      }
      function e(m) {
        const c = j(),
          q = c?.TS();
        if (!q?.wss?.[m]) return !1;
        const H = (q.prof ??= { history: [] });
        return (
          q.ws !== m &&
            ((H.history = [...(H.history || []).filter((g) => g !== q.ws), q.ws]
              .filter(Boolean)
              .slice(-12)),
            (q.ws = m)),
          (c.TR.foco = 0),
          (c.TR.mob = 0),
          (c.TR.max = -1),
          typeof save == "function" && save(),
          typeof render == "function" && render(),
          !0
        );
      }
      function i(m, c, q) {
        const H = j()?.TS();
        if (!H?.wss) throw Error("Espaços do terminal não estão disponíveis.");
        return (
          H.wss[m] ||
            (H.wss[m] = {
              n: c,
              p: q.slice(),
              g: q.map((g, R) => ({
                x: (R % 2) * 6,
                y: Math.floor(R / 2) * 13,
                w: 6,
                h: 13,
              })),
            }),
          e(m)
        );
      }
      function B(m) {
        const c = l[m];
        return c ? i("prof_" + m, c.name, c.panels) : !1;
      }
      function Y(m) {
        if (((m = G(m)), !O(m)))
          throw Error("Informe um ticker válido, por exemplo PETR4 ou AAPL.");
        return i("prof_ativo_" + m, "Pesquisa · " + m, [
          m + " DES",
          m + " G",
          m + " FA",
          "N " + m,
        ]);
      }
      function z() {
        const m = j()?.TS(),
          c = m?.prof?.history || [];
        let q;
        for (; c.length && !q; ) {
          const H = c.pop();
          m.wss[H] && H !== m.ws && (q = H);
        }
        return q
          ? ((m.ws = q),
            (j().TR.foco = 0),
            (j().TR.mob = 0),
            (j().TR.max = -1),
            typeof save == "function" && save(),
            typeof render == "function" && render(),
            !0)
          : (typeof toast == "function" &&
              toast("Nenhum espaço anterior registrado."),
            !1);
      }
      function M() {
        const m = N("Espaços de trabalho");
        m.append(
          o(
            "p",
            "Organize funções em quatro painéis. Seus espaços existentes são preservados.",
            "trpro-note",
          ),
        );
        const c = o("div", null, "trpro-presets");
        for (const [H, g] of Object.entries(l))
          c.append(
            F(g.name + " · " + g.panels.join(" / "), () => {
              (B(H), m.close());
            }),
          );
        m.append(c);
        const q = j()?.TS();
        if (q?.wss) {
          m.append(o("h3", "Seus espaços"));
          for (const [H, g] of Object.entries(q.wss))
            m.append(
              F(g.n || H, () => {
                (e(H), m.close());
              }),
            );
        }
      }
      function E(m, c) {
        const q = N(
            m === "ATIVO" ? "Pesquisa por ativo" : "Comparação de ativos",
          ),
          H = o("form"),
          g = o(
            "label",
            m === "ATIVO"
              ? "Ticker"
              : "De dois a quatro tickers, separados por espaço",
          ),
          R = o("input");
        ((R.id = "trpro-tickers"),
          (R.value = c || ""),
          (R.placeholder = m === "ATIVO" ? "PETR4" : "PETR4 VALE3 IBOV"),
          (R.autocomplete = "off"),
          (g.htmlFor = R.id));
        const a = o("button", "Abrir", "trpro-button");
        a.type = "submit";
        const n = o("p", null, "trpro-note");
        (n.setAttribute("role", "status"),
          H.append(g, R, a, n),
          H.addEventListener("submit", (f) => {
            f.preventDefault();
            try {
              if (m === "ATIVO") Y(R.value);
              else {
                const h = [
                  ...new Set(
                    G(R.value)
                      .split(/[\s,;]+/)
                      .filter(Boolean),
                  ),
                ];
                if (h.length < 2 || h.length > 4 || h.some((Q) => !O(Q)))
                  throw Error("Use de dois a quatro tickers válidos.");
                if (!j()?.FN?.COMP)
                  throw Error("Comparação indisponível nesta instalação.");
                j().roda("COMP " + h.join(" "));
              }
              q.close();
            } catch (h) {
              n.textContent = h.message;
            }
          }),
          q.append(H),
          R.focus());
      }
      function u() {
        const m = N("Guia do terminal"),
          c = [
            ["Ctrl + Espaço", "Buscar funções, favoritos e recentes"],
            ["Ativo + função", "PETR4 G, PETR4 FA ou N PETR4"],
            ["MESA", "Abrir espaços de trabalho sem apagar os atuais"],
            ["ATIVO PETR4", "Criar um espaço integrado de pesquisa"],
            ["COMPARAR", "Abrir comparação de ativos"],
            ["VOLTAR", "Recuperar o espaço anterior"],
            ["Alt + 1 até 9", "Selecionar um painel existente"],
            ["DQ", "Conferir fontes e referências dos dados"],
          ];
        for (const [q, H] of c) {
          const g = o("p");
          (g.append(o("b", q + " · "), o("span", H)), m.append(g));
        }
        m.append(
          o(
            "p",
            "Cotações e recursos dependem das fontes conectadas. Este aplicativo não usa dados ou serviços Bloomberg.",
            "trpro-note",
          ),
        );
      }
      function P(m) {
        const c = G(m).split(/\s+/),
          q = c.shift(),
          H = c.join(" ");
        return r.some(([g]) => g === q)
          ? ["PESQUISA", "COMPF", "RADAR", "RISCO", "FLUXO"].includes(q)
            ? (s.TerminalResearch?.open(
                {
                  PESQUISA: "ativo",
                  COMPF: "comparar",
                  RADAR: "radar",
                  RISCO: "risco",
                  FLUXO: "fluxo",
                }[q],
                H || void 0,
              ),
              !0)
            : (q === "MESA" && M(),
              q === "ATIVO" && (H ? Y(H) : E(q)),
              q === "COMPARAR" && E(q, H),
              q === "VOLTAR" && z(),
              q === "GUIA" && u(),
              !0)
          : !1;
      }
      (s.addEventListener(
        "click",
        (m) => {
          if (
            !m.target.closest?.('[data-tr="go"]') ||
            !document.body.classList.contains("trmon")
          )
            return;
          const c = document.getElementById("trcmd");
          if (!(!c || !r.some(([q]) => G(c.value).split(/\s+/)[0] === q))) {
            (m.preventDefault(), m.stopImmediatePropagation());
            try {
              (P(c.value), (c.value = ""));
            } catch (q) {
              typeof toast == "function" && toast(q.message);
            }
          }
        },
        !0,
      ),
        s.addEventListener(
          "keydown",
          (m) => {
            if (
              !(!document.body.classList.contains("trmon") || m.isComposing)
            ) {
              if (
                m.target?.id === "trcmd" &&
                m.key === "Enter" &&
                r.some(([c]) => G(m.target.value).split(/\s+/)[0] === c)
              ) {
                (m.preventDefault(), m.stopImmediatePropagation());
                try {
                  (P(m.target.value), (m.target.value = ""));
                } catch (c) {
                  typeof toast == "function" && toast(c.message);
                }
                return;
              }
              if (
                m.altKey &&
                !m.ctrlKey &&
                !m.metaKey &&
                /^[1-9]$/.test(m.key) &&
                !m.target.closest(
                  "input,textarea,select,[contenteditable=true]",
                )
              ) {
                const c = Number(m.key) - 1;
                c < j().layAtual().p.length &&
                  (m.preventDefault(),
                  (j().TR.foco = c),
                  (j().TR.mob = c),
                  typeof render == "function" && render());
              }
            }
          },
          !0,
        ),
        (s.TraderTerminalActions = {
          commands: r,
          presets: l,
          execute: P,
          openWorkspace: B,
          dossier: Y,
          selectWorkspace: e,
          back: z,
        }));
    })(typeof window > "u" ? globalThis : window),
    (function () {
      "use strict";
      const s = [
        ["WEI", "Índices mundiais", "Mercado"],
        ["MON", "Minha lista de ativos", "Mercado"],
        ["ECO", "Agenda econômica", "Macro"],
        ["WIRP", "Expectativas de juros", "Macro"],
        ["TOP", "Principais notícias", "Notícias"],
        ["DQ", "Qualidade e origem dos dados", "Dados"],
        ["ESPACO", "Escolher espaço de trabalho", "Navegação"],
        ["HELP", "Ajuda e comandos", "Navegação"],
      ];
      let l,
        r,
        j,
        O,
        G = 0,
        o = [],
        F = "all",
        N,
        e = !1;
      const i = () => window.TRM,
        /* Ctrl+Espaço funciona em qualquer modo do Terminal; a barra clássica só existe em Painéis. */
        B = () => document.body.classList.contains("trmon"),
        Y = (J) =>
          String(J || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        z = (J) => (typeof J == "string" ? J.trim().slice(0, 180) : "");
      function M() {
        const J = i()?.TS()?.favoritos;
        return Array.isArray(J)
          ? [...new Set(J.map(z).filter(Boolean))].slice(0, 24)
          : [];
      }
      function E(J) {
        ((i().TS().favoritos = J.slice(0, 24)),
          typeof save == "function" && save(),
          h());
      }
      function u() {
        const J = i();
        if (!J) return "";
        const v = J.layAtual();
        return z(v.p[J.TR.foco] || v.p[0] || "");
      }
      function P() {
        try {
          return z(i().parse(u())?.tk);
        } catch {
          return "";
        }
      }
      function m(J) {
        const v = z(J);
        if (!v || !i() || (n(), window.TraderTerminalActions?.execute(v)))
          return;
        i().roda(v);
        const I = document.getElementById("trcmd");
        (I && ((I.value = ""), I.focus()), Q());
      }
      function c(J, v, I) {
        const k = document.createElement(J);
        return (v && (k.className = v), I !== void 0 && (k.textContent = I), k);
      }
      function q(J, v, I = "trbtn") {
        const k = c("button", I, J);
        return ((k.type = "button"), k.addEventListener("click", v), k);
      }
      function H(J) {
        const v = z(J);
        if (!v) return;
        const I = M();
        (E(I.includes(v) ? I.filter((k) => k !== v) : [v, ...I]),
          l?.open && a());
      }
      function g(J) {
        const v = new Map(
          s.map(([b, y, C]) => [b, { cmd: b, name: y, category: C }]),
        );
        for (const [b, y] of Object.entries(i()?.FN || {}))
          /^[A-Z0-9_]{1,20}$/.test(b) &&
            typeof y == "string" &&
            !v.has(b) &&
            v.set(b, { cmd: b, name: y.slice(0, 150), category: "Comandos" });
        for (const [b, y] of window.TraderTerminalActions?.commands || [])
          v.set(b, { cmd: b, name: y, category: "Painéis do Terminal" });
        const I = P();
        if (I)
          for (const [b, y] of [
            ["G", "Gráfico"],
            ["DES", "Visão da empresa"],
            ["FA", "Fundamentos"],
          ]) {
            const C = I + " " + b;
            v.set(C, {
              cmd: C,
              name: y + " · " + I,
              category: "Ativo do painel",
            });
          }
        I &&
          v.set("N " + I, {
            cmd: "N " + I,
            name: "Notícias · " + I,
            category: "Ativo do painel",
          });
        const k = M(),
          L = (i()?.TR.hist || []).map(z).filter(Boolean).slice(0, 20);
        for (const b of [...k, ...L])
          v.has(b) || v.set(b, { cmd: b, name: b, category: "Seus comandos" });
        const d = Y(J).trim(),
          $ = [...v.values()].filter(
            (b) =>
              (!window.TerminalCommandPolicy ||
                window.TerminalCommandPolicy.allows(b.cmd)) &&
              (!d || Y(b.cmd + " " + b.name + " " + b.category).includes(d)) &&
              (F !== "favorites" || k.includes(b.cmd)) &&
              (F !== "recent" || L.includes(b.cmd)),
          ),
          w = (b) =>
            d && Y(b.cmd).startsWith(d)
              ? -100
              : k.includes(b.cmd)
                ? -50
                : L.includes(b.cmd)
                  ? -20 + L.indexOf(b.cmd)
                  : 0;
        return $.sort(
          (b, y) => w(b) - w(y) || b.cmd.localeCompare(y.cmd),
        ).slice(0, 60);
      }
      function R(J) {
        o.length &&
          ((G = Math.max(0, Math.min(J, o.length - 1))),
          [...j.querySelectorAll("[data-command]")].forEach((v, I) => {
            (v.classList.toggle("selected", I === G),
              v.setAttribute("aria-current", I === G ? "true" : "false"));
          }),
          j.children[G]?.scrollIntoView({ block: "nearest" }),
          O &&
            (O.textContent =
              o[G].cmd + ". " + o[G].name + ". Enter para abrir."));
      }
      function a() {
        ((o = g(r.value)), (G = 0), j.replaceChildren());
        const J = M();
        (o.length ||
          j.append(
            c(
              "p",
              "trquick-empty",
              "Nenhum comando encontrado. Tente “gráfico”, “juros” ou “notícias”.",
            ),
          ),
          o.forEach((v, I) => {
            const k = c("div", "trquick-row"),
              L = q("", () => m(v.cmd), "trquick-open");
            ((L.dataset.command = v.cmd),
              (L.id = "trquick-option-" + I),
              L.append(
                c("b", "", v.cmd),
                c("span", "", v.name),
                c("small", "", v.category),
              ));
            const d = q(
              J.includes(v.cmd) ? "★" : "☆",
              () => H(v.cmd),
              "trquick-star",
            );
            (d.setAttribute(
              "aria-label",
              (J.includes(v.cmd) ? "Remover favorito " : "Favoritar ") + v.cmd,
            ),
              d.setAttribute("aria-pressed", String(J.includes(v.cmd))),
              k.append(L, d),
              j.append(k));
          }),
          R(0));
      }
      function n() {
        l?.open && (l.close(), N?.isConnected && N.focus());
      }
      function f() {
        if (B()) {
          if (!l) {
            ((l = c("dialog", "trquick-dialog")),
              l.setAttribute("aria-labelledby", "trquick-title"));
            const J = c("div", "trquick-head"),
              v = c("h2", "", "Encontrar um comando");
            ((v.id = "trquick-title"),
              J.append(v, q("Fechar", n)),
              (r = c("input", "trquick-search")),
              (r.type = "search"),
              (r.placeholder = "Busque uma função, assunto ou comando…"),
              r.setAttribute("aria-label", "Buscar comandos do terminal"),
              (r.autocomplete = "off"),
              r.addEventListener("input", a));
            const I = c("div", "trquick-filters");
            for (const [L, d] of [
              ["all", "Todos"],
              ["favorites", "Favoritos"],
              ["recent", "Recentes"],
            ]) {
              const $ = q(
                d,
                () => {
                  F = L;
                  for (const w of I.children)
                    w.setAttribute("aria-pressed", String(w === $));
                  a();
                },
                "trquick-filter",
              );
              ($.setAttribute("aria-pressed", String(L === "all")),
                I.append($));
            }
            ((j = c("div", "trquick-results")),
              j.setAttribute("aria-label", "Comandos encontrados"));
            const k = c(
              "p",
              "trquick-hint",
              "↑ ↓ selecionar · Enter abrir · Esc fechar · Ctrl + Espaço buscar",
            );
            ((O = c("p", "trquick-announcement")),
              O.setAttribute("role", "status"),
              O.setAttribute("aria-live", "polite"),
              l.append(J, r, I, j, k, O),
              document.body.append(l),
              l.addEventListener("keydown", (L) => {
                L.target === r &&
                  (L.key === "ArrowDown" || L.key === "ArrowUp"
                    ? (L.preventDefault(),
                      R(G + (L.key === "ArrowDown" ? 1 : -1)))
                    : L.key === "Enter" &&
                      o[G] &&
                      (L.preventDefault(), m(o[G].cmd)));
              }),
              l.addEventListener("click", (L) => {
                L.target === l && n();
              }),
              l.addEventListener("close", () => {
                N?.isConnected && N.focus();
              }));
          }
          if (l.open) {
            r.focus();
            return;
          }
          ((N = document.activeElement),
            (r.value = ""),
            a(),
            l.showModal(),
            r.focus());
        }
      }
      function h() {
        if (!B()) {
          n();
          return;
        }
        /* Sem a barra antiga (Início do Terminal) a busca continua disponível por Ctrl + Espaço e pelo Início. */
        const J = document.querySelector(".trbar");
        if (!J) return;
        if (!J.querySelector("[data-quick-open]")) {
          const w = q("Comandos", f);
          ((w.dataset.quickOpen = ""),
            (w.title = "Buscar comandos (Ctrl + Espaço)"),
            J.insertBefore(w, J.querySelector('[data-tr="sair"]')));
        }
        let v = document.querySelector(".trquick-strip");
        v ||
          ((v = c("div", "trquick-strip")),
          J.insertAdjacentElement("afterend", v));
        const I = u(),
          k = M(),
          L = P(),
          d = JSON.stringify([I, k]);
        if (v.dataset.signature === d) return;
        ((v.dataset.signature = d), v.replaceChildren());
        const $ = q(
          (k.includes(I) ? "★ " : "☆ ") + I,
          () => H(I),
          "trquick-chip",
        );
        if (
          (($.title = "Favoritar o comando do painel selecionado"),
          $.setAttribute("aria-pressed", String(k.includes(I))),
          v.append($),
          !v.querySelector("[data-workspace-open]"))
        ) {
          const w = q(
            "Espaços",
            () => window.TraderTerminalActions?.execute("MESA"),
            "trquick-chip",
          );
          ((w.dataset.workspaceOpen = ""),
            v.append(w),
            v.append(
              q(
                "Guia",
                () => window.TraderTerminalActions?.execute("GUIA"),
                "trquick-chip",
              ),
            ));
        }
        if (
          (L &&
            v.append(
              q(
                "Pesquisar " + L,
                () => window.TraderTerminalActions?.execute("ATIVO " + L),
                "trquick-chip",
              ),
            ),
          L)
        )
          for (const [w, b] of [
            ["G", "Gráfico"],
            ["FA", "Fundamentos"],
          ])
            v.append(q(b, () => m(L + " " + w), "trquick-chip"));
        if (
          (v.append(q("Qualidade dos dados", () => m("DQ"), "trquick-chip")),
          k.length)
        ) {
          v.append(c("span", "trquick-label", "Favoritos"));
          for (const w of k.slice(0, 6))
            v.append(q(w, () => m(w), "trquick-chip favorite"));
        }
        v.append(c("span", "trquick-key", "Ctrl + Espaço"));
      }
      function Q() {
        e ||
          ((e = !0),
          requestAnimationFrame(() => {
            ((e = !1), h());
          }));
      }
      (document.addEventListener(
        "keydown",
        (J) => {
          B() &&
            (J.ctrlKey || J.metaKey) &&
            J.code === "Space" &&
            !J.isComposing &&
            (J.preventDefault(), J.stopImmediatePropagation(), f());
        },
        !0,
      ),
        document.addEventListener("pointerup", (J) => {
          J.target.closest?.(".trp,.trtabs,.trbar") && Q();
        }),
        new MutationObserver((J) => {
          J.some((v) =>
            [...v.addedNodes].some(
              (I) =>
                I.nodeType === 1 &&
                (I.matches?.(".trm,.trbar") || I.querySelector?.(".trbar")),
            ),
          ) && Q();
        }).observe(document.getElementById("app") || document.body, {
          childList: !0,
          subtree: !0,
        }),
        (window.DiarioTerminalTools = { show: f, catalog: g, run: m }),
        window.TerminalAcoes?.registrar("@commands", f, B),
        Q());
    })(),
    (() => {
      "use strict";
      const s = () => document.getElementById("app"),
        l = (o) =>
          (S.rules || []).reduce((F, N) => F + !!(o.chk || {})[N.id], 0),
        r = (o) => typeof o == "string" && o.trim().length > 0;
      function j() {
        const o = S.days[loc().slice(0, 10)] || {},
          F = l(o),
          N = (S.rules || []).length,
          e = (S.trades || []).filter(
            (Y) => String(Y.dt || "").slice(0, 10) === loc().slice(0, 10),
          ),
          i = [r(o.plano), e.length > 0, r(o.resumo)],
          B = document.createElement("section");
        return (
          (B.className = "routine-card"),
          B.setAttribute("aria-labelledby", "routine-title"),
          (B.innerHTML = `<div class="routine-heading"><div><span class="routine-eyebrow">DIÁRIO · BRASIL</span><h2 id="routine-title">Sua rotina de hoje</h2><p>Prepare o dia. Registre suas decisões. Revise o processo.</p></div></div>
      <div class="routine-progress"><span>${i.filter(Boolean).length} de 3 etapas com registro</span><progress max="3" value="${i.filter(Boolean).length}" aria-label="Etapas da rotina com registro"></progress></div><div class="routine-steps">
        <button type="button" data-routine="pre"><span class="routine-number">01</span><span><b>Preparar</b><small>${r(o.plano) ? "Plano registrado" : "Estado, limites e plano do dia"}</small></span><span aria-hidden="true">›</span></button>
        <button type="button" data-routine="dur"><span class="routine-number">02</span><span><b>Registrar</b><small>${e.length ? e.length + " trade(s) registrado(s) hoje" : "Trades, emoções e decisões"}</small></span><span aria-hidden="true">›</span></button>
        <button type="button" data-routine="pos"><span class="routine-number">03</span><span><b>Revisar</b><small>${r(o.resumo) ? "Reflexão registrada" : "Aprendizados e regras seguidas"}</small></span><span aria-hidden="true">›</span></button>
      </div><div class="routine-footer"><span>Regras seguidas: <b>${F} de ${N}</b></span><button type="button" class="btn s" data-routine="checklist">${N ? "Revisar checklist" : "Definir minhas regras"}</button></div>`),
          B
        );
      }
      function O(o) {
        const F = [...o.querySelectorAll("input[data-chk]")];
        if (!F.length) return;
        const N = F[0].closest(".card");
        if (!N) return;
        N.classList.add("journal-checklist");
        let e = N.querySelector(".checklist-progress");
        e ||
          ((e = document.createElement("div")),
          (e.className = "checklist-progress"),
          e.setAttribute("role", "status"),
          e.setAttribute("aria-live", "polite"),
          N.prepend(e));
        const i = F.filter((B) => B.checked).length;
        ((e.textContent = `${i} de ${F.length} regras seguidas · marque após avaliar suas operações`),
          F.forEach((B) =>
            B.closest("label")?.classList.toggle("checklist-done", B.checked),
          ));
      }
      function G() {
        const o = s();
        if (!o) return;
        (o.classList.toggle("journal-view", tab === "dia"),
          o.classList.toggle("home-view", tab === "home"),
          tab === "home" && !o.querySelector(".routine-card") && o.prepend(j()),
          o.querySelectorAll(".mc,.cal").forEach((N) => {
            N.classList.add("month-grid");
            const e = N.previousElementSibling;
            (e?.classList.contains("top") &&
              e.classList.add("calendar-heading"),
              N.querySelectorAll('button[data-a="cday"]').forEach((i) => {
                const B = i.dataset.id;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(B || "")) return;
                const Y = new Date(`${B}T12:00:00`).toLocaleDateString(
                  "pt-BR",
                  { day: "numeric", month: "long", year: "numeric" },
                );
                (i.setAttribute("aria-label", `Abrir diário de ${Y}`),
                  B === loc().slice(0, 10) &&
                    i.setAttribute("aria-current", "date"));
              }));
          }),
          o
            .querySelectorAll('button[data-a="cm"],button[data-a="tsm"]')
            .forEach((N) => {
              N.setAttribute(
                "aria-label",
                Number(N.dataset.id) < 0 ? "Mês anterior" : "Próximo mês",
              );
            }),
          tab === "dia" && O(o),
          o
            .querySelectorAll('button[data-a="dprev"],button[data-a="dnext"]')
            .forEach((N) => {
              N.setAttribute(
                "aria-label",
                N.dataset.a === "dprev" ? "Dia anterior" : "Próximo dia",
              );
            }),
          o
            .querySelectorAll("input#dd")
            .forEach((N) => N.setAttribute("aria-label", "Data do diário")));
        const F = {
          "😫": "Muito mal",
          "😕": "Mal",
          "😐": "Neutro",
          "🙂": "Bem",
          "😄": "Muito bem",
        };
        (o.querySelectorAll(".chips2 button").forEach((N) => {
          const e = F[N.textContent.trim()];
          e &&
            (N.setAttribute("aria-label", "Estado emocional: " + e),
            N.setAttribute("aria-pressed", String(N.classList.contains("on"))));
        }),
          document
            .querySelectorAll('button[data-a="deltrade"]')
            .forEach((N) => {
              ((N.textContent = delArm
                ? "Confirmar exclusão"
                : "Excluir trade"),
                N.setAttribute("aria-label", N.textContent));
            }));
      }
      (window.TraderUI.onRender("diario-profissional", G),
        window.TraderUI.onSheet("diario-profissional", G),
        document.addEventListener("change", (o) => {
          o.target.matches("input[data-chk]") && s() && O(s());
        }),
        document.addEventListener("click", (o) => {
          const F = o.target.closest("[data-routine]");
          if (!F) return;
          const N = F.dataset.routine;
          if (
            ((D = loc().slice(0, 10)),
            (DV = "ed"),
            typeof mdmSet == "function" && mdmSet("br"),
            N === "checklist" && !S.rules.length
              ? (tab = "regras")
              : ((tab = "dia"),
                (DFASE = { d: D, f: N === "checklist" ? "pos" : N })),
            irPara(tab),
            N === "checklist")
          ) {
            const e = s()?.querySelector("input[data-chk]");
            (e?.closest(".card")?.scrollIntoView({ block: "center" }),
              e?.focus({ preventScroll: !0 }));
          } else window.scrollTo(0, 0);
        }),
        G());
    })(),
    (() => {
      "use strict";
      FN_ESPERADA.macro = "v296";
      const s = [
          {
            id: "home",
            name: "Início",
            icon: "home",
            description: "Resumo e rotina de hoje",
            items: [["home", "Visão do dia"]],
          },
          {
            id: "diario",
            name: "Meu dia",
            icon: "book",
            description: "Preparação, registro e revisão",
            items: [
              ["dia:ed", "Meu dia e checklist"],
              ["ops:historico", "Histórico de operações"],
              ["regras", "Minhas regras"],
            ],
          },
          {
            id: "analises",
            name: "Análises",
            icon: "chart",
            description: "Pesquisa técnica e fundamentalista com fontes",
            items: [["analises", "Análise técnica e fundamentalista"]],
          },
          {
            id: "operacoes",
            name: "Operações",
            icon: "chart",
            description: "Modalidades e desempenho",
            items: [
              ["ops", "Todas as modalidades"],
              ["ops:desempenho", "Desempenho"],
              ["rev", "Revisão da semana"],
            ],
          },
          {
            id: "mercado",
            name: "Mercado",
            icon: "news",
            description: "Panorama, notícias, análises e cotações",
            items: [
              ["mercado:mu", "Panorama global"],
              ["mercado:pn", "Painel de mercado"],
              ["mercado:giro", "Giro de mercado"],
              ["mercado:jr", "Jornal do Pregão"],
              ["mercado:ag", "Agenda econômica"],
              ["mercado:nt", "Notícias"],
              ["juros", "Juros e DI"],
              ["mercado:lab", "Sazonalidade e sentimento · Brasil/EUA"],
              ["graf", "Gráficos"],
              ["mercado:cq", "Cotações e ADRs"],
              ["live", "Ponte do Profit e radar"],
            ],
          },
          {
            id: "terminal",
            name: "Terminal",
            icon: "monitor",
            description: "Segunda tela independente · inteligência de mercado",
            items: [["term", "Abrir Terminal"]],
          },
          {
            id: "patrimonio",
            name: "Patrimônio",
            icon: "wallet",
            description: "Carteiras, análise e impostos",
            items: [
              ["carteiras", "Carteiras Brasil e EUA"],
              ["analise", "Análise IA"],
              ["imposto", "Imposto de renda"],
            ],
          },
          {
            id: "gestao",
            name: "Gestão",
            icon: "shield",
            description: "Risco, capital e processo",
            items: [
              ["mesa", "Mesa proprietária"],
              ["painel", "Metas, posição e backup"],
              ["contratos", "Dimensionamento de contratos"],
              ["carreira", "Plano de transição"],
            ],
          },
          {
            id: "estudos",
            name: "Estudos",
            icon: "book",
            description: "Biblioteca, cursos e simulados",
            items: [["estudos", "Central de estudos"]],
          },
          {
            id: "conta",
            name: "Configurações",
            icon: "gear",
            description: "Alertas, conta e preferências",
            items: [
              ["mercado:al", "Alertas e notificações"],
              ["conta", "Conta e sincronização"],
              ["import", "Importar operações"],
              ["mais", "Aparência"],
              ["status", "Status das fontes"],
            ],
          },
        ],
        l = [
          {
            name: "Panorama",
            items: [
              ["mercado:mu", "Mundo"],
              ["mercado:pn", "Painel"],
              ["mercado:giro", "Giro"],
              ["juros", "Juros e DI"],
            ],
          },
          {
            name: "Notícias",
            items: [
              ["mercado:nt", "Notícias"],
              ["mercado:jr", "Jornal do Pregão"],
              ["mercado:ag", "Agenda econômica"],
            ],
          },
          {
            name: "Análises",
            items: [
              ["mercado:lab", "Sazonalidade e sentimento"],
              ["graf", "Gráficos"],
            ],
          },
          {
            name: "Cotações",
            items: [
              ["mercado:cq", "Monitor de ativos"],
              ["live", "Profit e radar"],
            ],
          },
        ],
        r = (y) => esc(String(y ?? "")),
        j = () =>
          tab === "mercado"
            ? `mercado:${["saz", "se", "sazus"].includes(MKT.tab) ? "lab" : MKT.tab === "cot" ? "cq" : MKT.tab}`
            : tab === "dia"
              ? `dia:${DV === "hist" ? "hist" : "ed"}`
              : tab,
        O = () =>
          s.find((y) => y.items.some(([C]) => C === j()))?.id ||
          ([
            "trades",
            "swing",
            "opc",
            "ativos",
            "dash",
            "opgrade",
            "opfluxo",
            "opcart",
            "swbt",
            "dtrpy",
          ].includes(tab)
            ? "operacoes"
            : ""),
        G = (y) => (window.icoSvg ? window.icoSvg(y) : ""),
        o = ([y, C], V = "") =>
          `<button type="button" class="${V}" data-navroute="${r(y)}"${j() === y ? ' aria-current="page"' : ""}>${r(C)}</button>`,
        F = () =>
          `<div class="pro-market-subgroups" aria-label="Páginas do Mercado">${l.map((y) => `<details class="pro-market-subgroup" data-market-subgroup="${r(y.name)}"${y.items.some(([C]) => C === j()) ? " open" : ""}><summary><strong>${r(y.name)}</strong><small>${y.items.length} ${y.items.length === 1 ? "página" : "páginas"}</small></summary><div class="pro-market-links">${y.items.map((C) => o(C)).join("")}${y.name === "Cotações" ? '<button type="button" data-research-menu>Pesquisa de investimentos</button><button type="button" data-flow-menu>Fluxo de negócios · Profit</button>' : ""}</div></details>`).join("")}</div>`;
      function N(y) {
        ((y.innerHTML = `<div class="pro-menu-header"><div><small>DIÁRIO DE TRADER</small><b>Seu espaço de trabalho</b></div><button type="button" data-navclose aria-label="Fechar menu">×</button></div>
      <label class="pro-menu-search">Encontrar função<input type="search" data-navsearch placeholder="Diário, sazonalidade, risco…" autocomplete="off"></label>
      <div class="pro-menu-groups">${s
        .map(
          (C) =>
            `<details class="pro-menu-group" data-navgroup="${C.id}"${O() === C.id ? " open" : ""}><summary><span class="pro-menu-icon">${G(C.icon)}</span><span><b>${C.name}</b><small>${C.description}</small></span></summary><div>${
              C.id === "mercado"
                ? F()
                : C.items
                    .filter(([V]) => V !== "mercado:sazus")
                    .map((V) => o(V))
                    .join("")
            }${C.id === "home" ? '<button type="button" data-wf="organize-home">Organizar início</button>' : ""}${C.id === "conta" ? '<button type="button" data-wf="quality">Dados e fontes</button><button type="button" data-wf="reports">Relatórios</button>' : ""}</div></details>`,
        )
        .join("")}</div>
      <p class="pro-menu-note">Navegação simplificada · Interface v360</p>`),
          y.querySelector("[data-navclose]")?.addEventListener("click", (C) => {
            (C.preventDefault(), C.stopPropagation());
            const V = document.body.classList.contains("pc");
            (document.body.classList.remove("pcmenu", "trmenu"),
              (document.body.style.overflow = ""),
              V ||
                (document.getElementById("mdr2")?.remove(),
                document.getElementById("mdr")?.remove()),
              document.getElementById(V ? "pcmenub" : "mbtn")?.focus());
          }),
          y
            .querySelector("[data-navsearch]")
            ?.addEventListener("input", (C) => {
              const V = C.target.value
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim();
              y.querySelectorAll("[data-navgroup]").forEach((X) => {
                let _ = !1;
                (X.querySelectorAll(
                  "[data-navroute],[data-wf],[data-research-menu],[data-flow-menu]",
                ).forEach((K) => {
                  const U = (oe) =>
                      String(oe || "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase(),
                    te = X.querySelector(":scope > summary")?.textContent || "",
                    ue =
                      K.closest("[data-market-subgroup]")?.querySelector(
                        "summary",
                      )?.textContent || "",
                    ge =
                      !V ||
                      U(K.textContent).includes(V) ||
                      U(te).includes(V) ||
                      U(ue).includes(V);
                  ((K.hidden = !ge), (_ ||= ge));
                }),
                  (X.hidden = !_),
                  (X.open = V ? _ : X.dataset.navgroup === O()),
                  X.querySelectorAll("[data-market-subgroup]").forEach((K) => {
                    const U = [
                      ...K.querySelectorAll(
                        "[data-navroute],[data-research-menu],[data-flow-menu]",
                      ),
                    ].some((te) => !te.hidden);
                    ((K.hidden = !!V && !U),
                      (K.open = V
                        ? U
                        : [...K.querySelectorAll("[data-navroute]")].some(
                            (te) => te.dataset.navroute === j(),
                          )));
                  }));
              });
            }));
      }
      window.DIARIO_NAV = { groups: s, marketGroups: l, menu: N, navigate: i };
      const e = document.querySelector?.("#mdr2 .pn");
      (e && N(e),
        (grpHeader = function (y) {
          const C = s.find((V) => V.items.some(([X]) => X === y));
          return !C || C.items.length < 2
            ? ""
            : `<div class="pro-subtabs" role="navigation" aria-label="${r(C.name)}">${C.items
                .filter(([V]) => V !== "mercado:sazus")
                .map((V) => o(V, V[0] === y ? "on" : ""))
                .join("")}</div>`;
        }));
      function i(y) {
        const C = tab === "mercado" && y.startsWith("mercado:"),
          X = (
            C ? document.querySelector("#app .m403-primary-tabs") : null
          )?.getBoundingClientRect().top;
        (y === "mercado:cot" && (y = "mercado:cq"),
          y === "mercado:sazus"
            ? ((u.section = "us"), (y = "mercado:lab"))
            : y === "mercado:lab" && (u.section = "br"));
        const [_, K] = y.split(":");
        if (_ === "dia") ((DV = K || "ed"), (tab = "dia"));
        else if (_ === "mercado") {
          ((tab = "mercado"), (MKT.tab = K || "cq"));
          try {
            ls.set("diario-mkt-tab", MKT.tab);
          } catch {}
        } else ((tab = _), ["trades", "swing", "opc"].includes(_) && (LT = _));
        (document.getElementById("mdr2")?.remove(),
          document.getElementById("mdr")?.remove(),
          (document.body.style.overflow = ""),
          irPara(tab),
          C && Number.isFinite(X)
            ? queueMicrotask(() => {
                const U = document.querySelector("#app .m403-primary-tabs");
                if (!U) return;
                const te = Math.max(
                  0,
                  window.scrollY + U.getBoundingClientRect().top - X,
                );
                window.scrollTo({ top: te, behavior: "instant" });
              })
            : window.scrollTo({ top: 0, behavior: "instant" }));
      }
      (document.addEventListener("click", (y) => {
        const C = y.target.closest("[data-navroute]");
        C && i(C.dataset.navroute);
      }),
        (segM = function () {
          if (j() === "mercado:al")
            return '<section class="m355-settings-head" aria-label="Configurações de alertas"><div class="m355-crumb"><button type="button" data-navroute="mais">Configurações</button><span aria-hidden="true">/</span><span>Alertas</span></div><span class="routine-eyebrow">PREFERÊNCIAS · NOTIFICAÇÕES</span><h1>Alertas e notificações</h1><p>Gerencie avisos de preço, eventos e notificações dos seus dispositivos em um único lugar.</p></section>';
          const y = j(),
            C = l.find((X) => X.items.some(([_]) => _ === y)) || l[0],
            V = C.items.find(([X]) => X === y) || C.items[0];
          /* Tela única: o cabeçalho antigo do Mercado não é mais desenhado; a navegação fica nas abas do Mercado. */
          return (void C, void V, "");
        }));
      const B = vAlertas;
      ((vAlertas = function () {
        return B("").replace(
          '<div class="top"><b>Alertas</b></div>',
          '<div class="top"><b>Gerenciar alertas</b></div>',
        );
      }),
        document.addEventListener("change", (y) => {
          const C = y.target.closest?.("[data-m355-market-page]");
          C &&
            l.some((V) => V.items.some(([X]) => X === C.value)) &&
            i(C.value);
        }),
        window.TraderUI?.onRender?.("mercado-v355", () => {
          document
            .getElementById("app")
            ?.classList.toggle(
              "m355-settings-alerts",
              tab === "mercado" && MKT.tab === "al",
            );
        }));
      const Y = vMais,
        z = () => {
          try {
            return ls.get("diario-densidade-v284") === "compact"
              ? "compact"
              : "comfortable";
          } catch {
            return "comfortable";
          }
        },
        M = () => document.documentElement?.setAttribute("data-density", z());
      (M(),
        (vMais = function () {
          const y = Y.apply(this, arguments),
            C = y.indexOf("<h2>Apar");
          return (
            '<h1>Preferências</h1><p class="mut">Personalize a aparência do seu espaço.</p>' +
            (C >= 0 ? y.slice(C) : y) +
            `<h2>Densidade da interface</h2><p class="mut sm">Confortável para escrever e usar no celular. Compacta para comparar mais informações no computador.</p><div class="pro-subtabs">${[
              ["comfortable", "Confortável"],
              ["compact", "Compacta"],
            ]
              .map(
                ([V, X]) =>
                  `<button type="button" data-prodensity="${V}" class="${z() === V ? "on" : ""}" aria-pressed="${z() === V}">${X}</button>`,
              )
              .join("")}</div>`
          );
        }));
      const E = vMais;
      vMais = function () {
        const y = E.apply(this, arguments),
          C =
            '<section class="m355-alerts-link"><div class="m355-alerts-icon" aria-hidden="true">🔔</div><div><span>CONFIGURAÇÕES</span><h2>Alertas e notificações</h2><p>Preços, eventos, lembretes e avisos no PC e no celular.</p></div><button type="button" data-navroute="mercado:al">Gerenciar</button></section>',
          V = '<p class="mut">Personalize a aparência do seu espaço.</p>';
        return y.includes(V) ? y.replace(V, V + C) : C + y;
      };
      const u = {
          section: "br",
          asset: "spx",
          view: "mensal",
          lookback: 20,
          eventType: "midterm",
          eventCategory: "todos",
          window: "d1",
          cycle: 2,
          month: new Date().getMonth() + 1,
          value: null,
          busy: !1,
          error: "",
          lastAttempt: 0,
          extra: null,
          extraAsset: "",
          extraBusy: !1,
          extraError: "",
          extraLast: 0,
        },
        P = (y) =>
          typeof y == "number" && Number.isFinite(y)
            ? `${y > 0 ? "+" : ""}${y.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
            : "—",
        m = (y) =>
          `<span class="${y > 0 ? "g" : y < 0 ? "r" : "mut"}">${P(y)}</span>`,
        c = [
          "Janeiro",
          "Fevereiro",
          "Março",
          "Abril",
          "Maio",
          "Junho",
          "Julho",
          "Agosto",
          "Setembro",
          "Outubro",
          "Novembro",
          "Dezembro",
        ];
      function q(y, C = 0) {
        const V = (Array.isArray(y?.observacoes) ? y.observacoes : []).filter(
            (ee) => Number.isFinite(ee?.valor) && Number.isInteger(+ee.ano),
          ),
          X = V.reduce((ee, ae) => Math.max(ee, +ae.ano), 0),
          _ = C ? V.filter((ee) => +ee.ano >= X - C + 1) : V,
          K = _.map((ee) => ee.valor).sort((ee, ae) => ee - ae),
          U = K.length;
        if (!U)
          return {
            ...y,
            n: 0,
            observacoes: [],
            media: null,
            mediana: null,
            positivas: null,
            melhor: null,
            pior: null,
            desvio: null,
            absmedia: null,
            absmediana: null,
            quedas: null,
            fortes3: null,
            fortes5: null,
            p25: null,
            p75: null,
          };
        const te = K.reduce((ee, ae) => ee + ae, 0) / U,
          ue = (ee) =>
            ee.length % 2
              ? ee[Math.floor(ee.length / 2)]
              : (ee[ee.length / 2 - 1] + ee[ee.length / 2]) / 2,
          ge = K.map(Math.abs).sort((ee, ae) => ee - ae),
          oe = (ee, ae) => {
            const se = (ee.length - 1) * ae,
              me = Math.floor(se),
              ve = Math.ceil(se);
            return ee[me] + (ee[ve] - ee[me]) * (se - me);
          };
        return {
          ...y,
          n: U,
          observacoes: _,
          media: te,
          mediana: ue(K),
          positivas: (K.filter((ee) => ee > 0).length / U) * 100,
          quedas: (K.filter((ee) => ee < 0).length / U) * 100,
          melhor: K[U - 1],
          pior: K[0],
          desvio:
            U > 1
              ? Math.sqrt(
                  K.reduce((ee, ae) => ee + (ae - te) ** 2, 0) / (U - 1),
                )
              : null,
          absmedia: ge.reduce((ee, ae) => ee + ae, 0) / U,
          absmediana: ue(ge),
          fortes3: (ge.filter((ee) => ee >= 3).length / U) * 100,
          fortes5: (ge.filter((ee) => ee >= 5).length / U) * 100,
          p25: oe(K, 0.25),
          p75: oe(K, 0.75),
        };
      }
      function H(y) {
        const C = y
            .filter((X) => X.n >= 8 && X.absmedia != null)
            .sort((X, _) => _.absmedia - X.absmedia),
          V = C[0]?.absmedia || 1;
        return `<section class="us-rank"><div class="us-rank-head"><div><h3>Meses com maior movimentação histórica</h3><p>Ranking pela média do valor absoluto da variação mensal (fechamento a fechamento), sem considerar a direção.</p></div><span>Amostra ≥ 8 anos</span></div>${C.length ? `<div class="us-rank-grid">${C.map((X, _) => `<button type="button" class="us-rank-item${X.mes === u.month ? " selected" : ""}" data-usmonth="${X.mes}" title="Ver detalhes de ${c[X.mes - 1]}"><span class="us-rank-label"><b>${_ + 1}. ${c[X.mes - 1]}</b><strong>${P(X.absmedia)}</strong></span><span class="us-rank-bar"><i style="width:${Math.max(3, Math.min(100, (X.absmedia / V) * 100)).toFixed(1)}%"></i></span><small>${X.n} anos · ${P(X.fortes3)} tiveram |retorno| ≥ 3%</small></button>`).join("")}</div>` : '<p class="us-caution">Histórico insuficiente para comparar os meses com segurança.</p>'}<p class="us-footnote">A média absoluta não equivale a amplitude intradiária ou volume. Ranking histórico não é projeção do próximo mês.</p></section>`;
      }
      const g = {
          cpi: {
            name: "Inflação CPI",
            focus: "DXY · Treasuries · Nasdaq",
            source: "Bureau of Labor Statistics",
          },
          payroll: {
            name: "Emprego (Payroll)",
            focus: "Juros EUA · DXY · S&P 500",
            source: "Bureau of Labor Statistics",
          },
          fomc: {
            name: "Decisão do FOMC",
            focus: "Fed Funds · US10Y · Nasdaq",
            source: "Federal Reserve",
          },
          opex: {
            name: "Vencimento de opções",
            focus: "Opções e índices · ajustes de posições",
            source: "Cboe",
          },
        },
        R = [
          ...["2026-11-10", "2026-12-10"].map((y) => ({ d: y, t: "cpi" })),
          ...[
            "2026-11-06",
            "2026-12-04",
            "2027-01-08",
            "2027-02-05",
            "2027-03-05",
            "2027-04-02",
            "2027-05-07",
            "2027-06-04",
            "2027-07-02",
            "2027-08-06",
            "2027-09-03",
            "2027-10-08",
            "2027-11-05",
            "2027-12-03",
          ].map((y) => ({ d: y, t: "payroll" })),
          ...[
            "2026-12-09",
            "2027-01-27",
            "2027-03-17",
            "2027-04-28",
            "2027-06-09",
            "2027-07-28",
            "2027-09-15",
            "2027-10-27",
            "2027-12-08",
          ].map((y) => ({ d: y, t: "fomc" })),
          ...["2026-11-20", "2026-12-18"].map((y) => ({ d: y, t: "opex" })),
        ].sort((y, C) => y.d.localeCompare(C.d));
      function a() {
        const y = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date()),
          C = R.filter(
            (X) =>
              X.d >= y &&
              (u.eventCategory === "todos" || X.t === u.eventCategory),
          ).slice(0, 16),
          V = (X) => X.slice(8, 10) + "/" + X.slice(5, 7) + "/" + X.slice(0, 4);
        return `<section class="us-events"><h3>Datas macro importantes · EUA</h3><p>Calendário de divulgação e decisões, não uma estatística de impacto. Reações dependem de surpresa, posicionamento e contexto.</p><div class="v357-alert-link"><span>Alertas de eventos econômicos usam o sistema de notificações já existente.</span><button type="button" class="btn s" data-navroute="mercado:al">Configurar avisos</button></div><div class="us-events-filter"><label>Mostrar<select data-useventcategory>${[
          ["todos", "Todos os eventos"],
          ["cpi", "Inflação CPI"],
          ["payroll", "Payroll"],
          ["fomc", "FOMC"],
          ["opex", "Opções"],
        ]
          .map(
            ([X, _]) =>
              `<option value="${X}"${u.eventCategory === X ? " selected" : ""}>${_}</option>`,
          )
          .join(
            "",
          )}</select></label></div>${C.length ? `<div class="pro-table-scroll" tabindex="0"><table class="us-table us-event-table"><thead><tr><th>Data (EUA)</th><th>Evento</th><th>Mercados para observar</th></tr></thead><tbody>${C.map((X) => `<tr><th>${V(X.d)}</th><td>${g[X.t].name}</td><td>${g[X.t].focus}</td></tr>`).join("")}</tbody></table></div>` : '<p class="us-caution">Não há datas futuras cadastradas nesta versão. Consulte os calendários oficiais para novas divulgações.</p>'}
    <div class="us-event-themes"><b>Meses e períodos para monitorar</b><p><strong>Março, junho, setembro e dezembro:</strong> costumam concentrar vencimentos trimestrais de derivativos e reuniões do Fed com projeções; não implica alta ou queda e nem comprova maior oscilação.</p><p><strong>Janeiro, abril, julho e outubro:</strong> acompanhe as temporadas de resultados trimestrais; as datas de cada empresa variam.</p><p><strong>Todo mês:</strong> CPI e emprego nos EUA; horários indicados nas fontes são no fuso Eastern Time.</p></div>
    <p class="us-footnote">Referência estática verificada em 04/11/2026. Datas podem mudar; o aplicativo não as sincroniza automaticamente. A janela de reação a CPI, payroll ou FOMC ainda não foi calculada sobre pregões diários.</p>
    <div class="us-event-sources"><a target="_blank" rel="noopener noreferrer" href="https://www.bls.gov/schedule/news_release/cpi.htm">CPI · BLS</a><a target="_blank" rel="noopener noreferrer" href="https://www.bls.gov/schedule/news_release/empsit.htm">Payroll · BLS</a><a target="_blank" rel="noopener noreferrer" href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm">FOMC · Fed</a><a target="_blank" rel="noopener noreferrer" href="https://www.cboe.com/about/hours/us-options/">Opções · Cboe</a></div></section>`;
      }
      function n(y, C) {
        return `<div class="pro-table-scroll" tabindex="0" role="region" aria-label="${r(C)}"><table class="us-table"><caption>${r(C)}</caption><thead><tr><th scope="col">Período</th><th scope="col">Média</th><th scope="col">Mediana</th><th scope="col">Positivas</th><th scope="col">Amostra</th></tr></thead><tbody>${y.map((V) => `<tr><th scope="row">${r(V.label)}</th><td>${m(V.media)}</td><td>${m(V.mediana)}</td><td>${V.positivas == null ? "—" : P(V.positivas)}</td><td>${V.n}</td></tr>`).join("")}</tbody></table></div>`;
      }
      function f(y) {
        const C = (y.catalogo || []).filter(
            (_) => u.eventType === "todas" || _.tipo === u.eventType,
          ),
          V = (_) =>
            typeof _ == "number"
              ? _.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
              : "—",
          X = (_, K) =>
            _ ? `${r(_.d)}<br><b>${V(_.v)}</b><br>${m(K)}` : "Sem fechamento";
        return `<details class="us-observations"><summary>Fechamentos D-1, D0 e D+1 · ${C.filter((_) => _.concluida).length} eleições cobertas</summary><p class="sm mut">Preço de fechamento e variação contra o pregão anterior. D0 é a eleição. Quando não houve pregão em D0, o retorno posterior usa o último fechamento anterior; D0 permanece vazio. Dias sem histórico ficam vazios e não entram nas médias. Midterms desde 1950: 19 concluídas até 2022; a amostra varia conforme índice e janela.</p><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th>Ano / tipo</th><th>Eleição</th><th>D-1 · anterior</th><th>D0 · eleição</th><th>D+1 · seguinte</th></tr></thead><tbody>${C.map((_) => `<tr><th>${_.ano}<br>${r(_.tipo)}</th><td>${r(_.data)}${_.concluida ? "" : "<br>Aguardando / sem histórico"}</td><td>${X(_.anterior, _.variacao_anterior)}</td><td>${X(_.dia, _.variacao_dia)}</td><td>${X(_.seguinte, _.variacao_seguinte)}</td></tr>`).join("")}</tbody></table></div></details>`;
      }
      const h = {
          semanas: "Semanas e viradas de mês",
          eventos: "CPI, Payroll e FOMC",
          cenarios: "VIX, DXY e juros",
          brasil: "Brasil × Estados Unidos",
        },
        Q = {
          primeiros5: "Primeiros 5 pregões",
          ultimos5: "Últimos 5 pregões",
          virada: "Primeiros 3 pregões do mês",
          opex: "Cinco pregões até o 3º vencimento de sexta",
          sem1: "Pregões 1–5",
          sem2: "Pregões 6–10",
          sem3: "Pregões 11–15",
          sem4: "Pregões 16–20",
          vix_baixo: "VIX abaixo de 20",
          vix_alto: "VIX igual/acima de 20",
          dxy_sobe: "DXY subia antes do mês",
          dxy_cai: "DXY caía antes do mês",
          juros_sobem: "US10Y subia antes do mês",
          juros_caem: "US10Y caía antes do mês",
          antes: "D−5 até D−1",
          dia: "Fechamento D−1 → D0",
          depois: "Fechamento D0 → D+1",
          semana: "D0 até D+5",
          total: "D−1 até D+5",
        },
        J = (y) =>
          typeof y == "number" && Number.isFinite(y)
            ? y.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—";
      function v(y, C = "") {
        return `<div class="pro-table-scroll" tabindex="0"><table class="us-table us-v357-table"><thead><tr><th>Janela / condição</th><th>Ocorrências</th><th>Média</th><th>|Mov.| médio</th><th>Positivas</th></tr></thead><tbody>${y.map(([V, X]) => `<tr><th scope="row">${r(Q[V] || V)}</th><td>${X?.n || 0}</td><td>${X?.n ? m(X.media) : "—"}</td><td>${X?.n ? J(X.absmedia) + "%" : "—"}</td><td>${X?.n ? J(X.positivas) + "%" : "—"}</td></tr>`).join("") || '<tr><td colspan="5">Sem amostras disponíveis.</td></tr>'}</tbody></table></div>${C ? `<p class="us-footnote">${C}</p>` : ""}`;
      }
      function I() {
        if (!u.extra || u.extraAsset !== u.asset)
          return `<div class="card us-empty" role="status"><b>${u.extraBusy ? "Consultando fechamentos históricos…" : "Análise diária ainda não carregada"}</b><p>${r(u.extraError || "Esta análise usa o serviço histórico adicional. Não exibe métricas inventadas se a fonte falhar.")}</p><button class="btn s" data-us-extra-refresh ${u.extraBusy ? "disabled" : ""}>${u.extraBusy ? "Aguarde…" : "Consultar agora"}</button></div>`;
        const y = u.extra,
          C = y.falhas?.length
            ? `<p class="us-caution">Fontes indisponíveis nesta consulta: ${r(y.falhas.join(", "))}. As estatísticas correspondentes podem ficar vazias.</p>`
            : "";
        let V = "";
        if (
          (u.view === "semanas" &&
            (V = `<h3>Semanas e viradas de mês</h3><p>Movimento do fechamento anterior ao fechamento ao fim da janela, desde o histórico disponível. Não representa variação máxima intradiária nem certeza de um padrão sazonal.</p>${v(Object.entries(y.semanas || {}), "“Virada” mede o fechamento anterior até o 3º pregão do mês. O vencimento é aproximado pela terceira sexta-feira, sem assumir liquidez idêntica entre produtos.")}<p class="us-caution">Amostras pequenas ou feriados podem afetar as comparações. Compare a média com a mediana no estudo mensal.</p>`),
          u.view === "eventos")
        ) {
          const X = {
            cpi: "Inflação CPI",
            payroll: "Emprego · Payroll",
            fomc: "Decisão do Fed · FOMC",
          };
          V = `<h3>Comportamento em torno de eventos</h3><p>Estatísticas reais de fechamentos dos índices em janelas próximas às divulgações, sem atribuir causalidade. CPI/Payroll usam as datas oficiais de 2026 e FOMC, decisões de 2024–2026.</p><div class="v357-event-list">${Object.entries(
            y.eventos || {},
          )
            .map(
              ([_, K]) =>
                `<details class="v357-event" ${_ === "fomc" ? "open" : ""}><summary>${r(X[_] || _)} <span>${K?.janelas?.dia?.n || 0} sessões D0</span></summary>${v(Object.entries(K?.janelas || {}), "D0 é o pregão da divulgação; D−1 é o fechamento anterior. Não há medição de segundos/minutos após a notícia. Não se mede surpresa econômica.")}${(K?.janelas?.dia?.n || 0) < 10 ? '<p class="us-caution">Amostra pequena: não extrapole o resultado.</p>' : ""}</details>`,
            )
            .join(
              "",
            )}</div><p class="us-footnote"><a href="https://www.bls.gov/schedule/news_release/cpi.htm" target="_blank" rel="noopener noreferrer">Datas CPI · BLS</a> · <a href="https://www.bls.gov/cps/publications/release-calendar.htm" target="_blank" rel="noopener noreferrer">Payroll · BLS</a> · <a href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" target="_blank" rel="noopener noreferrer">FOMC · Fed</a></p>`;
        }
        return (
          u.view === "cenarios" &&
            (V = `<h3>Movimentação condicionada ao cenário</h3><p>O cenário é observado <strong>antes do início do mês</strong>; o retorno medido é do mês seguinte. VIX abaixo/acima de 20, DXY e US10Y pela variação nos 21 pregões anteriores.</p>${v(Object.entries(y.cenarios || {}), "VIX é um índice implícito de volatilidade de opções, não a volatilidade realizada. US10Y sobe/cai em pontos do indicador, não percentual da taxa.")}<p class="us-caution">São associações históricas, não efeitos causais nem estratégias testadas fora da amostra.</p>`),
          u.view === "brasil" &&
            (V = `<h3>Comparação Brasil × EUA</h3><p>Correlação dos retornos diários, com <strong>252 observações coincidentes mais recentes</strong>. Os mercados fecham em horários diferentes; logo a correlação no mesmo dia pode distorcer a relação real.</p><div class="v357-corr-grid">${[
              ["ibov", "Ibovespa · referência para WIN"],
              ["dolar", "USD/BRL · referência para WDO"],
            ]
              .map(
                ([X, _]) =>
                  `<div class="v357-corr"><small>${_}</small><b>${y.brasil?.[X]?.correlacao == null ? "Indisponível" : J(y.brasil[X].correlacao)}</b><span>Coeficiente r · ${y.brasil?.[X]?.n || 0} pares de pregões</span></div>`,
              )
              .join(
                "",
              )}</div><p class="us-footnote">A correlação vai de −1 a +1. O cálculo usa IBOV e USD/BRL como <strong>proxies</strong>: não são as séries de futuros WIN e WDO, nem indicam direção futura ou sinal de entrada.</p>`),
          `<section class="v357-extra"><div class="top"><h2>${r(h[u.view] || "Análise americana")}</h2><button type="button" class="btn s" data-us-extra-refresh ${u.extraBusy ? "disabled" : ""}>Atualizar</button></div><p class="mut sm">${r(u.asset.toUpperCase())} · Histórico ${r(y.periodo?.de || "—")} a ${r(y.periodo?.ate || "—")} · Consulta ${r(new Date(y.gerado).toLocaleString("pt-BR"))}</p>${C}${V}<details class="us-method"><summary>Fonte, cobertura e limitações</summary><p>${r(y.metodo || "")}</p><p>Fonte de preços: Yahoo Finance (consulta sem garantia de disponibilidade). Métricas em fechamento diário, não ticks nem horário do anúncio. Fatores macro e feriados podem afetar séries.</p></details></section>`
        );
      }
      async function k(y = !1) {
        if (
          u.extraBusy ||
          (!y && u.extra && u.extraAsset === u.asset) ||
          (!y && Date.now() - u.extraLast < 12e3)
        )
          return;
        ((u.extraBusy = !0),
          (u.extraError = ""),
          (u.extraLast = Date.now()),
          w());
        const C = u.asset;
        try {
          const V = await rq("/functions/v1/sazonal-extras", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ asset: C }),
              signal: AbortSignal.timeout(45e3),
            }),
            X = await V.json();
          if (!V.ok || X.versao !== "v357")
            throw new Error(X.error || "A análise diária não respondeu.");
          C === u.asset && ((u.extra = X), (u.extraAsset = C));
        } catch (V) {
          u.extraError =
            V.name === "TimeoutError"
              ? "Tempo esgotado ao consultar dados diários."
              : String(V.message || V);
        } finally {
          ((u.extraBusy = !1),
            tab === "mercado" &&
              MKT.tab === "lab" &&
              u.section === "us" &&
              w());
        }
      }
      function L() {
        if (u.view === "calendar") return a();
        if (["semanas", "eventos", "cenarios", "brasil"].includes(u.view))
          return I();
        const y = u.value;
        if (!y)
          return `<div class="card us-empty" role="status"><b>${u.busy ? "Buscando séries históricas dos EUA…" : "Histórico ainda não carregado"}</b><p>${r(u.error || "Entre na conta para consultar os índices e calcular os estudos históricos.")}</p><button class="btn s" data-usrefresh${u.busy ? " disabled" : ""}>${u.busy ? "Aguarde" : "Carregar histórico"}</button></div>`;
        const C = y.ativos.find((te) => te.k === u.asset);
        if (!C || C.status !== "ok")
          return `<div class="card"><p>${r(C?.erro || "Este índice está indisponível.")}</p><button class="btn s" data-usrefresh>Tentar novamente</button></div>`;
        const V =
            (u.view === "mensal"
              ? C.mensal.map((te) => q(te, u.lookback))
              : u.view === "ciclo"
                ? C.ciclo
                : C.eleicoes?.[u.eventType] || C.midterms) || [],
          X =
            V.find((te) =>
              u.view === "mensal"
                ? te.mes === u.month
                : u.view === "ciclo"
                  ? te.fase === u.cycle
                  : te.k === u.window,
            ) || V[0],
          _ =
            u.view === "mensal"
              ? "Mês a mês"
              : u.view === "ciclo"
                ? "Ciclo presidencial · anos civis"
                : "Antes e depois das eleições",
          K = V.map((te) => {
            const ue =
              u.view === "mensal"
                ? te.mes
                : u.view === "ciclo"
                  ? te.fase
                  : te.k;
            return `<option value="${r(ue)}"${te === X ? " selected" : ""}>${r(u.view === "mensal" ? c[te.mes - 1] : u.view === "ciclo" ? `Ano ${te.fase} · ${te.nome}` : te.nome)}</option>`;
          }).join(""),
          U = V.map((te) => ({
            ...te,
            label:
              u.view === "mensal"
                ? c[te.mes - 1]
                : u.view === "ciclo"
                  ? `Ano ${te.fase} · ${te.nome}`
                  : te.nome,
          }));
        return `<div class="us-study"><div class="top"><div><h2>${_}</h2><p class="mut sm">${r(C.n)} · ${r(C.de)} a ${r(C.ate)} · USD</p></div><button class="btn s" data-usrefresh${u.busy ? " disabled" : ""}>${u.busy ? "Atualizando…" : "Atualizar"}</button></div>
      ${u.error ? `<p class="warn" role="status">${r(u.error)} Exibindo a consulta anterior, de ${r(new Date(y.gerado).toLocaleString("pt-BR"))}.</p>` : ""}
      ${
        u.view === "midterms"
          ? `<label>Tipo de eleição<select data-uselection>${[
              ["midterm", "Midterms"],
              ["presidencial", "Presidenciais"],
              ["todas", "Todas as eleições federais"],
            ]
              .map(
                ([te, ue]) =>
                  `<option value="${te}"${u.eventType === te ? " selected" : ""}>${ue}</option>`,
              )
              .join("")}</select></label>`
          : ""
      }
      ${
        u.view === "mensal"
          ? `<label>Período do histórico<select data-uslookback>${[
              [10, "Últimos 10 anos"],
              [20, "Últimos 20 anos"],
              [30, "Últimos 30 anos"],
              [0, "Histórico completo"],
            ]
              .map(
                ([te, ue]) =>
                  `<option value="${te}"${u.lookback === te ? " selected" : ""}>${ue}</option>`,
              )
              .join("")}</select></label>${H(V)}`
          : ""
      }
      <label>${u.view === "mensal" ? "Detalhes do mês" : "Janela de comparação"}<select data-usperiod>${K}</select></label>
      <div class="us-kpis"><div><span>Média histórica</span><b>${m(X?.media)}</b></div><div><span>Mediana</span><b>${m(X?.mediana)}</b></div><div><span>Janelas positivas</span><b>${X?.positivas == null ? "—" : P(X.positivas)}</b></div><div><span>Amostra concluída</span><b>${X?.n || 0} ${u.view === "midterms" ? "eleições" : "anos"}</b></div></div>
      <p class="us-dispersion">Pior: ${m(X?.pior)} · Melhor: ${m(X?.melhor)} · Desvio dos retornos: ${P(X?.desvio)}</p>
      ${u.view === "mensal" ? `<div class="us-extra-kpis"><div><small>Movimento absoluto médio</small><b>${P(X?.absmedia)}</b></div><div><small>Mediana |retorno|</small><b>${P(X?.absmediana)}</b></div><div><small>Meses negativos</small><b>${P(X?.quedas)}</b></div><div><small>Movimentos ≥ 3%</small><b>${P(X?.fortes3)}</b></div><div><small>Intervalo P25–P75</small><b>${P(X?.p25)} a ${P(X?.p75)}</b></div><div><small>Movimentos ≥ 5%</small><b>${P(X?.fortes5)}</b></div></div><p class="us-footnote">Retorno absoluto = |variação do fechamento do mês|. P25–P75 descreve a faixa central das observações, não um intervalo de previsão.</p>` : ""}
      ${X?.n < 10 ? '<p class="us-caution">Amostra pequena: poucos eventos podem alterar bastante as médias.</p>' : ""}
      ${n(U, _)}
      ${u.view === "midterms" ? f(C) : ""}
      <details class="us-observations"><summary>Conferir cada observação e suas datas</summary><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th scope="col">Ano</th><th scope="col">Fechamento inicial</th><th scope="col">Fechamento final</th><th scope="col">Retorno</th></tr></thead><tbody>${(X?.observacoes || []).map((te) => `<tr><th scope="row">${te.ano}</th><td>${r(te.de)}</td><td>${r(te.ate)}</td><td>${m(te.valor)}</td></tr>`).join("") || '<tr><td colspan="4">Nenhuma janela completa nesta amostra.</td></tr>'}</tbody></table></div></details>
      <details class="us-method"><summary>Metodologia e fontes</summary><p>${r(y.metodo)}</p><p>Dados consultados em ${r(new Date(y.gerado).toLocaleString("pt-BR"))}. Janelas positivas são frequência histórica, não probabilidade de alta futura. O desvio mede a dispersão entre retornos das janelas, não a volatilidade intradiária.</p><p><a href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a> · <a href="https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/" target="_blank" rel="noopener noreferrer">Calendário eleitoral da FEC</a></p></details></div>`;
      }
      function d() {
        return `<section class="us-seasonality"><div class="pro-region" role="group" aria-label="Sazonalidade e sentimento"><button type="button" data-usarea="br">Brasil · Sentimento</button><button type="button" class="on" aria-pressed="true" data-usarea="us">EUA · Sazonalidade</button></div>
      <div class="us-intro"><span class="routine-eyebrow">SAZONALIDADE · ESTADOS UNIDOS</span><h2>Meses, ciclos e datas importantes</h2><p>O ranking mostra os meses com maior movimento histórico de fechamento a fechamento. Eventos macro são apresentados separadamente, sem previsão de direção do mercado.</p></div>
      ${u.view === "midterms" ? `<div class="us-election-context"><b>O que são as midterms?</b><p>Eleições legislativas no meio do mandato presidencial. Elas podem mudar o controle do Congresso. A comparação abaixo agrupa os eventos por data, sem atribuir o retorno ao partido vencedor.</p>${u.value?.proxima_midterm ? `<span>Próxima data: <b>${r(u.value.proxima_midterm.split("-").reverse().join("/"))}</b></span>` : '<a href="https://www.usa.gov/midterm-elections" target="_blank" rel="noopener noreferrer">Consultar o calendário oficial</a>'}<p class="sm">Lucros, juros e surpresas de política econômica também afetam os preços. Médias históricas não isolam o efeito de uma eleição.</p></div>` : ""}
      ${
        u.view !== "calendar"
          ? `<label>Índice<select data-usasset>${[
              ["spx", "S&P 500"],
              ["ndx", "Nasdaq 100"],
              ["dji", "Dow Jones"],
              ["rut", "Russell 2000"],
            ]
              .map(
                ([y, C]) =>
                  `<option value="${y}"${u.asset === y ? " selected" : ""}>${C}</option>`,
              )
              .join("")}</select></label>`
          : ""
      }
      <label class="v357-analysis-select">Tipo de análise<select data-usview-select>${[
        ["mensal", "Meses e movimento"],
        ["semanas", "Semanas e viradas de mês"],
        ["eventos", "CPI, Payroll e FOMC"],
        ["cenarios", "VIX, DXY e juros"],
        ["brasil", "Brasil × EUA"],
        ["calendar", "Calendário econômico"],
        ["ciclo", "Ciclo presidencial"],
        ["midterms", "Eleições"],
      ]
        .map(
          ([y, C]) =>
            `<option value="${y}"${u.view === y ? " selected" : ""}>${C}</option>`,
        )
        .join("")}</select></label>
      <div id="us-study-body" aria-live="polite">${L()}</div><p class="us-footnote">Estudos históricos de índices dos EUA, conforme disponibilidade da fonte. Retornos em USD, sem custos ou spreads. Médias históricas não são recomendação nem sinal de entrada.</p></section>`;
      }
      async function $(y = !1) {
        if (
          !(u.busy || (!y && (u.value || Date.now() - u.lastAttempt < 6e4)))
        ) {
          ((u.busy = !0), (u.error = ""), (u.lastAttempt = Date.now()), w());
          try {
            const V = await (
              await rq("/functions/v1/macro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modo: "sazonal_us" }),
                signal: AbortSignal.timeout(35e3),
              })
            ).json();
            if (!Array.isArray(V.ativos) || V.versao !== "v285")
              throw new Error(
                "Atualize a função macro para consultar o histórico ampliado dos EUA.",
              );
            u.value = V;
          } catch (C) {
            u.error =
              C.name === "TimeoutError"
                ? "O histórico demorou a responder. Tente novamente."
                : String(C.message || C);
          } finally {
            ((u.busy = !1),
              tab === "mercado" &&
                ["lab", "sazus"].includes(MKT.tab) &&
                u.section === "us" &&
                u.view !== "calendar" &&
                render());
          }
        }
      }
      function w() {
        const y = document.getElementById("us-study-body");
        y && (y.innerHTML = L());
      }
      const b = vMercado;
      ((vMercado = function () {
        if (
          (MKT.tab === "sazus" && ((u.section = "us"), (MKT.tab = "lab")),
          MKT.tab === "lab" && u.section === "us")
        )
          return (
            ["semanas", "eventos", "cenarios", "brasil"].includes(u.view)
              ? setTimeout(() => k(), 0)
              : u.view !== "calendar" && setTimeout(() => $(), 0),
            d()
          );
        const y = b.apply(this, arguments);
        return ["lab", "saz", "se"].includes(MKT.tab)
          ? '<div class="pro-region" role="group" aria-label="Sazonalidade e sentimento"><button type="button" class="on" aria-pressed="true" data-usarea="br">Brasil · Sentimento</button><button type="button" data-usarea="us">EUA · Sazonalidade</button></div>' +
              y
          : y;
      }),
        document.addEventListener("click", (y) => {
          const C = y.target.closest("[data-prodensity]");
          if (C && ["comfortable", "compact"].includes(C.dataset.prodensity)) {
            try {
              ls.set("diario-densidade-v284", C.dataset.prodensity);
            } catch {}
            (M(), render());
            return;
          }
          const V = y.target.closest("[data-usarea]");
          if (V && ["br", "us"].includes(V.dataset.usarea)) {
            ((u.section = V.dataset.usarea), (MKT.tab = "lab"), render());
            return;
          }
          const X = y.target.closest("[data-usmonth]");
          if (X) {
            ((u.month = +X.dataset.usmonth), (u.view = "mensal"), render());
            return;
          }
          const _ = y.target.closest("[data-usview]");
          if (
            _ &&
            ["mensal", "calendar", "ciclo", "midterms"].includes(
              _.dataset.usview,
            )
          ) {
            ((u.view = _.dataset.usview), render());
            return;
          }
          (y.target.closest("[data-usrefresh]") && $(!0),
            y.target.closest("[data-us-extra-refresh]") && k(!0));
        }),
        document.addEventListener("change", (y) => {
          const C = y.target;
          if (C.matches("[data-usview-select]")) {
            ((u.view = C.value), render());
            return;
          }
          (C.matches("[data-uslookback]") && ((u.lookback = +C.value), w()),
            C.matches("[data-useventcategory]") &&
              ((u.eventCategory = C.value), w()),
            C.matches("[data-usasset]") &&
              ((u.asset = C.value),
              (u.extra = null),
              (u.extraAsset = ""),
              (u.extraLast = 0),
              w(),
              ["semanas", "eventos", "cenarios", "brasil"].includes(u.view) &&
                k()),
            C.matches("[data-uselection]") && ((u.eventType = C.value), w()),
            C.matches("[data-usperiod]") &&
              (u.view === "mensal"
                ? (u.month = +C.value)
                : u.view === "ciclo"
                  ? (u.cycle = +C.value)
                  : (u.window = C.value),
              w()));
        }));
    })(),
    (() => {
      "use strict";
      const s = (P) => esc(String(P ?? "")),
        l = (P) => (P ? new Date(P).toLocaleString("pt-BR") : "não informada"),
        r = () =>
          !document.hidden &&
          ((tab === "home" &&
            !!document.getElementById("market-watch-shortcut") &&
            document.getElementById("market-watch-shortcut").getClientRects()
              .length > 0) ||
            (tab === "mercado" && MKT.tab === "cq" && CQ.aba === "adr"));
      let j = null,
        O = null;
      const G = () => (AD.data?.ts ? Date.now() - AD.data.ts : 1 / 0),
        o = () => G() > 5 * 6e4,
        F = adrHtml;
      ((adrHtml = function () {
        let P = F.apply(this, arguments)
          .replace(/atualizado às /g, "consultado às ")
          .replace(", sem atraso", ", atraso não confirmado");
        const m = AD.list.filter(
          (c) => !(AD.data?.itens || []).some((q) => q.s === c),
        );
        return (
          `<div class="monitor-reference" role="status"><b>EWZ e ADRs brasileiras</b><span>${AD.busy ? "Consultando…" : AD.failed ? "Falha na atualização" : AD.err ? "Consulta com aviso" : AD.data ? (o() ? "Cópia antiga · confira a referência" : "Consulta automática · confira os horários dos preços") : "Sem consulta concluída"}</span><small>Consulta concluída: ${s(l(AD.data?.ts))}. O horário de cada preço aparece no ativo; uma consulta nova não significa que houve negócio novo. Horários em Brasília.</small></div>` +
          P +
          (m.length
            ? `<p class="sm mut">Sem cotação nesta consulta: ${s(m.join(", "))}.</p>`
            : "") +
          '<p class="sm mut">Esta é a mesma lista usada na imagem do panorama. O EWZ é um ETF e fica separado da média das ADRs.</p>'
        );
      }),
        (adrLoad = function (P = !1) {
          if (j) return j;
          const m = window.TraderAdr.phase() === "closed" ? 3e5 : 25e3;
          if (!P && AD.data && G() < m) return Promise.resolve(!0);
          if (window.DIARIO_DEMO) return Promise.resolve(!1);
          if (!SESS?.at)
            return (
              (AD.err =
                "Entre na sua conta para atualizar as cotações. A cópia anterior, se houver, continua identificada."),
              adrPaint(),
              Promise.resolve(!1)
            );
          const c = AD.list.slice();
          return (
            (AD.busy = 1),
            (AD.err = ""),
            (AD.failed = !1),
            adrPaint(),
            (j = (async () => {
              try {
                const H = await (
                  await rq("/functions/v1/adrs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbols: c }),
                    signal: AbortSignal.timeout(25e3),
                  })
                ).json();
                if (!Array.isArray(H.itens) || !H.itens.length)
                  throw Error(
                    H.error || "A fonte não retornou cotações válidas.",
                  );
                if (c.join(",") !== AD.list.join(",")) return !1;
                const g = H.itens.filter(
                  (f) =>
                    c.includes(f.s) &&
                    typeof f.px == "number" &&
                    Number.isFinite(f.px),
                );
                if (!g.length)
                  throw Error("Nenhuma cotação válida na resposta.");
                const R = Date.parse(H.consultedAt),
                  a = Date.now();
                ((AD.data = {
                  ts: Number.isFinite(R) && R <= a + 6e4 ? R : a,
                  receivedAt: a,
                  itens: g,
                  fonte: H.fonte || "Fonte não informada",
                  atraso: !!H.atraso,
                  revision: H.revision || null,
                }),
                  ls.set("diario-adr-d", AD.data));
                const n = c.filter((f) => !g.some((h) => h.s === f));
                return (
                  (AD.err = [
                    n.length ? "Sem dados de: " + n.join(", ") + "." : "",
                    H.aviso || "",
                  ]
                    .filter(Boolean)
                    .join(" ")),
                  !0
                );
              } catch (q) {
                return (
                  (AD.err = String(q.message || q)),
                  (AD.failed = !0),
                  !1
                );
              } finally {
                ((AD.busy = 0), (j = null), adrPaint(), E());
              }
            })()),
            j
          );
        }),
        (adrAfter = function () {
          (r() && adrLoad(!1),
            AD.tm ||
              (AD.tm = setInterval(() => {
                r() && adrLoad(!1);
              }, 3e4)));
        }),
        AD.tm && (clearInterval(AD.tm), (AD.tm = null)));
      const N = cotHtml,
        e = () =>
          `<div class="seg cqtabs" role="navigation" aria-label="Classes de ativos">${CQ_ABAS.map(([P, m]) => `<button type="button" data-cqa="${P}" class="${CQ.aba === P ? "on" : ""}"${CQ.aba === P ? ' aria-current="page"' : ""}>${P === "adr" ? "EWZ e ADRs" : s(m)}</button>`).join("")}</div>`;
      cotHtml = function () {
        return N.apply(this, arguments);
      };
      const i = cqCarrega;
      ((cqCarrega = function (P, m) {
        return (P || CQ.aba) === "adr"
          ? adrLoad(!!m)
          : i.apply(this, arguments);
      }),
        ls.get("diario-cq-aba") || (CQ.aba = "adr"));
      const B = vMercado;
      vMercado = function () {
        return (
          MKT.tab === "cot" && (MKT.tab = "cq"),
          MKT.tab === "cq"
            ? (setTimeout(() => {
                (cqCarrega(CQ.aba), adrAfter());
              }, 0),
              `<section class="market-monitor"><h2>Monitor de cotações</h2><p class="mut sm">Acompanhe as classes abaixo. EWZ e ADRs usam a lista da imagem do panorama.</p>${cotHtml()}</section>`)
            : B.apply(this, arguments)
        );
      };
      const Y = mdoCarrega;
      ((mdoCarrega = function (P) {
        return (
          O ||
          ((O = Promise.resolve(Y.apply(this, arguments)).finally(() => {
            O = null;
          })),
          O)
        );
      }),
        (imgDados = async function () {
          if (window.DIARIO_DEMO)
            throw Error(
              "A captura de mercado exige dados reais; consultas externas estão desativadas na demonstração.",
            );
          if (!SESS?.at)
            throw Error(
              "Entre na conta para atualizar o panorama e a lista de ADRs antes de gerar a imagem.",
            );
          const P = async () => {
              const H = [];
              try {
                typeof balCarrega == "function" &&
                  H.push(
                    Promise.race([
                      balCarrega(),
                      new Promise((g) => setTimeout(g, 4e3)),
                    ]),
                  );
              } catch {}
              try {
                if (
                  typeof AG < "u" &&
                  (!AG.v[0] || Date.now() - (AG.ts[0] || 0) > 18e5)
                ) {
                  const g = AG.sem;
                  AG.sem = 0;
                  let R;
                  try {
                    R = agCarrega(!0);
                  } finally {
                    AG.sem = g;
                  }
                  H.push(
                    Promise.race([R, new Promise((a) => setTimeout(a, 4e3))]),
                  );
                }
              } catch {}
              await Promise.allSettled(H);
            },
            m = await Promise.allSettled([mdoCarrega(!0), adrLoad(!0), P()]),
            c = !MDO.ts || Date.now() - MDO.ts > 3e5,
            q = [];
          if (
            ((m[0].status === "rejected" || MDO.err || c) &&
              q.push(
                "Panorama: " +
                  (MDO.err ||
                    "não foi possível confirmar uma consulta recente."),
              ),
            (m[1].status === "rejected" ||
              m[1].value !== !0 ||
              AD.err ||
              o()) &&
              q.push(
                "EWZ/ADRs: " +
                  (AD.err ||
                    "não foi possível confirmar uma consulta recente."),
              ),
            (IMG.marketReference = {
              macro: MDO.ts || null,
              adrs: AD.data?.ts || null,
              warning: q.join(" "),
            }),
            q.length &&
              !confirm(
                q.join(`
`) +
                  `

Gerar usando os dados disponíveis, com o aviso de falha/consulta anterior na imagem?`,
              ))
          )
            throw Error(
              "Captura cancelada; atualize as fontes e tente novamente.",
            );
        }));
      const z = imgDesenha;
      imgDesenha = function () {
        const P = z.apply(this, arguments);
        // v615: sem o rodapé técnico ("Consulta do panorama…") fora do card na imagem exportada.
        if (P) return P;
        const m = document.createElement("canvas");
        ((m.width = P.width), (m.height = P.height + 160));
        const c = m.getContext("2d");
        (c.drawImage(P, 0, 0),
          (c.fillStyle = "#0f1012"),
          c.fillRect(0, P.height, m.width, 160),
          (c.textAlign = "left"),
          (c.textBaseline = "top"),
          (c.font = "22px system-ui"),
          (c.fillStyle = "#b1b5bc"));
        const q = IMG.marketReference || { macro: MDO.ts, adrs: AD.data?.ts };
        return (
          [
            `Consulta do panorama: ${l(q.macro)}`,
            `Consulta de EWZ/ADRs: ${l(q.adrs)}`,
            q.warning
              ? "ATENÇÃO: atualização com falha ou dados parciais; confira as referências."
              : "Consulta recente não garante negócio recente.",
            "Preço principal: regular. Linha adicional: sessão e data indicadas.",
          ].forEach((g, R) =>
            c.fillText(g, 42, P.height + 16 + R * 32, m.width - 84),
          ),
          m
        );
      };
      function M() {
        const P = AD.data?.itens?.find((q) => q.s === "EWZ"),
          m = P && window.TraderAdr.view(P),
          c = m && (m.active || m.regular);
        return `<div class="top"><div><b>EWZ e ADRs brasileiras</b><p class="sm mut">${c ? "EWZ " + s(window.TraderAdr.price(c.px)) + " · " + s(adP(c.chp)) + " · " + (m.active?.kind === "overnight" ? "overnight" : m.active?.kind === "pre" ? "pré-mercado" : m.active?.kind === "post" ? "pós-mercado" : "regular") : "Sua lista de acompanhamento está no Monitor."}</p></div><button type="button" class="btn s" data-market-adrs>Abrir lista</button></div><small class="mut">Consulta: ${s(l(AD.data?.ts))}${o() ? " · cópia antiga" : ""}. ${c ? "Preço: " + s(window.TraderAdr.time(c.at)) + ". " : ""}Mesma lista usada na imagem do panorama.</small>`;
      }
      function E() {
        const P = document.getElementById("market-watch-shortcut");
        P && (P.innerHTML = M());
      }
      function u() {
        MKT.tab === "cot" && ((MKT.tab = "cq"), ls.set("diario-mkt-tab", "cq"));
        const P = document.getElementById("app");
        if (!P) return;
        if (
          (tab === "mercado" || ["juros", "live", "graf"].includes(tab)
            ? (P.querySelectorAll(".trvolta").forEach((c) => c.remove()),
              P.classList.add("market-workspace"))
            : P.classList.remove("market-workspace"),
          (tab === "home" || (tab === "mercado" && MKT.tab === "mu")) &&
            !P.querySelector("#market-watch-shortcut"))
        ) {
          const c = document.createElement("section");
          ((c.id = "market-watch-shortcut"),
            (c.className = "card market-watch-shortcut"),
            (c.innerHTML = M()));
          const q = P.querySelector(".routine-card,.workbench-header");
          q ? q.after(c) : P.prepend(c);
        }
        (tab === "home" &&
          P.querySelectorAll('[data-hb="adr"]').forEach((c) => c.remove()),
          (tab === "home" ||
            (tab === "mercado" && MKT.tab === "cq" && CQ.aba === "adr")) &&
            adrAfter(),
          P.querySelectorAll(
            '.pro-tabs [aria-current="page"],.pro-subtabs [aria-current="page"]',
          ).forEach((c) => {
            const q = c.parentElement;
            q.scrollWidth > q.clientWidth &&
              c.scrollIntoView({ inline: "nearest", block: "nearest" });
          }));
      }
      (window.TraderUI.onRender("mercado-monitor", u),
        window.addEventListener(
          "click",
          (P) => {
            if (P.target.closest("[data-market-chat]")) {
              (P.preventDefault(),
                P.stopImmediatePropagation(),
                window.TraderChat?.open());
              return;
            }
            P.target.closest("[data-market-adrs]") &&
              (P.preventDefault(),
              P.stopImmediatePropagation(),
              (CQ.aba = "adr"),
              ls.set("diario-cq-aba", "adr"),
              window.DIARIO_NAV.navigate("mercado:cq"));
          },
          !0,
        ),
        document.addEventListener("visibilitychange", () => {
          r() && adrLoad(!0);
        }),
        (window.TraderMarket = {
          decorate: u,
          visible: r,
          stale: o,
          refresh: () => adrLoad(!0),
        }));
    })(),
    (() => {
      "use strict";
      const s = {
          plano: "Plano",
          resumo: "Resumo",
          aprend: "Aprendizado",
          pre: "Ensaio mental",
          bem: "O que fiz bem",
          chk: "Checklist",
          us: "EUA",
        },
        l = () => {
          try {
            return APP_STORAGE.getItem("diario-foco") === "1";
          } catch {
            return !1;
          }
        };
      function r() {
        const j = document.getElementById("app");
        if (!j) return;
        if (
          (j.classList.toggle("diary-focus", tab === "dia" && l()),
          tab === "dia" && DV !== "hist")
        ) {
          const N = document.createElement("div");
          N.className = "diary-toolbar";
          const e = document.createElement("button");
          ((e.type = "button"),
            (e.className = "btn s"),
            (e.dataset.diaryFocus = "1"),
            (e.textContent = j.classList.contains("diary-focus")
              ? "Mostrar todos os painéis"
              : "Modo foco"),
            N.append(e));
          const i = j.querySelector("h1");
          i && i.after(N);
        }
        const O = Object.entries(diarioDaysCanonical()).flatMap(([N, e]) =>
          (e._conflicts || []).map((i) => ({ date: N, conflict: i })),
        );
        if (!O.length || j.querySelector(".diary-conflicts")) return;
        const G = document.createElement("details");
        ((G.className = "card diary-conflicts"), (G.open = tab === "dia"));
        const o = document.createElement("summary");
        ((o.textContent = `${O.length} edição(ões) do diário para conferir`),
          G.append(o));
        const F = document.createElement("p");
        ((F.textContent =
          "Duas versões foram preservadas durante a sincronização. Confira o conteúdo e escolha qual manter. Nada foi descartado deste registro de conflito."),
          G.append(F),
          O.forEach(({ date: N, conflict: e }) => {
            const i = document.createElement("div");
            i.className = "diary-conflict";
            const B = document.createElement("b");
            ((B.textContent =
              N + " · " + e.path.map((Y) => s[Y] || Y).join(" / ")),
              i.append(B),
              e.versions.forEach((Y, z) => {
                const M = document.createElement("pre");
                ((M.textContent = Y.present
                  ? typeof Y.value == "string"
                    ? Y.value || "(vazio)"
                    : JSON.stringify(Y.value, null, 2)
                  : "Campo removido"),
                  i.append(M));
                const E = document.createElement("button");
                ((E.type = "button"),
                  (E.className = "btn s"),
                  (E.textContent = "Manter esta versão"),
                  E.addEventListener("click", () => {
                    window.DiarioDados.resolve(
                      diarioDaysCanonical()[N],
                      e.id,
                      z,
                    ) && (save(), render());
                  }),
                  i.append(E));
              }),
              G.append(i));
          }),
          j.prepend(G));
      }
      (window.TraderUI.onRender("diario-recuperacao", r),
        document.addEventListener("click", (j) => {
          if (!j.target.closest("[data-diary-focus]")) return;
          const O = l();
          try {
            APP_STORAGE.setItem("diario-foco", O ? "0" : "1");
          } catch {
            toast("Não foi possível guardar a preferência neste aparelho.");
          }
          render();
        }));
    })(),
    (() => {
      "use strict";
      const s = window.TraderModel,
        l = (v) => document.querySelector(v),
        r = (v) => esc(String(v ?? "")),
        j = () => ((S.ax ??= {}).workflow ??= {}),
        O = () => diarioDaysCanonical(),
        G = () => loc().slice(0, 10);
      let o = null,
        F = null,
        N = null,
        e = "",
        i = s.monday(G());
      const B = (v) =>
        v === "US"
          ? S.rulesUS || []
          : (typeof MDU < "u" && MDU.k && MDU.rules) || S.rules;
      function Y() {
        ((o = {
          trades: s.clone(S.trades || []),
          days: s.clone(O()),
          rules: s.clone(B("BR") || []),
          rulesUS: s.clone(B("US") || []),
        }),
          (F = S));
      }
      function z() {
        if (!o || F !== S) {
          Y();
          return;
        }
        const v = Date.now(),
          I = new Map(o.trades.map((L) => [L.id, L]));
        for (const L of S.trades || []) {
          const d = I.get(L.id);
          (!d &&
            !L._rulesSnapshot &&
            (M(L, null, !0),
            N &&
              (L._rulesSnapshot.scope =
                "regras_na_importacao_sem_comprovacao_historica")),
            d &&
              s.archive(L, d, "editar_operacao", v) &&
              (L.u = Math.max(L.u || 0, v)));
        }
        for (const [L, d] of Object.entries(O())) {
          const $ = o.days[L];
          s.stable(s.strip(d)) !== s.stable(s.strip($)) &&
            (d._rulesSnapshot ||
              (d._rulesSnapshot = s.ruleSnapshot(
                B("BR"),
                d.chk,
                v,
                L === G() ? "registro_no_dia" : "registro_posterior",
              )),
            d.us &&
              !d.us._rulesSnapshot &&
              (d.us._rulesSnapshot = s.ruleSnapshot(
                B("US"),
                d.us.chk,
                v,
                "sessao_EUA",
              )),
            $ && s.archive(d, $, "editar_diario", v));
        }
        const k = (L) =>
          s.stable((L || []).map((d) => ({ id: d.id, t: d.t, cat: d.cat })));
        for (const L of ["BR", "US"]) {
          const d = L === "BR" ? o.rules : o.rulesUS;
          if (k(d) !== k(B(L))) {
            const $ = (j().ruleVersions ??= []);
            ($.push({ id: s.id(), at: v, market: L, rules: s.clone(d) }),
              (j().ruleVersions = $.slice(-50)));
          }
        }
        if (N) {
          const L = [];
          for (const d of N.ids) {
            const $ = S.trades.find((b) => b.id === d),
              w = N.before[d];
            $ &&
              s.stable(s.strip($)) !== s.stable(s.strip(w)) &&
              L.push({ id: d, before: w || null, after: s.stable(s.strip($)) });
          }
          if (L.length) {
            const d = (j().importBatches ??= []);
            (d.push({ id: N.id, at: v, name: N.name, items: L }),
              (j().importBatches = d.slice(-30)));
          }
          N = null;
        }
        Y();
      }
      function M(v, I, k) {
        const L = typeof ehUS == "function" && ehUS(v) ? "US" : "BR",
          d = String(v.dt || "").slice(0, 10),
          $ = L === "US" ? O()[d]?.us : O()[d];
        (s.captureTrade(v, B(L), $, G()),
          !k &&
            !I?._rulesSnapshot &&
            (v._rulesSnapshot.scope = "edicao_atual_sem_regra_historica"));
      }
      function E(v, I) {
        (l("#wf-dialog")?.close(), l("#wf-dialog")?.remove());
        const k = document.createElement("dialog");
        return (
          (k.id = "wf-dialog"),
          (k.className = "wf-dialog"),
          (k.innerHTML = `<header><h2>${r(v)}</h2><button type="button" data-wf="close" aria-label="Fechar">×</button></header><div class="wf-content">${I}</div>`),
          k.addEventListener("close", () => k.remove()),
          document.body.append(k),
          k.showModal(),
          k
        );
      }
      const u = (v) =>
        Object.entries(v || {})
          .map(
            ([I, k]) =>
              `${r(I)} ${Number(k).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          )
          .join(" · ") || "—";
      function P(v) {
        const I = {
          followed: "Seguiu o plano",
          broken: "Quebrou regras",
          unknown: "Sem avaliação",
        };
        return `<div class="wf-table"><table><thead><tr><th>Grupo declarado</th><th>Trades</th><th>Resultado por moeda</th><th>Média × risco</th><th>Positivos</th></tr></thead><tbody>${Object.entries(
          v,
        )
          .map(
            ([k, L]) =>
              `<tr><th>${I[k]}</th><td>${L.n}</td><td>${u(L.currencies)}</td><td>${L.meanR == null ? "—" : L.meanR.toFixed(2)} <small>(${L.rCount} com risco)</small></td><td>${L.winRate == null ? "—" : L.winRate.toFixed(1) + "%"}</td></tr>`,
          )
          .join(
            "",
          )}</tbody></table></div><p class="wf-note">Classificação informada por você. Não mistura moedas e não prova causalidade. Amostras pequenas e operações diferentes limitam a comparação.</p>`;
      }
      function m() {
        const v = s.weekly(S.trades, O(), i, calc, moedaT),
          I = (j().weekly || {})[v.from];
        return `<section class="card wf-weekly"><h2>Revisão do processo</h2><label>Semana de referência<input type="date" id="wf-week" value="${v.from}"></label><p class="mut sm">${v.from} a ${v.to} · data de encerramento das operações</p>${P(v.comparison)}
      <h3>Erros registrados</h3>${
        v.errors.length
          ? `<ul>${v.errors
              .slice(0, 6)
              .map(([k, L]) => `<li>${r(k)} · ${L} registro(s)</li>`)
              .join("")}</ul>`
          : '<p class="mut">Nenhum erro registrado neste período. Isso não comprova ausência de erros.</p>'
      }
      <h3>O que você escreveu</h3>${v.notes.map((k) => `<details><summary>${k.date} · ${k.market || "BR"}</summary><p>${r(k.good)}</p><p>${r(k.learning)}</p></details>`).join("") || '<p class="mut">Sem aprendizados ou pontos positivos escritos nesta semana.</p>'}
      <label>Uma ação observável para a próxima semana<textarea id="wf-action" placeholder="${r(v.suggestion)}">${r(I?.action || "")}</textarea></label>
      <button class="btn" data-wf="weekly-save">Salvar ação e levar ao plano de segunda</button><p class="wf-note">A ação será acrescentada ao plano de ${s.addDays(v.from, 7)}, sem substituir o texto existente.</p></section>`;
      }
      function c(v) {
        const I = S.trades.find((w) => w.id === v);
        if (!I) return;
        const k = String(I.dt || "").slice(0, 10),
          L = typeof ehUS == "function" && ehUS(I) ? "us" : "br",
          d = L === "us" ? O()[k]?.us : O()[k],
          $ = I._rulesSnapshot;
        (E(
          `${I.ativo || "Operação"} · processo e linha do tempo`,
          `<div class="wf-actions"><button class="btn s" data-wf="edit" data-id="${r(v)}">Editar operação</button><button class="btn s" data-wf="day" data-date="${k}" data-market="${L}">Abrir diário deste dia</button><button class="btn s" data-wf="history-trade" data-id="${r(v)}">Versões anteriores</button></div>
      <h3>Plano registrado no diário</h3><p class="wf-pre">${r(d?.plano || "Sem plano registrado.")}</p><p class="wf-note">O plano acima é a versão atual do diário. O histórico permite consultar versões anteriores.</p>
      <h3>Regras preservadas no registro</h3>${$ ? `<p class="wf-note">Registradas em ${new Date($.at).toLocaleString("pt-BR")} · ${r($.scope)}. Não comprova vigência anterior à captura.</p><ul>${$.rules.map((w) => `<li>${r(w.text)} · ${w.checked ? "marcada no registro" : "não marcada no registro"}</li>`).join("")}</ul>` : "<p>Operação anterior ao versionamento. Não foi inventada uma versão histórica das regras.</p>"}
      <label>Avaliação da execução<select id="wf-assessment"><option value="unknown"${s.status(I) === "unknown" ? " selected" : ""}>Ainda não avaliei</option><option value="followed"${s.status(I) === "followed" ? " selected" : ""}>Segui o plano</option><option value="broken"${s.status(I) === "broken" ? " selected" : ""}>Quebrei regras</option></select></label>
      <label>Justificativa<textarea id="wf-assessment-note">${r(I._assessment?.note || "")}</textarea></label><button class="btn" data-wf="assess" data-id="${r(v)}">Salvar avaliação</button>
      <h3>Linha do tempo</h3><ol class="wf-timeline"><li><b>Entrada informada</b> · ${r(I.dt)}</li>${I.dtx ? `<li><b>Saída informada</b> · ${r(I.dtx)}</li>` : ""}${(I._events || []).map((w) => `<li>${new Date(w.at).toLocaleString("pt-BR")} · ${r(w.kind)}${w.fields?.length ? " · " + r(w.fields.join(", ")) : ""}</li>`).join("")}</ol>
      <p class="wf-note">Datas de execução são as informadas na operação. Eventos de edição começam nesta versão do aplicativo.</p>
      ${["pplan", "pin", "pout"]
        .filter((w) => I[w])
        .map(
          (w) =>
            `<figure><figcaption>${{ pplan: "Plano", pin: "Entrada", pout: "Saída" }[w]}</figcaption><img data-img="${r(I[w])}" alt="Print de ${w}" style="max-width:100%"></figure>`,
        )
        .join("")}`,
        ),
          fillImgs());
      }
      function q(v, I) {
        const k = v === "trade" ? S.trades.find((d) => d.id === I) : O()[I];
        if (!k) return;
        const L = k._history || [];
        E(
          "Histórico de alterações",
          `<p class="wf-note">Até 50 versões anteriores por registro. Edições próximas são agrupadas em intervalos de 30 segundos. O backup continua importante.</p>${
            L.slice()
              .reverse()
              .map(
                (d) =>
                  `<details><summary>${new Date(d.at).toLocaleString("pt-BR")} · ${r(d.reason)}</summary><pre>${r(JSON.stringify(d.data, null, 2))}</pre><button class="btn s" data-wf="restore" data-kind="${v}" data-id="${r(I)}" data-version="${r(d.id)}">Restaurar como nova edição</button></details>`,
              )
              .join("") ||
            "<p>Ainda não há versão anterior preservada. O histórico começa após instalar esta versão.</p>"
          }`,
        );
      }
      function H() {
        E(
          "Buscar no aplicativo",
          '<label>Operação, ativo, setup, anotação, regra ou livro<input id="wf-query" type="search" autocomplete="off" placeholder="Ex.: WIN medo stop"></label><div id="wf-search-results" aria-live="polite"></div>',
        );
        let v;
        (l("#wf-query").addEventListener("input", (I) => {
          (clearTimeout(v),
            (v = setTimeout(() => {
              const k = s.search({ ...S, days: O() }, I.target.value),
                L = l("#wf-search-results");
              L &&
                (L.innerHTML = `<p class="wf-note">${k.length} resultado(s); exibindo até 50.</p>${k
                  .slice(0, 50)
                  .map(
                    (d) =>
                      `<button class="wf-result" data-wf="search-open" data-kind="${d.kind}" data-id="${r(d.id)}" data-market="${d.market || ""}"><b>${r(d.title)}</b><small>${r(d.text.slice(0, 140))}</small></button>`,
                  )
                  .join("")}`);
            }, 180)));
        }),
          l("#wf-query").focus());
      }
      function g() {
        const v = j().templates || {};
        E(
          "Modelos do diário",
          `<p class="wf-note">Os modelos preenchem plano e ensaio mental apenas quando o campo está vazio. Não apagam um plano já escrito.</p><label>Modelo<select id="wf-template">${Object.entries(
            s.templates,
          )
            .map(([k, L]) => `<option value="${k}">${L.name}</option>`)
            .join(
              "",
            )}</select></label><label>Plano<textarea id="wf-template-plan"></textarea></label><label>Ensaio mental<textarea id="wf-template-pre"></textarea></label><div class="wf-actions"><button class="btn s" data-wf="template-save">Guardar meu modelo</button><button class="btn" data-wf="template-apply">Aplicar ao dia aberto</button></div>`,
        );
        const I = () => {
          const k = l("#wf-template").value,
            L = v[k] || s.templates[k];
          ((l("#wf-template-plan").value = L.plano),
            (l("#wf-template-pre").value = L.pre));
        };
        ((l("#wf-template").onchange = I), I());
      }
      function R() {
        return `<section class="card"><h2>Lotes de importação</h2><p class="wf-note">Até 30 lotes recentes. Desfazer preserva operações que você editou depois da importação.</p>${
          (j().importBatches || [])
            .slice()
            .reverse()
            .map(
              (v) =>
                `<div class="wf-batch"><b>${r(v.name || "Importação CSV")}</b><p>${new Date(v.at).toLocaleString("pt-BR")} · ${v.items.length} alteração(ões)</p>${v.undoneAt ? `<p>Desfeito: ${v.result.removed} removida(s), ${v.result.restored} restaurada(s), ${v.result.skipped.length} preservada(s) por alteração posterior.</p>` : `<button class="btn s" data-wf="undo-batch" data-id="${r(v.id)}">Desfazer este lote</button>`}</div>`,
            )
            .join("") || "<p>Nenhum lote registrado nesta versão.</p>"
        }</section>`;
      }
      function a() {
        const v = j().home;
        if (v) return v;
        const I = S.ax?.["home.layout"];
        return I ? { order: I.ordem || [], hidden: I.ocultos || [] } : null;
      }
      function n() {
        const v = [...document.querySelectorAll("#app [data-hb]")],
          I = [...new Set(v.map((d) => d.dataset.hb))],
          k = a() || {},
          L = [
            ...(k.order || []).filter((d) => I.includes(d)),
            ...I.filter((d) => !k.order?.includes(d)),
          ];
        E(
          "Organizar a tela inicial",
          `<p class="wf-note">Rotina e avisos de risco permanecem acessíveis. Reordene e oculte os módulos opcionais.</p><div id="wf-home-order">${L.map(
            (d) =>
              `<div class="wf-home-row" data-home-key="${r(d)}"><label><input type="checkbox"${k.hidden?.includes(d) ? "" : " checked"}${["posso", "lim", "venc"].includes(d) ? " disabled" : ""}> ${r(
                (typeof HB_NOMES < "u" && HB_NOMES[d]) ||
                  v
                    .find(($) => $.dataset.hb === d)
                    ?.querySelector("h2,b")
                    ?.textContent?.slice(0, 70) ||
                  d,
              )}</label><button class="btn s" data-wf="home-up" aria-label="Mover para cima">↑</button><button class="btn s" data-wf="home-down" aria-label="Mover para baixo">↓</button></div>`,
          ).join(
            "",
          )}</div><button class="btn" data-wf="home-save">Salvar organização</button>`,
        );
      }
      function f(v) {
        v.querySelector("#hb-fim")?.remove();
        const I = a();
        if (!I) {
          const L = [...v.querySelectorAll("[data-hb]")].filter(
            (d) =>
              ["en", "cap", "metas"].includes(d.dataset.hb) &&
              d.textContent.trim(),
          );
          if (L.length) {
            const d = document.createElement("details");
            ((d.className = "home-secondary"),
              (d.innerHTML =
                "<summary>Patrimônio, metas e estudos</summary><p>Módulos complementares. Use Organizar início para escolher sua disposição.</p>"),
              L[0].before(d),
              L.forEach(($) => d.append($)));
          }
          return;
        }
        const k = new Map();
        v.querySelectorAll("[data-hb]").forEach((L) => {
          const d = L.dataset.hb;
          L.hidden =
            !["posso", "lim", "venc"].includes(d) && I.hidden?.includes(d);
          const $ = k.get(L.parentNode) || [];
          ($.push(L), k.set(L.parentNode, $));
        });
        for (const [L, d] of k) {
          const $ = document.createComment("home-order");
          L.insertBefore($, d[0]);
          const w = I.order || [];
          (d
            .sort(
              (b, y) =>
                (w.indexOf(b.dataset.hb) < 0 ? 999 : w.indexOf(b.dataset.hb)) -
                (w.indexOf(y.dataset.hb) < 0 ? 999 : w.indexOf(y.dataset.hb)),
            )
            .forEach((b) => L.insertBefore(b, $)),
            $.remove());
        }
      }
      function h() {
        const v = [];
        try {
          v.push({
            name: "Sincronização",
            source: "Supabase",
            at: S.lastSyncAt,
            error: SY.msg?.startsWith("Falha") ? SY.msg : "",
            note: SESS ? "Conta conectada" : "Cópia local; sem sessão",
          });
        } catch {}
        try {
          (v.push({
            name: "Salvamento local",
            source: "IndexedDB deste aparelho",
            note:
              LOCAL_SAVE.error ||
              (LOCAL_SAVE.pending
                ? "Gravação em andamento"
                : "Nenhuma gravação pendente"),
          }),
            v.push({
              name: "Último backup exportado",
              source: "Arquivo JSON do usuário",
              note: S.lastBackup
                ? String(S.lastBackup) + " · guarde o arquivo fora do aparelho"
                : "Nenhuma exportação registrada",
            }));
        } catch {}
        const I = window.TraderUI.metrics();
        I.samples &&
          v.push({
            name: "Interface nesta sessão",
            source: "Medição local, sem envio de dados",
            note: `${I.samples} atualizações medidas · p95 ${Math.round(I.p95)} ms · ${I.failures} falha(s) observada(s). Não inclui espera por rede.`,
          });
        try {
          v.push({
            name: "Cotações da carteira",
            source: "Fontes do módulo Carteiras",
            at: window.PF?.qts,
            error: window.PF?.qMsg || "",
            note: "Confira também a data de cada ativo; consulta recente não garante preço em tempo real.",
          });
        } catch {}
        try {
          for (const k of SYS.res || [])
            v.push({
              name: k.fn || k.nome || k.k || "Serviço",
              source: "Diagnóstico das funções",
              note: k.msg || k.st || "",
              at: k.em,
            });
        } catch {}
        E(
          "Qualidade e atualização dos dados",
          `<p>Data de consulta e data de mercado são diferentes. Ausência de erro não comprova atualização.</p><div class="wf-table"><table><thead><tr><th>Informação</th><th>Fonte</th><th>Última consulta</th><th>Estado / limitação</th></tr></thead><tbody>${v.map((k) => `<tr><th>${r(k.name)}</th><td>${r(k.source)}</td><td>${k.at ? r(new Date(k.at).toLocaleString("pt-BR")) : "Não informada"}</td><td>${r(k.error || k.note || "Sem diagnóstico disponível")}</td></tr>`).join("")}</tbody></table></div><button class="btn s" data-wf="status">Abrir diagnóstico completo</button>`,
        );
      }
      function Q() {
        const v = j().journal || {},
          I =
            typeof JR_COR < "u"
              ? Object.keys(JR_COR)
              : ["Mercados", "Empresas", "Internacional"];
        E(
          "Personalizar o PDF do jornal",
          `<label>Formato<select id="wf-journal-mode"><option value="full">Completo</option><option value="brief"${v.mode === "brief" ? " selected" : ""}>Resumido · primeiro parágrafo de cada matéria</option></select></label><label>Ativos de interesse, separados por vírgula<input id="wf-journal-tickers" value="${r((v.tickers || []).join(", "))}" placeholder="VALE3, PETR4, AAPL"></label><p class="wf-note">O filtro de ativos se aplica às matérias de empresas. O contexto macro é preservado.</p><h3>Editorias no PDF</h3>${I.map((k) => `<label class="ck"><input type="checkbox" data-journal-editor="${r(k)}"${v.hidden?.includes(k) ? "" : " checked"}> ${r(k)}</label>`).join("")}<button class="btn" data-wf="journal-save">Salvar preferências do PDF</button>`,
        );
      }
      function J() {
        (!o || F !== S) && Y();
        const v = l("#app");
        if (v) {
          if (
            window.DIARIO_DEMO &&
            !document.getElementById("wf-demo-banner")
          ) {
            const I = document.createElement("div");
            ((I.id = "wf-demo-banner"),
              (I.innerHTML =
                'DEMONSTRAÇÃO · registros fictícios · conta e rede externas desativadas. <a href="' +
                location.pathname +
                '">Voltar ao aplicativo real</a>'),
              document.body.prepend(I));
          }
          if ((tab === "home" && f(v), tab === "dia" && DV !== "hist")) {
            let I = v.querySelector(".diary-toolbar");
            if (!I) {
              ((I = document.createElement("div")),
                (I.className = "diary-toolbar"));
              const k = v.querySelector("h1");
              k ? k.after(I) : v.prepend(I);
            }
            I.insertAdjacentHTML(
              "beforeend",
              '<button class="btn s" data-wf="templates">Modelo do diário</button><button class="btn s" data-wf="history-day">Versões deste dia</button>',
            );
          }
          (tab === "rev" && v.insertAdjacentHTML("beforeend", m()),
            tab === "stats" &&
              v.insertAdjacentHTML(
                "beforeend",
                `<section class="card"><h2>Execução e resultado</h2>${P(s.compare(S.trades, calc, moedaT))}<p class="wf-note">Esta comparação considera todas as operações encerradas, independentemente do filtro das estatísticas acima.</p></section>`,
              ),
            tab === "import" &&
              (v.insertAdjacentHTML("beforeend", R()),
              typeof IM < "u" &&
                IM?.rows &&
                v.insertAdjacentHTML(
                  "beforeend",
                  `<p class="wf-note">Prévia: ${IM.rows.length} linha(s) agrupada(s), ${IM.dup?.size || 0} duplicada(s), ${IM.off?.size || 0} desmarcada(s), ${IM.upd?.size || 0} atualização(ões). Confira a prévia acima antes de importar.</p>`,
                )),
            v
              .querySelectorAll('.tcard[data-id],.card.row[data-a="edit"]')
              .forEach((I) => {
                if (I.querySelector('[data-wf="trade"]')) return;
                const k = I.dataset.id;
                k &&
                  I.insertAdjacentHTML(
                    "beforeend",
                    `<button class="btn s wf-process-button" data-wf="trade" data-id="${r(k)}">Diário e processo</button>`,
                  );
              }));
        }
      }
      (window.TraderUI.onRender("trader-fluxos", J),
        window.TraderUI.onSheet("trader-fluxos", function () {
          const v = l("#sh .sh");
          v &&
            T &&
            !isNew &&
            v.insertAdjacentHTML(
              "beforeend",
              `<div class="wf-actions"><button class="btn s" data-wf="trade" data-id="${r(T.id)}">Diário, regras e linha do tempo</button></div>`,
            );
        }),
        (window.TraderWorkflow = {
          beforeSave: z,
          reset: Y,
          captureTrade: M,
          prepareJournal: (v) => s.journal(v, j().journal),
          openSearch: H,
          quality: h,
          journalSettings: Q,
          openTrade: c,
        }),
        document.addEventListener("change", (v) => {
          (v.target.id === "wf-week" &&
            ((i = s.monday(v.target.value || G())), render()),
            v.target.id === "impf" &&
              (e = v.target.files?.[0]?.name || "Arquivo CSV"));
        }),
        window.addEventListener(
          "click",
          (v) => {
            if (
              v.target.closest('[data-a="impgo"]') &&
              typeof IM < "u" &&
              IM?.rows
            ) {
              const $ = IM.rows
                .filter((w) => !IM.dup.has(w.t.id) && !IM.off.has(w.t.id))
                .map((w) => w.t.id);
              N = {
                id: s.id(),
                name: e,
                ids: $,
                before: Object.fromEntries(
                  S.trades
                    .filter((w) => $.includes(w.id))
                    .map((w) => [w.id, s.clone(w)]),
                ),
              };
            }
            const k = v.target.closest("[data-wf]");
            if (!k) return;
            (v.preventDefault(), v.stopImmediatePropagation());
            const L = k.dataset.wf,
              d = k.dataset.id;
            if (
              (k.closest("#mdr2") &&
                (document.body.classList.remove("pcmenu", "trmenu"),
                (document.body.style.overflow = ""),
                document.body.classList.contains("pc") ||
                  document.getElementById("mdr2")?.remove()),
              L === "organize-home")
            )
              return (window.DIARIO_NAV.navigate("home"), n());
            if (L === "close") return l("#wf-dialog")?.close();
            if (L === "search") return H();
            if (L === "quality") return h();
            if (L === "templates") return g();
            if (L === "home") return n();
            if (L === "journal") return Q();
            if (L === "reports") return window.TraderReports?.openHub();
            if (L === "trade") return c(d);
            if (L === "history-trade") return q("trade", d);
            if (L === "history-day") return q("day", D);
            if (L === "assess") {
              const $ = S.trades.find((w) => w.id === d);
              $ &&
                (($._assessment = {
                  status: l("#wf-assessment").value,
                  note: l("#wf-assessment-note").value,
                  at: Date.now(),
                }),
                ($.rules = { followed: "s", broken: "n", unknown: "" }[
                  $._assessment.status
                ]),
                ($.u = Date.now()),
                save(),
                render(),
                c(d));
              return;
            }
            if (L === "day") {
              ((D = k.dataset.date),
                (DV = "ed"),
                typeof mdmSet == "function" && mdmSet(k.dataset.market || "br"),
                (tab = "dia"),
                l("#wf-dialog")?.close(),
                irPara(tab));
              return;
            }
            if (L === "edit") {
              l("#wf-dialog")?.close();
              const $ = S.trades.find((w) => w.id === d);
              $ &&
                ((orig = s.clone($)),
                (T = s.clone($)),
                (isNew = 0),
                showSheet());
              return;
            }
            if (L === "search-open") {
              const $ = k.dataset.kind;
              if ($ === "trade") return c(d);
              ($ === "day"
                ? ((D = d),
                  (DV = "ed"),
                  mdmSet(k.dataset.market === "US" ? "us" : "br"),
                  (tab = "dia"))
                : ((tab = $ === "rule" ? "regras" : "estudos"),
                  $ === "rule" &&
                    typeof mdmSet == "function" &&
                    mdmSet(k.dataset.market === "US" ? "us" : "br")),
                l("#wf-dialog")?.close(),
                irPara(tab));
              return;
            }
            if (L === "restore") {
              const $ = k.dataset.kind,
                w = $ === "trade" ? S.trades.find((V) => V.id === d) : O()[d],
                b = w?._history?.find((V) => V.id === k.dataset.version);
              if (
                !b ||
                !confirm(
                  "Restaurar esta versão como uma nova edição? A versão atual ficará no histórico.",
                )
              )
                return;
              const y = s.clone(w),
                C = {
                  _history: w._history,
                  _events: w._events,
                  _fc: w._fc,
                  _resolved: w._resolved,
                  _conflicts: w._conflicts,
                };
              for (const V of Object.keys(w)) delete w[V];
              (Object.assign(w, s.clone(b.data), C, { u: Date.now() }),
                s.archive(w, y, "restaurar_versao", Date.now(), 0),
                Y(),
                save(),
                render(),
                q($, d));
              return;
            }
            if (L === "weekly-save") {
              const $ = s.weekly(S.trades, O(), i, calc, moedaT),
                w = l("#wf-action")?.value.trim();
              if (!w) return toast("Escreva uma ação observável.");
              const b = s.addDays($.from, 7),
                y = `Ação da revisão ${$.from}: ${w}`;
              (j().weekly ??= {})[$.from] = { action: w, at: Date.now() };
              const C = O()[b] || (S.days[b] = { chk: {} });
              (String(C.plano || "").includes(y) ||
                (C.plano = [C.plano, y].filter(Boolean).join(`

`)),
                (C.u = Date.now()),
                save(),
                render(),
                toast("Ação guardada no plano da próxima segunda."));
              return;
            }
            if (L === "template-save" || L === "template-apply") {
              const $ = l("#wf-template").value,
                w = {
                  name: s.templates[$].name,
                  plano: l("#wf-template-plan").value,
                  pre: l("#wf-template-pre").value,
                };
              if (L === "template-save") (j().templates ??= {})[$] = w;
              else {
                const b = O()[D] || (S.days[D] = { chk: {} }),
                  y =
                    typeof MDM < "u" && MDM === "us"
                      ? (b.us ??= { chk: {} })
                      : b;
                (s.applyTemplate(y, w), (b.u = Date.now()));
              }
              (save(), l("#wf-dialog")?.close(), render());
              return;
            }
            if (L === "undo-batch") {
              const $ = j().importBatches?.find((b) => b.id === d);
              if (
                !$ ||
                !confirm(
                  "Desfazer alterações deste lote que não foram editadas depois?",
                )
              )
                return;
              const w = s.undoBatch(S, $);
              (save(),
                render(),
                toast(
                  `${w.removed} removida(s), ${w.restored} restaurada(s), ${w.skipped.length} preservada(s).`,
                ));
              return;
            }
            if (L === "home-up" || L === "home-down") {
              const $ = k.closest("[data-home-key]");
              L === "home-up" && $.previousElementSibling
                ? $.parentNode.insertBefore($, $.previousElementSibling)
                : L === "home-down" &&
                  $.nextElementSibling &&
                  $.parentNode.insertBefore($.nextElementSibling, $);
              return;
            }
            if (L === "home-save") {
              const $ = [
                ...document.querySelectorAll("#wf-home-order [data-home-key]"),
              ];
              ((j().home = {
                order: $.map((w) => w.dataset.homeKey),
                hidden: $.filter((w) => !w.querySelector("input").checked).map(
                  (w) => w.dataset.homeKey,
                ),
              }),
                (S.ax["home.layout"] = {
                  ordem: j().home.order,
                  ocultos: j().home.hidden,
                }),
                save(),
                l("#wf-dialog")?.close(),
                render());
              return;
            }
            if (L === "journal-save") {
              ((j().journal = {
                mode: l("#wf-journal-mode").value,
                tickers: l("#wf-journal-tickers")
                  .value.split(",")
                  .map(($) => $.trim().toUpperCase())
                  .filter(Boolean),
                hidden: [...document.querySelectorAll("[data-journal-editor]")]
                  .filter(($) => !$.checked)
                  .map(($) => $.dataset.journalEditor),
              }),
                save(),
                l("#wf-dialog")?.close(),
                toast("Preferências do PDF salvas."));
              return;
            }
            L === "status" &&
              ((tab = "status"), l("#wf-dialog")?.close(), irPara(tab));
          },
          !0,
        ));
    })(),
    (() => {
      "use strict";
      const s = (M) => esc(String(M ?? ""));
      let l = !1,
        r,
        j,
        O,
        G = "",
        o = "";
      function F() {
        const M = [`Tela aberta: ${tab}.`];
        return (
          typeof T < "u" && T?.ativo && M.push(`Ativo em edição: ${T.ativo}.`),
          window.PF?.sel &&
            M.push(`Ativo selecionado na carteira: ${window.PF.sel}.`),
          tab === "dia" && M.push(`Data do diário: ${D}.`),
          G && M.push(G),
          M.join(`
`) +
            `
Não foram anexados saldos, posições, plano ou textos do diário.`
        );
      }
      function N(M, E) {
        return Array.isArray(E) && E.length
          ? `<details><summary>${s(M)}</summary><ul>${E.map((u) => `<li>${s(typeof u == "string" ? u : JSON.stringify(u))}</li>`).join("")}</ul></details>`
          : "";
      }
      function e(M) {
        const E = M.r || {};
        return `<article class="wf-chat-message"><p class="wf-chat-question">${s(M.q)}</p><h3>${s(E.titulo || "Resposta da Economista IA")}</h3><p>${s(E.resumo || "")}</p>${(E.explicacao || []).map((u) => `<p>${s(u)}</p>`).join("")}
      ${N("Fatos apresentados pelo modelo — confira as fontes", E.fatos)}
      ${N(
        "Impactos descritos",
        E.impactos?.map((u) => `${u.mercado}: ${u.direcao}. ${u.porque || ""}`),
      )}
      ${N(
        "Cenários condicionais",
        E.cenarios?.map(
          (u) =>
            `${u.nome}: ${u.descricao || ""} Condições: ${u.gatilhos || "não informadas"}.${Number.isFinite(+u.probabilidade_pct) ? " Estimativa do modelo: " + u.probabilidade_pct + "%, sem calibração estatística informada." : ""}`,
        ),
      )}
      ${N("O que observar", E.o_que_observar)}${E.contraponto ? `<p><b>Contraponto:</b> ${s(E.contraponto)}</p>` : ""}
      ${N(
        "Visões",
        E.visoes?.map((u) => `${u.escola}: ${u.argumento}`),
      )}${N(
        "Glossário",
        E.glossario?.map((u) => `${u.termo}: ${u.significado}`),
      )}
      ${N("Fontes citadas na resposta", E.fontes)}<small>${s(new Date(M.em).toLocaleString("pt-BR"))} · conteúdo gerado por IA</small></article>`;
      }
      function i() {
        if (!O) return;
        const M = O.querySelector(".wf-chat-history"),
          E = O.querySelector("textarea"),
          u = O.querySelector('[role="status"]'),
          P = O.querySelector('[type="submit"]'),
          m = ECO.l.length
            ? ECO.l.map(e).join("")
            : '<p class="wf-chat-empty">Pergunte sobre juros, notícias, indicadores ou cenários. A conversa acompanha você entre as telas.</p>';
        if (m !== o) {
          const q = M.scrollTop,
            H = M.scrollHeight - M.clientHeight - q < 40;
          ((M.innerHTML = m), (o = m), (M.scrollTop = H ? M.scrollHeight : q));
        }
        ((u.textContent = ECO.busy ? "Preparando a resposta…" : ECO.err || ""),
          (P.disabled = !!ECO.busy),
          (E.disabled = !!ECO.busy));
        const c = O.querySelector(".wf-chat-context");
        ((c.textContent = F()),
          (c.hidden = !O.querySelector('[name="context"]').checked));
      }
      function B(M) {
        ((l = M),
          (O.hidden = !M),
          j.setAttribute("aria-expanded", String(M)),
          window.TraderUI.refreshScroll(),
          M
            ? (i(), O.querySelector("textarea").focus({ preventScroll: !0 }))
            : (document.querySelector("#dt393-global-head [data-ia-topo]") || j).focus({ preventScroll: !0 }),
          document.querySelectorAll("[data-ia-topo]").forEach((b) => b.setAttribute("aria-expanded", String(M))));
      }
      function Y() {
        if (r) return;
        ((r = document.createElement("div")),
          (r.id = "economista-flutuante"),
          (r.innerHTML = `<button type="button" class="wf-chat-launcher" aria-label="Abrir Economista IA" aria-expanded="false" aria-controls="wf-chat-panel"><span aria-hidden="true">IA</span></button>
      <aside id="wf-chat-panel" class="wf-chat-panel" aria-label="Conversa com a Economista IA" hidden><header><div><b>Economista IA</b><small>Assistente virtual · mesma conversa entre telas</small></div><button type="button" data-chat-close aria-label="Minimizar conversa">−</button></header>
      <div class="wf-chat-history" aria-label="Histórico da conversa"></div><div class="wf-chat-status" role="status" aria-live="polite"></div>
      <form><label class="wf-chat-context-label"><input type="checkbox" name="context"> Anexar tela, ativo e indicadores públicos, sem saldos ou textos do diário</label><pre class="wf-chat-context" hidden></pre><label class="wf-chat-input-label">Sua pergunta<textarea rows="2" maxlength="6000" placeholder="O que você quer entender?"></textarea></label><div class="wf-chat-actions"><button type="button" data-chat-clear>Limpar conversa</button><button type="submit">Enviar</button></div><small>A consulta utiliza o provedor de IA configurado. Respostas e cenários podem conter erros; confirme fontes e datas.</small></form></aside>`),
          document.body.append(r),
          (j = r.querySelector(".wf-chat-launcher")),
          (O = r.querySelector("aside")),
          j.addEventListener("click", () => {
            (j._dragged || B(!l), (j._dragged = !1));
          }),
          (O.querySelector("[data-chat-close]").onclick = () => B(!1)),
          (O.querySelector('[name="context"]').onchange = i),
          (O.querySelector("[data-chat-clear]").onclick = () => {
            ECO.busy ||
              !confirm(
                "Limpar apenas o histórico da Economista IA neste aparelho?",
              ) ||
              ((ECO.l = []), (ECO.err = ""), ecoSalva(), i());
          }),
          (O.querySelector("form").onsubmit = async (E) => {
            E.preventDefault();
            const u = O.querySelector("textarea"),
              P = u.value.trim();
            if (P.length < 3 || ECO.busy) return;
            if (window.DIARIO_DEMO) {
              ((ECO.err = "Demonstração: a consulta externa está desativada."),
                i());
              return;
            }
            const m =
              P +
              (O.querySelector('[name="context"]').checked
                ? `

Contexto autorizado:
` + F()
                : "");
            ((u.value = ""),
              await ecoPergunta(m),
              ECO.err && (u.value = P),
              i(),
              (O.querySelector(".wf-chat-history").scrollTop = 1e9));
          }),
          O.querySelector("textarea").addEventListener("keydown", (E) => {
            E.key === "Enter" &&
              (E.ctrlKey || E.metaKey) &&
              (E.preventDefault(), O.querySelector("form").requestSubmit());
          }));
        let M = null;
        (j.addEventListener("pointerdown", (E) => {
          ((M = {
            x: E.clientX,
            y: E.clientY,
            left: j.getBoundingClientRect().left,
            top: j.getBoundingClientRect().top,
          }),
            (j._dragged = !1),
            j.setPointerCapture?.(E.pointerId));
        }),
          j.addEventListener("pointermove", (E) => {
            if (!M || l) return;
            const u = E.clientX - M.x,
              P = E.clientY - M.y;
            Math.abs(u) + Math.abs(P) < 8 ||
              ((j._dragged = !0),
              (j.style.position = "fixed"),
              (j.style.left =
                Math.max(8, Math.min(innerWidth - 64, M.left + u)) + "px"),
              (j.style.top =
                Math.max(8, Math.min(innerHeight - 70, M.top + P)) + "px"),
              (j.style.right = "auto"),
              (j.style.bottom = "auto"));
          }),
          j.addEventListener("pointerup", () => {
            M = null;
          }),
          j.addEventListener("pointercancel", () => {
            M = null;
          }),
          document.addEventListener("keydown", (E) => {
            E.key === "Escape" && l && B(!1);
          }),
          window.addEventListener("resize", () => {
            ((j.style.left = ""),
              (j.style.top = ""),
              (j.style.position = ""),
              (j.style.right = ""),
              (j.style.bottom = ""));
          }));
      }
      Y();
      /* v584: o assistente abre por um ícone discreto no cabeçalho, ao lado da lupa e do sino (sem botão flutuante). */
      const iaIcone =
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H10l-4 4v-4H4z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/></svg>';
      function iaNoTopo() {
        for (const bar of document.querySelectorAll(".dt393-topactions")) {
          if (bar.closest(".v503-fantasma") || bar.querySelector("[data-ia-topo]")) continue;
          const b = document.createElement("button");
          b.type = "button";
          b.dataset.iaTopo = "1";
          b.title = "Assistente IA";
          b.setAttribute("aria-label", "Abrir assistente IA");
          b.setAttribute("aria-controls", "wf-chat-panel");
          b.setAttribute("aria-expanded", String(!!l));
          b.innerHTML = iaIcone;
          b.addEventListener("click", () => B(!l));
          const lupa = bar.querySelector('[data-dt393-action="search"]');
          lupa ? bar.insertBefore(b, lupa) : bar.append(b);
        }
        for (const b of document.querySelectorAll("[data-ia-topo]")) b.setAttribute("aria-expanded", String(!!l));
      }
      let iaPendente = !1;
      new MutationObserver(() => {
        iaPendente ||
          ((iaPendente = !0),
          requestAnimationFrame(() => {
            ((iaPendente = !1), iaNoTopo());
          }));
      }).observe(document.body, { childList: !0, subtree: !0 });
      iaNoTopo();
      const z = ecoPaint;
      ((ecoPaint = function () {
        (z.apply(this, arguments), i());
      }),
        window.TraderUI.onRender("trader-chat", {
          before() {
            const M = tab === "mercado" && MKT.tab === "eco";
            return (M && (MKT.tab = "mu"), M);
          },
          after(M) {
            (i(), M && B(!0));
          },
        }));
      try {
        for (const M of [HUB_M, ...MGRP.map((E) => E[1])])
          for (let E = M.length - 1; E >= 0; E--)
            (Array.isArray(M[E]) ? M[E][0] : M[E]) === "mercado:eco" &&
              M.splice(E, 1);
      } catch {}
      if (window.DIARIO_DEMO) {
        for (const E of ["alEnable", "alDisable", "alTest"])
          try {
            window[E] = async () =>
              toast("Notificações reais desativadas na demonstração.");
          } catch {}
        const M = vConta;
        vConta = () =>
          "<h1>Demonstração</h1><p>Conta e sincronização real estão desativadas. Os exemplos usam um banco local separado.</p>";
      }
      window.TraderChat = {
        open: (M = "") => {
          ((G = typeof M == "string" ? M : ""), B(!0));
        },
        close: () => B(!1),
        paint: i,
        context: F,
      };
    })(),
    (function (s) {
      "use strict";
      const l = "revista-tecnica-v289",
        r = (u) => typeof u == "number" && Number.isFinite(u),
        j = (u) => new Date(u * 1e3).toISOString().slice(0, 10),
        O = (u, P) => {
          const m = new Date(u + "T12:00:00Z");
          return (
            m.setUTCDate(m.getUTCDate() + P),
            m.toISOString().slice(0, 10)
          );
        },
        G = (u = new Date()) =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(u);
      function o(u) {
        const P = new Date(u + "T12:00:00Z").getUTCDay(),
          m = O(u, -((P + 2) % 7 || 7)),
          c = O(m, 3);
        return { day: u, cutoff: m, from: c, to: O(c, 4) };
      }
      function F(u, P) {
        const m = new Map();
        for (const c of u || [])
          !Array.isArray(c) ||
            c.length < 5 ||
            !r(c[0]) ||
            !Number.isFinite(new Date(c[0] * 1e3).getTime()) ||
            !c.slice(1, 5).every((q) => r(q) && q > 0) ||
            c[2] < Math.max(c[1], c[4]) ||
            c[3] > Math.min(c[1], c[4]) ||
            j(c[0]) > P ||
            m.set(j(c[0]), c.slice(0, 6));
        return [...m.values()].sort((c, q) => c[0] - q[0]);
      }
      function N(u) {
        const P = new Map();
        for (const m of u) {
          const c = j(m[0]),
            q = new Date(c + "T12:00:00Z").getUTCDay(),
            H = O(c, -((q + 6) % 7)),
            g = P.get(H);
          g
            ? ((g[2] = Math.max(g[2], m[2])),
              (g[3] = Math.min(g[3], m[3])),
              (g[4] = m[4]),
              (g[5] += m[5] || 0))
            : P.set(H, [...m.slice(0, 5), m[5] || 0]);
        }
        return [...P.values()];
      }
      const e = (u, P) =>
          u.length >= P ? u.slice(-P).reduce((m, c) => m + c[4], 0) / P : null,
        i = (u, P, m) =>
          P == null || m == null
            ? "não avaliada"
            : u > P && P > m
              ? "alta"
              : u < P && P < m
                ? "baixa"
                : "indefinida";
      function B(u) {
        if (u.length < 15) return null;
        let P = 0,
          m = 0;
        for (let c = 1; c < u.length; c++) {
          const q = u[c][4] - u[c - 1][4];
          c <= 14
            ? ((P += Math.max(0, q)),
              (m += Math.max(0, -q)),
              c === 14 && ((P /= 14), (m /= 14)))
            : ((P = (P * 13 + Math.max(0, q)) / 14),
              (m = (m * 13 + Math.max(0, -q)) / 14));
        }
        return P === 0 && m === 0
          ? 50
          : m === 0
            ? 100
            : 100 - 100 / (1 + P / m);
      }
      function Y(u, P) {
        const m = F(u.bars, P),
          c = N(m),
          q = m.at(-1),
          H = m.slice(-21, -1);
        if (m.length < 30 || !q)
          return {
            ...u,
            bars: m,
            available: !1,
            reason: u.error || "Menos de 30 sessões válidas até o corte.",
          };
        const g = j(q[0]);
        if ((Date.parse(P) - Date.parse(g)) / 864e5 > 10)
          return {
            ...u,
            bars: m,
            available: !1,
            asOf: g,
            reason: "Histórico defasado em relação ao corte da edição.",
          };
        const a = e(m, 20),
          n = e(m, 50),
          f = e(m, 200),
          h = e(c, 10),
          Q = e(c, 40),
          J = Math.min(...H.map((I) => I[3])),
          v = Math.max(...H.map((I) => I[2]));
        return {
          ...u,
          bars: m,
          weeks: c,
          available: !0,
          asOf: g,
          from: j(m[0][0]),
          close: q[4],
          ma20: a,
          ma50: n,
          ma200: f,
          w10: h,
          w40: Q,
          rsi: B(m),
          support: J,
          resistance: v,
          dailyTrend: i(q[4], a, n),
          weeklyTrend: i(q[4], h, Q),
          weeklyReturn:
            c.length > 1 ? (c.at(-1)[4] / c.at(-2)[4] - 1) * 100 : null,
          scenarios: [
            {
              name: "Continuação / rompimento de alta",
              condition:
                "Fechamento diário acima da máxima das 20 sessões anteriores, seguido de sustentação.",
              trigger: v,
              invalidation:
                "Retorno e fechamento dentro da faixa anterior; confirmar pelo novo candle.",
            },
            {
              name: "Perda de suporte",
              condition:
                "Fechamento diário abaixo da mínima das 20 sessões anteriores, seguido de continuidade.",
              trigger: J,
              invalidation: "Recuperação da faixa anterior em fechamento.",
            },
            {
              name: "Consolidação",
              condition:
                "Fechamentos entre as duas referências; acompanhar eventual saída do intervalo.",
              low: J,
              high: v,
              invalidation: "Saída confirmada da faixa em fechamento.",
            },
          ],
        };
      }
      function z(u, P) {
        const m = (u?.itens || []).find((q) => q.pedido === P);
        return m &&
          r(m.px) &&
          m.px > 0 &&
          r(m.max) &&
          r(m.min) &&
          m.max >= m.px &&
          m.min <= m.px
          ? {
              ticker: P === "WINFUT" ? "WIN" : "WDO",
              name: P === "WINFUT" ? "Índice futuro" : "Dólar futuro",
              available: !0,
              symbol: m.s,
              price: m.px,
              high: m.max,
              low: m.min,
              open: r(m.ab) ? m.ab : null,
              source: m.fonte || "Fonte do terminal",
              queried: u.em || null,
              delayed: m.atraso,
              limited: !0,
              note: "Snapshot do contrato informado pela fonte. Sem horário individual confirmado e sem série histórica real do futuro; não equivale ao fechamento semanal. Referências operacionais limitadas à máxima e mínima deste snapshot.",
            }
          : {
              ticker: P === "WINFUT" ? "WIN" : "WDO",
              name: P === "WINFUT" ? "Índice futuro" : "Dólar futuro",
              available: !1,
              reason:
                "Snapshot do contrato futuro indisponível. O histórico à vista não foi apresentado como futuro.",
            };
      }
      function M({
        reference: u,
        assets: P,
        snapshot: m,
        generated: c = new Date().toISOString(),
        demo: q = !1,
      }) {
        const H = o(u),
          g = new Set(),
          R = [];
        for (const a of P || [])
          g.has(a.ticker) || (g.add(a.ticker), R.push(Y(a, H.cutoff)));
        return {
          formato: l,
          dia: u,
          edicao: "fds",
          nome: "Revista técnica da semana",
          gerado: c,
          window: H,
          studies: R,
          futures: [z(m, "WINFUT"), z(m, "WDOFUT")],
          demo: q,
          manchete: { titulo: "Cenários técnicos para a próxima semana" },
          materias: [],
          em_poucas_linhas: [],
        };
      }
      function E(u = []) {
        const P = new Set();
        return u.filter((m) => {
          const c = String(m.titulo || m.texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          return !c || P.has(c) ? !1 : (P.add(c), !0);
        });
      }
      s.RevistaModel = {
        VERSION: l,
        date: j,
        spDate: G,
        windowFor: o,
        clean: F,
        weekly: N,
        mean: e,
        trend: i,
        rsi: B,
        study: Y,
        future: z,
        build: M,
        dedupe: E,
        add: O,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (s) {
      "use strict";
      const l = (B) => typeof B == "number" && Number.isFinite(B),
        r = s.CarteiraCalculo.num,
        j = (B) => (B.mk || "BR") + ":" + B.tk,
        O = (B, Y = "9999-12-31") =>
          (B || [])
            .filter((z) => z.d && z.d <= Y)
            .slice()
            .sort(
              (z, M) =>
                z.d.localeCompare(M.d) || (z.tp === "E") - (M.tp === "E"),
            );
      function G(B, Y = "9999-12-31") {
        const z = {},
          M = {},
          E = [];
        let u = 0;
        for (const P of O(B, Y)) {
          if (P.tp !== "P") continue;
          const m = r(P.p),
            c = r(P.q),
            q = r(P.cs) || 0;
          if (m == null) continue;
          const H = (c ? m * c : m) - q,
            g = P.mk === "US" ? "USD" : "BRL",
            R = P.d.slice(0, 7),
            a = j(P);
          ((z[R] ??= { BRL: 0, USD: 0 }),
            (z[R][g] += H),
            ((M[a] ??= { unit: g, total: 0 }).total += H));
          const n = r(P.fx),
            f = g === "BRL" ? H : n > 0 ? H * n : null;
          (f == null && u++,
            E.push({
              date: P.d,
              ticker: P.tk,
              key: a,
              unit: g,
              amount: H,
              brl: f,
              fx: g === "USD" ? n : null,
            }));
        }
        return {
          months: z,
          byAsset: M,
          events: E,
          missingFx: u,
          totals: E.reduce((P, m) => ((P[m.unit] += m.amount), P), {
            BRL: 0,
            USD: 0,
          }),
        };
      }
      function o(B, Y, z = "9999-12-31") {
        let M = 0,
          E = 0,
          u = 0,
          P = null,
          m = [];
        for (const f of O(Y, z).filter((h) => j(h) === B.k)) {
          const h = r(f.q) || 0,
            Q = r(f.p) || 0,
            J = r(f.cs) || 0;
          if (
            (f.tp === "C" && (M <= 1e-9 && ((E = 0), (P = f.d)), (M += h)),
            f.tp === "V" && (M = Math.max(0, M - h)),
            f.tp === "E")
          ) {
            const v = r(f.f);
            v > 0 &&
              (f.ev === "desd" && (M *= v),
              f.ev === "grup" && (M /= v),
              f.ev === "bonif" && (M *= 1 + v / 100));
          }
          if (f.tp === "P") {
            const v = (h ? h * Q : Q) - J;
            ((u += v), P && M > 0 && (E += v));
          }
          m.push(f);
        }
        const c = r(B.q),
          q = r(B.pm),
          H = B.tem ? r(B.pa) : null,
          g = c != null && q != null ? c * q : null,
          R = c != null && H != null ? c * H : null,
          a = R != null && g != null ? R - g : null,
          n = r(B.d1);
        return {
          unit: B.moeda || (B.mk === "US" ? "USD" : "BRL"),
          quantity: c,
          pm: q,
          cost: g,
          value: R,
          result: a,
          resultPct: g > 0 && a != null ? (a / g) * 100 : null,
          income: E,
          allIncome: u,
          withIncome: a == null ? null : a + E,
          withIncomePct: g > 0 && a != null ? ((a + E) / g) * 100 : null,
          pmIncome: c > 0 && g != null ? (g - E) / c : null,
          daily:
            R != null && n != null && n > -100 ? R - R / (1 + n / 100) : null,
          weight: r(B.peso),
          quoteAt: B.pxEm,
          cycleStart: P,
          events: m,
        };
      }
      function F(B, Y, z) {
        if (!B?.D?.length || B.D.length < 2)
          return {
            points: [],
            reason: "Histórico de patrimônio ainda não carregado.",
          };
        const M = [...(B.falhas || [])];
        for (const E of O(Y, B.D.at(-1)).filter((u) => u.tp === "C")) {
          if (["rf", "tesouro", "outro"].includes(E.cl)) {
            M.push(E.tk + ": falta histórico de marcação desta classe");
            continue;
          }
          const u = z?.series?.[E.tk];
          !u?.d?.length || !u?.c?.some(l)
            ? M.push(E.tk + ": falta série de preços")
            : u.d[u.c.findIndex((P) => l(P) && P > 0)] > E.d &&
              M.push(E.tk + ": histórico começa depois da primeira compra");
        }
        return (
          O(Y).some((E) => E.mk === "US") &&
            !z?.series?.__USD?.d?.length &&
            M.push("Falta histórico de câmbio"),
          M.length
            ? {
                points: [],
                reason:
                  "Gráfico não exibido para evitar usar custo como preço histórico: " +
                  [...new Set(M)].join("; "),
              }
            : {
                points: B.D.map((E, u) => ({
                  date: E,
                  value: l(B.V?.[u]) ? B.V[u] : null,
                  invested: l(B.INV?.[u]) ? B.INV[u] : null,
                })).filter((E) => E.value != null),
                source: B.fonte || "Histórico carregado no aplicativo",
                generated: B.gerado,
                reason: "",
              }
        );
      }
      function N(B) {
        const Y = new Map();
        for (const z of B || []) Y.set(z.date.slice(0, 7), z);
        return [...Y].map(([z, M]) => ({ date: z, value: M.value }));
      }
      function e(B, Y) {
        const z = {};
        for (const M of B || []) {
          const E = M.position || M;
          l(E.v) &&
            (z[E[Y] || "Não informado"] =
              (z[E[Y] || "Não informado"] || 0) + E.v);
        }
        return Object.entries(z)
          .sort((M, E) => E[1] - M[1])
          .map(([M, E]) => ({ date: M, value: E }));
      }
      function i(B, Y) {
        const z = Y || new Date().toISOString().slice(0, 10),
          M = [],
          E = [],
          u = [];
        for (const P of B || []) {
          if (!P.tem || !(r(P.pa) > 0)) {
            M.push(P.tk);
            continue;
          }
          const m = String(P.pxEm || "").slice(0, 10);
          /^\d{4}-\d{2}-\d{2}$/.test(m)
            ? m < z && u.push({ ticker: P.tk, date: m })
            : E.push(P.tk);
        }
        return {
          total: (B || []).length,
          priced: (B || []).length - M.length,
          missing: M,
          undated: E,
          previous: u,
          complete: !M.length,
        };
      }
      s.CarteiraResearch = {
        finite: l,
        num: r,
        key: j,
        ledger: O,
        income: G,
        detail: o,
        wealth: F,
        seriesMonthly: N,
        groups: e,
        coverage: i,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (s) {
      "use strict";
      const l = (N) => typeof N == "number" && Number.isFinite(N),
        r = (N) => N.reduce((e, i) => e + i, 0),
        j = (N) => {
          if (N.length < 2) return null;
          const e = r(N) / N.length;
          return Math.sqrt(r(N.map((i) => (i - e) ** 2)) / (N.length - 1));
        };
      function O(N) {
        if (
          s.CarteiraCalculo &&
          s.CarteiraCalculo.audit(N.ledger || [], N.asOf || "9999-12-31").issues
            .length
        )
          return {
            available: !1,
            reason:
              "Há inconsistências nos lançamentos. Retorno e risco omitidos até a conferência.",
          };
        if (N.selected?.tipo === "ativo")
          return {
            available: !1,
            reason:
              "Ficha individual: retorno e risco da carteira completa não são atribuídos a este ativo.",
          };
        const e = N.performance,
          i = N.wealth,
          B = N.asOf || String(N.generated || "9999-12-31").slice(0, 10);
        if (!i?.points?.length || !e?.D?.length || e.falhas?.length)
          return {
            available: !1,
            reason:
              i?.reason ||
              "Histórico completo e validado ainda não disponível.",
          };
        const Y = e.D.map((v, I) => ({ d: v, i: I })).filter(
          (v) => /^\d{4}-\d{2}-\d{2}$/.test(v.d) && v.d <= B,
        );
        if (
          Y.length < 2 ||
          Y.some((v, I) => I && v.d <= Y[I - 1].d) ||
          Y.some((v) => !l(e.I?.[v.i]) || e.I[v.i] <= 0 || !l(e.V?.[v.i]))
        )
          return {
            available: !1,
            reason:
              "Histórico com lacunas ou índices inválidos; métricas omitidas.",
          };
        const z = Y[0].i,
          M = Y.at(-1).i,
          E = e.I[z],
          u = Y.map((v) => ({
            date: v.d,
            value: e.V[v.i],
            index: (e.I[v.i] / E) * 100,
            i: v.i,
          })),
          P = (v) =>
            Y.every((I) => l(e[v]?.[I.i]) && e[v][I.i] > 0)
              ? u.map((I) => ({
                  date: I.date,
                  value: (e[v][I.i] / e[v][z]) * 100,
                }))
              : [],
          m = P("ib"),
          c = P("cdi"),
          q = [];
        let H = z;
        const g = new Map();
        for (const v of u) g.set(v.date.slice(0, 7), v);
        for (const [v, I] of g)
          I.i !== z &&
            (q.push({
              date: v,
              value: (e.I[I.i] / e.I[H] - 1) * 100,
              ib: m.length ? (e.ib[I.i] / e.ib[H] - 1) * 100 : null,
              cdi: c.length ? (e.cdi[I.i] / e.cdi[H] - 1) * 100 : null,
              partial: v === B.slice(0, 7),
            }),
            (H = I.i));
        let R = u[0].index,
          a = 0;
        for (const v of u)
          ((R = Math.max(R, v.index)),
            (a = Math.min(a, (v.index / R - 1) * 100)));
        const n = Y.slice(1).map((v, I) => e.I[v.i] / e.I[Y[I].i] - 1),
          f = j(n),
          h = m.length
            ? Y.slice(1).map((v, I) => n[I] - (e.ib[v.i] / e.ib[Y[I].i] - 1))
            : [],
          Q = q.at(-1),
          J = Object.entries(e.pnlK || {})
            .map(([v, I]) => ({
              key: v,
              ticker: v.split(":").slice(1).join(":") || v,
              value: Y.slice(1).every((k) => l(I[k.i]))
                ? r(Y.slice(1).map((k) => I[k.i]))
                : null,
            }))
            .filter((v) => v.value !== null);
        return {
          available: !0,
          rows: u,
          ib: m,
          cdi: c,
          monthly: q,
          from: u[0].date,
          to: u.at(-1).date,
          return: u.at(-1).index - 100,
          monthReturn: Q?.value ?? null,
          vol: n.length >= 20 && f != null ? f * Math.sqrt(252) * 100 : null,
          drawdown: a,
          tracking: h.length >= 20 ? j(h) * Math.sqrt(252) * 100 : null,
          n: n.length,
          contributions: J,
          source: e.fonte || "Histórico de cotações do aplicativo",
        };
      }
      function G(N) {
        const e = [];
        for (const [i, B] of Object.entries(N.snapshots || {})) {
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(i) ||
            i > (N.asOf || String(N.generated).slice(0, 10))
          )
            continue;
          const Y = B.BR?.v,
            z = B.US?.v;
          (!l(Y) && !l(z)) ||
            (l(z) && z !== 0) ||
            e.push({ date: i, value: l(Y) ? Y : 0 });
        }
        return e.sort((i, B) => i.date.localeCompare(B.date));
      }
      function o(N) {
        const e = N.asOf || String(N.generated || "").slice(0, 10),
          i = N.assets || [],
          B = N.snapshot?.fx,
          Y = [],
          z = i.map((q) => {
            const H = q.position,
              g = H.moeda === "USD" || H.mk === "US",
              R =
                H.tem && l(H.q) && l(H.pa) && (!g || (l(B) && B > 0))
                  ? H.q * H.pa * (g ? B : 1)
                  : null;
            return (R === null && Y.push(H.tk), { ...q, value: R });
          }),
          M = r(z.filter((q) => q.value !== null).map((q) => q.value)),
          E = (q) => {
            const H = {};
            for (const g of z)
              if (g.value !== null) {
                const R = g.position[q] || "Não informado";
                H[R] = (H[R] || 0) + g.value;
              }
            return Object.entries(H)
              .map(([g, R]) => ({
                name: g,
                value: R,
                weight: M > 0 ? (R / M) * 100 : null,
              }))
              .sort((g, R) => R.value - g.value);
          },
          u = O(N),
          P =
            N.selected?.tipo === "ativo"
              ? []
              : N.wealth?.points?.length
                ? N.wealth.points
                : G({ ...N, asOf: e }),
          m = z
            .filter((q) => q.value !== null)
            .sort((q, H) => H.value - q.value)
            .slice(0, 3),
          c = N.income || s.CarteiraResearch.income(N.ledger || [], e);
        return {
          asOf: e,
          positions: z,
          total: M,
          missing: Y,
          partial: Y.length > 0,
          classes: E("cl"),
          sectors: E("setor"),
          top3: M > 0 ? (r(m.map((q) => q.value)) / M) * 100 : null,
          largest: m[0]?.position.tk,
          largestWeight: M > 0 && m.length ? (m[0].value / M) * 100 : null,
          perf: u,
          wealth: P,
          wealthRecorded: !N.wealth?.points?.length,
          income: c,
        };
      }
      function F(N) {
        const e = [],
          i = new Set();
        function B(Y, z = "") {
          if (Y != null) {
            if (typeof Y == "string" || typeof Y == "number") {
              const M = (z ? z + ": " : "") + String(Y).trim(),
                E = M.normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/\s+/g, " ");
              M && !i.has(E) && (i.add(E), e.push(M));
            } else if (Array.isArray(Y)) Y.forEach((M) => B(M));
            else if (typeof Y == "object")
              for (const [M, E] of Object.entries(Y))
                ["exec_id", "modelo", "identificacao"].includes(M) ||
                  B(
                    E,
                    typeof E == "string" || typeof E == "number"
                      ? M.replace(/_/g, " ").replace(/^./, (u) =>
                          u.toUpperCase(),
                        )
                      : "",
                  );
          }
        }
        return (B(N), e);
      }
      s.CarteiraFactsheetModel = {
        build: o,
        performance: O,
        snapshotHistory: G,
        paragraphs: F,
        stdev: j,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (s) {
      "use strict";
      const l = (u) => typeof u == "number" && Number.isFinite(u),
        r = /^\d{4}-(03-31|06-30|09-30|12-31)$/,
        j = (u) => {
          const P = String(u || "")
            .trim()
            .toUpperCase();
          return P === "R$"
            ? "BRL"
            : P === "US$"
              ? "USD"
              : /^[A-Z]{3}$/.test(P)
                ? P
                : null;
        },
        O = (u) =>
          r.test(String(u || "")) ? Number(String(u).slice(5, 7)) / 3 : null,
        G = (u) =>
          O(u) ? O(u) + "T" + u.slice(2, 4) : String(u || "sem referência"),
        o = (u) => {
          const P = String(u || "");
          return /^\d{4}$/.test(P)
            ? P + "-12-31"
            : /^\d{4}-12-31$/.test(P)
              ? P
              : null;
        },
        F = (u) => {
          if (u == null || u === "") return null;
          const P = String(u).trim();
          if (
            !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
              P,
            )
          )
            return null;
          const m = P.slice(0, 10),
            c = new Date(m + "T00:00:00Z");
          return Number.isFinite(c.getTime()) &&
            c.toISOString().slice(0, 10) === m
            ? m
            : null;
        },
        N = (u) =>
          u?.data_divulgacao ??
          u?.divulgado_em ??
          u?.publicado_em ??
          u?.published_at ??
          u?.data_publicacao,
        e = (u) => F(N(u)),
        i = (u) => {
          const P = N(u);
          return P != null && String(P).trim() !== "" && !F(P);
        },
        B = (u) =>
          [u?.tipo_periodo, u?.base_periodo, u?.escopo].some((P) =>
            /^(ytd|ttm|anual|annual|acumulado|12m|9m|6m|3m-acum|ano|acumulado no ano|last 12 months)$/i.test(
              String(P || "").trim(),
            ),
          );
      function Y(u) {
        if (!r.test(u)) return null;
        const P = Number(u.slice(0, 4)),
          m = O(u),
          c = m === 1 ? { y: P - 1, q: 4 } : { y: P, q: m - 1 };
        return c.y + "-" + ["03-31", "06-30", "09-30", "12-31"][c.q - 1];
      }
      const z = (u, P) =>
        Math.abs(u - P) <=
        Math.max(0.01, Math.abs(u) * 1e-6, Math.abs(P) * 1e-6);
      function M(u, P, m = []) {
        const c = F(P),
          q = c || "0000-01-01",
          H = (Array.isArray(u) ? u : []).filter(
            ($) => $ && Array.isArray($.rows),
          ),
          g = ($, w) =>
            w &&
            r.test(String(w.periodo || "")) &&
            w.periodo <= q &&
            !i(w) &&
            !i($) &&
            (!e(w) || e(w) <= q) &&
            (!e($) || e($) <= q) &&
            !B(w) &&
            (l(w.receita) || l(w.lucro)),
          R =
            H.flatMap(($) =>
              $.rows
                .filter((w) => g($, w))
                .map((w) => ({
                  periodo: w.periodo,
                  moeda: j(w.moeda) || j($.moeda),
                })),
            )
              .filter(($) => $.moeda)
              .sort(($, w) => w.periodo.localeCompare($.periodo))[0]?.moeda ||
            null,
          a = new Map(),
          n = [],
          f = [],
          h = new Set(),
          Q = [],
          J = [],
          v = [];
        for (const [$, w] of H.entries()) {
          const b = j(w.moeda),
            y = String(w.origem || "Fonte " + ($ + 1)).slice(0, 100);
          for (const C of w.rows) {
            const V = String(C?.periodo || "");
            if (!r.test(V) || V > q || (!l(C?.receita) && !l(C?.lucro)))
              continue;
            if (B(C)) {
              n.push({
                periodo: V,
                origem: y,
                motivo: "valor acumulado ou anual não é trimestre isolado",
              });
              continue;
            }
            if (i(C) || i(w)) {
              n.push({
                periodo: V,
                origem: y,
                motivo:
                  "data de divulgação inválida na fonte; conferência necessária",
              });
              continue;
            }
            if (e(C) > q || e(w) > q) {
              n.push({
                periodo: V,
                origem: y,
                motivo: "divulgação posterior à referência",
              });
              continue;
            }
            const X = j(C.moeda) || b;
            if (!X || (R && X !== R)) {
              n.push({
                periodo: V,
                origem: y,
                motivo: X ? "moeda incompatível" : "moeda não identificada",
              });
              continue;
            }
            a.has(V) ||
              a.set(V, {
                periodo: V,
                receita: null,
                lucro: null,
                moeda: X,
                origens: {},
                confirmacoes: { receita: [], lucro: [] },
                divulgadoEm: null,
                derivados: [],
              });
            const _ = a.get(V);
            if (_.moeda !== X) {
              n.push({ periodo: V, origem: y, motivo: "moeda incompatível" });
              continue;
            }
            const K = e(C) || e(w);
            K && (!_.divulgadoEm || _.divulgadoEm < K) && (_.divulgadoEm = K);
            for (const U of ["receita", "lucro"])
              !l(C[U]) ||
                h.has(V + ":" + U) ||
                (_[U] === null
                  ? ((_[U] = C[U]),
                    (_.origens[U] = y),
                    _.confirmacoes[U].push(y))
                  : z(_[U], C[U])
                    ? _.confirmacoes[U].includes(y) || _.confirmacoes[U].push(y)
                    : (f.push({
                        periodo: V,
                        campo: U,
                        origens: [_.origens[U], y],
                      }),
                      (_[U] = null),
                      (_.origens[U] = null),
                      (_.confirmacoes[U] = []),
                      h.add(V + ":" + U)));
          }
        }
        const I = new Map(),
          k = new Set();
        for (const [$, w] of (Array.isArray(m) ? m : []).entries()) {
          if (!w || !R) continue;
          const b = o(w.periodo || w.ano || w.date),
            y = j(w.moeda);
          if (!b || b > q || y !== R || i(w) || e(w) > q) continue;
          I.has(b) ||
            I.set(b, {
              periodo: b,
              moeda: y,
              receita: null,
              lucro: null,
              origens: {},
            });
          const C = I.get(b),
            V = String(w.origem || "Anual fonte " + ($ + 1)).slice(0, 100);
          for (const X of ["receita", "lucro"]) {
            const _ =
              X === "receita"
                ? (w.receita ?? w.revenue)
                : (w.lucro ?? w.profit);
            !l(_) ||
              k.has(b + ":" + X) ||
              (C[X] === null
                ? ((C[X] = _), (C.origens[X] = V))
                : z(C[X], _) ||
                  (J.push({ periodo: b, campo: X, origens: [C.origens[X], V] }),
                  (C[X] = null),
                  (C.origens[X] = null),
                  k.add(b + ":" + X)));
          }
        }
        for (const $ of I.values()) {
          const w = $.periodo,
            b = w.slice(0, 4),
            y = a.get(b + "-03-31"),
            C = a.get(b + "-06-30"),
            V = a.get(b + "-09-30");
          if (!y || !C || !V) continue;
          const X = a.get(w) || {
            periodo: w,
            receita: null,
            lucro: null,
            moeda: $.moeda,
            origens: {},
            confirmacoes: { receita: [], lucro: [] },
            divulgadoEm: null,
            derivados: [],
          };
          let _ = !1;
          for (const K of ["receita", "lucro"]) {
            if (
              !l($[K]) ||
              k.has(w + ":" + K) ||
              h.has(w + ":" + K) ||
              ![y, C, V].every((te) => l(te[K]) && !h.has(te.periodo + ":" + K))
            )
              continue;
            const U = $[K] - (y[K] + C[K] + V[K]);
            if (l(U)) {
              if (l(X[K])) {
                const te = X[K] + y[K] + C[K] + V[K];
                z(te, $[K]) ||
                  (v.push({
                    periodo: w,
                    campo: K,
                    anual: $[K],
                    somaTrimestres: te,
                  }),
                  (X[K] = null),
                  (X.origens[K] = null),
                  (X.confirmacoes[K] = []),
                  h.add(w + ":" + K));
                continue;
              }
              ((X[K] = U),
                (X.origens[K] =
                  "4T calculado: " +
                  String($.origens[K] || "fonte secundária").slice(0, 80)),
                X.derivados.push(K),
                Q.push({ periodo: w, campo: K }),
                (_ = !0));
            }
          }
          _ && a.set(w, X);
        }
        const L = [...a.values()]
            .sort(($, w) => w.periodo.localeCompare($.periodo))
            .slice(0, 12),
          d = L.filter(($) => !$.divulgadoEm).length;
        return {
          quarters: L,
          moeda: R,
          rejected: n,
          conflicts: f,
          derived: Q,
          annualConflicts: J,
          reconciliations: v,
          publicacoesNaoInformadas: d,
          referenciaInvalida: !c,
        };
      }
      function E(u, P, m = []) {
        const c = M(u, P, m),
          q = c.quarters,
          H = q[0] || null,
          g = {
            value: null,
            missing: [],
            reason: c.referenciaInvalida
              ? "Data de referência inválida: não foi possível selecionar balanços com segurança."
              : "Nenhum trimestre isolado disponível",
            derivados: [],
          };
        if (!H)
          return {
            ...c,
            latest: null,
            ytd: { periodos: [], receita: { ...g }, lucro: { ...g } },
            ttm: { periodos: [], receita: { ...g }, lucro: { ...g } },
          };
        const R = new Map(q.map((v) => [v.periodo, v])),
          a = O(H.periodo),
          n = H.periodo.slice(0, 4),
          f = Array.from(
            { length: a },
            (v, I) => n + "-" + ["03-31", "06-30", "09-30", "12-31"][I],
          ),
          h = [H.periodo];
        for (let v = 1; v < 4; v++) h.unshift(Y(h[0]));
        function Q(v, I) {
          const k = v.filter((b) => !l(R.get(b)?.[I])),
            L = c.conflicts
              .filter((b) => b.campo === I && v.includes(b.periodo))
              .map((b) => b.periodo),
            d = c.annualConflicts
              .filter((b) => b.campo === I && v.includes(b.periodo))
              .map((b) => b.periodo),
            $ = c.reconciliations
              .filter((b) => b.campo === I && v.includes(b.periodo))
              .map((b) => b.periodo),
            w = v.filter((b) => R.get(b)?.derivados.includes(I));
          return {
            value:
              k.length || !c.moeda
                ? null
                : v.reduce((b, y) => b + R.get(y)[I], 0),
            missing: k,
            derivados: w,
            reason: L.length
              ? "Divergência entre fontes em " +
                L.map(G).join(", ") +
                ". Conferir CVM/RI"
              : $.length
                ? "Divergência entre anual e trimestres em " +
                  $.map(G).join(", ") +
                  ". Valores não somados. Conferir CVM/RI"
                : d.length && k.length
                  ? "Divergência nos anuais de " +
                    d.map(G).join(", ") +
                    ". Conferir CVM/RI"
                  : k.length
                    ? "Faltam " + k.map(G).join(", ")
                    : c.moeda
                      ? null
                      : "Moeda contábil não confirmada",
          };
        }
        const J = (v) => ({
          periodos: v,
          inicio: v[0],
          fim: v.at(-1),
          receita: Q(v, "receita"),
          lucro: Q(v, "lucro"),
        });
        return { ...c, latest: H, ytd: J(f), ttm: J(h) };
      }
      s.CarteiraPeriodos = {
        calculate: E,
        normalize: M,
        label: G,
        previous: Y,
        quarter: O,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (s) {
      "use strict";
      const l = (G, o = 2) =>
          typeof G == "number" && Number.isFinite(G)
            ? G.toLocaleString("pt-BR", {
                minimumFractionDigits: o,
                maximumFractionDigits: o,
              })
            : "Não disponível",
        r = (G) =>
          typeof G == "number" && Number.isFinite(G)
            ? l(G) + "%"
            : "Não disponível",
        j = (G) =>
          typeof G == "number" && Number.isFinite(G)
            ? "R$ " + l(G)
            : "Não disponível";
      async function O(G) {
        const o = s.CarteiraFactsheetModel,
          F = s.CarteiraResearch,
          N = o.build(G),
          e = await rpLib(),
          i = await rpNovo(e, {
            titulo: "Relatório de Gestão de Carteira",
            cabecalho: "Gestão de carteira",
            data: N.asOf,
            tipo: "Factsheet patrimonial e análise fundamentalista",
            demo: !!G.demo,
          });
        for (const [_, K] of Object.entries(s.TraderExportBrand?.PDF || {}))
          i.C[_] = i.hex(K);
        const B = new Map(),
          Y = new Map(),
          z = new Map();
        async function M(_) {
          if (z.has(_)) return z.get(_);
          const K =
              typeof AbortController == "function"
                ? new AbortController()
                : null,
            U = K ? setTimeout(() => K.abort(), 1800) : null;
          try {
            const te = await fetch("logos/fx/" + _.toLowerCase() + ".png", {
              cache: "force-cache",
              ...(K ? { signal: K.signal } : {}),
            });
            if (!te.ok) return null;
            const ue = await i.doc.embedPng(await te.arrayBuffer());
            return (z.set(_, ue), ue);
          } catch {
            return null;
          } finally {
            U !== null && clearTimeout(U);
          }
        }
        for (const _ of N.positions || []) {
          const K = String(_.position?.tk || "").toUpperCase(),
            U = s.TraderAssetIdentity?.currencyPair(K);
          if (U && !Y.has(K)) {
            const ue = await M(U.baseCountry),
              ge = await M(U.quoteCountry);
            ue && ge && Y.set(K, [ue, ge]);
          }
          const te = s.TraderAssetIdentity?.logoInfo(K);
          if (!(!te?.local || B.has(K)))
            try {
              const ue = await fetch(te.url, { cache: "force-cache" });
              ue.ok && B.set(K, await i.doc.embedPng(await ue.arrayBuffer()));
            } catch {}
        }
        const E = i.C,
          u = i.pg;
        let P = "Gestão de carteira";
        i.add = () => {
          ((i.pg = i.doc.addPage([i.W, i.H])),
            i.n++,
            (i.y = 66),
            i.rect(0, 0, i.W, 7, { fill: E.dk }),
            i.t("DIÁRIO DE TRADER / GESTÃO DE CARTEIRA", i.M, 26, {
              s: 7,
              f: "b",
              c: E.ac,
            }),
            i.t(N.asOf, i.W - i.M, 26, { s: 7, c: E.mut, al: "r" }),
            i.ln(i.M, 44, i.W - i.M, 44, { c: E.bd, w: 0.6 }));
        };
        const m = (
            _,
            { size: K = 9, color: U = E.tx, font: te = "r", gap: ue = 6 } = {},
          ) => {
            for (const ge of i.wrap(String(_ ?? ""), i.CW, K, te))
              (i.need(K * 1.45 + 2),
                i.t(ge, i.M, i.y, { s: K, f: te, c: U }),
                (i.y += K * 1.45));
            i.y += ue;
          },
          c = (_) => m(_, { size: 7.3, color: E.mut, gap: 8 }),
          q = (_, K) => {
            const U = i.wrap(_, i.CW, 15, "b");
            (i.need(U.length * 21 + 45), (i.y += 5));
            for (const te of U)
              (i.t(te, i.M, i.y, { s: 15, f: "b", c: E.dk }), (i.y += 21));
            K && c(K);
          },
          H = (_, K, U = !1) => {
            ((P = _), (U || i.y > i.BOT - 260) && i.add(), q(_, K));
          },
          g = (_, K, U) =>
            i.tab(
              _.map((te, ue) => ({ l: te, w: U?.[ue] || 100 / _.length })),
              K,
              { s: 8 },
            ),
          R = (_) => {
            (i.need(66), i.rect(i.M, i.y, i.CW, 48, { fill: E.cz }));
            const K = i.y;
            ((i.y += 10),
              m(_, { size: 8.2, gap: 4 }),
              (i.y = Math.max(i.y, K + 58)));
          };
        function a(_, K, U) {
          const te = _.filter((Ae) => Ae.points?.length >= 2);
          if ((q(K), !te.length)) {
            R("Série suficiente não disponível. O gráfico não foi estimado.");
            return;
          }
          const ue = 174;
          i.need(ue + 58);
          const ge = i.M + 47,
            oe = i.y + 8,
            ee = i.CW - 58,
            ae = te.flatMap((Ae) => Ae.points.map((Se) => Se.value)),
            se = Math.min(...ae),
            me = Math.max(...ae),
            ve = me - se || Math.max(Math.abs(me) * 0.1, 1),
            Me = (Ae) => oe + 145 - ((Ae - se) / ve) * 132;
          te.forEach((Ae, Se) => {
            (i.ln(i.M + Se * 148, i.y, i.M + 12 + Se * 148, i.y, {
              c: i.hex(Ae.color),
              w: 2,
            }),
              i.t(Ae.name, i.M + 18 + Se * 148, i.y - 4, { s: 7, c: E.mut }));
          });
          for (let Ae = 0; Ae < 4; Ae++) {
            const Se = se + (ve * Ae) / 3;
            (i.ln(ge, Me(Se), ge + ee, Me(Se), { c: E.bd, w: 0.5 }),
              i.t(l(Se, me - se < 10 ? 2 : 0), ge - 7, Me(Se) - 3, {
                s: 7,
                c: E.mut,
                al: "r",
              }));
          }
          for (const Ae of te)
            for (let Se = 1; Se < Ae.points.length; Se++) {
              const Re = (Pe) => ge + (ee * Pe) / (Ae.points.length - 1);
              i.ln(
                Re(Se - 1),
                Me(Ae.points[Se - 1].value),
                Re(Se),
                Me(Ae.points[Se].value),
                { c: i.hex(Ae.color), w: 1.7 },
              );
            }
          const xe = te[0].points;
          (i.t(xe[0].date, ge, oe + 153, { s: 7, c: E.mut }),
            i.t(xe.at(-1).date, ge + ee, oe + 153, { s: 7, c: E.mut, al: "r" }),
            (i.y += ue + 4),
            c(U));
        }
        function n(
          _,
          K,
          { percent: U = !1, label: te = "value", benchmark: ue = !1 } = {},
        ) {
          if ((q(K), !_.length)) {
            R("Sem observações verificadas para este quadro.");
            return;
          }
          ((_ = _.slice(-12)), i.need(210));
          const ge = i.M + 45,
            oe = i.y + 4,
            ee = i.CW - 55,
            ae = 135,
            se = _.flatMap((Se) => [
              Se[te],
              ...(ue && Se.ib != null ? [Se.ib] : []),
            ]),
            me = Math.min(0, ...se),
            ve = Math.max(0, ...se),
            Me = ve - me || 1,
            xe = (Se) => oe + ((ve - Se) / Me) * ae,
            Ae = ee / _.length;
          for (let Se = 0; Se < 4; Se++) {
            const Re = me + (Me * Se) / 3;
            (i.ln(ge, xe(Re), ge + ee, xe(Re), { c: E.bd, w: 0.5 }),
              i.t(l(Re, U ? 1 : 0) + (U ? "%" : ""), ge - 6, xe(Re) - 3, {
                s: 7,
                c: E.mut,
                al: "r",
              }));
          }
          (_.forEach((Se, Re) => {
            const Pe =
              ue && Se.ib != null
                ? [
                    [Se[te], E.ac],
                    [Se.ib, E.dk],
                  ]
                : [[Se[te], Se[te] < 0 ? E.r : E.ac]];
            (Pe.forEach(([je, Ue], Fe) => {
              const $e = (Ae * 0.66) / Pe.length;
              i.rect(
                ge + Re * Ae + Ae * 0.17 + Fe * $e,
                Math.min(xe(je), xe(0)),
                Math.max(1, $e - 1),
                Math.max(0.5, Math.abs(xe(je) - xe(0))),
                { fill: Ue },
              );
            }),
              i.t(Se.date.slice(2), ge + (Re + 0.5) * Ae, oe + ae + 12, {
                s: 6.5,
                c: E.mut,
                al: "c",
              }));
          }),
            (i.y += 175),
            c(
              ue
                ? "Verde: carteira. Azul-marinho: IBOV, quando há série completa na mesma janela."
                : "Valores registrados; ausência de lançamento não comprova ausência de recebimento.",
            ));
        }
        function f(_, K, U = (te) => j(te)) {
          if ((q(K), !_.length)) {
            R("Sem dados suficientes.");
            return;
          }
          const te = Math.max(..._.map((ue) => Math.abs(ue.value)), 1);
          for (const ue of _)
            (i.need(36),
              i.t(ue.name || ue.ticker || ue.date, i.M, i.y, {
                s: 8,
                f: "b",
                w: 150,
              }),
              i.rect(i.M + 155, i.y, 210, 9, { fill: E.cz }),
              i.rect(i.M + 155, i.y, (210 * Math.abs(ue.value)) / te, 9, {
                fill: ue.value < 0 ? E.r : E.ac,
              }),
              i.t(U(ue.value, ue), i.W - i.M, i.y, { s: 8, al: "r", c: E.tx }),
              (i.y += 25));
          i.y += 8;
        }
        function h(_, K) {
          const U = o.paragraphs(K);
          if (U.length) {
            q(_);
            for (const te of U) m(te, { size: 8.5, gap: 5 });
          }
        }
        function Q(_) {
          const K = _.advanced;
          if (K) {
            if (
              (K.history?.length &&
                (q("Histórico de rentabilidade e estrutura"),
                g(
                  ["Ano", "Margem líquida %", "ROE %", "CT/PL"],
                  K.history.map((U) => [
                    U.date,
                    l(U.margin),
                    l(U.roe),
                    l(U.leverage),
                  ]),
                  [16, 28, 28, 28],
                ),
                c(
                  "Indicadores anuais. CT/PL não equivale a dívida líquida/EBITDA. Lacunas não são preenchidas.",
                )),
              K.peers?.rows?.some((U) => U.n >= 3) &&
                (q("Empresa diante da amostra setorial"),
                g(
                  ["Indicador", "Ativo", "P25", "Mediana", "P75", "N"],
                  K.peers.rows.map((U) => [
                    U.label,
                    l(U.current),
                    l(U.q25),
                    l(U.median),
                    l(U.q75),
                    String(U.n),
                  ]),
                  [30, 15, 15, 15, 15, 10],
                ),
                c(K.peers.source)),
              K.eligible &&
                K.dividends &&
                (q("Qualidade dos dividendos"),
                K.dividends.checks.length
                  ? g(
                      ["Indicador", "Valor", "Leitura"],
                      K.dividends.checks.map((U) => [
                        U.label,
                        l(U.value) + (U.unit === "%" ? "%" : ""),
                        U.message,
                      ]),
                      [30, 24, 46],
                    )
                  : c(
                      "Payout e demonstrações de caixa insuficientes; sustentabilidade não classificada.",
                    ),
                c(K.dividends.note),
                c(K.dividends.recurring)),
              K.changes?.from &&
                (q("Mudanças entre " + K.changes.from + " e " + K.changes.to),
                g(
                  ["Métrica", "Anterior", "Recente", "Variação"],
                  K.changes.rows.map((U) => [
                    U.label,
                    l(U.before),
                    l(U.after),
                    U.change === null
                      ? U.explanation
                      : l(U.change) + " " + U.unit,
                  ]),
                  [26, 21, 21, 32],
                ),
                c(K.changes.reason)),
              K.eligible && K.valuation)
            ) {
              q("Valuation por premissas pessoais");
              const U = K.valuation;
              (c(
                "Cenários registrados pelo usuário em " +
                  U.at +
                  ". FCFE anual base por ação: " +
                  l(U.input.cash) +
                  ". Horizonte: " +
                  U.input.years +
                  " anos. Não é previsão ou preço-alvo.",
              ),
                g(
                  [
                    "Cenário",
                    "Crescimento %",
                    "Capital próprio %",
                    "Terminal %",
                    "Valor/ação",
                  ],
                  U.result.rows.map((te) => [
                    te.name,
                    l(te.growth),
                    l(te.rate),
                    l(te.terminal),
                    te.result.available ? l(te.result.value) : "Inválido",
                  ]),
                  [24, 19, 19, 19, 19],
                ),
                c(
                  U.result.rows.find((te) => te.result.available)?.result
                    .method || "Verificar premissas.",
                ));
            }
            if (K.notes?.length) {
              q("Linha do tempo da tese");
              for (const U of K.notes)
                (m(U.at + " / " + U.kind, { font: "b", size: 8 }),
                  m(U.text),
                  U.source && c("Fonte informada: " + U.source),
                  c(
                    "Consulta dos indicadores no registro: " +
                      (U.queried || "não carregados"),
                  ));
            }
          }
        }
        function J(_, K, U) {
          const te = G.selected || {},
            ue = [],
            ge =
              te.tipo === "ativo" &&
              String(te.tk || "").toUpperCase() === String(_).toUpperCase()
                ? te.dados?.fundamentos || {}
                : {};
          Array.isArray(ge.balancos_trimestrais_disponiveis) &&
            ue.push({
              rows: ge.balancos_trimestrais_disponiveis,
              moeda: ge.moeda_contabil || U?.financialCurrency,
              origem: "Relatório selecionado (Yahoo Finance)",
            });
          const oe = Array.isArray(te.dados?.balancos_trimestrais_da_fonte)
            ? te.dados.balancos_trimestrais_da_fonte.filter(
                (me) =>
                  String(me?.ticker || "").toUpperCase() ===
                  String(_).toUpperCase(),
              )
            : [];
          for (const me of oe)
            ue.push({
              rows: me.dados_trimestrais || [],
              moeda: me.moeda || U?.financialCurrency,
              origem:
                "Consolidado salvo (" +
                String(me.fonte || "Yahoo Finance") +
                ")",
            });
          const ee = K?.dados?.fundamentos || {};
          Array.isArray(ee.balancos_trimestrais_disponiveis) &&
            ue.push({
              rows: ee.balancos_trimestrais_disponiveis,
              moeda: ee.moeda_contabil || U?.financialCurrency,
              origem: "Relatório individual salvo (Yahoo Finance)",
            });
          const se = (
            Array.isArray(U?.annual) && U.annual.length
              ? U.annual
              : Array.isArray(ee.evolucao_receita_lucro) &&
                  ee.evolucao_receita_lucro.length
                ? ee.evolucao_receita_lucro
                : Array.isArray(ge.evolucao_receita_lucro)
                  ? ge.evolucao_receita_lucro
                  : []
          ).map((me) => ({
            ...me,
            moeda:
              me.moeda ||
              ee.moeda_contabil ||
              ge.moeda_contabil ||
              U?.financialCurrency ||
              oe[0]?.moeda,
            origem: "Histórico anual secundário Yahoo Finance",
          }));
          return s.CarteiraPeriodos.calculate(ue, N.asOf, se);
        }
        const v = (_) =>
            _?.value === null || _?.value === void 0 ? "n/d" : b(_.value),
          I = (_) =>
            _?.value === null || _?.value === void 0
              ? "Não disponível"
              : l(_.value),
          k = s.CarteiraPeriodos.label;
        ((i.pg = u),
          (i.y = 60),
          i.rect(0, 0, i.W, 12, { fill: E.dk }),
          i.t("GESTÃO DE CARTEIRA / FACTSHEET", i.M, i.y, {
            s: 8,
            f: "b",
            c: E.ac,
          }),
          (i.y = 112),
          m(
            `Relatório de Gestão
de Carteira`,
            { size: 29, font: "b", gap: 16 },
          ),
          m(
            (G.demo
              ? "EDIÇÃO DEMONSTRATIVA · DADOS FICTÍCIOS"
              : "Análise de investimentos") +
              " | " +
              N.asOf,
            { size: 12, font: "b" },
          ),
          c(
            "Desempenho, composição, proventos, risco e pesquisa fundamentalista por ativo.",
          ),
          (i.y += 12));
        const L = [
            [
              "VALOR DAS POSIÇÕES",
              N.partial ? "Cobertura parcial" : j(N.total),
            ],
            ["RETORNO NO MÊS", r(N.perf.monthReturn)],
            ["RETORNO NO HISTÓRICO", r(N.perf.return)],
          ],
          d = i.CW / 3;
        (L.forEach(([_, K], U) => {
          (i.rect(i.M + U * d, i.y, d - 5, 66, { fill: E.dk }),
            i.t(_, i.M + U * d + 9, i.y + 12, { s: 6.4, f: "b", c: E.wh }),
            i.t(K, i.M + U * d + 9, i.y + 34, {
              s: 13,
              f: "b",
              c: E.wh,
              w: d - 23,
            }));
        }),
          (i.y += 83),
          N.perf.available
            ? a(
                [
                  {
                    name: "Carteira · base 100",
                    color: "#383b41",
                    points: N.perf.rows.map((_) => ({
                      date: _.date,
                      value: _.index,
                    })),
                  },
                  { name: "IBOV", color: "#17181a", points: N.perf.ib },
                  { name: "CDI", color: "#c0923c", points: N.perf.cdi },
                ],
                "Evolução e referências",
                "Índice de retorno calculado pelo aplicativo, com fluxos e proventos registrados. Séries completas alinhadas às mesmas datas; não é auditoria de rentabilidade.",
              )
            : a(
                [
                  {
                    name: "Valor dos ativos · BRL",
                    color: "#383b41",
                    points: N.wealth,
                  },
                ],
                "Evolução patrimonial",
                N.wealthRecorded
                  ? "Registros diários disponíveis, somente BRL. Mudanças na composição afetam a curva. Não mede rentabilidade."
                  : "Valor dos ativos, sem caixa. Aportes, vendas e câmbio afetam o saldo; não mede rentabilidade.",
              ),
          c(
            G.demo
              ? "DADOS FICTÍCIOS. Material ilustrativo para validar o formato; não representa uma carteira real."
              : "Documento privado. Posições atuais na exportação; análises armazenadas podem ter datas diferentes.",
          ),
          N.perf.available || c(N.perf.reason),
          N.partial &&
            c(
              "Sem preço ou câmbio válido para: " +
                N.missing.join(", ") +
                ". Valores de custo não foram usados como cotação.",
            ));
        const $ = N.positions
            .map((_) => ({
              ticker: _.position.tk,
              classe: _.position.cl || "",
              summary: J(_.position.tk, _.report, _.fundamental),
            }))
            .sort((_, K) => _.ticker.localeCompare(K.ticker)),
          w = $.filter((_) => _.summary.latest),
          b = (_) =>
            typeof _ == "number" && Number.isFinite(_)
              ? Math.abs(_) >= 1e9
                ? (_ / 1e9).toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  }) + " bi"
                : Math.abs(_) >= 1e6
                  ? (_ / 1e6).toLocaleString("pt-BR", {
                      maximumFractionDigits: 2,
                    }) + " mi"
                  : l(_)
              : "sem dado";
        if (
          (H("01  Sumário executivo"),
          m(
            "A carteira reúne " +
              N.positions.length +
              " ativo(s). " +
              (N.partial
                ? "A avaliação de mercado é parcial."
                : "O valor das posições com cotação é " + j(N.total) + ".") +
              " " +
              (N.top3 != null
                ? "As três maiores posições representam " +
                  r(N.top3) +
                  " do valor coberto."
                : ""),
          ),
          q("GUIA RÁPIDO — NÃO CONFUNDIR OS PERÍODOS"),
          g(
            ["Indicador", "O que representa", "Exemplo didático"],
            [
              [
                "Anual fechado",
                "Exercício de 12 meses já encerrado",
                "2025 = jan. a dez./2025",
              ],
              [
                "Trimestre isolado",
                "Receita/lucro de apenas 3 meses",
                "3T26 = jul. a set./2026",
              ],
              [
                "Acumulado (YTD)",
                "Do início do ano até o último trimestre",
                "9M26 = 1T + 2T + 3T",
              ],
              [
                "Últimos 12 meses (TTM)",
                "Quatro trimestres consecutivos",
                "4T25 + 1T26 + 2T26 + 3T26",
              ],
            ],
            [24, 39, 37],
          ),
          c(
            "Atenção: NÃO compare o acumulado de 9 meses com o anual de 12 meses como se fossem a mesma janela. O YTD NÃO é previsão de fechamento; o TTM é histórico móvel, NÃO estimativa para o próximo ano.",
          ),
          q("BALANÇOS — ÚLTIMO TRIMESTRE IDENTIFICADO"),
          w.length)
        ) {
          (g(
            ["Ativo", "Trimestre", "Receita isolada", "Lucro isolado", "Moeda"],
            w
              .slice(0, 16)
              .map((K) => [
                K.ticker,
                k(K.summary.latest.periodo),
                b(K.summary.latest.receita),
                b(K.summary.latest.lucro),
                String(K.summary.moeda || "n/c"),
              ]),
            [15, 19, 26, 25, 15],
          ),
            q("ACUMULADO NO ANO (YTD) E ÚLTIMOS 12 MESES (TTM)"),
            g(
              ["Ativo", "Receita YTD", "Lucro YTD", "Receita TTM", "Lucro TTM"],
              w
                .slice(0, 16)
                .map((K) => [
                  K.ticker,
                  v(K.summary.ytd.receita),
                  v(K.summary.ytd.lucro),
                  v(K.summary.ttm.receita),
                  v(K.summary.ttm.lucro),
                ]),
              [14, 22, 21, 22, 21],
            ),
            c(
              "Cobertura contábil armazenada: " +
                w.length +
                " de " +
                N.positions.length +
                " ativos da carteira têm ao menos um trimestre. Alguns ativos não possuem divulgação trimestral aplicável.",
            ),
            c(
              "YTD = trimestres isolados desde janeiro; TTM = quatro trimestres consecutivos. n/d = período ausente, moeda não confirmada ou valores divergentes. Dados não são interpolados.",
            ),
            c(
              "Fonte: Yahoo Finance (secundária). Encerramento NÃO é divulgação. 4T calculado, quando houver, significa ANUAL menos 9M na mesma moeda; nunca é tratado como publicação oficial. Confira CVM/RI.",
            ));
          const _ = w.filter(
            (K) => K.summary.publicacoesNaoInformadas > 0,
          ).length;
          _ &&
            c(
              "Datas de divulgação não informadas pela fonte secundária em " +
                _ +
                " ativo(s); nenhum desses encerramentos comprova publicação oficial. Valores posteriores à referência são descartados quando uma data de divulgação é fornecida.",
            );
        } else
          c(
            "Nenhum trimestre isolado identificado no relatório salvo. O último anual fechado NÃO comprova a atualização dos balanços de 2026.",
          );
        (N.perf.available
          ? g(
              ["Indicador", "Carteira", "IBOV", "CDI"],
              [
                [
                  "Mês observado",
                  r(N.perf.monthReturn),
                  r(N.perf.monthly.at(-1)?.ib),
                  r(N.perf.monthly.at(-1)?.cdi),
                ],
                [
                  "Histórico completo",
                  r(N.perf.return),
                  r(N.perf.ib.at(-1)?.value - 100),
                  r(N.perf.cdi.at(-1)?.value - 100),
                ],
                [
                  "Janela",
                  N.perf.from + " a " + N.perf.to,
                  "Mesmas datas",
                  "Mesmas datas",
                ],
              ],
              [28, 30, 21, 21],
            )
          : R(
              "Retornos e comparações omitidos: faltam séries completas validadas. O saldo menos o custo não substitui rentabilidade.",
            ),
          n(N.perf.monthly || [], "02  Desempenho por mês", {
            percent: !0,
            benchmark: !0,
          }),
          N.perf.available &&
            c(
              "Primeiro e último mês podem ser parciais. Janela efetivamente observada: " +
                N.perf.from +
                " a " +
                N.perf.to +
                ". Fonte: " +
                N.perf.source +
                ".",
            ),
          h(
            "Leitura da análise consolidada",
            G.selected?.conteudo?.resumo_executivo ||
              G.selected?.conteudo?.conclusao,
          ),
          H(
            "03  Composição e diversificação",
            N.partial
              ? "Pesos relativos somente às posições cobertas; não representam a carteira completa."
              : "Posições atuais na data de exportação; sem reconstrução de composição passada.",
          ),
          f(N.sectors.slice(0, 10), "Alocação por setor", (_, K) =>
            r(K.weight),
          ),
          g(
            ["Ativo", "Classe / setor", "Valor BRL", "Peso coberto"],
            N.positions.map((_) => [
              _.position.tk,
              _.position.setor || _.position.cl || "Não informado",
              j(_.value),
              _.value != null && N.total > 0
                ? r((_.value / N.total) * 100)
                : "Indisponível",
            ]),
            [16, 37, 27, 20],
          ),
          c(
            "Classificações são as cadastradas. Caixa não cadastrado não é presumido como posição de liquidez.",
          ),
          H("04  Resultado e proventos"),
          f(N.perf.contributions || [], "Contribuição financeira no histórico"),
          c(
            "Resultado por ativo da série calculada pelo aplicativo, em BRL, incluindo fluxos e proventos registrados. Não é atribuição percentual oficial nem peso atual multiplicado pelo retorno passado.",
          ));
        for (const _ of ["BRL", "USD"]) {
          const K = Object.entries(N.income.months)
            .filter(([, U]) => U[_] !== 0)
            .map(([U, te]) => ({ date: U, value: te[_] }));
          K.length &&
            (n(K, "Proventos recebidos · " + _),
            g(
              ["Mês", "Recebido (" + _ + ")"],
              K.slice(-12).map((U) => [U.date, l(U.value)]),
              [40, 60],
            ));
        }
        if (
          (N.income.events.length ||
            R(
              "Sem proventos lançados. Cadastre dividendos, JCP e rendimentos efetivamente recebidos.",
            ),
          H("05  Risco, governança e cenários"),
          G.selected?.tipo !== "ativo" && G.exposure)
        ) {
          const _ = G.exposure;
          (q("Exposição direta e composição informada"),
            g(
              ["Setor ou cobertura", "Valor BRL", "Peso coberto"],
              _.sectors.map((K) => [K.name, j(K.value), r(K.weight)]),
              [48, 27, 25],
            ),
            _.themes.length &&
              g(
                ["Tema pessoal", "Ativos marcados", "Peso das posições"],
                _.themes.map((K) => [
                  K.name,
                  K.tickers.join(", "),
                  r(K.weight),
                ]),
                [35, 40, 25],
              ),
            c(_.method),
            c(
              "Composição interna detalhada: " +
                j(_.detailed) +
                ". Sem preço: " +
                (_.missing.join(", ") || "nenhum ativo") +
                ".",
            ));
        }
        (g(
          ["Métrica", "Valor", "Base de cálculo"],
          [
            [
              "Volatilidade anualizada",
              r(N.perf.vol),
              N.perf.n >= 20
                ? N.perf.n + " intervalos diários"
                : "Exige ao menos 20 intervalos",
            ],
            [
              "Drawdown do índice de retorno",
              r(N.perf.drawdown),
              "Queda desde o pico do histórico validado",
            ],
            [
              "Tracking error frente ao IBOV",
              r(N.perf.tracking),
              "Diferenças diárias, anualização por 252",
            ],
            [
              "Maior posição",
              N.largest || "Não disponível",
              r(N.largestWeight) + " do valor coberto",
            ],
            [
              "Três maiores posições",
              r(N.top3),
              "Composição atual, não histórica",
            ],
          ],
          [40, 25, 35],
        ),
          h("Riscos apresentados pela IA", G.selected?.conteudo?.riscos),
          h("Cenários condicionais e acompanhamento", {
            hipoteses: G.selected?.conteudo?.hipoteses,
            monitorar: G.selected?.conteudo?.monitorar,
          }));
        const y =
          G.selected?.tipo === "ativo" ? {} : G.selected?.conteudo || {};
        for (const [_, K] of Object.entries(y))
          [
            "resumo_executivo",
            "conclusao",
            "riscos",
            "hipoteses",
            "monitorar",
            "identificacao",
          ].includes(_) ||
            h(
              _.replace(/_/g, " ").replace(/^./, (U) => U.toUpperCase()),
              K,
            );
        const C = (() => {
            const _ = Number(N.asOf.slice(0, 4)),
              K = Number(N.asOf.slice(5, 7)),
              U = Math.floor((K - 1) / 3);
            return U
              ? _ + "-" + ["03-31", "06-30", "09-30", "12-31"][U - 1]
              : _ - 1 + "-12-31";
          })(),
          V = {
            total: $.length,
            withQuarter: w.length,
            current: w.filter((_) => _.summary.latest.periodo >= C).length,
            unverified: w.filter((_) => _.summary.publicacoesNaoInformadas > 0)
              .length,
          };
        (H(
          "06  Auditoria e cobertura dos balanços",
          "Mapa de cobertura na fonte secundária · " + N.asOf,
        ),
          q("MAPA DE COBERTURA DO TRIMESTRE ENCERRADO"),
          c(
            "Último trimestre calendário encerrado até a referência: " +
              k(C) +
              ". A empresa pode ainda não ter divulgado o resultado. O aplicativo não infere publicação a partir da data de encerramento.",
          ),
          $.length
            ? (g(
                [
                  "Ativo",
                  "Último trimestre salvo",
                  "Moeda",
                  "Divulgação",
                  "Situação",
                ],
                $.map((_) => {
                  const K = _.summary,
                    U = K.latest;
                  return [
                    _.ticker,
                    U ? k(U.periodo) : "sem trimestre",
                    K.moeda || "n/c",
                    (U && U.divulgadoEm) || "não informada",
                    U
                      ? U.periodo >= C
                        ? "trimestre registrado"
                        : "aguardando coleta / publicação"
                      : "sem dados na fonte",
                  ];
                }),
                [16, 25, 12, 23, 24],
              ),
              c(
                "Cobertura: " +
                  V.withQuarter +
                  "/" +
                  V.total +
                  " ativos com algum trimestre; " +
                  V.current +
                  " com " +
                  k(C) +
                  " ou posterior; " +
                  V.unverified +
                  " com datas de divulgação ausentes em parte do histórico.",
              ),
              c(
                "Situação “aguardando coleta / publicação” NÃO afirma que a empresa esteja atrasada: pode ser ausência da captura Yahoo Finance, empresa sem divulgação aplicável ou demonstração ainda não apresentada. Verifique RI/CVM.",
              ))
            : R("Nenhuma posição disponível para auditar nesta exportação."));
        for (const _ of N.positions) {
          const K = _.position,
            U = _.report,
            te = {
              ..._.meta,
              fs: { ...(_.meta?.fs || {}), ...(U?.dados?.fundamentos || {}) },
            },
            ue = F.detail(K, G.ledger || [], N.asOf);
          H(
            K.tk + "  |  Pesquisa do ativo",
            (K.nome || _.meta?.nome || "") +
              " · " +
              (K.cl || "Classe não informada") +
              " · " +
              (K.moeda || ue.unit),
            !0,
          );
          const ge = B.get(String(K.tk || "").toUpperCase()),
            oe = Y.get(String(K.tk || "").toUpperCase());
          (oe
            ? (i.pg.drawImage(oe[0], {
                x: i.W - i.M - 41,
                y: i.H - 130,
                width: 25,
                height: 25,
              }),
              i.pg.drawImage(oe[1], {
                x: i.W - i.M - 25,
                y: i.H - 130,
                width: 25,
                height: 25,
              }))
            : ge &&
              i.pg.drawImage(ge, {
                x: i.W - i.M - 28,
                y: i.H - 130,
                width: 25,
                height: 25,
              }),
            g(
              ["Posição", "Valor", "Fundamento", "Indicador"],
              Array.from(
                {
                  length: Math.max(
                    6,
                    s.TraderReports.fundamentalRows(K, te).length,
                  ),
                },
                (Se, Re) => {
                  const Pe = [
                      ["Quantidade", l(K.q, 4)],
                      ["Cotação", K.tem ? l(K.pa) : "Sem cotação"],
                      ["Preço médio", l(K.pm, 4)],
                      ["Valor BRL", j(_.value)],
                      ["Proventos do ciclo", l(ue.income) + " " + ue.unit],
                      [
                        "Peso coberto",
                        _.value != null && N.total > 0
                          ? r((_.value / N.total) * 100)
                          : "Indisponível",
                      ],
                    ][Re] || ["", ""],
                    je = s.TraderReports.fundamentalRows(K, te)[Re] || ["", ""];
                  return [...Pe, ...je];
                },
              ),
              [24, 23, 30, 23],
            ));
          const ee = U?.dados?.fundamentos,
            ae = J(K.tk, U, _.fundamental),
            se = ae.quarters,
            me =
              ae.latest?.periodo ||
              ee?.data_ultimo_trimestre_na_fonte ||
              te.fs.ref ||
              te.fs.data_referencia ||
              "não confirmada";
          if (
            (c(
              "Cotação: " +
                (K.pxEm || "sem data") +
                ". Referência contábil da fonte: " +
                me +
                ". Proventos do ciclo desde " +
                (ue.cycleStart || "não identificado") +
                ". Preço médio é cadastral; ajustes por renda são gerenciais.",
            ),
            K.cl === "acao" || K.cl === "bdr" || K.cl === "acao_ext")
          )
            if ((q("Resultados trimestrais disponíveis"), se.length)) {
              const Se = ae.moeda || "moeda contábil não confirmada";
              (g(
                [
                  "Trimestre",
                  "Encerramento",
                  "Receita isolada",
                  "Lucro isolado",
                  "Moeda",
                ],
                se.map(($e) => [
                  k($e.periodo),
                  String($e.periodo),
                  l($e.receita),
                  l($e.lucro),
                  String($e.moeda || Se),
                ]),
                [15, 19, 25, 26, 15],
              ),
                c(
                  "Trimestre isolado = APENAS três meses. 3T26 é julho a setembro, não janeiro a setembro. Fonte identificada no campo de rastreabilidade; data do encerramento NÃO indica publicação oficial. Verifique no RI/CVM.",
                ));
              const Re = ae.latest;
              (c(
                "RASTREABILIDADE DO ÚLTIMO TRIMESTRE — Receita: " +
                  String(Re.origens.receita || "n/d") +
                  "; lucro: " +
                  String(Re.origens.lucro || "n/d") +
                  "; divulgação: " +
                  (Re.divulgadoEm || "não informada") +
                  ". Duas capturas da mesma fonte não significam auditoria independente.",
              ),
                ae.derived.length &&
                  c(
                    "ATENÇÃO — 4T calculado por diferença, não divulgado isoladamente: " +
                      ae.derived
                        .map(($e) => k($e.periodo) + " (" + $e.campo + ")")
                        .join(", ") +
                      ". Fórmula: anual menos (1T + 2T + 3T), na mesma moeda. Conferir nas demonstrações oficiais.",
                  ),
                ae.conflicts.length &&
                  c(
                    "DIVERGÊNCIA ENTRE FONTES — números conflitantes foram omitidos: " +
                      ae.conflicts
                        .map(($e) => k($e.periodo) + " (" + $e.campo + ")")
                        .join(", ") +
                      ". Conferir CVM/RI; não usar estes valores em YTD/TTM.",
                  ),
                ae.annualConflicts.length &&
                  c(
                    "DIVERGÊNCIA EM DADOS ANUAIS — não foi calculado 4T para os indicadores conflitantes: " +
                      ae.annualConflicts
                        .map(($e) => k($e.periodo) + " (" + $e.campo + ")")
                        .join(", ") +
                      ".",
                  ),
                ae.reconciliations.length &&
                  c(
                    "DIVERGÊNCIA ENTRE ANUAL E QUATRO TRIMESTRES — conferir consolidação, unidades e demonstrações CVM/RI: " +
                      ae.reconciliations
                        .map(($e) => k($e.periodo) + " (" + $e.campo + ")")
                        .join(", ") +
                      ". O valor original foi preservado na fonte histórica, mas o campo divergente NÃO entra no YTD/TTM até conferência.",
                  ),
                ae.publicacoesNaoInformadas &&
                  c(
                    "DATAS DE DIVULGAÇÃO — " +
                      ae.publicacoesNaoInformadas +
                      " de " +
                      se.length +
                      " trimestres não possuem data de publicação verificável nesta fonte; o encerramento do período não comprova divulgação.",
                  ));
              const Pe = (() => {
                const $e = Number(N.asOf.slice(0, 4)),
                  Ye = Number(N.asOf.slice(5, 7)),
                  Xe = Math.floor((Ye - 1) / 3);
                return Xe
                  ? $e + "-" + ["03-31", "06-30", "09-30", "12-31"][Xe - 1]
                  : $e - 1 + "-12-31";
              })();
              (ae.latest.periodo < Pe &&
                c(
                  "LACUNA DE COBERTURA — o último trimestre registrado (" +
                    k(ae.latest.periodo) +
                    ") é anterior ao trimestre calendário encerrado (" +
                    k(Pe) +
                    "). O balanço pode ainda não ter sido divulgado ou a fonte secundária pode não estar atualizada.",
                ),
                q("TRÊS VISÕES DOS RESULTADOS"),
                g(
                  ["Janela", "Receita", "Lucro líquido", "O que significa"],
                  [
                    [
                      k(ae.latest.periodo),
                      l(ae.latest.receita),
                      l(ae.latest.lucro),
                      "Trimestre isolado (3 meses)",
                    ],
                    [
                      "Acumulado YTD",
                      I(ae.ytd.receita),
                      I(ae.ytd.lucro),
                      "Jan. a " + k(ae.latest.periodo),
                    ],
                    [
                      "TTM · 12 meses",
                      I(ae.ttm.receita),
                      I(ae.ttm.lucro),
                      "Quatro trimestres consecutivos",
                    ],
                  ],
                  [22, 25, 25, 28],
                ));
              const je = ($e, Ye) => {
                const Xe = ["receita", "lucro"]
                  .filter((_e) => Ye[_e].value == null)
                  .map((_e) => _e + ": " + (Ye[_e].reason || "não disponível"));
                Xe.length &&
                  c(
                    $e +
                      " não calculado totalmente: " +
                      Xe.join(" | ") +
                      ". Não foram estimados períodos ausentes.",
                  );
              };
              (c(
                "YTD = soma dos trimestres isolados desde janeiro até " +
                  k(ae.latest.periodo) +
                  ". TTM = soma de " +
                  ae.ttm.periodos.map(k).join(" + ") +
                  ". Não são a mesma base: não compare diretamente 9 meses de YTD com 12 meses do anual ou TTM.",
              ),
                je("Acumulado YTD", ae.ytd),
                je("TTM", ae.ttm),
                ae.rejected.length &&
                  c(
                    "REGISTROS NÃO UTILIZADOS — motivo por período: " +
                      ae.rejected
                        .map(($e) => k($e.periodo) + " (" + $e.motivo + ")")
                        .join(", ") +
                      ". Data explícita inválida é bloqueada, não interpretada como divulgação conhecida; não foram presumidas moedas nem datas de publicação.",
                  ));
              const Ue = { p: i, heading: ($e) => q($e), text: ($e) => c($e) },
                Fe = [...se].reverse();
              (Fe.some(($e) => Number.isFinite($e.receita)) &&
                s.TraderReports.researchChart(
                  Ue,
                  Fe.map(($e) => ({ date: k($e.periodo), value: $e.receita })),
                  "Receita TRIMESTRAL · somente 3 meses",
                  Se,
                  "bar",
                ),
                Fe.some(($e) => Number.isFinite($e.lucro)) &&
                  s.TraderReports.researchChart(
                    Ue,
                    Fe.map(($e) => ({ date: k($e.periodo), value: $e.lucro })),
                    "Lucro líquido TRIMESTRAL · somente 3 meses",
                    Se,
                    "bar",
                  ));
            } else
              c(
                "Série trimestral ainda não identificada neste relatório salvo. Os exercícios anuais NÃO comprovam a atualização dos balanços de 2026. Gere novo relatório depois da atualização do servidor e confira o RI da empresa.",
              );
          const ve = _.fundamental?.annual?.length
            ? _.fundamental.annual.map((Se) => ({
                ano: Se.date,
                receita: Se.revenue,
                lucro: Se.profit,
              }))
            : Array.isArray(ee?.evolucao_receita_lucro)
              ? ee.evolucao_receita_lucro
              : [];
          if (
            (ve.length &&
              (q("ANUAL FECHADO · 12 MESES (HISTÓRICO)"),
              g(
                ["Ano", "Receita", "Lucro líquido"],
                ve.map((Se) => [String(Se.ano), l(Se.receita), l(Se.lucro)]),
                [20, 40, 40],
              ),
              c(
                "Anual = exercício completo da companhia, geralmente janeiro a dezembro quando o ano fiscal coincide com o calendário. Não é YTD parcial nem projeção. Verifique a data de encerramento fiscal no RI/CVM. Moeda contábil: " +
                  (_.fundamental?.financialCurrency ||
                    ee?.moeda_contabil ||
                    "não confirmada") +
                  ".",
              )),
            _.fundamental?.annual?.length)
          ) {
            const Se = _.fundamental.annual,
              Re = { p: i, heading: (Pe) => q(Pe), text: (Pe) => c(Pe) };
            (s.TraderReports.researchChart(
              Re,
              Se.map((Pe) => ({ date: Pe.date, value: Pe.revenue })),
              "Receita ANUAL · 12 meses fechados",
              _.fundamental.financialCurrency ||
                "Moeda contábil não confirmada",
              "bar",
            ),
              s.TraderReports.researchChart(
                Re,
                Se.map((Pe) => ({ date: Pe.date, value: Pe.profit })),
                "Lucro líquido ANUAL · 12 meses fechados",
                _.fundamental.financialCurrency ||
                  "Moeda contábil não confirmada",
                "bar",
              ),
              c(
                "Histórico das fontes de fundamentos do terminal. Consulta: " +
                  (_.fundamental.queried || "não informada") +
                  ". Períodos anuais, sem projeções.",
              ));
          }
          Q(_);
          const Me = s.TraderReports.study(_.technical?.L || []);
          Me.available &&
            (q("Leitura técnica · dados em " + Me.to),
            g(
              [
                "Fechamento",
                "MM20",
                "MM50",
                "MM200",
                "Suporte 20d",
                "Resistência 20d",
              ],
              [
                [
                  l(Me.last.c),
                  l(Me.m20),
                  l(Me.m50),
                  l(Me.m200),
                  l(Me.support),
                  l(Me.resistance),
                ],
              ],
              [17, 16, 16, 16, 17, 18],
            ),
            c(
              "Médias simples dos fechamentos e extremos das 20 sessões anteriores. Níveis mecânicos, sem probabilidade ou recomendação. Não há gráfico de candles neste documento.",
            ));
          const xe = U?.conteudo || {};
          (h("Análise fundamentalista", {
            analise_fundamentalista: xe.analise_fundamentalista,
            fundamentalista: xe.fundamentalista,
            fatos: xe.fatos,
          }),
            h("Tese e interpretação", xe.interpretacoes),
            h("Riscos e cenário", {
              riscos: xe.riscos,
              hipoteses: xe.hipoteses,
            }),
            h("Análise técnica e pontos de acompanhamento", {
              analise_tecnica: xe.analise_tecnica,
              monitorar: xe.monitorar,
            }));
          const Ae = new Set([
            "identificacao",
            "analise_fundamentalista",
            "fundamentalista",
            "fatos",
            "interpretacoes",
            "riscos",
            "hipoteses",
            "analise_tecnica",
            "monitorar",
          ]);
          for (const [Se, Re] of Object.entries(xe))
            Ae.has(Se) ||
              h(
                Se.replace(/_/g, " ").replace(/^./, (Pe) => Pe.toUpperCase()),
                Re,
              );
          (U ||
            R(
              "Análise individual ainda não registrada. Os indicadores disponíveis foram apresentados; nenhuma tese foi criada durante a exportação.",
            ),
            c(
              "Análise: " +
                (U?.ref || "não registrada") +
                " · dados até " +
                (U?.dados_em || "não informado") +
                ". Fontes: " +
                (U?.fontes || []).join(" · "),
            ));
        }
        if ((H("06  Metodologia e cobertura"), s.CarteiraCalculo)) {
          const _ = s.CarteiraCalculo.audit(G.ledger || [], N.asOf);
          (q("Conferência dos lançamentos"),
            m(
              _.issues.length
                ? _.issues.length +
                    " pendência(s) nos registros. Confira os itens abaixo antes de interpretar resultados."
                : "Nenhuma inconsistência detectada pelas regras aritméticas desta conferência. Não equivale a auditoria fiscal ou conferência com extratos.",
            ),
            _.issues.length &&
              g(
                ["Data", "Ativo", "Conferir"],
                _.issues.map((K) => [K.date, K.ticker, K.message]),
                [18, 18, 64],
              ));
        }
        (m(
          "Posições e movimentações vêm do cadastro da carteira. Valores em USD só são consolidados com câmbio válido. Indicadores e narrativas são os disponíveis no cache e nas análises armazenadas. Exportar não gera uma nova análise paga.",
        ),
          q("Conceitos dos indicadores financeiros"),
          m(
            "ANUAL FECHADO: janeiro a dezembro de um exercício completo. TRIMESTRE ISOLADO: apenas três meses. YTD: soma do 1T ao trimestre mais recente do mesmo ano (por exemplo, 9 meses até o 3T). TTM: soma dos últimos quatro trimestres consecutivos, mesmo que cruzem dois anos.",
          ),
          m(
            "O aplicativo calcula YTD e TTM somente com todas as parcelas trimestrais individuais e a moeda identificada, sem extrapolações. Se faltar 4T anterior, por exemplo, o TTM é omitido. Os números vêm de fonte secundária, sem conferência automática com a publicação da empresa; 31/03, 30/06, 30/09 e 31/12 representam encerramento, não data de divulgação.",
          ),
          m(
            "Receita e lucro são fluxos do período e podem ser somados entre trimestres comparáveis. Estoques de balanço como caixa, dívida ou patrimônio líquido NÃO devem ser somados, por serem saldos de uma data. Empresas com calendário fiscal não coincidente ou fontes com moedas diferentes exigem tratamento específico.",
          ),
          m(
            "Retornos, volatilidade, drawdown e tracking error exigem histórico completo validado. As séries de referência são alinhadas à mesma janela. A qualidade depende das movimentações, preços e proventos informados. Dados ausentes não são zero e o custo não é usado como preço histórico.",
          ),
          m(
            "A curva de registros diários é mostrada apenas quando aplicável e identificada como patrimônio, nunca como rentabilidade. Ausência de proventos lançados não demonstra ausência de dividendos recebidos. Indicadores de ações não são aplicados automaticamente a outras classes.",
          ),
          g(
            ["Ativo", "Cotação", "Fundamentos", "Análise IA"],
            N.positions.map((_) => [
              _.position.tk,
              _.position.tem ? "Disponível" : "Ausente",
              _.meta?.fs ? "Parcial / verificar data" : "Não disponível",
              _.report ? "Registrada" : "Não registrada",
            ]),
            [20, 23, 31, 26],
          ),
          c(
            "Documento de acompanhamento pessoal. A IA pode conter erros e suas afirmações não equivalem a fatos auditados. Conferir fontes, datas e premissas antes de qualquer decisão.",
          ));
        const X = i.doc.getPages();
        for (let _ = 0; _ < X.length; _++)
          ((i.pg = X[_]),
            i.ln(i.M, i.H - 42, i.W - i.M, i.H - 42, { c: E.bd, w: 0.6 }),
            i.t(
              G.demo
                ? "DEMONSTRAÇÃO / DADOS FICTÍCIOS"
                : "PRIVADO / DIÁRIO DE TRADER",
              i.M,
              i.H - 29,
              { s: 6.6, c: E.mut },
            ),
            i.t(_ + 1 + " / " + X.length, i.W - i.M, i.H - 29, {
              s: 7,
              c: E.mut,
              al: "r",
            }));
        return i.doc.save();
      }
      s.CarteiraFactsheet = { pdf: O };
    })(typeof window > "u" ? globalThis : window),
    (() => {
      "use strict";
      const s = (g) => esc(String(g ?? "")),
        l = (g, R = 2) =>
          typeof g == "number" && Number.isFinite(g)
            ? g.toLocaleString("pt-BR", {
                maximumFractionDigits: R,
                minimumFractionDigits: R,
              })
            : "Não disponível",
        r = (g, R) => {
          for (const a of R) if (g?.[a] != null && g[a] !== "") return g[a];
          return null;
        },
        j = {
          fatos: "Fatos apresentados na análise",
          interpretacoes: "Interpretações do modelo",
          hipoteses: "Hipóteses condicionais",
          riscos: "Riscos",
          conclusao: "Conclusão analítica",
          monitorar: "Pontos de acompanhamento",
          analise_tecnica: "Análise técnica",
          analise_fundamentalista: "Análise fundamentalista",
          resumo_executivo: "Resumo executivo",
          desempenho: "Desempenho",
          distribuicao: "Distribuição",
          concentracao: "Concentração",
          mudancas: "Mudanças desde a análise anterior",
        },
        O = (g) =>
          j[g] ||
          String(g)
            .replace(/_/g, " ")
            .replace(/^./, (R) => R.toUpperCase());
      let G = !1,
        o = !1;
      function F(g) {
        return (g || [])
          .filter(
            (R) =>
              Array.isArray(R) &&
              R.length >= 5 &&
              Number.isFinite(R[0]) &&
              Number.isFinite(new Date(R[0] * 1e3).getTime()) &&
              R[2] >= R[3] &&
              R.slice(1, 5).every(
                (a) => typeof a == "number" && Number.isFinite(a) && a > 0,
              ),
          )
          .map((R) => ({ t: R[0], o: R[1], h: R[2], l: R[3], c: R[4] }))
          .sort((R, a) => R.t - a.t);
      }
      function N(g) {
        const R = F(g);
        if (R.length < 30)
          return {
            available: !1,
            reason: "Menos de 30 candles diários válidos no cache.",
          };
        const a = R.map((Q) => Q.c),
          n = R.at(-1),
          f = R.slice(-21, -1),
          h = (Q) =>
            a.length >= Q ? a.slice(-Q).reduce((J, v) => J + v, 0) / Q : null;
        return {
          available: !0,
          bars: R,
          last: n,
          from: new Date(R[0].t * 1e3).toISOString().slice(0, 10),
          to: new Date(n.t * 1e3).toISOString().slice(0, 10),
          m20: h(20),
          m50: h(50),
          m200: h(200),
          support: Math.min(...f.map((Q) => Q.l)),
          resistance: Math.max(...f.map((Q) => Q.h)),
        };
      }
      function e(g) {
        const R = new Map();
        for (const a of F(g)) {
          const n = new Date(a.t * 1e3),
            f = (n.getUTCDay() + 6) % 7;
          n.setUTCDate(n.getUTCDate() - f);
          const h = n.toISOString().slice(0, 10),
            Q = R.get(h);
          Q
            ? ((Q[2] = Math.max(Q[2], a.h)),
              (Q[3] = Math.min(Q[3], a.l)),
              (Q[4] = a.c))
            : R.set(h, [a.t, a.o, a.h, a.l, a.c]);
        }
        return [...R.values()];
      }
      async function i(g, R, a) {
        const n = await rpLib(),
          f = await rpNovo(n, {
            titulo: g,
            cabecalho: g,
            tipo: "Pesquisa e acompanhamento",
            data: a || new Date().toLocaleDateString("pt-BR"),
          }),
          h = { p: f, lib: n };
        ((h.text = (J, v = {}) => {
          if (J == null || J === "") return;
          const I = v.size || 9.4,
            k = v.font || "r",
            L = I * 1.48;
          for (const d of f.wrap(String(J), f.CW, I, k))
            (f.need(L + 3),
              f.t(d, f.M, f.y, { s: I, f: k, c: v.color || f.C.tx }),
              (f.y += L));
          f.y += 5;
        }),
          (h.heading = (J, v = "") => {
            const I = f.F.serif ? "serif" : "b",
              k = f.wrap(String(J), f.CW, 14, I);
            (f.need(k.length * 20 + 65), (f.y += 6));
            for (const L of k)
              (f.t(L, f.M, f.y, { s: 14, f: I, c: f.C.dk }), (f.y += 20));
            v && h.text(v, { size: 8.5, color: f.C.mut });
          }),
          (h.table = (J, v) => {
            v.length &&
              f.tab(
                J.map(([I, k, L]) => ({ l: I, w: k, al: L })),
                v,
                { s: 8.3 },
              );
          }),
          (h.section = (J, v, I = 0) => {
            if (!(v == null || v === "" || (Array.isArray(v) && !v.length))) {
              if (I > 5) {
                h.text(JSON.stringify(v));
                return;
              }
              if ((h.heading(O(J)), Array.isArray(v)))
                v.forEach((k) =>
                  typeof k == "object"
                    ? Object.entries(k).forEach(([L, d]) =>
                        h.text(
                          `${O(L)}: ${typeof d == "object" ? JSON.stringify(d) : d}`,
                        ),
                      )
                    : h.text("• " + k),
                );
              else if (typeof v == "object")
                for (const [k, L] of Object.entries(v))
                  L && typeof L == "object"
                    ? h.section(k, L, I + 1)
                    : L != null && h.text(`${O(k)}: ${L}`);
              else h.text(v);
            }
          }),
          f.rect(0, 0, f.W, 128, { fill: f.C.dk }));
        try {
          if (
            /revista|jornal|giro/i.test(String(g)) &&
            typeof fetch == "function"
          ) {
            const J = await fetch("editorial-mercado-v379.jpg?v=379");
            if (J.ok) {
              const v = await f.doc.embedJpg(await J.arrayBuffer());
              f.pg.drawImage(v, {
                x: f.W * 0.46,
                y: f.H - 128,
                width: f.W * 0.54,
                height: 128,
                opacity: 0.62,
              });
            }
          }
        } catch {}
        return (
          f.t("DIÁRIO DE TRADER · PESQUISA", f.M, 25, {
            s: 9,
            f: "b",
            c: f.C.li,
          }),
          f
            .wrap(g, f.CW, 27, f.F.serif ? "serif" : "b")
            .slice(0, 2)
            .forEach((J, v) =>
              f.t(J, f.M, 48 + v * 30, {
                s: 27,
                f: f.F.serif ? "serif" : "b",
                c: f.C.wh,
              }),
            ),
          (f.y = 146),
          h.text(R, { size: 10, color: f.C.mut }),
          h.text(
            "Gerado em " +
              new Date().toLocaleString("pt-BR") +
              " · referência: " +
              (a || "não informada"),
            { size: 8, color: f.C.mut },
          ),
          (h.finish = async () => {
            const J = f.doc.getPages();
            return (
              J.forEach((v, I) => {
                ((f.pg = v),
                  f.ln(f.M, f.H - 42, f.W - f.M, f.H - 42, {
                    c: f.C.bd,
                    w: 0.5,
                  }),
                  f.t(
                    "Privado · Dados de terceiros e análise de IA podem conter erros. Confira fontes e referências.",
                    f.M,
                    f.H - 32,
                    { s: 6.5, c: f.C.mut, w: f.CW - 75 },
                  ),
                  f.t(`${I + 1} / ${J.length}`, f.W - f.M, f.H - 32, {
                    s: 7,
                    f: "b",
                    c: f.C.mut,
                    al: "r",
                  }));
              }),
              f.doc.save()
            );
          }),
          h
        );
      }
      function B(g, R, a, n = "BRL", f = "line") {
        const h = g.p,
          Q = (R || []).filter(
            (C) => typeof C.value == "number" && Number.isFinite(C.value),
          );
        if (!Q.length) {
          (g.heading(a),
            g.text(
              "Sem dados registrados suficientes. Nenhum valor foi estimado.",
            ));
          return;
        }
        (h.need(245), g.heading(a));
        const J = 152,
          v = 58,
          I = h.CW - v - 8,
          k = h.M + v,
          L = h.y,
          d = Math.min(0, ...Q.map((C) => C.value)),
          $ = Math.max(0, ...Q.map((C) => C.value)),
          w = $ - d || 1,
          b = (C) => L + 8 + (($ - C) / w) * (J - 32),
          y = (C) => k + (Q.length === 1 ? I / 2 : (I * C) / (Q.length - 1));
        for (let C = 0; C < 4; C++) {
          const V = d + (w * C) / 3;
          (h.ln(k, b(V), k + I, b(V), { c: h.C.bd, w: 0.5 }),
            h.t(l(V, 0), k - 7, b(V) - 3, { s: 6.8, al: "r", c: h.C.mut }));
        }
        if (f === "bar") {
          const C = I / Q.length;
          Q.forEach((V, X) =>
            h.rect(
              k + X * C + C * 0.15,
              Math.min(b(V.value), b(0)),
              C * 0.7,
              Math.max(0.7, Math.abs(b(V.value) - b(0))),
              { fill: V.value < 0 ? h.C.r : h.C.ac },
            ),
          );
        } else
          for (let C = 1; C < Q.length; C++)
            h.ln(y(C - 1), b(Q[C - 1].value), y(C), b(Q[C].value), {
              c: h.C.ac,
              w: 1.8,
            });
        (h.t(Q[0].date, k, L + J - 12, { s: 7, c: h.C.mut }),
          h.t(Q.at(-1).date, k + I, L + J - 12, { s: 7, c: h.C.mut, al: "r" }),
          (h.y += J + 4),
          g.text(
            n +
              " · " +
              (f === "bar"
                ? "valores registrados por período"
                : "valor dos ativos, sem caixa; não é rentabilidade"),
            { size: 7.5, color: h.C.mut },
          ));
      }
      function Y(g, R, a, n = 172) {
        const f = g.p,
          h = F(R).slice(-50);
        if ((f.need(n + 82), g.heading(a), h.length < 5)) {
          g.text(
            "Sem série suficiente para exibir um gráfico. Nenhum traçado ilustrativo foi usado como dado.",
          );
          return;
        }
        f.need(n + 30);
        const Q = f.M,
          J = f.y,
          v = f.CW,
          I = 52,
          k = 8,
          L = 25,
          d = Math.min(...h.map((V) => V.l)),
          $ = Math.max(...h.map((V) => V.h)),
          w = $ - d || 1,
          b = (v - I - 8) / h.length,
          y = (V) => J + k + (($ - V) / w) * (n - k - L);
        for (let V = 0; V < 4; V++) {
          const X = d + (w * V) / 3;
          (f.ln(Q, y(X), Q + v - I, y(X), { c: f.C.bd, w: 0.4 }),
            f.t(l(X), Q + v - I + 5, y(X) - 3, {
              s: 6.8,
              c: f.C.mut,
              w: I - 6,
            }));
        }
        h.forEach((V, X) => {
          const _ = Q + b * (X + 0.5),
            K = V.c >= V.o ? f.C.g : f.C.r;
          (f.ln(_, y(V.h), _, y(V.l), { c: K, w: 0.7 }),
            f.rect(
              _ - b * 0.28,
              Math.min(y(V.o), y(V.c)),
              Math.max(0.7, b * 0.56),
              Math.max(0.8, Math.abs(y(V.o) - y(V.c))),
              { fill: K },
            ));
        });
        const C = (V) => new Date(V.t * 1e3).toISOString().slice(0, 10);
        (f.t(C(h[0]), Q, J + n - 14, { s: 7, c: f.C.mut }),
          f.t(C(h.at(-1)), Q + v - I, J + n - 14, {
            s: 7,
            c: f.C.mut,
            al: "r",
          }),
          (f.y = J + n + 8));
      }
      function z(g, R) {
        const a = R?.fs || {},
          n = [
            ["P/L", ["pl"]],
            ["P/VP", ["pvp", "p_vp"]],
            ["Dividend yield (%)", ["dy", "dividend_yield_pct"]],
            ["ROE (%)", ["roe", "roe_pct"]],
            ["ROIC (%)", ["roic"]],
            [
              "Margem líquida (%)",
              [
                "margem_liquida_pct",
                "ml",
                "margem_liquida",
                "margemLiquida",
                "mliq",
              ],
            ],
            [
              "Margem EBITDA (%)",
              ["margem_ebitda_pct", "margem_ebitda", "margemEbitda", "mebitda"],
            ],
            ["EV/EBITDA", ["evebitda", "ev_ebitda", "evEbitda"]],
            [
              "Dívida líquida / EBITDA",
              [
                "div_liq_ebitda",
                "dl_ebitda",
                "dividaLiquidaEbitda",
                "divliq_ebitda",
              ],
            ],
            [
              "Crescimento de receita (%)",
              [
                "crescimento_receita_pct",
                "cr",
                "cagr_receita",
                "cagrReceita",
                "crescimento_receita",
              ],
            ],
          ];
        return g.cl === "fii"
          ? [
              ["P/VP", l(r(a, ["pvp", "p_vp"]))],
              ["Dividend yield (%)", l(r(a, ["dy", "dividend_yield_pct"]))],
              ["Vacância (%)", l(r(a, ["vacancia"]))],
              ["FFO / cota", l(r(a, ["ffo_cota", "ffo"]))],
              ["Rendimento / cota", l(r(a, ["rendimento_cota"]))],
            ]
          : ["etf", "etf_ext"].includes(g.cl)
            ? [
                [
                  "Índice de referência",
                  String(r(a, ["benchmark", "indice"]) || "Não disponível"),
                ],
                [
                  "Taxa de administração (%)",
                  l(r(a, ["taxa_administracao", "expenseRatio"])),
                ],
                ["Patrimônio do fundo", l(r(a, ["patrimonio", "totalAssets"]))],
                ["Tracking error (%)", l(r(a, ["trackingError"]))],
              ]
            : ["rf", "tesouro", "outro"].includes(g.cl)
              ? [
                  [
                    "Critérios de ações",
                    "Não se aplicam automaticamente a esta classe.",
                  ],
                  [
                    "Indexador, vencimento e risco do emissor",
                    "Consultar o cadastro e o documento do título.",
                  ],
                ]
              : n.map(([f, h]) => [f, l(r(a, h))]);
      }
      function M() {
        const g = window.PF || {},
          R = (g.rel || []).find((J) => String(J.id) === String(g.rv)),
          a = typeof pfCalc == "function" ? pfCalc() : { pos: [] },
          n = window.PFX?.META?.() || {},
          h = (
            R?.tipo === "ativo" ? a.pos.filter((J) => J.tk === R.tk) : a.pos
          ).map((J) => {
            let v;
            try {
              v = pfTec(J);
            } catch {}
            const I = n[J.tk] || {},
              k = window.TerminalResearchModel?.fundamental(
                J.tk,
                window.TRM?.trGet("fund", { tk: J.tk })?.v || {},
                I,
              ),
              L = { ...(I.fs || {}) },
              d = {
                pl: "pl",
                pvp: "pvp",
                dy: "dy",
                roe: "roe",
                margin: "margem_liquida_pct",
                ev: "evebitda",
                debt: "div_liq_ebitda",
                growth: "crescimento_receita_pct",
              };
            for (const [$, w] of Object.entries(d))
              k?.metric[$] != null && (L[w] = k.metric[$]);
            return {
              position: J,
              meta: { ...I, fs: L },
              fundamental: k,
              advanced: window.ResearchAdvanced?.pdfData(
                J.tk,
                window.TRM?.trGet("fund", { tk: J.tk })?.v || {},
              ),
              technical: v,
              report:
                (g.rel || []).find(
                  ($) => $.tipo === "ativo" && $.tk === J.tk,
                ) || null,
            };
          }),
          Q = window.CarteiraExperience?.context?.() || {};
        return {
          selected: R,
          snapshot: a,
          assets: h,
          generated: new Date().toISOString(),
          snapshots: S.cart?.snap || {},
          exposure: window.ResearchAdvanced?.exposureData(a.pos),
          asOf: loc().slice(0, 10),
          ...Q,
        };
      }
      async function E(g) {
        if (!window.CarteiraFactsheet)
          throw Error(
            "Atualize todos os arquivos do aplicativo para gerar o relatório de gestão.",
          );
        return window.CarteiraFactsheet.pdf(g);
      }
      let u = null;
      function P() {
        if (u) return u;
        const g = SESS?.uid || null;
        return (
          typeof toast == "function" &&
            toast(
              "Preparando relatório: carregando histórico e fundamentos…",
              5e3,
            ),
          (u = (async () => {
            if (!window.DIARIO_DEMO) {
              const R = [];
              (typeof pfHist == "function" &&
                R.push(Promise.resolve().then(() => pfHist())),
                typeof pfMeta == "function" &&
                  R.push(Promise.resolve().then(() => pfMeta())),
                await Promise.allSettled(R));
              const a = Date.now() + 2e4;
              for (
                ;
                (window.PF?.histBusy || window.PF?.meta) && Date.now() < a;

              )
                await new Promise((n) => setTimeout(n, 150));
            }
            if (!window.DIARIO_DEMO && window.TRM?.trFn) {
              const R = M().assets.map((a) => a.position);
              for (let a = 0; a < R.length; a += 2) {
                if ((SESS?.uid || null) !== g)
                  throw Error("A conta mudou durante o carregamento.");
                await Promise.allSettled(
                  R.slice(a, a + 2)
                    .filter((n) =>
                      [
                        "acao",
                        "acao_ext",
                        "bdr",
                        "fii",
                        "etf",
                        "etf_ext",
                      ].includes(n.cl),
                    )
                    .map(async (n) => {
                      const f = await window.TRM.trFn(
                        "fund",
                        { tk: n.tk },
                        6e5,
                      );
                      return (
                        (SESS?.uid || null) === g &&
                          f &&
                          window.ResearchAdvanced?.onFund(n.tk, f),
                        f
                      );
                    }),
                );
              }
            }
            if ((SESS?.uid || null) !== g)
              throw Error(
                "A conta mudou durante o carregamento. Abra o relatório novamente.",
              );
            return M();
          })().finally(() => {
            u = null;
          })),
          u
        );
      }
      function m(g) {
        try {
          return window.TRM?.tec?.velas(g, "1d")?.L || [];
        } catch {
          return [];
        }
      }
      async function c(g) {
        const R = await i(
            g.demo ? "Revista · demonstração" : "Revista do Pregão",
            g.demo
              ? "EDIÇÃO DEMONSTRATIVA · séries e textos fictícios"
              : "Estudos de fechamento e cenários condicionais para a próxima semana",
            g.ref,
          ),
          a = R.p;
        (R.text(
          "Leitura original do Diário de Trader. Não é uma edição, reprodução ou análise da Revista Timing. Não há probabilidade atribuída aos cenários.",
        ),
          R.heading("Roteiro da edição"),
          R.text(`1. Panorama e agenda
2. Índice, dólar e Ibovespa
3. Estudos de ações
4. Quadro de cenários
5. Plano e checklist da próxima sessão`),
          g.edition?.em_poucas_linhas?.length
            ? R.section("panorama_registrado", g.edition.em_poucas_linhas)
            : R.text(
                "Panorama narrativo não carregado. Abra uma edição do Jornal do Pregão para incorporar seu resumo.",
              ),
          g.edition?.agenda?.length
            ? R.table(
                [
                  ["Quando", 18],
                  ["País", 15],
                  ["Evento", 67],
                ],
                g.edition.agenda.map((f) => [
                  f.quando || "Não informado",
                  f.pais || "Não informado",
                  f.evento || "Não informado",
                ]),
              )
            : R.text(
                "Agenda futura não fornecida. Consulte a agenda econômica antes da próxima sessão; eventos da edição carregada podem se referir à semana anterior.",
              ));
        const n = [];
        for (const f of g.assets) {
          (a.add(),
            R.heading(
              f.ticker + " · estudo de mercado",
              g.demo
                ? "DADOS ILUSTRATIVOS"
                : "Histórico do cache do aplicativo; verifique a data da última barra",
            ));
          const h = N(f.bars);
          if (!h.available) {
            (R.text(h.reason),
              n.push([f.ticker, "Sem dados", "Sem dados", "Sem dados"]));
            continue;
          }
          (Y(R, f.bars, "Estrutura diária"),
            Y(R, e(f.bars), "Estrutura semanal", 150),
            R.text("A semana corrente pode estar incompleta.", {
              size: 8,
              color: a.C.mut,
            }),
            R.table(
              [
                ["Referência", 45],
                ["Valor", 55],
              ],
              [
                ["Última sessão da série", h.to],
                ["Fechamento", l(h.last.c)],
                ["Média 20", l(h.m20)],
                ["Média 50", l(h.m50)],
                ["Média 200", l(h.m200)],
                ["Faixa inferior recente", l(h.support)],
                ["Faixa superior recente", l(h.resistance)],
              ],
            ));
          const Q = `Se uma sessão posterior fechar acima de ${l(h.resistance)}, acompanhar a sustentação acima da faixa. A hipótese perde força ao retornar ao intervalo.`,
            J = `Se fechar abaixo de ${l(h.support)}, acompanhar a continuidade abaixo da faixa. A hipótese perde força se recuperar o intervalo.`,
            v = `Enquanto permanecer entre ${l(h.support)} e ${l(h.resistance)}, a leitura por essa regra é de permanência na faixa.`;
          (a.need(190),
            R.heading("Cenários para acompanhar"),
            R.text("Alta condicional: " + Q),
            R.text("Baixa condicional: " + J),
            R.text("Permanência na faixa: " + v),
            R.text(
              "Referência mecânica: extremos das 20 sessões anteriores ao último candle disponível. Não contempla gaps futuros, liquidez ou custos; não é sugestão automática de operação.",
            ),
            n.push([
              f.ticker,
              "Acima de " + l(h.resistance),
              "Abaixo de " + l(h.support),
              "Retorno à faixa",
            ]));
        }
        return (
          a.need(180),
          R.heading("Quadro de acompanhamento"),
          R.table(
            [
              ["Ativo", 18],
              ["Confirmação de alta", 29],
              ["Confirmação de baixa", 29],
              ["Reavaliar", 24],
            ],
            n,
          ),
          R.heading("Antes de abrir a próxima sessão"),
          R.text(`• Conferir agenda e resultados das empresas.
• Atualizar o último fechamento e os níveis.
• Escrever cenário principal e alternativo.
• Definir invalidação e risco antes de decidir.
• Registrar o que aconteceu e revisar o processo.`),
          R.heading("Fontes e método"),
          R.text(
            g.demo
              ? "Este arquivo usa somente dados sintéticos para validar o projeto gráfico."
              : "Candles diários disponíveis no aplicativo, agregados semanalmente sem preencher dias ausentes. Narrativa e agenda, quando presentes, vêm da edição já carregada do Jornal do Pregão. Cada estudo mostra sua referência. Não se extrapola histórico para fabricar preços futuros.",
          ),
          R.finish()
        );
      }
      async function q(g) {
        const R = window.RevistaModel,
          a = g.demo ? "Revista técnica · demonstração" : "Revista da Semana",
          n = await i(
            a,
            "Estudos técnicos de mercado · semana " +
              g.window.from +
              " a " +
              g.window.to,
            g.window.cutoff,
          ),
          f = n.p;
        (n.text(
          g.demo
            ? "DEMONSTRAÇÃO. Todas as séries e cotações deste exemplo são fictícias."
            : "Edição de estudos do Jornal do Pregão. Corte do histórico: " +
                g.window.cutoff +
                ". Cada ativo mostra sua última sessão disponível. Não contém matérias de notícias nem narrativas macro geradas.",
        ),
          n.heading("Nesta edição"),
          n.text(
            "Ibovespa e dólar à vista · contratos futuros · ações de referência · quadro de cenários · plano da próxima sessão.",
          ),
          n.table(
            [
              ["Estudo", 26],
              ["Referência", 25],
              ["Diário", 24],
              ["Semanal", 25],
            ],
            g.studies.map((h) => [
              h.ticker,
              h.asOf || "Sem histórico",
              h.dailyTrend || "Não avaliada",
              h.weeklyTrend || "Não avaliada",
            ]),
          ),
          n.heading("Como usar a revista"),
          n.text(
            "Leia as estruturas diária e semanal em conjunto. Os cenários são condicionais: descrevem o que acompanhar e quando reavaliar. Não têm probabilidade atribuída, preço-alvo próprio ou promessa de resultado. Aberturas, vencimentos e feriados devem ser conferidos no calendário oficial.",
          ),
          n.text(
            "Os gráficos à vista não são históricos de WIN ou WDO. Os futuros possuem uma seção própria de snapshot, com os limites de cobertura explícitos. Não se mistura o valor em reais do dólar à vista com os pontos do futuro.",
          ));
        for (const h of g.studies) {
          if (
            ((h.available || f.y > f.BOT - 160) && f.add(),
            n.heading(
              h.ticker + " · " + h.name,
              h.available
                ? "Última sessão " + h.asOf + " · histórico desde " + h.from
                : "Cobertura indisponível",
            ),
            !h.available)
          ) {
            n.text(h.reason);
            continue;
          }
          (n.text(
            "Estrutura diária: " +
              h.dailyTrend +
              ". Estrutura semanal: " +
              h.weeklyTrend +
              ". Variação da última semana disponível: " +
              l(h.weeklyReturn) +
              "%. A quantidade de sessões pode variar por feriados.",
          ),
            Y(n, h.bars, "Estrutura diária · últimos candles observados", 162),
            Y(n, h.weeks, "Estrutura semanal · agregação do histórico", 145),
            n.table(
              [
                ["Métrica do histórico", 55],
                ["Valor", 45],
              ],
              [
                ["Último fechamento", l(h.close)],
                ["Média 20 sessões", l(h.ma20)],
                ["Média 50 sessões", l(h.ma50)],
                ["Média 200 sessões", l(h.ma200)],
                ["Média 10 semanas", l(h.w10)],
                ["Média 40 semanas", l(h.w40)],
                ["RSI 14 sessões", l(h.rsi)],
                ["Mínima das 20 sessões anteriores", l(h.support)],
                ["Máxima das 20 sessões anteriores", l(h.resistance)],
              ],
            ),
            f.need(250),
            n.heading("Cenários para a semana"));
          for (const Q of h.scenarios)
            (n.text(Q.name, { font: "b" }),
              n.text(
                Q.condition +
                  " Referência: " +
                  (Q.trigger != null
                    ? l(Q.trigger)
                    : l(Q.low) + " a " + l(Q.high)) +
                  ". Reavaliar: " +
                  Q.invalidation,
              ));
          (n.text(
            "Leitura mecânica: diário usa preço e ordenação das MM20/MM50; semanal usa preço e ordenação das médias de 10/40 semanas. RSI é calculado por suavização de Wilder. A estrutura pode atrasar reversões e não isola causas econômicas.",
            { size: 8, color: f.C.mut },
          ),
            n.text(
              "Fonte: " +
                (h.source || "não informada") +
                " · consulta " +
                (h.queried || g.gerado) +
                ". Não houve preenchimento de sessões ou projeção de candles futuros.",
              { size: 7.5, color: f.C.mut },
            ));
        }
        for (const h of g.futures) {
          if (
            ((h.available || f.y > f.BOT - 180) && f.add(),
            n.heading(
              h.ticker + " · " + h.name,
              "Contrato futuro · snapshot e cenários de cobertura limitada",
            ),
            !h.available)
          ) {
            n.text(h.reason);
            continue;
          }
          (n.table(
            [
              ["Referência informada", 55],
              ["Valor", 45],
            ],
            [
              ["Símbolo retornado", h.symbol],
              ["Último preço do snapshot", l(h.price)],
              ["Máxima do snapshot", l(h.high)],
              ["Mínima do snapshot", l(h.low)],
              ["Abertura informada", l(h.open)],
              ["Consulta", h.queried || "Não informada"],
              ["Fonte", h.source],
            ],
          ),
            n.text(h.note),
            n.heading("Condições de acompanhamento"),
            n.text(
              "Acima de " +
                l(h.high) +
                ": observar sustentação acima da máxima da amostra; reavaliar se retornar à faixa. Abaixo de " +
                l(h.low) +
                ": observar continuidade abaixo da mínima; reavaliar se recuperar a faixa. Dentro do intervalo: aguardar definição.",
            ),
            n.text(
              "Estes níveis pertencem ao contrato retornado, não ao gráfico à vista. Sem série histórica real do futuro, não foram calculadas médias, tendência semanal ou variação semanal do contrato. Não se desenha uma série de IBOV como WIN nem USD/BRL como WDO.",
            ),
            n.heading("Antes de usar os níveis"),
            n.text(
              "Conferir contrato e vencimento, referência de preço na plataforma e horário do dado. Uma troca de contrato pode alterar preços e níveis. Atualizar a leitura após a abertura; o snapshot pode ter atraso.",
            ));
        }
        return (
          f.need(330),
          n.heading("Quadro de cenários e invalidação"),
          n.table(
            [
              ["Ativo", 18],
              ["Alta: referência", 27],
              ["Baixa: referência", 27],
              ["Reavaliar", 28],
            ],
            g.studies
              .filter((h) => h.available)
              .map((h) => [
                h.ticker,
                l(h.resistance),
                l(h.support),
                "Retorno à faixa em fechamento",
              ]),
          ),
          n.heading("Roteiro para o diário"),
          n.text(`1. Conferir agenda, feriados e vencimentos.
2. Atualizar preços e verificar a confirmação do cenário.
3. Registrar cenário principal, alternativo e invalidação.
4. Dimensionar risco e revisar o checklist.
5. Registrar a execução e revisar o processo ao encerrar.`),
          n.heading("Fontes e método"),
          n.text(
            "Dados históricos das fontes já integradas ao aplicativo, filtrados até o corte da edição; médias, RSI e faixas calculados pelo código. Futuros: snapshot separado do terminal, sem inventar histórico. Sessões ausentes não são preenchidas. A revista é original e não reproduz texto, marca, recomendações ou gráficos de outras publicações.",
          ),
          n.finish()
        );
      }
      function H() {
        document.getElementById("wf-report-dialog")?.remove();
        const R = document.createElement("dialog");
        ((R.id = "wf-report-dialog"), (R.className = "wf-dialog"));
        let a = ["IBOV", "WIN", "WDO", "SPX"];
        try {
          a.push(
            ...pfCalc()
              .pos.slice(0, 6)
              .map((n) => n.tk),
          );
        } catch {}
        ((R.innerHTML = `<header><h2>Relatórios e estudos</h2><button type="button" data-report="close" aria-label="Fechar">×</button></header><div class="wf-content"><h3>Carteira · pesquisa por ativo</h3><p>Exporta o consolidado selecionado e fichas individuais com os dados já carregados. Lacunas aparecem como indisponíveis.</p><div class="wf-actions"><button class="btn" data-report="portfolio">Gerar PDF profissional</button><button class="btn s" data-report="refresh">Carregar cotações e séries existentes</button><button class="btn s" data-report="analysis">Gerar análises individuais faltantes · usa cota de IA</button><button class="btn s" data-report="cancel">Parar após pedido atual</button></div><h3>Revista da semana</h3><label>Índices e ações, separados por vírgula<input id="wf-weekend-assets" value="${s([...new Set(a)].join(", "))}"></label><div class="wf-actions"><button class="btn s" data-report="load-weekend">Carregar históricos</button><button class="btn" data-report="weekend">Exportar revista</button><button class="btn s" data-report="journal">Personalizar PDF do jornal diário</button></div><p role="status" id="wf-report-status" aria-live="polite"></p><p class="wf-note">A exportação não gera análises pagas. Carregue os dados antes; não há gráfico sem série ou indicador preenchido por aproximação.</p></div>`),
          R.addEventListener("click", async (n) => {
            const f = n.target.closest("[data-report]");
            if (!f) return;
            const h = f.dataset.report,
              Q = R.querySelector('[role="status"]');
            if (h === "close") return R.close();
            if (h === "cancel") {
              ((o = !0),
                (Q.textContent = "A fila vai parar após o pedido atual."));
              return;
            }
            if (h === "journal")
              return (R.close(), window.TraderWorkflow?.journalSettings());
            if (!G) {
              ((G = !0), (o = !1));
              try {
                if (h === "portfolio") {
                  Q.textContent = "Preparando o documento…";
                  const v = await P();
                  if (!v.assets.length && !v.selected)
                    throw Error(
                      "Cadastre posições ou abra uma análise da carteira primeiro.",
                    );
                  (R.close(),
                    rpAbrir(
                      "Relatório profissional da carteira",
                      "carteira-pesquisa-" + loc().slice(0, 10) + ".pdf",
                      () => E(v),
                    ));
                }
                if (h === "refresh") {
                  if (window.DIARIO_DEMO)
                    throw Error("Consultas externas desativadas no demo.");
                  ((Q.textContent =
                    "Carregando os dados pelos serviços existentes…"),
                    window.pfQAtualiza && (await pfQAtualiza(!0)),
                    window.pfMeta && (await pfMeta()),
                    window.pfVelas && (await pfVelas()),
                    (Q.textContent =
                      "Atualização concluída. Confira datas e eventuais lacunas no relatório."));
                }
                const J = () =>
                  [
                    ...new Set(
                      R.querySelector("input")
                        .value.split(",")
                        .map((v) => v.trim().toUpperCase())
                        .filter((v) => /^[A-Z0-9:^._=/-]{1,24}$/.test(v)),
                    ),
                  ].slice(0, 20);
                if (h === "load-weekend") {
                  if (window.DIARIO_DEMO)
                    throw Error("Consultas externas desativadas no demo.");
                  const v = J();
                  for (let I = 0; I < v.length && !o; I++) {
                    Q.textContent = `Histórico ${I + 1}/${v.length}: ${v[I]}`;
                    try {
                      await window.TRM?.tec?.pegaVelas(v[I], "1d");
                    } catch {}
                  }
                  Q.textContent =
                    "Consulta encerrada; séries indisponíveis serão identificadas no PDF.";
                }
                if (h === "weekend") {
                  const v = J().map((I) => ({ ticker: I, bars: m(I) }));
                  (R.close(),
                    rpAbrir(
                      "Revista do Pregão",
                      "revista-pregao-" + loc().slice(0, 10) + ".pdf",
                      () =>
                        c({
                          ref: loc().slice(0, 10),
                          edition: typeof jrVer == "function" ? jrVer() : null,
                          assets: v,
                        }),
                    ));
                }
                if (h === "analysis") {
                  if (window.DIARIO_DEMO)
                    throw Error("Geração de IA desativada no demo.");
                  const v = pfCalc()
                    .pos.filter((I) => !pfUltRel(I.tk))
                    .slice(0, 24);
                  if (!v.length) {
                    Q.textContent =
                      "Não há análise individual faltante entre as posições.";
                    return;
                  }
                  if (
                    !confirm(
                      `Gerar até ${v.length} análises individuais faltantes usando a cota de IA da sua conta?`,
                    )
                  )
                    return;
                  for (let I = 0; I < v.length && !o; I++)
                    ((Q.textContent = `Análise ${I + 1}/${v.length}: ${v[I].tk}`),
                      await pfGeraAtivo(v[I], !1));
                  (window.PF && (window.PF.rv = null),
                    (Q.textContent =
                      "Fila encerrada. A exportação informa quais análises estão disponíveis."));
                }
              } catch (J) {
                Q.textContent = J.message || String(J);
              } finally {
                G = !1;
              }
            }
          }),
          document.body.append(R),
          R.showModal());
      }
      (window.addEventListener(
        "click",
        async (g) => {
          if (g.target.closest('[data-pf="print"]')) {
            (g.preventDefault(), g.stopImmediatePropagation());
            try {
              const R = await P();
              rpAbrir(
                "Relatório da carteira",
                "carteira-" + loc().slice(0, 10) + ".pdf",
                () => E(R),
              );
            } catch (R) {
              toast(R.message || String(R));
            }
          }
        },
        !0,
      ),
        (window.TraderReports = {
          openHub: H,
          portfolioInput: M,
          preparePortfolioInput: P,
          portfolioPdf: E,
          weekendPdf: c,
          technicalMagazinePdf: q,
          study: N,
          weekly: e,
          bars: F,
          fundamentalRows: z,
          researchChart: B,
        }));
    })(),
    (() => {
      "use strict";
      const s = window.CarteiraResearch,
        l = (z) => esc(String(z ?? "")),
        r = (z, M = "BRL", E = 2) =>
          z == null
            ? "Não disponível"
            : Number(z).toLocaleString("pt-BR", {
                style: "currency",
                currency: M,
                minimumFractionDigits: E,
                maximumFractionDigits: E,
              }),
        j = () => loc().slice(0, 10);
      function O() {
        let z = null,
          M = null;
        try {
          ((z = perfCalc()),
            (M =
              window.TRM?.trGet("histp", pfHistArgs())?.v ||
              window.PF.histUlt));
        } catch {}
        const E = S.cart?.lanc || [];
        return {
          snapshot: pfCalc(),
          ledger: E,
          income: s.income(E, j()),
          wealth: s.wealth(z, E, M),
          performance: z,
          raw: M,
          asOf: j(),
        };
      }
      function G(z, M) {
        if (z.length < 2)
          return '<p class="cr-empty">Sem observações suficientes para o gráfico.</p>';
        const E = 680,
          u = 240,
          P = 48,
          m = z.map((n) => n.value),
          c = Math.min(...m),
          q = Math.max(...m),
          H = q - c || Math.max(Math.abs(q) * 0.05, 1),
          g = (n) => P + ((E - P - 14) * n) / (z.length - 1),
          R = (n) => u - 35 - ((n - c) / H) * (u - 65),
          a = z
            .map(
              (n, f) =>
                (f ? "L" : "M") + g(f).toFixed(2) + " " + R(n.value).toFixed(2),
            )
            .join(" ");
        return `<svg viewBox="0 0 ${E} ${u}" role="img" aria-label="${l(M)}"><title>${l(M)}</title>${[
          0, 0.5, 1,
        ]
          .map((n) => {
            const f = c + H * n,
              h = R(f);
            return `<line x1="${P}" x2="${E - 14}" y1="${h}" y2="${h}" stroke="currentColor" opacity=".12"/><text x="${P - 6}" y="${h + 4}" text-anchor="end" fill="currentColor" font-size="10">${l((f / 1e3).toFixed(1))}k</text>`;
          })
          .join(
            "",
          )}<path d="${a}" fill="none" stroke="#ac8439" stroke-width="2.5"/>${z.map((n, f) => `<circle cx="${g(f)}" cy="${R(n.value)}" r="3" fill="#36a36d"><title>${l(n.date)}: ${l(r(n.value))}</title></circle>`).join("")}<text x="${P}" y="${u - 8}" fill="currentColor" font-size="10">${l(z[0].date)}</text><text x="${E - 14}" y="${u - 8}" text-anchor="end" fill="currentColor" font-size="10">${l(z.at(-1).date)}</text></svg>`;
      }
      function o(z, M = "BRL") {
        if (!z.length)
          return '<p class="cr-empty">Nenhum provento lançado neste período. Não foram estimados recebimentos.</p>';
        const E = Math.max(...z.map((u) => Math.abs(u.value)), 1);
        return `<div class="cr-bars">${z.map((u) => `<div><span>${l(u.date)}</span><i><b style="width:${Math.max(0, (Math.abs(u.value) / E) * 100)}%"></b></i><strong>${l(r(u.value, M))}</strong></div>`).join("")}</div>`;
      }
      function F(z) {
        const M = ["BRL", "USD"].filter((E) =>
          z.income.events.some((u) => u.unit === E),
        );
        return `<section class="cr-section"><h3>Evolução do valor dos ativos</h3>${z.wealth.points.length ? G(z.wealth.points, "Valor dos ativos em BRL, sem caixa") : `<p class="cr-empty">${l(z.wealth.reason)}</p>`}<p class="cr-note">Valor dos ativos, sem caixa. Compras, vendas e variação cambial alteram o patrimônio; este gráfico não é rentabilidade. Referência: ${l(z.wealth.points.at(-1)?.date || "não disponível")}.</p></section><section class="cr-section"><h3>Proventos recebidos por mês</h3>${
          M.length
            ? M.map(
                (E) =>
                  `<h4>${E} · lançamentos registrados</h4>${o(
                    Object.entries(z.income.months)
                      .filter(([, u]) => u[E] !== 0)
                      .slice(-24)
                      .map(([u, P]) => ({ date: u, value: P[E] })),
                    E,
                  )}`,
              ).join("")
            : '<p class="cr-empty">Sem proventos lançados. Cadastre dividendos, JCP ou rendimentos recebidos em Movimentação.</p>'
        }<p class="cr-note">Valores líquidos dos custos informados no lançamento. BRL e USD são separados; meses futuros não são preenchidos.</p></section>`;
      }
      function N(z, M) {
        const E = s.detail(z, M.ledger, j()),
          u = z.moeda === "USD" && !M.snapshot.fx,
          P = [
            [
              "Quantidade",
              E.quantity?.toLocaleString("pt-BR", { maximumFractionDigits: 8 }),
            ],
            ["Cotação", z.tem ? r(z.pa, E.unit) : "Sem cotação"],
            ["Variação diária da posição atual", r(E.daily, E.unit)],
            ["Resultado não realizado", r(E.result, E.unit)],
            [
              "Resultado não realizado + proventos do ciclo",
              r(E.withIncome, E.unit),
            ],
            ["Preço médio", r(E.pm, E.unit, 4)],
            [
              "Preço médio líquido de proventos · gerencial",
              r(E.pmIncome, E.unit, 4),
            ],
            ["Proventos lançados no ciclo atual", r(E.income, E.unit)],
            ["Proventos de todo o histórico", r(E.allIncome, E.unit)],
            ["Saldo atual da posição", r(E.value, E.unit)],
            ["Custo da posição atual", r(E.cost, E.unit)],
            /* v605: ativo dolarizado também em reais (custo pelo câmbio de cada compra; saldo pelo câmbio de hoje) */
            ...(z.moeda === "USD"
              ? [
                  ["Custo de aquisição em R$ · câmbio de cada compra", z.cR != null ? r(z.cR, "BRL") : null],
                  ["Saldo atual em R$ · câmbio " + (M.snapshot.fx ? (+M.snapshot.fx).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "indisponível"), E.value != null && M.snapshot.fx ? r(E.value * M.snapshot.fx, "BRL") : null],
                ]
              : []),
            [
              "Peso na carteira",
              u
                ? "Indisponível sem câmbio"
                : E.weight == null
                  ? "Não disponível"
                  : E.weight.toFixed(2) + "%",
            ],
          ];
        return `<section class="cr-position"><h3>Sua posição · ${l(z.tk)}</h3><dl>${P.map(([m, c]) => `<div><dt>${l(m)}</dt><dd>${l(c ?? "Não disponível")}</dd></div>`).join("")}</dl><p class="cr-note">Cotação: ${l(z.pxEm || "sem referência")}. Ciclo desde ${l(E.cycleStart || "data não identificada")}. Proventos do ciclo são os lançados desde o último zeramento; elegibilidade na data-com não é aferida. Preço médio líquido é uma visão gerencial, sem alterar o preço médio cadastrado ou fiscal. A variação diária usa a quantidade atual, sem apurar operações intradiárias.</p><button class="pfbt" data-cr="movements" data-key="${l(z.k)}">Detalhes e movimentações</button></section>`;
      }
      function e(z) {
        return (
          {
            fx: "Confira a taxa de câmbio da data deste lançamento na nota ou no extrato. O câmbio atual não substitui o histórico.",
            oversell:
              "Verifique se falta uma compra anterior, se a quantidade vendida está correta ou se houve um evento corporativo.",
            duplicate:
              "Compare os registros com a mesma identificação antes de remover uma possível duplicata.",
            date: "Confira a data do registro no formato dia, mês e ano.",
            fee: "Confira taxas e custos na nota de negociação.",
            price: "Confira o preço unitário ou o valor do recebimento.",
            quantity: "Confira a quantidade negociada.",
            event:
              "Confira o tipo e o fator do desdobramento, grupamento ou bonificação.",
            type: "Confira o tipo da movimentação cadastrada.",
          }[z] || "Compare o registro com a nota ou extrato da corretora."
        );
      }
      function i() {
        window.CarteiraCorrection.open();
      }
      function B() {
        if (tab !== "carteiras" || !window.PF || !window.TraderReports) return;
        let z;
        try {
          z = O();
        } catch {
          return;
        }
        const M = document.getElementById("app"),
          E = s.coverage(z.snapshot.pos, j()),
          u = M.querySelector(".pf > .pfks");
        if (u && !M.querySelector(".cr-coverage")) {
          const P = document.createElement("p");
          ((P.className = "cr-note cr-coverage"),
            P.setAttribute("role", "status"),
            (P.textContent =
              `Cotações disponíveis: ${E.priced} de ${E.total} ativos.` +
              (E.missing.length
                ? ` Sem preço: ${E.missing.join(", ")}. Valores consolidados podem incluir custo como referência; não representam patrimônio totalmente marcado a mercado.`
                : "") +
              (E.undated.length
                ? ` Data não informada: ${E.undated.join(", ")}.`
                : "") +
              (E.previous.length
                ? " Há preços de pregões anteriores; confira a referência ao abrir o ativo."
                : "")),
            u.after(P));
          const m = window.CarteiraCalculo.audit(z.ledger, j()),
            c = document.createElement("details");
          if (
            ((c.className = "cr-audit pfc"),
            (c.innerHTML = `<summary>Revisar registros da carteira · ${m.issues.length} pendência(s)</summary><p>Conferência aritmética dos registros até ${l(j())}. Valores por moeda de origem. Não substitui validação fiscal, extratos ou elegibilidade de proventos.</p>${m.issues.length ? "<ul>" + m.issues.map((q) => "<li><b>" + l([q.date, q.ticker].filter(Boolean).join(" · ")) + "</b><p>" + l(q.message) + "</p><p>" + l(e(q.code)) + '</p><button type="button" class="pfbt pfmini" data-cc-index="' + q.index + '">Corrigir este lançamento</button></li>').join("") : "<p>Nenhuma inconsistência detectada pelas regras desta conferência.</p>"}<div class="wf-table"><table><thead><tr><th>Ativo</th><th>Moeda</th><th>Quantidade</th><th>Preço médio</th><th>Realizado</th><th>Proventos</th></tr></thead><tbody>${m.positions.map((q) => "<tr><th>" + l(q.tk) + "</th><td>" + l(q.unit) + "</td><td>" + l(q.q.toLocaleString("pt-BR", { maximumFractionDigits: 8 })) + "</td><td>" + r(q.pm, q.unit, 4) + "</td><td>" + r(q.real, q.unit) + "</td><td>" + r(q.prov, q.unit) + "</td></tr>").join("")}</tbody></table></div>`),
            P.after(c),
            (c.id = "cr-ledger-audit"),
            m.issues.length)
          ) {
            const q = document.createElement("section");
            ((q.className = "cr-audit-alert"),
              q.setAttribute("role", "status"),
              (q.innerHTML =
                "<h3>" +
                new Set(m.issues.map((g) => g.index)).size +
                ' registros precisam de revisão</h3><p>Abra a correção guiada para revisar cada registro. O campo com problema será destacado e os indicadores serão recalculados ao salvar.</p><button type="button" class="pfbt" data-cr="audit">Corrigir lançamentos</button>'),
              u.before(q));
            const H = [
              2,
              4,
              5,
              ...(m.issues.some((g) => g.code !== "fx") ? [3] : []),
              ...(m.issues.some((g) => g.code === "fx") ? [1, 6] : []),
            ];
            for (const g of H) {
              const R = u.children[g],
                a = R?.querySelector("b");
              if (a) {
                ((a.textContent = "Indisponível"),
                  (a.className = "cr-unavailable"),
                  R.querySelectorAll("em").forEach((f) => f.remove()));
                const n = document.createElement("small");
                ((n.textContent = "Histórico pendente de revisão"),
                  R.append(n));
              }
            }
            c.insertAdjacentHTML(
              "beforeend",
              '<p>Compare cada registro acima com sua nota ou extrato. Não preencha câmbio ou preços por estimativa.</p><button type="button" class="pfbt" data-cr="ledger">Abrir movimentações</button>',
            );
          }
          if (E.missing.length) {
            const q = u.querySelector(".pfk span");
            q && (q.textContent = "Patrimônio de referência (parcial)");
          }
        }
        if (window.PF.sel) {
          const P = M.querySelector('.pfmd[data-pfbk="selx"] .pfmb'),
            m = z.snapshot.pos.find((c) => c.k === window.PF.sel);
          if (P && m && !P.querySelector(".cr-position")) {
            const c = P.querySelector(".pfdh");
            (c
              ? c.insertAdjacentHTML("afterend", N(m, z))
              : P.insertAdjacentHTML("afterbegin", N(m, z)),
              P.querySelectorAll(".pfks.pfks6").forEach((q) => q.remove()));
          }
        }
        if (window.PF.rv) {
          const P = M.querySelector(".pfprint"),
            m = (window.PF.rel || []).find(
              (c) => String(c.id) === String(window.PF.rv),
            );
          if (P && !P.querySelector(".cr-report-visual")) {
            const c = document.createElement("div");
            ((c.className = "cr-report-visual"),
              (c.innerHTML =
                '<h2>Pesquisa patrimonial</h2><p class="cr-note">Gráficos dos registros atuais da carteira. Referência da análise selecionada: ' +
                l(m?.ref || "não informada") +
                ". Não representam a composição histórica de uma análise antiga.</p>" +
                F(z) +
                '<p><button class="pfbt pfam" data-cr="pdf">Baixar relatório profissional em PDF</button></p>'));
            const q = P.querySelector(".pfmodalh,.pfmh");
            q ? q.after(c) : P.prepend(c);
          }
        }
        if (window.PF.aba === "ia" && !M.querySelector(".cr-research-intro")) {
          const P = M.querySelector(".pf");
          if (P) {
            const m = document.createElement("section");
            ((m.className = "cr-research-intro pfc"),
              (m.innerHTML =
                '<h3>Relatório patrimonial e fundamentalista</h3><p>Gere a análise consolidada pelos botões desta aba. Ao abrir o relatório, veja evolução, proventos e fichas por ativo; a exportação usa paginação própria.</p><button class="pfbt" data-cr="load">Carregar histórico e fundamentos</button>'),
              P.append(m));
          }
        }
      }
      (window.TraderUI.onRender("carteira-experiencia", B),
        window.addEventListener(
          "click",
          async (z) => {
            const M = z.target.closest("[data-cr]");
            if (!M) return;
            (z.preventDefault(), z.stopImmediatePropagation());
            const E = M.textContent;
            if (
              (M.dataset.cr === "audit" && i(),
              M.dataset.cr === "ledger" &&
                ((window.PF.aba = "ativos"), (window.PF.amb = "mov"), render()),
              M.dataset.cr === "pdf")
            ) {
              const u = M.textContent;
              ((M.disabled = !0), (M.textContent = "Carregando dados…"));
              try {
                const P = await TraderReports.preparePortfolioInput();
                rpAbrir(
                  "Relatório patrimonial e fundamentalista",
                  "carteira-pesquisa-" + j() + ".pdf",
                  () => TraderReports.portfolioPdf(P),
                );
              } catch (P) {
                toast(P.message || String(P));
              } finally {
                ((M.disabled = !1), (M.textContent = u));
              }
            }
            if (M.dataset.cr === "load") {
              if (window.DIARIO_DEMO)
                return toast("Consultas externas desativadas na demonstração.");
              M.disabled = !0;
              try {
                (await Promise.allSettled([pfHist(), pfMeta(), pfRel(!0)]),
                  render());
              } finally {
                ((M.disabled = !1), (M.textContent = E));
              }
            }
            if (M.dataset.cr === "movements") {
              const u = Y(M.dataset.key);
              if (!u) return;
              const P = s.detail(u, S.cart?.lanc || [], j()),
                m = document.createElement("dialog");
              ((m.id = "cr-movements"),
                document.getElementById("cr-movements")?.remove(),
                (m.className = "wf-dialog"),
                (m.innerHTML =
                  "<header><h2>" +
                  l(u.tk) +
                  ' · movimentações</h2><button class="btn s" data-cr="close">Fechar</button></header><div class="wf-content"><div class="wf-table"><table><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Preço / valor</th></tr>' +
                  P.events
                    .map(
                      (c) =>
                        "<tr><td>" +
                        l(c.d) +
                        "</td><td>" +
                        l(
                          {
                            C: "Compra",
                            V: "Venda",
                            P: "Provento",
                            E: "Evento",
                          }[c.tp] || c.tp,
                        ) +
                        "</td><td>" +
                        l(c.q || "—") +
                        "</td><td>" +
                        l(c.p ?? "—") +
                        "</td></tr>",
                    )
                    .join("") +
                  "</table></div></div>"),
                document.body.append(m),
                m.addEventListener("close", () => m.remove()),
                m.showModal());
            }
            M.dataset.cr === "close" && M.closest("dialog")?.close();
          },
          !0,
        ));
      function Y(z) {
        try {
          return pfCalc().pos.find((M) => M.k === z);
        } catch {
          return null;
        }
      }
      window.CarteiraExperience = {
        openAudit: i,
        context: O,
        charts: F,
        rowsHtml: N,
        decorate: B,
        svgLine: G,
        bars: o,
      };
    })(),
    (function (s) {
      "use strict";
      const l = (g) => JSON.parse(JSON.stringify(g)),
        r = [
          "tp",
          "mk",
          "tk",
          "cl",
          "d",
          "q",
          "p",
          "cs",
          "fx",
          "ev",
          "f",
          "sub",
          "nota",
        ];
      function j(g, R, a, n = Date.now(), f = "") {
        if (!Number.isInteger(R) || !g[R])
          throw Error(
            "O lançamento não está mais disponível. Reabra a revisão.",
          );
        const h = l(g),
          Q = h[R],
          J = { ...Q };
        for (const b of r) Object.hasOwn(a, b) && (J[b] = String(a[b]).trim());
        if (
          (J.tk && (J.tk = J.tk.toUpperCase()),
          ["A", "R"].includes(J.tp) &&
            ((J.mk = "BR"), (J.tk = ""), (J.cl = "")),
          Q.mk !== J.mk && J.cl)
        ) {
          const b = {
            acao: "acao_ext",
            etf: "etf_ext",
            acao_ext: "acao",
            etf_ext: "etf",
          };
          ((J.mk === "US" && ["acao", "etf"].includes(J.cl)) ||
            (J.mk === "BR" && ["acao_ext", "etf_ext"].includes(J.cl))) &&
            (J.cl = b[J.cl]);
        }
        if (
          (J.mk === "CR" && (J.cl = "cripto"),
          J.mk === "US" &&
            !["acao_ext", "etf_ext"].includes(J.cl) &&
            (J.cl = J.cl === "etf" ? "etf_ext" : "acao_ext"),
          !["BR", "US", "CR"].includes(J.mk))
        )
          throw Error("Escolha o mercado do lançamento.");
        if (!["A", "R"].includes(J.tp) && !J.tk)
          throw Error("Informe o ativo.");
        if (a.resolution === "distinct") {
          if (!f || g.some((b) => b.id === f))
            throw Error("Identificação nova inválida.");
          J.id = f;
        }
        if (!J.id) {
          if (!f) throw Error("Identificação de lançamento ausente.");
          J.id = f;
        }
        const v = Math.max(n, (+Q.u || 0) + 1);
        ((J.u = v), (h[R] = J));
        const I = s.CarteiraCalculo,
          k = I.audit(g),
          L = I.audit(h),
          d = L.issues.filter((b) => b.index === R);
        if (d.length) throw Error(d.map((b) => b.message).join(" "));
        const $ = new Set(k.issues.map((b) => b.index + ":" + b.code)),
          w = L.issues.find((b) => !$.has(b.index + ":" + b.code));
        if (w)
          throw Error(
            "Esta alteração cria outra pendência em " +
              (w.ticker || "outro lançamento") +
              ": " +
              w.message,
          );
        return (
          s.TraderModel &&
            s.TraderModel.archive(J, Q, "correcao-carteira", v, 0),
          { rows: h, remaining: L.issues }
        );
      }
      if (((s.CarteiraCorrectionModel = { repair: j }), !s.document)) return;
      const O = (g) => esc(String(g ?? "")),
        G = {
          C: "Compra",
          V: "Venda",
          P: "Provento",
          E: "Evento corporativo",
          A: "Aporte",
          R: "Retirada",
        },
        o = {
          fx: "fx",
          oversell: "q",
          quantity: "q",
          price: "p",
          fee: "cs",
          date: "d",
          event: "f",
          type: "tp",
          duplicate: "resolution",
        };
      let F = null,
        N = null,
        e = "",
        i = null,
        B = null;
      const Y = () => S.cart?.lanc || [],
        z = () => SESS?.uid || S.uid || null;
      function M() {
        return s.CarteiraCalculo.audit(Y()).issues;
      }
      function E(g, R, a = "text", n = !1) {
        return `<label class="${n ? "cc-field-error" : ""}">${O(R)}${n ? "<small>Campo a corrigir</small>" : ""}${n && g === "fx" ? "<small>Use o câmbio da nota ou do extrato desta operação.</small>" : ""}<input name="${g}" type="${a}" value="${O(B[g] ?? "")}"${a === "text" && ["q", "p", "cs", "fx", "f"].includes(g) ? ' inputmode="decimal"' : ""}${n ? ' aria-invalid="true"' : ""}></label>`;
      }
      function u(g, R, a, n = !1) {
        return `<label class="${n ? "cc-field-error" : ""}">${R}<select name="${g}"${n ? ' aria-invalid="true"' : ""}>${Object.entries(
          a,
        )
          .map(
            ([f, h]) =>
              `<option value="${f}"${B[g] === f ? " selected" : ""}>${h}</option>`,
          )
          .join("")}</select></label>`;
      }
      function P(g) {
        ((N = g), (B = l(Y()[g])), (e = JSON.stringify(Y()[g])), m());
        const R = M().find((f) => f.index === N)?.code,
          a = o[R],
          n = F.querySelector(`[name="${a || "d"}"]`);
        (n?.focus({ preventScroll: !0 }),
          n?.scrollIntoView({ block: "center" }));
      }
      function m(g = "") {
        const R = M(),
          a = R.filter((Q) => Q.index === N),
          n = new Set(a.map((Q) => o[Q.code])),
          f = Y()[N];
        f || ((N = null), (B = null));
        const h = [...new Set(R.map((Q) => Q.index))];
        F.innerHTML = `<header><div><small>CARTEIRA · MOVIMENTAÇÕES</small><h2>${B ? "Corrigir " + O(f.tk || G[f.tp]) : "Revisão concluída"}</h2></div><button class="btn s" type="button" data-cc="close">Fechar</button></header><div class="wf-content">${g ? `<p role="status" class="cc-status">${O(g)}</p>` : ""}${
          h.length
            ? `<label>Lançamento para revisar<select data-cc="choose">${h
                .map(
                  (Q) =>
                    `<option value="${Q}"${Q === N ? " selected" : ""}>${O(Y()[Q].d)} · ${O(Y()[Q].tk || G[Y()[Q].tp])} · ${O(
                      R.filter((J) => J.index === Q)
                        .map((J) => J.message)
                        .join(" "),
                    )}</option>`,
                )
                .join("")}</select></label>`
            : "<p>Não há pendências detectadas pelas regras da conferência. Os indicadores da carteira serão recalculados.</p>"
        }${B ? `<section class="cc-reasons"><h3>O que precisa mudar</h3>${a.length ? a.map((Q) => `<p>${O(Q.message)}</p>`).join("") : "<p>Edite os dados deste lançamento conforme sua nota ou extrato.</p>"}${n.has("fx") ? "<p>Informe o câmbio usado neste lançamento, em reais por US$ 1. Use a nota ou o extrato da data da operação; o dólar atual não serve para corrigir o custo histórico.</p>" : ""}${a.some((Q) => Q.code === "oversell") ? "<p>Confira se falta uma compra anterior ou um evento corporativo. Se o registro estiver correto, feche esta janela e cadastre a movimentação que falta.</p>" : ""}</section><form id="cc-form"><div class="cc-grid">${u("tp", "Tipo", G, n.has("tp"))}${u("mk", "Mercado / moeda", { BR: "Brasil · BRL", US: "Estados Unidos · USD", CR: "Cripto · BRL" })}${E("tk", "Ativo")}${E("d", "Data", "date", n.has("d"))}${["C", "V", "P"].includes(B.tp) ? E("q", B.tp === "P" ? "Quantidade do provento (vazio = valor total)" : "Quantidade", "text", n.has("q")) : ""}${E("p", B.tp === "E" ? "Custo atribuído na bonificação" : B.tp === "P" ? "Valor por unidade ou total (conforme quantidade)" : "Preço unitário / valor", "text", n.has("p"))}${E("cs", "Taxas e custos", "text", n.has("cs"))}${B.mk === "US" ? E("fx", "Câmbio histórico · R$ por US$ 1", "text", n.has("fx")) : ""}${B.tp === "E" ? u("ev", "Evento", { desd: "Desdobramento", grup: "Grupamento", bonif: "Bonificação" }) + E("f", "Fator / percentual", "text", n.has("f")) : ""}${n.has("resolution") ? u("resolution", "Mesmo identificador de negócio", { "": "Escolha como tratar", distinct: "São movimentações diferentes · separar identificação" }, !0) : ""}${E("nota", "Anotação")}</div><p class="cc-error" role="alert"></p><div class="cc-actions"><button type="submit" class="btn">Salvar correção</button><button type="button" class="btn s" data-cc="close">Cancelar</button></div><p class="rs-note">Você está editando um registro existente. O aplicativo mantém uma cópia anterior no histórico local e recalcula a carteira. Não altera ordens na corretora.</p></form>` : ""}</div>`;
      }
      function c(g) {
        (s.TerminalResearch?.state &&
          document.getElementById("research-workbench")?.close(),
          s.TraderChat?.close(),
          tab !== "carteiras" && s.DIARIO_NAV.navigate("carteiras"),
          (s.PF.aba = "ativos"),
          (s.PF.amb = "mov"),
          (s.PF.sel = null),
          (s.PF.form = null),
          render(),
          (i = z()));
        const R = Number.isInteger(g) ? g : M()[0]?.index;
        (F ||
          ((F = document.createElement("dialog")),
          (F.id = "cc-editor"),
          (F.className = "wf-dialog cc-editor"),
          F.setAttribute("aria-label", "Corrigir movimentações da carteira"),
          document.body.append(F),
          F.addEventListener("click", (a) => {
            a.target.closest('[data-cc="close"]') && F.close();
          }),
          F.addEventListener("change", (a) => {
            if (a.target.matches('[data-cc="choose"]'))
              return P(Number(a.target.value));
            a.target.name &&
              B &&
              (Object.assign(
                B,
                Object.fromEntries(new FormData(F.querySelector("form"))),
              ),
              ["tp", "mk", "ev"].includes(a.target.name) && m());
          }),
          F.addEventListener("submit", q),
          F.addEventListener("close", () => {
            ((N = null), (B = null), (e = ""), s.TraderUI.refreshScroll());
          })),
          F.open || F.showModal(),
          R !== void 0 && Y()[R] ? P(R) : ((N = null), (B = null), m()),
          s.TraderUI.refreshScroll());
      }
      function q(g) {
        g.preventDefault();
        const R = F.querySelector(".cc-error");
        try {
          if (z() !== i)
            throw Error("A conta mudou. Feche e reabra a revisão.");
          if (S.del?.[Y()[N]?.id] && S.del[Y()[N].id] >= (+Y()[N].u || 0))
            throw Error(
              "Este lançamento foi excluído. Feche e reabra a carteira.",
            );
          if (JSON.stringify(Y()[N]) !== e)
            throw Error(
              "Este lançamento mudou durante a edição. Feche e reabra para evitar sobrescrever a alteração.",
            );
          const a = Object.fromEntries(new FormData(g.target)),
            n = j(Y(), N, a, Date.now(), uid());
          ((S.cart.lanc = n.rows),
            (s.PF.perfCache = null),
            (s.PF.qts = 0),
            save(),
            render());
          const f = n.remaining[0]?.index;
          f !== void 0
            ? (P(f),
              F.querySelector(".wf-content").insertAdjacentHTML(
                "afterbegin",
                '<p class="cc-status" role="status">Correção aplicada. Revise a próxima pendência. O estado do salvamento aparece na barra do aplicativo.</p>',
              ))
            : ((N = null),
              (B = null),
              m(
                "Correção aplicada. Nenhuma pendência restante. O estado do salvamento aparece na barra do aplicativo.",
              ));
        } catch (a) {
          R.textContent = a.message || String(a);
        }
      }
      function H() {
        (i !== null && z() !== i && F?.close(),
          tab === "carteiras" &&
            document.querySelectorAll('[data-pf^="del|"]').forEach((g) => {
              const R = g.dataset.pf.slice(4),
                a = Y()
                  .map((f, h) => ({ r: f, i: h }))
                  .filter((f) => f.r.id === R);
              if (
                a.length !== 1 ||
                g.parentElement.querySelector("[data-cc-index]")
              )
                return;
              const n = document.createElement("button");
              ((n.type = "button"),
                (n.className = "pfbt pfmini"),
                (n.dataset.ccIndex = a[0].i),
                (n.textContent = "Editar"),
                g.before(n));
            }));
      }
      (document.addEventListener(
        "click",
        (g) => {
          const R = g.target.closest("[data-cc-index]");
          R &&
            (g.preventDefault(),
            g.stopImmediatePropagation(),
            c(Number(R.dataset.ccIndex)));
        },
        !0,
      ),
        s.TraderUI.onRender("carteira-correcao", H),
        (s.CarteiraCorrection = { open: c, decorate: H }));
    })(typeof window > "u" ? globalThis : window),
    (() => {
      "use strict";
      const s = window.RevistaModel,
        l = "diario-revista-tecnica-v289",
        r = (n) => esc(String(n ?? "")),
        j = (n) =>
          typeof n == "number"
            ? n.toLocaleString("pt-BR", { maximumFractionDigits: 4 })
            : "Não disponível";
      let O = null,
        G = null,
        o = "",
        F = 0,
        N = !1;
      try {
        const n = JSON.parse(APP_STORAGE.getItem(l) || "null");
        n?.formato === s.VERSION && (O = n);
      } catch {}
      const e = () =>
          [0, 6].includes(new Date(s.spDate() + "T12:00:00Z").getUTCDay()),
        i = (n) => n?.formato === s.VERSION,
        B = () => {
          const n = typeof jrVer == "function" ? jrVer() : null;
          return i(n) ? n : O;
        },
        Y = () => i(JRN.arq) || (!JRN.arq && (N || e()));
      function z(n) {
        ((O = n), (JRN.v = n), (JRN.arq = null));
        try {
          (APP_STORAGE.setItem(l, JSON.stringify(n)),
            APP_STORAGE.setItem("diario-jornal", JSON.stringify(n)));
        } catch {}
      }
      async function M(n = !1) {
        if (G) return G;
        const f = s.spDate(),
          h = s.windowFor(f).cutoff;
        return !n && O?.window?.cutoff === h
          ? (z(O), O)
          : !n && Date.now() - F < 6e4
            ? null
            : window.DIARIO_DEMO
              ? ((o = "Demonstração: fontes externas desativadas."), q(), null)
              : SESS?.at
                ? ((F = Date.now()),
                  (o = ""),
                  (JRN.busy = 1),
                  q(),
                  (G = (async () => {
                    try {
                      const Q = [
                          {
                            ticker: "IBOV",
                            name: "Ibovespa à vista",
                            request: "WIN",
                            scale: 1,
                          },
                          {
                            ticker: "USDBRL",
                            name: "Dólar à vista · USD/BRL",
                            request: "WDO",
                            scale: 0.001,
                          },
                          {
                            ticker: "PETR4",
                            name: "Petrobras PN",
                            request: "PETR4",
                            scale: 1,
                          },
                          {
                            ticker: "VALE3",
                            name: "Vale ON",
                            request: "VALE3",
                            scale: 1,
                          },
                          {
                            ticker: "ITUB4",
                            name: "Itaú Unibanco PN",
                            request: "ITUB4",
                            scale: 1,
                          },
                        ],
                        J = await Promise.allSettled(
                          Q.map(async (L) => {
                            const d = await rq("/functions/v1/candles", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  ativo: L.request,
                                  intervalo: "1d",
                                }),
                                signal: AbortSignal.timeout(25e3),
                              }),
                              $ = await d.json();
                            if (L.ticker === "IBOV" && $.simbolo !== "^BVSP")
                              throw Error(
                                "A fonte não confirmou o histórico do Ibovespa.",
                              );
                            if (L.ticker === "USDBRL" && $.simbolo !== "BRL=X")
                              throw Error(
                                "A fonte não confirmou o dólar à vista.",
                              );
                            if (
                              !["IBOV", "USDBRL"].includes(L.ticker) &&
                              $.proxy
                            )
                              throw Error(
                                "Histórico substituto não aceito para este estudo.",
                              );
                            if (!Array.isArray($.candles))
                              throw Error("Histórico não retornado.");
                            return {
                              ...L,
                              bars: $.candles.map((w) =>
                                w.map((b, y) =>
                                  y > 0 && y < 5 ? b * L.scale : b,
                                ),
                              ),
                              source: "Yahoo Finance · " + $.simbolo,
                              sourceSymbol: $.simbolo,
                              queried: new Date().toISOString(),
                            };
                          }),
                        );
                      let v = null;
                      try {
                        v = await window.TRM?.trFn(
                          "cot",
                          { s: ["WINFUT", "WDOFUT"] },
                          0,
                        );
                      } catch {}
                      const I = Q.map((L, d) =>
                        J[d].status === "fulfilled"
                          ? J[d].value
                          : {
                              ...L,
                              bars: [],
                              error: String(
                                J[d].reason?.message || J[d].reason,
                              ),
                            },
                      );
                      if (
                        !I.some((L) => L.bars.length >= 30) &&
                        !(v?.itens || []).some((L) => L.px != null)
                      )
                        throw Error(
                          "Nenhuma fonte retornou dados suficientes. A revista anterior não foi trocada.",
                        );
                      const k = s.build({
                        reference: f,
                        assets: I,
                        snapshot: v,
                      });
                      return (z(k), k);
                    } catch (Q) {
                      return ((o = Q.message || String(Q)), null);
                    } finally {
                      ((G = null), (JRN.busy = 0), q());
                    }
                  })()),
                  G)
                : ((o =
                    "Entre na conta para consultar o histórico e fechar a revista."),
                  q(),
                  null);
      }
      function E(n) {
        return `<div class="rv-scenarios">${n.scenarios.map((f) => `<article><b>${r(f.name)}</b><p>${r(f.condition)}</p><strong>${f.trigger != null ? j(f.trigger) : j(f.low) + " a " + j(f.high)}</strong><small>Reavaliar: ${r(f.invalidation)}</small></article>`).join("")}</div>`;
      }
      function u(n) {
        if (!n.available)
          return `<section class="rv-study"><h2>${r(n.ticker)} · ${r(n.name)}</h2><p class="rv-missing">${r(n.reason)}</p></section>`;
        const f = n.bars.map((h) => ({ date: s.date(h[0]), value: h[4] }));
        return `<section class="rv-study"><div class="rv-kicker">ESTUDO TÉCNICO · ${r(n.asOf)}</div><h2>${r(n.ticker)} · ${r(n.name)}</h2><p>Estrutura diária: <b>${r(n.dailyTrend)}</b> · semanal: <b>${r(n.weeklyTrend)}</b> · variação da última semana disponível: <b>${j(n.weeklyReturn)}%</b></p>${window.CarteiraExperience?.svgLine(f.slice(-120), n.ticker + " · fechamentos diários") || ""}<p class="rv-source">${r(n.source)} · ${r(n.from)} a ${r(n.asOf)}. O gráfico mostra fechamentos observados.</p><div class="rv-metrics"><span>Fechamento <b>${j(n.close)}</b></span><span>MM20 <b>${j(n.ma20)}</b></span><span>MM50 <b>${j(n.ma50)}</b></span><span>MM200 <b>${j(n.ma200)}</b></span><span>RSI14 <b>${j(n.rsi)}</b></span></div><p>Diário: preço e ordenação das MM20/MM50. Semanal: preço e ordenação das médias de 10/40 semanas. Uma estrutura indefinida pede confirmação; médias descrevem o histórico e podem atrasar reversões.</p>${E(n)}</section>`;
      }
      function P(n) {
        return `<section class="rv-study"><div class="rv-kicker">CONTRATO FUTURO · COBERTURA LIMITADA</div><h2>${r(n.ticker)} · ${r(n.name)}</h2>${n.available ? `<p>${r(n.symbol)} · consulta ${r(n.queried || "sem horário")}</p><div class="rv-metrics"><span>Último informado <b>${j(n.price)}</b></span><span>Máxima da amostra <b>${j(n.high)}</b></span><span>Mínima da amostra <b>${j(n.low)}</b></span></div><p class="rv-missing">${r(n.note)}</p><p>Acima de ${j(n.high)}: acompanhar a sustentação e reavaliar se retornar à faixa. Abaixo de ${j(n.low)}: acompanhar a continuidade e reavaliar se recuperar a faixa. Entre as referências: aguardar definição. Esses níveis pertencem ao snapshot do futuro, não ao gráfico do ativo à vista.</p>` : `<p class="rv-missing">${r(n.reason)}</p>`}</section>`;
      }
      function m() {
        const n = B();
        return n
          ? `<article class="rv-magazine"><header class="rv-cover"><span>JORNAL DO PREGÃO · EDIÇÃO DE ESTUDOS</span><h1>Revista da Semana</h1><p>Cenários técnicos · ${r(n.window.from)} a ${r(n.window.to)}</p><small>Corte: ${r(n.window.cutoff)} · cada ativo informa a última sessão realmente disponível.</small></header>${o ? `<p class="warn">${r(o)} Exibindo a edição anterior com a referência acima.</p>` : ""}<section class="rv-intro"><h2>Mapa da edição</h2><p>Ibovespa, dólar à vista, contratos futuros e ações de referência. Leitura original para preparar a semana, com condições de confirmação e invalidação. A abertura efetiva depende do calendário de negociação e dos feriados.</p><p class="rv-source">Esta edição substitui as matérias de notícias do fim de semana por estudos. O PDF inclui gráficos diários e semanais. Não há previsão garantida, notícia gerada ou probabilidade atribuída aos cenários.</p></section>${n.studies.slice(0, 2).map(u).join("")}${n.futures.map(P).join("")}${n.studies.slice(2).map(u).join("")}<section class="rv-study"><h2>Plano para a próxima sessão</h2><ol><li>Conferir agenda, feriados e vencimento do contrato.</li><li>Atualizar os níveis com dados da abertura.</li><li>Escrever cenário principal, alternativo e invalidação no diário.</li><li>Dimensionar o risco antes da decisão e revisar o checklist.</li></ol><button class="btn s" data-navroute="dia:ed">Levar a preparação ao diário</button></section></article>`
          : `<div class="rv-empty">${JRN.busy ? "Consultando séries para a revista técnica…" : r(o || "A revista técnica ainda não foi carregada.")}<p><button class="btn" data-revista="refresh">Gerar revista técnica</button></p></div>`;
      }
      function c() {
        return `<div class="card rv-shell"><div class="rv-toolbar"><b>Jornal · fim de semana</b><div><button class="btn s" data-revista="refresh"${JRN.busy ? " disabled" : ""}>${JRN.busy ? "Consultando…" : "Atualizar estudos"}</button><button class="btn" data-revista="pdf">PDF da revista</button>${e() ? "" : '<button class="btn s" data-revista="daily">Jornal diário</button>'}</div></div><div id="revista-body">${m()}</div></div>`;
      }
      function q() {
        const n = document.getElementById("revista-body");
        n
          ? (n.innerHTML = m())
          : tab === "mercado" && MKT.tab === "jr" && render();
      }
      const H = vJornal;
      vJornal = function () {
        return Y()
          ? (!O && !G && !o
              ? setTimeout(() => M(!1), 0)
              : O &&
                O.window.cutoff !== s.windowFor(s.spDate()).cutoff &&
                !G &&
                !o &&
                setTimeout(() => M(!1), 0),
            c())
          : (JRN.v?.materias &&
              (JRN.v = { ...JRN.v, materias: s.dedupe(JRN.v.materias) }),
            H.apply(this, arguments));
      };
      const g = jrCarrega;
      jrCarrega = function (n) {
        return (N || e()) && !JRN.arq ? M(!!n) : g.apply(this, arguments);
      };
      const R = jrPdf;
      ((jrPdf = async function () {
        if (Y() || jrVer()?.edicao === "fds") {
          if (
            (JRN.arq || (N = !0),
            (!i(B()) ||
              (!JRN.arq &&
                B()?.window.cutoff !== s.windowFor(s.spDate()).cutoff)) &&
              !(await M(!0)))
          )
            return toast(o || "Não foi possível gerar a revista.");
          const n = B();
          return rpAbrir(
            "Revista da Semana",
            "revista-semana-" + n.window.from + ".pdf",
            () => TraderReports.technicalMagazinePdf(n),
          );
        }
        return R.apply(this, arguments);
      }),
        window.addEventListener(
          "click",
          (n) => {
            const f = n.target.closest(
              "[data-revista], [data-jrpdf], [data-jrrf]",
            );
            if (!f) return;
            const h = typeof jrVer == "function" ? jrVer() : null;
            if (!(!f.dataset.revista && !Y() && h?.edicao !== "fds")) {
              if (
                (n.preventDefault(),
                n.stopImmediatePropagation(),
                f.dataset.revista === "daily")
              ) {
                ((N = !1),
                  (JRN.arq = null),
                  i(JRN.v) && (JRN.v = null),
                  render());
                return;
              }
              if (f.dataset.revista === "open") {
                ((N = !0), (JRN.arq = null), render(), M(!1));
                return;
              }
              f.dataset.revista === "refresh" || f.hasAttribute("data-jrrf")
                ? ((N = !0), M(!0))
                : jrPdf();
            }
          },
          !0,
        ));
      const a = vMercado;
      ((vMercado = function () {
        const n = typeof jrVer == "function" ? jrVer() : null;
        if (MKT.tab === "jr" && JRN.arq?.edicao === "fds" && !i(n))
          return '<div class="card"><h2>Arquivo da edição antiga</h2><p>Esta edição foi montada no formato de notícias. Abra a revista técnica atual para obter os novos estudos, sem alterar o arquivo guardado.</p><button class="btn" data-revista="refresh">Abrir revista técnica atual</button></div>';
        const f = a.apply(this, arguments);
        return MKT.tab === "jr" && !e() && !Y()
          ? '<div class="card"><div class="top"><div><b>Revista técnica de fim de semana</b><p class="sm mut">Estudos e cenários da semana, separados das notícias do dia.</p></div><button class="btn s" data-revista="open">Abrir revista</button></div></div>' +
              f
          : f;
      }),
        (window.RevistaTecnica = {
          load: M,
          body: m,
          shell: c,
          shouldUse: Y,
          selected: B,
          setPaper: z,
        }));
    })(),
    (function (s) {
      "use strict";
      let l = 0;
      const r = {
          home: "Início",
          dia: "Meu dia",
          ops: "Operações",
          trades: "Trades",
          stats: "Estatísticas",
          mercado: "Mercado",
          term: "Terminal",
          mais: "Configurações",
        },
        j = {
          "×": "Fechar",
          "✕": "Fechar",
          "↻": "Atualizar",
          "⟳": "Atualizar",
          "🔄": "Atualizar",
          "?": "Ajuda",
          "…": "Mais opções",
          "⋮": "Mais opções",
          "☰": "Abrir menu",
          "+": "Adicionar",
          "＋": "Adicionar",
          "−": "Diminuir",
        };
      function O(i) {
        for (const B of i.querySelectorAll("button")) {
          if (B.hasAttribute("aria-label") || B.hasAttribute("aria-labelledby"))
            continue;
          const Y = B.textContent.trim(),
            z = B.title || r[B.dataset.tab] || j[Y];
          z && B.setAttribute("aria-label", z);
        }
      }
      function G(i) {
        for (const B of i.querySelectorAll(
          "input:not([type=hidden]),select,textarea",
        )) {
          if (
            B.closest("label") ||
            B.hasAttribute("aria-label") ||
            B.hasAttribute("aria-labelledby") ||
            (B.id &&
              i.querySelector(
                `label[for="${s.CSS?.escape ? s.CSS.escape(B.id) : B.id.replace(/[^\w-]/g, "")}"]`,
              ))
          )
            continue;
          const Y = B.previousElementSibling;
          Y?.tagName === "LABEL" && !Y.querySelector("input,select,textarea")
            ? (B.id || (B.id = "ui-field-" + ++l), (Y.htmlFor = B.id))
            : B.placeholder &&
              /[a-zÀ-ÿ]/i.test(B.placeholder) &&
              B.setAttribute("aria-label", B.placeholder);
        }
      }
      function o(i) {
        for (const B of i.querySelectorAll("table")) {
          if (B.closest(".trm,.ui-table-scroll,.anxt,[data-ui-scroll]"))
            continue;
          const Y = B.parentElement;
          if (
            !Y ||
            /auto|scroll/.test(Y.style.overflowX) ||
            Y.classList.contains("xt-w")
          )
            continue;
          const z = s.document.createElement("div");
          ((z.className = "ui-table-scroll"),
            z.setAttribute("role", "region"),
            z.setAttribute(
              "aria-label",
              B.caption?.textContent?.trim() ||
                "Tabela de dados · deslize para ver todas as colunas",
            ),
            (z.tabIndex = 0),
            Y.insertBefore(z, B),
            z.appendChild(B),
            B.rows[0]?.cells.length > 5 && z.classList.add("ui-table-wide"));
          for (const M of B.querySelectorAll("thead th"))
            M.hasAttribute("scope") || (M.scope = "col");
        }
      }
      function F(i) {
        if (i) {
          (O(i), G(i), o(i));
          for (const B of i.querySelectorAll('a[target="_blank"]')) {
            const Y = new Set((B.rel || "").split(/\s+/).filter(Boolean));
            (Y.add("noopener"), (B.rel = [...Y].join(" ")));
          }
        }
      }
      function N() {
        const i = s.document.getElementById("app");
        i &&
          ((i.dataset.screen = typeof tab == "string" ? tab : ""),
          i.classList.toggle("ui-standard-screen", tab !== "term"),
          F(i),
          O(s.document.querySelector("nav") || s.document));
      }
      function e() {
        F(s.document.getElementById("sh"));
      }
      (s.TraderUI.onRender("interface-acabamento", N),
        s.TraderUI.onSheet("interface-acabamento", e),
        (s.DiarioAcabamento = Object.freeze({
          enhance: F,
          screen: N,
          sheet: e,
        })),
        N(),
        e());
    })(window),
    (function (s) {
      "use strict";
      const l = (o) =>
          String(o ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ""),
        r = {
          id: [
            "tradeid",
            "idnegocio",
            "numeronegocio",
            "numerodonegocio",
            "negocio",
            "id",
          ],
          ticker: ["ticker", "ativo", "codigo"],
          stamp: ["tradedat", "datahora", "timestamp"],
          date: ["data", "date"],
          time: ["hora", "horario", "time"],
          price: ["price", "preco", "valor"],
          quantity: ["quantity", "quantidade", "qtd"],
          side: ["side", "agressao", "agressor", "tipodeagressao"],
          buyer: ["buyer", "compradora", "comprador", "corretoracompradora"],
          seller: ["seller", "vendedora", "vendedor", "corretoravendedora"],
        };
      function j(o) {
        if (typeof o != "string" || o.length > 5 * 1024 * 1024)
          throw Error(
            "Use um CSV de até 5 MB. Divida exportações maiores por ativo e data.",
          );
        o = o.replace(/^\uFEFF/, "");
        const F = o.split(/\r?\n/, 1)[0],
          e = [";", ",", "	"]
            .map((P) => [P, F.split(P).length])
            .sort((P, m) => m[1] - P[1])[0][0],
          i = [];
        let B = [],
          Y = "",
          z = !1;
        for (let P = 0; P < o.length; P++) {
          const m = o[P];
          if (
            (m === '"'
              ? z && o[P + 1] === '"'
                ? ((Y += '"'), P++)
                : (z = !z)
              : m === e && !z
                ? (B.push(Y), (Y = ""))
                : (m ===
                      `
` ||
                      m === "\r") &&
                    !z
                  ? (m === "\r" &&
                      o[P + 1] ===
                        `
` &&
                      P++,
                    B.push(Y),
                    B.some((c) => c.trim()) && i.push(B),
                    (B = []),
                    (Y = ""))
                  : (Y += m),
            i.length > 5001)
          )
            throw Error("Máximo de 5.000 negócios por arquivo.");
        }
        if (z)
          throw Error(
            "CSV com aspas sem fechamento. Exporte novamente o arquivo.",
          );
        if ((B.push(Y), B.some((P) => P.trim()) && i.push(B), i.length > 5001))
          throw Error("Máximo de 5.000 negócios por arquivo.");
        if (i.length < 2)
          throw Error("O arquivo precisa de cabeçalho e linhas de negócios.");
        const M = i.shift().map(l);
        if (new Set(M).size !== M.length)
          throw Error("Há nomes de colunas repetidos no CSV.");
        const E = Object.fromEntries(
            Object.entries(r).map(([P, m]) => [
              P,
              m.map((c) => M.indexOf(c)).find((c) => c >= 0) ?? -1,
            ]),
          ),
          u = ["id", "ticker", "price", "quantity"].filter((P) => E[P] < 0);
        if (
          (E.stamp < 0 && (E.date < 0 || E.time < 0) && u.push("data e hora"),
          u.length)
        )
          throw Error(
            "Colunas obrigatórias não encontradas: " +
              u
                .map(
                  (P) =>
                    ({
                      id: "ID do negócio (não ID da ordem)",
                      ticker: "Ativo",
                      price: "Preço",
                      quantity: "Quantidade",
                    })[P] || P,
                )
                .join(", ") +
              ". Exporte o Times & Trades, não o relatório das suas ordens.",
          );
        return { columns: E, lines: i };
      }
      function O(o) {
        const F = String(o || "").trim(),
          N = F.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](.+)$/);
        let e = N ? `${N[3]}-${N[2]}-${N[1]}T${N[4]}` : F.replace(" ", "T");
        if (
          ((e = e.replace(/,(\d{1,6})/g, ".$1")),
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/.test(
            e,
          ) ||
            +e.slice(11, 13) > 23 ||
            +e.slice(14, 16) > 59 ||
            +e.slice(17, 19) > 59)
        )
          return null;
        const i = e.slice(0, 10);
        if (
          Number.isNaN(Date.parse(i + "T12:00:00Z")) ||
          new Date(i + "T12:00:00Z").toISOString().slice(0, 10) !== i
        )
          return null;
        /(?:Z|[+-]\d{2}:\d{2})$/.test(e) || (e += "-03:00");
        const B = Date.parse(e);
        return Number.isFinite(B) ? new Date(B).toISOString() : null;
      }
      async function G(o, F = Date.now()) {
        const { columns: N, lines: e } = j(o),
          i = new Map(),
          B = [];
        let Y = 0;
        for (let z = 0; z < e.length; z++) {
          const M = e[z],
            E = (h) => (N[h] >= 0 ? String(M[N[h]] ?? "").trim() : ""),
            u = E("id"),
            P = E("ticker").toUpperCase(),
            m = s.CarteiraCalculo.num(E("price")),
            c = s.CarteiraCalculo.num(E("quantity")),
            q = O(E("stamp") || E("date") + " " + E("time"));
          if (
            !u ||
            u.length > 160 ||
            !/^[A-Z0-9.]{1,18}$/.test(P) ||
            !(m > 0 && m < 1e12) ||
            !(c > 0 && c < 1e15) ||
            !q ||
            Date.parse(q) < Date.parse("2000-01-01") ||
            Date.parse(q) > F + 3e5
          ) {
            B.push(z + 2);
            continue;
          }
          const H = new Date(Date.parse(q) - 3 * 36e5)
              .toISOString()
              .slice(0, 10),
            g = P + "|" + H + "|" + u,
            R = await s.crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(g),
            ),
            a = [...new Uint8Array(R)]
              .map((h) => h.toString(16).padStart(2, "0"))
              .join(""),
            n = l(E("side")),
            f = {
              trade_id: a,
              ticker: P,
              traded_at: q,
              price: m,
              quantity: c,
              side: [
                "buy",
                "compra",
                "comprador",
                "compradora",
                "agressaocompra",
              ].includes(n)
                ? "buy"
                : [
                      "sell",
                      "venda",
                      "vendedor",
                      "vendedora",
                      "agressaovenda",
                    ].includes(n)
                  ? "sell"
                  : "unknown",
              buyer: E("buyer").slice(0, 100) || null,
              seller: E("seller").slice(0, 100) || null,
              source: "Profit CSV",
            };
          if (i.has(a)) {
            if (JSON.stringify(i.get(a)) !== JSON.stringify(f))
              throw Error(
                "O mesmo ID de negócio aparece com dados diferentes na linha " +
                  (z + 2) +
                  ". Confira a exportação.",
              );
            Y++;
          }
          i.set(a, f);
        }
        if (!i.size)
          throw Error(
            "Nenhuma linha válida. Confira ID do negócio, ativo, data completa, preço e quantidade.",
          );
        return {
          records: [...i.values()],
          invalid: B,
          duplicate: Y,
          total: e.length,
        };
      }
      s.FluxoImportacao = { parse: G, csv: j, timestamp: O };
    })(typeof window > "u" ? globalThis : window),
    (() => {
      "use strict";
      const s = window.TerminalResearchModel,
        l = () => window.TRM,
        r = (oe) => esc(String(oe ?? "")),
        j = (oe, ee = 2) =>
          s.finite(oe)
            ? oe.toLocaleString("pt-BR", {
                maximumFractionDigits: ee,
                minimumFractionDigits: ee,
              })
            : "—",
        O = (oe) =>
          ({
            "Basic Materials": "Materiais básicos",
            "Financial Services": "Serviços financeiros",
            Financials: "Financeiro",
            Industrials: "Indústria",
            Technology: "Tecnologia",
            Healthcare: "Saúde",
            Energy: "Energia",
            Utilities: "Serviços públicos",
            "Real Estate": "Imobiliário",
            "Consumer Cyclical": "Consumo cíclico",
            "Consumer Defensive": "Consumo não cíclico",
            "Communication Services": "Comunicações",
          })[oe] || oe,
        G = (oe, ee) =>
          oe === "marketcap" && s.finite(ee)
            ? ee.toLocaleString("pt-BR", {
                notation: "compact",
                maximumFractionDigits: 2,
              })
            : j(ee),
        o = {
          view: "ativo",
          ticker: "PETR4",
          compare: [],
          loaded: {},
          news: {},
          radar: [],
          radarAt: null,
          flow: [],
          flowDate: "",
          flowStatus: "idle",
          flowAt: null,
          flowLatest: null,
          flowImport: null,
          flowAuto: !1,
          busy: !1,
          message: "",
          shock: -10,
          weights: {},
          owner: null,
          ownerId: null,
        };
      let F = null,
        N = 0,
        e = null;
      const i = (oe) => `<p class="rs-note">${r(oe)}</p>`,
        B = (oe, ee, ae = "") =>
          `<button type="button" class="rs-button" data-rs="${oe}" ${ae}>${r(ee)}</button>`;
      function Y() {
        try {
          return pfCalc().pos || [];
        } catch {
          return [];
        }
      }
      function z() {
        const oe = window.PFX?.WL?.(),
          ee = [
            ...Y().map((ae) => ae.tk),
            ...(Array.isArray(oe) ? oe : []).map((ae) => ae.tk),
          ];
        return [...new Set(ee)].slice(0, 8);
      }
      function M() {
        return S.ax?.research || {};
      }
      function E(oe) {
        ((S.ax ??= {}), (S.ax.research = { ...M(), ...oe }), save());
      }
      function u(oe) {
        const ee = o.loaded[oe] || l()?.trGet("fund", { tk: oe })?.v || {},
          ae = window.PFX?.META?.()?.[oe] || {};
        return s.fundamental(oe, ee, ae);
      }
      function P(oe) {
        return l()?.tec?.velas(oe, "1d")?.L || [];
      }
      function m(oe, ee) {
        try {
          const ae = new URL(oe);
          return ae.protocol !== "https:"
            ? r(ee)
            : `<a href="${r(ae.href)}" target="_blank" rel="noopener noreferrer">${r(ee)}</a>`;
        } catch {
          return r(ee);
        }
      }
      function c(oe, ee) {
        return `<div class="rs-table" tabindex="0" role="region" aria-label="Tabela de pesquisa"><table><thead><tr>${oe.map((ae) => `<th scope="col">${r(ae)}</th>`).join("")}</tr></thead><tbody>${ee.map((ae) => "<tr>" + ae.map((se, me) => `<${me ? "td" : 'th scope="row"'}>${se}</${me ? "td" : "th"}>`).join("") + "</tr>").join("")}</tbody></table></div>`;
      }
      function q(oe, ee) {
        const ae = oe.filter((Ae) => s.finite(Ae.value));
        if (ae.length < 2)
          return i("Histórico insuficiente para " + ee.toLowerCase() + ".");
        const se = Math.min(...ae.map((Ae) => Ae.value)),
          me = Math.max(...ae.map((Ae) => Ae.value)),
          ve = me - se || 1,
          Me = (Ae) => 54 + (Ae / (ae.length - 1)) * 574,
          xe = (Ae) => 166 - ((Ae - se) / ve) * 126;
        return `<figure class="rs-chart"><figcaption>${r(ee)}</figcaption><svg viewBox="0 0 680 208" role="img" aria-label="${r(ee)}"><title>${r(ee)}</title>${[se, (se + me) / 2, me].map((Ae) => `<line x1="54" x2="628" y1="${xe(Ae)}" y2="${xe(Ae)}" class="rs-grid"/><text x="8" y="${xe(Ae) + 4}">${r(j(Ae, 0))}</text>`).join("")}<path d="${ae.map((Ae, Se) => (Se ? "L" : "M") + Me(Se).toFixed(2) + "," + xe(Ae.value).toFixed(2)).join(" ")}"/><text x="54" y="195">${r(ae[0].date)}</text><text x="628" y="195" text-anchor="end">${r(ae.at(-1).date)}</text></svg></figure>`;
      }
      function H(oe, ee, ae, se = "text") {
        return `<label>${r(oe)}<input name="${ee}" type="${se}" value="${r(ae ?? "")}" ${se === "number" ? 'step="any"' : ""}></label>`;
      }
      const g = {
        ativo: ["Analisar ativo", "Fundamentos, resultados e sua tese"],
        comparar: ["Comparar ativos", "Indicadores lado a lado"],
        radar: ["Buscar oportunidades", "Filtros de empresas no Brasil e EUA"],
        risco: ["Risco da carteira", "Correlação, cenários e exposição"],
      };
      function R() {
        const oe = o.view === "fluxo";
        return `<header class="rs-header"><div><small>${oe ? "TERMINAL · FLUXO" : "PESQUISA DE MERCADO"}</small><h2>${oe ? "Fluxo de negócios" : "Pesquisa de investimentos"}</h2></div>${B("close", "Fechar")}</header>${
          oe
            ? ""
            : `<div class="rs-tabs" role="navigation" aria-label="Pesquisa">${Object.entries(
                g,
              )
                .map(
                  ([ee, [ae, se]]) =>
                    `<button type="button" class="rs-button" data-rs="view" data-view="${ee}" aria-current="${o.view === ee ? "page" : "false"}"><b>${ae}</b><small>${se}</small></button>`,
                )
                .join("")}</div>`
        }`;
      }
      function a() {
        const oe = {
            ativo: [
              "Análise de um ativo",
              "Digite um código, como PETR4, e toque em Atualizar dados. Os fundamentos, balanços e histórico da sua tese aparecem abaixo.",
            ],
            comparar: [
              "Comparação de fundamentos",
              "Digite de 2 a 6 códigos separados por espaço. No celular, cada ativo tem uma ficha; a tabela completa permite comparar os indicadores.",
            ],
            radar: [
              "Busca por indicadores",
              "Defina o mercado e os filtros desejados. O resultado é uma seleção da fonte consultada, não uma recomendação de compra.",
            ],
            risco: [
              "Entenda o risco da sua carteira",
              "Veja como as posições se relacionam e simule mudanças de preço. As simulações não alteram seus lançamentos.",
            ],
            fluxo: [
              "Times & Trades da sua ponte",
              "Consulte negócios executados por ativo e data. Esta área é independente da carteira e depende da captura configurada no Profit.",
            ],
          },
          [ee, ae] = oe[o.view];
        return `<section class="rs-intro"><h3>${ee}</h3>${i(ae)}</section>`;
      }
      function n() {
        const oe = o.ticker,
          ee = u(oe),
          ae = Y().find((xe) => xe.tk === oe),
          se = l()?.trGet("cot", { s: [oe] })?.v?.itens?.[0] || {},
          me = l()?.melhorPx(oe, se) || {},
          ve = ee.annual,
          Me = s.normalizeNews(o.news[oe] || []);
        return `<form data-rsform="ativo" class="rs-controls">${H("Ativo", "ticker", oe)}<button class="rs-button" type="submit">Consultar ativo</button></form><div class="rs-title"><div><h3>${r(oe)}</h3><p>${r(ee.name)} · ${r(O(ee.sector))}</p></div><div><b>${j(me.px ?? (ae?.tem ? ae.pa : null))}</b><small class="${s.finite(me.d1) ? (me.d1 < 0 ? "r" : "g") : ""}">${r(ee.currency)} · ${s.finite(me.d1) && me.d1 > 0 ? "+" : ""}${j(me.d1)}%</small></div></div>
   ${i(me.px == null && ae?.tem ? "Carteira · preço registrado: " + (ae.pxEm || "data não informada") + ". Atualize para consultar uma cotação." : "Cotação: " + (me.fonte || "não disponível") + " · horário do preço: " + (me.horarioPreco || "não informado") + ". " + (me.fonte === "Profit" ? "Recepção da ponte: " + (me.ts ? new Date(me.ts).toLocaleString("pt-BR") : "não informada") + ". Não equivale ao horário de negócio." : "Atraso: " + (me.atraso === !1 ? "conforme fonte" : "não confirmado") + "."))}<div class="rs-actions">${B("graph", "Gráfico")}${B("news", "Notícias no terminal")}${B("income", "Proventos")}${B("ai", "Perguntar à IA")}</div>
   ${i("Fundamentos consultados: " + (ee.queried ? new Date(ee.queried).toLocaleString("pt-BR") : "ainda não carregados") + ". Data contábil: " + (ee.accountingRef || "ver períodos no histórico") + ". A consulta não comprova atualização do balanço.")}
   <details class="rs-section"><summary>Entenda os principais indicadores</summary>${i("P/L: preço dividido pelo lucro por ação. P/VP: preço dividido pelo patrimônio por ação. EV/EBITDA: valor da empresa em relação ao resultado operacional antes de juros, impostos, depreciação e amortização. DY: proventos em relação ao preço, conforme o período da fonte. ROE: lucro em relação ao patrimônio. Margem líquida: parcela da receita que virou lucro. Valores ausentes aparecem como traço; não são zero.")}</details>${c(
     ["Indicador", "Valor", "Fonte"],
     s.fields.map(([xe, Ae, Se]) => [
       r(Ae),
       G(xe, ee.metric[xe]) +
         (ee.metric[xe] !== null
           ? " " + r(Se === "moeda" ? ee.currency : Se)
           : ""),
       r(ee.origin[xe] || "Indisponível"),
     ]),
   )}
   ${ae ? '<details class="rs-section"><summary>Sua posição</summary>' + c(["Quantidade", "Preço médio", "Valor da posição", "Peso"], [[j(ae.q, 4), j(ae.pm, 4), j(ae.tem ? ae.v : null), j(ae.peso) + "%"]]) + i("Posição cadastrada na carteira; valor consolidado em BRL, sujeito à cobertura do câmbio.") + "</details>" : ""}
   <section class="rs-section"><h3>Resultados ao longo do tempo</h3>${q(
     ve.map((xe) => ({ date: xe.date, value: xe.revenue })),
     "Receita anual · " + ee.financialCurrency,
   )}${q(
     ve.map((xe) => ({ date: xe.date, value: xe.profit })),
     "Lucro líquido anual · " + ee.financialCurrency,
   )}${
     ve.length
       ? c(
           ["Ano", "Receita", "Lucro"],
           ve.map((xe) => [r(xe.date), j(xe.revenue), j(xe.profit)]),
         )
       : ""
   }</section>
   ${window.ResearchAdvanced?.assetSections(oe, o.loaded[oe] || l()?.trGet("fund", { tk: oe })?.v || {}) || ""}<section class="rs-section"><h3>Notícias do ativo</h3>${
     Me.length
       ? Me.slice(0, 12)
           .map(
             (xe) =>
               `<article class="rs-news"><b>${r(xe.title)}</b><small>${r(xe.date || "Data não informada")}</small><div>${xe.links.map((Ae) => m(Ae.url, Ae.source)).join(" · ")}</div></article>`,
           )
           .join("")
       : i(
           "Atualize os dados para consultar notícias. Manchetes iguais são agrupadas; não se presume que toda notícia tenha sentimento classificado.",
         )
   }</section>
   <details class="rs-section"><summary>Fontes e integração Economatica</summary>${i((ee.sources || []).join(" · ") || "Fontes do serviço de fundamentos já integrado ao aplicativo.")}${i("Economatica: não conectada. Credenciais, documentação técnica e módulos contratados ainda precisam ser disponibilizados. Nenhum dado desta tela é atribuído à Economatica.")}</details>`;
      }
      function f() {
        const oe = o.compare.length ? o.compare : z().slice(0, 4),
          ee = oe.map(u);
        return `<form data-rsform="comparar" class="rs-controls">${H("De 2 a 6 ativos", "tickers", oe.join(" "))}<button type="submit" class="rs-button">Comparar</button>${B("refresh", "Atualizar")}</form>${i("Compare empresas do mesmo setor. Múltiplos de bancos, FIIs e empresas industriais não são diretamente equivalentes. Moedas e períodos precisam ser conferidos.")}
   ${ee.length ? '<div class="rs-mobile-comparison">' + ee.map((ae) => '<details class="rs-section" open><summary>' + r(ae.ticker) + " · " + r(O(ae.sector)) + "</summary><dl>" + s.fields.map(([se, me, ve]) => "<div><dt>" + r(me) + "</dt><dd>" + G(se, ae.metric[se]) + " " + r(ve === "moeda" ? ae.currency : ve) + "</dd></div>").join("") + "</dl></details>").join("") + "</div>" : ""}<details class="rs-comparison-table" open><summary>Tabela comparativa completa · deslize para os lados</summary>${ee.length ? c(["Indicador", ...ee.map((ae) => ae.ticker)], [[r("Setor"), ...ee.map((ae) => r(O(ae.sector)))], ...s.fields.map(([ae, se, me]) => [r(se + " · " + me), ...ee.map((ve) => G(ae, ve.metric[ae]) + (me === "moeda" ? " " + r(ve.currency) : ""))]), [r("Consulta"), ...ee.map((ae) => r(ae.queried?.slice(0, 10) || "Não carregado"))]]) : i("Escolha os ativos que deseja comparar.")}</details>
   ${B("comparechart", "Comparar desempenho no gráfico")}${B("export", "Exportar tabela CSV")}`;
      }
      function h() {
        const oe = M().filters || {},
          ee = [...new Set(o.radar.map((se) => se.sector))].sort(),
          ae = s.screen(o.radar, oe);
        return `<form data-rsform="radar"><div class="rs-controls"><label>Mercado<select name="market"><option value="brazil"${oe.market !== "america" ? " selected" : ""}>Brasil</option><option value="america"${oe.market === "america" ? " selected" : ""}>EUA</option></select></label>${H("DY mínimo (%)", "minDy", oe.minDy, "number")}${H("ROE mínimo (%)", "minRoe", oe.minRoe, "number")}${H("P/L máximo positivo", "maxPl", oe.maxPl, "number")}<button type="submit" class="rs-button">Pesquisar e salvar filtros</button></div><details><summary>Filtros adicionais</summary><div class="rs-controls">${H("Dívida líquida/EBITDA máxima", "maxDebt", oe.maxDebt, "number")}<label>Setor<select name="sector"><option value="">Todos</option>${ee.map((se) => `<option${oe.sector === se ? " selected" : ""}>${r(se)}</option>`).join("")}</select></label></div></details></form>
   ${i("Universo limitado aos até 40 resultados retornados pela fonte, não a todas as empresas da bolsa. Indicadores ausentes são excluídos quando há filtro correspondente. A busca usa o serviço existente de screening; não consome IA.")}
   ${o.radarAt ? i("Consulta: " + new Date(o.radarAt).toLocaleString("pt-BR") + " · " + ae.length + " de " + o.radar.length + " resultados atendem aos filtros locais.") : ""}
   ${
     ae.length
       ? c(
           ["Ativo", "Setor", "P/L", "DY %", "ROE %"],
           ae.map((se) => [
             B("select", se.ticker, `data-ticker="${r(se.ticker)}"`),
             r(O(se.sector)),
             j(se.metric.pl),
             j(se.metric.dy),
             j(se.metric.roe),
           ]),
         )
       : i("Nenhum resultado carregado ou compatível com os filtros.")
   }`;
      }
      function Q() {
        const oe = Y(),
          ee = oe.map((Re) => Re.tk).slice(0, 8),
          ae = Object.fromEntries(ee.map((Re) => [Re, P(Re)])),
          se = s.correlation(ae);
        let me = null,
          ve = [];
        try {
          const Re = window.TraderReports.portfolioInput();
          ((me = window.CarteiraFactsheetModel.performance(Re)),
            (ve = me.contributions || []));
        } catch {}
        const Me = s.scenarios(oe, { default: o.shock }),
          xe =
            new Set(
              oe
                .filter((Re) => ee.includes(Re.tk))
                .map((Re) => Re.moeda || (Re.mk === "US" ? "USD" : "BRL")),
            ).size <= 1,
          Ae = Object.fromEntries(
            ee.map((Re) => [
              Re,
              o.weights[Re] ?? (ee.length ? 100 / ee.length : 0),
            ]),
          ),
          Se = xe
            ? s.hypothetical(ae, Ae)
            : {
                points: [],
                reason:
                  "Simulação requer ativos na mesma moeda. Escolha uma carteira de uma única moeda para evitar misturar câmbios.",
              };
        return `<div class="rs-actions">${B("refresh", "Atualizar carteira e séries")}${B("report", "Exportar relatório da carteira")}${B("ledger", "Ver lançamentos da carteira")}</div><section class="rs-section"><h3>Quem contribuiu para o resultado</h3>${
          ve.length
            ? c(
                ["Ativo", "Contribuição BRL"],
                ve.map((Re) => [r(Re.ticker), j(Re.value)]),
              )
            : i(me?.reason || "Carregue o histórico validado da carteira.")
        }${i("Contribuição da série calculada pelo aplicativo, com os fluxos e proventos registrados. Aportes não são lucro.")}</section>
   <section class="rs-section"><h3>Correlação entre posições</h3>${i("Valores próximos de +1 indicam movimentos parecidos; próximos de 0, pouca relação linear; negativos, movimentos opostos. Correlação passada não garante proteção.")}<details><summary>Período e método do cálculo</summary>${i(se.method + " Amostra: " + se.n + " intervalos; máximo de 8 posições nesta visão.")}</details>${
     se.n >= 20
       ? c(
           ["Ativo", ...se.keys],
           se.matrix.map((Re, Pe) => [
             r(se.keys[Pe]),
             ...Re.map(
               (je) =>
                 `<span class="rs-correlation ${je !== null && je < 0 ? "negative" : ""}">${j(je)}</span>`,
             ),
           ]),
         )
       : i(
           "São necessários ao menos 20 retornos em datas comuns para calcular correlação.",
         )
   }</section>
   <section class="rs-section"><h3>Teste de cenário</h3><form data-rsform="stress" class="rs-controls">${H("Variação hipotética em todas as posições (%)", "shock", o.shock, "number")}<button class="rs-button" type="submit">Calcular</button></form><strong>Impacto simulado: R$ ${j(Me.total)}</strong>${i("Choque uniforme aplicado ao valor atual coberto em BRL; câmbio mantido constante. Não é previsão nem VaR. Sem preço: " + (Me.missing.join(", ") || "nenhum ativo") + ".")}</section>
   <section class="rs-section"><h3>Carteira hipotética</h3><form data-rsform="weights"><div class="rs-controls">${ee.map((Re) => H(Re + " (%)", "weight_" + Re, Number(Ae[Re].toFixed(4)), "number")).join("")}<button class="rs-button" type="submit">Simular</button></div></form>${Se.points.length ? q(Se.points, "Evolução em base 100") : i(Se.reason)}${i(Se.method || "Escolha os pesos e carregue as séries. Nenhuma movimentação real é alterada.")}</section>${window.ResearchAdvanced?.riskSections(oe) || ""}`;
      }
      function J() {
        (clearInterval(e),
          (e = null),
          o.flowAuto &&
            (e = setInterval(() => {
              F?.open &&
                o.view === "fluxo" &&
                !document.hidden &&
                !o.busy &&
                !document.activeElement?.matches(
                  ".rs-controls input,input[type=file],select,textarea",
                ) &&
                V();
            }, 15e3)));
      }
      function v() {
        const oe = s.flow(o.flow),
          ee = oe.rows.slice(0, 150),
          ae = ee.length > 0,
          se = o.flowImport,
          me = {
            idle: [
              "Consulte os negócios ou importe uma exportação",
              "As cotações da ponte não contêm a lista de negócios. Para ver agressão e participantes, envie os dados do Times & Trades.",
            ],
            loading: [
              "Consultando sua conta…",
              "Buscando o ativo e a data escolhidos.",
            ],
            empty: [
              "Nenhum negócio recebido para este filtro",
              "Não há registros deste ativo e data na sua conta. Você pode abrir a última captura disponível, importar um CSV ou configurar o coletor no computador.",
            ],
            ready: [
              "Negócios carregados",
              "Amostra recebida da ponte ou de uma exportação importada.",
            ],
            error: [
              "Não foi possível consultar",
              "Confira a mensagem acima. Uma falha de conexão não significa que o mercado não teve negócios.",
            ],
          }[o.flowStatus];
        return `<section class="rs-flow-status" role="status"><h3>${me[0]}</h3>${i(me[1])}${o.flowAt ? i("Última consulta concluída: " + new Date(o.flowAt).toLocaleString("pt-BR")) : ""}${o.flowLatest ? B("flow-latest", "Abrir última captura · " + o.flowLatest.ticker + " · " + o.flowLatest.date) : ""}</section>
   <form data-rsform="fluxo" class="rs-controls">${H("Ativo", "ticker", o.ticker)}${H("Data do pregão (Brasília)", "date", o.flowDate || loc().slice(0, 10), "date")}<button class="rs-button" type="submit">${ae ? "Atualizar negócios" : "Consultar negócios"}</button></form>
   <details class="rs-section"${ae ? "" : " open"}><summary>Importar negócios do Profit</summary>${i("Selecione um CSV exportado do Times & Trades. A leitura faz uma prévia; nada é enviado antes de você tocar em Importar. Não use o relatório das suas ordens pessoais.")}<label>CSV de negócios · até 5 MB<input type="file" accept=".csv,text/csv,text/plain" data-flow-file${o.busy ? " disabled" : ""}></label>${
     se
       ? `<p>${se.records.length} negócios únicos · ${se.invalid.length} linhas inválidas · ${se.duplicate} repetições ignoradas.</p>${i("Ativos: " + [...new Set(se.records.map((ve) => ve.ticker))].join(", ") + ". Datas em Brasília: " + [...new Set(se.records.map((ve) => new Date(Date.parse(ve.traded_at) - 108e5).toISOString().slice(0, 10)))].join(", "))}${se.invalid.length ? i("Linhas não importadas: " + se.invalid.slice(0, 20).join(", ") + (se.invalid.length > 20 ? "…" : "")) : ""}${c(
           ["Ativo", "Data/hora BRT", "Preço", "Quantidade", "Agressão"],
           se.records
             .slice(0, 5)
             .map((ve) => [
               r(ve.ticker),
               r(
                 new Date(ve.traded_at).toLocaleString("pt-BR", {
                   timeZone: "America/Sao_Paulo",
                 }),
               ),
               j(ve.price, 4),
               j(ve.quantity, 0),
               r(
                 ve.side === "buy"
                   ? "Compra"
                   : ve.side === "sell"
                     ? "Venda"
                     : "Não informada",
               ),
             ]),
         )}${B("flow-import", "Importar " + se.records.length + " negócios para minha conta")}${B("flow-discard", "Descartar prévia")}`
       : ""
   }${i("Colunas: IDNegocio (ID estável do negócio), Ativo, Data, Hora, Preço e Quantidade. Agressão, Compradora e Vendedora são opcionais. Também aceita trade_id, ticker, traded_at, price e quantity. Sem agressão, o saldo não é inferido.")}</details>
   <details class="rs-section"><summary>Ativar alimentação pelo computador</summary><ol><li>Na pasta da ponte v301, execute <b>iniciar-com-fluxo.bat</b> e selecione o CSV do Times & Trades.</li><li>Mantenha a ponte aberta. Ela relê o CSV quando o arquivo muda; exportar uma vez produz uma amostra estática.</li><li>Para uma origem contínua, é preciso que o Profit alimente o arquivo ou uma faixa de negócios no Excel. A ponte não exporta a janela do Profit sozinha.</li></ol>${i("A planilha de cotações não substitui o Times & Trades. Captura nativa por ProfitDLL depende de contratação/habilitação separada. Esta tela não está conectada à DLL.")}</details>
   ${
     ae
       ? `<label class="rs-auto-refresh"><input type="checkbox" data-flow-auto${o.flowAuto ? " checked" : ""}> Atualizar a consulta a cada 15 segundos</label><div class="rs-kpis"><div><small>Agressão compradora · quantidade</small><b>${j(oe.buy, 0)}</b></div><div><small>Agressão vendedora · quantidade</small><b>${j(oe.sell, 0)}</b></div><div><small>Saldo de agressão</small><b>${j(oe.delta, 0)}</b></div></div>${i(oe.rows.length + " negócios únicos carregados. " + (oe.rows.length >= 2e3 ? "O limite de consulta de 2.000 foi atingido; há possível corte da amostra. " : "") + "Sem classificação: " + j(oe.neutral, 0) + ". Último negócio: " + (oe.to ? new Date(oe.to).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "não informado") + ".")}${c(
           [
             "Hora BRT",
             "Preço",
             "Quantidade",
             "Agressão",
             "Compradora",
             "Vendedora",
           ],
           ee.map((ve) => [
             r(
               new Date(ve.traded_at).toLocaleTimeString("pt-BR", {
                 timeZone: "America/Sao_Paulo",
                 fractionalSecondDigits: 3,
               }),
             ),
             j(ve.price, 4),
             j(ve.quantity, 0),
             r(
               { buy: "Compra", sell: "Venda", unknown: "Não informada" }[
                 ve.side
               ] || "Não informada",
             ),
             r(ve.buyer || "—"),
             r(ve.seller || "—"),
           ]),
         )}${
           oe.players.length
             ? '<details class="rs-section"><summary>Participantes da amostra</summary>' +
               c(
                 ["Corretora", "Compra · qtd.", "Venda · qtd.", "Saldo · qtd."],
                 oe.players
                   .slice(0, 20)
                   .map((ve) => [
                     r(ve.name),
                     j(ve.buy, 0),
                     j(ve.sell, 0),
                     j(ve.net, 0),
                   ]),
               ) +
               i(
                 "Saldo comprado menos vendido, diferente de saldo de agressão. Corretoras intermediárias não identificam investidores finais.",
               ) +
               "</details>"
             : ""
         }`
       : i(
           "Os indicadores de agressão aparecem após receber negócios válidos. Ausência de dados não é saldo zero.",
         )
   }
   <details class="rs-section"><summary>Cobertura da amostra</summary>${i("Consulta os 2.000 negócios mais recentes do ativo/data; exibe até 150 linhas. O conjunto recebido pode ser parcial. Importação e ponte usam o mesmo ID estável para evitar duplicação. Cancelamentos de negócios não são reconciliados automaticamente.")}</details>`;
      }
      async function I(oe) {
        if (oe)
          return (
            (o.flowImport = null),
            b(async (ee) => {
              if (oe.size > 5 * 1024 * 1024)
                throw Error("Use um CSV de até 5 MB.");
              const ae = await new Promise((ve, Me) => {
                const xe = new FileReader();
                ((xe.onload = () => ve(xe.result)),
                  (xe.onerror = () =>
                    Me(Error("Não foi possível ler o arquivo."))),
                  xe.readAsArrayBuffer(oe));
              });
              if (!ee()) return;
              let se = new TextDecoder("utf-8").decode(ae);
              se.includes("�") &&
                (se = new TextDecoder("windows-1252").decode(ae));
              const me = await window.FluxoImportacao.parse(se);
              ee() &&
                ((o.flowImport = me),
                (o.message =
                  "Prévia pronta. Confira os dados e confirme a importação."));
            })
          );
      }
      async function k() {
        return b(async (oe) => {
          y();
          const ee = o.flowImport;
          if (!ee?.records.length)
            throw Error("Escolha um CSV de negócios primeiro.");
          const ae = SESS.uid;
          let se = 0;
          for (let ve = 0; ve < ee.records.length; ve += 500) {
            if (!oe() || SESS.uid !== ae) return;
            const Me = ee.records
              .slice(ve, ve + 500)
              .map((xe) => ({ ...xe, user_id: ae }));
            try {
              (await rq(
                "/rest/v1/fluxo_negocios?on_conflict=user_id,trade_id",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Prefer: "resolution=merge-duplicates,return=minimal",
                  },
                  body: JSON.stringify(Me),
                },
              ),
                (se += Me.length));
            } catch (xe) {
              throw Error(
                "Importação interrompida após " +
                  se +
                  " negócios confirmados. Você pode repetir sem duplicar os IDs. " +
                  (xe.message || "Falha no envio."),
              );
            }
          }
          if (!oe()) return;
          const me = ee.records[0];
          ((o.ticker = me.ticker),
            (o.flowDate = new Date(Date.parse(me.traded_at) - 108e5)
              .toISOString()
              .slice(0, 10)),
            (o.flowImport = null),
            await _(oe),
            oe() &&
              (o.message =
                se +
                " negócios confirmados pelo servidor. O filtro foi ajustado ao primeiro ativo/data importado."));
        });
      }
      function L() {
        if (!F?.open) return;
        const oe = new Set(
            [...F.querySelectorAll("details[open]")].map(
              (ae) => ae.querySelector("summary")?.textContent,
            ),
          ),
          ee = F.scrollTop;
        ((F.innerHTML =
          R() +
          `<div class="rs-content">${a()}${o.busy ? '<p role="status">Consultando dados…</p>' : ""}${o.message ? `<p role="status" class="rs-message">${r(o.message)}</p>` : ""}${{ ativo: n, comparar: f, radar: h, risco: Q, fluxo: v }[o.view]()}</div>`),
          F.querySelectorAll(
            '[data-rs="refresh"],form button[type="submit"]',
          ).forEach((ae) => (ae.disabled = o.busy)),
          F.querySelectorAll("details").forEach((ae) => {
            oe.has(ae.querySelector("summary")?.textContent) && (ae.open = !0);
          }),
          (F.scrollTop = ee));
      }
      function d() {
        if (o.owner && o.ownerId === (SESS?.uid || null)) {
          o.owner = S;
          return;
        }
        ((o.owner = S),
          (o.ownerId = SESS?.uid || null),
          (o.loaded = {}),
          (o.news = {}),
          (o.radar = []),
          (o.radarAt = null),
          (o.flow = []),
          (o.flowStatus = "idle"),
          (o.flowAt = null),
          (o.flowLatest = null),
          (o.flowImport = null),
          (o.compare = []),
          (o.weights = {}),
          (o.message = ""),
          N++,
          (o.busy = !1));
      }
      function $(oe = "ativo", ee) {
        (d(),
          (o.view = ["ativo", "comparar", "radar", "risco", "fluxo"].includes(
            oe,
          )
            ? oe
            : "ativo"),
          (o.ticker = s.ticker(ee || w() || z()[0] || o.ticker)),
          F ||
            ((F = document.createElement("dialog")),
            (F.className = "rs-workbench"),
            (F.id = "research-workbench"),
            F.setAttribute("aria-label", "Pesquisa de mercado"),
            F.addEventListener("click", te),
            F.addEventListener("submit", ue),
            F.addEventListener("change", (ae) => {
              ae.target.matches("[data-flow-auto]")
                ? ((o.flowAuto = ae.target.checked), J())
                : ae.target.matches("[data-flow-file]") &&
                  I(ae.target.files?.[0]);
            }),
            F.addEventListener("close", () => {
              ((o.flowAuto = !1),
                J(),
                window.TraderUI.refreshScroll(),
                N++,
                (o.busy = !1),
                (o.message = ""));
            }),
            document.body.append(F)),
          F.open || (window.TraderChat?.close(), F.showModal()),
          F.setAttribute(
            "aria-label",
            o.view === "fluxo" ? "Fluxo de negócios" : "Pesquisa de mercado",
          ),
          L(),
          (F.scrollTop = 0),
          window.TraderUI.refreshScroll());
      }
      function w() {
        try {
          const oe = l().layAtual();
          return l().parse(oe.p[l().TR.foco] || oe.p[0]).tk || "";
        } catch {
          return "";
        }
      }
      async function b(oe) {
        if (o.busy) return;
        ((o.busy = !0), (o.message = ""));
        const ee = ++N,
          ae = SESS?.uid || null;
        L();
        try {
          if (
            (await oe(() => ee === N && (SESS?.uid || null) === ae && F?.open),
            (SESS?.uid || null) !== ae)
          )
            return;
        } catch (se) {
          ee === N && (o.message = se.message || String(se));
        } finally {
          ee === N &&
            ((SESS?.uid || null) !== ae
              ? (F?.close(), d())
              : ((o.busy = !1), L()));
        }
      }
      function y() {
        if (window.DIARIO_DEMO)
          throw Error("Consultas externas desativadas na demonstração.");
        if (!SESS?.at) throw Error("Entre na sua conta para consultar dados.");
      }
      async function C(oe, ee) {
        y();
        for (let ae = 0; ae < oe.length; ae += 2) {
          if (!ee()) return;
          await Promise.all(
            oe.slice(ae, ae + 2).map(async (se) => {
              const me = await l().trFn("fund", { tk: se }, 6e5);
              if (ee())
                if (me)
                  ((o.loaded[se] = me),
                    window.ResearchAdvanced?.onFund(se, me));
                else
                  throw Error(
                    "Fundamentos indisponíveis para " +
                      se +
                      ". Confira DQ no terminal.",
                  );
            }),
          );
        }
      }
      async function V() {
        return b(async (oe) => {
          if ((y(), o.view === "fluxo")) {
            ((o.flowStatus = "loading"), (o.flow = []), L());
            try {
              return await _(oe);
            } catch (ae) {
              throw (oe() && (o.flowStatus = "error"), ae);
            }
          }
          if (o.view === "radar") return X(oe);
          if (o.view === "risco") {
            await Promise.allSettled([pfHist(), pfMeta()]);
            const ae = Date.now() + 2e4;
            for (
              ;
              oe() && (window.PF.histBusy || window.PF.meta) && Date.now() < ae;

            )
              await new Promise((se) => setTimeout(se, 150));
            if (!oe()) return;
            await Promise.all(
              Y()
                .slice(0, 8)
                .map((se) => l().tec.pegaVelas(se.tk, "1d")),
            );
            return;
          }
          const ee =
            o.view === "comparar"
              ? o.compare.length
                ? o.compare
                : z().slice(0, 4)
              : [o.ticker];
          if (!ee.length) throw Error("Escolha os ativos primeiro.");
          if ((await C(ee, oe), o.view === "ativo" && oe())) {
            const ae = o.ticker,
              se = await l().trFn("noticias", { q: ae }, 18e4);
            (oe() && (o.news[ae] = se?.itens || []),
              await l().trFn("cot", { s: [ae] }, 15e3));
          }
        });
      }
      async function X(oe) {
        const ee = M().filters || {},
          ae = await l().trFn(
            "eqs",
            {
              mk: ee.market || "brazil",
              f: {
                ...(s.num(ee.minDy) !== null ? { dyMin: s.num(ee.minDy) } : {}),
                ...(s.num(ee.minRoe) !== null
                  ? { roeMin: s.num(ee.minRoe) }
                  : {}),
                ...(s.num(ee.maxPl) !== null ? { plMax: s.num(ee.maxPl) } : {}),
              },
            },
            6e4,
          );
        if (oe()) {
          if (!ae?.itens) throw Error("Screening indisponível na fonte.");
          ((o.radar = ae.itens.map((se) => ({
            ticker: s.ticker(se.s),
            sector: se.setor || "Não informado",
            metric: {
              pl: s.num(se.pl),
              pvp: s.num(se.pvp),
              dy: s.num(se.dy),
              roe: s.num(se.roe),
              debt: null,
            },
          }))),
            (o.radarAt = ae.em || new Date().toISOString()));
        }
      }
      async function _(oe) {
        y();
        const ee = o.ticker,
          ae = o.flowDate || loc().slice(0, 10);
        if (!/^[A-Z0-9.]{1,18}$/.test(ee) || !/^\d{4}-\d{2}-\d{2}$/.test(ae))
          throw Error("Informe ativo e data válidos.");
        const se = new Date(ae + "T12:00:00Z");
        se.setUTCDate(se.getUTCDate() + 1);
        const me = ae + "T00:00:00-03:00",
          ve = se.toISOString().slice(0, 10) + "T00:00:00-03:00";
        let Me = [];
        for (let xe = 0; xe < 2e3; xe += 1e3) {
          const Ae = await rq(
              "/rest/v1/fluxo_negocios?select=trade_id,ticker,traded_at,price,quantity,side,buyer,seller,source&user_id=eq." +
                encodeURIComponent(SESS.uid) +
                "&ticker=eq." +
                encodeURIComponent(ee) +
                "&traded_at=gte." +
                encodeURIComponent(me) +
                "&traded_at=lt." +
                encodeURIComponent(ve) +
                "&order=traded_at.desc,trade_id.desc&limit=1000&offset=" +
                xe,
            ),
            Se = await Ae.json();
          if (!oe()) return;
          if (!Ae.ok || !Array.isArray(Se))
            throw Error("Não foi possível ler o fluxo da ponte.");
          if ((Me.push(...Se), Se.length < 1e3)) break;
        }
        if (
          oe() &&
          ((o.flow = Me),
          (o.flowStatus = Me.length ? "ready" : "empty"),
          (o.flowAt = Date.now()),
          (o.flowLatest = null),
          !Me.length)
        ) {
          const xe = await rq(
              "/rest/v1/fluxo_negocios?select=ticker,traded_at&user_id=eq." +
                encodeURIComponent(SESS.uid) +
                "&order=traded_at.desc&limit=1",
            ),
            Ae = await xe.json();
          oe() &&
            Ae[0] &&
            (o.flowLatest = {
              ticker: Ae[0].ticker,
              date: new Date(Date.parse(Ae[0].traded_at) - 108e5)
                .toISOString()
                .slice(0, 10),
            });
        }
      }
      function K() {
        if (!F?.open) return "";
        const oe = u(o.ticker);
        return (
          "Pesquisa do ativo " +
          oe.ticker +
          ". Setor: " +
          oe.sector +
          ". Consulta: " +
          (oe.queried || "não carregada") +
          `.
Indicadores observados: ` +
          s.fields
            .filter(([ee]) => oe.metric[ee] !== null)
            .map(
              ([ee, ae, se]) =>
                ae +
                " " +
                j(oe.metric[ee]) +
                " " +
                se +
                " (" +
                oe.origin[ee] +
                ")",
            )
            .join("; ") +
          `.
Sem saldos ou posições anexados. Indicadores ausentes não são zero; não inferir causas para movimentos de preço.`
        );
      }
      function U() {
        const oe = (o.compare.length ? o.compare : z().slice(0, 4)).map(u),
          ee = (ve) => '"' + String(ve ?? "").replace(/"/g, '""') + '"',
          ae = [
            [
              "Ativo",
              "Setor",
              "Moeda",
              "Consulta",
              ...s.fields.map((ve) => ve[1]),
            ],
            ...oe.map((ve) => [
              ve.ticker,
              ve.sector,
              ve.currency,
              ve.queried,
              ...s.fields.map(([Me]) => ve.metric[Me]),
            ]),
          ],
          se = URL.createObjectURL(
            new Blob(
              [
                "\uFEFF" +
                  ae.map((ve) => ve.map(ee).join(";")).join(`\r
`),
              ],
              { type: "text/csv;charset=utf-8" },
            ),
          ),
          me = document.createElement("a");
        ((me.href = se),
          (me.download = "comparativo-fundamentos.csv"),
          me.click(),
          setTimeout(() => URL.revokeObjectURL(se), 1e3));
      }
      function te(oe) {
        const ee = oe.target.closest("[data-rs]");
        if (!ee) return;
        const ae = ee.dataset.rs;
        if (ae === "close") return F.close();
        if (ae === "view") {
          ((F.scrollTop = 0),
            N++,
            (o.busy = !1),
            (o.view = ee.dataset.view),
            (o.message = ""),
            L());
          return;
        }
        if (ae === "flow-import") return k();
        if (ae === "flow-discard") {
          ((o.flowImport = null), L());
          return;
        }
        if (ae === "flow-latest" && o.flowLatest)
          return (
            (o.ticker = o.flowLatest.ticker),
            (o.flowDate = o.flowLatest.date),
            V()
          );
        if (ae === "refresh") return V();
        if (ae === "select") {
          ((o.ticker = ee.dataset.ticker), (o.view = "ativo"), L());
          return;
        }
        if (ae === "export") return U();
        if (ae === "ai") {
          const me = K();
          (F.close(), window.TraderChat.open(me));
          return;
        }
        if (ae === "ledger") {
          (F.close(),
            window.DIARIO_NAV.navigate("carteiras"),
            window.CarteiraExperience.openAudit());
          return;
        }
        if (ae === "report") {
          (F.close(), window.TraderReports.openHub());
          return;
        }
        const se = {
          graph: o.ticker + " G",
          news: "N " + o.ticker,
          income: o.ticker + " DVD",
          comparechart:
            "COMP " +
            (o.compare.length ? o.compare : z().slice(0, 4)).join(" "),
        };
        se[ae] &&
          (F.close(),
          tab !== "term" && (irPara("term")),
          l().roda(se[ae]));
      }
      function ue(oe) {
        const ee = oe.target.closest("[data-rsform]");
        if (
          !ee ||
          (oe.preventDefault(), o.busy) ||
          window.ResearchAdvanced?.submit(ee)
        )
          return;
        const ae = Object.fromEntries(new FormData(ee)),
          se = ee.dataset.rsform;
        if (se === "ativo" || se === "fluxo") {
          const me = s.ticker(ae.ticker);
          if (!/^[A-Z0-9.!-]{1,18}$/.test(me)) {
            ((o.message = "Ticker inválido."), L());
            return;
          }
          return (
            (o.ticker = me),
            se === "fluxo" &&
              ((o.flow = []),
              (o.flowDate = ae.date),
              (o.flowStatus = "idle"),
              (o.flowAt = null),
              (o.flowLatest = null)),
            V()
          );
        }
        if (se === "comparar") {
          const me = [
            ...new Set(
              ae.tickers
                .toUpperCase()
                .split(/[\s,;]+/)
                .filter(Boolean),
            ),
          ];
          if (
            me.length < 2 ||
            me.length > 6 ||
            me.some((ve) => !/^[A-Z0-9.!-]{1,18}$/.test(ve))
          ) {
            ((o.message = "Use de 2 a 6 tickers válidos."), L());
            return;
          }
          return ((o.compare = me), V());
        }
        if (se === "radar") {
          for (const me of ["minDy", "minRoe", "maxPl", "maxDebt"])
            if (ae[me] !== "" && s.num(ae[me]) === null) {
              ((o.message = "Filtro numérico inválido."), L());
              return;
            }
          return (E({ filters: ae }), V());
        }
        if (se === "stress") {
          const me = s.num(ae.shock);
          (me === null || me < -100 || me > 1e3
            ? (o.message = "Use uma variação entre −100% e 1.000%.")
            : (o.shock = me),
            L());
          return;
        }
        if (se === "weights") {
          const me = {};
          for (const [Me, xe] of Object.entries(ae)) {
            const Ae = s.num(xe);
            if (Ae === null || Ae < 0 || Ae > 100) {
              ((o.message = "Pesos devem estar entre 0 e 100."), L());
              return;
            }
            me[Me.slice(7)] = Ae;
          }
          if (
            Math.abs(Object.values(me).reduce((Me, xe) => Me + xe, 0) - 100) >
            0.001
          ) {
            ((o.message = "Os pesos devem somar 100%."), L());
            return;
          }
          const ve = Object.values(me).reduce((Me, xe) => Me + xe, 0);
          for (const Me in me) me[Me] = (me[Me] / ve) * 100;
          ((o.weights = me), (o.message = ""), L());
        }
      }
      function ge() {
        if (
          (o.owner && o.ownerId !== (SESS?.uid || null) && (F?.close(), d()),
          tab === "term")
        ) {
          const oe = document.querySelector(".trbar");
          if (oe && !oe.querySelector("[data-research-open]")) {
            const ee = document.createElement("button");
            ((ee.className = "trbtn rs-launch"),
              (ee.dataset.researchOpen = ""),
              (ee.textContent = "Pesquisa"),
              (ee.type = "button"),
              (ee.onclick = () => $()),
              oe.append(ee));
          }
          if (oe && !oe.querySelector("[data-flow-open]")) {
            const ee = document.createElement("button");
            ((ee.className = "trbtn rs-launch"),
              (ee.dataset.flowOpen = ""),
              (ee.textContent = "Fluxo"),
              (ee.type = "button"),
              (ee.onclick = () => $("fluxo")),
              oe.append(ee));
          }
        }
        if (tab === "carteiras") {
          const oe = document.querySelector(".pfbar2,.pf .pfks");
          if (oe && !document.querySelector("[data-research-portfolio]")) {
            const ee = document.createElement("button");
            ((ee.className = "pfbt pfmini"),
              (ee.dataset.researchPortfolio = ""),
              (ee.textContent = "Analisar risco da carteira"),
              (ee.type = "button"),
              (ee.onclick = () => $("risco")),
              oe.append(ee));
          }
        }
      }
      (window.TraderUI.onRender("terminal-pesquisa", ge),
        (window.TerminalResearch = {
          open: $,
          context: K,
          decorate: ge,
          model: s,
          fund: u,
          state: o,
          refresh: V,
          paint: L,
        }));
    })(),
    (() => {
      "use strict";
      const s = window.AdvancedResearch,
        l = window.TerminalResearchModel,
        r = () => window.TerminalResearch,
        j = (I) => esc(String(I ?? "")),
        O = (I, k = 2) =>
          l.finite(I)
            ? I.toLocaleString("pt-BR", {
                maximumFractionDigits: k,
                minimumFractionDigits: k,
              })
            : "—",
        G = (I, k) =>
          `<div class="rs-table" tabindex="0" role="region" aria-label="Pesquisa aprofundada"><table><thead><tr>${I.map((L) => `<th scope="col">${j(L)}</th>`).join("")}</tr></thead><tbody>${k.map((L) => "<tr>" + L.map((d, $) => `<${$ ? "td" : 'th scope="row"'}>${d}</${$ ? "td" : "th"}>`).join("") + "</tr>").join("")}</tbody></table></div>`,
        o = (I) => `<p class="rs-note">${j(I)}</p>`,
        F = (I, k, L = !1) =>
          `<details class="rs-section ra-section"${L ? " open" : ""}><summary>${j(I)}</summary>${k}</details>`,
        N = (I, k, L = "") =>
          `<button type="button" class="rs-button" data-rs="${I}" ${L}>${j(k)}</button>`;
      function e(I, k, L, d = "text") {
        return `<label>${j(I)}<input name="${k}" type="${d}" value="${j(L ?? "")}"${d === "number" ? ' step="any"' : ""}></label>`;
      }
      function i() {
        return (
          (S.ax ??= {}),
          (S.ax.researchAdvanced ??= { assets: {}, exposures: {} })
        );
      }
      function B(I) {
        return i().assets?.[I] || { observations: [], notes: [] };
      }
      function Y(I, k) {
        const L = i();
        ((L.assets ??= {}), (L.assets[I] = { ...B(I), ...k }), save());
      }
      function z() {
        return loc().slice(0, 10);
      }
      function M(I, k = !1) {
        if (!I && !k) return "";
        try {
          const L = new URL(I);
          if (L.protocol === "https:") return L.href;
        } catch {}
        throw Error("Use um link de fonte válido começando com https://.");
      }
      function E(I) {
        try {
          return (
            pfCalc().pos.find((k) => k.tk === I)?.cl ||
            window.PFX?.classifica?.(I)?.cl ||
            "acao"
          );
        } catch {
          return "acao";
        }
      }
      function u(I, k) {
        const L = l.fundamental(I, k),
          d = B(I);
        !L.queried ||
          !Object.values(L.metric).some(l.finite) ||
          Y(I, { observations: s.observe(d.observations, L, z()) });
      }
      function P(I) {
        return l.finite(I)
          ? I.toLocaleString("pt-BR", {
              notation: "compact",
              maximumFractionDigits: 2,
            })
          : "—";
      }
      function m(I, k, L) {
        const d = I.filter((V) => l.finite(V[k]));
        if (d.length < 2)
          return o(
            "Sem duas observações válidas para " + L.toLowerCase() + ".",
          );
        const $ = Math.min(...d.map((V) => V[k])),
          w = Math.max(...d.map((V) => V[k])),
          b = w - $ || 1,
          y = (V) => 48 + (V / (d.length - 1)) * 580,
          C = (V) => 135 - ((V - $) / b) * 95;
        return `<figure class="rs-chart"><figcaption>${j(L)}</figcaption><svg viewBox="0 0 680 180" role="img" aria-label="${j(L)}"><title>${j(L)}</title><path d="${d.map((V, X) => (X ? "L" : "M") + y(X).toFixed(1) + "," + C(V[k]).toFixed(1)).join(" ")}"/><text x="4" y="40">${j(P(w))}</text><text x="4" y="138">${j(P($))}</text><text x="48" y="165">${j(d[0].date)}</text><text x="628" y="165" text-anchor="end">${j(d.at(-1).date)}</text></svg></figure>`;
      }
      function c(I, k) {
        const L = s.history(k),
          d = B(I).observations || [],
          $ = l.fundamental(I, k);
        return F(
          "Empresa contra o próprio histórico",
          [
            ["margin", "Margem líquida anual (%)"],
            ["roe", "ROE anual (%)"],
            ["leverage", "Capitais de terceiros / PL anual (x)"],
          ]
            .map(([b, y]) => m(L, b, y))
            .join("") +
            (L.length
              ? G(
                  ["Ano", "Margem %", "ROE %", "CT / PL"],
                  L.map((b) => [
                    j(b.date),
                    O(b.margin),
                    O(b.roe),
                    O(b.leverage),
                  ]),
                )
              : "") +
            o(
              "Histórico contábil anual disponível, sem preencher anos ausentes. CT/PL não equivale a dívida líquida/EBITDA. ROE pode usar patrimônio médio ou de encerramento conforme a cobertura da fonte.",
            ) +
            "<h4>Múltiplos observados no aplicativo</h4>" +
            G(
              ["Indicador", "Atual", "Mediana observada", "Amostra"],
              [
                ["pl", "P/L"],
                ["pvp", "P/VP"],
                ["ev", "EV/EBITDA"],
              ].map(([b, y]) => {
                const C = d
                  .map((V) => V.metric?.[b])
                  .filter((V) => l.finite(V) && V > 0);
                return [
                  j(y),
                  O($.metric[b]),
                  C.length >= 3
                    ? O(s.quantile(C, 0.5))
                    : "Amostra insuficiente",
                  String(C.length),
                ];
              }),
            ) +
            o(
              "As observações começam quando você atualiza a pesquisa. Guarda até 120 datas de consulta por ativo; não reconstrói múltiplos antigos usando o balanço atual. Consulta não equivale à data contábil.",
            ),
        );
      }
      function q(I, k) {
        const L = s.peers(I, k);
        return F(
          "Comparação com o setor",
          G(
            ["Indicador", "Ativo", "P25", "Mediana", "P75", "N"],
            L.rows.map((d) => [
              j(d.label),
              O(d.current),
              O(d.q25),
              O(d.median),
              O(d.q75),
              String(d.n),
            ]),
          ) +
            o(L.source) +
            o(
              "Estar abaixo da mediana não significa estar barato. Rentabilidade, crescimento, risco e diferenças entre indústrias precisam ser analisados.",
            ),
        );
      }
      function H(I, k) {
        if (!["acao", "acao_ext", "bdr"].includes(E(I)))
          return F(
            "Proventos e cobertura",
            o(
              "O diagnóstico de lucro e caixa de companhias não é aplicado automaticamente a esta classe. Consulte os relatórios próprios do fundo ou emissor.",
            ),
          );
        const L = s.dividendQuality(k);
        return F(
          "Qualidade dos dividendos",
          L.checks.length
            ? G(
                ["Indicador", "Valor", "Leitura"],
                L.checks.map((d) => [
                  j(d.label),
                  O(d.value) + (d.unit === "%" ? "%" : ""),
                  j(d.message),
                ]),
              ) +
                o(L.note) +
                o(L.recurring)
            : o(
                "Faltam payout e demonstrações de caixa. Nenhuma classificação de sustentabilidade foi estimada.",
              ),
        );
      }
      function g(I) {
        const k = s.annualChanges(s.history(I));
        return F(
          "O que mudou nos resultados",
          k.from
            ? o("Anos comparados: " + k.from + " → " + k.to) +
                G(
                  ["Métrica", "Anterior", "Recente", "Variação"],
                  k.rows.map((L) => [
                    j(L.label),
                    O(L.before),
                    O(L.after),
                    L.change === null
                      ? j(L.explanation)
                      : O(L.change) + " " + j(L.unit),
                  ]),
                ) +
                o(k.reason)
            : o(k.reason),
        );
      }
      const R = [
        { name: "Conservador", growth: 2, rate: 14, terminal: 2 },
        { name: "Base", growth: 5, rate: 12, terminal: 3 },
        { name: "Otimista", growth: 8, rate: 10, terminal: 3 },
      ];
      function a(I) {
        const k = B(I).valuation,
          L = k?.input || { cash: "", years: 5, scenarios: R },
          d = k ? s.valuationScenarios(L) : null;
        return ["acao", "acao_ext", "bdr"].includes(E(I))
          ? F(
              "Valuation com premissas visíveis",
              o(
                "Calculadora de fluxo de caixa livre ao acionista (FCFE) por ação. Informe um FCFE apurado após reinvestimento e financiamento líquido; lucro, dividendo e FCO não são usados como substitutos. Valores na moeda da ação. As taxas iniciais são exemplos editáveis, não estimativas da IA.",
              ) +
                `<form data-rsform="valuation"><div class="rs-controls">${e("FCFE anual base por ação", "cash", L.cash, "number")}<label>Horizonte<select name="years"><option value="5"${+L.years == 5 ? " selected" : ""}>5 anos</option><option value="10"${+L.years == 10 ? " selected" : ""}>10 anos</option></select></label></div>` +
                L.scenarios
                  .map(
                    ($, w) =>
                      `<fieldset class="ra-scenario"><legend>${j($.name)}</legend><div class="rs-controls">${e("Crescimento anual (%)", "growth_" + w, $.growth, "number")}${e("Custo do capital próprio (%)", "rate_" + w, $.rate, "number")}${e("Crescimento terminal (%)", "terminal_" + w, $.terminal, "number")}</div></fieldset>`,
                  )
                  .join("") +
                '<button type="submit" class="rs-button">Calcular e guardar premissas</button></form>' +
                (d
                  ? o(
                      "Premissas registradas por você em " +
                        new Date(k.at).toLocaleString("pt-BR") +
                        ". Não são dados oficiais do emissor.",
                    ) +
                    G(
                      ["Cenário", "Valor por ação", "Peso da perpetuidade"],
                      d.rows.map(($) => [
                        j($.name),
                        $.result.available
                          ? O($.result.value)
                          : j($.result.reason),
                        $.result.available
                          ? O($.result.terminalShare) + "%"
                          : "—",
                      ]),
                    ) +
                    o(
                      "Faixa dos cenários válidos: " +
                        O(d.min) +
                        " a " +
                        O(d.max) +
                        ". Não representa preço-alvo, intervalo de confiança ou probabilidade de mercado.",
                    ) +
                    "<h4>Sensibilidade do cenário base</h4>" +
                    G(
                      [
                        "Custo de capital próprio",
                        "g terminal −1 p.p.",
                        "g terminal base",
                        "g terminal +1 p.p.",
                      ],
                      s
                        .valuationSensitivity({
                          ...L.scenarios[1],
                          cash: L.cash,
                          years: +L.years,
                        })
                        .map(($) => [
                          O($.rate) + "%",
                          ...$.cells.map((w) =>
                            w.available ? O(w.value) : "Inválido",
                          ),
                        ]),
                    ) +
                    o(
                      d.rows[0]?.result.method ||
                        "Taxa terminal deve ser menor que o custo de capital próprio.",
                    )
                  : ""),
            )
          : F(
              "Valuation por cenários",
              o(
                "Este modelo de FCFE por ação é destinado a ações de companhias; não é aplicado automaticamente a fundos, títulos ou cripto.",
              ),
            );
      }
      function n(I) {
        const k = B(I),
          L = (k.notes || []).slice().reverse();
        return F(
          "Linha do tempo da sua tese",
          `<form data-rsform="thesis"><label>Expectativa ou ponto para acompanhar<textarea name="text" maxlength="3000" required placeholder="O que espero da empresa e o que faria revisar minha tese?"></textarea></label><div class="rs-controls">${e("Documento de referência (https://, opcional)", "source", "", "url")}<label>Tipo<select name="kind"><option value="expectativa">Expectativa</option><option value="resultado">Resultado observado</option><option value="revisao">Revisão da tese</option></select></label><button type="submit" class="rs-button">Registrar sem substituir as anteriores</button></div></form>` +
            o(
              "Cada anotação preserva texto, data, fonte e os indicadores carregados naquele momento. Seus registros fazem parte da sincronização e do backup do aplicativo.",
            ) +
            (L.length
              ? L.map(
                  (d) =>
                    `<article class="rs-news"><small>${j(new Date(d.at).toLocaleString("pt-BR"))} · ${j(d.kind)}</small><p class="ra-thesis-text">${j(d.text)}</p>${d.source ? `<a href="${j(/^https:\/\//.test(d.source) ? d.source : "#")}" target="_blank" rel="noopener noreferrer">Documento de referência</a>` : ""}<details><summary>Indicadores no momento do registro</summary>${G(
                      ["Indicador", "Valor"],
                      Object.entries(d.metric || {}).map(([$, w]) => [
                        j(l.fields.find((b) => b[0] === $)?.[1] || $),
                        O(w),
                      ]),
                    )}${o("Consulta dos fundamentos: " + (d.queried || "não carregados") + ". Não é carimbo de divulgação contábil.")}</details></article>`,
                ).join("")
              : o("Nenhuma tese registrada para este ativo.")),
        );
      }
      function f(I, k) {
        return c(I, k) + q(I, k) + H(I, k) + g(k) + a(I) + n(I);
      }
      function h(I) {
        return s.exposures(
          I,
          i().exposures || {},
          Object.fromEntries(I.map((k) => [k.tk, r().fund(k.tk)])),
        );
      }
      function Q(I) {
        const k = h(I),
          L = i().exposures || {};
        return F(
          "Exposição por setor e composição indireta",
          G(
            ["Setor ou cobertura", "Valor BRL", "Peso coberto", "Posições"],
            k.sectors.map((d) => [
              j(d.name),
              O(d.value),
              O(d.weight) + "%",
              j(d.tickers.join(", ")),
            ]),
          ) +
            o(
              "Valor com preço disponível: R$ " +
                O(k.total) +
                ". Sem preço: " +
                (k.missing.join(", ") || "nenhum") +
                ". Composição indireta detalhada: R$ " +
                O(k.detailed) +
                ".",
            ) +
            (k.themes.length
              ? "<h4>Temas que podem se repetir na carteira</h4>" +
                G(
                  ["Tema pessoal", "Peso das posições marcadas", "Ativos"],
                  k.themes.map((d) => [
                    j(d.name),
                    O(d.weight) + "%",
                    j(d.tickers.join(", ")),
                  ]),
                )
              : "") +
            o(k.method) +
            "<details><summary>Informar composição e temas</summary>" +
            o(
              "Para fundos, ETFs ou empresas com segmentos, informe somente composição documentada. Percentuais devem somar até 100%; o restante ficará como não detalhado. O aplicativo não presume a carteira interna dos fundos.",
            ) +
            I.map((d) => {
              const $ = L[d.k] || {};
              return `<form data-rsform="exposure" data-asset="${j(d.k)}" class="ra-exposure"><h4>${j(d.tk)}</h4><label>Temas pessoais, separados por vírgula<input name="themes" maxlength="350" value="${j(($.themes || []).join(", "))}" placeholder="Petróleo, juros, consumo"></label><label>Composição documentada: um setor e percentual por linha<textarea name="parts" placeholder="Financeiro;40
Energia;30">${j(
                ($.parts || []).map((w) => w.bucket + ";" + w.percent).join(`
`),
              )}</textarea></label><div class="rs-controls">${e("Data da composição", "ref", $.ref || "", "date")}${e("Link da fonte (https://)", "source", $.source || "", "url")}<button type="submit" class="rs-button">Guardar composição e temas</button></div></form>`;
            }).join("") +
            "</details>",
        );
      }
      function J(I) {
        const k = I.dataset.rsform;
        if (!["valuation", "thesis", "exposure"].includes(k)) return !1;
        const L = Object.fromEntries(new FormData(I)),
          d = r().state.ticker,
          $ = I.dataset.asset;
        let w = !1;
        try {
          if (k === "valuation") {
            const b = {
                cash: l.num(L.cash),
                years: l.num(L.years),
                scenarios: R.map((C, V) => ({
                  name: C.name,
                  growth: l.num(L["growth_" + V]),
                  rate: l.num(L["rate_" + V]),
                  terminal: l.num(L["terminal_" + V]),
                })),
              },
              y = s.valuationScenarios(b);
            if (y.rows.some((C) => !C.result.available))
              throw Error(
                y.rows.find((C) => !C.result.available).result.reason,
              );
            (Y(d, { valuation: { at: new Date().toISOString(), input: b } }),
              (r().state.message = "Premissas e cenários guardados."));
          }
          if (k === "thesis") {
            const b = L.text.trim(),
              y = M(L.source);
            if (b.length < 3 || b.length > 3e3)
              throw Error("Escreva de 3 a 3.000 caracteres.");
            const C = B(d);
            if ((C.notes || []).length >= 200)
              throw Error(
                "Limite de 200 anotações por ativo. Exporte o backup antes de reorganizar os registros.",
              );
            const V = r().fund(d),
              X = {
                id: crypto.randomUUID(),
                at: new Date().toISOString(),
                kind: ["expectativa", "resultado", "revisao"].includes(L.kind)
                  ? L.kind
                  : "expectativa",
                text: b,
                source: y,
                metric: { ...V.metric },
                queried: V.queried,
              };
            (Y(d, { notes: [...(C.notes || []), X] }),
              (r().state.message =
                "Registro acrescentado à linha do tempo; as anotações anteriores foram preservadas."));
          }
          if (k === "exposure") {
            const b = [
              ...new Set(
                L.themes
                  .split(",")
                  .map((X) => X.trim())
                  .filter(Boolean),
              ),
            ];
            if (b.length > 8 || b.some((X) => X.length > 40))
              throw Error("Use até 8 temas com no máximo 40 caracteres cada.");
            const y = L.parts
              .split(
                `
`,
              )
              .map((X) => X.trim())
              .filter(Boolean)
              .map((X) => {
                const [_, K, ...U] = X.split(";"),
                  te = l.num(K);
                if (
                  !_?.trim() ||
                  _.length > 60 ||
                  !(te > 0 && te <= 100) ||
                  U.length
                )
                  throw Error(
                    "Composição: use Setor;Percentual, uma linha por setor.",
                  );
                return { bucket: _.trim(), percent: te };
              });
            if (y.reduce((X, _) => X + _.percent, 0) > 100 + 1e-8)
              throw Error("A composição não pode exceder 100%.");
            if (
              y.length &&
              (!/^\d{4}-\d{2}-\d{2}$/.test(L.ref) ||
                L.ref > z() ||
                Number.isNaN(Date.parse(L.ref + "T12:00:00Z")) ||
                new Date(L.ref + "T12:00:00Z").toISOString().slice(0, 10) !==
                  L.ref)
            )
              throw Error(
                "Informe uma data válida, até hoje, para a composição.",
              );
            const C = M(L.source, y.length > 0),
              V = i();
            ((V.exposures ??= {}),
              (V.exposures[I.dataset.asset] = {
                themes: b,
                parts: y,
                ref: L.ref,
                source: C,
                at: new Date().toISOString(),
              }),
              save(),
              (r().state.message =
                "Composição e temas guardados. A cobertura permanece identificada."));
          }
        } catch (b) {
          ((r().state.message = b.message), (w = !0));
        }
        if ((r().paint(), w)) {
          const b = [...document.querySelectorAll("[data-rsform]")].find(
            (y) => y.dataset.rsform === k && y.dataset.asset === $,
          );
          if (b)
            for (const y of b.elements) y.name in L && (y.value = L[y.name]);
        }
        return !0;
      }
      function v(I, k) {
        const L = B(I);
        return {
          history: s.history(k),
          changes: s.annualChanges(s.history(k)),
          peers: s.peers(I, k),
          dividends: s.dividendQuality(k),
          valuation: L.valuation
            ? {
                ...L.valuation,
                result: s.valuationScenarios(L.valuation.input),
              }
            : null,
          notes: L.notes || [],
          observations: L.observations || [],
          eligible: ["acao", "acao_ext", "bdr"].includes(E(I)),
        };
      }
      (document.addEventListener("click", (I) => {
        const k = I.target.closest("[data-research-menu],[data-flow-menu]");
        k &&
          (I.preventDefault(),
          window.DIARIO_NAV.navigate("term"),
          r().open(k.hasAttribute("data-flow-menu") ? "fluxo" : "ativo"));
      }),
        (window.ResearchAdvanced = {
          assetSections: f,
          riskSections: Q,
          submit: J,
          onFund: u,
          pdfData: v,
          exposureData: h,
        }));
    })(),
    (() => {
      "use strict";
      let s = 0,
        l = null;
      function r() {
        const o = window.TRM?.TS?.() || {},
          F = S.cart?.lanc || [];
        return [
          ...new Set([
            ...(o.mon || []).filter(
              (N) =>
                /^[A-Z.]{1,8}$/.test(N) &&
                ![
                  "WINFUT",
                  "WDOFUT",
                  "INDFUT",
                  "DOLFUT",
                  "BTC",
                  "ETH",
                  "SOL",
                  "IBOV",
                  "DXY",
                  "BRENT",
                  "WTI",
                  "OURO",
                  "PRATA",
                  "COBRE",
                ].includes(N),
            ),
            ...F.filter((N) => N.mk === "US").map((N) => N.tk),
            "EWZ",
            "PBR",
            "VALE",
            "ITUB",
            "BBD",
          ]),
        ].slice(0, 40);
      }
      function j(o = !1) {
        const F = window.TRM,
          N = F?.TR;
        if (!(!F || window.DIARIO_DEMO)) {
          if (!SESS?.at) {
            ((N.fhAuto = []), F.trFinnhub([]));
            return;
          }
          document.hidden ||
            navigator.onLine === !1 ||
            (N.fh?.readyState === 0 &&
              Date.now() - (N.fhStarted || 0) > 15e3 &&
              N.fh.close(),
            (N.fhAuto = r()),
            F.trFinnhub(N.fhAuto),
            F.trBinance(["btcusdt", "ethusdt"], "auto"));
        }
      }
      function O(o) {
        const F = window.TRM,
          N = F?.TR;
        if (
          !N ||
          !o?.payload?.data ||
          Date.now() - Date.parse(o.fetched_at) > 15 * 6e4
        )
          return;
        const e = o.payload.data.map((Y) => {
            const z = Y.d || [];
            return {
              s: Y.s,
              n: z[0] || Y.s,
              px: typeof z[1] == "number" && z[1] > 0 ? z[1] : null,
              d1: z[2],
              dabs: z[3],
              atraso: !0,
              moeda: z[5],
              horarioPreco:
                typeof z[6] == "number" &&
                z[6] > 0 &&
                z[6] <= Date.now() / 1e3 + 60
                  ? new Date(z[6] * 1e3).toISOString()
                  : null,
              fonte: "TradingView",
              coletaServidor: o.fetched_at,
              baseVariacao: "Referência diária do provedor",
              snapshot: !0,
            };
          }),
          i = (Y) => {
            const z = String(Y).toUpperCase(),
              M = {
                IBOV: "BMFBOVESPA:IBOV",
                SPX: "TVC:SPX",
                DXY: "TVC:DXY",
                BRENT: "TVC:UKOIL",
                WTI: "TVC:USOIL",
                OURO: "TVC:GOLD",
              };
            return e.find((E) => E.s === (M[z] || z) || E.s.endsWith(":" + z));
          },
          B = [F.TS().mon || [], ...e.map((Y) => [Y.s.split(":")[1]])];
        for (const Y of B) {
          if (!Y.length) continue;
          const z = "cot|" + JSON.stringify({ s: Y }),
            M = N.dados[z],
            E = Date.parse(o.fetched_at);
          (M && M.ts >= E) ||
            (N.dados[z] = {
              ts: E,
              v: {
                em: o.fetched_at,
                fonte: "TradingView · coleta no servidor (snapshot)",
                itens: Y.map((u) => ({
                  ...i(u),
                  pedido: u,
                  px: i(u)?.px ?? null,
                })),
              },
            });
        }
      }
      async function G(o = !1) {
        if (
          (j(o),
          window.DIARIO_DEMO ||
            document.hidden ||
            navigator.onLine === !1 ||
            !SESS?.at ||
            l ||
            Date.now() - s < (o ? 2e3 : 6e4))
        )
          return;
        s = Date.now();
        const F = SESS.uid;
        return (
          (l = (async () => {
            try {
              const e = await (
                await rq(
                  "/rest/v1/mercado_cache?id=eq.quotes&select=payload,fetched_at",
                )
              ).json();
              if (SESS?.uid !== F || document.hidden) return;
              (O(e[0]), tab === "term" && render());
            } catch {}
            SESS?.uid !== F ||
              document.hidden ||
              (await Promise.allSettled([
                window.TRM.trFn("cot", { s: window.TRM.TS().mon || [] }, 15e3),
              ]),
              SESS?.uid === F &&
                !document.hidden &&
                tab === "term" &&
                render());
          })().finally(() => (l = null))),
          l
        );
      }
      (document.addEventListener("visibilitychange", () => {
        if (!document.hidden) G(!0);
        else {
          clearTimeout(window.TR?.fhRetry);
          try {
            (window.TR?.fh?.close(), window.TR?.ws?.close());
          } catch {}
        }
      }),
        window.addEventListener("pageshow", () => G(!0)),
        window.addEventListener("online", () => G(!0)),
        window.TraderUI.onRender("cotacoes-conexao", () => G()),
        setInterval(() => {
          (j(), G());
        }, 15e3),
        (window.QuoteConnection = { refresh: G, sockets: j, seed: O }),
        G(!0));
    })(),
    (function () {
      "use strict";
      if (typeof vEstudos != "function") return;
      const s = "aulas-lista-v1",
        l = "aulas-rot-v1:",
        r = "aulas-pos-v1:",
        j = "aulas-voz",
        O = "aulas-vel",
        G = "aulas-neural-mode",
        o = "aulas-neural-voice",
        F = { lista: null, busy: 0, err: "", ts: 0 },
        N = {
          prev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
          next: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
          play: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>',
          pause:
            '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
          x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
          menu: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
        },
        e = {
          on: 0,
          a: null,
          i: 0,
          j: 0,
          tok: 0,
          play: 0,
          t: 0,
          wd: 0,
          dados: {},
          vis: "",
          wl: null,
          aiImgs: {},
          aiBusy: 0,
          nAudio: {},
          nEl: null,
          nBusy: 0,
        },
        i = (t) =>
          String(t ?? "").replace(
            /[&<>"']/g,
            (p) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[p],
          ),
        B = () =>
          window.DIARIO_DEMO
            ? "demo"
            : (typeof SESS < "u" && SESS && SESS.uid) || null;
      let Y = B();
      const z = (t) =>
        /^aulas-(lista|rot|pos|job)/.test(t)
          ? B()
            ? "aulas-v318:" + B() + ":" + t
            : null
          : t;
      function M(t) {
        if (t !== B()) {
          const p = new Error(
            "A conta mudou. A operação anterior foi interrompida.",
          );
          throw ((p.code = "SESSION_CHANGED"), p);
        }
      }
      const E = (t, p) => {
          try {
            const x = z(t);
            if (!x) return p;
            const A = localStorage.getItem(x);
            return A == null ? p : JSON.parse(A);
          } catch {
            return p;
          }
        },
        u = (t) => {
          try {
            const p = z(t);
            p && localStorage.removeItem(p);
          } catch {}
        },
        P = (t, p) => {
          try {
            const x = z(t);
            x && localStorage.setItem(x, JSON.stringify(p));
          } catch {}
        },
        m = (t, p = 2) =>
          Number(t).toLocaleString("pt-BR", {
            minimumFractionDigits: p,
            maximumFractionDigits: p,
          }),
        c = (t) => (t < 0 ? "-" : "") + "R$ " + m(Math.abs(t), 2),
        q = (t) => (t > 0 ? "+" : t < 0 ? "-" : "") + m(Math.abs(t), 1) + "%",
        H = () => {
          try {
            return !!(typeof SESS < "u" && SESS && SESS.uid && cfg());
          } catch {
            return !1;
          }
        };
      function g() {
        const t = B();
        t !== Y &&
          ((Y = t),
          $e(),
          (e.on = 0),
          (e.a = null),
          (e.dados = {}),
          (e.aiImgs = {}),
          (e.aiBusy = 0),
          Qe(),
          Mt(),
          (e.nAudio = {}),
          document.getElementById("aup")?.remove(),
          document.getElementById("au338-modal")?.remove(),
          document.getElementById("auModal")?.remove(),
          document.documentElement.classList.remove("au-aberto"),
          clearTimeout(n.t),
          (F.lista = null),
          (F.busy = 0),
          (F.err = ""),
          (F.ts = 0),
          typeof de < "u" &&
            ((de.aberto = 0),
            (de.livros = null),
            (de.sel = ""),
            (de.caps = {}),
            (de.manual = ""),
            (de.numero = ""),
            (de.busy = 0),
            (de.msg = ""),
            (de.erro = ""),
            de.pdfTask?.destroy?.(),
            (de.pdfTask = null),
            de.request?.abort(),
            (de.request = null)));
      }
      async function R(t) {
        g();
        const p = B();
        if (!F.busy) {
          if (!H()) {
            ((F.lista = (window.AULAS_LOCAIS || []).filter((x) => x.local)),
              (F.err = F.lista.length ? "" : "login"));
            return;
          }
          if (!(!t && F.lista && Date.now() - F.ts < 6e4)) {
            ((F.busy = 1), (F.err = ""));
            try {
              await tok();
              const A = await (
                await rq(
                  "/rest/v1/aulas?select=id,livro,numero,titulo,capitulos,progresso,criado_em,atualizado_em,erro,status,partes:roteiro->partes,min:roteiro->min&user_id=eq." +
                    SESS.uid +
                    "&order=livro.asc,numero.asc",
                )
              ).json();
              (M(p),
                (F.lista = (Array.isArray(A) ? A : []).concat(
                  window.AULAS_LOCAIS || [],
                )),
                P(s, A),
                (F.ts = Date.now()));
            } catch (x) {
              if (p !== B()) return;
              ((F.lista = E(s, [])),
                (F.err = /aulas|schema cache|404/.test(String(x.message || x))
                  ? "tabela"
                  : String(x.message || x)));
            }
            ((F.busy = 0),
              C(),
              document.dispatchEvent(
                new CustomEvent("diario:aulas-carregadas"),
              ));
          }
        }
      }
      async function a(t) {
        const p = B();
        if (t.roteiro) return t.roteiro;
        const x = E(l + t.id, null);
        if (x && x.em === (t.atualizado_em || t.criado_em)) return x.r;
        await tok();
        const A = await rq("/rest/v1/aulas?select=roteiro&id=eq." + t.id),
          W = await A.json();
        if ((M(p), !W[0])) throw new Error("Aula não encontrada.");
        return (
          P(l + t.id, { em: t.atualizado_em || t.criado_em, r: W[0].roteiro }),
          W[0].roteiro
        );
      }
      function n(t) {
        const p = e.a;
        if (!p || p._owner !== B()) return;
        const ant597 = (E(r + p.id, null) || p.progresso || {}),
          x = {
            cena: e.i,
            total: p.r.cenas.length,
            fim: t ? 1 : ant597.fim || 0,
            em: new Date().toISOString(),
          };
        /* v597: anotações da aula ficam junto do progresso (coluna jsonb aulas.progresso, com RLS). */
        ant597.notas && (x.notas = ant597.notas);
        (P(r + p.id, x),
          !p.local &&
            H() &&
            (clearTimeout(n.t),
            (n.t = setTimeout(() => {
              rq("/rest/v1/aulas?id=eq." + p.id, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({ progresso: x, atualizado_em: x.em }),
              }).catch(() => {});
            }, 1500))));
      }
      /* v597: grava progresso de uma aula (concluída/anotações) no aparelho e no Supabase (aulas.progresso). */
      function salva597(id, patch) {
        const aula = (F.lista || []).find((a) => a.id === id) || { id, progresso: {} },
          x = { ...(f(aula) || {}), ...patch, em: new Date().toISOString() };
        (P(r + id, x), (aula.progresso = x));
        !aula.local &&
          H() &&
          rq("/rest/v1/aulas?id=eq." + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ progresso: x }),
          }).catch(() => {});
        return x;
      }
      const f = (t) => {
          const p = E(r + t.id, null),
            x = t.progresso || {};
          return p && (!x.em || p.em >= x.em) ? p : x;
        },
        h = { query: "", filter: "all" },
        Q = () =>
          "estudos-v316:" +
          ((typeof SESS < "u" && SESS && SESS.uid) || "local");
      function J() {
        const t = E(Q(), {});
        return t && typeof t == "object" && !Array.isArray(t) ? t : {};
      }
      function v(t) {
        try {
          return (localStorage.setItem(Q(), JSON.stringify(t)), !0);
        } catch {
          return (
            toast && toast("Não foi possível salvar neste aparelho."),
            !1
          );
        }
      }
      const I = (t) =>
          String(t || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        k = (t) => {
          const p = f(t);
          return p.fim
            ? 100
            : p.total
              ? Math.max(
                  0,
                  Math.min(
                    99,
                    Math.round((100 * (Number(p.cena) || 0)) / p.total),
                  ),
                )
              : 0;
        };
      function L() {
        const t = (F.lista || []).filter((W) => W.status !== "gerando"),
          p = J(),
          x = t.filter((W) => f(W).fim).length,
          A = t
            .filter((W) => f(W).em && !f(W).fim)
            .sort((W, Z) => String(f(Z).em).localeCompare(String(f(W).em)))[0];
        return `<section class="card au-dashboard"><div class="au-dash-label">SEU ESPAÇO DE APRENDIZADO</div><h2>Uma aula de cada vez.</h2><div class="au-dash-stats"><span><b>${t.length}</b> aulas</span><span><b>${x}</b> concluídas</span><span><b>${t.filter((W) => p.fav?.[W.id]).length}</b> favoritas</span></div>${A ? `<button class="btn" data-auopen="${i(A.id)}">Continuar · ${i(A.titulo)} <small>${k(A)}%</small></button>` : '<div class="sm mut">Escolha uma aula para começar. Seu progresso fica salvo.</div>'}<p class="sm mut">Favoritos e anotações ficam neste aparelho, separados por conta.</p></section>
 <div class="au-study-tools"><label for="au-search" class="sm mut">Buscar por livro, título ou capítulo</label><input id="au-search" type="search" placeholder="Encontre sua próxima aula…" value="${i(h.query)}"><div class="au-study-filters" role="group" aria-label="Filtrar aulas">${[
   ["all", "Todas"],
   ["progress", "Em andamento"],
   ["done", "Concluídas"],
   ["fav", "Favoritas"],
 ]
   .map(
     ([W, Z]) =>
       `<button type="button" data-austfilter="${W}" aria-pressed="${h.filter === W}" class="btn s${h.filter === W ? " on" : ""}">${Z}</button>`,
   )
   .join("")}</div></div>`;
      }
      function d(t) {
        const p = f(t),
          x = J();
        return (
          (!h.query ||
            I([t.livro, t.titulo, t.capitulos].join(" ")).includes(
              I(h.query),
            )) &&
          (h.filter === "all" ||
            (h.filter === "done" && p.fim) ||
            (h.filter === "progress" && !p.fim && !!p.em) ||
            (h.filter === "fav" && x.fav?.[t.id]))
        );
      }
      function $() {
        if (!e.a) return;
        $e();
        const t = e.a,
          p = J(),
          x = p.notes?.[t.id] || [],
          A = t.r.cenas[e.i];
        (document.getElementById("au-study-panel")?.remove(),
          document
            .getElementById("aup")
            .insertAdjacentHTML(
              "beforeend",
              `<section id="au-study-panel" class="au-study-panel" role="dialog" aria-modal="true" aria-label="Caderno da aula"><div class="au-study-sheet"><button class="btn s" data-austclose="1">Fechar caderno</button><h2>Meu caderno</h2><p>${i(t.titulo)} · Cena ${e.i + 1}</p><p class="sm mut">${i(A.titulo || "Cena atual")}</p><label for="au-note">Anotação sobre esta cena</label><textarea id="au-note" maxlength="4000" rows="4" placeholder="O que entendi? Como vou aplicar?"></textarea><button class="btn" data-austsave="1">Salvar anotação</button><p class="sm mut" role="status" id="au-note-status"></p><button class="btn s" data-austexport="1"${x.length ? "" : " disabled"}>Baixar notas (.txt)</button><h3>Trechos salvos</h3><div>${x.length ? x.map((W) => `<article><button class="btn s" data-austjump="${W.scene}">Ir à cena ${W.scene + 1}</button><p>${i(W.text)}</p><button class="btn s" data-austdelete="${i(W.id)}">Excluir anotação</button></article>`).join("") : '<p class="sm mut">Suas anotações aparecerão aqui.</p>'}</div></div></section>`,
            ),
          document.getElementById("au-note").focus());
      }
      function w() {
        const t = J().notes?.[e.a.id] || [];
        if (!t.length) return;
        const p = [
            e.a.titulo,
            e.a.livro,
            "",
            ...t.map(
              (W) => `Cena ${W.scene + 1} · ${W.title}
${W.text}
`,
            ),
          ].join(`
`),
          x = URL.createObjectURL(
            new Blob([p], { type: "text/plain;charset=utf-8" }),
          ),
          A = document.createElement("a");
        ((A.href = x),
          (A.download = "anotacoes-aula.txt"),
          A.click(),
          setTimeout(() => URL.revokeObjectURL(x), 1500));
      }
      (document.addEventListener("input", (t) => {
        if (t.target.id !== "au-search") return;
        const p = t.target.selectionStart;
        ((h.query = t.target.value), C());
        const x = document.getElementById("au-search");
        x?.focus();
        try {
          x?.setSelectionRange(p, p);
        } catch {}
      }),
        document.addEventListener("click", (t) => {
          let p = t.target.closest("[data-austfilter]");
          if (p) {
            ((h.filter = p.dataset.austfilter), C());
            return;
          }
          if (((p = t.target.closest("[data-austfav]")), p)) {
            const x = J(),
              A = p.dataset.austfav;
            ((x.fav = x.fav || {}), (x.fav[A] = !x.fav[A]), v(x) && C());
            return;
          }
          if (t.target.closest("[data-austnotes]")) {
            $();
            return;
          }
          if (
            t.target.closest("[data-austclose]") ||
            t.target.id === "au-study-panel"
          ) {
            (document.getElementById("au-study-panel")?.remove(),
              document.querySelector("[data-austnotes]")?.focus());
            return;
          }
          if (t.target.closest("[data-austsave]")) {
            const x = document.getElementById("au-note"),
              A = x.value.trim();
            if (!A) {
              document.getElementById("au-note-status").textContent =
                "Escreva uma anotação antes de salvar.";
              return;
            }
            const W = J();
            ((W.notes = W.notes || {}),
              (W.notes[e.a.id] = W.notes[e.a.id] || []).push({
                id:
                  Date.now().toString(36) +
                  Math.random().toString(36).slice(2, 6),
                scene: e.i,
                title: e.a.r.cenas[e.i].titulo || "",
                text: A,
                em: new Date().toISOString(),
              }),
              v(W) &&
                ($(),
                (document.getElementById("au-note-status").textContent =
                  "Anotação salva neste aparelho.")));
            return;
          }
          if (t.target.closest("[data-austexport]")) {
            w();
            return;
          }
          if (((p = t.target.closest("[data-austdelete]")), p)) {
            const x = J();
            ((x.notes[e.a.id] = x.notes[e.a.id].filter(
              (A) => A.id !== p.dataset.austdelete,
            )),
              v(x) && $());
            return;
          }
          if (((p = t.target.closest("[data-austjump]")), p)) {
            (document.getElementById("au-study-panel")?.remove(),
              Pe(Number(p.dataset.austjump), 0));
            return;
          }
        }),
        document.addEventListener("au-study-pause", () => {
          e.on && $e();
        }));
      const b = document.createElement("style");
      ((b.textContent = `
.au-dashboard{background:linear-gradient(125deg,var(--card,#1e2023),var(--bg,#17181a));border:1px solid #3f4249;padding:20px}.au-dash-label{font-size:10px;letter-spacing:.14em;color:var(--mut,#d3b379)}.au-dashboard h2{font-size:24px;margin:8px 0 16px}.au-dash-stats{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px}.au-dash-stats b{display:block;font-size:24px}.au-dashboard>.btn{max-width:100%;white-space:normal;text-align:left}.au-dashboard small{margin-left:8px}.au-study-tools{margin:16px 0}.au-study-tools input{width:100%;box-sizing:border-box;margin:8px 0 8px;min-height:44px}.au-study-filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px}.au-study-filters .btn{white-space:nowrap;min-height:40px}.au-study-filters [aria-pressed=true]{background:#2f3237;color:#ffffff;border-color:#caa561}.au-study-row{display:flex;align-items:center;gap:4px}.au-study-row .au-item{flex:1;min-width:0}.au-fav{flex-shrink:0;background:transparent;color:var(--mut,#9a9fa8);border:1px solid var(--line,#4c5058);border-radius:8px;min-width:42px;min-height:42px;font-size:22px}.au-fav[aria-pressed=true]{color:#c2943f}.au-study-panel{position:absolute;inset:0;z-index:150;background:#000000bb;display:flex;justify-content:flex-end}.au-study-sheet{background:#1a1b1d;color:#f5f4f2;max-width:520px;width:100%;padding:20px;overflow:auto;box-sizing:border-box}.au-study-sheet textarea{display:block;box-sizing:border-box;width:100%;color:#f5f4f2;background:#212326;border:1px solid #5e636d;border-radius:8px;padding:12px;margin:8px 0;resize:vertical;font:16px/1.5 system-ui}.au-study-sheet article{border-top:1px solid #4c5058;margin-top:16px;padding-top:16px}.au-study-sheet article p{white-space:pre-wrap;overflow-wrap:anywhere}.au-study-sheet .btn{margin:4px 0}.aup-ctl{flex-wrap:wrap}.aup{overflow-y:auto}.au-study-note-btn{width:auto!important;font-size:12px!important;padding:8px!important}.au-study-row .au-tx{min-width:0;overflow-wrap:anywhere}.au-study-row .au-tx b{white-space:normal}@media(prefers-reduced-motion:reduce){.aup *{animation:none!important;transition:none!important}}
`),
        document.head.appendChild(b));
      function y() {
        if ((g(), F.lista == null && (R(), F.lista == null)))
          return '<div class="card"><div class="sm mut">Carregando aulas…</div></div>';
        let t = "";
        (F.err === "login"
          ? (t +=
              '<div class="card warn"><b>Entre na sua conta</b><div class="sm">Entre na sua conta para carregar suas aulas e continuar o estudo.</div><button type="button" class="btn" data-dt393-route="conta">Entrar na minha conta</button></div>')
          : F.err === "tabela"
            ? (t +=
                '<div class="card warn"><b>Videoaulas temporariamente indisponíveis</b><div class="sm">A biblioteca de aulas precisa de manutenção. Tente novamente mais tarde.</div></div>')
            : F.err &&
              (t += `<div class="card warn"><b>Não consegui carregar as aulas</b><div class="sm">${i(F.err)}</div><button class="btn s" data-aurel="1">Tentar de novo</button></div>`),
          (t += L()));
        const p = F.lista.filter(d),
          x = {};
        for (const A of p) (x[A.livro] = x[A.livro] || []).push(A);
        ((t += Ia()),
          F.lista.length &&
            !p.length &&
            (t +=
              '<div class="card sm mut">Nenhuma aula neste filtro. Experimente outra busca ou Todas.</div>'),
          !F.lista.length &&
            !F.err &&
            !de.aberto &&
            (t +=
              '<div class="card"><b>Nenhuma aula ainda</b><div class="sm mut">Toque em “Nova aula”, envie o PDF do livro e escolha os capítulos.</div></div>'));
        for (const [A, W] of Object.entries(x)) {
          t += `<div class="card au-livro"><div class="au-lt">${i(typeof tituloLivro == "function" ? tituloLivro(A) : A)}</div>`;
          {
            /* v597: progresso do curso — X de Y aulas concluídas. */
            const prontas = W.filter((Z) => Z.status !== "gerando"),
              feitas = prontas.filter((Z) => f(Z).fim).length,
              pct = prontas.length ? Math.round((feitas / prontas.length) * 100) : 0;
            prontas.length &&
              (t += `<div class="v597-curso"><div class="v597-curso-txt"><span>${feitas} de ${prontas.length} aulas concluídas</span><b>${pct}%</b></div><i class="v597-curso-bar" role="progressbar" aria-label="Aulas concluídas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><em style="width:${pct}%"></em></i></div>`);
          }
          for (const Z of W) {
            if (Z.status === "gerando") {
              t += Oa(Z);
              continue;
            }
            const ne = f(Z),
              re = ne.fim,
              ie = k(Z);
            /* v596: card vertical — número + título na largura toda; Vídeo (MP4, quando houver), duração e favorito na linha de baixo. */
            const min596 = Z.roteiro_min || Z.min;
            t += `<div class="au-study-row v596-aula"><button class="au-item" data-auopen="${i(Z.id)}"><span class="au-n">${re ? "✓" : Z.numero}</span><span class="au-tx"><b>Aula ${Z.numero} · ${i(Z.titulo)}</b><span class="sm mut">${i(Z.capitulos ? "Capítulos " + Z.capitulos : "")}${re ? (Z.capitulos ? " · " : "") + "concluída" : ie ? (Z.capitulos ? " · " : "") + "parou em " + ie + "%" : ""}</span>${ie && !re ? `<span class="au-pb"><i style="width:${ie}%"></i></span>` : ""}</span></button><div class="v596-aula-acoes">${min596 ? `<span class="v596-min">~${i(min596)} min</span>` : ""}<button class="au-fav" type="button" data-austfav="${i(Z.id)}" aria-label="Favoritar ${i(Z.titulo)}" aria-pressed="${!!J().fav?.[Z.id]}">${J().fav?.[Z.id] ? "★" : "☆"}</button></div></div>`;
          }
          t += "</div>";
        }
        return (
          (t +=
            '<details class="sm mut est-pdf-help" style="margin:6px 2px 14px"><summary>PDFs antigos deste aparelho</summary><p>PDFs locais agora ficam separados por conta. Reimporte os PDFs das versões anteriores se precisar gerar novas aulas. <button class="lnk sm" data-aulegacyclear="1">Remover PDFs antigos deste aparelho</button></p></details>'),
          (t +=
            '<details class="sm mut est-audio-help" style="margin:6px 2px 14px"><summary>Ajustes da voz de narração</summary><p>A narração usa a voz do aparelho. No iPhone, baixe uma voz “Aprimorada” ou “Premium” em português (Ajustes → Acessibilidade → Conteúdo Falado → Vozes) para soar mais natural.</p></details>'),
          t
        );
      }
      function C() {
        if (typeof tab < "u" && tab === "estudos" && ESV === "aul" && !e.on) {
          const t = scrollY;
          (render(), scrollTo(0, t));
        }
      }
      {
        const t = vEstudos;
        vEstudos = function () {
          if (ESV !== "aul") return V(t.apply(this, arguments));
          ESV = "liv";
          let p = "";
          try {
            p = t.apply(this, arguments);
          } finally {
            ESV = "aul";
          }
          p = V(p);
          const x = /<div class="seg"[^>]*>[\s\S]*?<\/div>/.exec(p);
          return (
            (x
              ? p
                  .slice(0, x.index + x[0].length)
                  .replace(/ class="on"/g, "")
                  .replace(/(data-id="aul")/, 'class="on" $1')
              : "<h1>Estudos</h1>") +
            '<div class="au-intro sm mut">Videoaulas narradas dos seus livros, agora em modo vídeo com cenas automáticas, legendas e exemplos visuais. Cada aula cobre 2 ou 3 capítulos.</div>' +
            y()
          );
        };
      }
      function V(t) {
        return t.includes('data-id="aul"')
          ? t
          : t.replace(
              /(<div class="seg"[^>]*>[\s\S]*?)(<button[^>]*data-id="ing")/,
              '$1<button data-ep="esv" data-id="aul">🎬 Aulas</button>$2',
            );
      }
      function X(t) {
        const p = String(t.name || "") + " " + String(t.voiceURI || "");
        return /premium/i.test(p)
          ? 50
          : /enhanced|aprimorad|melhorad/i.test(p)
            ? 40
            : /neural|natural/i.test(p)
              ? 35
              : /siri/i.test(p)
                ? 20
                : /google/i.test(p)
                  ? 10
                  : 0;
      }
      function _() {
        let t = [];
        try {
          t = speechSynthesis
            .getVoices()
            .filter((x) => /^pt(?:[-_]|$)/i.test(x.lang));
        } catch {}
        const p = (x) =>
          (/^pt[-_]BR$/i.test(x.lang) ? 100 : 0) + X(x) + (x.default ? 1 : 0);
        return t.sort((x, A) => p(A) - p(x) || x.name.localeCompare(A.name));
      }
      function K() {
        const t = _(),
          p = E(j, "");
        return (
          t.find((x) => x.voiceURI === p) ||
          t.find((x) => x.name === p) ||
          t[0] ||
          null
        );
      }
      const U = () => "speechSynthesis" in window,
        te = (t) => {
          const p = String(t)
              .replace(/\s+/g, " ")
              .trim()
              .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9“"(])/),
            x = [];
          for (let A of p) {
            for (; A.length > 230; ) {
              let W = A.lastIndexOf(", ", 220);
              (W < 80 && (W = A.lastIndexOf(" ", 220)),
                x.push(A.slice(0, W + 1).trim()),
                (A = A.slice(W + 1).trim()));
            }
            A && x.push(A);
          }
          return x;
        };
      function ue(t, p) {
        return String(t).replace(/\{(\w+)\}/g, (x, A) =>
          p && p[A] != null ? p[A] : x,
        );
      }
      function ge(t) {
        const p =
            e.dados[e.i] ||
            (t.vis && t.vis.tipo === "ajuste" && t.vis.precos
              ? { ph: mt(t.vis, t.vis.precos).ph }
              : null),
          x = t.falaSem && (!p || p.erro);
        if (
          (t.vis && t.vis.dados && !p) ||
          (t.vis && t.vis.tipo === "figura" && !p)
        )
          return null;
        const A = (x ? t.falaSem : t.fala) || [],
          W = [];
        return (
          A.forEach((Z, ne) =>
            te(ue(Z, p && p.ph)).forEach((re) => W.push({ t: re, k: ne })),
          ),
          W
        );
      }
      async function oe(t, cena598) {
        g();
        const p = B();
        if (e.on) {
          if (e.a?.id === t) {
            se();
            return;
          }
          me();
        }
        let x =
          (F.lista || []).find((W) => W.id === t) ||
          (window.AULAS_LOCAIS || []).find((W) => W.id === t);
        if (!x) return;
        try {
          toast && toast("Abrindo a aula…");
          const W = await a(x);
          (M(p), (e.a = { ...x, r: W, _owner: p }));
        } catch (W) {
          toast && toast("Não abriu: " + (W.message || W));
          return;
        }
        ((e.on = 1),
          (e.dados = {}),
          (e.aiImgs = {}),
          (e.aiBusy = 0),
          (e.nAudio = {}));
        const A = f(x);
        /* v598: a recomendação do pregão pode abrir a aula direto na cena indicada. */
        ((e.i = Number.isInteger(cena598)
          ? Math.max(0, Math.min(cena598, e.a.r.cenas.length - 1))
          : A.fim ? 0 : Math.min(A.cena || 0, e.a.r.cenas.length - 1)),
          (e.j = 0),
          (e.play = 0),
          E(G, "local") === "piper" && P(G, "local"),
          document.body.insertAdjacentHTML("beforeend", ve()),
          document.documentElement.classList.add("au-aberto"),
          Pe(e.i, 0));
      }
      function ee() {
        const t = document.getElementById("aup");
        if (!t || !e.a) return;
        const p = t.querySelector("[data-au361title]"),
          x = t.querySelector("[data-au361pos]"),
          A = t.querySelector("[data-au361toggle]");
        (p && (p.textContent = "Aula " + e.a.numero + " · " + e.a.titulo),
          x &&
            (x.textContent =
              "Cena " +
              (e.i + 1) +
              " de " +
              e.a.r.cenas.length +
              (e.play ? " · narrando" : " · pausada")),
          A &&
            ((A.textContent = e.play ? "⏸ Pausar" : "▶ Continuar"),
            A.setAttribute(
              "aria-label",
              e.play ? "Pausar narração" : "Continuar narração",
            )));
      }
      function ae() {
        if (!e.on) return;
        (document.getElementById("au-study-panel")?.remove(),
          document.getElementById("au336-map")?.remove(),
          nt());
        const t = document.getElementById("aupoptions");
        (t && (t.hidden = !0),
          document.getElementById("aupidx")?.setAttribute("hidden", ""));
        const p = document.getElementById("aup");
        p &&
          (p.classList.add("au361-floating"),
          p.setAttribute("aria-label", "Mini player da aula"),
          document.documentElement.classList.remove("au-aberto"),
          ee(),
          _e());
      }
      function se() {
        const t = document.getElementById("aup");
        !e.on ||
          !t ||
          (t.classList.remove("au361-floating"),
          t.removeAttribute("style"),
          t.setAttribute("aria-label", "Aula " + e.a.numero),
          document.documentElement.classList.add("au-aberto"),
          ee());
      }
      function me() {
        (Mt(),
          Qe(),
          document.getElementById("au338-modal")?.remove(),
          (e.aiBusy = 0),
          (e.aiImgs = {}),
          document.getElementById("au336-map")?.remove(),
          nt(),
          $e(),
          n(),
          (e.on = 0),
          (e.a = null));
        const t = document.getElementById("aup");
        (t && t.remove(),
          document.documentElement.classList.remove("au-aberto"),
          _e());
        const p = scrollY;
        (render(), scrollTo(0, p));
      }
      function ve() {
        const t = e.a,
          p = E(O, 0.95);
        return `<div class="aup" id="aup" role="dialog" aria-label="Aula ${t.numero}">
<div class="aup-top"><button class="aup-x" data-aux="1" aria-label="Minimizar a aula">${N.x}</button><div class="aup-tt"><b>Aula ${t.numero} · ${i(t.titulo)}</b><span id="aupct"></span></div><button type="button" class="aup-361-min" data-au361min="1" aria-label="Minimizar e continuar ouvindo">▣</button><button class="aup-ix" data-auidx="1" aria-label="Cenas">${N.menu}</button></div>
<div class="au361-mini-bar"><div class="au361-grip" aria-label="Arrastar mini player" title="Arrastar">⠿</div><div class="au361-mini-copy"><strong data-au361title></strong><small data-au361pos></small></div><div class="au361-mini-actions"><button type="button" data-au361toggle="1" aria-label="Pausar ou continuar">▶ Continuar</button><button type="button" data-au361expand="1" aria-label="Expandir aula">⛶</button><button type="button" data-au361close="1" aria-label="Encerrar aula">×</button></div></div>
<div class="aup-stage"><div class="aup-vis" id="aupvis"></div></div>
<div class="aup-cap" id="aupcap"></div>
<div class="aup-prog" id="aupprog">${t.r.cenas.map((x, A) => `<i data-aucena="${A}" title="${i(x.titulo || "")}"></i>`).join("")}</div>
<div class="au353-voice-alert" id="au353-voice-alert" role="alert" hidden><span id="au353-voice-message"></span><button type="button" data-au353retry="1">▶ Tentar voz novamente</button></div>
<div class="aup-ctl"><button data-auprev="1" aria-label="Cena anterior">${N.prev}</button><button class="aup-pp" data-aupp="1" aria-label="Tocar">${N.play}</button><button data-aunext="1" aria-label="Próxima cena">${N.next}</button>
<button data-autv="1" class="aup-tv-btn" title="Explorar o exemplo no TradingView" aria-label="Abrir gráfico no TradingView">📈 Gráfico</button><button data-auoptions="1" class="aup-options-toggle" aria-expanded="false">Opções</button></div><div class="aup-options" id="aupoptions" hidden role="dialog" aria-modal="true" aria-label="Opções e narração da aula"><div class="au348-opt-head"><div><strong>🎙️ Narração</strong><small>Escolha como ouvir esta cena</small></div><button type="button" data-au348close="1" aria-label="Fechar opções">✕</button></div><details class="au352-tools"><summary>Mais ferramentas da aula</summary><div class="au348-first"><button class="au-study-note-btn" data-austnotes="1">Meu caderno</button><button type="button" data-auvisualmap="1" class="au336-map-btn">🗺️ Mapa visual</button><button type="button" data-au337gerar="1" class="au337-gen-btn">🎨 Gerar imagem desta cena</button><button type="button" data-au338diag="1" class="au338-diag-btn">🧪 Testar aulas</button><button type="button" data-au348mode="piper" aria-pressed="${E(G, "local") === "piper"}">🎧 Piper (avançado)</button></div></details><div class="au339-voices"><div class="au348-mode-tabs" role="group" aria-label="Modo de narração"><button type="button" data-au348mode="local" aria-pressed="${E(G, "local") === "local"}">📱 Voz gratuita do aparelho</button><button type="button" data-au348mode="off" aria-pressed="${E(G, "local") === "off"}">🔇 Sem voz</button></div><select id="au339mode" hidden aria-hidden="true"><option value="local">Local</option><option value="piper" ${E(G, "local") === "piper" ? "selected" : ""}>Piper</option><option value="off" ${E(G, "local") === "off" ? "selected" : ""}>Sem narração</option></select><div class="au349-piper"><strong>🎧 Piper TTS · gratuito e offline</strong><small>Gere a voz no computador, depois importe os arquivos WAV aqui. Sem API paga ou cobrança por cena.</small><div class="au349-piper-actions"><button type="button" data-au349export="1">⬇ Exportar roteiro da aula</button><label class="au349-import-btn" for="au349files">📂 Importar áudios WAV</label><input id="au349files" type="file" accept="audio/wav,.wav" multiple hidden></div><small id="au349status" role="status" aria-live="polite">Nenhum áudio Piper carregado nesta cena.</small><audio id="au349native" controls preload="metadata" playsinline aria-label="Ouvir áudio Piper da cena" hidden></audio></div><span id="au339status" hidden></span><div class="au348-actions"><button type="button" data-au349test="1">▶ Ouvir Piper desta cena</button><button type="button" data-au340resume="1" class="au340-resume">▶ Voltar à aula</button></div></div><span id="au337status" class="au337-status" role="status" aria-live="polite"></span><label class="au336-opt"><input type="checkbox" id="au336-auto" ${E("aulas-motor-visual-v336", !0) ? "checked" : ""}> Visuais por fala</label><label class="au352-control-label" for="aupvel">Velocidade da narração</label><select id="aupvel" aria-label="Velocidade">${[0.8, 0.9, 0.95, 1, 1.1, 1.2, 1.35].map((x) => `<option value="${x}"${x == p ? " selected" : ""}>${String(x).replace(".", ",")}×</option>`).join("")}</select>
<label class="au352-control-label" for="aupvoz">Voz gratuita do aparelho</label><select id="aupvoz" aria-label="Voz">${U() ? Me() : "<option>sem voz</option>"}</select>${U() ? '<button data-auvozteste="1" aria-label="Ouvir voz selecionada" style="font-size:12px;width:auto;padding:8px">▶ Testar voz gratuita</button>' : ""}<small id="au352-voice-status" class="au352-voice-status" role="status" aria-live="polite">Se não houver som, escolha outra voz e toque em Testar voz gratuita.</small></div>
<div class="aup-idx" id="aupidx" hidden>${t.r.cenas.map((x, A) => `<button data-aucena="${A}"><span>${A + 1}</span>${i(x.titulo || "Cena " + (A + 1))}</button>`).join("")}${t.local ? "" : '<button class="aup-del" data-audel="1"><span>✕</span>Apagar esta aula</button>'}</div>
</div>`;
      }
      function Me() {
        const t = _(),
          p = E(j, ""),
          x = t[0];
        return (
          '<option value=""' +
          (p ? "" : " selected") +
          ">Automático" +
          (x ? " · " + i(x.name) : " · voz do aparelho") +
          "</option>" +
          t
            .map(
              (W) =>
                `<option value="${i(W.voiceURI || W.name)}"${p && (p === W.voiceURI || p === W.name) ? " selected" : ""}>${i(W.name)}${X(W) >= 35 ? " ★" : ""}${/^pt[-_]BR$/i.test(W.lang) ? " · Brasil" : ""}</option>`,
            )
            .join("")
        );
      }
      function xe(t) {
        const p = document.getElementById("au352-voice-status");
        p && (p.textContent = t);
      }
      function Ae(t) {
        const p = document.getElementById("au353-voice-alert"),
          x = document.getElementById("au353-voice-message");
        !p || !x || ((x.textContent = t || ""), (p.hidden = !t));
      }
      function Se(t) {
        ((e.play = 0), e.tok++, clearTimeout(e.t), clearTimeout(e.wd));
        try {
          speechSynthesis.cancel();
        } catch {}
        (Ye(), _e());
        const p =
          t || "Não foi possível iniciar a voz. Toque em Tentar voz novamente.";
        (Ae(p), xe(p));
      }
      function Re() {
        if (!U()) {
          xe("Este navegador não disponibiliza a voz do aparelho.");
          return;
        }
        ($e(), Ae(""));
        try {
          const t = new SpeechSynthesisUtterance(
              "Olá! Este é um teste gratuito da voz brasileira do aparelho.",
            ),
            p = K();
          ((t.lang = p?.lang || "pt-BR"),
            p && (t.voice = p),
            (t.rate = 0.95),
            (t.pitch = 1),
            (t.volume = 1));
          let x = !1,
            A = !1;
          const W = setTimeout(() => {
            if (!x && !A) {
              A = !0;
              try {
                speechSynthesis.cancel();
              } catch {}
              xe(
                "A voz não iniciou. Experimente tocar em Testar voz novamente ou selecionar outra voz.",
              );
            }
          }, 8500);
          ((t.onstart = () => {
            ((x = !0),
              xe(
                "Teste em reprodução. Se não ouvir, confira o volume do iPhone.",
              ));
          }),
            (t.onend = () => {
              A ||
                ((A = !0),
                clearTimeout(W),
                xe(
                  "Teste concluído. Se não ouviu som, experimente outra voz disponível.",
                ));
            }),
            (t.onerror = (Z) => {
              A ||
                ((A = !0),
                clearTimeout(W),
                xe(
                  "A voz falhou (" +
                    String(Z?.error || "desconhecido").slice(0, 36) +
                    "). Tente outra voz gratuita.",
                ));
            }),
            speechSynthesis.speak(t));
        } catch (t) {
          xe(
            "Voz indisponível neste dispositivo: " +
              String(t?.message || t).slice(0, 80),
          );
        }
      }
      try {
        speechSynthesis.addEventListener("voiceschanged", () => {
          const t = document.getElementById("aupvoz");
          t && (t.innerHTML = Me());
        });
      } catch {}
      function Pe(t, p) {
        const x = e.a;
        if (!x) return;
        (e.tok++, clearTimeout(e.t), clearTimeout(e.wd), Qe());
        const A = document.getElementById("au348native");
        A && (A.pause(), A.removeAttribute("src"));
        try {
          speechSynthesis.cancel();
        } catch {}
        ((e.i = Math.max(0, Math.min(t, x.r.cenas.length - 1))),
          (e.j = p || 0));
        const W = x.r.cenas[e.i];
        ((document.getElementById("aupct").textContent =
          `${e.i + 1}/${x.r.cenas.length} · ${W.titulo || ""}`),
          ee(),
          document.querySelectorAll("#aupprog i").forEach((Z, ne) => {
            Z.className = ne < e.i ? "ok" : ne === e.i ? "at" : "";
          }),
          (e.vis = ""),
          tt(-1),
          W.vis && W.vis.dados && !e.dados[e.i] && Qt(e.i),
          W.vis && W.vis.tipo === "figura" && !e.dados[e.i] && xa(e.i),
          ra(e.i),
          E(G, "local") === "piper" ? pt(e.i) : Ct(e.i),
          We(),
          n(),
          e.play ? (e.t = setTimeout(Ue, 350)) : je(null));
      }
      function je(t) {
        const p = document.getElementById("aupcap");
        if (p) {
          if (!t) {
            const x = e.a.r.cenas[e.i],
              A = ge(x);
            p.innerHTML =
              A && A[0]
                ? `<span class="mut">${i(A[0].t)}</span>`
                : '<span class="mut">Carregando dados reais…</span>';
            return;
          }
          p.innerHTML = i(t.t);
        }
      }
      function Ue() {
        if (!e.play || !e.a) return;
        const t = e.a.r.cenas[e.i],
          p = ge(t);
        if (p == null) {
          (je(null), (e.t = setTimeout(Ue, 400)));
          return;
        }
        if (e.j >= p.length) {
          if (e.i >= e.a.r.cenas.length - 1) {
            ((e.play = 0), Ye(), n(1), _e(), je({ t: "Fim da aula. ✓" }));
            return;
          }
          e.t = setTimeout(
            () => {
              Pe(e.i + 1, 0);
            },
            t.pausa != null ? t.pausa : 900,
          );
          return;
        }
        if (sa() && !e.nEl && la(e.i, p)) return;
        const x = p[e.j];
        (tt(x.k), je(x));
        const A = ++e.tok,
          W = +E(O, 0.95) || 0.95,
          Z = () => {
            A === e.tok &&
              (clearTimeout(e.wd),
              e.j++,
              (e.t = setTimeout(Ue, x.t.endsWith("?") ? 900 : 180)));
          },
          ne = (x.t.length / 14.5 / W) * 1e3;
        if (E(G, "local") === "off") {
          e.wd = setTimeout(Z, Math.max(1800, ne * 1.05));
          return;
        }
        if (!U()) {
          Se(
            "Este navegador não oferece narração. Abra Opções e escolha Sem voz para continuar com legendas.",
          );
          return;
        }
        try {
          const re = new SpeechSynthesisUtterance(x.t),
            ie = K();
          ((re.lang = "pt-BR"),
            ie && ((re.voice = ie), (re.lang = ie.lang)),
            (re.rate = W),
            (re.pitch = 1),
            (re.volume = 1));
          let be = !1,
            pe = !1,
            he = 0;
          const fe = (ke) => {
            A !== e.tok || pe || ((pe = !0), Se(ke));
          };
          ((re.onstart = () => {
            if (A !== e.tok || pe) return;
            ((be = !0), (he = Date.now()), clearTimeout(e.wd), Ae(""));
            const ke = () => {
              if (A !== e.tok || pe) return;
              let we = !1,
                Ee = !1;
              try {
                ((we = !!speechSynthesis.speaking),
                  (Ee = !!speechSynthesis.pending));
              } catch {}
              if (!we && !Ee && Date.now() - he > 850) {
                ((pe = !0), Z());
                return;
              }
              e.wd = setTimeout(ke, 1500);
            };
            e.wd = setTimeout(ke, Math.max(2400, ne * 0.9));
          }),
            (re.onend = () => {
              A !== e.tok || pe || ((pe = !0), Z());
            }),
            (re.onerror = (ke) =>
              fe(
                "Falha na voz do iPhone (" +
                  String(ke?.error || "desconhecida").slice(0, 40) +
                  "). Toque em Tentar voz novamente.",
              )),
            (e.wd = setTimeout(() => {
              if (A !== e.tok || pe || be) return;
              let ke = !1;
              try {
                ke = !!speechSynthesis.speaking;
              } catch {}
              if (ke) {
                ((be = !0),
                  (he = Date.now()),
                  (e.wd = setTimeout(
                    () => {
                      A === e.tok &&
                        !pe &&
                        !speechSynthesis.speaking &&
                        ((pe = !0), Z());
                    },
                    Math.max(3500, ne * 1.5),
                  )));
                return;
              }
              fe(
                "A voz não iniciou no Safari. Toque em Tentar voz novamente ou escolha outra voz em Opções.",
              );
            }, 7500)),
            speechSynthesis.speak(re));
        } catch (re) {
          Se(
            "A voz não pôde iniciar (" +
              String(re?.message || "erro").slice(0, 65) +
              "). Tente novamente.",
          );
        }
      }
      function Fe() {
        if (!e.a) return;
        e.i >= e.a.r.cenas.length - 1 &&
          e.j >= (ge(e.a.r.cenas[e.i]) || []).length &&
          Pe(0, 0);
        const t = document.getElementById("au348native");
        (t && t.pause(),
          document.getElementById("au349native")?.pause(),
          (e.play = 1),
          Ye(),
          Xe(),
          Ae(""),
          clearTimeout(e.t),
          clearTimeout(e.wd),
          Ue());
      }
      function $e() {
        ((e.play = 0), e.tok++, clearTimeout(e.t), clearTimeout(e.wd), Qe());
        try {
          speechSynthesis.cancel();
        } catch {}
        (Ye(), _e());
      }
      function Ye() {
        const t = document.querySelector(".aup-pp");
        (t &&
          ((t.innerHTML = e.play ? N.pause : N.play),
          t.setAttribute("aria-label", e.play ? "Pausar" : "Tocar")),
          ee(),
          ms598());
      }
      async function Xe() {
        try {
          "wakeLock" in navigator &&
            !e.wl &&
            (e.wl = await navigator.wakeLock.request("screen"));
        } catch {}
      }
      function _e() {
        try {
          e.wl && e.wl.release();
        } catch {}
        e.wl = null;
      }
      /* v598: com a voz neural (arquivo de áudio) a aula continua com a tela bloqueada; a voz do aparelho
         (speechSynthesis) o iOS interrompe, então nesse caso a aula pausa como antes. */
      document.addEventListener("visibilitychange", () => {
        document.hidden && e.play && !(e.nEl && !e.nEl.paused) && $e();
      });
      function ms598() {
        try {
          if (!("mediaSession" in navigator) || !e.a) return;
          const ms = navigator.mediaSession,
            titulo = "Aula " + e.a.numero + " · " + (e.a.titulo || "");
          (ms.metadata?.title !== titulo &&
            (ms.metadata = new MediaMetadata({
              title: titulo,
              artist: e.a.livro || "Diário de Trader",
              album: "Estudos",
            })),
            (ms.playbackState = e.play ? "playing" : "paused"));
          const c = (sel) => () => document.querySelector(sel)?.click(),
            h = (acao, fn) => {
              try {
                ms.setActionHandler(acao, fn);
              } catch {}
            };
          (h("play", () => e.play || c("#aup [data-aupp]")()),
            h("pause", () => e.play && c("#aup [data-aupp]")()),
            h("nexttrack", c("#aup [data-aunext]")),
            h("previoustrack", c("#aup [data-auprev]")),
            h("seekbackward", c("#aup [data-auprev]")),
            h("seekforward", c("#aup [data-aunext]")));
        } catch {}
      }
      async function Qt(t) {
        const p = e.a.r.cenas[t],
          x = p.vis,
          A = x.dados,
          W = (Z) => {
            ((e.dados[t] = Z),
              e.i === t &&
                e.on &&
                (tt(e.j ? ((ge(p) || [])[e.j] || {}).k : -1),
                e.play || je(null)));
          };
        if (!H() && !window.AULAS_CANDLES) {
          W({ erro: "Entre na conta para carregar o gráfico real." });
          return;
        }
        try {
          let Z;
          if (window.AULAS_CANDLES) Z = window.AULAS_CANDLES(A);
          else {
            await tok();
            const we = cfg(),
              Ee = await fetch(we.url + "/functions/v1/candles", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: we.key,
                  Authorization: "Bearer " + SESS.at,
                },
                body: JSON.stringify({ ativo: A.ativo, de: A.de, ate: A.ate }),
              });
            if (((Z = await Ee.json().catch(() => ({}))), !Ee.ok))
              throw new Error(Z.error || "Erro " + Ee.status);
          }
          let ne = (Z.candles || []).filter((we) => {
            const Ee = dt(we[0]);
            return Ee >= A.de && Ee <= A.ate;
          });
          if (((ne = Xt(ne)), ne.length < 3))
            throw new Error("Poucos dados para esse período.");
          const re = ne[0][4],
            ie = ne[ne.length - 1][4],
            be = Math.max(...ne.map((we) => we[2])),
            pe = Math.min(...ne.map((we) => we[3])),
            he = A.casas != null ? A.casas : 2,
            fe = {
              ini: m(re, he),
              fim: m(ie, he),
              max: m(be, he),
              min: m(pe, he),
              varp: q(100 * (ie / re - 1)),
              dias: ne.length,
              deTx: ut(A.de),
              ateTx: ut(A.ate),
            },
            ke = {
              cd: ne,
              ph: fe,
              fonte: Z.fonte || "Yahoo Finance",
              simbolo: Z.simbolo || A.ativo,
            };
          (x.tipo === "ajuste" &&
            Object.assign(
              fe,
              mt(
                x,
                ne.map((we) => we[4]),
              ).ph,
            ),
            W(ke));
        } catch (Z) {
          W({ erro: String(Z.message || Z) });
        }
      }
      const dt = (t) =>
          new Date((t - 3 * 3600) * 1e3).toISOString().slice(0, 10),
        ut = (t) => {
          const [p, x, A] = String(t).split("-");
          return `${+A} de ${["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][x - 1]} de ${p}`;
        };
      function Xt(t) {
        const p = new Map();
        for (const x of t) {
          const A = dt(x[0]),
            W = p.get(A);
          W
            ? ((W[2] = Math.max(W[2], x[2])),
              (W[3] = Math.min(W[3], x[3])),
              (W[4] = x[4]))
            : p.set(A, [x[0], x[1], x[2], x[3], x[4]]);
        }
        return [...p.values()];
      }
      function tt(t) {
        const p = e.a.r.cenas[e.i],
          x = p.vis || { tipo: "titulo", t: p.titulo },
          A = document.getElementById("aupvis");
        if (!A) return;
        const W = Et(p, t),
          Z =
            e.i +
            "|" +
            t +
            "|" +
            W.tipo +
            "|" +
            (e.dados[e.i] ? 1 : 0) +
            "|" +
            (E("aulas-motor-visual-v336", !0) ? 1 : 0);
        if (e.vis === Z) return;
        e.vis = Z;
        const ne = ht[x.tipo] || ht.titulo,
          re = ne(x, t, e.dados[e.i], p);
        ((A.innerHTML = ga(p, x, t, re, W)),
          (A.className = "aup-vis au-video au-" + x.tipo));
      }
      function _a(t, p, x) {
        const A = (
            (t.titulo || "") +
            " " +
            (p.t || "") +
            " " +
            (p.chips || []).join(" ")
          ).toLowerCase(),
          W = [
            [
              /op[cç][oõ]es|call|put|payoff|strike|pr[eê]mio/,
              ["OPÇÕES", "▵", "payoff", "risco assimétrico"],
            ],
            [
              /candles|gr[aá]fico|tend[eê]ncia|pre[cç]o|mercado/,
              ["GRÁFICO", "▥", "movimento do preço", "leitura visual"],
            ],
            [
              /margem|ajuste|futuro|contrato|d[oó]lar|win|wdo/,
              ["FUTUROS", "⇄", "ajuste diário", "gestão de margem"],
            ],
            [
              /psicologia|disciplina|rotina|emo[cç][aã]o|risco/,
              [
                "MENTALIDADE",
                "◉",
                "processo antes do resultado",
                "decisão profissional",
              ],
            ],
            [
              /fundamento|empresa|balan[cç]o|valuation|receita|lucro/,
              [
                "FUNDAMENTOS",
                "▦",
                "negócio por trás do preço",
                "análise de valor",
              ],
            ],
            [
              /juros|fed|copom|macro|infla[cç][aã]o|dxy/,
              ["MACRO", "⌁", "cenário e liquidez", "contexto global"],
            ],
          ];
        for (const [Z, ne] of W) if (Z.test(A)) return ne;
        return ["AULA", "◆", "conceito principal", "exemplo prático"];
      }
      function Kt(t, p, x) {
        if (!["titulo", "topicos"].includes(p.tipo)) return "";
        const A = (
          (t.titulo || "") +
          " " +
          (p.t || "") +
          " " +
          (p.chips || []).join(" ")
        ).toLowerCase();
        if (
          !/tend[eê]ncia|suporte|resist[eê]ncia|corre[cç][aã]o|pullback|candles|m[eé]dia m[oó]vel/.test(
            A,
          )
        )
          return "";
        const W = /baixa|descend|queda|venda/.test(A) ? -1 : 1,
          Z = [
            26, 32, 29, 37, 34, 41, 39, 46, 43, 52, 48, 55, 52, 61, 58, 65, 62,
            73,
          ],
          ne = Z.map((ie, be) => {
            const pe = W === 1 ? ie : 100 - ie,
              he = W === 1 ? Z[be - 1] || 23 : 100 - (Z[be - 1] || 23),
              fe = Math.min(86, Math.max(pe, he) + 5),
              ke = Math.max(6, Math.min(pe, he) - 5),
              we = 18 + be * 25,
              Ee = (Ie) => 125 - Ie * 1.12,
              Te = pe >= he;
            return `<line x1="${we}" y1="${Ee(fe)}" x2="${we}" y2="${Ee(ke)}" stroke="${Te ? "#c19646" : "#ed8b7c"}" stroke-width="2"/><rect x="${we - 5}" y="${Math.min(Ee(pe), Ee(he))}" width="10" height="${Math.max(3, Math.abs(Ee(pe) - Ee(he)))}" rx="1" fill="${Te ? "#c19646" : "#ed8b7c"}"/>`;
          }).join(""),
          re = Z.map(
            (ie, be) =>
              `${18 + be * 25},${125 - (W === 1 ? ie : 100 - ie) * 1.12}`,
          ).join(" ");
        return `<div class="au-viz-edu" aria-label="Diagrama ilustrativo de candles. Não são cotações reais."><div class="au-viz-label">EXEMPLO DIDÁTICO · NÃO É UM GRÁFICO REAL</div><svg role="img" aria-label="Sequência ilustrativa de candles e direção da tendência" viewBox="0 0 470 135" preserveAspectRatio="xMidYMid meet"><g stroke="#34363c" stroke-width=".7">${[25, 50, 75, 100].map((ie) => `<line x1="8" x2="460" y1="${ie}" y2="${ie}"/>`).join("")}</g>${ne}<polyline points="${re}" fill="none" stroke="#d4b377" stroke-width="1.5" stroke-dasharray="4 5" opacity=".85"/></svg><div class="au-viz-note">Observe a direção dos candles. Toque em <b>📈 Gráfico</b> para estudar um ativo no TradingView.</div></div>`;
      }
      const lt = [
          {
            tipo: "suporte",
            nome: "Suporte e resistência",
            re: /suporte|resist[eê]ncia|regi[aã]o de pre[cç]os?|piso|teto/i,
          },
          {
            tipo: "tendencia",
            nome: "Tendências e topos/fundos",
            re: /tend[eê]ncia|topos? e fundos?|tend[eê]ncia intermedi[aá]ria|linha de tend[eê]ncia/i,
          },
          {
            tipo: "pullback",
            nome: "Correção e pullback",
            re: /pullback|corre[cç][aã]o|retra[cç][aã]o|repique/i,
          },
          {
            tipo: "rompimento",
            nome: "Rompimentos",
            re: /rompimento|romper|breakout|falso rompimento/i,
          },
          {
            tipo: "media",
            nome: "Médias móveis",
            re: /m[eé]dia[s]? m[oó]ve[il]|cruzamento de m[eé]dias/i,
          },
          {
            tipo: "candles",
            nome: "Anatomia dos candles",
            re: /candles?|pavio|corpo real|abertura e fechamento|sombras? do candle/i,
          },
          {
            tipo: "risco",
            nome: "Gestão de risco",
            re: /stop|risco|retorno|rela[cç][aã]o risco|posi[cç][aã]o|gerenciamento/i,
          },
          {
            tipo: "ciclo",
            nome: "Ciclos e horizontes",
            re: /ciclos?|curto prazo|longo prazo|intermedi[aá]rio|prazo/i,
          },
        ],
        St = new Set(lt.map((t) => t.tipo));
      function Et(t, p) {
        const x = ge(t) || [],
          A = p < 0 ? null : x.find((be) => be.k === p) || x[0],
          W = String(A?.t || ""),
          ne = (Array.isArray(t.visuais) ? t.visuais : []).find(
            (be) => be && Number(be.fala) === Number(A?.k) && St.has(be.tipo),
          );
        if (ne)
          return {
            tipo: ne.tipo,
            nome: lt.find((be) => be.tipo === ne.tipo).nome,
            origem: "roteiro",
          };
        const re = p < 0 ? (t.titulo || "") + " " + (t.vis?.t || "") : W,
          ie = lt.find((be) => be.re.test(re));
        return ie
          ? { tipo: ie.tipo, nome: ie.nome, origem: "roteiro" }
          : { tipo: "", nome: "", origem: "" };
      }
      function Zt(t) {
        const p =
            t === "suporte"
              ? [
                  53, 47, 40, 45, 54, 63, 56, 49, 42, 39, 47, 57, 63, 59, 51,
                  42, 40, 49, 58, 61,
                ]
              : t === "rompimento"
                ? [
                    43, 51, 56, 48, 38, 46, 54, 59, 49, 55, 60, 64, 69, 75, 83,
                    79, 86, 91, 95, 99,
                  ]
                : t === "pullback"
                  ? [
                      27, 33, 39, 47, 53, 62, 67, 61, 55, 47, 50, 59, 65, 73,
                      79, 83, 76, 85, 92, 97,
                    ]
                  : t === "media"
                    ? [
                        23, 29, 25, 34, 36, 33, 40, 48, 44, 55, 50, 61, 62, 60,
                        73, 72, 81, 86, 85, 96,
                      ]
                    : t === "ciclo"
                      ? [
                          25, 30, 39, 44, 55, 49, 39, 35, 41, 53, 62, 71, 69,
                          59, 47, 53, 66, 75, 78, 88,
                        ]
                      : [
                          22, 31, 28, 38, 34, 45, 43, 50, 46, 59, 54, 64, 61,
                          70, 67, 78, 74, 84, 81, 92,
                        ],
          x = (re) => 22 + re * 21,
          A = (re) => 118 - re,
          W = p
            .map((re, ie) => (ie ? "L" : "M") + x(ie) + "," + A(re))
            .join(" "),
          Z = (re, ie) =>
            `<circle cx="${x(re)}" cy="${A(p[re])}" r="4" stroke="#131416" stroke-width="2" fill="${ie}"/>`,
          ne =
            t === "suporte"
              ? '<line x1="12" y1="79" x2="430" y2="79" stroke="#c19646" stroke-dasharray="6 4"/><line x1="12" y1="51" x2="430" y2="51" stroke="#ed8d7f" stroke-dasharray="6 4"/><text x="320" y="75">SUPORTE</text><text x="320" y="46">RESISTÊNCIA</text>'
              : t === "rompimento"
                ? '<line x1="12" y1="60" x2="430" y2="60" stroke="#c69a49" stroke-dasharray="5 5"/><text x="245" y="55">ROMPIMENTO</text>'
                : t === "media"
                  ? `<path d="${p.map((re, ie) => (ie ? "L" : "M") + x(ie) + "," + A(p.slice(Math.max(0, ie - 4), ie + 1).reduce((be, pe) => be + pe, 0) / Math.min(5, ie + 1))).join(" ")}" stroke="#c69a49" stroke-width="2.5" fill="none"/><text x="30" y="22">MÉDIA MÓVEL (SIMULADA)</text>`
                  : t === "pullback"
                    ? `${Z(6, "#c69a49")}${Z(9, "#ed8d7f")}<text x="140" y="20">CORREÇÃO</text>`
                    : t === "tendencia"
                      ? `${Z(3, "#c69a49")}${Z(9, "#c69a49")}<line x1="20" y1="113" x2="430" y2="20" stroke="#c69a49" stroke-width="1.7" stroke-dasharray="7 5"/><text x="250" y="18">DIREÇÃO</text>`
                      : "";
        return t === "candles"
          ? '<svg viewBox="0 0 440 135" role="img" aria-label="Anatomia ilustrativa de um candle"><line x1="145" x2="145" y1="18" y2="118" stroke="#c19646" stroke-width="3"/><rect x="126" y="42" width="38" height="55" rx="2" fill="#c19646"/><line x1="145" y1="29" x2="250" y2="29" stroke="#e4e2dd"/><text x="255" y="33">PAVIO SUPERIOR</text><line x1="164" y1="70" x2="250" y2="70" stroke="#e4e2dd"/><text x="255" y="74">CORPO</text><line x1="145" y1="110" x2="250" y2="110" stroke="#e4e2dd"/><text x="255" y="114">PAVIO INFERIOR</text></svg>'
          : t === "risco"
            ? '<svg viewBox="0 0 440 135" role="img" aria-label="Relação risco e retorno, exemplo didático"><line x1="70" y1="18" x2="70" y2="116" stroke="#e9e7e4"/><line x1="58" y1="75" x2="350" y2="75" stroke="#cca764" stroke-dasharray="5 4"/><rect x="118" y="75" width="100" height="34" fill="#b9311c" opacity=".68"/><rect x="228" y="25" width="100" height="50" fill="#2e8a5c" opacity=".68"/><text x="123" y="97">RISCO</text><text x="239" y="54">RETORNO</text><text x="75" y="70">ENTRADA</text></svg>'
            : `<svg viewBox="0 0 440 135" role="img" aria-label="Esquema financeiro ilustrativo"><g stroke="#35383d" stroke-width=".8">${[22, 44, 66, 88, 110].map((re) => `<line x1="10" y1="${re}" x2="432" y2="${re}"/>`).join("")}</g><path d="${W}" fill="none" stroke="#46c184" stroke-width="2.7" stroke-linejoin="round"/>${ne}</svg>`;
      }
      function ea(t) {
        return !t.tipo || !E("aulas-motor-visual-v336", !0)
          ? ""
          : `<aside class="au336-example" aria-label="Exemplo didático gerado pelo motor visual"><div class="au336-head"><span>📚 ${i(t.nome)}</span><small>ESQUEMA DIDÁTICO · SEM COTAÇÕES REAIS</small></div>${Zt(t.tipo)}<div class="au336-foot">Conceito ilustrativo. Para estudar um ativo real, use <b>📈 Gráfico</b> e confira data, período e fonte.</div></aside>`;
      }
      function ta() {
        if (!e.a) return;
        const t = e.a,
          p = t.r.cenas
            .map((A, W) => {
              const Z = aa(A),
                ne = [
                  ...new Set(
                    [Et(A, -1), ...Z.map((re, ie) => oa(A, re, ie))]
                      .filter((re) => re.tipo)
                      .map((re) => re.nome),
                  ),
                ].slice(0, 4);
              return `<button type="button" data-au336goto="${W}" class="au336-map-row"><b>${W + 1}. ${i(A.titulo || "Cena " + (W + 1))}</b><span>${ne.length ? ne.map(i).join(" · ") : "Explicação narrada"}${A.vis?.dados ? " · Gráfico histórico" : " "}</span></button>`;
            })
            .join(""),
          x = document.createElement("div");
        ((x.className = "au336-overlay"),
          (x.id = "au336-map"),
          x.setAttribute("role", "dialog"),
          x.setAttribute("aria-modal", "true"),
          x.setAttribute("aria-label", "Mapa visual da aula"),
          (x.innerHTML = `<div class="au336-dialog"><header><strong>🗺️ Roteiro visual · ${i(t.titulo)}</strong><button type="button" data-au336close="1" aria-label="Fechar mapa visual">✕</button></header><p>Os tópicos são inferidos do roteiro da aula, salvo no Supabase. Não são imagens geradas por IA nem recomendações de negociação.</p><div class="au336-list">${p}</div></div>`),
          document.body.appendChild(x),
          x.querySelector("[data-au336close]")?.focus());
      }
      function aa(t) {
        return (Array.isArray(t.fala) ? t.fala : [])
          .flatMap((p) => te(String(p || "")).map((x) => ({ t: x })))
          .slice(0, 65);
      }
      function oa(t, p, x) {
        const A = (Array.isArray(t.visuais) ? t.visuais : []).find(
          (Z) => Z && Z.fala === x && St.has(Z.tipo),
        );
        if (A)
          return { tipo: A.tipo, nome: lt.find((Z) => Z.tipo === A.tipo).nome };
        const W = lt.find((Z) => Z.re.test(p.t));
        return W ? { tipo: W.tipo, nome: W.nome } : { tipo: "", nome: "" };
      }
      function na(t) {
        const p = e.aiImgs[t];
        if (!p?.url || p.expira < Date.now()) return "";
        let x;
        try {
          const A = new URL(p.url);
          if (
            A.protocol !== "https:" ||
            !A.hostname.endsWith(".supabase.co") ||
            !A.pathname.includes("/storage/v1/object/sign/aulas-visuais/")
          )
            return "";
          x = A.href;
        } catch {
          return "";
        }
        return `<figure class="au337-figure"><img src="${i(x)}" alt="Imagem didática gerada por IA para esta cena. Não representa preços reais." loading="lazy" referrerpolicy="no-referrer"><figcaption>IMAGEM GERADA POR IA · ILUSTRAÇÃO DIDÁTICA, SEM COTAÇÕES REAIS</figcaption></figure>`;
      }
      async function gt(t, p) {
        const x = B(),
          A = e.a;
        if (!H() || !A || A.local || !SESS?.at)
          throw Error(
            "Entre na sua conta e escolha uma aula salva no Supabase.",
          );
        const W = cfg();
        if (!W?.url || !W?.key) throw Error("Supabase indisponível.");
        const Z = await fetch(W.url + "/functions/v1/aulas-visuais", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: W.key,
              Authorization: "Bearer " + SESS.at,
            },
            body: JSON.stringify({ acao: t, aula: A.id, cena: p }),
            signal: AbortSignal.timeout(11e4),
          }),
          ne = await Z.json().catch(() => ({}));
        if ((M(x), !e.on || e.a?.id !== A.id))
          throw Error("A aula foi fechada.");
        if (!Z.ok)
          throw Error(
            String(ne.error || "Não foi possível carregar a imagem."),
          );
        return ne;
      }
      function bt(t, p) {
        if (
          !(!p?.existe || typeof p.url != "string") &&
          ((e.aiImgs[t] = { url: p.url, expira: Date.now() + 50 * 6e4 }),
          e.i === t && e.on)
        ) {
          e.vis = "";
          const x = (ge(e.a.r.cenas[e.i]) || [])[e.j];
          tt(x?.k ?? -1);
        }
      }
      async function ra(t) {
        if (!(!e.a || e.a.local || !H() || e.aiImgs[t]?.expira > Date.now()))
          try {
            const p = await gt("consultar", t);
            bt(t, p);
          } catch {}
      }
      async function ia() {
        if (e.aiBusy) return;
        const t = e.i;
        if (!H() || e.a?.local) {
          toast?.("Entre na conta e abra uma aula salva no Supabase.");
          return;
        }
        if (
          !confirm(
            "Gerar uma imagem ilustrativa para esta cena usando IA? O provedor pode cobrar pela geração. Limite: até 5 imagens por dia na sua conta.",
          )
        )
          return;
        ($e(), (e.aiBusy = 1));
        const p = document.getElementById("au337status"),
          x = document.querySelector("[data-au337gerar]");
        (p && (p.textContent = "Gerando imagem…"), x && (x.disabled = !0));
        try {
          const A = await gt("gerar", t);
          (bt(t, A),
            p &&
              (p.textContent =
                "Imagem salva! Será reutilizada nas próximas reproduções."),
            toast?.("Imagem didática gerada e salva."));
        } catch (A) {
          (p && (p.textContent = String(A.message || A).slice(0, 160)),
            toast?.("Imagem: " + String(A.message || A).slice(0, 100)));
        } finally {
          ((e.aiBusy = 0), x && (x.disabled = !1));
        }
      }
      const At = () => E(o, "Kore"),
        sa = () => ["neural", "piper"].includes(E(G, "local"));
      function Qe() {
        const t = e.nEl;
        if (((e.nEl = null), t)) {
          ((t.onended = null), (t.ontimeupdate = null), (t.onerror = null));
          try {
            (t.pause(), t.removeAttribute("src"), t.load());
          } catch {}
        }
      }
      function Ke(t) {
        const p = document.getElementById("au339status");
        p && (p.textContent = String(t));
      }
      function Ve(t) {
        return E(G, "local") === "piper"
          ? "piper|" + String(e.a?.id || "") + "|" + t
          : t + "|" + At();
      }
      function We() {
        const t = E(G, "local"),
          p = document.getElementById("au348native"),
          x = document.getElementById("au348native-note");
        document
          .querySelectorAll("[data-au348mode]")
          .forEach((be) =>
            be.setAttribute("aria-pressed", String(be.dataset.au348mode === t)),
          );
        const A = document.getElementById("au339mode");
        A && (A.value = t);
        const W = e.nAudio[Ve(e.i)],
          Z = !!W && W.expira > Date.now();
        (p &&
          (Z
            ? (p.dataset.audioKey !== Ve(e.i) ||
                p.dataset.audioUrl !== W.url) &&
              (p.pause(),
              (p.src = W.url),
              (p.dataset.audioKey = Ve(e.i)),
              (p.dataset.audioUrl = W.url))
            : (p.pause(),
              p.removeAttribute("src"),
              p.removeAttribute("data-audio-key"),
              p.removeAttribute("data-audio-url")),
          (p.hidden = !Z)),
          x &&
            (x.textContent = Z
              ? "Reprodução direta: toque no ▶ do áudio. A imagem e a legenda não são sincronizadas neste modo."
              : "Áudio neural desta cena ainda não está disponível. Gere a voz ou use a voz do aparelho."));
        const ne = document.getElementById("au349native"),
          re = document.getElementById("au349status"),
          ie = t === "piper";
        if (ne) {
          const be = e.nAudio[Ve(e.i)];
          ie && be?.url
            ? (ne.dataset.key !== Ve(e.i) &&
                (ne.pause(), (ne.src = be.url), (ne.dataset.key = Ve(e.i))),
              (ne.hidden = !1))
            : (ne.pause(),
              ne.removeAttribute("src"),
              (ne.dataset.key = ""),
              (ne.hidden = !0));
        }
        re &&
          (re.textContent = ie
            ? e.nAudio[Ve(e.i)]?.url
              ? "Áudio Piper pronto nesta cena. Toque em Voltar à aula ou use o player abaixo."
              : "Ainda sem áudio Piper nesta cena. Importe os arquivos WAV gerados no PC."
            : "Piper é gratuito; selecione Piper acima para usar.");
      }
      async function $t(t, p) {
        const x = B(),
          A = e.a,
          W = cfg();
        if (!H() || !A || A.local || !SESS?.at || !W?.url || !W?.key)
          throw Error("Entre na conta e abra uma aula salva no Supabase.");
        const Z = await fetch(W.url + "/functions/v1/aulas-voz", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: W.key,
              Authorization: "Bearer " + SESS.at,
            },
            body: JSON.stringify({ acao: t, aula: A.id, cena: p, voz: At() }),
            signal: AbortSignal.timeout(115e3),
          }),
          ne = await Z.json().catch(() => ({}));
        if ((M(x), !e.on || e.a?.id !== A.id))
          throw Error("A aula foi fechada.");
        if (!Z.ok)
          throw Error(String(ne.error || "Falha ao consultar voz neural."));
        return ne;
      }
      function kt(t, p) {
        if (p?.existe && typeof p.url == "string") {
          try {
            const x = new URL(p.url);
            if (
              x.protocol !== "https:" ||
              !x.hostname.endsWith(".supabase.co") ||
              !x.pathname.includes("/storage/v1/object/sign/aulas-audio/")
            )
              return;
          } catch {
            return;
          }
          ((e.nAudio[Ve(t)] = { url: p.url, expira: Date.now() + 25 * 6e4 }),
            e.i === t &&
              (We(),
              Ke(
                "Áudio neural salvo nesta cena. Pode ouvir diretamente ou voltar à aula.",
              )));
        }
      }
      async function Ct(t) {
        if (
          E(G, "local") !== "piper" &&
          !(
            !e.on ||
            !e.a ||
            e.a.local ||
            !H() ||
            e.nAudio[Ve(t)]?.expira > Date.now()
          )
        )
          try {
            const p = await $t("consultar", t);
            kt(t, p);
          } catch {}
      }
      async function da() {
        if (e.nBusy) return;
        const t = e.i;
        if (!e.a || !H() || e.a.local) {
          Ke("É necessário entrar na conta e abrir uma aula salva.");
          return;
        }
        if (
          !confirm(
            "Gerar a narração desta cena com IA? Pode haver cobrança pelo provedor. O áudio será reutilizado; limite de 8 cenas por dia.",
          )
        )
          return;
        ($e(), (e.nBusy = 1));
        const p = document.querySelector("[data-au339gerar]");
        (p && (p.disabled = !0), Ke("Gerando áudio natural…"));
        try {
          const x = await $t("gerar", t);
          (kt(t, x),
            P(G, "neural"),
            We(),
            Ke("Áudio salvo! Toque em ▶ Voltar à aula para reproduzir."),
            toast?.("Voz neural pronta! Use Voltar à aula."));
        } catch (x) {
          (Ke(String(x.message || x).slice(0, 190)),
            toast?.("Voz neural: " + String(x.message || x).slice(0, 110)));
        } finally {
          ((e.nBusy = 0), p && (p.disabled = !1));
        }
      }
      function la(t, p) {
        const x = e.nAudio[Ve(t)];
        if (!x || x.expira < Date.now()) return !1;
        Qe();
        let A;
        try {
          ((A = new Audio(x.url)),
            (A.preload = "auto"),
            (A.playbackRate = +E(O, 0.95) || 0.95));
        } catch {
          return !1;
        }
        e.nEl = A;
        const W = ++e.tok;
        let Z = -1;
        const ne = () => {
          if (!e.play || W !== e.tok || e.i !== t || !p.length) return;
          const re = p.reduce((he, fe) => he + Math.max(1, fe.t.length), 0),
            ie = A.duration > 0 ? A.currentTime / A.duration : 0;
          let be = re * ie,
            pe = 0;
          for (
            ;
            pe < p.length - 1 &&
            ((be -= Math.max(1, p[pe].t.length)), !(be < 0));
            pe++
          );
          pe !== Z && ((Z = pe), (e.j = pe), tt(p[pe].k), je(p[pe]));
        };
        return (
          (A.ontimeupdate = ne),
          (A.onloadedmetadata = () => {
            if (e.j > 0) {
              const re = p.reduce((be, pe) => be + Math.max(1, pe.t.length), 0),
                ie = p
                  .slice(0, e.j)
                  .reduce((be, pe) => be + Math.max(1, pe.t.length), 0);
              A.currentTime = Math.min(
                A.duration * 0.99,
                (A.duration * ie) / re,
              );
            }
          }),
          (A.onended = () => {
            W !== e.tok ||
              !e.play ||
              (Qe(), (e.j = p.length), (e.t = setTimeout(Ue, 250)));
          }),
          (A.onerror = () => {
            W === e.tok &&
              (Ke("Áudio indisponível. Alternando para a voz do aparelho."),
              delete e.nAudio[Ve(t)],
              Qe(),
              P(G, "local"),
              We(),
              (e.t = setTimeout(Ue, 100)));
          }),
          A.play().catch((re) => {
            W === e.tok &&
              (Qe(),
              P(G, "local"),
              We(),
              Ke(
                "O Safari não reproduziu a voz neural (" +
                  (re?.name || "erro") +
                  "). Mudei para a voz do aparelho. Também é possível tocar diretamente no áudio salvo, em Opções.",
              ),
              toast?.(
                "Áudio neural bloqueado. Tente voz do aparelho ou áudio salvo nas Opções.",
              ),
              (e.t = setTimeout(Ue, 50)));
          }),
          !0
        );
      }
      const ca = "diario-aulas-piper-v349";
      function Tt() {
        return new Promise((t, p) => {
          if (!window.indexedDB)
            return p(
              Error("Este navegador não oferece armazenamento offline."),
            );
          const x = indexedDB.open(ca, 1);
          ((x.onupgradeneeded = () => {
            x.result.objectStoreNames.contains("audio") ||
              x.result.createObjectStore("audio");
          }),
            (x.onsuccess = () => t(x.result)),
            (x.onerror = () =>
              p(x.error || Error("Erro ao abrir armazenamento"))));
        });
      }
      async function ua(t, p) {
        const x = await Tt();
        return new Promise((A, W) => {
          const Z = x.transaction("audio", "readwrite");
          (Z.objectStore("audio").put(p, t),
            (Z.oncomplete = () => {
              (x.close(), A());
            }),
            (Z.onerror = () => {
              (x.close(), W(Z.error));
            }));
        });
      }
      async function pa(t) {
        const p = await Tt();
        return new Promise((x, A) => {
          const Z = p
            .transaction("audio", "readonly")
            .objectStore("audio")
            .get(t);
          ((Z.onsuccess = () => {
            (p.close(), x(Z.result));
          }),
            (Z.onerror = () => {
              (p.close(), A(Z.error));
            }));
        });
      }
      function at(t) {
        const p = document.getElementById("au349status");
        p && (p.textContent = t);
      }
      function Dt(t) {
        return "piper|" + String(e.a?.id || "") + "|" + t;
      }
      function Mt() {
        for (const [t, p] of Object.entries(e.nAudio || {}))
          t.startsWith("piper|") &&
            p.url?.startsWith("blob:") &&
            (URL.revokeObjectURL(p.url), delete e.nAudio[t]);
      }
      async function pt(t) {
        if (!e.on || !e.a) return;
        const p = e.a.id,
          x = Dt(t);
        try {
          if (e.nAudio[x]?.url) {
            We();
            return;
          }
          const A = await pa(String(p) + "|" + t);
          if (!A || !e.on || e.a?.id !== p) return;
          ((e.nAudio[x] = {
            url: URL.createObjectURL(A),
            expira: Number.MAX_SAFE_INTEGER,
          }),
            e.i === t &&
              (We(),
              at("Áudio Piper pronto nesta cena. Toque em Voltar à aula.")));
        } catch (A) {
          at(
            "Armazenamento offline indisponível: " +
              String(A.message || A).slice(0, 90),
          );
        }
      }
      function ma() {
        if (!e.a?.r?.cenas) return;
        const t = e.a,
          p = t.r.cenas.map((Z, ne) => ({
            cena: ne + 1,
            titulo: Z.titulo || "Cena " + (ne + 1),
            texto: (Z.fala || Z.falaSem || [])
              .join(" ")
              .replace(/\{\w+\}/g, "")
              .trim(),
          })),
          x = JSON.stringify(
            {
              formato: "diario-piper-v349",
              aula_id: String(t.id),
              titulo: String(t.titulo || ""),
              cenas: p,
            },
            null,
            2,
          ),
          A = URL.createObjectURL(new Blob([x], { type: "application/json" })),
          W = document.createElement("a");
        ((W.href = A),
          (W.download = "roteiro-piper-aula-" + (t.numero || "") + ".json"),
          document.body.appendChild(W),
          W.click(),
          W.remove(),
          setTimeout(() => URL.revokeObjectURL(A), 3e3),
          at(
            "Roteiro exportado. Gere os WAVs no computador e importe os arquivos aqui.",
          ));
      }
      async function fa(t) {
        if (!e.a || !t?.length) return;
        $e();
        const p = String(e.a.id);
        let x = 0,
          A = 0;
        const W = [...t];
        if (W.length > 250) {
          at("Selecione no máximo 250 arquivos por vez.");
          return;
        }
        for (const Z of W) {
          const ne = /^cena[-_ ]?(\d{1,3})\.wav$/i.exec(Z.name);
          if (!ne || Z.size < 44 || Z.size > 30 * 1024 * 1024) {
            A++;
            continue;
          }
          const re = +ne[1] - 1;
          if (re < 0 || re >= e.a.r.cenas.length) {
            A++;
            continue;
          }
          try {
            await ua(p + "|" + re, Z);
            const ie = Dt(re);
            (e.nAudio[ie]?.url?.startsWith("blob:") &&
              URL.revokeObjectURL(e.nAudio[ie].url),
              delete e.nAudio[ie],
              x++);
          } catch {
            A++;
          }
        }
        (await pt(e.i),
          at(
            x +
              " cena(s) importada(s) para esta aula." +
              (A ? " " + A + " ignorada(s)." : "") +
              " Arquivos armazenados neste navegador.",
          ));
      }
      function Rt(t) {
        const p = (x, A, W) =>
          `<li class="au338-check"><span aria-hidden="true">${A ? "✅" : "⚠️"}</span><span><b>${i(x)}</b><small>${i(W)}</small></span></li>`;
        return `<div class="au338-modal" id="au338-modal" role="dialog" aria-modal="true" aria-label="Diagnóstico das aulas"><div class="au338-panel"><header><strong>🧪 Testes de Aulas · v338</strong><button type="button" data-au338close="1" aria-label="Fechar diagnóstico">✕</button></header><p>Este diagnóstico não gera imagens nem consome sua cota da IA. Os testes de voz, TradingView e geração ainda precisam de sua confirmação.</p><ul>${p("Conexão", t.online, "O dispositivo precisa estar online para buscar imagens e gráficos.")}${p("Login Supabase", t.login, "Use a conta com a qual salvou a aula.")}${p("Narração", t.voice, "A disponibilidade e qualidade da voz dependem do dispositivo.")}${p("Aula sincronizada", t.lesson, "A cena atual deve corresponder ao texto narrado.")}${p("Imagem da cena", t.image, "Imagem encontrada no armazenamento privado; caso contrário, utilize o botão de gerar.")}${p("Biblioteca no servidor", t.backend, t.backendText)}</ul><div class="au338-actions"><button type="button" data-au338refresh="1">Atualizar diagnóstico</button><button type="button" data-au338graph="1">📈 Testar gráfico</button><button type="button" data-au338close="1">Fechar</button></div><small class="au338-small">Confira também: avançar cenas, pausar narração, retornar à cena, reabrir a aula e verificar se a imagem é reutilizada sem nova cobrança.</small></div></div>`;
      }
      async function It() {
        if (!e.on || !e.a) return;
        ($e(), document.getElementById("au338-modal")?.remove());
        const t = cfg(),
          p = navigator.onLine,
          x = H(),
          A = e.i,
          W = {
            online: p,
            login: x,
            voice: U(),
            lesson: !!e.a.r?.cenas?.[A],
            image: !!(e.aiImgs[A]?.url && e.aiImgs[A]?.expira > Date.now()),
            backend: !1,
            backendText: "Ainda não consultado.",
          };
        if (
          (document.body.insertAdjacentHTML("beforeend", Rt(W)),
          !x || !p || e.a.local)
        )
          W.backendText = e.a.local
            ? "Aula local: geração disponível somente para aulas salvas no Supabase."
            : "Conecte-se e entre na sua conta.";
        else {
          W.backendText = "Consultando a biblioteca privada…";
          try {
            const ne = await gt("consultar", A);
            ((W.backend = !0),
              (W.backendText = ne.existe
                ? "Imagem encontrada e reaproveitável."
                : "Biblioteca acessível; esta cena ainda não possui imagem."),
              ne.existe && bt(A, ne),
              (W.image = !!ne.existe));
          } catch (ne) {
            W.backendText = String(ne.message || ne).slice(0, 150);
          }
        }
        const Z = document.getElementById("au338-modal");
        Z &&
          ((Z.outerHTML = Rt(W)),
          document.querySelector("[data-au338close]")?.focus());
      }
      function ga(t, p, x, A, W) {
        return `<div class="au-lesson-visual">${A}${na(e.i)}${ea(W)}${!W.tipo || !E("aulas-motor-visual-v336", !0) ? Kt(t, p, x) : ""}</div>`;
      }
      const He = (t, p) => t == null || t.em == null || p >= t.em,
        ht = {
          titulo(t, p) {
            return `<div class="auv-tit">${t.kicker ? `<div class="auv-kick">${i(t.kicker)}</div>` : ""}<div class="auv-h">${i(t.t)}</div>${t.sub ? `<div class="auv-sub">${i(t.sub)}</div>` : ""}${t.chips ? `<div class="auv-chips">${t.chips.map((x) => `<span>${i(x)}</span>`).join("")}</div>` : ""}</div>`;
          },
          topicos(t, p) {
            return `<div class="auv-top">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}<ul>${t.itens
              .map((x) => {
                const A = typeof x == "string" ? { t: x } : x;
                return `<li class="${He(A, p) ? "on" : ""}">${A.ic ? `<span class="ic">${i(A.ic)}</span>` : '<span class="ic dot"></span>'}<span><b>${i(A.t)}</b>${A.s ? `<small>${i(A.s)}</small>` : ""}</span></li>`;
              })
              .join("")}</ul></div>`;
          },
          tabela(t, p) {
            return `<div class="auv-tab">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}<table><thead><tr>${t.cab.map((x) => `<th>${i(x)}</th>`).join("")}</tr></thead><tbody>${t.linhas
              .map((x, A) => {
                const W = t.em && t.em[A];
                return `<tr class="${W == null || p >= W ? "on" : ""}">${x.map((Z, ne) => `<td${ne === 0 ? ' class="r"' : ""}>${i(Z)}</td>`).join("")}</tr>`;
              })
              .join(
                "",
              )}</tbody></table>${t.nota ? `<div class="auv-nota">${i(t.nota)}</div>` : ""}</div>`;
          },
          formula(t, p) {
            return `<div class="auv-for">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}<div class="auv-f">${i(t.f)}</div>${(
              t.linhas || []
            )
              .map((x) => {
                const A = typeof x == "string" ? { t: x } : x;
                return `<div class="auv-fl ${He(A, p) ? "on" : ""}${A.forte ? " forte" : ""}">${i(A.t)}</div>`;
              })
              .join("")}</div>`;
          },
          pergunta(t, p) {
            return `<div class="auv-q"><div class="auv-kick">Revisão</div><div class="auv-qq">${i(t.q)}</div><div class="auv-qa ${p >= (t.em || 1) ? "on" : ""}">${i(t.r)}</div></div>`;
          },
          fluxo: ba,
          payoff: ha,
          candles: va,
          ajuste: Aa,
          convergencia: $a,
          figura: ya,
        };
      function ba(t, p) {
        const A = t.h || 56,
          W = {};
        t.nos.forEach((ne) => (W[ne.id] = ne));
        let Z = `<svg viewBox="0 0 100 ${A}" class="auv-svg" role="img" aria-label="${i(t.t || "Diagrama")}"><defs><marker id="auar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9ca0a9"/></marker></defs>`;
        for (const ne of t.setas || []) {
          if (!He(ne, p)) continue;
          const re = W[ne.de],
            ie = W[ne.para];
          if (!re || !ie) continue;
          const be = ie.x - re.x,
            pe = ie.y - re.y,
            he = Math.hypot(be, pe),
            fe = be / he,
            ke = pe / he,
            we = (re.w || 22) / 2,
            Ee = (re.hh || 9) / 2,
            Te = (ie.w || 22) / 2,
            Ie = (ie.hh || 9) / 2,
            Oe =
              Math.min(
                Math.abs(fe) > 1e-6 ? we / Math.abs(fe) : 1e9,
                Math.abs(ke) > 1e-6 ? Ee / Math.abs(ke) : 1e9,
              ) + 1,
            Ne =
              Math.min(
                Math.abs(fe) > 1e-6 ? Te / Math.abs(fe) : 1e9,
                Math.abs(ke) > 1e-6 ? Ie / Math.abs(ke) : 1e9,
              ) + 1.5,
            ye = re.x + fe * Oe,
            le = re.y + ke * Oe,
            De = ie.x - fe * Ne,
            ce = ie.y - ke * Ne,
            Ce = ne.off || 0,
            qe = -ke * Ce,
            Be = fe * Ce;
          ((Z += `<line x1="${ye + qe}" y1="${le + Be}" x2="${De + qe}" y2="${ce + Be}" stroke="${ne.cor || "#9ca0a9"}" stroke-width=".5" marker-end="url(#auar)"${ne.dupla ? ' marker-start="url(#auar)"' : ""}/>`),
            ne.t &&
              (Z += `<text x="${(ye + De) / 2 + qe + (ne.tx || 0)}" y="${(le + ce) / 2 + Be - 1.4 + (ne.ty || 0)}" class="auv-st">${i(ne.t)}</text>`));
        }
        for (const ne of t.nos) {
          if (!He(ne, p)) continue;
          const re = ne.w || 22,
            ie = ne.hh || 9;
          Z += `<g><rect x="${ne.x - re / 2}" y="${ne.y - ie / 2}" width="${re}" height="${ie}" rx="2" fill="${ne.cor || "#26282b"}" stroke="${ne.borda || "#373a3f"}" stroke-width=".4"/><text x="${ne.x}" y="${ne.y + (ne.sub ? -0.4 : 1.1)}" class="auv-nt">${i(ne.t)}</text>${ne.sub ? `<text x="${ne.x}" y="${ne.y + 2.9}" class="auv-ns">${i(ne.sub)}</text>` : ""}</g>`;
        }
        return `<div class="auv-flx">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}${Z}</svg>${t.nota ? `<div class="auv-nota">${i(t.nota)}</div>` : ""}</div>`;
      }
      function vt(t, p, x) {
        const A = p - t,
          W = Math.pow(10, Math.floor(Math.log10(A / x))),
          Z = [1, 2, 2.5, 5, 10].find((re) => A / (re * W) <= x) * W,
          ne = [];
        for (let re = Math.ceil(t / Z) * Z; re <= p + 1e-9; re += Z)
          ne.push(+re.toFixed(10));
        return ne;
      }
      function ha(t, p) {
        const [x, A] = t.x,
          W = 100,
          Z = 58,
          ne = 11,
          re = 3,
          ie = 5,
          be = 9,
          pe = (le, De) => {
            const ce = le.q || 1,
              Ce = le.p || 0;
            return (
              (le.tipo === "call"
                ? Math.max(De - le.K, 0) - Ce
                : le.tipo === "put"
                  ? Math.max(le.K - De, 0) - Ce
                  : De - le.K) *
              (le.pos || 1) *
              ce
            );
          },
          he = (le) => t.pernas.reduce((De, ce) => De + pe(ce, le), 0),
          fe = [];
        for (let le = 0; le <= 200; le++) fe.push(x + ((A - x) * le) / 200);
        const ke = [
          0,
          ...fe.map(he),
          ...(t.pernas.length > 1
            ? t.pernas.flatMap((le) => fe.map((De) => pe(le, De)))
            : []),
        ];
        let we = Math.min(...ke),
          Ee = Math.max(...ke);
        const Te = (Ee - we) * 0.12 || 1;
        ((we -= Te), (Ee += Te));
        const Ie = (le) => ne + ((le - x) / (A - x)) * (W - ne - re),
          Oe = (le) => ie + ((Ee - le) / (Ee - we)) * (Z - ie - be),
          Ne = (le) =>
            fe
              .map(
                (De, ce) =>
                  (ce ? "L" : "M") +
                  Ie(De).toFixed(2) +
                  " " +
                  Oe(le(De)).toFixed(2),
              )
              .join("");
        let ye = `<svg viewBox="0 0 ${W} ${Z}" class="auv-svg">`;
        for (const le of vt(we, Ee, 5))
          ye += `<line x1="${ne}" x2="${W - re}" y1="${Oe(le)}" y2="${Oe(le)}" class="auv-grid"/><text x="${ne - 1}" y="${Oe(le) + 1}" class="auv-ax" text-anchor="end">${m(le, Math.abs(le) < 10 && le % 1 ? 1 : 0)}</text>`;
        for (const le of vt(x, A, 6))
          ye += `<text x="${Ie(le)}" y="${Z - be + 4}" class="auv-ax" text-anchor="middle">${m(le, le % 1 ? 1 : 0)}</text>`;
        ((ye += `<line x1="${ne}" x2="${W - re}" y1="${Oe(0)}" y2="${Oe(0)}" stroke="#7a808c" stroke-width=".35"/>`),
          (ye += `<path d="${fe.map((le, De) => (De ? "L" : "M") + Ie(le).toFixed(2) + " " + Oe(Math.max(0, he(le))).toFixed(2)).join("")}L${Ie(A)} ${Oe(0)}L${Ie(x)} ${Oe(0)}Z" fill="rgba(173,133,58,0.14)"/>`),
          (ye += `<path d="${fe.map((le, De) => (De ? "L" : "M") + Ie(le).toFixed(2) + " " + Oe(Math.min(0, he(le))).toFixed(2)).join("")}L${Ie(A)} ${Oe(0)}L${Ie(x)} ${Oe(0)}Z" fill="rgba(231,97,76,0.14)"/>`),
          t.pernas.length > 1 &&
            t.pernas.forEach((le) => {
              ye += `<path d="${Ne((De) => pe(le, De))}" fill="none" stroke="#7a808c" stroke-width=".4" stroke-dasharray="1.2 1"/>`;
            }));
        for (const le of t.pernas)
          le.K != null &&
            (ye += `<line x1="${Ie(le.K)}" x2="${Ie(le.K)}" y1="${ie}" y2="${Z - be}" stroke="#52565e" stroke-width=".3" stroke-dasharray=".8 .8"/><text x="${Ie(le.K)}" y="${ie + 2.6}" class="auv-ax" text-anchor="middle">${i(t.rotK || "K")} ${m(le.K, le.K % 1 ? 2 : 0)}</text>`);
        if (
          ((ye += `<path d="${Ne(he)}" fill="none" stroke="${t.cor || "#cca764"}" stroke-width=".9" stroke-linejoin="round"/>`),
          He({ em: t.emBe }, p))
        )
          for (let le = 1; le < fe.length; le++) {
            const De = he(fe[le - 1]),
              ce = he(fe[le]);
            if (
              !(De === 0 && le > 1) &&
              ((De < 0 && ce >= 0) || (De > 0 && ce <= 0))
            ) {
              const Ce =
                fe[le - 1] +
                (fe[le] - fe[le - 1]) *
                  (Math.abs(De) / (Math.abs(De) + Math.abs(ce)));
              ye += `<circle cx="${Ie(Ce)}" cy="${Oe(0)}" r=".9" fill="#c69a49"/><text x="${Ie(Ce) + 1}" y="${Oe(0) + (t.beBaixo ? 4 : -1.6)}" class="auv-lb" fill="#c69a49">equilíbrio ${m(Ce, 2)}</text>`;
            }
          }
        if (t.ponto && He(t.ponto, p)) {
          const le = t.ponto.s,
            De = he(le);
          ye += `<circle cx="${Ie(le)}" cy="${Oe(De)}" r="1.1" fill="#ffffff"/><text x="${Ie(le) + (t.ponto.esq ? -1.5 : 1.5)}" y="${Oe(De) - 1.8}" class="auv-lb" text-anchor="${t.ponto.esq ? "end" : "start"}">${i(t.ponto.t || "")} ${De >= 0 ? "+" : ""}${m(De, 2)}</text>`;
        }
        return (
          (ye += `<text x="${(ne + W - re) / 2}" y="${Z - 0.6}" class="auv-ax" text-anchor="middle">${i(t.xr || "Preço no vencimento")}</text></svg>`),
          `<div class="auv-pay">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}${ye}${t.nota ? `<div class="auv-nota">${i(t.nota)}</div>` : ""}</div>`
        );
      }
      function Ot(t, p) {
        return `<div class="auv-wait">${p && p.erro ? `<b>Gráfico real indisponível agora</b><span>${i(p.erro)}</span>` : "<b>Buscando dados reais…</b><span>" + i(t.dados.ativo) + " · " + i(ut(t.dados.de)) + " a " + i(ut(t.dados.ate)) + "</span>"}</div>`;
      }
      function va(t, p, x) {
        if (!x || x.erro)
          return `<div class="auv-cd">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}${Ot(t, x)}</div>`;
        const A = x.cd,
          W = 100,
          Z = 56,
          ne = 2,
          re = 12,
          ie = 4,
          be = 6,
          pe = A.length;
        let he = Math.min(...A.map((ye) => ye[3])),
          fe = Math.max(...A.map((ye) => ye[2]));
        const ke = (fe - he) * 0.06;
        ((he -= ke), (fe += ke));
        const we = (ye) => ne + ((ye + 0.5) * (W - ne - re)) / pe,
          Ee = (ye) => ie + ((fe - ye) / (fe - he)) * (Z - ie - be),
          Te = Math.max(0.15, ((W - ne - re) / pe) * 0.62),
          Ie = t.dados.casas != null ? t.dados.casas : 2;
        let Oe = `<svg viewBox="0 0 ${W} ${Z}" class="auv-svg">`;
        for (const ye of vt(he, fe, 5))
          Oe += `<line x1="${ne}" x2="${W - re}" y1="${Ee(ye)}" y2="${Ee(ye)}" class="auv-grid"/><text x="${W - re + 1}" y="${Ee(ye) + 1}" class="auv-ax">${m(ye, ye % 1 ? Ie : 0)}</text>`;
        A.forEach((ye, le) => {
          const De = ye[4] >= ye[1],
            ce = De ? "#3aad74" : "#e7614c";
          Oe += `<line x1="${we(le)}" x2="${we(le)}" y1="${Ee(ye[2])}" y2="${Ee(ye[3])}" stroke="${ce}" stroke-width="${Math.min(0.3, Te / 2)}"/><rect x="${we(le) - Te / 2}" y="${Ee(Math.max(ye[1], ye[4]))}" width="${Te}" height="${Math.max(0.15, Math.abs(Ee(ye[1]) - Ee(ye[4])))}" fill="${ce}"/>`;
        });
        const Ne = new Set();
        if (
          (A.forEach((ye, le) => {
            const De = dt(ye[0]),
              ce = De.slice(0, 7);
            pe > 60
              ? Ne.has(ce) ||
                (Ne.add(ce),
                (Ne.size % 2 || pe < 150) &&
                  (Oe += `<text x="${we(le)}" y="${Z - 1.5}" class="auv-ax" text-anchor="middle">${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+De.slice(5, 7) - 1]}</text>`))
              : le % Math.ceil(pe / 7) === 0 &&
                (Oe += `<text x="${we(le)}" y="${Z - 1.5}" class="auv-ax" text-anchor="middle">${De.slice(8, 10)}/${De.slice(5, 7)}</text>`);
          }),
          He({ em: t.emMarcas }, p))
        ) {
          const ye = A[0][4],
            le = A[pe - 1][4];
          ((Oe += `<line x1="${we(0)}" x2="${we(pe - 1)}" y1="${Ee(ye)}" y2="${Ee(ye)}" stroke="#c69a49" stroke-width=".35" stroke-dasharray="1 1"/><circle cx="${we(0)}" cy="${Ee(ye)}" r=".9" fill="#c69a49"/><text x="${we(0) + 1}" y="${Ee(ye) + (le > ye ? 3.6 : -1.5)}" class="auv-lb" fill="#c69a49">${i(t.rotIni || "início")} ${m(ye, Ie)}</text>`),
            (Oe += `<circle cx="${we(pe - 1)}" cy="${Ee(le)}" r=".9" fill="#cca764"/><text x="${we(pe - 1) - 1}" y="${Ee(le) + (le > ye ? -1.5 : 3.6)}" class="auv-lb" fill="#cca764" text-anchor="end">${i(t.rotFim || "fim")} ${m(le, Ie)} (${q(100 * (le / ye - 1))})</text>`));
        }
        return (
          (Oe += Ea(t, p, A, we, Ee, W, re, Ie, pe)),
          (Oe += "</svg>"),
          `<div class="auv-cd">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}${Oe}<div class="auv-fonte">Dados reais · ${i(x.simbolo)} · ${i(x.fonte)}${t.nota ? " · " + i(t.nota) : ""}</div></div>`
        );
      }
      const Pt = new Map();
      async function xa(t) {
        const p = e.a.r.cenas[t],
          x = p.vis,
          A = e.a.r,
          W = (A.figuras || {})[x.id],
          Z = (re) => {
            ((e.dados[t] = re),
              e.i === t &&
                e.on &&
                (tt(e.j ? ((ge(p) || [])[e.j] || {}).k : -1),
                e.play || je(null)));
          };
        if (!A.figDir || !W) {
          Z({ erro: "Figura não encontrada nesta aula." });
          return;
        }
        const ne = A.figDir + "/" + x.id + ".jpg";
        try {
          let re = Pt.get(ne);
          if (!re) {
            let ie;
            if (window.AULAS_FIGURA) ie = await window.AULAS_FIGURA(ne);
            else {
              if (!H())
                throw new Error("Entre na conta para ver a figura do livro.");
              await tok();
              const be = cfg(),
                pe = await fetch(
                  `${be.url}/storage/v1/object/authenticated/aulas-figuras/${ne}`,
                  {
                    headers: {
                      apikey: be.key,
                      Authorization: "Bearer " + SESS.at,
                    },
                  },
                );
              if (!pe.ok)
                throw new Error(
                  "Figura indisponível agora (" + pe.status + ").",
                );
              ie = await pe.blob();
            }
            re = URL.createObjectURL(ie);
            try {
              const be = new Image();
              ((be.src = re), await be.decode());
            } catch {}
            Pt.set(ne, re);
          }
          Z({ url: re, fig: W });
        } catch (re) {
          Z({ erro: String(re.message || re) });
        }
      }
      function ya(t, p, x, A) {
        const W = t.t ? `<div class="auv-h2">${i(t.t)}</div>` : "";
        if (!x)
          return `<div class="auv-fig">${W}<div class="auv-wait"><b>Carregando a figura do livro…</b></div></div>`;
        if (x.erro)
          return `<div class="auv-tit" data-fig-erro="${i(x.erro)}"><div class="auv-kick">Figura do livro</div><div class="auv-h">${i(t.t || (A && A.titulo) || "Figura")}</div>${t.nota ? `<div class="auv-sub">${i(t.nota)}</div>` : ""}</div>`;
        const Z = x.fig || {};
        return `<div class="auv-fig${t.zoom ? " zoom" : ""}">${W}<div class="auv-figbox"><img src="${i(x.url)}" alt="${i(Z.leg || t.nota || "Figura do livro")}"></div><div class="auv-fonte">${i(Z.leg || "Figura do livro")}${Z.pag ? " · p. " + Z.pag : ""}${t.nota ? " · " + i(t.nota) : ""}</div></div>`;
      }
      const wa = {
          max: "#3aad74",
          min: "#e7614c",
          ini: "#c69a49",
          fim: "#64cc98",
          mm: "#c9c5bc",
          entrada: "#c69a49",
          stop: "#e7614c",
          alvo: "#3aad74",
          nivel: "#9ca0a9",
        },
        Sa = {
          max: "máxima",
          min: "mínima",
          ini: "início",
          fim: "fim",
          entrada: "entrada",
          stop: "stop",
          alvo: "alvo",
          nivel: "nível",
        };
      function Ea(t, p, x, A, W, Z, ne, re, ie) {
        let be = "";
        for (const pe of t.marcas || []) {
          if (!He(pe, p)) continue;
          const he = wa[pe.k] || "#9ca0a9";
          if (pe.k === "mm") {
            const le = Math.max(2, Math.min(200, +pe.n || 20));
            if (ie < le + 2) continue;
            let De = [],
              ce = 0;
            for (let qe = 0; qe < ie; qe++)
              ((ce += x[qe][4]),
                qe >= le && (ce -= x[qe - le][4]),
                qe >= le - 1 &&
                  De.push(A(qe).toFixed(2) + "," + W(ce / le).toFixed(2)));
            be += `<polyline points="${De.join(" ")}" fill="none" stroke="${he}" stroke-width=".45"/>`;
            const Ce = De[De.length - 1].split(",");
            be += `<text x="${(+Ce[0] - 1).toFixed(2)}" y="${(+Ce[1] - 1.4).toFixed(2)}" class="auv-lb" fill="${he}" text-anchor="end">${i(pe.t || "média " + le)}</text>`;
            continue;
          }
          let fe, ke;
          if (pe.k === "max") {
            fe = 0;
            for (let le = 1; le < ie; le++) x[le][2] > x[fe][2] && (fe = le);
            ke = x[fe][2];
          } else if (pe.k === "min") {
            fe = 0;
            for (let le = 1; le < ie; le++) x[le][3] < x[fe][3] && (fe = le);
            ke = x[fe][3];
          } else if (pe.k === "ini") ((fe = 0), (ke = x[0][4]));
          else if (pe.k === "fim") ((fe = ie - 1), (ke = x[ie - 1][4]));
          else {
            if (pe.preco == null) continue;
            ((ke = +pe.preco),
              (fe = pe.d ? x.findIndex((le) => dt(le[0]) === pe.d) : 0),
              fe < 0 && (fe = 0));
          }
          const we = W(ke),
            Ee =
              pe.k === "stop" || pe.k === "alvo" || pe.k === "nivel"
                ? ' stroke-dasharray="1 .9"'
                : "";
          be += `<line x1="${A(fe)}" x2="${Z - ne}" y1="${we}" y2="${we}" stroke="${he}" stroke-width=".35"${Ee}/><circle cx="${A(fe)}" cy="${we}" r=".9" fill="${he}"/>`;
          const Te = `${i(pe.t || Sa[pe.k] || "")} ${m(ke, re)}`,
            Ie = Te.length * 1.5 + 1.2,
            Ne = fe > ie * 0.3 ? A(fe) - 1.4 - Ie : A(fe) + 1.4,
            ye = we + (pe.k === "min" ? 3.4 : -1.4);
          if (
            ((be += `<rect x="${Ne.toFixed(2)}" y="${(ye - 2.5).toFixed(2)}" width="${Ie.toFixed(2)}" height="3.3" rx=".6" fill="#070708" fill-opacity=".8"/><text x="${(Ne + Ie / 2).toFixed(2)}" y="${(ye - 0.1).toFixed(2)}" class="auv-lb" fill="${he}" text-anchor="middle">${Te}</text>`),
            pe.lado)
          ) {
            const le = pe.lado === "compra",
              De = le ? W(x[fe][3]) + 2.2 : W(x[fe][2]) - 2.2,
              ce = le
                ? `${A(fe)},${De - 1.6} ${A(fe) - 0.9},${De + 0.6} ${A(fe) + 0.9},${De + 0.6}`
                : `${A(fe)},${De + 1.6} ${A(fe) - 0.9},${De - 0.6} ${A(fe) + 0.9},${De - 0.6}`;
            be += `<polygon points="${ce}" fill="${le ? "#3aad74" : "#e7614c"}"/>`;
          }
        }
        return be;
      }
      try {
        const t = document.createElement("style");
        ((t.id = "aulas-fig-css"),
          (t.textContent =
            ".auv-fig{display:flex;flex-direction:column;align-items:stretch}.auv-figbox{background:#ffffff;border-radius:8px;padding:8px;display:flex;justify-content:center;align-items:center}.auv-figbox img{display:block;max-width:100%;max-height:min(40vh,560px);object-fit:contain}.auv-fig.zoom .auv-figbox img{max-height:min(50vh,700px)}html body #aup .aup-vis .auv-figbox img:not(#v511a){max-height:calc(100cqh - 8.5em)}html body #aup .aup-vis .auv-fig.zoom .auv-figbox img:not(#v511a){max-height:calc(100cqh - 6.5em)}"),
          document.head.appendChild(t));
      } catch {}
      function mt(t, p) {
        const x = t.contratos || 1,
          A = t.mult,
          W = t.lado || 1,
          Z = t.margemIni * x,
          ne = t.margemMan * x,
          re = [];
        let ie = Z,
          be = 0,
          pe = 0,
          he = 0;
        for (let ke = 0; ke < p.length; ke++) {
          const we = p[ke],
            Ee = ke ? (we - p[ke - 1]) * A * x * W : 0;
          ((be += Ee), (ie += Ee));
          let Te = 0;
          (ie < ne && ((Te = Z - ie), (pe += Te), he++),
            re.push({ p: we, aj: Ee, acum: be, saldo: ie, call: Te }),
            Te && (ie = Z));
        }
        const fe = t.casas != null ? t.casas : p.some((ke) => ke % 1) ? 1 : 0;
        return {
          rows: re,
          ini: Z,
          man: ne,
          ph: {
            chamadas:
              he === 0
                ? "nenhuma chamada de margem"
                : he === 1
                  ? "uma chamada de margem"
                  : he + " chamadas de margem",
            deposito: c(pe).replace("R$ ", "") + " reais",
            total:
              (be < 0 ? "um prejuízo de " : "um lucro de ") +
              m(Math.abs(be), 2) +
              " reais",
            pIni: m(p[0], fe),
            pFim: m(p[p.length - 1], fe),
            margemIni: m(Z, 0) + " reais",
            margemMan: m(ne, 0) + " reais",
          },
        };
      }
      function Aa(t, p, x) {
        let A = t.precos,
          W = null;
        if (t.dados) {
          if (!x || x.erro)
            return `<div class="auv-aj">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}${Ot(t, x)}</div>`;
          ((A = x.cd.map(
            (ce) => +ce[4].toFixed(t.dados.casas != null ? t.dados.casas : 0),
          )),
            (W = x.cd.map((ce) => dt(ce[0]))));
        }
        const Z = mt(t, A),
          ne = Z.rows,
          re = t.casas != null ? t.casas : A.some((ce) => ce % 1) ? 1 : 0,
          ie = He({ em: t.emTab }, p),
          be = 100,
          pe = 30,
          he = 2,
          fe = 16,
          ke = 3,
          we = 4,
          Ee = ne.map((ce) => ce.saldo);
        let Te = Math.min(Z.man, ...Ee),
          Ie = Math.max(Z.ini, ...Ee);
        const Oe = (Ie - Te) * 0.12;
        ((Te -= Oe), (Ie += Oe));
        const Ne = (ce) =>
            he + (ce * (be - he - fe)) / Math.max(1, ne.length - 1),
          ye = (ce) => ke + ((Ie - ce) / (Ie - Te)) * (pe - ke - we);
        let le = `<svg viewBox="0 0 ${be} ${pe}" class="auv-svg">`;
        ((le += `<line x1="${he}" x2="${be - fe}" y1="${ye(Z.ini)}" y2="${ye(Z.ini)}" stroke="#cca764" stroke-width=".3" stroke-dasharray="1 .8"/><text x="${be - fe + 1}" y="${ye(Z.ini) + 1}" class="auv-ax" fill="#cca764">inicial</text>`),
          (le += `<line x1="${he}" x2="${be - fe}" y1="${ye(Z.man)}" y2="${ye(Z.man)}" stroke="#c69a49" stroke-width=".3" stroke-dasharray="1 .8"/><text x="${be - fe + 1}" y="${ye(Z.man) + 1}" class="auv-ax" fill="#c69a49">manutenção</text>`),
          (le += `<path d="${ne.map((ce, Ce) => (Ce ? "L" : "M") + Ne(Ce).toFixed(2) + " " + ye(ce.saldo).toFixed(2) + (ce.call ? "L" + Ne(Ce).toFixed(2) + " " + ye(Z.ini).toFixed(2) : "")).join("")}" fill="none" stroke="#efeeeb" stroke-width=".6"/>`),
          ne.forEach((ce, Ce) => {
            le += `<circle cx="${Ne(Ce)}" cy="${ye(ce.saldo)}" r="${ce.call ? 1.1 : 0.55}" fill="${ce.call ? "#e7614c" : "#efeeeb"}"/>`;
          }),
          (le += "</svg>"));
        const De = `<table class="auv-ajt"><thead><tr><th>Dia</th><th>Preço</th><th>Ajuste</th><th>Saldo</th></tr></thead><tbody>${ne.map((ce, Ce) => `<tr class="${ce.call ? "call" : ""}"><td>${W ? W[Ce].slice(8, 10) + "/" + W[Ce].slice(5, 7) : Ce + 1}</td><td>${m(ce.p, re)}</td><td class="${ce.aj > 0 ? "pos" : ce.aj < 0 ? "neg" : ""}">${Ce ? c(ce.aj) : "—"}</td><td>${c(ce.saldo)}${ce.call ? `<small>chamada: +${c(ce.call)}</small>` : ""}</td></tr>`).join("")}</tbody></table>`;
        return `<div class="auv-aj">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}<div class="auv-ajc">${i(t.desc || "")}</div>${le}${ie ? De : ""}${t.dados && x ? `<div class="auv-fonte">Fechamentos reais · ${i(x.simbolo)} · ${i(x.fonte)}${t.nota ? " · " + i(t.nota) : ""}</div>` : t.nota ? `<div class="auv-fonte">${i(t.nota)}</div>` : ""}</div>`;
      }
      function $a(t, p) {
        const ie = (we) => 6 + we * 88,
          be = (we) => 6 + (1 - we) * 38,
          he = (we) =>
            0.5 +
            0.08 * Math.sin(we * 9) +
            0.05 * Math.sin(we * 23 + 1) -
            0.04 * we,
          fe = (we, Ee, Te, Ie) => {
            if (!He({ em: Ie }, p)) return "";
            const Oe = (le) => he(le) + we * 0.22 * (1 - le);
            let Ne = "",
              ye = "";
            for (let le = 0; le <= 60; le++) {
              const De = le / 60;
              Ne +=
                (le ? "L" : "M") +
                ie(De).toFixed(2) +
                " " +
                be(Oe(De)).toFixed(2);
            }
            return `<path d="${Ne}" fill="none" stroke="${Ee}" stroke-width=".7"/><text x="${ie(0.06)}" y="${be(Oe(0.06)) + (we > 0 ? -1.6 : 3.4)}" class="auv-lb" fill="${Ee}">${Te}</text>`;
          };
        let ke = "";
        for (let we = 0; we <= 60; we++) {
          const Ee = we / 60;
          ke +=
            (we ? "L" : "M") + ie(Ee).toFixed(2) + " " + be(he(Ee)).toFixed(2);
        }
        return `<div class="auv-cv">${t.t ? `<div class="auv-h2">${i(t.t)}</div>` : ""}<svg viewBox="0 0 100 52" class="auv-svg"><line x1="${ie(1)}" x2="${ie(1)}" y1="4" y2="44" stroke="#7a808c" stroke-width=".3" stroke-dasharray="1 1"/><text x="${ie(1)}" y="48" class="auv-ax" text-anchor="end">vencimento</text><text x="${ie(0)}" y="48" class="auv-ax">hoje</text>
${fe(1, "#cca764", "futuro acima do à vista (normal)", t.emA)}${fe(-1, "#c69a49", "futuro abaixo do à vista (invertido)", t.emB)}<path d="${ke}" fill="none" stroke="#efeeeb" stroke-width=".8"/><text x="${ie(0.62)}" y="${be(he(0.62)) + 3.6}" class="auv-lb">preço à vista</text><circle cx="${ie(1)}" cy="${be(he(1))}" r="1.1" fill="#c69a49"/></svg>${t.nota ? `<div class="auv-nota">${i(t.nota)}</div>` : ""}</div>`;
      }
      const xt = [
        ["BMFBOVESPA:PETR4", "PETR4 · Petrobras"],
        ["BMFBOVESPA:VALE3", "VALE3 · Vale"],
        ["BMFBOVESPA:IBOV", "Ibovespa"],
        ["BMFBOVESPA:WIN1!", "WIN · Futuro"],
        ["BMFBOVESPA:WDO1!", "WDO · Futuro"],
        ["NASDAQ:NDX", "Nasdaq 100"],
        ["FX_IDC:USDBRL", "USD/BRL"],
      ];
      function ka() {
        const t = e.a?.r?.cenas?.[e.i] || {},
          p = t.vis?.dados,
          x = String(p?.ativo || "").toUpperCase(),
          A = xt.find(([Z]) => Z === x || Z.split(":")[1] === x);
        if (A) return A[0];
        const W = (
          t.titulo +
          " " +
          (t.vis?.t || "") +
          " " +
          (e.a?.livro || "")
        ).toLowerCase();
        return /nasdaq|eua|americano/.test(W)
          ? "NASDAQ:NDX"
          : /wdo|d[oó]lar futuro/.test(W)
            ? "BMFBOVESPA:WDO1!"
            : /win|mini.?[ií]ndice|futuro de [ií]ndice/.test(W)
              ? "BMFBOVESPA:WIN1!"
              : /vale|min[eé]rio/.test(W)
                ? "BMFBOVESPA:VALE3"
                : /petr[oó]leo|petr4/.test(W)
                  ? "BMFBOVESPA:PETR4"
                  : "BMFBOVESPA:IBOV";
      }
      function nt() {
        document.getElementById("au-tradingview")?.remove();
      }
      function qt() {
        if (!e.on) return;
        ($e(), nt());
        const t = ka(),
          p = document.createElement("div");
        ((p.id = "au-tradingview"),
          (p.className = "au-tv-overlay"),
          p.setAttribute("role", "dialog"),
          p.setAttribute("aria-modal", "true"),
          p.setAttribute("aria-label", "Gráfico TradingView para estudos"),
          (p.innerHTML = `<section class="au-tv-panel"><div class="au-tv-top"><strong>📈 Gráfico de estudo · TradingView</strong><button type="button" data-autvclose="1" aria-label="Fechar gráfico">✕</button></div><div class="au-tv-controls"><label>Ativo <select id="au-tv-symbol">${xt.map(([x, A]) => `<option value="${i(x)}" ${x === t ? "selected" : ""}>${i(A)}</option>`).join("")}</select></label><label>Período <select id="au-tv-interval"><option value="D">Diário</option><option value="60">1 hora</option><option value="15">15 minutos</option><option value="W">Semanal</option></select></label><a id="au-tv-external" target="_blank" rel="noopener noreferrer">Abrir no TradingView ↗</a></div><div id="au-tv-chart" class="au-tv-chart"><div class="au-tv-loading">Carregando gráfico oficial do TradingView…</div></div><div class="au-tv-legal">Gráfico fornecido pelo TradingView, sujeito a disponibilidade, licenças e atrasos da fonte. A aula fica pausada enquanto você estuda. O gráfico ao vivo não corresponde necessariamente ao período histórico narrado.</div></section>`),
          document.body.appendChild(p),
          Nt(),
          document.querySelector("[data-autvclose]")?.focus());
      }
      function Nt() {
        const t = document.getElementById("au-tradingview");
        if (!t) return;
        const p = t.querySelector("#au-tv-symbol")?.value,
          x = t.querySelector("#au-tv-interval")?.value;
        if (!xt.some(([be]) => be === p) || !["D", "60", "15", "W"].includes(x))
          return;
        t.querySelector("#au-tv-external").href =
          "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(p);
        const A = t.querySelector("#au-tv-chart");
        A.replaceChildren();
        const W = document.createElement("div");
        ((W.className = "tradingview-widget-container"),
          (W.style.cssText = "width:100%;height:100%"));
        const Z = document.createElement("div");
        ((Z.className = "tradingview-widget-container__widget"),
          (Z.style.cssText = "width:100%;height:calc(100% - 28px)"));
        const ne = document.createElement("div");
        ne.className = "tradingview-widget-copyright";
        const re = document.createElement("a");
        ((re.href = "https://www.tradingview.com/"),
          (re.target = "_blank"),
          (re.rel = "noopener noreferrer"),
          (re.textContent = "Gráficos por TradingView"),
          ne.appendChild(re));
        const ie = document.createElement("script");
        ((ie.src =
          "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"),
          (ie.async = !0),
          (ie.textContent = JSON.stringify({
            autosize: !0,
            symbol: p,
            interval: x,
            timezone: "America/Sao_Paulo",
            theme: "dark",
            style: "1",
            locale: "br",
            allow_symbol_change: !0,
            calendar: !1,
            hide_side_toolbar: !0,
            hide_top_toolbar: !1,
            withdateranges: !0,
            save_image: !0,
            support_host: "https://www.tradingview.com",
          })),
          W.append(Z, ne, ie),
          A.append(W),
          (ie.onerror = () => {
            A.contains(W) &&
              (W.remove(),
              (A.textContent =
                "O widget não carregou. Use “Abrir no TradingView” acima."));
          }));
      }
      (document.addEventListener(
        "click",
        (t) => {
          const p = (A) => t.target.closest(A);
          let x;
          if ((x = p("[data-auopen]"))) {
            (t.preventDefault(), oe(x.dataset.auopen));
            return;
          }
          if (p("[data-aurel]")) {
            ((F.lista = null), R(1), C());
            return;
          }
          if (p("[data-au336close]")) {
            document.getElementById("au336-map")?.remove();
            return;
          }
          if ((x = p("[data-au336goto]"))) {
            const A = Number(x.dataset.au336goto);
            (document.getElementById("au336-map")?.remove(),
              e.on &&
                Number.isInteger(A) &&
                A >= 0 &&
                A < e.a.r.cenas.length &&
                ($e(), Pe(A, 0)));
            return;
          }
          if (p("#au336-map") && !p(".au336-dialog")) {
            document.getElementById("au336-map")?.remove();
            return;
          }
          if (p("[data-autvclose]")) {
            nt();
            return;
          }
          if (!(x = p("#au-tv-symbol") || p("#au-tv-interval"))) {
            if (p("#au-tradingview") && !p(".au-tv-panel")) {
              nt();
              return;
            }
            if (e.on) {
              if (p("[data-au338close]")) {
                document.getElementById("au338-modal")?.remove();
                return;
              }
              if (p("[data-au338refresh]")) {
                It();
                return;
              }
              if (p("[data-au338graph]")) {
                (document.getElementById("au338-modal")?.remove(), qt());
                return;
              }
              if (p("[data-au338diag]")) {
                It();
                return;
              }
              if (p("[data-au348close]")) {
                const A = document.getElementById("aupoptions");
                (A && (A.hidden = !0),
                  document
                    .querySelector("[data-auoptions]")
                    ?.setAttribute("aria-expanded", "false"));
                return;
              }
              if ((x = p("[data-au348mode]"))) {
                const A = x.dataset.au348mode;
                (P(G, A), e.play && $e(), A === "piper" && pt(e.i), We());
                return;
              }
              if (p("[data-au340resume]")) {
                const A = document.getElementById("aupoptions");
                A &&
                  ((A.hidden = !0),
                  document
                    .querySelector("[data-auoptions]")
                    ?.setAttribute("aria-expanded", "false"));
                const W = document.querySelector("#aup .aup-stage");
                (W && (W.scrollTop = 0), e.play || Fe());
                return;
              }
              if (p("[data-au349export]")) {
                ma();
                return;
              }
              if (p("[data-au349test]")) {
                $e();
                const A = document.getElementById("au349native");
                A && !A.hidden
                  ? A.play().catch(() =>
                      at(
                        "O iPhone bloqueou o play. Toque diretamente no controle do áudio.",
                      ),
                    )
                  : at("Importe o WAV desta cena para testar.");
                return;
              }
              if (p("[data-au339gerar]")) {
                da();
                return;
              }
              if (p("[data-au337gerar]")) {
                ia();
                return;
              }
              if (p("[data-auvisualmap]")) {
                ($e(),
                  (document.getElementById("aupoptions").hidden = !0),
                  ta());
                return;
              }
              if (p("[data-autv]")) {
                qt();
                return;
              }
              if (p("[data-auoptions]")) {
                const A = document.getElementById("aupoptions");
                (A.hidden && $e(),
                  (A.hidden = !A.hidden),
                  p("[data-auoptions]").setAttribute(
                    "aria-expanded",
                    String(!A.hidden),
                  ),
                  We());
                return;
              }
              if (p("[data-au353retry]")) {
                (e.play && $e(), Fe());
                return;
              }
              if (p("[data-auvozteste]")) {
                Re();
                return;
              }
              if (p("[data-au361close]")) {
                me();
                return;
              }
              if (p("[data-au361expand]")) {
                se();
                return;
              }
              if (p("[data-au361min]") || p("[data-aux]")) {
                ae();
                return;
              }
              if (p("[data-au361toggle]")) {
                e.play ? $e() : Fe();
                return;
              }
              if (p("[data-aupp]")) {
                e.play ? $e() : Fe();
                return;
              }
              if (p("[data-aunext]")) {
                Pe(e.i + 1, 0);
                return;
              }
              if (p("[data-auprev]")) {
                Pe(e.j > 1 ? e.i : e.i - 1, 0);
                return;
              }
              if (p("[data-audel]")) {
                const A = e.a;
                if (
                  !A ||
                  !confirm(
                    `Apagar a aula ${A.numero} de “${A.livro}”? Isso não pode ser desfeito.`,
                  )
                )
                  return;
                rq("/rest/v1/aulas?id=eq." + A.id, {
                  method: "DELETE",
                  headers: { Prefer: "return=minimal" },
                })
                  .then(() => {
                    try {
                      (u(l + A.id), u(r + A.id));
                    } catch {}
                    ((F.lista = null),
                      me(),
                      R(1),
                      toast && toast("Aula apagada."));
                  })
                  .catch(
                    (W) => toast && toast("Não apagou: " + (W.message || W)),
                  );
                return;
              }
              if (p("[data-auidx]")) {
                const A = document.getElementById("aupidx");
                A.hidden = !A.hidden;
                return;
              }
              if ((x = p("[data-aucena]"))) {
                ((document.getElementById("aupidx").hidden = !0),
                  Pe(+x.dataset.aucena, 0));
                return;
              }
              p(".aup-stage") && !p("select") && (e.play ? $e() : Fe());
            }
          }
        },
        !0,
      ),
        document.addEventListener("change", (t) => {
          if (t.target.matches("#au-tv-symbol,#au-tv-interval")) {
            Nt();
            return;
          }
          if (t.target.id === "au349files") {
            fa(t.target.files).finally(() => {
              t.target.value = "";
            });
            return;
          }
          if (t.target.id === "au336-auto") {
            (P("aulas-motor-visual-v336", !!t.target.checked),
              (e.vis = ""),
              e.on &&
                tt(e.j ? ((ge(e.a.r.cenas[e.i]) || [])[e.j] || {}).k : -1));
            return;
          }
          if (t.target.id === "au339mode") {
            (P(G, t.target.value),
              t.target.value === "piper" && pt(e.i),
              We(),
              e.play && Pe(e.i, e.j));
            return;
          }
          if (t.target.id === "au339voice") {
            (P(o, t.target.value), Qe(), We(), Ct(e.i), e.play && Pe(e.i, e.j));
            return;
          }
          if (t.target.id === "aupvel" && (P(O, +t.target.value), e.play)) {
            const p = e.j;
            Pe(e.i, p);
          }
          t.target.id === "aupvoz" &&
            (P(j, t.target.value), e.play && Pe(e.i, e.j));
        }),
        document.addEventListener(
          "play",
          (t) => {
            ["au348native", "au349native"].includes(t.target?.id) &&
              e.play &&
              $e();
          },
          !0,
        ),
        document.addEventListener(
          "error",
          (t) => {
            t.target?.id === "au348native" &&
              Ke(
                "O iPhone não conseguiu reproduzir o arquivo salvo. Selecione Voz do aparelho e use ▶ no player.",
              );
          },
          !0,
        ),
        document.addEventListener("keydown", (t) => {
          if (document.getElementById("au336-map")) {
            t.key === "Escape" &&
              (t.preventDefault(),
              document.getElementById("au336-map")?.remove());
            return;
          }
          if (document.getElementById("au-tradingview")) {
            t.key === "Escape" && (t.preventDefault(), nt());
            return;
          }
          if (
            !(
              !e.on ||
              document
                .getElementById("aup")
                ?.classList.contains("au361-floating")
            )
          ) {
            if (document.getElementById("au-study-panel")) {
              t.key === "Escape" &&
                (document.getElementById("au-study-panel").remove(),
                document.querySelector("[data-austnotes]")?.focus());
              return;
            }
            t.target.closest("input,textarea,select,[contenteditable=true]") ||
              document.getElementById("auModal") ||
              (t.key === "Escape"
                ? ae()
                : t.key === " "
                  ? (t.preventDefault(), e.play ? $e() : Fe())
                  : t.key === "ArrowRight"
                    ? Pe(e.i + 1, 0)
                    : t.key === "ArrowLeft" && Pe(e.i - 1, 0));
          }
        }));
      const Ze = "aulas-job-v1",
        de = {
          aberto: 0,
          livros: null,
          sel: "",
          novoNome: "",
          caps: {},
          manual: "",
          numero: "",
          busy: 0,
          msg: "",
          erro: "",
          pct: 0,
        };
      function Ca() {
        const t = B();
        return t
          ? new Promise((p, x) => {
              const A = indexedDB.open("aulas-livros-v318:" + t, 1);
              ((A.onupgradeneeded = () =>
                A.result.createObjectStore("livros", { keyPath: "id" })),
                (A.onsuccess = () => p(A.result)),
                (A.onerror = () => x(A.error)));
            })
          : Promise.reject(new Error("Entre na sua conta para abrir os PDFs."));
      }
      async function rt(t, p) {
        const x = B(),
          A = await Ca();
        return (
          M(x),
          new Promise((W, Z) => {
            const ne = A.transaction("livros", t),
              re = ne.objectStore("livros"),
              ie = p(re);
            ((ne.oncomplete = () => {
              A.close();
              try {
                (M(x), W(ie && ie.result));
              } catch (be) {
                Z(be);
              }
            }),
              (ne.onerror = () => {
                (A.close(), Z(ne.error));
              }));
          })
        );
      }
      async function yt() {
        const t = B();
        try {
          const p = await rt("readonly", (x) => x.getAll());
          (M(t),
            (de.livros = (p || [])
              .map(({ buf: x, ...A }) => A)
              .sort((x, A) => A.em.localeCompare(x.em))));
        } catch {
          if (t !== B()) return;
          de.livros = [];
        }
        C();
      }
      const Ta = (t) => rt("readonly", (p) => p.get(t)).then((p) => p && p.buf);
      async function Lt() {
        return ntLib();
      }
      async function jt(t) {
        if (t.byteLength > 50 * 1024 * 1024)
          throw new Error("O PDF deve ter no máximo 50 MB.");
        const p = await Lt(),
          x = p.getDocument({
            data: new Uint8Array(t.slice(0)),
            isEvalSupported: !1,
            enableScripting: !1,
            maxImageSize: 16e6,
          });
        de.pdfTask = x;
        const A = setTimeout(() => x.destroy(), 6e4);
        try {
          const W = await x.promise;
          if (W.numPages > 2e3)
            throw (
              await W.destroy(),
              new Error("Escolha um PDF com até 2.000 páginas.")
            );
          return W;
        } finally {
          (clearTimeout(A), (de.pdfTask = null));
        }
      }
      async function Da(t) {
        let p = null;
        try {
          p = await t.getOutline();
        } catch {}
        if (!p || !p.length) return [];
        let x = p;
        x.length < 3 && (x = x.flatMap((W) => [W, ...(W.items || [])]));
        const A = [];
        for (const W of x.slice(0, 250))
          try {
            let Z = W.dest;
            if (
              (typeof Z == "string" && (Z = await t.getDestination(Z)),
              !Array.isArray(Z))
            )
              continue;
            const ne =
              typeof Z[0] == "number" ? Z[0] : await t.getPageIndex(Z[0]);
            A.push({
              t: String(W.title || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 110),
              p: ne + 1,
            });
          } catch {}
        return (
          A.sort((W, Z) => W.p - Z.p),
          A.forEach((W, Z) => {
            W.ate = Math.max(W.p, A[Z + 1] ? A[Z + 1].p - 1 : t.numPages);
          }),
          A.filter((W) => W.t)
        );
      }
      async function Ma(t) {
        g();
        const p = B();
        if (!p) {
          ((de.erro = "Entre na sua conta antes de enviar PDFs."), C());
          return;
        }
        if (t) {
          if (t.size > 50 * 1024 * 1024) {
            ((de.erro = "O PDF deve ter no máximo 50 MB."), C());
            return;
          }
          if (!/pdf$/i.test(t.type) && !/\.pdf$/i.test(t.name)) {
            ((de.erro = "Escolha um arquivo PDF."), C());
            return;
          }
          ((de.busy = 1), (de.erro = ""), (de.msg = "Lendo o PDF…"), C());
          try {
            const x = await t.arrayBuffer(),
              A = await jt(x),
              W = await Da(A);
            (M(p), A.destroy && (await A.destroy()));
            const Z = (
                de.novoNome ||
                t.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ")
              )
                .trim()
                .slice(0, 120),
              ne = {
                id: "l" + Date.now().toString(36),
                nome: Z,
                arquivo: t.name,
                paginas: A.numPages,
                sumario: W,
                tam: t.size,
                em: new Date().toISOString(),
                buf: x,
              };
            (await rt("readwrite", (re) => re.put(ne)),
              (de.sel = ne.id),
              (de.caps = {}),
              (de.manual = ""),
              (de.msg = W.length
                ? ""
                : "Este PDF não tem sumário embutido: informe as páginas de cada capítulo."),
              await yt());
          } catch (x) {
            if (p !== B()) return;
            de.erro = "Não consegui ler o PDF: " + (x.message || x);
          }
          ((de.busy = 0), C());
        }
      }
      function Bt() {
        return (de.livros || []).find((t) => t.id === de.sel) || null;
      }
      function zt(t) {
        const p = (F.lista || []).filter((x) => x.livro === t);
        return p.length ? Math.max(...p.map((x) => +x.numero || 0)) + 1 : 1;
      }
      function Ra(t) {
        return t.sumario && t.sumario.length && !de.usarManual
          ? t.sumario
              .filter((p, x) => de.caps[x])
              .map((p) => ({ nome: p.t, de: p.p, ate: p.ate }))
          : de.manual
              .split(
                `
`,
              )
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p) => {
                const x =
                  /^(.*?)[|:\-–]\s*(\d+)\s*(?:a|-|–|até)\s*(\d+)\s*$/i.exec(
                    p,
                  ) || /^(.*?)\s+(\d+)\s*(?:a|-|–|até)\s*(\d+)\s*$/i.exec(p);
                return x
                  ? {
                      nome:
                        x[1].replace(/[|:\-–]\s*$/, "").trim() || "Capítulo",
                      de: +x[2],
                      ate: +x[3],
                    }
                  : null;
              })
              .filter(Boolean);
      }
      function Ia() {
        const t = E(Ze, null);
        if (!de.aberto)
          return `<div class="au-novabar"><button class="btn au-nova" data-aunova="1">＋ Nova aula</button>${t && !de.busy ? `<button class="btn s" data-aucont="1">Continuar a aula ${i(t.numero)} de ${i(t.livro)}</button>` : ""}</div>`;
        if (de.livros == null)
          return (
            yt(),
            '<div class="card"><div class="sm mut">Carregando seus livros…</div></div>'
          );
        const p = Bt(),
          x = de.busy ? " disabled" : "";
        let A = `<div class="card au-form"><div class="top"><b>Nova aula</b><button class="btn s" data-aufecha="1"${x}>Fechar</button></div>`;
        if (
          ((A += `<label class="sm mut">Livro</label><div class="au-livros">${(de.livros || []).map((W) => `<button class="au-lv${W.id === de.sel ? " on" : ""}" data-aulv="${i(W.id)}"${x}><b>${i(W.nome)}</b><span class="sm mut">${W.paginas} págs.${W.sumario && W.sumario.length ? " · sumário com " + W.sumario.length + " itens" : ""}</span></button>`).join("")}
<label class="au-up${de.busy ? " dis" : ""}"><input type="file" accept="application/pdf,.pdf" id="aupdf"${x} hidden>📄 Enviar PDF de um livro</label></div>
<div class="sm mut">O PDF fica guardado só neste aparelho. Só o texto dos capítulos escolhidos vai para a IA.</div>`),
          p)
        ) {
          const W = de.numero || zt(p.nome),
            Z = p.sumario && p.sumario.length && !de.usarManual;
          if (
            ((A += `<div class="au-row"><div><label class="sm mut">Nome do livro nas aulas</label><input id="aulvnome" value="${i(p.nome)}"${x}></div><div style="max-width:90px"><label class="sm mut">Aula nº</label><input id="aunum" type="number" min="1" value="${i(W)}"${x}></div></div>`),
            Z)
          ) {
            const ne = Object.values(de.caps).filter(Boolean).length;
            A += `<label class="sm mut">Capítulos desta aula (marque 2 ou 3 · ${ne} marcados)</label><div class="au-caps">${p.sumario.map((re, ie) => `<label class="au-cap${de.caps[ie] ? " on" : ""}"><input type="checkbox" data-aucap="${ie}"${de.caps[ie] ? " checked" : ""}${x}><span>${i(re.t)}</span><small>p. ${re.p}–${re.ate}</small></label>`).join("")}</div><button class="lnk sm" data-aumanual="1"${x}>Prefiro digitar as páginas</button>`;
          } else
            A += `<label class="sm mut">Capítulos e páginas do PDF (uma linha por capítulo, até 4)</label><textarea id="aumanual" rows="3" placeholder="Capítulo 3 — Hedge | 56-80&#10;Capítulo 4 — Juros | 81-110"${x}>${i(de.manual)}</textarea>${p.sumario && p.sumario.length ? '<button class="lnk sm" data-aumanual="0">Usar o sumário do PDF</button>' : ""}`;
          A += `<div class="au-acoes"><button class="btn" data-augera="1"${x}>${de.busy ? "Gerando…" : "🎬 Gerar aula"}</button><button class="lnk sm" data-auapaga="${i(p.id)}"${x}>Apagar este PDF do aparelho</button></div>`;
        }
        return (
          (de.msg || de.busy) &&
            (A += `<div class="au-prog"><div class="sm">${i(de.msg)}</div>${de.busy ? `<div class="au-pb"><i style="width:${de.pct}%"></i></div><div class="sm mut">Leva cerca de 1 minuto a cada 10 páginas. Mantenha o app aberto e a tela ligada.</div>` : ""}</div>`),
          de.erro &&
            (A += `<div class="card warn" style="margin:10px 0 0"><div class="sm">${i(de.erro)}</div></div>`),
          A + "</div>"
        );
      }
      function Oa(t) {
        const p = E(Ze, null),
          x = p && p.id === t.id;
        const estado = window.DiarioAulasRecuperacao?.gerandoHtml(t, {
          busy: !!de.busy,
          meu: !!x,
        });
        if (estado) return estado;
        return `<div class="au-item au-ger"><span class="au-n">…</span><span class="au-tx"><b>Aula ${t.numero} · gerando</b><span class="sm mut">${de.busy && x ? i(de.msg) : x ? "Interrompida. Toque em continuar." : "Em geração em outro aparelho ou interrompida."}</span></span>${!de.busy && x ? '<button class="btn s" data-aucont="1">Continuar</button>' : ""}</div>`;
      }
      async function ft(t, p, x) {
        (M(x), await tok(), M(x));
        const A = cfg(),
          W = new AbortController();
        de.request = W;
        const Z = setTimeout(() => W.abort(), p);
        try {
          const ne = await fetch(A.url + "/functions/v1/aulas", {
              method: "POST",
              signal: W.signal,
              headers: {
                "Content-Type": "application/json",
                apikey: A.key,
                Authorization: "Bearer " + SESS.at,
              },
              body: JSON.stringify(t),
            }),
            re = await ne.json().catch(() => ({}));
          if ((M(x), ne.status === 404 && !re.error))
            throw new Error('A função "aulas" não foi encontrada no Supabase.');
          if (!ne.ok) {
            const ie = new Error(re.error || "Erro " + ne.status);
            throw ((ie.status = ne.status), ie);
          }
          return re;
        } catch (ne) {
          if (ne.name === "AbortError") {
            const re = new Error("A IA demorou demais para responder.");
            throw ((re.status = 504), re);
          }
          throw ne;
        } finally {
          (clearTimeout(Z), de.request === W && (de.request = null));
        }
      }
      async function Pa(t, p, x, A) {
        const W = [];
        ((p = Math.max(1, p)), (x = Math.min(t.numPages, x)));
        for (let Z = p; Z <= x; Z++) {
          const ne = await t.getPage(Z),
            re = await ne.getTextContent();
          (W.push(
            re.items
              .map(
                (ie) =>
                  ie.str +
                  (ie.hasEOL
                    ? `
`
                    : " "),
              )
              .join("")
              .replace(/[ \t]+/g, " ")
              .trim(),
          ),
            A && A(Z - p + 1, x - p + 1));
        }
        return W;
      }
      function qa(t) {
        const p = [];
        let x = [],
          A = 0;
        for (const W of t)
          (A > 0 &&
            A + W.length > 28e3 &&
            (p.push(
              x.join(`

`),
            ),
            (x = []),
            (A = 0)),
            x.push(W),
            (A += W.length));
        if (
          (x.length &&
            p.push(
              x.join(`

`),
            ),
          p.length > 1 && p[p.length - 1].length < 7e3)
        ) {
          const W = p.pop();
          p[p.length - 1] +=
            `

` + W;
        }
        return p;
      }
      const Ft = 40,
        Na = 3,
        La = 1400,
        _t =
          /^\s*(?:[Ff]ig(?:ura|ure|\.)?|FIG(?:URA|URE)?\.?|[Gg]r[áa]fico|GR[ÁA]FICO|[Cc]hart|CHART|[Ee]xhibit|EXHIBIT|[Tt]abela|TABELA|[Tt]able|TABLE|[Qq]uadro|QUADRO|[Dd]iagrama|DIAGRAMA)\s*[\dIVX]+(?:[.\-]\d+)*\s*(?:[.:\-–—|]|$|[A-ZÁÉÍÓÚÂÊÔÃÕÇ\"“(])/;
      function ja(t, p) {
        return t.items
          .filter((x) => x.str && x.str.trim())
          .map((x) => {
            const A = p.convertToViewportPoint(x.transform[4], x.transform[5]);
            return {
              s: x.str.trim(),
              x: A[0],
              y: A[1],
              w: (x.width || 0) * p.scale,
              fh: Math.max(
                4,
                Math.hypot(x.transform[2], x.transform[3]) * p.scale,
              ),
            };
          });
      }
      function Ut(t, p) {
        return t
          .filter((x) => Math.abs(x.y - p.y) < p.fh * 0.6 && x.x >= p.x - 2)
          .sort((x, A) => x.x - A.x)
          .map((x) => x.s)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 150);
      }
      function Ba(t, p, x) {
        let A = null;
        for (const W of t) {
          if (!_t.test(W.s)) continue;
          const Z = W.y >= p.y2 ? W.y - p.y2 : p.y1 - W.y;
          Z < -6 || Z > x * 0.14 || ((!A || Z < A.d) && (A = { t: W, d: Z }));
        }
        return A ? Ut(t, A.t) : "";
      }
      function Vt(t) {
        let p = !0;
        for (; p; ) {
          p = !1;
          for (let x = 0; x < t.length && !p; x++)
            for (let A = x + 1; A < t.length && !p; A++) {
              const W = t[x],
                Z = t[A];
              W.x1 <= Z.x2 + 6 &&
                Z.x1 <= W.x2 + 6 &&
                W.y1 <= Z.y2 + 6 &&
                Z.y1 <= W.y2 + 6 &&
                ((t[x] = {
                  x1: Math.min(W.x1, Z.x1),
                  y1: Math.min(W.y1, Z.y1),
                  x2: Math.max(W.x2, Z.x2),
                  y2: Math.max(W.y2, Z.y2),
                  leg: W.leg || Z.leg,
                  vet: W.vet && Z.vet,
                }),
                t.splice(A, 1),
                (p = !0));
            }
        }
        return t;
      }
      async function Wt(t, p) {
        const x = await Lt(),
          A = x.OPS,
          W = await t.getPage(p),
          Z = {
            transform: (ce, Ce) => [
              ce[0] * Ce[0] + ce[2] * Ce[1],
              ce[1] * Ce[0] + ce[3] * Ce[1],
              ce[0] * Ce[2] + ce[2] * Ce[3],
              ce[1] * Ce[2] + ce[3] * Ce[3],
              ce[0] * Ce[4] + ce[2] * Ce[5] + ce[4],
              ce[1] * Ce[4] + ce[3] * Ce[5] + ce[5],
            ],
            applyTransform: (ce, Ce) => [
              Ce[0] * ce[0] + Ce[2] * ce[1] + Ce[4],
              Ce[1] * ce[0] + Ce[3] * ce[1] + Ce[5],
            ],
          },
          ne = W.getViewport({ scale: 1 }),
          re = W.getViewport({ scale: Math.min(3, La / ne.width) }),
          ie = re.width,
          be = re.height,
          pe = await W.getOperatorList(),
          he = ja(await W.getTextContent(), re),
          fe = new Set(
            [
              A.paintImageXObject,
              A.paintInlineImageXObject,
              A.paintImageXObjectRepeat,
              A.paintJpegXObject,
            ].filter((ce) => ce != null),
          );
        let ke = [1, 0, 0, 1, 0, 0];
        const we = [],
          Ee = [];
        for (let ce = 0; ce < pe.fnArray.length; ce++) {
          const Ce = pe.fnArray[ce],
            qe = pe.argsArray[ce];
          if (Ce === A.save) we.push(ke.slice());
          else if (Ce === A.restore) ke = we.pop() || [1, 0, 0, 1, 0, 0];
          else if (Ce === A.transform) ke = Z.transform(ke, Array.from(qe));
          else if (Ce === A.paintFormXObjectBegin) {
            we.push(ke.slice());
            const Be = qe && qe[0];
            Be && Be.length === 6 && (ke = Z.transform(ke, Array.from(Be)));
          } else if (Ce === A.paintFormXObjectEnd)
            ke = we.pop() || [1, 0, 0, 1, 0, 0];
          else if (fe.has(Ce)) {
            const Be = [
                [0, 0],
                [1, 0],
                [0, 1],
                [1, 1],
              ].map((Le) =>
                re.convertToViewportPoint(...Z.applyTransform(Le, ke)),
              ),
              Ge = Be.map((Le) => Le[0]),
              Je = Be.map((Le) => Le[1]);
            Ee.push({
              x1: Math.max(0, Math.min(...Ge)),
              y1: Math.max(0, Math.min(...Je)),
              x2: Math.min(ie, Math.max(...Ge)),
              y2: Math.min(be, Math.max(...Je)),
            });
          }
        }
        let Te = Vt(
          Ee.filter((ce) => {
            const Ce = ce.x2 - ce.x1,
              qe = ce.y2 - ce.y1;
            return (
              Ce >= ie * 0.25 &&
              qe >= be * 0.08 &&
              Ce * qe >= ie * be * 0.05 &&
              Ce * qe <= ie * be * 0.85
            );
          }),
        );
        Te.forEach((ce) => (ce.leg = Ba(he, ce, be)));
        const Ie = he.filter((ce) => ce.s.length >= 30),
          Oe = Ie.length ? Math.min(...Ie.map((ce) => ce.x)) : ie * 0.06,
          Ne = Ie.length ? Math.max(...Ie.map((ce) => ce.x + ce.w)) : ie * 0.94;
        for (const ce of he) {
          if (
            !_t.test(ce.s) ||
            Te.some(
              (ze) => ce.y >= ze.y1 - be * 0.16 && ce.y <= ze.y2 + be * 0.16,
            )
          )
            continue;
          const Ce = Ie.filter((ze) => Math.abs(ze.y - ce.y) > ce.fh * 0.8),
            qe = Ce.filter((ze) => ze.y < ce.y).reduce(
              (ze, et) => Math.max(ze, et.y),
              be * 0.05,
            ),
            Be = Ce.filter((ze) => ze.y > ce.y).reduce(
              (ze, et) => Math.min(ze, et.y - et.fh),
              be * 0.95,
            ),
            Ge = ce.y - ce.fh * 1.1 - qe,
            Je = Be - (ce.y + ce.fh * 0.4);
          let Le = null;
          (Ge >= be * 0.12 && Ge >= Je
            ? (Le = {
                x1: Oe,
                x2: Ne,
                y1: qe + ce.fh * 0.7 + ie * 0.012,
                y2: ce.y + ce.fh * 0.4,
                vet: 1,
              })
            : Je >= be * 0.12 &&
              (Le = {
                x1: Oe,
                x2: Ne,
                y1: ce.y - ce.fh * 1.1,
                y2: Be - ie * 0.012,
                vet: 1,
              }),
            Le && ((Le.leg = Ut(he, ce)), Te.push(Le)));
        }
        if (
          ((Te = Vt(Te)
            .sort((ce, Ce) => ce.y1 - Ce.y1)
            .slice(0, Na)),
          !Te.length)
        )
          return [];
        const ye = document.createElement("canvas");
        ((ye.width = Math.ceil(ie)), (ye.height = Math.ceil(be)));
        const le = ye.getContext("2d");
        ((le.fillStyle = "#fff"),
          le.fillRect(0, 0, ye.width, ye.height),
          await W.render({ canvasContext: le, viewport: re }).promise);
        const De = [];
        for (const ce of Te) {
          const Ce = ie * 0.012,
            qe = Math.max(0, ce.x1 - Ce),
            Be = Math.max(0, ce.y1 - Ce),
            Ge = Math.min(ye.width, ce.x2 + Ce) - qe,
            Je = Math.min(ye.height, ce.y2 + Ce) - Be;
          if (Ge < 160 || Je < 90) continue;
          const Le = document.createElement("canvas");
          ((Le.width = Math.round(Ge)), (Le.height = Math.round(Je)));
          const ze = Le.getContext("2d");
          if (
            (ze.drawImage(ye, qe, Be, Ge, Je, 0, 0, Le.width, Le.height),
            ce.vet)
          ) {
            const st = ze.getImageData(0, 0, Le.width, Le.height).data;
            let Jt = 0,
              Yt = 0;
            for (let ct = 0; ct < st.length; ct += 16)
              (Yt++,
                st[ct] * 0.3 + st[ct + 1] * 0.59 + st[ct + 2] * 0.11 < 225 &&
                  Jt++);
            if (Jt / Yt < 0.02) {
              Le.width = Le.height = 0;
              continue;
            }
          }
          const et = await new Promise((st) =>
            Le.toBlob(st, "image/jpeg", 0.86),
          );
          ((Le.width = Le.height = 0),
            et &&
              et.size > 3e3 &&
              De.push({
                blob: et,
                w: Math.round(Ge),
                h: Math.round(Je),
                leg: ce.leg || "",
              }));
        }
        ye.width = ye.height = 0;
        try {
          W.cleanup();
        } catch {}
        return De;
      }
      async function Ht(t, p) {
        await tok();
        const x = cfg(),
          A = await fetch(`${x.url}/storage/v1/object/aulas-figuras/${t}`, {
            method: "POST",
            headers: {
              apikey: x.key,
              Authorization: "Bearer " + SESS.at,
              "Content-Type": "image/jpeg",
              "x-upsert": "true",
              "cache-control": "max-age=31536000",
            },
            body: p,
          });
        if (!A.ok) {
          const W = await A.text().catch(() => "");
          throw new Error(
            "Figura não enviada (" + A.status + ") " + W.slice(0, 80),
          );
        }
      }
      window.DIARIO_V511 = { figurasPagina: Wt, sobeFigura: Ht };
      async function Gt(t) {
        g();
        const p = B();
        if (de.busy) return;
        if (!H()) {
          ((de.erro = "Entre na sua conta (Mais → Conta) para gerar aulas."),
            C());
          return;
        }
        let x = t ? E(Ze, null) : null;
        if (((de.erro = ""), (de.msg = ""), !x)) {
          const A = Bt();
          if (!A) {
            ((de.erro = "Escolha ou envie o PDF do livro."), C());
            return;
          }
          const W = (document.getElementById("aulvnome") || {}).value || A.nome,
            Z = +((document.getElementById("aunum") || {}).value || zt(W)),
            ne = Ra(A);
          if (!ne.length) {
            ((de.erro =
              A.sumario && A.sumario.length && !de.usarManual
                ? "Marque os capítulos desta aula."
                : "Escreva os capítulos e páginas, um por linha. Ex.: Capítulo 3 | 56-80"),
              C());
            return;
          }
          if (ne.length > 4) {
            ((de.erro = "No máximo 4 capítulos por aula."), C());
            return;
          }
          if (
            ne.some(
              (re) =>
                re.de < 1 ||
                re.ate < re.de ||
                re.ate > A.paginas ||
                re.ate - re.de > 120,
            )
          ) {
            ((de.erro = `Confira as páginas: devem estar entre 1 e ${A.paginas}, com no máximo 120 por capítulo.`),
              C());
            return;
          }
          if (
            (F.lista || []).some(
              (re) =>
                re.livro === W.trim() &&
                +re.numero === Z &&
                re.status !== "gerando",
            ) &&
            !confirm(`Já existe a aula ${Z} de “${W}”. Substituir?`)
          )
            return;
          if (W.trim() !== A.nome)
            try {
              const re = await rt("readonly", (ie) => ie.get(A.id));
              ((re.nome = W.trim()),
                await rt("readwrite", (ie) => ie.put(re)),
                (A.nome = W.trim()));
            } catch {}
          x = {
            livroId: A.id,
            livro: W.trim(),
            numero: Z,
            partes: ne,
            feitas: 0,
          };
        }
        if (p === B()) {
          ((de.busy = 1), (de.pct = 1), (de.msg = "Preparando…"), C(), Xe());
          try {
            const A = await Ta(x.livroId);
            if (!A)
              throw new Error(
                "O PDF deste livro não está mais neste aparelho. Envie o PDF de novo.",
              );
            const W = await jt(A),
              Z = [],
              ne = [];
            for (const [pe, he] of x.partes.entries()) {
              M(p);
              const fe = await Pa(W, he.de, he.ate, (Ee, Te) => {
                ((de.msg = `Lendo “${he.nome}” · página ${Ee} de ${Te}`),
                  (de.pct = 1 + (8 * (pe + Ee / Te)) / x.partes.length),
                  ot());
              });
              if ((M(p), fe.join("").replace(/\s/g, "").length < 600))
                throw new Error(
                  `Quase não há texto nas páginas ${he.de}–${he.ate}. O PDF pode ser escaneado (imagem), ou as páginas estão erradas.`,
                );
              for (let Ee = 0; Ee < fe.length && ne.length < Ft; Ee++) {
                const Te = Math.max(1, he.de) + Ee;
                ((de.msg = `Procurando figuras em “${he.nome}” · página ${Ee + 1} de ${fe.length}`),
                  ot());
                try {
                  (await Wt(W, Te))
                    .slice(0, Ft - ne.length)
                    .forEach((Oe, Ne) => {
                      const ye = "p" + Te + "abc"[Ne];
                      (ne.push({ ...Oe, id: ye, pag: Te }),
                        (fe[Ee] += `
[FIGURA ${ye}${Oe.leg ? " — " + Oe.leg : ""}]
`));
                    });
                } catch (Ie) {
                  console.warn("figuras p." + Te, Ie);
                }
              }
              M(p);
              const we = qa(fe);
              we.forEach((Ee, Te) =>
                Z.push({
                  nome: he.nome,
                  texto: Ee,
                  bloco: Te,
                  blocos: we.length,
                }),
              );
            }
            if (Z.length > 24)
              throw new Error(
                "Capítulos longos demais para uma aula só. Escolha menos capítulos.",
              );
            if (!x.id) {
              const pe = await ft(
                {
                  acao: "iniciar",
                  livro: x.livro,
                  numero: x.numero,
                  capitulos: x.partes.map((he) => he.nome),
                },
                3e4,
                p,
              );
              (M(p), (x.id = pe.id), P(Ze, x), (F.lista = null), R(1));
            }
            if (ne.length && !x.figsOk) {
              const pe = [];
              for (const [he, fe] of ne.entries()) {
                (M(p),
                  (de.msg = `Enviando as figuras do livro · ${he + 1} de ${ne.length}`),
                  ot());
                try {
                  (await Ht(`${SESS.uid}/${x.id}/${fe.id}.jpg`, fe.blob),
                    pe.push(fe));
                } catch (ke) {
                  console.warn("figura", fe.id, ke);
                }
              }
              (ne.splice(0, ne.length, ...pe),
                (x.figsOk = pe.map((he) => he.id)),
                P(Ze, x));
            } else if (x.figsOk) {
              const pe = new Set(x.figsOk);
              ne.splice(0, ne.length, ...ne.filter((he) => pe.has(he.id)));
            }
            const re = Z.length;
            let ie = 0;
            try {
              for (let pe = x.feitas; pe < re; pe++) {
                M(p);
                const he = Z[pe];
                ((de.msg = `Enviando para o servidor · ${pe + 1} de ${re}`),
                  (de.pct = 10 + (88 * pe) / re),
                  ot(),
                  await ft(
                    {
                      acao: "enfileirar",
                      id: x.id,
                      idx: pe,
                      total: re,
                      bloco: he.bloco,
                      blocos: he.blocos,
                      capitulo: he.nome,
                      texto: he.texto,
                      figuras: ne
                        .filter((fe) => he.texto.includes("[FIGURA " + fe.id))
                        .map((fe) => ({
                          id: fe.id,
                          pag: fe.pag,
                          leg: fe.leg,
                          w: fe.w,
                          h: fe.h,
                        })),
                    },
                    4e4,
                    p,
                  ));
              }
              ie = 1;
            } catch (pe) {
              if (!/desconhecida/i.test(pe.message || "")) throw pe;
            }
            if (ie) {
              try {
                u(Ze);
              } catch {}
              ((de.busy = 0),
                (de.aberto = 0),
                (de.msg = ""),
                (de.caps = {}),
                (de.numero = ""),
                _e(),
                (F.lista = null),
                await R(1),
                toast &&
                  toast(
                    "Enviado. O servidor está escrevendo a aula — pode fechar o app, você recebe um aviso quando ficar pronta.",
                  ),
                C());
              return;
            }
            for (let pe = x.feitas; pe < re; pe++) {
              M(p);
              const he = Z[pe],
                fe = 10 + (88 * pe) / re,
                ke = 88 / re;
              ((de.msg = `A IA está escrevendo “${he.nome}”${he.blocos > 1 ? ` (parte ${he.bloco + 1} de ${he.blocos})` : ""} · ${pe + 1} de ${re}`),
                (de.pct = fe),
                ot());
              const we = setInterval(() => {
                  ((de.pct = Math.min(fe + ke * 0.95, de.pct + ke / 90)), ot());
                }, 1e3),
                Ee = {
                  acao: "parte",
                  id: x.id,
                  idx: pe,
                  total: re,
                  bloco: he.bloco,
                  blocos: he.blocos,
                  capitulo: he.nome,
                  texto: he.texto,
                  figuras: ne
                    .filter((Te) => he.texto.includes("[FIGURA " + Te.id))
                    .map((Te) => ({
                      id: Te.id,
                      pag: Te.pag,
                      leg: Te.leg,
                      w: Te.w,
                      h: Te.h,
                    })),
                };
              try {
                try {
                  await ft(Ee, 165e3, p);
                } catch (Te) {
                  if (
                    Te.status === 502 ||
                    Te.status === 504 ||
                    Te.status === 500 ||
                    Te.status === 546
                  )
                    ((de.msg = "A IA falhou neste trecho. Tentando de novo…"),
                      ot(),
                      await ft(Ee, 165e3, p));
                  else throw Te;
                }
              } finally {
                clearInterval(we);
              }
              (M(p),
                (x.feitas = pe + 1),
                P(Ze, x),
                (de.pct = 10 + (88 * (pe + 1)) / re));
            }
            try {
              u(Ze);
            } catch {}
            ((de.busy = 0),
              (de.aberto = 0),
              (de.msg = ""),
              (de.caps = {}),
              (de.numero = ""),
              _e(),
              (F.lista = null),
              await R(1),
              toast && toast("Aula pronta! 🎬"));
            const be = (F.lista || []).find((pe) => pe.id === x.id);
            (C(), be && setTimeout(() => oe(be.id), 300));
            return;
          } catch (A) {
            if (p !== B()) return;
            de.erro =
              (A.message || String(A)) +
              (x.id
                ? " O que já foi feito ficou salvo: toque em “Continuar”."
                : "");
          }
          ((de.busy = 0), _e(), (F.lista = null), R(1), C());
        }
      }
      function ot() {
        const t = document.querySelector(".au-ger .au-tx .sm");
        t && (t.textContent = de.msg);
        const p = document.querySelector(".au-prog");
        if (p) {
          p.querySelector(".sm").textContent = de.msg;
          const x = p.querySelector(".au-pb i");
          x && (x.style.width = de.pct + "%");
        } else C();
      }
      (document.addEventListener("click", (t) => {
        const p = (A) => t.target.closest(A);
        let x;
        if (p("[data-aulegacyclear]")) {
          if (
            confirm(
              "Apagar os PDFs locais de versões anteriores? As aulas salvas no servidor não serão apagadas. Esta remoção dos PDFs antigos não pode ser desfeita.",
            )
          ) {
            const A = indexedDB.deleteDatabase("aulas-livros");
            ((A.onsuccess = () =>
              toast && toast("PDFs antigos removidos deste aparelho.")),
              (A.onblocked = () =>
                toast && toast("Feche outras abas do app e tente novamente.")));
          }
          return;
        }
        if (p("[data-aunova]")) {
          ((de.aberto = 1), (de.erro = ""), (de.msg = ""), C());
          return;
        }
        if (p("[data-aufecha]")) {
          ((de.aberto = 0), (de.erro = ""), (de.msg = ""), C());
          return;
        }
        if ((x = p("[data-aulv]"))) {
          ((de.sel = x.dataset.aulv),
            (de.caps = {}),
            (de.numero = ""),
            (de.usarManual = 0),
            (de.erro = ""),
            (de.msg = ""),
            C());
          return;
        }
        if ((x = p("[data-aumanual]"))) {
          ((de.usarManual = x.dataset.aumanual === "1"), C());
          return;
        }
        if (p("[data-augera]")) {
          Gt(0);
          return;
        }
        if (p("[data-aucont]")) {
          ((de.aberto = 1), Gt(1));
          return;
        }
        if ((x = p("[data-auapaga]"))) {
          if (
            !confirm(
              "Apagar este PDF do aparelho? As aulas já criadas continuam.",
            )
          )
            return;
          rt("readwrite", (A) => A.delete(x.dataset.auapaga)).then(() => {
            ((de.sel = ""), yt());
          });
          return;
        }
      }),
        document.addEventListener("change", (t) => {
          const p = t.target;
          if (p.id === "aupdf") {
            ((de.novoNome = ""), Ma(p.files && p.files[0]));
            return;
          }
          if (p.dataset && p.dataset.aucap != null) {
            de.caps[p.dataset.aucap] = p.checked;
            const x = scrollY;
            (render(), scrollTo(0, x));
            return;
          }
          p.id === "aunum" && (de.numero = p.value);
        }),
        document.addEventListener("input", (t) => {
          t.target.id === "aumanual" && (de.manual = t.target.value);
        }));
      let it = `
.au-intro{margin:4px 4px 8px}
.au-livro{padding:12px}.au-lt{font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;opacity:.7;margin:0 0 8px 4px}
.au-item{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid rgba(127,127,127,0.18);padding:12px 4px;color:inherit;font:inherit;cursor:pointer}
.au-item:first-of-type{border-top:0}
.au-n{flex:none;width:36px;height:36px;border-radius:8px;display:grid;place-items:center;font-weight:800;background:rgba(172,132,57,0.12);color:#ac8439}
.au-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.au-pb{display:block;height:4px;border-radius:2px;background:rgba(127,127,127,0.2);margin-top:4px;overflow:hidden}.au-pb i{display:block;height:100%;background:#ac8439}
.au-play{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#ac8439;color:#ffffff;font-size:13px}
.au-novabar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.au-nova{font-weight:700}
.au-form{display:flex;flex-direction:column;gap:8px}.au-form .top{display:flex;justify-content:space-between;align-items:center}
.au-form input,.au-form textarea{width:100%;box-sizing:border-box}
.au-livros{display:flex;flex-direction:column;gap:8px}
.au-lv{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:8px 12px;border-radius:8px;border:1px solid rgba(127,127,127,0.25);background:none;color:inherit;font:inherit;cursor:pointer}
.au-lv.on{border-color:#ac8439;background:rgba(172,132,57,0.08)}
.au-up{display:block;text-align:center;padding:12px;border-radius:8px;border:1px dashed rgba(46,138,92,0.5);color:#2e8a5c;font-weight:700;cursor:pointer}.au-up.dis{opacity:.5;pointer-events:none}
.au-row{display:flex;gap:8px}.au-row>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.au-caps{max-height:300px;overflow:auto;border:1px solid rgba(127,127,127,0.2);border-radius:8px;padding:4px}
.au-cap{display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;cursor:pointer}.au-cap.on{background:rgba(172,132,57,0.1)}
.au-cap span{flex:1;min-width:0;font-size:14px}.au-cap small{flex:none;opacity:.6;font-size:12px}.au-cap input{flex:none;width:18px;height:18px}
.au-acoes{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px}
.au-prog{margin-top:8px;display:flex;flex-direction:column;gap:8px}.au-prog .au-pb{height:6px}.au-pb i{transition:width .8s}
.au-ger{cursor:default}.au-ger .au-n{background:rgba(198,154,73,0.15);color:#906d2d}
html.au-aberto,html.au-aberto body{overflow:hidden}
.aup{position:fixed;inset:0;z-index:10000;background:#070708;color:#efeeeb;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);font-family:inherit}
.aup button{font:inherit;color:inherit}
.aup-top{display:flex;align-items:center;gap:8px;padding:8px 12px}
.aup-tt{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14px;line-height:1.25}.aup-tt b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aup-tt span{font-size:12px;color:#9ca0a9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aup-x,.aup-ix{flex:none;width:38px;height:38px;border-radius:50%;border:1px solid #26282b;background:#17181a;font-size:16px;cursor:pointer}
.aup-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px 16px;cursor:pointer}
.aup-vis{width:100%;max-width:880px;max-height:100%;overflow:auto;animation:auin .35s ease}
@keyframes auin{from{opacity:.25;transform:translateY(6px)}to{opacity:1;transform:none}}
.aup-cap{min-height:4.6em;padding:8px 16px 8px;font-size:18px;line-height:1.45;text-align:center;color:#efeeeb;max-width:880px;margin:0 auto;width:100%;box-sizing:border-box}.aup-cap .mut{color:#7a808c}
.aup-prog{display:flex;gap:4px;padding:4px 16px}.aup-prog i{flex:1;height:4px;border-radius:2px;background:#26282b;cursor:pointer}.aup-prog i.ok{background:#329765}.aup-prog i.at{background:#64cc98}
.aup-ctl{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 12px 16px}
.aup-ctl>button{width:46px;height:40px;border-radius:50%;border:1px solid #26282b;background:#17181a;font-size:18px;cursor:pointer}
.aup-ctl .aup-pp{width:60px;height:60px;background:#329765;border-color:#329765;color:#ffffff;font-size:22px}
.aup .aup-ctl select{-webkit-appearance:none;appearance:none;background:#17181a!important;color:#efeeeb!important;border:1px solid #26282b!important;border-radius:8px;padding:8px 8px;font:inherit;font-size:13px;max-width:104px;height:auto;min-height:0;box-shadow:none}
.aup .aup-ctl>button,.aup .aup-x,.aup .aup-ix{display:grid;place-items:center;padding:0;color:#efeeeb;box-shadow:none;min-height:0;min-width:0;flex:none;aspect-ratio:1}
.aup .auv-tab th,.aup .auv-ajt th{color:#66cc99!important;opacity:1;text-align:left!important;font-size:12px;text-transform:uppercase;letter-spacing:.04em;background:none}
.aup .auv-tab td,.aup .auv-ajt td{text-align:left!important;color:#efeeeb;background:none}
.aup .auv-ajt tr.call td{background:rgba(231,97,76,0.14)}.aup .auv-ajt td.pos{color:#5fca94}.aup .auv-ajt td.neg{color:#ed8b7c}
.aup .auv-ajt td:nth-child(n+2),.aup .auv-ajt th:nth-child(n+2){text-align:right!important}
.aup-idx{position:absolute;left:0;right:0;bottom:0;top:58px;background:#121315f2;overflow:auto;padding:8px 12px calc(16px + env(safe-area-inset-bottom))}
.aup-idx button{display:flex;gap:8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #26282b;padding:12px 4px;cursor:pointer}.aup-idx span{color:#7a808c;min-width:22px}.aup-idx .aup-del{color:#ed8b7c;border-bottom:0;margin-top:8px}.aup-idx .aup-del span{color:#ed8b7c}
.auv-svg{width:100%;height:auto;display:block;font-family:inherit}
.auv-grid{stroke:#26282b;stroke-width:.25}.auv-ax{font-size:2.3px;fill:#9ca0a9}.auv-lb{font-size:2.5px;fill:#efeeeb;font-weight:600}.auv-st{font-size:2.3px;fill:#e9e7e4;text-anchor:middle}
.auv-nt{font-size:2.9px;fill:#f6f5f4;text-anchor:middle;font-weight:700}.auv-ns{font-size:2.1px;fill:#9ca0a9;text-anchor:middle}
.auv-h2{font-size:clamp(17px,4.6vw,26px);font-weight:800;margin:0 0 12px;color:#efeeeb;letter-spacing:-.01em}
.auv-nota,.auv-fonte{font-size:12px;color:#9ca0a9;margin-top:8px}
.auv-tit{text-align:center;padding:8px}.auv-kick{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ac8439;font-weight:800;margin-bottom:8px}
.auv-h{font-size:clamp(26px,7.5vw,46px);font-weight:900;line-height:1.08;letter-spacing:-.02em}.auv-sub{font-size:clamp(14px,3.8vw,19px);color:#9ca0a9;margin-top:12px;line-height:1.4}
.auv-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px}.auv-chips span{border:1px solid #373a3f;background:#1c1d20;color:#d4b57d;border-radius:999px;padding:4px 12px;font-size:13px}
.auv-top ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.auv-top li{display:flex;gap:12px;align-items:flex-start;opacity:.16;transition:opacity .45s,transform .45s;transform:translateX(-4px);font-size:clamp(17px,4.6vw,22px);line-height:1.35}
.auv-top li.on{opacity:1;transform:none}.auv-top li small{display:block;color:#9ca0a9;font-size:.78em;font-weight:400;margin-top:4px}
.auv-top .ic{flex:none;width:30px;height:30px;border-radius:6px;background:#1c1d20;display:grid;place-items:center;font-size:16px}.auv-top .ic.dot:after{content:"";width:8px;height:8px;border-radius:50%;background:#ac8439}
.auv-tab table,.auv-ajt{width:100%;border-collapse:collapse;font-size:clamp(12px,3.4vw,16px)}
.auv-tab th,.auv-ajt th{text-align:left;color:#d4b57d;font-weight:700;padding:8px 8px;border-bottom:1px solid #373a3f}
.auv-tab td,.auv-ajt td{padding:8px 8px;border-bottom:1px solid #26282b;vertical-align:top}.auv-tab td.r{color:#9ca0a9;font-weight:600}
.auv-tab tbody tr{opacity:.12;transition:opacity .45s}.auv-tab tbody tr.on{opacity:1}
.auv-ajc{font-size:13px;color:#9ca0a9;margin:-8px 0 8px}
.auv-ajt{font-size:13px;margin-top:8px;font-variant-numeric:tabular-nums}.auv-ajt td{padding:4px 4px}.auv-ajt .pos{color:#5fca94}.auv-ajt .neg{color:#ed8b7c}.auv-ajt tr.call td{background:rgba(231,97,76,0.12)}.auv-ajt small{display:block;color:#f4b7ad;font-size:11px}
.auv-for{text-align:center}.auv-f{font-size:clamp(18px,5vw,28px);font-weight:800;background:#1c1d20;border:1px solid #373a3f;border-radius:8px;padding:16px 12px;color:#d4b57d;margin-bottom:16px;font-variant-numeric:tabular-nums}
.auv-fl{font-size:clamp(14px,3.8vw,19px);padding:4px 0;opacity:.14;transition:opacity .45s;font-variant-numeric:tabular-nums}.auv-fl.on{opacity:1}.auv-fl.forte{font-weight:800;color:#c69a49}
.auv-q{text-align:center;padding:8px}.auv-qq{font-size:clamp(19px,5.2vw,30px);font-weight:800;line-height:1.25}
.auv-qa{margin-top:20px;font-size:clamp(15px,4.2vw,21px);color:#caa45f;background:rgba(173,133,58,0.08);border:1px solid rgba(173,133,58,0.25);border-radius:8px;padding:16px;opacity:0;transform:translateY(6px);transition:all .5s}.auv-qa.on{opacity:1;transform:none}
.auv-wait{display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;text-align:center;min-height:160px;border:1px dashed #373a3f;border-radius:8px;padding:16px;color:#9ca0a9}.auv-wait b{color:#efeeeb}

.au-video{max-width:960px;overflow:hidden}.auyt{position:relative;min-height:min(62dvh,560px);border:1px solid #373a3f;border-radius:8px;overflow:hidden;background:radial-gradient(circle at 18% 18%,rgba(204,167,100,0.22),transparent 34%),radial-gradient(circle at 82% 30%,rgba(172,132,57,0.18),transparent 35%),linear-gradient(135deg,#101113,#0d0d0e 58%,#0b0c0d);box-shadow:0 22px 70px rgba(0,0,0,0.38);isolation:isolate}
.auyt:before{content:"";position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 0 22%,rgba(255,255,255,0.07) 24%,transparent 28% 52%,rgba(212,181,125,0.08) 55%,transparent 62%);transform:translateX(calc((var(--step,0) - 4)*3%));opacity:.8;pointer-events:none;animation:auytmove 9s linear infinite}
.auyt-bg{position:absolute;inset:0;overflow:hidden;z-index:-1}.auyt-bg span{position:absolute;font-size:clamp(88px,24vw,230px);font-weight:900;line-height:1;color:rgba(255,255,255,0.035);filter:blur(.3px);transform:rotate(-12deg)}.auyt-bg span:nth-child(1){left:-3%;top:8%}.auyt-bg span:nth-child(2){right:-4%;bottom:1%;transform:rotate(13deg)}.auyt-bg span:nth-child(3){left:45%;top:45%;font-size:clamp(42px,13vw,120px);opacity:.7;transform:rotate(4deg)}
.auyt-head{display:flex;justify-content:space-between;gap:8px;padding:16px 16px 0;color:#d4b57d;font-size:11px;letter-spacing:.13em;text-transform:uppercase}.auyt-head em{font-style:normal;color:#c19646;background:rgba(172,132,57,0.11);border:1px solid rgba(193,150,70,0.24);border-radius:999px;padding:4px 8px;letter-spacing:.08em}
.auyt-body{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:16px;padding:16px 16px 16px;align-items:stretch;min-height:430px}.auyt-main{min-width:0;display:flex;align-items:center;justify-content:center;padding:8px}.auyt-main>*{width:100%;animation:auytpop .38s ease}.auyt-side{display:flex;flex-direction:column;gap:8px;align-self:stretch;border-left:1px solid rgba(160,164,172,0.18);padding-left:16px;color:#efeeeb}.auyt-thumb{height:118px;border-radius:8px;display:grid;place-items:center;font-size:54px;background:linear-gradient(135deg,rgba(204,167,100,0.18),rgba(172,132,57,0.16));border:1px solid rgba(212,181,125,0.2);box-shadow:inset 0 1px 18px rgba(255,255,255,0.04)}.auyt-side strong{font-size:18px;line-height:1.12}.auyt-side small{color:#9ca0a9}.auyt-bars{height:54px;display:flex;align-items:end;gap:4px;margin:4px 0}.auyt-bars i{flex:1;border-radius:6px 4px 1px 1px;background:linear-gradient(#ad853a,#ac8439);opacity:.86;animation:auytbar 1.6s ease-in-out infinite alternate}.auyt-card{display:block;border:1px solid rgba(160,164,172,0.18);border-radius:8px;padding:8px 8px;background:rgba(24,25,27,0.72);font-size:12px;color:#e9e7e4}.auyt-card.c0{color:#ffffff;font-weight:800}.auyt-card.c1{color:#d4b57d}.auyt-card.c2{color:#c19646}
.auyt-lower{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 16px 16px;padding:8px 12px;border:1px solid rgba(160,164,172,0.18);border-radius:8px;background:rgba(10,11,12,0.68);backdrop-filter:blur(10px);font-size:12px;color:#e9e7e4}.auyt-lower span:first-child{color:#c19646;font-weight:800}.auyt-lower span:nth-child(2){flex:1;text-align:center;color:#efeeeb}.auyt-lower span:last-child{font-variant-numeric:tabular-nums;color:#9ca0a9}
.auyt-1{background:radial-gradient(circle at 20% 10%,rgba(198,154,73,0.18),transparent 33%),linear-gradient(135deg,#111213,#1f2023 58%,#0b0c0d)}.auyt-2{background:radial-gradient(circle at 75% 20%,rgba(231,97,76,0.18),transparent 33%),linear-gradient(135deg,#0f1011,#1f2124 58%,#0b0c0d)}.auyt-3{background:radial-gradient(circle at 18% 72%,rgba(175,169,157,0.18),transparent 35%),linear-gradient(135deg,#101113,#17191b 58%,#0b0c0d)}.auyt-4{background:radial-gradient(circle at 55% 16%,rgba(172,132,57,0.2),transparent 33%),linear-gradient(135deg,#0f1011,#202225 58%,#0b0c0d)}.auyt-5{background:radial-gradient(circle at 25% 20%,rgba(112,155,194,0.2),transparent 34%),linear-gradient(135deg,#0f1011,#1b1c1f 58%,#0b0c0d)}
@keyframes auytmove{to{transform:translateX(8%)}}@keyframes auytpop{from{opacity:.3;transform:scale(.985) translateY(8px)}to{opacity:1;transform:none}}@keyframes auytbar{to{opacity:.45;transform:scaleY(.72)}}
@media(max-width:760px){.auyt{min-height:min(66dvh,620px);border-radius:8px}.auyt-body{grid-template-columns:1fr;gap:8px;min-height:0;padding:12px}.auyt-main{padding:4px}.auyt-side{border-left:0;border-top:1px solid rgba(160,164,172,0.18);padding:8px 0 0;display:grid;grid-template-columns:82px 1fr;align-items:center}.auyt-thumb{height:72px;border-radius:8px;font-size:36px;grid-row:span 3}.auyt-bars,.auyt-card.c1,.auyt-card.c2{display:none}.auyt-side strong{font-size:14px}.auyt-lower{margin:0 12px 12px;font-size:11px}.auyt-lower span:nth-child(2){display:none}.aup-stage{padding:4px 8px}.aup-cap{font-size:16px}}

@media (orientation:landscape) and (max-height:520px){.aup-top{padding:4px 8px}.aup-cap{min-height:2.9em;font-size:15px;padding:4px 16px}.aup-ctl{padding:4px 8px 8px}.aup-ctl>button{width:38px;height:40px}.aup-ctl .aup-pp{width:46px;height:46px}.auv-h2{margin-bottom:8px}}
`;
      ((it += `
/* v335 - estudos visuais + TradingView */
.aup-ctl .aup-tv-btn{width:auto!important;min-width:80px;padding:8px 12px;font-size:12px;border:1px solid #309161;border-radius:8px;color:#edece9;background:#27292d}
.au-viz-edu{max-width:660px;margin:16px auto 0;border:1px solid #3d4046;border-radius:8px;padding:12px;background:rgba(15,16,18,0.88)}
.au-viz-label{font-size:10px;letter-spacing:.07em;color:#c69a49;font-weight:800}.au-viz-edu svg{width:100%;height:auto;max-height:150px;display:block;margin:8px 0}.au-viz-note{font-size:11px;color:#86abcb}
.au-tv-overlay{position:fixed;inset:0;z-index:100020;background:rgba(10,11,12,0.96);display:grid;place-items:center;padding:12px;color:#efeeeb}.au-tv-panel{width:min(1250px,100%);height:min(92dvh,860px);display:flex;flex-direction:column;background:#151619;border:1px solid #4e5259;border-radius:8px;padding:12px;gap:8px}.au-tv-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.au-tv-top button{color:#ffffff;background:#34363c;border:0;border-radius:6px;min-width:40px;min-height:40px}.au-tv-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.au-tv-controls label{margin:0;color:#bfc2c8;flex:1 1 140px}.au-tv-controls select{margin:4px 0 0;background:#212327;color:#ffffff;border:1px solid #4c5057;padding:8px}.au-tv-controls a{color:#d4b57d;font-size:12px;padding:8px 4px}.au-tv-chart{flex:1;min-height:240px;position:relative}.au-tv-loading{padding:24px;color:#adb0b7}.au-tv-legal{font-size:11px;color:#afb3ba;line-height:1.4}.tradingview-widget-copyright{text-align:center;font-size:12px;padding:4px}.tradingview-widget-copyright a{color:#86abcb}
@media(max-width:560px){.au-tv-overlay{padding:4px}.au-tv-panel{padding:8px;height:98dvh}.au-tv-controls label{flex-basis:105px}.au-viz-edu{padding:8px}.aup-ctl .aup-tv-btn{min-width:65px;padding:4px 8px}}
`),
        (it += `
/* v336 - motor de cenas, biblioteca de gráficos didáticos e mapa visual */
.au336-example{margin:12px auto 0;width:min(670px,100%);box-sizing:border-box;border:1px solid #51555d;border-radius:8px;padding:8px;background:#1b1d1f;color:#efeeeb}.au336-example svg{display:block;width:100%;height:auto;max-height:158px;margin:8px auto}.au336-example svg text{font-family:system-ui;font-size:10px;fill:#e6e4e0}.au336-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between;font-size:13px;font-weight:700}.au336-head small{font-size:9px;color:#c69a49;letter-spacing:.03em}.au336-foot{font-size:10px;color:#b4b7bd}.au336-map-btn{color:#efeeeb;background:#292c30;border:1px solid #60656e;border-radius:6px;padding:8px 8px}.au336-opt{display:flex!important;align-items:center;gap:8px;font-size:12px;color:#86abcb;white-space:nowrap}.au336-opt input{accent-color:#c09341}.au336-overlay{position:fixed;inset:0;z-index:100050;display:grid;place-items:center;padding:12px;background:#0a0b0ce9}.au336-dialog{width:min(710px,100%);max-height:87dvh;overflow:auto;background:#18191b;border:1px solid #5d616a;border-radius:8px;color:#f0efed;padding:16px;box-sizing:border-box;font:13px/1.5 system-ui}.au336-dialog header{display:flex;align-items:start;justify-content:space-between;gap:8px}.au336-dialog header strong{font-size:16px}.au336-dialog header button{border:1px solid #5b5f68;border-radius:6px;background:#303337;color:white;padding:8px 12px}.au336-dialog p{color:#b9bcc2}.au336-list{display:grid;gap:8px}.au336-map-row{display:grid;gap:4px;text-align:left;padding:12px;border:1px solid #3d4046;border-radius:6px;background:#232528;color:#f5f4f3}.au336-map-row span{font-size:11px;color:#adb1b8}@media(max-width:560px){.au336-example{padding:8px;margin:8px auto 0}.au336-example svg{max-height:105px}.au336-head{font-size:11px}.au336-head small{font-size:8px}.au336-dialog{padding:12px}}
`),
        (it += `
/* v337 — imagens educacionais geradas e armazenadas de forma privada */
.au337-figure{width:min(690px,100%);margin:8px auto;border:1px solid #5a5e67;border-radius:8px;overflow:hidden;background:#17181a}.au337-figure img{width:100%;max-height:230px;object-fit:contain;display:block}.au337-figure figcaption{padding:4px 8px;font-size:9px;color:#c69a49;letter-spacing:.04em;text-align:center}.au337-gen-btn{background:#34373c;color:#f5f4f2;border:1px solid #595d66;border-radius:6px;padding:8px 8px;white-space:normal}.au337-gen-btn:disabled{opacity:.5}.au337-status{font-size:11px;color:#d4b57d;flex:1 1 130px}.aup-options{flex-wrap:wrap}@media(max-width:560px){.au337-figure img{max-height:140px}.au337-gen-btn{font-size:11px}}
`),
        (it += `
/* v338: janela de teste para aulas, sem custos de API */
.au338-diag-btn{background:#33353a;color:#eeedea;border:1px solid #5e636c;border-radius:6px;padding:8px 8px}.au338-modal{position:fixed;inset:0;z-index:2147483646;background:#0d0d0ecd;display:flex;align-items:center;justify-content:center;padding:16px}.au338-panel{width:min(600px,100%);max-height:86dvh;overflow:auto;padding:16px;background:#1f2023;color:#f7f7f6;border:1px solid #6a6f7a;border-radius:8px;box-shadow:0 18px 70px #00000088}.au338-panel header{display:flex;align-items:center;justify-content:space-between;gap:16px}.au338-panel header button{padding:8px 12px;border:1px solid #838994;border-radius:6px;background:#36393e;color:#ffffff}.au338-panel p{font-size:12px;color:#86abcb}.au338-panel ul{list-style:none;padding:0;display:grid;gap:4px}.au338-check{display:flex;align-items:start;gap:12px;padding:8px;background:#292b2f;border-radius:6px}.au338-check b{display:block;font-size:13px}.au338-check small{display:block;font-size:11px;color:#86abcb}.au338-actions{display:flex;flex-wrap:wrap;gap:8px}.au338-actions button{padding:8px;border:1px solid #696e79;background:#393c42;color:#ffffff;border-radius:6px}.au338-small{display:block;margin-top:12px;color:#c4c7cc;font-size:11px}
`),
        (it += `
.au339-voices{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border-top:1px solid #595e67;padding:8px 0}.au339-voices label{display:flex;align-items:center;gap:4px;font-size:12px}.au339-voices select{max-width:190px}.au339-voices button{border:1px solid #747985;border-radius:6px;background:#383b40;color:#ffffff;padding:8px}.au339-voices #au339status{font-size:11px;color:#d4b57d;width:100%}
`));
      const wt = document.createElement("style");
      ((wt.id = "aulas-css"),
        (wt.textContent = it),
        document.head.appendChild(wt));
      async function za(t) {
        if (t) {
          for (const p of Object.keys(localStorage))
            (p.startsWith("aulas-v318:" + t + ":") ||
              p === "estudos-v316:" + t) &&
              localStorage.removeItem(p);
          await new Promise((p, x) => {
            const A = indexedDB.deleteDatabase("aulas-livros-v318:" + t);
            ((A.onsuccess = p),
              (A.onerror = () =>
                x(new Error("Não consegui remover os PDFs locais."))),
              (A.onblocked = () =>
                x(
                  new Error(
                    "Feche outras abas do aplicativo para remover os PDFs locais.",
                  ),
                )));
          });
        }
      }
      const Fa = render;
      render = function () {
        return (g(), Fa.apply(this, arguments));
      };
      try {
        for (const t of Object.keys(localStorage))
          /^aulas-(lista-v1$|rot-v1:|pos-v1:|job-v1$)/.test(t) &&
            localStorage.removeItem(t);
      } catch {}
      window.AULAS = {
        abre: oe,
        carregaLista: R,
        VIS: ht,
        calcAjuste: mt,
        _dbg: { cena: Pe, P: e, falasCena: ge },
        ensureOwner: g,
        limparConta: za,
        getLista: () => (Array.isArray(F.lista) ? F.lista.slice() : []),
        getStatus: () => ({ busy: !!F.busy, error: F.err, lastUpdated: F.ts }),
        progresso: (t) => f(t),
        /* v597: sala de aula — concluir e anotar (mesma coluna de progresso, sem mudar a engine). */
        concluida: (id) => !!f((F.lista || []).find((a) => a.id === id) || { id }).fim,
        marcarConcluida: (id, sim = !0) => salva597(id, { fim: sim ? 1 : 0 }),
        notas: (id) => f((F.lista || []).find((a) => a.id === id) || { id }).notas || "",
        salvarNotas: (id, txt) => salva597(id, { notas: String(txt || "").slice(0, 8e3) }),
        /* v598: roteiro já baixado neste aparelho (para a recomendação por erro do pregão). */
        roteiro: (id) => (E(l + id, null) || {}).r || null,
      };
    })(),
    (function () {
      "use strict";
      if (typeof adrHtml != "function") return;
      const s = {
          PBR: "PETR3",
          "PBR.A": "PETR4",
          "PBR-A": "PETR4",
          VALE: "VALE3",
          ITUB: "ITUB4",
          BBD: "BBDC4",
          BBDO: "BBDC3",
          ABEV: "ABEV3",
          BSBR: "SANB11",
          SBS: "SBSP3",
          ERJ: "EMBJ3",
          EMBJ: "EMBJ3",
          GGB: "GGBR4",
          SID: "CSNA3",
          CIG: "CMIG4",
          ELP: "CPLE6",
          UGP: "UGPA3",
          SUZ: "SUZB3",
          BAK: "BRKM5",
          TIMB: "TIMS3",
          VIV: "VIVT3",
          EBR: "ELET3",
          "EBR.B": "ELET6",
          "EBR-B": "ELET6",
          CSAN: "CSAN3",
          BDORY: "BBAS3",
          EWZ: "IBOV",
        },
        l = { ts: 0, busy: 0, dados: null, err: "" },
        r = (m) =>
          String(m ?? "").replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[c],
          ),
        j = (m, c = 2) =>
          Number(m).toLocaleString("pt-BR", {
            minimumFractionDigits: c,
            maximumFractionDigits: c,
          }),
        O = (m) => (m > 0 ? "+" : "") + j(m, 2) + "%",
        G = (m) => (m > 0.05 ? "g" : m < -0.05 ? "r" : "mut"),
        o = (m) => new Date((m - 3 * 3600) * 1e3).toISOString().slice(0, 10),
        F = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10),
        N = () =>
          window.TraderCalendario
            ? window.TraderCalendario.visibility(new Date(), AD.data, (m) =>
                window.TraderAdr.view(m),
              )
            : { show: !1, reason: "calendario_indisponivel" };
      function e(m, c = new Date()) {
        const q = window.TraderAdr.view(m, c),
          H = q?.regular,
          g = window.TraderCalendario?.millis(H?.at);
        return !H ||
          !Number.isFinite(H.px) ||
          H.px <= 0 ||
          !Number.isFinite(H.chp) ||
          !Number.isFinite(g) ||
          g > c.getTime() + 6e4 ||
          c.getTime() - g > 30 * 6e4
          ? !1
          : window.TraderCalendario.datePart(new Date(g), "America/New_York")
              .date ===
              window.TraderCalendario.datePart(c, "America/New_York").date;
      }
      async function i(m) {
        return (
          (
            await (
              await rq("/functions/v1/candles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ativo: m, intervalo: "1d" }),
                signal: AbortSignal.timeout(2e4),
              })
            ).json()
          ).candles || []
        ).filter((H) => H && isFinite(H[4]));
      }
      async function B() {
        if (!N().show) {
          const H = !!l.dados;
          ((l.dados = null),
            (l.err = ""),
            (l.ts = 0),
            H && typeof adrPaint == "function" && adrPaint());
          return;
        }
        if (
          (Date.now() - l.ts < 3e5 && l.adrTs === AD.data?.ts) ||
          window.DIARIO_DEMO ||
          typeof SESS > "u" ||
          !SESS?.at
        )
          return;
        const c = (AD.data && AD.data.itens) || [];
        if (!c.length) return;
        ((l.busy = 1), (l.err = ""));
        const q = AD.data?.ts;
        try {
          const [H, g] = await Promise.all([i("IBOV"), i("USDBRL")]);
          if (H.length < 2 || g.length < 2)
            throw new Error("Sem histórico do Ibovespa ou do dólar.");
          const R = o(H[H.length - 1][0]),
            a =
              (Date.parse(F() + "T12:00:00Z") - Date.parse(R + "T12:00:00Z")) /
              864e5;
          if (!Number.isFinite(a) || a < 1 || a > 7)
            throw new Error(
              "Último fechamento da B3 sem referência recente e verificável.",
            );
          const n = [...g].reverse().find((v) => o(v[0]) <= R),
            f = g[g.length - 1];
          if (o(f[0]) !== F())
            throw new Error(
              "Dólar sem candle de referência no feriado. Projeção indisponível.",
            );
          if (!n || !(n[4] > 0) || !(f[4] > 0))
            throw new Error("Sem câmbio válido na data-base da B3.");
          const h = o(f[0]) > R ? (f[4] / n[4] - 1) * 100 : 0,
            Q = [],
            J = c.filter((v) => s[String(v.s).toUpperCase()] && e(v));
          for (let v = 0; v < J.length; v += 3)
            await Promise.all(
              J.slice(v, v + 3).map(async (I) => {
                const k = s[String(I.s).toUpperCase()];
                if (!k) return;
                const L = window.TraderAdr.view(I),
                  d = L.regular && L.regular.chp;
                if (typeof d != "number" || !Number.isFinite(d)) return;
                let $ = null;
                if (k === "IBOV") $ = H[H.length - 1][4];
                else
                  try {
                    const y = [...(await i(k))]
                      .reverse()
                      .find((C) => o(C[0]) <= R);
                    $ = y ? y[4] : null;
                  } catch {}
                const w = ((1 + d / 100) * (1 + h / 100) - 1) * 100;
                Q.push({
                  adr: I.s,
                  loc: k,
                  adrp: d,
                  varp: w,
                  base: $,
                  teo: $ ? $ * (1 + w / 100) : null,
                });
              }),
            );
          if (
            (Q.sort(
              (v, I) =>
                c.findIndex((k) => k.s === v.adr) -
                c.findIndex((k) => k.s === I.adr),
            ),
            !N().show ||
              R >= F() ||
              new Set(
                Q.filter((v) => v.teo > 0 && v.adr !== "EWZ").map((v) => v.loc),
              ).size < 2)
          )
            throw new Error(
              "Sem feriado confirmado, base B3 anterior ou duas ADRs elegíveis.",
            );
          ((l.dados = {
            ultB3: R,
            usd: h,
            dolar: f[4],
            linhas: Q,
            b3Fechada: !0,
            feriadoB3: !0,
          }),
            (l.ts = Date.now()),
            (l.dataTs = l.ts),
            (l.adrTs = q));
        } catch (H) {
          ((l.dados = null),
            (l.err = String(H.message || H)),
            (l.ts = Date.now()));
        }
        ((l.busy = 0), typeof adrPaint == "function" && adrPaint());
      }
      function Y() {
        return (
          l.job ||
            (l.job = B().finally(() => {
              l.job = null;
            })),
          l.job
        );
      }
      function z() {
        if (!N().show) return "";
        setTimeout(Y, 0);
        const m = l.dados;
        if (!m)
          return `<div class="adr-ab card-sub"><b>Abertura teórica na B3</b><p class="sm mut">${l.busy ? "Calculando…" : l.err ? r(l.err) : "Calcula quando as ADRs carregarem (precisa estar logado)."}</p></div>`;
        const [, c, q] = m.ultB3.split("-"),
          H = m.linhas
            .map(
              (g) =>
                `<tr><td><b>${r(g.loc === "IBOV" ? "Ibovespa" : g.loc)}</b><small>${r(g.adr)} ${O(g.adrp)}</small></td><td>${g.base ? j(g.base, g.loc === "IBOV" ? 0 : 2) : "—"}</td><td class="${G(g.varp)}"><b>${g.teo ? O(g.varp) : "—"}</b></td><td>${g.teo ? j(g.teo, g.loc === "IBOV" ? 0 : 2) : "—"}</td></tr>`,
            )
            .join("");
        return `<div class="adr-ab"><div class="adr-ab-top"><b>Abertura teórica na B3</b>${'<span class="adr-ab-tag">FERIADO B3 · estimativa · base ' + q + "/" + c + "</span>"}</div>
<p class="sm mut">Estimativa exclusiva de feriado da B3 com NYSE em pregão regular, sem prever o leilão de abertura: variação da ADR × variação do dólar (${O(m.usd)}, R$ ${j(m.dolar, 4)}) sobre o fechamento da B3 em ${q}/${c}.</p>
<div class="adr-ab-tab"><table><thead><tr><th>Ativo</th><th>Fech. B3</th><th>Var. esperada</th><th>Abertura teórica</th></tr></thead><tbody>${H || '<tr><td colspan="4" class="mut">Nenhuma ADR da lista tem ação correspondente mapeada.</td></tr>'}</tbody></table></div>
<p class="sm mut">Conta: (1 + var. ADR) × (1 + var. dólar) − 1. Usa o pregão regular de Nova York; pós-mercado, notícias e o leilão de abertura podem mudar o preço. Ibovespa estimado pelo EWZ. Não é cotação.</p></div>`;
      }
      function M() {
        return N().show && l.dados?.linhas.length
          ? 156 + l.dados.linhas.slice(0, 12).length * 58
          : 0;
      }
      function E(m, c, q) {
        if (!N().show) return 0;
        const H = l.dados,
          g = H?.linhas.slice(0, 12) || [];
        if (!g.length) return 0;
        const R = 36,
          a = M(),
          n = q + 48,
          f = 40 + g.length * 58;
        ((m.textBaseline = "alphabetic"),
          (m.textAlign = "left"),
          (m.fillStyle = "#efeeeb"),
          (m.font = "700 30px system-ui"),
          m.fillText("Abertura teórica na B3", 48, q + 30),
          (m.textAlign = "right"),
          (m.fillStyle = "#b1b5bc"),
          (m.font = "22px system-ui"),
          m.fillText(
            "FERIADO B3 · estimativa · base " +
              H.ultB3.slice(8) +
              "/" +
              H.ultB3.slice(5, 7),
            c - 48,
            q + 30,
          ),
          (m.fillStyle = "#16171a"),
          (m.strokeStyle = "#292b2f"),
          (m.lineWidth = 2),
          m.beginPath(),
          m.roundRect(R, n, c - 2 * R, f, 18),
          m.fill(),
          m.stroke());
        const h = [60, 560, 760, c - 60];
        return (
          (m.font = "20px system-ui"),
          (m.fillStyle = "#b1b5bc"),
          ["Ativo / ADR", "Fech. B3", "Variação est.", "Preço teórico"].forEach(
            (Q, J) => {
              ((m.textAlign = J ? "right" : "left"),
                m.fillText(Q, h[J], n + 28));
            },
          ),
          g.forEach((Q, J) => {
            const v = n + 66 + J * 58;
            (J &&
              ((m.strokeStyle = "#292b2f"),
              (m.lineWidth = 1),
              m.beginPath(),
              m.moveTo(56, v - 34),
              m.lineTo(c - 56, v - 34),
              m.stroke()),
              (m.textAlign = "left"),
              (m.font = "700 26px system-ui"),
              (m.fillStyle = "#efeeeb"),
              window.TraderAssetIdentity?.draw(m, Q.loc, 60, v - 26, 25)
                ? m.fillText(Q.loc === "IBOV" ? "Ibovespa" : Q.loc, 96, v)
                : m.fillText(Q.loc === "IBOV" ? "Ibovespa" : Q.loc, 60, v),
              (m.font = "18px system-ui"),
              (m.fillStyle = "#b1b5bc"),
              m.fillText(Q.adr + " " + O(Q.adrp), 60, v + 20),
              (m.textAlign = "right"),
              (m.font = "24px system-ui"),
              (m.fillStyle = "#efeeeb"),
              m.fillText(
                Q.base ? j(Q.base, Q.loc === "IBOV" ? 0 : 2) : "—",
                h[1],
                v,
              ),
              (m.font = "700 26px system-ui"),
              (m.fillStyle = Q.teo
                ? Q.varp > 0.05
                  ? "#ad853a"
                  : Q.varp < -0.05
                    ? "#ed8b7c"
                    : "#b1b5bc"
                : "#b1b5bc"),
              m.fillText(Q.teo ? O(Q.varp) : "—", h[2], v),
              (m.fillStyle = "#efeeeb"),
              m.fillText(
                Q.teo ? j(Q.teo, Q.loc === "IBOV" ? 0 : 2) : "—",
                h[3],
                v,
              ));
          }),
          (m.textAlign = "left"),
          (m.fillStyle = "#b1b5bc"),
          (m.font = "20px system-ui"),
          m.fillText(
            "ADR regular × dólar (" +
              O(H.usd) +
              ") · referência, não é preço de leilão.",
            48,
            n + f + 30,
            c - 96,
          ),
          m.fillText(
            (l.err ? "Falha na atualização · cópia anterior. " : "Consulta: ") +
              new Date(l.dataTs).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              }) +
              " · pós-mercado não incluído.",
            48,
            n + f + 56,
            c - 96,
          ),
          a
        );
      }
      if (
        ((window.TraderPreOpen = {
          height: M,
          draw: E,
          prepare: Y,
          visibility: N,
        }),
        typeof imgDados == "function")
      ) {
        const m = imgDados;
        imgDados = async function () {
          (await m.apply(this, arguments), (l.ts = 0), await Y());
        };
      }
      (setTimeout(Y, 6e3),
        setInterval(() => {
          document.hidden || Y();
        }, 3e5));
      const u = adrHtml;
      adrHtml = function () {
        return u.apply(this, arguments) + z();
      };
      const P = document.createElement("style");
      ((P.textContent =
        ".adr-ab{margin-top:16px;padding-top:12px;border-top:1px solid rgba(127,127,127,0.2)}.adr-ab-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.adr-ab-tag{font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;background:rgba(198,154,73,0.18);color:#906d2d}.adr-ab-tab{overflow-x:auto;margin:8px 0}.adr-ab table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}.adr-ab th{text-align:left;font-size:11px;opacity:.65;padding:8px 4px;border-bottom:1px solid rgba(127,127,127,0.25)}.adr-ab td{padding:8px 4px;border-bottom:1px solid rgba(127,127,127,0.12)}.adr-ab td small{display:block;opacity:.6;font-size:11px}.adr-ab td:nth-child(n+2),.adr-ab th:nth-child(n+2){text-align:right}"),
        document.head.appendChild(P));
    })(),
    (function () {
      "use strict";
      const s = window.TRM;
      if (!s) return;
      const l = (a) => s.esc2(String(a ?? "")),
        r = (a) => typeof a == "number" && Number.isFinite(a),
        j = (a, n = 2) =>
          r(a)
            ? a.toLocaleString("pt-BR", {
                minimumFractionDigits: n,
                maximumFractionDigits: n,
              })
            : "—",
        O = (a) => (r(a) ? (a > 0 ? "+" : "") + j(a) + "%" : "—"),
        G = (a) =>
          a && Number.isFinite(new Date(a).getTime())
            ? new Date(a).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "não informado",
        o = (a) =>
          String(a || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        F = [
          ["CME_MINI:NQ1!", "Nasdaq futuro", 2],
          ["CME_MINI:ES1!", "S&P 500 futuro", 2],
          ["BMFBOVESPA:WIN1!", "Mini índice · WIN", 0],
          ["BMFBOVESPA:WDO1!", "Mini dólar · WDO", 1],
          ["FX_IDC:USDBRL", "Dólar / real", 4],
          ["TVC:DXY", "DXY", 2],
          ["TVC:VIX", "VIX", 2],
          ["TVC:US10Y", "Treasury 10 anos", 3],
        ],
        N = { s: F.map((a) => a[0]) };
      let e = null,
        i = null,
        B = null,
        Y = !1;
      function z(a, n) {
        return (
          {
            global: "Radar Global",
            dt: "Fluxo e Day Trade",
            macro: "Juros e Macroeconomia",
            ia: "Central de Inteligência",
          }[a] ||
          n.n ||
          a
        );
      }
      function M() {
        const a = ["global", "dt", "macro", "ia"];
        return Object.entries(s.TS().wss).sort((n, f) => {
          const h = (Q) => (a.includes(Q) ? a.indexOf(Q) : 99);
          return h(n[0]) - h(f[0]);
        });
      }
      function E() {
        return (
          "diario-terminal-resume-v306-" +
          ((typeof SESS < "u" && SESS?.uid) || "local")
        );
      }
      function u() {
        if (typeof tab < "u" && tab !== "term") return;
        const a = s.TS();
        a.resume = { ws: a.ws, mob: s.TR.mob, foco: s.TR.foco };
        try {
          localStorage.setItem(E(), JSON.stringify(a.resume));
        } catch {}
      }
      function P() {
        const a = s.TS();
        if (
          (a.wss.global ||
            (a.wss.global = {
              n: "Radar Global",
              p: ["GLOBAL", "DIFUT", "ECO", "NEWSBR"],
              t: [
                ["GLOBAL", "WEI", "FX", "CMDTY", "ADR"],
                ["DIFUT", "WIRP", "GC"],
                ["ECO", "EVT"],
                ["NEWSBR", "NEWSUS", "TOP"],
              ],
              g: [
                { x: 0, y: 0, w: 7, h: 15 },
                { x: 7, y: 0, w: 5, h: 15 },
                { x: 0, y: 15, w: 5, h: 13 },
                { x: 5, y: 15, w: 7, h: 13 },
              ],
            }),
          B === E())
        )
          return;
        B = E();
        let n = a.resume;
        try {
          n = JSON.parse(localStorage.getItem(E()) || "null") || n;
        } catch {}
        if (n && a.wss[n.ws]) {
          a.ws = n.ws;
          const f = a.wss[n.ws].p.length - 1,
            h = (Q) => (Number.isInteger(Q) ? Math.max(0, Math.min(f, Q)) : 0);
          ((s.TR.mob = h(n.mob)), (s.TR.foco = h(n.foco)));
        }
      }
      function m(a, n) {
        return `<div class="trfont">Consulta: ${l(G(a.v?.em))} · ${a.err ? "Falha na atualização · cópia anterior" : a.v ? (Date.now() - a.ts > n * 2 ? "Consulta antiga" : "Atualização automática") : "Aguardando fonte"}${a.err ? " · " + l(a.err) : ""}. Horários em Brasília.</div>`;
      }
      ((s.FN.GLOBAL = "Radar Global · futuros, dólar e contexto do pregão"),
        (s.EXT.GLOBAL = {
          livre: !0,
          vivo: !0,
          load: async () => {
            document.hidden || (await s.trFn("cot", N, 3e4));
          },
          body: () => {
            const a = s.trGet("cot", N),
              n = a.v?.itens || [];
            return `<div class="trsec">Brasil e EUA · radar de acompanhamento</div><div class="radar-quotes">${F.map(
              ([h, Q, J]) => {
                const v = n.find((w) => w.pedido === h || w.s === h) || {},
                  I = /WIN1!/.test(h)
                    ? "WINFUT"
                    : /WDO1!/.test(h)
                      ? "WDOFUT"
                      : null,
                  k = s.melhorPx(I || h, v, v.r) || {},
                  L = I ? s.profitDe?.(I) : null,
                  d = r(k.px) ? k.px : v.px,
                  $ = r(k.px) ? k.d1 : v.d1;
                return `<article class="radar-quote"><span>${l(Q)}</span><strong>${j(d, J)}</strong><b class="${r($) ? ($ > 0 ? "tg" : $ < 0 ? "tr" : "") : ""}">${O($)}</b><small>${l(k.fonte || v.fonte || "TradingView")} · ${l(k.fonte === "Profit" ? (k.rt ? "recebimento recente" : "sem recebimento recente") : v.atraso === !1 ? "tempo real na fonte" : v.atraso ? "com atraso" : "atraso não confirmado")}<br>Preço: ${l(k.fonte === "Profit" ? (L?.dat ? L.dat + " " + (L.hor || "") : "horário do negócio não informado") : G(v.horarioPreco || v.dado_em))}${k.fonte === "Profit" ? "<br>Recebido: " + l(G(k.ts)) : v.snapshot ? "<br>Cópia do servidor" : ""}</small></article>`;
              },
            ).join(
              "",
            )}</div><p class="trnote">Nasdaq futuro é a referência do mercado futuro; USTEC/NAS100 da sua corretora pode ter preço diferente. WIN/WDO usam a ponte quando há dado válido.</p>${m(a, 3e4)}`;
          },
        }),
        (s.FN.DIFUT =
          "DI Futuros · curva, variação em pontos-base e referência oficial"),
        (s.EXT.DIFUT = {
          livre: !0,
          vivo: !0,
          load: async () => {
            document.hidden || (await s.trFn("copom", {}, 6e4));
          },
          body: () => {
            const a = s.trGet("copom", {}),
              n = a.v;
            if (!n) return s.carregando(a.err || "Consultando curva DI…");
            const f = n.curva || [];
            return (
              `<div class="trsec">DI Futuros · curva de juros</div><p class="trnote">Selic ${j(n.selic)}% · CDI ${j(n.cdi)}% · ref. ${l(n.cdi_ref || "não informada")}</p>` +
              s.tabela(
                ["Contrato", "Taxa a.a.", "Δ pb", "Preço em"],
                f.map(
                  (h) =>
                    `<tr><td>${l(h.cod)}</td><td class="num">${j(h.taxa)}%</td><td class="num ${h.var_pb > 0 ? "tr" : h.var_pb < 0 ? "tg" : ""}">${r(h.var_pb) ? (h.var_pb > 0 ? "+" : "") + j(h.var_pb, 0) : "—"}</td><td>${l(G(h.horarioPreco))}</td></tr>`,
                ),
                "di-radar",
              ) +
              (f.length
                ? ""
                : '<p class="trnote">Curva indisponível. Nenhuma taxa foi estimada.</p>') +
              `<p class="trnote">${l(n.fonte || "")}${(n.avisos || []).map((h) => "<br>" + l(h)).join("")}</p>` +
              m(a, 6e4)
            );
          },
        }));
      for (const [a, n, f] of [
        ["NEWSBR", "Brasil Ibovespa dólar economia", "Notícias · Brasil"],
        [
          "NEWSUS",
          "United States Nasdaq Federal Reserve markets",
          "Notícias · EUA e mundo",
        ],
      ]) {
        const h = { q: n };
        ((s.FN[a] = f),
          (s.EXT[a] = {
            livre: !0,
            vivo: !0,
            load: async () => {
              document.hidden || (await s.trFn("noticias", h, 18e4));
            },
            body: () => {
              const Q = s.trGet("noticias", h),
                J = Q.v?.itens || [],
                v = new Set(),
                I = J.filter((k) => {
                  const L = o(k.t).replace(/[^a-z0-9]/g, "");
                  return v.has(L) ? !1 : (v.add(L), !0);
                }).slice(0, 30);
              return (
                `<div class="trsec">${f}</div>` +
                I.map((k) => {
                  let L = "#";
                  try {
                    const d = new URL(k.l || k.u || k.url || k.link);
                    /^https?:$/.test(d.protocol) && (L = d.href);
                  } catch {}
                  return `<article class="radar-news"><a href="${l(L)}" target="_blank" rel="noopener noreferrer">${l(k.t)}</a><small>${l(k.f)} · ${l(G(k.d))}</small></article>`;
                }).join("") +
                (I.length
                  ? ""
                  : s.carregando(Q.err || "Consultando notícias…")) +
                m(Q, 18e4)
              );
            },
          }));
      }
      function c() {
        e?.open && e.close();
      }
      function q(a) {
        const n = document.querySelector("[data-trlay]");
        (c(),
          n
            ? ((n.value = a),
              n.dispatchEvent(new Event("change", { bubbles: !0 })),
              u())
            : window.TerminalAcoes?.executar("espaco", a) && u());
      }
      function H() {
        ((i = document.querySelector("[data-radar-picker]")),
          e?.remove(),
          (e = document.createElement("dialog")),
          (e.className = "radar-picker"),
          e.setAttribute("aria-label", "Selecionar painel do Terminal"));
        const a = document.createElement("header"),
          n = document.createElement("strong"),
          f = document.createElement("button");
        ((n.textContent = "Selecionar painel"),
          (f.type = "button"),
          (f.textContent = "Fechar"),
          f.addEventListener("click", c),
          a.append(n, f));
        const h = document.createElement("input");
        ((h.type = "search"),
          (h.placeholder = "Pesquisar painéis…"),
          h.setAttribute("aria-label", "Pesquisar painéis"));
        const Q = document.createElement("div");
        Q.className = "radar-picker-list";
        function J() {
          Q.replaceChildren();
          const v = o(h.value);
          for (const [k, L] of M()) {
            if (!o(z(k, L) + " " + L.p.join(" ")).includes(v)) continue;
            const d = document.createElement("button");
            ((d.type = "button"),
              (d.textContent = z(k, L)),
              d.setAttribute("aria-current", String(k === s.TS().ws)),
              d.addEventListener("click", () => q(k)),
              Q.append(d));
          }
          if (!Q.children.length) {
            const k = document.createElement("p");
            ((k.textContent = "Nenhum painel encontrado."), Q.append(k));
          }
          const I = document.createElement("button");
          ((I.type = "button"),
            (I.textContent = "+ Novo espaço"),
            I.addEventListener("click", () => q("__novo")),
            Q.append(I));
        }
        (h.addEventListener("input", J),
          e.addEventListener("click", (v) => {
            v.target === e && c();
          }),
          e.addEventListener("close", () => i?.isConnected && i.focus()),
          e.append(a, h, Q),
          document.body.append(e),
          J(),
          e.showModal(),
          h.focus());
      }
      function g() {
        if (!document.body.classList.contains("trmon")) {
          c();
          return;
        }
        const a = document.querySelector("[data-trlay]");
        if (!a) return;
        ((a.hidden = !0), (a.style.display = "none"));
        let n = a.parentNode.querySelector("[data-radar-picker]");
        (n ||
          ((n = document.createElement("button")),
          (n.type = "button"),
          (n.className = "trbtn radar-picker-trigger"),
          (n.dataset.radarPicker = ""),
          n.setAttribute("aria-haspopup", "dialog"),
          n.addEventListener("click", H),
          a.after(n)),
          (n.textContent = z(s.TS().ws, s.TS().wss[s.TS().ws]) + " ▾"),
          u());
      }
      if (typeof render0 == "function") {
        const a = render0;
        render0 = function () {
          return (tab === "term" && P(), a.apply(this, arguments));
        };
      }
      (window.TerminalAcoes?.registrar("@radar", H, () =>
        document.body.classList.contains("trmon"),
      ),
      window.TraderUI?.onRender &&
        window.TraderUI.onRender("terminal-radar", g),
        document.addEventListener("click", (a) => {
          a.target.closest?.("[data-trmob],[data-trp]") &&
            requestAnimationFrame(u);
        }),
        addEventListener("pagehide", u),
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            u();
            return;
          }
          typeof tab < "u" &&
            tab === "term" &&
            s.layAtual().p.forEach((a, n) => s.carrega(n));
        }));
      const R = document.createElement("style");
      ((R.textContent =
        ".radar-picker{box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:80dvh;margin:auto;padding:16px;border:1px solid #3a3d42;border-radius:8px;background:#141517!important;color:#efeeeb!important;box-shadow:0 20px 80px #00000099;backdrop-filter:none!important;font:14px system-ui}.radar-picker::backdrop{background:#00000099}.radar-picker header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.radar-picker input{box-sizing:border-box;width:100%;background:#0f1011;color:#efeeeb;border:1px solid #3a3d42;border-radius:6px;padding:12px;font:16px system-ui}.radar-picker button{color:#efeeeb;background:#1f2124;border:1px solid #3a3d42;border-radius:6px;padding:8px 12px;min-height:40px;cursor:pointer;font:14px system-ui}.radar-picker-list{display:grid;gap:8px;max-height:55dvh;overflow-y:auto;margin-top:8px}.radar-picker-list button{text-align:left}.radar-picker-list button[aria-current=true]{border-color:#ac8439;background:#1d1e21}.radar-picker button:focus-visible,.radar-picker input:focus-visible{outline:2px solid #ac8439;outline-offset:2px}.radar-picker-trigger{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.radar-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}.radar-quote{display:grid;gap:4px;background:#141517;border:1px solid #2e3035;border-radius:6px;padding:12px;color:#efeeeb;min-width:0}.radar-quote strong{font-size:24px;font-variant-numeric:tabular-nums}.radar-quote small,.radar-news small{color:#a9adb5;font:11px/1.5 system-ui}.radar-news{padding:12px;border-bottom:1px solid #303030}.radar-news a{color:#efeeeb;text-decoration:none;font:14px/1.5 system-ui}.radar-news small{display:block;margin-top:4px}@media(min-width:1400px){.radar-quotes{grid-template-columns:repeat(4,minmax(0,1fr))}}"),
        document.head.append(R),
        (window.TraderRadar = {
          prepare: P,
          mount: g,
          remember: u,
          openPicker: H,
          quotes: F,
        }));
    })(),
    (function (s) {
      "use strict";
      const l = s.document,
        r = (e, i, B) => {
          const Y = l.createElement(e);
          return (
            i && (Y.className = i),
            B !== void 0 && (Y.textContent = B),
            Y
          );
        };
      function j(e) {
        return e < 12 ? "Bom dia" : e < 18 ? "Boa tarde" : "Boa noite";
      }
      function O() {
        const e = r("header", "studio-intro");
        e.id = "studio-intro";
        const i = r("div", "studio-intro-top"),
          B = r(
            "span",
            "studio-eyebrow",
            new Date().toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              weekday: "long",
              day: "2-digit",
              month: "long",
            }),
          ),
          Y = r("div", "studio-intro-tools"),
          z = r("button", "studio-tool", "Buscar");
        ((z.type = "button"),
          (z.dataset.wf = "search"),
          z.setAttribute("aria-label", "Buscar no aplicativo"));
        const M = r("button", "studio-tool", "Personalizar");
        ((M.type = "button"),
          (M.dataset.wf = "organize-home"),
          Y.append(z, M),
          i.append(B, Y));
        const E = Number(
          new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            hourCycle: "h23",
          }).format(new Date()),
        );
        return (
          e.append(
            i,
            r("p", "studio-greeting", j(E)),
            r("h1", "", "Seu processo, em foco."),
            r(
              "p",
              "studio-intro-copy",
              "Prepare o dia, acompanhe o mercado e registre suas decisões.",
            ),
          ),
          e
        );
      }
      function G() {
        const e = r("section", "studio-shortcuts");
        ((e.id = "studio-shortcuts"),
          e.setAttribute("aria-label", "Acessos rápidos"));
        for (const [i, B, Y, z] of [
          ["term", "Terminal", "Seu radar de mercado", "chart"],
          ["carteiras", "Carteiras", "Posições e patrimônio", "wallet"],
          ["estudos", "Estudos", "Seu espaço de evolução", "book"],
        ]) {
          const M = r("button", "studio-shortcut");
          ((M.type = "button"), (M.dataset.navroute = i));
          const E = r("span", "studio-shortcut-icon");
          (E.setAttribute("aria-hidden", "true"),
            typeof s.icoSvg == "function" && (E.innerHTML = s.icoSvg(z)),
            M.append(E, r("b", "", B), r("small", "", Y)),
            e.append(M));
        }
        return e;
      }
      function o(e) {
        e.querySelectorAll(
          ".pro-tabs,.pro-subtabs,.pftabs,.cqtabs,.seg:not(.hub),.rs-tabs",
        ).forEach((i) => {
          i.classList.add("studio-tabs");
          for (const B of i.querySelectorAll("button"))
            B.classList.contains("on") ||
            B.getAttribute("aria-current") === "page"
              ? B.setAttribute("aria-current", "page")
              : B.getAttribute("aria-current") === "page" &&
                B.removeAttribute("aria-current");
        });
      }
      function F() {
        const e = l.getElementById("app");
        if (!e) return;
        if (
          (l.body.classList.add("studio-design"),
          l.body.classList.toggle("studio-home", tab === "home"),
          tab === "home")
        ) {
          let B = e.querySelector("#studio-intro");
          B || ((B = O()), e.prepend(B));
          let Y = e.querySelector("#studio-shortcuts");
          Y || ((Y = G()), B.after(Y));
          const z = e.querySelector(".routine-card");
          if (z) {
            (Y.after(z), z.classList.add("studio-routine"));
            const M = z.querySelector(".routine-eyebrow");
            M && (M.textContent = "SEU PROCESSO");
            const E = z.querySelector("#routine-title");
            if (
              (E && (E.textContent = "Preparação e revisão"),
              !z.querySelector(".studio-routine-action"))
            ) {
              const u = r(
                "button",
                "btn studio-routine-action",
                "Abrir meu dia →",
              );
              ((u.type = "button"), (u.dataset.routine = "pre"), z.append(u));
            }
          }
        }
        o(e);
        const i = l.querySelector("body > nav");
        i && i.setAttribute("aria-label", "Navegação principal");
      }
      function N() {
        const e = l.getElementById("sh");
        e && o(e);
      }
      (s.TraderUI.onRender("design-profissional", F),
        s.TraderUI.onSheet("design-profissional", N),
        (s.TraderDesign = Object.freeze({ decorate: F, greeting: j })),
        F());
    })(window),
    (function (s) {
      "use strict";
      const l = [
        [["dia", "regras", "rev"], "Diário e processo"],
        [
          [
            "ops",
            "trades",
            "swing",
            "opc",
            "stats",
            "ativos",
            "dash",
            "opgrade",
            "opfluxo",
            "opcart",
            "swbt",
            "dtrpy",
          ],
          "Operações e desempenho",
        ],
        [["carteiras", "analise", "imposto"], "Patrimônio e pesquisa"],
        [["mercado", "juros", "live", "graf"], "Mercado e contexto"],
        [["estudos", "livro", "ingles", "cnpi"], "Estudos e formação"],
        [["mesa", "painel", "contratos", "carreira"], "Gestão e risco"],
        [["mais", "conta", "import", "status"], "Configurações e dados"],
      ];
      function r() {
        const j = document.getElementById("app");
        if (!j) return;
        const O = l.find(([G]) => G.includes(tab))?.[1];
        if (
          ((document.body.dataset.platformArea = O || ""),
          O &&
            tab !== "home" &&
            tab !== "term" &&
            !j.querySelector(".platform-area"))
        ) {
          const G = document.createElement("div");
          G.className = "platform-area";
          const o = document.createElement("p");
          o.textContent = "DIÁRIO DE TRADER / " + O;
          const F = document.createElement("button");
          ((F.type = "button"),
            (F.dataset.wf = "search"),
            (F.textContent = "Buscar"),
            F.setAttribute("aria-label", "Buscar no aplicativo"),
            G.append(o, F),
            j.prepend(G));
        }
        for (const G of j.querySelectorAll(
          ".pftabs,.pro-tabs,.pro-subtabs,.cqtabs,.rs-tabs,.seg:not(.hub)",
        ))
          (G.classList.add("studio-tabs"),
            G.getAttribute("aria-label") ||
              G.setAttribute(
                "aria-label",
                "Navegação - " + (O || "Aplicativo"),
              ));
        document
          .getElementById("bnav")
          ?.setAttribute("aria-label", "Navegação principal");
      }
      (s.TraderUI.onRender("plataforma-acabamento", r), r());
    })(window),
    (function (s) {
      "use strict";
      const l = {
          tx: "#2b2d32",
          mut: "#5d626b",
          bd: "#e4e2dd",
          bg: "#f8f7f6",
          ac: "#383b41",
          dk: "#17181a",
          g: "#383b41",
          r: "#bd4634",
          am: "#705624",
          bl: "#60656f",
          wh: "#ffffff",
          g2: "#eeedea",
          r2: "#fcedeb",
          am2: "#dfc79a",
          bl2: "#f2f1f0",
          cz: "#f6f5f3",
          li: "#66cc99",
          li2: "#c4c6cb",
        },
        r = {
          bg: "#0f1011",
          card: "#18191c",
          raised: "#17181a",
          line: "#2f3236",
          tx: "#f4f3f1",
          mut: "#acafb6",
          ac: "#c9a15b",
          g: "#4cc388",
          r: "#f0a094",
          am: "#cfab69",
        },
        j = (a) => typeof a == "number" && Number.isFinite(a),
        O = (a, n = 2) =>
          j(a)
            ? a.toLocaleString("pt-BR", {
                minimumFractionDigits: n,
                maximumFractionDigits: n,
              })
            : "—",
        G = (a) => (j(a) ? (a > 0 ? "+" : "") + O(a) + "%" : "—"),
        o = 'system-ui,-apple-system,"Segoe UI",Arial,sans-serif';
      function F(a) {
        const n = a.pg,
          f = a.doc.getPages();
        (f.forEach((h, Q) => {
          a.pg = h;
          const J = a.C;
          (a.rect(0, a.H - 55, a.W, 55, { fill: a.hex(l.wh) }),
            a.ln(a.M, a.H - 49, a.W - a.M, a.H - 49, {
              c: a.hex(l.bd),
              w: 0.7,
            }),
            a.t("DIÁRIO DE TRADER", a.M, a.H - 37, {
              s: 7.5,
              f: "b",
              c: a.hex(l.ac),
            }),
            a.t("Página " + (Q + 1) + " de " + f.length, a.W - a.M, a.H - 37, {
              s: 7.5,
              f: "b",
              al: "r",
              c: a.hex(l.mut),
            }));
          const v = String(a.meta?.data || "Referência não informada"),
            I =
              (a.meta?.demo
                ? "DEMONSTRAÇÃO / DADOS FICTÍCIOS · "
                : "Uso pessoal · ") + v;
          (a.t(I, a.M, a.H - 23, { s: 7, c: a.hex(l.mut), w: a.CW }),
            Q &&
              (a.rect(0, 0, a.W, 51, { fill: a.hex(l.wh) }),
              a.rect(0, 0, a.W, 4, { fill: a.hex(l.dk) }),
              a.t("DIÁRIO DE TRADER", a.M, 20, {
                s: 7.5,
                f: "b",
                c: a.hex(l.ac),
              }),
              a.t(
                a.meta?.cabecalho || a.meta?.titulo || "Relatório",
                a.M + 100,
                20,
                { s: 7.5, c: a.hex(l.mut), w: a.CW - 100 },
              ),
              a.ln(a.M, 43, a.W - a.M, 43, { c: a.hex(l.bd), w: 0.65 })));
        }),
          (a.pg = n));
      }
      function N(a, n) {
        const f = a.C,
          h = n.preco || n.rec ? 165 : 0,
          Q = a.CW - h,
          J = a.wrap(n.titulo || a.meta.titulo || "Relatório", Q, 26, "b"),
          v = a.wrap(n.sub || "", Q, 9.5),
          I = Math.max(154, 75 + J.length * 31 + v.length * 13 + 22);
        (a.rect(0, 0, a.W, I, { fill: f.dk }),
          a.rect(0, I - 3, a.W, 3, { fill: f.ac }),
          a.t("DIÁRIO DE TRADER", a.M, 25, { s: 8.5, f: "b", c: f.li }),
          a.t(n.tipo || a.meta.tipo || "ACOMPANHAMENTO", a.M, 43, {
            s: 9,
            c: f.li2,
            w: a.CW,
          }));
        let k = 73;
        for (const L of J)
          (a.t(L, a.M, k, { s: 26, f: "b", c: f.wh }), (k += 31));
        for (const L of v)
          (a.t(L, a.M, k + 5, { s: 9.5, c: f.li2 }), (k += 13));
        if (h) {
          const L = a.W - a.M;
          (n.rec &&
            a
              .wrap(n.rec, 147, 9, "b")
              .forEach(($, w) =>
                a.t($, L, 69 + w * 13, { s: 9, f: "b", al: "r", c: f.li }),
              ),
            n.preco &&
              a.t(n.preco, L, I - 64, {
                s: 20,
                f: "b",
                al: "r",
                c: f.wh,
                w: 150,
              }),
            n.precoSub &&
              a.t(n.precoSub, L, I - 39, { s: 8, al: "r", c: f.li2, w: 150 }));
        }
        (a.t(n.data || a.meta.data || "", a.W - a.M, I - 19, {
          s: 8,
          c: f.li2,
          al: "r",
          w: a.CW,
        }),
          (a.y = I + 20));
      }
      if (
        (typeof RP_COR < "u" && Object.assign(RP_COR, l),
        typeof rpNovo == "function")
      ) {
        const a = rpNovo;
        rpNovo = async function (n, f) {
          const h = await a(n, { ...f, demo: !!f?.demo || !!s.DIARIO_DEMO });
          for (const [J, v] of Object.entries(l)) h.C[J] = h.hex(v);
          ((h.F.serif = h.F.b), (h.F.serifItalic = h.F.i));
          const Q = h.doc.save.bind(h.doc);
          return (
            (h.doc.save = async function (...J) {
              return (F(h), Q(...J));
            }),
            h
          );
        };
      }
      (typeof rpCapa == "function" && (rpCapa = N),
        typeof imgdPal < "u" &&
          Object.assign(imgdPal, {
            pag: r.bg,
            card: r.card,
            esc: r.raised,
            linha: r.line,
            tx: r.tx,
            tx2: r.mut,
            g: r.g,
            r: r.r,
            am: r.am,
          }),
        typeof IMG_FOLGA < "u" && ((IMG_FOLGA.top = 64), (IMG_FOLGA.bot = 72)),
        typeof imgdTouro == "function" && (imgdTouro = function () {}));
      function e(a, n, f, h, Q = 26, J = r.tx, v = 500, I = "left", k) {
        ((a.font = v + " " + Q + "px " + o),
          (a.fillStyle = J),
          (a.textAlign = I),
          (a.textBaseline = "alphabetic"));
        let L = String(n ?? "");
        if (k && a.measureText(L).width > k) {
          const d = Array.from(L);
          for (; d.length && a.measureText(d.join("") + "…").width > k; )
            d.pop();
          L = d.join("") + "…";
        }
        a.fillText(L, f, h);
      }
      function i(a, n, f, h, Q) {
        ((a.fillStyle = r.card),
          (a.strokeStyle = r.line),
          (a.lineWidth = 2),
          a.beginPath(),
          a.roundRect(n, f, h, Q, 18),
          a.fill(),
          a.stroke());
      }
      function B(a, n, f) {
        ((a.fillStyle = r.line), a.fillRect(56, n, f - 112, 1));
      }
      function Y(a, n, f, h) {
        (e(a, "DIÁRIO DE TRADER", 56, 62, 23, r.ac, 700),
          e(a, f, 56, 124, 42, r.tx, 700, "left", n - 112),
          h && e(a, h, 56, 166, 23, r.mut, 400, "left", n - 112),
          B(a, 196, n));
      }
      function z(a, n, f, h, Q = "Registro pessoal") {
        (s.DIARIO_DEMO && (Q = "DEMONSTRAÇÃO / DADOS FICTÍCIOS"),
          B(a, f - 104, n),
          e(a, h, 56, f - 67, 20, r.mut, 400, "left", n - 112),
          e(a, "DIÁRIO DE TRADER", 56, f - 30, 19, r.ac, 650),
          e(a, Q, n - 56, f - 30, 19, r.mut, 400, "right", n - 410));
      }
      function M(a, n, f, h, Q, J = r.tx) {
        (e(a, h, 80, f, 25, r.mut),
          e(a, Q, n - 80, f, 29, J, 650, "right", n * 0.5),
          B(a, f + 26, n));
      }
      function E(a, n) {
        const f = document.createElement("canvas");
        ((f.width = a), (f.height = n));
        const h = f.getContext("2d");
        return ((h.fillStyle = r.bg), h.fillRect(0, 0, a, n), { c: f, ctx: h });
      }
      function u(a) {
        const n = a.getContext("2d"),
          f = a.width,
          h = a.__folga && typeof IMG_FOLGA < "u" ? IMG_FOLGA.top : 0,
          Q = h + 150;
        (n.save(),
          (n.fillStyle = r.bg),
          n.fillRect(0, 0, f, Q),
          e(
            n,
            s.DIARIO_DEMO
              ? "DIÁRIO DE TRADER / DADOS FICTÍCIOS"
              : "DIÁRIO DE TRADER / MERCADO",
            48,
            42,
            22,
            r.ac,
            700,
          ),
          e(n, "Panorama do mercado", 48, 96, 42, r.tx, 700));
        const J = new Date().toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        e(n, J + " · Brasília", 48, 139, 23, r.mut);
        const v = typeof MDO < "u" && MDO.v?.mercados?.pre?.vies;
        if (v) {
          const I = "Viés " + v,
            k = f - 300;
          (i(n, k, 111, 252, 43),
            e(
              n,
              I,
              k + 126,
              140,
              23,
              v === "positivo" ? r.g : v === "negativo" ? r.r : r.am,
              650,
              "center",
              224,
            ));
        }
        ((n.fillStyle = r.line), n.fillRect(48, Q - 1, f - 96, 1), n.restore());
      }
      async function P(a) {
        return new Promise((n, f) =>
          a.toBlob(
            (h) => (h ? n(h) : f(Error("Não foi possível criar a imagem."))),
            "image/png",
          ),
        );
      }
      function m(a) {
        const n = shrDados(a),
          f = (typeof SHR < "u" && SHR.modo) || "preco",
          h = shrPct(a, n, f),
          Q = j(h) ? (h >= 0 ? r.g : r.r) : r.mut,
          { c: J, ctx: v } = E(1080, 1350),
          I = String(a.dt || "")
            .replace("T", " ")
            .slice(0, 16);
        (Y(
          v,
          1080,
          "Registro da operação",
          [n.tp, n.lado, I].filter(Boolean).join(" · "),
        ),
          e(
            v,
            String(a.ativo || a.tk || "Ativo não informado"),
            56,
            282,
            48,
            r.tx,
            700,
            "left",
            968,
          ),
          e(
            v,
            n.op ? "EM ANDAMENTO · VALOR DE REFERÊNCIA" : "OPERAÇÃO ENCERRADA",
            56,
            326,
            22,
            r.mut,
            600,
          ),
          i(v, 56, 366, 968, 218),
          e(v, G(h), 80, 476, 88, Q, 700, "left", 910),
          e(
            v,
            f === "conta"
              ? "Variação sobre a conta"
              : "Variação do preço a favor da operação",
            80,
            540,
            25,
            r.mut,
          ));
        const k = (L) => {
          const d =
            typeof numN == "function"
              ? numN(L)
              : typeof L == "number"
                ? L
                : Number(String(L ?? "").replace(",", "."));
          return L != null && L !== "" && Number.isFinite(d)
            ? O(d, Math.abs(d) >= 1e4 ? 0 : 2)
            : "—";
        };
        return (
          M(v, 1080, 660, "Entrada informada", k(a.entry)),
          M(
            v,
            1080,
            750,
            n.op ? "Referência disponível" : "Saída informada",
            k(n.op ? n.px : a.exit),
          ),
          M(v, 1080, 930, "Setup", a.setup || "Não informado"),
          typeof SHR < "u" &&
            SHR.rs &&
            j(n.c?.pl) &&
            M(
              v,
              1080,
              1020,
              "Resultado financeiro",
              typeof mT == "function" ? mT(a, n.c.pl) : O(n.c.pl),
              n.c.pl >= 0 ? r.g : r.r,
            ),
          e(
            v,
            "Dados da operação registrados no diário.",
            56,
            1140,
            22,
            r.mut,
            400,
            "left",
            968,
          ),
          z(
            v,
            1080,
            1350,
            n.op
              ? "Operação aberta: valores podem mudar."
              : "Resultado individual; não representa o desempenho da conta.",
          ),
          J
        );
      }
      function c(a) {
        const { c: n, ctx: f } = E(1080, 1080);
        (Y(
          f,
          1080,
          a.tit || "Resumo do período",
          a.sub || "Período não informado",
        ),
          i(f, 56, 236, 968, 214),
          e(
            f,
            G(a.pct),
            80,
            350,
            86,
            j(a.pct) ? (a.pct >= 0 ? r.g : r.r) : r.mut,
            700,
            "left",
            910,
          ),
          e(
            f,
            "Resultado sobre o capital de referência cadastrado",
            80,
            408,
            24,
            r.mut,
            400,
            "left",
            920,
          ),
          M(
            f,
            1080,
            528,
            "Operações encerradas",
            j(a.M?.n) ? String(a.M.n) : "—",
          ),
          M(
            f,
            1080,
            620,
            "Acerto",
            j(a.M?.acerto) ? O(a.M.acerto * 100, 1) + "%" : "—",
          ));
        const h = a.best?.t?.ativo || "—";
        return (
          M(f, 1080, 804, "Melhor trade", h),
          M(
            f,
            1080,
            892,
            "Regras seguidas",
            j(a.seq) ? a.seq + " dia(s) seguidos" : "—",
          ),
          z(
            f,
            1080,
            1080,
            "Amostra pessoal do diário; registros e capital determinam o cálculo.",
          ),
          n
        );
      }
      (typeof shrGera == "function" && (shrGera = async (a) => P(m(a))),
        typeof shrGeraPer == "function" && (shrGeraPer = async (a) => P(c(a))));
      function q(a, n) {
        const f = Math.ceil(n + 124),
          h = 84;
        if (f >= a.height || f < 400) return a;
        const Q = document.createElement("canvas");
        ((Q.width = a.width), (Q.height = f));
        const J = Q.getContext("2d");
        return (
          J.drawImage(a, 0, 0, a.width, f - h, 0, 0, a.width, f - h),
          J.drawImage(a, 0, a.height - h, a.width, h, 0, f - h, a.width, h),
          Q
        );
      }
      function H(a, n = {}) {
        const f = a.internal.getNumberOfPages(),
          h = a.internal.pageSize.getWidth(),
          Q = a.internal.pageSize.getHeight();
        for (let J = 1; J <= f; J++)
          (a.setPage(J),
            a.setFillColor(255, 255, 255),
            a.rect(0, 0, h, 11, "F"),
            a.rect(0, Q - 12, h, 12, "F"),
            a.setFont("helvetica", "bold"),
            a.setFontSize(7.5),
            a.setTextColor(8, 124, 85),
            a.text("DIÁRIO DE TRADER", 14, 7),
            a.setDrawColor(216, 225, 233),
            a.line(14, 10, h - 14, 10),
            a.line(14, Q - 12, h - 14, Q - 12),
            a.setFont("helvetica", "normal"),
            a.setFontSize(7),
            a.setTextColor(83, 101, 117),
            a.text(
              s.DIARIO_DEMO
                ? "DEMONSTRAÇÃO / DADOS FICTÍCIOS"
                : "Uso pessoal - " + String(n.tt || "Relatório").slice(0, 65),
              14,
              Q - 6,
            ),
            a.text(J + " / " + f, h - 14, Q - 6, { align: "right" }));
      }
      function g(a, n) {
        if (!a?.getContext) return a;
        const f = a.width,
          h = a.height,
          { c: Q, ctx: J } = E(f, h + 174);
        return (
          J.drawImage(a, 0, 96),
          e(J, "DIÁRIO DE TRADER", 32, 37, 21, r.ac, 700),
          e(J, n, 32, 72, 26, r.tx, 650, "left", f - 64),
          (J.fillStyle = r.line),
          J.fillRect(32, 94, f - 64, 1),
          e(
            J,
            "Registro pessoal - dados e filtros da tela",
            32,
            Q.height - 35,
            20,
            r.mut,
            400,
            "left",
            f - 64,
          ),
          Q
        );
      }
      function R(a, n, f) {
        if (!a?.getContext) return a;
        const h = a.getContext("2d"),
          Q = a.width,
          v =
            (a.__folga && typeof IMG_FOLGA < "u" ? IMG_FOLGA.top : 0) +
            (n === "giro" ? 140 : 150),
          I =
            n === "ranking"
              ? "Altas e baixas da B3"
              : n === "giro"
                ? "Giro do mercado"
                : "Jornal do Pregão",
          k = f?.gerado || f?.dia,
          L = k
            ? new Date(
                /^\d{4}-\d{2}-\d{2}$/.test(k) ? k + "T12:00:00-03:00" : k,
              )
            : new Date(),
          d = Number.isFinite(L.getTime())
            ? L.toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                ...(n === "jornal"
                  ? {}
                  : { hour: "2-digit", minute: "2-digit" }),
              })
            : "não informada";
        (h.save(), (h.fillStyle = r.bg), h.fillRect(0, 0, Q, v));
        const $ = s.DIARIO_DEMO
          ? "DIÁRIO DE TRADER / DADOS FICTÍCIOS"
          : "DIÁRIO DE TRADER";
        return (
          e(h, $, 48, 45, 22, r.ac, 700),
          e(h, I, 48, 104, 42, r.tx, 700, "left", Q - 96),
          e(
            h,
            (k ? "Referência: " : "Captura: ") + d,
            48,
            150,
            23,
            r.mut,
            400,
            "left",
            Q - 96,
          ),
          (h.fillStyle = r.line),
          h.fillRect(48, v - 1, Q - 96, 1),
          h.restore(),
          a
        );
      }
      if (typeof rkDesenha == "function") {
        const a = rkDesenha;
        rkDesenha = function (n) {
          return R(a.apply(this, arguments), "ranking", n);
        };
      }
      if (typeof grDesenha == "function") {
        const a = grDesenha;
        grDesenha = function (n) {
          return R(a.apply(this, arguments), "giro", n);
        };
      }
      if (typeof jrImagem == "function") {
        const a = jrImagem;
        jrImagem = function () {
          return R(
            a.apply(this, arguments),
            "jornal",
            typeof jrVer == "function" ? jrVer() : null,
          );
        };
      }
      s.TraderExportBrand = Object.freeze({
        PDF: l,
        IMAGE: r,
        footer: F,
        cover: N,
        panoramaHeader: u,
        tradeCanvas: m,
        periodCanvas: c,
        jsPdf: H,
        frame: g,
        compactPanorama: q,
        legacyHeader: R,
      });
    })(window),
    (function (s) {
      "use strict";
      const l = s.TraderExportBrand;
      if (!l) return;
      const r = l.IMAGE,
        j = "diario-share-theme-v309",
        O = [
          ["auto", "Automático"],
          ["mercado", "Mercado"],
          ["natal", "Natal"],
          ["halloween", "Halloween"],
          ["carnaval", "Carnaval"],
          ["futebol", "Futebol"],
          ["pascoa", "Páscoa"],
          ["junina", "Festa Junina"],
          ["verao", "Verão"],
          ["reveillon", "Réveillon"],
          ["classico", "Clássico"],
        ],
        G = {
          mercado: "cards-art/mercados-brasil-eua.png",
          natal: "cards-art/natal-touro.png",
          halloween: "cards-art/halloween-touro.png",
        },
        o = {
          carnaval: [0, 0],
          futebol: [1, 0],
          pascoa: [2, 0],
          junina: [0, 1],
          verao: [1, 1],
          reveillon: [2, 1],
        };
      for (const d of Object.keys(o)) G[d] = "cards-art/colecao-sazonal.png";
      const F = new Map(),
        N = new Map(),
        e = new Set();
      let i = "auto";
      try {
        const d = APP_STORAGE.getItem(j);
        O.some(([$]) => $ === d) && (i = d);
      } catch {}
      const B = (d) => typeof d == "number" && Number.isFinite(d),
        Y = (d, $ = 2) =>
          B(d)
            ? d.toLocaleString("pt-BR", {
                minimumFractionDigits: $,
                maximumFractionDigits: $,
              })
            : "—",
        z = (d) => (B(d) ? (d > 0 ? "+" : "") + Y(d) + "%" : "—");
      function M(d) {
        const $ = d % 19,
          w = Math.floor(d / 100),
          b = d % 100,
          y = Math.floor(w / 4),
          C = w % 4,
          V = Math.floor((w + 8) / 25),
          X = Math.floor((w - V + 1) / 3),
          _ = (19 * $ + w - y - X + 15) % 30,
          K = Math.floor(b / 4),
          U = b % 4,
          te = (32 + 2 * C + 2 * K - _ - U) % 7,
          ue = Math.floor(($ + 11 * _ + 22 * te) / 451),
          ge = _ + te - 7 * ue + 114;
        return Date.UTC(d, Math.floor(ge / 31) - 1, (ge % 31) + 1);
      }
      function E(d = new Date()) {
        if (!Number.isFinite(d.getTime())) return "mercado";
        const $ = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }).formatToParts(d),
          w = (X) => Number($.find((_) => _.type === X)?.value),
          b = w("year"),
          y = w("month"),
          C = w("day"),
          V = Math.round((Date.UTC(b, y - 1, C) - M(b)) / 864e5);
        return (y === 12 && C >= 26) || (y === 1 && C <= 6)
          ? "reveillon"
          : y === 12
            ? "natal"
            : y === 10 && C >= 15
              ? "halloween"
              : V >= -51 && V <= -46
                ? "carnaval"
                : V >= -7 && V <= 0
                  ? "pascoa"
                  : y === 6
                    ? "junina"
                    : y <= 2 || (y === 3 && C <= 20)
                      ? "verao"
                      : "mercado";
      }
      const u = () => (i === "auto" ? E() : i),
        P = (d) =>
          ({
            mercado: "Mercado",
            natal: "Natal",
            halloween: "Halloween",
            carnaval: "Carnaval",
            futebol: "Futebol",
            pascoa: "Páscoa",
            junina: "Festa Junina",
            verao: "Verão",
            reveillon: "Réveillon",
            classico: "Clássico",
          })[d] || "Mercado";
      function m(d) {
        if (!O.some(([$]) => $ === d)) return !1;
        i = d;
        try {
          APP_STORAGE.setItem(j, d);
        } catch {}
        return !0;
      }
      function c(d) {
        const $ = G[d];
        if (!$) return Promise.resolve(null);
        if (F.has($)) return Promise.resolve(F.get($));
        if (N.has($)) return N.get($);
        const w = new Promise((b) => {
          const y = new Image();
          let C = !1;
          const V = (_) => {
              C ||
                ((C = !0),
                clearTimeout(X),
                _ ? (F.set($, y), e.delete($)) : e.add($),
                b(_ ? y : null));
            },
            X = setTimeout(() => V(!1), 1e4);
          ((y.onload = () => V(y.naturalWidth > 0 && y.naturalHeight > 0)),
            (y.onerror = () => V(!1)),
            (y.src = s.TraderCardArt?.[$] || $));
        }).finally(() => N.delete($));
        return (N.set($, w), w);
      }
      function q(d, $, w, b, y = 26, C = r.tx, V = 500, X = 968, _ = "left") {
        ((d.font =
          V +
          " " +
          y +
          'px system-ui,-apple-system,"Segoe UI",Arial,sans-serif'),
          (d.fillStyle = C),
          (d.textAlign = _),
          (d.textBaseline = "alphabetic"));
        let K = String($ ?? "");
        if (d.measureText(K).width > X) {
          const U = Array.from(K);
          for (; U.length && d.measureText(U.join("") + "…").width > X; )
            U.pop();
          K = U.join("") + "…";
        }
        d.fillText(K, w, b);
      }
      function H(d, $, w, b, y, C, V = 18) {
        ((d.fillStyle = C),
          d.beginPath(),
          d.roundRect($, w, b, y, V),
          d.fill());
      }
      function g(d, $) {
        ((d.fillStyle = r.bg), d.fillRect(0, 0, 1080, 1350));
        const w = F.get(G[$]);
        if (w)
          if (o[$]) {
            const [y, C] = o[$],
              V = w.naturalWidth / 3,
              X = w.naturalHeight / 2;
            d.drawImage(
              w,
              y * V + 1,
              C * X + 1,
              V - 2,
              X - 2,
              0,
              0,
              1080,
              1350,
            );
          } else
            $ === "mercado"
              ? d.drawImage(w, 0, 110, 1080, 720)
              : d.drawImage(w, 0, 0, 1080, 1350);
        const b = d.createLinearGradient(0, 0, 800, 0);
        (b.addColorStop(0, "rgba(15,16,17,0.84)"),
          b.addColorStop(0.68, "rgba(15,16,17,0.48)"),
          b.addColorStop(1, "rgba(15,16,17,0)"),
          (d.fillStyle = b),
          d.fillRect(0, 0, 1080, 1350),
          H(d, 0, 990, 1080, 360, "rgba(15,16,17,0.96)", 0));
      }
      function R() {
        const d = document.createElement("canvas");
        return (
          (d.width = 1080),
          (d.height = 1350),
          { c: d, ctx: d.getContext("2d") }
        );
      }
      function a(d, $) {
        (q(d, "DIÁRIO DE TRADER", 56, 66, 24, r.ac, 750),
          H(d, 830, 34, 194, 44, "rgba(15,16,17,0.8)", 22),
          q(d, P($), 927, 64, 21, r.tx, 650, 174, "center"));
      }
      function n(d) {
        const $ = String(d || "");
        return /^\d{4}-\d{2}-\d{2}/.test($)
          ? $.slice(8, 10) +
              "/" +
              $.slice(5, 7) +
              "/" +
              $.slice(0, 4) +
              ($.length >= 16 ? " · " + $.slice(11, 16) : "")
          : $ || "Data não informada";
      }
      function f(d, $) {
        ((d.fillStyle = r.line),
          d.fillRect(56, 1238, 968, 1),
          q(d, $, 56, 1280, 20, r.mut, 400),
          q(
            d,
            s.DIARIO_DEMO
              ? "DEMONSTRAÇÃO / DADOS FICTÍCIOS"
              : "DIÁRIO DE TRADER · Registro pessoal",
            56,
            1320,
            19,
            s.DIARIO_DEMO ? r.am : r.ac,
            650,
          ));
      }
      function h(d, $, w) {
        (H(d, 48, 838, 984, 146, "rgba(24,25,28,0.95)"),
          q(d, $[0], 74, 884, 23, r.mut),
          q(d, $[1], 74, 945, 42, r.tx, 700, 440),
          (d.fillStyle = r.line),
          d.fillRect(532, 864, 1, 96),
          q(d, w[0], 558, 884, 23, r.mut),
          q(d, w[1], 558, 945, 42, r.tx, 700, 440));
      }
      function Q(d, $ = u()) {
        const w = shrDados(d),
          b = (typeof SHR < "u" && SHR.modo) || "preco",
          y = shrPct(d, w, b),
          C = B(y) ? (y >= 0 ? r.g : r.r) : r.mut,
          { c: V, ctx: X } = R();
        (g(X, $),
          a(X, $),
          q(
            X,
            typeof SHR < "u" && SHR.at === 0
              ? "Operação registrada"
              : d.ativo || d.tk || "Ativo não informado",
            56,
            221,
            58,
            r.tx,
            750,
            700,
          ),
          q(
            X,
            [w.tp, w.lado].filter(Boolean).join(" · "),
            56,
            269,
            27,
            r.mut,
            500,
            620,
          ),
          q(
            X,
            w.op ? "EM ANDAMENTO · REFERÊNCIA" : "OPERAÇÃO ENCERRADA",
            56,
            312,
            21,
            r.mut,
            650,
            620,
          ),
          q(X, z(y), 56, 444, 98, C, 750, 710),
          q(
            X,
            b === "conta"
              ? "Variação sobre a conta"
              : "Variação do preço na operação",
            56,
            494,
            24,
            r.mut,
            500,
            550,
          ),
          typeof SHR < "u" &&
            SHR.rs &&
            B(w.c?.pl) &&
            (q(X, "Resultado financeiro", 56, 587, 23, r.mut, 500, 500),
            q(
              X,
              typeof mT == "function" ? mT(d, w.c.pl) : Y(w.c.pl),
              56,
              649,
              46,
              w.c.pl >= 0 ? r.g : r.r,
              700,
              500,
            )));
        const _ = (K) => {
          const U = typeof numN == "function" ? numN(K) : Number(K);
          return K != null && K !== "" && B(U)
            ? Y(U, Math.abs(U) >= 1e4 ? 0 : 2)
            : "—";
        };
        return (
          h(
            X,
            ["Entrada informada", _(d.entry)],
            [
              w.op ? "Referência disponível" : "Saída informada",
              _(w.op ? w.px : d.exit),
            ],
          ),
          q(X, "SETUP", 56, 1042, 20, r.mut, 650),
          q(X, d.setup || "Não informado", 56, 1090, 29, r.tx, 600),
          q(X, n(w.op ? d.dt : d.dtx || d.dt), 56, 1158, 23, r.mut, 500),
          f(
            X,
            w.op
              ? "Operação aberta: o resultado pode mudar."
              : "Resultado individual; não representa o desempenho da conta.",
          ),
          V
        );
      }
      function J(d, $ = u()) {
        const { c: w, ctx: b } = R();
        return (
          g(b, $),
          a(b, $),
          q(b, d.tit || "Meu desempenho", 56, 219, 48, r.tx, 750, 850),
          q(b, d.sub || "Período não informado", 56, 270, 27, r.mut, 500, 720),
          q(
            b,
            z(d.pct),
            56,
            444,
            98,
            B(d.pct) ? (d.pct >= 0 ? r.g : r.r) : r.mut,
            750,
            710,
          ),
          q(
            b,
            "Sobre o capital de referência cadastrado",
            56,
            494,
            24,
            r.mut,
            500,
            550,
          ),
          typeof SHR < "u" &&
            SHR.rs &&
            B(d.M?.P) &&
            (q(b, "Resultado financeiro", 56, 587, 23, r.mut, 500, 500),
            q(
              b,
              typeof money == "function" ? money(d.M.P) : Y(d.M.P),
              56,
              649,
              46,
              d.M.P >= 0 ? r.g : r.r,
              700,
              500,
            )),
          h(
            b,
            ["Operações encerradas", B(d.M?.n) ? String(d.M.n) : "—"],
            ["Acerto", B(d.M?.acerto) ? Y(d.M.acerto * 100, 1) + "%" : "—"],
          ),
          q(b, "REGRAS SEGUIDAS", 56, 1042, 20, r.mut, 650),
          q(
            b,
            B(d.seq) ? d.seq + " dia(s) seguidos" : "Não informado",
            56,
            1090,
            29,
            r.tx,
            600,
          ),
          (typeof SHR > "u" || SHR.at !== 0) &&
            d.best?.t?.ativo &&
            q(
              b,
              "Melhor operação: " + d.best.t.ativo,
              56,
              1158,
              23,
              r.mut,
              500,
            ),
          f(b, "Resultado calculado com os registros e o capital informados."),
          w
        );
      }
      function v(d) {
        const $ = d.getContext("2d"),
          w = d.width,
          b = (d.__folga && typeof IMG_FOLGA < "u" ? IMG_FOLGA.top : 0) + 150,
          y = F.get(G.mercado);
        ($.save(),
          ($.fillStyle = r.bg),
          $.fillRect(0, 0, w, b),
          y && $.drawImage(y, 0, 0, w, b));
        const C = $.createLinearGradient(0, 0, w * 0.72, 0);
        (C.addColorStop(0, "rgba(15,16,17,0.94)"),
          C.addColorStop(0.76, "rgba(15,16,17,0.6)"),
          C.addColorStop(1, "rgba(15,16,17,0)"),
          ($.fillStyle = C),
          $.fillRect(0, 0, w, b),
          q(
            $,
            s.DIARIO_DEMO
              ? "DIÁRIO DE TRADER / DADOS FICTÍCIOS"
              : "DIÁRIO DE TRADER / BRASIL + EUA",
            48,
            40,
            20,
            r.ac,
            700,
            w - 96,
          ),
          q($, "Panorama do mercado", 48, 94, 42, r.tx, 750, w * 0.65));
        const V = new Date().toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        (q($, V + " · Brasília", 48, 134, 23, r.mut, 500, w * 0.64),
          q($, "B3 · BRASIL", w - 48, 37, 17, "#eceae7", 700, 220, "right"),
          q($, "NYSE · NASDAQ", w - 48, 65, 17, "#eceae7", 650, 220, "right"));
        const X = typeof MDO < "u" && MDO.v?.mercados?.pre?.vies;
        (X &&
          (H($, 48, 157, 225, 39, "rgba(24,25,28,0.92)", 19),
          q(
            $,
            "Viés " + X,
            160,
            184,
            22,
            X === "positivo" ? r.g : X === "negativo" ? r.r : r.am,
            650,
            200,
            "center",
          )),
          ($.fillStyle = r.line),
          $.fillRect(48, b - 1, w - 96, 1),
          $.restore());
      }
      async function I(d) {
        return new Promise(($, w) =>
          d.toBlob(
            (b) => (b ? $(b) : w(Error("Falha ao criar a imagem."))),
            "image/png",
          ),
        );
      }
      if (
        (typeof shrGera == "function" &&
          (shrGera = async function (d) {
            const $ = u();
            return (await c($), I(Q(d, $)));
          }),
        typeof shrGeraPer == "function" &&
          (shrGeraPer = async function (d) {
            const $ = u();
            return (await c($), I(J(d, $)));
          }),
        typeof imgDados == "function")
      ) {
        const d = imgDados;
        imgDados = async function () {
          await Promise.all([d.apply(this, arguments), c("mercado")]);
        };
      }
      function k() {
        const d = document.querySelector("#shrov .sh");
        if (!d || d.querySelector(".season-picker")) return;
        const $ = document.createElement("section");
        (($.className = "season-picker"),
          $.setAttribute("aria-label", "Tema da imagem"));
        const w = document.createElement("b");
        ((w.textContent = "Estilo do card"), $.append(w));
        const b = document.createElement("div");
        b.className = "season-buttons";
        for (const [V, X] of O) {
          const _ = document.createElement("button");
          ((_.type = "button"),
            (_.textContent = X),
            _.setAttribute("aria-pressed", String(V === i)),
            _.addEventListener("click", async () => {
              (m(V), typeof SHR < "u" && SHR.id && (await shrAbre(SHR.id)));
            }),
            b.append(_));
        }
        $.append(b);
        const y = document.createElement("small");
        ((y.textContent =
          (i === "auto"
            ? "Agora: " +
              P(u()) +
              ". O estilo acompanha a época do ano em Brasília. Futebol é uma escolha manual."
            : "Tema escolhido: " + P(u()) + ".") +
          (e.has(G[u()])
            ? " Arte indisponível. A imagem foi montada com fundo simples."
            : "")),
          $.append(y));
        const C = d.querySelector("img");
        C ? C.before($) : d.append($);
      }
      if (typeof shrAbre == "function") {
        const d = shrAbre;
        shrAbre = async function ($) {
          (await d.apply(this, arguments),
            typeof SHR < "u" && SHR.id === $ && k());
        };
      }
      ((s.TraderExportBrand = Object.freeze({
        ...l,
        panoramaHeader: v,
        tradeCanvas: Q,
        periodCanvas: J,
      })),
        (s.TraderSeasonCards = Object.freeze({
          automatic: E,
          theme: u,
          setTheme: m,
          load: c,
          tradeCanvas: Q,
          periodCanvas: J,
          mount: k,
          paths: G,
        })));
      const L = document.createElement("style");
      ((L.textContent =
        ".season-picker{padding:16px;margin:12px 0;border:1px solid var(--bd);border-radius:8px;background:var(--card);color:var(--tx)}.season-picker>b{font-size:13px}.season-buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin:8px 0;max-height:148px;overflow-y:auto;overscroll-behavior:contain;padding:4px}.season-buttons button{min-height:40px;padding:8px 12px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--mut);font:600 12px system-ui;cursor:pointer}.season-buttons button[aria-pressed=true]{border-color:var(--ac);color:var(--ac);background:var(--surface-raised)}.season-picker small{display:block;font-size:11px;line-height:1.6;color:var(--mut)}"),
        document.head.appendChild(L),
        c("mercado"));
    })(window),
    (function () {
      "use strict";
      const s = window,
        l = document,
        r = (c) =>
          String(c ?? "").replace(
            /[&<>"']/g,
            (q) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[q],
          ),
        j = (c) =>
          String((c && c.textContent) || "")
            .replace(/\s+/g, " ")
            .trim(),
        O = (c) =>
          String(c || "")
            .replace(/[✓•·]+/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        G = (c) =>
          String(c || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        o = new Set(
          "a o os as um uma de da do das dos para por com sem sobre entre esse essa isso este esta cada como quando onde que qual quais porque entao muito mais menos voce aula cena livro mercado trader".split(
            " ",
          ),
        );
      function F(c) {
        return (
          (c = G(c)),
          /graf|candle|preco|tendencia|suporte|resistencia|volume/.test(c)
            ? ["Gráfico", "Leitura visual", "au-kind-chart"]
            : /exemplo|caso|pratico|calculo|passo/.test(c)
              ? ["Exemplo", "Aplicação prática", "au-kind-example"]
              : /risco|stop|erro|cuidado|alerta|perda|margem/.test(c)
                ? ["Alerta", "Controle de risco", "au-kind-alert"]
                : /resumo|conclus|revis|lembrar/.test(c)
                  ? ["Resumo", "Memorização", "au-kind-review"]
                  : /pergunta|teste|quiz/.test(c)
                    ? ["Quiz", "Fixação", "au-kind-quiz"]
                    : ["Conceito", "Base da aula", "au-kind-concept"]
        );
      }
      function N(c, q = 5) {
        const H = new Map();
        return (
          String(c || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9 ]/g, " ")
            .split(/\s+/)
            .forEach((g) => {
              g.length > 3 && !o.has(g) && H.set(g, (H.get(g) || 0) + 1);
            }),
          [...H.entries()]
            .sort((g, R) => R[1] - g[1])
            .slice(0, q)
            .map((g) => g[0])
        );
      }
      function e() {
        return [...l.querySelectorAll("#aupidx [data-aucena]")].map((c, q) => ({
          i: q,
          el: c,
          title: O(j(c).replace(/^\d+\s*/, "")) || "Cena " + (q + 1),
        }));
      }
      function i() {
        const c = l.querySelector("#aupprog i.at");
        return c ? [...c.parentNode.children].indexOf(c) : 0;
      }
      function B() {
        return O(j(l.getElementById("aupcap")));
      }
      function Y() {
        return O(j(l.querySelector(".aup-tt b"))) || "Aula";
      }
      function z() {
        const c = l.getElementById("aup");
        if (!c) return null;
        c.dataset.pro315 ||
          ((c.dataset.pro315 = "1"),
          c.insertAdjacentHTML(
            "beforeend",
            '<div class="au-toast" id="auToast" hidden></div>',
          ));
        const q = c.querySelector(".aup-top");
        q &&
          !l.getElementById("auProBar") &&
          q.insertAdjacentHTML(
            "afterend",
            '<div class="au-probar"><b id="auProBar"></b></div>',
          );
        const H = c.querySelector(".aup-stage"),
          g = c.querySelector(".aup-options");
        return (
          g &&
            !l.getElementById("auReviewBtn") &&
            g.insertAdjacentHTML(
              "beforeend",
              '<button id="auReviewBtn" class="au-probtn" type="button">Revisar aula</button><button id="auQuizBtn" class="au-probtn" type="button">Quiz</button>',
            ),
          c
        );
      }
      function M() {
        const c = z();
        if (!c) return;
        const q = (l.getElementById("aupct")?.textContent || "") + "|" + B();
        if (c.dataset.chrome317 === q) return;
        c.dataset.chrome317 = q;
        const H = e(),
          g = i(),
          R = Math.max(H.length, 1),
          a = B(),
          n = H[g]?.title || "Cena atual",
          f = F(n + " " + a);
        (c.classList.remove(
          "au-kind-chart",
          "au-kind-example",
          "au-kind-alert",
          "au-kind-review",
          "au-kind-quiz",
          "au-kind-concept",
        ),
          c.classList.add(f[2]));
        const h = l.getElementById("auProBar");
        h &&
          (h.style.width = Math.max(3, Math.round(((g + 1) / R) * 100)) + "%");
        const Q = l.getElementById("auKind");
        Q && (Q.textContent = f[0]);
        const J = l.getElementById("auLower");
        J &&
          ((J.querySelector("b").textContent = n),
          (J.querySelector("span").textContent = f[1]));
        const v = l.getElementById("auChapterStrip");
        (v &&
          v.dataset.count !== String(H.length) &&
          ((v.dataset.count = String(H.length)),
          (v.innerHTML = H.map(
            (k, L) =>
              `<button type="button" data-aujump="${k.i}"><b>${L + 1}</b><span>${r(k.title)}</span></button>`,
          ).join(""))),
          l
            .querySelectorAll("[data-aujump]")
            .forEach((k, L) => k.classList.toggle("on", L === g)));
        const I = l.getElementById("auBlockCard");
        if (I) {
          const k = N(n + " " + a, 4);
          g > 0 && ((g + 1) % 3 === 0 || f[0] === "Resumo" || g === R - 1)
            ? ((I.hidden = !1),
              (I.innerHTML = `<b>O que lembrar deste bloco</b><span>${r(a || n)}</span>${k.length ? `<small>${k.map(r).join(" · ")}</small>` : ""}`))
            : (I.hidden = !0);
        }
      }
      function E(c) {
        l.dispatchEvent(new Event("au-study-pause"));
        const q = e(),
          H = i(),
          g = Y() + " " + q.map((f) => f.title).join(" ") + " " + B(),
          R = N(g, 8),
          a = q.slice(0, 6);
        let n = "";
        (c === "quiz"
          ? (n = `<h2>Quiz rápido</h2><p>Responda mentalmente ou em voz alta antes de continuar a aula.</p><ol>${[`Qual é a ideia central de ${q[H]?.title || "esta cena"}?`, "Como você aplicaria esse conceito antes de uma operação real?", "Qual risco ou cuidado não pode ser ignorado aqui?"].map((h) => `<li>${r(h)}</li>`).join("")}</ol><div class="au-hint"><b>Dica:</b> procure usar suas próprias palavras, como se estivesse explicando para outro trader.</div>`)
          : (n = `<h2>Revisão da aula</h2><p class="mut">Resumo automático para fixar o conteúdo.</p><h3>Capítulos</h3><ol>${a.map((f) => `<li>${r(f.title)}</li>`).join("")}</ol><h3>Pontos-chave</h3><div class="au-tags">${(R.length ? R : ["processo", "risco", "execução"]).map((f) => `<span>${r(f)}</span>`).join("")}</div><h3>Exercício prático</h3><p>Antes da próxima aula, escolha uma operação ou gráfico e explique onde esse conceito aparece no seu processo.</p>`),
          u(),
          l.body.insertAdjacentHTML(
            "beforeend",
            `<div class="au-modal" id="auModal"><div><button type="button" class="au-close" id="auClose">×</button>${n}</div></div>`,
          ));
      }
      function u() {
        const c = l.getElementById("auModal");
        c && c.remove();
      }
      function P(c) {
        const q = l.getElementById("auToast");
        q &&
          ((q.hidden = !1),
          (q.textContent = c),
          clearTimeout(P.t),
          (P.t = setTimeout(() => {
            q.hidden = !0;
          }, 1800)));
      }
      function m() {
        if (l.getElementById("aulas-pro-v315-css")) return;
        const c = `
.au-probar{height:3px;background:rgba(255,255,255,0.13);overflow:hidden}.au-probar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#c3994c,#86abcb);transition:width .35s ease}
.au-cine{position:absolute;z-index:7;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;align-items:center;pointer-events:none;font:700 10px/1.2 system-ui;letter-spacing:.14em;color:#eae9e6;text-shadow:0 2px 8px #000000}.au-cine em{font-style:normal;border:1px solid rgba(255,255,255,0.2);background:rgba(10,10,11,0.5);border-radius:999px;padding:4px 8px;letter-spacing:.08em}.aup-stage{position:relative}.aup-stage:before,.aup-stage:after{content:"";position:absolute;left:0;right:0;height:34px;z-index:6;background:linear-gradient(#00000099,#00000000);pointer-events:none}.aup-stage:before{top:0}.aup-stage:after{bottom:0;transform:rotate(180deg)}
.au-lower{position:absolute;left:18px;right:18px;bottom:18px;z-index:8;background:linear-gradient(90deg,rgba(10,10,11,0.86),rgba(10,10,11,0.42));border:1px solid var(--ds-line-2);border-radius:8px;padding:8px 12px;color:#f8f8f7;box-shadow:0 10px 30px #00000088;pointer-events:none}.au-lower b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.au-lower span{font-size:11px;color:#c5c7cc}.au-kind-alert .au-lower{border-color:#f1a498}.au-kind-chart .au-lower{border-color:#86abcb}.au-kind-example .au-lower{border-color:var(--ds-line-2)}.au-kind-review .au-lower{border-color:var(--ds-line-2)}
.au-chapters{display:flex;gap:8px;overflow-x:auto;padding:8px 12px 4px}.au-chapters button{flex:0 0 auto;max-width:185px;border:1px solid var(--ds-line-2);background:rgba(255,255,255,0.06);color:#eae9e6;border-radius:999px;padding:8px 8px;font:600 11px/1.1 system-ui;display:flex;gap:8px;align-items:center}.au-chapters button b{background:#c3994c;color:#0a0a0b;border-radius:50%;min-width:18px;height:18px;display:grid;place-items:center}.au-chapters button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.au-chapters button.on{background:#c3994c;color:#0a0a0b;border-color:#c3994c}
.au-probtn{width:auto!important;padding:8px 8px!important;font-size:12px!important;border-radius:8px!important;border:1px solid rgba(255,255,255,0.16)!important;background:rgba(255,255,255,0.08)!important;color:#f8f8f7!important}.au-block-card{margin:8px 16px 0;border:1px solid rgba(195,153,76,0.35);background:linear-gradient(135deg,rgba(195,153,76,0.12),rgba(134,171,203,0.08));border-radius:8px;padding:8px 12px;color:#f3f2f1}.au-block-card b{display:block;margin-bottom:4px}.au-block-card span{display:block;font-size:13px}.au-block-card small{display:block;margin-top:4px;color:#bbbec4}.au-modal{position:fixed;inset:0;background:#000000bb;z-index:9999;display:grid;place-items:center;padding:16px}.au-modal>div{width:min(520px,100%);max-height:86vh;overflow:auto;background:#161719;color:#f4f3f1;border:1px solid #34363c;border-radius:8px;padding:16px;box-shadow:0 25px 90px #000000}.au-modal h2{margin:0 0 8px;font-size:20px}.au-modal h3{margin:16px 0 8px;color:#c3994c;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.au-close{float:right;border:1px solid #4c5058;background:#1e2023;color:#f4f3f1;border-radius:8px;width:36px;height:36px;font-size:24px}.au-tags{display:flex;flex-wrap:wrap;gap:8px}.au-tags span{border:1px solid #4a4e55;background:#1e2023;border-radius:999px;padding:4px 8px}.au-hint{border:1px solid #4a4e55;background:#1e2023;border-radius:8px;padding:8px;margin-top:8px}.au-toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:10000;background:#151619;color:#f4f3f1;border:1px solid #3c3f45;border-radius:999px;padding:8px 16px;box-shadow:0 10px 30px #00000088;font:600 13px system-ui}
@media(max-width:520px){.au-lower{left:10px;right:10px;bottom:10px}.au-chapters{padding-left:8px}.au-probtn{padding:8px 8px!important}.au-cine span{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
`,
          q = l.createElement("style");
        ((q.id = "aulas-pro-v315-css"),
          (q.textContent = c),
          l.head.appendChild(q));
      }
      (l.addEventListener("click", (c) => {
        const q = c.target.closest("[data-aujump]");
        if (q) {
          c.preventDefault();
          const H = l.querySelector(
            `#aupidx [data-aucena="${q.dataset.aujump}"]`,
          );
          (H && H.click(),
            P("Capítulo " + (Number(q.dataset.aujump) + 1)),
            setTimeout(M, 120));
          return;
        }
        if (c.target.closest("#auReviewBtn")) {
          (c.preventDefault(), E("review"));
          return;
        }
        if (c.target.closest("#auQuizBtn")) {
          (c.preventDefault(), E("quiz"));
          return;
        }
        (c.target.closest("#auClose") || c.target.id === "auModal") && u();
      }),
        l.addEventListener("DOMContentLoaded", () => {
          (m(), M());
        }),
        setInterval(M, 1200),
        (s.AulasPro315 = {
          update: M,
          review: () => E("review"),
          quiz: () => E("quiz"),
        }));
    })(),
    (() => {
      const s = document.createElement("style");
      ((s.textContent = `
#aup{display:flex;flex-direction:column;overflow-y:auto;background:#070708;gap:0;padding-bottom:env(safe-area-inset-bottom,0px)}
#aup .aup-top{flex:none;padding:8px 12px;gap:8px;min-height:52px}#aup .aup-x,#aup .aup-ix{width:40px;height:40px;flex:none}#aup .aup-tt{min-width:0}#aup .aup-tt b{font-size:14px}#aup .aup-tt span{font-size:11px}
#aup .aup-stage{flex:1 0 auto;min-height:180px;align-items:flex-start;cursor:pointer;padding:16px;box-sizing:border-box}#aup .aup-stage:before,#aup .aup-stage:after{display:none}#aup .aup-vis{max-height:none;overflow:visible;animation:none}#aup .au-lesson-visual{width:100%;box-sizing:border-box;max-width:900px;margin:auto}#aup .auv-h2{font-size:20px;margin:0 0 16px}#aup .auv-h{font-size:24px}#aup .auv-top li{font-size:18px;line-height:1.45;transform:none;margin-bottom:8px}#aup .auv-top li:not(.on){visibility:hidden}#aup .auv-top li .ic{width:24px;height:24px}#aup .auv-top li small{font-size:14.5px}
#aup .aup-cap{flex:none;min-height:0;font-size:14px;line-height:1.5;text-align:left;padding:8px 16px;max-height:6.5em;overflow:auto;color:#e9e7e4}#aup .aup-prog{flex:none;padding:8px 16px}
#aup .aup-ctl{flex:none;display:flex;flex-wrap:nowrap;gap:12px;justify-content:center;align-items:center;padding:8px 12px 12px}#aup .aup-ctl>button{width:44px;height:40px;min-width:44px;min-height:40px;box-sizing:border-box}#aup .aup-ctl .aup-pp{width:54px;height:54px}#aup .aup-ctl .aup-options-toggle{width:auto;aspect-ratio:auto;border-radius:8px;padding:0 12px;font-size:13px}
#aup .aup-options[hidden]{display:none!important}#aup .aup-options{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;background:#1a1b1d;border-top:1px solid #303237;flex:none;align-items:center}#aup .aup-options button,#aup .aup-options select{width:auto!important;min-height:40px!important;max-width:100%;aspect-ratio:auto;border-radius:8px!important;padding:8px 12px!important;font-size:13px!important;line-height:1.3;background:#232428;color:#f5f4f3;border:1px solid #3e4147;box-sizing:border-box}#aup .aup-options #aupvoz{max-width:100%;flex:1;min-width:180px}#aup .aup-idx{z-index:100}#aup .au-chapters,#aup .au-cine,#aup .au-lower,#aup .au-block-card{display:none!important}
@media(orientation:landscape) and (max-height:520px){#aup .aup-stage{min-height:160px}#aup .aup-cap{max-height:4em}}
`),
        document.head.appendChild(s));
    })(),
    (() => {
      const s = document.createElement("style");
      ((s.id = "au340-mobile-fix"),
        (s.textContent = `
#aup{height:100dvh;max-height:100dvh;overflow:hidden!important;display:flex;flex-direction:column;box-sizing:border-box}
#aup .aup-top{flex:0 0 auto}
#aup .aup-stage{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain;display:block!important;padding:12px 12px 8px!important}
#aup .aup-vis{max-height:none!important;overflow:visible!important;width:100%;margin:0 auto}
#aup .au-lesson-visual{display:flex;flex-direction:column;gap:8px;width:100%;margin:0 auto!important;min-height:0!important}
#aup .auv-tit{padding:4px 4px 4px;text-align:left;min-height:0!important;margin:0!important}
#aup .auv-tit .auv-h{font-size:clamp(19px,4.9vw,29px);line-height:1.18}
#aup .auyt{min-height:0!important}
#aup .au336-example{margin:4px auto 0!important;max-width:100%;padding:8px}
#aup .au336-example svg{height:auto;max-height:145px;max-width:100%;margin:8px 0}
#aup .au336-head{gap:8px;align-items:flex-start}
#aup .au336-head small{text-align:right;max-width:53%}
#aup .au337-figure{margin:4px auto!important}
#aup .aup-cap{flex:0 0 auto;max-height:65px;overflow-y:auto;font-size:13px!important;padding:4px 12px!important}
#aup .aup-prog{flex:0 0 auto;padding:8px 12px!important}
#aup .aup-ctl{flex:0 0 auto;position:relative;z-index:2;background:#070708;padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px))!important;gap:8px!important;flex-wrap:nowrap!important}
#aup .aup-ctl>button{width:39px!important;min-width:39px!important;height:40px!important;min-height:40px!important}
#aup .aup-ctl .aup-pp{width:52px!important;min-width:52px!important;height:52px!important}
#aup .aup-ctl .aup-tv-btn,#aup .aup-ctl .aup-options-toggle{width:auto!important;min-width:0!important;padding:0 8px!important;font-size:11px!important;aspect-ratio:auto!important}
#aup .aup-options:not([hidden]){flex:0 1 auto;max-height:42dvh;overflow-y:auto;overscroll-behavior:contain}
#aup .au340-resume{background:#35383d!important;color:white!important;border-color:#46c184!important;font-weight:700!important}
@media(max-width:420px){#aup .aup-stage{padding:8px 8px 4px!important}#aup .au336-example svg{max-height:118px}#aup .aup-top{padding:8px 8px}#aup .aup-ctl{gap:4px!important}#aup .aup-ctl>button{width:35px!important;min-width:35px!important;height:40px!important;min-height:40px!important}#aup .aup-ctl .aup-pp{width:48px!important;min-width:48px!important;height:48px!important}}
@media(orientation:landscape) and (max-height:520px){#aup .aup-stage{min-height:0!important}#aup .aup-cap{max-height:44px}#aup .au336-example svg{max-height:100px}}
`),
        document.head.appendChild(s));
    })(),
    (function () {
      "use strict";
      const s = (() => {
          try {
            return (
              window.matchMedia("(max-width: 767px)").matches ||
              /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(
                navigator.userAgent,
              )
            );
          } catch {
            return !1;
          }
        })(),
        l = new URL(location.href),
        r = l.searchParams.get("terminal") === "1",
        j = r && !s;
      if (r && s)
        try {
          (l.searchParams.delete("terminal"),
            history.replaceState(history.state, "", l.href));
        } catch {}
      function O() {
        if (s)
          return (
            typeof toast == "function" &&
              toast(
                "No celular, use o Terminal nesta tela. A janela independente é exclusiva do computador.",
              ),
            !1
          );
        const o = new URL(location.pathname, location.origin);
        (o.searchParams.set("terminal", "1"),
          window.DIARIO_DEMO && o.searchParams.set("demo", "1"));
        const F = window.open(
          o.href,
          "diario-terminal-desktop",
          "popup=yes,width=1440,height=900,resizable=yes,scrollbars=yes",
        );
        if (!F)
          return (
            typeof toast == "function" &&
              toast(
                "O navegador bloqueou a janela. Permita pop-ups deste site e tente novamente.",
              ),
            !1
          );
        try {
          ((F.opener = null), F.focus());
        } catch {}
        return !0;
      }
      function G() {
        const o = document.querySelector(".trbar");
        if (!o) return;
        if (s) {
          o.querySelector("[data-terminal-window]")?.remove();
          return;
        }
        if (o.querySelector("[data-terminal-window]")) return;
        const F = document.createElement("button");
        ((F.type = "button"),
          (F.className = "trbtn"),
          (F.dataset.terminalWindow = "1"),
          (F.textContent = j
            ? "Terminal independente"
            : "Abrir em nova janela"),
          (F.title = j
            ? "Esta janela mantém o Terminal aberto enquanto você usa o aplicativo principal."
            : "Abrir o Terminal sem sair desta tela"),
          (F.disabled = j),
          F.addEventListener("click", O),
          o.appendChild(F));
      }
      if (j) {
        document.documentElement.classList.add("terminal-window");
        const o = document.createElement("style");
        ((o.textContent =
          ".terminal-window #mbtn,.terminal-window #fab,.terminal-window #fabm,.terminal-window nav{display:none!important}.terminal-window #app{padding-bottom:12px!important}"),
          document.head.appendChild(o));
        const F = render;
        render = function () {
          const N = typeof SESS < "u" && !!SESS?.uid;
          tab = N || window.DIARIO_DEMO ? "term" : "conta";
          const e = F.apply(this, arguments);
          return ((document.title = "Terminal · Diário Trader"), G(), e);
        };
      }
      if (window.TraderUI) window.TraderUI.onRender("terminal-desktop-v320", G);
      else {
        const o = render;
        render = function () {
          const F = o.apply(this, arguments);
          return (G(), F);
        };
      }
      (window.addEventListener("storage", (o) => {
        if (
          (o.storageArea && o.storageArea !== localStorage) ||
          o.key !== "diario-sess" ||
          window.DIARIO_DEMO
        )
          return;
        let F = null;
        try {
          F = o.newValue ? JSON.parse(o.newValue) : null;
        } catch {
          return;
        }
        const N = (typeof SESS < "u" && SESS?.uid) || null;
        if ((F?.uid || null) !== N) {
          location.reload();
          return;
        }
        F &&
          typeof F.at == "string" &&
          typeof F.rt == "string" &&
          typeof F.exp == "number" &&
          (SESS = F);
      }),
        (window.TerminalDesktop320 = { open: O, mount: G, dedicated: j }),
        G());
    })(),
    (function () {
      "use strict";
      const s = document;
      let l = null;
      const r = () =>
          window.DIARIO_DEMO
            ? "demo"
            : (typeof SESS < "u" && SESS?.uid) || null,
        j = (g) => {
          typeof toast == "function" && toast(g);
        };
      function O(g = r()) {
        if (!g || g !== r())
          throw Error("Entre na mesma conta para alterar o Workspace.");
        return g;
      }
      const G = () => window.TRM.TS(),
        o = (g) => /^ws321_[a-z0-9_]+$/.test(g) || /^u[a-z0-9]{7,}$/.test(g),
        F = (g, R, a) =>
          Number.isFinite(g) && Number.isInteger(g) && g >= R && g <= a;
      function N(g) {
        if (!g || g.format !== "diario-terminal-workspace" || g.version !== 1)
          throw Error("Arquivo de Workspace incompatível.");
        const R = g.layout;
        if (
          !R ||
          !Array.isArray(R.p) ||
          !Array.isArray(R.g) ||
          !R.p.length ||
          R.p.length > 24 ||
          R.g.length !== R.p.length
        )
          throw Error("O Workspace deve ter de 1 a 24 painéis.");
        const a = R.p.map((f) => {
            if (
              typeof f != "string" ||
              !f.trim() ||
              f.length > 80 ||
              /[\u0000-\u001f\u007f<>]/.test(f)
            )
              throw Error("Comando de painel inválido.");
            return f.trim();
          }),
          n = R.g.map((f) => {
            if (
              !f ||
              !F(f.x, 0, 11) ||
              !F(f.y, 0, 200) ||
              !F(f.w, 1, 12) ||
              !F(f.h, 1, 200) ||
              f.x + f.w > 12
            )
              throw Error("Dimensões de painel inválidas.");
            return { x: f.x, y: f.y, w: f.w, h: f.h };
          });
        return {
          n:
            String(R.n || "Meu Workspace")
              .trim()
              .slice(0, 40) || "Meu Workspace",
          p: a,
          g: n,
        };
      }
      function e() {
        if ((O(), window.TRPOP))
          throw Error("Abra o Terminal completo para salvar um Workspace.");
        const g = window.TRM.layAtual();
        return N({
          format: "diario-terminal-workspace",
          version: 1,
          layout: { n: g.n, p: g.p, g: g.g },
        });
      }
      function i() {
        return { format: "diario-terminal-workspace", version: 1, layout: e() };
      }
      function B() {
        const g = window.TRM.TR;
        (g && ((g.foco = 0), (g.mob = 0), (g.max = -1)), save(), m(), render());
      }
      function Y(g) {
        O();
        const R = e();
        if (!String(g || "").trim()) return null;
        R.n = String(g).trim().slice(0, 40);
        const a =
            "ws321_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).slice(2, 7),
          n = G();
        return ((n.wss[a] = R), (n.ws = a), B(), a);
      }
      function z(g) {
        O();
        const R = G();
        if (!Object.hasOwn(R.wss, g)) throw Error("Workspace não encontrado.");
        ((R.ws = g), B());
      }
      function M(g) {
        O();
        const R = G();
        if (!o(R.ws))
          throw Error("Duplique o modelo padrão antes de renomear.");
        return String(g || "").trim()
          ? ((R.wss[R.ws].n = String(g).trim().slice(0, 40)), B(), !0)
          : !1;
      }
      function E() {
        O();
        const g = G(),
          R = g.ws;
        if (!o(R)) throw Error("Os modelos padrão são preservados.");
        const a = Object.keys(g.wss).find((n) => n !== R);
        if (!a) throw Error("Mantenha pelo menos um Workspace.");
        (delete g.wss[R], (g.ws = a), B());
      }
      function u(g, R = r()) {
        O(R);
        const a = N(g),
          n =
            "ws321_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).slice(2, 7),
          f = G();
        return ((f.wss[n] = a), (f.ws = n), B(), n);
      }
      async function P(g) {
        const R = O();
        if (!g) return;
        if (g.size > 65536) throw Error("O arquivo deve ter no máximo 64 KB.");
        const a = await g.text();
        if ((O(R), a.length > 65536)) throw Error("Arquivo muito grande.");
        return u(JSON.parse(a), R);
      }
      function m() {
        const g = s.getElementById("workspace321");
        if (g) {
          try {
            g.close();
          } catch {}
          g.remove();
        }
        l = null;
      }
      function c() {
        (O(), m(), (l = r()));
        const g = s.createElement("dialog");
        ((g.id = "workspace321"),
          g.setAttribute("aria-label", "Gerenciar Workspaces"),
          (g.innerHTML =
            '<form method="dialog"><button class="ws321-close" aria-label="Fechar">×</button><h2>Seus Workspaces</h2><p>Salve e recupere seus painéis de consulta.</p><select id="ws321select" aria-label="Workspace"></select><button type="button" data-ws321="restore">Abrir selecionado</button><button type="button" data-ws321="copy">Salvar cópia dos painéis atuais</button><button type="button" data-ws321="rename">Renomear atual</button><button type="button" data-ws321="delete">Excluir atual</button><hr><button type="button" data-ws321="export">Exportar layout (.json)</button><label class="ws321-upload">Importar layout<input type="file" accept=".json,application/json" id="ws321file" hidden></label><small>Exporta somente nomes, comandos e distribuição dos painéis. Modelos padrão são preservados.</small><div id="ws321error" role="status"></div></form>'));
        const R = G(),
          a = g.querySelector("select");
        for (const [n, f] of Object.entries(R.wss)) {
          const h = s.createElement("option");
          ((h.value = n),
            (h.textContent = f.n || n),
            (h.selected = n === R.ws),
            a.appendChild(h));
        }
        for (const n of ["rename", "delete"])
          g.querySelector('[data-ws321="' + n + '"]').disabled = !o(R.ws);
        s.body.appendChild(g);
        try {
          g.showModal();
        } catch {
          g.setAttribute("open", "");
        }
        g.addEventListener("close", () => {
          (g.remove(), (l = null));
        });
      }
      function q() {
        s.getElementById("workspace321") && l !== r() && m();
        const g = s.querySelector(".trbar");
        if (!g || g.querySelector("[data-ws321-open]") || window.TRPOP) return;
        const R = s.createElement("button");
        ((R.type = "button"),
          (R.className = "trbtn"),
          (R.dataset.ws321Open = "1"),
          (R.textContent = "Workspaces"),
          (R.title = "Duplicar, renomear e exportar os espaços de trabalho"),
          (R.onclick = () => {
            try {
              c();
            } catch (a) {
              j(a.message);
            }
          }),
          g.appendChild(R));
      }
      window.TerminalAcoes?.registrar(
        "@manage",
        () => {
          try {
            c();
          } catch (a) {
            j(a.message);
          }
        },
        () => s.body.classList.contains("trmon") && !window.TRPOP,
      );
      (s.addEventListener("click", (g) => {
        const R = g.target.closest("[data-ws321]");
        if (R)
          try {
            O(l);
            const a = R.dataset.ws321;
            if (
              (a === "restore" && z(s.getElementById("ws321select").value),
              a === "copy")
            ) {
              const n = prompt(
                "Nome da cópia:",
                G().wss[G().ws].n + " — cópia",
              );
              n && (O(l), Y(n));
            }
            if (a === "rename") {
              const n = prompt("Novo nome:", G().wss[G().ws].n);
              n && (O(l), M(n));
            }
            if (
              (a === "delete" &&
                confirm(
                  "Excluir este Workspace personalizado? Seus registros do diário e da carteira não serão apagados.",
                ) &&
                (O(l), E()),
              a === "export")
            ) {
              const n = JSON.stringify(i(), null, 2),
                f = URL.createObjectURL(
                  new Blob([n], { type: "application/json" }),
                ),
                h = s.createElement("a");
              ((h.href = f),
                (h.download = "terminal-workspace.json"),
                h.click(),
                setTimeout(() => URL.revokeObjectURL(f), 1e3));
            }
          } catch (a) {
            const n = s.getElementById("ws321error");
            n ? (n.textContent = a.message) : j(a.message);
          }
      }),
        s.addEventListener("change", async (g) => {
          if (g.target.id === "ws321file")
            try {
              (O(l), await P(g.target.files?.[0]));
            } catch (R) {
              const a = s.getElementById("ws321error");
              a && (a.textContent = R.message);
            }
        }));
      const H = s.createElement("style");
      ((H.textContent =
        "#workspace321{background:#191a1c;color:#f5f4f3;border:1px solid #4a4e56;border-radius:8px;padding:20px;width:min(390px,86vw);max-height:85dvh;overflow:auto;box-sizing:border-box;box-shadow:0 20px 70px #00000088}#workspace321::backdrop{background:#00000099}#workspace321 h2{margin:4px 0 8px;font-size:22px}#workspace321 p,#workspace321 small{font-size:12px;color:#b6b9c0;line-height:1.5}#workspace321 button,#workspace321 select,.ws321-upload{display:block;width:100%;box-sizing:border-box;text-align:left;min-height:40px;margin:8px 0;padding:8px 12px;border-radius:6px;border:1px solid #4b4f57;background:#25272b;color:#f5f4f3;font:inherit;font-size:13px;cursor:pointer}#workspace321 button:disabled{opacity:.4;cursor:default}#workspace321 .ws321-close{float:right;width:36px;text-align:center;margin:0;min-height:36px}#ws321error{color:#f6c5bd;font-size:13px;margin-top:8px}"),
        s.head.appendChild(H),
        window.TraderUI && window.TraderUI.onRender("workspaces-tools-v321", q),
        q(),
        (window.Workspaces321 = {
          validate: N,
          snapshot: e,
          exportData: i,
          copy: Y,
          restore: z,
          rename: M,
          remove: E,
          importData: u,
          importFile: P,
          mount: q,
        }));
    })(),
    (function () {
      "use strict";
      const s = document;
      let l = null,
        r = null,
        j = null;
      const O = () =>
          window.DIARIO_DEMO
            ? "demo"
            : (typeof SESS < "u" && SESS?.uid) || null,
        G = (H) => JSON.parse(JSON.stringify(H)),
        o = (H) => {
          typeof window.toast == "function" && window.toast(H);
        },
        F = () => {
          if (!window.TRM?.TS || !window.TRM?.TR || !window.trWsPad)
            throw Error("Terminal nao disponivel.");
          const H = O();
          if (!H) throw Error("Entre na sua conta.");
          return { uid: H, s: window.TRM.TS() };
        },
        N = () => {
          const H = window.TRM.TR;
          ((H.foco = 0), (H.mob = 0), (H.max = -1));
        },
        e = () => {
          (N(), save(), P(), render());
        },
        i = (H) => {
          try {
            H();
          } catch (g) {
            const R = s.getElementById("auto322-error");
            R ? (R.textContent = g.message) : o(g.message);
          }
        };
      function B() {
        const { uid: H, s: g } = F();
        l = { uid: H, ws: g.ws, wss: G(g.wss) };
      }
      function Y() {
        const { uid: H, s: g } = F();
        if (!l || l.uid !== H)
          throw Error("Nao ha alteracao recente para desfazer.");
        const R = { uid: H, ws: g.ws, wss: G(g.wss) };
        ((g.wss = G(l.wss)), (g.ws = l.ws), (l = R), e());
      }
      function z() {
        const { s: H } = F(),
          g = H.ws,
          R = Object.keys(M).find((f) => g === "ws321_auto_" + f);
        if (R) {
          const f = M[R],
            h = f.base
              ? G(window.trWsPad[f.base])
              : { n: f.name, p: f.panels.slice(), g: E(f.panels.length) };
          if (!h) throw Error("Modelo original nao encontrado.");
          if (!confirm("Restaurar a organizacao original de " + f.name + "?"))
            return;
          (B(), (H.wss[g] = h), (H.ws = g), e());
          return;
        }
        const a = Object.hasOwn(window.trWsPad, g) ? g : "br",
          n = window.trWsPad[a];
        if (!n) throw Error("Modelo original nao encontrado.");
        confirm(
          a === g
            ? "Restaurar o modelo original de " + n.n + "?"
            : "Abrir o modelo padrao " +
                n.n +
                "? Seu Workspace personalizado sera preservado.",
        ) && (B(), (H.wss[a] = G(n)), (H.ws = a), e());
      }
      const M = {
        pre: { name: "Pre-abertura", base: "pre" },
        live: {
          name: "Pregao brasileiro",
          panels: ["WEI", "ECO", "FX", "WIRP", "NEWS", "EVT"],
        },
        post: {
          name: "Pos-pregao",
          panels: ["JORNAL", "NEWS", "ECO", "STAT", "EVT"],
        },
      };
      function E(H) {
        const g = H <= 2 ? 1 : H <= 4 ? 2 : 3,
          R = Math.ceil(H / g),
          a = 12 / g,
          n = Math.max(6, Math.floor(26 / R));
        return Array.from({ length: H }, (f, h) => ({
          x: (h % g) * a,
          y: Math.floor(h / g) * n,
          w: a,
          h: n,
        }));
      }
      function u(H) {
        const { s: g } = F(),
          R = M[H];
        if (!R) throw Error("Modo invalido.");
        let a;
        if (R.base) {
          if (((a = G(window.trWsPad[R.base])), !a))
            throw Error("Modelo ausente.");
        } else a = { n: R.name, p: R.panels.slice(), g: E(R.panels.length) };
        const n = "ws321_auto_" + H;
        if (g.ws === n) {
          (P(), o("Ambiente " + R.name + " ja esta aberto."));
          return;
        }
        (B(),
          Object.hasOwn(g.wss, n) || (g.wss[n] = a),
          (g.ws = n),
          e(),
          o("Ambiente " + R.name + " selecionado."));
      }
      function P() {
        if (r) {
          try {
            r.close();
          } catch {}
          (r.remove(), (r = null));
        }
        j = null;
      }
      function m() {
        const { uid: H, s: g } = F();
        (P(),
          (j = H),
          (r = s.createElement("dialog")),
          (r.id = "auto322"),
          r.setAttribute("aria-label", "Organizar Terminal"),
          (r.innerHTML =
            '<div class="auto322-head"><strong>Organizar Terminal</strong><button type="button" data-auto322="close" aria-label="Fechar">×</button></div><p>Escolha um ambiente de consulta. Cada modo reutiliza seu proprio ambiente e preserva seus Workspaces personalizados.</p><div class="auto322-modes"><button type="button" data-auto322="pre">☀ Pré-abertura</button><button type="button" data-auto322="live">◉ Pregão</button><button type="button" data-auto322="post">◷ Pós-pregão</button></div><hr><button type="button" data-auto322="original">↺ Restaurar modelo original</button><button type="button" data-auto322="undo" ' +
            (!l || l.uid !== H ? "disabled" : "") +
            '>↶ Desfazer última mudança</button><small>Restaurar recupera o modelo do modo atual. Para outros Workspaces personalizados, abre Ações Brasil sem apagar suas configurações.</small><div id="auto322-error" role="status"></div>'),
          s.body.appendChild(r),
          r.addEventListener("close", () => {
            (r?.remove(), (r = null), (j = null));
          }));
        try {
          r.showModal();
        } catch {
          r.setAttribute("open", "");
        }
      }
      function c() {
        const H = s.querySelector(".trbar");
        if (!H || H.querySelector("[data-auto322-open]") || window.TRPOP)
          return;
        const g = s.createElement("button");
        ((g.type = "button"),
          (g.className = "trbtn"),
          (g.dataset.auto322Open = "1"),
          (g.textContent = "Organizar"),
          (g.title =
            "Restaurar original ou criar ambiente de pré-abertura, pregão e pós-pregão"),
          g.addEventListener("click", () => i(m)),
          H.appendChild(g));
      }
      window.TerminalAcoes?.registrar(
        "@layout",
        () => i(m),
        () => s.body.classList.contains("trmon") && !window.TRPOP,
      );
      s.addEventListener("click", (H) => {
        const g = H.target.closest("[data-auto322]");
        if (!g) return;
        const R = g.dataset.auto322;
        if (R === "close") {
          P();
          return;
        }
        i(() => {
          if (j !== O()) throw Error("Sua sessao mudou. Reabra o menu.");
          R === "undo" ? Y() : R === "original" ? z() : u(R);
        });
      });
      const q = s.createElement("style");
      ((q.textContent =
        "#auto322{width:min(460px,92vw);box-sizing:border-box;background:#191a1c;color:#f5f4f3;border:1px solid #4b4f57;border-radius:8px;padding:20px;max-height:85dvh;overflow:auto;box-shadow:0 20px 60px #00000088}#auto322::backdrop{background:#00000099}#auto322 .auto322-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:18px}#auto322 p,#auto322 small{color:#b9bcc3;line-height:1.5;font-size:12px}#auto322 button{display:block;width:100%;text-align:left;background:#292b2f;color:#f5f4f3;border:1px solid #4d5158;border-radius:6px;padding:12px;min-height:40px;margin:8px 0;cursor:pointer;font:inherit;font-size:13px}#auto322 button:disabled{opacity:.45;cursor:default}#auto322 .auto322-head button{width:38px;text-align:center;margin:0}#auto322 hr{border:0;border-top:1px solid #4b4f57;margin:16px 0}#auto322-error{color:#f6c5bd;font-size:12px;margin-top:8px}@media(max-width:767px){#auto322{width:calc(100vw - 24px);max-height:78dvh;padding:16px;border-radius:8px}#auto322 .auto322-head{font-size:16px}#auto322 button{min-height:40px;padding:8px;margin:4px 0}#auto322 hr{margin:8px 0}#auto322 p{margin:8px 0}#auto322 small{display:block;margin-top:8px}}"),
        s.head.appendChild(q),
        window.TraderUI?.onRender &&
          window.TraderUI.onRender("terminal-auto-v322", () => {
            (r && j !== O() && P(), c());
          }),
        c(),
        (window.TerminalOrganizador322 = {
          mount: c,
          apply: u,
          original: z,
          undo: Y,
          grid: E,
        }));
    })(),
    (function () {
      "use strict";
      if (window.TraderConsulta325) return;
      const s = document,
        l = { pre: "Pré-abertura", live: "Pregão", post: "Pós-pregão" },
        r = [
          ["CME_MINI:NQ1!", "Nasdaq futuro"],
          ["CME_MINI:ES1!", "S&P 500 futuro"],
          ["BMFBOVESPA:WIN1!", "WIN"],
          ["BMFBOVESPA:WDO1!", "WDO"],
          ["FX_IDC:USDBRL", "USD/BRL"],
          ["TVC:DXY", "DXY"],
          ["TVC:VIX", "VIX"],
          ["TVC:US10Y", "Treasury 10 anos"],
        ],
        j = { s: r.map((b) => b[0]) };
      let O = null,
        G = null,
        o = 0,
        F = [],
        N = {},
        e = null,
        i = null,
        B = new Set();
      const Y = () =>
          window.DIARIO_DEMO
            ? "demo"
            : (typeof SESS < "u" && SESS?.uid) || null,
        z = (b) => "dt-consulta325-" + b + "-" + Y();
      function M(b, y) {
        try {
          const C = JSON.parse(localStorage.getItem(b));
          return C === null ? y : C;
        } catch {
          return y;
        }
      }
      function E(b, y) {
        try {
          localStorage.setItem(b, JSON.stringify(y));
        } catch {}
      }
      const u = (b, y, C) => {
        const V = s.createElement(b);
        return (y !== void 0 && (V.textContent = y), C && (V.className = C), V);
      };
      function P(b, y, C) {
        const V = u("button", b, C || "c325-btn");
        return ((V.type = "button"), V.addEventListener("click", y), V);
      }
      function m() {
        if (!Y())
          throw Error("Faça login para usar as preferências personalizadas.");
        if (!window.TRM?.TS) throw Error("Terminal indisponível nesta tela.");
      }
      function c(b) {
        const y = s.querySelector("#c325-feedback");
        y
          ? ((y.textContent = b), y.setAttribute("role", "status"))
          : typeof window.toast == "function" && window.toast(b);
      }
      function q() {
        if (O) {
          const b = O;
          ((O = null), (G = null));
          try {
            b.close();
          } catch {}
          b.remove();
        }
      }
      function H(b) {
        (m(), q(), (G = Y()));
        const y = (O = u("dialog", void 0, "c325-dialog"));
        y.setAttribute("aria-label", b);
        const C = u("div", void 0, "c325-head");
        (C.append(u("strong", b), P("×", q, "c325-close")),
          y.append(C),
          y.append(
            u(
              "p",
              "Informações de consulta. Sem envio de ordens.",
              "c325-muted",
            ),
          ));
        const V = u("div", void 0, "c325-content");
        y.append(V);
        const X = u("p", "", "c325-status");
        ((X.id = "c325-feedback"),
          y.append(X),
          y.addEventListener("close", () => {
            (O === y && ((O = null), (G = null)), y.remove());
          }),
          s.body.append(y));
        try {
          y.showModal();
        } catch {
          y.setAttribute("open", "");
        }
        return V;
      }
      function g(b, y) {
        const C = u("section", void 0, "c325-section");
        return (C.append(u("h3", y)), b.append(C), C);
      }
      function R(b) {
        return new Date(b).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      function a() {
        const b = window.TRM;
        if (!b?.trGet)
          return { rows: [], status: "indisponível", timestamp: null };
        try {
          const y = b.trGet("cot", j);
          return {
            rows: y?.v?.itens || [],
            status: y.err
              ? "falha na fonte"
              : y.v
                ? Date.now() - Number(y.ts || 0) > 12e4
                  ? "consulta antiga"
                  : "consulta em cache"
                : "aguardando fonte",
            timestamp: y.v?.em || null,
            error: y.err || null,
          };
        } catch {
          return { rows: [], status: "sem leitura", timestamp: null };
        }
      }
      function n(b) {
        return b
          ? b.atraso === !0
            ? "com atraso"
            : b.atraso === !1
              ? "tempo real declarado pela fonte"
              : "atraso não confirmado"
          : "sem cotação";
      }
      function f(b) {
        return typeof b == "number" && Number.isFinite(b)
          ? b.toLocaleString("pt-BR", { maximumFractionDigits: 4 })
          : "—";
      }
      function h(b) {
        const { rows: y, status: C, timestamp: V, error: X } = a();
        (b.append(
          u(
            "p",
            "Estado da consulta: " + C + (V ? " · " + R(V) : "") + ".",
            "c325-muted",
          ),
        ),
          X &&
            b.append(
              u("p", "Fonte: " + String(X).slice(0, 160), "c325-muted"),
            ));
        const _ = u("div", void 0, "c325-rows");
        for (const [K, U] of r) {
          const te = y.find((ae) => ae.pedido === K || ae.s === K),
            ue = u("div", void 0, "c325-row"),
            ge = u("span", U),
            oe = u("strong", f(te?.px)),
            ee = u(
              "small",
              te
                ? String(te.fonte || "Fonte não informada") + " · " + n(te)
                : "sem informação",
            );
          (ue.append(ge, oe, ee), _.append(ue));
        }
        return (
          b.append(_),
          b.append(
            u(
              "p",
              "Preço, horário e atraso dependem dos provedores existentes. Não presuma tempo real quando o atraso não for confirmado.",
              "c325-muted",
            ),
          ),
          y
        );
      }
      function Q() {
        const b = new Date(),
          y = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Sao_Paulo",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: !1,
          }).formatToParts(b),
          C = (_) => y.find((K) => K.type === _)?.value,
          V = C("weekday"),
          X = Number(C("hour")) * 60 + Number(C("minute"));
        return ["Sat", "Sun"].includes(V)
          ? {
              mode: "post",
              reason: "Fim de semana · conferir calendário oficial de pregão",
            }
          : X < 540
            ? { mode: "pre", reason: "Horário de Brasília, regra indicativa" }
            : X < 1080
              ? {
                  mode: "live",
                  reason: "Horário de Brasília, regra indicativa",
                }
              : {
                  mode: "post",
                  reason: "Horário de Brasília, regra indicativa",
                };
      }
      function J(b) {
        const y = Q(),
          C = M(z("pref"), { confirm: !0 });
        (b.append(
          u(
            "p",
            "Sugestão: " + l[y.mode] + " · " + y.reason + ".",
            "c325-muted",
          ),
        ),
          b.append(
            u(
              "p",
              "Feriados, horários especiais da B3 e mudanças nas sessões dos EUA não são verificados automaticamente aqui.",
              "c325-muted",
            ),
          ));
        for (const [_, K] of Object.entries(l))
          b.append(
            P("Abrir " + K, () => {
              if (G !== Y()) return c("Sessão alterada.");
              if (
                !(
                  C.confirm &&
                  !confirm(
                    "Abrir ambiente " +
                      K +
                      "? O Workspace atual será preservado.",
                  )
                )
              )
                try {
                  (window.TerminalOrganizador322.apply(_), q());
                } catch (U) {
                  c(U.message);
                }
            }),
          );
        const V = u("label", void 0, "c325-check"),
          X = s.createElement("input");
        ((X.type = "checkbox"),
          (X.checked = C.confirm),
          X.addEventListener("change", () =>
            E(z("pref"), { confirm: X.checked }),
          ),
          V.append(X, u("span", "Confirmar antes de trocar o Workspace")),
          b.append(V));
      }
      function v(b, y, C) {
        if (!Y()) return;
        const V = {
            id: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
            stamp: C || Date.now(),
            label: String(b).slice(0, 90),
            details: String(y).slice(0, 180),
          },
          X = M(z("events"), []);
        X.some(
          (_) => _.label === V.label && Math.abs(_.stamp - V.stamp) < 18e4,
        ) || (X.push(V), E(z("events"), X.slice(-100)));
      }
      function I(b) {
        const y = M(z("events"), []);
        if (
          (b.append(
            u(
              "p",
              "Histórico local dos eventos registrados neste dispositivo. Não é um histórico completo das cotações ou das notícias.",
              "c325-muted",
            ),
          ),
          !y.length)
        )
          b.append(u("p", "Sem eventos registrados."));
        else
          for (const C of y.slice(-25).reverse()) {
            const V = u("p", void 0, "c325-event");
            (V.append(
              u("b", R(C.stamp) + " · " + C.label),
              u("small", C.details),
            ),
              b.append(V));
          }
        (b.append(
          P("Registrar observação do mercado", () => {
            const C = prompt(
              "Descreva o evento que você observou (não informe senhas ou dados pessoais):",
            );
            C?.trim() && (v("Observação manual", C.trim()), d("timeline"));
          }),
        ),
          b.append(
            P("Limpar histórico local", () => {
              confirm(
                "Apagar apenas o histórico local desta central? Seus Workspaces e Diário não serão afetados.",
              ) && (E(z("events"), []), d("timeline"));
            }),
          ));
      }
      function k(b) {
        const y = M(z("lastSeen"), 0),
          C = M(z("events"), []).filter((V) => V.stamp > y);
        (b.append(
          u(
            "p",
            y
              ? "Última consulta desta central: " + R(y)
              : "Primeira consulta neste dispositivo.",
            "c325-muted",
          ),
        ),
          b.append(
            u(
              "p",
              C.length + " evento(s) registrados desde a última consulta.",
            ),
          ));
        for (const V of C.slice(-10).reverse())
          b.append(
            u(
              "p",
              R(V.stamp) + " · " + V.label + " — " + V.details,
              "c325-event",
            ),
          );
        b.append(
          P("Marcar como lido", () => {
            (E(z("lastSeen"), Date.now()), d("since"));
          }),
        );
      }
      function L(b) {
        b.append(
          u(
            "p",
            "Contexto observável a partir das fontes já conectadas. Não é explicação causal nem recomendação de operação.",
            "c325-muted",
          ),
        );
        const y = h(b),
          C = r
            .map(([V, X]) => ({
              label: X,
              q: y.find((_) => _.pedido === V || _.s === V),
            }))
            .filter((V) => Number.isFinite(V.q?.d1));
        if (C.length) {
          b.append(u("h3", "Variações informadas pelas fontes"));
          for (const V of C)
            b.append(
              u(
                "p",
                V.label +
                  ": " +
                  (V.q.d1 > 0 ? "+" : "") +
                  f(V.q.d1) +
                  "% · " +
                  n(V.q),
                "c325-event",
              ),
            );
        }
        b.append(
          u(
            "p",
            "Notícias e agenda continuam nos painéis já existentes (NEWSBR, NEWSUS e EVT). Esta visão não duplica esses feeds.",
            "c325-muted",
          ),
        );
      }
      function d(b = "home") {
        const y = H(
          {
            home: "Central de Consulta",
            quality: "Qualidade das cotações",
            sessions: "Ambientes por sessão",
            timeline: "Linha do tempo",
            since: "Desde a última consulta",
            context: "O que move o mercado?",
          }[b] || "Central de Consulta",
        );
        if (b === "home") {
          y.append(
            u(
              "p",
              "Acesso único a recursos complementares; não cria novos feeds nem duplica os painéis existentes.",
              "c325-muted",
            ),
          );
          for (const [C, V] of [
            ["sessions", "Organizar por sessão"],
            ["quality", "Qualidade das cotações"],
            ["context", "O que move o mercado?"],
            ["timeline", "Linha do tempo local"],
            ["since", "Desde a última consulta"],
          ])
            y.append(P(V, () => d(C)));
          return;
        }
        (y.append(P("← Voltar à central", () => d("home"))),
          b === "sessions" && J(y),
          b === "quality" && h(y),
          b === "context" && L(y),
          b === "timeline" && I(y),
          b === "since" && k(y));
      }
      function $() {
        const b = s.querySelector(".trbar");
        if (!b || b.querySelector("[data-consulta325]") || window.TRPOP) return;
        const y = P(
          "Consulta +",
          () => {
            try {
              d();
            } catch (C) {
              c(C.message);
            }
          },
          "trbtn",
        );
        ((y.dataset.consulta325 = "1"),
          (y.title = "Qualidade dos dados, contexto, histórico e ambientes"),
          b.append(y));
      }
      const w = u("style");
      ((w.textContent =
        ".c325-dialog{box-sizing:border-box;width:min(490px,calc(100vw - 22px));max-height:78dvh;overflow:auto;margin:auto;padding:16px;border:1px solid #51555d;border-radius:8px;background:#191a1c;color:#f3f2f1;font:14px/1.5 system-ui;box-shadow:0 18px 70px #00000099}.c325-dialog::backdrop{background:#00000099}.c325-head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:18px}.c325-close{border:1px solid #5c6069;border-radius:6px;background:#2d2f34;color:white;padding:8px 12px;cursor:pointer}.c325-btn{display:block;width:100%;text-align:left;background:#2e3034;color:#f6f6f5;border:1px solid #5b5f68;border-radius:6px;padding:8px 12px;min-height:42px;margin:8px 0;cursor:pointer;font:inherit}.c325-btn:focus-visible,.c325-close:focus-visible{outline:2px solid #c29647}.c325-muted{color:#b4b7be;font-size:12px}.c325-status{color:#dbbf8c;font-size:12px}.c325-section{margin:12px 0}.c325-row{display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:8px 0;border-bottom:1px solid #3d4046}.c325-row small{grid-column:1/-1;color:#b2b5bc}.c325-event{border-bottom:1px solid #383b41;padding:8px 0;font-size:12px}.c325-event small{display:block;color:#b2b5bc}.c325-check{display:flex;align-items:center;gap:8px;padding:8px 0}.c325-check input{width:18px;height:18px}@media(max-width:767px){.c325-dialog{max-height:75dvh;padding:12px}.c325-btn{min-height:38px;padding:8px 12px;margin:4px 0}}"),
        s.head.append(w),
        window.TraderUI?.onRender &&
          window.TraderUI.onRender("terminal-consulta-v325", () => {
            (O && G !== Y() && q(), $());
          }),
        $(),
        (window.TraderConsulta325 = {
          mount: $,
          open: d,
          getQuotes: a,
          quality: n,
          currentMode: Q,
          appendEvent: v,
        }));
    })(),
    (function () {
      "use strict";
      if (window.TraderCommand326) return;
      const s = document,
        l = "dt-commander326-";
      let r = null,
        j = null,
        O = "",
        G = null;
      const o = () =>
          window.DIARIO_DEMO
            ? "demo"
            : typeof SESS < "u" && SESS?.uid
              ? String(SESS.uid)
              : null,
        F = (n) => l + (o() || "anonymous") + "-" + n,
        N = (n, f) => {
          try {
            let h = JSON.parse(localStorage.getItem(F(n)));
            return h === null ? f : h;
          } catch {
            return f;
          }
        },
        e = (n, f) => {
          if (o())
            try {
              localStorage.setItem(F(n), JSON.stringify(f));
            } catch {}
        },
        i = (n, f, h) => {
          const Q = s.createElement(n);
          return (
            f !== void 0 && (Q.textContent = f),
            h && (Q.className = h),
            Q
          );
        },
        B = (n, f, h = "tc326-btn") => {
          const Q = i("button", n, h);
          return ((Q.type = "button"), Q.addEventListener("click", f), Q);
        };
      function Y() {
        if (!r) return;
        const n = r;
        ((r = null), (j = null));
        try {
          n.close();
        } catch {}
        n.remove();
      }
      function z(n) {
        if (!o()) return null;
        (Y(), (j = o()));
        const f = (r = i("dialog", void 0, "tc326-modal")),
          h = i("header", void 0, "tc326-head");
        (h.append(i("b", n), B("✕", Y, "tc326-close")), f.append(h));
        const Q = i("div", void 0, "tc326-body");
        (f.append(Q),
          f.addEventListener("close", () => {
            (r === f && ((r = null), (j = null)), f.remove());
          }),
          s.body.append(f));
        try {
          f.showModal();
        } catch {
          f.setAttribute("open", "");
        }
        return Q;
      }
      const M = [
        [
          "planner328",
          "Planejar Pré-Mercado · Global, WIN, WDO",
          "layout",
          () => window.TraderPre328?.open(),
        ],
        [
          "brief328",
          "Briefing de consulta · Pré-Mercado",
          "file",
          () => window.TraderPre328?.briefing(),
        ],
        [
          "observer328",
          "Observador de mudanças nas cotações",
          "activity",
          () => window.TraderObservador328?.settings(),
        ],
        [
          "sessions",
          "Sessões · Pré, Pregão, Pós",
          "clock",
          () => window.TraderConsulta325?.open("sessions"),
        ],
        [
          "organize",
          "Restaurar e desfazer layout",
          "rotate",
          () => s.querySelector("[data-auto322-open]")?.click(),
        ],
        [
          "workspaces",
          "Gerenciar Workspaces",
          "grid",
          () => s.querySelector("[data-ws321-open]")?.click(),
        ],
        [
          "quality",
          "Qualidade das cotações",
          "pulse",
          () => window.TraderConsulta325?.open("quality"),
        ],
        [
          "context",
          "Contexto Brasil / EUA",
          "globe",
          () => window.TraderConsulta325?.open("context"),
        ],
        [
          "timeline",
          "Linha do tempo de observações",
          "history",
          () => window.TraderConsulta325?.open("timeline"),
        ],
        [
          "since",
          "Desde a última consulta",
          "bookmark",
          () => window.TraderConsulta325?.open("since"),
        ],
        ["notices", "Radar de atenção", "bell", () => c()],
        ["prefs", "Preferências de automação", "settings", () => q()],
        [
          "focus",
          "Alternar Modo Foco (desktop)",
          "monitor",
          () => window.TraderVisual327?.toggleFocus(),
        ],
        [
          "density",
          "Alternar densidade compacta (desktop)",
          "layout",
          () => window.TraderVisual327?.toggleDensity(),
        ],
        [
          "window",
          "Terminal em nova janela (PC)",
          "window",
          () =>
            s.querySelector("[data-terminal-window]:not(:disabled)")?.click(),
        ],
      ];
      function E(n) {
        if (
          (Y(),
          !(
            n[0] === "window" &&
            !s.querySelector("[data-terminal-window]:not(:disabled)")
          ))
        )
          try {
            n[3]();
          } catch (f) {
            typeof window.toast == "function" &&
              window.toast("Comando indisponível: " + f.message);
          }
      }
      function u() {
        const n = z("Comandos · Terminal");
        if (!n) return;
        if (
          (n.append(
            i(
              "p",
              "CONSULTA DE MERCADO  ·  SEM EXECUÇÃO DE ORDENS",
              "tc326-overline",
            ),
          ),
          N("prefs", { showSuggestion: !0 }).showSuggestion !== !1)
        ) {
          const v = m(),
            I = { pre: "Pré-Abertura", live: "Pregão", post: "Pós-Pregão" },
            k = i("div", void 0, "tc326-suggestion");
          (k.append(
            i(
              "span",
              "Sessão sugerida: " +
                (I[v.mode] || "Consulta") +
                " · regra indicativa",
            ),
          ),
            k.append(B("Ver ambientes", () => E(M[0]), "tc326-mini")),
            n.append(k));
        }
        const h = i("input", void 0, "tc326-search");
        ((h.type = "search"),
          (h.placeholder = "Pesquisar comandos, janelas ou dados…"),
          h.setAttribute("aria-label", "Pesquisar comandos do Terminal"),
          n.append(h));
        const Q = i("div", void 0, "tc326-list");
        n.append(Q);
        function J() {
          Q.replaceChildren();
          const v = h.value.trim().toLocaleLowerCase("pt-BR"),
            I = M.filter((k) => k[1].toLocaleLowerCase("pt-BR").includes(v));
          if (!I.length) {
            Q.append(i("p", "Nenhum comando encontrado.", "tc326-muted"));
            return;
          }
          for (const k of I)
            (k[0] === "window" && matchMedia("(max-width:767px)").matches) ||
              Q.append(B(k[1], () => E(k)));
        }
        (h.addEventListener("input", J),
          h.addEventListener("keydown", (v) => {
            if (v.key === "Enter") {
              const I = M.find((k) =>
                k[1]
                  .toLocaleLowerCase("pt-BR")
                  .includes(h.value.trim().toLocaleLowerCase("pt-BR")),
              );
              I && (v.preventDefault(), E(I));
            }
          }),
          J(),
          matchMedia("(min-width:768px)").matches && h.focus());
      }
      function P() {
        const f = window.TraderConsulta325?.getQuotes?.() || {
            rows: [],
            status: "não disponível",
          },
          h = f.rows || [],
          Q = h.filter((I) => !Number.isFinite(Number(I.px))).length,
          J = h.filter((I) => I.atraso === !0).length,
          v = h.filter((I) => I.atraso !== !0 && I.atraso !== !1).length;
        return {
          state: f.status || "indisponível",
          count: h.length,
          unavailable: Q,
          delayed: J,
          unknown: v,
          rows: h,
          stamp: f.timestamp,
        };
      }
      function m() {
        try {
          return (
            window.TraderConsulta325?.currentMode?.() || {
              mode: "pre",
              reason: "Indisponível",
            }
          );
        } catch {
          return { mode: "pre", reason: "Indisponível" };
        }
      }
      function c() {
        const n = z("Radar de atenção");
        if (!n) return;
        const f = P(),
          h = { pre: "Pré-abertura", live: "Pregão", post: "Pós-pregão" }[
            m().mode
          ];
        n.append(
          i(
            "p",
            "SESSÃO SUGERIDA · " + h + " (regra de horário indicativa)",
            "tc326-overline",
          ),
        );
        const Q = i("div", void 0, "tc326-cards");
        for (const [v, I] of [
          ["Fonte", f.state],
          ["Ativos recebidos", String(f.count)],
          ["Atraso declarado", String(f.delayed)],
          ["Sem preço", String(f.unavailable)],
        ]) {
          const k = i("div", void 0, "tc326-card");
          (k.append(i("small", v), i("strong", I)), Q.append(k));
        }
        n.append(Q);
        const J = [];
        (f.count === 0 &&
          J.push(
            "Sem cotações no cache consultado. Confira os provedores no painel de qualidade.",
          ),
          f.delayed &&
            J.push(
              f.delayed + " cotação(ões) com atraso informado pela fonte.",
            ),
          f.unknown &&
            J.push(
              f.unknown + " cotação(ões) sem confirmação do regime de atraso.",
            ),
          String(f.state).includes("antiga") &&
            J.push("Consulta antiga. Não interprete como preço ao vivo."),
          J.length ||
            J.push(
              "Nenhum alerta de qualidade identificável no cache atual. Isso não garante tempo real.",
            ));
        for (const v of J) n.append(i("p", "• " + v, "tc326-msg"));
        (n.append(
          i(
            "p",
            "Atenção: não há monitoramento confiável de notícias ou calendário oficial nesta função. Não deduz operações a partir das variações.",
            "tc326-muted",
          ),
        ),
          n.append(
            B("Ver fontes e preços", () => {
              (Y(), window.TraderConsulta325?.open("quality"));
            }),
          ));
      }
      function q() {
        const n = z("Preferências · Terminal");
        if (!n) return;
        const f = N("prefs", {
            showSuggestion: !0,
            monitorData: !1,
            notifyDelay: !0,
          }),
          h = i(
            "p",
            "A organização automática não altera o Workspace sem sua confirmação. Horários são indicativos; feriados e sessões especiais não são validados.",
            "tc326-muted",
          );
        n.append(h);
        for (const [Q, J, v] of [
          [
            "showSuggestion",
            "Sugerir sessão ao abrir",
            "Exibe Pré-Abertura, Pregão ou Pós-Pregão, sem alterar janelas",
          ],
          [
            "monitorData",
            "Monitorar qualidade das cotações",
            "Analisa o cache existente a cada 90 segundos, apenas com o aplicativo aberto",
          ],
          [
            "notifyDelay",
            "Avisar sobre atraso declarado",
            "Só avisa quando o cache informar atraso ou falta de dados",
          ],
        ]) {
          const I = i("label", void 0, "tc326-setting"),
            k = i("input");
          ((k.type = "checkbox"),
            (k.checked = !!f[Q]),
            k.addEventListener("change", () => {
              ((f[Q] = k.checked), e("prefs", f), H());
            }));
          const L = i("span");
          (L.append(i("b", J), i("small", v)), I.append(k, L), n.append(I));
        }
        n.append(
          B("Abrir sessões", () => {
            (Y(), window.TraderConsulta325?.open("sessions"));
          }),
        );
      }
      function H() {
        (G && (clearInterval(G), (G = null)),
          !(!N("prefs", {}).monitorData || !o()) &&
            (G = setInterval(() => {
              if (!o() || s.hidden) return;
              const n = P();
              let f = [n.state, n.delayed, n.unavailable, n.count].join("|");
              if (
                f !== O &&
                ((O = f),
                n.count === 0 ||
                  n.delayed > 0 ||
                  (n.count && n.unavailable > 0))
              ) {
                const h = s.querySelector("[data-tc326-status]");
                (h &&
                  ((h.textContent = "● Checar dados"),
                  (h.title = "Cotações indisponíveis ou com atraso informado"),
                  h.classList.add("tc326-warning")),
                  N("prefs", {}).notifyDelay &&
                    typeof window.toast == "function" &&
                    window.toast(
                      "Terminal: verifique a qualidade das cotações.",
                    ));
              }
            }, 9e4)));
      }
      function g() {
        const n = s.querySelector(".trbar");
        if (!(!n || window.TRPOP || !o())) {
          if (!n.querySelector("[data-tc326-menu]")) {
            const h = B("⌕ Comandos", u, "trbtn tc326-trigger");
            ((h.dataset.tc326Menu = "1"),
              (h.title = "Abrir comandos de consulta (Ctrl+K no PC)"),
              n.append(h));
          }
          if (!n.querySelector("[data-tc326-status]")) {
            const h = B("● Dados", c, "trbtn tc326-status");
            ((h.dataset.tc326Status = "1"),
              (h.title = "Ver qualidade das fontes"),
              n.append(h));
          }
          n.classList.add("tc326-ready");
        }
      }
      (s.addEventListener("keydown", (n) => {
        ((n.ctrlKey || n.metaKey) &&
          n.key.toLowerCase() === "k" &&
          s.querySelector(".trbar") &&
          !window.TRPOP &&
          (n.preventDefault(), u()),
          n.key === "Escape" && r && Y());
      }),
        s.addEventListener("visibilitychange", () => {
          !s.hidden && o() && g();
        }),
        window.TraderUI?.onRender &&
          window.TraderUI.onRender("terminal-commands-v326", () => {
            (r && j !== o() && Y(), g());
          }),
        new MutationObserver(() => {
          s.querySelector(".trbar") &&
            !s.querySelector("[data-tc326-menu]") &&
            g();
        }).observe(s.body, { childList: !0, subtree: !0 }));
      const a = i("style");
      ((a.textContent = `
.tc326-ready [data-consulta325],.tc326-ready [data-auto322-open],.tc326-ready [data-ws321-open]{display:none!important}
.tc326-trigger{border-color:var(--ds-line-2)!important;background:#3a2f1a!important;color:#dfc79a!important;font-weight:700!important}
.tc326-status{border-color:#43474d!important;color:#d4b57d!important;font-size:12px!important}
.tc326-warning{color:#dfc79a!important;border-color:var(--ds-line-2)!important}
.tc326-modal{box-sizing:border-box;border:1px solid #4a4e56;background:#0f1012;color:#eeedea;border-radius:8px;padding:0;width:min(530px,calc(100vw - 18px));max-height:83dvh;overflow:auto;box-shadow:0 25px 85px #000000cc;font:13px/1.45 system-ui}
.tc326-modal::backdrop{background:#000000aa}
.tc326-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;background:#18191c;border-bottom:1px solid #36383e;padding:12px 16px;z-index:1;letter-spacing:.2px}
.tc326-close{cursor:pointer;border:1px solid #3a3d43;background:#25272b;color:#e8e6e3;padding:8px 8px;border-radius:6px}
.tc326-body{padding:16px 16px 16px}
.tc326-overline{color:#cea862;letter-spacing:1.1px;text-transform:uppercase;font-size:10px;font-weight:700}
.tc326-search{display:block;box-sizing:border-box;background:#1d1f22;border:1px solid #565a63;color:#ffffff;border-radius:6px;width:100%;padding:12px;outline-offset:2px;font:inherit}
.tc326-list{display:grid;grid-template-columns:1fr;gap:4px;margin-top:12px}
.tc326-btn{width:100%;cursor:pointer;text-align:left;background:#1f2124;color:#eeedea;border:1px solid #3b3e44;padding:8px 12px;border-radius:6px;font:inherit;min-height:40px}
.tc326-btn:hover,.tc326-btn:focus-visible{background:#33363b;outline:1px solid #bb944c}
.tc326-suggestion{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#232528;border:1px solid #474a51;border-radius:6px;padding:8px;margin:8px 0;color:#e8e6e2;font-size:12px}.tc326-mini{background:#3b311e;color:#dfc79a;border:1px solid var(--ds-line-2);border-radius:6px;padding:8px 8px;cursor:pointer;flex:none}.tc326-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
.tc326-card{display:flex;flex-direction:column;gap:4px;background:#1d1f22;border:1px solid #393c41;border-radius:6px;padding:24px;min-width:0}
.tc326-card small{color:#999ea7}.tc326-card strong{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.tc326-muted{font-size:12px;color:#999ea7;line-height:1.5}
.tc326-msg{background:#212327;border-left:1px solid var(--ds-line-2);padding:8px 8px;font-size:12px}
.tc326-setting{display:flex;gap:12px;align-items:flex-start;border-bottom:1px solid #2f3136;padding:12px 0;cursor:pointer}
.tc326-setting input{width:18px;height:18px;flex:none;accent-color:#cea862}.tc326-setting span{display:grid;gap:4px}.tc326-setting small{color:#9ea2aa;font-size:11px}
@media(max-width:767px){.tc326-modal{max-height:78dvh}.tc326-body{padding:12px}.tc326-head{padding:8px 12px}.tc326-trigger{font-size:12px!important}}
`),
        s.head.append(a),
        g(),
        H(),
        (window.TraderCommand326 = {
          mount: g,
          palette: u,
          radar: c,
          settings: q,
          sourceStatus: P,
          sessionInfo: m,
        }));
    })(),
    (function () {
      "use strict";
      const s = document,
        l = () => window.matchMedia("(min-width: 900px)").matches,
        r = () => s.body.classList.contains("trmon"),
        j = () =>
          window.DIARIO_DEMO
            ? "demo"
            : typeof SESS < "u" && SESS?.uid
              ? SESS.uid
              : null,
        O = (z) => "terminal-v327-" + String(j() || "anonymous") + "-" + z;
      let G = null;
      function o(z) {
        try {
          return localStorage.getItem(O(z)) === "1";
        } catch {
          return !1;
        }
      }
      function F(z, M) {
        try {
          localStorage.setItem(O(z), M ? "1" : "0");
        } catch {}
      }
      function N() {
        const z = l() && r() && !!j();
        (s.body.classList.toggle("tr327-focus", z && o("focus")),
          s.body.classList.toggle("tr327-dense", z && o("dense")));
        const M = s.querySelector("[data-tr327-focus]");
        M &&
          (M.setAttribute(
            "aria-pressed",
            String(s.body.classList.contains("tr327-focus")),
          ),
          (M.textContent = s.body.classList.contains("tr327-focus")
            ? "◧ Sair do foco"
            : "◩ Modo Foco"));
      }
      function e(z) {
        return !l() || !r() || !j() ? !1 : (F(z, !o(z)), N(), !0);
      }
      function i() {
        const z = s.querySelector(".trbar");
        if (!z || !l() || !j() || window.TRPOP) {
          N();
          return;
        }
        if (!z.querySelector("[data-tr327-focus]")) {
          const M = s.createElement("button");
          ((M.type = "button"),
            (M.className = "trbtn tr327-focus-btn"),
            (M.dataset.tr327Focus = "1"),
            (M.title = "Ocultar elementos secundários do Terminal (Shift+F)"),
            M.addEventListener("click", () => e("focus")),
            z.append(M));
        }
        N();
      }
      (s.addEventListener("keydown", (z) => {
        if (
          !z.shiftKey ||
          z.ctrlKey ||
          z.metaKey ||
          z.altKey ||
          z.key.toLowerCase() !== "f" ||
          z.repeat
        )
          return;
        const M = s.activeElement;
        (M &&
          (M.matches('input,textarea,select,[contenteditable="true"]') ||
            M.closest('[contenteditable="true"],dialog'))) ||
          (l() && r() && (z.preventDefault(), e("focus")));
      }),
        window.TerminalAcoes?.registrar(
          "@focus",
          () => e("focus"),
          () => l() && r() && !!j() && !window.TRPOP,
          () => (s.body.classList.contains("tr327-focus") ? "Sair do modo foco" : "Modo foco"),
        ),
        window.TraderUI?.onRender &&
          window.TraderUI.onRender("desktop-visual-v327", i),
        window.addEventListener("resize", N),
        new MutationObserver(() => {
          r() && !s.querySelector("[data-tr327-focus]") && l()
            ? i()
            : !r() && s.body.classList.contains("tr327-focus") && N();
        }).observe(s.getElementById("app") || s.body, {
          childList: !0,
          subtree: !1,
        }));
      const Y = s.createElement("style");
      ((Y.textContent = `
/* V327: somente desktop e somente dentro do Terminal; preserva os painéis nativos. */
@media(min-width:900px){
 body.trmon.tr327-focus .trbar{padding:4px 8px!important;gap:4px!important}
 body.trmon.tr327-focus .trbar .trcmd{min-height:30px!important;height:30px!important}
 body.trmon.tr327-focus .trbar .trbtn{min-height:30px!important;padding:4px 8px!important;font-size:11px!important}
 body.trmon.tr327-focus .trrod{display:none!important}
 body.trmon.tr327-dense .trbar{gap:4px!important;padding:4px 8px!important}
 body.trmon.tr327-dense .trbar .trbtn{min-height:30px!important;padding:4px 8px!important;font-size:11px!important}
 body.trmon.tr327-dense .trph{min-height:27px!important;padding:4px 4px!important}
 body.trmon.tr327-dense .trph .trx{min-height:23px!important;padding:4px 4px!important}
 body.trmon.tr327-dense .trpb{font-size:12px!important}
 body.trmon .tr327-focus-btn{border-color:var(--ds-line-2)!important;color:#dfc79a!important}
}
`),
        s.head.append(Y),
        (window.TraderVisual327 = {
          toggleFocus: () => e("focus"),
          toggleDensity: () => e("dense"),
          apply: N,
          mount: i,
        }),
        i());
    })(),
    (function () {
      "use strict";
      if (window.TraderPre328) return;
      const s = document,
        l = "pre328-dialog",
        r = "diario-pre328-",
        j = {
          global: {
            name: "Pré-Mercado · Visão Global",
            desc: "Primeira leitura: exterior, indicadores, agenda, juros e notícias.",
            panels: [
              ["WEI", "Radar global"],
              ["ECO", "Agenda e indicadores"],
              ["WIRP", "Juros"],
              ["FX", "Câmbio"],
              ["NEWS", "Notícias"],
              ["EVT", "Eventos"],
            ],
          },
          win: {
            name: "Pré-Mercado · Foco WIN",
            desc: "Cenário externo, ações brasileiras, commodities e risco de calendário.",
            panels: [
              ["WEI", "Exterior"],
              ["TOP", "Destaques Brasil"],
              ["CMDTY", "Commodities"],
              ["ECO", "Agenda econômica"],
              ["WIRP", "Juros"],
              ["NEWS", "Notícias"],
            ],
          },
          wdo: {
            name: "Pré-Mercado · Foco WDO",
            desc: "Dólar global, juros, agenda Brasil/EUA e notícias relevantes.",
            panels: [
              ["FX", "Câmbio"],
              ["WIRP", "Curva de juros"],
              ["WEI", "Índices globais"],
              ["ECO", "Agenda econômica"],
              ["EVT", "Eventos"],
              ["NEWS", "Notícias"],
            ],
          },
          live: {
            name: "Pregão · Radar de Consulta",
            desc: "Foco no acompanhamento sem recriar a plataforma de execução.",
            panels: [
              ["WEI", "Mercados globais"],
              ["ECO", "Indicadores"],
              ["FX", "Câmbio"],
              ["WIRP", "Juros"],
              ["NEWS", "Notícias"],
              ["EVT", "Eventos"],
            ],
          },
          post: {
            name: "Pós-Pregão · Revisão",
            desc: "Reconstituir acontecimentos e consultar diário e estatísticas.",
            panels: [
              ["JORNAL", "Jornal do Pregão"],
              ["NEWS", "Notícias"],
              ["ECO", "Agenda"],
              ["STAT", "Estatísticas"],
              ["EVT", "Eventos"],
            ],
          },
        },
        O = () =>
          window.DIARIO_DEMO
            ? "demo"
            : typeof SESS < "u" && SESS?.uid
              ? String(SESS.uid)
              : null,
        G = (a) => r + O() + "-" + a;
      function o(a, n) {
        try {
          const f = JSON.parse(localStorage.getItem(G(a)));
          return f === null ? n : f;
        } catch {
          return n;
        }
      }
      function F(a, n) {
        try {
          O() && localStorage.setItem(G(a), JSON.stringify(n));
        } catch {}
      }
      const N = (a) => JSON.parse(JSON.stringify(a)),
        e = (a, n, f) => {
          let h = s.createElement(a);
          return (
            n !== void 0 && (h.textContent = n),
            f && (h.className = f),
            h
          );
        },
        i = (a, n, f = "pre328-btn") => {
          const h = e("button", a, f);
          return ((h.type = "button"), h.addEventListener("click", n), h);
        },
        B = () => {
          const a = window.TRM?.TS?.();
          if (!a?.wss || !O())
            throw Error("Terminal indisponível ou sessão expirada.");
          return a;
        };
      let Y = null;
      function z() {
        if (!Y) return;
        const a = Y;
        Y = null;
        try {
          a.close();
        } catch {}
        a.remove();
      }
      function M(a) {
        z();
        const n = (Y = e("dialog", void 0, "pre328-modal"));
        n.id = l;
        const f = e("header", void 0, "pre328-head");
        (f.append(e("strong", a), i("✕", z, "pre328-close")), n.append(f));
        const h = e("section", void 0, "pre328-body");
        (n.append(h),
          s.body.append(n),
          n.addEventListener("close", () => {
            (Y === n && (Y = null), n.remove());
          }));
        try {
          n.showModal();
        } catch {
          n.setAttribute("open", "");
        }
        return h;
      }
      function E(a) {
        const n = a < 3 ? 1 : a < 5 ? 2 : 3,
          f = Math.max(6, Math.floor(26 / Math.ceil(a / n)));
        return Array.from({ length: a }, (h, Q) => ({
          x: ((Q % n) * 12) / n,
          y: Math.floor(Q / n) * f,
          w: 12 / n,
          h: f,
        }));
      }
      function u(a, n, f = !1) {
        const h = B(),
          Q = j[a];
        if (!Q) throw Error("Modelo desconhecido.");
        const J = n.filter((L) => Q.panels.some((d) => d[0] === L));
        if (J.length < 2 || J.length > 8)
          throw Error("Selecione de dois a oito painéis.");
        const v = "ws328_" + a,
          I = h.wss[v];
        if (I && !f)
          return (
            (h.ws = v),
            (window.TRM.TR.foco = 0),
            (window.TRM.TR.mob = 0),
            (window.TRM.TR.max = -1),
            save(),
            render(),
            "Workspace existente reaberto sem alterações."
          );
        const k = { ws: h.ws, existing: I ? N(I) : null };
        return (
          F("undo", k),
          (h.wss[v] = { n: Q.name, p: J.slice(), g: E(J.length) }),
          (h.ws = v),
          (window.TRM.TR.foco = 0),
          (window.TRM.TR.mob = 0),
          (window.TRM.TR.max = -1),
          save(),
          render(),
          "Workspace salvo e aberto. Os demais espaços foram preservados."
        );
      }
      function P() {
        const a = o("undo", null);
        if (!a) throw Error("Nenhuma troca recente para desfazer.");
        const n = B(),
          f = n.ws;
        if (!f.startsWith("ws328_"))
          throw Error("O Workspace atual não é do planejador.");
        (a.existing ? (n.wss[f] = a.existing) : delete n.wss[f],
          a.ws && n.wss[a.ws] && (n.ws = a.ws),
          (window.TRM.TR.foco = 0),
          (window.TRM.TR.mob = 0),
          (window.TRM.TR.max = -1),
          F("undo", null),
          save(),
          render());
      }
      function m() {
        const a = window.TraderConsulta325?.getQuotes?.() || {
            rows: [],
            status: "não disponível",
          },
          n = Array.isArray(a.rows) ? a.rows : [],
          f = ["IBOV", "SPX", "NDX", "DXY", "US10Y", "WIN", "WDO"],
          h = n
            .filter((Q) =>
              f.some((J) =>
                String(Q.pedido || Q.s || "")
                  .toUpperCase()
                  .includes(J),
              ),
            )
            .slice(0, 9);
        return {
          data: n,
          selected: h,
          atrasos: n.filter((Q) => Q.atraso === !0).length,
          semPreco: n.filter((Q) => !Number.isFinite(Number(Q.px))).length,
          status: a.status || "Fonte não identificada",
          stamp: a.timestamp,
        };
      }
      function c() {
        const a = M("Briefing de consulta · Pré-Mercado"),
          n = m();
        if (
          (a.append(
            e(
              "div",
              "RESUMO AUTOMÁTICO BASEADO APENAS NO CACHE DISPONÍVEL",
              "pre328-label",
            ),
          ),
          a.append(
            e(
              "p",
              "Cenário de consulta: priorize os índices globais, o DXY, os Treasuries, a curva de DI e a agenda econômica antes de analisar WIN e WDO.",
              "pre328-note",
            ),
          ),
          a.append(
            e(
              "div",
              "Qualidade: " +
                n.data.length +
                " cotação(ões) no cache · " +
                n.atrasos +
                " com atraso declarado · " +
                n.semPreco +
                " sem preço válido.",
              "pre328-alert",
            ),
          ),
          n.selected.length)
        ) {
          const f = e("div", void 0, "pre328-quotes");
          for (const h of n.selected) {
            const Q = String(h.pedido || h.s || "Ativo"),
              J = Number(h.d1),
              v = Number.isFinite(J);
            f.append(
              e(
                "div",
                Q +
                  " · " +
                  (v
                    ? (J > 0 ? "+" : "") + J.toFixed(2) + "%"
                    : "variação indisponível") +
                  (h.atraso === !0 ? " · ATRASADO" : ""),
              ),
            );
          }
          a.append(f);
        } else
          a.append(
            e(
              "p",
              "Ainda não há cotações selecionáveis no cache. Consulte Radar Global e Qualidade dos Dados.",
              "pre328-note",
            ),
          );
        (a.append(
          e(
            "p",
            "Este briefing não interpreta notícias nem presume causa de movimentos. Dados podem estar atrasados. Confira Agenda e Notícias nos painéis existentes.",
            "pre328-note",
          ),
        ),
          a.append(
            i("Consultar qualidade das fontes", () => {
              (z(), window.TraderConsulta325?.open?.("quality"));
            }),
          ),
          a.append(i("Abrir planejamento de sessão", () => q())));
      }
      function q() {
        if (!O()) return;
        const a = M("Planejador do Terminal");
        a.append(
          e(
            "p",
            "Escolha a finalidade da consulta. O aplicativo reutiliza painéis que já existem, sem abrir ordens nem sobrescrever seus Workspaces.",
            "pre328-note",
          ),
        );
        const n = window.TraderConsulta325?.currentMode?.(),
          f =
            { pre: "global", live: "live", post: "post" }[n?.mode] || "global";
        let h = o("lastMode", f);
        j[h] || (h = f);
        const Q = e("div", void 0, "pre328-tabs"),
          J = e("div");
        a.append(Q, J);
        function v() {
          Q.replaceChildren();
          for (const [b, y] of Object.entries(j)) {
            const C = i(
              y.name
                .replace("Pré-Mercado · ", "")
                .replace("Pregão · ", "")
                .replace("Pós-Pregão · ", ""),
              () => {
                ((h = b), F("lastMode", b), v());
              },
              "pre328-tab",
            );
            (C.setAttribute("aria-pressed", String(h === b)), Q.append(C));
          }
          J.replaceChildren();
          const I = j[h];
          J.append(e("h3", I.name), e("p", I.desc, "pre328-note"));
          const k = B().wss["ws328_" + h];
          J.append(
            e(
              "p",
              k
                ? "Este ambiente já existe. Abrir preserva sua disposição atual; recriar utiliza os painéis selecionados."
                : "Este ambiente ainda não foi criado.",
              "pre328-note",
            ),
          );
          const L = e("div", void 0, "pre328-panes"),
            d = o(
              "choices-" + h,
              I.panels.map((b) => b[0]),
            );
          for (const [b, y] of I.panels) {
            const C = e("label", void 0, "pre328-item"),
              V = e("input");
            ((V.type = "checkbox"),
              (V.value = b),
              (V.checked = d.includes(b)),
              V.addEventListener("change", () =>
                F(
                  "choices-" + h,
                  [...L.querySelectorAll("input:checked")].map((X) => X.value),
                ),
              ),
              C.append(V, e("span", y), e("small", b)),
              L.append(C));
          }
          J.append(L);
          const $ = e("p", void 0, "pre328-note");
          ($.setAttribute("role", "status"), J.append($));
          const w = e("div", void 0, "pre328-actions");
          (w.append(
            i(k ? "Abrir Workspace salvo" : "Criar e abrir ambiente", () => {
              try {
                const b = [...L.querySelectorAll("input:checked")].map(
                  (y) => y.value,
                );
                (($.textContent = u(h, b, !1)), z());
              } catch (b) {
                $.textContent = b.message;
              }
            }),
          ),
            w.append(
              i("Recriar usando seleção", () => {
                if (
                  confirm(
                    "Recriar este ambiente usando os painéis selecionados? Outros Workspaces serão preservados.",
                  )
                )
                  try {
                    const b = [...L.querySelectorAll("input:checked")].map(
                      (y) => y.value,
                    );
                    (($.textContent = u(h, b, !0)), z());
                  } catch (b) {
                    $.textContent = b.message;
                  }
              }),
            ),
            J.append(w));
        }
        (v(),
          a.append(
            i("↶ Desfazer última troca do planejador", () => {
              try {
                (P(), z());
              } catch (I) {
                const k = e("p", I.message, "pre328-alert");
                a.append(k);
              }
            }),
          ),
          a.append(i("Gerar briefing de consulta", c)),
          a.append(
            e(
              "p",
              "A seleção por horário é apenas sugestiva. Feriados, horários especiais e fusos de bolsas devem ser confirmados nas fontes oficiais.",
              "pre328-note",
            ),
          ));
      }
      function H() {
        const a = s.querySelector(".trbar");
        if (!a || a.querySelector("[data-pre328]") || window.TRPOP || !O())
          return;
        const n = i("◫ Planejar sessão", q, "trbtn pre328-trigger");
        ((n.dataset.pre328 = "1"),
          (n.title = "Pré-Mercado: Global, WIN ou WDO · Pregão · Pós-Pregão"),
          a.append(n));
      }
      const g = e("style");
      ((g.textContent = `
.pre328-modal{box-sizing:border-box;border:1px solid #494d55;background:#141517;color:#f6f5f4;border-radius:8px;padding:0;width:min(650px,calc(100vw - 18px));max-height:86dvh;overflow:auto;font:13px/1.5 system-ui;box-shadow:0 25px 70px #000000bb}
.pre328-modal::backdrop{background:#000000aa}.pre328-head{position:sticky;top:0;background:#1d1f22;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #494d55;font-size:16px}.pre328-close{background:#2f3136;border:1px solid #545861;color:#f2f1ee;border-radius:6px;padding:8px 12px;cursor:pointer}.pre328-body{padding:16px 16px}.pre328-note{font-size:12px;color:#b6b9bf;margin:8px 0;line-height:1.5}.pre328-body h3{color:#dfc79a;margin:12px 0 4px;font-size:15px}.pre328-label{color:#d1af6f;letter-spacing:1px;font-size:10px;font-weight:700}.pre328-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:12px 0}.pre328-tab{background:#232528;border:1px solid #4d5159;border-radius:6px;color:#e2e0dc;padding:8px 8px;cursor:pointer;font:inherit}.pre328-tab[aria-pressed=true]{border-color:#d4b377;background:#44361c;color:#dfc79a}.pre328-panes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.pre328-item{display:flex;align-items:center;gap:8px;background:#222427;border:1px solid #3c3f45;border-radius:6px;padding:8px;min-width:0;cursor:pointer}.pre328-item input{accent-color:#d4b376;width:17px;height:17px;flex:none}.pre328-item span{flex:1}.pre328-item small{color:#8f949e;font-size:10px}.pre328-btn{background:#2c2f33;border:1px solid #5a5f68;color:#f5f4f3;border-radius:6px;padding:8px 12px;cursor:pointer;text-align:left;font:inherit;margin:4px 0}.pre328-btn:hover,.pre328-btn:focus-visible{outline:1px solid #d6b87f;background:#383b41}.pre328-actions{display:flex;flex-wrap:wrap;gap:8px}.pre328-alert{border-left:1px solid var(--ds-line-2);background:#2a2d2c;padding:8px;color:#dfc79a}.pre328-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.pre328-quotes div{background:#222427;padding:8px;border-radius:6px}.pre328-trigger{color:#dfc79a!important;border-color:var(--ds-line-2)!important}
@media(max-width:767px){.pre328-modal{max-height:78dvh}.pre328-body{padding:8px}.pre328-panes{grid-template-columns:1fr}.pre328-tabs{gap:4px}.pre328-tab{padding:8px;font-size:11px}.pre328-actions{display:grid;grid-template-columns:1fr}}
`),
        s.head.append(g),
        window.TerminalAcoes?.registrar("@plan", q, () => !window.TRPOP && !!O()),
        window.TraderUI?.onRender && window.TraderUI.onRender("pre328-plan", H),
        new MutationObserver(() => {
          s.querySelector(".trbar") && !s.querySelector("[data-pre328]") && H();
        }).observe(s.getElementById("app") || s.body, {
          childList: !0,
          subtree: !1,
        }),
        (window.TraderPre328 = {
          open: q,
          briefing: c,
          mount: H,
          presets: j,
          undo: P,
          setWorkspace: u,
          quoteReport: m,
        }),
        H());
    })(),
    (function () {
      "use strict";
      if (window.TraderObservador328) return;
      const s = document,
        l = () =>
          window.DIARIO_DEMO
            ? "demo"
            : typeof SESS < "u" && SESS?.uid
              ? String(SESS.uid)
              : null,
        r = (z) => "diario-obs328-" + l() + "-" + z,
        j = (z, M) => {
          try {
            return JSON.parse(localStorage.getItem(r(z))) ?? M;
          } catch {
            return M;
          }
        },
        O = (z, M) => {
          try {
            l() && localStorage.setItem(r(z), JSON.stringify(M));
          } catch {}
        },
        G = (z) => {
          const M = Number(z?.d1);
          return Number.isFinite(M) && M > -100 && M < 1e3 && z?.atraso === !1;
        };
      let o = null;
      function F() {
        const z = window.TraderConsulta325?.getQuotes?.();
        if (!z?.rows?.length || !l())
          return { ok: !1, reason: "Sem cotações para comparar." };
        const M = z.rows.filter(G);
        if (!M.length)
          return {
            ok: !1,
            reason:
              "Nenhuma cotação com regime de atraso confirmado como não atrasado.",
          };
        const E = Date.now(),
          u = { at: E, values: {} };
        for (const c of M) {
          const q = String(c.pedido || c.s || "").slice(0, 25);
          q && (u.values[q] = { pct: Number(c.d1), atraso: c.atraso });
        }
        const P = j("snapshot", null);
        if ((O("snapshot", u), !P || E - P.at > 10800 * 1e3))
          return { ok: !0, count: 0, reason: "Referência inicial registrada." };
        let m = 0;
        for (const [c, q] of Object.entries(u.values)) {
          const H = P.values?.[c];
          if (!H || !Number.isFinite(H.pct)) continue;
          const g = q.pct - H.pct;
          if (Math.abs(g) < 0.75) continue;
          const R = c + "-" + Math.floor(E / (900 * 1e3)),
            a = j("seen", {});
          if (!a[R]) {
            (window.TraderConsulta325?.appendEvent?.(
              "Mudança observada · " + c,
              "Variação informada pela fonte passou de " +
                H.pct.toFixed(2) +
                "% para " +
                q.pct.toFixed(2) +
                "% entre duas consultas locais. Sem inferência de causa.",
              E,
            ),
              (a[R] = E));
            for (const n of Object.keys(a))
              E - a[n] > 14400 * 1e3 && delete a[n];
            if ((O("seen", a), m++, m >= 5)) break;
          }
        }
        return {
          ok: !0,
          count: m,
          reason: m
            ? m + " mudança(s) registrada(s) na linha do tempo."
            : "Sem mudanças acima do limiar desde a última observação.",
        };
      }
      function N() {
        (o && (clearInterval(o), (o = null)),
          !(!j("enabled", !1) || !l()) &&
            (o = setInterval(() => {
              s.hidden || !s.querySelector(".trbar") || !l() || F();
            }, 12e4)));
      }
      function e() {
        const z = s.createElement("dialog");
        ((z.className = "obs328-modal"),
          z.setAttribute("aria-label", "Observador de mercado"));
        const M = s.createElement("section");
        ((M.className = "obs328-content"), z.append(M));
        const E = s.createElement("h3");
        ((E.textContent = "Observador de mercado"), M.append(E));
        const u = s.createElement("p");
        ((u.textContent =
          "Registra alterações observadas no cache de cotações e as envia para a linha do tempo local, sem fazer novas consultas. Não substitui dados oficiais nem executa ordens."),
          M.append(u));
        const P = s.createElement("label"),
          m = s.createElement("input");
        ((m.type = "checkbox"),
          (m.checked = j("enabled", !1)),
          P.append(
            m,
            s.createTextNode(
              " Monitorar automaticamente a cada 2 minutos, enquanto o Terminal estiver aberto",
            ),
          ),
          M.append(P));
        const c = s.createElement("p");
        ((c.textContent =
          "Só utiliza linhas identificadas explicitamente como não atrasadas, com variação percentual válida. Registra mudanças de 0,75 ponto percentual ou mais e limita duplicações. Não infere notícias nem causas."),
          M.append(c));
        const q = s.createElement("p");
        (q.setAttribute("role", "status"),
          M.append(q),
          m.addEventListener("change", () => {
            (O("enabled", m.checked),
              N(),
              (q.textContent = m.checked
                ? "Monitoramento ativado neste dispositivo."
                : "Monitoramento desativado."));
          }));
        const H = s.createElement("button");
        ((H.textContent = "Comparar agora"),
          H.addEventListener("click", () => {
            q.textContent = F().reason;
          }),
          M.append(H));
        const g = s.createElement("button");
        ((g.textContent = "Abrir linha do tempo"),
          g.addEventListener("click", () => {
            (z.close(), window.TraderConsulta325?.open?.("timeline"));
          }),
          M.append(g));
        const R = s.createElement("button");
        ((R.textContent = "Fechar"),
          R.addEventListener("click", () => z.close()),
          M.append(R),
          z.addEventListener("close", () => z.remove()),
          s.body.append(z));
        try {
          z.showModal();
        } catch {
          z.open = !0;
        }
      }
      function i() {
        const z = s.querySelector(".trbar");
        if (!z || z.querySelector("[data-obs328]") || !l() || window.TRPOP)
          return;
        const M = s.createElement("button");
        ((M.type = "button"),
          (M.className = "trbtn"),
          (M.dataset.obs328 = "1"),
          (M.textContent = "◷ Observador"),
          (M.title =
            "Acompanhamento opcional de mudanças nas cotações, sem feeds adicionais"),
          M.addEventListener("click", e),
          z.append(M));
      }
      const B = s.createElement("style");
      ((B.textContent =
        ".obs328-modal{background:#16171a;color:#f0efed;border:1px solid #585c65;border-radius:8px;width:min(520px,calc(100vw - 20px));max-height:75dvh;overflow:auto;font:13px/1.6 system-ui}.obs328-modal::backdrop{background:#000000aa}.obs328-content{padding:12px}.obs328-content p{color:#babdc3}.obs328-content label{display:flex;gap:8px;align-items:start;background:#26282b;padding:12px;border-radius:6px}.obs328-content input{margin-top:4px;accent-color:#d5b67c}.obs328-content button{display:inline-block;margin:8px 4px 0 0;padding:8px 12px;background:#35383d;color:#f6f6f5;border:1px solid #676c77;border-radius:6px;cursor:pointer}"),
        s.head.append(B),
        window.TraderUI?.onRender && window.TraderUI.onRender("obs328", i),
        new MutationObserver(() => {
          s.querySelector(".trbar") && !s.querySelector("[data-obs328]") && i();
        }).observe(s.getElementById("app") || s.body, {
          childList: !0,
          subtree: !1,
        }),
        (window.TraderObservador328 = {
          settings: e,
          mount: i,
          snapshot: F,
          monitor: N,
        }),
        i(),
        N());
    })(),
    (function () {
      const s = document.createElement("style");
      ((s.textContent = ".tc326-ready [data-obs328]{display:none!important}"),
        document.head.appendChild(s));
    })(),
    (function (s, l) {
      "use strict";
      if (s.TraderContinuo329) return;
      const r = () =>
          s.DIARIO_DEMO
            ? "demo"
            : typeof SESS < "u" && SESS && SESS.uid
              ? String(SESS.uid)
              : null,
        j = (d) => "diario-v329-" + r() + "-" + d,
        O = (d, $) => {
          try {
            return JSON.parse(localStorage.getItem(j(d))) ?? $;
          } catch {
            return $;
          }
        },
        G = (d, $) => {
          if (r())
            try {
              localStorage.setItem(j(d), JSON.stringify($));
            } catch {}
        },
        o = (d, $, w) => {
          const b = l.createElement(d);
          return ($ != null && (b.textContent = $), w && (b.className = w), b);
        },
        F = (d, $) => {
          const w = o("button", d, "v329-btn");
          return ((w.type = "button"), w.addEventListener("click", $), w);
        },
        N = () => !!r() && !!l.querySelector(".trbar"),
        e = () =>
          s.innerWidth >= 980 &&
          !(
            s.matchMedia &&
            s.matchMedia("(pointer:coarse)").matches &&
            s.innerWidth < 1200
          ),
        i = Math.random().toString(36).slice(2);
      let B = null,
        Y = null,
        z = 0,
        M = new Map(),
        E = null,
        u = null;
      function P() {
        const d = r();
        !d ||
          !("BroadcastChannel" in s) ||
          (B && Y === d) ||
          (B && B.close(),
          (Y = d),
          (B = new BroadcastChannel("diario-trader-v329-" + d)),
          (B.onmessage = ($) => {
            const w = $.data;
            !w ||
              w.from === i ||
              w.owner !== r() ||
              !["save", "cloud", "layout", "ping"].includes(w.kind) ||
              typeof w.at != "number" ||
              Math.abs(Date.now() - w.at) > 3e4 ||
              (w.kind === "save" &&
                ((z = w.at),
                c(
                  "Checklist/Diário alterados em outra janela. A atualização segura será tentada automaticamente após o salvamento na nuvem.",
                )),
              w.kind === "cloud" &&
                ((z = w.at),
                s.dispatchEvent(
                  new CustomEvent("trader:remote-cloud-save", {
                    detail: { owner: w.owner, at: w.at },
                  }),
                )),
              w.kind === "layout" &&
                c(
                  "Um Workspace foi alterado em outra janela. Atualize a visualização se desejar.",
                ));
          }));
      }
      function m(d) {
        if (!(!r() || !["save", "cloud", "layout", "ping"].includes(d))) {
          P();
          try {
            B?.postMessage({ kind: d, owner: r(), from: i, at: Date.now() });
          } catch {}
        }
      }
      function c(d) {
        if (!N()) return;
        u?.remove();
        const $ = l.querySelector(".trbar");
        $ &&
          ((u = o("div", null, "v329-hint")),
          u.append(
            o("span", d),
            F("Entendi", () => {
              (u?.remove(), (u = null));
            }),
          ),
          $.insertAdjacentElement("afterend", u));
      }
      function q() {
        if (!e()) {
          c("Janelas destacáveis estão disponíveis no computador.");
          return;
        }
        if (!s.TRM?.layAtual) return;
        const d = s.TRM.layAtual()?.p || [];
        if (!d.length) return;
        const $ = g("Destacar painel para outro monitor");
        ($.append(
          o(
            "p",
            "A janela é nativa do navegador. Você pode arrastá-la para outro monitor; bloqueadores de pop-up e permissões do sistema podem limitar o recurso.",
            "v329-muted",
          ),
        ),
          d.forEach((w, b) => {
            const y = String(w || "").slice(0, 80);
            $.append(
              F(b + 1 + " · " + y, () => {
                const C = new URL(location.href);
                (C.searchParams.delete("terminal"),
                  C.searchParams.set("pop", y));
                const V = "diario-panel-" + b + "-" + i,
                  X = s.open(
                    C.href,
                    V,
                    "popup=yes,width=880,height=720,resizable=yes,scrollbars=yes",
                  );
                if (!X) {
                  $.append(
                    o(
                      "p",
                      "O navegador bloqueou a janela. Permita pop-ups para este site.",
                      "v329-warn",
                    ),
                  );
                  return;
                }
                M.set(V, X);
                try {
                  X.focus();
                } catch {}
                (m("layout"), H());
              }),
            );
          }),
          $.append(
            o(
              "p",
              "Os painéis destacados são visualizações de consulta. Eles não compartilham automaticamente posição, filtros ou dados editáveis.",
              "v329-muted",
            ),
          ));
      }
      function H() {
        if (!E) return;
        const d = E;
        E = null;
        try {
          d.close();
        } catch {}
        d.remove();
      }
      function g(d) {
        H();
        const $ = (E = o("dialog", null, "v329-dialog")),
          w = o("div", null, "v329-head");
        (w.append(o("b", d), F("✕", H)), $.append(w));
        const b = o("section", null, "v329-content");
        ($.append(b),
          l.body.append($),
          $.addEventListener("close", () => {
            (E === $ && (E = null), $.remove());
          }));
        try {
          $.showModal();
        } catch {
          $.setAttribute("open", "");
        }
        return b;
      }
      const R = () =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date()),
        a = () =>
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(new Date());
      function n() {
        const d = R(),
          $ = new Date(d + "T12:00:00Z").getUTCDay(),
          w = O("daysOff", []);
        if ($ === 0 || $ === 6 || w.includes(d))
          return {
            label: "Mercado fechado / feriado configurado",
            kind: "post",
          };
        const b = a();
        return b < "09:00"
          ? { label: "Pré-Abertura sugerida", kind: "pre" }
          : b < "18:00"
            ? { label: "Pregão sugerido", kind: "live" }
            : { label: "Pós-Pregão sugerido", kind: "post" };
      }
      function f() {
        const d = g("Agenda e sessões · horário de Brasília"),
          $ = n();
        (d.append(
          o(
            "p",
            "Sugestão local: " +
              $.label +
              ". Datas especiais e horários de bolsas devem ser conferidos em fontes oficiais.",
            "v329-info",
          ),
        ),
          d.append(
            F("Planejar ambiente recomendado", () => {
              (H(), s.TraderPre328?.open?.());
            }),
          ));
        const w = o("div", null, "v329-inline"),
          b = l.createElement("input");
        ((b.type = "date"),
          (b.value = R()),
          b.setAttribute("aria-label", "Data de feriado ou sessão especial"),
          w.append(
            b,
            F("Marcar feriado", () => {
              const y = O("daysOff", []);
              (b.value && !y.includes(b.value) && y.push(b.value),
                G("daysOff", y.slice(-100)),
                f());
            }),
            F("Remover feriado", () => {
              (G(
                "daysOff",
                O("daysOff", []).filter((y) => y !== b.value),
              ),
                f());
            }),
          ),
          d.append(w),
          d.append(
            o(
              "p",
              "Feriados locais cadastrados: " +
                (O("daysOff", []).sort().join(", ") || "nenhum") +
                ". Cadastro manual, não é calendário oficial da B3.",
              "v329-muted",
            ),
          ));
      }
      function h() {
        const d = g("Agenda de alertas locais");
        d.append(
          o(
            "p",
            "Cadastre lembretes econômicos com fonte verificada. Não é um feed automático de notícias ou um calendário oficial. Os alertas só aparecem com o aplicativo aberto.",
            "v329-muted",
          ),
        );
        const $ = o("form", null, "v329-form"),
          w = l.createElement("input");
        ((w.placeholder = "Evento (ex.: decisão Copom)"),
          (w.maxLength = 110),
          (w.required = !0));
        const b = l.createElement("input");
        ((b.type = "datetime-local"), (b.required = !0));
        const y = l.createElement("input");
        ((y.placeholder = "Fonte / URL (opcional)"),
          (y.maxLength = 200),
          $.append(w, b, y));
        const C = F("Adicionar evento", () => {
          if (!w.reportValidity() || !b.reportValidity()) return;
          const X = O("events", []);
          (X.push({
            id: Date.now() + Math.random(),
            name: w.value.trim(),
            when: b.value,
            source: y.value.trim(),
            done: !1,
          }),
            G("events", X.slice(-70)),
            h());
        });
        ($.append(C),
          d.append($),
          O("events", [])
            .sort((X, _) => X.when.localeCompare(_.when))
            .forEach((X) => {
              const _ = o("div", null, "v329-event");
              (_.append(
                o(
                  "span",
                  X.when.replace("T", " ") +
                    " · " +
                    X.name +
                    (X.source ? " · " + X.source : ""),
                ),
              ),
                _.append(
                  F("Excluir", () => {
                    (G(
                      "events",
                      O("events", []).filter((K) => K.id !== X.id),
                    ),
                      h());
                  }),
                ),
                d.append(_));
            }));
      }
      function Q() {
        if (!r() || l.hidden) return;
        const d = O("events", []);
        let $ = !1;
        for (const w of d) {
          if (w.done || !w.when) continue;
          const b = new Date(w.when).getTime();
          !Number.isFinite(b) ||
            Date.now() < b ||
            Date.now() - b > 900 * 1e3 ||
            ((w.done = !0),
            ($ = !0),
            c("Evento cadastrado: " + w.name + " (verifique a fonte)."),
            s.TraderConsulta325?.appendEvent?.(
              "Lembrete cadastrado · " + w.name,
              "Evento manual com horário definido pelo usuário. Não comprova divulgação nem resultado.",
              b,
            ));
        }
        $ && G("events", d);
      }
      function J() {
        const d = g("Briefing de consulta · v329");
        d.append(
          o(
            "p",
            "Esta síntese utiliza os painéis e o cache existentes. Não contém análise de notícias por IA nem dados novos.",
            "v329-muted",
          ),
        );
        const $ = n();
        d.append(o("h3", "Sessão: " + $.label));
        const w = s.TraderConsulta325?.getQuotes?.();
        (w?.rows?.length
          ? w.rows.slice(0, 12).forEach((y) => {
              const C = String(y.pedido || y.s || "Ativo").slice(0, 30),
                V = Number(y.d1);
              d.append(
                o(
                  "p",
                  C +
                    " · " +
                    (Number.isFinite(V)
                      ? V.toFixed(2) + "%"
                      : "variação indisponível") +
                    " · " +
                    (y.atraso === !1
                      ? "sem atraso declarado"
                      : y.atraso === !0
                        ? "atrasada"
                        : "status de atraso desconhecido"),
                  "v329-quote",
                ),
              );
            })
          : d.append(
              o(
                "p",
                "Cotações não disponíveis; abra o Radar Global e confira as fontes.",
              ),
            ),
          d.append(
            F("Abrir briefing anterior", () => {
              (H(), s.TraderPre328?.briefing?.());
            }),
          ));
      }
      function v() {
        const d = g("Central de automação · Terminal");
        (d.append(
          o(
            "p",
            "Ferramentas de consulta, sem execução de ordens.",
            "v329-muted",
          ),
        ),
          d.append(
            F("Destacar painéis em janelas separadas", q),
            F("Agenda de sessões e feriados configuráveis", f),
            F("Alertas de eventos cadastrados", h),
            F("Briefing de consulta", J),
            F("Linha do tempo existente", () => {
              (H(), s.TraderConsulta325?.open?.("timeline"));
            }),
          ),
          d.append(
            o(
              "p",
              "Sinais entre abas: " +
                (B
                  ? "disponíveis neste navegador"
                  : "aguardando navegador compatível") +
                ". Dados do Diário não são transmitidos pelo canal; use a sincronização do aplicativo.",
              "v329-muted",
            ),
          ));
      }
      function I() {
        const d = l.querySelector(".trbar");
        if (!d || d.querySelector("[data-v329-open]") || !r() || s.TRPOP)
          return;
        P();
        const $ = F("Automação +", v);
        (($.className = "trbtn v329-open"),
          ($.dataset.v329Open = "1"),
          d.append($));
      }
      const k = o("style");
      ((k.textContent =
        ".v329-dialog{background:#151618;color:#f2f1f0;border:1px solid #484c53;border-radius:8px;padding:0;width:min(620px,calc(100vw - 20px));max-height:85dvh;overflow:auto;font:13px/1.55 system-ui}.v329-dialog::backdrop{background:#000000aa}.v329-head{position:sticky;top:0;background:#222427;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;z-index:2;border-bottom:1px solid #494d54}.v329-content{padding:16px 16px;display:flex;flex-direction:column;gap:8px}.v329-content h3{margin:0}.v329-btn{background:#303237;color:#f2f1f0;border:1px solid #595e67;border-radius:6px;padding:8px 12px;min-height:40px;text-align:left;cursor:pointer}.v329-btn:hover{border-color:#d0ac6a}.v329-muted{color:#b8bbc1;font-size:12px}.v329-info{background:#27282c;padding:12px;border-radius:6px}.v329-inline{display:flex;gap:8px;flex-wrap:wrap}.v329-inline input,.v329-form input{min-height:40px;min-width:0;background:#242529;color:white;border:1px solid #585c65;border-radius:6px;padding:8px}.v329-form{display:flex;flex-direction:column;gap:8px}.v329-event{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #494d54;padding:8px 0}.v329-event span{overflow-wrap:anywhere}.v329-quote{border-bottom:1px solid #3e4147;padding:4px}.v329-hint{display:flex;justify-content:space-between;gap:8px;background:#2e3034;border:1px solid var(--ds-line-2);color:#ffffff;padding:8px;font:12px/1.4 system-ui}.v329-open{white-space:nowrap}"),
        l.head.append(k),
        (s.TraderContinuo329 = {
          open: v,
          openPanel: q,
          sessionPanel: f,
          eventPanel: h,
          briefing: J,
          inferredSession: n,
          signal: m,
          mount: I,
          checkEvents: Q,
        }),
        s.TraderUI?.onRender && s.TraderUI.onRender("terminal-v329", I),
        new MutationObserver(() => {
          N() && !l.querySelector("[data-v329-open]") && I();
        }).observe(l.getElementById("app") || l.body, {
          childList: !0,
          subtree: !1,
        }),
        setInterval(() => {
          (r() && P(), Q());
        }, 3e4),
        I());
    })(window, document),
    (function (s, l) {
      "use strict";
      if (s.TraderInteligencia330) return;
      const r = () =>
          s.DIARIO_DEMO
            ? "demo"
            : typeof SESS < "u" && SESS?.uid
              ? String(SESS.uid)
              : null,
        j = (w) => "diario-intel330-" + r() + "-" + w,
        O = (w, b) => {
          try {
            const y = JSON.parse(localStorage.getItem(j(w)));
            return y ?? b;
          } catch {
            return b;
          }
        },
        G = (w, b) => {
          if (r())
            try {
              localStorage.setItem(j(w), JSON.stringify(b));
            } catch {}
        },
        o = (w, b, y) => {
          const C = l.createElement(w);
          return (
            b !== void 0 && (C.textContent = b),
            y && (C.className = y),
            C
          );
        },
        F = (w, b) => {
          const y = o("button", w, "ti330-btn");
          return ((y.type = "button"), y.addEventListener("click", b), y);
        };
      let N = null,
        e = null,
        i = null,
        B = null,
        Y = new Map(),
        z = Math.random().toString(36).slice(2),
        M = "",
        E = 0;
      const u = () =>
          new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(new Date()),
        P = () =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date()),
        m = () =>
          O("options", {
            sessionReminder: !0,
            earlyEvents: !0,
            quoteAlerts: !1,
            quoteThreshold: 1,
            monitorOpen: !1,
          });
      function c() {
        if (!N) return;
        const w = N;
        N = null;
        try {
          w.close();
        } catch {}
        w.remove();
      }
      function q(w) {
        c();
        const b = (N = o("dialog", void 0, "ti330-modal")),
          y = o("header", void 0, "ti330-head");
        y.append(o("strong", w), F("Fechar", c));
        const C = o("section", void 0, "ti330-body");
        (b.append(y, C),
          l.body.append(b),
          b.addEventListener("close", () => {
            (N === b && (N = null), b.remove());
          }));
        try {
          b.showModal();
        } catch {
          b.setAttribute("open", "");
        }
        return C;
      }
      function H(w) {
        !l.querySelector(".trbar") ||
          l.hidden ||
          s.TRPOP ||
          (e?.remove(),
          (e = o("div", void 0, "ti330-notice")),
          e.setAttribute("role", "status"),
          e.append(
            o("span", w),
            F("Dispensar", () => {
              (e?.remove(), (e = null));
            }),
          ),
          l.querySelector(".trbar")?.insertAdjacentElement("afterend", e));
      }
      function g() {
        const w = r();
        w &&
          ((i === w && B) ||
            (B?.close(),
            (i = w),
            Y.clear(),
            "BroadcastChannel" in s &&
              ((B = new BroadcastChannel("diario-intel330-" + w)),
              (B.onmessage = (b) => {
                const y = b.data;
                !y ||
                  y.id === z ||
                  y.owner !== r() ||
                  Math.abs(Date.now() - y.at) > 6e4 ||
                  ((y.type === "hello" || y.type === "reply") &&
                    (Y.set(y.id, y.at), y.type === "hello" && R("reply")),
                  y.type === "layout-change" &&
                    H(
                      "Layout modificado em outra janela. Reabra o Workspace aqui para aplicar as mudanças.",
                    ));
              }),
              R("hello"))));
      }
      function R(w) {
        if (!(!B || !r()))
          try {
            B.postMessage({ type: w, id: z, owner: r(), at: Date.now() });
          } catch {}
      }
      function a() {
        return (
          s.TraderContinuo329?.inferredSession?.() || {
            kind: "unknown",
            label: "Horário não identificado",
          }
        );
      }
      function n() {
        if (
          !m().sessionReminder ||
          !r() ||
          l.hidden ||
          !l.querySelector(".trbar")
        )
          return;
        const w = a(),
          b = P() + ":" + w.kind;
        w.kind === "unknown" ||
          M === b ||
          ((M = b), O("sessionPrompt", "") === b) ||
          (G("sessionPrompt", b),
          H(
            "Sessão sugerida: " +
              w.label +
              ". Abra Planejar sessão se quiser adaptar os painéis. Nenhuma janela foi alterada.",
          ));
      }
      function f() {
        if (!m().earlyEvents || !r() || l.hidden) return;
        const w = h();
        for (const b of w) {
          if (b.done || !b.when || !b.name) continue;
          const y = new Date(b.when).getTime(),
            C = Date.now();
          if (!Number.isFinite(y) || y - C < 0 || y - C > 15 * 6e4) continue;
          const V = "early-" + String(b.id).slice(0, 50);
          O(V, !1) ||
            (G(V, !0),
            H(
              "Evento cadastrado em " +
                Math.max(1, Math.ceil((y - C) / 6e4)) +
                " min: " +
                b.name +
                ". Confira a fonte.",
            ),
            Q(
              "Pré-aviso de evento cadastrado",
              b.name + " · lembrete local, não confirmação de divulgação.",
            ));
        }
      }
      function h() {
        try {
          const w = JSON.parse(
            localStorage.getItem("diario-v329-" + r() + "-events"),
          );
          return Array.isArray(w) ? w : [];
        } catch {
          return [];
        }
      }
      function Q(w, b) {
        s.TraderConsulta325?.appendEvent?.(w, b, Date.now());
      }
      function J() {
        if (!m().quoteAlerts || !r() || l.hidden) return;
        const w = s.TraderConsulta325?.getQuotes?.();
        if (!Array.isArray(w?.rows)) return;
        const b = Date.now(),
          y = { at: b, rows: {} };
        for (const _ of w.rows) {
          if (_?.atraso !== !1) continue;
          const K = String(_.pedido || _.s || "").slice(0, 30),
            U = Number(_.d1);
          K && Number.isFinite(U) && Math.abs(U) < 1e3 && (y.rows[K] = U);
        }
        const C = O("quotes", null);
        if ((G("quotes", y), !C || b - C.at > 5400 * 1e3)) return;
        const V = Math.max(0.25, Math.min(10, Number(m().quoteThreshold) || 1));
        let X = 0;
        for (const [_, K] of Object.entries(y.rows)) {
          const U = C.rows?.[_];
          if (!Number.isFinite(U) || Math.abs(K - U) < V) continue;
          const te = "quote-" + _ + "-" + Math.floor(b / (15 * 6e4));
          if (O(te, !1)) continue;
          G(te, !0);
          const ue =
            _ +
            ": variação observada " +
            U.toFixed(2) +
            "% → " +
            K.toFixed(2) +
            "% (fonte sinalizada sem atraso).";
          if (
            (Q("Alerta de mudança observada", ue + " Sem afirmação de causa."),
            H(ue),
            ++X >= 2)
          )
            break;
        }
      }
      function v() {
        if (r() && (g(), !(l.hidden || Date.now() - E < 25e3))) {
          ((E = Date.now()), n(), f(), J());
          for (const [w, b] of Y) Date.now() - b > 7e4 && Y.delete(w);
        }
      }
      function I() {
        const w = q("Briefing de contexto · dados existentes"),
          b = a();
        w.append(
          o(
            "p",
            "Sessão sugerida: " + b.label + " · horário Brasília " + u(),
            "ti330-muted",
          ),
        );
        const y = s.TraderConsulta325?.getQuotes?.(),
          C = Array.isArray(y?.rows) ? y.rows : [],
          V = C.filter(
            (te) => te?.atraso === !1 && Number.isFinite(Number(te.d1)),
          ),
          X = C.filter((te) => te?.atraso === !0).length,
          _ = C.length - X - V.length;
        w.append(
          o(
            "div",
            "Qualidade: " +
              C.length +
              " ativos no cache · " +
              V.length +
              " identificados sem atraso · " +
              X +
              " atrasados · " +
              _ +
              " sem confirmação de atualização.",
            "ti330-info",
          ),
        );
        const K = [
            "NASDAQ",
            "SP 500",
            "S&P",
            "IBOV",
            "DXY",
            "DÓLAR",
            "DOLAR",
            "JUROS",
            "WIN",
            "WDO",
            "VIX",
            "PETRÓLEO",
            "PETROLEO",
          ],
          U = C.filter((te) =>
            K.some((ue) =>
              String(te.pedido || te.s || "")
                .toUpperCase()
                .includes(ue),
            ),
          ).slice(0, 10);
        U.length ||
          w.append(
            o(
              "p",
              "Ainda não há indicadores-chave disponíveis no cache. Abra o Radar Global e confirme a qualidade das fontes.",
              "ti330-muted",
            ),
          );
        for (const te of U) {
          const ue = Number(te.d1),
            ge = String(te.pedido || te.s || "Ativo").slice(0, 55);
          w.append(
            o(
              "div",
              ge +
                " · " +
                (Number.isFinite(ue) ? ue.toFixed(2) + "%" : "sem variação") +
                " · " +
                (te.atraso === !0
                  ? "ATRASADO"
                  : te.atraso === !1
                    ? "sem atraso declarado"
                    : "atualização não confirmada"),
              "ti330-item",
            ),
          );
        }
        (w.append(
          o(
            "p",
            "Leitura orientativa: confira cenário internacional, juros, dólar, agenda e notícias antes de tirar conclusões sobre WIN/WDO. Não é recomendação operacional nem análise de notícias por IA.",
            "ti330-muted",
          ),
        ),
          w.append(
            F("Abrir planejador Pré / Pregão / Pós", () => {
              (c(), s.TraderPre328?.open?.());
            }),
          ));
      }
      function k() {
        const w = q("Diagnóstico de automação e janelas"),
          b = s.TraderConsulta325?.getQuotes?.(),
          y = Array.isArray(b?.rows) ? b.rows : [];
        (w.append(
          o(
            "div",
            "Conta autenticada: " +
              (r() ? "sim" : "não") +
              " · Fonte de cotações: " +
              y.length +
              " linhas no cache.",
            "ti330-info",
          ),
        ),
          w.append(
            o(
              "p",
              "Canal local entre janelas: " +
                (B ? "ativo" : "indisponível") +
                " · outras janelas detectadas recentemente: " +
                Y.size +
                ".",
              "ti330-muted",
            ),
          ),
          w.append(
            o(
              "p",
              "Esses canais não garantem sincronização do conteúdo do Diário ou resolução de conflitos. Não transmitem operações.",
              "ti330-muted",
            ),
          ),
          w.append(
            F("Sinalizar presença às outras janelas", () => {
              (R("hello"),
                H(
                  "Sinal enviado. Abra Diagnóstico novamente para consultar a contagem.",
                ));
            }),
          ),
          w.append(
            F("Abrir controle de painéis destacados", () => {
              (c(), s.TraderContinuo329?.openPanel?.());
            }),
          ));
      }
      function L() {
        const w = q("Automações do Terminal");
        w.append(
          o(
            "p",
            "Esses recursos funcionam com o Terminal aberto e os dados já disponíveis. Não executam ordens, não contratam APIs e não alteram Workspaces automaticamente.",
            "ti330-muted",
          ),
        );
        const b = m(),
          y = [
            [
              "sessionReminder",
              "Sugerir sessão (Pré, Pregão, Pós) sem trocar layouts",
            ],
            ["earlyEvents", "Avisar 15 min antes de lembretes cadastrados"],
            [
              "quoteAlerts",
              "Registrar alertas de variação observada em cotações identificadas como não atrasadas",
            ],
          ];
        for (const [X, _] of y) {
          const K = o("label", void 0, "ti330-setting"),
            U = o("input");
          ((U.type = "checkbox"),
            (U.checked = !!b[X]),
            U.addEventListener("change", () => {
              const te = m();
              ((te[X] = U.checked), G("options", te));
            }),
            K.append(U, o("span", _)),
            w.append(K));
        }
        const C = o("label", void 0, "ti330-setting");
        C.append(
          o("span", "Limiar de variação em pontos percentuais (0,25 a 10):"),
        );
        const V = o("input");
        ((V.type = "number"),
          (V.min = ".25"),
          (V.max = "10"),
          (V.step = ".25"),
          (V.value = String(b.quoteThreshold)),
          V.addEventListener("change", () => {
            const X = m();
            ((X.quoteThreshold = Math.max(
              0.25,
              Math.min(10, Number(V.value) || 1),
            )),
              G("options", X),
              (V.value = String(X.quoteThreshold)));
          }),
          C.append(V),
          w.append(C),
          w.append(
            F("Ver briefing de contexto", I),
            F("Diagnóstico de janelas", k),
            F("Abrir calendário e lembretes", () => {
              (c(), s.TraderContinuo329?.eventPanel?.());
            }),
          ));
      }
      function d() {
        const w = l.querySelector(".trbar");
        if (!w || w.querySelector("[data-ti330]") || !r() || s.TRPOP) return;
        g();
        const b = F("Inteligência ▾", L);
        ((b.className = "trbtn ti330-open"),
          (b.dataset.ti330 = "1"),
          w.append(b));
      }
      const $ = o("style");
      (($.textContent =
        ".ti330-modal{box-sizing:border-box;width:min(590px,calc(100vw - 20px));max-height:85dvh;overflow:auto;border:1px solid #585c65;border-radius:8px;background:#151618;color:#f2f1ee;font:13px/1.5 system-ui;padding:0}.ti330-modal::backdrop{background:#000000bb}.ti330-head{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;background:#24262a;padding:12px 16px;border-bottom:1px solid #585c65}.ti330-body{display:flex;flex-direction:column;gap:8px;padding:16px}.ti330-body p{margin:4px 0}.ti330-muted{color:#c2c5ca}.ti330-btn{padding:8px 12px;border:1px solid #5e636d;border-radius:6px;background:#2e3135;color:#f6f5f4;cursor:pointer;text-align:left}.ti330-setting{display:flex;gap:8px;align-items:center;background:#232528;padding:12px;border-radius:6px}.ti330-setting input[type=checkbox]{accent-color:#cea965}.ti330-setting input[type=number]{width:75px;background:#1b1d1f;color:white;border:1px solid #585c65;padding:8px}.ti330-info{border-left:1px solid var(--ds-line-2);background:#2b2d32;padding:8px}.ti330-item{border-bottom:1px solid #383a40;padding:8px}.ti330-notice{padding:8px 12px;background:#2d2f34;border-left:1px solid var(--ds-line-2);color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:12px;font:12px/1.5 system-ui}.ti330-open{white-space:nowrap}@media(max-width:767px){.ti330-modal{max-height:78dvh}.ti330-body{padding:8px}}"),
        l.head.append($),
        (s.TraderInteligencia330 = {
          mount: d,
          settings: L,
          briefing: I,
          health: k,
          session: a,
          quoteScan: J,
          earlyEvents: f,
          tick: v,
        }),
        s.TraderUI?.onRender && s.TraderUI.onRender("inteligencia-v330", d),
        new MutationObserver(() => {
          l.querySelector(".trbar") && !l.querySelector("[data-ti330]") && d();
        }).observe(l.getElementById("app") || l.body, {
          childList: !0,
          subtree: !1,
        }),
        l.addEventListener("visibilitychange", () => {
          l.hidden || (R("hello"), v());
        }),
        setInterval(v, 3e4),
        d());
    })(window, document),
    (function (s, l) {
      "use strict";
      if (s.TraderRadar332) return;
      const r = (d) =>
          String(d ?? "").replace(
            /[&<>"']/g,
            ($) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[$],
          ),
        j = (d) => {
          const $ = new Date(d);
          return Number.isFinite(+$)
            ? $.toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "horário indisponível";
        },
        O = {
          news: [],
          events: [],
          indices: [],
          indicesAt: 0,
          indicesError: "",
          newsFilter: "todas",
          updated: 0,
          loading: !1,
          error: "",
          active: !1,
          enabled: !0,
          lastSignature: "",
          lastAlert: 0,
          newsSource: "",
          agendaSource: "",
          giro: null,
          giroError: "",
          giroChecked: 0,
          displayNotifications: !1,
          lastNewsSignature: "",
          lastUpdateSource: "",
        },
        G = () => {
          try {
            return typeof cfg == "function" ? cfg() : null;
          } catch {
            return null;
          }
        },
        o = () => {
          try {
            return typeof SESS < "u" ? SESS : null;
          } catch {
            return null;
          }
        },
        F = () => o()?.uid || "anon",
        N = () => `diario-radar332:${F()}:enabled`;
      try {
        O.enabled = localStorage.getItem(N()) !== "false";
      } catch {}
      function e(d) {
        if (
          O.displayNotifications &&
          l.visibilityState === "visible" &&
          "Notification" in s &&
          Notification.permission === "granted"
        )
          try {
            new Notification("Radar Proativo", {
              body: d,
              tag: "diario-radar-alerta",
            });
          } catch {}
        const $ = l.getElementById("radar332-toast");
        $ &&
          (($.textContent = d),
          ($.hidden = !1),
          setTimeout(() => {
            $.hidden = !0;
          }, 7e3));
      }
      async function i(d, $) {
        const w = G(),
          b = o();
        if (!w?.url || !w?.key || !b?.at)
          throw Error(
            "Entre na sua conta para consultar as fontes existentes.",
          );
        typeof tok == "function" && (await tok());
        const y = o();
        if (!y?.at) throw Error("Sessão indisponível.");
        const C = new AbortController(),
          V = setTimeout(() => C.abort(), 22e3);
        try {
          const X = await fetch(w.url + "/functions/v1/" + d, {
              method: "POST",
              signal: C.signal,
              headers: {
                "Content-Type": "application/json",
                apikey: w.key,
                Authorization: "Bearer " + y.at,
              },
              body: JSON.stringify($ || {}),
            }),
            _ = await X.json().catch(() => ({}));
          if (!X.ok || _.error)
            throw Error(String(_.error || _.erro || "HTTP " + X.status));
          return _;
        } finally {
          clearTimeout(V);
        }
      }
      const B =
          typeof BroadcastChannel < "u"
            ? new BroadcastChannel("diario-radar-v332")
            : null,
        Y = Math.random().toString(36).slice(2),
        z = () => `radar332:snapshot:${F()}`;
      let M = 0;
      function E(d) {
        !d ||
          d.uid !== F() ||
          d.from === Y ||
          d.type !== "snapshot" ||
          !o()?.at ||
          !Number.isFinite(d.at) ||
          d.at <= O.updated ||
          Date.now() - d.at > 10 * 6e4 ||
          ((O.news = P({ itens: d.news })),
          (O.events = m({ itens: d.events })),
          (O.indices = Array.isArray(d.indices) ? d.indices : []),
          (O.indicesAt = d.indicesAt || 0),
          (O.updated = d.at),
          (O.newsSource = d.newsSource || "Notícias"),
          (O.agendaSource = d.agendaSource || "Terminal"),
          (O.error = ""),
          (O.lastUpdateSource = "Outra janela"),
          (M = Date.now()),
          f());
      }
      B && (B.onmessage = (d) => E(d.data));
      function u() {
        !B ||
          !o()?.at ||
          B.postMessage({
            type: "snapshot",
            uid: F(),
            from: Y,
            at: O.updated,
            news: O.news,
            events: O.events,
            indices: O.indices,
            indicesAt: O.indicesAt,
            newsSource: O.newsSource,
            agendaSource: O.agendaSource,
          });
      }
      function P(d) {
        const $ = Array.isArray(d?.itens)
            ? d.itens
            : Array.isArray(d?.noticias)
              ? d.noticias
              : [],
          w = new Set();
        return $.map((b) => ({
          title: String(b.t || b.titulo || b.title || "").slice(0, 260),
          url: String(b.l || b.url || b.link || ""),
          date: b.d || b.data || b.date || "",
          source: String(b.f || b.fonte || d.fonte || "Notícias"),
          category: Array.isArray(b.c) ? b.c : [],
        }))
          .filter((b) =>
            !b.title || !/^https?:\/\//i.test(b.url) || w.has(b.url)
              ? !1
              : (w.add(b.url), !0),
          )
          .slice(0, 35);
      }
      function m(d) {
        const $ = Array.isArray(d)
            ? d
            : Array.isArray(d?.eventos)
              ? d.eventos
              : Array.isArray(d?.itens)
                ? d.itens
                : Array.isArray(d?.agenda)
                  ? d.agenda
                  : [],
          w = new Set();
        return $.map((b) => ({
          title: String(b.t || b.titulo || b.title || "").slice(0, 200),
          date: b.d || b.data || b.date || "",
          country: b.pais || b.country || "",
          importance: Number(b.imp || b.importancia || 0),
          source: b.fonte || d.fonte || "Agenda",
          actual: b.atual || "",
          forecast: b.prev || "",
        }))
          .filter((b) => {
            const y = b.title + "|" + b.date;
            return !b.title || !Number.isFinite(+new Date(b.date)) || w.has(y)
              ? !1
              : (w.add(y), !0);
          })
          .sort((b, y) => new Date(b.date) - new Date(y.date))
          .slice(0, 60);
      }
      function c(d) {
        const $ = (d.title + " " + d.category.join(" ")).toLowerCase();
        let w = 0;
        for (const b of [
          "copom",
          "selic",
          "fed",
          "fomc",
          "payroll",
          "inflação",
          "inflacao",
          "ipca",
          "pib",
          "juros",
          "dólar",
          "dolar",
          "ibovespa",
          "nasdaq",
          "petróleo",
          "petroleo",
          "china",
          "tarifas",
        ])
          $.includes(b) && (w += 2);
        return w;
      }
      function q(d) {
        const $ = (d.title + " " + d.source).toLowerCase();
        return /brasil|brasileir|ibovespa|b3\b|selic|copom|petrobras|vale3|petr4|real brasileiro|banco central do brasil|lula|brasília|brasilia/.test(
          $,
        )
          ? "br"
          : /reuters|cnbc|marketwatch|fed\b|fomc|nasdaq|s&p|wall street|dow jones|trump|china|europe|europa|treasury|new york|nyse|boe\b|ecb\b/.test(
                $,
              )
            ? "ext"
            : "geral";
      }
      function H() {
        return [...O.news]
          .filter((d) => O.newsFilter === "todas" || q(d) === O.newsFilter)
          .sort((d, $) => c($) - c(d) || new Date($.date) - new Date(d.date))
          .slice(0, 18);
      }
      const g = [
        ["NASDAQ:NDX", "Nasdaq 100"],
        ["CME_MINI:NQ1!", "Nasdaq Fut."],
        ["SP:SPX", "S&P 500"],
        ["CME_MINI:ES1!", "S&P Fut."],
        ["TVC:DXY", "DXY"],
        ["FX_IDC:USDBRL", "USD/BRL"],
        ["TVC:US10Y", "US10Y"],
        ["BMFBOVESPA:IBOV", "Ibovespa"],
      ];
      function R() {
        const d = new Map(O.indices.map(($) => [$.pedido, $]));
        return `<h3>Índices globais · Consulta</h3><div class="radar342-index-grid">${g
          .map(([$, w]) => {
            const b = d.get($),
              y = typeof b?.px == "number" ? b.px : NaN,
              C = typeof b?.d1 == "number" ? b.d1 : NaN,
              V = Number.isFinite(y) && y > 0,
              X = O.indicesAt && Date.now() - O.indicesAt > 5 * 6e4,
              _ =
                !O.indicesAt && O.loading
                  ? "Carregando…"
                  : O.indicesError
                    ? "Falha na consulta"
                    : O.indicesAt
                      ? "Indisponível na fonte"
                      : "Aguardando consulta";
            return `<div class="radar342-index"><b>${r(w)}</b><strong>${V ? r(y.toLocaleString("pt-BR", { maximumFractionDigits: 2 })) : "—"}</strong><small class="${V && Number.isFinite(C) ? (C < 0 ? "neg" : "pos") : ""}">${V && Number.isFinite(C) ? r((C >= 0 ? "+" : "") + C.toFixed(2) + "%") : V ? "Variação não informada" : _} · ${r((V && b?.fonte) || "TradingView")}</small>${V && X ? "<small>Dados possivelmente desatualizados</small>" : ""}</div>`;
          })
          .join(
            "",
          )}</div><p class="radar332-small">Fonte: TradingView pela função terminal/cot com símbolos nativos da plataforma. Dados podem ter atraso; não representam preços para execução. ${O.indicesAt ? "Atualizado: " + r(j(O.indicesAt)) : ""}${O.indicesError ? " · " + r(O.indicesError) : ""}</p>`;
      }
      function a() {
        const d = Date.now();
        return O.events
          .filter(($) => {
            const w = +new Date($.date);
            return w >= d - 15 * 6e4 && w <= d + 24 * 36e5;
          })
          .slice(0, 8);
      }
      function n() {
        return O.updated ? Math.round((Date.now() - O.updated) / 6e4) : null;
      }
      function f() {
        const d = l.getElementById("radar332-body");
        if (!d) return;
        const $ = O.error
            ? `<p class="radar332-warn">${r(O.error)}. Informações anteriores podem estar desatualizadas.</p>`
            : "",
          w = O.updated
            ? `${j(O.updated)} · consulta há ${n()} min`
            : O.loading
              ? "Atualizando fontes…"
              : O.error
                ? "Falha na atualização; veja o diagnóstico"
                : "Ainda não atualizado",
          b = H(),
          y = a();
        d.innerHTML = `<div class="radar332-small">Última consulta: ${r(w)} · ${r(O.lastUpdateSource || "Fonte direta")} · Fontes: ${r(O.newsSource || "noticias")} / ${r(O.agendaSource || "terminal")}</div>${$}<div class="radar332-actions"><button type="button" data-r332="reload" ${O.loading ? "disabled" : ""}>${O.loading ? "Atualizando…" : "Atualizar agora"}</button><button type="button" data-r332="toggle">Proatividade: ${O.enabled ? "ligada" : "desligada"}</button><button type="button" data-r332="giro">Consultar giro IA já publicado</button><button type="button" data-r332="avisos">Avisos na tela: ${O.displayNotifications ? "ligados" : "desligados"}</button></div>${O.giro ? `<h3>Giro IA do aplicativo · ${r(O.giro.dia_giro || O.giro.dia || "data não informada")}</h3><div class="radar332-item">${r(String(O.giro.texto || "").slice(0, 3e3))}</div>` : O.giroError ? `<p class="radar332-small">${r(O.giroError)}</p>` : ""}${R()}<h3>Agenda de atenção</h3>${y.length ? y.map((C) => `<div class="radar332-item"><b>${r(C.title)}</b><small>${r(j(C.date))} · ${r(C.country)} · importância ${C.importance || "não informada"} · ${r(C.source)}</small>${C.actual ? `<small>Divulgado: ${r(C.actual)} · esperado: ${r(C.forecast || "não informado")}</small>` : ""}</div>`).join("") : '<p class="radar332-small">Sem eventos confirmados para as próximas 24 horas nesta fonte.</p>'}<h3>Brasil + exterior no mesmo painel</h3><div class="radar332-actions radar342-filters"><button data-r332="all" type="button">Todas</button><button data-r332="br" type="button">Brasil</button><button data-r332="ext" type="button">Internacionais</button></div><p class="radar332-small">Filtro por palavras-chave (aproximado). Cada manchete mostra a fonte original e abre o site.</p>${b.length ? b.map((C) => `<a class="radar332-item" href="${r(C.url)}" target="_blank" rel="noopener noreferrer"><b>${r(C.title)}</b><small>${r(C.source)} · ${r(j(C.date))}</small></a>`).join("") : '<p class="radar332-small">Nenhuma notícia disponível. Verifique a autenticação e a fonte.</p>'}<p class="radar332-disclaimer">Relevância por palavras-chave, sem recomendação de operação. Notícias e eventos não explicam, por si só, a causa dos movimentos. Confira horários e atrasos nas fontes.</p>`;
      }
      async function h(d = !1) {
        if (O.loading || (!d && (!O.enabled || l.hidden))) return;
        if (!o()?.at) {
          ((O.error =
            "Sessão não detectada pela Central. Entre novamente na conta e toque em Atualizar agora."),
            f());
          return;
        }
        if (!d && Date.now() - O.updated < 4 * 6e4) return;
        ((O.loading = !0), f());
        const $ = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date()),
          w = await Promise.allSettled([
            i("terminal", { acao: "noticias" }).catch(() => i("noticias", {})),
            i("terminal", { acao: "agenda" }),
            i("terminal", { acao: "cot", s: g.map((C) => C[0]) }),
          ]);
        let b = 0,
          y = [];
        if (w[0].status === "fulfilled") {
          const C = w[0].value;
          ((O.news = P(C)),
            (O.newsSource = Array.isArray(C.fontes)
              ? C.fontes.slice(0, 6).join(", ")
              : C.fonte || "Fontes internacionais e brasileiras"),
            b++);
        } else y.push("Notícias: " + w[0].reason.message);
        if (w[1].status === "fulfilled") {
          const C = w[1].value;
          ((O.events = m(C)), (O.agendaSource = C.fonte || "Terminal"), b++);
        } else y.push("Agenda: " + w[1].reason.message);
        if (w[2].status === "fulfilled") {
          const C = w[2].value;
          ((O.indices = Array.isArray(C.itens) ? C.itens : []),
            (O.indicesAt = Date.now()),
            (O.indicesError = ""),
            b++);
        } else
          ((O.indicesError = String(w[2].reason.message || "Sem índices")),
            y.push("Índices: " + O.indicesError));
        if (
          ((O.error = y.join(" | ")),
          !b &&
            !O.error &&
            (O.error =
              "Nenhuma fonte retornou dados. Verifique a conexão e a sessão."),
          b)
        ) {
          ((O.updated = Date.now()),
            (O.lastUpdateSource = "Consulta autenticada"),
            u());
          const V = H()
            .filter((_) => {
              const K = +new Date(_.date);
              return Number.isFinite(K) && Date.now() - K < 60 * 6e4;
            })
            .slice(0, 2)
            .map((_) => _.url)
            .join("|");
          (O.lastSignature &&
            V &&
            V !== O.lastSignature &&
            Date.now() - O.lastAlert > 15 * 6e4 &&
            (e("Radar Proativo: novas manchetes relevantes disponíveis."),
            (O.lastAlert = Date.now())),
            (O.lastSignature = V));
          const X = a().find(
            (_) =>
              _.importance >= 2 &&
              +new Date(_.date) - Date.now() >= 0 &&
              +new Date(_.date) - Date.now() <= 15 * 6e4,
          );
          if (X) {
            const _ = "event:" + X.title + X.date;
            O.lastEvent !== _ &&
              ((O.lastEvent = _),
              e("Evento econômico em até 15 min: " + X.title));
          }
        }
        ((O.loading = !1), f());
      }
      async function Q() {
        O.giroError = "";
        try {
          const d = await i("analise", {
            modo: "giro",
            ultimo: !0,
            hoje_tambem: !0,
          });
          if (d.erro) throw Error(d.erro);
          if (!d.texto)
            throw Error("Giro ainda não publicado na função de IA.");
          O.giro = d;
        } catch (d) {
          O.giroError = "Giro indisponível: " + (d.message || d);
        }
        f();
      }
      function J() {
        I();
        const d = l.getElementById("radar332-dialog");
        (d?.showModal ? d.open || d.showModal() : d && (d.hidden = !1),
          f(),
          s.DiarioTv361?.onRadarOpen?.(),
          h(!0));
      }
      function v() {
        const d = l.getElementById("radar332-dialog");
        d?.close ? d.close() : d && (d.hidden = !0);
      }
      function I() {
        const d = l.querySelector(".trbar");
        if (d && !d.querySelector("[data-radar332]")) {
          const y = l.createElement("button");
          ((y.className = "trbtn"),
            (y.dataset.radar332 = "1"),
            (y.type = "button"),
            (y.textContent = "Radar Proativo"),
            y.addEventListener("click", J),
            d.appendChild(y));
        }
        if (l.getElementById("radar332-dialog")) return;
        const $ = l.createElement("dialog");
        (($.id = "radar332-dialog"),
          ($.className = "radar332-dialog"),
          ($.innerHTML =
            '<header><strong>CENTRAL DE MERCADO · BRASIL + MUNDO</strong><button type="button" data-r332="close" aria-label="Fechar">×</button></header><div id="diario-tv343"></div><section id="radar332-body"></section>'),
          $.addEventListener("click", (y) => {
            const C = y.target.closest("[data-r332]")?.dataset.r332;
            if (
              (C === "close" && v(),
              C === "reload" && h(!0),
              ["all", "br", "ext"].includes(C) &&
                ((O.newsFilter = C === "all" ? "todas" : C), f()),
              C === "giro" && Q(),
              C === "avisos" &&
                ((O.displayNotifications = !O.displayNotifications),
                O.displayNotifications &&
                  "Notification" in s &&
                  Notification.permission === "default" &&
                  Notification.requestPermission().catch(() => {}),
                f()),
              C === "toggle")
            ) {
              O.enabled = !O.enabled;
              try {
                localStorage.setItem(N(), String(O.enabled));
              } catch {}
              f();
            }
          }),
          l.body.append($));
        const w = l.createElement("div");
        ((w.id = "radar332-toast"),
          (w.hidden = !0),
          w.setAttribute("role", "status"),
          l.body.append(w));
        const b = l.createElement("style");
        ((b.textContent =
          ".radar332-dialog{max-width:650px;width:calc(100vw - 26px);max-height:84dvh;overflow:auto;background:#16171a;color:#efeeeb;border:1px solid #52565e;border-radius:8px;padding:0;font:13px/1.45 system-ui}.radar332-dialog::backdrop{background:#000000aa}.radar332-dialog header{position:sticky;top:0;background:#242529;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;z-index:1}.radar332-dialog button{cursor:pointer}.radar332-dialog header button{border:0;background:transparent;color:#eeeeee;font-size:22px}.radar332-dialog section{padding:12px 16px}.radar332-actions{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap}.radar342-index-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0}.radar342-index{padding:8px 8px;border:1px solid #3e4147;border-radius:6px;background:#212326;min-width:0}.radar342-index b,.radar342-index strong,.radar342-index small{display:block}.radar342-index strong{font-size:15px;margin:4px 0}.radar342-index small{font-size:10px;color:#bcbfc4}.radar342-index .pos{color:#66cc99}.radar342-index .neg{color:#f3b3a9}@media(max-width:540px){.radar342-index-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}.radar332-actions button{background:#2e3135;color:#ffffff;border:1px solid #5f646d;border-radius:6px;padding:8px 8px}.radar332-dialog h3{font-size:12px;letter-spacing:.07em;color:#dbc08d;border-bottom:1px solid #393c41;padding-bottom:8px;margin:16px 0 8px}.radar332-item{display:block;color:inherit;text-decoration:none;padding:8px 0;border-bottom:1px solid #2d2f34}.radar332-item small{display:block;color:#b4b7be;margin-top:4px}.radar332-warn{color:#dfc79a}.radar332-small,.radar332-disclaimer{font-size:11px;color:#b1b5bc}#radar332-toast{position:fixed;bottom:22px;right:20px;z-index:99999;color:#ffffff;background:#393c41;border:1px solid var(--ds-line-2);border-radius:6px;padding:12px;max-width:310px}#radar332-toast[hidden]{display:none}@media(max-width:640px){.radar332-dialog{width:calc(100vw - 12px)}.radar332-dialog section{padding:8px}}"),
          l.head.append(b),
          f());
      }
      ((s.TraderRadar332 = {
        open: J,
        refresh: h,
        normalizeNews: P,
        normalizeEvents: m,
        score: c,
        state: O,
        giro: Q,
      }),
        s.TraderUI?.onRender && s.TraderUI.onRender("radar332", I));
      let k = F();
      (setInterval(() => {
        const d = F();
        d !== k &&
          ((k = d),
          (O.news = []),
          (O.events = []),
          (O.indices = []),
          (O.indicesAt = 0),
          (O.updated = 0),
          (O.giro = null),
          (O.lastSignature = ""),
          f());
      }, 15e3),
        new MutationObserver(() => {
          l.querySelector(".trbar") &&
            !l.querySelector("[data-radar332]") &&
            I();
        }).observe(l.getElementById("app") || l.body, {
          childList: !0,
          subtree: !1,
        }),
        setInterval(() => {
          O.enabled &&
            l.querySelector(".trbar") &&
            o()?.at &&
            Date.now() - O.updated > 5 * 6e4 &&
            h();
        }, 6e4),
        I());
    })(window, document),
    (() => {
      "use strict";
      const s = document,
        l = () => window.matchMedia("(max-width: 800px)").matches,
        r = () => s.body.classList.contains("trmon") && !window.TRPOP;
      let j = null,
        O = !1,
        G = null;
      const o = s.createElement("style");
      ((o.id = "tr341-css"),
        (o.textContent = `
 @media(min-width:801px){body.trmon .trbar>[data-tr341-menu]{display:none!important}}
 @media(max-width:800px){
   body.trmon:not(.tr341-exempt) .trbar{display:flex!important;align-items:center!important;gap:8px!important;padding:8px!important;flex-wrap:wrap!important}
   body.trmon .trbar>.trlogo,body.trmon .trbar>.trmenub{display:none!important}
   body.trmon .trbar>.tr341-secondary{display:none!important}
   body.trmon .trquick-strip{display:none!important}
   body.trmon .trbar>.trcmdw{order:0!important;flex:1 1 100%!important;width:100%!important;min-width:0!important;margin:0!important}
   body.trmon .trbar>.trlay{order:1!important;flex:1 1 130px!important;min-width:100px!important;width:auto!important;margin:0!important}
   body.trmon .trbar>[data-tr="addp"]{order:2!important;flex:0 0 auto!important;white-space:nowrap}
   body.trmon .trbar>[data-tr341-menu]{order:3!important;flex:0 0 auto!important;white-space:nowrap;background:#2c2e33!important;border:1px solid #6e747f!important;color:#efeeeb!important;border-radius:6px!important;font-weight:700!important;min-height:42px!important;padding:8px 12px!important}
   body.trmon .trtabs{display:flex!important;gap:4px!important;flex-wrap:nowrap!important;overflow-x:auto!important;padding:8px 8px!important;scrollbar-width:thin;scroll-snap-type:x proximity;background:#151618!important;border-bottom:1px solid #383b41}
   body.trmon .trtabs>button{flex:0 0 auto!important;min-height:40px!important;scroll-snap-align:start;font-weight:700!important}
   body.trmon #trtape{padding:4px 8px!important;min-height:0!important;font-size:11px!important}
 }
 .tr341-dialog{box-sizing:border-box;width:min(520px,calc(100vw - 16px));max-height:84dvh;overflow:auto;border:1px solid #676c76;border-radius:8px;background:#18191c;color:#f8f8f7;padding:0;box-shadow:0 18px 50px #00000099;font:14px/1.5 system-ui,sans-serif}
 .tr341-dialog::backdrop{background:#080809c9}
 .tr341-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 16px;background:#232528;border-bottom:1px solid #3b3e43}
 .tr341-head strong{font-size:16px}.tr341-head button{border:1px solid #767c87;border-radius:6px;background:#2d2f34;color:#f8f8f7;min-width:40px;min-height:40px;font-size:22px}
 .tr341-content{padding:12px 16px 24px}
 .tr341-group{margin:0 0 16px}.tr341-group h3{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#66cc99;margin:0 0 8px}
 .tr341-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .tr341-items button{width:100%;padding:12px 8px;border:1px solid #4d5159;border-radius:8px;background:#27292d;color:#efeeeb;font:600 13px/1.3 system-ui;min-height:40px;overflow-wrap:anywhere;text-align:left}
 .tr341-items button:active{background:#3b3e44}.tr341-empty{color:#b1b5bc;padding:12px}
 @media(max-width:360px){.tr341-items{grid-template-columns:1fr}}
 `),
        s.head.appendChild(o));
      const F = (E) => {
        const u = (
          E.textContent +
          " " +
          (E.title || "") +
          " " +
          Object.keys(E.dataset).join(" ")
        )
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        return /pesquis|fluxo|comandos|grafico|fundament|ficha|favorit|voltar/.test(
          u,
        )
          ? "Pesquisa e comandos"
          : /espac|work|organizar|painel|planejar|sessao|renomear|duplicar/.test(
                u,
              )
            ? "Organização"
            : /intelig|radar|notici|jornal|agenda|automac|dados|qualidade|context|fontes|monitor/.test(
                  u,
                )
              ? "Inteligência"
              : "Outras funções";
      };
      function N() {
        const E = s.querySelector(".trbar");
        if (!E) return [];
        const u = [...E.children].filter(
            (q) =>
              q.tagName === "BUTTON" &&
              !q.hasAttribute("data-tr341-menu") &&
              q.dataset.tr !== "addp",
          ),
          P = [...s.querySelectorAll(".trquick-strip button")],
          m = [...u, ...P],
          c = new Set();
        return m.filter((q) => {
          const H = (
            q.textContent ||
            q.getAttribute("aria-label") ||
            q.title ||
            ""
          ).trim();
          if (!H) return !1;
          const g =
            H + "|" + (q.dataset.tr || "") + "|" + (q.dataset.quickOpen || "");
          return c.has(g) ? !1 : (c.add(g), !0);
        });
      }
      function e() {
        j ||
          ((j = s.createElement("dialog")),
          (j.className = "tr341-dialog"),
          j.setAttribute("aria-label", "Menu do Terminal"),
          (j.innerHTML =
            '<div class="tr341-head"><strong>☰ Menu do Terminal</strong><button type="button" data-tr341-close aria-label="Fechar menu">×</button></div><div class="tr341-content"></div>'),
          s.body.appendChild(j),
          j.addEventListener("click", (P) => {
            (P.target === j && j.close(),
              P.target.closest("[data-tr341-close]") && j.close());
            const m = P.target.closest("[data-tr341-action]");
            if (m) {
              const c = N()[Number(m.dataset.tr341Action)];
              if (!c) {
                j.close();
                return;
              }
              (j.close(), c.click());
            }
          }),
          j.addEventListener("close", () => {
            ((O = !1), G?.isConnected && G.focus());
          }));
        const E = j.querySelector(".tr341-content");
        E.replaceChildren();
        const u = N();
        for (const P of [
          "Pesquisa e comandos",
          "Organização",
          "Inteligência",
          "Outras funções",
        ]) {
          const m = u
            .map((g, R) => ({ el: g, i: R }))
            .filter((g) => F(g.el) === P);
          if (!m.length) continue;
          const c = s.createElement("section");
          c.className = "tr341-group";
          const q = s.createElement("h3");
          ((q.textContent = P), c.append(q));
          const H = s.createElement("div");
          H.className = "tr341-items";
          for (const { el: g, i: R } of m) {
            const a = s.createElement("button");
            ((a.type = "button"),
              (a.dataset.tr341Action = String(R)),
              (a.textContent = (
                g.textContent ||
                g.getAttribute("aria-label") ||
                g.title ||
                "Função"
              )
                .trim()
                .replace(/\s+/g, " ")),
              H.appendChild(a));
          }
          (c.append(H), E.append(c));
        }
        if (!u.length) {
          const P = s.createElement("p");
          ((P.className = "tr341-empty"),
            (P.textContent =
              "As funções aparecerão quando o Terminal terminar de carregar."),
            E.append(P));
        }
      }
      function i() {
        (e(), (G = s.activeElement));
        try {
          (j.showModal(), (O = !0));
        } catch {
          (j.setAttribute("open", ""), (O = !0));
        }
      }
      function B() {
        if (!r()) {
          O && j && j.close();
          return;
        }
        const E = s.querySelector(".trbar");
        if (E) {
          for (const u of [...E.children])
            u.tagName === "BUTTON" &&
              u.dataset.tr !== "addp" &&
              !u.hasAttribute("data-tr341-menu") &&
              u.classList.add("tr341-secondary");
          if (!E.querySelector("[data-tr341-menu]")) {
            const u = s.createElement("button");
            ((u.type = "button"),
              (u.className = "trbtn"),
              (u.dataset.tr341Menu = ""),
              (u.textContent = "☰ Menu"),
              (u.title = "Abrir funções do Terminal"),
              u.setAttribute("aria-label", "Abrir menu de funções do Terminal"),
              u.addEventListener("click", i),
              E.appendChild(u));
          }
          if (l()) {
            const u = s.querySelector(".trm>.trtabs"),
              P = s.querySelector(".trm>#trtape");
            u && P && u.nextElementSibling !== P && P.before(u);
          }
        }
      }
      let Y = !1;
      const z = () => {
        Y ||
          ((Y = !0),
          requestAnimationFrame(() => {
            ((Y = !1), B());
          }));
      };
      (new MutationObserver((E) => {
        E.some((u) =>
          [...u.addedNodes].some(
            (P) =>
              P.nodeType === 1 &&
              (P.matches?.(".trm,.trbar,.trtabs,.trquick-strip") ||
                P.querySelector?.(".trbar")),
          ),
        ) && z();
      }).observe(s.getElementById("app") || s.body, {
        childList: !0,
        subtree: !0,
      }),
        window.addEventListener("resize", z, { passive: !0 }),
        s.addEventListener("click", (E) => {
          E.target.closest?.("[data-trmob]") && z();
        }),
        z());
    })(),
    (function (s, l) {
      "use strict";
      if (s.TraderTV343) return;
      const r = "diario-tv343",
        O = {
          bmc: {
            name: "BM&C News",
            lang: "Português BR",
            url: "https://www.youtube.com/c/BMCNEWStv/live",
            site: "https://bmcnews.com.br/bmc-news-ao-vivo/",
            youtubeChannel: "UCoja0MNI4SIvXqJR3szbSfw",
            desc: "Tentar localizar a live atual do canal oficial no YouTube. Não é confirmação de transmissão; a emissora pode impedir a incorporação.",
          },
          times: {
            name: "Times Brasil | CNBC",
            lang: "Português BR",
            url: "https://www.youtube.com/@otimesbrasil/live",
            site: "https://timesbrasil.com.br/videos/times-brasil-ao-vivo/",
            youtubeChannel: "",
            desc: "Sem identificação de canal validada para o player automático. Abra o canal oficial, copie o link de uma live atual e cole abaixo para testar no Terminal.",
          },
          bloomberg: {
            name: "Bloomberg Television",
            lang: "Inglês",
            url: "https://www.youtube.com/@markets/live",
            site: "https://www.bloomberg.com/live",
            youtubeChannel: "UCIALMKvObZNtJ6AmdCLP7Lg",
            desc: "O player tenta a transmissão atual do canal oficial, sem usar gravações antigas. Se não estiver disponível ou não permitir incorporação, use o canal oficial.",
          },
        },
        G = (U) =>
          String(U ?? "").replace(
            /[&<>"']/g,
            (te) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[te],
          ),
        o = {
          topic: "all",
          auto: !1,
          proactive: !0,
          seenNews: "",
          seenAt: 0,
          highlight: "",
          channel: "bmc",
          tab: "trader",
          playing: !1,
          expanded: !1,
          muted: !0,
          slide: 0,
          source: "",
          loadingGiro: !1,
          lastKey: "",
          collapsed: !1,
          manualVideo: {},
          liveError: "",
          videoId: "",
        };
      try {
        o.collapsed = localStorage.getItem("diario-tv343-collapsed") === "1";
      } catch {}
      try {
        const U = JSON.parse(
          localStorage.getItem("diario-tv345-options") || "{}",
        );
        (["all", "br", "world", "indices"].includes(U.topic) &&
          (o.topic = U.topic),
          (o.auto = U.auto === !0),
          (o.proactive = U.proactive !== !1));
      } catch {}
      function F() {
        try {
          localStorage.setItem(
            "diario-tv345-options",
            JSON.stringify({
              topic: o.topic,
              auto: o.auto,
              proactive: o.proactive,
            }),
          );
        } catch {}
      }
      const N = () => s.TraderRadar332?.state || {},
        e = () => {
          const U = l.getElementById("radar332-dialog");
          return !!U && (U.open === !0 || U.hidden === !1);
        },
        i = () =>
          Array.isArray(N().news)
            ? N()
                .news.filter((U) => U.title && /^https?:\/\//.test(U.url))
                .slice(0, 12)
            : [],
        B = () =>
          Array.isArray(N().indices)
            ? N()
                .indices.filter((U) => typeof U.px == "number" && U.px > 0)
                .slice(0, 7)
            : [];
      function Y(U) {
        return /brasil|b3|ibovespa|petrobras|vale|copom|selic|bras[ií]lia|fiscal|real brasileiro|banco central do brasil|mercado brasileiro|bovespa/i.test(
          (U.title || "") + " " + (U.source || ""),
        );
      }
      function z(U) {
        return U.filter(
          (te) =>
            o.topic === "all" ||
            (o.topic === "br" && Y(te)) ||
            (o.topic === "world" && !Y(te)),
        );
      }
      function M() {
        const U = Array.isArray(N().events) ? N().events : [],
          te = Date.now();
        return U.filter((ue) => {
          const ge = +new Date(ue.date);
          return (
            Number.isFinite(ge) &&
            ge >= te &&
            ge < te + 20 * 6e4 &&
            Number(ue.importance) >= 2
          );
        }).slice(0, 1);
      }
      function E() {
        const U = M();
        return U.length
          ? {
              label: "AGENDA · PRÓXIMOS 20 MIN",
              txt: U[0].title,
              kind: "event",
            }
          : o.highlight
            ? {
                label: "NOVA MANCHETE RECEBIDA",
                txt: o.highlight,
                kind: "news",
              }
            : null;
      }
      function u() {
        const U = i();
        if (!U.length) return;
        const te = U[0],
          ue = te.url || te.title;
        if (!o.seenNews) {
          ((o.seenNews = ue), (o.seenAt = Date.now()));
          return;
        }
        if (ue !== o.seenNews) {
          ((o.seenNews = ue), (o.seenAt = Date.now()));
          const ge = +new Date(te.date);
          o.proactive &&
            Number.isFinite(ge) &&
            Date.now() - ge < 60 * 6e4 &&
            ge <= Date.now() + 2 * 6e4 &&
            ((o.highlight = te.title), (o.slide = 0));
        }
      }
      function P() {
        const U = N().giro,
          te = z(i()),
          ue = B(),
          ge = [];
        if (U?.texto && o.topic === "all") {
          const oe = String(U.texto).replace(/\s+/g, " ").trim().slice(0, 1e3);
          ge.push({
            title: U.titulo || "Giro de Mercado",
            detail: oe,
            tag: "ANÁLISE IA · PUBLICADA",
            source: "Giro de Mercado do Diário Trader",
            url: "",
          });
        }
        for (const oe of o.topic === "indices" ? [] : te.slice(0, 8))
          ge.push({
            title: oe.title,
            detail: oe.source || "Fonte não informada",
            tag: "MANCHETE · FONTE EXTERNA",
            source: oe.source || "",
            url: oe.url,
          });
        if (ue.length && (o.topic === "all" || o.topic === "indices")) {
          const oe = ue
            .map(
              (ee) =>
                `${ee.pedido}: ${Number(ee.px).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${typeof ee.d1 == "number" ? " (" + (ee.d1 >= 0 ? "+" : "") + ee.d1.toFixed(2) + "%)" : ""}`,
            )
            .join(" · ");
          ge.push({
            title: "Painel de índices globais",
            detail: oe,
            tag: "COTAÇÕES · CONSULTA",
            source: "Terminal / TradingView",
            url: "",
          });
        }
        return ge;
      }
      function m() {
        return l.getElementById(r);
      }
      function c(U, te, ue = "") {
        return `<button type="button" data-tv343="${U}" ${ue}>${te}</button>`;
      }
      function q(U) {
        try {
          const te = new URL(String(U).trim());
          if (te.protocol !== "https:") return "";
          const ue = te.hostname.toLowerCase();
          if (ue === "youtu.be")
            return /^[a-zA-Z0-9_-]{11}$/.test(te.pathname.slice(1))
              ? te.pathname.slice(1)
              : "";
          if (
            ![
              "youtube.com",
              "www.youtube.com",
              "m.youtube.com",
              "www.youtube-nocookie.com",
            ].includes(ue)
          )
            return "";
          const ge =
            te.searchParams.get("v") ||
            (/\/(?:live|embed|shorts)\/([\w-]{11})/.exec(te.pathname) ||
              [])[1] ||
            "";
          return /^[a-zA-Z0-9_-]{11}$/.test(ge) ? ge : "";
        } catch {
          return "";
        }
      }
      function H(U) {
        return !!(o.manualVideo[o.channel] || U.youtubeChannel);
      }
      function g() {
        const U = O[o.channel];
        if (!U) return "";
        const te = o.manualVideo[o.channel] || "",
          ue = te
            ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(te)
            : U.youtubeChannel
              ? "https://www.youtube.com/embed/live_stream?channel=" +
                encodeURIComponent(U.youtubeChannel)
              : "";
        return ue
          ? ue +
              (ue.includes("?") ? "&" : "?") +
              "autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1"
          : "";
      }
      const R = { active: !1, host: null };
      function a() {
        if (R.host?.isConnected) return R.host;
        const U = l.createElement("aside");
        return (
          (U.id = "dt361-tvmini"),
          (U.className = "dt361-tvmini"),
          (U.hidden = !0),
          U.setAttribute("aria-label", "TV de Mercado flutuante"),
          (U.innerHTML =
            '<div class="dt361-tvbar"><span class="dt361-grip" title="Arrastar mini player" aria-label="Arrastar mini player">⠿</span><strong data-dt361-name>TV de Mercado</strong><button type="button" data-dt361="restore" title="Expandir" aria-label="Voltar à TV de Mercado">⛶</button><button type="button" data-dt361="close" title="Fechar TV" aria-label="Encerrar transmissão">×</button></div><div class="dt361-vid"></div><small class="dt361-footer">Áudio pelo player · disponível dentro do aplicativo</small>'),
          U.addEventListener("click", (te) => {
            const ue = te.target.closest("[data-dt361]");
            ue &&
              (ue.dataset.dt361 === "restore" && f(),
              ue.dataset.dt361 === "close" && (d(), k()));
          }),
          l.body.append(U),
          (R.host = U),
          U
        );
      }
      function n() {
        if (!(o.tab === "live" && o.playing)) return !1;
        const U = a(),
          te = U.querySelector(".dt361-vid"),
          ue =
            m()?.querySelector(".tv347-embedbox iframe") ||
            m()?.querySelector(".tv343-screen iframe");
        if (ue) te.replaceChildren(ue);
        else if (!te.querySelector("iframe")) {
          const ge = g();
          if (!ge) return !1;
          const oe = l.createElement("iframe");
          ((oe.src = ge),
            (oe.title = "TV de Mercado · canal externo"),
            (oe.allow =
              "autoplay; encrypted-media; picture-in-picture; fullscreen"),
            (oe.allowFullscreen = !0),
            (oe.referrerPolicy = "strict-origin-when-cross-origin"),
            te.replaceChildren(oe));
        }
        return (
          (U.querySelector("[data-dt361-name]").textContent =
            O[o.channel]?.name || "TV de Mercado"),
          (U.hidden = !1),
          (R.active = !0),
          !0
        );
      }
      function f() {
        if (!R.active) return;
        const U = l.getElementById("radar332-dialog");
        if (U && !U.open) {
          s.TraderRadar332?.open?.();
          return;
        }
        const te = a().querySelector(".dt361-vid iframe");
        k();
        const ue = m()?.querySelector(".tv347-embedbox");
        (te && ue && ue.prepend(te),
          (R.active = !1),
          (R.host.hidden = !0),
          R.host.removeAttribute("style"));
      }
      s.DiarioTv361 = {
        onRadarOpen: () => {
          R.active && f();
        },
        isFloating: () => R.active,
      };
      function h() {
        const U = O[o.channel],
          te = g();
        return !U || !te
          ? ""
          : R.active
            ? '<div class="tv347-embedbox"><div class="dt361-wait">Transmissão no mini player</div><div class="tv347-embednotice">Áudio e vídeo controlados no canal.</div></div>'
            : `<div class="tv347-embedbox"><iframe title="${G(U.name)} · reprodução externa não verificada" src="${G(te)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><div class="tv347-embednotice" role="status">⚠ Reprodução experimental · o quadro não confirma que a emissora esteja ao vivo. Se surgir erro, gravação ou tela vazia, use o canal oficial.</div></div>`;
      }
      function Q(U, te) {
        return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TV de Mercado · ${G(U.name)}</title><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#101113;color:#efeeeb;font:14px system-ui,-apple-system,Segoe UI,sans-serif}.head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;background:#1f2124;border-bottom:1px solid #4a4e55;flex-wrap:wrap}.title{font-weight:750}.tip{color:#a5a9b1;font-size:12px}.tv{width:100%;height:min(75vh,calc(100vw * .5625));min-height:260px;background:#0a0a0b;display:block;border:0}.foot{padding:12px 16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}a,button{color:#d8d5cf;border:1px solid #545961;background:#202225;border-radius:6px;padding:8px 12px;text-decoration:none;cursor:pointer;font:inherit}.foot span{font-size:12px;color:#abaeb6;flex:1;min-width:180px}</style></head><body><div class="head"><div><div class="title">📺 Diário Trader · ${G(U.name)}</div><div class="tip">Janela independente no PC · reprodução externa não verificada</div></div><span class="tip">Áudio inicialmente mudo: libere no vídeo</span></div><iframe class="tv" title="Transmissão de ${G(U.name)}" src="${G(te)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="foot"><a target="_blank" rel="noopener noreferrer" href="${G(U.url)}">Abrir canal oficial ↗</a><button type="button" id="close-tv">Fechar janelinha</button><span>Você pode voltar ao Diário Trader ou ao Profit Pro. Se fechar a janela, a TV para. A emissora pode bloquear a reprodução.</span></div></body></html>`;
      }
      function J(U, te, ue) {
        (U.document.open(),
          U.document.write(Q(te, ue)),
          U.document.close(),
          U.document
            .getElementById("close-tv")
            ?.addEventListener("click", () => U.close()),
          U.focus(),
          d(),
          k());
      }
      function v() {
        const U = O[o.channel] || O.bmc,
          te = g();
        if (!te) {
          ((o.liveError =
            "Este canal ainda não possui player incorporável. Use o canal oficial."),
            k());
          return;
        }
        let ue = null;
        try {
          ue = s.open(
            "",
            "diario_trader_tv_independente_v354",
            "popup=yes,width=760,height=540,resizable=yes,scrollbars=yes",
          );
        } catch {}
        if (!ue) {
          s.alert(
            "O navegador bloqueou a janelinha. Permita pop-ups para este site ou use Abrir canal oficial.",
          );
          return;
        }
        try {
          J(ue, U, te);
        } catch {
          try {
            ue.location.href = U.url;
          } catch {}
          s.alert(
            "O navegador não permitiu abrir a janela interna. Abrimos a página oficial do canal.",
          );
        }
      }
      function I() {
        if (!s.documentPictureInPicture?.requestWindow) {
          v();
          return;
        }
        const U = O[o.channel] || O.bmc,
          te = g();
        if (!te) {
          ((o.liveError =
            "Este canal não possui player incorporável neste momento."),
            k());
          return;
        }
        s.documentPictureInPicture
          .requestWindow({ width: 660, height: 490 })
          .then((ue) => {
            try {
              J(ue, U, te);
            } catch {
              try {
                ue.close();
              } catch {}
              ((o.liveError =
                "Não foi possível preencher o PiP. Tente a janela comum."),
                k());
            }
          })
          .catch(() => {
            ((o.liveError =
              "Seu navegador impediu o PiP. Use o botão Janela comum (PC)."),
              k());
          });
      }
      function k() {
        const U = m();
        if (!U) return;
        const te = P(),
          ue = te.length ? o.slide % te.length : 0,
          ge = te[ue],
          oe = o.tab === "live",
          ee = !oe && o.proactive ? E() : null,
          ae = O[o.channel] || O.bmc,
          se = H(ae);
        ((U.className = "tv343" + (o.expanded ? " tv343-large" : "")),
          (U.innerHTML = `<div class="tv343-top"><div><small>DIÁRIO TRADER · CENTRAL DE MERCADO</small><strong>📺 TV de Mercado</strong></div><div class="tv343-toptools">${oe && o.playing ? c("mini", "▣ Mini player") : ""}${c("collapse", o.collapsed ? "Mostrar" : "Recolher")}${c("expand", o.expanded ? "Reduzir" : "Ampliar")}</div></div>${
            o.collapsed
              ? ""
              : `<div class="tv343-controls">${c("trader", "🎙️ Trader TV", o.tab === "trader" ? 'aria-pressed="true"' : "")}${c("live", "📺 Canais ao vivo", o.tab === "live" ? 'aria-pressed="true"' : "")}</div>${oe ? "" : `<div class="tv345-tools" role="group" aria-label="Preferências da Trader TV"><label>Mostrar <select data-tv345-topic aria-label="Filtrar boletim"><option value="all" ${o.topic === "all" ? "selected" : ""}>Tudo</option><option value="br" ${o.topic === "br" ? "selected" : ""}>Brasil</option><option value="world" ${o.topic === "world" ? "selected" : ""}>Exterior</option><option value="indices" ${o.topic === "indices" ? "selected" : ""}>Índices</option></select></label>${c("autoplay", o.auto ? "⏸ Rotação ligada" : "▶ Rotação 30 s", o.auto ? 'aria-pressed="true"' : "")}${c("proactive", o.proactive ? "🔔 Destaques ligados" : "🔕 Destaques desligados", o.proactive ? 'aria-pressed="true"' : "")}</div>${ee ? `<div class="tv345-alert" role="status"><strong>${G(ee.label)}</strong><span>${G(ee.txt.slice(0, 125))}</span>${ee.kind === "news" ? c("dismiss-alert", "×", 'aria-label="Dispensar destaque"') : ""}</div>` : ""}`}${
                  oe
                    ? `<div class="tv344-channels" role="group" aria-label="Escolha o canal">${Object.entries(
                        O,
                      )
                        .map(([me, ve]) =>
                          c(
                            "channel-" + me,
                            ve.name,
                            o.channel === me ? 'aria-pressed="true"' : "",
                          ),
                        )
                        .join("")}</div>`
                    : ""
                }<div class="tv343-screen">${oe ? (se && o.playing ? h() : `<div class="tv343-stage"><span class="tv343-kicker">${G(ae.lang.toUpperCase())} · CANAL EXTERNO</span><h3>${G(ae.name)}</h3><p>${G(ae.desc)}</p>${se ? c("start-live", "▶ Testar sinal do canal") : ""}<a href="${G(ae.url)}" rel="noopener noreferrer" target="_blank">▶ Abrir transmissão oficial ↗</a></div>`) : ge ? `<div class="tv343-stage"><span class="tv343-kicker">${G(ge.tag)}</span><h3>${G(ge.title)}</h3><p>${G(ge.detail.slice(0, ge.url ? 250 : 500))}</p><small>${G(ge.source)}</small>${ge.url ? `<a href="${G(ge.url)}" rel="noopener noreferrer" target="_blank">Abrir notícia na fonte</a>` : ""}</div>` : '<div class="tv343-stage"><span class="tv343-kicker">AGUARDANDO FONTES</span><h3>Boletim ainda indisponível</h3><p>Atualize a Central de Mercado. A Trader TV usa notícias, cotações e o Giro já publicados.</p></div>'}</div>${oe ? `<details class="tv350-choose tv352-advanced"><summary>Teste avançado · link oficial de vídeo</summary><label for="tv350-link">Link de transmissão atual do YouTube (opcional)</label><div class="tv350-entry"><input id="tv350-link" type="url" inputmode="url" autocomplete="off" placeholder="Cole um link youtube.com/watch?v=..." aria-label="Link do vídeo ao vivo" value=""><button type="button" data-tv343="use-link">Testar link</button><button type="button" data-tv343="clear-link" ${o.manualVideo[o.channel] ? "" : "disabled"}>Limpar</button></div><small role="status">${G(o.liveError || (o.manualVideo[o.channel] ? "Link fornecido manualmente · confirme se está ao vivo." : "Sem live confirmada · links fixos antigos foram removidos."))}</small></details>` : ""}<div class="tv343-bottom">${oe ? `${se ? (s.documentPictureInPicture?.requestWindow ? c("pip", "▣ Flutuante PiP (PC)") : "") + c("floating", "▣ Janela comum (PC)") : ""}<a href="${G(ae.url)}" target="_blank" rel="noopener noreferrer">▶ Abrir no YouTube · PiP no iPhone ↗</a>${se && o.playing ? c("stop-live", "■ Parar vídeo") : ""}${o.channel === "bloomberg" ? c("captions", "CC · Legendas") : ""}<span>${G(ae.lang)} · Áudio controlado pelo canal</span>` : `${c("prev", "◀ Anterior")}${c("next", "Próxima ▶")}${c("speak", "🔊 Ouvir boletim")}${c("stop-speech", "■ Silenciar")}${c("giro", o.loadingGiro ? "Consultando…" : "Carregar Giro IA", o.loadingGiro ? "disabled" : "")}<span>${te.length ? ue + 1 + "/" + te.length : "0/0"} · Leitura por voz do aparelho</span>`}</div><div class="tv343-foot">${oe ? "No PC: use PiP flutuante (quando disponível) ou Janela comum para acompanhar enquanto usa outros programas. No iPhone: abra o canal no YouTube e use o Picture-in-Picture, se disponível nas configurações do iOS e do canal. Fechar totalmente o app ou o navegador pode interromper o vídeo. Transmissão externa não verificada; confira o selo AO VIVO no próprio player." : "O Giro é uma análise com IA previamente publicada; as demais cenas são manchetes atribuídas às fontes, não análises geradas em tempo real."}</div>`
          }`));
      }
      function L() {
        try {
          s.speechSynthesis?.cancel();
        } catch {}
      }
      function d() {
        ((o.playing = !1),
          R.active &&
            (R.host?.querySelector("iframe")?.remove(),
            (R.host.hidden = !0),
            R.host.removeAttribute("style"),
            (R.active = !1)));
        const U = m();
        U && U.querySelector("iframe")?.remove();
      }
      function $(U) {
        o.tab !== U && (L(), d(), (o.tab = U), k());
      }
      async function w() {
        ((o.loadingGiro = !0), k());
        try {
          await s.TraderRadar332?.giro?.();
        } finally {
          ((o.loadingGiro = !1), k());
        }
      }
      function b() {
        L();
        const U = P();
        if (!U.length || !("speechSynthesis" in s)) return;
        const te = U[o.slide % U.length],
          ue = te.url
            ? `Notícia de ${te.source}. ${te.title}. Consulte o link da fonte para os detalhes.`
            : `${te.title}. ${te.detail}`,
          ge = new SpeechSynthesisUtterance(ue.slice(0, 1250));
        ((ge.lang = "pt-BR"), (ge.rate = 0.96), (ge.pitch = 1));
        try {
          const oe = s.speechSynthesis.getVoices();
          ((ge.voice =
            oe.find(
              (ee) =>
                /pt[-_]BR/i.test(ee.lang) && /natural|neural/i.test(ee.name),
            ) ||
            oe.find((ee) => /pt[-_]BR/i.test(ee.lang)) ||
            null),
            s.speechSynthesis.speak(ge));
        } catch {}
      }
      function y(U) {
        if (U === "use-link") {
          const te = m()?.querySelector("#tv350-link")?.value || "",
            ue = q(te);
          if (!ue) {
            ((o.liveError =
              "Cole um link HTTPS válido de um vídeo do YouTube (watch, live ou youtu.be)."),
              d(),
              k());
            return;
          }
          (d(),
            (o.manualVideo[o.channel] = ue),
            (o.liveError =
              "Vídeo informado manualmente · reproduzir não comprova live."),
            (o.playing = !0),
            k());
          return;
        }
        if (U === "clear-link") {
          (d(), delete o.manualVideo[o.channel], (o.liveError = ""), k());
          return;
        }
        if (U.startsWith("channel-")) {
          const te = U.slice(8);
          O[te] && (d(), L(), (o.channel = te), (o.liveError = ""), k());
          return;
        }
        switch (U) {
          case "autoplay":
            ((o.auto = !o.auto), F(), k());
            break;
          case "proactive":
            ((o.proactive = !o.proactive),
              o.proactive || (o.highlight = ""),
              F(),
              k());
            break;
          case "dismiss-alert":
            ((o.highlight = ""), k());
            break;
          case "captions":
            s.alert(
              "Legendas e tradução são controladas pelo YouTube. Se houver CC, abra as configurações do player e procure Legendas → Traduzir automaticamente → Português. Para lives, esse recurso pode não estar disponível.",
            );
            break;
          case "trader":
            $("trader");
            break;
          case "live":
            $("live");
            break;
          case "mini": {
            const te = l.getElementById("radar332-dialog");
            te?.open ? te.close() : n();
            break;
          }
          case "floating":
            v();
            break;
          case "pip":
            I();
            break;
          case "start-live":
            (L(), (o.playing = !0), k());
            break;
          case "stop-live":
            (d(), k());
            break;
          case "collapse":
            ((o.collapsed = !o.collapsed), L(), d());
            try {
              localStorage.setItem(
                "diario-tv343-collapsed",
                o.collapsed ? "1" : "0",
              );
            } catch {}
            k();
            break;
          case "expand":
            ((o.expanded = !o.expanded), k());
            break;
          case "prev":
            (L(), (o.slide = Math.max(0, o.slide - 1)), k());
            break;
          case "next":
            (L(), o.slide++, k());
            break;
          case "speak":
            b();
            break;
          case "stop-speech":
            L();
            break;
          case "giro":
            w();
            break;
        }
      }
      function C() {
        const U = m();
        if (!U || U.dataset.tv343Mounted) return;
        ((U.dataset.tv343Mounted = "1"),
          U.addEventListener("click", (ue) => {
            const ge = ue.target.closest("[data-tv343]");
            ge && y(ge.dataset.tv343);
          }),
          U.addEventListener("change", (ue) => {
            const ge = ue.target.closest("[data-tv345-topic]");
            ge &&
              ["all", "br", "world", "indices"].includes(ge.value) &&
              (L(),
              (o.topic = ge.value),
              (o.slide = 0),
              (o.highlight = ""),
              F(),
              k());
          }));
        const te = l.getElementById("radar332-dialog");
        (te &&
          !te.dataset.tv343Close &&
          ((te.dataset.tv343Close = "1"),
          te.addEventListener("close", () => {
            (L(), !n() && (d(), k()));
          })),
          k());
      }
      const V = l.createElement("style");
      ((V.textContent = `
.tv350-choose{margin:8px 0 8px;padding:8px;border:1px solid #43464d;border-radius:6px;background:#1d1f22;display:grid;gap:8px}.tv350-choose label{font-size:11px;color:#e4e2de;font-weight:650}.tv350-entry{display:flex;align-items:stretch;flex-wrap:wrap;gap:8px}.tv350-entry input{min-width:0;flex:1 1 190px;background:#151618;border:1px solid #52565e;border-radius:6px;color:#f6f6f5;font-size:12px;padding:8px}.tv350-entry button{font-size:11px}.tv350-entry button:disabled{opacity:.4}.tv350-choose small{font-size:11px;color:#abafb6;line-height:1.4}.tv343-toptools{flex-direction:row;flex-wrap:wrap}.tv343-stage{justify-content:center}.tv343-screen{min-height:220px}.tv347-embedbox iframe{height:100%;min-height:220px}.tv347-embednotice{font-size:10px}.tv343-stage a{overflow-wrap:anywhere}
.tv347-embedbox{position:relative;width:100%;height:100%;min-height:250px;display:flex;flex-direction:column}.tv347-embedbox iframe{width:100%;flex:1;min-height:230px;border:0;background:#0f1012}.tv347-embednotice{background:#232528;color:#e3e1dc;font-size:11px;padding:8px 8px;line-height:1.45}.tv343{padding:12px 16px 0;border-bottom:1px solid #3b3e43;color:#f5f4f3;font:13px/1.45 system-ui}.tv343-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.tv343-top small{display:block;color:#cdaa69;font-size:10px;font-weight:700;letter-spacing:.04em}.tv343-top strong{display:block;font-size:16px}.tv343-toptools,.tv343-controls,.tv343-bottom{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tv343 button,.tv343-bottom a{font:inherit;cursor:pointer;background:#2c2f33;color:#f4f3f1;border:1px solid #5a5e67;border-radius:6px;padding:8px 8px;text-decoration:none}.tv343-controls{margin:8px 0 8px}.tv344-channels{display:flex;gap:8px;overflow:auto;white-space:nowrap;padding:0 0 8px;scrollbar-width:thin}.tv344-channels button{flex:none;font-size:11px;padding:8px 8px}.tv343-stage a{margin-top:8px}.tv343 button[aria-pressed="true"]{border-color:#c7a058;background:#232528;color:#dbd8d3}.tv343-screen{width:min(100%,440px);aspect-ratio:16/9;background:radial-gradient(circle at 25% 15%,#373a3f,#101112 78%);border:1px solid #4a4e55;border-radius:8px;overflow:hidden;position:relative}.tv343-screen iframe{border:0;width:100%;height:100%;display:block}.tv343-stage{height:100%;padding:12px 16px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;overflow:auto}.tv343-stage h3{font-size:clamp(14px,2.4vw,19px);line-height:1.25;margin:4px 0;color:#efeeeb}.tv343-stage p{margin:4px 0;font-size:12px;line-height:1.45;overflow:auto;max-height:40%;color:#d7d4cf}.tv343-stage small,.tv343-kicker{color:#d3b57c;font-size:10px;font-weight:700}.tv343-stage a{font-size:11px;color:#d4b57d}.tv343-stage button{align-self:flex-start}.tv343-bottom{margin:8px 0}.tv343-bottom span{font-size:10px;color:#b0b3ba}.tv343-foot{font-size:10px;color:#adb0b7;margin:8px 0 12px}.tv343-large .tv343-screen{width:100%;max-width:none}.tv343-large .tv343-stage h3{font-size:22px}.tv343-large .tv343-screen{aspect-ratio:16/9}@media(max-width:480px){.tv343{padding:8px 12px 0}.tv343-screen{width:100%}.tv343-toptools button{padding:4px 8px}.tv343-stage{padding:8px}.tv343-stage h3{font-size:14px}.tv343-stage p{font-size:11px}.tv343-controls button,.tv343-bottom button{padding:8px 8px;font-size:11px}}
.tv345-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px}.tv345-tools label{font-size:11px;color:#d4b57d}.tv345-tools select{background:#232528;border:1px solid #5a5e67;border-radius:6px;color:#f5f4f3;padding:8px 8px;margin-left:4px;font:inherit}.tv345-tools button{font-size:11px;padding:8px 8px}.tv345-alert{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;padding:8px 8px;margin-bottom:8px;background:#3d3017;border:1px solid var(--ds-line-2);border-radius:6px;font-size:11px}.tv345-alert strong{color:#dfc79a}.tv345-alert span{flex:1;min-width:120px}.tv345-alert button{padding:1px 8px}.tv343-bottom button{min-height:30px}.tv343-bottom a{font-size:11px;background:#1f2124;color:#d4b57d;border-color:#474b52}.tv343-bottom a:focus-visible{outline:2px solid #d0b073}
`),
        l.head.appendChild(V),
        new MutationObserver(C).observe(l.body, { childList: !0, subtree: !0 }),
        C());
      let _ = "";
      setInterval(() => {
        if (!e() || o.collapsed || o.tab !== "trader") return;
        const U = N(),
          te = [U.updated, !!U.giro, U.news?.length, U.indicesAt, o.slide].join(
            "|",
          );
        te !== _ && ((_ = te), u(), k());
      }, 5e3);
      let K = Date.now();
      (setInterval(() => {
        if (!o.auto || !e() || l.hidden || o.collapsed || o.tab !== "trader") {
          K = Date.now();
          return;
        }
        if (Date.now() - K < 3e4) return;
        K = Date.now();
        const U = P();
        U.length > 1 && (L(), (o.slide = (o.slide + 1) % U.length), k());
      }, 1e3),
        (s.TraderTV343 = {
          mount: C,
          stop: () => {
            (L(), d(), k());
          },
          state: o,
        }));
    })(window, document),
    (() => {
      const s = document.createElement("style");
      ((s.id = "au348-aulas-layout"),
        (s.textContent = `
#aup{position:fixed!important;overflow:hidden!important;}
#aup .aup-stage{padding:8px 12px 4px!important;}
#aup .au-lesson-visual{gap:8px!important;}
#aup .aup-options:not([hidden]){display:flex!important;position:absolute!important;left:0;right:0;bottom:0;z-index:120!important;background:#1a1b1e!important;color:#f4f3f2;max-height:min(79dvh,740px)!important;min-height:unset;overflow-y:auto!important;overscroll-behavior:contain;border:1px solid #4b4f57;border-radius:8px 8px 0 0;box-shadow:0 -20px 65px #000000dd;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px))!important;gap:12px;align-items:stretch!important;box-sizing:border-box}
#aup .au348-opt-head{width:100%;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3c3f45;padding-bottom:8px}
#aup .au348-opt-head strong{font-size:18px;display:block;color:#f7f7f6}#aup .au348-opt-head small{display:block;color:#86abcb;font-size:12px;margin-top:4px}
#aup .au348-opt-head button{width:40px!important;height:40px!important;min-height:40px!important;border-radius:999px!important;background:#2d2f34!important}
#aup .au348-first{display:flex;flex-wrap:wrap;gap:8px;width:100%;order:3;border-top:1px solid #3a3d42;padding-top:8px}
#aup .au348-first button{flex:1 1 112px;font-size:11px!important}
#aup .au339-voices{order:1;width:100%;display:flex;flex-direction:column;align-items:stretch;gap:12px;border:none;padding:0}
#aup .au348-mode-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:8px}
#aup .au348-mode-tabs button{font-size:12px!important;white-space:normal;min-height:62px!important;padding:8px 8px!important;text-align:center;border:1px solid #4f535a!important;background:#282a2e!important}
#aup .au348-mode-tabs button[aria-pressed="true"]{background:#212327!important;border:1px solid #45c183!important;color:#efeeeb!important;font-weight:700}
#aup .au348-neural-label{display:flex;width:100%;justify-content:space-between;align-items:center;gap:8px;color:#86abcb;font-size:13px!important}
#aup .au348-neural-label select{flex:1 1 auto;max-width:240px!important;min-width:0!important;background:#292b2f!important;color:#ffffff!important;opacity:1!important;-webkit-text-fill-color:#ffffff!important}
#aup .au348-native{display:grid;gap:8px;width:100%;background:#212326;padding:8px;border-radius:8px;border:1px solid #4a4e55;box-sizing:border-box}
#aup .au348-native strong{font-size:12px;color:#ebeae7}#aup .au348-native small{font-size:11px;color:#86abcb;line-height:1.4}
#aup #au348native{display:block;width:100%;max-width:100%;height:42px}#aup #au348native[hidden]{display:none}
#aup #au339status{display:block;width:100%;font-size:12px!important;line-height:1.45;color:#e3e1dc}
#aup .au348-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
#aup .au348-actions button{min-height:40px!important;font-size:12px!important;white-space:normal}
#aup .au348-actions [data-au340resume]{background:#35383d!important;color:#ffffff!important;border-color:#4dc388!important;font-weight:800}
#aup .au337-status,#aup .au336-opt,#aup #aupvel,#aup #aupvoz,#aup [data-auvozteste]{order:4}
#aup .au337-status{width:100%;font-size:11px}
#aup .aup-ctl{z-index:3!important}
@media(max-width:390px){#aup .au348-mode-tabs button{font-size:11px!important}#aup .aup-options:not([hidden]){padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px))!important}}

/* v349 — Piper gratuito */
#aup .au349-piper{display:grid;gap:8px;width:100%;border:1px solid #2e8a5c;background:#202125;border-radius:8px;padding:12px;box-sizing:border-box}
#aup .au349-piper strong{font-size:14px;color:#efeeeb}#aup .au349-piper small{font-size:12px;color:#66cc99;line-height:1.5}
#aup .au349-piper-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#aup .au349-piper-actions button,#aup .au349-import-btn{min-height:40px;border:1px solid #60656e;background:#303338;color:#efeeeb;border-radius:8px;padding:12px 8px;font-size:12px;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer;box-sizing:border-box}
#aup #au349native{width:100%;max-width:100%;height:40px}#aup #au349native[hidden]{display:none!important}
#aup .au348-native,#aup .au348-neural-label{display:none!important}
#aup .aup-options:not([hidden]){max-height:78dvh!important}
@media(max-width:480px){#aup .au349-piper-actions{grid-template-columns:1fr 1fr}}
`),
        document.head.appendChild(s));
    })(),
    (() => {
      const s = document.createElement("style");
      ((s.id = "v352-consolidacao-ui"),
        (s.textContent = `
#aup .au352-tools{order:5;width:100%;min-width:0;border-top:1px solid #3b3e43;margin-top:8px;padding-top:8px}
#aup .au352-tools summary{cursor:pointer;color:#66cc99;font-size:13px;font-weight:650;padding:8px 4px}
#aup .au352-tools .au348-first{order:initial;border:0;margin-top:8px;padding:0}
#aup .au352-control-label{order:4;width:100%;font-size:12px;line-height:1.2;color:#66cc99;margin:4px 0 -8px;font-weight:650}
#aup .au352-voice-status{order:4;display:block;width:100%;font-size:12px;line-height:1.4;color:#abaeb6}
#aup .aup-options:not([hidden]){gap:8px!important}
#aup .aup-options #aupvel,#aup .aup-options #aupvoz{max-width:100%;width:100%;min-width:0}
#aup .aup-ctl{padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));}
.tv352-advanced{display:block;min-width:0}.tv352-advanced summary{font-size:12px;color:#d4b57d;cursor:pointer;list-style:revert;padding:4px}
.tv352-advanced:not([open]){padding:8px 8px}.tv352-advanced:not([open])> :not(summary){display:none!important}
.tv343-toptools{align-items:center;gap:4px}.tv343-toptools button{min-width:0}
@media(max-width:520px){#aup .aup-ctl{gap:8px!important;padding-left:8px!important;padding-right:8px!important}#aup .aup-ctl .aup-tv-btn,#aup .aup-ctl .aup-options-toggle{font-size:12px!important}#aup .aup-options:not([hidden]){max-height:75dvh!important}}
`),
        document.head.appendChild(s));
    })(),
    (() => {
      const s = document.createElement("style");
      ((s.id = "au351-iphone-voice-layout"),
        (s.textContent = `
/* v351: opções pertencem ao painel de narração; não vazam para o rodapé.
   Safari iOS força cores claras em select sem appearance explícito. */
#aup .aup-options[hidden]{display:none!important}
#aup .aup-options:not([hidden]){display:flex!important;flex-direction:column!important;align-items:stretch!important;position:absolute!important;top:auto!important;left:0!important;right:0!important;bottom:0!important;max-height:min(75dvh,640px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;z-index:200!important;background:#1a1b1e!important;color:#f7f6f5!important;border-radius:8px 8px 0 0!important;box-shadow:0 -20px 75px #000000bb!important;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px))!important}
#aup .aup-options .au336-opt,#aup .aup-options #aupvel,#aup .aup-options #aupvoz,#aup .aup-options [data-auvozteste]{order:4!important;position:static!important;flex:none!important;max-width:100%!important;width:100%!important;margin:0!important;box-sizing:border-box!important}
#aup .aup-options select,#aup .aup-options #aupvel,#aup .aup-options #aupvoz{appearance:none!important;-webkit-appearance:none!important;border:1px solid #5a5e67!important;border-radius:8px!important;background:#292c30!important;color:#fafaf9!important;-webkit-text-fill-color:#fafaf9!important;opacity:1!important;min-height:43px!important;height:43px!important;padding:8px 12px!important;font:500 14px/1.2 system-ui,-apple-system,sans-serif!important;box-shadow:none!important}
#aup .aup-options select option{background:#292c30!important;color:#ffffff!important}
#aup .aup-options [data-auvozteste]{background:#27292d!important;color:#efeeeb!important;border:1px solid #2e8a5c!important;border-radius:8px!important;min-height:42px!important}
#aup .aup-options .au336-opt{display:flex!important;gap:8px;align-items:center;min-height:30px;font-size:13px!important;color:#dcdad5!important;background:none!important}
#aup .aup-options .au336-opt input{width:18px!important;height:18px!important;flex:none!important}
#aup .au339-voices{width:100%!important;min-width:0!important;box-sizing:border-box!important}
#aup .au349-piper{display:none!important}
#aup:has([data-au348mode="piper"][aria-pressed="true"]) .au349-piper{display:grid!important}
#aup .au348-actions [data-au349test]{display:none!important}
#aup:has([data-au348mode="piper"][aria-pressed="true"]) .au348-actions [data-au349test]{display:block!important}
#aup .aup-stage{min-height:0!important;flex:1 1 auto!important}
#aup .aup-ctl{flex:0 0 auto!important}
@media(max-width:520px){#aup .aup-options .au348-mode-tabs button{min-height:54px!important}#aup .aup-options:not([hidden]){max-height:72dvh!important}}
`),
        document.head.appendChild(s));
    })(),
    (() => {
      const s = document.createElement("style");
      ((s.id = "au353-ios-voice-feedback"),
        (s.textContent = `
#aup .au353-voice-alert[hidden]{display:none!important}
#aup .au353-voice-alert{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;flex:none;max-width:100%;box-sizing:border-box;margin:4px 12px;background:#3a221e;border:1px solid var(--ds-line-2);color:#dfc79a;padding:8px 12px;border-radius:8px;font:500 12px/1.4 system-ui,-apple-system,sans-serif}
#aup .au353-voice-alert span{flex:1 1 180px}
#aup .au353-voice-alert button{flex:0 1 auto;min-height:40px!important;padding:8px 12px!important;border-radius:6px!important;color:#efeeeb!important;background:#32353a!important;border:1px solid #46c184!important;font-size:12px!important}
#aup .aup-options .au348-mode-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#aup .au352-tools [data-au348mode="piper"]{font-size:11px!important;min-height:38px!important}
#aup .aup-options .au352-tools{order:6!important}
@media(max-width:520px){#aup .au353-voice-alert{margin:4px 8px;padding:8px}}
`),
        document.head.appendChild(s));
    })(),
    (function () {
      "use strict";
      let s = null;
      (document.addEventListener(
        "pointerdown",
        (l) => {
          const r = l.target.closest(".au361-grip,.dt361-grip");
          if (!r || l.button !== 0) return;
          const j = r.closest("#aup.au361-floating,#dt361-tvmini");
          if (!j) return;
          const O = j.getBoundingClientRect();
          s = {
            id: l.pointerId,
            box: j,
            startX: l.clientX,
            startY: l.clientY,
            left: O.left,
            top: O.top,
          };
          try {
            r.setPointerCapture(l.pointerId);
          } catch {}
          l.preventDefault();
        },
        !0,
      ),
        document.addEventListener(
          "pointermove",
          (l) => {
            const r = s;
            if (!r || r.id !== l.pointerId || !r.box.isConnected) return;
            const j = r.box.getBoundingClientRect().width,
              O = r.box.getBoundingClientRect().height,
              G = Math.max(
                6,
                Math.min(innerWidth - j - 6, r.left + l.clientX - r.startX),
              ),
              o = Math.max(
                6,
                Math.min(innerHeight - O - 6, r.top + l.clientY - r.startY),
              );
            (r.box.style.setProperty("left", G + "px", "important"),
              r.box.style.setProperty("top", o + "px", "important"),
              r.box.style.setProperty("right", "auto", "important"),
              r.box.style.setProperty("bottom", "auto", "important"));
          },
          !0,
        ),
        document.addEventListener(
          "pointerup",
          (l) => {
            s?.id === l.pointerId && (s = null);
          },
          !0,
        ),
        document.addEventListener(
          "pointercancel",
          (l) => {
            s?.id === l.pointerId && (s = null);
          },
          !0,
        ));
    })(),
    (function (s, l) {
      "use strict";
      const r = "diario-terminal-fase-auto-v369:",
        j = { pre: "Pré-mercado", live: "Pregão BR", post: "Pós-mercado" },
        O = () =>
          s.DIARIO_DEMO ? "demo" : (typeof SESS < "u" && SESS?.uid) || null;
      function G(E) {
        if (!(E instanceof Date) || !Number.isFinite(E.getTime())) return null;
        const u = Object.fromEntries(
          new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Sao_Paulo",
            hourCycle: "h23",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
            .formatToParts(E)
            .filter((m) => m.type !== "literal")
            .map((m) => [m.type, m.value]),
        );
        if (u.weekday === "Sat" || u.weekday === "Sun") return "post";
        const P = Number(u.hour) * 60 + Number(u.minute);
        return P < 540 ? "pre" : P < 1080 ? "live" : "post";
      }
      const o = () => G(new Date()),
        F = () => (O() ? r + O() : null);
      function N() {
        try {
          const E = F();
          return !!E && localStorage.getItem(E) === "1";
        } catch {
          return !1;
        }
      }
      function e(E) {
        const u = F();
        if (!u) throw Error("Entre na sua conta.");
        try {
          localStorage.setItem(u, E ? "1" : "0");
        } catch {
          throw Error("Não foi possível salvar a preferência neste navegador.");
        }
      }
      let i = null;
      const B = () => {
        try {
          return s.TRM?.TS?.() || null;
        } catch {
          return null;
        }
      };
      function Y(E) {
        if (!E || !s.TerminalOrganizador322?.apply)
          throw Error("O organizador ainda não está disponível.");
        s.TerminalOrganizador322.apply(E);
      }
      function alterna369() {
        try {
          const R = !N();
          (e(R),
            R &&
              ((B()?.ws || "").startsWith("ws321_auto_")
                ? ((i = o()), Y(i))
                : ((i = null),
                  typeof s.toast == "function" &&
                    s.toast(
                      "Modo automático habilitado, mas pausado neste Workspace personalizado. Selecione uma rotina para começar.",
                    ))),
            z());
        } catch (R) {
          typeof s.toast == "function" && s.toast(R.message);
        }
      }
      s.TerminalAcoes?.registrar(
        "@auto",
        alterna369,
        () => l.body.classList.contains("trmon") && !s.TRPOP,
        () => (N() ? "Desativar troca automática de layout" : "Ativar troca automática de layout"),
      );
      function z() {
        const E = o(),
          u = N(),
          P = l.querySelector(".trbar");
        if (!P || s.TRPOP) return;
        let m = P.querySelector("[data-t369-suggest]"),
          c = P.querySelector("[data-t369-auto]");
        (m ||
          ((m = l.createElement("button")),
          (m.type = "button"),
          (m.className = "trbtn"),
          (m.dataset.t369Suggest = "1"),
          m.addEventListener("click", () => {
            try {
              Y(o());
            } catch (R) {
              typeof s.toast == "function" && s.toast(R.message);
            }
          }),
          P.appendChild(m)),
          c ||
            ((c = l.createElement("button")),
            (c.type = "button"),
            (c.className = "trbtn"),
            (c.dataset.t369Auto = "1"),
            c.addEventListener("click", alterna369),
            P.appendChild(c)));
        const q = E ? j[E] : "indisponível";
        ((m.textContent = "Rotina: " + q),
          (m.title =
            "Sugestão por horário de Brasília, não confirmação de abertura da bolsa. Clique para abrir o layout sem executar ordens."));
        const H = B()?.ws || "",
          g = u && !H.startsWith("ws321_auto_");
        ((c.textContent = u
          ? g
            ? "Auto: pausado"
            : "Auto: ligado"
          : "Auto: desligado"),
          (c.title =
            "Alternância opcional de layouts por horário, limitada a Workspaces automáticos. Layout personalizado não é alterado automaticamente."),
          c.setAttribute("aria-pressed", u ? "true" : "false"));
      }
      function M() {
        const E = o(),
          u = B();
        if (!(!E || !u)) {
          if (
            N() &&
            i !== E &&
            u.ws.startsWith("ws321_auto_") &&
            u.ws !== "ws321_auto_" + E
          ) {
            i = E;
            try {
              Y(E);
            } catch {}
          } else i = E;
          z();
        }
      }
      ((s.TerminalFases369 = {
        phaseAtBR: G,
        current: o,
        automatic: N,
        setAutomatic: e,
        tick: M,
        mount: z,
      }),
        s.TraderUI?.onRender &&
          s.TraderUI.onRender("terminal-fases-v369", () => {
            z();
          }),
        l.readyState === "loading"
          ? l.addEventListener(
              "DOMContentLoaded",
              () => {
                (z(), M());
              },
              { once: !0 },
            )
          : (z(), M()),
        setInterval(() => {
          l.hidden || M();
        }, 60 * 1e3));
    })(window, document),
    (function (s, l) {
      "use strict";
      function r(G) {
        const o = Array.isArray(G?.rows) ? G.rows : [],
          F = o.filter(
            (Y) =>
              Y?.px != null &&
              Y.px !== "" &&
              Number.isFinite(Number(Y.px)) &&
              Number(Y.px) > 0,
          ),
          N = o.filter((Y) => Y?.atraso === !0).length,
          e = o.length - F.length,
          i =
            G?.timestamp && Number.isFinite(new Date(G.timestamp).getTime())
              ? new Date(G.timestamp).toISOString()
              : null,
          B =
            typeof G?.status == "string"
              ? G.status.slice(0, 90)
              : "sem conexão de leitura";
        return {
          status: B,
          registros: o.length,
          precosValidos: F.length,
          precosAusentes: e,
          atrasadosDeclarados: N,
          atrasoNaoInformado: o.filter(
            (Y) => Y?.atraso !== !0 && Y?.atraso !== !1,
          ).length,
          observadoEm: i,
          alerta: o.length
            ? e || N || /antiga|falha|aguardando|indisponível/i.test(B)
              ? "Confira fontes, timestamps e situação do mercado."
              : "Valores consultivos; não equivalem a feed tick-by-tick."
            : "Nenhuma cotação disponível no cache.",
        };
      }
      function j() {
        const G = l.querySelector("#tr-qualidade-v374");
        if (G) {
          G.showModal?.();
          return;
        }
        const o = l.createElement("dialog");
        ((o.id = "tr-qualidade-v374"),
          Object.assign(o.style, {
            width: "min(490px,94vw)",
            maxHeight: "75dvh",
            background: "#17191b",
            color: "#f7f6f5",
            border: "1px solid #797f8b",
            borderRadius: "12px",
            padding: "16px",
            font: "13px/1.5 system-ui",
          }));
        const F = l.createElement("h2");
        ((F.textContent = "Qualidade dos dados · Terminal"), o.append(F));
        const N = l.createElement("pre");
        ((N.style.whiteSpace = "pre-wrap"),
          (N.style.overflowWrap = "anywhere"),
          o.append(N));
        const e = l.createElement("p");
        ((e.textContent =
          "Consulta ao último cache do Terminal. Horário do registro não confirma se o mercado está aberto. Sem execução de ordens."),
          o.append(e));
        function i() {
          const z = r(s.TraderConsulta325?.getQuotes?.());
          N.textContent = JSON.stringify(z, null, 2);
        }
        const B = l.createElement("button");
        ((B.type = "button"),
          (B.textContent = "Atualizar diagnóstico"),
          B.addEventListener("click", i),
          o.append(B));
        const Y = l.createElement("button");
        ((Y.type = "button"),
          (Y.textContent = "Fechar"),
          (Y.style.marginLeft = "10px"),
          Y.addEventListener("click", () => o.close()),
          o.append(Y),
          l.body.append(o),
          i(),
          o.showModal?.());
      }
      function O() {
        const G = l.querySelector(".trbar");
        if (!G || G.querySelector("[data-tr-qualidade-v374]")) return;
        const o = l.createElement("button");
        ((o.type = "button"),
          (o.className = "trbtn"),
          (o.dataset.trQualidadeV374 = "1"),
          (o.textContent = "Qualidade dos dados"),
          (o.title =
            "Diagnóstico das cotações existentes; não transmite dados e não executa ordens."),
          o.addEventListener("click", j),
          G.appendChild(o));
      }
      ((s.TerminalQualidade374 = { inspect: r, mount: O }),
        s.TraderUI?.onRender &&
          s.TraderUI.onRender("terminal-qualidade-v374", O),
        l.readyState === "loading"
          ? l.addEventListener("DOMContentLoaded", O, { once: !0 })
          : O());
    })(window, document));
} catch (e) {
  console.error("[v522] falha em interface.js", e);
}
