/* Estudos > Aulas, extensão isolada; sem escrita no servidor ou substituição de aulas. */
;(function(){
'use strict';
const T=window.TecnicaPratica,E=T.escape,names=['Contexto','Gatilho de Entrada','Stop Técnico','Alvo Projetado'];
let aulaSubaba='tradicionais',selected=null,step=0,visual=false,playing=false,loading=false,status='',owner='',progress={},storageOK=true,run=0,controller=null,audio=null,objectURL='',utterance=null,bridgeFailed=false,videoFailed=false,film=null;
const active=()=>typeof tab!=='undefined'&&tab==='estudos'&&typeof ESV!=='undefined'&&ESV==='aul';
const currentOwner=()=>typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):'visitante';
const key=()=>`diario:tecnica-pratica:v1:${owner}`;
function readOwner(){const next=currentOwner();if(next===owner)return;stop();owner=next;selected=null;visual=false;step=0;progress={};try{const p=JSON.parse(localStorage.getItem(key())||'{}');if(p&&typeof p==='object'&&!Array.isArray(p))progress=p;for(const l of T.lessons){const r=progress[l.id];if(!r||typeof r!=='object')continue;r.answers=Array.isArray(r.answers)?r.answers.map(a=>Number.isInteger(a)&&a>=0&&a<3?a:null):[];r.viewed=Array.isArray(r.viewed)?r.viewed.filter(s=>Number.isInteger(s)&&s>=0&&s<=3):[];}storageOK=true;}catch{storageOK=false;}}
function save(){try{localStorage.setItem(key(),JSON.stringify(progress));storageOK=true;}catch{storageOK=false;}}
function record(l){let r=progress[l.id];if(!r||typeof r!=='object'||!Array.isArray(r.answers))r=progress[l.id]={step:0,answers:[],viewed:[]};if(!Array.isArray(r.viewed))r.viewed=[];return r;}
function passed(l){const r=progress[l.id];return !!r&&l.questions.every((q,i)=>r.answers?.[i]===q.answer)&&[0,1,2,3].every(s=>r.viewed?.includes(s));}
function asset(name){return 'avatar-'+name;}
function mentor(){const image=visual?asset('mentor-chart.png'):asset('mentor.png');return `<aside class="tp-mentor ${visual?'tp-pip':''} ${playing?'tp-speaking':''}" aria-label="Avatar Mentor"><img src="${image}" alt="Mentor 3D ${visual?'apontando para um gráfico':'no estúdio de podcast'}" data-tp-image="1"><div class="tp-avatar-fallback" hidden><b>MENTOR</b><span>Acompanhe o gráfico e o roteiro da aula</span></div>${playing&&!videoFailed?`<video data-tp-video="1" src="${asset('talking.mp4')}" autoplay loop muted playsinline preload="none" aria-label="Gestos do mentor"></video>`:''}<small>${playing?'Mentor narrando':loading?'Preparando voz':'Avatar Mentor'}</small></aside>`;}
function catalog(){
 const lessons=T.lessons.filter(l=>l.pdf),done=lessons.filter(passed).length;
 return `<header class="tp-head"><span>MENTOR 3D · AULAS CRIADAS COM SEUS PDFs</span><h2>Minhas aulas do Mentor</h2><p>Suas aulas geradas a partir dos PDFs enviados. O histórico é exclusivo da sua conta; nenhuma lição demonstrativa aparece aqui.</p></header>`+
 (lessons.length?`<div class="tp-progress"><progress max="${lessons.length}" value="${done}" aria-label="Progresso das minhas aulas"></progress><b>${done}/${lessons.length} concluídas</b></div><div class="tp-modules" aria-label="Minhas aulas geradas">${lessons.map(l=>`<button type="button" data-tp-lesson="${E(l.id)}" class="tp-lesson-row"><span>${passed(l)?'✓ ':''}${E(l.title)}</span><small>${progress[l.id]?.answers?.filter(Number.isInteger).length||0}/3 respostas · ${l.minutes||3} min</small></button>`).join('')}</div>`:
 '<div class="tp-empty" role="status"><strong>Nenhuma aula gerada ainda</strong><p>Use o gerador abaixo para enviar um PDF, escolher até 150 páginas e criar sua primeira aula com o Mentor 3D.</p></div>');
}

function quiz(l){const r=record(l);return `<section class="tp-check" aria-label="Mini-check de fixação"><h3>Mini-check de fixação</h3><p>Três perguntas. O feedback aparece ao responder; você pode tentar novamente.</p>${l.questions.map((q,i)=>{const a=r.answers[i],answered=Number.isInteger(a)&&a>=0&&a<q.options.length,ok=a===q.answer;return `<fieldset><legend>${i+1}. ${E(q.q)}</legend>${q.options.map((o,j)=>`<label class="${answered&&a===j?(ok?'tp-correct':'tp-wrong'):''}"><input type="radio" name="tp-${l.id}-${i}" data-tp-question="${i}" value="${j}" ${answered&&a===j?'checked':''}>${E(o)}</label>`).join('')}<p class="tp-feedback" data-tp-feedback="${i}" role="status">${answered?(ok?'Correto. ':'Reveja. ')+E(q.why):''}</p></fieldset>`;}).join('')}<p class="tp-result" role="status">${passed(l)?'✓ Lição concluída: quatro etapas vistas e três respostas corretas.':`Etapas vistas: ${[0,1,2,3].filter(s=>r.viewed.includes(s)).length}/4 · Acertos: ${l.questions.filter((q,i)=>r.answers[i]===q.answer).length}/3`}</p></section>`;}
function bridgeDetails(){return `<details class="tp-bridge" ${film?'open':''}><summary>Vídeo com voz neural · Ponte Vídeo</summary><p>O PC gera e envia o vídeo completo para sua conta. A ponte trabalha em segundo plano, sem endereço ou porta. Após atualizar a ponte, mantenha-a ligada e consulte o vídeo aqui.</p><div class="tp-controls">${['16x9','9x16','1x1'].map(f=>`<button type="button" data-tp-film="${f}">Assistir ${f.replace('x',':')}</button>`).join('')}</div>${film?`<video class="tp-full-video" data-tp-film-player controls playsinline preload="auto" src="${E(film)}" aria-label="Videoaula narrada da trilha"></video><button type="button" data-tp-action="close-film">Fechar vídeo</button>`:''}<p>Ouvir Aula utiliza exclusivamente a voz configurada na Ponte Vídeo do PC. Sem substituição pela voz do navegador.</p></details>`;}
async function openFilm(format){
 stop();const token=run,l=T.lessons.find(l=>l.id===selected);if(!l)return;
 if(typeof SESS==='undefined'||!SESS?.uid){status='Entre na sua conta para assistir ao vídeo da ponte.';paint();return;}
 status='Consultando vídeo na sua conta…';loading=true;paint();
 const ctl=controller=new AbortController(),timeout=setTimeout(()=>ctl.abort(),10000);
 try{
  await tok();if(token!==run||currentOwner()!==owner)return;
  const c=cfg(),path=encodeURIComponent(SESS.uid)+'/'+(l.videoId||'tecnica-v1-'+l.id)+'-'+format+'.mp4';
  const res=await fetch(c.url+'/storage/v1/object/sign/aulas-videos/'+path,{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({expiresIn:3600}),signal:ctl.signal});
  const data=await res.json();if(token!==run||currentOwner()!==owner||!active())return;
  if(!res.ok||!data.signedURL)throw Error('missing');
  const url=new URL(c.url+'/storage/v1'+data.signedURL);
  if(url.origin!==new URL(c.url).origin||!url.pathname.startsWith('/storage/v1/object/sign/aulas-videos/'+path))throw Error('invalid');
  film=url.href;loading=false;status='Vídeo pronto. Toque em reproduzir nos controles abaixo.';paint();
 }catch{if(token!==run)return;loading=false;status='Vídeo ainda indisponível neste formato. Confirme que a ponte foi atualizada e aguarde a geração e o envio pelo PC. O áudio somente será reproduzido pela ponte de voz configurada no PC.';paint();}
 finally{clearTimeout(timeout);if(controller===ctl)controller=null;}
}
function lesson(l){const idx=T.lessons.indexOf(l),r=record(l);return `<header class="tp-head"><button type="button" data-tp-action="catalog">← Todas as lições</button><span>ANÁLISE TÉCNICA NA PRÁTICA · ${idx+1}/${T.lessons.length}</span><h2 tabindex="-1" id="tp-title">${E(l.title)}</h2><p>${l.minutes||3} min de leitura · ${E(T.modules.find(m=>m.id===l.module).reference)}</p></header><div class="tp-class ${visual?'tp-visual':''}"><div class="tp-main"><p class="tp-summary">${E(l.summary)}</p><div class="tp-controls"><button type="button" data-tp-action="listen" ${loading?'disabled':''}>${loading?'Preparando…':playing?'Reiniciar etapa':visual?'Ouvir etapa':'Ouvir Aula'}</button><button type="button" data-tp-action="pause" ${!playing&&!loading?'disabled':''}>Pausar</button><button type="button" data-tp-action="visual">${visual?'Voltar à abertura':'Explorar o exemplo'}</button></div><p class="tp-status" role="status" aria-live="polite">${E(status)}</p>${visual?`<div class="tp-stages" role="navigation" aria-label="Etapas da lição">${(l.stageNames||names).map((n,i)=>`<button type="button" data-tp-step="${i}" aria-current="${step===i?'step':'false'}">${i+1}. ${E(n)}</button>`).join('')}</div><div class="tp-chart">${T.chart(l,step)}</div><section class="tp-script"><h3>${step+1}. ${E((l.stageNames||names)[step])}</h3><p>${E(l.stages[step])}</p></section><div class="tp-controls"><button type="button" data-tp-action="prev" ${step===0?'disabled':''}>← Etapa anterior</button><button type="button" data-tp-action="next" ${step===3?'disabled':''}>Próxima etapa →</button></div>`:`<p class="tp-intro">Ouça a explicação com etapas sincronizadas ou explore o gráfico no seu ritmo. Os níveis de preço são didáticos e não representam uma operação em andamento.</p>`}</div>${mentor()}</div>${visual?quiz(l):''}<div class="tp-footer"><button type="button" data-tp-lesson="${T.lessons[Math.max(0,idx-1)].id}" ${idx===0?'disabled':''}>← Lição anterior</button><button type="button" data-tp-lesson="${T.lessons[Math.min(T.lessons.length-1,idx+1)].id}" ${idx===T.lessons.length-1?'disabled':''}>Próxima lição →</button></div>${bridgeDetails()}<p class="tp-note">${l.pdf?'Aula gerada a partir do PDF selecionado. Confira o conteúdo com o material original.':'Exemplo autoral hipotético, inspirado em conceitos clássicos. Não reproduz uma página do livro.'} ${!storageOK?'O navegador bloqueou o armazenamento: progresso somente nesta sessão.':''}</p>`;}
function markup(){readOwner();const pdfControls=T.pdfControls?.()||'',voiceControls=T.voiceControls?.()||'';const l=T.lessons.find(l=>l.id===selected&&l.pdf);return `<section id="tp-root" class="tp-root ${visual&&l?'tp-is-visual':''}" aria-label="Aulas geradas pelo Mentor 3D">${l?lesson(l):catalog()}${voiceControls}${pdfControls}</section>`;}
function paint(focus=false){const root=document.getElementById('tp-root');if(!root||!active())return;root.outerHTML=markup();const v=document.querySelector('#tp-root [data-tp-video]');if(v){v.muted=true;v.defaultMuted=true;}if(v)v.play().catch(()=>{videoFailed=true;v.remove();});dock();if(focus)document.getElementById('tp-title')?.focus({preventScroll:true});}
function dock(){const root=document.getElementById('tp-root'),mentor=root?.querySelector('.tp-pip');if(!root||!mentor)return;const rect=root.getBoundingClientRect();root.style.setProperty('--tp-right',Math.max(16,window.innerWidth-rect.right+16)+'px');mentor.style.visibility=window.innerWidth>=1000&&(rect.bottom<110||rect.top>window.innerHeight-80)?'hidden':'';}
let dockFrame=0;function scheduleDock(){if(dockFrame)return;dockFrame=requestAnimationFrame(()=>{dockFrame=0;dock();});}
window.addEventListener('scroll',scheduleDock,{passive:true});window.addEventListener('resize',scheduleDock,{passive:true});
function releaseAudio(){if(audio){audio.onended=audio.onerror=audio.onplaying=audio.onpause=null;audio.pause();audio.removeAttribute('src');audio.load();audio=null;}if(objectURL){URL.revokeObjectURL(objectURL);objectURL='';}}
function stop(){document.querySelector('#tp-root [data-tp-video]')?.pause();const player=document.querySelector('#tp-root [data-tp-film-player]');if(player){player.pause();player.removeAttribute('src');player.load();}film=null;run++;controller?.abort();controller=null;releaseAudio();if(utterance){utterance.onend=utterance.onerror=utterance.onstart=null;window.speechSynthesis?.cancel();utterance=null;}playing=false;loading=false;}
function mark(){const l=T.lessons.find(l=>l.id===selected);if(!l||!visual)return;const r=record(l);r.step=step;if(!r.viewed.includes(step))r.viewed.push(step);save();}
function validEndpoint(s){try{const u=new URL(s);if(u.username||u.password||u.hash)return false;return ['http:','https:'].includes(u.protocol);}catch{return false;}}
function configuredBridge(){let stored='';try{stored=localStorage.getItem('diario:ponte-video:voz-url')||'';}catch{}const candidate=window.DIARIO_PONTE_VIDEO?.vozUrl||stored;return candidate&&validEndpoint(candidate)?candidate:'';}
function finishScene(token){if(token!==run||!active()||currentOwner()!==owner)return;playing=false;loading=false;utterance=null;releaseAudio();if(step<3){step++;mark();paint();speak();}else{status='Narração concluída. Responda ao mini-check abaixo.';paint();}}
async function speak(){
 const l=T.lessons.find(l=>l.id===selected);if(!l||!active())return;
 stop();bridgeFailed=false;const token=run;visual=true;loading=true;status='Preparando narração da etapa…';mark();paint();
 const text=T.normalizarTextoParaVoz(`${step+1}. ${(l.stageNames||names)[step]}. ${l.roteiroVoz?.etapas?.[step]||l.stages[step]}`);
 const endpoint=configuredBridge();
 if(endpoint&&!bridgeFailed){
  const ctl=controller=new AbortController(),timeout=setTimeout(()=>ctl.abort(),8000);
  try{
   const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,lang:'pt-BR',lesson_id:l.id,stage:step}),signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer'});
   if(!res.ok||!/^audio\//i.test(res.headers.get('content-type')||''))throw Error('Resposta de áudio inválida');
   const blob=await res.blob();if(!blob.size||blob.size>30*1024*1024)throw Error('Áudio vazio ou grande demais');
   if(token!==run)return;
   objectURL=URL.createObjectURL(blob);audio=new Audio(objectURL);audio.preload='auto';
   audio.onplaying=()=>{if(token!==run)return;playing=true;loading=false;status='Narrando pela Ponte Vídeo.';paint();};
   audio.onpause=()=>{if(token!==run||!playing)return;playing=false;status='Áudio pausado. Toque em Ouvir etapa para reiniciá-la.';paint();};
   audio.onended=()=>finishScene(token);audio.onerror=()=>{if(token!==run)return;releaseAudio();bridgeFailed=true;playing=false;loading=false;status='Áudio da ponte interrompido. Confira a ponte no PC e tente novamente.';paint();};
   await audio.play();return;
  }catch{if(token!==run)return;releaseAudio();bridgeFailed=true;}
  finally{clearTimeout(timeout);if(controller===ctl)controller=null;}
 }
 loading=false;playing=false;status=endpoint?'Ponte de voz indisponível. Confira a conexão local do PC e tente novamente.':'Configure ou ligue a ponte de voz do PC para ouvir a aula. A voz do navegador não será usada.';paint();
}
function aulasTabs(){return `<nav class="tp-aulas-nav" role="tablist" aria-label="Tipos de aulas"><button type="button" role="tab" data-tp-aula-sub="tradicionais" aria-selected="${aulaSubaba==='tradicionais'}" class="${aulaSubaba==='tradicionais'?'on':''}">Aulas Tradicionais</button><button type="button" role="tab" data-tp-aula-sub="mentor" aria-selected="${aulaSubaba==='mentor'}" class="${aulaSubaba==='mentor'?'on':''}">Mentor 3D</button></nav>`;}
const previous=typeof vEstudos==='function'?vEstudos:null;
if(previous)vEstudos=function(){
 const html=previous.apply(this,arguments);
 if(!active())return html;
 const nav=aulasTabs();
 // Montagem exclusiva: a sub-aba não selecionada não fica escondida no DOM.
 if(aulaSubaba==='mentor')return '<h1>Estudos</h1>'+nav+markup();
 return /<h1[^>]*>Estudos<\/h1>/.test(html)?html.replace(/<h1[^>]*>Estudos<\/h1>/,s=>s+nav):nav+html;
};
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-tp-aula-sub]');
 if(!b||!active())return;
 e.preventDefault();e.stopImmediatePropagation();
 const next=b.dataset.tpAulaSub;
 if(!['tradicionais','mentor'].includes(next)||next===aulaSubaba)return;
 stop();document.dispatchEvent(new Event('au-study-pause'));aulaSubaba=next;selected=null;visual=false;status='';
 if(typeof render==='function')render();
},true);
document.addEventListener('click',e=>{
 const b=e.target.closest?.('#tp-root button');if(!b||!active())return;if(b.dataset.tpDict||b.dataset.tpPdf||b.closest('[data-tp-pdf-form]'))return;e.preventDefault();e.stopPropagation();readOwner();
 if(b.dataset.tpFilm){document.dispatchEvent(new Event('au-study-pause'));openFilm(b.dataset.tpFilm);return;}
 if(b.dataset.tpLesson){stop();selected=b.dataset.tpLesson;step=0;visual=false;status='';bridgeFailed=false;paint(true);document.getElementById('tp-root')?.scrollIntoView({block:'start'});return;}
 if(b.hasAttribute('data-tp-step')){stop();step=Number(b.dataset.tpStep);status='';mark();paint();return;}
 switch(b.dataset.tpAction){
 case 'close-film':stop();status='Vídeo fechado.';paint();break;
 case 'catalog':stop();selected=null;visual=false;status='';paint();break;
 case 'listen':document.dispatchEvent(new Event('au-study-pause'));speak();break;
 case 'pause':stop();status='Pausado. Ouvir etapa reinicia a etapa atual.';paint();break;
 case 'visual':stop();visual=!visual;status='';mark();paint();break;
 case 'prev':case 'next':stop();step=Math.max(0,Math.min(3,step+(b.dataset.tpAction==='next'?1:-1)));status='';mark();paint();break;

 }
},true);
document.addEventListener('change',e=>{
 const el=e.target.closest?.('#tp-root [data-tp-question]');if(!el||!active())return;
 readOwner();const l=T.lessons.find(l=>l.id===selected);if(!l)return;
 const i=Number(el.dataset.tpQuestion),answer=Number(el.value);if(!l.questions[i]||!Number.isInteger(answer)||answer<0||answer>2)return;
 record(l).answers[i]=answer;save();
 const field=el.closest('fieldset'),q=l.questions[i];field.querySelectorAll('label').forEach(label=>label.classList.remove('tp-correct','tp-wrong'));el.closest('label').classList.add(answer===q.answer?'tp-correct':'tp-wrong');field.querySelector('.tp-feedback').textContent=(answer===q.answer?'Correto. ':'Reveja. ')+q.why;
 const r=record(l);document.querySelector('#tp-root .tp-result').textContent=passed(l)?'✓ Lição concluída: quatro etapas vistas e três respostas corretas.':`Etapas vistas: ${[0,1,2,3].filter(s=>r.viewed.includes(s)).length}/4 · Acertos: ${l.questions.filter((q,i)=>r.answers[i]===q.answer).length}/3`;
});
document.addEventListener('error',e=>{
 const el=e.target;if(!el.closest?.('#tp-root'))return;
 if(el.matches('[data-tp-image]')){el.hidden=true;const fallback=el.parentElement.querySelector('.tp-avatar-fallback');if(fallback)fallback.hidden=false;}
 if(el.matches('[data-tp-film-player]')){status='Não foi possível reproduzir o vídeo. Consulte novamente para renovar o acesso.';stop();paint();}
 if(el.matches('[data-tp-video]')){videoFailed=true;el.remove();}
},true);
// A desmontagem da aba e a troca de conta cancelam áudio, fetch e gestos imediatamente.
const observer=new MutationObserver(()=>{if((playing||loading||film)&&(!active()||!document.getElementById('tp-root')||currentOwner()!==owner)){stop();status='';}if(currentOwner()!==owner&&document.getElementById('tp-root')&&active()){readOwner();paint();}});observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(film)return;if(document.hidden&&(playing||loading)){stop();status='Pausado ao sair da tela. Ouvir etapa reinicia a etapa atual.';paint();}});
window.addEventListener('pagehide',()=>stop());
// Evita duas narrações simultâneas ao abrir uma aula antiga.
document.addEventListener('click',e=>{if(e.target.closest?.('[data-auopen]')&&(playing||loading||film)){stop();status='Pausado ao abrir outra aula.';paint();}},true);
// A lista antiga sincroniza a cada 30 s e chama render(). Não desmontar mídia
// da mesma conta/aba; a lista atualizada aparecerá ao fechar o vídeo ou sair.
const previousRender=typeof render==='function'?render:null;
let disposed=false;
function renderWithPlayback(){
 if(!disposed&&(playing||loading||film)){
  if(active()&&currentOwner()===owner&&document.getElementById('tp-root'))return;
  stop();
 }
 return previousRender?.apply(this,arguments);
}
if(previousRender)render=renderWithPlayback;
T.view={markup,stop,refresh:paint,isMediaActive:()=>!!(playing||loading||film),dispose(){disposed=true;T.pdf?.dispose();stop();if(typeof render==='function'&&render===renderWithPlayback)render=previousRender;observer.disconnect();cancelAnimationFrame(dockFrame);window.removeEventListener('scroll',scheduleDock);window.removeEventListener('resize',scheduleDock);}};
})();
