/* v867 — Link automático (estilo Bloomberg): tocar num ativo em qualquer tela abre o mesmo ativo em todos os painéis.
 * Sem botão de cor: um único grupo para o app inteiro. (v866 tinha grupos por cor.)
 * Tocar num ativo dentro de um painel atualiza só os painéis do mesmo grupo de cor.
 * Âmbar = grupo principal, ligado também ao "ativo em foco" da barra de contexto.
 * Nada vai para servidor: grupos e último ativo de cada grupo ficam no aparelho. */
;(function(w,d){
'use strict';
if(!d)return;
const GRUPOS=[['ambar','Âmbar'],['verde','Verde'],['azul','Azul'],['sem','Sem link']];
const KEY='dt-colorlink-v866',ULT='dt-colorlink-ultimo-v866';
const paineis=new Map();
const COR={ambar:'#F59E0B',verde:'#10B981',azul:'#3B82F6',sem:'transparent'};
const estilo=g=>'background:'+COR[g]+' !important;'+(g==='sem'?'border:1px dashed #64748B !important;':'');
const ler=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return {}}};
const gravar=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let cfg=ler(KEY),ultimo=ler(ULT);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=tk=>String(tk||'').trim().toUpperCase().replace(/\.SA$/,'').slice(0,20);
function registrar(id,{nome,aplicar,padrao='ambar'}={}){paineis.set(id,{nome:nome||id,aplicar,padrao})}
function grupo(){return 'ambar'}
function rotulo(g){return (GRUPOS.find(x=>x[0]===g)||GRUPOS[0])[1]}
function chip(){return ''}
function chipAntigo(id){const g=grupo(id),p=paineis.get(id);
 return '<button type="button" class="cl-chip cl-'+g+'" style="'+estilo(g)+'" data-cl-chip="'+E(id)+'" title="Link de cor: '+rotulo(g)+' — toque para trocar" aria-label="Link de cor de '+E(p?.nome||id)+': '+rotulo(g)+'. Toque para trocar."></button>'}
function atual(id){const g=grupo(id);return g==='sem'?'':(ultimo[g]||'')}
function publicar(origem,tk){
 const t=norm(tk);if(!t)return;const g=grupo(origem);if(g==='sem')return;
 ultimo[g]=t;gravar(ULT,ultimo);
 for(const [id,p] of paineis)if(id!==origem&&grupo(id)===g&&typeof p.aplicar==='function')try{p.aplicar(t,origem)}catch{}
 if(g==='ambar')try{w.DiarioBarraContexto?.definirFoco?.(t,'link-ambar')}catch{}
 d.dispatchEvent(new CustomEvent('diario:color-link',{detail:{grupo:g,ticker:t,origem}}));
}
function trocar(id){
 const i=GRUPOS.findIndex(x=>x[0]===grupo(id)),g=GRUPOS[(i+1)%GRUPOS.length][0];cfg[id]=g;gravar(KEY,cfg);
 d.querySelectorAll('[data-cl-chip="'+CSS.escape(id)+'"]').forEach(b=>{b.className='cl-chip cl-'+g;b.setAttribute('style',estilo(g));b.title='Link de cor: '+rotulo(g)+' — toque para trocar';b.setAttribute('aria-label','Link de cor: '+rotulo(g)+'. Toque para trocar.')});
 const tk=atual(id),p=paineis.get(id);if(tk&&p?.aplicar)try{p.aplicar(tk,'grupo')}catch{}
}
d.addEventListener('click',e=>{
 const c=e.target.closest?.('[data-cl-chip]');
 if(c){e.preventDefault();e.stopPropagation();trocar(c.dataset.clChip);return}
 const a=e.target.closest?.('[data-cl-tk],[data-tk],[data-ticker],[data-scr-detail],[data-tech-detail]');if(!a)return;
 const src=a.closest('[data-cl-src]');
 const tk=a.getAttribute('data-cl-tk')||a.getAttribute('data-tk')||a.getAttribute('data-ticker')||a.getAttribute('data-scr-detail')||a.getAttribute('data-tech-detail');
 // Depois do clique original (abre a ficha/detalhe do próprio painel), avisa os painéis do mesmo grupo.
 setTimeout(()=>publicar(src?src.dataset.clSrc:'app',tk),0);
},true);
const css=d.createElement('style');css.textContent=
'html body button.cl-chip{display:inline-block!important;flex:0 0 14px!important;width:14px!important;height:14px!important;min-width:14px!important;min-height:14px!important;padding:0!important;margin:0 8px 0 0!important;border-radius:3px!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:none!important;vertical-align:middle;cursor:pointer;position:relative}'+
'html body button.cl-chip::after{content:"";position:absolute;inset:-14px}'+
'html body button.cl-ambar{background:#F59E0B!important}html body button.cl-verde{background:#10B981!important}html body button.cl-azul{background:#3B82F6!important}html body button.cl-sem{background:transparent!important;border:1px dashed #64748B!important}'+
'.cl-head{display:flex!important;align-items:center;gap:0;min-width:0}';
d.head.appendChild(css);
w.DiarioColorLink=Object.freeze({registrar,grupo,chip,atual,publicar,trocar,GRUPOS});
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
