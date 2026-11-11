import "jsr:@supabase/functions-js/edge-runtime.d.ts";
type P={d:string,v:number};
type Stat={n:number,media:number|null,mediana:number|null,positivas:number|null,absmedia:number|null,desvio:number|null,melhor:number|null,pior:number|null};
const SYMBOLS:Record<string,string>={spx:"^GSPC",ndx:"^NDX",dji:"^DJI",rut:"^RUT"};
const EXTRA:Record<string,string>={vix:"^VIX",dxy:"DX-Y.NYB",us10y:"^TNX",ibov:"^BVSP",dolar:"BRL=X"};
const dates:Record<string,string[]>={
 cpi:["2026-01-13","2026-02-13","2026-03-11","2026-04-10","2026-05-12","2026-06-10","2026-07-14","2026-08-12","2026-09-11","2026-10-14","2026-11-10","2026-12-10"],
 payroll:["2026-01-09","2026-02-11","2026-03-06","2026-04-03","2026-05-08","2026-06-05","2026-07-02","2026-08-07","2026-09-04","2026-10-02","2026-11-06","2026-12-04"],
 fomc:["2024-01-31","2024-03-20","2024-05-01","2024-06-12","2024-07-31","2024-09-18","2024-11-07","2024-12-18","2025-01-29","2025-03-19","2025-05-07","2025-06-18","2025-07-30","2025-09-17","2025-10-29","2025-12-10","2026-01-28","2026-03-18","2026-04-29","2026-06-17","2026-07-29","2026-09-16","2026-10-28","2026-12-09"]
};
const round=(x:number)=>Math.round(x*10000)/10000;
const daydiff=(a:string,b:string)=>(Date.parse(b)-Date.parse(a))/86400000;
function stats(arr:number[]):Stat {
 const x=arr.filter(Number.isFinite).sort((a,b)=>a-b),n=x.length;
 if(!n)return {n:0,media:null,mediana:null,positivas:null,absmedia:null,desvio:null,melhor:null,pior:null};
 const avg=x.reduce((a,b)=>a+b,0)/n;
 return {n,media:round(avg),mediana:round(n%2?x[(n-1)/2]:(x[n/2-1]+x[n/2])/2),positivas:round(100*x.filter(v=>v>0).length/n),
 absmedia:round(x.reduce((a,b)=>a+Math.abs(b),0)/n),desvio:n>1?round(Math.sqrt(x.reduce((a,b)=>a+(b-avg)**2,0)/(n-1))):null,melhor:round(x[n-1]),pior:round(x[0])};
}
const cache=new Map<string,{at:number,data:P[]}>();
async function history(symbol:string):Promise<P[]> {
 const c=cache.get(symbol);if(c&&Date.now()-c.at<6*3600000)return c.data;
 let last="";
 for(const host of ["query1","query2"]){
  try{
   const u="https://"+host+".finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?period1=946684800&period2="+Math.floor(Date.now()/1000)+"&interval=1d";
   const r=await fetch(u,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"},signal:AbortSignal.timeout(14000)});
   if(!r.ok)throw new Error("Yahoo HTTP "+r.status);
   const j=await r.json(),v=j?.chart?.result?.[0],ts:number[]=v?.timestamp||[];
   const px:(number|null)[]=v?.indicators?.adjclose?.[0]?.adjclose||v?.indicators?.quote?.[0]?.close||[];
   const form=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
   const data:P[]=ts.map((t,i)=>({d:form.format(new Date(t*1000)),v:Number(px[i])})).filter(p=>p.d&&p.v>0&&Number.isFinite(p.v)).sort((a,b)=>a.d.localeCompare(b.d));
   const unique:P[]=[];for(const p of data){if(unique.at(-1)?.d===p.d)unique[unique.length-1]=p;else unique.push(p)}
   if(unique.length<1000)throw new Error("Histórico insuficiente ("+symbol+")");
   cache.set(symbol,{at:Date.now(),data:unique});return unique;
  }catch(e){last=String(e)}
 }
 throw new Error(last||"Histórico indisponível");
}
function safeRet(a:P,b:P){return a.v>0?round((b.v/a.v-1)*100):NaN}
function weekly(points:P[],today:string){
 const months=new Map<string,P[]>();for(const p of points){const k=p.d.slice(0,7);(months.get(k)||months.set(k,[]).get(k)!).push(p)}
 const keys=[...months.keys()].sort(),groups:Record<string,number[]>={primeiros5:[],ultimos5:[],virada:[],opex:[],sem1:[],sem2:[],sem3:[],sem4:[]};
 for(const month of keys){
  if(month>=today.slice(0,7))continue;
  const idx=keys.indexOf(month),all=months.get(month)!;if(all.length<15||idx===0)continue;
  const prev=months.get(keys[idx-1])!,base=prev.at(-1)!;
  if(daydiff(base.d,all[0].d)>6)continue;
  groups.primeiros5.push(safeRet(base,all[4]));
  groups.ultimos5.push(safeRet(all[all.length-6],all.at(-1)!));
  groups.virada.push(safeRet(base,all[2]));
  for(let w=0;w<4;w++){const i=w*5,j=Math.min(i+4,all.length-1),a=i===0?base:all[i-1];if(j>i&&a)groups["sem"+(w+1)].push(safeRet(a,all[j]))}
  const [y,m]=month.split("-").map(Number);
  const first=new Date(Date.UTC(y,m-1,1));
  const thirdFriday=1+(5-first.getUTCDay()+7)%7+14;
  const target=month+"-"+String(thirdFriday).padStart(2,"0");
  const pos=all.findLastIndex(p=>p.d<=target);
  if(pos>=5&&daydiff(all[pos].d,target)<=3)groups.opex.push(safeRet(all[pos-5],all[pos]));
 }
 return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,stats(v)]));
}
function eventStudy(points:P[],today:string){
 const index=new Map(points.map((p,i)=>[p.d,i]));
 const windows:Record<string,[number,number]>={antes:[-5,-1],dia:[-1,0],depois:[0,1],semana:[0,5],total:[-1,5]};
 const result:Record<string,any>={};
 for(const [type,events] of Object.entries(dates)){
  const groups:Record<string,number[]>={antes:[],dia:[],depois:[],semana:[],total:[]};
  for(const date of events){
   if(date>=today)continue;
   const anchor=index.get(date);if(anchor===undefined)continue;
   for(const [key,[offA,offB]] of Object.entries(windows)){
    const a=anchor+offA,b=anchor+offB;if(a<0||b>=points.length)continue;
    let valid=true;for(let t=a+1;t<=b;t++)if(daydiff(points[t-1].d,points[t].d)>6)valid=false;
    if(valid)groups[key].push(safeRet(points[a],points[b]));
   }
  }
  result[type]={janelas:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,stats(v)])),datas_anteriores:events.filter(d=>d<today).length};
 }
 return result;
}
function conditional(points:P[],extras:Record<string,P[]>,today:string){
 const map:Record<string,Map<string,number>>={};
 for(const [k,arr] of Object.entries(extras))map[k]=new Map(arr.map(p=>[p.d,p.v]));
 const months=new Map<string,P[]>();for(const p of points)(months.get(p.d.slice(0,7))||months.set(p.d.slice(0,7),[]).get(p.d.slice(0,7))!).push(p);
 const keys=[...months.keys()].sort(), groups:Record<string,number[]>={vix_baixo:[],vix_alto:[],dxy_sobe:[],dxy_cai:[],juros_sobem:[],juros_caem:[]};
 const align=(arr:P[],d:string)=>{for(let i=arr.length-1;i>=0;i--)if(arr[i].d<=d&&daydiff(arr[i].d,d)<=7)return i;return -1};
 for(let n=1;n<keys.length;n++){
  const month=keys[n];if(month>=today.slice(0,7))continue;
  const cur=months.get(month)!;if(cur.length<15)continue;
  const prev=months.get(keys[n-1])!,cut=prev.at(-1)!,returnMonth=safeRet(cut,cur.at(-1)!);
  const vx=extras.vix||[],ix=align(vx,cut.d);
  if(ix>=0){if(vx[ix].v<20)groups.vix_baixo.push(returnMonth);else groups.vix_alto.push(returnMonth)}
  for(const [key,up,down] of [["dxy","dxy_sobe","dxy_cai"],["us10y","juros_sobem","juros_caem"]]){
   const series=extras[key]||[],i=align(series,cut.d);if(i<21)continue;
   const x=series[i].v-series[i-21].v;if(x>0)groups[up].push(returnMonth);else if(x<0)groups[down].push(returnMonth);
  }
 }
 return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,stats(v)]));
}
function corr(a:number[],b:number[]){
 const n=Math.min(a.length,b.length);if(n<30)return null;
 const ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;
 let u=0,v=0,w=0;for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;u+=x*y;v+=x*x;w+=y*y}
 return v>0&&w>0?round(u/Math.sqrt(v*w)):null;
}
function correlations(base:P[],extras:Record<string,P[]>){
 const out:Record<string,any>={};
 const baseMap=new Map<string,number>();for(let i=1;i<base.length;i++)if(daydiff(base[i-1].d,base[i].d)<=6)baseMap.set(base[i].d,safeRet(base[i-1],base[i]));
 for(const k of ["ibov","dolar"]){
  const p=extras[k]||[],aligned:[number,number][]=[];
  for(let i=1;i<p.length;i++){const x=baseMap.get(p[i].d);if(x!==undefined&&daydiff(p[i-1].d,p[i].d)<=6)aligned.push([x,safeRet(p[i-1],p[i])])}
  const last=aligned.slice(-252);out[k]={n:last.length,correlacao:corr(last.map(v=>v[0]),last.map(v=>v[1]))};
 }
 return out;
}
const studyCache=new Map<string,{at:number,value:unknown}>();
Deno.serve(async(req:Request)=>{
 const H={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Use POST"}),{status:405,headers:H});
 try{
  const b=await req.json().catch(()=>({})),asset=String(b.asset||"spx");
  if(!Object.hasOwn(SYMBOLS,asset))return new Response(JSON.stringify({error:"Índice inválido"}),{status:400,headers:H});
  const cached=studyCache.get(asset);if(cached&&Date.now()-cached.at<6*3600000)return new Response(JSON.stringify(cached.value),{headers:H});
  const names=["asset",...Object.keys(EXTRA)],syms=[SYMBOLS[asset],...Object.values(EXTRA)];
  const settled=await Promise.allSettled(syms.map(history));
  const data:Record<string,P[]>={},falhas:string[]=[];
  for(let i=0;i<names.length;i++){const x=settled[i];if(x.status==="fulfilled")data[names[i]]=x.value;else falhas.push(names[i])}
  if(!data.asset)return new Response(JSON.stringify({error:"Histórico do índice indisponível",falhas}),{status:503,headers:H});
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const extras=Object.fromEntries(Object.entries(data).filter(([k])=>k!=="asset"));
  const value={versao:"v357",asset,gerado:new Date().toISOString(),periodo:{de:data.asset[0].d,ate:data.asset.at(-1)!.d,pontos:data.asset.length},
   semanas:weekly(data.asset,today),eventos:eventStudy(data.asset,today),cenarios:conditional(data.asset,extras,today),brasil:correlations(data.asset,extras),falhas,
   metodo:"Retornos dos FECHAMENTOS diários ajustados (Yahoo Finance), não variação intradiária. CPI/Payroll: janela D-1/D0; FOMC: comunicado antes do fechamento. Eventos: somente datas verificadas 2026 (BLS) e reuniões 2024-2026 (Fed); a amostra é pequena. Classificação de cenário usa VIX/juros/DXY observados no fechamento anterior ao mês. Correlação é descritiva, sem inferência causal. Ibovespa e USD/BRL são proxies, não WIN/WDO.",
   fontes:[{nome:"Yahoo Finance",url:"https://finance.yahoo.com/"},{nome:"BLS CPI",url:"https://www.bls.gov/schedule/news_release/cpi.htm"},{nome:"BLS Emprego",url:"https://www.bls.gov/cps/publications/release-calendar.htm"},{nome:"Federal Reserve",url:"https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"}]};
  if(!falhas.length)studyCache.set(asset,{at:Date.now(),value});
  return new Response(JSON.stringify(value),{headers:H});
 }catch(e){return new Response(JSON.stringify({error:String((e as Error).message||e)}),{status:502,headers:H})}
});