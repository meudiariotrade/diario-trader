/* Sessões e referências de EWZ/ADRs. O preço regular e o overnight nunca são somados. */
(function(root){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x),safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const price=x=>finite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:Math.abs(x)<1?4:2}):'—';
 const percent=x=>finite(x)?(x>0?'+':'')+x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'—';
 const color=x=>!finite(x)||x===0?'mut':x>0?'g':'r';
 const parts=date=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
 function phase(date=new Date()){
  const p=parts(date),m=+p.hour*60 + +p.minute;
  if(p.weekday==='Sat'||p.weekday==='Sun'&&m<1200||p.weekday==='Fri'&&m>=1200)return 'closed';
  if(m<240||m>=1200)return 'overnight';if(m<570)return 'pre';if(m<960)return 'reg';return 'post';
 }
 function nightKey(date){if(phase(date)!=='overnight')return null;const p=parts(date);return new Date(Date.UTC(+p.year,+p.month-1,+p.day-(+p.hour<4?1:0))).toISOString().slice(0,10)}
 const time=x=>{const d=new Date(x);return x&&Number.isFinite(d.getTime())?d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'horário não informado'};
 const label={pre:'Pré-mercado',post:'Pós-mercado',overnight:'Overnight',reg:'Pregão regular',closed:'Fechado'};
 function sameDay(a,b){const x=parts(a),y=parts(b);return x.year===y.year&&x.month===y.month&&x.day===y.day}
 function view(row,now=new Date()){
  const regular=row.regular||{px:row.state==='pre'?row.base:row.px,chp:row.state==='pre'?null:row.chp,at:null,fonte:row.fonte==='tv'?'TradingView':'Yahoo Finance'};
  const expected=phase(now),candidates=[['overnight',row.overnight],['pre',row.pre],['post',row.pos]].filter(([,q])=>q&&finite(q.px)&&q.px>0);
  let active=null;
  for(const [kind,q] of candidates){
   const at=new Date(q.at),valid=!!q.at&&Number.isFinite(at.getTime())&&at.getTime()<=now.getTime()+60000;
   const current=valid&&(kind==='overnight'?expected==='overnight'&&nightKey(at)===nightKey(now)&&q.active===true:expected===kind&&sameDay(at,now)&&row.phase===kind);
   if(current)active={...q,kind,active:true};
  }
  const last=active||candidates.map(([kind,q])=>({...q,kind,active:false})).sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0))[0]||null;
  return {regular,extra:last,active,expected,change:active?.chp??regular.chp};
 }
 function render(row,now=new Date()){
  const q=view(row,now),r=q.regular,e=q.extra;
  const last=e?`<div class="adr-extra${e.kind==='overnight'?' adr-night':''}"><span>${e.active?'':'Último '}${label[e.kind]}</span><span><b>${price(e.px)}</b> <span class="${color(e.chp)}">${percent(e.chp)}</span></span><small>${safe(time(e.at))} · ${safe(e.fonte||'fonte não informada')}${e.delay?.startsWith('delayed')?' · com atraso':''}</small></div>`:'';
  const unavailable=q.expected==='overnight'&&!q.active?'<p class="adr-unavailable">Overnight não confirmado para este ativo nesta consulta.</p>':'';
  return `<article class="adr-quote" data-adr-symbol="${safe(row.s)}"><div class="adr-quote-heading"><div><b>${safe(row.s)}</b><small>${safe(row.n)}</small></div><div class="adr-regular"><b>${price(r.px)}</b> <span class="${color(r.chp)}">${percent(r.chp)}</span><small>Pregão regular</small></div></div><small class="adr-quote-reference">Referência regular: ${safe(time(r.at))} · ${safe(r.fonte||'fonte não informada')}</small>${last}${unavailable}</article>`;
 }
 const mean=(rows,now=new Date())=>{const views=rows.map(r=>view(r,now)),active=views.some(v=>v.active),values=views.map(v=>active?v.active?.chp:v.regular.chp).filter(finite);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null};
 root.TraderAdr=Object.freeze({price,percent,phase,nightKey,time,view,render,mean});
})(typeof window==='undefined'?globalThis:window);
