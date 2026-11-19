/* v793 — Saúde dos feeds: apenas leitura de caches existentes.
 * Sem fetch, polling, timers, Supabase, tokens, ordens ou dados privados.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioFeedSaude=api.create({contract:root.DiarioFeedContrato});
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 function create({contract,providers}={}){
  const byMarket=providers||{
   BR:[()=>root.DiarioProfitAnalises],
   US:[()=>root.DiarioFinnhubAnalises],
   CRYPTO:[()=>root.DiarioBinanceAnalises]
  };
  const guess=tk=>contract?.ticker?.(tk,'BR')?'BR':
   contract?.ticker?.(tk,'CRYPTO')?'CRYPTO':
   contract?.ticker?.(tk,'US')?'US':null;
  function assess(ticker,market=null,now=Date.now()){
   const m=market||guess(ticker),tk=contract?.ticker?.(ticker,m);
   if(!m||!tk)return {selected:null,reason:'Ticker/mercado não homologado',sources:0,market:m};
   const list=[];
   for(const entry of (byMarket[m]||[])){
    let provider=null;
    try{provider=typeof entry==='function'?entry():entry}catch{}
    if(!provider||typeof provider.get!=='function')continue;
    let q=null;try{q=provider.get(tk)}catch{}
    if(!q||q.ticker!==tk||q.market!==m)continue;
    const checked=contract.quote({market:m,ticker:tk,source:q.source,
     price:q.price,change_pct:q.change_pct??null,timestamp:q.timestamp},{now});
    if(checked.valid&&checked.market===m&&checked.ticker===tk)list.push(checked);
   }
   const picked=contract.choose(list,m,{ticker:tk,now});
   return {selected:picked.selected,reason:picked.reason,market:m,ticker:tk,
    sources:list.length,stale:!!picked.selected?.stale,
    quality:picked.selected?.quality||'INDISPONÍVEL',
    checkedAt:now};
  }
  const get=(ticker,market)=>assess(ticker,market).selected;
  return Object.freeze({get,assess,VERSION:'v793'});
 }
 return Object.freeze({create,VERSION:'v793'});
});
