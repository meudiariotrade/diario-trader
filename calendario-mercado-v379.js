/* Diário de Trader v379 — Exibição conservadora da abertura teórica.
   Datas B3 2026: https://www.b3.com.br/pt_br/noticias/calendario-de-negociacao-da-b3-confira-o-funcionamento-da-bolsa-em-2026.htm
   NYSE 2026: https://www.nyse.com/trade/hours-calendars
   Em anos sem calendário B3 verificado, NÃO habilitar a projeção. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TraderCalendario=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
 'use strict';
 const B3={
  2026:[
   '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21',
   '2026-05-01','2026-06-04','2026-09-07','2026-10-12','2026-11-02',
   '2026-11-20','2026-12-24','2026-12-25','2026-12-31'
  ]
 };
 const NYSE={
  2026:[
   '2026-01-01','2026-01-19','2026-02-16','2026-04-03','2026-05-25',
   '2026-06-19','2026-07-03','2026-09-07','2026-11-26','2026-12-25'
  ],
  2027:[
   '2027-01-01','2027-01-18','2027-02-15','2027-03-26','2027-05-31',
   '2027-06-18','2027-07-05','2027-09-06','2027-11-25','2027-12-24'
  ]
 };
 const US_EARLY={'2026-11-27':13*60,'2026-12-24':13*60,'2027-11-26':13*60};
 const datePart=(now,zone)=>{
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
   timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',
   hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return {date:parts.year+'-'+parts.month+'-'+parts.day,year:+parts.year,
   weekday:parts.weekday,mins:+parts.hour*60+(+parts.minute)};
 };
 const millis=t=>{
  if(t instanceof Date)return t.getTime();
  if(typeof t==='number')return t>1e12?t:t>1e9?t*1000:NaN;
  if(typeof t==='string'&&t.trim()){
   const v=Date.parse(t);
   return Number.isFinite(v)?v:NaN;
  }
  return NaN;
 };
 function assess(now=new Date()){
  const d=now instanceof Date?now:new Date(now);
  if(!Number.isFinite(d.getTime()))return {show:false,reason:'data_invalida'};
  const br=datePart(d,'America/Sao_Paulo'),us=datePart(d,'America/New_York');
  const base={brDate:br.date,usDate:us.date,brTime:br.mins,usTime:us.mins,show:false};
  if(!B3[br.year]||!NYSE[us.year])return {...base,reason:'calendario_nao_verificado'};
  if(!B3[br.year].includes(br.date))return {...base,reason:'b3_sem_feriado'};
  if(['Sat','Sun'].includes(br.weekday)||['Sat','Sun'].includes(us.weekday))return {...base,reason:'fim_de_semana'};
  if(br.date!==us.date)return {...base,reason:'datas_de_mercado_diferentes'};
  if(NYSE[us.year].includes(us.date))return {...base,reason:'nyse_feriado'};
  const end=US_EARLY[us.date]||16*60;
  if(us.mins<9*60+30||us.mins>=end)return {...base,reason:'nyse_fora_da_sessao_regular'};
  return {...base,show:true,reason:'b3_feriado_nyse_aberta',usCloseMins:end};
 }
 function quoteCheck(data,viewFn,now=new Date()){
  const stamp=millis(data&&data.ts),epoch=now.getTime();
  if(!Number.isFinite(stamp)||stamp>epoch+60000||epoch-stamp>5*60000)
   return {ok:false,reason:'consulta_adr_desatualizada',valid:0};
  if(!Array.isArray(data.itens))return {ok:false,reason:'sem_cotacoes',valid:0};
  const reference=datePart(now,'America/New_York').date,valid=new Set();
  for(const item of data.itens){
   if(!item||typeof item.s!=='string'||item.s.toUpperCase()==='EWZ')continue;
   let view;try{view=viewFn(item)}catch{continue}
   const q=view&&view.regular;
   if(!q||!Number.isFinite(q.px)||q.px<=0||!Number.isFinite(q.chp))continue;
   const at=millis(q.at);
   if(!Number.isFinite(at)||at>epoch+60000||epoch-at>30*60000)continue;
   if(datePart(new Date(at),'America/New_York').date!==reference)continue;
   valid.add(item.s.toUpperCase());
  }
  return valid.size>=2?{ok:true,reason:'cotacoes_validas',valid:valid.size,symbols:[...valid]}:
   {ok:false,reason:'adrs_sem_cotacoes_recentes_suficientes',valid:valid.size,symbols:[...valid]};
 }
 function visibility(now,data,viewFn){
  const session=assess(now);
  if(!session.show)return session;
  const quotes=quoteCheck(data,viewFn,now instanceof Date?now:new Date(now));
  return {...session,show:quotes.ok,reason:quotes.ok?session.reason:quotes.reason,quotes};
 }
 return Object.freeze({assess,quoteCheck,visibility,datePart,millis,calendarYears:[2026]});
});
