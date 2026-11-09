/* Diário de Trader v523 — Estudos: ao abrir uma lição/capítulo a tela vai para o começo do conteúdo (não para o topo da página)
   e, ao voltar, a lista volta para onde você estava. Só acrescenta. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const orig=root.scrollTo.bind(root);
let volta=null;const pos={};
function painel(){
  const b=[...doc.querySelectorAll('#app button,#app a')].find(x=>x.offsetParent&&/Voltar para Estudos/.test(x.textContent));
  return b?(b.closest('.card,section,.dt397-panel')||b.parentElement):null;
}
function topoCab(){const h=doc.querySelector('.dt393-top,.app-top,header');return h?Math.min(140,h.getBoundingClientRect().bottom):80}
root.scrollTo=function(a,b){
  try{
    const zero=(a===0&&(b===0||b===undefined))||(a&&typeof a==='object'&&!a.top);
    if(zero&&g(()=>tab,'')==='estudos'){
      if(volta!=null){const y=volta;volta=null;return orig(0,y)}
      const p=painel();
      if(p){const y=Math.max(0,p.getBoundingClientRect().top+root.scrollY-topoCab()-8);return orig(0,y)}
    }
  }catch(e){}
  return orig.apply(root,arguments);
};
root.addEventListener('click',e=>{
  if(g(()=>tab,'')!=='estudos')return;
  if(e.target.closest&&e.target.closest('[data-e2at],[data-dt393-route],[data-dt397-view],[data-ep]'))pos.aberto=0;
  const t=e.target.closest&&e.target.closest('[data-e2cap],[data-e2bib],[data-e2fc],[data-e2estr]');if(!t)return;
  if(t.dataset.e2cap||t.dataset.e2fc||t.dataset.e2estr){if(!pos.aberto)pos.lista=root.scrollY;pos.aberto=1}
  else if(t.dataset.e2bib!==undefined&&pos.aberto){volta=pos.lista;pos.aberto=0;setTimeout(()=>{volta=null},800)}
},true);
root.DIARIO_V523={painel};
})(typeof window!=='undefined'?window:globalThis);
