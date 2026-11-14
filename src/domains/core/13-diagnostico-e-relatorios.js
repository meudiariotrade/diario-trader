const r115 = (e) => Math.round(e * 100) / 100,
  fmtHm = (e) =>
    new Date(e).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  MOD_NOME = (e) => (MODS.find((t) => t[0] === e) || [])[1] || "";
function linhasM(e) {
  return modLinhas()
    .filter((t) => t.c && t.c.pl != null && (!e || t.m === e))
    .map((t) => {
      const a = String(t.t.dtx || t.t.dt || ""),
        o = String(t.t.dt || "");
      return {
        t: t.t,
        m: t.m,
        v: emBRL(t.c.pl, moedaT(t.t)),
        r: t.c.r,
        dt: a,
        d: a.slice(0, 10),
        mes: a.slice(0, 7),
        h: /T\d\d/.test(o) ? +o.slice(11, 13) : null,
        cost: emBRL(numN(t.t.cost) || 0, moedaT(t.t)),
      };
    })
    .sort((t, a) => t.dt.localeCompare(a.dt));
}
function numFix(e) {
  const t = e.querySelector(".top");
  if (!t || !t.querySelector("h1")) return;
  const a = [...t.children].filter((n) => n.matches(".g2,#metamod,.card"));
  if (!a.length) return;
  let o = t;
  a.forEach((n) => {
    (o.after(n), (o = n));
  });
  const s = e.querySelector('[data-modpdf="este"]');
  s && s.parentElement.classList.add("pdfrow");
}
const ERL = { k: "diario-erros", err: "", srv: null };
function erLista() {
  try {
    return JSON.parse(APP_STORAGE.getItem(ERL.k + ":" + (syncOwner() || "local")) || "[]");
  } catch {
    return [];
  }
}
function erSalva(e) {
  try {
    APP_STORAGE.setItem(ERL.k + ":" + (syncOwner() || "local"), JSON.stringify(e.slice(-60)));
  } catch {}
}
function erGrava(e, t) {
  try {
    const a = String(window.DiarioDiagnostico?.redact(e) || e || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
    if (
      !a ||
      (!/^Face ID/.test(a) &&
        /ResizeObserver|^Script error\.?$|AbortError|The user aborted|NotAllowedError|cancel/i.test(
          a,
        ))
    )
      return;
    const o = erLista(),
      s = String(typeof tab < "u" ? tab : ""),
      n = a + "|" + s,
      r = o[o.length - 1];
    (r && r.k === n && Date.now() - r.ts < 6e4
      ? ((r.n = (r.n || 1) + 1), (r.env = 0))
      : o.push({
          k: n,
          ts: Date.now(),
          msg: a,
          pilha: String(window.DiarioDiagnostico?.redact(t) || t || "").slice(0, 900),
          tela: s,
          ver: typeof APP_VER < "u" ? APP_VER : "",
          n: 1,
          env: 0,
        }),
      erSalva(o),
      clearTimeout(erGrava._t),
      (erGrava._t = setTimeout(erEnvia, 8e3)));
  } catch {}
}
(addEventListener("error", (e) => {
  (e && e.target && e.target !== window && !e.message) ||
    erGrava(
      e.message || (e.error && e.error.message),
      e.error && e.error.stack,
    );
}),
  addEventListener("unhandledrejection", (e) => {
    const t = e.reason;
    erGrava("(promessa) " + ((t && t.message) || t), t && t.stack);
  }));
{
  const e = console.error;
  console.error = function (...t) {
    try {
      const a = t.find((o) => o instanceof Error);
      a && erGrava(a.message, a.stack);
    } catch {}
    return e.apply(console, t);
  };
}
async function erEnvia() {
  try {
    if (typeof SESS > "u" || !SESS || !cfg() || !navigator.onLine) return;
    const e = erLista(),
      t = e.filter((a) => !a.env);
    if (!t.length) return;
    (await rq("/rest/v1/erros_app", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(
        t.map((a) => ({
          user_id: SESS.uid,
          em: new Date(a.ts).toISOString(),
          versao: a.ver,
          tela: a.tela,
          msg: a.msg,
          pilha: a.pilha,
          vezes: a.n || 1,
          aparelho: navigator.userAgent.slice(0, 160),
        })),
      ),
    }),
      t.forEach((a) => (a.env = 1)),
      erSalva(e),
      (ERL.err = ""));
  } catch (e) {
    ERL.err =
      e && (e.status === 404 || /erros_app/.test(e.message || ""))
        ? 'Falta criar a tabela: rode o SQL "erros-app.sql" no Supabase.'
        : "";
  }
}
setTimeout(erEnvia, 15e3);
function erTexto() {
  return erLista()
    .slice(-20)
    .map(
      (
        e,
      ) => `[${fmtHm(e.ts)}] ${e.ver} · tela ${e.tela || "?"}${e.n > 1 ? " · " + e.n + "x" : ""}
${e.msg}
${(e.pilha || "")
  .split(
    `
`,
  )
  .slice(0, 4).join(`
`)}`,
    ).join(`

`);
}
function erCardHtml() {
  const e = erLista(),
    t = e.filter((o) => Date.now() - o.ts < 7 * 864e5),
    a = e.slice(-4).reverse();
  return `<div class="card" id="ercard"><div class="top"><b>🐞 Erros do app</b><span class="chip" style="color:${t.length ? "var(--am)" : "var(--g)"};border-color:${t.length ? "var(--am)" : "var(--g)"}">${t.length ? t.length + " em 7 dias" : "nenhum em 7 dias"}</span></div>
<div class="sm mut" style="margin:4px 0 6px">Quando algo dá errado, o app anota o erro aqui e na sua conta, sem nenhum dado dos seus trades. Se um aparecer, toque em "Copiar" e mande para o Claude: ajuda a corrigir rápido.</div>
${ERL.err ? `<div class="warn">${esc(ERL.err)}</div>` : ""}
${a.map((o) => `<div class="sm" style="padding:6px 0;border-top:1px solid var(--bd)"><b>${esc(fmtHm(o.ts))}</b> · ${esc(o.tela || "?")}${o.n > 1 ? " · " + o.n + "x" : ""}<div class="mut" style="word-break:break-word">${esc(o.msg)}</div></div>`).join("")}
${e.length ? '<div class="g2" style="margin-top:8px"><button class="btn s" data-erc="copia">Copiar para o Claude</button><button class="btn s" data-erc="limpa">Limpar a lista</button></div>' : ""}</div>`;
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-erc]");
  if (t)
    if (t.dataset.erc === "copia")
      try {
        (await navigator.clipboard.writeText(erTexto()),
          toast("Copiado. Cole na conversa com o Claude."));
      } catch {
        toast("Não deu para copiar neste aparelho.");
      }
    else (erSalva([]), render());
});
const DG2 = { busy: 0, res: null, em: 0, face: "" },
  comTempo = (e, t) =>
    Promise.race([
      e,
      new Promise((a, o) =>
        setTimeout(
          () => o(new Error("não respondeu em " + Math.round(t / 1e3) + " s")),
          t,
        ),
      ),
    ]);
async function dgRoda() {
  if (DG2.busy) return;
  ((DG2.busy = 1), (DG2.res = null), render());
  const e = [],
    t = cfg(),
    a = typeof SESS < "u" && !!SESS,
    o = (n, r, i, l) => e.push({ n, st: r, d: i, fx: l || "" }),
    s = async (n, r) => {
      try {
        await comTempo(r(), 2e4);
      } catch (i) {
        o(n, "er", String(i.message || i));
      }
    };
  if (
    (o(
      "Internet",
      navigator.onLine ? "ok" : "er",
      navigator.onLine ? "Conectado." : "Sem conexão agora.",
    ),
    !a)
  )
    o(
      "Conta e nuvem",
      "er",
      "Você não entrou na conta neste aparelho: nada vai para a nuvem.",
      "Entre na conta (Conta → Entrar).",
    );
  else {
    const n = S.lastSyncAt
        ? Math.round((Date.now() - S.lastSyncAt) / 6e4)
        : null,
      r = filaPend();
    o(
      "Conta e nuvem",
      r && n != null && n > 30 ? "av" : "ok",
      (n == null
        ? "Ainda não sincronizou."
        : "Última sincronização " + (n < 1 ? "agora" : "há " + n + " min")) +
        (r
          ? ` · ${r} alteração(ões) esperando para subir.`
          : " · nada pendente."),
      r ? 'Toque em "Enviar agora" no card da fila.' : "",
    );
  }
  (await s("Versão do app", async () => {
    let n = [];
    try {
      n = await caches.keys();
    } catch {}
    const r = n.some(
      (i) =>
        i === "diario-" + APP_VER || i.startsWith("diario-" + APP_VER + "-"),
    );
    o(
      "Versão do app",
      r || !n.length ? "ok" : "av",
      `Rodando a ${APP_VER}.` +
        (r || !n.length ? "" : " O celular ainda guarda uma versão antiga."),
      r || !n.length ? "" : "Feche o app de vez e abra de novo.",
    );
  }),
    t &&
      (await s("Funções no servidor", async () => {
        await sysTesta(!0);
        const n = SYS.res || [],
          r = n.filter((i) => i.st !== "ok");
        o(
          "Funções no servidor",
          r.length ? "av" : "ok",
          r.length
            ? r.map((i) => i.l + ": " + i.msg).join(" · ")
            : `As ${n.length} funções responderam na versão certa.`,
        );
      })),
    t &&
      (await s("Balanços (CVM)", async () => {
        const n = await fetch(t.url + "/functions/v1/macro", {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: t.key },
            body: JSON.stringify({ modo: "balancos" }),
          }),
          r = await n.json().catch(() => ({}));
        if (!n.ok) throw new Error(r.error || "Erro " + n.status);
        if (!Array.isArray(r.proximos))
          return o(
            "Balanços (CVM)",
            "er",
            'A função "macro" publicada ainda é a antiga.',
            'Publique a função "macro" mais nova.',
          );
        const i =
          r.proximos.length +
          (Array.isArray(r.recentes) ? r.recentes.length : 0);
        o(
          "Balanços (CVM)",
          i ? "ok" : "av",
          i
            ? `A CVM respondeu: ${r.proximos.length} próximos${Array.isArray(r.recentes) ? " e " + r.recentes.length + " recentes" : ""}.`
            : "A fonte respondeu, mas sem nenhuma empresa. Pode ser semana sem balanços ou a CVM fora do ar.",
          i ? "" : "Teste de novo mais tarde; se continuar vazio, me avise.",
        );
      })),
    a &&
      (await s("Ponte do Profit (cotações)", async () => {
        let n;
        try {
          n = await (
            await rq(
              "/rest/v1/cotacoes?select=ticker,updated_at,ocp,ovd&user_id=eq." +
                SESS.uid +
                "&order=updated_at.desc&limit=80",
            )
          ).json();
        } catch (u) {
          if (/ocp|ovd|column/i.test(u.message || ""))
            return o(
              "Ponte do Profit (cotações)",
              "av",
              "Falta a parte de compra × venda das opções no banco.",
              'Rode o SQL "cotacoes-opcoes.sql" no Supabase.',
            );
          throw u;
        }
        if (!n.length)
          return o(
            "Ponte do Profit (cotações)",
            "av",
            "A ponte nunca mandou cotações para esta conta.",
            "No computador, abra o Profit e rode a ponte (ponte_profit.py).",
          );
        const r = Math.round((Date.now() - Date.parse(n[0].updated_at)) / 6e4),
          i = new Date().getHours(),
          l = new Date().getDay(),
          d = l > 0 && l < 6 && i >= 9 && i < 18,
          c = n.filter((u) => u.ocp != null || u.ovd != null).length,
          p = ((S.ax || {}).ponteOpc || []).length;
        o(
          "Ponte do Profit (cotações)",
          d && r > 10 ? "av" : "ok",
          `Última cotação há ${r < 60 ? r + " min" : Math.round(r / 60) + " h"} · ${n.length} ativo(s)${c ? ` · ${c} opção(ões) com compra × venda` : ""}.`,
          d && r > 10
            ? "Confira se a ponte e o Profit estão abertos no computador."
            : p && !c
              ? "Você pediu análise de opção, mas a ponte não mandou compra × venda: atualize a ponte."
              : "",
        );
      }),
      await s("Trades vindos do Profit", async () => {
        const n = await (
          await rq(
            "/rest/v1/operacoes_profit?select=criado&order=criado.desc&limit=1",
          )
        ).json();
        o(
          "Trades vindos do Profit",
          "ok",
          n.length
            ? "Última operação recebida em " +
                fmtHm(Date.parse(n[0].criado)) +
                "."
            : "Tabela pronta; nenhuma operação recebida ainda.",
        );
      }).catch(() => {}),
      await s("Cópia de segurança", async () => {
        const n = await bkTeste(!0);
        o(
          "Cópia de segurança",
          n.ok ? "ok" : "er",
          n.txt,
          n.ok ? "" : n.fx || "",
        );
      }),
      o(
        "Registro de erros",
        ERL.err ? "av" : "ok",
        ERL.err ||
          (erLista().length
            ? `${erLista().length} erro(s) anotados neste aparelho.`
            : "Nenhum erro anotado."),
        ERL.err ? 'Rode o SQL "erros-app.sql" no Supabase.' : "",
      )));
  {
    const n = typeof Notification < "u" ? Notification.permission : "na";
    let r = null;
    try {
      r = await (
        await comTempo(navigator.serviceWorker.ready, 3e3)
      ).pushManager.getSubscription();
    } catch {}
    o(
      "Notificações",
      n === "granted" && r ? "ok" : "av",
      n === "granted"
        ? r
          ? "Permitidas e inscritas."
          : "Permitidas, mas este aparelho não está inscrito."
        : n === "denied"
          ? "Bloqueadas nos ajustes do celular."
          : "Ainda não permitidas.",
      n === "granted" && r
        ? ""
        : 'Em Alertas, toque em "Ativar notificações". No iPhone o app precisa estar na tela de início.',
    );
  }
  {
    const n = LK.cfg;
    if (!n) o("Bloqueio (Face ID / PIN)", "na", "Desligado.");
    else if (!n.cred) o("Bloqueio (Face ID / PIN)", "ok", "Ligado só com PIN.");
    else {
      let r = !1;
      try {
        r =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {}
      o(
        "Bloqueio (Face ID / PIN)",
        r ? "ok" : "er",
        r
          ? 'Face ID cadastrado e disponível. Toque em "Testar o Face ID" para confirmar.'
          : "O aparelho não oferece mais o Face ID para o app.",
        r ? "" : "Desligue e ligue o bloqueio de novo em Conta.",
      );
    }
  }
  try {
    const n = await navigator.storage.estimate();
    o(
      "Espaço no aparelho",
      n.quota && n.usage / n.quota > 0.8 ? "av" : "ok",
      `${(n.usage / 1048576).toFixed(1).replace(".", ",")} MB usados${n.quota ? " de " + Math.round(n.quota / 1048576) + " MB" : ""}.`,
    );
  } catch {}
  ((DG2.res = e), (DG2.em = Date.now()), (DG2.busy = 0), render());
}
function dgHtml() {
  const e = { ok: "✅", av: "⚠️", er: "❌", na: '<span class="mut">—</span>' },
    t = DG2.res;
  return `<div class="card" id="dgcard"><div class="top"><b>🩺 Testar tudo</b><button class="btn s" data-dg2="1"${DG2.busy ? " disabled" : ""}>${DG2.busy ? "Testando…" : t ? "Testar de novo" : "Testar agora"}</button></div>
<div class="sm mut" style="margin:4px 0">Confere cada parte que depende de fora do app: nuvem, funções, CVM, ponte do Profit, cópias, notificações e Face ID.</div>
${t ? t.map((a) => `<div style="display:flex;gap:8px;padding:7px 0;border-top:1px solid var(--bd)"><span>${e[a.st]}</span><div style="flex:1"><b class="sm">${esc(a.n)}</b><div class="sm">${esc(a.d)}</div>${a.fx ? `<div class="sm" style="color:var(--am)">→ ${esc(a.fx)}</div>` : ""}${a.n.startsWith("Bloqueio") && LK.cfg && LK.cfg.cred ? `<button class="btn s" data-dgface="1" style="margin-top:4px">Testar o Face ID</button> <span class="sm">${esc(DG2.face)}</span>` : ""}</div></div>`).join("") + `<div class="sm mut" style="margin-top:4px">Teste de ${fmtHm(DG2.em)}.</div>` : ""}</div>`;
}
document.addEventListener("click", async (e) => {
  if (
    (e.target.closest("[data-dg2]") && dgRoda(),
    e.target.closest("[data-dgface]"))
  ) {
    DG2.face = "…";
    const t = await lkFace();
    ((DG2.face = t ? "✅ funcionou" : "❌ não reconheceu ou foi cancelado"),
      render());
  }
});
async function bkTeste(e) {
  const t = S.ax ?? (S.ax = {});
  let a;
  try {
    const o = await (
      await rq(
        "/rest/v1/diario_backup?select=dia,data&user_id=eq." +
          SESS.uid +
          "&order=dia.desc&limit=1",
      )
    ).json();
    if (!o[0])
      a = {
        ok: 0,
        txt: "Ainda não há cópia na nuvem.",
        fx: "Ela é feita sozinha uma vez por dia depois de sincronizar.",
      };
    else {
      const s =
          typeof o[0].data == "string" ? JSON.parse(o[0].data) : o[0].data,
        n = o[0].dia;
      if (!s || !Array.isArray(s.trades) || typeof s.days != "object")
        a = {
          ok: 0,
          txt: `A cópia de ${fmtD(n)} está incompleta (sem trades ou dias).`,
          fx: "Me avise: é sinal de problema na cópia.",
        };
      else {
        const r = new Set(s.trades.map((d) => d.id)),
          i = S.del || {},
          l = S.trades.filter(
            (d) =>
              String(d.dt).slice(0, 10) < n &&
              !r.has(d.id) &&
              !i[d.id] &&
              (+d.u || 0) < Date.parse(n + "T00:00"),
          ).length;
        a = l
          ? {
              ok: 0,
              txt: `A cópia de ${fmtD(n)} não tem ${l} trade(s) que existiam antes dela.`,
              fx: "Sincronize e teste de novo amanhã. Se repetir, me avise.",
            }
          : {
              ok: 1,
              txt: `Cópia de ${fmtD(n)} conferida: ${s.trades.length} trades e ${Object.keys(s.days || {}).length} dias. Se precisar, ela traz tudo de volta.`,
            };
      }
    }
  } catch (o) {
    a = {
      ok: 0,
      txt:
        /diario_backup/.test(o.message || "") || o.status === 404
          ? "Falta a tabela de cópias."
          : "Não consegui baixar a cópia: " + (o.message || o),
      fx:
        /diario_backup/.test(o.message || "") || o.status === 404
          ? 'Rode o SQL "seguranca-backup.sql" no Supabase.'
          : "",
    };
  }
  return (
    (t.bkTeste = { em: Date.now(), ok: a.ok, txt: a.txt }),
    save(),
    !e && !a.ok && toast("⚠️ Teste da cópia de segurança: " + a.txt, 6e3),
    a
  );
}
setTimeout(() => {
  try {
    typeof SESS < "u" &&
      SESS &&
      navigator.onLine &&
      Date.now() - (((S.ax || {}).bkTeste || {}).em || 0) > 7 * 864e5 &&
      bkTeste(!1);
  } catch {}
}, 25e3);
function bkTesteHtml() {
  const e = (S.ax || {}).bkTeste;
  return `<div class="card sm" id="bktst"><b>🧪 Teste de restauração</b> · ${e ? `${e.ok ? "✅" : "❌"} ${esc(e.txt)} <span class="mut">(${fmtHm(e.em)})</span>` : '<span class="mut">ainda não testada</span>'}<div class="mut" style="margin:4px 0">Uma vez por semana o app baixa a última cópia e confere se ela traria todos os seus trades de volta, sem mexer em nada.</div><button class="btn s" data-bkt="1">Testar a cópia agora</button></div>`;
}
document.addEventListener("click", async (e) => {
  e.target.closest("[data-bkt]") &&
    (toast("Testando a cópia…"), await bkTeste(!0), render());
});
{
  const e = vConta;
  vConta = function () {
    const t = e.apply(this, arguments);
    try {
      return (
        t +
        dgHtml() +
        (typeof SESS < "u" && SESS ? bkTesteHtml() : "") +
        erCardHtml()
      );
    } catch {
      return t;
    }
  };
}
{
  const e = pfTrade;
  pfTrade = function (t) {
    const a = e.apply(this, arguments);
    return ((S.ax || {}).pfConf !== 0 && (a.pfRev = 1), a);
  };
}
const pfRevL = () => S.trades.filter((e) => e.pfRev);
function pfRevHtml() {
  const e = pfRevL();
  return e.length
    ? `<div class="card" id="pfrev" style="border-color:var(--am)"><div class="top"><b>📥 ${e.length} operação(ões) do Profit para conferir</b><button class="btn s" data-pfok="*">Tudo certo</button></div>
<div class="sm mut" style="margin:4px 0">Já contam no diário. Confira ativo, lado, quantidade e preços; apague o que não for seu ou estiver duplicado.</div>
${e
  .slice(0, 12)
  .map((t) => {
    const a = calc(t);
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--bd)"><div style="flex:1" class="sm"><b>${esc(t.ativo)}</b> · ${t.side === "V" ? "venda" : "compra"} ${esc(t.qty)} · ${esc(fmtD(String(t.dt).slice(0, 10)))} ${esc(String(t.dt).slice(11, 16))}<br>${esc(t.entry)} → ${esc(t.exit || "aberta")}${a.pl != null ? ` · <b class="${cls(a.pl)}">${mT(t, a.pl)}</b>` : ""}</div><button class="btn s" data-pfok="${esc(t.id)}">Ok</button><button class="btn s" data-pfdel="${esc(t.id)}" aria-label="Apagar">✕</button></div>`;
  })
  .join(
    "",
  )}${e.length > 12 ? `<div class="sm mut">+ ${e.length - 12} …</div>` : ""}</div>`
    : "";
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pfok]"),
    a = e.target.closest("[data-pfdel]");
  if (!t && !a) return;
  const o = Date.now();
  if (t)
    (t.dataset.pfok === "*"
      ? pfRevL()
      : S.trades.filter((n) => n.id === t.dataset.pfok)
    ).forEach((n) => {
      (delete n.pfRev, (n.u = o));
    });
  else {
    const n = a.dataset.pfdel;
    if (!confirm("Apagar esta operação importada?")) return;
    ((S.trades = S.trades.filter((r) => r.id !== n)),
      ((S.del ?? (S.del = {}))[n] = o));
  }
  save();
  const s = scrollY;
  (render(), scrollTo(0, s));
});
{
  const e = vImport;
  vImport = function () {
    const t = e.apply(this, arguments);
    try {
      const a = (S.ax || {}).pfConf !== 0;
      return (
        pfRevHtml() +
        t.replace(
          /(Importa\xe7\xe3o autom\xe1tica do Profit<\/b>[\s\S]*?<\/div>)/,
          `$1<label class="ck" style="margin:6px 0"><input type="checkbox" data-pfconf${a ? " checked" : ""}><span>Marcar o que chega do Profit para eu conferir</span></label>`,
        )
      );
    } catch {
      return t;
    }
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-pfconf]");
  t && (((S.ax ?? (S.ax = {})).pfConf = t.checked ? 1 : 0), save());
});
function mmFolgas() {
  const e = [];
  try {
    mmAtivas().forEach((t) => {
      try {
        const a = mesaCalc(t);
        if (!a.pode) return;
        const o = /di\xe1rio/.test(a.pode[0])
          ? +t.perdaDia
          : /total/.test(a.pode[0])
            ? +t.perdaTotal
            : 0;
        e.push({ c: t, M: a, v: a.pode[1], ref: o, lim: a.pode[0] });
      } catch {}
    });
  } catch {}
  return e;
}
function mmAvisa() {
  const e = S.ax ?? (S.ax = {}),
    t = e.mmAv ?? (e.mmAv = {});
  (mmFolgas().forEach((a) => {
    const o = a.v <= 0 ? "r" : a.ref > 0 && a.v <= a.ref * 0.25 ? "a" : "",
      s = a.c.id + "|" + a.M.hoje;
    !o ||
      t[s] === o ||
      t[s] === "r" ||
      ((t[s] = o),
      toast(
        o === "r"
          ? `🛑 ${a.c.nome || "Mesa"}: ${a.lim} acabou. Pare de operar nela hoje.`
          : `⚠️ ${a.c.nome || "Mesa"}: só falta ${mFmt(a.c, a.v)} para ${a.lim}.`,
        7e3,
      ));
  }),
    Object.keys(t).forEach((a) => {
      a.split("|")[1] < diasMais(loc().slice(0, 10), -3) && delete t[a];
    }));
}
{
  const e = limiteConfere;
  limiteConfere = function () {
    e.apply(this, arguments);
    try {
      mmAvisa();
    } catch {}
  };
}
(document.addEventListener("click", (e) => {
  e.target.closest(
    '[data-a="savetrade"],[data-qkok],[data-mtok],[data-a="mtsave"]',
  ) &&
    setTimeout(() => {
      try {
        mmAvisa();
      } catch {}
    }, 500);
}),
  document.addEventListener("click", (e) => {
    e.target.closest('[data-a="fab"]') &&
      setTimeout(() => {
        try {
          const t = document.getElementById("fabm");
          if (!t || t.style.display === "none") return;
          t.querySelector(".fabmesa")?.remove();
          const a = mmFolgas();
          if (!a.length) return;
          const o = document.createElement("div");
          ((o.className = "fabmesa sm"),
            (o.innerHTML = a
              .map(
                (n) =>
                  `<div>🛡️ <b>${esc(n.c.nome || "Mesa")}</b>: ${n.v <= 0 ? '<b class="r">pare hoje</b>' : "ainda pode perder <b>" + esc(mFmt(n.c, n.v)) + "</b>"}</div>`,
              )
              .join("")));
          const s = t.querySelector('[data-a="new"]');
          (s ? s.parentElement : t).prepend(o);
        } catch {}
      }, 10);
  }));
const AJUDA = {
  home: [
    "Início",
    'O resumo do seu dia: se pode operar hoje (turno, trava e limites), resultado, metas e atalhos. Em "Personalizar" você escolhe o que aparece e em que ordem.',
  ],
  dia: [
    "Meu dia",
    'Preparação da manhã, plano do dia, checklists e o fechamento da noite. O "Plano × execução" compara o que você planejou com o que fez e dá uma nota de disciplina.',
  ],
  ops: [
    "Operações",
    'Os quatro módulos: Day trade, Swing, Opções e EUA/Forex. Cada um tem as próprias operações, análises e números. "Geral" junta tudo.',
  ],
  trades: [
    "Day trade",
    "Seus trades do dia na B3 (mini índice, mini dólar, ações). O + registra um trade novo já como day trade.",
  ],
  swing: [
    "Swing trade",
    "Posições de dias e semanas: entrada, stop, alvos e acompanhamento. Backtest e análise ficam nas abas de cima.",
  ],
  opc: [
    "Opções",
    "Suas operações com opções. Carteira mostra a posição montada e os vencimentos; Grade ao vivo e Fluxo trazem o mercado.",
  ],
  opcart: [
    "Carteira de opções",
    "Posição aberta por ativo, cenários de ±10% e o calendário de vencimentos das opções.",
  ],
  opgrade: [
    "Grade ao vivo",
    "Grade de opções com compra × venda e spread vindos do Profit pela ponte. Digite um código para analisar uma opção.",
  ],
  opfluxo: [
    "Fluxo EWZ",
    "Boletas grandes de opções do EWZ lá fora para ler o humor dos estrangeiros com o Brasil.",
  ],
  ativos: [
    "EUA e Forex",
    "Operações em dólar: pares de moedas, futuros americanos e o capital em US$.",
  ],
  stats: [
    "Números",
    'Resultado, acerto, payoff, drawdown e gráficos. Em cada módulo há meta e limite próprios, horários, custo real e comparação entre meses. "Simulações" mostra o "e se".',
  ],
  rev: [
    "Revisão",
    "Revisão da semana e do mês: o que funcionou, erros que mais custaram e a semana separada por modalidade.",
  ],
  mercado: [
    "Mercado",
    "Agenda, balanços, notícias, juros e câmbio. O Ao vivo (altas e baixas, cotações) fica no menu.",
  ],
  live: [
    "Ao vivo",
    "Cotações, altas e baixas e os trades de olho, atualizados durante o pregão.",
  ],
  mesa: [
    "Mesa e risco",
    "Suas mesas proprietárias: regras, meta, quanto ainda pode perder hoje em cada uma e a calculadora de contratos.",
  ],
  carreira: [
    "Plano de transição",
    "Mostra, com os seus resultados líquidos, quantos critérios faltam para sair da CLT com segurança: meses positivos seguidos, média, pior mês, reserva e disciplina.",
  ],
  conta: [
    "Conta",
    'Login, sincronização, cópias de segurança, bloqueio com Face ID, "Testar tudo" e o registro de erros do app.',
  ],
  imposto: [
    "Imposto e importar",
    "Imposto do mês (DARF), custo real e o pacote do contador. A importação do Profit fica junto.",
  ],
  import: [
    "Imposto e importar",
    "Importa o relatório do Profit (ou chega sozinho pela ponte) e calcula o imposto do mês e o custo real.",
  ],
  estudos: [
    "Estudos",
    'CNPI-T: simulados, treino por tema, revisão espaçada e "Treinar os temas fracos". Também livros e planos de estudo.',
  ],
  regras: [
    "Regras",
    "Seu plano escrito. As regras aparecem no checklist e contam na nota de disciplina.",
  ],
};
function ajudaKey() {
  return tab === "stats" && typeof STMOD < "u" && STMOD ? "stats" : tab;
}
function ajudaPoe(e) {
  if (!AJUDA[ajudaKey()]) return;
  const t = e.querySelector("h1");
  if (!t || e.querySelector(".hlp")) return;
  const a =
    t.parentElement && getComputedStyle(t.parentElement).display === "flex";
  t.insertAdjacentHTML(
    a ? "afterend" : "beforebegin",
    `<button class="hlp${a ? "" : " hlpf"}" data-hlp="1" aria-label="O que é esta tela?">?</button>`,
  );
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-hlp]")) {
    e.stopPropagation();
    const t = AJUDA[ajudaKey()];
    if (!t) return;
    document.getElementById("hlpov")?.remove();
    const a = document.createElement("div");
    ((a.id = "hlpov"),
      (a.innerHTML = `<div class="hlpbox"><b style="font-size:18px">${esc(t[0])}</b><p style="margin:8px 0 12px;line-height:1.5">${esc(t[1])}</p><button class="btn" data-hlpx="1" style="width:100%">Entendi</button></div>`),
      document.body.appendChild(a));
    return;
  }
  (e.target.closest("[data-hlpx]") || e.target.id === "hlpov") &&
    document.getElementById("hlpov")?.remove();
});
const PL_MOD = [
  ["dt", "Day trade"],
  ["sw", "Swing"],
  ["op", "Opções"],
  ["ex", "EUA/Forex"],
];
function plExec(e) {
  const t = S.days[e] || {},
    a = t.pl2 || {},
    o = S.trades
      .filter((l) => String(l.dt).slice(0, 10) === e)
      .map((l) => ({ t: l, c: calc(l), m: modDe(l) })),
    s = [];
  if (!o.length) return null;
  if (a.vies === "compra" || a.vies === "venda") {
    const l = o.filter((c) => c.m !== "op"),
      d = l.filter((c) => (a.vies === "compra") != (c.t.side === "C"));
    l.length &&
      s.push([
        !d.length,
        d.length
          ? `${d.length} trade(s) contra o viés de ${a.vies}`
          : `Todos a favor do viés de ${a.vies}`,
      ]);
  }
  if (
    (+a.max > 0 &&
      s.push([
        o.length <= +a.max,
        `${o.length} de no máximo ${a.max} trade(s)`,
      ]),
    Array.isArray(a.mods) && a.mods.length)
  ) {
    const l = o.filter((d) => !a.mods.includes(d.m));
    s.push([
      !l.length,
      l.length
        ? `${l.length} trade(s) fora do que planejou (${[...new Set(l.map((d) => MOD_NOME(d.m)))].join(", ")})`
        : "Só operou o que planejou",
    ]);
  }
  const n = limPerda(t),
    r = dayPL(o.map((l) => ({ ...l.t, c: l.c })));
  n > 0 &&
    s.push([
      r > -n,
      r <= -n
        ? `Passou do limite de perda (${money(r)})`
        : "Respeitou o limite de perda",
    ]);
  const i = o.filter((l) => l.t.rules === "n").length;
  return (
    s.push([
      !i,
      i ? `${i} trade(s) quebrando regra` : "Nenhuma regra quebrada",
    ]),
    { L: s, nota: s.length ? s.filter((l) => l[0]).length / s.length : null }
  );
}
function planoExHtml() {
  const e = D,
    t = S.days[e] || {},
    a = t.pl2 || {},
    o = plExec(e),
    s = ["", "compra", "venda", "neutro"];
  return `<div class="card" id="plcard"><div class="top"><b>🎯 Plano do dia × execução</b>${o && o.nota != null ? `<span class="chip" style="color:${o.nota >= 0.8 ? "var(--g)" : o.nota >= 0.5 ? "var(--am)" : "var(--r)"};border-color:currentColor">disciplina ${Math.round(o.nota * 100)}%</span>` : ""}</div>
