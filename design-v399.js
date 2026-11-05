/* Diário de Trader · identidade de interface v393.
 * Camada visual progressiva sobre os dados e rotas reais da aplicação.
 * Não modifica Supabase, cálculos financeiros nem ordens; não cria cotações fictícias.
 */
(function () {
  'use strict';
  const doc = document;
  const KEY = 'dt395-layout';
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    trade:'<path d="M4 7h16m-5-4 5 4-5 4M20 17H4m5-4-5 4 5 4"/>',
    chart:'<path d="M4 20V12m6 8V5m6 15v-9m5 9V3"/>',
    book:'<path d="M12 6c-3-2-6-2-10-2v16c4 0 7 0 10 2m0-16c3-2 6-2 10-2v16c-4 0-7 0-10 2z"/>',
    monitor:'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/>',
    briefcase:'<path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18"/>',
    shield:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
    newspaper:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h9M8 11h9M8 15h5M5 7h1M5 11h1M5 15h1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    edit:'<path d="m4 17 11-11 4 4L8 21H4zm9-9 4 4"/>',
    spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    right:'<path d="m9 5 7 7-7 7"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 5 6 13 0 18-6-5-6-13 0-18"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
    graduation:'<path d="m2 10 10-5 10 5-10 5zm4 3v5c4 3 8 3 12 0v-5m4-3v8"/>',
    arrowup:'<path d="m4 17 6-6 4 4 6-8M15 7h5v5"/>',
    alert:'<path d="m12 2 10 18H2zm0 7v5m0 3v.1"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    play:'<path d="m7 4 13 8-13 8z"/>',
    pause:'<path d="M8 5v14m8-14v14"/>'
  };
  const icon = (name,sz=21)=>`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.chart}</svg>`;
  const safe = v=>typeof esc==='function'?esc(v):String(v??'');
  const fmt = n => Number.isFinite(+n) ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(+n) : '—';
  const pc = (n, digits=2)=>Number.isFinite(n)?(n>0?'+':'')+n.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits})+'%':'—';
  const direction = n=>n>0?'positive':n<0?'negative':'';
  let selectedPhase='pre';
  const phaseOf=r=>['pre','during','post'].includes(r?.phase)?r.phase:([0,2].includes(Number(r?.cat))?'pre':'during');
  const phaseTitle={pre:'Pré-mercado',during:'Durante',post:'Pós-mercado'};
  const moneyView=(value,empty='Sem dados') => value==null?empty:fmt(value);
  const currentDay=()=>typeof D==='string'?D:new Date().toISOString().slice(0,10);
  const today=()=>typeof loc==='function'?loc().slice(0,10):new Date().toISOString().slice(0,10);
  const tradeDate=t=>String(t.dtx||t.dt||'').slice(0,10);
  const result=t=>{ try { const c=typeof cBRL==='function'?cBRL(t):calc(t); return Number.isFinite(c?.pl)?c.pl:null; } catch { return null; } };
  const rr=t=>{try{const n=calc(t).r;return Number.isFinite(n)?n:null;}catch{return null;}};
  const trades=()=>Array.isArray(S?.trades)?S.trades:[];
  const closed=(date)=>trades().filter(t=>result(t)!==null&&(!date||tradeDate(t)===date));
  const openTrades=()=>trades().filter(t=>{try{return isOpen(t);}catch{return false;}});
  const sumResults=ts=>ts.reduce((s,t)=>s+(result(t)||0),0);
  const sumR=ts=>ts.reduce((s,t)=>s+(rr(t)||0),0);
  const capital=()=>{try{const rs=['D','S','O'].map(t=>capCalc(t)).filter(Boolean);if(rs.length)return rs.reduce((sum,x)=>sum+x.at,0);}catch{}const raw=Number(S?.prop?.cap);return raw>0?raw:null;};
  const isUSSession=()=>typeof MDM!=='undefined'&&MDM==='us';
  const currentRules=()=>isUSSession()?(Array.isArray(S?.rulesUS)?S.rulesUS:(S?.rules||[])):(S?.rules||[]);
  const dayData=()=>{const d=S?.days?.[currentDay()]||{};return isUSSession()?(d.us||{}):d;};
  const dayTrades=()=>closed(currentDay());
  const goal=()=>Number(dayData().metaDia)>0?Number(dayData().metaDia):null;
  const limit=()=>Number(dayData().maxP)>0?Number(dayData().maxP):(Number(S?.prop?.perdaDia)>0?Number(S.prop.perdaDia):null);
  const section=(name,content,actions='')=>`<section class="dt393-card"><header class="dt393-cardhead"><h2>${icon(name)} ${content}</h2>${actions}</header>`;
  const endSection='</section>';
  const action=(txt,route,kind='')=>`<button type="button" class="dt393-action ${kind}" data-dt393-route="${route}">${txt} ${icon('right',15)}</button>`;
  const noData='<span class="dt393-muted">Não informado</span>';
  // v394: navegação autônoma, sem depender dos botões originais escondidos.
  const NAV_ITEMS=[
    ['home','Início','home','resumo painel principal'],
    ['dia','Meu dia','calendar','planejamento notas pré-mercado checklist'],
    ['ops','Operações','trade','day trade swing trade opções forex trades'],
    ['mercado','Mercado','globe','cotações ativos ações notícias agenda pesquisa ticker'],
    ['term','Terminal','monitor','radar global fluxo juros workspaces gráficos'],
    ['stats','Diário','book','revisão resultado desempenho performance histórico'],
    ['carteiras','Carteira','briefcase','investimentos patrimônio proventos relatório'],
    ['estudos','Estudos','graduation','livros inglês cnpi vídeos aulas'],
    ['regras','Checklist','check','regras disciplina risco'],
    ['mais','Configurações','settings','alertas notificações preferências conta']
  ];
  function navSection(id){return ({trades:'ops',swing:'ops',opc:'ops',futuros:'ops',fx:'ops',trade:'ops',opcoes:'ops',mesa:'mais',painel:'mais',rev:'stats',agenda:'mercado',noticias:'mercado',analise:'mercado'})[id]||id;}
  function syncDrawerActive(){doc.querySelectorAll('#dt394-drawer [data-dt393-route]').forEach(b=>{const yes=b.dataset.dt393Route===navSection(tab);b.classList.toggle('active',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
  function desktopNav(){return `<nav class="dt394-quicknav" aria-label="Navegação principal no computador">${NAV_ITEMS.map(([id,label,symbol])=>`<button type="button" data-dt393-route="${id}" class="${navSection(tab)===id?'active':''}" ${navSection(tab)===id?'aria-current="page"':''}>${icon(symbol,15)} ${label}</button>`).join('')}</nav>`;}
  function drawerMarkup(){return `<div id="dt394-drawer" class="dt394-overlay" hidden><button type="button" class="dt394-backdrop" data-dt394-close aria-label="Fechar menu"></button><aside class="dt394-panel" role="dialog" aria-modal="true" aria-labelledby="dt394-drawer-title"><div class="dt394-drawer-head"><div><b id="dt394-drawer-title">Diário de Trader</b><small>Navegação e busca</small></div><button type="button" class="dt394-close" data-dt394-close aria-label="Fechar menu">${icon('plus',24)}</button></div><label class="dt394-search-label" for="dt394-nav-search">Buscar páginas, funções ou ativos</label><div class="dt394-search-box">${icon('search',18)}<input id="dt394-nav-search" type="search" autocomplete="off" placeholder="Ex.: Terminal, carteira, PETR4" aria-label="Buscar páginas e funções" /></div><div class="dt394-nav-list">${NAV_ITEMS.map(([id,label,symbol,keywords])=>`<button type="button" data-dt393-route="${id}" data-dt394-filter="${(label+' '+keywords).toLowerCase()}" class="${tab===id?'active':''}">${icon(symbol,20)}<span>${label}</span>${icon('right',17)}</button>`).join('')}</div><p id="dt394-no-results" hidden>Nenhuma página encontrada. Use a busca de ativos no Mercado.</p><button type="button" id="dt394-market-search" data-dt394-marketsearch>${icon('search',17)} Abrir busca de ativos no Mercado</button><p class="dt394-footnote">No PC: <kbd>Ctrl</kbd> + <kbd>K</kbd> para pesquisar · <kbd>Esc</kbd> para fechar.</p></aside></div>`;}
  function ensureDrawer(){if(doc.getElementById('dt394-drawer'))return;doc.body.insertAdjacentHTML('beforeend',drawerMarkup());}
  function refreshDrawerActive(){doc.querySelectorAll('#dt394-drawer [data-dt393-route]').forEach(b=>{const current=b.dataset.dt393Route===tab;b.classList.toggle('active',current);if(current)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
  function filterDrawer(){const query=(doc.getElementById('dt394-nav-search')?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();let shown=0;doc.querySelectorAll('#dt394-drawer [data-dt394-filter]').forEach(b=>{const words=(b.dataset.dt394Filter||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');b.hidden=!!query&&!words.includes(query);if(!b.hidden)shown++;});const empty=doc.getElementById('dt394-no-results');if(empty)empty.hidden=shown!==0;const market=doc.getElementById('dt394-market-search');if(market){market.innerHTML=icon('search',17);market.appendChild(doc.createTextNode(query?' Buscar ativo no Mercado':' Abrir busca de ativos no Mercado'));}}
  function openDrawer(mode){ensureDrawer();const layer=doc.getElementById('dt394-drawer');layer.hidden=false;doc.body.classList.add('dt394-drawer-open');const input=doc.getElementById('dt394-nav-search');input.value='';filterDrawer();syncDrawerActive();doc.querySelector('[data-dt393-action="menu"]')?.setAttribute('aria-expanded','true');setTimeout(()=>{if(mode==='search')input.focus({preventScroll:true});else layer.querySelector('.dt394-close')?.focus({preventScroll:true});},20);}
  function closeDrawer(restore=true){const layer=doc.getElementById('dt394-drawer');if(!layer||layer.hidden)return;layer.hidden=true;doc.body.classList.remove('dt394-drawer-open');doc.querySelector('[data-dt393-action="menu"]')?.setAttribute('aria-expanded','false');if(restore)doc.querySelector('[data-dt393-action="menu"]')?.focus({preventScroll:true});}
  function updateTapeOffset(){const rect=doc.getElementById('tape')?.getBoundingClientRect();doc.documentElement.style.setProperty('--dt394-tape-height',Math.max(0,Math.round(rect?.height||0))+'px');}
  window.addEventListener('resize',updateTapeOffset,{passive:true});
  doc.addEventListener('input',e=>{if(e.target?.id==='dt394-nav-search')filterDrawer();});
  doc.addEventListener('click',e=>{
    if(e.target.closest?.('[data-dt394-close]')){e.preventDefault();closeDrawer();return;}
    if(e.target.closest?.('[data-dt394-marketsearch]')){
      e.preventDefault();
      const q=doc.getElementById('dt394-nav-search')?.value.trim()||'';
      closeDrawer(false);
      // Keep the user's text when opening the real native market search.
      if(window.DIARIO_NAV?.navigate)window.DIARIO_NAV.navigate('mercado:cq');
      else {tab='mercado';if(typeof MKT!=='undefined')MKT.tab='cq';render();}
      window.scrollTo({top:0,behavior:'auto'});
      setTimeout(()=>{
        const scope=doc.querySelector('#app .dt393-native')||doc.getElementById('app');
        const inputs=Array.from(scope?.querySelectorAll('input[type="search"],input[placeholder*="ticker" i],input[placeholder*="ativo" i],input[placeholder*="busca" i]')||[]);
        const input=inputs.find(el=>el.offsetWidth>0&&!el.disabled);
        if(input){if(q){input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));}input.focus({preventScroll:true});}
      },160);
      return;
    }
  },true);
  doc.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!doc.getElementById('dt394-drawer')?.hidden){e.preventDefault();closeDrawer();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openDrawer('search');}
  },true);
  function header(){
    const title={home:'Início',dia:'Meu dia',regras:'Checklist',ops:'Operações',trades:'Day trade',swing:'Swing trade',opc:'Opções',fx:'EUA e Forex',futuros:'EUA e Forex',mercado:'Mercado',term:'Terminal',estudos:'Estudos',stats:'Diário',carteiras:'Carteira',painel:'Metas e risco',mesa:'Mesa e risco',rev:'Revisão',mais:'Configurações'}[tab]||'Diário de Trader';
    return `<header class="dt393-topbar"><button class="dt393-menubtn" type="button" aria-label="Abrir menu do aplicativo" data-dt393-action="menu">${icon('layers',23)}</button><div class="dt393-brand"><span class="dt393-brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Diário de Trader</span></div><span class="dt393-title">${safe(title)}</span><div class="dt393-topactions"><button aria-label="Buscar no aplicativo" type="button" data-dt393-action="search">${icon('search',23)}</button><button aria-label="Abrir notificações" type="button" data-dt393-route="mais">${icon('bell',23)}</button></div></header>`;
  }
  const instruments=['IBOV','S&P 500','NASDAQ','DXY','USD/BRL','PETR4'];
  // Os valores vêm somente de dados locais verificáveis; nenhum preço de exemplo é apresentado como cotação real.
  function quote(sym){
    // Apenas snapshots efetivamente recebidos pelo Terminal/Profit/Finnhub/TradingView.
    const alias={
      'IBOV':['IBOV','TVC:IBOV','BMFBOVESPA:IBOV'],
      'S&P 500':['SPX','SP:SPX','S&P 500'],
      'NASDAQ':['NDX','NASDAQ:NDX','NASDAQ'],
      'DXY':['DXY','TVC:DXY'],
      'USD/BRL':['USDBRL','FX_IDC:USDBRL','USD/BRL'],
      'PETR4':['PETR4','BMFBOVESPA:PETR4']
    }[sym]||[sym];
    try{
      const cache=window.TRM?.TR?.dados;
      if(!cache||typeof cache!=='object')return null;
      let best=null;
      for(const [key,entry] of Object.entries(cache)){
        if(!key.startsWith('cot|')||!Array.isArray(entry?.v?.itens))continue;
        const ts=Date.parse(entry.v.em)||entry.ts||0;
        if(!ts||ts>Date.now()+60000||Date.now()-ts>12*60*60*1000)continue;
        for(const item of entry.v.itens){
          const ids=[item?.pedido,item?.s,item?.simbolo].filter(Boolean).map(v=>String(v).toUpperCase());
          if(!alias.some(id=>ids.includes(id.toUpperCase())))continue;
          const px=Number(item.px);
          if(!Number.isFinite(px)||px<=0)continue;
          const change=item.d1!=null?Number(item.d1):null;
          if(!best||ts>best.ts)best={n:px,change:Number.isFinite(change)?change:null,ts};
        }
      }
      return best;
    }catch{return null;}
  }
  function ticker(){return `<div class="dt393-ticker" aria-label="Cotações; traços indicam ausência de dados verificados">${instruments.map(sym=>{const q=quote(sym);return `<div class="dt393-tick"><b>${safe(sym)}</b><strong>${q?q.n.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—'}</strong><small class="${q?direction(q.change):''}">${q&&q.change!=null?(pc(q.change)+(Date.now()-q.ts>30*60*1000?' · atrasado':'')):(q?'Cotação disponível':'Sem cotação')}</small></div>`}).join('')}</div>`;}
  function stat(label,value,detail='',state='',symbol='chart'){
    return `<div class="dt393-stat"><span class="dt393-stat-icon">${icon(symbol,22)}</span><span class="dt393-stat-label">${label}</span><strong class="${state}">${value}</strong>${detail?`<small>${detail}</small>`:''}</div>`;
  }
  function home(){
    const ts=dayTrades(), net=sumResults(ts),weekStart=typeof segundaDe==='function'?segundaDe(today()):today().slice(0,8)+'01';
    const week=closed().filter(t=>tradeDate(t)>=weekStart&&tradeDate(t)<=today());
    const cap=capital(), capName=cap===null?'Configure seu capital':fmt(cap);
    const goalVal=goal(), loss=limit();
    const rrules=currentRules(), nChecked=Object.entries(dayData().chk||{}).filter(([k,v])=>v&&rrules.some(r=>String(r.id)===k)).length;
    const date=new Date(today()+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    return `<div class="dt393-page dt393-home">
      <section class="dt393-card dt393-summary"><header class="dt393-cardhead"><h2>${icon('calendar')} Resumo do dia</h2><span class="dt393-market-status">${icon('chart',16)} Acompanhamento do pregão</span></header><p class="dt393-muted dt393-date">${safe(date)}</p><div class="dt393-kpis">
      <div><small>Capital</small><strong>${capName}</strong></div><div><small>P&L do dia</small><strong class="${direction(net)}">${net>0?'+':''}${fmt(net)}</strong></div><div><small>P&L da semana</small><strong class="${direction(sumResults(week))}">${sumResults(week)>0?'+':''}${fmt(sumResults(week))}</strong></div><div><small>Limite de perda</small><strong>${loss!=null?fmt(loss):'Não definido'}</strong></div></div></section>
      <div class="dt393-phase"><button data-dt393-route="dia">${icon('calendar',16)} Pré-mercado</button><button class="active" data-dt393-route="term">${icon('chart',16)} Pregão</button><button data-dt393-route="dia">${icon('book',16)} Pós-mercado</button></div>
      <div class="dt393-tiles">${[['chart','Mercado','Ações, índices e moedas','mercado'],['monitor','Terminal','Gráficos e inteligência','term'],['book','Diário','Performance e aprendizado','stats'],['graduation','Estudos','Aulas e materiais','estudos'],['check','Checklist','Rotina e disciplina','dia']].map(([ic,title,sub,r])=>`<button data-dt393-route="${r}" class="dt393-tile">${icon(ic,29)}<b>${title}</b><small>${sub}</small>${icon('right',17)}</button>`).join('')}</div>
      ${section('globe','Panorama do dia',action('Abrir mercado','mercado'))}<div class="dt393-panorama"><div><h3>${icon('calendar',17)} Agenda</h3><p>Consulte os eventos confirmados e os horários na fonte de mercado.</p>${action('Ver agenda','mercado')}</div><div><h3>${icon('newspaper',17)} Notícias-chave</h3><p>Manchetes do Brasil e exterior, com origem identificada.</p>${action('Ver notícias','mercado')}</div><div><h3>${icon('alert',17)} Alertas macro</h3><p>Juros, inflação, fluxo e outros eventos monitorados.</p>${action('Abrir radar','term')}</div></div>${endSection}
      ${section('spark','Central de Inteligência <span class="dt393-mini-ai">IA</span>')}<p class="dt393-muted">Análise contextual depende dos dados disponíveis. Sem sinais fabricados nem ordens automáticas.</p><div class="dt393-quicklist"><button data-dt393-route="term">${icon('target')} Radar global e oportunidades ${icon('right',16)}</button><button data-dt393-route="ops">${icon('shield')} Revisar operações e risco ${icon('right',16)}</button><button data-dt393-route="stats">${icon('arrowup')} Avaliar resultados e consistência ${icon('right',16)}</button></div>${endSection}
      ${section('bolt','Atalhos rápidos')}<div class="dt393-shortcuts"><button data-dt393-route="term">${icon('monitor')} Abrir Terminal</button><button data-dt393-action="newtrade">${icon('plus')} Registrar trade</button><button data-dt393-route="stats">${icon('book')} Rever Diário</button><button data-dt393-route="mercado">${icon('newspaper')} Ver notícias</button></div>${endSection}
      <div class="dt393-context">${nChecked} de ${rrules.length} regras marcadas hoje ${goalVal?' · Meta diária '+fmt(goalVal):''}</div>
      </div>`;
  }
  function day(){
    const ts=dayTrades(),net=sumResults(ts),rules=currentRules(), d=dayData();
    const checked=rules.filter(r=>d.chk?.[r.id]).length;
    const progress=rules.length?Math.round(100*checked/rules.length):0;
    const g=goal(),loss=limit(),overall=Number(S?.prop?.meta)>0?Number(S.prop.meta):null;
    const groups=['pre','during','post'].map(p=>{const each=rules.filter(r=>phaseOf(r)===p);const n=each.filter(r=>d.chk?.[r.id]).length;return `<button type="button" data-dt393-action="checkphase" data-phase="${p}" class="${p===selectedPhase?'active':''}" aria-pressed="${p===selectedPhase}">${phaseTitle[p]} <small>${n}/${each.length}</small></button>`}).join('');
    const ruleRows=rules.map(r=>`<div class="dt393-checkitem" data-rule-phase="${phaseOf(r)}" ${phaseOf(r)!==selectedPhase?'hidden':''}><label><input type="checkbox" data-chk="${safe(r.id)}" ${d.chk?.[r.id]?'checked':''}/><span>${safe(r.t)}</span></label><select data-dt393-rule-phase="${safe(r.id)}" aria-label="Fase da regra: ${safe(r.t)}"><option value="pre" ${phaseOf(r)==='pre'?'selected':''}>Pré</option><option value="during" ${phaseOf(r)==='during'?'selected':''}>Durante</option><option value="post" ${phaseOf(r)==='post'?'selected':''}>Pós</option></select></div>`).join('');
    const dateText=safe(currentDay().split('-').reverse().join('/'));
    return `<div class="dt393-page dt393-day">
      ${section('target','Plano do dia',`<span class="dt393-datechip">${dateText}</span>`)}
        <div class="dt393-plan"><div><small>Meta diária</small><strong class="${g?'positive':''}">${g?fmt(g):'Não definida'}</strong></div><div><small>Limite diário</small><strong class="${loss?'negative':''}">${loss?fmt(loss):'Não definido'}</strong></div><div><small>Trades encerrados</small><strong>${ts.length}</strong></div><div><small>Foco operacional</small><strong>${safe(d.plano?.slice(0,90)||'Defina seu plano')}</strong></div></div>
        <div class="dt393-goal-edit"><label>Minha meta para este dia (R$)<input type="number" min="0" step="0.01" inputmode="decimal" data-d="metaDia" value="${safe(d.metaDia??'')}" placeholder="Não definida"></label><label>Perda máxima para este dia (R$)<input type="number" min="0" step="0.01" inputmode="decimal" data-d="maxP" value="${safe(d.maxP??'')}" placeholder="${safe(S?.prop?.perdaDia||'Não definida')}"></label></div>
        <p class="dt393-origin">${overall?`Sua meta geral da mesa é ${fmt(overall)}, configurada em <b>Mesa e risco</b>. Ela <b>não</b> é aplicada automaticamente à meta diária.`:'A meta diária é independente da meta geral da mesa. Só aparece quando você a define.'} ${!d.maxP&&S?.prop?.perdaDia?'O limite de perda mostrado acima veio da configuração geral da mesa.':''}</p>
      ${endSection}
      ${section('check','Checklist operacional',`<span class="dt393-progress-num" id="dt393-checknum">${checked} de ${rules.length} (${progress}%)</span>`)}
      <div class="dt393-progress"><span id="dt393-progressbar" style="width:${progress}%"></span></div><div class="dt393-phase dt393-phase-inner">${groups}</div>
      <div class="dt393-checklist">${ruleRows||'<p class="dt393-muted">Adicione suas regras para começar.</p>'}<div class="dt393-phase-empty" ${rules.some(r=>phaseOf(r)===selectedPhase)?'hidden':''}>Nenhuma regra nesta fase. Use o seletor ao lado de uma regra para movê-la entre as fases.</div></div>
      <button class="dt393-outline" type="button" data-dt393-route="regras">${icon('edit',16)} Criar e editar regras ${icon('right',15)}</button>${endSection}
</div>`;
  }
  function operationRow(t){
    const v=result(t),r=rr(t), side=t.side==='C'?'Compra':'Venda', symbol=safe(t.ativo||'Ativo');
    return `<button type="button" class="dt393-oprow" data-a="edit" data-id="${safe(t.id)}"><span class="dt393-op-symbol ${side==='Compra'?'buy':'sell'}"><b>${symbol}</b><small>${safe(t.setup||'Sem setup')}</small></span><span class="dt393-op-side ${side==='Compra'?'buy':'sell'}">${side}</span><span class="dt393-op-values"><strong class="${direction(v)}">${v==null?'Aberta':(v>0?'+':'')+fmt(v)}</strong><small>${r==null?'R não calculado':(r>0?'+':'')+r.toFixed(2).replace('.',',')+' R'}</small></span>${icon('right',16)}</button>`;
  }
  function operations(){
    const open=openTrades(),cl=dayTrades(),net=sumResults(cl), riskOpen=open.reduce((a,t)=>{try{return a+(calc(t).risk||0)}catch{return a}},0);
    const gains=cl.filter(t=>result(t)>0).length;
    return `<div class="dt393-page dt393-operations"><div class="dt393-statgrid">${stat('Operações abertas',String(open.length),'Somente monitoramento','', 'briefcase')}${stat('Resultado do dia',(net>0?'+':'')+fmt(net),cl.length+' encerradas',direction(net),'chart')}${stat('Risco teórico aberto',fmt(riskOpen),'Conforme stops cadastrados','', 'shield')}${stat('Setups hoje',String(new Set(cl.map(t=>t.setup).filter(Boolean)).size),'Nos trades encerrados','', 'target')}</div>
      ${section('layers','Posições monitoradas',`<span class="dt393-muted">${open.length} aberta(s)</span>`)}<div class="dt393-tablewrap"><table class="dt393-table"><thead><tr><th>Ativo</th><th>Lado</th><th>Entrada</th><th>Stop</th><th>Alvo</th><th>Status</th></tr></thead><tbody>${open.map(t=>`<tr><td><b>${safe(t.ativo||'—')}</b></td><td class="${t.side==='C'?'positive':'negative'}">${t.side==='C'?'Compra':'Venda'}</td><td>${safe(t.entry||'—')}</td><td>${safe(t.stop||'—')}</td><td>${safe(t.target||'—')}</td><td><button data-a="edit" data-id="${safe(t.id)}">Ver detalhes</button></td></tr>`).join('')||'<tr><td colspan="6" class="dt393-empty">Nenhuma operação aberta registrada.</td></tr>'}</tbody></table></div>${endSection}
      ${section('trade','Trades do dia',`<span class="dt393-muted">${cl.length} trades</span>`)}<div class="dt393-oplist">${cl.slice(0,15).map(operationRow).join('')||'<p class="dt393-muted">Nenhum trade encerrado no dia selecionado.</p>'}</div><button class="dt393-outline" data-dt393-action="native">Ver todos os trades e filtros ${icon('right',16)}</button>${endSection}
      <div class="dt393-two">${section('edit','Revisão rápida')}<p class="dt393-muted">Registre os principais pontos desta sessão.</p><div class="dt393-quicklist"><button data-dt393-route="dia">${icon('book',17)} Registrar aprendizado ${icon('right',15)}</button><button data-dt393-route="stats">${icon('chart',17)} Analisar estatísticas ${icon('right',15)}</button><button data-dt393-action="newtrade">${icon('plus',17)} Registrar operação ${icon('right',15)}</button></div>${endSection}
      ${section('spark','Insights automáticos')}<p class="dt393-muted">Observações baseadas no seu diário, não recomendações de compra ou venda.</p><div class="dt393-insight"><span>${icon('check',17)}</span><p>${cl.length?`Você concluiu ${cl.length} operações hoje; ${gains} tiveram resultado positivo.`:'Registre suas operações para começar a avaliar consistência.'}</p></div><div class="dt393-insight"><span>${icon('shield',17)}</span><p>${open.length?`Há ${open.length} posição(ões) monitorada(s). Confira os stops e o risco no Profit Pro.`:'Sem posições abertas registradas no diário.'}</p></div><div class="dt393-insight"><span>${icon('book',17)}</span><p>Avalie disciplina, contexto e aderência ao plano antes de tirar conclusões.</p></div>${endSection}</div></div>`;
  }
  function history(){
    const ts=closed().sort((a,b)=>tradeDate(a).localeCompare(tradeDate(b))),list=ts.slice(-60);
    if(list.length<2)return '<div class="dt393-chartempty">Registre ao menos dois trades encerrados para ver a curva de resultados.</div>';
    let p=0;const a=list.map(t=>(p+=result(t)||0)),minimum=Math.min(0,...a),maximum=Math.max(0,...a),span=Math.max(1,maximum-minimum);
    const pts=a.map((v,i)=>`${(i/(a.length-1)*590+5).toFixed(1)},${(180-(v-minimum)/span*155).toFixed(1)}`).join(' ');
    const zero=(180-(0-minimum)/span*155).toFixed(1);
    return `<svg class="dt393-perf-svg" role="img" aria-label="Curva acumulada de resultados de ${list.length} trades encerrados" viewBox="0 0 600 210" preserveAspectRatio="none"><g class="dt393-gridlines">${[25,65,105,145,185].map(y=>`<path d="M0 ${y}H600"/>`).join('')}</g><path class="dt393-zero" d="M0 ${zero}H600"/><polyline points="${pts}" fill="none" stroke="#f0f4fa" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><text x="592" y="15" text-anchor="end">P&L acumulado · ${fmt(p)}</text></svg>`;
  }
  function journal(){
    const ts=dayTrades(),net=sumResults(ts),w=ts.filter(t=>result(t)>0),r=ts.length?w.length/ts.length*100:null;
    return `<div class="dt393-page dt393-journal">${section('book','Resumo do dia',`<span class="dt393-datechip">${safe(currentDay().split('-').reverse().join('/'))}</span>`)}<div class="dt393-kpis"><div><small>Resultado</small><strong class="${direction(net)}">${net>0?'+':''}${fmt(net)}</strong></div><div><small>Win rate</small><strong>${r==null?'—':pc(r)}</strong></div><div><small>R acumulado</small><strong class="${direction(sumR(ts))}">${sumR(ts).toFixed(2).replace('.',',')} R</strong></div><div><small>Nº de trades</small><strong>${ts.length}</strong></div></div>${endSection}
      ${section('chart','Performance do Diário')}<div class="dt393-chart-toolbar"><span>Resultado acumulado dos últimos trades fechados</span><button data-dt393-route="stats">Análise completa ${icon('right',14)}</button></div>${history()}<small class="dt393-muted">Dados do seu diário. Comparação com o IBOV exige série histórica validada e não é simulada.</small>${endSection}
      ${section('check','Checklist e cenário',action('Abrir plano','dia'))}<p class="dt393-notes">${safe(dayData().plano||'Plano não preenchido para esta data.')}</p>${endSection}
      ${section('trade','Operações de hoje',action('Ver operações','ops'))}<div class="dt393-oplist">${ts.slice(0,10).map(operationRow).join('')||'<p class="dt393-muted">Ainda não há trades encerrados neste dia.</p>'}</div>${endSection}
      <div class="dt393-two">${section('edit','Anotações e lições')}<p class="dt393-notes">${safe(dayData().resumo||'Escreva a revisão do dia nas ferramentas completas.')}</p>${endSection}${section('target','Pontos de atenção')}<p class="dt393-notes">${safe(dayData().pre||'Registre seu ensaio mental e pontos de atenção para visualizar aqui.')}</p>${endSection}</div>
      <button class="dt393-primary" data-dt393-route="dia">${icon('book')} Registrar revisão</button></div>`;
  }
  // v397 — Estudos: nova tela fiel ao layout aprovado; dados e ações vêm das ferramentas existentes.
  let studyPanelOpen='';
  function studyGraphic(kind='candles'){
    if(kind==='english')return `<span class="dt397-art-letter">EN<span>MARKET ENGLISH</span></span>`;
    if(kind==='cert')return `<span class="dt397-art-letter">CNPI<span>CERTIFICAÇÃO</span></span>`;
    const bars=Array.from({length:20},(_,i)=>{
      const h=19+(i*11%25),y=94-i*2.45+Math.sin(i*1.63)*15,x=12+i*14;
      const green=i%5!==0;
      return `<line x1="${x}" y1="${y-h*.55}" x2="${x}" y2="${y+h*.57}" stroke="${green?'#2cd6c1':'#f78a50'}" stroke-width="1.7"/><rect x="${x-3.9}" y="${y-h*.32}" width="7.8" height="${h*.66}" rx=".6" fill="${green?'#28c8b8':'#f07e49'}"/>`;
    }).join('');
    return `<svg viewBox="0 0 300 150" role="img" aria-label="Ilustração de candles e médias móveis" preserveAspectRatio="xMidYMid slice"><defs><pattern id="dt397-grid" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0V23" stroke="#28625d" stroke-width=".65" opacity=".45" fill="none"/></pattern><linearGradient id="dt397-bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#05111e"/><stop offset="1" stop-color="#071d26"/></linearGradient></defs><rect width="300" height="150" fill="url(#dt397-bg)"/><rect width="300" height="150" fill="url(#dt397-grid)"/>${bars}<path d="M7 129Q30 119 49 111T93 107T130 92T170 77T211 70T247 41T293 35" fill="none" stroke="#efad45" stroke-width="2.2"/><path d="M6 133Q55 125 90 119T173 91T240 82T297 54" stroke="#1389b9" fill="none" stroke-width="1.8" opacity=".85"/></svg>`;
  }
  const STUDY_CATEGORIES=[['liv','Livros','book'],['ing','Inglês','globe'],['cnpi','CNPI-T','graduation'],['aul','Vídeos','play'],['resumos','Resumos','newspaper'],['playlists','Playlists','layers']];
  function studyCategoryButtons(){return STUDY_CATEGORIES.map(([id,name,ic])=>`<button type="button" class="dt397-chip ${studyPanelOpen===id?'on':''}" data-dt397-view="${id}" aria-pressed="${studyPanelOpen===id}">${icon(ic,18)} ${name}</button>`).join('');}
  // v399 — estudo real por aula: nunca reutilizar dados de outras contas nem inventar percentuais.
  function studyCurrentLessons(){
    try{return (window.AULAS?.getLista?.()||[]).filter(x=>x&&x.id&&x.status!=='gerando');}catch{return [];}
  }
  function studyLessonPct(a){
    let p={};try{p=window.AULAS?.progresso?.(a)||a.progresso||{};}catch{p=a.progresso||{};}
    const percent=p.fim?100:Number(p.total)>0?Math.round(100*Math.max(0,Math.min(Number(p.cena)||0,Number(p.total)))/Number(p.total)):null;
    return percent===null?null:Math.max(0,Math.min(100,percent));
  }
  function studyType(a){const title=String((a?.livro||'')+' '+(a?.titulo||'')).toLowerCase();return /cnpi|certifica/.test(title)?'cert':/ingl[eê]s|english|idioma/.test(title)?'english':'candles';}
  function studyArt(type){
    if(type==='english')return `<span class="dt399-english-flag" aria-hidden="true"><span>ENGLISH</span><em>FINANCIAL MARKET</em></span>`;
    if(type==='cert')return `<span class="dt399-cnpi-art" aria-hidden="true"><strong>CNPI-T</strong><em>ECONOMIA & MERCADO</em></span>`;
    return studyGraphic();
  }
  function studyPercentMarkup(p){return p===null?'<small class="dt399-untracked">Progresso ainda não registrado</small>':`<span class="dt399-progress"><span style="width:${p}%"></span></span>`;}
  function studyLessonCard(a){
    const t=safe((a.numero?'Aula '+a.numero+' — ':'')+(a.titulo||'Aula'));
    const p=studyLessonPct(a),type=studyType(a);
    return `<button type="button" class="dt397-lesson dt399-video-row" data-auopen="${safe(a.id)}" aria-label="Abrir ${t}"><span class="dt397-lesson-art dt399-lesson-visual">${studyArt(type)}<span class="dt399-play-mini">▶ ${a.min?safe(a.min)+'min':'Aula'}</span></span><span class="dt397-lesson-copy"><small class="dt397-type">${type==='cert'?'CNPI-T':type==='english'?'INGLÊS':'ANÁLISE TÉCNICA'}</small><strong>${t}</strong><small>${safe(a.livro||'Videoaula')} ${a.capitulos?'· '+safe(a.capitulos):''}</small>${studyPercentMarkup(p)}</span><span class="dt399-row-aside">${p===null?icon('right',16):p+'%'}</span></button>`;
  }
  function studyBookCard(b,i){
    return `<button type="button" class="dt397-lesson dt399-book-row" data-a="openbook" data-id="${safe(b.id)}" aria-label="Abrir livro ${safe(b.t||'Sem título')}"><span class="dt397-lesson-art">${studyGraphic()}<span class="dt397-art-meta">LIVRO</span></span><span class="dt397-lesson-copy"><small class="dt397-type">LEITURA</small><strong>${safe(b.t||'Livro sem título')}</strong><small>${safe(b.a||'Autor não informado')}</small><span class="dt397-reading-status">${icon('book',13)} ${(Array.isArray(b.notes)?b.notes.length:0)} anotação(ões)</span></span>${icon('right',17)}</button>`;
  }
  function studies(){
    const books=Array.isArray(S?.books)?S.books:[];
    const lessons=studyCurrentLessons();
    const studied=lessons.filter(x=>/an[aá]lise t[eé]cnica|mercados financeiros|john murphy/i.test([x.livro,x.titulo].join(' ')));
    const featured=studied.length?studied:lessons;
    const completed=featured.filter(x=>studyLessonPct(x)===100).length;
    const known=featured.filter(x=>studyLessonPct(x)!==null);
    const percent=featured.length&&known.length?Math.round(known.reduce((s,x)=>s+studyLessonPct(x),0)/featured.length):null;
    const sorted=lessons.slice().sort((x,y)=>{const a=studyLessonPct(x),b=studyLessonPct(y);return Number((b!==100&&b!==null&&b>0))-Number((a!==100&&a!==null&&a>0))||String(y.criado_em||'').localeCompare(String(x.criado_em||''));});
    const hasLessons=sorted.length>0;
    const rows=hasLessons?sorted.slice(0,3).map(studyLessonCard).join(''):
      books.length?books.slice(0,3).map(studyBookCard).join(''):
      `<div class="dt397-empty"><strong>Suas aulas e leituras aparecerão aqui</strong><span>Entre em Vídeos ou Livros para começar uma trilha de aprendizado.</span><button type="button" data-dt397-view="aul">Explorar videoaulas ${icon('right',15)}</button></div>`;
    const countLabel=featured.length?`${completed} de ${featured.length} aulas`:'— aulas';
    const progressLabel=percent===null?'—':percent+'%';
    const heroProgress=`<span class="dt397-track dt399-track"><span style="width:${percent||0}%;opacity:1"></span></span>`;
    return `<div class="dt393-page dt397-studies dt399-studies" aria-label="Central de Estudos">
      <section class="dt397-hero">
        <div class="dt397-eyebrow">${icon('graduation',18)} <strong>Trilha em destaque</strong></div>
        <div class="dt397-feature">
          <button type="button" class="dt397-feature-art" data-dt397-view="aul" aria-label="Abrir aulas de análise técnica">${studyGraphic()}<span class="dt397-play">${icon('play',24)}</span><small>${featured[0]?.min?safe(featured[0].min)+'min':'VIDEOAULAS'}</small></button>
          <div class="dt397-feature-content"><h1>Análise Técnica dos Mercados Financeiros</h1><p>Do básico ao avançado: conceitos, padrões, indicadores e aplicações práticas no trading.</p>
            <div class="dt399-hero-summary"><span>Progresso: <b>${progressLabel}</b></span><span>${countLabel}</span></div>${heroProgress}
            <button type="button" class="dt399-hero-cta" data-dt397-view="aul">${featured.length?'Continuar estudos':'Abrir videoaulas'} ${icon('right',14)}</button>
          </div>
        </div>
      </section>
      <nav class="dt397-category" aria-label="Seções de Estudos">${studyCategoryButtons()}</nav>
      <div class="dt397-dashboard" ${studyPanelOpen?'hidden':''}>
        <section class="dt397-panel dt397-continue">
          <div class="dt397-panel-head"><h2>${icon('clock',20)} Continuar estudando</h2><button type="button" data-dt397-view="${hasLessons?'aul':'liv'}">Ver tudo ${icon('right',15)}</button></div>
          <div class="dt397-lesson-list">${rows}</div>
        </section>
        <section class="dt397-panel dt397-library"><div class="dt397-panel-head"><h2>${icon('book',20)} Biblioteca</h2><button type="button" data-dt397-view="liv">Ver tudo ${icon('right',15)}</button></div>
          <div class="dt397-library-grid">
            <button type="button" data-dt397-view="aul">${icon('play',24)}<strong>Vídeo aula</strong><small>Aulas e trilhas de aprendizado</small>${icon('right',15)}</button>
            <button type="button" data-dt397-view="liv">${icon('book',24)}<strong>Resumo de livro</strong><small>Seus livros, anotações e resumos</small>${icon('right',15)}</button>
            <button type="button" data-dt397-view="pl">${icon('check',24)}<strong>Checklist de leitura</strong><small>Organize suas metas de leitura</small>${icon('right',15)}</button>
            <button type="button" data-dt397-view="sim">${icon('newspaper',24)}<strong>Simulado</strong><small>Questões de CNPI-T e mercado</small>${icon('right',15)}</button>
          </div>
        </section>
        <section class="dt397-panel dt397-suggestions"><div class="dt397-panel-head"><div><h2>${icon('spark',21)} Sugestões de estudos</h2><p>Temas para aprofundar com os recursos do aplicativo.</p></div><span class="dt397-suggestion-label">Juros, fluxo e cenário macro</span></div>
          <div class="dt397-suggestion-list">
            <button type="button" data-dt397-view="juros">${icon('play',17)} <b>Hoje: rever juros e fluxo</b>${icon('right',15)}</button>
            <button type="button" data-dt397-view="cnpi">${icon('play',17)} <b>Política monetária e impactos nos ativos</b>${icon('right',15)}</button>
            <button type="button" data-dt397-view="aul">${icon('play',17)} <b>Análise técnica e padrões de preço</b>${icon('right',15)}</button>
          </div>
        </section>
        <section class="dt397-status"><div>${icon('chart',25)}<div><strong>Seu espaço de aprendizagem</strong><small>Vídeos, resumos, simulados e trilhas de estudos.</small></div></div><ul class="dt399-eval"><li>${icon('check',15)} Progresso real das aulas</li><li>${icon('check',15)} Livros e notas preservados</li><li>${icon('check',15)} Acesso a todas as categorias</li><li>${icon('check',15)} Player original mantido</li></ul></section>
        <details class="dt397-extra"><summary>Outras ferramentas de estudos ${icon('right',15)}</summary><div>${[['est','Meu estudo'],['pr','Prompts'],['foco','Modo foco'],['treino','Treino'],['fac','Faculdade'],['juros','Juros'],['pl','Planos']].map(([id,label])=>`<button type="button" data-dt397-view="${id}">${label}</button>`).join('')}</div></details>
      </div>
      <section class="dt397-native-mount" ${!studyPanelOpen?'hidden':''} aria-label="Ferramentas de estudo"><header><button type="button" data-dt397-view="home">${icon('right',17)} Voltar para Estudos</button><h2>${safe(({liv:'Livros',ing:'Inglês',cnpi:'CNPI-T',aul:'Vídeo aulas',resumos:'Resumos',playlists:'Playlists',pl:'Planos',sim:'Simulados',juros:'Juros',foco:'Foco',treino:'Treino',est:'Meu estudo',pr:'Prompts',fac:'Faculdade'})[studyPanelOpen]||'Minha biblioteca')}</h2></header></section>
    </div>`;
  }
  function market(){return `<div class="dt393-page dt393-market"><header class="dt393-feature-head"><h1>${icon('globe',23)} Mercado</h1><p>Cotações, gráficos, notícias e agenda de fontes conectadas. Escolha uma categoria abaixo.</p></header><div class="dt393-market-filters"><button data-dt393-market="cot">${icon('chart',16)} Cotações</button><button data-dt393-market="nt">${icon('newspaper',16)} Notícias</button><button data-dt393-market="ag">${icon('calendar',16)} Agenda</button><button data-dt393-market="al">${icon('bell',16)} Alertas</button></div><div class="dt393-live-note">${icon('shield',16)} Os dados exibidos abaixo vêm das fontes do aplicativo. Cotações indisponíveis não são preenchidas com exemplos.</div></div>`;}
  function terminal(){return `<div class="dt393-page dt393-terminal"><header class="dt393-feature-head"><h1>${icon('monitor',23)} Terminal de Inteligência</h1><p>Segunda tela de consulta: Radar Global, Juros, Fluxo, Notícias e gráficos. Execução de ordens permanece no Profit Pro.</p></header><div class="dt393-terminal-links"><button data-dt393-action="terminalpicker">${icon('layers')} Selecionar workspace</button><button data-dt393-route="mercado">${icon('globe')} Mercado</button><button data-dt393-route="ops">${icon('shield')} Risco</button></div></div>`;}
  function nativeWorkspace(root, heading='Conteúdo e ferramentas do módulo'){
    const content=doc.createElement('section');
    content.className='dt393-workspace';content.id='dt393-workspace';
    content.setAttribute('aria-label',heading);
    const body=doc.createElement('div');body.className='dt393-native dt395-native-'+tab;
    Array.from(root.childNodes).forEach(node=>body.appendChild(node));
    content.appendChild(body);
    if(tab==='home'){
      // Replaced by the live-data summary + direct module shortcuts above.
      // Original diary forms, calendar, monitoring, reminders and links remain available.
      body.querySelector('#brand116')?.remove();
      // Atalhos duplicados são reorganizados visualmente, sem remover as ações.
    }
    if(tab==='estudos'){
      // The native library is the primary functional screen; remove duplicate heading only.
      const h=Array.from(body.children).find(el=>el.tagName==='H1'&&el.textContent.trim()==='Estudos');
      h?.remove();
    }
    if(tab==='mercado' && MKT?.tab!=='al'){
      // O grupo Alertas fica em Configurações, não nas categorias do Mercado.
      body.querySelectorAll('.mk-seg button').forEach(button=>{
        if(/^Alertas$/i.test((button.textContent||'').trim()))button.remove();
      });
    }
    return content;
  }
  function hideNativeDayDuplicates(workspace){
    const b=workspace.querySelector('.dt393-native');if(!b)return;
    const children=Array.from(b.children);
    // A visão moderna já contém a barra de progresso e checkboxes funcionais.
    for(const element of children){
      if(/^H2$/i.test(element.tagName||'')&&/Checklist de regras/i.test(element.textContent||'')){
        const next=element.nextElementSibling;
        element.remove();
        if(next?.classList?.contains('card'))next.remove();
      }
    }
  }
  function decorate(){
    const root=doc.getElementById('app');if(!root||root.dataset.dt393Decorated==='1')return;
    try{
      doc.body.classList.add('dt393-active');
      doc.getElementById('dt393-global-head')?.remove();
      const head=doc.createElement('div');head.id='dt393-global-head';head.innerHTML=header()+desktopNav();root.before(head);
      ensureDrawer();refreshDrawerActive();updateTapeOffset();
      const enhanced=['home','dia','stats','estudos'].includes(tab);
      // Conservar os controles do app e seus listeners reais; não montar uma interface falsa.
      const native=nativeWorkspace(root,({dia:'Planejamento, observações e revisão',home:'Painéis e registros completos',ops:'Modalidades e ferramentas de operação',trades:'Histórico, filtros e lançamentos',stats:'Estatísticas e relatórios',estudos:'Biblioteca e aulas',mercado:'Gráficos, notícias e cotações',term:'Terminal e workspaces'})[tab]||'Ferramentas integradas');
      let studyMounted=false;
      if(enhanced&&!(tab==='dia'&&typeof DV!=='undefined'&&DV==='hist')){
        const map={home,dia:day,ops:operations,trades:operations,stats:journal,estudos:studies,mercado:market,term:terminal};
        const panel=doc.createElement('div');panel.innerHTML=map[tab]();root.appendChild(panel);
        if(tab==='estudos'){
          const mount=panel.querySelector('.dt397-native-mount');
          mount.appendChild(native);studyMounted=true;
          // O conteúdo original só aparece quando o usuário seleciona uma seção.
          mount.hidden=!studyPanelOpen;
        }
      }
      if(tab==='dia')hideNativeDayDuplicates(native);
      if(!studyMounted)root.appendChild(native);
      root.dataset.dt393Decorated='1';
      doc.querySelector('meta[name="theme-color"]')?.setAttribute('content','#031611');
    }catch(err){console.error('dt393: falha ao aprimorar interface; controles originais preservados',err);}
  }
  // Atualiza só o painel principal quando os dados do usuário terminarem de carregar.
  doc.addEventListener('diario:aulas-carregadas',()=>{
    if(tab==='estudos'&&!studyPanelOpen){setTimeout(()=>{if(tab==='estudos'&&!studyPanelOpen)render();},0);}
  });
  // Delegação separada da do app: preserva os handlers nativos de data-a e data-tab.
  doc.addEventListener('click',function(e){
    const study=e.target.closest?.('[data-dt397-view]');
    if(study){
      e.preventDefault();e.stopImmediatePropagation();
      const id=study.dataset.dt397View;
      studyPanelOpen=id==='home'?'':id;
      if(id==='sim'){ ESV='liv'; }
      else if(id==='resumos'){ESV='liv';}
      else if(id==='playlists'){ESV='aul';}
      else if(id!=='home'){ESV=id;}
      if(tab!=='estudos')tab='estudos';
      render();
      if(id==='sim'){
        const b=doc.querySelector('#app .dt397-native-mount [data-e2at="sim"]');
        if(b)b.click();
      }
      window.scrollTo({top:0,behavior:'instant'});
      return;
    }
    const route=e.target.closest('[data-dt393-route]');
    if(route){e.preventDefault();e.stopImmediatePropagation();closeDrawer(false);const r=route.dataset.dt393Route;if(r.includes(':')&&window.DIARIO_NAV?.navigate){window.DIARIO_NAV.navigate(r);}else{tab=r;render();window.scrollTo?.(0,0);}return;}
    const mr=e.target.closest('[data-dt393-market]');
    if(mr){e.preventDefault();e.stopImmediatePropagation();const sub=mr.dataset.dt393Market==='cot'?'cq':mr.dataset.dt393Market;if(window.DIARIO_NAV?.navigate)window.DIARIO_NAV.navigate('mercado:'+sub);else{MKT.tab=sub;tab='mercado';render();}return;}
    const ac=e.target.closest('[data-dt393-action]');if(!ac)return;
    const a=ac.dataset.dt393Action;
    if(a==='menu'){
      e.preventDefault();e.stopImmediatePropagation();
      openDrawer('menu');
      return;
    }
    if(a==='native'){
      e.preventDefault();e.stopImmediatePropagation();
      doc.getElementById('dt393-workspace')?.scrollIntoView({behavior:'smooth',block:'start'});return;
    }
    if(a==='newtrade'){
      e.preventDefault();e.stopImmediatePropagation();
      const source=doc.querySelector('#fabm [data-a="new"][data-tp="D"]');
      if(source)source.click();return;
    }
    if(a==='search'){
      e.preventDefault();e.stopImmediatePropagation();
      openDrawer('search');
      return;
    }
    if(a==='terminalpicker'){
      e.preventDefault();e.stopImmediatePropagation();
      const picker=doc.querySelector('[data-radar-picker]');
      if(picker)picker.click();else doc.getElementById('dt393-workspace')?.scrollIntoView({behavior:'smooth'});return;
    }
    if(a==='checkphase'){
      e.preventDefault();e.stopImmediatePropagation();
      selectedPhase=ac.dataset.phase;
      doc.querySelectorAll('.dt393-phase [data-phase]').forEach(b=>{
        const active=b===ac;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      });
      let visible=0;
      doc.querySelectorAll('.dt393-checklist [data-rule-phase]').forEach(row=>{row.hidden=row.dataset.rulePhase!==selectedPhase;if(!row.hidden)visible++;});
      const empty=doc.querySelector('.dt393-phase-empty');if(empty)empty.hidden=visible>0;
      return;
    }
  },true);
  doc.addEventListener('change',function(e){
    const el=e.target.closest?.('[data-dt393-rule-phase]');if(!el)return;
    e.preventDefault();e.stopImmediatePropagation();
    const rule=currentRules().find(r=>String(r.id)===el.dataset.dt393RulePhase);
    if(!rule||!phaseTitle[el.value])return;
    rule.phase=el.value;rule.u=Date.now();save();render();
  },true);
  doc.addEventListener('change',function(e){
    if(!e.target.matches?.('.dt393-checklist [data-chk]'))return;
    setTimeout(()=>{
      const done=currentRules().filter(r=>dayData().chk?.[r.id]).length||0;
      const total=currentRules().length||0,pct=total?Math.round(done*100/total):0;
      const counter=doc.getElementById('dt393-checknum');if(counter)counter.textContent=`${done} de ${total} (${pct}%)`;
      const bar=doc.getElementById('dt393-progressbar');if(bar)bar.style.width=`${pct}%`;
      doc.querySelectorAll('.dt393-phase [data-phase]').forEach(b=>{
        const group=currentRules().filter(r=>phaseOf(r)===b.dataset.phase);
        const count=group.filter(r=>dayData().chk?.[r.id]).length;
        const small=b.querySelector('small');if(small)small.textContent=`${count}/${group.length}`;
      });
    },0);
  });
  doc.addEventListener('change',function(e){
    if(!e.target?.matches?.('[data-d="metaDia"],[data-d="maxP"]'))return;
    // O handler nativo persiste o valor antes da próxima renderização; não o duplica.
    setTimeout(()=>{if(tab==='dia')render();},20);
  });
  // A troca de modalidade usa os handlers originais. Ancoramos apenas UMA vez,
  // após o render nativo, respeitando a altura da faixa e do cabeçalho fixo.
  doc.addEventListener('click',function(e){
    const trigger=e.target?.closest?.('#app [data-modcard],#app [data-modgo],#app [data-modsub],#app [data-modhub]');
    if(!trigger)return;
    setTimeout(()=>{
      const panel=doc.querySelector('#app .dt393-native');
      if(!panel)return;
      const tape=doc.getElementById('tape');
      const tapeHeight=tape?.getBoundingClientRect().height||0;
      const headHeight=doc.getElementById('dt393-global-head')?.getBoundingClientRect().height||0;
      const target=Math.max(0,panel.getBoundingClientRect().top+window.scrollY-tapeHeight-headHeight-12);
      window.scrollTo({top:target,behavior:'auto'});
    },85);
  },true);
  // Revestir render0 (e não apenas render) cobre também atualizações automáticas dos módulos.
  if(typeof render0==='function'){
    const original=render0;
    render0=function(){
      doc.getElementById('app')?.removeAttribute('data-dt393-decorated');
      const output=original.apply(this,arguments);
      decorate();
      return output;
    };
  }else if(typeof render==='function'){
    const original=render;
    render=function(){
      doc.getElementById('app')?.removeAttribute('data-dt393-decorated');
      const output=original.apply(this,arguments);
      decorate();return output;
    };
  }
  // First render may have happened before this late-loaded progressive enhancement.
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,90),{once:true});
  else setTimeout(decorate,90);
})();
