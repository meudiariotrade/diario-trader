/* v791 — Finnhub: adapter somente-leitura do WebSocket já mantido pelo PWA.
 * Sem chave/token no cliente, sem abrir nova conexão, sem polling ou Supabase.
 * Não usar "hora de atualização do cache" como horário de trade.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioFinnhubAnalises=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x)?x:
  typeof x==='string'&&/^-?\d+(?:\.\d+)?$/.test(x)?Number(x):null;
 const time=x=>typeof x==='number'&&Number.isFinite(x)?(x<1e11?x*1000:x):
  typeof x==='string'?Date.parse(x):null;
 function fromCache(ticker,cache,contract,now=Date.now()){
  const tk=contract?.ticker?.(ticker,'US');
  if(!tk||!contract?.quote)return null;
  const row=cache?.['FH:'+tk]||null;
  if(!row)return null;
  const price=finite(row.px??row.ult??row.c);
  // horarioPreco é o trade event-time do WS, diferente da atualização do cache.
  const timestamp=time(row.horarioPreco??row.tradeTimestamp??row.ts);
  if(!(price>0)||!Number.isFinite(timestamp))return null;
  const result=contract.quote({ticker:tk,market:'US',source:'finnhub',
   price,timestamp,change_pct:null},{now});
  return result.valid?result:null;
 }
 function get(ticker){
  const cache=root.TRM?.TR?.px;
  return fromCache(ticker,cache,root.DiarioFeedContrato);
 }
 return Object.freeze({VERSION:'v791',get,fromCache});
});
