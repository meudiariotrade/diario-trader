/* v787 — contrato puro de dados públicos de mercado, sem rede/segredos.
 * Os conectores v788+ devem validar TODAS as fontes neste módulo antes de publicar.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioFeedContrato=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const SOURCES=Object.freeze({
  BR:['profit-local','cloudflare','tradingview'],
  US:['finnhub','cloudflare','tradingview'],
  CRYPTO:['binance','cloudflare','tradingview']
 });
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const timestamp=(value,asOf=Date.now())=>{
  const n=typeof value==='string'&&/^\d{10,13}$/.test(value)?Number(value):value;
  if(!finite(n))return null;
  const ms=n<1e11?n*1000:n;
  return Number.isSafeInteger(ms)&&ms>=946684800000&&ms<=asOf+60000?ms:null;
 };
 const ticker=(raw,market)=>{
  if(!['BR','US','CRYPTO'].includes(market))return null;
  let s=String(raw||'').trim().toUpperCase();
  if(market==='BR'){
   s=s.replace(/\.SA$/,'');
   return /^[A-Z]{4}\d{1,2}$|^(WIN|WDO|IND|DOL)(?:FUT|[FGHJKMNQUVXZ]\d{2})$/.test(s)?s:null;
  }
  if(market==='US')return /^[A-Z]{1,5}(?:[.-][A-Z])?$/.test(s)?s:null;
  s=s.replace(/[/_-]/g,'');
  return /^(?:[A-Z0-9]{2,12})(?:USDT|USD|BTC|ETH)$/.test(s)?s:null;
 };
 const limits=Object.freeze({BR:{'profit-local':20000,cloudflare:900000,tradingview:900000},
  US:{finnhub:60000,cloudflare:900000,tradingview:900000},
  CRYPTO:{binance:20000,cloudflare:900000,tradingview:900000}});
 function quote(input,opts={}){
  const market=String(input?.market||'').toUpperCase(),source=String(input?.source||'').toLowerCase();
  if(!SOURCES[market]?.includes(source))return {valid:false,reason:'provedor não autorizado'};
  const symbol=ticker(input.ticker,market);
  const now=finite(opts.now)?opts.now:Date.now();
  const time=timestamp(input.timestamp??input.t??input.updated_at_ms,now);
  const price=input.price,change=input.change_pct??null;
  if(!symbol||!finite(price)||price<=0||!time||
   (change!==null&&(!finite(change)||Math.abs(change)>1000)))
   return {valid:false,reason:'cotação sem ticker/preço/horário válido'};
  if(time>now+5000)return {valid:false,reason:'cotação com horário futuro'};
  const age=now-time,ttl=limits[market][source],stale=age>ttl;
  const delayed=source==='tradingview'||source==='cloudflare';
  return {valid:true,market,ticker:symbol,price,change_pct:change,
   timestamp:time,source,provider_latency_ms:age,stale,
   quality:stale?'ANTIGO':delayed?'INDICATIVO':'EM TEMPO REAL',
   isLive:!stale&&!delayed,ttl_ms:ttl,
   note:'Precisão e latência dependem do contrato do provedor; horário é do registro de origem.'};
 }
 function choose(quotes,market,opts={}){
  const permitted=SOURCES[market]||[],valid=(Array.isArray(quotes)?quotes:[]).map(q=>quote(q,opts))
   .filter(x=>x.valid&&x.market===market);
  if(!valid.length)return {selected:null,reason:'Sem cotação validada',alternatives:[]};
  const requested=opts.ticker?ticker(opts.ticker,market):null;
  const distinct=new Set(valid.map(x=>x.ticker));
  if(!requested&&distinct.size!==1)return {selected:null,reason:'Ativos diferentes: informar ticker alvo',alternatives:[]};
  const filtered=valid.filter(x=>x.ticker===(requested||valid[0].ticker));
  if(!filtered.length)return {selected:null,reason:'Sem cotação do ativo solicitado',alternatives:[]};
  filtered.sort((a,b)=>Number(a.stale)-Number(b.stale)||
   permitted.indexOf(a.source)-permitted.indexOf(b.source)||
   b.timestamp-a.timestamp);
  const selected=filtered[0],alternatives=filtered.slice(1);
  return {selected,alternatives,reason:selected.stale?'Apenas fechamento/último preço antigo disponível':
   'Fonte priorizada por mercado e recência; reserva segura'};
 }
 function candle(row){
  const r=Array.isArray(row)?{t:row[0],o:row[1],h:row[2],l:row[3],c:row[4],v:row[5]}:row;
  const t=timestamp(r?.t),o=r?.o,h=r?.h,l=r?.l,c=r?.c,v=r?.v;
  if(!t||![o,h,l,c,v].every(finite)||o<=0||l<=0||c<=0||h<Math.max(o,c,l)||l>Math.min(o,c,h)||v<0)
   return null;
  return {t,o,h,l,c,v};
 }
 function series(rows,{tf='1d',minBars}={}){
  if(!Array.isArray(rows)||rows.length>5000||!['1d','1h','15m'].includes(tf))
   return {valid:false,reason:'janela ou timeframe inválido',candles:[]};
  const map=new Map();
  for(const row of rows){const x=candle(row);if(!x)return {valid:false,reason:'OHLCV inconsistente',candles:[]};
   if(map.has(x.t))return {valid:false,reason:'candles duplicados',candles:[]};
   map.set(x.t,x);
  }
  const sorted=[...map.values()].sort((a,b)=>a.t-b.t);
  const minimum=Number.isInteger(minBars)?Math.max(1,minBars):tf==='1d'?400:250;
  return sorted.length<minimum?{valid:false,reason:'Histórico incompleto',candles:[]}:
   {valid:true,candles:sorted,from:sorted[0].t,to:sorted.at(-1).t,
    barCount:sorted.length,timeframe:tf};
 }
 return Object.freeze({VERSION:'v787',SOURCES,timestamp,ticker,quote,choose,candle,series});
});
