/* v801 — Gates de backtest, sem lookahead e sem alegação de ajuste certificado.
 * Dados provenientes do cliente são sempre tratados como exploratórios.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioBacktestGates=api;
})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const methods=['pisani','minervini','fibonaccing','elliott'];
 const EMPTY=reason=>Object.fromEntries(methods.map(key=>[key,{
  status:'não comprovado',reason,trades:0,winRate:null,payoff:null,expectancyR:null,
  confidence95:null,outOfSample:{trades:0,winRate:null,expectancyR:null}}]));
 function check(candles,{tf='1d',market,asOf,contract}={}){
  const failed=(reason,bars=0)=>({eligible:false,adjustedVerified:false,bars,reason});
  if(!contract?.series||!['BR','US','CRYPTO'].includes(market))return failed('Contrato/mercado inválido');
  const c=contract.series(candles,{tf,minBars:tf==='1d'?400:250});
  if(!c.valid)return failed(c.reason||'Histórico insuficiente');
  const date=asOf||new Date().toISOString().slice(0,10);
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||
   !Number.isFinite(Date.parse(date+'T00:00:00Z'))||
   new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
   return failed('Data de decisão inválida',c.barCount);
  const last=new Date(c.to).toISOString().slice(0,10);
  if(last>date)return failed('Candles posteriores à data de decisão (lookahead)',c.barCount);
  return {eligible:true,adjustedVerified:false,exploratory:true,
   bars:c.barCount,asOf:date,reason:'Backtest exploratório: eventos corporativos e custos reais ainda não homologados'};
 }
 const unavailable=(gate)=>({method:'walk-forward-next-open-v1',bars:gate.bars,
  setups:EMPTY(gate.reason),status:'não comprovado',gate});
 return Object.freeze({VERSION:'v801',check,unavailable});
});
