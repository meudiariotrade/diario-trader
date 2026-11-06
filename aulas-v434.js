/* Diário de Trader v434 — Vídeos MP4 das aulas (feitos pela ponte de vídeo no computador)
 * Na lista de aulas aparece "🎬 Vídeo" quando a ponte já enviou o MP4 daquela aula.
 * Toque: abre o vídeo no app, com Compartilhar (WhatsApp, Instagram…) e Baixar.
 * Os vídeos ficam no armazenamento privado da sua conta (pasta só sua). Nada é removido. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const BUCKET='aulas-videos',FMTS=['9x16','16x9','1x1'],NOME={'9x16':'Em pé 9:16','16x9':'Deitado 16:9','1x1':'Quadrado 1:1'};
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C={ts:0,nomes:null,busy:0,pedido:0};
const logado=()=>g(()=>!!(SESS&&SESS.uid&&cfg()),false);
async function lista(forca){
  if(!logado())return null;
  if(!forca&&C.nomes&&Date.now()-C.ts<120000)return C.nomes;
  if(C.busy)return C.nomes;C.busy=1;
  try{
    await tok();const s=cfg();
    const r=await fetch(s.url+'/storage/v1/object/list/'+BUCKET,{method:'POST',headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({prefix:SESS.uid+'/',limit:1000,sortBy:{column:'name',order:'asc'}})});
    const j=await r.json().catch(()=>[]);
    C.nomes=new Set((Array.isArray(j)?j:[]).map(x=>x.name));C.ts=Date.now();
  }catch(e){C.nomes=C.nomes||new Set()}
  finally{C.busy=0}
  return C.nomes;
}
const videosDe=id=>C.nomes?FMTS.filter(f=>C.nomes.has(id+'-'+f+'.mp4')):[];
async function urlDe(id,f){
  await tok();const s=cfg(),path=SESS.uid+'/'+id+'-'+f+'.mp4';
  const r=await fetch(s.url+'/storage/v1/object/sign/'+BUCKET+'/'+path,{method:'POST',headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({expiresIn:3600})});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.signedURL)throw new Error(j.message||j.error||'Vídeo indisponível');
  return s.url+'/storage/v1'+j.signedURL;
}
function botoes(){
  const rows=doc.querySelectorAll('.au-study-row');if(!rows.length||!logado())return;
  if(!C.nomes){if(!C.busy&&!C.pedido){C.pedido=1;lista(false).then(()=>{C.pedido=0;if(C.nomes)botoes()})}return}
  if(Date.now()-C.ts>120000&&!C.busy&&!C.pedido){C.pedido=1;lista(true).then(()=>{C.pedido=0;botoes()})}
  rows.forEach(row=>{
    const ab=row.querySelector('[data-auopen]');if(!ab)return;
    const id=ab.dataset.auopen,fs=videosDe(id);
    let b=row.querySelector('.v434-vid');
    if(!fs.length){if(b)b.remove();return}
    if(!b){b=doc.createElement('button');b.type='button';b.className='v434-vid';ab.after(b)}
    b.dataset.id=id;b.dataset.fs=fs.join(',');
    const t='🎬 Vídeo';if(b.textContent!==t){b.textContent=t;b.setAttribute('aria-label','Assistir o vídeo MP4 desta aula')}
  });
}
function titulo(id){const a=g(()=>(AU.lista||[]).find(x=>x.id===id),null)||g(()=>root.AULAS.getLista().find(x=>x.id===id),null);return a?`Aula ${a.numero} · ${a.titulo}`:'Aula em vídeo'}
async function abrir(id,fs,f){
  f=f||fs[0];
  let ov=doc.getElementById('v434-ov');
  if(!ov){ov=doc.createElement('div');ov.id='v434-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');doc.body.appendChild(ov)}
  ov.innerHTML=`<div class="v434-box"><div class="v434-top"><b>${esc(titulo(id))}</b><button type="button" class="v434-x" data-v434x aria-label="Fechar">✕</button></div>
  ${fs.length>1?`<div class="v434-fmts">${fs.map(x=>`<button type="button" data-v434f="${x}" class="${x===f?'on':''}">${NOME[x]}</button>`).join('')}</div>`:''}
  <div class="v434-play"><div class="v434-load">Carregando o vídeo…</div></div>
  <div class="v434-acts"><button type="button" class="v434-pri" data-v434share>Compartilhar</button><a class="v434-dl" data-v434dl href="#" download>Baixar</a></div></div>`;
  ov.hidden=false;ov.dataset.id=id;ov.dataset.fs=fs.join(',');ov.dataset.f=f;
  try{
    const u=await urlDe(id,f);ov.dataset.u=u;
    ov.querySelector('.v434-play').innerHTML=`<video src="${esc(u)}" controls playsinline preload="metadata"></video>`;
    const dl=ov.querySelector('[data-v434dl]');dl.href=u+'&download='+encodeURIComponent(titulo(id).replace(/[\\/:*?"<>|]+/g,'')+' ('+f+').mp4');
  }catch(e){ov.querySelector('.v434-play').innerHTML=`<div class="v434-load">Não abriu: ${esc(e.message||e)}</div>`}
}
function fechar(){const ov=doc.getElementById('v434-ov');if(!ov)return;const v=ov.querySelector('video');if(v)v.pause();ov.hidden=true;ov.innerHTML=''}
doc.addEventListener('click',async e=>{
  const b=e.target.closest&&e.target.closest('.v434-vid');
  if(b){e.preventDefault();e.stopPropagation();abrir(b.dataset.id,b.dataset.fs.split(','));return}
  const ov=doc.getElementById('v434-ov');if(!ov||ov.hidden)return;
  if(e.target===ov||e.target.closest('[data-v434x]')){e.preventDefault();fechar();return}
  const f=e.target.closest('[data-v434f]');if(f){e.preventDefault();abrir(ov.dataset.id,ov.dataset.fs.split(','),f.dataset.v434f);return}
  if(e.target.closest('[data-v434share]')){e.preventDefault();const u=ov.dataset.u;if(!u)return;
    try{
      // tenta mandar o arquivo (WhatsApp/Instagram aceitam vídeo); se o aparelho não deixar, manda o link
      const r=await fetch(u);const bl=await r.blob();const arq=new File([bl],titulo(ov.dataset.id).replace(/[\\/:*?"<>|]+/g,'')+'.mp4',{type:'video/mp4'});
      if(navigator.canShare&&navigator.canShare({files:[arq]})){await navigator.share({files:[arq],title:titulo(ov.dataset.id)});return}
      if(navigator.share){await navigator.share({url:u,title:titulo(ov.dataset.id)});return}
    }catch(x){if(x&&x.name==='AbortError')return}
    try{await navigator.clipboard.writeText(u);g(()=>toast('Link do vídeo copiado (vale por 1 hora).',3000))}catch(x){}
  }
},true);
doc.addEventListener('keydown',e=>{if(e.key==='Escape')fechar()});
function hook(){if(typeof root.render0!=='function'||root.render0.__v434)return;const p=root.render0;const f=function(){const o=p.apply(this,arguments);try{botoes()}catch(e){}return o};f.__v434=1;root.render0=f}
let k=0;const iv=setInterval(()=>{k++;hook();try{botoes()}catch(e){}if(k>20)clearInterval(iv)},800);
setInterval(()=>{if(!doc.hidden)try{botoes()}catch(e){}},4000);
root.DIARIO_V434={lista,abrir};
})(window);
