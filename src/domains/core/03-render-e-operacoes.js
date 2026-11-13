function render0() {
  (fixS(), window.DiarioDados?.observe(diarioDaysCanonical()));
  const e = $("#app");
  ((e.style.animation = "none"),
    e.offsetWidth,
    (e.style.animation = ""),
    (e.innerHTML = {
      home: vHome,
      mercado: () => segM("mercado:" + MKT.tab) + vMercado(),
      juros: () => segM("juros") + vJuros(),
      mais: vMais,
      trades: () => segT("trades") + vTrades("D"),
      swing: () => segT("swing") + vTrades("S"),
      opc: () => segT("opc") + vTrades("O"),
      dia: () => segD("dia") + vDia(),
      regras: () => segD("regras") + vRegras(),
      stats: () => segT("stats") + vStats(),
      graf: () => segM("graf") + vGraf(),
      painel: vPainel,
      rev: () => segT("rev") + vRev(),
      conta: vConta,
      live: () => segM("live") + vLive(),
      estudos: vEstudos,
      livro: vLivro,
      ativos: () => segT("ativos") + vAtivos(),
      contratos: vContratos,
      imposto: vImposto,
      carteiras: vCarteiras,
      analise: vAnalise,
      analises: () => window.DiarioAnalises?.view() || "<p>Carregando Análises…</p>",
      import: vImport,
      mesa: () => vMesa(),
      carreira: () => vCarreira(),
      termos: () => vTermos(),
      status: () => vStatus(),
      dash: () => segT("dash") + vDash(),
      ops: () => vOpsHub(),
      opgrade: () => segT("opgrade") + vOpGrade(),
      opfluxo: () => segT("opfluxo") + vOpFluxo(),
      opcart: () => segT("opcart") + vOpCart(),
      swbt: () => segT("swbt") + vSwBt(),
      dtrpy: () => segT("dtrpy") + vDtReplay(),
      term: () => vTerm(),
    }[tab]()));
  const t =
    {
      home: "home",
      trades: "trades",
      swing: "trades",
      opc: "trades",
      dia: "dia",
      stats: "stats",
      dash: "stats",
      ops: "stats",
      opgrade: "stats",
      opfluxo: "stats",
      opcart: "stats",
      swbt: "stats",
      dtrpy: "stats",
    }[tab] || "mais";
  (document
    .querySelectorAll("nav button")
    .forEach((a) => a.classList.toggle("on", a.dataset.tab === t)),
    fillImgs(),
    cnt(),
    ppOut(),
    ggOut(),
    zzOut(),
    animCount(),
    applyQ(),
    svUi(),
    opPrev(),
    db ||
      $("#app").insertAdjacentHTML(
        "afterbegin",
        '<div class="warn" style="margin-bottom:8px">Armazenamento do navegador indisponível: os dados não serão salvos ao fechar.</div>',
      ),
    bkBanner(),
    fabVis(),
    lvPaint(),
    lvcPaint(),
    tab === "live" && lvPoll());
}
function render() {
  try {
    render0();
  } catch (e) {
    console.error(e);
    const t = $("#app");
    t &&
      (t.innerHTML =
        '<div class="warn" style="margin:12px 0"><b>Não consegui abrir esta tela (' +
        esc(tab) +
        ').</b><div class="sm" style="margin-top:6px">' +
        esc(String((e && e.message) || e)) +
        '</div><div class="sm mut" style="margin-top:6px">' +
        esc(
          String(
            ((e && e.stack) || "").split(`
`)[1] || "",
          )
            .trim()
            .slice(0, 160),
        ) +
        '</div></div><div class="mut sm">Abra o menu (☰) e tente outra tela. Se o erro continuar, me mande esta mensagem.</div>');
  }
}
(document.addEventListener("click", async (e) => {
  var t;
  e.target.closest("#fab,#fabm") || ($("#fabm").style.display = "none");
  const a = e.target.closest("[data-seg]");
  if (a && T) {
    ((T[a.dataset.seg] = a.dataset.v),
      a.dataset.seg === "tipo" && tipoMud(),
      showSheet());
    return;
  }
  const o = e.target.closest("[data-dseg]");
  if (o) {
    const d = (t = S.days)[D] ?? (t[D] = { chk: {} });
    ((d[o.dataset.dseg] = o.dataset.v), (d.u = Date.now()), save(), render());
    return;
  }
  const s = e.target.closest(".pv img");
  if (s) {
    zoom(s.src);
    return;
  }
  const n = e.target.closest("#lb img");
  if (n) {
    n.style.width = n.style.width === "260%" ? "100%" : "260%";
    return;
  }
  const r = e.target.closest("[data-a],[data-tab]");
  if (!r) return;
  if (r.dataset.tab) {
    ((tab = r.dataset.tab === "trades" ? LT : r.dataset.tab),
      ["trades", "swing", "opc"].includes(tab) && (LT = tab),
      render(),
      scrollTo(0, 0));
    return;
  }
  const i = r.dataset.a,
    l = r.dataset.id;
  if (i === "am") ((AM = r.dataset.id), (SY.msg = ""), render());
  else if (i === "auth") doAuth(AM);
  else if (i === "savecfg") {
    const d = $("#cu").value.trim().replace(/\/$/, ""),
      c = $("#ck").value.trim();
    if (!/^https:\/\/.+/.test(d) || c.length < 20) {
      ((SY.msg = "Confira a URL (https://…) e a chave anon."), render());
      return;
    }
    (ls.set("diario-cfg", { url: d, key: c }), (SY.msg = ""), render());
  } else if (i === "clrcfg") (ls.del("diario-cfg"), render());
  else if (i === "syncnow") sync(1);
  else if (i === "logout") {
    try {
      await rq("/auth/v1/logout", { method: "POST" });
    } catch {}
    ((SESS = null), ls.del("diario-sess"), (SY.msg = ""), render());
  } else if (i === "newpw") {
    const d = $("#np").value;
    if (d.length < 10) {
      ((SY.msg = "A senha precisa ter pelo menos 10 caracteres."), render());
      return;
    }
    try {
      (await rq(
        "/auth/v1/user",
        {
          method: "PUT",
          tok: RECOV,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: d }),
        },
        !1,
      ),
        (RECOV = null),
        (SY.msg = "Senha alterada. Agora é só entrar."));
    } catch (c) {
      SY.msg = em(c);
    }
    render();
  } else if (i === "enc")
    ((AUTO = 0),
      (isNew = 0),
      (QM = 1),
      (T = {
        ...S.trades.find((d) => d.id === r.dataset.id),
        dtx: loc().slice(0, 16),
      }),
      (orig = { pin: T.pin, pout: T.pout, pplan: T.pplan }),
      showSheet());
  else if (i === "xv") ((XV[r.dataset.tp] = l), render(), scrollTo(0, 0));
  else if (i === "lvcf") ((LVC.f = l), render());
  else if (i === "exd") ((EXD[r.dataset.tp] = l), render());
  else if (i === "vw") ((VW[r.dataset.tp] = r.dataset.id), render());
  else if (i === "carPx") carPrecos();
  else if (i === "cmk") (((S.ax ?? (S.ax = {}))["cart.mk"] = l), render());
  else if (i === "carAdd") {
    const d = (p) => (document.getElementById(p) || {}).value,
      c = {
        id: uid(),
        mk: d("c_mk"),
        tp: d("c_tp"),
        cl: d("c_cl"),
        tk: (d("c_tk") || "").trim().toUpperCase(),
        d: d("c_d"),
        q: d("c_q"),
        p: d("c_p"),
        cs: d("c_cs"),
      };
    !c.tk || !c.d || c.p === "" || (c.tp !== "P" && c.q === "")
      ? alert(
          "Informe ticker, data, " +
            (c.tp === "P" ? "valor" : "quantidade e preço") +
            ".",
        )
      : ((S.cart ?? (S.cart = { lanc: [], px: {}, snap: {} })).lanc.push(c),
        save(),
        render());
  } else if (i === "carDel")
    ((S.cart.lanc = S.cart.lanc.filter((d) => d.id !== l)), save(), render());
  else if (i === "irAdd") {
    const d = (p) => (document.getElementById(p) || {}).value,
      c = {
        id: uid(),
        d: d("ir_d"),
        m: d("ir_m"),
        bruto: d("ir_b"),
        vendas: d("ir_v"),
        corr: d("ir_c"),
        emol: d("ir_e"),
        iss: d("ir_i"),
        out: d("ir_o"),
        irrf: d("ir_r"),
      };
    !c.d || c.bruto === ""
      ? alert("Informe a data e o resultado bruto.")
      : (((S.ir ?? (S.ir = { notas: [] })).notas = (S.ir.notas || []).concat(
          c,
        )),
        save(),
        render());
  } else if (i === "irDel")
    ((S.ir.notas = S.ir.notas.filter((d) => d.id !== r.dataset.id)),
      save(),
      render());
  else if (i === "cm") ((CMX += +r.dataset.id), render());
  else if (i === "gopainel") (irPara("painel"), scrollTo(0, 0));
  else if (i === "gotab")
    ((tab = r.dataset.id),
      ["trades", "swing", "opc"].includes(tab) && (LT = tab),
      render(),
      scrollTo(0, 0));
  else if (i === "fab") {
    const d = $("#fabm");
    d.style.display = d.style.display === "flex" ? "none" : "flex";
  } else if (i === "flt") ((LF.f = r.dataset.id), render());
  else if (i === "bar") $("#chr-" + r.dataset.id).textContent = r.dataset.t;
  else if (i === "theme")
    (ls.set("diario-theme", r.dataset.id), applyTheme(), render());
  else if (i === "lbx") $("#lb").style.display = "none";
  else if (i === "new") {
    if ((($("#fabm").style.display = "none"), !pBloq())) return;
    ((AUTO = 0),
      (isNew = 1),
      (orig = {}),
      (T = {
        tipo: r.dataset.tp,
        id: uid(),
        dt: loc().slice(0, 16),
        side: "C",
        qty: r.dataset.tp === "O" ? 100 : 1,
        ...(r.dataset.tp === "O" ? { ot: "C", estr: ESTR[0] } : {}),
        pv: 1,
        cost: 0,
        emo: "3",
        rules: "s",
        err: "Nenhum",
        mkt: MK[0],
      }),
      showSheet());
  } else if (i === "edit")
    ((AUTO = 0),
      (isNew = 0),
      (T = { ...S.trades.find((d) => d.id === r.dataset.id) }),
      (orig = { pin: T.pin, pout: T.pout, pplan: T.pplan }),
      showSheet());
  else if (i === "close") closeSheet();
  else if (i === "iadel") anxDel(l, r.dataset.w);
  else if (i === "savetrade") {
    if (!String(T.ativo || "").trim()) {
      const c = $("#msg");
      ((c.textContent = "Informe o ativo (ex.: WINZ26)."),
        c.scrollIntoView && c.scrollIntoView({ block: "center" }));
      return;
    }
    if (!+T.entry) {
      $("#msg").textContent = "Informe o preço de entrada.";
      return;
    }
    if (
      !QM &&
      !+T.stop &&
      !confirm(
        "Sem stop inicial não dá para calcular o risco. Salvar assim mesmo?",
      )
    )
      return;
    if (QM && isOpen(T)) {
      $("#msg").textContent = "Informe o preço de saída.";
      return;
    }
    (["pin", "pout", "pplan"].forEach((c) => {
      orig[c] && orig[c] !== T[c] && idb("img", "delete", orig[c]);
    }),
      window.TraderWorkflow?.captureTrade(T, orig, isNew),
      (T.u = Date.now()));
    const d = S.trades.findIndex((c) => c.id === T.id);
    (d >= 0 ? (S.trades[d] = T) : S.trades.push(T),
      save(),
      closeSheet(1),
      render());
  } else if (i === "deltrade") {
    if (!delArm) {
      ((delArm = 1), showSheet());
      return;
    }
    (["pin", "pout", "pplan"].forEach(
      (d) => T[d] && idb("img", "delete", T[d]),
    ),
      (S.trades = S.trades.filter((d) => d.id !== T.id)),
      ((S.del ?? (S.del = {}))[T.id] = Date.now()),
      save(),
      closeSheet(1),
      render());
  } else if (i === "addrule") {
    const d = $("#rt").value.trim();
    if (!d) return;
    (S.rules.push({ id: uid(), cat: +$("#rc").value, t: d, u: Date.now() }),
      save(),
      render());
  } else if (i === "delrule")
    ((S.rules = S.rules.filter((d) => d.id !== r.dataset.id)),
      ((S.del ?? (S.del = {}))[r.dataset.id] = Date.now()),
      save(),
      render());
  else if (i === "chart")
    ((OPEN[r.dataset.id] = !OPEN[r.dataset.id]), render());
  else if (i === "addw") {
    const d = $("#wt").value.trim().toUpperCase();
    if (!d) return;
    (S.watch ?? (S.watch = []),
      S.watch.includes(d) || S.watch.push(d),
      save(),
      render());
  } else if (i === "delw")
    ((S.watch = (S.watch || []).filter((d) => d !== r.dataset.id)),
      save(),
      render());
  else if (i === "cprev" || i === "cnext") {
    const [d, c] = CM.split("-").map(Number);
    ((CM = ymd(new Date(d, c - 1 + (i === "cnext" ? 1 : -1), 1)).slice(0, 7)),
      render());
  } else
    i === "cday"
      ? ((D = r.dataset.id), irPara("dia"), scrollTo(0, 0))
      : i === "bk"
        ? (await backup(), ($("#bm").textContent = "Backup gerado."))
        : i === "csv" && csv();
}),
  document.addEventListener("input", (e) => {
    var t, a, o, s;
    const n = e.target;
    if (n.closest("#sh") && n.name && T) {
      if (
        ((T[n.name] = n.value),
        n.name === "pv" && (AUTO = 0),
        n.name === "ativo")
      ) {
        const r = n.value.toUpperCase(),
          i = r.startsWith("WIN") ? 0.2 : r.startsWith("WDO") ? 10 : 0;
        if (i && (!+T.pv || +T.pv == 1 || AUTO)) {
          ((T.pv = i), (AUTO = 1));
          const l = $("#sh [name=pv]");
          l && (l.value = i);
        }
      }
      prev();
      return;
    }
    if (n.dataset.d) {
      const r = (t = S.days)[D] ?? (t[D] = { chk: {} });
      if (
        ((r[n.dataset.d] = n.value),
        (r.u = Date.now()),
        save(),
        n.dataset.d === "nota")
      ) {
        const i = $("#nv");
        i && (i.textContent = n.value);
      }
    } else if (n.dataset.rid)
      (Object.assign(
        S.rules.find((r) => r.id === n.dataset.rid),
        { t: n.value, u: Date.now() },
      ),
        save());
    else if (n.dataset.chk) {
      const r = (a = S.days)[D] ?? (a[D] = { chk: {} });
      ((r.chk[n.dataset.chk] = n.checked), (r.u = Date.now()), save(), cnt());
    } else
      n.id === "dd" && n.value
        ? ((D = n.value), render())
        : n.id === "per"
          ? ((PER = n.value), render())
          : n.id === "tp"
            ? ((TIPO = n.value), render())
            : n.dataset.p
              ? (((S.prop ?? (S.prop = {}))[n.dataset.p] = n.value),
                save(),
                ppOut(),
                zzOut())
              : n.dataset.g
                ? (((S.goals ?? (S.goals = {}))[n.dataset.g] = n.value),
                  save(),
                  ggOut())
                : n.dataset.z
                  ? ((Z[n.dataset.z] = n.value), zzOut())
                  : n.dataset.rv
                    ? ((((o = S.rev ?? (S.rev = {}))[(s = rng(RP)[2])] ??
                        (o[s] = {}))[n.dataset.rv] = n.value),
                      save())
                    : n.id === "rp"
                      ? ((RP = n.value), render())
                      : n.id === "lq" &&
                        ((LF.q = n.value.toLowerCase()), applyQ());
  }),
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.id === "bkf" && t.files[0]) {
      const s = await restore(t.files[0]);
      render();
      const n = $("#bm");
      n && (n.textContent = s);
      return;
    }
    if (t.type !== "file" || !t.files[0] || !T) return;
    const a = await shrink(t.files[0]);
    if (!a) return;
    const o = uid();
    ((M[o] = a),
      await idb("img", "put", a, o),
      T[t.dataset.k] &&
        T[t.dataset.k] !== orig[t.dataset.k] &&
        idb("img", "delete", T[t.dataset.k]),
      (T[t.dataset.k] = o),
      showSheet());
  }));
let ANX = {
    mk: "BR",
    m: "tec",
    busy: "",
    msg: "",
    det: "",
    ok: "",
    res: {},
    img: null,
    tk: "",
    foco: "",
    sh: "both",
    pt: "classico",
    tkA: "",
  },
  ANL = 0;
