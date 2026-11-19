/* v788 — fonte B3 Profit pela ponte local JÁ EXISTENTE.
 * Só lê snapshots em memória do PWA. Nunca abre socket, fetch ou Supabase,
 * não revela dados privados da Carteira e não cria timers.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioProfitAnalises=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const numeric=v=>typeof v==='number'&&Number.isFinite(v)?v:
  typeof v==='string'&&/^-?\d+(?:\.\d+)?$/.test(v)?Number(v):null;
 const isoTime=value=>{
  if(typeof value!=='string')return null;
  const n=Date.parse(value);
  return Number.isFinite(n)?n:null;
 };
 function normalizeEntry(row,key,contract,now=Date.now()){
  if(!contract?.quote||!row)return null;
  const ticker=String(row.tk||row.ticker||key||'').toUpperCase();
  if(ticker.startsWith('@'))return null; // alias @WIN já existe no cache, não ticker de emissor.
  const px=numeric(row.px??row.ult),change=numeric(row.d1??row.var),
   time=isoTime(row.em??row.updated_at);
  if(px===null||px<=0||!time)return null;
  const quote=contract.quote({market:'BR',source:'profit-local',ticker,price:px,
   change_pct:change,timestamp:time},{now});
  return quote.valid?quote:null;
 }
 function readFromCache(cache,contract,now=Date.now(),ticker=null){
  const live=cache?.pf||{},saved=cache?.saved||{};
  const selected=new Map();
  for(const [key,row]of Object.entries(saved)){
   const q=normalizeEntry(row,key,contract,now);
   if(q)selected.set(q.ticker,q);
  }
  for(const [key,row]of Object.entries(live)){
   const q=normalizeEntry(row,key,contract,now);
   if(q){const old=selected.get(q.ticker);if(!old||old.stale&&!q.stale||
    old.timestamp<q.timestamp)selected.set(q.ticker,q)}
  }
  if(ticker){
   const tk=contract?.ticker?.(ticker,'BR');
   return tk?selected.get(tk)||null:null;
  }
  return [...selected.values()].sort((a,b)=>a.ticker.localeCompare(b.ticker));
 }
 function get(ticker){
  // CQ pertence ao app já autenticado, em memória; nenhuma leitura extra de rede.
  const cache=typeof CQ!=='undefined'?CQ:root.CQ;
  return readFromCache(cache,root.DiarioFeedContrato,Date.now(),ticker);
 }
 return Object.freeze({VERSION:'v788',normalizeEntry,readFromCache,get});
});
