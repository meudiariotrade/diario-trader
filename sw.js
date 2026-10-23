const C='diario-v187',CDN='diario-cdn-1',F=['./','index.html','manifest.webmanifest','config.js','app.js','arte.js','cnpi.js','style.css','icon-192.png','icon-512.png','icon-180.png','favicon-64.png'];
const CDN_OK=/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.(googleapis|gstatic)\.com)\//;
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==CDN).map(x=>caches.delete(x)))));self.clients.claim()});
/* avisa as telas abertas quando o app.js novo chegou (a próxima abertura já usa a versão nova) */
const marca=r=>r?(r.headers.get('etag')||'')+'|'+(r.headers.get('last-modified')||'')+'|'+(r.headers.get('content-length')||''):'';
async function avisaNova(){const L=await self.clients.matchAll({type:'window',includeUncontrolled:true});L.forEach(c=>c.postMessage({novaVersao:1}))}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);
  /* bibliotecas das CDNs (PDF, gráficos): guarda a cópia para abrir sem internet */
  if(u.origin!==location.origin){if(!CDN_OK.test(e.request.url))return;e.respondWith(caches.open(CDN).then(c=>c.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}))));return}
  const ehApp=/\/app\.js$/.test(u.pathname);
  /* abre na hora com a cópia guardada e atualiza por trás */
  const rede=fetch(e.request).then(async r=>{if(r.ok&&r.type==='basic'){const c=await caches.open(C);if(ehApp){const ant=await c.match(e.request,{ignoreSearch:true});if(ant&&marca(ant)!==marca(r))avisaNova()}await c.put(e.request,r.clone())}return r});
  e.waitUntil(rede.catch(()=>{}));e.respondWith(caches.match(e.request,{ignoreSearch:e.request.mode==='navigate'||ehApp}).then(c=>c||rede.catch(()=>caches.match('index.html'))))});
/* Notificações push */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'Diário de trader',body:e.data?e.data.text():''}}e.waitUntil(self.registration.showNotification(d.title||'Diário de trader',{body:d.body||'',tag:d.tag||undefined,icon:'icon-192.png',badge:'icon-192.png',data:d.data||{}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const g=e.notification.data||{},u=new URL('./?go='+encodeURIComponent(g.go||'mercado')+(g.r?'&r='+encodeURIComponent(g.r):''),self.registration.scope).href;e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>x.url.startsWith(self.registration.scope));if(c){c.postMessage({go:g.go||'mercado',r:g.r||''});return c.focus()}return self.clients.openWindow(u)}))});
