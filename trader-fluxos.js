/* Fluxos do diário: somente ações locais explícitas; persistência pelo save existente. */
(() => {
  'use strict';
  const M=window.TraderModel, $=s=>document.querySelector(s), safe=v=>esc(String(v??''));
  const config=()=>((S.ax??={}).workflow??={});
  const days=()=>diarioDaysCanonical();
  const today=()=>loc().slice(0,10);
  let observed=null,owner=null,pendingImport=null,fileName='',week=M.monday(today());
  const rulesFor=market=>market==='US'?(S.rulesUS||[]):typeof MDU!=='undefined'&&MDU.k?MDU.rules||S.rules:S.rules;
  function reset(){observed={trades:M.clone(S.trades||[]),days:M.clone(days()),rules:M.clone(rulesFor('BR')||[]),rulesUS:M.clone(rulesFor('US')||[])};owner=S}
  function beforeSave(){
    if(!observed||owner!==S){reset();return}
    const now=Date.now(),prior=new Map(observed.trades.map(t=>[t.id,t]));
    for(const t of S.trades||[]){const old=prior.get(t.id);if(!old&&!t._rulesSnapshot){captureTrade(t,null,true);if(pendingImport)t._rulesSnapshot.scope='regras_na_importacao_sem_comprovacao_historica'}if(old&&M.archive(t,old,'editar_operacao',now))t.u=Math.max(t.u||0,now)}
    for(const [date,day] of Object.entries(days())){
      const old=observed.days[date];
      if(M.stable(M.strip(day))!==M.stable(M.strip(old))){
        if(!day._rulesSnapshot)day._rulesSnapshot=M.ruleSnapshot(rulesFor('BR'),day.chk,now,date===today()?'registro_no_dia':'registro_posterior');
        if(day.us&&!day.us._rulesSnapshot)day.us._rulesSnapshot=M.ruleSnapshot(rulesFor('US'),day.us.chk,now,'sessao_EUA');
        if(old)M.archive(day,old,'editar_diario',now);
      }
    }
    const ruleText=list=>M.stable((list||[]).map(r=>({id:r.id,t:r.t,cat:r.cat})));
    for(const market of ['BR','US']){const previous=market==='BR'?observed.rules:observed.rulesUS;if(ruleText(previous)!==ruleText(rulesFor(market))){const list=config().ruleVersions??=[];list.push({id:M.id(),at:now,market,rules:M.clone(previous)});config().ruleVersions=list.slice(-50)}}
    if(pendingImport){
      const items=[];
      for(const id of pendingImport.ids){const current=S.trades.find(t=>t.id===id),old=pendingImport.before[id];if(current&&M.stable(M.strip(current))!==M.stable(M.strip(old)))items.push({id,before:old||null,after:M.stable(M.strip(current))})}
      if(items.length){const list=config().importBatches??=[];list.push({id:pendingImport.id,at:now,name:pendingImport.name,items});config().importBatches=list.slice(-30)}
      pendingImport=null;
    }
    reset();
  }
  function captureTrade(trade,original,isNew){
    const market=typeof ehUS==='function'&&ehUS(trade)?'US':'BR',date=String(trade.dt||'').slice(0,10),day=market==='US'?days()[date]?.us:days()[date];
    M.captureTrade(trade,rulesFor(market),day,today());
    if(!isNew&&!original?._rulesSnapshot)trade._rulesSnapshot.scope='edicao_atual_sem_regra_historica';
  }
  function dialog(title,html){
    $('#wf-dialog')?.close();$('#wf-dialog')?.remove();
    const box=document.createElement('dialog');box.id='wf-dialog';box.className='wf-dialog';
    box.innerHTML=`<header><h2>${safe(title)}</h2><button type="button" data-wf="close" aria-label="Fechar">×</button></header><div class="wf-content">${html}</div>`;
    box.addEventListener('close',()=>box.remove());document.body.append(box);box.showModal();return box;
  }
  const moneyBy=values=>Object.entries(values||{}).map(([unit,value])=>`${safe(unit)} ${Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`).join(' · ')||'—';
  function comparisonHtml(groups){
    const names={followed:'Seguiu o plano',broken:'Quebrou regras',unknown:'Sem avaliação'};
    return `<div class="wf-table"><table><thead><tr><th>Grupo declarado</th><th>Trades</th><th>Resultado por moeda</th><th>Média em R</th><th>Positivos</th></tr></thead><tbody>${Object.entries(groups).map(([key,g])=>`<tr><th>${names[key]}</th><td>${g.n}</td><td>${moneyBy(g.currencies)}</td><td>${g.meanR==null?'—':g.meanR.toFixed(2)} <small>(${g.rCount} com risco)</small></td><td>${g.winRate==null?'—':g.winRate.toFixed(1)+'%'}</td></tr>`).join('')}</tbody></table></div><p class="wf-note">Classificação informada por você. Não mistura moedas e não prova causalidade. Amostras pequenas e operações diferentes limitam a comparação.</p>`;
  }
  function weeklyHtml(){
    const data=M.weekly(S.trades,days(),week,calc,moedaT),saved=(config().weekly||{})[data.from];
    return `<section class="card wf-weekly"><h2>Revisão do processo</h2><label>Semana de referência<input type="date" id="wf-week" value="${data.from}"></label><p class="mut sm">${data.from} a ${data.to} · data de encerramento das operações</p>${comparisonHtml(data.comparison)}
      <h3>Erros registrados</h3>${data.errors.length?`<ul>${data.errors.slice(0,6).map(([label,n])=>`<li>${safe(label)} · ${n} registro(s)</li>`).join('')}</ul>`:'<p class="mut">Nenhum erro registrado neste período. Isso não comprova ausência de erros.</p>'}
      <h3>O que você escreveu</h3>${data.notes.map(note=>`<details><summary>${note.date} · ${note.market||'BR'}</summary><p>${safe(note.good)}</p><p>${safe(note.learning)}</p></details>`).join('')||'<p class="mut">Sem aprendizados ou pontos positivos escritos nesta semana.</p>'}
      <label>Uma ação observável para a próxima semana<textarea id="wf-action" placeholder="${safe(data.suggestion)}">${safe(saved?.action||'')}</textarea></label>
      <button class="btn" data-wf="weekly-save">Salvar ação e levar ao plano de segunda</button><p class="wf-note">A ação será acrescentada ao plano de ${M.addDays(data.from,7)}, sem substituir o texto existente.</p></section>`;
  }
  function openTrade(id){
    const t=S.trades.find(x=>x.id===id);if(!t)return;
    const date=String(t.dt||'').slice(0,10),market=typeof ehUS==='function'&&ehUS(t)?'us':'br',day=market==='us'?days()[date]?.us:days()[date],snap=t._rulesSnapshot;
    dialog(`${t.ativo||'Operação'} · processo e linha do tempo`,
      `<div class="wf-actions"><button class="btn s" data-wf="edit" data-id="${safe(id)}">Editar operação</button><button class="btn s" data-wf="day" data-date="${date}" data-market="${market}">Abrir diário deste dia</button><button class="btn s" data-wf="history-trade" data-id="${safe(id)}">Versões anteriores</button></div>
      <h3>Plano registrado no diário</h3><p class="wf-pre">${safe(day?.plano||'Sem plano registrado.')}</p><p class="wf-note">O plano acima é a versão atual do diário. O histórico permite consultar versões anteriores.</p>
      <h3>Regras preservadas no registro</h3>${snap?`<p class="wf-note">Registradas em ${new Date(snap.at).toLocaleString('pt-BR')} · ${safe(snap.scope)}. Não comprova vigência anterior à captura.</p><ul>${snap.rules.map(rule=>`<li>${safe(rule.text)} · ${rule.checked?'marcada no registro':'não marcada no registro'}</li>`).join('')}</ul>`:'<p>Operação anterior ao versionamento. Não foi inventada uma versão histórica das regras.</p>'}
      <label>Avaliação da execução<select id="wf-assessment"><option value="unknown"${M.status(t)==='unknown'?' selected':''}>Ainda não avaliei</option><option value="followed"${M.status(t)==='followed'?' selected':''}>Segui o plano</option><option value="broken"${M.status(t)==='broken'?' selected':''}>Quebrei regras</option></select></label>
      <label>Justificativa<textarea id="wf-assessment-note">${safe(t._assessment?.note||'')}</textarea></label><button class="btn" data-wf="assess" data-id="${safe(id)}">Salvar avaliação</button>
      <h3>Linha do tempo</h3><ol class="wf-timeline"><li><b>Entrada informada</b> · ${safe(t.dt)}</li>${t.dtx?`<li><b>Saída informada</b> · ${safe(t.dtx)}</li>`:''}${(t._events||[]).map(event=>`<li>${new Date(event.at).toLocaleString('pt-BR')} · ${safe(event.kind)}${event.fields?.length?' · '+safe(event.fields.join(', ')):''}</li>`).join('')}</ol>
      <p class="wf-note">Datas de execução são as informadas na operação. Eventos de edição começam nesta versão do aplicativo.</p>
      ${['pplan','pin','pout'].filter(k=>t[k]).map(k=>`<figure><figcaption>${{pplan:'Plano',pin:'Entrada',pout:'Saída'}[k]}</figcaption><img data-img="${safe(t[k])}" alt="Print de ${k}" style="max-width:100%"></figure>`).join('')}`);
    fillImgs();
  }
  function history(kind,id){
    const record=kind==='trade'?S.trades.find(t=>t.id===id):days()[id];if(!record)return;
    const list=record._history||[];
    dialog('Histórico de alterações',`<p class="wf-note">Até 50 versões anteriores por registro. Edições próximas são agrupadas em intervalos de 30 segundos. O backup continua importante.</p>${list.slice().reverse().map(v=>`<details><summary>${new Date(v.at).toLocaleString('pt-BR')} · ${safe(v.reason)}</summary><pre>${safe(JSON.stringify(v.data,null,2))}</pre><button class="btn s" data-wf="restore" data-kind="${kind}" data-id="${safe(id)}" data-version="${safe(v.id)}">Restaurar como nova edição</button></details>`).join('')||'<p>Ainda não há versão anterior preservada. O histórico começa após instalar esta versão.</p>'}`);
  }
  function openSearch(){
    dialog('Buscar no aplicativo',`<label>Operação, ativo, setup, anotação, regra ou livro<input id="wf-query" type="search" autocomplete="off" placeholder="Ex.: WIN medo stop"></label><div id="wf-search-results" aria-live="polite"></div>`);
    let timer;$('#wf-query').addEventListener('input',event=>{clearTimeout(timer);timer=setTimeout(()=>{
      const result=M.search({...S,days:days()},event.target.value),target=$('#wf-search-results');if(!target)return;
      target.innerHTML=`<p class="wf-note">${result.length} resultado(s); exibindo até 50.</p>${result.slice(0,50).map(item=>`<button class="wf-result" data-wf="search-open" data-kind="${item.kind}" data-id="${safe(item.id)}" data-market="${item.market||''}"><b>${safe(item.title)}</b><small>${safe(item.text.slice(0,140))}</small></button>`).join('')}`;
    },180)});$('#wf-query').focus();
  }
  function openTemplates(){
    const saved=config().templates||{};
    dialog('Modelos do diário',`<p class="wf-note">Os modelos preenchem plano e ensaio mental apenas quando o campo está vazio. Não apagam um plano já escrito.</p><label>Modelo<select id="wf-template">${Object.entries(M.templates).map(([key,t])=>`<option value="${key}">${t.name}</option>`).join('')}</select></label><label>Plano<textarea id="wf-template-plan"></textarea></label><label>Ensaio mental<textarea id="wf-template-pre"></textarea></label><div class="wf-actions"><button class="btn s" data-wf="template-save">Guardar meu modelo</button><button class="btn" data-wf="template-apply">Aplicar ao dia aberto</button></div>`);
    const paint=()=>{const key=$('#wf-template').value,t=saved[key]||M.templates[key];$('#wf-template-plan').value=t.plano;$('#wf-template-pre').value=t.pre};$('#wf-template').onchange=paint;paint();
  }
  function batchesHtml(){
    return `<section class="card"><h2>Lotes de importação</h2><p class="wf-note">Até 30 lotes recentes. Desfazer preserva operações que você editou depois da importação.</p>${(config().importBatches||[]).slice().reverse().map(batch=>`<div class="wf-batch"><b>${safe(batch.name||'Importação CSV')}</b><p>${new Date(batch.at).toLocaleString('pt-BR')} · ${batch.items.length} alteração(ões)</p>${batch.undoneAt?`<p>Desfeito: ${batch.result.removed} removida(s), ${batch.result.restored} restaurada(s), ${batch.result.skipped.length} preservada(s) por alteração posterior.</p>`:`<button class="btn s" data-wf="undo-batch" data-id="${safe(batch.id)}">Desfazer este lote</button>`}</div>`).join('')||'<p>Nenhum lote registrado nesta versão.</p>'}</section>`;
  }
  function homeSettings(){
    const nodes=[...document.querySelectorAll('#app [data-hb]')],keys=[...new Set(nodes.map(n=>n.dataset.hb))],saved=config().home||{},order=[...(saved.order||[]).filter(k=>keys.includes(k)),...keys.filter(k=>!saved.order?.includes(k))];
    dialog('Organizar a tela inicial',`<p class="wf-note">Rotina e avisos de risco permanecem acessíveis. Reordene e oculte os módulos opcionais.</p><div id="wf-home-order">${order.map(key=>`<div class="wf-home-row" data-home-key="${safe(key)}"><label><input type="checkbox"${!saved.hidden?.includes(key)?' checked':''}${['posso','lim','venc'].includes(key)?' disabled':''}> ${safe(nodes.find(n=>n.dataset.hb===key)?.querySelector('h2,b')?.textContent?.slice(0,70)||key)}</label><button class="btn s" data-wf="home-up" aria-label="Mover para cima">↑</button><button class="btn s" data-wf="home-down" aria-label="Mover para baixo">↓</button></div>`).join('')}</div><button class="btn" data-wf="home-save">Salvar organização</button>`);
  }
  function applyHome(root){
    const prefs=config().home;if(!prefs)return;const parents=new Map;
    root.querySelectorAll('[data-hb]').forEach(node=>{const key=node.dataset.hb;node.hidden=!['posso','lim','venc'].includes(key)&&prefs.hidden?.includes(key);const list=parents.get(node.parentNode)||[];list.push(node);parents.set(node.parentNode,list)});
    for(const [parent,nodes] of parents){const marker=document.createComment('home-order');parent.insertBefore(marker,nodes[0]);const order=prefs.order||[];nodes.sort((a,b)=>(order.indexOf(a.dataset.hb)<0?999:order.indexOf(a.dataset.hb))-(order.indexOf(b.dataset.hb)<0?999:order.indexOf(b.dataset.hb))).forEach(n=>parent.insertBefore(n,marker));marker.remove()}
  }
  function quality(){
    const rows=[];try{rows.push({name:'Sincronização',source:'Supabase',at:S.lastSyncAt,error:SY.msg?.startsWith('Falha')?SY.msg:'',note:SESS?'Conta conectada':'Cópia local; sem sessão'})}catch{}
    try{rows.push({name:'Cotações da carteira',source:'Fontes do módulo Carteiras',at:window.PF?.qts,error:window.PF?.qMsg||'',note:'Confira também a data de cada ativo; consulta recente não garante preço em tempo real.'})}catch{}
    try{for(const row of SYS.res||[])rows.push({name:row.fn||row.nome||row.k||'Serviço',source:'Diagnóstico das funções',note:row.msg||row.st||'',at:row.em})}catch{}
    dialog('Qualidade e atualização dos dados',`<p>Data de consulta e data de mercado são diferentes. Ausência de erro não comprova atualização.</p><div class="wf-table"><table><thead><tr><th>Informação</th><th>Fonte</th><th>Última consulta</th><th>Estado / limitação</th></tr></thead><tbody>${rows.map(row=>`<tr><th>${safe(row.name)}</th><td>${safe(row.source)}</td><td>${row.at?safe(new Date(row.at).toLocaleString('pt-BR')):'Não informada'}</td><td>${safe(row.error||row.note||'Sem diagnóstico disponível')}</td></tr>`).join('')}</tbody></table></div><button class="btn s" data-wf="status">Abrir diagnóstico completo</button>`);
  }
  function journalSettings(){
    const prefs=config().journal||{},editors=typeof JR_COR!=='undefined'?Object.keys(JR_COR):['Mercados','Empresas','Internacional'];
    dialog('Personalizar o PDF do jornal',`<label>Formato<select id="wf-journal-mode"><option value="full">Completo</option><option value="brief"${prefs.mode==='brief'?' selected':''}>Resumido · primeiro parágrafo de cada matéria</option></select></label><label>Ativos de interesse, separados por vírgula<input id="wf-journal-tickers" value="${safe((prefs.tickers||[]).join(', '))}" placeholder="VALE3, PETR4, AAPL"></label><p class="wf-note">O filtro de ativos se aplica às matérias de empresas. O contexto macro é preservado.</p><h3>Editorias no PDF</h3>${editors.map(name=>`<label class="ck"><input type="checkbox" data-journal-editor="${safe(name)}"${!prefs.hidden?.includes(name)?' checked':''}> ${safe(name)}</label>`).join('')}<button class="btn" data-wf="journal-save">Salvar preferências do PDF</button>`);
  }
  function decorate(){
    if(!observed||owner!==S)reset();
    const root=$('#app');if(!root)return;
    if(window.DIARIO_DEMO&&!document.getElementById('wf-demo-banner')){const banner=document.createElement('div');banner.id='wf-demo-banner';banner.innerHTML='DEMONSTRAÇÃO · registros fictícios · conta e rede externas desativadas. <a href="'+location.pathname+'">Voltar ao aplicativo real</a>';document.body.prepend(banner)}
    const toolbar=document.createElement('div');toolbar.className='wf-toolbar';toolbar.innerHTML='<button class="btn s" data-wf="search">Buscar registros</button><button class="btn s" data-wf="quality">Dados e fontes</button><button class="btn s" data-wf="reports">Relatórios</button><a class="btn s" href="?demo=1">Demonstração</a>';root.prepend(toolbar);
    if(tab==='home'){toolbar.insertAdjacentHTML('beforeend','<button class="btn s" data-wf="home">Organizar início</button>');applyHome(root)}
    if(tab==='dia'&&DV!=='hist'){const anchor=root.querySelector('.diary-toolbar')||toolbar;anchor.insertAdjacentHTML('beforeend','<button class="btn s" data-wf="templates">Modelo do diário</button><button class="btn s" data-wf="history-day">Versões deste dia</button>')}
    if(tab==='rev')root.insertAdjacentHTML('beforeend',weeklyHtml());
    if(tab==='stats')root.insertAdjacentHTML('beforeend',`<section class="card"><h2>Execução e resultado</h2>${comparisonHtml(M.compare(S.trades,calc,moedaT))}<p class="wf-note">Esta comparação considera todas as operações encerradas, independentemente do filtro das estatísticas acima.</p></section>`);
    if(tab==='import'){root.insertAdjacentHTML('beforeend',batchesHtml());if(typeof IM!=='undefined'&&IM?.rows)root.insertAdjacentHTML('beforeend',`<p class="wf-note">Prévia: ${IM.rows.length} linha(s) agrupada(s), ${IM.dup?.size||0} duplicada(s), ${IM.off?.size||0} desmarcada(s), ${IM.upd?.size||0} atualização(ões). Confira a prévia acima antes de importar.</p>`)}
    root.querySelectorAll('.tcard[data-id],.card.row[data-a="edit"]').forEach(node=>{if(node.querySelector('[data-wf="trade"]'))return;const id=node.dataset.id;if(!id)return;node.insertAdjacentHTML('beforeend',`<button class="btn s wf-process-button" data-wf="trade" data-id="${safe(id)}">Diário e processo</button>`)});
  }
  const previousRender=render0;render0=function(){const result=previousRender.apply(this,arguments);decorate();return result};
  const previousSheet=showSheet;showSheet=function(){const result=previousSheet.apply(this,arguments);const sheet=$('#sh .sh');if(sheet&&T&&!isNew)sheet.insertAdjacentHTML('beforeend',`<div class="wf-actions"><button class="btn s" data-wf="trade" data-id="${safe(T.id)}">Diário, regras e linha do tempo</button></div>`);return result};
  window.TraderWorkflow={beforeSave,reset,captureTrade,prepareJournal:edition=>M.journal(edition,config().journal),openSearch,quality,journalSettings,openTrade};
  document.addEventListener('change',event=>{if(event.target.id==='wf-week'){week=M.monday(event.target.value||today());render()}if(event.target.id==='impf')fileName=event.target.files?.[0]?.name||'Arquivo CSV'});
  window.addEventListener('click',event=>{
    const imp=event.target.closest('[data-a="impgo"]');
    if(imp&&typeof IM!=='undefined'&&IM?.rows){const ids=IM.rows.filter(row=>!IM.dup.has(row.t.id)&&!IM.off.has(row.t.id)).map(row=>row.t.id);pendingImport={id:M.id(),name:fileName,ids,before:Object.fromEntries(S.trades.filter(t=>ids.includes(t.id)).map(t=>[t.id,M.clone(t)]))}}
    const button=event.target.closest('[data-wf]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const action=button.dataset.wf,id=button.dataset.id;
    if(action==='close')return $('#wf-dialog')?.close();
    if(action==='search')return openSearch();if(action==='quality')return quality();if(action==='templates')return openTemplates();if(action==='home')return homeSettings();if(action==='journal')return journalSettings();
    if(action==='reports')return window.TraderReports?.openHub();
    if(action==='trade')return openTrade(id);
    if(action==='history-trade')return history('trade',id);if(action==='history-day')return history('day',D);
    if(action==='assess'){const trade=S.trades.find(t=>t.id===id);if(trade){trade._assessment={status:$('#wf-assessment').value,note:$('#wf-assessment-note').value,at:Date.now()};trade.rules={followed:'s',broken:'n',unknown:''}[trade._assessment.status];trade.u=Date.now();save();render();openTrade(id)}return}
    if(action==='day'){D=button.dataset.date;DV='ed';if(typeof mdmSet==='function')mdmSet(button.dataset.market||'br');tab='dia';$('#wf-dialog')?.close();render();return}
    if(action==='edit'){ $('#wf-dialog')?.close();const target=S.trades.find(t=>t.id===id);if(target){orig=M.clone(target);T=M.clone(target);isNew=0;showSheet()}return}
    if(action==='search-open'){const kind=button.dataset.kind;if(kind==='trade')return openTrade(id);if(kind==='day'){D=id;DV='ed';mdmSet(button.dataset.market==='US'?'us':'br');tab='dia'}else {tab=kind==='rule'?'regras':'estudos';if(kind==='rule'&&typeof mdmSet==='function')mdmSet(button.dataset.market==='US'?'us':'br')}$('#wf-dialog')?.close();render();return}
    if(action==='restore'){const kind=button.dataset.kind,record=kind==='trade'?S.trades.find(t=>t.id===id):days()[id],version=record?._history?.find(v=>v.id===button.dataset.version);if(!version||!confirm('Restaurar esta versão como uma nova edição? A versão atual ficará no histórico.'))return;const previous=M.clone(record),metadata={_history:record._history,_events:record._events,_fc:record._fc,_resolved:record._resolved,_conflicts:record._conflicts};for(const key of Object.keys(record))delete record[key];Object.assign(record,M.clone(version.data),metadata,{u:Date.now()});M.archive(record,previous,'restaurar_versao',Date.now(),0);reset();save();render();history(kind,id);return}
    if(action==='weekly-save'){const data=M.weekly(S.trades,days(),week,calc,moedaT),text=$('#wf-action')?.value.trim();if(!text)return toast('Escreva uma ação observável.');const next=M.addDays(data.from,7),label=`Ação da revisão ${data.from}: ${text}`;((config().weekly??={})[data.from])={action:text,at:Date.now()};const day=(days()[next]||(S.days[next]={chk:{}}));if(!String(day.plano||'').includes(label))day.plano=[day.plano,label].filter(Boolean).join('\n\n');day.u=Date.now();save();render();toast('Ação guardada no plano da próxima segunda.');return}
    if(action==='template-save'||action==='template-apply'){const key=$('#wf-template').value,template={name:M.templates[key].name,plano:$('#wf-template-plan').value,pre:$('#wf-template-pre').value};if(action==='template-save')(config().templates??={})[key]=template;else{const parent=(days()[D]||(S.days[D]={chk:{}})),day=typeof MDM!=='undefined'&&MDM==='us'?(parent.us??={chk:{}}):parent;M.applyTemplate(day,template);parent.u=Date.now()}save();$('#wf-dialog')?.close();render();return}
    if(action==='undo-batch'){const batch=config().importBatches?.find(b=>b.id===id);if(!batch||!confirm('Desfazer alterações deste lote que não foram editadas depois?'))return;const result=M.undoBatch(S,batch);save();render();toast(`${result.removed} removida(s), ${result.restored} restaurada(s), ${result.skipped.length} preservada(s).`);return}
    if(action==='home-up'||action==='home-down'){const row=button.closest('[data-home-key]');if(action==='home-up'&&row.previousElementSibling)row.parentNode.insertBefore(row,row.previousElementSibling);else if(action==='home-down'&&row.nextElementSibling)row.parentNode.insertBefore(row.nextElementSibling,row);return}
    if(action==='home-save'){const rows=[...document.querySelectorAll('#wf-home-order [data-home-key]')];config().home={order:rows.map(r=>r.dataset.homeKey),hidden:rows.filter(r=>!r.querySelector('input').checked).map(r=>r.dataset.homeKey)};save();$('#wf-dialog')?.close();render();return}
    if(action==='journal-save'){config().journal={mode:$('#wf-journal-mode').value,tickers:$('#wf-journal-tickers').value.split(',').map(t=>t.trim().toUpperCase()).filter(Boolean),hidden:[...document.querySelectorAll('[data-journal-editor]')].filter(e=>!e.checked).map(e=>e.dataset.journalEditor)};save();$('#wf-dialog')?.close();toast('Preferências do PDF salvas.');return}
    if(action==='status'){tab='status';$('#wf-dialog')?.close();render()}
  },true);
})();
