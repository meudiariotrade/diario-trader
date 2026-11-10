/* v541 — comandos do Terminal permanecem na área de painéis. */
(function(root,doc){
 'use strict';if(root.TerminalCommandPolicy)return;
 const blocked=new Set(['JORNAL','GIRO','PAINEL','MUNDO','AGENDA','NOTICIAS','ECONOMISTA','SENT','SAZ','RANK','ALERTAS','FLUXO','JEDU','JUROS','AOVIVO','GRAF','BTST','REPLAY','GRADE','PESQUISA','COMPF','RADAR','RISCO']);
 const helperCommands=new Set(['MESA','ATIVO','COMPARAR','VOLTAR']);
 const internalActions=new Set(['@favorite','@manage','@organize','@add','@rename','@layout','@auto','@plan','@focus','@radar','@commands']);
 const active=()=>{try{return doc.body.classList.contains('trmon')||typeof tab!=='undefined'&&tab==='term'}catch{return false}};
 const token=value=>String(value||'').trim().toUpperCase().split(/\s+/)[0];
 function code(value){let key=token(value);const seen=new Set();for(let n=0;n<12&&!seen.has(key);n++){seen.add(key);const alias=root.TRM?.ALIAS?.[key];if(typeof alias!=='string')break;key=token(alias)}return key}
 const allows=value=>{if(blocked.has(token(value))||blocked.has(code(value)))return false;try{return !blocked.has(root.TRM?.parse?.(value)?.f)}catch{return true}};
 const notice=()=>{try{const notify=typeof toast==='function'?toast:root.toast;notify?.('Esse comando abre outra área e foi retirado do Terminal. Escolha uma função dos painéis.')}catch{}};
 const unavailable=()=>'<div class="trsec">Comando externo retirado</div><p class="trnote">Esta função abria outra área do aplicativo. Use o menu do Terminal para escolher uma função disponível nos painéis.</p>';
 function wrap(owner,key,fn){const old=owner?.[key];if(typeof old!=='function'||old.__terminalInternal)return;const next=function(...args){return fn.call(this,old,args)};next.__terminalInternal=true;owner[key]=next}
 function install(){
  queued=false;const api=root.TRM;if(!api)return;
  for(const [key,description]of Object.entries(api.FN))if(typeof description==='string'&&/\((?:tela cheia|abre a tela?)\)/i.test(description))blocked.add(key);
  for(const [key]of root.TraderTerminalActions?.commands||[])if(!helperCommands.has(key)&&key!=='GUIA')blocked.add(key);
  // Os nomes continuam reconhecidos para tratar layouts antigos, mas deixam de ser comandos disponíveis.
  for(const key of blocked){if(Object.hasOwn(api.FN,key))Object.defineProperty(api.FN,key,{value:api.FN[key],enumerable:false,writable:true,configurable:true});if(api.EXT[key]&&!api.EXT[key].terminalBlocked)api.EXT[key]={livre:true,terminalBlocked:true,body:unavailable}}
  api.ALIAS.GUIA='HELP';
  const actions=root.TraderTerminalActions;
  if(actions){const visible=actions.commands?.filter(([k])=>helperCommands.has(k))||[];if(actions.commands?.length!==visible.length)actions.commands=visible;
   wrap(actions,'execute',function(old,args){if(active()){if(!allows(args[0])){notice();return true}if(token(args[0])==='GUIA'){api.roda('HELP');return true}}return old.apply(this,args)})}
  wrap(api,'roda',function(old,args){if(active()&&!allows(args[0])){notice();return}if(active()&&token(args[0])==='GUIA')args[0]='HELP';return old.apply(this,args)});
  wrap(root,'trRoda',function(old,args){if(active()&&!allows(args[0])){notice();return}if(active()&&token(args[0])==='GUIA')args[0]='HELP';return old.apply(this,args)});
  wrap(root,'trTela',function(old,args){return active()?false:old.apply(this,args)});
  // Uma cotação por ticker deve abrir o painel Q, não a pesquisa em uma tela separada.
  wrap(root,'trAtivo',function(old,args){return active()?false:old.apply(this,args)});
  wrap(root.TerminalResearch,'open',function(old,args){if(active()){notice();return}return old.apply(this,args)});
  if(active()){
   const app=doc.querySelector('#app:not(.v503-fantasma)');
   // Os adaptadores ficam ocultos: alguns módulos antigos os recriam se forem removidos.
   for(const n of app?.querySelectorAll('.trm [data-trtela],.trm [data-terminal-window],.trm [data-tr="pop"],.trm [data-tr="menu"],.trm [data-tr="sair"],.trm .trinst,.trm [data-research-open],.trm [data-flow-open],.trm [data-consulta325],.trm [data-ti330],.trm [data-radar332],.trm [data-tr-qualidade-v374],.trm [data-tc326-menu],.trm [data-tc326-status],.trm [data-v329-open],.trm [data-t369-suggest],.trm [data-obs328],.trm .dtval-open')||[]){n.hidden=true;n.inert=true;n.dataset.terminalExternal='1';n.style.setProperty('display','none','important')};
   for(const n of app?.querySelectorAll('.trm [data-trgo],.trm [data-trcmd]')||[]){const value=n.getAttribute('data-trgo')||n.getAttribute('data-trcmd');if(value&&!allows(value)){n.hidden=true;n.inert=true;n.dataset.terminalExternal='1';n.style.setProperty('display','none','important')}}
  }
  root.DiarioTerminalInicio?.mount?.();
 }
 let queued=false;function schedule(){if(!queued){queued=true;requestAnimationFrame(install)}}
 // Estes listeners são registrados antes dos adaptadores antigos de comando.
 root.addEventListener('click',event=>{
  if(!active())return;const target=event.target.closest?.('[data-tr="go"],[data-trgo],[data-trcmd],[data-trtela],[data-terminal-window],[data-tr="pop"],[data-tr="menu"],[data-tr="sair"]');if(!target)return;
  const raw=target.matches('[data-tr="go"]')?doc.getElementById('trcmd')?.value:target.getAttribute('data-trgo')||target.getAttribute('data-trcmd')||target.getAttribute('data-trtela');
  if(target.matches('[data-trtela],[data-terminal-window],[data-tr="pop"],[data-tr="menu"],[data-tr="sair"]')||raw&&!allows(raw)){event.preventDefault();event.stopImmediatePropagation();notice();return}
  if(raw&&token(raw)==='GUIA'){event.preventDefault();event.stopImmediatePropagation();root.TRM?.roda('HELP')}
 },true);
 root.addEventListener('keydown',event=>{if(active()&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!event.isComposing){event.preventDefault();event.stopImmediatePropagation();(doc.querySelector('#tf413.ti539-start #ti539-search')||doc.getElementById('trcmd'))?.focus();return}if(!active()||event.key!=='Enter'||event.isComposing||!['trcmd','trvcmd'].includes(event.target.id))return;const value=event.target.value;if(!allows(value)){event.preventDefault();event.stopImmediatePropagation();notice()}else if(token(value)==='GUIA'){event.preventDefault();event.stopImmediatePropagation();root.TRM?.roda('HELP')}},true);
 const style=doc.createElement('style');style.textContent='html body.trmon #app#app#app .trm [data-terminal-external]{display:none!important}';doc.head.append(style);
 new MutationObserver(schedule).observe(doc.body,{childList:true,subtree:true});
 doc.addEventListener('DOMContentLoaded',install,{once:true});
 root.TerminalCommandPolicy={allows,allowsAction:id=>internalActions.has(id),get blocked(){return [...blocked]},install};install();
})(window,document);
