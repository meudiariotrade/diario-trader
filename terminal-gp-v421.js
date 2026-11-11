/* Diário de Trader v421 — gráfico do Terminal no estilo Bloomberg (GP / COMP).
 * Cabeçalho do ativo (último, variação, abertura, máxima, mínima, anterior), barra de ferramentas,
 * eixo duplo (L1/R1) ou base 100, razão A/B, médias móveis, eventos-chave (agenda + seus trades),
 * gráficos prontos, tabela e acompanhamento por toque.
 * Dados: somente candles reais do Terminal (TRM.tec.velas / pegaVelas → função "candles", Yahoo). */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const KEY='diario-v421-gp';
const SYMS={IBOV:'Ibovespa',SPX:'S&P 500',NDX:'Nasdaq 100',DXY:'Índice do dólar (DXY)',USDBRL:'Dólar (USD/BRL)',VIX:'VIX',BRENT:'Petróleo Brent',WTI:'Petróleo WTI',OURO:'Ouro',COBRE:'Cobre',PRATA:'Prata',EWZ:'EWZ (ETF Brasil)',PETR4:'Petrobras PN',VALE3:'Vale ON',ITUB4:'Itaú PN',BBAS3:'Banco do Brasil',WEGE3:'WEG',BOVA11:'BOVA11',BTCUSD:'Bitcoin'};
const ECON={'BC:SELIC':['selic','Selic meta (% a.a.)'],'BC:CDI':['cdi','CDI (% a.a.)'],'BC:IPCA12':['ipca12','IPCA 12 meses (%)'],'BC:IPCA':['ipca','IPCA mensal (%)'],'BC:IGPM':['igpm','IGP-M mensal (%)'],'BC:IBCBR':['ibcbr','IBC-Br (prévia do PIB)'],'BC:DESEMP':['desemprego','Desemprego PNAD (%)'],'BC:PTAX':['ptax','Dólar PTAX (R$)']};
const isEcon=s=>!!ECON[s];
const REL={IBOV:['SPX','EWZ','USDBRL','BOVA11','BC:SELIC','BC:IBCBR'],PETR4:['BRENT','WTI','PETR3','PRIO3','EWZ','IBOV'],PETR3:['PETR4','BRENT','IBOV'],VALE3:['COBRE','CSNA3','GGBR4','IBOV','EWZ'],
 ITUB4:['BBDC4','BBAS3','SANB11','IBOV','BC:SELIC'],BBAS3:['ITUB4','BBDC4','IBOV','BC:SELIC'],WEGE3:['IBOV','USDBRL','SPX'],BOVA11:['IBOV','EWZ'],
 USDBRL:['DXY','BC:PTAX','BC:SELIC','IBOV','EWZ'],SPX:['NDX','VIX','DXY','IBOV'],NDX:['SPX','VIX','DXY'],DXY:['USDBRL','OURO','SPX'],VIX:['SPX','NDX'],
 OURO:['DXY','PRATA','USDBRL'],PRATA:['OURO','COBRE'],COBRE:['VALE3','OURO'],BRENT:['WTI','PETR4','USDBRL'],WTI:['BRENT','PETR4'],EWZ:['IBOV','USDBRL','SPX'],BTCUSD:['NDX','OURO','DXY']};
const related=s=>(REL[s]||['IBOV','SPX','USDBRL','DXY']).filter(x=>x!==s);
const PRESETS=[
 ['IBOV','SPX','Ibovespa × S&P 500'],['IBOV','USDBRL','Ibovespa × Dólar'],['EWZ','IBOV','EWZ × Ibovespa'],
 ['PETR4','BRENT','Petrobras × Brent'],['VALE3','COBRE','Vale × Cobre (metais)'],['NDX','VIX','Nasdaq × VIX'],
 ['USDBRL','DXY','Dólar × DXY'],['OURO','DXY','Ouro × DXY'],
 ['IBOV','BC:SELIC','Ibovespa × Selic'],['IBOV','BC:IPCA12','Ibovespa × IPCA 12 meses'],['IBOV','BC:IBCBR','Ibovespa × IBC-Br'],['USDBRL','BC:SELIC','Dólar × Selic']];
