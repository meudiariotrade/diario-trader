/* v544 — sincronização das aulas entre aparelhos, sem iniciar novas gerações. */
(function(root,doc){
 'use strict';
 if(root.DiarioAulasRecuperacao)return;
 const PERIOD=30000,STALE=15*60000;
 let attempt=0,owner='',running=false,queued=false;
 const uid=()=>{try{return SESS?.uid||''}catch{return ''}};
 const visible=()=>{try{return tab==='estudos'&&ESV==='aul'&&(!root.AULAS?._dbg?.P?.on||!!doc.querySelector('#aup.au361-floating'))&&!doc.hidden&&!!doc.querySelector('#app:not(.v503-fantasma) .au-intro')?.getClientRects().length}catch{return false}};
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const stamp=value=>{const d=new Date(value);return Number.isFinite(+d)?d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''};
 function gerandoHtml(a,context){
  if(context.busy&&context.meu)return '';
  const changed=Date.parse(a.atualizado_em||a.criado_em||'');
  if(!Number.isFinite(changed)||Date.now()-changed<STALE)return '';
  const partial=Array.isArray(a.partes)&&a.partes.length>0;
  return `<div class="card au-ger au-stale"><b>Aula ${esc(a.numero)} · geração sem atualização</b><p class="sm mut">Última atualização: ${esc(stamp(changed))}. O roteiro pode ter sido interrompido. Isso é diferente da geração de áudio ou vídeo pela ponte.</p>${partial?`<button type="button" class="btn s" data-auopen="${esc(a.id)}">Ver roteiro parcial</button>`:''}<button type="button" class="btn s" data-aulas-refresh>Verificar novamente</button>${context.meu?'<button type="button" class="btn s" data-aucont="1">Continuar geração</button>':'<p class="sm mut">Para completar, continue no aparelho que iniciou a geração ou selecione os capítulos que faltam em Nova aula. O conteúdo já salvo permanece guardado.</p>'}</div>`;
 }
 function paint(){
  if(!visible())return;
  const host=doc.querySelector('#app:not(.v503-fantasma) .au-intro');if(!host)return;
  let card=doc.querySelector('#app:not(.v503-fantasma) #aulas-sync');
  if(!card){card=doc.createElement('section');card.id='aulas-sync';card.className='card';card.setAttribute('aria-label','Atualização das aulas');card.innerHTML='<div class="top"><b>Suas aulas</b><button type="button" class="btn s" data-aulas-refresh>Atualizar aulas</button></div><p class="sm mut" data-aulas-status role="status"></p><p class="sm mut">O roteiro pode ficar pronto antes do áudio e do vídeo. A ponte do PC prepara esses arquivos em uma etapa separada.</p><button type="button" class="btn s" data-dt393-route="conta" data-aulas-login>Entrar novamente</button>';host.after(card)}
  const status=root.AULAS?.getStatus?.()||{},login=!uid()||/login|conta|sess[aã]o|401|jwt|token/i.test(status.error||'');
  const text=login?'Entre na sua conta para atualizar as aulas entre aparelhos.':status.busy?'Atualizando a lista do servidor…':status.error?'Não foi possível atualizar. A lista pode estar desatualizada. Tente novamente.':status.lastUpdated?'Lista conferida no servidor às '+stamp(status.lastUpdated)+'.':'Aguardando atualização da lista.';
  const line=card.querySelector('[data-aulas-status]');if(line.textContent!==text)line.textContent=text;
  const sign=card.querySelector('[data-aulas-login]');if(sign.hidden===login)sign.hidden=!login;
  const button=card.querySelector('[data-aulas-refresh]');if(button.disabled!==!!status.busy)button.disabled=!!status.busy;
 }
 async function refresh(force=false){
  if(!visible()||!root.AULAS||root.DIARIO_DEMO&&!force)return;
  const current=uid();if(current!==owner){owner=current;attempt=0}
  if(!current||running||root.AULAS.getStatus?.().busy||!force&&Date.now()-attempt<PERIOD){paint();return}
  attempt=Date.now();running=true;
  try{await root.AULAS.carregaLista(true);if(root.AULAS?._dbg?.P?.on&&doc.querySelector('#aup.au361-floating')&&typeof render==='function')render()}finally{running=false;paint()}
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paint();refresh()})}
 doc.addEventListener('click',event=>{if(event.target.closest('[data-aulas-refresh]')){event.preventDefault();refresh(true)}});
 doc.addEventListener('diario:aulas-carregadas',()=>{attempt=Date.now();schedule()});
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)refresh()});
 root.addEventListener('focus',()=>refresh());root.addEventListener('online',()=>refresh(true));
 new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:true});
 setInterval(()=>refresh(),PERIOD);
 root.DiarioAulasRecuperacao=Object.freeze({refresh,gerandoHtml});
 schedule();
})(window,document);
