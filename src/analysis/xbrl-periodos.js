/* v783: normalização de períodos SEC e TTM verificável, 100% client/Web Worker.
 * Não usa rede, Supabase ou estimativas. FY + YTD atual - YTD anterior somente
 * dentro do MESMO conceito (namespace/tag/unidade), com período e filings provados.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioXBRLPeriodos=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const day=86400000,approved=new Set(['10-K','10-Q','10-K/A','10-Q/A','20-F','20-F/A','40-F','40-F/A']);
 const date=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&
  Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 const delta=(a,b)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/day;
 const annualForm=s=>/^(10-K|20-F|40-F)(\/A)?$/.test(s);
 const quarterForm=s=>/^10-Q(\/A)?$/.test(s);
 const proof=(x,ns,tag,unit)=>Object.freeze({
  documento_id:x.accn,formulario:x.form,codigo_xbrl:tag,namespace:ns,
  unidade:unit,valor_reportado:x.val,periodo_inicio:x.start,
  competencia:x.end,publicado_em:x.filed
 });
 function observations(doc,{namespace='us-gaap',tag,unit='USD',asOf}={}){
  const now=asOf||new Date().toISOString().slice(0,10);
  if(!date(now)||!['us-gaap','ifrs-full'].includes(namespace)||typeof tag!=='string')return [];
  const rows=doc?.facts?.[namespace]?.[tag]?.units?.[unit];
  if(!Array.isArray(rows))return [];
  const valid=rows.filter(x=>x&&approved.has(x.form)&&date(x.start)&&date(x.end)&&
   date(x.filed)&&x.start<x.end&&x.end<=x.filed&&x.filed<=now&&
   /^\d{10}-\d{2}-\d{6}$/.test(String(x.accn||''))&&
   typeof x.val==='number'&&Number.isFinite(x.val)&&
   delta(x.end,x.start)>=55&&delta(x.end,x.start)<=390);
  // Reapresentações: para o mesmo start/end, só utilizar a última filing conhecida até asOf.
  const selected=new Map();
  for(const x of valid.sort((a,b)=>b.filed.localeCompare(a.filed)||b.accn.localeCompare(a.accn))){
   const key=x.start+'|'+x.end;
   if(!selected.has(key))selected.set(key,x);
  }
  return [...selected.values()].sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed));
 }
 function ttmOne(doc,{namespace='us-gaap',tags=[],unit='USD',asOf}={}){
  for(const tag of tags){
   const rows=observations(doc,{namespace,tag,unit,asOf});
   const fy=rows.filter(x=>annualForm(x.form)&&delta(x.end,x.start)>=330&&delta(x.end,x.start)<=390);
   for(const annual of fy){
    const current=rows.filter(x=>quarterForm(x.form)&&x.end>annual.end&&
     delta(x.start,annual.end)>=1&&delta(x.start,annual.end)<=7&&
     delta(x.end,x.start)<=305&&delta(x.end,annual.end)<=315)
     .sort((a,b)=>b.end.localeCompare(a.end))[0];
    if(!current){
     // Valor anual continua rotulado FY; NÃO chamar de TTM atualizado até hoje.
     return {value:annual.val,method:'FY',period_end:annual.end,
      data_publicacao:annual.filed,unit,namespace,tag,proofs:[proof(annual,namespace,tag,unit)]};
    }
    const prior=rows.filter(x=>quarterForm(x.form)&&
     Math.abs(delta(current.end,x.end)-365)<=17&&
     Math.abs(delta(current.end,current.start)-delta(x.end,x.start))<=8&&
     Math.abs(delta(x.start,annual.start))<=5).sort((a,b)=>b.filed.localeCompare(a.filed))[0];
    if(!prior)return null; // falta YTD homólogo: não rebaixar para FY antigo
    const value=annual.val+current.val-prior.val;
    if(!Number.isFinite(value))continue;
    return {value,method:'FY+YTD-YTD',period_end:current.end,
     data_publicacao:[annual.filed,current.filed,prior.filed].sort().at(-1),
     unit,namespace,tag,proofs:[annual,current,prior].map(x=>proof(x,namespace,tag,unit))};
   }
  }
  return null;
 }
 function fcfMargin(doc,{namespace='us-gaap',unit='USD',asOf}={}){
  const tags=namespace==='us-gaap'?{
   revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet'],
   cfo:['NetCashProvidedByUsedInOperatingActivities'],
   capex:['PaymentsToAcquirePropertyPlantAndEquipment']
  }:{
   revenue:['RevenueFromContractsWithCustomers','Revenue'],
   cfo:['CashFlowsFromUsedInOperatingActivities'],
   capex:['PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities']
  };
  const input=Object.fromEntries(Object.entries(tags).map(([k,t])=>[k,ttmOne(doc,{namespace,tags:t,unit,asOf})]));
  const {revenue,cfo,capex}=input;
  if(!revenue||!cfo||!capex||revenue.value<=0||capex.value<0||
   revenue.period_end!==cfo.period_end||cfo.period_end!==capex.period_end||
   revenue.method!==cfo.method||cfo.method!==capex.method)return null;
  // Cada componente precisa referir os MESMOS três intervalos fiscais, não só a mesma data fim.
  const samePeriods=(a,b)=>a.proofs.length===b.proofs.length&&a.proofs.every((x,i)=>
   x.periodo_inicio===b.proofs[i].periodo_inicio&&x.competencia===b.proofs[i].competencia);
  if(!samePeriods(revenue,cfo)||!samePeriods(revenue,capex))return null;
  const value=(cfo.value-capex.value)/revenue.value*100;
  if(!Number.isFinite(value))return null;
  return {margin_pct:value,period_end:revenue.period_end,method:revenue.method,
   unit,namespace,components:input,source:'SEC companyfacts; cálculos em Worker local'};
 }
 return Object.freeze({VERSION:'v783',observations,ttmOne,fcfMargin});
});