const PER=[['1D','5m',1],['3D','15m',3],['1M','60m',31],['6M','1d',183],['YTD','1d',-1],['1A','1d',366],['2A','1d',731],['Máx','1d',99999]];
const def={a:'IBOV',b:'SPX',per:'1A',freq:'D',mode:'dual',ma:[],ev:true,table:false};
let st=(()=>{try{return Object.assign({},def,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return {...def}}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fin=n=>typeof n==='number'&&Number.isFinite(n);
const dec=v=>{const a=Math.abs(v);return a>=10000?0:a<10?4:2};
const nf=(v,d)=>fin(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d??dec(v),maximumFractionDigits:d??dec(v)}):'—';
const pc=v=>fin(v)?(v>0?'+':'')+nf(v,2)+'%':'—';
const name=s=>SYMS[s]||(ECON[s]?ECON[s][1]:s);
const tec=()=>root.TRM?.tec;
const perDef=()=>PER.find(p=>p[0]===st.per)||PER[5];
const ivOf=()=>perDef()[1];
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};

/* ---------- dados ---------- */
const econ=new Map(),econErr=new Map();
try{const c=JSON.parse(localStorage.getItem('diario-v422-econ')||'{}');Object.entries(c).forEach(([k,v])=>{if(v&&Array.isArray(v.pontos))econ.set(k,v)})}catch(e){}
function econSave(){try{const o={};econ.forEach((v,k)=>o[k]=v);localStorage.setItem('diario-v422-econ',JSON.stringify(o))}catch(e){}}
async function fetchEcon(sym,force){
  const id=ECON[sym][0],k=sym;const have=econ.get(k);
  if(!force&&have&&Date.now()-(have.ts||0)<6*36e5)return;
  if(!force&&Date.now()-(asked.get(k)||0)<90000)return;asked.set(k,Date.now());
  try{
    if(typeof rq!=='function')throw Error('Conexão do app indisponível.');
    const r=await rq('/functions/v1/series',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serie:id,desde:new Date().getFullYear()-6})});
    const j=await r.json();if(!Array.isArray(j.pontos))throw Error(j.error||'Resposta inesperada.');
    econ.set(k,{...j,ts:Date.now()});econErr.delete(k);econSave();
  }catch(e){econErr.set(k,e&&e.status===404?'A função "series" ainda não foi publicada no Supabase.':(e&&e.status===401?'Entre na sua conta para carregar os indicadores.':String(e&&e.message||e)))}
}
function bars(sym,iv){
  if(isEcon(sym)){const v=econ.get(sym);return (v?.pontos||[]).map(p=>[p[0],p[1],p[1],p[1],p[1],0])}
  const L=g(()=>tec().velas(sym,iv)?.L,[])||[];
  return L.filter(x=>Array.isArray(x)&&fin(x[0])&&fin(x[4])&&x[4]>0).sort((a,b)=>a[0]-b[0]);
}
function meta(sym,iv){if(isEcon(sym)){const v=econ.get(sym);return v?v.fonte+' · '+v.unidade:''}return g(()=>tec().velas(sym,iv)?.nota||'','')}
function errOf(sym,iv){if(isEcon(sym))return econErr.get(sym)||'';return g(()=>tec().erroVelas?.(sym,iv)||'','')}
const asked=new Map();
async function fetchSym(sym,iv,force){
  if(isEcon(sym))return fetchEcon(sym,force);
  const k=sym+'|'+iv;if(!force&&Date.now()-(asked.get(k)||0)<90000)return;asked.set(k,Date.now());
  try{await tec()?.pegaVelas?.(sym,iv)}catch(e){}
}
function cut(list){
  const p=perDef();if(!list.length)return list;
  const now=Date.now()/1000;let from=-Infinity;
  if(p[2]===-1)from=new Date(new Date().getFullYear(),0,1).getTime()/1000;
  else if(p[2]<99999){
    // intradiário: últimos N pregões presentes na série
    if(p[1]!=='1d'){const days=[...new Set(list.map(x=>new Date(x[0]*1000).toISOString().slice(0,10)))].slice(-p[2]);const first=days[0];return list.filter(x=>new Date(x[0]*1000).toISOString().slice(0,10)>=first)}
    from=now-p[2]*86400;
  }
  return list.filter(x=>x[0]>=from);
}
function resample(list){
  if(st.freq==='D'||ivOf()!=='1d')return list;
  const m=new Map();
  for(const r of list){const d=new Date(r[0]*1000);let k;
    if(st.freq==='M')k=d.getUTCFullYear()+'-'+d.getUTCMonth();
    else{const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7));k=t.toISOString().slice(0,10)}
    const c=m.get(k);if(!c)m.set(k,[r[0],r[1],r[2],r[3],r[4],r[5]||0]);else{c[0]=r[0];c[2]=Math.max(c[2],r[2]);c[3]=Math.min(c[3],r[3]);c[4]=r[4];c[5]+=r[5]||0}}
  return [...m.values()];
}
const sma=(vals,n)=>vals.map((_,i)=>i<n-1?null:vals.slice(i-n+1,i+1).reduce((s,v)=>s+v,0)/n);
function align(A,B){
  if(isEcon(st.b)){let j=0,last=null;const out=[];for(const r of A){while(j<B.length&&B[j][0]<=r[0]+86400){last=B[j];j++}out.push([r,last])}return out}
  // junta pela data (diário) ou pelo horário mais próximo (intradiário)
  const key=t=>ivOf()==='1d'?new Date(t*1000).toISOString().slice(0,10):Math.round(t/300);
  const mb=new Map(B.map(r=>[key(r[0]),r]));
  return A.map(r=>[r,mb.get(key(r[0]))||null]);
}

/* ---------- cabeçalho do ativo ---------- */
function header(sym){
  const d=bars(sym,'1d');const intr=bars(sym,'5m');
  if(!d.length&&!intr.length)return `<div class="gp-hdr"><b class="gp-tk">${esc(sym)}</b><span class="gp-muted">${esc(name(sym))} · sem dados ainda</span></div>`;
  const last=intr.length?intr[intr.length-1]:d[d.length-1];
  const today=d[d.length-1],prev=d.length>1?d[d.length-2][4]:null;
  // candle diário do dia pode estar incompleto: usa intradiário quando houver
  const dayKey=new Date((last[0])*1000).toISOString().slice(0,10);
  const dayBars=intr.filter(x=>new Date(x[0]*1000).toISOString().slice(0,10)===dayKey);
  const o=dayBars.length?dayBars[0][1]:today[1],h=dayBars.length?Math.max(...dayBars.map(x=>x[2])):today[2],l=dayBars.length?Math.min(...dayBars.map(x=>x[3])):today[3];
  const px=last[4];const pv=(new Date(today[0]*1000).toISOString().slice(0,10)===dayKey)?prev:today[4];
  const ch=fin(pv)?px-pv:null,chp=fin(pv)?(px/pv-1)*100:null;
  const at=new Date(last[0]*1000).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
  const up=ch>0,dn=ch<0;
  const spark=d.slice(-30).map(x=>x[4]);let sp='';
  if(spark.length>2){const mn=Math.min(...spark),mx=Math.max(...spark),r=mx-mn||1;sp=`<svg class="gp-spark" viewBox="0 0 60 18" aria-hidden="true"><polyline points="${spark.map((v,i)=>`${(i/(spark.length-1)*60).toFixed(1)},${(17-(v-mn)/r*16).toFixed(1)}`).join(' ')}"/></svg>`}
  return `<div class="gp-hdr" aria-label="Resumo de ${esc(name(sym))}">
   <div class="gp-l1"><b class="gp-tk">${esc(sym)}</b><span class="gp-arrow ${up?'up':dn?'dn':''}">${up?'↑':dn?'↓':'·'}</span><b class="gp-px ${up?'up':dn?'dn':''}">${nf(px)}</b><span class="gp-ch ${up?'up':dn?'dn':''}">${fin(ch)?(ch>0?'+':'')+nf(ch):'—'} <small>${pc(chp)}</small></span>${sp}</div>
   <div class="gp-l2"><em><span class="gp-at">At</span> ${at}</em><em><span>O</span>${nf(o)}</em><em><span>H</span>${nf(h)}</em><em><span>L</span>${nf(l)}</em><em><span>Prev</span>${nf(pv)}</em></div></div>`;
}

