/* Diário de Trader • v408 • Mercado em primeiro plano (sem dados fictícios).
 * Mantém componentes nativos e suas ações; apenas reorganiza a página Cotações/Panorama.
 */
(()=>{'use strict';
const doc=document;
const root=()=>doc.querySelector('#app .dt395-native-mercado');
const active=()=>{try{return typeof tab!=='undefined'&&tab==='mercado'&&MKT?.tab==='cq'}catch{return false}};
const valid=()=>active()&&root()?.querySelector('#cqbox,#cotbox');
function make(tag,cl,txt){const n=doc.createElement(tag);n.className=cl||'';if(txt!=null)n.textContent=txt;return n}
function sortControls(box){
 let toolbar=box.querySelector(':scope > .m408-controls');if(!toolbar){toolbar=make('div','m408-controls');toolbar.setAttribute('aria-label','Ordenação e visualização das cotações');}
 const currentSort=typeof CQ!=='undefined'?CQ.ord:'lista',currentView=typeof CQ!=='undefined'?CQ.vis:'lista';
 toolbar.innerHTML=`<div class="m408-sort-left" role="group" aria-label="Ordenar ativos"><span class="m408-sort-caption">Ordenar</span>${[['lista','Ordem'],['alta','Altas'],['baixa','Quedas']].map(([k,v])=>`<button type="button" data-cqo="${k}" class="${currentSort===k?'on':''}" aria-pressed="${currentSort===k}">${v}</button>`).join('')}</div><div class="m408-sort-right" role="group" aria-label="Visualização"><button type="button" data-cqv="lista" class="${currentView!=='mapa'?'on':''}" aria-pressed="${currentView!=='mapa'}">☷ <span>Lista</span></button><button type="button" data-cqv="mapa" class="${currentView==='mapa'?'on':''}" aria-pressed="${currentView==='mapa'}">▦ <span>Mapa</span></button></div>`;
 const bar=box.querySelector(':scope > .cqbar,:scope > .m403-sortbar');
 const place=box.querySelector(':scope > .m403-chart-slot,:scope > .m408-workspace');
 if(place)place.before(toolbar);else box.append(toolbar);
 if(bar)bar.classList.add('m408-legacy-toolbar');
}
function mount(){
 const r=root(),box=valid(),dashboard=r?.querySelector('.m405-dashboard'),market=r?.querySelector(':scope > .market-monitor');
 if(!r||!box||!dashboard||!market)return;
 r.classList.add('m408-market-home');
 // Deixar as cotações e o gráfico antes do Radar Global completo.
 if(!dashboard.dataset.categoryReferences&&dashboard.previousElementSibling!==market)market.after(dashboard);
 const warning=r.querySelector(':scope > .warn');if(warning&&warning.previousElementSibling!==dashboard)dashboard.after(warning);
 // A barra inferior do Panorama continua preservada; aparece só após a lista de ativos.
 let head=box.querySelector(':scope > .m408-context');if(!head){head=make('div','m408-context');head.innerHTML='<div class="m408-context-copy"><span class="m408-eyebrow">MERCADO / BRASIL + EUA</span><strong>Acompanhe seus ativos</strong></div><div class="m408-context-actions"><button type="button" data-m408-refresh aria-label="Atualizar as cotações">↻ Atualizar</button><button type="button" data-m408-radar aria-label="Abrir Radar Global">Radar Global <span aria-hidden="true">↗</span></button></div>';}
 const tabs=box.querySelector(':scope > .cqtabs');if(tabs)tabs.before(head);else box.prepend(head);
 const search=box.querySelector(':scope > .m403-searchbar,:scope > .cq388-searchbar');
 if(search){search.after(box.querySelector(':scope > .m408-controls')||make('span','m408-placeholder'));const placeholder=box.querySelector(':scope > .m408-placeholder');if(placeholder)placeholder.remove();}
 sortControls(box);
 let workspace=box.querySelector(':scope > .m408-workspace');if(!workspace){workspace=make('div','m408-workspace');box.append(workspace)}
 let chartColumn=workspace.querySelector(':scope > .m408-chart-column');if(!chartColumn){chartColumn=make('section','m408-chart-column');chartColumn.setAttribute('aria-label','Gráfico comparativo');workspace.append(chartColumn)}
 let listColumn=workspace.querySelector(':scope > .m408-list-column');if(!listColumn){listColumn=make('section','m408-list-column');listColumn.setAttribute('aria-label','Lista e mapa de ativos');workspace.append(listColumn)}
 const chart=box.querySelector(':scope > .m403-chart-slot');if(chart)chartColumn.append(chart);
 const list=box.querySelectorAll(':scope > .cql,:scope > .cqmap,:scope > #adr,:scope > .vazio119,:scope > .warn');
 list.forEach(node=>listColumn.append(node));
 const nativeBar=box.querySelector(':scope > .cqbar');if(nativeBar){nativeBar.classList.add('m408-legacy-toolbar');listColumn.prepend(nativeBar)}
 // Se um provedor não enviou cotações, não há linhas simuladas. Exibe uma orientação curta.
 let empty=listColumn.querySelector(':scope > .m408-empty');
 const hasContent=!!listColumn.querySelector('.cqr,.cqmap,#adr,.vazio119,.cqvazio,.card.cql');
 if(!hasContent&&!empty){empty=make('div','m408-empty');empty.innerHTML='<strong>Nenhuma cotação disponível nesta categoria.</strong><p>Confira a conexão e selecione outra classe de ativos. Os valores aparecerão quando a fonte responder.</p>';listColumn.append(empty)}
 else if(hasContent&&empty)empty.remove();
 const status=box.querySelector(':scope > .m403-cq-status');if(status)listColumn.append(status);
 // Compactar o cabeçalho de Panorama, deixando a taxa de atualização acessível.
 const title=dashboard.querySelector('.m405-hero-title h2');if(title)title.textContent='Radar Global e indicadores';
 const desc=dashboard.querySelector('.m405-hero-title p');if(desc)desc.textContent='Brasil e EUA · EWZ, ADRs, futuros, commodities e juros';
 const summary=dashboard.querySelector('.m406-radar-summary');if(summary)summary.textContent='Explorar Radar Global completo — EWZ, ADRs, futuros, commodities e juros';
 r.dataset.m408Ready='1';
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;try{mount()}catch(err){console.warn('Mercado v408: composição',err)}},55)}
if(window.TraderUI?.onRender){window.TraderUI.onRender('mercado-v408',()=>{try{mount()}catch(err){console.warn('Mercado v408: render',err)}})}
function init(){const app=doc.querySelector('#app');if(!app)return;new MutationObserver(records=>{
 if(!active())return;
 if(records.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#cqbox,#cotbox,.market-monitor,.m405-dashboard,.cql,.cqmap,.cqr,.m403-chart-slot')||n.querySelector?.('#cqbox,#cotbox,.market-monitor,.m405-dashboard')))))schedule();
}).observe(app,{childList:true,subtree:true});schedule()}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
doc.addEventListener('click',e=>{const b=e.target.closest('[data-m408-radar]');if(b){e.preventDefault();const details=doc.querySelector('.m408-market-home .m406-radar-details');if(details){details.open=true;details.scrollIntoView({block:'start',behavior:'smooth'})}}});
doc.addEventListener('click',e=>{const btn=e.target.closest('[data-m408-refresh]');if(!btn||!active())return;e.preventDefault();
 if(typeof cqCarrega!=='function')return;
 const current=typeof CQ!=='undefined'?CQ.aba:undefined;
 btn.disabled=true;btn.textContent='Consultando…';
 try{Promise.resolve(cqCarrega(current,true)).catch(err=>console.warn('Mercado: atualização',err)).finally(()=>{if(btn.isConnected){btn.disabled=false;btn.textContent='↻ Atualizar';}schedule()})}
 catch(err){btn.disabled=false;btn.textContent='↻ Atualizar';console.warn('Mercado: atualização',err)}
});
doc.addEventListener('click',e=>{if(e.target.closest('[data-cqa],[data-cqo],[data-cqv]'))schedule()});
})();