<div class="g2" style="margin-top:6px"><label class="sm">Viés<select data-pl2="vies">${s.map((n) => `<option value="${n}"${(a.vies || "") === n ? " selected" : ""}>${n ? n[0].toUpperCase() + n.slice(1) : "—"}</option>`).join("")}</select></label><label class="sm">Máximo de trades<input type="number" inputmode="numeric" min="0" data-pl2="max" value="${esc(a.max || "")}" placeholder="ex.: 3"></label></div>
<div class="sm" style="margin:6px 0 2px">Vou operar</div><div class="chips2">${PL_MOD.map(([n, r]) => `<button class="${(a.mods || []).includes(n) ? "on" : ""}" data-pl2m="${n}">${r}</button>`).join("")}</div>
<label class="sm" style="margin-top:6px">Níveis e "se… então…"<textarea data-pl2="txt" placeholder="ex.: compra no pullback da VWAP se abrir acima de 128.500; não opero antes das 9h15">${esc(a.txt || "")}</textarea></label>
${o ? `<div style="margin-top:8px">${o.L.map(([n, r]) => `<div class="sm">${n ? "✅" : "❌"} ${esc(r)}</div>`).join("")}</div>` : '<div class="sm mut" style="margin-top:6px">Depois dos trades, aqui aparece a comparação com o plano.</div>'}</div>`;
}
const plDia = () => {
  var e;
  const t = (e = S.days)[D] ?? (e[D] = { chk: {} });
  return ((t.u = Date.now()), t.pl2 ?? (t.pl2 = {}));
};
(document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-pl2]");
  if (!t) return;
  const a = plDia();
  if (
    ((a[t.dataset.pl2] = t.dataset.pl2 === "max" ? +t.value || 0 : t.value),
    save(),
    t.dataset.pl2 !== "txt")
  ) {
    const o = scrollY;
    (render(), scrollTo(0, o));
  }
}),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-pl2m]");
    if (!t) return;
    const a = plDia(),
      o = t.dataset.pl2m,
      s = new Set(a.mods || []);
    (s.has(o) ? s.delete(o) : s.add(o), (a.mods = [...s]), save());
    const n = scrollY;
    (render(), scrollTo(0, n));
  }));
const janM = (e) => ((S.ax || {}).janMod || {})[e] || null;
function horasDados(e) {
  const t = {};
  return (
    linhasM(e).forEach((a) => {
      var o;
      if (a.h == null) return;
      const s = t[(o = a.h)] ?? (t[o] = { h: a.h, n: 0, v: 0, g: 0 });
      (s.n++, (s.v += a.v), a.v > 0 && s.g++);
    }),
    Object.values(t).sort((a, o) => a.h - o.h)
  );
}
function horasMelhor(e) {
  let t = null;
  for (let a = 0; a < e.length; a++) {
    let o = 0,
      s = 0;
    for (let n = a; n < e.length && !(n > a && e[n].h !== e[n - 1].h + 1); n++)
      ((o += e[n].v),
        (s += e[n].n),
        s >= 5 &&
          o > 0 &&
          (!t || o > t.v) &&
          (t = { de: e[a].h, ate: e[n].h, v: o, n: s }));
  }
  return t;
}
function horasHtml(e) {
  const t = horasDados(e);
  if (!t.length)
    return '<div class="sm mut">Sem trades com horário nesta modalidade ainda.</div>';
  const a = Math.max(...t.map((r) => Math.abs(r.v))) || 1,
    o = horasMelhor(t),
    s = janM(e) || {},
    n = dshCor();
  return `${o ? `<div class="sm" style="margin-bottom:6px">Sua janela boa até aqui: <b>${o.de}h às ${o.ate}h59</b> (${o.n} trades, <b class="g">${money(o.v)}</b>).</div>` : ""}
<table class="sm"><tr><th>Hora</th><th>Trades</th><th>Acerto</th><th style="width:40%">Resultado</th></tr>${t.map((r) => `<tr><td>${r.h}h</td><td>${r.n}</td><td>${Math.round((r.g / r.n) * 100)}%</td><td><div style="display:flex;align-items:center;gap:6px"><i style="display:block;height:8px;border-radius:8px;width:${Math.max(2, (Math.abs(r.v) / a) * 60)}%;background:${r.v >= 0 ? n.g : n.r}"></i><span class="${cls(r.v)}">${dshK(r.v)}</span></div></td></tr>`).join("")}</table>
<div class="g3" style="margin-top:8px;align-items:end"><label class="sm">Opero das<select data-janm="${e}|de">${[...Array(24).keys()].map((r) => `<option value="${r}"${(s.de ?? (o ? o.de : 9)) === r ? " selected" : ""}>${r}h</option>`).join("")}</select></label><label class="sm">até<select data-janm="${e}|ate">${[...Array(24).keys()].map((r) => `<option value="${r}"${(s.ate ?? (o ? o.ate : 11)) === r ? " selected" : ""}>${r}h59</option>`).join("")}</select></label>
<label class="ck sm"><input type="checkbox" data-janm="${e}|av"${s.av ? " checked" : ""}><span>Avisar fora</span></label></div>`;
}
document.addEventListener("change", (e) => {
  var t;
  const a = e.target.closest("[data-janm]");
  if (!a) return;
  const [o, s] = a.dataset.janm.split("|"),
    n = S.ax ?? (S.ax = {}),
    r = (t = n.janMod ?? (n.janMod = {}))[o] ?? (t[o] = {}),
    i = horasDados(o),
    l = horasMelhor(i);
  (r.de == null && (r.de = l ? l.de : 9),
    r.ate == null && (r.ate = l ? l.ate : 11),
    (r[s] = s === "av" ? (a.checked ? 1 : 0) : +a.value),
    save());
});
{
  const e = prev;
  prev = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("prev");
      if (!t || !T) return;
      const a = [],
        o = calc(T),
        s = numN(T.qty) || 1,
        n = modDe(T);
      if (o.risk > 0 && moedaT(T) !== "USD") {
        const i = riscoTrade(),
          l = o.risk / s,
          d = (typeof CAPU < "u" && CAPU[T.tipo || "D"]) || "contrato";
        if (i > 0) {
          const c = Math.floor(i / l);
          s > c &&
            a.push(
              `<span class="r">Com este stop, ${s} ${d}s passam do seu risco por trade (${money(i)}): o máximo é ${c}.</span>`,
            );
        }
        n === "dt" &&
          mmFolgas()
            .filter((c) => c.c.fonte === "b3" && c.v > 0)
            .forEach((c) => {
              const p = Math.floor(c.v / l);
              a.push(
                `Na mesa ${esc(c.c.nome || "")}, hoje cabem no máximo <b>${p}</b> com este stop.`,
              );
            });
      }
      const r = janM(n);
      if (r && r.av && /T\d\d/.test(String(T.dt || ""))) {
        const i = +String(T.dt).slice(11, 13);
        (i < r.de || i > r.ate) &&
          a.push(
            `<span style="color:var(--am)">⏰ Fora da sua janela boa de ${esc(MOD_NOME(n))} (${r.de}h às ${r.ate}h59).</span>`,
          );
      }
      a.length &&
        t.insertAdjacentHTML(
          "beforeend",
          '<div class="pv115" style="margin-top:6px">' +
            a.join("<br>") +
            "</div>",
        );
    } catch {}
  };
}
const VG = { ok: "", tm: 0 };
function vgChecar(e) {
  if (!e || S.trades.some((p) => p.id === e.id)) return null;
  const t = Date.parse(String(e.dt || "")),
    a = Date.now();
  if (!(t > a - 20 * 6e4 && t < a + 5 * 6e4)) return null;
  const o = numN(e.qty) || 0;
  if (!(o > 0)) return null;
  const s = String(e.dt).slice(0, 10),
    n = S.trades
      .map((p) => ({ x: p, c: calc(p) }))
      .filter(
        (p) => p.c.pl != null && String(p.x.dtx || p.x.dt).slice(0, 10) === s,
      )
      .sort((p, u) =>
        String(p.x.dtx || p.x.dt).localeCompare(String(u.x.dtx || u.x.dt)),
      ),
    r = n[n.length - 1];
  if (!r || r.c.pl >= 0) return null;
  const i = Date.parse(String(r.x.dtx || r.x.dt));
  if (!(t - i <= 30 * 6e4 && t >= i - 6e4)) return null;
  const l = S.trades
      .filter((p) => (p.tipo || "D") === (e.tipo || "D"))
      .slice(-20)
      .map((p) => numN(p.qty) || 0)
      .filter((p) => p > 0)
      .sort((p, u) => p - u),
    d = l.length ? l[Math.floor(l.length / 2)] : 0,
    c = numN(r.x.qty) || 0;
  return o > Math.max(d, c)
    ? { u: r, q: o, med: d || c, min: Math.max(1, Math.round((t - i) / 6e4)) }
    : null;
}
(document.addEventListener(
  "click",
  (e) => {
    if (
      !e.target.closest('[data-a="savetrade"]') ||
      typeof T > "u" ||
      !T ||
      VG.ok === T.id
    )
      return;
    const t = vgChecar(T);
    if (!t) return;
    (e.stopImmediatePropagation(),
      e.preventDefault(),
      document.getElementById("vgov")?.remove());
    const a = document.createElement("div");
    a.id = "vgov";
    const o = Date.now() + 12e4;
    ((a.innerHTML = `<div class="hlpbox"><b style="font-size:18px">✋ Mão maior logo depois de um stop</b><p style="margin:8px 0;line-height:1.5">O último trade (<b>${esc(t.u.x.ativo)}</b>) perdeu <b class="r">${money(emBRL(t.u.c.pl, moedaT(t.u.x)))}</b> há ${t.min} min, e agora você está entrando com <b>${t.q}</b> (o normal é ${t.med}). Esse é o desenho da operação de vingança.</p><p class="sm mut" style="margin:0 0 12px">Respire 2 minutos e releia o plano. Se ainda fizer sentido, salve com a mão normal.</p>
<button class="btn" data-vg="volta" style="width:100%">Voltar e diminuir a mão</button><button class="btn s" data-vg="segue" style="width:100%;margin-top:8px" disabled>Salvar assim mesmo (<span id="vgcd">2:00</span>)</button></div>`),
      document.body.appendChild(a),
      clearInterval(VG.tm),
      (VG.tm = setInterval(() => {
        const s = Math.max(0, Math.ceil((o - Date.now()) / 1e3)),
          n = document.getElementById("vgcd");
        if (!n) {
          clearInterval(VG.tm);
          return;
        }
        if (
          ((n.textContent =
            Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0")),
          !s)
        ) {
          clearInterval(VG.tm);
          const r = a.querySelector('[data-vg="segue"]');
          r && (r.disabled = !1);
        }
      }, 1e3)),
      ((S.ax ?? (S.ax = {})).vgLog = ((S.ax || {}).vgLog || [])
        .concat([{ d: loc().slice(0, 16), a: T.ativo, q: t.q }])
        .slice(-50)),
      save());
  },
  !0,
),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-vg]");
    if (!t) return;
    const a = document.getElementById("vgov");
    if ((clearInterval(VG.tm), a?.remove(), t.dataset.vg === "volta")) {
      const o = document.querySelector('input[name="qty"]');
      o && (o.focus(), o.select && o.select());
      return;
    }
    typeof T < "u" &&
      T &&
      (T.tilt || (T.tilt = "mão maior depois do stop"),
      (VG.ok = T.id),
      document.querySelector('[data-a="savetrade"]')?.click());
  }));
const simReg = () => {
  var e;
  return (
    (e = S.ax ?? (S.ax = {})).simReg ??
    (e.simReg = { stops: 2, hora: "", dia: "", max: 0 })
  );
};
function simRegra(e) {
  const t = simReg(),
    a = {},
    o = {},
    s = [];
  return (
    e.forEach((n) => {
      const r = n.d;
      (t.dia !== "" && new Date(r + "T12:00").getDay() === +t.dia) ||
        (t.hora !== "" && n.h != null && n.h >= +t.hora) ||
        (+t.stops > 0 && (a[r] || 0) >= +t.stops) ||
        (+t.max > 0 && (o[r] || 0) >= +t.max) ||
        (s.push(n),
        (o[r] = (o[r] || 0) + 1),
        n.v < 0 && (a[r] = (a[r] || 0) + 1));
    }),
    s
  );
}
{
  const e = simESe;
  simESe = function (t, a) {
    const o = e.apply(this, arguments);
    try {
      const s = simReg(),
        n = simRes(t),
        r = simRes(simRegra(t)),
        i = r.tot - n.tot,
        l = [
          "Domingo",
          "Segunda",
          "Terça",
          "Quarta",
          "Quinta",
          "Sexta",
          "Sábado",
        ];
      return (
        o +
        `<h2>Monte a sua regra</h2><div class="card" id="simreg"><div class="g2"><label class="sm">Parar depois de<select data-simr="stops">${[0, 1, 2, 3, 4].map((d) => `<option value="${d}"${+s.stops === d ? " selected" : ""}>${d ? d + " stop(s) no dia" : "não parar"}</option>`).join("")}</select></label>
<label class="sm">Máximo de trades no dia<select data-simr="max">${[0, 1, 2, 3, 4, 5, 6, 8, 10].map((d) => `<option value="${d}"${+s.max === d ? " selected" : ""}>${d || "sem limite"}</option>`).join("")}</select></label>
<label class="sm">Não operar a partir das<select data-simr="hora"><option value="">—</option>${[9, 10, 11, 12, 13, 14, 15, 16, 17].map((d) => `<option value="${d}"${String(s.hora) === String(d) ? " selected" : ""}>${d}h</option>`).join("")}</select></label>
<label class="sm">Não operar na<select data-simr="dia"><option value="">—</option>${[1, 2, 3, 4, 5].map((d) => `<option value="${d}"${String(s.dia) === String(d) ? " selected" : ""}>${l[d]}</option>`).join("")}</select></label></div>
${simLinhas(
  [
    { nome: "Como foi", curva: n.curva, cor: a.mut, base: 1 },
    { nome: "Com a sua regra", curva: r.curva, cor: a.ac },
  ],
  a,
)}
<div class="kv">${KV("Resultado", money(r.tot), cls(r.tot), "real " + money(n.tot))}${KV("Diferença", (i >= 0 ? "+" : "") + money(i), cls(i))}${KV("Pior queda", money(-r.dd), "r", "real " + money(-n.dd))}${KV("Trades", String(r.n), "", "real " + n.n)}</div>
<div class="sm mut">Usa os seus trades reais deste período, tirando os que a regra não deixaria fazer. Não inventa trades novos.</div></div>`
      );
    } catch {
      return o;
    }
  };
}
document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-simr]");
  if (!t) return;
  ((simReg()[t.dataset.simr] = t.value), save());
  const a = scrollY;
  (render(), scrollTo(0, a));
});
function mesNums(e) {
  const t = e.filter((p) => p.v > 0),
    a = e.filter((p) => p.v < 0),
    o = {},
    s = {};
  e.forEach((p) => {
    ((o[p.d] = (o[p.d] || 0) + p.v),
      p.h != null && (s[p.h] = (s[p.h] || 0) + p.v));
  });
  let n = 0,
    r = 0,
    i = 0;
  e.forEach((p) => {
    ((n += p.v), (r = Math.max(r, n)), (i = Math.max(i, r - n)));
  });
  const l = t.length ? sum(t.map((p) => p.v)) / t.length : null,
    d = a.length ? -sum(a.map((p) => p.v)) / a.length : null,
    c = Object.entries(s).sort((p, u) => u[1] - p[1])[0];
  return {
    tot: sum(e.map((p) => p.v)),
    n: e.length,
    ac: e.length ? t.length / e.length : null,
    pay: l != null && d ? l / d : null,
    maiorP: a.length ? Math.min(...a.map((p) => p.v)) : 0,
    piorD: Object.values(o).length ? Math.min(0, ...Object.values(o)) : 0,
    dd: i,
    custo: sum(e.map((p) => p.cost)),
    hora: c ? c[0] + "h" : "–",
    dias: Object.keys(o).length,
  };
}
function cmpHtml(e) {
  const t = linhasM(e),
    a = [...new Set(t.map((u) => u.mes))].sort().reverse();
  if (a.length < 2)
    return '<div class="sm mut">Precisa de pelo menos dois meses com trades.</div>';
  const o = (S.ax || {}).cmpM || {},
    s = a.includes(o.a) ? o.a : a[0],
    n = a.includes(o.b) ? o.b : a[1],
    r = mesNums(t.filter((u) => u.mes === s)),
    i = mesNums(t.filter((u) => u.mes === n)),
    l = (u) =>
      new Date(u + "-15T12:00")
        .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        .replace(".", ""),
    d = [
      ["Resultado", "tot", money, 0],
      ["Trades", "n", String, null],
      ["Dias operados", "dias", String, null],
      ["Acerto", "ac", pct0, 0],
      ["Payoff", "pay", (u) => (u == null ? "–" : f2(u)), 0],
      ["Maior perda", "maiorP", money, 0],
      ["Pior dia", "piorD", money, 0],
      ["Pior queda", "dd", (u) => money(-u), 1],
      ["Custos", "custo", money, 1],
      ["Melhor horário", "hora", String, null],
    ];
  let c = null;
  d.forEach(([u, m, , f]) => {
    if (f == null) return;
    const x = r[m],
      v = i[m];
    if (x == null || v == null) return;
    const g = Math.max(Math.abs(v), m === "ac" ? 0.1 : m === "pay" ? 0.5 : 100),
      h = (x - v) / g,
      b = f ? h < 0 : h > 0;
    (!c || Math.abs(h) > Math.abs(c.rel)) && (c = { l: u, rel: h, bom: b });
  });
  const p = (u, m) =>
    `<select data-cmpm="${u}">${a.map((f) => `<option value="${f}"${f === m ? " selected" : ""}>${l(f)}</option>`).join("")}</select>`;
  return `<div class="g2">${`<label class="sm">Mês${p("a", s)}</label><label class="sm">contra${p("b", n)}</label>`}</div>
<table class="sm" style="margin-top:6px"><tr><th></th><th>${l(s)}</th><th>${l(n)}</th></tr>${d
    .map(([u, m, f, x]) => {
      const v = r[m],
        g = i[m];
      let h = "";
      return (
        x != null &&
          v != null &&
          g != null &&
          v !== g &&
          (h = (x ? v < g : v > g) ? "g" : "r"),
        `<tr><td>${u}</td><td class="${h}"><b>${v == null ? "–" : f(v)}</b></td><td>${g == null ? "–" : f(g)}</td></tr>`
      );
    })
    .join("")}</table>
${c && Math.abs(c.rel) > 0.05 ? `<div class="sm" style="margin-top:6px">Maior mudança: <b class="${c.bom ? "g" : "r"}">${esc(c.l)} ${c.bom ? "melhorou" : "piorou"}</b> de ${l(n)} para ${l(s)}.</div>` : ""}`;
}
document.addEventListener("change", (e) => {
  var t;
  const a = e.target.closest("[data-cmpm]");
  if (!a) return;
  ((((t = S.ax ?? (S.ax = {})).cmpM ?? (t.cmpM = {}))[a.dataset.cmpm] =
    a.value),
    save());
  const o = scrollY;
  (render(), scrollTo(0, o));
});
function custoModHtml(e) {
  const t = hjD().slice(0, 4),
    a = linhasM(e).filter((f) => f.d.slice(0, 4) === t);
  if (!a.length)
    return '<div class="sm mut">Sem trades fechados neste ano.</div>';
  const o = sum(a.map((f) => f.v)),
    s = sum(a.map((f) => f.cost)),
    n = o + s,
    r = e === "ex" ? 0 : e === "dt" ? 0.2 : 0.15,
    i = {};
  a.forEach((f) => (i[f.mes] = (i[f.mes] || 0) + f.v));
  let l = 0,
    d = 0;
  Object.keys(i)
    .sort()
    .forEach((f) => {
      ((l += i[f]), l > 0 && ((d += l * r), (l = 0)));
    });
  const c = sum(
      mmAtivas()
        .filter((f) =>
          e === "dt"
            ? f.fonte === "b3" || f.fonte === "mesa"
            : e === "ex"
              ? f.fonte === "usd" || f.fonte === "fx"
              : !1,
        )
        .map((f) => +f.taxa || 0),
    ),
    p = n - s - d - c,
    u = dshCor(),
    m = Math.max(Math.abs(n), 1);
  return `${[
    ["Ganho bruto", n, u.g],
    ["Corretagem e taxas", -s, u.r],
    ["Imposto (estimado)", -d, u.r],
    ["Taxas das mesas", -c, u.r],
    ["Ficou com você", p, p >= 0 ? u.ac : u.r],
  ]
    .filter((f) => f[1] || f[0] === "Ficou com você" || f[0] === "Ganho bruto")
    .map(
      ([f, x, v]) =>
        `<div class="sm" style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="flex:0 0 44%">${f}</span><i style="display:block;height:10px;border-radius:8px;background:${v};width:${Math.max(1, (Math.abs(x) / m) * 50)}%"></i><b class="${cls(x)}">${money(x)}</b></div>`,
    )
    .join("")}
