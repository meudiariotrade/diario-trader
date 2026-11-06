/* Diário de Trader v430 — Terminal: fechamento da análise de design (padrão Bloomberg no celular)
 * 1) Painéis e Workspaces: uma fileira de painéis; atalhos no "•••"; comando vira lupa no celular.
 * 2) Gráfico: ferramentas secundárias recolhidas em "Ferramentas", gráfico maior.
 * 3) Status das fontes: um selo "Fontes: X/N ao vivo" que abre o detalhe.
 * 4) Avisos de vazio com botão de ação.
 * Não remove nada: os controles originais continuam no DOM e são acionados pelos novos botões. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const LS='diario-v430-ferr';
const ler=()=>{try{return localStorage.getItem(LS)==='1'}catch(e){return false}};
const grava=v=>{try{localStorage.setItem(LS,v?'1':'0')}catch(e){}};
const celular=()=>root.matchMedia&&root.matchMedia('(max-width:760px)').matches;
const svg=(d,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const LUPA='<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>';
const MAIS='<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>';

/* ---------- 3) selo das fontes ---------- */
function selo(){
  doc.querySelectorAll('#trst').forEach(st=>{
    const n=c=>{const b=st.querySelector('b.'+c);return b?parseInt(b.textContent,10)||0:0};
    const vivo=n('tg'),atr=n('am'),fal=n('tr'),tot=vivo+atr+fal;
    let bt=st.parentElement&&st.parentElement.querySelector(':scope>.v430-fontes');
    if(!tot){if(bt)bt.hidden=true;st.classList.remove('v430-st');return}
    if(!bt){bt=doc.createElement('button');bt.type='button';bt.className='v430-fontes';st.before(bt)}
    bt.hidden=false;st.classList.add('v430-st');
    const txt=`Fontes: ${vivo}/${tot} ao vivo`+(atr?` · ${atr} com atraso`:'');
    if(bt.dataset.t!==txt){bt.dataset.t=txt;bt.innerHTML=`<i class="${vivo?'ok':atr?'at':'off'}" aria-hidden="true"></i>${txt}<span aria-hidden="true">›</span>`;bt.setAttribute('aria-label',txt+'. Toque para ver o detalhe de cada fonte.')}
  });
}
doc.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.v430-fontes');if(!b)return;
  e.preventDefault();const lk=b.parentElement&&b.parentElement.querySelector('#trst .trlk');if(lk)lk.click();
});

/* ---------- 1) Painéis e Workspaces no celular ---------- */
function barra(){
  const bar=doc.querySelector('.trm .trbar');if(!bar)return;
  if(!bar.querySelector('.v430-lupa')){
    const b=doc.createElement('button');b.type='button';b.className='trbtn v430-lupa';b.setAttribute('aria-label','Buscar ou digitar comando');b.innerHTML=svg(LUPA);
    bar.prepend(b);
  }
  const merc=doc.querySelector('.trm .trmerc');
  if(merc&&!bar.querySelector('.v430-mais')){
    const b=doc.createElement('button');b.type='button';b.className='trbtn v430-mais';b.setAttribute('aria-label','Atalhos: Jornal do Pregão, Notícias, Agenda e outros');b.setAttribute('aria-haspopup','dialog');b.innerHTML=svg(MAIS);
    bar.appendChild(b);
  }
}
function fecharBusca(bar){bar.classList.remove('v430-busca')}
doc.addEventListener('click',e=>{
  const lupa=e.target.closest&&e.target.closest('.v430-lupa');
  if(lupa){e.preventDefault();const bar=lupa.closest('.trbar');bar.classList.toggle('v430-busca');const i=bar.querySelector('#trcmd');if(bar.classList.contains('v430-busca')&&i)setTimeout(()=>i.focus(),0);return}
  const mais=e.target.closest&&e.target.closest('.v430-mais');
  if(mais){e.preventDefault();abrirAtalhos();return}
  const at=e.target.closest&&e.target.closest('[data-v430at]');
  if(at){e.preventDefault();const i=+at.dataset.v430at;fecharAtalhos();const orig=doc.querySelectorAll('.trm .trmerc button')[i];if(orig)setTimeout(()=>orig.click(),0);return}
  if(e.target.closest&&e.target.closest('[data-v430fx]')){e.preventDefault();fecharAtalhos();return}
  const ov=doc.getElementById('v430-atalhos');if(ov&&!ov.hidden&&e.target===ov)fecharAtalhos();
},true);
doc.addEventListener('focusout',e=>{const i=e.target;if(i&&i.id==='trcmd'&&!i.value){const bar=i.closest('.trbar');if(bar)setTimeout(()=>{if(doc.activeElement!==i)fecharBusca(bar)},150)}});
function abrirAtalhos(){
  const bts=[...doc.querySelectorAll('.trm .trmerc button')];if(!bts.length)return;
  let ov=doc.getElementById('v430-atalhos');
  if(!ov){ov=doc.createElement('div');ov.id='v430-atalhos';ov.className='v430-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Atalhos do Terminal');doc.body.appendChild(ov)}
  ov.innerHTML=`<div class="v430-sh v430-atl"><h2>Atalhos</h2><div class="v430-atl-g">${bts.map((b,i)=>`<button type="button" data-v430at="${i}">${b.textContent.trim().replace(/[<>&]/g,'')}</button>`).join('')}</div><button type="button" class="v430-atl-x" data-v430fx>Fechar</button></div>`;
  ov.hidden=false;const f=ov.querySelector('[data-v430at]');if(f)f.focus({preventScroll:true});
}
function fecharAtalhos(){const ov=doc.getElementById('v430-atalhos');if(ov)ov.hidden=true}
doc.addEventListener('keydown',e=>{if(e.key==='Escape')fecharAtalhos()});

