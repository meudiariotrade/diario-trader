/* Top 10 de empresas: ranking por score reconstituído, sem misturar notas incompletas. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioScreenersTop10=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 // v786: filtro de provas auditáveis antes de classificar. Não consulta rede.
 function qualityGate(market,row,diagnosis,asOf=new Date().toISOString().slice(0,10)){
  const errors=[],date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
   !Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const curr=date(asOf)?asOf:new Date().toISOString().slice(0,10);
  const dated=['data_competencia_balanco','documento_balanco_publicado_em','fundamentais_em','tecnicos_em'];
  for(const k of dated)if(row?.[k]&&( !date(row[k])||row[k]>curr))errors.push(k+' futuro/inválido');
  if(date(row?.data_competencia_balanco)&&date(row?.documento_balanco_publicado_em)&&
   row.documento_balanco_publicado_em<row.data_competencia_balanco)
   errors.push('documento publicado antes da competência');
  const form=String(row?.documento_balanco_tipo||''),id=String(row?.documento_balanco_id||''),
   url=String(row?.documento_balanco_url||'');
  if(market==='US'){
   if(!/^(10-K|10-Q|20-F|40-F)(\/A)?$/.test(form)||!/^\d{10}-\d{2}-\d{6}$/.test(id)||
    !url.startsWith('https://www.sec.gov/Archives/edgar/data/'))
    errors.push('formulário e protocolo SEC não conferem');
  }else if(!['ITR','DFP'].includes(form)||!/^\d{1,18}$/.test(id)||
    !(url.startsWith('https://dados.cvm.gov.br/')||url.startsWith('https://www.rad.cvm.gov.br/')))
    errors.push('documento e protocolo CVM não conferem');
  if(diagnosis?.valuationEvidence?.required&&!diagnosis.valuationEvidence.complete)
   errors.push('documentos CVM insuficientes para as quatro fórmulas de preço justo');
  if(diagnosis?.lineageAudit&&(diagnosis.lineageAudit.missing?.length||
   diagnosis.lineageAudit.conflicts?.length))
   errors.push('linhagem dos indicadores incompleta');
  if(row?.dados_status==='catalogado'||row?.ativo_elegivel===false)
   errors.push('ativo não auditado ou inelegível');
  return {passed:errors.length===0,reasons:errors,asOf:curr};
 }

 function generate(m,rows,intelligence,medians=null){
  const market=m==='us'||m==='US'?'US':'BR';
  if(!Array.isArray(rows)||!intelligence)return {market,entries:[],reviewed:0,excluded:0};
  const seen=new Set(),eligible=[],rejected=[];
  for(const row of rows){
   if(!row?.ticker)continue;
   const d=intelligence.diagnostics(market,row,Date.now(),medians);
   const proof=qualityGate(market,row,d);
   // Evita promover microcaps ilíquidas e valores negativos em múltiplos.
   // Tickers fora desse corte continuam disponíveis no Screener completo.
   const liquidity=market==='BR'?Number(row.liquidez_diaria_brl):Number(row.avg_daily_volume_usd);
   const liquid=Number.isFinite(liquidity)&&liquidity>=(market==='BR'?1000000:2000000);
   const isFinance=intelligence.financialSubtype?.(row)===true;
   // Para bancos/seguradoras, EV/EBITDA, dívida/EBITDA e FCF genérico não têm o mesmo sentido.
   // Ainda exige preço/múltiplos saneados e proveniência para receber o selo de ranking.
   const sane=(market==='BR'?
      (row.pl==null||Number(row.pl)>0)&&(isFinance||(
      (row.ev_ebitda==null||Number(row.ev_ebitda)>0)&&
      (row.fcf_yield==null||Number(row.fcf_yield)>=0)))&&
      (row.dividend_yield==null||Number(row.dividend_yield)<=20):
      (row.forward_pe==null||Number(row.forward_pe)>0)&&
      (isFinance||row.ev_fcf==null||Number(row.ev_fcf)>0)&&
      (row.total_shareholder_yield==null||Number(row.total_shareholder_yield)<=20));
   // Nota só existe se quatro famílias e dados forem conferíveis.
   // v778: resultados suspeitos nunca entram no Top10 mesmo que a fórmula confira.
   // Nos EUA, exigir evidência mínima de Companyfacts SEC, sem chamar isso de score 100% auditado.
   if(!proof.passed||!liquid||!sane||d.modelScore===null||d.score===null||d.difference===null||d.difference>0.1||
      d.coverage<70||!d.validated||(d.qualityFlags?.length||0)>0||
      (market==='US'&&!d.secXbrlIdentificado)||row.ativo_elegivel===false){
    rejected.push({ticker:row.ticker,reason:proof.reasons[0]||d.risks[0]||'Cálculo não conferido'});
    continue;
   }
   eligible.push({row,diagnosis:d,score:d.modelScore,note:Math.round(d.modelScore)/10});
  }
  // Uma classe por emissor: primeiro escolher a mais líquida; depois ordenar as companhias pela nota.
  const byIssuer=new Map();
  for(const x of eligible){
   const issuer=String(x.row.identificador_emissor||
     (market==='BR'?String(x.row.ticker).slice(0,4):String(x.row.cik||x.row.company_name||x.row.ticker).toUpperCase()));
   const old=byIssuer.get(issuer);
   const liq=Number(market==='BR'?x.row.liquidez_diaria_brl:x.row.avg_daily_volume_usd)||0;
   const prev=old?(Number(market==='BR'?old.row.liquidez_diaria_brl:old.row.avg_daily_volume_usd)||0):0;
   if(!old||liq>prev||(liq===prev&&x.score>old.score))byIssuer.set(issuer,x);
  }
  const sorted=[...byIssuer.values()].sort((a,b)=>b.score-a.score||b.diagnosis.coverage-a.diagnosis.coverage||
    a.row.ticker.localeCompare(b.row.ticker));
  const entries=[];
  for(const x of sorted){
   const groups=[...x.diagnosis.parts].filter(p=>p.points!==null)
      .sort((a,b)=>(b.points/b.weight)-(a.points/a.weight))
      .slice(0,2);
   const strengths=groups.map(p=>p.name+' '+(p.points/10).toLocaleString('pt-BR',{maximumFractionDigits:2})+'/'+
     (p.weight/10).toLocaleString('pt-BR',{maximumFractionDigits:1}));
   const caution=x.diagnosis.risks[0]||'Conferir preço, cenário e qualidade dos fundamentos';
   entries.push({...x,rank:entries.length+1,reason:strengths.join(' · '),caution});
   if(entries.length===10)break;
  }
  return {market,entries,reviewed:rows.length,excluded:rejected.length,reason:'Ranking por nota reconstituída, liquidez e documentação oficial; EUA exige também Companyfacts SEC identificado. Provas XBRL são parciais e não homologam todos os múltiplos. Limites de liquidez: BR R$ 1 milhão, EUA US$ 2 milhões. Uma empresa por emissor.'};
 }
 return Object.freeze({generate,qualityGate});
});
