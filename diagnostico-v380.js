/* v379 — diagnóstico OPT-IN no próprio aparelho. Sem envio de dados ao servidor. */
(()=>{'use strict';
 const qs=new URLSearchParams(location.search);
 if(qs.get('diagnostico')!=='1')return;
 const render=()=>{
  if(document.getElementById('diagnostico-v379'))return;
  const el=document.createElement('aside');el.id='diagnostico-v379';
  el.setAttribute('role','complementary');el.setAttribute('aria-label','Diagnóstico de desempenho local');
  Object.assign(el.style,{position:'fixed',right:'8px',bottom:'10px',zIndex:'999999',maxWidth:'min(390px,94vw)',background:'#17212b',color:'#f1f5fa',border:'1px solid #64748b',padding:'12px',borderRadius:'10px',font:'12px/1.4 system-ui',boxShadow:'0 8px 30px #0008'});
  const heading=document.createElement('strong');heading.textContent='Diagnóstico local · sem envio de dados';el.append(heading);
  const info=document.createElement('pre');info.style.whiteSpace='pre-wrap';info.style.maxHeight='34vh';info.style.overflow='auto';el.append(info);
  function collect(){
    const nav=performance.getEntriesByType('navigation')[0];
    const assets=performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script'||x.initiatorType==='link');
    // Não inclui URLs, query string, identificadores, carteira ou cookies.
    return {versao:'v380',coletadoEm:new Date().toISOString(),
       dispositivo:{largura:innerWidth,altura:innerHeight,pixelRatio:devicePixelRatio,online:navigator.onLine},
       navegacao:nav?{domContentLoadedMs:Math.round(nav.domContentLoadedEventEnd),loadMs:Math.round(nav.loadEventEnd),transferBytes:nav.transferSize||null}:null,
       recursos:{scriptsEEstilos:assets.length,bytesTransferidos:assets.reduce((n,x)=>n+(x.transferSize||0),0)},
       serviceWorker:{controlado:!!navigator.serviceWorker?.controller}};
  }
  let snapshot=collect();function refresh(){snapshot=collect();info.textContent=JSON.stringify(snapshot,null,2)}
  const b=document.createElement('button');b.textContent='Atualizar métricas';b.type='button';b.addEventListener('click',refresh);el.append(b);
  const exportBtn=document.createElement('button');exportBtn.textContent='Compartilhar / salvar JSON';exportBtn.type='button';exportBtn.style.marginLeft='6px';
  exportBtn.addEventListener('click',async()=>{
    const content=JSON.stringify(collect(),null,2),name='diagnostico-desempenho-v379.json';
    // iOS suporta compartilhamento nativo de arquivos no contexto de clique do usuário.
    if(typeof File==='function'&&typeof navigator.share==='function'){
      try{const file=new File([content],name,{type:'application/json'});
        if(typeof navigator.canShare==='function'&&navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:'Diagnóstico local do Diário de Trader'});return;
        }
      }catch(e){if(e&&e.name==='AbortError')return;}
    }
    const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();
    // Safari pode precisar do URL de objeto por alguns segundos após o clique.
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  });el.append(exportBtn);
  const copy=document.createElement('button');copy.textContent='Copiar resumo';copy.type='button';copy.style.marginLeft='6px';
  copy.addEventListener('click',async()=>{
    const original=copy.textContent;
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard indisponível');
      await navigator.clipboard.writeText(JSON.stringify(collect(),null,2));
      copy.textContent='Copiado';
    }catch{copy.textContent='Não foi possível copiar';}
    setTimeout(()=>{copy.textContent=original},3500);
  });el.append(copy);
  const close=document.createElement('button');close.textContent='Fechar';close.type='button';close.style.marginLeft='6px';close.addEventListener('click',()=>el.remove());el.append(close);
  document.body.append(el);refresh();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
