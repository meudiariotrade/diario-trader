/* Contas de pesquisa e cenários com períodos e premissas explícitos. Nenhuma decisão delegada à IA. */
(function(root){
 'use strict';
 const N=root.CarteiraCalculo.num,finite=v=>typeof v==='number'&&Number.isFinite(v),sum=a=>a.reduce((s,v)=>s+v,0),pct=(a,b)=>finite(a)&&finite(b)&&b!==0?a/b*100:null;
 function quantile(values,q){const a=values.map(N).filter(finite).sort((x,y)=>x-y);if(!a.length)return null;const p=(a.length-1)*q,i=Math.floor(p);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(p-i)}
 function history(raw={}){
  const source=raw.sec?.anos?.length?'SEC EDGAR':'Yahoo Finance',series=raw.sec?.anos?.length?raw.sec.anos:raw.balancos?.anos||[];
  const out=[];
  for(const r of series.slice().sort((a,b)=>+a.ano- +b.ano)){
   if(!Number.isInteger(+r.ano)||+r.ano<1900||+r.ano>2200)continue;
   const last=out.at(-1),profit=N(r.lucro_liquido),revenue=N(r.receita),equity=N(r.patrimonio),averageEquity=equity!==null?(last?.equity!==null&&last?.equity!==undefined&&+last.date===+r.ano-1?(equity+last.equity)/2:equity):null;
   out.push({date:String(r.ano),revenue,profit,equity,margin:N(r.rentabilidade?.margem_liquida_pct)??(revenue>0?pct(profit,revenue):null),roe:N(r.rentabilidade?.retorno_sobre_pl_pct)??(averageEquity>0?pct(profit,averageEquity):null),
    leverage:N(r.endividamento?.capitais_terceiros_sobre_pl),operatingCash:N(r.fco),freeCash:N(r.fco)!==null&&N(r.capex)!==null?N(r.fco)-Math.abs(N(r.capex)):null,source});
  }
  return out;
 }
 function annualChanges(rows=[]){
  if(rows.length<2)return {from:null,to:null,rows:[],reason:'São necessários dois períodos anuais comparáveis.'};
  const a=rows.at(-2),b=rows.at(-1);if(+b.date- +a.date!==1)return {rows:[],reason:'Os dois anos mais recentes não são consecutivos; comparação omitida.'};
  return {from:a.date,to:b.date,reason:'Comparação anual. Não representa a variação do último trimestre.',rows:[['revenue','Receita','%'],['profit','Lucro líquido','%'],['margin','Margem líquida','p.p.'],['roe','ROE','p.p.'],['leverage','Capitais de terceiros / PL','x'],['operatingCash','Caixa operacional','%']].map(([key,label,unit])=>{
   const before=N(a[key]),after=N(b[key]);let change=null,explanation='Sem dados comparáveis';
   if(before!==null&&after!==null){if(unit==='%'&&before<=0)explanation=key==='profit'&&before<0&&after>=0?'Reversão de prejuízo para lucro; percentual não calculado':'Base anterior não positiva; percentual não calculado';else{change=unit==='%'?(after/before-1)*100:after-before;explanation='Diferença entre os períodos indicados'}}
   return {key,label,unit,before,after,change,explanation};
  })};
 }
 function peers(ticker,raw={}){
  const issuer=t=>String(t||'').replace(/^.*:/,'').replace(/\.[A-Z]$/,'').replace(/\d+$/,''),seen=new Set([issuer(ticker)]),all=[];
  for(const p of raw.pares||[]){const id=issuer(p.s);if(!id||seen.has(id))continue;seen.add(id);all.push(p)}
  const current=root.TerminalResearchModel.fundamental(ticker,raw).metric;
  return {count:all.length,rows:[['pl','P/L','pl'],['pvp','P/VP','pvp'],['ev','EV/EBITDA','ev_ebitda'],['dy','Dividend yield (%)','dy'],['roe','ROE (%)','roe'],['margin','Margem líquida (%)','ml']].map(([key,label,field])=>{
   const values=all.map(p=>N(p[field])).filter(v=>v!==null&&(!['pl','pvp','ev'].includes(key)||v>0));return {key,label,current:current[key],n:values.length,min:values.length>=3?Math.min(...values):null,q25:values.length>=3?quantile(values,.25):null,median:values.length>=3?quantile(values,.5):null,q75:values.length>=3?quantile(values,.75):null,max:values.length>=3?Math.max(...values):null};
  }),source:'Amostra setorial retornada pelo serviço de fundamentos; classes do mesmo emissor agrupadas. Não cobre necessariamente todo o setor. Mínimo de 3 emissores válidos por indicador; múltiplos negativos excluídos. Datas contábeis podem diferir.'};
 }
 function dividendQuality(raw={}){
  const f=raw.yahoo?.numeros||{},p=raw.yahoo?.proventos||{},payout=N(p.payout),roe=N(f.roe),cash=N(f.caixa),debt=N(f.divida),fcf=N(f.fcl),ocf=N(f.fco),financial=!!raw.balancos?.banco||/financ|bank|banc|insur|segur/i.test(String(raw.tv?.sector||'')+' '+String(raw.tv?.industry||'')+' '+String(raw.yahoo?.perfil?.setor||''));
  const checks=[];
  if(payout!==null)checks.push({label:'Payout informado pela fonte',value:payout*100,unit:'%',message:payout<0?'Lucro-base negativo ou dado inconsistente; cobertura não inferida.':payout>1?'Distribuição supera o lucro-base informado. Verifique eventos extraordinários e o período.':'Distribuição dentro do lucro-base informado; isso não garante pagamentos futuros.'});
  if(!financial&&fcf!==null)checks.push({label:'Fluxo de caixa livre informado',value:fcf,unit:'moeda',message:fcf<0?'Caixa livre negativo na referência da fonte; investigar investimento, capital de giro e financiamento.':'Caixa livre positivo na referência da fonte. Sem o total distribuído no mesmo período, cobertura dos dividendos não é calculada.'});
  if(ocf!==null&&!financial)checks.push({label:'Caixa operacional informado',value:ocf,unit:'moeda',message:'Conferir o período na demonstração de fluxo de caixa.'});
  if(cash!==null&&debt!==null&&!financial)checks.push({label:'Dívida menos caixa informados',value:debt-cash,unit:'moeda',message:'Fotografia da estrutura de capital, sem relação causal automática com a distribuição.'});
  return {checks,financial,payout:payout!==null?payout*100:null,retention:payout!==null&&payout>=0&&payout<=1?100-payout*100:null,roe:roe!==null?roe*100:null,
   recurring:'Recorrente ou extraordinário: classificação não fornecida. Conferir deliberações e documentos oficiais. Proventos lançados na sua carteira não equivalem ao total distribuído pela companhia.',
   note:financial?'Instituição financeira: não se aplica o mesmo diagnóstico de caixa livre e dívida de empresas industriais.':'Caixa e dívida usam a moeda contábil da fonte, que pode diferir da moeda de negociação; não são convertidos nem consolidados aqui. Indicadores podem ter datas distintas. Não se divide dividendo estimado por caixa de período incompatível.'};
 }
 function valuation(input={}){
  const cash=N(input.cash),growth=N(input.growth),rate=N(input.rate),terminal=N(input.terminal),years=N(input.years);
  if(!(cash>0)||growth===null||growth<=-100||growth>100||!(rate>0&&rate<=100)||terminal===null||terminal<=-100||terminal>=rate||![5,10].includes(years))return {available:false,reason:'Informe FCFE por ação positivo, horizonte de 5 ou 10 anos e taxas válidas. A taxa terminal deve ser menor que o custo de capital próprio.'};
  const r=rate/100,g=growth/100,t=terminal/100,rows=[];let current=cash,pv=0;
  for(let year=1;year<=years;year++){current*=1+g;const discounted=current/(1+r)**year;pv+=discounted;rows.push({year,cash:current,discounted})}
  const terminalValue=current*(1+t)/(r-t),terminalPV=terminalValue/(1+r)**years,value=pv+terminalPV;
  if(!finite(value)||value<=0)return {available:false,reason:'As premissas produziram valor inválido.'};
  return {available:true,value,rows,terminalPV,terminalShare:terminalPV/value*100,input:{cash,growth,rate,terminal,years},method:'FCFE por ação descontado ao custo de capital próprio. Crescimento explícito constante e perpetuidade. Fluxo é após reinvestimento e financiamento líquido. Não usa FCO ou lucro como FCFE e não desconta dívida novamente.'};
 }
 function valuationScenarios(input){const rows=(input?.scenarios||[]).map(s=>({...s,result:valuation({...s,cash:input.cash,years:input.years})}));const valid=rows.filter(r=>r.result.available);return {rows,min:valid.length===rows.length&&rows.length?Math.min(...valid.map(r=>r.result.value)):null,max:valid.length===rows.length&&rows.length?Math.max(...valid.map(r=>r.result.value)):null};}
 function valuationSensitivity(input){return [-2,0,2].map(shift=>({rate:N(input.rate)+shift,cells:[-1,0,1].map(delta=>valuation({...input,rate:N(input.rate)+shift,terminal:N(input.terminal)+delta}))}))}
 function observe(observations,f,date,limit=120){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!f?.queried)return observations||[];
  const entry={date,queried:f.queried,metric:Object.fromEntries(Object.entries(f.metric).filter(([,v])=>finite(v))),source:f.origin};
  return [...(observations||[]).filter(r=>r.date!==date),entry].sort((a,b)=>a.date.localeCompare(b.date)).slice(-limit);
 }
 function exposures(positions,configs={},fundamentals={}){
  const valid=positions.filter(a=>a.tem&&N(a.v)!==null&&N(a.v)>=0).map(a=>({...a,v:N(a.v)})),missing=positions.filter(a=>!a.tem||N(a.v)===null).map(a=>a.tk),total=sum(valid.map(a=>a.v)),sectors=new Map,themes=new Map;let detailed=0;
  function add(map,name,value,ticker){const item=map.get(name)||{name,value:0,tickers:[]};item.value+=value;if(!item.tickers.includes(ticker))item.tickers.push(ticker);map.set(name,item)}
  for(const a of valid){const cfg=configs[a.k]||{},parts=Array.isArray(cfg.parts)?cfg.parts:[],weight=sum(parts.map(p=>N(p.percent)||0)),applicable=parts.length&&parts.every(p=>typeof p.bucket==='string'&&p.bucket.trim()&&N(p.percent)>0&&N(p.percent)<=100)&&weight>0&&weight<=100+1e-8&&/^\d{4}-\d{2}-\d{2}$/.test(cfg.ref||'')&&/^https:\/\//.test(cfg.source||'');
   if(applicable){for(const p of parts)if(p.bucket&&N(p.percent)>0){const v=a.v*p.percent/100;add(sectors,p.bucket,v,a.tk);detailed+=v}if(weight<100)add(sectors,'Composição não detalhada',a.v*(100-weight)/100,a.tk)}
   else add(sectors,['fii','etf','etf_ext'].includes(a.cl)?'Fundos sem composição informada':fundamentals[a.tk]?.sector||a.setor||'Setor não informado',a.v,a.tk);
   for(const theme of [...new Set(Array.isArray(cfg.themes)?cfg.themes:[])])add(themes,theme,a.v,a.tk);
  }
  const list=map=>[...map.values()].map(r=>({...r,weight:total>0?r.value/total*100:null})).sort((a,b)=>b.value-a.value);
  return {total,missing,sectors:list(sectors),themes:list(themes),detailed,method:'Composição informada substitui o agrupamento direto daquele ativo para evitar dupla contagem. Restante não detalhado fica explícito. Temas são marcações pessoais sobre a posição inteira e podem se sobrepor; não medem beta ou sensibilidade estatística.'};
 }
 function merge(a={},b={}){
  const pick=(x,y)=>{if(!x)return y;if(!y)return x;const tx=Date.parse(x.at||x.queried||'')||0,ty=Date.parse(y.at||y.queried||'')||0;return tx===ty?(JSON.stringify(x)>JSON.stringify(y)?x:y):tx>ty?x:y};
  const out={assets:{},exposures:{}};
  for(const key of new Set([...Object.keys(a.assets||{}),...Object.keys(b.assets||{})])){
   const x=a.assets?.[key]||{},y=b.assets?.[key]||{},notes=new Map,observations=new Map;
   for(const n of [...(x.notes||[]),...(y.notes||[])])if(n.id)notes.set(n.id,pick(notes.get(n.id),n));
   for(const o of [...(x.observations||[]),...(y.observations||[])])if(o.date)observations.set(o.date,pick(observations.get(o.date),o));
   out.assets[key]={...x,...y,notes:[...notes.values()].sort((n,m)=>String(n.at).localeCompare(String(m.at))||n.id.localeCompare(m.id)),observations:[...observations.values()].sort((n,m)=>n.date.localeCompare(m.date)).slice(-120)};
   const value=pick(x.valuation,y.valuation);if(value)out.assets[key].valuation=value;
  }
  for(const key of new Set([...Object.keys(a.exposures||{}),...Object.keys(b.exposures||{})]))out.exposures[key]=pick(a.exposures?.[key],b.exposures?.[key]);
  return out;
 }
 root.AdvancedResearch={quantile,history,annualChanges,peers,dividendQuality,valuation,valuationScenarios,valuationSensitivity,observe,exposures,merge};
})(typeof window==='undefined'?globalThis:window);
