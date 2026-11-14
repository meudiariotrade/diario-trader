/* Diário de Trader v560 — núcleo (paleta Terminal Grafite). Gerado a partir de: recursos.js, inicio.js, terminal-chart-mode-v415.js, app.js */
/* v594 — registro de ações do Terminal: cada recurso registra sua função; o Início do Terminal e a barra de Painéis
   executam a mesma função, sem precisar da barra antiga montada (CLAUDE.md, tela única). */
window.TerminalAcoes =
  window.TerminalAcoes ||
  (() => {
    const m = new Map();
    return Object.freeze({
      registrar(id, fn, pode, rotulo) {
        m.set(id, { fn, pode, rotulo });
      },
      disponivel(id) {
        const a = m.get(id);
        try {
          return !!a && (!a.pode || !!a.pode());
        } catch {
          return !1;
        }
      },
      rotulo(id) {
        const a = m.get(id);
        try {
          return (a && a.rotulo && a.rotulo()) || "";
        } catch {
          return "";
        }
      },
      executar(id, ...x) {
        const a = m.get(id);
        if (!a) return !1;
        return (a.fn(...x), !0);
      },
    });
  })();
try {
  window.TraderCardArt = Object.freeze({
    "cards-art/colecao-sazonal.png": "card-colecao-sazonal.jpg",
    "cards-art/halloween-touro.png": "card-halloween-touro.jpg",
    "cards-art/mercados-brasil-eua.png": "card-mercados-brasil-eua.jpg",
    "cards-art/natal-touro.png": "card-natal-touro.jpg",
  });
} catch (e) {
  console.error("[v522] falha em recursos.js", e);
}
try {
  ((function (w) {
    "use strict";
    w.APP_MODULES_READY = new Promise((x) => {
      w.document?.readyState !== "complete"
        ? w.document.addEventListener("DOMContentLoaded", x, { once: !0 })
        : x();
    });
    const f = new URLSearchParams(w.location?.search || "").get("demo") === "1";
    w.DIARIO_DEMO = f;
    let u;
    try {
      u = w.localStorage;
    } catch {}
    if (!f) {
      ((w.CLOUD_OK = 1),
        (w.APP_STORAGE = u || {
          getItem: () => null,
          setItem() {},
          removeItem() {},
        }),
        (w.APP_DEMO_READY = Promise.resolve()));
      return;
    }
    const V = "diario-demo-v286:",
      U = new Map();
    ((w.APP_STORAGE = {
      getItem(x) {
        try {
          return u?.getItem(V + x) ?? U.get(x) ?? null;
        } catch {
          return U.get(x) ?? null;
        }
      },
      setItem(x, m) {
        U.set(x, String(m));
        try {
          u?.setItem(V + x, String(m));
        } catch {}
      },
      removeItem(x) {
        U.delete(x);
        try {
          u?.removeItem(V + x);
        } catch {}
      },
      clear() {
        for (const x of Object.keys(u || {}))
          x.startsWith(V) && u.removeItem(x);
        U.clear();
      },
    }),
      (w.CLOUD_OK = 0));
    const W = w.fetch.bind(w);
    w.fetch = (x, m = {}) => {
      const r = new URL(typeof x == "string" ? x : x.url, w.location.href),
        e = String(m.method || x?.method || "GET").toUpperCase();
      return (e === "GET" && w.TraderResources?.has(x)) ||
        (e === "GET" &&
          r.origin === w.location.origin &&
          /\.(js|css|ttf|otf|png|jpe?g|svg|webmanifest)$/.test(r.pathname))
        ? W(x, m)
        : Promise.reject(
            new Error(
              "Modo demonstrativo: consultas externas e alterações na conta estão desativadas.",
            ),
          );
    };
    const y = document.createElement("meta");
    ((y.httpEquiv = "Content-Security-Policy"),
      (y.content =
        "connect-src 'self'; frame-src 'none'; script-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; form-action 'none'"),
      document.head.append(y));
    const P = (x) =>
        `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`,
      j = new Date(),
      H = P(j),
      v = new Date(j);
    v.setDate(v.getDate() - 2);
    const z = P(v),
      k = {
        seed: 1,
        mt: Date.now(),
        trades: [
          {
            id: "demo-trade-1",
            tipo: "D",
            ativo: "WIN · DEMO",
            side: "C",
            dt: z + "T10:00",
            dtx: z + "T10:30",
            entry: 1e5,
            stop: 99900,
            exit: 100200,
            qty: 1,
            pt: 0.2,
            cost: 0,
            setup: "Rompimento demonstrativo",
            rules: "s",
            err: "Nenhum",
          },
          {
            id: "demo-trade-2",
            tipo: "D",
            ativo: "WIN · DEMO",
            side: "C",
            dt: H + "T10:00",
            dtx: H + "T10:20",
            entry: 1e5,
            stop: 99900,
            exit: 99900,
            qty: 1,
            pt: 0.2,
            cost: 0,
            setup: "Exemplo de operação",
            rules: "n",
            err: "Não segui minha rotina",
          },
        ],
        rules: [
          { id: "demo-rule-1", cat: 0, t: "Ler o plano antes de operar", u: 1 },
          {
            id: "demo-rule-2",
            cat: 1,
            t: "Definir o risco e a invalidação",
            u: 1,
          },
        ],
        days: {
          [H]: {
            chk: { "demo-rule-1": !0 },
            plano:
              "DADOS FICTÍCIOS. Teste o diário, os modelos e o checklist sem alterar seus registros reais.",
            resumo: "",
            aprend: "",
            u: Date.now(),
          },
          [z]: {
            chk: { "demo-rule-1": !0, "demo-rule-2": !0 },
            resumo: "Sessão fictícia usada para explorar a revisão semanal.",
            aprend: "Registrar a decisão ajuda a revisar o processo.",
            u: 1,
          },
        },
        ax: {},
        del: {},
        books: [],
      };
    w.APP_DEMO_READY = new Promise((x) => {
      try {
        const m = w.indexedDB.open("diario-trader-demo-v286", 1);
        ((m.onupgradeneeded = () => {
          const r = m.result;
          (r.objectStoreNames.contains("kv") || r.createObjectStore("kv"),
            r.objectStoreNames.contains("img") || r.createObjectStore("img"));
        }),
          (m.onerror = () => x()),
          (m.onsuccess = () => {
            const r = m.result,
              e = r.transaction("kv", "readwrite"),
              n = e.objectStore("kv"),
              a = n.get("s");
            ((a.onsuccess = () => {
              a.result || n.put(k, "s");
            }),
              (e.oncomplete = () => {
                (r.close(), x());
              }),
              (e.onabort = () => {
                (r.close(), x());
              }));
          }));
      } catch {
        x();
      }
    });
  })(typeof window > "u" ? globalThis : window),
    (window.SUPA_URL = "https://wbpsmszecpzioaijfnsl.supabase.co"),
    (window.SUPA_KEY = "sb_publishable_GNuBD5Oyo2Wk-iE2s4TbUQ_1XiKvzhV"),
    (function (w) {
      "use strict";
      let f = null,
        u = null,
        V = null;
      function U() {
        return w.TraderResources
          ? Promise.resolve()
          : (V ||
              (V = new Promise((y, P) => {
                const j = document.createElement("script");
                ((j.src = "fontes-pdf.js"),
                  (j.onload = () =>
                    w.TraderResources
                      ? y()
                      : P(Error("Recursos do PDF não iniciaram"))),
                  (j.onerror = () => P(Error("Recursos do PDF indisponíveis"))),
                  document.head.append(j));
              }).catch((y) => {
                throw ((V = null), y);
              })),
            V);
      }
      function W() {
        return w.fontkit
          ? Promise.resolve(w.fontkit)
          : (f ||
              (f = new Promise((y, P) => {
                const j = document.createElement("script");
                ((j.src = "fontkit.umd.min.js"),
                  (j.onload = () =>
                    w.fontkit ? y(w.fontkit) : P(Error("Fontkit não iniciou"))),
                  (j.onerror = () => P(Error("Fontkit indisponível"))),
                  document.head.append(j));
              }).catch((y) => {
                throw ((f = null), y);
              })),
            f);
      }
      w.DiarioFontes = async function (y) {
        const [P] = await Promise.all([W(), U()]);
        y.registerFontkit(P);
        const j = {
          r: "sans",
          b: "sans-bold",
          i: "sans-italic",
          serif: "serif-bold",
          serifItalic: "serif-italic",
        };
        u ||
          (u = Promise.all(
            Object.entries(j).map(async ([v, z]) => {
              const k = await fetch(`pdf-${z}.ttf`, {
                signal: AbortSignal.timeout(1e4),
              });
              if (!k.ok) throw Error("Fonte indisponível: " + z);
              return [v, new Uint8Array(await k.arrayBuffer())];
            }),
          ).catch((v) => {
            throw ((u = null), v);
          }));
        const H = {};
        for (const [v, z] of await u)
          H[v] = await y.embedFont(z, { subset: !0 });
        return H;
      };
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      function f(W) {
        if (typeof W == "number") return Number.isFinite(W) ? W : null;
        if (typeof W != "string" || !W.trim()) return null;
        let y = W.trim();
        if (y.includes(",")) {
          if (!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(y)) return null;
          y = y.replace(/\./g, "").replace(",", ".");
        } else if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(y)) return null;
        return Number.isFinite(Number(y)) ? Number(y) : null;
      }
      const u = (W) => f(W) ?? 0;
      function V(W, y, P, j = () => ({ cl: "outro" })) {
        const H = (y.mk || "BR") + ":" + y.tk,
          v = y.mk === "US" ? u(y.fx) || P || 0 : 1,
          z = u(y.q),
          k = u(y.p),
          x = u(y.cs);
        if (y.tp === "A" || y.tp === "R")
          return { fluxo: 0, prov: 0, caixa: (y.tp === "A" ? 1 : -1) * k * v };
        const m =
          W[H] ??
          (W[H] = {
            k: H,
            mk: y.mk || "BR",
            tk: y.tk,
            cl: y.cl || j(y.tk).cl,
            q: 0,
            c: 0,
            prov: 0,
            real: 0,
            first: null,
            cR: 0,
          });
        if ((y.cl && (m.cl = y.cl), y.tp === "P")) {
          const r = (z ? k * z : k) - x;
          return ((m.prov += r), { fluxo: 0, prov: r * v, caixa: r * v, k: H });
        }
        if (y.tp === "E") {
          const r = u(y.f);
          if (y.ev === "desd" && r > 0) m.q *= r;
          else if (y.ev === "grup" && r > 0) m.q /= r;
          else if (y.ev === "bonif" && r > 0) {
            const e = (m.q * r) / 100;
            ((m.q += e), (m.c += e * u(y.p)), (m.cR += e * u(y.p) * v));
          }
          return { fluxo: 0, prov: 0, caixa: 0, k: H };
        }
        if (y.tp === "C")
          return (
            (m.q += z),
            (m.c += z * k + x),
            (m.cR += (z * k + x) * v),
            m.first || (m.first = y.d),
            { fluxo: (z * k + x) * v, prov: 0, caixa: -(z * k + x) * v, k: H }
          );
        if (y.tp === "V") {
          const r = m.q > 0 ? m.c / m.q : 0,
            e = m.q > 0 ? m.cR / m.q : 0,
            n = Math.min(z, m.q);
          return (
            (m.real += n * k - x - r * n),
            (m.c -= r * n),
            (m.cR -= e * n),
            (m.q -= n),
            m.q < 1e-9 && ((m.q = 0), (m.c = 0), (m.cR = 0), (m.first = null)),
            { fluxo: -(n * k - x) * v, prov: 0, caixa: (n * k - x) * v, k: H }
          );
        }
        return { fluxo: 0, prov: 0, caixa: 0 };
      }
      function U(W = [], y = "9999-12-31") {
        const P = {},
          j = [],
          H = new Set();
        let v = 0,
          z = 0;
        const k = (x, m, r) =>
          j.push({
            id: x.id || "",
            ticker: x.tk || "",
            date: x.d || "",
            index: W.indexOf(x),
            code: m,
            message: r,
          });
        for (const x of W.slice().sort(
          (m, r) =>
            String(m.d || "").localeCompare(String(r.d || "")) ||
            (m.tp === "E") - (r.tp === "E"),
        )) {
          if (x.d > y) continue;
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(x.d || "") ||
            Number.isNaN(Date.parse(x.d + "T12:00:00Z")) ||
            new Date(x.d + "T12:00:00Z").toISOString().slice(0, 10) !== x.d
          ) {
            k(x, "date", "Data inválida.");
            continue;
          }
          if (x.id && H.has(x.id)) {
            k(x, "duplicate", "Identificador repetido.");
            continue;
          }
          if (
            (x.id && H.add(x.id),
            !["C", "V", "P", "E", "A", "R"].includes(x.tp))
          ) {
            k(x, "type", "Tipo de lançamento não reconhecido.");
            continue;
          }
          const m = f(x.q),
            r = f(x.p),
            e = f(x.cs ?? 0),
            n = f(x.fx),
            a = (x.mk || "BR") + ":" + x.tk;
          if (e == null || e < 0) {
            k(x, "fee", "Custo inválido ou negativo.");
            continue;
          }
          if (
            x.tp !== "E" &&
            (r == null || r < 0 || (x.tp === "C" && r === 0))
          ) {
            k(x, "price", "Preço ou valor inválido.");
            continue;
          }
          if (["C", "V"].includes(x.tp) && !(m > 0)) {
            k(x, "quantity", "Quantidade deve ser positiva.");
            continue;
          }
          if (
            x.tp === "P" &&
            x.q != null &&
            x.q !== "" &&
            (m == null || m < 0)
          ) {
            k(x, "quantity", "Quantidade de proventos inválida.");
            continue;
          }
          if (x.tp === "V" && m > (P[a]?.q || 0) + 1e-8) {
            k(
              x,
              "oversell",
              "Venda superior à quantidade registrada; confira o histórico.",
            );
            continue;
          }
          if (
            x.tp === "E" &&
            (!["desd", "grup", "bonif"].includes(x.ev) || !(f(x.f) > 0))
          ) {
            k(x, "event", "Evento corporativo ou fator inválido.");
            continue;
          }
          if (x.tp === "E" && x.ev === "bonif" && (r == null || r < 0)) {
            k(x, "price", "Preço atribuído à bonificação inválido.");
            continue;
          }
          x.mk === "US" &&
            !(n > 0) &&
            k(
              x,
              "fx",
              "Câmbio histórico não informado; custo e fluxo em BRL não estão comprovados.",
            );
          const i = V(P, x, 0);
          x.mk === "US"
            ? (z +=
                x.tp === "V"
                  ? m * r - e
                  : x.tp === "C"
                    ? -(m * r + e)
                    : x.tp === "P"
                      ? (m ? m * r : r) - e
                      : x.tp === "A"
                        ? r
                        : x.tp === "R"
                          ? -r
                          : 0)
            : (v += i.caixa);
        }
        return {
          positions: Object.values(P).map((x) => ({
            ...x,
            pm: x.q > 1e-9 ? x.c / x.q : null,
            unit: x.mk === "US" ? "USD" : "BRL",
          })),
          issues: j,
          cash: { BRL: v, USD: z },
          complete: j.length === 0,
        };
      }
      w.CarteiraCalculo = Object.freeze({ num: f, apply: V, audit: U });
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      const f = w.CarteiraCalculo.num,
        u = (m) => typeof m == "number" && Number.isFinite(m),
        V = (m) =>
          String(m || "")
            .trim()
            .toUpperCase()
            .replace(/^.*:/, ""),
        U = [
          ["pl", "P/L", "x"],
          ["pvp", "P/VP", "x"],
          ["ev", "EV/EBITDA", "x"],
          ["dy", "Dividend yield", "%"],
          ["roe", "ROE", "%"],
          ["margin", "Margem líquida", "%"],
          ["growth", "Crescimento de receita", "%"],
          ["debt", "Dívida líquida / EBITDA", "x"],
          ["marketcap", "Valor de mercado", "moeda"],
        ];
      function W(m, r = {}, e = {}) {
        const n = r.yahoo?.numeros || {},
          a = r.tv || {},
          i = e.fs || {},
          l = {},
          c = {};
        function o(h, q) {
          for (const [O, D] of q) {
            const N = f(O);
            if (N !== null) {
              ((l[h] = N), (c[h] = D));
              return;
            }
          }
          l[h] = null;
        }
        const b = (h) => (f(h) === null ? null : f(h) * 100);
        (o("pl", [
          [a.price_earnings_ttm, "TradingView"],
          [n.pl, "Yahoo Finance"],
          [i.pl, "Cadastro da carteira"],
        ]),
          o("pvp", [
            [a.price_book_ratio, "TradingView"],
            [n.pvp, "Yahoo Finance"],
            [i.pvp, "Cadastro da carteira"],
          ]),
          o("ev", [
            [a.enterprise_value_ebitda_ttm, "TradingView"],
            [n.ev_ebitda, "Yahoo Finance"],
            [i.evebitda ?? i.ev_ebitda, "Cadastro da carteira"],
          ]),
          o("dy", [
            [a.dividend_yield_recent, "TradingView"],
            [b(r.yahoo?.proventos?.dy), "Yahoo Finance"],
            [i.dy, "Cadastro da carteira"],
          ]),
          o("roe", [
            [a.return_on_equity, "TradingView"],
            [b(n.roe), "Yahoo Finance"],
            [i.roe, "Cadastro da carteira"],
          ]),
          o("margin", [
            [a.net_margin, "TradingView"],
            [b(n.margem_liq), "Yahoo Finance"],
            [i.margem_liquida_pct ?? i.ml, "Cadastro da carteira"],
          ]),
          o("growth", [
            [b(n.cresc_receita), "Yahoo Finance"],
            [i.crescimento_receita_pct, "Cadastro da carteira"],
          ]));
        const t = f(n.divida),
          s = f(n.caixa),
          p = f(n.ebitda);
        (o("debt", [
          [
            t !== null && s !== null && p > 0 ? (t - s) / p : null,
            "Yahoo Finance · cálculo (dívida − caixa) / EBITDA",
          ],
          [i.div_liq_ebitda ?? i.dl_ebitda, "Cadastro da carteira"],
        ]),
          o("marketcap", [
            [a.market_cap_basic, "TradingView"],
            [n.valor_mercado, "Yahoo Finance"],
          ]));
        const g = (r.sec?.anos?.length ? r.sec.anos : r.balancos?.anos || [])
          .filter((h) => Number.isInteger(+h.ano))
          .map((h) => ({
            date: String(h.ano),
            revenue: f(h.receita),
            profit: f(h.lucro_liquido),
          }))
          .sort((h, q) => h.date.localeCompare(q.date));
        return {
          ticker: V(m),
          name: a.description || e.nome || V(m),
          sector:
            r.yahoo?.perfil?.setor || a.sector || e.setor || "Não informado",
          metric: l,
          origin: c,
          annual: g,
          financialCurrency: r.sec?.anos?.length
            ? "USD"
            : r.yahoo?.moeda_contabil || "moeda contábil não confirmada",
          currency:
            r.br === !1
              ? "USD"
              : r.br === !0 || /\d$/.test(V(m))
                ? "BRL"
                : "USD",
          queried: r.em || null,
          accountingRef: i.ref || i.data_referencia || null,
          sources: r.fontes || [],
          peers: r.pares || [],
          error: r.error || null,
        };
      }
      function y(m, r = {}) {
        return m.filter((e) => {
          const n = e.metric;
          if (r.sector && e.sector !== r.sector) return !1;
          const a = [
            ["dy", "minDy", 1],
            ["roe", "minRoe", 1],
            ["pl", "maxPl", -1],
            ["debt", "maxDebt", -1],
          ];
          for (const [i, l, c] of a) {
            const o = f(r[l]);
            if (
              o !== null &&
              (n[i] === null ||
                !u(n[i]) ||
                (c === 1 && n[i] < o) ||
                (c === -1 && (n[i] > o || (i === "pl" && n[i] <= 0))))
            )
              return !1;
          }
          return !0;
        });
      }
      function P(m = []) {
        const r = [],
          e = (n) =>
            String(n || "")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9 ]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
        for (const n of m) {
          const a = String(n.t || n.titulo || n.title || "").trim();
          if (!a) continue;
          const i = e(a),
            l = String(n.d || n.data || n.date || "").slice(0, 10),
            c = n.u || n.url || n.link || "",
            o = n.f || n.fonte || n.source || "Fonte não informada";
          let b = r.find(
            (t) =>
              (t.key === i && t.date === l) ||
              (c && t.links.some((s) => s.url === c)),
          );
          (b ||
            ((b = {
              title: a,
              key: i,
              date: l,
              links: [],
              sentiment: n.sentimento || n.sentiment || null,
            }),
            r.push(b)),
            b.links.some((t) => t.url === c && t.source === o) ||
              b.links.push({ url: c, source: o }));
        }
        return r;
      }
      function j(m = []) {
        const r = new Map();
        for (const e of m) {
          const n = f(e[0]),
            a = f(e[4]);
          if (!(n > 0 && a > 0)) continue;
          const i = new Date(n * 1e3);
          Number.isNaN(+i) || r.set(i.toISOString().slice(0, 10), a);
        }
        return [...r]
          .sort((e, n) => e[0].localeCompare(n[0]))
          .map(([e, n]) => ({ date: e, value: n }));
      }
      function H(m, r) {
        if (m.length !== r.length || m.length < 20) return null;
        const e = (c) => c.reduce((o, b) => o + b, 0) / c.length,
          n = e(m),
          a = e(r),
          i = m.reduce((c, o) => c + (o - n) ** 2, 0),
          l = r.reduce((c, o) => c + (o - a) ** 2, 0);
        return i === 0 || l === 0
          ? null
          : Math.max(
              -1,
              Math.min(
                1,
                m.reduce((c, o, b) => c + (o - n) * (r[b] - a), 0) /
                  Math.sqrt(i * l),
              ),
            );
      }
      function v(m) {
        const r = Object.keys(m),
          e = r.map((i) => new Map(j(m[i]).map((l) => [l.date, l.value]))),
          n = e.length
            ? [...e[0].keys()]
                .filter((i) => e.every((l) => l.has(i)))
                .sort()
                .slice(-253)
            : [],
          a = e.map((i) =>
            n.slice(1).map((l, c) => i.get(l) / i.get(n[c]) - 1),
          );
        return {
          keys: r,
          dates: n,
          n: Math.max(0, n.length - 1),
          matrix: a.map((i) => a.map((l) => H(i, l))),
          method:
            "Retornos simples nas datas comuns; até 252 intervalos. Sem preencher sessões ausentes. Preços em moeda local; ajustes dependem da fonte.",
        };
      }
      function z(m, r) {
        const e = [],
          n = [];
        for (const a of m) {
          const i = f(r[a.cl] ?? r.default),
            l = f(a.v);
          if (!a.tem || l === null || i === null) {
            n.push(a.tk);
            continue;
          }
          e.push({ ticker: a.tk, value: l, shock: i, impact: (l * i) / 100 });
        }
        return {
          rows: e,
          missing: n,
          total: e.reduce((a, i) => a + i.impact, 0),
          covered: e.reduce((a, i) => a + i.value, 0),
        };
      }
      function k(m, r) {
        const e = Object.keys(r).filter((c) => f(r[c]) > 0),
          n = e.reduce((c, o) => c + f(r[o]), 0);
        if (Math.abs(n - 100) > 1e-6)
          return { points: [], reason: "Os pesos precisam somar 100%." };
        const a = e.map(
            (c) => new Map(j(m[c] || []).map((o) => [o.date, o.value])),
          ),
          i = a.length
            ? [...a[0].keys()].filter((c) => a.every((o) => o.has(c))).sort()
            : [];
        if (i.length < 2)
          return {
            points: [],
            reason: "Faltam preços em pelo menos duas datas comuns.",
          };
        const l = i.map((c) => ({
          date: c,
          value: e.reduce(
            (o, b, t) => o + (f(r[b]) * a[t].get(c)) / a[t].get(i[0]),
            0,
          ),
        }));
        return {
          points: l,
          reason: "",
          return: l.at(-1).value - 100,
          from: i[0],
          to: i.at(-1),
          method:
            "Compra inicial pelos pesos; sem rebalanceamento, taxas ou impostos. Não adiciona dividendos: dependem dos ajustes da série da fonte. Resultado histórico não é previsão.",
        };
      }
      function x(m) {
        const r = new Set(),
          e = [],
          n = new Map();
        let a = 0,
          i = 0,
          l = 0;
        for (const c of m) {
          const o = String(c.trade_id || ""),
            b = f(c.price),
            t = f(c.quantity),
            s = Date.parse(c.traded_at);
          if (!o || r.has(o) || !(b > 0 && t > 0) || !Number.isFinite(s))
            continue;
          r.add(o);
          const p = { ...c, price: b, quantity: t };
          (e.push(p),
            c.side === "buy"
              ? (a += t)
              : c.side === "sell"
                ? (i += t)
                : (l += t));
          for (const [d, g] of [
            [c.buyer, 1],
            [c.seller, -1],
          ])
            if (d) {
              const h = n.get(d) || { name: d, buy: 0, sell: 0, net: 0 };
              (g > 0 ? (h.buy += t) : (h.sell += t),
                (h.net = h.buy - h.sell),
                n.set(d, h));
            }
        }
        return (
          e.sort(
            (c, o) =>
              Date.parse(o.traded_at) - Date.parse(c.traded_at) ||
              String(o.trade_id).localeCompare(String(c.trade_id)),
          ),
          {
            rows: e,
            buy: a,
            sell: i,
            neutral: l,
            delta: a - i,
            players: [...n.values()].sort(
              (c, o) => Math.abs(o.net) - Math.abs(c.net),
            ),
            from: e.at(-1)?.traded_at,
            to: e[0]?.traded_at,
          }
        );
      }
      w.TerminalResearchModel = {
        num: f,
        finite: u,
        ticker: V,
        fields: U,
        fundamental: W,
        screen: y,
        normalizeNews: P,
        closeSeries: j,
        correlation: v,
        hypothetical: k,
        scenarios: z,
        flow: x,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      const f = w.CarteiraCalculo.num,
        u = (e) => typeof e == "number" && Number.isFinite(e),
        V = (e) => e.reduce((n, a) => n + a, 0),
        U = (e, n) => (u(e) && u(n) && n !== 0 ? (e / n) * 100 : null);
      function W(e, n) {
        const a = e
          .map(f)
          .filter(u)
          .sort((c, o) => c - o);
        if (!a.length) return null;
        const i = (a.length - 1) * n,
          l = Math.floor(i);
        return a[l] + (a[Math.min(l + 1, a.length - 1)] - a[l]) * (i - l);
      }
      function y(e = {}) {
        const n = e.sec?.anos?.length ? "SEC EDGAR" : "Yahoo Finance",
          a = e.sec?.anos?.length ? e.sec.anos : e.balancos?.anos || [],
          i = [];
        for (const l of a.slice().sort((c, o) => +c.ano - +o.ano)) {
          if (!Number.isInteger(+l.ano) || +l.ano < 1900 || +l.ano > 2200)
            continue;
          const c = i.at(-1),
            o = f(l.lucro_liquido),
            b = f(l.receita),
            t = f(l.patrimonio),
            s =
              t !== null
                ? c?.equity !== null &&
                  c?.equity !== void 0 &&
                  +c.date === +l.ano - 1
                  ? (t + c.equity) / 2
                  : t
                : null;
          i.push({
            date: String(l.ano),
            revenue: b,
            profit: o,
            equity: t,
            margin:
              f(l.rentabilidade?.margem_liquida_pct) ??
              (b > 0 ? U(o, b) : null),
            roe:
              f(l.rentabilidade?.retorno_sobre_pl_pct) ??
              (s > 0 ? U(o, s) : null),
            leverage: f(l.endividamento?.capitais_terceiros_sobre_pl),
            operatingCash: f(l.fco),
            freeCash:
              f(l.fco) !== null && f(l.capex) !== null
                ? f(l.fco) - Math.abs(f(l.capex))
                : null,
            source: n,
          });
        }
        return i;
      }
      function P(e = []) {
        if (e.length < 2)
          return {
            from: null,
            to: null,
            rows: [],
            reason: "São necessários dois períodos anuais comparáveis.",
          };
        const n = e.at(-2),
          a = e.at(-1);
        return +a.date - +n.date !== 1
          ? {
              rows: [],
              reason:
                "Os dois anos mais recentes não são consecutivos; comparação omitida.",
            }
          : {
              from: n.date,
              to: a.date,
              reason:
                "Comparação anual. Não representa a variação do último trimestre.",
              rows: [
                ["revenue", "Receita", "%"],
                ["profit", "Lucro líquido", "%"],
                ["margin", "Margem líquida", "p.p."],
                ["roe", "ROE", "p.p."],
                ["leverage", "Capitais de terceiros / PL", "x"],
                ["operatingCash", "Caixa operacional", "%"],
              ].map(([i, l, c]) => {
                const o = f(n[i]),
                  b = f(a[i]);
                let t = null,
                  s = "Sem dados comparáveis";
                return (
                  o !== null &&
                    b !== null &&
                    (c === "%" && o <= 0
                      ? (s =
                          i === "profit" && o < 0 && b >= 0
                            ? "Reversão de prejuízo para lucro; percentual não calculado"
                            : "Base anterior não positiva; percentual não calculado")
                      : ((t = c === "%" ? (b / o - 1) * 100 : b - o),
                        (s = "Diferença entre os períodos indicados"))),
                  {
                    key: i,
                    label: l,
                    unit: c,
                    before: o,
                    after: b,
                    change: t,
                    explanation: s,
                  }
                );
              }),
            };
      }
      function j(e, n = {}) {
        const a = (o) =>
            String(o || "")
              .replace(/^.*:/, "")
              .replace(/\.[A-Z]$/, "")
              .replace(/\d+$/, ""),
          i = new Set([a(e)]),
          l = [];
        for (const o of n.pares || []) {
          const b = a(o.s);
          !b || i.has(b) || (i.add(b), l.push(o));
        }
        const c = w.TerminalResearchModel.fundamental(e, n).metric;
        return {
          count: l.length,
          rows: [
            ["pl", "P/L", "pl"],
            ["pvp", "P/VP", "pvp"],
            ["ev", "EV/EBITDA", "ev_ebitda"],
            ["dy", "Dividend yield (%)", "dy"],
            ["roe", "ROE (%)", "roe"],
            ["margin", "Margem líquida (%)", "ml"],
          ].map(([o, b, t]) => {
            const s = l
              .map((p) => f(p[t]))
              .filter(
                (p) =>
                  p !== null && (!["pl", "pvp", "ev"].includes(o) || p > 0),
              );
            return {
              key: o,
              label: b,
              current: c[o],
              n: s.length,
              min: s.length >= 3 ? Math.min(...s) : null,
              q25: s.length >= 3 ? W(s, 0.25) : null,
              median: s.length >= 3 ? W(s, 0.5) : null,
              q75: s.length >= 3 ? W(s, 0.75) : null,
              max: s.length >= 3 ? Math.max(...s) : null,
            };
          }),
          source:
            "Amostra setorial retornada pelo serviço de fundamentos; classes do mesmo emissor agrupadas. Não cobre necessariamente todo o setor. Mínimo de 3 emissores válidos por indicador; múltiplos negativos excluídos. Datas contábeis podem diferir.",
        };
      }
      function H(e = {}) {
        const n = e.yahoo?.numeros || {},
          a = e.yahoo?.proventos || {},
          i = f(a.payout),
          l = f(n.roe),
          c = f(n.caixa),
          o = f(n.divida),
          b = f(n.fcl),
          t = f(n.fco),
          s =
            !!e.balancos?.banco ||
            /financ|bank|banc|insur|segur/i.test(
              String(e.tv?.sector || "") +
                " " +
                String(e.tv?.industry || "") +
                " " +
                String(e.yahoo?.perfil?.setor || ""),
            ),
          p = [];
        return (
          i !== null &&
            p.push({
              label: "Payout informado pela fonte",
              value: i * 100,
              unit: "%",
              message:
                i < 0
                  ? "Lucro-base negativo ou dado inconsistente; cobertura não inferida."
                  : i > 1
                    ? "Distribuição supera o lucro-base informado. Verifique eventos extraordinários e o período."
                    : "Distribuição dentro do lucro-base informado; isso não garante pagamentos futuros.",
            }),
          !s &&
            b !== null &&
            p.push({
              label: "Fluxo de caixa livre informado",
              value: b,
              unit: "moeda",
              message:
                b < 0
                  ? "Caixa livre negativo na referência da fonte; investigar investimento, capital de giro e financiamento."
                  : "Caixa livre positivo na referência da fonte. Sem o total distribuído no mesmo período, cobertura dos dividendos não é calculada.",
            }),
          t !== null &&
            !s &&
            p.push({
              label: "Caixa operacional informado",
              value: t,
              unit: "moeda",
              message: "Conferir o período na demonstração de fluxo de caixa.",
            }),
          c !== null &&
            o !== null &&
            !s &&
            p.push({
              label: "Dívida menos caixa informados",
              value: o - c,
              unit: "moeda",
              message:
                "Fotografia da estrutura de capital, sem relação causal automática com a distribuição.",
            }),
          {
            checks: p,
            financial: s,
            payout: i !== null ? i * 100 : null,
            retention: i !== null && i >= 0 && i <= 1 ? 100 - i * 100 : null,
            roe: l !== null ? l * 100 : null,
            recurring:
              "Recorrente ou extraordinário: classificação não fornecida. Conferir deliberações e documentos oficiais. Proventos lançados na sua carteira não equivalem ao total distribuído pela companhia.",
            note: s
              ? "Instituição financeira: não se aplica o mesmo diagnóstico de caixa livre e dívida de empresas industriais."
              : "Caixa e dívida usam a moeda contábil da fonte, que pode diferir da moeda de negociação; não são convertidos nem consolidados aqui. Indicadores podem ter datas distintas. Não se divide dividendo estimado por caixa de período incompatível.",
          }
        );
      }
      function v(e = {}) {
        const n = f(e.cash),
          a = f(e.growth),
          i = f(e.rate),
          l = f(e.terminal),
          c = f(e.years);
        if (
          !(n > 0) ||
          a === null ||
          a <= -100 ||
          a > 100 ||
          !(i > 0 && i <= 100) ||
          l === null ||
          l <= -100 ||
          l >= i ||
          ![5, 10].includes(c)
        )
          return {
            available: !1,
            reason:
              "Informe FCFE por ação positivo, horizonte de 5 ou 10 anos e taxas válidas. A taxa terminal deve ser menor que o custo de capital próprio.",
          };
        const o = i / 100,
          b = a / 100,
          t = l / 100,
          s = [];
        let p = n,
          d = 0;
        for (let O = 1; O <= c; O++) {
          p *= 1 + b;
          const D = p / (1 + o) ** O;
          ((d += D), s.push({ year: O, cash: p, discounted: D }));
        }
        const g = (p * (1 + t)) / (o - t),
          h = g / (1 + o) ** c,
          q = d + h;
        return !u(q) || q <= 0
          ? { available: !1, reason: "As premissas produziram valor inválido." }
          : {
              available: !0,
              value: q,
              rows: s,
              terminalPV: h,
              terminalShare: (h / q) * 100,
              input: { cash: n, growth: a, rate: i, terminal: l, years: c },
              method:
                "FCFE por ação descontado ao custo de capital próprio. Crescimento explícito constante e perpetuidade. Fluxo é após reinvestimento e financiamento líquido. Não usa FCO ou lucro como FCFE e não desconta dívida novamente.",
            };
      }
      function z(e) {
        const n = (e?.scenarios || []).map((i) => ({
            ...i,
            result: v({ ...i, cash: e.cash, years: e.years }),
          })),
          a = n.filter((i) => i.result.available);
        return {
          rows: n,
          min:
            a.length === n.length && n.length
              ? Math.min(...a.map((i) => i.result.value))
              : null,
          max:
            a.length === n.length && n.length
              ? Math.max(...a.map((i) => i.result.value))
              : null,
        };
      }
      function k(e) {
        return [-2, 0, 2].map((n) => ({
          rate: f(e.rate) + n,
          cells: [-1, 0, 1].map((a) =>
            v({ ...e, rate: f(e.rate) + n, terminal: f(e.terminal) + a }),
          ),
        }));
      }
      function x(e, n, a, i = 120) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !n?.queried) return e || [];
        const l = {
          date: a,
          queried: n.queried,
          metric: Object.fromEntries(
            Object.entries(n.metric).filter(([, c]) => u(c)),
          ),
          source: n.origin,
        };
        return [...(e || []).filter((c) => c.date !== a), l]
          .sort((c, o) => c.date.localeCompare(o.date))
          .slice(-i);
      }
      function m(e, n = {}, a = {}) {
        const i = e
            .filter((d) => d.tem && f(d.v) !== null && f(d.v) >= 0)
            .map((d) => ({ ...d, v: f(d.v) })),
          l = e.filter((d) => !d.tem || f(d.v) === null).map((d) => d.tk),
          c = V(i.map((d) => d.v)),
          o = new Map(),
          b = new Map();
        let t = 0;
        function s(d, g, h, q) {
          const O = d.get(g) || { name: g, value: 0, tickers: [] };
          ((O.value += h),
            O.tickers.includes(q) || O.tickers.push(q),
            d.set(g, O));
        }
        for (const d of i) {
          const g = n[d.k] || {},
            h = Array.isArray(g.parts) ? g.parts : [],
            q = V(h.map((D) => f(D.percent) || 0));
          if (
            h.length &&
            h.every(
              (D) =>
                typeof D.bucket == "string" &&
                D.bucket.trim() &&
                f(D.percent) > 0 &&
                f(D.percent) <= 100,
            ) &&
            q > 0 &&
            q <= 100 + 1e-8 &&
            /^\d{4}-\d{2}-\d{2}$/.test(g.ref || "") &&
            /^https:\/\//.test(g.source || "")
          ) {
            for (const D of h)
              if (D.bucket && f(D.percent) > 0) {
                const N = (d.v * D.percent) / 100;
                (s(o, D.bucket, N, d.tk), (t += N));
              }
            q < 100 &&
              s(o, "Composição não detalhada", (d.v * (100 - q)) / 100, d.tk);
          } else
            s(
              o,
              ["fii", "etf", "etf_ext"].includes(d.cl)
                ? "Fundos sem composição informada"
                : a[d.tk]?.sector || d.setor || "Setor não informado",
              d.v,
              d.tk,
            );
          for (const D of [...new Set(Array.isArray(g.themes) ? g.themes : [])])
            s(b, D, d.v, d.tk);
        }
        const p = (d) =>
          [...d.values()]
            .map((g) => ({ ...g, weight: c > 0 ? (g.value / c) * 100 : null }))
            .sort((g, h) => h.value - g.value);
        return {
          total: c,
          missing: l,
          sectors: p(o),
          themes: p(b),
          detailed: t,
          method:
            "Composição informada substitui o agrupamento direto daquele ativo para evitar dupla contagem. Restante não detalhado fica explícito. Temas são marcações pessoais sobre a posição inteira e podem se sobrepor; não medem beta ou sensibilidade estatística.",
        };
      }
      function r(e = {}, n = {}) {
        const a = (l, c) => {
            if (!l) return c;
            if (!c) return l;
            const o = Date.parse(l.at || l.queried || "") || 0,
              b = Date.parse(c.at || c.queried || "") || 0;
            return o === b
              ? JSON.stringify(l) > JSON.stringify(c)
                ? l
                : c
              : o > b
                ? l
                : c;
          },
          i = { assets: {}, exposures: {} };
        for (const l of new Set([
          ...Object.keys(e.assets || {}),
          ...Object.keys(n.assets || {}),
        ])) {
          const c = e.assets?.[l] || {},
            o = n.assets?.[l] || {},
            b = new Map(),
            t = new Map();
          for (const p of [...(c.notes || []), ...(o.notes || [])])
            p.id && b.set(p.id, a(b.get(p.id), p));
          for (const p of [
            ...(c.observations || []),
            ...(o.observations || []),
          ])
            p.date && t.set(p.date, a(t.get(p.date), p));
          i.assets[l] = {
            ...c,
            ...o,
            notes: [...b.values()].sort(
              (p, d) =>
                String(p.at).localeCompare(String(d.at)) ||
                p.id.localeCompare(d.id),
            ),
            observations: [...t.values()]
              .sort((p, d) => p.date.localeCompare(d.date))
              .slice(-120),
          };
          const s = a(c.valuation, o.valuation);
          s && (i.assets[l].valuation = s);
        }
        for (const l of new Set([
          ...Object.keys(e.exposures || {}),
          ...Object.keys(n.exposures || {}),
        ]))
          i.exposures[l] = a(e.exposures?.[l], n.exposures?.[l]);
        return i;
      }
      w.AdvancedResearch = {
        quantile: W,
        history: y,
        annualChanges: P,
        peers: j,
        dividendQuality: H,
        valuation: v,
        valuationScenarios: z,
        valuationSensitivity: k,
        observe: x,
        exposures: m,
        merge: r,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      function f(u, V, U, W = {}) {
        if (!V.length) return;
        const y = Math.max(8.5, W.s || 8.8),
          P = y * 1.35,
          j = 5,
          H = u.C,
          v = u.M,
          z = V.reduce((a, i) => a + i.w, 0),
          k = V.map((a) => (a.w / z) * u.CW);
        function x(a, i, l, c) {
          const o = String(a ?? "–"),
            b = o
              .split(/(\s+)/)
              .map((t) => {
                if (!t.trim() || u.wd(t, l, c) <= i) return t;
                let s = "",
                  p = "";
                for (const d of Array.from(t))
                  (p && u.wd(p + d, l, c) > i && ((s += p + " "), (p = "")),
                    (p += d));
                return s + p;
              })
              .join("");
          return u.wrap(b, i, l, c);
        }
        const m = V.map((a, i) =>
            x(String(a.l).toUpperCase(), k[i] - 2 * j, 8, "b"),
          ),
          r = Math.min(3, Math.max(...m.map((a) => a.length))),
          e = r * P + 2 * j;
        function n() {
          (u.need(e + P + 2 * j), u.rect(v, u.y, u.CW, e, { fill: H.dk }));
          let a = v;
          (V.forEach((i, l) => {
            (m[l]
              .slice(0, 3)
              .forEach((c, o) =>
                u.t(c, a + j, u.y + j + o * P, {
                  s: 8,
                  f: "b",
                  c: H.wh,
                  w: k[l] - 2 * j,
                }),
              ),
              (a += k[l]));
          }),
            (u.y += e));
        }
        (n(),
          U.forEach((a, i) => {
            const l = V.map((t, s) => {
                const p = a[s],
                  d =
                    p && typeof p == "object" && !Array.isArray(p)
                      ? p
                      : { t: p },
                  // v618: logo circular opcional na célula ({ t, lg: { img, r } }), sem mudar o resto da tabela
                  lgw = d.lg && d.lg.img ? (d.s || y) * 1.3 * (d.lg.r || 1) + 4 : 0,
                  g = x(d.t, k[s] - 2 * j - lgw, d.s || y, d.f || "r").map((h) => ({
                    text: h,
                    s: d.s || y,
                    f: d.f || "r",
                    c: d.c || H.tx,
                  }));
                return (
                  (d.lgw = lgw),
                  d.sub &&
                    g.push(
                      ...x(d.sub, k[s] - 2 * j, y - 1.2, "r").map((h) => ({
                        text: h,
                        s: y - 1.2,
                        f: "r",
                        c: H.mut,
                      })),
                    ),
                  { ...d, lines: g }
                );
              }),
              c = Math.max(1, ...l.map((t) => t.lines.length)),
              o = Math.max(
                P,
                ...l.flatMap((t) => t.lines.map((s) => s.s * 1.35)),
              );
            let b = 0;
            for (; b < c; ) {
              u.BOT - u.y < o + 2 * j && (u.add(), n());
              const t = Math.max(
                  1,
                  Math.min(c - b, Math.floor((u.BOT - u.y - 2 * j) / o)),
                ),
                s = t * o + 2 * j;
              i % 2 && u.rect(v, u.y, u.CW, s, { fill: H.cz });
              let p = v;
              (l.forEach((d, g) => {
                if (d.lgw && b === 0)
                  try {
                    const hh = (d.s || y) * 1.3;
                    u.pg.drawImage(d.lg.img, { x: p + j, y: u.H - (u.y + j - 1) - hh, width: hh * (d.lg.r || 1), height: hh });
                  } catch {}
                (d.fill &&
                  u.rect(p + 1, u.y + 1, k[g] - 2, s - 2, { fill: d.fill }),
                  d.lines
                    .slice(b, b + t)
                    .forEach((h, q) =>
                      u.t(
                        h.text,
                        V[g].al === "r" ? p + k[g] - j : p + j + (d.lgw || 0),
                        u.y + j + q * o,
                        {
                          ...h,
                          w: k[g] - 2 * j,
                          al: V[g].al === "r" ? "r" : "l",
                        },
                      ),
                    ),
                  (p += k[g]));
              }),
                (u.y += s),
                u.ln(v, u.y, v + u.CW, u.y, { c: H.bd, w: 0.6 }),
                (b += t));
            }
          }),
          (u.y += 8));
      }
      w.TraderPdfTable = Object.freeze({ draw: f });
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      const f = (o) => (o == null ? o : JSON.parse(JSON.stringify(o))),
        u = (o) =>
          String(o ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        V = () =>
          w.crypto?.randomUUID?.() ||
          Date.now().toString(36) + "-" + Math.random().toString(36).slice(2),
        U = (o) =>
          Object.fromEntries(
            Object.entries(o || {})
              .filter(
                ([b]) =>
                  ![
                    "_history",
                    "_events",
                    "_fc",
                    "_conflicts",
                    "_resolved",
                    "u",
                  ].includes(b),
              )
              .map(([b, t]) => [b, f(t)]),
          ),
        W = (o) =>
          JSON.stringify(o, (b, t) =>
            t && typeof t == "object" && !Array.isArray(t)
              ? Object.fromEntries(
                  Object.keys(t)
                    .sort()
                    .map((s) => [s, t[s]]),
                )
              : t,
          );
      function y(o = [], b = [], t = 100) {
        return [
          ...new Map(
            [...o, ...b].filter((s) => s && s.id).map((s) => [s.id, s]),
          ).values(),
        ]
          .sort((s, p) => s.at - p.at)
          .slice(-t);
      }
      function P(o, b) {
        const t = (o?.u || 0) >= (b?.u || 0) ? o : b;
        return {
          ...f(t),
          _history: y(o?._history, b?._history, 50),
          _events: y(o?._events, b?._events, 100),
        };
      }
      function j(o, b, t, s = Date.now(), p = 3e4) {
        if (!b || W(U(o)) === W(U(b))) return !1;
        const d = o._history || (o._history = []),
          g = d.at(-1);
        ((!g || s - g.at >= p || g.reason !== t) &&
          d.push({ id: V(), at: s, reason: t, data: U(b) }),
          (o._history = d.slice(-50)));
        const h = [
            ...new Set([...Object.keys(U(b)), ...Object.keys(U(o))]),
          ].filter((D) => W(b[D]) !== W(o[D])),
          q = o._events || (o._events = []),
          O = q.at(-1);
        return (
          O && s - O.at < p && O.kind === t
            ? ((O.at = s), (O.fields = [...new Set([...O.fields, ...h])]))
            : q.push({ id: V(), at: s, kind: t, fields: h }),
          (o._events = q.slice(-100)),
          !0
        );
      }
      function H(o = [], b = {}, t = Date.now(), s = "registro") {
        return {
          id: V(),
          at: t,
          scope: s,
          rules: o.map((p) => ({
            id: String(p.id),
            text: String(p.t || ""),
            category: p.cat ?? null,
            version: p.u || 0,
            checked: b[p.id] === !0,
          })),
        };
      }
      function v(o, b, t, s, p = Date.now()) {
        return (
          o._rulesSnapshot ||
            (o._rulesSnapshot = H(
              b,
              t?.chk,
              p,
              String(o.dt || "").slice(0, 10) === s
                ? "registro_no_dia"
                : "registro_posterior_sem_comprovacao_historica",
            )),
          o._events?.length ||
            (o._events = [{ id: V(), at: p, kind: "registro", fields: [] }]),
          o
        );
      }
      const z = {
        dt: {
          name: "Day trade",
          plano: `Cenário principal:
Cenário alternativo:
Níveis de atenção:
Gatilho e invalidação:
Risco máximo e condição de parada:
`,
          pre: `Qual comportamento devo evitar nesta sessão? Como vou reagir a um stop?
`,
        },
        sw: {
          name: "Swing trade",
          plano: `Tese e horizonte:
Catalisadores e eventos da empresa:
Níveis de atenção e invalidação:
Exposição e risco de carregar a posição:
Data de revisão:
`,
          pre: `O que mudaria minha tese? Como vou lidar com um gap?
`,
        },
        us: {
          name: "Mercado americano",
          plano: `Sessão e fuso horário:
Agenda de dados e resultados:
Cenário principal e alternativo:
Gatilho e invalidação:
Risco em USD e efeito cambial:
`,
          pre: `Como vou reagir a uma surpresa de dado ou a um movimento na abertura?
`,
        },
      };
      function k(o, b, t = !1) {
        for (const s of ["plano", "pre"])
          (t || !String(o[s] || "").trim()) && (o[s] = b[s] || "");
        return ((o._template = { name: b.name, at: Date.now() }), o);
      }
      const x = (o) =>
        ["followed", "broken", "unknown"].includes(o._assessment?.status)
          ? o._assessment.status
          : o.rules === "s"
            ? "followed"
            : o.rules === "n"
              ? "broken"
              : "unknown";
      function m(o, b, t, s = "", p = "9999-12-31") {
        const d = Object.fromEntries(
          ["followed", "broken", "unknown"].map((g) => [
            g,
            { n: 0, wins: 0, risks: [], currencies: {} },
          ]),
        );
        for (const g of o || []) {
          const h = String(g.dtx || g.dt || "").slice(0, 10),
            q = b(g);
          if (h < s || h > p || q?.pl == null || !Number.isFinite(q.pl))
            continue;
          const O = d[x(g)],
            D = t(g) || "BRL";
          (O.n++,
            q.pl > 0 && O.wins++,
            Number.isFinite(q.r) && O.risks.push(q.r),
            (O.currencies[D] = (O.currencies[D] || 0) + q.pl));
        }
        for (const g of Object.values(d))
          ((g.winRate = g.n ? (g.wins / g.n) * 100 : null),
            (g.meanR = g.risks.length
              ? g.risks.reduce((h, q) => h + q, 0) / g.risks.length
              : null),
            (g.rCount = g.risks.length));
        return d;
      }
      function r(o) {
        const b = new Date(o + "T12:00:00");
        return (b.setDate(b.getDate() - ((b.getDay() + 6) % 7)), e(b));
      }
      const e = (o) =>
        `${o.getFullYear()}-${String(o.getMonth() + 1).padStart(2, "0")}-${String(o.getDate()).padStart(2, "0")}`;
      function n(o, b) {
        const t = new Date(o + "T12:00:00");
        return (t.setDate(t.getDate() + b), e(t));
      }
      function a(o, b, t, s, p) {
        t = r(t);
        const d = n(t, 6),
          g = (o || []).filter((O) => {
            const D = String(O.dtx || O.dt || "").slice(0, 10);
            return D >= t && D <= d;
          }),
          h = {};
        g.forEach((O) =>
          (Array.isArray(O.tags)
            ? O.tags
            : O.err && O.err !== "Nenhum"
              ? [O.err]
              : []
          ).forEach((D) => (h[D] = (h[D] || 0) + 1)),
        );
        const q = Object.entries(h).sort((O, D) => D[1] - O[1]);
        return {
          from: t,
          to: d,
          comparison: m(g, s, p, t, d),
          errors: q,
          notes: Object.entries(b || {})
            .filter(([O]) => O >= t && O <= d)
            .flatMap(([O, D]) =>
              [
                ["BR", D],
                ["US", D.us],
              ]
                .filter(([, N]) => N && (N.aprend || N.bem))
                .map(([N, R]) => ({
                  date: O,
                  market: N,
                  learning: R.aprend || "",
                  good: R.bem || "",
                })),
            ),
          suggestion: q.length
            ? `Escolher uma prevenção concreta para: ${q[0][0]}`
            : "Definir um comportamento observável para praticar na próxima semana.",
        };
      }
      function i(o, b) {
        const t = u(b).trim().split(/\s+/).filter(Boolean);
        if (!t.length) return [];
        const s = [];
        for (const p of o.trades || [])
          s.push({
            kind: "trade",
            id: p.id,
            title: `${p.ativo || "Operação"} · ${String(p.dt || "").slice(0, 10)}`,
            text: [
              p.ativo,
              p.setup,
              p.nota,
              p.obs,
              p.coment,
              p.err,
              p.rules,
              ...(p.tags || []),
            ]
              .filter(Boolean)
              .join(" "),
            date: p.dt || "",
          });
        for (const [p, d] of Object.entries(o.days || {}))
          for (const [g, h] of [
            ["BR", d],
            ["US", d.us],
          ])
            h &&
              s.push({
                kind: "day",
                id: p,
                market: g,
                title: `Diário ${g} · ${p}`,
                date: p,
                text: [
                  p,
                  h.plano,
                  h.pre,
                  h.resumo,
                  h.aprend,
                  h.bem,
                  h.cond,
                  h.prevn,
                ]
                  .filter(Boolean)
                  .join(" "),
              });
        for (const [p, d] of [
          ["BR", o.rules],
          ["US", o.rulesUS],
        ])
          for (const g of d || [])
            s.push({
              kind: "rule",
              market: p,
              id: g.id,
              title: (g.t || "Regra") + " · " + p,
              text: g.t || "",
              date: "",
            });
        for (const p of o.books || [])
          s.push({
            kind: "book",
            id: p.id,
            title: p.t || p.nome || "Estudo",
            text: [p.t, p.a, p.nome].filter(Boolean).join(" "),
            date: "",
          });
        return s
          .filter((p) => t.every((d) => u(p.title + " " + p.text).includes(d)))
          .sort((p, d) => d.date.localeCompare(p.date));
      }
      function l(o, b, t = Date.now()) {
        if (b.undoneAt) return { removed: 0, restored: 0, skipped: [] };
        const s = { removed: 0, restored: 0, skipped: [] };
        for (const p of b.items || []) {
          const d = (o.trades || []).findIndex((h) => h.id === p.id),
            g = o.trades[d];
          if (!g || W(U(g)) !== p.after) {
            s.skipped.push(p.id);
            continue;
          }
          if (p.before) {
            const h = f(p.before);
            ((h.u = t),
              (h._events = y(g._events, [
                { id: V(), at: t, kind: "desfazer_importacao", fields: [] },
              ])),
              (o.trades[d] = h),
              s.restored++);
          } else
            (o.trades.splice(d, 1), ((o.del ??= {})[p.id] = t), s.removed++);
        }
        return ((b.undoneAt = t), (b.result = s), s);
      }
      function c(o, b = {}) {
        const t = f(o),
          s = new Set(b.hidden || []),
          p = (b.tickers || []).map(u);
        if (
          ((t.materias = (t.materias || [])
            .filter((d) => !s.has(d.editoria))
            .filter(
              (d) =>
                !p.length ||
                !/empresa/i.test(d.editoria || "") ||
                p.some((g) => u(JSON.stringify(d)).includes(g)),
            )),
          b.mode === "brief")
        ) {
          ((t.formato = "resumido"),
            (t.nome = (t.nome || "Edição") + " · resumo"));
          for (const d of [t.manchete, ...t.materias].filter(Boolean))
            d.texto = String(d.texto || "").split(/\n\s*\n/)[0];
        }
        return t;
      }
      w.TraderModel = {
        clone: f,
        normalize: u,
        id: V,
        strip: U,
        stable: W,
        union: y,
        mergeRecord: P,
        archive: j,
        ruleSnapshot: H,
        captureTrade: v,
        templates: z,
        applyTemplate: k,
        status: x,
        compare: m,
        monday: r,
        addDays: n,
        weekly: a,
        search: i,
        undoBatch: l,
        journal: c,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      const f = (n) => (n === void 0 ? void 0 : JSON.parse(JSON.stringify(n))),
        u = (n, a) => Object.prototype.hasOwnProperty.call(n, a),
        V = new Set([
          "_fc",
          "_conflicts",
          "_resolved",
          "_history",
          "_events",
          "u",
        ]),
        U = (n) =>
          Array.isArray(n) &&
          n.length > 0 &&
          n.length < 30 &&
          n.every(
            (a) =>
              typeof a == "string" &&
              !["__proto__", "prototype", "constructor"].includes(a),
          );
      let W = null,
        y = "local";
      try {
        ((y =
          w.localStorage?.getItem("diario-device-v285") ||
          "d" + Date.now().toString(36) + Math.random().toString(36).slice(2)),
          w.localStorage?.setItem("diario-device-v285", y));
      } catch {}
      function P(n, a = [], i = {}) {
        return (
          n && typeof n == "object" && !Array.isArray(n)
            ? Object.keys(n).forEach((l) => {
                !V.has(l) &&
                  !["__proto__", "prototype", "constructor"].includes(l) &&
                  P(n[l], a.concat(l), i);
              })
            : a.length && (i[JSON.stringify(a)] = f(n)),
          i
        );
      }
      const j = (n, a) => {
          const i = n?._fc?.[a];
          return typeof i == "number"
            ? { at: i, by: "legacy", base: 0 }
            : i && typeof i == "object"
              ? i
              : { at: n?.u || 0, by: "legacy", base: 0 };
        },
        H = (n, a) => JSON.stringify(n) === JSON.stringify(a);
      function v(n, a, i, l = !0) {
        if (!U(a)) return;
        let c = n;
        for (const o of a.slice(0, -1))
          ((!c[o] || typeof c[o] != "object" || Array.isArray(c[o])) &&
            (c[o] = {}),
            (c = c[o]));
        l ? (c[a.at(-1)] = f(i)) : delete c[a.at(-1)];
      }
      const z = (n) => {
        for (const a of Object.values(n || {}))
          if (!(!a || typeof a != "object"))
            for (const i of Object.keys(P(a)))
              u(a._fc || {}, i) ||
                ((a._fc ??= {})[i] = { at: a.u || 0, by: "legacy", base: 0 });
        W = f(n || {});
      };
      function k(n) {
        W === null && z(n);
      }
      function x(n, a = Date.now()) {
        const i = W || {};
        for (const [l, c] of Object.entries(n || {})) {
          const o = P(i[l] || {}),
            b = P(c),
            t = new Set([...Object.keys(o), ...Object.keys(b)]);
          for (const s of t)
            if (!H(o[s], b[s]) || u(o, s) !== u(b, s)) {
              const p = j(i[l], s),
                d = Math.max(a, (p.at || 0) + 1);
              (((c._fc ??= {})[s] = {
                at: d,
                by: y,
                base: p.at || 0,
                baseBy: p.by,
                ancestors: [
                  `${p.at || 0}|${p.by}`,
                  ...(p.ancestors || []),
                ].slice(0, 32),
              }),
                (c.u = Math.max(c.u || 0, d)));
            }
        }
        z(n);
      }
      function m(n = {}, a = {}) {
        const i = P(n),
          l = P(a),
          c = { u: Math.max(n.u || 0, a.u || 0), _fc: {} };
        (w.TraderModel &&
          ((c._history = w.TraderModel.union(n._history, a._history, 50)),
          (c._events = w.TraderModel.union(n._events, a._events, 100))),
          (c._resolved = { ...(n._resolved || {}) }));
        for (const [t, s] of Object.entries(a._resolved || {}))
          c._resolved[t] = Math.max(c._resolved[t] || 0, +s || 0);
        const o = new Map(
            [...(n._conflicts || []), ...(a._conflicts || [])]
              .filter((t) => t && t.id)
              .map((t) => [t.id, f(t)]),
          ),
          b = new Set([
            ...Object.keys(i),
            ...Object.keys(l),
            ...Object.keys(n._fc || {}),
            ...Object.keys(a._fc || {}),
          ]);
        for (const t of b) {
          let s;
          try {
            s = JSON.parse(t);
          } catch {
            continue;
          }
          if (!U(s)) continue;
          const p = j(n, t),
            d = j(a, t),
            g = u(i, t),
            h = u(l, t),
            q = g || u(n._fc || {}, t),
            O = h || u(a._fc || {}, t),
            D =
              !O ||
              (q &&
                ((p.at || 0) > (d.at || 0) ||
                  ((p.at || 0) === (d.at || 0) &&
                    String(p.by) >= String(d.by)))),
            N = D ? p : d;
          if (
            ((c._fc[t] = f(N)),
            v(c, s, D ? i[t] : l[t], D ? g : h),
            q && O && (!H(i[t], l[t]) || g !== h))
          ) {
            const R = (A, C) =>
                ((A.base || 0) === (C.at || 0) &&
                  (!A.baseBy || A.baseBy === C.by)) ||
                (A.ancestors || []).includes(`${C.at || 0}|${C.by}`),
              K = R(p, d) || R(d, p),
              T = p.by !== d.by && !K,
              F = p.by === "legacy" || d.by === "legacy";
            if (!K && (T || F)) {
              const A = [
                  { value: f(i[t]), present: g, at: p.at || 0, by: p.by },
                  { value: f(l[t]), present: h, at: d.at || 0, by: d.by },
                ].sort(
                  (L, I) =>
                    L.at - I.at || String(L.by).localeCompare(String(I.by)),
                ),
                C = JSON.stringify([
                  s,
                  ...A.map((L) => [L.at, L.by, L.value, L.present]),
                ]);
              o.set(C, { id: C, path: s, versions: A });
            }
          }
        }
        return (
          (c._conflicts = [...o.values()].filter((t) => !c._resolved[t.id])),
          c
        );
      }
      function r(n = {}, a = {}) {
        const i = {};
        for (const l of new Set([...Object.keys(n), ...Object.keys(a)]))
          n[l]
            ? a[l]
              ? (i[l] = m(n[l], a[l]))
              : (i[l] = f(n[l]))
            : (i[l] = f(a[l]));
        return (z(i), i);
      }
      function e(n, a, i) {
        const l = (n._conflicts || []).find((o) => o.id === a),
          c = l?.versions[i];
        return !l || !c
          ? !1
          : (v(n, l.path, c.value, c.present),
            ((n._resolved ??= {})[a] = Date.now()),
            (n._conflicts = n._conflicts.filter((o) => o.id !== a)),
            !0);
      }
      w.DiarioDados = {
        observe: k,
        reset: z,
        stamp: x,
        mergeDays: r,
        resolve: e,
      };
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      const f = (r) => typeof r == "number" && Number.isFinite(r),
        u = (r) =>
          String(r ?? "").replace(
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
        V = (r) =>
          f(r)
            ? r.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: Math.abs(r) < 1 ? 4 : 2,
              })
            : "—",
        U = (r) =>
          f(r)
            ? (r > 0 ? "+" : "") +
              r.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) +
              "%"
            : "—",
        W = (r) => (!f(r) || r === 0 ? "mut" : r > 0 ? "g" : "r"),
        y = (r) =>
          Object.fromEntries(
            new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
              hourCycle: "h23",
            })
              .formatToParts(r)
              .map((e) => [e.type, e.value]),
          );
      function P(r = new Date()) {
        const e = y(r),
          n = +e.hour * 60 + +e.minute;
        return e.weekday === "Sat" ||
          (e.weekday === "Sun" && n < 1200) ||
          (e.weekday === "Fri" && n >= 1200)
          ? "closed"
          : n < 240 || n >= 1200
            ? "overnight"
            : n < 570
              ? "pre"
              : n < 960
                ? "reg"
                : "post";
      }
      function j(r) {
        if (P(r) !== "overnight") return null;
        const e = y(r);
        return new Date(
          Date.UTC(+e.year, +e.month - 1, +e.day - (+e.hour < 4 ? 1 : 0)),
        )
          .toISOString()
          .slice(0, 10);
      }
      const H = (r) => {
          const e = new Date(r);
          return r && Number.isFinite(e.getTime())
            ? e.toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "horário não informado";
        },
        v = {
          pre: "Pré-mercado",
          post: "Pós-mercado",
          overnight: "Overnight",
          reg: "Pregão regular",
          closed: "Fechado",
        };
      function z(r, e) {
        const n = y(r),
          a = y(e);
        return n.year === a.year && n.month === a.month && n.day === a.day;
      }
      function k(r, e = new Date()) {
        const n = r.regular || {
            px: r.state === "pre" ? r.base : r.px,
            chp: r.state === "pre" ? null : r.chp,
            at: null,
            fonte: r.fonte === "tv" ? "TradingView" : "Yahoo Finance",
          },
          a = P(e),
          i = [
            ["overnight", r.overnight],
            ["pre", r.pre],
            ["post", r.pos],
          ].filter(([, o]) => o && f(o.px) && o.px > 0);
        let l = null;
        for (const [o, b] of i) {
          const t = new Date(b.at);
          b.at &&
            Number.isFinite(t.getTime()) &&
            t.getTime() <= e.getTime() + 6e4 &&
            (o === "overnight"
              ? a === "overnight" && j(t) === j(e) && b.active === !0
              : a === o && z(t, e) && r.phase === o) &&
            (l = { ...b, kind: o, active: !0 });
        }
        const c =
          l ||
          i
            .map(([o, b]) => ({ ...b, kind: o, active: !1 }))
            .sort(
              (o, b) => (Date.parse(b.at) || 0) - (Date.parse(o.at) || 0),
            )[0] ||
          null;
        return {
          regular: n,
          extra: c,
          active: l,
          expected: a,
          change: l?.chp ?? n.chp,
        };
      }
      function x(r, e = new Date()) {
        const n = k(r, e),
          a = n.regular,
          i = n.extra,
          l = i
            ? `<div class="adr-extra${i.kind === "overnight" ? " adr-night" : ""}"><span>${i.active ? "" : "Último "}${v[i.kind]}</span><span><b>${V(i.px)}</b> <span class="${W(i.chp)}">${U(i.chp)}</span></span><small>${u(H(i.at))} · ${u(i.fonte || "fonte não informada")}${i.delay?.startsWith("delayed") ? " · com atraso" : ""}</small></div>`
            : "",
          c =
            n.expected === "overnight" && !n.active
              ? '<p class="adr-unavailable">Overnight não confirmado para este ativo nesta consulta.</p>'
              : "";
        return `<article class="adr-quote" data-adr-symbol="${u(r.s)}"><div class="adr-quote-heading"><div><b>${u(r.s)}</b><small>${u(r.n)}</small></div><div class="adr-regular"><b>${V(a.px)}</b> <span class="${W(a.chp)}">${U(a.chp)}</span><small>Pregão regular</small></div></div><small class="adr-quote-reference">Referência regular: ${u(H(a.at))} · ${u(a.fonte || "fonte não informada")}</small>${l}${c}</article>`;
      }
      const m = (r, e = new Date()) => {
        const n = r.map((l) => k(l, e)),
          a = n.some((l) => l.active),
          i = n.map((l) => (a ? l.active?.chp : l.regular.chp)).filter(f);
        return i.length ? i.reduce((l, c) => l + c, 0) / i.length : null;
      };
      w.TraderAdr = Object.freeze({
        price: V,
        percent: U,
        phase: P,
        nightKey: j,
        time: H,
        view: k,
        render: x,
        mean: m,
      });
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      const f = (t) => JSON.parse(JSON.stringify(t)),
        u = (t) => t !== null && typeof t == "object" && !Array.isArray(t),
        V = ["uid", "up", "st", "lastSyncAt"],
        U = ["trades", "rules", "books", "ops", "lanc", "mesaTr", "olho"],
        W = new Set(["__proto__", "prototype", "constructor"]),
        y = 50 * 1024 * 1024;
      async function P(t, s) {
        if (!w.crypto?.subtle)
          throw Error(
            "Verificação de integridade indisponível neste ambiente.",
          );
        const p = new TextEncoder().encode(JSON.stringify({ S: t, imgs: s }));
        return Array.from(
          new Uint8Array(await w.crypto.subtle.digest("SHA-256", p)),
          (d) => d.toString(16).padStart(2, "0"),
        ).join("");
      }
      function j(t) {
        let s = 0;
        function p(g, h = 0) {
          if (++s > 5e5 || h > 70)
            throw Error("Backup excede o limite de estrutura.");
          if (typeof g == "number" && !Number.isFinite(g))
            throw Error("Número inválido no backup.");
          if (g && typeof g == "object")
            for (const q of Object.keys(g)) {
              if (W.has(q)) throw Error("Campo inseguro no backup.");
              p(g[q], h + 1);
            }
        }
        if ((p(t), !u(t) || ![1, 2].includes(t.v) || !u(t.S)))
          throw Error("Formato de backup não reconhecido.");
        const d = t.S;
        for (const g of U) d[g] !== void 0 && H(d[g], g);
        if (d.days !== void 0 && !u(d.days)) throw Error("Diário inválido.");
        for (const [g, h] of Object.entries(d.days || {}))
          if (!/^\d{4}-\d{2}-\d{2}$/.test(g) || !u(h))
            throw Error("Data ou página do diário inválida.");
        if (d.cart !== void 0) {
          if (!u(d.cart)) throw Error("Carteira inválida.");
          d.cart.lanc !== void 0 && H(d.cart.lanc, "movimentações da carteira");
        }
        if (t.imgs !== void 0 && !u(t.imgs)) throw Error("Anexos inválidos.");
        for (const [g, h] of Object.entries(t.imgs || {}))
          if (
            !g ||
            g.length > 200 ||
            typeof h != "string" ||
            !/^data:(image\/(jpeg|png|webp|gif)|audio\/[a-z0-9.+-]+|video\/webm)(;codecs=[a-z0-9.,-]+)?;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(
              h,
            )
          )
            throw Error("Anexo inválido: " + g);
        return t;
      }
      function H(t, s) {
        if (!Array.isArray(t)) throw Error("Lista inválida: " + s);
        const p = new Set();
        for (const d of t) {
          if (!u(d) || typeof d.id != "string" || !d.id || p.has(d.id))
            throw Error("Identificador inválido ou repetido: " + s);
          p.add(d.id);
        }
      }
      function v(t = [], s = [], p = {}) {
        const d = new Map();
        for (const g of [...s, ...t]) {
          const h = d.get(g.id);
          w.TraderModel
            ? d.set(g.id, w.TraderModel.mergeRecord(g, h))
            : (!h || (+g.u || 0) >= (+h.u || 0)) && d.set(g.id, f(g));
        }
        return [...d.values()].filter((g) => !p[g.id] || p[g.id] < (+g.u || 0));
      }
      function z(t, s) {
        if (!u(t) || !u(s)) return f(t === void 0 ? s : t);
        const p = f(s);
        for (const d of Object.keys(t)) p[d] = d in s ? z(t[d], s[d]) : f(t[d]);
        return p;
      }
      function k(t, s) {
        const p = z(t, s),
          d = { ...s.del };
        for (const [g, h] of Object.entries(t.del || {}))
          d[g] = Math.max(+h || 0, +d[g] || 0);
        p.del = d;
        for (const g of U) (t[g] || s[g]) && (p[g] = v(t[g], s[g], d));
        ((p.days = w.DiarioDados
          ? w.DiarioDados.mergeDays(t.days, s.days)
          : z(t.days || {}, s.days || {})),
          (t.cart || s.cart) &&
            ((p.cart = z(t.cart || {}, s.cart || {})),
            (t.cart?.lanc || s.cart?.lanc) &&
              (p.cart.lanc = v(t.cart?.lanc, s.cart?.lanc, d))),
          (p.watch = [...new Set([...(t.watch || []), ...(s.watch || [])])]),
          w.AdvancedResearch &&
            (t.ax?.researchAdvanced || s.ax?.researchAdvanced) &&
            ((p.ax ??= {}),
            (p.ax.researchAdvanced = w.AdvancedResearch.merge(
              t.ax?.researchAdvanced,
              s.ax?.researchAdvanced,
            ))));
        for (const g of V) (delete p[g], t[g] !== void 0 && (p[g] = f(t[g])));
        return p;
      }
      const x = Object.freeze({
        validate: j,
        merge: k,
        records: v,
        maxBytes: y,
      });
      w.TraderBackupModel = x;
      let m = !1;
      const r = () => JSON.stringify([S.uid || "", SESS?.uid || ""]);
      function e() {
        return f({ ...S, days: diarioDaysCanonical() });
      }
      function n() {
        return new Promise((t, s) => {
          if (!db) return s(Error("Armazenamento do aparelho indisponível."));
          const p = db.transaction("img", "readonly"),
            d = p.objectStore("img"),
            g = d.getAllKeys(),
            h = d.getAll();
          ((p.oncomplete = () =>
            t(new Map(g.result.map((q, O) => [String(q), h.result[O]])))),
            (p.onabort = () => s(p.error || Error("Falha ao ler anexos."))));
        });
      }
      const a = (t) =>
        new Promise((s, p) => {
          const d = new FileReader();
          ((d.onload = () => s(d.result)),
            (d.onerror = () => p(Error("Não foi possível ler um anexo."))),
            d.readAsDataURL(t));
        });
      function i(t, s = new Set()) {
        return (
          typeof t == "string"
            ? s.add(t)
            : t &&
              typeof t == "object" &&
              Object.values(t).forEach((p) => i(p, s)),
          s
        );
      }
      function l(t, s = new Set()) {
        if (t && typeof t == "object")
          for (const [p, d] of Object.entries(t))
            ["pin", "pout", "pplan", "au"].includes(p) &&
            typeof d == "string" &&
            d
              ? s.add(d)
              : d && typeof d == "object" && l(d, s);
        return s;
      }
      async function c() {
        if (!m) {
          m = !0;
          try {
            const t = r(),
              s = e(),
              p = i(s),
              d = await n(),
              g = {};
            for (const [O, D] of d) p.has(O) && (g[O] = await a(D));
            for (const O of l(s))
              if (!g[O])
                throw Error(
                  "Anexo não encontrado neste aparelho. Sincronize os anexos antes de exportar.",
                );
            const h = j({
              v: 2,
              createdAt: new Date().toISOString(),
              S: s,
              imgs: g,
            });
            w.crypto?.subtle &&
              (h.integrity = { algorithm: "SHA-256", value: await P(s, g) });
            const q = JSON.stringify(h);
            if (new Blob([q]).size > y)
              throw Error(
                "Backup maior que 50 MB. Exporte pelo computador após revisar os anexos.",
              );
            if (r() !== t)
              throw Error(
                "A conta mudou durante a exportação. Tente novamente.",
              );
            (await saveFile(
              "diario-backup-" + loc().slice(0, 10) + ".json",
              q,
              "application/json",
            ),
              r() === t && ((S.lastBackup = loc().slice(0, 10)), save()));
          } catch (t) {
            typeof w.toast == "function"
              ? w.toast(t.message, 8e3)
              : w.alert(t.message);
          } finally {
            m = !1;
          }
        }
      }
      function o(t, s, p, d) {
        return new Promise((g, h) => {
          if (!db) return h(Error("Armazenamento do aparelho indisponível."));
          const q = db.transaction(["kv", "img"], "readwrite");
          let O = !1;
          ((q.oncomplete = g),
            (q.onabort = () =>
              h(
                O
                  ? Error(
                      "Os dados mudaram durante a restauração. Nada foi importado; tente novamente.",
                    )
                  : q.error ||
                      Error("Falha ao gravar o backup. Nada foi importado."),
              )));
          try {
            const D = () => {
              (r() !== d || JSON.stringify(e()) !== p) && ((O = !0), q.abort());
            };
            q.objectStore("kv").put(t, "s").onsuccess = D;
            for (const [N, R] of s)
              q.objectStore("img").put(R, N).onsuccess = D;
          } catch (D) {
            (q.abort(), h(D));
          }
        });
      }
      async function b(t) {
        if (m) return "Há outro backup em andamento. Aguarde.";
        m = !0;
        try {
          const s = r();
          if (t.size > y) throw Error("Backup excede o limite de 50 MB.");
          const p = await t.text();
          if (new Blob([p]).size > y)
            throw Error("Backup excede o limite de 50 MB.");
          const d = j(JSON.parse(p));
          if (
            d.integrity &&
            (d.integrity.algorithm !== "SHA-256" ||
              d.integrity.value !== (await P(d.S, d.imgs || {})))
          )
            throw Error(
              "A verificação de integridade falhou. O arquivo foi alterado ou está corrompido.",
            );
          const g = new Map(),
            h = await n();
          for (const [R, K] of Object.entries(d.imgs || {})) {
            if (h.has(R)) {
              if ((await a(h.get(R))) !== K)
                throw Error(
                  "Anexo com identificador conflitante. Nada foi importado.",
                );
              continue;
            }
            const T = atob(K.slice(K.indexOf(",") + 1));
            g.set(
              R,
              new Blob([Uint8Array.from(T, (F) => F.charCodeAt(0))], {
                type: K.slice(5, K.indexOf(";base64,")),
              }),
            );
          }
          for (const R of l(d.S))
            if (!g.has(R) && !h.has(R))
              throw Error("O backup referencia um anexo ausente: " + R);
          if (s !== r()) throw Error("A conta mudou. Nada foi importado.");
          typeof mdmSet == "function" && mdmSet("br");
          const q = e(),
            O = JSON.stringify(q),
            D = k(q, d.S);
          if (
            ((D.mt = Math.max(Date.now(), +q.mt + 1 || 0)),
            clearTimeout(st),
            await o(D, g, O, s),
            r() !== s)
          )
            return (
              persist(),
              typeof persistNow == "function" && persistNow(),
              "A conta mudou ao concluir. A importação não foi aplicada à sessão atual; confira o backup na conta de origem."
            );
          const N = e();
          S = JSON.stringify(N) === O ? D : k(N, D);
          for (const [R, K] of g) M[R] = K;
          return (
            w.DiarioDados?.reset(S.days),
            save(),
            "Backup restaurado: diário, operações, carteira, preferências e anexos mesclados. Registros locais mais recentes foram preservados."
          );
        } catch (s) {
          return (
            w.DiarioDados?.reset(diarioDaysCanonical()),
            typeof persist == "function" && LOCAL_SAVE.pending && persist(),
            "Backup não restaurado. " +
              (s instanceof SyntaxError ? "JSON inválido." : s.message)
          );
        } finally {
          m = !1;
        }
      }
      w.TraderBackup = Object.freeze({ exportBackup: c, restoreBackup: b });
    })(typeof window > "u" ? globalThis : window),
    ((w) => {
      "use strict";
      const f = (r, e, n) => Math.min(n, Math.max(e, r));
      function u(r, e = 140, n = 0) {
        return (
          (r = Math.max(0, Math.floor(Number(r) || 0))),
          (e = f(
            Math.round(Number(e) || 140),
            Math.min(10, r || 10),
            Math.min(600, r || 600),
          )),
          (n = f(Math.round(Number(n) || 0), 0, Math.max(0, r - e))),
          { count: e, offset: n, start: Math.max(0, r - n - e), end: r - n }
        );
      }
      function V(r, e, n, a = 0, i = 0.5) {
        const l = u(r, e.count, e.offset);
        if (n === "reset") return u(r, 140, 0);
        if (n === "latest") return u(r, l.count, 0);
        if (n === "pan") return u(r, l.count, l.offset + a);
        if (n === "zoom") {
          const c = u(r, l.count * a, l.offset),
            o = f(i, 0, 1);
          return u(r, c.count, r - (l.start + l.count * o + c.count * (1 - o)));
        }
        return l;
      }
      let U = {};
      try {
        U =
          JSON.parse(w.localStorage?.getItem("terminal-axis-v317") || "{}") ||
          {};
      } catch {}
      function W(r, e, n) {
        const a = U[r] || (U[r] = { log: !0, shift: 0, zoom: 1 });
        if (
          (e === "scale" && ((a.log = !a.log), (a.shift = 0), (a.zoom = 1)),
          (e === "reset" || e === "priceauto") &&
            ((a.shift = 0), (a.zoom = 1), (a.fraction = 0)),
          e === "pricepan" &&
            (a.shift = f(a.shift + Number(n || 0) * a.zoom, -20, 20)),
          e === "pricezoom" && (a.zoom = f(a.zoom * Number(n || 1), 0.05, 20)),
          e)
        )
          try {
            w.localStorage?.setItem("terminal-axis-v317", JSON.stringify(U));
          } catch {}
        return a;
      }
      function y(r, e, n) {
        const a = W(r),
          i = a.log && e > 0 && n > 0;
        let l = i ? Math.log(e) : e,
          c = i ? Math.log(n) : n;
        (!Number.isFinite(l) || !Number.isFinite(c)) && ((l = 0), (c = 1));
        const o = Math.max(c - l, Math.abs(c) * 1e-8, 1e-8),
          b = (c + l) / 2 + a.shift * o,
          t = (o * a.zoom) / 2;
        ((l = b - t), (c = b + t));
        const s = (d) => (i ? Math.log(d) : d),
          p = (d) => (i ? Math.exp(d) : d);
        return {
          log: i,
          low: p(l),
          high: p(c),
          ratio: (d) => (c - s(d)) / (c - l),
          at: (d) => p(c - d * (c - l)),
        };
      }
      if (
        ((w.TerminalChart = { view: u, change: V, axis: W, price: y }),
        !w.document)
      )
        return;
      const P = w.document,
        j = (r, e, n, a) => w.TRM?.tec?.chartView?.(r, e, n, a);
      let H = null,
        v = 0;
      const z = (r) => r.target.closest?.("[data-g9svg]");
      (P.addEventListener("click", (r) => {
        const e = r.target.closest?.("[data-g9axis]");
        e && (r.preventDefault(), j(+e.dataset.panel, e.dataset.g9axis, 0));
      }),
        P.addEventListener(
          "wheel",
          (r) => {
            const e = z(r);
            if (!e || (!r.ctrlKey && !r.metaKey)) return;
            r.preventDefault();
            const n = e.getBoundingClientRect();
            j(
              +e.dataset.g9svg,
              "zoom",
              r.deltaY < 0 ? 1 / 1.2 : 1.2,
              (r.clientX - n.left) / n.width,
            );
          },
          { passive: !1 },
        ),
        P.addEventListener("keydown", (r) => {
          const e = z(r);
          if (!e) return;
          const n = {
            ArrowLeft: ["page", 0.25],
            ArrowRight: ["page", -0.25],
            ArrowUp: ["pricepan", -0.1],
            ArrowDown: ["pricepan", 0.1],
            "+": ["zoom", 1 / 1.4],
            "=": ["zoom", 1 / 1.4],
            "-": ["zoom", 1.4],
            Home: ["reset", 0],
            End: ["latest", 0],
          };
          n[r.key] && (r.preventDefault(), j(+e.dataset.g9svg, ...n[r.key]));
        }));
      function k() {
        v = 0;
        const r = H;
        if (!r || r.pinch) return;
        const e = [...r.points.values()][0];
        if (!e) return;
        const n = e.x - r.last.x,
          a = e.y - r.last.y;
        Math.abs(n) + Math.abs(a) < 2 ||
          ((r.last = { ...e }),
          r.mode === "price"
            ? j(r.panel, "pricezoom", Math.exp((a / r.box.height) * 3))
            : r.mode === "time"
              ? j(r.panel, "zoom", Math.exp((-n / r.box.width) * 3), 0.5)
              : j(r.panel, "move", {
                  time: n / r.box.width,
                  price: a / r.box.height,
                }));
      }
      (P.addEventListener("pointerdown", (r) => {
        const e = z(r);
        if (!e || r.button > 0) return;
        const n = +e.dataset.g9svg,
          a = e.getBoundingClientRect();
        !a.width ||
          !a.height ||
          ((!H || H.panel !== n) &&
            (H = {
              panel: n,
              box: a,
              points: new Map(),
              start: new Map(),
              last: { x: r.clientX, y: r.clientY },
              mode:
                r.clientX > a.right - a.width * 0.1
                  ? "price"
                  : r.clientY > a.bottom - a.height * 0.09
                    ? "time"
                    : "plot",
            }),
          H.points.set(r.pointerId, { x: r.clientX, y: r.clientY }),
          H.start.set(r.pointerId, { x: r.clientX, y: r.clientY }),
          H.points.size === 2 && (H.pinch = !0));
      }),
        P.addEventListener(
          "pointermove",
          (r) => {
            H?.points.has(r.pointerId) &&
              (r.preventDefault(),
              H.points.set(r.pointerId, { x: r.clientX, y: r.clientY }),
              v || (v = w.requestAnimationFrame(k)));
          },
          { passive: !1 },
        ));
      function x(r, e) {
        if (!H?.points.has(r.pointerId)) return;
        const n = H;
        if (!e)
          if (
            (n.points.set(r.pointerId, { x: r.clientX, y: r.clientY }),
            n.pinch && n.points.size === 2)
          ) {
            const a = [...n.start.values()],
              i = [...n.points.values()],
              l = (c) => Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y);
            l(a) > 15 &&
              l(i) > 15 &&
              j(
                n.panel,
                "zoom",
                l(a) / l(i),
                ((a[0].x + a[1].x) / 2 - n.box.left) / n.box.width,
              );
          } else k();
        (v && w.cancelAnimationFrame(v), (v = 0), (H = null));
      }
      (P.addEventListener("pointerup", (r) => x(r, !1)),
        P.addEventListener("pointercancel", (r) => x(r, !0)),
        P.addEventListener("dblclick", (r) => {
          const e = z(r);
          e && j(+e.dataset.g9svg, "reset", 0);
        }));
      const m = P.createElement("style");
      ((m.textContent =
        ".g9svg{touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}.g9svg:active{cursor:grabbing}.g9axis-help{display:block;font-size:10px;line-height:1.4;color:var(--mut,#9ca0a9);padding:4px 0}"),
        P.head.appendChild(m));
    })(typeof window > "u" ? globalThis : window),
    (function (w) {
      "use strict";
      if (w.TraderStyles) return;
      const f = {
          "legacy-001": `.xt summary {
  cursor: pointer;
  font-weight: 700;
}
.xt-top {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}
@media (max-width: 520px) {
  .xt-top {
    grid-template-columns: 1fr;
  }
}
.xt-g {
  text-align: center;
}
.xt-gc {
  font-size: 12px;
  margin-top: 4px;
}
.xt-s {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 8px;
}
.xt-s > div {
  min-width: 0;
}
.xt-s .l {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--mut, #91969f);
}
.xt-s b {
  display: block;
  font-size: 15px;
  margin-top: 4px;
}
.xt-m {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--mut, #91969f);
}
.xt-m b {
  color: var(--tx, inherit);
}
.xt-w {
  overflow-x: auto;
  margin: 8px -4px 0;
  padding: 0 4px;
}
.xt-w table {
  min-width: 680px;
  font-size: 12px;
  white-space: nowrap;
}
.xt-w td,
.xt-w th {
  padding: 8px 8px;
  vertical-align: middle;
}
.xt-w tr[data-a] {
  cursor: pointer;
}
.xt-p {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 99px;
  font-size: 12px;
  border: 1px solid var(--bd, #2c2f33);
}
.xt-p.f {
  color: var(--ac, #86abcb);
}
.xt-p.a {
  color: #c2933d;
}
`,
          "legacy-002": `.an-g {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (max-width: 700px) {
  .an-g {
    grid-template-columns: 1fr;
  }
}
.an {
  margin: 0 !important;
}
.an-h {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mut, #91969f);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.an-h i {
  font-style: normal;
}
.an-h small {
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.7;
}
.an-k {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 12px;
}
.an-k.c4 {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 700px) {
  .an-k.c4 {
    grid-template-columns: 1fr 1fr;
  }
}
.an-k .l {
  font-size: 12px;
  color: var(--mut, #91969f);
}
.an-k .v {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin: 4px 0;
}
.an-k .s {
  font-size: 12px;
  color: var(--mut, #91969f);
  line-height: 1.5;
}
.an-bar {
  height: 6px;
  border-radius: 6px;
  background: var(--bd, #2c2f33);
  overflow: hidden;
  margin-top: 8px;
}
.an-bar > i {
  display: block;
  height: 100%;
}
.an-box {
  border: 1px solid var(--bd, #2c2f33);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}
.an-box .v {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0;
}
.an-box .l,
.an-box .s {
  font-size: 12px;
  color: var(--mut, #91969f);
}
.an-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.an-hr {
  border: 0;
  border-top: 1px solid var(--bd, #2c2f33);
  margin: 12px 0;
}
.an-amb {
  color: #c2933d;
}
.an-blu {
  color: #86abcb;
}
.an-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 99px;
  font-size: 12px;
  border: 1px solid var(--bd, #2c2f33);
  color: var(--mut, #91969f);
}
.an-ev.bad {
  border-color: rgba(232,108,89,0.45);
}
`,
          "legacy-003": `#tape {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: #060707;
  border-bottom: 1px solid #3d4046;
  box-shadow: 0 1px 10px rgba(61,64,70,0.35);
  padding-top: env(safe-area-inset-top, 0px);
}
#tapeSp {
  height: 47px;
}
#tape .tradingview-widget-container {
  height: 46px;
  overflow: hidden;
}
#tape .tradingview-widget-copyright {
  display: none;
}
`,
          "legacy-004": `nav {
  display: none !important;
}
#app {
  padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
}
#fab {
  bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
}
#fabm {
  bottom: calc(86px + env(safe-area-inset-bottom, 0px)) !important;
}
#mbtn {
  position: absolute;
  left: 0;
  top: env(safe-area-inset-top, 0px);
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060707;
  color: #eae9e6;
  border: 0;
  border-right: 1px solid #3d4046;
  z-index: 3;
  cursor: pointer;
  padding: 0;
}
#tape .tradingview-widget-container,
#tape .mq {
  margin-left: 48px;
}
#mdr {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
}
#mdr .mbk {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.55);
}
#mdr .mpn {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: min(84vw, 330px);
  background: var(--bg);
  color: var(--tx);
  border-right: 1px solid var(--bd);
  overflow-y: auto;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 12px
    calc(16px + env(safe-area-inset-bottom, 0px));
  animation: mdi 0.18s ease-out;
}
@keyframes mdi {
  from {
    transform: translateX(-100%);
  }
}
#mdr .mhd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
#mdr .mhd button {
  background: none;
  border: 0;
  color: var(--tx);
  font-size: 24px;
  padding: 4px 8px;
}
#mdr .ms {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mut);
  margin: 16px 4px 8px;
}
#mdr .mit {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-radius: 8px;
  padding: 8px;
  color: var(--tx);
  font: inherit;
  cursor: pointer;
}
#mdr .mit small {
  display: block;
  color: var(--mut);
  font-size: 12px;
}
#mdr .mit.on {
  background: color-mix(in srgb, var(--ac) 18%, var(--bg));
}
#mdr .mi {
  width: 28px;
  display: flex;
  justify-content: center;
  font-size: 20px;
  flex: none;
}
`,
          "legacy-005": `#pdfov {
  position: fixed;
  inset: 0;
  z-index: 99999;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: #ffffff;
  color: #111111;
  --bg: #ffffff;
  --tx: #111111;
  --mut: #6d737e;
  --bd: #e1dfdb;
  --g: #2e8a5c;
  --r: #d04e3a;
  --ac: #588bb8;
}
#pdfov .pvbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 16px 8px;
  background: #ffffff;
  border-bottom: 1px solid #e1dfdb;
}
#pdfov .pvbar button {
  flex: 1;
  padding: 12px 8px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: 0;
  background: #588bb8;
  color: #ffffff;
}
#pdfov .pvbar button.pvs {
  background: #f3f2f1;
  color: #111111;
  border: 1px solid #e1dfdb;
  flex: 0 0 auto;
}
#pdfov .pvbar button[disabled] {
  opacity: 0.6;
}
#pdfst {
  padding: 8px 16px 0;
  min-height: 18px;
  font-size: 13px;
  color: #6d737e;
}
#pdfbody {
  max-width: 820px;
  margin: 0 auto;
  padding: 16px 16px calc(32px + env(safe-area-inset-bottom, 0px));
  background: #ffffff;
  color: #111111;
}
#pdfov .card {
  background: #ffffff !important;
  box-shadow: none;
}
#pdfov svg {
  max-width: 100%;
}
`,
          "legacy-006": `#fab {
  width: 46px !important;
  height: 46px !important;
  min-width: 0 !important;
  padding: 0 !important;
  font-size: 24px !important;
  line-height: 46px !important;
  right: 14px !important;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
  opacity: 0.92;
}
#fabm {
  right: 14px !important;
  bottom: calc(66px + env(safe-area-inset-bottom, 0px)) !important;
}
#app {
  padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important;
}
.g2 > *,
.g3 > * {
  min-width: 0;
}
input[type="date"],
input[type="datetime-local"],
input[type="time"] {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  min-height: 42px;
  text-align: left;
}
.seg {
  display: flex !important;
  gap: 4px;
}
.seg.wr {
  flex-wrap: wrap;
}
.seg > button {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  font-size: 14px;
  padding-left: 8px;
  padding-right: 8px;
}
details > summary {
  cursor: pointer;
}
`,
          "legacy-007": `html,
body {
  overscroll-behavior-y: contain;
}
.btn,
.chip,
.seg button,
.mit,
.tile,
[data-a],
[data-seg],
[data-dseg] {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.btn,
.chip,
.seg button,
.mit,
.tile,
#fab,
#btop {
  transition:
    transform 0.12s ease,
    filter 0.12s ease,
    background-color 0.15s ease;
}
.btn:active,
.chip:active,
.seg button:active,
.tile:active,
#fab:active,
#btop:active {
  transform: scale(0.95);
  filter: brightness(1.15);
}
.mit:active {
  transform: scale(0.98);
  filter: brightness(1.2);
}
.card[data-a]:active {
  transform: scale(0.99);
}
.btn:focus-visible,
.chip:focus-visible,
.seg button:focus-visible,
.mit:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--ac);
  outline-offset: 2px;
}
#ptr {
  position: fixed;
  left: 50%;
  top: calc(env(safe-area-inset-top, 0px) + 56px);
  width: 38px;
  height: 38px;
  margin-left: -20px;
  border-radius: 50%;
  background: var(--card, #111111);
  color: var(--tx);
  border: 1px solid var(--bd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 60;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-60px);
}
#ptr.go {
  color: var(--g);
}
#ptr.spin span {
  display: inline-block;
  animation: ptrs 0.7s linear infinite;
}
@keyframes ptrs {
  to {
    transform: rotate(360deg);
  }
}
#btop {
  position: fixed;
  left: 16px;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--card, #111111);
  color: var(--tx);
  border: 1px solid var(--bd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 40;
  opacity: 0;
  transform: translateY(16px) scale(0.9);
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  padding: 0;
}
#btop.on {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
#tst {
  position: fixed;
  left: 50%;
  bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  transform: translate(-50%, 20px);
  max-width: 86vw;
  background: var(--card, #111111);
  color: var(--tx);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  z-index: 120;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
#tst.on {
  opacity: 1;
  transform: translate(-50%, 0);
}
@media (prefers-reduced-motion: reduce) {
  .btn:active,
  .chip:active,
  .seg button:active,
  .tile:active,
  #fab:active,
  #btop:active {
    transform: none;
  }
  #ptr.spin span {
    animation: none;
  }
}
`,
          "legacy-008": `.rs-sec {
  border-top: 1px solid var(--bd);
  padding: 8px 0;
}
.rs-sec summary {
  cursor: pointer;
}
.rs-bar {
  height: 100%;
  width: 40%;
  background: var(--ac);
  border-radius: 2px;
  animation: rsb 1.3s ease-in-out infinite;
}
@keyframes rsb {
  0% {
    margin-left: -40%;
  }
  100% {
    margin-left: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rs-bar {
    animation: none;
    width: 100%;
  }
}
`,
          "legacy-009": `#rl {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg, #111111);
  display: flex;
  flex-direction: column;
}
#rl .rl-top {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--bd);
}
#rl .rl-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  padding: 16px;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  line-height: 1.65;
  -webkit-overflow-scrolling: touch;
}
.md h2 {
  font-size: 1.35em;
  margin: 8px 0 8px;
}
.md h3 {
  font-size: 1.12em;
  margin: 16px 0 8px;
}
.md h4,
.md h5 {
  font-size: 1em;
  margin: 16px 0 4px;
}
.md p {
  margin: 0 0 8px;
}
.md ul,
.md ol {
  padding-left: 24px;
  margin: 8px 0 8px;
}
.md li {
  margin: 4px 0;
}
.md blockquote {
  margin: 8px 0;
  padding-left: 8px;
  border-left: 1px solid var(--bd);
  opacity: 0.9;
}
.md code {
  font-size: 0.92em;
  background: var(--bd);
  padding: 0 4px;
  border-radius: 6px;
}
`,
          "legacy-010": `#qz {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg, #111111);
  display: flex;
  flex-direction: column;
}
#qz .qz-top {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--bd);
}
#qz .qz-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
.qz-op {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  padding: 12px;
  margin: 0 0 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card, transparent);
  color: inherit;
  font: inherit;
  line-height: 1.4;
  cursor: pointer;
}
.qz-op b {
  flex: 0 0 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.qz-op span {
  flex: 1;
}
`,
          "legacy-011": `#app .mk-seg {
  display: none !important;
}
html body .seg.hub {
  -webkit-mask-image: linear-gradient(
    90deg,
    #000000 calc(100% - 28px),
    transparent
  );
  mask-image: linear-gradient(90deg, #000000 calc(100% - 28px), transparent);
}
html body .seg.hub.fim {
  -webkit-mask-image: none;
  mask-image: none;
}
#mdr2 {
  position: fixed;
  inset: 0;
  z-index: 90;
}
#mdr2 .bk {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  animation: m2f 0.18s ease-out;
}
#mdr2 .pn {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: min(82vw, 320px);
  background: var(--bg);
  border-right: 1px solid var(--bd);
  padding: calc(16px + env(safe-area-inset-top, 0px)) 12px
    calc(16px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  animation: m2s 0.2s ease-out;
  overflow-y: auto;
}
@keyframes m2s {
  from {
    transform: translateX(-30px);
    opacity: 0.4;
  }
}
@keyframes m2f {
  from {
    opacity: 0;
  }
}
#mdr2 .hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 16px;
}
#mdr2 .hd b {
  font-size: 20px;
  letter-spacing: -0.02em;
}
#mdr2 .hd button {
  background: none;
  border: 0;
  color: var(--mut);
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px;
}
#mdr2 .it {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 12px 8px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--tx);
  text-align: left;
  cursor: pointer;
  font: inherit;
}
#mdr2 .it.on {
  background: var(--ac2);
}
#mdr2 .it.on .ic {
  color: var(--ac);
}
#mdr2 .it .ic {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--card2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tx);
  flex: none;
}
#mdr2 .it .ic svg {
  width: 20px;
  height: 20px;
  margin: 0;
}
#mdr2 .it b {
  display: block;
  font-size: 16px;
  font-weight: 650;
}
#mdr2 .it small {
  display: block;
  color: var(--mut);
  font-size: 13px;
  margin-top: 1px;
}
#mdr2 .it .ch {
  margin-left: auto;
  color: var(--mut);
}
#mdr2 .ft {
  margin-top: auto;
  padding: 16px 8px 0;
  border-top: 1px solid var(--bd);
  display: flex;
  gap: 8px;
}
#mdr2 .ft button {
  flex: 1;
  background: var(--card2);
  border: 1px solid var(--bd);
  color: var(--tx);
  border-radius: 8px;
  padding: 8px;
  font: 600 14px var(--fs);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
#mdr2 .ft svg {
  width: 17px;
  height: 17px;
  margin: 0;
}
`,
          "legacy-012": `#qk,
#hbe {
  position: fixed;
  inset: 0;
  z-index: 70;
}
.qk-bk {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
}
.qk-pn {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--bg);
  border-top: 1px solid var(--bd);
  border-radius: 8px 8px 0 0;
  padding: 16px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  max-width: 640px;
  margin: 0 auto;
  animation: qkS 0.2s ease-out;
}
@keyframes qkS {
  from {
    transform: translateY(30px);
    opacity: 0.5;
  }
}
#fx {
  position: fixed;
  inset: 0;
  z-index: 65;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}
#fx .fx-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--bd);
}
#fx .fx-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
.bk-st .ico {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
}
`,
          "legacy-013": `.lwc .lwc-cv {
  margin-top: 8px;
}
.lwc .tvg-t {
  font-size: 12px;
  font-weight: 700;
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.lwc .tvg-box {
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--bd);
}
#tvfs {
  position: fixed;
  inset: 0;
  z-index: 66;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
#tvfs .fx-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--bd);
}
#pdfov .lwc-cv {
  display: none !important;
}
#pdfov .lwc-svg {
  display: block !important;
}
#pdfov .lwc-bt {
  display: none !important;
}
`,
          "legacy-014": `html,
body {
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
input,
select,
textarea {
  font-size: 16px !important;
}
`,
          "legacy-015": `.card.rd {
  margin: 8px 0 12px;
  padding:24px;
}
.rd-tt {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.rd-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.rd-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--g, #ad853a);
  display: inline-block;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--g, #ad853a) 25%, transparent);
}
.rd-seg {
  margin-bottom: 8px;
}
.rd-it {
  border-top: 1px solid var(--bd, rgba(127,127,127,0.2));
  padding: 8px 4px;
  cursor: pointer;
}
.rd-it.off {
  opacity: 0.55;
}
.rd-l1 {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.rd-l1 b {
  font-size: 16px;
}
.rd-st {
  font-size: 13px;
  opacity: 0.85;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rd-sc {
  font-size: 12px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
  flex: none;
}
.rd-sc.g {
  background: rgba(58,173,116,0.18);
  color: #3aad74;
}
.rd-sc.y {
  background: rgba(184,140,58,0.18);
  color: #b88c3a;
}
.rd-sc.m {
  background: rgba(160,164,172,0.18);
  color: #9ca0a9;
}
.rd-l2 {
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.rd-l2 span {
  white-space: nowrap;
}
.rd-rr {
  font-weight: 700;
  text-align: right;
}
.rd-l3 {
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.rd-l3:empty {
  display: none;
}
.rd-ia {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--acc, #709bc2) 10%, transparent);
}
.rd-ct {
  margin-top: 4px;
  font-size: 12px;
  color: #b88c3a;
}
.rd-det {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.45;
  display: grid;
  gap: 4px;
}
.rd-bt {
  margin-top: 8px;
}
.rd-mais {
  margin-top: 4px;
  font-size: 12px;
}
.rd-sai {
  margin-top: 8px;
}
.rd-sai summary {
  padding: 8px 4px;
  cursor: pointer;
}
.rd-ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--bd, rgba(127,127,127,0.2));
}
.rd-pu {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rd-pu select {
  width: auto;
  min-width: 72px;
  padding: 8px 24px 8px 8px;
  font-size: 16px;
  text-align: left;
}
.rd-av {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
}
.rd-fib {
  margin-top: 8px;
}
.rd-fh {
  margin-bottom: 4px;
  opacity: 0.85;
}
.rd-fg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.rd-fa {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 6px;
  background: rgba(173,133,58,0.1);
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}
.rd-fa b {
  font-size: 15px;
  color: #ad853a;
}
.rd-fa small {
  font-size: 12px;
  opacity: 0.8;
}
.rd-fa.ok {
  background: rgba(58,173,116,0.28);
  outline: 1px solid #3aad74;
}
.rd-l2 {
  grid-template-columns: auto 1fr !important;
}
.rd-meu {
  margin-top: 8px;
  padding: 8px;
  border-radius: 6px;
  border: 1px dashed var(--bd, rgba(127,127,127,0.35));
  display: grid;
  gap: 8px;
}
.rd-mg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.rd-mg label {
  font-size: 12px;
}
.rd-mg input {
  font-size: 16px;
  width: 100%;
}
.rd-bt {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.rd-svg {
  width: 100%;
  height: auto;
  display: block;
  margin: 8px 0 4px;
  background: color-mix(in srgb, var(--tx, #ffffff) 3%, transparent);
  border-radius: 6px;
}
.rd-tf {
  margin: 4px 0 4px;
}
.rd-tf button.sem {
  opacity: 0.45;
}
.rd-piv {
  display: grid;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
  padding: 8px;
  border-radius: 6px;
  background: rgba(194,148,62,0.08);
}
.rd-p {
  display: inline-block;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 50%;
  background: #c2943e;
  color: #111111;
  font-size: 12px;
  margin-right: 4px;
}
.am {
  color: #c2943e;
}
.rd-mt {
  width: 100%;
  margin: 4px 0 4px;
}
.rd-pt {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.rd-pt th,
.rd-pt td {
  padding: 8px 4px;
  text-align: right;
  border-top: 1px solid var(--bd, rgba(127,127,127,0.2));
}
.rd-pt th:first-child,
.rd-pt td:first-child {
  text-align: left;
}
.rd-pf {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  border-top: 1px solid var(--bd, rgba(127,127,127,0.2));
}
`,
          "legacy-016": `.trv-sh {
  max-width: 520px;
}
.trv-b {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px;
  margin: 8px 0;
}
.trv-b.r {
  border-color: var(--r);
}
.trv-b.am {
  border-color: var(--ds-line-2);
}
.trv-b ul {
  margin: 8px 0 8px 16px;
  padding: 0;
}
.trv-v {
  margin-top: 8px;
}
.trv-v .btn {
  width: 100%;
  margin-top: 8px;
}
.trv-top {
  background: color-mix(in srgb, var(--r) 18%, transparent);
  border: 1px solid var(--r);
  border-radius: 8px;
  padding: 8px 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.mt-card {
  margin-top: 12px;
  border: 1px solid color-mix(in srgb, var(--ac, #709bc2) 45%, var(--bd));
}
.mt-st {
  font-size: 20px;
  font-weight: 750;
  margin: 4px 0 4px;
}
.mt-st.r {
  color: var(--r);
}
.mt-st.am,
.am {
  color: #c2933d;
}
.mt-st.g {
  color: var(--g);
}
.mt-nota {
  font-weight: 800;
  font-size: 18px;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  background: var(--bg);
  border: 1px solid var(--bd);
}
.mt-nota.nA {
  color: var(--g);
  border-color: var(--g);
}
.mt-nota.nB {
  color: #cba763;
  border-color: var(--ds-line-2);
}
.mt-nota.nC {
  color: #c2933d;
  border-color: var(--ds-line-2);
}
.mt-nota.nD,
.mt-nota.nE {
  color: var(--r);
  border-color: var(--r);
}
.mt-kpi {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 8px 0;
}
.mt-kpi > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px;
  border-radius: 8px;
  background: var(--bg);
  border: 1px solid var(--bd);
}
.mt-kpi b {
  font-size: 18px;
}
.mt-bar {
  height: 5px;
  border-radius: 6px;
  background: var(--bd);
  margin-top: 4px;
  overflow: hidden;
}
.mt-bar i {
  display: block;
  height: 100%;
}
.mt-cob {
  display: grid;
  gap: 8px;
  margin: 8px 0;
}
.mt-ach {
  padding: 8px;
  border-radius: 6px;
  border-left: 1px solid var(--bd);
  background: var(--bg);
  font-size: 14px;
  line-height: 1.4;
}
.mt-ach.g3 {
  border-left-color: var(--r);
}
.mt-ach.g2 {
  border-left-color: var(--ds-line-2);
}
.mt-reg {
  margin-top: 8px;
}
.mt-reg summary {
  padding: 8px 0;
  cursor: pointer;
}
`,
          "legacy-017": `.nt-it {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.nt-it:first-of-type {
  border-top: 0;
}
.nt-tx {
  margin: 4px 0 8px;
  line-height: 1.45;
}
.nt-ok {
  font-size: 13px;
  padding: 4px 8px;
}
`,
          "legacy-018": `#lvg {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 8px
    calc(8px + env(safe-area-inset-bottom, 0px));
  overflow: auto;
}
#lvg .fx-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lvg-tf {
  margin: 8px 0;
}
.lvg-ohlc {
  min-height: 18px;
  margin: 4px 0 4px;
  font-variant-numeric: tabular-nums;
}
.lvg-svg {
  width: 100%;
  height: auto;
  display: block;
  background: color-mix(in srgb, var(--tx, #ffffff) 3%, transparent);
  border-radius: 8px;
}
.lvg-nota {
  margin-top: 8px;
  display: grid;
  gap: 4px;
  line-height: 1.4;
}
#lvcb tr {
  cursor: pointer;
}
`,
          "legacy-019": `.snt {
  margin-top: 8px;
}
.snt-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.snt-g {
  width: 100%;
  max-width: 300px;
  height: auto;
  display: block;
}
.snt-rot {
  font-weight: 800;
  font-size: 18px;
  margin-top: -8px;
}
.snt-cmp {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  margin: 8px 0 4px;
  font-variant-numeric: tabular-nums;
}
.snt-sp {
  width: 100%;
  height: 46px;
  display: block;
}
.snt-lei {
  margin-top: 8px;
  line-height: 1.45;
}
.snt-comps {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}
.snt-bar {
  height: 6px;
  border-radius: 6px;
  background: var(--bd);
  overflow: hidden;
  margin: 4px 0;
}
.snt-bar i {
  display: block;
  height: 100%;
}
.snt-fonte {
  margin-top: 8px;
}
`,
          "legacy-020": `.mdo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}
.mdo-t {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-variant-numeric: tabular-nums;
}
.mdo-t b {
  font-size: 15px;
}
.mdo-n {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.85;
}
.mdo-pre {
  border-width: 1px;
}
.mdo-vies {
  font-size: 20px;
  font-weight: 800;
  text-transform: capitalize;
  margin: 4px 0;
}
.mdo-bar {
  position: relative;
  height: 6px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e7614c, #b88c3a 50%, #ad853a);
  margin: 8px 0 8px;
}
.mdo-bar i {
  position: absolute;
  top: -4px;
  width: 6px;
  height: 14px;
  border-radius: 3px;
  transform: translateX(-50%);
  border: 1px solid var(--bg);
}
.mdo-ewz {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  margin: 0 0 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}
.mdo-ewz b {
  font-size: 18px;
}
.mdo-ext {
  opacity: 0.9;
  white-space: nowrap;
}
.mdo-pi {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 8px;
  padding: 4px 0;
  border-top: 1px solid var(--bd);
}
.mdo-pi span:last-child {
  grid-column: 1/3;
}
.mdo-bg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mdo-b {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px;
}
.mdo-b b {
  font-size: 18px;
}
.mdo-sp {
  width: 100%;
  height: 24px;
  display: block;
  margin-top: 4px;
}
.mdo-t,
.mdo-b,
.mdo-f tr[data-mdoi] {
  cursor: pointer;
}
.mdo-t.sel,
.mdo-b.sel {
  outline: 2px solid var(--ac, #709bc2);
}
.mdo-f tr.sel td {
  background: color-mix(in srgb, var(--ac, #709bc2) 12%, transparent);
}
.mdo-pp {
  font-size: 12px;
  letter-spacing: -1px;
  margin-right: 4px;
  vertical-align: middle;
}
.mdo-pp.p3 {
  color: #e7614c;
}
.mdo-pp.p2 {
  color: #c2933d;
}
.mdo-pp.p1 {
  color: #9ca0a9;
}
.mdo-inf {
  margin: 8px 0;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: color-mix(in srgb, var(--ac, #709bc2) 6%, transparent);
  display: grid;
  gap: 8px;
}
.mdo-peso {
  font-weight: 800;
}
.mdo-peso.r {
  color: #e7614c;
}
.mdo-cen {
  padding: 8px 8px;
  border-radius: 6px;
  border: 1px solid var(--bd);
  opacity: 0.7;
}
.mdo-cen.on {
  opacity: 1;
  border-color: var(--ac, #709bc2);
  background: color-mix(in srgb, var(--ac, #709bc2) 10%, transparent);
}
.mdo-f {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.mdo-f td,
.mdo-f th {
  padding: 8px 4px;
  border-top: 1px solid var(--bd);
  text-align: right;
}
.mdo-f td:first-child {
  text-align: left;
}
`,
          "legacy-021": `#onb .ck {
  justify-content: flex-start;
  align-items: center;
  margin: 8px 0;
  padding: 8px 12px;
  border: 1px solid var(--bd);
  border-radius: 8px;
}
#onb input[type="radio"] {
  width: auto;
  flex: none;
  margin: 0;
  accent-color: var(--ac);
}
#onb .ck:has(input:checked) {
  border-color: var(--ac);
  background: color-mix(in srgb, var(--ac) 10%, transparent);
}
[data-termo] {
  width: auto;
  flex: none;
  margin-top: 4px;
}
`,
          "legacy-022": `html:root[data-theme="dark"],
html:root:not([data-theme]) {
  --bg: #070708;
  --card: #0e0f10;
  --card2: #141517;
  --bd: rgba(212,181,125,0.09);
  --bd2: rgba(212,181,125,0.18);
  --tx: #eeedeb;
  --mut: #8b9c94;
  --ac: #ac8439;
  --ac2: rgba(172,132,57,0.14);
  --g: #3aad74;
  --r: #e86753;
  --am: #cfab69;
}
@media (prefers-color-scheme: light) {
  html:root:not([data-theme]) {
    --bg: #efeeeb;
    --card: #ffffff;
    --card2: #efeeeb;
    --bd: rgba(19,20,22,0.09);
    --bd2: rgba(19,20,22,0.17);
    --tx: #0f0f11;
    --mut: #5e6f67;
    --ac: #ac8439;
    --ac2: rgba(172,132,57,0.1);
    --g: #2e8b5d;
    --r: #dc3e26;
    --am: #a37c33;
  }
}
html:root[data-theme="light"] {
  --bg: #efeeeb;
  --card: #ffffff;
  --card2: #efeeeb;
  --bd: rgba(19,20,22,0.09);
  --bd2: rgba(19,20,22,0.17);
  --tx: #0f0f11;
  --mut: #5e6f67;
  --ac: #ac8439;
  --ac2: rgba(172,132,57,0.1);
  --g: #2e8b5d;
  --r: #dc3e26;
  --am: #a37c33;
}
body {
  font-feature-settings:
    "tnum" 1,
    "cv11" 1;
  -webkit-font-smoothing: antialiased;
}
#splash {
  background: radial-gradient(
    120% 70% at 50% 40%,
    #18191b 0%,
    #070708 70%
  ) !important;
}
#splash svg.lg {
  width: 104px;
  height: 104px;
  filter: drop-shadow(0 10px 30px rgba(172,132,57,0.35));
}
#splash b {
  font-weight: 800;
  letter-spacing: -0.01em;
}
h1 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.025em;
}
h2 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--mut);
  margin: 24px 4px 8px;
}
h3 {
  letter-spacing: 0.08em;
}
.card {
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tx) 2.5%, var(--card)),
    var(--card)
  );
  border-color: var(--bd);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--tx) 4%, transparent) inset,
    0 8px 24px -16px rgba(0,0,0,0.6);
}
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border-color: var(--bd2);
  background:
    radial-gradient(
      120% 90% at 100% 0%,
      color-mix(in srgb, var(--ac) 22%, transparent) 0%,
      transparent 55%
    ),
    linear-gradient(
      165deg,
      color-mix(in srgb, var(--ac) 10%, var(--card)) 0%,
      var(--card) 75%
    ) !important;
  box-shadow: 0 18px 40px -24px color-mix(in srgb, var(--ac) 55%, transparent);
}
.big {
  font-weight: 800;
  letter-spacing: -0.04em;
}
.btn {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ac) 88%, #ffffff),
    var(--ac)
  );
  border-radius: 8px;
  box-shadow:
    0 6px 16px -8px color-mix(in srgb, var(--ac) 80%, transparent),
    0 1px 0 rgba(255,255,255,0.18) inset;
  letter-spacing: 0.01em;
}
.btn:active {
  transform: translateY(1px) scale(0.99);
}
.btn.s {
  background: var(--card2);
  box-shadow: none;
  border-color: var(--bd);
}
.btn.d {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--r) 88%, #ffffff),
    var(--r)
  );
  box-shadow: 0 6px 16px -8px color-mix(in srgb, var(--r) 70%, transparent);
}
.btn.s.d {
  background: transparent;
  color: var(--r);
  border-color: color-mix(in srgb, var(--r) 45%, transparent);
}
.seg {
  background: var(--card2);
  border-color: var(--bd);
  border-radius: 8px;
}
.seg > button.on,
.seg > button[aria-selected="true"] {
  background: var(--card) !important;
  color: var(--tx) !important;
  box-shadow:
    0 0 0 1px var(--bd2),
    0 4px 12px -6px color-mix(in srgb, var(--ac) 60%, transparent) !important;
}
input,
select,
textarea {
  border-radius: 8px;
  background: var(--card2);
  border-color: var(--bd);
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--ac2);
}
.chip {
  border-radius: 999px;
}
.kv .card,
.kv > div {
  border-radius: 8px;
}
.warn {
  border-radius: 8px;
}
#bnav .mais span.bx {
  background: linear-gradient(160deg, #c19646, #ac8439) !important;
  box-shadow: 0 10px 24px -8px rgba(172,132,57,0.7) !important;
}
#bnav button.on {
  color: var(--ac);
}
#tape {
  border-bottom-color: color-mix(
    in srgb,
    var(--ac) 45%,
    transparent
  ) !important;
  box-shadow: 0 1px 14px color-mix(in srgb, var(--ac) 30%, transparent) !important;
}
#mbtn {
  border-right-color: color-mix(in srgb, var(--ac) 35%, transparent) !important;
}
.mlogo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mlogo svg {
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 6px;
  box-shadow: 0 6px 16px -8px rgba(172,132,57,0.8);
}
.mlogo b {
  font-size: 18px !important;
  letter-spacing: -0.01em;
}
.mlogo small {
  display: block;
  font-size: 12px;
  color: var(--mut);
  font-weight: 500;
}
.g {
  color: var(--g);
}
.r {
  color: var(--r);
}
::selection {
  background: var(--ac2);
}
html body #tape .ti {
  color: var(--tx);
  border-right-color: var(--bd);
}
html body #tape .ti > span:first-child {
  color: var(--mut);
  font-weight: 600;
  letter-spacing: 0.03em;
}
#pdfov .pvbar button {
  background: var(--ac);
}
html body #mbtn {
  background: var(--bg) !important;
  color: var(--tx) !important;
}
`,
          "legacy-023": `.olbox .top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.olc {
  margin: 8px 0 0;
  padding: 12px;
  background: var(--card2);
  border: 1px solid var(--bd);
}
.olc.arq {
  opacity: 0.7;
}
.olsd {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
}
.olsd.c {
  background: rgba(172,132,57,0.15);
  color: var(--g, #ac8439);
}
.olsd.v {
  background: rgba(231,97,76,0.15);
  color: var(--r, #e7614c);
}
.olb {
  font-size: 12px;
  font-weight: 650;
  padding: 4px 8px;
  border-radius: 6px;
}
.olb.ok {
  background: rgba(50,151,101,0.15);
  color: var(--g, #329765);
}
.olb.no {
  background: rgba(231,97,76,0.14);
  color: var(--r, #e7614c);
}
.olb.q {
  background: rgba(194,148,62,0.15);
  color: #a98136;
}
.olg {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.olg div {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 6px;
  padding: 8px 8px;
}
.olg small {
  display: block;
  color: var(--mut);
  font-size: 12px;
}
.olg b {
  font-variant-numeric: tabular-nums;
}
.olr {
  margin-top: 8px;
}
.olr summary,
.olcfg summary,
.olarq summary {
  cursor: pointer;
  padding: 4px 0;
}
.olri {
  margin: 4px 0;
}
.olbt {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}
.olbt .x {
  margin-left: auto;
}
.olform {
  margin-top: 8px;
  background: var(--card2);
  border: 1px solid var(--bd);
}
.olform .g3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.olck {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 8px 0;
  font-size: 14px;
}
.olck input {
  width: auto;
  margin-top: 4px;
}
.olauto {
  font-size: 12px;
  font-weight: 700;
  color: var(--ac);
  border: 1px solid var(--ac);
  border-radius: 6px;
  padding: 0 4px;
}
.olcfg {
  margin-top: 12px;
}
.olcr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bd);
}
.olcr > span {
  flex: 1;
}
.olcr label {
  display: flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
}
.olcr input {
  width: auto;
}
`,
          "legacy-024": `.ag-dest {
  margin: 8px 0 8px;
}
.ag-dest > div:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.ag-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ac, #709bc2) 12%, transparent);
  border: 1px solid var(--bd);
}
.ag-dia {
  border: 1px solid var(--bd);
  border-radius: 8px;
  margin: 8px 0;
  overflow: hidden;
}
.ag-dia.hoje {
  border-color: var(--ac, #709bc2);
  border-width: 1px;
}
.ag-dh {
  padding: 8px 8px;
  background: color-mix(in srgb, var(--ac, #709bc2) 8%, transparent);
  font-size: 13px;
  letter-spacing: 0.3px;
}
.ag-dh b {
  font-size: 20px;
  margin-right: 8px;
}
.ag-dh span:first-of-type {
  font-weight: 700;
  color: var(--ac, #709bc2);
}
.ag-ev {
  display: grid;
  grid-template-columns: 44px 24px 1fr;
  gap: 8px;
  padding: 8px 8px;
  border-top: 1px solid var(--bd);
  align-items: start;
  font-size: 14px;
}
.ag-ev.pas {
  opacity: 0.55;
}
.ag-ev.prox {
  background: color-mix(in srgb, #b88c3a 14%, transparent);
}
.ag-h {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ac, #709bc2);
}
.ag-fl {
  font-size: 16px;
  line-height: 1.2;
}
.ag-n {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.ag-imp {
  display: inline-flex;
  gap: 1px;
  align-items: flex-end;
  vertical-align: middle;
  margin-left: 4px;
}
.ag-imp i {
  width: 3px;
  background: var(--bd);
  border-radius: 1px;
}
.ag-imp i:nth-child(1) {
  height: 5px;
}
.ag-imp i:nth-child(2) {
  height: 8px;
}
.ag-imp i:nth-child(3) {
  height: 11px;
}
.ag-imp.i1 i:nth-child(1),
.ag-imp.i2 i:nth-child(-n + 2),
.ag-imp.i3 i {
  background: #709bc2;
}
.ag-imp.i3 i {
  background: #e7614c;
}
.ag-tag {
  font-size: 12px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 6px;
  background: var(--ac, #709bc2);
  color: #ffffff;
  vertical-align: middle;
}
`,
          "legacy-025": `.set-g {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px;
}
.set-p {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
}
.set-h {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}
.set-h > b {
  font-size: 16px;
}
.set-r {
  display: grid;
  grid-template-columns: 42% 1fr 54px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  min-height: 21px;
  padding: 1px 0;
}
.set-n {
  line-height: 1.2;
}
.set-v {
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.set-b {
  position: relative;
  height: 14px;
}
.set-z {
  position: absolute;
  left: 50%;
  top: -3px;
  bottom: -3px;
  width: 1px;
  background: var(--bd);
}
.set-bar {
  position: absolute;
  top: 2px;
  height: 10px;
  border-radius: 2px;
}
.set-bar.g {
  background: #3aad74;
}
.set-bar.r {
  background: #e7614c;
}
.set-d {
  margin-top: 8px;
  display: grid;
  gap: 8px;
}
.set-num {
  display: inline-flex;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: color-mix(in srgb, var(--ac, #709bc2) 18%, transparent);
  margin-right: 8px;
}
`,
          "legacy-026": `#pdfov {
  position: fixed;
  inset: 0;
  z-index: 99999;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: #eeedeb;
  color: #111111;
}
#pdfov .pvbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 16px 8px;
  background: #ffffff;
  border-bottom: 1px solid #e1dfdb;
}
#pdfov .pvbar button {
  flex: 1;
  padding: 12px 8px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: 0;
  background: #3b3e43;
  color: #ffffff;
}
#pdfov .pvbar button.pvs {
  background: #f3f2f1;
  color: #111111;
  border: 1px solid #e1dfdb;
  flex: 0 0 auto;
}
#pdfov .pvbar button[disabled] {
  opacity: 0.6;
}
#pdfst {
  padding: 8px 16px 4px;
  min-height: 18px;
  font-size: 13px;
  color: #444455;
}
#pdfprev {
  padding: 8px 16px calc(32px + env(safe-area-inset-bottom, 0px));
}
`,
          "legacy-027": `.eco-q {
  background: color-mix(in srgb, var(--ac, #709bc2) 10%, transparent);
  border-radius: 8px;
  padding: 8px 8px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
.eco-cf {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
  white-space: nowrap;
}
.eco-res {
  font-weight: 600;
  margin: 8px 0;
  line-height: 1.45;
}
.eco-p {
  margin: 8px 0;
  line-height: 1.55;
}
.eco-ul {
  margin: 4px 0 4px 16px;
  padding: 0;
  line-height: 1.45;
}
.eco-ul li {
  margin: 4px 0;
}
.eco-imp {
  display: grid;
  gap: 8px;
}
.eco-imp > div {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 8px;
}
.eco-imp > div > div {
  grid-column: 1/3;
}
.eco-cen {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  margin: 8px 0;
}
.eco-pb {
  height: 6px;
  border-radius: 6px;
  background: var(--bd);
  margin: 4px 0;
  overflow: hidden;
}
.eco-pb i {
  display: block;
  height: 100%;
  background: var(--ac, #709bc2);
}
.eco-ctr {
  margin-top: 8px;
  padding: 8px 8px;
  border-left: 1px solid var(--ds-line-2);
  background: color-mix(in srgb, #c2933d 10%, transparent);
  border-radius: 6px;
}
.eco-gl {
  margin-top: 8px;
}
.eco-gl summary {
  cursor: pointer;
  font-weight: 600;
}
.eco-gl div {
  margin: 4px 0;
}
.eco-ac {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  border-top: 1px solid var(--bd);
  padding-top: 8px;
}
.eco-nw {
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 8px;
}
.eco-nw .btn {
  padding: 4px 8px;
  font-size: 13px;
}
`,
          "legacy-028": `.pnl-g {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.pnl-t {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  background: var(--card, var(--bg));
  cursor: pointer;
  min-width: 0;
}
.pnl-t.ab {
  grid-column: 1/-1;
}
.pnl-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}
.pnl-dt {
  font-size: 12px;
  color: var(--mut);
  flex: none;
}
.pnl-n {
  background: #696e79;
  color: #ffffff;
  border-radius: 6px;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  line-height: 1.35;
  min-width: 0;
}
.pnl-d {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pnl-pe {
  font-size: 12px;
  color: var(--mut);
}
.pnl-px {
  margin: 4px 0 1px;
  font-variant-numeric: tabular-nums;
}
.pnl-px b {
  font-size: 15px;
}
.pnl-sv {
  width: 100%;
  height: auto;
  display: block;
}
`,
          "legacy-029": `html.aurora:root[data-theme="dark"],
html.aurora:root:not([data-theme]) {
  --bg: #0b0c0d;
  --card: #121315;
  --card2: #1b1c1f;
  --bd: rgba(134,171,203,0.13);
  --bd2: rgba(134,171,203,0.26);
  --tx: #f2f1ef;
  --mut: #999da6;
  --ac: #86abcb;
  --ac2: rgba(134,171,203,0.16);
  --g: #46c184;
  --r: #ed8777;
  --am: #d1af6f;
  --grad: linear-gradient(90deg, #86abcb, #b2aca0 50%, #d2b276);
  --glow: rgba(134,171,203,0.35);
}
@media (prefers-color-scheme: light) {
  html.aurora:root:not([data-theme]) {
    --bg: #f8f8f7;
    --card: #ffffff;
    --card2: #f5f4f2;
    --bd: rgba(81,85,94,0.1);
    --bd2: rgba(81,85,94,0.2);
    --tx: #1b1c1f;
    --mut: #6a707b;
    --ac: #6e9ac1;
    --ac2: rgba(110,154,193,0.1);
    --g: #2e8a5c;
    --r: #d6503b;
    --am: #a37c33;
    --grad: linear-gradient(90deg, #6b98c0, #9e9789 50%, #ac8439);
    --glow: rgba(107,152,192,0.25);
  }
}
html.aurora:root[data-theme="light"] {
  --bg: #f8f8f7;
  --card: #ffffff;
  --card2: #f5f4f2;
  --bd: rgba(81,85,94,0.1);
  --bd2: rgba(81,85,94,0.2);
  --tx: #1b1c1f;
  --mut: #6a707b;
  --ac: #6e9ac1;
  --ac2: rgba(110,154,193,0.1);
  --g: #2e8a5c;
  --r: #d6503b;
  --am: #a37c33;
  --grad: linear-gradient(90deg, #6b98c0, #9e9789 50%, #ac8439);
  --glow: rgba(107,152,192,0.25);
}
:root {
  --grad: linear-gradient(90deg, #ac8439, #ac8439 50%, #d2b276);
  --glow: rgba(172,132,57,0.3);
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
}
html.aurora body {
  background:
    radial-gradient(
        90% 50% at 50% -10%,
        color-mix(in srgb, var(--ac) 14%, transparent),
        transparent 70%
      )
      fixed,
    var(--bg);
}
html.aurora #splash {
  background: radial-gradient(
    120% 70% at 50% 40%,
    #2a2c31 0%,
    #0b0c0d 70%
  ) !important;
}
html.aurora .card {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ac) 4%, var(--card)),
    var(--card)
  );
  border-color: var(--bd);
  box-shadow:
    0 1px 0 color-mix(in srgb, #ffffff 4%, transparent) inset,
    0 10px 30px -20px var(--glow);
}
html.aurora .hero {
  background:
    radial-gradient(
      120% 90% at 100% 0%,
      color-mix(in srgb, #b2aca0 26%, transparent) 0%,
      transparent 55%
    ),
    radial-gradient(
      90% 80% at 0% 100%,
      color-mix(in srgb, #d2b276 12%, transparent) 0%,
      transparent 60%
    ),
    linear-gradient(
      165deg,
      color-mix(in srgb, var(--ac) 10%, var(--card)) 0%,
      var(--card) 75%
    ) !important;
  border-color: var(--bd2);
  box-shadow: 0 20px 44px -26px var(--glow);
}
html.aurora .btn:not(.s) {
  background: linear-gradient(135deg, #86abcb, #b2aca0);
  border-color: transparent;
  box-shadow:
    0 8px 20px -10px var(--glow),
    0 1px 0 rgba(255,255,255,0.2) inset;
}
html.aurora .btn.d:not(.s) {
  background: linear-gradient(135deg, #ed8777, #e05c48);
}
html.aurora #bnav .mais span.bx {
  background: linear-gradient(150deg, #86abcb, #b2aca0 55%, #c39a4d) !important;
  box-shadow: 0 10px 26px -8px var(--glow) !important;
}
html.aurora #tape {
  border-bottom-color: color-mix(
    in srgb,
    var(--ac) 40%,
    transparent
  ) !important;
  box-shadow: 0 1px 16px var(--glow) !important;
}
html.aurora .seg > button.on {
  box-shadow:
    0 0 0 1px var(--bd2),
    0 6px 16px -8px var(--glow) !important;
}
html.aurora h2 {
  color: color-mix(in srgb, var(--ac) 55%, var(--mut));
  letter-spacing: 0.16em;
  font-size: 12px;
}
.big,
.kv b,
.tc-g b,
.tc-pl,
.idt .v,
.olg b,
.mono {
  font-family: var(--mono);
  font-feature-settings: "tnum" 1;
  letter-spacing: -0.01em;
}
/* sub-abas (Mercado e Operações agrupados) */
.hub2 {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: -4px 0 12px;
  padding: 4px;
  scrollbar-width: none;
}
.hub2::-webkit-scrollbar {
  display: none;
}
.hub2 button {
  flex: none;
  border: 1px solid var(--bd);
  background: transparent;
  color: var(--mut);
  border-radius: 999px;
  padding: 8px 12px;
  font: 600 13px var(--fs, inherit);
  cursor: pointer;
}
.hub2 button.on {
  color: var(--tx);
  border-color: transparent;
  background:
    linear-gradient(var(--card2), var(--card2)) padding-box,
    var(--grad) border-box;
  border: 1px solid transparent;
}
/* cartão de trade */
.tcard {
  display: block !important;
  padding:24px!important;
  position: relative;
  overflow: hidden;
}
.tcard:before {
  content: "";
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--bd2);
}
.tcard.tc-g:before {
  background: var(--g);
}
.tcard.tc-l:before {
  background: var(--r);
}
.tcard.tc-op:before {
  background: var(--grad);
}
.tc-h {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.tc-h .th {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
  flex: none;
  background: var(--card2);
}
.tc-h .th img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tc-h .fl {
  flex: 1;
  min-width: 0;
}
.tc-t {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tc-t b {
  font-size: 16px;
  letter-spacing: -0.01em;
}
.tc-sd {
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 8px 4px 8px;
  border: 1px solid;
}
.tc-sd:before {
  content: "●";
  font-size: 12px;
  margin-right: 4px;
  vertical-align: 2px;
}
.tc-sd.c {
  color: var(--g);
  border-color: color-mix(in srgb, var(--g) 40%, transparent);
  background: color-mix(in srgb, var(--g) 10%, transparent);
}
.tc-sd.v {
  color: var(--r);
  border-color: color-mix(in srgb, var(--r) 40%, transparent);
  background: color-mix(in srgb, var(--r) 10%, transparent);
}
.tc-h .rt {
  text-align: right;
  flex: none;
}
.tc-pl {
  font-size: 16px;
  font-weight: 700;
}
.tc-ab {
  font-size: 12px;
  font-weight: 700;
  color: var(--ac);
  letter-spacing: 0.04em;
}
.tc-g {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--bd);
}
.tc-g small {
  display: block;
  font-size: 12px;
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.tc-g b {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.tc-f {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.tc-f:not(:has(.tag)) .btn {
  margin-top: -4px;
}
.tc-f .btn {
  margin-left: auto;
  padding: 8px 16px;
}
/* ideia de trade (formulário) e trades de olho */
.idt {
  border: 1px solid var(--bd2);
  border-radius: 8px;
  padding: 16px 16px;
  margin: 8px 0 8px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ac) 6%, var(--card)),
    var(--card)
  );
}
.idt-b {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--g);
  border: 1px solid color-mix(in srgb, var(--g) 40%, transparent);
  background: color-mix(in srgb, var(--g) 9%, transparent);
  margin-bottom: 8px;
}
.idt-b:before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.idt-b.x {
  color: var(--ac);
  border-color: color-mix(in srgb, var(--ac) 40%, transparent);
  background: var(--ac2);
}
.idt .ln {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  gap: 8px;
}
.idt .ln span {
  color: var(--mut);
}
.idt .ln .v {
  font-size: 18px;
  font-weight: 700;
}
.idt .ln.s .v {
  font-size: 14px;
  font-weight: 500;
  color: var(--mut);
}
.idt .ln em {
  font-style: normal;
  font-size: 12px;
  color: var(--mut);
  margin: 0 8px 0 8px;
  font-family: var(--mono);
  font-weight: 500;
}
#prev:has(.idt) {
  border: 0 !important;
  padding: 0 !important;
  background: none !important;
  box-shadow: none !important;
}
.idt hr {
  border: 0;
  border-top: 1px solid var(--bd);
  margin: 8px 0;
}
.cvb {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}
.cvb .mono {
  font-size: 20px;
  font-weight: 700;
  flex: none;
}
.cvb i {
  flex: 1;
  height: 6px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
  display: block;
}
.cvb i b {
  display: block;
  height: 100%;
  border-radius: 6px;
  background: var(--grad);
}
.cvl {
  font-size: 12px;
  color: var(--mut);
  letter-spacing: 0.04em;
}
.olc .olg {
  display: flex !important;
  flex-direction: column;
  gap: 0 !important;
}
.olc .olg > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  background: none !important;
  border: 0 !important;
}
.olc .olg small {
  font-size: 14px;
  color: var(--mut);
}
.olc .olg b {
  font-size: 18px;
}
/* Meu dia: etapas numeradas */
#dfases.stepper {
  background: none !important;
  border: 0 !important;
  gap: 8px;
}
#dfases.stepper button {
  border: 1px solid var(--bd) !important;
  border-radius: 8px !important;
  background: var(--card) !important;
  padding: 8px 4px 8px !important;
  position: relative;
}
#dfases.stepper button.on {
  border-color: transparent !important;
  background:
    linear-gradient(var(--card), var(--card)) padding-box,
    var(--grad) border-box !important;
}
#dfases.stepper .n {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--bd2);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 12px var(--mono);
  color: var(--mut);
  margin-bottom: 4px;
}
#dfases.stepper button.on .n {
  color: #ffffff;
  border-color: transparent;
  background: var(--grad);
}
#dfases.stepper .pg {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 3px;
  border-radius: 3px;
  background: var(--card2);
  overflow: hidden;
}
#dfases.stepper .pg b {
  display: block;
  height: 100%;
  background: var(--grad);
}
.stp {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0 4px;
}
.stp .n {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--bd2);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 18px var(--mono);
  color: var(--mut);
  flex: none;
  background: var(--card);
}
.stp small {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ac) 70%, var(--mut));
}
.stp b {
  display: block;
  font-size: 22px;
  letter-spacing: -0.02em;
  margin-top: 4px;
}
.stp-c {
  font-style: italic;
  color: var(--mut);
  font-size: 14px;
  margin: 4px 0 12px 56px;
}
/* Ferramentas (antigo Mais) */
.fgr {
  margin: 8px 0 4px;
}
.fgr .it {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 12px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card);
  color: var(--tx);
  text-align: left;
  cursor: pointer;
  font: inherit;
  margin-bottom: 8px;
}
.fgr .it .ic {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--ac2);
  color: var(--ac);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.fgr .it .ic svg {
  width: 20px;
  height: 20px;
  margin: 0;
}
.fgr .it b {
  display: block;
  font-size: 15px;
}
.fgr .it small {
  display: block;
  color: var(--mut);
  font-size: 13px;
  margin-top: 1px;
}
.fgr .it .ch {
  margin-left: auto;
  color: var(--mut);
}
.cor-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: -1px;
}
`,
          "legacy-030": `.dlin {
  display: flex !important;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
}
.dlin label {
  flex: 1;
  margin: 0;
}
.dlin input {
  margin: 0;
}
.dlin .btn {
  flex: none;
}
.dhist {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px !important;
}
.dhist svg {
  width: 16px;
  height: 16px;
  margin: 0;
}
#dfases.fixo {
  position: sticky;
  z-index: 5;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--bg) 82%, transparent) !important;
  padding: 8px 0;
  margin-left: -4px;
  margin-right: -4px;
}
.dlim summary {
  cursor: pointer;
  list-style: none;
}
.dlim summary::-webkit-details-marker {
  display: none;
}
.dlim[open] summary {
  margin-bottom: 8px;
}
.emor {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 4px;
}
.emor button {
  border: 1px solid var(--bd);
  background: var(--card2);
  color: var(--tx);
  border-radius: 999px;
  padding: 8px 12px;
  font: 600 13px inherit;
  cursor: pointer;
}
.emor button:active {
  transform: scale(0.97);
  border-color: var(--ac);
}
`,
          "legacy-031": `.fstep {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 4px 0 12px;
  position: sticky;
  top: -2px;
  z-index: 3;
  background: var(--card);
  padding: 8px 0;
}
.fstep button {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 8px;
  align-items: center;
  text-align: left;
  border: 1px solid var(--bd);
  background: var(--card2);
  color: var(--tx);
  border-radius: 8px;
  padding: 8px 12px;
  font: 700 14px inherit;
  cursor: pointer;
}
.fstep button i {
  grid-row: 1/3;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--bd2);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 13px var(--mono);
  font-style: normal;
  color: var(--mut);
}
.fstep button small {
  font-size: 12px;
  font-weight: 500;
  color: var(--mut);
}
.fstep button.on {
  border-color: transparent;
  background:
    linear-gradient(var(--card2), var(--card2)) padding-box,
    var(--grad) border-box;
}
.fstep button.on i {
  background: var(--grad);
  color: #ffffff;
  border-color: transparent;
}
.qsug {
  margin: -4px 0 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--ac2);
  line-height: 1.6;
}
.qsug .btn {
  padding: 4px 12px;
  margin-left: 8px;
  vertical-align: 1px;
}
.qsug svg {
  vertical-align: -3px;
}
.qsug.acima {
  background: color-mix(in srgb, var(--r) 12%, transparent);
  color: var(--r);
}
`,
          "legacy-032": `.tc-bar {
  margin: 12px 0 0;
}
.tc-bar .tr {
  position: relative;
  height: 8px;
  border-radius: 6px;
  background: var(--card2);
}
.tc-bar .tr i {
  position: absolute;
  top: 0;
  bottom: 0;
  display: block;
}
.tc-bar .rk {
  left: 0;
  border-radius: 6px 0 0 6px;
  background: color-mix(in srgb, var(--r) 45%, transparent);
}
.tc-bar .gn {
  border-radius: 0 6px 6px 0;
  background: color-mix(in srgb, var(--g) 40%, transparent);
}
.tc-bar .en {
  width: 2px;
  margin-left: -1px;
  top: -3px !important;
  bottom: -3px !important;
  background: var(--tx);
  opacity: 0.6;
}
.tc-bar .px {
  width: 14px;
  height: 14px;
  margin-left: -8px;
  top: -3px !important;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 0 0 3px var(--ac),
    0 0 12px var(--glow);
}
.tc-bar .lb {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 600;
}
#fx .idt {
  margin-top: 12px;
}
`,
          "legacy-033": `.pscmp .kv {
  grid-template-columns: 1.45fr 1fr 1fr 1fr !important;
  gap: 8px !important;
  margin-top: 8px;
}
.pscmp .kv > * {
  padding: 8px 8px !important;
  min-width: 0;
}
.pscmp .kv > * span,
.pscmp .kv > * small,
.pscmp .kv .k {
  font-size: 12px !important;
  letter-spacing: 0.04em;
  line-height: 1.2;
  display: block;
}
.pscmp .kv > * b {
  font-size: 15px !important;
  letter-spacing: -0.03em;
  font-family: var(--mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.pscmp .kv > * > :last-child:not(b) {
  display: none;
}
.pscmp .psv {
  width: 100%;
  margin-top: 8px;
}
.seg.hub > button {
  padding-left: 8px !important;
  padding-right: 8px !important;
  font-size: 14px;
}
`,
          "legacy-034": `#oplegs .opl {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  margin: 8px 0;
  background: var(--card2);
}
#oplegs .opl1 {
  display: flex;
  gap: 8px;
  align-items: center;
}
#oplegs .opl1 select {
  flex: 1;
  margin: 0;
}
#oplegs .opl1 .x {
  flex: none;
}
#oplegs .opll {
  border: 1px solid;
  border-radius: 999px;
  padding: 8px 12px;
  font: 700 13px inherit;
  cursor: pointer;
  background: transparent;
}
#oplegs .opll.c {
  color: var(--g);
  border-color: color-mix(in srgb, var(--g) 45%, transparent);
}
#oplegs .opll.v {
  color: var(--r);
  border-color: color-mix(in srgb, var(--r) 45%, transparent);
}
#oplegs .opl2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}
#oplegs .opl2 label {
  margin: 0;
  font-size: 12px;
}
#oplegs .opl2 input {
  margin: 4px 0 0;
}
#oplegs .chips2 > button {
  flex: none;
  white-space: nowrap;
  border-radius: 999px;
}
#oplegs .ln2 {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 8px;
}
#oplegs .ln2 b {
  font-size: 18px;
}
.opp .opg {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 8px 0;
}
.opp .opg > div {
  background: var(--card2);
  border-radius: 8px;
  padding: 8px 8px;
  min-width: 0;
}
.opp .opg small {
  display: block;
  font-size: 12px;
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.opp .opg b {
  display: block;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.opp .opg i {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: var(--mut);
  line-height: 1.2;
}
.opp .opsim {
  border-top: 1px solid var(--bd);
  margin-top: 8px;
  padding-top: 8px;
}
.opp .opsim label {
  display: block;
  font-size: 13px;
  margin: 8px 0 0;
}
.opp .opsim input[type="range"] {
  width: 100%;
  accent-color: var(--ac);
  margin: 4px 0 0;
}
.opln {
  margin-top: 8px;
  color: var(--mut);
}
.opav {
  margin-top: 4px;
}
.opgt {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.opgt th {
  font-size: 12px;
  color: var(--mut);
  font-weight: 600;
  padding: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.opgt td {
  padding: 4px 8px;
  border-top: 1px solid var(--bd);
  text-align: center;
}
.opgt td.opgc {
  cursor: pointer;
}
.opgt td.opgc small {
  display: block;
  font-size: 12px;
  color: var(--mut);
}
.opgt td.itm {
  background: color-mix(in srgb, var(--ac) 9%, transparent);
}
.opgt .opgk {
  font-weight: 700;
  background: var(--card2);
}
.opgt td.velho {
  opacity: 0.45;
}
.opgt tr.atm .opgk {
  background: var(--ac2);
  color: var(--ac);
}
`,
          "legacy-035": `.gxm {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.gxm th {
  font-size: 12px;
  color: var(--mut);
  text-align: left;
  padding: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.gxm td {
  padding: 8px 4px;
  border-top: 1px solid var(--bd);
  vertical-align: top;
  text-align: left;
}
.gxm tr.cur td {
  background: var(--ac2);
}
.gxsa {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  background: var(--ac);
  color: #ffffff;
  border-radius: 999px;
  padding: 4px 8px;
}
.gxb {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gxr {
  display: grid;
  grid-template-columns: 52px 1fr 1fr;
  align-items: center;
  gap: 4px;
}
.gxr.atm .gxk {
  color: var(--ac);
  font-weight: 700;
}
.gxk {
  font-size: 12px;
  text-align: right;
}
.gxp,
.gxc {
  height: 10px;
  background: var(--card2);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
}
.gxp {
  justify-content: flex-end;
}
.gxp i {
  background: var(--r);
  opacity: 0.8;
  height: 100%;
}
.gxc i {
  background: var(--g);
  opacity: 0.8;
  height: 100%;
}
`,
          "legacy-036": `.jeb {
  margin-top: 8px;
}
.jeb > b:first-child {
  font-size: 16px;
}
.jes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 13px;
}
.jes span {
  background: var(--card2);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
}
.jes i {
  font-style: normal;
  color: var(--ac);
  font-weight: 700;
}
.jet {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.jet th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mut);
  text-align: left;
  padding: 4px;
}
.jet td {
  padding: 8px 4px;
  border-top: 1px solid var(--bd);
  vertical-align: top;
  text-align: left;
}
.jel {
  margin: 4px 0 0 16px;
  padding: 0;
}
.jel li {
  margin: 4px 0;
}
`,
          "legacy-037": `.cnbar {
  display: block;
  height: 6px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
  margin-top: 8px;
}
.cnbar b {
  display: block;
  height: 100%;
  background: var(--grad);
  border-radius: 6px;
}
.cnp {
  font-size: 16px;
  line-height: 1.5;
  margin: 8px 0 8px;
  font-weight: 600;
}
.cno {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  border: 1px solid var(--bd);
  background: var(--card2);
  color: var(--tx);
  border-radius: 8px;
  padding: 12px 12px;
  margin: 8px 0;
  font: inherit;
  font-size: 15px;
  line-height: 1.4;
  cursor: pointer;
}
.cno b {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--bd2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.cno.sel {
  border-color: var(--ac);
  background: var(--ac2);
}
.cno.sel b {
  background: var(--ac);
  color: #ffffff;
  border-color: transparent;
}
.cno.ok {
  border-color: var(--g);
  background: color-mix(in srgb, var(--g) 12%, transparent);
}
.cno.ok b {
  background: var(--g);
  color: #ffffff;
  border-color: transparent;
}
.cno.no {
  border-color: var(--r);
  background: color-mix(in srgb, var(--r) 12%, transparent);
}
.cno.no b {
  background: var(--r);
  color: #ffffff;
  border-color: transparent;
}
.cnex {
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  background: var(--card2);
  color: var(--tx);
  border-left: 1px solid var(--bd2);
}
.cnex.g {
  border-left-color: var(--g);
}
.cnex.r {
  border-left-color: var(--r);
}
.cnex.g > b {
  color: var(--g);
}
.cnex.r > b {
  color: var(--r);
}
.cnnav {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.cnnav .btn {
  flex: 1;
}
.cngr {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  margin-top: 8px;
}
.cngr button {
  border: 1px solid var(--bd);
  background: var(--card2);
  color: var(--mut);
  border-radius: 6px;
  padding: 4px 0;
  font: 600 12px var(--mono);
  cursor: pointer;
}
.cngr button.r {
  background: var(--ac2);
  color: var(--tx);
}
.cngr button.m {
  border-color: var(--am);
}
.cngr button.cur {
  border-color: var(--ac);
  color: var(--ac);
}
.cnt {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
}
.cnt:first-child {
  border-top: 0;
}
.cntms {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px !important;
}
.cntm {
  display: grid;
  grid-template-columns: 1fr 70px 70px;
  align-items: center;
  gap: 8px;
  border: 0;
  background: none;
  color: var(--tx);
  text-align: left;
  padding: 8px 0;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--bd);
}
.cntm:last-child {
  border-bottom: 0;
}
.cntm .cnbar {
  margin: 0;
}
.cntm small {
  color: var(--mut);
  text-align: right;
  font-size: 12px;
}
.cngb summary {
  cursor: pointer;
  font-size: 14px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
`,
          "legacy-038": `.rrdc {
  margin-top: 8px;
}
.rrdg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 8px 0;
}
.rrdg > div {
  background: var(--card2);
  border-radius: 8px;
  padding: 8px;
}
.rrdg small {
  display: block;
  font-size: 12px;
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rrdg b {
  display: block;
  font-size: 16px;
}
.rrdg i {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: var(--mut);
}
`,
          "legacy-039": `.opal {
  margin-top: 8px;
}
.opal .btn.on {
  border-color: var(--am);
  color: var(--am);
}
`,
          "legacy-040": `.tc-cam {
  background: var(--card2);
  border: 1px solid var(--bd);
  color: var(--mut);
  border-radius: 999px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex: none;
  margin-right: auto;
}
.tc-cam:active {
  transform: scale(0.94);
}
.tc-f {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
`,
          "legacy-041": `@keyframes rtrIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
`,
          "legacy-042": `.dshk {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0 4px;
}
@media (min-width: 620px) {
  .dshk {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.dshkt {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.dshkt b {
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dshkt .sm {
  line-height: 1.25;
}
.dshd {
  font-size: 12px;
  margin-left: 4px;
  vertical-align: 2px;
}
.dshsv {
  width: 100%;
  height: auto;
  display: block;
}
.dshx {
  display: flex;
  gap: 8px;
}
.dshseg {
  margin: 0 0 8px;
}
.dshg {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0 16px;
}
.dsi {
  min-width: 0;
}
@media (min-width: 980px) {
  body.dshwide #app {
    max-width: 1280px;
  }
  .dshg {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dshg .w2 {
    grid-column: 1/-1;
  }
  .dshk {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
  .dshf {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 8px;
    align-items: end;
  }
  .dshf .seg {
    margin: 0;
  }
}
.dshhm {
  overflow-x: auto;
}
.dshhm table {
  border-collapse: separate;
  border-spacing: 3px;
  width: 100%;
  font-size: 12px;
}
.dshhm td {
  text-align: center;
  border-radius: 6px;
  padding: 4px 4px;
  min-width: 38px;
  line-height: 1.15;
}
.dshhm td b {
  display: block;
  font-size: 12px;
}
.dshhm td small {
  opacity: 0.8;
  font-size: 12px;
}
.dshhm th {
  font-weight: 600;
  color: var(--mut);
  font-size: 12px;
  padding: 4px;
  text-align: center;
}
.dshhe {
  background: var(--bd);
  opacity: 0.35;
}
.dsht {
  font-weight: 700;
}
.dshbar {
  height: 8px;
  border-radius: 6px;
  background: var(--bd);
  overflow: hidden;
  margin: 4px 0;
}
.dshbar i {
  display: block;
  height: 100%;
  border-radius: 6px;
}
.dshrr {
  padding: 8px 8px;
  margin: 0 -8px;
  border-radius: 8px;
  cursor: pointer;
}
.dshrr + .dshrr {
  border-top: 1px solid var(--bd);
}
.dshrr.on {
  background: color-mix(in srgb, var(--ac) 12%, transparent);
}
.dshtb {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
  margin: 4px 0;
}
.dshtb td,
.dshtb th {
  padding: 8px 4px;
  text-align: right;
  border-bottom: 1px solid var(--bd);
  white-space: nowrap;
}
.dshtb td:first-child,
.dshtb th:first-child {
  text-align: left;
  white-space: normal;
}
.dshtb th {
  color: var(--mut);
  font-weight: 600;
}
.dshdot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: 0;
}
.dshan {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  align-items: center;
}
.dshan svg {
  width: 150px;
  height: 150px;
}
.mmbar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 4px 0 8px;
  padding-bottom: 4px;
}
.mmbar button {
  flex: none;
  border: 1px solid var(--bd);
  background: var(--card);
  color: var(--tx);
  border-radius: 999px;
  padding: 8px 12px;
  font: 600 13px var(--fs, inherit);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.mmbar button.on {
  border-color: var(--ac);
  background: color-mix(in srgb, var(--ac) 14%, var(--card));
}
.mmdot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.mmg {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px;
}
.mml {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
}
.mml .big2 {
  font-size: 18px;
  font-weight: 750;
}
`,
          "legacy-043": `@media (min-width: 980px) {
  body.dshwide #app {
    max-width: 1180px;
  }
  body.dshwide .kv {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.pch .sm b {
  font-weight: 700;
}
`,
          "legacy-044": `#pgov {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: #080809;
  color: #eeedea;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px
    calc(20px + env(safe-area-inset-bottom, 0px));
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
#pgov .pg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #9fa3ac;
}
#pgov .pg-top b {
  color: #eeedea;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 13px;
}
#pgov .x {
  color: #eeedea;
}
#pgov .pg-st {
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  font-weight: 800;
  font-size: 28px;
  letter-spacing: 0.04em;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
#pgov .pg-st small {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  opacity: 0.85;
}
#pgov .pg-st b {
  font-size: 48px;
}
#pgov .pg-st.g {
  background: rgba(55,166,111,0.14);
  color: #46c184;
}
#pgov .pg-st.r {
  background: rgba(232,104,84,0.16);
  color: #ed8b7c;
}
#pgov .pg-st.am {
  background: rgba(187,142,59,0.14);
  color: #c9a156;
}
#pgov .pg-g {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
#pgov .pg-g div,
#pgov .pg-ms div {
  background: #151619;
  border: 1px solid #222427;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
#pgov .pg-g span,
#pgov .pg-ms span {
  font-size: 12px;
  color: #9fa3ac;
}
#pgov .pg-g b {
  font-size: 18px;
  white-space: nowrap;
}
#pgov .pg-ms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}
#pgov .pg-ms b {
  font-size: 18px;
}
#pgov .pg-b {
  display: grid;
  gap: 8px;
  margin-top: auto;
}
#pgov .g {
  color: #46c184;
}
#pgov .r {
  color: #ed8b7c;
}
.pg-resp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px;
}
.pg-bola {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, #86abcb, #588bb8);
  animation: pgB 16s ease-in-out infinite;
}
@keyframes pgB {
  0% {
    transform: scale(0.6);
  }
  25% {
    transform: scale(1);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(0.6);
  }
  100% {
    transform: scale(0.6);
  }
}
`,
          "legacy-045": `.seg:has(> [data-st]) {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.seg:has(> [data-st])::-webkit-scrollbar {
  display: none;
}
.seg > [data-st] {
  flex: 0 0 auto !important;
  white-space: nowrap;
}
`,
          "legacy-046": `#dwov {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: #080809;
  color: #eeedea;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px
    calc(16px + env(safe-area-inset-bottom, 0px));
}
#dwov .dw-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
#dwov .x {
  color: #ffffff;
}
#dwov .chips2 button.on {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}
.dw-cv {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.dw-cv canvas {
  max-width: 100%;
  max-height: 100%;
  touch-action: none;
  border-radius: 6px;
}
`,
          "legacy-047": `#pcv {
  position: fixed;
  inset: 0;
  z-index: 100001;
  background: var(--bg, #f7f7f6);
  overflow: auto;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 40px;
}
#pcv .pcv-in {
  max-width: 620px;
  margin: 0 auto;
}
#pcv .wk {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
`,
          "legacy-048": `.opdr {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0 4px;
  padding: 8px 8px;
  border-radius: 8px;
  background: var(--card2, rgba(127,127,127,0.08));
}
`,
          "legacy-049": `#oaov {
  position: fixed;
  inset: 0;
  z-index: 8000;
  background: var(--bg);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
#oaov .oa-in {
  max-width: 640px;
  margin: 0 auto;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 40px;
}
.oa-lv {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.oa-lv > div {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.oa-lv span {
  font-size: 12px;
  color: var(--mut);
}
.oa-lv b {
  font-size: 22px;
  font-family: var(--fm, ui-monospace, monospace);
}
.oa-lv i {
  font-style: normal;
  font-size: 12px;
  color: var(--mut);
  min-height: 14px;
}
.opgc .opba {
  display: block;
  font-size: 12px;
  margin-top: 1px;
  white-space: nowrap;
}
`,
          "legacy-050": `.modv {
  background: none;
  border: 0;
  color: var(--ac);
  font: 600 14px var(--fs, inherit);
  padding: 4px 0 8px;
  cursor: pointer;
}
.modg {
  display: grid;
  gap: 8px;
}
@media (min-width: 700px) {
  .modg {
    grid-template-columns: 1fr 1fr;
  }
}
.modc {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
  color: var(--tx);
  cursor: pointer;
  font: inherit;
}
.modc .ic {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--ac2, rgba(134,171,203,0.15));
  color: var(--ac);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.modc .ic svg {
  width: 22px;
  height: 22px;
  margin: 0;
}
.modc .tx {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modc .tx b {
  font-size: 18px;
}
.modc .tx small {
  color: var(--mut);
  font-size: 13px;
}
.modc .hj {
  text-align: right;
  font-weight: 750;
  font-size: 15px;
  display: flex;
  flex-direction: column;
}
.modc .hj i {
  font-style: normal;
  font-size: 12px;
  color: var(--mut);
  font-weight: 500;
}
.modmenu {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 8px 8px 64px;
}
.modmenu button {
  background: var(--card2);
  border: 1px solid var(--bd);
  color: var(--tx);
  border-radius: 999px;
  padding: 8px 12px;
  font: 600 13px var(--fs, inherit);
  cursor: pointer;
}
`,
          "legacy-051": `.bsw {
  padding: 0 8px 8px;
}
.bsw input {
  margin: 0;
}
#bsr {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.bsi {
  text-align: left;
  background: var(--card2);
  border: 1px solid var(--bd);
  color: var(--tx);
  border-radius: 8px;
  padding: 8px 12px;
  font: 600 14px var(--fs, inherit);
  cursor: pointer;
}
.modhjg {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 8px;
}
.modhj {
  background: var(--card2, rgba(127,127,127,0.08));
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--tx);
  cursor: pointer;
  font: inherit;
}
.modhj small {
  color: var(--mut);
  font-size: 12px;
}
.modhj b {
  font-size: 15px;
}
.modhj i {
  font-style: normal;
  font-size: 12px;
  color: var(--mut);
}
`,
          "legacy-052": `#filap {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(var(--nav, 64px) + 18px + env(safe-area-inset-bottom, 0px));
  z-index: 60;
  background: var(--card);
  color: var(--tx);
  border: 1px solid var(--am, var(--ds-line-2));
  border-radius: 999px;
  padding: 8px 16px;
  font: 600 13px var(--fs, inherit);
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  white-space: nowrap;
  cursor: pointer;
}
#fabm .fabsug {
  outline: 2px solid var(--ac);
  outline-offset: 2px;
  border-radius: 8px;
}
details.avg {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  margin: 8px 0;
}
details.avg summary {
  cursor: pointer;
  padding: 4px 0;
}
`,
          "legacy-053": `.pdfrow {
  display: flex !important;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 8px !important;
}
.pdfrow .btn {
  flex: 1 1 140px;
  white-space: nowrap;
}
.top > h1 {
  flex: 1 1 auto;
  min-width: 0;
}
.hlpf {
  float: right;
  margin-top: 8px;
}
.hlp {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--bd2, var(--bd));
  background: transparent;
  color: var(--mut);
  font: 700 13px var(--fs, inherit);
  vertical-align: middle;
  margin-left: 8px;
  cursor: pointer;
  padding: 0;
}
#hlpov,
#vgov {
  position: fixed;
  inset: 0;
  z-index: 100001;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}
.hlpbox {
  background: var(--card);
  color: var(--tx);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
  max-width: 460px;
  width: 100%;
  margin-bottom: env(safe-area-inset-bottom, 0px);
}
details.nfer {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 8px 0;
  background: var(--card);
}
details.nfer summary {
  cursor: pointer;
}
.fabmesa {
  padding: 8px 8px;
  margin-bottom: 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  line-height: 1.5;
}
#metamod {
  margin-top: 0;
}
`,
          "legacy-054": `html.edge:root[data-theme="dark"],
html.edge:root:not([data-theme]) {
  --bg: #060607;
  --card: #0d0d0e;
  --card2: #121315;
  --bd: rgba(196,156,80,0.1);
  --bd2: rgba(196,156,80,0.24);
  --tx: #efeeeb;
  --mut: #7f8490;
  --ac: #c09442;
  --ac2: rgba(192,148,66,0.14);
  --g: #42c081;
  --r: #ea7462;
  --am: #d1af6f;
  --grad: linear-gradient(90deg, #ac8439, #c09442 50%, #d2b276);
  --glow: rgba(192,148,66,0.32);
}
@media (prefers-color-scheme: light) {
  html.edge:root:not([data-theme]) {
    --bg: #efeeeb;
    --card: #ffffff;
    --card2: #efeeeb;
    --bd: rgba(28,29,32,0.1);
    --bd2: rgba(28,29,32,0.2);
    --tx: #0e0f10;
    --mut: #56685f;
    --ac: #ac8439;
    --ac2: rgba(172,132,57,0.1);
    --g: #2e8a5c;
    --r: #d6503b;
    --am: #a37c33;
    --grad: linear-gradient(90deg, #35383d, #ac8439 50%, #ac8439);
    --glow: rgba(172,132,57,0.22);
  }
}
html.edge:root[data-theme="light"] {
  --bg: #efeeeb;
  --card: #ffffff;
  --card2: #efeeeb;
  --bd: rgba(28,29,32,0.1);
  --bd2: rgba(28,29,32,0.2);
  --tx: #0e0f10;
  --mut: #56685f;
  --ac: #ac8439;
  --ac2: rgba(172,132,57,0.1);
  --g: #2e8a5c;
  --r: #d6503b;
  --am: #a37c33;
  --grad: linear-gradient(90deg, #35383d, #ac8439 50%, #ac8439);
  --glow: rgba(172,132,57,0.22);
}
html.edge body {
  background:
    radial-gradient(
        80% 45% at 50% -8%,
        color-mix(in srgb, var(--ac) 12%, transparent),
        transparent 70%
      )
      fixed,
    radial-gradient(
        60% 40% at 100% 100%,
        color-mix(in srgb, #ac8439 8%, transparent),
        transparent 70%
      )
      fixed,
    var(--bg);
}
html.edge #splash {
  background: radial-gradient(
    120% 70% at 50% 40%,
    #16171a 0%,
    #060607 70%
  ) !important;
}
html.edge .card {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ac) 4%, var(--card)),
    var(--card)
  );
  border-color: var(--bd);
  box-shadow:
    0 1px 0 color-mix(in srgb, #ffffff 4%, transparent) inset,
    0 10px 30px -22px var(--glow);
}
html.edge .btn:not(.s) {
  background: linear-gradient(135deg, #ac8439, #ac8439);
  color: #09090a;
  border-color: transparent;
  box-shadow:
    0 8px 20px -10px var(--glow),
    0 1px 0 rgba(255,255,255,0.25) inset;
}
html.edge .btn.d:not(.s) {
  background: linear-gradient(135deg, #ed8c7d, #e05c48);
  color: #ffffff;
}
html.edge #bnav .mais span.bx {
  background: linear-gradient(150deg, #c9c5bc, #86abcb 55%, #709bc2) !important;
  box-shadow: 0 10px 26px -8px rgba(134,171,203,0.55) !important;
}
html.edge #bnav button.on {
  color: var(--ac) !important;
}
html.edge #bnav button.on svg {
  filter: drop-shadow(0 0 6px var(--glow));
}
html.edge #bnav button.on:not(.mais)::after {
  content: "";
  position: absolute;
  bottom: calc(4px + env(safe-area-inset-bottom, 0px));
  left: 30%;
  right: 30%;
  height: 2px;
  border-radius: 2px;
  background: var(--ac);
  box-shadow: 0 0 8px var(--ac);
}
html.edge #bnav button {
  position: relative;
}
html.edge #tape {
  border-bottom-color: color-mix(
    in srgb,
    var(--ac) 35%,
    transparent
  ) !important;
  box-shadow: 0 1px 16px var(--glow) !important;
}
html.edge #mbtn svg {
  color: var(--ac);
}
html.edge .seg > button.on {
  color: var(--ac) !important;
  border-color: color-mix(in srgb, var(--ac) 55%, transparent) !important;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ac) 35%, transparent),
    0 6px 16px -8px var(--glow) !important;
}
html.edge h2 {
  color: color-mix(in srgb, var(--ac) 70%, var(--mut));
  letter-spacing: 0.16em;
  font-size: 12px;
}
html.edge .chip {
  border-color: var(--bd2);
}
/* resumo do dia */
.hero.hero2 {
  position: relative;
  overflow: hidden;
  padding: 16px 16px 16px;
}
.hero2 .h2art {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 62%;
  background: url(touro-hero.jpg) right 30% / cover no-repeat;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000000 55%);
  mask-image: linear-gradient(90deg, transparent 0%, #000000 55%);
  opacity: 0.9;
  pointer-events: none;
}
html[data-theme="light"] .hero2 .h2art {
  opacity: 0.35;
}
@media (prefers-color-scheme: light) {
  html:not([data-theme]) .hero2 .h2art {
    opacity: 0.35;
  }
}
.hero2 .h2c {
  position: relative;
  max-width: 62%;
}
.hero2 .h2lb {
  font: 800 13px var(--fs, inherit);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hero2 .big {
  text-shadow: 0 0 22px color-mix(in srgb, currentColor 35%, transparent);
}
.h2pct {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  font: 700 12px var(--fs, inherit);
  background: color-mix(in srgb, currentColor 14%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
}
.h2ks {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}
.h2k {
  background: color-mix(in srgb, var(--card2) 85%, transparent);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.h2k b {
  font-size: 18px;
  line-height: 1.15;
}
.h2k small {
  color: var(--mut);
  font-size: 12px;
}
.h2ki {
  color: var(--ac);
  font-size: 13px;
  line-height: 1;
}
.hero2 svg {
  position: relative;
}
/* linhas de trade */
.trl {
  padding: 4px 12px;
}
.trow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  cursor: pointer;
}
.trow:first-child {
  border-top: 0;
}
.tic16 {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tic16 svg {
  width: 19px;
  height: 19px;
}
.tic16.g {
  color: var(--g);
  background: color-mix(in srgb, var(--g) 15%, transparent);
  box-shadow: 0 0 14px -4px var(--g);
}
.tic16.r {
  color: var(--r);
  background: color-mix(in srgb, var(--r) 15%, transparent);
  box-shadow: 0 0 14px -4px var(--r);
}
.tic16.n {
  color: var(--mut);
  background: var(--card2);
}
.trow .tnm16 {
  flex: 1;
  min-width: 0;
}
.trow .tnm16 b {
  display: block;
  font-size: 15px;
}
.trow .tnm16 small,
.trow .tvl16 small {
  color: var(--mut);
  font-size: 12px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trow .tvl16 {
  text-align: right;
  white-space: nowrap;
}
.trow .tvl16 b {
  font-size: 15px;
}
.bdg {
  flex: none;
  font: 800 12px var(--fs, inherit);
  letter-spacing: 0.04em;
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 42px;
  text-align: center;
}
.bdg.w {
  color: #09090a;
  background: var(--g);
}
.bdg.l {
  color: #ffffff;
  background: var(--r);
}
.bdg.be {
  color: var(--tx);
  background: var(--card2);
  border: 1px solid var(--bd2);
}
.bdg.op {
  color: var(--am);
  border: 1px solid var(--am);
}
.tcard .tic16 {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}
.tcard .tc-h {
  display: flex;
  align-items: center;
}
.tcard .tc-h .fl {
  flex: 1;
  min-width: 0;
}
.tcard .rt .bdg {
  display: inline-block;
  margin-top: 4px;
}
body.lc .tcard {
  padding: 8px 12px !important;
}
body.lc .tcard:not(.tc-op) .tc-g,
body.lc .tcard .tc-f > .tc-cam,
body.lc .tcard .tc-f > .tag {
  display: none !important;
}
body.lc .tcard .tc-f:not(:has(button:not(.tc-cam))) {
  display: none !important;
}
.lcsw {
  margin: 0 0 8px;
  max-width: 280px;
}
.seclb {
  font: 700 12px var(--fs, inherit);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ac) 70%, var(--mut));
}
.brand116 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 12px;
}
.brand116 svg {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex: none;
  box-shadow: 0 0 18px -6px var(--glow);
}
.brand116 b {
  display: block;
  font-size: 20px;
  line-height: 1.1;
}
.brand116 small {
  color: var(--mut);
  font-size: 13px;
}
/* computador */
body.pc #mdr2 {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: auto;
  width: 280px;
  z-index: 41;
}
body.pc #mdr2 .bk {
  display: none;
}
body.pc #mdr2 .pn {
  width: 280px;
  animation: none;
  background: color-mix(in srgb, var(--card) 70%, var(--bg));
}
body.pc #mdr2 [data-m2="x"] {
  display: none;
}
body.pc #mbtn {
  display: none !important;
}
body.pc #tape {
  left: 280px !important;
}
body.pc {
  overflow: auto !important;
}
body.pc #app {
  max-width: none !important;
  margin: 0 0 0 280px !important;
  padding-left: max(32px, calc((100vw - 280px - 1180px) / 2)) !important;
  padding-right: max(32px, calc((100vw - 280px - 1180px) / 2)) !important;
  padding-bottom: 60px !important;
}
body.pc #bnav {
  left: auto !important;
  right: 28px !important;
  bottom: 24px !important;
  width: auto !important;
  height: auto !important;
  background: none !important;
  border: 0 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  padding: 0 !important;
}
body.pc #bnav button:not(.mais) {
  display: none !important;
}
body.pc #fabm {
  left: auto !important;
  right: 28px !important;
  transform: none !important;
  bottom: 104px !important;
  width: 320px;
  align-items: stretch !important;
}
body.pc #fabm > button,
body.pc #fabm > div > button {
  width: 100%;
  justify-content: flex-start;
}
body.pc .hero2 .big {
  font-size: 52px;
}
body.pc #privb {
  bottom: 100px !important;
  right: 34px !important;
}
#distc .dlg {
  max-width: 280px;
}
body.pc .kv {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
body.pc .modg {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
body.pc .sheet,
body.pc #sh .pn {
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}
`,
          "legacy-055": `.lklogo svg {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  box-shadow: 0 0 28px -6px var(--glow);
}
.lklogo {
  font-size: 48px;
}
`,
          "legacy-056": `body.pc #app[data-tela="home"] {
  display: block !important;
}
.pccols {
  display: grid;
  gap: 0 20px;
  align-items: start;
}
.pcc {
  min-width: 0;
}
.pcc > section > .card:first-child,
.pcc > section > .top:first-child {
  margin-top: 0;
}
`,
          "legacy-057": `.tcard.tc-win:before {
  background: var(--g);
}
.hmsw {
  margin: 0 0 12px;
}
.hmsw button small {
  font-size: 12px;
  color: var(--ac);
  margin-left: 4px;
}
.skel119 {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}
.skel119 i {
  display: block;
  height: 11px;
  width: 100%;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--card2) 0%,
    color-mix(in srgb, var(--ac) 14%, var(--card2)) 50%,
    var(--card2) 100%
  );
  background-size: 200% 100%;
  animation: sk119 1.3s ease-in-out infinite;
}
@keyframes sk119 {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
.vazio119 {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
}
.vazio119:before {
  content: "";
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background:
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--ac) 30%, transparent) 0 22%,
      transparent 24%
    ),
    color-mix(in srgb, var(--ac) 10%, transparent);
  border: 1px dashed color-mix(in srgb, var(--ac) 40%, transparent);
}
#app h1 {
  letter-spacing: -0.02em;
}
.card > .top > b:first-child {
  font-size: 15px;
}
.tcard .tc-t b {
  font-family: inherit;
}
.tbbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin: 0 0 8px;
}
.tbbar input {
  flex: 1 1 220px;
}
.tbbar select {
  flex: 0 0 140px;
}
.tbbulk {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 8px;
  margin-bottom: 8px;
  border: 1px solid var(--ac);
  border-radius: 8px;
  background: var(--ac2);
}
.tbbulk input {
  flex: 0 1 180px;
}
.tbbulk select {
  flex: 0 1 220px;
}
.tbsc {
  overflow: auto;
  border: 1px solid var(--bd);
  border-radius: 8px;
  max-height: 75vh;
}
.tbt {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.tbt th {
  position: sticky;
  top: 0;
  background: var(--card2);
  z-index: 1;
  text-align: left;
  padding: 8px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tbt th.on {
  color: var(--ac);
}
.tbt td {
  padding: 8px 8px;
  border-top: 1px solid var(--bd);
  vertical-align: middle;
}
.tbt td.n {
  font-family: var(--mono);
  text-align: right;
  white-space: nowrap;
}
.tbt td.nw {
  white-space: nowrap;
}
.tbt tr.sel td {
  background: var(--ac2);
}
.tbt tr:hover td {
  background: color-mix(in srgb, var(--ac) 5%, transparent);
}
.tbin {
  padding: 4px 8px !important;
  font-size: 13px !important;
  min-width: 110px;
  background: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 6px;
}
.tbin:hover,
.tbin:focus {
  border-color: var(--bd2) !important;
  background: var(--card) !important;
}
kbd {
  display: inline-block;
  padding: 1px 8px;
  border: 1px solid var(--bd2);
  border-bottom-width: 1px;
  border-radius: 6px;
  font: 600 12px var(--mono);
  background: var(--card2);
}
.atl {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  color: var(--mut);
  font: 13px var(--fs, inherit);
  padding: 8px 8px;
  cursor: pointer;
}
.brand116 .ckbtn {
  margin-left: auto;
  display: none;
}
body.pc .brand116 .ckbtn {
  display: inline-flex;
}
#ckp {
  position: fixed;
  inset: 0;
  z-index: 100002;
  background:
    radial-gradient(
      70% 50% at 50% -10%,
      color-mix(in srgb, var(--ac) 12%, transparent),
      transparent 70%
    ),
    var(--bg);
  overflow: auto;
  padding: 24px 28px;
}
.ckhd {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.ckhd > div:first-child {
  flex: 1;
}
.ckhd b {
  font-size: 22px;
  display: block;
}
.ckhd small {
  color: var(--mut);
}
.ckclk {
  font: 700 32px var(--mono);
  letter-spacing: 0.02em;
}
.ckalert {
  padding: 12px 16px;
  border: 1px solid var(--r);
  border-radius: 8px;
  background: color-mix(in srgb, var(--r) 14%, transparent);
  margin-bottom: 16px;
  font-size: 16px;
}
.ckg {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.ckb {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
  min-width: 0;
}
.ckb > small {
  display: block;
  color: var(--mut);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.ckb.w2 {
  grid-column: span 2;
}
.ckbig {
  font: 800 64px var(--mono);
  line-height: 1.05;
  text-shadow: 0 0 30px color-mix(in srgb, currentColor 30%, transparent);
}
.ckmid {
  font: 800 40px var(--mono);
  line-height: 1.1;
}
.ckbar {
  height: 8px;
  border-radius: 6px;
  background: var(--card2);
  margin-top: 8px;
  overflow: hidden;
}
.ckbar i {
  display: block;
  height: 100%;
  border-radius: 6px;
}
.ckpos {
  padding: 4px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
}
.ckpos:first-of-type {
  border-top: 0;
}
@media (max-width: 900px) {
  .ckg {
    grid-template-columns: 1fr 1fr;
  }
  .ckbig {
    font-size: 48px;
  }
  .ckmid {
    font-size: 28px;
  }
  #ckp {
    padding: 16px;
  }
}
@media (max-width: 520px) {
  .ckg {
    grid-template-columns: 1fr;
  }
  .ckb.w2 {
    grid-column: auto;
  }
}
`,
          "legacy-058": `.cqtabs {
  overflow-x: auto;
  flex-wrap: nowrap;
  scrollbar-width: none;
  margin: 4px 0 8px;
}
.cqtabs::-webkit-scrollbar {
  display: none;
}
.cqtabs button {
  flex: 0 0 auto;
  white-space: nowrap;
}
.cqbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}
.cqbar > .sm {
  flex: 1;
}
.cqord {
  margin: 0;
  flex: 0 0 auto;
}
.cqord button {
  padding: 4px 8px !important;
  font-size: 13px !important;
}
.cql {
  padding: 4px 12px;
}
.cqr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.cqr:first-child {
  border-top: 0;
}
.cqi {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: 800 12px var(--fs, inherit);
  letter-spacing: -0.02em;
  overflow: hidden;
}
.cqn {
  flex: 1;
  min-width: 0;
}
.cqn b {
  display: block;
  font-size: 15px;
}
.cqn small {
  display: block;
  color: var(--mut);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cqp {
  text-align: right;
  white-space: nowrap;
}
.cqp b {
  display: block;
  font: 700 15px var(--mono);
}
.cqp b small {
  font: 600 12px var(--fs, inherit);
  color: var(--mut);
}
.cqp > small {
  display: block;
  font: 600 12px var(--mono);
}
.cqv {
  flex: none;
  min-width: 70px;
  text-align: right;
  font: 700 13px var(--mono);
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--card2);
}
.cqv.up {
  color: var(--g);
  background: color-mix(in srgb, var(--g) 13%, transparent);
}
.cqv.dn {
  color: var(--r);
  background: color-mix(in srgb, var(--r) 13%, transparent);
}
.cqdi {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.cqdi > div {
  background: var(--card2);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
}
.cqdi small {
  display: block;
  color: var(--mut);
  font-size: 12px;
}
.cqdi b {
  font: 700 14px var(--mono);
}
body.pc .cql {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 28px;
}
body.pc .cqr:nth-child(2) {
  border-top: 0;
}
.agr {
  border: 1px solid var(--bd2);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0 8px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ac) 8%, var(--card)),
    var(--card)
  );
}
.agr-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.agr-top > div:first-child {
  flex: 1;
  min-width: 0;
}
.agr-top small {
  display: block;
  color: var(--mut);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.agr-top b {
  display: block;
  font-size: 15px;
}
.agr-cd {
  font: 800 20px var(--mono);
  color: var(--am);
  white-space: nowrap;
}
.agr-ln {
  position: relative;
  height: 26px;
  margin-top: 4px;
  border-radius: 6px;
  background: var(--card2);
}
.agr-ln i {
  position: absolute;
  top: 0;
  bottom: 0;
}
.agr-ln .hh {
  width: 1px;
  background: var(--bd2);
}
.agr-ln .hh span {
  position: absolute;
  top: 27px;
  left: -8px;
  font: 12px var(--fs, inherit);
  color: var(--mut);
}
.agr-ln .ev {
  top: 7px;
  bottom: auto;
  width: 12px;
  height: 12px;
  margin-left: -8px;
  border-radius: 50%;
}
.agr-ln .ev.a {
  background: var(--r);
  box-shadow: 0 0 10px var(--r);
}
.agr-ln .ev.m {
  background: var(--am);
}
.agr-ln .now {
  width: 2px;
  margin-left: -1px;
  background: var(--ac);
  box-shadow: 0 0 8px var(--ac);
}
.agr {
  padding-bottom: 20px;
}
.agp {
  font: 800 12px var(--fs, inherit);
  letter-spacing: 0.06em;
  padding: 4px 8px;
  border-radius: 6px;
  vertical-align: 1px;
}
.agp.a {
  background: color-mix(in srgb, var(--r) 18%, transparent);
  color: var(--r);
}
.agp.m {
  background: color-mix(in srgb, var(--am) 18%, transparent);
  color: var(--am);
}
.agp.b {
  background: var(--card2);
  color: var(--mut);
}
.agm {
  font: 700 12px var(--fs, inherit);
  padding: 1px 8px;
  border-radius: 6px;
  border: 1px solid var(--ac);
  color: var(--ac);
}
.ags {
  font: 700 12px var(--fs, inherit);
  padding: 1px 8px;
  border-radius: 6px;
}
.ags.up {
  color: #64cc98;
  background: rgba(100,204,152,0.12);
}
.ags.dn {
  color: #bbb6ab;
  background: rgba(187,182,171,0.12);
}
`,
          "legacy-059": `.cqbar {
  flex-wrap: wrap;
}
.cqbar > .sm {
  flex: 1 1 100%;
  order: -1;
}
.cqac {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 4px;
}
.cqb {
  background: none;
  border: 0;
  padding: 0 4px;
  font-size: 14px;
  line-height: 1.2;
  cursor: pointer;
  color: var(--mut);
  opacity: 0.55;
}
.cqb.on {
  opacity: 1;
  color: var(--am);
}
.cqmap {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 8px;
}
.cqt {
  border-radius: 8px;
  padding: 8px 8px;
  border: 1px solid var(--bd);
  min-height: 66px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  text-align: center;
}
.cqt b {
  font-size: 13px;
}
.cqt span {
  font: 800 15px var(--mono);
}
.cqt small {
  font: 12px var(--mono);
  color: color-mix(in srgb, var(--tx) 70%, transparent);
}
.cqals {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 0 8px;
  background: var(--card);
}
.cqals summary {
  cursor: pointer;
}
.cqal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
}
.cqal:first-of-type {
  border-top: 0;
}
`,
          "legacy-060": `.enhero {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #709bc2 14%, var(--card)),
    var(--card)
  );
}
.enhr {
  display: flex;
  align-items: center;
  gap: 16px;
}
.enst {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 14px;
  margin-bottom: 8px;
}
.enbar {
  display: block;
  height: 8px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
  margin: 4px 0;
}
.enbar > i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ad853a, #709bc2);
  border-radius: 6px;
  transition: width 0.4s;
}
.enbar.big {
  flex: 1;
  height: 12px;
  margin: 0;
}
.endia .enw,
.enw {
  font: 800 28px var(--fs, inherit);
  letter-spacing: -0.01em;
}
.enspk {
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
  vertical-align: middle;
}
.entrilha {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.entema {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--card);
  color: var(--tx);
  cursor: pointer;
}
.entema.atual {
  border-color: #709bc2;
  box-shadow: 0 0 0 1px #709bc2 inset;
}
.enic {
  font-size: 28px;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card2);
}
.entx {
  flex: 1;
  min-width: 0;
}
.entx b {
  display: block;
}
.entx small {
  color: var(--mut);
  font-size: 12px;
}
.ench {
  font-size: 18px;
  color: var(--mut);
}
.entop {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 12px;
}
.enl {
  padding: 16px;
}
.enq {
  font: 800 24px var(--fs, inherit);
  text-align: center;
  margin: 16px 0;
}
.enq.sm2 {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
}
.enops {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.enop {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  border-bottom-width: 1px;
  background: var(--card2);
  color: var(--tx);
  font: 600 16px var(--fs, inherit);
  text-align: left;
  cursor: pointer;
}
.enop.certo {
  border-color: var(--g);
  background: color-mix(in srgb, var(--g) 16%, var(--card2));
}
.enop.errado {
  border-color: var(--r);
  background: color-mix(in srgb, var(--r) 14%, var(--card2));
}
.enbig {
  display: block;
  margin: 16px auto 8px;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 0;
  font-size: 40px;
  cursor: pointer;
  background: linear-gradient(135deg, #709bc2, #ad853a);
  box-shadow: 0 10px 30px -10px #709bc2;
}
.enmont {
  min-height: 54px;
  padding: 8px;
  border-bottom: 1px solid var(--bd2);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.enbanco {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.entk {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  border-bottom-width: 1px;
  background: var(--card2);
  color: var(--tx);
  font: 600 15px var(--fs, inherit);
  cursor: pointer;
}
.entk:disabled {
  opacity: 0.3;
}
.entk.on {
  background: var(--card);
}
.enfb {
  position: sticky;
  bottom: calc(var(--nav, 64px) + 10px + env(safe-area-inset-bottom, 0px));
  padding: 16px;
  border-radius: 8px;
  margin-top: 8px;
  border: 1px solid;
}
.enfb.ok {
  background: color-mix(in srgb, var(--g) 16%, var(--card));
  border-color: var(--g);
}
.enfb.no {
  background: color-mix(in srgb, var(--r) 12%, var(--card));
  border-color: var(--r);
}
.enans {
  font: 800 18px var(--fs, inherit);
  margin-top: 4px;
}
.enfim {
  text-align: center;
  padding: 20px 16px;
}
.enini .enw {
  font-weight: 800;
}
`,
          "legacy-061": `.h2live {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  min-height: 0;
}
.h2live:empty {
  display: none;
}
.h2dot {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--g);
  box-shadow: 0 0 0 0 var(--g);
  animation: h2p 1.6s infinite;
}
@keyframes h2p {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--g) 60%, transparent);
  }
  70% {
    box-shadow: 0 0 0 9px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}
.entrw {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.entrw .entema {
  flex: 1;
}
.enouvt {
  flex: none;
  width: 48px;
  font-size: 18px;
  padding: 0 !important;
}
.enouv {
  border-color: #709bc2;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #709bc2 16%, var(--card)),
    var(--card)
  );
}
`,
          "legacy-062": `.enpr {
  font-size: 14px;
  color: var(--ac);
  margin-top: 4px;
}
.entap {
  cursor: pointer;
  border-bottom: 1px dotted color-mix(in srgb, var(--ac) 50%, transparent);
}
#enpop {
  position: fixed;
  z-index: 100003;
  background: var(--card);
  border: 1px solid var(--bd2);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  max-width: 260px;
}
.engrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 0 8px;
}
.enatal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--card);
  color: var(--tx);
  cursor: pointer;
  text-align: left;
}
.enatal span {
  font-size: 24px;
}
.enatal small {
  color: var(--mut);
}
.enchips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.encard {
  min-height: 260px;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #709bc2 14%, var(--card)),
    var(--card)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding:24px;
  cursor: pointer;
  transition: transform 0.25s;
}
.encard.vira {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #ad853a 14%, var(--card)),
    var(--card)
  );
}
.endica p {
  font-size: 15px;
}
.endl {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.enchat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.enmsg {
  max-width: 86%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.45;
}
.enmsg.a {
  align-self: flex-end;
  background: var(--ac2);
  border: 1px solid color-mix(in srgb, var(--ac) 40%, transparent);
}
.enmsg.p {
  align-self: flex-start;
  background: var(--card);
  border: 1px solid var(--bd);
}
.encor {
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--am) 12%, transparent);
  font-size: 14px;
}
.ensug {
  display: block;
  width: 100%;
  text-align: left;
  margin: 0 0 8px;
  padding: 8px 8px;
  border-radius: 8px;
  border: 1px dashed var(--bd2);
  background: none;
  color: var(--tx);
  font-size: 14px;
  cursor: pointer;
}
.eninp {
  display: flex;
  gap: 8px;
}
.eninp input {
  flex: 1;
}
.agen {
  color: var(--mut);
  margin-top: 4px;
  font-style: italic;
}
.fococlk {
  font: 800 64px var(--mono);
  text-align: center;
  margin: 8px 0;
}
.enfocoon {
  border-color: var(--ac);
}
.fbars {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  height: 120px;
  margin-top: 12px;
  align-items: end;
}
.fbars > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 4px;
}
.fbars i {
  display: block;
  width: 70%;
  min-height: 2px;
  border-radius: 6px 6px 2px 2px;
}
.fbars small {
  font-size: 12px;
  color: var(--mut);
}
.fbars b {
  font: 700 12px var(--mono);
}
`,
          "legacy-063": `.mdtag {
  display: inline-block;
  vertical-align: middle;
  font: 700 12px var(--fs);
  letter-spacing: 0.02em;
  padding: 4px 8px;
  border-radius: 99px;
  background: color-mix(in srgb, #ad853a 16%, transparent);
  color: #ad853a;
  margin-left: 4px;
}
.mdtag.us {
  background: color-mix(in srgb, #709bc2 18%, transparent);
  color: #86abcb;
}
#app .dlin .dhist {
  display: none !important;
}
`,
          "legacy-064": `#fchov {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.fchbox {
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: 8px 8px 0 0;
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow: auto;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
}
body.pc #fchov {
  align-items: center;
}
body.pc .fchbox {
  border-radius: 8px;
}
.fchbox .x {
  background: none;
  border: 0;
  color: var(--mut);
  font-size: 18px;
  cursor: pointer;
}
.fchp {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin: 8px 0 8px;
}
.fchp i {
  height: 4px;
  border-radius: 2px;
  background: var(--bd2);
}
.fchp i.f {
  background: var(--ac);
}
.fchp i.a {
  background: color-mix(in srgb, var(--ac) 55%, var(--bd2));
}
.fchl {
  margin-top: 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  overflow: hidden;
}
.fchr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--bd);
}
.fchr:first-child {
  border-top: 0;
}
.fchtot {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px 0;
  font-size: 15px;
}
.fchyn {
  display: flex;
  gap: 4px;
}
.fchyn button {
  border: 1px solid var(--bd2);
  background: none;
  color: var(--tx);
  border-radius: 6px;
  padding: 8px 12px;
  font: 600 13px var(--fs);
  cursor: pointer;
}
.fchyn button.on.g {
  background: color-mix(in srgb, var(--g) 18%, transparent);
  border-color: var(--g);
  color: var(--g);
}
.fchyn button.on.r {
  background: color-mix(in srgb, var(--r) 18%, transparent);
  border-color: var(--r);
  color: var(--r);
}
.fchst {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 16px 0 8px;
}
.fchst button {
  font-size: 40px;
  line-height: 1;
  background: none;
  border: 0;
  color: var(--bd2);
  cursor: pointer;
}
.fchst button.on {
  color: #bb8e3b;
}
.fchok {
  font-size: 48px;
  text-align: center;
}
.fchcv {
  border-color: var(--ac);
}
#ruimov {
  position: fixed;
  inset: 0;
  z-index: 9800;
  background: rgba(53,40,17,0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #ffffff;
  text-align: center;
}
.ruimbox {
  max-width: 420px;
  width: 100%;
}
.ruimbox .btn.s {
  background: transparent;
  color: #ffffff;
  border-color: rgba(255,255,255,0.5);
}
.facr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.facr:first-of-type {
  border-top: 0;
}
.tmcard {
  border-color: var(--ac);
}
.tmg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.tmg button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--card2);
  color: var(--tx);
  text-align: left;
  cursor: pointer;
}
.tmg span {
  font-size: 22px;
}
.tmg b {
  font-size: 15px;
}
.tmg small {
  color: var(--mut);
  font-size: 12px;
}
`,
          "legacy-065": `.grctx {
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: color-mix(in srgb, var(--ac) 5%, transparent);
}
.grlt {
  display: inline-block;
  font: 800 13px var(--fs);
  letter-spacing: 0.03em;
  padding: 4px 8px;
  border: 1px solid;
  border-radius: 99px;
  margin-bottom: 8px;
}
.grci {
  font-size: 14px;
  line-height: 1.45;
  padding: 4px 0;
  border-top: 1px dashed var(--bd);
}
.grci:first-of-type {
  border-top: 0;
}
.grci b {
  color: var(--ac);
}
`,
          "legacy-066": `.gtsvg {
  width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
  background: color-mix(in srgb, var(--card2) 60%, transparent);
  border-radius: 8px;
}
.gtop.g {
  color: var(--g);
  border-color: var(--g);
}
.gtop.r {
  color: var(--r);
  border-color: var(--r);
}
.gtop.am {
  color: var(--am);
  border-color: var(--am);
}
.fdscard {
  border-color: var(--ac);
}
.fdsel {
  margin: 8px 0;
  padding: 8px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--am) 12%, transparent);
}
.fdsl {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
#rvmov {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
body.pc #rvmov {
  align-items: center;
}
.rvmmeta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.rvmmeta button {
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  background: none;
  color: var(--tx);
  font: 500 14px var(--fs);
  cursor: pointer;
}
.rvmmeta button.on {
  border-color: var(--ac);
  background: var(--ac2);
  font-weight: 700;
}
.ditres {
  font-size: 18px;
  line-height: 1.6;
  margin-top: 8px;
}
.ditres .g {
  color: var(--g);
}
.ditres .r {
  color: var(--r);
  text-decoration: line-through;
}
#rspov {
  position: fixed;
  inset: 0;
  z-index: 9900;
  background: #121214;
  color: #f1f0ee;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}
.rspbox {
  max-width: 380px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.rspbox .btn.s {
  background: transparent;
  color: #f1f0ee;
  border-color: rgba(255,255,255,0.4);
}
.rspc {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 24px 0 16px;
  background: radial-gradient(circle, #d2b276 0%, #b98e3e 70%);
  box-shadow: 0 0 40px rgba(210,178,118,0.35);
  transition: transform 4s linear;
}
.rspc.grow {
  animation: rspG 4s linear forwards;
}
.rspc.hold {
  transform: scale(1.55);
}
.rspc.shrink {
  animation: rspS 4s linear forwards;
}
.rspc.hold0 {
  transform: scale(1);
}
@keyframes rspG {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.55);
  }
}
@keyframes rspS {
  from {
    transform: scale(1.55);
  }
  to {
    transform: scale(1);
  }
}
.rspt {
  font-size: 24px;
}
.rspn {
  font: 800 40px var(--mono);
  margin-top: 8px;
  opacity: 0.85;
}
.rspgo {
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 13px;
}
`,
          "legacy-067": `.esccard {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  margin-bottom: 8px;
  background: color-mix(in srgb, var(--ac) 5%, transparent);
}
.escop {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}
.escop button {
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  background: none;
  color: var(--tx);
  font: 700 14px var(--fs);
  cursor: pointer;
}
.escop button.on {
  border-color: var(--ac);
  background: var(--ac2);
  color: var(--ac);
}
.lnk {
  background: none;
  border: 0;
  color: var(--ac);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}
`,
          "legacy-068": `.tjan {
  margin: 8px 0 4px;
  padding: 8px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--card2) 70%, transparent);
}
.esc4 {
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: var(--card2);
}
.esc4g {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 8px 0;
}
.esc4g div {
  text-align: center;
  padding: 8px 4px;
  border-radius: 6px;
  border: 1px solid var(--bd);
}
.esc4g div.f {
  border-color: var(--g);
  background: color-mix(in srgb, var(--g) 12%, transparent);
}
.esc4g span {
  display: block;
  font-size: 12px;
  color: var(--mut);
}
.esc4g b {
  display: block;
  font-size: 18px;
}
.esc4g small {
  font-size: 12px;
  color: var(--mut);
}
`,
          "legacy-069": `.tday {
  font-size: 12px;
  font-weight: 700;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tritem {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  border-top: 1px solid var(--bd);
  background: none;
  color: var(--tx);
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.tritem:first-of-type {
  border-top: 0;
}
.tric {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--card2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex: none;
}
.tritem b {
  display: block;
  font-size: 15px;
}
.tritem small {
  display: block;
  color: var(--mut);
  font-size: 13px;
}
.trx {
  margin-left: auto;
  color: var(--mut);
  font-size: 13px;
  white-space: nowrap;
}
.hgr {
  padding: 0;
}
.hgr > details > summary {
  list-style: none;
  cursor: pointer;
  padding: 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.hgr > details > summary::-webkit-details-marker {
  display: none;
}
.hgin {
  padding: 0 12px 8px;
}
.hgin .hgfilho {
  margin: 0 0 8px;
}
.hgin > .card,
.hgin > section > .card {
  box-shadow: none;
}
`,
          "legacy-070": `#undobar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  z-index: 9600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #17191b;
  color: #f6f5f3;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  font-size: 15px;
  animation: m2f 0.2s ease-out;
}
#undobar button {
  background: none;
  border: 0;
  color: #c19646;
  font: 700 15px var(--fs);
  cursor: pointer;
  padding: 4px 8px;
}
body.pc #undobar {
  left: auto;
  width: 360px;
}
`,
          "legacy-071": `.jrcard {
  padding-bottom: 16px;
}
.jrcab {
  text-align: center;
  border-bottom: 1px double var(--bd2);
  padding: 8px 0 8px;
  margin-bottom: 8px;
}
.jrnome {
  font:
    900 30px/1.05 Georgia,
    "Times New Roman",
    serif;
  letter-spacing: -0.01em;
}
.jrdata {
  font-size: 13px;
  color: var(--mut);
  margin-top: 4px;
}
.jrinds {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--bd);
}
.jrind {
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 8px 8px;
  border-radius: 8px;
  background: var(--card2);
  min-width: 96px;
}
.jrind small {
  font-size: 12px;
  color: var(--mut);
}
.jrind b {
  font: 700 14px var(--mono);
}
.jrind i {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}
.jrart {
  padding: 12px 0;
  border-top: 1px solid var(--bd);
}
.jrman {
  border-top: 0;
  padding-top: 4px;
}
.jrchap {
  font: 800 12px var(--fs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.jrtit {
  font:
    700 20px/1.22 Georgia,
    "Times New Roman",
    serif;
  margin: 0 0 8px;
  letter-spacing: -0.005em;
}
.jrman .jrtit {
  font-size: 28px;
  line-height: 1.15;
}
.jrfina {
  font-size: 15px;
  line-height: 1.45;
  color: var(--mut);
  margin-bottom: 8px;
}
.jrtxt p {
  font:
    400 16.5px/1.62 Georgia,
    "Times New Roman",
    serif;
  margin: 0 0 12px;
}
.jrtxt p:first-child::first-letter {
  font-size: 1.15em;
  font-weight: 700;
}
.jrnums {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 8px;
  margin: 8px 0 12px;
}
.jrnums div {
  padding: 8px 8px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--card2);
}
.jrnums small {
  display: block;
  font-size: 12px;
  color: var(--mut);
}
.jrnums b {
  font: 700 15px var(--mono);
}
.jrpq {
  padding: 8px 12px;
  border-left: 1px solid var(--ac);
  background: color-mix(in srgb, var(--ac) 7%, transparent);
  border-radius: 0 8px 8px 0;
  font-size: 15px;
  line-height: 1.45;
  margin: 8px 0 8px;
}
.jrpq b {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ac);
  margin-bottom: 4px;
}
.jrbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.jrler {
  background: none;
  border: 0;
  color: var(--ac);
  font: 700 14px var(--fs);
  padding: 4px 0;
  cursor: pointer;
}
.jrsec {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px double var(--bd2);
}
.jrsec h3 {
  font: 800 13px var(--fs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 8px;
  color: var(--mut);
}
.jrpl {
  margin: 0;
  padding-left: 16px;
}
.jrpl li {
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 8px;
}
.jranal .jrtit {
  font-style: italic;
}
.jrag {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 15px;
}
.jrag:first-of-type {
  border-top: 0;
}
.jrimp {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
  line-height: 1.4;
}
.jrfont {
  margin-top: 12px;
  line-height: 1.6;
}
.jrvaz {
  padding: 16px 0;
  color: var(--mut);
  font-size: 15px;
  text-align: center;
}
html body #app .jrcard h2.jrtit {
  text-transform: none !important;
  letter-spacing: -0.005em !important;
  color: var(--tx) !important;
  font:
    700 20px/1.22 Georgia,
    "Times New Roman",
    serif !important;
  margin: 0 0 8px !important;
  padding: 0 !important;
  border: 0 !important;
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
}
html body #app .jrcard .jrman h2.jrtit {
  font-size: 28px !important;
  line-height: 1.15 !important;
}
html body #app .jrcard .jranal h2.jrtit {
  font-style: italic !important;
}
body.pc .jrtxt p {
  font-size: 18px;
}
body.pc #app .jrcard .jrman h2.jrtit {
  font-size: 32px !important;
}
body.pc .jrman .jrtit {
  font-size: 32px;
}
`,
          "legacy-072": `.grsl {
  display: grid !important;
  grid-template-columns: repeat(6, 1fr);
}
.grsl button {
  font-size: 13px;
  padding: 8px 0;
  white-space: nowrap;
  min-width: 0;
}
.grsl button.grfut {
  opacity: 0.45;
}
`,
          "legacy-073": `.jrhbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.jrviv {
  font-size: 12px;
  font-weight: 700;
  color: var(--r);
  animation: jrpis 2s ease-in-out infinite;
}
.jrviv[hidden] {
  display: none;
}
@keyframes jrpis {
  50% {
    opacity: 0.45;
  }
}
.jrgl {
  border-bottom: 1px dotted var(--ac);
  cursor: help;
}
#glpop {
  position: fixed;
  z-index: 9999;
  background: var(--card);
  color: var(--tx);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  font-size: 14px;
  line-height: 1.45;
}
#glpop b {
  display: block;
  margin-bottom: 4px;
}
.jrpv .jrpvi {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 15px;
  line-height: 1.45;
}
.jrpv .jrpvi:first-of-type {
  border-top: 0;
}
.jrpvi b {
  color: var(--ac);
}
.jrpl2 {
  border-left: 1px solid #e7614c;
  padding-left: 8px;
}
.jrplit {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.jrplit:first-of-type {
  border-top: 0;
}
.jrplit h4 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  margin: 4px 0 4px;
  line-height: 1.3;
}
.jrgrs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px;
}
.jrgr {
  margin: 8px 0 0;
  padding: 8px 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
}
.jrgrs .jrgr {
  margin: 0;
}
.jrgr figcaption {
  font-size: 12px;
  font-weight: 700;
  color: var(--mut);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.jrgr svg {
  max-width: 100%;
}
.jrgrl {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-top: 4px;
}
.jrarq input {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
}
.jrarqi {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-top: 1px solid var(--bd);
  padding: 8px 4px;
  color: var(--tx);
  font: inherit;
  cursor: pointer;
}
.jrarqi:first-child {
  border-top: 0;
}
.jrarqi small {
  display: block;
  color: var(--mut);
  font-size: 12px;
  text-transform: capitalize;
}
.jrarqi b {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  line-height: 1.3;
}
.jrarqb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  background: rgba(194,148,62,0.12);
  border: 1px solid rgba(194,148,62,0.35);
  border-radius: 8px;
  padding: 8px 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
#mujr .card {
  margin-top: 8px;
}
`,
          "legacy-074": `.jrconf {
  border-left: 1px solid var(--ac);
  padding-left: 8px;
}
.jrconfv {
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 4px;
}
.jrconft {
  font-size: 15px;
  line-height: 1.5;
}
.jrconfp > div {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
  line-height: 1.4;
}
.jrconfp small {
  color: var(--mut);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.jrplac {
  margin-top: 8px;
  font-size: 13px;
}
.jrglrc {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 8px;
  background: var(--card2);
  border-radius: 8px;
}
.jrglrc b {
  font-size: 18px;
}
.jrglrx {
  font-size: 15px;
  line-height: 1.45;
}
.jrqp {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.jrqp:first-of-type {
  border-top: 0;
}
.jrqp > b {
  display: block;
  margin-bottom: 8px;
  line-height: 1.35;
}
.jrqo {
  display: block;
  width: 100%;
  text-align: left;
  margin: 4px 0;
  padding: 8px 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card);
  color: var(--tx);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.jrqo.ok {
  border-color: var(--g);
  background: rgba(58,173,116,0.12);
}
.jrqo.no {
  border-color: var(--r);
  background: rgba(231,97,76,0.12);
}
.jrqo:disabled {
  cursor: default;
}
.jrqres {
  margin-top: 8px;
  font-size: 15px;
}
.jrh3b {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.jrh3b .lnk {
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}
.jredp {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 8px;
}
.jredp[hidden] {
  display: none;
}
.jredc {
  border: 1px solid;
  border-radius: 8px;
  padding: 4px 8px;
  background: none;
  color: var(--tx);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.jredc.oc {
  opacity: 0.45;
  text-decoration: line-through;
}
.jrsalv summary {
  cursor: pointer;
  list-style: none;
}
.jrsalv summary::-webkit-details-marker {
  display: none;
}
.jrsvi {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.jrsvi b {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 16px;
  display: block;
  line-height: 1.3;
}
.jrsvb {
  font-size: 13px;
  margin-top: 4px;
}
.mujump {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 4px;
  margin: 0 0 8px;
  background: var(--bg);
  scrollbar-width: none;
}
.mujump::-webkit-scrollbar {
  display: none;
}
.mujump button {
  flex: none;
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--card);
  color: var(--tx);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
`,
          "legacy-075": `.jrbarw {
  height: 4px;
  border-radius: 6px;
  background: var(--bd);
  margin-top: 8px;
  overflow: hidden;
}
.jrbarw i {
  display: block;
  height: 100%;
  background: var(--ac);
  transition: width 1s linear;
}
`,
          "legacy-076": `.jrcard .jrtxt p {
  font-size: calc(17px * var(--jrfs, 1)) !important;
}
.jrcard .jrfina {
  font-size: calc(15.5px * var(--jrfs, 1));
}
.jrcard .jrpq,
.jrcard .jrpl li {
  font-size: calc(15px * var(--jrfs, 1));
}
.jrcard.jrsep {
  --tx: #3b311e;
  --mut: #7a6d55;
  --bd: #d7c5a3;
  --card: #dfc79a;
  --card2: #dcc69d;
  background: #dfc79a !important;
  color: #3b311e;
  border-color: var(--ds-line-2);
}
.jrcard.jrsep h2,
.jrcard.jrsep h3,
.jrcard.jrsep b,
.jrcard.jrsep .jrnome {
  color: #2a2315;
}
.jrcard.jrsep .btn {
  background: #dcc69d;
  color: #3b311e;
  border-color: var(--ds-line-2);
}
.jrleit {
  display: inline-flex;
  gap: 4px;
}
.jrleit .btn {
  min-width: 34px;
  padding-left: 8px;
  padding-right: 8px;
}
.jrleit .btn.on {
  outline: 2px solid var(--ac);
}
.jrkwl {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.jrkwc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--ac);
  border-radius: 8px;
  padding: 4px 4px 4px 8px;
  font-size: 14px;
}
.jrkwc button {
  border: 0;
  background: none;
  color: var(--mut);
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}
.jrkwf {
  display: flex;
  gap: 8px;
}
.jrkwf input {
  flex: 1;
  min-width: 0;
}
.jrkwt {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px 0 4px;
}
.jrkwt span {
  font-size: 12px;
  font-weight: 700;
  background: rgba(112,155,194,0.14);
  color: var(--ac);
  border-radius: 6px;
  padding: 1px 8px;
}
.jraula {
  border-left: 1px solid var(--ac);
  padding-left: 8px;
}
.jraulq {
  margin: 8px 0;
}
.jraulq > b {
  display: block;
  margin-bottom: 4px;
}
.jraulq details {
  border-top: 1px solid var(--bd);
  padding: 8px 0;
}
.jraulq summary {
  cursor: pointer;
  font-weight: 600;
  line-height: 1.35;
}
.jraulq details div {
  margin-top: 4px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--mut);
}
.jrtsug {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.jredc.on {
  background: var(--ac);
  color: #ffffff;
  border-color: var(--ac);
}
.jrtempo input {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
}
.jrtl {
  border-left: 1px solid var(--bd);
  margin-left: 24px;
}
.jrtli {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 8px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  padding: 8px 0 8px;
  color: var(--tx);
  font: inherit;
  cursor: pointer;
  margin-left: -24px;
  position: relative;
}
.jrtld {
  font-weight: 800;
  font-size: 13px;
  text-align: center;
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 6px;
  padding: 4px 0;
  height: fit-content;
}
.jrtld small {
  display: block;
  font-weight: 500;
  font-size: 12px;
  color: var(--mut);
}
.jrtli b {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  line-height: 1.3;
}
.jrtli small {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.jrnota {
  margin: 8px 0 4px;
  padding: 8px 8px;
  border-radius: 8px;
  background: var(--card2);
}
.jrnota textarea {
  width: 100%;
  box-sizing: border-box;
}
.jrnotav small {
  display: block;
  color: var(--mut);
  font-size: 12px;
  margin-bottom: 4px;
}
.jrnd {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.jrnd:first-of-type {
  border-top: 0;
}
.jrndb {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.jrndb .btn.on {
  outline: 2px solid var(--ac);
}
`,
          "legacy-077": `.grult {
  margin-top: 8px;
  padding: 8px 8px;
  border-radius: 8px;
  background: var(--card2);
  font-size: 14px;
  line-height: 1.45;
}
`,
          "legacy-078": `.jrpts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.jrpt {
  font-size: 12px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 4px 8px;
  color: var(--mut);
}
.jrpt.ok {
  color: var(--g);
  border-color: var(--g);
}
.jrpt.no {
  color: var(--r);
  border-color: var(--r);
}
.jrptw {
  margin-bottom: 8px;
  font-size: 13px;
  text-align: center;
}
.jrptw .jrpts {
  margin-top: 8px;
}
`,
          "legacy-079": `.jrbalt {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: var(--g);
  background: color-mix(in srgb, var(--g) 12%, transparent);
  border-radius: 6px;
  padding: 1px 8px;
  margin: 4px 0 4px;
}
`,
          "legacy-080": `.errl {
  max-height: 320px;
  overflow: auto;
  border-top: 1px solid var(--bd);
}
.erri {
  padding: 8px 0;
  border-bottom: 1px solid var(--bd);
}
.erri .sm {
  line-height: 1.4;
}
.fxi {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.fxi small {
  display: block;
  color: var(--mut);
  font-size: 12px;
}
#fxcard summary {
  cursor: pointer;
  margin-bottom: 4px;
}
`,
          "legacy-081": `.mdo-alerta {
  margin: 4px 0 8px;
  padding: 8px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--r) 12%, transparent);
  font-size: 14px;
  line-height: 1.4;
}
`,
          "legacy-082": `.jrind small.jrfech {
  display: block;
  font-size: 12px;
  color: var(--am);
  font-weight: 600;
  margin-top: -1px;
}
`,
          "legacy-083": `.facbt {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.facd .top b {
  font-size: 16px;
}
.facmeta .facnum {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.facnum > div {
  background: var(--card2);
  border-radius: 8px;
  padding: 8px 8px;
}
.facnum b {
  display: block;
  font-size: 22px;
}
.facaula {
  border-color: var(--ac);
}
.facx p {
  font-size: 16px !important;
}
.facex {
  margin: 8px 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--g) 9%, transparent);
  border-left: 1px solid var(--g);
}
.facex .jrtxt p {
  font-size: 15px !important;
}
.facpk ul {
  margin: 4px 0 0;
  padding-left: 16px;
}
.facpk li {
  margin: 4px 0;
  line-height: 1.4;
}
.facpq {
  margin: 8px 0;
}
.facpq summary {
  cursor: pointer;
  font-weight: 600;
}
.facpq div {
  margin-top: 4px;
  color: var(--mut);
}
.facfl {
  margin-top: 8px;
  padding: 16px 16px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
  text-align: center;
  cursor: pointer;
  min-height: 90px;
}
.facflc {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 8px;
}
.facjn {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.facjn:first-of-type {
  border-top: 0;
}
.factp {
  margin-top: 8px;
}
.factp summary {
  cursor: pointer;
}
.factpi {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
}
.facem textarea {
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
}
.jrqd {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: var(--ac);
  background: color-mix(in srgb, var(--ac) 12%, transparent);
  border-radius: 6px;
  padding: 1px 8px;
  margin-bottom: 4px;
}
`,
          "legacy-084": `#curso summary {
  cursor: pointer;
}
.cur {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  border-top: 1px solid var(--bd);
}
.cur.st-ok .sm:not(.mut) {
  opacity: 0.6;
  text-decoration: line-through;
}
.cur.st-cur {
  background: color-mix(in srgb, var(--ac) 8%, transparent);
}
.curbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--mut);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}
.st-ok .curbox {
  background: var(--g);
  border-color: var(--g);
  color: #ffffff;
}
.st-cur .curbox {
  border-color: var(--ac);
  color: var(--ac);
  font-size: 20px;
}
.curst {
  border: 0;
  background: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
}
.curtr {
  font-size: 12px;
  font-weight: 700;
  color: var(--g);
  white-space: nowrap;
}
.curad {
  padding: 8px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--g) 8%, transparent);
  line-height: 1.6;
}
`,
          "legacy-085": `/* fileiras de botões: quebram linha em vez de sair da tela; rótulo curto não parte no meio */
.jrhbar {
  flex-wrap: wrap;
  justify-content: flex-start !important;
  row-gap: 8px;
}
.jrhbar .btn,
.jrbar .btn,
.top > .btn,
.top > button.btn,
.chips2 > button,
.hub2 > button {
  white-space: nowrap;
}
.jrhbar .jrviv {
  flex-basis: 100%;
  text-align: left;
}
.jrbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.jrbar > span:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}
.btn .ico {
  flex: none;
}
html body .top h1 {
  min-width: 0;
  overflow-wrap: anywhere;
}
/* cartões de números: no celular estreito vira 2×2 em vez de cortar "R$ 600…" */
@media (max-width: 430px) {
  .pscmp .kv {
    grid-template-columns: 1fr 1fr !important;
  }
}
html body .kv > .card > b,
.pscmp .kv b {
  font-size: clamp(15px, 4.6vw, 20px);
}
/* iPhone deitado: a câmera fica na lateral — conteúdo, barra de baixo e ticker respeitam a área segura */
@media (orientation: landscape) and (max-height: 540px) {
  html body #app {
    padding-left: max(16px, env(safe-area-inset-left, 0px)) !important;
    padding-right: max(16px, env(safe-area-inset-right, 0px)) !important;
  }
  nav,
  #tape {
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
  }
  #imgov,
  #fx,
  #ov {
    padding-left: max(12px, env(safe-area-inset-left, 0px)) !important;
    padding-right: max(12px, env(safe-area-inset-right, 0px)) !important;
  }
}
/* visualizador de imagem: a imagem inteira aparece (rola se for comprida) e nada fica embaixo da câmera */
#imgov {
  padding-top: calc(12px + env(safe-area-inset-top, 0px)) !important;
}
#imgov img {
  display: block;
  margin: 0 auto;
}
/* PC: coluna de leitura de jornal (linhas longas cansam) e formulários com largura de gente */
@media (min-width: 980px) {
  body.pc #jrbox {
    max-width: 860px;
    margin-left: auto;
    margin-right: auto;
  }
  body.pc #app .card p,
  body.pc #app .jrtx p {
    max-width: 82ch;
  }
  body.pc #app .card > .sm,
  body.pc #app .card > p.sm {
    max-width: 90ch;
  }
  body.pc #app[data-tela="stats"] label > select,
  body.pc #app[data-tela="stats"] > select {
    max-width: 420px;
  }
  body.pc #app .g2 > label > select,
  body.pc #app .g2 > label > input {
    max-width: none;
  }
  body.pc .jrhbar {
    justify-content: center !important;
  }
}
@media (min-width: 1500px) {
  body.pc #jrbox {
    max-width: 900px;
  }
}
`,
          "legacy-086": `#gateov {
  position: fixed;
  inset: 0;
  z-index: 99990;
  background: var(--bg);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px
    calc(28px + env(safe-area-inset-bottom, 0px));
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
#gateov .gc {
  width: 100%;
  max-width: 560px;
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
}
#gateov h2 {
  margin: 8px 0 8px;
}
#gateov .gi {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 12px 0;
  border-top: 1px solid var(--bd);
  cursor: pointer;
  line-height: 1.35;
}
#gateov .gi input {
  margin-top: 4px;
  flex: none;
  width: 20px;
  height: 20px;
}
#gateov .gi span {
  min-width: 0;
}
#gateov .gb {
  width: 100%;
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 0;
  font-weight: 700;
  font-size: 16px;
  background: var(--ac);
  color: #ffffff;
}
#gateov .gb:disabled {
  opacity: 0.45;
}
.errbox {
  margin-top: 4px;
}
.errsel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}
.errpill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 4px 8px 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--r);
  color: var(--r);
  font-size: 14px;
  line-height: 1.3;
}
.errpill button {
  border: 0;
  background: none;
  color: inherit;
  font-size: 18px;
  line-height: 1;
  padding: 4px 4px;
  cursor: pointer;
}
.errbtn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--bd2, var(--bd));
  background: var(--card2, var(--card));
  color: var(--tx);
  font: 600 15px inherit;
  text-align: left;
  cursor: pointer;
}
.errlist {
  margin-top: 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 4px 12px 8px;
  background: var(--card);
}
.errcat {
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--mut);
  font-weight: 700;
  margin: 12px 0 4px;
}
.errit {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  cursor: pointer;
  font-size: 15px;
  line-height: 1.35;
}
.errit input {
  margin-top: 4px;
  flex: none;
  width: 20px;
  height: 20px;
}
.errit span {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
#csvch {
  position: fixed;
  inset: 0;
  z-index: 99995;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
#csvch .csvc {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  max-width: 420px;
}
#csvch .csvg {
  display: grid;
  gap: 8px;
  margin: 8px 0 12px;
}
#csvch .btn {
  width: 100%;
}
`,
          "legacy-087": `.jrvtab {
  overflow-x: auto;
  margin: 8px 0;
}
.jrvtab table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.jrvtab th,
.jrvtab td {
  padding: 8px 4px;
  border-bottom: 1px solid var(--bd);
  text-align: right;
  white-space: nowrap;
}
.jrvtab th:first-child,
.jrvtab td:first-child {
  text-align: left;
}
#profitalert {
  margin: 0 0 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--ds-line-2);
  background: rgba(194,148,62,0.12);
}
#profitalert .pfa-t {
  font-weight: 700;
  margin-bottom: 4px;
}
#profitalert .pfa-l {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
`,
          "legacy-088": `.gest-l {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.gest {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 4px;
  background: var(--card);
  font-weight: 700;
  color: inherit;
}
.gest.on {
  border-color: var(--g);
  background: rgba(173,133,58,0.14);
}
.gest small {
  display: block;
  font-weight: 400;
  font-size: 12px;
  opacity: 0.7;
}
.gchk {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 8px 0;
  font-size: 14px;
}
.gchk input {
  margin-top: 4px;
  flex: none;
}
.gsec {
  margin: 12px 0;
  padding-top: 8px;
  border-top: 1px solid var(--bd);
}
.gdica {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(194,148,62,0.1);
}
`,
          "legacy-089": `.jrcard {
  --jr-rule: color-mix(in srgb, var(--tx) 22%, transparent);
}
html body #app .jrcard .jrcab {
  border-bottom: 0;
  border-top: 4px solid var(--tx);
  padding: 12px 0 0;
  margin-bottom: 16px;
}
html body #app .jrcard .jrcab::after {
  content: "";
  display: block;
  height: 3px;
  margin-top: 12px;
  border-top: 1px solid var(--tx);
  border-bottom: 1px solid var(--tx);
}
html body #app .jrcard .jrnome {
  font:
    900 34px/1 Georgia,
    "Times New Roman",
    serif;
  letter-spacing: -0.02em;
}
html body #app .jrcard .jrdata {
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 12px;
}
html body #app .jrcard .jrsec > h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font:
    800 11.5px/1.2 system-ui,
    -apple-system,
    sans-serif !important;
  text-transform: uppercase !important;
  letter-spacing: 0.14em !important;
  margin: 24px 0 8px !important;
  color: var(--tx) !important;
  border: 0 !important;
  padding: 0 !important;
  background: none !important;
}
html body #app .jrcard .jrsec > h3::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--jr-rule);
}
html body #app .jrcard .jrman h2.jrtit {
  font-size: 32px !important;
  line-height: 1.12 !important;
  letter-spacing: -0.015em !important;
}
body.pc #app .jrcard .jrman h2.jrtit {
  font-size: 40px !important;
}
.jrmkt + * {
  margin-top: 16px !important;
}
.jrilu {
  margin: 4px 0 12px;
  border-radius: 8px;
  overflow: hidden;
  line-height: 0;
}
.jrilu svg {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 600/190;
}
html body #app .jrcard .jrinds.jrmk {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  overflow: visible;
  border-bottom: 0;
  padding: 0;
  margin: 0;
}
.jrmk .jrind {
  min-width: 0;
  gap: 4px;
  padding: 8px 8px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  border-left-width: 1px;
  background: var(--card2);
}
.jrmk .jrind small {
  font-size: 12px;
  color: var(--mut);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jrmk .jrind b {
  font:
    700 16px/1.2 Georgia,
    "Times New Roman",
    serif;
  font-variant-numeric: tabular-nums;
}
.jrmk .jrind i {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.jrmk .jrind:has(i.g) {
  border-left-color: var(--g);
  background: color-mix(in srgb, var(--g) 9%, var(--card2));
}
.jrmk .jrind i.g {
  color: var(--g);
}
.jrmk .jrind:has(i.r) {
  border-left-color: var(--r);
  background: color-mix(in srgb, var(--r) 9%, var(--card2));
}
.jrmk .jrind i.r {
  color: var(--r);
}
.jrexl {
  margin: 0;
  padding-left: 24px;
}
.jrexl li {
  margin: 0 0 8px;
  line-height: 1.45;
}
.jrexl li b {
  display: block;
  font:
    700 16px/1.3 Georgia,
    "Times New Roman",
    serif;
}
.jrexl li span {
  display: block;
  font-size: 14px;
  color: var(--mut);
}
.jrchips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.jrchip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid var(--bd);
  background: var(--card2);
  white-space: nowrap;
}
.jrchip small {
  font-weight: 600;
  opacity: 0.7;
}
.jrchip.up {
  color: var(--g);
  border-color: color-mix(in srgb, var(--g) 45%, transparent);
  background: color-mix(in srgb, var(--g) 10%, transparent);
}
.jrchip.dn {
  color: var(--r);
  border-color: color-mix(in srgb, var(--r) 45%, transparent);
  background: color-mix(in srgb, var(--r) 10%, transparent);
}
.jrsets {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}
.jrsets > small {
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  margin-right: 4px;
}
.jrsets span {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--card2);
}
.jrimp1 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 8px 0 4px;
}
.jrimp1 > small {
  color: var(--mut);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  margin-right: 4px;
}
.jrset1 {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--card2);
  font-size: 13px;
}
.jrtcs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 8px;
}
.jrtc {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--card2);
}
.jrtc-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.jrtc-h b {
  font:
    700 17px Georgia,
    "Times New Roman",
    serif;
}
.jrtag {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.jrtag.up {
  color: var(--g);
  background: color-mix(in srgb, var(--g) 14%, transparent);
}
.jrtag.dn {
  color: var(--r);
  background: color-mix(in srgb, var(--r) 14%, transparent);
}
.jrtag.eq {
  color: var(--mut);
  background: color-mix(in srgb, var(--mut) 14%, transparent);
}
.jrtc-g {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.jrtc-g > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.jrtc-g small {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--mut);
}
.jrtc-g b {
  font-variant-numeric: tabular-nums;
  font-size: 15px;
}
.jrtc-g span {
  font-size: 12px;
  color: var(--mut);
  font-variant-numeric: tabular-nums;
}
.jrtc-g > div:first-child b {
  color: var(--r);
}
.jrtc-g > div:last-child b {
  color: var(--g);
}
.jragenda .jrag {
  border-left: 1px solid var(--jr-rule);
  padding-left: 8px;
  margin-left: 4px;
}
@media (min-width: 980px) {
  body.pc .jrilu svg {
    aspect-ratio: 600/150;
  }
  html body.pc #app .jrcard .jrinds.jrmk {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  body.pc #jrbox .jrmais {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 28px;
    align-items: start;
  }
  body.pc #jrbox .jrmais > :not(article) {
    grid-column: 1/-1;
  }
}
`,
          "legacy-090": `#gateov .epq {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
  line-height: 1.35;
}
#gateov .epb {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
#gateov .epb button {
  border: 1px solid var(--bd);
  background: var(--card2);
  color: inherit;
  border-radius: 8px;
  padding: 8px 0;
  font-weight: 700;
  font-size: 14px;
}
#gateov .epb button.on {
  border-color: var(--g);
  background: color-mix(in srgb, var(--g) 18%, var(--card2));
}
#gateov .epres {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--card2);
  font-size: 14px;
}
#gateov .epres.up {
  background: color-mix(in srgb, var(--g) 14%, var(--card2));
}
#gateov .epres.dn {
  background: color-mix(in srgb, var(--r) 14%, var(--card2));
}
#gateov .gfim {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  font-size: 15px;
}
#gateov .gfim[disabled] {
  opacity: 0.55;
}
`,
          "legacy-091": `.jrilu.jrfoto {
  position: relative;
  aspect-ratio: 600/230;
  background:
    linear-gradient(
      90deg,
      rgba(17,18,20,0.92) 0%,
      rgba(17,18,20,0.55) 38%,
      rgba(17,18,20,0) 70%
    ),
    url(img/jornal/capa.jpg) right 30% / cover no-repeat,
    url(data:image/jpeg;base64,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) right 30% / cover no-repeat,
    url(touro-hero.jpg) right 30% / cover no-repeat,
    #1f2023;
  border-radius: 8px;
}
.jrilu.jrfoto span {
  position: absolute;
  left: 16px;
  bottom: 14px;
  color: #ffffff;
  font:
    800 12px/1 system-ui,
    -apple-system,
    sans-serif;
  letter-spacing: 0.16em;
  background: #ac8439;
  padding: 4px 8px;
  border-radius: 6px;
}
@media (min-width: 980px) {
  body.pc .jrilu.jrfoto {
    aspect-ratio: 600/170;
  }
}
`,
          "legacy-092": `.jrhoje-c {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid var(--mut);
  background: var(--card2);
}
.jrhoje-c b {
  font:
    700 17px/1.25 Georgia,
    "Times New Roman",
    serif;
}
.jrhoje-c span {
  font-size: 14px;
}
.jrhoje-c.up {
  border-left-color: var(--g);
  background: color-mix(in srgb, var(--g) 10%, var(--card2));
}
.jrhoje-c.dn {
  border-left-color: var(--r);
  background: color-mix(in srgb, var(--r) 10%, var(--card2));
}
.jrhoje-c.eq {
  border-left-color: var(--ds-line-2);
  background: color-mix(in srgb, #a98136 10%, var(--card2));
}
.jrkp3,
.jrkp4 {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}
.jrkp3 {
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}
.jrkp4 {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
.jrkp3 > div,
.jrkp4 > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
  border-left-width: 1px;
}
.jrkp3 small,
.jrkp4 small {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--mut);
}
.jrkp3 b,
.jrkp4 b {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.jrkp4 span {
  font-size: 12px;
  color: var(--mut);
}
.jrkp4 > .up {
  border-left-color: var(--g);
}
.jrkp4 > .up b {
  color: var(--g);
}
.jrkp4 > .dn {
  border-left-color: var(--r);
}
.jrkp4 > .dn b {
  color: var(--r);
}
.jrniv {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin: 4px 0 8px;
}
.jrniv > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 6px;
  background: var(--card);
}
.jrniv small {
  font-size: 12px;
  color: var(--mut);
  font-weight: 700;
}
.jrniv b {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.jrniv .dn b {
  color: var(--r);
}
.jrniv .up b {
  color: var(--g);
}
.jrcen p {
  margin: 4px 0;
  font-size: 14px;
  line-height: 1.45;
}
.jrpre {
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 4px solid var(--mut);
  background: var(--card2);
  margin-bottom: 8px;
}
.jrpre.up {
  border-left-color: var(--g);
}
.jrpre.dn {
  border-left-color: var(--r);
}
.jrpre.eq {
  border-left-color: var(--ds-line-2);
}
.jrpre ul {
  margin: 8px 0 0;
  padding-left: 16px;
}
.jrpre li {
  font-size: 14px;
  margin-bottom: 4px;
}
`,
          "legacy-093": `.jrmdbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 16px 0 4px;
  padding: 8px 12px;
  border: 1px dashed var(--bd);
  border-radius: 8px;
}
.jr5l {
  margin: 0;
  padding-left: 0;
  list-style: none;
  counter-reset: c5;
}
.jr5l li {
  counter-increment: c5;
  position: relative;
  padding: 8px 0 8px 48px;
  border-bottom: 1px solid var(--bd);
}
.jr5l li:last-child {
  border-bottom: 0;
}
.jr5l li::before {
  content: counter(c5);
  position: absolute;
  left: 0;
  top: 8px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1f2023;
  color: #d4b57d;
  font:
    700 18px/34px Georgia,
    serif;
  text-align: center;
}
.jr5l li b {
  display: block;
  font:
    700 16px/1.3 Georgia,
    "Times New Roman",
    serif;
}
.jr5l li span {
  display: block;
  font-size: 14px;
  color: var(--mut);
  margin-top: 4px;
}
.jrtx2 {
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 8px;
}
.jrplc {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--bd);
}
.jrplc > div {
  flex: 1;
  min-width: 0;
}
.jrplc > div b {
  display: block;
  font-size: 14px;
  line-height: 1.35;
}
.jrbdg {
  flex: none;
  min-width: 58px;
  text-align: center;
  background: #1f2023;
  color: #ffffff;
  font-weight: 800;
  font-size: 12px;
  border-radius: 6px;
  padding: 4px 8px;
}
.jrrk2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.jrrkt {
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.jrrk {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: baseline;
  padding: 4px 0;
  border-bottom: 1px solid var(--bd);
}
.jrrk span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jrmesa .jrtxt p {
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
}
.jrob {
  padding: 8px 0;
  border-bottom: 1px solid var(--bd);
}
.jrob-h {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}
.jrob-h span:not(.jrtag) {
  color: var(--mut);
}
.jrob-e {
  font-weight: 700;
  font-size: 15px;
  margin: 4px 0;
}
.jrob-n {
  font-size: 14px;
}
@media (max-width: 430px) {
  .jrrk2 {
    grid-template-columns: 1fr;
  }
}
`,
          "legacy-094": `.finchips {
  margin: 4px 0 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 360px) {
  .finchips {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.finchips button {
  border: 1px solid var(--bd);
  background: var(--card);
  color: inherit;
  border-radius: 8px;
  padding: 8px 4px;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.finchips button.on {
  border-color: var(--g);
  background: color-mix(in srgb, var(--g) 15%, var(--card));
}
.finmes {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fing {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  align-items: end;
  margin: 8px 0;
}
.fing.fing3 {
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}
.fin4 {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
  margin: 8px 0;
}
.fin4 .card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fin4 b {
  font-size: 20px;
}
.finrenda {
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  padding: 4px 8px;
}
.fint {
  margin: 16px 0 8px;
  font-size: 14px;
}
.fincat {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) 2fr auto;
  gap: 8px;
  align-items: center;
  margin: 4px 0;
  font-size: 14px;
}
.finbar {
  height: 10px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
}
.finbar > div {
  height: 100%;
  border-radius: 6px;
}
.finmeta .finbar,
.card > .finbar {
  height: 14px;
  margin-top: 8px;
}
.fincarts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fincarts span {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
}
.fincarts small {
  font-size: 12px;
  color: var(--mut);
}
.finmeta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.finmeta > div {
  display: flex;
  flex-direction: column;
  padding: 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
  min-width: 0;
}
.finmeta small {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mut);
}
.finmeta b {
  font-size: clamp(14px, 4vw, 18px);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.fintab td,
.fintab th {
  white-space: normal;
}
`,
          "legacy-095": `html body .chips2 > button {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  white-space: normal;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}
html body #oplegs .chips2 > button {
  flex: none;
  white-space: nowrap;
}
select.selch {
  width: 100%;
}
`,
          "legacy-096": `.jvo {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--bd);
}
.jvo h4 {
  margin: 0 0 4px;
  font:
    700 16px/1.3 Georgia,
    "Times New Roman",
    serif;
}
.jvon {
  margin: 8px 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--card2);
  border-left: 1px solid var(--g);
}
.jvon ul {
  margin: 8px 0 0;
  padding-left: 16px;
}
.jvon li {
  font-size: 14px;
  line-height: 1.45;
  margin-bottom: 4px;
}
.jvoc {
  margin-top: 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
  padding: 0 12px;
}
.jvoc summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0;
  cursor: pointer;
  list-style: none;
}
.jvoc summary::-webkit-details-marker {
  display: none;
}
.jvoc summary b {
  font-size: 16px;
  margin-right: auto;
}
.jvoc summary span {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.jvoc .jvog {
  margin: 8px 0 4px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--g);
}
.jvoc p {
  margin: 4px 0 8px;
  font-size: 14px;
  line-height: 1.45;
}
.jvoc p small {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mut);
}
`,
          "legacy-097": `.jvobs {
  margin: 8px 0 8px;
  padding: 8px 12px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card2);
}
.jvobs-add {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.jvobs-add input {
  flex: 1;
  min-width: 0;
  text-transform: uppercase;
}
.jvobs-l {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.jvobs-t {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--bd);
  background: var(--card);
  font-weight: 700;
  font-size: 13px;
}
.jvobs-t button {
  border: 0;
  background: none;
  color: var(--mut);
  font-size: 18px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
}
.jvals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 8px;
}
.jvals .btn {
  white-space: normal;
  text-align: left;
}
.jvals .btn.on {
  color: var(--g);
  border-color: var(--g);
}
.jvp {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--bd);
}
.jvp h4 {
  margin: 0 0 4px;
  font:
    700 16px/1.3 Georgia,
    "Times New Roman",
    serif;
}
.sempad {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.sempad:first-of-type {
  border-top: 0;
}
.sempad b {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ac);
}
.sempad span {
  font-size: 14px;
  line-height: 1.45;
}
.crsai {
  border-left: 4px solid var(--g);
}
.crsai-d {
  font: 700 20px/1.25 var(--fs);
  margin: 8px 0 4px;
}
.crsai-i {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.crsai-i > b {
  flex: none;
  min-width: 38px;
  text-align: center;
  font-size: 13px;
}
.crsai-c {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, #b38838 10%, var(--card2));
  font-size: 14px;
  line-height: 1.45;
}
`,
          "legacy-098": `.duoseg {
  margin: 0 0 8px;
}
.duotop {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  padding: 8px 8px;
  margin-bottom: 8px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--card);
  font-size: 16px;
}
.duotop b {
  font-size: 18px;
}
.duometa-t {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.duometa-t span {
  font-size: 13px;
  color: var(--mut);
}
.duosem {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-top: 8px;
  text-align: center;
}
.duosem span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  border-radius: 8px;
  background: var(--card2);
}
.duosem small {
  font-size: 12px;
  color: var(--mut);
  font-weight: 700;
}
.duosem b {
  font-size: 15px;
}
.duosem .ok {
  background: color-mix(in srgb, #c69a49 18%, var(--card2));
}
.duosem .hj {
  outline: 2px solid var(--g);
  outline-offset: -2px;
}
.duoatalhos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 4px;
}
.duoatalhos .btn {
  flex: 1 1 auto;
}
.duoun {
  margin: 16px 0 8px;
}
.duoun.fech {
  opacity: 0.55;
}
.duoun-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--g);
  color: #ffffff;
  box-shadow: 0 4px 0 color-mix(in srgb, var(--g) 60%, #000000);
}
.duoun.fech .duoun-h {
  background: var(--mut);
  box-shadow: 0 4px 0 color-mix(in srgb, var(--mut) 60%, #000000);
}
.duoun-h small {
  display: block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.85;
}
.duoun-h b {
  display: block;
  font-size: 18px;
}
.duoun-h span {
  font-size: 13px;
  opacity: 0.9;
}
.duoun-ic {
  font-size: 32px;
}
.duoun-bt {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.duoun-bt .btn {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.35);
  color: #ffffff;
  min-height: 40px;
  padding: 4px 8px;
}
.duopath {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0 8px;
}
.duono-w {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.duono {
  width: 64px;
  height: 60px;
  border-radius: 50%;
  border: 0;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  cursor: pointer;
  background: var(--g);
  box-shadow: 0 6px 0 color-mix(in srgb, var(--g) 55%, #000000);
  transition: transform 0.08s;
}
.duono:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 color-mix(in srgb, var(--g) 55%, #000000);
}
.duono.feito {
  background: #bb8e3b;
  box-shadow: 0 6px 0 #86662a;
}
.duono.trancado {
  background: var(--card2);
  color: var(--mut);
  box-shadow: 0 6px 0 var(--bd);
  font-size: 20px;
}
.duono.atual {
  width: 74px;
  height: 70px;
  font-size: 28px;
  animation: duopulse 1.6s ease-in-out infinite;
}
.duono.trof {
  background: #9e9789;
  box-shadow: 0 6px 0 #625c50;
}
.duono.trof.feito {
  background: #bb8e3b;
  box-shadow: 0 6px 0 #86662a;
}
.duono.trof.trancado {
  background: var(--card2);
  box-shadow: 0 6px 0 var(--bd);
}
@keyframes duopulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}
.duobal {
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--card);
  font-weight: 800;
  font-size: 13px;
  color: var(--g);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.duovid {
  color: #e7614c;
  margin-right: 8px;
  white-space: nowrap;
}
.duopares {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.duopares > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.duopar {
  min-height: 52px;
  padding: 8px 8px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  border-bottom-width: 4px;
  background: var(--card);
  color: inherit;
  font: 600 15px var(--fs);
  cursor: pointer;
  white-space: normal;
}
.duopar.sel {
  border-color: #709bc2;
  background: color-mix(in srgb, #709bc2 14%, var(--card));
}
.duopar.feito {
  opacity: 0.35;
  border-color: var(--g);
}
.duopar.erro {
  border-color: #e7614c;
  background: color-mix(in srgb, #e7614c 14%, var(--card));
  animation: duoerro 0.3s;
}
@keyframes duoerro {
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}
.duofim {
  margin-bottom: 8px;
}
.duofogo {
  font-size: 36px;
  font-weight: 800;
  color: #c69a49;
}
.duoprova {
  margin: 8px 0 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, #9e9789 14%, var(--card2));
  font-size: 14px;
}
`,
          "legacy-099": `.estchips {
  margin: 0 0 8px;
}
.estprox {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 4px solid var(--g);
}
.estprox b {
  font-size: 20px;
}
.estprox .btn {
  margin-top: 8px;
}
.estrv {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.estrv:first-child {
  border-top: 0;
}
.estrv-b {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: none;
}
.estrg {
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.estrg:first-child {
  border-top: 0;
}
.estadd {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}
.estadd input {
  flex: 1;
  min-width: 0;
}
.estedt summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  list-style: none;
}
.estedt summary::-webkit-details-marker {
  display: none;
}
.estedtt {
  width: 100%;
  margin-top: 8px;
  font-size: 13px;
}
.estedtt td:first-child {
  white-space: normal;
}
.estedtt td,
.estedtt th {
  padding: 8px 4px;
}
.estheat {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  gap: 4px;
  justify-content: start;
}
.estheat i {
  width: 16px;
  height: 16px;
  border-radius: 6px;
  background: var(--card2);
  border: 1px solid var(--bd);
}
.estheat .h1 {
  background: color-mix(in srgb, var(--g) 30%, var(--card2));
}
.estheat .h2 {
  background: color-mix(in srgb, var(--g) 55%, var(--card2));
}
.estheat .h3 {
  background: color-mix(in srgb, var(--g) 80%, var(--card2));
}
.estheat .h4 {
  background: var(--g);
}
.estheat .hj {
  outline: 2px solid var(--tx);
  outline-offset: -1px;
}
.estbar {
  display: grid;
  grid-template-columns: minmax(90px, 1.1fr) 2fr auto;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}
.estbar > div {
  height: 10px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
}
.estbar i {
  display: block;
  height: 100%;
  background: var(--g);
  border-radius: 6px;
}
.estmp {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
}
.estcl {
  display: grid;
  grid-template-columns: 1fr 80px auto;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}
.estcl input {
  text-align: center;
}
.estcq {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}
.estcqi {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  opacity: 0.45;
  filter: grayscale(1);
}
.estcqi.ok {
  opacity: 1;
  filter: none;
  border-color: var(--g);
}
.estcqi span {
  font-size: 32px;
}
.estcqi small {
  font-size: 12px;
  color: var(--mut);
}
.estcqi em {
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
  color: var(--g);
  text-transform: uppercase;
}
`,
          "legacy-100": `/* ---------- cores ---------- */
html.pro:root[data-theme="dark"],
html.pro:root:not([data-theme]) {
  --bg: #0a0a0b;
  --card: #111215;
  --card2: #17181a;
  --bd: rgba(255,255,255,0.07);
  --bd2: rgba(255,255,255,0.12);
  --tx: #ececef;
  --mut: #8b8e98;
  --ac: #86abcb;
  --ac2: rgba(134,171,203,0.14);
  --g: #3fbd7e;
  --r: #ea7968;
  --am: #cfab69;
  --grad: linear-gradient(135deg, #86abcb, #86abcb);
  --glow: rgba(134,171,203,0.22);
  --sh1: 0 1px 0 rgba(255,255,255,0.035) inset, 0 1px 2px rgba(0,0,0,0.4);
  --sh2:
    0 1px 0 rgba(255,255,255,0.04) inset,
    0 12px 32px -12px rgba(0,0,0,0.65);
  --ring: 0 0 0 3px rgba(134,171,203,0.28);
}
@media (prefers-color-scheme: light) {
  html.pro:root:not([data-theme]) {
    --bg: #f9f9f8;
    --card: #ffffff;
    --card2: #f7f6f5;
    --bd: rgba(24,25,27,0.08);
    --bd2: rgba(24,25,27,0.14);
    --tx: #1a1b1e;
    --mut: #676c76;
    --ac: #6695be;
    --ac2: rgba(102,149,190,0.1);
    --g: #41444b;
    --r: #d1523f;
    --am: #a37c33;
    --grad: linear-gradient(135deg, #6695be, #86abcb);
    --glow: rgba(102,149,190,0.18);
    --sh1: 0 1px 2px rgba(23,25,27,0.05);
    --sh2:
      0 1px 2px rgba(23,25,27,0.04), 0 12px 28px -14px rgba(23,25,27,0.18);
    --ring: 0 0 0 3px rgba(102,149,190,0.22);
  }
}
html.pro:root[data-theme="light"] {
  --bg: #f9f9f8;
  --card: #ffffff;
  --card2: #f7f6f5;
  --bd: rgba(24,25,27,0.08);
  --bd2: rgba(24,25,27,0.14);
  --tx: #1a1b1e;
  --mut: #676c76;
  --ac: #6695be;
  --ac2: rgba(102,149,190,0.1);
  --g: #41444b;
  --r: #d1523f;
  --am: #a37c33;
  --grad: linear-gradient(135deg, #6695be, #86abcb);
  --glow: rgba(102,149,190,0.18);
  --sh1: 0 1px 2px rgba(23,25,27,0.05);
  --sh2:
    0 1px 2px rgba(23,25,27,0.04), 0 12px 28px -14px rgba(23,25,27,0.18);
  --ring: 0 0 0 3px rgba(102,149,190,0.22);
}
html.pro {
  --fs:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter",
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono:
    -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI",
    Roboto, sans-serif;
  --rad: 16px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
/* ---------- base e tipografia ---------- */
html.pro body {
  background: var(--bg);
  color: var(--tx);
  font-family: var(--fs);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings:
    "tnum" 1,
    "ss01" 1;
  letter-spacing: -0.005em;
}
html.pro body::before {
  content: "";
  position: fixed;
  inset: 0 0 auto 0;
  height: 320px;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(
    70% 100% at 50% 0%,
    color-mix(in srgb, var(--ac) 7%, transparent),
    transparent 70%
  );
}
html.pro #app {
  padding-left: 16px;
  padding-right: 16px;
}
html.pro body h1 {
  font: 700 28px/1.15 var(--fs);
  letter-spacing: -0.028em;
  color: var(--tx);
  margin: 8px 0 16px;
}
html.pro body h2 {
  font: 600 12px/1.3 var(--fs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mut);
  margin: 32px 4px 8px;
}
html.pro body h3 {
  font-weight: 650;
  letter-spacing: -0.015em;
}
html.pro body b,
html.pro body strong {
  font-weight: 620;
}
html.pro .sm {
  font-size: 13px;
  line-height: 1.5;
}
html.pro .mut {
  color: var(--mut);
}
html.pro .big {
  font-family: var(--fs) !important;
  font-weight: 700 !important;
  letter-spacing: -0.035em !important;
  text-shadow: none !important;
  font-variant-numeric: tabular-nums;
}
html.pro .g {
  color: var(--g);
}
html.pro .r {
  color: var(--r);
}
/* ---------- cards ---------- */
html.pro body .card {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding:24px;
  margin: 12px 0;
  box-shadow: var(--sh1);
  transition:
    border-color 0.2s var(--ease),
    box-shadow 0.25s var(--ease),
    transform 0.25s var(--ease),
    background-color 0.2s;
}
html.pro body .card:has(> [data-a]:only-child),
html.pro body button.card:hover,
html.pro body a.card:hover {
  box-shadow: var(--sh2);
}
html.pro body .kv {
  gap: 8px;
}
html.pro body .kv > .card {
  padding:24px;
  border-radius: 8px;
}
html.pro body .hero {
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--ac) 9%, var(--card)) 0%,
    var(--card) 55%
  );
  box-shadow: var(--sh2);
  padding: 24px 20px;
}
html.pro .hero2 .h2art {
  opacity: 0.22;
  filter: grayscale(0.35) saturate(0.8);
}
html.pro .h2k {
  background: color-mix(in srgb, var(--card2) 92%, transparent);
  border-radius: 8px;
  border-color: var(--bd);
}
html.pro .h2pct {
  background: var(--card2);
  border-color: var(--bd2);
}
/* ---------- botões ---------- */
html.pro body .btn {
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 8px;
  font: 600 15px/1.2 var(--fs);
  letter-spacing: -0.01em;
  background: var(--ac);
  color: #ffffff;
  border: 1px solid color-mix(in srgb, var(--ac) 70%, #000000);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.18) inset,
    0 1px 2px rgba(0,0,0,0.18);
  transition:
    transform 0.18s var(--ease),
    box-shadow 0.2s var(--ease),
    filter 0.2s,
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}
html.pro body .btn:not(.s) {
  background-image: linear-gradient(
    180deg,
    rgba(255,255,255,0.1),
    rgba(255,255,255,0)
  );
}
html.pro body .btn.s {
  background: var(--card);
  color: var(--tx);
  border: 1px solid var(--bd2);
  box-shadow: var(--sh1);
  background-image: none;
}
html.pro body .btn.d:not(.s) {
  background: var(--r);
  border-color: color-mix(in srgb, var(--r) 70%, #000000);
}
@media (hover: hover) {
  html.pro body .btn:hover:not([disabled]) {
    transform: translateY(-1px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.18) inset,
      0 8px 20px -10px color-mix(in srgb, var(--ac) 70%, transparent);
    filter: brightness(1.05);
  }
  html.pro body .btn.s:hover:not([disabled]) {
    background: var(--card2);
    border-color: color-mix(in srgb, var(--tx) 22%, transparent);
    box-shadow: var(--sh2);
  }
  html.pro body .card:hover {
    border-color: var(--bd2);
  }
}
html.pro body .btn:active:not([disabled]) {
  transform: scale(0.98);
  filter: brightness(0.97);
}
html.pro body .btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
html.pro body .lnk {
  color: var(--ac);
  font-weight: 600;
  transition: opacity 0.2s;
}
html.pro body .lnk:hover {
  opacity: 0.75;
}
/* ---------- controles segmentados e chips ---------- */
html.pro body .seg {
  background: var(--card2);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}
html.pro body .seg > button {
  border-radius: 8px !important;
  color: var(--mut) !important;
  font-weight: 550;
  border: 1px solid transparent !important;
  box-shadow: none !important;
  transition:
    background-color 0.2s var(--ease),
    color 0.2s,
    box-shadow 0.2s;
}
html.pro body .seg > button:hover {
  color: var(--tx) !important;
}
html.pro body .seg > button.on {
  background: var(--card) !important;
  color: var(--tx) !important;
  border-color: var(--bd) !important;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.08),
    0 1px 0 rgba(255,255,255,0.04) inset !important;
  font-weight: 620;
}
html.pro body .chips2 > button {
  border-radius: 999px;
  border: 1px solid var(--bd2);
  background: var(--card);
  color: var(--tx);
  font-weight: 550;
  padding: 8px 16px;
  transition:
    background-color 0.2s var(--ease),
    border-color 0.2s,
    color 0.2s,
    transform 0.15s;
}
html.pro body .chips2 > button:hover {
  background: var(--card2);
}
html.pro body .chips2 > button:active {
  transform: scale(0.97);
}
html.pro body .chips2 > button.on {
  background: var(--ac2);
  border-color: color-mix(in srgb, var(--ac) 45%, transparent);
  color: var(--ac);
}
html.pro body .chip {
  border-radius: 999px;
  border: 1px solid var(--bd2);
  background: var(--card);
  font-weight: 550;
  padding: 4px 12px;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}
/* ---------- campos ---------- */
html.pro
  body
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not(
    [type="file"]
  ),
html.pro body select,
html.pro body textarea {
  min-height: 46px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  background: var(--card);
  color: var(--tx);
  font: 500 15px/1.35 var(--fs);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04) inset;
  transition:
    border-color 0.2s var(--ease),
    box-shadow 0.2s var(--ease),
    background-color 0.2s;
}
html.pro body textarea {
  min-height: 92px;
}
html.pro body input:not([type="checkbox"]):not([type="radio"]):hover,
html.pro body select:hover,
html.pro body textarea:hover {
  border-color: color-mix(in srgb, var(--tx) 22%, transparent);
}
html.pro body input:focus,
html.pro body select:focus,
html.pro body textarea:focus {
  outline: none;
  border-color: var(--ac) !important;
  box-shadow: var(--ring) !important;
}
html.pro body label {
  font-size: 13px;
  font-weight: 550;
  color: var(--mut);
  letter-spacing: -0.003em;
}
html.pro body label > input,
html.pro body label > select,
html.pro body label > textarea {
  margin-top: 8px;
}
html.pro body input[type="checkbox"] {
  accent-color: var(--ac);
  width: 18px;
  height: 18px;
}
html.pro body ::placeholder {
  color: color-mix(in srgb, var(--mut) 75%, transparent);
}
html.pro body :focus-visible {
  outline: none;
  box-shadow: var(--ring) !important;
  border-radius: 8px;
}
html.pro body select {
  -webkit-appearance: none;
  appearance: none;
  padding-right: 40px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%238b8e98' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 12px 8px;
}
html.pro body h2,
html.pro body .card h2 {
  color: var(--mut) !important;
  letter-spacing: 0.08em !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}
html.pro body .seg:has([data-cor]) {
  flex-wrap: wrap;
}
html.pro body .seg:has([data-cor]) > button {
  flex: 1 1 40%;
}
html.pro body .duoun-bt .btn {
  background: rgba(255,255,255,0.16) !important;
  border: 1px solid rgba(255,255,255,0.3) !important;
  color: #ffffff !important;
  box-shadow: none !important;
  min-height: 40px;
  padding: 8px 8px;
  background-image: none !important;
}
/* ---------- avisos, tabelas e listas ---------- */
html.pro body .warn {
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--am) 32%, transparent);
  background: color-mix(in srgb, var(--am) 9%, var(--card));
  color: var(--tx);
  padding: 12px 16px;
  line-height: 1.5;
}
html.pro body table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}
html.pro body th {
  font: 600 12px/1.3 var(--fs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mut);
  padding: 8px 8px;
  border-bottom: 1px solid var(--bd);
  text-align: left;
}
html.pro body td {
  padding: 12px 8px;
  border-bottom: 1px solid var(--bd);
}
html.pro body tr:last-child td {
  border-bottom: 0;
}
html.pro body details > summary {
  transition: color 0.2s;
}
html.pro body hr {
  border: 0;
  border-top: 1px solid var(--bd);
}
/* ---------- barra de cotações e navegação ---------- */
html.pro #tape {
  background: color-mix(in srgb, var(--card) 82%, transparent) !important;
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  border-bottom: 1px solid var(--bd) !important;
  box-shadow: none !important;
}
html.pro #tape .mq {
  font-family: var(--fs) !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.005em;
}
html.pro #bnav {
  background: color-mix(in srgb, var(--card) 78%, transparent) !important;
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
  border-top: 1px solid var(--bd) !important;
  box-shadow: 0 -10px 30px -20px rgba(0,0,0,0.35) !important;
}
html.pro #bnav button {
  transition:
    color 0.2s var(--ease),
    transform 0.15s var(--ease);
}
html.pro #bnav button:active {
  transform: scale(0.94);
}
html.pro #bnav button.on {
  color: var(--ac) !important;
}
html.pro #bnav button.on svg {
  filter: none;
}
html.pro #bnav .mais span.bx {
  background: var(--grad) !important;
  box-shadow:
    0 10px 24px -10px var(--glow),
    0 1px 0 rgba(255,255,255,0.25) inset !important;
  border-radius: 8px !important;
}
html.pro #mbtn svg {
  color: var(--tx);
}
html.pro .brand116 b {
  letter-spacing: -0.02em;
}
/* ---------- micro-interações ---------- */
html.pro a,
html.pro button,
html.pro summary,
html.pro [data-a],
html.pro .entema,
html.pro .duono,
html.pro .jrtli {
  -webkit-tap-highlight-color: transparent;
}
html.pro #app {
  animation: proIn 0.32s var(--ease) both;
}
@keyframes proIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
html.pro #app > .card,
html.pro #app > section > .card {
  animation: proCard 0.38s var(--ease) both;
}
html.pro #app > .card:nth-of-type(2) {
  animation-delay: 0.03s;
}
html.pro #app > .card:nth-of-type(3) {
  animation-delay: 0.06s;
}
html.pro #app > .card:nth-of-type(4) {
  animation-delay: 0.09s;
}
@keyframes proCard {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
html.pro #toast,
html.pro .toast {
  border-radius: 8px !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 18px 40px -16px rgba(0,0,0,0.45) !important;
  border: 1px solid var(--bd) !important;
}
html.pro .enbar,
html.pro .enbar i,
html.pro .estbar i {
  transition: width 0.5s var(--ease);
}
@media (prefers-reduced-motion: reduce) {
  html.pro *,
  html.pro *::before,
  html.pro *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
/* ---------- telas maiores ---------- */
@media (min-width: 980px) {
  html.pro body.pc #app {
    padding-left: 32px;
    padding-right: 32px;
  }
  html.pro body h1 {
    font-size: 32px;
  }
}
`,
          "legacy-101": `/* tokens de acabamento */
html.pro:root[data-theme="dark"],
html.pro:root:not([data-theme]) {
  --mut: #9ca3af;
  --bd: rgba(255,255,255,0.08);
  --bd2: rgba(255,255,255,0.12);
  --tile: rgba(255,255,255,0.025);
  --win-bg: rgba(58,173,116,0.12);
  --win-tx: #5fca94;
  --loss-bg: rgba(231,97,76,0.12);
  --loss-tx: #ed8b7c;
  --open-bg: rgba(194,148,62,0.12);
  --open-tx: #c9a156;
  --be-bg: rgba(255,255,255,0.06);
  --be-tx: #d3d5d9;
}
@media (prefers-color-scheme: light) {
  html.pro:root:not([data-theme]) {
    --mut: #60656f;
    --bd: rgba(24,25,27,0.08);
    --bd2: rgba(24,25,27,0.13);
    --tile: #efeeeb;
    --win-bg: rgba(46,139,93,0.1);
    --win-tx: #404349;
    --loss-bg: rgba(220,62,38,0.09);
    --loss-tx: #b9311c;
    --open-bg: rgba(169,129,54,0.1);
    --open-tx: #906d2d;
    --be-bg: rgba(24,25,27,0.05);
    --be-tx: #393c41;
  }
}
html.pro:root[data-theme="light"] {
  --mut: #60656f;
  --bd: rgba(24,25,27,0.08);
  --bd2: rgba(24,25,27,0.13);
  --tile: #efeeeb;
  --win-bg: rgba(46,139,93,0.1);
  --win-tx: #404349;
  --loss-bg: rgba(220,62,38,0.09);
  --loss-tx: #b9311c;
  --open-bg: rgba(169,129,54,0.1);
  --open-tx: #906d2d;
  --be-bg: rgba(24,25,27,0.05);
  --be-tx: #393c41;
}
html.pro {
  --r-box: 16px;
  --r-tile: 12px;
  --r-sm: 8px;
  --pad: 20px;
}

/* 1) uma só família, sem serifa em lugar nenhum (inclusive no Jornal do Pregão) */
html.pro body,
html.pro body *:not(svg):not(svg *) {
  font-family: var(--fs) !important;
}
html.pro .jrtit,
html.pro .jrsec h3,
html.pro .jvo h4,
html.pro .jvp h4,
html.pro .jrhoje-c b,
html.pro [class^="jr"] h2 {
  letter-spacing: -0.02em !important;
  font-weight: 700 !important;
}
html.pro .mut,
html.pro .sm.mut,
html.pro small {
  opacity: 1;
}
html.pro .mut,
html.pro small.mut,
html.pro .sm.mut {
  color: var(--mut) !important;
}

/* 2) raios: 16 nos containers, 12 em blocos internos e campos, 8 em botões pequenos, pílula em badges e chips */
html.pro body .card,
html.pro body .hero,
html.pro body .warn,
html.pro body details.card,
html.pro .jrsec,
html.pro .jrcard,
html.pro .enl,
html.pro .enfim,
html.pro .duotop,
html.pro .duoun-h,
html.pro .cqals,
html.pro .gc,
html.pro #gateov .gc {
  border-radius: var(--r-box) !important;
}
html.pro body .kv > .card,
html.pro .h2k,
html.pro .jrind,
html.pro .jrkp3 > div,
html.pro .jrkp4 > div,
html.pro .jrtc,
html.pro .jrcc,
html.pro .jvoc,
html.pro .jvobs,
html.pro .jvon,
html.pro .jrpre,
html.pro .jrhoje-c,
html.pro .estprox,
html.pro .crsai-c,
html.pro .duopar,
html.pro .seg,
html.pro body input:not([type="checkbox"]):not([type="radio"]),
html.pro body select,
html.pro body textarea,
html.pro body .btn:not(.s) {
  border-radius: var(--r-tile) !important;
}
html.pro body .btn.s,
html.pro body .seg > button,
html.pro .duosem span,
html.pro .jrniv > div,
html.pro .estheat i {
  border-radius: var(--r-sm) !important;
}
html.pro body .chip,
html.pro body .bdg,
html.pro .jrtag,
html.pro .mdtag,
html.pro .chips2 > button,
html.pro .tag,
html.pro .h2pct,
html.pro .jvobs-t,
html.pro .duobal {
  border-radius: 999px !important;
}

/* 3) bordas ultrafinas: sem faixas grossas coloridas */
html.pro .jrind,
html.pro .jrkp3 > div,
html.pro .jrkp4 > div,
html.pro .jrhoje-c,
html.pro .jrpre,
html.pro .jvon,
html.pro .crsai,
html.pro .estprox,
html.pro .mesarit {
  border-width: 1px !important;
  border-style: solid !important;
  border-color: var(--bd) !important;
}
html.pro .jrhoje-c.up,
html.pro .jrkp4 > .up {
  background: color-mix(in srgb, var(--g) 7%, var(--tile)) !important;
}
html.pro .jrhoje-c.dn,
html.pro .jrkp4 > .dn {
  background: color-mix(in srgb, var(--r) 7%, var(--tile)) !important;
}
html.pro .jrhoje-c.eq {
  background: color-mix(in srgb, var(--am) 7%, var(--tile)) !important;
}
html.pro .jrsec {
  border-top: 1px solid var(--bd) !important;
}
html.pro hr,
html.pro .jrsec h3 {
  border-color: var(--bd) !important;
}

/* 4) cards de mercado: mesmo tamanho, mesmo padding, fundo sutil */
html.pro .jrinds {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px !important;
  overflow: visible !important;
  border-bottom: 0 !important;
  padding: 0 !important;
  margin: 0 0 4px !important;
}
html.pro .jrind {
  min-width: 0 !important;
  min-height: 78px;
  display: flex !important;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  padding: 12px 16px !important;
  background: var(--tile) !important;
}
html.pro .jrind small {
  font-size: 12px !important;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--mut) !important;
}
html.pro .jrind b {
  font-size: 18px !important;
  font-weight: 650 !important;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
html.pro .jrind i {
  font-size: 12px !important;
  font-weight: 600 !important;
}
html.pro .h2ks {
  gap: 8px !important;
}
html.pro .h2k {
  padding: 12px 16px !important;
  background: var(--tile) !important;
  border: 1px solid var(--bd) !important;
  min-height: 84px;
  justify-content: space-between;
}
html.pro .jrkp3,
html.pro .jrkp4 {
  gap: 8px !important;
}
html.pro .jrkp3 > div,
html.pro .jrkp4 > div {
  padding: 12px 16px !important;
  background: var(--tile) !important;
}
html.pro body .kv > .card {
  background: var(--tile) !important;
  padding:24px!important;
}

/* 4b) badges de status unificados: WIN, LOSS, ABERTA, 0x0 */
html.pro body .bdg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 8px !important;
  font: 700 12px/1.2 var(--fs) !important;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border: 0 !important;
  box-shadow: none !important;
}
html.pro body .bdg.w {
  background: var(--win-bg) !important;
  color: var(--win-tx) !important;
}
html.pro body .bdg.l {
  background: var(--loss-bg) !important;
  color: var(--loss-tx) !important;
}
html.pro body .bdg.op {
  background: var(--open-bg) !important;
  color: var(--open-tx) !important;
}
html.pro body .bdg.be {
  background: var(--be-bg) !important;
  color: var(--be-tx) !important;
}
html.pro .tc-sd {
  font-weight: 600 !important;
  border: 0 !important;
  padding: 4px 8px !important;
}
html.pro .jrtag {
  border: 0 !important;
  padding: 4px 8px !important;
  font-weight: 650 !important;
  letter-spacing: 0.04em;
}
html.pro .jrtag.up {
  background: var(--win-bg) !important;
  color: var(--win-tx) !important;
}
html.pro .jrtag.dn {
  background: var(--loss-bg) !important;
  color: var(--loss-tx) !important;
}
html.pro .jrtag.eq {
  background: var(--be-bg) !important;
  color: var(--be-tx) !important;
}
html.pro .tic16 {
  border-radius: var(--r-tile) !important;
  box-shadow: none !important;
}

/* 5) respiro */
html.pro body .card {
  padding: var(--pad) !important;
}
html.pro body .hero {
  padding: 24px var(--pad) !important;
}
html.pro body .card > .top {
  gap: 12px;
  margin-bottom: 8px;
}
html.pro body .card .card {
  padding:24px!important;
}
html.pro .jrsec {
  padding-top: 24px !important;
  margin-top: 24px !important;
}
html.pro body .g2,
html.pro body .g3 {
  gap: 12px !important;
}
html.pro body label:not([class]) {
  display: block;
  margin-bottom: 12px;
}
html.pro body .chips2 {
  gap: 8px !important;
}
html.pro body .warn {
  padding: 16px 16px !important;
}

/* 6) navegação de baixo, botão + e botões flutuantes sem atropelar o conteúdo */
html.pro #app {
  padding-bottom: calc(132px + env(safe-area-inset-bottom, 0px)) !important;
}
html.pro #bnav {
  height: auto !important;
  min-height: 66px;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px)) !important;
  align-items: center;
}
html.pro #bnav button {
  font-size: 12px !important;
  font-weight: 600 !important;
  gap: 4px !important;
}
html.pro #bnav .mais span.bx {
  width: 52px !important;
  height: 52px !important;
  border-radius: 8px !important;
  transform: translateY(-12px);
  outline: 5px solid var(--bg);
  box-shadow:
    0 12px 26px -12px var(--glow),
    0 1px 0 rgba(255,255,255,0.25) inset !important;
}
html.pro #bnav .mais:active span.bx {
  transform: translateY(-12px) scale(0.95);
}
html.pro #privb,
html.pro #btop {
  background: color-mix(in srgb, var(--card) 80%, transparent) !important;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--bd2) !important;
  box-shadow: 0 10px 24px -14px rgba(0,0,0,0.5) !important;
  border-radius: 999px !important;
}
html.pro #privb {
  bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important;
  right: 16px !important;
}
html.pro #tst {
  border-radius: 999px !important;
}

html.pro .seclb {
  color: var(--mut) !important;
  letter-spacing: 0.08em !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}
html.pro .pscmp,
html.pro .duobal,
html.pro .duopar {
  border-width: 1px !important;
}
html.pro .jrcab {
  border-top: 1px solid var(--bd) !important;
  border-bottom: 1px solid var(--bd) !important;
  box-shadow: none !important;
}
html.pro .jrcab::before,
html.pro .jrcab::after {
  border-width: 1px !important;
  border-color: var(--bd) !important;
  background: var(--bd) !important;
  height: 1px !important;
}
html.pro body #app .jrsec h3,
html.pro body #app .jrsec .jrh3b,
html.pro body #app .jrsec h3::before {
  background: none !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 0 16px !important;
  color: var(--tx) !important;
  font: 700 13px/1.3 var(--fs) !important;
  letter-spacing: 0.07em !important;
  text-transform: uppercase;
}
html.pro .jrind small {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  line-height: 1.25;
}
`,
          "legacy-102": `html.pro:root[data-theme="dark"],
html.pro:root:not([data-theme]) {
  --mut2: #d3d5d9;
}
@media (prefers-color-scheme: light) {
  html.pro:root:not([data-theme]) {
    --mut2: #393c41;
  }
}
html.pro:root[data-theme="light"] {
  --mut2: #393c41;
}
html.pro body .jrcab {
  text-align: left !important;
  border-top: 0 !important;
  border-bottom: 1px solid var(--bd) !important;
  padding: 4px 0 16px !important;
  margin-bottom: 16px !important;
}
html.pro body .jrcab::before,
html.pro body .jrcab::after {
  display: none !important;
}
html.pro body .jrnome {
  justify-content: flex-start !important;
  font: 750 28px/1.1 var(--fs) !important;
  letter-spacing: -0.03em !important;
  color: var(--tx) !important;
}
html.pro body .jrnome small,
html.pro body .jrcab small {
  color: var(--mut) !important;
  font: 600 12px/1.3 var(--fs) !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase;
  opacity: 1 !important;
}
html.pro body .jrdata {
  color: var(--mut2) !important;
  font: 500 13px/1.4 var(--fs) !important;
  letter-spacing: 0.01em !important;
  text-transform: none !important;
  margin-top: 8px !important;
  opacity: 1 !important;
}
html.pro body .jrdata .cap1 {
  color: var(--mut2) !important;
}
html.pro body .jrhbar,
html.pro body .jrbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px !important;
  margin: 4px 0 16px !important;
  padding: 0 !important;
  border: 0 !important;
}
html.pro body .jrhbar .btn,
html.pro body .jrbar .btn {
  min-height: 40px !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}
html.pro body .jrsec {
  padding-top: 24px !important;
}
html.pro body .jrsec p,
html.pro body .jrtxt {
  line-height: 1.65 !important;
  color: var(--tx);
}
html.pro body .jrchap,
html.pro body .jred {
  letter-spacing: 0.06em !important;
  font-weight: 650 !important;
}
html.pro body .jrtit {
  font: 750 22px/1.25 var(--fs) !important;
  letter-spacing: -0.025em !important;
}
html.pro body .jrsec .sm.mut,
html.pro body .jrsec small {
  color: var(--mut) !important;
}
html.pro body .jrcard {
  padding:24px!important;
}

html.pro body .jrcab .jrtag2 {
  text-align: left !important;
  color: var(--mut) !important;
  font: 600 12px/1.3 var(--fs) !important;
  letter-spacing: 0.1em !important;
  margin-top: 8px !important;
  opacity: 1 !important;
}
html.pro .jrind small {
  display: -webkit-box !important;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden !important;
  min-height: 2.6em;
}
html.pro .jrind {
  justify-content: flex-start !important;
}
`,
          "legacy-103": `/* acento verde (o verde fica para foco, seleção e ação principal) */
html.pro:root[data-theme="dark"],
html.pro:root:not([data-theme]) {
  --ac: #ad853a;
  --ac-tx: #caa45f;
  --on-ac: #0a0a0b;
  --ac2: rgba(173,133,58,0.16);
  --glow: rgba(173,133,58,0.28);
  --grad: linear-gradient(135deg, #ac8439, #ad853a);
  --ring: 0 0 0 3px rgba(173,133,58,0.28);
  --field: #16171b;
  --fbd: rgba(255,255,255,0.08);
  --fbd2: rgba(255,255,255,0.14);
}
@media (prefers-color-scheme: light) {
  html.pro:root:not([data-theme]) {
    --ac: #ac8439;
    --ac-tx: #35383d;
    --on-ac: #ffffff;
    --ac2: rgba(172,132,57,0.1);
    --glow: rgba(172,132,57,0.22);
    --grad: linear-gradient(135deg, #35383d, #ac8439);
    --ring: 0 0 0 3px rgba(172,132,57,0.22);
    --field: #f8f8f7;
    --fbd: rgba(24,25,27,0.08);
    --fbd2: rgba(24,25,27,0.16);
  }
}
html.pro:root[data-theme="light"] {
  --ac: #ac8439;
  --ac-tx: #35383d;
  --on-ac: #ffffff;
  --ac2: rgba(172,132,57,0.1);
  --glow: rgba(172,132,57,0.22);
  --grad: linear-gradient(135deg, #35383d, #ac8439);
  --ring: 0 0 0 3px rgba(172,132,57,0.22);
  --field: #f8f8f7;
  --fbd: rgba(24,25,27,0.08);
  --fbd2: rgba(24,25,27,0.16);
}
html.pro body .btn:not(.s):not(.d) {
  color: var(--on-ac) !important;
  border-color: transparent !important;
}
html.pro body .lnk,
html.pro body a {
  color: var(--ac-tx);
}
/* 1) campos: fundo levemente mais claro, borda ultrafina, verde só no foco */
html.pro
  body
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not(
    [type="file"]
  ),
html.pro body select,
html.pro body textarea {
  background-color: var(--field) !important;
  border: 1px solid var(--fbd) !important;
  box-shadow: none !important;
}
html.pro body input:not([type="checkbox"]):not([type="radio"]):hover,
html.pro body select:hover,
html.pro body textarea:hover {
  border-color: var(--fbd2) !important;
}
html.pro body input:focus,
html.pro body select:focus,
html.pro body textarea:focus {
  border-color: var(--ac) !important;
  box-shadow: var(--ring) !important;
  background-color: var(--card) !important;
}
html.pro body .card {
  border-color: var(--fbd) !important;
}
/* 3) controles segmentados: uma barra única; a opção ativa ganha um bloco verde suave */
html.pro body .seg,
html.pro body .hub2 {
  display: flex;
  background: var(--field) !important;
  border: 1px solid var(--fbd) !important;
  border-radius: 8px !important;
  padding: 4px !important;
  gap: 4px !important;
  overflow-x: auto;
  scrollbar-width: none;
}
html.pro body .hub2::-webkit-scrollbar {
  display: none;
}
html.pro body .seg > button,
html.pro body .hub2 > button {
  flex: 1 0 auto;
  border: 0 !important;
  background: transparent !important;
  color: var(--mut) !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  font: 600 14px/1.2 var(--fs) !important;
  box-shadow: none !important;
  white-space: nowrap;
  transition:
    background-color 0.2s var(--ease),
    color 0.2s;
}
html.pro body .seg > button:hover,
html.pro body .hub2 > button:hover {
  color: var(--tx) !important;
}
html.pro body .seg > button.on,
html.pro body .hub2 > button.on {
  background: var(--ac2) !important;
  color: var(--ac-tx) !important;
  border: 0 !important;
}
html.pro body .hmsw {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
html.pro body .hmsw > button {
  padding: 8px 4px !important;
  font-size: 13px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
html.pro body .hmsw > button small {
  font-size: 12px !important;
  color: inherit !important;
  opacity: 0.8;
  margin: 0 !important;
  font-weight: 600;
}
html.pro body .chips2 > button.on {
  background: var(--ac2) !important;
  color: var(--ac-tx) !important;
  border-color: transparent !important;
}
/* 2) carteira de opções: números grandes, legendas cinza, blocos iguais */
html.pro body .opg,
html.pro body .rrdg {
  gap: 8px !important;
  margin: 8px 0 !important;
}
html.pro body .opg > div,
html.pro body .rrdg > div {
  background: var(--tile) !important;
  border: 1px solid var(--fbd) !important;
  border-radius: 8px !important;
  padding: 16px !important;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
html.pro body .opg small,
html.pro body .rrdg small {
  font-size: 12px !important;
  font-weight: 600;
  color: var(--mut) !important;
  letter-spacing: 0.06em;
}
html.pro body .opg b,
html.pro body .rrdg b {
  font-size: 22px !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em;
  font-family: var(--fs) !important;
}
html.pro body .opg i,
html.pro body .rrdg i {
  font-size: 12px !important;
  color: var(--mut) !important;
  line-height: 1.35 !important;
}
html.pro body .opgt td,
html.pro body .opgt th {
  border-bottom: 1px solid var(--fbd) !important;
  padding: 8px 8px !important;
}
html.pro body .card .card {
  background: var(--tile) !important;
}
/* 4) mentor: banner de aviso suave, sem caixa escura */
html.pro body .mt-card {
  border: 1px solid var(--fbd) !important;
}
html.pro body .mt-card:has(.mt-st.am) {
  background: rgba(194,148,62,0.08) !important;
  border-color: rgba(194,148,62,0.28) !important;
}
html.pro body .mt-card:has(.mt-st.r) {
  background: rgba(231,97,76,0.08) !important;
  border-color: rgba(231,97,76,0.28) !important;
}
html.pro body .mt-card:has(.mt-st.g) {
  background: rgba(58,173,116,0.07) !important;
  border-color: rgba(58,173,116,0.24) !important;
}
html.pro body .mt-card .card,
html.pro body .mt-card .kv > .card {
  background: color-mix(in srgb, var(--card) 70%, transparent) !important;
}
html.pro body .mt-st {
  font-size: 18px !important;
}
html.pro body .warn {
  background: rgba(194,148,62,0.08) !important;
  border: 1px solid rgba(194,148,62,0.28) !important;
}
/* valor grande nunca quebra entre o sinal e o número */
html.pro body .big,
html.pro body .mono {
  white-space: nowrap;
}
html.pro .hero2 .h2c {
  max-width: 100% !important;
}
`,
          "legacy-104": `@media (prefers-reduced-motion: reduce) {
  html.pro #tape .tr,
  html #tape .tr {
    animation-duration: var(--d, 60s) !important;
    animation-iteration-count: infinite !important;
    animation-play-state: running !important;
  }
}
html.pro #tape .tr {
  animation-play-state: running;
}
`,
          "legacy-105": `.shrperb {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}
.shrperb svg {
  width: 17px;
  height: 17px;
}
`,
          "legacy-106": `.iudb {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--bd);
}
.iudb h4 {
  margin: 12px 0 4px;
  font-size: 14px;
}
.iudb table {
  font-size: 13px;
}
.iudal {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(194,148,62,0.08);
  border: 1px solid rgba(194,148,62,0.25);
  font-size: 14px;
  line-height: 1.5;
}
`,
          "legacy-107": `.e2 .card {
  margin: 0 0 12px;
}
.e2row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.e2fc {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.e2libs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.e2lib {
  display: flex;
  gap: 12px;
  text-align: left;
  width: 100%;
  cursor: pointer;
  margin: 0 !important;
  align-items: stretch;
  color: var(--tx);
}
.e2lib > i {
  flex: none;
  width: 6px;
  border-radius: 6px;
  background: var(--bc);
}
.e2lib > span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.e2lib b {
  font-size: 16px;
  line-height: 1.25;
}
.e2lib small {
  color: var(--mut);
  font-size: 12px;
}
.e2lib em {
  display: block;
  height: 6px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
  margin: 8px 0 4px;
}
.e2lib em span {
  display: block;
  height: 100%;
  background: var(--bc);
  border-radius: 6px;
}
.e2back {
  font-size: 14px;
  padding: 0;
}
.e2cap {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-top: 1px solid var(--bd);
  padding: 12px 0;
  color: var(--tx);
  cursor: pointer;
}
.e2cap:first-child {
  border-top: 0;
}
.e2cap > span:nth-child(2) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.e2cap small {
  color: var(--mut);
  font-size: 12px;
}
.e2n {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  background: var(--card2);
  color: var(--mut);
}
.e2n.ok {
  background: var(--win-bg, rgba(58,173,116,0.14));
  color: var(--g);
}
.e2ul {
  margin: 8px 0 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.5;
}
.e2dica {
  background: rgba(194,148,62,0.07) !important;
  border-color: rgba(194,148,62,0.28) !important;
}
.e2f {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
  font-size: 14px;
  background: var(--card2);
  border-radius: 6px;
  padding: 8px 8px;
  margin-top: 8px;
  overflow-x: auto;
  white-space: nowrap;
}
.e2det {
  border-top: 1px solid var(--bd);
  padding: 8px 0;
}
.e2det:first-of-type {
  border-top: 0;
}
.e2det summary {
  cursor: pointer;
  font-weight: 600;
  line-height: 1.4;
}
.e2det > div {
  margin-top: 8px;
  color: var(--mut);
  line-height: 1.5;
}
.e2nav {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 4px 0 12px;
}
.e2nav .btn {
  max-width: 48%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.e2top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0 8px;
}
.e2pb {
  height: 6px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
  margin-bottom: 12px;
}
.e2pb i {
  display: block;
  height: 100%;
  background: var(--g);
  transition: width 0.3s;
}
.e2card {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}
.e2q {
  font-size: 20px;
  font-weight: 650;
  line-height: 1.4;
}
.e2a {
  font-size: 16px;
  line-height: 1.5;
  border-top: 1px solid var(--bd);
  padding-top: 12px;
  color: var(--g);
}
.e2g3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.e2err {
  color: var(--r) !important;
}
.e2sims {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.e2sim {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--tile, var(--card2));
  color: var(--tx);
  cursor: pointer;
  text-align: left;
}
.e2sim small {
  color: var(--mut);
  font-size: 12px;
}
.e2sim em {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}
.e2h {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  font-size: 14px;
}
.e2h:first-of-type {
  border-top: 0;
}
.e2qc {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.e2qt {
  font-size: 16px;
  line-height: 1.55;
}
.e2imgw {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 8px;
}
.e2imgw .e2img {
  min-width: 620px;
}
.e2img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid var(--bd);
}
.e2ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.e2op {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--bd2, var(--bd));
  background: var(--field, var(--card2));
  color: var(--tx);
  font-size: 15px;
  line-height: 1.45;
  cursor: pointer;
}
.e2op b {
  flex: none;
  color: var(--mut);
}
.e2op.sel {
  border-color: var(--ac, var(--g));
  background: var(--ac2, rgba(173,133,58,0.12));
}
.e2op.ok {
  border-color: var(--g);
  background: rgba(58,173,116,0.12);
}
.e2op.ok b {
  color: var(--g);
}
.e2op.err {
  border-color: var(--r);
  background: rgba(231,97,76,0.1);
}
.e2op.err b {
  color: var(--r);
}
.e2op:disabled {
  cursor: default;
  opacity: 1;
}
.e2fb {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-radius: 8px;
}
.e2fb.ok {
  background: rgba(58,173,116,0.12);
  color: var(--g);
}
.e2fb.err {
  background: rgba(231,97,76,0.1);
  color: var(--r);
}
.e2fb .lnk {
  font-size: 14px;
}
.e2grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.e2grid button {
  height: 40px;
  border-radius: 6px;
  border: 1px solid var(--bd);
  background: var(--card2);
  color: var(--mut);
  font-size: 13px;
  font-weight: 600;
}
.e2grid button.r {
  background: var(--ac2, rgba(199,55,32,0.14));
  color: var(--tx);
}
.e2grid button.cur {
  outline: 2px solid var(--ac, var(--g));
}
.e2res {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 24px !important;
}
.e2rv {
  padding: 8px 8px;
  border-radius: 6px;
  margin-top: 4px;
  font-size: 14px;
}
.e2rv.ok {
  background: rgba(58,173,116,0.12);
  color: var(--g);
}
.e2rv.err {
  background: rgba(231,97,76,0.1);
  color: var(--r);
}
`,
          "legacy-108": `.e2pay {
  width: 100%;
  height: auto;
  color: var(--tx);
  display: block;
}
.e2leg {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--mut);
  margin: 4px 0 8px;
}
.e2leg i {
  display: inline-block;
  width: 12px;
  height: 3px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
.e2k4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.e2k4 > div,
.e2k3 > div {
  background: var(--tile, var(--card2));
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.e2k4 small,
.e2k3 small {
  font-size: 12px;
  color: var(--mut);
  font-weight: 600;
  letter-spacing: 0.03em;
}
.e2k4 b {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.e2k3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.e2k3 span {
  font-size: 13px;
  line-height: 1.35;
}
@media (max-width: 420px) {
  .e2k4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .e2k3 {
    grid-template-columns: 1fr;
  }
}
.e2els {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
}
.e2el {
  display: flex;
  gap: 8px;
  align-items: center;
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--bd);
  background: var(--card);
  color: var(--tx);
  cursor: pointer;
}
.e2el > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.e2el small {
  color: var(--mut);
  font-size: 12px;
}
.e2elg {
  flex: none;
  color: var(--tx);
  opacity: 0.9;
}
.e2par summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  list-style: none;
}
.e2par summary::-webkit-details-marker {
  display: none;
}
.e2par[open] summary {
  margin-bottom: 8px;
}
.e2 p {
  line-height: 1.55;
  margin: 4px 0 8px;
}
.e2tb {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}
.e2tb td,
.e2tb th {
  padding: 8px 8px;
  border-bottom: 1px solid var(--bd);
  text-align: right;
}
.e2tb td:first-child,
.e2tb th:first-child {
  text-align: left;
  color: var(--mut);
}
.e2exp {
  border: 1px solid var(--bd);
  background: var(--tile, var(--card2));
  border-radius: 8px;
  padding: 12px 16px;
}
.e2exp p {
  margin: 8px 0;
}
.e2expb {
  align-self: flex-start;
}
.e2plan .e2pl {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
}
.e2plan .e2pl:first-of-type {
  border-top: 0;
}
.e2pld {
  flex: none;
  width: 62px;
  font-size: 12px;
  font-weight: 700;
  color: var(--mut);
  padding-top: 4px;
}
.e2pl > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.e2pl small {
  font-size: 13px;
  font-weight: 600;
}
.e2evo {
  width: 100%;
  height: auto;
  margin-top: 8px;
}
.e2opc {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
`,
          "legacy-109": `#app .top:has(> .shrperb) {
  flex-wrap: wrap;
  row-gap: 8px;
  align-items: center;
}
#app .top:has(> .shrperb) > h1 {
  flex: 1 0 auto;
  white-space: nowrap;
  min-width: 0;
  margin-right: auto;
}
#app .top:has(> .shrperb) > .hlp {
  order: 0;
}
@media (max-width: 520px) {
  #app .top:has(> .shrperb) > h1 {
    flex: 1 0 calc(100% - 52px);
  }
  #app .top:has(> .shrperb) > .shrperb,
  #app .top:has(> .shrperb) > .btn:not(.s) {
    flex: 1 1 0;
    justify-content: center;
  }
}
`,
          "legacy-110": `.e2atalho {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 12px;
}
.e2atalho .e2row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
/* alvos de toque: dias do calendário e lista de ativos do Forex */
#app [data-a="cday"] {
  min-height: 38px;
  min-width: 34px;
  aspect-ratio: auto !important;
}
#app :not(.mc):not(.cal):has(> [data-a="cday"]) {
  overflow-x: auto;
  scrollbar-width: none;
  grid-template-columns: repeat(14, minmax(34px, 1fr)) !important;
  padding-bottom: 4px;
}
#app :not(.mc):not(.cal):has(> [data-a="cday"])::-webkit-scrollbar {
  display: none;
}
#app .top[data-a="axo"] {
  min-height: 44px;
  align-items: center;
  padding: 8px 0;
}
#app [data-a="axo"] .sm {
  white-space: nowrap;
}
.lim188 {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.45;
  padding: 8px 8px;
  border-radius: 8px;
  background: var(--tile, var(--card2));
  border: 1px solid var(--bd);
}
#net188 {
  position: fixed;
  left: 12px;
  right: 12px;
  top: calc(8px + env(safe-area-inset-top, 0px));
  z-index: 9998;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  background: #771e10;
  color: #ffffff;
  box-shadow: 0 8px 24px -10px rgba(0,0,0,0.5);
}
`,
          "legacy-111": `body.trmon {
  background: #000000 !important;
}
body.trmon #app {
  max-width: none !important;
  padding: 8px 8px 112px !important;
}
body.trmon #tape {
  display: none;
}
.trm {
  --a: #c2933d;
  --g: #3aad74;
  --r: #e7614c;
  color: #e5e5e5;
  font:
    13px/1.35 ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    "Liberation Mono",
    monospace !important;
  background: #000000;
}
.trm * {
  font-family: inherit !important;
}
.trbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  background: #111111;
  border: 1px solid #333333;
  padding: 8px;
  border-radius: 6px;
  position: sticky;
  top: 0;
  z-index: 20;
}
.trlogo {
  font-weight: 800;
  color: #000000;
  background: var(--a);
  padding: 4px 8px;
  border-radius: 3px;
  letter-spacing: 0.06em;
}
.trlogo b {
  margin-left: 4px;
}
.trcmdw {
  flex: 1 1 260px;
  display: flex;
  position: relative;
  min-width: 0;
}
.trcmd {
  flex: 1;
  min-width: 0;
  background: #000000 !important;
  color: var(--a) !important;
  border: 1px solid #444444 !important;
  border-radius: 6px 0 0 4px !important;
  padding: 8px 8px !important;
  font-size: 15px !important;
  text-transform: uppercase;
  box-shadow: none !important;
}
.trgo {
  background: var(--a);
  color: #000000;
  border: 0;
  border-radius: 0 4px 4px 0;
  padding: 0 16px;
  font-weight: 800;
  cursor: pointer;
}
.trsug {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  background: #111111;
  border: 1px solid #444444;
  z-index: 30;
  max-height: 320px;
  overflow: auto;
}
.trsug button {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  color: #dddddd;
  padding: 8px 8px;
  cursor: pointer;
}
.trsug button:hover {
  background: #222222;
}
.trsug b {
  color: var(--a);
  margin-right: 8px;
}
.trlay,
.trin {
  background: #000000 !important;
  color: #eeeeee !important;
  border: 1px solid #444444 !important;
  border-radius: 6px !important;
  padding: 8px 8px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  min-height: 0 !important;
}
.trbtn {
  background: #1a1a1a;
  color: #eeeeee;
  border: 1px solid #444444;
  border-radius: 6px;
  padding: 8px 8px;
  cursor: pointer;
  font-weight: 700;
}
.trbtn.on {
  background: var(--a);
  color: #000000;
  border-color: var(--a);
}
.trtabs {
  display: flex;
  gap: 4px;
  margin: 8px 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.trtabs button {
  flex: 1 0 auto;
  background: #111111;
  color: #bbbbbb;
  border: 1px solid #333333;
  border-radius: 6px;
  padding: 8px 8px;
  font-weight: 700;
}
.trtabs button.on {
  background: var(--a);
  color: #000000;
}
.trgrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 8px;
}
.trgrid.pc {
  display: block;
  position: relative;
  min-height: 300px;
}
.trgrid.pc .trp {
  position: absolute;
}
.trgrid:not(.pc) .trp {
  height: calc(100vh - 230px);
  min-height: 420px;
}
.trgrid.pc .trp.maxi {
  left: 3px !important;
  top: 3px !important;
  width: calc(100% - 6px) !important;
  height: calc(100vh - 150px) !important;
  z-index: 9 !important;
}
.trph[data-trdrag] {
  cursor: move;
  user-select: none;
  touch-action: none;
}
.trp.arrastando {
  opacity: 0.85;
  box-shadow:
    0 0 0 1px #c2933d,
    0 10px 30px rgba(0,0,0,0.6);
}
.trabas {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
  min-width: 0;
}
.trabas::-webkit-scrollbar {
  display: none;
}
.trab {
  display: inline-flex;
  align-items: center;
  background: #0c0c0c;
  border: 1px solid #2a2a2a;
  border-radius: 3px 3px 0 0;
}
.trab button {
  background: none;
  border: 0;
  color: #999999;
  font-size: 12px;
  padding: 1px 8px;
  cursor: pointer;
  white-space: nowrap;
}
.trab i {
  font-style: normal;
  color: #666666;
  cursor: pointer;
  padding: 0 4px 0 0;
}
.trab.on {
  background: #241b0b;
  border-color: #695021;
}
.trab.on button {
  color: #c2933d;
  font-weight: 700;
}
.trmx {
  color: #c2933d !important;
  border-color: var(--ds-line-2) !important;
}
.trgrid:not(.pc) .trp.maxi {
  position: fixed !important;
  inset: 0 !important;
  z-index: 1000 !important;
  height: 100vh !important;
  height: 100dvh !important;
  border-radius: 0;
}
.trgrid:not(.pc) .trp.maxi .trpb {
  padding-bottom: 40px;
}
body.trpop #mdr2,
body.trpop #bnav,
body.trpop #fab,
body.trpop #fabm,
body.trpop #privb,
body.trpop #sh,
body.trpop #btop,
body.trpop #ptr {
  display: none !important;
}
body.trpop {
  padding: 0 !important;
}
body.trpop #app {
  margin: 0 !important;
  max-width: none !important;
  padding: 4px !important;
  width: auto !important;
}
@media (min-width: 980px) {
  body.trmon #mdr2 {
    display: none !important;
  }
  body.trmon.trmenu #mdr2 {
    display: block !important;
    z-index: 1200;
    box-shadow: 12px 0 40px rgba(0,0,0,0.6);
  }
  body.trmon #app {
    margin-left: 0 !important;
  }
  body.trmon #bnav {
    display: none !important;
  }
}
body.trmon #tapeSp {
  display: none !important;
}
.trmenub {
  display: inline-flex;
  align-items: center;
}
.trmenub {
  font-size: 16px;
  line-height: 1;
  padding: 8px 8px !important;
}
.trrs {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  touch-action: none;
  background: linear-gradient(
    135deg,
    transparent 50%,
    #555555 50%,
    #555555 60%,
    transparent 60%,
    transparent 70%,
    #555555 70%,
    #555555 80%,
    transparent 80%
  );
}
.trp {
  position: relative;
}
.trsrc {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 0 4px;
  border-radius: 2px;
  line-height: 15px;
  letter-spacing: 0;
}
.trsrc.rt {
  background: #151619;
  color: #caa45f;
}
.trsrc.dl {
  background: #241b0b;
  color: #c9a156;
}
.trsrc.st {
  background: #312610;
  color: #cfab68;
}
.trsrc.fl {
  background: #3f140d;
  color: #f4b7ad;
}
.trtape {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 8px 4px 0;
  white-space: nowrap;
}
.trtape::-webkit-scrollbar {
  display: none;
}
.trtape > span {
  display: inline-flex;
  gap: 8px;
  align-items: baseline;
  cursor: pointer;
}
.trtape b {
  color: #ffffff;
}
.trtape em {
  font-style: normal;
  color: #888888;
  font-size: 12px;
}
.trp {
  background: #050505;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.trp.foco {
  border-color: var(--a);
}
.trp.oculto {
  display: none;
}
.trph {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #141414;
  border-bottom: 1px solid #2a2a2a;
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
}
.trph > b {
  color: #000000;
  background: var(--a);
  padding: 0 4px;
  border-radius: 2px;
}
.trpc {
  color: var(--a);
  font-weight: 700;
}
.trpd {
  color: #888888;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.trx {
  background: none;
  border: 1px solid #333333;
  color: #aaaaaa;
  border-radius: 3px;
  padding: 1px 8px;
  cursor: pointer;
  font-size: 12px;
}
.trpb {
  overflow: auto;
  padding: 8px;
  flex: 1;
  min-height: 0;
}
.trgrid:not(.pc) .trpb {
  max-height: none;
}
.trt {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.trt th {
  color: var(--a);
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid #333333;
  padding: 4px 4px;
  position: sticky;
  top: -6px;
  background: #050505;
}
.trt td {
  padding: 4px 4px;
  border-bottom: 1px solid #161616;
  white-space: nowrap;
}
.trt tr[data-trgo] {
  cursor: pointer;
}
.trt tr[data-trgo]:hover td {
  background: #141414;
}
.trt .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.trt th:not(:first-child) {
  text-align: right;
}
.tk {
  color: #ffffff;
  font-weight: 700;
}
.trt tr.eu td {
  background: #1e1709;
}
.trt tr.atm td {
  background: #141008;
}
.trt tr.trmed td {
  color: var(--a);
  border-top: 1px solid #444444;
}
.trt tr.imp td {
  color: #ffffff;
}
.trt tr.trdia td {
  color: var(--a);
  padding-top: 8px;
  text-transform: capitalize;
}
.tg {
  color: var(--g) !important;
}
.tr {
  color: var(--r) !important;
}
.am {
  color: var(--a) !important;
}
.mut {
  color: #777777 !important;
}
.big {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}
.fup {
  animation: trup 1s;
}
.fdn {
  animation: trdn 1s;
}
@keyframes trup {
  0% {
    background: #2c2e33;
  }
  100% {
    background: transparent;
  }
}
@keyframes trdn {
  0% {
    background: #7f2a1d;
  }
  100% {
    background: transparent;
  }
}
.trsec {
  color: var(--a);
  font-weight: 700;
  margin: 8px 0 4px;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.06em;
}
.trfont,
.trnote {
  color: #777777;
  font-size: 12px;
  margin: 8px 0;
}
.trnote {
  color: #aaaaaa;
}
.trerr {
  color: #f4b7ad;
  padding: 8px;
}
.trload {
  color: #888888;
  padding: 8px;
}
.trkv {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 8px 0;
}
.trkv span {
  color: #999999;
}
.trkv b {
  color: #ffffff;
}
.trah {
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.trsvg {
  width: 100%;
  height: auto;
  background: #000000;
  display: block;
}
.trrow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin: 4px 0;
}
.trrow label {
  color: #999999;
  display: flex;
  gap: 4px;
  align-items: center;
}
.trnews a {
  display: grid;
  grid-template-columns: 42px 110px 1fr;
  gap: 8px;
  padding: 4px 4px;
  border-bottom: 1px solid #161616;
  color: #dddddd;
  text-decoration: none;
}
.trnews a:hover {
  background: #111111;
}
.trnews a span:last-child {
  color: #e5e5e5;
}
@media (max-width: 600px) {
  .trnews a {
    grid-template-columns: 42px 1fr;
  }
  .trnews a span:nth-child(2) {
    display: none;
  }
}
.trimap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.trimap button {
  flex-grow: 1;
  min-height: 40px;
  border: 0;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.trimap span {
  font-size: 12px;
}
.trpb2 {
  display: inline-flex;
  align-items: center;
  position: relative;
  min-width: 120px;
  height: 16px;
  background: #1a1a1a;
  margin: 1px 4px 1px 0;
  vertical-align: middle;
}
.trpb2 i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #5e481e;
}
.trpb2 em {
  position: relative;
  font-style: normal;
  font-size: 12px;
  padding: 0 4px;
  color: #ffffff;
}
.trvot {
  display: flex;
  height: 22px;
  margin: 8px 0;
  border-radius: 3px;
  overflow: hidden;
}
.trvot span {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
}
.trask p {
  margin: 8px 0;
  color: #dddddd;
  white-space: normal;
}
.trp1 {
  color: #bbbbbb;
  white-space: normal;
}
.trlk {
  background: none;
  border: 0;
  color: var(--a);
  text-decoration: underline;
  cursor: pointer;
  padding: 0 4px;
}
.trspk {
  color: var(--a);
}
@media (max-width: 600px) {
  .trlogo {
    display: none;
  }
  .trbar {
    gap: 4px !important;
    padding: 4px !important;
  }
  .trbar .trbtn {
    padding: 4px 8px;
    font-size: 12px;
  }
  body.trmon #app .trm select.trlay {
    flex: 1 1 120px !important;
    min-width: 0;
    font-size: 12px !important;
  }
  .trcmdw {
    flex-basis: 100% !important;
  }
  .trtape {
    gap: 12px;
    font-size: 12px;
  }
}
.trrod {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  color: #666666;
  font-size: 12px;
  margin-top: 8px;
}
.trrod i {
  font-style: normal;
}
@media (max-width: 979px) {
  .trrod span:first-child {
    display: none;
  }
}
.trabre {
  font-weight: 800 !important;
}
.trhome {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  text-align: left;
  margin: 8px 0;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #333333;
  background: #000000;
  color: #c2933d;
  cursor: pointer;
  font-family: ui-monospace, Menlo, monospace;
}
.trhome span {
  color: #bbbbbb;
  font-size: 13px;
}

body.trmon #app .trm,
body.trmon #app .trm *:not(svg):not(svg *) {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace !important;
  letter-spacing: 0;
}
body.trmon #app .trm input,
body.trmon #app .trm select {
  width: auto;
  margin: 0 !important;
  background: #000000 !important;
  color: #eeeeee !important;
  border: 1px solid #444444 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
  -webkit-appearance: none;
  appearance: none;
  min-height: 0 !important;
  height: auto !important;
  font-size: 13px !important;
  padding: 8px 8px !important;
}
body.trmon #app .trm input.trcmd {
  flex: 1;
  color: #c2933d !important;
  font-size: 15px !important;
  padding: 8px 8px !important;
  border-radius: 6px 0 0 4px !important;
  text-transform: uppercase;
}
body.trmon #app .trm input.trcmd::placeholder {
  color: #695021;
  text-transform: none;
}
body.trmon #app .trm select.trlay {
  padding-right: 24px !important;
  background: #000000
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23ffb000'/%3E%3C/svg%3E")
    no-repeat right 8px center !important;
  color: #c2933d !important;
  flex: 0 0 auto;
}
body.trmon #app .trm .trt td,
body.trmon #app .trm .trt th {
  padding: 4px 8px !important;
  height: auto !important;
  line-height: 1.35 !important;
  font-size: 13px !important;
}
body.trmon #app .trm .trt th {
  font-size: 11px !important;
}
body.trmon #app .trm button {
  min-height: 0;
  box-shadow: none;
}
body.trmon #app .trm .trtabs button {
  min-height: 40px;
}
`,
          "legacy-112": `.g9bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin: 4px 0 4px;
}
.g9b {
  background: #111111;
  border: 1px solid #333333;
  color: #bbbbbb;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  min-height: 24px;
}
.g9b.on {
  background: #c2933d;
  color: #000000;
  border-color: #c2933d;
  font-weight: 700;
}
.g9i.on {
  background: #241b0b;
  color: #c2933d;
  border-color: #695021;
}
.g9sep {
  width: 8px;
}
body.trmon #app .trm input.g9cmp {
  width: 130px;
  padding: 4px 8px !important;
  font-size: 12px !important;
}
.g9svg {
  display: block;
  width: 100%;
  height: auto;
  background: #000000;
  touch-action: pan-y;
}
.g9gr {
  stroke: #1d1d1d;
}
.g9gr2 {
  stroke: #333333;
  stroke-dasharray: 3 3;
}
.g9tx {
  fill: #8a8a8a;
  font-size: 12px;
}
.g9vu {
  fill: #ad853a;
  opacity: 0.28;
}
.g9vd {
  fill: #e7614c;
  opacity: 0.28;
}
.g9sub {
  fill: #050505;
  stroke: #1d1d1d;
}
.g9cx {
  stroke: #666666;
  stroke-dasharray: 2 2;
}
.g9leg {
  font-size: 12px;
  color: #bbbbbb;
  min-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.g9leg i {
  font-style: normal;
  margin-left: 8px;
}
.g9rod {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}
.g9rod b {
  color: #ffffff;
}
.g9ev {
  font-weight: 700;
}
.g9niv {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  background: #0d0d0d;
  border: 1px solid #222222;
  border-radius: 3px;
  padding: 1px 4px;
}
.g9niv em {
  font-style: normal;
}
.g9al {
  background: none;
  border: 0;
  cursor: pointer;
  padding: 0 4px;
  font-size: 12px;
}
.g9t {
  border-bottom: 1px solid #1a1a1a;
  padding: 4px 4px;
  cursor: pointer;
}
.g9t:hover {
  background: #0f0f0f;
}
.g9t.perto {
  border-left: 1px solid var(--ds-line-2);
  padding-left: 4px;
}
.g9t1 {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.g9t1 .trx {
  margin-left: auto;
}
.g9t2,
.g9t3 {
  font-size: 12px;
  color: #aaaaaa;
  margin-top: 4px;
}
.g9t2 em {
  font-style: normal;
}
.g9bar2 {
  display: block;
  height: 8px;
  background: #151515;
  position: relative;
}
.g9bar2 i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
}
.g9bar2 i.up {
  background: #2e8b5d;
}
.g9bar2 i.dn {
  background: #dc3e26;
}
.g9lk {
  cursor: pointer;
  margin-right: 8px;
  white-space: nowrap;
}
.g9lk em {
  font-style: normal;
}
.g9nw.pc {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 8px;
}
.g9n {
  display: grid;
  grid-template-columns: 42px 40px 1fr;
  gap: 4px 8px;
  padding: 4px 4px;
  border-bottom: 1px solid #161616;
  font-size: 13px;
}
.g9n a {
  color: #e5e5e5;
  text-decoration: none;
}
.g9n a:hover {
  color: #c2933d;
}
.g9n > span.am,
.g9n .g9imp {
  grid-column: 3;
}
.g9st {
  color: #c2933d;
  font-size: 12px;
  letter-spacing: -1px;
}
.g9st i {
  color: #333333;
  font-style: normal;
}
.g9imp {
  font-size: 12px;
  color: #86abcb;
}
.g9tlh {
  color: #c2933d;
  font-weight: 700;
  margin: 8px 0 4px;
  text-transform: capitalize;
  font-size: 12px;
}
.g9tl {
  border-left: 1px solid #444444;
  margin-left: 8px;
  padding-left: 8px;
}
.g9cal {
  border-left: 1px solid #222222;
  padding-left: 8px;
}
.g9ce {
  display: grid;
  grid-template-columns: auto 34px 1fr;
  gap: 0 8px;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #161616;
}
.g9ce b,
.g9ce em {
  grid-column: 3;
  font-style: normal;
}
.g9ce.foi {
  opacity: 0.75;
}
@media (max-width: 979px) {
  .g9cal {
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid #222222;
    margin-top: 8px;
  }
}
.g9mw.pc {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 8px;
}
.g9map {
  width: 100%;
  height: auto;
  display: block;
  background: #070708;
}
.g9map path {
  stroke: #000000;
  stroke-width: 0.4;
}
.g9pm {
  cursor: pointer;
}
.g9pm:hover {
  stroke: #c2933d;
  stroke-width: 1.2;
}
.g9map path.sel {
  stroke: #c2933d;
  stroke-width: 1.6;
}
.g9tiles {
  display: grid;
  grid-template-columns: repeat(21, 1fr);
  gap: 4px;
}
.g9tiles button {
  aspect-ratio: 1;
  border: 0;
  color: #ffffff;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  min-height: 0;
}
.g9tiles button em {
  font-style: normal;
  font-size: 12px;
}
.g9tiles button.sel {
  outline: 1px solid #c2933d;
}
.g9leg2 {
  font-size: 12px;
  color: #888888;
  margin: 4px 0;
}
.g9leg2 i {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 4px 0 8px;
  vertical-align: middle;
}
.g9pais .trkv span {
  display: block;
}
.g9fx {
  margin-top: 8px;
}
.g9fxl {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.g9fxl span {
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  min-width: 76px;
  font-size: 12px;
  cursor: default;
}
.g9fxl span[data-g9g] {
  cursor: pointer;
}
.g9fxl b {
  color: #ffffff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.g9fxl em {
  font-style: normal;
  color: #ffffff;
}
.g9ia p {
  white-space: normal;
  color: #dddddd;
  margin: 4px 0;
}
.g9iah {
  border-bottom: 1px solid #333333;
  padding-bottom: 4px;
  margin-bottom: 4px;
}
.g9iah b {
  color: #c2933d;
}
.g9tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  padding: 0 4px;
  border-radius: 2px;
  letter-spacing: 0.04em;
  vertical-align: 1px;
}
.g9tag.ok {
  background: #151619;
  color: #5fca94;
}
.g9tag.in {
  background: #241b0b;
  color: #c9a156;
}
.g9tag.ce {
  background: #1d1e21;
  color: #86abcb;
}
.g9li {
  padding: 4px 0;
  border-bottom: 1px solid #141414;
  white-space: normal;
  font-size: 13px;
}
.g9li[data-g9g] {
  cursor: pointer;
}
.g9li em {
  font-style: normal;
}
.g9iab {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin: 8px 0;
  padding: 8px;
  border: 1px dashed #444444;
}
.g9iab .mut {
  font-size: 12px;
  white-space: normal;
}
.g9cen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}
.g9cc {
  border: 1px solid #2a2a2a;
  padding: 8px;
  font-size: 12px;
  white-space: normal;
}
.g9cc p {
  margin: 4px 0;
}
.g9dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: 0;
}
.g9dot.vd {
  background: #ad853a;
}
.g9dot.am {
  background: #c2943e;
}
.g9dot.vm {
  background: #e7614c;
}
.g9dot.cz {
  background: #555555;
}
.g9cards {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.g9card {
  border: 1px solid #1f1f1f;
  background: #080808;
  padding: 8px 8px;
  border-radius: 3px;
  font-size: 12px;
  white-space: normal;
}
.g9c1 {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.g9c2 {
  color: #888888;
  font-size: 12px;
  margin-top: 4px;
}
.g9c3 {
  color: #aaaaaa;
  font-size: 12px;
  margin-top: 4px;
}
.g9ca {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: center;
}
.g9ca .g9c3 {
  flex-basis: 100%;
}
.g9fh {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
body.trmon #app .trm .g9fh input {
  width: 160px;
  padding: 4px 8px !important;
}
.g9sep2 {
  display: inline-block;
  width: 30px;
}
.g9log {
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #121212;
  white-space: normal;
}
.g9log .num {
  margin-right: 8px;
}
`,
          "legacy-113": `.trvolta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: #000000;
  border: 1px solid #333333;
  border-radius: 6px;
  padding: 8px;
  margin: 0 0 8px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
.trvolta .trv1 {
  background: #c2933d;
  color: #000000;
  border: 0;
  border-radius: 6px;
  padding: 8px 8px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
}
#app .trvolta input.trv2 {
  flex: 1 1 160px;
  width: auto;
  margin: 0 !important;
  background: #000000 !important;
  color: #c2933d !important;
  border: 1px solid #444444 !important;
  border-radius: 6px !important;
  padding: 8px 8px !important;
  font-family: inherit;
  text-transform: uppercase;
  box-shadow: none !important;
}
#app .trvolta input.trv2::placeholder {
  color: #695021;
}
.trmerc {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1 1 100%;
  padding-top: 4px;
}
.trmerc::-webkit-scrollbar {
  display: none;
}
.trmerc button {
  flex: 0 0 auto;
  background: #111111;
  color: #dddddd;
  border: 1px solid #333333;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  cursor: pointer;
  white-space: nowrap;
}
.trmerc button:hover {
  border-color: #c2933d;
  color: #c2933d;
}
.trm .trmerc {
  margin-top: 8px;
}
`,
          "legacy-114": `.dqcats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px 0 8px;
}
.dqcat {
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
}
.dqcat.o {
  color: #caa45f;
  border-color: #2c2e33;
}
.dqcat.a {
  color: #c9a156;
  border-color: #771e10;
}
.dqcat.e {
  color: #ed8b7c;
  border-color: #7f2a1d;
}
.dqtag {
  border: 1px solid #444444;
  border-radius: 3px;
  padding: 0 4px;
  font-size: 12px;
}
.dqbar {
  display: inline-block;
  width: 90px;
  height: 8px;
  background: #1a1a1a;
  vertical-align: middle;
}
.dqbar i {
  display: block;
  height: 100%;
}
.dqih {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin: 8px 0 4px;
  border-top: 1px solid #222222;
  padding-top: 8px;
}
.dqih b {
  color: #c2933d;
  margin-right: 8px;
}
.evt {
  border-bottom: 1px solid #1a1a1a;
  padding: 8px 4px;
}
.evt1 {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.evt1 b {
  flex: 1;
  color: #ffffff;
  white-space: normal;
}
.evti {
  font-size: 14px;
}
.evt2 {
  font-size: 12px;
  margin-top: 4px;
  white-space: normal;
}
.evt3 {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.tmf label {
  display: flex;
  gap: 4px;
  align-items: center;
  color: #999999;
  font-size: 12px;
  margin-right: 8px;
}
.tmtit {
  color: #c2933d;
  font-weight: 700;
  margin: 8px 0;
  text-transform: capitalize;
}
.tmcols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.alcf {
  border: 1px dashed #444444;
  padding: 8px;
  margin-bottom: 8px;
}
.alcc {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin: 4px 0;
  font-size: 12px;
  color: #bbbbbb;
}
.alci {
  border: 1px solid #1f1f1f;
  background: #080808;
  padding: 8px;
  margin: 4px 0;
}
.alci.off {
  opacity: 0.5;
}
.alcst {
  display: inline-block;
  margin-right: 4px;
}
.alcst.s {
  color: #caa45f;
}
.alcst.n {
  color: #888888;
}
.audpre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #050505;
  border: 1px solid #222222;
  padding: 8px;
  font-size: 12px;
  max-height: 320px;
  overflow: auto;
  color: #cfcfcf;
}
.trsa {
  border-left: 1px solid var(--ds-line-2) !important;
}
.trsa em {
  color: #777777;
  font-style: normal;
  font-size: 12px;
}
`,
          "legacy-115": `.trinst {
  border-color: var(--ds-line-2) !important;
  color: #c2933d !important;
}
`,
          "legacy-116": `.dch {
  margin: 4px 0 8px;
}
.dch b {
  color: #c2933d;
  letter-spacing: 0.06em;
}
.dcts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
.dct {
  background: #0b0b0b;
  border: 1px solid #222222;
  border-radius: 6px;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
}
.dct span {
  color: #888888;
  font-size: 12px;
  letter-spacing: 0.05em;
}
.dct b {
  font-size: 28px;
  line-height: 1.2;
  color: #ffffff;
}
.dct em {
  font-style: normal;
  color: #777777;
  font-size: 12px;
}
.dcpush {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: #999999;
  font-size: 12px;
  margin-left: 8px;
}
body.trmon #app .trm input[type="checkbox"] {
  -webkit-appearance: checkbox !important;
  appearance: auto !important;
  width: 15px !important;
  height: 15px !important;
  padding: 0 !important;
  accent-color: #c2933d;
  background: none !important;
}
.dcbadge {
  background: #3f140d !important;
  color: #f4b7ad !important;
  border-color: #7f2a1d !important;
}
`,
          "legacy-117": `.pano9l {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 4px 0;
  font-size: 14px;
  flex-wrap: wrap;
}
.pano9l input[type="checkbox"] {
  width: auto;
  margin: 0;
}
.pano9b {
  margin-top: 8px;
}
.pano9f {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.pano9c {
  margin-top: 8px;
}
body.trmon #app .trm .pano9l input:not([type="checkbox"]) {
  width: auto !important;
}
`,
          "legacy-118": `.relreg {
  padding: 4px 8px;
  border: 1px solid #333333;
  border-radius: 3px;
  margin-right: 8px;
}
.hm9 {
  border-collapse: collapse;
  font-size: 12px;
  margin: 4px 0;
}
.hm9 th {
  color: #86abcb;
  font-weight: 600;
  padding: 4px 4px;
  white-space: nowrap;
}
.hm9 td {
  width: 46px;
  height: 28px;
  text-align: center;
  color: #ffffff;
  border: 1px solid #070708;
  font-variant-numeric: tabular-nums;
}
.vh9 {
  display: grid;
  grid-template-columns: 34px 1fr 54px 34px;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  margin: 4px 0;
}
.vh9 i {
  display: block;
  height: 9px;
  background: linear-gradient(90deg, #4a7eab, #86abcb);
  border-radius: 2px;
}
.vh9 em {
  font-style: normal;
  font-size: 12px;
}
.pq9b {
  color: #caa45f !important;
  font-weight: 700;
}
.sw9 {
  background: radial-gradient(
    1200px 500px at 70% -10%,
    #35373d 0,
    #131416 45%,
    #0c0d0e 100%
  );
  color: #efeeeb;
  border-radius: 8px;
  padding: 16px;
  margin: 0 0 12px;
  border: 1px solid #2c2e32;
  box-shadow: 0 20px 60px -30px rgba(88,139,184,0.5);
  font-family: Inter, system-ui, sans-serif;
}
.sw9hd {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.sw9brand {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, #ffffff, #86abcb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.sw9sub {
  color: #7ca4c7;
  font-size: 13px;
  margin-top: 4px;
}
.sw9tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sw9tabs button {
  background: rgba(78,82,90,0.25);
  border: 1px solid #4e525a;
  color: #86abcb;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}
.sw9tabs button.on {
  background: linear-gradient(180deg, #588bb8, #4a7eab);
  color: #ffffff;
  border-color: #709bc2;
  box-shadow: 0 0 18px rgba(112,155,194,0.45);
}
.sw9ks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin: 16px 0;
}
.sw9k {
  background: rgba(28,29,32,0.75);
  border: 1px solid #2c2e32;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
}
.sw9k span {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #7ca4c7;
}
.sw9k b {
  font-size: 24px;
  color: #ffffff;
  font-weight: 700;
}
.sw9k b.tg {
  color: #caa45f;
}
.sw9k b.tr {
  color: #ed8b7c;
}
.sw9k b.am {
  color: #c9a156;
}
.sw9k em {
  font-style: normal;
  font-size: 12px;
  color: #86abcb;
}
.sw9s {
  width: 110px;
  height: 26px;
  margin-top: 4px;
}
.sw9grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.sw9grid > * {
  min-width: 0;
}
.sw9full {
  min-width: 0;
  overflow-x: auto;
}
.sw9c {
  background: rgba(23,25,27,0.78);
  border: 1px solid #2c2e32;
  border-radius: 8px;
  padding: 12px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sw9big {
  grid-column: span 2;
}
.sw9t {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #f2f1ef;
}
.sw9t span {
  font-weight: 400;
  letter-spacing: 0;
  color: #888d98;
  margin-left: 8px;
  font-size: 12px;
}
.sw9g {
  width: 100%;
  height: auto;
}
.sw9leg {
  font-size: 12px;
  color: #86abcb;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.sw9leg i {
  display: inline-block;
  width: 14px;
  height: 3px;
  border-radius: 2px;
}
.sw9gauge {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sw9bar {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    #dc3e26,
    #a98136 40%,
    #a3a3a3 50%,
    #ac8439 60%,
    #ac8439
  );
  position: relative;
  margin-top: 8px;
}
.sw9bar i {
  position: absolute;
  top: -5px;
  width: 22px;
  height: 22px;
  margin-left: -12px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 0 0 3px #070708,
    0 0 14px rgba(255,255,255,0.6);
}
.sw9gl {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #7ca4c7;
  letter-spacing: 0.08em;
}
.sw9gv {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}
.sw9r {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #282a2e;
  padding: 4px 0;
}
.sw9r b {
  font-size: 13px;
}
.sw9r em {
  font-style: normal;
  font-size: 12px;
  color: #86abcb;
}
.sw9r b.tg,
.sw9r span.tg {
  color: #caa45f;
}
.sw9r b.tr,
.sw9r span.tr {
  color: #ed8b7c;
}
.sw9r b.am {
  color: #c9a156;
}
.sw9h {
  display: grid;
  grid-template-columns: 32px 1fr 48px;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #86abcb;
}
.sw9h i {
  height: 8px;
  border-radius: 6px;
  background: linear-gradient(90deg, #4a7eab, #86abcb);
  display: block;
}
.sw9h b {
  color: #f2f1ef;
  font-weight: 600;
  text-align: right;
}
.sw9lk {
  align-self: flex-start;
  margin-top: auto;
  background: none;
  border: 0;
  color: #86abcb;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 0;
}
.sw9cb {
  background: rgba(78,82,90,0.25);
  border: 1px solid #4e525a;
  color: #e9e8e5;
  border-radius: 6px;
  padding: 8px 8px;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}
.sw9load {
  color: #888d98;
  font-size: 12px;
  padding: 8px 0;
}
.sw9ft {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  justify-content: space-between;
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #2c2e32;
  border-radius: 8px;
  color: #7ca4c7;
  font-size: 12px;
}
.sw9sec {
  grid-column: 1/-1;
  background: rgba(23,25,27,0.78);
  border: 1px solid #2c2e32;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-margin-top: 70px;
}
.sw9full {
  --bg: #17191b;
  --tx: #f2f1ef;
  --mut: #7ca4c7;
  --bd: #2c2e32;
  --card: #1c1d20;
  color: #efeeeb;
}
.sw9full .card {
  background: rgba(28,29,32,0.75) !important;
  border: 1px solid #2c2e32 !important;
  box-shadow: none !important;
  color: #efeeeb;
  border-radius: 8px;
}
.sw9full > .card:first-child {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
  margin: 0 0 8px;
}
.sw9full > .card:first-child > .top > b {
  display: none;
}
.sw9full .mut {
  color: #7ca4c7 !important;
}
.sw9full .btn {
  background: rgba(78,82,90,0.25) !important;
  border: 1px solid #4e525a !important;
  color: #e9e8e5 !important;
}
html body .sw9 .sw9full .seg {
  background: rgba(28,29,32,0.75) !important;
  border: 1px solid #2c2e32 !important;
}
html body .sw9 .sw9full .seg button {
  color: #86abcb !important;
  background: transparent !important;
  box-shadow: none !important;
}
html body .sw9 .sw9full .seg button.on {
  background: linear-gradient(180deg, #588bb8, #4a7eab) !important;
  color: #ffffff !important;
}
#sw9saz .card > .top > b {
  visibility: hidden;
}
.sw9full #sntbox {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.sw9full #sntbox .snt {
  margin-top: 0;
}
.sw9full .sz-t th {
  color: #7ca4c7;
  border-color: #2c2e32;
}
.sw9full .sz-t td {
  border-color: #282a2e;
}
.sw9full .sz-ib td {
  background: rgba(88,139,184,0.14);
}
.sw9full .sz-k {
  background: rgba(28,29,32,0.75) !important;
  border-color: #2c2e32 !important;
}
.sw9full .g {
  color: #5fca94;
}
.sw9full .r {
  color: #ed8b7c;
}
@media (max-width: 900px) {
  .sw9full #sntbox {
    grid-template-columns: minmax(0, 1fr);
  }
  html body .sw9 .sw9full .seg button {
    font-size: 12px !important;
    padding: 8px 4px !important;
  }
}
.sw9 .hm9 {
  width: 100%;
  table-layout: fixed;
  font-size: 12px;
}
.sw9 .hm9 td {
  width: auto;
  height: 30px;
}
.sw9 .hm9 th {
  padding: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}
.sw9cbs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.sw9w2 {
  grid-column: span 2;
}
@media (max-width: 900px) {
  .sw9w2 {
    grid-column: auto;
  }
  .sw9cbs {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 900px) {
  .sw9grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .sw9 {
    padding: 12px 8px;
  }
  .sw9big {
    grid-column: auto;
    grid-row: auto;
  }
  .sw9brand {
    font-size: 20px;
  }
}
`,
          "legacy-119": `.pf {
  --pb: #0b0c0d;
  --pc: #121315;
  --pc2: #17191b;
  --pd: #24262a;
  --pt: #edebe8;
  --pm: #8b93a1;
  --pa: #cfab69;
  --pg: #ad853a;
  --pr: #e7614c;
  --pbl: #709bc2;
  background: var(--pb);
  color: var(--pt);
  border-radius: 8px;
  padding: 16px;
  margin: 0 0 16px;
  font-family:
    Inter,
    Roboto,
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 14px;
  line-height: 1.45;
  border: 1px solid var(--pd);
}
.pf h1,
.pf h2,
.pf h3 {
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
}
.pf h1 {
  font-size: 28px;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--pt) !important;
}
.pf h2 {
  font-size: 20px;
  margin: 0 0 4px;
  color: var(--pt) !important;
}
.pf h3 {
  font-size: 15px;
  margin: 0;
  font-weight: 650;
  color: var(--pt) !important;
}
.pf h4 {
  font-size: 13px;
  margin: 12px 0 8px;
  color: var(--pm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pf h5 {
  font-size: 12px;
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pf p {
  margin: 4px 0;
}
.pfmut {
  color: var(--pm);
}
.pfsm {
  font-size: 13px;
}
.pfnota {
  font-size: 12px;
  color: var(--pm);
  margin-top: 8px;
}
.pf .up {
  color: var(--pg);
}
.pf .dn {
  color: var(--pr);
}
.pfhd {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}
.pftit {
  display: flex;
  gap: 12px;
  align-items: center;
}
.pftit p {
  color: var(--pm);
  margin: 0;
}
.pfico {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #c89e5133, #c89e5108);
  color: var(--pa);
  border: 1px solid var(--ds-line-2);
}
.pfacts {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.pfbt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--pc2);
  border: 1px solid var(--pd);
  color: var(--pt);
  border-radius: 8px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
  min-height: 36px;
}
.pfbt:hover {
  border-color: #383b41;
}
.pfbt[disabled] {
  opacity: 0.5;
  cursor: default;
}
.pfam {
  border-color: var(--ds-line-2);
  color: var(--pa);
  background: #c89e5112;
}
.pfmini {
  padding: 4px 8px;
  min-height: 28px;
  font-size: 12px;
  margin: 4px;
}
.pfw {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}
.pfrow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  align-items: center;
}
.pfks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.pfks6 {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}
.pfks6 .pfk b {
  white-space: normal;
  font-size: 16px;
}
.pfk {
  background: var(--pc);
  border: 1px solid var(--pd);
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 0;
}
.pfk span {
  display: block;
  font-size: 12px;
  color: var(--pm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pfk b {
  display: block;
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}
.pfk em {
  font-style: normal;
  font-size: 12px;
  color: var(--pm);
}
.pfk em.up {
  color: var(--pg);
}
.pfk em.dn {
  color: var(--pr);
}
.pftabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--pd);
  margin: 4px 0 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.pftabs button {
  display: flex;
  gap: 8px;
  align-items: center;
  background: none;
  border: 0;
  border-bottom: 1px solid transparent;
  color: var(--pm);
  padding: 8px 16px;
  font: inherit;
  font-weight: 550;
  cursor: pointer;
  white-space: nowrap;
}
.pftabs button.on {
  color: var(--pa);
  border-bottom-color: var(--pa);
}
.pfg {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}
.pfg3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.pfs2 {
  grid-column: span 2;
}
.pfc {
  background: var(--pc);
  border: 1px solid var(--pd);
  border-radius: 8px;
  padding: 16px;
  min-width: 0;
  margin-bottom: 12px;
}
.pfg > .pfc {
  margin-bottom: 0;
}
.pfc > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.pfchs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
}
.pfch {
  background: transparent;
  border: 1px solid var(--pd);
  color: var(--pm);
  border-radius: 6px;
  padding: 4px 8px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.pfch.on {
  border-color: var(--pa);
  color: var(--pa);
  background: #c89e5114;
}
.pfsvg {
  width: 100%;
  height: auto;
  display: block;
}
.pfgl {
  stroke: #242529;
  stroke-dasharray: 2 4;
}
.pfgt {
  fill: #7c8594;
  font-size: 12px;
}
.pfgtu {
  fill: #0b0c0d;
  font-weight: 700;
}
.pfleg {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--pm);
  margin-top: 4px;
}
.pfleg i {
  display: inline-block;
  width: 12px;
  height: 3px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
.pfvz {
  color: var(--pm);
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}
.pfdon {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.pfdsvg {
  width: 150px;
  height: 150px;
  flex: none;
}
.pfdc {
  fill: var(--pt);
  font-size: 18px;
  font-weight: 700;
}
.pfds {
  fill: var(--pm);
  font-size: 12px;
}
.pfdl {
  flex: 1;
  min-width: 150px;
}
.pfdl div {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  padding: 4px 0;
}
.pfdl i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
}
.pfdl span {
  flex: 1;
}
.pfdl b {
  font-variant-numeric: tabular-nums;
}
.pfbar {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) 2fr 72px;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  margin: 4px 0;
}
.pfbar i {
  height: 8px;
  background: #1d1f22;
  border-radius: 6px;
  overflow: hidden;
}
.pfbar i b {
  display: block;
  height: 100%;
  border-radius: 6px;
}
.pfbar em {
  font-style: normal;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.pfsep {
  height: 1px;
  background: var(--pd);
  margin: 8px 0;
}
.pfsep2 {
  flex: 1;
}
.pfmp {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.pfmp h4 {
  margin-top: 0;
  text-transform: none;
  letter-spacing: 0;
  font-size: 13px;
}
.pfmp h4.up {
  color: var(--pg);
}
.pfmp h4.dn {
  color: var(--pr);
}
.pfmp p,
.pflin {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #1d1f22;
  cursor: pointer;
  font-size: 13px;
  align-items: center;
}
.pflin em {
  font-style: normal;
  color: var(--pm);
  font-size: 12px;
}
.pflin b {
  font-variant-numeric: tabular-nums;
}
.pfal {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: start;
  padding: 8px 0;
  border-bottom: 1px solid #1d1f22;
  font-size: 13px;
}
.pfal p {
  margin: 0;
}
.pfal em {
  font-style: normal;
  color: var(--pm);
  font-size: 12px;
}
.pfrv {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.pfrv.r {
  background: #e7614c22;
  color: #f4b7ad;
}
.pfrv.a {
  background: #c89e5122;
  color: #d4b375;
}
.pfrv.b {
  background: #709bc222;
  color: #86abcb;
}
.pfst {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 650;
  white-space: nowrap;
}
.pfst.g {
  background: #3aad741f;
  color: #66cc99;
}
.pfst.r {
  background: #e7614c1f;
  color: #f4b7ad;
}
.pfst.b {
  background: #709bc21f;
  color: #86abcb;
}
.pfst.m {
  background: #ffffff10;
  color: var(--pm);
}
.pfia {
  border-color: var(--ds-line-2);
}
.pfiah {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.pfiat {
  font-weight: 600;
  margin: 8px 0;
}
.pfok {
  font-size: 13px;
  color: #dddad5;
}
.pfwa {
  font-size: 13px;
  color: #dfc79a;
}
.pflk {
  background: none;
  border: 0;
  color: var(--pa);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.pfsc {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.pfsc4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 8px 0;
}
.pfscd {
  background: var(--pc2);
  border: 1px solid var(--pd);
  border-radius: 8px;
  padding: 8px 12px;
}
.pfsch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.pfstk {
  display: flex;
  height: 9px;
  border-radius: 6px;
  overflow: hidden;
  background: #1d1f22;
  margin: 8px 0;
}
.pfstk i {
  display: block;
  height: 100%;
}
.pfstk i.g,
.pfscl i.g {
  background: #3aad74;
}
.pfstk i.b,
.pfscl i.b {
  background: #709bc2;
}
.pfstk i.r,
.pfscl i.r {
  background: #e7614c;
}
.pfstk i.m,
.pfscl i.m {
  background: #51555d;
}
.pfscl {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--pm);
}
.pfscl i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 4px;
}
.pftw {
  overflow-x: auto;
}
.pft {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.pft th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--pm);
  font-weight: 600;
  text-align: left;
  padding: 8px 8px;
  border-bottom: 1px solid var(--pd);
  white-space: nowrap;
}
.pft td {
  padding: 8px 8px;
  border-bottom: 1px solid #1b1d1f;
  vertical-align: middle;
}
.pft td em {
  display: block;
  font-style: normal;
  color: var(--pm);
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pft .n {
  text-align: right;
  white-space: nowrap;
}
.pft tr[data-pf] {
  cursor: pointer;
}
.pft tr[data-pf]:hover td {
  background: #ffffff05;
}
.pfnw {
  white-space: nowrap;
}
.pfcl {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
  color: color-mix(in srgb, var(--c) 80%, white);
  white-space: nowrap;
}
.pftd {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 6px;
  font-weight: 650;
}
.pftd.alta {
  background: #3aad741f;
  color: #66cc99;
}
.pftd.baixa {
  background: #e7614c1f;
  color: #f4b7ad;
}
.pftd.lateral,
.pftd.sem {
  background: #709bc21f;
  color: #86abcb;
}
.pfmv {
  font-size: 12px;
  font-weight: 650;
}
.pfmv.C {
  color: #d4b57d;
}
.pfmv.V {
  color: #f4b7ad;
}
.pfmv.P {
  color: #d4b375;
}
.pfmv.E {
  color: #dddad5;
}
.pfmv.A,
.pfmv.R {
  color: #86abcb;
}
.pfbar2 {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
}
.pfmsg {
  background: #c89e5112;
  border: 1px solid var(--ds-line-2);
  color: #dfc79a;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.pfmsg .pfx {
  margin-left: auto;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
}
.pfspin {
  width: 12px;
  height: 12px;
  border: 1px solid var(--ds-line-2);
  border-top-color: var(--pa);
  border-radius: 50%;
  display: inline-block;
  animation: pfsp 1s linear infinite;
}
@keyframes pfsp {
  to {
    transform: rotate(360deg);
  }
}
.pfmd {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 12px;
  overflow-y: auto;
}
.pfmb {
  position: relative;
  background: var(--pb);
  border: 1px solid var(--pd);
  border-radius: 8px;
  padding: 16px;
  width: min(1100px, 100%);
  color: var(--pt);
}
.pfmbs {
  width: min(560px, 100%);
}
.pfmx {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--pc2);
  border: 1px solid var(--pd);
  color: var(--pt);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.pfdh {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 40px 8px 0;
}
.pfdp {
  text-align: right;
}
.pfdp b {
  display: block;
  font-size: 24px;
}
.pfdp em {
  display: block;
  font-style: normal;
}
.pfkv {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 8px;
}
.pfkv span {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  background: var(--pc2);
  border: 1px solid var(--pd);
  border-radius: 6px;
  padding: 8px 8px;
  font-size: 13px;
  color: var(--pm);
}
.pfkv b {
  color: var(--pt);
}
.pfnt {
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid #1d1f22;
}
.pfnt a {
  color: var(--pt);
  text-decoration: none;
}
.pfnt a:hover {
  color: var(--pa);
}
.pfnt em {
  display: block;
  font-style: normal;
  color: var(--pm);
  font-size: 12px;
}
.pfform {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.pfform label,
.pfrc label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--pm);
}
.pf input,
.pf select {
  background: var(--pc2);
  border: 1px solid var(--pd);
  color: var(--pt);
  border-radius: 6px;
  padding: 8px 8px;
  font: inherit;
  font-size: 14px;
  min-height: 38px;
}
.pf input[type="checkbox"] {
  min-height: 0;
  width: 16px;
  height: 16px;
}
.pftg {
  display: flex !important;
  flex-direction: row !important;
  gap: 8px;
  align-items: center;
  color: var(--pt) !important;
  font-size: 13px !important;
  margin: 4px 0;
}
.pfrc {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
.pfrh {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
  margin-right: 40px;
}
.pfrs {
  border-top: 1px solid var(--pd);
  padding: 12px 0 4px;
}
.pfrs h4 {
  color: var(--pa);
  text-transform: none;
  letter-spacing: 0;
  font-size: 14px;
  margin: 0 0 8px;
}
.pfrs ul {
  margin: 0;
  padding-left: 16px;
}
.pfrs li {
  margin: 4px 0;
  font-size: 14px;
}
.pfsb {
  margin: 8px 0 8px;
  padding-left: 8px;
  border-left: 1px solid var(--pd);
}
.pfsb.pfF {
  border-color: #709bc2;
}
.pfsb.pfF h5,
.pfF {
  color: #86abcb;
}
.pfsb.pfI {
  border-color: var(--ds-line-2);
}
.pfsb.pfI h5,
.pfI {
  color: #d4b375;
}
.pfsb.pfH {
  border-color: #afa99d;
}
.pfsb.pfH h5,
.pfH {
  color: #dddad5;
}
.pftds {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--pm);
}
.pfha {
  font-size: 13px;
  margin: 4px 0;
}
.pfha em {
  color: var(--pm);
  font-style: normal;
}
.pfprob {
  color: #f4b7ad;
  font-size: 13px;
}
.pfmeta code {
  font-size: 12px;
  color: var(--pm);
}
.pftl .pfte {
  display: grid;
  grid-template-columns: 118px 1fr auto;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #1d1f22;
  align-items: start;
}
.pftd2 {
  font-size: 12px;
  color: var(--pm);
  font-variant-numeric: tabular-nums;
}
.pfte p {
  margin: 4px 0 0;
  color: #caccd1;
  font-size: 13px;
}
.pfte.rel b {
  color: var(--pa);
}
.pfte.al b {
  color: #f4b7ad;
}
.pfte.hip b {
  color: #dddad5;
}
.pfvazia {
  border-color: var(--ds-line-2);
}
@media (max-width: 1100px) {
  .pfsc4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 860px) {
  .pfg3 {
    grid-template-columns: minmax(0, 1fr);
  }
  .pfs2 {
    grid-column: auto;
  }
  .pfks,
  .pfks6 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pf {
    padding: 12px 8px;
    border-radius: 8px;
  }
  .pfform {
    grid-template-columns: 1fr;
  }
  .pfsc,
  .pfsc4 {
    grid-template-columns: minmax(0, 1fr);
  }
  .pftl .pfte {
    grid-template-columns: 1fr;
  }
  .pfmb {
    padding: 16px 12px;
  }
  .pfdh {
    margin-right: 44px;
  }
  .pf h1 {
    font-size: 22px;
  }
}
@media print {
  body.pfimp > *:not(#app) {
    display: none !important;
  }
  body.pfimp #app > *:not(.pf),
  body.pfimp .pf > *:not(.pfmd) {
    display: none !important;
  }
  body.pfimp .pfmd {
    position: static;
    background: #ffffff;
    padding: 0;
  }
  body.pfimp .pfmb {
    border: 0;
    background: #ffffff;
    color: #111111;
    width: 100%;
  }
  body.pfimp .pf {
    background: #ffffff;
    color: #111111;
    border: 0;
  }
  body.pfimp .pfmx,
  body.pfimp .pfrow {
    display: none;
  }
  body.pfimp .pfrs h4 {
    color: #7a5c26;
  }
  body.pfimp .pfsb li,
  body.pfimp .pfrs li {
    color: #111111;
  }
}

.pf .pftabs {
  display: flex !important;
  position: sticky;
  top: var(--pftop, 0px);
  z-index: 6;
  background: var(--pb);
  margin: 0 -16px 16px;
  padding: 0 16px;
  visibility: visible;
}
.pfvt {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--pb);
  margin: -16px -16px 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--pd);
  border-radius: 8px 8px 0 0;
}
.pfvt b {
  flex: 1;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pfvt .pfmx {
  position: static;
}
.pfmd {
  z-index: 2000;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
}
@media (max-width: 860px) {
  .pf .pfks {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 8px;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .pf .pfks::-webkit-scrollbar {
    display: none;
  }
  .pf .pfks .pfk {
    flex: 0 0 46%;
    scroll-snap-align: start;
    padding: 8px 8px;
  }
  .pf .pfks .pfk b {
    font-size: 16px;
  }
  .pf .pfks6 {
    display: grid;
    overflow: visible;
  }
  .pf .pfks6 .pfk {
    flex: none;
  }
  .pfhd {
    margin-bottom: 8px;
    gap: 8px;
  }
  .pfico {
    width: 38px;
    height: 38px;
  }
  .pftit p {
    font-size: 12px;
  }
  .pfacts {
    width: 100%;
    justify-content: flex-start;
  }
  .pfacts .pfsm {
    width: 100%;
  }
  .pfhl {
    display: none;
  }
  .pfbt {
    padding: 8px 8px;
  }
  .pf .pftabs {
    margin: 0 -8px 12px;
    padding: 0 8px;
    border-bottom: 1px solid var(--pd);
  }
  .pftabs button {
    padding: 8px 8px;
    font-size: 13px;
    gap: 4px;
  }
  .pfvt {
    margin: -16px -12px 12px;
  }
  .pfmd {
    padding-left: 8px;
    padding-right: 8px;
  }
}
`,
          "legacy-120": `#pcmenub {
  display: none;
}
@media (min-width: 980px) {
  html body.pc.pcfull #mdr2 {
    display: none !important;
  }
  html body.pc.pcfull.pcmenu #mdr2,
  html body.pc.pcfull.trmon.trmenu #mdr2 {
    display: block !important;
    z-index: 1200;
    box-shadow: 12px 0 40px rgba(0,0,0,0.45);
  }
  html body.pc.pcfull #tape {
    left: 0 !important;
    padding-left: 56px !important;
  }
  html body.pc.pcfull #app {
    margin: 0 !important;
    max-width: none !important;
    padding-left: clamp(20px, 2.4vw, 40px) !important;
    padding-right: clamp(20px, 2.4vw, 40px) !important;
  }
  html body.pc.pcfull:not(.trmon) #pcmenub {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 8px);
    left: 10px;
    z-index: 1250;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid var(--bd, #333333);
    background: var(--card, #111111);
    color: var(--tx, #eeeeee);
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.25);
  }
  html body.pc.pcfull.pcmenu #pcmenub {
    left: 292px;
  }
  html body.pc.pcfull #pcmenub:hover {
    border-color: var(--ac, #cfab69);
  }
}
`,
          "legacy-121": `#pdfov {
  position: fixed;
  inset: 0;
  z-index: 99999;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: #eeedeb;
  color: #111111;
}
#pdfov .pvbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 16px 8px;
  background: #ffffff;
  border-bottom: 1px solid #e1dfdb;
}
#pdfov .pvbar button {
  flex: 1;
  padding: 12px 8px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: 0;
  background: #3b3e43;
  color: #ffffff;
}
#pdfov .pvbar button.pvs {
  background: #f3f2f1;
  color: #111111;
  border: 1px solid #e1dfdb;
  flex: 0 0 auto;
}
#pdfov .pvbar button[disabled] {
  opacity: 0.6;
}
#pdfst {
  padding: 8px 16px 4px;
  min-height: 18px;
  font-size: 13px;
  color: #444455;
}
#pdfprev {
  padding: 8px 16px calc(32px + env(safe-area-inset-bottom, 0px));
}
`,
          "legacy-122": `.ckh {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ckp {
  background: var(--ac);
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.ckl {
  border-top: 1px solid var(--bd);
}
.cki {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 8px 4px;
  border-bottom: 1px solid var(--bd);
}
.cki i {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-weight: 800;
  font-size: 13px;
  color: #ffffff;
  margin-top: 1px;
}
.cki.ok i {
  background: #b88c3a;
}
.cki.no i {
  border: 1px solid #c9cdd3;
  background: transparent;
}
.cki.no b {
  opacity: 0.65;
}
.cki.nd i {
  background: #d3d5d9;
  color: #51555d;
}
.cki b {
  display: block;
  font-size: 14px;
}
.cki small {
  display: block;
  color: var(--mut);
  font-size: 12px;
  margin-top: 4px;
}
.cki.ok small {
  color: var(--g);
}
.cki.no small {
  color: var(--r);
}
.rtg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.rtg.two {
  grid-template-columns: 1fr 1fr;
  margin-top: 8px;
}
.rtg > div {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 8px;
}
.rtg small {
  display: block;
  color: var(--mut);
  font-size: 12px;
}
.rtg b {
  font-size: 15px;
}
.lg {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin: 0 4px 0 8px;
  vertical-align: -1px;
}
.lg.az {
  background: #36383e;
}
.lg.ou {
  background: #b88c3a;
  height: 3px;
  vertical-align: 2px;
}
`,
          "legacy-123": `.prg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.prs {
  position: relative;
  text-align: center;
}
.prs img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--bd);
  display: block;
}
.prs .x {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: #ffffff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  border: 0;
}
.prv {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/3;
  border: 1px dashed var(--bd);
  border-radius: 6px;
  font-size: 22px;
  color: var(--mut);
  cursor: pointer;
}
.prv span {
  font-size: 12px;
}
.prs small {
  display: block;
  color: var(--mut);
  font-size: 12px;
  margin-top: 4px;
}
`,
          "legacy-124": `:root {
  --bg: #0b0b0d;
  --card: #131416;
  --card2: #1a1b1e;
  --bd: rgba(255,255,255,0.08);
  --bd2: rgba(255,255,255,0.14);
  --tx: #edebe8;
  --mut: #90959f;
  --ac: #82a8c9;
  --ac2: rgba(130,168,201,0.14);
  --g: #339a67;
  --r: #e9715e;
  --am: #c89f52;
  --rad: 14px;
  --nav: 64px;
  --fs:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #f6f6f5;
    --card: #ffffff;
    --card2: #f4f3f1;
    --bd: rgba(24,25,27,0.09);
    --bd2: rgba(24,25,27,0.16);
    --tx: #17191b;
    --mut: #7a808c;
    --ac: #588bb8;
    --ac2: rgba(88,139,184,0.1);
    --g: #2e8a5c;
    --r: #e04e38;
    --am: #a37c33;
  }
}
:root[data-theme="light"] {
  --bg: #f6f6f5;
  --card: #ffffff;
  --card2: #f4f3f1;
  --bd: rgba(24,25,27,0.09);
  --bd2: rgba(24,25,27,0.16);
  --tx: #17191b;
  --mut: #7a808c;
  --ac: #588bb8;
  --ac2: rgba(88,139,184,0.1);
  --g: #2e8a5c;
  --r: #e04e38;
  --am: #a37c33;
}
:root[data-theme="dark"] {
  --bg: #0b0b0d;
  --card: #131416;
  --card2: #1a1b1e;
  --bd: rgba(255,255,255,0.08);
  --bd2: rgba(255,255,255,0.14);
  --tx: #edebe8;
  --mut: #90959f;
  --ac: #82a8c9;
  --ac2: rgba(130,168,201,0.14);
  --g: #339a67;
  --r: #e9715e;
  --am: #c89f52;
}
html body {
  background: var(--bg);
  color: var(--tx);
  font-family: var(--fs);
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.005em;
}
html body #app {
  max-width: 760px;
  margin: 0 auto;
  padding: 16px 16px calc(var(--nav) + 28px + env(safe-area-inset-bottom, 0px)) !important;
}
html body h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 8px 0 8px;
}
html body h2 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--mut);
  margin: 24px 0 8px;
}
html body h3 {
  font-size: 15px;
  font-weight: 650;
  margin: 16px 0 8px;
}
html body .sm {
  font-size: 13px;
}
html body .mut {
  color: var(--mut);
}
html body .g,
html body b.g,
html body .g b {
  color: var(--g);
}
html body .r,
html body b.r {
  color: var(--r);
}
html body .card {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: var(--rad);
  padding:24px;
  margin: 8px 0;
  box-shadow: none;
}
html body .card .card {
  background: var(--card2);
  border-color: transparent;
}
html body .top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
html body .row {
  display: flex;
  align-items: center;
  gap: 12px;
}
html body .fl {
  flex: 1;
  min-width: 0;
}
html body .rt {
  text-align: right;
  font-weight: 650;
  white-space: nowrap;
}
html body .th {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background: var(--card2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: none;
  color: var(--mut);
}
html body .th img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
html body .g2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
html body .g3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
html body .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--ac);
  color: #ffffff;
  font: 600 14px/1.2 var(--fs);
  cursor: pointer;
  transition:
    filter 0.15s,
    background 0.15s,
    transform 0.05s;
  -webkit-tap-highlight-color: transparent;
}
html body .btn:active {
  transform: scale(0.98);
}
html body .btn:disabled {
  opacity: 0.5;
}
html body .btn.s {
  background: var(--card2);
  color: var(--tx);
  border-color: var(--bd);
}
html body .btn.d {
  background: transparent;
  color: var(--r);
  border-color: color-mix(in srgb, var(--r) 45%, transparent);
}
html body .x {
  background: transparent;
  border: 0;
  color: var(--mut);
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
}
html body .seg {
  display: flex !important;
  gap: 4px;
  padding: 4px;
  background: var(--card2);
  border: 1px solid var(--bd);
  border-radius: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
html body .seg::-webkit-scrollbar {
  display: none;
}
html body .seg > button {
  flex: 1 0 auto;
  min-height: 40px;
  padding: 8px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--mut);
  font: 600 14px var(--fs);
  white-space: nowrap;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
html body .seg > button.on {
  background: var(--card);
  color: var(--tx);
  box-shadow:
    0 1px 2px rgba(0,0,0,0.25),
    0 0 0 1px var(--bd);
}
html body label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--mut);
  margin: 8px 0 0;
}
html
  body
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not(
    [type="file"]
  ),
html body select,
html body textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--bd2);
  background: var(--card2);
  color: var(--tx);
  font: 15px var(--fs);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
html body select {
  background-image:
    linear-gradient(45deg, transparent 50%, var(--mut) 50%),
    linear-gradient(135deg, var(--mut) 50%, transparent 50%);
  background-position:
    calc(100% - 17px) 55%,
    calc(100% - 12px) 55%;
  background-size: 5px 5px;
  background-repeat: no-repeat;
  padding-right: 32px;
}
html body input:focus,
html body select:focus,
html body textarea:focus {
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--ac2);
}
html body input[type="file"] {
  margin-top: 8px;
  font-size: 13px;
  color: var(--mut);
}
html body textarea {
  min-height: 84px;
  line-height: 1.45;
}
html body .ck {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--tx);
}
html body .kv {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}
html body .kv > .card {
  margin: 0;
  padding:24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--card);
  border: 1px solid var(--bd);
}
html body .kv > .card > span.mut:first-child {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
html body .kv > .card > b {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
html body .warn {
  border: 1px solid color-mix(in srgb, var(--am) 40%, transparent);
  background: color-mix(in srgb, var(--am) 9%, transparent);
  color: var(--tx);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
}
html body .chip,
html body .tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--card2);
  border: 1px solid var(--bd);
  font-size: 13px;
  font-weight: 600;
  color: var(--tx);
  margin: 4px 8px 0 0;
}
html body .tag {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--am);
  border-color: color-mix(in srgb, var(--am) 35%, transparent);
  background: transparent;
}
html body .hero {
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--ac) 16%, var(--card)) 0%,
    var(--card) 70%
  );
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0 12px;
}
html body .hero .big,
html body .big {
  font-size: 40px;
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin: 4px 0;
}
html body table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
html body th {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--mut);
  text-align: left;
  padding: 8px 8px;
  border-bottom: 1px solid var(--bd);
}
html body td {
  padding: 8px 8px;
  border-top: 1px solid var(--bd);
}
html body details > summary {
  cursor: pointer;
  list-style: none;
}
html body details > summary::-webkit-details-marker {
  display: none;
}
html body details > summary::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  border-right: 1px solid var(--mut);
  border-bottom: 1px solid var(--mut);
  transform: rotate(-45deg);
  margin: 0 8px 4px 4px;
  transition: transform 0.15s;
}
html body details[open] > summary::before {
  transform: rotate(45deg);
}
html body .rings {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  margin: 8px 0;
}
html body .mc,
html body .cal {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  text-align: center;
}
html body .dc,
html body .cal > button {
  min-height: 40px;
  border-radius: 6px;
  border: 1px solid var(--bd);
  background: var(--card);
  color: var(--tx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font: 12px var(--fs);
  padding: 4px;
}
html body #sh .ov {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0,0,0,0.55);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
html body #sh .sh {
  background: var(--bg);
  max-width: 640px;
  margin: max(24px, env(safe-area-inset-top)) auto 0;
  min-height: 100%;
  border-radius: 8px 8px 0 0;
  padding: 16px 16px calc(40px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--bd);
}
html body #tst {
  border-radius: 8px !important;
  background: var(--card2) !important;
  color: var(--tx) !important;
  border: 1px solid var(--bd2) !important;
  box-shadow: 0 8px 30px rgba(0,0,0,0.35) !important;
}
/* topo (ticker) e menu */
html body #tape {
  background: var(--bg) !important;
  border-bottom: 1px solid var(--bd) !important;
}
html body #mbtn {
  background: var(--bg) !important;
  color: var(--tx) !important;
  border-right: 1px solid var(--bd) !important;
}
html body #mdr .mpn {
  background: var(--bg) !important;
}
html body #mdr .mit {
  border-radius: 8px;
}
html body #mdr .mi {
  color: var(--ac);
  display: inline-flex;
  width: 28px;
  justify-content: center;
}
html body #mdr .mi .ico {
  width: 22px;
  height: 22px;
  margin: 0;
}
/* botão + acima da barra de baixo */
html body #fab {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  border: 0;
  z-index: 40;
  bottom: calc(var(--nav) + 16px + env(safe-area-inset-bottom, 0px)) !important;
  right: 16px !important;
  width: 52px !important;
  height: 52px !important;
  border-radius: 8px !important;
  background: var(--ac) !important;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35) !important;
}
html body #fabm {
  bottom: calc(var(--nav) + 78px + env(safe-area-inset-bottom, 0px)) !important;
}
/* barra inferior */
#bnav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  height: calc(var(--nav) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: saturate(1.6) blur(14px);
  -webkit-backdrop-filter: saturate(1.6) blur(14px);
  border-top: 1px solid var(--bd);
}
#bnav button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: 0;
  color: var(--mut);
  font: 600 12px var(--fs);
  letter-spacing: 0.01em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
#bnav button svg {
  width: 23px;
  height: 23px;
}
#bnav button.on {
  color: var(--ac);
}
body.semnav #bnav {
  display: none;
}
/* ícones no lugar dos emojis */
.ico {
  width: 1.1em;
  height: 1.1em;
  vertical-align: -0.17em;
  margin-right: 0.38em;
  flex: none;
  display: inline-block;
}
h1 .ico,
h2 .ico {
  margin-right: 0.3em;
}
.seg .ico,
.btn .ico {
  margin-right: 0;
}
.dot {
  display: inline-block;
  width: 0.6em;
  height: 0.6em;
  border-radius: 50%;
  margin-right: 0.4em;
  vertical-align: 0.05em;
}
html body .chips2 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
html body .chips2 > button {
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--bd2);
  background: var(--card2);
  color: var(--tx);
  font: 600 14px var(--fs);
  cursor: pointer;
}
html body .chips2 > button.on {
  background: var(--ac2);
  border-color: var(--ac);
  color: var(--ac);
}
html body .chips2 > button.on.g {
  background: color-mix(in srgb, var(--g) 14%, transparent);
  border-color: var(--g);
  color: var(--g);
}
html body .chips2 > button.on.r {
  background: color-mix(in srgb, var(--r) 14%, transparent);
  border-color: var(--r);
  color: var(--r);
}
html body #sh .sh .top h2,
html body .sh > .top > h2 {
  font-size: 20px;
  text-transform: none;
  letter-spacing: -0.015em;
  color: var(--tx);
  margin: 0;
}
.cap1::first-letter {
  text-transform: uppercase;
}
html body .ib {
  width: 40px;
  padding: 0;
  flex: none;
}
html body #fab {
  display: none !important;
}
html body #fabm {
  left: 50% !important;
  right: auto !important;
  transform: translateX(-50%);
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--card);
  border: 1px solid var(--bd2);
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  z-index: 55;
  bottom: calc(var(--nav) + 14px + env(safe-area-inset-bottom, 0px)) !important;
}
#bnav .mais {
  flex: 0 0 64px;
}
#bnav .mais span.bx {
  width: 48px;
  height: 48px;
  margin-top: -8px;
  border-radius: 8px;
  background: var(--ac);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--ac) 45%, transparent);
}
#bnav .mais span.bx svg {
  width: 26px;
  height: 26px;
}
html body .mk-seg > button.btn {
  flex: 1 0 auto;
  background: transparent;
  color: var(--mut);
  border: 0;
  min-height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  box-shadow: none;
}
html body .mk-seg > button.btn:not(.s) {
  background: var(--card);
  color: var(--tx);
  box-shadow:
    0 1px 2px rgba(0,0,0,0.25),
    0 0 0 1px var(--bd);
}
html body .bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  margin-top: 8px;
}
html body .bars .bar {
  flex: 1;
  min-width: 3px;
  border: 0;
  border-radius: 3px 3px 1px 1px;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}
html body .bars .bar:hover,
html body .bars .bar:focus {
  opacity: 1;
  outline: none;
}
html body .kv > .card > b {
  overflow-wrap: anywhere;
}
/* textos de ajuda recolhidos */
.hint-t {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  background: none;
  border: 0;
  padding: 4px 0;
  color: var(--mut);
  font: 600 13px var(--fs);
  cursor: pointer;
}
.hint {
  display: none;
}
.hint.on {
  display: block;
  margin-top: 4px;
}
`,
          "legacy-125": `#dshch {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
#dshch .csvc {
  background: var(--card);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  max-width: 420px;
}
#dshch .csvg {
  display: grid;
  gap: 8px;
  margin: 8px 0 12px;
}
#dshch .btn {
  width: 100%;
}
/* jornal no app: cabeçalho com logo e faixas azul-marinho com detalhe verde */
html body #app .jrcard .jrnome {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.jrtag2 {
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.22em;
  color: var(--mut);
  margin-top: 4px;
}
html body #app .jrcard .jrsec > h3 {
  background: linear-gradient(90deg, #1f2023, #313338) !important;
  color: #ffffff !important;
  padding: 8px 12px !important;
  border-radius: 6px !important;
  border-left: 4px solid var(--ds-line-2) !important;
  letter-spacing: 0.12em !important;
}
html body #app .jrcard .jrsec > h3::after {
  display: none;
}
html body #app .jrcard .jrsec > h3 .lnk {
  color: #dbd8d2 !important;
}
html body #app .jrcard .jrpq {
  background: #1f2023;
  color: #efeeeb;
  border: 0;
  border-left: 4px solid var(--ds-line-2);
  border-radius: 8px;
  padding: 8px 12px;
}
html body #app .jrcard .jrpq b {
  color: #d4b57d;
}
.jrccs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.jrcc {
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--card2);
}
.jrcc-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.jrcc-h b {
  font:
    700 17px Georgia,
    "Times New Roman",
    serif;
}
.jrcc-h span {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.jrcc p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.45;
}
.jrcc p small {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--mut);
}
#jeov {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #1f2023;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  text-align: center;
  padding: 20px;
}
#jeov b {
  display: block;
  font:
    700 20px Georgia,
    serif;
  margin-bottom: 8px;
}
#jeov span {
  opacity: 0.75;
  font-size: 14px;
}
/* edição em páginas (A4 a 96 dpi), só para o PDF */
#jeroot {
  position: absolute;
  left: 0;
  top: 0;
  width: __STYLE_VALUE_0__px;
  z-index: 99999;
  background: #ffffff;
}
.jep {
  width: __STYLE_VALUE_1__px;
  height: __STYLE_VALUE_2__px;
  background: #ffffff;
  color: #191a1d;
  font:
    13px/1.45 system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
  display: flex;
  flex-direction: column;
  padding: 24px 32px 16px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}
.jep * {
  box-sizing: border-box;
}
.jeh {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #1f2023;
  padding-bottom: 8px;
  margin-bottom: 16px;
}
.jeh-l {
  display: flex;
  align-items: center;
  gap: 8px;
}
.jeh-n {
  font:
    700 26px/1 Georgia,
    "Times New Roman",
    serif;
  color: #1f2023;
}
.jeh.capa .jeh-n {
  font-size: 48px;
}
.jeh-t {
  font-size: 12px;
  letter-spacing: 0.24em;
  color: #ac8439;
  margin-top: 4px;
  font-weight: 700;
}
.jeh-r {
  text-align: right;
  font-size: 12px;
  color: #4b4f57;
  line-height: 1.5;
}
.jeb {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.jef {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #dbd8d2;
  padding-top: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #6a7a85;
}
.jeban {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(90deg, #1f2023, #313338);
  color: #ffffff;
  border-radius: 6px;
  padding: 16px 16px;
  overflow: hidden;
  flex: none;
}
.jeban-i {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #ac8439;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.jeban-t b {
  display: block;
  font:
    800 19px/1.15 system-ui,
    sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.jeban-t b small {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
  text-transform: none;
  letter-spacing: 0;
}
.jeban-t span {
  font-size: 12px;
  opacity: 0.85;
}
.jeban-art {
  position: absolute;
  right: 0;
  top: 0;
  width: 260px;
  height: 100%;
}
.jefita {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ac8439;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  align-self: flex-start;
  margin-bottom: 8px;
  flex: none;
}
.jebox {
  border: 1px solid #e4e2df;
  border-radius: 6px;
  padding: 12px 16px;
  background: #efeeeb;
  flex: none;
}
.jebt {
  display: block;
  font:
    700 14px Georgia,
    serif;
  margin-bottom: 8px;
  color: #1f2023;
}
.jeduo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: none;
}
.jehero {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  min-height: 300px;
  flex: none;
  background: #1f2023;
}
.jehero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.jehero-t {
  position: relative;
  padding: 24px 24px;
  color: #ffffff;
  max-width: 72%;
}
.jeed {
  display: inline-block;
  background: #ac8439;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 4px 8px;
  border-radius: 3px;
  margin-bottom: 12px;
}
.jehero h1 {
  font:
    700 30px/1.15 Georgia,
    "Times New Roman",
    serif;
  margin: 0 0 8px;
}
.jehero p {
  font-size: 14px;
  line-height: 1.45;
  opacity: 0.92;
  margin: 0;
}
.jecots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex: none;
}
.jecot {
  border: 1px solid #e4e2df;
  border-radius: 6px;
  padding: 8px 8px;
  background: #ffffff;
  min-width: 0;
}
.jecot small {
  display: block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #4b4f57;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jecot b {
  display: block;
  font:
    700 19px/1.2 system-ui,
    sans-serif;
  font-variant-numeric: tabular-nums;
}
.jecot i,
.jep i.up,
.jep i.dn,
.jep i.eq {
  font-style: normal;
  font-weight: 800;
  font-size: 12px;
}
.jep .up {
  color: #41444b;
}
.jep .dn {
  color: #d34e3a;
}
.jep .eq {
  color: #6a7a85;
}
.jespk {
  display: block;
  width: 100%;
  height: 30px;
  margin-top: 4px;
}
.jecots.esc .jecot {
  background: #1f2023;
  border-color: #1f2023;
  color: #ffffff;
}
.jecots.esc small {
  color: #b6b9c0;
}
.jecots.esc .up {
  color: #53c68d;
}
.jecots.esc .dn {
  color: #ef988b;
}
.jebarra {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #1f2023;
  color: #ffffff;
  border-radius: 6px;
  padding: 12px 16px;
  flex: none;
}
.jebarra-i {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  background: #ac8439;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.jebarra b {
  display: block;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.jebarra span {
  font-size: 13px;
  opacity: 0.92;
}
.jemat {
  border-top: 1px solid #e4e2df;
  padding-top: 8px;
  flex: none;
}
.jeman {
  border-top: 0;
  padding-top: 0;
}
.jechap {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
html body .jep h1,
html body .jep h3 {
  text-transform: none !important;
  letter-spacing: -0.005em !important;
  border: 0 !important;
  padding: 0 !important;
  background: none !important;
}
.jemat h3 {
  font:
    700 18px/1.25 Georgia,
    "Times New Roman",
    serif;
  margin: 0 0 4px;
  color: #1f2023;
}
.jeuno {
  display: block;
  flex: none;
}
.jecont .jechap {
  color: #6a7a85;
}
.jefina {
  margin: 0 0 8px;
  color: #4b4f57;
  font-size: 13px;
}
.jetx {
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.5;
  color: #282a2e;
}
.jepq {
  font-style: italic;
  color: #1f2023;
  border-left: 1px solid var(--ds-line-2);
  padding: 4px 8px;
  margin: 8px 0;
  font-size: 13px;
  background: #efeeeb;
}
.jenums {
  display: grid;
  gap: 8px;
  margin: 8px 0;
}
.jenums.n1 {
  grid-template-columns: 1fr;
}
.jenums.n2 {
  grid-template-columns: repeat(2, 1fr);
}
.jenums.n3 {
  grid-template-columns: repeat(3, 1fr);
}
.jenums.n4 {
  grid-template-columns: repeat(4, 1fr);
}
.jenums > div {
  border: 1px solid #e4e2df;
  border-radius: 6px;
  padding: 8px 8px;
  background: #ffffff;
}
.jenums small {
  display: block;
  font-size: 12px;
  color: #4b4f57;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jenums b {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.jeimp {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.jechip {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #dbd8d2;
  background: #ffffff;
}
.jechip.up {
  color: #41444b;
  border-color: #66cc99;
  background: #efeeeb;
}
.jechip.dn {
  color: #c1422f;
  border-color: #f1bdb5;
  background: #fdf2f0;
}
.jechip.set {
  color: #4b4f57;
}
.jelist {
  margin: 0;
  padding-left: 16px;
}
.jelist li {
  margin: 0 0 8px;
  font-size: 13px;
}
.jelist li::marker {
  color: #ac8439;
}
.jeol {
  margin: 0;
  padding-left: 20px;
}
.jeol li {
  margin: 0 0 8px;
  font-size: 13px;
}
.jedest .jrilu {
  margin: 0 0 8px;
  border-radius: 6px;
}
.jedest b {
  display: block;
  font:
    700 15px/1.3 Georgia,
    serif;
  color: #1f2023;
  margin-bottom: 4px;
}
.jedest p {
  margin: 0;
  font-size: 12px;
  color: #4b4f57;
}
.jedt {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #edece9;
}
.jedt:last-child {
  border-bottom: 0;
}
.jebadge {
  flex: none;
  min-width: 56px;
  text-align: center;
  background: #1f2023;
  color: #ffffff;
  font-weight: 800;
  font-size: 12px;
  border-radius: 6px;
  padding: 4px 8px;
}
.jedt b {
  display: block;
  font-size: 13px;
  line-height: 1.35;
}
.jedt span {
  font-size: 12px;
  color: #4b4f57;
}
.jebox-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.jebox-h b {
  font-size: 13px;
  color: #1f2023;
}
.jebox-h span {
  font-size: 12px;
  color: #4b4f57;
  display: flex;
  align-items: center;
  gap: 4px;
}
.lg {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-left: 8px;
}
.lg.n {
  background: #51555d;
}
.lg.g {
  background: #2e8a5c;
}
.jegraf {
  width: 100%;
  height: auto;
  display: block;
}
.jegraf text {
  fill: #282a2e;
  font-family: system-ui, sans-serif;
}
.jenota {
  font-size: 12px;
  color: #6a7a85;
  margin-top: 4px;
}
.jetab {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  flex: none;
}
.jetab th {
  background: #1f2023;
  color: #ffffff;
  text-align: left;
  padding: 8px 8px;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.jetab td {
  padding: 8px 8px;
  border-bottom: 1px solid #e9e7e4;
  vertical-align: top;
}
.jetab tr:nth-child(even) td {
  background: #efeeeb;
}
.jekpis {
  display: grid;
  gap: 8px;
  flex: none;
}
.jekpis.n1 {
  grid-template-columns: 1fr;
}
.jekpis.n2 {
  grid-template-columns: repeat(2, 1fr);
}
.jekpis.n3 {
  grid-template-columns: repeat(3, 1fr);
}
.jekpis.n4 {
  grid-template-columns: repeat(4, 1fr);
}
.jekpis > div {
  border: 1px solid #e4e2df;
  border-radius: 6px;
  padding: 8px 12px;
  background: #ffffff;
}
.jekpis small {
  display: block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #4b4f57;
  text-transform: uppercase;
}
.jekpis b {
  display: block;
  font-size: 22px;
  margin: 4px 0;
}
.jekpis span {
  font-size: 12px;
  color: #4b4f57;
}
.jebox svg {
  max-width: 100%;
}
.jetecs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.jetec {
  border: 1px solid #e4e2df;
  border-radius: 6px;
  padding: 8px 8px;
  background: #ffffff;
  font-size: 13px;
}
.jetec-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.jetec-h b {
  font:
    700 15px Georgia,
    serif;
}
.jetag {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #efeeeb;
}
.jetag.up {
  background: #eeedea;
}
.jetag.dn {
  background: #fbeae7;
}
.jeresumo {
  background: #1f2023;
  color: #ffffff;
  border-radius: 6px;
  padding: 16px 16px;
}
.jeresumo b {
  display: block;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 12px;
  margin-bottom: 8px;
  color: #d4b57d;
}
.jeresumo ul {
  margin: 0;
  padding-left: 16px;
}
.jeresumo li {
  font-size: 12px;
  margin-bottom: 8px;
}
.jedica {
  border-radius: 6px;
  padding: 16px;
  background: linear-gradient(135deg, #ac8439, #1f2023);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}
.jedica span {
  font:
    italic 700 16px/1.35 Georgia,
    serif;
}
.jedica small {
  opacity: 0.8;
  font-size: 12px;
}
.jefim {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  align-items: center;
  background: #1f2023;
  color: #ffffff;
  border-radius: 6px;
  padding: 16px 16px;
  flex: none;
}
.jefim b {
  font:
    700 20px Georgia,
    serif;
  display: block;
}
.jefim small {
  font-size: 12px;
  letter-spacing: 0.22em;
  color: #d4b57d;
}
.jefim > span {
  grid-column: 1/-1;
  font-size: 12px;
  opacity: 0.8;
}
.jefim .jelogo rect[fill="#0e2a3b"] {
  fill: #ffffff;
}
.jecorta {
  overflow: hidden;
  position: relative;
}
.jecorta::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  background: linear-gradient(transparent, #ffffff);
}
`,
          "legacy-126": `.jrilu.jrfoto {
  background-image:
    linear-gradient(
      90deg,
      rgba(17,18,20,0.92) 0%,
      rgba(17,18,20,0.55) 38%,
      rgba(17,18,20,0) 70%
    ),
    url(__STYLE_VALUE_0__) !important;
  background-position: right 30%;
  background-size: cover;
  background-repeat: no-repeat;
}
`,
        },
        u = new Map(),
        V = [];
      let U = !1,
        W = 0;
      function y() {
        U = !1;
        for (const v of V)
          v.dirty &&
            ((v.dirty = !1),
            (v.element.textContent = v.order.map((z) => z.textContent).join(`
`)));
      }
      function P() {
        U ||
          ((U = !0),
          (w.queueMicrotask || ((v) => Promise.resolve().then(v)))(y));
      }
      function j(v) {
        if (u.has(v)) return u.get(v);
        let z = "";
        const k = {
          key: v,
          id: "",
          segment: null,
          remove() {
            if (!k.segment) return;
            const x = k.segment;
            ((x.order = x.order.filter((m) => m !== k)),
              (x.dirty = !0),
              (k.segment = null),
              P());
          },
        };
        return (
          Object.defineProperty(k, "textContent", {
            get: () => z,
            set: (x) => {
              ((z = String(x ?? "")),
                k.segment && ((k.segment.dirty = !0), P()));
            },
          }),
          u.set(v, k),
          k
        );
      }
      function H(v) {
        if (!v || u.get(v.key) !== v)
          throw new TypeError("Bloco de estilo não registrado.");
        const z = w.document.head,
          k = [...z.children]
            .filter(
              (m) =>
                m.tagName === "STYLE" ||
                (m.tagName === "LINK" && m.rel === "stylesheet"),
            )
            .at(-1);
        let x = V.at(-1);
        if (!x || x.element !== k) {
          const m = w.document.createElement("style");
          ((m.id = "trader-estilos-" + ++W),
            z.appendChild(m),
            (x = { element: m, order: [], dirty: !1 }),
            V.push(x));
        }
        if (v.segment === x && x.order.at(-1) === v) return v;
        if (v.segment) {
          const m = v.segment;
          ((m.order = m.order.filter((r) => r !== v)), (m.dirty = !0));
        }
        return ((v.segment = x), x.order.push(v), (x.dirty = !0), P(), v);
      }
      w.TraderStyles = Object.freeze({
        slot: j,
        mount: H,
        flush: y,
        css: (v, z = []) => {
          if (!Object.hasOwn(f, v))
            throw new Error("Definição CSS ausente: " + v);
          return f[v].replace(/__STYLE_VALUE_(\d+)__/g, (k, x) => {
            if (!(x in z)) throw new Error("Parâmetro CSS ausente: " + v);
            return String(z[x]);
          });
        },
        find: (v) => {
          for (const z of V) for (const k of z.order) if (k.id === v) return k;
          return null;
        },
        inspect: () => ({
          blocks: [...u.values()].filter((v) => v.segment).length,
          segments: V.length,
          order: V.flatMap((v) => v.order.map((z) => z.key)),
        }),
      });
    })(window));
} catch (e) {
  console.error("[v522] falha em inicio.js", e);
}
try {
  try {
    window.TraderTerminalChartStyle =
      localStorage.getItem("dt-terminal-chart-style") === "candles"
        ? "candles"
        : "line";
  } catch {
    window.TraderTerminalChartStyle = "line";
  }
} catch (e) {
  console.error("[v522] falha em terminal-chart-mode-v415.js", e);
}
(function () {
  const e = new Map();
  let t = 0;
  const a = window.setInterval.bind(window),
    o = window.clearInterval.bind(window);
  (a(function () {
    const s = Date.now(),
      n = document.hidden;
    e.forEach(function (r) {
      if (!(s < r.prox) && ((r.prox = s + r.ms), !(n && r.ms >= 5e3)))
        try {
          r.fn.apply(window, r.a);
        } catch (i) {
          console.error(i);
        }
    });
  }, 1e3),
    (window.setInterval = function (s, n) {
      if (typeof s != "function" || !(n >= 1e3))
        return a.apply(window, arguments);
      const r = "rel" + ++t;
      return (
        e.set(r, {
          fn: s,
          ms: n,
          a: [].slice.call(arguments, 2),
          prox: Date.now() + n,
        }),
        r
      );
    }),
    (window.clearInterval = function (s) {
      if (typeof s == "string" && e.has(s)) {
        e.delete(s);
        return;
      }
      o(s);
    }),
    (window.relogioInfo = function () {
      return e.size;
    }));
})();
