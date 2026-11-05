/* Cache de uma publicação completa. Arquivos essenciais nunca são atualizados isoladamente. */
const C='diario-v388-mercado-visual-01',CDN='diario-cdn-v388',CDN_LIMIT=40;
const CORE=["index.html","recursos.js","inicio.js","app.js","interface.js","identidade-ativos-v387.js","mercado-visual-v388.js","mercado-visual-v388.css","identidade-ativos-v386.css","terminal-mobile-v385.css","terminal-mobile-v385.js","calendario-mercado-v379.js","editorial-financeiro-v379.js","diagnostico-v386.js","editorial-financeiro-v379.css","manifest.webmanifest","icon-192.png","icon-512.png","logos/us/apple.png","logos/us/microsoft.png","logos/us/nvidia.png","logos/us/google.png","logos/us/amazon.png","logos/us/tesla.png","logos/us/meta.png","logos/us/netflix.png","logos/us/amd.png","logos/us/intel.png","logos/us/visa.png","logos/us/uber.png","logos/us/airbnb.png","logos/us/paypal.png","logos/us/spotify.png","logos/us/mastercard.png","logos/us/qualcomm.png","logos/us/shopify.png","logos/fx/au.png","logos/fx/br.png","logos/fx/ca.png","logos/fx/ch.png","logos/fx/cn.png","logos/fx/dk.png","logos/fx/eu.png","logos/fx/gb.png","logos/fx/hk.png","logos/fx/in.png","logos/fx/jp.png","logos/fx/kr.png","logos/fx/mx.png","logos/fx/no.png","logos/fx/nz.png","logos/fx/pl.png","logos/fx/se.png","logos/fx/sg.png","logos/fx/us.png","logos/fx/za.png"];
const EXTRA=["pdf-lib.min.js","fontkit.umd.min.js","fontes-pdf.js","arte.js","cnpi.js","estudos.js","ingles.js","card-colecao-sazonal.jpg","card-halloween-touro.jpg","card-mercados-brasil-eua.jpg","card-natal-touro.jpg","editorial-mercado-v379.jpg","logos/fx/ae.png","logos/fx/ar.png","logos/fx/bd.png","logos/fx/bg.png","logos/fx/bh.png","logos/fx/bo.png","logos/fx/cl.png","logos/fx/co.png","logos/fx/cr.png","logos/fx/cz.png","logos/fx/do.png","logos/fx/eg.png","logos/fx/ge.png","logos/fx/gh.png","logos/fx/hu.png","logos/fx/id.png","logos/fx/il.png","logos/fx/is.png","logos/fx/jm.png","logos/fx/ke.png","logos/fx/kw.png","logos/fx/kz.png","logos/fx/ma.png","logos/fx/mu.png","logos/fx/my.png","logos/fx/ng.png","logos/fx/om.png","logos/fx/pe.png","logos/fx/ph.png","logos/fx/pk.png","logos/fx/py.png","logos/fx/qa.png","logos/fx/ro.png","logos/fx/rs.png","logos/fx/ru.png","logos/fx/sa.png","logos/fx/th.png","logos/fx/tn.png","logos/fx/tr.png","logos/fx/tw.png","logos/fx/ua.png","logos/fx/uy.png","logos/fx/vn.png"];
const CDN_OK=/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.(googleapis|gstatic)\.com)\//;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(C);
  try{await cache.addAll(CORE.map(url=>new Request(url,{cache:'no-cache'})));}
  catch(error){await caches.delete(C);throw error;}
  // Recursos pesados são baixados apenas na primeira utilização.
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const antigas=(await caches.keys()).filter(name=>name.startsWith('diario-v')&&name!==C);
  for(const name of antigas)await caches.delete(name);
  // Atualizações do aplicativo não preservam indefinidamente cópias do CDN de versões antigas.
  for(const name of await caches.keys()){if(name.startsWith('diario-cdn-')&&name!==CDN)await caches.delete(name);}
  await self.clients.claim();
  // Não solicitar atualização da página na primeira instalação.
  if(antigas.length)for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({novaVersao:1,versao:C});
 })());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin){
  if(!CDN_OK.test(url.href))return;
  event.respondWith((async()=>{
   const cache=await caches.open(CDN),cached=await cache.match(event.request);
   if(cached)return cached;
   const response=await fetch(event.request);
   // Evita cache infinito de arquivos de terceiros e respeita no-store.
   if(response.ok&&response.type!=='opaque'&&!event.request.headers.has('authorization')&&!/no-store|private/i.test(response.headers.get('cache-control')||'')){
     try{
       await cache.put(event.request,response.clone());
       const keys=await cache.keys();
       for(const old of keys.slice(0,Math.max(0,keys.length-CDN_LIMIT)))await cache.delete(old);
     }catch(_){/* falha por quota nunca bloqueia o recurso online */}
   }
   return response;
  })());return;
 }
 const scope=new URL(self.registration.scope);
 if(!url.pathname.startsWith(scope.pathname))return;
 const path=url.pathname.slice(scope.pathname.length)||'index.html';
 const bundled=CORE.concat(EXTRA).includes(path);
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{const cache=await caches.open(C);return await cache.match('index.html')||fetch(event.request)})());return;
 }
 if(bundled){
  event.respondWith((async()=>{
   const cache=await caches.open(C),cached=await cache.match(new URL(path,scope).href,{ignoreSearch:true});
   if(cached)return cached;
   // Cache incremental apenas para arquivos opcionais pedidos pelo usuário.
   const response=await fetch(event.request);
   if(EXTRA.includes(path)&&response.ok)await cache.put(event.request,response.clone());
   return response;
  })());
 }
});
/* Notificações push */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'Diário de trader',body:e.data?e.data.text():''}}e.waitUntil(self.registration.showNotification(d.title||'Diário de trader',{body:d.body||'',tag:d.tag||undefined,icon:'icon-192.png',badge:'icon-192.png',data:d.data||{}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const g=e.notification.data||{},u=new URL('./?go='+encodeURIComponent(g.go||'mercado')+(g.r?'&r='+encodeURIComponent(g.r):''),self.registration.scope).href;e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>x.url.startsWith(self.registration.scope));if(c){c.postMessage({go:g.go||'mercado',r:g.r||''});return c.focus()}return self.clients.openWindow(u)}))});
