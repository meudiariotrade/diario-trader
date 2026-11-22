/* v714: mesma edição e mesmas referências na tela e no PDF. */
(function (w) {
  'use strict';
  const Q=w.DiarioJornalQualidade, cache=new Map(), privados=new Map();
  const privateKey=e=>String(e.prep_id||e.snapshot?.id||'');
  function withPrivate(e){const p=privados.get(privateKey(e));const owner=typeof SESS!=='undefined'?SESS?.uid:'';const {profit_local:ignored,...base}=e;return p&&p.owner===owner?{...base,profit_local:Q.clone(p)}:base;}
  function edition(value) {
    if(!value?.manchete) return value;
    const key=JSON.stringify(value);
    if(cache.has(key)) return withPrivate(Q.clone(cache.get(key)));
    const e=Q.prepare(value); cache.set(key,e);
    if(cache.size>8) cache.delete(cache.keys().next().value);
    return withPrivate(Q.clone(e));
  }
  // Projeção visual: validação não substitui uma capa por mensagens técnicas repetidas.
  function presentation(value){
    const e=edition(value);if(!e)return e;
    const retained=m=>/^Conteúdo retido para revisão/.test(m?.titulo||'');
    const articles=(e.materias||[]).filter(m=>!retained(m));
    if(retained(e.manchete)){
      if(articles.length)e.manchete=articles.shift();
      else {
        const quotes=(e.snapshot?.cotacoes||e.cotacoes||[]).filter(q=>Number.isFinite(q.px)),q=quotes.find(q=>q.k==='ibov')||quotes[0];
        const references=quotes.slice(0,6).map(q=>(q.n||q.k)+': '+Q.price(q)+' '+q.unidade+(Number.isFinite(q.d1)?' ('+Q.change(q)+')':'')+(q.dia_referencia?' · sessão '+q.dia_referencia:'')+'.');
        e.manchete={editoria:'Mercados',chapeu:'PANORAMA DA EDIÇÃO',titulo:q?(q.n||q.k)+' tem última referência em '+Q.price(q)+'; '+Q.phase(e).next.toLowerCase():'Mercados: '+Q.phase(e).title.toLowerCase(),linha_fina:'Cotações de referência e agenda oficial para acompanhar a sessão, com os horários de cada fonte.',texto:references.join('\n\n')+'\n\nOs valores são os últimos disponíveis na coleta desta edição. Consulte a data de cada referência antes de comparar com o pregão atual. Notícias sem confirmação suficiente permanecem fora desta leitura.',numeros:quotes.slice(0,4).map(q=>({rotulo:q.n||q.k,valor:Q.price(q)+' '+q.unidade})),por_que_importa:'Compare as referências com o contrato e os preços exibidos no Profit antes de tomar uma decisão.',impacto:{ativos:[],setores:[],direcao:''}};
      }
    }
    e.materias=articles;
    // Retoma a densidade do Jornal clássico de 16/11 com editorias completas.
    // Na ausência de reportagem comprovada, o texto de contexto usa EXCLUSIVAMENTE
    // cotações, data, fonte e variação do snapshot da edição. Não fabrica notícias.
    const referencias=(e.snapshot?.cotacoes||e.cotacoes||[]).filter(q=>Number.isFinite(q.px));
    const normal=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const buscar=re=>referencias.filter(q=>re.test(normal((q.k||'')+' '+(q.n||'')))).slice(0,4);
    const resumoRef=q=>{
      const sessao=q.dia_referencia?'na sessão '+q.dia_referencia:'na última referência disponível';
      const mudanca=Number.isFinite(q.d1)?' (variação '+Q.change(q)+')':'';
      return (q.n||q.k)+': '+Q.price(q)+' '+(q.unidade||'')+mudanca+'; '+sessao+'; fonte: '+(q.fonte||'não identificada')+'.';
    };
    const contexto=(editoria,chapeu,titulo,refs,interpretacao)=>{
      if(!refs.length)return null;
      const fatos=refs.map(resumoRef).join('\n\n');
      return {editoria,chapeu,titulo,linha_fina:'Leitura contextual das referências verificáveis, sem substituir a análise de notícias confirmadas.',
        texto:fatos+'\n\n'+interpretacao+'\n\nOs números são os últimos disponíveis nesta edição, não necessariamente preços ao vivo. Compare horários e contratos antes de operar.',
        por_que_importa:'Mudanças nessas referências podem alterar o cenário e os riscos monitorados pelo trader; não determinam por si só um movimento futuro.',
        numeros:refs.slice(0,3).map(q=>({rotulo:q.n||q.k,valor:Q.price(q)+' '+(q.unidade||'')})),
        impacto:{ativos:[],setores:[],direcao:''},fontes:[],contexto_snapshot:true};
    };
    if(e.materias.length<4){
      const grupos=[
        contexto('Commodities','ENERGIA E MINERAÇÃO','Petróleo e minério: preços de referência e fatores de atenção',
          buscar(/brent|wti|petroleo|minerio|iron|iron ore/),
          'Petróleo e minério são indicadores importantes para acompanhar os setores de energia e mineração. Variações de oferta, demanda, câmbio e custos podem afetar empresas relacionadas, mas o efeito depende do contexto e das informações divulgadas por cada companhia.'),
        contexto('Empresas','BOLSA E COMPANHIAS','Empresas e ações: sinais disponíveis na sessão',
          buscar(/ibov|ewz|vale3|petr4|petrobras/),
          'O índice e os instrumentos ligados ao mercado brasileiro ajudam a dimensionar o cenário para as ações. O desempenho de empresas específicas exige conferir seus balanços e comunicados antes de atribuir causas.'),
        contexto('Economia brasileira','CÂMBIO E JUROS','Juros e dólar: como ler as referências brasileiras',
          buscar(/di jan|^di[0-9]|dolar|wdo|usd.?brl/),
          'Taxas futuras de juros e câmbio estão entre os fatores que influenciam o custo do crédito e os preços de ativos. A sensibilidade depende do vencimento, do setor e das condições de liquidez; preços coincidentes não comprovam relação causal.'),
        contexto('Internacional','MERCADOS GLOBAIS','Bolsas internacionais e dólar: referências externas',
          buscar(/nasdaq|s&p|sp500|dow|dxy|treasury|us10|vix/),
          'Os índices americanos e as taxas de juros externas ajudam a contextualizar o pregão local. Sua influência pode variar ao longo da sessão e não permite concluir, isoladamente, se haverá entrada ou saída de capital estrangeiro.')
      ].filter(Boolean);
      for(const m of grupos){
        if(e.materias.length>=4)break;
        if(e.materias.some(a=>normal(a.editoria)===normal(m.editoria)))continue;
        e.materias.push(m);
      }
    }
    const references=referencias;
    if(!e.em_poucas_linhas?.length)e.em_poucas_linhas=references.slice(0,4).map(q=>(q.n||q.k)+': '+Q.price(q)+' '+q.unidade+(Number.isFinite(q.d1)?' ('+Q.change(q)+')':'')+'.');
    if(!e.cinco_coisas?.length)e.cinco_coisas=references.slice(0,5).map(q=>({titulo:(q.n||q.k)+': '+Q.price(q)+' '+q.unidade,texto:(Number.isFinite(q.d1)?'Variação: '+Q.change(q)+'. ':'')+(q.dia_referencia?'Sessão de referência: '+q.dia_referencia+'. ':'')+'Último disponível na coleta da edição.'}));
    return e;
  }
  function publicEdition(value){const e=presentation(value);if(e)delete e.profit_local;return e;}

  /* v840: painel técnico na tela do Jornal (índices EUA e criptos da edição), com mini gráfico de 60 dias. */
  function jrTecGlobalHtml(e){
    const SN=edition(e)?.snapshot||{},TT=SN.tecnico||{},L=TT.itens||[];if(!L.length)return jrExtrasHtml(SN)+jrSeusAtivosHtml();
    const nf=(x,d=2)=>x==null||!Number.isFinite(x)?'—':Number(x).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
    const spark=S=>{if(!S||S.length<3)return '';const mn=Math.min(...S),mx=Math.max(...S),w=160,h=36,dx=w/(S.length-1);
      const pts=S.map((v,i)=>(i*dx).toFixed(1)+','+(h-(mx>mn?(v-mn)/(mx-mn)*h:h/2)).toFixed(1)).join(' ');
      return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" class="jr840-sp" aria-hidden="true"><polyline fill="none" stroke="'+(S.at(-1)>=S[0]?'#10B981':'#EF4444')+'" stroke-width="1.5" points="'+pts+'"/></svg>';};
    return '<details class="jrsec jr840 jr-gaveta"><summary>Painel técnico · índices EUA e criptos <span class="jr-gaveta-n">('+L.length+')</span></summary><div class="jr840-grid">'+L.map(x=>
      '<div class="jr840-c"><div class="jr840-t"><b>'+esc(x.nome)+'</b><span class="jr840-tend '+esc(x.tendencia)+'">'+esc(x.tendencia)+'</span></div>'+
      '<div class="jr840-p"><b>'+(x.tipo==='cripto'?'US$ ':'')+nf(x.px,x.px<10?4:2)+'</b><i class="'+(x.d1>=0?'g':'r')+'">'+(x.d1==null?'':(x.d1>0?'+':'')+nf(x.d1)+'%')+'</i></div>'+spark(x.serie)+
      '<small>RSI 14 '+nf(x.rsi14,1)+' · vs MM20 '+(x.dist20==null?'—':nf(x.dist20,1)+'%')+' · vs MM200 '+(x.dist200==null?'—':nf(x.dist200,1)+'%')+'</small>'+
      '<small>1m '+(x.ret1m==null?'—':nf(x.ret1m,1)+'%')+' · 3m '+(x.ret3m==null?'—':nf(x.ret3m,1)+'%')+' · 52s '+nf(x.min52)+'–'+nf(x.max52)+'</small></div>').join('')+
      '</div><p class="sm mut">Candles diários (Yahoo). RSI de Wilder e médias simples. Não é recomendação.</p></details>'+jrExtrasHtml(SN)+jrSeusAtivosHtml();
  }
  /* v841: medo e ganância cripto, fluxo do EWZ e mapa de calor dos setores (S&P 500 e Ibovespa). */
  function jrExtrasHtml(SN){
    const TT=SN.tecnico||{},f=TT.fng,z=TT.ewz,se=TT.setores_eua||[],sb=SN.movers?.setores||[];
    const nf=(x,d=2)=>x==null||!Number.isFinite(x)?'—':Number(x).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
    const mi=v=>v==null?'—':(v>=0?'+':'−')+'US$ '+nf(Math.abs(v)/1e6,1)+' mi';
    const cor=v=>v>=1.5?'p3':v>=.5?'p2':v>0?'p1':v>-.5?'n1':v>-1.5?'n2':'n3';
    const heat=(t,X,lab)=>X.length?'<div class="jr841-hh">'+t+'</div><div class="jr841-heat">'+X.map(x=>{const v=x.d1??x.var;return '<div class="jr841-hc '+cor(v)+'"><b>'+esc(lab(x))+'</b><span>'+(v>0?'+':'')+nf(v)+'%'+(x.m1!=null?' · 1m '+(x.m1>0?'+':'')+nf(x.m1,1)+'%':'')+'</span></div>'}).join('')+'</div>':'';
    if(!f&&!z&&!se.length&&!sb.length)return '';
    return '<details class="jrsec jr841 jr-gaveta"><summary>Sentimento, fluxo e setores</summary><div class="jr841-two">'+
      (f?'<div class="jr840-c"><b>Medo e ganância · cripto</b><div class="jr840-p"><b class="'+(f.v>=55?'g':f.v<=45?'r':'')+'">'+f.v+'</b><small>'+esc(f.classe)+(f.semana_passada!=null?' · semana passada '+f.semana_passada:'')+'</small></div><span class="jr841-bar"><i style="width:'+f.v+'%"></i></span></div>':'')+
      (z?'<div class="jr840-c"><div class="jr840-t"><b>Fluxo de opções do EWZ</b><span class="jr840-tend '+(z.vies==='comprador'?'Alta':z.vies==='vendedor'?'Baixa':'')+'">'+esc(z.vies)+'</span></div><small>Calls '+mi(z.netC)+' · Puts '+mi(z.netP)+(z.pcVol!=null?' · put/call '+nf(z.pcVol):'')+'</small><small>Volatilidade 30 dias '+(z.iv30==null?'—':nf(z.iv30,1)+'%')+(z.rank!=null?' · IV Rank '+z.rank+'%':'')+(z.mov30!=null?' · ±'+nf(z.mov30,1)+'% em 30 dias':'')+'</small><small>Cboe, atrasado ~15 min.</small></div>':'')+
      '</div>'+heat('Setores do S&P 500 hoje',se,x=>x.nome)+heat('Setores do Ibovespa hoje',sb,x=>x.setor+' ('+x.n+')')+'</details>';
  }
  /* v841: seus ativos com o preço teto da sua fórmula (só na tela; usa o snapshot público do Screener e os valores salvos no aparelho). */
  const SA={rows:null,busy:false,at:0};
  function jrSeusAtivosHtml(){
    const I=w.DiarioInteligenciaEtapa1,V=w.DiarioScreenersInteligencia;if(!I?.meusAtivos||!V?.valuationBR)return '';
    let tetos={};try{tetos=JSON.parse(localStorage.getItem('dt-teto-v1')||'{}')||{}}catch{}
    const tks=[...new Set([...I.meusAtivos(),...Object.keys(tetos)])].filter(t=>/^[A-Z]{4}\d{1,2}$/.test(t)).slice(0,20);if(!tks.length)return '';
    if(!SA.rows&&!SA.busy&&Date.now()-SA.at>600000&&w.DiarioScreeners?.metricasPublicas){SA.busy=true;SA.at=Date.now();
      w.DiarioScreeners.metricasPublicas('BR',tks).then(r=>{SA.rows=r?.rows||[];}).catch(()=>{SA.rows=[];}).finally(()=>{SA.busy=false;try{jrPinta()}catch(_){}});}
    if(!SA.rows?.length)return SA.busy?'<section class="jrsec"><h3>Seus ativos · preço teto</h3><p class="sm mut">Carregando…</p></section>':'';
    const nf=(x,d=2)=>x==null||!Number.isFinite(x)?'—':Number(x).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
    const L=SA.rows.map(r=>{const v=V.valuationBR(r,{manual:tetos[r.ticker]||null});return {tk:r.ticker,px:r.preco_referencia,teto:v?.methods?.proprio,mg:v?.margins?.proprio,est:!!v?.estimados?.proprio,bazin:v?.methods?.bazin,graham:v?.methods?.graham}}).filter(x=>x.teto!=null).sort((a,b)=>(b.mg??-999)-(a.mg??-999));
    if(!L.length)return '';
    return '<details class="jrsec jr841 jr-gaveta"><summary>Seus ativos · preço teto <span class="jr-gaveta-n">('+L.length+')</span></summary><div class="jrvtab"><table><thead><tr><th>Ativo</th><th>Preço</th><th>Preço teto</th><th>Margem</th><th>Bazin</th><th>Graham</th></tr></thead><tbody>'+
      L.map(x=>'<tr><td><b>'+esc(x.tk)+'</b></td><td>'+nf(x.px)+'</td><td>'+nf(x.teto)+(x.est?' <small class="mut">est.</small>':'')+'</td><td class="'+(x.mg>0?'g':'r')+'">'+(x.mg>0?'+':'')+nf(x.mg,1)+'%'+(x.mg>0?' · abaixo do teto':'')+'</td><td>'+nf(x.bazin)+'</td><td>'+nf(x.graham)+'</td></tr>').join('')+
      '</tbody></table></div><p class="sm mut">Preço teto da sua fórmula (lucro projetado × payout ÷ ações ÷ yield). "est." = estimado do snapshot; ajuste na ficha em Research → Rankings. Não é recomendação.</p></details>';
  }
  w.DiarioJornalEditorial={edition,presentation};
  const journalView=vJornal;let legacyRefresh=false;
  vJornal=function(){if(!legacyRefresh && JRN.v?.manchete && !JRN.v.prep_id && !JRN.busy){legacyRefresh=true;JRN.v.antiga=true;setTimeout(()=>jrCarrega(false),0);}return journalView.apply(this,arguments);};
  const original=jrPinta;
  jrPinta=function(){
    if(JRN.v?.manchete) JRN.v=publicEdition(JRN.v);
    if(JRN.arq?.manchete) JRN.arq=publicEdition(JRN.arq);
    try{w.DiarioCerebroIA?.licoes?.(false)?.catch?.(()=>{});}catch(_){} // v841: lições do placar, uma vez por dia
    return original.apply(this,arguments);
  };
  // O painel da edição nunca é substituído por preços ao vivo de outro horário.
  jrIndsHtml=function(e){return {viv:false,h:(edition(e)?.cotacoes||[]).map(q=>`<span class="jrind"><small>${esc(q.n||q.k)}</small><b>${esc(Q.price(q))}</b><i class="${q.d1>=0?'g':'r'}">${esc(Q.change(q))}</i></span>`).join('')};};
jrFechHtml=function(e) {
  const t = (e.cotacoes || []).filter((a) => a && a.px != null);
  return t.length
    ? `<section class="jrsec jrfech"><h3>${esc(Q.phase(e).table)}</h3>${e.fechamento_texto ? `<p class="jrtx2">${esc(e.fechamento_texto)}</p>` : ""}<div class="jrvtab"><table><thead><tr><th>Ativo</th><th>Último</th><th>Variação</th></tr></thead><tbody>${t.map((a) => `<tr><td><b>${esc(a.n || a.k)}</b></td><td>${Q.price(a)}</td><td class="${a.d1 > 0 ? "g" : a.d1 < 0 ? "r" : "mut"}"><b>${Q.change(a)}</b></td></tr>`).join("")}</tbody></table></div></section>`
    : "";
}

  // Candles fornecidos atualmente por candles/WIN e candles/WDO são proxies à vista.
  // Não calcular pivôs do futuro nem descrever esse gráfico como o contrato negociável.
  jrTecDados=function(k){const e=edition(jrVer()),p=e?.snapshot?.niveis?.[k];return p?{...p,k,nome:p.tk,div:k==='wdo'?1000:1,tend:'Lateral',n:0}:null;};
  jrPlano=function(k){return jrTecDados(k);};
  jrPre=function(){return null;};
  jrGrafHtml=function(k){
    const e=edition(jrVer()),g=e?.snapshot?.graficos?.[k];
    return `<div class="jrgr" data-g="${esc(k)}"><p class="sm mut">${g?'Série do contrato disponível no PDF desta edição.':'Gráfico do contrato indisponível nesta edição. A série à vista não substitui WIN/WDO.'}</p></div>`;
  };
  jrGraf=async function(){ /* A leitura de uma edição não faz consulta de candles por polling. */ };
  jrGdHtml=function(){return '';};
  jrIndHtml=function(e){return jrIndBase(e)+jrTecGlobalHtml(e);};
  const jrIndBase=function(e){const m=edition(e)?.snapshot?.macro||{},L=m.ind||[];return L.length?`<section class="jrsec jrind2"><h3>Indicadores</h3><div class="jrkp4">${L.map(x=>`<div><small>${esc(x.nome)}</small><b>${esc(Number(x.v).toLocaleString('pt-BR')+' '+x.un)}</b><span>${esc(x.periodo)}</span></div>`).join('')}</div></section>`:'';};
jrRkHtml=function(){
  const e=edition(jrVer())?.snapshot?.movers;
  if (!e) return "";
  const t = (e.altas || [])
      .filter((s) => s.var > 0)
      .sort((s, n) => n.var - s.var)
      .slice(0, 5),
    a = (e.baixas || [])
      .filter((s) => s.var < 0)
      .sort((s, n) => s.var - n.var)
      .slice(0, 5);
  if (!t.length && !a.length) return "";
  const o = (s, n) =>
    s
      .map(
        (r) =>
          `<div class="jrrk"><b>${esc(r.tk)}</b><span class="sm mut">${esc(r.nome || "")}</span><b class="${n}">${(r.var > 0 ? "+" : "") + Number(r.var).toFixed(2).replace(".", ",")}%</b></div>`,
      )
      .join("");
  return `<details class="jrsec jrrks jr-gaveta"><summary>Maiores altas e baixas do Ibovespa</summary><div class="jrrk2"><div><div class="jrrkt g">▲ Altas</div>${o(t, "g")}</div><div><div class="jrrkt r">▼ Baixas</div>${o(a, "r")}</div></div></details>`;
}

  document.addEventListener('click',async ev=>{
    const button=ev.target.closest?.('[data-jr-profit-capture]');if(!button||button.disabled)return;
    const e=edition(jrVer()),owner=typeof SESS!=='undefined'?SESS?.uid:'';if(!e?.snapshot||!owner){button.textContent='Entre na conta para consultar a ponte';return;}
    button.disabled=true;button.textContent='Consultando ponte…';
    try{
      let rows=null;const configured=w.DIARIO_PONTE_LOCAL?.cotacoesUrl;
      if(configured){const u=new URL(configured);if(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&!u.username&&!u.password){const r=await fetch(u.href,{signal:AbortSignal.timeout(4000),cache:'no-store',credentials:'omit'});if(r.ok){const data=await r.json();rows=Array.isArray(data)?data:data.cotacoes;}}}
      if(!Array.isArray(rows)){const r=await rq('/rest/v1/cotacoes?select=ticker,ult,var,abe,max,min,hor,dat,updated_at&user_id=eq.'+encodeURIComponent(owner)+'&or=(ticker.like.WIN*,ticker.like.WDO*)&limit=12',{signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error('Ponte indisponível');rows=await r.json();}
      if(typeof SESS==='undefined'||SESS?.uid!==owner)return;
      privados.set(privateKey(e),{...Q.profit(rows,e),owner});jrPinta();
    }catch{button.disabled=false;button.textContent='Ponte indisponível · tentar novamente';}
  });
  function privateHtml(e){const p=e?.profit_local;return `<section class="jrsec"><h3>Referência privada do Profit</h3><p class="sm mut">Captura única. Não muda os números ou o texto da edição.</p><button class="btn s" data-jr-profit-capture>Capturar referência da ponte</button>${p?`<p class="sm">${esc(p.nota)}</p>${p.cotacoes.map(q=>`<p>${esc(q.contrato)} · ${esc(Q.price(q))} · ${esc(q.referencia_em)}${q.ohlc?' · OHLC informado':' · OHLC indisponível'}</p>`).join('')}${p.lacunas.map(x=>`<p class="sm mut">${esc(x)}</p>`).join('')}`:''}</section>`;}
  const renderBody=jrCorpo;
  jrCorpo=function(){
    if(JRN.v?.manchete) JRN.v=publicEdition(JRN.v);
    if(JRN.arq?.manchete) JRN.arq=publicEdition(JRN.arq);
    const html=renderBody.apply(this,arguments),e=edition(jrVer());
    if(!e?.qualidade) return html;
    const q=e.qualidade;
    const normalizedHtml=html.replace(/com pesquisa na internet e os números do app/g,e.pesquisa_web===true?'com pesquisa recuperada e dados desta edição':'com os dados recebidos; pesquisa web não confirmada em toda a edição');
    return normalizedHtml+`<details class="jr-editorial-details"><summary>Fontes e conferência</summary><p class="sm mut">${esc(Q.phase(e).title)} · ${esc(e.snapshot.id)}</p>${[...q.problemas,...q.lacunas].map(x=>`<p class="sm mut">${esc(x)}</p>`).join('')}${privateHtml(e)}</details>`;
  };

  const style=document.createElement('style');style.id='jornal-editorial-v714';style.textContent=`#app #jrbox button[data-jr-profit-capture]{min-height:44px!important;height:auto!important;max-height:none!important}.jr-editorial-details{margin-top:8px}.jr-editorial-details>summary{cursor:pointer;min-height:44px;font-size:12px;color:var(--mut)}.jr-gaveta{border:1px solid var(--bd);border-radius:10px;padding:0 12px;margin:10px 0;background:var(--bg)}.jr-gaveta>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:700;color:var(--tx);list-style:none}.jr-gaveta>summary::-webkit-details-marker{display:none}.jr-gaveta>summary::after{content:'▾';font-size:12px;color:var(--mut);transition:transform .16s ease}.jr-gaveta[open]>summary::after{transform:rotate(180deg)}.jr-gaveta[open]{padding-bottom:12px}.jr-gaveta-n{font-weight:500;color:var(--mut)}.jrind b,.jrfech td{font-variant-numeric:tabular-nums}`;document.head.append(style);
})(window);
