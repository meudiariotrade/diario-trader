/* v800 — Validador de snapshots públicos por mercado.
 * Não acessa rede nem banco; evita armazenar payloads incompletos ou dados pessoais em cache público.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioSnapshotContrato=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const privateKey=/(?:^|_)(?:access_token|refresh_token|apikey|api_key|authorization|secret|user_id|auth_uid|email|cpf|telefone)(?:$|_)/i;
 function check(data,{market,etag}={}){
  const fail=reason=>({valid:false,reason,cacheable:false});
  if(!['BR','US'].includes(market)||!data||data.ok!==true||data.market!==market)
   return fail('Mercado/estado do snapshot incorreto');
  if(!Array.isArray(data.rows)||data.rows.length>300||
   (data.universe_rows!==undefined&&(!Array.isArray(data.universe_rows)||data.universe_rows.length>1500)))
   return fail('Universo ou quantidade de linhas não autorizados');
  if(data.universe_complete===true&&!Array.isArray(data.universe_rows))
   return fail('Universo declarado completo sem linhas');
  let bytes;
  try{bytes=JSON.stringify(data).length}catch{return fail('Payload não serializável')}
  if(bytes>1800000)return fail('Payload acima de 1,8 MB');
  const arrays=[data.rows,data.universe_rows||[],data.top10||[]];
  for(const row of [data,...arrays.flat()]){
   if(!row||typeof row!=='object'||Array.isArray(row))return fail('Linha pública malformada');
   if(Object.keys(row).some(k=>privateKey.test(k)))return fail('Campo privado no snapshot público');
  }
  for(const rows of arrays){
   const seen=new Set();
   for(const row of rows){
    if(row.ticker==null)continue;
    const ticker=String(row.ticker).toUpperCase();
    if(!/^[A-Z0-9.-]{1,14}$/.test(ticker))return fail('Ticker fora do contrato');
    if(seen.has(ticker))return fail('Ticker duplicado');
    seen.add(ticker);
   }
  }
  const updated=Date.parse(data.last_update||'');
  if(Number.isFinite(updated)&&updated>Date.now()+60000)
   return fail('Data futura no snapshot público');
  return {valid:true,cacheable:true,market,bytes,
   etagPresent:typeof etag==='string'&&etag.length>0,
   universeComplete:data.universe_complete===true,
   freshness:Number.isFinite(updated)?'datado':'sem data de coleta'};
 }
 return Object.freeze({VERSION:'v800',check});
});
