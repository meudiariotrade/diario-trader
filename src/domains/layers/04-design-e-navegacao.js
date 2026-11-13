try {
  (function (f) {
    "use strict";
    const x = f.document;
    if (!x) return;
    const p = (e, s) => {
        try {
          const a = e();
          return a === void 0 ? s : a;
        } catch {
          return s;
        }
      },
      R = (e) =>
        String(e ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/\r?\n/g, "&#10;"),
      C = (e, s = 2) =>
        (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: s,
          maximumFractionDigits: s,
        }),
      N = (e) => (e > 0 ? "+" : e < 0 ? "−" : "") + "R$ " + C(Math.abs(e)),
      E = (e) => (e > 0 ? "+" : e < 0 ? "−" : "") + C(Math.abs(e)) + "×",
      g = (e) => Math.round(e * 100) + "%",
      L = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
      I = ["", "Muito mal", "Mal", "Neutro", "Bem", "Muito bem"],
      W = [
        ["p_limite", "limite de perda"],
        ["p_meta", "meta"],
        ["p_stop", "stop e alvo"],
      ],
      _ = ["m_umdia", "m_erro", "m_aprend", "m_maior"];
    function z(e) {
      const s = p(() => S.days[e], {}) || {},
        a = s.cl || {},
        o = s.chk || {},
        n = p(
          () => S.trades.filter((r) => String(r.dt || "").slice(0, 10) === e),
          [],
        ),
        m = n.map((r) => p(() => calc(r), null)).filter(Boolean),
        l = m
          .map((r) => r.r)
          .filter((r) => typeof r == "number" && isFinite(r)),
        u = m
          .map((r) => r.pl)
          .filter((r) => typeof r == "number" && isFinite(r)),
        h =
          s._rulesSnapshot && Array.isArray(s._rulesSnapshot.rules)
            ? s._rulesSnapshot.rules.length
            : 0,
        i = p(() => S.rules.length, 0) || h,
        v = p(() => S.rules.filter((r) => o[r.id]).length, 0),
        c = p(() => epeetNota(s.epeet), null),
        t = +s.maxT || +(s.pl2 && s.pl2.max) || 0,
        F = (r) => r.exit != null && r.exit !== "",
        b = n.filter((r) => !r.pin || (F(r) && !r.pout)).length,
        X = n.filter((r) => !r.rules).length,
        J = m.filter((r) => r.semStop).length;
      return {
        d: e,
        semFoto: b,
        semRegra: X,
        semStop: J,
        estado: +s.estado || 0,
        emo: p(() => (S.days[e] || {}).emocao, "") || "",
        plano: W.filter(([r]) => a[r]).length,
        planoFalta: W.filter(([r]) => !a[r]).map((r) => r[1]),
        regrasOk: v,
        regrasTot: i,
        ment: _.filter((r) => a[r]).length,
        ep: c,
        posop: !!s.posop,
        ckok: !!s.ckok,
        trades: n.length,
        maxT: t,
        xr: l.length ? l.reduce((r, D) => r + D, 0) : null,
        pl: u.length ? u.reduce((r, D) => r + D, 0) : null,
      };
    }
    function B() {
      const e = new Set(
        Object.keys(p(() => S.days, {}) || {}).filter((s) =>
          /^\d{4}-\d{2}-\d{2}$/.test(s),
        ),
      );
      return (
        p(() => S.trades, []).forEach((s) => {
          const a = String(s.dt || "").slice(0, 10);
          /^\d{4}-\d{2}-\d{2}$/.test(a) && e.add(a);
        }),
        [...e].sort()
      );
    }
    function y(e) {
      const s = [];
      return (
        s.push(e.estado ? 1 : 0),
        s.push(e.plano / 3),
        e.regrasTot && s.push(e.regrasOk / e.regrasTot),
        s.push(e.ment / 4),
        e.trades && s.push(e.posop ? 1 : 0),
        s.push(e.ckok ? 1 : 0),
        e.maxT && e.trades > e.maxT && s.push(0),
        e.trades &&
          (s.push(1 - (e.semFoto || 0) / e.trades),
          s.push(1 - (e.semRegra || 0) / e.trades),
          e.semStop && s.push(0)),
        s.reduce((a, o) => a + o, 0) / s.length
      );
    }
    const T = (e) =>
      !e.estado &&
      !e.plano &&
      !e.regrasOk &&
      !e.ment &&
      !e.ep &&
      !e.emo &&
      !e.posop &&
      !e.ckok &&
      !e.trades;
    function M(e) {
      const s = [];
      return (
        e.estado ||
          s.push({ k: "estado", fase: "pre", txt: "marcar como estava" }),
        e.plano < 3 &&
          s.push({
            k: "plano",
            fase: "pre",
            txt: e.plano
              ? "plano: " + e.planoFalta.join(", ")
              : "fazer o plano",
          }),
        e.emo || s.push({ k: "emocao", fase: "pre", txt: "estado emocional" }),
        e.ckok ||
          s.push({
            k: "ckok",
            fase: "pre",
            txt: "concluir o checklist do dia",
          }),
        e.regrasTot &&
          e.regrasOk < e.regrasTot &&
          s.push({
            k: "regras",
            fase: "dur",
            txt: e.regrasTot - e.regrasOk + " regra(s) sem marcar",
          }),
        e.semStop &&
          s.push({
            k: "stop",
            fase: "dur",
            txt: e.semStop + " trade(s) sem stop",
          }),
        e.maxT &&
          e.trades > e.maxT &&
          s.push({
            k: "maxt",
            fase: "dur",
            txt:
              "passou do máximo de trades (" + e.trades + " de " + e.maxT + ")",
          }),
        e.semFoto &&
          s.push({
            k: "foto",
            fase: "pos",
            txt: e.semFoto + " trade(s) sem foto",
          }),
        e.semRegra &&
          s.push({
            k: "seguiu",
            fase: "pos",
            txt: e.semRegra + " trade(s) sem dizer se seguiu as regras",
          }),
        e.trades &&
          !e.posop &&
          s.push({ k: "posop", fase: "pos", txt: "diário pós-operação" }),
        s
      );
    }
    function O(e) {
      const s = new Date(e.d + "T12:00"),
        a = e.d.split("-").reverse().join("/") + " · " + L[s.getDay()];
      if (T(e))
        return [
          [a, "n"],
          ["dia sem registro", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
          ["", "vz"],
        ];
      const o = [];
      if (
        (o.push([a, "n"]),
        o.push(
          e.estado
            ? [
                e.estado + " · " + I[e.estado],
                e.estado >= 4 ? "ok" : e.estado === 3 ? "av" : "ruim",
              ]
            : ["não marcado", "vz"],
        ),
        o.push(
          e.plano === 3
            ? ["Completo (3 de 3)", "ok"]
            : e.plano
              ? [e.plano + " de 3 · faltou: " + e.planoFalta.join(", "), "av"]
              : ["Não feito", "ruim"],
        ),
        e.regrasTot)
      ) {
        const l = e.regrasOk / e.regrasTot;
        o.push([
          e.regrasOk + " de " + e.regrasTot + " (" + g(l) + ")",
          l >= 0.8
            ? "ok"
            : l >= 0.5
              ? "av"
              : e.regrasOk || e.trades
                ? "ruim"
                : "vz",
        ]);
      } else o.push(["sem regras", "vz"]);
      (o.push(
        e.ment === 4
          ? ["4 de 4 frases", "ok"]
          : e.ment
            ? [e.ment + " de 4 frases", e.ment >= 2 ? "av" : "ruim"]
            : ["nenhuma frase", "vz"],
      ),
        o.push(
          e.ep
            ? [
                e.ep.n + " de 70 · " + e.ep.txt,
                e.ep.n >= 52 ? "ok" : e.ep.n <= 32 ? "ruim" : "av",
              ]
            : ["não respondida", "vz"],
        ),
        o.push(
          e.maxT && e.trades > e.maxT
            ? [e.trades + " (máx. " + e.maxT + ")", "ruim"]
            : [String(e.trades), e.trades ? "n" : "vz"],
        ),
        o.push(
          e.xr == null
            ? ["—", "vz"]
            : [E(e.xr), e.xr > 0 ? "ok" : e.xr < 0 ? "ruim" : "n"],
        ),
        o.push(
          e.pl == null
            ? ["—", "vz"]
            : [N(e.pl), e.pl > 0 ? "ok" : e.pl < 0 ? "ruim" : "n"],
        ),
        o.push(
          e.posop
            ? ["Sim", "ok"]
            : [e.trades ? "Não" : "—", e.trades ? "ruim" : "vz"],
        ),
        o.push(e.ckok ? ["Sim", "ok"] : ["Não", "av"]));
      const n = y(e);
      o.push([
        g(n) +
          " · " +
          (n >= 0.8
            ? "Ótima"
            : n >= 0.6
              ? "Boa"
              : n >= 0.4
                ? "Regular"
                : "Fraca"),
        n >= 0.8 ? "ok" : n >= 0.6 ? "ok2" : n >= 0.4 ? "av" : "ruim",
      ]);
      const m = M(e).map((l) => l.txt);
      return (
        o.push([
          m.length ? m.join(" · ") : "nada — dia completo",
          m.length ? "n" : "ok",
        ]),
        o
      );
    }
    const $ = [
        "Data",
        "Como eu estava",
        "Plano do dia",
        "Regras cumpridas",
        "Mentalidade",
        "Escala emocional",
        "Trades",
        "Resultado (× risco)",
        "Resultado (R$)",
        "Diário pós-operação",
        "Checklist concluído",
        "Disciplina do dia",
        "O que faltou",
      ],
      q = [96, 110, 200, 120, 95, 135, 75, 100, 105, 100, 100, 115, 430];
    function k(e, s) {
      const a = e.map(s).filter((o) => typeof o == "number" && isFinite(o));
      return a.length ? a.reduce((o, n) => o + n, 0) / a.length : null;
    }
    function d(e, s, a) {
      const o = e.filter((l) => l.trades && l.xr != null && s(l));
      if (!o.length) return [a, "sem dias com trade", "", ""];
      const n = k(o, (l) => l.xr),
        m = k(o, (l) => l.pl);
      return [
        a,
        o.length + " dia(s)",
        E(n) + " por dia",
        m == null ? "" : N(m) + " por dia",
      ];
    }
    function P(e) {
      const s = e.filter((t) => !T(t)),
        a = (t) => t.split("-").reverse().join("/"),
        o = [];
      (o.push([["Resumo do checklist", "t"]]),
        o.push([
          [
            s.length
              ? "De " +
                a(s[0].d) +
                " a " +
                a(s[s.length - 1].d) +
                " · " +
                s.length +
                " dia(s) com registro"
              : "Ainda não há dias com registro",
            "n",
          ],
        ]),
        o.push([]),
        o.push([
          ["Como você vem cumprindo o processo", "h"],
          ["", "h"],
        ]));
      const n = k(
        s.filter((t) => t.estado),
        (t) => t.estado,
      );
      o.push([
        ["Estado médio antes de operar", "n"],
        [
          n == null ? "não marcado" : C(n, 1) + " · " + I[Math.round(n)],
          n == null ? "vz" : n >= 4 ? "ok" : n >= 3 ? "av" : "ruim",
        ],
      ]);
      const m = s.length ? s.filter((t) => t.plano === 3).length / s.length : 0;
      o.push([
        ["Dias com plano completo", "n"],
        [g(m) + " dos dias", m >= 0.8 ? "ok" : m >= 0.5 ? "av" : "ruim"],
      ]);
      const l = k(
        s.filter((t) => t.regrasTot),
        (t) => t.regrasOk / t.regrasTot,
      );
      o.push([
        ["Regras cumpridas, em média", "n"],
        [
          l == null ? "—" : g(l),
          l == null ? "vz" : l >= 0.8 ? "ok" : l >= 0.5 ? "av" : "ruim",
        ],
      ]);
      const u = k(
        s.filter((t) => t.ep),
        (t) => t.ep.n,
      );
      o.push([
        ["Escala emocional média", "n"],
        [
          u == null
            ? "não respondida"
            : Math.round(u) +
              " de 70 · " +
              (u >= 52 ? "estável" : u <= 32 ? "instável" : "neutro"),
          u == null ? "vz" : u >= 52 ? "ok" : u <= 32 ? "ruim" : "av",
        ],
      ]);
      const h = s.length ? s.filter((t) => t.ckok).length / s.length : 0;
      o.push([
        ["Dias com checklist concluído", "n"],
        [g(h) + " dos dias", h >= 0.8 ? "ok" : h >= 0.5 ? "av" : "ruim"],
      ]);
      const i = k(s, y);
      o.push([
        ["Disciplina média", "n"],
        [
          i == null
            ? "—"
            : g(i) +
              " · " +
              (i >= 0.8
                ? "Ótima"
                : i >= 0.6
                  ? "Boa"
                  : i >= 0.4
                    ? "Regular"
                    : "Fraca"),
          i == null ? "vz" : i >= 0.6 ? "ok" : i >= 0.4 ? "av" : "ruim",
        ],
      ]);
      const v = s.filter((t) => t.maxT && t.trades > t.maxT).length;
      (o.push([
        ["Dias acima do máximo de trades", "n"],
        [String(v), v ? "ruim" : "ok"],
      ]),
        o.push([]),
        o.push([
          ["O que muda no resultado (média por dia com trade)", "h"],
          ["Dias", "h"],
          ["× risco", "h"],
          ["R$", "h"],
        ]));
      const c = (t) =>
        o.push(
          t.map((F, b) => [
            F,
            b === 2
              ? /^\+/.test(F)
                ? "ok"
                : /^−/.test(F)
                  ? "ruim"
                  : "n"
              : "n",
          ]),
        );
      return (
        c(d(s, (t) => t.estado >= 4, "Quando estava Bem ou Muito bem (4–5)")),
        c(
          d(
            s,
            (t) => t.estado && t.estado <= 2,
            "Quando estava Mal ou Muito mal (1–2)",
          ),
        ),
        c(d(s, (t) => t.plano === 3, "Com plano completo")),
        c(d(s, (t) => t.plano < 3, "Sem plano completo")),
        c(
          d(
            s,
            (t) => t.ep && t.ep.n >= 52,
            "Escala emocional estável (52 ou mais)",
          ),
        ),
        c(
          d(
            s,
            (t) => t.ep && t.ep.n <= 32,
            "Escala emocional instável (32 ou menos)",
          ),
        ),
        c(d(s, (t) => t.ckok, "Com checklist concluído")),
        c(d(s, (t) => !t.ckok, "Sem checklist concluído")),
        c(
          d(s, (t) => t.maxT && t.trades > t.maxT, "Acima do máximo de trades"),
        ),
        o.push([]),
        o.push([
          [
            "Compare as linhas em pares: se o resultado é melhor nos dias em que você cumpre o processo, o checklist está fazendo diferença.",
            "nota",
          ],
        ]),
        o
      );
    }
    function w() {
      return [
        [["Como ler a aba Checklist", "t"]],
        [],
        [
          ["Cores", "h"],
          ["", "h"],
        ],
        [
          ["Verde", "ok"],
          ["bom: item cumprido ou resultado positivo", "n"],
        ],
        [
          ["Amarelo", "av"],
          ["atenção: feito pela metade", "n"],
        ],
        [
          ["Vermelho", "ruim"],
          ["ruim: não feito, resultado negativo ou passou do limite", "n"],
        ],
        [
          ["Cinza", "vz"],
          ["não preenchido nesse dia", "n"],
        ],
        [],
        [
          ["Coluna", "h"],
          ["O que quer dizer", "h"],
        ],
        [
          ["Como eu estava", "n"],
          [
            "Nota de 1 a 5 antes de operar: 1 Muito mal · 2 Mal · 3 Neutro · 4 Bem · 5 Muito bem. Verde em 4 e 5.",
            "n",
          ],
        ],
        [
          ["Plano do dia", "n"],
          [
            "3 itens: limite de perda, meta do dia e stop/alvo de cada operação. Mostra o que faltou.",
            "n",
          ],
        ],
        [
          ["Regras cumpridas", "n"],
          [
            "Regras do seu checklist marcadas naquele dia. Verde a partir de 80%, amarelo a partir de 50%.",
            "n",
          ],
        ],
        [
          ["Mentalidade", "n"],
          [
            "4 frases do checklist (um dia de cada vez; um trade errado não me faz errado; humildade de aprendiz; ganhar não dá direito a aumentar o risco).",
            "n",
          ],
        ],
        [
          ["Escala emocional", "n"],
          [
            "14 perguntas de 1 a 5 (vai de 14 a 70). 52 ou mais = estável (verde) · 33 a 51 = neutro · 32 ou menos = instável (vermelho).",
            "n",
          ],
        ],
        [
          ["Resultado (× risco)", "n"],
          [
            "Soma do dia em vezes o risco de cada trade. +1,00× = ganhou o mesmo que arriscou.",
            "n",
          ],
        ],
        [
          ["Disciplina do dia", "n"],
          [
            'Média do processo: estado marcado, plano, regras, frases, diário pós-operação, checklist concluído, fotos de cada trade, "seguiu as regras" respondido, stop em todo trade e respeito ao máximo de trades. 80% ou mais = Ótima · 60% = Boa · 40% = Regular · abaixo = Fraca.',
            "n",
          ],
        ],
        [
          ["O que faltou", "n"],
          ["O que ficou sem fazer naquele dia, para corrigir no próximo.", "n"],
        ],
        [],
        [
          [
            'A aba "Checklist (dados)" tem a tabela antiga, só com números, para quem quiser fazer fórmulas.',
            "nota",
          ],
        ],
      ];
    }
    const j = `<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1d1f22"/></Style>
<Style ss:ID="h"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/><Interior ss:Color="#3b3e43" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2a2c30"/></Borders></Style>
<Style ss:ID="t"><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#3b3e43"/></Style>
<Style ss:ID="n"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#eae8e5"/></Borders></Style>
<Style ss:ID="ok"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#32353a" ss:Bold="1"/><Interior ss:Color="#ebeae7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#ffffff"/></Borders></Style>
<Style ss:ID="ok2"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#32353a"/><Interior ss:Color="#efeeeb" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#ffffff"/></Borders></Style>
<Style ss:ID="av"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#695021"/><Interior ss:Color="#dfc79a" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#ffffff"/></Borders></Style>
<Style ss:ID="ruim"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#a33120" ss:Bold="1"/><Interior ss:Color="#fbe6e3" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#ffffff"/></Borders></Style>
<Style ss:ID="vz"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#9aa5a1" ss:Italic="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#efeeeb"/></Borders></Style>
<Style ss:ID="nota"><Alignment ss:Vertical="Center" ss:WrapText="0"/><Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#5b6b66"/></Style>
</Styles>`,
      H = ([e, s]) =>
        `<Cell ss:StyleID="${s || "n"}"><Data ss:Type="String">${R(e)}</Data></Cell>`;
    function A(e, s, a, o) {
      o = o || {};
      const n = (a || []).map((i) => `<Column ss:Width="${i}"/>`).join(""),
        m = s
          .map((i, v) => {
            const c =
              v === 0 && o.cab ? 30 : i && i[0] && i[0][1] === "t" ? 28 : 0;
            return `<Row${c ? ` ss:Height="${c}"` : ""}>${(i || []).map(H).join("")}</Row>`;
          })
          .join(""),
        l = Math.max(1, ...s.map((i) => (i || []).length)),
        u = `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">${o.cab ? "<FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane>" : ""}${o.ativa ? "<Selected/>" : ""}<DisplayGridlines/></WorksheetOptions>`,
        h =
          o.cab && s.length > 1
            ? `<AutoFilter x:Range="R1C1:R${s.length}C${l}" xmlns="urn:schemas-microsoft-com:office:excel"/>`
            : "";
      return `<Worksheet ss:Name="${R(e).slice(0, 31)}"><Table>${n}${m}</Table>${u}${h}</Worksheet>`;
    }
    function V() {
      const e = B().map(z),
        s = [$.map((a) => [a, "h"]), ...e.map(O)];
      return [
        A("Checklist", s, q, { cab: 1 }),
        A("Resumo", P(e), [330, 150, 120, 130]),
        A("Como ler", w(), [150, 640]),
      ];
    }
    if (typeof f.xlsArquivo == "function" && !f.xlsArquivo.__v506) {
      const e = f.xlsArquivo,
        s = function (a) {
          try {
            if (
              !Array.isArray(a) ||
              !a.some((n) => /ss:Name="Checklist"/.test(n))
            )
              return e.apply(this, arguments);
            const o = [];
            for (const n of a)
              /ss:Name="Checklist"/.test(n)
                ? (o.push(...V()),
                  o.push(
                    n.replace(
                      'ss:Name="Checklist"',
                      'ss:Name="Checklist (dados)"',
                    ),
                  ))
                : o.push(n);
            return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">${j}${o.join("")}</Workbook>`;
          } catch (o) {
            return (
              console.error("[v506] planilha", o),
              e.apply(this, arguments)
            );
          }
        };
      ((s.__v506 = 1), (f.xlsArquivo = s));
    }
    const G = [
      [/,? e que numa mesa propriet[áa]ria reprova o teste na hora\./, "."],
    ];
    function Q() {
      const e = x.getElementById("trvb");
      if (!e) return;
      const s = x.createTreeWalker(e, 4);
      let a;
      for (; (a = s.nextNode()); )
        for (const [o, n] of G)
          o.test(a.nodeValue) && (a.nodeValue = a.nodeValue.replace(o, n));
    }
    new MutationObserver(() => {
      try {
        Q();
      } catch {}
    }).observe(x.documentElement, { childList: !0, subtree: !0 });
    function U() {
      const e = B().map(z);
      return {
        ck: [$.map((s) => [s, "h"]), ...e.map(O)],
        larg: q,
        resumo: P(e),
        legenda: w(),
      };
    }
    f.DIARIO_V506 = {
      abasNovas: V,
      diaInfo: z,
      dias: B,
      dados: U,
      faltou: M,
      disciplina: y,
      vazioDia: T,
    };
  })(window);
} catch (e) {
  console.error("[v522] falha em planilha-v506.js", e);
}
try {
  (function (b) {
    "use strict";
    const Y = b.document;
    if (!Y) return;
    const C = (e, t) => {
        try {
          const n = e();
          return n === void 0 ? t : n;
        } catch {
          return t;
        }
      },
      K = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tt = new TextEncoder(),
      E = (e) =>
        String(e ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ""),
      et = (e, t = 2) =>
        (+e).toLocaleString("pt-BR", {
          minimumFractionDigits: t,
          maximumFractionDigits: t,
        }),
      pt = (e) => (e > 0 ? "+" : e < 0 ? "−" : "") + "R$ " + et(Math.abs(e)),
      dt = (e) => (e > 0 ? "+" : e < 0 ? "−" : "") + et(Math.abs(e)) + "×",
      ft = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
      ut = { D: "Day trade", S: "Swing trade", O: "Opções", F: "Forex" },
      ht = (() => {
        const e = new Uint32Array(256);
        for (let t = 0; t < 256; t++) {
          let n = t;
          for (let i = 0; i < 8; i++)
            n = n & 1 ? 3988292384 ^ (n >>> 1) : n >>> 1;
          e[t] = n >>> 0;
        }
        return e;
      })();
    function ot(e) {
      let t = 4294967295;
      for (let n = 0; n < e.length; n++) t = ht[(t ^ e[n]) & 255] ^ (t >>> 8);
      return (t ^ 4294967295) >>> 0;
    }
    function nt(e) {
      const t = [],
        n = [];
      let i = 0;
      const l = new Date(),
        d =
          (l.getHours() << 11) | (l.getMinutes() << 5) | (l.getSeconds() >> 1),
        a =
          ((l.getFullYear() - 1980) << 9) |
          ((l.getMonth() + 1) << 5) |
          l.getDate();
      for (const r of e) {
        const o = tt.encode(r.name),
          h = typeof r.data == "string" ? tt.encode(r.data) : r.data,
          F = ot(h),
          g = new DataView(new ArrayBuffer(30));
        (g.setUint32(0, 67324752, !0),
          g.setUint16(4, 20, !0),
          g.setUint16(6, 2048, !0),
          g.setUint16(8, 0, !0),
          g.setUint16(10, d, !0),
          g.setUint16(12, a, !0),
          g.setUint32(14, F, !0),
          g.setUint32(18, h.length, !0),
          g.setUint32(22, h.length, !0),
          g.setUint16(26, o.length, !0),
          g.setUint16(28, 0, !0),
          t.push(new Uint8Array(g.buffer), o, h));
        const m = new DataView(new ArrayBuffer(46));
        (m.setUint32(0, 33639248, !0),
          m.setUint16(4, 20, !0),
          m.setUint16(6, 20, !0),
          m.setUint16(8, 2048, !0),
          m.setUint16(10, 0, !0),
          m.setUint16(12, d, !0),
          m.setUint16(14, a, !0),
          m.setUint32(16, F, !0),
          m.setUint32(20, h.length, !0),
          m.setUint32(24, h.length, !0),
          m.setUint16(28, o.length, !0),
          m.setUint16(30, 0, !0),
          m.setUint16(32, 0, !0),
          m.setUint16(34, 0, !0),
          m.setUint16(36, 0, !0),
          m.setUint32(38, 0, !0),
          m.setUint32(42, i, !0),
          n.push(new Uint8Array(m.buffer), o),
          (i += 30 + o.length + h.length));
      }
      const p = n.reduce((r, o) => r + o.length, 0),
        c = new DataView(new ArrayBuffer(22));
      return (
        c.setUint32(0, 101010256, !0),
        c.setUint16(8, e.length, !0),
        c.setUint16(10, e.length, !0),
        c.setUint32(12, p, !0),
        c.setUint32(16, i, !0),
        new Blob([...t, ...n, new Uint8Array(c.buffer)], { type: K })
      );
    }
    const st = {
      h: { b: 1, c: "FFFFFF", bg: "0F7A55", wrap: 1, bd: "0A5A3F" },
      t: { b: 1, sz: 16, c: "0F7A55" },
      n: { wrap: 1, bd: "E3ECE8" },
      ok: { b: 1, c: "0B6B3A", bg: "DDF5E8", wrap: 1, bd: "FFFFFF" },
      ok2: { c: "0B6B3A", bg: "EEF9F3", wrap: 1, bd: "FFFFFF" },
      av: { c: "8A5A00", bg: "FFF1D6", wrap: 1, bd: "FFFFFF" },
      ruim: { b: 1, c: "A32020", bg: "FDE1E1", wrap: 1, bd: "FFFFFF" },
      vz: { i: 1, c: "9AA5A1", wrap: 1, bd: "EEF2F0" },
      nota: { i: 1, sz: 10, c: "5B6B66" },
      tot: { b: 1, bg: "E6F4EE", bd: "0F7A55" },
      foto: { b: 1, sz: 12, c: "FFFFFF", bg: "0F7A55", v: "center" },
      fsub: { c: "1B2B26", bg: "EEF9F3", wrap: 1 },
      flab: { b: 1, c: "0F7A55" },
      link: { c: "0F7A55", b: 1 },
    };
    function gt() {
      const e = [
          '<font><sz val="11"/><color rgb="FF1B2B26"/><name val="Calibri"/><family val="2"/></font>',
        ],
        t = [
          '<fill><patternFill patternType="none"/></fill>',
          '<fill><patternFill patternType="gray125"/></fill>',
        ],
        n = ["<border><left/><right/><top/><bottom/><diagonal/></border>"],
        i = [],
        l = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'],
        d = {},
        a = (r, o) => {
          let h = r.indexOf(o);
          return (h < 0 && (r.push(o), (h = r.length - 1)), h);
        };
      function p(r) {
        const o = JSON.stringify(r);
        if (d[o] != null) return d[o];
        const h = a(
            e,
            `<font>${r.b ? "<b/>" : ""}${r.i ? "<i/>" : ""}${r.u ? "<u/>" : ""}<sz val="${r.sz || 11}"/><color rgb="FF${r.c || "1B2B26"}"/><name val="Calibri"/><family val="2"/></font>`,
          ),
          F = r.bg
            ? a(
                t,
                `<fill><patternFill patternType="solid"><fgColor rgb="FF${r.bg}"/><bgColor indexed="64"/></patternFill></fill>`,
              )
            : 0,
          g = r.bd
            ? a(
                n,
                `<border><left/><right/><top/><bottom style="thin"><color rgb="FF${r.bd}"/></bottom><diagonal/></border>`,
              )
            : 0;
        let m = 0;
        if (r.fmt) {
          let N = i.indexOf(r.fmt);
          (N < 0 && (i.push(r.fmt), (N = i.length - 1)), (m = 164 + N));
        }
        return (
          l.push(
            `<xf numFmtId="${m}" fontId="${h}" fillId="${F}" borderId="${g}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="${r.v || "center"}"${r.wrap ? ' wrapText="1"' : ""}${r.al ? ` horizontal="${r.al}"` : ""}/></xf>`,
          ),
          (d[o] = l.length - 1)
        );
      }
      function c() {
        return (
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          (i.length
            ? `<numFmts count="${i.length}">${i.map((r, o) => `<numFmt numFmtId="${164 + o}" formatCode="${E(r)}"/>`).join("")}</numFmts>`
            : "") +
          `<fonts count="${e.length}">${e.join("")}</fonts><fills count="${t.length}">${t.join("")}</fills><borders count="${n.length}">${n.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${l.length}">${l.join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
        );
      }
      return { id: p, xml: c };
    }
    const D = {
        data: "dd/mm/yyyy",
        p0: "#,##0",
        p1: "#,##0.0",
        p2: "#,##0.00",
        int: "0",
        money: '+"R$" #,##0.00;-"R$" #,##0.00;"R$" 0.00',
        vez: '+0.00"×";-0.00"×";0.00"×"',
        pct: "0%",
      },
      H = (e) => {
        let t = "";
        for (e++; e; ) {
          const n = (e - 1) % 26;
          ((t = String.fromCharCode(65 + n) + t),
            (e = Math.floor((e - 1) / 26)));
        }
        return t;
      },
      xt = (e, t) => H(e) + (t + 1);
    function $t(e, t) {
      const n = [],
        i = [];
      t.rows.forEach((a, p) => {
        const c = t.alturas && t.alturas[p];
        if (!a) {
          n.push(
            `<row r="${p + 1}"${c ? ` ht="${c}" customHeight="1"` : ""}/>`,
          );
          return;
        }
        const r = a
          .map((o, h) => {
            if (o == null || o === "") return "";
            typeof o != "object" && (o = { v: o });
            const F = Object.assign({}, st[o.s || "n"] || st.n);
            (o.fmt && (F.fmt = o.fmt),
              o.z && !F.bg && (F.bg = "F4F8F6"),
              o.al && (F.al = o.al));
            const g = e.id(F),
              m = xt(h, p);
            return (
              o.link &&
                i.push(
                  `<hyperlink ref="${m}" location="${E(o.link)}" display="${E(o.v)}"/>`,
                ),
              o.f != null
                ? `<c r="${m}" s="${g}"><f>${E(o.f)}</f></c>`
                : typeof o.v == "number" && isFinite(o.v)
                  ? `<c r="${m}" s="${g}"><v>${o.v}</v></c>`
                  : o.v == null || o.v === ""
                    ? `<c r="${m}" s="${g}"/>`
                    : `<c r="${m}" s="${g}" t="inlineStr"><is><t xml:space="preserve">${E(o.v)}</t></is></c>`
            );
          })
          .join("");
        n.push(
          `<row r="${p + 1}"${c ? ` ht="${c}" customHeight="1"` : ""}>${r}</row>`,
        );
      });
      const l = (t.larg || [])
          .map(
            (a, p) =>
              `<col min="${p + 1}" max="${p + 1}" width="${Math.max(4, (a - 5) / 7).toFixed(2)}" customWidth="1"/>`,
          )
          .join(""),
        d = t.congela
          ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>'
          : "";
      return (
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0"${t.ativa ? ' tabSelected="1"' : ""}${t.semGrade ? ' showGridLines="0"' : ""}>${d}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>` +
        (l ? `<cols>${l}</cols>` : "") +
        `<sheetData>${n.join("")}</sheetData>` +
        (t.filtro ? `<autoFilter ref="${t.filtro}"/>` : "") +
        (t.merges && t.merges.length
          ? `<mergeCells count="${t.merges.length}">${t.merges.map((a) => `<mergeCell ref="${a}"/>`).join("")}</mergeCells>`
          : "") +
        (i.length ? `<hyperlinks>${i.join("")}</hyperlinks>` : "") +
        `<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${t.retrato ? "portrait" : "landscape"}" fitToWidth="1" fitToHeight="0"/>` +
        (t.imgs && t.imgs.length ? '<drawing r:id="rId1"/>' : "") +
        "</worksheet>"
      );
    }
    function Ft(e, t, sh) {
      const _cx = (c) => {
          let x = 0;
          for (let i = 0; i < c; i++) {
            const w = sh && sh.larg && sh.larg[i];
            x += w ? Math.floor(Math.max(4, (w - 5) / 7) * 7 + 5) : 64;
          }
          return x;
        },
        _ry = (r) => {
          let y = 0;
          for (let i = 0; i < r; i++) {
            const h = sh && sh.alturas && sh.alturas[i];
            y += Math.round(((h || 15) * 4) / 3);
          }
          return y;
        };
      const l = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${e.map((a, p) => `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${a.col}</xdr:col><xdr:colOff>${a.dx * 9525}</xdr:colOff><xdr:row>${a.row}</xdr:row><xdr:rowOff>57150</xdr:rowOff></xdr:from><xdr:to><xdr:col>${a.col}</xdr:col><xdr:colOff>${(a.dx + a.w) * 9525}</xdr:colOff><xdr:row>${a.row}</xdr:row><xdr:rowOff>${(6 + a.h) * 9525}</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${p + 2}" name="Foto ${p + 1}" descr="${E(a.desc || "")}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${p + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="${(_cx(a.col) + a.dx) * 9525}" y="${(_ry(a.row) + 6) * 9525}"/><a:ext cx="${a.w * 9525}" cy="${a.h * 9525}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln w="9525"><a:solidFill><a:srgbClr val="B9D9CC"/></a:solidFill></a:ln></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`).join("")}</xdr:wsDr>`,
        d = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${e.map((a, p) => `<Relationship Id="rId${p + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/foto${t + p + 1}.jpeg"/>`).join("")}</Relationships>`;
      return { xml: l, rels: d };
    }
    function rt(e) {
      const t = gt(),
        n = [];
      let i = 0,
        l = 0;
      const d = e.map((r) => $t(t, r)),
        a = [
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
          '<Default Extension="xml" ContentType="application/xml"/>',
          '<Default Extension="jpeg" ContentType="image/jpeg"/>',
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
          '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
          '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
        ];
      e.forEach((r, o) => {
        if (
          (a.push(
            `<Override PartName="/xl/worksheets/sheet${o + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          ),
          n.push({ name: `xl/worksheets/sheet${o + 1}.xml`, data: d[o] }),
          r.imgs && r.imgs.length)
        ) {
          l++;
          const h = Ft(r.imgs, i, r);
          (n.push({
            name: `xl/worksheets/_rels/sheet${o + 1}.xml.rels`,
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${l}.xml"/></Relationships>`,
          }),
            n.push(
              { name: `xl/drawings/drawing${l}.xml`, data: h.xml },
              { name: `xl/drawings/_rels/drawing${l}.xml.rels`, data: h.rels },
            ),
            a.push(
              `<Override PartName="/xl/drawings/drawing${l}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`,
            ),
            r.imgs.forEach((F) => {
              (i++, n.push({ name: `xl/media/foto${i}.jpeg`, data: F.bytes }));
            }));
        }
      });
      const p = e.map((r) => r.nome.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31)),
        c = e
          .map((r, o) =>
            r.filtro
              ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${o}" hidden="1">'${p[o].replace(/'/g, "''")}'!${r.filtro.replace(/([A-Z]+)(\d+)/g, "$$$1$$$2")}</definedName>`
              : "",
          )
          .join("");
      return (
        n.unshift(
          {
            name: "[Content_Types].xml",
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${a.join("")}</Types>`,
          },
          {
            name: "_rels/.rels",
            data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
          },
          {
            name: "docProps/core.xml",
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Diário de Trader</dc:title><dc:creator>Diário de Trader</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`,
          },
          {
            name: "docProps/app.xml",
            data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Diário de Trader</Application></Properties>',
          },
          {
            name: "xl/workbook.xml",
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${p.map((r, o) => `<sheet name="${E(r)}" sheetId="${o + 1}" r:id="rId${o + 1}"/>`).join("")}</sheets>${c ? `<definedNames>${c}</definedNames>` : ""}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
          },
          {
            name: "xl/_rels/workbook.xml.rels",
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${e.map((r, o) => `<Relationship Id="rId${o + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${o + 1}.xml"/>`).join("")}<Relationship Id="rId${e.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
          },
          { name: "xl/styles.xml", data: t.xml() },
        ),
        nt(n)
      );
    }
    const wt = (e) =>
      String(e)
        .replace(
          /&#10;/g,
          `
`,
        )
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
    function vt(e) {
      return e
        .split(/<Row[^>]*>/)
        .slice(1)
        .map((t) =>
          [...t.matchAll(/<Data ss:Type="[^"]+">([\s\S]*?)<\/Data>/g)].map(
            (n) => wt(n[1]),
          ),
        );
    }
    const B = (e) => {
        if (e == null || e === "") return null;
        const t = +String(e).replace(",", ".");
        return isFinite(t) ? t : null;
      },
      z = (e) => (e == null ? null : Math.round(e * 100) / 100),
      bt = (...e) =>
        Math.min(
          2,
          Math.max(
            0,
            ...e
              .filter((t) => t != null)
              .map((t) => {
                const n = String(t),
                  i = n.indexOf(".");
                return i < 0 ? 0 : Math.min(2, n.length - i - 1);
              }),
          ),
        ),
      yt = (e, t, n) =>
        (Date.UTC(e, t - 1, n) - Date.UTC(1899, 11, 30)) / 864e5;
    function Tt(e) {
      const t = e[0] || [],
        n = t.indexOf("data"),
        i = t.indexOf("ativo"),
        l = t.indexOf("entrada"),
        d = C(() => S.trades, []),
        a = new Set(),
        p = [];
      for (const c of e.slice(1)) {
        const r =
          d.find(
            (o) =>
              !a.has(o) &&
              String(o.dt) === c[n] &&
              String(o.ativo) === c[i] &&
              String(o.entry ?? "") === String(c[l] ?? ""),
          ) ||
          d.find(
            (o) =>
              !a.has(o) && String(o.dt) === c[n] && String(o.ativo) === c[i],
          );
        r && (a.add(r), p.push(r));
      }
      return p.sort((c, r) => String(c.dt).localeCompare(String(r.dt)));
    }
    const at = [
      ["pplan", "Plano"],
      ["pin", "Entrada"],
      ["pout", "Saída"],
    ];
    async function St(e) {
      let t = C(() => M[e], null);
      if (
        (t ||
          (t = await C(() => idb("img", "get", e), Promise.resolve(null)).catch(
            () => null,
          )),
        !t && C(() => SESS && SESS.uid, null))
      )
        try {
          t = await (
            await rq(
              "/storage/v1/object/authenticated/fotos/" +
                SESS.uid +
                "/" +
                e +
                ".jpg",
            )
          ).blob();
        } catch {
          t = null;
        }
      if (!t) return null;
      try {
        const n = await createImageBitmap(t),
          i = Math.min(1, 1100 / Math.max(n.width, n.height)),
          l = Math.max(1, Math.round(n.width * i)),
          d = Math.max(1, Math.round(n.height * i)),
          a = Y.createElement("canvas");
        ((a.width = l), (a.height = d));
        const p = a.getContext("2d");
        ((p.fillStyle = "#fff"),
          p.fillRect(0, 0, l, d),
          p.drawImage(n, 0, 0, l, d));
        const c = await new Promise((r) => a.toBlob(r, "image/jpeg", 0.84));
        return { bytes: new Uint8Array(await c.arrayBuffer()), w: l, h: d };
      } catch {
        return null;
      }
    }
    const At = (e) => {
      const t = String(e || ""),
        [n, i, l] = t.slice(0, 10).split("-"),
        d = new Date(t.slice(0, 10) + "T12:00").getDay();
      return {
        y: +n,
        m: +i,
        d: +l,
        txt: l + "/" + i + "/" + n,
        sem: ft[d] || "",
        hora: t.slice(11, 16),
      };
    };
    /* Duração do trade (entrada → saída) em texto curto: "12 min" ou "1h05". */
    function duracaoTxt(t) {
      const a = Date.parse(t && t.dt),
        b = Date.parse(t && t.dtx);
      if (!isFinite(a) || !isFinite(b) || b < a) return "";
      const m = Math.round((b - a) / 6e4);
      return m < 60 ? m + " min" : Math.floor(m / 60) + "h" + String(m % 60).padStart(2, "0");
    }
    async function lt(e, t) {
      const n = e.find((s) => /ss:Name="Opera/.test(s)),
        i = e.some((s) => /ss:Name="Checklist"/.test(s)),
        l = n ? vt(n) : [[]],
        d = Tt(l),
        a = [
          "Data",
          "Dia",
          "Hora entrada",
          "Hora saída",
          "Duração",
          "Ativo",
          "Tipo",
          "Lado",
          "Setup",
          "Mercado",
          "Qtd",
          "Entrada",
          "Stop",
          "Alvo",
          "Saída",
          "Pontos",
          "Risco (R$)",
          "Resultado (R$)",
          "Resultado (× risco)",
          "Seguiu as regras",
          "Erro",
          "Emocional",
          "Nota",
          "Fotos",
        ],
        p = [
          84, 40, 56, 56, 62, 78, 82, 62, 220, 90, 44, 74, 74, 74, 74, 62, 82, 100,
          100, 90, 170, 110, 240, 96,
        ],
        c = [a.map((s) => ({ v: s, s: "h" }))],
        r = [];
      let o = null,
        h = !1;
      d.forEach((s) => {
        const f = C(() => calc(s), {}) || {},
          $ = At(s.dt);
        $.txt !== o && ((h = !h), (o = $.txt));
        const v = B(s.entry),
          A = B(s.stop),
          Z = B(s.target),
          O = B(s.exit),
          V = B(s.qty),
          q = s.side === "V" || s.side === "S" ? -1 : 1,
          k = v != null && O != null ? z((O - v) * q) : null,
          w = D["p" + bt(s.entry, s.stop, s.exit, s.target)],
          U = z(f.risk),
          T = z(f.pl),
          I = typeof f.r == "number" && isFinite(f.r) ? z(f.r) : null,
          P = String(s.rules || "").toLowerCase(),
          R = at.filter(([J]) => s[J]),
          u = (J, It) => Object.assign({ v: J, z: h }, It || {});
        (c.push([
          u(yt($.y, $.m, $.d), { fmt: D.data }),
          u($.sem),
          u($.hora),
          u(s.dtx && O != null ? At(s.dtx).hora : ""),
          u(duracaoTxt(s)),
          u(s.ativo || "", { s: "n" }),
          u(ut[s.tipo || "D"] || s.tipo || ""),
          u(
            s.side === "C" ? "Compra" : s.side === "V" ? "Venda" : s.side || "",
          ),
          u(s.setup || ""),
          u(s.mkt || ""),
          u(V, { fmt: D.int }),
          u(v, { fmt: w }),
          u(A, { fmt: w }),
          u(Z, { fmt: w }),
          O == null ? u("em aberto", { s: "vz" }) : u(O, { fmt: w }),
          k == null
            ? u("")
            : u(k, { fmt: w, s: k > 0 ? "ok2" : k < 0 ? "ruim" : "n" }),
          U == null ? u("") : u(U, { fmt: '"R$" #,##0.00' }),
          T == null
            ? u("—", { s: "vz" })
            : u(T, { fmt: D.money, s: T > 0 ? "ok" : T < 0 ? "ruim" : "n" }),
          I == null
            ? u("—", { s: "vz" })
            : u(I, { fmt: D.vez, s: I > 0 ? "ok" : I < 0 ? "ruim" : "n" }),
          P === "s" || P === "sim"
            ? u("Sim", { s: "ok" })
            : P === "n" || P === "não" || P === "nao"
              ? u("Não", { s: "ruim" })
              : u("—", { s: "vz" }),
          u(s.err && s.err !== "Nenhum" ? s.err : "", {
            s: s.err && s.err !== "Nenhum" ? "av" : "n",
          }),
          u(s.emo || ""),
          u(s.nota || ""),
          R.length
            ? u(R.length + (R.length > 1 ? " fotos ›" : " foto ›"), {
                s: "link",
              })
            : u(""),
        ]),
          R.length &&
            r.push({
              t: s,
              row: c.length - 1,
              fs: R,
              c: f,
              dt: $,
              pl: T,
              xr: I,
            }));
      });
      const F = c.length;
      if (d.length) {
        const s = (f) => `${f}2:${f}${F}`;
        (c.push([
          { v: "Total", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { f: `SUBTOTAL(3,${s("F")})&" trades"`, s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          {
            f: `IFERROR(TEXT(COUNTIFS(${s("R")},">0")/COUNT(${s("R")}),"0%")&" de acerto","")`,
            s: "tot",
          },
          { v: "", s: "tot" },
          { f: `SUBTOTAL(9,${s("K")})`, s: "tot", fmt: D.int },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { f: `SUBTOTAL(9,${s("Q")})`, s: "tot", fmt: '"R$" #,##0.00' },
          { f: `SUBTOTAL(9,${s("R")})`, s: "tot", fmt: D.money },
          { f: `SUBTOTAL(9,${s("S")})`, s: "tot", fmt: D.vez },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
          { v: "", s: "tot" },
        ]),
          c.push(null),
          c.push([
            {
              v: "A linha Total soma só o que estiver visível quando você usa o filtro (por dia, ativo, setup…). × risco: +1,00× = ganhou o mesmo que arriscou.",
              s: "nota",
            },
          ]));
      }
      const g = {
          nome: "Operações",
          rows: c,
          larg: p,
          congela: 1,
          ativa: 1,
          filtro: `A1:${H(a.length - 1)}${F}`,
          alturas: { 0: 30 },
        },
        m = [],
        N = [],
        X = [],
        y = {};
      let x = 0;
      const L = 390;
      (m.push([{ v: "Fotos dos trades", s: "t" }]),
        (y[0] = 26),
        x++,
        m.push([
          {
            v: 'Cada trade aparece com o dia, o ativo e o resultado em cima das fotos. Em Operações, toque em "foto ›" para vir direto ao trade.',
            s: "nota",
          },
        ]),
        x++,
        m.push(null),
        x++);
      let ct = 0,
        W = 0;
      for (const s of r) {
        const { t: f, dt: $, pl: v, xr: A } = s,
          Z = `${$.txt} · ${$.sem} · ${$.hora}  —  ${f.ativo || ""} · ${f.side === "C" ? "Compra" : f.side === "V" ? "Venda" : ""} · ${f.qty || ""} contrato(s)`;
        (m.push([
          { v: Z, s: "foto" },
          { v: "", s: "foto" },
          { v: "", s: "foto" },
        ]),
          (y[x] = 24),
          X.push(`A${x + 1}:C${x + 1}`),
          (c[s.row][23].link = `'Fotos'!A${x + 1}`),
          x++);
        const O = [
          `Setup: ${f.setup || "—"}`,
          v != null
            ? `Resultado: ${pt(v)}${A != null ? " (" + dt(A) + ")" : ""}`
            : "Em aberto",
          f.rules
            ? `Seguiu as regras: ${/^s/i.test(f.rules) ? "Sim" : "Não"}`
            : "",
          f.err && f.err !== "Nenhum" ? `Erro: ${f.err}` : "",
          f.nota ? `Nota: ${f.nota}` : "",
        ]
          .filter(Boolean)
          .join("  ·  ");
        (m.push([
          { v: O, s: "fsub" },
          { v: "", s: "fsub" },
          { v: "", s: "fsub" },
        ]),
          X.push(`A${x + 1}:C${x + 1}`),
          (y[x] = Math.min(60, 18 * Math.ceil(O.length / 150) + 4)),
          x++);
        const V = [],
          q = [];
        for (const [w, U] of s.fs) {
          const T = await St(f[w]);
          if ((ct++, t && t(ct), !T)) {
            (W++,
              V.push({ v: U + " — foto não está neste aparelho", s: "vz" }),
              q.push(null));
            continue;
          }
          (V.push({ v: U, s: "flab" }), q.push(T));
        }
        (m.push(V), (y[x] = 20), x++);
        let k = 0;
        (q.forEach((w, U) => {
          if (!w) return;
          const T = Math.round((L * w.h) / w.w),
            I = Math.min(T, 520),
            P = T > 520 ? Math.round((520 * w.w) / w.h) : L;
          (N.push({
            bytes: w.bytes,
            w: P,
            h: I,
            col: U,
            row: x,
            dx: 4,
            desc: `${$.txt} ${f.ativo} ${at.find((R) => R[0] === s.fs[U][0])[1]}`,
          }),
            (k = Math.max(k, I)));
        }),
          m.push(null),
          (y[x] = k ? Math.min(409, Math.ceil((k + 14) * 0.75)) : 20),
          x++,
          m.push(null),
          (y[x] = 18),
          x++);
      }
      (r.length
        ? W &&
          (m.splice(2, 1, [
            {
              v: `${W} foto(s) não estavam neste aparelho nem na sua conta e ficaram de fora.`,
              s: "av",
            },
            { v: "", s: "av" },
            { v: "", s: "av" },
          ]),
          X.push("A3:C3"))
        : (m.push([{ v: "Nenhum trade deste período tem foto.", s: "vz" }]),
          x++),
        (y[1] = y[1] || 18),
        (y[2] = y[2] || 20));
      const Ut = {
          nome: "Fotos",
          rows: m,
          larg: [L + 10, L + 10, L + 10],
          imgs: N,
          merges: X,
          alturas: y,
          semGrade: 1,
          retrato: 1,
        },
        j = [],
        Q = (s) =>
          s.map((f) => (f ? f.map(([$, v]) => ({ v: $, s: v })) : null));
      if (i && b.DIARIO_V506 && b.DIARIO_V506.dados) {
        const s = b.DIARIO_V506.dados();
        (j.push({
          nome: "Checklist",
          rows: Q(s.ck),
          larg: s.larg,
          congela: 1,
          filtro: `A1:${H(s.ck[0].length - 1)}${s.ck.length}`,
          alturas: { 0: 30 },
        }),
          j.push({
            nome: "Resumo",
            rows: Q(s.resumo),
            larg: [330, 150, 120, 130],
            semGrade: 1,
            alturas: { 0: 26 },
          }),
          j.push({
            nome: "Como ler",
            rows: Q(s.legenda),
            larg: [150, 640],
            semGrade: 1,
            alturas: { 0: 26 },
          }));
      }
      const mt = (s) =>
        s.map((f, $) =>
          f.map((v) => {
            if ($ === 0) return { v, s: "h" };
            const A = B(v);
            return A != null && /^-?[\d.]+$/.test(String(v).trim())
              ? { v: z(A) === A ? A : +A.toFixed(6) }
              : { v };
          }),
        );
      if (i) {
        const s = C(() => checklistLinhas(), null);
        s &&
          j.push({
            nome: "Checklist (dados)",
            rows: mt(s.map((f) => f.map(String))),
            congela: 1,
          });
      }
      {
        const _d = C(
          () => (b.DIARIO_V554_DESEMP ? b.DIARIO_V554_DESEMP(d) : null),
          null,
        );
        _d && j.unshift(_d);
      }
      return (
        j.push({ nome: "Operações (dados)", rows: mt(l), congela: 1 }),
        rt([g, Ut, ...j])
      );
    }
    const _ = "\0v507xlsx:",
      G = {};
    function kt() {
      if (typeof b.xlsArquivo != "function" || typeof b.saveFile != "function")
        return !1;
      if (b.xlsArquivo.__v507) return !0;
      const e = b.xlsArquivo,
        t = function (l) {
          const d = e.apply(this, arguments);
          try {
            if (Array.isArray(l) && l.some((a) => /ss:Name="Opera/.test(a))) {
              const a = Date.now() + "-" + Math.random().toString(36).slice(2);
              return (
                (G[a] = { abas: l, xml: d }),
                setTimeout(() => {
                  delete G[a];
                }, 12e4),
                _ + a
              );
            }
          } catch {}
          return d;
        };
      ((t.__v507 = 1), (b.xlsArquivo = t));
      const n = b.saveFile,
        i = async function (l, d, a) {
          if (typeof d == "string" && d.startsWith(_)) {
            const p = G[d.slice(_.length)];
            if ((delete G[d.slice(_.length)], !p)) return;
            try {
              C(() => toast("Montando a planilha com as fotos…", 2500));
              const c = await lt(p.abas);
              return n.call(
                this,
                String(l).replace(/\.xls$/i, "") + ".xlsx",
                c,
                K,
              );
            } catch (c) {
              return (
                console.error("[v507] planilha .xlsx", c),
                n.call(this, l, p.xml, a)
              );
            }
          }
          return n.apply(this, arguments);
        };
      return ((i.__v507 = 1), (b.saveFile = i), !0);
    }
    let it = 0;
    const Dt = setInterval(() => {
      (it++, (kt() || it > 30) && clearInterval(Dt));
    }, 500);
    b.DIARIO_V507 = { monta: lt, livro: rt, zip: nt, crc32: ot };
  })(window);
} catch (e) {
  console.error("[v522] falha em planilha-v507.js", e);
}
try {
  (function (l) {
    "use strict";
    const i = l.document;
    if (!i) return;
    const d = (t, a) => {
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
      B = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
      h = () =>
        d(() => loc().slice(0, 10), new Date().toISOString().slice(0, 10)),
      b = (t) =>
        t.split("-").reverse().slice(0, 2).join("/") +
        " (" +
        B[new Date(t + "T12:00").getDay()] +
        ")",
      I = () => l.DIARIO_V506,
      T = i.createElement("style");
    ((T.textContent = `
.v508-falta{margin:4px 0 16px;padding:12px 16px;border-radius:8px;border:1px solid var(--d-line,#373a3f);background:var(--d-raised,#17181a)}
.v508-falta.ok{border-color:var(--d-pos,#4ec489);background:rgba(78,196,137,0.08)}
.v508-falta.ruim{border-color:var(--d-neg,#eb7f6f);background:rgba(235,127,111,0.07)}
.v508-falta h3{margin:0 0 8px;font-size:15px;color:var(--d-text,#efeeeb);display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.v508-falta h3 small{font-size:12px;font-weight:600;color:var(--d-muted,#9ca0a9)}
.v508-grupo{margin:8px 0 0}
.v508-grupo b{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--d-muted,#9ca0a9);margin-bottom:4px}
.v508-grupo ul{margin:0;padding:0 0 0 16px;font-size:14px;line-height:1.5;color:var(--d-text,#efeeeb)}
.v508-acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.v508-acoes button,.v508-ontem button{min-height:40px;padding:0 16px;border-radius:8px;border:1px solid var(--d-line,#373a3f);background:var(--d-surface,#0d0d0e);color:var(--d-text,#efeeeb);font-weight:700;font-size:13px;cursor:pointer}
.v508-acoes button.pri,.v508-ontem button{background:var(--d-accent-strong,#3b3e43);border-color:transparent;color:#ffffff}
.v508-nf{margin-top:8px;font-size:13px;line-height:1.45;color:var(--d-muted,#9ca0a9)}
.v508-acoes button:disabled{opacity:.6;cursor:default}
.v508-seq{margin-top:8px;font-size:13px;color:var(--d-muted,#9ca0a9)}
.v508-seq b{color:var(--d-text,#efeeeb)}
.v508-ontem{margin:0 0 12px;padding:12px 16px;border-radius:8px;border:1px solid var(--d-neg,#eb7f6f);background:rgba(235,127,111,0.08);color:var(--d-text,#efeeeb);font-size:14px;line-height:1.45}
.v508-ontem p{margin:0 0 8px}
#gateov .v508-ontem{margin:0 0 16px;color:inherit}
#gateov .v508-x{float:right;min-height:36px;padding:0 12px;border-radius:8px;border:1px solid currentColor;background:none;color:inherit;font-weight:700;cursor:pointer;opacity:.85}
html[data-v508-semmesa] [data-dt414-go="mesa"]{display:none!important}
`),
      (i.head || i.documentElement).appendChild(T));
    function x(t) {
      const a = I();
      if (!a) return null;
      const e = a.diaInfo(t);
      return {
        i: e,
        f: a.faltou(e),
        disc: a.disciplina(e),
        vazio: a.vazioDia(e),
      };
    }
    function z() {
      const t = I();
      if (!t) return { atual: 0, recorde: 0 };
      const a = h(),
        e = t
          .dias()
          .filter((n) => n <= a)
          .map((n) => ({ d: n, x: x(n) }))
          .filter((n) => n.x && n.x.i.trades);
      let o = 0,
        r = 0;
      for (const n of e)
        n.x.disc >= 0.8 ? (r++, (o = Math.max(o, r))) : (r = 0);
      let s = 0;
      for (let n = e.length - 1; n >= 0; n--) {
        const c = e[n];
        if (c.x.disc >= 0.8) s++;
        else {
          if (c.d === a) continue;
          break;
        }
      }
      return { atual: s, recorde: o };
    }
    let qMemo = { k: "", t: 0, v: null };
    function q() {
      // v566: o resumo "dia anterior sem foto" percorre todos os dias; guarda por 5 s para não pesar em cada troca de aba.
      const qk = h() + ":" + d(() => S.trades.length, 0);
      if (qMemo.k === qk && Date.now() - qMemo.t < 5000) return qMemo.v;
      const qv = q0();
      qMemo = { k: qk, t: Date.now(), v: qv };
      return qv;
    }
    function q0() {
      const t = I();
      if (!t) return null;
      const a = h(),
        e = t
          .dias()
          .filter((n) => n < a)
          .filter((n) => {
            const c = x(n);
            return c && c.i.trades;
          })
          .sort(),
        o = e[e.length - 1];
      if (!o) return null;
      const s = x(o).f.filter((n) => n.k === "foto");
      return s.length ? { d: o, f: s } : null;
    }
    const _ = {
      pre: ["hoje", "Abrir checklist de hoje"],
      regras: ["regras", "Marcar as regras"],
      trades: ["fechar", "Corrigir os trades"],
      posop: ["fechar", "Fazer o diário pós-operação"],
    };
    let y = !1,
      A = 0;
    function R() {
      const t = d(() => GATE_D(), h()),
        a = d(() => S.days[t], {}) || {},
        e = a.cl || {};
      return a.ckok
        ? null
        : {
            tipo: "manha",
            falta: [
              ...(a.estado ? [] : ["estado"]),
              ...d(() => GATE_PLANO, ["p_limite", "p_meta", "p_stop"]).filter(
                (r) => !e[r],
              ),
            ],
            dia: a,
            c: a.chk || {},
            cl: e,
          };
    }
    function P() {
      if (typeof l.gateEstado != "function" || l.gateEstado.__v508) return;
      const t = l.gateEstado,
        a = function () {
          if (A > Date.now()) return null;
          if (y) {
            const e = R();
            if (e) return e;
            y = !1;
          }
          return t.apply(this, arguments);
        };
      if (
        ((a.__v508 = 1),
        (l.gateEstado = a),
        typeof l.gateHtml == "function" && !l.gateHtml.__v508)
      ) {
        const e = l.gateHtml,
          o = function (r) {
            let s = e.apply(this, arguments);
            try {
              if (r && r.tipo === "manha") {
                y &&
                  (s = s.replace(
                    '<div class="gc">',
                    '<div class="gc"><button type="button" class="v508-x" data-v508fecha="1">Fechar</button>',
                  ));
                const n = q();
                n &&
                  (s = s.replace(
                    /(<h2>[^<]*<\/h2>)/,
                    `$1<div class="v508-ontem"><p><b>${p(b(n.d))} tem trade sem foto:</b> ${p(n.f.map((c) => c.txt).join(" · "))}.</p><button type="button" data-v508ontem="${n.d}">Ver ${p(n.d.split("-").reverse().slice(0, 2).join("/"))}</button></div>`,
                  ));
              }
            } catch {}
            return s;
          };
        ((o.__v508 = 1), (l.gateHtml = o));
      }
    }
    function V() {
      ((y = !0), (A = 0));
      try {
        gateAtualiza();
      } catch {}
    }
    function w(t) {
      try {
        ((A = Date.now() + 15 * 6e4), (y = !1));
        const a = i.getElementById("gateov");
        (a && a.remove(), (D = t), (tab = "dia"), (DV = "ed"));
        try {
          mdmSet("br");
        } catch {}
        try {
          DFASE = { d: t, f: "pos" };
        } catch {}
        (irPara(tab), scrollTo(0, 0));
      } catch {}
    }
    const G = () => {
      const t = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
      );
      return t.getHours() + t.getMinutes() / 60;
    };
    function U(t) {
      const a = x(t);
      if (a) {
        if (
          a.f.some((e) => e.k === "foto" || e.k === "seguiu" || e.k === "stop")
        ) {
          d(() =>
            toast("Corrija os trades desse dia antes de concluir.", 2600),
          );
          return;
        }
        try {
          const e = S.days[t] ?? (S.days[t] = { chk: {} });
          ((e.posop = Date.now()),
            (e.u = Date.now()),
            save(),
            render(),
            d(() => toast("Diário de " + b(t) + " concluído.", 2600)));
        } catch {}
      }
    }
    function W() {
      const t = i.querySelector("#app .dt393-checklist");
      if (!t) return;
      const e = i.querySelector("#app .dt393-phase") || t,
        o = d(() => D, h()),
        r = x(o);
      if (!r) return;
      const s = o === h();
      let n = i.getElementById("v508-falta");
      (!n || n.nextElementSibling !== e) &&
        (n && n.remove(),
        (n = i.createElement("div")),
        (n.id = "v508-falta"),
        e.before(n));
      const c = z(),
        f = `<div class="v508-seq">Sequência: <b>${c.atual} dia${c.atual === 1 ? "" : "s"} completo${c.atual === 1 ? "" : "s"}</b> seguidos · recorde <b>${c.recorde}</b> <span>(dia completo = disciplina de 80% ou mais)</span></div>`;
      let m;
      const $ = s ? r.f : r.f.filter((v) => v.k === "foto"),
        H = s ? [] : r.f.filter((v) => v.k !== "foto"),
        E = (v) => $.some((u) => u.k === v),
        L = E("foto") || E("seguiu") || E("stop"),
        j = s
          ? ""
          : '<button type="button" data-v508="hojeVolta">← Voltar para hoje</button>',
        F = H.length
          ? `<div class="v508-nf">Não feito no dia (fica registrado na disciplina; preencher de memória depois não seria fiel): ${p(H.map((v) => v.txt).join(" · "))}.</div>`
          : "",
        ee = s ? "O que falta hoje" : "Fechamento de " + p(b(o));
      if (r.vazio && !s)
        ((m = `<h3>Nada registrado em ${p(b(o))}</h3><div class="v508-acoes">${j}</div>${f}`),
          (n.className = "v508-falta"));
      else if (!$.length)
        ((m = `<h3>✓ ${s ? "Dia completo" : "Fechamento completo"} <small>disciplina ${Math.round(r.disc * 100)}%</small></h3><div style="font-size:14px">${s ? "Nada faltando hoje." : "Nada mais para corrigir em " + p(b(o)) + "."}</div>${F}${j ? `<div class="v508-acoes">${j}</div>` : ""}${f}`),
          (n.className = "v508-falta ok"));
      else {
        const v = {
          pre: ["Antes de operar", []],
          dur: ["Durante", []],
          pos: ["Depois do pregão", []],
        };
        $.forEach((g) => v[g.fase][1].push(g.txt));
        const u = [];
        (s &&
          $.some((g) => g.fase === "pre") &&
          u.push(
            `<button type="button" class="pri" data-v508="hoje">${_.pre[1]}</button>`,
          ),
          E("regras") &&
            u.push(
              `<button type="button" data-v508="regras">${_.regras[1]}</button>`,
            ),
          L &&
            u.push(
              `<button type="button"${s ? "" : ' class="pri"'} data-v508="trades" data-d="${o}">${s ? _.trades[1] : "Adicionar as fotos"}</button>`,
            ),
          s &&
            E("posop") &&
            (!s || G() >= 17
              ? L
                ? u.push(
                    '<button type="button" disabled>Corrija os trades para concluir o diário</button>',
                  )
                : u.push(
                    `<button type="button" class="pri" data-v508="concluir" data-d="${o}">Concluir o diário de ${s ? "hoje" : p(o.split("-").reverse().slice(0, 2).join("/"))}</button>`,
                  )
              : u.push(
                  '<button type="button" disabled title="Libera depois das 17h">Diário pós-operação: depois das 17h</button>',
                )),
          j && u.push(j),
          (m =
            `<h3>${ee} <small>${$.length} ${$.length === 1 ? "item" : "itens"} · disciplina ${Math.round(r.disc * 100)}%</small></h3>` +
            Object.values(v)
              .filter((g) => g[1].length)
              .map(
                ([g, te]) =>
                  `<div class="v508-grupo"><b>${g}</b><ul>${te.map((ae) => `<li>${p(ae)}</li>`).join("")}</ul></div>`,
              )
              .join("") +
            F +
            (u.length ? `<div class="v508-acoes">${u.join("")}</div>` : "") +
            f),
          (n.className = "v508-falta " + (r.disc < 0.4 ? "ruim" : "")));
      }
      n.dataset.h !== m && ((n.dataset.h = m), (n.innerHTML = m));
    }
    function Z() {
      const t = i.querySelector("#app .dt393-checklist");
      if (!t) return;
      const a = d(() => D, h()),
        e = a < h();
      t.querySelectorAll("input[data-chk]").forEach((r) => {
        e
          ? r.disabled || ((r.disabled = !0), (r.dataset.v508trava = "1"))
          : r.dataset.v508trava &&
            ((r.disabled = !1), delete r.dataset.v508trava);
      });
      let o = i.getElementById("v508-trava");
      e
        ? o ||
          ((o = i.createElement("div")),
          (o.id = "v508-trava"),
          (o.className = "v508-nf"),
          (o.textContent =
            "Checklist de dia que já passou: fica como estava. Só dá para marcar no próprio dia."),
          t.before(o))
        : o && o.remove();
    }
    function J() {
      const t = d(() => tab, ""),
        a = i.getElementById("v508-ontem");
      if (t !== "home" && t !== "dia") {
        a && a.remove();
        return;
      }
      const e = q();
      if (!e || (t === "dia" && d(() => D, "") === e.d)) {
        a && a.remove();
        return;
      }
      const o = i.getElementById("app");
      if (!o) return;
      let r = null,
        s = 1e9;
      for (const f of o.querySelectorAll(".v4-panel, .card, section")) {
        if (
          f.id === "v508-ontem" ||
          f.closest("#v508-ontem") ||
          !f.offsetParent
        )
          continue;
        const m = f.getBoundingClientRect();
        if (m.height > 40) {
          // v566: o primeiro cartão visível na ordem do documento basta (evita medir a tela inteira a cada troca de aba).
          r = f;
          break;
        }
      }
      if (!r) return;
      const n = `<p><b>${p(b(e.d))} tem trade sem foto:</b> ${p(e.f.map((f) => f.txt).join(" · "))}. Adicione antes de operar de novo.</p><button type="button" data-v508ontem="${e.d}">Ver ${p(e.d.split("-").reverse().slice(0, 2).join("/"))}</button>`;
      let c = a;
      ((!c || c.nextElementSibling !== r) &&
        (c && c.remove(),
        (c = i.createElement("div")),
        (c.id = "v508-ontem"),
        (c.className = "v508-ontem"),
        c.setAttribute("role", "alert"),
        r.before(c)),
        c.dataset.h !== n && ((c.dataset.h = n), (c.innerHTML = n)));
    }
    function K() {
      const t = i.querySelector("#app .dt393-checklist");
      if (!t) return;
      const a = d(() => D, ""),
        e = d(() => (S.days[a] || {}).chk, {}) || {},
        o = d(() => S.rules, []).find((r) => !e[r.id]);
      if (o && l.DIARIO_V505 && l.DIARIO_V505.aplicaFase) {
        const r = ["pre", "during", "post"].includes(o.phase)
          ? o.phase
          : [0, 2].includes(+o.cat)
            ? "pre"
            : "during";
        l.DIARIO_V505.aplicaFase(r);
      }
      t.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    i.addEventListener(
      "click",
      (t) => {
        const a =
          t.target.closest &&
          t.target.closest("[data-v508],[data-v508ontem],[data-v508fecha]");
        if (!a) return;
        if ((t.preventDefault(), t.stopPropagation(), a.dataset.v508fecha)) {
          ((y = !1), (A = Date.now() + 60 * 6e4));
          const o = i.getElementById("gateov");
          o && o.remove();
          return;
        }
        if (a.dataset.v508ontem) {
          w(a.dataset.v508ontem);
          return;
        }
        const e = a.dataset.v508;
        if (e === "hoje") V();
        else if (e === "regras") K();
        else if (e === "fechar") w(a.dataset.d || h());
        else if (e === "trades")
          try {
            (irPara("ops"), scrollTo(0, 0));
          } catch {}
        else if (e === "hojeVolta")
          try {
            ((D = h()), (DFASE = null), render(), scrollTo(0, 0));
          } catch {}
        else e === "concluir" && U(a.dataset.d);
      },
      !0,
    );
    const Q = [
      [
        /ficaram com corretora, bolsa, mesas e governo\./,
        "ficaram com corretora, bolsa e governo.",
      ],
      [/\s*Taxas das mesas: preencha em Mesa[^.]*\.?/, ""],
      [
        / e Forex\/mesa pela al[íi]quota informada \(a tributa[çc][ãa]o de payout de mesa propriet[áa]ria varia: confirme com um contador\)/,
        " e Forex pela alíquota informada",
      ],
      [/,? e que numa mesa propriet[áa]ria reprova o teste na hora\./, "."],
    ];
    function M() {
      i.documentElement.setAttribute("data-v508-semmesa", "");
      try {
        if (S && S.ax && !S.ax.mesaOff) {
          S.ax.mesaOff = 1;
          try {
            save();
          } catch {}
          try {
            mesaMenu();
          } catch {}
        }
      } catch {}
      const t = d(() => tab, "");
      if (t === "mesa" || t === "prop") {
        try {
          (irPara("home"), scrollTo(0, 0));
        } catch {}
        return;
      }
      (i.querySelectorAll("[data-mesaon]").forEach((e) => {
        const o = e.closest(".card") || e;
        o.style.display = "none";
      }),
        i
          .querySelectorAll('[data-dt414-go="mesa"]')
          .forEach((e) => e.style.setProperty("display", "none", "important")),
        i
          .querySelectorAll("#app label, #app .card, #onb div, #onb label")
          .forEach((e) => {
            if (e.dataset.v508m) return;
            const o = (e.textContent || "").trim();
            if (
              (e.tagName === "LABEL" &&
                /^Repasse das mesas/.test(o) &&
                ((e.style.display = "none"), (e.dataset.v508m = "1")),
              e.closest("#onb") &&
                e.tagName === "DIV" &&
                e.children.length <= 1 &&
                /^Est[áa] fazendo teste em mesa propriet[áa]ria\?$/.test(o))
            ) {
              ((e.style.display = "none"), (e.dataset.v508m = "1"));
              let r = e.nextElementSibling;
              for (
                ;
                r &&
                /mesa/i.test(r.outerHTML) &&
                !/data-onbx/.test(r.outerHTML);

              )
                ((r.style.display = "none"), (r = r.nextElementSibling));
            }
          }));
      const a = i.getElementById("app");
      for (const e of [a, i.getElementById("trvb")]) {
        if (!e) continue;
        const o = i.createTreeWalker(e, 4);
        let r;
        for (; (r = o.nextNode()); ) {
          const s = r.nodeValue;
          if (!/mesa/i.test(s)) continue;
          let n = s;
          for (const [c, f] of Q) n = n.replace(c, f);
          n !== s && (r.nodeValue = n);
        }
      }
    }
    let N = 0;
    const k = () => {
        try {
          W();
        } catch {}
        try {
          Z();
        } catch {}
        try {
          J();
        } catch {}
        try {
          M();
        } catch {}
      },
      O = () => {
        // v566: fora do caminho da troca de aba; roda logo depois da pintura.
        (clearTimeout(N), (N = setTimeout(k, 40)));
      };
    function X() {
      if (typeof l.render0 != "function" || l.render0.__v508) return;
      const t = l.render0,
        a = function () {
          const e = t.apply(this, arguments);
          return (O(), e);
        };
      ((a.__v508 = 1), (l.render0 = a));
    }
    (i.addEventListener(
      "change",
      (t) => {
        t.target &&
          t.target.matches &&
          t.target.matches(
            "input[data-chk],#gateov input,#gateov select,[data-dchs]",
          ) &&
          setTimeout(k, 60);
      },
      !0,
    ),
      i.addEventListener(
        "click",
        (t) => {
          t.target.closest && t.target.closest("#gateov") && setTimeout(k, 120);
        },
        !0,
      ));
    let C = 0;
    const Y = setInterval(() => {
      (C++, X(), P(), O(), C > 20 && clearInterval(Y));
    }, 700);
    (setInterval(() => {
      i.hidden || k();
    }, 2e4),
      new MutationObserver((t) => {
        if (
          t.some((a) =>
            [...a.addedNodes].some(
              (e) => e.nodeType === 1 && (e.id === "trvb" || e.id === "onb"),
            ),
          )
        )
          try {
            M();
          } catch {}
      }).observe(i.body || i.documentElement, { childList: !0 }),
      (l.DIARIO_V508 = {
        infoDe: x,
        sequencia: z,
        ontemPendente: q,
        abreHoje: V,
        fechaDia: w,
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em rigidez-v508.js", e);
}
try {
  (function (m) {
    "use strict";
    const n = m.document;
    if (!n) return;
    const f = (e, a) => {
        try {
          const t = e();
          return t === void 0 ? a : t;
        } catch {
          return a;
        }
      },
      g = (e) =>
        String(e ?? "").replace(
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
      M = (e) =>
        e == null || !isFinite(e)
          ? "—"
          : (e < 0 ? "-" : "") +
            "R$ " +
            Math.abs(e).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
      v = (e, a = 2) =>
        e == null || !isFinite(e)
          ? "—"
          : Number(e).toLocaleString("pt-BR", {
              minimumFractionDigits: a,
              maximumFractionDigits: a,
            }),
      $ = () => f(() => tab, ""),
      x = (e, a) => {
        try {
          const t = localStorage.getItem(e);
          return t ? JSON.parse(t) : a;
        } catch {
          return a;
        }
      },
      w = (e, a) => {
        try {
          localStorage.setItem(e, JSON.stringify(a));
        } catch {}
      },
      T = (e, a) => {
        try {
          m.toast(e, a || 4e3);
        } catch {}
      },
      te = n.createElement("style");
    ((te.textContent = `
.v512-card{background:var(--surface,#0d0d0e);border:1px solid rgba(181,139,61,0.18);border-radius:8px;padding:24px;margin:0 0 16px}
.v512-card h3{margin:0 0 4px;font-size:16px}.v512-card .mut{color:#8d929c;font-size:12.5px}
.v512-pl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.v512-pl>div{background:rgba(255,255,255,0.03);border-radius:8px;padding:8px}
.v512-pl b{display:block;font-size:13px;margin-bottom:8px}.v512-pl dl{margin:0;display:grid;grid-template-columns:auto auto;gap:4px 8px;font-size:12.5px}
.v512-pl dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}.v512-pos{color:#4ec489}.v512-neg{color:#eb7f6f}
.v512-seg{display:flex;gap:8px;margin-top:8px}.v512-seg button{flex:1;min-height:40px;border-radius:999px;border:1px solid rgba(181,139,61,0.25);background:none;color:inherit;font-size:12.5px}
.v512-seg button.on{background:#3b3e43;border-color:#b58b3d}
body.v512-lsv #app .dt395-native-mercado>:not(.m403-section-header):not(#v512-ls){display:none!important}#v512-ls.v512-pg{position:static!important;inset:auto!important;z-index:auto!important;background:none!important;padding:4px 0 24px!important;overflow:visible!important}#v512-ls.v512-pg .top{display:none}#v512-ls.v512-pg{grid-column:1/-1;width:100%;min-width:0;max-width:100%;box-sizing:border-box}#v512-ls.v512-pg *{box-sizing:border-box;max-width:100%;min-width:0;overflow-wrap:anywhere}#v512-ls.v512-pg .v512-tab{table-layout:fixed}#v512-ls{position:fixed;inset:0;z-index:9000;background:#070708;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 16px 88px;color:#efeeeb}
#v512-ls .top{display:flex;align-items:center;gap:8px;margin-bottom:12px}#v512-ls .top h2{flex:1;margin:0;font-size:20px}
#v512-ls .x{min-width:44px;min-height:44px;border-radius:8px;border:1px solid rgba(181,139,61,0.25);background:none;color:inherit;font-size:20px}
#v512-ls .f{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
#v512-ls input,#v512-ls select{min-height:44px;border-radius:8px;border:1px solid rgba(181,139,61,0.25);background:#0d0d0e;color:inherit;padding:0 12px;font-size:16px;text-transform:uppercase;width:100%;box-sizing:border-box}
#v512-ls .go{width:100%;min-height:46px;border-radius:8px;border:0;background:#b58b3d;color:#09090a;font-weight:700;font-size:15px}
#v512-ls .sig{font-size:15px;font-weight:700;margin:8px 0}#v512-ls svg{width:100%;height:auto;display:block}
#v512-ls .chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}#v512-ls .chips button{min-height:40px;border-radius:999px;border:1px solid rgba(181,139,61,0.25);background:none;color:inherit;padding:0 12px;font-size:13px}
.v512-bk li{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);font-size:13px}
.v512-bk button{min-height:40px;border-radius:999px;border:1px solid rgba(181,139,61,0.3);background:none;color:inherit;padding:0 12px}
`),
      (n.head || n.documentElement).appendChild(te));
    function oe() {
      const e = $() === "mercado" && f(() => MKT.tab, "") === "al";
      if ((n.body.classList.toggle("v512-alertas", e), !e)) return;
      const a = n.querySelector("#dt393-global-head .dt393-title");
      (a &&
        a.textContent !== "Configurações" &&
        (a.textContent = "Configurações"),
        n.querySelectorAll("#v4-bnav button.on").forEach((t) => {
          (t.classList.remove("on"), t.removeAttribute("aria-current"));
        }),
        n
          .querySelectorAll("#dt394-drawer .v420-menu-sec button")
          .forEach((t) => {
            const o =
              t.dataset.dt414Go === "mais" ||
              t.dataset.dt393Route === "mercado:al";
            (t.classList.toggle("active", o),
              t.dataset.dt393Route === "mercado" &&
                t.classList.remove("active"));
          }));
    }
    // Alertas pertence a Configurações. Não inferir o destino pelo último clique:
    // restauração, atalhos e chamadas diretas também são navegações legítimas.
    let I = 0;
    (n.addEventListener(
      "scroll",
      (e) => {
        const a = e.target;
        a &&
          a.classList &&
          a.classList.contains("m403-primary-tabs") &&
          (I = a.scrollLeft);
      },
      !0,
    ),
      m.addEventListener(
        "click",
        (e) => {
          const a = e.target.closest(".m403-primary-tabs");
          a && (I = a.scrollLeft);
        },
        !0,
      ));
    function R() {
      const e = n.querySelector("#app .m403-primary-tabs");
      if (!e) return;
      Math.abs(e.scrollLeft - I) > 2 && (e.scrollLeft = I);
      const a = e.querySelector("button.on");
      if (a) {
        const t = a.getBoundingClientRect(),
          o = e.getBoundingClientRect();
        (t.left < o.left || t.right > o.right) &&
          ((e.scrollLeft +=
            t.left < o.left ? t.left - o.left - 12 : t.right - o.right + 12),
          (I = e.scrollLeft));
      }
    }
    function se(e) {
      const a = e
          .map((s) => ({
            t: s,
            c: f(() => (typeof cBRL == "function" ? cBRL(s) : calc(s)), {}),
          }))
          .filter((s) => s.c && s.c.pl != null && isFinite(s.c.pl)),
        t = a.filter((s) => s.c.pl > 0),
        o = a.filter((s) => s.c.pl < 0),
        i = a.map((s) => s.c.r).filter((s) => s != null && isFinite(s)),
        r = (s) => s.reduce((c, l) => c + l.c.pl, 0);
      return {
        n: a.length,
        acerto: a.length ? (t.length / a.length) * 100 : null,
        res: r(a),
        mg: t.length ? r(t) / t.length : null,
        mp: o.length ? r(o) / o.length : null,
        r: i.length ? i.reduce((s, c) => s + c, 0) / i.length : null,
        semRegra: e.filter((s) => s.seguiu === !1 || s.regras === !1).length,
      };
    }
    function re() {
      const e = x("v512-placar", "mes"),
        a = f(() => loc().slice(0, 10), new Date().toISOString().slice(0, 10)),
        t =
          e === "mes"
            ? a.slice(0, 8) + "01"
            : e === "90"
              ? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)
              : "0000",
        o = f(() => S.trades, []).filter(
          (l) => String(l.dtx || l.dt || "").slice(0, 10) >= t,
        ),
        i = se(o.filter((l) => l.mk !== "US")),
        r = se(o.filter((l) => l.mk === "US")),
        s = (l, p) =>
          `<div><b>${l}</b><dl><dt>Trades</dt><dd>${p.n}</dd><dt>Acerto</dt><dd>${p.acerto == null ? "—" : v(p.acerto, 0) + "%"}</dd><dt>Resultado</dt><dd class="${p.res > 0 ? "v512-pos" : p.res < 0 ? "v512-neg" : ""}">${M(p.res)}</dd><dt>Ganho médio</dt><dd>${M(p.mg)}</dd><dt>Perda média</dt><dd>${M(p.mp)}</dd><dt>Média</dt><dd>${p.r == null ? "—" : v(p.r, 2) + "× o risco"}</dd></dl></div>`;
      let c = "";
      if (i.n >= 5 && r.n >= 5) {
        const l = i.res,
          p = r.res;
        c =
          l === p
            ? "Empate no período."
            : `Melhor resultado no período: <b>${l > p ? "Brasil" : "EUA"}</b>.`;
      } else c = "Com 5 trades fechados em cada mercado aparece a comparação.";
      return `<section class="v512-card" id="v512-placar"><h3>Placar Brasil × EUA</h3><div class="mut">${c}</div>
  <div class="v512-seg">${[
    ["mes", "Este mês"],
    ["90", "90 dias"],
    ["tudo", "Tudo"],
  ]
    .map(
      ([l, p]) =>
        `<button type="button" data-v512per="${l}" class="${e === l ? "on" : ""}">${p}</button>`,
    )
    .join("")}</div>
  <div class="v512-pl">${s("Brasil", i)}${s("EUA", r)}</div><div class="mut" style="margin-top:8px">Valores em reais (EUA convertido). Só trades fechados.</div></section>`;
    }
    function ie() {
      if ($() !== "stats") return;
      const e =
        n.querySelector("#app .dt393-native") || n.getElementById("app");
      if (!e) return;
      const a = re(),
        t = n.getElementById("v512-placar");
      if (t) {
        t.dataset.h !== a &&
          ((t.outerHTML = a), (n.getElementById("v512-placar").dataset.h = a));
        return;
      }
      const o = e.querySelector("h1,h2"),
        i = n.createElement("div");
      i.innerHTML = a;
      const r = i.firstElementChild;
      ((r.dataset.h = a),
        o && o.parentElement
          ? o.parentElement.insertBefore(r, o.nextSibling)
          : e.prepend(r));
    }
    n.addEventListener("click", (e) => {
      const a = e.target.closest("[data-v512per]");
      if (!a) return;
      w("v512-placar", a.dataset.v512per);
      const t = n.getElementById("v512-placar");
      (t && t.remove(), ie());
    });
    const u = {
        a: "ITUB4",
        b: "BBDC4",
        jan: 252,
        cap: 1e4,
        res: null,
        busy: 0,
        err: "",
      },
      ne = [
        ["PETR4", "PETR3", "Mesma empresa"],
        ["ITUB4", "ITUB3", "Mesma empresa"],
        ["BBDC4", "BBDC3", "Mesma empresa"],
        ["CMIG4", "CMIG3", "Mesma empresa"],
        ["USIM5", "USIM3", "Mesma empresa"],
        ["SAPR11", "SAPR4", "Mesma empresa"],
        ["KLBN11", "KLBN4", "Mesma empresa"],
        ["GGBR4", "GOAU4", "Controladora × controlada"],
        ["ITSA4", "ITUB4", "Holding × controlada"],
        ["BRAP4", "VALE3", "Holding × controlada"],
        ["ITUB4", "BBDC4", "Bancos"],
        ["BBAS3", "ITUB4", "Bancos"],
        ["SANB11", "BBDC4", "Bancos"],
        ["BBAS3", "BBDC4", "Bancos"],
        ["VALE3", "CMIN3", "Minério"],
        ["CSNA3", "USIM5", "Siderurgia"],
        ["GGBR4", "CSNA3", "Siderurgia"],
        ["SUZB3", "KLBN11", "Papel e celulose"],
        ["PETR4", "PRIO3", "Petróleo"],
        ["PRIO3", "RECV3", "Petróleo"],
        ["CPFE3", "EGIE3", "Energia"],
        ["TAEE11", "ALUP11", "Transmissão"],
        ["SBSP3", "SAPR11", "Saneamento"],
        ["RENT3", "MOVI3", "Locação"],
        ["CYRE3", "EZTC3", "Construção"],
        ["LREN3", "CEAB3", "Varejo de moda"],
        ["B3SA3", "ITUB4", "Financeiro"],
      ];
    async function D(e) {
      if (m.V512_CANDLES) return m.V512_CANDLES(e);
      if (!f(() => SESS, null))
        throw new Error("Entre na sua conta para buscar os gráficos.");
      await tok();
      const a = cfg(),
        t = await fetch(a.url + "/functions/v1/candles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: a.key,
            Authorization: "Bearer " + SESS.at,
          },
          body: JSON.stringify({ ativo: e, intervalo: "1d" }),
        }),
        o = await t.json().catch(() => ({}));
      if (!t.ok) throw new Error(o.error || "Erro " + t.status);
      if (o.proxy) throw new Error(e + ": sem histórico diário próprio.");
      return o.candles || [];
    }
    const _ = (e) => new Date((e - 3 * 3600) * 1e3).toISOString().slice(0, 10),
      y = (e) => e.reduce((a, t) => a + t, 0) / (e.length || 1),
      le = (e, a = y(e)) =>
        Math.sqrt(e.reduce((t, o) => t + (o - a) ** 2, 0) / (e.length || 1));
    function de(e, a) {
      const t = y(e),
        o = y(a);
      let i = 0,
        r = 0;
      for (let c = 0; c < e.length; c++)
        ((i += (e[c] - t) * (a[c] - o)), (r += (e[c] - t) ** 2));
      const s = r ? i / r : 0;
      return { b: s, a: o - s * t };
    }
    function K(e, a, t) {
      const o = new Map(a.map((d) => [_(d[0]), d[4]])),
        i = e
          .map((d) => ({ d: _(d[0]), a: d[4], b: o.get(_(d[0])) }))
          .filter((d) => d.b > 0 && d.a > 0);
      if (i.length < 80)
        throw new Error(
          "Poucos dias em comum entre os dois ativos (mínimo de 80 pregões).",
        );
      const r = i.slice(-Math.min(t, i.length)),
        s = r.map((d) => d.a / d.b),
        c = y(s),
        l = le(s, c) || 1e-9,
        p = (s[s.length - 1] - c) / l,
        h = 60,
        z = s.map((d, b) => {
          if (b < h - 1) return null;
          const B = s.slice(b - h + 1, b + 1),
            E = y(B),
            V = le(B, E) || 1e-9;
          return (d - E) / V;
        }),
        q = [],
        P = [];
      for (let d = 1; d < r.length; d++)
        (q.push(r[d].a / r[d - 1].a - 1), P.push(r[d].b / r[d - 1].b - 1));
      const Ie = (() => {
          const d = y(q),
            b = y(P);
          let B = 0,
            E = 0,
            V = 0;
          for (let L = 0; L < q.length; L++)
            ((B += (q[L] - d) * (P[L] - b)),
              (E += (q[L] - d) ** 2),
              (V += (P[L] - b) ** 2));
          return B / Math.sqrt(E * V || 1e-12);
        })(),
        je = de(P, q).b,
        ee = [],
        N = [];
      for (let d = 1; d < s.length; d++)
        (ee.push(s[d] - s[d - 1]), N.push(s[d - 1] - c));
      const H = de(N, ee).b,
        Pe = H < 0 ? Math.log(2) / -H : null,
        Re = ee.map((d, b) => d - H * N[b]),
        Se = Math.sqrt(
          y(Re.map((d) => d * d)) / (N.reduce((d, b) => d + b * b, 0) || 1e-12),
        ),
        De = Se ? H / Se : 0,
        C = [];
      let k = null;
      for (let d = 0; d < s.length; d++) {
        const b = z[d];
        if (b != null) {
          if (!k && Math.abs(b) >= 2)
            k = { i: d, lado: b > 0 ? -1 : 1, q: s[d] };
          else if (k) {
            const B = d - k.i,
              E =
                Math.abs(b) <= 0.5
                  ? "voltou"
                  : Math.abs(b) >= 3.5
                    ? "stop"
                    : B >= 40
                      ? "tempo"
                      : null;
            E &&
              (C.push({
                dias: B,
                fim: E,
                ganho: k.lado * (s[d] / k.q - 1) * 100,
              }),
              (k = null));
          }
        }
      }
      const ae = C.filter((d) => d.fim === "voltou");
      return {
        w: r,
        q: s,
        m: c,
        sd: l,
        z: p,
        zs: z,
        corr: Ie,
        beta: je,
        meia: Pe,
        tst: De,
        ops: C,
        taxa: C.length ? (ae.length / C.length) * 100 : null,
        diasMed: ae.length ? y(ae.map((d) => d.dias)) : null,
        ganhoMed: C.length ? y(C.map((d) => d.ganho)) : null,
        ult: r[r.length - 1],
        ab: k,
      };
    }
    function Be(e) {
      const o = e.q,
        i = Math.min(...o, e.m - 2.2 * e.sd),
        r = Math.max(...o, e.m + 2.2 * e.sd),
        s = (p) => 2 + (p * 96) / (o.length - 1),
        c = (p) => 3 + ((r - p) / (r - i || 1)) * 40,
        l = (p, h, z) =>
          `<line x1="2" x2="98" y1="${c(p).toFixed(2)}" y2="${c(p).toFixed(2)}" stroke="${h}" stroke-width=".3"${z ? ' stroke-dasharray="1 .8"' : ""}/>`;
      return `<svg viewBox="0 0 100 46" role="img" aria-label="Razão entre os preços">${l(e.m + 2 * e.sd, "#eb7f6f", 1)}${l(e.m - 2 * e.sd, "#4ec489", 1)}${l(e.m, "#8d929c", 0)}<polyline fill="none" stroke="#cfab69" stroke-width=".45" points="${o.map((p, h) => s(h).toFixed(2) + "," + c(p).toFixed(2)).join(" ")}"/><circle cx="${s(o.length - 1)}" cy="${c(o[o.length - 1])}" r=".9" fill="#cfab69"/></svg>`;
    }
    function Ee(e) {
      const o = e.zs,
        i = (l) => 2 + (l * 96) / (o.length - 1),
        r = (l) => 2 + ((4 - Math.max(-4, Math.min(4, l))) / 8) * 30,
        s = (l, p, h) =>
          `<line x1="2" x2="98" y1="${r(l).toFixed(2)}" y2="${r(l).toFixed(2)}" stroke="${p}" stroke-width=".3"${h ? ' stroke-dasharray="1 .8"' : ""}/>`,
        c = o
          .map((l, p) =>
            l == null ? null : i(p).toFixed(2) + "," + r(l).toFixed(2),
          )
          .filter(Boolean)
          .join(" ");
      return `<svg viewBox="0 0 100 34" role="img" aria-label="Desvio da média ao longo do tempo">${s(2, "#eb7f6f", 1)}${s(-2, "#4ec489", 1)}${s(0, "#8d929c", 0)}${s(3.5, "#eb7f6f", 0)}${s(-3.5, "#4ec489", 0)}<polyline fill="none" stroke="#66cc99" stroke-width=".45" points="${c}"/></svg>`;
    }
    function we(e, a, t) {
      const o = e.zs[e.zs.length - 1] ?? e.z;
      return o >= 3.5
        ? `<span class="v512-neg">Distorção extrema (${v(o, 1)} desvios).</span> Acima do limite de segurança: o par pode ter "quebrado". Melhor não entrar.`
        : o <= -3.5
          ? `<span class="v512-pos">Distorção extrema (${v(o, 1)} desvios).</span> Acima do limite de segurança: o par pode ter "quebrado". Melhor não entrar.`
          : o >= 2
            ? `<span class="v512-neg">${a} está caro em relação a ${t}</span> (${v(o, 1)} desvios). A montagem clássica seria <b>vender ${a}</b> e <b>comprar ${t}</b>, esperando a razão voltar para a média.`
            : o <= -2
              ? `<span class="v512-pos">${a} está barato em relação a ${t}</span> (${v(o, 1)} desvios). A montagem clássica seria <b>comprar ${a}</b> e <b>vender ${t}</b>, esperando a razão voltar para a média.`
              : `Sem distorção agora (${v(o, 1)} desvios). O par está "normal": não há operação pela regra.`;
    }
    function Ae(e) {
      const a = [];
      let t = 0;
      return (
        e.corr >= 0.75
          ? (t++,
            a.push(
              '<i class="v512-ok"></i>Correlação alta: as duas costumam andar juntas.',
            ))
          : a.push(
              '<i class="v512-al"></i>Correlação baixa: as duas nem sempre andam juntas.',
            ),
        e.tst <= -2.9
          ? (t++,
            a.push(
              '<i class="v512-ok"></i>Teste de reversão forte: a razão costuma voltar para a média.',
            ))
          : e.tst <= -2.3
            ? a.push('<i class="v512-md"></i>Teste de reversão moderado.')
            : a.push(
                '<i class="v512-al"></i>Teste de reversão fraco: a razão pode ficar longe da média por muito tempo.',
              ),
        e.meia && e.meia <= 30
          ? (t++,
            a.push(
              `<i class="v512-ok"></i>Meia-vida de ${v(e.meia, 0)} pregões: as distorções se desfazem rápido.`,
            ))
          : a.push(
              e.meia
                ? `<i class="v512-al"></i>Meia-vida longa (${v(e.meia, 0)} pregões).`
                : '<i class="v512-al"></i>Sem tendência de voltar à média no período.',
            ),
        e.taxa != null && e.ops.length >= 3 && e.taxa >= 60
          ? (t++,
            a.push(
              `<i class="v512-ok"></i>${v(e.taxa, 0)}% das distorções passadas voltaram para a média.`,
            ))
          : e.ops.length &&
            a.push(
              `<i class="v512-al"></i>Só ${v(e.taxa, 0)}% das distorções passadas voltaram.`,
            ),
        {
          nota: t,
          p: a,
          txt: [
            "Par fraco",
            "Par fraco",
            "Par razoável",
            "Par bom",
            "Par muito bom",
          ][t],
        }
      );
    }
    const W = (e) => "R$ " + Math.round(e).toLocaleString("pt-BR");
    function Ce(e, a, t) {
      const o = e.ult.a,
        i = e.ult.b,
        r = u.cap || 1e4,
        s = r / 2,
        c = e.zs[e.zs.length - 1] ?? e.z,
        l = c > 0,
        p = Math.floor(s / o),
        h = Math.floor(s / i),
        z = Math.max(1, Math.floor((s * Math.abs(e.beta || 1)) / i));
      return `<table class="v512-tab"><tr><th></th><th>${g(a)}</th><th>${g(t)}</th></tr>
  <tr><td>Preço</td><td>${M(o)}</td><td>${M(i)}</td></tr>
  <tr><td>Lado (se houver sinal)</td><td>${l ? "Vender" : "Comprar"}</td><td>${l ? "Comprar" : "Vender"}</td></tr>
  <tr><td>Quantidade (mesmo valor nas duas)</td><td>${p} ações · ${W(p * o)}</td><td>${h} ações · ${W(h * i)}</td></tr>
  <tr><td>Quantidade ajustada pelo beta</td><td>${p} ações</td><td>${z} ações</td></tr></table>
  <div class="mut">Capital de ${W(r)}: metade em cada ponta. "Ajustada pelo beta" equilibra o quanto cada ação costuma oscilar (beta ${v(e.beta, 2)}). Ações abaixo de 100 unidades vão para o mercado fracionário (código com F).</div>`;
    }
    /* v592: explicação inicial sai da tela e vai para um popover acionado pelo "?" ao lado de "Analisar um par". */
    const zeIntro = `<h3>O que é Long &amp; Short</h3>
<p><b>Ideia em uma frase:</b> você compra uma ação e vende outra ao mesmo tempo, apostando que a diferença entre as duas vai voltar ao normal. Você não aposta se a Bolsa vai subir ou cair, e sim na <b>relação entre duas ações parecidas</b>.</p>
<p><b>Exemplo do dia a dia:</b> Itaú e Bradesco são bancos parecidos e costumam subir e cair juntos. Se um dia o Itaú sobe muito mais que o Bradesco sem motivo novo, o Itaú ficou "caro" em relação ao Bradesco. O operador vende Itaú e compra Bradesco. Quando a relação volta ao normal, ele desfaz as duas pontas e fica com a diferença.</p>
<p><b>Por que isso protege?</b> Se a Bolsa inteira cair 5%, a ação que você vendeu cai e você ganha nela; a que você comprou cai e você perde nela. Uma compensa a outra. O resultado depende só de quem andou melhor: por isso se chama operação de <b>valor relativo</b> ou <b>neutra ao mercado</b>.</p>
<p><b>Comprado (long)</b> = você compra a ação e ganha se ela subir. <b>Vendido (short)</b> = você vende uma ação que não tem (pegando emprestada pelo aluguel da B3) e ganha se ela cair.</p>`;
    const ze = `<details class="v512-aula"><summary>Como ler os números desta tela</summary>
<ul><li><b>Razão</b>: preço de A dividido pelo preço de B. É o "termômetro" do par. Se a razão sobe, A está ficando mais caro que B.</li>
<li><b>Média</b>: o nível normal da razão no período escolhido.</li>
<li><b>Desvio (z-score)</b>: quantos "desvios padrão" a razão está longe da média. 0 = normal; +2 = A caro; −2 = A barato. Cerca de 95% do tempo a razão fica entre −2 e +2: passar disso é uma distorção.</li>
<li><b>Correlação</b>: de −1 a 1. Acima de 0,75 as duas ações andam muito juntas, condição básica para o método.</li>
<li><b>Meia-vida</b>: em quantos pregões, em média, a distorção cai pela metade. Quanto menor, mais rápido o par volta e menos tempo seu dinheiro fica parado.</li>
<li><b>Teste de reversão</b>: mede se a razão realmente tem o hábito de voltar para a média (versão simples do teste de cointegração). Abaixo de −2,9 é forte.</li>
<li><b>Beta</b>: quanto A costuma andar quando B anda 1%. Serve para equilibrar o tamanho das pontas.</li></ul></details>
<details class="v512-aula"><summary>Regras da operação (entrada, saída e stop)</summary>
<ul><li><b>Entrada</b>: quando o desvio passa de +2 ou −2.</li><li><b>Saída com lucro</b>: quando o desvio volta para perto de 0 (até ±0,5).</li><li><b>Stop</b>: se o desvio passar de ±3,5, a relação pode ter mudado de vez (notícia, fusão, mudança no setor). Sai e aceita a perda.</li><li><b>Prazo máximo</b>: se em cerca de 40 pregões não voltar, encerra: o dinheiro parado também custa.</li></ul></details>
<details class="v512-aula"><summary>Riscos e custos que ninguém conta</summary>
<ul><li><b>A relação pode quebrar</b>: um evento só de uma empresa (escândalo, aquisição, troca de controle) faz a distorção virar permanente. Por isso existe o stop.</li>
<li><b>Aluguel de ações</b>: para vender a descoberto você paga uma taxa de aluguel (BTC) por dia. Algumas ações têm aluguel caro.</li>
<li><b>Garantia e margem</b>: a corretora exige garantia para a ponta vendida. Se a operação andar contra, pode haver chamada de margem.</li>
<li><b>Dividendos</b>: quem está vendido paga os dividendos da ação ao dono que emprestou.</li>
<li><b>Custos</b>: corretagem e emolumentos nas 4 ordens (abrir e fechar as duas pontas), e imposto de 15% sobre o lucro (20% se for no mesmo dia).</li>
<li><b>Dados</b>: histórico diário do Yahoo Finance com atraso. Use como estudo, não como ordem de compra ou venda.</li></ul></details>`;
    function ce() {
      const e = x("v512-pares", []),
        a = u.res,
        t = a && Ae(a);
      return `<div class="top"><h2>Long &amp; Short</h2><button class="x" type="button" data-v512ls="fecha" aria-label="Fechar">×</button></div>
  <h3 class="v592-ls-tit" style="margin:16px 0 8px">Analisar um par <button type="button" class="v592-ajuda" data-v512ls="ajuda" aria-label="O que é Long &amp; Short" aria-expanded="${u.ajuda ? "true" : "false"}"><span aria-hidden="true">?</span></button></h3>
  ${u.ajuda ? `<div class="v592-pop-fundo" data-v512ls="ajuda"></div><div class="v592-pop" role="dialog" aria-modal="true" aria-label="O que é Long &amp; Short"><button type="button" class="x" data-v512ls="ajuda" aria-label="Fechar">×</button>${zeIntro}</div>` : ""}
  <div class="f"><input id="v512-a" value="${g(u.a)}" placeholder="Ativo A" autocomplete="off"><input id="v512-b" value="${g(u.b)}" placeholder="Ativo B" autocomplete="off"></div>
  <div class="f"><select id="v512-j">${[
    [126, "6 meses"],
    [252, "1 ano"],
    [400, "1 ano e meio"],
  ]
    .map(
      ([o, i]) =>
        `<option value="${o}" ${u.jan == o ? "selected" : ""}>${i}</option>`,
    )
    .join(
      "",
    )}</select><input id="v512-cap" inputmode="numeric" value="${g(u.cap)}" placeholder="Capital (R$)" style="text-transform:none"></div>
  <button class="go" type="button" data-v512ls="calc">${u.busy ? "Calculando…" : "Analisar par"}</button>
  <details class="v512-aula"><summary>Pares sugeridos e salvos</summary>
  ${[...new Set(ne.map((o) => o[2]))]
    .map(
      (o) =>
        `<div class="mut" style="font-size:12px;margin-top:6px">${g(o)}</div><div class="chips" style="margin-top:4px">${ne
          .filter((i) => i[2] === o)
          .map(
            ([i, r]) =>
              `<button type="button" data-v512par="${i}|${r}">${i} × ${r}</button>`,
          )
          .join("")}</div>`,
    )
    .join("")}
  ${e.length ? `<div class="mut" style="margin:6px 0 4px">Seus pares salvos:</div><div class="chips">${e.map((o) => `<button type="button" data-v512par="${g(o)}">+ ${g(o.replace("|", " × "))}</button>`).join("")}</div>` : ""}
  </details>
  ${u.err ? `<div class="v512-card v512-neg">${g(u.err)}</div>` : ""}
  ${
    a
      ? `<div class="v512-card"><div class="sig">${we(a, u.a, u.b)}</div>
   <div class="v512-kpis"><div><small>Desvio atual</small><b>${v(a.zs[a.zs.length - 1] ?? a.z, 2)}</b></div><div><small>Correlação</small><b>${v(a.corr, 2)}</b></div><div><small>Meia-vida</small><b>${a.meia ? v(a.meia, 0) + " preg." : "—"}</b></div><div><small>Qualidade</small><b>${t.txt}</b></div></div>
   <ul class="v512-q">${t.p.map((o) => `<li>${o}</li>`).join("")}</ul></div>
  <div class="v512-card"><h3>Razão ${g(u.a)} ÷ ${g(u.b)}</h3><div class="mut">Hoje ${v(a.q[a.q.length - 1], 4)} · média ${v(a.m, 4)} · ${a.q.length} pregões até ${a.ult.d.split("-").reverse().join("/")}</div>${Be(a)}
   <div class="mut">Amarelo: a razão. Cinza: a média. Tracejado vermelho/verde: ±2 desvios (zona de distorção).</div></div>
  <div class="v512-card"><h3>Desvio da média ao longo do tempo</h3>${Ee(a)}<div class="mut">Azul: desvio calculado nos últimos 60 pregões. Tracejado: ±2 (entrada). Linha cheia: ±3,5 (stop).</div></div>
  <div class="v512-card"><h3>Como o par se comportou no passado</h3>${a.ops.length ? `<table class="v512-tab"><tr><td>Distorções encontradas</td><td>${a.ops.length}</td></tr><tr><td>Voltaram para a média</td><td>${v(a.taxa, 0)}%</td></tr><tr><td>Pregões até voltar (média)</td><td>${a.diasMed != null ? v(a.diasMed, 0) : "—"}</td></tr><tr><td>Resultado médio por operação</td><td class="${a.ganhoMed > 0 ? "v512-pos" : "v512-neg"}">${v(a.ganhoMed, 2)}%</td></tr><tr><td>Saídas no stop / por prazo</td><td>${a.ops.filter((o) => o.fim === "stop").length} / ${a.ops.filter((o) => o.fim === "tempo").length}</td></tr></table><div class="mut">Simulação com as regras acima, sem custos. Resultado passado não garante o futuro.</div>` : '<div class="mut">Nenhuma distorção completa no período.</div>'}${a.ab ? `<div class="mut">Há uma distorção aberta desde ${a.w[a.ab.i].d.split("-").reverse().join("/")}.</div>` : ""}</div>
  <div class="v512-card"><h3>Como ficaria a montagem</h3>${Ce(a, u.a, u.b)}</div>
  <div class="chips"><button type="button" data-v512ls="salva">+ Salvar par (aviso diário quando distorcer)</button></div>`
      : ""
  }
  <div class="mut">Estudo com dados diários do Yahoo Finance, com atraso. Não é recomendação de investimento.</div>
  ${ze}`;
    }
    function j() {
      const e = n.getElementById("v512-ls");
      if (e) {
        const a = m.scrollY;
        ((e.innerHTML = ce()), m.scrollTo(0, a));
      }
      try {
        R();
      } catch {}
    }
    let F = !1;
    function J() {
      const e =
        $() === "mercado" && f(() => MKT.tab, "") === "ls" && !n.body.classList.contains("v512-alertas");
      n.body.classList.toggle("v512-lsv", e);
      const a = n.querySelector("#app .dt395-native-mercado");
      let t = n.getElementById("v512-ls");
      if (!e) {
        t && t.remove();
        return;
      }
      if (!a) return;
      try {
        R();
      } catch {}
      if (!t || t.parentElement !== a) {
        (t && t.remove(),
          (t = n.createElement("section")),
          (t.id = "v512-ls"),
          (t.className = "v512-pg"),
          t.setAttribute("aria-label", "Long & Short"));
        const i = a.querySelector(".m403-section-header");
        (i ? i.after(t) : a.prepend(t),
          (u.cap = x("v512-ls-cap", 1e4)),
          (t.innerHTML = ce()));
      }
    }
    function pe() {
      if (m.DiarioRotas) m.DiarioRotas.navigate('mercado:ls');
      else {  MKT.tab = 'ls'; irPara('mercado'); }
      J();
    }
    n.addEventListener('diario:render', J);
    m.addEventListener(
      "click",
      (e) => {
        if (e.target.closest('[data-v512="ls"]')) return;
        e.target.closest(
          "[data-navroute],[data-dt393-route],[data-dt414-go],[data-dt392-route],[data-mk]",
        ) &&
          F &&
          ((F = !1),
          n.body.classList.remove("v512-lsv"),
          n.getElementById("v512-ls")?.remove());
      },
      !0,
    );
    async function ue() {
      ((u.a = (n.getElementById("v512-a")?.value || u.a).trim().toUpperCase()),
        (u.b = (n.getElementById("v512-b")?.value || u.b).trim().toUpperCase()),
        (u.jan = +(n.getElementById("v512-j")?.value || 252)));
      const e = +String(n.getElementById("v512-cap")?.value || "").replace(
        /\D/g,
        "",
      );
      if (
        (e > 0 && ((u.cap = e), w("v512-ls-cap", e)),
        !u.a || !u.b || u.a === u.b)
      ) {
        ((u.err = "Escolha dois ativos diferentes."), j());
        return;
      }
      ((u.busy = 1), (u.err = ""), j());
      try {
        const [a, t] = await Promise.all([D(u.a), D(u.b)]);
        u.res = K(a, t, u.jan);
      } catch (a) {
        ((u.res = null), (u.err = String(a.message || a)));
      }
      ((u.busy = 0),
        j(),
        setTimeout(
          () =>
            n
              .querySelector("#v512-ls .sig")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          50,
        ));
    }
    n.addEventListener(
      "click",
      (e) => {
        if (e.target.closest('[data-v512="ls"]')) {
          (e.preventDefault(), e.stopPropagation(), pe());
          return;
        }
        if (e.target.closest('[data-v512="ar"]')) {
          (e.preventDefault(), e.stopPropagation());
          try {
            typeof closeDrawer == "function" && closeDrawer(!1);
          } catch {}
          const r = (s, c) =>
            new Promise((l) =>
              setTimeout(() => {
                (n.querySelector(s)?.click(), l());
              }, c),
            );
          (async () => {
            (await r('[data-dt393-route="estudos"]', 0),
              await r('[data-dt397-view="est"]', 500));
            for (
              let s = 0;
              s < 12 && !n.querySelector('[data-estv="bib"]');
              s++
            )
              await new Promise((c) => setTimeout(c, 250));
            await r('[data-estv="bib"]', 200);
            for (
              let s = 0;
              s < 12 && !n.querySelector('[data-e2bib="ar"]');
              s++
            )
              await new Promise((c) => setTimeout(c, 250));
            await r('[data-e2bib="ar"]', 150);
          })();
          return;
        }
        const o = e.target.closest("[data-v512ls]");
        if (o) {
          const r = o.dataset.v512ls;
          if (r === "fecha") { MKT.tab = "cq"; render(); }
          else if (r === "ajuda") { u.ajuda = !u.ajuda; j(); }
          else if (r === "calc") ue();
          else if (r === "salva") {
            const s = x("v512-pares", []),
              c = u.a + "|" + u.b;
            (s.includes(c) || (s.unshift(c), w("v512-pares", s.slice(0, 6))),
              T("Par salvo: aviso diário quando passar de 2 desvios."),
              j());
          }
          return;
        }
        const i = e.target.closest("[data-v512par]");
        if (i) {
          const [r, s] = i.dataset.v512par.split("|");
          ((u.a = r), (u.b = s), j(), ue());
        }
      },
      !0,
    );
    async function qe() {
      const e = x("v512-pares", []),
        a = new Date().toISOString().slice(0, 10);
      if (
        !(!e.length || x("v512-pares-dia", "") === a || !f(() => SESS, null))
      ) {
        w("v512-pares-dia", a);
        for (const t of e.slice(0, 6))
          try {
            const [o, i] = t.split("|"),
              [r, s] = await Promise.all([D(o), D(i)]),
              c = K(r, s, 252),
              l = c.zs[c.zs.length - 1];
            Math.abs(l) >= 2 &&
              Math.abs(l) < 3.5 &&
              T(
                `Long & Short ${o} × ${i}: distorção de ${v(l, 1)} desvios.`,
                8e3,
              );
          } catch {}
      }
    }
    try {
      const e = n.createElement("style");
      ((e.textContent =
        "#v512-ls .v512-aula{background:#0d0d0e;border:1px solid rgba(181,139,61,0.18);border-radius:8px;padding:12px 16px;margin:0 0 8px}#v512-ls .v512-aula summary{font-weight:700;font-size:15px;cursor:pointer;min-height:28px}#v512-ls .v512-aula p,#v512-ls .v512-aula li{font-size:14px;line-height:1.5;color:#dedcd7}#v512-ls .v512-aula ul{padding-left:16px;margin:8px 0 0}#v512-ls .v512-kpis{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}#v512-ls .v512-kpis div{background:rgba(255,255,255,0.04);border-radius:8px;padding:8px}#v512-ls .v512-kpis small{display:block;color:#8d929c;font-size:12px}#v512-ls .v512-kpis b{font-size:17px}#v512-ls .v512-q i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px;vertical-align:1px}#v512-ls .v512-ok{background:#4ec489}#v512-ls .v512-al{background:#cfab69}#v512-ls .v512-md{background:#8d929c}#v512-ls .v512-q{padding-left:4px;list-style:none;margin:4px 0 0;font-size:13.5px;line-height:1.6}#v512-ls .v512-card h3{margin:0 0 8px;font-size:15px}#v512-ls .v512-tab{width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0 8px}#v512-ls .v512-tab td,#v512-ls .v512-tab th{padding:8px 4px;border-top:1px solid rgba(255,255,255,0.07);text-align:left}#v512-ls .v512-tab td:not(:first-child),#v512-ls .v512-tab th:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}"),
        n.head.appendChild(e));
    } catch {}
    const U = "backups";
    async function O(e, a) {
      await tok();
      const t = cfg();
      return fetch(t.url + "/storage/v1/" + e, {
        ...a,
        headers: {
          apikey: t.key,
          Authorization: "Bearer " + SESS.at,
          ...((a && a.headers) || {}),
        },
      });
    }
    async function me() {
      const e = await O("object/list/" + U, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: SESS.uid + "/",
          limit: 100,
          sortBy: { column: "name", order: "desc" },
        }),
      });
      if (!e.ok)
        throw new Error("Lista de backups indisponível (" + e.status + ").");
      return (await e.json()).filter((a) => /\.json$/.test(a.name));
    }
    async function Q(e) {
      if (!f(() => SESS && SESS.uid, null) || !m.TraderBackup) return;
      const a = x("v512-bk-" + SESS.uid, 0);
      if (!e && Date.now() - a < 7 * 864e5) return;
      const t = SESS.uid,
        o = m.saveFile,
        i = m.toast;
      let r = !1,
        s = "";
      ((m.saveFile = async (c, l) => {
        const p = await O("object/" + U + "/" + t + "/" + c, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-upsert": "true" },
          body: l,
        });
        if (!p.ok) throw new Error("Backup não enviado (" + p.status + ").");
        r = !0;
      }),
        (m.toast = (c) => {
          s = String(c || "");
        }));
      try {
        await m.TraderBackup.exportBackup();
      } catch (c) {
        s = String(c.message || c);
      } finally {
        ((m.saveFile = o), (m.toast = i));
      }
      if (r) {
        w("v512-bk-" + t, Date.now());
        try {
          const l = (await me()).slice(4).map((p) => t + "/" + p.name);
          l.length &&
            (await O("object/" + U, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prefixes: l }),
            }));
        } catch {}
        e && T("Backup salvo na sua conta.");
      } else e && s && T(s, 8e3);
    }
    async function ve() {
      if (
        $() !== "mais" ||
        n.getElementById("v512-bk") ||
        !f(() => SESS && SESS.uid, null)
      )
        return;
      const e =
        n.querySelector("#app .dt393-native") || n.getElementById("app");
      if (!e) return;
      const a = n.createElement("section");
      ((a.className = "v512-card v512-bk"),
        (a.id = "v512-bk"),
        (a.innerHTML =
          '<h3>Backups semanais na conta</h3><div class="mut">Toda semana o app salva uma cópia completa (trades, fotos e regras) na sua conta. Ficam as 4 últimas.</div><ul style="list-style:none;padding:0;margin:8px 0 0"><li class="mut">Carregando…</li></ul><div class="v512-seg"><button type="button" data-v512bk="agora">Fazer backup agora</button></div>'),
        e.appendChild(a));
      try {
        const t = await me();
        a.querySelector("ul").innerHTML = t.length
          ? t
              .slice(0, 4)
              .map(
                (o) =>
                  `<li><span>${g(
                    o.name
                      .replace(/^diario-backup-|\.json$/g, "")
                      .split("-")
                      .reverse()
                      .join("/"),
                  )} · ${v((o.metadata?.size || 0) / 1048576, 1)} MB</span><button type="button" data-v512bkget="${g(o.name)}">Baixar</button></li>`,
              )
              .join("")
          : '<li class="mut">Nenhum backup ainda: o primeiro sai nesta semana.</li>';
      } catch (t) {
        a.querySelector("ul").innerHTML =
          `<li class="mut">${g(t.message)}</li>`;
      }
    }
    n.addEventListener("click", async (e) => {
      const a = e.target.closest("[data-v512bk]");
      if (a) {
        ((a.disabled = !0),
          (a.textContent = "Salvando…"),
          await Q(!0),
          n.getElementById("v512-bk")?.remove(),
          ve());
        return;
      }
      const t = e.target.closest("[data-v512bkget]");
      if (t)
        try {
          const o = await O(
            "object/authenticated/" +
              U +
              "/" +
              SESS.uid +
              "/" +
              t.dataset.v512bkget,
            {},
          );
          if (!o.ok)
            throw new Error("Arquivo indisponível (" + o.status + ").");
          const i = URL.createObjectURL(await o.blob()),
            r = n.createElement("a");
          ((r.href = i),
            (r.download = t.dataset.v512bkget),
            n.body.appendChild(r),
            r.click(),
            setTimeout(() => {
              (URL.revokeObjectURL(i), r.remove());
            }, 4e3));
        } catch (o) {
          T(o.message, 6e3);
        }
    });
    const A = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11],
      ],
      be = "Formação Alta Renda e Investimentos",
      ge = [
        "",
        "Visão geral do mercado financeiro",
        "Soluções para clientes",
        "Curvas de juros, taxas e renda fixa",
        "Mercado de capitais",
        "Produtos estruturados",
        "Fundos de investimento",
        "Alocação de ativos",
        "Cenário econômico",
        "Proteção patrimonial",
        "Liderança, autoridade e carreira",
        "Captação, prospecção e retenção",
      ];
    let Y = !1;
    async function X(e) {
      await tok();
      const a = cfg(),
        t = await fetch(a.url + "/functions/v1/aulas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: a.key,
            Authorization: "Bearer " + SESS.at,
          },
          body: JSON.stringify(e),
        }),
        o = await t.json().catch(() => ({}));
      if (!t.ok) throw new Error(o.error || "Erro " + t.status);
      return o;
    }
    function fe(e) {
      return `Curso Formação Alta Renda e Investimentos. Módulo ${e.m} (${ge[e.m]}), lição ${e.t}.

Ensine este módulo em profundidade, como um professor de primeira linha, explicando o porquê de cada ponto, com exemplos numéricos hipotéticos e exemplos do mercado brasileiro. Conecte com a atuação consultiva para clientes de alta renda.

Conteúdo:
${e.r.map((a) => "- " + a).join(`
`)}

Pontos de atenção e pegadinhas:
${(e.d || []).map((a) => "- " + a).join(`
`)}

Perguntas de revisão:
${(e.c || []).map((a) => "- " + a[0] + " Resposta: " + a[1]).join(`
`)}`;
    }
    async function he(e) {
      if (Y) return;
      const a = f(() => m.EST_DATA.BIB_AR, null);
      if (!a || !f(() => SESS, null)) {
        e.textContent = "Entre na sua conta.";
        return;
      }
      Y = !0;
      const t = x("v512-ar2-feitas", []);
      try {
        for (let o = 0; o < A.length; o++) {
          if (t.includes(o)) continue;
          const i = a.caps.filter((s) => A[o].includes(s.m));
          e.textContent = `Aula ${o + 1} de ${A.length}: iniciando…`;
          const r = await X({
            acao: "iniciar",
            livro: be,
            numero: o + 1,
            capitulos: A[o].map((s) => ge[s]),
          });
          for (let s = 0; s < i.length; s++) {
            e.textContent = `Aula ${o + 1} de ${A.length}: módulo ${s + 1} de ${i.length} (${i[s].t})…`;
            try {
              await X({
                acao: "enfileirar",
                id: r.id,
                idx: s,
                total: i.length,
                bloco: 0,
                blocos: 1,
                capitulo: i[s].t,
                texto: fe(i[s]),
              });
              continue;
            } catch (l) {
              if (!/desconhecida/i.test(l.message)) throw l;
            }
            let c = 0;
            for (;;)
              try {
                await X({
                  acao: "parte",
                  id: r.id,
                  idx: s,
                  total: i.length,
                  bloco: 0,
                  blocos: 1,
                  capitulo: i[s].t,
                  texto: fe(i[s]),
                });
                break;
              } catch (l) {
                if (++c >= 2 || /Limite|cota/i.test(l.message)) throw l;
                await new Promise((p) => setTimeout(p, 4e3));
              }
          }
          (t.push(o), w("v512-ar2-feitas", t));
        }
        e.textContent =
          "Enviado: o servidor escreve as aulas mesmo com o app fechado e avisa quando ficarem prontas. A ponte gera os vídeos sozinha.";
      } catch (o) {
        e.textContent =
          "Parou: " +
          o.message +
          " Toque de novo para continuar de onde parou.";
      }
      Y = !1;
    }
    function Le() {
      if ($() !== "estudos" || n.getElementById("v512-ar")) return;
      const e = [...n.querySelectorAll("#app *")].find(
        (o) =>
          o.children.length === 0 &&
          o.textContent.trim() === be &&
          o.offsetParent &&
          !o.closest("[data-e2bib],button"),
      );
      if (!e) return;
      const a = n.createElement("div");
      ((a.className = "v512-card"), (a.id = "v512-ar"));
      const t = x("v512-ar2-feitas", []).length;
      ((a.innerHTML = `<button type="button" class="v512-go" style="width:100%;min-height:46px;border-radius:12px;border:0;background:#b58b3d;color:#09090a;font-weight:700;font-size:15px">${t >= A.length ? "Videoaulas geradas" : t ? "Continuar videoaulas (" + t + " de " + A.length + ")" : "Gerar videoaulas do curso (4 aulas, 33 lições)"}</button><div class="mut" style="margin-top:6px" id="v512-ar-st">4 aulas com os 11 módulos (33 lições). Depois a ponte gera os vídeos.</div>`),
        (e.parentElement || n.getElementById("app")).insertBefore(
          a,
          e.nextSibling,
        ),
        (a.querySelector("button").onclick = () =>
          he(a.querySelector("#v512-ar-st"))));
    }
    let xe = 0;
    const Z = () => {
      (clearTimeout(xe),
        (xe = setTimeout(() => {
          try {
            oe();
          } catch {}
          try {
            J();
          } catch {}
          try {
            R();
          } catch {}
          try {
            Le();
          } catch {}
          try {
            ie();
          } catch {}
          try {
            ve();
          } catch {}
        }, 80)));
    };
    function Me() {
      if (typeof m.render0 != "function" || m.render0.__v512) return;
      const e = m.render0,
        a = function () {
          const t = e.apply(this, arguments);
          try {
            R();
          } catch {}
          return (Z(), t);
        };
      ((a.__v512 = 1), (m.render0 = a));
    }
    let ye = 0;
    const Te = setInterval(() => {
      (ye++, Me(), Z(), ye > 20 && clearInterval(Te));
    }, 700);
    (n.addEventListener("click", () => setTimeout(Z, 120)),
      setTimeout(() => {
        (Q(!1).catch(() => {}), qe().catch(() => {}));
      }, 25e3),
      (m.DIARIO_V512 = {
        placarHtml: re,
        calcPar: K,
        bkAuto: Q,
        lsAbre: pe,
        alertasEmConfig: oe,
        arGerar: he,
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em extras-v512.js", e);
}
try {
  (function (d) {
    "use strict";
    const u = d.document;
    if (!u) return;
    const m = (t, e) => {
        try {
          const n = t();
          return n === void 0 ? e : n;
        } catch {
          return e;
        }
      },
      A = (t) =>
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
      g = (t) =>
        t == null || !isFinite(t)
          ? "—"
          : (t < 0 ? "-" : "") +
            "R$ " +
            Math.abs(t).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
      p = (t, e = 2) =>
        t == null || !isFinite(t)
          ? "—"
          : Number(t).toLocaleString("pt-BR", {
              minimumFractionDigits: e,
              maximumFractionDigits: e,
            }),
      b = () => m(() => tab, ""),
      D = (t, e) => {
        try {
          const n = localStorage.getItem(t);
          return n ? JSON.parse(n) : e;
        } catch {
          return e;
        }
      },
      E = (t, e) => {
        try {
          localStorage.setItem(t, JSON.stringify(e));
        } catch {}
      },
      x = (t, e) => {
        try {
          d.toast(t, e || 4500);
        } catch {}
      },
      f = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10),
      O = (t) => t.slice(8, 10) + "/" + t.slice(5, 7),
      C = [
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
      V = () =>
        u.querySelector("#app .dt393-native") || u.getElementById("app"),
      y = (t, e, n) => {
        let r = u.getElementById(t);
        if (r)
          return (
            r.dataset.h !== e && ((r.innerHTML = e), (r.dataset.h = e)),
            r
          );
        const l = n || V();
        if (!l) return null;
        ((r = u.createElement("section")),
          (r.className = "v512-card v514-card"),
          (r.id = t),
          (r.innerHTML = e),
          (r.dataset.h = e));
        const a = l.querySelector("h1,h2");
        return (
          a && a.parentElement
            ? a.parentElement.insertBefore(r, a.nextSibling)
            : l.prepend(r),
          r
        );
      },
      M = u.createElement("style");
    ((M.textContent =
      ".v514-card table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}.v514-card td,.v514-card th{padding:8px 4px;border-top:1px solid rgba(255,255,255,0.07);text-align:right;font-variant-numeric:tabular-nums}.v514-card td:first-child,.v514-card th:first-child{text-align:left}.v514-card ul{margin:8px 0 0;padding-left:16px;font-size:13px;line-height:1.55}.v514-bar{height:10px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;margin:8px 0}.v514-bar i{display:block;height:100%;background:#b58b3d;border-radius:999px}.v514-row{display:flex;gap:8px;align-items:center;margin-top:8px}.v514-row input{width:90px;min-height:38px;border-radius:8px;border:1px solid rgba(181,139,61,0.25);background:#0d0d0e;color:inherit;padding:0 8px;font-size:16px}.v514-row button,.v514-btn{min-height:40px;border-radius:999px;border:1px solid rgba(181,139,61,0.35);background:none;color:inherit;padding:0 16px;font-size:13px}"),
      (u.head || u.documentElement).appendChild(M));
    function T() {
      return m(() => S.trades, [])
        .map((t) => ({
          t,
          c: m(() => (typeof cBRL == "function" ? cBRL(t) : calc(t)), null),
          d: String(t.dt || "").slice(0, 10),
        }))
        .filter((t) => t.c && t.c.pl != null && isFinite(t.c.pl) && t.d);
    }
    function v(t) {
      const e = t.filter((i) => i.c.pl > 0),
        n = t.filter((i) => i.c.pl < 0),
        r = (i) => i.reduce((o, $) => o + $.c.pl, 0),
        l = t.map((i) => i.c.r).filter((i) => i != null && isFinite(i)),
        a = new Set(t.map((i) => i.d)).size,
        s = {};
      t.forEach((i) => {
        const o = i.t.setup || "—";
        s[o] = (s[o] || 0) + 1;
      });
      const h = Object.entries(s).sort((i, o) => o[1] - i[1])[0],
        c = t.filter((i) => i.t.rules).length;
      return {
        n: t.length,
        dias: a,
        porDia: a ? t.length / a : 0,
        acerto: t.length ? (e.length / t.length) * 100 : null,
        res: r(t),
        mg: e.length ? r(e) / e.length : null,
        mp: n.length ? r(n) / n.length : null,
        r: l.length ? l.reduce((i, o) => i + o, 0) / l.length : null,
        setup: h ? h[0] : "—",
        regra: t.length ? (c / t.length) * 100 : null,
      };
    }
    function R() {
      if (b() !== "stats") return;
      const t = T();
      if (t.length < 5) return;
      const e = {};
      t.forEach((o) => {
        (e[o.d.slice(0, 7)] = e[o.d.slice(0, 7)] || []).push(o);
      });
      const n = Object.keys(e).filter((o) => e[o].length >= 3);
      if (n.length < 2) return;
      const r = f().slice(0, 7),
        l = n
          .filter((o) => o !== r)
          .sort((o, $) => v(e[$]).res - v(e[o]).res)[0];
      if (!l) return;
      const a = v(e[r] || []),
        s = v(e[l]),
        h = (o) => C[+o.slice(5, 7) - 1] + "/" + o.slice(2, 4),
        c = (o, $, N, j) =>
          `<tr><td>${o}</td><td>${j($)}</td><td>${j(N)}</td></tr>`,
        i = [];
      (a.n &&
        s.porDia &&
        a.porDia > s.porDia * 1.3 &&
        i.push(
          `Você está operando mais por dia (${p(a.porDia, 1)} contra ${p(s.porDia, 1)}). No melhor mês você foi mais seletivo.`,
        ),
        a.acerto != null &&
          s.acerto != null &&
          a.acerto < s.acerto - 10 &&
          i.push(
            `Acerto caiu de ${p(s.acerto, 0)}% para ${p(a.acerto, 0)}%. Reveja se os setups são os mesmos.`,
          ),
        a.mp != null &&
          s.mp != null &&
          Math.abs(a.mp) > Math.abs(s.mp) * 1.25 &&
          i.push(
            `Perda média maior (${g(a.mp)} contra ${g(s.mp)}): confira se está respeitando o stop.`,
          ),
        a.mg != null &&
          s.mg != null &&
          a.mg < s.mg * 0.75 &&
          i.push(
            `Ganho médio menor (${g(a.mg)} contra ${g(s.mg)}): pode estar saindo cedo dos ganhos.`,
          ),
        a.regra != null &&
          s.regra != null &&
          a.regra < s.regra - 15 &&
          i.push(
            `Menos trades seguindo as regras (${p(a.regra, 0)}% contra ${p(s.regra, 0)}%).`,
          ),
        s.setup !== "—" &&
          a.setup !== s.setup &&
          a.n &&
          i.push(
            `Setup mais usado mudou: era "${s.setup}", agora "${a.setup}".`,
          ),
        a.n
          ? i.length ||
            i.push(
              "Seu mês atual está no mesmo padrão do melhor mês. Mantenha.",
            )
          : i.push("Ainda não há trades fechados neste mês."),
        y(
          "v514-melhor",
          `<h3>Este mês × seu melhor mês</h3><div class="mut">Melhor mês: ${h(l)} (${g(s.res)}).</div>
  <table><tr><th></th><th>${h(r)}</th><th>${h(l)}</th></tr>${c("Resultado", a.res, s.res, g)}${c("Trades", a.n, s.n, (o) => o)}${c("Trades por dia", a.porDia, s.porDia, (o) => p(o, 1))}${c("Acerto", a.acerto, s.acerto, (o) => (o == null ? "—" : p(o, 0) + "%"))}${c("Ganho médio", a.mg, s.mg, g)}${c("Perda média", a.mp, s.mp, g)}${c("Média", a.r, s.r, (o) => (o == null ? "—" : p(o, 2) + "× o risco"))}${c("Seguiu as regras", a.regra, s.regra, (o) => (o == null ? "—" : p(o, 0) + "%"))}${c("Setup mais usado", a.setup, s.setup, A)}</table>
  <ul>${i.map((o) => `<li>${o}</li>`).join("")}</ul>`,
        ));
    }
    function I() {
      if (b() !== "estudos" || typeof estMeta !== "function") return;
      /* v597: a meta semanal aparece só em Hoje e em Progresso. */
      const vista597 = u.querySelector(".dt397-studies")?.dataset.vista;
      if (vista597 && !["est", "desemp"].includes(vista597)) {
        u.getElementById("v514-meta")?.remove();
        return;
      }
      const meta = estMeta(),
        total = semEstudo().tot,
        percent = Math.min(100, (total / meta.min) * 100);
      const legacy = D("v514-meta-est", null),
        legacyValido = EstudosModelo.minutos(legacy);
      const status = meta.definida
        ? total >= meta.min
          ? "Meta da semana concluída."
          : Math.max(0, meta.min - total) + " min para sua meta."
        : "Escolha sua meta semanal. Sugestão: 180 minutos.";
      const html = `<details class="est-meta-details" ${meta.definida ? "" : "open"}><summary>Meta da semana · ${Math.round(total)} / ${meta.min} min${meta.definida ? "" : " sugeridos"}</summary><p class="mut">${status}</p><div class="v514-bar" role="progressbar" aria-label="Tempo de estudo na semana" aria-valuemin="0" aria-valuemax="${meta.min}" aria-valuenow="${Math.min(meta.min, Math.round(total))}"><i style="width:${percent}%"></i></div><label for="v514-meta-in">Minutos por semana</label><div class="v514-row"><input id="v514-meta-in" type="number" min="30" max="6000" step="1" inputmode="numeric" value="${meta.min}"><button type="button" data-v514="meta">Salvar meta</button></div>${!meta.definida && legacyValido ? ' <p class="sm">Meta antiga deste aparelho: ' + legacyValido + ' min. <button type="button" class="btn s" data-est-meta-legado="' + legacyValido + '">Usar esta meta</button></p>' : ""}</details>`;
      let card = u.getElementById("v514-meta");
      if (card && card.contains(u.activeElement)) return;
      if (!card) {
        card = u.createElement("section");
        card.id = "v514-meta";
        card.className = "v512-card v514-card";
      }
      if (card.dataset.h !== html) {
        const open = card.querySelector("details")?.open;
        card.innerHTML = html;
        card.dataset.h = html;
        if (open !== undefined) card.querySelector("details").open = open;
      }
      const header = u.querySelector(".dt397-native-mount>header");
      if (header) {
        if (card.previousElementSibling !== header) header.after(card);
      } else if (!card.parentNode) V()?.prepend(card);
    }
    function B() {
      if (b() !== "home") return;
      const t = new Date(Date.now() - 3 * 36e5),
        e = f(),
        n = t.getUTCDay();
      if (n === 0 || n === 6 || t.getUTCHours() < 18) {
        u.getElementById("v514-resumo")?.remove();
        return;
      }
      const r = T().filter((c) => c.d === e),
        l = m(() => S.trades, []).filter(
          (c) =>
            String(c.dt || "").slice(0, 10) === e &&
            (c.exit == null || c.exit === ""),
        ).length;
      if (!r.length && !l) {
        u.getElementById("v514-resumo")?.remove();
        return;
      }
      const a = v(r),
        s = m(() => d.DIARIO_V506.diaInfo(e), null),
        h = m(() => d.DIARIO_V506.faltou(s), []) || [];
      y(
        "v514-resumo",
        `<h3>Resumo do pregão de hoje</h3><table><tr><td>Resultado</td><td class="${a.res > 0 ? "v512-pos" : a.res < 0 ? "v512-neg" : ""}">${g(a.res)}</td></tr><tr><td>Trades fechados</td><td>${a.n}${l ? ` (+${l} aberto${l > 1 ? "s" : ""})` : ""}</td></tr><tr><td>Acerto</td><td>${a.acerto == null ? "—" : p(a.acerto, 0) + "%"}</td></tr><tr><td>Média</td><td>${a.r == null ? "—" : p(a.r, 2) + "× o risco"}</td></tr>${s ? `<tr><td>Disciplina do dia</td><td>${p(m(() => d.DIARIO_V506.disciplina(s).nota, null) ?? null, 0)}</td></tr>` : ""}</table>
  ${
    h.length
      ? `<ul>${h
          .slice(0, 5)
          .map((c) => `<li>Falta: ${A(c.txt || c)}</li>`)
          .join("")}</ul>`
      : '<div class="mut" style="margin-top:6px">Fechamento do dia completo.</div>'
  }`,
      );
    }
    function F() {
      const t = f(),
        e = [
          ...new Set(
            m(() => S.trades, [])
              .map((l) => String(l.dt || "").slice(0, 10))
              .filter((l) => l && l < t),
          ),
        ].sort(),
        n = e[e.length - 1];
      if (!n) return null;
      const r = m(() => d.DIARIO_V506.diaInfo(n), null);
      return r && r.semFoto > 0 ? { d: n, n: r.semFoto } : null;
    }
    d.addEventListener(
      "click",
      (t) => {
        if (!t.target.closest('[data-a="new"][data-tp],[data-qkn]')) return;
        const n = F();
        if (!n) return;
        (t.preventDefault(),
          t.stopImmediatePropagation(),
          x(
            `Antes de registrar trade novo, coloque as fotos de ${O(n.d)} (${n.n} trade${n.n > 1 ? "s" : ""} sem foto).`,
            7e3,
          ));
        try {
          typeof closeDrawer == "function" && closeDrawer(!1);
        } catch {}
        const r = u.querySelector('[data-dt393-route="ops"]');
        r && b() !== "ops" && r.click();
      },
      !0,
    );
    async function P() {
      if (!m(() => SESS, null) || D("v514-ar-auto", "") === f()) return;
      const t = D("v512-ar2-feitas", []);
      if (
        !t.length ||
        t.length >= 4 ||
        (m(() => d.EST_DATA && d.EST_DATA.BIB_AR, null) ||
          (await new Promise((n) => {
            const r = u.createElement("script");
            ((r.src = "estudos.js?v=522"),
              (r.onload = r.onerror = n),
              u.head.appendChild(r));
          })),
        !m(() => d.EST_DATA && d.EST_DATA.BIB_AR, null))
      )
        return;
      E("v514-ar-auto", f());
      const e = {
        set textContent(n) {
          /Pronto|Parou/.test(n) && x("Videoaulas do curso: " + n, 8e3);
        },
      };
      try {
        await d.DIARIO_V512.arGerar(e);
      } catch {}
    }
    u.addEventListener("click", (t) => {
      const button = t.target.closest(
        '[data-v514="meta"],[data-est-meta-legado]',
      );
      if (!button) return;
      const value =
        button.dataset.estMetaLegado || u.getElementById("v514-meta-in")?.value;
      if (estDefinirMeta(value)) x("Meta semanal salva.");
    });
    let _ = 0;
    const w = () => {
      (clearTimeout(_),
        (_ = setTimeout(() => {
          for (const t of [R, I, B])
            try {
              t();
            } catch {}
        }, 120)));
    };
    function q() {
      if (typeof d.render0 != "function" || d.render0.__v514) return;
      const t = d.render0,
        e = function () {
          const n = t.apply(this, arguments);
          return (w(), n);
        };
      ((e.__v514 = 1), (d.render0 = e));
    }
    let k = 0;
    const z = setInterval(() => {
      (k++, q(), w(), k > 20 && clearInterval(z));
    }, 700);
    (u.addEventListener("click", () => setTimeout(w, 160)),
      setTimeout(() => {
        P().catch(() => {});
      }, 3e4),
      (d.DIARIO_V514 = {
        melhorMes: R,
        metaEstudo: I,
        resumoPregao: B,
        diaSemFoto: F,
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em extras-v514.js", e);
}
try {
  (function (l) {
    "use strict";
    const r = l.document;
    if (!r) return;
    const v = (s, e) => {
      try {
        const i = s();
        return i === void 0 ? e : i;
      } catch {
        return e;
      }
    };
    let f = !1,
      p = 0;
    const c = 6e4;
    function h(s, e) {
      let i = null;
      for (const n of s) {
        const o = Date.parse(n.dt);
        if (!isFinite(o)) continue;
        const t = n.dtx ? Date.parse(n.dtx) : NaN;
        if (!n.pin && e >= o - 20 * c && e <= o + 10 * c) {
          const a = Math.abs(e - o);
          (!i || a < i.d) && (i = { x: n, k: "pin", d: a });
        }
        if (!n.pout && isFinite(t) && e >= t - 10 * c && e <= t + 20 * c) {
          const a = Math.abs(e - t);
          (!i || a < i.d) && (i = { x: n, k: "pout", d: a });
        }
      }
      return i;
    }
    async function d() {
      if (
        !(
          f ||
          !v(() => SESS && SESS.uid, null) ||
          r.visibilityState !== "visible" ||
          Date.now() - p < 6e4
        )
      ) {
        ((f = !0), (p = Date.now()));
        try {
          const s = new Date(Date.now() - 2592e5).toISOString(),
            e = await (
              await rq(
                "/rest/v1/profit_prints?select=id,chave,tirada&usado=eq.false&tirada=gte." +
                  encodeURIComponent(s) +
                  "&order=tirada.asc&limit=50",
              )
            ).json();
          if (!e || !e.length) return;
          const i = S.trades.filter(
              (t) => t && t.dt && Date.now() - Date.parse(t.dt) < 4 * 864e5,
            ),
            n = [];
          let o = 0;
          for (const t of e) {
            const a = h(i, Date.parse(t.tirada));
            if (a)
              try {
                const u = await (
                  await rq(
                    "/storage/v1/object/authenticated/fotos/" +
                      SESS.uid +
                      "/" +
                      t.chave +
                      ".jpg",
                  )
                ).blob();
                ((M[t.chave] = u),
                  await idb("img", "put", u, t.chave),
                  (S.up = S.up || {}),
                  (S.up[t.chave] = 1),
                  (a.x[a.k] = t.chave),
                  (a.x.u = Date.now()),
                  n.push(t.id),
                  o++);
              } catch (u) {
                console.warn("print", t.chave, u);
              }
          }
          if (n.length) {
            save();
            try {
              render();
            } catch {}
            (await rq("/rest/v1/profit_prints?id=in.(" + n.join(",") + ")", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ usado: !0 }),
            }),
              l.toast &&
                toast(
                  o + " print(s) do Profit colado(s) nas operações.",
                  3500,
                ));
          }
        } catch (s) {
          s && s.status !== 404 && console.warn("prints", s);
        } finally {
          f = !1;
        }
      }
    }
    (setInterval(d, 2e4),
      setTimeout(d, 8e3),
      r.addEventListener("visibilitychange", () => {
        r.visibilityState === "visible" && ((p = 0), setTimeout(d, 1500));
      }),
      (l.DIARIO_V516 = { puxa: d, escolhe: h }));
  })(typeof window < "u" ? window : globalThis);
} catch (e) {
  console.error("[v522] falha em extras-v516.js", e);
}
try {
  (function (n) {
    "use strict";
    const o = n.document;
    if (!o) return;
    const u = (t, e) => {
        try {
          const a = t();
          return a === void 0 ? e : a;
        } catch {
          return e;
        }
      },
      m = "v517-email-",
      v = (t) =>
        new Date(t.getTime() - t.getTimezoneOffset() * 6e4)
          .toISOString()
          .slice(0, 10);
    function h(t) {
      const e = new Date(),
        a = e.getDay();
      if (!t && !(a === 6 || a === 0 || (a === 5 && e.getHours() >= 18)))
        return null;
      const r = new Date(e);
      r.setDate(e.getDate() + (a === 0 ? -1 : 6 - a));
      const s = new Date(r);
      return (s.setDate(r.getDate() - 6), { de: v(s), ate: v(r) });
    }
    async function p(t, e) {
      if (typeof n.csv != "function" || !n.DIARIO_V507)
        throw new Error("Exportação indisponível.");
      const a = S.trades,
        r = n.xlsArquivo,
        s = n.saveFile;
      let l = null;
      S.trades = a.filter(
        (i) => i && i.dt && i.dt.slice(0, 10) >= t && i.dt.slice(0, 10) <= e,
      );
      const c = S.trades.length;
      try {
        ((n.xlsArquivo = (i) => ((l = i), "")),
          (n.saveFile = async () => {}),
          await n.csv("all"));
      } finally {
        ((S.trades = a), (n.xlsArquivo = r), (n.saveFile = s));
      }
      if (!l) throw new Error("Não consegui montar a planilha.");
      return { blob: await n.DIARIO_V507.monta(l), n: c };
    }
    async function d(t) {
      if (!u(() => SESS && SESS.uid, null)) return "Entre na sua conta.";
      const e = h(t);
      if (!e || (!t && u(() => localStorage.getItem(m + e.ate), null)))
        return "";
      const { blob: a, n: r } = await p(e.de, e.ate);
      if (!r && !t) return "";
      /* v600: guarda o resumo da semana (mesmo cálculo do relatório PDF) em weekly_reports. */
      try {
        await n.DiarioRelatorioPDF?.salvarSemana?.(e.de, e.ate);
      } catch (x) {
        console.warn("weekly_reports", x);
      }
      await tok();
      const s = cfg(),
        l = SESS.uid + "/semana-" + e.ate + ".xlsx",
        c = await fetch(s.url + "/storage/v1/object/planilhas/" + l, {
          method: "POST",
          headers: {
            apikey: s.key,
            Authorization: "Bearer " + SESS.at,
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "x-upsert": "true",
          },
          body: a,
        });
      if (!c.ok) throw new Error("Planilha não enviada (" + c.status + ").");
      /* v601: o Relatório de desempenho da semana (PDF) vai anexo junto com a planilha. */
      let pdf601 = "";
      try {
        const R = await n.DiarioRelatorioPDF?.gerar?.("semana", { de: e.de, ate: e.ate });
        if (R && R.bytes) {
          const caminho = SESS.uid + "/semana-" + e.ate + ".pdf",
            up = await fetch(s.url + "/storage/v1/object/planilhas/" + caminho, {
              method: "POST",
              headers: { apikey: s.key, Authorization: "Bearer " + SESS.at, "Content-Type": "application/pdf", "x-upsert": "true" },
              body: new Blob([R.bytes], { type: "application/pdf" }),
            });
          up.ok && (pdf601 = caminho);
        }
      } catch (x) {
        console.warn("pdf da semana", x);
      }
      const i = await fetch(s.url + "/functions/v1/email-semana", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: s.key,
            Authorization: "Bearer " + SESS.at,
          },
          body: JSON.stringify({
            acao: "agora",
            ate: e.ate,
            xlsx: l,
            pdf: pdf601,
            forca: !!t,
          }),
        }),
        g = await i.json().catch(() => ({}));
      if (!i.ok) throw new Error(g.error || "Erro " + i.status);
      try {
        localStorage.setItem(m + e.ate, "1");
      } catch {}
      return String(g.r || "enviado");
    }
    let f = !1;
    async function y() {
      if (!(f || o.visibilityState !== "visible")) {
        f = !0;
        try {
          await d(!1);
        } catch (t) {
          console.warn("email semana", t);
        } finally {
          f = !1;
        }
      }
    }
    (setTimeout(y, 3e4),
      o.addEventListener("visibilitychange", () => {
        o.visibilityState === "visible" && setTimeout(y, 2e4);
      }));
    function w() {
      if (o.getElementById("v517-em") || !u(() => SESS && SESS.uid, null))
        return;
      const t = o.getElementById("v512-bk");
      if (!t) return;
      const e = o.createElement("section");
      ((e.className = "v512-card"),
        (e.id = "v517-em"),
        (e.innerHTML =
          '<h3>Planilha e relatório da semana por e-mail</h3><div class="mut">Toda sexta depois das 18h (ou no fim de semana, quando abrir o app) a planilha de operações da semana, com as fotos, e o Relatório de desempenho em PDF vão para o seu e-mail.</div><div class="v512-seg"><button type="button" data-v517em>Enviar agora</button></div>'),
        t.after(e));
    }
    (setInterval(w, 1500),
      o.addEventListener(
        "click",
        async (t) => {
          const e = t.target.closest("[data-v517em]");
          if (e) {
            ((e.disabled = !0), (e.textContent = "Montando e enviando…"));
            try {
              const a = await d(!0);
              e.textContent = /enviado/.test(a) ? "Enviado!" : a;
            } catch (a) {
              e.textContent = String(a.message || a).slice(0, 60);
            }
            setTimeout(() => {
              ((e.disabled = !1), (e.textContent = "Enviar agora"));
            }, 6e3);
          }
        },
        !0,
      ),
      (n.DIARIO_V517 = { envia: d, semana: h }));
  })(typeof window < "u" ? window : globalThis);
} catch (e) {
  console.error("[v522] falha em extras-v517.js", e);
}
try {
  (function (d) {
    "use strict";
    const r = d.document;
    if (!r) return;
    const c = (t, e) => {
        try {
          const a = t();
          return a === void 0 ? e : a;
        } catch {
          return e;
        }
      },
      n = (t) =>
        String(t ?? "").replace(
          /[&<>"]/g,
          (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e],
        ),
      p = [
        ["ICEEUR:BRN1!", "Petróleo", 3],
        ["SGX:FEF1!", "Minério", 3],
        ["COMEX:HG1!", "Cobre", 3],
        ["TVC:GOLD", "Ouro", 2.5],
        ["CBOT:ZS1!", "Soja", 3],
        ["NYMEX:NG1!", "Gás natural", 6],
        ["FX_IDC:USDBRL", "Dólar", 1.5],
        ["TVC:DXY", "DXY", 1],
        ["BMFBOVESPA:IBOV", "Ibovespa", 2],
        ["SP:SPX", "S&P 500", 2],
        ["AMEX:EWZ", "EWZ", 3],
        ["BMFBOVESPA:PETR4", "PETR4", 4],
        ["BMFBOVESPA:VALE3", "VALE3", 4],
        ["BINANCE:BTCUSDT", "Bitcoin", 5],
      ],
      h = (t) =>
        (+t).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
    try {
      typeof NP < "u" &&
        !NP._mov1 &&
        ((NP._mov1 = 1),
        (NP.on = NP.on || {}),
        NP.on.mov === void 0 && (NP.on.mov = !0),
        NP.on.div === void 0 && (NP.on.div = !0),
        (NP.movLim = NP.movLim || {}),
        alSave(),
        setTimeout(() => {
          try {
            alPush();
          } catch {}
        }, 4e3));
    } catch {}
    try {
      const t = alAbHtml;
      alAbHtml = function (e) {
        const a = c(() => NP.movLim, {}) || {};
        return (
          t.apply(this, arguments) +
          `${e("mov", "Movimentos fortes com o motivo (petróleo, minério, dólar…)")}<div class="sm mut" style="margin-bottom:6px">Quando o ativo passa do limite no dia, chega o aviso com a notícia que explica. Avisa de novo se o movimento crescer.</div>
<div class="v518-lim">${p.map(([o, s, i]) => `<label>${n(s)}<span><input type="number" inputmode="decimal" step="0.5" min="0.5" max="20" data-v518lim="${n(o)}" value="${n(a[o] || i)}">%</span></label>`).join("")}</div>
${e("div", "Divergência: petróleo × PETR4, minério × VALE3, S&P × Ibovespa")}<div class="sm mut" style="margin-bottom:8px">Durante o pregão: a matéria-prima anda 2% ou mais e a ação ligada a ela não acompanha.</div>`
        );
      };
    } catch {}
    r.addEventListener(
      "change",
      (t) => {
        const e = t.target.closest && t.target.closest("[data-v518lim]");
        if (!e) return;
        const a = parseFloat(String(e.value).replace(",", "."));
        try {
          NP.movLim = NP.movLim || {};
          const o = p.find((s) => s[0] === e.dataset.v518lim)[2];
          (isFinite(a) && a > 0 && a !== o
            ? (NP.movLim[e.dataset.v518lim] = a)
            : delete NP.movLim[e.dataset.v518lim],
            alSave(),
            alPush());
        } catch {}
      },
      !0,
    );
    let l = { t: 0, L: null };
    async function v() {
      if (Date.now() - l.t < 12e4 && l.L) return l.L;
      if (!c(() => SESS && SESS.uid, null)) return null;
      await tok();
      const t = cfg(),
        e = new Date(Date.now() - 3 * 36e5 - 0).toISOString().slice(0, 10),
        a = await fetch(
          t.url +
            "/rest/v1/movimentos?select=ativo,variacao,preco,motivo,manchetes,b3,criado,simbolo&dia=gte." +
            new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10) +
            "&order=criado.desc&limit=30",
          { headers: { apikey: t.key, Authorization: "Bearer " + SESS.at } },
        );
      return a.ok ? ((l = { t: Date.now(), L: await a.json() }), l.L) : null;
    }
    const b = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
    async function u(force = false) {
      if (force) { l.t = 0; r.getElementById("v518-mov")?.remove(); }
      if (
        c(() => tab, "") !== "mercado" ||
        c(() => MKT.tab, "") !== "cq" ||
        r.getElementById("v518-mov")
      )
        return;
      const t = r.querySelector("#app:not(.v503-fantasma) #cotbox");
      if (!t) return;
      const e = r.createElement("details");
      ((e.id = "v518-mov"),
        (e.className = "v518-mov"),
        (e.innerHTML =
          '<summary class="v518-h">Movimentos fortes <span class="mut">carregando…</span></summary>'),
        t.after(e));
      const a = await v().catch(() => null);
      if (!e.isConnected) return;
      if (!a) {
        e.innerHTML = '<summary class="v518-h">Movimentos fortes</summary><p class="mut">' + (c(() => SESS && SESS.uid, null) ? 'Não foi possível consultar os movimentos agora.' : 'Entre na sua conta para consultar os movimentos.') + '</p><button type="button" data-v518-refresh>Atualizar movimentos</button>';
        return;
      }
      const o = a.filter(
          (i) =>
            String(i.criado).slice(0, 10) >= b() ||
            new Date(i.criado) > Date.now() - 18 * 36e5,
        ),
        s = o.length ? o : a.slice(0, 3);
      e.innerHTML =
        `<summary class="v518-h">Movimentos fortes <span class="mut">${o.length ? "hoje" : "últimos dias"}</span></summary>` +
        (s.length
          ? s
              .map((i) => {
                const g = /\|/.test(i.simbolo || ""),
                  m = +i.variacao;
                return `<details class="v518-it"><summary><b>${n(i.ativo)}</b>${g ? "" : `<span class="${m >= 0 ? "v518-up" : "v518-dn"}">${m >= 0 ? "+" : ""}${h(m)}%</span>`}<span class="mut">${new Date(i.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></summary>
    <p>${n(i.motivo || "Sem notícia clara.")}</p>${i.b3 && !g ? `<p class="mut">De olho: ${n(i.b3)}</p>` : ""}${(
      i.manchetes || []
    )
      .slice(0, 4)
      .map(
        (f) =>
          `<a href="${n(f.u)}" target="_blank" rel="noopener">${n(f.t)}</a>`,
      )
      .join("")}</details>`;
              })
              .join("")
          : '<div class="mut" style="padding:6px 0">Nenhum movimento forte. Você é avisado quando algo passar do limite.</div>');
    }
    setInterval(() => {
      u().catch(() => {});
    }, 1500);
    try {
      const t = r.createElement("style");
      ((t.textContent =
        ".v518-mov{background:#0d0d0e;border:1px solid rgba(181,139,61,0.18);border-radius:8px;padding:12px 16px;margin:8px 0}.v518-h{font-weight:700;font-size:15px;margin-bottom:8px}.v518-h .mut{font-weight:400;font-size:13px;margin-left:8px}.v518-it{border-top:1px solid rgba(255,255,255,0.06);padding:8px 0}.v518-it summary{display:flex;gap:8px;align-items:center;cursor:pointer;min-height:30px;list-style:none}.v518-it summary .mut{margin-left:auto;font-size:12px}.v518-it p{margin:8px 0;font-size:14px;line-height:1.45;color:#dedcd7}.v518-it a{display:block;font-size:13px;color:#d4b57d;margin:4px 0;text-decoration:none}.v518-up{color:#3db579;font-weight:700}.v518-dn{color:#ed8c7d;font-weight:700}.v518-lim{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin:4px 0 8px}.v518-lim label{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;background:rgba(255,255,255,0.03);border-radius:8px;padding:4px 8px}.v518-lim input{width:56px;text-align:right;min-height:32px}"),
        r.head.appendChild(t));
    } catch {}
    r.addEventListener('click', e => { if (e.target.closest('[data-v518-refresh]')) u(true).catch(() => {}); });
    r.addEventListener('diario:render', () => { u().catch(() => {}); });
    d.DIARIO_V518 = { busca: v, cartao: u };
  })(typeof window < "u" ? window : globalThis);
} catch (e) {
  console.error("[v522] falha em extras-v518.js", e);
}
try {
  (function (p) {
    "use strict";
    const r = p.document;
    if (!r) return;
    const u = (t, e) => {
        try {
          const a = t();
          return a === void 0 ? e : a;
        } catch {
          return e;
        }
      },
      f = (t) =>
        String(t ?? "").replace(
          /[&<>"]/g,
          (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e],
        );
    try {
      const t = feCarrega;
      feCarrega = async function () {
        if (FE.busy || Date.now() - FE.ts < 30 * 6e4) return;
        const e = cfg();
        if (!e) return t.apply(this, arguments);
        FE.busy = 1;
        let a = !1;
        try {
          const o = await fetch(e.url + "/functions/v1/movimentos", {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: e.key },
              body: JSON.stringify({ acao: "fluxo" }),
            }),
            c = await o.json().catch(() => ({}));
          if (o.ok && c.ultimo) {
            ((FE.v = c), (FE.err = ""));
            try {
              ls.set("diario-fluxo", c);
            } catch {}
            a = !0;
          }
        } catch {}
        if (((FE.busy = 0), !a)) return t.apply(this, arguments);
        FE.ts = Date.now();
        const s = r.getElementById("febox");
        s && (s.outerHTML = feHtml());
      };
    } catch {}
    try {
      const t = jrTexto;
      jrTexto = function (e) {
        if (e !== "all") return t.apply(this, arguments);
        const a = u(() => JRN.v, null);
        if (!a) return null;
        const s = [],
          o = t("m");
        return (
          o && s.push("Manchete. " + o),
          (a.materias || []).forEach((c, d) => {
            const n = t(String(d));
            n && s.push(n);
          }),
          s.length ? "Jornal do pregão. " + s.join(" Próxima notícia. ") : null
        );
      };
    } catch {}
    setInterval(() => {
      if (r.getElementById("v519-ouv")) return;
      const t = r.querySelector('[data-jrouve="m"]');
      if (!t) return;
      const e = r.createElement("button");
      ((e.className = "btn"),
        (e.id = "v519-ouv"),
        (e.dataset.jrouve = "all"),
        (e.textContent = "Ouvir o jornal inteiro"),
        (e.style.cssText = "width:100%;margin:8px 0"));
      const a = t.closest(".card") || t.parentElement;
      a.parentElement.insertBefore(e, a);
    }, 1500);
    try {
      typeof NP < "u" &&
        !NP._v519 &&
        ((NP._v519 = 1),
        (NP.on = NP.on || {}),
        NP.on.flx === void 0 && (NP.on.flx = !0),
        NP.on.ins === void 0 && (NP.on.ins = !0),
        alSave(),
        setTimeout(() => {
          try {
            alPush();
          } catch {}
        }, 5e3));
    } catch {}
    try {
      const t = alAbHtml;
      alAbHtml = function (e) {
        return (
          t.apply(this, arguments) +
          `${e("flx", "Fluxo estrangeiro na B3 acima de R$ 1 bi")}<div class="sm mut" style="margin-bottom:6px">Quando a B3 divulga o dia (cerca de 2 dias úteis depois), com o acumulado do mês.</div>${e("ins", "Insiders: diretoria, controlador ou a própria empresa comprando/vendendo")}<div class="sm mut" style="margin-bottom:8px">Ações que você opera ou acompanha, a partir de R$ 1 mi no mês (dados da CVM).</div>`
        );
      };
    } catch {}
    let l = { t: 0, L: null };
    const y = (t) =>
      "R$ " +
      (Math.abs(t) / 1e6).toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
      }) +
      " mi";
    function g() {
      const t = new Set();
      try {
        (S.trades || []).slice(-400).forEach((e) =>
          t.add(
            String(e.ativo || "")
              .toUpperCase()
              .replace(/F$/, ""),
          ),
        );
      } catch {}
      return t;
    }
    async function v() {
      if (
        u(() => tab, "") !== "mercado" ||
        u(() => MKT.tab, "") !== "cq" ||
        r.getElementById("v519-ins")
      )
        return;
      const t = r.getElementById("v518-mov");
      if (!t || !u(() => SESS && SESS.uid, null)) return;
      const e = r.createElement("details");
      ((e.id = "v519-ins"),
        (e.className = "v518-mov"),
        (e.innerHTML =
          '<summary class="v518-h" style="cursor:pointer;list-style:none">Insiders (CVM 44) <span class="mut">quem de dentro comprou ou vendeu</span></summary><div class="mut" style="padding:6px 0">Carregando…</div>'),
        t.after(e));
      try {
        if (!l.L || Date.now() - l.t > 36e5) {
          await tok();
          const n = cfg(),
            i = await fetch(
              n.url +
                "/rest/v1/insiders?select=empresa,tickers,mes,cargo,compras,vendas,liquido&order=mes.desc&limit=600",
              {
                headers: { apikey: n.key, Authorization: "Bearer " + SESS.at },
              },
            );
          l = { t: Date.now(), L: i.ok ? await i.json() : [] };
        }
        const a = l.L || [];
        if (!e.isConnected) return;
        if (!a.length) {
          e.querySelector("div").textContent = "Ainda sem dados da CVM.";
          return;
        }
        const s = [...new Set(a.map((n) => n.mes))].sort().reverse(),
          o =
            s.find(
              (n) =>
                a.filter((i) => i.mes === n && Math.abs(i.liquido) >= 2e5)
                  .length >= 3,
            ) || s[0],
          c = g(),
          d = a
            .filter((n) => n.mes === o && Math.abs(n.liquido) >= 2e5)
            .sort(
              (n, i) =>
                i.tickers.split(",").some((m) => c.has(m)) -
                  n.tickers.split(",").some((m) => c.has(m)) ||
                Math.abs(i.liquido) - Math.abs(n.liquido),
            )
            .slice(0, 14);
        e.querySelector("div").outerHTML =
          `<div class="sm mut" style="margin:4px 0 6px">Mês ${o.slice(5)}/${o.slice(0, 4)} · a CVM divulga com cerca de 10 dias de atraso. Compra de insider não é recomendação: veja junto com o gráfico.</div>` +
          d
            .map(
              (n) =>
                `<div class="v518-it" style="display:flex;gap:10px;align-items:center"><b>${f(n.tickers.split(",")[0])}</b><span class="mut" style="flex:1;font-size:13px">${f(n.cargo)}</span><span class="${n.liquido >= 0 ? "v518-up" : "v518-dn"}">${n.liquido >= 0 ? "comprou" : "vendeu"} ${y(n.liquido)}</span></div>`,
            )
            .join("");
      } catch {
        e.querySelector("div") &&
          (e.querySelector("div").textContent = "Não consegui carregar agora.");
      }
    }
    (setInterval(() => {
      v().catch(() => {});
    }, 1700),
      (p.DIARIO_V519 = { insCartao: v }));
  })(typeof window < "u" ? window : globalThis);
} catch (e) {
  console.error("[v522] falha em extras-v519.js", e);
}
try {
  (function (c) {
    "use strict";
    const n = c.document;
    if (!n) return;
    const d = (a, e) => {
        try {
          const o = a();
          return o === void 0 ? e : o;
        } catch {
          return e;
        }
      },
      f = (a) =>
        String(a ?? "").replace(
          /[&<>"]/g,
          (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e],
        ),
      y = (a) => {
        const e = Math.abs(a),
          o = a < 0 ? "−" : "+";
        return e >= 1e9
          ? o +
              "R$ " +
              (e / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) +
              " bi"
          : o +
              "R$ " +
              (e / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
              " mi";
      },
      i = (a) => /^(WIN|WDO|IND|DOL)/.test(a),
      h = (a) =>
        (a < 0 ? "−" : "+") +
        Math.abs(Math.round(a)).toLocaleString("pt-BR") +
        " contr.",
      l = (a, e) => (i(a) ? h(e) : y(e));
    let s = { t: 0, L: null };
    async function m() {
      if (s.L && Date.now() - s.t < 6e4) return s.L;
      await tok();
      const a = cfg(),
        e = new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10),
        o = await fetch(
          a.url +
            "/rest/v1/fluxo_acoes?select=*&user_id=eq." +
            SESS.uid +
            "&order=dia.desc&limit=60",
          { headers: { apikey: a.key, Authorization: "Bearer " + SESS.at } },
        );
      return ((s = { t: Date.now(), L: o.ok ? await o.json() : [] }), s.L);
    }
    async function p() {
      if (
        d(() => tab, "") !== "mercado" ||
        d(() => MKT.tab, "") !== "cq" ||
        n.getElementById("v520-fa") ||
        !d(() => SESS && SESS.uid, null)
      )
        return;
      const a = n.getElementById("v519-ins") || n.getElementById("v518-mov");
      if (!a) return;
      const e = n.createElement("details");
      ((e.id = "v520-fa"),
        (e.className = "v518-mov"),
        (e.innerHTML =
          '<summary class="v518-h" style="cursor:pointer;list-style:none">Fluxo por ação <span class="mut">agressão e estrangeiras (ponte)</span></summary><div class="mut" style="padding:6px 0">Carregando…</div>'),
        a.after(e));
      try {
        const o = await m();
        if (!e.isConnected) return;
        const r = e.querySelector("div");
        if (!o.length) {
          r.innerHTML =
            'Sem dados ainda. Precisa da ponte v309 ligada com o Profit aberto no pregão. As ações ficam em "fluxo_ativos" no config.json da ponte.';
          return;
        }
        const u = o[0].dia,
          g = o
            .filter((t) => t.dia === u)
            .map((t) => ({
              ...t,
              sag: +t.ag_compra - +t.ag_venda,
              sest: +t.est_compra - +t.est_venda,
              pct:
                +t.ag_compra + +t.ag_venda
                  ? Math.round(
                      (+t.ag_compra / (+t.ag_compra + +t.ag_venda)) * 100,
                    )
                  : 50,
            }))
            .sort(
              (t, v) =>
                i(v.ativo) - i(t.ativo) || Math.abs(v.sag) - Math.abs(t.sag),
            );
        r.outerHTML = `<div class="sm mut" style="margin:4px 0 6px">${u.split("-").reverse().join("/")} · atualizado ${new Date(g[0].atualizado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Estimativa pelo RTD do Profit (vê o último negócio a cada meio segundo), não é o número oficial.</div>
<div class="v520-t"><div class="v520-r v520-c"><span>Ação</span><span>Saldo da agressão</span><span>Estrangeiras</span></div>${g.map((t) => `<div class="v520-r"><b>${f(t.ativo.replace(/FUT$/, ""))}</b><span class="${t.sag >= 0 ? "v518-up" : "v518-dn"}">${l(t.ativo, t.sag)}<small> · ${t.pct}% compra</small></span><span class="${t.sest >= 0 ? "v518-up" : "v518-dn"}">${t.est_compra || t.est_venda ? l(t.ativo, t.sest) : "—"}</span></div>`).join("")}</div>
<div class="sm mut" style="margin-top:6px">Saldo da agressão: quem foi a mercado comprando menos quem foi vendendo. Estrangeiras: compras menos vendas de corretoras como Morgan, JP, UBS e Goldman.</div>`;
      } catch {
        const r = e.querySelector("div");
        r && (r.textContent = "Não consegui carregar agora.");
      }
    }
    setInterval(() => {
      p().catch(() => {});
    }, 1800);
    try {
      const a = n.createElement("style");
      ((a.textContent =
        ".v520-t{display:grid;gap:4px}.v520-r{display:grid;grid-template-columns:64px 1fr 1fr;gap:8px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,0.06);font-size:14px}.v520-r small{color:#8e939c;font-weight:400}.v520-c{font-size:12px;color:#8e939c;border-top:0}"),
        n.head.appendChild(a));
    } catch {}
    try {
      typeof NP < "u" &&
        !NP._v522 &&
        ((NP._v522 = 1),
        (NP.on = NP.on || {}),
        NP.on.fla === void 0 && (NP.on.fla = !0),
        alSave(),
        setTimeout(() => {
          try {
            alPush();
          } catch {}
        }, 6e3));
    } catch {}
    try {
      const a = alAbHtml;
      alAbHtml = function (e) {
        return (
          a.apply(this, arguments) +
          `${e("fla", "Fluxo forte por ação (ponte): estrangeiras comprando ou vendendo pesado")}<div class="sm mut" style="margin-bottom:8px">Durante o pregão: R$ 30 mi ou mais numa ação, ou 5 mil contratos no WIN / 2 mil no WDO.</div>`
        );
      };
    } catch {}
    c.DIARIO_V520 = { busca: m, cartao: p };
  })(typeof window < "u" ? window : globalThis);
} catch (e) {
  console.error("[v522] falha em extras-v520.js", e);
}
try {
  (function (i) {
    "use strict";
    const a = i.document;
    // v567: transição "fantasma" desligada. Ela clonava a tela inteira a cada toque e escondia o app
    // durante a troca de aba, o que deixava as abas lentas e fazia toques se perderem.
    if (!a || !i.MutationObserver || !i.DIARIO_V503_LIGADO) return;
    const h = 90,
      A = 480,
      g = 320,
      f = a.documentElement;
    let l = null,
      r = null;
    const x = a.createElement("style");
    ((x.textContent =
      "html[data-v503] #app:not(.v503-fantasma){opacity:0!important}html[data-v503e] #app:not(.v503-fantasma){animation:v503e .11s ease-out}@keyframes v503e{from{opacity:.55}to{opacity:1}}.v503-fantasma{position:fixed!important;z-index:5!important;pointer-events:none!important;margin:0!important;overflow:hidden!important;contain:layout paint}@media (prefers-reduced-motion:reduce){html[data-v503e] #app{animation:none!important}}"),
      (a.head || a.documentElement).appendChild(x));
    function T(e) {
      const t =
        e &&
        e.closest &&
        e.closest("button,[role=tab],a,[data-tab],[data-sub]");
      if (
        !t ||
        t.closest(
          ".v503-fantasma,dialog,[role=dialog],#v434-ov,#aup,.sheet,.ov",
        )
      )
        return null;
      if (
        t.matches("[role=tab],[aria-selected]") ||
        t.closest("#v4-bnav,#bnav,.dt394-quicknav,nav")
      )
        return t;
      const n = a.getElementById("app");
      if (!n || !n.contains(t)) return null;
      const o = t.parentElement;
      if (!o) return null;
      const s = [...o.children].filter(
        (u) => u.tagName === t.tagName && u.offsetParent !== null,
      );
      if (s.length < 2 || s.length > 14) return null;
      const c = t.getBoundingClientRect();
      if (!c.height || c.height > 72) return null;
      for (const u of s)
        if (Math.abs(u.getBoundingClientRect().top - c.top) > 6) return null;
      return t;
    }
    function w(e) {
      for (const t of e)
        if (
          t.nodeType === 1 &&
          (t.childElementCount > 1 || t.offsetHeight > 60)
        )
          return !0;
      return !1;
    }
    const B = () => {
      try {
        return i.tab;
      } catch {
        return null;
      }
    };
    function N(e) {
      for (const t of e.attributes)
        if (/^data-/.test(t.name) && !/^data-v50/.test(t.name) && t.value)
          return [t.name, t.value];
      return [
        "txt",
        (e.textContent || "").trim(),
        (e.parentElement && e.parentElement.className) || "",
      ];
    }
    function R(e) {
      const t = a.getElementById("app");
      if (!t) return null;
      if (e[0] !== "txt") {
        for (const n of t.querySelectorAll("[" + e[0] + "]"))
          if (n.getAttribute(e[0]) === e[1] && n.offsetParent) return n;
        return null;
      }
      for (const n of t.querySelectorAll("button,[role=tab],a"))
        if (
          (n.textContent || "").trim() === e[1] &&
          n.offsetParent &&
          ((n.parentElement && n.parentElement.className) || "") === e[2]
        )
          return n;
      return null;
    }
    function I(e) {
      if (!e || B() !== e.tab) return;
      const t = R(e.k);
      if (!t) return;
      const n = t.getBoundingClientRect().top - e.top;
      Math.abs(n) > 2 && i.scrollBy(0, n);
    }
    function b(e) {
      if (r || (l && performance.now() - l.t < g)) return;
      const t = T(e.target);
      if (!t) return;
      const n = a.getElementById("app");
      if (!n || f.hasAttribute("data-v503")) return;
      const o = n.getBoundingClientRect();
      if (o.bottom < 0 || o.top > innerHeight) return;
      let s;
      try {
        s = n.cloneNode(!0);
      } catch {
        return;
      }
      const c = [],
        u = n.getElementsByTagName("*");
      for (let p = 0; p < u.length; p++) {
        const d = u[p];
        (d.scrollLeft || d.scrollTop) && c.push([p, d.scrollLeft, d.scrollTop]);
      }
      const m =
          n.contains(t) && !t.closest("nav,#v4-bnav,#bnav")
            ? { k: N(t), top: t.getBoundingClientRect().top, tab: B() }
            : null,
        v = performance.now();
      ((l = { clone: s, rect: o, t: v, sc: c, anc: m }),
        setTimeout(() => {
          l && l.t === v && (l = null);
        }, g));
    }
    (i.addEventListener("pointerdown", b, !0),
      i.addEventListener("touchstart", b, { capture: !0, passive: !0 }),
      i.addEventListener("click", b, !0));
    function C() {
      if (!r) return;
      const e = r;
      ((r = null), clearTimeout(e.timer));
      try {
        I(e.anc);
      } catch {}
      (f.removeAttribute("data-v503"),
        f.setAttribute("data-v503e", ""),
        setTimeout(() => f.removeAttribute("data-v503e"), 160));
      try {
        e.fan.remove();
      } catch {}
    }
    function y() {
      if (!r) return;
      const e = performance.now();
      if (i.DIARIO_V503 && i.DIARIO_V503.prende) {
        r.timer = setTimeout(y, 40);
        return;
      }
      if (e - r.ult >= h || e - r.t0 >= A) {
        C();
        return;
      }
      r.timer = setTimeout(
        y,
        Math.min(h - (e - r.ult) + 5, A - (e - r.t0) + 5),
      );
    }
    const M = new MutationObserver((e) => {
      let t = !1;
      for (const m of e)
        if (m.type === "childList" && (w(m.addedNodes) || w(m.removedNodes))) {
          t = !0;
          break;
        }
      if (!t) return;
      if (r) {
        r.ult = performance.now();
        return;
      }
      if (!l || performance.now() - l.t > g) return;
      const { clone: n, rect: o, sc: s, anc: c } = l;
      l = null;
      const u = a.getElementById("app");
      if (u) {
        if (
          (n.removeAttribute("id"),
          (n.id = "app"),
          n.classList.add("v503-fantasma"),
          n.setAttribute("aria-hidden", "true"),
          (n.inert = !0),
          (n.style.cssText += `;top:${o.top}px;left:${o.left}px;width:${o.width}px;height:${Math.max(0, innerHeight - o.top)}px`),
          u.after(n),
          f.setAttribute("data-v503", ""),
          s.length)
        ) {
          const m = n.getElementsByTagName("*");
          for (const [v, p, d] of s) {
            const E = m[v];
            E && ((E.scrollLeft = p), (E.scrollTop = d));
          }
        }
        ((r = {
          fan: n,
          t0: performance.now(),
          ult: performance.now(),
          timer: 0,
          anc: c,
        }),
          (r.timer = setTimeout(y, h + 5)));
      }
    });
    function L() {
      const e = a.getElementById("app");
      if (!e) return setTimeout(L, 300);
      M.observe(e, { childList: !0, subtree: !0 });
    }
    (L(),
      setInterval(() => {
        const e = a.getElementById("app");
        (!r && f.hasAttribute("data-v503") && f.removeAttribute("data-v503"),
          a.querySelectorAll(".v503-fantasma").forEach((t) => {
            (!r || t !== r.fan) && t.remove();
          }));
      }, 1e3),
      (i.DIARIO_V503 = { ehAba: T, revela: C, segura: I }));
  })(window);
} catch (e) {
  console.error("[v522] falha em estabiliza-v503.js", e);
}
