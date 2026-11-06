/* Diário de Trader v420 — telas novas de Início, Meu dia, Operações e Diário.
 * Os valores vêm somente dos dados reais do app (trades, dias, regras, cotações já recebidas).
 * O conteúdo antigo NÃO é apagado: fica no DOM, com os mesmos handlers, organizado
 * em abas de "Ferramentas". Sub-abas internas ganham uma barra nova que aciona os botões originais.
 * Carregar por último (defer), depois de ajustes-v419.js. */
(function(){
'use strict';
const doc=document;
window.DIARIO_V420=1;

/* ---------- utilidades ---------- */
const I={
 home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 trade:'<path d="M4 7h16m-5-4 5 4-5 4M20 17H4m5-4-5 4 5 4"/>',
 bars:'<path d="M4 20v-4m5 4v-8m5 8V8m5 12V4"/>',
 book:'<path d="M12 6c-3-2-6-2-10-2v16c4 0 7 0 10 2m0-16c3-2 6-2 10-2v16c-4 0-7 0-10 2z"/>',
 monitor:'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
 grad:'<path d="m2 10 10-5 10 5-10 5zm4 3v5c4 3 8 3 12 0v-5m4-3v8"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 checksq:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
 news:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h9M8 11h9M8 15h5M5 7h1M5 11h1M5 15h1"/>',
 alert:'<path d="m12 3 10 18H2zm0 6v5m0 3v.1"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 shield:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
 up:'<path d="m4 17 6-6 4 4 6-8M15 7h5v5"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
 plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 sliders:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
 right:'<path d="m9 5 7 7-7 7"/>',
 left:'<path d="m15 5-7 7 7 7"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 folder:'<path d="M3 6h6l2 2h10v11H3z"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
 crosshair:'<circle cx="12" cy="12" r="8"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="2"/>',
 doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
 warn:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v.1"/>',
 pencil:'<path d="m4 17 11-11 4 4L8 21H4zm9-9 4 4"/>',
 coins:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"/>',
 wallet:'<path d="M3 7h16v12H3zM3 7l12-3v3M16 13h2"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 2 4 4 4m8-4h4c0 3-2 4-4 4M12 13v4m-4 4h8"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
 list:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 tools:'<path d="M14 7a4 4 0 0 1-5 5l-6 6 3 3 6-6a4 4 0 0 1 5-5l-3-3 3-3a4 4 0 0 0-3 3z"/>'
};
const ic=(n,s=20)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]||I.bars}</svg>`;
const esc_=v=>{try{if(typeof esc==='function')return esc(v)}catch(e){}return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
const brl=n=>Number.isFinite(+n)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(+n):'—';
const sbrl=n=>Number.isFinite(+n)?(n>0?'+':'')+brl(n):'—';
const pct=(n,d=2)=>Number.isFinite(n)?(n>0?'+':'')+n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%':'—';
const num=(n,d=2)=>Number.isFinite(+n)?(+n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const px=n=>{if(n===''||n==null)return '—';n=+n;if(!Number.isFinite(n))return '—';const a=Math.abs(n),d=a>=100000?0:a<10?4:2;return n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})};
const cls=n=>n>0?'v-pos':n<0?'v-neg':'';
const g=(fn,def)=>{try{const v=fn();return v===undefined?def:v}catch(e){return def}};
const cur=()=>g(()=>tab,'');
const today=()=>g(()=>loc().slice(0,10),new Date().toISOString().slice(0,10));
const dayKey=()=>g(()=>typeof D==='string'?D:today(),today());
const isUS=()=>g(()=>typeof MDM!=='undefined'&&MDM==='us',false);
const trades=()=>g(()=>Array.isArray(S.trades)?S.trades:[],[]);
const tdate=t=>String(t.dtx||t.dt||'').slice(0,10);
const pl=t=>g(()=>{const c=typeof cBRL==='function'?cBRL(t):calc(t);return Number.isFinite(c?.pl)?c.pl:null},null);
const rr=t=>g(()=>{const n=calc(t).r;return Number.isFinite(n)?n:null},null);
const risk=t=>g(()=>{const n=calc(t).risk;return Number.isFinite(n)?n:0},0);
const open=t=>g(()=>isOpen(t),false);
const closedOn=d=>trades().filter(t=>pl(t)!==null&&(!d||tdate(t)===d));
const openTrades=()=>trades().filter(open);
const sum=(a,f)=>a.reduce((s,x)=>s+(f(x)||0),0);
const capital=()=>g(()=>{const rs=['D','S','O'].map(t=>capCalc(t)).filter(Boolean);if(rs.length)return rs.reduce((s,x)=>s+x.at,0);const raw=+S?.prop?.cap;return raw>0?raw:null},null);
const day=(d=dayKey())=>g(()=>{const x=S.days[d]||{};return isUS()?(x.us||{}):x},{});
const rules=()=>g(()=>isUS()?(Array.isArray(S.rulesUS)?S.rulesUS:S.rules||[]):S.rules||[],[]);
const phaseOf=r=>['pre','during','post'].includes(r?.phase)?r.phase:([0,2].includes(Number(r?.cat))?'pre':'during');
const goal=()=>{const v=+day().metaDia;return v>0?v:null};
const lossLimit=()=>{const v=+day().maxP;if(v>0)return v;const p=g(()=>+S.prop.perdaDia,0);return p>0?p:null};
const maxTrades=()=>{const v=+(day().pl2||{}).max;if(v>0)return v;const c=g(()=>pCore([],0).nd,null);return c>0?c:null};
const dfmt=d=>String(d).split('-').reverse().join('/');
const fmtLong=d=>new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
const pctCap=v=>{const c=capital();return c&&Number.isFinite(v)?v/c*100:null};
const weekStart=()=>g(()=>segundaDe(today()),today().slice(0,8)+'01');

/* Horário da B3 (Brasília) */
function marketPhase(){
  try{
    const p=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',weekday:'short',hour12:false}).formatToParts(new Date());
    const v=t=>(p.find(x=>x.type===t)||{}).value||'';const m=(+v('hour'))*60+(+v('minute'));
    if(/s[áa]b|dom/i.test(v('weekday')))return 'fechado';
    if(m<9*60)return 'pre';if(m<=18*60+25)return 'pregao';return 'pos';
  }catch(e){return 'pregao'}
}

/* Cotações: só valores já recebidos pelo app (Cotações, Terminal, ADRs). */
const ALIAS={IBOV:['IBOV','TVC:IBOV','BMFBOVESPA:IBOV','^BVSP'],'S&P 500':['SPX','SP:SPX','S&P 500','US500','^GSPC'],NASDAQ:['NDX','NASDAQ:NDX','NAS100','IXIC','^IXIC'],DXY:['DXY','TVC:DXY'],'USD/BRL':['USDBRL','FX_IDC:USDBRL','USD/BRL','BRL=X'],PETR4:['PETR4','BMFBOVESPA:PETR4'],'DI Jan/27':['DI1F27','BMFBOVESPA:DI1F2027','DI1F2027']};
function quote(sym){
  const ids=(ALIAS[sym]||[sym]).map(s=>s.toUpperCase());let best=null;
  const take=(it,ts)=>{const keys=[it?.s,it?.c,it?.pedido,it?.simbolo,it?.tk].filter(Boolean).map(v=>String(v).toUpperCase());
    if(!keys.some(k=>ids.includes(k)||ids.includes(k.split(':').pop())))return;
    const p=+it.px;if(!(p>0))return;const ch=it.d1!=null?+it.d1:null;
    if(!best||ts>=best.ts)best={px:p,d1:Number.isFinite(ch)?ch:null,ts}};
  try{const d=CQ.d||{};for(const k in d){const v=d[k];const ts=Date.parse(v?.em)||CQ.ts?.[k]||0;(v?.itens||[]).forEach(it=>take(it,ts))}}catch(e){}
  try{const c=window.TRM?.TR?.dados||{};for(const [k,e] of Object.entries(c)){if(!k.startsWith('cot|'))continue;const ts=Date.parse(e?.v?.em)||e.ts||0;if(Date.now()-ts>12*36e5)continue;(e?.v?.itens||[]).forEach(it=>take(it,ts))}}catch(e){}
  try{(AD.data?.itens||[]).forEach(it=>take(it,AD.data.ts||0))}catch(e){}
  return best;
}
function livePrice(ativo){
  if(!ativo)return null;const a=String(ativo).toUpperCase();
  try{if(typeof cqPf==='function'){}}catch(e){}
  const q=quote(a);if(q)return q.px;
  // futuros: WINZ26 -> WIN
  const base=a.replace(/[FGHJKMNQUVXZ]\d{2}$/,'');if(base!==a){const q2=quote(base);if(q2)return q2.px}
  return null;
}

/* ---------- peças de layout ---------- */
const card=(icon,title,right,body,extra='')=>`<section class="v4-card ${extra}"><header class="v4-head"><h2>${ic(icon,22)}<span>${title}</span></h2>${right||''}</header>${body}</section>`;
const link=(txt,attrs)=>`<button type="button" class="v4-link" ${attrs}>${txt} ${ic('right',15)}</button>`;
const empty=t=>`<p class="v4-empty">${t}</p>`;

/* ---------- Ferramentas: conteúdo original organizado em abas ---------- */
const TOOLS={
 home:{title:'Ferramentas do Início',groups:[
  ['hoje','Posso operar?',n=>n.id==='hg-hoje'],
  ['escala','Escala de turno',n=>/^(Escala de turno|Trabalha em escala)/i.test(txt(n))||n.matches('[data-hb="turno"]')],
  ['rotina','Rotina',n=>n.matches('.routine-card,.studio-routine')],
  ['modal','Modalidades',n=>/^Hoje por modalidade/i.test(txt(n))],
  ['cal','Calendário',n=>/^Calendário/i.test(txt(n))||/^\+ Day trade/i.test(txt(n))],
  ['monitor','Monitor',n=>n.matches('#market-watch-shortcut,.trhome')],
  ['ingles','Inglês do dia',n=>n.matches('[data-hb="en"]')||/^Inglês do dia/i.test(txt(n))],
  ['pat','Patrimônio',n=>n.id==='hg-pat'],
  ['mais','Mais',()=>true]]},
 dia:{title:'Diário completo do dia',always:n=>n.matches('.dlin,#svs'),hide:n=>n.matches('.platform-area')||(n.tagName==='H1'),groups:[
  ['plano','Plano × execução',n=>n.id==='plcard'],
  ['pre','Antes',n=>n.matches('#dfases,.dfase'),'pre'],
  ['dur','Durante',n=>n.matches('#dfases,.dfase'),'dur'],
  ['pos','Depois',n=>n.matches('#dfases,.dfase'),'pos'],
  ['ferr','Ferramentas',()=>true]]},
 ops:{title:'Ferramentas de operação',hide:n=>n.matches('.platform-area')||n.tagName==='H1'||(n.matches('.sm.mut')&&/Escolha a modalidade/.test(n.textContent)),groups:[
  ['mod','Modalidades',n=>n.matches('.modg')||/^Minhas modalidades/.test(txt(n))],
  ['geral','Visão geral',()=>true]]},
 stats:{title:'Estatísticas completas',hide:n=>n.matches('.platform-area'),groups:[['est','Estatísticas',()=>true]]}
};
const txt=n=>(n.textContent||'').trim().replace(/\s+/g,' ').slice(0,60);
const ACT_KEY='diario-v420-tools';
let actTools=(()=>{try{return JSON.parse(localStorage.getItem(ACT_KEY)||'{}')}catch(e){return {}}})();
function saveAct(){try{localStorage.setItem(ACT_KEY,JSON.stringify(actTools))}catch(e){}}

function organizeTools(route,native){
  const cfg=TOOLS[route];if(!cfg||!native)return;
  const ws=native.closest('#dt393-workspace')||native;
  ws.classList.add('v4-tools-ws');
  const kids=[...native.children].filter(n=>!n.classList.contains('v420-proxied'));
  const used={};
  kids.forEach(n=>{
    n.removeAttribute('data-v4g');n.classList.remove('v4-off');
    if(cfg.hide&&cfg.hide(n)){n.classList.add('v420-proxied');return}
    if(cfg.always&&cfg.always(n)){n.setAttribute('data-v4g','*');return}
    for(const [k,,m] of cfg.groups){if(m(n)){
      // Antes/Durante/Depois compartilham o mesmo bloco de fases
      const key=['pre','dur','pos'].includes(k)?'fases':k;
      n.setAttribute('data-v4g',key);used[key]=1;break}}
  });
  if(route==='home'){homeTools(native,ws);return}
  const groups=cfg.groups.filter(([k])=>used[['pre','dur','pos'].includes(k)?'fases':k]);
  if(!groups.length)return;
  let act=actTools[route];
  if(route==='dia'){const f=g(()=>DFASE&&DFASE.d===dayKey()?DFASE.f:null,null);if(!act||['pre','dur','pos'].includes(act))act=f&&['pre','dur','pos'].includes(f)?f:(act||'plano')}
  if(!groups.some(([k])=>k===act))act=groups[0][0];
  const head=doc.createElement('div');head.className='v4-tools-head';
  head.innerHTML=`<h2>${ic('tools',20)}<span>${cfg.title}</span></h2><div class="v4-tabs" role="tablist">${groups.map(([k,l])=>`<button type="button" role="tab" data-v4tool="${k}" data-v4route="${route}" class="${k===act?'on':''}" aria-selected="${k===act}">${l}</button>`).join('')}</div>`;
  ws.querySelector('.v4-tools-head')?.remove();
  ws.prepend(head);
  setTool(route,act,native,false);
}
function setTool(route,k,native,user){
  native=native||doc.querySelector('#dt393-workspace .dt393-native');if(!native)return;
  const key=['pre','dur','pos'].includes(k)?'fases':k;
  native.setAttribute('data-v4act',key);
  [...native.children].forEach(n=>{const gk=n.getAttribute('data-v4g');if(!gk||gk==='*')return;n.classList.toggle('v4-off',gk!==key)});
  doc.querySelectorAll(`[data-v4tool][data-v4route="${route}"]`).forEach(b=>{const on=b.dataset.v4tool===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on))});
  if(['pre','dur','pos'].includes(k)){
    const b=native.querySelector(`#dfases [data-dfase="${k}"]`);
    if(b&&!b.classList.contains('on'))b.click();
  }
  if(user){actTools[route]=k;saveAct()}
}

