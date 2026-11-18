/* v762: Web Worker efêmero. Nunca acessa Supabase nem cria polling. */
'use strict';
importScripts('tecnico-engine.js');
const M=self.DiarioTecnicoEngine;
const safeText=s=>String(s||'').replace(/[^A-Z0-9.^-]/g,'').slice(0,16);
const perf=c=>{
 const a=M.normalize(c);if(a.length<200)return null;
 const last=a.at(-1).c,lookbacks=[63,126,189].filter(n=>a.length>n);
 return lookbacks.length===3?lookbacks.reduce((s,n)=>s+((last/a[a.length-1-n].c)-1),0)/3:null;
};
const percentile=(value,rows)=>{
 if(value==null||rows.length<10)return null;
 const less=rows.filter(x=>x<value).length,equal=rows.filter(x=>x===value).length;
 return Math.max(0,Math.min(99,Math.round(99*(less+equal*.5)/rows.length)));
};
self.onmessage=function(event){
 const data=event.data||{};
 if(data.action!=='RUN')return;
 const reqId=data.reqId;
 try{
  const list=Array.isArray(data.assets)?data.assets.slice(0,120):[];
  const benchmark=data.benchmarks||{};
  const scores=list.map(x=>({ticker:safeText(x.ticker),group:x.market==='CRYPTO'?'CRYPTO':x.market==='US'?'US':'BR',raw:perf(x.daily||x.candles)}));
   const rsUniverse=data.rsUniverse||{},rsAsOf=String(data.rsAsOf||'');
  const strengths=scores.map(x=>{const base=perf(benchmark[x.group]);return {...x,relative:x.raw===null||base===null?null:x.raw-base}});
  const report=list.map((asset,i)=>{
   const group=strengths[i].group,peer=strengths.filter(x=>x.group===group&&x.relative!==null).map(x=>x.relative);
   const rs=percentile(strengths[i].relative,peer);
   const opts={tf:data.tf||'1d',daily:asset.daily||asset.candles,higher:asset.higher||(data.tf==='1d'?M.aggregateWeekly(asset.daily||asset.candles):null),rs};
   const result=M.examine(asset.candles,opts);
   return {ticker:safeText(asset.ticker),name:String(asset.name||'').slice(0,90),
    market:group,bdr:String(asset.bdr||'').slice(0,16),holding:!!asset.holding,source:String(asset.source||'cache').slice(0,60),
    updatedAt:String(asset.updatedAt||'').slice(0,40),
     rsMeta:{asOf:rs===null?null:rsAsOf,benchmark:rs===null?null:group==='BR'?'IBOV':group==='US'?'SPX':'BTCUSDT',denominator:rs===null?null:fixed.size,completo:rs!==null},
     buy:result.buy,sell:result.sell};
  }).filter(x=>x.ticker);
  self.postMessage({action:'DONE',reqId,version:M.VERSION,rows:report,meta:{requested:list.length,valid:report.filter(x=>x.buy.valid).length,rsPeers:scores.filter(x=>x.raw!==null).length}});
 }catch(e){self.postMessage({action:'ERROR',reqId,error:String(e.message||e).slice(0,220)})}
};