<div class="sm" style="margin-top:6px">${n > 0 ? `De cada R$ 100 que ${esc(MOD_NOME(e))} rendeu em ${t}, <b>R$ ${dshN(((s + d + c) / n) * 100, 0)}</b> ficaram com corretora, bolsa, mesas e governo.` : "Ainda sem ganho bruto no ano."}</div>
<div class="sm mut">${e === "ex" ? "Imposto do exterior não entra nesta estimativa. " : ""}Imposto estimado por mês (${Math.round(r * 100)}%), compensando os prejuízos anteriores. O cálculo oficial fica em Imposto e importar.</div>`;
}
const NUMA = new Set();
function numFerrHtml() {
  const e = typeof STMOD < "u" ? STMOD : "",
    t = (a, o, s) =>
      `<details class="nfer" data-nfer="${a}"${NUMA.has(a) ? " open" : ""}><summary><b>${o}</b></summary><div style="margin-top:8px">${NUMA.has(a) ? s() : ""}</div></details>`;
  return `<div id="numferr">${e ? t("hor", "⏰ Seus horários em " + esc(MOD_NOME(e)), () => horasHtml(e)) : ""}${t("cmp", "📅 Comparar dois meses" + (e ? "" : " (todas as modalidades)"), () => cmpHtml(e))}${e ? t("cus", "💸 Custo real de " + esc(MOD_NOME(e)) + " no ano", () => custoModHtml(e)) : ""}</div>`;
}
document.addEventListener(
  "toggle",
  (e) => {
    const t = e.target;
    if (!t.matches || !t.matches("details.nfer")) return;
    const a = t.dataset.nfer;
    if (t.open) {
      if (!NUMA.has(a)) {
        NUMA.add(a);
        const o = scrollY;
        (render(), scrollTo(0, o));
      }
    } else NUMA.delete(a);
  },
  !0,
);
function semTurnoHtml() {
  try {
    const e = turnoGet();
    if (!e || !e.on) return "";
    const t = loc().slice(0, 10),
      a =
        t.slice(0, 8) +
        String(new Date(+t.slice(0, 4), +t.slice(5, 7), 0).getDate()).padStart(
          2,
          "0",
        ),
      o = (i) => {
        const l = new Date(i + "T12:00").getDay();
        if (l === 0 || l === 6) return ["Estuda", "var(--ac)"];
        const d = (e.dias[i] && e.niv[e.dias[i]]) || "g";
        return d === "r"
          ? ["Revisa", "var(--r)"]
          : d === "a"
            ? ["Cuidado", "var(--am)"]
            : ["Opera", "var(--g)"];
      };
    let s = 0;
    for (let i = t; i <= a; i = diasMais(i, 1)) {
      const l = o(i)[0];
      (l === "Opera" || l === "Cuidado") && s++;
    }
    const n = Array.from({ length: 7 }, (i, l) => diasMais(t, l))
        .map((i) => {
          const [l, d] = o(i);
          return `<div style="flex:1;min-width:0;text-align:center"><div class="sm mut">${diaCurto(i, t)}</div><div style="margin-top:3px;padding:5px 0;border-radius:8px;border:1px solid ${d};color:${d};font-weight:600;font-size:10.5px;line-height:1.15;overflow:hidden;text-overflow:ellipsis">${l}</div></div>`;
        })
        .join(""),
      r = MODS.map(([i]) => {
        const l = metaMod(i);
        if (!(+l.meta > 0)) return "";
        const d = mmDados(i),
          c = l.meta - d.mes;
        return c > 0
          ? `<div class="sm">${esc(MOD_NOME(i))}: faltam <b>${money(c)}</b> → <b>${s ? money(c / s) : "—"}</b> por dia livre</div>`
          : `<div class="sm">${esc(MOD_NOME(i))}: <b class="g">meta do mês batida</b></div>`;
      }).join("");
    return `<div id="semturno" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--bd)"><b class="sm">O que fazer em cada dia</b> <span class="sm mut">(opera · cuidado · revisa · estuda)</span><div style="display:flex;gap:4px;margin-top:6px">${n}</div><div class="sm" style="margin-top:8px">Dias livres para operar até o fim do mês: <b>${s}</b> (contando hoje).</div>${r}</div>`;
  } catch {
    return "";
  }
}
function diaCurto(e, t) {
  return e === t
    ? "hoje"
    : new Date(e + "T12:00")
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "");
}
function semResPush() {
  const e = loc().slice(0, 10),
    t = segundaDe(e),
    a = linhasM("").filter((u) => u.d >= t && u.d <= e);
  if (!a.length)
    return {
      id: t,
      titulo: "📋 Semana sem trades registrados",
      corpo:
        "Use o fim de semana para revisar o plano e estudar. Toque para ver o relatório.",
    };
  const o = sum(a.map((u) => u.v)),
    s = a.filter((u) => u.v > 0).length,
    n = a.reduce((u, m) => (m.v > u.v ? m : u)),
    r = a.reduce((u, m) => (m.v < u.v ? m : u)),
    i = {};
  a.forEach((u) => {
    const m = u.t.err;
    m && m !== "Nenhum" && u.v < 0 && (i[m] = (i[m] || 0) + u.v);
  });
  const l = Object.entries(i).sort((u, m) => u[1] - m[1])[0],
    d = {};
  a.forEach((u) => {
    u.h != null && (d[u.h] = (d[u.h] || 0) + u.v);
  });
  const c = Object.entries(d).sort((u, m) => u[1] - m[1])[0],
    p = l
      ? `evitar "${l[0]}" (custou ${money(l[1])})`
      : c && c[1] < 0
        ? `cuidado com as ${c[0]}h (${money(c[1])})`
        : a.some((u) => u.t.rules === "n")
          ? "não quebrar as regras"
          : "manter o que funcionou";
  return {
    id: t,
    titulo: `📋 Semana: ${money(o)} em ${a.length} trade${a.length > 1 ? "s" : ""}`,
    corpo: `Acerto ${Math.round((s / a.length) * 100)}% · melhor: ${n.t.ativo} ${money(n.v)} · pior: ${r.t.ativo} ${money(r.v)} · Para a próxima: ${p}.`,
  };
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e.apply(this, arguments);
    try {
      t.semres = semResPush();
    } catch {}
    return t;
  };
}
function cnFracos() {
  const e = cnS().r,
    t = Object.keys(CN_TEMAS)
      .map((r) => ({ t: r, s: cnStats((i) => i.t === r) }))
      .filter((r) => r.s.tot),
    a = t.filter((r) => r.s.n >= 3).sort((r, i) => r.s.pc - i.s.pc),
    o = t.filter((r) => r.s.n < 3).sort((r, i) => r.s.n - i.s.n),
    s = [...a, ...o].slice(0, 3).map((r) => r.t);
  let n = [];
  return (
    s.forEach((r) => {
      n = n.concat(
        cnEmbaralha(cnTodas().filter((i) => i.t === r))
          .sort(
            (i, l) =>
              ((e[i.id] || {}).ult === 0 ? -1 : 0) -
                ((e[l.id] || {}).ult === 0 ? -1 : 0) ||
              ((e[i.id] || {}).n || 0) - ((e[l.id] || {}).n || 0),
          )
          .slice(0, 7),
      );
    }),
    { tm: s, L: n }
  );
}
{
  const e = cnInicia;
  cnInicia = function (t, a) {
    if (t !== "fracos") return e.apply(this, arguments);
    const o = cnFracos(),
      s = cnDevidas;
    cnDevidas = () => o.L;
    try {
      e("rev");
    } finally {
      cnDevidas = s;
    }
  };
}
{
  const e = cnHomeHtml;
  cnHomeHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = cnFracos();
      return a.tm.length
        ? t.replace(
            /(<button class="btn s" data-cnm="rev")/,
            `<button class="btn" data-cnm="fracos" style="grid-column:1/-1;margin-bottom:8px">Treinar os 3 temas mais fracos<br><small>${a.tm.map((o) => esc(CN_TEMAS[o])).join(" · ")}</small></button>$1`,
          )
        : t;
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
      if (tab === "stats" && (numFix(t), !t.querySelector("#numferr"))) {
        const a = t.querySelector("#metamod"),
          o = a || t.querySelector(".pdfrow") || t.querySelector(".top");
        o && o.insertAdjacentHTML("afterend", numFerrHtml());
      }
      if (tab === "dia" && !t.querySelector("#plcard") && typeof vDia < "u") {
        const a = t.querySelector("h1");
        if (a && /Meu dia/.test(a.textContent) && !t.querySelector("#lq")) {
          const o = t.querySelector("#dfases");
          o
            ? o.insertAdjacentHTML("beforebegin", planoExHtml())
            : a.insertAdjacentHTML("afterend", planoExHtml());
        }
      }
      if (tab === "home") {
        if (!t.querySelector("#pfrev")) {
          const o = pfRevHtml();
          if (o) {
            const s =
              t.querySelector('[data-hb="hero"]') || t.querySelector(".hero");
            s
              ? s.insertAdjacentHTML("afterend", o)
              : t.insertAdjacentHTML("afterbegin", o);
          }
        }
        const a = t.querySelector('[data-a="tsv"]');
        if (a && !t.querySelector("#semturno")) {
          const o = a.closest(".card");
          o && o.insertAdjacentHTML("beforeend", semTurnoHtml());
        }
      }
      ajudaPoe(t);
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = TraderStyles.slot("legacy-053");
  ((e.textContent = TraderStyles.css("legacy-053")), TraderStyles.mount(e));
}
const corApp2 = () => {
  try {
    const e = ls.get("diario-cor");
    return e === "verde" || e === "aurora" ? e : "edge";
  } catch {
    return "edge";
  }
};
((corAplica = function () {
  const e = corApp2(),
    t = document.documentElement;
  (t.classList.toggle("aurora", e === "aurora"),
    t.classList.toggle("edge", e === "edge"));
}),
  corAplica());
{
  const e = vMais;
  vMais = function () {
    const t = e.apply(this, arguments);
    try {
      const a = corApp2(),
        o = pcModo(),
        s = [
          ["edge", "Edge", "linear-gradient(135deg,#1e2023,#c09442,#d2b276)"],
          [
            "aurora",
            "Aurora",
            "linear-gradient(135deg,#86abcb,#b2aca0,#66cc99)",
          ],
          ["verde", "Esmeralda", "linear-gradient(135deg,#2e8a5c,#46c184)"],
        ];
      return t.replace(
        /<div class="seg" style="margin-top:8px">(?:(?!<\/div>)[^])*?data-cor=[^]*?<\/div>/,
        `<div class="seg" style="margin-top:8px">${s.map(([n, r, i]) => `<button class="${a === n ? "on" : ""}" data-cor="${n}"><span class="cor-dot" style="background:${i}"></span>${r}</button>`).join("")}</div>
<h2>No computador</h2><div class="seg">${[
          ["auto", "Tela inteira (menu ao lado)"],
          ["off", "Igual ao celular"],
        ]
          .map(
            ([n, r]) =>
              `<button class="${o === n ? "on" : ""}" data-pcm="${n}">${r}</button>`,
          )
          .join(
            "",
          )}</div><div class="sm mut" style="margin-top:6px">Em tela larga (computador ou tablet deitado) o app usa a largura toda, com o menu fixo à esquerda.</div>`,
      );
    } catch {
      return t;
    }
  };
}
function hojeKpis() {
  const e = loc().slice(0, 10),
    t = dayTr(e),
    a = t.filter((i) => i.c.pl != null),
    o = a.filter((i) => i.c.pl > 0).length,
    s = t.filter((i) => i.c.risk > 0).map((i) => emBRL(i.c.risk, moedaT(i))),
    n = s.length ? sum(s) / s.length : null,
    r = n != null && typeof pctConta == "function" ? pctConta(n) : "";
  return {
    n: t.length,
    ac: a.length ? o / a.length : null,
    rm: n,
    pr: r ? r.replace("+", "") : "",
  };
}
hero = function (e, t, a, o, s) {
  const n = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    r = typeof streak == "function" ? streak() : 0,
    i = hojeKpis(),
    l = typeof pctConta == "function" ? pctConta(e) : "",
    d = (c, p, u) =>
      `<div class="h2k"><span class="h2ki">${c}</span><b>${p}</b><small>${u}</small></div>`;
  return `<div class="hero hero2"><div class="h2art" aria-hidden="true"></div><div class="h2c"><div class="h2lb">Resumo do dia</div><div class="mut sm cap1">${n}</div>
<div class="big ${cls(e)}" data-count="${e}">${money(e)}</div><div class="sm">Resultado de hoje <span class="mut">· ${a} encerrado(s)</span></div>${l ? `<span class="h2pct ${cls(e)}">${l}</span>` : ""}</div>
<div class="h2ks">${d("⇄", i.n, "Operações")}${d("◎", i.ac == null ? "–" : Math.round(i.ac * 100) + "%", "Assertividade")}${d("⚖", i.rm == null ? "–" : i.pr || (i.rm >= 1e3 ? "R$ " + (i.rm / 1e3).toFixed(1).replace(".", ",") + " mil" : money(i.rm)), "Risco médio")}</div>
${spark().replace('<svg viewBox="0 0 300 50" style="width:100%;', '<svg viewBox="0 0 300 50" preserveAspectRatio="none" style="width:100%;height:56px;').replace('<polyline fill="none"', '<polyline vector-effect="non-scaling-stroke" fill="none"')}<div>${r ? `<span class="chip">🔥 ${r} dia(s) sem erro</span>` : ""}<span class="chip">📂 ${o} aberta(s)</span><span class="chip">✅ ${s}/${S.rules.length} regras hoje</span></div></div>`;
};
const ICO_UP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  ICO_DN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/></svg>',
  ICO_OPN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
function trDesc(e) {
  const t = e.tipo || "D";
  return t === "O"
    ? `${e.side === "V" ? "Venda" : "Compra"} de ${e.ot === "P" ? "put" : "call"}`
    : t === "S"
      ? "Swing" + (e.setup ? " · " + e.setup : "")
      : t === "F" || e.forex
        ? "Forex"
        : (e.side === "V" ? "Venda" : "Compra") +
          (e.setup ? " · " + e.setup : "");
}
function trBadge(e, t) {
  return t
    ? '<span class="bdg op">ABERTA</span>'
    : e.pl > 0
      ? '<span class="bdg w">WIN</span>'
      : e.pl < 0
        ? '<span class="bdg l">LOSS</span>'
        : '<span class="bdg be">0 × 0</span>';
}
function trLinha(e) {
  const t = calc(e),
    a = t.pl == null,
    o = a ? "n" : t.pl > 0 ? "g" : t.pl < 0 ? "r" : "n",
    s = String(e.dtx || e.dt || ""),
    n = loc().slice(0, 10),
    r =
      s.slice(0, 10) === n
        ? s.slice(11, 16)
        : s.slice(8, 10) + "/" + s.slice(5, 7);
  return `<div class="trow" data-a="edit" data-id="${esc(e.id)}"><span class="tic16 ${o}">${a ? ICO_OPN : t.pl >= 0 ? ICO_UP : ICO_DN}</span><div class="tnm16"><b>${esc(e.ativo || "")}</b><small>${esc(trDesc(e))}</small></div><div class="tvl16"><b class="${a ? "" : cls(t.pl)}">${a ? "em aberto" : mT(e, t.pl)}</b><small>${r}</small></div>${trBadge(t, a)}</div>`;
}
function ultHtml() {
  const e = S.trades
    .slice()
    .sort((t, a) => String(a.dtx || a.dt).localeCompare(String(t.dtx || t.dt)))
    .slice(0, 5);
  return `<section data-hb="ult"><div class="top" style="margin:16px 0 8px;align-items:center"><b class="seclb">Últimos trades</b>${e.length ? '<button class="btn s" data-a="gotab" data-id="trades">Ver todos</button>' : ""}</div>${e.length ? `<div class="card trl">${e.map(trLinha).join("")}</div>` : '<div class="card sm mut">Nenhum trade ainda. Toque no + para registrar o primeiro.</div>'}</section>`;
}
((HB_NOMES.ult = "Últimos trades"),
  HB_PADRAO.includes("ult") || HB_PADRAO.splice(1, 0, "ult"));
try {
  const e = S.ax ?? (S.ax = {});
  if (!e.hb189) {
    e.hb189 = 1;
    const t = e["home.layout"];
    if (t && Array.isArray(t.ordem) && !t.ordem.includes("ult")) {
      const a = t.ordem.indexOf("hero");
      t.ordem.splice(a < 0 ? 0 : a + 1, 0, "ult");
    }
  }
} catch {}
{
  const e = vHome;
  vHome = function () {
    const t = e.apply(this, arguments);
    try {
      return t + ultHtml();
    } catch {
      return t;
    }
  };
}
const lcOn = () => {
  try {
    return ls.get("diario-lista") !== "det";
  } catch {
    return !0;
  }
};
function lcDecora(e) {
  const t = e.querySelectorAll(".tcard");
  if (
    t.length &&
    (document.body.classList.toggle("lc", lcOn()),
    t.forEach((a) => {
      if (a.dataset.d116) return;
      a.dataset.d116 = 1;
      const o = S.trades.find((d) => d.id === a.dataset.id);
      if (!o) return;
      const s = calc(o),
        n = s.pl == null,
        r = n ? "n" : s.pl > 0 ? "g" : s.pl < 0 ? "r" : "n";
      n && a.classList.add("tc-op");
      const i = a.querySelector(".tc-h");
      i &&
        i.insertAdjacentHTML(
          "afterbegin",
          `<span class="tic16 ${r}">${n ? ICO_OPN : s.pl >= 0 ? ICO_UP : ICO_DN}</span>`,
        );
      const l = a.querySelector(".rt");
      l && l.insertAdjacentHTML("beforeend", trBadge(s, n));
    }),
    t[0].parentElement && !e.querySelector(".lcsw"))
  ) {
    const a = lcOn();
    t[0].insertAdjacentHTML(
      "beforebegin",
      `<div class="lcsw seg"><button class="${a ? "on" : ""}" data-lc="c">Compacta</button><button class="${a ? "" : "on"}" data-lc="det">Detalhada</button></div>`,
    );
  }
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-lc]");
  if (!t) return;
  try {
    ls.set("diario-lista", t.dataset.lc);
  } catch {}
  const a = scrollY;
  (render(), scrollTo(0, a));
});
function distHtml() {
  let e = [];
  try {
    e = stRows()
      .map((f) => (f.c ? f : { ...f, c: calc(f) }))
      .filter((f) => f.c && f.c.pl != null);
  } catch {
    return "";
  }
  if (!e.length) return "";
  const t = (f) => emBRL(f.c.pl, moedaT(f)),
    a = e.filter((f) => t(f) > 0),
    o = e.filter((f) => t(f) < 0),
    s = e.length - a.length - o.length,
    n = e.length,
    r = dshCor(),
    i = [
      [a.length, r.g, "Win"],
      [o.length, r.r, "Loss"],
      [s, r.mut, "Zero a zero"],
    ],
    l = 42,
    d = 2 * Math.PI * l;
  let c = 0;
  const p = i
      .filter((f) => f[0])
      .map(([f, x]) => {
        const v = f / n,
          g = `<circle cx="60" cy="60" r="${l}" fill="none" stroke="${x}" stroke-width="14" stroke-dasharray="${(d * v - 2).toFixed(1)} ${d.toFixed(1)}" stroke-dashoffset="${(-c * d).toFixed(1)}" transform="rotate(-90 60 60)"/>`;
        return ((c += v), g);
      })
      .join(""),
    u = a.length ? Math.max(...a.map(t)) : 0,
    m = o.length ? Math.min(...o.map(t)) : 0;
  return `<div class="card" id="distc"><b class="sm">Distribuição dos trades</b><div style="display:flex;align-items:center;gap:16px;margin-top:8px"><svg viewBox="0 0 120 120" width="118" height="118" role="img" aria-label="Distribuição"><circle cx="60" cy="60" r="${l}" fill="none" stroke="${r.mut}" stroke-opacity=".15" stroke-width="14"/>${p}<text x="60" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="${r.tx}">${n}</text></svg>
<div style="flex:1" class="dlg">${i.map(([f, x, v]) => `<div class="sm" style="display:flex;justify-content:space-between;padding:3px 0"><span><span class="dshdot" style="background:${x}"></span>${v}</span><b>${Math.round((f / n) * 100)}%</b></div>`).join("")}</div></div>
<div class="g2" style="margin-top:8px"><div class="h2k"><small>Maior ganho</small><b class="g">${money(u)}</b></div><div class="h2k"><small>Maior perda</small><b class="r">${money(m)}</b></div></div></div>`;
}
const pcModo = () => {
    try {
      return ls.get("diario-pc") === "off" ? "off" : "auto";
    } catch {
      return "auto";
    }
  },
  PCMQ = matchMedia("(min-width:1100px)"),
  ehPC = () => pcModo() !== "off" && PCMQ.matches;
let PCT = "";
function pcMenu() {
  if (!ehPC()) return;
  const e = document.getElementById("mdr2");
  if ((e && PCT === tab) || document.querySelector("#hbe,#hlpov,#vgov,#lkov"))
    return;
  (e && e.remove(), (PCT = tab));
  const t = document.getElementById("mbtn");
  (t && t.click(), (document.body.style.overflow = ""));
}
function pcAplica() {
  const e = ehPC();
  document.body.classList.toggle("pc", e);
  const t = document.body;
  if (
    (e && !t.classList.contains("dshwide")
      ? (t.classList.add("dshwide"), (t.dataset.pcw = 1))
      : !e &&
        t.dataset.pcw &&
        (t.classList.remove("dshwide"), delete t.dataset.pcw),
    e)
  )
    pcMenu();
  else {
    const a = document.getElementById("mdr2");
    a && a.dataset.pc && (a.remove(), (document.body.style.overflow = ""));
  }
}
(PCMQ.addEventListener
  ? PCMQ.addEventListener("change", pcAplica)
  : PCMQ.addListener(pcAplica),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-pcm]");
    if (t) {
      try {
        ls.set("diario-pc", t.dataset.pcm);
      } catch {}
      (pcAplica(), render());
    }
  }),
  new MutationObserver(() => {
    if (!ehPC()) return;
    const e = document.getElementById("mdr2");
    e
      ? ((e.dataset.pc = 1),
        document.body.style.overflow === "hidden" &&
          (document.body.style.overflow = ""))
      : (clearTimeout(pcMenu._t),
        (pcMenu._t = setTimeout(() => {
          ((PCT = ""), pcMenu());
        }, 60)));
  }).observe(document.body, { childList: !0 }));
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      if (!t) return;
      if (
        ((t.dataset.tela = tab),
        tab === "home" &&
          !t.querySelector(".brand116") &&
          t.insertAdjacentHTML(
            "afterbegin",
            `<div class="brand116">${typeof LOGO_SVG < "u" ? LOGO_SVG : ""}<div><b>Diário de Trader</b><small>disciplina é o seu edge</small></div></div>`,
          ),
        lcDecora(t),
        tab === "stats" &&
          (typeof ST > "u" || !ST.aba || ST.aba === "geral") &&
          !t.querySelector("#distc"))
      ) {
        const a = [...t.querySelectorAll("h2")].find((s) =>
            /modalidade|curva de capital/i.test(s.textContent),
          ),
          o = distHtml();
        o && a && a.insertAdjacentHTML("beforebegin", o);
      }
      pcAplica();
    } catch (t) {
      console.error(t);
    }
  };
}
{
  const e = TraderStyles.slot("legacy-054");
  ((e.id = "edge116"),
    (e.textContent = TraderStyles.css("legacy-054")),
    TraderStyles.mount(e));
}
const LKE = { err: "", nome: "", busy: 0 };
((lkFaceCria = async function () {
  if (!window.PublicKeyCredential)
    throw new Error("Este aparelho não oferece Face ID para sites.");
  let e = !0;
  try {
    e =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {}
  if (!e)
    throw new Error(
      "o Face ID não está disponível para o app neste aparelho (confira em Ajustes → Face ID e Código)",
    );
  const t = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "Diário de Trader", id: location.hostname },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: "Diário de Trader",
        displayName: "Diário de Trader",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 6e4,
    },
  });
  return b64(t.rawId);
}),
  (lkFace = async function () {
    const e = LK.cfg;
    if (!e || !e.cred) return !1;
    ((LKE.err = ""), (LKE.nome = ""));
    try {
      const t = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: location.hostname,
          allowCredentials: [
            {
              type: "public-key",
              id: ub64(e.cred),
              transports: ["internal", "hybrid"],
            },
          ],
          userVerification: "required",
          timeout: 6e4,
        },
      });
      if (t)
        try {
          APP_STORAGE.setItem("diario-lk-ult", String(Date.now()));
        } catch {}
      return !!t;
    } catch (t) {
      ((LKE.nome = (t && t.name) || "Erro"),
        (LKE.err = (t && t.message) || String(t)));
      try {
        erGrava("Face ID falhou (" + LKE.nome + "): " + LKE.err);
      } catch {}
      return !1;
    }
  }));
function lkErrTxt() {
  const e = LKE.nome;
  return e === "NotAllowedError"
    ? "O Face ID foi cancelado, demorou ou não reconheceu. Toque de novo para tentar, ou use o PIN."
    : e === "InvalidStateError" ||
        e === "NotFoundError" ||
        /credential|chave/i.test(LKE.err)
      ? 'Este aparelho não tem mais a chave do Face ID do app. Entre com o PIN e toque em "Ativar o Face ID de novo" em Ferramentas → Bloqueio do app.'
      : e === "SecurityError"
        ? "O endereço do app mudou desde que o Face ID foi ativado. Entre com o PIN e ative o Face ID de novo."
        : "Não deu certo (" +
          e +
          "). Use o PIN; o erro foi anotado em Conta → Erros do app.";
}
function lkPinMostra() {
  const e = document.getElementById("lkpinbx");
  if (e) {
    e.style.display = "flex";
    const a = document.getElementById("lkpin");
    a && a.focus();
  }
  const t = document.querySelector('[data-lk="usapin"]');
  t && (t.style.display = "none");
}
((lkMostra = function () {
  if (!LK.cfg || document.getElementById("lkov")) return;
  LK.aberto = !1;
  const e = !!LK.cfg.cred,
    t = document.createElement("div");
  ((t.id = "lkov"),
    (t.style.cssText =
      "position:fixed;inset:0;z-index:100000;background:var(--bg,#080809);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center"),
    (t.innerHTML = `<div class="lklogo">${typeof LOGO_SVG < "u" ? LOGO_SVG : "🔒"}</div><b style="font-size:20px">Diário de Trader</b>
${e ? '<button class="btn" data-lk="face" id="lkface" style="min-width:250px;padding:14px 18px;font-size:16px;margin-top:8px">Desbloquear com Face ID</button><div class="sm mut">ou toque em qualquer lugar da tela</div><button class="btn s" data-lk="usapin" style="margin-top:6px">Usar o PIN</button>' : '<div class="sm mut">Digite o seu PIN</div>'}
<div id="lkpinbx" style="display:${e ? "none" : "flex"};flex-direction:column;align-items:center;gap:10px"><input id="lkpin" type="password" inputmode="numeric" maxlength="8" placeholder="PIN" autocomplete="off" style="max-width:200px;text-align:center;font-size:22px;letter-spacing:6px"><button class="btn s" data-lk="pin" style="min-width:200px">Entrar com o PIN</button></div>
<div class="sm r" id="lkmsg" style="max-width:320px"></div>`),
    document.body.appendChild(t),
    t.querySelector("#lkpin").addEventListener("keydown", (a) => {
      a.key === "Enter" && lkPin();
    }),
    e &&
      t.addEventListener("click", (a) => {
        a.target.closest("input,button,#lkpinbx") ||
          document.getElementById("lkface")?.click();
      }));
}),
  document.addEventListener(
    "click",
    async (e) => {
      const t = e.target.closest("[data-lk]");
      if (!t) return;
      const a = t.dataset.lk;
      if (a === "usapin") {
        (e.stopImmediatePropagation(), lkPinMostra());
        return;
      }
      if (a !== "face" || (e.stopImmediatePropagation(), LKE.busy)) return;
      LKE.busy = 1;
      const o = document.getElementById("lkmsg");
      o && (o.textContent = "");
      const s = await lkFace();
      if (((LKE.busy = 0), s)) {
        lkAbre();
        return;
      }
      (o && (o.textContent = lkErrTxt()), lkPinMostra());
    },
    !0,
  ));
{
  const e = lkAbre;
  lkAbre = function () {
    e.apply(this, arguments);
    try {
      APP_STORAGE.setItem("diario-lk-ult", String(Date.now()));
    } catch {}
  };
}
const lkMarca = () => {
  try {
    LK.cfg &&
      !document.getElementById("lkov") &&
      APP_STORAGE.setItem("diario-lk-ult", String(Date.now()));
  } catch {}
};
(document.addEventListener("visibilitychange", () => {
  document.hidden && lkMarca();
}),
  addEventListener("pagehide", lkMarca),
  setInterval(() => {
    document.hidden || lkMarca();
  }, 3e4));
try {
  const e = document.getElementById("lkov");
  if (LK.cfg && e) {
    e.remove();
    const t = +APP_STORAGE.getItem("diario-lk-ult") || 0;
    t && Date.now() - t < (LK.cfg.min || 5) * 6e4
      ? (LK.aberto = !0)
      : lkMostra();
  }
} catch {}
{
  const e = lkCardHtml;
  lkCardHtml = function () {
    let t = e.apply(this, arguments);
    const a = LK.cfg;
    if (!a) return t;
    const o = a.cred
      ? '<div class="g2" style="margin-top:8px"><button class="btn s" data-lkx="teste">Testar o Face ID</button><button class="btn s" data-lkx="refaz">Ativar o Face ID de novo</button></div>'
      : '<button class="btn" data-lkx="refaz" style="width:100%;margin-top:8px">Ativar o Face ID</button>';
    return t.replace(
      /(<div class="sm mut" style="margin-top:6px">O PIN \xe9 a reserva)/,
      o + "$1",
    );
  };
}
document.addEventListener(
  "click",
  async (e) => {
    const t = e.target.closest("[data-lkx]");
    if (t) {
      if ((e.stopImmediatePropagation(), t.dataset.lkx === "teste")) {
        const a = await lkFace();
        toast(a ? "✅ Face ID funcionando." : "❌ " + lkErrTxt(), 6e3);
        return;
      }
      try {
        const a = await lkFaceCria();
        (lkSalva({ ...LK.cfg, cred: a }),
          toast(
            "Face ID ativado. Da próxima vez, é só tocar na tela de bloqueio.",
            5e3,
          ),
          render());
      } catch (a) {
        const o = a && a.name;
        try {
          erGrava(
            "Face ID não ativou (" + (o || "Erro") + "): " + (a.message || a),
          );
        } catch {}
        toast(
          "O Face ID não ativou: " +
            (o === "NotAllowedError"
              ? "foi cancelado ou o iPhone não permitiu."
              : a.message || a),
          7e3,
        );
      }
    }
  },
  !0,
);
{
  const e = TraderStyles.slot("legacy-055");
  ((e.textContent = TraderStyles.css("legacy-055")), TraderStyles.mount(e));
}
function pcColunas(e) {
  if (!ehPC() || tab !== "home" || e.querySelector(".pccols")) return;
  const t = (d) =>
      !d.matches("section") ||
      ["hero", "cal", "acoes"].includes(d.dataset.hb) ||
      d.id === "hb-fim",
    a = [...e.children],
    o = a.filter(
      (d) =>
        !t(d) &&
        d.style.display !== "none" &&
        getComputedStyle(d).display !== "none",
    );
  if (o.length < 2) return;
  const s = [];
  o.forEach((d) => {
    const c = [...d.children].filter(
      (p) => getComputedStyle(p).display !== "none",
    );
    if (d.matches("section") && c.length > 2) {
      let p = null;
      (c.forEach((u) => {
        (p ||
          ((p = document.createElement("div")),
          (p.className = "pcblk"),
          (p.dataset.hbde = d.dataset.hb || "")),
          p.appendChild(u),
          !/^H[23]$/.test(u.tagName) &&
            !(
              u.classList.contains("top") &&
              u.querySelector(".seclb") &&
              c.length
            ) &&
            (s.push(p), (p = null)));
      }),
        p && s.push(p),
        (d.style.display = "none"),
        (d.dataset.pcvazia = 1));
    } else s.push(d);
  });
  const n = e.clientWidth >= 1500 ? 3 : 2,
    r = document.createElement("div");
  ((r.className = "pccols"),
    (r.style.gridTemplateColumns = `repeat(${n},minmax(0,1fr))`));
  const i = Array.from({ length: n }, () => {
    const d = document.createElement("div");
    return ((d.className = "pcc"), r.appendChild(d), d);
  });
  (o[0].before(r),
    s.forEach((d) => {
      i.reduce((c, p) => (p.offsetHeight < c.offsetHeight ? p : c)).appendChild(
        d,
      );
    }));
  const l = e.querySelector("#hb-fim");
  l && e.appendChild(l);
}
{
  const e = render0;
  render0 = function () {
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      t && (typeof hmAplica == "function" && hmAplica(t), pcColunas(t));
    } catch (t) {
      console.error(t);
    }
  };
}
{
  let e = 0,
    t = innerWidth;
  addEventListener("resize", () => {
    (clearTimeout(e),
      (e = setTimeout(() => {
        if (
          !(Math.abs(innerWidth - t) < 40) &&
          ((t = innerWidth),
          tab === "home" && !document.querySelector("#sh.on,#fx,#hbe"))
        ) {
          const a = scrollY;
          (render(), scrollTo(0, a));
        }
      }, 300)));
  });
}
{
  const e = TraderStyles.slot("legacy-056");
  ((e.textContent = TraderStyles.css("legacy-056")), TraderStyles.mount(e));
}
{
  const e = tiltMarca;
  tiltMarca = function () {
    let t = 0;
    for (const a of S.trades)
      if (!a.tiltOk && a.dt && (a.tipo || "D") !== "O" && ++t > 1) break;
    if (!(t <= 1)) return e.apply(this, arguments);
  };
}
const HM = { sel: "" },
  hmOff = () => {
    try {
      const e = ls.get("diario-hm");
      return e === "off" || (navigator.webdriver && e !== "on");
    } catch {
      return !1;
    }
  };