/* ---------- v427: ferramentas do Início viram páginas do menu ---------- */
// Rotina foi para Meu dia (Etapas do dia); Modalidades e Monitor repetiam Operações e Mercado.
const HOME_VIEWS={hoje:['Posso operar?','shield'],escala:['Escala de turno','cal'],cal:['Calendário','cal'],ingles:['Inglês do dia','grad'],pat:['Patrimônio','wallet']};
let homeView=null;
// blocos do "Mais" que repetem o Início novo (data, atalhos, marca e o resumo antigo)
const HOME_DUP=n=>n.matches('#studio-intro,.studio-intro,#studio-shortcuts,.studio-shortcuts,.brand116')||/^RESUMO DO DIA/i.test(txt(n));
function homeTools(native,ws){
  ws.querySelector('.v4-tools-head')?.remove();
  const v=homeView&&HOME_VIEWS[homeView]?homeView:null;
  doc.body.classList.toggle('v4-homeview',!!v);
  native.setAttribute('data-v4act',v||'mais');
  let rest=0;
  [...native.children].forEach(n=>{const gk=n.getAttribute('data-v4g');if(!gk||gk==='*')return;
    let off=v?gk!==v:gk!=='mais';
    if(!v&&gk==='mais'&&HOME_DUP(n))off=true;
    if(!off&&!v)rest++;
    n.classList.toggle('v4-off',off)});
  const head=doc.createElement('div');
  if(v){native.querySelectorAll(`[data-v4g="${v}"] details`).forEach(d=>{if(!d.dataset.v427){d.open=true;d.dataset.v427='1'}});
    head.className='v4-tools-head v4-viewhead';head.innerHTML=`<button type="button" class="v4-back" data-v4homeback="1">${ic('left',18)}<span>Início</span></button><h2>${ic(HOME_VIEWS[v][1],20)}<span>${HOME_VIEWS[v][0]}</span></h2>`;ws.prepend(head)}
  else if(rest){head.className='v4-tools-head v4-morehead';head.innerHTML=`<h2>${ic('list',20)}<span>Últimos registros</span></h2>`;ws.prepend(head)}
}
function openHome(k){homeView=HOME_VIEWS[k]?k:null;try{tab='home';render();scrollTo(0,0)}catch(e){}}
window.addEventListener('click',e=>{
  const h=e.target.closest?.('[data-v4home]');
  if(h){e.preventDefault();e.stopImmediatePropagation();
    try{doc.querySelector('#dt394-drawer [data-dt394-close]')?.click()}catch(x){}
    openHome(h.dataset.v4home);return}
  if(e.target.closest?.('[data-v4homeback]')){e.preventDefault();e.stopImmediatePropagation();openHome(null);return}
  if(e.target.closest?.('[data-dt393-route="home"]'))homeView=null;
},true);

