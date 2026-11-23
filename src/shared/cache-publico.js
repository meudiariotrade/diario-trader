/* Cache único de GETs públicos. Nunca aceita posições, tokens ou corpos personalizados.
 * Um consumidor cancelado não cancela os demais; último consumidor aborta a rede. */
(function(w){
 'use strict';if(w.DiarioPublico)return;
 const base='https://diario-trader.lucianosilva43567.workers.dev';
 const paths=new Set(['/v2/eventos','/v1/mercado','/v1/fluxo','/v1/agenda?semana=0','/v1/agenda?semana=1','/v1/sentimento','/v1/juros','/v1/analogia','/v1/extras']);
 const memory=new Map(),pending=new Map();let dbPromise;let memoryQueue=Promise.resolve();
 function db(){if(!w.indexedDB)return Promise.resolve(null);if(!dbPromise)dbPromise=new Promise(resolve=>{
  const r=w.indexedDB.open('diario-contexto-publico-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');
  r.onerror=()=>resolve(null);r.onblocked=()=>resolve(null);r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};
 });return dbPromise;}
 async function read(key){const d=await db();if(!d)return null;return new Promise(resolve=>{try{const r=d.transaction('snapshots').objectStore('snapshots').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);}catch{resolve(null)}});}
 async function save(key,value){const d=await db();if(!d)return;try{const tx=d.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(value,key);}catch(_){}}
 function join(job,signal){return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return;}
  const token={};job.users.add(token);let done=false;
  function end(){if(done)return;done=true;job.users.delete(token);signal?.removeEventListener('abort',abort);}
  function abort(){end();if(!job.users.size)job.abort.abort();reject(new DOMException('Aborted','AbortError'));}
  signal?.addEventListener('abort',abort,{once:true});job.promise.then(v=>{if(!done){end();resolve(v);}},e=>{if(!done){end();reject(e);}});
 });}
 function get(path,{signal,ttl=120000}={}){
  if(!paths.has(path)&&!/^\/v1\/series\?serie=[a-z0-9]{2,20}&desde=\d{4}$/.test(path))return Promise.reject(Error('Rota pública não permitida'));
  if(signal?.aborted)return Promise.reject(new DOMException('Aborted','AbortError'));
  const hot=memory.get(path);
  if(hot&&Date.now()>=hot.at&&Date.now()-hot.at<ttl)return Promise.resolve(hot.data);
  let job=pending.get(path);
  if(!job||job.abort.signal.aborted){
   job={users:new Set(),abort:new AbortController()};pending.set(path,job);
   job.promise=(async()=>{
    let cached=memory.get(path);
    try{
     if(!cached){cached=await read(path);if(cached)memory.set(path,cached);}
     if(job.abort.signal.aborted)throw new DOMException('Aborted','AbortError');
     if(cached&&Date.now()>=cached.at&&Date.now()-cached.at<ttl)return cached.data;
     const r=await fetch(base+path,{method:'GET',credentials:'omit',mode:'cors',cache:'default',signal:job.abort.signal});
     if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();
     if(!data||typeof data!=='object')throw Error('Snapshot inválido');
     if(path==='/v2/eventos'&&!Array.isArray(data.eventos)||path==='/v1/mercado'&&!data.mercados||path==='/v1/fluxo'&&!Array.isArray(data.linhas))throw Error('Contrato público inválido');
     const value={at:Date.now(),data};memory.set(path,value);void save(path,value);return data;
    }catch(e){if(e.name!=='AbortError'&&cached)return {...cached.data,desatualizado:true,cacheOffline:true};throw e;}
    finally{if(pending.get(path)===job)pending.delete(path);}
   })();
  }
  return join(job,signal);
 }
 // A âncora é a sessão B3, não o dia civil. Apenas eventos públicos e cotações com fonte.
 function remember(context,events,market){
  const run=()=>rememberSnapshot(context,events,market);const result=memoryQueue.then(run,run);memoryQueue=result.catch(()=>null);return result;
 }
 async function rememberSnapshot(context,events,market){
  const anchor=context?.anchorDate;if(!anchor)return null;
  const key='memoria',old=await read(key),same=old?.anchorDate===anchor;
  const start=Date.parse(context.anchorAt||anchor+'T23:59:59Z'),all=[...(same?old.eventos||[]:[]),...(events||[])];
  const seen=new Map();for(const e of all){const t=Date.parse(e?.ultimaAtualizacao);if(e?.id&&t>=start&&t<=Date.now()+60000&&e.fontes?.some(f=>/^https:\/\//.test(f?.url)))seen.set(e.id,e);}
  const quoteRows=[...(market?.mercados?.grupos||[]).flatMap(g=>g.itens||[]),...(market?.adrs||[])];
  const quotes=quoteRows.filter(q=>Number.isFinite(q.px)&&q.px>0&&q.priceAt&&q.source).slice(0,35);
  const next={version:1,anchorDate:anchor,at:new Date().toISOString(),eventos:[...seen.values()].sort((a,b)=>b.ultimaAtualizacao.localeCompare(a.ultimaAtualizacao)).slice(0,100),quotes,
   baseline:same?old.baseline||null:null,note:'Referência da última sessão brasileira. Sem fechamento sincronizado não calcular retorno acumulado entre sessões.'};
  await save(key,next);return next;
 }
 /* v824: ADRs sob demanda pela Cloudflare (cotação pública, cache de borda de 20 s). */
 async function adrs(symbols,signal){
  const lista=[...new Set((symbols||[]).map(x=>String(x||'').toUpperCase().replace(/[^A-Z0-9.\-]/g,'').slice(0,12)).filter(Boolean))].slice(0,40);
  if(!lista.length)return {itens:[],erros:[]};
  const r=await fetch(base+'/v1/adrs?s='+encodeURIComponent(lista.join(',')),{credentials:'omit',mode:'cors',signal:signal||AbortSignal.timeout(2e4)});
  if(!r.ok)throw Error('HTTP '+r.status);return r.json();
 }
 /* v891: Cloudflare absorve os dados publicos; replay autenticado consulta D1, com fallback legado.
  * Diagnosticos privados e EWZ sem 20 dias de IV mantem as rotas originais. */
 const rotas836={
  precos:b=>({q:'/v1/precos?br='+encodeURIComponent((b.br||[]).join(','))+'&us='+encodeURIComponent((b.us||[]).join(',')),ok:j=>Object.keys(j.br||{}).length||Object.keys(j.us||{}).length}),
  candles:b=>b.modo==='replay'?{q:'/v1/replay?'+['ativo','sub','intervalo','pregao'].filter(k=>b[k]!=null&&b[k]!=='').map(k=>k+'='+encodeURIComponent(b[k])).join('&'),auth:true,ok:j=>Array.isArray(j.candles)&&j.candles.length>0}:{q:'/v1/candles?'+['ativo','sub','intervalo','de','ate','revista'].filter(k=>b[k]!=null&&b[k]!=='').map(k=>k+'='+encodeURIComponent(b[k])).join('&'),ok:j=>Array.isArray(j.candles)},
  macro:b=>b.modo==='diag'?null:{q:'/v1/macro?modo='+encodeURIComponent(b.modo||'')+'&aba='+encodeURIComponent(b.aba||'')+'&semana='+encodeURIComponent(b.semana??''),ok:j=>j&&!j.error},
  ewz:b=>b.acao&&b.acao!=='agora'?null:{q:'/v1/ewz?venc='+encodeURIComponent(b.venc||''),ok:j=>j&&j.spot&&j.vol&&j.vol.nHist>=20}
 };
 if(typeof w.fetch==='function'&&!w.fetch.__v891){
  const nativo=w.fetch.bind(w);
  const novo=async function(input,init){
   try{
    const url=typeof input==='string'?input:input?.url||'',m=/\/functions\/v1\/(precos|candles|macro|ewz)$/.exec(url);
    if(m&&String(init?.method||'').toUpperCase()==='POST'&&!w.DIARIO_DEMO){
     const r0=rotas836[m[1]](JSON.parse(init.body||'{}'));
     if(r0){
      if(r0.auth&&typeof tok==='function')await tok().catch(()=>{});
      const token=r0.auth&&(typeof SESS!=='undefined'&&SESS?.at);
      if(r0.auth&&!token)throw Error('sessao_necessaria');
      const r=await nativo(base+r0.q,{credentials:'omit',mode:'cors',...(r0.auth?{headers:{Authorization:'Bearer '+token}}:{}),signal:init.signal||AbortSignal.timeout(20000)});
      if(r.ok){const j=await r.json();if(r0.ok(j))return new Response(JSON.stringify(j),{status:200,headers:{'Content-Type':'application/json'}});}
     }
    }
   }catch(e){if(e&&e.name==='AbortError'&&init?.signal?.aborted)throw e;}
   return nativo(input,init);
  };
  novo.__v891=1;w.fetch=novo;
 }
 w.DiarioPublico=Object.freeze({get,remember,read,adrs,inspect:()=>({pending:pending.size,cached:[...memory.keys()]})});
})(typeof window!=='undefined'?window:globalThis);
