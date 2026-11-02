/* Relatórios vetoriais próprios; somente dados disponíveis, sem cenários inventados por IA. */
(() => {
  'use strict';
  const safe=v=>esc(String(v??'')),number=(v,d=2)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d}):'Não disponível';
  const first=(object,keys)=>{for(const key of keys)if(object?.[key]!=null&&object[key]!=='')return object[key];return null};
  const names={fatos:'Fatos apresentados na análise',interpretacoes:'Interpretações do modelo',hipoteses:'Hipóteses condicionais',riscos:'Riscos',conclusao:'Conclusão analítica',monitorar:'Pontos de acompanhamento',analise_tecnica:'Análise técnica',analise_fundamentalista:'Análise fundamentalista',resumo_executivo:'Resumo executivo',desempenho:'Desempenho',distribuicao:'Distribuição',concentracao:'Concentração',mudancas:'Mudanças desde a análise anterior'};
  const label=key=>names[key]||String(key).replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
  let running=false,cancel=false;
  function bars(input){return (input||[]).filter(row=>Array.isArray(row)&&row.length>=5&&Number.isFinite(row[0])&&Number.isFinite(new Date(row[0]*1000).getTime())&&row[2]>=row[3]&&row.slice(1,5).every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)).map(row=>({t:row[0],o:row[1],h:row[2],l:row[3],c:row[4]})).sort((a,b)=>a.t-b.t)}
  function study(input){
    const list=bars(input);if(list.length<30)return {available:false,reason:'Menos de 30 candles diários válidos no cache.'};
    const c=list.map(x=>x.c),last=list.at(-1),recent=list.slice(-21,-1),mean=n=>c.length>=n?c.slice(-n).reduce((a,b)=>a+b,0)/n:null;
    return {available:true,bars:list,last,from:new Date(list[0].t*1000).toISOString().slice(0,10),to:new Date(last.t*1000).toISOString().slice(0,10),m20:mean(20),m50:mean(50),m200:mean(200),support:Math.min(...recent.map(x=>x.l)),resistance:Math.max(...recent.map(x=>x.h))};
  }
  function weekly(input){
    const out=new Map;for(const bar of bars(input)){const date=new Date(bar.t*1000),offset=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-offset);const key=date.toISOString().slice(0,10),previous=out.get(key);if(previous){previous[2]=Math.max(previous[2],bar.h);previous[3]=Math.min(previous[3],bar.l);previous[4]=bar.c}else out.set(key,[bar.t,bar.o,bar.h,bar.l,bar.c])}return [...out.values()];
  }
  async function documentPdf(title,subtitle,reference){
    const lib=await rpLib(),p=await rpNovo(lib,{titulo:title,cabecalho:title,tipo:'Pesquisa e acompanhamento',data:reference||new Date().toLocaleDateString('pt-BR')});
    const write={p,lib};
    write.text=(value,options={})=>{if(value==null||value==='')return;const size=options.size||9.4,font=options.font||'r',height=size*1.48;for(const line of p.wrap(String(value),p.CW,size,font)){p.need(height+3);p.t(line,p.M,p.y,{s:size,f:font,c:options.color||p.C.tx});p.y+=height}p.y+=5};
    write.heading=(text,sub='')=>{const font=p.F.serif?'serif':'b',lines=p.wrap(String(text),p.CW,14,font);p.need(lines.length*20+65);p.y+=6;for(const line of lines){p.t(line,p.M,p.y,{s:14,f:font,c:p.C.dk});p.y+=20}if(sub)write.text(sub,{size:8.5,color:p.C.mut})};
    write.table=(headers,rows)=>{if(rows.length)p.tab(headers.map(([l,w,al])=>({l,w,al})),rows,{s:8.3});};
    write.section=(key,value,depth=0)=>{
      if(value==null||value===''||Array.isArray(value)&&!value.length)return;
      if(depth>5){write.text(JSON.stringify(value));return}
      write.heading(label(key));
      if(Array.isArray(value))value.forEach(item=>typeof item==='object'?Object.entries(item).forEach(([k,v])=>write.text(`${label(k)}: ${typeof v==='object'?JSON.stringify(v):v}`)):write.text('• '+item));
      else if(typeof value==='object')for(const [k,v] of Object.entries(value)){
        if(v&&typeof v==='object')write.section(k,v,depth+1);else if(v!=null)write.text(`${label(k)}: ${v}`);
      }
      else write.text(value);
    };
    p.rect(0,0,p.W,128,{fill:p.C.dk});p.t('DIÁRIO DE TRADER · PESQUISA',p.M,25,{s:9,f:'b',c:p.C.li});
    const titleLines=p.wrap(title,p.CW,27,p.F.serif?'serif':'b');titleLines.slice(0,2).forEach((line,i)=>p.t(line,p.M,48+i*30,{s:27,f:p.F.serif?'serif':'b',c:p.C.wh}));
    p.y=146;write.text(subtitle,{size:10,color:p.C.mut});write.text('Gerado em '+new Date().toLocaleString('pt-BR')+' · referência: '+(reference||'não informada'),{size:8,color:p.C.mut});
    write.finish=async()=>{
      const pages=p.doc.getPages();pages.forEach((page,index)=>{p.pg=page;p.ln(p.M,p.H-42,p.W-p.M,p.H-42,{c:p.C.bd,w:.5});p.t('Privado · Dados de terceiros e análise de IA podem conter erros. Confira fontes e referências.',p.M,p.H-32,{s:6.5,c:p.C.mut,w:p.CW-75});p.t(`${index+1} / ${pages.length}`,p.W-p.M,p.H-32,{s:7,f:'b',c:p.C.mut,al:'r'})});return p.doc.save();
    };
    return write;
  }
  function chart(writer,input,title,height=172){
    const p=writer.p,list=bars(input).slice(-50);p.need(height+82);writer.heading(title);
    if(list.length<5){writer.text('Sem série suficiente para exibir um gráfico. Nenhum traçado ilustrativo foi usado como dado.');return}
    p.need(height+30);const x=p.M,y=p.y,w=p.CW,right=52,top=8,bottom=25,low=Math.min(...list.map(b=>b.l)),high=Math.max(...list.map(b=>b.h)),range=high-low||1,step=(w-right-8)/list.length,Y=v=>y+top+(high-v)/range*(height-top-bottom);
    for(let i=0;i<4;i++){const value=low+range*i/3;p.ln(x,Y(value),x+w-right,Y(value),{c:p.C.bd,w:.4});p.t(number(value),x+w-right+5,Y(value)-3,{s:6.8,c:p.C.mut,w:right-6})}
    list.forEach((bar,index)=>{const X=x+step*(index+.5),color=bar.c>=bar.o?p.C.g:p.C.r;p.ln(X,Y(bar.h),X,Y(bar.l),{c:color,w:.7});p.rect(X-step*.28,Math.min(Y(bar.o),Y(bar.c)),Math.max(.7,step*.56),Math.max(.8,Math.abs(Y(bar.o)-Y(bar.c))),{fill:color})});
    const date=v=>new Date(v.t*1000).toISOString().slice(0,10);p.t(date(list[0]),x,y+height-14,{s:7,c:p.C.mut});p.t(date(list.at(-1)),x+w-right,y+height-14,{s:7,c:p.C.mut,al:'r'});p.y=y+height+8;
  }
  function fundamentalRows(asset,meta){
    const f=meta?.fs||{},common=[['P/L',['pl']],['P/VP',['pvp']],['Dividend yield (%)',['dy']],['ROE (%)',['roe']],['ROIC (%)',['roic']],['Margem líquida (%)',['margem_liquida','margemLiquida','mliq']],['Margem EBITDA (%)',['margem_ebitda','margemEbitda','mebitda']],['EV/EBITDA',['evebitda','ev_ebitda','evEbitda']],['Dívida líquida / EBITDA',['dl_ebitda','dividaLiquidaEbitda','divliq_ebitda']],['Crescimento de receita (%)',['cagr_receita','cagrReceita','crescimento_receita']]];
    if(asset.cl==='fii')return [['P/VP',number(first(f,['pvp']))],['Dividend yield (%)',number(first(f,['dy']))],['Vacância (%)',number(first(f,['vacancia']))],['FFO / cota',number(first(f,['ffo_cota','ffo']))],['Rendimento / cota',number(first(f,['rendimento_cota']))]];
    if(['etf','etf_ext'].includes(asset.cl))return [['Índice de referência',String(first(f,['benchmark','indice'])||'Não disponível')],['Taxa de administração (%)',number(first(f,['taxa_administracao','expenseRatio']))],['Patrimônio do fundo',number(first(f,['patrimonio','totalAssets']))],['Tracking error (%)',number(first(f,['trackingError']))]];
    if(['rf','tesouro','outro'].includes(asset.cl))return [['Critérios de ações', 'Não se aplicam automaticamente a esta classe.'],['Indexador, vencimento e risco do emissor','Consultar o cadastro e o documento do título.']];
    return common.map(([name,keys])=>[name,number(first(f,keys))]);
  }
  function portfolioInput(){
    const state=window.PF||{},selected=(state.rel||[]).find(r=>String(r.id)===String(state.rv)),snapshot=typeof pfCalc==='function'?pfCalc():{pos:[]};
    const meta=window.PFX?.META?.()||{};
    const positions=selected?.tipo==='ativo'?snapshot.pos.filter(p=>p.tk===selected.tk):snapshot.pos;
    const assets=positions.map(asset=>{let technical;try{technical=pfTec(asset)}catch{}return {position:asset,meta:meta[asset.tk]||{},technical,report:(state.rel||[]).find(row=>row.tipo==='ativo'&&row.tk===asset.tk)||null}});
    return {selected,snapshot,assets,generated:new Date().toISOString()};
  }
  async function portfolioPdf(input){
    const {selected,snapshot,assets}=input,w=await documentPdf(input.demo?'Carteira · demonstração':'Relatório da carteira','Visão consolidada e fichas individuais · fundamentos, técnica, riscos e rastreabilidade',selected?.ref||input.generated?.slice(0,10)),p=w.p;
    const missingPrice=assets.filter(a=>!a.position.tem),missingFx=assets.some(a=>a.position.moeda==='USD')&&!snapshot.fx;
    w.text('As posições são as cadastradas no momento da exportação. A análise selecionada e as análises individuais podem ter referências distintas, indicadas em cada ficha. Não representa a composição histórica de uma data anterior.',{size:8.5,color:p.C.mut});
    if(!missingFx)p.kpis([{l:'Valor calculado pelo app',v:'R$ '+number(snapshot.v)},{l:'Custo contabilizado',v:'R$ '+number(snapshot.c)},{l:'Diferença valor − custo',v:'R$ '+number(snapshot.res)},{l:'Ativos no relatório',v:String(assets.length)}],{cols:2,vs:16});
    else w.text('Consolidação em BRL indisponível: falta cotação de câmbio para posições em USD. Valores em moedas diferentes não foram somados.');
    w.text('A diferença entre valor e custo não é uma medida de retorno histórico total e não substitui cálculo de retorno com fluxos e proventos.');
    if(missingPrice.length)w.text('Atenção: sem cotação disponível para '+missingPrice.map(a=>a.position.tk).join(', ')+'. O aplicativo pode usar custo como referência de cálculo; não trate esse valor como preço de mercado.');
    w.heading('Cobertura dos dados');w.table([['Ativo',20],['Preço',18],['Fundamentos',22],['Técnica',18],['Análise IA',22]],assets.map(a=>[a.position.tk,a.position.tem?'Disponível':'Sem cotação',a.meta.fs?'Parcial / verificar data':'Não disponível',a.technical?.L?.length>=30?'Diário disponível':'Não disponível',a.report?'Registrada':'Não registrada']));
    if(selected?.conteudo&&selected.tipo!=='ativo'){w.heading('Análise consolidada selecionada',`Referência ${selected.ref||'não informada'} · dados até ${selected.dados_em||'não informado'}`);for(const [key,value] of Object.entries(selected.conteudo))w.section(key,value)}
    if(!assets.length)w.text('Nenhuma posição disponível para construir fichas individuais. Cadastre a carteira ou abra o relatório de um ativo.');
    for(const asset of assets){
      const a=asset.position;p.add();w.heading(`${a.tk} · ${a.nome||asset.meta.nome||'Ficha do ativo'}`,`${a.cl||'Classe não informada'} · ${a.moeda||'Moeda não informada'} · ${a.setor||'Setor não informado'}`);
      w.table([['Dado da posição',45],['Valor',55]],[['Quantidade',number(a.q,6)],['Preço médio cadastrado',number(a.pm)],['Preço usado no cálculo',a.tem?number(a.pa):'Sem cotação; referência de custo'],['Data da cotação',a.pxEm||'Não informada'],['Peso calculado (%)',missingFx?'Indisponível sem câmbio':number(a.peso)],['Resultado calculado em BRL',missingFx?'Indisponível':'R$ '+number(a.lu)]]);
      w.heading('Fundamentos e cobertura');w.table([['Indicador',55],['Valor informado',45]],fundamentalRows(a,asset.meta));
      w.text('Referência contábil: '+(first(asset.meta.fs,['ref','trimestre','data_referencia'])||'não informada pelo cache')+'. Indicadores ausentes não são zero. Métricas de ações não são aplicadas automaticamente a FIIs, ETFs ou renda fixa.',{size:8.2,color:p.C.mut});
      const tech=study(asset.technical?.L);
      if(tech.available){chart(w,asset.technical.L,'Leitura técnica · candles diários');w.table([['Referência técnica',55],['Valor',45]],[['Série utilizada',tech.from+' a '+tech.to],['Último fechamento da série',number(tech.last.c)],['Média de 20 sessões',number(tech.m20)],['Média de 50 sessões',number(tech.m50)],['Média de 200 sessões',number(tech.m200)],['Mínima das 20 sessões anteriores',number(tech.support)],['Máxima das 20 sessões anteriores',number(tech.resistance)],['RSI informado pelo módulo',number(asset.technical.rsi)]]);
        w.text('Essas faixas são referências mecânicas do histórico, não preço-alvo ou recomendação. Série diária e cotação da posição podem ter horários diferentes.');
      }else{w.heading('Leitura técnica');w.text(tech.reason+' Não foram criados gráficos ou níveis sem dados.')}
      if(asset.report){p.need(340);w.heading('Análise individual registrada',`Gerada ${asset.report.gerado||'sem data'} · referência ${asset.report.ref||'não informada'} · dados até ${asset.report.dados_em||'não informado'}`);for(const [key,value] of Object.entries(asset.report.conteudo||{}))if(key!=='identificacao')w.section(key,value);w.text('Fontes registradas: '+(asset.report.fontes||[]).join(' · '),{size:8.2});w.text(`Modelo: ${asset.report.modelo||'não informado'} · execução: ${asset.report.exec_id||'não informada'}`,{size:7.5,color:p.C.mut})}
      else w.text('Não há análise individual registrada para este ativo. Use a geração individual da carteira para completar a narrativa; a exportação não faz chamadas pagas automaticamente.');
    }
    w.heading('Método e limitações');w.text('Fontes: cadastro da carteira, cotações e indicadores já carregados no aplicativo, histórico diário e análises individuais armazenadas. Este documento organiza os dados disponíveis e não certifica sua exatidão ou atualidade. Não há valuation completo quando não há demonstrações, premissas ou projeções suficientes.');
    return w.finish();
  }
  function technicalFromCache(ticker){try{return window.TRM?.tec?.velas(ticker,'1d')?.L||[]}catch{return []}}
  async function weekendPdf(input){
    const w=await documentPdf(input.demo?'Revista · demonstração':'Revista do Pregão',input.demo?'EDIÇÃO DEMONSTRATIVA · séries e textos fictícios':'Estudos de fechamento e cenários condicionais para a próxima semana',input.ref),p=w.p;
    w.text('Leitura original do Diário de Trader. Não é uma edição, reprodução ou análise da Revista Timing. Não há probabilidade atribuída aos cenários.');
    w.heading('Roteiro da edição');w.text('1. Panorama e agenda\n2. Índice, dólar e Ibovespa\n3. Estudos de ações\n4. Quadro de cenários\n5. Plano e checklist da próxima sessão');
    if(input.edition?.em_poucas_linhas?.length)w.section('panorama_registrado',input.edition.em_poucas_linhas);
    else w.text('Panorama narrativo não carregado. Abra uma edição do Jornal do Pregão para incorporar seu resumo.');
    if(input.edition?.agenda?.length)w.table([['Quando',18],['País',15],['Evento',67]],input.edition.agenda.map(e=>[e.quando||'Não informado',e.pais||'Não informado',e.evento||'Não informado']));
    else w.text('Agenda futura não fornecida. Consulte a agenda econômica antes da próxima sessão; eventos da edição carregada podem se referir à semana anterior.');
    const scenarios=[];
    for(const asset of input.assets){p.add();w.heading(asset.ticker+' · estudo de mercado',input.demo?'DADOS ILUSTRATIVOS':'Histórico do cache do aplicativo; verifique a data da última barra');const data=study(asset.bars);
      if(!data.available){w.text(data.reason);scenarios.push([asset.ticker,'Sem dados','Sem dados','Sem dados']);continue}
      chart(w,asset.bars,'Estrutura diária');chart(w,weekly(asset.bars),'Estrutura semanal',150);
      w.text('A semana corrente pode estar incompleta.',{size:8,color:p.C.mut});w.table([['Referência',45],['Valor',55]],[['Última sessão da série',data.to],['Fechamento',number(data.last.c)],['Média 20',number(data.m20)],['Média 50',number(data.m50)],['Média 200',number(data.m200)],['Faixa inferior recente',number(data.support)],['Faixa superior recente',number(data.resistance)]]);
      const up=`Se uma sessão posterior fechar acima de ${number(data.resistance)}, acompanhar a sustentação acima da faixa. A hipótese perde força ao retornar ao intervalo.`,down=`Se fechar abaixo de ${number(data.support)}, acompanhar a continuidade abaixo da faixa. A hipótese perde força se recuperar o intervalo.`,side=`Enquanto permanecer entre ${number(data.support)} e ${number(data.resistance)}, a leitura por essa regra é de permanência na faixa.`;
      p.need(190);w.heading('Cenários para acompanhar');w.text('Alta condicional: '+up);w.text('Baixa condicional: '+down);w.text('Permanência na faixa: '+side);w.text('Referência mecânica: extremos das 20 sessões anteriores ao último candle disponível. Não contempla gaps futuros, liquidez ou custos; não é sugestão automática de operação.');
      scenarios.push([asset.ticker,'Acima de '+number(data.resistance),'Abaixo de '+number(data.support),'Retorno à faixa']);
    }
    p.need(180);w.heading('Quadro de acompanhamento');w.table([['Ativo',18],['Confirmação de alta',29],['Confirmação de baixa',29],['Reavaliar',24]],scenarios);
    w.heading('Antes de abrir a próxima sessão');w.text('• Conferir agenda e resultados das empresas.\n• Atualizar o último fechamento e os níveis.\n• Escrever cenário principal e alternativo.\n• Definir invalidação e risco antes de decidir.\n• Registrar o que aconteceu e revisar o processo.');
    w.heading('Fontes e método');w.text(input.demo?'Este arquivo usa somente dados sintéticos para validar o projeto gráfico.':'Candles diários disponíveis no aplicativo, agregados semanalmente sem preencher dias ausentes. Narrativa e agenda, quando presentes, vêm da edição já carregada do Jornal do Pregão. Cada estudo mostra sua referência. Não se extrapola histórico para fabricar preços futuros.');
    return w.finish();
  }
  function openHub(){
    const old=document.getElementById('wf-report-dialog');old?.remove();const box=document.createElement('dialog');box.id='wf-report-dialog';box.className='wf-dialog';
    let list=['IBOV','WIN','WDO','SPX'];try{list.push(...pfCalc().pos.slice(0,6).map(a=>a.tk))}catch{}
    box.innerHTML=`<header><h2>Relatórios e estudos</h2><button type="button" data-report="close" aria-label="Fechar">×</button></header><div class="wf-content"><h3>Carteira · pesquisa por ativo</h3><p>Exporta o consolidado selecionado e fichas individuais com os dados já carregados. Lacunas aparecem como indisponíveis.</p><div class="wf-actions"><button class="btn" data-report="portfolio">Gerar PDF profissional</button><button class="btn s" data-report="refresh">Carregar cotações e séries existentes</button><button class="btn s" data-report="analysis">Gerar análises individuais faltantes · usa cota de IA</button><button class="btn s" data-report="cancel">Parar após pedido atual</button></div><h3>Revista da semana</h3><label>Índices e ações, separados por vírgula<input id="wf-weekend-assets" value="${safe([...new Set(list)].join(', '))}"></label><div class="wf-actions"><button class="btn s" data-report="load-weekend">Carregar históricos</button><button class="btn" data-report="weekend">Exportar revista</button><button class="btn s" data-report="journal">Personalizar PDF do jornal diário</button></div><p role="status" id="wf-report-status" aria-live="polite"></p><p class="wf-note">A exportação não gera análises pagas. Carregue os dados antes; não há gráfico sem série ou indicador preenchido por aproximação.</p></div>`;
    box.addEventListener('click',async event=>{const button=event.target.closest('[data-report]');if(!button)return;const action=button.dataset.report,status=box.querySelector('[role="status"]');
      if(action==='close')return box.close();if(action==='cancel'){cancel=true;status.textContent='A fila vai parar após o pedido atual.';return}if(action==='journal'){box.close();return window.TraderWorkflow?.journalSettings()}
      if(running)return;running=true;cancel=false;
      try{
        if(action==='portfolio'){status.textContent='Preparando o documento…';const data=portfolioInput();if(!data.assets.length&&!data.selected)throw Error('Cadastre posições ou abra uma análise da carteira primeiro.');box.close();rpAbrir('Relatório profissional da carteira','carteira-pesquisa-'+loc().slice(0,10)+'.pdf',()=>portfolioPdf(data))}
        if(action==='refresh'){if(window.DIARIO_DEMO)throw Error('Consultas externas desativadas no demo.');status.textContent='Carregando os dados pelos serviços existentes…';if(window.pfQAtualiza)await pfQAtualiza(true);if(window.pfMeta)await pfMeta();if(window.pfVelas)await pfVelas();status.textContent='Atualização concluída. Confira datas e eventuais lacunas no relatório.'}
        const selected=()=>[...new Set(box.querySelector('input').value.split(',').map(t=>t.trim().toUpperCase()).filter(t=>/^[A-Z0-9:^._=/-]{1,24}$/.test(t)))].slice(0,20);
        if(action==='load-weekend'){if(window.DIARIO_DEMO)throw Error('Consultas externas desativadas no demo.');const tickers=selected();for(let i=0;i<tickers.length&&!cancel;i++){status.textContent=`Histórico ${i+1}/${tickers.length}: ${tickers[i]}`;try{await window.TRM?.tec?.pegaVelas(tickers[i],'1d')}catch{}}status.textContent='Consulta encerrada; séries indisponíveis serão identificadas no PDF.'}
        if(action==='weekend'){const assets=selected().map(ticker=>({ticker,bars:technicalFromCache(ticker)}));box.close();rpAbrir('Revista do Pregão','revista-pregao-'+loc().slice(0,10)+'.pdf',()=>weekendPdf({ref:loc().slice(0,10),edition:typeof jrVer==='function'?jrVer():null,assets}))}
        if(action==='analysis'){
          if(window.DIARIO_DEMO)throw Error('Geração de IA desativada no demo.');const assets=pfCalc().pos.filter(a=>!pfUltRel(a.tk)).slice(0,24);if(!assets.length){status.textContent='Não há análise individual faltante entre as posições.';return}
          if(!confirm(`Gerar até ${assets.length} análises individuais faltantes usando a cota de IA da sua conta?`))return;
          for(let i=0;i<assets.length&&!cancel;i++){status.textContent=`Análise ${i+1}/${assets.length}: ${assets[i].tk}`;await pfGeraAtivo(assets[i],false)}if(window.PF)PF.rv=null;status.textContent='Fila encerrada. A exportação informa quais análises estão disponíveis.';
        }
      }catch(error){status.textContent=error.message||String(error)}finally{running=false}
    });document.body.append(box);box.showModal();
  }
  // O botão nativo de impressão passa a abrir um PDF com paginação própria.
  window.addEventListener('click',event=>{if(!event.target.closest('[data-pf="print"]'))return;event.preventDefault();event.stopImmediatePropagation();try{const data=portfolioInput();rpAbrir('Relatório da carteira','carteira-'+loc().slice(0,10)+'.pdf',()=>portfolioPdf(data))}catch(error){toast(error.message||String(error))}},true);
  window.TraderReports={openHub,portfolioInput,portfolioPdf,weekendPdf,study,weekly,bars,fundamentalRows};
})();
