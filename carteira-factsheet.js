/* Relatório de gestão inspirado no modelo do usuário. Desenho vetorial, sem candles. */
(function(root){
 'use strict';
 const num=(v,d=2)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'Não disponível',pct=v=>typeof v==='number'&&Number.isFinite(v)?num(v)+'%':'Não disponível',money=v=>typeof v==='number'&&Number.isFinite(v)?'R$ '+num(v):'Não disponível';
 async function pdf(input){
  const M=root.CarteiraFactsheetModel,R=root.CarteiraResearch,d=M.build(input),lib=await rpLib(),p=await rpNovo(lib,{titulo:'Relatório de Gestão de Carteira',cabecalho:'Gestão de carteira',data:d.asOf,tipo:'Factsheet patrimonial e análise fundamentalista',demo:!!input.demo});
  for(const [key,value]of Object.entries(root.TraderExportBrand?.PDF||{}))p.C[key]=p.hex(value);
  const C=p.C,oldPage=p.pg;let section='Gestão de carteira';
  p.add=()=>{p.pg=p.doc.addPage([p.W,p.H]);p.n++;p.y=66;p.rect(0,0,p.W,7,{fill:C.dk});p.t('DIÁRIO DE TRADER / GESTÃO DE CARTEIRA',p.M,26,{s:7,f:'b',c:C.ac});p.t(d.asOf,p.W-p.M,26,{s:7,c:C.mut,al:'r'});p.ln(p.M,44,p.W-p.M,44,{c:C.bd,w:.6})};
  const text=(v,{size=9,color=C.tx,font='r',gap=6}={})=>{for(const line of p.wrap(String(v??''),p.CW,size,font)){p.need(size*1.45+2);p.t(line,p.M,p.y,{s:size,f:font,c:color});p.y+=size*1.45}p.y+=gap};
  const note=v=>text(v,{size:7.3,color:C.mut,gap:8});
  const heading=(v,sub)=>{const lines=p.wrap(v,p.CW,15,'b');p.need(lines.length*21+45);p.y+=5;for(const line of lines){p.t(line,p.M,p.y,{s:15,f:'b',c:C.dk});p.y+=21}if(sub)note(sub)};
  const page=(title,sub,force=false)=>{section=title;if(force||p.y>p.BOT-260)p.add();heading(title,sub)};
  const table=(labels,rows,widths)=>p.tab(labels.map((l,i)=>({l,w:widths?.[i]||100/labels.length})),rows,{s:8});
  const empty=v=>{p.need(66);p.rect(p.M,p.y,p.CW,48,{fill:C.cz});const y=p.y;p.y+=10;text(v,{size:8.2,gap:4});p.y=Math.max(p.y,y+58)};
  function lineChart(series,title,caption){
   const data=series.filter(s=>s.points?.length>=2);heading(title);if(!data.length){empty('Série suficiente não disponível. O gráfico não foi estimado.');return}
   const h=174;p.need(h+58);const x=p.M+47,y=p.y+8,width=p.CW-58,values=data.flatMap(s=>s.points.map(r=>r.value)),lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||Math.max(Math.abs(hi)*.1,1),Y=v=>y+145-(v-lo)/span*132;
   data.forEach((s,j)=>{p.ln(p.M+j*148,p.y,p.M+12+j*148,p.y,{c:p.hex(s.color),w:2});p.t(s.name,p.M+18+j*148,p.y-4,{s:7,c:C.mut})});
   for(let i=0;i<4;i++){const v=lo+span*i/3;p.ln(x,Y(v),x+width,Y(v),{c:C.bd,w:.5});p.t(num(v,hi-lo<10?2:0),x-7,Y(v)-3,{s:7,c:C.mut,al:'r'})}
   for(const s of data)for(let i=1;i<s.points.length;i++){const X=j=>x+width*j/(s.points.length-1);p.ln(X(i-1),Y(s.points[i-1].value),X(i),Y(s.points[i].value),{c:p.hex(s.color),w:1.7})}
   const first=data[0].points;p.t(first[0].date,x,y+153,{s:7,c:C.mut});p.t(first.at(-1).date,x+width,y+153,{s:7,c:C.mut,al:'r'});p.y+=h+4;note(caption);
  }
  function bars(rows,title,{percent=false,label='value',benchmark=false}={}){
   heading(title);if(!rows.length){empty('Sem observações verificadas para este quadro.');return}rows=rows.slice(-12);p.need(210);const x=p.M+45,y=p.y+4,w=p.CW-55,h=135,vals=rows.flatMap(r=>[r[label],...(benchmark&&r.ib!=null?[r.ib]:[])]),low=Math.min(0,...vals),high=Math.max(0,...vals),span=high-low||1,Y=v=>y+(high-v)/span*h,step=w/rows.length;
   for(let i=0;i<4;i++){const v=low+span*i/3;p.ln(x,Y(v),x+w,Y(v),{c:C.bd,w:.5});p.t(num(v,percent?1:0)+(percent?'%':''),x-6,Y(v)-3,{s:7,c:C.mut,al:'r'})}
   rows.forEach((r,i)=>{const values=benchmark&&r.ib!=null?[[r[label],C.ac],[r.ib,C.dk]]:[[r[label],r[label]<0?C.r:C.ac]];values.forEach(([v,c],j)=>{const bw=step*.66/values.length;p.rect(x+i*step+step*.17+j*bw,Math.min(Y(v),Y(0)),Math.max(1,bw-1),Math.max(.5,Math.abs(Y(v)-Y(0))),{fill:c})});p.t(r.date.slice(2),x+(i+.5)*step,y+h+12,{s:6.5,c:C.mut,al:'c'})});p.y+=175;note(benchmark?'Verde: carteira. Azul-marinho: IBOV, quando há série completa na mesma janela.':'Valores registrados; ausência de lançamento não comprova ausência de recebimento.');
  }
  function horizontal(rows,title,valueText=v=>money(v)){
   heading(title);if(!rows.length){empty('Sem dados suficientes.');return}const max=Math.max(...rows.map(r=>Math.abs(r.value)),1);for(const r of rows){p.need(36);p.t(r.name||r.ticker||r.date,p.M,p.y,{s:8,f:'b',w:150});p.rect(p.M+155,p.y,210,9,{fill:C.cz});p.rect(p.M+155,p.y,210*Math.abs(r.value)/max,9,{fill:r.value<0?C.r:C.ac});p.t(valueText(r.value,r),p.W-p.M,p.y,{s:8,al:'r',c:C.tx});p.y+=25}p.y+=8;
  }
  function analysis(title,value){const rows=M.paragraphs(value);if(!rows.length)return;heading(title);for(const row of rows)text(row,{size:8.5,gap:5})}
  function advancedResearch(asset){
   const a=asset.advanced;if(!a)return;
   if(a.history?.length){heading('Histórico de rentabilidade e estrutura');table(['Ano','Margem líquida %','ROE %','CT/PL'],a.history.map(r=>[r.date,num(r.margin),num(r.roe),num(r.leverage)]),[16,28,28,28]);note('Indicadores anuais. CT/PL não equivale a dívida líquida/EBITDA. Lacunas não são preenchidas.');}
   if(a.peers?.rows?.some(r=>r.n>=3)){heading('Empresa diante da amostra setorial');table(['Indicador','Ativo','P25','Mediana','P75','N'],a.peers.rows.map(r=>[r.label,num(r.current),num(r.q25),num(r.median),num(r.q75),String(r.n)]),[30,15,15,15,15,10]);note(a.peers.source);}
   if(a.eligible&&a.dividends){heading('Qualidade dos dividendos');if(a.dividends.checks.length)table(['Indicador','Valor','Leitura'],a.dividends.checks.map(r=>[r.label,num(r.value)+(r.unit==='%'?'%':''),r.message]),[30,24,46]);else note('Payout e demonstrações de caixa insuficientes; sustentabilidade não classificada.');note(a.dividends.note);note(a.dividends.recurring);}
   if(a.changes?.from){heading('Mudanças entre '+a.changes.from+' e '+a.changes.to);table(['Métrica','Anterior','Recente','Variação'],a.changes.rows.map(r=>[r.label,num(r.before),num(r.after),r.change===null?r.explanation:num(r.change)+' '+r.unit]),[26,21,21,32]);note(a.changes.reason);}
   if(a.eligible&&a.valuation){heading('Valuation por premissas pessoais');const v=a.valuation;note('Cenários registrados pelo usuário em '+v.at+'. FCFE anual base por ação: '+num(v.input.cash)+'. Horizonte: '+v.input.years+' anos. Não é previsão ou preço-alvo.');table(['Cenário','Crescimento %','Capital próprio %','Terminal %','Valor/ação'],v.result.rows.map(r=>[r.name,num(r.growth),num(r.rate),num(r.terminal),r.result.available?num(r.result.value):'Inválido']),[24,19,19,19,19]);note(v.result.rows.find(r=>r.result.available)?.result.method||'Verificar premissas.');}
   if(a.notes?.length){heading('Linha do tempo da tese');for(const n of a.notes){text(n.at+' / '+n.kind,{font:'b',size:8});text(n.text);if(n.source)note('Fonte informada: '+n.source);note('Consulta dos indicadores no registro: '+(n.queried||'não carregados'));}}
  }
  // Capa: mesma linguagem editorial do modelo, com métricas identificadas.
  p.pg=oldPage;p.y=60;p.rect(0,0,p.W,12,{fill:C.dk});p.t('GESTÃO DE CARTEIRA / FACTSHEET',p.M,p.y,{s:8,f:'b',c:C.ac});p.y=112;
  text('Relatório de Gestão\nde Carteira',{size:29,font:'b',gap:16});text((input.demo?'EDIÇÃO DEMONSTRATIVA · DADOS FICTÍCIOS':'Análise de investimentos')+' | '+d.asOf,{size:12,font:'b'});note('Desempenho, composição, proventos, risco e pesquisa fundamentalista por ativo.');
  p.y+=12;const cards=[['VALOR DAS POSIÇÕES',d.partial?'Cobertura parcial':money(d.total)],['RETORNO NO MÊS',pct(d.perf.monthReturn)],['RETORNO NO HISTÓRICO',pct(d.perf.return)]];const cw=p.CW/3;
  cards.forEach(([name,value],i)=>{p.rect(p.M+i*cw,p.y,cw-5,66,{fill:C.dk});p.t(name,p.M+i*cw+9,p.y+12,{s:6.4,f:'b',c:C.wh});p.t(value,p.M+i*cw+9,p.y+34,{s:13,f:'b',c:C.wh,w:cw-23})});p.y+=83;
  if(d.perf.available)lineChart([{name:'Carteira · base 100',color:'#087c55',points:d.perf.rows.map(r=>({date:r.date,value:r.index}))},{name:'IBOV',color:'#0b1b2b',points:d.perf.ib},{name:'CDI',color:'#d89824',points:d.perf.cdi}],'Evolução e referências','Índice de retorno calculado pelo aplicativo, com fluxos e proventos registrados. Séries completas alinhadas às mesmas datas; não é auditoria de rentabilidade.');
  else lineChart([{name:'Valor dos ativos · BRL',color:'#087c55',points:d.wealth}],'Evolução patrimonial',d.wealthRecorded?'Registros diários disponíveis, somente BRL. Mudanças na composição afetam a curva. Não mede rentabilidade.':'Valor dos ativos, sem caixa. Aportes, vendas e câmbio afetam o saldo; não mede rentabilidade.');
  note(input.demo?'DADOS FICTÍCIOS. Material ilustrativo para validar o formato; não representa uma carteira real.':'Documento privado. Posições atuais na exportação; análises armazenadas podem ter datas diferentes.');
  if(!d.perf.available)note(d.perf.reason);if(d.partial)note('Sem preço ou câmbio válido para: '+d.missing.join(', ')+'. Valores de custo não foram usados como cotação.');
  page('01  Sumário executivo');
  text('A carteira reúne '+d.positions.length+' ativo(s). '+(d.partial?'A avaliação de mercado é parcial.':'O valor das posições com cotação é '+money(d.total)+'.')+' '+(d.top3!=null?'As três maiores posições representam '+pct(d.top3)+' do valor coberto.':''));
  if(d.perf.available)table(['Indicador','Carteira','IBOV','CDI'],[['Mês observado',pct(d.perf.monthReturn),pct(d.perf.monthly.at(-1)?.ib),pct(d.perf.monthly.at(-1)?.cdi)],['Histórico completo',pct(d.perf.return),pct(d.perf.ib.at(-1)?.value-100),pct(d.perf.cdi.at(-1)?.value-100)],['Janela',d.perf.from+' a '+d.perf.to,'Mesmas datas','Mesmas datas']],[28,30,21,21]);
  else empty('Retornos e comparações omitidos: faltam séries completas validadas. O saldo menos o custo não substitui rentabilidade.');
  bars(d.perf.monthly||[],'02  Desempenho por mês',{percent:true,benchmark:true});
  if(d.perf.available)note('Primeiro e último mês podem ser parciais. Janela efetivamente observada: '+d.perf.from+' a '+d.perf.to+'. Fonte: '+d.perf.source+'.');
  analysis('Leitura da análise consolidada',input.selected?.conteudo?.resumo_executivo||input.selected?.conteudo?.conclusao);
  page('03  Composição e diversificação',d.partial?'Pesos relativos somente às posições cobertas; não representam a carteira completa.':'Posições atuais na data de exportação; sem reconstrução de composição passada.');
  horizontal(d.sectors.slice(0,10),'Alocação por setor',(v,r)=>pct(r.weight));
  table(['Ativo','Classe / setor','Valor BRL','Peso coberto'],d.positions.map(a=>[a.position.tk,(a.position.setor||a.position.cl||'Não informado'),money(a.value),a.value!=null&&d.total>0?pct(a.value/d.total*100):'Indisponível']),[16,37,27,20]);
  note('Classificações são as cadastradas. Caixa não cadastrado não é presumido como posição de liquidez.');
  page('04  Resultado e proventos');
  horizontal(d.perf.contributions||[],'Contribuição financeira no histórico');note('Resultado por ativo da série calculada pelo aplicativo, em BRL, incluindo fluxos e proventos registrados. Não é atribuição percentual oficial nem peso atual multiplicado pelo retorno passado.');
  for(const unit of ['BRL','USD']){const rows=Object.entries(d.income.months).filter(([,v])=>v[unit]!==0).map(([date,v])=>({date,value:v[unit]}));if(rows.length){bars(rows,'Proventos recebidos · '+unit);table(['Mês','Recebido ('+unit+')'],rows.slice(-12).map(r=>[r.date,num(r.value)]),[40,60])}}
  if(!d.income.events.length)empty('Sem proventos lançados. Cadastre dividendos, JCP e rendimentos efetivamente recebidos.');
  page('05  Risco, governança e cenários');
  if(input.selected?.tipo!=='ativo'&&input.exposure){const x=input.exposure;heading('Exposição direta e composição informada');table(['Setor ou cobertura','Valor BRL','Peso coberto'],x.sectors.map(r=>[r.name,money(r.value),pct(r.weight)]),[48,27,25]);if(x.themes.length)table(['Tema pessoal','Ativos marcados','Peso das posições'],x.themes.map(r=>[r.name,r.tickers.join(', '),pct(r.weight)]),[35,40,25]);note(x.method);note('Composição interna detalhada: '+money(x.detailed)+'. Sem preço: '+(x.missing.join(', ')||'nenhum ativo')+'.');}

  table(['Métrica','Valor','Base de cálculo'],[['Volatilidade anualizada',pct(d.perf.vol),d.perf.n>=20?d.perf.n+' intervalos diários':'Exige ao menos 20 intervalos'],['Drawdown do índice de retorno',pct(d.perf.drawdown),'Queda desde o pico do histórico validado'],['Tracking error frente ao IBOV',pct(d.perf.tracking),'Diferenças diárias, anualização por 252'],['Maior posição',d.largest||'Não disponível',pct(d.largestWeight)+' do valor coberto'],['Três maiores posições',pct(d.top3),'Composição atual, não histórica']],[40,25,35]);
  analysis('Riscos apresentados pela IA',input.selected?.conteudo?.riscos);analysis('Cenários condicionais e acompanhamento',{hipoteses:input.selected?.conteudo?.hipoteses,monitorar:input.selected?.conteudo?.monitorar});
  const consolidated=input.selected?.tipo==='ativo'?{}:input.selected?.conteudo||{};
  for(const [key,value]of Object.entries(consolidated))if(!['resumo_executivo','conclusao','riscos','hipoteses','monitorar','identificacao'].includes(key))analysis(key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()),value);
  for(const a of d.positions){const position=a.position,report=a.report,meta={...a.meta,fs:{...(a.meta?.fs||{}),...(report?.dados?.fundamentos||{})}},detail=R.detail(position,input.ledger||[],d.asOf);page(position.tk+'  |  Pesquisa do ativo',(position.nome||a.meta?.nome||'')+' · '+(position.cl||'Classe não informada')+' · '+(position.moeda||detail.unit),true);
   table(['Posição','Valor','Fundamento','Indicador'],Array.from({length:Math.max(6,root.TraderReports.fundamentalRows(position,meta).length)},(_,i)=>{const holding=[['Quantidade',num(position.q,4)],['Cotação',position.tem?num(position.pa):'Sem cotação'],['Preço médio',num(position.pm,4)],['Valor BRL',money(a.value)],['Proventos do ciclo',num(detail.income)+' '+detail.unit],['Peso coberto',a.value!=null&&d.total>0?pct(a.value/d.total*100):'Indisponível']][i]||['',''];const f=root.TraderReports.fundamentalRows(position,meta)[i]||['',''];return [...holding,...f]}),[24,23,30,23]);
   note('Cotação: '+(position.pxEm||'sem data')+'. Referência contábil: '+(meta.fs.ref||meta.fs.data_referencia||'não informada')+'. Proventos do ciclo desde '+(detail.cycleStart||'não identificado')+'. Preço médio é cadastral; ajustes por renda são gerenciais.');
   const f=report?.dados?.fundamentos,annual=a.fundamental?.annual?.length?a.fundamental.annual.map(r=>({ano:r.date,receita:r.revenue,lucro:r.profit})):Array.isArray(f?.evolucao_receita_lucro)?f.evolucao_receita_lucro:[];if(annual.length)table(['Ano','Receita','Lucro líquido'],annual.map(r=>[String(r.ano),num(r.receita),num(r.lucro)]),[20,40,40]);
   if(a.fundamental?.annual?.length){
    const series=a.fundamental.annual;
    const W={p,heading:(title)=>heading(title),text:(value)=>note(value)};
    root.TraderReports.researchChart(W,series.map(r=>({date:r.date,value:r.revenue})),'Receita anual',a.fundamental.financialCurrency||'Moeda contábil não confirmada','bar');
    root.TraderReports.researchChart(W,series.map(r=>({date:r.date,value:r.profit})),'Lucro líquido anual',a.fundamental.financialCurrency||'Moeda contábil não confirmada','bar');
    note('Histórico das fontes de fundamentos do terminal. Consulta: '+(a.fundamental.queried||'não informada')+'. Períodos anuais, sem projeções.');
   }
   advancedResearch(a);
   const technical=root.TraderReports.study(a.technical?.L||[]);
   if(technical.available){heading('Leitura técnica · dados em '+technical.to);table(['Fechamento','MM20','MM50','MM200','Suporte 20d','Resistência 20d'],[[num(technical.last.c),num(technical.m20),num(technical.m50),num(technical.m200),num(technical.support),num(technical.resistance)]],[17,16,16,16,17,18]);note('Médias simples dos fechamentos e extremos das 20 sessões anteriores. Níveis mecânicos, sem probabilidade ou recomendação. Não há gráfico de candles neste documento.');}
   const contents=report?.conteudo||{};analysis('Análise fundamentalista',{analise_fundamentalista:contents.analise_fundamentalista,fundamentalista:contents.fundamentalista,fatos:contents.fatos});analysis('Tese e interpretação',contents.interpretacoes);analysis('Riscos e cenário',{riscos:contents.riscos,hipoteses:contents.hipoteses});analysis('Análise técnica e pontos de acompanhamento',{analise_tecnica:contents.analise_tecnica,monitorar:contents.monitorar});
   const shown=new Set(['identificacao','analise_fundamentalista','fundamentalista','fatos','interpretacoes','riscos','hipoteses','analise_tecnica','monitorar']);
   for(const [key,value]of Object.entries(contents))if(!shown.has(key))analysis(key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()),value);
   if(!report)empty('Análise individual ainda não registrada. Os indicadores disponíveis foram apresentados; nenhuma tese foi criada durante a exportação.');
   note('Análise: '+(report?.ref||'não registrada')+' · dados até '+(report?.dados_em||'não informado')+'. Fontes: '+(report?.fontes||[]).join(' · '));
  }
  page('06  Metodologia e cobertura');
  if(root.CarteiraCalculo){const audit=root.CarteiraCalculo.audit(input.ledger||[],d.asOf);heading('Conferência dos lançamentos');text(audit.issues.length?audit.issues.length+' pendência(s) nos registros. Confira os itens abaixo antes de interpretar resultados.':'Nenhuma inconsistência detectada pelas regras aritméticas desta conferência. Não equivale a auditoria fiscal ou conferência com extratos.');if(audit.issues.length)table(['Data','Ativo','Conferir'],audit.issues.map(i=>[i.date,i.ticker,i.message]),[18,18,64]);}
  text('Posições e movimentações vêm do cadastro da carteira. Valores em USD só são consolidados com câmbio válido. Indicadores e narrativas são os disponíveis no cache e nas análises armazenadas. Exportar não gera uma nova análise paga.');
  text('Retornos, volatilidade, drawdown e tracking error exigem histórico completo validado. As séries de referência são alinhadas à mesma janela. A qualidade depende das movimentações, preços e proventos informados. Dados ausentes não são zero e o custo não é usado como preço histórico.');
  text('A curva de registros diários é mostrada apenas quando aplicável e identificada como patrimônio, nunca como rentabilidade. Ausência de proventos lançados não demonstra ausência de dividendos recebidos. Indicadores de ações não são aplicados automaticamente a outras classes.');
  table(['Ativo','Cotação','Fundamentos','Análise IA'],d.positions.map(a=>[a.position.tk,a.position.tem?'Disponível':'Ausente',a.meta?.fs?'Parcial / verificar data':'Não disponível',a.report?'Registrada':'Não registrada']),[20,23,31,26]);
  note('Documento de acompanhamento pessoal. A IA pode conter erros e suas afirmações não equivalem a fatos auditados. Conferir fontes, datas e premissas antes de qualquer decisão.');
  const pages=p.doc.getPages();for(let i=0;i<pages.length;i++){p.pg=pages[i];p.ln(p.M,p.H-42,p.W-p.M,p.H-42,{c:C.bd,w:.6});p.t(input.demo?'DEMONSTRAÇÃO / DADOS FICTÍCIOS':'PRIVADO / DIÁRIO DE TRADER',p.M,p.H-29,{s:6.6,c:C.mut});p.t((i+1)+' / '+pages.length,p.W-p.M,p.H-29,{s:7,c:C.mut,al:'r'})}
  return p.doc.save();
 }
 root.CarteiraFactsheet={pdf};
})(typeof window==='undefined'?globalThis:window);
