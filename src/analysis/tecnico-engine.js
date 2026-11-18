/* Motor quant técnico v762 — OHLCV validado, sem rede, sem credenciais e sem timers. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioTecnicoEngine=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const VERSION='tecnico-774.1';
 const FIB_RET=[0,.236,.382,.5,.618,.764,1],FIB_EXT=[1.11,1.272,1.414,1.618];
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const mean=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
 const round=(v,n=4)=>Number.isFinite(v)?Number(v.toFixed(n)):null;
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 function normalize(input){
  if(!Array.isArray(input))return [];
  const seen=new Map();
  for(const c of input.slice(-5000)){
   const row=Array.isArray(c)?{t:c[0],o:c[1],h:c[2],l:c[3],c:c[4],v:c[5]}:c;
   if(!row)continue;
   let t=Number(row.t??row.time??row.timestamp),o=Number(row.o??row.open),h=Number(row.h??row.high),l=Number(row.l??row.low),p=Number(row.c??row.close),v=Number(row.v??row.volume);
   if(t<1e11)t*=1000;
   if(![t,o,h,l,p,v].every(valid)||t<=0||o<=0||p<=0||h<Math.max(o,p,l)||l<=0||l>Math.min(o,p,h)||v<0)continue;
   seen.set(t,{t,o,h,l,c:p,v});
  }
  return [...seen.values()].sort((a,b)=>a.t-b.t).slice(-1500);
 }
 function sma(c,n,i=c.length-1,k='c'){if(i+1<n)return null;let sum=0;for(let j=i-n+1;j<=i;j++)sum+=c[j][k];return sum/n}
 function ema(values,n){let value=null,k=2/(n+1);return values.map((x,i)=>{if(!valid(x))return null;if(i===n-1)value=mean(values.slice(0,n));else if(i>=n&&value!==null)value=x*k+value*(1-k);return value})}
 function atr(c,n=14){if(c.length<n+1)return null;const a=c.slice(1).map((v,i)=>Math.max(v.h-v.l,Math.abs(v.h-c[i].c),Math.abs(v.l-c[i].c)));return mean(a.slice(-n))}
 function rsi(c,n=14){if(c.length<n+1)return null;const d=c.slice(1).map((v,i)=>v.c-c[i].c),g=mean(d.slice(0,n).map(v=>Math.max(0,v))),l=mean(d.slice(0,n).map(v=>Math.max(0,-v)));let ag=g,al=l;for(let i=n;i<d.length;i++){ag=(ag*(n-1)+Math.max(0,d[i]))/n;al=(al*(n-1)+Math.max(0,-d[i]))/n}return ag===0&&al===0?50:al===0?100:100-100/(1+ag/al)}
 function macd(c){if(c.length<35)return null;const v=c.map(x=>x.c),a=ema(v,12),b=ema(v,26),diff=v.map((_,i)=>a[i]===null||b[i]===null?null:a[i]-b[i]);const signal=ema(diff.filter(valid),9);const sig=signal.at(-1);return sig===null?null:{value:diff.at(-1),signal:sig,hist:diff.at(-1)-sig}}
 function obv(c){let n=0;const out=[0];for(let i=1;i<c.length;i++){if(c[i].c>c[i-1].c)n+=c[i].v;else if(c[i].c<c[i-1].c)n-=c[i].v;out.push(n)}return out}
 function std(v){if(v.length<2)return null;const m=mean(v);return Math.sqrt(mean(v.map(x=>(x-m)**2)))}
 function hvWeek(c,tf){const perWeek=tf==='15m'?130:tf==='1h'?33:5;const sample=c.slice(-Math.max(20,perWeek*3));if(sample.length<Math.min(20,perWeek*2))return null;const rets=sample.slice(1).map((x,i)=>Math.log(x.c/sample[i].c));return std(rets)*Math.sqrt(perWeek)*100}
 function pivot(c,i,d){if(i<2||i>c.length-3)return false;const k=d>0?'h':'l',val=c[i][k];return d>0?[i-2,i-1,i+1,i+2].every(j=>val>c[j][k]):[i-2,i-1,i+1,i+2].every(j=>val<c[j][k])}
 function swings(c){const s=[];for(let i=2;i<c.length-2;i++){if(pivot(c,i,1))s.push({i,p:c[i].h,d:1});if(pivot(c,i,-1))s.push({i,p:c[i].l,d:-1})}s.sort((a,b)=>a.i-b.i);const out=[];for(const x of s){const last=out.at(-1);if(last?.d===x.d){if((x.d===1&&x.p>last.p)||(x.d===-1&&x.p<last.p))out[out.length-1]=x}else out.push(x)}return out}
 function fibogaps(c,dir){
  // Gap não preenchido: considera somente barras observadas e um limiar superior a ruído de spread.
  const threshold=Math.max((atr(c)||0)*.5,c.at(-1).c*.004),result=[];
  for(let i=Math.max(1,c.length-100);i<c.length;i++){
   const prev=c[i-1],cur=c[i],up=cur.l-prev.h,down=prev.l-cur.h;
   if(dir===1&&up>threshold){
    const low=prev.h,high=cur.l,filled=c.slice(i+1).some(x=>x.l<=low);
    if(!filled)result.push({low:round(low),high:round(high),age:c.length-1-i});
   }else if(dir===-1&&down>threshold){
    const low=cur.h,high=prev.l,filled=c.slice(i+1).some(x=>x.h>=high);
    if(!filled)result.push({low:round(low),high:round(high),age:c.length-1-i});
   }
  }
  return result.slice(-12);
 }
 function fibo(c,dir,sw){
  const last=c.at(-1),segments=[120,40].map(window=>{
   const selected=sw.filter(x=>x.i>=c.length-window);
   let a=null,b=null;
   for(let j=selected.length-1;j>=1;j--){
    const x=selected[j-1],y=selected[j];
    if(dir===1&&x.d===-1&&y.d===1&&y.p>x.p){a=x;b=y;break}
    if(dir===-1&&x.d===1&&y.d===-1&&y.p<x.p){a=x;b=y;break}
   }
   if(!a||!b)return null;
   const length=Math.abs(b.p-a.p);
   return {from:a.p,to:b.p,age:c.length-1-b.i,length,ret:FIB_RET.map(r=>({r,price:b.p-dir*length*r})),ext:FIB_EXT.map(r=>({r,price:a.p+dir*length*r}))};
  });
  const macro=segments[0]||segments[1],micro=segments[1]||segments[0];
  if(!macro)return {zone:false,cluster:false,segments,levels:[],exhausted:false};
  const price=last.c,min=Math.min(macro.to-dir*macro.length*.236,macro.to-dir*macro.length*.764),max=Math.max(macro.to-dir*macro.length*.236,macro.to-dir*macro.length*.764);
  const gaps=fibogaps(c,dir),relevantGap=gaps.slice().reverse().find(x=>x.low<=max&&x.high>=min)||null;
  const gapZone=relevantGap?[round(Math.max(min,relevantGap.low)),round(Math.min(max,relevantGap.high))]:null;
  const zone=price>=min&&price<=max;
  const levels=macro.ret.concat(macro.ext);
  const clusters=[];
  if(micro&&macro!==micro&&(macro.from!==micro.from||macro.to!==micro.to||macro.age!==micro.age))for(const x of macro.ret.concat(macro.ext))for(const y of micro.ret.concat(micro.ext)){
   if(Math.abs(x.price-y.price)/Math.max(.01,Math.abs(x.price))<=.01)clusters.push(round((x.price+y.price)/2));
  }
  const expansion=(price-macro.from)*dir/macro.length;
  return {zone,cluster:clusters.length>0,clusters:[...new Set(clusters)],fibogap:relevantGap!==null,gapZone,segments,levels,expansion:round(expansion,3),
   exhausted:expansion>=1.414&&expansion<=1.618,defense:[min,max],files:[round(macro.to-dir*macro.length*.618),round(macro.to-dir*macro.length*.764)]};
 }
 function turn4(c,dir,zone){
  if(c.length<8)return {armed:false,confirmed:false,cisd:false};
  // Candidato central + duas barras posteriores: nenhum pivô futuro é presumido.
  const i=c.length-3,ref=c[i],left=c[i-1],right=c[i+1],last=c.at(-1);
  const local=dir===1?ref.l<left.l&&ref.l<=right.l:ref.h>left.h&&ref.h>=right.h;
  const reference=dir===1?Math.max(ref.h,right.h):Math.min(ref.l,right.l);
  const confirmed=local&&zone&&(dir===1?last.c>reference:last.c<reference);
  const previous=c.slice(-9,-3),internal=dir===1?Math.max(...previous.map(x=>x.h)):Math.min(...previous.map(x=>x.l));
  return {armed:!!(local&&zone),confirmed,cisd:confirmed&&(dir===1?last.c>internal:last.c<internal),reference:round(reference)};
 }
 function elliott(sw,dir){
  // Contagem conservadora: hipótese, nunca conclusão de ciclo certo.
  const s=sw.filter(x=>x.d===dir||x.d===-dir).slice(-9);
  if(s.length>=4){
   const q=s.slice(-4),p=q.map(x=>x.p),d=q.map(x=>x.d);
   const abc=dir===1?
    d[0]===1&&d[1]===-1&&d[2]===1&&d[3]===-1&&p[2]<p[0]&&p[3]<p[1]:
    d[0]===-1&&d[1]===1&&d[2]===-1&&d[3]===1&&p[2]>p[0]&&p[3]>p[1];
   if(abc)return {label:'Possível correção A-B-C',valid:false,correction:true,reason:'Três movimentos corretivos alternados; rompimento ainda exige confirmação'};
  }
  if(s.length<6)return {label:'Indeterminada',valid:false,reason:'Pivôs insuficientes'};
  const a=s.slice(-6);if(a.some((p,i)=>i>0&&p.d===a[i-1].d))return {label:'Indeterminada',valid:false,reason:'Alternância ausente'};
  const p=a.map(x=>x.p),sign=dir,one=Math.abs(p[1]-p[0]),three=Math.abs(p[3]-p[2]),five=Math.abs(p[5]-p[4]);
  const rule2=(p[2]-p[0])*sign>0,rule3=three>=Math.min(one,five),rule4=(p[4]-p[1])*sign>0;
  return rule2&&rule3&&rule4?{label:'Possível impulso 1-2-3-4-5',valid:true,reason:'Regras clássicas mínimas verificadas; contagem alternativa possível'}:{label:'Contagem invalidada',valid:false,reason:'Onda 2, onda 3 ou sobreposição da onda 4'};
 }
 function vcp(c){if(c.length<60)return false;const blocks=[c.slice(-60,-40),c.slice(-40,-20),c.slice(-20)];const widths=blocks.map(x=>(Math.max(...x.map(v=>v.h))-Math.min(...x.map(v=>v.l)))/Math.max(.01,mean(x.map(v=>v.c))));const vols=blocks.map(x=>mean(x.map(v=>v.v)));return widths[0]>widths[1]&&widths[1]>widths[2]&&vols[0]>vols[1]&&vols[1]>vols[2]}
 function boll(c){if(c.length<60)return {squeeze:false,breakout:false};const band=n=>{const closes=c.slice(-n).map(x=>x.c);return std(closes)/mean(closes)};const recent=band(20),prev=std(c.slice(-60,-40).map(x=>x.c))/mean(c.slice(-60,-40).map(x=>x.c));return {squeeze:recent<prev*.65,breakout:recent<prev*.65&&Math.abs(c.at(-1).c-sma(c,20))>std(c.slice(-20).map(x=>x.c))*2}}
 function aggregateWeekly(daily){
  const buckets=new Map();
  for(const x of normalize(daily)){const dt=new Date(x.t),day=dt.getUTCDay(),date=new Date(x.t-(day+6)%7*86400000).toISOString().slice(0,10);const prev=buckets.get(date);if(!prev)buckets.set(date,{...x});else{prev.h=Math.max(prev.h,x.h);prev.l=Math.min(prev.l,x.l);prev.c=x.c;prev.t=x.t;prev.v+=x.v}}
  return [...buckets.values()];
 }
 function passTemplate(c,dir,rs,vcpPass){
  if(c.length<252)return {score:null,checks:[],missing:['Histórico de 252 barras diárias']};
  const p=c.at(-1).c,s50=sma(c,50),s150=sma(c,150),s200=sma(c,200),old=sma(c,200,c.length-21),hi=Math.max(...c.slice(-252).map(x=>x.h)),lo=Math.min(...c.slice(-252).map(x=>x.l));
  const checks=dir===1?[p>s50,s50>s150,s150>s200,p>s200,s200>old,p>=lo*1.3,p>=hi*.75,rs!==null&&rs>=70]:
    [p<s50,s50<s150,s150<s200,p<s200,s200<old,p<=hi/1.3,p<=lo*1.25,rs!==null&&rs<=30];
  return {score:checks.filter(Boolean).length,checks,missing:rs===null?['RS Rating cross-sectional não validado']:[],
   vcpConfirmado:vcpPass===true,nota:'Trend Template 8/8 independente do VCP; RS é percentil proxy do universo fixo'};
 }
 // Cenário de custos exclusivamente ilustrativo. Sem book/Profit, NÃO é spread executável.
 // Valores por ida+volta em bps; não simula impostos nem impacto real.
 function costScenario(market){
  const m=String(market||'').toUpperCase();
  const fees=m==='BR'?8:m==='US'?2:m==='CRYPTO'?20:null;
  if(fees===null)return null;
  const spread=m==='BR'?10:m==='US'?8:10,slippage=m==='BR'?12:m==='US'?12:20;
  return {market:m,feesBps:fees,spreadBps:spread,slippageBps:slippage,
   roundTripBps:fees+spread+slippage,verified:false,
   label:'Estimativa de cenário, não spread/book observado; sem tributos ou impacto de mercado'};
 }
 function riskNet(plan,dir,market){
  const fees=costScenario(market),p=plan||{},entry=p.entry,stop=p.stop,target=p.target2a;
  if(!fees||![entry,stop,target].every(x=>Number.isFinite(x)&&x>0)||![-1,1].includes(dir))return null;
  const grossRisk=(entry-stop)*dir,grossReward=(target-entry)*dir;
  if(grossRisk<=0||grossReward<=0)return null;
  const cost=entry*fees.roundTripBps/10000;
  const netRisk=grossRisk+cost,netReward=grossReward-cost;
  return {...fees,costPerUnit:round(cost,5),netRisk:round(netRisk,5),
   netReward:round(netReward,5),rrNet:netReward>0?round(netReward/netRisk,2):null};
 }
 function walkForward(raw,opts={}){
  const c=normalize(raw).slice(-800),market=String(opts.market||'').toUpperCase(),
   tf=String(opts.tf||'1d'),costs=costScenario(market),hold=10;
  const setups=['pisani','minervini','fibonaccing','elliott'];
  const empty=(reason)=>Object.fromEntries(setups.map(k=>[k,{status:'não comprovado',trades:0,
    winRate:null,payoff:null,expectancyR:null,reason}]));
  if(!costs)return {method:'walk-forward-next-open-v1',bars:c.length,setups:empty('Mercado sem custo estimado'),costs:null};
  if(c.length<263)return {method:'walk-forward-next-open-v1',bars:c.length,
   setups:empty('Exige 252 barras de aquecimento e 11 barras posteriores; 250 isoladas não bastam'),costs};
  // A janela histórica de decisão ocupa no máximo os 250 candles finais; nunca usa candles futuros no indicador.
  const start=Math.max(251,c.length-250),last=c.length-hold-1;
  const trades=Object.fromEntries(setups.map(x=>[x,[]])),lastExit=Object.fromEntries(setups.map(x=>[x,-1]));
  const rsHistory=opts.rsHistory&&typeof opts.rsHistory==='object'?opts.rsHistory:{};
  for(let i=start;i<=last;i++){
   const past=c.slice(0,i+1);
   const historicRs=Number.isInteger(rsHistory[c[i].t])?rsHistory[c[i].t]:null;
   const weekly=aggregateWeekly(past);
   const both=examine(past,{tf,daily:past,higher:weekly,rs:historicRs,market});
   for(const [dir,x] of [[1,both.buy],[-1,both.sell]]){
    if(!x.valid||!x.plan)continue;
    const signals={
     pisani:!!(x.pisani?.breakout&&x.metrics?.obvConfirmed&&x.pisani?.pullback),
     minervini:historicRs!==null&&x.minervini?.score===8&&x.vcp===true,
     fibonaccing:!!(x.turn?.confirmed&&x.turn?.cisd&&x.fib?.zone),
     elliott:!!(x.elliott?.valid&&x.metrics?.obvConfirmed)
    };
    for(const key of setups){
     if(!signals[key]||i<=lastExit[key])continue;
     const stop=x.plan.stop,target=x.plan.target2a,entry=c[i+1].o;
     if(![stop,target,entry].every(z=>Number.isFinite(z)&&z>0)||
       (entry-stop)*dir<=0||(target-entry)*dir<=0)continue;
     let exitPrice=null,exitIndex=null,trigger='prazo';
     for(let j=i+1;j<=i+hold;j++){
      const q=c[j];
      // Stop primeiro: em barra que alcança stop e alvo, considerar sempre o pior caso.
      if((q.o-stop)*dir<=0){exitPrice=q.o;exitIndex=j;trigger='gap stop';break}
      const stopHit=dir===1?q.l<=stop:q.h>=stop;
      const targetHit=dir===1?q.h>=target:q.l<=target;
      if(stopHit){exitPrice=stop;exitIndex=j;trigger='stop';break}
      if(targetHit){exitPrice=target;exitIndex=j;trigger='alvo';break}
     }
     if(exitPrice===null){exitIndex=i+hold;exitPrice=c[exitIndex].c}
     const cost=entry*costs.roundTripBps/10000,
      risk=(entry-stop)*dir+cost,pnl=(exitPrice-entry)*dir-cost;
     if(risk<=0)continue;
     trades[key].push({t:c[i].t,entryBar:c[i+1].t,exitBar:c[exitIndex].t,
      direction:dir,r:round(pnl/risk,5),trigger});
     lastExit[key]=exitIndex;
    }
   }
  }
  // Walk-forward fora da amostra: metade final das decisões, stop-first e custos ilustrativos.
  // 5 trades não constituem amostra robusta. Exigir 30 trades totais + 10 posteriores à divisão.
  const splitTimestamp=c[Math.floor((start+last)/2)]?.t||null;
  const wilson=(wins,n)=>{
   if(n<30)return null;
   const z=1.96,p=wins/n,den=1+z*z/n,center=(p+z*z/(2*n))/den,
    error=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
   return {lower:round(Math.max(0,(center-error)*100),2),upper:round(Math.min(100,(center+error)*100),2)};
  };
  const stats={};
  for(const key of setups){
   const a=trades[key],n=a.length,wins=a.filter(x=>x.r>0),losses=a.filter(x=>x.r<0);
   const holdout=splitTimestamp?a.filter(x=>x.t>=splitTimestamp):[];
   const holdoutWins=holdout.filter(x=>x.r>0).length;
   const meanWin=wins.length?mean(wins.map(x=>x.r)):null;
   const meanLoss=losses.length?Math.abs(mean(losses.map(x=>x.r))):null;
   const enough=n>=30&&holdout.length>=10,verified=opts.adjustedVerified===true;
   stats[key]={status:!enough?'amostra insuficiente':verified?'exploratório (custos não verificados)':'ajuste corporativo não comprovado',
    trades:n,winRate:enough?round(wins.length/n*100,2):null,
    payoff:enough&&meanWin!==null&&meanLoss>0?round(meanWin/meanLoss,3):null,
    expectancyR:enough?round(mean(a.map(x=>x.r)),4):null,
    confidence95:enough?wilson(wins.length,n):null,
    outOfSample:{trades:holdout.length,winRate:holdout.length>=10?round(holdoutWins/holdout.length*100,2):null,
     expectancyR:holdout.length>=10?round(mean(holdout.map(x=>x.r)),4):null},
    reason:key==='minervini'&&!Object.keys(rsHistory).length?'RS histórico ausente; não reutilizar RS atual (look-ahead)':
     !enough?'Exigir ao menos 30 trades e 10 fora da amostra':
      !verified?'Histórico sem ajuste corporativo certificado; não homologar':'Resultados exploratórios; custos ainda estimados'};
  }
  return {method:'walk-forward-next-open-v1',statsModel:'validation-v774',bars:c.length,
   historyDecisions:Math.max(0,last-start+1),sampleSplitAt:splitTimestamp,
   costs,holdBars:hold,setups:stats};
 }
 function one(c0,dir=1,opts={}){
  const c=normalize(c0),last=c.at(-1);
  if(!last||c.length<210||c.filter(x=>x.v>0).length<100)return {valid:false,score:null,reason:'Histórico OHLCV insuficiente (mín. 210 barras, 100 com volume)'};
  const p=last.c,s20=sma(c,20),s50=sma(c,50),s150=sma(c,150),s200=sma(c,200),v20=sma(c,20,c.length-2,'v'),rvol=v20?last.v/v20:null,atr14=atr(c),rsi14=rsi(c),m=macd(c),vol=hvWeek(c,opts.tf||'1d'),o=obv(c);
  const prior=o.slice(-26,-1),obvHit=dir===1?o.at(-1)>Math.max(...prior):o.at(-1)<Math.min(...prior);
  const earlier=o.slice(-8,-1).some((x,j,arr)=>j>0&&(dir===1?x>Math.max(...o.slice(Math.max(0,o.length-27+j),o.length-8+j)):x<Math.min(...o.slice(Math.max(0,o.length-27+j),o.length-8+j))));
  const obvConfirmed=obvHit||earlier,sw=swings(c),fib=fibo(c,dir,sw),turn=turn4(c,dir,fib.zone),vcpPass=vcp(c);
  const high=opts.higher?normalize(opts.higher):null,mtfn=opts.tf==='1d'?20:200,mtf=high?.length>=mtfn?dir*(high.at(-1).c-sma(high,mtfn))>0:null;
  const recent=c.slice(-9,-1),pullback=recent.length>0&&recent.some((x,j)=>{const avg=sma(c,20,c.length-9+j);return Math.abs(x.l-avg)<atr14*1.2||Math.abs(x.h-avg)<atr14*1.2})&&recent.every((x,j)=>{const avg=sma(c,20,c.length-9+j);return dir===1?x.c>=avg:x.c<=avg});
  const pivot=dir===1?Math.max(...recent.map(x=>x.h)):Math.min(...recent.map(x=>x.l));
  const breakout=dir===1?p>pivot:p<pivot,trend=dir===1?p>s20&&p>s200:p<s20&&p<s200;
  const dry=mean(recent.slice(-5).map(x=>x.v))<v20*.85;
  const away=Math.abs(p-s20)/atr14,stretched=away>2.5&&!vcpPass;
  const trap=fib.exhausted?'Esticado':stretched?'Esticado':rvol<=1?'Sem Volume':!obvConfirmed?'OBV Não Confirmou':null;
  const rs=Number.isInteger(opts.rs)?opts.rs:null,template=passTemplate(opts.daily?normalize(opts.daily):c,dir,rs,vcpPass);
  const momentum=(dir===1?rsi14>52:rsi14<48)&&dir*m.hist>0;
  const pillars=[
   {id:'tendencia',name:'Tendência & Estrutura',weight:30,score:mean([trend?1:0,dir*(s50-s150)>0&&dir*(s150-s200)>0?1:0,pullback?1:0,mtf===null?0:mtf?1:0])},
   {id:'momentum',name:'Momentum / OBV / Força Relativa',weight:30,score:mean([obvConfirmed?1:0,rs===null?0:dir===1?rs/99:(99-rs)/99,momentum?1:0,dir*m.value>dir*m.signal?1:0])},
   {id:'volume',name:'Volume & Fluxo',weight:20,score:mean([rvol>1?1:0,dry?1:0])},
   {id:'fibo',name:'Fibonaccing / Volatilidade / Risco',weight:20,score:mean([fib.zone?1:0,fib.cluster?1:0,turn.confirmed&&turn.cisd?1:0,vol>3?1:0])}
  ];
  const score=round(pillars.reduce((a,x)=>a+x.score*x.weight/10,0),1);
  const entry=turn.confirmed&&turn.reference?turn.reference:pivot,riskBase=Math.max(atr14*.9,p*.005),st=dir===1?Math.min(p-riskBase,s20-atr14*.4,fib.defense?.[0]??p-riskBase):Math.max(p+riskBase,s20+atr14*.4,fib.defense?.[1]??p+riskBase);
  const stop=st>0?st:null,risk=stop===null?null:(entry-stop)*dir,
   segments=fib.segments[0]||fib.segments[1],ext=segments?.ext||[],target=r=>ext.find(x=>x.r===r)?.price??null;
  const future=r=>{const p=target(r);return Number.isFinite(p)&&p>0&&(p-entry)*dir>0?p:null};
  const t1=future(1.11),t2a=future(1.272),t2=future(1.414),t3=future(1.618),rr=risk>0&&t2a!==null?(t2a-entry)*dir/risk:null,rrAlvo3=risk>0&&t2!==null?(t2-entry)*dir/risk:null;
  const net=riskNet({entry,stop,target2a:t2a},dir,opts.market);
  const active=trend&&breakout&&obvConfirmed&&rvol>1&&vol>3&&stop!==null;
  const bollinger=boll(c);
  return {valid:true,dir,price:round(p),score,pillars,coverage:round((rs!==null?1:0)+(mtf!==null?1:0)+(template.score!==null?1:0),0),
   timestamp:last.t,barCount:c.length,metrics:{sma20:round(s20),sma50:round(s50),sma150:round(s150),sma200:round(s200),obv:round(o.at(-1),0),obvConfirmed,rvol:round(rvol,2),hvWeek:round(vol,2),rsi14:round(rsi14,1),macd:round(m.value),atr14:round(atr14),rs,mtf},
   fib,turn,pisani:{breakout:active,power:active&&rvol>=1.5&&turn.cisd,away:away>=2.5,pullback},minervini:template,vcp:vcpPass,elliott:elliott(sw,dir),bollinger:{...bollinger,breakout:bollinger.breakout&&rvol>1.5},
   flags:trap?[trap]:[],eligible:active&&!trap&&mtf!==false,
   plan:{entry:round(entry),stop:round(stop),target1:round(t1),target2a:round(t2a),target2:round(t2),targetFinal:round(t3),
    rr:round(rr,2),rrAlvo3:round(rrAlvo3,2),rrNet:net?.rrNet??null,
    costEstimateBps:net?.roundTripBps??null,costsVerified:false}};
 }
 function examine(c,opts={}){return {buy:one(c,1,opts),sell:one(c,-1,opts)}}
 return Object.freeze({VERSION,normalize,sma,ema,atr,rsi,macd,obv,hvWeek,swings,fibo,turn4,elliott,vcp,boll,aggregateWeekly,passTemplate,one,examine,costScenario,riskNet,walkForward});
});
