/* Diário de Trader v419
   1) Cotações sem tremer: atualiza preços no lugar, sem redesenhar a página.
   2) Início organizado em torno da decisão do dia, sem esconder funções.
   3) Acesso de volta a funções que tinham ficado sem caminho visível.
   Carregar por último (defer), depois de todos os outros scripts. */
(function(){
'use strict';
const doc=document;
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const cur=()=>{try{return tab}catch(e){return ''}};
const mkt=()=>{try{return MKT.tab}catch(e){return ''}};

/* ---------- 1. Atualização de cotações sem tremer ---------- */
// Nós criados pelas camadas visuais (ícones, busca, gráfico, painéis) são preservados.
const DECOR=/^(ta-|m3\d\d|m4\d\d|cq3\d\d|dt3\d\d|dt4\d\d|studio-|wf-|v419-)/;
const isDecor=n=>n.nodeType===1&&[...n.classList].some(c=>DECOR.test(c));
const kids=n=>[...n.childNodes].filter(x=>x.nodeType===1||(x.nodeType===3&&x.nodeValue.trim()));
const same=(a,b)=>a.nodeType===b.nodeType&&(a.nodeType!==1||a.tagName===b.tagName);

function patchAttrs(o,n){
  for(const a of [...n.attributes]){
    if(a.name==='class'){
      const keep=[...o.classList].filter(c=>DECOR.test(c)&&!n.classList.contains(c));
      const v=[n.className,...keep].join(' ').trim();
      if(o.className!==v)o.className=v;
    }else if(a.name==='style'){
      const disp=o.style.display;
      if(o.getAttribute('style')!==a.value)o.setAttribute('style',a.value);
      if(disp)o.style.display=disp; // filtro da busca de ativos
    }else if(o.getAttribute(a.name)!==a.value)o.setAttribute(a.name,a.value);
  }
}
function patchKids(o,n){
  const oc=kids(o),nc=kids(n);let i=0;
  for(const nn of nc){
    while(i<oc.length&&!same(oc[i],nn)&&isDecor(oc[i]))i++;
    // O pacote de ícones troca emojis (☆, 🔔, ↻) por SVG: mantém o ícone.
    if(i<oc.length&&nn.nodeType===3&&oc[i].nodeType===1&&(oc[i].tagName.toLowerCase()==='svg'||oc[i].classList.contains('ico'))){i++;continue}
    if(i>=oc.length||!same(oc[i],nn))return false;
    if(!patchNode(oc[i],nn))return false;
    i++;
  }
  for(;i<oc.length;i++)if(!isDecor(oc[i]))return false;
  return true;
}
function patchNode(o,n){
  if(o.nodeType===3){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;return true}
  patchAttrs(o,n);
  return patchKids(o,n);
}
// Atualiza os blocos da caixa de cotações no lugar onde as camadas visuais os colocaram
// (a lista e a barra são movidas para dentro do layout novo do Mercado).
const selOf=n=>n.id?'#'+CSS.escape(n.id):[...n.classList].filter(c=>!DECOR.test(c)).map(c=>'.'+CSS.escape(c)).join('');
function patchTop(box,fresh){
  const used=new Set();const plan=[];
  for(const fc of [...fresh.children]){
    const sel=selOf(fc);
    if(!sel||/cqtabs/.test(sel))continue; // sem chave (alertas) ou abas: não mudam com o estado igual
    const o=[...box.querySelectorAll(sel)].find(n=>!used.has(n)&&![...used].some(u=>u.contains(n)));
    if(o){used.add(o);plan.push([o,fc])}
    else if(/\.warn\b/.test(sel))plan.push([null,fc]);
    else return false;
  }
  for(const [o,fc] of plan){
    if(!o){const t=box.querySelector('.cqtabs');if(t)t.after(fc);else box.prepend(fc);continue}
    let ok=false;try{ok=patchNode(o,fc)}catch(e){}
    if(!ok){lock(o.parentElement);o.replaceWith(fc)}
  }
  box.querySelectorAll('.warn').forEach(w=>{if(!used.has(w)&&!plan.some(p=>p[1]===w))w.remove()});
  return true;
}
function lock(el){
  if(!el)return;
  const h=el.getBoundingClientRect().height;if(!h)return;
  el.style.minHeight=h+'px';clearTimeout(el.__v419);
  el.__v419=setTimeout(()=>{el.style.minHeight=''},900);
}
const frag=html=>{const t=doc.createElement('template');t.innerHTML=String(html).trim();return t.content};
// Assinatura do estado da tela: classe de ativos, lista/mapa, ordem, favoritos e alertas.
const stateSig=()=>{try{const ax=S.ax||{};return [CQ.aba,CQ.vis,CQ.ord,(ax.cqFav||[]).map(f=>f.s).join(','),(ax.alpx||[]).map(a=>a.id+(a.fired?'!':'')).join(',')].join('|')}catch(e){return ''}};

let lastSig=null;
function wrapQuotes(){
  if(typeof window.cotHtml!=='function'||typeof window.cqPinta!=='function'||window.cqPinta.__v419)return false;
  const prevCot=window.cotHtml;
  window.cotHtml=function(){const h=prevCot.apply(this,arguments);lastSig=stateSig();return h};
  window.cotHtml.__v419=1;
  const pinta=function(){
    if(cur()!=='mercado'||mkt()!=='cq')return;
    const box=doc.getElementById('cotbox')||doc.getElementById('cqbox');
    // Antes: sem #cotbox (ex.: EWZ e ADRs) o app redesenhava a página inteira a cada cotação.
    if(!box)return;
    const before=lastSig,now=stateSig();
    const html=window.cotHtml();
    const fresh=frag(html).firstElementChild;if(!fresh)return;
    if(fresh.id===box.id&&before===now){
      try{if(patchNode(box,fresh)||patchTop(box,fresh))return}catch(e){console.warn('v419 cotações',e)}
    }
    // Mudou a estrutura (outra classe, lista/mapa, favorito, alerta): troca só a caixa, com altura travada.
    const holder=box.closest('.market-monitor')||box.parentElement;
    lock(holder);
    let segs=null;try{if(typeof segGuarda==='function')segs=segGuarda()}catch(e){}
    box.replaceWith(fresh);
    try{if(segs&&typeof segRestaura==='function')segRestaura(segs)}catch(e){}
  };
  pinta.__v419=1;window.cqPinta=pinta;
  return true;
}
function wrapAdr(){
  if(typeof window.adrPaint!=='function'||window.adrPaint.__v419)return false;
  const prev=window.adrPaint;
  const paint=function(){
    const el=doc.getElementById('adr');if(!el)return;
    let html;try{html=adrHtml()}catch(e){return prev.apply(this,arguments)}
    const f=frag(html);
    try{
      const tmp=doc.createElement('div');tmp.appendChild(f.cloneNode(true));
      if(patchKids(el,tmp))return;
    }catch(e){}
    lock(el.closest('.market-monitor')||el);
    el.innerHTML=html;
  };
  paint.__v419=1;window.adrPaint=paint;
  return true;
}

/* ---------- 2. Início ---------- */
const OPEN_KEY='diario-v419-mais';
function heading(sec){return sec.textContent.trim().replace(/\s+/g,' ').slice(0,80)}
function phaseNow(){
  try{
    const p=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',weekday:'short',hour12:false}).formatToParts(new Date());
    const g=t=>(p.find(x=>x.type===t)||{}).value||'';
    const m=(+g('hour'))*60+(+g('minute'));
    if(/s[áa]b|dom/i.test(g('weekday')))return 'pos';
    if(m<9*60)return 'pre';
    if(m<=18*60+25)return 'pregao';
    return 'pos';
  }catch(e){return 'pregao'}
}
// Atalho de Registro rápido (só existia no botão + que foi removido).
function addQuick(page){
  const sc=page.querySelector('.dt393-shortcuts');
  if(sc&&!sc.querySelector('[data-qkn]')){
    const q=doc.createElement('button');q.type='button';q.dataset.qkn='1';q.className='v419-qk';
    q.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg> Registro rápido';
    const reg=sc.querySelector('[data-dt393-action="newtrade"]');
    if(reg)reg.after(q);else sc.prepend(q);
  }

}
function arrangeHome(){
  if(window.DIARIO_V420)return; // v420 assume o Início
  if(cur()!=='home')return;
  const page=doc.querySelector('#app .dt393-home');
  const ws=doc.getElementById('dt393-workspace');
  if(!page||!ws)return;
  const native=ws.querySelector('.dt393-native')||ws;
  const summary=page.querySelector('.dt393-summary');
  // No computador o Início tem layout próprio em colunas: só a fase do dia e o atalho mudam.
  const wide=matchMedia('(min-width: 901px)').matches;

  // Fase do dia pela hora de Brasília (antes ficava sempre "Pregão").
  const ph=page.querySelector('.dt393-phase:not(.dt393-phase-inner)');
  if(ph&&!ph.dataset.v419){
    ph.dataset.v419='1';
    const b=[...ph.querySelectorAll('button')];
    const now=phaseNow(),idx={pre:0,pregao:1,pos:2}[now];
    b.forEach((x,i)=>{x.classList.toggle('active',i===idx);if(i===idx)x.setAttribute('aria-current','true');else x.removeAttribute('aria-current')});
    if(b[2]){b[2].removeAttribute('data-dt393-route');b[2].dataset.v419Pos='1'}
  }

  if(wide){addQuick(page);const t=doc.getElementById('v419-mais');if(t)t.remove();ws.classList.remove('v419-recolhido');return}
  // Ordem: decisão do dia primeiro.
  const pick=re=>[...native.children].find(s=>re.test(heading(s)));
  const hoje=doc.getElementById('hg-hoje');
  const escala=pick(/^(Escala de turno|Trabalha em escala)/i);
  const trades=pick(/^ÚLTIMOS TRADES/i);
  let anchor=summary;
  for(const el of [hoje,escala,trades]){
    if(!el||!anchor)continue;
    if(anchor.nextElementSibling!==el)anchor.after(el);
    el.classList.add('v419-promovido');
    anchor=el;
  }
  if(trades){
    trades.querySelectorAll('*').forEach(n=>{if(n.children.length===0&&/Toque no \+/.test(n.textContent))n.textContent='Nenhum trade ainda. Use "Registrar trade" nos Atalhos rápidos para registrar o primeiro.'});
  }

  addQuick(page);
  // O restante do Início antigo fica recolhido, inteiro e funcional.
  if(!doc.getElementById('v419-mais')){
    const open=ls.get(OPEN_KEY)==='1';
    const t=doc.createElement('button');t.type='button';t.id='v419-mais';t.className='v419-mais';
    t.setAttribute('aria-controls','dt393-workspace');
    t.innerHTML='<span><b>Mais no Início</b><small>Rotina, carteiras, modalidades, calendário, inglês, patrimônio e personalização</small></span><i aria-hidden="true">▾</i>';
    ws.before(t);
    setOpen(open);
  }else setOpen(ls.get(OPEN_KEY)==='1');
}
function setOpen(open){
  const t=doc.getElementById('v419-mais'),ws=doc.getElementById('dt393-workspace');
  if(!t||!ws)return;
  t.setAttribute('aria-expanded',open?'true':'false');
  ws.classList.toggle('v419-recolhido',!open);
}

/* ---------- 3. Funções sem caminho visível ---------- */
function drawerExtras(){
  const list=doc.querySelector('#dt394-drawer .dt394-nav-list');
  if(!list||doc.getElementById('v419-drawer'))return;
  const box=doc.createElement('div');box.id='v419-drawer';
  box.innerHTML='<h3>Mercado ao vivo</h3>'+
    '<button type="button" data-dt393-route="live" data-dt394-filter="monitor ao vivo profit radar trades de olho ponte">Monitor ao vivo e trades de olho</button>'+
    '<button type="button" data-dt393-route="graf" data-dt394-filter="gráficos tradingview níveis">Gráficos TradingView</button>'+
    '<button type="button" data-qkn="1" data-dt394-filter="registro rápido trade anotar">Registro rápido de trade</button>';
  const acc=doc.getElementById('dt414-drawer-access');
  if(acc)acc.before(box);else list.appendChild(box);
}

/* ---------- Ligações ---------- */
doc.addEventListener('click',e=>{
  const t=e.target.closest('#v419-mais');
  if(t){e.preventDefault();const open=t.getAttribute('aria-expanded')!=='true';ls.set(OPEN_KEY,open?'1':'0');setOpen(open);return}
  const pos=e.target.closest('[data-v419-pos]');
  if(pos){
    e.preventDefault();e.stopImmediatePropagation();
    try{if(typeof GOR!=='undefined'&&GOR&&typeof GOR.deb==='function'){GOR.deb();scrollTo(0,0);return}}catch(err){}
    try{tab='dia';render();scrollTo(0,0)}catch(err){}
  }
},true);

function hook(){
  if(typeof window.render0!=='function'||window.render0.__v419)return false;
  const prev=window.render0;
  const r=function(){const out=prev.apply(this,arguments);try{arrangeHome()}catch(e){console.warn('v419 início',e)}try{drawerExtras()}catch(e){}return out};
  r.__v419=1;window.render0=r;return true;
}
// Alguns cartões (ex.: escala de turno) entram depois do render; reposiciona antes do próximo quadro.
let homeMo=null;
function watchHome(){
  const app=doc.getElementById('app');if(!app||homeMo)return;
  homeMo=new MutationObserver(()=>{
    if(window.DIARIO_V420||cur()!=='home'||matchMedia('(min-width: 901px)').matches)return;
    const nat=doc.querySelector('#dt393-workspace .dt393-native');if(!nat)return;
    for(const n of nat.children){
      if(n.tagName==='SECTION'&&/^(Escala de turno|Trabalha em escala|ÚLTIMOS TRADES)/i.test(heading(n))){try{arrangeHome()}catch(e){}return}
    }
  });
  homeMo.observe(app,{childList:true,subtree:true});
}
function boot(){watchHome();
  wrapQuotes();wrapAdr();hook();drawerExtras();
  try{arrangeHome()}catch(e){}
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
// Outras camadas podem ser montadas depois; confere por alguns segundos.
let n=0;const iv=setInterval(()=>{n++;wrapQuotes();wrapAdr();hook();drawerExtras();if(n>10)clearInterval(iv)},700);
window.DIARIO_V419={patchNode,lock,arrangeHome};
})();
