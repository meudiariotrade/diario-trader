/* Diário de Trader v427 — fechamento das pendências:
 *  A. botões flutuantes (👁 vai para o topo; IA menor e some ao rolar para baixo)
 *  B. checklist sem regras repetidas (junta cópias criadas em aparelhos novos, mantém as marcações)
 *  D. trava do dia avisada pelo push assim que acontece (reaproveita a função "notificar" já publicada)
 * Não apaga nenhuma função: o botão 👁 original continua existindo e é ele que o novo botão aciona. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};

/* ---------- B. regras repetidas ---------- */
const norm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
// devolve {lista, mapa velhoId->idMantido} ou null quando não há repetição
function dedupeList(list){
  if(!Array.isArray(list)||list.length<2)return null;
  // agrupa por categoria + texto; a cópia mantida é a de menor id, para que todos os aparelhos
  // escolham a mesma (assim dois aparelhos nunca apagam a cópia um do outro)
  const groups=new Map,order=[];
  for(const r of list){
    if(!r||typeof r!=='object')continue;
    const k=norm(r.t)?(r.cat??'')+'|'+norm(r.t):'\u0000'+order.length;
    if(!groups.has(k)){groups.set(k,[]);order.push(k)}
    groups.get(k).push(r);
  }
  const map={},out=[];
  for(const k of order){
    const gr=groups.get(k);
    const keep=gr.reduce((a,b)=>String(b.id)<String(a.id)?b:a);
    for(const r of gr){
      if(r===keep)continue;
      if(r.id!==keep.id)map[r.id]=keep.id;
      // preserva informações extras da cópia (fase, nota) sem sobrescrever a mantida
      for(const [kk,vv] of Object.entries(r))if(keep[kk]==null&&vv!=null)keep[kk]=vv;
    }
    out.push(keep);
  }
  return Object.keys(map).length||out.length!==list.length?{lista:out,mapa:map}:null;
}
function remapChk(chk,mapa){
  if(!chk||typeof chk!=='object')return false;let mud=false;
  for(const [velho,novo] of Object.entries(mapa)){
    if(!(velho in chk))continue;
    if(chk[velho])chk[novo]=true;else if(!(novo in chk))chk[novo]=chk[velho];
    delete chk[velho];mud=true;
  }
  return mud;
}
let dedupeBusy=false;
function dedupeRules(){
  if(dedupeBusy||typeof S!=='object'||!S)return 0;dedupeBusy=true;
  try{
    let total=0;const agora=Date.now();
    const br=dedupeList(S.rules),us=dedupeList(S.rulesUS);
    if(!br&&!us)return 0;
    if(br){
      S.rules=br.lista;total+=Object.keys(br.mapa).length;
      // marca as cópias como apagadas para que a sincronização não as traga de volta
      S.del=S.del||{};for(const id of Object.keys(br.mapa))S.del[id]=Math.max(+S.del[id]||0,agora);
    }
    if(us){S.rulesUS=us.lista;total+=Object.keys(us.mapa).length}
    for(const d of Object.values(S.days||{})){
      if(!d||typeof d!=='object')continue;let mud=false;
      if(br&&remapChk(d.chk,br.mapa))mud=true;
      if(us&&d.us&&remapChk(d.us.chk,us.mapa))mud=true;
      if(mud)d.u=Math.max(+d.u||0,agora);
    }
    S.mt=agora;
    try{save()}catch(e){try{persist()}catch(x){}}
    try{console.info('[v427] regras repetidas unidas:',total)}catch(e){}
    return total;
  }finally{dedupeBusy=false}
}
// impede que um aparelho novo crie as regras-padrão de novo quando a conta já tem regras na nuvem:
// depois de cada sincronização, as cópias são unidas e marcadas como apagadas.
function wrapMerge(){
  if(typeof root.mergeIn!=='function'||root.mergeIn.__v427)return;
  const prev=root.mergeIn;const f=function(){const o=prev.apply(this,arguments);try{setTimeout(dedupeRules,0)}catch(e){}return o};f.__v427=1;
  try{root.mergeIn=f}catch(e){}
}

