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
 w.DiarioPublico=Object.freeze({get,peek:path=>memory.get(path)?.data||null,remember,read,adrs,inspect:()=>({pending:pending.size,cached:[...memory.keys()]})});
})(typeof window!=='undefined'?window:globalThis);


/* v1026 — leitura canônica dos ativos do painel. Reutiliza CQ/cqPf e a Cloudflare;
 * não cria conexões, timers, consultas Supabase ou preços sintéticos. */
(function(w){
 'use strict';
 if(w.DiarioMarketData)return;
 const specs=Object.freeze({
  '^BVSP':['idx','BMFBOVESPA:IBOV','IBOV'],
  'BRL=X':['fx','FX_IDC:USDBRL','USDBRL'],
  '^GSPC':['idx','SP:SPX','SPX'],
  '^IXIC':['idx','NASDAQ:IXIC','IXIC'],
  '^NDX':['idx','NASDAQ:NDX','NDX'],
  '^DJI':['idx','DJ:DJI','DJI'],
  '^N225':['idx','TVC:NI225','NI225'],
  '^GDAXI':['idx','XETR:DAX','DAX'],
  'DX-Y.NYB':['fx','TVC:DXY','DXY'],
  'ES=F':['fut','CME_MINI:ES1!','ES1!'],
  'NQ=F':['fut','CME_MINI:NQ1!','NQ1!'],
  'YM=F':['fut','CBOT_MINI:YM1!','YM1!'],
  'CL=F':['cmd','NYMEX:CL1!','CL1!'],
  'BZ=F':['cmd','ICEEUR:BRN1!','BRN1!'],
  'GC=F':['cmd','TVC:GOLD','GOLD'],
  'TIO=F':['cmd','SGX:FEF2!','FEF2!'],
  'DCE:I':['cmd','DCE:I1!','I1!'],
  'BTC-USD':['cri','BITSTAMP:BTCUSD','COINBASE:BTCUSD','BINANCE:BTCUSDT','BTCUSDT','BTCUSD'],
  'ETH-USD':['cri','BITSTAMP:ETHUSD','COINBASE:ETHUSD','BINANCE:ETHUSDT','ETHUSDT','ETHUSD'],
  'SOL-USD':['cri','COINBASE:SOLUSD','BINANCE:SOLUSDT','SOLUSDT','SOLUSD'],
  'XRP-USD':['cri','BITSTAMP:XRPUSD','BINANCE:XRPUSDT','XRPUSDT','XRPUSD'],
  'EWZ':['adr','AMEX:EWZ','EWZ'],
  'WIN':['fut','BMFBOVESPA:WIN1!','WIN1!','WINFUT'],
  'WDO':['fut','BMFBOVESPA:WDO1!','WDO1!','WDOFUT'],
  'USDZAR':['fx','FX:USDZAR','FX_IDC:USDZAR','USDZAR'],
  'USDMXN':['fx','FX:USDMXN','FX_IDC:USDMXN','USDMXN','MXN=X']
 });
 const aliases=new Map();
 for(const [k,arr] of Object.entries(specs)){aliases.set(k,k);for(const a of arr.slice(1))aliases.set(a,k);}
 aliases.set('USD/BRL','BRL=X');aliases.set('USD/ZAR','USDZAR');aliases.set('USD/MXN','USDMXN');
 const key=s=>{const k=String(s||'').trim().toUpperCase();return aliases.get(k)||(/^(?:BMFBOVESPA:)?[A-Z]{4}\d{1,2}$/.test(k)?k.replace(/^BMFBOVESPA:/,''):null);};
 const spec=k=>specs[k]||['br','BMFBOVESPA:'+k,k];
 const num=x=>x===null||x===undefined||x===''||typeof x==='boolean'?null:Number.isFinite(Number(x))?Number(x):null;
 const valid=q=>q&&num(q.px)>0&&!q.suspeito&&q.quoteStatus!=='divergente';
 const date=x=>{if(!x)return null;const t=typeof x==='number'?(x<1e11?x*1000:x):Date.parse(x);return Number.isFinite(t)&&t>0&&t<=Date.now()+60000?new Date(t).toISOString():null;};
 const brent=(q,d)=>{
  const p=num(q.fechamentoAnterior),at=date(q.horarioPreco||q.priceAt||q.dadoEm);
  const ref=q.quoteStatus==='referencia_anterior'&&at&&Date.now()-Date.parse(at)<=96*3600000;
  return /^ICEEUR:BRN[FGHJKMNQUVXZ]\d{4}$/.test(q.simboloFonte||'')&&(q.quoteStatus==='coerente'||ref)&&p>0&&d!==null&&Math.abs((Number(q.px)/p-1)*100-d)<=0.08?d:null;
 };
 // Um preço e seu percentual são sempre selecionados juntos, nunca em feeds distintos.
 function brentReserva(row){
  const snap=w.DiarioPublico?.peek?.('/v1/mercado');
  if(!snap||snap.desatualizado||snap.cacheOffline)return null;
  const rows=(snap.mercados?.grupos||[]).flatMap(g=>g.itens||[]);
  const candidates=rows.filter(r=>valid(r)&&(r.s==='BZ=F'||r.s==='ICEEUR:BRN1!')&&/^ICEEUR:BRN[FGHJKMNQUVXZ]\d{4}$/.test(r.simboloFonte||'')).map(r=>normal('BZ=F',r)).filter(q=>q&&q.d1!==null&&q.priceAt&&Date.now()-Date.parse(q.priceAt)<=96*3600000);
  const q=candidates.sort((a,b)=>Date.parse(b.priceAt)-Date.parse(a.priceAt))[0];
  if(!q)return null;
  // Se a lista já confirmou outro vencimento, não recuar para contrato diferente.
  if(/^ICEEUR:BRN[FGHJKMNQUVXZ]\d{4}$/.test(row?.simboloFonte||'')&&row.simboloFonte!==q.simboloFonte)return null;
  return q;
 }
 function normal(k,row,overlay=null){
  if(!valid(row)&&!valid(overlay))return null;
  if(row?.suspeito||row?.quoteStatus==='divergente')return null;
  const q=overlay&&valid(overlay)?overlay:row;
  if(!valid(q))return null;
  let d=num(q.d1??q.chg??q.chp), instrument=String(q.simboloFonte||row?.simboloFonte||row?.s||k);
  let fonte=q.fonte||q.source||row?.source||row?.fonte||'Referência pública';
  let basis=q.baseVariacao||null;
  if(overlay&&q===overlay){
   if(q.bnc){instrument='BINANCE:'+k.split('-')[0]+'USDT';fonte='Binance';basis='24h';}
   else if(q.fh){fonte='Finnhub';basis='fechamento anterior';}
   else if(!q.fonte&&!q.source){fonte='Profit';instrument=q.tk||instrument;basis='fechamento/ajuste anterior';}
  }
  if(k==='TIO=F'&&instrument!=='SGX:FEF2!')return null;
  if(k==='BZ=F')d=brent(q,d);
  const prev=num(q.fechamentoAnterior??q.previousClose??q.pc??q.fec);
  if(prev>0&&d!==null&&basis!=='24h'&&Math.abs((num(q.px)/prev-1)*100-d)>0.08)d=null;
  const at=date(q.horarioPreco||q.priceAt||q.dadoEm||q.em||q.ts);
  if(q.live===true&&(!at||Date.now()-Date.parse(at)>180000))return overlay&&q===overlay?normal(k,row):null;
  return Object.freeze({...row,...q,s:spec(k)[1]||row?.s||k,simboloFonte:instrument,px:num(q.px),d1:d,chg:d,fonte,source:fonte,baseVariacao:basis,fechamentoAnterior:prev,horarioPreco:at,priceAt:at,dadoEm:at,fechado:q.fechado===true,live:q.live===true&&!!at,quoteStatus:q.quoteStatus||(!at?'horario_nao_confirmado':null)});
 }
 function get(s){
  const k=key(s);if(!k||w.DIARIO_DEMO)return null;
  if(k==='EWZ'){try{const e=w.DiarioEwzCotacao?.();if(valid(e))return normal(k,{s:'AMEX:EWZ',...e});}catch{}}
  const [group,...symbols]=spec(k);
  try{
   const rows=typeof CQ!=='undefined'?CQ.d?.[group]?.itens||[]:[];
   const row=symbols.map(sym=>rows.find(r=>r.s===sym&&valid(r))).find(Boolean);
   if(row){
    let overlay=null;try{if(typeof cqPf==='function'&&k!=='TIO=F'&&k!=='BZ=F')overlay=cqPf(row,group);}catch{}
    const q=normal(k,row,overlay);
    if(k==='BZ=F'){const r=brentReserva(q||row);if(r&&(q?.d1==null||Date.parse(r.priceAt)>Date.parse(q.priceAt)))return r;}
    return q;
   }
  }catch{}
  if(k==='BZ=F'){const q=brentReserva(null);if(q)return q;}
  // Sem linha pública (inicialização), reutilizar também o overlay Profit do Research.
  if(group==='br'||k==='^BVSP'||k==='WIN'||k==='WDO'){try{const row={s:spec(k)[1],c:k==='^BVSP'?'IBOV':k};const overlay=typeof cqPf==='function'?cqPf(row,group):null;if(valid(overlay))return normal(k,row,overlay);}catch{}}
  // Binance já conectado pode preencher o par mesmo antes da primeira lista pública.
  if(group==='cri'){try{const c=k.split('-')[0],b=typeof bncQ==='function'?bncQ(c):null;if(b&&num(b.px)>0)return normal(k,{s:spec(k)[1],px:b.px},{px:b.px,d1:b.d1,bnc:true,live:true,em:b.em});}catch{}}
  // Reserva pública: apenas o símbolo explicitamente identificado, sem casar por nome.
  try{
   const snapshot=w.DiarioPublico?.peek?.('/v1/mercado');
   const rows=(snapshot?.mercados?.grupos||[]).flatMap(g=>g.itens||[]);
   const row=rows.find(r=>valid(r)&&(symbols.includes(r.s)||symbols.includes(r.simboloFonte)||(r.s===k&&!['BZ=F','CL=F','GC=F','ES=F','NQ=F','YM=F','BTC-USD','ETH-USD','SOL-USD','XRP-USD','TIO=F'].includes(k))));
   if(row)return normal(k,row);
  }catch{}
  // O ticker já possui referência pública própria durante a inicialização. Não usar
  // como substituto de contratos/cripto com base ou par desconhecidos.
  if(!['BZ=F','CL=F','GC=F','ES=F','NQ=F','YM=F','BTC-USD','ETH-USD','SOL-USD','XRP-USD','WIN','WDO','TIO=F'].includes(k)){
   try{const q=w.tapeDados?.()?.[k];if(valid(q))return normal(k,{s:spec(k)[1],...q});}catch{}
  }
  return null;
 }
 let pending=null;
 function refresh(){
  if(w.DIARIO_DEMO||typeof cqCarrega!=='function'||w.document?.hidden)return Promise.resolve([]);
  if(pending)return pending;
  pending=Promise.allSettled(['idx','fx','fut','cmd','cri','br'].map(g=>cqCarrega(g,false))).finally(()=>{pending=null;});
  return pending;
 }
 function snapshot(keys=Object.keys(specs)){
  const rows={};for(const k of keys){const q=get(k);if(q)rows[k]=q;}
  return Object.freeze({id:new Date().toISOString(),rows:Object.freeze(rows)});
 }
 w.DiarioMarketData=Object.freeze({get,has:s=>!!key(s),key,normal,refresh,snapshot});
})(typeof window!=='undefined'?window:globalThis);
