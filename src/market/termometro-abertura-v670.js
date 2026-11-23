/* v679 — Termômetro de Abertura Teórica apenas em Início e Meu dia (sem novas requisições).
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
    // A fonte precisa ter sido carregada nesta sessão; tolera até 60s de diferença de relógio.
    if (em !== null && (em - tempo > 60000 || tempo - em >= MAX_FONTE)) return false;
    return (ts !== null && ts > 0 && ts - tempo <= 60000 && tempo - ts < 12 * HORA) ||
      (em !== null && em - tempo <= 60000 && tempo - em < MAX_FONTE);
  };
  const chave = x => String(x || "").trim().toUpperCase().replace(/^(BMFBOVESPA|TVC|FX_IDC|OANDA|AMEX|NYSE|NASDAQ|CME_MINI|CME|NYMEX|ICE|FOREXCOM):/, "").replace(/_/g, "/");
  const aliases = {
    ewz: new Set(["EWZ", "EWZ (BRASIL EM NY)"]),
    spf: new Set(["ES=F", "ES1!", "ES", "SP500F", "SPFUT", "SP500FUT", "S&P500FUT", "S&P500FUTURO", "S&P FUTURO", "S&P 500 FUTURO", "ESZ26", "ESH27"]),
    wti: new Set(["WTI", "USOIL", "CL=F", "CL1!", "CL", "OILWTI", "PETRÓLEO WTI", "PETROLEO WTI"]),
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
      if (tipo === "spf") return /^ES[FGHJKMNQUVXZ]\d{2,4}$/.test(s) || /^S&P(?:\s*500)?\s*(?:FUT|FUTURO)/.test(s);
      if (tipo === "win" || tipo === "wdo") return new RegExp("^" + tipo.toUpperCase() + "[FGHJKMNQUVXZ]\\d{2,4}$").test(s);
      return false;
    });
  }
  function lista(now = Date.now()) {
    const a = [];
    // v925: o termômetro usa EWZ da mesma fonte do Início e da fita.
    try {
      const q=w.tapeVivo?.("EWZ"), ts=stamp(q?.dadoEm);
      const atual=num(q?.px), variacao=num(q?.chg);
      if(atual!==null&&atual>0&&variacao!==null&&ts!==null)
        a.push({item:{s:"EWZ",px:atual,d1:variacao,em:q.dadoEm},
          coleta:ts,grupo:"ewz-canonico"});
    }catch{}
    // v928: lê /v1/mercado já em memória no DiarioPublico (Cloudflare, zero nova requisição).
    try {
      const pub = w.DiarioPublico?.peek?.("/v1/mercado");
      if (pub?.mercados?.grupos) {
        const t = stamp(pub.atualizadoEm) || now;
        for (const grupo of pub.mercados.grupos) {
          for (const it of grupo?.itens || []) a.push({ item: { ...it, em: it.priceAt || pub.atualizadoEm || now }, coleta: t, grupo: "cf-mercado" });
        }
      }
    } catch {}
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
      const m6 = (typeof M606 !== "undefined" && M606?.v) ? M606 : (typeof ls !== "undefined" && ls?.get ? ls.get("diario-m606") : null);
      if (m6?.v) {
        const t = m6.ts || m6.v.em || now;
        for (const it of m6.v.mapa || []) a.push({item:it,coleta:t,grupo:"mapa"});
        for (const it of m6.v.terminal || []) a.push({item:it,coleta:t,grupo:it.g});
        for (const it of m6.v.emergentes?.itens || []) a.push({item:it,coleta:t,grupo:"em"});
      }
    } catch {}
    try {
      if (typeof MDO !== "undefined" && MDO?.v) {
        const t = MDO.ts || MDO.v.em;
        for (const grupo of MDO.v.mercados?.grupos || []) for (const it of grupo.itens || []) a.push({item:it,coleta:t,grupo:grupo.g});
      }
    } catch {}
    try {
      const td = typeof w.tapeDados === "function" ? w.tapeDados() : null;
      if (td && typeof td === "object") {
        for (const [k, q] of Object.entries(td)) {
          if (!q || q.px == null) continue;
          const t = q.dadoEm || now;
          a.push({ item: { s: k, k, px: q.px, d1: q.chg ?? q.d1, em: t }, coleta: t, grupo: "tape" });
        }
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
    const now = Date.now(), f = lista(now);
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
    const semProxies = value === null;
    const semBase = !semProxies && projetado === null;
    const complemento = semProxies
      ? '<small class="dt670-pend">Dados insuficientes: '+detalhe+'</small>'
      : semBase
      ? '<small class="dt670-pend">Variação teórica calculada · aguardando '+detalhe+'</small>'
      : '<small>Fech. ref. '+nfmt(base, nome==="WIN"?0:2)+' → teórico <b>'+nfmt(projetado,nome==="WIN"?0:2)+'</b> '+(nome==="WIN"?"pts":"pts · futuro")+'</small>';
    const diferenca = !semProxies && !semBase && nome === "WIN" ? '<small class="dt670-pt">'+(d>0?"+":"")+nfmt(d,0)+' pontos</small>' : '';
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
    // v675: Início/Meu dia usam a página V4; a versão v670 buscava apenas
    // .dt393-page, substituída pelo renderizador atual (v4-panel).
    const activeRoute = d.body?.dataset?.v4route;
    const homeV4 = app.querySelector(".v4-panel .v4-page.v4-home");
    // V4 mantém a rota atual no body e desmonta os painéis ao navegar.
    if (homeV4 && (activeRoute === "home" || t === "home")) return {root:homeV4,route:"home"};
    if (t === "home") return {root:app.querySelector(".dt393-page.dt393-home"),route:t};
    return null;
  }
  // v679: preserva os nós do card nos ticks; apenas o texto numérico muda.
  // Assim o Safari não desmonta a seção nem reinicia seu layout a cada cotação.
  function mesmaEstrutura(a,b) {
    if(a.nodeType!==b.nodeType || a.nodeName!==b.nodeName || a.childNodes.length!==b.childNodes.length)return false;
    for(let i=0;i<a.childNodes.length;i++)if(!mesmaEstrutura(a.childNodes[i],b.childNodes[i]))return false;
    return true;
  }
  function sincronizar(a,b) {
    if(a.nodeType===3){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
    if(a.nodeType!==1)return;
    for(const attr of [...a.attributes])if(!b.hasAttribute(attr.name))a.removeAttribute(attr.name);
    for(const attr of [...b.attributes])if(a.getAttribute(attr.name)!==attr.value)a.setAttribute(attr.name,attr.value);
    for(let i=0;i<a.childNodes.length;i++)sincronizar(a.childNodes[i],b.childNodes[i]);
  }
  function atualizarCard(card,conteudo) {
    if(card.dataset.view===conteudo)return;
    const tmp=d.createElement("template");
    tmp.innerHTML=conteudo;
    const antigos=[...card.childNodes],novos=[...tmp.content.childNodes];
    if(antigos.length===novos.length && antigos.every((n,i)=>mesmaEstrutura(n,novos[i])))
      antigos.forEach((n,i)=>sincronizar(n,novos[i]));
    else card.replaceChildren(tmp.content);
    card.dataset.view=conteudo;
  }
  function montar() {
    // v846: o termômetro fica só no Início; o Meu dia não mostra mais o card.
    d.querySelectorAll(".v4-page.v4-day > .dt670-opening, .dt393-page.dt393-day > .dt670-opening").forEach(n=>n.remove());
    const dest = alvo();
    if (!dest?.root) return;
    let card = dest.root.querySelector(":scope > .dt670-opening");
    if (!card) {
      card = d.createElement("section");
      card.className = "dt670-opening";
      card.setAttribute("aria-label","Termômetro de Abertura Teórica WIN e WDO");
    }
    if (dest.route === "home") {
      const resumo = dest.root.querySelector(":scope > .v4-summary, :scope > .dt393-summary");
      if (resumo) { if (card.previousElementSibling !== resumo) resumo.after(card); }
      else if (dest.root.firstElementChild !== card) dest.root.prepend(card);
    } else if (dest.root.firstElementChild !== card) dest.root.prepend(card);
    const conteudo = html(capturar());
    atualizarCard(card,conteudo);
  }
  /* v811: variação observada de WIN/WDO no dia (mesmas fontes e validade), para a memória previsto × ocorrido. */
  function observado() {
    const now = Date.now(), f = lista();
    const hm = new Intl.DateTimeFormat("en-GB",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(now));
    return {win: variacao("win",f,now), wdo: variacao("wdo",f,now), em: diaBrt(new Date(now)) + "T" + hm + "-03:00"};
  }
  w.TermometroAbertura670 = Object.freeze({calcular,capturar,montar,observado});
  w.TraderUI?.onRender?.("termometro-abertura-teorica-v670",()=>w.setTimeout(montar,0));
  // A tela V4 troca seu conteúdo depois do render principal. Reposicionar
  // após o evento de render final preserva o termômetro nas duas rotas.
  d.addEventListener("diario:render",()=>w.requestAnimationFrame(()=>w.requestAnimationFrame(montar)));
  // Também observa a troca do painel V4. Filtra apenas novos nós de página,
  // evitando fazer trabalho extra quando preços ou campos recebem atualizações.
  function observarMontagem() {
    const app = d.getElementById("app");
    if (!app || !w.MutationObserver) return;
    const observador = new w.MutationObserver(registros => {
      for (const registro of registros) for (const n of registro.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.(".v4-page.v4-home,.v4-page.v4-day") ||
            n.querySelector?.(".v4-page.v4-home,.v4-page.v4-day")) {
          montar();
          return;
        }
      }
    });
    observador.observe(app,{childList:true,subtree:true});
  }
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",observarMontagem,{once:true});
  else observarMontagem();
  w.addEventListener("focus",montar);
  // v811: o intervalo só trabalha onde o termômetro aparece (Início e Meu dia).
  w.setInterval(()=>{try{if(!d.hidden&&(tab==="home"||tab==="dia"))montar();}catch{}},5000);
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded",()=>w.setTimeout(montar,0),{once:true});
  else w.setTimeout(montar,0);
})(window, document);
