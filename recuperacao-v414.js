/* Diário de Trader v414 — restauração de navegação, configurações e janelas.
 * Sem alterações nos dados, serviços, rotas do Supabase ou execução de ordens.
 */
(function(){
 'use strict';
 const LABELS={
  home:'Início',dia:'Meu dia',ops:'Operações',trades:'Day trade',swing:'Swing trade',opc:'Opções',fx:'EUA e Forex',
  mercado:'Mercado',term:'Terminal',juros:'Juros e DI',stats:'Diário',regras:'Checklist',carteiras:'Carteira',estudos:'Estudos',
  mais:'Configurações',conta:'Conta e sincronização',status:'Status do sistema',import:'Importar dados',
  painel:'Painel de capital e risco',mesa:'Mesa proprietária',contratos:'Calculadora de contratos',
  carreira:'Plano de transição',analise:'Análise IA da carteira',imposto:'Imposto de renda',
  termos:'Privacidade e termos',rev:'Revisão',live:'Ao vivo',graf:'Gráficos',ativos:'Ativos',livro:'Livro',
  dash:'Estatísticas',opgrade:'Grade de opções',opfluxo:'Fluxo',opcart:'Carteira de opções',swbt:'Backtest',dtrpy:'Replay'
 };
 const SETTINGS_ROUTES=new Set(['conta','status','import','painel','mesa','contratos','carreira','analise','imposto','termos']);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const curr=()=>{try{return typeof tab==='string'?tab:''}catch{return ''}};
 const chat=()=>document.getElementById('wf-chat-panel');
 const chatOpen=()=>{const p=chat();return !!p&&!p.hidden&&getComputedStyle(p).display!=='none';};
 const chatClose=()=>{try{window.TraderChat?.close?.()}catch(err){console.warn('v414: não foi possível minimizar a IA',err)}};
 const navTo=id=>{
  if(!id)return;
  chatClose();
  const drawer=document.getElementById('dt394-drawer');
  if(drawer)drawer.hidden=true;
  document.body.classList.remove('dt394-drawer-open');
  document.querySelector('[data-dt393-action="menu"]')?.setAttribute('aria-expanded','false');
  // Usa a navegação original do app; nenhum formulário ou banco é recriado.
  const real=document.querySelector('#app [data-a="gotab"][data-id="'+id+'"]');
  if(real){real.click();return}
  try{tab=id;render();window.scrollTo({left:0,top:0,behavior:'instant'})}catch(err){console.warn('v414: rota não disponível',id,err)}
 };
 function settings(){
  const workspace=document.querySelector('#app .dt393-native');
  if(!workspace||document.getElementById('dt414-settings'))return;
  // Move botões nativos — não cria uma segunda tela de Conta ou Status.
  const target=document.createElement('section');target.id='dt414-settings';
  target.setAttribute('aria-label','Acessos essenciais de Configurações');
  target.innerHTML='<h1>Configurações</h1><p>Conta, sincronização, diagnóstico e preferências do aplicativo.</p><div id="dt414-essentials" class="dt414-essentials"></div>';
  workspace.prepend(target);
  const row=target.querySelector('.dt414-essentials');
  // Os botões originais são reutilizados quando a tela nativa os contém.
  // Se a nova interface os ocultar, cria SOMENTE um atalho para a rota original.
  function addRoute(id,label,destination){
    const native=workspace.querySelector('[data-a="gotab"][data-id="'+id+'"]');
    const b=native||document.createElement('button');
    if(!native){b.type='button';b.dataset.dt414Go=id;b.textContent=label}
    b.classList.add('dt414-essential');destination.appendChild(b);
  }
  for(const [id,label] of [
    ['conta','Conta e sincronização'],['status','Status do sistema'],
    ['import','Importar dados do Profit'],['painel','Capital, risco e backup']
  ]) addRoute(id,label,row);
  const advanced=document.createElement('details');advanced.id='dt414-extra';
  advanced.innerHTML='<summary>Outras ferramentas de gestão e segurança</summary><div class="dt414-essentials dt414-extra-grid"></div>';
  const grid=advanced.querySelector('.dt414-extra-grid');
  for(const [id,label] of [
    ['mesa','Mesa proprietária e regras'],['contratos','Calculadora de contratos'],
    ['carreira','Plano de transição'],['termos','Privacidade e termos']
  ]) addRoute(id,label,grid);
  target.appendChild(advanced);

 }
 function back(){
  const workspace=document.querySelector('#app .dt393-native');
  if(!workspace||document.getElementById('dt414-back'))return;
  const box=document.createElement('div');box.id='dt414-back';
  box.innerHTML='<button type="button" data-dt414-go="mais" aria-label="Voltar para Configurações">← Configurações</button><span>'+esc(LABELS[curr()]||'Ferramenta')+'</span>';
  workspace.prepend(box);
 }
 function drawer(){
  const list=document.querySelector('#dt394-drawer .dt394-nav-list');
  if(!list||list.querySelector('#dt414-drawer-access'))return;
  const extra=document.createElement('div');extra.id='dt414-drawer-access';
  extra.innerHTML='<h3>Conta e sistema</h3><button type="button" data-dt414-go="conta" data-dt394-filter="conta login sincronizacao">Conta e sincronização</button><button type="button" data-dt414-go="status" data-dt394-filter="status sistema diagnostico">Status do sistema</button><button type="button" data-dt414-go="import" data-dt394-filter="importar profit csv">Importar do Profit</button><button type="button" data-dt414-go="painel" data-dt394-filter="capital risco backup metas">Capital, risco e backup</button><button type="button" data-dt414-go="mais" data-dt394-filter="configuracoes preferencias">Todas as configurações</button>';
  list.appendChild(extra);
 }
 function title(){
  const route=curr();const el=document.querySelector('#dt393-global-head .dt393-title');
  if(el&&LABELS[route])el.textContent=LABELS[route];
  const buttons=document.querySelectorAll('#dt393-global-head .dt394-quicknav button[data-dt393-route],#dt394-drawer button[data-dt393-route]');
  buttons.forEach(b=>{
    if(!SETTINGS_ROUTES.has(route))return;
    const active=b.dataset.dt393Route==='mais';
    b.classList.toggle('active',active);
    if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
 }
 function enhance(){
  const route=curr();
  // O assistente de boas-vindas não pode bloquear a Conta ou outras ferramentas.
  const welcome=document.getElementById('onb');
  if(welcome){
    if(route!=='home'){welcome.remove();}
    else if(!welcome.querySelector('[data-dt414-go="conta"]')){
      const actions=welcome.querySelector('.sh')||welcome;
      const login=document.createElement('button');login.type='button';
      login.dataset.dt414Go='conta';login.className='btn s dt414-existing-account';
      login.textContent='Já tenho conta — entrar e sincronizar';
      actions.appendChild(login);
    }
  }
  if(route==='mais')settings();else if(SETTINGS_ROUTES.has(route))back();
  drawer();title();
  // Atualiza sem recriar o painel da IA nem alterar seu estado de conversa.
  document.body.classList.toggle('dt414-chat-open',chatOpen());
 }
 function chatRefresh(){
  const p=chat();
  document.body.classList.toggle('dt414-chat-open',chatOpen());
  if(!p||p.hidden)return;
  p.setAttribute('role','dialog');p.setAttribute('aria-modal','false');
  const close=p.querySelector('[data-chat-close]');
  if(close){close.textContent='×';close.setAttribute('aria-label','Fechar a Economista IA');}
 }
 function bindChat(){
  if(window.__dt414ChatBound)return;window.__dt414ChatBound=true;
  const old=window.TraderChat;
  if(old?.open&&old?.close){
    const originalOpen=old.open, originalClose=old.close;
    old.open=function(...args){const ret=originalOpen.apply(this,args);chatRefresh();return ret};
    old.close=function(...args){const ret=originalClose.apply(this,args);chatRefresh();return ret};
  }
  document.addEventListener('click',event=>{
    const go=event.target.closest?.('[data-dt414-go]');
    if(go){event.preventDefault();event.stopImmediatePropagation();const id=go.dataset.dt414Go;navTo(id);return}
    if(event.target.closest?.('#wf-chat-panel [data-chat-close]')){
      // O listener nativo faz o fechamento; este ciclo apenas corrige classe visual.
      queueMicrotask(chatRefresh);return;
    }
    if(event.target.closest?.('#economista-flutuante .wf-chat-launcher')){
      queueMicrotask(chatRefresh);return;
    }
    const p=chat();
    if(chatOpen()&&p&&!p.contains(event.target)&&!event.target.closest?.('#economista-flutuante .wf-chat-launcher')){
      chatClose();chatRefresh();
    }
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&chatOpen()){chatClose();chatRefresh();event.preventDefault()}
  },true);
  // Observa só hidden/aria-expanded, não a árvore inteira (evita loops e tremidas).
  const obs=new MutationObserver(m=>{if(m.some(x=>x.attributeName==='hidden'||x.attributeName==='aria-expanded'))chatRefresh()});
  const p=chat(),b=document.querySelector('#economista-flutuante .wf-chat-launcher');
  if(p)obs.observe(p,{attributes:true,attributeFilter:['hidden']});
  if(b)obs.observe(b,{attributes:true,attributeFilter:['aria-expanded']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',chatRefresh,{once:true});
 }
 // Última camada — render nativo e wrappers já foram registrados anteriormente.
 if(typeof render==='function'){
   const prior=render;let lastRoute=curr();
   render=function(...args){
     const ret=prior.apply(this,args);
     enhance();
     // Só navegação entre módulos volta ao topo; atualizações dentro da mesma
     // tela (Mercado, Estudos, IA) NÃO tocam na posição da rolagem.
     const active=curr();
     if(active!==lastRoute){lastRoute=active;window.scrollTo({left:0,top:0,behavior:'instant'});}
     return ret;
   };
 }
 bindChat();enhance();
 // Único gatilho pós-montagem quando a autenticação renderizar uma rota.
 window.DiarioRecuperacaoV414={enhance,navigate:navTo,closeChat:chatClose,labels:Object.keys(LABELS)};
})();