/* ---------- Sub-abas: barra nova que aciona os botões originais ---------- */
const FAMILY=['home','dia','regras','ops','trades','swing','opc','ativos','fx','stats','rev','dash','opgrade','opfluxo','opcart','swbt','dtrpy'];
function subnav(native){
  if(!native)return;
  doc.getElementById('v4-subnav')?.remove();
  const back=native.querySelector(':scope > .modh');
  const hubs=[...native.querySelectorAll(':scope > .seg.hub, :scope > .hub2')];
  native.querySelectorAll(':scope > .platform-area').forEach(n=>n.classList.add('v420-proxied'));
  if(!hubs.length&&!back)return;
  const nav=doc.createElement('div');nav.id='v4-subnav';nav.className='v4-subnav';nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Sub-abas');
  const proxies=[];
  let html='';
  if(back){const b=back.querySelector('button,a')||back;html+=`<button type="button" class="v4-back" data-v4p="${proxies.push(b)-1}">${ic('left',18)}<span>${esc_(txt(b).replace(/^‹\s*/,''))}</span></button>`;back.classList.add('v420-proxied')}
  hubs.forEach((h,i)=>{
    const bs=[...h.querySelectorAll('button')];
    html+=`<div class="v4-tabs ${i===0?'v4-primary':'v4-secondary'}">${bs.map(b=>`<button type="button" class="${b.classList.contains('on')?'on':''}" data-v4p="${proxies.push(b)-1}">${esc_(txt(b))}</button>`).join('')}</div>`;
    h.classList.add('v420-proxied');
  });
  nav.innerHTML=html;nav.__p=proxies;
  const app=doc.getElementById('app');app.prepend(nav);
  // mantém a aba ativa visível na barra rolável
  nav.querySelectorAll('.v4-tabs').forEach(r=>{const on=r.querySelector('.on');if(on)r.scrollLeft=Math.max(0,on.offsetLeft-24)});
}

/* ---------- Início ---------- */
function gate(){
  try{
    const ph=pHoje(),core=pCore(ph.hj,ph.P);const lim=core.lim,perda=core.perda;
    const rs=rules(),chk=(S.days[today()]||{}).chk||{},n=rs.filter(r=>chk[r.id]).length;
    const turno=g(()=>turnoNv(today()),'g'),ttxt=g(()=>turnoTxt(today()),'');
    const st=core.mot.length?'r':(perda>=lim*.8||(rs.length&&n<rs.length)||turno==='a')?'a':'g';
    const why=core.mot.length?core.mot.join(' · '):turno==='a'&&ttxt?ttxt:(rs.length&&n<rs.length)?`Checklist ${n}/${rs.length}`:perda>=lim*.8?'Perto do limite de perda':'Dentro dos limites';
    return {st,label:{r:'Pare por hoje',a:'Atenção',g:'Pode operar'}[st],why,rest:Math.max(0,lim-perda),lim,trades:ph.hj.length,nd:core.nd};
  }catch(e){return null}
}
function home(){
  const t=today(),ts=closedOn(t),net=sum(ts,pl),ws=weekStart();
  const week=closedOn().filter(x=>tdate(x)>=ws&&tdate(x)<=t),wnet=sum(week,pl);
  const cap=capital(),gt=gate(),ph=marketPhase();
  const lim=lossLimit()??gt?.lim??null,rest=gt?gt.rest:(lim!=null?Math.max(0,lim-Math.max(0,-net)):null);
  const chip={pre:'Pré-abertura',pregao:'Pregão aberto',pos:'Pregão encerrado',fechado:'Mercado fechado'}[ph];
  const kpis=`<div class="v4-kpis">
    <div><small>Capital</small><strong>${cap!=null?brl(cap):'<button type="button" class="v4-inline" data-dt414-go="painel">Configurar</button>'}</strong></div>
    <div><small>P&amp;L do dia</small><strong class="${cls(net)}">${sbrl(net)}</strong><em class="${cls(net)}">${pctCap(net)!=null?'('+pct(pctCap(net))+')':ts.length+' encerrado(s)'}</em></div>
    <div><small>P&amp;L da semana</small><strong class="${cls(wnet)}">${sbrl(wnet)}</strong><em class="${cls(wnet)}">${pctCap(wnet)!=null?'('+pct(pctCap(wnet))+')':week.length+' trade(s)'}</em></div>
    <div><small>Risco disponível</small><strong>${rest!=null?brl(rest):'—'}</strong><em>${rest!=null&&pctCap(rest)!=null?'('+num(pctCap(rest))+'% do capital)':'limite de perda do dia'}</em></div></div>`;
  const gateRow=gt?`<button type="button" class="v4-gate v4-gate-${gt.st}" data-v4tool="hoje" data-v4route="home" data-v4scroll="1">${ic(gt.st==='g'?'shield':'alert',18)}<b>${gt.label}</b><span>${esc_(gt.why)}</span>${ic('right',16)}</button>`:'';
  const phases=[['pre','Pré-mercado'],['pregao','Pregão'],['pos','Pós-mercado']];
  const phaseBar=`<div class="v4-phase" role="group" aria-label="Fase do dia">${phases.map(([k,l])=>`<button type="button" data-v4phase="${k}" class="${ph===k?'on':''}" ${ph===k?'aria-current="true"':''}><i></i>${l}${ph===k&&k==='pregao'?' <small>(aberto)</small>':''}</button>`).join('')}</div>`;
  const tiles=[['bars','Mercado','Ações, índices, moedas e mais','mercado'],['monitor','Terminal','Gráficos, comparativos e indicadores','term'],['book','Diário','Trades, performance e aprendizado','stats'],['grad','Estudos','Aulas, trilhas e materiais','estudos'],['checksq','Checklist','Setup, plano e disciplina','regras']];
  const tileRow=`<div class="v4-tiles">${tiles.map(([i,n,d,r])=>`<button type="button" class="v4-tile" data-dt393-route="${r}">${ic(i,26)}<b>${n}</b><small>${d}</small>${ic('arrow',18)}</button>`).join('')}</div>`;
  // Panorama: agenda, notícias e alertas reais carregados pelo app
  // agenda: eventos de hoje; se não houver (fim de semana), os próximos de alto impacto
  const evAll=g(()=>{const a=AG.v[0];return a&&Array.isArray(a.eventos)?a.eventos.slice().sort((x,y)=>String(x.em).localeCompare(String(y.em))):[]},[]);
  let ev=evAll.filter(e=>String(e.em).slice(0,10)===t||g(()=>agDia(e.em)===agDia(new Date().toISOString()),false)).slice(0,4);
  let evNext=false;if(!ev.length){ev=evAll.filter(e=>Date.parse(e.em)>Date.now()&&(e.imp===1||e.imp==null)).slice(0,4);evNext=ev.length>0}
  const hm=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})};
  const dm=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'America/Sao_Paulo'})};
  const agenda=ev.length?ev.map(e=>`<li><time>${evNext?dm(e.em)+' ':''}${hm(e.em)}</time><span>${esc_(e.t||e.n||'Evento')}${e.p?` <small>(${esc_(e.p)})</small>`:''}</span><b>${esc_(e.a??e.at??e.c??'')}</b></li>`).join(''):`<li class="v4-none">Sem eventos carregados.</li>`;
  // notícias: as mais recentes carregadas; sem consulta nova, mostra a última salva no aparelho
  let nw=g(()=>(MKT.items||[]).slice(0,3),[]),nwSaved=null;
  if(nw.length){try{localStorage.setItem('diario-v423-news',JSON.stringify({ts:g(()=>MKT.ts,Date.now())||Date.now(),items:nw}))}catch(e){}}
  else{try{const c=JSON.parse(localStorage.getItem('diario-v423-news')||'null');if(c&&Array.isArray(c.items)){nw=c.items;nwSaved=c.ts}}catch(e){}}
  const news=nw.length?nw.map(n=>`<li><time>${hm(n.d)}</time><span>${esc_(n.t||n.titulo||'')}</span></li>`).join('')+(nwSaved?`<li class="v4-none">Última consulta: ${new Date(nwSaved).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</li>`:''):`<li class="v4-none">Abra Notícias para carregar as manchetes.</li>`;
  const moves=['IBOV','USD/BRL','S&P 500','DXY','PETR4'].map(s=>[s,quote(s)]).filter(([,q])=>q&&q.d1!=null&&Math.abs(q.d1)>=1).slice(0,3);
  const alerts=moves.length?moves.map(([s,q])=>`<li><i class="${q.d1>0?'dot-g':'dot-r'}"></i><span><b>${esc_(s)}</b> ${q.d1>0?'sobe':'cai'} ${pct(q.d1)} hoje</span></li>`).join(''):`<li class="v4-none">Sem movimentos fortes nas cotações recebidas.</li>`;
  const pano=card('bars','Panorama do dia',link('Ver mais','data-dt393-route="mercado"'),`<div class="v4-pano">
    <div><h3>${ic('cal',18)} ${evNext?'Agenda (próximos)':'Agenda (hoje)'}</h3><ul class="v4-list">${agenda}</ul>${link('Ver agenda','data-v4mkt="ag"')}</div>
    <div><h3>${ic('news',18)} Notícias-chave</h3><ul class="v4-list">${news}</ul>${link('Ver notícias','data-v4mkt="nt"')}</div>
    <div><h3 class="v4-gold">${ic('alert',18)} Alertas macro</h3><ul class="v4-list v4-alerts">${alerts}</ul>${link('Abrir radar','data-dt393-route="term"')}</div></div>`);
  const ia=card('spark','Central de Inteligência <span class="v4-iachip">IA</span>',link('Ver análises','data-v4ia="1"'),`<p class="v4-sub">Sugestões com base no mercado, no seu plano e no seu histórico. Sem ordens automáticas.</p><div class="v4-ia"><div class="v4-iaart" aria-hidden="true"><span>${ic('bars',30)}<b>IA</b></span></div><div class="v4-ialist">
    <button type="button" data-dt393-route="term">${ic('crosshair',22)}<span><b>Radar global e oportunidades</b><small>Fluxo, juros, índices e ativos no Terminal.</small></span>${ic('right',16)}</button>
    <button type="button" data-dt393-route="ops">${ic('shield',22)}<span><b>Revisar operações e risco</b><small>Posições abertas, stops e risco consumido.</small></span>${ic('right',16)}</button>
    <button type="button" data-dt393-route="stats">${ic('up',22)}<span><b>Avaliar resultados e consistência</b><small>Curva, win rate e pontos de atenção.</small></span>${ic('right',16)}</button></div></div>`,'v4-iacard');
  const sc=card('bolt','Atalhos rápidos','',`<div class="v4-short">
    <button type="button" data-dt393-route="term">${ic('monitor',24)}<span>Abrir Terminal</span></button>
    <button type="button" data-dt393-action="newtrade">${ic('plus',24)}<span>Registrar trade</span></button>
    <button type="button" data-qkn="1">${ic('bolt',24)}<span>Registro rápido</span></button>
    <button type="button" data-dt393-route="stats">${ic('book',24)}<span>Rever Diário</span></button>
    <button type="button" data-v4mkt="nt">${ic('news',24)}<span>Ver notícias</span></button>
    <button type="button" class="v4-round" data-v4custom="1" aria-label="Personalizar o Início">${ic('sliders',24)}</button></div>`,'v4-gold-icon');
  return `<div class="v4-page v4-home">
    ${card('cal',`Resumo do dia<small class="v4-date">${fmtLong(t)}</small>`,`<button type="button" class="v4-pill" data-dt393-route="mercado">${ic('up',16)} ${chip}${ic('right',14)}</button>`,kpis+gateRow,'v4-summary')}
    ${phaseBar}${tileRow}${pano}${ia}${sc}</div>`;
}

