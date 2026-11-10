/* v539 — diretório de funções do Terminal. Reutiliza comandos, controles e workspaces existentes. */
(function(root,doc){
 'use strict';
 if(root.DiarioTerminalInicio)return;
 // Executado antes do contexto de gráficos: transfere o comparativo antigo apenas quando Gráficos ainda não tem preferências.
 try{const key='diario-v428-ctx',saved=JSON.parse(localStorage.getItem(key)||'null'),old=saved?.['T:HOME'];if(saved&&old&&typeof old==='object'&&!Array.isArray(old)&&!Object.hasOwn(saved,'T:GP')){saved['T:GP']={...old};localStorage.setItem(key,JSON.stringify(saved))}}catch{}

 const groups=['Mercados','Gráficos e análise','Notícias e economia','Painéis e espaços','Dados e inteligência','Rotina e ajuda'];
 const primary=[['GLOBAL','MON','FX','ADR','CMDTY'],['@graph','COMP','TECH','PESQ','HIST'],['TOP','ECO','DIFUT','ECST','NEWSBR'],['@panels','MESA','@manage','@organize','@add'],['DQ','STAT','IA','EVT','AUD'],['HELP','@plan','ALRT','AUTO','@focus']];
 const names={GLOBAL:'Radar global',MON:'Monitor de ativos',FX:'Moedas e dólar',ADR:'ADRs brasileiras',CMDTY:'Commodities',COMP:'Comparar ativos',TECH:'Análise técnica',PESQ:'Pesquisar empresas',HIST:'Histórico e sazonalidade',TOP:'Notícias do mercado',ECO:'Agenda econômica',DIFUT:'Curva DI e juros',ECST:'Indicadores econômicos',NEWSBR:'Notícias do Brasil',DQ:'Central de dados',STAT:'Status das fontes',IA:'Central de inteligência',EVT:'Eventos relevantes',AUD:'Origem e auditoria dos dados',MESA:'Trocar de espaço',HELP:'Como usar o Terminal',ALRT:'Alertas de preço',AUTO:'Automações'};
 const aliases={WCRS:'FX',GLCO:'CMDTY',YAS:'TD'};
 const actions=[
  ['@favorite','Favoritar painel atual','.trquick-strip .trquick-chip[aria-pressed]',3],
  ['@manage','Gerenciar espaços','[data-ws321-open]',3],['@organize','Organizar painéis','[data-tr="org"]',3],['@add','Adicionar painel','[data-tr="addp"]',3],
  ['@rename','Renomear ou excluir espaço','[data-tr="wsmenu"]',3],['@layout','Layouts por horário','[data-auto322-open]',3],['@auto','Troca automática de layout','[data-t369-auto]',3],
  ['@plan','Planejar sessão','[data-pre328]',5],['@focus','Modo foco','[data-tr327-focus]',3],['@radar','Configurar lista do radar','[data-radar-picker]',0],['@commands','Buscar comandos','[data-quick-open]',5]
 ];
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const app=()=>doc.querySelector('#app:not(.v503-fantasma)');
 const source=s=>app()?.querySelector('.trbar '+s)||app()?.querySelector(s);
 const matches=(item,value)=>{const hay=norm(item.label+' '+(item.code||'')+' '+item.hint);return norm(value).trim().split(/\s+/).every(word=>hay.includes(word))};
 const node=(tag,text,cls)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 let query='',queued=false;const watched=new WeakSet();
 function category(code,label){
  const fixed=primary.findIndex(a=>a.includes(code));if(fixed>=0)return fixed;
  if(/MESA|ESPACO|ORG|VOLTAR/.test(code))return 3;
  if(/NEWS|TOP|FIRST|^N$|^NI$|ECO|ECST|ECFC|CENB|WIRP|GC|TD|BTMM|JUROS|AGENDA|NOTICIAS|JORNAL|GIRO|JEDU/.test(code))return 2;
  if(/DQ|STAT|AUD|IA|ASKB|^BI$|EVT|PANO|CEN|REL|VARR/.test(code))return 4;
  if(/HELP|GUIA|ALRT|ALERTAS|ALC|AUTO|PERFIL/.test(code))return 5;
  if(/COMP|TECH|SAZ|HIST|PESQ|EQS|BTST|REPLAY|GRAF|SETORES/.test(code))return 1;
  return 0;
 }
 function catalog(){
  const entries=[{id:'@graph',label:'Gráfico de preço',group:1,hint:'Abrir o gráfico salvo',code:'GP',mode:'GP'},{id:'@panels',label:'Retomar meus painéis',group:3,hint:'Seus espaços de trabalho',mode:'WORKSPACES'}];
  for(const [code,description]of Object.entries(root.TRM?.FN||{})){
   if(typeof description!=='string'||aliases[code]||root.TerminalCommandPolicy&&!root.TerminalCommandPolicy.allows(code))continue;
   entries.push({id:code,code,label:names[code]||description.split(' · ')[0].replace(/ \(tela cheia\)/g,''),hint:description,group:category(code,description)});
  }
  for(const [code,label]of root.TraderTerminalActions?.commands||[]){if((!root.TerminalCommandPolicy||root.TerminalCommandPolicy.allows(code))&&!entries.some(e=>e.id===code))entries.push({id:code,code,label:names[code]||label,hint:label,group:category(code,label)})}
  for(const [id,label,selector,group]of actions){const button=source(selector);if(button&&(!root.TerminalCommandPolicy||root.TerminalCommandPolicy.allowsAction(id)))entries.push({id,label:id==='@auto'?(/desligad/i.test(button.textContent)?'Ativar troca automática de layout':'Desativar troca automática de layout'):label,selector,group,hint:label})}
  try{const api=root.TRM,layout=api?.layAtual?.(),current=layout?.p?.[api.TR.foco]||layout?.p?.[0],ticker=api?.parse?.(current)?.tk;if(ticker)for(const [suffix,label]of [['G','Gráfico'],['FA','Fundamentos'],['DES','Ficha']])entries.push({id:'@ativo-'+suffix,code:ticker+' '+suffix,label:label+' de '+ticker,hint:label+' do ativo em foco',group:1})}catch{};
  return entries;
 }
 function reset(){query='';const h=app()?.querySelector('#terminal-inicio');if(h){h.querySelector('input').value='';draw(h)}}
 function nav(mode){app()?.querySelector('[data-tf415-nav="'+mode+'"]')?.click()}
 function panels(){root.TraderTerminalV413?.view('advanced')}
 function execute(item){
  if(item.mode){nav(item.mode);return}
  panels();
  if(item.selector){const button=source(item.selector);if(button){button.click();return}}
  if(item.code)root.DiarioTerminalTools?.run(item.code);
 }
 function row(item,index){
  const b=node('button',null,'ti539-row');b.type='button';b.dataset.ti539Item=item.id;b.title=item.hint||item.label;
  b.append(node('span',index==null?'':String(index+1).padStart(2,'0'),'ti539-number'),node('span',item.label,'ti539-label'));
  if(item.code)b.append(node('span',item.code,'ti539-code'));
  b.addEventListener('click',()=>execute(item));return b;
 }
 function draw(home){
  const list=home.querySelector('.ti539-columns');if(!list)return;
  const all=catalog(),q=norm(query.trim()),items=q?all.filter(e=>matches(e,q)):all;
  list.replaceChildren();const columns=[node('div',null,'ti539-column'),node('div',null,'ti539-column')];let count=0;
  groups.forEach((label,group)=>{
   const relevant=items.filter(e=>e.group===group);if(!relevant.length)return;
   const section=node('section',null,'ti539-group');section.append(node('h3',label));
   const top=q?relevant:primary[group].map(id=>relevant.find(e=>e.id===id)).filter(Boolean),extra=q?[]:relevant.filter(e=>!top.includes(e));
   top.forEach(e=>section.append(row(e,count++)));
   if(extra.length){const more=node('details',null,'ti539-more');more.append(node('summary','Mais funções · '+extra.length));extra.forEach(e=>more.append(row(e,null)));section.append(more)}
   columns[group<3?0:1].append(section);
  });
  if(!items.length)list.append(node('p','Nenhuma função encontrada. Tente “juros”, “gráfico” ou um comando como PETR4 G.','ti539-empty'));
  else list.append(...columns);
  const status=home.querySelector('[role="status"]');status.textContent=q?items.length+' funções encontradas.':'';
 }
 function create(){
  const home=node('section',null,'ti539-home');home.id='terminal-inicio';home.setAttribute('aria-labelledby','ti539-title');
  const header=node('header',null,'ti539-heading'),h=node('h2','Menu de funções');h.id='ti539-title';header.append(h,node('span','DIÁRIO TERMINAL','ti539-signature'));
  const form=node('form',null,'ti539-search'),label=node('label','Encontrar uma função ou ativo');label.htmlFor='ti539-search';
  const input=node('input');input.id='ti539-search';input.type='search';input.autocomplete='off';input.placeholder='Nome, assunto ou comando — ex.: PETR4 G';input.value=query;
  const submit=node('button','GO');submit.type='submit';const field=node('div',null,'ti539-field');field.append(input,submit);form.append(label,field);
  const status=node('p',null,'ti539-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  home.append(header,form,status,node('div',null,'ti539-columns'),node('p','Busque pelo nome ou use um comando. Seus gráficos ficam em Gráficos e seus espaços em Painéis.','ti539-foot'));
  input.addEventListener('input',()=>{query=input.value;draw(home)});
  form.addEventListener('submit',e=>{e.preventDefault();const value=input.value.trim();if(!value){input.focus();return}const results=catalog().filter(i=>matches(i,value));const exact=results.find(i=>norm(i.code)===norm(value)||norm(i.label)===norm(value));if(exact){execute(exact);return}const first=value.toUpperCase().split(/\s+/)[0];if(/^[A-Z]{4}[0-9]{1,2}$/.test(first)||/^(WIN|WDO|WINFUT|WDOFUT|IBOV|EWZ|DXY|AAPL|MSFT|NVDA|AMZN|META|TSLA|SPY|QQQ)$/.test(first)||Object.hasOwn(root.TRM?.FN||{},first)){panels();root.DiarioTerminalTools?.run(value);return}if(results.length===1){execute(results[0]);return}if(results.length){home.querySelector('.ti539-row')?.focus();return}if(/^[\w.!:^=/-]+(?:\s+[\w.!:^=/-]+){0,6}$/i.test(value)){panels();root.DiarioTerminalTools?.run(value)}else{status.textContent='Use um nome de função ou um comando como PETR4 G.'}});
  draw(home);return home;
 }
 function mount(){
  queued=false;const t=app()?.querySelector('#tf413');if(!t)return;
  if(!watched.has(t)){watched.add(t);new MutationObserver(queue).observe(t,{attributes:true,attributeFilter:['class']})}
  let home=t.querySelector('#terminal-inicio');if(!home){home=create();t.querySelector('.tf415-nav')?.after(home)}
  const start=!doc.body.classList.contains('tf413-advanced')&&(t.classList.contains('t428-p-HOME')||!root.DIARIO_V428||root.DIARIO_V428.page==='HOME');
  if(t.classList.contains('ti539-start')!==start)t.classList.toggle('ti539-start',start);
  if(home.hidden===start)home.hidden=!start;home.inert=!start;
  const signature=catalog().map(i=>[i.id,i.code,i.label].join(':')).join('|');if(home.dataset.catalog!==signature){home.dataset.catalog=signature;draw(home)};
  for(const [key,label]of [['HOME','Início'],['GP','Gráficos'],['WORKSPACES','Painéis']]){const b=t.querySelector('[data-tf415-nav="'+key+'"]');if(b&&b.textContent!==label)b.textContent=label}
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(mount)}}
 root.addEventListener('click',e=>{const b=e.target.closest?.('[data-tr341-menu]');if(b&&doc.body.classList.contains('trmon')){e.preventDefault();e.stopImmediatePropagation();reset();nav('HOME');setTimeout(()=>app()?.querySelector('#ti539-search')?.focus({preventScroll:true}),100)}},true);
 root.addEventListener('click',e=>{if(doc.body.classList.contains('trmon')&&e.target.closest?.('.trquick-dialog [data-command]'))panels()},true);
 root.addEventListener('keydown',e=>{if(!doc.body.classList.contains('trmon')||e.isComposing)return;if(e.key==='Enter'&&e.target.matches?.('.trquick-search'))panels();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&app()?.querySelector('#tf413.ti539-start')){e.preventDefault();e.stopImmediatePropagation();app()?.querySelector('#ti539-search')?.focus()}},true);
 doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tf415-nav]')){if(e.target.closest('[data-tf415-nav="HOME"]'))reset();queue();setTimeout(queue,80)}});
 new MutationObserver(records=>{if(records.some(r=>r.target.closest?.('.trbar,.trquick-strip')||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.trm,#tf413,.trbar,.dtval-open')||n.querySelector?.('#tf413,.trbar')))))queue()}).observe(doc.body,{childList:true,subtree:true});
 new MutationObserver(queue).observe(doc.body,{attributes:true,attributeFilter:['class']});
 root.TraderUI?.onRender?.('terminal-inicio-v539',queue);
 root.DiarioTerminalInicio={mount,catalog};queue();
})(window,document);
