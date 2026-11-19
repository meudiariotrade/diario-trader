/* v795 — contrato local de dados corporativos licenciados: sem MCP/OAuth no navegador.
 * Dados Economatica são enriquecimento secundário, nunca snapshot público ou score oficial.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioFatosLicenciados=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const metrics=new Set(['roe','roic','pl','pvp','ev_ebitda','dividend_yield',
  'dpa_12m','lpa','vpa','revenue','netIncome','operatingCashFlow','totalAssets','totalDebt']);
 const units=new Set(['ratio','percent','BRL','USD','BRL/share','USD/share','shares']);
 const ymd=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&
  Number.isFinite(Date.parse(x+'T00:00:00Z'))&&
  new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
 function normalize(envelope,{ticker,asOf}={}){
  const fail=reason=>({accepted:false,scoreEligible:false,redistributionAllowed:false,reason,facts:[]});
  const max=typeof asOf==='string'?asOf:new Date().toISOString().slice(0,10);
  if(!ymd(max))return fail('Data as-of inválida');
  if(!envelope||envelope.provider!=='economatica'||envelope.scope!=='private'||
   envelope.entitlementVerified!==true)return fail('Credencial/licença interna não confirmada no gateway');
  const t=String(ticker||'').toUpperCase();
  if(!/^[A-Z]{4}\d{1,2}$|^[A-Z]{1,5}(?:\.[A-Z])?$/.test(t)||
   envelope.ticker!==t)return fail('Ticker divergente');
  if(!ymd(envelope.publishedAt)||envelope.publishedAt>max||
   !Array.isArray(envelope.facts)||!envelope.facts.length||envelope.facts.length>80)
   return fail('Competência, publicação ou quantidade de fatos inválida');
  const result=[],seen=new Set();
  for(const v of envelope.facts){
   const metric=v?.metric,unit=v?.unit,asDate=v?.periodEnd,
    value=v?.value;
   if(!metrics.has(metric)||!units.has(unit)||!ymd(asDate)||asDate>max||
    asDate>envelope.publishedAt||typeof value!=='number'||!Number.isFinite(value)||
    Math.abs(value)>1e18)return fail('Unidade, valor, indicador ou período inconsistente');
   const key=metric+'|'+unit+'|'+asDate;
   if(seen.has(key))return fail('Indicadores duplicados sem versão definida');
   seen.add(key);
   result.push({metric,unit,periodEnd:asDate,value});
  }
  return {accepted:true,scoreEligible:false,redistributionAllowed:false,
   status:'FONTE SECUNDÁRIA LICENCIADA — NÃO HOMOLOGADA',ticker:t,
   publishedAt:envelope.publishedAt,facts:result,
   reason:'Requer reconciliação com CVM/SEC e autorização contratual antes de publicar ou pontuar'};
 }
 return Object.freeze({VERSION:'v795',normalize});
});
