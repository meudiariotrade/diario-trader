/* Cache de uma publicação completa. Arquivos essenciais nunca são atualizados isoladamente. */
const C='diario-v__APP_VERSION__-confiabilidade',CDN='diario-cdn-v__APP_VERSION__',CDN_LIMIT=40;
const APP_VERSION='__APP_VERSION__';
const CORE=["mercado.css","relatorios-dados.js","fiscal-conferencia.js","dominios.js","runtime-dominios.js","analises-modelo.js","screeners-inteligencia.js","screeners-grafico.js","screeners-top10.js","screeners-relatorio.js","tecnico-engine.js","tecnico-worker.js","institutional-v781.js","xbrl-periodos.js","feed-contract-v787.js","feed-profit-v788.js","binance-stream-v790.js","feed-finnhub-v791.js","source-health-v793.js","historico-qualidade-v794.js","snapshot-contract-v800.js","backtest-gates-v801.js","economatica-fatos-v795.js","corporate-candles-v792.js","tecnico-pdf.js","pesquisa-pdf.js","tecnico-ui.js","analises-plus.js","analises.js","analises.css","organizacao.js","version.js","chunks.js","sync-recovery.js","aulas-recuperacao.js","projeto-2027.js","terminal-bbg.js","modo-simples.js","plano-operacional.js","estudos-mercado-v546.js","mercado-simples-v549.js","melhorias-v550.js","profit-cotacoes-v552.js","tape-live.js","ajustes-v554.js","terminal-comandos.js","terminal-inicio.js","navegacao-simples.js","organizacao-v573.js","index.html","config.js","estudos-modelo.js","tema-claro-v427.css","tema-cedo-v427.js","manifest.webmanifest","icon-192.png","icon-512.png","nucleo-v560.js","camadas-v560.js","validacao-terminal.js","terminal-gestos-seguros.js","terminal-fonte-v533.js","estudos-rolagem-v528.js","acoes-fortes-v529.js","estilo-v560.css","capa-v560.js","relatorio-pdf-v560.js","apple-touch-icon.png","capas-v561.js","jornal-v561.js","mesa-v562.js","ajustes-v564.js","claro-v568.js","mercado-v565.js","cerebro-ia.js","cerebro-estudos.js","historico-fundamentos.js","historico-pdf.js","pdf-logos.js","aula-animada.js","fibo-visual.js","src/shared/sessoes-mercado.js","src/operations/plano-execucao.js","src/shared/memoria-previsao.js","src/shared/barra-contexto.js","src/shared/color-link.js","src/shared/ficha-ativo.js","src/shared/painel-carteira.js","src/studies/estudos-visual.js","src/shared/niveis-plano.js","src/shared/ui-base.js","src/shared/ui-momentos.js","src/shared/ui-navegacao.js","src/shared/ui-graficos.js","src/shared/ui-rotina.js","src/shared/ui-aurea.js","src/shared/interpretacao-sessao.js","src/shared/cache-publico.js","src/shared/mercado-cloudflare-v894.js","src/shared/diario-d1-espelho.js","src/shared/diario-arquivos-privados-v901.js","src/shared/diario-migracao-v902.js","src/shared/diario-d1-principal-v903.js","src/shared/diario-registros-v913.js","src/shared/inteligencia-integrada.js","src/shared/leitura-mercado.js","src/intelligence/etapa1.js","src/shared/atalhos-iphone.js","src/shared/inteligencia-etapa2-dados.js","src/intelligence/etapa2.js"];
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
/*
 * v894 — Roteamento exclusivo de dados PÚBLICOS pela Cloudflare.
 * Somente Edge Functions de dados públicos são interceptadas. Auth, operações,
 * carteiras, notificações, demais funções e dados privados continuam intocados.
 * Não há fallback para a Edge Function de mercado no Supabase.
 * Nunca encaminhar apikey, JWT, cookies ou dados pessoais ao Worker público.
 */
