/* Diário de Trader v428 — Terminal e Mercado no padrão Bloomberg
 *  - cada sub-aba do Terminal (Gráficos, Radar Global, Fluxo, Notícias, Juros, Agenda) vira uma página com
 *    o gráfico profissional (GP) no topo e o quadro de dados da sub-aba embaixo, como a Visão geral;
 *  - cada sub-aba guarda o próprio gráfico (ativos, período, escala) sem mexer nas outras;
 *  - Mercado → Cotações usa o mesmo gráfico no "Desempenho" da categoria escolhida;
 *  - os painéis avançados antigos (comandos MON, GP, WEI…) continuam em "Painéis e Workspaces"
 *    e em "Abrir painel avançado" de cada página. Nenhuma função removida. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

const PAGES={
 HOME:  {t:'Comparativo de Ativos',m:'GP',  def:null},
 GP:    {t:'Gráfico de Preço',     m:'GP',  def:{a:'IBOV',b:'',mode:'dual',per:'1A',ev:true,table:false}},
 GLOBAL:{t:'Radar Global',         m:'WEI', def:{a:'IBOV',b:'SPX',mode:'base',per:'6M',table:false}},
 MON:   {t:'Fluxo e Monitor',      m:'MON', def:{a:'EWZ',b:'IBOV',mode:'base',per:'1M',table:false}},
 NEWSBR:{t:'Notícias do Dia',      m:'TOP', def:{a:'IBOV',b:'USDBRL',mode:'dual',per:'1D',table:false}},
 DIFUT: {t:'Juros e Curva DI',     m:'DI',  def:{a:'USDBRL',b:'BC:SELIC',mode:'dual',per:'2A',table:false}},
 ECO:   {t:'Agenda Econômica',     m:'ECO', def:{a:'IBOV',b:'BC:IPCA12',mode:'dual',per:'1A',ev:true,table:false}}
};
const MKT_DEF={fav:{a:'IBOV',b:'SPX'},fut:{a:'IBOV',b:'SPX'},idx:{a:'IBOV',b:'SPX'},br:{a:'IBOV',b:'EWZ'},us:{a:'SPX',b:'NDX'},adr:{a:'EWZ',b:'IBOV'},
 fx:{a:'USDBRL',b:'DXY'},cmd:{a:'BRENT',b:'OURO'},cri:{a:'BTCUSD',b:'NDX'},jur:{a:'USDBRL',b:'BC:SELIC'}};
const MKT_T={fav:'Desempenho dos Favoritos',fut:'Desempenho dos Futuros',idx:'Desempenho dos Índices',br:'Desempenho das Ações BR',us:'Desempenho do Setor EUA',adr:'Desempenho das ADRs',
 fx:'Desempenho das Moedas',cmd:'Desempenho das Commodities',cri:'Desempenho das Criptos',jur:'Juros × Câmbio'};

let page=LS.get('diario-v428-tpage','HOME');if(!PAGES[page])page='HOME';
const mem=LS.get('diario-v428-ctx',{});
let ctx=null,pass=false;

const curTab=()=>g(()=>tab,'');
const termHome=()=>curTab()==='term'&&doc.body.classList.contains('tf413-home')&&!!doc.getElementById('tf413');
const inCot=()=>curTab()==='mercado'&&g(()=>MKT.tab,'')==='cq'&&!!doc.querySelector('#cotbox');
function context(){if(termHome())return 'T:'+page;if(inCot())return 'M:'+g(()=>CQ.aba,'fut');return null}
const pick=s=>({a:s.a,b:s.b,mode:s.mode,per:s.per,freq:s.freq,ma:s.ma,ev:s.ev,table:s.table});
function defFor(c){
  if(c.startsWith('T:'))return PAGES[c.slice(2)]?.def||null;
  const d=MKT_DEF[c.slice(2)]||MKT_DEF.fut;return {...d,mode:'base',per:'1A',table:false};
}
function applyCtx(){
  const c=context(),api=root.DIARIO_V421;if(!c||!api||c===ctx)return;
  if(!mem['T:HOME'])mem['T:HOME']=pick(api.get()); // o gráfico que a pessoa já tinha fica sendo o da Visão geral
  if(ctx)mem[ctx]=pick(api.get());
  ctx=c;const want=mem[c]||defFor(c);
  if(want)api.set(want);
  LS.set('diario-v428-ctx',mem);
  decorate();
}

/* ---------- onde o gráfico fica fora do Terminal ---------- */
root.V428_gpHost=function(){
  if(!inCot())return null;
  const ref=doc.querySelector('#cotbox .m409-chart-card')||doc.querySelector('#cotbox .m408-workspace');
  return ref?{ref}:null;
};
root.V428_gpMounted=function(){setTimeout(()=>{applyCtx();decorate()},0)};

