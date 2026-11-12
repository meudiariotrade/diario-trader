/* v534 — apresenta primeiro as tarefas essenciais, reutilizando os controles existentes. */
(function(root,doc){
 'use strict';
 if(root.DiarioNavegacaoSimples)return;
 const expanded=new Map();
 const sectionKey=label=>{try{return [root.DIARIO_DEMO?'demo':typeof SESS!=='undefined'&&SESS?.uid||'local',typeof tab!=='undefined'?tab:'',typeof tab!=='undefined'&&tab==='mercado'&&typeof MKT!=='undefined'?MKT.tab:'',label].join('|')}catch{return label}};
 const active=()=>doc.querySelector('#app:not(.v503-fantasma)');
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 const text=(n,value)=>{if(n&&n.textContent!==value)n.textContent=value};
 function disclosure(label,cls=''){const d=el('details',null,'simple-details '+cls);d.append(el('summary',label));d.dataset.simpleKey=sectionKey(label);d.open=expanded.get(d.dataset.simpleKey)===true;return d}
 function wrap(node,label,cls=''){if(!node||node.parentElement?.classList.contains('simple-details'))return null;const d=disclosure(label,cls);node.before(d);d.append(node);return d}
 function welcome(){
  const box=doc.querySelector('#onb .sh');if(!box||box.dataset.simpleWelcome)return;
  const skip=box.querySelector('[data-onbx="pular"]');if(!skip)return;
  box.dataset.simpleWelcome='1';
  const title=box.querySelector('h2'),intro=title?.nextElementSibling;
  text(intro,'Comece pelo mercado, registre suas operações e acompanhe seus estudos. Você pode configurar seu risco agora ou explorar primeiro.');
  const details=disclosure('Configurar meu risco e rotina','simple-risk');
  const keep=new Set([title,intro,skip,...[...box.children].filter(n=>/Já tenho conta/.test(n.textContent))]);
  for(const n of [...box.children])if(!keep.has(n))details.append(n);
  skip.before(details);skip.textContent='Explorar aplicativo';skip.classList.remove('s');
  const hint=el('p','1. Acompanhe o mercado.  2. Registre e revise.  3. Estude.','simple-hint');intro?.after(hint);
 }
 function home(app){
  const h=app.querySelector('.v4-home');if(!h||h.dataset.simpleHome)return;
  const shortcuts=h.querySelector('.v4-short'),summary=h.querySelector('.v4-summary');if(!shortcuts||!summary)return;
  h.dataset.simpleHome='1';
  // v563: sem "Comece por aqui" e atalhos no Início; o Terminal fica no menu.
  shortcuts.closest('section')?.remove();
  const tiles=h.querySelector('.v4-tiles');wrap(tiles,'Explorar todas as áreas','simple-explore');
  const ia=h.querySelector('.v4-iacard');if(ia){
   text(ia.querySelector('[data-v4ia]'),'Perguntar à IA');
   text(ia.querySelector('.v4-sub'),'Encontre o que acompanhar. Abra a conversa quando quiser aprofundar.');
   ia.querySelector('.v4-ia')?.remove();
   const panorama=h.querySelector('.v4-pano');
   if(panorama){const previous=panorama.closest('section');panorama.classList.remove('v4-pano');panorama.classList.add('simple-context');ia.querySelector('.v4-sub')?.after(panorama);if(previous&&previous!==ia)previous.remove()}
  }
 }
 // v536: apresentação anterior do Terminal; somente menu e exclusividade dos modos.
 function terminal(app){
  const t=app.querySelector('#tf413');if(!t)return;
  const advanced=doc.body.classList.contains('tf413-advanced');
  for(const n of app.querySelectorAll('.trm>.trbar,.trm>.trtabs,.trm>#trgrid,.trm>.trtape,.trm>.trrod,.trm>.trquick-strip,.trm>.trmerc')){
   if(n.hidden===advanced)n.hidden=!advanced;
   n.inert=!advanced;
  }
  for(const n of t.querySelectorAll(':scope>.tf413-layout,:scope>.tf413-bottom')){if(n.hidden!==advanced)n.hidden=advanced;n.inert=advanced}
 }
 function marketSignals(app){
  let show=false;try{show=tab==='mercado'&&MKT.tab==='cq'}catch{}
  if(!show)for(const n of app.querySelectorAll('#v518-mov,#v519-ins,#v520-fa'))n.remove();
 }
 // Consolida as referências do antigo radar nas categorias já existentes.
 const symbol=value=>{const s=String(value||'').toUpperCase().split(':').pop();return ({'^BVSP':'IBOV',IBOVESPA:'IBOV','^GSPC':'SPX',SP500:'SPX','^IXIC':'IXIC',NASDAQ:'IXIC','^NDX':'NDX',NASDAQ100:'NDX','DX-Y.NYB':'DXY','BRL=X':'USDBRL','USD/BRL':'USDBRL','USDBRL=X':'USDBRL','ES=F':'ESF','ES1!':'ESF','NQ=F':'NQF','NQ1!':'NQF','YM=F':'YMF','YM1!':'YMF'})[s]||s};
 const priced=item=>item&&!item.suspeito&&item.px!==null&&item.px!==''&&Number.isFinite(Number(item.px))&&Number(item.px)>0;
 const radarSources=new WeakMap();
 function integrateRadar(m){
  const dashboard=m.querySelector('#m405-panorama'),box=m.querySelector('#cqbox,#cotbox');if(!dashboard||!box)return;
  const grid=dashboard.querySelector('.m405-grid');if(!grid)return;
  if(!dashboard.dataset.categoryReferences){
   dashboard.dataset.categoryReferences='1';dashboard.classList.add('simple-category-references');dashboard.setAttribute('aria-label','Referências adicionais da categoria');
   const sources=disclosure('Fontes e atualização do panorama','simple-market-sources');
   for(const n of dashboard.querySelectorAll('.m405-data-status,.m405-invalid,.m405-footer-note'))sources.append(n);
   const refresh=dashboard.querySelector('[data-m405-action="refresh"]');if(refresh){refresh.hidden=true;dashboard.append(refresh)}
   dashboard.append(grid);dashboard.querySelector('.m406-radar-details')?.remove();dashboard.querySelector('.m405-hero')?.remove();
   radarSources.set(dashboard,sources);
   for(const panel of grid.children){
    for(const row of panel.querySelectorAll('.m405-quote')){
     const name=row.querySelector('.m405-quote-name')?.textContent||'';
     row.dataset.referenceCategory=panel.id==='m405-global'?(/DXY/.test(name)?'fx':'idx'):panel.id==='m405-futures'?(/USD\/BRL/.test(name)?'fx':'fut'):({'m405-adrs':'adr','m405-commodities':'cmd','m405-rates':'jur'})[panel.id]||'';
    }
    panel.querySelector('[data-m405-action="adrs"]')?.remove(); // a lista de ADRs já é o conteúdo principal da categoria
   }
  }
  // cqPinta substitui o conteúdo de cqbox; conserva as referências no contêiner estável da categoria.
  const market=box.closest('.market-monitor')||box.parentElement;if(dashboard.parentElement!==market)market.append(dashboard);
  const sources=radarSources.get(dashboard);if(sources&&!box.contains(sources)){const header=box.querySelector('.m408-context');if(header)header.after(sources);else box.prepend(sources)}
  let category='',native=[];try{category=CQ.aba;native=CQ.d[category]?.itens||[]}catch{}
  const present=new Set(native.filter(priced).map(i=>symbol(i.s)));
  if(category==='adr')try{for(const item of AD.data?.itens||[]){if(item.s!=='EWZ'&&!AD.list.includes(item.s))continue;const q=root.TraderAdr?.view(item);if(priced(q?.active)||priced(q?.regular))present.add(symbol(item.s))}}catch{}
  let visible=0;
  for(const panel of grid.children){
   let count=0;for(const row of panel.querySelectorAll('.m405-quote')){const show=row.dataset.referenceCategory===category&&!row.classList.contains('is-missing')&&!present.has(symbol(row.dataset.panoramaSymbol));if(row.hidden===show)row.hidden=!show;if(show)count++}
   const rates=panel.querySelector('[data-m405-action="rates"]');const show=count>0||!!rates&&category==='jur';if(panel.hidden===show)panel.hidden=!show;
   if(show)visible++;
   if(panel.id==='m405-global'){text(panel.querySelector('h3'),category==='fx'?'Referências de câmbio':'Referências de índices');text(panel.querySelector('.m405-card-titles>small'),'Dados complementares quando não estão na lista principal')}
   for(const note of panel.querySelectorAll('.m405-empty-note'))note.hidden=true;
   if(rates)text(rates,'Ver curva DI no Terminal');
  }
  if(dashboard.hidden===(visible>0))dashboard.hidden=visible===0;
  for(const b of m.querySelectorAll('[data-m408-radar]'))b.remove();
 }
 function market(app){
  const m=app.querySelector('.dt395-native-mercado');if(!m)return;
  for(const d of m.querySelectorAll('.simple-market-about'))if(!d.querySelector('.m404-overview'))d.remove();
  for(const n of m.querySelectorAll('.m404-overview'))wrap(n,'Sobre esta tela','simple-market-about');
  const calendar=m.querySelector('#mkcal');if(calendar?.querySelector('.tradingview-widget-container')){
   const foot=calendar.nextElementSibling,d=wrap(calendar,'Ver calendário econômico','simple-calendar');
   if(d&&foot?.classList.contains('mut'))d.append(foot);
  }
  for(const n of m.querySelectorAll('.m403-chart-slot'))wrap(n,'Comparar históricos e indicadores','simple-comparison');
  integrateRadar(m);
 }
 function chat(){
  const p=doc.getElementById('wf-chat-panel');if(!p||p.querySelector('.simple-questions'))return;
  const area=p.querySelector('textarea');if(!area)return;
  const box=el('div',null,'simple-questions');box.append(el('b','Você pode começar por aqui'));
  for(const q of ['Como interpretar a agenda econômica de hoje?','Como juros e dólar influenciam o mercado?','Como organizar minha revisão do pregão?']){
   const b=el('button',q);b.type='button';b.addEventListener('click',()=>{area.value=q;area.dispatchEvent(new Event('input',{bubbles:true}));area.focus()});box.append(b);
  }
  p.querySelector('.wf-chat-history')?.after(box);
 }
 let queued=false;
 function mount(){queued=false;welcome();const app=active();if(app){home(app);terminal(app);market(app);marketSignals(app)}chat()}
 function queue(){if(!queued){queued=true;requestAnimationFrame(mount)}}
 root.addEventListener('click',e=>{
  if(e.target.closest?.('[data-dt393-route="mercado"],[data-navroute="mercado"]')){try{if(typeof MKT!=='undefined')MKT.tab='cq'}catch{}}
 },true);
 new MutationObserver(queue).observe(doc.body,{childList:true,subtree:true});
 new MutationObserver(queue).observe(doc.body,{attributes:true,attributeFilter:['class']});
 if(root.TraderUI?.onRender)root.TraderUI.onRender('navegacao-simples',queue);
 doc.addEventListener('click',e=>{if(e.target.closest('[data-tf415-nav]'))queue()});
 doc.addEventListener('toggle',e=>{const d=e.target;if(!d.isConnected||d.closest?.('.v503-fantasma'))return;if(d.dataset?.simpleKey)expanded.set(d.dataset.simpleKey,d.open);if(d.matches?.('.simple-comparison[open]'))root.DIARIO_GP421?.paint?.()},true);
 // Memoriza no clique antes que uma atualização do app substitua a tela.
 root.addEventListener('click',e=>{const summary=e.target.closest?.('.simple-details>summary');if(summary){const d=summary.parentElement;expanded.set(d.dataset.simpleKey,!d.open)}},true);
 root.addEventListener('click',e=>{
  if(e.target.closest?.('[data-m408-refresh]'))active()?.querySelector('.simple-category-references [data-m405-action="refresh"]')?.click();
  const rates=e.target.closest?.('.simple-category-references [data-m405-action="rates"]');if(rates){e.preventDefault();e.stopImmediatePropagation();try{tab='term';render();requestAnimationFrame(()=>requestAnimationFrame(()=>active()?.querySelector('[data-tf415-nav="DIFUT"]')?.click()))}catch{}}
 },true);
 root.DiarioNavegacaoSimples={mount};queue();
})(window,document);
