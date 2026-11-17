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
   // Nota só existe se todas as famílias estiverem presentes e a fórmula coincidir.
   if(d.modelScore===null||d.score===null||d.difference===null||d.difference>1||
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
  return {market,entries,reviewed:rows.length,excluded:rejected.length,reason:'Ranking por nota (score reconstituído ÷ 10); cobertura ≥70%, quatro grupos calculáveis, datas presentes e divergência de score ≤1 ponto; apenas um ticker por companhia.'};
 }
 return Object.freeze({generate});
});
