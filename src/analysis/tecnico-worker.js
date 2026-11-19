/* v762: Web Worker efêmero. Nunca acessa Supabase nem cria polling. */
'use strict';
importScripts('tecnico-engine.js','institutional-v781.js','xbrl-periodos.js','corporate-candles-v792.js');
const Adjust=self.DiarioCorporateCandles||null;
const T=self.DiarioXBRLPeriodos||null;
const I=self.DiarioInstitucional||null; // mocks legados de importScripts não fornecem segundo módulo
const M=self.DiarioTecnicoEngine;
const safeText=s=>String(s||'').replace(/[^A-Z0-9.^-]/g,'').slice(0,16);
const perf=c=>{
 const a=M.normalize(c);if(a.length<253)return null;
 const last=a.at(-1).c,lookbacks=[63,126,189,252].filter(n=>a.length>n);
 return lookbacks.length===4?lookbacks.reduce((s,n)=>s+((last/a[a.length-1-n].c)-1),0)/4:null;
};
const percentile=(value,rows)=>{
 if(value==null||rows.length<10)return null;
 const less=rows.filter(x=>x<value).length,equal=rows.filter(x=>x===value).length;
 return Math.max(0,Math.min(99,Math.round(99*(less+equal*.5)/rows.length)));
};
// RS percentual histórico: universo fixo e mesma data de pregão para TODOS os pares.
// Requer benchmark histórico e 252 barras anteriores por emissor; não preenche faltas.
// Percentil é proxy explícita de RS, não a classificação proprietária IBD.
const historicalRS=(assets,rsUniverse,benchmarks)=>{
 const out=new Map(),ymd=t=>new Date(t).toISOString().slice(0,10);
 const perfAt=(rows,i)=>{
  if(i<252)return null;
  const price=rows[i].c;
  return [63,126,189,252].reduce((total,n)=>total+(price/rows[i-n].c-1),0)/4;
 };
 for(const market of ['BR','US','CRYPTO']){
  const ids=Array.isArray(rsUniverse?.[market])?rsUniverse[market]:[];
  const fixed=new Set(ids),minimum=market==='CRYPTO'?15:30;
  if(ids.length<minimum||fixed.size!==ids.length)continue;
  const peers=assets.filter(a=>a.market===market&&fixed.has(a.ticker));
  if(peers.length!==fixed.size)continue;
  const benchmark=M.normalize(benchmarks?.[market]);
  if(benchmark.length<253)continue;
  const base=M.normalize(benchmark),baseDates=new Map(base.map((bar,i)=>[ymd(bar.t),i]));
  const series=peers.map(a=>{
   const bars=M.normalize(a.adjustedDaily||a.daily||a.candles);
   return {ticker:a.ticker,bars,dates:new Map(bars.map((bar,i)=>[ymd(bar.t),i]))};
  });
  for(const seriesAsset of series){
   const history={};
   for(let i=Math.max(251,seriesAsset.bars.length-260);i<seriesAsset.bars.length;i++){
    const day=ymd(seriesAsset.bars[i].t),bi=baseDates.get(day);
    if(bi==null||perfAt(base,bi)==null)continue;
    const peersToday=[];
    for(const peer of series){
     const pi=peer.dates.get(day);
     if(pi==null){peersToday.length=0;break}
     const p=perfAt(peer.bars,pi);
     if(p==null){peersToday.length=0;break}
     peersToday.push({ticker:peer.ticker,value:p});
    }
    if(peersToday.length!==fixed.size)continue;
    const own=peersToday.find(x=>x.ticker===seriesAsset.ticker);
    if(own)history[seriesAsset.bars[i].t]=percentile(own.value,peersToday.map(x=>x.value));
   }
   out.set(seriesAsset.ticker,history);
  }
 }
 return out;
};
self.onmessage=function(event){
 const data=event.data||{};
 const reqId=data.reqId;
 if(data.action==='BACKTEST'){
  try{
   // Apenas candles fornecidos pelo navegador; nenhuma chamada de rede nem Supabase.
   const r=M.walkForward(data.candles,{tf:data.tf,market:data.market,
    adjustedVerified:data.adjustedVerified===true,
    rsHistory:data.rsHistory||null});
   self.postMessage({action:'BACKTEST_DONE',reqId,ticker:safeText(data.ticker),result:r});
  }catch(e){self.postMessage({action:'ERROR',reqId,error:String(e.message||e).slice(0,220)})}
  return;
 }
 if(data.action!=='RUN')return;
 try{
  const list=Array.isArray(data.assets)?data.assets.slice(0,120):[];
  const benchmark=data.benchmarks||{};
  const scores=list.map(x=>({ticker:safeText(x.ticker),group:x.market==='CRYPTO'?'CRYPTO':x.market==='US'?'US':'BR',raw:perf(x.adjustedDaily||x.daily||x.candles)}));
   const rsUniverse=data.rsUniverse||{},rsAsOf=String(data.rsAsOf||'');
  const strengths=scores.map(x=>{const base=perf(benchmark[x.group]);return {...x,relative:x.raw===null||base===null?null:x.raw-base}});
  const rsHistories=historicalRS(list,rsUniverse,benchmark);
  const report=list.map((asset,i)=>{
   const group=strengths[i].group,ids=Array.isArray(rsUniverse[group])?rsUniverse[group]:[];
    const fixed=new Set(ids),peers=strengths.filter(x=>x.group===group&&fixed.has(x.ticker)&&x.relative!==null);
    const minPeers=group==='CRYPTO'?15:30;
    const complete=ids.length>=minPeers&&peers.length===fixed.size&&fixed.size===ids.length&&strengths[i].relative!==null;
    const rs=complete?percentile(strengths[i].relative,peers.map(x=>x.relative)):null;
   const opts={tf:data.tf||'1d',daily:asset.daily||asset.candles,
    higher:asset.higher||(data.tf==='1d'?M.aggregateWeekly(asset.daily||asset.candles):null),
    rs,market:group};
   const result=M.examine(asset.candles,opts);
   const corporate=Adjust&&Array.isArray(asset.corporateActions)?Adjust.adjust(M.normalize(asset.daily||asset.candles),asset.corporateActions,
    {market:group,asOf:data.asOf||new Date().toISOString().slice(0,10)}):null;
   const fundamentalTTM=T&&asset.xbrl?.facts?T.fcfMargin(asset.xbrl,{
    namespace:asset.xbrlNamespace==='ifrs-full'?'ifrs-full':'us-gaap',
    asOf:data.asOf||new Date().toISOString().slice(0,10)}):null;
   const daily=M.normalize(asset.daily||asset.candles);
   const instOpts={market:group,rs,benchmark:M.normalize(benchmark[group]),fundamentals:asset.fundamentals||{}};
   if(I&&daily.length>=210){result.buy.institutional=I.analyze(daily,1,instOpts);result.sell.institutional=I.analyze(daily,-1,instOpts);}
   return {ticker:safeText(asset.ticker),name:String(asset.name||'').slice(0,90),
    market:group,bdr:String(asset.bdr||'').slice(0,16),holding:!!asset.holding,source:String(asset.source||'cache').slice(0,60),
    updatedAt:String(asset.updatedAt||'').slice(0,40),
     rsMeta:{asOf:rs===null?null:rsAsOf,benchmark:rs===null?null:group==='BR'?'IBOV':group==='US'?'SPX':'BTCUSDT',denominator:rs===null?null:fixed.size,completo:rs!==null},
     rsHistory:rsHistories.get(asset.ticker)||null,
     fundamentalTTM,
     corporateStatus:corporate?{verified:corporate.verified,actions:corporate.actions||0,reason:corporate.reason||null}:null,
     buy:result.buy,sell:result.sell};
  }).filter(x=>x.ticker);
  self.postMessage({action:'DONE',reqId,version:M.VERSION,rows:report,meta:{requested:list.length,valid:report.filter(x=>x.buy.valid).length,rsPeers:scores.filter(x=>x.raw!==null).length}});
 }catch(e){self.postMessage({action:'ERROR',reqId,error:String(e.message||e).slice(0,220)})}
};
