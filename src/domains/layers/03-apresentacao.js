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

    /* v810 — reutiliza as telas V4; seleção manual expira na próxima mudança de sessão. */
    let v810Manual = null;
    function v810FaseAtiva() {
      const now=Date.now(), c=window.DiarioSessoes?.context(now);
      if (v810Manual && (now>=v810Manual.until || v810Manual.anchor!==c?.anchorDate)) v810Manual=null;
      return v810Manual?.phase || ({pre:"pre",during:"pregao",post:"pos"}[c?.phase]||"pos");
    }
    function v810Seletor(botoes) {
      const c=window.DiarioSessoes?.context();
      const label=c?.b3?.verified===false?"Calendário não verificado":"Automático";
      return '<div class="v810-modebar">'+botoes+
        '<button type="button" class="v810-auto '+(!v810Manual?'on':'')+
        '" data-v4auto="1" aria-pressed="'+(!v810Manual)+'">'+p("cal",16)+' '+label+'</button></div>';
    }
    function v810Faixa(pagina,fase,texto) {
      const titulos=pagina==="home"?
        {pre:"Panorama pré-mercado",pregao:"Acompanhamento do mercado",pos:"Resumo do fechamento"}:
        {pre:"Plano operacional do dia",pregao:"Controle do pregão",pos:"Revisão da sessão"};
      const contexto=window.DiarioSessoes?.context();
      const fechado=contexto?.mode==="b3_fechada"||contexto?.mode==="cripto_macro";
      const horario=new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
      const aviso=contexto?.warning||(contexto?.b3?.verified===false?"Calendário não verificado.":"");
      const titulo=fechado&&fase==="pos"?"B3 fechada · Preparação":titulos[fase];
      const estadoVisual=v810Manual?"Visualização manual":fechado?"Mercado B3 fechado":fase==="pregao"?"Em acompanhamento":fase==="pre"?"Preparação":"Sessão encerrada / referência";
      return '<header class="v810-hero"><div class="v810-hero-top"><h2>'+
        p(pagina==="home"?"bars":"target",22)+' '+titulo+'</h2>'+
        '<span class="v810-status">'+estadoVisual+
        '</span><time>'+horario+' BRT</time></div><p>'+b(texto)+'</p>'+
        (aviso?'<small class="v810-caveat">'+b(aviso)+'</small>':'')+'</header>';
    }
    function v810NoticiaValida(n) {
      const titulo=String(n?.t||n?.titulo||"");
      const at=Date.parse(n?.d||"");
      return !!titulo && Number.isFinite(at) && at<=Date.now()+60000 &&
        Date.now()-at<=48*3600000 &&
        !(window.DiarioInterpretacao?.isNoise ? window.DiarioInterpretacao.isNoise(titulo) :
          /loteria|mega.sena|lotof[aá]cil|hor[oó]scopo|advertorial|conte[uú]do patrocinado/i.test(titulo));
    }
    function v810AgendaNoticias(dia) {
      const agenda=f(()=>AG.v.flatMap(g=>g?.eventos||[]),[]);
      const relevantes=agenda.filter(g=>{
        const ts=Date.parse(g?.em||"");if(!Number.isFinite(ts))return false;
        const local=new Date(ts).toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"});
        return local===dia||(ts>Date.now()&&(g.imp===1||g.imp==null));
      }).sort((a,b)=>Date.parse(a.em)-Date.parse(b.em)).slice(0,4);
      const horario=raw=>{
        const ts=Date.parse(raw||"");
        return Number.isFinite(ts)?new Date(ts).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"Sem horário";
      };
      const noticias=f(()=>(MKT.items||[]).filter(v810NoticiaValida).slice(0,3),[]);
      return C("cal","Agenda e notícias",
        '<button type="button" class="v4-inline" data-v4mkt="ag">Abrir agenda</button>',
        '<div class="v810-agenda"><div><h3>Eventos prioritários</h3><ul>'+
        (relevantes.length?relevantes.map(g=>'<li><time>'+horario(g.em)+'</time><span>'+b(g.t||g.n||"Evento")+'</span></li>').join(''):
          '<li>Agenda sem eventos verificáveis carregados.</li>')+
        '</ul></div><div><h3>Notícias recentes</h3><ul>'+
        (noticias.length?noticias.map(g=>'<li><time>'+horario(g.d)+'</time><span>'+b(g.t||g.titulo||"Notícia")+'</span></li>').join(''):
          '<li>Nenhuma notícia recente com horário verificável no cache.</li>')+
        '</ul><button type="button" class="v4-inline" data-v4mkt="nt">Ver notícias</button></div></div>');
    }
    function v810Operacoes(dia,fechadas) {
      // As posições carregadas de pregões anteriores continuam abertas hoje.
      // Contar também encerradas sem resultado validável, sem inventar seu P&L.
      const abertas=f(()=>Jt(),[]),
        encerradas=ct().filter(t=>nt(t)===dia&&!Gt(t)&&t.exit!=null&&t.exit!=="");
      const validas=encerradas.filter(t=>{
        try{return !(typeof isOpen==="function"&&isOpen(t))&&t.exit!=null&&t.exit!==""&&Number.isFinite(R(t));}
        catch{return false;}
      });
      const completas=encerradas.length===validas.length&&validas.length>0;
      const acertos=validas.filter(t=>R(t)>0).length;
      const resumo=completas?'<strong class="'+L(lt(validas,R))+'">'+j(lt(validas,R))+'</strong>':'<strong>Dados insuficientes</strong>';
      const dataRows=encerradas.slice(-5).reverse().map(t=>{
        const ok=Number.isFinite(R(t))&&t.exit!=null&&t.exit!=="";
        return '<li><button type="button" data-a="edit" data-id="'+b(t.id||"")+'"><span>'+b(t.ativo||"Ativo não informado")+'</span>'+
          '<span>Encerrada</span><b class="'+(ok?L(R(t)):'')+'">'+(ok?j(R(t)):'Dados insuficientes')+'</b></button></li>';
      }).concat(abertas.slice(-3).reverse().map(t=>
        '<li><button type="button" data-a="edit" data-id="'+b(t.id||"")+'"><span>'+b(t.ativo||"Ativo não informado")+'</span>'+
        '<span class="v810-open">Aberta</span><b>Sem resultado realizado</b></button></li>')).join('');
      return '<section class="v810-ops v4-card"><div class="v4-head"><h2>'+p("trade",20)+
        ' Operações do dia</h2><button type="button" class="v4-inline" data-dt393-route="ops">Ver operações</button></div>'+
        '<div class="v810-ops-stats"><div><small>Resultado realizado</small>'+resumo+'</div>'+
        '<div><small>Encerradas</small><strong>'+encerradas.length+'</strong></div>'+
        '<div><small>Abertas agora</small><strong>'+abertas.length+'</strong></div>'+
        '<div><small>Taxa de acerto</small><strong>'+(completas?_(100*acertos/validas.length,1)+'%':'Dados insuficientes')+
        '</strong></div></div><ul class="v810-oprows">'+
        (dataRows||'<li>Nenhuma operação registrada nesta data.</li>')+'</ul></section>';
    }
    /* v829: KPIs de mercado no topo do Início (barra superior já carregada; sem rede nova). */
    function v829MercadoKpis() {
      const U=window.DiarioUI;if(!U)return "";
      const tape=f(()=>window.tapeDados?.()||{},{}),viva=k=>f(()=>window.tapeVivo?.(k),null)||tape[k];
      const itens=[["^BVSP","Ibovespa"],["BRL=X","Dólar"],["^GSPC","S&P 500"],["^IXIC","Nasdaq"],["EWZ","EWZ"],["BTC-USD","Bitcoin"]].map(([k,n])=>{
        const v=viva(k);if(!v||!(+v.px>0))return null;const c=v.chg==null||v.chg===""?null:+v.chg;
        return {rotulo:n,valor:q(v.px),detalhe:c==null?"variação indisponível":Q(c)+(v.fechado?" · fechado":""),tom:c==null?"":c>=0?"g":"r"};
      }).filter(Boolean);
      return '<section class="v4-summary v829-kpis" aria-label="Resumo do mercado">'+(itens.length?U.kpis(itens):'<p class="v4-sub">Cotações carregando na barra superior.</p>')+'</section>';
    }
    /* v829: KPIs pessoais no topo do Meu dia (resultado, limites, risco disponível, trades). */
    function v829DiaKpis(resultado,meta,perdaMax,trades) {
      const U=window.DiarioUI;if(!U)return "";
      const rk=f(()=>window.DiarioRisco?.hoje(),null);
      return '<section class="v829-kpis" aria-label="Resumo do dia">'+U.kpis([
        {rotulo:"Resultado do dia",valor:j(resultado),detalhe:trades+" trade(s) hoje",tom:resultado>0?"g":resultado<0?"r":""},
        {rotulo:"Meta do dia",valor:meta?j(meta):"—",detalhe:meta?"ganho planejado":"defina no preparo"},
        {rotulo:"Perda máxima",valor:perdaMax?j(perdaMax):"—",detalhe:"limite do dia"},
        {rotulo:"Risco disponível",valor:rk&&rk.disponivel!=null?j(rk.disponivel):"—",detalhe:rk&&rk.limite?"de "+j(rk.limite):"sem limite definido"}
      ])+'</section>';
    }
    /* v827: EUA e ADRs agora no Início — índices, EWZ, petróleo, ADRs brasileiras e manchetes dos EUA.
       Lê só os caches que o app já tem (barra superior e ADRs); as ADRs vêm da Cloudflare. */
    function v827Eua() {
      const S=window.DiarioSessoes, us=f(()=>S.session("NYSE"),null);
      if(!us||us.state==="fechado"&&!f(()=>(AD.data?.itens||[]).length,0))return "";
      f(()=>typeof adrLoad==="function"&&adrLoad(),null);
      const tape=f(()=>window.tapeDados?.()||{},{}),viva=k=>f(()=>window.tapeVivo?.(k),null)||tape[k];
      const idx=[["^GSPC","S&P 500"],["^IXIC","Nasdaq"],["^DJI","Dow"],["EWZ","EWZ"],["CL=F","WTI"]].map(([k,n])=>{
        const v=viva(k);if(!v||!(+v.px>0))return "";const c=v.chg==null||v.chg===""?null:+v.chg;
        return '<div><span>'+n+'</span><b>'+q(v.px)+'</b><em class="'+L(c)+'">'+(c==null?"—":Q(c))+'</em></div>';}).join("");
      const itens=f(()=>(AD.data?.itens||[]).map(r=>{const w=window.TraderAdr?.view(r)||{};return {s:r.s,px:w.active?.px??r.px,ch:w.change??r.chp,k:w.active?.kind};}).filter(r=>r.ch!=null),[]);
      itens.sort((a,b)=>Math.abs(b.ch)-Math.abs(a.ch));
      const media=itens.length?itens.reduce((a,r)=>a+(+r.ch||0),0)/itens.length:null;
      const adrs=itens.slice(0,6).map(r=>'<li><b>'+b(r.s)+'</b><span>'+(+r.px>0?(+r.px).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):"—")+'</span><em class="'+L(r.ch)+'">'+Q(r.ch)+'</em>'+(r.k&&r.k!=="regular"?'<small>'+b(r.k==="overnight"?"overnight":r.k==="pre"?"pré":"pós")+'</small>':'')+'</li>').join("");
      const re=/\b(fed|wall street|nasdaq|s&p|dow|treasur|nvidia|apple|tesla|eua|estados unidos|powell|warsh|ações americanas|bolsas de ny|nova york)\b/i;
      const nts=f(()=>(MKT.items||[]).filter(v810NoticiaValida).filter(n=>re.test(n.t||n.titulo||"")).slice(0,3),[]);
      const fase={pre:"pré-mercado",regular:"pregão aberto",pos:"after-market",fechado:"fechado"}[us.state]||us.state;
      const texto=media==null?"":(media<=-1?"ADRs em queda forte":media>=1?"ADRs em alta forte":"ADRs sem direção forte")+" · média "+Q(media);
      return C("bars","EUA e ADRs agora",'<span class="v4-muted">NY '+b(fase)+'</span>',
        (idx?'<div class="v4-quotes">'+idx+'</div>':'')+
        (adrs?'<p class="v4-sub">'+b(texto)+'</p><ul class="v827-adr">'+adrs+'</ul>':'<p class="v4-sub">ADRs: aguardando cotação.</p>')+
        (nts.length?'<ul class="v4-list">'+nts.map(n=>'<li><time>'+b(new Date(Date.parse(n.d)).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}))+'</time><span>'+b(n.t||n.titulo||"")+'</span></li>').join("")+'</ul>':''),
        "v827-eua");
    }
    /* v825: níveis levados ao plano (Técnico / Fibonaccing) no Meu dia; tocar no ativo abre o Terminal. */
    function v825Niveis() {
      const lista=f(()=>window.DiarioNiveis?.list()||[],[]).slice(0,6);
      if(!lista.length)return "";
      const fx=v=>v==null?"—":q(v);
      return C("target","Níveis do plano",'<span class="v4-muted">'+lista.length+' ativo(s)</span>',
        '<table class="v825-niv"><thead><tr><th>Ativo</th><th>Entrada</th><th>Stop</th><th>Alvos</th></tr></thead><tbody>'+
        lista.map(n=>'<tr><td><button type="button" data-dt815="foco" data-tk="'+b(n.ticker)+'">'+b(n.ticker)+'</button></td><td>'+fx(n.entrada)+
          '</td><td class="v-neg">'+fx(n.stop)+'</td><td class="v-pos">'+(n.alvos||[]).map(fx).join(" · ")+'</td></tr>').join("")+
        '</tbody></table>');
    }
    function v811PlanoExecucao(dia,registro) {
      const api=window.DiarioPlanoExecucao;
      if(!api)return '';
      const cmp=f(()=>api.compararPlano(registro||{},ct(),dia,{pl:R,risco:Nt}),null);
      if(!cmp)return '';
      const cor={ok:'v811-ok',desvio:'v811-desvio',info:'v811-info',sem_dados:'v811-sem'};
      const rot={ok:'No plano',desvio:'Desvio',info:'Referência',sem_dados:'Dados insuficientes'};
      const tabela=(linhas)=>'<div class="v811-pxe-tab" role="table"><div class="v811-pxe-row v811-pxe-head" role="row"><span role="columnheader">Item</span><span role="columnheader">Planejado</span><span role="columnheader">Executado</span><span role="columnheader">Diferença</span><span role="columnheader">Evidência</span></div>'+
        linhas.map(l=>{const c=(v,lbl,cls)=>'<span role="cell" data-l="'+lbl+'" class="'+cls+(v==='—'||v===''?' v811-vazio':'')+'">'+b(v)+'</span>';
          return '<div class="v811-pxe-row '+cor[l.status]+'" role="row"><span role="cell"><b>'+b(l.item)+'</b><em>'+rot[l.status]+'</em></span>'+c(l.planejado,'Planejado','num')+c(l.executado,'Executado','num')+c(l.diferenca,'Diferença','')+c(l.evidencia,'Evidência','mut')+'</div>';}).join('')+'</div>';
      const trades=cmp.porTrade.map(t=>'<details class="v811-pxe-trade"><summary><b>'+b(t.ativo)+'</b>'+(t.setup?' · '+b(t.setup):'')+(t.aberta?' · <span class="v810-open">Aberta</span>':'')+
        ' <span class="mut">'+t.linhas.filter(l=>l.status==='desvio').length+' desvio(s)</span></summary>'+tabela(t.linhas)+'</details>').join('');
      return '<section class="v811-pxe v4-card" aria-label="Plano versus execução"><div class="v4-head"><h2>'+p("list",20)+' Plano × execução</h2><span class="v4-muted">'+
        (cmp.plano.congelado?'Plano congelado às '+b(new Date(cmp.plano.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})):'Plano atual (preparo não concluído — pode ter sido editado)')+
        '</span></div><p class="v811-pxe-sum">'+(cmp.operacoes?cmp.desvios+' desvio(s) em '+cmp.operacoes+' operação(ões).':'Nenhuma operação registrada nesta data.')+'</p>'+
        tabela(cmp.sessao)+(trades?'<h3 class="v811-pxe-sub">Por operação</h3>'+trades:'')+'</section>';
    }
    function Ft() {
      if(window.DiarioSessoes)return v810FaseAtiva();
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
            ["import", "Importar", () => !1],
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
      // A terceira aba existe desde a primeira pintura, sem injeção após render.
      if (t === "ops") {
        l.import = 1;
        e.dataset.v4grupos = Object.keys(l).join(",");
      }
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
      [...t.children].forEach((l) => {
        const s = l.getAttribute("data-v4g");
        if (!s || s === "*") return;
        let o = a ? s !== a : !0;
        o && l.remove();
      });
      const n = v.createElement("div");
      a &&
        (t.querySelectorAll(`[data-v4g="${a}"] details`).forEach((l) => {
          l.dataset.v427 || ((l.open = !0), (l.dataset.v427 = "1"));
        }),
        (n.className = "v4-tools-head v4-viewhead"),
        (n.innerHTML = `<button type="button" class="v4-back" data-v4homeback="1">${p("left", 18)}<span>Início</span></button><h2>${p(Dt[a][1], 20)}<span>${Dt[a][0]}</span></h2>`),
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
    /* v598: risco disponível do dia (mesma conta do Início) para a calculadora de posição e outras telas. */
    function riscoHoje598() {
      const t = V(),
        a = lt(pt(t), R),
        o = ne(),
        i = St() ?? o?.lim ?? null;
      return {
        disponivel: o ? o.rest : i != null ? Math.max(0, i - Math.max(0, -a)) : null,
        limite: i,
        resultadoDia: a,
        capital: yt(),
      };
    }
    window.DiarioRisco = { hoje: riscoHoje598, status: ne };
    /* v598 — Impacto emocional no resultado: estado registrado antes das 09:00 (Meu dia) × P&L dos trades do dia. */
    const EMO598 = [["calmo", "Calmo"], ["focado", "Focado"], ["ansioso", "Ansioso"], ["cansado", "Cansado"], ["euforico", "Eufórico"]];
    function impactoEmocional598() {
      const grupos = {};
      Object.entries(f(() => S.days || {}, {})).forEach(([dia, D]) => {
        const emo = D && D.emocao,
          em = D && D.emocaoEm ? new Date(D.emocaoEm) : null;
        if (!emo || !em || isNaN(em) || em.getHours() >= 9) return;
        const tr = pt(dia);
        if (!tr.length) return;
        const g = (grupos[emo] = grupos[emo] || { dias: 0, trades: 0, ganhos: 0, pl: 0 });
        (g.dias++, (g.trades += tr.length), (g.ganhos += tr.filter((x) => R(x) > 0).length), (g.pl += lt(tr, R)));
      });
      const linhas = EMO598.filter(([k]) => grupos[k]).map(([k, nome]) => {
        const g = grupos[k],
          ac = g.trades ? Math.round((g.ganhos / g.trades) * 100) : 0,
          med = g.pl / g.dias;
        return `<tr><th scope="row">${nome}</th><td>${g.dias}</td><td>${ac}%</td><td class="${L(med)}">${j(med)}</td><td class="${L(g.pl)}">${j(g.pl)}</td></tr>`;
      });
      return `<section class="v4-card v598-emocard" aria-label="Impacto emocional no resultado"><div class="v598-emocard-head"><h3>Impacto Emocional no Resultado</h3><small>Estado marcado antes das 09:00 × resultado líquido do dia</small></div>${
        linhas.length
          ? `<table class="v598-emotab"><thead><tr><th scope="col">Estado</th><th scope="col">Dias</th><th scope="col">Acerto</th><th scope="col">Média/dia</th><th scope="col">Total</th></tr></thead><tbody>${linhas.join("")}</tbody></table>`
          : '<p class="v4-empty">Marque como você está no Meu dia antes das 09:00 nos dias em que operar. O cruzamento aparece a partir do primeiro dia com trades.</p>'
      }</section>`;
    }
    function poe598() {
      if (f(() => tab, "") !== "stats") return;
      const app = document.getElementById("app"),
        perf = app && app.querySelector(".v4-card.v4-perf");
      if (!perf || app.querySelector(".v598-emocard")) return;
      perf.insertAdjacentHTML("afterend", impactoEmocional598());
    }
    {
      const reg598 = () => !!(window.TraderUI?.onRender && (window.TraderUI.onRender("v598-emocional", poe598), 1));
      if (!reg598()) {
        let n = 0;
        const tm = setInterval(() => (reg598() || ++n > 40) && clearInterval(tm), 250);
      }
    }
    window.DiarioEmocional = { impacto: impactoEmocional598 };
    document.addEventListener("click", (ev) => {
      const bt = ev.target.closest?.("[data-v598-reduz]");
      if (!bt) return;
      f(() => {
        const dia = bt.dataset.v598Reduz,
          lim = St();
        if (!lim) return;
        const base = (S.days[dia] = S.days[dia] || {}),
          D = Tt() ? (base.us = base.us || {}) : base;
        ((D.maxP = Math.round((lim / 2) * 100) / 100), (D.maxP598 = lim), (D.u = Date.now()), save?.(), render());
        typeof toast == "function" && toast("Risco máximo de hoje reduzido para " + G(D.maxP));
      });
    });
    function le() {
      const t = V(),
        e = pt(t).filter(g => !Gt(g)),
        a = lt(e, R),
        r = jt(),
        n = pt().filter(c => !Gt(c) && nt(c) >= r && nt(c) <= t),
        l = lt(n, R),
        s = yt(),
        o = ne(),
        u = Ft(),
        i = St() ?? o?.lim ?? null,
        h = o ? o.rest : i != null ? Math.max(0, i - Math.max(0, -a)) : null,
        M = v810Manual ? {pre:"Visão pré-mercado",pregao:"Visão do pregão",pos:"Visão pós-mercado"}[u] :
          ["b3_fechada","cripto_macro"].includes(window.DiarioSessoes?.context()?.mode) ? "B3 fechada" : {
          pre: "Pré-abertura",
          pregao: "Pregão aberto",
          pos: "Pregão encerrado",
          fechado: "Mercado fechado",
        }[u],
        y = `<div class="v4-kpis">
    <div><small>Capital</small><strong>${s != null ? G(s) : '<button type="button" class="v4-inline" data-dt414-go="painel">Configurar</button>'}</strong>${s != null ? `<em class="v598-capdet">${f(() => [["D", "Day"], ["S", "Swing"], ["O", "Opções"]].map(([k, n]) => [n, capCalc(k)]).filter(([, c]) => c).map(([n, c]) => n + " " + G(c.at)).join(" · "), "")}</em>` : ""}</div>
    <div><small>P&amp;L do dia</small><strong class="${L((window.vivoDia?vivoDia(a):a))}" data-v568-base="${a}">${j((window.vivoDia?vivoDia(a):a))}</strong>${window.vivoNota?vivoNota():""}<em class="${L(a)}">${E(a) != null ? "(" + Q(E(a)) + ")" : e.length + " encerrado(s)"}</em></div>
    <div><small>P&amp;L da semana</small><strong class="${L(l)}">${j(l)}</strong><em class="${L(l)}">${E(l) != null ? "(" + Q(E(l)) + ")" : n.length + " trade(s)"}</em></div>
    <div><small>Risco disponível</small><strong>${h != null ? G(h) : "—"}</strong><em>${h != null && E(h) != null ? "(" + _(E(h)) + "% do capital)" : "limite de perda do dia"}</em></div></div>`,
        P = o
          ? `<button type="button" class="v4-gate v4-gate-${o.st}" data-v4tool="hoje" data-v4route="home" data-v4scroll="1">${p(o.st === "g" ? "shield" : "alert", 18)}<b>${o.label}</b><span>${b(o.why)}</span>${p("right", 16)}</button>`
          : "",
        $ = `<div class="v4-phase dt975-phase" role="group" aria-label="Fase do dia">${[
          ["pre", "Pré"],
          ["pregao", "Pregão"],
          ["pos", "Pós"],
        ]
          .map(
            ([c, w]) =>
              `<button type="button" data-v4phase="${c}" class="${u === c ? "on" : ""}" ${u === c ? 'aria-current="true"' : ""}><i></i>${w}</button>`,
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
      let x = f(() => (MKT.items || []).filter(v810NoticiaValida).slice(0, 3), []),
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
          c && Array.isArray(c.items) && c.ts && Date.now()-c.ts < 48*3600000 && ((x = c.items.filter(v810NoticiaValida).slice(0,3)), (m = c.ts));
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
                `<li><i class="${w.d1 > 0 ? "dot-g" : "dot-r"}"></i><span><b>${b(c)}</b> ${w.d1 > 0 ? "subiu" : "caiu"} ${Q(w.d1)} ${["IBOV","PETR4","USD/BRL"].includes(c) && f(() => window.DiarioSessoes.session("B3").state !== "regular", !1) ? "no último pregão" : "hoje"}</span></li>`,
            ).join("")
          : '<li class="v4-none">Sem movimentos fortes nas cotações recebidas.</li>',
        K = C(
          "cal",
          B ? "Agenda · próximos eventos" : "Agenda do dia",
          st("Ver agenda completa", 'data-v4mkt="ag"'),
          `<ul class="v4-list">${ot}</ul>`,
        ),
        brief30Prompt = (() => {
          const term = f(() => window.TermometroAbertura670?.capturar?.(), null);
          const jrnTit = f(() => JRN?.v?.manchete?.titulo || "", "");
          const jrnWin = f(() => JRN?.v?.radar_mesa?.win || "", "");
          const jrnWdo = f(() => JRN?.v?.radar_mesa?.wdo || "", "");
          const dHoje = f(() => S.days?.[t] || {}, {});
          const emo = dHoje.emocao || "não informado";
          const movs = X.map(([c, w]) => `${c} ${Q(w.d1)}`).join(", ");
          return `Faça meu Briefing 30s da sessão (${M}, ${t}) em 3 bullets curtos e diretos (1. Viés macro e abertura WIN/WDO · 2. Gatilhos/agenda crítica de hoje · 3. Regra de disciplina para meu estado atual): ` +
            (term && term.winPct != null ? `Termômetro WIN ${term.winPct >= 0 ? "+" : ""}${term.winPct.toFixed(2)}%${term.wdoPct != null ? `, WDO ${term.wdoPct >= 0 ? "+" : ""}${term.wdoPct.toFixed(2)}%` : ""}. ` : "") +
            (jrnTit ? `Jornal do Pregão: "${jrnTit}". ` : "") +
            (jrnWin ? `Radar WIN: "${jrnWin}". ` : "") +
            (jrnWdo ? `Radar WDO: "${jrnWdo}". ` : "") +
            (movs ? `Movimentos fortes: ${movs}. ` : "") +
            `Meu estado emocional: ${emo}. P&L do dia: ${j(a)} (${e.length} trades). Sem clichês.`;
        })(),
        $t = C(
          "spark",
          'Central Áurea <span class="v4-iachip">IA</span>',
          st("Perguntar à IA", 'data-v4ia="1"'),
          `<div class="dt975-ia-acts">
            <button type="button" class="dt975-pill-gold" data-dt978-ia="brief30">✦ Briefing 30s</button>
            <button type="button" class="dt975-pill-glass" data-v4mkt="jr">📰 Radar da Mesa</button>
          </div>
          <div data-intel-content class="sm"></div><details style="margin-top:10px;border-top:1px solid var(--bd);padding-top:8px"><summary class="mut sm" style="cursor:pointer;font-weight:600">Atalhos rápidos (Terminal, Risco e Estatísticas)</summary><div class="v4-ia" style="margin-top:8px"><div class="v4-ialist">
    <button type="button" data-dt393-route="term">${p("crosshair", 20)}<span><b>Radar global e oportunidades</b><small>Fluxo, juros, índices e ativos no Terminal.</small></span>${p("right", 16)}</button>
    <button type="button" data-dt393-route="ops">${p("shield", 20)}<span><b>Revisar trades e risco</b><small>Posições abertas, stops e risco consumido.</small></span>${p("right", 16)}</button>
    <button type="button" data-dt393-route="stats">${p("up", 20)}<span><b>Avaliar resultados e consistência</b><small>Curva, win rate e pontos de atenção.</small></span>${p("right", 16)}</button></div></div></details>`,
          "v4-iacard dt975-iacard",
        );
      window.__dt975Brief30Prompt = brief30Prompt;
      /* v981: Lembrete discreto de Backup JSON 1 toque se houver trades e > 14 dias sem backup. */
      const bkp981 = (() => {
        try {
          const nTr = typeof S !== "undefined" && Array.isArray(S?.trades) ? S.trades.length : 0;
          if (!nTr || sessionStorage.getItem("dt981-bkp-hide") === "1") return "";
          const last = Number(localStorage.getItem("dt981-last-backup") || 0);
          const dias = last ? Math.floor((Date.now() - last) / 86400000) : 999;
          if (dias < 14) return "";
          const msg = last ? `Último backup há ${dias} dias` : `${nTr} trade(s) sem backup local`;
          return `<div class="dt981-bkp"><span>💾 <b>Backup de segurança</b> · ${b(msg)}</span><div class="dt981-bkp-acts"><button type="button" class="dt975-btn-gold" data-dt981-bkp="1">Baixar JSON</button><button type="button" class="dt981-bkp-x" data-dt981-bkp="hide" aria-label="Dispensar aviso">✕</button></div></div>`;
        } catch {
          return "";
        }
      })();
      /* v975: Início Liquid Glass 3D — fase compacta, KPIs 3D, Termômetro Hero, Central Áurea IA (Briefing 30s + Radar), EUA/ADRs e Agenda. */
      return `<div class="v4-page v4-home v810-home v829-home dt975-home" data-v810-phase="${u}">
    ${bkp981}
    ${v810Seletor($)}
    ${v829MercadoKpis()}
    <div class="ui-split v829-split"><div class="ui-main">${$t}${v827Eua()}${K}</div><aside class="ui-aside">${u!=="pos"?v825Niveis():""}</aside></div>
    </div>`;
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
        if(window.DiarioSessoes)return window.DiarioSessoes.context().phase;
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
      /* v975: .v4-emo agora renderiza nativamente no fluxo da Rotina, sem MutationObserver pós-paint nem salto de layout. */
      f(() =>
        setInterval(() => {
          if (document.hidden) return;
          for (const g of document.querySelectorAll("#app:not(.v503-fantasma) [data-v589-abertura]")) {
            const N = +g.dataset.v589Abertura;
            if (N - Date.now() <= 0) {
              if (!g.dataset.done) { g.dataset.done = "1"; f(() => render()); }
            } else {
              const elB = g.querySelector("b");
              if (elB) elB.textContent = cont589(N);
            }
          }
        }, 1e3),
      ));

    /* v789: editor no próprio Meu dia; não remonta abas antigas do plano. */
    let planoAberto789 = false;
    function planoIntegrado789(data, dia) {
      const p = dia.pl2 || {}, cl = dia.cl || {};
      const esc789 = (x) => b(x == null ? "" : String(x));
      const field = (key, label, val, numeric = true) => '<label style="min-width:0;display:block;font-size:13px">' +
        label + '<input data-v789-field="' + key + '" value="' + esc789(val) + '" ' +
        (numeric ? 'type="number" inputmode="decimal" min="0" step="any"' : 'type="text"') +
        ' style="width:100%;min-height:44px;font-size:16px;margin-top:4px"></label>';
      const option = (value, label, selected) => '<option value="' + value + '"' +
        (selected === value ? ' selected' : '') + '>' + label + '</option>';
      const modes = [["dt","Day trade"],["sw","Swing"],["op","Opções"],["ex","EUA/Forex"]];
      const lack = typeof preparacaoPendente789 === "function" ? preparacaoPendente789(dia) : [];
      const checklist = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
        modes.map(([key, label]) => '<button type="button" class="btn s' + ((p.mods||[]).includes(key)?' on':'') +
          '" style="min-height:44px" data-v789-mode="' + key + '" aria-pressed="' + ((p.mods||[]).includes(key)) + '">' + label + '</button>').join("") + '</div>';
      return '<details id="v789-plano" data-v789-day="' + esc789(data) + '" class="v789-plano" ' +
        (planoAberto789 ? 'open ' : '') +
        'style="background:var(--dt-s1);border-top:1px solid #1E232E;border-bottom:1px solid #1E232E;padding:12px 14px;color:inherit">' +
        '<summary style="cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:space-between;color:#D4A017;font-weight:700">Editar preparação do dia <span>' +
        (dia.ckok ? 'Concluída' : lack.length ? lack.length + ' pendência(s)' : 'Pronto para concluir') + '</span></summary>' +
        '<div class="g2" style="margin-top:10px;gap:8px">' +
        field("metaDia","Meta diária (R$)",dia.metaDia) +
        field("maxP","Perda máxima (R$)",dia.maxP) +
        field("max","Máximo de trades",p.max) +
        '<label style="font-size:13px">Viés do dia<select data-v789-field="vies" style="min-height:44px;font-size:16px;width:100%;margin-top:4px">' +
        [["","Escolher"],["compra","Compra"],["venda","Venda"],["neutro","Neutro"]].map(([v,t])=>option(v,t,p.vies||"")).join("") +
        '</select></label></div>' +
        '<div style="margin-top:10px;font-size:13px;font-weight:700">Foco operacional</div>' + checklist +
        '<label style="display:block;margin-top:10px;font-size:13px">Como estou hoje? (1 a 5)<select data-v789-field="estado" style="min-height:44px;width:100%;font-size:16px">' +
        [["","Escolher"],["1","1 — Muito mal"],["2","2 — Mal"],["3","3 — Neutro"],["4","4 — Bem"],["5","5 — Muito bem"]].map(([v,t])=>option(v,t,String(dia.estado||""))).join("") +
        '</select></label>' +
        '<label style="display:flex;align-items:center;min-height:44px;gap:8px;font-size:14px;margin-top:8px"><input type="checkbox" data-v789-stop ' +
        (cl.p_stop?'checked ':'') + '> Confirmei que definirei stop e alvo antes das entradas</label>' +
        '<label style="display:block;font-size:13px;margin-top:8px">Cenário e níveis (opcional)<textarea data-v789-field="txt" style="width:100%;min-height:70px;font-size:16px">' + esc789(p.txt) + '</textarea></label>' +
        '<p style="font-size:13px;margin:10px 0;color:#aeb3bd">' + (lack.length ? 'Pendente: ' + esc789(lack.join(", ")) : 'Dados obrigatórios preenchidos. Confira antes de concluir.') + '</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn s" style="min-height:44px" data-v789-action="save">Salvar plano</button>' +
        '<button type="button" class="btn" style="min-height:44px" data-v789-action="complete">' +
        (dia.ckok ? 'Preparação concluída' : 'Concluir preparação do dia') + '</button></div></details>';
    }
    function salvaPlano789(completar = false) {
      const root = v.querySelector("#v789-plano");
      if (!root) return false;
      const data = root.dataset.v789Day;
      if (data !== ft() || data < V()) return false;
      const base = S.days[data] ?? (S.days[data] = { chk: {} });
      const dia = Tt() ? (base.us ?? (base.us = {})) : base;
      const p = dia.pl2 ?? (dia.pl2 = {});
      const anterior = JSON.stringify({metaDia:dia.metaDia,maxP:dia.maxP,estado:dia.estado,pl2:p,cl:dia.cl});
      const value = (key) => root.querySelector('[data-v789-field="' + key + '"]')?.value ?? "";
      for (const key of ["metaDia","maxP"]) {
        const n = Number(value(key));
        dia[key] = value(key).trim() && n > 0 && Number.isFinite(n) ? n : "";
      }
      const max = Number(value("max"));
      p.max = Number.isInteger(max) && max > 0 ? max : 0;
      p.vies = value("vies");
      p.txt = value("txt");
      p.mods = [...root.querySelectorAll("[data-v789-mode].on")].map(el => el.dataset.v789Mode);
      dia.estado = Number(value("estado")) || 0;
      dia.cl ??= {};
      dia.cl.p_meta = Number(dia.metaDia) > 0;
      dia.cl.p_limite = Number(dia.maxP) > 0;
      dia.cl.p_stop = !!root.querySelector("[data-v789-stop]")?.checked;
      const pendencias = typeof preparacaoPendente789 === "function" ? preparacaoPendente789(dia) : [];
      if (!completar && dia.ckok && anterior !== JSON.stringify({metaDia:dia.metaDia,maxP:dia.maxP,estado:dia.estado,pl2:p,cl:dia.cl})) dia.ckok = 0;
      if (completar && pendencias.length) {
        const p = root.querySelector("p");
        if (p) p.textContent = "Falta: " + pendencias.join(", ");
      } else if (completar) {
        dia.ckok = Date.now();
        /* v811: plano congelado na conclusão do preparo, para o Plano × Execução do pós-mercado
           comparar com o que foi decidido antes do pregão (não com edições posteriores). */
        dia.planoSnap = { em: new Date().toISOString(), metaDia: dia.metaDia, maxP: dia.maxP, max: p.max, vies: p.vies, mods: [...(p.mods || [])], txt: p.txt, stopConfirmado: !!dia.cl.p_stop };
      }
      dia.u = Date.now();
      save();
      planoAberto789 = true;
      render();
      if (completar && pendencias.length && typeof toast === "function")
        toast("Preencha: " + pendencias.join(", "));
      if (completar && !pendencias.length && typeof toast === "function")
        toast("Preparo concluído. Bom pregão!");
      return pendencias.length === 0;
    }
    v.addEventListener("click", (ev) => {
      const abrir = ev.target.closest?.('[data-v4tool="plano"][data-v4route="dia"]');
      if (abrir) {
        ev.preventDefault(); ev.stopImmediatePropagation();
        planoAberto789 = true;
        const root = v.querySelector("#v789-plano");
        if (root) { const panel=root.closest(".v810-more"); if(panel)panel.open=true; root.open = true; root.scrollIntoView({behavior:"smooth",block:"center"}); }
        return;
      }
      const mode = ev.target.closest?.("#v789-plano [data-v789-mode]");
      if (mode) {
        ev.preventDefault(); ev.stopImmediatePropagation();
        mode.classList.toggle("on");
        mode.setAttribute("aria-pressed",String(mode.classList.contains("on")));
        return;
      }
      const save = ev.target.closest?.("#v789-plano [data-v789-action]");
      if (save) {
        ev.preventDefault(); ev.stopImmediatePropagation();
        salvaPlano789(save.dataset.v789Action === "complete");
      }
    }, true);

    /* v932: Checklist operacional profissional (Go/No-Go, críticas, carimbo de hora, organização inline e modelos). */
    let chkOrg932 = false;
    const CHK_MOD932 = {
      win: {
        nome: "Day Trade (WIN/WDO)",
        itens: [
          ["pre", 1, "Agenda econômica BR/EUA e horários de dados conferidos"],
          ["pre", 1, "Limite de perda diária e nº máximo de trades definidos"],
          ["pre", 1, "Estado emocional e sono avaliados (sem pressa ou euforia)"],
          ["pre", 0, "Regiões de ajuste, máxima/mínima anterior e VWAP marcadas"],
          ["during", 1, "Entrar apenas em setup escrito com stop técnico no book"],
          ["during", 1, "Parar imediatamente ao atingir limite de perda ou 2 stops seguidos"],
          ["post", 1, "Registrar todas as operações e quebras de regra antes de fechar o Profit"],
        ],
      },
      swing: {
        nome: "Swing Trade (Ações)",
        itens: [
          ["pre", 1, "Tendência do IBOV/setor e volume confirmados no diário"],
          ["pre", 1, "Tamanho da posição calculado pelo risco máximo em R$ (stop definido)"],
          ["pre", 0, "Data de balanço e ex-dividendos conferidos para evitar gap surpresa"],
          ["during", 1, "Respeitar stop técnico e parciais sem mover stop contra a operação"],
          ["post", 0, "Revisar stops móveis das posições abertas após o fechamento"],
        ],
      },
      opcoes: {
        nome: "Opções",
        itens: [
          ["pre", 1, "Liquidez do strike (spread bid/ask) e dias até o vencimento conferidos"],
          ["pre", 1, "Perda máxima da estrutura travada e margem garantida"],
          ["pre", 0, "Volatilidade implícita (IV) e agenda de balanço do ativo-objeto checadas"],
          ["during", 1, "Não dobrar mão em opção OTM perto do vencimento"],
          ["post", 0, "Acompanhar delta/theta e ponto de rolagem ou encerramento"],
        ],
      },
      fiis: {
        nome: "FIIs & Aporte Mensal",
        itens: [
          ["pre", 1, "P/VP, DY sustentável e spread sobre NTN-B conferidos"],
          ["pre", 1, "Vacância, alavancagem e concentração de inquilinos/CRIs revisados"],
          ["during", 0, "Aportar conforme meta de alocação (sem concentrar > 15% em 1 fundo)"],
          ["post", 0, "Atualizar tese ou alerta de preço-teto se houve fato relevante"],
        ],
      },
    };
    function horaBrt932() {
      try {
        return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
      } catch {
        return new Date().toTimeString().slice(0, 5);
      }
    }
    function listaRegras932() {
      if (Tt()) {
        if (!Array.isArray(S.rulesUS)) S.rulesUS = Array.isArray(S.rules) ? S.rules.map((x) => ({ ...x })) : [];
        return S.rulesUS;
      }
      if (!Array.isArray(S.rules)) S.rules = [];
      return S.rules;
    }
    f(() =>
      document.addEventListener("click", (ev) => {
        const el = ev.target.closest?.("[data-chk932-org],[data-chk932-add],[data-chk932-crit],[data-chk932-del],[data-chk932-mod]");
        if (!el || el.closest(".v503-fantasma")) return;
        ev.preventDefault();
        const ds = el.dataset;
        if ("chk932Org" in ds) {
          chkOrg932 = !chkOrg932;
          f(() => render());
          return;
        }
        const regras = listaRegras932();
        if ("chk932Add" in ds) {
          const box = el.closest(".v932-add");
          const inp = box?.querySelector("[data-chk932-txt]");
          const crit = !!box?.querySelector("[data-chk932-ncrit]")?.checked;
          const texto = String(inp?.value || "").trim();
          if (!texto) { inp?.focus(); return; }
          const fase = ds.chk932Add || "pre";
          const cat = fase === "pre" ? 0 : fase === "during" ? 1 : 3;
          regras.push({ id: typeof uid === "function" ? uid() : "r" + Date.now(), cat, t: texto, phase: fase, crit: crit ? 1 : 0, u: Date.now() });
          if (inp) inp.value = "";
          f(() => save());
          f(() => render());
          return;
        }
        if ("chk932Crit" in ds) {
          const item = regras.find((x) => String(x.id) === String(ds.chk932Crit));
          if (item) {
            item.crit = item.crit ? 0 : 1;
            item.u = Date.now();
            f(() => save());
            f(() => render());
          }
          return;
        }
        if ("chk932Del" in ds) {
          const idx = regras.findIndex((x) => String(x.id) === String(ds.chk932Del));
          if (idx >= 0) {
            regras.splice(idx, 1);
            f(() => save());
            f(() => render());
          }
          return;
        }
        if ("chk932Mod" in ds) {
          const mod = CHK_MOD932[ds.chk932Mod];
          if (!mod) return;
          const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
          const ex = new Set(regras.map((x) => norm(x.t)));
          let nAdd = 0;
          for (const [fase, crit, texto] of mod.itens) {
            if (ex.has(norm(texto))) continue;
            ex.add(norm(texto));
            const cat = fase === "pre" ? 0 : fase === "during" ? 1 : 3;
            regras.push({ id: (typeof uid === "function" ? uid() : "r" + Date.now()) + nAdd, cat, t: texto, phase: fase, crit, u: Date.now() });
            nAdd++;
          }
          if (nAdd) f(() => save());
          f(() => render());
        }
      }),
    );
    f(() =>
      document.addEventListener("change", (ev) => {
        const inp = ev.target?.closest?.("input[data-chk]");
        if (!inp || inp.closest(".v503-fantasma")) return;
        setTimeout(() => {
          try {
            const dia = ft(), regs = Et(), dObj = S.days?.[dia];
            if (!dObj) return;
            const chk = (Tt() ? dObj.us?.chk : dObj.chk) || {};
            const target = Tt() ? (dObj.us = dObj.us || {}) : dObj;
            target.chkAt = target.chkAt || {};
            let mudou = false;
            for (const ph of ["pre", "during", "post"]) {
              const itens = regs.filter((g) => at(g) === ph);
              const completo = itens.length > 0 && itens.every((g) => chk[g.id]);
              if (completo && !target.chkAt[ph]) { target.chkAt[ph] = horaBrt932(); mudou = true; }
              else if (!completo && target.chkAt[ph]) { delete target.chkAt[ph]; mudou = true; }
            }
            if (mudou) { f(() => save()); f(() => render()); }
          } catch {}
        }, 0);
      }),
    );

    function ie() {
      const t = ft(),
        e = ut(t),
        a = pt(t).filter(g => !Gt(g)),
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
        H = qt || ({pre:"pre",pregao:"during",pos:"post"}[Ft()] || fase589()),
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
        /* v598 — trava preventiva: ansioso ou cansado no pré-mercado → sugere reduzir o risco máximo do dia em 50%. */
        trava598 = f(() => {
          if (!["ansioso", "cansado"].includes(dRaiz.emocao) || !hoje589) return "";
          const reduzido = +(Tt() ? (dRaiz.us || {}).maxP598 : dRaiz.maxP598) || 0,
            lim = reduzido || St(),
            nomeE = (EMO589.find(([g]) => g === dRaiz.emocao) || [])[1] || dRaiz.emocao;
          return reduzido
            ? `<div class="v598-trava" role="note"><b>${b(nomeE)}:</b> risco máximo de hoje reduzido de ${G(reduzido)} para ${G(St())}.</div>`
            : `<div class="v598-trava" role="note"><b>${b(nomeE)}:</b> considere reduzir o risco máximo de hoje em 50%${lim ? ` (de ${G(lim)} para ${G(lim / 2)})` : ""}.${lim ? ` <button type="button" data-v598-reduz="${t}">Reduzir hoje</button>` : ""}</div>`;
        }, ""),
        emo589 = `<section class="v4-emo" aria-label="Estado emocional agora"><div class="v4-emo-head"><b>Como você está agora?</b>${abre589 ? `<span class="v4-countdown" data-v589-abertura="${abre589}" role="timer" aria-label="Tempo até a abertura do pregão">Abertura em <b>${cont589(abre589)}</b></span>` : ""}</div><div class="v4-emo-row" role="radiogroup" aria-label="Estado emocional">${EMO589.map(([g, N]) => `<button type="button" role="radio" aria-checked="${dRaiz.emocao === g}" class="${dRaiz.emocao === g ? "on" : ""}" data-v589-emo="${g}" data-v589-dia="${t}">${N}</button>`).join("")}</div>${trava598}${hist589}</section>`,
        critPre = preL.filter((g) => g.crit),
        critPend = critPre.filter((g) => !A[g.id]).length,
        emoAlerta = ["ansioso", "cansado"].includes(dRaiz.emocao),
        chkAt = (e && e.chkAt) || {},
        semaforo = (() => {
          if (!preL.length) return { cls: "am", txt: "SEM REGRAS", sub: "Adicione ou escolha um modelo em Organizar" };
          if (critPre.length ? critPend > 0 : !preOk)
            return {
              cls: critPend > 0 || emoAlerta ? "no" : "am",
              txt: critPend > 0 ? "BLOQUEADO" : "ATENÇÃO",
              sub: critPend > 0
                ? `${critPend} regra(s) crítica(s) pendente(s) no Pré`
                : `Faltam ${preL.length - preL.filter((g) => A[g.id]).length} item(ns) no Pré`,
            };
          if (!preOk || emoAlerta)
            return {
              cls: "am",
              txt: "ATENÇÃO",
              sub: emoAlerta ? "Críticas OK, mas estado emocional pede mão reduzida" : "Críticas OK · conclua os itens opcionais do Pré",
            };
          return {
            cls: "ok",
            txt: "LIBERADO",
            sub: chkAt.pre ? `Pré 100% concluído às ${chkAt.pre}` : "Pré-mercado 100% concluído",
          };
        })(),
        statsChk932 = f(() => {
          if (!preL.length) return "";
          const dias = Object.keys(S.days || {}).sort().reverse();
          let streak = 0, sQuebrou = false;
          const okRes = [], incRes = [];
          for (const dt of dias) {
            const dObj = Tt() ? S.days[dt]?.us : S.days[dt];
            const ck = dObj?.chk || {};
            const full = preL.every((g) => ck[g.id]);
            if (!sQuebrou) {
              if (full) streak++;
              else if (dt !== t) sQuebrou = true;
            }
            const trs = pt(dt).filter((g) => !Gt(g));
            if (trs.length) {
              const res = lt(trs, R);
              (full ? okRes : incRes).push(res);
            }
          }
          const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
          const partes = [];
          if (streak > 0) partes.push(`🔥 <b>${streak}</b> dia${streak > 1 ? "s" : ""} seguido${streak > 1 ? "s" : ""}`);
          if (okRes.length >= 2 && incRes.length >= 2) {
            const mOk = avg(okRes), mInc = avg(incRes);
            partes.push(`Pré 100%: <b class="${L(mOk)}">${j(mOk)}</b>/dia · Incompleto: <b class="${L(mInc)}">${j(mInc)}</b>/dia`);
          } else if (okRes.length + incRes.length > 0) {
            partes.push(`${okRes.length} pregão(ões) com Pré 100% registrado`);
          }
          return partes.length ? `<div class="sm mut" style="margin:6px 0 8px;font-size:12px;line-height:1.45">${partes.join(" · ")}</div>` : "";
        }, ""),
        Y = P.map((g) => {
          const isC = !!g.crit;
          const controls = chkOrg932
            ? `<div style="display:flex;align-items:center;gap:4px;flex-shrink:0"><button type="button" data-chk932-crit="${b(g.id)}" title="Marcar como crítica (trava)" style="min-height:40px;padding:2px 7px;border-radius:6px;border:1px solid ${isC ? "rgba(201,166,107,.65)" : "var(--bd)"};background:${isC ? "rgba(201,166,107,.16)" : "transparent"};color:${isC ? "var(--gold,#C9A66B)" : "var(--mut)"};font-size:12px;cursor:pointer">★</button><select data-dt393-rule-phase="${b(g.id)}" aria-label="Fase da regra" style="min-height:28px;font-size:11.5px"><option value="pre" ${at(g) === "pre" ? "selected" : ""}>Pré</option><option value="during" ${at(g) === "during" ? "selected" : ""}>Durante</option><option value="post" ${at(g) === "post" ? "selected" : ""}>Pós</option></select><button type="button" data-chk932-del="${b(g.id)}" aria-label="Apagar regra" style="min-height:28px;padding:2px 7px;border-radius:6px;border:1px solid var(--bd);background:transparent;color:var(--mut);font-size:12px;cursor:pointer">✕</button></div>`
            : (isC ? `<span title="Regra crítica (trava)" style="color:var(--gold,#C9A66B);font-size:12px;flex-shrink:0">★</span>` : "");
          return `<div class="dt393-checkitem v4-check" data-rule-phase="${at(g)}" ${at(g) !== H ? "hidden" : ""} style="gap:8px"><label style="flex:1"><input type="checkbox" data-chk="${b(g.id)}" ${A[g.id] ? "checked" : ""}/><span>${b(g.t)}</span></label>${controls}</div>`;
        }).join(""),
        orgBar932 = chkOrg932
          ? `<div class="v932-add" style="margin-top:10px;padding:10px;border:1px solid var(--bd);border-radius:6px;background:rgba(201,166,107,.04)">
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <input type="text" data-chk932-txt placeholder="Nova regra em ${z[H]}…" style="flex:1;min-width:160px;margin:0;min-height:40px;font-size:16px">
                <label style="display:flex;align-items:center;gap:4px;font-size:12px;margin:0;cursor:pointer"><input type="checkbox" data-chk932-ncrit> ★ Crítica</label>
                <button type="button" class="btn s" data-chk932-add="${H}" style="min-height:36px">+ Adicionar</button>
              </div>
              <details style="margin-top:8px"><summary style="cursor:pointer;font-size:12px;color:var(--gold,#C9A66B);font-weight:600">Modelos prontos por estilo (1 clique)</summary>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${Object.entries(CHK_MOD932).map(([k, m]) => `<button type="button" class="btn s" data-chk932-mod="${k}" style="min-height:40px;font-size:12px">+ ${b(m.nome)}</button>`).join("")}</div>
                <p class="sm mut" style="margin:6px 0 0;font-size:11.5px">Adiciona apenas itens que você ainda não tem (não apaga suas regras atuais).</p>
              </details>
            </div>`
          : "",
        corSem = semaforo.cls === "ok" ? "#10B981" : semaforo.cls === "no" ? "#EF4444" : "#C9A66B",
        bgSem = semaforo.cls === "ok" ? "rgba(16,185,129,.12)" : semaforo.cls === "no" ? "rgba(239,68,68,.12)" : "rgba(201,166,107,.13)",
        bannerSem = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 10px;border-radius:6px;border:1px solid ${corSem};background:${bgSem};margin-bottom:8px"><div><b style="color:${corSem};font-size:12px;letter-spacing:.04em">● ${semaforo.txt}</b><div class="sm" style="margin-top:2px;font-size:12px">${b(semaforo.sub)}${chkAt[H] && H !== "pre" ? ` · ${z[H]} concluído às ${chkAt[H]}` : ""}</div></div><button type="button" class="btn s" data-chk932-org="1" style="min-height:40px;padding:4px 10px;font-size:12px">${chkOrg932 ? "✓ Concluir" : "⚙ Organizar"}</button></div>`,
        U = C(
          "list",
          "Checklist operacional",
          `<button type="button" class="v4-progress" data-dt393-route="regras" aria-label="Editar regras"><span><b>${z[H]}</b> · ${fH} de ${nH.length}</span><i><b style="width:${pH}%"></b></i>${p("right", 16)}</button>`,
          `${bannerSem}${statsChk932}<div class="dt393-phase dt393-phase-inner v4-cphase">${B}</div><div class="dt393-checklist v4-checklist">${Y || '<p class="v4-empty">Nenhuma regra cadastrada. Toque em <b>Organizar</b> para criar ou importar um modelo.</p>'}<div class="dt393-phase-empty v4-empty" ${P.some((g) => at(g) === H) ? "hidden" : ""}>Nenhuma regra nesta fase.</div></div>${orgBar932}`,
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
      const sessao=Ft()==="fechado"?"pos":Ft(),
        textoPlano=String(e.plano||i.txt||"").trim(),
        resumoDia=String(e.resumo||e.bem||"").trim(),
        chamada=sessao==="pre"?(textoPlano||"Plano ainda não preenchido. Confira cenário, regras e limites antes de operar."):
          sessao==="pregao"?"Acompanhe os stops, o checklist e as operações — sem tratar P&L aberto como realizado.":
          (resumoDia||"Revisão ainda não registrada. Compare o plano com a execução antes de encerrar o dia."),
        contexto='<section class="v810-day-context dt975-card" data-intel-content-wrapper="1"><div data-intel-content class="sm">Aguardando contexto verificável do mercado.</div></section>',
        operacoes=v810Operacoes(t,a),
        niveis825=v825Niveis(),
        rotHero=`<section class="v4-card dt975-rot-hero" aria-label="Status e preparo do pregão">
          <div class="dt975-rot-top">
            <span class="dt975-badge ${semaforo.cls}">● ${semaforo.txt}${semaforo.cls === "ok" ? " · Mão Normal" : ""}</span>
            <div class="dt975-date">
              <button type="button" data-a="dprev" aria-label="Dia anterior">‹</button>
              <label><input type="date" data-v4date value="${t}" aria-label="Data da rotina"><span>${t === V() ? "Hoje" : wt(t)}</span></label>
              <button type="button" data-a="dnext" aria-label="Próximo dia">›</button>
            </div>
          </div>
          <h2 class="dt975-rot-title">Preparo do Pregão</h2>
          <p class="dt975-rot-sub">${b(semaforo.sub)}</p>
          <div class="dt975-pbar ${semaforo.cls}" role="progressbar" aria-label="Progresso do checklist" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${I}"><i style="width:${I}%"></i></div>
          <div class="dt975-pmeta"><span><b>${$}/${P.length}</b> regras concluídas</span><span>${I}%</span></div>
          <div class="dt975-rot-acts">
            <button type="button" class="dt975-btn-gold" data-rotina-preparo>Abrir Checklist</button>
            <button type="button" class="dt975-btn-glass" data-chk932-org="1">${chkOrg932 ? "✓ Concluir" : "⚙ Organizar"}</button>
          </div>
        </section>`,
        rotStep=`<div class="dt975-rot-step" role="group" aria-label="Etapas da sessão">
          ${[["pre", "1", "Antes"], ["pregao", "2", "Durante"], ["pos", "3", "Depois"]].map(([fase, num, nome]) =>
            `<button type="button" data-v4phase="${fase}" class="${sessao === fase ? "on" : ""}" aria-pressed="${sessao === fase}"><i>${num}</i><span>${nome}</span></button>`
          ).join("")}
          ${v810Manual ? '<button type="button" class="dt975-step-auto" data-v4auto="1" title="Voltar à fase automática pelo horário">Auto</button>' : ""}
        </div>`,
        base=rotHero+rotStep+turno593+emo589;
      /* v975: Rotina unificada — Hero 3D + Stepper 1-2-3 + Emoção 1 toque in-flow + KPIs 3D + blocos da fase sem sobreposição. */
      const kpis829=v829DiaKpis(r,l,s,u.length),
        lado829='<details class="v810-more"><summary>Plano detalhado e anotações</summary><div class="v810-more-inner">'+planoIntegrado789(t,e)+it+dt+'</div></details>',
        ladoPos829='<details class="v810-more"><summary>Limites e revisão detalhada</summary><div class="v810-more-inner">'+planoIntegrado789(t, e)+dt+'</div></details>';
      const fech60 = (() => {
        if (sessao !== "pos") return "";
        const nTr = Array.isArray(a) ? a.length : 0;
        const wTr = Array.isArray(a) ? a.filter((x) => Number(x.pl || 0) > 0).length : 0;
        const wr = nTr ? Math.round((wTr / nTr) * 100) + "%" : "—";
        const plTxt = (r >= 0 ? "+" : "") + "R$ " + Number(r || 0).toFixed(2).replace(".", ",");
        const emoN = Number(e?.estado || 0);
        const emoTxt = emoN ? emoN + "/5" : "não marcada";
        const jrnMan = f(() => JRN?.v?.manchete?.titulo || "", "");
        const jrnWin = f(() => JRN?.v?.radar_mesa?.win || "", "");
        const prompt60 = `@munger Faça o Fechamento do Dia (60s) cruzando minha execução com o contexto do pregão de hoje (${t}): ` +
          `Trades: ${nTr} (${wTr} ganhos, acerto ${wr}), P&L líquido: ${plTxt}, Estado emocional no checklist: ${emoTxt}. ` +
          (jrnMan ? `Manchete do Jornal do Pregão: "${jrnMan}". ` : "") +
          (jrnWin ? `Radar da Mesa (WIN): "${jrnWin}". ` : "") +
          `Me dê em 3 blocos curtos: 1) O que eu executei bem, 2) Principal ponto de atenção/disciplina para amanhã, 3) Uma regra prática de proteção para a próxima abertura.`;
        window.__dt974Fech60Prompt = prompt60;
        return `<section class="v4-card dt974-fech60" aria-label="Fechamento do Dia 60s">
          <div class="dt974-fech60-top"><span>✦ FECHAMENTO INTELIGENTE · 60S</span><b>${plTxt}</b></div>
          <p class="sm mut" style="margin:4px 0 8px">${nTr} trade(s) · acerto ${wr} · emocional ${emoTxt}${jrnMan ? ` · Jornal: “${b(jrnMan.slice(0, 68))}${jrnMan.length > 68 ? "…" : ""}”` : ""}</p>
          <div class="dt974-fech60-acts">
            <button type="button" class="btn s" data-dt978-ia="fech60">✦ Diagnóstico 60s (Áurea)</button>
            <button type="button" class="btn s" data-dt978-capa="4">🖼️ Card Meu Fechamento</button>
          </div>
        </section>`;
      })();
      return '<div class="v4-page v4-day v810-day v829-day dt975-day" data-v810-phase="'+sessao+'">'+base+kpis829+
        (sessao==="pre"
          ? '<div class="ui-split v829-split"><div class="ui-main">'+U+contexto+y+niveis825+'</div><aside class="ui-aside">'+m+lado829+'</aside></div>'
          : sessao==="pregao"
          ? '<div class="ui-split v829-split"><div class="ui-main">'+operacoes+U+contexto+niveis825+'</div><aside class="ui-aside">'+m+y+lado829+'</aside></div>'
          : '<div class="ui-split v829-split"><div class="ui-main">'+fech60+operacoes+v811PlanoExecucao(t,e)+contexto+U+'</div><aside class="ui-aside">'+m+
            '<button type="button" class="v4-cta" data-dt393-route="stats">'+p("book",20)+' Ver diário de trades</button>'+y+it+ladoPos829+'</aside></div>')+
        '</div>';
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
        gWin = a.filter((d) => R(d) > 0).length,
        wrTxt = a.length ? Math.round((gWin / a.length) * 100) + "%" : "—",
        limDia = i || f(() => pCore(pHoje().hj, pHoje().P)?.lim, 0) || 0,
        riscoUsado = Math.max(0, -(window.vivoDia ? vivoDia(r) : r) || 0) + (o || 0),
        riscoPct = limDia > 0 ? Math.round((riscoUsado / limDia) * 100) : (u != null ? Math.round(u) : 0),
        seqLoss = (() => {
          let k = 0;
          const ord = a.slice().sort((x, y) => String(x.dtx || x.dt || "").localeCompare(String(y.dtx || y.dt || "")));
          for (let idx = ord.length - 1; idx >= 0 && R(ord[idx]) < 0; idx--) k++;
          return k;
        })(),
        guard = limDia > 0 && riscoPct >= 100
          ? { cls: "no", txt: "🛑 Limite atingido" }
          : (limDia > 0 && riscoPct >= 70) || seqLoss >= 2
            ? { cls: "am", txt: seqLoss >= 2 ? `⚠ ${seqLoss} stops seguidos · Reduzir mão` : "⚠ Atenção · Reduzir mão" }
            : { cls: "ok", txt: "● Risco sob controle" },
        barCls = riscoPct >= 100 ? "no" : riscoPct >= 70 ? "am" : "ok",
        P = `<section class="v4-card dt975-ops-hero" aria-label="Resumo e controle de trades do dia">
          <div class="dt975-ops-top">
            <span class="dt975-kicker">RESULTADO DO DIA</span>
            <span class="dt975-badge ${guard.cls}">${guard.txt}</span>
          </div>
          <strong class="dt975-ops-pl ${L(r)}">${j(r)}</strong>
          <p class="dt975-ops-sub">${a.length} trade(s) · acerto ${wrTxt} · ${e.length} aberta(s)${e.length ? ` (${l}C/${s}V)` : ""}${M.length ? ` · ${M.length} setup(s)` : ""}</p>
          <div class="dt975-rwrap">
            <div class="dt975-pbar ${barCls}" role="progressbar" aria-label="Risco consumido do limite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.max(0, riscoPct))}"><i style="width:${Math.min(100, Math.max(0, riscoPct))}%"></i></div>
            <div class="dt975-pmeta">
              <span>Risco consumido: <b>${limDia > 0 ? riscoPct + "%" : G(riscoUsado)}</b>${limDia > 0 ? ` de ${G(limDia)}` : " · stops abertos"}</span>
              ${E(r) != null ? `<span>${Q(E(r))} do cap.</span>` : ""}
            </div>
          </div>
          <div class="dt975-ops-acts dt976-ops-acts3">
            <button type="button" class="dt975-btn-gold" data-dt393-action="newtrade">+ Registrar</button>
            <button type="button" class="dt975-btn-glass" data-dt976-q15-open="1">⚡ 15s</button>
            <button type="button" class="dt975-btn-glass" data-dt975-calc-toggle="1">Calculadora</button>
          </div>
          ${(() => {
            const tv = f(() => typeof travaAvalia === "function" ? travaAvalia() : null, null);
            const tc = f(() => (typeof S !== "undefined" && S?.ax?.trava) || {}, {});
            const txtTv = tv?.duro?.length
              ? `🔒 Travado: ${b(tv.duro[0])}`
              : tv?.pausaAte
                ? `⏸️ Pausa pós-stop ativa`
                : tc.on
                  ? `🛡️ Trava: máx ${tc.maxTr || 3}t · ${tc.maxStops || 2} stops · ${tc.pausaMin || 15}m`
                  : "🛡️ Configurar Trava & Limites";
            const clsTv = tv?.duro?.length ? "no" : tv?.pausaAte ? "am" : tc.on ? "ok" : "";
            const evMes = (() => {
              try {
                const arr = JSON.parse(localStorage.getItem("dt983-evitados") || "[]");
                const ym = V().slice(0, 7);
                return Array.isArray(arr) ? arr.filter((x0) => String(x0?.dt || "").startsWith(ym)).length : 0;
              } catch { return 0; }
            })();
            const fmtC = (min) => {
              const sNow = Math.floor(Date.now() / 1000);
              const rem = min * 60 - (sNow % (min * 60));
              const mm = String(Math.floor(rem / 60)).padStart(2, "0");
              const ss = String(rem % 60).padStart(2, "0");
              return `${mm}:${ss}`;
            };
            return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;align-items:center;justify-content:space-between">
              <button type="button" class="dt975-badge ${clsTv}" data-v4tab="regras" style="cursor:pointer;border:1px solid currentColor">${txtTv}</button>
              <div style="display:flex;gap:6px;align-items:center">
                <button type="button" class="dt975-badge" data-dt983-evit-tog="1" style="cursor:pointer">✋ Evitei${evMes ? ` (${evMes})` : ""}</button>
                <button type="button" class="dt975-badge" data-v4tab="contratos" style="cursor:pointer">⚖️ Contratos</button>
              </div>
            </div>
            <div class="dt983-evit-pop" data-dt983-evit-box hidden>
              <button type="button" data-dt983-evit="FOMO">FOMO</button>
              <button type="button" data-dt983-evit="Sem setup">Sem setup</button>
              <button type="button" data-dt983-evit="Lateral">Mercado lateral</button>
              <button type="button" data-dt983-evit="Fora do horário">Fora do horário</button>
            </div>
            <div class="dt983-candle" data-dt983-candle="1"><span>⏱️ Fechamento de vela</span><span>5m <b data-c="5">${fmtC(5)}</b> · 15m <b data-c="15">${fmtC(15)}</b> · 60m <b data-c="60">${fmtC(60)}</b></span></div>`;
          })()}
        </section><div class="dt975-calc-slot"></div>`,
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
        trMobileRows = z.map((d) => {
          const lado = d.side === "V" ? "Venda" : "Compra";
          const pl = R(d);
          const discBadge = d.rules === "n" || (d.err && d.err !== "Nenhum")
            ? '<span class="dt975-tr-disc no">✕ Fora</span>'
            : '<span class="dt975-tr-disc ok">✓ Plano</span>';
          return `<button type="button" class="dt975-tr-row ${pl >= 0 ? "pos" : "neg"}" data-a="edit" data-id="${b(d.id)}"><span class="dt975-tr-l"><b>${b(d.ativo || "—")}</b><small>${lado}${d.setup ? " · " + b(d.setup) : ""}</small></span><span class="dt975-tr-r"><strong class="${L(pl)}">${j(pl)}</strong>${discBadge}</span></button>`;
        }).join(""),
        Y = C(
          "trade",
          "Trades de hoje",
          `<span class="v4-muted">${a.length} trade(s)</span>`,
          a.length
            ? `<div class="dt975-trlist">${trMobileRows}</div><div class="v4-tablewrap dt975-trdesk"><table class="v4-table"><thead><tr>${B("ativo", "Ativo")}${B("setup", "Setup")}${B("entry", "Entrada")}${B("exit", "Saída")}${B("pl", "Resultado")}${B("r", "× risco")}<th></th></tr></thead><tbody>${z.map((d) => `<tr class="${R(d) >= 0 ? "b-buy" : "b-sell"}"><td><b>${b(d.ativo || "—")}</b></td><td>${b(d.setup || "—")}</td><td>${q(d.entry)}</td><td>${q(d.exit)}</td><td class="${L(R(d))}">${j(R(d))}</td><td class="${L(T(d))}">${T(d) != null ? (T(d) > 0 ? "+" : "") + _(T(d)) + "×" : "—"}</td><td><button type="button" class="v4-icon" data-a="edit" data-id="${b(d.id)}" aria-label="Abrir trade">${p("doc", 18)}</button></td></tr>`).join("")}</tbody></table></div>`
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
    <button type="button" data-rotina-preparo>${p("check", 20)} Ver checklist do dia</button>
    ${U ? `<button type="button" data-a="edit" data-id="${b(U.id)}">${p("warn", 20)} Marcar erro emocional</button>` : ""}
    <button type="button" class="v4-primarybtn" data-v4deb="1">${p("book", 20)} Registrar aprendizado no diário</button></div>`,
        ),
        x = [],
        m = a.filter((d) => T(d) != null).sort((d, c) => T(c) - T(d))[0];
      m &&
        T(m) > 0 &&
        x.push(
          `Melhor execução: ${b(m.ativo)}${m.setup ? " (" + b(m.setup) + ")" : ""} com ${_(T(m))} vezes o risco.`,
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
        x.push(`${K.length} perda(s) maiores que o risco planejado: o stop foi respeitado?`);
      const $t = C(
        "spark",
        "Sugestões",
        '<span class="v4-ctx">Contexto: suas operações</span>',
        `<p class="v4-sub">Calculadas a partir dos seus trades de hoje.</p><ul class="v4-tips">${x.length ? x.map((d) => `<li>${p("check", 18)}<span>${d}</span></li>`).join("") : '<li class="v4-none">Registre trades para receber sugestões.</li>'}</ul>${st("Perguntar à IA", 'data-v4ia="1"')}`,
      );
      const rx940 = (() => {
        const todos = pt().filter((d) => !Gt(d) && R(d) != null);
        if (todos.length < 3) return "";
        const faixas = [
          { k: "09h–11h", a: 9, b: 11, n: 0, w: 0, pl: 0 },
          { k: "11h–14h", a: 11, b: 14, n: 0, w: 0, pl: 0 },
          { k: "14h–18h", a: 14, b: 18, n: 0, w: 0, pl: 0 },
        ];
        const porDia = {};
        let plTotal = 0, plErros = 0, nErros = 0;
        for (const d of todos) {
          const val = R(d) || 0;
          plTotal += val;
          const dtStr = String(d.dt || "");
          const hm = /T(\d{2}):/.exec(dtStr);
          if (hm) {
            const h = +hm[1];
            const fx = faixas.find((x) => h >= x.a && h < x.b);
            if (fx) { fx.n++; if (val > 0) fx.w++; fx.pl += val; }
          }
          const dia = dtStr.slice(0, 10);
          (porDia[dia] = porDia[dia] || []).push(d);
          if ((d.err && d.err !== "Nenhum") || d.rules === "n") { nErros++; plErros += val; }
        }
        const ordens = [
          { k: "1º–2º trade do dia", n: 0, w: 0, pl: 0 },
          { k: "3º trade do dia", n: 0, w: 0, pl: 0 },
          { k: "4º+ trades (overtrading)", n: 0, w: 0, pl: 0 },
        ];
        for (const lista of Object.values(porDia)) {
          lista.sort((x, y) => String(x.dt || "").localeCompare(String(y.dt || "")));
          lista.forEach((d, idx) => {
            const val = R(d) || 0;
            const slot = idx < 2 ? ordens[0] : idx === 2 ? ordens[1] : ordens[2];
            slot.n++; if (val > 0) slot.w++; slot.pl += val;
          });
        }
        const fxAtivas = faixas.filter((x) => x.n > 0);
        const ordAtivas = ordens.filter((x) => x.n > 0);
        const piorFx = fxAtivas.slice().sort((x, y) => x.pl - y.pl)[0];
        const linhaTab = (x) => `<tr><td>${x.k}</td><td>${x.n}</td><td>${Math.round((x.w / x.n) * 100)}%</td><td class="${L(x.pl)}"><b>${j(x.pl)}</b></td></tr>`;
        const alertaFx = piorFx && piorFx.pl < 0 ? `<div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(239,68,68,.4);background:rgba(239,68,68,.1);margin-bottom:8px;font-size:12.5px"><b>Maior vazamento:</b> faixa <b>${piorFx.k}</b> (<b class="v-neg">${j(piorFx.pl)}</b> em ${piorFx.n} trades · ${Math.round((piorFx.w / piorFx.n) * 100)}% acerto).</div>` : "";
        const custoErro = nErros > 0 ? `<div style="padding:8px 10px;border-radius:8px;border:1px solid rgba(201,166,107,.4);background:rgba(201,166,107,.08);margin-top:8px;font-size:12.5px"><b>Custo de erros / fora da regra:</b> <b class="${L(plErros)}">${j(plErros)}</b> em ${nErros} trade(s). Sem eles, seu resultado seria <b class="${L(plTotal - plErros)}">${j(plTotal - plErros)}</b>.</div>` : "";
        const resumoIA950 = [
          `Total analisado: ${todos.length} trades · P&L líquido: ${j(plTotal)}`,
          fxAtivas.length ? "Por horário: " + fxAtivas.map((x) => `${x.k}=${j(x.pl)} (${x.n} trades, ${Math.round((x.w / x.n) * 100)}% acerto)`).join("; ") : "",
          ordAtivas.length ? "Por sequência no dia: " + ordAtivas.map((x) => `${x.k}=${j(x.pl)} (${x.n} trades, ${Math.round((x.w / x.n) * 100)}% acerto)`).join("; ") : "",
          nErros > 0 ? `Trades com erro/fora da regra: ${nErros} (${j(plErros)}); sem eles P&L seria ${j(plTotal - plErros)}` : "Sem erros marcados."
        ].filter(Boolean).join("\n");
        window.__dt950RxPrompt = "Analise este Raio-X de execução de trades no Profit, aponte exatamente onde o dinheiro está vazando e proponha 3 regras curtas e objetivas para colocar no Checklist (sem citar livros nem clichês):\n" + resumoIA950;
        const btnIA = `<div style="margin-top:10px"><button type="button" class="btn s" data-dt978-ia="rx" style="font-size:12.5px;min-height:40px">✦ Diagnosticar sangramento com Munger</button></div>`;
        return `<details class="v4-card" style="margin-top:12px;padding:12px 14px"><summary style="cursor:pointer;font-weight:700;font-size:14px;color:var(--gold,#C9A66B)">🩸 Raio-X de Sangramento (${todos.length} trades)</summary><div style="margin-top:10px">${alertaFx}${fxAtivas.length ? `<div class="sm mut" style="margin-bottom:4px">Por faixa de horário</div><div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Horário</th><th>Trades</th><th>Acerto</th><th>P&amp;L</th></tr></thead><tbody>${fxAtivas.map(linhaTab).join("")}</tbody></table></div>` : ""}${ordAtivas.length ? `<div class="sm mut" style="margin:10px 0 4px">Por ordem no dia (overtrading)</div><div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Sequência</th><th>Trades</th><th>Acerto</th><th>P&amp;L</th></tr></thead><tbody>${ordAtivas.map(linhaTab).join("")}</tbody></table></div>` : ""}${custoErro}${btnIA}</div></details>`;
      })();
      /* v959: Matriz Humor × Dinheiro + Placar de Disciplina (Seguir Plano vs Quebrar Regra) + Revisão Semanal com a Áurea. */
      const psico959 = (() => {
        const todos = pt();
        if (todos.length < 2) return "";
        const daysObj = f(() => S.days, {}) || {};
        const humorMap = [
          { k: "1–2 · Em alerta", n: 0, w: 0, pl: 0, dias: new Set() },
          { k: "3 · Neutro", n: 0, w: 0, pl: 0, dias: new Set() },
          { k: "4–5 · Focado / Bem", n: 0, w: 0, pl: 0, dias: new Set() },
        ];
        const disc = {
          s: { k: "✓ Seguiu o plano", n: 0, w: 0, pl: 0 },
          n: { k: "✕ Quebrou regra", n: 0, w: 0, pl: 0 },
        };
        const setups = new Map();
        const lim7 = Date.now() - 7 * 86400000;
        const sem = { n: 0, w: 0, pl: 0, manha: 0, tarde: 0, quebras: 0, ativos: new Map(), setups: new Map() };
        for (const d of todos) {
          const val = R(d) || 0;
          const dtStr = String(d.dtx || d.dt || "");
          const dia = dtStr.slice(0, 10);
          const est = Number(daysObj[dia]?.estado || 0);
          if (est >= 1 && est <= 5) {
            const slot = est <= 2 ? humorMap[0] : est === 3 ? humorMap[1] : humorMap[2];
            slot.n++; if (val > 0) slot.w++; slot.pl += val; slot.dias.add(dia);
          }
          if (d.rules === "s" || d.rules === "n") {
            const ds = disc[d.rules];
            ds.n++; if (val > 0) ds.w++; ds.pl += val;
          }
          const stp = String(d.setup || "").trim();
          if (stp) {
            const cur = setups.get(stp) || { k: stp, n: 0, w: 0, pl: 0 };
            cur.n++; if (val > 0) cur.w++; cur.pl += val;
            setups.set(stp, cur);
          }
          const ts = Date.parse(dia);
          if (Number.isFinite(ts) && ts >= lim7) {
            sem.n++; if (val > 0) sem.w++; sem.pl += val;
            const hr = +((dtStr.match(/T(\d{2}):/) || [])[1] || 10);
            if (hr < 12) sem.manha += val; else sem.tarde += val;
            if (d.rules === "n") sem.quebras++;
            const tk = String(d.ativo || "—");
            sem.ativos.set(tk, (sem.ativos.get(tk) || 0) + val);
            if (stp) sem.setups.set(stp, (sem.setups.get(stp) || 0) + val);
          }
        }
        const hAtivos = humorMap.filter((x) => x.n > 0);
        const dAtivos = [disc.s, disc.n].filter((x) => x.n > 0);
        const topSetups = [...setups.values()].sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl)).slice(0, 4);
        const ln = (x) => `<tr><td>${b(x.k)}</td><td>${x.n}</td><td>${Math.round((x.w / x.n) * 100)}%</td><td class="${L(x.pl)}"><b>${j(x.pl)}</b></td></tr>`;
        const resumoSem = [
          `Últimos 7 dias: ${sem.n} trades · Acerto ${sem.n ? Math.round((sem.w / sem.n) * 100) : 0}% · P&L líquido ${j(sem.pl)}`,
          `Por turno (7d): Manhã (<12h) ${j(sem.manha)} · Tarde (>=12h) ${j(sem.tarde)} · Quebras de regra: ${sem.quebras}`,
          hAtivos.length ? "Humor do checklist × P&L (histórico): " + hAtivos.map((x) => `${x.k}: ${j(x.pl)} (${x.n} trades, ${Math.round((x.w / x.n) * 100)}% acerto)`).join(" | ") : "Sem histórico de humor no checklist ainda.",
          dAtivos.length ? "Disciplina: " + dAtivos.map((x) => `${x.k}: ${j(x.pl)} (${x.n} trades)`).join(" | ") : "",
          topSetups.length ? "Principais setups: " + topSetups.map((x) => `${x.k}: ${j(x.pl)} (${x.n} trades, ${Math.round((x.w / x.n) * 100)}% acerto)`).join(" | ") : "",
        ].filter(Boolean).join("\n");
        window.__dt959SemPrompt = "Faça o fechamento semanal executivo deste trader em 4 blocos curtos e diretos (1. Onde ganhou dinheiro · 2. Onde sangrou · 3. Impacto real do emocional e da disciplina · 4. 1 regra prática de ouro para segunda-feira), usando apenas estes números, sem citar livros nem frases genéricas:\n" + resumoSem;
        const btnSem = `<div style="margin-top:10px"><button type="button" class="btn s" data-dt978-ia="sem" style="font-size:12.5px;min-height:40px">✦ Fechar Semana com a Áurea (${sem.n} trades / 7d)</button></div>`;
        return `<details class="v4-card" style="margin-top:10px;padding:12px 14px"><summary style="cursor:pointer;font-weight:700;font-size:14px;color:var(--gold,#C9A66B)">🧠 Disciplina, Humor × Dinheiro &amp; Revisão Semanal</summary><div style="margin-top:10px">${hAtivos.length ? `<div class="sm mut" style="margin-bottom:4px">Humor do Checklist × Resultado (R$)</div><div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Estado emocional</th><th>Trades</th><th>Acerto</th><th>P&amp;L</th></tr></thead><tbody>${hAtivos.map(ln).join("")}</tbody></table></div>` : '<p class="sm mut" style="margin:0 0 8px">Conclua o checklist matinal com sua nota emocional (1–5) para cruzar seu humor com o resultado financeiro.</p>'}${dAtivos.length ? `<div class="sm mut" style="margin:10px 0 4px">Seguir o Plano × Quebrar Regra</div><div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Disciplina</th><th>Trades</th><th>Acerto</th><th>P&amp;L</th></tr></thead><tbody>${dAtivos.map(ln).join("")}</tbody></table></div>` : ""}${topSetups.length ? `<div class="sm mut" style="margin:10px 0 4px">Placar por Setup (Playbook)</div><div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Setup</th><th>Trades</th><th>Acerto</th><th>P&amp;L</th></tr></thead><tbody>${topSetups.map(ln).join("")}</tbody></table></div>` : ""}${btnSem}</div></details>`;
      })();
      /* v978: Radar de Gatilhos / Níveis do Dia (distância ao vivo para níveis planejados). */
      const radar978 = (() => {
        let itens = [];
        try { itens = JSON.parse(localStorage.getItem("dt978-gatilhos") || "[]"); } catch {}
        if (!Array.isArray(itens)) itens = [];
        const rows = itens.map((g0, idx) => {
          const px = Wt(g0.tk);
          const alvo = Number(g0.px);
          let distTxt = "Sem cotação ao vivo";
          let tom = "mut";
          if (px != null && Number.isFinite(alvo) && alvo > 0) {
            const dif = alvo - px;
            const pct = (dif / px) * 100;
            const perto = Math.abs(pct) <= 0.35;
            tom = perto ? "v-pos" : dif > 0 ? "v-pos" : "v-neg";
            distTxt = `${perto ? "⚡ NA ZONA · " : ""}Atual ${q(px)} · ${dif >= 0 ? "+" : ""}${Math.abs(alvo) >= 1000 ? Math.round(dif) + " pts" : _(dif, 2)} (${pct >= 0 ? "+" : ""}${_(pct, 2)}%)`;
          }
          return `<div class="dt978-radar-row"><div><b>${b(g0.tk)} · ${q(alvo)} <span class="sm mut">(${b(g0.tipo || "Nível")})</span></b><small class="${tom}">${distTxt}</small></div><button type="button" class="dt978-radar-del" data-dt978-rdel="${idx}" aria-label="Remover nível">✕</button></div>`;
        }).join("");
        return `<details class="v4-card dt978-radar" style="margin-top:10px"${itens.length ? " open" : ""}>
          <summary><span class="dt975-kicker">🎯 RADAR DE GATILHOS DO DIA</span><span class="sm mut">${itens.length} nível(is)</span></summary>
          <div class="dt978-radar-form">
            <input type="text" id="dt978-rtk" placeholder="Ativo (WIN, PETR4)" autocapitalize="characters">
            <input type="number" step="any" inputmode="decimal" id="dt978-rpx" placeholder="Preço-alvo">
            <button type="button" class="dt975-btn-gold" style="padding:8px 12px" data-dt978-radd="1">+ Nível</button>
          </div>
          ${rows ? `<div class="dt978-radar-list">${rows}</div>` : '<p class="sm mut" style="margin:8px 0 0">Anote até 6 suportes, resistências ou gatilhos do pregão para acompanhar a distância em tempo real.</p>'}
        </details>`;
      })();
      /* v975/v978: Trades Liquid Glass 3D — Hero P&L + Guardião no topo, Trades de hoje em destaque, Radar de Gatilhos, posições abertas, Raio-X e Revisão. */
      return `<div class="v4-page v4-ops v829-ops dt975-ops">${P}<div class="ui-split v829-split"><div class="ui-main">${e.length ? $ + Y : Y + $}${radar978}${rx940}${psico959}</div><aside class="ui-aside">${ot}${$t}</aside></div></div>`;
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
      /* v976: Desempenho 3D — Hero Performance + Auditoria 30d + Mapa de Calor Mensal + Playbook de Setups + Simulador de Capital Próprio (sem mesa proprietária). */
      const todosP = pt(),
        lim30 = f(() => diasMais(V(), -30), "0000"),
        perDias = { "1M": 30, "3M": 91, "6M": 182, "1A": 365 }[mt],
        limPer = mt === "YTD" ? V().slice(0, 4) + "-01-01" : mt === "Máx" ? "0000" : perDias ? f(() => diasMais(V(), -perDias), "0000") : "0000",
        trPer = todosP.filter((m) => nt(m) >= limPer),
        plsPer = trPer.map(R).filter((v0) => v0 != null),
        plPer = plsPer.reduce((ac, v0) => ac + v0, 0),
        winsPer = plsPer.filter((v0) => v0 > 0),
        lossPer = plsPer.filter((v0) => v0 < 0),
        wrPer = plsPer.length ? (winsPer.length / plsPer.length) * 100 : null,
        sumW = winsPer.reduce((ac, v0) => ac + v0, 0),
        sumL = Math.abs(lossPer.reduce((ac, v0) => ac + v0, 0)),
        pfPer = sumL > 0 ? sumW / sumL : sumW > 0 ? 9.99 : null,
        avgW = winsPer.length ? sumW / winsPer.length : 0,
        avgL = lossPer.length ? sumL / lossPer.length : 0,
        payoffPer = avgL > 0 ? avgW / avgL : null,
        ddMax = (() => {
          let pk = 0, ac = 0, dd = 0;
          for (const d0 of ce()) { ac = d0.acc; if (ac > pk) pk = ac; if (pk - ac > dd) dd = pk - ac; }
          return dd;
        })(),
        aud30Prompt = (() => {
          const t30 = todosP.filter((m) => nt(m) >= lim30);
          const pl30 = lt(t30, R), w30 = t30.filter((m) => R(m) > 0).length;
          const q30 = t30.filter((m) => m.rules === "n" || (m.err && m.err !== "Nenhum")).length;
          const stpMap = {};
          t30.forEach((m) => { const k0 = String(m.setup || "Sem setup").trim(); stpMap[k0] = (stpMap[k0] || 0) + (R(m) || 0); });
          const topS = Object.entries(stpMap).sort((a0, b0) => b0[1] - a0[1]).slice(0, 4).map(([k0, v0]) => `${k0}: ${j(v0)}`).join(", ");
          return `@munger Faça minha Auditoria Executiva de 30 dias usando apenas estes números reais: ` +
            `Trades (30d): ${t30.length}, Acerto: ${t30.length ? Math.round((w30 / t30.length) * 100) + "%" : "—"}, P&L 30d: ${j(pl30)}, ` +
            `Profit Factor (${mt}): ${pfPer != null ? _(pfPer, 2) : "—"}, Payoff: ${payoffPer != null ? _(payoffPer, 2) + "×" : "—"}, Drawdown máx: ${G(ddMax)}, ` +
            `Quebras/erros (30d): ${q30}. Setups 30d: ${topS || "nenhum"}. ` +
            `Responda em 3 blocos curtos: 1) Onde está meu edge real, 2) Maior vazamento de dinheiro/disciplina, 3) 2 ajustes concretos para os próximos 30 dias.`;
        })(),
        perfHero976 = (() => {
          window.__dt976Aud30Prompt = aud30Prompt;
          return `<section class="v4-card dt976-perf-hero" aria-label="Resumo de performance">
            <div class="dt975-ops-top">
              <span class="dt975-kicker">DESEMPENHO · ${b(mt)}</span>
              <span class="dt975-badge ${plPer >= 0 ? "ok" : "no"}">${plsPer.length} trade(s)</span>
            </div>
            <strong class="dt975-ops-pl ${L(plPer)}">${j(plPer)}</strong>
            <div class="dt976-perf-grid">
              <div><small>Profit Factor</small><b>${pfPer != null ? (pfPer >= 9.99 ? "∞" : _(pfPer, 2)) : "—"}</b></div>
              <div><small>Payoff</small><b>${payoffPer != null ? _(payoffPer, 2) + "×" : "—"}</b></div>
              <div><small>Acerto</small><b>${wrPer != null ? _(wrPer, 1) + "%" : "—"}</b></div>
              <div><small>Drawdown máx</small><b class="${ddMax > 0 ? "v-neg" : ""}">${ddMax > 0 ? "−" + G(ddMax) : G(0)}</b></div>
            </div>
            <button type="button" class="dt975-btn-gold" style="width:100%;margin-top:10px" data-dt976-aud30="1">✦ Auditoria 30 dias (Áurea)</button>
          </section>`;
        })(),
        cal976 = (() => {
          const ym = window.__dt976CalYm || V().slice(0, 7);
          const [ano, mes] = ym.split("-").map(Number);
          const d0 = new Date(ano, mes - 1, 1);
          const nomeMes = d0.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^./, (c0) => c0.toUpperCase());
          const firstDow = d0.getDay(), lastDay = new Date(ano, mes, 0).getDate();
          const porDia = {};
          todosP.forEach((m) => { const dStr = nt(m); if (dStr.startsWith(ym + "-")) porDia[dStr] = (porDia[dStr] || 0) + (R(m) || 0); });
          const maxAbs = Math.max(1, ...Object.values(porDia).map((v0) => Math.abs(v0)));
          let posD = 0, negD = 0, totM = 0;
          Object.values(porDia).forEach((v0) => { totM += v0; if (v0 > 0) posD++; else if (v0 < 0) negD++; });
          const cells = [];
          for (let i0 = 0; i0 < firstDow; i0++) cells.push('<span class="dt976-cd em"></span>');
          for (let dNum = 1; dNum <= lastDay; dNum++) {
            const iso = `${ym}-${String(dNum).padStart(2, "0")}`;
            const val = porDia[iso];
            const has = val != null;
            const lv = has ? Math.min(3, Math.max(1, Math.ceil((Math.abs(val) / maxAbs) * 3))) : 0;
            const clsD = !has ? "" : val > 0 ? `pos lv${lv}` : val < 0 ? `neg lv${lv}` : "neu";
            const curt = !has ? "" : (val > 0 ? "+" : "−") + (Math.abs(val) >= 1000 ? (Math.abs(val) / 1000).toFixed(1) + "k" : Math.round(Math.abs(val)));
            cells.push(`<button type="button" class="dt976-cd ${clsD}${iso === t ? " sel" : ""}" data-dt976-calday="${iso}" title="${wt(iso)}${has ? ": " + j(val) : ""}"><b>${dNum}</b><i>${curt}</i></button>`);
          }
          return `<section class="v4-card dt976-cal" aria-label="Mapa de calor mensal">
            <div class="dt976-cal-head">
              <div><span class="dt975-kicker">MAPA DE CALOR MENSAL</span><h3>${b(nomeMes)}</h3></div>
              <div class="dt975-date">
                <button type="button" data-dt976-calnav="-1" aria-label="Mês anterior">‹</button>
                <button type="button" data-dt976-calnav="0" style="font-size:11px;padding:0 6px">Atual</button>
                <button type="button" data-dt976-calnav="1" aria-label="Próximo mês">›</button>
              </div>
            </div>
            <div class="dt976-cal-dow"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
            <div class="dt976-cal-grid">${cells.join("")}</div>
            <div class="dt975-pmeta" style="margin-top:8px"><span><b class="v-pos">${posD}</b> positivo(s) · <b class="v-neg">${negD}</b> negativo(s)</span><b class="${L(totM)}">${j(totM)}</b></div>
          </section>`;
        })(),
        play976 = (() => {
          const mapa = new Map();
          todosP.forEach((m) => {
            const st = String(m.setup || "").trim();
            if (!st) return;
            const v0 = R(m) || 0;
            const cur = mapa.get(st) || { k: st, n: 0, w: 0, pl: 0, manha: 0, tarde: 0 };
            cur.n++; if (v0 > 0) cur.w++; cur.pl += v0;
            const hr = +((String(m.dt || "").match(/T(\d{2}):/) || [])[1] || 10);
            if (hr < 12) cur.manha += v0; else cur.tarde += v0;
            mapa.set(st, cur);
          });
          const lista = [...mapa.values()].sort((a0, b0) => b0.pl - a0.pl).slice(0, 6);
          return `<section class="v4-card dt976-play" aria-label="Playbook de setups">
            <div class="dt975-ops-top" style="margin-bottom:8px"><span class="dt975-kicker">PLAYBOOK DE SETUPS</span><span class="sm mut">${lista.length} setup(s)</span></div>
            ${lista.length ? `<div class="dt976-play-grid">${lista.map((s0) => {
              const wr0 = Math.round((s0.w / s0.n) * 100);
              const tag = s0.pl > 0 && s0.n >= 2 ? '<span class="dt975-badge ok">★ Campeão</span>' : s0.pl < 0 ? '<span class="dt975-badge no">⚠ Drenando</span>' : '<span class="dt975-badge am">● Em teste</span>';
              const turno = s0.manha >= s0.tarde ? "Manhã" : "Tarde";
              return `<div class="dt976-play-card"><div class="dt976-play-top"><b>${b(s0.k)}</b>${tag}</div><strong class="${L(s0.pl)}">${j(s0.pl)}</strong><small>${s0.n} trade(s) · ${wr0}% acerto · melhor: ${turno}</small></div>`;
            }).join("")}</div>` : gt("Informe o campo Setup ao registrar trades para montar seu placar de Playbook.")}
          </section>`;
        })(),
        sim976 = (() => {
          const capDef = Math.round(yt() || 10000);
          const wrDef = wrPer != null ? Math.round(wrPer) : 52;
          const payDef = payoffPer != null ? Number(payoffPer.toFixed(2)) : 1.4;
          return `<details class="v4-card dt976-sim" data-dt976-sim="1">
            <summary><span class="dt975-kicker">SIMULADOR DE CAPITAL PRÓPRIO &amp; RISCO</span><span class="sm mut">Juros compostos + Monte Carlo</span></summary>
            <div class="dt976-sim-body">
              <div class="dt976-sim-grid">
                <label>Capital inicial (R$)<input type="number" min="500" step="500" data-sim-f="cap" value="${capDef}"></label>
                <label>Risco por trade (%)<input type="number" min="0.2" max="10" step="0.1" data-sim-f="rk" value="1.0"></label>
                <label>Taxa de acerto (%)<input type="number" min="10" max="90" step="1" data-sim-f="wr" value="${wrDef}"></label>
                <label>Payoff (Ganho/Perda)<input type="number" min="0.3" max="5" step="0.1" data-sim-f="pay" value="${payDef}"></label>
                <label>Trades por semana<input type="number" min="1" max="50" step="1" data-sim-f="trw" value="10"></label>
                <label>Meta mensal (R$)<input type="number" min="100" step="100" data-sim-f="meta" value="${Math.round(capDef * 0.08)}"></label>
              </div>
              <div class="dt976-sim-out" data-sim-out></div>
            </div>
          </details>`;
        })();
        dow978 = (() => {
          const dias = [
            { idx: 1, k: "Seg", n: 0, w: 0, pl: 0 },
            { idx: 2, k: "Ter", n: 0, w: 0, pl: 0 },
            { idx: 3, k: "Qua", n: 0, w: 0, pl: 0 },
            { idx: 4, k: "Qui", n: 0, w: 0, pl: 0 },
            { idx: 5, k: "Sex", n: 0, w: 0, pl: 0 },
          ];
          todosP.forEach((m) => {
            const dStr = nt(m);
            if (!dStr) return;
            const dw = new Date(dStr + "T12:00:00").getDay();
            const sl = dias.find((x0) => x0.idx === dw);
            if (!sl) return;
            const v0 = R(m) || 0;
            sl.n++;
            if (v0 > 0) sl.w++;
            sl.pl += v0;
          });
          const comDados = dias.filter((x0) => x0.n > 0);
          if (!comDados.length) return "";
          const best = comDados.slice().sort((a0, b0) => b0.pl - a0.pl)[0];
          const worst = comDados.slice().sort((a0, b0) => a0.pl - b0.pl)[0];
          const curtV = (v0) => (v0 === 0 ? "R$ 0" : (v0 > 0 ? "+" : "−") + (Math.abs(v0) >= 1000 ? (Math.abs(v0) / 1000).toFixed(1) + "k" : Math.round(Math.abs(v0))));
          return `<section class="v4-card dt978-dow" aria-label="Desempenho por dia da semana">
            <div class="dt975-ops-top"><span class="dt975-kicker">MAPA POR DIA DA SEMANA</span><span class="sm mut">${best && best.pl > 0 ? `★ ${best.k}` : ""}${worst && worst.pl < 0 ? ` · ⚠ ${worst.k}` : ""}</span></div>
            <div class="dt978-dow-grid">${dias.map((d0) => {
              const cls = d0 === best && d0.pl > 0 ? " best" : d0 === worst && d0.pl < 0 ? " worst" : "";
              const wr0 = d0.n ? Math.round((d0.w / d0.n) * 100) + "%" : "—";
              return `<div class="dt978-dow-c${cls}"><span>${d0.k}</span><b class="${d0.n ? L(d0.pl) : ""}">${d0.n ? curtV(d0.pl) : "—"}</b><small>${d0.n}t · ${wr0}</small></div>`;
            }).join("")}</div>
          </section>`;
        })();
      /* v983: Simulador "E se eu tivesse parado no 2º stop / 3º trade?" com trades reais. */
      const whatIf983 = (() => {
        const list = pt().slice().sort((a0, b0) => String(a0.dt || "").localeCompare(String(b0.dt || "")));
        if (list.length < 4) return "";
        const byDay = {};
        list.forEach((tr) => {
          const dk = nt(tr);
          if (!dk) return;
          (byDay[dk] = byDay[dk] || []).push(R(tr) || 0);
        });
        let realPl = 0, stop2Pl = 0, tr3Pl = 0, cutS2 = 0, cutT3 = 0;
        Object.values(byDay).forEach((vals) => {
          let stops = 0;
          vals.forEach((v0, idx) => {
            realPl += v0;
            if (stops < 2) { stop2Pl += v0; if (v0 < 0) stops++; } else cutS2++;
            if (idx < 3) tr3Pl += v0; else cutT3++;
          });
        });
        const difS2 = stop2Pl - realPl, difT3 = tr3Pl - realPl;
        const fmtD = (d0) => d0 === 0 ? "igual" : (d0 > 0 ? `+${j(d0)} melhor` : `${j(d0)}`);
        return `<section class="v4-card dt983-whatif" aria-label="Simulador de disciplina diária">
          <div class="dt975-ops-top"><span class="dt975-kicker">🛑 E SE VOCÊ TIVESSE PARADO?</span><span class="sm mut">${list.length} trades reais</span></div>
          <div class="dt983-whatif-grid">
            <div><span>Real</span><b class="${L(realPl)}">${j(realPl)}</b><small>Histórico atual</small></div>
            <div><span>Parar no 2º stop</span><b class="${L(stop2Pl)}">${j(stop2Pl)}</b><small class="${difS2 > 0 ? "v-pos" : ""}">${cutS2 ? fmtD(difS2) : "Sem corte"}</small></div>
            <div><span>Máx. 3 trades/dia</span><b class="${L(tr3Pl)}">${j(tr3Pl)}</b><small class="${difT3 > 0 ? "v-pos" : ""}">${cutT3 ? fmtD(difT3) : "Sem corte"}</small></div>
          </div>
        </section>`;
      })();
      return `<div class="v4-page v4-journal dt976-stats">${perfHero976}${cal976}${y}${play976}${dow978}${whatIf983}${sim976}${h}${Z}${H}<div class="v4-two">${ot}${x}</div><button type="button" class="v4-cta" data-v4deb="1">${p("book", 22)} Registrar revisão</button></div>`;
    }
    /* v976: Handlers leves de Mapa de Calor, Simulador de Capital Próprio e Registro 15s (zero polling, zero MutationObserver). */
    function dt976CalcSim(rootSim) {
      if (!rootSim) return;
      const gN = (k, d0) => { const el0 = rootSim.querySelector(`[data-sim-f="${k}"]`); const n0 = Number(el0?.value); return Number.isFinite(n0) && n0 > 0 ? n0 : d0; };
      const cap = gN("cap", 10000), rk = gN("rk", 1) / 100, wr = Math.min(95, Math.max(5, gN("wr", 50))) / 100,
        pay = gN("pay", 1.4), trw = Math.min(60, Math.max(1, Math.round(gN("trw", 10)))), meta = gN("meta", 800);
      const expR = wr * pay - (1 - wr);
      const expBrl = cap * rk * expR;
      const trMes = trw * 4;
      const retMes = Math.max(-0.5, Math.min(2, expR * rk * trMes));
      const p3 = cap * Math.pow(1 + retMes, 3), p6 = cap * Math.pow(1 + retMes, 6), p12 = cap * Math.pow(1 + retMes, 12);
      let bateu = 0, dd20 = 0;
      const NRUN = 300;
      for (let s0 = 0; s0 < NRUN; s0++) {
        let eq = cap, pk = cap, hitDd = false;
        for (let k0 = 0; k0 < trMes; k0++) {
          const risco = eq * rk;
          eq += Math.random() < wr ? risco * pay : -risco;
          if (eq > pk) pk = eq;
          if ((pk - eq) / pk >= 0.2) hitDd = true;
        }
        if (eq - cap >= meta) bateu++;
        if (hitDd) dd20++;
      }
      const pMeta = Math.round((bateu / NRUN) * 100), pDd = Math.round((dd20 / NRUN) * 100);
      const out = rootSim.querySelector("[data-sim-out]");
      if (out) {
        out.innerHTML = `<div class="dt976-perf-grid">
          <div><small>Expectativa / trade</small><b class="${expR >= 0 ? "v-pos" : "v-neg"}">${expR >= 0 ? "+" : ""}${expR.toFixed(2)}R (${j(expBrl)})</b></div>
          <div><small>Chance meta/mês</small><b class="${pMeta >= 50 ? "v-pos" : ""}">${pMeta}%</b></div>
          <div><small>Risco DD ≥ 20%</small><b class="${pDd >= 20 ? "v-neg" : "v-pos"}">${pDd}%</b></div>
          <div><small>Projeção 6 meses</small><b class="${p6 >= cap ? "v-pos" : "v-neg"}">${G(p6)}</b></div>
        </div>
        <p class="sm mut" style="margin:8px 0 0">Juros compostos (3m / 12m): <b>${G(p3)}</b> · <b>${G(p12)}</b> · ${expR <= 0 ? "Expectativa negativa: ajuste Payoff ou filtro de entradas antes de aumentar mão." : pDd >= 20 ? "Risco de drawdown elevado: considere reduzir o risco por trade para 0,5%–1%." : "Parâmetros saudáveis para crescimento consistente de capital próprio."}</p>`;
      }
    }
    function dt976AbreQ15() {
      let dlg = v.getElementById("dt976-q15");
      if (dlg) dlg.remove();
      const setupsUniq = [...new Set(ct().map((x) => String(x.setup || "").trim()).filter(Boolean))].slice(0, 6);
      dlg = v.createElement("div");
      dlg.id = "dt976-q15";
      dlg.className = "dt976-q15-ov";
      dlg.innerHTML = `<div class="dt976-q15-card" role="dialog" aria-modal="true" aria-label="Registro rápido de trade em 15 segundos">
        <div class="dt975-ops-top"><b>⚡ Registro Ultra-Rápido (15s)</b><button type="button" class="dt976-q15-x" data-dt976-q15-close="1" aria-label="Fechar">✕</button></div>
        <div class="dt976-q15-chips">${["WIN", "WDO", "PETR4", "VALE3"].map((tk) => `<button type="button" data-q15-tk="${tk}">${tk}</button>`).join("")}</div>
        <label>Ativo<input type="text" id="q15-ativo" value="WIN" placeholder="Ex.: WINJ26, PETR4" autocapitalize="characters"></label>
        <div class="dt976-q15-seg" role="group" aria-label="Lado">
          <button type="button" class="on" data-q15-side="C">Compra</button>
          <button type="button" data-q15-side="V">Venda</button>
        </div>
        <label>Resultado líquido (R$, use − para perda)<input type="number" step="any" inputmode="decimal" id="q15-pl" placeholder="Ex.: 240 ou -160"></label>
        <label>Setup<input type="text" id="q15-setup" placeholder="Ex.: Abertura VWAP" list="q15-setups-list"></label>
        <datalist id="q15-setups-list">${setupsUniq.map((s0) => `<option value="${b(s0)}"></option>`).join("")}</datalist>
        <div class="dt976-q15-seg" role="group" aria-label="Disciplina">
          <button type="button" class="on" data-q15-rule="s">✓ Seguiu o plano</button>
          <button type="button" data-q15-rule="n">✕ Fora do plano</button>
        </div>
        <button type="button" class="dt975-btn-gold" style="width:100%;margin-top:10px" data-dt976-q15-save="1">Salvar Trade (15s)</button>
      </div>`;
      v.body.appendChild(dlg);
      setTimeout(() => dlg.querySelector("#q15-pl")?.focus(), 40);
    }
    v.addEventListener("click", (ev) => {
      const calNav = ev.target.closest?.("[data-dt976-calnav]");
      if (calNav) {
        ev.preventDefault();
        const dir = Number(calNav.dataset.dt976Calnav || 0);
        if (dir === 0) window.__dt976CalYm = V().slice(0, 7);
        else {
          const cur = (window.__dt976CalYm || V().slice(0, 7)).split("-").map(Number);
          const nd = new Date(cur[0], cur[1] - 1 + dir, 1);
          window.__dt976CalYm = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`;
        }
        xt();
        return;
      }
      const calDay = ev.target.closest?.("[data-dt976-calday]");
      if (calDay) {
        ev.preventDefault();
        f(() => { if (typeof D !== "undefined") D = calDay.dataset.dt976Calday; render(); });
        return;
      }
      if (ev.target.closest?.("[data-dt976-q15-open]")) { ev.preventDefault(); dt976AbreQ15(); return; }
      if (ev.target.closest?.("[data-dt976-q15-close]") || ev.target.id === "dt976-q15") {
        v.getElementById("dt976-q15")?.remove();
        return;
      }
      const qTk = ev.target.closest?.("[data-q15-tk]");
      if (qTk) { const inp = v.getElementById("q15-ativo"); if (inp) inp.value = qTk.dataset.q15Tk; return; }
      const qSide = ev.target.closest?.("[data-q15-side]");
      if (qSide) { qSide.parentElement.querySelectorAll("button").forEach((b0) => b0.classList.toggle("on", b0 === qSide)); return; }
      const qRule = ev.target.closest?.("[data-q15-rule]");
      if (qRule) { qRule.parentElement.querySelectorAll("button").forEach((b0) => b0.classList.toggle("on", b0 === qRule)); return; }
      if (ev.target.closest?.("[data-dt976-q15-save]")) {
        const dlg = v.getElementById("dt976-q15");
        if (!dlg) return;
        const ativo = String(dlg.querySelector("#q15-ativo")?.value || "").trim().toUpperCase();
        const plRaw = String(dlg.querySelector("#q15-pl")?.value || "").replace(",", ".").trim();
        const pl = Number(plRaw);
        if (!ativo || !Number.isFinite(pl)) { f(() => toast("Informe ativo e resultado em R$.")); return; }
        const side = dlg.querySelector("[data-q15-side].on")?.dataset.q15Side || "C";
        const rules = dlg.querySelector("[data-q15-rule].on")?.dataset.q15Rule || "s";
        const setup = String(dlg.querySelector("#q15-setup")?.value || "").trim();
        const agora = new Date();
        const hhmm = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" });
        const dtIso = V() + "T" + hhmm + ":00";
        f(() => {
          S.trades = Array.isArray(S.trades) ? S.trades : [];
          S.trades.push({
            id: "q15_" + Date.now(),
            dt: dtIso,
            dtx: dtIso,
            ativo,
            side,
            qty: 1,
            pv: 1,
            cost: 0,
            entry: 0,
            exit: side === "C" ? pl : -pl,
            pl,
            setup,
            tipo: "D",
            rules,
            err: rules === "n" ? "Fora do plano" : "Nenhum",
            quick: true,
          });
          save?.();
          dlg.remove();
          render?.();
          toast?.(`Trade ${ativo} (${j(pl)}) salvo em 15s!`);
        });
        return;
      }
      const irCopyBtn = ev.target.closest?.("[data-dt976-ir-copy]");
      if (irCopyBtn) {
        ev.preventDefault();
        const txt = String(window.__dt976IrCopy || "");
        if (txt && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(txt).then(() => f(() => toast?.("Resumo de IR copiado!"))).catch(() => {});
        }
        return;
      }
      if (ev.target.closest?.("[data-dt976-aud30]")) {
        ev.preventDefault();
        if (typeof window.DiarioConselhoIA === "function") {
          window.DiarioConselhoIA("munger", "Auditoria 30 dias · Munger", window.__dt976Aud30Prompt || "");
        }
        return;
      }
      const ia978 = ev.target.closest?.("[data-dt978-ia]");
      if (ia978) {
        ev.preventDefault();
        const k = ia978.dataset.dt978Ia;
        // Briefing usa o endpoint textual da própria Áurea, não a ficha de ativos do Conselho.
        if(k==="brief30"){
          const api=window.DiarioInteligenciaEtapa1;
          if(typeof api?.briefing30!=="function"){f(()=>toast?.("Áurea ainda está carregando. Tente novamente."));return;}
          ia978.disabled=true;
          const oldLabel=ia978.textContent;
          ia978.textContent="Gerando Briefing…";
          Promise.resolve().then(()=>api.briefing30()).catch(()=>f(()=>toast?.("Não foi possível gerar o Briefing. Tente novamente."))).finally(()=>{ia978.disabled=false;ia978.textContent=oldLabel;});
          return;
        }
        const mapIa = {
          brief30: ["schwartz", "Briefing 30s · Áurea", window.__dt975Brief30Prompt],
          fech60: ["munger", "Fechamento 60s · Munger", window.__dt974Fech60Prompt],
          rx: ["munger", "Diagnóstico de Execução", window.__dt950RxPrompt],
          sem: ["carteira", "Revisão Semanal · Áurea", window.__dt959SemPrompt],
        };
        const cfgIa = mapIa[k];
        if (cfgIa && typeof window.DiarioConselhoIA === "function") {
          window.DiarioConselhoIA(cfgIa[0], cfgIa[1], cfgIa[2] || "");
        }
        return;
      }
      const capa978 = ev.target.closest?.("[data-dt978-capa]");
      if (capa978) {
        ev.preventDefault();
        window.DiarioCapas561?.abrir?.(Number(capa978.dataset.dt978Capa || 4));
        return;
      }
      if (ev.target.closest?.("[data-tr-inst]")) {
        ev.preventDefault();
        if (typeof window.trInstalar === "function") window.trInstalar();
        return;
      }
      if (ev.target.closest?.("[data-dt978-radd]")) {
        ev.preventDefault();
        const tk = String(v.getElementById("dt978-rtk")?.value || "").trim().toUpperCase();
        const px = Number(String(v.getElementById("dt978-rpx")?.value || "").replace(",", ".").trim());
        if (!tk || !Number.isFinite(px) || px <= 0) { f(() => toast?.("Informe ativo e preço-alvo válidos.")); return; }
        let itens = [];
        try { itens = JSON.parse(localStorage.getItem("dt978-gatilhos") || "[]"); } catch {}
        if (!Array.isArray(itens)) itens = [];
        const pxNow = Wt(tk);
        const tipo = pxNow != null ? (px > pxNow ? "Resistência" : "Suporte") : "Gatilho";
        itens = [{ tk, px, tipo }, ...itens.filter((x0) => !(x0.tk === tk && Number(x0.px) === px))].slice(0, 6);
        try { localStorage.setItem("dt978-gatilhos", JSON.stringify(itens)); } catch {}
        xt();
        return;
      }
      const rDel = ev.target.closest?.("[data-dt978-rdel]");
      if (rDel) {
        ev.preventDefault();
        const idx = Number(rDel.dataset.dt978Rdel);
        let itens = [];
        try { itens = JSON.parse(localStorage.getItem("dt978-gatilhos") || "[]"); } catch {}
        if (Array.isArray(itens) && idx >= 0 && idx < itens.length) {
          itens.splice(idx, 1);
          try { localStorage.setItem("dt978-gatilhos", JSON.stringify(itens)); } catch {}
          xt();
        }
        return;
      }
      const bkpBtn = ev.target.closest?.("[data-dt981-bkp]");
      if (bkpBtn) {
        ev.preventDefault();
        const act = bkpBtn.dataset.dt981Bkp;
        if (act === "hide") {
          try { sessionStorage.setItem("dt981-bkp-hide", "1"); } catch {}
          bkpBtn.closest?.(".dt981-bkp")?.remove();
          return;
        }
        try {
          const payload = typeof S !== "undefined" ? JSON.stringify(S, null, 2) : "{}";
          const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a0 = v.createElement("a");
          a0.href = url;
          a0.download = `diario-trader-backup-${new Date().toISOString().slice(0, 10)}.json`;
          v.body.appendChild(a0);
          a0.click();
          a0.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          localStorage.setItem("dt981-last-backup", String(Date.now()));
          f(() => toast?.("Backup JSON baixado com sucesso!"));
          bkpBtn.closest?.(".dt981-bkp")?.remove();
        } catch {
          f(() => toast?.("Não foi possível gerar o backup JSON."));
        }
        return;
      }
      if (ev.target.closest?.("[data-dt983-evit-tog]")) {
        ev.preventDefault();
        const box = v.querySelector("[data-dt983-evit-box]");
        if (box) box.hidden = !box.hidden;
        return;
      }
      const evitBtn = ev.target.closest?.("[data-dt983-evit]");
      if (evitBtn) {
        ev.preventDefault();
        const mot = evitBtn.dataset.dt983Evit || "Disciplina";
        try {
          let arr = JSON.parse(localStorage.getItem("dt983-evitados") || "[]");
          if (!Array.isArray(arr)) arr = [];
          arr.unshift({ dt: V(), mot, ts: Date.now() });
          localStorage.setItem("dt983-evitados", JSON.stringify(arr.slice(0, 200)));
          f(() => toast?.(`✋ Disciplina registrada: evitei (${mot})`));
        } catch {}
        xt();
        return;
      }
      if (ev.target.closest?.("[data-dt983-alert-x]")) {
        ev.preventDefault();
        const al = ev.target.closest(".dt983-alert");
        try { if (al?.dataset?.key) sessionStorage.setItem("dt983-al-" + al.dataset.key, "1"); } catch {}
        al?.remove();
        return;
      }
      if (ev.target.closest?.("[data-dt983-alert-go]")) {
        ev.preventDefault();
        ev.target.closest(".dt983-alert")?.remove();
        f(() => typeof ir === "function" && ir("ops"));
        return;
      }
      const simSum = ev.target.closest?.("[data-dt976-sim] > summary");
      if (simSum) {
        const simEl = simSum.parentElement;
        setTimeout(() => { if (simEl?.open) dt976CalcSim(simEl); }, 0);
      }
    });
    v.addEventListener("input", (ev) => {
      const sim = ev.target.closest?.("[data-dt976-sim]");
      if (sim) dt976CalcSim(sim);
    });
    v.addEventListener("toggle", (ev) => {
      if (ev.target?.matches?.("[data-dt976-sim]") && ev.target.open) dt976CalcSim(ev.target);
    }, true);
    /* v983: Tick leve de fechamento de vela + alerta global do Radar de Gatilhos + auto-sync silencioso de cotações. */
    if (!/jsdom/i.test(String(navigator?.userAgent || "")) && !window.__dt983Loop) {
      window.__dt983Loop = 1;
      let _radSync = 0;
      const fmtC983 = (min) => {
        const rem = min * 60 - (Math.floor(Date.now() / 1000) % (min * 60));
        return `${String(Math.floor(rem / 60)).padStart(2, "0")}:${String(rem % 60).padStart(2, "0")}`;
      };
      setInterval(() => {
        const el = v.querySelector("[data-dt983-candle]");
        if (!el) return;
        [5, 15, 60].forEach((m0) => {
          const b0 = el.querySelector(`[data-c="${m0}"]`);
          if (b0) b0.textContent = fmtC983(m0);
        });
      }, 1000);
      setInterval(() => {
        try {
          const itens = JSON.parse(localStorage.getItem("dt978-gatilhos") || "[]");
          if (!Array.isArray(itens) || !itens.length) return;
          const semPx = itens.filter((g0) => g0?.tk && Wt(g0.tk) == null).map((g0) => g0.tk);
          if (semPx.length && !_radSync && window.DiarioPublico) {
            _radSync = 1;
            window.DiarioPublico.get(`/v1/precos?simbolos=${encodeURIComponent(semPx.slice(0, 6).join(","))}`, { ttl: 60000 }).catch(() => {});
          }
          const hit = itens.find((g0) => {
            const px = Wt(g0?.tk), alvo = Number(g0?.px);
            if (!(px > 0 && alvo > 0)) return false;
            return Math.abs(((alvo - px) / px) * 100) <= 0.35;
          });
          if (!hit) return;
          const key = `${hit.tk}_${hit.px}`;
          if (sessionStorage.getItem("dt983-al-" + key) === "1" || v.querySelector(".dt983-alert")) return;
          const px = Wt(hit.tk), pct = ((Number(hit.px) - px) / px) * 100;
          const bar = v.createElement("div");
          bar.className = "dt983-alert";
          bar.dataset.key = key;
          bar.innerHTML = `<span>⚡ <b>${b(hit.tk)}</b> na zona (${q(Number(hit.px))} · ${pct >= 0 ? "+" : ""}${_(pct, 2)}%)</span><span style="display:flex;gap:5px"><button type="button" data-dt983-alert-go="1">Trades</button><button type="button" data-dt983-alert-x="1" aria-label="Fechar">✕</button></span>`;
          v.body.appendChild(bar);
        } catch {}
      }, 12000);
    }
    const me = [
        ["home", "Início", "home"],
        ["dia", "Rotina", "cal"],
        ["ops", "Trades", "trade"],
        ["analises", "Research", "spark"],
        ["carteiras", "Carteira", "wallet"],
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
        analises: "analises",
        carteiras: "carteiras",
        mercado: "home",
        juros: "home",
        live: "home",
        graf: "home",
        estudos: "analises",
        livro: "analises",
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
            ["r", "dia", "Rotina", "cal"],
            ["r", "ops", "Trades", "trade"],
            ["r", "analises", "Research", "spark"],
            ["r", "carteiras", "Carteira", "wallet"],
          ],
        ],
        [
          "Macro & Gráficos",
          [
            ["r", "mercado", "Mercado", "bars"],
            ["r", "term", "Terminal", "monitor"],
            ["r", "graf", "Gráficos TradingView", "up"],
            ["r", "juros", "Juros e DI", "coins"],
          ],
        ],
        [
          "Performance & Disciplina",
          [
            ["r", "stats", "Desempenho", "book"],
            ["h", "hoje", "Posso operar?", "shield"],
            ["r", "regras", "Checklist e regras", "checksq"],
            ["h", "cal", "Calendário", "cal"],
            ["r", "rev", "Revisão da semana", "list"],
            ["h", "escala", "Escala de turno", "cal"],
            ["q", "1", "Registro rápido de trade", "bolt"],
          ],
        ],
        [
          "Gestão & Fiscal",
          [
            ["h", "pat", "Evolução patrimonial", "up"],
            ["g", "painel", "Capital e risco", "shield"],
            ["g", "contratos", "Calculadora de lotes", "list"],
            ["g", "imposto", "Imposto de renda", "doc"],
          ],
        ],
        [
          "Conhecimento",
          [
            ["r", "estudos", "Estudos", "grad"],
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
          ["r", "dia", "Rotina", "cal"],
          [
            ["r", "regras", "Checklist e regras"],
            ["q", "1", "Registro rápido"],
          ],
        ],
        [
          ["r", "ops", "Trades", "trade"],
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
    const v810Details = {home:new Set(),dia:new Set()};
    /* v810: o clique em <summary> deve abrir a seção antes que listeners
       globais reconstruam a rota; o estado é restaurado no próximo render. */
    v.addEventListener("click", (ev) => {
      const summary=ev.target.closest?.(".v810-more > summary");
      if (!summary || !["home","dia"].includes(et())) return;
      const details=summary.parentElement;
      const page=details.closest(".v810-home,.v810-day");
      if (!page) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      details.open=!details.open;
      // O adaptador legado envolve os atalhos em .simple-explore.
      // Abrir também esse invólucro existente; jamais clonar os atalhos.
      if (page.matches(".v810-home")) details.querySelectorAll(".simple-explore").forEach(inner => {inner.open=details.open;});
      const i=[...page.querySelectorAll(".v810-more")].indexOf(details);
      if(i>=0){
        const store=v810Details[et()];
        if(details.open)store.add(String(i));
        else store.delete(String(i));
      }
    }, true);
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
      if (l && (t === "home" ? !!l.querySelector(".v810-home") : t === "dia" ? !!l.querySelector(".v810-day") : false)) {
        l.querySelectorAll(".v810-more").forEach((node,i) => {
          const key=String(i);
          if(node.open)v810Details[t].add(key);else v810Details[t].delete(key);
        });
      }
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
        (t === "home" || t === "dia") && l.querySelectorAll(".v810-more").forEach((node,i) => {node.open=v810Details[t].has(String(i));}),
        v.getElementById("v419-mais")?.remove(),
        e.querySelector("#dt393-workspace")?.classList.remove("v419-recolhido"),
        ee(t, a),
        f(poe598));
      // v676: após substituir o painel V4, insere o termômetro na tela real
      // de Início/Meu dia, independentemente do ciclo de cotações.
      if(t==="home")e.querySelectorAll(".v810-home .v810-more[open] .simple-explore").forEach(inner=>{inner.open=true;});
      if (t === "home" || t === "dia") {window.TermometroAbertura670?.montar?.();window.DiarioInteligenciaEtapa1?.montar?.();}
      /* v845: o painel novo apaga o cartão de Movimentos fortes; recoloca usando o cache de 10 min (sem nova consulta). */
      if (t === "home") window.DIARIO_V518?.cartao?.()?.catch?.(()=>{});
      if (t === "home") window.DiarioScreeners?.alertaInicio?.();
    }
    window.DiarioSessaoVisual=Object.freeze({
      manual:()=>v810Manual?({pre:"pre",pregao:"during",pos:"post"}[v810Manual.phase]):null,
      atualizar:()=>{v810Manual=null;qt=null;if(["home","dia"].includes(et()))xt();}
    });
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
        if (a && a.dataset.v4route === "ops" && a.dataset.v4tool === "import") {
          t.preventDefault();
          irPara("import"); // usa a rota oficial do Profit, sem alterar a integração
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
        if (t.target.closest("[data-v4auto]")) {
          t.preventDefault();v810Manual=null;qt=null;xt();return;
        }
        const r = t.target.closest("[data-v4phase]");
        if (r) {
          t.preventDefault();
          const i=r.dataset.v4phase,c=window.DiarioSessoes?.context();
          if(!["pre","pregao","pos"].includes(i))return;
          v810Manual={phase:i,anchor:c?.anchorDate,until:window.DiarioSessoes?.nextTransition(Date.now())||Date.now()+3600000};
          qt=null;xt();
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
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const KEY='diario-v421-gp';
const SYMS={IBOV:'Ibovespa',SPX:'S&P 500',NDX:'Nasdaq 100',DXY:'Índice do dólar (DXY)',USDBRL:'Dólar (USD/BRL)',VIX:'VIX',BRENT:'Petróleo Brent',WTI:'Petróleo WTI',OURO:'Ouro',COBRE:'Cobre',PRATA:'Prata',EWZ:'EWZ (ETF Brasil)',PETR4:'Petrobras PN',VALE3:'Vale ON',ITUB4:'Itaú PN',BBAS3:'Banco do Brasil',WEGE3:'WEG',BOVA11:'BOVA11',BTCUSD:'Bitcoin'};
const ECON={'BC:SELIC':['selic','Selic meta (% a.a.)'],'BC:CDI':['cdi','CDI (% a.a.)'],'BC:IPCA12':['ipca12','IPCA 12 meses (%)'],'BC:IPCA':['ipca','IPCA mensal (%)'],'BC:IGPM':['igpm','IGP-M mensal (%)'],'BC:IBCBR':['ibcbr','IBC-Br (prévia do PIB)'],'BC:DESEMP':['desemprego','Desemprego PNAD (%)'],'BC:PTAX':['ptax','Dólar PTAX (R$)']};
const isEcon=s=>!!ECON[s];
const REL={IBOV:['SPX','EWZ','USDBRL','BOVA11','BC:SELIC','BC:IBCBR'],PETR4:['BRENT','WTI','PETR3','PRIO3','EWZ','IBOV'],PETR3:['PETR4','BRENT','IBOV'],VALE3:['COBRE','CSNA3','GGBR4','IBOV','EWZ'],
 ITUB4:['BBDC4','BBAS3','SANB11','IBOV','BC:SELIC'],BBAS3:['ITUB4','BBDC4','IBOV','BC:SELIC'],WEGE3:['IBOV','USDBRL','SPX'],BOVA11:['IBOV','EWZ'],
 USDBRL:['DXY','BC:PTAX','BC:SELIC','IBOV','EWZ'],SPX:['NDX','VIX','DXY','IBOV'],NDX:['SPX','VIX','DXY'],DXY:['USDBRL','OURO','SPX'],VIX:['SPX','NDX'],
 OURO:['DXY','PRATA','USDBRL'],PRATA:['OURO','COBRE'],COBRE:['VALE3','OURO'],BRENT:['WTI','PETR4','USDBRL'],WTI:['BRENT','PETR4'],EWZ:['IBOV','USDBRL','SPX'],BTCUSD:['NDX','OURO','DXY']};
const related=s=>(REL[s]||['IBOV','SPX','USDBRL','DXY']).filter(x=>x!==s);
const PRESETS=[
 ['IBOV','SPX','Ibovespa × S&P 500'],['IBOV','USDBRL','Ibovespa × Dólar'],['EWZ','IBOV','EWZ × Ibovespa'],
 ['PETR4','BRENT','Petrobras × Brent'],['VALE3','COBRE','Vale × Cobre (metais)'],['NDX','VIX','Nasdaq × VIX'],
 ['USDBRL','DXY','Dólar × DXY'],['OURO','DXY','Ouro × DXY'],
 ['IBOV','BC:SELIC','Ibovespa × Selic'],['IBOV','BC:IPCA12','Ibovespa × IPCA 12 meses'],['IBOV','BC:IBCBR','Ibovespa × IBC-Br'],['USDBRL','BC:SELIC','Dólar × Selic']];
const PER=[['1D','5m',1],['3D','15m',3],['1M','60m',31],['6M','1d',183],['YTD','1d',-1],['1A','1d',366],['2A','1d',731],['Máx','1d',99999]];
const def={a:'IBOV',b:'SPX',per:'1A',freq:'D',mode:'dual',style:'line',ma:[],ev:true,table:false};
let st=(()=>{try{const o=Object.assign({},def,JSON.parse(localStorage.getItem(KEY)||'{}'));if(!['line','candles'].includes(o.style))o.style='line';return o}catch(e){return {...def}}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fin=n=>typeof n==='number'&&Number.isFinite(n);
const dec=v=>{const a=Math.abs(v);return a>=10000?0:a<10?4:2};
const nf=(v,d)=>fin(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d??dec(v),maximumFractionDigits:d??dec(v)}):'—';
const pc=v=>fin(v)?(v>0?'+':'')+nf(v,2)+'%':'—';
const name=s=>SYMS[s]||(ECON[s]?ECON[s][1]:s);
const tec=()=>root.TRM?.tec;
const perDef=()=>PER.find(p=>p[0]===st.per)||PER[5];
const ivOf=()=>perDef()[1];
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};

/* ---------- dados ---------- */
const econ=new Map(),econErr=new Map();
try{const c=JSON.parse(localStorage.getItem('diario-v422-econ')||'{}');Object.entries(c).forEach(([k,v])=>{if(v&&Array.isArray(v.pontos))econ.set(k,v)})}catch(e){}
function econSave(){try{const o={};econ.forEach((v,k)=>o[k]=v);localStorage.setItem('diario-v422-econ',JSON.stringify(o))}catch(e){}}
async function fetchEcon(sym,force){
  const id=ECON[sym][0],k=sym;const have=econ.get(k);
  if(!force&&have&&Date.now()-(have.ts||0)<6*36e5)return;
  if(!force&&Date.now()-(asked.get(k)||0)<90000)return;asked.set(k,Date.now());
  try{
    /* v823: séries do Banco Central vêm da Cloudflare (cache de 6 h); Supabase só como reserva. */
    const desde823=new Date().getFullYear()-6;
    let pub=null;
    if(window.DiarioPublico&&!window.DIARIO_DEMO){try{pub=await window.DiarioPublico.get('/v1/series?serie='+id+'&desde='+desde823,{ttl:6*36e5});}catch{}}
    if(pub&&Array.isArray(pub.pontos)&&pub.pontos.length){econ.set(k,{...pub,ts:Date.now()});econErr.delete(k);econSave();return;}
    if(typeof rq!=='function')throw Error('Conexão do app indisponível.');
    const r=await rq('/functions/v1/series',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serie:id,desde:new Date().getFullYear()-6})});
    const j=await r.json();if(!Array.isArray(j.pontos))throw Error(j.error||'Resposta inesperada.');
    econ.set(k,{...j,ts:Date.now()});econErr.delete(k);econSave();
  }catch(e){econErr.set(k,e&&e.status===404?'A função "series" ainda não foi publicada no Supabase.':(e&&e.status===401?'Entre na sua conta para carregar os indicadores.':String(e&&e.message||e)))}
}
function bars(sym,iv){
  if(isEcon(sym)){const v=econ.get(sym);return (v?.pontos||[]).map(p=>[p[0],p[1],p[1],p[1],p[1],0])}
  const L=g(()=>tec().velas(sym,iv)?.L,[])||[];
  return L.filter(x=>Array.isArray(x)&&fin(x[0])&&fin(x[4])&&x[4]>0).sort((a,b)=>a[0]-b[0]);
}
function meta(sym,iv){if(isEcon(sym)){const v=econ.get(sym);return v?v.fonte+' · '+v.unidade:''}return g(()=>tec().velas(sym,iv)?.nota||'','')}
function errOf(sym,iv){if(isEcon(sym))return econErr.get(sym)||'';return g(()=>tec().erroVelas?.(sym,iv)||'','')}
const asked=new Map();
async function fetchSym(sym,iv,force){
  if(isEcon(sym))return fetchEcon(sym,force);
  const k=sym+'|'+iv;if(!force&&Date.now()-(asked.get(k)||0)<90000)return;asked.set(k,Date.now());
  try{await tec()?.pegaVelas?.(sym,iv)}catch(e){}
}
function cut(list){
  const p=perDef();if(!list.length)return list;
  const now=Date.now()/1000;let from=-Infinity;
  if(p[2]===-1)from=new Date(new Date().getFullYear(),0,1).getTime()/1000;
  else if(p[2]<99999){
    // intradiário: últimos N pregões presentes na série
    if(p[1]!=='1d'){const days=[...new Set(list.map(x=>new Date(x[0]*1000).toISOString().slice(0,10)))].slice(-p[2]);const first=days[0];return list.filter(x=>new Date(x[0]*1000).toISOString().slice(0,10)>=first)}
    from=now-p[2]*86400;
  }
  return list.filter(x=>x[0]>=from);
}
function resample(list){
  if(st.freq==='D'||ivOf()!=='1d')return list;
  const m=new Map();
  for(const r of list){const d=new Date(r[0]*1000);let k;
    if(st.freq==='M')k=d.getUTCFullYear()+'-'+d.getUTCMonth();
    else{const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7));k=t.toISOString().slice(0,10)}
    const c=m.get(k);if(!c)m.set(k,[r[0],r[1],r[2],r[3],r[4],r[5]||0]);else{c[0]=r[0];c[2]=Math.max(c[2],r[2]);c[3]=Math.min(c[3],r[3]);c[4]=r[4];c[5]+=r[5]||0}}
  return [...m.values()];
}
const sma=(vals,n)=>vals.map((_,i)=>i<n-1?null:vals.slice(i-n+1,i+1).reduce((s,v)=>s+v,0)/n);
function align(A,B){
  if(isEcon(st.b)){let j=0,last=null;const out=[];for(const r of A){while(j<B.length&&B[j][0]<=r[0]+86400){last=B[j];j++}out.push([r,last])}return out}
  // junta pela data (diário) ou pelo horário mais próximo (intradiário)
  const key=t=>ivOf()==='1d'?new Date(t*1000).toISOString().slice(0,10):Math.round(t/300);
  const mb=new Map(B.map(r=>[key(r[0]),r]));
  return A.map(r=>[r,mb.get(key(r[0]))||null]);
}

/* ---------- cabeçalho do ativo ---------- */
function header(sym){
  const d=bars(sym,'1d');const intr=bars(sym,'5m');
  if(!d.length&&!intr.length)return `<div class="gp-hdr"><b class="gp-tk">${esc(sym)}</b><span class="gp-muted">${esc(name(sym))} · sem dados ainda</span></div>`;
  const last=intr.length?intr[intr.length-1]:d[d.length-1];
  const today=d[d.length-1],prev=d.length>1?d[d.length-2][4]:null;
  // candle diário do dia pode estar incompleto: usa intradiário quando houver
  const dayKey=new Date((last[0])*1000).toISOString().slice(0,10);
  const dayBars=intr.filter(x=>new Date(x[0]*1000).toISOString().slice(0,10)===dayKey);
  const o=dayBars.length?dayBars[0][1]:today[1],h=dayBars.length?Math.max(...dayBars.map(x=>x[2])):today[2],l=dayBars.length?Math.min(...dayBars.map(x=>x[3])):today[3];
  const px=last[4];const pv=(new Date(today[0]*1000).toISOString().slice(0,10)===dayKey)?prev:today[4];
  const ch=fin(pv)?px-pv:null,chp=fin(pv)?(px/pv-1)*100:null;
  const at=new Date(last[0]*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
  const up=ch>0,dn=ch<0;
  const spark=d.slice(-30).map(x=>x[4]);let sp='';
  if(spark.length>2){const mn=Math.min(...spark),mx=Math.max(...spark),r=mx-mn||1;sp=`<svg class="gp-spark" viewBox="0 0 60 18" aria-hidden="true"><polyline points="${spark.map((v,i)=>`${(i/(spark.length-1)*60).toFixed(1)},${(17-(v-mn)/r*16).toFixed(1)}`).join(' ')}"/></svg>`}
  return `<div class="gp-hdr" aria-label="Resumo de ${esc(name(sym))}">
   <div class="gp-l1"><b class="gp-tk">${esc(sym)}</b><span class="gp-arrow ${up?'up':dn?'dn':''}">${up?'↑':dn?'↓':'·'}</span><b class="gp-px ${up?'up':dn?'dn':''}">${nf(px)}</b><span class="gp-ch ${up?'up':dn?'dn':''}">${fin(ch)?(ch>0?'+':'')+nf(ch):'—'} <small>${pc(chp)}</small></span>${sp}</div>
   <div class="gp-l2"><em><span class="gp-at">At</span> ${at}</em><em><span>O</span>${nf(o)}</em><em><span>H</span>${nf(h)}</em><em><span>L</span>${nf(l)}</em><em><span>Prev</span>${nf(pv)}</em></div></div>`;
}

/* ---------- gráfico ---------- */
function events(t0,t1,sym){
  const out=[];if(!st.ev)return out;
  try{const a=AG.v[0];(a?.eventos||[]).filter(e=>e.imp===1).forEach(e=>{const t=Date.parse(e.em)/1000;if(t>=t0&&t<=t1)out.push({t,k:'ev',l:String(e.t||'Evento')+(e.p?' ('+e.p+')':'')})})}catch(e){}
  try{const base=s=>String(s||'').toUpperCase().replace(/[FGHJKMNQUVXZ]\d{2}$/,'');const map={IBOV:['WIN','IND','IBOV','BOVA11'],USDBRL:['WDO','DOL','USDBRL']};const ok=map[sym]||[sym];
    (S.trades||[]).forEach(x=>{const b=base(x.ativo);if(!ok.some(o=>b===o||b.startsWith(o)))return;const t=Date.parse(String(x.dt||'').slice(0,16)+':00-03:00')/1000;if(t>=t0&&t<=t1)out.push({t,k:x.side==='C'?'buy':'sell',l:(x.side==='C'?'Compra ':'Venda ')+(x.ativo||'')+(x.setup?' · '+x.setup:'')})})}catch(e){}
  return out.sort((a,b)=>a.t-b.t).slice(-40);
}
let lastGeom=null;

/* v526 — Janela do GP: mantém os candles originais, exibe tempo deslocável e
   eixo de preço ajustável sem alterar os dados carregados. */
const gpView={key:'',count:0,offset:0,max:0,priceZoom:1,priceShift:0,fraction:0};
const VIEWS_KEY='diario-gp-enquadramentos-v531';
let savedViews={};
try { const v=JSON.parse(localStorage.getItem(VIEWS_KEY)||'{}'); if(v&&typeof v==='object'&&!Array.isArray(v)) savedViews=v; } catch(_){}
const gpKey=()=>[st.a,st.b||'',st.per,st.freq,st.mode,ivOf()].join('|');
function viewWrite(){
  try {
    const entries=Object.entries(savedViews).sort((a,b)=>(b[1]?.savedAt||0)-(a[1]?.savedAt||0)).slice(0,25);
    savedViews=Object.fromEntries(entries);
    localStorage.setItem(VIEWS_KEY,JSON.stringify(savedViews));
  } catch(_){}
}
function viewStore(){
  if(!gpView.key)return;
  savedViews[gpView.key]={count:gpView.count,offset:gpView.offset,priceZoom:gpView.priceZoom,priceShift:gpView.priceShift,savedAt:Date.now()};
  viewWrite();
}
function viewRestore(key){
  const v=savedViews[key];if(!v||typeof v!=='object')return false;
  gpView.count=Number(v.count)||gpView.count;
  gpView.offset=Number(v.offset)||0;
  gpView.priceZoom=clip(v.priceZoom,.2,6);
  gpView.priceShift=clip(v.priceShift,-10,10);
  gpView.fraction=0;
  return true;
}
const clip=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
function navInit(all){
  if(all.length<2)return all;
  const key=gpKey();
  if(gpView.key!==key){
    gpView.key=key;
    gpView.count=Math.max(2,resample(cut(bars(st.a,ivOf()))).length);
    gpView.offset=0;gpView.priceZoom=1;gpView.priceShift=0;gpView.fraction=0;
    viewRestore(key);
  }
  gpView.max=all.length;
  gpView.count=Math.max(2,Math.min(gpView.count||all.length,all.length));
  gpView.offset=clip(gpView.offset,0,Math.max(0,all.length-gpView.count));
  return all.slice(all.length-gpView.count-gpView.offset,all.length-gpView.offset);
}
function navPriceBounds(bounds){
  const low=bounds[0],high=bounds[1],span=Math.max(1e-10,high-low);
  const mid=(low+high)/2+gpView.priceShift*span;
  const radius=span*gpView.priceZoom/2;
  return [mid-radius,mid+radius];
}
function navPan(dx,dy,width,height,mode){
  if((mode==='hand'||mode==='time')&&gpView.max>gpView.count){
    gpView.fraction+=dx/Math.max(20,width)*gpView.count;
    const step=Math.trunc(gpView.fraction);
    gpView.fraction-=step;
    const next=clip(gpView.offset+step,0,gpView.max-gpView.count);
    if(next!==gpView.offset+step)gpView.fraction=0;
    gpView.offset=next;
  }
  if(mode==='hand'||mode==='price')
    gpView.priceShift=clip(gpView.priceShift+dy/Math.max(20,height)*gpView.priceZoom,-10,10);
  viewStore();
}
function navZoom(factor,anchor){
  if(gpView.max<2)return;
  const prev=gpView.count;
  const next=clip(Math.round(prev*factor),Math.min(12,gpView.max),gpView.max);
  const a=anchor==null?.5:clip(anchor,0,1);
  gpView.offset=clip(Math.round(gpView.offset+(prev-next)*(1-a)),0,gpView.max-next);
  gpView.count=next;gpView.fraction=0;
  viewStore();
}
function navReset(){
  delete savedViews[gpKey()];viewWrite();
  gpView.key='';gpView.offset=0;gpView.count=0;gpView.max=0;
  gpView.priceZoom=1;gpView.priceShift=0;gpView.fraction=0;
}
function svg(){
  const iv=ivOf();
  const A=navInit(resample(bars(st.a,iv))),B=st.b?(isEcon(st.b)?bars(st.b,iv):resample(bars(st.b,iv))):[];
  const W=720,H=360,L=56,R=62,T=14,Bm=40;const cw=W-L-R,chh=H-T-Bm;
  if(A.length<2){
    const e=errOf(st.a,iv);const login=/conta|login|401/i.test(e)||g(()=>!SESS,false);
    return {html:`<div class="gp-empty"><b>Sem histórico de ${esc(name(st.a))} para ${esc(st.per)}.</b><span>${esc(e||'O app ainda não recebeu os candles deste ativo.')}</span>${login?'<button type="button" data-dt414-go="conta">Entrar na conta</button>':'<button type="button" data-gp="reload">Carregar histórico</button>'}</div>`,ok:false};
  }
  let pa=A.map(r=>r[4]),pb=null,pairs=null;
  if(B.length>=2){pairs=align(A,B);pb=pairs.map(([,b])=>b?b[4]:null)}
  let mode=st.mode;if(!pb)mode='single';if(isEcon(st.b)&&mode!=='single')mode='dual';
  if(pb&&pb.every(v=>v==null)){pb=null;mode='single'}
  // séries no espaço de desenho
  let sa=pa,sb=pb,labelA=st.a,labelB=isEcon(st.b)?ECON[st.b][1].replace(/\s*\(.*\)$/,''):st.b;
  if(mode==='base'){const a0=pa[0];const fb=pb.find(v=>v!=null);sa=pa.map(v=>v/a0*100);sb=pb.map(v=>v==null?null:v/fb*100)}
  if(mode==='ratio'){const r=pairs.map(([a,b])=>b?a[4]/b[4]:null);const f0=r.find(v=>v!=null);sa=r.map(v=>v==null?null:v/f0*100);sb=null;labelA=st.a+' / '+st.b}
  const xs=A.map(r=>r[0]);const t0=xs[0],t1=xs[xs.length-1];
  const X=i=>L+(i/(xs.length-1))*cw;
  const isCandles=(st.style||'line')==='candles'&&mode==='single'&&!isEcon(st.a);
  const rng=v=>{const f=v.filter(fin);let lo=Math.min(...f),hi=Math.max(...f);const m=(hi-lo)*.08||Math.abs(hi)*.01||1;return [lo-m,hi+m]};
  const rngA=isCandles?rng(A.flatMap(r=>[r[2],r[3]])):rng(sa);
  const both=mode==='base'?rng([...sa,...(sb||[])]):null;
  const [ra0,ra1]=navPriceBounds(both||rngA);const [rb0,rb1]=sb?(both?[ra0,ra1]:rng(sb)):[0,1];
  const YA=v=>T+(1-(v-ra0)/(ra1-ra0))*chh, YB=v=>T+(1-(v-rb0)/(rb1-rb0))*chh;
  const path=(s,Y)=>{let d='',pen=false;s.forEach((v,i)=>{if(v==null){pen=false;return}d+=(pen?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1);pen=true});return d};
  const dA=path(sa,YA);const area=dA+`L${X(sa.length-1).toFixed(1)},${(T+chh).toFixed(1)}L${X(0).toFixed(1)},${(T+chh).toFixed(1)}Z`;
  const dB=sb?path(sb,mode==='base'?YA:YB):'';
  let seriesSvg='';
  if(isCandles){
    const bw=Math.max(2,Math.min(14,(cw/Math.max(1,A.length))*0.68));
    seriesSvg=A.map((r,i)=>{const x=X(i),up=r[4]>=r[1],col=up?'#34D399':'#F87171',yO=YA(r[1]),yC=YA(r[4]),yH=YA(r[2]),yL=YA(r[3]),top=Math.min(yO,yC),h=Math.max(1.2,Math.abs(yC-yO));return `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${yH.toFixed(1)}" y2="${yL.toFixed(1)}" stroke="${col}" stroke-width="1.2"/><rect x="${(x-bw/2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${col}" rx="0.6"/>`}).join('');
  }else{
    seriesSvg=`<path class="gp-area" d="${area}"/>${dB?`<path class="gp-lb" d="${dB}"/>`:''}<path class="gp-la" d="${dA}"/>`;
  }
  // eixos (principal à direita = R1, como no Bloomberg)
  const ticks=(a0,a1,n=6)=>Array.from({length:n},(_,i)=>a0+(a1-a0)*i/(n-1));
  const fmtAx=v=>mode==='base'||mode==='ratio'?nf(v,1):nf(v,Math.abs(v)>=1000?0:Math.abs(v)<10?2:1);
  let grid='',ax='';
  ticks(ra0,ra1).forEach(v=>{const y=YA(v).toFixed(1);grid+=`<path class="gp-g" d="M${L} ${y}H${W-R}"/>`;ax+=`<text class="gp-ax" x="${W-R+8}" y="${(+y+4)}">${fmtAx(v)}</text><path class="gp-tick" d="M${W-R} ${y}h5"/>`});
  if(sb&&mode==='dual')ticks(rb0,rb1).forEach(v=>{const y=YB(v).toFixed(1);ax+=`<text class="gp-ax gp-axl" x="${L-8}" y="${(+y+4)}" text-anchor="end">${fmtAx(v)}</text><path class="gp-tick" d="M${L-5} ${y}h5"/>`});
  // eixo do tempo
  let xl='';const nX=6;
  for(let i=0;i<nX;i++){const idx=Math.round(i*(xs.length-1)/(nX-1));const d=new Date(xs[idx]*1000);const x=X(idx).toFixed(1);
    const lab=iv==='1d'?d.toLocaleDateString('pt-BR',{month:'short',timeZone:'America/Sao_Paulo'}).replace('.',''):d.toLocaleString('pt-BR',{day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
    const yr=iv==='1d'&&(i===0||new Date(xs[Math.round((i-1)*(xs.length-1)/(nX-1))]*1000).getFullYear()!==d.getFullYear())?d.getFullYear():'';
    grid+=`<path class="gp-g" d="M${x} ${T}V${T+chh}"/>`;xl+=`<text class="gp-ax" x="${x}" y="${H-Bm+16}" text-anchor="middle">${lab}</text>${yr?`<text class="gp-ax gp-yr" x="${x}" y="${H-Bm+31}" text-anchor="middle">${yr}</text>`:''}`}
  // médias móveis da série principal (em preço; não em razão)
  let mas='';const colors={20:'#FF9F1C',50:'#94A3B8',200:'#F87171'};
  if(mode!=='ratio')st.ma.forEach(n=>{const m=sma(pa,n).map(v=>v==null?null:(mode==='base'?v/pa[0]*100:v));if(m.filter(v=>v!=null).length>1)mas+=`<path class="gp-ma" stroke="${colors[n]}" d="${path(m,YA)}"/>`});
  // eventos-chave
  const evs=events(t0,t1,st.a);let evg='';
  evs.forEach((e,i)=>{let j=0;while(j<xs.length-1&&xs[j+1]<=e.t)j++;const x=X(j).toFixed(1);
    if(e.k==='ev')evg+=`<g class="gp-ev" data-gp-ev="${i}"><path d="M${x} ${T}V${T+chh}"/><rect x="${+x-6}" y="${T+chh-12}" width="12" height="12" rx="2"/><text x="${x}" y="${T+chh-3}" text-anchor="middle">E</text><title>${esc(e.l)}</title></g>`;
    else{const y=YA(sa[j]??sa[sa.length-1]);evg+=`<g class="gp-trade ${e.k}"><path d="${e.k==='buy'?`M${x} ${(y+6).toFixed(1)}l-6 10h12z`:`M${x} ${(y-6).toFixed(1)}l-6 -10h12z`}"/><title>${esc(e.l)}</title></g>`}});
  // etiquetas do último valor nos eixos (preto sobre âmbar para alto contraste)
  const lastA=sa[sa.length-1],lastB=sb?[...sb].reverse().find(v=>v!=null):null;
  const tagR=`<g class="gp-tag gp-tag-a"><rect x="${W-R+2}" y="${(YA(lastA)-9).toFixed(1)}" width="${R-4}" height="18" rx="2" fill="#FF9F1C"/><text x="${W-R/2}" y="${(YA(lastA)+4).toFixed(1)}" text-anchor="middle" style="fill:#000000;font-weight:800">${fmtAx(lastA)}</text></g>`;
  const tagL=lastB!=null?(mode==='dual'?`<g class="gp-tag gp-tag-b"><rect x="2" y="${(YB(lastB)-9).toFixed(1)}" width="${L-4}" height="18" rx="2"/><text x="${L/2}" y="${(YB(lastB)+4).toFixed(1)}" text-anchor="middle">${fmtAx(lastB)}</text></g>`:`<g class="gp-tag gp-tag-b"><rect x="${W-R+2}" y="${(YA(lastB)-9).toFixed(1)}" width="${R-4}" height="18" rx="2"/><text x="${W-R/2}" y="${(YA(lastB)+4).toFixed(1)}" text-anchor="middle">${fmtAx(lastB)}</text></g>`):'';
  const legendRows=[[labelA,mode==='dual'?'R1':'',sa[sa.length-1],'#FF9F1C']].concat(sb?[[labelB,mode==='dual'?'L1':'',lastB,'#6d9ac1']]:[]);
  const legend=`<g class="gp-legend"><rect x="${L+8}" y="${T+6}" width="210" height="${18+legendRows.length*16}" rx="3"/><text class="gp-lt" x="${L+113}" y="${T+19}" text-anchor="middle">${mode==='base'?'Base 100':mode==='ratio'?'Razão (base 100)':isCandles?'Candles OHLC':'Último preço'}</text>${legendRows.map((r,i)=>`<rect x="${L+16}" y="${T+26+i*16}" width="9" height="9" fill="${r[3]}"/><text class="gp-lv" x="${L+30}" y="${T+34+i*16}">${esc(r[0])}${r[1]?' ('+r[1]+')':''}</text><text class="gp-lv" x="${L+210}" y="${T+34+i*16}" text-anchor="end">${fmtAx(r[2])}</text>`).join('')}</g>`;
  lastGeom={xs,A,B:pairs,sa,sb,X,YA,L,R,W,T,chh,mode,fmtAx};
  return {html:`<svg class="gp-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de ${esc(labelA)}${sb?' e '+esc(labelB):''}, período ${esc(st.per)}">
    <defs><clipPath id="gp421-plot-clip"><rect x="${L}" y="${T}" width="${cw}" height="${chh}"/></clipPath></defs>
    <rect class="gp-bg" x="${L}" y="${T}" width="${cw}" height="${chh}"/>${grid}
    <g class="gp-view-series" clip-path="url(#gp421-plot-clip)">${seriesSvg}${mas}${evg}</g>
    <path class="gp-frame" d="M${L} ${T}V${T+chh}H${W-R}V${T}"/>${ax}${xl}${tagR}${tagL}${legend}
    <g class="gp-cross" hidden><path class="gp-cv" d=""/><path class="gp-ch" d="" stroke="#FF9F1C" stroke-dasharray="3 3" opacity="0.6"/><circle class="gp-cdot" r="3.5" fill="#FF9F1C" stroke="#000" stroke-width="1.2"/><rect class="gp-cbox" rx="3"/><text class="gp-ct"></text></g></svg>`,ok:true};
}
function table(){
  const iv=ivOf();const A=resample(cut(bars(st.a,iv))),B=st.b?(isEcon(st.b)?bars(st.b,iv):resample(cut(bars(st.b,iv)))):[];
  if(!A.length)return '<div class="gp-empty"><b>Sem dados para a tabela.</b></div>';
  const rows=(B.length?align(A,B):A.map(a=>[a,null])).slice(-60).reverse();
  const fd=t=>new Date(t*1000).toLocaleString('pt-BR',iv==='1d'?{day:'2-digit',month:'2-digit',year:'2-digit'}:{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `<div class="gp-tablewrap"><table class="gp-table"><thead><tr><th>Data</th><th>${esc(st.a)}</th><th>Var.</th>${B.length?`<th>${esc(isEcon(st.b)?ECON[st.b][1]:st.b)}</th><th>Var.</th>`:''}</tr></thead><tbody>${rows.map(([a,b],i)=>{const pa=rows[i+1]?.[0]?.[4],pb=rows[i+1]?.[1]?.[4];return `<tr><td>${fd(a[0])}</td><td>${nf(a[4])}</td><td class="${a[4]>=pa?'up':'dn'}">${pa?pc((a[4]/pa-1)*100):''}</td>${B.length?`<td>${b?nf(b[4]):'—'}</td><td class="${b&&pb?(b[4]>=pb?'up':'dn'):''}">${b&&pb?pc((b[4]/pb-1)*100):''}</td>`:''}</tr>`}).join('')}</tbody></table></div>`;
}

/* ---------- componente ---------- */
const opt=(sel,allowNone)=>(allowNone?`<option value=""${!sel?' selected':''}>— nenhum —</option>`:'')+`<optgroup label="Ativos">`+Object.keys(SYMS).map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(k)} · ${esc(SYMS[k])}</option>`).join('')+`</optgroup>`+(allowNone?`<optgroup label="Indicadores (Banco Central)">`+Object.keys(ECON).map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(ECON[k][1])}</option>`).join('')+`</optgroup>`:'')+(sel&&!SYMS[sel]&&!ECON[sel]?`<option value="${esc(sel)}" selected>${esc(sel)}</option>`:'');
function shell(){
  return `<section id="v421-gp" class="gp" aria-label="Gráfico do Terminal">
  <div class="gp-head" data-gp-head></div>
  <div class="gp-bar1">
    <div class="gp-seg gp-style-seg" role="group" aria-label="Tipo de gráfico"><button type="button" data-gp-style="line" aria-pressed="${(st.style||'line')==='line'}">Linha</button><button type="button" data-gp-style="candles" aria-pressed="${st.style==='candles'}">Candles</button></div>
    <label class="gp-sel gp-a"><span class="sr">Ativo principal</span><select data-gp-a>${opt(st.a)}</select></label>
    <div class="gp-menuwrap"><button type="button" class="gp-btn" data-gp="presets" aria-expanded="false">Gráficos prontos ▾</button><div class="gp-menu" data-gp-menu hidden>${PRESETS.map(([a,b,l],i)=>`<button type="button" data-gp-preset="${i}">${esc(l)}</button>`).join('')}</div></div>
    <div class="gp-seg" role="group" aria-label="Escala"><button type="button" data-gp-mode="dual">Eixo duplo</button><button type="button" data-gp-mode="base">Base 100</button><button type="button" data-gp-mode="ratio">Razão A/B</button></div>
  </div>
  <div class="gp-bar2">
    <div class="gp-per" role="group" aria-label="Período">${PER.map(([p])=>`<button type="button" data-gp-per="${p}">${p}</button>`).join('')}</div>
    <select class="gp-freq" data-gp-freq aria-label="Frequência"><option value="D">Diário</option><option value="S">Semanal</option><option value="M">Mensal</option></select>
    <div class="gp-ma-group" role="group" aria-label="Médias móveis"><span>Médias</span>${[20,50,200].map(n=>`<button type="button" data-gp-ma="${n}">${n}</button>`).join('')}</div>
    <button type="button" class="gp-chk" data-gp="ev"><i></i>Eventos-chave</button>
    <button type="button" class="gp-btn" data-gp="table">Tabela</button>
  </div>
  <div class="gp-bar3">
    <label class="gp-sel gp-b"><span>+ Adicionar dado</span><select data-gp-b>${opt(st.b,true)}</select></label>
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
function syncControls(el){
  el.querySelectorAll('[data-gp-nav="hand"],[data-gp-nav="price"],[data-gp-nav="time"]').forEach(b=>
    b.setAttribute('aria-pressed',String((st.navMode||'hand')===b.dataset.gpNav)));
  el.querySelectorAll('[data-gp-per]').forEach(b=>b.classList.toggle('on',b.dataset.gpPer===st.per));
  el.querySelectorAll('[data-gp-mode]').forEach(b=>{const m=isEcon(st.b)?'dual':st.mode;b.classList.toggle('on',b.dataset.gpMode===m);b.disabled=!st.b||(isEcon(st.b)&&b.dataset.gpMode!=='dual')});
  el.querySelectorAll('[data-gp-ma]').forEach(b=>b.classList.toggle('on',st.ma.includes(+b.dataset.gpMa)));
  el.querySelector('[data-gp="ev"]')?.classList.toggle('on',st.ev);
  el.querySelector('[data-gp="table"]')?.classList.toggle('on',st.table);
  const f=el.querySelector('[data-gp-freq]');if(f){f.value=st.freq;f.disabled=ivOf()!=='1d'}
  const a=el.querySelector('[data-gp-a]');if(a&&a.value!==st.a)a.innerHTML=opt(st.a);
  const b=el.querySelector('[data-gp-b]');if(b&&b.value!==(st.b||''))b.innerHTML=opt(st.b,true);
}
function paint(){
  const el=doc.getElementById('v421-gp');if(!el)return;
  syncControls(el);
  el.querySelector('[data-gp-head]').innerHTML=header(st.a);
  const plot=el.querySelector('[data-gp-plot]');
  if(st.table){plot.innerHTML=table();lastGeom=null}else{const r=svg();plot.innerHTML=r.html}
  const iv=ivOf(),na=bars(st.a,iv).length,nb=st.b?bars(st.b,iv).length:0;
  const notes=[meta(st.a,iv),st.b?meta(st.b,iv):''].filter(Boolean);
  const error=errOf(st.a,iv),secondaryError=st.b?errOf(st.b,iv):'';
  const sourceWarning=[error?st.a+': '+error:'',secondaryError?st.b+': '+secondaryError:''].filter(Boolean).join(' · ').slice(0,250);
  const gpNotice=el.querySelector('[data-gp-source-status]');
  if(gpNotice){
    gpNotice.hidden=!sourceWarning;
    gpNotice.textContent=sourceWarning?'Fonte indisponível ou com falha — '+sourceWarning+' · Atualize o histórico para tentar novamente.':'';
  }
  el.querySelector('[data-gp-foot]').innerHTML=`<span>${esc(name(st.a))}${st.b?' × '+esc(name(st.b)):''} · ${iv==='1d'?'diário':iv} · ${na}${st.b?'/'+nb:''} pontos · Yahoo Finance (com atraso)${isEcon(st.b)?' · indicador: Banco Central (SGS), vale até a próxima divulgação':''}</span>${notes.length?`<span class="gp-note">${esc([...new Set(notes)].join(' · '))}</span>`:''}${st.b&&isEcon(st.b)&&econErr.get(st.b)?`<span class="gp-err">${esc(econErr.get(st.b))}</span>`:''}${ivOf()==='1d'&&['Máx','2A'].includes(st.per)?'<span class="gp-note">A fonte gratuita entrega até 2 anos de histórico diário.</span>':''}`;
}
async function load(force){
  const iv=ivOf();const jobs=[fetchSym(st.a,iv,force)];if(st.b)jobs.push(fetchSym(st.b,iv,force));
  // cabeçalho usa diário + 5 min
  jobs.push(fetchSym(st.a,'1d',force));if(iv!=='5m')jobs.push(fetchSym(st.a,'5m',force));
  paint();await Promise.allSettled(jobs);paint();
}
function mount(){
  // v428: outra camada pode indicar onde o gráfico fica (ex.: Mercado → Cotações); sem isso, Terminal como antes
  const host=g(()=>root.V428_gpHost&&root.V428_gpHost(),null);
  let ref=null,dash=null;
  if(host&&host.ref){ref=host.ref}
  else{
    if(g(()=>tab,'')!=='term')return;
    dash=doc.getElementById('tf413');if(!dash)return;
    ref=dash.querySelector('.tf413-main');if(!ref)return;
  }
  const ex=doc.getElementById('v421-gp');
  if(ex){if(ex.nextElementSibling!==ref&&ref.parentNode)ref.before(ex);return}
  const wrap=doc.createElement('div');wrap.innerHTML=shell();
  ref.before(wrap.firstElementChild);
  if(dash)dash.classList.add('v421-has-gp');
  try{root.V428_gpMounted&&root.V428_gpMounted()}catch(e){}
  load(false);
}
// v428: leitura e troca do que o gráfico mostra (cada sub-aba guarda o seu)
root.DIARIO_V421={get:()=>JSON.parse(JSON.stringify(st)),set:o=>{Object.assign(st,o||{});save();try{syncControls()}catch(e){};load(false)},syms:SYMS,econ:ECON,presets:PRESETS};

/* ---------- interação ---------- */
doc.addEventListener('click',e=>{
  const el=e.target.closest('#v421-gp');if(!el)return;
  const t=e.target.closest('[data-gp],[data-gp-style],[data-gp-per],[data-gp-mode],[data-gp-ma],[data-gp-preset],[data-gp-rel],[data-gp-nav]');if(!t)return;
  e.preventDefault();
  if(t.dataset.gpStyle){
    st.style=t.dataset.gpStyle==='candles'?'candles':'line';
    if(st.style==='candles'&&st.mode!=='single'){st.mode='single';}
    save();
    el.querySelectorAll('[data-gp-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gpStyle===st.style)));
    paint();return;
  }
  if(t.dataset.gpNav){
    const mode=t.dataset.gpNav;
    if(['hand','price','time'].includes(mode)){st.navMode=mode;save();syncControls(el);return}
    if(mode==='zin')navZoom(.75,.5);
    if(mode==='zout')navZoom(1.33,.5);
    if(mode==='reset')navReset();
    paint();return;
  }
  if(t.dataset.gpRel){st.b=t.dataset.gpRel;if(st.mode==='single')st.mode='dual';save();const m=el.querySelector('[data-gp-relmenu]');m.hidden=true;el.querySelector('[data-gp="rel"]').setAttribute('aria-expanded','false');load(false);return}
  if(t.dataset.gpPer){st.per=t.dataset.gpPer;save();load(false);return}
  if(t.dataset.gpMode){st.mode=t.dataset.gpMode;save();paint();return}
  if(t.dataset.gpMa){const n=+t.dataset.gpMa;st.ma=st.ma.includes(n)?st.ma.filter(x=>x!==n):[...st.ma,n];save();paint();return}
  if(t.dataset.gpPreset!=null){const p=PRESETS[+t.dataset.gpPreset];st.a=p[0];st.b=p[1];if(st.mode==='single')st.mode='dual';save();el.querySelector('[data-gp-menu]').hidden=true;el.querySelector('[data-gp="presets"]').setAttribute('aria-expanded','false');load(false);return}
  const a=t.dataset.gp;
  if(a==='presets'){const m=el.querySelector('[data-gp-menu]');m.hidden=!m.hidden;t.setAttribute('aria-expanded',String(!m.hidden));if(!m.hidden){const r=t.getBoundingClientRect();const w=Math.min(260,innerWidth-16);m.style.width=w+'px';m.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';const below=r.bottom+4;const h=m.offsetHeight;m.style.top=(below+h>innerHeight-8?Math.max(8,r.top-h-4):below)+'px'}return}
  if(a==='rel'){const m=el.querySelector('[data-gp-relmenu]');m.innerHTML=`<p class="gp-menuhead">Comparar ${esc(st.a)} com</p>`+related(st.a).map(x=>`<button type="button" data-gp-rel="${esc(x)}">${esc(isEcon(x)?ECON[x][1]:x+' · '+name(x))}</button>`).join('');m.hidden=!m.hidden;t.setAttribute('aria-expanded',String(!m.hidden));if(!m.hidden){const r=t.getBoundingClientRect();const w=Math.min(280,innerWidth-16);m.style.width=w+'px';m.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';const h=m.offsetHeight;m.style.top=(r.bottom+4+h>innerHeight-8?Math.max(8,r.top-h-4):r.bottom+4)+'px'}return}
  if(a==='ev'){st.ev=!st.ev;save();paint();return}
  if(a==='table'){st.table=!st.table;save();paint();return}
  if(a==='reload'){load(true);return}
  if(a==='help'){const h=doc.querySelector('#tf413 .tf413-main [data-tf413-cmd="HELP"]');if(h)h.click();else{const i=doc.getElementById('trcmd');if(i){i.value='HELP';i.closest('.trcmdw')?.querySelector('[data-tr="go"]')?.click()}}return}
  if(a==='full'){el.classList.toggle('gp-full');doc.body.classList.toggle('gp-noscroll',el.classList.contains('gp-full'));paint();return}
  if(a==='free'){const i=el.querySelector('[data-gp-free]');const v=String(i.value||'').trim().toUpperCase().replace(/[^A-Z0-9=.^:!-]/g,'').slice(0,16);if(v){st.b=v;save();i.value='';load(false)}return}
});
doc.addEventListener('change',e=>{
  const el=e.target.closest('#v421-gp');if(!el)return;
  if(e.target.matches('[data-gp-a]')){st.a=e.target.value;save();load(false)}
  if(e.target.matches('[data-gp-b]')){st.b=e.target.value||'';save();load(false)}
  if(e.target.matches('[data-gp-freq]')){st.freq=e.target.value;save();paint()}
});
addEventListener('scroll',()=>{const rm=doc.querySelector('#v421-gp [data-gp-relmenu]');if(rm&&!rm.hidden)rm.hidden=true;const m=doc.querySelector('#v421-gp [data-gp-menu]');if(m&&!m.hidden){m.hidden=true;doc.querySelector('#v421-gp [data-gp="presets"]')?.setAttribute('aria-expanded','false')}},{passive:true});
doc.addEventListener('keydown',e=>{
  if(e.key==='Escape'){const el=doc.querySelector('#v421-gp.gp-full');if(el){el.classList.remove('gp-full');doc.body.classList.remove('gp-noscroll');paint()}}
  if(e.key==='Enter'&&e.target.matches?.('#v421-gp [data-gp-free]')){e.preventDefault();e.target.parentElement.querySelector('[data-gp="free"]').click()}
});
doc.addEventListener('click',e=>{if(!e.target.closest('.gp-menuwrap')){const r=doc.querySelector('#v421-gp [data-gp-relmenu]');if(r&&!r.hidden){r.hidden=true;doc.querySelector('#v421-gp [data-gp="rel"]')?.setAttribute('aria-expanded','false')}const m=doc.querySelector('#v421-gp [data-gp-menu]');if(m&&!m.hidden){m.hidden=true;doc.querySelector('#v421-gp [data-gp="presets"]')?.setAttribute('aria-expanded','false')}}});

/* v526 — Mouse e toque no GP principal. Prévia acompanha a mão;
   apenas ao soltar são recalculados os pontos e os dois eixos. */
let gpDrag=null;
const pointOf=e=>({x:e.clientX,y:e.clientY});
const gapOf=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function gpPointerDown(e){
  const svgEl=e.target.closest?.('#v421-gp .gp-svg');
  if(!svgEl||e.button>0||st.table)return;
  const rect=svgEl.getBoundingClientRect();
  if(rect.width<20||rect.height<20)return;
  if(!gpDrag||gpDrag.svg!==svgEl)
    gpDrag={svg:svgEl,rect,points:new Map(),starts:new Map(),pinch:false,startPinch:null,finalPinch:null};
  gpDrag.points.set(e.pointerId,pointOf(e));
  gpDrag.starts.set(e.pointerId,pointOf(e));
  if(gpDrag.points.size===2){
    gpDrag.pinch=true;
    gpDrag.startPinch=[...gpDrag.points.values()].map(p=>({...p}));
    gpDrag.finalPinch=gpDrag.startPinch;
    gpDrag.svg.querySelector('.gp-view-series')?.removeAttribute('transform');
  }
  try{svgEl.setPointerCapture?.(e.pointerId)}catch(_){}
  if(e.cancelable)e.preventDefault();
  e.stopPropagation();
}
function gpPointerMove(e){
  const d=gpDrag;
  if(!d||!d.points.has(e.pointerId))return;
  d.points.set(e.pointerId,pointOf(e));
  if(e.cancelable)e.preventDefault();
  e.stopImmediatePropagation();
  if(d.pinch){
    if(d.points.size===2)d.finalPinch=[...d.points.values()].map(p=>({...p}));
    return;
  }
  const p=[...d.points.values()][0],start=[...d.starts.values()][0];
  const dx=p.x-start.x,dy=p.y-start.y;
  const mode=st.navMode||'hand';
  const x=mode==='price'?0:clip(dx/d.rect.width*720,-720,720);
  const y=mode==='time'?0:clip(dy/d.rect.height*360,-360,360);
  const series=d.svg.querySelector('.gp-view-series');
  if(series)series.setAttribute('transform','translate('+x.toFixed(2)+','+y.toFixed(2)+')');
}
function gpPointerFinish(e,cancelled){
  const d=gpDrag;
  if(!d||!d.points.has(e.pointerId))return;
  d.points.set(e.pointerId,pointOf(e));
  if(e.cancelable)e.preventDefault();
  e.stopImmediatePropagation();
  if(d.pinch&&d.points.size===2)d.finalPinch=[...d.points.values()].map(p=>({...p}));
  d.points.delete(e.pointerId);
  if(d.points.size)return;
  gpDrag=null;
  d.svg.querySelector('.gp-view-series')?.removeAttribute('transform');
  if(cancelled)return;
  if(d.pinch&&d.startPinch&&d.finalPinch){
    const initial=gapOf(...d.startPinch),final=gapOf(...d.finalPinch);
    if(initial>18&&final>18&&Math.abs(initial-final)>7){
      const anchor=clip(((d.startPinch[0].x+d.startPinch[1].x)/2-d.rect.left)/d.rect.width,0,1);
      navZoom(clip(initial/final,.4,2.5),anchor);
      paint();
    }
    return;
  }
  const start=[...d.starts.values()][0],dx=e.clientX-start.x,dy=e.clientY-start.y;
  if(Math.hypot(dx,dy)<6)return;
  navPan(dx,dy,d.rect.width,d.rect.height,st.navMode||'hand');
  paint();
}
doc.addEventListener('pointerdown',gpPointerDown,true);
doc.addEventListener('pointermove',gpPointerMove,{capture:true,passive:false});
doc.addEventListener('pointerup',e=>gpPointerFinish(e,false),true);
doc.addEventListener('pointercancel',e=>gpPointerFinish(e,true),true);
root.addEventListener('blur',()=>{
  gpDrag?.svg?.querySelector('.gp-view-series')?.removeAttribute('transform');
  gpDrag=null;
});
doc.addEventListener('wheel',e=>{
  const svgEl=e.target.closest?.('#v421-gp .gp-svg');
  if(!svgEl)return;
  const rect=svgEl.getBoundingClientRect();
  if(e.cancelable)e.preventDefault();
  e.stopImmediatePropagation();
  const factor=e.deltaY<0?.86:1.16;
  navZoom(factor,clip((e.clientX-rect.left)/Math.max(20,rect.width),0,1));
  paint();
},{capture:true,passive:false});

// acompanhamento (Track) por toque ou mouse — crosshair horizontal + vertical + tooltip limpo
function track(ev){
  const svgEl=ev.target.closest?.('#v421-gp .gp-svg');if(!svgEl||!lastGeom)return;
  const pt=(ev.touches?ev.touches[0]:ev);const r=svgEl.getBoundingClientRect();
  const G=lastGeom;const vx=(pt.clientX-r.left)/r.width*G.W;
  let i=Math.round((vx-G.L)/(G.W-G.L-G.R)*(G.xs.length-1));i=Math.max(0,Math.min(G.xs.length-1,i));
  const x=G.X(i);const va=G.sa[i]??G.A[i][4];const y=G.YA?G.YA(va):G.T+G.chh/2;
  const c=svgEl.querySelector('.gp-cross');c.hidden=false;
  c.querySelector('.gp-cv').setAttribute('d',`M${x.toFixed(1)} ${G.T}V${G.T+G.chh}`);
  const ch=c.querySelector('.gp-ch');if(ch)ch.setAttribute('d',`M${G.L} ${y.toFixed(1)}H${G.W-G.R}`);
  const dot=c.querySelector('.gp-cdot');if(dot){dot.setAttribute('cx',x.toFixed(1));dot.setAttribute('cy',y.toFixed(1));}
  const d=new Date(G.xs[i]*1000).toLocaleString('pt-BR',ivOf()==='1d'?{day:'2-digit',month:'2-digit',year:'numeric'}:{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const bar=G.A[i],vb=G.B?.[i]?.[1]?.[4];
  const ohlc=(st.style==='candles'&&bar)?` A:${nf(bar[1])} M:${nf(bar[2])} m:${nf(bar[3])} F:${nf(bar[4])}`:` ${nf(bar[4])}`;
  const txt=`${d} · ${st.a}${ohlc}${vb!=null?' · '+st.b+' '+nf(vb):''}`;
  const tEl=c.querySelector('.gp-ct');tEl.textContent=txt;
  const w=Math.min(G.W-20,txt.length*6.3+18);let bx=x+12;if(bx+w>G.W-G.R)bx=Math.max(G.L+4,x-12-w);
  const by=Math.max(G.T+6,Math.min(G.T+G.chh-26,y-12));
  tEl.setAttribute('x',(bx+9).toFixed(1));tEl.setAttribute('y',(by+15).toFixed(1));
  const box=c.querySelector('.gp-cbox');box.setAttribute('x',bx.toFixed(1));box.setAttribute('y',by.toFixed(1));box.setAttribute('width',w.toFixed(1));box.setAttribute('height','22');
}
doc.addEventListener('pointermove',track,{passive:true});
doc.addEventListener('touchmove',e=>{if(e.target.closest?.('#v421-gp .gp-svg'))track(e)},{passive:true});
doc.addEventListener('pointerleave',e=>{const c=doc.querySelector('#v421-gp .gp-cross');if(c&&e.target===doc.documentElement)c.hidden=true},true);

/* ---------- montagem ---------- */
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v421)return false;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{mount()}catch(e){console.warn('v421',e)}return o};f.__v421=1;root.render0=f;return true;
}
hook();
// o painel do Terminal é montado de forma assíncrona; confere só enquanto a aba Terminal estiver aberta
setInterval(()=>{if(doc.hidden)return;if(g(()=>tab,'')==='term'||g(()=>root.V428_gpHost&&root.V428_gpHost(),null)){if(!root.render0?.__v421)hook();mount()}},2500);
// atualiza o preço do cabeçalho e o gráfico sem redesenhar a página
setInterval(()=>{if(!doc.hidden&&g(()=>tab,'')==='term'&&doc.getElementById('v421-gp'))load(false)},60000);
root.DIARIO_GP421={paint,load,state:()=>st,view:()=>({...gpView}),reset:navReset};
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
    }, 3500),
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
            (r) => r.rules === "s" && !(r.err && r.err !== "Nenhum"),
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
    }, 6e3),
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
          ? t.filter((o) => o.rules === "s" && !(o.err && o.err !== "Nenhum"))
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
    }, 4e3),
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
      }, 4e3),
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
      setInterval(() => { o.hidden || h(); }, 4e3),
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
    <button type="button" class="v597-fs" data-v597-fs aria-label="Tela cheia"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg></button></div>
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
    /* v973: desativa loop legado v502 (getComputedStyle + font-size:12px !important em até 4.000 nós a cada render/700ms/3s)
       que causava tremor e letras aumentando/diminuindo em várias telas; a tipografia é controlada direto no CSS. */
    e.DIARIO_V502 = { ajusta: () => {} };
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
      if(window.DiarioSessoes)return window.DiarioSessoes.context().phase;
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

/* v598 — Calculadora de tamanho de posição integrada ao risco do dia (Operações e comando CALC no Terminal). */
try {
  (function (w) {
    "use strict";
    const d = w.document;
    if (!d) return;
    const ATIVOS = {
        WIN: { nome: "WIN (mini índice)", porPonto: 0.2, unid: "contrato", unids: "contratos", tick: 5 },
        WDO: { nome: "WDO (mini dólar)", porPonto: 10, unid: "contrato", unids: "contratos", tick: 0.5 },
        ACAO: { nome: "Ações", porPonto: 1, unid: "ação", unids: "ações", lote: 100 },
        OPC: { nome: "Opções", porPonto: 1, unid: "opção", unids: "opções", lote: 100 },
      },
      brl = (v) => (Number.isFinite(+v) ? (+v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"),
      num = (v) => {
        let t = String(v ?? "").trim().replace(/\s|R\$/g, "");
        /* "1.234,56" e "5,35" → vírgula decimal; "5.35" → ponto decimal; "130.250" → milhar. */
        t = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d+\.\d{1,2}$/.test(t) ? t : t.replace(/\./g, "");
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : NaN;
      },
      esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]),
      risco = () => {
        try {
          return w.DiarioRisco?.hoje?.() || {};
        } catch {
          return {};
        }
      },
      lotesCapital = () => {
        try {
          return typeof capCalc == "function" ? capCalc("D")?.lotes ?? null : null;
        } catch {
          return null;
        }
      };

    /* v672 — Somente a calculadora de Operações, sem modificar a versão do Terminal. */
    const preco672 = (v,ativo) => Number.isFinite(v) ? Number(v).toLocaleString("pt-BR",{minimumFractionDigits:ativo==="WIN"?0:2,maximumFractionDigits:6}) : "—";
    function tamanho672(o) {
      const tipo=o.ativo in ATIVOS?o.ativo:"WIN", a=ATIVOS[tipo], lado=o.lado==="V"?"V":"C";
      const r=num(o.risco), e=num(o.entrada), stop=num(o.stop), direto=num(o.stopDireto);
      if(!(r>0))return {erro:"Informe o risco disponível em R$."};
      let dist;
      if(o.modo!=="direto"){
        if(!(e>0)||!(stop>0))return {erro:"Informe os preços de entrada e do stop."};
        dist=Math.abs(e-stop);
        if(!(dist>0))return {erro:"Entrada e stop não podem ser iguais."};
      }else{
        if(!(direto>0))return {erro:"Informe a distância do stop em pontos ou R$ por unidade."};
        dist=o.unidade==="reais"?direto/a.porPonto:direto;
      }
      if(!(dist>0)||!Number.isFinite(dist))return {erro:"Distância de stop inválida."};
      const porUnid=dist*a.porPonto;
      let qtd=Math.floor(r/porUnid+1e-9),limitado=false;
      if(!a.lote&&o.capitalMax!=null&&Number.isFinite(o.capitalMax)&&o.capitalMax>=0&&o.capitalMax<qtd){
        qtd=Math.floor(o.capitalMax);limitado=true;
      }
      const sinal=lado==="C"?1:-1;
      const alvo=k=>e>0&&qtd>0?{preco:e+sinal*k*dist,lucro:qtd*porUnid*k}:null;
      return {tipo,lado,qtd,dist,porUnid,riscoUsado:qtd*porUnid,limitado,
        alvo2:alvo(2),alvo3:alvo(3),
        ladoInvalido:o.modo!=="direto"&&((lado==="C"&&stop>=e)||(lado==="V"&&stop<=e))};
    }
    function parcial672(o){
      const tipo=o.ativo in ATIVOS?o.ativo:"WIN",a=ATIVOS[tipo],lado=o.lado==="V"?"V":"C";
      const total=num(o.total),q=num(o.parcial),entrada=num(o.entrada),saida=num(o.saida);
      if(!Number.isInteger(total)||total<=0)return {erro:"Informe uma quantidade total inteira e maior que zero."};
      if(!(entrada>0)||!(saida>0))return {erro:"Informe os preços de entrada e da parcial."};
      if(!Number.isInteger(q)||q<=0||q>total)return {erro:"A parcial deve ser inteira, positiva e não superar a quantidade total."};
      const sinal=lado==="C"?1:-1,restante=total-q;
      const realizado=(saida-entrada)*q*a.porPonto*sinal;
      const riscoZero=restante>0?entrada-sinal*realizado/(restante*a.porPonto):null;
      const tick=a.tick||.01;
      const executavel=riscoZero===null?null:(sinal===1
        ?Math.ceil(riscoZero/tick-1e-9)*tick:Math.floor(riscoZero/tick+1e-9)*tick);
      return {tipo,lado,realizado,restante,medioOriginal:entrada,medioAjustado:riscoZero,
        riscoZero,executavel,tick};
    }
    function html672(){
      const r=risco(),disp=Number.isFinite(r.disponivel)?r.disponivel:null;
      const opcoes=Object.entries(ATIVOS).map(([k,a])=>'<option value="'+k+'">'+esc(a.nome)+'</option>').join("");
      return '<form class="v598-calc v672-calc" data-calc598 data-origem="operacoes" data-c672-modo="preco" onsubmit="return false" aria-label="Calculadora de Tamanho de Posição e Parcial">'+
        '<details class="v672-details" open><summary>Gerenciamento de risco <small>Recolher / expandir</small></summary><div class="v672-content">'+
        '<div class="v672-tabs" role="tablist" aria-label="Ferramentas de risco">'+
        '<button type="button" role="tab" id="v672-tab-tam" data-c672-tab="tamanho" aria-selected="true" aria-controls="v672-pane-tam">Tamanho de Posição</button>'+
        '<button type="button" role="tab" id="v672-tab-par" data-c672-tab="parcial" aria-selected="false" aria-controls="v672-pane-par">Parcial &amp; Risco Zero</button></div>'+
        '<section class="v672-pane" data-c672-pane="tamanho" role="tabpanel" id="v672-pane-tam" aria-labelledby="v672-tab-tam">'+
        '<div class="v672-modos" role="group" aria-label="Modo de informar stop"><button type="button" data-c672-modo="preco" aria-pressed="true">Modo Preço</button><button type="button" data-c672-modo="direto" aria-pressed="false">Modo Direto</button></div>'+
        '<div class="v672-grid"><label>Ativo<select data-c598="ativo">'+opcoes+'</select></label>'+
        '<label>Lado<select data-c672="lado"><option value="C">Compra</option><option value="V">Venda</option></select></label></div>'+
        '<label>Risco disponível hoje (R$)<input data-c598="risco" inputmode="decimal" autocomplete="off" value="'+(disp===null?'':String(Math.round(disp*100)/100).replace(".",","))+'" placeholder="Risco em R$"></label>'+
        '<div class="v672-grid"><label>Preço de Entrada<input data-c598="ent" inputmode="decimal" autocomplete="off" placeholder="Ex.: 130.250"></label>'+
        '<label data-c672-field="preco">Preço do Stop<input data-c598="stop" inputmode="decimal" autocomplete="off" placeholder="Ex.: 130.000"></label></div>'+
        '<div class="v672-grid" data-c672-field="direto" hidden><label>Unidade de Stop<select data-c672="unidade"><option value="pontos">Pontos / diferença de preço</option><option value="reais">R$ por contrato/ação</option></select></label>'+
        '<label>Distância do Stop<input data-c672="stopDireto" inputmode="decimal" autocomplete="off" placeholder="Ex.: 150"></label></div>'+
        '<output class="v598-calc-res" data-c598="res" aria-live="polite">Informe os dados para calcular o lote.</output>'+
        '<small class="v598-calc-nota">Alvos 2:1 e 3:1 usam a distância do stop e o lote permitido. No Modo Direto, a entrada é necessária apenas para calcular os preços dos alvos.</small>'+
        '<small class="v598-calc-nota">Limite de perda: '+(Number.isFinite(r.limite)?brl(r.limite):"não definido")+'. Sem taxas, corretagem ou emolumentos.</small></section>'+
        '<section class="v672-pane" data-c672-pane="parcial" role="tabpanel" id="v672-pane-par" aria-labelledby="v672-tab-par" hidden>'+
        '<div class="v672-grid"><label>Ativo<select data-c672="ativoParcial"><option value="WDO">WDO · mini dólar</option><option value="WIN">WIN · mini índice</option><option value="ACAO">Ações</option></select></label>'+
        '<label>Lado<select data-c672="ladoParcial"><option value="C">Compra</option><option value="V">Venda</option></select></label>'+
        '<label>Quantidade total<input data-c672="total" inputmode="numeric" autocomplete="off" placeholder="Ex.: 10"></label>'+
        '<label>Preço médio de entrada<input data-c672="entradaParcial" inputmode="decimal" autocomplete="off" placeholder="Ex.: 5.500"></label>'+
        '<label>Quantidade da parcial<input data-c672="quantidadeParcial" inputmode="numeric" autocomplete="off" placeholder="Ex.: 4"></label>'+
        '<label>Preço da parcial<input data-c672="precoParcial" inputmode="decimal" autocomplete="off" placeholder="Ex.: 5.490"></label></div>'+
        '<output class="v598-calc-res v672-parcial-res" data-c672="resParcial" aria-live="polite">Preencha os dados para calcular o risco zero.</output>'+
        '<small class="v598-calc-nota">O preço médio contábil do saldo permanece na entrada. O médio ajustado incorpora o resultado já realizado. Projeção teórica sem taxas nem slippage.</small>'+
        '</section></div></details></form>';
    }
    function calcula672(f){
      const g=k=>f.querySelector('[data-c598="'+k+'"]'),h=k=>f.querySelector('[data-c672="'+k+'"]');
      const a=tamanho672({ativo:g("ativo").value,lado:h("lado").value,risco:g("risco").value,modo:f.dataset.c672Modo,
        entrada:g("ent").value,stop:g("stop").value,stopDireto:h("stopDireto").value,
        unidade:h("unidade").value,capitalMax:lotesCapital()});
      const out=g("res");
      if(a.erro)out.textContent=a.erro;
      else{
        const m=ATIVOS[a.tipo],plural=a.qtd===1?m.unid:m.unids;
        const lotes=m.lote?' · '+Math.floor(a.qtd/m.lote)+' lote(s) de '+m.lote+(a.qtd%m.lote?' + '+a.qtd%m.lote+' no fracionário':''):'';
        let texto='<b>'+a.qtd.toLocaleString("pt-BR")+'</b> '+plural+lotes+(a.limitado?' · limitado pelo capital':'')+
          '<span>Distância: '+preco672(a.dist,a.tipo)+' '+(m.lote?'R$ por ação':'pontos')+' · custo por unidade '+brl(a.porUnid)+' · perda no stop '+brl(a.riscoUsado)+'</span>';
        if(a.qtd>0&&a.alvo2&&a.alvo3){
          texto+='<div class="v672-alvos"><div><span>Alvo 2:1 · '+(a.lado==="C"?"Compra":"Venda")+'</span><strong>'+preco672(a.alvo2.preco,a.tipo)+'</strong><small>Lucro potencial '+brl(a.alvo2.lucro)+'</small></div>'+
            '<div><span>Alvo 3:1 · '+(a.lado==="C"?"Compra":"Venda")+'</span><strong>'+preco672(a.alvo3.preco,a.tipo)+'</strong><small>Lucro potencial '+brl(a.alvo3.lucro)+'</small></div></div>';
          if(a.ladoInvalido)texto+='<span class="v672-alert">Confira o sentido do stop: compra abaixo da entrada, venda acima.</span>';
        }else if(a.qtd>0)texto+='<span>Informe o preço de entrada para mostrar o preço exato dos alvos 2:1 e 3:1.</span>';
        if(!a.qtd)texto+='<span>O risco unitário supera o disponível: nenhum lote permitido.</span>';
        out.innerHTML=texto;
      }
      const b=parcial672({ativo:h("ativoParcial").value,lado:h("ladoParcial").value,total:h("total").value,
        entrada:h("entradaParcial").value,parcial:h("quantidadeParcial").value,saida:h("precoParcial").value});
      const res=h("resParcial");
      if(b.erro){res.textContent=b.erro;return;}
      let html='<div class="v672-line"><span>Lucro / perda realizados na parcial</span><strong class="'+(b.realizado<0?'v672-loss':'v672-gain')+'">'+brl(b.realizado)+'</strong></div>'+
        '<div class="v672-line"><span>Quantidade restante</span><strong>'+b.restante.toLocaleString("pt-BR")+'</strong></div>';
      if(b.restante){
        html+='<div class="v672-line"><span>Preço médio contábil do saldo</span><strong>'+preco672(b.medioOriginal,b.tipo)+'</strong></div>'+
          '<div class="v672-line"><span>Novo preço médio ajustado</span><strong>'+preco672(b.medioAjustado,b.tipo)+'</strong></div>'+
          '<div class="v672-line v672-zero"><span>Ponto teórico de Risco Zero</span><strong>'+preco672(b.riscoZero,b.tipo)+'</strong></div>'+
          '<small>Preço favorável ao zero no tick de '+preco672(b.tick,b.tipo)+': <b>'+preco672(b.executavel,b.tipo)+'</b>.</small>';
      }else html+='<small>Posição totalmente encerrada: não há saldo nem ponto de risco zero.</small>';
      res.innerHTML=html;
    }
    function html(origem) {
      if (origem === "operacoes") return html672();
      const r = risco(),
        disp = Number.isFinite(r.disponivel) ? r.disponivel : "";
      return `<form class="v598-calc" data-calc598 data-origem="${esc(origem)}" onsubmit="return false" aria-label="Calculadora de posição">
  <label>Ativo<select data-c598="ativo">${Object.entries(ATIVOS).map(([k, a]) => `<option value="${k}">${a.nome}</option>`).join("")}</select></label>
  <label>Risco disponível hoje (R$)<input data-c598="risco" inputmode="decimal" value="${disp === "" ? "" : String(Math.round(disp * 100) / 100).replace(".", ",")}" placeholder="Defina o limite do dia"></label>
  <div class="v598-calc-par"><label>Entrada<input data-c598="ent" inputmode="decimal" placeholder="0,00" autocomplete="off"></label><label>Stop<input data-c598="stop" inputmode="decimal" placeholder="0,00" autocomplete="off"></label></div>
  <output class="v598-calc-res" data-c598="res" aria-live="polite">${disp === "" ? "Sem limite de perda do dia configurado: digite o risco em R$." : "Digite entrada e stop."}</output>
  <small class="v598-calc-nota">Limite de perda: ${Number.isFinite(r.limite) ? brl(r.limite) : "não definido"}${Number.isFinite(r.resultadoDia) && r.resultadoDia < 0 ? " · perdas de hoje " + brl(r.resultadoDia) : ""}. Sem corretagem e emolumentos.</small>
</form>`;
    }
    function calcula(f) {
      if (f.dataset.origem === "operacoes") return calcula672(f);
      const g = (k) => f.querySelector(`[data-c598="${k}"]`),
        a = ATIVOS[g("ativo").value] || ATIVOS.WIN,
        rs = num(g("risco").value),
        ent = num(g("ent").value),
        st = num(g("stop").value),
        out = g("res");
      if (!(rs > 0)) return void (out.textContent = "Informe o risco disponível em R$.");
      if (!(ent > 0) || !(st > 0)) return void (out.textContent = "Digite entrada e stop.");
      const dist = Math.abs(ent - st);
      if (!(dist > 0)) return void (out.textContent = "Entrada e stop não podem ser iguais.");
      const porUnid = dist * a.porPonto;
      let qtd = Math.floor(rs / porUnid + 1e-9),
        extra = "";
      if (a.lote) {
        const lotes = Math.floor(qtd / a.lote);
        extra = ` · ${lotes} lote(s) de ${a.lote}${qtd % a.lote ? " + " + (qtd % a.lote) + " no fracionário" : ""}`;
      } else {
        const cap = lotesCapital();
        cap != null && cap < qtd && ((extra = ` · limitado pelo capital (${cap})`), (qtd = cap));
      }
      const perda = qtd * porUnid,
        pts = a.lote ? "R$ " + dist.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " por " + a.unid : dist.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " pontos";
      out.innerHTML = qtd > 0
        ? `<b>${qtd.toLocaleString("pt-BR")}</b> ${qtd === 1 ? a.unid : a.unids}${extra}<span>Stop de ${pts} · perda no stop ${brl(perda)} (${Math.round((perda / rs) * 100)}% do risco)</span>`
        : `<b>0</b> ${a.unids}<span>Este stop (${pts}) custa ${brl(porUnid)} por ${a.unid}: acima do risco disponível. Aproxime o stop ou não opere.</span>`;
    }
    d.addEventListener("input", (e) => {
      const f = e.target.closest?.("[data-calc598]");
      f && calcula(f);
    });
    d.addEventListener("change", (e) => {
      const f = e.target.closest?.("[data-calc598]");
      f && calcula(f);
    });
    function abrir() {
      let dlg = d.getElementById("v598-calc-dlg");
      dlg ||
        ((dlg = d.createElement("dialog")),
        (dlg.id = "v598-calc-dlg"),
        (dlg.className = "v598-calc-dlg"),
        dlg.setAttribute("aria-label", "Calculadora de posição"),
        d.body.appendChild(dlg),
        dlg.addEventListener("click", (e) => {
          (e.target === dlg || e.target.closest("[data-v598-fecha]")) && dlg.close();
        }));
      dlg.innerHTML = `<div class="v598-calc-box"><div class="v598-calc-top"><b>Calculadora de posição</b><button type="button" data-v598-fecha aria-label="Fechar">✕</button></div>${html("operacoes")}</div>`;
      dlg.open || (dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", ""));
      setTimeout(() => dlg.querySelector('[data-c598="ent"]')?.focus(), 50);
    }
    d.addEventListener("click", (e) => {
      e.target.closest?.("[data-v598-calc]") && (e.preventDefault(), abrir());
    });

    d.addEventListener("click",e=>{
      const b=e.target.closest?.("[data-c672-tab],[data-c672-modo]");
      if(!b)return;
      const f=b.closest("[data-calc598]");
      if(!f||f.dataset.origem!=="operacoes")return;
      e.preventDefault();
      const tab=b.getAttribute("data-c672-tab"),modo=b.getAttribute("data-c672-modo");
      if(tab){
        f.querySelectorAll("[data-c672-tab]").forEach(x=>x.setAttribute("aria-selected",String(x.dataset.c672Tab===tab)));
        f.querySelectorAll("[data-c672-pane]").forEach(x=>x.hidden=x.dataset.c672Pane!==tab);
      }
      if(modo){
        f.dataset.c672Modo=modo;
        f.querySelectorAll("[data-c672-modo]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.c672Modo===modo)));
        f.querySelectorAll("[data-c672-field]").forEach(x=>x.hidden=x.dataset.c672Field!==modo);
      }
      calcula672(f);
    });
    w.CalcPosicao = { abrir, html, tamanho672, parcial672 };
    /* Terminal: comando CALC abre a calculadora dentro do painel. */
    const regTerminal = () => {
      const T = w.TRM;
      if (!T || !T.EXT || T.EXT.CALC) return !!T?.EXT?.CALC;
      ((T.FN.CALC = "Calculadora de posição pelo risco do dia"),
        (T.EXT.CALC = {
          livre: !0,
          body: () => `<div class="trsec">Calculadora de posição · risco do dia</div>${html("terminal")}`,
        }));
      return !0;
    };
    if (!regTerminal()) {
      let n = 0;
      const t = setInterval(() => (regTerminal() || ++n > 40) && clearInterval(t), 500);
    }
  })(window);
} catch (e) {
  console.error("[v598] calculadora de posição", e);
}

/* v949: Bolinha de Perfil no topo direito + Busca Global Inteligente na lupa (Cmd+K). */
try {
  (function (w, d) {
    "use strict";
    if (w.__dt949TopUI) return;
    w.__dt949TopUI = 1;
    const esc = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const css = d.createElement("style");
    css.id = "dt949-style";
    css.textContent = `
      .dt949-av{position:relative;width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;border-radius:50%!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1.5px solid var(--gold,#C9A66B)!important;background:var(--ui-surface,#12151E)!important;color:var(--gold,#C9A66B)!important;font-weight:800!important;font-size:13px!important;letter-spacing:.02em;cursor:pointer;margin-left:4px!important;flex-shrink:0}
      .dt949-av i{position:absolute;right:-1px;bottom:-1px;width:9px;height:9px;border-radius:50%;border:1.5px solid var(--bg,#0b0b0c);background:#10B981}
      .dt949-av i.off{background:#C9A66B}
      #dt949-pop{position:fixed;top:calc(60px + env(safe-area-inset-top));right:12px;z-index:9999;width:min(90vw,270px);background:var(--ui-surface,#141416);color:var(--tx,#eae9e6);border:1px solid rgba(201,166,107,.4);border-radius:6px;padding:12px;font-family:inherit}
      html[data-v427-tema=claro] #dt949-pop{background:#fffdf9;color:#1b1a17;}
      #dt949-pop .p-hd{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--bd,rgba(255,255,255,.1));margin-bottom:8px}
      #dt949-pop .p-hd .p-ic{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--gold,#C9A66B);background:rgba(201,166,107,.16);color:var(--gold,#C9A66B);font-weight:800;font-size:15px;flex-shrink:0}
      #dt949-pop .p-hd b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}
      #dt949-pop .p-hd small{display:block;font-size:11.5px;color:var(--mut,#9b9a95)}
      #dt949-pop .p-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;min-height:44px;border:0;border-radius:4px;background:transparent;color:inherit;font-size:13px;text-align:left;cursor:pointer}
      #dt949-pop .p-btn:hover{background:rgba(201,166,107,.12)}
      #dt949-pop .p-sep{height:1px;background:var(--bd,rgba(255,255,255,.1));margin:6px 0}
      #dt949-pop .p-sair{color:#EF4444}
      #dt949-busca{position:fixed;inset:0 0 auto;width:min(94vw,540px);margin:max(12px,env(safe-area-inset-top)) auto auto!important;max-height:min(52dvh,430px);padding:0;border:1px solid rgba(201,166,107,.45);border-radius:6px;background:var(--ui-surface,#141416);color:var(--tx,#eae9e6);overflow:hidden}
      html[data-v427-tema=claro] #dt949-busca{background:#fffdf9;color:#1b1a17}
      #dt949-busca::backdrop{background:rgba(0,0,0,.62);backdrop-filter:blur(4px)}
      #dt949-busca .b-top{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--bd,rgba(255,255,255,.1))}
      #dt949-busca input{flex:1;border:0;outline:0;background:transparent;color:inherit;font-size:16px;min-width:0;min-height:40px;margin:0;padding:4px 0}
      #dt949-busca .b-res{max-height:min(40dvh,330px);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 8px 10px}
      #dt949-busca .b-grp{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold,#C9A66B);padding:8px 10px 4px;font-weight:700}
      #dt949-busca .b-it{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;min-height:44px;border:0;border-radius:4px;background:transparent;color:inherit;text-align:left;cursor:pointer;font-size:13.5px}
      #dt949-busca .b-it:hover{background:rgba(201,166,107,.12)}
      #dt949-busca .b-it small{color:var(--mut,#9b9a95);font-size:12px}
    `;
    d.head?.appendChild(css);

    function perfilInfo() {
      const email = (typeof SESS !== "undefined" && SESS?.email) || "";
      const nome = String((typeof S !== "undefined" && S?.cfg?.nome) || (email ? email.split("@")[0] : "Trader"));
      const inicial = (nome.trim()[0] || email.trim()[0] || "T").toUpperCase();
      const logado = !!(typeof SESS !== "undefined" && SESS?.at);
      return { nome, email, inicial, logado };
    }

    function fechaPop() {
      d.getElementById("dt949-pop")?.remove();
      d.querySelectorAll("[data-dt949-avatar]").forEach(b=>b.setAttribute("aria-expanded","false"));
    }

    function abrePop() {
      if (d.getElementById("dt949-pop")) { fechaPop(); return; }
      const info = perfilInfo();
      const pop = d.createElement("div");
      pop.id = "dt949-pop";
      pop.setAttribute("role", "region"); pop.setAttribute("aria-label","Atalhos da conta");
      pop.innerHTML = `
        <div class="p-hd">
          <div class="p-ic">${esc(info.inicial)}</div>
          <div><b>${esc(info.nome)}</b><small>${esc(info.email || (info.logado ? "Conta conectada" : "Modo local no aparelho"))}</small></div>
        </div>
        <button type="button" class="p-btn" data-p949-go="conta"><span>Conta &amp; Backup</span><span>›</span></button>
        <button type="button" class="p-btn" data-p949-go="painel"><span>Capital e Risco</span><span>›</span></button>
        <button type="button" class="p-btn" data-p949-go="import"><span>Importar do Profit</span><span>›</span></button>
        <button type="button" class="p-btn" data-p949-go="mais"><span>Aparência &amp; Config.</span><span>›</span></button>
        <button type="button" class="p-btn" data-p949-go="status"><span>Status do Sistema</span><span>›</span></button>
        <div class="p-sep"></div>
        <button type="button" class="p-btn ${info.logado ? "p-sair" : ""}" data-p949-auth="${info.logado ? "out" : "in"}"><span>${info.logado ? "Sair da conta" : "Entrar na conta"}</span><span>${info.logado ? "↗" : "›"}</span></button>
      `;
      d.body.appendChild(pop);
      d.querySelectorAll("[data-dt949-avatar]").forEach(b=>b.setAttribute("aria-expanded","true"));
      pop.querySelector("button")?.focus();
    }

    function montaAvatar() {
      const info = perfilInfo();
      d.querySelectorAll(".dt393-topbar .dt393-topactions").forEach((bar) => {
        if(bar.closest(".v503-fantasma") || (typeof tab!=="undefined"&&tab==="term")){bar.querySelector(".dt949-av")?.remove();return;}
        let btn = bar.querySelector(".dt949-av");
        if (!btn) {
          btn = d.createElement("button");
          btn.type = "button";
          btn.className = "dt949-av";
          btn.setAttribute("aria-label", "Perfil e conta");
          btn.setAttribute("data-dt949-avatar", "1");
          btn.setAttribute("aria-expanded","false"); btn.setAttribute("aria-controls","dt949-pop");
          bar.appendChild(btn);
        }
        const html = `${esc(info.inicial)}<i class="${info.logado ? "" : "off"}" aria-hidden="true"></i>`;
        if (btn.innerHTML !== html) btn.innerHTML = html;
      });
    }

    const TELAS_949 = [
      ["Início", "Panorama, Termômetro WIN/WDO e Fatos", "home"],
      ["Rotina", "Emocional, Semáforo Go/No-Go e Checklist", "dia"],
      ["Trades", "Day trade, posições e Raio-X de Sangramento", "ops"],
      ["Research", "Rankings Ações/FIIs/ETFs, Teses e Munger", "analises"],
      ["Carteira", "Patrimônio, Rebalanceamento e Proventos", "carteiras"],
      ["Opções", "Posições abertas, vencimentos e performance", "opc"],
      ["Swing Trade", "Posições de swing e scanner", "swing"],
      ["Mercado", "Agenda econômica, cotações e notícias", "mercado"],
      ["Macro & Gráficos", "Indicadores macroeconômicos e comparação de séries", "graf"],
      ["Terminal", "Gráficos avançados e comandos", "term"],
      ["Juros e DI", "Selic, curva de juros e DI futuro", "juros"],
      ["Desempenho", "Estatísticas, curva de capital e revisão", "stats"],
      ["Importar do Profit", "Subir relatório CSV de operações", "import"],
      ["Imposto de Renda", "Apuração mensal, custos e DARF", "imposto"],
      ["Calculadora de Lotes", "Risco por operação e contratos", "contratos"],
      ["Estudos", "Cérebro de Livros e padrões de candles", "estudos"],
      ["Conta & Backup", "Sincronização e exportação de dados", "conta"],
      ["Configurações", "Aparência, alertas e preferências", "mais"],
      ["Capital e Risco", "Limites, metas e capital operacional", "painel"],
      ["Status do Sistema", "Fontes e diagnóstico", "status"],
    ];

    function irRota(r) {
      try {
        if (w.DiarioRotas?.navigate) { w.DiarioRotas.navigate(r); return; }
        const b = d.querySelector(`[data-dt393-route="${r}"]`);
        if (b) { b.click(); return; }
        if (typeof tab !== "undefined") { tab = r; if (typeof render === "function") render(); }
      } catch {}
    }

    function abreBusca() {
      fechaPop();
      // Todos os pontos de entrada, inclusive o atalho capturado no núcleo, fecham a gaveta anterior.
      const drawer=d.getElementById("dt394-drawer");
      if(drawer){drawer.hidden=true;drawer.dataset.v563Aberto="";}
      d.body.classList.remove("dt394-menu-open","dt394-drawer-open");
      d.querySelectorAll('[data-dt393-action="menu"]').forEach(b=>b.setAttribute("aria-expanded","false"));
      let dlg = d.getElementById("dt949-busca");
      if (!dlg) {
        dlg = d.createElement("dialog");
        dlg.id = "dt949-busca";
        dlg.setAttribute("aria-label", "Busca global");
        dlg.innerHTML = `<div class="b-top"><span aria-hidden="true">⌕</span><input type="search" id="dt949-q" placeholder="Buscar ação, FII, trade, tese ou tela…" autocomplete="off"><button type="button" class="btn s" data-b949-x style="min-height:40px;padding:2px 8px">✕</button></div><div class="b-res" id="dt949-res"></div>`;
        d.body.appendChild(dlg);
        dlg.addEventListener("click", (ev) => {
          if (ev.target === dlg || ev.target.closest("[data-b949-x]")) { dlg.close(); return; }
          const it = ev.target.closest("[data-b949-go]");
          if (!it) return;
          const tipo = it.dataset.b949Tipo, val = it.dataset.b949Go;
          dlg.close();
          if (tipo === "rota") { irRota(val); return; }
          if (tipo === "acao" || tipo === "fii" || tipo === "tese" || tipo === "ativo") {
            if(w.DiarioAnalises?.abrirBusca949?.(tipo,val)&&typeof tab!=="undefined"&&tab!=="analises")irRota("analises");
            return;
          }
          if (tipo === "diario") {
            try { if (typeof dayD !== "undefined" && val) dayD = val; } catch {}
            irRota("dia");
            return;
          }
          if (tipo === "trade") {
            const item=typeof S!=="undefined"&&S.trades?.find(t=>String(t.id)===val);
            if(!item)return;
            irRota(item.tipo==="O"?"opc":item.tipo==="S"?"swing":"trades");
            const btn=[...d.querySelectorAll('#app:not(.v503-fantasma) [data-a="edit"][data-id]')].find(b=>b.dataset.id===val);
            if(btn){btn.click();return}
            // Reutiliza o editor original, inclusive para trades fora da paginação atual.
            const proxy=d.createElement("button");
            proxy.hidden=true;proxy.dataset.a="edit";proxy.dataset.id=val;
            d.body.appendChild(proxy);try{proxy.click()}finally{proxy.remove()}
          }
        });
        dlg.querySelector("#dt949-q").addEventListener("input", (ev) => desenhaBusca(ev.target.value));
        dlg.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&ev.target.id==="dt949-q"){ev.preventDefault();(Array.from(dlg.querySelectorAll("[data-b949-go]")).find(b=>["acao","fii","ativo"].includes(b.dataset.b949Tipo)&&b.dataset.b949Go===ev.target.value.trim().toUpperCase())||dlg.querySelector("[data-b949-go]"))?.click()}});
        dlg.addEventListener("close",()=>d.querySelector('.dt393-topbar [data-dt393-action="search"]')?.focus());
      }
      const inp = dlg.querySelector("#dt949-q");
      const recarregarBusca = () => { if (dlg.open) desenhaBusca(inp.value); };
      if (!w.DiarioAnalisesPlus?.temDadosBusca?.()) {
        try { Promise.resolve(w.DiarioAnalisesPlus?.garantirDados?.()).then(recarregarBusca); } catch {}
      }
      try { Promise.resolve(w.DiarioAnalisesPlus?.garantirFiis?.()).then(recarregarBusca); } catch {}
      if (dlg.open) { inp.focus(); return true; }
      inp.value = "";
      desenhaBusca("");
      dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
      inp.focus();
      return true;
    }
    d.addEventListener("diario:busca-pronta", () => {
      const dlg = d.getElementById("dt949-busca");
      if (dlg?.open) desenhaBusca(dlg.querySelector("#dt949-q")?.value || "");
    });
    w.DiarioBuscaGlobal=Object.freeze({abrir:abreBusca});

    function desenhaBusca(raw) {
      const box = d.getElementById("dt949-res");
      if (!box) return;
      const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      const q = norm(raw).trim();
      const out = [];
      const telas = TELAS_949.filter(([n, desc, r]) => !q || norm(n).includes(q) || norm(desc).includes(q) || r.includes(q)).slice(0, q ? 5 : 8);
      if (q.length >= 2) {
        const hits=w.DiarioAnalisesPlus?.buscarLocal949?.(q)||[];
        for (const [tipo,titulo] of [["acao","Ações"],["fii","FIIs"],["tese","Teses deste aparelho"]]) {
          const encontrados=hits.filter(t=>t.tipo===tipo).slice(0,5);
          if(encontrados.length)out.push('<div class="b-grp">'+titulo+'</div>'+encontrados.map(t=>'<button type="button" class="b-it" data-b949-tipo="'+tipo+'" data-b949-go="'+esc(t.id)+'"><b>'+esc(t.tk)+'</b><small>'+esc(t.desc)+'</small></button>').join(""));
        }
        if (/^[a-z]{4}\d{1,2}$/i.test(q) && !hits.some(t=>t.tipo!=="tese"&&t.tk===q.toUpperCase())) {
          const tk=q.toUpperCase();
          out.push('<div class="b-grp">Research</div><button type="button" class="b-it" data-b949-tipo="ativo" data-b949-go="'+tk+'"><b>'+tk+'</b><small>Consultar no universo B3 ›</small></button>');
        }
        if (!w.DiarioAnalisesPlus?.temDadosBusca?.() && !hits.some(t=>t.tipo==="acao")) {
          out.push('<p class="mut sm" style="padding:8px 10px;margin:0">Carregando base de ações e FIIs…</p>');
        }
        const trades = (typeof S !== "undefined" && Array.isArray(S?.trades) ? S.trades : [])
          .filter((t) => norm([t.ativo,t.setup,t.dt,t.tipo,t.err,t.nota,t.emot].join(" ")).includes(q))
          .slice(0, 6);
        if (trades.length) {
          out.push(`<div class="b-grp">Seus Trades</div>` + trades.map((t) => {
            const v = typeof tL === "function" ? tL(t) : Number(t.res || 0);
            const vTxt = Number.isFinite(v) && v !== 0 ? ` · ${v > 0 ? "+" : ""}${typeof R === "function" ? R(v) : v.toFixed(0)}` : "";
            const extra = t.err ? ` · ${t.err}` : (t.setup ? ` · ${t.setup}` : "");
            return `<button type="button" class="b-it" data-b949-tipo="trade" data-b949-go="${esc(t.id)}"><b>${esc(t.ativo)}</b><small>${esc(String(t.dt || "").slice(0, 10))}${esc(extra)}${esc(vTxt)}</small></button>`;
          }).join(""));
        }
        const dias = (typeof S !== "undefined" && S?.days && typeof S.days === "object" ? Object.entries(S.days) : [])
          .filter(([dt, dv]) => dv && norm([dt, dv.plano, dv.pos, dv.nota, dv.obs, dv.erros].join(" ")).includes(q))
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 4);
        if (dias.length) {
          out.push(`<div class="b-grp">Diário de Pregão</div>` + dias.map(([dt, dv]) => {
            const trecho = String(dv.plano || dv.pos || dv.nota || dv.obs || dv.erros || "").trim().slice(0, 56);
            return `<button type="button" class="b-it" data-b949-tipo="diario" data-b949-go="${esc(dt)}"><b>${esc(dt)}</b><small>${esc(trecho || "Abrir rotina do dia")}</small></button>`;
          }).join(""));
        }
      }
      if (telas.length) {
        out.push(`<div class="b-grp">Telas &amp; Ferramentas</div>` + telas.map(([n, desc, r]) => `<button type="button" class="b-it" data-b949-tipo="rota" data-b949-go="${r}"><b>${esc(n)}</b><small>${esc(desc)}</small></button>`).join(""));
      }
      box.innerHTML = out.length ? out.join("") : `<p class="mut sm" style="padding:16px;text-align:center">Nenhum resultado para "${esc(raw)}".</p>`;
    }

    d.addEventListener("click", (ev) => {
      const av = ev.target.closest?.("[data-dt949-avatar]");
      if (av) { ev.preventDefault(); ev.stopPropagation(); abrePop(); return; }
      const pGo = ev.target.closest?.("[data-p949-go]");
      if (pGo) { ev.preventDefault(); fechaPop(); irRota(pGo.dataset.p949Go); return; }
      const pAuth = ev.target.closest?.("[data-p949-auth]");
      if (pAuth) {
        ev.preventDefault();
        fechaPop();
        irRota("conta");
        if(pAuth.dataset.p949Auth === "out")d.querySelector('#app:not(.v503-fantasma) [data-a="logout"]')?.click();
        return;
      }
      if (!ev.target.closest?.("#dt949-pop")) fechaPop();
    }, true);

    d.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") fechaPop();
    });

    const contexto949=()=>String(typeof SESS!=="undefined"?SESS?.uid||"local":"local")+"|"+String(typeof tab!=="undefined"?tab:"");
    let contextoAnterior949=contexto949();
    const aposRender=()=>{const atual=contexto949();if(atual!==contextoAnterior949){contextoAnterior949=atual;fechaPop();const dlg=d.getElementById("dt949-busca");if(dlg?.open)dlg.close()}requestAnimationFrame(montaAvatar)};
    d.addEventListener("diario:render", aposRender);
    w.addEventListener("diario:render", aposRender);
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", montaAvatar, { once: true });
    else montaAvatar();
    setTimeout(montaAvatar, 400);
  })(window, document);
} catch (e) {
  console.error("[v949] perfil e busca global", e);
}