function hmAgora() {
  const e = new Date(),
    t = e.getDay(),
    a = e.getHours() * 60 + e.getMinutes();
  return t === 0 || t === 6
    ? "depois"
    : a < 540
      ? "antes"
      : a < 1095
        ? "durante"
        : "depois";
}
const HM_NOME = {
    antes: "Antes",
    durante: "Durante",
    depois: "Depois",
    tudo: "Tudo",
  },
  HM_IC = { antes: "☀️", durante: "⚡", depois: "🌙", tudo: "▦" },
  HM_ESC = {
    antes: [
      "ult",
      "modhj",
      "rvgb",
      "shrper",
      "curva",
      "cqc",
      "cal",
      "posab",
      "stk",
    ],
    durante: [
      "apc",
      "rvgb",
      "stk",
      "shrper",
      "curva",
      "cqc",
      "cal",
      "metas",
      "adr",
      "cap",
      "venc",
      "turno",
    ],
    depois: ["apc", "posso", "adr", "lim", "cap", "venc"],
  };
function hmChave(e) {
  if (e.dataset && e.dataset.hb) return e.dataset.hb;
  if (e.id) return e.id;
  const t = (e.textContent || "").trim();
  return /^Posi\xe7\xf5es abertas/.test(t) ||
    /^Nenhuma posi\xe7\xe3o aberta/.test(t)
    ? "posab"
    : /Curva de patrim\xf4nio/.test(t.slice(0, 40))
      ? "curva"
      : "";
}
function hmAplica(e) {
  if (tab !== "home" || hmOff()) return;
  const t = HM.sel || hmAgora(),
    a = t === "tudo" ? [] : HM_ESC[t] || [];
  if (!e.querySelector(".hmsw")) {
    const n = e.querySelector(".brand116"),
      r = `<div class="seg hmsw" role="tablist">${["antes", "durante", "depois", "tudo"].map((i) => `<button class="${t === i ? "on" : ""}" data-hm="${i}">${HM_IC[i]} ${HM_NOME[i]}${i === hmAgora() && !HM.sel ? " <small>agora</small>" : ""}</button>`).join("")}</div>`;
    n
      ? n.insertAdjacentHTML("afterend", r)
      : e.insertAdjacentHTML("afterbegin", r);
  }
  if (!a.length) return;
  const o = (n) => {
    ((n.style.display = "none"), (n.dataset.hmesc = 1));
  };
  ([...e.children].forEach((n) => {
    const r = hmChave(n);
    r && a.includes(r)
      ? o(n)
      : n.matches("section") &&
        [...n.children].forEach((i) => {
          const l = hmChave(i);
          l && a.includes(l) && o(i);
        });
  }),
    e.querySelectorAll("section").forEach((n) => {
      if (n.dataset.hmesc) return;
      const r = [...n.children].filter((i) => i.style.display !== "none");
      n.children.length && !r.length && o(n);
    }));
  const s = e.querySelector("#hb-fim");
  s &&
    !s.querySelector('[data-hm="tudo"]') &&
    t !== "tudo" &&
    s.insertAdjacentHTML(
      "afterbegin",
      '<button class="btn s" data-hm="tudo" style="width:100%;margin:12px 0 0">Mostrar todos os cards</button>',
    );
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-hm]");
  t &&
    ((HM.sel = t.dataset.hm === hmAgora() ? "" : t.dataset.hm),
    render(),
    scrollTo(0, 0));
});
{
  const e = card;
  card = function (t) {
    return e
      .apply(this, arguments)
      .replace(/(class="card row tcard )tc-g"/, '$1tc-win"');
  };
}
function vazioDecora(e) {
  e.querySelectorAll("p.mut,div.sm.mut,div.mut.sm,.card.sm.mut").forEach(
    (t) => {
      if (t.dataset.v119 || t.children.length > 2) return;
      const a = (t.textContent || "").trim();
      if (/^(Carregando|carregando)\u2026?\.{0,3}$/.test(a)) {
        ((t.dataset.v119 = 1),
          t.classList.add("skel119"),
          (t.innerHTML =
            '<i></i><i style="width:72%"></i><i style="width:46%"></i>'),
          t.setAttribute("aria-label", "Carregando"));
        return;
      }
      /^Nenhum(a)? /.test(a) &&
        a.length < 200 &&
        !t.closest(".trow,.tcard,table,.hero") &&
        ((t.dataset.v119 = 1), t.classList.add("vazio119"));
    },
  );
}
const TB = { ord: "dt", dir: -1, q: "", sel: new Set(), st: "todos" },
  lcModo = () => {
    try {
      return ls.get("diario-lista") || "c";
    } catch {
      return "c";
    }
  };
function tbTipo(e) {
  const t = e.querySelector('.top [data-a="new"][data-tp]');
  return t ? t.dataset.tp : null;
}
function tbLinhas(e) {
  const t = TB.q.toLowerCase();
  return S.trades
    .filter((a) => (a.tipo || "D") === e && inPer(a.dt))
    .map((a) => ({ t: a, c: calc(a) }))
    .filter((a) => {
      const o = a.c.pl == null;
      return (TB.st === "abertas" && !o) ||
        (TB.st === "ganhos" && !(a.c.pl > 0)) ||
        (TB.st === "perdas" && !(a.c.pl < 0))
        ? !1
        : !t ||
            [a.t.ativo, a.t.setup, a.t.err, a.t.obs]
              .join(" ")
              .toLowerCase()
              .includes(t);
    });
}
const TB_COL = [
  ["dt", "Data"],
  ["ativo", "Ativo"],
  ["side", "Lado"],
  ["qty", "Qtd."],
  ["entry", "Entrada"],
  ["stop", "Stop"],
  ["exit", "Saída"],
  ["pl", "Resultado"],
  ["r", "× risco"],
  ["setup", "Setup"],
  ["err", "Erro"],
  ["rules", "Regras"],
];
function tbVal(e, t) {
  return t === "pl"
    ? e.c.pl
    : t === "r"
      ? e.c.r
      : ["qty", "entry", "stop", "exit"].includes(t)
        ? numN(e.t[t])
        : String(e.t[t] || "");
}
function tbHtml(e) {
  const t = tbLinhas(e).sort((r, i) => {
      const l = tbVal(r, TB.ord),
        d = tbVal(i, TB.ord);
      return l == null && d == null
        ? 0
        : l == null
          ? 1
          : d == null
            ? -1
            : (l < d ? -1 : l > d ? 1 : 0) * TB.dir;
    }),
    a = new Set(t.map((r) => r.t.id));
  [...TB.sel].forEach((r) => {
    a.has(r) || TB.sel.delete(r);
  });
  const o = sum(
      t.filter((r) => r.c.pl != null).map((r) => emBRL(r.c.pl, moedaT(r.t))),
    ),
    s = TB.sel.size,
    n = (r) =>
      (typeof ERR < "u" ? ERR : ["Nenhum"])
        .map((i) => `<option${i === r ? " selected" : ""}>${esc(i)}</option>`)
        .join("");
  return `<div id="tbw"><div class="tbbar"><input id="tbq" placeholder="Filtrar por ativo, setup ou erro" value="${esc(TB.q)}"><select id="tbst">${[
    ["todos", "Todos"],
    ["abertas", "Abertas"],
    ["ganhos", "Ganhos"],
    ["perdas", "Perdas"],
  ]
    .map(
      ([r, i]) =>
        `<option value="${r}"${TB.st === r ? " selected" : ""}>${i}</option>`,
    )
    .join(
      "",
    )}</select><span class="sm mut">${t.length} trade(s) · <b class="${cls(o)}">${money(o)}</b></span></div>
${s ? `<div class="tbbulk"><b>${s} selecionado(s)</b><input id="tbbs" placeholder="Setup para todos"><button class="btn s" data-tbb="setup">Aplicar setup</button><select id="tbbe">${n("")}</select><button class="btn s" data-tbb="err">Aplicar erro</button><button class="btn s" data-tbb="rules">Marcar "seguiu as regras"</button><button class="btn s d" data-tbb="del">Excluir</button><button class="btn s" data-tbb="x">Limpar seleção</button></div>` : ""}
<div class="tbsc"><table class="tbt"><thead><tr><th><input type="checkbox" data-tbs="*"${s && s === t.length ? " checked" : ""} aria-label="Selecionar todos"></th>${TB_COL.map(([r, i]) => `<th data-tbo="${r}" class="${TB.ord === r ? "on" : ""}">${i}${TB.ord === r ? (TB.dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}<th></th></tr></thead>
<tbody>${t
    .slice(0, 500)
    .map((r) => {
      const i = r.t,
        l = r.c,
        d = l.pl == null;
      return `<tr class="${TB.sel.has(i.id) ? "sel" : ""}"><td><input type="checkbox" data-tbs="${esc(i.id)}"${TB.sel.has(i.id) ? " checked" : ""}></td><td class="nw">${esc(String(i.dt).slice(8, 10) + "/" + String(i.dt).slice(5, 7) + " " + String(i.dt).slice(11, 16))}</td><td><b>${esc(i.ativo || "")}</b></td><td>${i.side === "V" ? "Venda" : "Compra"}</td><td class="n">${esc(i.qty || "")}</td><td class="n">${esc(i.entry || "")}</td><td class="n r">${esc(i.stop || "")}</td><td class="n">${esc(i.exit || "")}</td><td class="n ${d ? "" : cls(l.pl)}"><b>${d ? "aberta" : mT(i, l.pl)}</b></td><td class="n">${l.r == null ? "–" : f2(l.r)}</td>
<td><input class="tbin" data-tbe="${esc(i.id)}|setup" value="${esc(i.setup || "")}"></td><td><select class="tbin" data-tbe="${esc(i.id)}|err">${n(i.err || "Nenhum")}</select></td><td><select class="tbin" data-tbe="${esc(i.id)}|rules"><option value="s"${i.rules !== "n" ? " selected" : ""}>seguiu</option><option value="n"${i.rules === "n" ? " selected" : ""}>quebrou</option></select></td><td><button class="btn s" data-a="edit" data-id="${esc(i.id)}" style="padding:4px 9px">Abrir</button></td></tr>`;
    })
    .join(
      "",
    )}</tbody></table></div>${t.length > 500 ? '<div class="sm mut">Mostrando os 500 primeiros: use o filtro.</div>' : ""}</div>`;
}
function tbRedesenha() {
  const e = document.getElementById("tbw"),
    t = document.getElementById("app");
  if (!e || !t) return;
  const a = tbTipo(t);
  if (!a) return;
  const o = document.activeElement && document.activeElement.id;
  if (((e.outerHTML = tbHtml(a)), o === "tbq")) {
    const s = document.getElementById("tbq");
    (s.focus(), s.setSelectionRange(s.value.length, s.value.length));
  }
}
((lcDecora = ((e) =>
  function (t) {
    const a = tbTipo(t);
    if (!a) return e.apply(this, arguments);
    if (lcModo() !== "tab") {
      e.apply(this, arguments);
      const o = t.querySelector(".lcsw");
      o &&
        !o.querySelector('[data-lc="tab"]') &&
        o.insertAdjacentHTML(
          "beforeend",
          '<button data-lc="tab">Tabela</button>',
        );
      return;
    }
    if (
      (document.body.classList.add("lc"),
      t
        .querySelectorAll('.tcard,[data-cx="maisTr"]')
        .forEach((o) => (o.style.display = "none")),
      !t.querySelector(".lcsw"))
    ) {
      const o =
          t.querySelector(".tcard") || t.querySelector('[data-cx="maisTr"]'),
        s =
          '<div class="lcsw seg"><button data-lc="c">Compacta</button><button data-lc="det">Detalhada</button><button class="on" data-lc="tab">Tabela</button></div>';
      if (o) o.insertAdjacentHTML("beforebegin", s);
      else return;
    }
    t.querySelector("#tbw") ||
      t.querySelector(".lcsw").insertAdjacentHTML("afterend", tbHtml(a));
  })(lcDecora)),
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tbo]");
    if (t) {
      const s = t.dataset.tbo;
      (TB.ord === s
        ? (TB.dir *= -1)
        : ((TB.ord = s), (TB.dir = ["dt", "pl", "r"].includes(s) ? -1 : 1)),
        tbRedesenha());
      return;
    }
    const a = e.target.closest("[data-tbs]");
    if (a) {
      const s = a.dataset.tbs,
        n = document.getElementById("app");
      if (s === "*") {
        const r = tbLinhas(tbTipo(n));
        a.checked
          ? r.slice(0, 500).forEach((i) => TB.sel.add(i.t.id))
          : TB.sel.clear();
      } else a.checked ? TB.sel.add(s) : TB.sel.delete(s);
      tbRedesenha();
      return;
    }
    const o = e.target.closest("[data-tbb]");
    if (o) {
      const s = o.dataset.tbb,
        n = Date.now(),
        r = S.trades.filter((i) => TB.sel.has(i.id));
      if (s === "x") {
        (TB.sel.clear(), tbRedesenha());
        return;
      }
      if (s === "del") {
        if (
          !confirm(
            `Excluir ${r.length} trade(s)? Isso não tem volta (fora a cópia de segurança).`,
          )
        )
          return;
        ((S.trades = S.trades.filter((i) => !TB.sel.has(i.id))),
          r.forEach((i) => {
            (S.del ?? (S.del = {}))[i.id] = n;
          }),
          TB.sel.clear());
      } else {
        const i =
          s === "setup"
            ? (document.getElementById("tbbs").value || "").trim()
            : s === "err"
              ? document.getElementById("tbbe").value
              : "s";
        if (s === "setup" && !i) {
          toast("Escreva o setup.");
          return;
        }
        r.forEach((l) => {
          ((l[s] = i), (l.u = n));
        });
      }
      (save(),
        toast(
          s === "del" ? "Excluídos." : `Atualizado em ${r.length} trade(s).`,
        ),
        tbRedesenha());
    }
  }),
  document.addEventListener("change", (e) => {
    const t = e.target.closest("[data-tbe]");
    if (t) {
      const [a, o] = t.dataset.tbe.split("|"),
        s = S.trades.find((n) => n.id === a);
      s && ((s[o] = t.value), (s.u = Date.now()), save());
      return;
    }
    e.target.id === "tbst" && ((TB.st = e.target.value), tbRedesenha());
  }),
  document.addEventListener("input", (e) => {
    e.target.id === "tbq" &&
      ((TB.q = e.target.value),
      clearTimeout(TB.t),
      (TB.t = setTimeout(tbRedesenha, 200)));
  }));
const ATALHOS = [
  ["Ctrl+K ou /", "Buscar no app"],
  ["N", "Novo trade"],
  ["1 a 4", "Day trade, Swing, Opções, EUA e Forex"],
  ["5", "Estatísticas gerais"],
  ["H", "Início"],
  ["D", "Meu dia"],
  ["M", "Mercado"],
  ["P", "Painel do pregão (segundo monitor)"],
  ["T", "Lista ↔ tabela de trades"],
  ["?", "Ver os atalhos"],
  ["Esc", "Fechar"],
];
function atalhosMostra() {
  document.getElementById("hlpov")?.remove();
  const e = document.createElement("div");
  ((e.id = "hlpov"),
    (e.innerHTML = `<div class="hlpbox"><b style="font-size:18px">Atalhos de teclado</b><table class="sm" style="margin:10px 0 12px;width:100%">${ATALHOS.map(([t, a]) => `<tr><td style="padding:4px 10px 4px 0;white-space:nowrap"><kbd>${t}</kbd></td><td>${a}</td></tr>`).join("")}</table><button class="btn" data-hlpx="1" style="width:100%">Fechar</button></div>`),
    document.body.appendChild(e));
}
function buscaAbre() {
  let e = document.getElementById("bsq");
  if (e) {
    (e.focus(), e.select && e.select());
    return;
  }
  const t = document.getElementById("mbtn");
  (t && t.click(),
    setTimeout(() => {
      const a = document.getElementById("bsq");
      a && a.focus();
    }, 120));
}
document.addEventListener("keydown", (e) => {
  const t = document.activeElement,
    a =
      t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
    (e.preventDefault(), buscaAbre());
    return;
  }
  if (e.key === "Escape") {
    if (document.getElementById("ckp")) {
      ckpFecha();
      return;
    }
    document.getElementById("hlpov")?.remove();
    return;
  }
  if (
    a ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    document.querySelector("#sh.on,#lkov,#vgov,#fx")
  )
    return;
  const o = e.key;
  let s = 1;
  if (o === "/") buscaAbre();
  else if (o === "?") atalhosMostra();
  else if (o === "n" || o === "N")
    document.querySelector('#bnav [data-a="fab"]')?.click();
  else if (/^[1-4]$/.test(o))
    (modVai(["dt", "sw", "op", "ex"][+o - 1], "ops"), scrollTo(0, 0));
  else if (o === "5") (modVai("", "geral"), scrollTo(0, 0));
  else if (o === "h" || o === "H") (irPara("home"), scrollTo(0, 0));
  else if (o === "d" || o === "D") (irPara("dia"), scrollTo(0, 0));
  else if (o === "m" || o === "M")
    (irPara("mercado"), scrollTo(0, 0));
  else if (o === "p" || o === "P") ckpAbre();
  else if (o === "t" || o === "T") {
    const n = document.getElementById("app");
    if (!tbTipo(n)) s = 0;
    else {
      try {
        ls.set("diario-lista", lcModo() === "tab" ? "c" : "tab");
      } catch {}
      const r = scrollY;
      (render(), scrollTo(0, r));
    }
  } else s = 0;
  s && e.preventDefault();
});
const CKP = { t: 0 };
function ckpDados() {
  const e = loc().slice(0, 10),
    t = S.days[e] || {},
    a = dayTr(e),
    o = a
      .filter((u) => u.c.pl != null)
      .sort((u, m) => String(u.dtx).localeCompare(String(m.dtx))),
    s = sum(o.map((u) => emBRL(u.c.pl, moedaT(u)))),
    n = limPerda(t),
    r = n > 0 ? n + Math.min(s, 0) : null;
  let i = 0;
  for (let u = o.length - 1; u >= 0 && o[u].c.pl < 0; u--) i++;
  const l = S.trades.filter((u) => isOpen(u)),
    d = (AL.ev || [])
      .filter((u) => {
        const m = new Date(u.d);
        return m > Date.now() - 15 * 6e4 && m - Date.now() < 14 * 36e5;
      })
      .sort((u, m) => new Date(u.d) - new Date(m.d))
      .slice(0, 6);
  let c = null;
  try {
    c = travaEstado();
  } catch {}
  const p = chkN(t.chk);
  return {
    hj: e,
    d: t,
    pl: s,
    lim: n,
    rest: r,
    n: a.length,
    maxT: +t.maxT || +(t.pl2 || {}).max || 0,
    seq: i,
    ab: l,
    ev: d,
    tv: c,
    nck: p,
    nr: S.rules.length,
    mesas: mmFolgas(),
    pl2: t.pl2 || {},
  };
}
function ckpHtml() {
  const e = ckpDados(),
    t = new Date().toLocaleTimeString("pt-BR"),
    a = new Date().getDay(),
    o = new Date().getHours() * 60 + new Date().getMinutes(),
    s = a > 0 && a < 6 && o >= 540 && o < 1105,
    n = typeof pctConta == "function" ? pctConta(e.pl) : "",
    r = (d, c, p = "") => `<div class="ckb ${p}"><small>${d}</small>${c}</div>`,
    i = e.ev[0],
    l = i ? Math.round((new Date(i.d) - Date.now()) / 6e4) : null;
  return `<div class="ckhd"><div><b>Painel do pregão</b><small>${s ? '<span class="g">● B3 aberta</span>' : '<span class="mut">● B3 fechada</span>'} · atualiza sozinho</small></div><div class="ckclk">${t}</div><button class="btn s" data-ckx="1">Sair (Esc)</button></div>
${e.tv && e.tv.travado ? `<div class="ckalert">🔒 <b>${e.tv.duro.length ? "Travado até amanhã" : "Pausa"}</b> · ${esc([...(e.tv.duro || []), ...(e.tv.resolver || []).map((d) => d.txt)].join(" · ") || "pausa depois do stop")}</div>` : ""}
<div class="ckg">${r("Resultado de hoje", `<div class="ckbig ${cls(e.pl)}">${money(e.pl)}</div>${n ? `<span class="h2pct ${cls(e.pl)}">${n}</span>` : ""}`, "w2")}
${r("Ainda pode perder hoje", e.rest == null ? '<div class="sm mut">Defina o limite de perda no Meu dia.</div>' : `<div class="ckmid ${e.rest <= 0 ? "r" : e.rest < e.lim * 0.3 ? "am" : ""}">${e.rest <= 0 ? "PARE" : money(e.rest)}</div><div class="ckbar"><i style="width:${Math.max(0, Math.min(100, (e.rest / e.lim) * 100))}%;background:${e.rest < e.lim * 0.3 ? "var(--r)" : "var(--g)"}"></i></div>`)}
${r("Trades hoje", `<div class="ckmid">${e.n}${e.maxT ? `<span class="mut"> / ${e.maxT}</span>` : ""}</div>`)}
${r("Stops seguidos", `<div class="ckmid ${e.seq >= 2 ? "r" : ""}">${e.seq}</div>`)}
${r("Checklist de regras", `<div class="ckmid ${e.nr && e.nck < e.nr ? "am" : "g"}">${e.nck}/${e.nr}</div>`)}
${r(
  "Próxima notícia",
  i
    ? `<div class="ckmid">${l <= 0 ? "agora" : l < 60 ? l + " min" : Math.floor(l / 60) + "h" + String(l % 60).padStart(2, "0")}</div><div class="sm">${esc(i.t || "")} <span class="mut">(${esc(i.cur || "")})</span></div>${e.ev
        .slice(1, 4)
        .map(
          (d) =>
            `<div class="sm mut">${new Date(d.d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · ${esc(d.t || "")}</div>`,
        )
        .join("")}`
    : '<div class="sm mut">Sem notícias de alto impacto à frente (ou a agenda ainda não carregou).</div>',
  "w2",
)}
${r(
  "Posições abertas",
  e.ab.length
    ? e.ab
        .slice(0, 6)
        .map(
          (d) =>
            `<div class="ckpos"><b>${esc(d.ativo)}</b> <span class="mut">${d.side === "V" ? "venda" : "compra"} ${esc(d.qty)}</span> · entrada ${esc(d.entry)} · stop <span class="r">${esc(d.stop || "—")}</span></div>`,
        )
        .join("")
    : '<div class="sm mut">Nenhuma.</div>',
  "w2",
)}
${e.mesas.length ? r("Mesas", e.mesas.map((d) => `<div class="ckpos"><b>${esc(d.c.nome || "Mesa")}</b>: ${d.v <= 0 ? '<b class="r">pare</b>' : "pode perder <b>" + esc(mFmt(d.c, d.v)) + "</b>"}</div>`).join(""), "w2") : ""}
${r("Plano do dia", e.pl2.vies || e.pl2.txt ? `<div class="sm">${e.pl2.vies ? `Viés: <b>${esc(e.pl2.vies)}</b><br>` : ""}${esc(e.pl2.txt || "")}</div>` : '<div class="sm mut">Sem plano escrito hoje (Meu dia → Plano do dia).</div>', "w2")}</div>`;
}
function ckpAbre() {
  if (document.getElementById("ckp")) return;
  const e = document.createElement("div");
  ((e.id = "ckp"),
    (e.innerHTML = ckpHtml()),
    document.body.appendChild(e),
    (document.body.style.overflow = "hidden"),
    clearInterval(CKP.t),
    (CKP.t = setInterval(() => {
      const t = document.getElementById("ckp");
      if (!t) {
        clearInterval(CKP.t);
        return;
      }
      t.innerHTML = ckpHtml();
    }, 2e3)));
  try {
    document.documentElement.requestFullscreen &&
      ehPC() &&
      document.documentElement.requestFullscreen().catch(() => {});
  } catch {}
}
function ckpFecha() {
  (clearInterval(CKP.t),
    document.getElementById("ckp")?.remove(),
    (document.body.style.overflow = ""));
  try {
    document.fullscreenElement && document.exitFullscreen();
  } catch {}
}
document.addEventListener("click", (e) => {
  (e.target.closest("[data-ckx]") && ckpFecha(),
    e.target.closest("[data-ckp]") && ckpAbre());
});
const MAIS_IO =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (e) =>
          e.forEach((t) => {
            if (
              t.isIntersecting &&
              t.target.isConnected &&
              t.target.style.display !== "none"
            ) {
              MAIS_IO.unobserve(t.target);
              const a = scrollY;
              (t.target.click(), setTimeout(() => scrollTo(0, a), 0));
            }
          }),
        { rootMargin: "400px" },
      )
    : null;
{
  const e = render0;
  render0 = function () {
    try {
      DT_IDX = null;
    } catch {}
    e.apply(this, arguments);
    try {
      const t = document.getElementById("app");
      if (!t) return;
      if (
        (vazioDecora(t),
        MAIS_IO &&
          t
            .querySelectorAll('[data-cx="maisTr"]')
            .forEach((a) => MAIS_IO.observe(a)),
        tab === "home")
      ) {
        const a = t.querySelector(".brand116");
        a &&
          !a.querySelector("[data-ckp]") &&
          a.insertAdjacentHTML(
            "beforeend",
            '<button class="btn s ckbtn" data-ckp="1" title="Painel do pregão (P)">🖥️ Painel do pregão</button>',
          );
      }
      if (ehPC()) {
        const a = document.querySelector("#mdr2 .ft");
        a &&
          !document.querySelector("#mdr2 .atl") &&
          a.insertAdjacentHTML(
            "beforebegin",
            '<button class="atl" data-atl="1">⌨️ Atalhos de teclado: aperte <kbd>?</kbd></button>',
          );
      }
    } catch (t) {
      console.error(t);
    }
  };
}
document.addEventListener("click", (e) => {
  e.target.closest("[data-atl]") && atalhosMostra();
});
{
  const e = TraderStyles.slot("legacy-057");
  ((e.textContent = TraderStyles.css("legacy-057")), TraderStyles.mount(e));
}
FN_ESPERADA.macro = "v194";
const CQ_ABAS = [
    ["fut", "Futuros"],
    ["idx", "Índices"],
    ["br", "Ações BR"],
    ["us", "Ações EUA"],
    ["adr", "ADRs"],
    ["fx", "Moedas"],
    ["cmd", "Commodities"],
    ["cri", "Cripto"],
    ["jur", "Juros"],
  ],
  CQ = {
    aba: (() => {
      try {
        return ls.get("diario-cq-aba") || "fut";
      } catch {
        return "fut";
      }
    })(),
    d: {},
    ts: {},
    busy: "",
    err: "",
    ord: "lista",
    pf: {},
    pfTs: 0,
    saved: {},
    errors: {},
    loading: {},
    search: "",
  };
const M606 = { v: null, ts: 0, busy: false, err: "", salvoEm: 0, di: "cot", bar: "d1" };
try {
  const c = ls.get("diario-m606");
  c && c.v && c.v.versao === "v606" && ((M606.v = c.v), (M606.salvoEm = c.ts || 0));
} catch {}
// Cache salvo das listas de cotações: aparece na hora enquanto a consulta nova roda.
try {
  const c = ls.get("diario-cq-cache606") || {};
  Object.entries(c).forEach(([k, x]) => {
    x && x.d && Array.isArray(x.d.itens) && !CQ.d[k] && ((CQ.d[k] = x.d), (CQ.ts[k] = 0), ((CQ.cache606 ??= {})[k] = x.ts || 0));
  });
} catch {}
try {
  const e = HUB_M.findIndex((a) => a[0] === "mercado:mu");
  HUB_M.some((a) => a[0] === "mercado:cq") ||
    HUB_M.splice(Math.max(0, e), 0, ["mercado:cq", "Cotações"]);
  const t = MGRP.find((a) => a[0] === "Hoje");
  t && !t[1].includes("mercado:cq") && t[1].unshift("mercado:cq");
} catch {}
async function cqCarrega(e, t) {
  if (
    ((e = e || CQ.aba),
    CQ.loading[e] || (!t && CQ.d[e] && Date.now() - (CQ.ts[e] || 0) < 25e3))
  )
    return;
  const a = cfg();
  if (!a) {
    ((CQ.err = "Configure o Supabase em Conta para ver as cotações."),
      cqPinta());
    return;
  }
  ((CQ.busy = e), (CQ.loading[e] = true), (CQ.errors[e] = ""), cqPinta());
  try {
    const o = { "Content-Type": "application/json", apikey: a.key };
    try {
      typeof SESS < "u" &&
        SESS &&
        SESS.at &&
        (o.Authorization = "Bearer " + SESS.at);
    } catch {}
    const s = await fetch(a.url + "/functions/v1/macro", {
        method: "POST",
        headers: o,
        body: JSON.stringify({ modo: "cotacoes", aba: e }),
        signal: AbortSignal.timeout(25000),
      }),
      n = await s.json().catch(() => ({}));
    if (!s.ok) throw new Error(n.error || "Erro " + s.status);
    if (!Array.isArray(n.itens))
      throw new Error(
        'Para ver as cotações, publique a função "macro" nova (v194) no Supabase.',
      );
    ((CQ.d[e] = n), (CQ.ts[e] = Date.now()), (CQ.err = ""), (CQ.errors[e] = ""));
  } catch (o) {
    ((CQ.err = String(o.message || o)), (CQ.errors[e] = CQ.err), (CQ.ts[e] = Date.now()));
  }
  ((CQ.loading[e] = false), CQ.busy === e && (CQ.busy = ""), e === "fut" && (await cqPonte()), cqPinta());
}
var cqPonte, cqPinta;
const CQ_COR = {
  fut: "#c2943e",
  idx: "#86abcb",
  br: "#3aad74",
  us: "#709bc2",
  adr: "#339966",
  fx: "#afa99d",
  cmd: "#b88c3a",
  cri: "#c69a49",
  jur: "#e7614c",
};
function cqNum(e, t) {
  return e == null
    ? "–"
    : Number(e).toLocaleString("pt-BR", {
        minimumFractionDigits: t,
        maximumFractionDigits: t,
      });
}
var cqLinha;
function cqJurosExtra() {
  const e = (typeof JR < "u" && JR.data) || null;
  if (!e) return "";
  const t = [];
  (e.selic && e.selic.v != null && t.push(["Selic meta", e.selic.v + "%"]),
    e.cdi && e.cdi.v != null && t.push(["CDI (ano)", e.cdi.v + "%"]),
    e.ipca12 &&
      e.ipca12.v != null &&
      t.push(["IPCA 12 meses", e.ipca12.v + "%"]));
  const a = (e.curva || []).slice(0, 8);
  return !t.length && !a.length
    ? ""
    : `<div class="card" style="margin-top:10px"><b class="sm">Brasil: Banco Central e DI futuro</b><div class="kv" style="margin-top:6px">${t.map(([o, s]) => KV(o, s)).join("")}</div>${a.length ? `<div class="cqdi">${a.map((o) => `<div><small>${esc(o.rotulo || o.cod)}</small><b>${cqNum(o.taxa, 2)}%</b>${o.var_pb != null ? `<small class="${o.var_pb > 0 ? "r" : o.var_pb < 0 ? "g" : ""}">${o.var_pb > 0 ? "+" : ""}${cqNum(o.var_pb, 1)} pb</small>` : ""}</div>`).join("")}</div><div class="sm mut" style="margin-top:6px">DI futuro: taxa ao ano de cada vencimento (Juros e DI tem a curva completa).</div>` : ""}</div>`;
}
var cotHtml;
{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "cq"
      ? e.apply(this, arguments)
      : (setTimeout(() => cqCarrega(), 0), `<h1>Cotações</h1>${cotHtml()}`);
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cqa]");
  if (t) {
    CQ.aba = t.dataset.cqa;
    CQ.search = "";
    try {
      ls.set("diario-cq-aba", CQ.aba);
    } catch {}
    (cqPinta(),
      cqCarrega(CQ.aba),
      t.scrollIntoView({ inline: "center", block: "nearest" }));
    return;
  }
  const a = e.target.closest("[data-cqo]");
  if (a) {
    ((CQ.ord = a.dataset.cqo), cqPinta());
    return;
  }
  if (e.target.closest("[data-cqr]")) { cqCarrega(CQ.aba, !0); try { Promise.resolve(mdoCarrega(true)).then(cqPinta).catch(()=>{}); } catch {} }
}),
  setInterval(() => {
    !document.hidden &&
      tab === "mercado" &&
      MKT.tab === "cq" &&
      cqCarrega(CQ.aba);
  }, 3e4));
const AG_MEXE =
  /payroll|CPI|infla\xe7\xe3o ao consumidor|n\xfacleo da infla\xe7\xe3o|PCE|decis\xe3o de juros|FOMC|Copom|IPCA|PIB|vendas no varejo|ISM|aux\xedlio-desemprego|discurso.*(Powell|Gal\xedpolo)|Powell|Gal\xedpolo|PMI industrial|IBC-Br/i;
function agNum(e) {
  if (e == null) return null;
  const t = String(e)
    .replace(/\./g, "")
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/);
  return t ? +t[0] : null;
}
function agRadarHtml(e) {
  const t = Date.now(),
    a = agDia(new Date().toISOString()),
    o = e.filter((u) => agDia(u.em) === a),
    s = e.find((u) => u.imp === 1 && Date.parse(u.em) > t - 6e4),
    n = o.filter((u) => u.imp === 1).length,
    r = o.filter((u) => u.imp === 0).length,
    i = 360,
    l = 1200,
    d = (u) => {
      const m = new Date(u.em),
        f = m.getHours() * 60 + m.getMinutes();
      return Math.max(0, Math.min(100, ((f - i) / (l - i)) * 100));
    },
    c = new Date().getHours() * 60 + new Date().getMinutes(),
    p = Math.max(0, Math.min(100, ((c - i) / (l - i)) * 100));
  return `<div class="agr"><div class="agr-top"><div><small>Próxima notícia forte</small>${s ? `<b>${AG_FL[s.p] || ""} ${esc(s.t)}</b><span class="sm mut">${dsem(agDia(s.em))} ${agHora(s.em)}</span>` : '<b class="mut">nenhuma nesta semana</b>'}</div>${s ? `<div class="agr-cd" data-agcd="${Date.parse(s.em)}">${agFalta(Date.parse(s.em))}</div>` : ""}</div>
<div class="sm" style="margin:8px 0 4px">Hoje: <b class="r">${n} de alto impacto</b> · <b class="am">${r} de médio</b></div>
<div class="agr-ln" aria-label="Linha do dia de 6h às 20h">${[9, 12, 15, 18].map((u) => `<i class="hh" style="left:${((u * 60 - i) / (l - i)) * 100}%"><span>${u}h</span></i>`).join("")}${o
    .filter((u) => u.imp >= 0)
    .map(
      (u) =>
        `<i class="ev ${u.imp === 1 ? "a" : "m"}" style="left:${d(u)}%" title="${esc(agHora(u.em) + " " + u.t)}"></i>`,
    )
    .join(
      "",
    )}${c >= i && c <= l ? `<i class="now" style="left:${p}%"></i>` : ""}</div></div>`;
}
function agFalta(e) {
  const t = Math.round((e - Date.now()) / 6e4);
  if (t <= 0) return "agora";
  if (t < 60) return "em " + t + " min";
  const a = Math.floor(t / 60);
  return a < 24
    ? `em ${a}h${String(t % 60).padStart(2, "0")}`
    : `em ${Math.floor(a / 24)}d ${a % 24}h`;
}
setInterval(() => {
  document.querySelectorAll("[data-agcd]").forEach((e) => {
    e.textContent = agFalta(+e.dataset.agcd);
  });
}, 3e4);
{
  const e = agHtml;
  agHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = AG.v[AG.sem];
      if (!a || !t) return t;
      const { out: o } = agFiltra(a.eventos || []);
      if (!o.length) return t;
      const s = document.createElement("div");
      s.innerHTML = t;
      const n = {};
      o.forEach((l) => {
        (n[agDia(l.em)] = n[agDia(l.em)] || []).push(l);
      });
      const r = Object.keys(n)
          .sort()
          .flatMap((l) => n[l]),
        i = s.querySelectorAll(".ag-ev");
      return (
        i.length === r.length &&
          i.forEach((l, d) => {
            const c = r[d],
              p =
                c.imp === 1
                  ? ["ALTA", "a"]
                  : c.imp === 0
                    ? ["MÉDIA", "m"]
                    : ["BAIXA", "b"],
              u = l.querySelector(".ag-tx>div");
            (u &&
              u.insertAdjacentHTML(
                "afterbegin",
                `<span class="agp ${p[1]}">${p[0]}</span> `,
              ),
              AG_MEXE.test(c.t + " " + c.orig) &&
                (c.p === "US" || c.p === "BR") &&
                c.imp >= 0 &&
                u &&
                u.insertAdjacentHTML(
                  "beforeend",
                  ' <span class="agm">mexe no WIN/WDO</span>',
                ));
            const m = agNum(c.atual),
              f = agNum(c.proj);
            if (m != null && f != null && m !== f) {
              const x = l.querySelector(".ag-n");
              x &&
                x.insertAdjacentHTML(
                  "beforeend",
                  `<span class="ags ${m > f ? "up" : "dn"}">${m > f ? "▲ acima" : "▼ abaixo"} da projeção</span>`,
                );
            }
          }),
        agRadarHtml(o) + s.innerHTML
      );
    } catch {
      return t;
    }
  };
}
{
  const e = TraderStyles.slot("legacy-058");
  ((e.textContent = TraderStyles.css("legacy-058")), TraderStyles.mount(e));
}
FN_ESPERADA.notificar = "v195";
const FUT_L = "FGHJKMNQUVXZ";
function quartaPerto15(e, t) {
  let a = 3 - new Date(Date.UTC(e, t, 15)).getUTCDay();
  return (
    a > 3 && (a -= 7),
    a < -3 && (a += 7),
    new Date(Date.UTC(e, t, 15 + a)).toISOString().slice(0, 10)
  );
}
function codIndice(e, t) {
  const a = t ? new Date(t).toISOString().slice(0, 10) : loc().slice(0, 10);
  t = t || new Date();
  const o = t.getFullYear(),
    s = t.getMonth();
  for (let n = 0; n < 14; n++) {
    const r = (s + n) % 12,
      i = o + Math.floor((s + n) / 12);
    if (r % 2 === 1 && !(a > quartaPerto15(i, r)))
      return e + FUT_L[r] + String(i).slice(2);
  }
  return e;
}
function codDolar(e, t) {
  t = t || new Date();
  const a = (t.getMonth() + 1) % 12,
    o = t.getFullYear() + (t.getMonth() === 11 ? 1 : 0);
  return e + FUT_L[a] + String(o).slice(2);
}
const codFut = (e) => (e === "WIN" || e === "IND" ? codIndice(e) : codDolar(e)),
  BR_COT0 = [
    "PETR4",
    "VALE3",
    "ITUB4",
    "BBDC4",
    "BBAS3",
    "B3SA3",
    "ABEV3",
    "WEGE3",
    "PRIO3",
    "ITSA4",
    "BPAC11",
    "SUZB3",
    "ELET3",
    "RENT3",
    "EQTL3",
    "RADL3",
    "GGBR4",
    "CSNA3",
    "USIM5",
    "EMBR3",
    "VBBR3",
    "LREN3",
    "MGLU3",
    "RAIL3",
    "SBSP3",
    "CMIG4",
  ];
function ponteCotPublica() {
  try {
    const e = ((CQ.d.br && CQ.d.br.itens) || []).map((n) => n.c),
      t = ((S.ax || {}).cqFav || [])
        .filter((n) => n.aba === "br" || n.aba === "idx")
        .map((n) => String(n.s).split(":")[1]),
      a = [
        ...new Set(
          [
            ...["WIN", "WDO", "IND", "DOL"].map(codFut),
            "IBOV",
            ...(e.length ? e : BR_COT0),
            ...t,
          ]
            .map((n) =>
              String(n || "")
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, ""),
            )
            .filter(Boolean),
        ),
      ].slice(0, 40),
      o = S.ax ?? (S.ax = {}),
      s = o.ponteCot || {};
    (JSON.stringify(s.tks || []) !== JSON.stringify(a) ||
      Date.now() - (+s.em || 0) > 2 * 36e5) &&
      ((o.ponteCot = { em: Date.now(), tks: a }), save());
  } catch {}
}
cqPonte = async function () {
  try {
    if (typeof SESS > "u" || !SESS || Date.now() - CQ.pfTs < 15e3) return;
    CQ.pfTs = Date.now();
    const e = await (
        await rq(
          "/rest/v1/cotacoes?select=ticker,ult,var,updated_at&user_id=eq." +
            SESS.uid,
        )
      ).json(),
      t = {},
      a = {
        WIN: codFut("WIN"),
        WDO: codFut("WDO"),
        IND: codFut("IND"),
        DOL: codFut("DOL"),
      };
    ((e || []).forEach((o) => {
      const s = String(o.ticker || "").toUpperCase();
      if (!(+o.ult > 0) || Date.now() - Date.parse(o.updated_at) > 3 * 6e4)
        return;
      const n = {
        px: +o.ult,
        d1: o.var != null && isFinite(+o.var) ? +o.var : null,
        tk: s,
      };
      t[s] = n;
      const r = /^(WIN|WDO|IND|DOL)[FGHJKMNQUVXZ]\d\d$/.exec(s);
      r && (s === a[r[1]] || !t["@" + r[1]]) && (t["@" + r[1]] = n);
    }),
      (CQ.pf = t));
  } catch {}
};
function cqSessaoAberta() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/Sao_Paulo', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  const minutes = +parts.hour * 60 + +parts.minute;
  return !['Sat','Sun'].includes(parts.weekday) && minutes >= 540 && minutes < 1110;
}
const cqPf = (e, t) => {
    // v623: cripto ao vivo pela Binance (lista, favoritos e mapa); TradingView continua como reserva
    if ((t === 'cri' || e._aba === 'cri') && typeof bncQ === 'function') { const b = bncQ(e.c); if (b) return { px: b.px, d1: b.d1, live: true, bnc: true, em: new Date(b.em).toISOString() }; }
    // v624: EUA, ADRs e moedas pela Finnhub no pregão; fora dele (ou sem conexão) segue o TradingView
    if (typeof fhAplica === 'function' && (e._aba || t) !== 'br') { const f = fhAplica(e.c, e.px, e.d1); if (f) return f; }
    if (CQ.owner && (typeof SESS === 'undefined' || CQ.owner !== SESS?.uid)) return null;
    const code = String(e.c || '').toUpperCase();
    const future = /^(WIN|WDO|IND|DOL)/.exec(code);
    const key = future && (t === 'fut' || /1!$/.test(e.s || '')) ? '@'+future[1] : code;
    if (!future && !['br','idx'].includes(t) && !(e.s || '').startsWith('BMFBOVESPA:')) return null;
    const live = CQ.pf[key];
    if (live && Number.isFinite(live.px) && (!live.em || Date.now()-Date.parse(live.em)<180000)) return {...live, live:true};
    const saved = CQ.saved[key];
    if (!cqSessaoAberta() && saved?.px > 0) return {...saved, fechado:true, live:false};
    return null;
  },
  cqPx = (e, t) => {
    const a = cqPf(e, t);
    return a ? a.px : e.px;
  };
(CQ_ABAS.unshift(["fav", "★ Favoritos"]),
  (CQ.vis = (() => {
    try {
      return ls.get("diario-cq-vis") || "lista";
    } catch {
      return "lista";
    }
  })()));
const cqFavs = () => (S.ax || {}).cqFav || [],
  cqEhFav = (e) => cqFavs().some((t) => t.s === e);
{
  const e = cqCarrega;
  cqCarrega = async function (t, a) {
    if (((t = t || CQ.aba), t !== "fav")) {
      (await e.call(this, t, a), cqAlertaChecar());
      return;
    }
    const o = cqFavs(),
      s = [...new Set(o.map((r) => r.aba))];
    if (!o.length) {
      ((CQ.d.fav = { itens: [], em: new Date().toISOString() }), cqPinta());
      return;
    }
    for (const r of s) await e.call(this, r, a);
    await cqPonte();
    const n = o.map((r) => {
      const i = CQ.d[r.aba],
        l = i && i.itens.find((d) => d.s === r.s);
      return l
        ? { ...l, _aba: r.aba }
        : {
            s: r.s,
            c: String(r.s).split(":")[1],
            n: "",
            dp: 2,
            px: null,
            d1: null,
            _aba: r.aba,
          };
    });
    ((CQ.d.fav = { itens: n, em: new Date().toISOString() }),
      (CQ.ts.fav = Date.now()),
      cqPinta(),
      cqAlertaChecar());
  };
}
const cqAls = () => {
  var e;
  return (e = S.ax ?? (S.ax = {})).alpx ?? (e.alpx = []);
};
function cqAlertaChecar() {
  let e = 0;
  if (
    (cqAls().forEach((t) => {
      if (t.fired) return;
      let a = null;
      (Object.entries(CQ.d).some(([o, s]) => {
        const n = s && s.itens && s.itens.find((r) => r.s === t.s);
        return n ? ((a = cqPx(n, n._aba || o)), a != null) : !1;
      }),
        a != null &&
          (t.op === ">" ? a >= t.v : a <= t.v) &&
          ((t.fired = Date.now()),
          (e = 1),
          toast(
            `🔔 ${t.c} ${t.op === ">" ? "chegou a" : "caiu para"} ${cqNum(t.v, t.dp ?? 2)} (agora ${cqNum(a, t.dp ?? 2)})`,
            7e3,
          )));
    }),
    e)
  ) {
    save();
    try {
      turnoPushSync(!0);
    } catch {}
  }
}
{
  const e = npComTurno;
  npComTurno = function () {
    const t = e.apply(this, arguments);
    try {
      t.alpx = cqAls()
        .filter((a) => !a.fired)
        .slice(0, 20)
        .map((a) => ({ id: a.id, s: a.s, c: a.c, op: a.op, v: a.v }));
    } catch {}
    return t;
  };
}
function cqAlertaNovo(e) {
  let t = null,
    a = "";
  if (
    (Object.entries(CQ.d).some(([i, l]) => {
      const d = l && l.itens && l.itens.find((c) => c.s === e);
      return d ? ((t = d), (a = d._aba || i), !0) : !1;
    }),
    !t)
  )
    return;
  const o = cqPx(t, a),
    s = prompt(
      `Avisar quando ${t.c} chegar a qual preço?${o != null ? " (agora " + cqNum(o, t.dp) + ")" : ""}`,
      "",
    );
  if (!s) return;
  const n = +String(s).replace(/\./g, "").replace(",", ".");
  if (!(n > 0)) {
    toast("Digite um preço válido.");
    return;
  }
  const r = o == null || n >= o ? ">" : "<";
  (cqAls().push({
    id: "a" + Date.now().toString(36),
    s: t.s,
    c: t.c,
    op: r,
    v: n,
    dp: t.dp,
    em: Date.now(),
  }),
    save());
  try {
    turnoPushSync(!0);
  } catch {}
  (toast(
    `Alerta criado: ${t.c} ${r === ">" ? "acima de" : "abaixo de"} ${cqNum(n, t.dp)}. Chega como notificação no celular.`,
    5e3,
  ),
    cqPinta());
}
function cqAlertasHtml() {
  const e = cqAls();
  return e.length
    ? `<details class="cqals"${e.some((t) => !t.fired) ? " open" : ""}><summary><b>🔔 Seus alertas de preço</b> <span class="sm mut">${e.filter((t) => !t.fired).length} ativo(s)</span></summary>${e
        .slice()
        .reverse()
        .map(
          (t) =>
            `<div class="cqal"><span><b>${esc(t.c)}</b> ${t.op === ">" ? "acima de" : "abaixo de"} <b>${cqNum(t.v, t.dp ?? 2)}</b> ${t.fired ? `<span class="sm g">✓ disparou ${fmtHm(t.fired)}</span>` : '<span class="sm mut">esperando</span>'}</span><button class="btn s" data-cqald="${esc(t.id)}" aria-label="Apagar">✕</button></div>`,
        )
        .join("")}</details>`
    : "";
}
cqLinha = function (e, t) {
  t = e._aba || t;
  const a = cqPf(e, t),
    o = a ? a.px : e.px,
    s = a ? a.d1 : e.d1,
    n = CQ_COR[t] || "var(--ac)",
    r = String(e.c || "")
      .replace(/[^A-Z0-9/]/gi, "")
      .slice(0, 4),
    i = cqEhFav(e.s),
    l = cqAls().some((c) => c.s === e.s && !c.fired),
    d = (() => {
      try {
        const c = window.TraderAssetIdentity?.avatar(e.s || e.c);
        if (c) return (c.classList.add("cqi"), c.outerHTML);
      } catch {}
      return null;
    })();
  return `<div class="cqr" data-market-symbol="${esc(e.s || e.c)}"${a && a.bnc ? ` data-bnc="${esc(String(e.c || "").toUpperCase())}"` : a && a.fh ? ` data-fh="${esc(fhSym(e.c))}"` : ""}${d ? ' data-ta-done="1"' : ""}>${d || `<span class="cqi" style="color:${n};background:color-mix(in srgb,${n} 16%,transparent)">${esc(r)}</span>`}<div class="cqn"><b>${esc(e.c || "")}${a && a.tk && a.tk !== e.c ? ` <small class="mut">${esc(a.tk)}</small>` : ""}</b><small>${esc(e.n || "")}${a ? (a.fechado ? ' · <span class="market-closed">FECHADO</span>' : ' · <span class="g">Profit ao vivo</span>') : ""}</small>${a ? `<small class="market-quote-time">Profit · ${esc(a.em ? new Date(a.em).toLocaleString("pt-BR", {timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) + " BRT" : "horário não informado")}</small>` : cotacaoReferencia(e)}</div>
<div class="cqp"><b>${o == null ? '<span class="mut">—</span>' : (e.un && e.un !== "%" ? "<small>" + esc(e.un) + "</small> " : "") + cqNum(o, e.dp) + (e.un === "%" ? "%" : "")}</b>${e.dabs != null && !a ? `<small class="${cls(e.dabs)}">${e.dabs > 0 ? "+" : ""}${cqNum(e.dabs, e.dp)}</small>` : ""}</div>
<span class="cqv ${s == null ? "" : s > 0 ? "up" : s < 0 ? "dn" : ""}">${s == null ? "–" : (s > 0 ? "+" : "") + cqNum(s, 2) + "%"}</span><span class="cqac"><button class="cqb${i ? " on" : ""}" data-cqfav="${esc(e.s)}" data-ab="${esc(t)}" aria-label="Favorito">${i ? "★" : "☆"}</button><button class="cqb${l ? " on" : ""}" data-cqal="${esc(e.s)}" aria-label="Alerta de preço">🔔</button></span></div>`;
};
function cqMapa(e, t) {
  return `<div class="cqmap">${e
    .map((a) => {
      const o = a._aba || t,
        s = cqPf(a, o),
        n = s ? s.px : a.px,
        r = s ? s.d1 : a.d1,
        i = r == null ? 0 : Math.min(1, Math.abs(r) / 3);
      return `<div class="cqt" style="background:${r == null ? "var(--card2)" : `color-mix(in srgb,${r >= 0 ? "var(--g)" : "var(--r)"} ${Math.round(18 + i * 62)}%,var(--card))`}" title="${esc(a.n || "")}"><b>${esc(a.c || "")}</b><span>${r == null ? "–" : (r > 0 ? "+" : "") + cqNum(r, 2) + "%"}</span><small>${n == null ? "" : cqNum(n, a.dp)}</small></div>`;
    })
    .join("")}</div>`;
}
// Complementos do panorama entram na própria categoria, com fonte e sem
// duplicar ativos válidos da lista principal. Nunca misturar setores EUA em BR.
function cqItens(category) {
  const native = (CQ.d[category]?.itens || []).slice();
  const aliases = {'^BVSP':'IBOV','^GSPC':'SPX','^IXIC':'NASDAQ','BRL=X':'USDBRL'};
  const key = symbol => { const code = String(symbol || '').split(':').pop().toUpperCase(); return aliases[code] || code; };
  const symbols = {adr: (typeof AD !== 'undefined' ? AD.list : []),idx:['^BVSP','^GSPC','^IXIC'],fx:['DXY','DX-Y.NYB','BRL=X'],fut:['ES=F','NQ=F','YM=F'],cmd:['BRENT','WTI','IRON','GOLD','BZ=F','CL=F','GC=F','FE=F'],jur:['SELIC','DI1F27','US10Y','^TNX']};
  const present = new Set(native.filter(item=>cqPx(item,item._aba || category)>0).map(item=>key(item.s)));
  if (category === 'adr') {
    for (const item of AD.data?.itens || []) {
      if ((item.regular?.px ?? item.px)>0) present.add(key(item.s));
    }
  }
  let groups = []; try { groups = MDO.v?.mercados?.grupos || []; } catch {}
  for (const item of groups.flatMap(group=>group.itens || [])) {
    if (!(item.px>0) || item.suspeito || !(symbols[category] || []).includes(item.s) || present.has(key(item.s))) continue;
    const existing = native.findIndex(row=>key(row.s)===key(item.s));
    const resolved = {...item,c:item.c || key(item.s),dp:item.dp ?? 2,simboloFonte:item.simboloFonte || item.s,horarioPreco:item.horarioPreco || item.em};
    if (existing>=0) native[existing]=resolved; else native.push(resolved);
    present.add(key(item.s));
  }
  return native;
}
// Cotações são montadas completas antes de entrarem no DOM. Nenhum decorador
// posterior cria busca, ordenação ou move a lista para outra coluna.
((cotHtml = function () {
  const category = CQ.aba, data = CQ.d[category];
  const items = cqItens(category);
  const change = item => { const quote = cqPf(item,item._aba || category); return quote ? quote.d1 : item.d1; };
  if (CQ.ord === 'alta') items.sort((a,b)=>(change(b) ?? -Infinity)-(change(a) ?? -Infinity));
  if (CQ.ord === 'baixa') items.sort((a,b)=>(change(a) ?? Infinity)-(change(b) ?? Infinity));
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const query = normalize(CQ.search).trim();
  const visible = items.filter(item=>normalize(item.c+' '+item.n).includes(query));
  const busy = category === 'adr' ? !!AD.busy : !!CQ.loading[category] || CQ.busy === category;
  const error = CQ.errors[category] || (!data && !busy ? CQ.err : '');
  let content;
  const mapa606 = CQ.vis === 'mapa';
  if (mapa606 || ['jur','fx'].includes(category)) setTimeout(()=>{ try { m606Carrega(); } catch {} },0);
  if (mapa606) content = m606MapaHtml();
  else if (category === 'adr') content = `<section id="adr" class="market-adrs">${adrHtml()}</section>${visible.length ? `<div class="cql">${visible.map(item=>cqLinha(item,category)).join('')}</div>` : ''}`;
  else if (visible.length) content = CQ.vis === 'mapa' ? cqMapa(visible,category) : `<div class="cql">${visible.map(item=>cqLinha(item,category)).join('')}</div>`;
  else {
    const text = query && items.length ? 'Nenhum ativo corresponde à busca.' : category === 'fav' && !cqFavs().length ? 'Marque a estrela de um ativo para acompanhar aqui.' : busy ? 'Consultando cotações…' : error ? 'Não foi possível atualizar esta categoria.' : data ? 'A fonte não retornou ativos nesta categoria.' : 'Aguardando consulta da fonte.';
    content = `<div class="market-state" role="status">${esc(text)}</div>`;
  }
  if (!mapa606 && category === 'jur') content = m606DiHtml() + m606FedHtml() + content;
  if (!mapa606 && category === 'fx') content = m606EmHtml() + content;
  const term623 = typeof m623Ativo === 'function' && m623Ativo();
  if (!mapa606 && ['cri','fav'].includes(category) && typeof bncSelo === 'function') content = `<div class="bnc-bar">${bncSelo()}</div>` + content;
  if (!mapa606 && ['us','adr','fx'].includes(category) && typeof fhSelo === 'function') content = `<div class="bnc-bar">${fhSelo()}</div>` + content;
  const desk624 = typeof m623Desk === 'function' && m623Desk();
  const adrN = category === 'adr' ? (AD.data?.itens || []).filter(item=>(item.regular?.px ?? item.px)>0).length : 0;
  const total = visible.length + adrN;
  const cache606 = CQ.cache606?.[category];
  const summary606 = mapa606 ? `12 termômetros${M606.busy ? ' · atualizando…' : ''}` : busy ? (total ? `${total} ativos · atualizando${cache606 ? ' (mostrando o salvo às '+new Date(cache606).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'})+')' : ''}…` : 'Atualizando…') : total+' ativos';
  return `<div id="cotbox" class="market-quotes${term623 ? ' m624-t' : ''}" data-category="${esc(category)}">
    <div class="market-categories" role="group" aria-label="Categorias de ativos">${CQ_ABAS.map(([key,label])=>`<button type="button" data-cqa="${key}" class="${category===key?'on':''}" aria-pressed="${category===key}">${esc(label.replace('★ ',''))}</button>`).join('')}</div>
    <div class="market-tools"><label class="market-search"><span class="market-sr">Buscar ativo</span><input type="search" data-market-search placeholder="Buscar ativo" value="${esc(CQ.search || '')}" autocomplete="off"></label><button type="button" data-cqr="1" aria-label="Atualizar preços" ${busy?'disabled':''}>↻</button><label class="market-order"><span class="market-sr">Ordenar ativos</span><select data-market-order>${[['lista','Ordem padrão'],['alta','Maiores altas'],['baixa','Maiores quedas']].map(([key,label])=>`<option value="${key}" ${CQ.ord===key?'selected':''}>${label}</option>`).join('')}</select></label><button type="button" data-cqv="${CQ.vis==='mapa'?'lista':'mapa'}" aria-label="${CQ.vis==='mapa'?'Ver lista':'Ver mapa de calor'}">${CQ.vis==='mapa'?'Lista':'Mapa'}</button>${desk624 ? `<button type="button" class="m624-b" data-imgger="1" title="Gerar a imagem Panorama do mercado">Panorama</button>${term623 ? '<button type="button" class="m624-b" data-m624-mon aria-pressed="false" title="Tela limpa só com a grade (Esc para sair)">Modo Monitor</button>' : ''}` : ''}</div>
    ${term623 ? m623Html() : `<div class="market-summary" role="status">${summary606}${!mapa606 && data?.em ? ' · Consulta '+esc(new Date(data.em).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}))+' BRT' : ''}</div>
    ${error ? `<p class="market-error" role="status">${esc(error)}${items.length?' Mantendo a consulta anterior.':''}</p>` : ''}
    <div class="market-results" aria-busy="${busy}">${content}</div>`}
    <details class="market-sources"><summary>Fontes e ferramentas</summary><p>Profit para ativos da B3 quando a ponte está conectada. Após o pregão, o último registro salvo aparece como FECHADO, com contrato e horário. As demais fontes e seus atrasos aparecem em cada ativo.</p><button type="button" data-navroute="term">Abrir gráficos e comparação no Terminal</button><button type="button" data-market-longshort>Long &amp; Short</button>${cqAlertasHtml()}${category==='jur'?'<button type="button" data-market-di>Ver curva DI no Terminal</button>'+cqJurosExtra():''}</details>
  </div>`;
}),
  (cqPinta = function () {
    if (tab !== 'mercado' || MKT.tab !== 'cq') return;
    const node = document.getElementById('cotbox');
    if (!node) return;
    const openSources = node.querySelector('.market-sources')?.open;
    const openQuotes = new Set([...node.querySelectorAll('.cqr:has(.quote-reference[open])')].map(row=>row.dataset.marketSymbol));
    const focus = document.activeElement;
    const searching = focus?.matches('[data-market-search]');
    const start = searching ? focus.selectionStart : null;
    const end = searching ? focus.selectionEnd : null;
    const scroller = node.querySelector('.market-categories');
    const left = scroller?.scrollLeft || 0;
    node.outerHTML = cotHtml();
    const fresh = document.getElementById('cotbox');
    const sources = fresh?.querySelector('.market-sources');
    if (sources) sources.open = !!openSources;
    for (const row of fresh?.querySelectorAll('.cqr') || []) {
      if (openQuotes.has(row.dataset.marketSymbol)) { const detail = row.querySelector('.quote-reference'); if (detail) detail.open = true; }
    }
    const categories = fresh?.querySelector('.market-categories');
    if (categories) categories.scrollLeft = left;
    if (searching) {
      const input = fresh?.querySelector('[data-market-search]');
      input?.focus({preventScroll:true});
      try { input?.setSelectionRange(start,end); } catch {}
    }
  }));
