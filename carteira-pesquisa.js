/* v288 · cálculos e gráficos de patrimônio/proventos, sem candles nem IA para calcular valores. */
(function(root){
 'use strict';
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 // Aceita decimal canônico e decimal brasileiro; não interpreta texto, booleanos ou infinito como valores.
 const num=root.CarteiraCalculo.num;
 const key=r=>(r.mk||'BR')+':'+r.tk;
 const ledger=(rows,until='9999-12-31')=>(rows||[]).filter(r=>r.d&&r.d<=until).slice().sort((a,b)=>a.d.localeCompare(b.d)||(a.tp==='E')-(b.tp==='E'));
 function income(rows,until='9999-12-31'){
   const months={},byAsset={},events=[];let missingFx=0;
   for(const row of ledger(rows,until)){if(row.tp!=='P')continue;const price=num(row.p),quantity=num(row.q),fee=num(row.cs)||0;if(price==null)continue;
     const amount=(quantity?price*quantity:price)-fee,unit=row.mk==='US'?'USD':'BRL',month=row.d.slice(0,7),id=key(row);months[month]??={BRL:0,USD:0};months[month][unit]+=amount;(byAsset[id]??={unit,total:0}).total+=amount;
     const fx=num(row.fx),brl=unit==='BRL'?amount:fx>0?amount*fx:null;if(brl==null)missingFx++;
     events.push({date:row.d,ticker:row.tk,key:id,unit,amount,brl,fx:unit==='USD'?fx:null});
   }
   return {months,byAsset,events,missingFx,totals:events.reduce((r,e)=>(r[e.unit]+=e.amount,r),{BRL:0,USD:0})};
 }
 function detail(asset,rows,until='9999-12-31'){
   let q=0,cycleIncome=0,allIncome=0,start=null,events=[];
   for(const row of ledger(rows,until).filter(r=>key(r)===asset.k)){
     const qty=num(row.q)||0,price=num(row.p)||0,fee=num(row.cs)||0;
     if(row.tp==='C'){if(q<=1e-9){cycleIncome=0;start=row.d}q+=qty}
     if(row.tp==='V')q=Math.max(0,q-qty);
     if(row.tp==='E'){const f=num(row.f);if(f>0){if(row.ev==='desd')q*=f;if(row.ev==='grup')q/=f;if(row.ev==='bonif')q*=1+f/100}}
     if(row.tp==='P'){const value=(qty?qty*price:price)-fee;allIncome+=value;if(start&&q>0)cycleIncome+=value}
     events.push(row);
   }
   const qty=num(asset.q),pm=num(asset.pm),px=asset.tem?num(asset.pa):null,cost=qty!=null&&pm!=null?qty*pm:null,value=qty!=null&&px!=null?qty*px:null,result=value!=null&&cost!=null?value-cost:null,change=num(asset.d1);
   return {unit:asset.moeda||(asset.mk==='US'?'USD':'BRL'),quantity:qty,pm,cost,value,result,resultPct:cost>0&&result!=null?result/cost*100:null,
    income:cycleIncome,allIncome,withIncome:result==null?null:result+cycleIncome,withIncomePct:cost>0&&result!=null?(result+cycleIncome)/cost*100:null,pmIncome:qty>0&&cost!=null?(cost-cycleIncome)/qty:null,
    daily:value!=null&&change!=null&&change>-100?value-value/(1+change/100):null,weight:num(asset.peso),quoteAt:asset.pxEm,cycleStart:start,events};
 }
 function wealth(perf,rows,raw){
   if(!perf?.D?.length||perf.D.length<2)return {points:[],reason:'Histórico de patrimônio ainda não carregado.'};
   const missing=[...(perf.falhas||[])];
   for(const row of ledger(rows,perf.D.at(-1)).filter(r=>r.tp==='C')){
     if(['rf','tesouro','outro'].includes(row.cl)){missing.push(row.tk+': falta histórico de marcação desta classe');continue}
     const series=raw?.series?.[row.tk];if(!series?.d?.length||!series?.c?.some(finite))missing.push(row.tk+': falta série de preços');
     else if(series.d[series.c.findIndex(v=>finite(v)&&v>0)]>row.d)missing.push(row.tk+': histórico começa depois da primeira compra');
   }
   if(ledger(rows).some(r=>r.mk==='US')&&!raw?.series?.__USD?.d?.length)missing.push('Falta histórico de câmbio');
   if(missing.length)return {points:[],reason:'Gráfico não exibido para evitar usar custo como preço histórico: '+[...new Set(missing)].join('; ')};
   return {points:perf.D.map((date,i)=>({date,value:finite(perf.V?.[i])?perf.V[i]:null,invested:finite(perf.INV?.[i])?perf.INV[i]:null})).filter(p=>p.value!=null),source:perf.fonte||'Histórico carregado no aplicativo',generated:perf.gerado,reason:''};
 }
 function seriesMonthly(points){const last=new Map;for(const point of points||[])last.set(point.date.slice(0,7),point);return [...last].map(([date,p])=>({date,value:p.value}))}
 function groups(assets,field){const groups={};for(const a of assets||[]){const p=a.position||a;if(finite(p.v))groups[p[field]||'Não informado']=(groups[p[field]||'Não informado']||0)+p.v}return Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([date,value])=>({date,value}))}
 function coverage(assets,reference){
   const today=reference||new Date().toISOString().slice(0,10),missing=[],undated=[],previous=[];
   for(const a of assets||[]){
     if(!a.tem||!(num(a.pa)>0)){missing.push(a.tk);continue}
     const date=String(a.pxEm||'').slice(0,10);
     if(!/^\d{4}-\d{2}-\d{2}$/.test(date))undated.push(a.tk);
     else if(date<today)previous.push({ticker:a.tk,date});
   }
   return {total:(assets||[]).length,priced:(assets||[]).length-missing.length,missing,undated,previous,complete:!missing.length};
 }
 root.CarteiraResearch={finite,num,key,ledger,income,detail,wealth,seriesMonthly,groups,coverage};
})(typeof window==='undefined'?globalThis:window);
