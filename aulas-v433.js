/* Diário de Trader v433 — Videoaulas: tela, legenda e animação
 * 1) Formato da tela: "Ajustar" (ocupa tudo), "16:9" (vídeo deitado) ou "9:16" (vertical, para stories),
 *    com os visuais crescendo para preencher a área; tela cheia quando o aparelho permite.
 * 2) Modo cinema no celular deitado: barra de cima e controles somem durante a narração (toque mostra).
 * 3) Legenda palavra por palavra (estilo karaokê), sincronizada com a voz quando o aparelho informa
 *    a posição da fala; senão, pelo ritmo estimado.
 * 4) Animação de entrada estilo quadro-branco: linhas e gráficos "desenhados", itens surgindo.
 * Não altera o roteiro nem a narração; só a apresentação. Nenhuma função removida. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const LSF='diario-v433-formato',FORMATOS=['ajustar','169','916'],NOME={ajustar:'Ajustar',169:'16:9',916:'9:16'};
const lsg=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}};
const lss=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const vel=()=>{try{return +JSON.parse(localStorage.getItem('aulas-vel'))||1}catch(e){return 1}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 1) formato e tela cheia ---------- */
function aplicaFormato(aup){
  const f=lsg(LSF,'ajustar');FORMATOS.forEach(x=>aup.classList.toggle('v433-f'+x,x===f));
  const b=aup.querySelector('.v433-fmt');if(b){b.textContent=NOME[f];b.setAttribute('aria-label','Formato da tela: '+NOME[f]+'. Toque para trocar.')}
}
function poeBotoes(aup){
  const top=aup.querySelector('.aup-top');if(!top||top.querySelector('.v433-fmt'))return;
  const ref=top.querySelector('.aup-ix')||top.lastElementChild;
  const f=doc.createElement('button');f.type='button';f.className='v433-fmt';f.title='Formato da tela';
  top.insertBefore(f,ref);
  const el=aup;const pode=!!(el.requestFullscreen||el.webkitRequestFullscreen);
  if(pode){const fs=doc.createElement('button');fs.type='button';fs.className='v433-fs';fs.setAttribute('aria-label','Tela cheia');fs.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';top.insertBefore(fs,ref)}
  aplicaFormato(aup);
}
doc.addEventListener('click',e=>{
  const f=e.target.closest&&e.target.closest('.v433-fmt');
  if(f){e.preventDefault();e.stopPropagation();const i=FORMATOS.indexOf(lsg(LSF,'ajustar'));lss(LSF,FORMATOS[(i+1)%FORMATOS.length]);const a=doc.getElementById('aup');if(a){aplicaFormato(a);mostraUI(a)}return}
  const fs=e.target.closest&&e.target.closest('.v433-fs');
  if(fs){e.preventDefault();e.stopPropagation();const a=doc.getElementById('aup');if(!a)return;
    const em=doc.fullscreenElement||doc.webkitFullscreenElement;
    try{if(em){(doc.exitFullscreen||doc.webkitExitFullscreen).call(doc)}else{(a.requestFullscreen||a.webkitRequestFullscreen).call(a);try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(x){}}}catch(x){}
    return}
},true);

/* ---------- 2) modo cinema (celular deitado) ---------- */
let tUI=0;
const deitado=()=>root.matchMedia&&root.matchMedia('(orientation:landscape) and (max-height:540px)').matches;
const tocando=a=>{const pp=a.querySelector('.aup-pp');return !!(pp&&/pausar/i.test(pp.getAttribute('aria-label')||''))};
function mostraUI(a){a.classList.remove('v433-esconde');clearTimeout(tUI);tUI=setTimeout(()=>{if(deitado()&&tocando(a)&&!a.querySelector('.aup-idx:not([hidden]),#aupoptions:not([hidden])'))a.classList.add('v433-esconde')},3200)}
doc.addEventListener('pointerdown',e=>{const a=doc.getElementById('aup');if(a&&a.contains(e.target)){const escondida=a.classList.contains('v433-esconde');mostraUI(a);if(escondida&&e.target.closest('.aup-stage')){e.preventDefault();e.stopPropagation()}}},true);

/* ---------- 3) legenda palavra por palavra ---------- */
const K={txt:'',spans:[],t:0,ini:0,dur:0,bound:0,mexe:false};
function montaLegenda(cap){
  const t=(cap.textContent||'').trim();
  if(!t||t===K.txt||cap.querySelector('.mut'))return;
  K.txt=t;clearInterval(K.t);
  const palavras=t.split(/(\s+)/);let pos=0;
  K.mexe=true;
  cap.innerHTML=palavras.map(p=>{const s=pos;pos+=p.length;return /\s/.test(p)||!p?p:`<span class="v433-w" data-c="${s}">${esc(p)}</span>`}).join('');
  K.mexe=false;
  K.spans=[...cap.querySelectorAll('.v433-w')];K.ini=performance.now();K.dur=Math.max(1200,t.length/14.5/vel()*1000);
  K.t=setInterval(()=>{
    if(!K.spans.length||!K.spans[0].isConnected){clearInterval(K.t);return}
    if(performance.now()-K.bound<1200)return; // a voz está informando a posição: ela manda
    const a=doc.getElementById('aup');if(a&&!tocando(a))return;
    const fr=Math.min(1,(performance.now()-K.ini)/K.dur),n=Math.floor(fr*K.spans.length);
    marca(n);
    if(fr>=1)clearInterval(K.t);
  },90);
}
function marca(n){K.spans.forEach((s,i)=>{s.classList.toggle('dito',i<n);s.classList.toggle('agora',i===n)})}
function porCaractere(ci){let n=0;for(let i=0;i<K.spans.length;i++){if(+K.spans[i].dataset.c<=ci)n=i;else break}marca(n)}
// a voz do aparelho informa a palavra que está sendo dita (quando suporta)
try{
  const ss=root.speechSynthesis;
  if(ss&&!ss.__v433){const orig=ss.speak.bind(ss);ss.speak=function(u){try{const tx=(u&&u.text||'').trim();u.addEventListener('boundary',ev=>{if(ev.name&&ev.name!=='word')return;if(tx&&K.txt&&tx.replace(/\s+/g,' ')===K.txt.replace(/\s+/g,' ')){K.bound=performance.now();porCaractere(ev.charIndex||0)}})}catch(e){}return orig(u)};ss.__v433=1}
}catch(e){}

/* ---------- 4) animação de entrada ---------- */
function anima(vis){
  const ct=doc.getElementById('aupct'),chave=(ct&&ct.textContent||'')+'|'+vis.className;
  if(vis.dataset.v433===chave)return;vis.dataset.v433=chave;
  if(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  vis.querySelectorAll('svg path,svg polyline,svg line').forEach((el,i)=>{
    if(el.dataset.v433)return;el.dataset.v433='1';
    let L=0;try{L=el.getTotalLength?el.getTotalLength():0}catch(e){}
    if(!L||L<8)return;
    el.style.strokeDasharray=L+' '+L;el.style.strokeDashoffset=L;
    el.getBoundingClientRect();
    el.style.transition=`stroke-dashoffset ${Math.min(1400,500+L*1.2)}ms cubic-bezier(.4,.1,.2,1) ${Math.min(i*40,600)}ms`;
    requestAnimationFrame(()=>{el.style.strokeDashoffset='0'});
    setTimeout(()=>{el.style.strokeDasharray='';el.style.strokeDashoffset='';el.style.transition=''},2400);
  });
  vis.classList.remove('v433-in');void vis.offsetWidth;vis.classList.add('v433-in');
}

/* ---------- observa o player ---------- */
let obs=null,atual=null;
function liga(){
  const a=doc.getElementById('aup');
  if(!a){atual=null;if(obs){obs.disconnect();obs=null}return}
  if(a===atual)return;atual=a;
  poeBotoes(a);mostraUI(a);
  const cap=a.querySelector('#aupcap'),vis=a.querySelector('#aupvis');
  obs=new MutationObserver(ms=>{
    for(const m of ms){
      if(cap&&(m.target===cap||cap.contains(m.target))&&!K.mexe)montaLegenda(cap);
      if(vis&&(m.target===vis||vis.contains(m.target)))anima(vis);
      if(m.target.classList&&m.target.classList.contains('aup-pp'))mostraUI(a);
    }
  });
  obs.observe(a,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label']});
  if(vis&&vis.innerHTML)anima(vis);if(cap)montaLegenda(cap);
}
new MutationObserver(()=>liga()).observe(doc.body,{childList:true});
setInterval(liga,1500);
root.DIARIO_V433={liga,aplicaFormato};
})(window);
