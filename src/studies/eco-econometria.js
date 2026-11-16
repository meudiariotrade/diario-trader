/* v657 · Econometria aplicada; usa a Edge Function candles existente, sem dados sintéticos. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state;
const TICKERS=['IBOV','PETR4','VALE3','USDBRL','IVVB11'];
S.rf=null;
function mean(a){return a.reduce((s,v)=>s+v,0)/a.length;}
function mqo(x,y){
 if(x.length!==y.length||x.length<3)return null;
 const ax=mean(x),ay=mean(y);let vx=0,vy=0,co=0;
 for(let i=0;i<x.length;i++){const dx=x[i]-ax,dy=y[i]-ay;vx+=dx*dx;vy+=dy*dy;co+=dx*dy;}
 if(vx<=1e-14||vy<=1e-14)return null;
 const beta=co/vx,alpha=ay-beta*ax,corr=co/Math.sqrt(vx*vy);
 return {n:x.length,beta,alpha,corr,r2:corr*corr,mx:ax,my:ay};
}
function alinhar(A,B){
 if(!A||!B)return [];
 const map=new Map(B.map(x=>[x.d,x.p]));
 return A.filter(x=>map.has(x.d)).map(x=>({d:x.d,a:x.p,b:map.get(x.d)})).sort((x,y)=>x.d.localeCompare(y.d));
}
function retornos(v){
 const ret=[];
 for(let i=1;i<v.length;i++){
  if(v[i].a>0&&v[i].b>0&&v[i-1].a>0&&v[i-1].b>0)
   ret.push({d:v[i].d,a:v[i].a/v[i-1].a-1,b:v[i].b/v[i-1].b-1});
 }
 return ret;
}
L.mqo=mqo;L.alinhar=alinhar;L.retornos=retornos;
function economia(){
 const A=S.series[S.x],B=S.series[S.y],M=S.series.IBOV;
 if(!A||!B||!M)return null;
 const p=alinhar(A,B).slice(-(S.periodo+1)),r=retornos(p);
 const b=mqo(r.map(t=>t.a),r.map(t=>t.b));
 const pM=alinhar(M,B).slice(-(S.periodo+1)),rM=retornos(pM);
 const beta=mqo(rM.map(t=>t.a),rM.map(t=>t.b));
 const level=mqo(p.map(t=>t.a),p.map(t=>t.b));
 if(!b||!beta||!level||b.n<20||beta.n<20)return null;
 const rf=Math.log(1+S.rf/100)/252;
 const alphaJ=beta.my-(rf+beta.beta*(beta.mx-rf));
 const residual=p.map(x=>x.b-level.alpha-level.beta*x.a);
 const avg=mean(residual),vol=Math.sqrt(residual.reduce((s,x)=>s+(x-avg)**2,0)/(residual.length-1));
 return {p,b,beta,level,alphaJ,resid:residual.at(-1),z:vol?(residual.at(-1)-avg)/vol:null};
}
function select(t,key){
 return '<label>'+t+'<select data-eco-select="'+key+'">'+TICKERS.map(s=>'<option value="'+s+'"'+(S[key]===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>';
}
function chart(p){
 if(p.length<3||!(p[0].a>0&&p[0].b>0))return '';
 const ax=p.map(x=>100*x.a/p[0].a),bx=p.map(x=>100*x.b/p[0].b);
 const lo=Math.min(...ax,...bx)-1,hi=Math.max(...ax,...bx)+1;
 const pl=v=>v.map((x,i)=>(45+565*i/(v.length-1)).toFixed(1)+','+(163-(x-lo)/(hi-lo||1)*134).toFixed(1)).join(' ');
 return '<svg class="eco-plot" viewBox="0 0 655 192" aria-label="Preços dos dois ativos em índice-base 100" role="img">'+
 '<polyline fill="none" stroke="#D4A017" stroke-width="2.2" points="'+pl(ax)+'"/>'+
 '<polyline fill="none" stroke="#10B981" stroke-width="2.2" points="'+pl(bx)+'"/>'+
 '<text x="45" y="183" fill="#a6afbe" font-size="12">Primeira data comum</text><text x="525" y="183" fill="#a6afbe" font-size="12">Última data</text></svg>';
}
L.views.eco=()=>{
 if(!Number.isFinite(S.rf)){
  try{if(typeof JR!=='undefined'&&+JR.data?.selic?.v>0)S.rf=+JR.data.selic.v;}catch(_){}
  if(!Number.isFinite(S.rf))S.rf=10;
 }
 const opts=select('Variável X','x')+select('Variável Y','y')+
 '<label>Amostra<select data-eco-select="periodo">'+[60,126,252].map(n=>'<option value="'+n+'"'+(S.periodo===n?' selected':'')+'>'+n+' pregões</option>').join('')+'</select></label>'+
 '<button data-eco-btn="series" class="eco-action" type="button"'+(S.busca?' disabled':'')+'>'+(S.busca?'Consultando…':'Atualizar históricos')+'</button>';
 const d=economia();
 const status=L.note(S.busca?'Consultando histórico diário dos ativos…':S.erroSerie?L.esc(S.erroSerie):'Fonte: endpoint Candles existente (Yahoo Finance, intervalo diário, até 2 anos).');
 const juros=L.slider('rf','Taxa livre de risco anual · referência CAPM',0,25,.25,'%');
 if(!d)return L.card('Séries do aplicativo · regressão e CAPM','<div class="eco-controls">'+opts+'</div>'+juros+status+
 L.note('Sem amostra suficiente: são necessários pelo menos 20 retornos coincidentes. Nenhum retorno ou resultado é preenchido artificialmente.'));
 const {b,beta,level}=d;
 return L.card('Amostra diária · séries alinhadas','<div class="eco-controls">'+opts+'</div>'+juros+status+
 L.note('Regressão de retornos simples diários: '+b.n+' observações. CAPM: '+beta.n+' observações com o IBOV. RF anual usada: '+L.f(S.rf,2)+'%.')+
 chart(d.p)+L.note('<span class="eco-ouro">●</span> '+L.esc(S.x)+' &nbsp; <span class="eco-verde">●</span> '+L.esc(S.y)+' · índice de preços base 100.'))+
 '<div class="eco-grid-stats">'+L.kpi('MQO · coeficiente angular',L.f(b.beta,4))+L.kpi('MQO · intercepto',L.f(b.alpha*100,4)+' pp')+
 L.kpi('Correlação de retornos',L.f(b.corr,3))+L.kpi('R² ajustamento',L.f(b.r2*100,1)+'%')+
 L.kpi('Beta CAPM vs. IBOV',L.f(beta.beta,3))+L.kpi('Alfa Jensen · diário',L.f(d.alphaJ*100,4)+' pp')+
 L.kpi('Spread residual · níveis',L.f(d.resid,3))+L.kpi('Z-score residual',L.f(d.z,2))+'</div>'+
 L.card('Resolução didática de MQO e CAPM',
 L.note('<b>1.</b> Casamento por data das observações de fechamento; retorno rₜ = Pₜ/Pₜ₋₁ − 1.')+
 L.note('<b>2.</b> MQO: β̂ = Σ(x−x̄)(y−ȳ)/Σ(x−x̄)² = '+L.f(b.beta,4)+'. Intercepto = ȳ − β̂x̄ = '+L.f(b.alpha,6)+'.')+
 L.note('<b>3.</b> R² = 1 − SQ dos erros / SQ total = '+L.f(b.r2,4)+'. Correlação = '+L.f(b.corr,4)+'. Ajuste não demonstra causalidade.')+
 L.note('<b>4.</b> Beta CAPM vs. IBOV = '+L.f(beta.beta,4)+'. Alfa Jensen = E[r ativo] − {rf diário + β(E[r mercado] − rf diário)}.')+
 L.note('<b>5.</b> Regressão de preços em níveis apenas para o spread: P(Y) − intercepto − inclinação·P(X). Spread e z-score não provam cointegração nem autorizam estratégia de pares.'));
};
L.events.enter.eco=()=>{if(Object.keys(S.series).length<5)L.events.series();};
L.events.series=async()=>{
 if(S.busca)return;S.busca=true;S.erroSerie='';L.paint();
 try{
  const c=typeof cfg==='function'?cfg():null;
  if(!c)throw Error('Configure a conexão do aplicativo para consultar os dados.');
  if(typeof SESS==='undefined'||!SESS?.at)throw Error('Entre na sua conta para consultar históricos.');
  const res=await Promise.allSettled(TICKERS.map(async ativo=>{
   const r=await fetch(c.url+'/functions/v1/candles',{method:'POST',
    headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},
    body:JSON.stringify({ativo,intervalo:'1d'}),signal:AbortSignal.timeout(25000)});
   if(!r.ok)throw Error(ativo+': HTTP '+r.status);
   const j=await r.json();
   const a=(j.candles||[]).filter(x=>Array.isArray(x)&&Number.isFinite(+x[0])&&+x[4]>0)
     .map(x=>({d:new Date(+x[0]*1000).toISOString().slice(0,10),p:+x[4]}));
   if(a.length<21)throw Error(ativo+': amostra insuficiente.');
   return [ativo,a];
  }));
  const errors=[];for(const r of res)if(r.status==='fulfilled')S.series[r.value[0]]=r.value[1];else errors.push(String(r.reason?.message||r.reason));
  S.erroSerie=errors.join(' · ');
 }catch(e){S.erroSerie=String(e.message||e);}
 finally{S.busca=false;L.paint();}
};
const previous=L.events.change;
L.events.change=(key,value)=>{
 if(key==='x'||key==='y'){S[key]=value;L.paint();}
 else if(key==='periodo'){S.periodo=+value;L.paint();}
 else if(typeof previous==='function')previous(key,value);
};
})();
