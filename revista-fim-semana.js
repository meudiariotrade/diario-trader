/* O Jornal do fim de semana usa a revista diretamente, inclusive no botão PDF nativo. */
(() => {
 'use strict';const M=window.RevistaModel,KEY='diario-revista-tecnica-v289',safe=v=>esc(String(v??'')),n=v=>typeof v==='number'?v.toLocaleString('pt-BR',{maximumFractionDigits:4}):'Não disponível';
 let paper=null,job=null,error='',lastAttempt=0,manual=false;try{const saved=JSON.parse(APP_STORAGE.getItem(KEY)||'null');if(saved?.formato===M.VERSION)paper=saved}catch{}
 const weekend=()=>[0,6].includes(new Date(M.spDate()+'T12:00:00Z').getUTCDay());
 const isPaper=p=>p?.formato===M.VERSION;
 const selected=()=>{const viewed=typeof jrVer==='function'?jrVer():null;return isPaper(viewed)?viewed:paper};
 const shouldUse=()=>isPaper(JRN.arq)||!JRN.arq&&(manual||weekend());
 function setPaper(p){paper=p;JRN.v=p;JRN.arq=null;try{APP_STORAGE.setItem(KEY,JSON.stringify(p));APP_STORAGE.setItem('diario-jornal',JSON.stringify(p))}catch{}}
 async function load(force=false){
   if(job)return job;const reference=M.spDate(),cut=M.windowFor(reference).cutoff;
   if(!force&&paper?.window?.cutoff===cut){setPaper(paper);return paper}
   if(!force&&Date.now()-lastAttempt<60000)return null;
   if(window.DIARIO_DEMO){error='Demonstração: fontes externas desativadas.';paint();return null}
   if(!SESS?.at){error='Entre na conta para consultar o histórico e fechar a revista.';paint();return null}
   lastAttempt=Date.now();error='';JRN.busy=1;paint();
   job=(async()=>{
     try{
       const requests=[{ticker:'IBOV',name:'Ibovespa à vista',request:'WIN',scale:1},{ticker:'USDBRL',name:'Dólar à vista · USD/BRL',request:'WDO',scale:.001},{ticker:'PETR4',name:'Petrobras PN',request:'PETR4',scale:1},{ticker:'VALE3',name:'Vale ON',request:'VALE3',scale:1},{ticker:'ITUB4',name:'Itaú Unibanco PN',request:'ITUB4',scale:1}];
       const result=await Promise.allSettled(requests.map(async a=>{const response=await rq('/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:a.request,intervalo:'1d'}),signal:AbortSignal.timeout(25000)}),data=await response.json();
         // O fornecedor usa proxies para WIN/WDO. Aqui eles são identificados pelo seu ativo real.
         if(a.ticker==='IBOV'&&data.simbolo!=='^BVSP')throw Error('A fonte não confirmou o histórico do Ibovespa.');
         if(a.ticker==='USDBRL'&&data.simbolo!=='BRL=X')throw Error('A fonte não confirmou o dólar à vista.');
         if(!['IBOV','USDBRL'].includes(a.ticker)&&data.proxy)throw Error('Histórico substituto não aceito para este estudo.');
         if(!Array.isArray(data.candles))throw Error('Histórico não retornado.');return {...a,bars:data.candles.map(r=>r.map((v,i)=>i>0&&i<5?v*a.scale:v)),source:'Yahoo Finance · '+data.simbolo,sourceSymbol:data.simbolo,queried:new Date().toISOString()};}));
       let snapshot=null;try{snapshot=await window.TRM?.trFn('cot',{s:['WINFUT','WDOFUT']},0)}catch{}
       const assets=requests.map((a,i)=>result[i].status==='fulfilled'?result[i].value:{...a,bars:[],error:String(result[i].reason?.message||result[i].reason)});
       if(!assets.some(a=>a.bars.length>=30)&&!(snapshot?.itens||[]).some(a=>a.px!=null))throw Error('Nenhuma fonte retornou dados suficientes. A revista anterior não foi trocada.');
       const p=M.build({reference,assets,snapshot});setPaper(p);return p;
     }catch(e){error=e.message||String(e);return null}
     finally{job=null;JRN.busy=0;paint()}
   })();return job;
 }
 function matrix(s){return `<div class="rv-scenarios">${s.scenarios.map(c=>`<article><b>${safe(c.name)}</b><p>${safe(c.condition)}</p><strong>${c.trigger!=null?n(c.trigger):n(c.low)+' a '+n(c.high)}</strong><small>Reavaliar: ${safe(c.invalidation)}</small></article>`).join('')}</div>`}
 function studyHtml(s){if(!s.available)return `<section class="rv-study"><h2>${safe(s.ticker)} · ${safe(s.name)}</h2><p class="rv-missing">${safe(s.reason)}</p></section>`;
   const pts=s.bars.map(r=>({date:M.date(r[0]),value:r[4]}));return `<section class="rv-study"><div class="rv-kicker">ESTUDO TÉCNICO · ${safe(s.asOf)}</div><h2>${safe(s.ticker)} · ${safe(s.name)}</h2><p>Estrutura diária: <b>${safe(s.dailyTrend)}</b> · semanal: <b>${safe(s.weeklyTrend)}</b> · variação da última semana disponível: <b>${n(s.weeklyReturn)}%</b></p>${window.CarteiraExperience?.svgLine(pts.slice(-120),s.ticker+' · fechamentos diários')||''}<p class="rv-source">${safe(s.source)} · ${safe(s.from)} a ${safe(s.asOf)}. O gráfico mostra fechamentos observados.</p><div class="rv-metrics"><span>Fechamento <b>${n(s.close)}</b></span><span>MM20 <b>${n(s.ma20)}</b></span><span>MM50 <b>${n(s.ma50)}</b></span><span>MM200 <b>${n(s.ma200)}</b></span><span>RSI14 <b>${n(s.rsi)}</b></span></div><p>Diário: preço e ordenação das MM20/MM50. Semanal: preço e ordenação das médias de 10/40 semanas. Uma estrutura indefinida pede confirmação; médias descrevem o histórico e podem atrasar reversões.</p>${matrix(s)}</section>`;
 }
 function futureHtml(f){return `<section class="rv-study"><div class="rv-kicker">CONTRATO FUTURO · COBERTURA LIMITADA</div><h2>${safe(f.ticker)} · ${safe(f.name)}</h2>${!f.available?`<p class="rv-missing">${safe(f.reason)}</p>`:`<p>${safe(f.symbol)} · consulta ${safe(f.queried||'sem horário')}</p><div class="rv-metrics"><span>Último informado <b>${n(f.price)}</b></span><span>Máxima da amostra <b>${n(f.high)}</b></span><span>Mínima da amostra <b>${n(f.low)}</b></span></div><p class="rv-missing">${safe(f.note)}</p><p>Acima de ${n(f.high)}: acompanhar a sustentação e reavaliar se retornar à faixa. Abaixo de ${n(f.low)}: acompanhar a continuidade e reavaliar se recuperar a faixa. Entre as referências: aguardar definição. Esses níveis pertencem ao snapshot do futuro, não ao gráfico do ativo à vista.</p>`}</section>`}
 function body(){const p=selected();if(!p)return `<div class="rv-empty">${JRN.busy?'Consultando séries para a revista técnica…':safe(error||'A revista técnica ainda não foi carregada.')}<p><button class="btn" data-revista="refresh">Gerar revista técnica</button></p></div>`;
   return `<article class="rv-magazine"><header class="rv-cover"><span>JORNAL DO PREGÃO · EDIÇÃO DE ESTUDOS</span><h1>Revista da Semana</h1><p>Cenários técnicos · ${safe(p.window.from)} a ${safe(p.window.to)}</p><small>Corte: ${safe(p.window.cutoff)} · cada ativo informa a última sessão realmente disponível.</small></header>${error?`<p class="warn">${safe(error)} Exibindo a edição anterior com a referência acima.</p>`:''}<section class="rv-intro"><h2>Mapa da edição</h2><p>Ibovespa, dólar à vista, contratos futuros e ações de referência. Leitura original para preparar a semana, com condições de confirmação e invalidação. A abertura efetiva depende do calendário de negociação e dos feriados.</p><p class="rv-source">Esta edição substitui as matérias de notícias do fim de semana por estudos. O PDF inclui gráficos diários e semanais. Não há previsão garantida, notícia gerada ou probabilidade atribuída aos cenários.</p></section>${p.studies.slice(0,2).map(studyHtml).join('')}${p.futures.map(futureHtml).join('')}${p.studies.slice(2).map(studyHtml).join('')}<section class="rv-study"><h2>Plano para a próxima sessão</h2><ol><li>Conferir agenda, feriados e vencimento do contrato.</li><li>Atualizar os níveis com dados da abertura.</li><li>Escrever cenário principal, alternativo e invalidação no diário.</li><li>Dimensionar o risco antes da decisão e revisar o checklist.</li></ol><button class="btn s" data-navroute="dia:ed">Levar a preparação ao diário</button></section></article>`;
 }
 function shell(){return `<div class="card rv-shell"><div class="rv-toolbar"><b>Jornal · fim de semana</b><div><button class="btn s" data-revista="refresh"${JRN.busy?' disabled':''}>${JRN.busy?'Consultando…':'Atualizar estudos'}</button><button class="btn" data-revista="pdf">PDF da revista</button>${!weekend()?'<button class="btn s" data-revista="daily">Jornal diário</button>':''}</div></div><div id="revista-body">${body()}</div></div>`}
 function paint(){const node=document.getElementById('revista-body');if(node)node.innerHTML=body();else if(tab==='mercado'&&MKT.tab==='jr')render()}
 const previousJornal=vJornal;vJornal=function(){if(shouldUse()){if(!paper&&!job&&!error)setTimeout(()=>load(false),0);else if(paper&&paper.window.cutoff!==M.windowFor(M.spDate()).cutoff&&!job&&!error)setTimeout(()=>load(false),0);return shell()}if(JRN.v?.materias)JRN.v={...JRN.v,materias:M.dedupe(JRN.v.materias)};return previousJornal.apply(this,arguments)};
 const previousLoad=jrCarrega;jrCarrega=function(force){return (manual||weekend())&&!JRN.arq?load(!!force):previousLoad.apply(this,arguments)};
 const previousPdf=jrPdf;jrPdf=async function(){if(shouldUse()||jrVer()?.edicao==='fds'){if(!JRN.arq)manual=true;if(!isPaper(selected())||!JRN.arq&&selected()?.window.cutoff!==M.windowFor(M.spDate()).cutoff){const p=await load(true);if(!p)return toast(error||'Não foi possível gerar a revista.')}const p=selected();return rpAbrir('Revista da Semana','revista-semana-'+p.window.from+'.pdf',()=>TraderReports.technicalMagazinePdf(p))}return previousPdf.apply(this,arguments)};
 window.addEventListener('click',event=>{const button=event.target.closest('[data-revista], [data-jrpdf], [data-jrrf]');if(!button)return;const p=typeof jrVer==='function'?jrVer():null;if(!button.dataset.revista&&!shouldUse()&&p?.edicao!=='fds')return;event.preventDefault();event.stopImmediatePropagation();
    if(button.dataset.revista==='daily'){manual=false;JRN.arq=null;if(isPaper(JRN.v))JRN.v=null;render();return}
    if(button.dataset.revista==='open'){manual=true;JRN.arq=null;render();load(false);return}
    if(button.dataset.revista==='refresh'||button.hasAttribute('data-jrrf')){manual=true;load(true)}else jrPdf();
  },true);
  const previousMarket=vMercado;vMercado=function(){const p=typeof jrVer==='function'?jrVer():null;if(MKT.tab==='jr'&&JRN.arq?.edicao==='fds'&&!isPaper(p))return `<div class="card"><h2>Arquivo da edição antiga</h2><p>Esta edição foi montada no formato de notícias. Abra a revista técnica atual para obter os novos estudos, sem alterar o arquivo guardado.</p><button class="btn" data-revista="refresh">Abrir revista técnica atual</button></div>`;
    const html=previousMarket.apply(this,arguments);return MKT.tab==='jr'&&!weekend()&&!shouldUse()?'<div class="card"><div class="top"><div><b>Revista técnica de fim de semana</b><p class="sm mut">Estudos e cenários da semana, separados das notícias do dia.</p></div><button class="btn s" data-revista="open">Abrir revista</button></div></div>'+html:html;
  };
  window.RevistaTecnica={load,body,shell,shouldUse,selected,setPaper};
})();
