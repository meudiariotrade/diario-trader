/* Apenas o gerador de cards: calendário, pontos e consolidação de dados já carregados. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TraderShareCards=api})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const DAY=86400000, finite=v=>typeof v==='number'&&Number.isFinite(v);
 const themes=Object.freeze([['auto','Automático'],['mercado','Mercado'],['natal','Natal'],['halloween','Halloween'],['carnaval','Carnaval'],['futebol','Futebol'],['champions','Champions'],['libertadores','Libertadores / Finais'],['blackfriday','Black Friday'],['superquarta','Super Quarta'],['brasil','Brasil'],['pascoa','Páscoa'],['junina','Festa Junina'],['verao','Verão'],['reveillon','Réveillon'],['classico','Clássico']]);
 const names=Object.freeze({mercado:'Mercado Institucional',natal:'Natal',halloween:'Halloween',carnaval:'Carnaval',futebol:'Futebol',champions:'Especial Champions',libertadores:'Especial Libertadores',blackfriday:'Black Friday',superquarta:'Super Quarta',brasil:'Independência · Brasil',pascoa:'Páscoa',junina:'Festa Junina',verao:'Verão',reveillon:'Réveillon',classico:'Clássico'});
 function validKey(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:null}
 function dateKey(v=new Date()){
  if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(?:$|T\d\d:\d\d(?::\d\d(?:\.\d+)?)?$)/.test(v))return validKey(v.slice(0,10));
  const d=v instanceof Date?v:new Date(v);if(!Number.isFinite(d.getTime()))return null;
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return p.year+'-'+p.month+'-'+p.day;
 }
 const utc=key=>Date.parse(key+'T12:00:00Z');
 function addDays(key,n){return new Date(utc(key)+n*DAY).toISOString().slice(0,10)}
 function week(key){const start=addDays(key,-((new Date(utc(key)).getUTCDay()+6)%7));return [start,addDays(start,6)]}
 function easter(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mth=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return `${year}-${String(mth).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
 function blackFriday(year){const last=`${year}-11-30`,offset=(new Date(utc(last)).getUTCDay()-5+7)%7;return addDays(last,-offset)}
 // Interseções das decisões oficiais, sem inferir uma reunião pelo dia da semana.
 // BCB: detalhenoticia/20739/nota e /21173/nota. Fed: fomccalendars.htm e comunicado monetary20261112a.htm.
 const superQuartas=Object.freeze(['2026-01-28','2026-03-18','2026-04-29','2026-06-17','2026-09-16','2026-12-09','2027-01-27','2027-03-17','2027-04-28']);
 function isSuperQuarta(key,eventos=[]){
  if(new Date(utc(key)).getUTCDay()!==3)return false;
  if(superQuartas.includes(key))return true;
  const doDia=(Array.isArray(eventos)?eventos:[]).filter(e=>(e.em||e.date||e.dia)&&dateKey(e.em||e.date||e.dia)===key&&!/ata|minutes|estrat[eé]gia|strategy/i.test(e.t||e.title||''));
  return doDia.some(e=>/copom|selic/i.test(e.t||e.title||''))&&doDia.some(e=>/fomc|fed.*(?:juros|rate)|(?:juros|rate).*fed/i.test(e.t||e.title||''));
 }
 function automatic(input=new Date(),eventos=[]){const key=dateKey(input)||dateKey(new Date()),[y,m,d]=key.split('-').map(Number),bf=week(blackFriday(y)),ind=week(`${y}-09-07`),dist=Math.round((utc(key)-utc(easter(y)))/DAY);
  if(m===12&&d>=26||m===1&&d<=5)return 'reveillon';
  if(key>=bf[0]&&key<=bf[1])return 'blackfriday';
  // A semana de Black Friday pode avançar até os primeiros dias de dezembro.
  const anterior=week(blackFriday(y-1));if(key>=anterior[0]&&key<=anterior[1])return 'blackfriday';
  if(m===12&&d<=25)return 'natal';
  if(dist>=-51&&dist<=-46)return 'carnaval';
  if(dist>=-7&&dist<=0)return 'pascoa';
  if(m===5&&d>=25||m===6&&d<=7)return 'champions';
  if(m===6)return 'junina';
  if(key>=ind[0]&&key<=ind[1])return 'brasil';
  if(m===10&&d>=20&&d<=31)return 'halloween';
  if(m===11&&d>=10)return 'libertadores';
  return isSuperQuarta(key,eventos)?'superquarta':'mercado';
 }
 function theme(choice,input,eventos=[]){return choice==='auto'||!names[choice]?automatic(input,eventos):choice}
 function badge(choice,input,eventos=[]){const id=theme(choice,input,eventos);return (choice==='auto'?'Automático · ':'')+(names[id]||names.mercado)}
 function future(ticker){const s=String(ticker||'').toUpperCase().trim().split(':').at(-1).replace(/\.SA$/,'');return /^(WIN|WDO)(?:$|FUT$|1!$|[FGHJKMNQUVXZ]\d{1,4}$)/.exec(s)?.[1]||null}
 function points(t,entry,exit){return future(t?.ativo||t?.tk)&&finite(entry)&&finite(exit)?(exit-entry)*(/^(V|SELL|VENDA|SHORT)$/i.test(String(t.side||''))?-1:1):null}
 function aggregate(rows,anchor,scope='day',capital=null){const key=dateKey(anchor)||dateKey(new Date()),[from,to]=scope==='week'?week(key):[key,key],seen=new Set();
  const trades=(Array.isArray(rows)?rows:[]).filter(r=>{const d=r.date?dateKey(r.date):null;if(r.open||!finite(r.pnlBrl)||!d||d<from||d>to)return false;if(r.id&&seen.has(r.id))return false;if(r.id)seen.add(r.id);return true});
  const total=trades.length,pnl=trades.reduce((s,t)=>s+t.pnlBrl,0),wins=trades.filter(t=>t.pnlBrl>0).length,pts={};
  for(const t of trades)if(t.family&&finite(t.points))pts[t.family]=(pts[t.family]||0)+t.points;
  const allWeights=total>0&&trades.every(t=>finite(t.notionalBrl)&&t.notionalBrl>0&&finite(t.percent)),notional=allWeights?trades.reduce((s,t)=>s+t.notionalBrl,0):null;
  const pctOperacoes=notional>0?trades.reduce((s,t)=>s+t.percent*t.notionalBrl,0)/notional:null;
  return {from,to,total,wins,winRate:total?wins/total*100:null,pnl:total?pnl:null,pctConta:total&&finite(capital)&&capital>0?pnl/capital*100:null,pctOperacoes,points:pts,tickers:[...new Set(trades.map(t=>t.ticker).filter(Boolean))],trades};
 }
 return Object.freeze({themes,names,dateKey,addDays,week,easter,blackFriday,automatic,theme,badge,isSuperQuarta,future,points,aggregate});
});
