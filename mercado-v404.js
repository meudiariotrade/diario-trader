/* Mercado v404 – evolução de páginas internas e histórico real.
 * Preserva a navegação, os filtros e os listeners nativos. Não altera dados/schemas.
 */
(()=>{'use strict';
const doc=document;
const modes={
 mu:{name:'Panorama global',icon:'◎',intro:'Brasil, Estados Unidos, setores e juros em uma única visão de consulta.',panels:[['market-watch-shortcut','EWZ e ADRs brasileiras'],['m404-mundo','Radar global'],['m404-setores','Desempenho setorial'],['mujr','Juros e curva DI']]},
 nt:{name:'Notícias de mercado',icon:'▤',intro:'Filtre as manchetes e acompanhe as fontes e os horários informados.',panels:[['m404-main','Notícias e filtros']]},
 ag:{name:'Agenda econômica',icon:'▦',intro:'Calendário econômico com país, relevância, consenso e horário, quando fornecidos.',panels:[['m404-main','Eventos e filtros']]},
 lab:{name:'Análises e sazonalidade',icon:'⌁',intro:'Sentimento, ciclos e estudos com referência às fontes e aos períodos.',panels:[['m404-main','Análises de mercado']]},
 jr:{name:'Jornal do Pregão',icon:'▥',intro:'Notícias diárias e revista técnica, mantendo a origem dos dados identificada.',panels:[['m404-revista','Revista de fim de semana'],['m404-jornal','Jornal diário']]}
};
let loading=false;
const market=()=>doc.querySelector('#app .dt395-native-mercado');
function state(){try{return typeof tab!=='undefined'&&tab==='mercado'&&typeof MKT==='object'&&MKT.tab||''}catch{return ''}}
function newEl(tag,cls,text){const el=doc.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el}
function panel(root,selector,label){const el=selector==='m404-main' ? [...root.children].find(n=>n.matches?.('.card,.sw9')) : selector==='m404-mundo'?[...root.children].find(n=>n.matches?.('.card')&&n.id!=='market-watch-shortcut'):selector==='m404-setores'?[...root.children].filter(n=>n.matches?.('.card'))[2]:selector==='m404-revista'?[...root.children].find(n=>n.matches?.('.card')&&!n.classList.contains('jrcard')):selector==='m404-jornal'?root.querySelector('.jrcard'):root.querySelector('#'+selector);
 if(el&&el.matches?.('.m404-intro,.m403-section-header'))return null;
 if(el){el.classList.add('m404-panel');if(!el.id)el.id='m404-panel-'+selector;el.dataset.m404Section=label;return el.id}return null;}
function mountInternal(){
 const root=market(),id=state(),conf=modes[id];if(!root||!conf)return;
 if(root.dataset.m404Sub===id&&root.querySelector('.m404-overview'))return;
 root.classList.add('m404-internal');root.dataset.m404Sub=id;
 const anchors=conf.panels.map(([selector,label])=>({id:panel(root,selector,label),label})).filter(a=>a.id);
 const old=root.querySelector('.m404-overview');if(old)old.remove();
 const container=newEl('section','m404-overview');container.setAttribute('aria-label','Visão geral de '+conf.name);
 const eyebrow=newEl('div','m404-overview-eyebrow','MERCADO  /  INTELIGÊNCIA E CONSULTA');
 const header=newEl('div','m404-overview-heading');const emblem=newEl('span','m404-overview-icon',conf.icon);emblem.setAttribute('aria-hidden','true');const title=newEl('h2','',conf.name);header.append(emblem,title);
 const text=newEl('p','',conf.intro);
 const note=newEl('div','m404-overview-note','Dados exibidos somente quando disponíveis nas fontes conectadas.');
 const nav=newEl('div','m404-panel-nav');nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Acesso rápido aos painéis da página');
 for(const a of anchors){const button=newEl('button','m404-panel-link',a.label+'  ↗');button.type='button';button.dataset.m404Jump=a.id;nav.append(button)}
 if(!anchors.length){const empty=newEl('span','m404-no-panels','Painéis carregados diretamente abaixo.');nav.append(empty)}
 container.append(eyebrow,header,text,note,nav);
 const after=root.querySelector('.m403-section-header');if(after)after.after(container);else root.prepend(container);
}
function sync(){const root=market();if(!root)return;const id=state();if(!modes[id]){root.classList.remove('m404-internal');root.removeAttribute('data-m404-sub');return}mountInternal()}
// O gráfico da v403 desenha apenas velas recebidas de provedores configurados.
// Este botão pede as duas séries reais ao mesmo método já utilizado no Terminal.
function addHistoryButton(){
 if(state()!=='cq')return;
 const box=market()?.querySelector('.m403-chart-card .m403-emptychart p');if(!box||box.querySelector('[data-m404-history]'))return;
 // Evita adicionar um segundo botão sobre o anterior em telas pequenas.
 const button=box.querySelector('button[data-navroute="graf"]')||newEl('button','m404-history-btn');
 button.removeAttribute('data-navroute');button.dataset.m404History='';button.classList.add('m404-history-btn');button.type='button';button.textContent='↻  Consultar histórico real';if(!button.isConnected)box.append(button);
}
function updateChart(){const select=market()?.querySelector('.m403-chart-card [data-m403-first]');if(select)select.dispatchEvent(new Event('change',{bubbles:true}));}
async function fetchHistory(button){
 if(loading)return;
 const api=window.TRM?.tec;if(!api?.pegaVelas){button.textContent='Histórico ainda não disponível';return;}
 const chart=button.closest('.m403-chart-card');const selected=[chart?.querySelector('[data-m403-first]')?.value,chart?.querySelector('[data-m403-second]')?.value];
 const aliases={SPX:['SPX','SP500','US500'],NDX:['NDX','USTEC','NASDAQ'],IBOV:['IBOV'],EWZ:['EWZ']};
 loading=true;button.disabled=true;button.textContent='Consultando duas séries…';
 try{
  const status=[];
  for(const symbol of new Set(selected.filter(Boolean))){let found=false;
   for(const alias of aliases[symbol]||[symbol]){
    try{const before=api.velas?.(alias,'1d')?.L;if(Array.isArray(before)&&before.length>=3){found=true;break}
       await api.pegaVelas(alias,'1d');const after=api.velas?.(alias,'1d')?.L;if(Array.isArray(after)&&after.length>=3){found=true;break}
    }catch(err){console.info('Mercado: origem de histórico indisponível para '+alias);}
   }status.push(found);
  }
  updateChart();
  if(!status.every(Boolean)){const empty=market()?.querySelector('.m403-emptychart p');if(empty){let alert=empty.querySelector('.m404-history-status');if(!alert){alert=newEl('span','m404-history-status');empty.append(alert)}alert.textContent='Ainda não foi possível carregar as duas séries. Verifique sua conta e a fonte de histórico.'}}
 }finally{loading=false;const live=market()?.querySelector('[data-m404-history]');if(live){live.disabled=false;live.textContent='↻  Tentar novamente'}setTimeout(addHistoryButton,50)}
}
let queued=false;function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;sync();addHistoryButton()},60)}
if(window.TraderUI?.onRender)window.TraderUI.onRender('mercado-v404',()=>queueMicrotask(()=>{try{sync();addHistoryButton()}catch(err){console.warn('Mercado: painéis',err)}}));
const start=()=>{const app=doc.getElementById('app');if(app){const observer=new MutationObserver(mutations=>{if(state()!=='cq'&&!modes[state()])return;const changed=mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.dt395-native-mercado,.m403-emptychart')||n.querySelector?.('.dt395-native-mercado,.m403-emptychart'))));if(changed)schedule()});observer.observe(app,{childList:true,subtree:true});}schedule()};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
doc.addEventListener('click',event=>{const jump=event.target.closest('[data-m404-jump]');if(jump){event.preventDefault();const target=doc.getElementById(jump.dataset.m404Jump);target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});return}const history=event.target.closest('[data-m404-history]');if(history){event.preventDefault();fetchHistory(history)}},false);
})();