/* ---------- 2) gráfico: ferramentas recolhidas ---------- */
function ferramentas(){
  doc.querySelectorAll('#v421-gp').forEach(gp=>{
    const b2=gp.querySelector('.gp-bar2');if(!b2)return;
    gp.classList.toggle('v430-ferr',ler());
    let bt=b2.querySelector('.v430-ferr-bt');
    if(!bt){bt=doc.createElement('button');bt.type='button';bt.className='gp-btn v430-ferr-bt';b2.prepend(bt)}
    const on=gp.classList.contains('v430-ferr');
    const t=on?'Menos ferramentas ▴':'Ferramentas ▾';
    if(bt.textContent!==t){bt.textContent=t;bt.setAttribute('aria-expanded',on?'true':'false');bt.setAttribute('aria-label',on?'Recolher ferramentas do gráfico':'Mostrar ferramentas: gráficos prontos, eixo, adicionar dado e relacionados')}
  });
}
doc.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.v430-ferr-bt');if(!b)return;
  e.preventDefault();e.stopPropagation();grava(!ler());ferramentas();
},true);

/* ---------- 4) avisos de vazio com ação ---------- */
function avisos(){
  doc.querySelectorAll('#tf413 .tf413-side .tf413-empty').forEach(el=>{
    if(el.querySelector('.v430-acao'))return;
    const b=doc.createElement('button');b.type='button';b.className='v430-acao';b.textContent='Tentar de novo';
    el.appendChild(b);
  });
}
doc.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.v430-acao');if(!b)return;
  e.preventDefault();
  const r=doc.querySelector('#tf413 [data-tf413-refresh]');
  b.disabled=true;b.textContent='Buscando…';
  if(r)r.click();else try{render0()}catch(x){}
  setTimeout(()=>{if(doc.contains(b)){b.disabled=false;b.textContent='Tentar de novo';try{toast('Ainda sem resposta da fonte. Confira a conexão e se a conta está conectada (Mais → Conta).',3500)}catch(x){}}},6000);
},true);

function tudo(){try{selo()}catch(e){}try{barra()}catch(e){}try{ferramentas()}catch(e){}try{avisos()}catch(e){}}
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v430t)return;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);tudo();return o};f.__v430t=1;root.render0=f;
}
let k=0;const iv=setInterval(()=>{k++;hook();tudo();if(k>20)clearInterval(iv)},600);
setInterval(()=>{if(!doc.hidden)tudo()},1500);
root.DIARIO_V430T={tudo,celular};
})(window);