document.addEventListener('click', event => {
  if (event.target.closest('[data-market-longshort]')) { document.querySelector('#app #v512-lsbtn')?.click(); return; }
  if (!event.target.closest('[data-market-di]')) return;
   irPara('term');
  requestAnimationFrame(()=>document.querySelector('#app:not(.v503-fantasma) [data-tf415-nav="DIFUT"]')?.click());
});
document.addEventListener('input', event => {
  if (!event.target.matches('[data-market-search]')) return;
  CQ.search = event.target.value;
  cqPinta();
});
document.addEventListener('change', event => {
  if (!event.target.matches('[data-market-order]')) return;
  CQ.ord = event.target.value;
  cqPinta();
});

{
  const e = vMercado;
  vMercado = function () {
    return MKT.tab !== "cq"
      ? e.apply(this, arguments)
      : (setTimeout(() => {
          (cqCarrega(), ponteCotPublica(), cqPonte().then(cqPinta));
        }, 0),
        `<h1>Cotações</h1>${cotHtml()}`);
  };
}
(document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cqfav]");
  if (t) {
    const n = S.ax ?? (S.ax = {}),
      r = n.cqFav ?? (n.cqFav = []),
      i = t.dataset.cqfav,
      l = r.findIndex((d) => d.s === i);
    (l >= 0 ? r.splice(l, 1) : r.push({ s: i, aba: t.dataset.ab }),
      save(),
      CQ.aba === "fav" ? cqCarrega("fav") : cqPinta());
    return;
  }
  const a = e.target.closest("[data-cqal]");
  if (a) {
    cqAlertaNovo(a.dataset.cqal);
    return;
  }
  const o = e.target.closest("[data-cqald]");
  if (o) {
    const n = S.ax;
    ((n.alpx = (n.alpx || []).filter((r) => r.id !== o.dataset.cqald)), save());
    try {
      turnoPushSync(!0);
    } catch {}
    cqPinta();
    return;
  }
  const s = e.target.closest("[data-cqv]");
  if (s) {
    CQ.vis = s.dataset.cqv;
    try {
      ls.set("diario-cq-vis", CQ.vis);
    } catch {}
    cqPinta();
  }
}),
  setInterval(() => {
    !document.hidden &&
      tab === "mercado" &&
      MKT.tab === "cq" &&
      cqPonte().then(() => {
        (cqPinta(), cqAlertaChecar());
      });
  }, 15e3));