/* ---------- gráfico ---------- */
function events(t0,t1,sym){
  const out=[];if(!st.ev)return out;
  try{const a=AG.v[0];(a?.eventos||[]).filter(e=>e.imp===1).forEach(e=>{const t=Date.parse(e.em)/1000;if(t>=t0&&t<=t1)out.push({t,k:'ev',l:String(e.t||'Evento')+(e.p?' ('+e.p+')':'')})})}catch(e){}
  try{const base=s=>String(s||'').toUpperCase().replace(/[FGHJKMNQUVXZ]\d{2}$/,'');const map={IBOV:['WIN','IND','IBOV','BOVA11'],USDBRL:['WDO','DOL','USDBRL']};const ok=map[sym]||[sym];
    (S.trades||[]).forEach(x=>{const b=base(x.ativo);if(!ok.some(o=>b===o||b.startsWith(o)))return;const t=Date.parse(String(x.dt||'').slice(0,16)+':00-03:00')/1000;if(t>=t0&&t<=t1)out.push({t,k:x.side==='C'?'buy':'sell',l:(x.side==='C'?'Compra ':'Venda ')+(x.ativo||'')+(x.setup?' · '+x.setup:'')})})}catch(e){}
  return out.sort((a,b)=>a.t-b.t).slice(-40);
}
let lastGeom=null;

/* v526 — Janela do GP: mantém os candles originais, exibe tempo deslocável e
   eixo de preço ajustável sem alterar os dados carregados. */
