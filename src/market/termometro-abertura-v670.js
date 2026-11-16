/* v670 — Termômetro de Abertura Teórica (somente apresentação, sem novas requisições).
 * Os proxies são percentuais do dia, não sinais nem preço oficial de leilão. */
(function (w, d) {
  "use strict";
  if (w.TermometroAbertura670) return;

  const HORA = 3600000;
  const MAX_FONTE = 96 * HORA;
  const num = v => {
    if (v === null || v === undefined || v === "" || typeof v === "boolean") return null;
    if (typeof v === "string") {
      const s = v.trim().replace(/%$/, "").trim();
      if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) return null;
      v = Number(s.replace(",", "."));
    }
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const pct = v => {
    if (!v || typeof v !== "object") return null;
    const x = [v.d1, v.chp, v.variacaoPercentual, v.variacao_pct, v.var].map(num).find(n => n !== null);
    return x !== undefined && x !== null && Math.abs(x) <= 35 ? x : null;
  };
  const stamp = v => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return v < 1e11 ? v * 1000 : v;
    const t = Date.parse(String(v));
    return Number.isFinite(t) ? t : null;
  };
  const valido = (registro, coleta, tempo = Date.now()) => {
    const em = stamp(registro?.em || registro?.updated_at || registro?.horarioPreco || registro?.ts);
    const ts = stamp(coleta);
    // A fonte precisa ter sido carregada nesta sessão; o valor não pode ser muito antigo.
    if (em !== null && (tempo < em || tempo - em >= MAX_FONTE)) return false;
    return (ts !== null && ts > 0 && tempo >= ts && tempo - ts < 12 * HORA) ||
      (em !== null && tempo >= em && tempo - em < MAX_FONTE);
  };
  const chave = x => String(x || "").trim().toUpperCase().replace(/^(BMFBOVESPA|TVC|FX_IDC|OANDA|AMEX|NYSE|NASDAQ|CME_MINI|CME|NYMEX|ICE|FOREXCOM):/, "").replace(/_/g, "/");
  const aliases = {
    ewz: new Set(["EWZ"]),
    spf: new Set(["ES=F", "ES1!", "ES", "SP500F", "SPFUT", "SP500FUT", "S&P500FUT", "S&P500FUTURO", "ESZ26", "ESH27"]),
    wti: new Set(["WTI", "USOIL", "CL=F", "CL1!", "CL", "OILWTI"]),
    dxy: new Set(["DXY", "DX-Y.NYB", "DX=F", "DOLLARINDEX", "USDINDEX"]),
    zar: new Set(["USDZAR", "USD/ZAR"]),
    mxn: new Set(["USDMXN", "USD/MXN"]),
    win: new Set(["WIN", "WINFUT", "WIN1!"]),
    wdo: new Set(["WDO", "WDOFUT", "WDO1!"])
  };
  function combina(tipo, item) {
    const nomes = [item?.k, item?.c, item?.s, item?.ticker, item?.simboloFonte, item?.n];
    return nomes.some(raw => {
      const s = chave(raw);
      if (aliases[tipo].has(s)) return true;
      if (tipo === "spf") return /^ES[FGHJKMNQUVXZ]\d{2,4}$/.test(s) || /^S&P\s*500\s*(?:FUT|FUTURO)/.test(s);
      if (tipo === "win" || tipo === "wdo") return new RegExp("^" + tipo.toUpperCase() + "[FGHJKMNQUVXZ]\\d{2,4}$").test(s);
      return false;
    });
  }
  function lista() {
    const a = [];
    try {
      if (typeof FH !== "undefined" && FH?.q) {
        for (const [k, q] of Object.entries(FH.q)) {
          const ant = num(FH.pc?.[k]);
          const atual = num(q?.px);
          if (!ant || !atual || ant <= 0 || atual <= 0) continue;
          a.push({ item: { s:k, d1: (atual / ant - 1) * 100, em:q.em }, coleta:q.em });
        }
      }
    } catch {}
    try {
      if (typeof AD !== "undefined" && Array.isArray(AD?.data?.itens)) {
        const ts = AD.data.ts || AD.data.em || AD.ts;
        AD.data.itens.forEach(item => {
          const cot = item.active || item.regular || item;
          a.push({ item: { ...item, d1: pct(cot) ?? pct(item), em: cot?.em || item?.em }, coleta:ts });
        });
      }
    } catch {}
    try {
      if (typeof CQ !== "undefined" && CQ?.d) {
        for (const [grupo, conjunto] of Object.entries(CQ.d)) {
          // Cache local restaurado usa CQ.ts[grupo]=0 e não vale como nova consulta.
          const t = CQ.ts?.[grupo] || null;
          for (const it of conjunto?.itens || []) a.push({item:it,coleta:t || conjunto?.em,grupo});
        }
      }
    } catch {}
    try {
      if (typeof M606 !== "undefined" && M606?.v) {
        const t = M606.ts || M606.v.em;
        for (const it of M606.v.terminal || []) a.push({item:it,coleta:t,grupo:it.g});
        for (const it of M606.v.emergentes?.itens || []) a.push({item:it,coleta:t,grupo:"em"});
      }
    } catch {}
    try {
      if (typeof MDO !== "undefined" && MDO?.v) {
        const t = MDO.ts || MDO.v.em;
        for (const grupo of MDO.v.mercados?.grupos || []) for (const it of grupo.itens || []) a.push({item:it,coleta:t,grupo:grupo.g});
      }
    } catch {}
    return a;
  }
  function variacao(tipo, fontes, now) {
    for (const f of fontes) {
      if (!combina(tipo, f.item) || !valido(f.item, f.coleta, now)) continue;
      const n = pct(f.item);
      if (n !== null) return n;
    }
    return null;
  }
  const diaBrt = date => new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo", year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
  const horaBrt = date => Number(new Intl.DateTimeFormat("en-GB",{timeZone:"America/Sao_Paulo",hour:"2-digit",hourCycle:"h23"}).format(date));
  function fechamento(tipo, fontes, now) {
    // O fechamento informado pela fonte tem prioridade; senão, reconstituir só de
    // cotação com percentual diário verificável ou de último preço pré-abertura.
    for (const f of fontes) {
      if (!combina(tipo, f.item) || !valido(f.item, f.coleta, now)) continue;
      const item = f.item;
      const base = [item.fechamentoAnterior, item.previousClose, item.prevClose, item.pc, item.ultimoFechamento].map(num).find(x=>x !== null && x > 0);
      if (base) return base;
    }
    for (const f of fontes) {
      if (!combina(tipo, f.item) || !valido(f.item, f.coleta, now)) continue;
      const item = f.item, px = num(item.px ?? item.ult ?? item.preco);
      if (px === null || px <= 0) continue;
      const em = stamp(item.em || item.horarioPreco || item.updated_at);
      // Antes das 09:00, última cotação datada de pregão anterior é a referência
      // carregada. Sem data, não presumir que seja o fechamento de ontem.
      if (em !== null && diaBrt(new Date(em)) < diaBrt(new Date(now))) return px;
      if (item.fechado === true) return px;
      const d = pct(item);
      // Com cotação do dia e variação relativa ao fechamento anterior.
      if (d !== null && 1 + d / 100 > 0 && (em === null || diaBrt(new Date(em)) === diaBrt(new Date(now))) && horaBrt(new Date(now)) >= 9) return px / (1 + d / 100);
    }
    return null;
  }
  function calcular(v) {
    const ok = x => typeof x === "number" && Number.isFinite(x);
    const winPct = ["ewz","spf","wti"].every(k => ok(v[k])) ? 0.50*v.ewz + 0.35*v.spf + 0.15*v.wti : null;
    const wdoPct = ["dxy","zar","mxn","ewz"].every(k => ok(v[k])) ? 0.45*v.dxy + 0.35*((v.zar+v.mxn)/2) - 0.20*v.ewz : null;
    return {
      winPct, wdoPct,
      winDelta: ok(winPct) && ok(v.winBase) ? v.winBase*winPct/100 : null,
      winProjetado: ok(winPct) && ok(v.winBase) ? v.winBase*(1+winPct/100) : null,
      wdoProjetado: ok(wdoPct) && ok(v.wdoBase) ? v.wdoBase*(1+wdoPct/100) : null
    };
  }
  function capturar() {
    const now = Date.now(), f = lista();
    const v = {};
    for (const nome of ["ewz","spf","wti","dxy","zar","mxn"]) v[nome] = variacao(nome,f,now);
    v.winBase = fechamento("win",f,now);
    v.wdoBase = fechamento("wdo",f,now);
    return {...v,...calcular(v)};
  }
  const nfmt = (value, digits=2) => Number(value).toLocaleString("pt-BR",{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const taxa = v => v === null ? "—" : (v>0?"+":"") + nfmt(v,2) + "%";
  const cls = x => x === null ? "" : x > 0 ? "positive" : x < 0 ? "negative" : "neutral";
  function bloco(nome, sigla, value, projetado, base, detalhe, d) {
    const incompleto = value === null || projetado === null;
    const complemento = incompleto
      ? '<small class="dt670-pend">Dados insuficientes: '+detalhe+'</small>'
      : '<small>Fech. ref. '+nfmt(base, nome==="WIN"?0:2)+' → teórico <b>'+nfmt(projetado,nome==="WIN"?0:2)+'</b> '+(nome==="WIN"?"pts":"pts · futuro")+'</small>';
    const diferenca = !incompleto && nome === "WIN" ? '<small class="dt670-pt">'+(d>0?"+":"")+nfmt(d,0)+' pontos</small>' : '';
    return '<div class="dt670-instrument" data-dt670-ativo="'+sigla+'"><div class="dt670-val"><span><b>'+nome+'</b><small>'+sigla+'</small></span><strong class="'+cls(value)+'">'+taxa(value)+'</strong></div>'+diferenca+complemento+'</div>';
  }
  function html(v) {
    const pendWin = [["EWZ","ewz"],["S&P futuro","spf"],["WTI","wti"],["fechamento WIN","winBase"]].filter(([_,k])=>v[k]===null).map(([n])=>n);
    const pendWdo = [["DXY","dxy"],["USD/ZAR","zar"],["USD/MXN","mxn"],["EWZ","ewz"],["fechamento WDO","wdoBase"]].filter(([_,k])=>v[k]===null).map(([n])=>n);
    return '<header class="dt670-head"><div><small>INTELIGÊNCIA DE PRÉ-MERCADO</small><h2>Termômetro de Abertura Teórica <span>WIN &amp; WDO</span></h2></div><span class="dt670-selo">Proxies globais</span></header>'+
      '<div class="dt670-duo">'+
      bloco("WIN","ÍNDICE · 50% EWZ + 35% S&P fut. + 15% WTI",v.winPct,v.winProjetado,v.winBase,pendWin.join(", ")||"referência pendente",v.winDelta)+
      bloco("WDO","DÓLAR · 45% DXY + 35% EM (ZAR/MXN) − 20% EWZ",v.wdoPct,v.wdoProjetado,v.wdoBase,pendWdo.join(", ")||"referência pendente",null)+
      '</div><p class="dt670-note">Estimativa pré-abertura baseada em proxies globais · Atualize às 09:00 com o leilão da B3. Não é preço oficial de abertura.</p>';
  }
  function alvo() {
    let t;
    try { t = typeof tab !== "undefined" ? tab : null; } catch { t = null; }
    const app = d.getElementById("app");
    if (!app) return null;
    if (t === "home") return {root:app.querySelector(".dt393-page.dt393-home"),route:t};
    if (t === "dia") return {root:app.querySelector(".dt393-page.dt393-day"),route:t};
    if (t === "mercado") {
      try { if (typeof MKT !== "undefined" && MKT?.tab === "al") return null; } catch {}
      return {root:app.querySelector(".dt395-native-mercado") || app.querySelector(".dt393-page.dt393-market"),route:t};
    }
    return null;
  }
  function montar() {
    const dest = alvo();
    if (!dest?.root) return;
    let card = dest.root.querySelector(":scope > .dt670-opening");
    if (!card) {
      card = d.createElement("section");
      card.className = "dt670-opening";
      card.setAttribute("aria-label","Termômetro de Abertura Teórica WIN e WDO");
    }
    if (dest.route === "home") {
      const resumo = dest.root.querySelector(":scope > .dt393-summary");
      if (resumo) { if (card.previousElementSibling !== resumo) resumo.after(card); }
      else if (dest.root.firstElementChild !== card) dest.root.prepend(card);
    } else if (dest.route === "mercado") {
      const header = dest.root.querySelector(":scope > .m403-section-header");
      if (header) { if (card.previousElementSibling !== header) header.after(card); }
      else if (dest.root.firstElementChild !== card) dest.root.prepend(card);
    } else if (dest.root.firstElementChild !== card) dest.root.prepend(card);
    const conteudo = html(capturar());
    if (card.dataset.view !== conteudo) { card.innerHTML=conteudo; card.dataset.view=conteudo; }
  }
  w.TermometroAbertura670 = Object.freeze({calcular,capturar,montar});
  w.TraderUI?.onRender?.("termometro-abertura-teorica-v670",()=>w.setTimeout(montar,0));
  w.addEventListener("focus",montar);
  w.setInterval(()=>{if(!d.hidden)montar();},5000);
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded",()=>w.setTimeout(montar,0),{once:true});
  else w.setTimeout(montar,0);
})(window, document);