try {
  GOR.cq = () => {
    ((MKT.tab = "cq"), irPara("mercado"));
  };
} catch {}
const AGH_K = "diario-ag-hist";
function aghLe() {
  try {
    return JSON.parse(APP_STORAGE.getItem(AGH_K) || '{"ev":{}}');
  } catch {
    return { ev: {} };
  }
}
let AGH_SIG = "";
function aghGrava() {
  try {
    const e = JSON.stringify([
      Object.keys(AG.v || {}).map((r) => (AG.v[r] || {}).em),
      AL.evTs || 0,
    ]);
    if (e === AGH_SIG) return;
    AGH_SIG = e;
    const t = aghLe(),
      a = t.ev || (t.ev = {});
    let o = 0,
      s = t.ini || "";
    if (
      (Object.values(AG.v || {}).forEach((r) => {
        if (!(!r || !Array.isArray(r.eventos))) {
          if (r.de) {
            const i = String(r.de).slice(0, 10);
            (!s || i < s) && (s = i);
          }
          r.eventos.forEach((i) => {
            if (i.imp !== 1 || !(i.p === "US" || i.p === "BR")) return;
            const l = "g" + i.id;
            a[l] ||
              ((a[l] = { em: i.em, t: (AG_NM[i.p] || i.p) + ": " + i.t }), o++);
          });
        }
      }),
      (AL.ev || []).forEach((r) => {
        if (r.imp !== "high" || !(r.cur === "USD" || r.cur === "BRL")) return;
        const i = "a" + (r.id || r.d + "|" + r.t);
        a[i] ||
          ((a[i] = {
            em: r.d,
            t: (r.cur === "USD" ? "EUA" : "Brasil") + ": " + r.t,
          }),
          o++);
      }),
      !o && s === t.ini)
    )
      return;
    const n = new Date(Date.now() - 400 * 864e5).toISOString();
    (Object.keys(a).forEach((r) => {
      a[r].em < n && delete a[r];
    }),
      (t.ini = s || t.ini || loc().slice(0, 10)),
      APP_STORAGE.setItem(AGH_K, JSON.stringify(t)));
  } catch {}
}
function noticiaPerto(e, t = 15, a = 15, o) {
  const s = o || Object.values(aghLe().ev || {});
  let n = null;
  return (
    s.forEach((r) => {
      const i = (e - Date.parse(r.em)) / 6e4;
      i >= -t &&
        i <= a &&
        (!n || Math.abs(i) < Math.abs(n.d)) &&
        (n = { ...r, d: i });
    }),
    n
  );
}
function newsMarca() {
  if (!S.trades.some((o) => !o.newsOk && o.dt)) return;
  const e = aghLe();
  if (!e.ini) return;
  const t = Object.values(e.ev || {});
  let a = 0;
  for (const o of S.trades) {
    if (o.newsOk || !o.dt) continue;
    const s = String(o.dt).slice(0, 10);
    if (s < e.ini || s > loc().slice(0, 10)) continue;
    const n = noticiaPerto(Date.parse(String(o.dt).slice(0, 16)), 15, 15, t);
    ((o.news = n ? n.t : ""), (o.newsOk = 1), (a = 1));
  }
  a && save();
}
document.addEventListener(
  "click",
  (e) => {
    if (
      !e.target.closest('[data-a="savetrade"]') ||
      typeof T > "u" ||
      !T ||
      S.trades.some((o) => o.id === T.id)
    )
      return;
    const t = Date.parse(String(T.dt || "").slice(0, 16));
    if (!(Math.abs(t - Date.now()) < 20 * 6e4)) return;
    aghGrava();
    const a = noticiaPerto(t, 10, 5);
    a &&
      setTimeout(
        () =>
          toast(
            `⚠️ ${a.t} ${a.d < 0 ? "em " + Math.round(-a.d) + " min" : a.d < 1 ? "agora" : "há " + Math.round(a.d) + " min"}: entrar agora é operar a notícia. Spread e slippage costumam abrir.`,
            7e3,
          ),
        300,
      );
  },
  !0,
);
function newsHtml(e) {
  const t = linhasM(e).filter((d) => d.t.newsOk);
  if (t.length < 3)
    return '<div class="sm mut">Ainda há poucos trades com a agenda conhecida. O app vai guardando as notícias fortes (Brasil e EUA) da agenda e marcando cada trade feito até 15 min antes ou depois delas.</div>';
  const a = t.filter((d) => d.t.news),
    o = t.filter((d) => !d.t.news),
    s = (d) => ({
      n: d.length,
      ac: d.length ? d.filter((c) => c.v > 0).length / d.length : null,
      tot: sum(d.map((c) => c.v)),
      med: d.length ? sum(d.map((c) => c.v)) / d.length : null,
    }),
    n = s(a),
    r = s(o),
    i = (d, c) =>
      `<tr><td>${d}</td><td class="n">${c.n}</td><td class="n">${c.ac == null ? "–" : Math.round(c.ac * 100) + "%"}</td><td class="n ${cls(c.tot)}">${money(c.tot)}</td><td class="n ${cls(c.med || 0)}">${c.med == null ? "–" : money(c.med)}</td></tr>`,
    l =
      n.n < 3
        ? "Poucos trades perto de notícias até agora."
        : n.med < r.med
          ? `Perto de notícia você ganha <b class="r">${money((n.med || 0) - (r.med || 0))}</b> a menos por trade. Vale esperar 15 min depois do dado sair.`
          : `Perto de notícia o seu resultado por trade é melhor (${money(n.med)} contra ${money(r.med)}). Mesmo assim, confira o spread.`;
  return `<table class="sm" style="width:100%"><tr><th></th><th>Trades</th><th>Acerto</th><th>Resultado</th><th>Por trade</th></tr>${i("Até 15 min de notícia forte", n)}${i("Longe de notícia", r)}</table><div class="sm" style="margin-top:6px">${l}</div>${
    a.length
      ? `<div class="sm mut" style="margin-top:6px">Últimos: ${a
          .slice(-3)
          .reverse()
          .map(
            (d) =>
              `${esc(d.t.ativo)} ${fmtD(d.d).slice(0, 5)} (${esc(d.t.news)})`,
          )
          .join(" · ")}</div>`
      : ""
  }`;
}
function slipDados(e) {
  const t = (S.olho || []).filter((o) => o && o.a && +o.e > 0),
    a = [];
  return (
    linhasM(e).forEach((o) => {
      const s = o.t,
        n = s.side === "V" ? -1 : 1,
        r = o.d,
        i = t.find(
          (p) =>
            String(p.a).toUpperCase() === String(s.ativo).toUpperCase() &&
            (p.sd || "C") === (s.side || "C") &&
            (!p.dia || (r >= p.dia && r <= diasMais(p.dia, 3))),
        );
      if (!i) return;
      const l = numN(s.entry);
      if (!(l > 0)) return;
      const d = (l - +i.e) * n,
        c = d * (numN(s.qty) || 1) * (numN(s.pv) || 1);
      Math.abs(d / +i.e) > 0.05 ||
        a.push({ t: s, o: i, pts: d, rs: emBRL(c, moedaT(s)) });
    }),
    a
  );
}
function slipHtml(e) {
  const t = slipDados(e);
  if (!t.length)
    return '<div class="sm mut">Para medir, anote o trade em Ao vivo → Trades de olho com o preço de entrada planejado. Quando o trade executado for lançado (ou vier do Profit), o app compara os dois.</div>';
  const a = t.filter((n) => n.pts > 0),
    o = sum(t.map((n) => n.rs)),
    s = sum(t.map((n) => n.pts)) / t.length;
  return `<div class="kv">${KV("Trades comparados", String(t.length))}${KV("Diferença média", (s > 0 ? "+" : "") + f2(s) + " pts", s > 0 ? "r" : "g")}${KV("Custo total", money(-o), o > 0 ? "r" : "g")}${KV("Entraram pior", Math.round((a.length / t.length) * 100) + "%")}</div>
<div class="sm mut">Positivo = você entrou pior que o planejado (comprou mais caro ou vendeu mais barato). Ordem limitada no preço planejado costuma reduzir isso.</div>`;
}
{
  const e = numFerrHtml;
  numFerrHtml = function () {
    const t = e.apply(this, arguments);
    try {
      const a = typeof STMOD < "u" ? STMOD : "",
        o = (s, n, r) =>
          `<details class="nfer" data-nfer="${s}"${NUMA.has(s) ? " open" : ""}><summary><b>${n}</b></summary><div style="margin-top:8px">${NUMA.has(s) ? r() : ""}</div></details>`;
      return t.replace(
        /<\/div>$/,
        o("news", "📰 Seus trades perto de notícias fortes", () =>
          newsHtml(a),
        ) +
          o("slip", "🎯 Entrada planejada × executada", () => slipHtml(a)) +
          "</div>",
      );
    } catch {
      return t;
    }
  };
}
const SYQ = { busy: 0 };
setInterval(async () => {
  try {
    if (
      document.hidden ||
      typeof SESS > "u" ||
      !SESS ||
      !window.CLOUD_OK ||
      SY.busy ||
      SYQ.busy ||
      !navigator.onLine
    )
      return;
    SYQ.busy = 1;
    const e = await (
        await rq("/rest/v1/diario?select=mt:data->mt&user_id=eq." + SESS.uid)
      ).json(),
      t = +(e && e[0] && e[0].mt) || 0;
    t && t !== +(S.st || 0) && t > +(S.mt || 0) && (await sync());
  } catch {}
  SYQ.busy = 0;
}, 15e3);
{
  const e = render0;
  render0 = function () {
    try {
      (aghGrava(), newsMarca());
    } catch {}
    return e.apply(this, arguments);
  };
}
{
  const e = TraderStyles.slot("legacy-059");
  ((e.textContent = TraderStyles.css("legacy-059")), TraderStyles.mount(e));
}
const EN = { ok: !!window.EN_DATA, busy: 0, run: null };
function enCarrega() {
  if (EN.ok || EN.busy) return;
  EN.busy = 1;
  const e = document.createElement("script");
  ((e.src = "ingles.js"),
    (e.onload = () => {
      ((EN.ok = !!window.EN_DATA),
        (EN.busy = 0),
        (tab === "estudos" || tab === "home") && render());
    }),
    (e.onerror = () => {
      ((EN.busy = 0), toast("Sem internet para carregar as lições de inglês."));
    }),
    document.head.appendChild(e));
}
const enS = () => {
    const e = S.ax ?? (S.ax = {}),
      t = e.en ?? (e.en = {});
    return (
      t.r ?? (t.r = {}),
      t.xp ?? (t.xp = {}),
      t.cfg ?? (t.cfg = { meta: 30, voz: 0, vel: 0.9 }),
      t
    );
  },
  EN_BOX = [0, 1, 2, 4, 8, 16, 32],
  enHoje = () => loc().slice(0, 10);
function enTodos() {
  return window.EN_DATA
    ? (EN._L ||
        (EN._L = window.EN_DATA.itens.map(([e, t, a, o, s]) => ({
          id: e + ":" + t.toLowerCase(),
          t: e,
          en: t,
          pt: a,
          ex: o,
          exPt: s,
        }))),
      EN._L)
    : [];
}
const enTemas = () => (window.EN_DATA ? window.EN_DATA.temas : []);
function enDevidas() {
  const e = enS().r,
    t = enHoje();
  return enTodos().filter((a) => e[a.id] && e[a.id].next && e[a.id].next <= t);
}
function enProg(e) {
  const t = enS().r,
    a = enTodos().filter((o) => o.t === e);
  return {
    tot: a.length,
    vis: a.filter((o) => t[o.id]).length,
    apr: a.filter((o) => (t[o.id] || {}).box >= 2).length,
  };
}
function enRegistra(e, t) {
  var a;
  const o = enS().r,
    s = o[(a = e.id)] ?? (o[a] = { n: 0, ok: 0, box: 0 });
  (s.n++,
    t && s.ok++,
    (s.box = t ? Math.min(EN_BOX.length - 1, (s.box || 0) + 1) : 0),
    (s.next = diasMais(enHoje(), t ? EN_BOX[s.box] : 0)),
    (s.d = enHoje()));
}
function enXp(e) {
  const t = enS().xp,
    a = enHoje();
  t[a] = (t[a] || 0) + e;
  const o = diasMais(a, -400);
  Object.keys(t).forEach((s) => {
    s < o && delete t[s];
  });
}
function enSeq() {
  const e = enS().xp;
  let t = enHoje(),
    a = 0;
  for ((e[t] || 0) >= 10 || (t = diasMais(t, -1)); (e[t] || 0) >= 10; )
    (a++, (t = diasMais(t, -1)));
  return a;
}
const enTotal = () => sum(Object.values(enS().xp)),
  enNivel = () => {
    const e = enTotal();
    return { n: Math.floor(e / 500) + 1, f: (e % 500) / 500 };
  };
