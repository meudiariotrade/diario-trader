/* v868 — Início: abertura do dia (mapa de calor da carteira, maiores altas/baixas, referências)
 * e risco da carteira (concentração, setores, correlação e perda provável em um dia).
 * Lê preços já na memória do app (TRM.melhorPx). Correlação e perda provável só com toque em "Calcular",
 * usando candles diários servidos pela Cloudflare; cálculo no aparelho. Nenhuma consulta ao Supabase. */
;(function(w,d){
'use strict';
if(!d)return;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(v,c=2)=>v==null||!Number.isFinite(+v)?'—':(+v).toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c});
const P=(v,c=1)=>v==null||!Number.isFinite(+v)?'—':((v>0?'+':'')+N(v,c))+'%';
const ehBR=tk=>/^[A-Z]{4}\d{1,2}$/.test(tk);
let risco=null,calculando=false,riscoIdentidade=null;
const riscoKey=()=>JSON.stringify([typeof SESS!=='undefined'?SESS?.uid||'local':'local',pos().map(p=>[p.tk,p.mk,p.v]).sort()]);
function riscoConselho(){return risco&&!risco.erro&&riscoIdentidade===riscoKey()&&Date.now()-risco.em<86400000?{pares:risco.pares,n:risco.n,amostra:risco.amostra,ate:risco.ate,base:'Retornos diários em moeda de cotação; não ajustados por câmbio',coberturaPct:risco.coberturaPct}:null;}
const px=tk=>{try{const q=w.TRM?.melhorPx?.(tk);return q&&q.px>0?q:null}catch{return null}};
function pos(){try{return (w.pfCalc?.().pos||[]).filter(p=>+p.q>0&&+p.v>0).map(p=>({tk:String(p.tk||'').toUpperCase().replace(/\.SA$/,''),v:+p.v,peso:+p.peso||0,setor:p.setor||'Sem setor',mk:p.mk}))}catch{return []}}
const cor=pct=>pct<=50?'#10B981':pct<=80?'#F59E0B':'#EF4444';
function calor(L){
 if(!L.length)return '<p class="pc-mut">Cadastre posições na Carteira para ver o mapa.</p>';
 const tot=L.reduce((s,p)=>s+p.v,0)||1;
 return '<div class="pc-heat">'+L.slice().sort((a,b)=>b.v-a.v).slice(0,16).map(p=>{const q=px(p.tk),d1=q?.d1;const a=Math.min(1,Math.abs(d1||0)/3);
  const bg=d1==null?'#181C28':d1>=0?'rgba(16,185,129,'+(.18+a*.6)+')':'rgba(239,68,68,'+(.18+a*.6)+')';
  return '<button type="button" class="pc-tile" data-fa-abrir="'+E(p.tk)+'" style="flex:'+Math.max(1,p.v/tot*100).toFixed(1)+' 1 '+Math.max(64,p.v/tot*600).toFixed(0)+'px;background:'+bg+'"><b>'+E(p.tk)+'</b><span>'+(d1==null?'sem preço':P(d1,2))+'</span></button>'}).join('')+'</div>';
}
function movers(L){
 let obs=[];try{obs=JSON.parse(localStorage.getItem('dt-observar-v847')||'[]')}catch{}
 const tks=[...new Set([...L.map(p=>p.tk),...obs,...(()=>{try{return w.TRM?.TS?.().mon||[]}catch{return []}})()].map(x=>String(x).toUpperCase()))];
 const q=tks.map(tk=>({tk,q:px(tk)})).filter(x=>x.q&&Number.isFinite(x.q.d1)).sort((a,b)=>b.q.d1-a.q.d1);
 if(q.length<2)return '';
 const li=x=>'<li><button type="button" data-fa-abrir="'+E(x.tk)+'"><span>'+E(x.tk)+'</span><b class="'+(x.q.d1>=0?'pc-pos':'pc-neg')+'">'+P(x.q.d1,2)+'</b></button></li>';
 return '<div class="pc-mov"><div><small>Maiores altas</small><ul>'+q.slice(0,3).map(li).join('')+'</ul></div><div><small>Maiores baixas</small><ul>'+q.slice(-3).reverse().map(li).join('')+'</ul></div></div>';
}
function refs(){
 const L=[['IBOV','Ibovespa'],['USDBRL','Dólar'],['WIN','Mini índice'],['WDO','Mini dólar'],['SPX','S&P 500']].map(([k,n])=>({n,q:px(k)})).filter(x=>x.q);
 return L.length?'<div class="pc-refs">'+L.map(x=>'<span>'+E(x.n)+' <b>'+N(x.q.px,x.q.px>1000?0:2)+'</b> <i class="'+((x.q.d1||0)>=0?'pc-pos':'pc-neg')+'">'+P(x.q.d1,2)+'</i></span>').join('')+'</div>':'';
}
function concentracao(L){
 if(!L.length)return '';
 const s=L.slice().sort((a,b)=>b.peso-a.peso),top=s[0],top3=s.slice(0,3).reduce((a,p)=>a+p.peso,0);
 const setores={};for(const p of L)setores[p.setor]=(setores[p.setor]||0)+p.peso;
 const st=Object.entries(setores).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const barra=(l,v,ref)=>{const pct=Math.min(100,v/ref*100);return '<div class="pc-bar"><span>'+E(l)+'</span><i><em style="width:'+pct.toFixed(0)+'%;background:'+cor(pct)+'"></em></i><b>'+N(v,1)+'%</b></div>'};
 return barra('Maior posição ('+top.tk+')',top.peso,25)+barra('3 maiores juntas',top3,60)+'<small class="pc-mut">Barras em relação a limites prudentes: 25% numa ação, 60% nas três maiores, 40% num setor.</small>'+
  '<div class="pc-set">'+st.map(([k,v])=>barra(k,v,40)).join('')+'</div>';
}
function riscoHtml(){
 if(riscoIdentidade!==riscoKey())risco=null;
 if(calculando)return '<p class="pc-mut">Calculando com candles diários…</p>';
 if(!risco)return '<button type="button" class="pc-btn" data-pc-risco="1">Calcular correlação e perda provável</button><p class="pc-mut">Usa 1 ano de fechamentos diários das suas maiores posições.</p>';
 if(risco.erro)return '<p class="pc-mut">'+E(risco.erro)+'</p><button type="button" class="pc-btn" data-pc-risco="1">Tentar de novo</button>';
 return '<div class="pc-kvs"><div><span>Perda provável em 1 dia (95%)</span><b class="pc-neg">'+N(risco.var,0)+'</b></div><div><span>Em % da carteira</span><b>'+N(risco.varPct,2)+'%</b></div><div><span>Ativos no cálculo</span><b>'+risco.n+'</b></div></div>'+
  (risco.pares.length?'<small class="pc-mut">Andam muito juntos (correlação ≥ 0,7): '+risco.pares.map(p=>E(p[0])+' e '+E(p[1])+' ('+N(p[2],2)+')').join(' · ')+'</small>':'<small class="pc-mut">Nenhum par com correlação alta: posições bem diversificadas entre si.</small>')+
  '<small class="pc-mut">Perda provável: em 95% dos dias do último ano, a carteira de hoje teria perdido menos que isso. Não é garantia.</small>';
}
async function calcularRisco(){
 const identidade=riscoKey(),todos=pos(),L=todos.slice().sort((a,b)=>b.v-a.v).slice(0,10);riscoIdentidade=identidade;if(L.length<2){risco={erro:'Precisa de pelo menos 2 posições.'};return}
 const S=await Promise.all(L.map(p=>w.DiarioTecnico?.serie?.(p.tk,ehBR(p.tk)?'br':'us').catch(()=>null)));
 if(identidade!==riscoKey())return;
 const ok=L.map((p,i)=>({p,s:(S[i]?.closes||[]).filter(c=>Number.isFinite(+c.c)&&+c.c>0&&c.d)})).filter(x=>x.s.length>60);
 if(ok.length<2){risco={erro:'Não consegui os fechamentos diários agora. Tente de novo em instantes.'};return}
 const datas=ok.map(x=>new Map(x.s.map(c=>[c.d,c.c])));
 const comuns=[...datas[0].keys()].filter(k=>datas.every(m=>m.has(k))).sort().slice(-253);
 if(comuns.length<61){risco={erro:'Amostra comum insuficiente: pelo menos 60 retornos alinhados.'};return}
 const ret=ok.map((x,i)=>comuns.slice(1).map((k,j)=>datas[i].get(k)/datas[i].get(comuns[j])-1));
 const tot=ok.reduce((s,x)=>s+x.p.v,0),pesos=ok.map(x=>x.p.v/tot);
 const port=ret[0].map((_,t)=>ret.reduce((s,r,i)=>s+r[t]*pesos[i],0)).sort((a,b)=>a-b);
 const q=port[Math.floor(port.length*.05)]||0;
 const corr=(a,b)=>{const ma=a.reduce((s,x)=>s+x,0)/a.length,mb=b.reduce((s,x)=>s+x,0)/b.length;let c=0,va=0,vb=0;for(let i=0;i<a.length;i++){c+=(a[i]-ma)*(b[i]-mb);va+=(a[i]-ma)**2;vb+=(b[i]-mb)**2}return c/Math.sqrt(va*vb||1)};
 const pares=[];for(let i=0;i<ret.length;i++)for(let j=i+1;j<ret.length;j++){const c=corr(ret[i],ret[j]);if(c>=.7)pares.push([ok[i].p.tk,ok[j].p.tk,c])}
 risco={var:Math.abs(q)*tot,varPct:Math.abs(q)*100,n:ok.length,pares:pares.sort((a,b)=>b[2]-a[2]).slice(0,4),amostra:comuns.length-1,ate:comuns.at(-1),em:Date.now(),coberturaPct:Math.round(10000*tot/todos.reduce((s,p)=>s+p.v,0))/100};
}
function html(){
 const L=pos(),h=new Date().getHours();
 return '<header><h2>'+(h<10?'Abertura do dia':'Sua carteira hoje')+'</h2><span class="ui-badge">toque num ativo para a ficha</span></header>'+refs()+calor(L)+movers(L)+
  (L.length?'<h3 class="pc-h3">Risco da carteira</h3>'+concentracao(L)+'<div data-pc-risco-box>'+riscoHtml()+'</div>':'');
}
function montar(){
 try{if(typeof tab==='undefined'||tab!=='home')return;const alvo=d.querySelector('#app .v829-home .v829-split>.ui-main');if(!alvo)return;
  let el=d.getElementById('pc868');if(!el){el=d.createElement('section');el.id='pc868';el.className='ui-card pc868';alvo.insertBefore(el,alvo.firstChild?.nextSibling||null)}
  el.innerHTML=html();
 }catch{}
}
d.addEventListener('click',e=>{const b=e.target.closest?.('[data-pc-risco]');if(!b)return;e.preventDefault();if(calculando)return;calculando=true;risco=null;
 const box=()=>d.querySelector('[data-pc-risco-box]');if(box())box().innerHTML=riscoHtml();
 calcularRisco().catch(()=>{risco={erro:'Falha ao calcular agora.'}}).finally(()=>{calculando=false;if(box())box().innerHTML=riscoHtml()})});
