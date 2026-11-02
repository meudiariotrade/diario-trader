/* Pesquisa aprofundada dentro da ficha existente. Anotações e premissas permanecem no estado sincronizado. */
(() => {
 'use strict';
 const A=window.AdvancedResearch,M=window.TerminalResearchModel,R=()=>window.TerminalResearch,safe=v=>esc(String(v??'')),fmt=(v,d=2)=>M.finite(v)?v.toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
 const table=(head,rows)=>`<div class="rs-table" tabindex="0" role="region" aria-label="Pesquisa aprofundada"><table><thead><tr>${head.map(h=>`<th scope="col">${safe(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map((v,i)=>`<${i?'td':'th scope="row"'}>${v}</${i?'td':'th'}>`).join('')+'</tr>').join('')}</tbody></table></div>`;
 const note=t=>`<p class="rs-note">${safe(t)}</p>`,section=(title,body,open=false)=>`<details class="rs-section ra-section"${open?' open':''}><summary>${safe(title)}</summary>${body}</details>`;
 const button=(action,label,attributes='')=>`<button type="button" class="rs-button" data-rs="${action}" ${attributes}>${safe(label)}</button>`;
 function input(label,name,value,type='text'){return `<label>${safe(label)}<input name="${name}" type="${type}" value="${safe(value??'')}"${type==='number'?' step="any"':''}></label>`}
 function store(){S.ax??={};return S.ax.researchAdvanced??={assets:{},exposures:{}}}
 function assetData(ticker){return store().assets?.[ticker]||{observations:[],notes:[]}}
 function update(ticker,data){const s=store();s.assets??={};s.assets[ticker]={...assetData(ticker),...data};save()}
 function date(){return loc().slice(0,10)}
 function httpUrl(v,required=false){if(!v&&!required)return '';try{const u=new URL(v);if(u.protocol==='https:')return u.href}catch{}throw Error('Use um link de fonte válido começando com https://.')}
 function currentClass(ticker){try{return pfCalc().pos.find(p=>p.tk===ticker)?.cl||window.PFX?.classifica?.(ticker)?.cl||'acao'}catch{return 'acao'}}
 function onFund(ticker,data){const f=M.fundamental(ticker,data),old=assetData(ticker);if(!f.queried||!Object.values(f.metric).some(M.finite))return;update(ticker,{observations:A.observe(old.observations,f,date())})}
 function compact(v){return M.finite(v)?v.toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:2}):'—'}
 function miniChart(rows,key,label){
  const values=rows.filter(r=>M.finite(r[key]));if(values.length<2)return note('Sem duas observações válidas para '+label.toLowerCase()+'.');
  const lo=Math.min(...values.map(r=>r[key])),hi=Math.max(...values.map(r=>r[key])),span=hi-lo||1,X=i=>48+i/(values.length-1)*580,Y=v=>135-(v-lo)/span*95;
  return `<figure class="rs-chart"><figcaption>${safe(label)}</figcaption><svg viewBox="0 0 680 180" role="img" aria-label="${safe(label)}"><title>${safe(label)}</title><path d="${values.map((r,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(r[key]).toFixed(1)).join(' ')}"/><text x="4" y="40">${safe(compact(hi))}</text><text x="4" y="138">${safe(compact(lo))}</text><text x="48" y="165">${safe(values[0].date)}</text><text x="628" y="165" text-anchor="end">${safe(values.at(-1).date)}</text></svg></figure>`;
 }
 function history(ticker,raw){const rows=A.history(raw),observations=assetData(ticker).observations||[];
  const current=M.fundamental(ticker,raw),historical=[['margin','Margem líquida anual (%)'],['roe','ROE anual (%)'],['leverage','Capitais de terceiros / PL anual (x)']];
  return section('Empresa contra o próprio histórico',historical.map(([key,label])=>miniChart(rows,key,label)).join('')+
   (rows.length?table(['Ano','Margem %','ROE %','CT / PL'],rows.map(r=>[safe(r.date),fmt(r.margin),fmt(r.roe),fmt(r.leverage)])):'')+
   note('Histórico contábil anual disponível, sem preencher anos ausentes. CT/PL não equivale a dívida líquida/EBITDA. ROE pode usar patrimônio médio ou de encerramento conforme a cobertura da fonte.')+
   `<h4>Múltiplos observados no aplicativo</h4>`+table(['Indicador','Atual','Mediana observada','Amostra'],[['pl','P/L'],['pvp','P/VP'],['ev','EV/EBITDA']].map(([key,label])=>{const valid=observations.map(r=>r.metric?.[key]).filter(v=>M.finite(v)&&v>0);return [safe(label),fmt(current.metric[key]),valid.length>=3?fmt(A.quantile(valid,.5)):'Amostra insuficiente',String(valid.length)]}))+
   note('As observações começam quando você atualiza a pesquisa. Guarda até 120 datas de consulta por ativo; não reconstrói múltiplos antigos usando o balanço atual. Consulta não equivale à data contábil.'));
 }
 function peers(ticker,raw){const result=A.peers(ticker,raw);return section('Comparação com o setor',table(['Indicador','Ativo','P25','Mediana','P75','N'],result.rows.map(r=>[safe(r.label),fmt(r.current),fmt(r.q25),fmt(r.median),fmt(r.q75),String(r.n)]))+note(result.source)+note('Estar abaixo da mediana não significa estar barato. Rentabilidade, crescimento, risco e diferenças entre indústrias precisam ser analisados.'))}
 function dividends(ticker,raw){if(!['acao','acao_ext','bdr'].includes(currentClass(ticker)))return section('Proventos e cobertura',note('O diagnóstico de lucro e caixa de companhias não é aplicado automaticamente a esta classe. Consulte os relatórios próprios do fundo ou emissor.'));
  const result=A.dividendQuality(raw);return section('Qualidade dos dividendos',result.checks.length?table(['Indicador','Valor','Leitura'],result.checks.map(r=>[safe(r.label),fmt(r.value)+(r.unit==='%'?'%':''),safe(r.message)]))+note(result.note)+note(result.recurring):note('Faltam payout e demonstrações de caixa. Nenhuma classificação de sustentabilidade foi estimada.'))}
 function changes(raw){const result=A.annualChanges(A.history(raw));return section('O que mudou nos resultados',result.from?note('Anos comparados: '+result.from+' → '+result.to)+table(['Métrica','Anterior','Recente','Variação'],result.rows.map(r=>[safe(r.label),fmt(r.before),fmt(r.after),r.change===null?safe(r.explanation):fmt(r.change)+' '+safe(r.unit)]))+note(result.reason):note(result.reason))}
 const exampleScenarios=[{name:'Conservador',growth:2,rate:14,terminal:2},{name:'Base',growth:5,rate:12,terminal:3},{name:'Otimista',growth:8,rate:10,terminal:3}];
 function valuation(ticker){const data=assetData(ticker).valuation,cfg=data?.input||{cash:'',years:5,scenarios:exampleScenarios},result=data?A.valuationScenarios(cfg):null;
  if(!['acao','acao_ext','bdr'].includes(currentClass(ticker)))return section('Valuation por cenários',note('Este modelo de FCFE por ação é destinado a ações de companhias; não é aplicado automaticamente a fundos, títulos ou cripto.'));
  return section('Valuation com premissas visíveis',note('Calculadora de fluxo de caixa livre ao acionista (FCFE) por ação. Informe um FCFE apurado após reinvestimento e financiamento líquido; lucro, dividendo e FCO não são usados como substitutos. Valores na moeda da ação. As taxas iniciais são exemplos editáveis, não estimativas da IA.')+
   `<form data-rsform="valuation"><div class="rs-controls">${input('FCFE anual base por ação','cash',cfg.cash,'number')}<label>Horizonte<select name="years"><option value="5"${+cfg.years===5?' selected':''}>5 anos</option><option value="10"${+cfg.years===10?' selected':''}>10 anos</option></select></label></div>`+
   cfg.scenarios.map((s,i)=>`<fieldset class="ra-scenario"><legend>${safe(s.name)}</legend><div class="rs-controls">${input('Crescimento anual (%)','growth_'+i,s.growth,'number')}${input('Custo do capital próprio (%)','rate_'+i,s.rate,'number')}${input('Crescimento terminal (%)','terminal_'+i,s.terminal,'number')}</div></fieldset>`).join('')+
   `<button type="submit" class="rs-button">Calcular e guardar premissas</button></form>`+
   (result?note('Premissas registradas por você em '+new Date(data.at).toLocaleString('pt-BR')+'. Não são dados oficiais do emissor.')+
    table(['Cenário','Valor por ação','Peso da perpetuidade'],result.rows.map(r=>[safe(r.name),r.result.available?fmt(r.result.value):safe(r.result.reason),r.result.available?fmt(r.result.terminalShare)+'%':'—']))+
    note('Faixa dos cenários válidos: '+fmt(result.min)+' a '+fmt(result.max)+'. Não representa preço-alvo, intervalo de confiança ou probabilidade de mercado.')+
    `<h4>Sensibilidade do cenário base</h4>`+table(['Custo de capital próprio','g terminal −1 p.p.','g terminal base','g terminal +1 p.p.'],A.valuationSensitivity({...cfg.scenarios[1],cash:cfg.cash,years:+cfg.years}).map(r=>[fmt(r.rate)+'%',...r.cells.map(c=>c.available?fmt(c.value):'Inválido')]))+
    note(result.rows[0]?.result.method||'Taxa terminal deve ser menor que o custo de capital próprio.'):'')
  );
 }
 function thesis(ticker){const data=assetData(ticker),notes=(data.notes||[]).slice().reverse();return section('Linha do tempo da sua tese',
  `<form data-rsform="thesis"><label>Expectativa ou ponto para acompanhar<textarea name="text" maxlength="3000" required placeholder="O que espero da empresa e o que faria revisar minha tese?"></textarea></label><div class="rs-controls">${input('Documento de referência (https://, opcional)','source','', 'url')}<label>Tipo<select name="kind"><option value="expectativa">Expectativa</option><option value="resultado">Resultado observado</option><option value="revisao">Revisão da tese</option></select></label><button type="submit" class="rs-button">Registrar sem substituir as anteriores</button></div></form>`+
  note('Cada anotação preserva texto, data, fonte e os indicadores carregados naquele momento. Seus registros fazem parte da sincronização e do backup do aplicativo.')+
  (notes.length?notes.map(n=>`<article class="rs-news"><small>${safe(new Date(n.at).toLocaleString('pt-BR'))} · ${safe(n.kind)}</small><p class="ra-thesis-text">${safe(n.text)}</p>${n.source?`<a href="${safe(/^https:\/\//.test(n.source)?n.source:'#')}" target="_blank" rel="noopener noreferrer">Documento de referência</a>`:''}<details><summary>Indicadores no momento do registro</summary>${table(['Indicador','Valor'],Object.entries(n.metric||{}).map(([key,v])=>[safe(M.fields.find(f=>f[0]===key)?.[1]||key),fmt(v)]))}${note('Consulta dos fundamentos: '+(n.queried||'não carregados')+'. Não é carimbo de divulgação contábil.')}</details></article>`).join(''):note('Nenhuma tese registrada para este ativo.')))}
 function assetSections(ticker,raw){return history(ticker,raw)+peers(ticker,raw)+dividends(ticker,raw)+changes(raw)+valuation(ticker)+thesis(ticker)}
 function exposureData(positions){return A.exposures(positions,store().exposures||{},Object.fromEntries(positions.map(a=>[a.tk,R().fund(a.tk)])))}
 function riskSections(positions){const x=exposureData(positions),configs=store().exposures||{};
  return section('Exposição por setor e composição indireta',table(['Setor ou cobertura','Valor BRL','Peso coberto','Posições'],x.sectors.map(r=>[safe(r.name),fmt(r.value),fmt(r.weight)+'%',safe(r.tickers.join(', '))]))+
   note('Valor com preço disponível: R$ '+fmt(x.total)+'. Sem preço: '+(x.missing.join(', ')||'nenhum')+'. Composição indireta detalhada: R$ '+fmt(x.detailed)+'.')+
   (x.themes.length?`<h4>Temas que podem se repetir na carteira</h4>`+table(['Tema pessoal','Peso das posições marcadas','Ativos'],x.themes.map(r=>[safe(r.name),fmt(r.weight)+'%',safe(r.tickers.join(', '))])):'')+note(x.method)+
   `<details><summary>Informar composição e temas</summary>`+note('Para fundos, ETFs ou empresas com segmentos, informe somente composição documentada. Percentuais devem somar até 100%; o restante ficará como não detalhado. O aplicativo não presume a carteira interna dos fundos.')+
   positions.map(p=>{const cfg=configs[p.k]||{};return `<form data-rsform="exposure" data-asset="${safe(p.k)}" class="ra-exposure"><h4>${safe(p.tk)}</h4><label>Temas pessoais, separados por vírgula<input name="themes" maxlength="350" value="${safe((cfg.themes||[]).join(', '))}" placeholder="Petróleo, juros, consumo"></label><label>Composição documentada: um setor e percentual por linha<textarea name="parts" placeholder="Financeiro;40\nEnergia;30">${safe((cfg.parts||[]).map(r=>r.bucket+';'+r.percent).join('\n'))}</textarea></label><div class="rs-controls">${input('Data da composição','ref',cfg.ref||'','date')}${input('Link da fonte (https://)','source',cfg.source||'','url')}<button type="submit" class="rs-button">Guardar composição e temas</button></div></form>`}).join('')+'</details>');
 }
 function submit(form){const kind=form.dataset.rsform;if(!['valuation','thesis','exposure'].includes(kind))return false;const values=Object.fromEntries(new FormData(form)),ticker=R().state.ticker,assetKey=form.dataset.asset;let failed=false;
  try{
   if(kind==='valuation'){
    const input={cash:M.num(values.cash),years:M.num(values.years),scenarios:exampleScenarios.map((s,i)=>({name:s.name,growth:M.num(values['growth_'+i]),rate:M.num(values['rate_'+i]),terminal:M.num(values['terminal_'+i])}))};
    const result=A.valuationScenarios(input);if(result.rows.some(r=>!r.result.available))throw Error(result.rows.find(r=>!r.result.available).result.reason);
    update(ticker,{valuation:{at:new Date().toISOString(),input}});R().state.message='Premissas e cenários guardados.';
   }
   if(kind==='thesis'){
    const text=values.text.trim(),source=httpUrl(values.source);if(text.length<3||text.length>3000)throw Error('Escreva de 3 a 3.000 caracteres.');
    const data=assetData(ticker);if((data.notes||[]).length>=200)throw Error('Limite de 200 anotações por ativo. Exporte o backup antes de reorganizar os registros.');const f=R().fund(ticker);
    const item={id:crypto.randomUUID(),at:new Date().toISOString(),kind:['expectativa','resultado','revisao'].includes(values.kind)?values.kind:'expectativa',text,source,metric:{...f.metric},queried:f.queried};
    update(ticker,{notes:[...(data.notes||[]),item]});R().state.message='Registro acrescentado à linha do tempo; as anotações anteriores foram preservadas.';
   }
   if(kind==='exposure'){
    const themes=[...new Set(values.themes.split(',').map(t=>t.trim()).filter(Boolean))];if(themes.length>8||themes.some(t=>t.length>40))throw Error('Use até 8 temas com no máximo 40 caracteres cada.');
    const parts=values.parts.split('\n').map(r=>r.trim()).filter(Boolean).map(row=>{const [bucket,percent,...extra]=row.split(';');const value=M.num(percent);if(!bucket?.trim()||bucket.length>60||!(value>0&&value<=100)||extra.length)throw Error('Composição: use Setor;Percentual, uma linha por setor.');return {bucket:bucket.trim(),percent:value}});
    if(parts.reduce((s,r)=>s+r.percent,0)>100+1e-8)throw Error('A composição não pode exceder 100%.');
    if(parts.length&&(!/^\d{4}-\d{2}-\d{2}$/.test(values.ref)||values.ref>date()||Number.isNaN(Date.parse(values.ref+'T12:00:00Z'))||new Date(values.ref+'T12:00:00Z').toISOString().slice(0,10)!==values.ref))throw Error('Informe uma data válida, até hoje, para a composição.');
    const source=httpUrl(values.source,parts.length>0),s=store();s.exposures??={};s.exposures[form.dataset.asset]={themes,parts,ref:values.ref,source,at:new Date().toISOString()};save();R().state.message='Composição e temas guardados. A cobertura permanece identificada.';
   }
  }catch(error){R().state.message=error.message;failed=true}
  R().paint();if(failed){const target=[...document.querySelectorAll('[data-rsform]')].find(f=>f.dataset.rsform===kind&&f.dataset.asset===assetKey);if(target)for(const element of target.elements)if(element.name in values)element.value=values[element.name]}return true;
 }
 function pdfData(ticker,raw){const data=assetData(ticker);return {history:A.history(raw),changes:A.annualChanges(A.history(raw)),peers:A.peers(ticker,raw),dividends:A.dividendQuality(raw),valuation:data.valuation?{...data.valuation,result:A.valuationScenarios(data.valuation.input)}:null,notes:data.notes||[],observations:data.observations||[],eligible:['acao','acao_ext','bdr'].includes(currentClass(ticker))}}
 document.addEventListener('click',event=>{
  const target=event.target.closest('[data-research-menu],[data-flow-menu]');if(!target)return;event.preventDefault();window.DIARIO_NAV.navigate('term');R().open(target.hasAttribute('data-flow-menu')?'fluxo':'ativo');
 });
 window.ResearchAdvanced={assetSections,riskSections,submit,onFund,pdfData,exposureData};
})();
