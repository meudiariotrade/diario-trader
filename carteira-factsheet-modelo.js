/* Métricas do factsheet: só séries e posições verificáveis; nenhuma conta financeira delegada à IA. */
(function(root){
 'use strict';
 const ok=v=>typeof v==='number'&&Number.isFinite(v),sum=a=>a.reduce((s,v)=>s+v,0),stdev=a=>{if(a.length<2)return null;const mean=sum(a)/a.length;return Math.sqrt(sum(a.map(v=>(v-mean)**2))/(a.length-1))};
 function performance(input){
  if(input.selected?.tipo==='ativo')return {available:false,reason:'Ficha individual: retorno e risco da carteira completa não são atribuídos a este ativo.'};
  const p=input.performance,w=input.wealth,asOf=input.asOf||String(input.generated||'9999-12-31').slice(0,10);
  if(!w?.points?.length||!p?.D?.length||p.falhas?.length)return {available:false,reason:w?.reason||'Histórico completo e validado ainda não disponível.'};
  const indices=p.D.map((d,i)=>({d,i})).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.d)&&r.d<=asOf);
  if(indices.length<2||indices.some((r,i)=>i&&r.d<=indices[i-1].d)||indices.some(r=>!ok(p.I?.[r.i])||p.I[r.i]<=0||!ok(p.V?.[r.i])))return {available:false,reason:'Histórico com lacunas ou índices inválidos; métricas omitidas.'};
  const first=indices[0].i,last=indices.at(-1).i,base=p.I[first],rows=indices.map(r=>({date:r.d,value:p.V[r.i],index:p.I[r.i]/base*100,i:r.i}));
  const benchmark=key=>indices.every(r=>ok(p[key]?.[r.i])&&p[key][r.i]>0)?rows.map(r=>({date:r.date,value:p[key][r.i]/p[key][first]*100})):[];
  const ib=benchmark('ib'),cdi=benchmark('cdi'),monthly=[];let previous=first;
  const months=new Map;for(const r of rows)months.set(r.date.slice(0,7),r);
  for(const [date,r]of months){if(r.i===first)continue;monthly.push({date,value:(p.I[r.i]/p.I[previous]-1)*100,ib:ib.length?(p.ib[r.i]/p.ib[previous]-1)*100:null,cdi:cdi.length?(p.cdi[r.i]/p.cdi[previous]-1)*100:null,partial:date===asOf.slice(0,7)});previous=r.i}
  let high=rows[0].index,dd=0;for(const r of rows){high=Math.max(high,r.index);dd=Math.min(dd,(r.index/high-1)*100)}
  const daily=indices.slice(1).map((r,j)=>p.I[r.i]/p.I[indices[j].i]-1),vol=stdev(daily),excess=ib.length?indices.slice(1).map((r,j)=>daily[j]-(p.ib[r.i]/p.ib[indices[j].i]-1)):[];
  const latest=monthly.at(-1),contributions=Object.entries(p.pnlK||{}).map(([key,values])=>({key,ticker:key.split(':').slice(1).join(':')||key,value:indices.slice(1).every(r=>ok(values[r.i]))?sum(indices.slice(1).map(r=>values[r.i])):null})).filter(r=>r.value!==null);
  return {available:true,rows,ib,cdi,monthly,from:rows[0].date,to:rows.at(-1).date,return:rows.at(-1).index-100,monthReturn:latest?.value??null,vol:daily.length>=20&&vol!=null?vol*Math.sqrt(252)*100:null,drawdown:dd,tracking:excess.length>=20?stdev(excess)*Math.sqrt(252)*100:null,n:daily.length,contributions,source:p.fonte||'Histórico de cotações do aplicativo'};
 }
 function snapshotHistory(input){
  const rows=[];for(const [date,s]of Object.entries(input.snapshots||{})){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>(input.asOf||String(input.generated).slice(0,10)))continue;const br=s.BR?.v,us=s.US?.v;if(!ok(br)&&!ok(us))continue;if(ok(us)&&us!==0)continue;rows.push({date,value:ok(br)?br:0})}
  return rows.sort((a,b)=>a.date.localeCompare(b.date));
 }
 function build(input){
  const asOf=input.asOf||String(input.generated||'').slice(0,10),assets=input.assets||[],fx=input.snapshot?.fx,missing=[];
  const positions=assets.map(a=>{const p=a.position,usd=p.moeda==='USD'||p.mk==='US',value=p.tem&&ok(p.q)&&ok(p.pa)&&(!usd||ok(fx)&&fx>0)?p.q*p.pa*(usd?fx:1):null;if(value===null)missing.push(p.tk);return {...a,value}}),total=sum(positions.filter(a=>a.value!==null).map(a=>a.value));
  const groups=field=>{const g={};for(const a of positions)if(a.value!==null){const k=a.position[field]||'Não informado';g[k]=(g[k]||0)+a.value}return Object.entries(g).map(([name,value])=>({name,value,weight:total>0?value/total*100:null})).sort((a,b)=>b.value-a.value)};
  const perf=performance(input),wealth=input.selected?.tipo==='ativo'?[]:input.wealth?.points?.length?input.wealth.points:snapshotHistory({...input,asOf}),top=positions.filter(a=>a.value!==null).sort((a,b)=>b.value-a.value).slice(0,3),income=input.income||root.CarteiraResearch.income(input.ledger||[],asOf);
  return {asOf,positions,total,missing,partial:missing.length>0,classes:groups('cl'),sectors:groups('setor'),top3:total>0?sum(top.map(a=>a.value))/total*100:null,largest:top[0]?.position.tk,largestWeight:total>0&&top.length?top[0].value/total*100:null,perf,wealth,wealthRecorded:!input.wealth?.points?.length,income};
 }
 function paragraphs(value){const out=[],seen=new Set;function visit(v,prefix=''){if(v==null)return;if(typeof v==='string'||typeof v==='number'){const text=(prefix?prefix+': ':'')+String(v).trim(),key=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');if(text&&!seen.has(key)){seen.add(key);out.push(text)}}else if(Array.isArray(v))v.forEach(item=>visit(item));else if(typeof v==='object')for(const [key,text]of Object.entries(v))if(!['exec_id','modelo','identificacao'].includes(key))visit(text,typeof text==='string'||typeof text==='number'?key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()):'')}visit(value);return out}
 root.CarteiraFactsheetModel={build,performance,snapshotHistory,paragraphs,stdev};
})(typeof window==='undefined'?globalThis:window);
