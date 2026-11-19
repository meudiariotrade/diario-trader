/* v794 — Auditoria determinística do OHLCV na borda do dispositivo.
 * Não efetua rede, não reescreve preço nominal e não homologa ajuste sem prova.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioHistoricoQualidade=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 function audit(payload,{ticker,market,tf='1d',now=Date.now(),contract}={}){
  const invalid=reason=>({valid:false,reason,adjustedCandles:null});
  if(!contract?.series||!contract?.ticker||!payload?.ok)
   return invalid('Contrato ou resposta pública indisponível');
  const tk=contract.ticker(ticker,market);
  if(!tk||payload.ticker!==tk||payload.market!==market||payload.tf!==tf)
   return invalid('Ticker, mercado ou timeframe divergente da consulta');
  if(typeof payload.source!=='string'||!payload.source.trim()||payload.source.length>150)
   return invalid('Provedor não identificado');
  const parsed=contract.series(payload.candles,{tf,minBars:tf==='1d'?400:250});
  if(!parsed.valid)return invalid(parsed.reason||'OHLCV inválido');
  const fetched=Date.parse(payload.fetchedAt||''),at=Date.parse(payload.as_of||'');
  if(!Number.isFinite(now)||!Number.isFinite(fetched)||!Number.isFinite(at)||
   fetched>now+60000||parsed.to>now+60000||Math.abs(parsed.to-at)>60000||
   parsed.to>fetched+60000)return invalid('Data de coleta, as_of ou candle inconsistente');
  const proof=Array.isArray(payload.adjustmentEvidence)?payload.adjustmentEvidence:[];
  const allowedDoc=/^https:\/\/(?:www\.)?(?:b3\.com\.br|cvm\.gov\.br|sec\.gov)\//i;
  const evidence=proof.length>0&&proof.length<=100&&proof.every(e=>e&&
   ['CVM','SEC','B3'].includes(e.provider)&&allowedDoc.test(String(e.document_url||''))&&
   /^\d{4}-\d{2}-\d{2}$/.test(String(e.exDate||''))&&Date.parse(e.exDate+'T00:00:00Z')<=now);
  let adjustedCandles=null;
  if(payload.adjustedVerified===true&&evidence&&Array.isArray(payload.adjustedCandles)){
   const adjusted=contract.series(payload.adjustedCandles,{tf,minBars:tf==='1d'?400:250});
   if(adjusted.valid&&adjusted.candles.length===parsed.candles.length&&
    adjusted.candles.every((x,i)=>x.t===parsed.candles[i].t))adjustedCandles=payload.adjustedCandles;
  }
  return {valid:true,market,ticker:tk,tf,barCount:parsed.barCount,source:payload.source,
   from:parsed.from,to:parsed.to,adjustedCandles,adjustedVerified:adjustedCandles!==null,
   reason:adjustedCandles?'Ajuste com documentos oficiais':'OHLCV nominal válido; ajuste não certificado'};
 }
 return Object.freeze({VERSION:'v794',audit});
});