const MERCADO_CF_BASE='https://diario-trader.lucianosilva43567.workers.dev';
const MERCADO_SUPABASE_HOST='vdzwydizostutukppcsj.supabase.co';
const MERCADO_CF_FUNCOES=new Set(['macro','precos','candles','ewz','juros','sentimento','adrs','noticias']);
function mercadoCfValido(funcao,modo,dados){
 if(!dados||typeof dados!=='object'||dados.error||dados.erro)return false;
 if(funcao==='precos')return dados.br&&typeof dados.br==='object'&&dados.us&&typeof dados.us==='object'&&
   (Object.keys(dados.br).length>0||Object.keys(dados.us).length>0);
 if(funcao==='candles')return Array.isArray(dados.candles)&&typeof dados.simbolo==='string';
 if(funcao==='ewz')return Number(dados.spot)>0&&(dados.status==='sem_feed_opcoes'||Array.isArray(dados.vencs));
 if(funcao==='juros')return !!(dados.selic||dados.curva);
 if(funcao==='sentimento')return !!(dados.b3||dados.eua||dados.cripto);
 if(funcao==='adrs'||funcao==='noticias')return Array.isArray(dados.itens);
 if(modo==='agenda')return Array.isArray(dados.eventos);
 if(modo==='painel'||modo==='diag'||modo==='cotacoes')return Array.isArray(dados.itens);
 if(modo==='balancos')return Array.isArray(dados.proximos);
 if(modo==='ranking')return Array.isArray(dados.altas);
 if(modo==='sazonal')return !!dados.mes;
 if(modo==='setores')return 'us' in dados||'br' in dados;
 if(modo==='')return !!(dados.mercados||dados.brasil);
 return true; // outros modos públicos mantêm o contrato JSON do próprio Worker
}
function mercadoCfUrl(funcao,dados){
 const params=new URLSearchParams();
 if(funcao==='precos'){
   const br=Array.isArray(dados.br)?dados.br:[];
   const us=Array.isArray(dados.us)?dados.us:[];
   // O Worker público limita a 40 símbolos por mercado; jamais cortar uma posição.
   if(br.length>40||us.length>40||!br.length&&!us.length)return null;
   params.set('br',br.join(','));params.set('us',us.join(','));
 }else if(funcao==='macro'){
   for(const k of ['modo','aba','semana'])if(dados[k]!=null)params.set(k,String(dados[k]));
 }else if(funcao==='candles'){
   for(const k of ['ativo','sub','intervalo','de','ate','revista'])if(dados[k]!=null)params.set(k,String(dados[k]));
   if(!params.has('ativo'))return null;
 }else if(funcao==='ewz'){
   if(dados.acao&&dados.acao!=='agora')return null;
   if(dados.venc)params.set('venc',String(dados.venc).slice(0,10));
 }else if(funcao==='adrs'){
   const lista=Array.isArray(dados.symbols)?dados.symbols:null;
   if(!lista||!lista.length||lista.length>40||lista.some(t=>!/^[A-Z0-9.^=_:-]{1,24}$/.test(String(t).toUpperCase())))return null;
   params.set('s',[...new Set(lista.map(t=>String(t).toUpperCase()))].join(','));
 }else if(funcao==='juros'||funcao==='sentimento'||funcao==='noticias'){
   if(Object.keys(dados).length)return null;
 }else return null;
 return MERCADO_CF_BASE+'/v1/'+funcao+'?'+params.toString();
}
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='POST')return;
 let url;
 try{url=new URL(req.url)}catch{return}
 if(url.protocol!=='https:'||url.hostname!==MERCADO_SUPABASE_HOST)return;
 const prefix='/functions/v1/';
 if(!url.pathname.startsWith(prefix))return;
 const funcao=url.pathname.slice(prefix.length);
 if(!MERCADO_CF_FUNCOES.has(funcao))return;
 event.respondWith((async()=>{
   let dados;
   try{dados=await req.clone().json()}catch{return Response.json({error:'Payload de mercado inválido',erro:'Payload de mercado inválido',semFallbackSupabase:true},{status:400})}
   if(!dados||typeof dados!=='object'||Array.isArray(dados))return Response.json({error:'Payload de mercado inválido',erro:'Payload de mercado inválido',semFallbackSupabase:true},{status:400});
   const destino=mercadoCfUrl(funcao,dados);
   if(!destino)return Response.json({error:'Consulta pública inválida; nenhuma requisição enviada ao Supabase',erro:'Consulta pública inválida; nenhuma requisição enviada ao Supabase',semFallbackSupabase:true},{status:400});
   try{
     // Request NOVO sem qualquer cabeçalho privado do Supabase.
     const resposta=await fetch(destino,{
       method:'GET',credentials:'omit',mode:'cors',redirect:'error',cache:'default',
       signal:req.signal,headers:{Accept:'application/json'}
     });
     if(resposta.ok){
       const tipo=resposta.headers.get('content-type')||'';
       if(/application\/json/i.test(tipo)){
         const payload=await resposta.clone().json();
         if(mercadoCfValido(funcao,String(dados.modo||''),payload)){
           if(funcao==='noticias')return Response.json({...payload,itens:payload.itens.map(n=>({...n,f:n.f||n.fonte||n.a||'Fonte não indicada'}))});
           return resposta;
         }
       }
     }
   }catch(_){/* Sem fallback ao Supabase para dados de mercado. */}
   return Response.json({error:'Dados públicos indisponíveis na Cloudflare',erro:'Dados públicos indisponíveis na Cloudflare',semFallbackSupabase:true},{status:503,headers:{'Cache-Control':'no-store'}});
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
  event.respondWith((async()=>{
   const cache=await caches.open(C),offline=await cache.match('index.html');
   try{
    const response=await fetch(new Request(event.request,{cache:'no-cache'}));
    if(response.ok && /text\/html/i.test(response.headers.get('content-type')||'')){
     // Só entrega HTML online compatível com os bundles da versão instalada.
     const html=await response.clone().text();
     if(html.includes('config.js?v='+APP_VERSION)&&html.includes('nucleo-v560.js?v='+APP_VERSION))return response;
    }
   }catch{}
   return offline||fetch(event.request);
  })());return;
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
/* Registro local mínimo para confirmar processamento de Push pelo Service Worker.
   Sem manchetes, tokens nem endpoints; apenas horário e tipo. O banco fica no aparelho. */
function pushDiagSalvar(tipo,tag){
 return new Promise(resolve=>{
  if(!('indexedDB' in self))return resolve(false);
  try{
   const r=indexedDB.open('diario-push-diagnostico-v1',1);
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('eventos'))r.result.createObjectStore('eventos')};
   r.onerror=()=>resolve(false);
   r.onsuccess=()=>{
    const db=r.result;
    try{
     const tx=db.transaction('eventos','readwrite');
     tx.objectStore('eventos').put({quando:new Date().toISOString(),tag:String(tag||'').slice(0,70)},tipo);
     tx.oncomplete=()=>{db.close();resolve(true)};
     tx.onerror=()=>{db.close();resolve(false)};
     tx.onabort=()=>{db.close();resolve(false)};
    }catch(_){db.close();resolve(false)}
   };
  }catch(_){resolve(false)}
 });
}
/* Notificações push */
self.addEventListener('push',e=>{
 let d={};
 try{d=e.data?e.data.json():{}}catch(_){d={title:'Diário de trader',body:e.data?e.data.text():''}}
 e.waitUntil((async()=>{
  await self.registration.showNotification(d.title||'Diário de trader',{
   body:d.body||'',tag:d.tag||undefined,icon:'icon-192.png',badge:'icon-192.png',data:d.data||{}
  });
  // showNotification resolvido não garante banner visível; registra só o evento processado.
  await pushDiagSalvar('ultimo',d.tag||'');
 })());
});
self.addEventListener('notificationclick',e=>{e.waitUntil(pushDiagSalvar('clique',e.notification.tag||''));e.notification.close();const g=e.notification.data||{},u=new URL('./?go='+encodeURIComponent(g.go||'mercado')+(g.r?'&r='+encodeURIComponent(g.r):''),self.registration.scope).href;e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>x.url.startsWith(self.registration.scope));if(c){c.postMessage({go:g.go||'mercado',r:g.r||''});return c.focus()}return self.clients.openWindow(u)}))});
