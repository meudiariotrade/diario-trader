/* Cache de uma publicação completa. Arquivos essenciais nunca são atualizados isoladamente. */
const C='diario-v__APP_VERSION__-confiabilidade',CDN='diario-cdn-v__APP_VERSION__',CDN_LIMIT=40;
const CORE=["version.js","chunks.js","sync-recovery.js","aulas-recuperacao.js","projeto-2027.js","terminal-bbg.js","modo-simples.js","plano-operacional.js","estudos-mercado-v546.js","mercado-simples-v549.js","melhorias-v550.js","profit-cotacoes-v552.js","ajustes-v554.js","terminal-comandos.js","terminal-inicio.js","navegacao-simples.js","index.html","estudos-modelo.js","tema-claro-v427.css","tema-cedo-v427.js","manifest.webmanifest","icon-192.png","icon-512.png","nucleo-v560.js","camadas-v560.js","validacao-terminal.js","terminal-gestos-seguros.js","terminal-fonte-v533.js","estudos-rolagem-v528.js","acoes-fortes-v529.js","estilo-v560.css","capa-v560.js","relatorio-pdf-v560.js","apple-touch-icon.png","capas-v561.js","jornal-v561.js","mesa-v562.js","ajustes-v564.js"];
const EXTRA=["pdf-documentos.js","pdf-sans.ttf","pdf-sans-bold.ttf","pdf-serif-bold.ttf","pdf-lib.min.js","fontkit.umd.min.js","fontes-pdf.js","arte.js","cnpi.js","estudos.js","ingles.js","card-colecao-sazonal.jpg","card-halloween-touro.jpg","card-mercados-brasil-eua.jpg","card-natal-touro.jpg","editorial-mercado-v379.jpg"];
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
 const optional=EXTRA.includes(path)||path.startsWith('assets/');
 const bundled=CORE.includes(path)||optional;
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{const cache=await caches.open(C);return await cache.match('index.html')||fetch(event.request)})());return;
 }
 if(bundled){
  event.respondWith((async()=>{
   const cache=await caches.open(C),cached=await cache.match(new URL(path,scope).href,{ignoreSearch:true});
   if(cached)return cached;
   // Cache incremental apenas para arquivos opcionais pedidos pelo usuário.
   const response=await fetch(new Request(event.request,{cache:'no-cache'}));
   if(optional&&response.ok)await cache.put(event.request,response.clone());
   return response;
  })());
 }
});
/* Notificações push */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'Diário de trader',body:e.data?e.data.text():''}}e.waitUntil(self.registration.showNotification(d.title||'Diário de trader',{body:d.body||'',tag:d.tag||undefined,icon:'icon-192.png',badge:'icon-192.png',data:d.data||{}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const g=e.notification.data||{},u=new URL('./?go='+encodeURIComponent(g.go||'mercado')+(g.r?'&r='+encodeURIComponent(g.r):''),self.registration.scope).href;e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>x.url.startsWith(self.registration.scope));if(c){c.postMessage({go:g.go||'mercado',r:g.r||''});return c.focus()}return self.clients.openWindow(u)}))});