const gpView={key:'',count:0,offset:0,max:0,priceZoom:1,priceShift:0,fraction:0};
const VIEWS_KEY='diario-gp-enquadramentos-v531';
let savedViews={};
try { const v=JSON.parse(localStorage.getItem(VIEWS_KEY)||'{}'); if(v&&typeof v==='object'&&!Array.isArray(v)) savedViews=v; } catch(_){}
const gpKey=()=>[st.a,st.b||'',st.per,st.freq,st.mode,ivOf()].join('|');
function viewWrite(){
  try {
    const entries=Object.entries(savedViews).sort((a,b)=>(b[1]?.savedAt||0)-(a[1]?.savedAt||0)).slice(0,25);
    savedViews=Object.fromEntries(entries);
    localStorage.setItem(VIEWS_KEY,JSON.stringify(savedViews));
  } catch(_){}
}
function viewStore(){
  if(!gpView.key)return;
  savedViews[gpView.key]={count:gpView.count,offset:gpView.offset,priceZoom:gpView.priceZoom,priceShift:gpView.priceShift,savedAt:Date.now()};
  viewWrite();
}
function viewRestore(key){
  const v=savedViews[key];if(!v||typeof v!=='object')return false;
  gpView.count=Number(v.count)||gpView.count;
  gpView.offset=Number(v.offset)||0;
  gpView.priceZoom=clip(v.priceZoom,.2,6);
  gpView.priceShift=clip(v.priceShift,-10,10);
  gpView.fraction=0;
  return true;
}
const clip=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
function navInit(all){
  if(all.length<2)return all;
  const key=gpKey();
  if(gpView.key!==key){
    gpView.key=key;
    gpView.count=Math.max(2,resample(cut(bars(st.a,ivOf()))).length);
    gpView.offset=0;gpView.priceZoom=1;gpView.priceShift=0;gpView.fraction=0;
    viewRestore(key);
  }
  gpView.max=all.length;
  gpView.count=Math.max(2,Math.min(gpView.count||all.length,all.length));
  gpView.offset=clip(gpView.offset,0,Math.max(0,all.length-gpView.count));
  return all.slice(all.length-gpView.count-gpView.offset,all.length-gpView.offset);
}
function navPriceBounds(bounds){
  const low=bounds[0],high=bounds[1],span=Math.max(1e-10,high-low);
  const mid=(low+high)/2+gpView.priceShift*span;
  const radius=span*gpView.priceZoom/2;
  return [mid-radius,mid+radius];
}
function navPan(dx,dy,width,height,mode){
  if((mode==='hand'||mode==='time')&&gpView.max>gpView.count){
    gpView.fraction+=dx/Math.max(20,width)*gpView.count;
    const step=Math.trunc(gpView.fraction);
    gpView.fraction-=step;
    const next=clip(gpView.offset+step,0,gpView.max-gpView.count);
    if(next!==gpView.offset+step)gpView.fraction=0;
    gpView.offset=next;
  }
  if(mode==='hand'||mode==='price')
    gpView.priceShift=clip(gpView.priceShift+dy/Math.max(20,height)*gpView.priceZoom,-10,10);
  viewStore();
}
function navZoom(factor,anchor){
  if(gpView.max<2)return;
  const prev=gpView.count;
  const next=clip(Math.round(prev*factor),Math.min(12,gpView.max),gpView.max);
  const a=anchor==null?.5:clip(anchor,0,1);
  gpView.offset=clip(Math.round(gpView.offset+(prev-next)*(1-a)),0,gpView.max-next);
  gpView.count=next;gpView.fraction=0;
  viewStore();
}
function navReset(){
  delete savedViews[gpKey()];viewWrite();
  gpView.key='';gpView.offset=0;gpView.count=0;gpView.max=0;
  gpView.priceZoom=1;gpView.priceShift=0;gpView.fraction=0;
}
function svg(){
  const iv=ivOf();
  const A=navInit(resample(bars(st.a,iv))),B=st.b?(isEcon(st.b)?bars(st.b,iv):resample(bars(st.b,iv))):[];
  const W=720,H=360,L=56,R=62,T=14,Bm=40;const cw=W-L-R,chh=H-T-Bm;
  if(A.length<2){
    const e=errOf(st.a,iv);const login=/conta|login|401/i.test(e)||g(()=>!SESS,false);
    return {html:`<div class="gp-empty"><b>Sem histórico de ${esc(name(st.a))} para ${esc(st.per)}.</b><span>${esc(e||'O app ainda não recebeu os candles deste ativo.')}</span>${login?'<button type="button" data-dt414-go="conta">Entrar na conta</button>':'<button type="button" data-gp="reload">Carregar histórico</button>'}</div>`,ok:false};
  }
  let pa=A.map(r=>r[4]),pb=null,pairs=null;
  if(B.length>=2){pairs=align(A,B);pb=pairs.map(([,b])=>b?b[4]:null)}
  let mode=st.mode;if(!pb)mode='single';if(isEcon(st.b)&&mode!=='single')mode='dual';
  if(pb&&pb.every(v=>v==null)){pb=null;mode='single'}
  // séries no espaço de desenho
  let sa=pa,sb=pb,labelA=st.a,labelB=isEcon(st.b)?ECON[st.b][1].replace(/\s*\(.*\)$/,''):st.b;
  if(mode==='base'){const a0=pa[0];const fb=pb.find(v=>v!=null);sa=pa.map(v=>v/a0*100);sb=pb.map(v=>v==null?null:v/fb*100)}
  if(mode==='ratio'){const r=pairs.map(([a,b])=>b?a[4]/b[4]:null);const f0=r.find(v=>v!=null);sa=r.map(v=>v==null?null:v/f0*100);sb=null;labelA=st.a+' / '+st.b}
  const xs=A.map(r=>r[0]);const t0=xs[0],t1=xs[xs.length-1];
  const X=i=>L+(i/(xs.length-1))*cw;
  const rng=v=>{const f=v.filter(fin);let lo=Math.min(...f),hi=Math.max(...f);const m=(hi-lo)*.08||Math.abs(hi)*.01||1;return [lo-m,hi+m]};
  const both=mode==='base'?rng([...sa,...(sb||[])]):null;
  const [ra0,ra1]=navPriceBounds(both||rng(sa));const [rb0,rb1]=sb?(both?[ra0,ra1]:rng(sb)):[0,1];
  const YA=v=>T+(1-(v-ra0)/(ra1-ra0))*chh, YB=v=>T+(1-(v-rb0)/(rb1-rb0))*chh;
  const path=(s,Y)=>{let d='',pen=false;s.forEach((v,i)=>{if(v==null){pen=false;return}d+=(pen?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1);pen=true});return d};
  const dA=path(sa,YA);const area=dA+`L${X(sa.length-1).toFixed(1)},${(T+chh).toFixed(1)}L${X(0).toFixed(1)},${(T+chh).toFixed(1)}Z`;
  const dB=sb?path(sb,mode==='base'?YA:YB):'';
  // eixos (principal à direita = R1, como no Bloomberg)
  const ticks=(a0,a1,n=6)=>Array.from({length:n},(_,i)=>a0+(a1-a0)*i/(n-1));
  const fmtAx=v=>mode==='base'||mode==='ratio'?nf(v,1):nf(v,Math.abs(v)>=1000?0:Math.abs(v)<10?2:1);
  let grid='',ax='';
  ticks(ra0,ra1).forEach(v=>{const y=YA(v).toFixed(1);grid+=`<path class="gp-g" d="M${L} ${y}H${W-R}"/>`;ax+=`<text class="gp-ax" x="${W-R+8}" y="${(+y+4)}">${fmtAx(v)}</text><path class="gp-tick" d="M${W-R} ${y}h5"/>`});
  if(sb&&mode==='dual')ticks(rb0,rb1).forEach(v=>{const y=YB(v).toFixed(1);ax+=`<text class="gp-ax gp-axl" x="${L-8}" y="${(+y+4)}" text-anchor="end">${fmtAx(v)}</text><path class="gp-tick" d="M${L-5} ${y}h5"/>`});
  // eixo do tempo
  let xl='';const nX=6;
  for(let i=0;i<nX;i++){const idx=Math.round(i*(xs.length-1)/(nX-1));const d=new Date(xs[idx]*1000);const x=X(idx).toFixed(1);
    const lab=iv==='1d'?d.toLocaleDateString('pt-BR',{month:'short',timeZone:'America/Sao_Paulo'}).replace('.',''):d.toLocaleString('pt-BR',{day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
    const yr=iv==='1d'&&(i===0||new Date(xs[Math.round((i-1)*(xs.length-1)/(nX-1))]*1000).getFullYear()!==d.getFullYear())?d.getFullYear():'';
    grid+=`<path class="gp-g" d="M${x} ${T}V${T+chh}"/>`;xl+=`<text class="gp-ax" x="${x}" y="${H-Bm+16}" text-anchor="middle">${lab}</text>${yr?`<text class="gp-ax gp-yr" x="${x}" y="${H-Bm+31}" text-anchor="middle">${yr}</text>`:''}`}
  // médias móveis da série principal (em preço; não em razão)
  let mas='';const colors={20:'#cfab69',50:'#b6b1a6',200:'#ed8c7d'};
  if(mode!=='ratio')st.ma.forEach(n=>{const m=sma(pa,n).map(v=>v==null?null:(mode==='base'?v/pa[0]*100:v));if(m.filter(v=>v!=null).length>1)mas+=`<path class="gp-ma" stroke="${colors[n]}" d="${path(m,YA)}"/>`});
  // eventos-chave
  const evs=events(t0,t1,st.a);let evg='';
  evs.forEach((e,i)=>{let j=0;while(j<xs.length-1&&xs[j+1]<=e.t)j++;const x=X(j).toFixed(1);
    if(e.k==='ev')evg+=`<g class="gp-ev" data-gp-ev="${i}"><path d="M${x} ${T}V${T+chh}"/><rect x="${+x-6}" y="${T+chh-12}" width="12" height="12" rx="2"/><text x="${x}" y="${T+chh-3}" text-anchor="middle">E</text><title>${esc(e.l)}</title></g>`;
    else{const y=YA(sa[j]??sa[sa.length-1]);evg+=`<g class="gp-trade ${e.k}"><path d="${e.k==='buy'?`M${x} ${(y+6).toFixed(1)}l-6 10h12z`:`M${x} ${(y-6).toFixed(1)}l-6 -10h12z`}"/><title>${esc(e.l)}</title></g>`}});
  // etiquetas do último valor nos eixos
  const lastA=sa[sa.length-1],lastB=sb?[...sb].reverse().find(v=>v!=null):null;
  const tagR=`<g class="gp-tag gp-tag-a"><rect x="${W-R+2}" y="${(YA(lastA)-9).toFixed(1)}" width="${R-4}" height="18" rx="2"/><text x="${W-R/2}" y="${(YA(lastA)+4).toFixed(1)}" text-anchor="middle">${fmtAx(lastA)}</text></g>`;
  const tagL=lastB!=null?(mode==='dual'?`<g class="gp-tag gp-tag-b"><rect x="2" y="${(YB(lastB)-9).toFixed(1)}" width="${L-4}" height="18" rx="2"/><text x="${L/2}" y="${(YB(lastB)+4).toFixed(1)}" text-anchor="middle">${fmtAx(lastB)}</text></g>`:`<g class="gp-tag gp-tag-b"><rect x="${W-R+2}" y="${(YA(lastB)-9).toFixed(1)}" width="${R-4}" height="18" rx="2"/><text x="${W-R/2}" y="${(YA(lastB)+4).toFixed(1)}" text-anchor="middle">${fmtAx(lastB)}</text></g>`):'';
  const legendRows=[[labelA,mode==='dual'?'R1':'',sa[sa.length-1],'#fff']].concat(sb?[[labelB,mode==='dual'?'L1':'',lastB,'#6d9ac1']]:[]);
  const legend=`<g class="gp-legend"><rect x="${L+8}" y="${T+6}" width="210" height="${18+legendRows.length*16}" rx="3"/><text class="gp-lt" x="${L+113}" y="${T+19}" text-anchor="middle">${mode==='base'?'Base 100':mode==='ratio'?'Razão (base 100)':'Último preço'}</text>${legendRows.map((r,i)=>`<rect x="${L+16}" y="${T+26+i*16}" width="9" height="9" fill="${r[3]}"/><text class="gp-lv" x="${L+30}" y="${T+34+i*16}">${esc(r[0])}${r[1]?' ('+r[1]+')':''}</text><text class="gp-lv" x="${L+210}" y="${T+34+i*16}" text-anchor="end">${fmtAx(r[2])}</text>`).join('')}</g>`;
  lastGeom={xs,A,B:pairs,sa,sb,X,L,R,W,T,chh,mode,fmtAx};
  return {html:`<svg class="gp-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de ${esc(labelA)}${sb?' e '+esc(labelB):''}, período ${esc(st.per)}">
    <defs><clipPath id="gp421-plot-clip"><rect x="${L}" y="${T}" width="${cw}" height="${chh}"/></clipPath></defs>
    <rect class="gp-bg" x="${L}" y="${T}" width="${cw}" height="${chh}"/>${grid}
    <g class="gp-view-series" clip-path="url(#gp421-plot-clip)"><path class="gp-area" d="${area}"/>${dB?`<path class="gp-lb" d="${dB}"/>`:''}<path class="gp-la" d="${dA}"/>${mas}${evg}</g>
    <path class="gp-frame" d="M${L} ${T}V${T+chh}H${W-R}V${T}"/>${ax}${xl}${tagR}${tagL}${legend}
    <g class="gp-cross" hidden><path class="gp-cv" d=""/><rect class="gp-cbox" rx="3"/><text class="gp-ct"></text></g></svg>`,ok:true};
}
function table(){
  const iv=ivOf();const A=resample(cut(bars(st.a,iv))),B=st.b?(isEcon(st.b)?bars(st.b,iv):resample(cut(bars(st.b,iv)))):[];
  if(!A.length)return '<div class="gp-empty"><b>Sem dados para a tabela.</b></div>';
  const rows=(B.length?align(A,B):A.map(a=>[a,null])).slice(-60).reverse();
  const fd=t=>new Date(t*1000).toLocaleString('pt-BR',iv==='1d'?{day:'2-digit',month:'2-digit',year:'2-digit'}:{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `<div class="gp-tablewrap"><table class="gp-table"><thead><tr><th>Data</th><th>${esc(st.a)}</th><th>Var.</th>${B.length?`<th>${esc(isEcon(st.b)?ECON[st.b][1]:st.b)}</th><th>Var.</th>`:''}</tr></thead><tbody>${rows.map(([a,b],i)=>{const pa=rows[i+1]?.[0]?.[4],pb=rows[i+1]?.[1]?.[4];return `<tr><td>${fd(a[0])}</td><td>${nf(a[4])}</td><td class="${a[4]>=pa?'up':'dn'}">${pa?pc((a[4]/pa-1)*100):''}</td>${B.length?`<td>${b?nf(b[4]):'—'}</td><td class="${b&&pb?(b[4]>=pb?'up':'dn'):''}">${b&&pb?pc((b[4]/pb-1)*100):''}</td>`:''}</tr>`}).join('')}</tbody></table></div>`;
}

/* ---------- componente ---------- */
const opt=(sel,allowNone)=>(allowNone?`<option value=""${!sel?' selected':''}>— nenhum —</option>`:'')+`<optgroup label="Ativos">`+Object.keys(SYMS).map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(k)} · ${esc(SYMS[k])}</option>`).join('')+`</optgroup>`+(allowNone?`<optgroup label="Indicadores (Banco Central)">`+Object.keys(ECON).map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(ECON[k][1])}</option>`).join('')+`</optgroup>`:'')+(sel&&!SYMS[sel]&&!ECON[sel]?`<option value="${esc(sel)}" selected>${esc(sel)}</option>`:'');
function shell(){
  return `<section id="v421-gp" class="gp" aria-label="Gráfico do Terminal">
  <div class="gp-head" data-gp-head></div>
  <div class="gp-bar1">
    <span class="gp-type">Gráfico de linha</span>
    <label class="gp-sel gp-a"><span class="sr">Ativo principal</span><select data-gp-a>${opt(st.a)}</select></label>
    <div class="gp-menuwrap"><button type="button" class="gp-btn" data-gp="presets" aria-expanded="false">Gráficos prontos ▾</button><div class="gp-menu" data-gp-menu hidden>${PRESETS.map(([a,b,l],i)=>`<button type="button" data-gp-preset="${i}">${esc(l)}</button>`).join('')}</div></div>
    <div class="gp-seg" role="group" aria-label="Escala"><button type="button" data-gp-mode="dual">Eixo duplo</button><button type="button" data-gp-mode="base">Base 100</button><button type="button" data-gp-mode="ratio">Razão A/B</button></div>
  </div>
  <div class="gp-bar2">
    <div class="gp-per" role="group" aria-label="Período">${PER.map(([p])=>`<button type="button" data-gp-per="${p}">${p}</button>`).join('')}</div>
    <select class="gp-freq" data-gp-freq aria-label="Frequência"><option value="D">Diário</option><option value="S">Semanal</option><option value="M">Mensal</option></select>
    <div class="gp-ma-group" role="group" aria-label="Médias móveis"><span>Médias</span>${[20,50,200].map(n=>`<button type="button" data-gp-ma="${n}">${n}</button>`).join('')}</div>
    <button type="button" class="gp-chk" data-gp="ev"><i></i>Eventos-chave</button>
    <button type="button" class="gp-btn" data-gp="table">Tabela</button>
  </div>
  <div class="gp-bar3">
    <label class="gp-sel gp-b"><span>+ Adicionar dado</span><select data-gp-b>${opt(st.b,true)}</select></label>
    <div class="gp-menuwrap"><button type="button" class="gp-btn" data-gp="rel" aria-expanded="false">Relacionados ▾</button><div class="gp-menu" data-gp-relmenu hidden></div></div>
    <label class="gp-free"><input type="text" data-gp-free placeholder="outro ticker (ex.: ITUB4, AAPL, GC=F)" autocapitalize="characters" spellcheck="false" aria-label="Adicionar outro ticker"><button type="button" data-gp="free">OK</button></label>
    <button type="button" class="gp-btn gp-icon" data-gp="reload" aria-label="Atualizar histórico">↻</button>
    <button type="button" class="gp-btn gp-icon" data-gp="full" aria-label="Tela cheia">⤢</button>
    <button type="button" class="gp-btn gp-icon" data-gp="help" aria-label="Ajuda do Terminal">?</button>
  </div>
  <div class="gp-navigation" role="toolbar" aria-label="Mover e ajustar o gráfico">
    <button type="button" data-gp-nav="hand" title="Deslocar preço e tempo juntos" aria-pressed="true">✋ Mover</button>
    <button type="button" data-gp-nav="price" title="Arrastar apenas a escala de preço" aria-pressed="false">↕ Preço</button>
    <button type="button" data-gp-nav="time" title="Arrastar apenas as datas" aria-pressed="false">↔ Tempo</button>
    <button type="button" data-gp-nav="zin" title="Ampliar o período visível" aria-label="Mais zoom">＋</button>
    <button type="button" data-gp-nav="zout" title="Afastar o gráfico" aria-label="Menos zoom">－</button>
    <button type="button" data-gp-nav="reset" title="Restaurar preço e tempo" aria-label="Restaurar gráfico">⟲</button>
  </div>
  <div class="gp-plot" data-gp-plot></div>
  <div class="gp-source-warning" data-gp-source-status role="status" aria-live="polite" hidden></div>
  <footer class="gp-foot" data-gp-foot></footer>
  </section>`;
}
function syncControls(el){
  el.querySelectorAll('[data-gp-nav="hand"],[data-gp-nav="price"],[data-gp-nav="time"]').forEach(b=>
    b.setAttribute('aria-pressed',String((st.navMode||'hand')===b.dataset.gpNav)));
  el.querySelectorAll('[data-gp-per]').forEach(b=>b.classList.toggle('on',b.dataset.gpPer===st.per));
  el.querySelectorAll('[data-gp-mode]').forEach(b=>{const m=isEcon(st.b)?'dual':st.mode;b.classList.toggle('on',b.dataset.gpMode===m);b.disabled=!st.b||(isEcon(st.b)&&b.dataset.gpMode!=='dual')});
  el.querySelectorAll('[data-gp-ma]').forEach(b=>b.classList.toggle('on',st.ma.includes(+b.dataset.gpMa)));
  el.querySelector('[data-gp="ev"]')?.classList.toggle('on',st.ev);
  el.querySelector('[data-gp="table"]')?.classList.toggle('on',st.table);
  const f=el.querySelector('[data-gp-freq]');if(f){f.value=st.freq;f.disabled=ivOf()!=='1d'}
  const a=el.querySelector('[data-gp-a]');if(a&&a.value!==st.a)a.innerHTML=opt(st.a);
  const b=el.querySelector('[data-gp-b]');if(b&&b.value!==(st.b||''))b.innerHTML=opt(st.b,true);
}
function paint(){
  const el=doc.getElementById('v421-gp');if(!el)return;
  syncControls(el);
  el.querySelector('[data-gp-head]').innerHTML=header(st.a);
  const plot=el.querySelector('[data-gp-plot]');
  if(st.table){plot.innerHTML=table();lastGeom=null}else{const r=svg();plot.innerHTML=r.html}
  const iv=ivOf(),na=bars(st.a,iv).length,nb=st.b?bars(st.b,iv).length:0;
  const notes=[meta(st.a,iv),st.b?meta(st.b,iv):''].filter(Boolean);
  const error=errOf(st.a,iv),secondaryError=st.b?errOf(st.b,iv):'';
  const sourceWarning=[error?st.a+': '+error:'',secondaryError?st.b+': '+secondaryError:''].filter(Boolean).join(' · ').slice(0,250);
  const gpNotice=el.querySelector('[data-gp-source-status]');
  if(gpNotice){
    gpNotice.hidden=!sourceWarning;
    gpNotice.textContent=sourceWarning?'Fonte indisponível ou com falha — '+sourceWarning+' · Atualize o histórico para tentar novamente.':'';
  }
  el.querySelector('[data-gp-foot]').innerHTML=`<span>${esc(name(st.a))}${st.b?' × '+esc(name(st.b)):''} · ${iv==='1d'?'diário':iv} · ${na}${st.b?'/'+nb:''} pontos · Yahoo Finance (com atraso)${isEcon(st.b)?' · indicador: Banco Central (SGS), vale até a próxima divulgação':''}</span>${notes.length?`<span class="gp-note">${esc([...new Set(notes)].join(' · '))}</span>`:''}${st.b&&isEcon(st.b)&&econErr.get(st.b)?`<span class="gp-err">${esc(econErr.get(st.b))}</span>`:''}${ivOf()==='1d'&&['Máx','2A'].includes(st.per)?'<span class="gp-note">A fonte gratuita entrega até 2 anos de histórico diário.</span>':''}`;
}
async function load(force){
  const iv=ivOf();const jobs=[fetchSym(st.a,iv,force)];if(st.b)jobs.push(fetchSym(st.b,iv,force));
  // cabeçalho usa diário + 5 min
  jobs.push(fetchSym(st.a,'1d',force));if(iv!=='5m')jobs.push(fetchSym(st.a,'5m',force));
  paint();await Promise.allSettled(jobs);paint();
}
function mount(){
  // v428: outra camada pode indicar onde o gráfico fica (ex.: Mercado → Cotações); sem isso, Terminal como antes
  const host=g(()=>root.V428_gpHost&&root.V428_gpHost(),null);
  let ref=null,dash=null;
  if(host&&host.ref){ref=host.ref}
  else{
    if(g(()=>tab,'')!=='term')return;
    dash=doc.getElementById('tf413');if(!dash)return;
    ref=dash.querySelector('.tf413-main');if(!ref)return;
  }
  const ex=doc.getElementById('v421-gp');
  if(ex){if(ex.nextElementSibling!==ref&&ref.parentNode)ref.before(ex);return}
  const wrap=doc.createElement('div');wrap.innerHTML=shell();
  ref.before(wrap.firstElementChild);
  if(dash)dash.classList.add('v421-has-gp');
  try{root.V428_gpMounted&&root.V428_gpMounted()}catch(e){}
  load(false);
}
// v428: leitura e troca do que o gráfico mostra (cada sub-aba guarda o seu)
root.DIARIO_V421={get:()=>JSON.parse(JSON.stringify(st)),set:o=>{Object.assign(st,o||{});save();try{syncControls()}catch(e){};load(false)},syms:SYMS,econ:ECON,presets:PRESETS};

/* ---------- interação ---------- */
doc.addEventListener('click',e=>{
  const el=e.target.closest('#v421-gp');if(!el)return;
  const t=e.target.closest('[data-gp],[data-gp-per],[data-gp-mode],[data-gp-ma],[data-gp-preset],[data-gp-rel],[data-gp-nav]');if(!t)return;
  e.preventDefault();
  if(t.dataset.gpNav){
    const mode=t.dataset.gpNav;
    if(['hand','price','time'].includes(mode)){st.navMode=mode;save();syncControls(el);return}
    if(mode==='zin')navZoom(.75,.5);
    if(mode==='zout')navZoom(1.33,.5);
    if(mode==='reset')navReset();
    paint();return;
  }
  if(t.dataset.gpRel){st.b=t.dataset.gpRel;if(st.mode==='single')st.mode='dual';save();const m=el.querySelector('[data-gp-relmenu]');m.hidden=true;el.querySelector('[data-gp="rel"]').setAttribute('aria-expanded','false');load(false);return}
  if(t.dataset.gpPer){st.per=t.dataset.gpPer;save();load(false);return}
  if(t.dataset.gpMode){st.mode=t.dataset.gpMode;save();paint();return}
  if(t.dataset.gpMa){const n=+t.dataset.gpMa;st.ma=st.ma.includes(n)?st.ma.filter(x=>x!==n):[...st.ma,n];save();paint();return}
  if(t.dataset.gpPreset!=null){const p=PRESETS[+t.dataset.gpPreset];st.a=p[0];st.b=p[1];if(st.mode==='single')st.mode='dual';save();el.querySelector('[data-gp-menu]').hidden=true;el.querySelector('[data-gp="presets"]').setAttribute('aria-expanded','false');load(false);return}
  const a=t.dataset.gp;
  if(a==='presets'){const m=el.querySelector('[data-gp-menu]');m.hidden=!m.hidden;t.setAttribute('aria-expanded',String(!m.hidden));if(!m.hidden){const r=t.getBoundingClientRect();const w=Math.min(260,innerWidth-16);m.style.width=w+'px';m.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';const below=r.bottom+4;const h=m.offsetHeight;m.style.top=(below+h>innerHeight-8?Math.max(8,r.top-h-4):below)+'px'}return}
  if(a==='rel'){const m=el.querySelector('[data-gp-relmenu]');m.innerHTML=`<p class="gp-menuhead">Comparar ${esc(st.a)} com</p>`+related(st.a).map(x=>`<button type="button" data-gp-rel="${esc(x)}">${esc(isEcon(x)?ECON[x][1]:x+' · '+name(x))}</button>`).join('');m.hidden=!m.hidden;t.setAttribute('aria-expanded',String(!m.hidden));if(!m.hidden){const r=t.getBoundingClientRect();const w=Math.min(280,innerWidth-16);m.style.width=w+'px';m.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';const h=m.offsetHeight;m.style.top=(r.bottom+4+h>innerHeight-8?Math.max(8,r.top-h-4):r.bottom+4)+'px'}return}
  if(a==='ev'){st.ev=!st.ev;save();paint();return}
  if(a==='table'){st.table=!st.table;save();paint();return}
  if(a==='reload'){load(true);return}
  if(a==='help'){const h=doc.querySelector('#tf413 .tf413-main [data-tf413-cmd="HELP"]');if(h)h.click();else{const i=doc.getElementById('trcmd');if(i){i.value='HELP';i.closest('.trcmdw')?.querySelector('[data-tr="go"]')?.click()}}return}
  if(a==='full'){el.classList.toggle('gp-full');doc.body.classList.toggle('gp-noscroll',el.classList.contains('gp-full'));paint();return}
  if(a==='free'){const i=el.querySelector('[data-gp-free]');const v=String(i.value||'').trim().toUpperCase().replace(/[^A-Z0-9=.^:!-]/g,'').slice(0,16);if(v){st.b=v;save();i.value='';load(false)}return}
});
doc.addEventListener('change',e=>{
  const el=e.target.closest('#v421-gp');if(!el)return;
  if(e.target.matches('[data-gp-a]')){st.a=e.target.value;save();load(false)}
  if(e.target.matches('[data-gp-b]')){st.b=e.target.value||'';save();load(false)}
  if(e.target.matches('[data-gp-freq]')){st.freq=e.target.value;save();paint()}
});
addEventListener('scroll',()=>{const rm=doc.querySelector('#v421-gp [data-gp-relmenu]');if(rm&&!rm.hidden)rm.hidden=true;const m=doc.querySelector('#v421-gp [data-gp-menu]');if(m&&!m.hidden){m.hidden=true;doc.querySelector('#v421-gp [data-gp="presets"]')?.setAttribute('aria-expanded','false')}},{passive:true});
doc.addEventListener('keydown',e=>{
  if(e.key==='Escape'){const el=doc.querySelector('#v421-gp.gp-full');if(el){el.classList.remove('gp-full');doc.body.classList.remove('gp-noscroll');paint()}}
  if(e.key==='Enter'&&e.target.matches?.('#v421-gp [data-gp-free]')){e.preventDefault();e.target.parentElement.querySelector('[data-gp="free"]').click()}
});
doc.addEventListener('click',e=>{if(!e.target.closest('.gp-menuwrap')){const r=doc.querySelector('#v421-gp [data-gp-relmenu]');if(r&&!r.hidden){r.hidden=true;doc.querySelector('#v421-gp [data-gp="rel"]')?.setAttribute('aria-expanded','false')}const m=doc.querySelector('#v421-gp [data-gp-menu]');if(m&&!m.hidden){m.hidden=true;doc.querySelector('#v421-gp [data-gp="presets"]')?.setAttribute('aria-expanded','false')}}});

/* v526 — Mouse e toque no GP principal. Prévia acompanha a mão;
   apenas ao soltar são recalculados os pontos e os dois eixos. */
let gpDrag=null;
const pointOf=e=>({x:e.clientX,y:e.clientY});
const gapOf=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function gpPointerDown(e){
  const svgEl=e.target.closest?.('#v421-gp .gp-svg');
  if(!svgEl||e.button>0||st.table)return;
  const rect=svgEl.getBoundingClientRect();
  if(rect.width<20||rect.height<20)return;
  if(!gpDrag||gpDrag.svg!==svgEl)
    gpDrag={svg:svgEl,rect,points:new Map(),starts:new Map(),pinch:false,startPinch:null,finalPinch:null};
  gpDrag.points.set(e.pointerId,pointOf(e));
  gpDrag.starts.set(e.pointerId,pointOf(e));
  if(gpDrag.points.size===2){
    gpDrag.pinch=true;
    gpDrag.startPinch=[...gpDrag.points.values()].map(p=>({...p}));
    gpDrag.finalPinch=gpDrag.startPinch;
    gpDrag.svg.querySelector('.gp-view-series')?.removeAttribute('transform');
  }
  try{svgEl.setPointerCapture?.(e.pointerId)}catch(_){}
  if(e.cancelable)e.preventDefault();
  e.stopPropagation();
}
function gpPointerMove(e){
  const d=gpDrag;
  if(!d||!d.points.has(e.pointerId))return;
  d.points.set(e.pointerId,pointOf(e));
  if(e.cancelable)e.preventDefault();
  e.stopImmediatePropagation();
  if(d.pinch){
    if(d.points.size===2)d.finalPinch=[...d.points.values()].map(p=>({...p}));
    return;
  }
  const p=[...d.points.values()][0],start=[...d.starts.values()][0];
  const dx=p.x-start.x,dy=p.y-start.y;
  const mode=st.navMode||'hand';
  const x=mode==='price'?0:clip(dx/d.rect.width*720,-720,720);
  const y=mode==='time'?0:clip(dy/d.rect.height*360,-360,360);
  const series=d.svg.querySelector('.gp-view-series');
  if(series)series.setAttribute('transform','translate('+x.toFixed(2)+','+y.toFixed(2)+')');
}
function gpPointerFinish(e,cancelled){
  const d=gpDrag;
  if(!d||!d.points.has(e.pointerId))return;
  d.points.set(e.pointerId,pointOf(e));
  if(e.cancelable)e.preventDefault();
  e.stopImmediatePropagation();
  if(d.pinch&&d.points.size===2)d.finalPinch=[...d.points.values()].map(p=>({...p}));
  d.points.delete(e.pointerId);
  if(d.points.size)return;
  gpDrag=null;
  d.svg.querySelector('.gp-view-series')?.removeAttribute('transform');
  if(cancelled)return;
  if(d.pinch&&d.startPinch&&d.finalPinch){
    const initial=gapOf(...d.startPinch),final=gapOf(...d.finalPinch);
    if(initial>18&&final>18&&Math.abs(initial-final)>7){
      const anchor=clip(((d.startPinch[0].x+d.startPinch[1].x)/2-d.rect.left)/d.rect.width,0,1);
      navZoom(clip(initial/final,.4,2.5),anchor);
      paint();
    }
    return;
  }
  const start=[...d.starts.values()][0],dx=e.clientX-start.x,dy=e.clientY-start.y;
  if(Math.hypot(dx,dy)<6)return;
  navPan(dx,dy,d.rect.width,d.rect.height,st.navMode||'hand');
  paint();
}
doc.addEventListener('pointerdown',gpPointerDown,true);
doc.addEventListener('pointermove',gpPointerMove,{capture:true,passive:false});
doc.addEventListener('pointerup',e=>gpPointerFinish(e,false),true);
doc.addEventListener('pointercancel',e=>gpPointerFinish(e,true),true);
root.addEventListener('blur',()=>{
  gpDrag?.svg?.querySelector('.gp-view-series')?.removeAttribute('transform');
  gpDrag=null;
});
doc.addEventListener('wheel',e=>{
  const svgEl=e.target.closest?.('#v421-gp .gp-svg');
  if(!(e.ctrlKey||e.metaKey)||!svgEl)return;
  const rect=svgEl.getBoundingClientRect();
  if(e.cancelable)e.preventDefault();
  e.stopImmediatePropagation();
  navZoom(e.deltaY<0?.85:1.18,clip((e.clientX-rect.left)/Math.max(20,rect.width),0,1));
  paint();
},{capture:true,passive:false});

// acompanhamento (Track) por toque ou mouse
function track(ev){
  const svgEl=ev.target.closest?.('#v421-gp .gp-svg');if(!svgEl||!lastGeom)return;
  const pt=(ev.touches?ev.touches[0]:ev);const r=svgEl.getBoundingClientRect();
  const G=lastGeom;const vx=(pt.clientX-r.left)/r.width*G.W;
  let i=Math.round((vx-G.L)/(G.W-G.L-G.R)*(G.xs.length-1));i=Math.max(0,Math.min(G.xs.length-1,i));
  const x=G.X(i);const c=svgEl.querySelector('.gp-cross');c.hidden=false;
  c.querySelector('.gp-cv').setAttribute('d',`M${x.toFixed(1)} ${G.T}V${G.T+G.chh}`);
  const d=new Date(G.xs[i]*1000).toLocaleString('pt-BR',ivOf()==='1d'?{day:'2-digit',month:'2-digit',year:'numeric'}:{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const va=G.A[i][4],vb=G.B?.[i]?.[1]?.[4];
  const txt=`${d} · ${st.a} ${nf(va)}${vb!=null?' · '+st.b+' '+nf(vb):''}`;
  const tEl=c.querySelector('.gp-ct');tEl.textContent=txt;
  const w=Math.min(G.W-20,txt.length*6.6+16);let bx=x+10;if(bx+w>G.W-G.R)bx=x-10-w;
  tEl.setAttribute('x',(bx+8).toFixed(1));tEl.setAttribute('y',(G.T+G.chh-12).toFixed(1));
  const box=c.querySelector('.gp-cbox');box.setAttribute('x',bx.toFixed(1));box.setAttribute('y',(G.T+G.chh-28).toFixed(1));box.setAttribute('width',w.toFixed(1));box.setAttribute('height','22');
}
doc.addEventListener('pointermove',track,{passive:true});
doc.addEventListener('touchmove',e=>{if(e.target.closest?.('#v421-gp .gp-svg'))track(e)},{passive:true});
doc.addEventListener('pointerleave',e=>{const c=doc.querySelector('#v421-gp .gp-cross');if(c&&e.target===doc.documentElement)c.hidden=true},true);

/* ---------- montagem ---------- */
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v421)return false;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{mount()}catch(e){console.warn('v421',e)}return o};f.__v421=1;root.render0=f;return true;
}
hook();
// o painel do Terminal é montado de forma assíncrona; confere só enquanto a aba Terminal estiver aberta
setInterval(()=>{if(doc.hidden)return;if(g(()=>tab,'')==='term'||g(()=>root.V428_gpHost&&root.V428_gpHost(),null)){if(!root.render0?.__v421)hook();mount()}},1200);
// atualiza o preço do cabeçalho e o gráfico sem redesenhar a página
setInterval(()=>{if(!doc.hidden&&g(()=>tab,'')==='term'&&doc.getElementById('v421-gp'))load(false)},60000);
root.DIARIO_GP421={paint,load,state:()=>st,view:()=>({...gpView}),reset:navReset};
})(window);