/* ---------- Meu dia ---------- */
let dayPhase=null;
function dia(){
  const d=dayKey(),dd=day(d),ts=closedOn(d),net=sum(ts,pl),cap=capital();
  const gl=goal(),lim=lossLimit(),mx=maxTrades();
  const all=trades().filter(t=>String(t.dt||'').slice(0,10)===d);
  const pl2=dd.pl2||{};const mods=g(()=>(pl2.mods||[]).map(m=>(PL_MOD.find(x=>x[0]===m)||[m,m])[1]),[]);
  const focus=mods.length?mods.join(' + '):(pl2.vies?('Viés '+pl2.vies):'');
  const plan=card('target','Plano do dia',`<div class="v4-datechip"><button type="button" data-a="dprev" aria-label="Dia anterior">${ic('left',16)}</button><label>${ic('cal',16)}<input type="date" data-v4date value="${d}" aria-label="Data do diário"><span>${dfmt(d)}</span></label><button type="button" data-a="dnext" aria-label="Próximo dia">${ic('right',16)}</button></div>`,
   `<div class="v4-kpis">
    <div><small>Objetivo</small><strong class="${gl?'v-pos':''}">${gl?sbrl(gl):'<button type="button" class="v4-inline" data-v4tool="plano" data-v4route="dia" data-v4scroll="1">Definir</button>'}</strong><em>${gl&&pctCap(gl)!=null?'('+pct(pctCap(gl))+' do capital)':'meta do dia'}</em></div>
    <div><small>Risco limite</small><strong class="${lim?'v-neg':''}">${lim?'-'+brl(lim):'—'}</strong><em>${lim&&pctCap(lim)!=null?'(-'+num(pctCap(lim))+'% do capital)':'perda máxima do dia'}</em></div>
    <div><small>Máx. de trades</small><strong>${mx??'—'}</strong><em>(realizados: ${all.length})</em></div>
    <div><small>Foco operacional</small>${focus?`<button type="button" class="v4-focus" data-v4tool="plano" data-v4route="dia" data-v4scroll="1">${ic('bars',16)} ${esc_(focus)} ${ic('down',14)}</button>`:'<button type="button" class="v4-inline" data-v4tool="plano" data-v4route="dia" data-v4scroll="1">Escolher</button>'}</div></div>`,'v4-plan');
  // checklist: usa os mesmos atributos do app (data-chk e a troca de fase da camada v402)
  const rs=rules(),chk=dd.chk||{};const done=rs.filter(r=>chk[r.id]).length,prog=rs.length?Math.round(done/rs.length*100):0;
  const mp=marketPhase();const defP=dayPhase||(mp==='pre'?'pre':mp==='pregao'?'during':'post');
  const ptitle={pre:'Pré-mercado',during:'Durante',post:'Pós-mercado'};
  const groups=['pre','during','post'].map(p=>{const e=rs.filter(r=>phaseOf(r)===p),n=e.filter(r=>chk[r.id]).length;const full=e.length&&n===e.length;
    return `<button type="button" data-dt393-action="checkphase" data-phase="${p}" class="${p===defP?'active':''} ${full?'full':''}" aria-pressed="${p===defP}">${ic(full?'check':p==='during'?'arrow':'target',16)} ${ptitle[p]} <small>(${n}/${e.length})</small></button>`}).join('');
  const rows=rs.map(r=>`<div class="dt393-checkitem v4-check" data-rule-phase="${phaseOf(r)}" ${phaseOf(r)!==defP?'hidden':''}><label><input type="checkbox" data-chk="${esc_(r.id)}" ${chk[r.id]?'checked':''}/><span>${esc_(r.t)}</span></label><select data-dt393-rule-phase="${esc_(r.id)}" aria-label="Fase da regra"><option value="pre" ${phaseOf(r)==='pre'?'selected':''}>Pré</option><option value="during" ${phaseOf(r)==='during'?'selected':''}>Durante</option><option value="post" ${phaseOf(r)==='post'?'selected':''}>Pós</option></select></div>`).join('');
  const check=card('list','Checklist operacional',`<button type="button" class="v4-progress" data-dt393-route="regras" aria-label="Editar regras"><span>${done} de ${rs.length} concluídos (${prog}%)</span><i><b style="width:${prog}%"></b></i>${ic('right',16)}</button>`,
   `<div class="dt393-phase dt393-phase-inner v4-cphase">${groups}</div><div class="dt393-checklist v4-checklist">${rows||'<p class="v4-empty">Cadastre suas regras no Checklist.</p>'}<div class="dt393-phase-empty v4-empty" ${rs.some(r=>phaseOf(r)===defP)?'hidden':''}>Nenhuma regra nesta fase.</div></div>`);
  const ph=g(()=>pHoje(),null),core=g(()=>pCore(ph.hj,ph.P),null);
  const capBox=card('coins','Capital e metas',link('Ajustar','data-dt414-go="painel"'),`<div class="v4-rows">
    <div>${ic('wallet',18)}<span>Capital operacional</span><b>${cap!=null?brl(cap):'—'}</b></div>
    <div>${ic('target',18)}<span>Limite de perda (dia)</span><b class="v-neg">${lim?'-'+brl(lim):core?'-'+brl(core.lim):'—'}</b></div>
    <div>${ic('trophy',18)}<span>Meta de ganho (dia)</span><b class="v-pos">${gl?sbrl(gl):'—'}</b></div>
    <div>${ic('timer',18)}<span>Resultado do dia</span><b class="${cls(net)}">${sbrl(net)}</b></div></div>`);
  const qs=[['IBOV','IBOV'],['USD/BRL','Dólar (USD/BRL)'],['DI Jan/27','Juros (DI Jan/27)'],['S&P 500','S&P 500']].map(([s,l])=>{const q=quote(s);return `<div><span>${l}</span><b>${q?px(q.px):'—'}</b><em class="${cls(q?.d1)}">${q&&q.d1!=null?pct(q.d1):''}</em></div>`}).join('');
  const scen=card('bars','Cenário atual',link('Mercado','data-dt393-route="mercado"'),`<div class="v4-quotes">${qs}</div>${dd.mkt!=null&&dd.mkt!==''?`<p class="v4-sub">Tipo de mercado: <b>${esc_(g(()=>MK[dd.mkt],dd.mkt))}</b></p>`:''}`);
  const fs=g(()=>{const el=doc.querySelectorAll('#dfases [data-dfase]');return [...el].map(b=>[b.dataset.dfase,(b.textContent||'').replace(/\s+/g,' ').trim()])},[]);
  const steps=[['pre','Antes do pregão','Rotina, estado, limites e plano'],['dur','Durante o pregão','Trades, emoções e notas rápidas'],['pos','Depois do pregão','Fechamento guiado e debriefing']];
  const curF=g(()=>DFASE&&DFASE.d===d?DFASE.f:'pre','pre');
  // v427: a "Rotina" (Preparar · Registrar · Revisar) do Início veio para cá, junto das etapas, sem repetir
  const planoOk=!!(String(dd.plano||'').trim()||pl2.vies||(pl2.mods||[]).length||pl2.max);
  const revOk=!!(String(dd.resumo||'').trim()||dd.bem||dd.prevn);
  const st=[planoOk?'Plano registrado':'Plano ainda não registrado',all.length?`${all.length} trade(s) registrado(s)`:'Nenhum trade registrado',revOk?'Revisão feita':'Revisão pendente'];
  const okN=[planoOk,all.length>0,revOk].filter(Boolean).length;
  const tasks=card('list','Etapas do dia',`<span class="v4-muted">${okN} de 3 com registro</span>`,`<div class="v4-rbar" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${okN}" aria-label="Etapas com registro"><b style="width:${Math.round(okN/3*100)}%"></b></div><div class="v4-steps">${steps.map(([k,a,b],i)=>{const ok=[planoOk,all.length>0,revOk][i];return `<button type="button" data-v4tool="${k}" data-v4route="dia" data-v4scroll="1" class="${curF===k?'on':''} ${ok?'ok':''}"><i>${ok?ic('check',16):i+1}</i><span><b>${a}</b><small>${b}</small><em>${st[i]}</em></span>${ic('right',16)}</button>`}).join('')}</div>`);
  const obs=card('pencil','Observações rápidas','',`<textarea class="v4-notes" data-d="plano" maxlength="2000" placeholder="Cenário, níveis, o que vou operar…" aria-label="Plano e observações do dia">${esc_(dd.plano||'')}</textarea><small class="v4-count">${String(dd.plano||'').length}/2000 · salvo no Plano do dia</small>`);
  return `<div class="v4-page v4-day">${plan}${check}<div class="v4-two">${capBox}${scen}</div><div class="v4-two">${tasks}${obs}</div></div>`;
}

