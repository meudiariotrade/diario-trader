/* Diário de Trader v529 — Alertas: liga/desliga e limite das ações da B3 com puxada forte. Só acrescenta. */
(function(root){
'use strict';
try{if(typeof NP!=='undefined'&&!NP._v529){NP._v529=1;NP.on=NP.on||{};if(NP.on.acs===undefined)NP.on.acs=true;alSave();setTimeout(()=>{try{alPush()}catch(e){}},7000)}}catch(e){}
try{const ant=alAbHtml;alAbHtml=function(e){const L=(typeof NP!=='undefined'&&NP.movLim&&NP.movLim.ACOES)||5;return ant.apply(this,arguments)+`${e('acs','Ações da B3 com puxada forte, com o motivo')}<div class="sm mut" style="margin-bottom:6px">Qualquer ação com mais de R$ 30 mi negociados. As que você opera avisam a partir de 3%.</div><div class="v518-lim"><label>Ações<span><input type="number" inputmode="decimal" step="0.5" min="1" max="20" data-v529lim value="${L}">%</span></label></div>`}}catch(e){}
root.document.addEventListener('change',e=>{const i=e.target.closest&&e.target.closest('[data-v529lim]');if(!i)return;const v=parseFloat(String(i.value).replace(',','.'));try{NP.movLim=NP.movLim||{};if(isFinite(v)&&v>0&&v!==5)NP.movLim.ACOES=v;else delete NP.movLim.ACOES;alSave();alPush()}catch(er){}},true);
})(typeof window!=='undefined'?window:globalThis);
