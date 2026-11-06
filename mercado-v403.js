/* Diario de Trader | Mercado v403 – interface Figma-first com dados reais.
 * Sem executar ordens, sem series sinteticas e sem mudar persistencia.
 * Reutiliza dados CQ, abas MKT, menus e o grafico historico do Terminal.
 */
(()=>{'use strict';
const doc=document, selector='#app .dt395-native-mercado';
const labels={cq:'Cotações e Panorama',mu:'Cotações e Panorama',nt:'Notícias e balanços',ag:'Agenda',lab:'Análises',jr:'Jornal e Giro',pn:'Painel',giro:'Jornal e Giro'};
const routes=[['cq','Cotações e Panorama'],['nt','Notícias'],['ag','Agenda'],['lab','Análises'],['jr','Jornal']];
const view={p:'1A',first:'SPX',second:'NDX',full:false};
const svgIcon=(name)=>({chart:'<path d="M3 19V5m0 14h18M6 15l5-6 4 3 5-7"/>',search:'<circle cx="10.7" cy="10.7" r="7"/><path d="m16 16 5 5"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',expand:'<path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6"/>',right:'<path d="m9 5 7 7-7 7"/>',sliders:'<path d="M3 7h18M3 17h18"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',refresh:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 5M18.5 15A7 7 0 0 1 6 18l-2-5"/>'})[name]||'';
const ico=(name,size=17)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIcon(name)}</svg>`;
const safe=(str)=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2});
function selected(){return typeof MKT==='object'?MKT.tab:'cq'}
function placeHeader(native){
 let top=native.querySelector(':scope > .m403-section-header');
 if(!top){top=doc.createElement('div');top.className='m403-section-header';native.prepend(top)}
 const sub=selected();
 top.innerHTML=`<nav class="m403-primary-tabs" aria-label="Páginas do Mercado">${routes.map(([id,title])=>`<button type="button" data-navroute="mercado:${id}" ${sub===id?'class="on" aria-current="page"':''}>${safe(title)}</button>`).join('')}</nav><div class="m403-session-caption"><span>INTELIGÊNCIA DE MERCADO</span><strong>${safe(labels[sub]||'Mercado')}</strong><small>Brasil e Estados Unidos · somente consulta</small></div>`;
 native.dataset.m403Sub=sub;
}
function quoteTabs(box){
 const tabs=box.querySelector(':scope > .cqtabs');if(!tabs)return;
 tabs.setAttribute('aria-label','Categorias de ativos');
 if(!tabs.querySelector('[data-cqa="fav"]')){const fav=doc.createElement('button');fav.type='button';fav.dataset.cqa='fav';fav.textContent='Favoritos';tabs.prepend(fav)}
 for(const btn of tabs.querySelectorAll('button')){if(btn.dataset.cqa==='adr')btn.textContent='ADRs';btn.classList.toggle('on',btn.dataset.cqa===(typeof CQ==='object'?CQ.aba:'us'));btn.setAttribute('aria-pressed',String(btn.classList.contains('on')));}
}
function getItemCount(){try{return Array.isArray(CQ?.d?.[CQ.aba]?.itens)?CQ.d[CQ.aba].itens.length:0}catch{return 0}}
function status(cot){
 let line=cot.querySelector('.m403-cq-status');if(!line){line=doc.createElement('div');line.className='m403-cq-status';const bar=cot.querySelector('.cqbar');if(bar)bar.before(line);else cot.appendChild(line)}
 const data=typeof CQ==='object'?CQ.d?.[CQ.aba]:null;
 let ts=data?.em||null;let stamp=ts&&!Number.isNaN(Date.parse(ts))?new Date(ts).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'não informada';
 line.innerHTML=`<span>${ico('chart')} <strong>${getItemCount()} ativos</strong> nesta categoria</span><small>Fonte: ${safe(data?.fonte||'fontes configuradas no aplicativo')} · consulta: ${safe(stamp)}</small>`;
}
function rows(cot){return [...cot.querySelectorAll('.cql > .cqr')];}
function perfNum(row){const s=row.querySelector('.cqv')?.textContent||'';const n=parseFloat(s.replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:0;}
function toolbar(cot){
 let bar=cot.querySelector('.m403-sortbar');if(!bar){bar=doc.createElement('div');bar.className='m403-sortbar';const q=cot.querySelector('.cqbar');q?.before(bar)}
 const ord=typeof CQ==='object'?CQ.ord:'lista',visual=typeof CQ==='object'?CQ.vis:'lista';
 bar.innerHTML=`<div class="m403-sort-left"><span class="m403-sort-label">Ordenar</span>${[['lista','Ordem'],['alta','Altas'],['baixa','Quedas']].map(([s,n])=>`<button type="button" data-cqo="${s}" class="${ord===s?'on':''}" aria-pressed="${ord===s}">${n}</button>`).join('')}</div><div class="m403-sort-right"><button type="button" data-cqv="lista" class="${visual!=='mapa'?'on':''}" aria-pressed="${visual!=='mapa'}">${ico('list')} Lista</button><button type="button" data-cqv="mapa" class="${visual==='mapa'?'on':''}" aria-pressed="${visual==='mapa'}">${ico('grid')} Mapa</button></div>`;
 const nativeBar=cot.querySelector('.cqbar');if(nativeBar){nativeBar.classList.add('m403-native-bar');nativeBar.querySelectorAll('.cqord').forEach(x=>x.hidden=true)}
}
function series(ticker){
 try{
  const api=typeof TRM!=='undefined'?TRM:window.TRM;const tech=api?.tec;
  const codes={SPX:['SPX','SP500','US500','SPX500'],NDX:['NDX','USTEC','NAS100','NASDAQ'],IBOV:['IBOV','IBOVESPA','IBOV G'],EWZ:['EWZ']};
  for(const tk of (codes[ticker]||[ticker])){
   const bars=tech?.velas?.(tk,'1d')?.L;
   if(!Array.isArray(bars))continue;
   const points=bars.map(row=>{const t=Number(Array.isArray(row)?row[0]:row?.time);const v=Number(Array.isArray(row)?row[4]:row?.close);return {t:t<1e12?t*1000:t,v};}).filter(x=>Number.isFinite(x.t)&&x.t>0&&Number.isFinite(x.v)&&x.v>0).sort((a,b)=>a.t-b.t);
   if(points.length>=3)return points;
  }
 }catch(e){console.debug('Histórico do Mercado não carregado',e)}return [];
}
function period(p){return ({'1D':2,'3M':92,'6M':184,'1A':366,'3A':1098,'5A':1830,'Máx':36500})[p]||366;}
function chartHtml(){
 const a=series(view.first),b=series(view.second),cut=Date.now()-period(view.p)*86400000;
 const A=a.filter(r=>r.t>=cut),B=b.filter(r=>r.t>=cut);
 const left=new Map(A.map(r=>[new Date(r.t).toISOString().slice(0,10),r.v]));const right=new Map(B.map(r=>[new Date(r.t).toISOString().slice(0,10),r.v]));
 const dates=[...left.keys()].filter(d=>right.has(d)).sort();
 const valid=dates.length>=3;
 const tabs=['1D','3M','6M','1A','3A','5A','Máx'];
 const controls=`<div class="m403-chart-title">${ico('chart')} <strong>Desempenho comparativo</strong><button type="button" data-m403-expand aria-label="Expandir gráfico">${ico('expand',18)}</button></div><div class="m403-chart-options"><label>Primeiro ativo <select data-m403-first>${[['SPX','S&P 500'],['NDX','Nasdaq 100'],['IBOV','Ibovespa'],['EWZ','EWZ']].map(([id,n])=>`<option value="${id}" ${view.first===id?'selected':''}>${n}</option>`).join('')}</select></label><label>Comparar <select data-m403-second>${[['NDX','Nasdaq 100'],['SPX','S&P 500'],['IBOV','Ibovespa'],['EWZ','EWZ']].map(([id,n])=>`<option value="${id}" ${view.second===id?'selected':''}>${n}</option>`).join('')}</select></label><span class="m403-scale">Base 100</span></div><div class="m403-chart-period" role="group" aria-label="Período do gráfico">${tabs.map(p=>`<button type="button" data-m403-period="${p}" ${view.p===p?'class="on" aria-pressed="true"':''}>${p}</button>`).join('')}</div>`;
 let graphic='';
 if(valid){
  const V1=dates.map(d=>100*left.get(d)/left.get(dates[0])),V2=dates.map(d=>100*right.get(d)/right.get(dates[0]));
  const data=V1.concat(V2),min=Math.min(96,...data),max=Math.max(104,...data),pad=(max-min)*.12||1;
  const W=1000,H=360,px=50,py=24,innerW=W-90,innerH=H-60;
  const x=i=>px+i/(dates.length-1)*innerW,y=v=>py+((max+pad-v)/(max-min+2*pad))*innerH;
  const path=vals=>vals.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const line1=path(V1),line2=path(V2),zero=y(100),hoverData=safe(JSON.stringify(dates.map((d,i)=>[d,V1[i],V2[i]])));
  const ticks=Array.from({length:6},(_,i)=>min+(max-min)*i/5);
  graphic=`<svg class="m403-line-chart" data-m403-points="${hoverData}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparação histórica real de ${safe(view.first)} e ${safe(view.second)} em base cem, de ${dates[0]} até ${dates.at(-1)}"><defs><linearGradient id="m403-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2674cc" stop-opacity=".3"/><stop offset="100%" stop-color="#2674cc" stop-opacity="0"/></linearGradient></defs>${ticks.map(v=>`<line x1="50" x2="960" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="#254035" stroke-dasharray="2 6"/><text x="6" y="${(y(v)+4).toFixed(1)}" fill="#aabbb4" font-size="15">${fmt(v)}</text>`).join('')}<line x1="50" x2="960" y1="${zero}" y2="${zero}" stroke="#739b84" stroke-dasharray="4 5"/><path d="${line2} L${x(dates.length-1)} ${H-36} L${x(0)} ${H-36} Z" fill="url(#m403-fade)"/><path d="${line2}" fill="none" stroke="#3180f6" stroke-width="2.8" vector-effect="non-scaling-stroke"/><path d="${line1}" fill="none" stroke="#f2f6f3" stroke-width="2.8" vector-effect="non-scaling-stroke"/>${[0,Math.floor((dates.length-1)/2),dates.length-1].map(i=>`<text x="${x(i).toFixed(1)}" y="354" fill="#9eb8af" font-size="14" text-anchor="middle">${dates[i].slice(0,7)}</text>`).join('')}<line class="m403-crosshair" x1="50" x2="50" y1="24" y2="325" hidden stroke="#e8c872" stroke-width="1" stroke-dasharray="5 5"/></svg><div class="m403-chart-tooltip" role="status"></div><div class="m403-chart-legend"><span><i class="m403-dot first"></i>${safe(view.first)} · ${fmt(V1.at(-1))}</span><span><i class="m403-dot second"></i>${safe(view.second)} · ${fmt(V2.at(-1))}</span><small>${dates.length} pregões em comum · ${safe(dates[0])} a ${safe(dates.at(-1))}</small></div>`;
 }else{graphic=`<div class="m403-emptychart" role="status"><svg viewBox="0 0 700 240" aria-hidden="true" preserveAspectRatio="none"><defs><pattern id="m403-grid" width="70" height="40" patternUnits="userSpaceOnUse"><path d="M 70 0 L 0 0 0 40" fill="none" stroke="#1e4a3c" stroke-width="1" stroke-dasharray="2 4"/></pattern></defs><rect width="700" height="240" fill="url(#m403-grid)"/></svg><p><strong>Histórico comparável ainda não disponível</strong><span>Precisamos de candles reais dos dois ativos para desenhar as curvas. Nenhum preço foi inventado.</span><button type="button" data-navroute="graf">Abrir gráficos com dados disponíveis ${ico('right',16)}</button></p></div>`;}
 return `<section class="m403-chart-card" aria-label="Gráfico comparativo do Mercado">${controls}<div class="m403-chart-canvas">${graphic}</div><footer>Fonte: histórico diário disponível no Terminal. Comparação somente nas datas comuns, sem projeções.</footer></section>`;
}
function createChart(cot){
 // O renderer v409 é a única fonte de marcação do gráfico. Não mostrar o antigo
 // e substituí-lo depois: essa sequência provocava três alturas diferentes
 // durante cada troca de aba, visível como "tremida" em monitores reais.
 let chart=cot.querySelector(':scope > .m403-chart-slot');
 if(!chart){chart=doc.createElement('div');const before=cot.querySelector('.cql, .cqmap, #adr, .vazio119');if(before)before.before(chart);else cot.append(chart);chart.className='m403-chart-slot';}
 const consolidated=!!doc.querySelector('script[src*="mercado-v409.js"]');
 if(consolidated){
  if(!chart.querySelector(':scope > .m403-chart-card'))chart.innerHTML='<section class="m403-chart-card m409-chart-card" aria-label="Gráfico comparativo do Mercado"></section>';
  return;
 }
 chart.innerHTML=chartHtml();
}
function renderQuotes(native){
 const market=native.querySelector('.market-monitor');if(!market)return;
 const cot=market.querySelector('#cotbox,#cqbox');if(!cot)return;
 market.classList.add('m403-quotes');
 quoteTabs(cot);
 if(cot.id==='cqbox'&&!cot.querySelector('.cq388-searchbar')&&!cot.querySelector('.m403-searchbar')){
  const input=doc.createElement('label');input.className='m403-searchbar';input.innerHTML=`${ico('search')}<input type="search" data-m403-search placeholder="Buscar ticker ou empresa" aria-label="Buscar ticker ou empresa"><span class="m403-inline-count">${getItemCount()} ativos</span>`;
  cot.querySelector('.cqtabs')?.after(input);
 }
 status(cot);toolbar(cot);createChart(cot);
 market.querySelectorAll('h2, :scope > p.mut').forEach(el=>el.classList.add('m403-hide-intro'));
 const nativeNote=cot.querySelector(':scope > .sm.mut[style]');if(nativeNote)nativeNote.classList.add('m403-source-note');
}
function decorate(){
 if(typeof tab==='undefined'||tab!=='mercado')return;
 const native=doc.querySelector(selector);if(!native)return;
 const cot=native.querySelector('#cotbox,#cqbox');
 const cached=nat=>nat.dataset.m403Done===selected()&&(!cot||cot.dataset.m403Ready==='true');
 if(cached(native))return;
 // A navegação original, cabeçalho e busca continuam no DOM e com seus ouvintes,
 // mas sao visualmente substituidos pela nova navegacao compacta.
 native.querySelectorAll(':scope > .platform-area,:scope > .m355-market-head').forEach(n=>n.classList.add('m403-oldheading'));
 placeHeader(native);
 if(selected()==='cq'){renderQuotes(native);if(cot)cot.dataset.m403Ready='true'}
 native.dataset.m403Done=selected();
}
let pending=false;
function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;decorate()},0)}
if(window.TraderUI?.onRender)window.TraderUI.onRender('mercado-v403',()=>{try{decorate()}catch(err){console.warn('Mercado: cabeçalho',err)}});
// Ao entrar pelo atalho geral Mercado, abrir a página principal de cotações.
// As subpáginas explícitas e a última categoria de ativo continuam independentes.
doc.addEventListener('click',event=>{if(event.target.closest?.('[data-dt393-route="mercado"]')){if(typeof MKT==='object')MKT.tab='cq';}},true);
const mo=new MutationObserver(mutations=>{
 if(typeof tab==='undefined'||tab!=='mercado')return;
 if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#cotbox,#cqbox,.dt393-native')||n.querySelector?.('#cotbox,#cqbox,.dt393-native')))))schedule();
});
const start=()=>{const app=doc.getElementById('app');if(app)mo.observe(app,{childList:true,subtree:true});schedule()};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
doc.addEventListener('click',event=>{
 const button=event.target.closest('[data-m403-period],[data-m403-expand]');if(button){event.preventDefault();if(button.dataset.m403Period)view.p=button.dataset.m403Period;else view.full=!view.full;const chart=button.closest('.m403-chart-card');chart?.classList.toggle('m403-chart-expanded',view.full);if(chart){const slot=chart.parentElement;slot.innerHTML=chartHtml();slot.querySelector('.m403-chart-card')?.classList.toggle('m403-chart-expanded',view.full)}return;}
 if(event.target.closest('[data-cqa]')){schedule();return;}
 if(event.target.closest('[data-cqo],[data-cqv]')){schedule();return;}
});
doc.addEventListener('change',event=>{if(event.target.matches?.('[data-m403-first],[data-m403-second]')){view[event.target.hasAttribute('data-m403-first')?'first':'second']=event.target.value;const slot=event.target.closest('.m403-chart-slot');if(slot)slot.innerHTML=chartHtml();}});
doc.addEventListener('pointermove',event=>{const svg=event.target.closest?.('.m403-line-chart');if(!svg)return;try{const pts=JSON.parse(svg.dataset.m403Points||'[]');if(!pts.length)return;const bounds=svg.getBoundingClientRect(),vx=(event.clientX-bounds.left)/bounds.width*1000;const i=Math.max(0,Math.min(pts.length-1,Math.round((vx-50)/910*(pts.length-1))));const x=50+i/(pts.length-1)*910;const cross=svg.querySelector('.m403-crosshair');if(cross){cross.hidden=false;cross.setAttribute('x1',String(x));cross.setAttribute('x2',String(x));}const tip=svg.parentElement.querySelector('.m403-chart-tooltip');if(tip){const p=pts[i];tip.textContent=p[0]+' · '+view.first+' '+fmt(p[1])+' · '+view.second+' '+fmt(p[2]);tip.style.display='block';}}catch(_){}});
doc.addEventListener('pointerout',event=>{const svg=event.target.closest?.('.m403-line-chart');if(!svg||svg.contains(event.relatedTarget))return;const cross=svg.querySelector('.m403-crosshair');if(cross)cross.hidden=true;const tip=svg.parentElement.querySelector('.m403-chart-tooltip');if(tip)tip.style.display='none';});
doc.addEventListener('input',event=>{if(!event.target.matches?.('[data-m403-search]'))return;const q=event.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();let shown=0;const market=event.target.closest('.m403-quotes');market?.querySelectorAll('.cqr').forEach(row=>{const txt=row.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');row.hidden=!txt.includes(q);if(!row.hidden)shown++});const count=market?.querySelector('.m403-inline-count');if(count)count.textContent=shown+' ativos';});
})();