/* ---------- Operações ---------- */
let opsView='risk',opsSort={k:'dt',d:1};
function ops(){
  const t=today(),op=openTrades(),cl=closedOn(t),net=sum(cl,pl),cap=capital();
  const buy=op.filter(x=>x.side==='C').length,sell=op.length-buy;
  const rOpen=sum(op,risk),rPct=pctCap(rOpen),lim=lossLimit(),limPct=pctCap(lim);
  const setups=[...new Set(op.concat(cl).map(x=>x.setup).filter(Boolean))];
  const stat=(i,l,v,d,c='')=>`<div class="v4-stat">${ic(i,24)}<span>${l}</span><strong class="${c}">${v}</strong><small>${d}</small></div>`;
  const stats=`<div class="v4-stats">
    ${stat('folder','Operações abertas',String(op.length),`(${buy} compradas / ${sell} vendidas)`)}
    ${stat('bars','Resultado do dia',sbrl(net),pctCap(net)!=null?pct(pctCap(net)):cl.length+' encerrada(s)',cls(net))}
    ${stat('shield','Risco consumido',rPct!=null?num(rPct)+'%':brl(rOpen),limPct!=null?`(limite: ${num(limPct)}%)`:'pelos stops abertos')}
    ${stat('crosshair','Setups ativos',String(setups.length),setups.length?'('+esc_(setups.slice(0,3).join(', '))+')':'nenhum hoje')}</div>`;
  const rows=op.map(x=>{const now=livePrice(x.ativo),e=+x.entry,dir=x.side==='C'?1:-1;
    const q=g(()=>+x.qty*(+x.pv||1),0);const u=now!=null&&Number.isFinite(e)?(now-e)*dir*q:null;
    const rk=risk(x),ur=u!=null&&rk>0?u/rk:null;const up=now!=null&&Number.isFinite(e)?(now-e)/e*100*dir:null;
    const status=now!=null&&x.target&&((dir>0&&now>=+x.target)||(dir<0&&now<=+x.target))?['Alvo atingido','gold']:now!=null&&x.stop&&((dir>0&&now<=+x.stop)||(dir<0&&now>=+x.stop))?['No stop','red']:['Em andamento',''];
    return `<tr data-a="edit" data-id="${esc_(x.id)}" class="${dir>0?'b-buy':'b-sell'}"><td><b>${esc_(x.ativo||'—')}</b><small>${esc_(x.setup||'')}</small></td><td><span class="v4-side ${dir>0?'buy':'sell'}">${dir>0?'Compra':'Venda'}</span></td><td>${px(x.entry)}</td><td>${now!=null?px(now):'—'}</td>
     <td class="${cls(u)}">${opsView==='risk'?(ur!=null?num(ur)+' R':'—'):(u!=null?sbrl(u):'—')}<small>${up!=null?pct(up):''}</small></td><td><small>S: ${x.stop!=null&&x.stop!==''?px(x.stop):'—'}</small><small>A: ${x.target!=null&&x.target!==''?px(x.target):'—'}</small></td><td><span class="v4-status ${status[1]}">${status[0]}</span></td></tr>`}).join('');
  const pos=card('layers','Posições monitoradas',`<div class="v4-seg"><button type="button" data-v4opsview="risk" class="${opsView==='risk'?'on':''}">% Risco</button><button type="button" data-v4opsview="rs" class="${opsView==='rs'?'on':''}">R$ Resultado</button></div>`,
    op.length?`<div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Ativo</th><th>Lado</th><th>Entrada</th><th>Atual</th><th>Resultado</th><th>Stop / Alvo</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><p class="v4-foot">"Atual" usa somente cotações já recebidas pelo app. Toque numa linha para abrir o trade.</p>`:empty('Nenhuma operação aberta registrada.'));
  const sk=opsSort.k,sd=opsSort.d;const val={ativo:x=>x.ativo||'',setup:x=>x.setup||'',entry:x=>+x.entry,exit:x=>+x.exit,pl:pl,r:rr,dt:x=>x.dtx||x.dt}[sk]||(x=>x.dt);
  const sorted=cl.slice().sort((a,b)=>{const A=val(a),B=val(b);return (A>B?1:A<B?-1:0)*sd});
  const th=(k,l)=>`<th><button type="button" data-v4sort="${k}" class="${sk===k?'on':''}">${l} ${sk===k?(sd>0?'▲':'▼'):'⇅'}</button></th>`;
  const tday=card('trade','Trades do dia',`<span class="v4-muted">${cl.length} trade(s)</span>`,
    cl.length?`<div class="v4-tablewrap"><table class="v4-table"><thead><tr>${th('ativo','Ativo')}${th('setup','Setup')}${th('entry','Entrada')}${th('exit','Saída')}${th('pl','Resultado')}${th('r','R-múltiplo')}<th></th></tr></thead><tbody>${sorted.map(x=>`<tr class="${pl(x)>=0?'b-buy':'b-sell'}"><td><b>${esc_(x.ativo||'—')}</b></td><td>${esc_(x.setup||'—')}</td><td>${px(x.entry)}</td><td>${px(x.exit)}</td><td class="${cls(pl(x))}">${sbrl(pl(x))}</td><td class="${cls(rr(x))}">${rr(x)!=null?(rr(x)>0?'+':'')+num(rr(x))+' R':'—'}</td><td><button type="button" class="v4-icon" data-a="edit" data-id="${esc_(x.id)}" aria-label="Abrir trade">${ic('doc',18)}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Nenhum trade encerrado hoje.'));
  const last=cl.concat(op).sort((a,b)=>String(b.dtx||b.dt).localeCompare(String(a.dtx||a.dt)))[0];
  const rev=card('pencil','Revisão rápida','',`<p class="v4-sub">Registre os pontos principais desta sessão.</p><div class="v4-actions">
    ${last?`<button type="button" data-a="edit" data-id="${esc_(last.id)}">${ic('image',20)} Adicionar print ao último trade</button>`:`<button type="button" data-dt393-action="newtrade">${ic('image',20)} Registrar trade com print</button>`}
    <button type="button" data-qkn="1">${ic('bolt',20)} Registro rápido</button>
    ${last?`<button type="button" data-a="edit" data-id="${esc_(last.id)}">${ic('warn',20)} Marcar erro emocional</button>`:''}
    <button type="button" class="v4-primarybtn" data-v4deb="1">${ic('book',20)} Registrar aprendizado no diário</button></div>`);
  const tips=[];
  const best=cl.filter(x=>rr(x)!=null).sort((a,b)=>rr(b)-rr(a))[0];
  if(best&&rr(best)>0)tips.push(`Melhor execução: ${esc_(best.ativo)}${best.setup?' ('+esc_(best.setup)+')':''} com ${num(rr(best))} R.`);
  const noStop=op.filter(x=>x.stop==null||x.stop==='');if(noStop.length)tips.push(`${noStop.length} posição(ões) aberta(s) sem stop cadastrado.`);
  const mx=maxTrades();const n=trades().filter(x=>String(x.dt||'').slice(0,10)===t).length;if(mx&&n>=mx)tips.push(`Você já fez ${n} de ${mx} trades permitidos hoje.`);
  if(cl.length>=2&&net>0)tips.push(`Dia positivo em ${cl.length} trades (${sbrl(net)}). Considere encerrar a sessão no lucro.`);
  const neg=cl.filter(x=>pl(x)<0&&rr(x)!=null&&rr(x)<-1.05);if(neg.length)tips.push(`${neg.length} perda(s) acima de 1 R: o stop foi respeitado?`);
  const sug=card('spark','Sugestões',`<span class="v4-ctx">Contexto: suas operações</span>`,`<p class="v4-sub">Calculadas a partir dos seus trades de hoje.</p><ul class="v4-tips">${tips.length?tips.map(x=>`<li>${ic('check',18)}<span>${x}</span></li>`).join(''):'<li class="v4-none">Registre trades para receber sugestões.</li>'}</ul>${link('Perguntar à IA','data-v4ia="1"')}`);
  return `<div class="v4-page v4-ops">${stats}${pos}${tday}<div class="v4-two">${rev}${sug}</div></div>`;
}

/* ---------- Diário ---------- */
let perfP='3M',perfTable=false;
function perfSeries(){
  const ts=closedOn().sort((a,b)=>tdate(a).localeCompare(tdate(b)));
  const end=today();const from={'1M':30,'3M':91,'6M':182,'1A':365}[perfP];
  let start=perfP==='YTD'?end.slice(0,4)+'-01-01':perfP==='Máx'?'0000':from?g(()=>diasMais(end,-from),'0000'):'0000';
  const byDay={};ts.forEach(t=>{const d=tdate(t);if(d>=start)byDay[d]=(byDay[d]||0)+(pl(t)||0)});
  let acc=0;return Object.keys(byDay).sort().map(d=>({d,v:byDay[d],acc:(acc+=byDay[d])}));
}
function perfChart(){
  const s=perfSeries();
  if(s.length<2)return `<div class="v4-chartempty">Registre trades encerrados em pelo menos dois dias deste período para ver a curva.</div>`;
  if(perfTable)return `<div class="v4-tablewrap"><table class="v4-table"><thead><tr><th>Dia</th><th>Resultado</th><th>Acumulado</th></tr></thead><tbody>${s.slice().reverse().map(x=>`<tr><td>${dfmt(x.d)}</td><td class="${cls(x.v)}">${sbrl(x.v)}</td><td class="${cls(x.acc)}">${sbrl(x.acc)}</td></tr>`).join('')}</tbody></table></div>`;
  const W=600,H=230,pad=[10,58,24,8];const vals=s.map(x=>x.acc);const mn=Math.min(0,...vals),mx=Math.max(0,...vals),sp=Math.max(1,mx-mn);
  const X=i=>pad[3]+i/(s.length-1)*(W-pad[1]-pad[3]),Y=v=>pad[0]+(1-(v-mn)/sp)*(H-pad[0]-pad[2]);
  const pts=s.map((x,i)=>`${X(i).toFixed(1)},${Y(x.acc).toFixed(1)}`).join(' ');
  const area=`${X(0).toFixed(1)},${Y(mn).toFixed(1)} ${pts} ${X(s.length-1).toFixed(1)},${Y(mn).toFixed(1)}`;
  const ticks=[0,.25,.5,.75,1].map(f=>mn+f*sp);
  const lab=[0,Math.floor((s.length-1)/2),s.length-1].map(i=>`<text x="${X(i).toFixed(1)}" y="${H-6}" text-anchor="${i===0?'start':i===s.length-1?'end':'middle'}">${dfmt(s[i].d).slice(0,5)}</text>`).join('');
  const last=s[s.length-1].acc;
  return `<div class="v4-legend"><span><i class="w"></i>Diário de Trader (resultado acumulado)</span><b class="${cls(last)}">${sbrl(last)}</b></div>
  <svg class="v4-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Resultado acumulado no período ${perfP}: ${sbrl(last)}">
   ${ticks.map(v=>`<path class="grid" d="M${pad[3]} ${Y(v).toFixed(1)}H${W-pad[1]}"/><text class="yl" x="${W-pad[1]+6}" y="${(Y(v)+4).toFixed(1)}">${Math.round(v).toLocaleString('pt-BR')}</text>`).join('')}
   <path class="zero" d="M${pad[3]} ${Y(0).toFixed(1)}H${W-pad[1]}"/>
   <polygon class="area" points="${area}"/><polyline class="line" points="${pts}"/>${lab}</svg>`;
}
function diario(){
  const d=dayKey(),ts=closedOn(d),net=sum(ts,pl),w=ts.filter(x=>pl(x)>0).length,wr=ts.length?w/ts.length*100:null;
  const n=trades().filter(x=>String(x.dt||'').slice(0,10)===d).length,mx=maxTrades();
  const usedR=sum(ts.filter(x=>pl(x)<0),x=>-pl(x)),lim=lossLimit();
  const kp=`<div class="v4-kpis">
    <div><small>Resultado do dia</small><strong class="${cls(net)}">${sbrl(net)}</strong><em class="${cls(net)}">${pctCap(net)!=null?pct(pctCap(net)):''}</em></div>
    <div><small>Win rate</small><strong>${wr==null?'—':num(wr,1)+'%'}</strong><em>${w} de ${ts.length} trades</em></div>
    <div><small>Risco usado</small><strong>${pctCap(usedR)!=null?num(pctCap(usedR))+'%':brl(usedR)}</strong><em>${lim?'(limite: '+(pctCap(lim)!=null?num(pctCap(lim))+'%':brl(lim))+')':'perdas do dia'}</em></div>
    <div><small>Nº de trades</small><strong>${n}</strong><em>${mx?'(planejado: até '+mx+')':''}</em></div></div>`;
  const resumo=card('book','Resumo do dia',`<div class="v4-datechip"><button type="button" data-a="dprev" aria-label="Dia anterior">${ic('left',16)}</button><label>${ic('cal',16)}<input type="date" data-v4date value="${d}" aria-label="Data"><span>${dfmt(d)}</span></label><button type="button" data-a="dnext" aria-label="Próximo dia">${ic('right',16)}</button></div>`,kp);
  const per=['1M','3M','6M','YTD','1A','Máx'];
  const perf=card('up','Performance',`<button type="button" class="v4-icon" data-dt393-route="dash" aria-label="Análise completa">${ic('expand',18)}</button>`,
    `<div class="v4-chartbar"><div class="v4-seg">${per.map(p=>`<button type="button" data-v4per="${p}" class="${p===perfP?'on':''}">${p}</button>`).join('')}</div><button type="button" class="v4-chip ${perfTable?'on':''}" data-v4table="1">Tabela</button></div>${perfChart()}<p class="v4-foot">Curva do seu diário. A comparação com o IBOV só aparece quando houver série histórica verificada.</p>`,'v4-perf');
  const rs=rules(),chk=day(d).chk||{};
  const ph=['pre','during','post'].map(p=>{const e=rs.filter(r=>phaseOf(r)===p),k=e.filter(r=>chk[r.id]).length;const full=e.length&&k===e.length;return `<span class="v4-chip ${full?'on':''}">${ic(full?'check':'target',14)} ${({pre:'Pré-mercado',during:'Durante',post:'Pós-mercado'})[p]} <small>${k}/${e.length}</small></span>`}).join('');
  const dd=day(d);
  const chkc=card('list','Checklist e cenário',`<button type="button" class="v4-icon" data-dt393-route="dia" aria-label="Abrir Meu dia">${ic('right',18)}</button>`,`<div class="v4-split"><div class="v4-chips">${ph}</div><div><h3>${ic('doc',16)} Plano do dia (resumo)</h3><p class="v4-text">${dd.plano?esc_(String(dd.plano).slice(0,280)):'Plano não preenchido para esta data.'}</p></div></div>`);
  const opsl=card('trade','Operações do dia','',ts.length?`<div class="v4-oplist">${ts.map(x=>`<details><summary class="${pl(x)>=0?'b-buy':'b-sell'}"><b>${esc_(x.ativo||'—')}</b><span>${esc_(x.setup||'—')}</span><em class="${cls(pl(x))}">${sbrl(pl(x))}</em><em class="${cls(rr(x))}">${rr(x)!=null?(rr(x)>0?'+':'')+num(rr(x))+' R':'—'}</em>${ic('down',16)}</summary><div class="v4-opdet"><span>Lado <b>${x.side==='C'?'Compra':'Venda'}</b></span><span>Entrada <b>${px(x.entry)}</b></span><span>Saída <b>${px(x.exit)}</b></span><span>Stop <b>${px(x.stop)}</b></span><span>Alvo <b>${px(x.target)}</b></span><span>Qtd. <b>${esc_(x.qty??'—')}</b></span>${x.err&&x.err!=='Nenhum'?`<span class="v-neg">Erro <b>${esc_(x.err)}</b></span>`:''}<button type="button" data-a="edit" data-id="${esc_(x.id)}">Abrir trade</button></div></details>`).join('')}</div>`:empty('Ainda não há trades encerrados neste dia.'));
  const lic=[dd.resumo,dd.bem,dd.prevn].filter(Boolean);
  const ws=weekStart();const errs={};trades().forEach(x=>{if(tdate(x)>=ws&&x.err&&x.err!=='Nenhum')errs[x.err]=(errs[x.err]||0)+1});
  const att=Object.entries(errs).sort((a,b)=>b[1]-a[1]).map(([e,k])=>`<li>${esc_(e)} <small>(${k}x na semana)</small></li>`);
  if(dd.cond)att.push(`<li>${esc_(String(dd.cond).slice(0,160))}</li>`);
  const notes=card('pencil','Anotações e lições','',lic.length?`<ul class="v4-bul">${lic.map(x=>`<li>${esc_(String(x).slice(0,200))}</li>`).join('')}</ul>`:empty('Escreva o debriefing do dia para ver suas lições aqui.'));
  const attn=card('crosshair','Pontos de atenção','',att.length?`<ul class="v4-bar">${att.join('')}</ul>`:empty('Nenhum erro marcado nesta semana.'));
  return `<div class="v4-page v4-journal">${resumo}${perf}${chkc}${opsl}<div class="v4-two">${notes}${attn}</div><button type="button" class="v4-cta" data-v4deb="1">${ic('book',22)} Registrar revisão</button></div>`;
}

/* ---------- barra inferior e faixa de cotações ---------- */
const NAV=[['home','Início','home'],['dia','Meu dia','cal'],['ops','Operações','trade'],['mercado','Mercado','bars'],['estudos','Estudos','grad']];
const SECTION={home:'home',dia:'dia',regras:'dia',ops:'ops',trades:'ops',swing:'ops',opc:'ops',ativos:'ops',fx:'ops',opgrade:'ops',opfluxo:'ops',opcart:'ops',swbt:'ops',dtrpy:'ops',mercado:'mercado',juros:'mercado',live:'mercado',graf:'mercado',estudos:'estudos',livro:'estudos'};
function bottomNav(){
  let n=doc.getElementById('v4-bnav');
  if(!n){n=doc.createElement('nav');n.id='v4-bnav';n.setAttribute('aria-label','Navegação principal');doc.body.appendChild(n)}
  const s=SECTION[cur()]||'';
  n.innerHTML=NAV.map(([r,l,i])=>`<button type="button" data-dt393-route="${r}" class="${s===r?'on':''}" ${s===r?'aria-current="page"':''}>${ic(i,24)}<span>${l}</span></button>`).join('');
}
function ticker(){
  // v426: a faixa móvel do TradingView volta a ser a única faixa de cotações (a fixa foi retirada)
  doc.body.classList.remove('v4-own-ticker');doc.querySelectorAll('.v4-ticker').forEach(e=>e.remove());return;
  const head=doc.getElementById('dt393-global-head');if(!head)return;
  head.querySelector('.v4-ticker')?.remove();
  const syms=['IBOV','S&P 500','NASDAQ','DXY','USD/BRL','PETR4'];
  const qs=syms.map(s=>[s,quote(s)]);const have=qs.filter(([,q])=>q).length;
  doc.body.classList.toggle('v4-own-ticker',have>=3);
  if(have<3)return;
  const el=doc.createElement('div');el.className='v4-ticker';el.setAttribute('aria-label','Cotações recebidas pelo app');
  el.innerHTML=qs.map(([s,q])=>`<div><b>${s} ${q&&q.d1!=null?(q.d1>=0?'<i class="up">▲</i>':'<i class="dn">▼</i>'):''}</b><strong>${q?px(q.px):'—'}</strong><small class="${cls(q?.d1)}">${q&&q.d1!=null?pct(q.d1):'sem cotação'}</small></div>`).join('');
  head.appendChild(el);
}


/* ---------- Menu lateral organizado ---------- */
const MENU=[
 ['Principal',[['r','home','Início','home'],['r','dia','Meu dia','cal'],['r','ops','Operações','trade'],['r','stats','Diário','book'],['r','mercado','Mercado','bars'],['r','estudos','Estudos','grad']]],
 ['Rotina e disciplina',[['h','hoje','Posso operar?','shield'],['r','regras','Checklist e regras','checksq'],['h','escala','Escala de turno','cal'],['h','cal','Calendário','cal'],['r','rev','Revisão da semana','list'],['q','1','Registro rápido de trade','bolt']]],
 ['Mercado ao vivo',[['r','term','Terminal','monitor'],['r','graf','Gráficos TradingView','up'],['r','juros','Juros e DI','coins']]],
 ['Patrimônio e risco',[['r','carteiras','Carteira','wallet'],['h','pat','Patrimônio','up'],['g','painel','Capital, risco e backup','shield'],['g','contratos','Calculadora de contratos','list'],['g','imposto','Imposto de renda','doc']]],
 ['Estudos e evolução',[['h','ingles','Inglês do dia','grad'],['g','carreira','Plano de transição','arrow']]],
 ['Conta e sistema',[['g','conta','Conta e sincronização','folder'],['g','import','Importar do Profit','layers'],['g','status','Status do sistema','alert'],['g','mais','Configurações','sliders'],['g','termos','Termos de uso','doc']]]
];
const MENU_OUT=['trades','swing','opc','ativos','fx','dtrpy','swbt','live','mesa'];
function organizeDrawer(){
  const list=doc.querySelector('#dt394-drawer .dt394-nav-list');if(!list||list.dataset.v420)return;
  list.querySelectorAll(MENU_OUT.map(id=>`[data-dt393-route="${id}"],[data-dt414-go="${id}"]`).join(',')).forEach(b=>{b.dataset.v420used='1'});
  const filt=b=>(b?.dataset?.dt394Filter)||'';
  const find=(kind,id)=>{
    if(kind==='h')return null;
    const sel=kind==='q'?'[data-qkn]':kind==='g'?`[data-dt414-go="${id}"],[data-dt393-route="${id}"]`:`[data-dt393-route="${id}"],[data-dt414-go="${id}"]`;
    return [...list.querySelectorAll(sel)].find(b=>!b.dataset.v420used);
  };
  const frag=doc.createDocumentFragment();
  MENU.forEach(([title,items])=>{
    const sec=doc.createElement('div');sec.className='v420-menu-sec';
    sec.innerHTML=`<h3>${title}</h3>`;
    items.forEach(([kind,id,label,icon])=>{
      const old=find(kind,id);
      const b=doc.createElement('button');b.type='button';
      if(kind==='q')b.dataset.qkn='1';else if(kind==='g')b.dataset.dt414Go=id;else if(kind==='h'){b.dataset.dt393Route='home';b.dataset.v4home=id}else b.dataset.dt393Route=id;
      b.dataset.dt394Filter=(label+' '+filt(old)).toLowerCase();
      if(old){old.dataset.v420used='1';if(old.classList.contains('active'))b.classList.add('active')}
      b.innerHTML=`${ic(icon,20)}<span>${label}</span>${ic('right',17)}`;
      sec.appendChild(b);
    });
    frag.appendChild(sec);
  });
  // itens que outras camadas criaram e não estão no mapa continuam no fim
  const rest=[...list.querySelectorAll('button')].filter(b=>!b.dataset.v420used&&!b.closest('.v420-menu-sec'));
  if(rest.length){const sec=doc.createElement('div');sec.className='v420-menu-sec';sec.innerHTML='<h3>Outros</h3>';rest.forEach(b=>sec.appendChild(b));frag.appendChild(sec)}
  // os contêineres das versões 414/419 ficam vazios (evita que sejam recriados)
  ['dt414-drawer-access','v419-drawer'].forEach(id=>{const c=doc.getElementById(id);if(c){c.innerHTML='';c.hidden=true;frag.appendChild(c)}});
  list.innerHTML='';list.appendChild(frag);list.dataset.v420='1';
  syncDrawer();
}
function syncDrawer(){
  const s=SECTION[cur()]||cur();
  doc.querySelectorAll('#dt394-drawer .v420-menu-sec button').forEach(b=>{const r=b.dataset.dt393Route||b.dataset.dt414Go;const hv=b.dataset.v4home;const on=hv?(cur()==='home'&&homeView===hv):(r==='home'&&homeView)?false:r===cur()||(r===s&&!doc.querySelector(`#dt394-drawer [data-dt393-route="${cur()}"],#dt394-drawer [data-dt414-go="${cur()}"]`));b.classList.toggle('active',!!on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
}
doc.addEventListener('input',e=>{
  if(e.target.id!=='dt394-nav-search')return;
  setTimeout(()=>{doc.querySelectorAll('#dt394-drawer .v420-menu-sec').forEach(sec=>{const any=[...sec.querySelectorAll('button')].some(b=>!b.hidden&&getComputedStyle(b).display!=='none');sec.classList.toggle('v420-empty',!any)})},0);
});

/* ---------- montagem ---------- */
const PAGES={home,dia,ops,stats:diario};
function mount(){
  const r=cur();const app=doc.getElementById('app');if(!app)return;
  doc.body.classList.toggle('v4-on',true);
  if(r!=='home'&&homeView){homeView=null}
  doc.body.classList.toggle('v4-homeview',r==='home'&&!!homeView);
  doc.body.dataset.v4route=r;
  bottomNav();ticker();try{organizeDrawer();syncDrawer()}catch(e){}
  const native=app.querySelector('#dt393-workspace .dt393-native');
  if(FAMILY.includes(r))subnav(native);else doc.getElementById('v4-subnav')?.remove();
  const build=PAGES[r];
  if(!build||(r==='dia'&&g(()=>DV==='hist',false)))return;
  let html;try{html=build()}catch(e){console.warn('v420 '+r,e);return}
  app.querySelectorAll('.v4-panel').forEach((p,i)=>{if(i>0)p.remove()});
  let panel=app.querySelector('.v4-panel');
  const old=app.querySelector('.dt393-page');
  if(!panel&&old&&old.parentElement!==app)panel=old.parentElement;
  if(!panel||panel===app){panel=doc.createElement('div');const ws=app.querySelector('#dt393-workspace');if(ws)ws.before(panel);else app.appendChild(panel)}
  if(old&&!panel.contains(old))old.remove();
  panel.className='v4-panel';panel.innerHTML=html;
  // remove "Mais no Início" da v419 (substituído pelas Ferramentas)
  doc.getElementById('v419-mais')?.remove();app.querySelector('#dt393-workspace')?.classList.remove('v419-recolhido');
  organizeTools(r,native);
}
function hook(){
  if(typeof window.render0!=='function'||window.render0.__v420)return false;
  const prev=window.render0;
  const f=function(){const o=prev.apply(this,arguments);try{mount()}catch(e){console.warn('v420',e)}return o};
  f.__v420=1;window.render0=f;return true;
}

/* ---------- eventos ---------- */
doc.addEventListener('click',e=>{
  const p=e.target.closest('[data-v4p]');
  if(p){const nav=p.closest('#v4-subnav');const b=nav?.__p?.[+p.dataset.v4p];if(b){e.preventDefault();b.click()}return}
  const t=e.target.closest('[data-v4tool]');
  if(t&&t.dataset.v4route==='home'){e.preventDefault();openHome(t.dataset.v4tool);return}
  if(t){e.preventDefault();setTool(t.dataset.v4route,t.dataset.v4tool,null,true);if(t.dataset.v4scroll)doc.querySelector('.v4-tools-head')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  const ph=e.target.closest('[data-v4phase]');
  if(ph){e.preventDefault();const k=ph.dataset.v4phase;
    try{if(k==='pos'&&typeof GOR!=='undefined'&&GOR.deb){GOR.deb();scrollTo(0,0);return}}catch(err){}
    try{D=today();DFASE={d:today(),f:k==='pre'?'pre':'dur'};actTools.dia=k==='pre'?'pre':'dur';tab='dia';render();scrollTo(0,0)}catch(err){}return}
  const m=e.target.closest('[data-v4mkt]');
  if(m){e.preventDefault();const sub=m.dataset.v4mkt;try{if(window.DIARIO_NAV?.navigate){window.DIARIO_NAV.navigate('mercado:'+sub)}else{MKT.tab=sub;tab='mercado';render()}scrollTo(0,0)}catch(err){}return}
  if(e.target.closest('[data-v4ia]')){e.preventDefault();doc.querySelector('.wf-chat-launcher')?.click();return}
  if(e.target.closest('[data-v4custom]')){e.preventDefault();const b=[...doc.querySelectorAll('#app .studio-intro button, #app .studio-tool')].find(x=>/Personalizar/i.test(x.textContent));if(b)b.click();return}
  if(e.target.closest('[data-v4deb]')){e.preventDefault();try{GOR.deb();scrollTo(0,0)}catch(err){try{tab='dia';render()}catch(x){}}return}
  const ov=e.target.closest('[data-v4opsview]');if(ov){e.preventDefault();opsView=ov.dataset.v4opsview;render();return}
  const so=e.target.closest('[data-v4sort]');if(so){e.preventDefault();const k=so.dataset.v4sort;opsSort=opsSort.k===k?{k,d:-opsSort.d}:{k,d:1};render();return}
  const pp=e.target.closest('[data-v4per]');if(pp){e.preventDefault();perfP=pp.dataset.v4per;render();return}
  if(e.target.closest('[data-v4table]')){e.preventDefault();perfTable=!perfTable;render();return}
  const cp=e.target.closest('.v4-cphase [data-phase]');if(cp)dayPhase=cp.dataset.phase; // a camada v402 faz a troca
},true);
doc.addEventListener('change',e=>{
  const d=e.target.closest('[data-v4date]');
  if(d&&d.value){try{D=d.value;render()}catch(err){}}
});
doc.addEventListener('input',e=>{
  const ta=e.target.closest('.v4-notes');if(ta){const c=ta.parentElement.querySelector('.v4-count');if(c)c.textContent=ta.value.length+'/2000 · salvo no Plano do dia'}
});

function boot(){hook();try{mount()}catch(e){}}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
let k=0;const iv=setInterval(()=>{k++;if(hook()){try{mount()}catch(e){}}try{organizeDrawer()}catch(e){}if(k>10)clearInterval(iv)},700);
doc.addEventListener('click',e=>{if(e.target.closest('[data-dt393-action="menu"]'))setTimeout(()=>{try{organizeDrawer();syncDrawer()}catch(x){}},0)});
// faixa de cotações e preços "Atual" acompanham as cotações recebidas
setInterval(()=>{if(!doc.hidden){try{ticker()}catch(e){}}},15000);
})();
