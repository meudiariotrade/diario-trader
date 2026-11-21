/* v869 — Aba Estudos: mais espaço e leitura. Esconde o ticker de cotações e a barra de contexto
 * só enquanto a aba ativa for Estudos; nas outras abas nada muda. */
;(function(w,d){
'use strict';
if(!d)return;
function marca(){try{d.body.classList.toggle('aba-estudos',typeof tab!=='undefined'&&tab==='estudos')}catch{}}
w.addEventListener('diario:render',marca);d.addEventListener('diario:render',marca);d.addEventListener('click',()=>setTimeout(marca,60),true);
const css=d.createElement('style');css.textContent=`
body.aba-estudos .dt393-ticker,body.aba-estudos #dt815-ctx{display:none!important}
html[data-v427-tema=claro] body.aba-estudos,html[data-v427-tema=claro] body.aba-estudos #app{background:#F8F6F0!important}
html[data-v427-tema=claro] body.aba-estudos #app .mut,html[data-v427-tema=claro] body.aba-estudos #app .sm.mut,html[data-v427-tema=claro] body.aba-estudos #app small,html[data-v427-tema=claro] body.aba-estudos #tp-root .tp-head p,html[data-v427-tema=claro] body.aba-estudos #tp-root .tp-pdf small{color:#4A4740!important}
body.aba-estudos #app .au-nova{background:#7A5C32!important;color:#fff!important;border-color:#7A5C32!important}`;
d.head.appendChild(css);
marca();
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