/* ---------- A. botões flutuantes ---------- */
const EYE='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
function privOn(){
  const b=doc.getElementById('privb');if(!b)return false;
  const p=b.getAttribute('aria-pressed');if(p!=null)return p==='true';
  return /mostrar/i.test(b.getAttribute('aria-label')||'')||doc.body.classList.contains('priv')||doc.documentElement.classList.contains('priv');
}
function eyeButton(){
  const bar=doc.querySelector('.dt393-topbar .dt393-topactions');
  if(!bar||!doc.getElementById('privb'))return;
  let e=bar.querySelector('.v427-eye');
  if(!e){
    e=doc.createElement('button');e.type='button';e.className='v427-eye';
    bar.insertBefore(e,bar.firstChild);
  }
  const on=privOn();const sig=on?'1':'0';
  if(e.dataset.s!==sig){e.dataset.s=sig;e.innerHTML=on?EYE_OFF:EYE}
  e.setAttribute('aria-label',on?'Mostrar valores':'Esconder valores');e.setAttribute('aria-pressed',on?'true':'false');e.title=on?'Mostrar valores':'Esconder valores';
  doc.body.classList.add('v427-eye-top');
}
doc.addEventListener('click',e=>{
  const b=e.target.closest?.('.v427-eye');if(!b)return;
  e.preventDefault();const p=doc.getElementById('privb');if(p)p.click();
  setTimeout(eyeButton,30);setTimeout(eyeButton,300);
});
// IA: some ao rolar para baixo, volta ao rolar para cima ou parar no topo
let lastY=0,ticking=false;
function onScroll(){
  if(ticking)return;ticking=true;
  requestAnimationFrame(()=>{ticking=false;
    const y=root.scrollY||doc.documentElement.scrollTop||0;
    const down=y>lastY+6,up=y<lastY-6;
    if(y<80)doc.body.classList.remove('v427-fab-hide');
    else if(down)doc.body.classList.add('v427-fab-hide');
    else if(up)doc.body.classList.remove('v427-fab-hide');
    if(down||up||y<80)lastY=y;
  });
}
root.addEventListener('scroll',onScroll,{passive:true});

/* ---------- D. push da trava ---------- */
// O app já manda a trava para o servidor de notificações, mas só alguns segundos depois do banner.
// Aqui a checagem roda também depois de salvar um trade e a cada render, sem repetir envios (o app compara antes de enviar).
let pushT=0;
function travaPush(){
  if(typeof root.turnoPushSync!=='function'&&typeof turnoPushSync!=='function')return;
  try{if(typeof trvMarca==='function'&&typeof travaEstado==='function')trvMarca(travaEstado())}catch(e){}
  clearTimeout(pushT);pushT=setTimeout(()=>{try{turnoPushSync(false)}catch(e){}},1200);
}
doc.addEventListener('click',e=>{if(e.target.closest?.('[data-a="savetrade"],[data-trv="ok"]'))setTimeout(travaPush,400)});

/* ---------- C. tema claro ---------- */
// O visual verde-escuro (v393) prendia o app no escuro mesmo com "Claro" escolhido.
// Agora "Claro" (ou "Automático" com o aparelho no claro) liga o tema claro gerado das próprias cores do app.
// O Terminal continua escuro de propósito: gráficos e leitura de tela no padrão de terminal profissional.
const mq=root.matchMedia?root.matchMedia('(prefers-color-scheme: light)'):null;
function temaEscolhido(){return g(()=>ls.get('diario-theme'),null)||g(()=>JSON.parse(localStorage.getItem('diario-theme')),null)||'auto'}
function temaClaro(){
  // só quando a pessoa escolhe "Claro": o Automático mantém a identidade verde-escura de sempre
  const t=temaEscolhido();const claro=t==='light';
  const term=g(()=>tab,'')==='term';
  const on=claro&&!term;const html=doc.documentElement;
  if(on){
    if(!doc.getElementById('v427-claro-css')){const l=doc.createElement('link');l.id='v427-claro-css';l.rel='stylesheet';l.href='tema-claro-v427.css?v=427';doc.head.appendChild(l)}
    if(html.getAttribute('data-v427-tema')!=='claro')html.setAttribute('data-v427-tema','claro');
  }else if(html.hasAttribute('data-v427-tema'))html.removeAttribute('data-v427-tema');
  const meta=doc.querySelector('meta[name="theme-color"]');if(meta){const c=on?'#f3f7f5':'#03120f';if(meta.content!==c)meta.content=c}
}
if(mq&&mq.addEventListener)mq.addEventListener('change',temaClaro);
doc.addEventListener('click',e=>{if(e.target.closest?.('[data-a="theme"]'))setTimeout(temaClaro,30)});
temaClaro();

/* ---------- montagem ---------- */
function after(){eyeButton();temaClaro()}
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v427)return false;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{after()}catch(e){}return o};f.__v427=1;root.render0=f;return true;
}
function boot(){wrapMerge();hook();try{dedupeRules()}catch(e){}try{after()}catch(e){}}
boot();
let k=0;const iv=setInterval(()=>{k++;boot();if(k>12)clearInterval(iv)},700);
setInterval(()=>{if(!doc.hidden){try{dedupeRules();travaPush()}catch(e){}}},60000);
root.DIARIO_V427={dedupeRules,dedupeList,eyeButton,travaPush};
})(window);
