/* v657 · Laboratório de Economia, apenas Estudos. */
;(function(){
'use strict';
const L=window.EconomiaLab=window.EconomiaLab||{views:{},events:{},state:{}};
const S=L.state;Object.assign(S,{tool:'mon',meta:3,infl:4.5,neutro:2.5,hiato:0,fiscal:0,selic:0,externo:0,x:'IBOV',y:'PETR4',periodo:252,disc:'macro',topico:'Regra de Taylor',qidx:0,resp:null,questoes:null,loading:false,erro:'',evento:0,series:{},busca:false,erroSerie:''});
L.esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;':'&#39;'}[c]||({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
L.f=(v,n=2)=>Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:n,maximumFractionDigits:n}):'—';
L.s=(v,n=2)=>(v>0?'+':'')+L.f(v,n);
L.card=(t,b)=>'<section class="eco-card"><h3>'+t+'</h3>'+b+'</section>';
L.kpi=(t,v)=>'<div class="eco-kpi"><small>'+t+'</small><b>'+v+'</b></div>';
L.note=v=>'<p class="eco-note">'+v+'</p>';
L.slider=(id,t,min,max,step,u)=>'<label class="eco-slider"><span>'+t+' <output data-eco-out="'+id+'">'+L.f(S[id],1)+u+'</output></span><input data-eco-range="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+S[id]+'"></label>';
L.label=(s)=>L.esc(s).slice(0,900);
const tabList=[['mon','Política monetária'],['mf','IS–LM–BP'],['eco','Econometria'],['quiz','Questões & ANPEC'],['tempo','Brasil pós-Real']];
function tabeco(){return '<nav class="eco-nav" aria-label="Ferramentas de economia">'+tabList.map(([id,n])=>'<button type="button" data-eco-tool="'+id+'" class="'+(S.tool===id?'on':'')+'">'+n+'</button>').join('')+'</nav>';}
function corpo(){return typeof L.views[S.tool]==='function'?L.views[S.tool]():'<p>Ferramenta indisponível.</p>';}
L.paint=()=>{if(typeof tab==='undefined'||tab!=='estudos'||typeof ESV==='undefined'||ESV!=='eco')return;const e=document.getElementById('eco-body');if(e)e.innerHTML=corpo();};
function segHTML(html,ativo){
 const s=(String(html||'').match(/<div class="seg"[^>]*>[\s\S]*?<\/div>/g)||[]).find(x=>x.includes('data-ep="esv"'));
 if(!s)return '<div class="seg"><button data-ep="esv" data-id="liv">Livros</button><button data-ep="esv" data-id="eco" class="on">Economia</button></div>';
 return s.replace(ativo?/ class="on"/g:/\bABSOLUTAMENTE_NADA\b/g,'').replace('</div>','<button type="button" data-ep="esv" data-id="eco"'+(ativo?' class="on"':'')+'>Economia</button></div>');
}
function viewEco(segment){
return '<h1>Estudos</h1>'+segment+'<div class="eco-root"><header class="eco-head"><small>CIÊNCIAS ECONÔMICAS · FERRAMENTAS DIDÁTICAS</small><h2>Laboratório de Economia</h2><p>Modelos interativos e dados do próprio aplicativo. Sem ordens ou alterações nas operações.</p></header>'+tabeco()+'<div id="eco-body" class="eco-body">'+corpo()+'</div></div>';
}
const original=typeof vEstudos==='function'?vEstudos:null;
if(!original)return;
vEstudos=function(){
 if(typeof ESV==='undefined')return original.apply(this,arguments);
 if(ESV==='eco'){
  let html;ESV='liv';try{html=original.apply(this,arguments);}finally{ESV='eco';}
  return viewEco(segHTML(html,true));
 }
 const html=original.apply(this,arguments);
 if(typeof html!=='string'||html.includes('data-id="eco"'))return html;
 const seg=(html.match(/<div class="seg"[^>]*>[\s\S]*?<\/div>/g)||[]).find(x=>x.includes('data-ep="esv"'));
 return seg?html.replace(seg,segHTML(seg,false)):html;
};
document.addEventListener('click',async e=>{
 const t=e.target.closest&&e.target.closest('[data-ep="esv"][data-id="eco"],[data-eco-tool],[data-eco-btn]');
 if(!t)return;
 if(t.matches('[data-ep="esv"][data-id="eco"]')){
  e.preventDefault();e.stopImmediatePropagation();ESV='eco';tab='estudos';S.tool='mon';render();
  L.events.macro&&L.events.macro();return;
 }
 if(typeof tab==='undefined'||tab!=='estudos'||ESV!=='eco')return;
 if(t.hasAttribute('data-eco-tool')){
  S.tool=t.dataset.ecoTool;render();
  const action=L.events.enter&&L.events.enter[S.tool];if(action)action();return;
 }
 if(t.hasAttribute('data-eco-btn')){
  const fn=L.events[t.dataset.ecoBtn];if(typeof fn==='function')await fn(t);return;
 }
},true);
document.addEventListener('input',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco')return;
 const el=e.target.closest&&e.target.closest('[data-eco-range]');if(!el)return;
 const id=el.dataset.ecoRange;if(!(id in S))return;
 S[id]=+el.value;
 const out=document.querySelector('[data-eco-out="'+id+'"]');
 if(out)out.textContent=L.f(S[id],1)+(id==='fiscal'?'':id==='hiato'||id==='selic'||id==='externo'?' pp':'%');
 // Mantém o elemento <input> montado enquanto é arrastado; troca somente os resultados.
 const raiz=document.getElementById('eco-body');if(!raiz)return;
 const painel=el.closest('.eco-card'),modelo=document.createElement('template');modelo.innerHTML=corpo();
 const atuais=[...raiz.children],novos=[...modelo.content.children];
 atuais.forEach((n,i)=>{if(n!==painel&&novos[i])n.replaceWith(novos[i]);});
});
document.addEventListener('change',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco')return;
 const el=e.target;const chave=el.dataset.ecoSelect;
 if(chave&&L.events.change)L.events.change(chave,el.value);
});
})();