/* ---------- barra de título e período, no estilo da sua referência ---------- */
const PERDIAS={'1D':1,'3D':3,'1M':31,'6M':183,'1A':366,'2A':731};
function fmtD(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}
function rangeTxt(per){
  const fim=new Date();let ini;
  if(per==='YTD')ini=new Date(fim.getFullYear(),0,1);
  else if(per==='Máx')return ['início','hoje'];
  else ini=new Date(Date.now()-(PERDIAS[per]||366)*864e5);
  return [fmtD(ini),fmtD(fim)];
}
const ICO='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>';
function title(){
  const c=ctx||context()||'';
  if(c.startsWith('M:'))return {t:MKT_T[c.slice(2)]||'Desempenho',m:'COMP'};
  const p=PAGES[page]||PAGES.HOME;return {t:p.t,m:p.m};
}
function decorate(){
  const el=doc.getElementById('v421-gp');if(!el)return;
  const st=g(()=>root.DIARIO_V421.get(),{per:'1A'});
  const {t,m}=title();
  let bar=el.querySelector('.t428-title');
  if(!bar){
    bar=doc.createElement('div');bar.className='t428-title';
    bar.innerHTML=`<button type="button" class="t428-name" data-t428-presets aria-haspopup="true" aria-label="Escolher um gráfico pronto">${ICO}<b></b><span aria-hidden="true">▾</span></button><span class="t428-mn"></span><button type="button" class="t428-ic" data-gp="full" aria-label="Ampliar o gráfico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button><button type="button" class="t428-ic" data-gp="help" aria-label="Ajuda do gráfico"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>`;
    el.prepend(bar);
  }
  bar.querySelector('b').textContent=t;bar.querySelector('.t428-mn').textContent=m+' <GO>';
  let rg=el.querySelector('.t428-range');
  if(!rg){rg=doc.createElement('div');rg.className='t428-range';bar.after(rg)}
  const [a,b]=rangeTxt(st.per);
  const sig=a+'|'+b;if(rg.dataset.s!==sig){rg.dataset.s=sig;rg.innerHTML=`<span>Período</span><i>${esc(a)}</i><em>–</em><i>${esc(b)}</i>`}
}
doc.addEventListener('click',e=>{
  const t=e.target.closest?.('[data-t428-presets]');
  if(t){e.preventDefault();e.stopPropagation();const real=doc.querySelector('#v421-gp .gp-bar1 [data-gp="presets"]');if(real)setTimeout(()=>real.click(),0);return}
  if(e.target.closest?.('#v421-gp'))setTimeout(decorate,60);
});
doc.addEventListener('change',e=>{if(e.target.closest?.('#v421-gp'))setTimeout(decorate,60)});

