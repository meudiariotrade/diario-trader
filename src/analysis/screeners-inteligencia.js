/* Diagnóstico dos Screeners: metodologias existentes, qualidade e limites, sem IA ou tráfego externo. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioScreenersInteligencia=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const weights={
  BR:[{id:'qualidade',name:'Qualidade',weight:30,fields:['roe','roic']},
      {id:'valuation',name:'Valuation',weight:30,fields:['pl','ev_ebitda','fcf_yield']},
      {id:'dividendos',name:'Dividendos',weight:25,fields:['dividend_yield','payout_implicito']},
      {id:'momentum',name:'Momentum',weight:15,fields:['momentum_12_1']}],
  US:[{id:'qualidade',name:'Crescimento e qualidade',weight:30,fields:['roic','roe','fcf_margin','eps_growth_yoy','revenue_growth_yoy']},
      {id:'valuation',name:'Valuation',weight:30,fields:['forward_pe','peg_ratio','ev_fcf']},
      {id:'momentum',name:'Momentum e tendência',weight:25,fields:['momentum_12_1','dist_mm200_pct']},
      {id:'retorno',name:'Retorno ao acionista',weight:15,fields:['dividend_yield','payout_implicito']}]
 };
 // Subtipos bancários/seguradores confirmados por classificação explícita ou razão social.
 // 'Finance' isolado inclui REITs/corretoras; não aplicar regra setorial sem evidência.
 function financialSubtype(row){
  if(!/^(finance|financeiro|financials|financial services)$/i.test(String(row?.setor||row?.sector||'').trim()))return false;
  const detail=String(row?.segmento||row?.industry||'')+' '+String(row?.empresa||row?.company_name||'');
  return /(?:\bbanc(?:o|os|orp)?\b|\bunibanco\b|\bbank(?:ing|s)?\b|\bsegur(?:o|os|adora|adoras|idade)?\b|\bresseguros?\b|\binsur(?:ance|er|ers)?\b|\bfinancial\s+holdings?\b|\bholdings?\s+financeiras?\b)/i.test(detail);
 }
 const financeWeights={
  BR:[{id:'qualidade',name:'Qualidade financeira',weight:30,fields:['roe']},
      {id:'valuation',name:'Valuation financeiro',weight:30,fields:['pl','pvp']},
      {id:'dividendos',name:'Dividendos',weight:25,fields:['dividend_yield','payout_implicito']},
      {id:'momentum',name:'Momentum',weight:15,fields:['momentum_12_1']}],
  US:[{id:'qualidade',name:'Qualidade financeira',weight:30,fields:['roe']},
      {id:'valuation',name:'Valuation financeiro',weight:30,fields:['forward_pe','pvp']},
      {id:'momentum',name:'Momentum e tendência',weight:25,fields:['momentum_12_1','dist_mm200_pct']},
      {id:'retorno',name:'Retorno ao acionista',weight:15,fields:['dividend_yield','payout_implicito']}]
 };
 const groupsFor=(m,row)=>financialSubtype(row)?financeWeights[m]:weights[m];
 const defs={
  roe:['ROE','%', 'Retorno sobre patrimônio; valores negativos exigem contexto'],
  roic:['ROIC','%', 'Retorno sobre capital investido'],
  pl:['P/L','x','Múltiplo histórico; não representa preço-alvo'],
  pvp:['P/VP','x','Preço sobre valor patrimonial. Em bancos, exigir período e fonte do patrimônio'],
  ev_ebitda:['EV/EBITDA','x','Múltiplo de valor da firma'],
  fcf_yield:['FCF Yield','%', 'Fluxo de caixa livre / valor de mercado'],
  dividend_yield:['Dividend Yield','%', 'Dividendo histórico; não garante pagamento futuro'],
  payout_implicito:['Payout','%', 'Parcela estimada do lucro distribuída'],
  momentum_12_1:['Momentum 12-1','%', 'Retorno de 12 meses excluindo o mês mais recente'],
  dist_mm200_pct:['Distância MM200','%','Variação do preço em relação à média móvel de 200 sessões'],
  revenue_growth_yoy:['Crescimento de receita','%','Variação de receita anual'],
  eps_growth_yoy:['Crescimento EPS','%', 'Variação anual de lucro por ação'],
  fcf_margin:['Margem de FCF','%', 'Fluxo de caixa livre / receita'],
  forward_pe:['Forward P/E','x','P/L projetado; estimativa sujeita a revisão'],
  peg_ratio:['PEG','x','Preço/lucro ajustado à taxa de crescimento'],
  ev_fcf:['EV/FCF','x','Valor da firma / fluxo de caixa livre'],
  short_interest_pct:['Short interest','%', 'Parcela vendida a descoberto; fonte pode estar indisponível'],
  total_shareholder_yield:['Total Yield','%', 'Dividendos mais recompras líquidas estimadas; recompra bruta não equivale a yield líquido'],
  buyback_yield:['Buyback Yield','%', 'Recompras sobre valor de mercado; conferir se é bruto ou líquido'],
  net_debt_ebitda:['Dívida líq./EBITDA','x','A dívida exige comparação com o setor']
 };
 const allRequired=(m,row)=>[...new Set(groupsFor(m,row).flatMap(g=>g.fields))];
 function isVal(v){return v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))}
 function value(row,k){if(!row)return null;const v=isVal(row[k])?Number(row[k]):null;
  if(k==='payout_implicito'&&(v===null||v===0)&&isVal(row.dividend_yield)&&Number(row.dividend_yield)>0&&isVal(row.pl)&&Number(row.pl)>0)
  return Number(row.dividend_yield)*Number(row.pl);
  return v}
 function clamp(n){return Math.max(0,Math.min(100,n))}
 function scale(v,lo,hi,inv=false){return v==null?null:(inv?100-clamp((v-lo)/(hi-lo)*100):clamp((v-lo)/(hi-lo)*100))}
 function avg(vs){const a=vs.filter(x=>x!==null);return a.length?a.reduce((a,b)=>a+b,0)/a.length:null}
 function item(m,row){
  const v=k=>value(row,k);
  if(financialSubtype(row)){
   if(m==='BR')return [
    scale(v('roe'),5,25),
    avg([scale(v('pl'),5,25,true),scale(v('pvp'),.6,3,true)]),
    avg([scale(v('dividend_yield'),0,12),
      v('payout_implicito')===null?null:(v('payout_implicito')>=20&&v('payout_implicito')<=80?90:25)]),
    scale(v('momentum_12_1'),-30,50)
   ];
   return [
    scale(v('roe'),5,25),
    avg([scale(v('forward_pe'),8,40,true),scale(v('pvp'),.6,3,true)]),
    avg([scale(v('momentum_12_1'),-30,50),scale(v('dist_mm200_pct'),-35,35)]),
    avg([scale(v('dividend_yield'),0,12),
      v('payout_implicito')===null?null:(v('payout_implicito')>=20&&v('payout_implicito')<=80?90:25)])
   ];
  }
  if(m==='BR')return [
   avg([scale(v('roe'),5,25),scale(v('roic'),5,22)]),
   avg([scale(v('pl'),5,25,true),scale(v('ev_ebitda'),4,18,true),scale(v('fcf_yield'),0,12)]),
   avg([scale(v('dividend_yield'),0,12),v('payout_implicito')===null?null:(v('payout_implicito')>=20&&v('payout_implicito')<=80?90:25)]),
   scale(v('momentum_12_1'),-30,50)
  ];
  return [
   avg([scale(v('roic'),5,22),scale(v('roe'),5,25),scale(v('fcf_margin'),0,30),scale(v('eps_growth_yoy'),-10,35),scale(v('revenue_growth_yoy'),-10,35)]),
   avg([scale(v('forward_pe'),8,40,true),scale(v('peg_ratio'),.7,3,true),scale(v('ev_fcf'),5,35,true)]),
   avg([scale(v('momentum_12_1'),-30,50),scale(v('dist_mm200_pct'),-35,35)]),
   avg([scale(v('dividend_yield'),0,12),v('payout_implicito')===null?null:(v('payout_implicito')>=0&&v('payout_implicito')<=80?90:25)])
  ];
 }
 function age(date,now=Date.now()){
  if(!date)return null;const d=Date.parse(date);return Number.isFinite(d)?Math.max(0,Math.floor((now-d)/86400000)):null;
 }
 function diagnostics(market,row,now=Date.now(),medians=null){
  const m=market==='US'?'US':'BR',groups=groupsFor(m,row),vs=item(m,row),all=allRequired(m,row);
  const parts=groups.map((g,i)=>({id:g.id,name:g.name,weight:g.weight,score:vs[i]===null?null:Math.round(vs[i]*10)/10,
    points:vs[i]===null?null:Math.round(vs[i]*g.weight/100*100)/100,
    covered:g.fields.filter(k=>value(row,k)!==null).length,total:g.fields.length,
    missing:g.fields.filter(k=>value(row,k)===null).map(k=>defs[k]?.[0]||k),
    metrics:g.fields.map(k=>({key:k,label:defs[k]?.[0]||k,unit:defs[k]?.[1]||'',number:value(row,k),note:defs[k]?.[2]||''}))}));
  const model=vs.every(x=>x!==null)?Math.round(vs.reduce((total,x,i)=>total+x*groups[i].weight/100,0)*100)/100:null;
  const key=m==='BR'?'score_quant_br':'score_quant_us',official=value(row,key);
  const eligible=all.filter(k=>value(row,k)!==null).length;
  const coverage=all.length?Math.round(eligible/all.length*100):0;
  const diff=official!==null&&model!==null?Math.abs(official-model):null;
  const oldFund=age(row?.sec_facts_at||row?.fundamentais_em,now);
  const version=financialSubtype(row)?(m==='BR'?'v2.1-fin':'us_v2.1-fin'):(m==='BR'?'v2.0':'us_v2.0');const expected=String(row?.score_model_version||'legado');
  const competence=row?.data_competencia_balanco||null;
  const oldTech=age(row?.tecnicos_em,now);
  const concerns=[],supports=[];
  if(official===null)concerns.push('Score indisponível: falta pelo menos um grupo de indicadores.');
  if(expected!==version)concerns.push('Modelo antigo ('+expected+'); aguardando recálculo '+version+'.');
  if(diff!==null&&diff>0.1)concerns.push('Score salvo diverge da fórmula '+version+' em '+diff.toFixed(2)+' ponto(s); recálculo necessário.');
  if(coverage<70)concerns.push('Cobertura dos critérios do score: '+coverage+'%; leitura ainda incompleta.');
  if(oldFund===null)concerns.push('Data de coleta dos fundamentos não identificada.');
  if(!competence)concerns.push('Competência contábil do balanço não validada na fonte primária.');
   const documentoConfirmado=!!(competence&&row?.documento_balanco_tipo&&row?.documento_balanco_id&&row?.documento_balanco_url&&row?.documento_balanco_publicado_em);
   if(!documentoConfirmado)concerns.push('Documento oficial SEC 10-K/10-Q ou CVM DFP/ITR não identificado.');
  if(oldFund!==null&&oldFund>180)concerns.push('Fundamentos com referência antiga: '+oldFund+' dias.');
  if(oldTech===null)concerns.push('Data de coleta dos indicadores técnicos não identificada.');
  if(oldTech!==null&&oldTech>10)concerns.push('Indicadores técnicos com referência antiga: '+oldTech+' dias.');
  if(value(row,'roe')!==null&&(value(row,'roe')<0||value(row,'roe')>80))concerns.push('ROE extremo/negativo: verificar patrimônio e eventos não recorrentes.');
  if(m==='US'&&value(row,'total_shareholder_yield')===null)concerns.push('Total Yield sem evidência suficiente de dividendos e recompras.');
  if(m==='BR'&&value(row,'dividend_yield')>0&&Number(row?.payout_implicito||0)===0&&value(row,'pl')>0)
   concerns.push('Payout estimado por Dividend Yield × P/L: confirmar proventos e lucro distribuível na DFP/ITR.');
  if(row?.dados_status==='catalogado')concerns.push('Ativo apenas catalogado: não há auditoria completa dos fundamentos.');
  for(const p of parts){
    if(p.score!==null&&p.score>=67&&p.covered>=1)supports.push(p.name+': '+p.points.toFixed(1)+' de '+p.weight+' pontos.');
    if(p.score!==null&&p.score<=35)concerns.push(p.name+' abaixo do centro da escala interna ('+Math.round(p.score)+'/100).');
  }
  const subtype=financialSubtype(row);
  // Financeiro: ausência de múltiplos inaplicáveis não penaliza; sem P/VP comprovado, score permanece exploratório.
  if(subtype&&value(row,'pvp')===null)concerns.push('P/VP financeiro ausente ou não verificado: classificação exploratória, sem homologação.');
  const verified=official!==null&&model!==null&&diff<=0.1&&expected===version&&coverage>=70&&documentoConfirmado&&
   (!subtype||value(row,'pvp')!==null)&&oldFund!==null&&oldFund<=180&&oldTech!==null&&oldTech<=10;
  const level=verified?'Cálculo confere':official!==null?'Exige conferência':'Incompleto';
  const med=(key)=>medians&&isVal(medians[key])?Number(medians[key]):null;
  const sector=String(row?.setor||row?.sector||'').toLowerCase();
  const signal=[];
  const roe=value(row,'roe'),roic=value(row,'roic'),pl=value(row,'pl'),dy=value(row,'dividend_yield'),momentum=value(row,'momentum_12_1');
  if(roic!==null&&med('roic')!==null)signal.push('ROIC de '+roic.toFixed(1)+'% ante mediana de '+med('roic').toFixed(1)+'%.');
  if(roe!==null&&med('roe')!==null)signal.push('ROE de '+roe.toFixed(1)+'% ante mediana de '+med('roe').toFixed(1)+'%.');
  if(dy!==null&&med('dy')!==null)signal.push('DY histórico de '+dy.toFixed(1)+'% ante mediana de '+med('dy').toFixed(1)+'%.');
  if(momentum!==null&&momentum<0)concerns.push('Momentum de '+momentum.toFixed(1)+'%: preço abaixo do patamar de 12 meses, excluindo o mês recente.');
  if(!subtype&&value(row,'div_liq_ebitda')>3)concerns.push('Dívida líquida/EBITDA acima de 3x: avaliar cronograma de amortização e ciclo do setor.');
  if(!subtype&&value(row,'net_debt_ebitda')>3)concerns.push('Dívida líquida/EBITDA acima de 3x: avaliar caixa e vencimentos.');
  if(value(row,'payout_implicito')>90)concerns.push('Payout estimado acima de 90%: sustentabilidade dos dividendos depende de geração de caixa.');
  const profile=roic!==null&&roic>=15&&((pl!==null&&pl<12)||(value(row,'forward_pe')!==null&&value(row,'forward_pe')<15))?'Perfil qualidade + múltiplos reduzidos':
    roic!==null&&roic>=15?'Perfil rentabilidade de capital':dy!==null&&dy>=5?'Perfil de distribuição de resultados':'Perfil quantitativo misto';
  const description=profile+(momentum!==null?(momentum>=0?'; tendência de preço positiva.':'; tendência de preço fraca.'):'; tendência ainda sem dados suficientes.');
  return {ticker:String(row?.ticker||''),company:String(row?.empresa||row?.company_name||row?.ticker||''),market:m,
    score:official,modelScore:model,difference:diff,validated:verified,level,modelVersion:expected,expectedVersion:version,
    competence,profile:description,
    coverage,parts,positives:[...signal,...supports].slice(0,3),risks:concerns.slice(0,6),
    missing:parts.flatMap(p=>p.missing),updated_at:row?.updated_at||null,
    fundamentals_at:row?.fundamentais_em||row?.sec_facts_at||null,
    technical_at:row?.tecnicos_em||null,
    source:String(row?.fonte_principal||'Fonte não informada'),
    sources:[row?.fonte_principal,row?.sec_source_url?'SEC/EDGAR':'',row?.finnhub_status==='verificado'?'Finnhub':''].filter(Boolean),
    interpretation:official===null?'Não é possível classificar esta empresa com o método completo.':
     official>=70?'O modelo atribui pontuação alta, mas isso não demonstra preço atrativo nem retorno futuro.':
     official>=45?'O resultado é intermediário: há fatores favoráveis e restrições que precisam ser analisados.':
     'O método atribui pontuação baixa aos indicadores disponíveis; não significa necessariamente que a ação cairá.'};
 }
 function methodology(m){return (weights[m==='US'?'US':'BR']).map(g=>g.name+' '+g.weight+'%').join(' • ')}
 return Object.freeze({diagnostics,methodology,weights,financeWeights,financialSubtype,groupsFor,definitions:defs,calculate:item,version:'v2.0'});
});
