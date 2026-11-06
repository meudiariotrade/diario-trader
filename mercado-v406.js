/* Mercado v406 — consolidacao de navegação sem copiar valores nem alterar dados.
   Mantém a funcionalidade original de Balanços (macro/CVM) e Giro (6 edições). */
(()=>{'use strict';
const doc=document;
const state={news:'noticias',journal:(()=>{try{return sessionStorage.getItem('diario-mercado-jornal-secao')==='giro'?'giro':'jornal'}catch{return 'jornal'}})()};
const root=()=>doc.querySelector('#app .dt395-native-mercado');
const sub=()=>{try{return typeof tab!=='undefined'&&tab==='mercado'&&typeof MKT!=='undefined'?MKT.tab:''}catch{return ''}};
const can=(name)=>{try{return typeof eval(name)==='function'}catch{return false}};
const make=(tag,cl,txt)=>{const e=doc.createElement(tag);if(cl)e.className=cl;if(txt)e.textContent=txt;return e};
function focusCurrent(el){try{el?.focus({preventScroll:true})}catch{}}
function section(name,view,options){const shell=make('section','m406-section-switch');shell.dataset.m406Switch=name;
 const tabs=make('div','m406-switch-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label',name==='nt'?'Seção de Notícias':'Seção do Jornal');
 for(const [id,label] of options){const button=make('button','m406-switch-button',label);button.type='button';button.dataset.m406Select=id;
  button.setAttribute('aria-pressed',String(view===id));button.classList.toggle('on',view===id);tabs.append(button)}
 shell.append(tabs);return shell}
function showMode(r,id){
 const news=id==='nt';const isGiro=!news&&state.journal==='giro';const isBalance=news&&state.news==='balancos';
 r.dataset.m406View=news?(isBalance?'balancos':'noticias'):(isGiro?'giro':'jornal');
 const bar=r.querySelector(':scope > .m406-section-switch');bar?.querySelectorAll('[data-m406-select]').forEach(b=>{const active=b.dataset.m406Select===r.dataset.m406View;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active))});
 r.querySelectorAll(':scope > [data-m406-main]').forEach(native=>{native.hidden=isBalance||isGiro});
 const inner=r.querySelector(':scope > .m406-content-host');if(inner)inner.hidden=!(isBalance||isGiro);
 const overview=r.querySelector(':scope > .m404-overview');if(overview){const title=overview.querySelector('.m404-overview-heading h2');if(title)title.textContent=news?'Notícias e balanços':'Jornal e Giro do Pregão';const links=overview.querySelector('.m404-panel-nav');if(links)links.hidden=isBalance||isGiro;const description=overview.querySelector('p');if(description){if(!description.dataset.m406Original)description.dataset.m406Original=description.textContent;description.textContent=isBalance?'Empresas da B3: divulgações recentes, calendário e confirmações nas fontes conectadas.':isGiro?'Boletins de pré-abertura, durante o pregão e fechamento, com contexto e fontes.':description.dataset.m406Original}}
 if(!inner||!(isBalance||isGiro))return;
 if(isBalance){
  try{if(typeof balHtml==='function')inner.innerHTML=balHtml();else inner.textContent='Calendário de balanços indisponível nesta versão.'}
  catch(err){inner.textContent='Não foi possível apresentar o calendário de balanços.';console.warn('Balanços v406',err)}
  try{if(typeof balCarrega==='function')void balCarrega()}catch(err){console.warn('Balanços v406: consulta',err)}
 }else if(isGiro){
  try{if(typeof vGiro==='function')inner.innerHTML=vGiro();else inner.textContent='Giro ainda não disponível nesta versão.'}
  catch(err){inner.textContent='Não foi possível apresentar o Giro.';console.warn('Giro v406',err)}
 }
}
function mount(){const r=root(),id=sub();if(!r||!['nt','jr'].includes(id))return;
 if(r.dataset.m406Sub===id&&r.querySelector(':scope > .m406-section-switch'))return;
 r.dataset.m406Sub=id;r.classList.add('m406-content-page');
 if(id==='jr'){try{state.journal=sessionStorage.getItem('diario-mercado-jornal-secao')==='giro'?'giro':'jornal'}catch{}}
 const mode=id==='nt'?state.news:state.journal;
 const tabbar=section(id,mode,id==='nt'?[['noticias','Notícias'],['balancos','Balanços da B3']]:[['jornal','Jornal do Pregão'],['giro','Giro do mercado']]);
 const content=make('div','m406-content-host');content.setAttribute('aria-live','polite');content.hidden=true;
 // Keep the actual legacy native card with its original click handlers.
 const existing=[...r.children].filter(x=>x.matches?.('.card,.sw9,.jrcard'));
 for(const x of existing)x.dataset.m406Main='';
 const overview=r.querySelector(':scope > .m404-overview');
 if(overview)overview.after(tabbar,content);else{const header=r.querySelector(':scope > .m403-section-header');if(header)header.after(tabbar,content);else r.prepend(tabbar,content)}
 showMode(r,id);
}
let queued=false;function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;try{mount()}catch(err){console.warn('Mercado v406',err)}},60)}
if(window.TraderUI?.onRender)window.TraderUI.onRender('mercado-v406',()=>queueMicrotask(()=>{try{mount()}catch(err){console.warn('Mercado: navegação',err)}}));
function init(){const app=doc.getElementById('app');if(app){new MutationObserver(mutations=>{
 if(!['nt','jr'].includes(sub()))return;
 if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.dt395-native-mercado')||n.querySelector?.('.dt395-native-mercado')))))schedule();
 }).observe(app,{childList:true,subtree:true})}schedule()}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
doc.addEventListener('click',ev=>{
 const b=ev.target.closest?.('[data-m406-select]');if(!b)return;
 const r=b.closest('.dt395-native-mercado');if(!r)return;ev.preventDefault();
 const view=b.dataset.m406Select,id=sub();
 if(id==='nt'){state.news=view}else if(id==='jr'){state.journal=view;try{sessionStorage.setItem('diario-mercado-jornal-secao',view)}catch{}}else return;
 showMode(r,id);focusCurrent(b);
});
// Existing notification/shortcut action "Balancos" used to take user to a hidden old market panel.
// It now navigates directly into Noticias > Balancos.
try{if(typeof GOR!=='undefined'&&GOR){GOR.bal=()=>{state.news='balancos';try{tab='mercado';MKT.tab='nt';render()}catch{}};
 GOR.giro=()=>{state.journal='giro';try{sessionStorage.setItem('diario-mercado-jornal-secao','giro')}catch{};try{tab='mercado';MKT.tab='jr';render()}catch{}};
}}catch(err){console.warn('Mercado v406: atalhos',err)}
// Compatibility with saved old links. No duplicated tab is created.
try{if(typeof vMercado==='function'){const original=vMercado;vMercado=function(){
 try{if(MKT.tab==='mu'||MKT.tab==='cot'){MKT.tab='cq'}
 else if(MKT.tab==='giro'){state.journal='giro';try{sessionStorage.setItem('diario-mercado-jornal-secao','giro')}catch{}MKT.tab='jr'}
 }catch{}return original.apply(this,arguments)};}}catch(err){console.warn('Mercado v406: aliases',err)}
})();