/* Mercado v410 — navegação estável sem reposicionamento em frames atrasados.
   Funciona apenas na aba Mercado. Não altera cotações, dados ou execução de ordens. */
(()=>{'use strict';
const d=document;
let pending=null;
const active=()=>{try{return typeof tab!=='undefined'&&tab==='mercado'}catch{return false}};
const nav=()=>d.querySelector('#app .dt395-native-mercado .m403-primary-tabs');
function capture(e){
 const btn=e.target.closest?.('#app .dt395-native-mercado .m403-primary-tabs [data-navroute^="mercado:"]');
 if(!btn||!active())return;
 const bar=btn.closest('.m403-primary-tabs');
 if(!bar)return;
 pending={at:performance.now(),top:bar.getBoundingClientRect().top,scrollY:window.scrollY,previousHeight:d.getElementById('app')?.offsetHeight||0};
}
function finish(){
 const old=pending;
 if(!old)return;
 pending=null;
 const next=nav();
 if(!next)return;
 const shift=next.getBoundingClientRect().top-old.top;
 if(Math.abs(shift)>1&&Math.abs(shift)<window.innerHeight*1.5){
  // Uma ÚNICA correção ainda na fila de microtarefas, antes do paint.
  // A versão anterior corrigia duas animações de frame depois, gerando tremida.
  const target=Math.max(0,window.scrollY+shift);
  window.scrollTo({top:target,behavior:'instant'});
 }
}
d.addEventListener('click',capture,true);
if(window.TraderUI?.onRender){window.TraderUI.onRender('mercado-v410',{after(){
 if(!pending)return;
 // Os renderizadores de Mercado v403/v408/v409 enfileiram suas microtarefas
 // antes desta. Não executar requestAnimationFrame ou setTimeout no layout.
 queueMicrotask(()=>queueMicrotask(finish));
}})}
window.MercadoNavegacao410={get pending(){return !!pending},version:'v410'};
})();
