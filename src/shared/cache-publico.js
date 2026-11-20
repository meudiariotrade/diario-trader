/* Cache único de GETs públicos. Nunca aceita posições, tokens ou corpos personalizados.
 * Um consumidor cancelado não cancela os demais; último consumidor aborta a rede. */
(function(w){
 'use strict';if(w.DiarioPublico)return;
 const base='https://diario-trader.lucianosilva43567.workers.dev';
 const paths=new Set(['/v2/eventos','/v1/mercado','/v1/fluxo']);
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
  if(!paths.has(path))return Promise.reject(Error('Rota pública não permitida'));
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
 w.DiarioPublico=Object.freeze({get,remember,read,inspect:()=>({pending:pending.size,cached:[...memory.keys()]})});
})(typeof window!=='undefined'?window:globalThis);