function enDoDia() {
  const e = enTodos();
  if (!e.length) return null;
  const t = +enHoje().replace(/-/g, "");
  return e[(t * 7919) % e.length];
}
var enFala;
const enRec = () =>
    window.SpeechRecognition || window.webkitSpeechRecognition || null,
  enNorm = (e) =>
    String(e || "")
      .toLowerCase()
      .replace(/[\u2019']/g, "'")
      .replace(/[^a-z0-9' ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
function enParecido(e, t) {
  if (((e = enNorm(e)), (t = enNorm(t)), !e || !t)) return !1;
  if (e.includes(t) || t.includes(e)) return !0;
  const a = e.length,
    o = t.length,
    s = Array.from({ length: a + 1 }, (n, r) => [r]);
  for (let n = 1; n <= o; n++) s[0][n] = n;
  for (let n = 1; n <= a; n++)
    for (let r = 1; r <= o; r++)
      s[n][r] = Math.min(
        s[n - 1][r] + 1,
        s[n][r - 1] + 1,
        s[n - 1][r - 1] + (e[n - 1] === t[r - 1] ? 0 : 1),
      );
  return s[a][o] / Math.max(a, o) <= 0.25;
}
const enEmb = (e) => {
  e = e.slice();
  for (let t = e.length - 1; t > 0; t--) {
    const a = Math.floor(Math.random() * (t + 1));
    [e[t], e[a]] = [e[a], e[t]];
  }
  return e;
};
function enOps(e, t, a = 4) {
  const o = enTodos(),
    s = o.filter((i) => i.t === e.t && i.id !== e.id),
    n = o.filter((i) => i.t !== e.t),
    r = enEmb(s)
      .concat(enEmb(n))
      .filter(
        (i, l, d) => i[t] !== e[t] && d.findIndex((c) => c[t] === i[t]) === l,
      )
      .slice(0, a - 1)
      .map((i) => i[t]);
  return enEmb([e[t], ...r]);
}
function enLacuna(e) {
  const t = e.ex || "",
    a = new RegExp(
      "\\b" + e.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
      "i",
    );
  return !a.test(t) || e.en.split(" ").length > 3
    ? null
    : t.replace(a, "_____");
}
function enPergunta(e, t) {
  const a = !!enS().cfg.voz && !!enRec(),
    o = "speechSynthesis" in window;
  if (
    (t === "ouvir" && !o && (t = "mc_en"),
    t === "falar" && !a && (t = "mc_pt"),
    t === "lacuna" && !enLacuna(e) && (t = "mc_pt"),
    t === "montar")
  ) {
    const s = (e.ex || "").split(" ");
    ((s.length < 3 || s.length > 9) && (t = "lacuna"),
      t === "lacuna" && !enLacuna(e) && (t = "mc_pt"));
  }
  if (t === "mc_en") return { it: e, tp: t, ops: enOps(e, "pt"), ans: e.pt };
  if (t === "mc_pt") return { it: e, tp: t, ops: enOps(e, "en"), ans: e.en };
  if (t === "ouvir") return { it: e, tp: t, ops: enOps(e, "en"), ans: e.en };
  if (t === "lacuna")
    return { it: e, tp: t, ops: enOps(e, "en"), ans: e.en, frase: enLacuna(e) };
  if (t === "montar") {
    const s = e.ex.split(" "),
      n = enEmb(enTodos().filter((r) => r.id !== e.id))
        .slice(0, 6)
        .flatMap((r) => r.ex.split(" "))
        .filter((r) => !s.includes(r))
        .slice(0, 2);
    return { it: e, tp: t, banco: enEmb([...s, ...n]), ans: e.ex };
  }
  return { it: e, tp: "falar", ans: e.en };
}
function enLicao(e, t) {
  const a = enS().r,
    o = enTodos();
  let s = [];
  if (e === "rev") s = enEmb(enDevidas()).slice(0, 10);
  else {
    const i = enEmb(enDevidas()).slice(0, 3),
      l = o.filter((p) => p.t === t && !i.includes(p)),
      d = l
        .filter((p) => a[p.id] && (a[p.id].box || 0) < 3)
        .sort((p, u) => (a[p.id].box || 0) - (a[u.id].box || 0))
        .slice(0, 2),
      c = l.filter((p) => !a[p.id]).slice(0, 7 - i.length - d.length);
    ((s = [...i, ...d, ...c]),
      s.length < 5 &&
        (s = s.concat(
          enEmb(l.filter((p) => !s.includes(p))).slice(0, 7 - s.length),
        )));
  }
  if (!s.length) return null;
  const n = [];
  s.forEach((i) => {
    const l = (a[i.id] || {}).box,
      d = !a[i.id];
    n.push(
      enPergunta(
        i,
        d
          ? "mc_en"
          : l >= 3
            ? enEmb(["montar", "lacuna", "falar"])[0]
            : enEmb(["mc_pt", "ouvir", "lacuna"])[0],
      ),
    );
  });
  const r = s.filter((i) => !a[i.id]);
  return (
    enEmb(r)
      .slice(0, Math.max(0, 10 - n.length))
      .forEach((i) =>
        n.push(enPergunta(i, enEmb(["lacuna", "ouvir", "mc_pt"])[0])),
      ),
    {
      modo: e,
      tema: t,
      Q: n,
      i: 0,
      res: [],
      xp: 0,
      sel: [],
      resp: null,
      fim: 0,
      ini: Date.now(),
    }
  );
}
function enInicia(e, t) {
  if (!EN.ok) {
    enCarrega();
    return;
  }
  const a = enLicao(e, t);
  if (!a) {
    toast(
      e === "rev" ? "Nada para revisar hoje. 🎉" : "Nada para estudar aqui.",
    );
    return;
  }
  ((EN.run = a),
    (ESV = "ing"),
    irPara("estudos"),
    scrollTo(0, 0),
    enAutoFala());
}
function enAutoFala() {
  const e = EN.run;
  if (!e || e.fim) return;
  const t = e.Q[e.i];
  t &&
    (t.tp === "ouvir" || t.tp === "mc_en") &&
    setTimeout(() => enFala((t.tp, t.it.en)), 250);
}
function enRepintarLicao() {
  const e = document.querySelector(
    "#app .dt397-native-mount .dt395-native-estudos",
  );
  if (tab === "estudos" && ESV === "ing" && e && EN.run) {
    const t = e.getBoundingClientRect().top,
      a = window.scrollY;
    e.innerHTML = enView();
    const o = e.getBoundingClientRect().top;
    Math.abs(o - t) > 1 &&
      window.scrollTo({ top: Math.max(0, a + o - t), behavior: "instant" });
    return;
  }
  render();
}
function enResponde(e) {
  const t = EN.run;
  if (!t || t.resp) return;
  const a = t.Q[t.i],
    o =
      a.tp === "montar"
        ? enNorm(e) === enNorm(a.ans)
        : a.tp === "falar"
          ? enParecido(e, a.ans)
          : e === a.ans;
  ((t.resp = { ok: o, val: e }),
    t.res.push({ it: a.it, ok: o, tp: a.tp }),
    enRegistra(a.it, o));
  const s = o ? 10 : 0;
  if (((t.xp += s), s && enXp(s), save(), enRepintarLicao(), o))
    try {
      navigator.vibrate && navigator.vibrate(15);
    } catch {}
}
function enProxima() {
  const e = EN.run;
  if (e) {
    if (((e.resp = null), (e.sel = []), e.i++, e.i >= e.Q.length)) {
      e.fim = 1;
      const t = 5 + (e.res.every((a) => a.ok) ? 10 : 0);
      ((e.xp += t), enXp(t), save());
    }
    (enRepintarLicao(), enAutoFala());
  }
}
const EN_SG = () =>
    '<div class="seg" style="margin:8px 0 10px"><button data-ep="esv" data-id="liv">📚 Livros</button><button data-ep="esv" data-id="pr">🧩 Prompts</button><button data-ep="esv" data-id="cnpi">🎓 CNPI-T</button><button data-ep="esv" data-id="pl">🗓️ Planos</button><button class="on" data-ep="esv" data-id="ing">🇺🇸 Inglês</button></div>',
  enSom = (e) =>
    "speechSynthesis" in window
      ? `<button class="enspk" data-enfala="${esc(e)}" aria-label="Ouvir">🔊</button>`
      : "";
function enHome() {
  const e = enS(),
    t = enHoje(),
    a = e.xp[t] || 0,
    o = +e.cfg.meta || 30,
    s = enSeq(),
    n = enNivel(),
    r = enDevidas().length,
    i = enDoDia(),
    l = enTemas(),
    d =
      l.find(([f]) => {
        const x = enProg(f);
        return x.apr < x.tot;
      }) || l[0],
    c = dshCor(),
    p = 26,
    u = 2 * Math.PI * p,
    m = Math.min(1, a / o);
  return `<h1>Estudos</h1>${EN_SG()}<div class="card enhero"><div class="enhr"><svg viewBox="0 0 64 64" width="72" height="72"><circle cx="32" cy="32" r="${p}" fill="none" stroke="${c.g}" stroke-opacity=".18" stroke-width="7"/>${m > 0 ? `<circle cx="32" cy="32" r="${p}" fill="none" stroke="${c.g}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(u * m).toFixed(1)} ${u.toFixed(1)}" transform="rotate(-90 32 32)"/>` : ""}<text x="32" y="30" font-size="14" font-weight="800" text-anchor="middle" fill="${c.tx}">${a}</text><text x="32" y="43" font-size="8.5" text-anchor="middle" fill="${c.mut}">de ${o} XP</text></svg>
<div style="flex:1"><div class="enst"><span>🔥 <b>${s}</b> dia${s === 1 ? "" : "s"}</span><span>⭐ nível <b>${n.n}</b></span><span>📚 <b>${enTodos().filter((f) => (e.r[f.id] || {}).box >= 2).length}</b> palavras</span></div><div class="enbar"><i style="width:${Math.round(n.f * 100)}%"></i></div><div class="sm mut">${a >= o ? "Meta de hoje batida. 🎉" : `Faltam ${o - a} XP para a meta de hoje.`}</div></div></div>
<button class="btn" data-enl="${d ? d[0] : ""}" style="width:100%;margin-top:12px;padding:14px;font-size:16px">${d ? d[2] + " Continuar: " + esc(d[1]) : "Começar"}</button>
<button class="btn s" data-enrev="1" style="width:100%;margin-top:8px"${r ? "" : " disabled"}>🔁 Revisar ${r} palavra${r === 1 ? "" : "s"} de hoje</button></div>
${i ? `<div class="card endia"><div class="top"><b class="sm">Palavra do dia</b>${enSom(i.en)}</div><div class="enw">${esc(i.en)}</div><div class="sm"><b>${esc(i.pt)}</b></div><div class="sm" style="margin-top:6px">“${esc(i.ex)}” ${enSom(i.ex)}</div><div class="sm mut">${esc(i.exPt)}</div></div>` : ""}
<h2>Trilha</h2><div class="entrilha">${l
    .map(([f, x, v], g) => {
      const h = enProg(f),
        b = h.tot ? h.apr / h.tot : 0;
      return `<button class="entema${d && d[0] === f ? " atual" : ""}" data-enl="${f}"><span class="enic">${v}</span><span class="entx"><b>${esc(x)}</b><small>${h.apr} de ${h.tot} aprendidas${h.vis > h.apr ? " · " + (h.vis - h.apr) + " em treino" : ""}</small><i class="enbar"><i style="width:${Math.round(b * 100)}%"></i></i></span><span class="ench">${b >= 1 ? "✅" : "›"}</span></button>`;
    })
    .join("")}</div>
<h2>Ajustes</h2><div class="card"><div class="sm" style="margin-bottom:6px">Meta diária</div><div class="seg">${[
    [20, "Leve · 20 XP"],
    [30, "Normal · 30"],
    [50, "Puxado · 50"],
    [100, "Intenso · 100"],
  ]
    .map(
      ([f, x]) =>
        `<button class="${o === f ? "on" : ""}" data-enmeta="${f}">${x}</button>`,
    )
    .join("")}</div>
<label class="ck" style="margin-top:10px"><input type="checkbox" data-encfg="voz"${e.cfg.voz ? " checked" : ""}${enRec() ? "" : " disabled"}><span>Exercícios de falar (microfone)${enRec() ? "" : " · este aparelho não reconhece voz no app"}</span></label>
<label class="sm" style="display:block;margin-top:8px">Velocidade da voz<select data-encfg="vel">${[
    [0.7, "Devagar"],
    [0.9, "Normal"],
    [1.05, "Rápida"],
  ]
    .map(
      ([f, x]) =>
        `<option value="${f}"${+e.cfg.vel === f ? " selected" : ""}>${x}</option>`,
    )
    .join("")}</select></label>
<div class="sm mut" style="margin-top:8px">Cada lição tem cerca de 10 perguntas (3 a 5 min). As palavras voltam em 1, 2, 4, 8, 16 e 32 dias conforme você acerta; quando erra, voltam no mesmo dia. 10 XP por acerto e bônus no fim.</div></div>`;
}
// ===== v606 — Mesa macro da aba Mercado (Mapa 12 termômetros, DIs + inclinação, Fed Watch, cesta emergente, barômetro EUA) =====
function cqCacheSalva606(aba) {
  try {
    const d = CQ.d[aba];
    if (!d || !Array.isArray(d.itens) || !d.itens.some((i) => i.px != null) || aba === "fav") return;
    const c = ls.get("diario-cq-cache606") || {};
    c[aba] = { ts: Date.now(), d };
    ls.set("diario-cq-cache606", c);
    CQ.cache606 && delete CQ.cache606[aba];
  } catch {}
}
{
  const e = cqCarrega;
  cqCarrega = async function (t) {
    const r = await e.apply(this, arguments);
    const aba = t || CQ.aba;
    CQ.errors[aba] || cqCacheSalva606(aba);
    return r;
  };
}
async function m606Carrega(forca) {
  if (M606.busy || (!forca && M606.v && Date.now() - M606.ts < 25e3)) return;
  if (window.DIARIO_DEMO) return;
  const a = cfg();
  if (!a) return;
  M606.busy = !0;
  let mudou = !1;
  try {
    const o = { "Content-Type": "application/json", apikey: a.key };
    try {
      typeof SESS < "u" && SESS && SESS.at && (o.Authorization = "Bearer " + SESS.at);
    } catch {}
    const s = await fetch(a.url + "/functions/v1/mesa-macro", { method: "POST", headers: o, body: "{}", signal: AbortSignal.timeout(25e3) }),
      n = await s.json().catch(() => ({}));
    if (!s.ok || n.versao !== "v606") throw new Error(n.error || "Erro " + s.status);
    ((M606.v = n), (M606.ts = Date.now()), (M606.err = ""), (M606.salvoEm = 0), (mudou = !0));
    ls.set("diario-m606", { ts: Date.now(), v: n });
  } catch (o) {
    const e = String(o.message || o);
    ((mudou = !M606.v && M606.err !== e), (M606.err = e), (M606.ts = Date.now()));
  }
  M606.busy = !1;
  mudou && m606Repinta();
}
function m606Repinta() {
  try {
    if (typeof tab > "u" || tab !== "mercado") return;
    MKT.tab === "cq" ? cqPinta() : MKT.tab === "lab" && render();
  } catch {}
}
function m606Hora(d) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: d, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return { w: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), m: +p.hour * 60 + +p.minute };
}
// Mercado aberto agora? Grade de horários de cada bolsa (feriados não entram: o horário do último preço confirma).
function m606Aberto(it) {
  const ut = (w) => w >= 1 && w <= 5;
  let ab = !1;
  if (it.ss === "24h") ab = !0;
  else if (it.ss === "b3") { const t = m606Hora("America/Sao_Paulo"); ab = ut(t.w) && t.m >= 540 && t.m < 1110; }
  else if (it.ss === "di" || it.ss === "brl") { const t = m606Hora("America/Sao_Paulo"); ab = ut(t.w) && t.m >= 540 && t.m < 1080; }
  else if (it.ss === "nyse") { const t = m606Hora("America/New_York"); ab = ut(t.w) && t.m >= 570 && t.m < 960; }
  else if (it.ss === "fx24") { const t = m606Hora("America/New_York"); ab = t.w === 6 ? !1 : t.w === 0 ? t.m >= 1080 : t.w === 5 ? t.m < 1020 : !(t.m >= 1020 && t.m < 1080); }
  else if (it.ss === "ice") { const t = m606Hora("Europe/London"); ab = ut(t.w) && t.m >= 60 && t.m < 1380; }
  else if (it.ss === "sgx") { const t = m606Hora("Asia/Singapore"); ab = (ut(t.w) && ((t.m >= 430 && t.m < 1200) || t.m >= 1245)) || (t.w >= 2 && t.w <= 6 && t.m < 315); }
  if (ab && it.ss !== "24h" && it.em && Date.now() - Date.parse(it.em) > 3 * 36e5 && !it.live) ab = !1;
  return ab;
}
const m606Sinal = (v, dp = 2, suf = "%") => (v == null || !isFinite(v) ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "") + cqNum(Math.abs(v), dp) + suf);
const m606Cls = (v) => (v == null ? "" : v > 0 ? "up" : v < 0 ? "dn" : "");
const m606Consulta = () => {
  const v = M606.v;
  if (!v) return "";
  const h = new Date(v.em).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  return M606.salvoEm && !M606.ts ? `salvo às ${h} · atualizando` : `consulta ${h} BRT`;
};
// Profit ao vivo (WIN, WDO e DIs) por cima do TradingView, igual à lista de cotações.
function m606Vivo(it) {
  try {
    const b = typeof bncQ === "function" && it.ss === "24h" ? bncQ(it.k) : null;
    if (b) return { px: b.px, d1: b.d1, live: !0, fechado: !1, bnc: !0 };
    const f = typeof fhAplica === "function" ? fhAplica(it.k, it.px, it.d1) : null;
    if (f) return { ...f, fechado: !1 };
  } catch {}
  try {
    const q = cqPf({ c: it.k, s: it.s }, /^(WIN|WDO)$/.test(it.k) ? "fut" : "jur");
    if (q && q.px > 0) return { px: q.px, d1: q.d1 != null ? q.d1 : it.d1, live: !!q.live, fechado: !!q.fechado };
  } catch {}
  return null;
}
function m606MapaHtml() {
  const v = M606.v;
  if (!v) return `<div class="market-state" role="status">${window.DIARIO_DEMO ? "Termômetros desativados no modo demonstrativo." : M606.err ? "Não foi possível consultar os termômetros agora." : "Consultando os 12 termômetros…"}</div>`;
  return `<div class="m606-mapa" role="list" aria-label="Termômetros do pregão">${v.mapa
    .map((it) => {
      const lv = m606Vivo(it), px = lv ? lv.px : it.px, d1 = lv ? lv.d1 : it.d1, ab = m606Aberto({ ...it, live: lv && lv.live });
      return `<div class="m606-t" role="listitem"><div class="m606-th"><b>${window.DiarioLogos ? DiarioLogos.html(it.k, 18) : ""}${esc(it.k)}</b><i class="m606-dot ${ab ? "on" : ""}" role="img" aria-label="${ab ? "Mercado aberto" : "Mercado fechado"}" title="${ab ? "Aberto agora" : "Fechado agora"}"></i></div><span class="m606-px">${px == null ? "–" : cqNum(px, it.dp) + (it.un === "%" ? "%" : "")}</span><span class="m606-v ${m606Cls(d1)}">${m606Sinal(d1)}</span><small>${esc(it.n)}${lv && lv.live ? " · Profit" : ""}</small></div>`;
    })
    .join("")}</div><p class="m606-src">● aberto agora · ● fechado (último preço) · TradingView, B3 com ~15 min de atraso; WIN, WDO e DIs pelo Profit quando a ponte está ligada · ${esc(m606Consulta())}</p>`;
}
function m606DiCurva(di) {
  const W = 340, H = 168, L = 10, R = 44, T = 12, B = 26;
  const pts = di.filter((x) => x.taxa != null);
  if (pts.length < 2) return "";
  const all = pts.flatMap((x) => [x.taxa, x.ant]).filter((x) => x != null),
    lo = Math.min(...all) - 0.08, hi = Math.max(...all) + 0.08,
    x0 = Math.min(...pts.map((p) => p.anos)), x1 = Math.max(...pts.map((p) => p.anos)),
    X = (a) => L + ((a - x0) / (x1 - x0 || 1)) * (W - L - R),
    Y = (t) => T + ((hi - t) / (hi - lo || 1)) * (H - T - B),
    linha = (k) => pts.filter((p) => p[k] != null).map((p, i) => (i ? "L" : "M") + X(p.anos).toFixed(1) + "," + Y(p[k]).toFixed(1)).join("");
  const ticks = [lo + 0.08, (lo + hi) / 2, hi - 0.08];
  return `<svg class="m606-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de DI hoje comparada ao fechamento anterior">${ticks
    .map((t) => `<line x1="${L}" x2="${W - R}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="#1E232E"/><text x="${W - R + 6}" y="${(Y(t) + 4).toFixed(1)}" fill="#8b919c" font-size="10">${cqNum(t, 2)}</text>`)
    .join("")}${pts.map((p) => `<text x="${X(p.anos).toFixed(1)}" y="${H - 8}" fill="#8b919c" font-size="10" text-anchor="middle">${esc(p.k.replace("DI1", ""))}</text>`).join("")}<path d="${linha("ant")}" fill="none" stroke="#8b919c" stroke-width="1.5" stroke-dasharray="4 3"/><path d="${linha("taxa")}" fill="none" stroke="#D4A017" stroke-width="2"/>${pts.map((p) => `<circle cx="${X(p.anos).toFixed(1)}" cy="${Y(p.taxa).toFixed(1)}" r="2.6" fill="#D4A017"/>`).join("")}</svg><div class="m606-leg"><span><i style="background:#D4A017"></i>Hoje</span><span><i class="tr"></i>Fechamento anterior (D-1)</span></div>`;
}
function m606DiHtml() {
  const v = M606.v;
  if (!v || !v.di) return "";
  const di = v.di.map((x) => {
    const lv = m606Vivo({ k: x.k, s: "BMFBOVESPA:" + x.k.replace(/(\d\d)$/, "20$1") });
    return lv && lv.live && x.ant != null ? { ...x, taxa: lv.px, bps: Math.round((lv.px - x.ant) * 1000) / 10, live: !0 } : x;
  });
  const inc = v.inclinacao, mes = (d) => ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+d.slice(5, 7) - 1] + "/" + d.slice(2, 4);
  const corpo = M606.di === "curva"
    ? m606DiCurva(di)
    : `<div class="m606-tab"><div class="m606-row m606-cab"><span>Vértice</span><span>Taxa</span><span>Dia</span></div>${di
        .map((x) => `<div class="m606-row"><span><b>${window.DiarioLogos ? DiarioLogos.html(x.k, 16) : ""}${esc(x.k)}</b> <small>${mes(x.venc)}${x.live ? " · Profit" : ""}</small></span><span class="n">${x.taxa == null ? "–" : cqNum(x.taxa, 3) + "%"}</span><span class="n ${m606Cls(x.bps)}">${x.bps == null ? "–" : (x.bps > 0 ? "+" : x.bps < 0 ? "−" : "") + cqNum(Math.abs(Math.round(x.bps)), 0)}</span></div>`)
        .join("")}<p class="m606-src">Variação do dia em pontos-base (bps): 1 bps = 0,01 ponto percentual.</p></div>`;
  return `<section class="m606-card" aria-label="DIs Brasil"><div class="m606-hd"><h3>DIs Brasil</h3><div class="m606-seg" role="group" aria-label="Visão dos DIs">${[["cot", "Cotações"], ["curva", "Curva"]].map(([k, t]) => `<button type="button" data-m606di="${k}" class="${M606.di === k ? "on" : ""}" aria-pressed="${M606.di === k}">${t}</button>`).join("")}</div></div>
<div class="m606-kpis"><div><small>Inclinação 2a–5a</small><b class="n">${inc ? m606Sinal(inc.hoje, 1, " bps") : "–"}</b></div><div><small>Variação do dia</small><b class="n ${inc ? m606Cls(inc.varBps) : ""}">${inc && inc.varBps != null ? m606Sinal(inc.varBps, 1, " bps") : "–"}</b></div></div>
${inc ? `<p class="m606-note">${inc.hoje >= 0 ? "Curva positivamente inclinada" : "Curva invertida"} entre 2 e 5 anos (${cqNum(inc.r2, 2)}% × ${cqNum(inc.r5, 2)}%, prazos interpolados); ${inc.varBps == null ? "" : inc.varBps < 0 ? "fechou (achatou) " + cqNum(Math.abs(inc.varBps), 1) + " bps no dia." : inc.varBps > 0 ? "abriu (inclinou) " + cqNum(inc.varBps, 1) + " bps no dia." : "sem mudança no dia."}</p>` : ""}
${corpo}<p class="m606-src">TradingView (B3, ~15 min de atraso) · ${esc(m606Consulta())}</p></section>`;
}
function m606FedHtml() {
  const f = M606.v && M606.v.fed;
  if (!f) return "";
  const fx = (a) => cqNum(a, 2), [p0, p1] = f.faixa;
  const rot = (mov) => {
    const a = p0 + mov / 100, b = p1 + mov / 100, faixa = `${fx(a)}–${fx(b)}%`;
    return mov === 0 ? `Manter ${faixa}` : `${mov < 0 ? "Cortar −" : "Subir +"}${Math.abs(mov)} bps · ${faixa}`;
  };
  const dia = f.reuniao.split("-").reverse().slice(0, 2).join("/");
  const lista = [-25, 0, 25].map((mov) => ({ mov, p: (f.cenarios.find((c) => c.mov === mov) || {}).p || 0 }))
    .concat(f.cenarios.filter((c) => ![-25, 0, 25].includes(c.mov)))
    .sort((a, b) => a.mov - b.mov);
  return `<section class="m606-card" aria-label="Fed Watch"><div class="m606-hd"><h3>Fed Watch</h3><small class="n">FOMC ${dia}</small></div>${lista
    .map((c) => `<div class="m606-fw"><span>${rot(c.mov)}</span><b class="n">${cqNum(c.p, 1)}%</b><i style="--p:${Math.max(2, Math.min(100, c.p))}%" class="${c.mov < 0 ? "dn" : c.mov > 0 ? "up" : ""}"></i></div>`)
    .join("")}<p class="m606-src">Faixa atual estimada pela taxa efetiva implícita (${cqNum(f.efetiva, 2)}%). Futuros de Fed Funds (CBOT ZQ) via TradingView, método CME FedWatch · ${esc(m606Consulta())}</p></section>`;
}
function m606EmHtml() {
  const e = M606.v && M606.v.emergentes;
  if (!e || e.media == null) return "";
  let brl = e.brl && e.brl.d1;
  try {
    const it = (CQ.d.fx?.itens || []).find((x) => x.s === "FX_IDC:USDBRL");
    it && it.d1 != null && (brl = it.d1);
  } catch {}
  const dif = brl == null ? null : brl - e.media;
  const txt = dif == null ? "" : dif > 0.15 ? "Real mais fraco que a cesta emergente hoje: pressão local no câmbio." : dif < -0.15 ? "Real mais forte que a cesta emergente hoje." : "Real em linha com os emergentes hoje.";
  return `<section class="m606-card" aria-label="Cesta emergente"><div class="m606-hd"><h3>Cesta emergente × USD/BRL</h3><small>variação do dia</small></div>
<div class="m606-kpis k3"><div><small>Média EM (${e.n})</small><b class="n ${m606Cls(e.media)}">${m606Sinal(e.media)}</b></div><div><small>USD/BRL</small><b class="n ${m606Cls(brl)}">${m606Sinal(brl)}</b></div><div><small>Diferença</small><b class="n">${dif == null ? "–" : m606Sinal(dif, 2, " pp")}</b></div></div>
<p class="m606-note">${txt}</p><div class="m606-em">${e.itens.map((x) => `<span><b>${window.DiarioLogos ? DiarioLogos.html(x.k, 16) : ""}${esc(x.k)}</b><em class="n ${m606Cls(x.d1)}">${m606Sinal(x.d1)}</em></span>`).join("")}</div><p class="m606-src">Média simples de USD/MXN, USD/CLP, USD/COP, USD/ZAR e USD/CNY. Alta = dólar mais forte. TradingView · ${esc(m606Consulta())}</p></section>`;
}
function m606BarHtml() {
  const b = M606.v && M606.v.barometro;
  if (!b) return `<section class="m606-card m606-bar"><div class="m606-hd"><h3>US Market Barometer</h3></div><div class="market-state" role="status">${window.DIARIO_DEMO ? "Barômetro desativado no modo demonstrativo." : M606.err ? "Não foi possível consultar os ETFs agora." : "Consultando os ETFs de referência…"}</div></section>`;
  const k = M606.bar === "m1" ? "m1" : "d1", c = b.celulas, val = (i, j) => c[i] && c[i][j] && c[i][j][k];
  const esc5 = k === "m1" ? 6 : 1.5;
  const cor = (v) => (v == null ? "#11141B" : `color-mix(in srgb,${v >= 0 ? "#10B981" : "#EF4444"} ${Math.round(14 + Math.min(1, Math.abs(v) / esc5) * 56)}%,#11141B)`);
  const gv = val(0, 2) != null && val(0, 0) != null ? val(0, 2) - val(0, 0) : null,
    sl = val(2, 1) != null && val(0, 1) != null ? val(2, 1) - val(0, 1) : null;
  const leit = [
    gv == null ? "" : `Large Growth − Value: <b class="n ${m606Cls(gv)}">${m606Sinal(gv, 2, " pp")}</b> → ${Math.abs(gv) < 0.25 ? "sem rotação clara entre estilos" : gv > 0 ? "capital indo para Growth (tecnologia)" : "capital indo para Value (setores defensivos/cíclicos)"}`,
    sl == null ? "" : `Small − Large (Core): <b class="n ${m606Cls(sl)}">${m606Sinal(sl, 2, " pp")}</b> → ${Math.abs(sl) < 0.25 ? "tamanho neutro" : sl > 0 ? "apetite por small caps" : "preferência por large caps"}`,
  ].filter(Boolean);
  return `<section class="m606-card m606-bar" aria-label="US Market Barometer"><div class="m606-hd"><h3>US Market Barometer</h3><div class="m606-seg" role="group" aria-label="Período">${[["d1", "Dia"], ["m1", "1 mês"]].map(([x, t]) => `<button type="button" data-m606bar="${x}" class="${k === x ? "on" : ""}" aria-pressed="${k === x}">${t}</button>`).join("")}</div></div>
<div class="m606-mx" role="table" aria-label="Matriz tamanho por estilo"><div role="row" class="m606-mxr"><span role="columnheader"></span>${b.colunas.map((x) => `<span role="columnheader" class="m606-mxh">${esc(x)}</span>`).join("")}</div>${b.linhas
    .map((ln, i) => `<div role="row" class="m606-mxr"><span role="rowheader" class="m606-mxh">${esc(ln)}</span>${[0, 1, 2].map((j) => { const x = c[i][j], v = x[k]; return `<span role="cell" class="m606-mxc" style="background:${cor(v)}"><small>${window.DiarioLogos ? DiarioLogos.html(x.tk, 14) : ""}${esc(x.tk)}</small><b class="n">${m606Sinal(v)}</b></span>`; }).join("")}</div>`)
    .join("")}</div>${leit.map((x) => `<p class="m606-note">${x}</p>`).join("")}<p class="m606-src">ETFs iShares: S&amp;P 500 (IVE/IVV/IVW), S&amp;P 400 (IJJ/IJH/IJK) e S&amp;P 600 (IJS/IJR/IJT). Verde = alta, vermelho = queda; cor mais forte = movimento maior. TradingView, ~15 min de atraso · ${esc(m606Consulta())}</p></section>`;
}
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("[data-m606di]");
  if (a) { ((M606.di = a.dataset.m606di), m606Repinta()); return; }
  const b = e.target.closest && e.target.closest("[data-m606bar]");
  if (b) { ((M606.bar = b.dataset.m606bar), m606Repinta()); return; }
  e.target.closest && e.target.closest("[data-cqr]") && (CQ.vis === "mapa" || ["jur", "fx"].includes(CQ.aba)) && m606Carrega(!0);
});
setInterval(() => {
  try {
    !document.hidden && tab === "mercado" && ((MKT.tab === "cq" && (CQ.vis === "mapa" || ["jur", "fx"].includes(CQ.aba))) || MKT.tab === "lab") && m606Carrega();
  } catch {}
}, 3e4);

/* =====================================================================================
   v623 — Parte 1: Binance ao vivo (WebSocket público, sem chave) — useBinanceTicker
   Stream combinado @miniTicker dos pares USDT do app. Preço = c; variação 24h = (c − o) / o.
   Reconecta sozinho (1 s, 2 s, 4 s… até 30 s) e desliga com a aba em segundo plano.
   ===================================================================================== */
const BNC_PARES = { BTC: "btcusdt", ETH: "ethusdt", SOL: "solusdt", XRP: "xrpusdt", BNB: "bnbusdt", DOGE: "dogeusdt", ADA: "adausdt", AVAX: "avaxusdt", LINK: "linkusdt", "BTC/BRL": "btcbrl", "USDT/BRL": "usdtbrl" };
const BNC_SYM = Object.fromEntries(Object.entries(BNC_PARES).map(([k, v]) => [v.toUpperCase(), k]));
const BNC_TAPE = { "BTC-USD": "BTC", "ETH-USD": "ETH", "SOL-USD": "SOL", "XRP-USD": "XRP" };
const BNC = { q: {}, ws: null, tent: 0, timer: null, porMim: !1, ultimo: 0, mudou: new Set(), pinta: null, subs: new Set() };
function bncLiga() {
  if (window.DIARIO_DEMO || document.hidden || (BNC.ws && BNC.ws.readyState < 2) || typeof WebSocket > "u") return;
  clearTimeout(BNC.timer);
  let ws;
  try {
    ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=" + Object.values(BNC_PARES).map((p) => p + "@miniTicker").join("/"));
  } catch {
    return bncAgenda();
  }
  ((BNC.ws = ws), (BNC.porMim = !1));
  ws.onopen = () => (BNC.tent = 0);
  ws.onmessage = (ev) => {
    let d;
    try {
      d = JSON.parse(ev.data).data;
    } catch {
      return;
    }
    const k = d && BNC_SYM[d.s];
    if (!k) return;
    const c = +d.c, o = +d.o;
    if (!(c > 0 && o > 0)) return;
    const ant = BNC.q[k];
    BNC.q[k] = { px: c, d1: ((c - o) / o) * 100, em: Date.now(), dir: ant ? Math.sign(c - ant.px) : 0 };
    BNC.ultimo = Date.now();
    (ant ? ant.px !== c : !0) && BNC.mudou.add(k);
    BNC.pinta || (BNC.pinta = setTimeout(bncPinta, 1200));
  };
  ws.onclose = () => {
    ((BNC.ws = null), BNC.porMim || bncAgenda());
  };
  ws.onerror = () => {
    try {
      ws.close();
    } catch {}
  };
}
function bncAgenda() {
  if (document.hidden) return;
  clearTimeout(BNC.timer);
  BNC.timer = setTimeout(bncLiga, Math.min(3e4, 1e3 * 2 ** BNC.tent++));
}
function bncDesliga() {
  ((BNC.porMim = !0), clearTimeout(BNC.timer));
  try {
    BNC.ws && BNC.ws.close();
  } catch {}
  BNC.ws = null;
}
const bncQ = (k) => {
  const q = BNC.q[String(k || "").toUpperCase()];
  return q && Date.now() - q.em < 9e4 ? q : null;
};
const bncAoVivo = () => Date.now() - BNC.ultimo < 15e3;
window.useBinanceTicker = Object.freeze({
  get: (k) => bncQ(k),
  aoVivo: bncAoVivo,
  pares: BNC_PARES,
  assinar: (fn) => (BNC.subs.add(fn), () => BNC.subs.delete(fn)),
});
document.addEventListener("visibilitychange", () => (document.hidden ? bncDesliga() : bncLiga()));
setTimeout(bncLiga, 2500);
/** Repinta em lote (no máximo a cada ~1,2 s): fita, lista Cripto, Mapa e Terminal; pisca o que mudou. */
function bncPinta() {
  BNC.pinta = null;
  const mud = new Map([...BNC.mudou].map((k) => [k, BNC.q[k] && BNC.q[k].dir]));
  BNC.mudou.clear();
  if (!mud.size) return;
  BNC.subs.forEach((fn) => {
    try {
      fn(BNC.q);
    } catch {}
  });
  try {
    window.tapeRedraw && window.tapeRedraw();
    for (const [s, k] of Object.entries(BNC_TAPE))
      mud.has(k) && document.querySelectorAll(`#tape .ti[data-s="${s}"]`).forEach((el) => bncPisca(el, mud.get(k)));
  } catch {}
  try {
    if (typeof tab > "u" || tab !== "mercado" || MKT.tab !== "cq" || document.hidden) return;
    const foco = document.activeElement;
    if (foco && foco.matches && foco.matches("select")) return;
    const v = CQ.vis === "mapa" || ["cri", "fav"].includes(CQ.aba) || m623Ativo();
    if (!v) return;
    cqPinta();
    const box = document.getElementById("cotbox");
    box &&
      box.querySelectorAll("[data-bnc]").forEach((el) => {
        const k = el.dataset.bnc;
        mud.has(k) && bncPisca(el, mud.get(k));
      });
  } catch {}
}
function bncPisca(el, dir) {
  el.classList.remove("bnc-up", "bnc-dn");
  void el.offsetWidth;
  el.classList.add(dir < 0 ? "bnc-dn" : "bnc-up");
}
// Fita superior: BTC/ETH/SOL/XRP pela Binance (o Profit continua nos tickers da B3).
{
  const antes = window.tapeVivo;
  window.tapeVivo = (s) => {
    const k = BNC_TAPE[s];
    if (k) {
      const q = bncQ(k);
      return q ? { px: q.px, chg: q.d1 } : null;
    }
    return antes ? antes(s) : null;
  };
}
const bncSelo = () =>
  `<span class="bnc-selo${bncAoVivo() ? " on" : ""}" title="Preço e variação de 24 h pelo WebSocket público da Binance (pares USDT)"><i aria-hidden="true"></i>Binance · ${bncAoVivo() ? "Tempo real" : "conectando…"}</span>`;

/* =====================================================================================
   v623 — Parte 2: Modo Terminal de 3 colunas, só no desktop (≥ 1024 px).
   No celular nada muda: o terminal nem é montado. Categorias e busca continuam no topo;
   buscar ou escolher uma categoria mostra a lista; o botão "Terminal" volta.
   ===================================================================================== */
