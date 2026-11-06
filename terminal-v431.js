/* Diário de Trader v431 — Terminal: ajuda da ponte do Profit ao lado do selo "Fontes"
 * Quando nenhuma fonte está ao vivo, aparece "Como ligar a ponte": passo a passo e atalho para Conta → Testar tudo.
 * Não remove nenhuma função existente. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=f=>{try{return f()}catch(e){return undefined}};
function vivos(){const st=doc.querySelector('#trst');if(!st)return null;const b=st.querySelector('b.tg');return b?parseInt(b.textContent,10)||0:null}
function botao(){
  doc.querySelectorAll('.v430-fontes').forEach(f=>{
    let h=f.parentElement&&f.parentElement.querySelector(':scope>.v431-ponte');
    const v=vivos(),mostra=!f.hidden&&v===0;
    if(!h&&mostra){h=doc.createElement('button');h.type='button';h.className='v431-ponte';h.textContent='Como ligar a ponte do Profit';h.setAttribute('aria-haspopup','dialog');f.after(h)}
    if(h)h.hidden=!mostra;
  });
}
function abrir(){
  let ov=doc.getElementById('v431-ponte');
  if(!ov){ov=doc.createElement('div');ov.id='v431-ponte';ov.className='v430-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','v431-ponte-t');doc.body.appendChild(ov)}
  ov.innerHTML=`<div class="v430-sh v431-sh"><h2 id="v431-ponte-t">Ligar a ponte do Profit</h2>
  <p>A ponte é o programa que leva as cotações do Profit, ao vivo, para o app. Ela roda no seu computador, então o app não consegue ligá-la sozinho.</p>
  <ol><li>No computador, abra o <b>Profit</b> e entre na sua conta.</li><li>Rode a ponte: <b>ponte_profit.py</b>.</li><li>Deixe a janela da ponte aberta durante o pregão.</li><li>Volte aqui: o selo passa a mostrar as fontes <b>ao vivo</b> em até 1 minuto.</li></ol>
  <p class="v430-mut">Sem a ponte, o Terminal usa fontes gratuitas com atraso de 15 minutos ou mais.</p>
  <div class="v430-acts"><button type="button" class="v430-pri" data-v431="teste">Testar conexões agora</button><button type="button" data-v431="x">Fechar</button></div></div>`;
  ov.hidden=false;ov.querySelector('[data-v431="teste"]').focus({preventScroll:true});
}
function fechar(){const ov=doc.getElementById('v431-ponte');if(ov)ov.hidden=true}
doc.addEventListener('click',e=>{
  if(e.target.closest&&e.target.closest('.v431-ponte')){e.preventDefault();abrir();return}
  const a=e.target.closest&&e.target.closest('[data-v431]');
  if(a){e.preventDefault();e.stopPropagation();fechar();
    if(a.dataset.v431==='teste'){g(()=>{tab='conta';render0()});setTimeout(()=>{const c=doc.getElementById('dgcard');if(c){c.scrollIntoView({block:'start'});const b=c.querySelector('[data-dg2]');if(b&&!b.disabled)b.click()}else g(()=>toast('Abra Mais → Conta e toque em "Testar tudo".',3500))},500)}
    return}
  const ov=doc.getElementById('v431-ponte');if(ov&&!ov.hidden&&e.target===ov)fechar();
},true);
doc.addEventListener('keydown',e=>{if(e.key==='Escape')fechar()});
setInterval(()=>{if(!doc.hidden)try{botao()}catch(e){}},1500);
root.DIARIO_V431={abrir};
})(window);
