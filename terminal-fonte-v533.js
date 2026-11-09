/* Diário Trader v533: saúde das cotações do gráfico existente, sem preços fictícios. */
(function(root,doc){
'use strict';
if(!root||!doc||root.DIARIO_FONTE_GP533)return;
const style=doc.createElement('style');
style.textContent=[
'#v421-gp .gp533-status{display:flex;flex-wrap:wrap;align-items:center;gap:7px 12px;padding:8px 11px;background:#071b17;border-top:1px solid #204d3d;color:#c4dfd3;font:500 11px/1.4 system-ui,-apple-system,sans-serif}',
'#v421-gp .gp533-status[data-health="error"]{background:#302012;color:#ffcf9a}',
'#v421-gp .gp533-status[data-health="empty"]{color:#c7d0ce}',
'#v421-gp .gp533-status[data-health="stale"]{color:#f6d398}',
'#v421-gp .gp533-status button{margin-left:auto;min-height:34px;padding:5px 10px;border-radius:7px;border:1px solid #39745d;background:#123c2d;color:#e3ffed;font:600 11px system-ui;touch-action:manipulation}',
'#v421-gp .gp533-status button:disabled{opacity:.5;cursor:wait}',
'@media(max-width:690px){#v421-gp .gp533-status{padding:7px 9px;gap:5px 9px}#v421-gp .gp533-status button{margin-left:0}}'
].join('\n');
(doc.head||doc.documentElement).appendChild(style);
const safe=(fn,fallback)=>{try{return fn()}catch(_){return fallback}};
const fmt=stamp=>{try{return new Date(stamp*1000).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})}catch(_){return 'data indisponível'}};
let pending=false;
function snapshot(){
 const state=safe(()=>root.DIARIO_GP421?.state?.(),null),tec=root.TRM?.tec;
 if(!state||!tec)return null;
 const symbol=String(state.a||'').toUpperCase(),period=String(state.per||'1A');
 const interval=['1D','1d','3D','3d','1M','1m','5D','5d'].includes(period)?'5m':'1d';
 const candidates=[interval,'1d','5m'];
 let rows=[],iv=interval;
 for(const item of candidates){const data=safe(()=>tec.velas?.(symbol,item)?.L,[]);
  if(Array.isArray(data)&&data.length){rows=data;iv=item;break;}}
 const valid=rows.filter(r=>Array.isArray(r)&&Number.isFinite(Number(r[0]))&&Number(r[0])>0&&Number.isFinite(Number(r[4]))&&Number(r[4])>0);
 const latest=valid.reduce((max,r)=>Math.max(max,Number(r[0])),0);
 const errors=[interval,'1d','5m'].map(x=>safe(()=>tec.erroVelas?.(symbol,x),'')).filter(Boolean);
 const error=String(errors[0]||'').slice(0,170);
 const age=latest?(Date.now()/1000-latest):Infinity;
 const stale=latest&&age>(iv==='1d'?7*86400:3*86400);
 const code=/yahoo404|yahoo.{0,15}404|404.{0,15}yahoo|http.?404|not found/i.test(error)?'Yahoo 404':null;
 return {symbol,period,interval:iv,count:valid.length,latest,error,code,stale:!!stale};
}
function render(){
 const host=doc.getElementById('v421-gp');if(!host)return;
 const plot=host.querySelector('[data-gp-plot]');if(!plot)return;
 let bar=host.querySelector('.gp533-status');
 if(!bar){bar=doc.createElement('div');bar.className='gp533-status';bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
  const label=doc.createElement('span');label.className='gp533-label';
  const action=doc.createElement('button');action.type='button';action.textContent='↻ Tentar novamente';
  action.addEventListener('click',async()=>{
   if(pending)return;
   pending=true;action.disabled=true;action.textContent='Atualizando…';
   try{await root.DIARIO_GP421?.load?.(true)}catch(_){}
   finally{pending=false;render();}
  });
  bar.append(label,action);plot.after(bar);
 }
 const data=snapshot();if(!data){bar.hidden=true;return;}
 bar.hidden=false;
 const label=bar.querySelector('.gp533-label'),button=bar.querySelector('button');
 bar.dataset.health=data.error?'error':!data.latest?'empty':data.stale?'stale':'ok';
 let message='';
 if(data.error){
  message=(data.code?'⚠ Yahoo 404':'⚠ Fonte com falha')+' · '+data.symbol+' · '+data.error;
  if(data.latest)message+=' · Último dado recebido: '+fmt(data.latest);
 }else if(!data.latest)message='Sem cotação recebida · '+data.symbol+' · Fonte: Yahoo Finance · Não é preço em tempo real';
 else message=(data.stale?'⚠ Último dado antigo':'Último dado disponível')+' · '+data.symbol+' · '+fmt(data.latest)+' · '+data.count+' registros · '+(data.interval==='1d'?'diário':'intradiário')+' · Yahoo Finance (com atraso)';
 if(label.textContent!==message)label.textContent=message;
 button.disabled=pending;button.textContent=pending?'Atualizando…':'↻ Tentar novamente';
}
let timer=null;
function start(){render();if(timer===null)timer=root.setInterval(()=>{if(!doc.hidden)render()},12000)}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
root.DIARIO_FONTE_GP533={snapshot,render};
})(window,document);
