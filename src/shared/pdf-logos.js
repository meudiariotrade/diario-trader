/* v854: logos oficiais nos PDFs (mesmo componente da aba Mercado). Busca com tempo limite; sem logo, o PDF sai igual. */
(function(w){'use strict';
 async function carregar(doc,tickers,limite=9000){
  const mapa=new Map(),lista=[...new Set((tickers||[]).map(t=>String(t||'').replace(/USDT$/,'').toUpperCase()).filter(Boolean))].slice(0,40);
  if(!w.DiarioLogos?.png||w.DIARIO_DEMO||!doc?.embedPng)return mapa;
  await Promise.race([Promise.all(lista.map(async k=>{try{const p=await w.DiarioLogos.png(k,96);if(p?.bytes)mapa.set(k,{img:await doc.embedPng(p.bytes),r:p.w/p.h})}catch{}})),new Promise(r=>setTimeout(r,limite))]);
  return mapa;
 }
 /* top = distância do topo da página (mesma convenção dos PDFs do app). */
 function desenhar(page,mapa,ticker,x,top,tamanho,H){
  const l=mapa?.get(String(ticker||'').replace(/USDT$/,'').toUpperCase());if(!l||!page)return 0;
  const h=tamanho,wd=h*(l.r||1);page.drawImage(l.img,{x,y:H-top-h,width:wd,height:h});return wd+5;
 }
 w.DiarioPDFLogos={carregar,desenhar};
})(window);
