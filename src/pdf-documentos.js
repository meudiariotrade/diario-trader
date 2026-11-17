/* PDF editorial v714: não consulta mercado, IA ou Supabase na exportação. */
DiarioChunks.functions.jvPdfBytes = async function jvPdfBytes(input) {
  const Q=window.DiarioJornalQualidade;
  let prepared=window.TraderWorkflow?.prepareJournal(input)||input;
  const e=window.DiarioJornalEditorial?.edition(prepared)||Q.prepare(prepared),snap=e.snapshot;
  const lib=await rpLib(),doc=await lib.PDFDocument.create();
  let fonts={r:await doc.embedFont(lib.StandardFonts.Helvetica),b:await doc.embedFont(lib.StandardFonts.HelveticaBold)};
  try{if(window.DiarioFontes)fonts={...fonts,...await window.DiarioFontes(doc)};}catch{}
  const W=595.28,H=841.89,M=42,CW=W-2*M,TOP=82,BOTTOM=H-52;
  const rgb=hex=>{const n=parseInt(hex.slice(1),16);return lib.rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255);};
  const colors={ink:rgb('#191C22'),muted:rgb('#59616C'),gold:rgb('#A77B21'),line:rgb('#DDE0E4'),pale:rgb('#F3F4F5'),red:rgb('#BC3939'),green:rgb('#137A58'),white:rgb('#FFFFFF')};
  const clean=x=>String(x??'').replace(/[\u0000-\u0008\u000b\u000c]/g,'').replace(/[−–—]/g,'-').replace(/\u00a0/g,' ');
  const safe=(x,font)=>{const s=clean(x);try{font.widthOfTextAtSize(s,9);return s;}catch{return s.replace(/[^\x20-\x7e\u00c0-\u00ff\n]/g,'');}};
  const pages=[],ops=[];let pg,y=TOP;
  const date=e.dia?new Date(e.dia+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'long',year:'numeric'}):'Data não informada';
  function draw(text,x,top,size=9,font='r',color=colors.ink,align='left'){
    const f=fonts[font]||fonts.r,s=safe(text,f),width=f.widthOfTextAtSize(s,size);
    const actualX=align==='right'?x-width:x;
    pg.drawText(s,{x:actualX,y:H-top-size,size,font:f,color});
    ops.push({page:pages.length,x:actualX,top,width,size,text:s});
  }
  function rule(top=y){pg.drawLine({start:{x:M,y:H-top},end:{x:W-M,y:H-top},color:colors.line,thickness:.6});}
  function addPage(){pg=doc.addPage([W,H]);pages.push(pg);y=TOP;draw('JORNAL DO PREGÃO',M,25,15,'b');draw(date,W-M,27,8,'r',colors.muted,'right');draw(e.nome||Q.phase(e).title,M,49,8,'r',colors.gold);draw(e.simulado?'AMOSTRA - DADOS SIMULADOS':'DIÁRIO DE TRADER',W-M,49,7,'b',e.simulado?colors.red:colors.muted,'right');rule(66);}
  function need(height){if(y+height>BOTTOM)addPage();}
  function lines(text,width=CW,size=9.5,font='r'){
    const f=fonts[font]||fonts.r,all=[];
    for(const paragraph of clean(text).split(/\n+/)){
      let line='';
      for(let word of paragraph.split(/\s+/).filter(Boolean)){
        word=safe(word,f);
        while(f.widthOfTextAtSize(word,size)>width){let n=word.length;while(n>1&&f.widthOfTextAtSize(word.slice(0,n),size)>width)n--;if(line){all.push(line);line='';}all.push(word.slice(0,n));word=word.slice(n);}
        const next=line?line+' '+word:word;
        if(f.widthOfTextAtSize(next,size)>width){all.push(line);line=word;}else line=next;
      }
      if(line)all.push(line);
    }return all;
  }
  function para(text,opt={}){if(!text)return;const size=opt.size||9.3,lh=size*1.38,x=opt.x||M,width=opt.width||CW,ls=lines(text,width,size,opt.font||'r');for(const line of ls){need(lh);draw(line,x,y,size,opt.font||'r',opt.color||colors.ink);y+=lh;}y+=opt.gap??6;}
  function heading(text,sub=''){const ls=lines(text,CW,17,'b');need(ls.length*22+125);y+=9;for(const line of ls){draw(line,M,y,17,'b');y+=22;}if(sub)para(sub,{size:8.5,color:colors.muted,gap:5});rule();y+=10;}
  function label(text){need(30);draw(text.toUpperCase(),M,y,7.5,'b',colors.gold);y+=16;}
  function link(labelText,url){const u=Q.url(url);if(!u)return;const size=8.1,ls=lines(labelText,CW,size);for(const line of ls){need(13);draw(line,M,y,size,'r',colors.gold);const ann=doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[M,H-y-12,W-M,H-y+1],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:lib.PDFString.of(u)}});pg.node.addAnnot(doc.context.register(ann));y+=13;}}
  function table(headers,rows,widths){
    const xs=[M];widths.slice(0,-1).forEach(w=>xs.push(xs.at(-1)+CW*w));
    function header(){need(40);pg.drawRectangle({x:M,y:H-y-23,width:CW,height:23,color:colors.ink});headers.forEach((h,i)=>draw(h,xs[i]+7,y+6,7,'b',colors.white));y+=27;}
    header();
    for(const row of rows){const blocks=row.map((c,i)=>lines(c,CW*widths[i]-14,8.2)),height=Math.max(...blocks.map(b=>b.length))*11.6+12;
      if(y+height>BOTTOM){addPage();header();}
      row.forEach((_,i)=>blocks[i].forEach((t,j)=>draw(t,i>0?xs[i]+CW*widths[i]-7:xs[i]+7,y+5+j*11.6,8.2,'r',colors.ink,i>0?'right':'left')));y+=height;rule();
    }y+=10;
  }
  const refs=Q.sources(e.fontes||[]),reference=m=>{const links=Q.sources([{titulo:m.titulo,url:m.fonte_url},...(m.fontes||[])]);return links.map(f=>{const i=refs.findIndex(r=>r.url===f.url);return i>=0?'['+(i+1)+']':'';}).filter(Boolean).join(' ');};
  function article(m,lead=false){if(!m?.titulo)return;
    const titleLines=lines(m.titulo,CW,lead?19:14,'b');need(Math.min(220,titleLines.length*(lead?24:18)+85));label([m.editoria,m.chapeu].filter(Boolean).join(' / '));
    for(const t of titleLines){draw(t,M,y,lead?19:14,'b');y+=lead?24:18;}
    if(m.linha_fina)para(m.linha_fina,{size:10,color:colors.muted});
    const structured=m.fato||m.interpretacao||m.cenario;
    if(structured){for(const [l,t]of [['Fato recebido',m.fato],['Interpretação',m.interpretacao],['Cenário condicionado / invalidação',m.cenario]])if(t){label(l);para(t);}}
    else{label('Texto da IA - conferir evidências');for(const t of String(m.texto||'').split(/\n\s*\n/))para(t);}
    if((m.numeros||[]).length)table(['Métrica','Valor informado'],m.numeros.map(n=>[n.rotulo,n.valor]),[.57,.43]);
    if(m.por_que_importa){need(38+lines(m.por_que_importa,CW,9).length*12.5);label('Por que importa');para(m.por_que_importa,{size:9,color:colors.muted});}
    if(m.placar)para('Resultado '+m.placar+' | Consenso: '+m.consenso_valor+' | Período: '+m.periodo,{size:8.5});
    if(m.conferencia_fonte?.estado)para('Conferência da fonte: '+m.conferencia_fonte.estado+' | '+m.conferencia_fonte.motivo,{size:7.6,color:colors.muted});
    const ref=reference(m);para(ref?'Fontes vinculadas: '+ref+(m.periodo?' | Período: '+m.periodo:''):'Fonte específica não vinculada; conteúdo requer conferência.',{size:7.6,color:colors.muted,gap:9});rule();y+=12;
  }
  function chart(k,g){
    if(!g)return;const data=g.d,size=180;need(size+80);label(k.toUpperCase()+' / '+g.contrato+' - '+g.dia);
    const x0=M+46,y0=y+5,ww=CW-54,hh=132,min=Math.min(...data.map(d=>d[3])),max=Math.max(...data.map(d=>d[2]));
    const px=i=>x0+i/(data.length-1)*ww,py=v=>H-y0-hh+(v-min)/(max-min||1)*hh;
    for(let j=0;j<3;j++){const v=min+(max-min)*j/2,top=H-py(v);draw(v.toLocaleString('pt-BR',{maximumFractionDigits:k==='wdo'?1:0}),M,top-4,7,'r',colors.muted);pg.drawLine({start:{x:x0,y:py(v)},end:{x:W-M,y:py(v)},thickness:.5,color:colors.line});}
    for(let i=1;i<data.length;i++)pg.drawLine({start:{x:px(i-1),y:py(data[i-1][4])},end:{x:px(i),y:py(data[i][4])},thickness:1.2,color:colors.gold});
    y=y0+hh+7;
    const tm=t=>new Date(t*1000).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
    draw(tm(data[0][0]),x0,y,7,'r',colors.muted);draw(tm(data.at(-1)[0]),W-M,y,7,'r',colors.muted,'right');y+=18;
    para('Pontos | Brasília | Fonte: '+g.fonte+' | Série parcial; não representa necessariamente o fechamento.',{size:7.5,color:colors.muted});
  }
  addPage();
  label(Q.phase(e).title);
  para('Coleta dos dados: '+(snap.coletado_em?new Date(snap.coletado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' Brasília':'não registrada nesta edição')+' | Geração do texto: '+(e.gerado?new Date(e.gerado).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'não registrada'),{size:8,color:colors.muted});
  article(e.manchete,true);
  heading(Q.phase(e).table,'Um único conjunto de referências para esta edição. Último negócio, fechamento e ajuste não são intercambiáveis.');
  table(['Ativo / unidade','Último disponível','Variação'],snap.cotacoes.map(q=>[(q.n||q.k)+' / '+q.unidade,Q.price(q),Q.change(q)]),[.48,.25,.27]);
  if((snap.macro?.ind||[]).length){heading('Indicadores e expectativas','Dados diretos do Banco Central, com o período de referência de cada série.');table(['Indicador','Valor','Referência'],snap.macro.ind.map(x=>[x.nome,Number(x.v).toLocaleString('pt-BR')+' '+x.un,x.periodo]),[.48,.25,.27]);}
  if((snap.macro?.focus||[]).length){label('Expectativas de mercado - medianas');table(['Indicador / ano','Mediana','Base anterior disponível'],snap.macro.focus.map(x=>[x.indicador+' / '+x.ano+' / '+x.data,Number(x.mediana).toLocaleString('pt-BR'),x.anterior==null?'Indisponível':Number(x.anterior).toLocaleString('pt-BR')+' / '+x.data_anterior]),[.45,.2,.35]);}
  const di=snap.cotacoes.filter(q=>/^di\d/.test(q.k)&&q.px!==null);
  if(di.length>=2){label('Juros futuros - vértices disponíveis');para(di.map(q=>(q.n||q.k)+': '+Q.price(q)+'% a.a. ('+Q.change(q)+')').join(' | '),{size:9});para('Amostra dos vértices disponíveis; não representa toda a curva. A comparação usa a variação informada pelo provedor.',{size:7.5,color:colors.muted});}
  if((snap.movers.altas||[]).length || (snap.movers.baixas||[]).length){heading('Destaques da sessão',snap.movers.fonte+' | Sessão '+snap.movers.dia);table(['Ativo','Último','Variação'],[...(snap.movers.altas||[]),...(snap.movers.baixas||[])].map(x=>[x.tk,Number(x.px).toLocaleString('pt-BR'),Q.change({d1:x.var})]),[.4,.3,.3]);}
  heading('Plano de observação - WIN e WDO',Q.phase(e).next+'. A execução permanece no Profit Pro.');
  for(const k of ['win','wdo']){const q=snap.cotacoes.find(q=>q.k===k),p=snap.niveis[k];label(k.toUpperCase());
    if(!p){para('Níveis indisponíveis: não há sessão completa e identificada do contrato nesta edição. Dados à vista ou de outro vencimento não são usados para calcular pivôs.');continue;}
    para(p.contrato+' | Sessão-base: '+p.dia+' | Fonte: '+p.fonte,{size:8,color:colors.muted});
    const fmt=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:k==='wdo'?1:0,maximumFractionDigits:k==='wdo'?1:0});
    table(['R2','R1','Pivô','S1','S2'],[[p.R2,p.R1,p.P,p.S1,p.S2].map(fmt)],[.2,.2,.2,.2,.2]);
    para('Alta: aceitação acima de '+fmt(p.R1)+' favorece observar '+fmt(p.R2)+'. Retorno abaixo de '+fmt(p.P)+' enfraquece a leitura.');
    para('Baixa: aceitação abaixo de '+fmt(p.S1)+' favorece observar '+fmt(p.S2)+'. Retorno acima de '+fmt(p.P)+' enfraquece a leitura.');
    para('Lateralidade: entre '+fmt(p.S1)+' e '+fmt(p.R1)+', sem confirmação direcional por esses níveis. Pivôs calculados não são suportes/resistências observados.',{size:8.5,color:colors.muted});
    chart(k,snap.graficos[k]);
  }
  para('Método: P=(H+L+C)/3; R1=2P-L; S1=2P-H; R2=P+(H-L); S2=P-(H-L). Arredondamento: WIN 5 pontos; WDO 0,5 ponto.',{size:7.5,color:colors.muted});
  const sections=[['Empresas e resultados',m=>m.editoria==='Empresas'],['Economia e mercados',m=>m.editoria!=='Empresas']];
  for(const [title,match]of sections){const ms=(e.materias||[]).filter(match);if(ms.length){heading(title);for(const m of ms)article(m);}}
  if(e.analise?.texto && !e.qualidade.problemas.length){heading(e.analise.titulo||'Leitura da redação','Interpretação da IA; hipóteses exigem confirmação.');para(e.analise.texto);}
  if(e.profit_local){const p=e.profit_local;heading('Suplemento privado - Profit',p.nota);para('Coleta: '+p.coletado_em,{size:8});for(const q of p.cotacoes){label(q.contrato);para('Último: '+Q.price(q)+' pontos | Negócio: '+q.referencia_em);if(q.ohlc)table(['Abertura','Máxima','Mínima','Último'],[[q.ohlc.O,q.ohlc.H,q.ohlc.L,q.ohlc.C].map(v=>v.toLocaleString('pt-BR'))],[.25,.25,.25,.25]);}p.lacunas.forEach(t=>para(t,{size:8,color:colors.muted}));}
  if(!snap.fed){heading('Expectativas de juros nos EUA','Probabilidades não confirmadas nesta edição.');link('Consultar CME FedWatch oficial','https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html');}
  if(snap.fed){const f=snap.fed;heading('Juros nos EUA','Reunião '+f.reuniao+' | '+(f.metodo==='cme'?'CME FedWatch':'Estimativa própria: '+f.metodologia));table(['Cenário','Probabilidade'],f.cenarios.map(c=>[(c.mov>0?'+':'')+c.mov+' pontos-base',c.p.toFixed(1).replace('.',',')+'%']),[.7,.3]);link('Fonte e referência: '+f.referencia_em,f.fonte_url);}
  heading('Agenda e próximos eventos','Horários de Brasília. Eventos sem data e fonte confirmadas não são preenchidos automaticamente.');
  if(!e.agenda.length)para('Agenda confirmada indisponível para esta edição. Consulte o calendário da fonte antes do próximo pregão.');
  for(const a of e.agenda){label(a.evento);para(a.quando+' | '+a.pais+(a.periodo?' | '+a.periodo:''));para('Consenso: '+(a.consenso||'indisponível')+' | Anterior: '+(a.anterior||'indisponível')+' | Realizado: '+(a.realizado||'indisponível'),{size:8.5});if(a.por_que)para(a.por_que,{size:8.5,color:colors.muted});link('Consultar fonte do evento',a.fonte_url);}
  if(e.aula?.texto){heading(e.aula.titulo||'Conceito da edição');para(e.aula.texto);}
  need(150);heading('Fontes e critérios da edição','Referência vinculada não equivale a auditoria independente do conteúdo.');
  if(!refs.length)para('Nenhuma fonte específica vinculada. Esta edição não deve ser tratada como factual sem conferência.');
  refs.forEach((f,i)=>{link('['+(i+1)+'] '+(f.titulo||new URL(f.url).hostname),f.url);if(f.publicado_em||f.consultado_em)para('Publicação: '+(f.publicado_em||'não informada')+' | Consulta: '+(f.consultado_em||'não registrada'),{size:7,color:colors.muted});});
  label('Rastreabilidade dos dados');
  for(const q of snap.cotacoes)para((q.n||q.k)+': '+q.fonte+' | '+(q.simbolo||'símbolo não registrado')+' | '+(q.contrato||'vencimento não identificado')+' | '+q.referencia_tipo+' | Negócio: '+(q.referencia_em||'horário não informado')+' | Coleta: '+(q.coletado_em||'não registrada'),{size:7.2,color:colors.muted,gap:5});
  label('Pendências de qualidade');
  [...e.qualidade.problemas,...e.qualidade.lacunas].forEach(t=>para(t,{size:7.8,color:colors.muted,gap:4}));
  para('Snapshot: '+snap.id+' | '+Q.VERSION+' | Conteúdo informativo. Cenários condicionados não são ordens de negociação.',{size:7.2,color:colors.muted});
  pages.forEach((page,i)=>{pg=page;rule(H-38);draw('DIÁRIO DE TRADER / '+(e.simulado?'DADOS SIMULADOS':'USO PESSOAL'),M,H-28,7,'b',colors.muted);draw('Página '+(i+1)+' de '+pages.length,W-M,H-28,7,'r',colors.muted,'right');});
  doc.setTitle('Jornal do Pregão - '+date);doc.setAuthor('Diário de Trader');doc.setSubject(snap.id);doc.setCreator('Diário de Trader v719');
  // Medidas ficam disponíveis para o teste de limites, sem alterar o PDF.
  window.__jornalPdfLayout=ops;
  return {bytes:await doc.save(),paginas:pages.length,snapshot_id:snap.id};
};
DiarioChunks.functions.rpNovo = async function rpNovo(e, t) {
  const { PDFDocument: a, StandardFonts: o, rgb: s } = e,
    n = await a.create();
  (n.setTitle(rpTx(t.titulo)),
    n.setAuthor("Diário de Trader"),
    n.setCreator("Diário de Trader"),
    n.setProducer("Diário de Trader"),
    n.setSubject(rpTx(t.tipo || "")));
  const r = {
      r: await n.embedFont(o.Helvetica),
      b: await n.embedFont(o.HelveticaBold),
      i: await n.embedFont(o.HelveticaOblique),
    },
    i = (m) => {
      const f = parseInt(String(m).slice(1), 16);
      return s(
        ((f >> 16) & 255) / 255,
        ((f >> 8) & 255) / 255,
        (f & 255) / 255,
      );
    },
    l = {};
  for (const m in RP_COR) l[m] = i(RP_COR[m]);
  const d = 595.28,
    c = 841.89,
    p = 44,
    u = {
      doc: n,
      F: r,
      C: l,
      W: d,
      H: c,
      M: p,
      CW: d - 2 * p,
      TOP: 66,
      BOT: c - 58,
      pg: null,
      y: 0,
      meta: t,
      hex: i,
      n: 0,
    };
  return (
    (u.add = () => {
      ((u.pg = n.addPage([d, c])),
        u.n++,
        (u.y = u.TOP),
        u.n > 1 &&
          (u.t("DIÁRIO DE TRADER", p, 30, { s: 7.5, f: "b", c: l.ac }),
          u.t(rpTx(t.cabecalho || t.titulo), p + 86, 30, {
            s: 7.5,
            c: l.mut,
            w: u.CW - 200,
          }),
          u.t(rpTx(t.data || ""), d - p, 30, { s: 7.5, c: l.mut, al: "r" }),
          u.ln(p, 42, d - p, 42, { c: l.bd, w: 0.7 })));
    }),
    (u.wd = (m, f = 10, x = "r") => r[x].widthOfTextAtSize(rpTx(m), f)),
    (u.t = (m, f, x, v = {}) => {
      const g = v.s || 10,
        h = r[v.f || "r"];
      let b = rpTx(m).replace(/\n/g, " ");
      if (v.w)
        for (; b.length > 1 && h.widthOfTextAtSize(b, g) > v.w; )
          b = b.slice(0, -2) + "…";
      const y = h.widthOfTextAtSize(b, g),
        j = v.al === "r" ? f - y : v.al === "c" ? f - y / 2 : f;
      return (
        u.pg.drawText(b, {
          x: j,
          y: c - x - g * 0.78,
          size: g,
          font: h,
          color: v.c || l.tx,
          opacity: v.op,
        }),
        y
      );
    }),
    (u.wrap = (m, f, x = 10, v = "r") => {
      const g = r[v],
        h = [];
      for (const b of rpTx(m).split(`
`)) {
        const y = b.split(" ");
        let j = "";
        for (let k of y) {
          if (!k) continue;
          for (; g.widthOfTextAtSize(k, x) > f; ) {
            let C = k.length;
            for (; C > 1 && g.widthOfTextAtSize(k.slice(0, C), x) > f; ) C--;
            (j && (h.push(j), (j = "")),
              h.push(k.slice(0, C)),
              (k = k.slice(C)));
          }
          const A = j ? j + " " + k : k;
          g.widthOfTextAtSize(A, x) <= f ? (j = A) : (h.push(j), (j = k));
        }
        h.push(j);
      }
      return h.filter((b, y, j) => b !== "" || (y > 0 && y < j.length - 1));
    }),
    (u.need = (m) => {
      u.y + m > u.BOT && u.add();
    }),
    (u.rect = (m, f, x, v, g = {}) =>
      u.pg.drawRectangle({
        x: m,
        y: c - f - v,
        width: x,
        height: v,
        color: g.fill,
        borderColor: g.stroke,
        borderWidth: g.stroke ? g.bw || 0.8 : 0,
        opacity: g.op,
        borderOpacity: g.op,
      })),
    (u.rr = (m, f, x, v, g = {}) => {
      const h = Math.min(g.r ?? 6, x / 2, v / 2),
        b = `M ${h} 0 H ${x - h} Q ${x} 0 ${x} ${h} V ${v - h} Q ${x} ${v} ${x - h} ${v} H ${h} Q 0 ${v} 0 ${v - h} V ${h} Q 0 0 ${h} 0 Z`;
      u.pg.drawSvgPath(b, {
        x: m,
        y: c - f,
        color: g.fill,
        borderColor: g.stroke,
        borderWidth: g.stroke ? g.bw || 0.8 : 0,
        opacity: g.op,
        borderOpacity: g.op,
      });
    }),
    (u.ln = (m, f, x, v, g = {}) =>
      u.pg.drawLine({
        start: { x: m, y: c - f },
        end: { x, y: c - v },
        thickness: g.w || 1,
        color: g.c || l.bd,
        dashArray: g.dash,
        opacity: g.op,
      })),
    (u.circ = (m, f, x, v = {}) =>
      u.pg.drawCircle({
        x: m,
        y: c - f,
        size: x,
        color: v.fill,
        borderColor: v.stroke,
        borderWidth: v.stroke ? v.bw || 1 : 0,
      })),
    (u.path = (m, f, x, v = {}) =>
      u.pg.drawSvgPath(m, {
        x: f,
        y: c - x,
        color: v.fill,
        borderColor: v.stroke,
        borderWidth: v.bw || 0,
      })),
    (u.pill = (m, f, x, v = {}) => {
      const g = v.s || 8.5,
        h = u.wd(m, g, "b") + g * 1.6,
        b = g * 1.9,
        y = v.al === "r" ? f - h : f;
      return (
        u.rr(y, x, h, b, { fill: v.bg || l.cz, stroke: v.bd, r: b / 2 }),
        u.t(m, y + h / 2, x + (b - g) / 2 + 0.5, {
          s: g,
          f: "b",
          c: v.c || l.tx,
          al: "c",
        }),
        h
      );
    }),
    (u.para = (m, f = {}) => {
      const x = f.s || 10,
        v = x * (f.lh || 1.45),
        g = f.x ?? p,
        h = f.w ?? u.CW;
      for (const b of Array.isArray(m) ? m : [m]) {
        if (b == null || b === "") continue;
        const y = u.wrap(b, h, x, f.f || "r");
        for (const j of y)
          (u.need(v), u.t(j, g, u.y, { s: x, f: f.f, c: f.c }), (u.y += v));
        u.y += f.gap ?? 5;
      }
    }),
    (u.bul = (m, f = {}) => {
      const x = f.s || 10,
        v = x * 1.45,
        g = f.x ?? p,
        h = (f.w ?? u.CW) - 14;
      for (const b of m) {
        if (b == null || b === "") continue;
        const y = u.wrap(b, h, x);
        (u.need(v),
          u.circ(g + 3.5, u.y + x * 0.42, 1.9, { fill: f.dot || l.ac }),
          y.forEach((j, k) => {
            (k && u.need(v), u.t(j, g + 14, u.y, { s: x, c: f.c }), (u.y += v));
          }),
          (u.y += 3));
      }
      u.y += 3;
    }),
    (u.h2 = (m, f, x = 0) => {
      const v = u.wrap(m, u.CW - 12, 13.5, "b");
      (u.need(v.length * 19 + (f ? 52 : 36) + Math.min(x, u.BOT - u.TOP - 110)),
        (u.y += 10),
        u.rect(p, u.y + 1, 3.2, Math.max(15, v.length * 19 - 4), {
          fill: l.ac,
        }));
      for (const g of v)
        (u.t(g, p + 11, u.y, { s: 13.5, f: "b", c: l.dk }), (u.y += 19));
      (f && u.para(f, { s: 8.8, c: l.mut, gap: 2 }), (u.y += 6));
    }),
    (u.h3 = (m) => {
      const f = u.wrap(m, u.CW, 10.5, "b");
      (u.need(f.length * 15 + 24), (u.y += 4));
      for (const x of f)
        (u.t(x, p, u.y, { s: 10.5, f: "b", c: l.ac }), (u.y += 15));
      u.y += 1;
    }),
    (u.nota = (m) => {
      m && u.para(m, { s: 8.3, c: l.mut, f: "i", gap: 4, lh: 1.4 });
    }),
    (u.mede = (m, f, x = {}) => {
      const v = x.s || 10,
        g = v * 1.45,
        h = 12,
        b = u.CW - 2 * h,
        y = [];
      for (const k of f) {
        if (k == null || k === "") continue;
        const A = typeof k == "object",
          C = A && k.b != null;
        (u
          .wrap(A ? (C ? k.b : k.t) : k, b - (C ? 14 : 0), v, (A && k.f) || "r")
          .forEach((I, J) =>
            y.push({ l: I, bul: C && J === 0, ind: C ? 14 : 0, f: k && k.f }),
          ),
          y.push({ gap: 1 }));
      }
      const j =
        h * 2 + (m ? 18 : 0) + y.reduce((k, A) => k + (A.gap ? 4 : g), 0);
      return { linhas: y, h: j, z: v, lh: g, pad: h };
    }),
    (u.caixa = (m, f, x = {}) => {
      const { linhas: v, h: g, z: h, lh: b, pad: y } = u.mede(m, f, x);
      if (g > u.BOT - u.TOP) {
        m && u.h3(m);
        for (const A of v) {
          if (A.gap) {
            u.y += 4;
            continue;
          }
          (u.need(b),
            A.bul &&
              u.circ(p + 3.5, u.y + h * 0.42, 1.9, { fill: x.dot || l.ac }),
            u.t(A.l, p + A.ind, u.y, { s: h, f: A.f }),
            (u.y += b));
        }
        return;
      }
      u.need(g + 4);
      const j = u.y;
      (u.rr(p, j, u.CW, g, { fill: x.bg || l.bg, stroke: x.bd || l.bd, r: 8 }),
        x.barra && u.rect(p, j + 8, 3, g - 16, { fill: x.barra }));
      let k = j + y;
      m && (u.t(m, p + y, k, { s: 10.5, f: "b", c: x.tc || l.dk }), (k += 18));
      for (const A of v) {
        if (A.gap) {
          k += 4;
          continue;
        }
        (A.bul &&
          u.circ(p + y + 3.5, k + h * 0.42, 1.9, { fill: x.dot || l.ac }),
          u.t(A.l, p + y + A.ind, k, { s: h, f: A.f, c: l.tx }),
          (k += b));
      }
      u.y = j + g + 10;
    }),
    (u.tab = (m, f, x = {}) => window.TraderPdfTable.draw(u, m, f, x)),
    (u.kpis = (m, f = {}) => {
      const x = f.cols || 4,
        v = 8,
        g = (u.CW - v * (x - 1)) / x,
        h = f.h || (m.some((b) => b.d) ? 62 : 46);
      for (let b = 0; b < m.length; b += x)
        (u.need(h + v),
          m.slice(b, b + x).forEach((y, j) => {
            const k = p + j * (g + v);
            (u.rr(k, u.y, g, h, { fill: y.bg || l.wh, stroke: l.bd, r: 7 }),
              u.t(y.l, k + 9, u.y + 8, { s: 7.6, f: "b", c: l.mut, w: g - 14 }),
              u.t(y.v, k + 9, u.y + 21, {
                s: f.vs || 15,
                f: "b",
                c: y.c || l.tx,
                w: g - 14,
              }),
              y.d &&
                u
                  .wrap(y.d, g - 16, 6.9)
                  .slice(0, 2)
                  .forEach((A, C) =>
                    u.t(A, k + 9, u.y + 41 + C * 8.5, { s: 6.9, c: l.mut }),
                  ));
          }),
          (u.y += h + v));
      u.y += 2;
    }),
    await (async () => {
      try {
        window.DiarioFontes && Object.assign(r, await window.DiarioFontes(n));
      } catch (m) {
        console.warn(
          "Fontes incorporadas indisponíveis; usando fontes padrão.",
          m,
        );
      }
    })(),
    await (async () => {
      try {
        const m = String(t.titulo || "")
            .toUpperCase()
            .match(
              /(?:^|[^A-Z0-9])(?:AAPL|MSFT|NVDA|GOOGL|GOOG|AMZN|TSLA|META|NFLX|AMD|INTC|V)(?=$|[^A-Z0-9])/g,
            )
            ?.pop()
            ?.trim(),
          f = m && window.TraderAssetIdentity?.logoInfo(m);
        if (f?.local) {
          const x = await fetch(f.url, { cache: "force-cache" });
          x.ok && (u.assetLogo = await n.embedPng(await x.arrayBuffer()));
        }
      } catch {}
    })(),
    u.add(),
    u
  );
};