const M623 = {
  modo: (() => {
    try {
      return ls.get("diario-m623-modo") || "terminal";
    } catch {
      return "terminal";
    }
  })(),
};
const m623Mq = window.matchMedia ? window.matchMedia("(min-width:1024px)") : null;
const m623Desk = () => !!(m623Mq && m623Mq.matches);
function m623Ativo() {
  // v624: no desktop abre sempre no Terminal; a lista aparece ao digitar na busca (ou no Mapa).
  return m623Desk() && !String(CQ.search || "").trim() && CQ.vis !== "mapa";
}
try {
  m623Mq &&
    m623Mq.addEventListener("change", () => {
      try {
        typeof tab < "u" && tab === "mercado" && MKT.tab === "cq" && cqPinta();
      } catch {}
    });
} catch {}
const M623_LOGO = { "FTSE 100": "UKX", "Nikkei 225": "N225", "Hang Seng": "HSI", Shanghai: "SHCOMP", "IBEX 35": "PAIS:ES", "CAC 40": "PAIS:FR", KOSPI: "PAIS:KR", DAX: "PAIS:DE", US2Y: "PAIS:US", US10Y: "PAIS:US", US30Y: "PAIS:US", DE10Y: "PAIS:DE", JP10Y: "PAIS:JP", MINERIO: "MINÉRIO DE FERRO", NG: "GÁS NATURAL", HQ: "QUAL", LV: "USMV", MO: "MTUM", YD: "DVY", YV: "VLUE" };
function m623Aberto(it) {
  if (it.tz) {
    const t = m606Hora(it.tz);
    return t.w >= 1 && t.w <= 5 && t.m >= it.ab && t.m < it.fe && !(it.em && Date.now() - Date.parse(it.em) > 3 * 36e5);
  }
  return m606Aberto({ ...it, ss: it.ss === "cme" ? "fx24" : it.ss });
}
const m623Hms = (iso) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–");
function m623Linha(it) {
  let px = it.px, d1 = it.d1, em = it.em, vivo = "", ab;
  if (it.g === "cri") {
    const q = bncQ(it.k);
    q && ((px = q.px), (d1 = q.d1), (em = new Date(q.em).toISOString()), (vivo = "bnc"));
  } else if (it.g === "fut" && /^(WIN|WDO)$/.test(it.k)) {
    const q = m606Vivo({ k: it.k, s: it.s });
    q && ((px = q.px), (d1 = q.d1), q.live && ((vivo = "profit"), (em = new Date().toISOString())));
  } else if (typeof fhAplica === "function") {
    const f = fhAplica(it.k, it.px, it.d1);
    f && ((px = f.px), (d1 = f.d1), (em = f.em), (vivo = "fh"));
  }
  ab = vivo ? !0 : m623Aberto({ ...it, em });
  const juro = it.un === "%",
    varTxt = juro && it.dabs != null && !vivo ? m606Sinal(it.dabs * 100, 1, " bps") : m606Sinal(d1),
    varCls = m606Cls(juro && it.dabs != null && !vivo ? it.dabs : d1),
    chave = M623_LOGO[it.k] || it.k,
    logo = window.DiarioLogos ? DiarioLogos.html(chave, 16) : "";
  return `<div class="m623-r"${vivo === "bnc" ? ` data-bnc="${esc(it.k)}"` : vivo === "fh" ? ` data-fh="${esc(fhSym(it.k))}"` : ""} role="row" tabindex="0" data-tv="${esc(m624Tv(it))}" data-nome="${esc(it.k + (it.n ? " · " + it.n : ""))}" title="Abrir gráfico"><span class="m623-n" role="cell">${logo}<b>${esc(it.k)}</b><small>${esc(it.n || "")}</small></span><span class="m623-v" role="cell"><b class="m623-px">${px == null ? "–" : cqNum(px, it.dp ?? 2) + (juro ? "%" : "")}</b><span class="m623-d ${varCls}">${varTxt}</span><time>${vivo === "profit" ? "Profit" : m623Hms(em)}</time><i class="m623-dot ${ab ? "on" : ""}" role="img" aria-label="${ab ? "Mercado aberto" : "Mercado fechado"}"></i></span></div>`;
}
function m623Bloco(tit, itens, extra = "") {
  return `<section class="m623-sec"><header><h3>${tit}</h3>${extra}</header><div class="m623-tb" role="table">${itens.length ? itens.map(m623Linha).join("") : '<div class="market-state" role="status">Consultando…</div>'}</div></section>`;
}
function m623Noticias() {
  try {
    !MKT.items && !MKT.busy && typeof SESS < "u" && SESS && setTimeout(() => mkLoad().then(() => m623Ativo() && cqPinta()), 0);
  } catch {}
  const L = (MKT.items || []).slice(0, 8);
  return `<section class="m623-sec"><header><h3>Notícias</h3><button type="button" class="m623-lk" data-m623-nt>Ver todas</button></header><div class="m623-news">${
    L.length
      ? L.map((n) => `<a href="${esc(urlSegura(n.l))}" target="_blank" rel="noopener noreferrer"><time>${n.d ? new Date(n.d).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) : ""}</time><span>${esc(n.t || "")}</span></a>`).join("")
      : `<div class="market-state" role="status">${MKT.err ? esc(MKT.err) : "Carregando manchetes…"}</div>`
  }</div></section>`;
}
function m623Fatores() {
  const F = ((M606.v && M606.v.terminal) || []).filter((x) => x.g === "fat");
  if (!F.length) return "";
  F.forEach((x) => { const f = fhAplica(M623_LOGO[x.k], x.px, x.d1); f && ((x.d1 = f.d1), (x.fh = 1)); });
  return `<div class="m623-fat" role="list" aria-label="Fatores">${F.map((x) => `<span role="listitem" tabindex="0" data-tv="${esc(M623_LOGO[x.k] || x.k)}" data-nome="${esc(x.n)}"${x.fh ? ` data-fh="${esc(M623_LOGO[x.k])}"` : ""} style="background:${x.d1 == null ? "#11141B" : `color-mix(in srgb,${x.d1 >= 0 ? "#10B981" : "#EF4444"} ${Math.round(14 + Math.min(1, Math.abs(x.d1) / 1.5) * 56)}%,#11141B)`}" title="${esc(x.n)}"><b>${esc(x.k)}</b><em class="n">${m606Sinal(x.d1)}</em></span>`).join("")}</div><p class="m606-src">Fatores iShares: HQ qualidade (QUAL), LV baixa volatilidade (USMV), MO momento (MTUM), YD dividendos (DVY), YV valor (VLUE).</p>`;
}
function m623Html() {
  try {
    m606Carrega();
  } catch {}
  const T = (M606.v && M606.v.terminal) || [],
    g = (x) => T.filter((i) => i.g === x);
  const T0 = M606.v && M606.v.terminal;
  T0 && (M606.v.terminal = T0.map((x) => ({ ...x }))); // cópia: os fatores recebem o preço da Finnhub sem mexer no dado salvo
  let bar;
  const b0 = M606.v && M606.v.barometro;
  try {
    b0 && (M606.v.barometro = { ...b0, celulas: b0.celulas.map((l) => l.map((x) => { const f = fhAplica(x.tk, x.px, x.d1); return f ? { ...x, d1: f.d1 } : x; })) });
    bar = m606BarHtml().replace("</section>", m623Fatores() + "</section>");
  } finally {
    b0 && (M606.v.barometro = b0);
    T0 && (M606.v.terminal = T0);
  }
  const monBar = M624.mon ? `<div class="m624-monbar"><b>Monitor de pregão</b>${bncSelo()}${fhSelo()}<span class="m624-hora">${m623Hms(new Date().toISOString())} BRT</span><button type="button" data-m624-mon>Sair do Modo Monitor <kbd>Esc</kbd></button></div>` : "";
  return `<div class="m623-term${M624.mon ? " m624-on" : ""}" role="region" aria-label="Terminal de mercado">${monBar}
<div class="m623-col">${m623Bloco("Índices Europa e Ásia", g("idx"))}${m606DiHtml()}${m623Noticias()}</div>
<div class="m623-col">${m623Bloco("Moedas", g("fx"), fhSelo())}${m623Bloco("Emergentes", g("em"), fhSelo())}${bar}</div>
<div class="m623-col">${m623Bloco("Commodities", g("cmd"))}${m623Bloco("Futuros", g("fut"), fhSelo())}${m623Bloco("Treasuries e juros globais", g("tsy"))}${m623Bloco("Cripto ao vivo", g("cri"), bncSelo())}</div>
</div><p class="m623-src">TradingView (screener público; B3 com ~15 min de atraso) · WIN e WDO pelo Profit quando a ponte está ligada · EUA, ADRs e moedas pela Finnhub ao vivo (TradingView fora do pregão) · Cripto pela Binance em tempo real · clique num ativo para abrir o gráfico · <i class="m623-dot on"></i> aberto · <i class="m623-dot"></i> fechado${M606.v && M606.v.em ? ' · ' + esc(m606Consulta()) : ''}</p>`;
}
document.addEventListener(
  "click",
  (e) => {
    const t = e.target.closest && e.target.closest("[data-cqa],[data-m623-modo],[data-m623-nt]");
    if (!t) return;
    if (t.matches("[data-m623-nt]")) {
      e.preventDefault();
      try {
        ((MKT.tab = "nt"), render());
      } catch {}
      return;
    }
    if (t.matches("[data-m623-modo]")) {
      e.preventDefault();
      M623.modo = t.dataset.m623Modo === "lista" ? "lista" : "terminal";
      try {
        ls.set("diario-m623-modo", M623.modo);
      } catch {}
      cqPinta();
      return;
    }
    // Escolher uma categoria no desktop mostra a lista dela (o botão "Terminal" volta).
    m623Desk() && M623.modo === "terminal" && ((M623.modo = "lista"), (() => { try { ls.set("diario-m623-modo", "lista"); } catch {} })());
  },
  !0,
);
setInterval(() => {
  try {
    !document.hidden && typeof tab < "u" && tab === "mercado" && MKT.tab === "cq" && m623Ativo() && m606Carrega();
  } catch {}
}, 3e4);

/* =====================================================================================
   v624 — useFinnhubTicker: EUA, ADRs e moedas ao vivo pela Finnhub, com cascata
   WebSocket → REST /quote (20 s) → TradingView. A chave vem do servidor (secret/Vault
   FINNHUB_API_KEY, entregue só a quem está logado) ou da chave que você já salvou no Terminal.
   Fora do pregão de NY (ações/ETFs) os dados continuam sendo os do TradingView.
   ===================================================================================== */
const FH_ACOES = ["EWZ", "SPY", "QQQ", "DIA", "IAU", "IVV", "AAPL", "MSFT", "NVDA", "AMZN", "META", "TSLA", "GOOGL", "PBR", "VALE", "ITUB", "BBD", "ABEV", "QUAL", "USMV", "MTUM", "DVY", "VLUE", "IVE", "IVW", "IJJ", "IJH", "IJK", "IJS", "IJR", "IJT"];
const FH_FX = ["USD/BRL", "EUR/USD", "USD/JPY", "GBP/USD", "USD/MXN", "USD/ZAR", "USD/CNY"];
const FH_SUBS = [...FH_ACOES, ...FH_FX.map((x) => "OANDA:" + x.replace("/", "_"))].slice(0, 40);
const FH_TAPE = { "BRL=X": "USD/BRL", EWZ: "EWZ" };
const FH = { q: {}, pc: {}, ws: null, compart: null, modo: "off", k: "", tok: null, tokEm: 0, tent: 0, falhas: 0, timer: null, rest: null, restI: 0, volta: null, ultimo: 0, recusa: 0, porMim: 0, liga: 0, mudou: new Set(), pinta: null };
function fhSym(c) {
  c = String(c || "").toUpperCase().replace(/^(AMEX|NYSE|NASDAQ|CBOE|BATS|ARCA|NYSEARCA|FX|FX_IDC|OANDA):/, "");
  if (c === "BRL=X") c = "USD/BRL";
  const f = c.replace(/[^A-Z]/g, "");
  if (f.length === 6 && !/\d/.test(c)) {
    const p = f.slice(0, 3) + "/" + f.slice(3);
    if (FH_FX.includes(p)) return "OANDA:" + p.replace("/", "_");
  }
  return FH_ACOES.includes(c) ? c : null;
}
const fhEhFx = (s) => s.startsWith("OANDA:");
const fhAberto = (s) => (fhEhFx(s) ? m606Aberto({ ss: "fx24" }) : m606Aberto({ ss: "nyse" }));
function fhQ(code) {
  const s = fhSym(code), q = s && FH.q[s];
  if (!q || !fhAberto(s)) return null;
  return Date.now() - q.em < (fhEhFx(s) ? 3e5 : 12e5) ? q : null;
}
/** Preço Finnhub com a variação do dia: fechamento anterior da própria Finnhub (REST) ou o implícito no TradingView. */
function fhAplica(code, tvPx, tvD1) {
  const q = fhQ(code);
  if (!q) return null;
  const pc = FH.pc[q.s] > 0 ? FH.pc[q.s] : tvPx > 0 && tvD1 != null && isFinite(tvD1) ? tvPx / (1 + tvD1 / 100) : null;
  return { px: q.px, d1: pc ? ((q.px - pc) / pc) * 100 : tvD1 != null ? tvD1 : null, em: new Date(q.em).toISOString(), live: !0, fh: !0 };
}
async function fhChave() {
  if (FH.tok === null || Date.now() - FH.tokEm > 6e5) {
    let tok = "";
    try {
      const a = typeof cfg === "function" ? cfg() : null;
      if (a && typeof SESS < "u" && SESS && SESS.at) {
        const r = await fetch(a.url + "/functions/v1/finnhub-token", { method: "POST", headers: { "Content-Type": "application/json", apikey: a.key, Authorization: "Bearer " + SESS.at }, body: "{}", signal: AbortSignal.timeout(1e4) });
        tok = r.ok ? String((await r.json()).token || "") : "";
      }
    } catch {}
    ((FH.tok = tok), (FH.tokEm = tok ? Date.now() : Date.now() - 57e4), (window.fhTokServidor = tok)); // sem login ainda: tenta de novo em 30 s
    // v625: o Terminal também passa a usar a chave do servidor (não depende mais do campo colado).
    try {
      tok && window.TR && !window.TR.fh && (window.TR.fhWanted || []).length && window.TRM && window.TRM.trFinnhub(window.TR.fhWanted);
    } catch {}
  }
  if (FH.tok) return FH.tok;
  try {
    return String((S.ax && S.ax.term && S.ax.term.fh) || "").trim();
  } catch {
    return "";
  }
}
function fhGuarda(s, px, pc) {
  if (!(px > 0) || !FH_SUBS.includes(s)) return;
  const ant = FH.q[s];
  FH.q[s] = { s, px, em: Date.now(), dir: ant ? Math.sign(px - ant.px) : 0 };
  pc > 0 && (FH.pc[s] = pc);
  FH.ultimo = Date.now();
  (!ant || ant.px !== px) && FH.mudou.add(s);
  FH.pinta || (FH.pinta = setTimeout(fhPinta, 1500));
}
function fhMsg(ev) {
  let d;
  try {
    d = JSON.parse(ev.data);
  } catch {
    return;
  }
  if (!d) return;
  if (d.type === "trade") return void (d.data || []).forEach((t) => fhGuarda(t.s, +t.p));
  if (d.type === "error" && ev.target === FH.ws) {
    if (/api.?key|token|unauthor|authentication|invalid/i.test(d.msg || "")) ((FH.recusa = 1), (FH.modo = "tv"), fhFecha());
    else fhRest(); // limite de conexões/assinaturas: segue pela consulta REST
  }
}
function fhFecha() {
  FH.porMim = 1;
  clearTimeout(FH.timer);
  try {
    FH.ws && FH.ws.close();
  } catch {}
  FH.ws = null;
}
function fhAgenda() {
  if (document.hidden) return;
  clearTimeout(FH.timer);
  FH.timer = setTimeout(fhLiga, Math.min(6e4, 2e3 * 2 ** Math.min(5, FH.tent++)));
}
/** O Terminal já tem um WebSocket da Finnhub com a mesma chave? Usa o dele (a Finnhub limita conexões por chave). */
function fhCompart(t) {
  FH.modo = "ws";
  if (FH.compart === t) return;
  FH.compart = t;
  t.addEventListener("message", fhMsg);
  t.addEventListener("close", () => {
    FH.compart === t && ((FH.compart = null), (FH.modo = "off"), fhAgenda());
  });
  try {
    FH_SUBS.forEach((s) => t.send(JSON.stringify({ type: "subscribe", symbol: s })));
  } catch {}
}
function fhLiga() {
  if (window.DIARIO_DEMO || document.hidden || FH.recusa || FH.liga || typeof WebSocket > "u") return;
  FH.liga = 1;
  fhChave().then(
    (k) => {
      FH.liga = 0;
      if (!k) return void ((FH.modo = "tv"), clearTimeout(FH.timer), (FH.timer = setTimeout(fhLiga, 3e4)));
      FH.k = k;
      const tr = window.TR && window.TR.fh;
      if (tr && tr.readyState === 1 && window.TR.fhKey === k) return (fhFecha(), fhCompart(tr));
      if (FH.modo === "rest") return fhRest();
      if (FH.ws && FH.ws.readyState < 2) return;
      let ws;
      try {
        ws = new WebSocket("wss://ws.finnhub.io?token=" + encodeURIComponent(k));
      } catch {
        return fhRest();
      }
      const t0 = Date.now();
      ((FH.ws = ws), (FH.porMim = 0));
      ws.onopen = () => {
        FH.modo = "ws";
        FH.tent = 0;
        FH_SUBS.forEach((s) => ws.send(JSON.stringify({ type: "subscribe", symbol: s })));
      };
      ws.onmessage = fhMsg;
      ws.onclose = () => {
        if (FH.ws === ws) FH.ws = null;
        if (FH.porMim) return;
        FH.modo === "ws" && (FH.modo = "off");
        // Caiu logo após abrir duas vezes seguidas = limite de conexão simultânea → REST /quote.
        FH.falhas = Date.now() - t0 < 15e3 ? FH.falhas + 1 : 0;
        FH.falhas >= 2 ? fhRest() : fhAgenda();
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    },
    () => (FH.liga = 0),
  );
}
function fhRest() {
  fhFecha();
  FH.modo = "rest";
  if (FH.rest || !FH.k || document.hidden) return;
  const tick = async () => {
    if (document.hidden || !FH.k || !m606Aberto({ ss: "nyse" })) return;
    for (let i = 0; i < 12; i++) {
      const s = FH_ACOES[FH.restI++ % FH_ACOES.length];
      try {
        const r = await fetch("https://finnhub.io/api/v1/quote?symbol=" + encodeURIComponent(s) + "&token=" + encodeURIComponent(FH.k), { signal: AbortSignal.timeout(8e3) });
        if (r.status === 429) break;
        if (r.status === 401 || r.status === 403) return void ((FH.recusa = 1), (FH.modo = "tv"), fhRestPara());
        const j = await r.json();
        fhGuarda(s, +j.c, +j.pc);
      } catch {}
    }
  };
  tick();
  FH.rest = setInterval(tick, 2e4);
  // De 5 em 5 minutos tenta o WebSocket de novo (o terminal pode ter fechado o dele).
  clearTimeout(FH.volta);
  FH.volta = setTimeout(() => {
    (fhRestPara(), (FH.falhas = 0), (FH.modo = "off"), fhLiga());
  }, 3e5);
}
function fhRestPara() {
  (clearInterval(FH.rest), (FH.rest = null), clearTimeout(FH.volta));
}
window.useFinnhubTicker = Object.freeze({
  get: (k) => fhQ(k),
  aplica: fhAplica,
  modo: () => FH.modo,
  simbolos: FH_SUBS,
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return void (fhFecha(), fhRestPara());
  FH.modo === "rest" ? fhRest() : fhLiga();
});
setTimeout(fhLiga, 3500);
// Se o Terminal abrir o socket dele, cedemos a conexão e passamos a ouvir o dele.
setInterval(() => {
  try {
    const tr = window.TR && window.TR.fh;
    if (!document.hidden && tr && tr.readyState === 1 && FH.compart !== tr && window.TR.fhKey === FH.k) (fhRestPara(), fhFecha(), fhCompart(tr));
  } catch {}
}, 5e3);
const fhVivo = () => (FH.modo === "ws" || FH.modo === "rest") && Date.now() - FH.ultimo < 12e4 && (m606Aberto({ ss: "nyse" }) || m606Aberto({ ss: "fx24" }));
const fhSelo = () => {
  const v = fhVivo();
  return `<span class="bnc-selo fh-selo${v ? " on" : ""}" title="EUA, ADRs e moedas pela Finnhub; fora do pregão ou sem conexão, TradingView"><i aria-hidden="true"></i>${v ? (FH.modo === "rest" ? "Finnhub · a cada 20 s" : "Finnhub · Tempo real") : "TradingView"}</span>`;
};
// Fita superior: USD/BRL e EWZ pela Finnhub (Binance e Profit seguem nos deles).
{
  const antes = window.tapeVivo;
  window.tapeVivo = (s) => {
    if (FH_TAPE[s]) {
      const base = (window.tapeDados && window.tapeDados()[s]) || {};
      const f = fhAplica(FH_TAPE[s], base.px, base.chg);
      if (f) return { px: f.px, chg: f.d1 };
    }
    return antes ? antes(s) : null;
  };
}
function fhPinta() {
  FH.pinta = null;
  const mud = new Map([...FH.mudou].map((s) => [s, FH.q[s] && FH.q[s].dir]));
  FH.mudou.clear();
  if (!mud.size) return;
  try {
    window.tapeRedraw && window.tapeRedraw();
    for (const [t, c] of Object.entries(FH_TAPE)) {
      const s = fhSym(c);
      mud.has(s) && document.querySelectorAll(`#tape .ti[data-s="${t}"]`).forEach((el) => bncPisca(el, mud.get(s)));
    }
  } catch {}
  try {
    if (typeof tab > "u" || tab !== "mercado" || MKT.tab !== "cq" || document.hidden) return;
    const foco = document.activeElement;
    if (foco && foco.matches && foco.matches("select")) return;
    if (!(CQ.vis === "mapa" || ["us", "adr", "fx", "fav"].includes(CQ.aba) || m623Ativo())) return;
    cqPinta();
    document.querySelectorAll("#cotbox [data-fh]").forEach((el) => {
      const s = el.dataset.fh;
      mud.has(s) && bncPisca(el, mud.get(s));
    });
  } catch {}
}

/* =====================================================================================
   v624 — Desktop: gaveta com gráfico TradingView, Ctrl/Cmd + K e Modo Monitor.
   ===================================================================================== */
const M624 = { mon: !1, pal: null, sel: 0, lista: [] };
const m624Tv = (it) => {
  const s = Array.isArray(it.s) ? it.s[0] : it.s;
  if (it.g === "cri") return "BINANCE:" + it.k + "USDT";
  return s || it.k;
};
function m624Grafico(tv, nome) {
  m624FechaGrafico();
  const d = document.createElement("div");
  d.id = "m624-drawer";
  d.innerHTML = `<div class="m624-bk" data-m624-fecha></div><aside class="m624-sheet" role="dialog" aria-modal="true" aria-label="Gráfico de ${esc(nome || tv)}"><header><div><b>${esc(nome || tv)}</b><small>${esc(tv)}</small></div><button type="button" data-m624-fecha aria-label="Fechar gráfico">✕</button></header><div class="m624-chart"><div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div></div></aside>`;
  document.body.appendChild(d);
  const sc = document.createElement("script");
  sc.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  sc.async = !0;
  sc.innerHTML = JSON.stringify({ autosize: !0, symbol: tv, interval: "15", timezone: "America/Sao_Paulo", theme: "dark", style: "1", locale: "br", backgroundColor: "#0A0C10", gridColor: "rgba(30,35,46,0.6)", allow_symbol_change: !0, withdateranges: !0, hide_side_toolbar: !1, save_image: !1, calendar: !1, support_host: "https://www.tradingview.com" });
  d.querySelector(".tradingview-widget-container").appendChild(sc);
  d.querySelector("header button").focus({ preventScroll: !0 });
}
function m624FechaGrafico() {
  const d = document.getElementById("m624-drawer");
  return d ? (d.remove(), !0) : !1;
}
function m624Monitor(on) {
  M624.mon = !!on && m623Desk();
  document.body.classList.toggle("m624-mon", M624.mon);
  try {
    cqPinta();
  } catch {}
}
/** Símbolo TradingView de um elemento clicado no Terminal (linhas, DIs, barômetro e fatores). */
function m624TvDe(el) {
  const r = el.closest("[data-tv]");
  if (r) return [r.dataset.tv, r.dataset.nome || r.dataset.tv];
  const di = el.closest(".m606-row:not(.m606-cab)");
  if (di) {
    const k = (di.querySelector("b") || {}).textContent || "";
    const m = /DI1([FGHJKMNQUVXZ])(\d\d)/.exec(k);
    if (m) return ["BMFBOVESPA:DI1" + m[1] + "20" + m[2], k.trim()];
  }
  const c = el.closest(".m606-mxc");
  if (c) {
    const tk = ((c.querySelector("small") || {}).textContent || "").trim();
    if (tk) return ["AMEX:" + tk, tk];
  }
  return null;
}
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t || !t.closest) return;
  if (t.closest("[data-m624-fecha]")) return void m624FechaGrafico();
  if (t.closest("[data-m624-mon]")) return void m624Monitor(!M624.mon);
  if (t.closest("[data-m624-k]")) return void m624Paleta();
  if (t.closest("#m624-pal .m624-pbk")) return void m624FechaPaleta();
  const op = t.closest("[data-m624-op]");
  if (op) return void m624Executa(+op.dataset.m624Op);
  if (!m623Desk() || !t.closest(".m623-term") || t.closest("a,button,input,select")) return;
  const x = m624TvDe(t);
  x && m624Grafico(x[0], x[1]);
});

/* Ctrl/Cmd + K: abas, gráfico de qualquer ativo e comandos da aba Análises. */
const M624_CMD = /^(ANALISE|ANÁLISE|RESULTADO|T[ÉE]CNICO|COMPARE|CARTEIRA|AGENDA|MODO PROVA|EXPLIQUE)\b/i;
function m624Ativos() {
  const v = new Map();
  ((M606.v && M606.v.terminal) || []).forEach((it) => v.set(it.k, { k: it.k, n: it.n, tv: m624Tv(it) }));
  try {
    Object.values(CQ.d || {}).forEach((d) => ((d && d.itens) || []).forEach((it) => it.c && !v.has(it.c) && v.set(it.c, { k: it.c, n: it.n, tv: it.s || it.c })));
  } catch {}
  FH_ACOES.forEach((k) => v.has(k) || v.set(k, { k, n: "EUA", tv: k }));
  return [...v.values()];
}
function m624Abas() {
  const seen = new Set();
  return [...document.querySelectorAll("#org-side [data-org-rota]")]
    .map((b) => ({ r: b.dataset.orgRota, n: (b.textContent || b.title || "").trim() }))
    .filter((x) => x.r && x.n && !seen.has(x.r) && seen.add(x.r));
}
function m624Monta(q) {
  const nq = String(q || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const L = [];
  if (M624_CMD.test(q.trim())) L.push({ t: "cmd", rot: q.trim().toUpperCase(), sub: "Executar na aba Análises" });
  const nm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  m624Abas()
    .filter((a) => !nq || nm(a.n).includes(nq))
    .forEach((a) => L.push({ t: "aba", rot: a.n, sub: "Ir para a aba", r: a.r }));
  if (nq)
    m624Ativos()
      .filter((a) => nm(a.k + " " + a.n).includes(nq))
      .sort((a, b) => (nm(a.k).startsWith(nq) ? 0 : 1) - (nm(b.k).startsWith(nq) ? 0 : 1))
      .slice(0, 8)
      .forEach((a) => L.push({ t: "ativo", rot: a.k, sub: (a.n ? a.n + " · " : "") + "Abrir gráfico", a }));
  if (nq && !M624_CMD.test(q.trim()) && /^[A-Z0-9]{4,6}$/i.test(q.trim())) L.push({ t: "cmd", rot: "ANALISE " + q.trim().toUpperCase(), sub: "Executar na aba Análises" });
  return L.slice(0, 14);
}
function m624PintaPaleta() {
  const p = document.getElementById("m624-pal");
  if (!p) return;
  const inp = p.querySelector("input");
  M624.lista = m624Monta(inp.value);
  M624.sel = Math.min(M624.sel, Math.max(0, M624.lista.length - 1));
  p.querySelector(".m624-pl").innerHTML = M624.lista.length
    ? M624.lista
        .map((x, i) => `<button type="button" role="option" id="m624-o${i}" aria-selected="${i === M624.sel}" class="${i === M624.sel ? "on" : ""}" data-m624-op="${i}"><span class="m624-pt">${x.t === "aba" ? "Aba" : x.t === "ativo" ? "Ativo" : "Comando"}</span>${x.t === "ativo" && window.DiarioLogos ? DiarioLogos.html(x.rot, 16) : ""}<b>${esc(x.rot)}</b><small>${esc(x.sub)}</small></button>`)
        .join("")
    : '<p class="m624-pv">Nada encontrado. Tente um ticker (PETR4, AAPL) ou um comando (ANALISE PETR4).</p>';
  inp.setAttribute("aria-activedescendant", M624.lista.length ? "m624-o" + M624.sel : "");
}
function m624Paleta() {
  if (document.getElementById("m624-pal")) return;
  const d = document.createElement("div");
  d.id = "m624-pal";
  d.innerHTML = `<div class="m624-pbk"></div><div class="m624-pbox" role="dialog" aria-modal="true" aria-label="Busca rápida"><input type="text" role="combobox" aria-expanded="true" aria-controls="m624-pl" aria-label="Buscar aba, ativo ou comando" placeholder="Aba, ativo ou comando (ex.: ANALISE PETR4)" autocomplete="off" spellcheck="false"><div class="m624-pl" id="m624-pl" role="listbox"></div><p class="m624-pdica"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir · <kbd>Esc</kbd> fechar</p></div>`;
  document.body.appendChild(d);
  const inp = d.querySelector("input");
  M624.sel = 0;
  inp.addEventListener("input", () => ((M624.sel = 0), m624PintaPaleta()));
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = M624.lista.length;
      n && ((M624.sel = (M624.sel + (e.key === "ArrowDown" ? 1 : n - 1)) % n), m624PintaPaleta());
    } else if (e.key === "Enter") (e.preventDefault(), m624Executa(M624.sel));
  });
  m624PintaPaleta();
  inp.focus();
}
function m624FechaPaleta() {
  const p = document.getElementById("m624-pal");
  return p ? (p.remove(), !0) : !1;
}
function m624Vai(r) {
  const b = document.querySelector(`#org-side [data-org-rota="${CSS.escape(r)}"]`);
  b ? b.click() : irPara(r);
}
function m624Executa(i) {
  const x = M624.lista[i];
  if (!x) return;
  m624FechaPaleta();
  if (x.t === "aba") return m624Vai(x.r);
  if (x.t === "ativo") {
    if (m623Desk()) return m624Grafico(x.a.tv, x.a.k + (x.a.n ? " · " + x.a.n : ""));
    ((CQ.search = x.a.k), irPara("mercado:cq"));
    return;
  }
  m624Monitor(!1);
  m624Vai("analises");
  let n = 0;
  const tenta = () => {
    const inp = document.getElementById("an-command"), f = document.getElementById("an-form");
    if (!inp || !f) return void (++n < 30 && setTimeout(tenta, 100));
    inp.value = x.rot;
    inp.dispatchEvent(new Event("input", { bubbles: !0 }));
    f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { bubbles: !0, cancelable: !0 }));
  };
  setTimeout(tenta, 50);
}
// Na janela (fase de captura) para valer antes das buscas antigas; na aba Terminal o Ctrl+K continua indo para a linha de comando dele.
window.addEventListener(
  "keydown",
  (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === "k") {
      if (typeof tab < "u" && tab === "term" && !document.getElementById("m624-pal")) return;
      (e.preventDefault(), e.stopImmediatePropagation());
      return void (m624FechaPaleta() || m624Paleta());
    }
    if (e.key !== "Escape") return;
    if (m624FechaPaleta() || m624FechaGrafico()) return void (e.preventDefault(), e.stopImmediatePropagation());
    if (M624.mon) (e.preventDefault(), e.stopImmediatePropagation(), m624Monitor(!1));
  },
  !0,
);
document.addEventListener("keydown", (e) => {
  if ((e.key !== "Enter" && e.key !== " ") || !e.target || !e.target.matches || !e.target.matches(".m623-term [data-tv]")) return;
  e.preventDefault();
  m624Grafico(e.target.dataset.tv, e.target.dataset.nome);
});
// Botão discreto ⌘K no topo (só no desktop; o CSS esconde no celular).
setInterval(() => {
  try {
    if (!m623Desk()) return;
    const a = document.querySelector(".dt393-topactions");
    if (a && !a.querySelector("[data-m624-k]")) a.insertAdjacentHTML("afterbegin", `<button type="button" class="m624-kbtn" data-m624-k aria-label="Busca rápida (Ctrl + K)" title="Busca rápida · ${/Mac/i.test(navigator.platform || "") ? "⌘" : "Ctrl"} + K"><span>${/Mac/i.test(navigator.platform || "") ? "⌘" : "Ctrl"}</span>K</button>`);
  } catch {}
}, 1500);
// Saiu do Mercado (ou foi para o celular): desliga o Modo Monitor.
setInterval(() => {
  M624.mon && (!m623Desk() || typeof tab > "u" || tab !== "mercado" || MKT.tab !== "cq" || !m623Ativo()) && m624Monitor(!1);
}, 1e3);
