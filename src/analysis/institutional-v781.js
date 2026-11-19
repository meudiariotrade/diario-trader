/* v781 — setups institucionais: funções puras, executadas exclusivamente no Web Worker.
 * Referências e parâmetros: docs/v781-metodologias-e-gates.md
 * Condicional/armado != ordem executada; sem requisições, timers, Supabase ou IA.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioInstitucional=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const good=n=>typeof n==='number'&&Number.isFinite(n);
 const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 const avg=(a,n,i=a.length-1)=>i>=n-1&&a.slice(i-n+1,i+1).every(good)?mean(a.slice(i-n+1,i+1)):null;
 const ema=(a,n)=>{let v=null;return a.map((x,i)=>{if(!good(x))return null;
  if(i===n-1)v=mean(a.slice(0,n));else if(i>=n&&v!==null)v=v*(1-2/(n+1))+x*2/(n+1);
  return v;})};
 const high=a=>a.length?Math.max(...a.map(x=>x.h)):null;
 const low=a=>a.length?Math.min(...a.map(x=>x.l)):null;
 const close=a=>a.map(x=>x.c);
 const signed=(x,d)=>d===1?x:-x;
 const round=(n,d=4)=>good(n)?Number(n.toFixed(d)):null;
 const tick=(market)=>market==='US'?0.10:market==='CRYPTO'?null:0.01; // IBD EUA US$0,10; BR R$0,01
 const above=(bar,level,dir)=>dir===1?bar.h>=level:bar.l<=level;
 const signal=(armed,triggered,entry,stop,extra={})=>({armed:!!armed,triggered:!!(armed&&triggered),entry:round(entry),stop:round(stop),...extra});
 function kst(c){
  const p=close(c),legs=[[10,10,1],[15,10,2],[20,10,3],[30,15,4]];
  const r=p.map((_,i)=>{
   const values=legs.map(([roc,smooth,weight])=>{
    if(i<roc+smooth-1)return null;
    const result=[];
    for(let j=i-smooth+1;j<=i;j++)result.push((p[j]/p[j-roc]-1)*100);
    return mean(result)*weight;
   });
   return values.every(good)?values.reduce((a,b)=>a+b,0):null;
  });
  const last=r.length-1,sig=avg(r,9,last),prevSig=avg(r,9,last-1);
  return {value:round(r[last]),signal:round(sig),previous:round(r[last-1]),previousSignal:round(prevSig),
   bullish:good(sig)&&good(prevSig)&&r[last]>sig&&r[last-1]<=prevSig,
   bearish:good(sig)&&good(prevSig)&&r[last]<sig&&r[last-1]>=prevSig};
 }
 function obvEvidence(c,dir){
  const o=[0];for(let i=1;i<c.length;i++)o.push(o.at(-1)+
   (c[i].c>c[i-1].c?c[i].v:c[i].c<c[i-1].c?-c[i].v:0));
  const e9=ema(o,9),e21=ema(o,21),i=o.length-1;
  const prior25=o.slice(-26,-1),prior15=o.slice(-16,-1);
  const macro=prior25.length===25&&(dir===1?o[i]>Math.max(...prior25):o[i]<Math.min(...prior25));
  const aligned=good(e9[i])&&good(e21[i])&&signed(e9[i]-e21[i],dir)>0;
  const crossRecent=Array.from({length:Math.min(15,i)},(_,j)=>i-j).some(k=>
   signed(e9[k]-e21[k],dir)>0&&signed(e9[k-1]-e21[k-1],dir)<=0);
  const local=prior15.length===15&&(dir===1?o[i]>Math.max(...prior15):o[i]<Math.min(...prior15))&&aligned&&crossRecent;
  const kind=macro?'macro':local?'local':null;
  return {confirmed:!!kind,macro,local,ema9:round(e9[i],0),ema21:round(e21[i],0),
   pivotMacro:round(dir===1?Math.max(...prior25):Math.min(...prior25),0),
   pivotLocal:round(dir===1?Math.max(...prior15):Math.min(...prior15),0),
   label:macro?'OBV ROMPIDO (MACRO)':local?'OBV CONFIRMADO (PIVÔ LOCAL)':'OBV NÃO CONFIRMADO'};
 }
 function analyze(c,dir=1,opts={}){
  if(!Array.isArray(c)||c.length<210||![1,-1].includes(dir))
   return {valid:false,reason:'Histórico diário insuficiente'};
  const x=c, i=x.length-1,last=x[i],v=x.map(b=>b.v),p=close(x),e9=ema(p,9),e10=ema(p,10),e21=ema(p,21);
  const tickSize=good(opts.tick)&&opts.tick>0?opts.tick:tick(opts.market);
  const buffer=tickSize??Math.max(.00000001,last.c*.0001);
  const d=dir, up=dir===1, trend=signed(e9[i]-e9[i-1],d)>0;
  const prior=x.slice(-51,-1),vol50=mean(prior.map(y=>y.v)),rvol=vol50>0?last.v/vol50:null;
  const obv=obvEvidence(x,dir);
  const bench=Array.isArray(opts.benchmark)?opts.benchmark:[];
  const bp=close(bench),benchmarkTrend=bench.length>=200?
   (bp.at(-1)>avg(bp,50)&&bp.at(-1)>avg(bp,200)):null;
  const fundamental=opts.fundamentals||{};
  const numeric=k=>good(fundamental[k])?fundamental[k]:null;
  const week52=x.slice(-252),max52=week52.length===252?high(week52):null;
  const on= {
   C: numeric('eps_growth_yoy')===null||numeric('eps_growth_qoq')===null?null:numeric('eps_growth_yoy')>0&&numeric('eps_growth_qoq')>0,
   A: numeric('eps_growth_annual_3y')===null||numeric('roe')===null?null:numeric('eps_growth_annual_3y')>0&&numeric('roe')>=15,
   N: max52===null?null:last.c>=max52*.85,
   S: vol50>0?rvol>=1.4:null,
   L: Number.isInteger(opts.rs)?opts.rs>=80:null,
   M:benchmarkTrend
  };
  // A letra I institucional não é inferida sem dados de fundos/posições verificadas.
  const canSlim={checks:on,missing:Object.keys(on).filter(k=>on[k]===null).concat('I'),
   confirmed:up&&Object.values(on).every(Boolean)&&fundamental.institutional_sponsorship_verified===true,
   partial:up&&Object.values(on).some(x=>x===true),
   proxyRS:Number.isInteger(opts.rs)?opts.rs:null,
   status:!up?'não aplicável à venda':Object.values(on).some(x=>x===null)?'não calculável integralmente':'filtro técnico/fundamental; I não verificada'};
  // Pocket Pivot: maior volume de queda entre as dez barras anteriores, não média.
  const downVolumes=x.slice(-11,-1).filter((bar,j,a)=>{
   const index=i-10+j;return index>0&&bar.c<x[index-1].c;
  }).map(z=>z.v);
  const maxDown=downVolumes.length?Math.max(...downVolumes):null;
  const nearMA=[e10[i],e21[i],avg(p,50)].some(m=>good(m)&&last.l<=m*1.03&&last.c>=m*.97);
  const pocket=signal(up&&maxDown!==null&&last.c>last.o&&last.c>x[i-1].c&&
   last.v>maxDown&&nearMA&&last.c>avg(p,50),true,last.h+buffer,last.l-buffer,
   {volumeThreshold:maxDown,relativeVolume:round(rvol,2),candidateLabel:'Pocket Pivot (Morales/Kacher)'});
  // Bases usam somente histórico até ontem; candle atual é potencial rompimento.
  const flat=x.slice(-26,-1),baseHigh=high(flat),baseLow=low(flat),
   previous=x.length>=100?x[i-85]?.c:null,preHigh=high(x.slice(-40,-25));
  const gain=good(previous)&&previous>0&&good(preHigh)?preHigh/previous-1:null;
  const baseDepth=good(baseHigh)&&baseHigh>0?1-baseLow/baseHigh:null;
  const dryFlat=flat.length===25&&mean(flat.slice(-5).map(y=>y.v))<
   mean(flat.slice(0,20).map(y=>y.v))*.85;
  const flatOK=up&&flat.length===25&&gain!==null&&gain>=.20&&baseDepth<=.15&&dryFlat;
  const flatBase=signal(flatOK,above(last,baseHigh+buffer,1)&&rvol>=1.4,
   baseHigh+buffer,baseLow-buffer,{depth:round(baseDepth),volumeDry:dryFlat,relativeVolume:round(rvol,2)});
  // Xícara: cerca de 8-15 semanas observadas, mínimo 35 pregões, alça de 5-15.
  const handle=x.slice(-11,-1),cup=x.slice(-76,-11),left=cup.slice(0,20),right=cup.slice(-20);
  const rim=high(left),bottom=low(cup),rightRim=high(right),handleHigh=high(handle),handleLow=low(handle);
  const depth=good(rim)&&rim>0?1-bottom/rim:null;
  const troughIndex=cup.findIndex(z=>z.l===bottom),bottomBand=good(bottom)?cup.filter(z=>z.l<=bottom*1.035).length:0;
  const rounded=troughIndex>=10&&troughIndex<=cup.length-11&&bottomBand>=4&&
   (troughIndex>14||cup.length-troughIndex>14);
  const handleDepth=good(handleHigh)&&handleHigh>0?1-handleLow/handleHigh:null;
  const handleOK=handle.length===10&&depth>=.12&&depth<=.33&&rounded&&
   rightRim>=rim*.9&&handleLow>=bottom+(rim-bottom)*.5&&handleDepth<=.12&&
   mean(handle.slice(-5).map(y=>y.v))<mean(cup.slice(-20).map(y=>y.v));
  const cupHandle=signal(up&&handleOK,above(last,handleHigh+buffer,1)&&rvol>=1.4,
   handleHigh+buffer,handleLow-buffer,{cupDepth:round(depth),handleDepth:round(handleDepth),
    rounded,relativeVolume:round(rvol,2)});
  const last9=e9[i],prior9=e9[i-1],priorPrior9=e9[i-2];
  const turned=signed(prior9-priorPrior9,d)>0&&signed(priorPrior9-e9[i-3],d)<=0;
  const ref91=x[i-1];
  const stormer91=signal(turned&&trend,above(last,up?ref91.h+buffer:ref91.l-buffer,d),
   up?ref91.h+buffer:ref91.l-buffer,up?ref91.l-buffer:ref91.h+buffer);
  // 9.2: referência é maior fechamento da perna; correção fecha além de sua extrema.
  const reference=x.slice(-11,-2).reduce((b,z)=>!b||signed(z.c,d)>signed(b.c,d)?z:b,null);
  const correction=x[i-1];
  const correction92=up?correction.c<reference.l:correction.c>reference.h;
  const stormer92=signal(trend&&correction92&&
   signed(e9[i-1]-e9[i-2],d)>0,
   above(last,up?correction.h+buffer:correction.l-buffer,d),
   up?correction.h+buffer:correction.l-buffer,up?correction.l-buffer:correction.h+buffer);
  // 9.3: dois candles após o de referência, primeiro não pode fechar além da extrema.
  const ref93=x[i-3],first=x[i-2],second=x[i-1];
  const correction93=up?first.c>=ref93.l&&second.l<first.l:
   first.c<=ref93.h&&second.h>first.h;
  const stormer93=signal(trend&&correction93,above(last,up?second.h+buffer:second.l-buffer,d),
   up?second.h+buffer:second.l-buffer,
   up?Math.min(first.l,second.l)-buffer:Math.max(first.h,second.h)+buffer);
  const support=[e21[i],avg(p,200)].some(v=>good(v)&&Math.abs(last.l-v)/last.c<=.02);
  const resistance=[e21[i],avg(p,200)].some(v=>good(v)&&Math.abs(last.h-v)/last.c<=.02);
  const pfr=up?last.l<Math.min(x[i-1].l,x[i-2].l)&&last.c>x[i-1].c&&support:
   last.h>Math.max(x[i-1].h,x[i-2].h)&&last.c<x[i-1].c&&resistance;
  const stormerPFR=signal(pfr,false,up?last.h+buffer:last.l-buffer,
   up?last.l-buffer:last.h+buffer,{reason:'Gatilho pendente na próxima barra, não antecipar execução'});
  const prior20=x.slice(-21,-1),breakSupport=low(prior20),breakResistance=high(prior20);
  const failed=up?last.l<breakSupport&&last.c>breakSupport:
   last.h>breakResistance&&last.c<breakResistance;
  const trap=signal(failed,false,up?last.h+buffer:last.l-buffer,
   up?last.l-buffer:last.h+buffer,{reason:'Armadilha detectada; confirmar gatilho na barra posterior'});
  const crossed=up?e9[i]>e21[i]&&e9[i-1]<=e21[i-1]:
   e9[i]<e21[i]&&e9[i-1]>=e21[i-1];
  const slope9=signed(e9[i]-e9[i-1],d)>0,slope21=signed(e21[i]-e21[i-1],d)>0;
  const lemosEMA=signal(crossed&&slope9&&slope21&&signed(last.c-e9[i],d)>0&&signed(last.c-e21[i],d)>0,
   true,up?last.h+buffer:last.l-buffer,up?last.l-buffer:last.h+buffer);
  // 1-2-3 estrutural: pivô 1, ponto 2 e correção 3 de amplitude menor; só barras passadas.
  const pivots=[];
  for(let j=3;j<i-2;j++){
   const local=x.slice(j-2,j+3);
   if(x[j].l===low(local))pivots.push({j,p:x[j].l,kind:'low'});
   if(x[j].h===high(local))pivots.push({j,p:x[j].h,kind:'high'});
  }
  const lastPivots=pivots.slice(-20),p3=lastPivots.findLast(z=>z.kind===(up?'low':'high'));
  const p2=p3?lastPivots.filter(z=>z.j<p3.j&&z.kind===(up?'high':'low')).at(-1):null;
  const p1=p2?lastPivots.filter(z=>z.j<p2.j&&z.kind===(up?'low':'high')).at(-1):null;
  const valid123=!!p1&&!!p2&&!!p3&&p1.j<p2.j&&p2.j<p3.j&&
   (up?p3.p>p1.p:p3.p<p1.p);
  const lemos123=signal(valid123,valid123&&above(last,up?p2.p+buffer:p2.p-buffer,d),
   p2?(up?p2.p+buffer:p2.p-buffer):null,
   p3?(up?p3.p-buffer:p3.p+buffer):null);
  const k= kst(x);
  const mFast=ema(p,12),mSlow=ema(p,26);
  const diff=p.map((_,j)=>good(mFast[j])&&good(mSlow[j])?mFast[j]-mSlow[j]:null);
  const macSignal=ema(diff.filter(good),9),hist=diff.at(-1)-macSignal.at(-1);
  const prevHist=diff.at(-2)-macSignal.at(-2);
  const pring=signal((up?k.bullish:k.bearish)&&good(hist)&&good(prevHist)&&
   signed(hist-prevHist,d)>0,true,up?last.h+buffer:last.l-buffer,
   up?last.l-buffer:last.h+buffer,{kst:k,histogram:round(hist,5)});
  return {valid:true,direction:d,barCount:x.length,obv,canSlim,pocket,cupHandle,flatBase,
   stormer:{setup91:stormer91,setup92:stormer92,setup93:stormer93,pfr:stormerPFR,trap},
   lemos:{ema921:lemosEMA,reversal123:lemos123},pring,
   disclaimer:'Sinais condicionais; EMA, bases e padrões não certificam retorno. Sem look-ahead.'};
 }
 return Object.freeze({version:'v781.1',analyze,kst,obvEvidence,ema,avg});
});
