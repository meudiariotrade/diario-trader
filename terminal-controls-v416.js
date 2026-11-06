/* v416 · Navegação tátil do gráfico de linha do Terminal. Usa a série OHLC existente. */
(function(root){
 'use strict';
 const doc=root.document;if(!doc)return;
 const minmax=(v,min,max)=>Math.max(min,Math.min(max,v));
 const SPKEY='dt-terminal-space-v416';
 let spaces={};try{const x=JSON.parse(root.localStorage?.getItem(SPKEY)||'{}');if(x&&typeof x==='object')spaces=x;}catch{}
 const getSpace=panel=>minmax(Number(spaces[panel]??14),0,35);
 const saveSpace=(panel,percent)=>{spaces[panel]=minmax(percent,0,35);try{root.localStorage?.setItem(SPKEY,JSON.stringify(spaces))}catch{}};
 // O renderer chama padding para deixar espaço visual DEPOIS do último preço, sem criar candles.
 const engine=()=>root.TerminalChart;
 if(engine())engine().padding=(panel,length)=>Math.max(0,Math.round((Number(length)||0)*getSpace(panel)/100));
 const api=(panel,action,value,anchor)=>root.TRM?.tec?.chartView?.(panel,action,value,anchor);
 const svgFor=e=>e.target?.closest?.('svg[data-g9svg]');
 function boxFor(chart){return chart?.closest('[data-trp]')||chart?.closest('.trpb')||chart?.parentElement}
 function panelFor(node){const svg=node?.querySelector?.('svg[data-g9svg]');return svg?+svg.dataset.g9svg:null}
 function buttons(panel){return `<div class="g416-controls" data-g416-panel="${panel}" aria-label="Controles de navegação do gráfico">
   <div class="g416-row"><div class="g416-group"><strong>↔ Tempo</strong><button type="button" data-g416="older" title="Mostrar candles mais antigos">←</button><button type="button" data-g416="newer" title="Avançar no histórico">→</button><button type="button" data-g416="timeIn" aria-label="Aproximar período">＋</button><button type="button" data-g416="timeOut" aria-label="Afastar período">−</button></div>
   <div class="g416-group"><strong>↕ Preço</strong><button type="button" data-g416="up" aria-label="Deslocar gráfico para cima">↑</button><button type="button" data-g416="down" aria-label="Deslocar gráfico para baixo">↓</button><button type="button" data-g416="priceIn" aria-label="Aproximar escala de preço">＋</button><button type="button" data-g416="priceOut" aria-label="Afastar escala de preço">−</button></div>
   <button type="button" class="g416-auto" data-g416="reset">⟲ Ajustar tudo</button></div>
   <div class="g416-row"><label class="g416-space"><span>Margem direita: <output data-g416-number>${getSpace(panel)}%</output></span><input type="range" min="0" max="35" step="1" value="${getSpace(panel)}" data-g416-space aria-label="Espaço depois da última cotação"></label><span class="g416-status" data-g416-status aria-live="polite"></span></div>
   <div class="g416-help">Arraste <b>para os lados</b> para mudar o tempo, <b>para cima/baixo</b> para ajustar a altura do preço. Pinça com dois dedos: zoom. Arraste o eixo direito para mover preços; o eixo inferior para ampliar datas. Sem mexer nas cotações.</div>
 </div>`}
 let scheduled=false;
 function enhance(){scheduled=false;for(const svg of doc.querySelectorAll('svg[data-g9svg]')){
   const panel=+svg.dataset.g9svg;if(!Number.isFinite(panel))continue;
   const parent=boxFor(svg),bar=parent?.querySelector('.g9bar');if(!bar||bar.parentElement?.querySelector(`.g416-controls[data-g416-panel="${panel}"]`))continue;
   bar.insertAdjacentHTML('afterend',buttons(panel));
  }
 }
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;root.requestAnimationFrame(enhance)}});
 const onReady=()=>{enhance();observer.observe(doc.getElementById('app')||doc.body,{childList:true,subtree:true})};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
 function status(panel,msg){const n=doc.querySelector(`.g416-controls[data-g416-panel="${panel}"] [data-g416-status]`);if(n)n.textContent=msg}
 function act(panel,action){switch(action){
   case 'older':api(panel,'page',.27);return 'Histórico anterior';
   case 'newer':api(panel,'page',-.27);return 'Histórico seguinte';
   case 'timeIn':api(panel,'zoom',.8,.5);return 'Tempo ampliado';
   case 'timeOut':api(panel,'zoom',1.25,.5);return 'Tempo afastado';
   case 'up':api(panel,'pricepan',-.13);return 'Preço para cima';
   case 'down':api(panel,'pricepan',.13);return 'Preço para baixo';
   case 'priceIn':api(panel,'pricezoom',.8);return 'Preço ampliado';
   case 'priceOut':api(panel,'pricezoom',1.25);return 'Preço afastado';
   case 'reset':api(panel,'reset',0);return 'Tempo e preço ajustados';
 }}
 doc.addEventListener('click',e=>{const b=e.target.closest?.('[data-g416]');if(!b)return;const holder=b.closest('.g416-controls'),panel=Number(holder?.dataset.g416Panel);if(!Number.isFinite(panel))return;e.preventDefault();e.stopPropagation();status(panel,act(panel,b.dataset.g416)||'')},true);
 doc.addEventListener('input',e=>{if(!e.target.matches?.('input[data-g416-space]'))return;const output=e.target.closest('.g416-space')?.querySelector('[data-g416-number]');if(output)output.textContent=e.target.value+'%';},true);
 doc.addEventListener('change',e=>{if(!e.target.matches?.('input[data-g416-space]'))return;const holder=e.target.closest('.g416-controls'),panel=Number(holder?.dataset.g416Panel);if(!Number.isFinite(panel))return;saveSpace(panel,Number(e.target.value));api(panel,'page',0);status(panel,'Margem direita: '+getSpace(panel)+'%')},true);
 // Mantemos uma única sessão de gesto, sem redesenhar o SVG enquanto o dedo toca a tela.
 let gesture=null,lastTap=null;
 function point(e){return {x:e.clientX,y:e.clientY}}
 function rectangle(e){return e.getBoundingClientRect()}
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function resetPreview(g){if(!g)return;try{g.svg.style.removeProperty('transform')}catch{}}
 doc.addEventListener('pointerdown',e=>{const svg=svgFor(e);if(!svg||e.button>0)return;const r=rectangle(svg),panel=+svg.dataset.g9svg;
   if(!r.width||!r.height||!Number.isFinite(panel))return;
   e.stopImmediatePropagation();if(e.pointerType==='touch')e.preventDefault();
   if(!gesture||gesture.panel!==panel){resetPreview(gesture);gesture={panel,svg,rect:r,pointers:new Map(),initial:new Map(),mode:e.clientX>r.right-64?'price':e.clientY>r.bottom-45?'time':'plot',moved:false};}
   gesture.pointers.set(e.pointerId,point(e));gesture.initial.set(e.pointerId,point(e));
 },true);
 doc.addEventListener('pointermove',e=>{
  const g=gesture;if(!g||!g.pointers.has(e.pointerId))return;e.stopImmediatePropagation();e.preventDefault();g.pointers.set(e.pointerId,point(e));
  if(g.pointers.size>1){g.moved=true;resetPreview(g);status(g.panel,'Pinça: ajustar zoom do tempo e do preço');return}
  const a=g.initial.get(e.pointerId),dx=e.clientX-a.x,dy=e.clientY-a.y;
  if(Math.hypot(dx,dy)>6)g.moved=true;
  if(!g.moved)return;
  const x=g.mode==='price'?0:minmax(dx*.65,-80,80),y=g.mode==='time'?0:minmax(dy*.65,-55,55);
  g.svg.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  status(g.panel,g.mode==='price'?'Deslocando o preço…':g.mode==='time'?'Ajustando período…':'Deslocando o gráfico…');
 },{capture:true,passive:false});
 function finish(e,cancel){const g=gesture;if(!g||!g.pointers.has(e.pointerId))return;e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();g.pointers.set(e.pointerId,point(e));
  // Em pinça os dois dedos só aplicam a alteração quando o último dedo é solto.
  if(g.pointers.size===2){g.end=[...g.pointers.values()];g.start=[...g.initial.values()];g.wasPinch=true}
  g.pointers.delete(e.pointerId);if(g.pointers.size)return;
  resetPreview(g);gesture=null;if(cancel)return;
  if(g.wasPinch&&g.start&&g.end){const [a,b]=g.start,[c,d]=g.end;
   const initialX=Math.max(15,Math.abs(a.x-b.x)),finalX=Math.max(15,Math.abs(c.x-d.x)),initialY=Math.max(15,Math.abs(a.y-b.y)),finalY=Math.max(15,Math.abs(c.y-d.y));
   const factorX=minmax(initialX/finalX,.45,2.3),factorY=minmax(initialY/finalY,.5,2);
   const anchor=minmax(((a.x+b.x)*.5-g.rect.left)/g.rect.width,0,1);
   if(Math.abs(factorX-1)>.06)api(g.panel,'zoom',factorX,anchor);
   if(Math.abs(factorY-1)>.08)api(g.panel,'pricezoom',factorY);
   status(g.panel,'Zoom ajustado');return;
  }
  const a=[...g.initial.values()][0]||point(e),dx=e.clientX-a.x,dy=e.clientY-a.y;
  if(Math.hypot(dx,dy)<8){const now=Date.now();if(lastTap&&lastTap.panel===g.panel&&now-lastTap.time<320&&distance(point(e),lastTap.point)<25){api(g.panel,'reset',0);status(g.panel,'Escala restaurada');lastTap=null}else lastTap={panel:g.panel,time:now,point:point(e)};return;}
  if(g.mode==='price')api(g.panel,'pricepan',minmax(dy/g.rect.height,-1,1)*.75);
  else if(g.mode==='time')api(g.panel,'zoom',Math.exp(minmax(-dx/g.rect.width*2.2,-.8,.8)),minmax((a.x-g.rect.left)/g.rect.width,0,1));
  else if(Math.abs(dx)>Math.abs(dy)*.8)api(g.panel,'page',minmax(dx/g.rect.width,-1,1));
  else api(g.panel,'pricepan',minmax(dy/g.rect.height,-1,1)*.75);
  status(g.panel,'Gráfico reposicionado');
 }
 doc.addEventListener('pointerup',e=>finish(e,false),true);
 doc.addEventListener('pointercancel',e=>finish(e,true),true);
 doc.addEventListener('wheel',e=>{const svg=svgFor(e);if(!svg)return;const r=rectangle(svg),panel=+svg.dataset.g9svg;if(!Number.isFinite(panel))return;
  e.stopImmediatePropagation();e.preventDefault();const factor=e.deltaY<0?.88:1.14;
  if(e.clientX>r.right-64)api(panel,'pricezoom',factor);
  else api(panel,'zoom',factor,minmax((e.clientX-r.left)/r.width,0,1));
 },{capture:true,passive:false});
 doc.addEventListener('keydown',e=>{const svg=svgFor(e);if(!svg||e.altKey||e.ctrlKey||e.metaKey)return;const panel=+svg.dataset.g9svg;
  const keys={ArrowLeft:['page',.2],ArrowRight:['page',-.2],ArrowUp:['pricepan',-.12],ArrowDown:['pricepan',.12],'+':['zoom',.8],'=':['zoom',.8],'-':['zoom',1.25],Home:['reset',0]};
  if(!keys[e.key])return;e.preventDefault();e.stopImmediatePropagation();const [action,value]=keys[e.key];api(panel,action,value,.5);
 },true);
 // Expõe uma API mínima de diagnóstico sem dados do usuário.
 root.TraderChartGesturesV416=Object.freeze({version:'v416',getSpace,padding:(p,n)=>engine()?.padding?.(p,n)});
})(window);
