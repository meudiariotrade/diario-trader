/* Cache de uma publicação completa. Arquivos essenciais nunca são atualizados isoladamente. */
const C='diario-v310-cards',CDN='diario-cdn-1';
const CORE=['./','index.html','manifest.webmanifest','config.js','app.js','carteira-calculo.js','pdf-tabelas.js','terminal-graficos.js','componentes-estilos.js','interface-acabamento.js','trader-ui.js','style.css','theme-profissional.css','trader-backup.js','terminal-praticidade.js','diario-profissional.js','mercado-profissional.js','mercado-monitor.js','adrs-modelo.js','diario-dados.js','diario-recuperacao.js','pdf-tipografia.js','trader-runtime.js','trader-modelo.js','trader-fluxos.js','trader-chat.js','trader-relatorios.js','carteira-pesquisa.js','carteira-experiencia.js','carteira-correcao.js','revista-modelo.js','revista-fim-semana.js','carteira-factsheet-modelo.js','carteira-factsheet.js','terminal-workflows.js','terminal-pesquisa-modelo.js','terminal-pesquisa.js','fluxo-importacao.js','pesquisa-avancada-modelo.js','pesquisa-avancada.js','cotacoes-conexao.js','aulas.js','adr-abertura.js','terminal-radar.js','design-profissional.js','design-profissional.css','plataforma-acabamento.js','plataforma-acabamento.css','exports-profissionais.js','cards-sazonais.js','cards-art/mercados-brasil-eua.png','cards-art/natal-touro.png','cards-art/halloween-touro.png','cards-art/colecao-sazonal.png'];
CORE.push('pdf-lib.min.js','fontkit.umd.min.js','pdf-sans.ttf','pdf-sans-bold.ttf','pdf-sans-italic.ttf','pdf-serif-bold.ttf','pdf-serif-italic.ttf','jornal-capa.jpg','jornal-diario.jpg','jornal-empresas.jpg','jornal-mundo.jpg');
const EXTRA=['arte.js','cnpi.js','estudos.js','ingles.js','icon-192.png','icon-512.png'];
const CDN_OK=/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.(googleapis|gstatic)\.com)\//;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(C);
  try{await cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'})));}
  catch(error){await caches.delete(C);throw error;}
  await Promise.all(EXTRA.map(url=>cache.add(new Request(url,{cache:'reload'})).catch(()=>{})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('diario-v')&&name!==C)await caches.delete(name);
  await self.clients.claim();
  for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({novaVersao:1,versao:C});
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
   if(response.ok)await cache.put(event.request,response.clone());
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
   // Não grava uma versão parcial nesta publicação se o asset opcional não veio.
   return cached||fetch(event.request);
  })());
 }
});
/* Notificações push */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'Diário de trader',body:e.data?e.data.text():''}}e.waitUntil(self.registration.showNotification(d.title||'Diário de trader',{body:d.body||'',tag:d.tag||undefined,icon:'icon-192.png',badge:'icon-192.png',data:d.data||{}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const g=e.notification.data||{},u=new URL('./?go='+encodeURIComponent(g.go||'mercado')+(g.r?'&r='+encodeURIComponent(g.r):''),self.registration.scope).href;e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>x.url.startsWith(self.registration.scope));if(c){c.postMessage({go:g.go||'mercado',r:g.r||''});return c.focus()}return self.clients.openWindow(u)}))});
