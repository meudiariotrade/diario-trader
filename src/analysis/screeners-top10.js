/* Top 10 de empresas: ranking por score reconstituído, sem misturar notas incompletas. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioScreenersTop10=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 function generate(m,rows,intelligence){
  const market=m==='us'||m==='US'?'US':'BR';
  if(!Array.isArray(rows)||!intelligence)return {market,entries:[],reviewed:0,excluded:0};
  const seen=new Set(),eligible=[],rejected=[];
  for(const row of rows){
   if(!row?.ticker)continue;
   const d=intelligence.diagnostics(market,row);
   // Evita promover microcaps ilíquidas e valores negativos em múltiplos.
   // Tickers fora desse corte continuam disponíveis no Screener completo.
   const liquidity=market==='BR'?Number(row.liquidez_diaria_brl):Number(row.avg_daily_volume_usd);
   const liquid=Number.isFinite(liquidity)&&liquidity>=(market==='BR'?1000000:2000000);
   const sane=(market==='BR'?
      (row.pl==null||Number(row.pl)>0)&&(row.ev_ebitda==null||Number(row.ev_ebitda)>0)&&
      (row.fcf_yield==null||Number(row.fcf_yield)>=0)&&(row.dividend_yield==null||Number(row.dividend_yield)<=20):
      (row.forward_pe==null||Number(row.forward_pe)>0)&&
      (row.ev_fcf==null||Number(row.ev_fcf)>0)&&
      (row.total_shareholder_yield==null||Number(row.total_shareholder_yield)<=20));
   // Nota só existe se quatro famílias e dados forem conferíveis.
   if(!liquid||!sane||d.modelScore===null||d.score===null||d.difference===null||d.difference>1||
      d.coverage<70||!d.validated){
    rejected.push({ticker:row.ticker,reason:d.risks[0]||'Cálculo não conferido'});
    continue;
   }
   eligible.push({row,diagnosis:d,score:d.modelScore,note:Math.round(d.modelScore)/10});
  }
  // A mesma empresa não pode aparecer duas vezes por ações ON e PN.
  eligible.sort((a,b)=>b.score-a.score||b.diagnosis.coverage-a.diagnosis.coverage||
    a.row.ticker.localeCompare(b.row.ticker));
  const entries=[];
  for(const x of eligible){
   const issuer=market==='BR'?String(x.row.ticker).slice(0,4):
     String(x.row.company_name||x.row.ticker).toUpperCase().replace(/\b(CLASS|INC|CORP|CORPORATION|LTD)\b.*$/,'').trim();
   if(seen.has(issuer))continue;
   seen.add(issuer);
   const groups=[...x.diagnosis.parts].filter(p=>p.points!==null)
      .sort((a,b)=>(b.points/b.weight)-(a.points/a.weight))
      .slice(0,2);
   const strengths=groups.map(p=>p.name+' '+(p.points/10).toLocaleString('pt-BR',{maximumFractionDigits:2})+'/'+
     (p.weight/10).toLocaleString('pt-BR',{maximumFractionDigits:1}));
   const caution=x.diagnosis.risks[0]||'Conferir preço, cenário e qualidade dos fundamentos';
   entries.push({...x,rank:entries.length+1,reason:strengths.join(' · '),caution});
   if(entries.length===10)break;
  }
  return {market,entries,reviewed:rows.length,excluded:rejected.length,reason:'Ranking por nota (score reconstituído ÷ 10); cobertura ≥70%, datas presentes e divergência ≤1 ponto. Liquidez diária mínima: BR R$ 1 milhão, EUA US$ 2 milhões; múltiplos positivos, FCF não negativo e DY até 20% na B3. Uma empresa por posição.'};
 }
 return Object.freeze({generate});
});
