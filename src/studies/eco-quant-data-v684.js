/* v684: cálculos quantitativos e consultas apenas no Laboratório (front-end). */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state;
const A=['PETR4','VALE3','IAU','BTC','IVVB11','CDI'],M=['PETR4','VALE3','IAU','BTC','IVVB11','IBOV','USDBRL'];
const Q=S.quant=S.quant||{candles:{},series:{},cdi:[],ts:0,busy:false,error:'',pesos:[20,20,20,20,20,0],ativo:'PETR4',regra:'mm',stop:2,alvo:4,unidade:'%',lado:'ambos',titulos:[],tdTime:'',tdError:'',tdBusy:false,ratePre:'',rateReal:'',titulo:''};
const sum=a=>a.reduce((s,x)=>s+x,0),mean=a=>sum(a)/a.length,num=x=>x==null||x===''?null:Number.isFinite(+x)?+x:null;
function candles(json){
 const map=new Map();
 for(const x of json?.candles||[]){
  if(!Array.isArray(x)||x.length<5||!Number.isFinite(+x[0]))continue;
  const o=+x[1],h=+x[2],l=+x[3],c=+x[4];
  if(![o,h,l,c].every(v=>Number.isFinite(v)&&v>0)||h<l)continue;
  const d=new Date(+x[0]*1000).toISOString().slice(0,10);
  map.set(d,{d,o,h,l,c});
 }
 return [...map.values()].sort((a,b)=>a.d.localeCompare(b.d)).slice(-550);
}
function cdiParse(json){
 if(!Array.isArray(json))throw Error('CDI: resposta BCB inválida.');
 const map=new Map();
 for(const x of json){
  const d=/^(\d\d)\/(\d\d)\/(\d{4})$/.exec(String(x?.data||'')),v=Number(String(x?.valor??'').replace(',','.'));
  if(!d||!Number.isFinite(v)||v< -1||v>3)continue;
  map.set(d[3]+'-'+d[2]+'-'+d[1],v);
 }
 return [...map].sort((a,b)=>a[0].localeCompare(b[0])).map(([d,taxa])=>({d,taxa}));
}
function cdiIndex(arr){
 let p=100;return arr.map(x=>{p*=1+x.taxa/100;return {d:x.d,p};});
}
async function bcb(){
 const end=new Date(),start=new Date(end);start.setMonth(start.getMonth()-26);
 const fmt=d=>String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
 const url='https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial='+encodeURIComponent(fmt(start))+'&dataFinal='+encodeURIComponent(fmt(end));
 const r=await fetch(url,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('CDI SGS 12 HTTP '+r.status);
 const a=cdiParse(await r.json());if(a.length<30)throw Error('CDI sem amostra suficiente.');Q.cdi=a;
}
function prices(){
 const o={...S.series,...Q.series};if(Q.cdi.length)o.CDI=cdiIndex(Q.cdi);return o;
}
async function load(force=false){
 if(Q.busy)return;
 if(!force&&Q.ts&&Date.now()-Q.ts<15*60e3&&Q.cdi.length&&M.every(t=>Q.candles[t]?.length>=21))return;
 Q.busy=true;Q.error='';L.paint();
 try{
  const c=typeof cfg==='function'?cfg():null,session=typeof SESS!=='undefined'?SESS:null;
  if(!c||!session?.at)throw Error('Entre na conta para consultar Candles já integrados.');
  const requests=M.filter(t=>force||!Q.candles[t]?.length).map(async ativo=>{
   const r=await fetch(c.url+'/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+session.at},body:JSON.stringify({ativo,intervalo:'1d'}),signal:AbortSignal.timeout(25000)});
   if(!r.ok)throw Error(ativo+': HTTP '+r.status);
   const a=candles(await r.json());if(a.length<21)throw Error(ativo+': menos de 21 candles.');
   Q.candles[ativo]=a;Q.series[ativo]=a.map(c=>({d:c.d,p:c.c}));S.series[ativo]=Q.series[ativo];
  });
  if(force||!Q.cdi.length)requests.push(bcb());
  const results=await Promise.allSettled(requests);
  Q.error=results.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason)).join(' · ');
  Q.ts=Date.now();
 }catch(e){Q.error=String(e.message||e);}
 finally{Q.busy=false;L.paint();}
}
function join(series,keys,days=252){
 const maps=keys.map(k=>new Map((series[k]||[]).filter(x=>x?.d&&x.p>0).map(x=>[x.d,+x.p])));
 if(maps.some(x=>x.size<30))return [];
 return [...maps[0].keys()].filter(d=>maps.every(m=>m.has(d))).sort().slice(-Math.min(501,days+1)).map(d=>({d,p:maps.map(m=>m.get(d))}));
}
function returns(rows){
 const out=[];
 for(let i=1;i<rows.length;i++){
  const r=rows[i].p.map((v,j)=>v/rows[i-1].p[j]-1);
  if(r.every(Number.isFinite))out.push({d:rows[i].d,r});
 }return out;
}
function stats(a){
 if(a.length<30)return null;
 const n=a[0].r.length,mu=Array.from({length:n},(_,j)=>mean(a.map(x=>x.r[j]))*252);
 const cov=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>sum(a.map(x=>(x.r[i]-mu[i]/252)*(x.r[j]-mu[j]/252)))/(a.length-1)*252));
 return {n:a.length,mu,cov};
}
function simplex(v){
 const a=[...v].sort((x,y)=>y-x);let s=0,tau=0;
 a.forEach((x,i)=>{s+=x;if(x+(1-s)/(i+1)>0)tau=(s-1)/(i+1);});
 return v.map(x=>Math.max(0,x-tau));
}
function portfolio(w,p,rf){
 const ret=sum(w.map((x,i)=>x*p.mu[i])),variance=sum(w.map((x,i)=>x*sum(w.map((y,j)=>y*p.cov[i][j]))));
 const vol=Math.sqrt(Math.max(0,variance));
 return {w,ret,vol,sharpe:vol>1e-10?(ret-rf)/vol:null};
}
function optimize(p,gamma,rf){
 let w=Array(p.mu.length).fill(1/p.mu.length);
 const bound=Math.max(...p.cov.map(a=>sum(a.map(Math.abs))),1e-6),step=1/(2*gamma*bound+Math.max(...p.mu.map(Math.abs),.02));
 for(let k=0;k<1200;k++){
  const g=w.map((_,i)=>p.mu[i]-2*gamma*sum(w.map((v,j)=>p.cov[i][j]*v)));
  const next=simplex(w.map((v,i)=>v+step*g[i]));
  if(sum(next.map((v,i)=>(v-w[i])**2))<1e-15){w=next;break;}
  w=next;
 }
 return portfolio(w,p,rf);
}
function markowitz(series,w=Q.pesos){
 const a=returns(join(series,A,252)),p=stats(a);if(!p)return null;
 const rf=mean(a.map(x=>x.r[5]))*252,total=sum(w.map(x=>Math.max(0,+x||0)));
 const weights=total?w.map(x=>Math.max(0,+x||0)/total):Array(6).fill(1/6);
 const chosen=portfolio(weights,p,rf),min=optimize(p,50000,rf),front=[min];
 for(let i=0;i<42;i++)front.push(optimize(p,Math.pow(10,4-i/9),rf));
 front.sort((a,b)=>a.vol-b.vol);let previous=-Infinity;
 const efficient=front.filter(x=>{if(x.ret>previous+1e-6){previous=x.ret;return true;}return false;});
 const maximum=[...efficient].sort((a,b)=>(b.sharpe??-Infinity)-(a.sharpe??-Infinity))[0]||min;
 return {a,p,rf,chosen,min,maximum,efficient};
}
function rsi(a,n=14){
 const out=Array(a.length).fill(null);if(a.length<=n)return out;
 let g=0,l=0;
 for(let i=1;i<=n;i++){const d=a[i].c-a[i-1].c;g+=Math.max(0,d);l+=Math.max(0,-d);}g/=n;l/=n;
 for(let i=n;i<a.length;i++){
  if(i>n){const d=a[i].c-a[i-1].c;g=(g*(n-1)+Math.max(0,d))/n;l=(l*(n-1)+Math.max(0,-d))/n;}
  out[i]=l===0?100:100-100/(1+g/l);
 }return out;
}
function sma(a,n,i){if(i<n-1)return null;let s=0;for(let j=i-n+1;j<=i;j++)s+=a[j].c;return s/n;}
function backtest(a,o){
 if(!a||a.length<75||!(+o.stop>0&&+o.alvo>0)||!['%','pts'].includes(o.unidade))return null;
 const osc=rsi(a),signals=Array(a.length).fill(0);
 for(let i=51;i<a.length;i++){
  if(o.regra==='mm'){
   const s=sma(a,20,i),l=sma(a,50,i),ps=sma(a,20,i-1),pl=sma(a,50,i-1);
   signals[i]=ps<=pl&&s>l?1:ps>=pl&&s<l?-1:0;
  }else if(o.regra==='rsi')signals[i]=osc[i-1]!=null?(osc[i-1]<=30&&osc[i]>30?1:osc[i-1]>=70&&osc[i]<70?-1:0):0;
  else if(o.regra==='break')signals[i]=a[i].c>a[i-1].h?1:a[i].c<a[i-1].l?-1:0;
 }
 let capital=10000,position=null,peak=capital,dd=0;const trades=[],curve=[{d:a[0].d,v:capital}];
 for(let i=52;i<a.length;i++){
  const x=a[i],sig=signals[i-1];
  if(!position&&sig&&(o.lado==='ambos'||sig===(o.lado==='long'?1:-1))){
   const d=o.unidade==='%'?x.o*o.stop/100:+o.stop,t=o.unidade==='%'?x.o*o.alvo/100:+o.alvo;
   if(d>0&&t>0&&d<x.o)position={side:sig,entry:x.o,day:x.d,stop:x.o-sig*d,target:x.o+sig*t};
  }
  if(position){
   const p=position,st=p.side>0?x.l<=p.stop:x.h>=p.stop,tg=p.side>0?x.h>=p.target:x.l<=p.target;
   const exit=st?p.stop:tg?p.target:i===a.length-1?x.c:null;
   if(exit!==null){const ret=p.side*(exit-p.entry)/p.entry;capital=Math.max(0,capital*(1+ret));trades.push({start:p.day,end:x.d,side:p.side,ret,entry:p.entry,exit});position=null;}
  }
  const marked=position?Math.max(0,capital*(1+position.side*(x.c-position.entry)/position.entry)):capital;
  peak=Math.max(peak,marked);dd=Math.max(dd,peak?(peak-marked)/peak:0);curve.push({d:x.d,v:marked});
 }
 const gain=sum(trades.filter(t=>t.ret>0).map(t=>t.ret)),loss=-sum(trades.filter(t=>t.ret<0).map(t=>t.ret));
 return {trades,curve,capital,drawdown:dd*100,win:trades.length?100*trades.filter(t=>t.ret>0).length/trades.length:null,pf:loss>0?gain/loss:gain>0?Infinity:null};
}
function tdParse(j){
 return (j?.response?.TrsrBdTradgList||[]).map(x=>x.TrsrBd||x).filter(x=>/Tesouro (IPCA|Prefixado)/i.test(x?.nm||''))
 .map(x=>({name:String(x.nm),maturity:String(x.mtrtyDt||'').slice(0,10),rate:num(x.anulInvstmtRate),type:/IPCA/i.test(x.nm)?'real':'pre'}))
 .filter(x=>x.rate!=null&&x.rate>-10&&x.rate<55&&/^\d{4}-/.test(x.maturity));
}
async function tesouro(){
 if(Q.tdBusy)return;Q.tdBusy=true;Q.tdError='';L.paint();
 try{
  const r=await fetch('https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json',{signal:AbortSignal.timeout(14000)});
  if(!r.ok)throw Error('HTTP '+r.status);const a=tdParse(await r.json());
  if(!a.length)throw Error('Título sem taxa válida.');Q.titulos=a;Q.tdTime=new Date().toISOString();
 }catch(e){Q.tdError='Consulta Tesouro indisponível no navegador (possível CORS): '+String(e.message||e).slice(0,100);}
 finally{Q.tdBusy=false;L.paint();}
}
function usdIndex(series){return join(series,['IBOV','USDBRL'],500).map(x=>({d:x.d,p:x.p[0]/x.p[1]})).filter(x=>Number.isFinite(x.p)&&x.p>0);}
const inflation=(pre,real)=>({approx:pre-real,exact:((1+pre/100)/(1+real/100)-1)*100});
L.quant={A,M,Q,num,load,prices,candles,cdiParse,cdiIndex,join,returns,stats,simplex,markowitz,backtest,rsi,tdParse,tesouro,usdIndex,inflation};
})();
