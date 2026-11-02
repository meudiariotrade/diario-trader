/* Navegação do gráfico, sem alterar preços ou criar candles. */
((root)=>{
 'use strict';
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 function view(length,count=140,offset=0){
  length=Math.max(0,Math.floor(Number(length)||0));
  count=clamp(Math.round(Number(count)||140),Math.min(10,length||10),Math.min(600,length||600));
  offset=clamp(Math.round(Number(offset)||0),0,Math.max(0,length-count));
  return {count,offset,start:Math.max(0,length-offset-count),end:length-offset};
 }
 function change(length,current,action,value=0,anchor=.5){
  const v=view(length,current.count,current.offset);
  if(action==='reset')return view(length,140,0);
  if(action==='latest')return view(length,v.count,0);
  if(action==='pan')return view(length,v.count,v.offset+value);
  if(action==='zoom'){
   const next=view(length,v.count*value,v.offset),a=clamp(anchor,0,1);
   return view(length,next.count,length-(v.start+v.count*a+next.count*(1-a)));
  }
  return v;
 }
 root.TerminalChart={view,change};
 if(!root.document)return;
 const doc=root.document,api=()=>root.TRM?.tec;
 const send=(panel,action,value,anchor)=>api()?.chartView?.(panel,action,value,anchor);
 let drag=null;
 doc.addEventListener('wheel',e=>{
  const svg=e.target.closest?.('[data-g9svg]');
  if(!svg||!e.ctrlKey&&!e.metaKey)return;
  e.preventDefault();const box=svg.getBoundingClientRect();
  send(+svg.dataset.g9svg,'zoom',e.deltaY<0?1/1.2:1.2,(e.clientX-box.left)/box.width);
 },{passive:false});
 doc.addEventListener('keydown',e=>{
  const svg=e.target.closest?.('[data-g9svg]');if(!svg)return;
  const keys={ArrowLeft:['pan',.25],ArrowRight:['pan',-.25],'+':['zoom',1/1.4],'=':['zoom',1/1.4],'-':['zoom',1.4],Home:['reset',0],End:['latest',0]};
  const command=keys[e.key];if(!command)return;e.preventDefault();
  send(+svg.dataset.g9svg,command[0]==='pan'?'page':command[0],command[1]);
 });
 // Aplica o gesto ao soltar, para preservar a leitura e o scroll vertical da página.
 doc.addEventListener('pointerdown',e=>{
  const svg=e.target.closest?.('[data-g9svg]');if(!svg||e.button>0)return;
  const panel=+svg.dataset.g9svg,box=svg.getBoundingClientRect();
  if(!drag||drag.panel!==panel)drag={panel,box,points:new Map(),start:new Map(),pinch:false};
  drag.points.set(e.pointerId,{x:e.clientX,y:e.clientY});drag.start.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(drag.points.size===2)drag.pinch=true;
 });
 doc.addEventListener('pointermove',e=>{if(drag?.points.has(e.pointerId))drag.points.set(e.pointerId,{x:e.clientX,y:e.clientY})});
 function finish(e,cancel){
  if(!drag?.points.has(e.pointerId))return;
  const d=drag;
  if(!cancel){
   d.points.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(d.pinch&&d.points.size===2){
    const a=[...d.start.values()],b=[...d.points.values()],dist=p=>Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);
    if(dist(a)>15&&dist(b)>15)send(d.panel,'zoom',dist(a)/dist(b),((a[0].x+a[1].x)/2-d.box.left)/d.box.width);
   }else if(!d.pinch){
    const a=d.start.get(e.pointerId),dx=e.clientX-a.x,dy=e.clientY-a.y;
    if(Math.abs(dx)>15&&Math.abs(dx)>Math.abs(dy)*1.3)send(d.panel,'page',dx/d.box.width);
   }
  }
  drag=null;
 }
 doc.addEventListener('pointerup',e=>finish(e,false));
 doc.addEventListener('pointercancel',e=>finish(e,true));
 doc.addEventListener('dblclick',e=>{const svg=e.target.closest?.('[data-g9svg]');if(svg)send(+svg.dataset.g9svg,'reset',0)});
})(typeof window==='undefined'?globalThis:window);
