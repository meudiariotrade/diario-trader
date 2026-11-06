/* Navegação única e estudos dos EUA. Integra as telas existentes. */
(() => {
  'use strict';
  FN_ESPERADA.macro = 'v296';
  const groups = [
    {id:'home',name:'Início',icon:'home',description:'Resumo e rotina de hoje',items:[['home','Visão do dia']]},
    {id:'diario',name:'Diário',icon:'book',description:'Preparação, registro e revisão',items:[['dia:ed','Meu dia e checklist'],['dia:hist','Histórico do diário'],['regras','Minhas regras']]},
    {id:'operacoes',name:'Operações',icon:'chart',description:'Modalidades e desempenho',items:[['ops','Todas as modalidades'],['stats','Estatísticas'],['rev','Revisão da semana']]},
    {id:'mercado',name:'Mercado',icon:'news',description:'Contexto, monitor e sazonalidade',items:[['mercado:cq','Cotações e Panorama'],['mercado:jr','Jornal e Giro'],['mercado:ag','Agenda econômica'],['mercado:nt','Notícias e balanços'],['juros','Juros e DI'],['mercado:lab','Sazonalidade e sentimento'],['graf','Gráficos'],['live','Ponte do Profit e radar'],['mercado:al','Alertas'],['term','Terminal']]},
    {id:'patrimonio',name:'Patrimônio',icon:'wallet',description:'Carteiras, análise e impostos',items:[['carteiras','Carteiras Brasil e EUA'],['analise','Análise IA'],['imposto','Imposto de renda']]},
    {id:'gestao',name:'Gestão',icon:'shield',description:'Risco, capital e processo',items:[['mesa','Mesa proprietária'],['painel','Metas, posição e backup'],['contratos','Dimensionamento de contratos'],['carreira','Plano de transição']]},
    {id:'estudos',name:'Estudos',icon:'book',description:'Biblioteca, cursos e simulados',items:[['estudos','Central de estudos']]},
    {id:'conta',name:'Configurações',icon:'gear',description:'Conta, dados e preferências',items:[['conta','Conta e sincronização'],['import','Importar operações'],['mais','Aparência'],['status','Status das fontes']]},
  ];
  const marketGroups = [
    {name:'Mercado',items:[['mercado:cq','Cotações e Panorama'],['juros','Juros e DI'],['mercado:pn','Painel']]},
    {name:'Informação',items:[['mercado:jr','Jornal e Giro'],['mercado:nt','Notícias e balanços'],['mercado:ag','Agenda econômica']]},
    {name:'Estudos',items:[['mercado:lab','Sazonalidade e sentimento'],['graf','Gráficos']]},
    {name:'Monitor',items:[['live','Profit e radar'],['mercado:al','Alertas'],['term','Terminal']]},
  ];
  const safe = value => esc(String(value ?? ''));
  const current = () => tab === 'mercado' ? `mercado:${['saz','se','sazus'].includes(MKT.tab)?'lab':['cot','mu'].includes(MKT.tab)?'cq':MKT.tab==='giro'?'jr':MKT.tab}` : tab==='dia'?`dia:${DV==='hist'?'hist':'ed'}`:tab;
  const activeGroup = () => groups.find(group=>group.items.some(([route])=>route===current()))?.id || (['trades','swing','opc','ativos','dash','opgrade','opfluxo','opcart','swbt','dtrpy'].includes(tab)?'operacoes':'');
  const icon = name => window.icoSvg ? window.icoSvg(name) : '';
  const link = ([route,name],cls='') => `<button type="button" class="${cls}" data-navroute="${safe(route)}"${current()===route?' aria-current="page"':''}>${safe(name)}</button>`;
  function menu(panel) {
    panel.innerHTML = `<div class="pro-menu-header"><div><small>DIÁRIO DE TRADER</small><b>Seu espaço de trabalho</b></div><button type="button" data-navclose aria-label="Fechar menu">×</button></div>
      <label class="pro-menu-search">Encontrar função<input type="search" data-navsearch placeholder="Diário, sazonalidade, risco…" autocomplete="off"></label>
      <div class="pro-menu-groups">${groups.map(group=>`<details class="pro-menu-group" data-navgroup="${group.id}"${activeGroup()===group.id?' open':''}><summary><span class="pro-menu-icon">${icon(group.icon)}</span><span><b>${group.name}</b><small>${group.description}</small></span></summary><div>${group.items.map(item=>link(item)).join('')}${group.id==='mercado'?'<button type="button" data-research-menu>Pesquisa de investimentos</button><button type="button" data-flow-menu>Fluxo de negócios · Profit</button>':''}${group.id==='home'?'<button type="button" data-wf="organize-home">Organizar início</button>':''}${group.id==='conta'?'<button type="button" data-wf="quality">Dados e fontes</button><button type="button" data-wf="reports">Relatórios</button>':''}</div></details>`).join('')}</div>
      <p class="pro-menu-note">Diário e checklist no centro. Ferramentas agrupadas por tarefa.</p>`;
    panel.querySelector('[data-navclose]')?.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      const desktop=document.body.classList.contains('pc');
      document.body.classList.remove('pcmenu','trmenu');
      document.body.style.overflow='';
      if(!desktop){document.getElementById('mdr2')?.remove();document.getElementById('mdr')?.remove()}
      document.getElementById(desktop?'pcmenub':'mbtn')?.focus();
    });
    panel.querySelector('[data-navsearch]')?.addEventListener('input',event=>{
      const query=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      panel.querySelectorAll('[data-navgroup]').forEach(element=>{
        let any=false;
        element.querySelectorAll('[data-navroute],[data-wf],[data-research-menu],[data-flow-menu]').forEach(button=>{
          const match=button.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query);
          button.hidden=!match;any ||= match;
        });
        element.hidden=!any;
        element.open=query?any:element.dataset.navgroup===activeGroup();
      });
    });
  }
  window.DIARIO_NAV = {groups,marketGroups,menu,navigate};
  const existingMenu=document.querySelector?.('#mdr2 .pn');
  if(existingMenu)menu(existingMenu);
  // As abas internas seguem os mesmos grupos do menu, sem taxonomia paralela.
  grpHeader = function(route) {
    const group=groups.find(g=>g.items.some(([key])=>key===route));
    return !group||group.items.length<2?'':`<div class="pro-subtabs" role="navigation" aria-label="${safe(group.name)}">${group.items.map(item=>link(item,item[0]===route?'on':'')).join('')}</div>`;
  };
  function navigate(route) {
    const marketToMarket = tab==='mercado' && route.startsWith('mercado:');
    const oldTabs = marketToMarket ? document.querySelector('#app .m403-primary-tabs') : null;
    const oldTop = oldTabs?.getBoundingClientRect().top;
    const oldScroll = window.scrollY;
    if(['mercado:cot','mercado:mu'].includes(route))route='mercado:cq';
    if(route==='mercado:giro'){route='mercado:jr';try{sessionStorage.setItem('diario-mercado-jornal-secao','giro')}catch{}}
    const [screen,sub]=route.split(':');
    if(screen==='dia'){DV=sub||'ed';tab='dia'}
    else if(screen==='mercado'){tab='mercado';MKT.tab=sub||'mu';try{ls.set('diario-mkt-tab',MKT.tab)}catch{}}
    else {tab=screen;if(['trades','swing','opc'].includes(screen))LT=screen}
    document.getElementById('mdr2')?.remove();
    document.getElementById('mdr')?.remove();
    document.body.style.overflow='';
    render();
    if(marketToMarket && Number.isFinite(oldTop)) {
      // The progressive Mercado sections are assembled in microtasks before
      // painting; run this after them to keep the tab bar at the same pixel.
      queueMicrotask(() => {
        const currentTabs=document.querySelector('#app .m403-primary-tabs');
        if(!currentTabs)return;
        const newTop=currentTabs.getBoundingClientRect().top;
        const desired=Math.max(0,window.scrollY+newTop-oldTop);
        window.scrollTo({top:desired,behavior:'instant'});
      });
    } else window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-navroute]');
    if(!button)return;
    navigate(button.dataset.navroute);
  });
  // Um único conjunto de abas para todas as telas de mercado.
  segM = function () {
    const selected=current(), group=marketGroups.find(g=>g.items.some(([route])=>route===selected))||marketGroups[0];
    return `<div class="workbench-header"><span class="routine-eyebrow">CONTEXTO DE MERCADO</span><div class="market-heading"><h1>Mercado</h1><div><button class="btn s" data-navroute="term">Abrir terminal</button><button class="btn s" data-market-chat>Economista IA</button></div></div><p>Panorama, leitura e acompanhamento em um só espaço.</p></div><div class="pro-tabs" role="navigation" aria-label="Áreas do mercado">${marketGroups.map(g=>link([g.items[0][0],g.name],g===group?'on':'')).join('')}</div>${group.items.length>1?`<div class="pro-subtabs" role="navigation" aria-label="Ferramentas de ${safe(group.name)}">${group.items.map(item=>link(item,current()===item[0]?'on':'')).join('')}</div>`:''}`;
  };
  // Preferências deixa de repetir todas as ferramentas já presentes no menu.
  const previousMore=vMais;
  const density=()=>{try{return ls.get('diario-densidade-v284')==='compact'?'compact':'comfortable'}catch{return 'comfortable'}};
  const applyDensity=()=>document.documentElement?.setAttribute('data-density',density());
  applyDensity();
  vMais=function(){const html=previousMore.apply(this,arguments),start=html.indexOf('<h2>Apar');return '<h1>Preferências</h1><p class="mut">Personalize a aparência do seu espaço.</p>'+(start>=0?html.slice(start):html)+`<h2>Densidade da interface</h2><p class="mut sm">Confortável para escrever e usar no celular. Compacta para comparar mais informações no computador.</p><div class="pro-subtabs">${[['comfortable','Confortável'],['compact','Compacta']].map(([key,name])=>`<button type="button" data-prodensity="${key}" class="${density()===key?'on':''}" aria-pressed="${density()===key}">${name}</button>`).join('')}</div>`};

  const US={asset:'spx',view:'midterms',eventType:'midterm',window:'d1',cycle:2,month:new Date().getMonth()+1,value:null,busy:false,error:'',lastAttempt:0};
  const percent=x=>typeof x==='number'&&Number.isFinite(x)?`${x>0?'+':''}${x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`:'—';
  const cell=x=>`<span class="${x>0?'g':x<0?'r':'mut'}">${percent(x)}</span>`;
  const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  function studyTable(rows,label) {
    return `<div class="pro-table-scroll" tabindex="0" role="region" aria-label="${safe(label)}"><table class="us-table"><caption>${safe(label)}</caption><thead><tr><th scope="col">Período</th><th scope="col">Média</th><th scope="col">Mediana</th><th scope="col">Positivas</th><th scope="col">Amostra</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${safe(row.label)}</th><td>${cell(row.media)}</td><td>${cell(row.mediana)}</td><td>${row.positivas==null?'—':percent(row.positivas)}</td><td>${row.n}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function closingTable(asset) {
    const rows=(asset.catalogo||[]).filter(row=>US.eventType==='todas'||row.tipo===US.eventType);
    const number=x=>typeof x==='number'?x.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—';
    const point=(p,change)=>p?`${safe(p.d)}<br><b>${number(p.v)}</b><br>${cell(change)}`:'Sem fechamento';
    return `<details class="us-observations"><summary>Fechamentos D-1, D0 e D+1 · ${rows.filter(row=>row.concluida).length} eleições cobertas</summary><p class="sm mut">Preço de fechamento e variação contra o pregão anterior. D0 é a eleição. Quando não houve pregão em D0, o retorno posterior usa o último fechamento anterior; D0 permanece vazio. Dias sem histórico ficam vazios e não entram nas médias. Midterms desde 1950: 19 concluídas até 2022; a amostra varia conforme índice e janela.</p><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th>Ano / tipo</th><th>Eleição</th><th>D-1 · anterior</th><th>D0 · eleição</th><th>D+1 · seguinte</th></tr></thead><tbody>${rows.map(row=>`<tr><th>${row.ano}<br>${safe(row.tipo)}</th><td>${safe(row.data)}${row.concluida?'':'<br>Aguardando / sem histórico'}</td><td>${point(row.anterior,row.variacao_anterior)}</td><td>${point(row.dia,row.variacao_dia)}</td><td>${point(row.seguinte,row.variacao_seguinte)}</td></tr>`).join('')}</tbody></table></div></details>`;
  }
  function bodyUs() {
    const data=US.value;
    if(!data)return `<div class="card us-empty" role="status"><b>${US.busy?'Buscando séries históricas dos EUA…':'Histórico ainda não carregado'}</b><p>${safe(US.error||'Entre na conta para consultar os índices e calcular os estudos históricos.')}</p><button class="btn s" data-usrefresh${US.busy?' disabled':''}>${US.busy?'Aguarde':'Carregar histórico'}</button></div>`;
    const asset=data.ativos.find(a=>a.k===US.asset);
    if(!asset||asset.status!=='ok')return `<div class="card"><p>${safe(asset?.erro||'Este índice está indisponível.')}</p><button class="btn s" data-usrefresh>Tentar novamente</button></div>`;
    const rows=(US.view==='mensal'?asset.mensal:US.view==='ciclo'?asset.ciclo:asset.eleicoes?.[US.eventType]||asset.midterms)||[];
    const selected=rows.find(row=>US.view==='mensal'?row.mes===US.month:US.view==='ciclo'?row.fase===US.cycle:row.k===US.window)||rows[0];
    const title=US.view==='mensal'?'Mês a mês':US.view==='ciclo'?'Ciclo presidencial · anos civis':'Antes e depois das eleições';
    const options=rows.map(row=>{const value=US.view==='mensal'?row.mes:US.view==='ciclo'?row.fase:row.k;return `<option value="${safe(value)}"${row===selected?' selected':''}>${safe(US.view==='mensal'?monthNames[row.mes-1]:US.view==='ciclo'?`Ano ${row.fase} · ${row.nome}`:row.nome)}</option>`}).join('');
    const fullRows=rows.map(row=>({...row,label:US.view==='mensal'?monthNames[row.mes-1]:US.view==='ciclo'?`Ano ${row.fase} · ${row.nome}`:row.nome}));
    return `<div class="us-study"><div class="top"><div><h2>${title}</h2><p class="mut sm">${safe(asset.n)} · ${safe(asset.de)} a ${safe(asset.ate)} · USD</p></div><button class="btn s" data-usrefresh${US.busy?' disabled':''}>${US.busy?'Atualizando…':'Atualizar'}</button></div>
      ${US.error?`<p class="warn" role="status">${safe(US.error)} Exibindo a consulta anterior, de ${safe(new Date(data.gerado).toLocaleString('pt-BR'))}.</p>`:''}
      ${US.view==='midterms'?`<label>Tipo de eleição<select data-uselection>${[['midterm','Midterms'],['presidencial','Presidenciais'],['todas','Todas as eleições federais']].map(([key,name])=>`<option value="${key}"${US.eventType===key?' selected':''}>${name}</option>`).join('')}</select></label>`:''}
      <label>Janela de comparação<select data-usperiod>${options}</select></label>
      <div class="us-kpis"><div><span>Média histórica</span><b>${cell(selected?.media)}</b></div><div><span>Mediana</span><b>${cell(selected?.mediana)}</b></div><div><span>Janelas positivas</span><b>${selected?.positivas==null?'—':percent(selected.positivas)}</b></div><div><span>Amostra concluída</span><b>${selected?.n||0} ${US.view==='midterms'?'eleições':'anos'}</b></div></div>
      <p class="us-dispersion">Pior: ${cell(selected?.pior)} · Melhor: ${cell(selected?.melhor)} · Desvio dos retornos: ${percent(selected?.desvio)}</p>
      ${selected?.n<10?'<p class="us-caution">Amostra pequena: poucos eventos podem alterar bastante as médias.</p>':''}
      ${studyTable(fullRows,title)}
      ${US.view==='midterms'?closingTable(asset):''}
      <details class="us-observations"><summary>Conferir cada observação e suas datas</summary><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th scope="col">Ano</th><th scope="col">Fechamento inicial</th><th scope="col">Fechamento final</th><th scope="col">Retorno</th></tr></thead><tbody>${(selected?.observacoes||[]).map(row=>`<tr><th scope="row">${row.ano}</th><td>${safe(row.de)}</td><td>${safe(row.ate)}</td><td>${cell(row.valor)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhuma janela completa nesta amostra.</td></tr>'}</tbody></table></div></details>
      <details class="us-method"><summary>Metodologia e fontes</summary><p>${safe(data.metodo)}</p><p>Dados consultados em ${safe(new Date(data.gerado).toLocaleString('pt-BR'))}. Janelas positivas são frequência histórica, não probabilidade de alta futura. O desvio mede a dispersão entre retornos das janelas, não a volatilidade intradiária.</p><p><a href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a> · <a href="https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/" target="_blank" rel="noopener noreferrer">Calendário eleitoral da FEC</a></p></details></div>`;
  }
  function renderUs() {
    return `<section class="us-seasonality"><div class="pro-region"><button data-navroute="mercado:lab">Brasil e sentimento</button><button class="on" aria-current="page" data-navroute="mercado:sazus">EUA</button></div>
      <div class="us-intro"><span class="routine-eyebrow">SAZONALIDADE · EUA</span><h2>Calendário, ciclos e contexto</h2><p>Compare padrões históricos dos índices. Use como contexto para o seu plano, junto de preço, risco e cenário macro.</p></div>
      <div class="us-election-context"><b>O que são as midterms?</b><p>Eleições legislativas no meio do mandato presidencial. Elas podem mudar o controle do Congresso. A comparação abaixo agrupa os eventos por data, sem atribuir o retorno ao partido vencedor.</p>${US.value?.proxima_midterm?`<span>Próxima data: <b>${safe(US.value.proxima_midterm.split('-').reverse().join('/'))}</b></span>`:'<a href="https://www.usa.gov/midterm-elections" target="_blank" rel="noopener noreferrer">Consultar o calendário oficial</a>'}<p class="sm">Lucros, juros e surpresas de política econômica também afetam os preços. Médias históricas não isolam o efeito de uma eleição.</p></div>
      <label>Índice<select data-usasset>${[['spx','S&P 500'],['ndx','Nasdaq 100'],['dji','Dow Jones'],['rut','Russell 2000']].map(([key,name])=>`<option value="${key}"${US.asset===key?' selected':''}>${name}</option>`).join('')}</select></label>
      <div class="pro-subtabs" role="navigation" aria-label="Estudos históricos dos EUA">${[['mensal','Mês a mês'],['ciclo','Ciclo presidencial'],['midterms','Eleições']].map(([key,name])=>`<button data-usview="${key}" class="${US.view===key?'on':''}"${US.view===key?' aria-current="page"':''}>${name}</button>`).join('')}</div>
      <div id="us-study-body" aria-live="polite">${bodyUs()}</div><p class="us-footnote">Busca histórica desde 1950, conforme disponibilidade real de cada índice. Retornos em USD. Não é previsão, recomendação ou sinal de entrada.</p></section>`;
  }
  async function loadUs(force=false) {
    if(US.busy||(!force&&(US.value||Date.now()-US.lastAttempt<60000)))return;
    US.busy=true;US.error='';US.lastAttempt=Date.now();paintUs();
    try {
      const response=await rq('/functions/v1/macro',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modo:'sazonal_us'}),signal:AbortSignal.timeout(35000)});
      const data=await response.json();
      if(!Array.isArray(data.ativos)||data.versao!=='v285')throw new Error('Atualize a função macro para consultar o histórico ampliado dos EUA.');
      US.value=data;
    }catch(error){US.error=error.name==='TimeoutError'?'O histórico demorou a responder. Tente novamente.':String(error.message||error)}
    finally{US.busy=false;if(tab==='mercado'&&MKT.tab==='sazus')render()}
  }
  function paintUs(){const body=document.getElementById('us-study-body');if(body)body.innerHTML=bodyUs()}
  const previousMarket=vMercado;
  vMercado=function(){
    if(MKT.tab==='sazus'){setTimeout(()=>loadUs(),0);return renderUs()}
    const html=previousMarket.apply(this,arguments);
    return ['lab','saz','se'].includes(MKT.tab)?'<div class="pro-region"><button class="on" aria-current="page" data-navroute="mercado:lab">Brasil e sentimento</button><button data-navroute="mercado:sazus">EUA</button></div>'+html:html;
  };
  document.addEventListener('click',event=>{
    const compact=event.target.closest('[data-prodensity]');
    if(compact&&['comfortable','compact'].includes(compact.dataset.prodensity)){try{ls.set('diario-densidade-v284',compact.dataset.prodensity)}catch{}applyDensity();render();return}
    const view=event.target.closest('[data-usview]');
    if(view&&['mensal','ciclo','midterms'].includes(view.dataset.usview)){US.view=view.dataset.usview;render();return}
    if(event.target.closest('[data-usrefresh]'))loadUs(true);
  });
  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.matches('[data-usasset]')){US.asset=target.value;paintUs()}
    if(target.matches('[data-uselection]')){US.eventType=target.value;paintUs()}
    if(target.matches('[data-usperiod]')){if(US.view==='mensal')US.month=+target.value;else if(US.view==='ciclo')US.cycle=+target.value;else US.window=target.value;paintUs()}
  });
})();