const agenda=()=>{setTimeout(montar,350);setTimeout(montar,1500)};
w.addEventListener('diario:render',agenda);d.addEventListener('diario:render',agenda);
// O Início é redesenhado pelo painel de sessão sem evento: recoloca se o cartão sumir (só observa a raiz do app).
let obsT=0;new MutationObserver(()=>{if(typeof tab!=='undefined'&&tab==='home'&&!d.getElementById('pc868')){clearTimeout(obsT);obsT=setTimeout(montar,200)}}).observe(d.getElementById('app')||d.body,{childList:true,subtree:false});
const css=d.createElement('style');css.textContent=`
.pc868{font-variant-numeric:tabular-nums}.pc868 header{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.pc868 h2{margin:0;font-size:16px}
.pc-h3{font-size:13px;margin:14px 0 6px;color:var(--ui-tx-2,#E2E8F0)}
.pc-refs{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0;font-size:13px;color:#64748B}.pc-refs b{color:var(--ui-tx-1,#fff)}.pc-refs i{font-style:normal}
.pc-heat{display:flex;flex-wrap:wrap;gap:3px;margin:8px 0}.pc868 .pc-tile{min-height:52px;padding:6px;border-radius:4px;border:0;color:#fff;text-align:left;display:flex;flex-direction:column;justify-content:space-between;min-width:0}.pc-tile b{font-size:13px;white-space:nowrap}.pc-tile span{font-size:12px}
.pc-mov{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:6px 0}.pc-mov small{color:#64748B}.pc-mov ul{list-style:none;margin:4px 0 0;padding:0}.pc868 .pc-mov button{width:100%;display:flex;justify-content:space-between;min-height:40px;background:transparent;border:0;border-bottom:1px solid #1E232E;color:inherit;padding:4px 0}
.pc-pos{color:#10B981}.pc-neg{color:#EF4444}.pc-mut{display:block;color:#64748B;font-size:12px;margin:6px 0}
.pc-bar{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) auto;gap:8px;align-items:center;font-size:13px;margin:4px 0}.pc-bar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pc-bar i{height:6px;background:#181C28;border-radius:3px;overflow:hidden}.pc-bar em{display:block;height:100%}.pc-bar b{text-align:right;min-width:52px}
.pc-set{margin-top:6px}.pc-kvs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0}.pc-kvs span{display:block;color:#64748B;font-size:12px}.pc-kvs b{font-size:16px}
.pc868 .pc-btn{min-height:44px;padding:8px 14px;border-radius:4px;border:1px solid #F59E0B;background:transparent;color:#F59E0B;margin-top:8px}`;
d.head.appendChild(css);
w.DiarioPainelCarteira=Object.freeze({montar,riscoConselho});
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