/* ---------- sub-abas do Terminal ---------- */
function markNav(){
  doc.querySelectorAll('#tf413 [data-tf415-nav]').forEach(b=>{
    const k=b.dataset.tf415Nav,on=termHome()?k===page:k==='WORKSPACES';
    b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
}
function advCard(){
  const dash=doc.getElementById('tf413');if(!dash)return;
  const lay=dash.querySelector('.tf413-layout');if(!lay)return;
  let c=dash.querySelector('.t428-adv');
  if(page==='HOME'){c?.remove();return}
  const p=PAGES[page];
  if(!c){c=doc.createElement('div');c.className='t428-adv';lay.after(c)}
  const sig=page;if(c.dataset.p===sig)return;c.dataset.p=sig;
  c.innerHTML=`<div><b>Painel avançado ${esc(p.m)}</b><small>A versão completa por comandos, com mais colunas, filtros e exportação (CSV).</small></div><button type="button" data-t428-adv="${esc(page)}">Abrir painel avançado</button>`;
}
function applyPage(){
  const dash=doc.getElementById('tf413');
  if(!termHome()){doc.body.removeAttribute('data-t428');return}
  doc.body.setAttribute('data-t428',page);
  if(dash){[...dash.classList].filter(x=>x.startsWith('t428-p-')).forEach(x=>dash.classList.remove(x));dash.classList.add('t428-p-'+page)}
  markNav();advCard();applyCtx();decorate();
}
root.addEventListener('click',e=>{
  if(pass)return;
  const adv=e.target.closest?.('[data-t428-adv]');
  if(adv){e.preventDefault();e.stopImmediatePropagation();
    const k=adv.dataset.t428Adv,b=doc.querySelector(`#tf413 [data-tf415-nav="${k}"]`);
    if(b){pass=true;try{b.click()}finally{pass=false}}
    doc.body.removeAttribute('data-t428');setTimeout(markNav,60);return}
  const nav=e.target.closest?.('#tf413 [data-tf415-nav]');if(!nav)return;
  const k=nav.dataset.tf415Nav;
  if(k==='WORKSPACES'){doc.body.removeAttribute('data-t428');setTimeout(markNav,60);return}
  if(!PAGES[k])return;
  page=k;LS.set('diario-v428-tpage',page);
  if(k==='HOME'){setTimeout(applyPage,40);return}
  e.preventDefault();e.stopImmediatePropagation();
  if(!doc.body.classList.contains('tf413-home')){
    const h=doc.querySelector('#tf413 [data-tf415-nav="HOME"]');
    if(h){pass=true;try{h.click()}finally{pass=false}}
  }
  setTimeout(applyPage,40);setTimeout(()=>doc.getElementById('tf413')?.scrollIntoView({block:'start'}),60);
},true);

doc.addEventListener('click',e=>{const n=e.target.closest?.('body.v428-cot #cotbox .m403-source-note');if(n)n.classList.toggle('v428-open')});


/* ---------- Estudos: todas as categorias numa faixa só (como na referência) ---------- */
function estudosChips(){
  if(curTab()!=='estudos')return;
  const nav=doc.querySelector('#app .dt397-category'),more=doc.querySelector('#app #dt401-more-list');
  if(!nav||!more||nav.dataset.v428)return;
  more.querySelectorAll('[data-dt397-view]').forEach(b=>{
    const c=doc.createElement('button');c.type='button';c.className='dt397-chip v428-chip';c.dataset.dt397View=b.dataset.dt397View;
    c.innerHTML=(b.querySelector('svg')?.outerHTML||'')+'<span>'+esc((b.textContent||'').trim())+'</span>';nav.appendChild(c);
  });
  nav.dataset.v428='1';doc.body.classList.add('v428-chips');
}

/* ---------- montagem ---------- */
function after(){
  try{estudosChips()}catch(e){}
  if(curTab()==='term')applyPage();
  else{doc.body.removeAttribute('data-t428')}
  if(inCot()){doc.body.classList.add('v428-cot');applyCtx();decorate()}else doc.body.classList.remove('v428-cot');
  if(!context()&&ctx){const api=root.DIARIO_V421;if(api){mem[ctx]=pick(api.get());LS.set('diario-v428-ctx',mem)}ctx=null}
}
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v428)return false;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{after()}catch(e){console.warn('v428',e)}return o};f.__v428=1;root.render0=f;return true;
}
hook();
let k=0;const iv=setInterval(()=>{k++;hook();try{after()}catch(e){}if(k>15)clearInterval(iv)},700);
// o Terminal e o Mercado se redesenham sozinhos: mantém a página e o título certos
setInterval(()=>{if(doc.hidden)return;try{if(curTab()==='term'||inCot())after()}catch(e){}},1500);
root.DIARIO_V428={get page(){return page},applyPage,decorate,context};
})(window);
