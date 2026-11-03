/* módulo: trader-ui.js */
/* Ciclo da interface: um único adaptador para os módulos atuais.
 * Mantém a ordem de antes/depois e o retorno do código legado.
 * Os callbacks são síncronos; consultas devem terminar chamando render depois.
 */
(function (root) {
  'use strict';
  if (root.TraderUI) return;
  const renderHooks = new Map();
  const sheetHooks = new Map();
  const timings = [];
  const now = () => root.performance?.now?.() ?? Date.now();

  function register(registry, id, hooks) {
    if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{1,63}$/.test(id)) {
      throw new TypeError('Identificador de módulo inválido.');
    }
    const entry = typeof hooks === 'function' ? {after: hooks} : {...hooks};
    if (!entry || (!entry.before && !entry.after)) throw new TypeError('Informe um callback.');
    for (const key of ['before', 'after']) {
      if (entry[key] != null && typeof entry[key] !== 'function') throw new TypeError('Callback inválido.');
    }
    registry.set(id, entry);
    return () => { if (registry.get(id) === entry) registry.delete(id); };
  }

  function invoke(base, registry, receiver, args) {
    const started = now();
    let failed = true;
    try {
    // Uma captura por ciclo: mudanças de registro valem na próxima atualização.
    const hooks = [...registry.values()];
    const states = new Map();
    for (let i = hooks.length - 1; i >= 0; i--) {
      const hook = hooks[i];
      if (hook.before) states.set(hook, hook.before.apply(receiver, args));
    }
    const result = base.apply(receiver, args);
    for (const hook of hooks) if (hook.after) hook.after.call(receiver, states.get(hook), ...args);
    failed = false;
    return result;
    } finally {
      timings.push({kind: registry === renderHooks ? 'render' : 'sheet', ms: Math.max(0, now() - started), failed});
      if (timings.length > 100) timings.shift();
    }
  }

  const originalRender = render0;
  render0 = function () { return invoke(originalRender, renderHooks, this, [...arguments]); };
  const originalSheet = showSheet;
  showSheet = function () { return invoke(originalSheet, sheetHooks, this, [...arguments]); };

  // Keep one scroll owner while a dialog, sheet or chat is open (including iOS).
  let scrollState=null;
  const overlaySelector='dialog[open],.pfmd,#sh .ov,.wf-chat-panel:not([hidden])';
  function refreshScroll(){
    if(!root.document?.documentElement)return;
    const active=[...document.querySelectorAll(overlaySelector)].some(el=>!el.hidden&&getComputedStyle(el).display!=='none');
    if(active&&!scrollState){const b=document.body;scrollState={x:root.scrollX||0,y:root.scrollY||0,styles:{}};for(const key of ['position','top','left','right','width'])scrollState.styles[key]=b.style[key];b.classList.add('ui-overlay-open');b.style.position='fixed';b.style.top=-scrollState.y+'px';b.style.left='0';b.style.right='0';b.style.width='100%';}
    else if(!active&&scrollState){const previous=scrollState;scrollState=null;const b=document.body;for(const [key,value]of Object.entries(previous.styles))b.style[key]=value;b.classList.remove('ui-overlay-open');root.scrollTo(previous.x,previous.y);}
  }
  let pending=false;
  if(root.document?.body&&root.MutationObserver)new root.MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refreshScroll()})}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','class']});

  root.TraderUI = Object.freeze({
    refreshScroll,
    onRender: (id, hooks) => register(renderHooks, id, hooks),
    onSheet: (id, hooks) => register(sheetHooks, id, hooks),
    inspect: () => ({render: [...renderHooks.keys()], sheet: [...sheetHooks.keys()]}),
    metrics: () => {
      const values = timings.filter(t => t.kind === 'render').map(t => t.ms).sort((a, b) => a - b);
      return {samples: values.length, p95: values.length ? values[Math.ceil(values.length * .95) - 1] : null,
        last: timings.at(-1)?.ms ?? null, failures: timings.filter(t => t.failed).length};
    }
  });
})(window);

;
/* módulo: terminal-workflows.js */
/* Espaços integrados e pesquisa por ativo. Usa dados e funções já existentes no terminal. */
(function(root){
 'use strict';
 const presets={abertura:{name:'Pré-abertura',panels:['WEI','ECO','WIRP','TOP']},brasil:{name:'Pesquisa Brasil',panels:['MON','PETR4 G','PETR4 FA','N PETR4']},exterior:{name:'Pesquisa EUA',panels:['WEI','SPY G','SPY FA','N EUA']},macro:{name:'Macro e juros',panels:['WIRP','ECST','GC','ECO']}};
 const commands=[['PESQUISA','Ficha integrada do ativo'],['COMPF','Comparar fundamentos'],['RADAR','Filtros de empresas'],['RISCO','Pesquisa da carteira'],['FLUXO','Negócios recebidos da ponte'],['MESA','Espaços de trabalho integrados'],['ATIVO','Dossiê: gráfico, fundamentos e notícias'],['COMPARAR','Comparar de dois a quatro ativos'],['VOLTAR','Voltar ao espaço anterior'],['GUIA','Guia rápido do terminal']];
 const api=()=>root.TRM,valid=value=>/^[A-Z0-9.!:]{1,18}$/.test(value),normalize=value=>String(value||'').trim().toUpperCase().replace(/\s+(?:<GO>|GO)$/,'');
 function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el}
 function button(text,fn){const b=node('button',text,'trpro-button');b.type='button';b.addEventListener('click',fn);return b}
 function dialog(title){document.getElementById('trpro-dialog')?.close();const box=node('dialog',null,'trpro-dialog');box.id='trpro-dialog';box.setAttribute('aria-label',title);const h=node('header');h.append(node('h2',title),button('Fechar',()=>box.close()));box.append(h);box.addEventListener('close',()=>box.remove());document.body.append(box);box.showModal();return box}
 function selectWorkspace(id){const a=api(),state=a?.TS();if(!state?.wss?.[id])return false;const prefs=state.prof??={history:[]};if(state.ws!==id){prefs.history=[...(prefs.history||[]).filter(k=>k!==state.ws),state.ws].filter(Boolean).slice(-12);state.ws=id}a.TR.foco=0;a.TR.mob=0;a.TR.max=-1;if(typeof save==='function')save();if(typeof render==='function')render();return true}
 function createWorkspace(id,name,panels){const state=api()?.TS();if(!state?.wss)throw Error('Espaços do terminal não estão disponíveis.');if(!state.wss[id])state.wss[id]={n:name,p:panels.slice(),g:panels.map((_,i)=>({x:i%2*6,y:Math.floor(i/2)*13,w:6,h:13}))};return selectWorkspace(id)}
 function openWorkspace(key){const p=presets[key];if(!p)return false;return createWorkspace('prof_'+key,p.name,p.panels)}
 function dossier(ticker){ticker=normalize(ticker);if(!valid(ticker))throw Error('Informe um ticker válido, por exemplo PETR4 ou AAPL.');return createWorkspace('prof_ativo_'+ticker,'Pesquisa · '+ticker,[ticker+' DES',ticker+' G',ticker+' FA','N '+ticker])}
 function back(){const state=api()?.TS(),history=state?.prof?.history||[];let previous;while(history.length&&!previous){const id=history.pop();if(state.wss[id]&&id!==state.ws)previous=id}if(!previous){if(typeof toast==='function')toast('Nenhum espaço anterior registrado.');return false}state.ws=previous;api().TR.foco=0;api().TR.mob=0;api().TR.max=-1;if(typeof save==='function')save();if(typeof render==='function')render();return true}
 function open(){const box=dialog('Espaços de trabalho');box.append(node('p','Organize funções em quatro painéis. Seus espaços existentes são preservados.','trpro-note'));const list=node('div',null,'trpro-presets');for(const [key,p]of Object.entries(presets))list.append(button(p.name+' · '+p.panels.join(' / '),()=>{openWorkspace(key);box.close()}));box.append(list);const state=api()?.TS();if(state?.wss){box.append(node('h3','Seus espaços'));for(const [id,w]of Object.entries(state.wss))box.append(button(w.n||id,()=>{selectWorkspace(id);box.close()}))}}
 function ask(kind,arg){const box=dialog(kind==='ATIVO'?'Pesquisa por ativo':'Comparação de ativos'),form=node('form'),label=node('label',kind==='ATIVO'?'Ticker':'De dois a quatro tickers, separados por espaço'),input=node('input');input.id='trpro-tickers';input.value=arg||'';input.placeholder=kind==='ATIVO'?'PETR4':'PETR4 VALE3 IBOV';input.autocomplete='off';label.htmlFor=input.id;const submit=node('button','Abrir','trpro-button');submit.type='submit';const status=node('p',null,'trpro-note');status.setAttribute('role','status');form.append(label,input,submit,status);form.addEventListener('submit',event=>{event.preventDefault();try{if(kind==='ATIVO')dossier(input.value);else{const tickers=[...new Set(normalize(input.value).split(/[\s,;]+/).filter(Boolean))];if(tickers.length<2||tickers.length>4||tickers.some(t=>!valid(t)))throw Error('Use de dois a quatro tickers válidos.');if(!api()?.FN?.COMP)throw Error('Comparação indisponível nesta instalação.');api().roda('COMP '+tickers.join(' '))}box.close()}catch(error){status.textContent=error.message}});box.append(form);input.focus()}
 function guide(){const box=dialog('Guia do terminal');const items=[['Ctrl + Espaço','Buscar funções, favoritos e recentes'],['Ativo + função','PETR4 G, PETR4 FA ou N PETR4'],['MESA','Abrir espaços de trabalho sem apagar os atuais'],['ATIVO PETR4','Criar um espaço integrado de pesquisa'],['COMPARAR','Abrir comparação de ativos'],['VOLTAR','Recuperar o espaço anterior'],['Alt + 1 até 9','Selecionar um painel existente'],['DQ','Conferir fontes e referências dos dados']];for(const [name,text]of items){const p=node('p');p.append(node('b',name+' · '),node('span',text));box.append(p)}box.append(node('p','Cotações e recursos dependem das fontes conectadas. Este aplicativo não usa dados ou serviços Bloomberg.','trpro-note'))}
 function execute(value){const parts=normalize(value).split(/\s+/),cmd=parts.shift(),arg=parts.join(' ');if(!commands.some(([key])=>key===cmd))return false;if(['PESQUISA','COMPF','RADAR','RISCO','FLUXO'].includes(cmd)){root.TerminalResearch?.open(({PESQUISA:'ativo',COMPF:'comparar',RADAR:'radar',RISCO:'risco',FLUXO:'fluxo'})[cmd],arg||undefined);return true}if(cmd==='MESA')open();if(cmd==='ATIVO')arg?dossier(arg):ask(cmd);if(cmd==='COMPARAR')ask(cmd,arg);if(cmd==='VOLTAR')back();if(cmd==='GUIA')guide();return true}
 root.addEventListener('click',event=>{
   if(!event.target.closest?.('[data-tr="go"]')||!document.body.classList.contains('trmon'))return;
   const input=document.getElementById('trcmd');if(!input||!commands.some(([cmd])=>normalize(input.value).split(/\s+/)[0]===cmd))return;
   event.preventDefault();event.stopImmediatePropagation();try{execute(input.value);input.value=''}catch(error){if(typeof toast==='function')toast(error.message)}
 },true);
 root.addEventListener('keydown',event=>{if(!document.body.classList.contains('trmon')||event.isComposing)return;if(event.target?.id==='trcmd'&&event.key==='Enter'&&commands.some(([cmd])=>normalize(event.target.value).split(/\s+/)[0]===cmd)){event.preventDefault();event.stopImmediatePropagation();try{execute(event.target.value);event.target.value=''}catch(error){if(typeof toast==='function')toast(error.message)}return}if(event.altKey&&!event.ctrlKey&&!event.metaKey&&/^[1-9]$/.test(event.key)&&!event.target.closest('input,textarea,select,[contenteditable=true]')){const i=Number(event.key)-1;if(i<api().layAtual().p.length){event.preventDefault();api().TR.foco=i;api().TR.mob=i;if(typeof render==='function')render()}}},true);
 root.TraderTerminalActions={commands,presets,execute,openWorkspace,dossier,selectWorkspace,back};
})(typeof window==='undefined'?globalThis:window);

;
/* módulo: terminal-praticidade.js */
/* Atalhos e busca de comandos do Diário Terminal. Sem bibliotecas externas. */
(function () {
  'use strict';
  const CORE = [
    ['WEI', 'Índices mundiais', 'Mercado'], ['MON', 'Minha lista de ativos', 'Mercado'],
    ['ECO', 'Agenda econômica', 'Macro'], ['WIRP', 'Expectativas de juros', 'Macro'],
    ['TOP', 'Principais notícias', 'Notícias'], ['DQ', 'Qualidade e origem dos dados', 'Dados'],
    ['ESPACO', 'Escolher espaço de trabalho', 'Navegação'], ['HELP', 'Ajuda e comandos', 'Navegação'],
  ];
  let dialog, search, results, announcement, active = 0, rows = [], filter = 'all', focusBefore, scheduled = false;
  const api = () => window.TRM;
  const isTerminal = () => document.body.classList.contains('trmon') && !!document.querySelector('.trbar');
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const command = value => typeof value === 'string' ? value.trim().slice(0, 180) : '';
  function favorites() {
    const values = api()?.TS()?.favoritos;
    return Array.isArray(values) ? [...new Set(values.map(command).filter(Boolean))].slice(0, 24) : [];
  }
  function remember(values) {
    api().TS().favoritos = values.slice(0, 24);
    if (typeof save === 'function') save();
    mount();
  }
  function current() {
    const a = api(); if (!a) return '';
    const layout = a.layAtual();
    return command(layout.p[a.TR.foco] || layout.p[0] || '');
  }
  function ticker() {
    try { return command(api().parse(current())?.tk); } catch { return ''; }
  }
  function run(value) {
    const text = command(value); if (!text || !api()) return;
    close();
    if(window.TraderTerminalActions?.execute(text))return;
    api().roda(text);
    const input = document.getElementById('trcmd');
    if (input) { input.value = ''; input.focus(); }
    queueMount();
  }
  function node(tag, cls, text) {
    const element = document.createElement(tag); if (cls) element.className = cls;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function button(label, action, cls = 'trbtn') {
    const b = node('button', cls, label); b.type = 'button'; b.addEventListener('click', action); return b;
  }
  function toggle(value) {
    const text = command(value); if (!text) return;
    const old = favorites();
    remember(old.includes(text) ? old.filter(x => x !== text) : [text, ...old]);
    if (dialog?.open) draw();
  }
  function catalog(query) {
    const map = new Map(CORE.map(([cmd, name, category]) => [cmd, {cmd, name, category}]));
    for (const [cmd, description] of Object.entries(api()?.FN || {})) {
      if (/^[A-Z0-9_]{1,20}$/.test(cmd) && typeof description === 'string' && !map.has(cmd))
        map.set(cmd, {cmd, name: description.slice(0, 150), category: 'Comandos'});
    }
    for(const [cmd,name] of window.TraderTerminalActions?.commands||[])map.set(cmd,{cmd,name,category:'Fluxos integrados'});
    const tk = ticker();
    if (tk) for (const [suffix, label] of [['G', 'Gráfico'], ['DES', 'Visão da empresa'], ['FA', 'Fundamentos']]) {
      const cmd = tk + ' ' + suffix; map.set(cmd, {cmd, name: label + ' · ' + tk, category: 'Ativo do painel'});
    }
    if (tk) map.set('N ' + tk, {cmd: 'N ' + tk, name: 'Notícias · ' + tk, category: 'Ativo do painel'});
    const fav = favorites(), recent = (api()?.TR.hist || []).map(command).filter(Boolean).slice(0, 20);
    for (const cmd of [...fav, ...recent]) if (!map.has(cmd)) map.set(cmd, {cmd, name: cmd, category: 'Seus comandos'});
    const q = normalize(query).trim();
    const items = [...map.values()].filter(item => (!q || normalize(item.cmd + ' ' + item.name + ' ' + item.category).includes(q)) && (filter !== 'favorites' || fav.includes(item.cmd)) && (filter !== 'recent' || recent.includes(item.cmd)));
    const rank = item => q && normalize(item.cmd).startsWith(q) ? -100 : fav.includes(item.cmd) ? -50 : recent.includes(item.cmd) ? -20 + recent.indexOf(item.cmd) : 0;
    return items.sort((a,b) => rank(a) - rank(b) || a.cmd.localeCompare(b.cmd)).slice(0, 60);
  }
  function select(index) {
    if (!rows.length) return;
    active = Math.max(0, Math.min(index, rows.length - 1));
    [...results.querySelectorAll('[data-command]')].forEach((row, i) => {
      row.classList.toggle('selected', i === active);
      row.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    results.children[active]?.scrollIntoView({block:'nearest'});
    if (announcement) announcement.textContent = rows[active].cmd + '. ' + rows[active].name + '. Enter para abrir.';
  }
  function draw() {
    rows = catalog(search.value); active = 0; results.replaceChildren();
    const fav = favorites();
    if (!rows.length) results.append(node('p','trquick-empty','Nenhum comando encontrado. Tente “gráfico”, “juros” ou “notícias”.'));
    rows.forEach((item, index) => {
      const row = node('div','trquick-row');
      const open = button('', () => run(item.cmd), 'trquick-open');
      open.dataset.command = item.cmd; open.id = 'trquick-option-' + index;
      open.append(node('b','',item.cmd),node('span','',item.name),node('small','',item.category));
      const star = button(fav.includes(item.cmd) ? '★' : '☆', () => toggle(item.cmd), 'trquick-star');
      star.setAttribute('aria-label', (fav.includes(item.cmd) ? 'Remover favorito ' : 'Favoritar ') + item.cmd);
      star.setAttribute('aria-pressed', String(fav.includes(item.cmd)));
      row.append(open,star);results.append(row);
    });
    select(0);
  }
  function close() {
    if (!dialog?.open) return;
    dialog.close();
    if (focusBefore?.isConnected) focusBefore.focus();
  }
  function show() {
    if (!isTerminal()) return;
    if (!dialog) {
      dialog = node('dialog','trquick-dialog');dialog.setAttribute('aria-labelledby','trquick-title');
      const head = node('div','trquick-head');
      const title = node('h2','','Encontrar um comando');title.id='trquick-title';
      head.append(title,button('Fechar',close));
      search = node('input','trquick-search');search.type='search';search.placeholder='Busque uma função, assunto ou comando…';
      search.setAttribute('aria-label','Buscar comandos do terminal');search.autocomplete='off';
      search.addEventListener('input',draw);
      const tabs=node('div','trquick-filters');
      for(const [id,label] of [['all','Todos'],['favorites','Favoritos'],['recent','Recentes']]) {
        const tab=button(label,()=>{filter=id;for(const b of tabs.children)b.setAttribute('aria-pressed',String(b===tab));draw();},'trquick-filter');
        tab.setAttribute('aria-pressed',String(id==='all'));tabs.append(tab);
      }
      results=node('div','trquick-results');results.setAttribute('aria-label','Comandos encontrados');
      const hint=node('p','trquick-hint','↑ ↓ selecionar · Enter abrir · Esc fechar · Ctrl + Espaço buscar');
      announcement=node('p','trquick-announcement');announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');
      dialog.append(head,search,tabs,results,hint,announcement);document.body.append(dialog);
      dialog.addEventListener('keydown',event=>{
        if(event.target!==search)return;
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();select(active+(event.key==='ArrowDown'?1:-1));}
        else if(event.key==='Enter'&&rows[active]){event.preventDefault();run(rows[active].cmd);}
      });
      dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
      dialog.addEventListener('close',()=>{if(focusBefore?.isConnected)focusBefore.focus();});
    }
    if(dialog.open){search.focus();return;}
    focusBefore=document.activeElement;search.value='';draw();dialog.showModal();search.focus();
  }
  function mount() {
    if (!isTerminal()) { close();return; }
    const bar=document.querySelector('.trbar');
    if(!bar.querySelector('[data-quick-open]')) {
      const b=button('Comandos',show);b.dataset.quickOpen='';b.title='Buscar comandos (Ctrl + Espaço)';
      bar.insertBefore(b,bar.querySelector('[data-tr="sair"]'));
    }
    let strip=document.querySelector('.trquick-strip');
    if(!strip){strip=node('div','trquick-strip');bar.insertAdjacentElement('afterend',strip);}
    const now=current(), fav=favorites(), tk=ticker(), signature=JSON.stringify([now,fav]);
    if(strip.dataset.signature===signature)return;
    strip.dataset.signature=signature;strip.replaceChildren();
    const pin=button((fav.includes(now)?'★ ':'☆ ')+now,()=>toggle(now),'trquick-chip');
    pin.title='Favoritar o comando do painel selecionado';pin.setAttribute('aria-pressed',String(fav.includes(now)));strip.append(pin);
    if(!strip.querySelector('[data-workspace-open]')){const workspace=button('Espaços',()=>window.TraderTerminalActions?.execute('MESA'),'trquick-chip');workspace.dataset.workspaceOpen='';strip.append(workspace);strip.append(button('Guia',()=>window.TraderTerminalActions?.execute('GUIA'),'trquick-chip'));}
    if(tk)strip.append(button('Pesquisar '+tk,()=>window.TraderTerminalActions?.execute('ATIVO '+tk),'trquick-chip'));
    if(tk) for(const [suffix,label] of [['G','Gráfico'],['FA','Fundamentos']])strip.append(button(label,()=>run(tk+' '+suffix),'trquick-chip'));
    strip.append(button('Qualidade dos dados',()=>run('DQ'),'trquick-chip'));
    if(fav.length) { strip.append(node('span','trquick-label','Favoritos'));for(const cmd of fav.slice(0,6))strip.append(button(cmd,()=>run(cmd),'trquick-chip favorite')); }
    strip.append(node('span','trquick-key','Ctrl + Espaço'));
  }
  function queueMount(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
  document.addEventListener('keydown',event=>{
    if(isTerminal()&&(event.ctrlKey||event.metaKey)&&event.code==='Space'&&!event.isComposing){event.preventDefault();event.stopImmediatePropagation();show();}
  },true);
  document.addEventListener('pointerup',event=>{if(event.target.closest?.('.trp,.trtabs,.trbar'))queueMount();});
  new MutationObserver(changes=>{
    if(changes.some(change=>[...change.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.trm,.trbar')||n.querySelector?.('.trbar')))))queueMount();
  }).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  window.DiarioTerminalTools={show,catalog,run};
  queueMount();
})();

;
/* módulo: diario-profissional.js */
/* Apresentação da rotina. Usa os formulários e a persistência do diário existente. */
(() => {
  'use strict';
  const app = () => document.getElementById('app');
  const rulesCount = day => (S.rules || []).reduce((n, rule) => n + !!(day.chk || {})[rule.id], 0);
  const hasText = value => typeof value === 'string' && value.trim().length > 0;
  function routine() {
    const day = S.days[loc().slice(0, 10)] || {};
    const done = rulesCount(day), total = (S.rules || []).length;
    const trades = (S.trades || []).filter(trade => String(trade.dt || '').slice(0,10) === loc().slice(0,10));
    const steps = [hasText(day.plano), trades.length > 0, hasText(day.resumo)];
    const card = document.createElement('section');
    card.className = 'routine-card';
    card.setAttribute('aria-labelledby', 'routine-title');
    card.innerHTML = `<div class="routine-heading"><div><span class="routine-eyebrow">DIÁRIO · BRASIL</span><h2 id="routine-title">Sua rotina de hoje</h2><p>Prepare o dia. Registre suas decisões. Revise o processo.</p></div></div>
      <div class="routine-progress"><span>${steps.filter(Boolean).length} de 3 etapas com registro</span><progress max="3" value="${steps.filter(Boolean).length}" aria-label="Etapas da rotina com registro"></progress></div><div class="routine-steps">
        <button type="button" data-routine="pre"><span class="routine-number">01</span><span><b>Preparar</b><small>${hasText(day.plano) ? 'Plano registrado' : 'Estado, limites e plano do dia'}</small></span><span aria-hidden="true">›</span></button>
        <button type="button" data-routine="dur"><span class="routine-number">02</span><span><b>Registrar</b><small>${trades.length ? trades.length + ' trade(s) registrado(s) hoje' : 'Trades, emoções e decisões'}</small></span><span aria-hidden="true">›</span></button>
        <button type="button" data-routine="pos"><span class="routine-number">03</span><span><b>Revisar</b><small>${hasText(day.resumo) ? 'Reflexão registrada' : 'Aprendizados e regras seguidas'}</small></span><span aria-hidden="true">›</span></button>
      </div><div class="routine-footer"><span>Regras seguidas: <b>${done} de ${total}</b></span><button type="button" class="btn s" data-routine="checklist">${total ? 'Revisar checklist' : 'Definir minhas regras'}</button></div>`;
    return card;
  }
  function checklistProgress(root) {
    const inputs = [...root.querySelectorAll('input[data-chk]')];
    if (!inputs.length) return;
    const container = inputs[0].closest('.card');
    if (!container) return;
    container.classList.add('journal-checklist');
    let status = container.querySelector('.checklist-progress');
    if (!status) {
      status = document.createElement('div');
      status.className = 'checklist-progress';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      container.prepend(status);
    }
    const done = inputs.filter(input => input.checked).length;
    status.textContent = `${done} de ${inputs.length} regras seguidas · marque após avaliar suas operações`;
    inputs.forEach(input => input.closest('label')?.classList.toggle('checklist-done', input.checked));
  }
  function enhance() {
    const root = app();
    if (!root) return;
    root.classList.toggle('journal-view', tab === 'dia');
    root.classList.toggle('home-view', tab === 'home');
    if (tab === 'home' && !root.querySelector('.routine-card')) root.prepend(routine());
    root.querySelectorAll('.mc,.cal').forEach(grid => {
      grid.classList.add('month-grid');
      const head = grid.previousElementSibling;
      if (head?.classList.contains('top')) head.classList.add('calendar-heading');
      grid.querySelectorAll('button[data-a="cday"]').forEach(button => {
        const date = button.dataset.id;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return;
        const description = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {day:'numeric',month:'long',year:'numeric'});
        button.setAttribute('aria-label', `Abrir diário de ${description}`);
        if (date === loc().slice(0,10)) button.setAttribute('aria-current', 'date');
      });
    });
    root.querySelectorAll('button[data-a="cm"],button[data-a="tsm"]').forEach(button => {
      button.setAttribute('aria-label', Number(button.dataset.id) < 0 ? 'Mês anterior' : 'Próximo mês');
    });
    if (tab === 'dia') checklistProgress(root);
    root.querySelectorAll('button[data-a="dprev"],button[data-a="dnext"]').forEach(button => {
      button.setAttribute('aria-label', button.dataset.a === 'dprev' ? 'Dia anterior' : 'Próximo dia');
    });
    root.querySelectorAll('input#dd').forEach(input => input.setAttribute('aria-label', 'Data do diário'));
    const emotions = {'😫':'Muito mal', '😕':'Mal', '😐':'Neutro', '🙂':'Bem', '😄':'Muito bem'};
    root.querySelectorAll('.chips2 button').forEach(button => {
      const label = emotions[button.textContent.trim()];
      if (label) {
        button.setAttribute('aria-label', 'Estado emocional: ' + label);
        button.setAttribute('aria-pressed', String(button.classList.contains('on')));
      }
    });
    // Nomes explícitos continuam visíveis mesmo quando um tema troca os ícones.
    document.querySelectorAll('button[data-a="deltrade"]').forEach(button => {
      button.textContent = delArm ? 'Confirmar exclusão' : 'Excluir trade';
      button.setAttribute('aria-label', button.textContent);
    });
  }
  window.TraderUI.onRender('diario-profissional', enhance);
  window.TraderUI.onSheet('diario-profissional', enhance);
  document.addEventListener('change', event => {
    if (event.target.matches('input[data-chk]') && app()) checklistProgress(app());
  });
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-routine]');
    if (!action) return;
    const target = action.dataset.routine;
    D = loc().slice(0, 10);
    DV = 'ed';
    if (typeof mdmSet === 'function') mdmSet('br');
    if (target === 'checklist' && !S.rules.length) tab = 'regras';
    else { tab = 'dia'; DFASE = {d: D, f: target === 'checklist' ? 'pos' : target}; }
    render();
    if (target === 'checklist') {
      const first = app()?.querySelector('input[data-chk]');
      first?.closest('.card')?.scrollIntoView({block:'center'});
      first?.focus({preventScroll:true});
    } else window.scrollTo(0,0);
  });
  enhance();
})();

;
/* módulo: mercado-profissional.js */
/* Navegação única e estudos dos EUA. Integra as telas existentes. */
(() => {
  'use strict';
  FN_ESPERADA.macro = 'v296';
  const groups = [
    {id:'home',name:'Início',icon:'home',description:'Resumo e rotina de hoje',items:[['home','Visão do dia']]},
    {id:'diario',name:'Diário',icon:'book',description:'Preparação, registro e revisão',items:[['dia:ed','Meu dia e checklist'],['dia:hist','Histórico do diário'],['regras','Minhas regras']]},
    {id:'operacoes',name:'Operações',icon:'chart',description:'Modalidades e desempenho',items:[['ops','Todas as modalidades'],['stats','Estatísticas'],['rev','Revisão da semana']]},
    {id:'mercado',name:'Mercado',icon:'news',description:'Contexto, monitor e sazonalidade',items:[['mercado:mu','Panorama global'],['mercado:jr','Jornal do Pregão'],['mercado:ag','Agenda econômica'],['mercado:nt','Notícias'],['juros','Juros e DI'],['mercado:lab','Sazonalidade e sentimento'],['graf','Gráficos'],['mercado:cq','Cotações e ADRs'],['live','Ponte do Profit e radar'],['mercado:al','Alertas'],['term','Terminal']]},
    {id:'patrimonio',name:'Patrimônio',icon:'wallet',description:'Carteiras, análise e impostos',items:[['carteiras','Carteiras Brasil e EUA'],['analise','Análise IA'],['imposto','Imposto de renda']]},
    {id:'gestao',name:'Gestão',icon:'shield',description:'Risco, capital e processo',items:[['mesa','Mesa proprietária'],['painel','Metas, posição e backup'],['contratos','Dimensionamento de contratos'],['carreira','Plano de transição']]},
    {id:'estudos',name:'Estudos',icon:'book',description:'Biblioteca, cursos e simulados',items:[['estudos','Central de estudos']]},
    {id:'conta',name:'Configurações',icon:'gear',description:'Conta, dados e preferências',items:[['conta','Conta e sincronização'],['import','Importar operações'],['mais','Aparência'],['status','Status das fontes']]},
  ];
  const marketGroups = [
    {name:'Panorama',items:[['mercado:mu','Mundo'],['juros','Juros e DI'],['mercado:giro','Giro'],['mercado:pn','Painel']]},
    {name:'Informação',items:[['mercado:jr','Jornal do Pregão'],['mercado:nt','Notícias'],['mercado:ag','Agenda econômica']]},
    {name:'Estudos',items:[['mercado:lab','Sazonalidade e sentimento'],['graf','Gráficos']]},
    {name:'Monitor',items:[['mercado:cq','Cotações e ADRs'],['live','Profit e radar'],['mercado:al','Alertas'],['term','Terminal']]},
  ];
  const safe = value => esc(String(value ?? ''));
  const current = () => tab === 'mercado' ? `mercado:${['saz','se','sazus'].includes(MKT.tab)?'lab':MKT.tab==='cot'?'cq':MKT.tab}` : tab==='dia'?`dia:${DV==='hist'?'hist':'ed'}`:tab;
  const activeGroup = () => groups.find(group=>group.items.some(([route])=>route===current()))?.id || (['trades','swing','opc','ativos','dash','opgrade','opfluxo','opcart','swbt','dtrpy'].includes(tab)?'operacoes':'');
  const icon = name => window.icoSvg ? window.icoSvg(name) : '';
  const link = ([route,name],cls='') => `<button type="button" class="${cls}" data-navroute="${safe(route)}"${current()===route?' aria-current="page"':''}>${safe(name)}</button>`;
  function menu(panel) {
    panel.innerHTML = `<div class="pro-menu-header"><div><small>DIÁRIO DE TRADER</small><b>Seu espaço de trabalho</b></div><button type="button" data-navclose aria-label="Fechar menu">×</button></div>
      <label class="pro-menu-search">Encontrar função<input type="search" data-navsearch placeholder="Diário, sazonalidade, risco…" autocomplete="off"></label>
      <div class="pro-menu-groups">${groups.map(group=>`<details class="pro-menu-group" data-navgroup="${group.id}"${activeGroup()===group.id?' open':''}><summary><span class="pro-menu-icon">${icon(group.icon)}</span><span><b>${group.name}</b><small>${group.description}</small></span></summary><div>${group.items.map(item=>link(item)).join('')}${group.id==='mercado'?'<button type="button" data-research-menu>Pesquisa de investimentos</button><button type="button" data-flow-menu>Fluxo de negócios · Profit</button>':''}${group.id==='home'?'<button type="button" data-wf="organize-home">Organizar início</button>':''}${group.id==='conta'?'<button type="button" data-wf="quality">Dados e fontes</button><button type="button" data-wf="reports">Relatórios</button>':''}</div></details>`).join('')}</div>
      <p class="pro-menu-note">Diário e checklist no centro. Ferramentas agrupadas por tarefa.</p>`;
    panel.querySelector('[data-navclose]')?.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      const desktop=document.body.classList.contains('pc');
      document.body.classList.remove('pcmenu','trmenu');
      document.body.style.overflow='';
      if(!desktop){document.getElementById('mdr2')?.remove();document.getElementById('mdr')?.remove()}
      document.getElementById(desktop?'pcmenub':'mbtn')?.focus();
    });
    panel.querySelector('[data-navsearch]')?.addEventListener('input',event=>{
      const query=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      panel.querySelectorAll('[data-navgroup]').forEach(element=>{
        let any=false;
        element.querySelectorAll('[data-navroute],[data-wf],[data-research-menu],[data-flow-menu]').forEach(button=>{
          const match=button.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query);
          button.hidden=!match;any ||= match;
        });
        element.hidden=!any;
        element.open=query?any:element.dataset.navgroup===activeGroup();
      });
    });
  }
  window.DIARIO_NAV = {groups,marketGroups,menu,navigate};
  const existingMenu=document.querySelector?.('#mdr2 .pn');
  if(existingMenu)menu(existingMenu);
  // As abas internas seguem os mesmos grupos do menu, sem taxonomia paralela.
  grpHeader = function(route) {
    const group=groups.find(g=>g.items.some(([key])=>key===route));
    return !group||group.items.length<2?'':`<div class="pro-subtabs" role="navigation" aria-label="${safe(group.name)}">${group.items.map(item=>link(item,item[0]===route?'on':'')).join('')}</div>`;
  };
  function navigate(route) {
    if(route==='mercado:cot')route='mercado:cq';
    const [screen,sub]=route.split(':');
    if(screen==='dia'){DV=sub||'ed';tab='dia'}
    else if(screen==='mercado'){tab='mercado';MKT.tab=sub||'mu';try{ls.set('diario-mkt-tab',MKT.tab)}catch{}}
    else {tab=screen;if(['trades','swing','opc'].includes(screen))LT=screen}
    document.getElementById('mdr2')?.remove();
    document.getElementById('mdr')?.remove();
    document.body.style.overflow='';
    render();window.scrollTo(0,0);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-navroute]');
    if(!button)return;
    navigate(button.dataset.navroute);
  });
  // Um único conjunto de abas para todas as telas de mercado.
  segM = function () {
    const selected=current(), group=marketGroups.find(g=>g.items.some(([route])=>route===selected))||marketGroups[0];
    return `<div class="workbench-header"><span class="routine-eyebrow">CONTEXTO DE MERCADO</span><div class="market-heading"><h1>Mercado</h1><div><button class="btn s" data-navroute="term">Abrir terminal</button><button class="btn s" data-market-chat>Economista IA</button></div></div><p>Panorama, leitura e acompanhamento em um só espaço.</p></div><div class="pro-tabs" role="navigation" aria-label="Áreas do mercado">${marketGroups.map(g=>link([g.items[0][0],g.name],g===group?'on':'')).join('')}</div>${group.items.length>1?`<div class="pro-subtabs" role="navigation" aria-label="Ferramentas de ${safe(group.name)}">${group.items.map(item=>link(item,current()===item[0]?'on':'')).join('')}</div>`:''}`;
  };
  // Preferências deixa de repetir todas as ferramentas já presentes no menu.
  const previousMore=vMais;
  const density=()=>{try{return ls.get('diario-densidade-v284')==='compact'?'compact':'comfortable'}catch{return 'comfortable'}};
  const applyDensity=()=>document.documentElement?.setAttribute('data-density',density());
  applyDensity();
  vMais=function(){const html=previousMore.apply(this,arguments),start=html.indexOf('<h2>Apar');return '<h1>Preferências</h1><p class="mut">Personalize a aparência do seu espaço.</p>'+(start>=0?html.slice(start):html)+`<h2>Densidade da interface</h2><p class="mut sm">Confortável para escrever e usar no celular. Compacta para comparar mais informações no computador.</p><div class="pro-subtabs">${[['comfortable','Confortável'],['compact','Compacta']].map(([key,name])=>`<button type="button" data-prodensity="${key}" class="${density()===key?'on':''}" aria-pressed="${density()===key}">${name}</button>`).join('')}</div>`};

  const US={asset:'spx',view:'midterms',eventType:'midterm',window:'d1',cycle:2,month:new Date().getMonth()+1,value:null,busy:false,error:'',lastAttempt:0};
  const percent=x=>typeof x==='number'&&Number.isFinite(x)?`${x>0?'+':''}${x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`:'—';
  const cell=x=>`<span class="${x>0?'g':x<0?'r':'mut'}">${percent(x)}</span>`;
  const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  function studyTable(rows,label) {
    return `<div class="pro-table-scroll" tabindex="0" role="region" aria-label="${safe(label)}"><table class="us-table"><caption>${safe(label)}</caption><thead><tr><th scope="col">Período</th><th scope="col">Média</th><th scope="col">Mediana</th><th scope="col">Positivas</th><th scope="col">Amostra</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${safe(row.label)}</th><td>${cell(row.media)}</td><td>${cell(row.mediana)}</td><td>${row.positivas==null?'—':percent(row.positivas)}</td><td>${row.n}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function closingTable(asset) {
    const rows=(asset.catalogo||[]).filter(row=>US.eventType==='todas'||row.tipo===US.eventType);
    const number=x=>typeof x==='number'?x.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—';
    const point=(p,change)=>p?`${safe(p.d)}<br><b>${number(p.v)}</b><br>${cell(change)}`:'Sem fechamento';
    return `<details class="us-observations"><summary>Fechamentos D-1, D0 e D+1 · ${rows.filter(row=>row.concluida).length} eleições cobertas</summary><p class="sm mut">Preço de fechamento e variação contra o pregão anterior. D0 é a eleição. Quando não houve pregão em D0, o retorno posterior usa o último fechamento anterior; D0 permanece vazio. Dias sem histórico ficam vazios e não entram nas médias. Midterms desde 1950: 19 concluídas até 2022; a amostra varia conforme índice e janela.</p><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th>Ano / tipo</th><th>Eleição</th><th>D-1 · anterior</th><th>D0 · eleição</th><th>D+1 · seguinte</th></tr></thead><tbody>${rows.map(row=>`<tr><th>${row.ano}<br>${safe(row.tipo)}</th><td>${safe(row.data)}${row.concluida?'':'<br>Aguardando / sem histórico'}</td><td>${point(row.anterior,row.variacao_anterior)}</td><td>${point(row.dia,row.variacao_dia)}</td><td>${point(row.seguinte,row.variacao_seguinte)}</td></tr>`).join('')}</tbody></table></div></details>`;
  }
  function bodyUs() {
    const data=US.value;
    if(!data)return `<div class="card us-empty" role="status"><b>${US.busy?'Buscando séries históricas dos EUA…':'Histórico ainda não carregado'}</b><p>${safe(US.error||'Entre na conta para consultar os índices e calcular os estudos históricos.')}</p><button class="btn s" data-usrefresh${US.busy?' disabled':''}>${US.busy?'Aguarde':'Carregar histórico'}</button></div>`;
    const asset=data.ativos.find(a=>a.k===US.asset);
    if(!asset||asset.status!=='ok')return `<div class="card"><p>${safe(asset?.erro||'Este índice está indisponível.')}</p><button class="btn s" data-usrefresh>Tentar novamente</button></div>`;
    const rows=(US.view==='mensal'?asset.mensal:US.view==='ciclo'?asset.ciclo:asset.eleicoes?.[US.eventType]||asset.midterms)||[];
    const selected=rows.find(row=>US.view==='mensal'?row.mes===US.month:US.view==='ciclo'?row.fase===US.cycle:row.k===US.window)||rows[0];
    const title=US.view==='mensal'?'Mês a mês':US.view==='ciclo'?'Ciclo presidencial · anos civis':'Antes e depois das eleições';
    const options=rows.map(row=>{const value=US.view==='mensal'?row.mes:US.view==='ciclo'?row.fase:row.k;return `<option value="${safe(value)}"${row===selected?' selected':''}>${safe(US.view==='mensal'?monthNames[row.mes-1]:US.view==='ciclo'?`Ano ${row.fase} · ${row.nome}`:row.nome)}</option>`}).join('');
    const fullRows=rows.map(row=>({...row,label:US.view==='mensal'?monthNames[row.mes-1]:US.view==='ciclo'?`Ano ${row.fase} · ${row.nome}`:row.nome}));
    return `<div class="us-study"><div class="top"><div><h2>${title}</h2><p class="mut sm">${safe(asset.n)} · ${safe(asset.de)} a ${safe(asset.ate)} · USD</p></div><button class="btn s" data-usrefresh${US.busy?' disabled':''}>${US.busy?'Atualizando…':'Atualizar'}</button></div>
      ${US.error?`<p class="warn" role="status">${safe(US.error)} Exibindo a consulta anterior, de ${safe(new Date(data.gerado).toLocaleString('pt-BR'))}.</p>`:''}
      ${US.view==='midterms'?`<label>Tipo de eleição<select data-uselection>${[['midterm','Midterms'],['presidencial','Presidenciais'],['todas','Todas as eleições federais']].map(([key,name])=>`<option value="${key}"${US.eventType===key?' selected':''}>${name}</option>`).join('')}</select></label>`:''}
      <label>Janela de comparação<select data-usperiod>${options}</select></label>
      <div class="us-kpis"><div><span>Média histórica</span><b>${cell(selected?.media)}</b></div><div><span>Mediana</span><b>${cell(selected?.mediana)}</b></div><div><span>Janelas positivas</span><b>${selected?.positivas==null?'—':percent(selected.positivas)}</b></div><div><span>Amostra concluída</span><b>${selected?.n||0} ${US.view==='midterms'?'eleições':'anos'}</b></div></div>
      <p class="us-dispersion">Pior: ${cell(selected?.pior)} · Melhor: ${cell(selected?.melhor)} · Desvio dos retornos: ${percent(selected?.desvio)}</p>
      ${selected?.n<10?'<p class="us-caution">Amostra pequena: poucos eventos podem alterar bastante as médias.</p>':''}
      ${studyTable(fullRows,title)}
      ${US.view==='midterms'?closingTable(asset):''}
      <details class="us-observations"><summary>Conferir cada observação e suas datas</summary><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th scope="col">Ano</th><th scope="col">Fechamento inicial</th><th scope="col">Fechamento final</th><th scope="col">Retorno</th></tr></thead><tbody>${(selected?.observacoes||[]).map(row=>`<tr><th scope="row">${row.ano}</th><td>${safe(row.de)}</td><td>${safe(row.ate)}</td><td>${cell(row.valor)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhuma janela completa nesta amostra.</td></tr>'}</tbody></table></div></details>
      <details class="us-method"><summary>Metodologia e fontes</summary><p>${safe(data.metodo)}</p><p>Dados consultados em ${safe(new Date(data.gerado).toLocaleString('pt-BR'))}. Janelas positivas são frequência histórica, não probabilidade de alta futura. O desvio mede a dispersão entre retornos das janelas, não a volatilidade intradiária.</p><p><a href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a> · <a href="https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/" target="_blank" rel="noopener noreferrer">Calendário eleitoral da FEC</a></p></details></div>`;
  }
  function renderUs() {
    return `<section class="us-seasonality"><div class="pro-region"><button data-navroute="mercado:lab">Brasil e sentimento</button><button class="on" aria-current="page" data-navroute="mercado:sazus">EUA</button></div>
      <div class="us-intro"><span class="routine-eyebrow">SAZONALIDADE · EUA</span><h2>Calendário, ciclos e contexto</h2><p>Compare padrões históricos dos índices. Use como contexto para o seu plano, junto de preço, risco e cenário macro.</p></div>
      <div class="us-election-context"><b>O que são as midterms?</b><p>Eleições legislativas no meio do mandato presidencial. Elas podem mudar o controle do Congresso. A comparação abaixo agrupa os eventos por data, sem atribuir o retorno ao partido vencedor.</p>${US.value?.proxima_midterm?`<span>Próxima data: <b>${safe(US.value.proxima_midterm.split('-').reverse().join('/'))}</b></span>`:'<a href="https://www.usa.gov/midterm-elections" target="_blank" rel="noopener noreferrer">Consultar o calendário oficial</a>'}<p class="sm">Lucros, juros e surpresas de política econômica também afetam os preços. Médias históricas não isolam o efeito de uma eleição.</p></div>
      <label>Índice<select data-usasset>${[['spx','S&P 500'],['ndx','Nasdaq 100'],['dji','Dow Jones'],['rut','Russell 2000']].map(([key,name])=>`<option value="${key}"${US.asset===key?' selected':''}>${name}</option>`).join('')}</select></label>
      <div class="pro-subtabs" role="navigation" aria-label="Estudos históricos dos EUA">${[['mensal','Mês a mês'],['ciclo','Ciclo presidencial'],['midterms','Eleições']].map(([key,name])=>`<button data-usview="${key}" class="${US.view===key?'on':''}"${US.view===key?' aria-current="page"':''}>${name}</button>`).join('')}</div>
      <div id="us-study-body" aria-live="polite">${bodyUs()}</div><p class="us-footnote">Busca histórica desde 1950, conforme disponibilidade real de cada índice. Retornos em USD. Não é previsão, recomendação ou sinal de entrada.</p></section>`;
  }
  async function loadUs(force=false) {
    if(US.busy||(!force&&(US.value||Date.now()-US.lastAttempt<60000)))return;
    US.busy=true;US.error='';US.lastAttempt=Date.now();paintUs();
    try {
      const response=await rq('/functions/v1/macro',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modo:'sazonal_us'}),signal:AbortSignal.timeout(35000)});
      const data=await response.json();
      if(!Array.isArray(data.ativos)||data.versao!=='v285')throw new Error('Atualize a função macro para consultar o histórico ampliado dos EUA.');
      US.value=data;
    }catch(error){US.error=error.name==='TimeoutError'?'O histórico demorou a responder. Tente novamente.':String(error.message||error)}
    finally{US.busy=false;if(tab==='mercado'&&MKT.tab==='sazus')render()}
  }
  function paintUs(){const body=document.getElementById('us-study-body');if(body)body.innerHTML=bodyUs()}
  const previousMarket=vMercado;
  vMercado=function(){
    if(MKT.tab==='sazus'){setTimeout(()=>loadUs(),0);return renderUs()}
    const html=previousMarket.apply(this,arguments);
    return ['lab','saz','se'].includes(MKT.tab)?'<div class="pro-region"><button class="on" aria-current="page" data-navroute="mercado:lab">Brasil e sentimento</button><button data-navroute="mercado:sazus">EUA</button></div>'+html:html;
  };
  document.addEventListener('click',event=>{
    const compact=event.target.closest('[data-prodensity]');
    if(compact&&['comfortable','compact'].includes(compact.dataset.prodensity)){try{ls.set('diario-densidade-v284',compact.dataset.prodensity)}catch{}applyDensity();render();return}
    const view=event.target.closest('[data-usview]');
    if(view&&['mensal','ciclo','midterms'].includes(view.dataset.usview)){US.view=view.dataset.usview;render();return}
    if(event.target.closest('[data-usrefresh]'))loadUs(true);
  });
  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.matches('[data-usasset]')){US.asset=target.value;paintUs()}
    if(target.matches('[data-uselection]')){US.eventType=target.value;paintUs()}
    if(target.matches('[data-usperiod]')){if(US.view==='mensal')US.month=+target.value;else if(US.view==='ciclo')US.cycle=+target.value;else US.window=target.value;paintUs()}
  });
})();

;
/* módulo: mercado-monitor.js */
/* v287: uma fonte para EWZ/ADRs, Monitor válido e captura com referência explícita. */
(() => {
  'use strict';
  const safe=v=>esc(String(v??'')),time=v=>v?new Date(v).toLocaleString('pt-BR'):'não informada';
  const visible=()=>!document.hidden&&(tab==='home'&&!!document.getElementById('market-watch-shortcut')&&document.getElementById('market-watch-shortcut').getClientRects().length>0||tab==='mercado'&&MKT.tab==='cq'&&CQ.aba==='adr');
  let adrJob=null,quoteJob=null;
  const age=()=>AD.data?.ts?Date.now()-AD.data.ts:Infinity;
  const stale=()=>age()>5*60000;
  const originalAdrHtml=adrHtml;
  adrHtml=function(){
    let html=originalAdrHtml.apply(this,arguments).replace(/atualizado às /g,'consultado às ').replace(', sem atraso',', atraso não confirmado');
    const missing=AD.list.filter(t=>!(AD.data?.itens||[]).some(item=>item.s===t));
    return `<div class="monitor-reference" role="status"><b>EWZ e ADRs brasileiras</b><span>${AD.busy?'Consultando…':AD.failed?'Falha na atualização':AD.err?'Consulta com aviso':!AD.data?'Sem consulta concluída':stale()?'Cópia antiga · confira a referência':'Consulta automática · confira os horários dos preços'}</span><small>Consulta concluída: ${safe(time(AD.data?.ts))}. O horário de cada preço aparece no ativo; uma consulta nova não significa que houve negócio novo. Horários em Brasília.</small></div>`+html+(missing.length?`<p class="sm mut">Sem cotação nesta consulta: ${safe(missing.join(', '))}.</p>`:'')+`<p class="sm mut">Esta é a mesma lista usada na imagem do panorama. O EWZ é um ETF e fica separado da média das ADRs.</p>`;
  };
  adrLoad=function(force=false){
    if(adrJob)return adrJob;
    // Usa o relógio da sessão atual, não o estado fechado que ficou salvo na última consulta.
    const ttl=window.TraderAdr.phase()==='closed'?300000:25000;
    if(!force&&AD.data&&age()<ttl)return Promise.resolve(true);
    if(window.DIARIO_DEMO)return Promise.resolve(false);
    if(!SESS?.at){AD.err='Entre na sua conta para atualizar as cotações. A cópia anterior, se houver, continua identificada.';adrPaint();return Promise.resolve(false)}
    const symbols=AD.list.slice();
    AD.busy=1;AD.err='';AD.failed=false;adrPaint();
    adrJob=(async()=>{
      try{
        const response=await rq('/functions/v1/adrs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbols}),signal:AbortSignal.timeout(25000)});
        const data=await response.json();if(!Array.isArray(data.itens)||!data.itens.length)throw Error(data.error||'A fonte não retornou cotações válidas.');
        if(symbols.join(',')!==AD.list.join(','))return false;
        const items=data.itens.filter(item=>symbols.includes(item.s)&&typeof item.px==='number'&&Number.isFinite(item.px));
        if(!items.length)throw Error('Nenhuma cotação válida na resposta.');
        const sourceTime=Date.parse(data.consultedAt),receivedAt=Date.now();
        AD.data={ts:Number.isFinite(sourceTime)&&sourceTime<=receivedAt+60000?sourceTime:receivedAt,receivedAt,itens:items,fonte:data.fonte||'Fonte não informada',atraso:!!data.atraso,revision:data.revision||null};ls.set('diario-adr-d',AD.data);
        const missing=symbols.filter(t=>!items.some(item=>item.s===t));AD.err=[missing.length?'Sem dados de: '+missing.join(', ')+'.':'',data.aviso||''].filter(Boolean).join(' ');return true;
      }catch(error){AD.err=String(error.message||error);AD.failed=true;return false}
      finally{AD.busy=0;adrJob=null;adrPaint();paintHomeQuote()}
    })();return adrJob;
  };
  // Substitui o timer antigo, que só aceitava a tela Início.
  adrAfter=function(){if(visible())adrLoad(false);if(!AD.tm)AD.tm=setInterval(()=>{if(visible())adrLoad(false)},30000)};
  if(AD.tm){clearInterval(AD.tm);AD.tm=null}
  const originalCot=cotHtml;
  const categoryTabs=()=>`<div class="seg cqtabs" role="navigation" aria-label="Classes de ativos">${CQ_ABAS.map(([id,label])=>`<button type="button" data-cqa="${id}" class="${CQ.aba===id?'on':''}"${CQ.aba===id?' aria-current="page"':''}>${id==='adr'?'EWZ e ADRs':safe(label)}</button>`).join('')}</div>`;
  cotHtml=function(){return CQ.aba==='adr'?`<div id="cqbox">${categoryTabs()}<section id="adr" class="card">${adrHtml()}</section></div>`:originalCot.apply(this,arguments)};
  const originalQuoteLoad=cqCarrega;
  cqCarrega=function(category,force){return (category||CQ.aba)==='adr'?adrLoad(!!force):originalQuoteLoad.apply(this,arguments)};
  if(!ls.get('diario-cq-aba'))CQ.aba='adr';
  const originalMarket=vMercado;
  vMercado=function(){
    if(MKT.tab==='cot')MKT.tab='cq';
    if(MKT.tab==='cq'){setTimeout(()=>{cqCarrega(CQ.aba);adrAfter()},0);return `<section class="market-monitor"><h2>Monitor de cotações</h2><p class="mut sm">Acompanhe as classes abaixo. EWZ e ADRs usam a lista da imagem do panorama.</p>${cotHtml()}</section>`}
    return originalMarket.apply(this,arguments);
  };
  const originalMdo=mdoCarrega;
  mdoCarrega=function(force){if(quoteJob)return quoteJob;quoteJob=Promise.resolve(originalMdo.apply(this,arguments)).finally(()=>{quoteJob=null});return quoteJob};
  // A captura consulta as duas fontes mesmo que o card do Início esteja oculto.
  imgDados=async function(){
    if(window.DIARIO_DEMO)throw Error('A captura de mercado exige dados reais; consultas externas estão desativadas na demonstração.');
    if(!SESS?.at)throw Error('Entre na conta para atualizar o panorama e a lista de ADRs antes de gerar a imagem.');
    const support=async()=>{const jobs=[];try{if(typeof balCarrega==='function')jobs.push(Promise.race([balCarrega(),new Promise(resolve=>setTimeout(resolve,4000))]))}catch{}try{if(typeof AG!=='undefined'&&(!AG.v[0]||Date.now()-(AG.ts[0]||0)>1800000)){const previous=AG.sem;AG.sem=0;let request;try{request=agCarrega(true)}finally{AG.sem=previous}jobs.push(Promise.race([request,new Promise(resolve=>setTimeout(resolve,4000))]))}}catch{}await Promise.allSettled(jobs)};
    const results=await Promise.allSettled([mdoCarrega(true),adrLoad(true),support()]);
    const oldMacro=!MDO.ts||Date.now()-MDO.ts>300000,problems=[];
    if(results[0].status==='rejected'||MDO.err||oldMacro)problems.push('Panorama: '+(MDO.err||'não foi possível confirmar uma consulta recente.'));
    if(results[1].status==='rejected'||results[1].value!==true||AD.err||stale())problems.push('EWZ/ADRs: '+(AD.err||'não foi possível confirmar uma consulta recente.'));
    IMG.marketReference={macro:MDO.ts||null,adrs:AD.data?.ts||null,warning:problems.join(' ')};
    if(problems.length&&!confirm(problems.join('\n')+'\n\nGerar usando os dados disponíveis, com o aviso de falha/consulta anterior na imagem?'))throw Error('Captura cancelada; atualize as fontes e tente novamente.');
  };
  const originalCanvas=imgDesenha;
  imgDesenha=function(){
    const source=originalCanvas.apply(this,arguments),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height+160;
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);ctx.fillStyle='#09131c';ctx.fillRect(0,source.height,canvas.width,160);ctx.textAlign='left';ctx.textBaseline='top';ctx.font='22px system-ui';ctx.fillStyle='#a8b5c5';
    const ref=IMG.marketReference||{macro:MDO.ts,adrs:AD.data?.ts},lines=[`Consulta do panorama: ${time(ref.macro)}`,`Consulta de EWZ/ADRs: ${time(ref.adrs)}`,ref.warning?'ATENÇÃO: atualização com falha ou dados parciais; confira as referências.':'Consulta recente não garante negócio recente.', 'Preço principal: regular. Linha adicional: sessão e data indicadas.'];
    lines.forEach((line,index)=>ctx.fillText(line,42,source.height+16+index*32,canvas.width-84));return canvas;
  };
  function homeQuote(){
    const ewz=AD.data?.itens?.find(row=>row.s==='EWZ'),view=ewz&&window.TraderAdr.view(ewz),quote=view&&(view.active||view.regular);
    return `<div class="top"><div><b>EWZ e ADRs brasileiras</b><p class="sm mut">${quote?'EWZ '+safe(window.TraderAdr.price(quote.px))+' · '+safe(adP(quote.chp))+' · '+(view.active?.kind==='overnight'?'overnight':view.active?.kind==='pre'?'pré-mercado':view.active?.kind==='post'?'pós-mercado':'regular'):'Sua lista de acompanhamento está no Monitor.'}</p></div><button type="button" class="btn s" data-market-adrs>Abrir lista</button></div><small class="mut">Consulta: ${safe(time(AD.data?.ts))}${stale()?' · cópia antiga':''}. ${quote?'Preço: '+safe(window.TraderAdr.time(quote.at))+'. ':''}Mesma lista usada na imagem do panorama.</small>`;
  }
  function paintHomeQuote(){const node=document.getElementById('market-watch-shortcut');if(node)node.innerHTML=homeQuote()}
  function decorate(){
    if(MKT.tab==='cot'){MKT.tab='cq';ls.set('diario-mkt-tab','cq')}
    const root=document.getElementById('app');if(!root)return;
    const market=tab==='mercado'||['juros','live','graf'].includes(tab);
    if(market){root.querySelectorAll('.trvolta').forEach(node=>node.remove());root.classList.add('market-workspace');}
    else root.classList.remove('market-workspace');
    if((tab==='home'||tab==='mercado'&&MKT.tab==='mu')&&!root.querySelector('#market-watch-shortcut')){
      const node=document.createElement('section');node.id='market-watch-shortcut';node.className='card market-watch-shortcut';node.innerHTML=homeQuote();
      const anchor=root.querySelector('.routine-card,.workbench-header');if(anchor)anchor.after(node);else root.prepend(node);
    }
    if(tab==='home')root.querySelectorAll('[data-hb="adr"]').forEach(node=>node.remove());
    if(tab==='home'||tab==='mercado'&&MKT.tab==='cq'&&CQ.aba==='adr')adrAfter();
    root.querySelectorAll('.pro-tabs [aria-current="page"],.pro-subtabs [aria-current="page"]').forEach(node=>{const nav=node.parentElement;if(nav.scrollWidth>nav.clientWidth)node.scrollIntoView({inline:'nearest',block:'nearest'})});
  }
  window.TraderUI.onRender('mercado-monitor',decorate);
  window.addEventListener('click',event=>{
    if(event.target.closest('[data-market-chat]')){event.preventDefault();event.stopImmediatePropagation();window.TraderChat?.open();return}
    if(event.target.closest('[data-market-adrs]')){event.preventDefault();event.stopImmediatePropagation();CQ.aba='adr';ls.set('diario-cq-aba','adr');window.DIARIO_NAV.navigate('mercado:cq')}
  },true);
  document.addEventListener('visibilitychange',()=>{if(visible())adrLoad(true)});
  window.TraderMarket={decorate,visible,stale,refresh:()=>adrLoad(true)};
})();

;
/* módulo: diario-recuperacao.js */
/* Recuperação explícita de edições concorrentes e modo de foco. */
(() => {
  'use strict';
  const labels={plano:'Plano',resumo:'Resumo',aprend:'Aprendizado',pre:'Ensaio mental',bem:'O que fiz bem',chk:'Checklist',us:'EUA'};
  const focused=()=>{try{return APP_STORAGE.getItem('diario-foco')==='1'}catch{return false}};
  function decorate() {
    const root=document.getElementById('app');if(!root)return;
    root.classList.toggle('diary-focus',tab==='dia'&&focused());
    if(tab==='dia'&&DV!=='hist') {
      const actions=document.createElement('div');actions.className='diary-toolbar';
      const focus=document.createElement('button');focus.type='button';focus.className='btn s';focus.dataset.diaryFocus='1';
      focus.textContent=root.classList.contains('diary-focus')?'Mostrar todos os painéis':'Modo foco';actions.append(focus);
      const h=root.querySelector('h1');if(h)h.after(actions);
    }
    const entries=Object.entries(diarioDaysCanonical()).flatMap(([date,day])=>(day._conflicts||[]).map(conflict=>({date,conflict})));
    if(!entries.length||root.querySelector('.diary-conflicts'))return;
    const panel=document.createElement('details');panel.className='card diary-conflicts';panel.open=tab==='dia';
    const summary=document.createElement('summary');summary.textContent=`${entries.length} edição(ões) do diário para conferir`;panel.append(summary);
    const intro=document.createElement('p');intro.textContent='Duas versões foram preservadas durante a sincronização. Confira o conteúdo e escolha qual manter. Nada foi descartado deste registro de conflito.';panel.append(intro);
    entries.forEach(({date,conflict})=>{
      const row=document.createElement('div');row.className='diary-conflict';
      const title=document.createElement('b');title.textContent=date+' · '+conflict.path.map(k=>labels[k]||k).join(' / ');row.append(title);
      conflict.versions.forEach((version,index)=>{
        const text=document.createElement('pre');text.textContent=!version.present?'Campo removido':typeof version.value==='string'?version.value||'(vazio)':JSON.stringify(version.value,null,2);row.append(text);
        const choose=document.createElement('button');choose.type='button';choose.className='btn s';choose.textContent='Manter esta versão';
        choose.addEventListener('click',()=>{if(window.DiarioDados.resolve(diarioDaysCanonical()[date],conflict.id,index)){save();render()}});row.append(choose);
      });panel.append(row);
    });root.prepend(panel);
  }
  window.TraderUI.onRender('diario-recuperacao',decorate);
  document.addEventListener('click',event=>{if(!event.target.closest('[data-diary-focus]'))return;const active=focused();try{APP_STORAGE.setItem('diario-foco',active?'0':'1')}catch{toast('Não foi possível guardar a preferência neste aparelho.')}render()});
})();

;
/* módulo: trader-fluxos.js */
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
  function homePreferences(){
    const current=config().home;
    if(current)return current;
    const legacy=S.ax?.['home.layout'];
    return legacy?{order:legacy.ordem||[],hidden:legacy.ocultos||[]}:null;
  }
  function homeSettings(){
    const nodes=[...document.querySelectorAll('#app [data-hb]')],keys=[...new Set(nodes.map(n=>n.dataset.hb))],saved=homePreferences()||{},order=[...(saved.order||[]).filter(k=>keys.includes(k)),...keys.filter(k=>!saved.order?.includes(k))];
    dialog('Organizar a tela inicial',`<p class="wf-note">Rotina e avisos de risco permanecem acessíveis. Reordene e oculte os módulos opcionais.</p><div id="wf-home-order">${order.map(key=>`<div class="wf-home-row" data-home-key="${safe(key)}"><label><input type="checkbox"${!saved.hidden?.includes(key)?' checked':''}${['posso','lim','venc'].includes(key)?' disabled':''}> ${safe((typeof HB_NOMES!=='undefined'&&HB_NOMES[key])||nodes.find(n=>n.dataset.hb===key)?.querySelector('h2,b')?.textContent?.slice(0,70)||key)}</label><button class="btn s" data-wf="home-up" aria-label="Mover para cima">↑</button><button class="btn s" data-wf="home-down" aria-label="Mover para baixo">↓</button></div>`).join('')}</div><button class="btn" data-wf="home-save">Salvar organização</button>`);
  }
  function applyHome(root){
    root.querySelector('#hb-fim')?.remove();
    const prefs=homePreferences();
    if(!prefs){
      const optional=[...root.querySelectorAll('[data-hb]')].filter(node=>['en','cap','metas'].includes(node.dataset.hb)&&node.textContent.trim());
      if(optional.length){
        const box=document.createElement('details');box.className='home-secondary';
        box.innerHTML='<summary>Patrimônio, metas e estudos</summary><p>Módulos complementares. Use Organizar início para escolher sua disposição.</p>';
        optional[0].before(box);optional.forEach(node=>box.append(node));
      }
      return;
    }
    const parents=new Map;
    root.querySelectorAll('[data-hb]').forEach(node=>{const key=node.dataset.hb;node.hidden=!['posso','lim','venc'].includes(key)&&prefs.hidden?.includes(key);const list=parents.get(node.parentNode)||[];list.push(node);parents.set(node.parentNode,list)});
    for(const [parent,nodes] of parents){const marker=document.createComment('home-order');parent.insertBefore(marker,nodes[0]);const order=prefs.order||[];nodes.sort((a,b)=>(order.indexOf(a.dataset.hb)<0?999:order.indexOf(a.dataset.hb))-(order.indexOf(b.dataset.hb)<0?999:order.indexOf(b.dataset.hb))).forEach(n=>parent.insertBefore(n,marker));marker.remove()}
  }
  function quality(){
    const rows=[];try{rows.push({name:'Sincronização',source:'Supabase',at:S.lastSyncAt,error:SY.msg?.startsWith('Falha')?SY.msg:'',note:SESS?'Conta conectada':'Cópia local; sem sessão'})}catch{}
    try{rows.push({name:'Salvamento local',source:'IndexedDB deste aparelho',note:LOCAL_SAVE.error||(LOCAL_SAVE.pending?'Gravação em andamento':'Nenhuma gravação pendente')});rows.push({name:'Último backup exportado',source:'Arquivo JSON do usuário',note:S.lastBackup?String(S.lastBackup)+' · guarde o arquivo fora do aparelho':'Nenhuma exportação registrada'})}catch{}
    const metrics=window.TraderUI.metrics();
    if(metrics.samples)rows.push({name:'Interface nesta sessão',source:'Medição local, sem envio de dados',note:`${metrics.samples} atualizações medidas · p95 ${Math.round(metrics.p95)} ms · ${metrics.failures} falha(s) observada(s). Não inclui espera por rede.`});
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
    // Ações gerais ficam no menu, sem uma faixa de atalhos em cada tela.
    if(tab==='home')applyHome(root);
    if(tab==='dia'&&DV!=='hist'){
      let anchor=root.querySelector('.diary-toolbar');
      if(!anchor){anchor=document.createElement('div');anchor.className='diary-toolbar';const title=root.querySelector('h1');if(title)title.after(anchor);else root.prepend(anchor)}
      anchor.insertAdjacentHTML('beforeend','<button class="btn s" data-wf="templates">Modelo do diário</button><button class="btn s" data-wf="history-day">Versões deste dia</button>');
    }
    if(tab==='rev')root.insertAdjacentHTML('beforeend',weeklyHtml());
    if(tab==='stats')root.insertAdjacentHTML('beforeend',`<section class="card"><h2>Execução e resultado</h2>${comparisonHtml(M.compare(S.trades,calc,moedaT))}<p class="wf-note">Esta comparação considera todas as operações encerradas, independentemente do filtro das estatísticas acima.</p></section>`);
    if(tab==='import'){root.insertAdjacentHTML('beforeend',batchesHtml());if(typeof IM!=='undefined'&&IM?.rows)root.insertAdjacentHTML('beforeend',`<p class="wf-note">Prévia: ${IM.rows.length} linha(s) agrupada(s), ${IM.dup?.size||0} duplicada(s), ${IM.off?.size||0} desmarcada(s), ${IM.upd?.size||0} atualização(ões). Confira a prévia acima antes de importar.</p>`)}
    root.querySelectorAll('.tcard[data-id],.card.row[data-a="edit"]').forEach(node=>{if(node.querySelector('[data-wf="trade"]'))return;const id=node.dataset.id;if(!id)return;node.insertAdjacentHTML('beforeend',`<button class="btn s wf-process-button" data-wf="trade" data-id="${safe(id)}">Diário e processo</button>`)});
  }
  window.TraderUI.onRender('trader-fluxos',decorate);
  window.TraderUI.onSheet('trader-fluxos',function(){const sheet=$('#sh .sh');if(sheet&&T&&!isNew)sheet.insertAdjacentHTML('beforeend',`<div class="wf-actions"><button class="btn s" data-wf="trade" data-id="${safe(T.id)}">Diário, regras e linha do tempo</button></div>`)});
  window.TraderWorkflow={beforeSave,reset,captureTrade,prepareJournal:edition=>M.journal(edition,config().journal),openSearch,quality,journalSettings,openTrade};
  document.addEventListener('change',event=>{if(event.target.id==='wf-week'){week=M.monday(event.target.value||today());render()}if(event.target.id==='impf')fileName=event.target.files?.[0]?.name||'Arquivo CSV'});
  window.addEventListener('click',event=>{
    const imp=event.target.closest('[data-a="impgo"]');
    if(imp&&typeof IM!=='undefined'&&IM?.rows){const ids=IM.rows.filter(row=>!IM.dup.has(row.t.id)&&!IM.off.has(row.t.id)).map(row=>row.t.id);pendingImport={id:M.id(),name:fileName,ids,before:Object.fromEntries(S.trades.filter(t=>ids.includes(t.id)).map(t=>[t.id,M.clone(t)]))}}
    const button=event.target.closest('[data-wf]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const action=button.dataset.wf,id=button.dataset.id;
    if(button.closest('#mdr2')){
      document.body.classList.remove('pcmenu','trmenu');document.body.style.overflow='';
      if(!document.body.classList.contains('pc'))document.getElementById('mdr2')?.remove();
    }
    if(action==='organize-home'){window.DIARIO_NAV.navigate('home');return homeSettings()}
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
    if(action==='home-save'){const rows=[...document.querySelectorAll('#wf-home-order [data-home-key]')];config().home={order:rows.map(r=>r.dataset.homeKey),hidden:rows.filter(r=>!r.querySelector('input').checked).map(r=>r.dataset.homeKey)};S.ax['home.layout']={ordem:config().home.order,ocultos:config().home.hidden};save();$('#wf-dialog')?.close();render();return}
    if(action==='journal-save'){config().journal={mode:$('#wf-journal-mode').value,tickers:$('#wf-journal-tickers').value.split(',').map(t=>t.trim().toUpperCase()).filter(Boolean),hidden:[...document.querySelectorAll('[data-journal-editor]')].filter(e=>!e.checked).map(e=>e.dataset.journalEditor)};save();$('#wf-dialog')?.close();toast('Preferências do PDF salvas.');return}
    if(action==='status'){tab='status';$('#wf-dialog')?.close();render()}
  },true);
})();

;
/* módulo: trader-chat.js */
/* Economista existente em painel flutuante. Só envia perguntas por ação explícita. */
(() => {
  'use strict';
  const safe=value=>esc(String(value??''));let opened=false,root,button,panel,attachedContext='',historyMarkup='';
  function context(){
    const parts=[`Tela aberta: ${tab}.`];
    if(typeof T!=='undefined'&&T?.ativo)parts.push(`Ativo em edição: ${T.ativo}.`);
    if(window.PF?.sel)parts.push(`Ativo selecionado na carteira: ${window.PF.sel}.`);
    if(tab==='dia')parts.push(`Data do diário: ${D}.`);
    if(attachedContext)parts.push(attachedContext);
    return parts.join('\n')+'\nNão foram anexados saldos, posições, plano ou textos do diário.';
  }
  function list(title,items){return Array.isArray(items)&&items.length?`<details><summary>${safe(title)}</summary><ul>${items.map(item=>`<li>${safe(typeof item==='string'?item:JSON.stringify(item))}</li>`).join('')}</ul></details>`:''}
  function response(item){
    const r=item.r||{};
    return `<article class="wf-chat-message"><p class="wf-chat-question">${safe(item.q)}</p><h3>${safe(r.titulo||'Resposta da Economista IA')}</h3><p>${safe(r.resumo||'')}</p>${(r.explicacao||[]).map(p=>`<p>${safe(p)}</p>`).join('')}
      ${list('Fatos apresentados pelo modelo — confira as fontes',r.fatos)}
      ${list('Impactos descritos',r.impactos?.map(x=>`${x.mercado}: ${x.direcao}. ${x.porque||''}`))}
      ${list('Cenários condicionais',r.cenarios?.map(x=>`${x.nome}: ${x.descricao||''} Condições: ${x.gatilhos||'não informadas'}.${Number.isFinite(+x.probabilidade_pct)?' Estimativa do modelo: '+x.probabilidade_pct+'%, sem calibração estatística informada.':''}`))}
      ${list('O que observar',r.o_que_observar)}${r.contraponto?`<p><b>Contraponto:</b> ${safe(r.contraponto)}</p>`:''}
      ${list('Visões',r.visoes?.map(x=>`${x.escola}: ${x.argumento}`))}${list('Glossário',r.glossario?.map(x=>`${x.termo}: ${x.significado}`))}
      ${list('Fontes citadas na resposta',r.fontes)}<small>${safe(new Date(item.em).toLocaleString('pt-BR'))} · conteúdo gerado por IA</small></article>`;
  }
  function paint(){
    if(!panel)return;const history=panel.querySelector('.wf-chat-history'),input=panel.querySelector('textarea'),status=panel.querySelector('[role="status"]'),submit=panel.querySelector('[type="submit"]');
    const markup=ECO.l.length?ECO.l.map(response).join(''):'<p class="wf-chat-empty">Pergunte sobre juros, notícias, indicadores ou cenários. A conversa acompanha você entre as telas.</p>';
    if(markup!==historyMarkup){const top=history.scrollTop,follow=history.scrollHeight-history.clientHeight-top<40;history.innerHTML=markup;historyMarkup=markup;history.scrollTop=follow?history.scrollHeight:top}
    status.textContent=ECO.busy?'Preparando a resposta…':ECO.err||'';submit.disabled=!!ECO.busy;input.disabled=!!ECO.busy;
    const preview=panel.querySelector('.wf-chat-context');preview.textContent=context();preview.hidden=!panel.querySelector('[name="context"]').checked;
  }
  function setOpen(value){
    opened=value;panel.hidden=!value;button.setAttribute('aria-expanded',String(value));
    window.TraderUI.refreshScroll();if(value){paint();panel.querySelector('textarea').focus({preventScroll:true})}else button.focus({preventScroll:true});
  }
  function build(){
    if(root)return;
    root=document.createElement('div');root.id='economista-flutuante';
    root.innerHTML=`<button type="button" class="wf-chat-launcher" aria-label="Abrir Economista IA" aria-expanded="false" aria-controls="wf-chat-panel"><span aria-hidden="true">IA</span></button>
      <aside id="wf-chat-panel" class="wf-chat-panel" aria-label="Conversa com a Economista IA" hidden><header><div><b>Economista IA</b><small>Assistente virtual · mesma conversa entre telas</small></div><button type="button" data-chat-close aria-label="Minimizar conversa">−</button></header>
      <div class="wf-chat-history" aria-label="Histórico da conversa"></div><div class="wf-chat-status" role="status" aria-live="polite"></div>
      <form><label class="wf-chat-context-label"><input type="checkbox" name="context"> Anexar tela, ativo e indicadores públicos, sem saldos ou textos do diário</label><pre class="wf-chat-context" hidden></pre><label class="wf-chat-input-label">Sua pergunta<textarea rows="2" maxlength="6000" placeholder="O que você quer entender?"></textarea></label><div class="wf-chat-actions"><button type="button" data-chat-clear>Limpar conversa</button><button type="submit">Enviar</button></div><small>A consulta utiliza o provedor de IA configurado. Respostas e cenários podem conter erros; confirme fontes e datas.</small></form></aside>`;
    document.body.append(root);button=root.querySelector('.wf-chat-launcher');panel=root.querySelector('aside');
    button.addEventListener('click',()=>{if(!button._dragged)setOpen(!opened);button._dragged=false});
    panel.querySelector('[data-chat-close]').onclick=()=>setOpen(false);
    panel.querySelector('[name="context"]').onchange=paint;
    panel.querySelector('[data-chat-clear]').onclick=()=>{if(ECO.busy||!confirm('Limpar apenas o histórico da Economista IA neste aparelho?'))return;ECO.l=[];ECO.err='';ecoSalva();paint()};
    panel.querySelector('form').onsubmit=async event=>{
      event.preventDefault();const input=panel.querySelector('textarea'),question=input.value.trim();if(question.length<3||ECO.busy)return;
      if(window.DIARIO_DEMO){ECO.err='Demonstração: a consulta externa está desativada.';paint();return}
      const full=question+(panel.querySelector('[name="context"]').checked?'\n\nContexto autorizado:\n'+context():'');input.value='';
      await ecoPergunta(full);if(ECO.err)input.value=question;paint();panel.querySelector('.wf-chat-history').scrollTop=1e9;
    };
    panel.querySelector('textarea').addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();panel.querySelector('form').requestSubmit()}});
    let drag=null;
    button.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,left:button.getBoundingClientRect().left,top:button.getBoundingClientRect().top};button._dragged=false;button.setPointerCapture?.(event.pointerId)});
    button.addEventListener('pointermove',event=>{if(!drag||opened)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)<8)return;button._dragged=true;button.style.position='fixed';button.style.left=Math.max(8,Math.min(innerWidth-64,drag.left+dx))+'px';button.style.top=Math.max(8,Math.min(innerHeight-70,drag.top+dy))+'px';button.style.right='auto';button.style.bottom='auto'});
    button.addEventListener('pointerup',()=>{drag=null});button.addEventListener('pointercancel',()=>{drag=null});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)setOpen(false)});
    window.addEventListener('resize',()=>{button.style.left='';button.style.top='';button.style.position='';button.style.right='';button.style.bottom=''});
  }
  build();
  const previousPaint=ecoPaint;ecoPaint=function(){previousPaint.apply(this,arguments);paint()};
  window.TraderUI.onRender('trader-chat',{
    before(){const legacy=tab==='mercado'&&MKT.tab==='eco';if(legacy)MKT.tab='mu';return legacy},
    after(legacy){paint();if(legacy)setOpen(true)}
  });
  try{for(const list of [HUB_M,...MGRP.map(g=>g[1])])for(let i=list.length-1;i>=0;i--)if((Array.isArray(list[i])?list[i][0]:list[i])==='mercado:eco')list.splice(i,1)}catch{}
  if(window.DIARIO_DEMO){for(const name of ['alEnable','alDisable','alTest'])try{window[name]=async()=>toast('Notificações reais desativadas na demonstração.')}catch{}const originalAccount=vConta;vConta=()=>'<h1>Demonstração</h1><p>Conta e sincronização real estão desativadas. Os exemplos usam um banco local separado.</p>'}
  window.TraderChat={open:(extra='')=>{attachedContext=typeof extra==='string'?extra:'';setOpen(true)},close:()=>setOpen(false),paint,context};
})();

;
/* módulo: revista-modelo.js */
/* Revista técnica: somente histórico observado; sem notícias, projeções de preços ou causas inventadas. */
(function(root){
 'use strict';const VERSION='revista-tecnica-v289',finite=n=>typeof n==='number'&&Number.isFinite(n);
 const date=t=>new Date(t*1000).toISOString().slice(0,10),add=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
 const spDate=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 function windowFor(day){const dow=new Date(day+'T12:00:00Z').getUTCDay(),cut=add(day,-((dow+2)%7||7)),monday=add(cut,3);return {day,cutoff:cut,from:monday,to:add(monday,4)}}
 function clean(rows,cutoff){const map=new Map;for(const r of rows||[]){if(!Array.isArray(r)||r.length<5||!finite(r[0])||!Number.isFinite(new Date(r[0]*1000).getTime())||!r.slice(1,5).every(n=>finite(n)&&n>0)||r[2]<Math.max(r[1],r[4])||r[3]>Math.min(r[1],r[4])||date(r[0])>cutoff)continue;map.set(date(r[0]),r.slice(0,6))}return [...map.values()].sort((a,b)=>a[0]-b[0])}
 function weekly(rows){const out=new Map;for(const r of rows){const d=date(r[0]),dow=new Date(d+'T12:00:00Z').getUTCDay(),key=add(d,-((dow+6)%7)),old=out.get(key);if(old){old[2]=Math.max(old[2],r[2]);old[3]=Math.min(old[3],r[3]);old[4]=r[4];old[5]+=(r[5]||0)}else out.set(key,[...r.slice(0,5),r[5]||0])}return [...out.values()]}
 const mean=(rows,n)=>rows.length>=n?rows.slice(-n).reduce((s,r)=>s+r[4],0)/n:null;
 const trend=(px,fast,slow)=>fast==null||slow==null?'não avaliada':px>fast&&fast>slow?'alta':px<fast&&fast<slow?'baixa':'indefinida';
 function rsi(rows){if(rows.length<15)return null;let gain=0,loss=0;for(let i=1;i<rows.length;i++){const v=rows[i][4]-rows[i-1][4];if(i<=14){gain+=Math.max(0,v);loss+=Math.max(0,-v);if(i===14){gain/=14;loss/=14}}else{gain=(gain*13+Math.max(0,v))/14;loss=(loss*13+Math.max(0,-v))/14}}return gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss)}
 function study(asset,cutoff){const bars=clean(asset.bars,cutoff),weeks=weekly(bars),last=bars.at(-1),recent=bars.slice(-21,-1);if(bars.length<30||!last)return {...asset,bars,available:false,reason:asset.error||'Menos de 30 sessões válidas até o corte.'};
   const asOf=date(last[0]),old=(Date.parse(cutoff)-Date.parse(asOf))/86400000>10;if(old)return {...asset,bars,available:false,asOf,reason:'Histórico defasado em relação ao corte da edição.'};
   const ma20=mean(bars,20),ma50=mean(bars,50),ma200=mean(bars,200),w10=mean(weeks,10),w40=mean(weeks,40),support=Math.min(...recent.map(r=>r[3])),resistance=Math.max(...recent.map(r=>r[2]));
   return {...asset,bars,weeks,available:true,asOf,from:date(bars[0][0]),close:last[4],ma20,ma50,ma200,w10,w40,rsi:rsi(bars),support,resistance,dailyTrend:trend(last[4],ma20,ma50),weeklyTrend:trend(last[4],w10,w40),weeklyReturn:weeks.length>1?(weeks.at(-1)[4]/weeks.at(-2)[4]-1)*100:null,
    scenarios:[{name:'Continuação / rompimento de alta',condition:'Fechamento diário acima da máxima das 20 sessões anteriores, seguido de sustentação.',trigger:resistance,invalidation:'Retorno e fechamento dentro da faixa anterior; confirmar pelo novo candle.'},{name:'Perda de suporte',condition:'Fechamento diário abaixo da mínima das 20 sessões anteriores, seguido de continuidade.',trigger:support,invalidation:'Recuperação da faixa anterior em fechamento.'},{name:'Consolidação',condition:'Fechamentos entre as duas referências; acompanhar eventual saída do intervalo.',low:support,high:resistance,invalidation:'Saída confirmada da faixa em fechamento.'}]};
 }
 function future(snapshot,id){
   const item=(snapshot?.itens||[]).find(r=>r.pedido===id),valid=item&&finite(item.px)&&item.px>0&&finite(item.max)&&finite(item.min)&&item.max>=item.px&&item.min<=item.px;
   if(!valid)return {ticker:id==='WINFUT'?'WIN':'WDO',name:id==='WINFUT'?'Índice futuro':'Dólar futuro',available:false,reason:'Snapshot do contrato futuro indisponível. O histórico à vista não foi apresentado como futuro.'};
   return {ticker:id==='WINFUT'?'WIN':'WDO',name:id==='WINFUT'?'Índice futuro':'Dólar futuro',available:true,symbol:item.s,price:item.px,high:item.max,low:item.min,open:finite(item.ab)?item.ab:null,source:item.fonte||'Fonte do terminal',queried:snapshot.em||null,delayed:item.atraso,limited:true,note:'Snapshot do contrato informado pela fonte. Sem horário individual confirmado e sem série histórica real do futuro; não equivale ao fechamento semanal. Referências operacionais limitadas à máxima e mínima deste snapshot.'};
 }
 function build({reference,assets,snapshot,generated=new Date().toISOString(),demo=false}){const win=windowFor(reference),seen=new Set,studies=[];for(const a of assets||[])if(!seen.has(a.ticker)){seen.add(a.ticker);studies.push(study(a,win.cutoff))}return {formato:VERSION,dia:reference,edicao:'fds',nome:'Revista técnica da semana',gerado:generated,window:win,studies,futures:[future(snapshot,'WINFUT'),future(snapshot,'WDOFUT')],demo,manchete:{titulo:'Cenários técnicos para a próxima semana'},materias:[],em_poucas_linhas:[]}}
 function dedupe(items=[]){const seen=new Set;return items.filter(x=>{const key=String(x.titulo||x.texto||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');if(!key||seen.has(key))return false;seen.add(key);return true})}
 root.RevistaModel={VERSION,date,spDate,windowFor,clean,weekly,mean,trend,rsi,study,future,build,dedupe,add};
})(typeof window==='undefined'?globalThis:window);

;
/* módulo: carteira-pesquisa.js */
/* v288 · cálculos e gráficos de patrimônio/proventos, sem candles nem IA para calcular valores. */
(function(root){
 'use strict';
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 // Aceita decimal canônico e decimal brasileiro; não interpreta texto, booleanos ou infinito como valores.
 const num=root.CarteiraCalculo.num;
 const key=r=>(r.mk||'BR')+':'+r.tk;
 const ledger=(rows,until='9999-12-31')=>(rows||[]).filter(r=>r.d&&r.d<=until).slice().sort((a,b)=>a.d.localeCompare(b.d)||(a.tp==='E')-(b.tp==='E'));
 function income(rows,until='9999-12-31'){
   const months={},byAsset={},events=[];let missingFx=0;
   for(const row of ledger(rows,until)){if(row.tp!=='P')continue;const price=num(row.p),quantity=num(row.q),fee=num(row.cs)||0;if(price==null)continue;
     const amount=(quantity?price*quantity:price)-fee,unit=row.mk==='US'?'USD':'BRL',month=row.d.slice(0,7),id=key(row);months[month]??={BRL:0,USD:0};months[month][unit]+=amount;(byAsset[id]??={unit,total:0}).total+=amount;
     const fx=num(row.fx),brl=unit==='BRL'?amount:fx>0?amount*fx:null;if(brl==null)missingFx++;
     events.push({date:row.d,ticker:row.tk,key:id,unit,amount,brl,fx:unit==='USD'?fx:null});
   }
   return {months,byAsset,events,missingFx,totals:events.reduce((r,e)=>(r[e.unit]+=e.amount,r),{BRL:0,USD:0})};
 }
 function detail(asset,rows,until='9999-12-31'){
   let q=0,cycleIncome=0,allIncome=0,start=null,events=[];
   for(const row of ledger(rows,until).filter(r=>key(r)===asset.k)){
     const qty=num(row.q)||0,price=num(row.p)||0,fee=num(row.cs)||0;
     if(row.tp==='C'){if(q<=1e-9){cycleIncome=0;start=row.d}q+=qty}
     if(row.tp==='V')q=Math.max(0,q-qty);
     if(row.tp==='E'){const f=num(row.f);if(f>0){if(row.ev==='desd')q*=f;if(row.ev==='grup')q/=f;if(row.ev==='bonif')q*=1+f/100}}
     if(row.tp==='P'){const value=(qty?qty*price:price)-fee;allIncome+=value;if(start&&q>0)cycleIncome+=value}
     events.push(row);
   }
   const qty=num(asset.q),pm=num(asset.pm),px=asset.tem?num(asset.pa):null,cost=qty!=null&&pm!=null?qty*pm:null,value=qty!=null&&px!=null?qty*px:null,result=value!=null&&cost!=null?value-cost:null,change=num(asset.d1);
   return {unit:asset.moeda||(asset.mk==='US'?'USD':'BRL'),quantity:qty,pm,cost,value,result,resultPct:cost>0&&result!=null?result/cost*100:null,
    income:cycleIncome,allIncome,withIncome:result==null?null:result+cycleIncome,withIncomePct:cost>0&&result!=null?(result+cycleIncome)/cost*100:null,pmIncome:qty>0&&cost!=null?(cost-cycleIncome)/qty:null,
    daily:value!=null&&change!=null&&change>-100?value-value/(1+change/100):null,weight:num(asset.peso),quoteAt:asset.pxEm,cycleStart:start,events};
 }
 function wealth(perf,rows,raw){
   if(!perf?.D?.length||perf.D.length<2)return {points:[],reason:'Histórico de patrimônio ainda não carregado.'};
   const missing=[...(perf.falhas||[])];
   for(const row of ledger(rows,perf.D.at(-1)).filter(r=>r.tp==='C')){
     if(['rf','tesouro','outro'].includes(row.cl)){missing.push(row.tk+': falta histórico de marcação desta classe');continue}
     const series=raw?.series?.[row.tk];if(!series?.d?.length||!series?.c?.some(finite))missing.push(row.tk+': falta série de preços');
     else if(series.d[series.c.findIndex(v=>finite(v)&&v>0)]>row.d)missing.push(row.tk+': histórico começa depois da primeira compra');
   }
   if(ledger(rows).some(r=>r.mk==='US')&&!raw?.series?.__USD?.d?.length)missing.push('Falta histórico de câmbio');
   if(missing.length)return {points:[],reason:'Gráfico não exibido para evitar usar custo como preço histórico: '+[...new Set(missing)].join('; ')};
   return {points:perf.D.map((date,i)=>({date,value:finite(perf.V?.[i])?perf.V[i]:null,invested:finite(perf.INV?.[i])?perf.INV[i]:null})).filter(p=>p.value!=null),source:perf.fonte||'Histórico carregado no aplicativo',generated:perf.gerado,reason:''};
 }
 function seriesMonthly(points){const last=new Map;for(const point of points||[])last.set(point.date.slice(0,7),point);return [...last].map(([date,p])=>({date,value:p.value}))}
 function groups(assets,field){const groups={};for(const a of assets||[]){const p=a.position||a;if(finite(p.v))groups[p[field]||'Não informado']=(groups[p[field]||'Não informado']||0)+p.v}return Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([date,value])=>({date,value}))}
 function coverage(assets,reference){
   const today=reference||new Date().toISOString().slice(0,10),missing=[],undated=[],previous=[];
   for(const a of assets||[]){
     if(!a.tem||!(num(a.pa)>0)){missing.push(a.tk);continue}
     const date=String(a.pxEm||'').slice(0,10);
     if(!/^\d{4}-\d{2}-\d{2}$/.test(date))undated.push(a.tk);
     else if(date<today)previous.push({ticker:a.tk,date});
   }
   return {total:(assets||[]).length,priced:(assets||[]).length-missing.length,missing,undated,previous,complete:!missing.length};
 }
 root.CarteiraResearch={finite,num,key,ledger,income,detail,wealth,seriesMonthly,groups,coverage};
})(typeof window==='undefined'?globalThis:window);

;
/* módulo: carteira-factsheet-modelo.js */
/* Métricas do factsheet: só séries e posições verificáveis; nenhuma conta financeira delegada à IA. */
(function(root){
 'use strict';
 const ok=v=>typeof v==='number'&&Number.isFinite(v),sum=a=>a.reduce((s,v)=>s+v,0),stdev=a=>{if(a.length<2)return null;const mean=sum(a)/a.length;return Math.sqrt(sum(a.map(v=>(v-mean)**2))/(a.length-1))};
 function performance(input){
  if(root.CarteiraCalculo&&root.CarteiraCalculo.audit(input.ledger||[],input.asOf||'9999-12-31').issues.length)return {available:false,reason:'Há inconsistências nos lançamentos. Retorno e risco omitidos até a conferência.'};
  if(input.selected?.tipo==='ativo')return {available:false,reason:'Ficha individual: retorno e risco da carteira completa não são atribuídos a este ativo.'};
  const p=input.performance,w=input.wealth,asOf=input.asOf||String(input.generated||'9999-12-31').slice(0,10);
  if(!w?.points?.length||!p?.D?.length||p.falhas?.length)return {available:false,reason:w?.reason||'Histórico completo e validado ainda não disponível.'};
  const indices=p.D.map((d,i)=>({d,i})).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.d)&&r.d<=asOf);
  if(indices.length<2||indices.some((r,i)=>i&&r.d<=indices[i-1].d)||indices.some(r=>!ok(p.I?.[r.i])||p.I[r.i]<=0||!ok(p.V?.[r.i])))return {available:false,reason:'Histórico com lacunas ou índices inválidos; métricas omitidas.'};
  const first=indices[0].i,last=indices.at(-1).i,base=p.I[first],rows=indices.map(r=>({date:r.d,value:p.V[r.i],index:p.I[r.i]/base*100,i:r.i}));
  const benchmark=key=>indices.every(r=>ok(p[key]?.[r.i])&&p[key][r.i]>0)?rows.map(r=>({date:r.date,value:p[key][r.i]/p[key][first]*100})):[];
  const ib=benchmark('ib'),cdi=benchmark('cdi'),monthly=[];let previous=first;
  const months=new Map;for(const r of rows)months.set(r.date.slice(0,7),r);
  for(const [date,r]of months){if(r.i===first)continue;monthly.push({date,value:(p.I[r.i]/p.I[previous]-1)*100,ib:ib.length?(p.ib[r.i]/p.ib[previous]-1)*100:null,cdi:cdi.length?(p.cdi[r.i]/p.cdi[previous]-1)*100:null,partial:date===asOf.slice(0,7)});previous=r.i}
  let high=rows[0].index,dd=0;for(const r of rows){high=Math.max(high,r.index);dd=Math.min(dd,(r.index/high-1)*100)}
  const daily=indices.slice(1).map((r,j)=>p.I[r.i]/p.I[indices[j].i]-1),vol=stdev(daily),excess=ib.length?indices.slice(1).map((r,j)=>daily[j]-(p.ib[r.i]/p.ib[indices[j].i]-1)):[];
  const latest=monthly.at(-1),contributions=Object.entries(p.pnlK||{}).map(([key,values])=>({key,ticker:key.split(':').slice(1).join(':')||key,value:indices.slice(1).every(r=>ok(values[r.i]))?sum(indices.slice(1).map(r=>values[r.i])):null})).filter(r=>r.value!==null);
  return {available:true,rows,ib,cdi,monthly,from:rows[0].date,to:rows.at(-1).date,return:rows.at(-1).index-100,monthReturn:latest?.value??null,vol:daily.length>=20&&vol!=null?vol*Math.sqrt(252)*100:null,drawdown:dd,tracking:excess.length>=20?stdev(excess)*Math.sqrt(252)*100:null,n:daily.length,contributions,source:p.fonte||'Histórico de cotações do aplicativo'};
 }
 function snapshotHistory(input){
  const rows=[];for(const [date,s]of Object.entries(input.snapshots||{})){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>(input.asOf||String(input.generated).slice(0,10)))continue;const br=s.BR?.v,us=s.US?.v;if(!ok(br)&&!ok(us))continue;if(ok(us)&&us!==0)continue;rows.push({date,value:ok(br)?br:0})}
  return rows.sort((a,b)=>a.date.localeCompare(b.date));
 }
 function build(input){
  const asOf=input.asOf||String(input.generated||'').slice(0,10),assets=input.assets||[],fx=input.snapshot?.fx,missing=[];
  const positions=assets.map(a=>{const p=a.position,usd=p.moeda==='USD'||p.mk==='US',value=p.tem&&ok(p.q)&&ok(p.pa)&&(!usd||ok(fx)&&fx>0)?p.q*p.pa*(usd?fx:1):null;if(value===null)missing.push(p.tk);return {...a,value}}),total=sum(positions.filter(a=>a.value!==null).map(a=>a.value));
  const groups=field=>{const g={};for(const a of positions)if(a.value!==null){const k=a.position[field]||'Não informado';g[k]=(g[k]||0)+a.value}return Object.entries(g).map(([name,value])=>({name,value,weight:total>0?value/total*100:null})).sort((a,b)=>b.value-a.value)};
  const perf=performance(input),wealth=input.selected?.tipo==='ativo'?[]:input.wealth?.points?.length?input.wealth.points:snapshotHistory({...input,asOf}),top=positions.filter(a=>a.value!==null).sort((a,b)=>b.value-a.value).slice(0,3),income=input.income||root.CarteiraResearch.income(input.ledger||[],asOf);
  return {asOf,positions,total,missing,partial:missing.length>0,classes:groups('cl'),sectors:groups('setor'),top3:total>0?sum(top.map(a=>a.value))/total*100:null,largest:top[0]?.position.tk,largestWeight:total>0&&top.length?top[0].value/total*100:null,perf,wealth,wealthRecorded:!input.wealth?.points?.length,income};
 }
 function paragraphs(value){const out=[],seen=new Set;function visit(v,prefix=''){if(v==null)return;if(typeof v==='string'||typeof v==='number'){const text=(prefix?prefix+': ':'')+String(v).trim(),key=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');if(text&&!seen.has(key)){seen.add(key);out.push(text)}}else if(Array.isArray(v))v.forEach(item=>visit(item));else if(typeof v==='object')for(const [key,text]of Object.entries(v))if(!['exec_id','modelo','identificacao'].includes(key))visit(text,typeof text==='string'||typeof text==='number'?key.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()):'')}visit(value);return out}
 root.CarteiraFactsheetModel={build,performance,snapshotHistory,paragraphs,stdev};
})(typeof window==='undefined'?globalThis:window);

;
/* módulo: carteira-factsheet.js */
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

;
/* módulo: trader-relatorios.js */
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
  function researchChart(writer,points,title,unit='BRL',kind='line'){
    const p=writer.p,rows=(points||[]).filter(row=>typeof row.value==='number'&&Number.isFinite(row.value));
    if(!rows.length){writer.heading(title);writer.text('Sem dados registrados suficientes. Nenhum valor foi estimado.');return}
    p.need(245);writer.heading(title);const height=152,left=58,width=p.CW-left-8,x=p.M+left,y=p.y;
    const low=Math.min(0,...rows.map(r=>r.value)),high=Math.max(0,...rows.map(r=>r.value)),span=high-low||1,Y=v=>y+8+(high-v)/span*(height-32),X=i=>x+(rows.length===1?width/2:width*i/(rows.length-1));
    for(let i=0;i<4;i++){const v=low+span*i/3;p.ln(x,Y(v),x+width,Y(v),{c:p.C.bd,w:.5});p.t(number(v,0),x-7,Y(v)-3,{s:6.8,al:'r',c:p.C.mut})}
    if(kind==='bar'){const step=width/rows.length;rows.forEach((r,i)=>p.rect(x+i*step+step*.15,Math.min(Y(r.value),Y(0)),step*.7,Math.max(.7,Math.abs(Y(r.value)-Y(0))),{fill:r.value<0?p.C.r:p.C.ac}))}
    else {for(let i=1;i<rows.length;i++)p.ln(X(i-1),Y(rows[i-1].value),X(i),Y(rows[i].value),{c:p.C.ac,w:1.8})}
    p.t(rows[0].date,x,y+height-12,{s:7,c:p.C.mut});p.t(rows.at(-1).date,x+width,y+height-12,{s:7,c:p.C.mut,al:'r'});p.y+=height+4;writer.text(unit+' · '+(kind==='bar'?'valores registrados por período':'valor dos ativos, sem caixa; não é rentabilidade'),{size:7.5,color:p.C.mut});
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
    const f=meta?.fs||{},common=[['P/L',['pl']],['P/VP',['pvp','p_vp']],['Dividend yield (%)',['dy','dividend_yield_pct']],['ROE (%)',['roe','roe_pct']],['ROIC (%)',['roic']],['Margem líquida (%)',['margem_liquida_pct','ml','margem_liquida','margemLiquida','mliq']],['Margem EBITDA (%)',['margem_ebitda_pct','margem_ebitda','margemEbitda','mebitda']],['EV/EBITDA',['evebitda','ev_ebitda','evEbitda']],['Dívida líquida / EBITDA',['div_liq_ebitda','dl_ebitda','dividaLiquidaEbitda','divliq_ebitda']],['Crescimento de receita (%)',['crescimento_receita_pct','cr','cagr_receita','cagrReceita','crescimento_receita']]];
    if(asset.cl==='fii')return [['P/VP',number(first(f,['pvp','p_vp']))],['Dividend yield (%)',number(first(f,['dy','dividend_yield_pct']))],['Vacância (%)',number(first(f,['vacancia']))],['FFO / cota',number(first(f,['ffo_cota','ffo']))],['Rendimento / cota',number(first(f,['rendimento_cota']))]];
    if(['etf','etf_ext'].includes(asset.cl))return [['Índice de referência',String(first(f,['benchmark','indice'])||'Não disponível')],['Taxa de administração (%)',number(first(f,['taxa_administracao','expenseRatio']))],['Patrimônio do fundo',number(first(f,['patrimonio','totalAssets']))],['Tracking error (%)',number(first(f,['trackingError']))]];
    if(['rf','tesouro','outro'].includes(asset.cl))return [['Critérios de ações', 'Não se aplicam automaticamente a esta classe.'],['Indexador, vencimento e risco do emissor','Consultar o cadastro e o documento do título.']];
    return common.map(([name,keys])=>[name,number(first(f,keys))]);
  }
  function portfolioInput(){
    const state=window.PF||{},selected=(state.rel||[]).find(r=>String(r.id)===String(state.rv)),snapshot=typeof pfCalc==='function'?pfCalc():{pos:[]};
    const meta=window.PFX?.META?.()||{};
    const positions=selected?.tipo==='ativo'?snapshot.pos.filter(p=>p.tk===selected.tk):snapshot.pos;
    const assets=positions.map(asset=>{
      let technical;try{technical=pfTec(asset)}catch{}
      const baseMeta=meta[asset.tk]||{},fundamental=window.TerminalResearchModel?.fundamental(asset.tk,window.TRM?.trGet('fund',{tk:asset.tk})?.v||{},baseMeta),fs={...(baseMeta.fs||{})};
      const names={pl:'pl',pvp:'pvp',dy:'dy',roe:'roe',margin:'margem_liquida_pct',ev:'evebitda',debt:'div_liq_ebitda',growth:'crescimento_receita_pct'};
      for(const [key,name]of Object.entries(names))if(fundamental?.metric[key]!=null)fs[name]=fundamental.metric[key];
      return {position:asset,meta:{...baseMeta,fs},fundamental,advanced:window.ResearchAdvanced?.pdfData(asset.tk,window.TRM?.trGet('fund',{tk:asset.tk})?.v||{}),technical,report:(state.rel||[]).find(row=>row.tipo==='ativo'&&row.tk===asset.tk)||null};
    });
    const research=window.CarteiraExperience?.context?.()||{};return {selected,snapshot,assets,generated:new Date().toISOString(),snapshots:S.cart?.snap||{},exposure:window.ResearchAdvanced?.exposureData(snapshot.pos),asOf:loc().slice(0,10),...research};
  }
  async function portfolioPdf(input){
    if(!window.CarteiraFactsheet)throw Error('Atualize todos os arquivos do aplicativo para gerar o relatório de gestão.');
    return window.CarteiraFactsheet.pdf(input);
  }
  let portfolioPreparation=null;
  function preparePortfolioInput(){
    if(portfolioPreparation)return portfolioPreparation;
    const owner=SESS?.uid||null;
    if(typeof toast==='function')toast('Preparando relatório: carregando histórico e fundamentos…',5000);
    portfolioPreparation=(async()=>{
      if(!window.DIARIO_DEMO){
        const jobs=[];if(typeof pfHist==='function')jobs.push(Promise.resolve().then(()=>pfHist()));if(typeof pfMeta==='function')jobs.push(Promise.resolve().then(()=>pfMeta()));
        await Promise.allSettled(jobs);
        const deadline=Date.now()+20000;
        while((window.PF?.histBusy||window.PF?.meta)&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,150));
      }
      if(!window.DIARIO_DEMO&&window.TRM?.trFn){
        const assets=portfolioInput().assets.map(a=>a.position);
        for(let i=0;i<assets.length;i+=2){
          if((SESS?.uid||null)!==owner)throw Error('A conta mudou durante o carregamento.');
          await Promise.allSettled(assets.slice(i,i+2).filter(a=>['acao','acao_ext','bdr','fii','etf','etf_ext'].includes(a.cl)).map(async a=>{const raw=await window.TRM.trFn('fund',{tk:a.tk},600000);if((SESS?.uid||null)===owner&&raw)window.ResearchAdvanced?.onFund(a.tk,raw);return raw}));
        }
      }
      if((SESS?.uid||null)!==owner)throw Error('A conta mudou durante o carregamento. Abra o relatório novamente.');
      return portfolioInput();
    })().finally(()=>{portfolioPreparation=null});
    return portfolioPreparation;
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
  async function technicalMagazinePdf(paper){
    const M=window.RevistaModel,title=paper.demo?'Revista técnica · demonstração':'Revista da Semana';
    const w=await documentPdf(title,'Estudos técnicos de mercado · semana '+paper.window.from+' a '+paper.window.to,paper.window.cutoff),p=w.p;
    w.text(paper.demo?'DEMONSTRAÇÃO. Todas as séries e cotações deste exemplo são fictícias.':'Edição de estudos do Jornal do Pregão. Corte do histórico: '+paper.window.cutoff+'. Cada ativo mostra sua última sessão disponível. Não contém matérias de notícias nem narrativas macro geradas.');
    w.heading('Nesta edição');w.text('Ibovespa e dólar à vista · contratos futuros · ações de referência · quadro de cenários · plano da próxima sessão.');
    w.table([['Estudo',26],['Referência',25],['Diário',24],['Semanal',25]],paper.studies.map(s=>[s.ticker,s.asOf||'Sem histórico',s.dailyTrend||'Não avaliada',s.weeklyTrend||'Não avaliada']));
    w.heading('Como usar a revista');w.text('Leia as estruturas diária e semanal em conjunto. Os cenários são condicionais: descrevem o que acompanhar e quando reavaliar. Não têm probabilidade atribuída, preço-alvo próprio ou promessa de resultado. Aberturas, vencimentos e feriados devem ser conferidos no calendário oficial.');
    w.text('Os gráficos à vista não são históricos de WIN ou WDO. Os futuros possuem uma seção própria de snapshot, com os limites de cobertura explícitos. Não se mistura o valor em reais do dólar à vista com os pontos do futuro.');
    for(const s of paper.studies){
      if(s.available||p.y>p.BOT-160)p.add();w.heading(s.ticker+' · '+s.name,s.available?'Última sessão '+s.asOf+' · histórico desde '+s.from:'Cobertura indisponível');
      if(!s.available){w.text(s.reason);continue}
      w.text('Estrutura diária: '+s.dailyTrend+'. Estrutura semanal: '+s.weeklyTrend+'. Variação da última semana disponível: '+number(s.weeklyReturn)+'%. A quantidade de sessões pode variar por feriados.');
      chart(w,s.bars,'Estrutura diária · últimos candles observados',162);
      chart(w,s.weeks,'Estrutura semanal · agregação do histórico',145);
      w.table([['Métrica do histórico',55],['Valor',45]],[['Último fechamento',number(s.close)],['Média 20 sessões',number(s.ma20)],['Média 50 sessões',number(s.ma50)],['Média 200 sessões',number(s.ma200)],['Média 10 semanas',number(s.w10)],['Média 40 semanas',number(s.w40)],['RSI 14 sessões',number(s.rsi)],['Mínima das 20 sessões anteriores',number(s.support)],['Máxima das 20 sessões anteriores',number(s.resistance)]]);
      p.need(250);w.heading('Cenários para a semana');
      for(const c of s.scenarios){w.text(c.name,{font:'b'});w.text(c.condition+' Referência: '+(c.trigger!=null?number(c.trigger):number(c.low)+' a '+number(c.high))+'. Reavaliar: '+c.invalidation)}
      w.text('Leitura mecânica: diário usa preço e ordenação das MM20/MM50; semanal usa preço e ordenação das médias de 10/40 semanas. RSI é calculado por suavização de Wilder. A estrutura pode atrasar reversões e não isola causas econômicas.',{size:8,color:p.C.mut});
      w.text('Fonte: '+(s.source||'não informada')+' · consulta '+(s.queried||paper.gerado)+'. Não houve preenchimento de sessões ou projeção de candles futuros.',{size:7.5,color:p.C.mut});
    }
    for(const f of paper.futures){if(f.available||p.y>p.BOT-180)p.add();w.heading(f.ticker+' · '+f.name,'Contrato futuro · snapshot e cenários de cobertura limitada');
      if(!f.available){w.text(f.reason);continue}
      w.table([['Referência informada',55],['Valor',45]],[['Símbolo retornado',f.symbol],['Último preço do snapshot',number(f.price)],['Máxima do snapshot',number(f.high)],['Mínima do snapshot',number(f.low)],['Abertura informada',number(f.open)],['Consulta',f.queried||'Não informada'],['Fonte',f.source]]);
      w.text(f.note);w.heading('Condições de acompanhamento');
      w.text('Acima de '+number(f.high)+': observar sustentação acima da máxima da amostra; reavaliar se retornar à faixa. Abaixo de '+number(f.low)+': observar continuidade abaixo da mínima; reavaliar se recuperar a faixa. Dentro do intervalo: aguardar definição.');
      w.text('Estes níveis pertencem ao contrato retornado, não ao gráfico à vista. Sem série histórica real do futuro, não foram calculadas médias, tendência semanal ou variação semanal do contrato. Não se desenha uma série de IBOV como WIN nem USD/BRL como WDO.');
      w.heading('Antes de usar os níveis');w.text('Conferir contrato e vencimento, referência de preço na plataforma e horário do dado. Uma troca de contrato pode alterar preços e níveis. Atualizar a leitura após a abertura; o snapshot pode ter atraso.');
    }
    p.need(330);w.heading('Quadro de cenários e invalidação');w.table([['Ativo',18],['Alta: referência',27],['Baixa: referência',27],['Reavaliar',28]],paper.studies.filter(s=>s.available).map(s=>[s.ticker,number(s.resistance),number(s.support),'Retorno à faixa em fechamento']));
    w.heading('Roteiro para o diário');w.text(`1. Conferir agenda, feriados e vencimentos.
2. Atualizar preços e verificar a confirmação do cenário.
3. Registrar cenário principal, alternativo e invalidação.
4. Dimensionar risco e revisar o checklist.
5. Registrar a execução e revisar o processo ao encerrar.`);
    w.heading('Fontes e método');w.text('Dados históricos das fontes já integradas ao aplicativo, filtrados até o corte da edição; médias, RSI e faixas calculados pelo código. Futuros: snapshot separado do terminal, sem inventar histórico. Sessões ausentes não são preenchidas. A revista é original e não reproduz texto, marca, recomendações ou gráficos de outras publicações.');
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
        if(action==='portfolio'){status.textContent='Preparando o documento…';const data=await preparePortfolioInput();if(!data.assets.length&&!data.selected)throw Error('Cadastre posições ou abra uma análise da carteira primeiro.');box.close();rpAbrir('Relatório profissional da carteira','carteira-pesquisa-'+loc().slice(0,10)+'.pdf',()=>portfolioPdf(data))}
        if(action==='refresh'){if(window.DIARIO_DEMO)throw Error('Consultas externas desativadas no demo.');status.textContent='Carregando os dados pelos serviços existentes…';if(window.pfQAtualiza)await pfQAtualiza(true);if(window.pfMeta)await pfMeta();if(window.pfVelas)await pfVelas();status.textContent='Atualização concluída. Confira datas e eventuais lacunas no relatório.'}
        const selected=()=>[...new Set(box.querySelector('input').value.split(',').map(t=>t.trim().toUpperCase()).filter(t=>/^[A-Z0-9:^._=/-]{1,24}$/.test(t)))].slice(0,20);
        if(action==='load-weekend'){if(window.DIARIO_DEMO)throw Error('Consultas externas desativadas no demo.');const tickers=selected();for(let i=0;i<tickers.length&&!cancel;i++){status.textContent=`Histórico ${i+1}/${tickers.length}: ${tickers[i]}`;try{await window.TRM?.tec?.pegaVelas(tickers[i],'1d')}catch{}}status.textContent='Consulta encerrada; séries indisponíveis serão identificadas no PDF.'}
        if(action==='weekend'){const assets=selected().map(ticker=>({ticker,bars:technicalFromCache(ticker)}));box.close();rpAbrir('Revista do Pregão','revista-pregao-'+loc().slice(0,10)+'.pdf',()=>weekendPdf({ref:loc().slice(0,10),edition:typeof jrVer==='function'?jrVer():null,assets}))}
        if(action==='analysis'){
          if(window.DIARIO_DEMO)throw Error('Geração de IA desativada no demo.');const assets=pfCalc().pos.filter(a=>!pfUltRel(a.tk)).slice(0,24);if(!assets.length){status.textContent='Não há análise individual faltante entre as posições.';return}
          if(!confirm(`Gerar até ${assets.length} análises individuais faltantes usando a cota de IA da sua conta?`))return;
          for(let i=0;i<assets.length&&!cancel;i++){status.textContent=`Análise ${i+1}/${assets.length}: ${assets[i].tk}`;await pfGeraAtivo(assets[i],false)}if(window.PF)window.PF.rv=null;status.textContent='Fila encerrada. A exportação informa quais análises estão disponíveis.';
        }
      }catch(error){status.textContent=error.message||String(error)}finally{running=false}
    });document.body.append(box);box.showModal();
  }
  // O botão nativo de impressão passa a abrir um PDF com paginação própria.
  window.addEventListener('click',async event=>{if(!event.target.closest('[data-pf="print"]'))return;event.preventDefault();event.stopImmediatePropagation();try{const data=await preparePortfolioInput();rpAbrir('Relatório da carteira','carteira-'+loc().slice(0,10)+'.pdf',()=>portfolioPdf(data))}catch(error){toast(error.message||String(error))}},true);
  window.TraderReports={openHub,portfolioInput,preparePortfolioInput,portfolioPdf,weekendPdf,technicalMagazinePdf,study,weekly,bars,fundamentalRows,researchChart};
})();

;
/* módulo: carteira-experiencia.js */
/* Pesquisa da carteira integrada à posição e à IA de Carteiras. */
(() => {
 'use strict';const R=window.CarteiraResearch,safe=v=>esc(String(v??''));
 const money=(v,unit='BRL',digits=2)=>v==null?'Não disponível':Number(v).toLocaleString('pt-BR',{style:'currency',currency:unit,minimumFractionDigits:digits,maximumFractionDigits:digits});
 const today=()=>loc().slice(0,10);
 function context(){let performance=null,raw=null;try{performance=perfCalc();raw=window.TRM?.trGet('histp',pfHistArgs())?.v||window.PF.histUlt}catch{}const rows=(S.cart?.lanc||[]),snapshot=pfCalc();return {snapshot,ledger:rows,income:R.income(rows,today()),wealth:R.wealth(performance,rows,raw),performance,raw,asOf:today()}}
 function svgLine(points,label){
   if(points.length<2)return '<p class="cr-empty">Sem observações suficientes para o gráfico.</p>';
   const W=680,H=240,M=48,values=points.map(p=>p.value),min=Math.min(...values),max=Math.max(...values),span=max-min||Math.max(Math.abs(max)*.05,1),X=i=>M+(W-M-14)*i/(points.length-1),Y=v=>H-35-(v-min)/span*(H-65),path=points.map((p,i)=>(i?'L':'M')+X(i).toFixed(2)+' '+Y(p.value).toFixed(2)).join(' ');
   return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${safe(label)}"><title>${safe(label)}</title>${[0,.5,1].map(f=>{const value=min+span*f,y=Y(value);return `<line x1="${M}" x2="${W-14}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".12"/><text x="${M-6}" y="${y+4}" text-anchor="end" fill="currentColor" font-size="10">${safe((value/1000).toFixed(1))}k</text>`}).join('')}<path d="${path}" fill="none" stroke="#22b779" stroke-width="2.5"/>${points.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.value)}" r="3" fill="#22b779"><title>${safe(p.date)}: ${safe(money(p.value))}</title></circle>`).join('')}<text x="${M}" y="${H-8}" fill="currentColor" font-size="10">${safe(points[0].date)}</text><text x="${W-14}" y="${H-8}" text-anchor="end" fill="currentColor" font-size="10">${safe(points.at(-1).date)}</text></svg>`;
 }
 function bars(points,unit='BRL'){
   if(!points.length)return '<p class="cr-empty">Nenhum provento lançado neste período. Não foram estimados recebimentos.</p>';
   const max=Math.max(...points.map(p=>Math.abs(p.value)),1);return `<div class="cr-bars">${points.map(p=>`<div><span>${safe(p.date)}</span><i><b style="width:${Math.max(0,Math.abs(p.value)/max*100)}%"></b></i><strong>${safe(money(p.value,unit))}</strong></div>`).join('')}</div>`;
 }
 function charts(data){
   const units=['BRL','USD'].filter(unit=>data.income.events.some(e=>e.unit===unit));
   return `<section class="cr-section"><h3>Evolução do valor dos ativos</h3>${data.wealth.points.length?svgLine(data.wealth.points,'Valor dos ativos em BRL, sem caixa'):`<p class="cr-empty">${safe(data.wealth.reason)}</p>`}<p class="cr-note">Valor dos ativos, sem caixa. Compras, vendas e variação cambial alteram o patrimônio; este gráfico não é rentabilidade. Referência: ${safe(data.wealth.points.at(-1)?.date||'não disponível')}.</p></section><section class="cr-section"><h3>Proventos recebidos por mês</h3>${units.length?units.map(unit=>`<h4>${unit} · lançamentos registrados</h4>${bars(Object.entries(data.income.months).filter(([,v])=>v[unit]!==0).slice(-24).map(([date,v])=>({date,value:v[unit]})),unit)}`).join(''):'<p class="cr-empty">Sem proventos lançados. Cadastre dividendos, JCP ou rendimentos recebidos em Movimentação.</p>'}<p class="cr-note">Valores líquidos dos custos informados no lançamento. BRL e USD são separados; meses futuros não são preenchidos.</p></section>`;
 }
 function rowsHtml(asset,data){
   const d=R.detail(asset,data.ledger,today()),usdMissing=asset.moeda==='USD'&&!data.snapshot.fx;
   const rows=[['Quantidade',d.quantity?.toLocaleString('pt-BR',{maximumFractionDigits:8})],['Cotação',asset.tem?money(asset.pa,d.unit):'Sem cotação'],['Variação diária da posição atual',money(d.daily,d.unit)],['Resultado não realizado',money(d.result,d.unit)],['Resultado não realizado + proventos do ciclo',money(d.withIncome,d.unit)],['Preço médio',money(d.pm,d.unit,4)],['Preço médio líquido de proventos · gerencial',money(d.pmIncome,d.unit,4)],['Proventos lançados no ciclo atual',money(d.income,d.unit)],['Proventos de todo o histórico',money(d.allIncome,d.unit)],['Saldo atual da posição',money(d.value,d.unit)],['Custo da posição atual',money(d.cost,d.unit)],['Peso na carteira',usdMissing?'Indisponível sem câmbio':d.weight==null?'Não disponível':d.weight.toFixed(2)+'%']];
   return `<section class="cr-position"><h3>Sua posição · ${safe(asset.tk)}</h3><dl>${rows.map(([name,value])=>`<div><dt>${safe(name)}</dt><dd>${safe(value??'Não disponível')}</dd></div>`).join('')}</dl><p class="cr-note">Cotação: ${safe(asset.pxEm||'sem referência')}. Ciclo desde ${safe(d.cycleStart||'data não identificada')}. Proventos do ciclo são os lançados desde o último zeramento; elegibilidade na data-com não é aferida. Preço médio líquido é uma visão gerencial, sem alterar o preço médio cadastrado ou fiscal. A variação diária usa a quantidade atual, sem apurar operações intradiárias.</p><button class="pfbt" data-cr="movements" data-key="${safe(asset.k)}">Detalhes e movimentações</button></section>`;
 }
 function auditHelp(code){return ({fx:'Confira a taxa de câmbio da data deste lançamento na nota ou no extrato. O câmbio atual não substitui o histórico.',oversell:'Verifique se falta uma compra anterior, se a quantidade vendida está correta ou se houve um evento corporativo.',duplicate:'Compare os registros com a mesma identificação antes de remover uma possível duplicata.',date:'Confira a data do registro no formato dia, mês e ano.',fee:'Confira taxas e custos na nota de negociação.',price:'Confira o preço unitário ou o valor do recebimento.',quantity:'Confira a quantidade negociada.',event:'Confira o tipo e o fator do desdobramento, grupamento ou bonificação.',type:'Confira o tipo da movimentação cadastrada.'})[code]||'Compare o registro com a nota ou extrato da corretora.'}
 function openAudit(){window.CarteiraCorrection.open()}
 function decorate(){
   if(tab!=='carteiras'||!window.PF||!window.TraderReports)return;let data;try{data=context()}catch{return}
   const root=document.getElementById('app');
   const quality=R.coverage(data.snapshot.pos,today()),kpis=root.querySelector('.pf > .pfks');
   if(kpis&&!root.querySelector('.cr-coverage')){
     const note=document.createElement('p');note.className='cr-note cr-coverage';note.setAttribute('role','status');
     note.textContent=`Cotações disponíveis: ${quality.priced} de ${quality.total} ativos.`+
       (quality.missing.length?` Sem preço: ${quality.missing.join(', ')}. Valores consolidados podem incluir custo como referência; não representam patrimônio totalmente marcado a mercado.`:'')+
       (quality.undated.length?` Data não informada: ${quality.undated.join(', ')}.`:'')+
       (quality.previous.length?' Há preços de pregões anteriores; confira a referência ao abrir o ativo.':'');
     kpis.after(note);
     const audit=window.CarteiraCalculo.audit(data.ledger,today()),panel=document.createElement('details');panel.className='cr-audit pfc';
     panel.innerHTML=`<summary>Revisar registros da carteira · ${audit.issues.length} pendência(s)</summary><p>Conferência aritmética dos registros até ${safe(today())}. Valores por moeda de origem. Não substitui validação fiscal, extratos ou elegibilidade de proventos.</p>${audit.issues.length?'<ul>'+audit.issues.map(issue=>'<li><b>'+safe([issue.date,issue.ticker].filter(Boolean).join(' · '))+'</b><p>'+safe(issue.message)+'</p><p>'+safe(auditHelp(issue.code))+'</p><button type="button" class="pfbt pfmini" data-cc-index="'+issue.index+'">Corrigir este lançamento</button></li>').join(''):'<p>Nenhuma inconsistência detectada pelas regras desta conferência.</p>'}<div class="wf-table"><table><thead><tr><th>Ativo</th><th>Moeda</th><th>Quantidade</th><th>Preço médio</th><th>Realizado</th><th>Proventos</th></tr></thead><tbody>${audit.positions.map(p=>'<tr><th>'+safe(p.tk)+'</th><td>'+safe(p.unit)+'</td><td>'+safe(p.q.toLocaleString('pt-BR',{maximumFractionDigits:8}))+'</td><td>'+money(p.pm,p.unit,4)+'</td><td>'+money(p.real,p.unit)+'</td><td>'+money(p.prov,p.unit)+'</td></tr>').join('')}</tbody></table></div>`;
     note.after(panel);
     panel.id='cr-ledger-audit';
     if(audit.issues.length){
       const alert=document.createElement('section');alert.className='cr-audit-alert';alert.setAttribute('role','status');
       alert.innerHTML='<h3>'+new Set(audit.issues.map(i=>i.index)).size+' registros precisam de revisão</h3><p>Abra a correção guiada para revisar cada registro. O campo com problema será destacado e os indicadores serão recalculados ao salvar.</p><button type="button" class="pfbt" data-cr="audit">Corrigir lançamentos</button>';
       kpis.before(alert);
       const indices=[2,4,5,...(audit.issues.some(i=>i.code!=='fx')?[3]:[]),...(audit.issues.some(i=>i.code==='fx')?[1,6]:[])];
       for(const i of indices){const card=kpis.children[i],value=card?.querySelector('b');if(value){value.textContent='Indisponível';value.className='cr-unavailable';card.querySelectorAll('em').forEach(el=>el.remove());const hint=document.createElement('small');hint.textContent='Histórico pendente de revisão';card.append(hint)}}
       panel.insertAdjacentHTML('beforeend','<p>Compare cada registro acima com sua nota ou extrato. Não preencha câmbio ou preços por estimativa.</p><button type="button" class="pfbt" data-cr="ledger">Abrir movimentações</button>');
     }
     if(quality.missing.length){const title=kpis.querySelector('.pfk span');if(title)title.textContent='Patrimônio de referência (parcial)'}
   }
   if(window.PF.sel){const box=root.querySelector('.pfmd[data-pfbk="selx"] .pfmb'),asset=data.snapshot.pos.find(a=>a.k===window.PF.sel);if(box&&asset&&!box.querySelector('.cr-position')){const head=box.querySelector('.pfdh');if(head)head.insertAdjacentHTML('afterend',rowsHtml(asset,data));else box.insertAdjacentHTML('afterbegin',rowsHtml(asset,data));box.querySelectorAll('.pfks.pfks6').forEach(node=>node.remove())}}
   if(window.PF.rv){const box=root.querySelector('.pfprint'),report=(window.PF.rel||[]).find(r=>String(r.id)===String(window.PF.rv));if(box&&!box.querySelector('.cr-report-visual')){
     const wrapper=document.createElement('div');wrapper.className='cr-report-visual';wrapper.innerHTML='<h2>Pesquisa patrimonial</h2><p class="cr-note">Gráficos dos registros atuais da carteira. Referência da análise selecionada: '+safe(report?.ref||'não informada')+'. Não representam a composição histórica de uma análise antiga.</p>'+charts(data)+'<p><button class="pfbt pfam" data-cr="pdf">Baixar relatório profissional em PDF</button></p>';const title=box.querySelector('.pfmodalh,.pfmh');if(title)title.after(wrapper);else box.prepend(wrapper);
   }}
   if(window.PF.aba==='ia'&&!root.querySelector('.cr-research-intro')){const target=root.querySelector('.pf');if(target){const section=document.createElement('section');section.className='cr-research-intro pfc';section.innerHTML='<h3>Relatório patrimonial e fundamentalista</h3><p>Gere a análise consolidada pelos botões desta aba. Ao abrir o relatório, veja evolução, proventos e fichas por ativo; a exportação usa paginação própria.</p><button class="pfbt" data-cr="load">Carregar histórico e fundamentos</button>';target.append(section)}}
 }
 window.TraderUI.onRender('carteira-experiencia',decorate);
 window.addEventListener('click',async event=>{
   const button=event.target.closest('[data-cr]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();
   const label=button.textContent;
   if(button.dataset.cr==='audit')openAudit();
   if(button.dataset.cr==='ledger'){window.PF.aba='ativos';window.PF.amb='mov';render()}
   if(button.dataset.cr==='pdf'){const label=button.textContent;button.disabled=true;button.textContent='Carregando dados…';try{const input=await TraderReports.preparePortfolioInput();rpAbrir('Relatório patrimonial e fundamentalista','carteira-pesquisa-'+today()+'.pdf',()=>TraderReports.portfolioPdf(input))}catch(error){toast(error.message||String(error))}finally{button.disabled=false;button.textContent=label}}
   if(button.dataset.cr==='load'){if(window.DIARIO_DEMO)return toast('Consultas externas desativadas na demonstração.');button.disabled=true;try{await Promise.allSettled([pfHist(),pfMeta(),pfRel(true)]);render()}finally{button.disabled=false;button.textContent=label}}
   if(button.dataset.cr==='movements'){const asset=dataFor(button.dataset.key);if(!asset)return;const d=R.detail(asset,(S.cart?.lanc||[]),today()),dialog=document.createElement('dialog');dialog.id='cr-movements';document.getElementById('cr-movements')?.remove();dialog.className='wf-dialog';dialog.innerHTML='<header><h2>'+safe(asset.tk)+' · movimentações</h2><button class="btn s" data-cr="close">Fechar</button></header><div class="wf-content"><div class="wf-table"><table><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Preço / valor</th></tr>'+d.events.map(r=>'<tr><td>'+safe(r.d)+'</td><td>'+safe(({C:'Compra',V:'Venda',P:'Provento',E:'Evento'})[r.tp]||r.tp)+'</td><td>'+safe(r.q||'—')+'</td><td>'+safe(r.p??'—')+'</td></tr>').join('')+'</table></div></div>';document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal()}
   if(button.dataset.cr==='close')button.closest('dialog')?.close();
 },true);
 function dataFor(key){try{return pfCalc().pos.find(a=>a.k===key)}catch{return null}}
 window.CarteiraExperience={openAudit,context,charts,rowsHtml,decorate,svgLine,bars};
})();

;
/* módulo: carteira-correcao.js */
/* Edição guiada de registros existentes: nunca cria câmbio ou duplica uma movimentação. */
(function(root){
 'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v));
 const fields=['tp','mk','tk','cl','d','q','p','cs','fx','ev','f','sub','nota'];
 function repair(rows,index,values,now=Date.now(),newId=''){
  if(!Number.isInteger(index)||!rows[index])throw Error('O lançamento não está mais disponível. Reabra a revisão.');
  const result=clone(rows),previous=result[index],next={...previous};
  for(const key of fields)if(Object.hasOwn(values,key))next[key]=String(values[key]).trim();
  if(next.tk)next.tk=next.tk.toUpperCase();
  if(['A','R'].includes(next.tp)){next.mk='BR';next.tk='';next.cl='';}
  if(previous.mk!==next.mk&&next.cl){const pairs={acao:'acao_ext',etf:'etf_ext',acao_ext:'acao',etf_ext:'etf'};if((next.mk==='US'&&['acao','etf'].includes(next.cl))||(next.mk==='BR'&&['acao_ext','etf_ext'].includes(next.cl)))next.cl=pairs[next.cl];}
  if(next.mk==='CR')next.cl='cripto';
  if(next.mk==='US'&&!['acao_ext','etf_ext'].includes(next.cl))next.cl=next.cl==='etf'?'etf_ext':'acao_ext';
  if(!['BR','US','CR'].includes(next.mk))throw Error('Escolha o mercado do lançamento.');
  if(!['A','R'].includes(next.tp)&&!next.tk)throw Error('Informe o ativo.');
  if(values.resolution==='distinct'){if(!newId||rows.some(r=>r.id===newId))throw Error('Identificação nova inválida.');next.id=newId;}
  if(!next.id){if(!newId)throw Error('Identificação de lançamento ausente.');next.id=newId;}
  const stamp=Math.max(now,(+previous.u||0)+1);next.u=stamp;
  result[index]=next;
  const C=root.CarteiraCalculo,before=C.audit(rows),after=C.audit(result),rowIssues=after.issues.filter(i=>i.index===index);
  if(rowIssues.length)throw Error(rowIssues.map(i=>i.message).join(' '));
  const prior=new Set(before.issues.map(i=>i.index+':'+i.code));
  const added=after.issues.find(i=>!prior.has(i.index+':'+i.code));
  if(added)throw Error('Esta alteração cria outra pendência em '+(added.ticker||'outro lançamento')+': '+added.message);
  if(root.TraderModel)root.TraderModel.archive(next,previous,'correcao-carteira',stamp,0);
  return {rows:result,remaining:after.issues};
 }
 root.CarteiraCorrectionModel={repair};
 if(!root.document)return;
 const safe=v=>esc(String(v??'')),labels={C:'Compra',V:'Venda',P:'Provento',E:'Evento corporativo',A:'Aporte',R:'Retirada'};
 const fieldByCode={fx:'fx',oversell:'q',quantity:'q',price:'p',fee:'cs',date:'d',event:'f',type:'tp',duplicate:'resolution'};
 let dialog=null,index=null,original='',owner=null,draft=null;
 const ledger=()=>S.cart?.lanc||[],account=()=>SESS?.uid||S.uid||null;
 function issues(){return root.CarteiraCalculo.audit(ledger()).issues}
 function input(key,label,type='text',invalid=false){return `<label class="${invalid?'cc-field-error':''}">${safe(label)}${invalid?'<small>Campo a corrigir</small>':''}${invalid&&key==='fx'?'<small>Use o câmbio da nota ou do extrato desta operação.</small>':''}<input name="${key}" type="${type}" value="${safe(draft[key]??'')}"${type==='text'&&['q','p','cs','fx','f'].includes(key)?' inputmode="decimal"':''}${invalid?' aria-invalid="true"':''}></label>`}
 function choose(key,label,options,invalid=false){return `<label class="${invalid?'cc-field-error':''}">${label}<select name="${key}"${invalid?' aria-invalid="true"':''}>${Object.entries(options).map(([v,t])=>`<option value="${v}"${draft[key]===v?' selected':''}>${t}</option>`).join('')}</select></label>`}
 function selectRow(i){index=i;draft=clone(ledger()[i]);original=JSON.stringify(ledger()[i]);paint();const code=issues().find(v=>v.index===index)?.code,key=fieldByCode[code];const target=dialog.querySelector(`[name="${key||'d'}"]`);target?.focus({preventScroll:true});target?.scrollIntoView({block:'center'})}
 function paint(message=''){
  const pending=issues(),selected=pending.filter(i=>i.index===index),bad=new Set(selected.map(i=>fieldByCode[i.code])),row=ledger()[index];
  if(!row){index=null;draft=null}
  const queue=[...new Set(pending.map(i=>i.index))];
  dialog.innerHTML=`<header><div><small>CARTEIRA · MOVIMENTAÇÕES</small><h2>${draft?'Corrigir '+safe(row.tk||labels[row.tp]):'Revisão concluída'}</h2></div><button class="btn s" type="button" data-cc="close">Fechar</button></header><div class="wf-content">${message?`<p role="status" class="cc-status">${safe(message)}</p>`:''}${queue.length?`<label>Lançamento para revisar<select data-cc="choose">${queue.map(i=>`<option value="${i}"${i===index?' selected':''}>${safe(ledger()[i].d)} · ${safe(ledger()[i].tk||labels[ledger()[i].tp])} · ${safe(pending.filter(p=>p.index===i).map(p=>p.message).join(' '))}</option>`).join('')}</select></label>`:'<p>Não há pendências detectadas pelas regras da conferência. Os indicadores da carteira serão recalculados.</p>'}${draft?`<section class="cc-reasons"><h3>O que precisa mudar</h3>${selected.length?selected.map(i=>`<p>${safe(i.message)}</p>`).join(''):'<p>Edite os dados deste lançamento conforme sua nota ou extrato.</p>'}${bad.has('fx')?'<p>Informe o câmbio usado neste lançamento, em reais por US$ 1. Use a nota ou o extrato da data da operação; o dólar atual não serve para corrigir o custo histórico.</p>':''}${selected.some(i=>i.code==='oversell')?'<p>Confira se falta uma compra anterior ou um evento corporativo. Se o registro estiver correto, feche esta janela e cadastre a movimentação que falta.</p>':''}</section><form id="cc-form"><div class="cc-grid">${choose('tp','Tipo',labels,bad.has('tp'))}${choose('mk','Mercado / moeda',{BR:'Brasil · BRL',US:'Estados Unidos · USD',CR:'Cripto · BRL'})}${input('tk','Ativo')}${input('d','Data','date',bad.has('d'))}${['C','V','P'].includes(draft.tp)?input('q',draft.tp==='P'?'Quantidade do provento (vazio = valor total)':'Quantidade','text',bad.has('q')):''}${input('p',draft.tp==='E'?'Custo atribuído na bonificação':draft.tp==='P'?'Valor por unidade ou total (conforme quantidade)':'Preço unitário / valor','text',bad.has('p'))}${input('cs','Taxas e custos','text',bad.has('cs'))}${draft.mk==='US'?input('fx','Câmbio histórico · R$ por US$ 1','text',bad.has('fx')):''}${draft.tp==='E'?choose('ev','Evento',{desd:'Desdobramento',grup:'Grupamento',bonif:'Bonificação'})+input('f','Fator / percentual','text',bad.has('f')):''}${bad.has('resolution')?choose('resolution','Mesmo identificador de negócio',{'':'Escolha como tratar',distinct:'São movimentações diferentes · separar identificação'},true):''}${input('nota','Anotação')}</div><p class="cc-error" role="alert"></p><div class="cc-actions"><button type="submit" class="btn">Salvar correção</button><button type="button" class="btn s" data-cc="close">Cancelar</button></div><p class="rs-note">Você está editando um registro existente. O aplicativo mantém uma cópia anterior no histórico local e recalcula a carteira. Não altera ordens na corretora.</p></form>`:''}</div>`;
 }
 function open(i){
  root.TerminalResearch?.state&&document.getElementById('research-workbench')?.close();root.TraderChat?.close();
  if(tab!=='carteiras')root.DIARIO_NAV.navigate('carteiras');root.PF.aba='ativos';root.PF.amb='mov';root.PF.sel=null;root.PF.form=null;render();
  owner=account();const target=Number.isInteger(i)?i:issues()[0]?.index;
  if(!dialog){dialog=document.createElement('dialog');dialog.id='cc-editor';dialog.className='wf-dialog cc-editor';dialog.setAttribute('aria-label','Corrigir movimentações da carteira');document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-cc="close"]'))dialog.close()});dialog.addEventListener('change',e=>{if(e.target.matches('[data-cc="choose"]'))return selectRow(Number(e.target.value));if(e.target.name&&draft){Object.assign(draft,Object.fromEntries(new FormData(dialog.querySelector('form'))));if(['tp','mk','ev'].includes(e.target.name))paint()}});dialog.addEventListener('submit',submit);dialog.addEventListener('close',()=>{index=null;draft=null;original='';root.TraderUI.refreshScroll()})}
  if(!dialog.open)dialog.showModal();if(target!==undefined&&ledger()[target])selectRow(target);else{index=null;draft=null;paint()}root.TraderUI.refreshScroll();
 }
 function submit(event){
  event.preventDefault();const error=dialog.querySelector('.cc-error');
  try{
   if(account()!==owner)throw Error('A conta mudou. Feche e reabra a revisão.');
   if(S.del?.[ledger()[index]?.id]&&S.del[ledger()[index].id]>=(+ledger()[index].u||0))throw Error('Este lançamento foi excluído. Feche e reabra a carteira.');
   if(JSON.stringify(ledger()[index])!==original)throw Error('Este lançamento mudou durante a edição. Feche e reabra para evitar sobrescrever a alteração.');
   const values=Object.fromEntries(new FormData(event.target)),result=repair(ledger(),index,values,Date.now(),uid());
   S.cart.lanc=result.rows;root.PF.perfCache=null;root.PF.qts=0;save();render();
   const next=result.remaining[0]?.index;
   if(next!==undefined){selectRow(next);dialog.querySelector('.wf-content').insertAdjacentHTML('afterbegin','<p class="cc-status" role="status">Correção aplicada. Revise a próxima pendência. O estado do salvamento aparece na barra do aplicativo.</p>')}
   else{index=null;draft=null;paint('Correção aplicada. Nenhuma pendência restante. O estado do salvamento aparece na barra do aplicativo.')}
  }catch(e){error.textContent=e.message||String(e)}
 }
 function decorate(){
  if(owner!==null&&account()!==owner)dialog?.close();if(tab!=='carteiras')return;
  document.querySelectorAll('[data-pf^="del|"]').forEach(b=>{const id=b.dataset.pf.slice(4),matches=ledger().map((r,i)=>({r,i})).filter(v=>v.r.id===id);if(matches.length!==1||b.parentElement.querySelector('[data-cc-index]'))return;const edit=document.createElement('button');edit.type='button';edit.className='pfbt pfmini';edit.dataset.ccIndex=matches[0].i;edit.textContent='Editar';b.before(edit)});
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-cc-index]');if(b){e.preventDefault();e.stopImmediatePropagation();open(Number(b.dataset.ccIndex))}},true);
 root.TraderUI.onRender('carteira-correcao',decorate);
 root.CarteiraCorrection={open,decorate};
})(typeof window==='undefined'?globalThis:window);

;
/* módulo: revista-fim-semana.js */
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

;
/* módulo: interface-acabamento.js */
/* Acabamento compartilhado das telas e formulários. Sem substituir renderizadores. */
(function(root){
 'use strict';
 let fieldSerial=0;
 const names={home:'Início',dia:'Meu dia',ops:'Operações',trades:'Trades',stats:'Estatísticas',mercado:'Mercado',term:'Terminal',mais:'Configurações'};
 const icons={'×':'Fechar','✕':'Fechar','↻':'Atualizar','⟳':'Atualizar','🔄':'Atualizar','?':'Ajuda','…':'Mais opções','⋮':'Mais opções','☰':'Abrir menu','+':'Adicionar','＋':'Adicionar','−':'Diminuir'};
 function accessibleButtons(scope){
  for(const button of scope.querySelectorAll('button')){
   if(button.hasAttribute('aria-label')||button.hasAttribute('aria-labelledby'))continue;
   const text=button.textContent.trim();
   const name=button.title||names[button.dataset.tab]||icons[text];
   if(name)button.setAttribute('aria-label',name);
  }
 }
 function fields(scope){
  for(const field of scope.querySelectorAll('input:not([type=hidden]),select,textarea')){
   if(field.closest('label')||field.hasAttribute('aria-label')||field.hasAttribute('aria-labelledby')||field.id&&scope.querySelector(`label[for="${root.CSS?.escape?root.CSS.escape(field.id):field.id.replace(/[^\w-]/g,'')}"]`))continue;
   const label=field.previousElementSibling;
   if(label?.tagName==='LABEL'&&!label.querySelector('input,select,textarea')){
    if(!field.id)field.id='ui-field-'+(++fieldSerial);label.htmlFor=field.id;
   }else if(field.placeholder&&/[a-zÀ-ÿ]/i.test(field.placeholder))field.setAttribute('aria-label',field.placeholder);
  }
 }
 function tables(scope){
  for(const table of scope.querySelectorAll('table')){
   if(table.closest('.trm,.ui-table-scroll,.anxt,[data-ui-scroll]'))continue;
   const parent=table.parentElement;if(!parent)continue;
   // Mantém os contêineres de rolagem específicos dos módulos.
   if(/auto|scroll/.test(parent.style.overflowX)||parent.classList.contains('xt-w'))continue;
   const wrapper=root.document.createElement('div');wrapper.className='ui-table-scroll';
   wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label',table.caption?.textContent?.trim()||'Tabela de dados · deslize para ver todas as colunas');wrapper.tabIndex=0;
   parent.insertBefore(wrapper,table);wrapper.appendChild(table);
   if(table.rows[0]?.cells.length>5)wrapper.classList.add('ui-table-wide');
   for(const cell of table.querySelectorAll('thead th'))if(!cell.hasAttribute('scope'))cell.scope='col';
  }
 }
 function enhance(scope){if(!scope)return;accessibleButtons(scope);fields(scope);tables(scope);for(const link of scope.querySelectorAll('a[target="_blank"]')){const rel=new Set((link.rel||'').split(/\s+/).filter(Boolean));rel.add('noopener');link.rel=[...rel].join(' ')}}
 function screen(){const app=root.document.getElementById('app');if(!app)return;app.dataset.screen=typeof tab==='string'?tab:'';app.classList.toggle('ui-standard-screen',tab!=='term');enhance(app);accessibleButtons(root.document.querySelector('nav')||root.document)}
 function sheet(){enhance(root.document.getElementById('sh'))}
 root.TraderUI.onRender('interface-acabamento',screen);
 root.TraderUI.onSheet('interface-acabamento',sheet);
 root.DiarioAcabamento=Object.freeze({enhance,screen,sheet});
 screen();sheet();
})(window);

;
/* módulo: fluxo-importacao.js */
/* CSV de negócios: identidade estável compatível com a ponte, sem inferir agressão. */
(function(root){
 'use strict';
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const aliases={id:['tradeid','idnegocio','numeronegocio','numerodonegocio','negocio','id'],ticker:['ticker','ativo','codigo'],stamp:['tradedat','datahora','timestamp'],date:['data','date'],time:['hora','horario','time'],price:['price','preco','valor'],quantity:['quantity','quantidade','qtd'],side:['side','agressao','agressor','tipodeagressao'],buyer:['buyer','compradora','comprador','corretoracompradora'],seller:['seller','vendedora','vendedor','corretoravendedora']};
 function csv(text){
  if(typeof text!=='string'||text.length>5*1024*1024)throw Error('Use um CSV de até 5 MB. Divida exportações maiores por ativo e data.');
  text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0],scores=[';',',','\t'].map(d=>[d,first.split(d).length]);const sep=scores.sort((a,b)=>b[1]-a[1])[0][0];
  const lines=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))lines.push(row);row=[];cell=''}else cell+=c;if(lines.length>5001)throw Error('Máximo de 5.000 negócios por arquivo.');}
  if(quoted)throw Error('CSV com aspas sem fechamento. Exporte novamente o arquivo.');row.push(cell);if(row.some(x=>x.trim()))lines.push(row);if(lines.length>5001)throw Error('Máximo de 5.000 negócios por arquivo.');if(lines.length<2)throw Error('O arquivo precisa de cabeçalho e linhas de negócios.');
  const headers=lines.shift().map(normalize);if(new Set(headers).size!==headers.length)throw Error('Há nomes de colunas repetidos no CSV.');
  const columns=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,a.map(v=>headers.indexOf(v)).find(v=>v>=0)??-1]));
  const missing=['id','ticker','price','quantity'].filter(k=>columns[k]<0);if(columns.stamp<0&&(columns.date<0||columns.time<0))missing.push('data e hora');
  if(missing.length)throw Error('Colunas obrigatórias não encontradas: '+missing.map(k=>({id:'ID do negócio (não ID da ordem)',ticker:'Ativo',price:'Preço',quantity:'Quantidade'})[k]||k).join(', ')+'. Exporte o Times & Trades, não o relatório das suas ordens.');
  return {columns,lines};
 }
 function timestamp(raw){
  const text=String(raw||'').trim(),br=text.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](.+)$/);let iso=br?`${br[3]}-${br[2]}-${br[1]}T${br[4]}`:text.replace(' ','T');
  iso=iso.replace(/,(\d{1,6})/g,'.$1');if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/.test(iso))return null;
  if(+iso.slice(11,13)>23||+iso.slice(14,16)>59||+iso.slice(17,19)>59)return null;
  const date=iso.slice(0,10);if(Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)return null;
  if(!/(?:Z|[+-]\d{2}:\d{2})$/.test(iso))iso+='-03:00';const n=Date.parse(iso);return Number.isFinite(n)?new Date(n).toISOString():null;
 }
 async function parse(text,now=Date.now()){
  const {columns:c,lines}=csv(text),records=new Map(),invalid=[];let duplicate=0;
  for(let i=0;i<lines.length;i++){
   const cells=lines[i],get=k=>c[k]>=0?String(cells[c[k]]??'').trim():'',id=get('id'),ticker=get('ticker').toUpperCase(),price=root.CarteiraCalculo.num(get('price')),quantity=root.CarteiraCalculo.num(get('quantity')),traded_at=timestamp(get('stamp')||get('date')+' '+get('time'));
   if(!id||id.length>160||!/^[A-Z0-9.]{1,18}$/.test(ticker)||!(price>0&&price<1e12)||!(quantity>0&&quantity<1e15)||!traded_at||Date.parse(traded_at)<Date.parse('2000-01-01')||Date.parse(traded_at)>now+300000){invalid.push(i+2);continue}
   const session=new Date(Date.parse(traded_at)-3*3600000).toISOString().slice(0,10),identity=ticker+'|'+session+'|'+id;
   const digest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)),trade_id=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
   const side=normalize(get('side')),row={trade_id,ticker,traded_at,price,quantity,side:['buy','compra','comprador','compradora','agressaocompra'].includes(side)?'buy':['sell','venda','vendedor','vendedora','agressaovenda'].includes(side)?'sell':'unknown',buyer:get('buyer').slice(0,100)||null,seller:get('seller').slice(0,100)||null,source:'Profit CSV'};
   if(records.has(trade_id)){if(JSON.stringify(records.get(trade_id))!==JSON.stringify(row))throw Error('O mesmo ID de negócio aparece com dados diferentes na linha '+(i+2)+'. Confira a exportação.');duplicate++}records.set(trade_id,row);
  }
  if(!records.size)throw Error('Nenhuma linha válida. Confira ID do negócio, ativo, data completa, preço e quantidade.');
  return {records:[...records.values()],invalid,duplicate,total:lines.length};
 }
 root.FluxoImportacao={parse,csv,timestamp};
})(typeof window==='undefined'?globalThis:window);

;
/* módulo: terminal-pesquisa.js */
/* Mesa de pesquisa: uma área para ativo, comparáveis, radar, risco e fluxo da ponte. */
(() => {
 'use strict';
 const M=window.TerminalResearchModel,api=()=>window.TRM,safe=v=>esc(String(v??'')),fmt=(v,d=2)=>M.finite(v)?v.toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
 const sectorName=value=>({'Basic Materials':'Materiais básicos','Financial Services':'Serviços financeiros',Financials:'Financeiro',Industrials:'Indústria',Technology:'Tecnologia',Healthcare:'Saúde',Energy:'Energia',Utilities:'Serviços públicos','Real Estate':'Imobiliário','Consumer Cyclical':'Consumo cíclico','Consumer Defensive':'Consumo não cíclico','Communication Services':'Comunicações'})[value]||value;
 const metricText=(id,value)=>id==='marketcap'&&M.finite(value)?value.toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:2}):fmt(value);
 const state={view:'ativo',ticker:'PETR4',compare:[],loaded:{},news:{},radar:[],radarAt:null,flow:[],flowDate:'',flowStatus:'idle',flowAt:null,flowLatest:null,flowImport:null,flowAuto:false,busy:false,message:'',shock:-10,weights:{},owner:null,ownerId:null};
 let box=null,generation=0,flowTimer=null;
 const note=t=>`<p class="rs-note">${safe(t)}</p>`;
 const action=(id,text,attrs='')=>`<button type="button" class="rs-button" data-rs="${id}" ${attrs}>${safe(text)}</button>`;
 function positions(){try{return pfCalc().pos||[]}catch{return []}}
 function keys(){const wl=window.PFX?.WL?.();const all=[...positions().map(a=>a.tk),...(Array.isArray(wl)?wl:[]).map(a=>a.tk)];return [...new Set(all)].slice(0,8)}
 function preferences(){return S.ax?.research||{}}
 function savePreferences(value){S.ax??={};S.ax.research={...preferences(),...value};save()}
 function fund(tk){const data=state.loaded[tk]||api()?.trGet('fund',{tk})?.v||{},meta=window.PFX?.META?.()?.[tk]||{};return M.fundamental(tk,data,meta)}
 function bars(tk){return api()?.tec?.velas(tk,'1d')?.L||[]}
 function link(url,title){try{const u=new URL(url);if(u.protocol!=='https:')return safe(title);return `<a href="${safe(u.href)}" target="_blank" rel="noopener noreferrer">${safe(title)}</a>`}catch{return safe(title)}}
 function table(headers,rows){return `<div class="rs-table" tabindex="0" role="region" aria-label="Tabela de pesquisa"><table><thead><tr>${headers.map(h=>`<th scope="col">${safe(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map((v,i)=>`<${i?'td':'th scope="row"'}>${v}</${i?'td':'th'}>`).join('')+'</tr>').join('')}</tbody></table></div>`}
 function chart(series,title){
  const list=series.filter(r=>M.finite(r.value));if(list.length<2)return note('Histórico insuficiente para '+title.toLowerCase()+'.');
  const low=Math.min(...list.map(r=>r.value)),high=Math.max(...list.map(r=>r.value)),span=high-low||1,X=i=>54+i/(list.length-1)*574,Y=v=>166-(v-low)/span*126;
  return `<figure class="rs-chart"><figcaption>${safe(title)}</figcaption><svg viewBox="0 0 680 208" role="img" aria-label="${safe(title)}"><title>${safe(title)}</title>${[low,(low+high)/2,high].map(v=>`<line x1="54" x2="628" y1="${Y(v)}" y2="${Y(v)}" class="rs-grid"/><text x="8" y="${Y(v)+4}">${safe(fmt(v,0))}</text>`).join('')}<path d="${list.map((r,i)=>(i?'L':'M')+X(i).toFixed(2)+','+Y(r.value).toFixed(2)).join(' ')}"/><text x="54" y="195">${safe(list[0].date)}</text><text x="628" y="195" text-anchor="end">${safe(list.at(-1).date)}</text></svg></figure>`;
 }
 function input(label,name,value,type='text'){return `<label>${safe(label)}<input name="${name}" type="${type}" value="${safe(value??'')}" ${type==='number'?'step="any"':''}></label>`}
 const views={ativo:['Analisar ativo','Fundamentos, resultados e sua tese'],comparar:['Comparar ativos','Indicadores lado a lado'],radar:['Buscar oportunidades','Filtros de empresas no Brasil e EUA'],risco:['Risco da carteira','Correlação, cenários e exposição']};
 function header(){const flowView=state.view==='fluxo';return `<header class="rs-header"><div><small>${flowView?'TERMINAL · FLUXO':'PESQUISA DE MERCADO'}</small><h2>${flowView?'Fluxo de negócios':'Pesquisa de investimentos'}</h2></div>${action('close','Fechar')}</header>${flowView?'':`<div class="rs-tabs" role="navigation" aria-label="Pesquisa">${Object.entries(views).map(([id,[label,description]])=>`<button type="button" class="rs-button" data-rs="view" data-view="${id}" aria-current="${state.view===id?'page':'false'}"><b>${label}</b><small>${description}</small></button>`).join('')}</div>`}`}
 function intro(){const descriptions={ativo:['Análise de um ativo','Digite um código, como PETR4, e toque em Atualizar dados. Os fundamentos, balanços e histórico da sua tese aparecem abaixo.'],comparar:['Comparação de fundamentos','Digite de 2 a 6 códigos separados por espaço. No celular, cada ativo tem uma ficha; a tabela completa permite comparar os indicadores.'],radar:['Busca por indicadores','Defina o mercado e os filtros desejados. O resultado é uma seleção da fonte consultada, não uma recomendação de compra.'],risco:['Entenda o risco da sua carteira','Veja como as posições se relacionam e simule mudanças de preço. As simulações não alteram seus lançamentos.'],fluxo:['Times & Trades da sua ponte','Consulte negócios executados por ativo e data. Esta área é independente da carteira e depende da captura configurada no Profit.']};const [title,description]=descriptions[state.view];return `<section class="rs-intro"><h3>${title}</h3>${note(description)}</section>`}
 function asset(){
  const tk=state.ticker,f=fund(tk),position=positions().find(a=>a.tk===tk),cached=api()?.trGet('cot',{s:[tk]})?.v?.itens?.[0]||{},q=api()?.melhorPx(tk,cached)||{},annual=f.annual,groups=M.normalizeNews(state.news[tk]||[]);
  return `<form data-rsform="ativo" class="rs-controls">${input('Ativo','ticker',tk)}<button class="rs-button" type="submit">Consultar ativo</button></form><div class="rs-title"><div><h3>${safe(tk)}</h3><p>${safe(f.name)} · ${safe(sectorName(f.sector))}</p></div><div><b>${fmt(q.px??(position?.tem?position.pa:null))}</b><small class="${M.finite(q.d1)?q.d1<0?'r':'g':''}">${safe(f.currency)} · ${M.finite(q.d1)&&q.d1>0?'+':''}${fmt(q.d1)}%</small></div></div>
   ${note(q.px==null&&position?.tem?'Carteira · preço registrado: '+(position.pxEm||'data não informada')+'. Atualize para consultar uma cotação.':'Cotação: '+(q.fonte||'não disponível')+' · horário do preço: '+(q.horarioPreco||'não informado')+'. '+(q.fonte==='Profit'?'Recepção da ponte: '+(q.ts?new Date(q.ts).toLocaleString('pt-BR'):'não informada')+'. Não equivale ao horário de negócio.':'Atraso: '+(q.atraso===false?'conforme fonte':'não confirmado')+'.'))}<div class="rs-actions">${action('graph','Gráfico')}${action('news','Notícias no terminal')}${action('income','Proventos')}${action('ai','Perguntar à IA')}</div>
   ${note('Fundamentos consultados: '+(f.queried?new Date(f.queried).toLocaleString('pt-BR'):'ainda não carregados')+'. Data contábil: '+(f.accountingRef||'ver períodos no histórico')+'. A consulta não comprova atualização do balanço.')}
   <details class="rs-section"><summary>Entenda os principais indicadores</summary>${note('P/L: preço dividido pelo lucro por ação. P/VP: preço dividido pelo patrimônio por ação. EV/EBITDA: valor da empresa em relação ao resultado operacional antes de juros, impostos, depreciação e amortização. DY: proventos em relação ao preço, conforme o período da fonte. ROE: lucro em relação ao patrimônio. Margem líquida: parcela da receita que virou lucro. Valores ausentes aparecem como traço; não são zero.')}</details>${table(['Indicador','Valor','Fonte'],M.fields.map(([id,label,unit])=>[safe(label),metricText(id,f.metric[id])+(f.metric[id]!==null?' '+safe(unit==='moeda'?f.currency:unit):''),safe(f.origin[id]||'Indisponível')]))}
   ${position?'<details class="rs-section"><summary>Sua posição</summary>'+table(['Quantidade','Preço médio','Valor da posição','Peso'],[[fmt(position.q,4),fmt(position.pm,4),fmt(position.tem?position.v:null),fmt(position.peso)+'%']])+note('Posição cadastrada na carteira; valor consolidado em BRL, sujeito à cobertura do câmbio.')+'</details>':''}
   <section class="rs-section"><h3>Resultados ao longo do tempo</h3>${chart(annual.map(r=>({date:r.date,value:r.revenue})),'Receita anual · '+f.financialCurrency)}${chart(annual.map(r=>({date:r.date,value:r.profit})),'Lucro líquido anual · '+f.financialCurrency)}${annual.length?table(['Ano','Receita','Lucro'],annual.map(r=>[safe(r.date),fmt(r.revenue),fmt(r.profit)])):''}</section>
   ${window.ResearchAdvanced?.assetSections(tk,state.loaded[tk]||api()?.trGet('fund',{tk})?.v||{})||''}<section class="rs-section"><h3>Notícias do ativo</h3>${groups.length?groups.slice(0,12).map(g=>`<article class="rs-news"><b>${safe(g.title)}</b><small>${safe(g.date||'Data não informada')}</small><div>${g.links.map(l=>link(l.url,l.source)).join(' · ')}</div></article>`).join(''):note('Atualize os dados para consultar notícias. Manchetes iguais são agrupadas; não se presume que toda notícia tenha sentimento classificado.')}</section>
   <details class="rs-section"><summary>Fontes e integração Economatica</summary>${note((f.sources||[]).join(' · ')||'Fontes do serviço de fundamentos já integrado ao aplicativo.')}${note('Economatica: não conectada. Credenciais, documentação técnica e módulos contratados ainda precisam ser disponibilizados. Nenhum dado desta tela é atribuído à Economatica.')}</details>`;
 }
 function compare(){
  const tickers=state.compare.length?state.compare:keys().slice(0,4),rows=tickers.map(fund);
  return `<form data-rsform="comparar" class="rs-controls">${input('De 2 a 6 ativos','tickers',tickers.join(' '))}<button type="submit" class="rs-button">Comparar</button>${action('refresh','Atualizar')}</form>${note('Compare empresas do mesmo setor. Múltiplos de bancos, FIIs e empresas industriais não são diretamente equivalentes. Moedas e períodos precisam ser conferidos.')}
   ${rows.length?'<div class="rs-mobile-comparison">'+rows.map(r=>'<details class="rs-section" open><summary>'+safe(r.ticker)+' · '+safe(sectorName(r.sector))+'</summary><dl>'+M.fields.map(([id,label,unit])=>'<div><dt>'+safe(label)+'</dt><dd>'+metricText(id,r.metric[id])+' '+safe(unit==='moeda'?r.currency:unit)+'</dd></div>').join('')+'</dl></details>').join('')+'</div>':''}<details class="rs-comparison-table" open><summary>Tabela comparativa completa · deslize para os lados</summary>${rows.length?table(['Indicador',...rows.map(r=>r.ticker)],[[safe('Setor'),...rows.map(r=>safe(sectorName(r.sector)))],...M.fields.map(([id,label,unit])=>[safe(label+' · '+unit),...rows.map(r=>metricText(id,r.metric[id])+(unit==='moeda'?' '+safe(r.currency):''))]),[safe('Consulta'),...rows.map(r=>safe(r.queried?.slice(0,10)||'Não carregado'))]]):note('Escolha os ativos que deseja comparar.')}</details>
   ${action('comparechart','Comparar desempenho no gráfico')}${action('export','Exportar tabela CSV')}`;
 }
 function radar(){
  const p=preferences().filters||{},sectors=[...new Set(state.radar.map(r=>r.sector))].sort();
  const selected=M.screen(state.radar,p);
  return `<form data-rsform="radar"><div class="rs-controls"><label>Mercado<select name="market"><option value="brazil"${p.market!=='america'?' selected':''}>Brasil</option><option value="america"${p.market==='america'?' selected':''}>EUA</option></select></label>${input('DY mínimo (%)','minDy',p.minDy,'number')}${input('ROE mínimo (%)','minRoe',p.minRoe,'number')}${input('P/L máximo positivo','maxPl',p.maxPl,'number')}<button type="submit" class="rs-button">Pesquisar e salvar filtros</button></div><details><summary>Filtros adicionais</summary><div class="rs-controls">${input('Dívida líquida/EBITDA máxima','maxDebt',p.maxDebt,'number')}<label>Setor<select name="sector"><option value="">Todos</option>${sectors.map(s=>`<option${p.sector===s?' selected':''}>${safe(s)}</option>`).join('')}</select></label></div></details></form>
   ${note('Universo limitado aos até 40 resultados retornados pela fonte, não a todas as empresas da bolsa. Indicadores ausentes são excluídos quando há filtro correspondente. A busca usa o serviço existente de screening; não consome IA.')}
   ${state.radarAt?note('Consulta: '+new Date(state.radarAt).toLocaleString('pt-BR')+' · '+selected.length+' de '+state.radar.length+' resultados atendem aos filtros locais.') : ''}
   ${selected.length?table(['Ativo','Setor','P/L','DY %','ROE %'],selected.map(r=>[action('select',r.ticker,`data-ticker="${safe(r.ticker)}"`),safe(sectorName(r.sector)),fmt(r.metric.pl),fmt(r.metric.dy),fmt(r.metric.roe)])):note('Nenhum resultado carregado ou compatível com os filtros.')}`;
 }
 function risk(){
  const pos=positions(),tickers=pos.map(a=>a.tk).slice(0,8),series=Object.fromEntries(tickers.map(t=>[t,bars(t)])),corr=M.correlation(series);let performance=null,contributions=[];
  try{const data=window.TraderReports.portfolioInput();performance=window.CarteiraFactsheetModel.performance(data);contributions=performance.contributions||[]}catch{}
  const stress=M.scenarios(pos,{default:state.shock});
  const sameCurrency=new Set(pos.filter(a=>tickers.includes(a.tk)).map(a=>a.moeda|| (a.mk==='US'?'USD':'BRL'))).size<=1;
  const weights=Object.fromEntries(tickers.map(t=>[t,state.weights[t]??(tickers.length?100/tickers.length:0)]));
  const hypothetical=sameCurrency?M.hypothetical(series,weights):{points:[],reason:'Simulação requer ativos na mesma moeda. Escolha uma carteira de uma única moeda para evitar misturar câmbios.'};
  return `<div class="rs-actions">${action('refresh','Atualizar carteira e séries')}${action('report','Exportar relatório da carteira')}${action('ledger','Ver lançamentos da carteira')}</div><section class="rs-section"><h3>Quem contribuiu para o resultado</h3>${contributions.length?table(['Ativo','Contribuição BRL'],contributions.map(r=>[safe(r.ticker),fmt(r.value)])):note(performance?.reason||'Carregue o histórico validado da carteira.')}${note('Contribuição da série calculada pelo aplicativo, com os fluxos e proventos registrados. Aportes não são lucro.')}</section>
   <section class="rs-section"><h3>Correlação entre posições</h3>${note('Valores próximos de +1 indicam movimentos parecidos; próximos de 0, pouca relação linear; negativos, movimentos opostos. Correlação passada não garante proteção.')}<details><summary>Período e método do cálculo</summary>${note(corr.method+' Amostra: '+corr.n+' intervalos; máximo de 8 posições nesta visão.')}</details>${corr.n>=20?table(['Ativo',...corr.keys],corr.matrix.map((r,i)=>[safe(corr.keys[i]),...r.map(v=>`<span class="rs-correlation ${v!==null&&v<0?'negative':''}">${fmt(v)}</span>`)])):note('São necessários ao menos 20 retornos em datas comuns para calcular correlação.')}</section>
   <section class="rs-section"><h3>Teste de cenário</h3><form data-rsform="stress" class="rs-controls">${input('Variação hipotética em todas as posições (%)','shock',state.shock,'number')}<button class="rs-button" type="submit">Calcular</button></form><strong>Impacto simulado: R$ ${fmt(stress.total)}</strong>${note('Choque uniforme aplicado ao valor atual coberto em BRL; câmbio mantido constante. Não é previsão nem VaR. Sem preço: '+(stress.missing.join(', ')||'nenhum ativo')+'.')}</section>
   <section class="rs-section"><h3>Carteira hipotética</h3><form data-rsform="weights"><div class="rs-controls">${tickers.map(t=>input(t+' (%)','weight_'+t,Number(weights[t].toFixed(4)),'number')).join('')}<button class="rs-button" type="submit">Simular</button></div></form>${hypothetical.points.length?chart(hypothetical.points,'Evolução em base 100'):note(hypothetical.reason)}${note(hypothetical.method||'Escolha os pesos e carregue as séries. Nenhuma movimentação real é alterada.')}</section>${window.ResearchAdvanced?.riskSections(pos)||''}`;
 }
 function startFlowTimer(){clearInterval(flowTimer);flowTimer=null;if(state.flowAuto)flowTimer=setInterval(()=>{if(box?.open&&state.view==='fluxo'&&!document.hidden&&!state.busy&&!document.activeElement?.matches('.rs-controls input,input[type=file],select,textarea'))refresh()},15000)}
 function flow(){
  const summary=M.flow(state.flow),recent=summary.rows.slice(0,150),has=recent.length>0,imported=state.flowImport;
  const status={idle:['Consulte os negócios ou importe uma exportação','As cotações da ponte não contêm a lista de negócios. Para ver agressão e participantes, envie os dados do Times & Trades.'],loading:['Consultando sua conta…','Buscando o ativo e a data escolhidos.'],empty:['Nenhum negócio recebido para este filtro','Não há registros deste ativo e data na sua conta. Você pode abrir a última captura disponível, importar um CSV ou configurar o coletor no computador.'],ready:['Negócios carregados','Amostra recebida da ponte ou de uma exportação importada.'],error:['Não foi possível consultar','Confira a mensagem acima. Uma falha de conexão não significa que o mercado não teve negócios.']}[state.flowStatus];
  return `<section class="rs-flow-status" role="status"><h3>${status[0]}</h3>${note(status[1])}${state.flowAt?note('Última consulta concluída: '+new Date(state.flowAt).toLocaleString('pt-BR')):''}${state.flowLatest?action('flow-latest','Abrir última captura · '+state.flowLatest.ticker+' · '+state.flowLatest.date):''}</section>
   <form data-rsform="fluxo" class="rs-controls">${input('Ativo','ticker',state.ticker)}${input('Data do pregão (Brasília)','date',state.flowDate||loc().slice(0,10),'date')}<button class="rs-button" type="submit">${has?'Atualizar negócios':'Consultar negócios'}</button></form>
   <details class="rs-section"${!has?' open':''}><summary>Importar negócios do Profit</summary>${note('Selecione um CSV exportado do Times & Trades. A leitura faz uma prévia; nada é enviado antes de você tocar em Importar. Não use o relatório das suas ordens pessoais.')}<label>CSV de negócios · até 5 MB<input type="file" accept=".csv,text/csv,text/plain" data-flow-file${state.busy?' disabled':''}></label>${imported?`<p>${imported.records.length} negócios únicos · ${imported.invalid.length} linhas inválidas · ${imported.duplicate} repetições ignoradas.</p>${note('Ativos: '+[...new Set(imported.records.map(r=>r.ticker))].join(', ')+'. Datas em Brasília: '+[...new Set(imported.records.map(r=>new Date(Date.parse(r.traded_at)-10800000).toISOString().slice(0,10)))].join(', '))}${imported.invalid.length?note('Linhas não importadas: '+imported.invalid.slice(0,20).join(', ')+(imported.invalid.length>20?'…':'')):''}${table(['Ativo','Data/hora BRT','Preço','Quantidade','Agressão'],imported.records.slice(0,5).map(r=>[safe(r.ticker),safe(new Date(r.traded_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})),fmt(r.price,4),fmt(r.quantity,0),safe(r.side==='buy'?'Compra':r.side==='sell'?'Venda':'Não informada')]))}${action('flow-import','Importar '+imported.records.length+' negócios para minha conta')}${action('flow-discard','Descartar prévia')}`:''}${note('Colunas: IDNegocio (ID estável do negócio), Ativo, Data, Hora, Preço e Quantidade. Agressão, Compradora e Vendedora são opcionais. Também aceita trade_id, ticker, traded_at, price e quantity. Sem agressão, o saldo não é inferido.')}</details>
   <details class="rs-section"><summary>Ativar alimentação pelo computador</summary><ol><li>Na pasta da ponte v301, execute <b>iniciar-com-fluxo.bat</b> e selecione o CSV do Times & Trades.</li><li>Mantenha a ponte aberta. Ela relê o CSV quando o arquivo muda; exportar uma vez produz uma amostra estática.</li><li>Para uma origem contínua, é preciso que o Profit alimente o arquivo ou uma faixa de negócios no Excel. A ponte não exporta a janela do Profit sozinha.</li></ol>${note('A planilha de cotações não substitui o Times & Trades. Captura nativa por ProfitDLL depende de contratação/habilitação separada. Esta tela não está conectada à DLL.')}</details>
   ${has?`<label class="rs-auto-refresh"><input type="checkbox" data-flow-auto${state.flowAuto?' checked':''}> Atualizar a consulta a cada 15 segundos</label><div class="rs-kpis"><div><small>Agressão compradora · quantidade</small><b>${fmt(summary.buy,0)}</b></div><div><small>Agressão vendedora · quantidade</small><b>${fmt(summary.sell,0)}</b></div><div><small>Saldo de agressão</small><b>${fmt(summary.delta,0)}</b></div></div>${note(summary.rows.length+' negócios únicos carregados. '+(summary.rows.length>=2000?'O limite de consulta de 2.000 foi atingido; há possível corte da amostra. ':'')+'Sem classificação: '+fmt(summary.neutral,0)+'. Último negócio: '+(summary.to?new Date(summary.to).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'não informado')+'.')}${table(['Hora BRT','Preço','Quantidade','Agressão','Compradora','Vendedora'],recent.map(r=>[safe(new Date(r.traded_at).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',fractionalSecondDigits:3})),fmt(r.price,4),fmt(r.quantity,0),safe(({buy:'Compra',sell:'Venda',unknown:'Não informada'})[r.side]||'Não informada'),safe(r.buyer||'—'),safe(r.seller||'—')]))}${summary.players.length?'<details class="rs-section"><summary>Participantes da amostra</summary>'+table(['Corretora','Compra · qtd.','Venda · qtd.','Saldo · qtd.'],summary.players.slice(0,20).map(r=>[safe(r.name),fmt(r.buy,0),fmt(r.sell,0),fmt(r.net,0)]))+note('Saldo comprado menos vendido, diferente de saldo de agressão. Corretoras intermediárias não identificam investidores finais.')+'</details>':''}`:note('Os indicadores de agressão aparecem após receber negócios válidos. Ausência de dados não é saldo zero.')}
   <details class="rs-section"><summary>Cobertura da amostra</summary>${note('Consulta os 2.000 negócios mais recentes do ativo/data; exibe até 150 linhas. O conjunto recebido pode ser parcial. Importação e ponte usam o mesmo ID estável para evitar duplicação. Cancelamentos de negócios não são reconciliados automaticamente.')}</details>`;
 }
 async function readFlowFile(file){
  if(!file)return;state.flowImport=null;
  return job(async valid=>{if(file.size>5*1024*1024)throw Error('Use um CSV de até 5 MB.');const bytes=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Não foi possível ler o arquivo.'));reader.readAsArrayBuffer(file)});if(!valid())return;let text=new TextDecoder('utf-8').decode(bytes);if(text.includes('�'))text=new TextDecoder('windows-1252').decode(bytes);const result=await window.FluxoImportacao.parse(text);if(valid()){state.flowImport=result;state.message='Prévia pronta. Confira os dados e confirme a importação.'}});
 }
 async function importFlow(){return job(async valid=>{
  requireLogin();const data=state.flowImport;if(!data?.records.length)throw Error('Escolha um CSV de negócios primeiro.');const owner=SESS.uid;let confirmed=0;
  for(let start=0;start<data.records.length;start+=500){if(!valid()||SESS.uid!==owner)return;const batch=data.records.slice(start,start+500).map(r=>({...r,user_id:owner}));try{await rq('/rest/v1/fluxo_negocios?on_conflict=user_id,trade_id',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(batch)});confirmed+=batch.length;}catch(e){throw Error('Importação interrompida após '+confirmed+' negócios confirmados. Você pode repetir sem duplicar os IDs. '+(e.message||'Falha no envio.'))}}
  if(!valid())return;const first=data.records[0];state.ticker=first.ticker;state.flowDate=new Date(Date.parse(first.traded_at)-10800000).toISOString().slice(0,10);state.flowImport=null;await loadFlow(valid);if(valid())state.message=confirmed+' negócios confirmados pelo servidor. O filtro foi ajustado ao primeiro ativo/data importado.';
 })}
 function paint(){if(!box?.open)return;const opened=new Set([...box.querySelectorAll('details[open]')].map(d=>d.querySelector('summary')?.textContent)),scroll=box.scrollTop;box.innerHTML=header()+`<div class="rs-content">${intro()}${state.busy?'<p role="status">Consultando dados…</p>':''}${state.message?`<p role="status" class="rs-message">${safe(state.message)}</p>`:''}${({ativo:asset,comparar:compare,radar,risco:risk,fluxo:flow})[state.view]()}</div>`;box.querySelectorAll('[data-rs="refresh"],form button[type="submit"]').forEach(b=>b.disabled=state.busy);box.querySelectorAll('details').forEach(d=>{if(opened.has(d.querySelector('summary')?.textContent))d.open=true});box.scrollTop=scroll}
 function resetOwner(){if(state.owner&&state.ownerId===(SESS?.uid||null)){state.owner=S;return;}state.owner=S;state.ownerId=SESS?.uid||null;state.loaded={};state.news={};state.radar=[];state.radarAt=null;state.flow=[];state.flowStatus='idle';state.flowAt=null;state.flowLatest=null;state.flowImport=null;state.compare=[];state.weights={};state.message='';generation++;state.busy=false}
 function open(view='ativo',tk){resetOwner();state.view=['ativo','comparar','radar','risco','fluxo'].includes(view)?view:'ativo';state.ticker=M.ticker(tk||currentTicker()||keys()[0]||state.ticker);if(!box){box=document.createElement('dialog');box.className='rs-workbench';box.id='research-workbench';box.setAttribute('aria-label','Pesquisa de mercado');box.addEventListener('click',onClick);box.addEventListener('submit',onSubmit);box.addEventListener('change',e=>{if(e.target.matches('[data-flow-auto]')){state.flowAuto=e.target.checked;startFlowTimer()}else if(e.target.matches('[data-flow-file]'))readFlowFile(e.target.files?.[0])});box.addEventListener('close',()=>{state.flowAuto=false;startFlowTimer();window.TraderUI.refreshScroll();generation++;state.busy=false;state.message=''});document.body.append(box)}if(!box.open){window.TraderChat?.close();box.showModal()}box.setAttribute('aria-label',state.view==='fluxo'?'Fluxo de negócios':'Pesquisa de mercado');paint();box.scrollTop=0;window.TraderUI.refreshScroll()}
 function currentTicker(){try{const layout=api().layAtual();return api().parse(layout.p[api().TR.foco]||layout.p[0]).tk||''}catch{return ''}}
 async function job(fn){if(state.busy)return;state.busy=true;state.message='';const id=++generation,ownerId=SESS?.uid||null;paint();try{await fn(()=>id===generation&&(SESS?.uid||null)===ownerId&&box?.open);if((SESS?.uid||null)!==ownerId)return}catch(e){if(id===generation)state.message=e.message||String(e)}finally{if(id===generation){if((SESS?.uid||null)!==ownerId){box?.close();resetOwner()}else{state.busy=false;paint()}}}}
 function requireLogin(){if(window.DIARIO_DEMO)throw Error('Consultas externas desativadas na demonstração.');if(!SESS?.at)throw Error('Entre na sua conta para consultar dados.');}
 async function loadFunds(tickers,valid){requireLogin();for(let i=0;i<tickers.length;i+=2){if(!valid())return;await Promise.all(tickers.slice(i,i+2).map(async tk=>{const data=await api().trFn('fund',{tk},600000);if(!valid())return;if(data){state.loaded[tk]=data;window.ResearchAdvanced?.onFund(tk,data)}else throw Error('Fundamentos indisponíveis para '+tk+'. Confira DQ no terminal.')}))}}
 async function refresh(){return job(async valid=>{requireLogin();if(state.view==='fluxo'){state.flowStatus='loading';state.flow=[];paint();try{return await loadFlow(valid)}catch(e){if(valid())state.flowStatus='error';throw e}}if(state.view==='radar')return loadRadar(valid);if(state.view==='risco'){await Promise.allSettled([pfHist(),pfMeta()]);const until=Date.now()+20000;while(valid()&&(window.PF.histBusy||window.PF.meta)&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,150));if(!valid())return;await Promise.all(positions().slice(0,8).map(a=>api().tec.pegaVelas(a.tk,'1d')));return}
  const tickers=state.view==='comparar'?(state.compare.length?state.compare:keys().slice(0,4)):[state.ticker];if(!tickers.length)throw Error('Escolha os ativos primeiro.');await loadFunds(tickers,valid);if(state.view==='ativo'&&valid()){const tk=state.ticker,n=await api().trFn('noticias',{q:tk},180000);if(valid())state.news[tk]=n?.itens||[];await api().trFn('cot',{s:[tk]},15000)}})}
 async function loadRadar(valid){const p=preferences().filters||{},data=await api().trFn('eqs',{mk:p.market||'brazil',f:{...(M.num(p.minDy)!==null?{dyMin:M.num(p.minDy)}:{}),...(M.num(p.minRoe)!==null?{roeMin:M.num(p.minRoe)}:{}),...(M.num(p.maxPl)!==null?{plMax:M.num(p.maxPl)}:{})}},60000);if(!valid())return;if(!data?.itens)throw Error('Screening indisponível na fonte.');state.radar=data.itens.map(r=>({ticker:M.ticker(r.s),sector:r.setor||'Não informado',metric:{pl:M.num(r.pl),pvp:M.num(r.pvp),dy:M.num(r.dy),roe:M.num(r.roe),debt:null}}));state.radarAt=data.em||new Date().toISOString()}
 async function loadFlow(valid){requireLogin();const tk=state.ticker,date=state.flowDate||loc().slice(0,10);if(!/^[A-Z0-9.]{1,18}$/.test(tk)||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Informe ativo e data válidos.');const next=new Date(date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);const start=date+'T00:00:00-03:00',end=next.toISOString().slice(0,10)+'T00:00:00-03:00';let all=[];
  for(let offset=0;offset<2000;offset+=1000){const response=await rq('/rest/v1/fluxo_negocios?select=trade_id,ticker,traded_at,price,quantity,side,buyer,seller,source&user_id=eq.'+encodeURIComponent(SESS.uid)+'&ticker=eq.'+encodeURIComponent(tk)+'&traded_at=gte.'+encodeURIComponent(start)+'&traded_at=lt.'+encodeURIComponent(end)+'&order=traded_at.desc,trade_id.desc&limit=1000&offset='+offset);const data=await response.json();if(!valid())return;if(!response.ok||!Array.isArray(data))throw Error('Não foi possível ler o fluxo da ponte.');all.push(...data);if(data.length<1000)break}if(!valid())return;state.flow=all;state.flowStatus=all.length?'ready':'empty';state.flowAt=Date.now();state.flowLatest=null;if(!all.length){const r=await rq('/rest/v1/fluxo_negocios?select=ticker,traded_at&user_id=eq.'+encodeURIComponent(SESS.uid)+'&order=traded_at.desc&limit=1'),latest=await r.json();if(valid()&&latest[0])state.flowLatest={ticker:latest[0].ticker,date:new Date(Date.parse(latest[0].traded_at)-10800000).toISOString().slice(0,10)}}
 }
 function context(){if(!box?.open)return '';const f=fund(state.ticker);return 'Pesquisa do ativo '+f.ticker+'. Setor: '+f.sector+'. Consulta: '+(f.queried||'não carregada')+'.\nIndicadores observados: '+M.fields.filter(([id])=>f.metric[id]!==null).map(([id,label,unit])=>label+' '+fmt(f.metric[id])+' '+unit+' ('+f.origin[id]+')').join('; ')+'.\nSem saldos ou posições anexados. Indicadores ausentes não são zero; não inferir causas para movimentos de preço.'}
 function exportCsv(){const rows=(state.compare.length?state.compare:keys().slice(0,4)).map(fund),cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"',lines=[['Ativo','Setor','Moeda','Consulta',...M.fields.map(x=>x[1])],...rows.map(r=>[r.ticker,r.sector,r.currency,r.queried,...M.fields.map(([k])=>r.metric[k])])],url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='comparativo-fundamentos.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function onClick(event){const b=event.target.closest('[data-rs]');if(!b)return;const id=b.dataset.rs;if(id==='close')return box.close();if(id==='view'){box.scrollTop=0;generation++;state.busy=false;state.view=b.dataset.view;state.message='';paint();return}if(id==='flow-import')return importFlow();if(id==='flow-discard'){state.flowImport=null;paint();return}if(id==='flow-latest'&&state.flowLatest){state.ticker=state.flowLatest.ticker;state.flowDate=state.flowLatest.date;return refresh()}if(id==='refresh')return refresh();if(id==='select'){state.ticker=b.dataset.ticker;state.view='ativo';paint();return}if(id==='export')return exportCsv();if(id==='ai'){const extra=context();box.close();window.TraderChat.open(extra);return}
  if(id==='ledger'){box.close();window.DIARIO_NAV.navigate('carteiras');window.CarteiraExperience.openAudit();return}if(id==='report'){box.close();window.TraderReports.openHub();return}const commands={graph:state.ticker+' G',news:'N '+state.ticker,income:state.ticker+' DVD',comparechart:'COMP '+(state.compare.length?state.compare:keys().slice(0,4)).join(' ')};if(commands[id]){box.close();if(tab!=='term'){tab='term';render()}api().roda(commands[id])}}
 function onSubmit(event){const form=event.target.closest('[data-rsform]');if(!form)return;event.preventDefault();if(state.busy)return;if(window.ResearchAdvanced?.submit(form))return;const values=Object.fromEntries(new FormData(form)),kind=form.dataset.rsform;
  if(kind==='ativo'||kind==='fluxo'){const tk=M.ticker(values.ticker);if(!/^[A-Z0-9.!-]{1,18}$/.test(tk)){state.message='Ticker inválido.';paint();return}state.ticker=tk;if(kind==='fluxo'){state.flow=[];state.flowDate=values.date;state.flowStatus='idle';state.flowAt=null;state.flowLatest=null}return refresh()}
  if(kind==='comparar'){const tickers=[...new Set(values.tickers.toUpperCase().split(/[\s,;]+/).filter(Boolean))];if(tickers.length<2||tickers.length>6||tickers.some(t=>!/^[A-Z0-9.!-]{1,18}$/.test(t))){state.message='Use de 2 a 6 tickers válidos.';paint();return}state.compare=tickers;return refresh()}
  if(kind==='radar'){for(const k of ['minDy','minRoe','maxPl','maxDebt'])if(values[k]!==''&&M.num(values[k])===null){state.message='Filtro numérico inválido.';paint();return}savePreferences({filters:values});return refresh()}
  if(kind==='stress'){const shock=M.num(values.shock);if(shock===null||shock< -100||shock>1000){state.message='Use uma variação entre −100% e 1.000%.'}else state.shock=shock;paint();return}
  if(kind==='weights'){const weights={};for(const [k,v]of Object.entries(values)){const n=M.num(v);if(n===null||n<0||n>100){state.message='Pesos devem estar entre 0 e 100.';paint();return}weights[k.slice(7)]=n}if(Math.abs(Object.values(weights).reduce((s,v)=>s+v,0)-100)>.001){state.message='Os pesos devem somar 100%.';paint();return}const sum=Object.values(weights).reduce((s,v)=>s+v,0);for(const k in weights)weights[k]=weights[k]/sum*100;state.weights=weights;state.message='';paint()}
 }
 function decorate(){if(state.owner&&(state.ownerId!==(SESS?.uid||null))){box?.close();resetOwner()}if(tab==='term'){const anchor=document.querySelector('.trbar');if(anchor&&!anchor.querySelector('[data-research-open]')){const b=document.createElement('button');b.className='trbtn rs-launch';b.dataset.researchOpen='';b.textContent='Pesquisa';b.type='button';b.onclick=()=>open();anchor.append(b)}if(anchor&&!anchor.querySelector('[data-flow-open]')){const b=document.createElement('button');b.className='trbtn rs-launch';b.dataset.flowOpen='';b.textContent='Fluxo';b.type='button';b.onclick=()=>open('fluxo');anchor.append(b)}}if(tab==='carteiras'){const anchor=document.querySelector('.pfbar2,.pf .pfks');if(anchor&&!document.querySelector('[data-research-portfolio]')){const b=document.createElement('button');b.className='pfbt pfmini';b.dataset.researchPortfolio='';b.textContent='Analisar risco da carteira';b.type='button';b.onclick=()=>open('risco');anchor.append(b)}}}
 window.TraderUI.onRender('terminal-pesquisa',decorate);
 window.TerminalResearch={open,context,decorate,model:M,fund,state,refresh,paint};
})();

;
/* módulo: pesquisa-avancada.js */
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

;
/* módulo: cotacoes-conexao.js */
/* Retomada de cotações: snapshot datado primeiro, streaming em seguida. */
(() => {
 'use strict';let last=0,pending=null;
 function symbols(){const cfg=window.TRM?.TS?.()||{},rows=S.cart?.lanc||[];return [...new Set([...(cfg.mon||[]).filter(s=>/^[A-Z.]{1,8}$/.test(s)&&!['WINFUT','WDOFUT','INDFUT','DOLFUT','BTC','ETH','SOL','IBOV','DXY','BRENT','WTI','OURO','PRATA','COBRE'].includes(s)),...rows.filter(r=>r.mk==='US').map(r=>r.tk),'EWZ','PBR','VALE','ITUB','BBD'])].slice(0,40)}
 function sockets(force=false){
  const api=window.TRM,t=api?.TR;if(!api||window.DIARIO_DEMO)return;if(!SESS?.at){t.fhAuto=[];api.trFinnhub([]);return}if(document.hidden||navigator.onLine===false)return;
  if(t.fh?.readyState===0&&Date.now()-(t.fhStarted||0)>15000)t.fh.close();
  t.fhAuto=symbols();api.trFinnhub(t.fhAuto);api.trBinance(['btcusdt','ethusdt'],'auto');
 }
 function seed(response){
  const api=window.TRM,t=api?.TR;if(!t||!response?.payload?.data||Date.now()-Date.parse(response.fetched_at)>15*60000)return;
  const rows=response.payload.data.map(r=>{const a=r.d||[];return {s:r.s,n:a[0]||r.s,px:typeof a[1]==='number'&&a[1]>0?a[1]:null,d1:a[2],dabs:a[3],atraso:true,moeda:a[5],horarioPreco:typeof a[6]==='number'&&a[6]>0&&a[6]<=Date.now()/1000+60?new Date(a[6]*1000).toISOString():null,fonte:'TradingView',coletaServidor:response.fetched_at,baseVariacao:'Referência diária do provedor',snapshot:true}});
  const match=tk=>{const key=String(tk).toUpperCase(),aliases={IBOV:'BMFBOVESPA:IBOV',SPX:'TVC:SPX',DXY:'TVC:DXY',BRENT:'TVC:UKOIL',WTI:'TVC:USOIL',OURO:'TVC:GOLD'};return rows.find(r=>r.s===(aliases[key]||key)||r.s.endsWith(':'+key))};
  const lists=[api.TS().mon||[],...rows.map(r=>[r.s.split(':')[1]])];
  for(const list of lists){if(!list.length)continue;const key='cot|'+JSON.stringify({s:list}),old=t.dados[key],at=Date.parse(response.fetched_at);if(old&&old.ts>=at)continue;t.dados[key]={ts:at,v:{em:response.fetched_at,fonte:'TradingView · coleta no servidor (snapshot)',itens:list.map(tk=>({...match(tk),pedido:tk,px:match(tk)?.px??null}))}};
 }
 }
 async function refresh(force=false){
  sockets(force);if(window.DIARIO_DEMO||document.hidden||navigator.onLine===false||!SESS?.at||pending||Date.now()-last<(force?2000:60000))return;
  last=Date.now();const owner=SESS.uid;
  pending=(async()=>{
   try{const r=await rq('/rest/v1/mercado_cache?id=eq.quotes&select=payload,fetched_at');const a=await r.json();if(SESS?.uid!==owner||document.hidden)return;seed(a[0]);if(tab==='term')render()}catch{/* cache auxiliar indisponível não interrompe as fontes principais */}
   if(SESS?.uid!==owner||document.hidden)return;
   await Promise.allSettled([window.TRM.trFn('cot',{s:window.TRM.TS().mon||[]},15000)]);
   if(SESS?.uid===owner&&!document.hidden&&tab==='term')render();
  })().finally(()=>pending=null);return pending;
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true);else{clearTimeout(window.TR?.fhRetry);try{window.TR?.fh?.close();window.TR?.ws?.close()}catch{}}});
 window.addEventListener('pageshow',()=>refresh(true));window.addEventListener('online',()=>refresh(true));
 window.TraderUI.onRender('cotacoes-conexao',()=>refresh());
 setInterval(()=>{sockets();refresh()},15000);
 window.QuoteConnection={refresh,sockets,seed};refresh(true);
})();

;
/* módulo: aulas.js */
/* Aulas em vídeo: roteiros guardados no Supabase (tabela "aulas"), tocados com a voz do aparelho
   (a mesma das aulas de inglês) e visuais desenhados ao vivo: tópicos, diagramas, payoff,
   ajuste diário e gráficos reais pela função "candles". Nada é gravado em vídeo: o app toca a
   narração e troca a tela no ritmo da fala. */
(function(){
'use strict';
if(typeof vEstudos!=='function')return;
const LS_LISTA='aulas-lista-v1',LS_ROT='aulas-rot-v1:',LS_POS='aulas-pos-v1:',LS_VOZ='aulas-voz',LS_VEL='aulas-vel';
const AU={lista:null,busy:0,err:'',ts:0};
const IC={"prev": "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6 5h2v14H6zM20 5v14L9 12z\"/></svg>", "next": "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M16 5h2v14h-2zM4 5v14l11-7z\"/></svg>", "play": "<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M7 4v16l13-8z\"/></svg>", "pause": "<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6 4h4v16H6zM14 4h4v16h-4z\"/></svg>", "x": "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg>", "menu": "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M4 7h16M4 12h16M4 17h16\"/></svg>"};
const P={on:0,a:null,i:0,j:0,tok:0,play:0,t:0,wd:0,dados:{},vis:'',wl:null};
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lsg=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}};
const lss=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const nf=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const brl=v=>(v<0?'-':'')+'R$ '+nf(Math.abs(v),2);
const pct=v=>(v>0?'+':v<0?'-':'')+nf(Math.abs(v),1)+'%';
const logado=()=>{try{return !!(typeof SESS!=='undefined'&&SESS&&SESS.uid&&cfg())}catch{return false}};

/* ---------- dados ---------- */
async function carregaLista(forca){
  if(AU.busy)return;
  if(!logado()){AU.lista=lsg(LS_LISTA,[]).concat(window.AULAS_LOCAIS||[]);AU.err=AU.lista.length?'':'login';return}
  if(!forca&&AU.lista&&Date.now()-AU.ts<60000)return;
  AU.busy=1;AU.err='';
  try{
    await tok();
    const r=await rq('/rest/v1/aulas?select=id,livro,numero,titulo,capitulos,progresso,criado_em,status,min:roteiro->min&user_id=eq.'+SESS.uid+'&order=livro.asc,numero.asc');
    const l=await r.json();AU.lista=(Array.isArray(l)?l:[]).concat(window.AULAS_LOCAIS||[]);lss(LS_LISTA,l);AU.ts=Date.now();
  }catch(e){AU.lista=lsg(LS_LISTA,[]);AU.err=/aulas|schema cache|404/.test(String(e.message||e))?'tabela':String(e.message||e)}
  AU.busy=0;pinta();
}
async function roteiro(a){
  if(a.roteiro)return a.roteiro;
  const c=lsg(LS_ROT+a.id,null);
  if(c&&c.em===a.criado_em)return c.r;
  await tok();
  const r=await rq('/rest/v1/aulas?select=roteiro&id=eq.'+a.id),l=await r.json();
  if(!l[0])throw new Error('Aula não encontrada.');
  lss(LS_ROT+a.id,{em:a.criado_em,r:l[0].roteiro});
  return l[0].roteiro;
}
function salvaPos(fim){
  const a=P.a;if(!a)return;
  const pos={cena:P.i,total:a.r.cenas.length,fim:fim?1:((lsg(LS_POS+a.id,{})||{}).fim||0),em:new Date().toISOString()};
  lss(LS_POS+a.id,pos);
  if(!a.local&&logado()){clearTimeout(salvaPos.t);salvaPos.t=setTimeout(()=>{rq('/rest/v1/aulas?id=eq.'+a.id,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({progresso:pos,atualizado_em:pos.em})}).catch(()=>{})},1500)}
}
const posDe=a=>{const l=lsg(LS_POS+a.id,null),s=a.progresso||{};return(l&&(!s.em||l.em>=s.em))?l:s};

/* ---------- lista na aba Estudos ---------- */
function listaHtml(){
  if(AU.lista==null){carregaLista();if(AU.lista==null)return'<div class="card"><div class="sm mut">Carregando aulas…</div></div>'}
  let o='';
  if(AU.err==='login')o+='<div class="card warn"><b>Entre na sua conta</b><div class="sm">As aulas ficam guardadas no Supabase. Entre em Mais → Conta para ver a lista.</div></div>';
  else if(AU.err==='tabela')o+='<div class="card warn"><b>Falta a tabela "aulas" no Supabase</b><div class="sm">Rode o SQL de aulas (supabase-aulas.sql).</div></div>';
  else if(AU.err)o+=`<div class="card warn"><b>Não consegui carregar as aulas</b><div class="sm">${h(AU.err)}</div><button class="btn s" data-aurel="1">Tentar de novo</button></div>`;
  const g={};for(const a of AU.lista)(g[a.livro]=g[a.livro]||[]).push(a);
  o+=novaHtml();
  if(!AU.lista.length&&!AU.err&&!G.aberto)o+='<div class="card"><b>Nenhuma aula ainda</b><div class="sm mut">Toque em “Nova aula”, envie o PDF do livro e escolha os capítulos.</div></div>';
  for(const[livro,L]of Object.entries(g)){
    o+=`<div class="card au-livro"><div class="au-lt">${h(livro)}</div>`;
    for(const a of L){
      if(a.status==='gerando'){o+=gerandoHtml(a);continue}
      const p=posDe(a),feito=p.fim,pc=p.total?Math.round(100*Math.min(p.cena,p.total)/p.total):0;
      o+=`<button class="au-item" data-auopen="${h(a.id)}"><span class="au-n">${feito?'✓':a.numero}</span><span class="au-tx"><b>Aula ${a.numero} · ${h(a.titulo)}</b><span class="sm mut">${h(a.capitulos?'Capítulos '+a.capitulos:'')}${a.roteiro_min||a.min?' · ~'+(a.roteiro_min||a.min)+' min':''}${feito?' · concluída':pc?' · parou em '+pc+'%':''}</span>${pc&&!feito?`<span class="au-pb"><i style="width:${pc}%"></i></span>`:''}</span><span class="au-play">▶</span></button>`;
    }
    o+='</div>';
  }
  o+='<div class="sm mut" style="margin:6px 2px 14px">A narração usa a voz do aparelho. No iPhone, baixe uma voz “Aprimorada” ou “Premium” em português (Ajustes → Acessibilidade → Conteúdo Falado → Vozes) para soar mais natural.</div>';
  return o;
}
function pinta(){if(typeof tab!=='undefined'&&tab==='estudos'&&ESV==='aul'&&!P.on){const y=scrollY;render();scrollTo(0,y)}}

{const t=vEstudos;vEstudos=function(){
  if(ESV!=='aul')return addBtn(t.apply(this,arguments));
  ESV='liv';let base='';try{base=t.apply(this,arguments)}finally{ESV='aul'}
  base=addBtn(base);
  const m=/<div class="seg"[^>]*>[\s\S]*?<\/div>/.exec(base);
  const topo=m?base.slice(0,m.index+m[0].length).replace(/ class="on"/g,'').replace(/(data-id="aul")/,'class="on" $1'):'<h1>Estudos</h1>';
  return topo+'<div class="au-intro sm mut">Videoaulas narradas dos seus livros, agora em modo vídeo com cenas automáticas, legendas e exemplos visuais. Cada aula cobre 2 ou 3 capítulos.</div>'+listaHtml();
}}
function addBtn(s){
  if(s.includes('data-id="aul"'))return s;
  return s.replace(/(<div class="seg"[^>]*>[\s\S]*?)(<button[^>]*data-id="ing")/,'$1<button data-ep="esv" data-id="aul">🎬 Aulas</button>$2');
}

/* ---------- voz ---------- */
function qualidadeVoz(v){const id=String(v.name||'')+' '+String(v.voiceURI||'');return /premium/i.test(id)?50:/enhanced|aprimorad|melhorad/i.test(id)?40:/neural|natural/i.test(id)?35:/siri/i.test(id)?20:/google/i.test(id)?10:0}
function vozes(){let v=[];try{v=speechSynthesis.getVoices().filter(x=>/^pt(?:[-_]|$)/i.test(x.lang))}catch{}
  const q=x=>(/^pt[-_]BR$/i.test(x.lang)?100:0)+qualidadeVoz(x)+(x.default?1:0);
  return v.sort((a,b)=>q(b)-q(a)||a.name.localeCompare(b.name))}
function voz(){const v=vozes(),n=lsg(LS_VOZ,'');return v.find(x=>x.voiceURI===n)||v.find(x=>x.name===n)||v[0]||null}
const temVoz=()=>'speechSynthesis'in window;

/* ---------- player ---------- */
const frasesDe=t=>{const s=String(t).replace(/\s+/g,' ').trim().split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9“"(])/);const o=[];
  for(let x of s){while(x.length>230){let k=x.lastIndexOf(', ',220);if(k<80)k=x.lastIndexOf(' ',220);o.push(x.slice(0,k+1).trim());x=x.slice(k+1).trim()}if(x)o.push(x)}return o};
function preenche(txt,d){return String(txt).replace(/\{(\w+)\}/g,(m,k)=>d&&d[k]!=null?d[k]:m)}
function falasCena(c){
  const d=P.dados[P.i]||(c.vis&&c.vis.tipo==='ajuste'&&c.vis.precos?{ph:calcAjuste(c.vis,c.vis.precos).ph}:null);
  const usaSem=c.falaSem&&(!d||d.erro);
  if(c.vis&&c.vis.dados&&!d)return null; // espera os dados
  const L=(usaSem?c.falaSem:c.fala)||[];
  const out=[];L.forEach((p,k)=>frasesDe(preenche(p,d&&d.ph)).forEach(f=>out.push({t:f,k})));
  return out;
}
async function abre(id){
  let a=(AU.lista||[]).find(x=>x.id===id)||(window.AULAS_LOCAIS||[]).find(x=>x.id===id);
  if(!a)return;
  try{toast&&toast('Abrindo a aula…');const r=await roteiro(a);P.a={...a,r};}catch(e){toast&&toast('Não abriu: '+(e.message||e));return}
  P.on=1;P.dados={};const pos=posDe(a);P.i=pos.fim?0:Math.min(pos.cena||0,P.a.r.cenas.length-1);P.j=0;P.play=0;
  document.body.insertAdjacentHTML('beforeend',playerHtml());document.documentElement.classList.add('au-aberto');
  cena(P.i,0);
}
function fecha(){para();salvaPos();P.on=0;P.a=null;const e=document.getElementById('aup');e&&e.remove();document.documentElement.classList.remove('au-aberto');soltaTela();const y=scrollY;render();scrollTo(0,y)}
function playerHtml(){
  const a=P.a,vel=lsg(LS_VEL,0.95);
  return `<div class="aup" id="aup" role="dialog" aria-label="Aula ${a.numero}">
<div class="aup-top"><button class="aup-x" data-aux="1" aria-label="Fechar">${IC.x}</button><div class="aup-tt"><b>Aula ${a.numero} · ${h(a.titulo)}</b><span id="aupct"></span></div><button class="aup-ix" data-auidx="1" aria-label="Cenas">${IC.menu}</button></div>
<div class="aup-stage"><div class="aup-vis" id="aupvis"></div></div>
<div class="aup-cap" id="aupcap"></div>
<div class="aup-prog" id="aupprog">${a.r.cenas.map((c,k)=>`<i data-aucena="${k}" title="${h(c.titulo||'')}"></i>`).join('')}</div>
<div class="aup-ctl"><button data-auprev="1" aria-label="Cena anterior">${IC.prev}</button><button class="aup-pp" data-aupp="1" aria-label="Tocar">${IC.play}</button><button data-aunext="1" aria-label="Próxima cena">${IC.next}</button>
<select id="aupvel" aria-label="Velocidade">${[0.8,0.9,0.95,1,1.1,1.2,1.35].map(v=>`<option value="${v}"${v==vel?' selected':''}>${String(v).replace('.',',')}×</option>`).join('')}</select>
<select id="aupvoz" aria-label="Voz">${temVoz()?vozOpts():'<option>sem voz</option>'}</select>${temVoz()?'<button data-auvozteste="1" aria-label="Ouvir voz selecionada" style="font-size:12px;width:auto;padding:8px">Ouvir voz</button>':''}</div>
<div class="aup-idx" id="aupidx" hidden>${a.r.cenas.map((c,k)=>`<button data-aucena="${k}"><span>${k+1}</span>${h(c.titulo||'Cena '+(k+1))}</button>`).join('')}${a.local?'':'<button class="aup-del" data-audel="1"><span>✕</span>Apagar esta aula</button>'}</div>
</div>`;
}
function vozOpts(){const v=vozes(),saved=lsg(LS_VOZ,''),best=v[0];let out='<option value=""'+(!saved?' selected':'')+'>Automático'+(best?' · '+h(best.name):' · voz do aparelho')+'</option>';return out+v.map(x=>`<option value="${h(x.voiceURI||x.name)}"${saved&&(saved===x.voiceURI||saved===x.name)?' selected':''}>${h(x.name)}${qualidadeVoz(x)>=35?' ★':''}${/^pt[-_]BR$/i.test(x.lang)?' · Brasil':''}</option>`).join('')}
function testaVoz(){if(!temVoz())return;para();try{const u=new SpeechSynthesisUtterance('Olá! Vamos estudar com calma, entender os exemplos e conectar cada conceito ao mercado.');const v=voz();u.lang=v?.lang||'pt-BR';if(v)u.voice=v;u.rate=0.95;u.pitch=1;u.volume=1;speechSynthesis.speak(u)}catch{}}
try{speechSynthesis.addEventListener('voiceschanged',()=>{const s=document.getElementById('aupvoz');s&&(s.innerHTML=vozOpts())})}catch{}

function cena(i,j){
  const a=P.a;if(!a)return;
  P.tok++;clearTimeout(P.t);clearTimeout(P.wd);try{speechSynthesis.cancel()}catch{}
  P.i=Math.max(0,Math.min(i,a.r.cenas.length-1));P.j=j||0;
  const c=a.r.cenas[P.i];
  document.getElementById('aupct').textContent=`${P.i+1}/${a.r.cenas.length} · ${c.titulo||''}`;
  document.querySelectorAll('#aupprog i').forEach((e,k)=>{e.className=k<P.i?'ok':k===P.i?'at':''});
  P.vis='';desenha(-1);
  if(c.vis&&c.vis.dados&&!P.dados[P.i])buscaDados(P.i);
  salvaPos();
  if(P.play)P.t=setTimeout(fala,350);else legenda(null);
}
function legenda(f){const e=document.getElementById('aupcap');if(!e)return;
  if(!f){const c=P.a.r.cenas[P.i],L=falasCena(c);e.innerHTML=L&&L[0]?`<span class="mut">${h(L[0].t)}</span>`:'<span class="mut">Carregando dados reais…</span>';return}
  e.innerHTML=h(f.t)}
function fala(){
  if(!P.play||!P.a)return;
  const c=P.a.r.cenas[P.i],L=falasCena(c);
  if(L==null){legenda(null);P.t=setTimeout(fala,400);return}
  if(P.j>=L.length){
    if(P.i>=P.a.r.cenas.length-1){P.play=0;botao();salvaPos(1);soltaTela();legenda({t:'Fim da aula. ✓'});return}
    P.t=setTimeout(()=>{cena(P.i+1,0)},c.pausa!=null?c.pausa:900);return;
  }
  const f=L[P.j];desenha(f.k);legenda(f);
  const tk=++P.tok,vel=+lsg(LS_VEL,0.95)||0.95;
  const prox=()=>{if(tk!==P.tok)return;clearTimeout(P.wd);P.j++;P.t=setTimeout(fala,f.t.endsWith('?')?900:180)};
  const est=(f.t.length/14.5/vel)*1000;
  if(!temVoz()||lsg('aulas-mudo',0)){P.wd=setTimeout(prox,Math.max(1800,est*1.05));return}
  try{
    const u=new SpeechSynthesisUtterance(f.t),v=voz();u.lang='pt-BR';v&&(u.voice=v,u.lang=v.lang);u.rate=vel;u.pitch=1;u.volume=1;
    u.onend=prox;u.onerror=e=>{if(e&&/interrupted|canceled/.test(e.error))return;prox()};
    speechSynthesis.speak(u);
    // vigia: alguns aparelhos não avisam o fim da fala
    const vigia=()=>{if(tk!==P.tok)return;let s=0;try{s=speechSynthesis.speaking||speechSynthesis.pending}catch{}if(s){P.wd=setTimeout(vigia,1500);return}prox()};
    P.wd=setTimeout(vigia,est*1.6+2500);
  }catch{P.wd=setTimeout(prox,est)}
}
function tocar(){
  if(!P.a)return;
  if(P.i>=P.a.r.cenas.length-1&&P.j>=((falasCena(P.a.r.cenas[P.i])||[]).length))cena(0,0);
  P.play=1;botao();prendeTela();
  // iOS: a primeira fala precisa nascer do toque
  try{if(temVoz()){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}}catch{}
  clearTimeout(P.t);P.t=setTimeout(fala,120);
}
function para(){P.play=0;P.tok++;clearTimeout(P.t);clearTimeout(P.wd);try{speechSynthesis.cancel()}catch{}botao();soltaTela()}
function botao(){const b=document.querySelector('.aup-pp');b&&(b.innerHTML=P.play?IC.pause:IC.play,b.setAttribute('aria-label',P.play?'Pausar':'Tocar'))}
async function prendeTela(){try{if('wakeLock'in navigator&&!P.wl)P.wl=await navigator.wakeLock.request('screen')}catch{}}
function soltaTela(){try{P.wl&&P.wl.release()}catch{}P.wl=null}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&P.play)para()});

/* ---------- dados reais (função candles) ---------- */
async function buscaDados(i){
  const c=P.a.r.cenas[i],v=c.vis,d=v.dados;
  const fim=x=>{P.dados[i]=x;if(P.i===i&&P.on){desenha(P.j?((falasCena(c)||[])[P.j]||{}).k:-1);if(!P.play)legenda(null)}};
  if(!logado()&&!window.AULAS_CANDLES){fim({erro:'Entre na conta para carregar o gráfico real.'});return}
  try{
    let j;
    if(window.AULAS_CANDLES)j=window.AULAS_CANDLES(d);
    else{
      await tok();const s=cfg();
      const r=await fetch(s.url+'/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({ativo:d.ativo,de:d.de,ate:d.ate})});
      j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Erro '+r.status);
    }
    let cd=(j.candles||[]).filter(x=>{const t=dia(x[0]);return t>=d.de&&t<=d.ate});
    cd=diario(cd);
    if(cd.length<3)throw new Error('Poucos dados para esse período.');
    const ini=cd[0][4],ult=cd[cd.length-1][4],mx=Math.max(...cd.map(x=>x[2])),mn=Math.min(...cd.map(x=>x[3])),dc=d.casas!=null?d.casas:2;
    const ph={ini:nf(ini,dc),fim:nf(ult,dc),max:nf(mx,dc),min:nf(mn,dc),varp:pct(100*(ult/ini-1)),dias:cd.length,deTx:dataTx(d.de),ateTx:dataTx(d.ate)};
    const out={cd,ph,fonte:j.fonte||'Yahoo Finance',simbolo:j.simbolo||d.ativo};
    if(v.tipo==='ajuste')Object.assign(ph,calcAjuste(v,cd.map(x=>x[4])).ph);
    fim(out);
  }catch(e){fim({erro:String(e.message||e)})}
}
const dia=t=>new Date((t-3*3600)*1000).toISOString().slice(0,10);
const dataTx=s=>{const[y,m,dd]=String(s).split('-');return`${+dd} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][m-1]} de ${y}`};
function diario(cd){const m=new Map();for(const x of cd){const k=dia(x[0]),a=m.get(k);if(!a)m.set(k,[x[0],x[1],x[2],x[3],x[4]]);else{a[2]=Math.max(a[2],x[2]);a[3]=Math.min(a[3],x[3]);a[4]=x[4]}}return[...m.values()]}

/* ---------- visuais ---------- */
function desenha(k){
  const c=P.a.r.cenas[P.i],v=c.vis||{tipo:'titulo',t:c.titulo},el=document.getElementById('aupvis');if(!el)return;
  const chave=P.i+'|'+k+'|'+(P.dados[P.i]?1:0);if(P.vis===chave)return;P.vis=chave;
  const R=VIS[v.tipo]||VIS.titulo,inner=R(v,k,P.dados[P.i],c);
  el.innerHTML=videoFrame(c,v,k,inner);el.className='aup-vis au-video au-'+v.tipo;
}
function videoTema(c,v,k){
  const txt=((c.titulo||'')+' '+(v.t||'')+' '+((v.chips||[]).join(' '))).toLowerCase();
  const temas=[
    [/op[cç][oõ]es|call|put|payoff|strike|pr[eê]mio/,['OPÇÕES','▵','payoff','risco assimétrico']],
    [/candles|gr[aá]fico|tend[eê]ncia|pre[cç]o|mercado/,['GRÁFICO','▥','movimento do preço','leitura visual']],
    [/margem|ajuste|futuro|contrato|d[oó]lar|win|wdo/,['FUTUROS','⇄','ajuste diário','gestão de margem']],
    [/psicologia|disciplina|rotina|emo[cç][aã]o|risco/,['MENTALIDADE','◉','processo antes do resultado','decisão profissional']],
    [/fundamento|empresa|balan[cç]o|valuation|receita|lucro/,['FUNDAMENTOS','▦','negócio por trás do preço','análise de valor']],
    [/juros|fed|copom|macro|infla[cç][aã]o|dxy/,['MACRO','⌁','cenário e liquidez','contexto global']]
  ];
  for(const [re,vv] of temas)if(re.test(txt))return vv;
  return ['AULA','◆','conceito principal','exemplo prático'];
}
function videoFrame(c,v,k,inner){
  const n=Math.max(0,k||0),[tag,ico,lead,sub]=videoTema(c,v,n),titulo=c.titulo||v.t||'Aula';
  const barras=Array.from({length:16},(_,i)=>`<i style="height:${18+((i*17+n*23)%62)}%"></i>`).join('');
  const cards=[lead,sub,'ponto-chave '+(n+1)].map((x,i)=>`<span class="auyt-card c${i}">${h(x)}</span>`).join('');
  return `<div class="auyt auyt-${n%6}" style="--step:${n%8}"><div class="auyt-bg"><span>${ico}</span><span>${ico}</span><span>${ico}</span></div><div class="auyt-head"><b>DIÁRIO DE TRADER · AULA</b><em>${h(tag)}</em></div><div class="auyt-body"><div class="auyt-main">${inner}</div><aside class="auyt-side"><div class="auyt-thumb">${ico}</div><strong>${h(titulo)}</strong><small>Cena ${P.i+1} · tomada ${n+1}</small><div class="auyt-bars">${barras}</div>${cards}</aside></div><div class="auyt-lower"><span>🎬 Modo vídeo</span><span>${h(lead)}</span><span>${String(P.i+1).padStart(2,'0')}/${String(P.a?.r?.cenas?.length||1).padStart(2,'0')}</span></div></div>`;
}
const mostra=(x,k)=>x==null||x.em==null||k>=x.em;
const VIS={
 titulo(v,k){return`<div class="auv-tit">${v.kicker?`<div class="auv-kick">${h(v.kicker)}</div>`:''}<div class="auv-h">${h(v.t)}</div>${v.sub?`<div class="auv-sub">${h(v.sub)}</div>`:''}${v.chips?`<div class="auv-chips">${v.chips.map(x=>`<span>${h(x)}</span>`).join('')}</div>`:''}</div>`},
 topicos(v,k){return`<div class="auv-top">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<ul>${v.itens.map(x=>{const o=typeof x==='string'?{t:x}:x;return`<li class="${mostra(o,k)?'on':''}">${o.ic?`<span class="ic">${h(o.ic)}</span>`:'<span class="ic dot"></span>'}<span><b>${h(o.t)}</b>${o.s?`<small>${h(o.s)}</small>`:''}</span></li>`}).join('')}</ul></div>`},
 tabela(v,k){return`<div class="auv-tab">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<table><thead><tr>${v.cab.map(x=>`<th>${h(x)}</th>`).join('')}</tr></thead><tbody>${v.linhas.map((l,n)=>{const em=v.em&&v.em[n];return`<tr class="${em==null||k>=em?'on':''}">${l.map((x,m)=>`<td${m===0?' class="r"':''}>${h(x)}</td>`).join('')}</tr>`}).join('')}</tbody></table>${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`},
 formula(v,k){return`<div class="auv-for">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<div class="auv-f">${h(v.f)}</div>${(v.linhas||[]).map(x=>{const o=typeof x==='string'?{t:x}:x;return`<div class="auv-fl ${mostra(o,k)?'on':''}${o.forte?' forte':''}">${h(o.t)}</div>`}).join('')}</div>`},
 pergunta(v,k){return`<div class="auv-q"><div class="auv-kick">Revisão</div><div class="auv-qq">${h(v.q)}</div><div class="auv-qa ${k>=(v.em||1)?'on':''}">${h(v.r)}</div></div>`},
 fluxo,payoff,candles,ajuste,convergencia
};
function fluxo(v,k){
  const W=100,H=v.h||56,N={};v.nos.forEach(n=>N[n.id]=n);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg" role="img" aria-label="${h(v.t||'Diagrama')}"><defs><marker id="auar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#94a3b8"/></marker></defs>`;
  for(const a of v.setas||[]){if(!mostra(a,k))continue;const A=N[a.de],B=N[a.para];if(!A||!B)continue;
    const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,wa=(A.w||22)/2,ha=(A.hh||9)/2,wb=(B.w||22)/2,hb=(B.hh||9)/2;
    const ta=Math.min(Math.abs(ux)>1e-6?wa/Math.abs(ux):1e9,Math.abs(uy)>1e-6?ha/Math.abs(uy):1e9)+1,tb=Math.min(Math.abs(ux)>1e-6?wb/Math.abs(ux):1e9,Math.abs(uy)>1e-6?hb/Math.abs(uy):1e9)+1.5;
    const x1=A.x+ux*ta,y1=A.y+uy*ta,x2=B.x-ux*tb,y2=B.y-uy*tb,o=a.off||0,ox=-uy*o,oy=ux*o;
    s+=`<line x1="${x1+ox}" y1="${y1+oy}" x2="${x2+ox}" y2="${y2+oy}" stroke="${a.cor||'#94a3b8'}" stroke-width=".5" marker-end="url(#auar)"${a.dupla?' marker-start="url(#auar)"':''}/>`;
    if(a.t)s+=`<text x="${(x1+x2)/2+ox+(a.tx||0)}" y="${(y1+y2)/2+oy-1.4+(a.ty||0)}" class="auv-st">${h(a.t)}</text>`}
  for(const n of v.nos){if(!mostra(n,k))continue;const w=n.w||22,hh=n.hh||9;
    s+=`<g><rect x="${n.x-w/2}" y="${n.y-hh/2}" width="${w}" height="${hh}" rx="2" fill="${n.cor||'#1e293b'}" stroke="${n.borda||'#334155'}" stroke-width=".4"/><text x="${n.x}" y="${n.y+(n.sub?-.4:1.1)}" class="auv-nt">${h(n.t)}</text>${n.sub?`<text x="${n.x}" y="${n.y+2.9}" class="auv-ns">${h(n.sub)}</text>`:''}</g>`}
  return`<div class="auv-flx">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${s}</svg>${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`;
}
function eixo(x0,x1,n){const r=x1-x0,p=Math.pow(10,Math.floor(Math.log10(r/n))),m=[1,2,2.5,5,10].find(f=>r/(f*p)<=n)*p,o=[];for(let x=Math.ceil(x0/m)*m;x<=x1+1e-9;x+=m)o.push(+x.toFixed(10));return o}
function payoff(v,k){
  const[a,b]=v.x,W=100,H=58,L=11,Rm=3,T=5,B=9;
  const leg=(g,s)=>{const q=g.q||1,pr=g.p||0;let val=g.tipo==='call'?Math.max(s-g.K,0)-pr:g.tipo==='put'?Math.max(g.K-s,0)-pr:s-g.K;return val*(g.pos||1)*q};
  const tot=s=>v.pernas.reduce((t,g)=>t+leg(g,s),0);
  const xs=[];for(let i=0;i<=200;i++)xs.push(a+(b-a)*i/200);
  const all=[0,...xs.map(tot),...(v.pernas.length>1?v.pernas.flatMap(g=>xs.map(s=>leg(g,s))):[])];
  let y0=Math.min(...all),y1=Math.max(...all);const pd=(y1-y0)*.12||1;y0-=pd;y1+=pd;
  const X=s=>L+(s-a)/(b-a)*(W-L-Rm),Y=y=>T+(y1-y)/(y1-y0)*(H-T-B);
  const path=f=>xs.map((s,i)=>(i?'L':'M')+X(s).toFixed(2)+' '+Y(f(s)).toFixed(2)).join('');
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg">`;
  for(const t of eixo(y0,y1,5))s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(t)}" y2="${Y(t)}" class="auv-grid"/><text x="${L-1}" y="${Y(t)+1}" class="auv-ax" text-anchor="end">${nf(t,Math.abs(t)<10&&t%1?1:0)}</text>`;
  for(const t of eixo(a,b,6))s+=`<text x="${X(t)}" y="${H-B+4}" class="auv-ax" text-anchor="middle">${nf(t,t%1?1:0)}</text>`;
  s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(0)}" y2="${Y(0)}" stroke="#64748b" stroke-width=".35"/>`;
  s+=`<path d="${xs.map((x,i)=>(i?'L':'M')+X(x).toFixed(2)+' '+Y(Math.max(0,tot(x))).toFixed(2)).join('')}L${X(b)} ${Y(0)}L${X(a)} ${Y(0)}Z" fill="rgba(34,197,94,.14)"/>`;
  s+=`<path d="${xs.map((x,i)=>(i?'L':'M')+X(x).toFixed(2)+' '+Y(Math.min(0,tot(x))).toFixed(2)).join('')}L${X(b)} ${Y(0)}L${X(a)} ${Y(0)}Z" fill="rgba(239,68,68,.14)"/>`;
  if(v.pernas.length>1)v.pernas.forEach(g=>{s+=`<path d="${path(x=>leg(g,x))}" fill="none" stroke="#64748b" stroke-width=".4" stroke-dasharray="1.2 1"/>`});
  for(const g of v.pernas)if(g.K!=null)s+=`<line x1="${X(g.K)}" x2="${X(g.K)}" y1="${T}" y2="${H-B}" stroke="#475569" stroke-width=".3" stroke-dasharray=".8 .8"/><text x="${X(g.K)}" y="${T+2.6}" class="auv-ax" text-anchor="middle">${h(v.rotK||'K')} ${nf(g.K,g.K%1?2:0)}</text>`;
  s+=`<path d="${path(tot)}" fill="none" stroke="${v.cor||'#38bdf8'}" stroke-width=".9" stroke-linejoin="round"/>`;
  // ponto de equilíbrio
  if(mostra({em:v.emBe},k))for(let i=1;i<xs.length;i++){const p=tot(xs[i-1]),q=tot(xs[i]);if(p===0&&i>1)continue;if((p<0&&q>=0)||(p>0&&q<=0)){const xb=xs[i-1]+(xs[i]-xs[i-1])*(Math.abs(p)/(Math.abs(p)+Math.abs(q)));s+=`<circle cx="${X(xb)}" cy="${Y(0)}" r=".9" fill="#facc15"/><text x="${X(xb)+1}" y="${Y(0)+(v.beBaixo?4:-1.6)}" class="auv-lb" fill="#facc15">equilíbrio ${nf(xb,2)}</text>`}}
  if(v.ponto&&mostra(v.ponto,k)){const P0=v.ponto.s,r=tot(P0);s+=`<circle cx="${X(P0)}" cy="${Y(r)}" r="1.1" fill="#fff"/><text x="${X(P0)+(v.ponto.esq?-1.5:1.5)}" y="${Y(r)-1.8}" class="auv-lb" text-anchor="${v.ponto.esq?'end':'start'}">${h(v.ponto.t||'')} ${r>=0?'+':''}${nf(r,2)}</text>`}
  s+=`<text x="${(L+W-Rm)/2}" y="${H-.6}" class="auv-ax" text-anchor="middle">${h(v.xr||'Preço no vencimento')}</text></svg>`;
  return`<div class="auv-pay">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${s}${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`;
}
function semDados(v,d){return`<div class="auv-wait">${d&&d.erro?`<b>Gráfico real indisponível agora</b><span>${h(d.erro)}</span>`:'<b>Buscando dados reais…</b><span>'+h(v.dados.ativo)+' · '+h(dataTx(v.dados.de))+' a '+h(dataTx(v.dados.ate))+'</span>'}</div>`}
function candles(v,k,d){
  if(!d||d.erro)return`<div class="auv-cd">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${semDados(v,d)}</div>`;
  const cd=d.cd,W=100,H=56,L=2,Rm=12,T=4,B=6,n=cd.length;
  let y0=Math.min(...cd.map(x=>x[3])),y1=Math.max(...cd.map(x=>x[2]));const pd=(y1-y0)*.06;y0-=pd;y1+=pd;
  const X=i=>L+(i+.5)*(W-L-Rm)/n,Y=y=>T+(y1-y)/(y1-y0)*(H-T-B),bw=Math.max(.15,(W-L-Rm)/n*.62),dc=v.dados.casas!=null?v.dados.casas:2;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg">`;
  for(const t of eixo(y0,y1,5))s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(t)}" y2="${Y(t)}" class="auv-grid"/><text x="${W-Rm+1}" y="${Y(t)+1}" class="auv-ax">${nf(t,t%1?dc:0)}</text>`;
  cd.forEach((x,i)=>{const up=x[4]>=x[1],c=up?'#22c55e':'#ef4444';s+=`<line x1="${X(i)}" x2="${X(i)}" y1="${Y(x[2])}" y2="${Y(x[3])}" stroke="${c}" stroke-width="${Math.min(.3,bw/2)}"/><rect x="${X(i)-bw/2}" y="${Y(Math.max(x[1],x[4]))}" width="${bw}" height="${Math.max(.15,Math.abs(Y(x[1])-Y(x[4])))}" fill="${c}"/>`});
  const meses=new Set();cd.forEach((x,i)=>{const t=dia(x[0]),m=t.slice(0,7);if(n>60){if(!meses.has(m)){meses.add(m);if(meses.size%2||n<150)s+=`<text x="${X(i)}" y="${H-1.5}" class="auv-ax" text-anchor="middle">${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+t.slice(5,7)-1]}</text>`}}else if(i%Math.ceil(n/7)===0)s+=`<text x="${X(i)}" y="${H-1.5}" class="auv-ax" text-anchor="middle">${t.slice(8,10)}/${t.slice(5,7)}</text>`});
  if(mostra({em:v.emMarcas},k)){
    const a=cd[0][4],b=cd[n-1][4];
    s+=`<line x1="${X(0)}" x2="${X(n-1)}" y1="${Y(a)}" y2="${Y(a)}" stroke="#facc15" stroke-width=".35" stroke-dasharray="1 1"/><circle cx="${X(0)}" cy="${Y(a)}" r=".9" fill="#facc15"/><text x="${X(0)+1}" y="${Y(a)+(b>a?3.6:-1.5)}" class="auv-lb" fill="#facc15">${h(v.rotIni||'início')} ${nf(a,dc)}</text>`;
    s+=`<circle cx="${X(n-1)}" cy="${Y(b)}" r=".9" fill="#38bdf8"/><text x="${X(n-1)-1}" y="${Y(b)+(b>a?-1.5:3.6)}" class="auv-lb" fill="#38bdf8" text-anchor="end">${h(v.rotFim||'fim')} ${nf(b,dc)} (${pct(100*(b/a-1))})</text>`;
  }
  s+='</svg>';
  return`<div class="auv-cd">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${s}<div class="auv-fonte">Dados reais · ${h(d.simbolo)} · ${h(d.fonte)}${v.nota?' · '+h(v.nota):''}</div></div>`;
}
function calcAjuste(v,precos){
  const q=v.contratos||1,m=v.mult,lado=v.lado||1,ini=v.margemIni*q,man=v.margemMan*q,rows=[];let saldo=ini,acum=0,dep=0,ch=0;
  for(let i=0;i<precos.length;i++){
    const p=precos[i],aj=i?(p-precos[i-1])*m*q*lado:0;acum+=aj;saldo+=aj;let call=0;
    if(saldo<man){call=ini-saldo;dep+=call;ch++}
    rows.push({p,aj,acum,saldo,call});if(call)saldo=ini;
  }
  const dcs=v.casas!=null?v.casas:(precos.some(x=>x%1)?1:0);
  return{rows,ini,man,ph:{chamadas:ch===0?'nenhuma chamada de margem':ch===1?'uma chamada de margem':ch+' chamadas de margem',deposito:brl(dep).replace('R$ ','')+' reais',total:(acum<0?'um prejuízo de ':'um lucro de ')+nf(Math.abs(acum),2)+' reais',pIni:nf(precos[0],dcs),pFim:nf(precos[precos.length-1],dcs),margemIni:nf(ini,0)+' reais',margemMan:nf(man,0)+' reais'}};
}
function ajuste(v,k,d){
  let precos=v.precos,datas=null;
  if(v.dados){if(!d||d.erro)return`<div class="auv-aj">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${semDados(v,d)}</div>`;precos=d.cd.map(x=>+x[4].toFixed(v.dados.casas!=null?v.dados.casas:0));datas=d.cd.map(x=>dia(x[0]))}
  const A=calcAjuste(v,precos),R=A.rows,dc=v.casas!=null?v.casas:(precos.some(x=>x%1)?1:0),mostraTab=mostra({em:v.emTab},k);
  const W=100,H=30,L=2,Rm=16,T=3,B=4,sal=R.map(r=>r.saldo);let y0=Math.min(A.man,...sal),y1=Math.max(A.ini,...sal);const pd=(y1-y0)*.12;y0-=pd;y1+=pd;
  const X=i=>L+i*(W-L-Rm)/Math.max(1,R.length-1),Y=y=>T+(y1-y)/(y1-y0)*(H-T-B);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg">`;
  s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(A.ini)}" y2="${Y(A.ini)}" stroke="#38bdf8" stroke-width=".3" stroke-dasharray="1 .8"/><text x="${W-Rm+1}" y="${Y(A.ini)+1}" class="auv-ax" fill="#38bdf8">inicial</text>`;
  s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(A.man)}" y2="${Y(A.man)}" stroke="#f97316" stroke-width=".3" stroke-dasharray="1 .8"/><text x="${W-Rm+1}" y="${Y(A.man)+1}" class="auv-ax" fill="#f97316">manutenção</text>`;
  s+=`<path d="${R.map((r,i)=>(i?'L':'M')+X(i).toFixed(2)+' '+Y(r.saldo).toFixed(2)+(r.call?'L'+X(i).toFixed(2)+' '+Y(A.ini).toFixed(2):'')).join('')}" fill="none" stroke="#e2e8f0" stroke-width=".6"/>`;
  R.forEach((r,i)=>{s+=`<circle cx="${X(i)}" cy="${Y(r.saldo)}" r="${r.call?1.1:.55}" fill="${r.call?'#ef4444':'#e2e8f0'}"/>`});
  s+='</svg>';
  const tabH=`<table class="auv-ajt"><thead><tr><th>${datas?'Dia':'Dia'}</th><th>Preço</th><th>Ajuste</th><th>Saldo</th></tr></thead><tbody>${R.map((r,i)=>`<tr class="${r.call?'call':''}"><td>${datas?datas[i].slice(8,10)+'/'+datas[i].slice(5,7):i+1}</td><td>${nf(r.p,dc)}</td><td class="${r.aj>0?'pos':r.aj<0?'neg':''}">${i?brl(r.aj):'—'}</td><td>${brl(r.saldo)}${r.call?`<small>chamada: +${brl(r.call)}</small>`:''}</td></tr>`).join('')}</tbody></table>`;
  return`<div class="auv-aj">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<div class="auv-ajc">${h(v.desc||'')}</div>${s}${mostraTab?tabH:''}${v.dados&&d?`<div class="auv-fonte">Fechamentos reais · ${h(d.simbolo)} · ${h(d.fonte)}${v.nota?' · '+h(v.nota):''}</div>`:v.nota?`<div class="auv-fonte">${h(v.nota)}</div>`:''}</div>`;
}
function convergencia(v,k){
  const W=100,H=52,L=6,Rm=6,T=6,B=8,X=t=>L+t*(W-L-Rm),Y=y=>T+(1-y)*(H-T-B),n=60;
  const spot=t=>.5+.08*Math.sin(t*9)+.05*Math.sin(t*23+1)-.04*t;
  const caso=(sig,cor,rot,em)=>{if(!mostra({em},k))return'';const fut=t=>spot(t)+sig*.22*(1-t);let p='',q='';for(let i=0;i<=n;i++){const t=i/n;p+=(i?'L':'M')+X(t).toFixed(2)+' '+Y(fut(t)).toFixed(2);}return`<path d="${p}" fill="none" stroke="${cor}" stroke-width=".7"/><text x="${X(.06)}" y="${Y(fut(.06))+(sig>0?-1.6:3.4)}" class="auv-lb" fill="${cor}">${rot}</text>`};
  let sp='';for(let i=0;i<=n;i++){const t=i/n;sp+=(i?'L':'M')+X(t).toFixed(2)+' '+Y(spot(t)).toFixed(2)}
  return`<div class="auv-cv">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<svg viewBox="0 0 ${W} ${H}" class="auv-svg"><line x1="${X(1)}" x2="${X(1)}" y1="${T-2}" y2="${H-B}" stroke="#64748b" stroke-width=".3" stroke-dasharray="1 1"/><text x="${X(1)}" y="${H-B+4}" class="auv-ax" text-anchor="end">vencimento</text><text x="${X(0)}" y="${H-B+4}" class="auv-ax">hoje</text>
${caso(1,'#38bdf8','futuro acima do à vista (normal)',v.emA)}${caso(-1,'#f97316','futuro abaixo do à vista (invertido)',v.emB)}<path d="${sp}" fill="none" stroke="#e2e8f0" stroke-width=".8"/><text x="${X(.62)}" y="${Y(spot(.62))+3.6}" class="auv-lb">preço à vista</text><circle cx="${X(1)}" cy="${Y(spot(1))}" r="1.1" fill="#facc15"/></svg>${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`;
}

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
  const q=s=>e.target.closest(s);let b;
  if(b=q('[data-auopen]')){e.preventDefault();abre(b.dataset.auopen);return}
  if(q('[data-aurel]')){AU.lista=null;carregaLista(1);pinta();return}
  if(!P.on)return;
  if(q('[data-auvozteste]')){testaVoz();return}
  if(q('[data-aux]')){fecha();return}
  if(q('[data-aupp]')){P.play?para():tocar();return}
  if(q('[data-aunext]')){cena(P.i+1,0);return}
  if(q('[data-auprev]')){cena(P.j>1?P.i:P.i-1,0);return}
  if(q('[data-audel]')){const a=P.a;if(!a||!confirm(`Apagar a aula ${a.numero} de “${a.livro}”? Isso não pode ser desfeito.`))return;rq('/rest/v1/aulas?id=eq.'+a.id,{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(()=>{try{localStorage.removeItem(LS_ROT+a.id);localStorage.removeItem(LS_POS+a.id)}catch{}AU.lista=null;fecha();carregaLista(1);toast&&toast('Aula apagada.')}).catch(e=>toast&&toast('Não apagou: '+(e.message||e)));return}
  if(q('[data-auidx]')){const x=document.getElementById('aupidx');x.hidden=!x.hidden;return}
  if(b=q('[data-aucena]')){document.getElementById('aupidx').hidden=true;cena(+b.dataset.aucena,0);return}
  if(q('.aup-stage')&&!q('select')){P.play?para():tocar()}
},true);
document.addEventListener('change',e=>{
  if(e.target.id==='aupvel'){lss(LS_VEL,+e.target.value);if(P.play){const j=P.j;cena(P.i,j)}}
  if(e.target.id==='aupvoz'){lss(LS_VOZ,e.target.value);if(P.play){cena(P.i,P.j)}}
});
document.addEventListener('keydown',e=>{if(!P.on)return;if(e.key==='Escape')fecha();else if(e.key===' '){e.preventDefault();P.play?para():tocar()}else if(e.key==='ArrowRight')cena(P.i+1,0);else if(e.key==='ArrowLeft')cena(P.i-1,0)});

/* ---------- gerador: PDF do livro → aula pela IA (função "aulas") ---------- */
const LS_JOB='aulas-job-v1';
const G={aberto:0,livros:null,sel:'',novoNome:'',caps:{},manual:'',numero:'',busy:0,msg:'',erro:'',pct:0};
function idb(){return new Promise((ok,no)=>{const r=indexedDB.open(window.DIARIO_DEMO?'aulas-livros-demo':'aulas-livros',1);r.onupgradeneeded=()=>r.result.createObjectStore('livros',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function idbOp(modo,fn){const d=await idb();return new Promise((ok,no)=>{const t=d.transaction('livros',modo),st=t.objectStore('livros'),r=fn(st);t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>no(t.error)})}
async function livrosLista(){try{const L=await idbOp('readonly',st=>st.getAll());G.livros=(L||[]).map(({buf,...x})=>x).sort((a,b)=>b.em.localeCompare(a.em))}catch{G.livros=[]}pinta()}
const livroBuf=id=>idbOp('readonly',st=>st.get(id)).then(x=>x&&x.buf);
async function pdfLib(){
  if(typeof ntLib==='function')return ntLib();
  if(window.pdfjsLib)return window.pdfjsLib;
  const b='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  await new Promise((ok,no)=>{const s=document.createElement('script');s.src=b+'pdf.min.js';s.onload=ok;s.onerror=()=>no(new Error('Sem internet para carregar o leitor de PDF.'));document.head.appendChild(s)});
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=b+'pdf.worker.min.js';return window.pdfjsLib;
}
async function abrePdf(buf){const L=await pdfLib();return L.getDocument({data:new Uint8Array(buf.slice(0))}).promise}
async function sumarioDe(pdf){
  let o=null;try{o=await pdf.getOutline()}catch{}
  if(!o||!o.length)return[];
  let it=o;if(it.length<3)it=it.flatMap(x=>[x,...(x.items||[])]);
  const r=[];
  for(const x of it.slice(0,250)){try{let d=x.dest;if(typeof d==='string')d=await pdf.getDestination(d);if(!Array.isArray(d))continue;const p=typeof d[0]==='number'?d[0]:await pdf.getPageIndex(d[0]);r.push({t:String(x.title||'').replace(/\s+/g,' ').trim().slice(0,110),p:p+1})}catch{}}
  r.sort((a,b)=>a.p-b.p);
  r.forEach((x,i)=>{x.ate=Math.max(x.p,(r[i+1]?r[i+1].p-1:pdf.numPages))});
  return r.filter(x=>x.t);
}
async function enviaPdf(file){
  if(!file)return;if(!/pdf$/i.test(file.type)&&!/\.pdf$/i.test(file.name)){G.erro='Escolha um arquivo PDF.';pinta();return}
  G.busy=1;G.erro='';G.msg='Lendo o PDF…';pinta();
  try{
    const buf=await file.arrayBuffer(),pdf=await abrePdf(buf),sum=await sumarioDe(pdf);
    const nome=(G.novoNome||file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ')).trim().slice(0,120);
    const reg={id:'l'+Date.now().toString(36),nome,arquivo:file.name,paginas:pdf.numPages,sumario:sum,tam:file.size,em:new Date().toISOString(),buf};
    await idbOp('readwrite',st=>st.put(reg));
    G.sel=reg.id;G.caps={};G.manual='';G.msg=sum.length?'':'Este PDF não tem sumário embutido: informe as páginas de cada capítulo.';
    await livrosLista();
  }catch(e){G.erro='Não consegui ler o PDF: '+(e.message||e)}
  G.busy=0;pinta();
}
function livroSel(){return(G.livros||[]).find(x=>x.id===G.sel)||null}
function proxNumero(nome){const L=(AU.lista||[]).filter(a=>a.livro===nome);return L.length?Math.max(...L.map(a=>+a.numero||0))+1:1}
function partesEscolhidas(lv){
  if(lv.sumario&&lv.sumario.length&&!G.usarManual)return lv.sumario.filter((x,i)=>G.caps[i]).map(x=>({nome:x.t,de:x.p,ate:x.ate}));
  return G.manual.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const m=/^(.*?)[|:\-–]\s*(\d+)\s*(?:a|-|–|até)\s*(\d+)\s*$/i.exec(l)||/^(.*?)\s+(\d+)\s*(?:a|-|–|até)\s*(\d+)\s*$/i.exec(l);return m?{nome:m[1].replace(/[|:\-–]\s*$/,'').trim()||'Capítulo',de:+m[2],ate:+m[3]}:null}).filter(Boolean);
}
function novaHtml(){
  const job=lsg(LS_JOB,null);
  if(!G.aberto)return`<div class="au-novabar"><button class="btn au-nova" data-aunova="1">＋ Nova aula</button>${job&&!G.busy?`<button class="btn s" data-aucont="1">Continuar a aula ${h(job.numero)} de ${h(job.livro)}</button>`:''}</div>`;
  if(G.livros==null){livrosLista();return'<div class="card"><div class="sm mut">Carregando seus livros…</div></div>'}
  const lv=livroSel(),dis=G.busy?' disabled':'';
  let o=`<div class="card au-form"><div class="top"><b>Nova aula</b><button class="btn s" data-aufecha="1"${dis}>Fechar</button></div>`;
  o+=`<label class="sm mut">Livro</label><div class="au-livros">${(G.livros||[]).map(x=>`<button class="au-lv${x.id===G.sel?' on':''}" data-aulv="${h(x.id)}"${dis}><b>${h(x.nome)}</b><span class="sm mut">${x.paginas} págs.${x.sumario&&x.sumario.length?' · sumário com '+x.sumario.length+' itens':''}</span></button>`).join('')}
<label class="au-up${G.busy?' dis':''}"><input type="file" accept="application/pdf,.pdf" id="aupdf"${dis} hidden>📄 Enviar PDF de um livro</label></div>
<div class="sm mut">O PDF fica guardado só neste aparelho. Só o texto dos capítulos escolhidos vai para a IA.</div>`;
  if(lv){
    const num=G.numero||proxNumero(lv.nome),temSum=lv.sumario&&lv.sumario.length&&!G.usarManual;
    o+=`<div class="au-row"><div><label class="sm mut">Nome do livro nas aulas</label><input id="aulvnome" value="${h(lv.nome)}"${dis}></div><div style="max-width:90px"><label class="sm mut">Aula nº</label><input id="aunum" type="number" min="1" value="${h(num)}"${dis}></div></div>`;
    if(temSum){
      const n=Object.values(G.caps).filter(Boolean).length;
      o+=`<label class="sm mut">Capítulos desta aula (marque 2 ou 3 · ${n} marcados)</label><div class="au-caps">${lv.sumario.map((x,i)=>`<label class="au-cap${G.caps[i]?' on':''}"><input type="checkbox" data-aucap="${i}"${G.caps[i]?' checked':''}${dis}><span>${h(x.t)}</span><small>p. ${x.p}–${x.ate}</small></label>`).join('')}</div><button class="lnk sm" data-aumanual="1"${dis}>Prefiro digitar as páginas</button>`;
    }else{
      o+=`<label class="sm mut">Capítulos e páginas do PDF (uma linha por capítulo, até 4)</label><textarea id="aumanual" rows="3" placeholder="Capítulo 3 — Hedge | 56-80&#10;Capítulo 4 — Juros | 81-110"${dis}>${h(G.manual)}</textarea>${lv.sumario&&lv.sumario.length?'<button class="lnk sm" data-aumanual="0">Usar o sumário do PDF</button>':''}`;
    }
    o+=`<div class="au-acoes"><button class="btn" data-augera="1"${dis}>${G.busy?'Gerando…':'🎬 Gerar aula'}</button><button class="lnk sm" data-auapaga="${h(lv.id)}"${dis}>Apagar este PDF do aparelho</button></div>`;
  }
  if(G.msg||G.busy)o+=`<div class="au-prog"><div class="sm">${h(G.msg)}</div>${G.busy?`<div class="au-pb"><i style="width:${G.pct}%"></i></div><div class="sm mut">Leva cerca de 1 minuto a cada 10 páginas. Mantenha o app aberto e a tela ligada.</div>`:''}</div>`;
  if(G.erro)o+=`<div class="card warn" style="margin:10px 0 0"><div class="sm">${h(G.erro)}</div></div>`;
  return o+'</div>';
}
function gerandoHtml(a){
  const job=lsg(LS_JOB,null),meu=job&&job.id===a.id;
  return`<div class="au-item au-ger"><span class="au-n">…</span><span class="au-tx"><b>Aula ${a.numero} · gerando</b><span class="sm mut">${G.busy&&meu?h(G.msg):meu?'Interrompida. Toque em continuar.':'Em geração em outro aparelho ou interrompida.'}</span></span>${!G.busy&&meu?'<button class="btn s" data-aucont="1">Continuar</button>':''}</div>`;
}
async function chamaFn(corpo,ms){
  await tok();const s=cfg();
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms);
  try{
    const r=await fetch(s.url+'/functions/v1/aulas',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(corpo)});
    const j=await r.json().catch(()=>({}));
    if(r.status===404&&!j.error)throw new Error('A função "aulas" não foi encontrada no Supabase.');
    if(!r.ok){const e=new Error(j.error||'Erro '+r.status);e.status=r.status;throw e}
    return j;
  }catch(e){if(e.name==='AbortError'){const x=new Error('A IA demorou demais para responder.');x.status=504;throw x}throw e}
  finally{clearTimeout(t)}
}
async function paginasTexto(pdf,de,ate,on){
  const L=[];de=Math.max(1,de);ate=Math.min(pdf.numPages,ate);
  for(let p=de;p<=ate;p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();L.push(tc.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('').replace(/[ \t]+/g,' ').trim());on&&on(p-de+1,ate-de+1)}
  return L;
}
// divide cada capítulo em trechos de ~10 páginas (~28 mil letras): cada trecho é uma chamada curta à IA
function trechos(pags){const B=[];let cur=[],n=0;for(const t of pags){if(n>0&&n+t.length>28000){B.push(cur.join('\n\n'));cur=[];n=0}cur.push(t);n+=t.length}if(cur.length)B.push(cur.join('\n\n'));if(B.length>1&&B[B.length-1].length<7000){const u=B.pop();B[B.length-1]+='\n\n'+u}return B}
async function gerar(cont){
  if(G.busy)return;
  if(!logado()){G.erro='Entre na sua conta (Mais → Conta) para gerar aulas.';pinta();return}
  let job=cont?lsg(LS_JOB,null):null;
  G.erro='';G.msg='';
  if(!job){
    const lv=livroSel();if(!lv){G.erro='Escolha ou envie o PDF do livro.';pinta();return}
    const nome=(document.getElementById('aulvnome')||{}).value||lv.nome,numero=+((document.getElementById('aunum')||{}).value||proxNumero(nome));
    const partes=partesEscolhidas(lv);
    if(!partes.length){G.erro=lv.sumario&&lv.sumario.length&&!G.usarManual?'Marque os capítulos desta aula.':'Escreva os capítulos e páginas, um por linha. Ex.: Capítulo 3 | 56-80';pinta();return}
    if(partes.length>4){G.erro='No máximo 4 capítulos por aula.';pinta();return}
    if(partes.some(p=>p.de<1||p.ate<p.de||p.ate>lv.paginas||p.ate-p.de>120)){G.erro=`Confira as páginas: devem estar entre 1 e ${lv.paginas}, com no máximo 120 por capítulo.`;pinta();return}
    if((AU.lista||[]).some(a=>a.livro===nome.trim()&&+a.numero===numero&&a.status!=='gerando')&&!confirm(`Já existe a aula ${numero} de “${nome}”. Substituir?`))return;
    if(nome.trim()!==lv.nome){try{const x=await idbOp('readonly',st=>st.get(lv.id));x.nome=nome.trim();await idbOp('readwrite',st=>st.put(x));lv.nome=nome.trim()}catch{}}
    job={livroId:lv.id,livro:nome.trim(),numero,partes,feitas:0};
  }
  G.busy=1;G.pct=1;G.msg='Preparando…';pinta();prendeTela();
  try{
    const buf=await livroBuf(job.livroId);
    if(!buf)throw new Error('O PDF deste livro não está mais neste aparelho. Envie o PDF de novo.');
    const pdf=await abrePdf(buf);
    // 1) lê todos os capítulos no aparelho e monta os trechos
    const blocos=[];
    for(const[ci,p]of job.partes.entries()){
      const pags=await paginasTexto(pdf,p.de,p.ate,(k,t)=>{G.msg=`Lendo “${p.nome}” · página ${k} de ${t}`;G.pct=1+8*(ci+k/t)/job.partes.length;pintaProg()});
      const tot=pags.join('').replace(/\s/g,'').length;
      if(tot<600)throw new Error(`Quase não há texto nas páginas ${p.de}–${p.ate}. O PDF pode ser escaneado (imagem), ou as páginas estão erradas.`);
      const tr=trechos(pags);tr.forEach((texto,bi)=>blocos.push({nome:p.nome,texto,bloco:bi,blocos:tr.length}));
    }
    if(blocos.length>24)throw new Error('Capítulos longos demais para uma aula só. Escolha menos capítulos.');
    if(!job.id){const r=await chamaFn({acao:'iniciar',livro:job.livro,numero:job.numero,capitulos:job.partes.map(p=>p.nome)},30000);job.id=r.id;lss(LS_JOB,job);AU.lista=null;carregaLista(1)}
    // 2) a IA escreve um trecho por vez
    const n=blocos.length;
    for(let i=job.feitas;i<n;i++){
      const b=blocos[i],base=10+88*i/n,fatia=88/n;
      G.msg=`A IA está escrevendo “${b.nome}”${b.blocos>1?` (parte ${b.bloco+1} de ${b.blocos})`:''} · ${i+1} de ${n}`;G.pct=base;pintaProg();
      const anda=setInterval(()=>{G.pct=Math.min(base+fatia*.95,G.pct+fatia/90);pintaProg()},1000);
      const corpo={acao:'parte',id:job.id,idx:i,total:n,bloco:b.bloco,blocos:b.blocos,capitulo:b.nome,texto:b.texto};
      try{
        try{await chamaFn(corpo,165000)}
        catch(e){if(e.status===502||e.status===504||e.status===500||e.status===546){G.msg='A IA falhou neste trecho. Tentando de novo…';pintaProg();await chamaFn(corpo,165000)}else throw e}
      }finally{clearInterval(anda)}
      job.feitas=i+1;lss(LS_JOB,job);G.pct=10+88*(i+1)/n;
    }
    try{localStorage.removeItem(LS_JOB)}catch{}
    G.busy=0;G.aberto=0;G.msg='';G.caps={};G.numero='';soltaTela();
    AU.lista=null;await carregaLista(1);toast&&toast('Aula pronta! 🎬');
    const nova=(AU.lista||[]).find(a=>a.id===job.id);pinta();if(nova)setTimeout(()=>abre(nova.id),300);
    return;
  }catch(e){G.erro=(e.message||String(e))+(job.id?' O que já foi feito ficou salvo: toque em “Continuar”.':'');}
  G.busy=0;soltaTela();AU.lista=null;carregaLista(1);pinta();
}
function pintaProg(){const g=document.querySelector('.au-ger .au-tx .sm');g&&(g.textContent=G.msg);const e=document.querySelector('.au-prog');if(e){e.querySelector('.sm').textContent=G.msg;const b=e.querySelector('.au-pb i');b&&(b.style.width=G.pct+'%')}else pinta()}
document.addEventListener('click',e=>{
  const q=s=>e.target.closest(s);let b;
  if(q('[data-aunova]')){G.aberto=1;G.erro='';G.msg='';pinta();return}
  if(q('[data-aufecha]')){G.aberto=0;G.erro='';G.msg='';pinta();return}
  if(b=q('[data-aulv]')){G.sel=b.dataset.aulv;G.caps={};G.numero='';G.usarManual=0;G.erro='';G.msg='';pinta();return}
  if(b=q('[data-aumanual]')){G.usarManual=b.dataset.aumanual==='1';pinta();return}
  if(q('[data-augera]')){gerar(0);return}
  if(q('[data-aucont]')){G.aberto=1;gerar(1);return}
  if(b=q('[data-auapaga]')){if(!confirm('Apagar este PDF do aparelho? As aulas já criadas continuam.'))return;idbOp('readwrite',st=>st.delete(b.dataset.auapaga)).then(()=>{G.sel='';livrosLista()});return}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='aupdf'){G.novoNome='';enviaPdf(t.files&&t.files[0]);return}
  if(t.dataset&&t.dataset.aucap!=null){G.caps[t.dataset.aucap]=t.checked;const y=scrollY;render();scrollTo(0,y);return}
  if(t.id==='aunum')G.numero=t.value;
});
document.addEventListener('input',e=>{if(e.target.id==='aumanual')G.manual=e.target.value});

/* ---------- estilo ---------- */
const css=`
.au-intro{margin:2px 2px 10px}
.au-livro{padding:12px}.au-lt{font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;opacity:.7;margin:0 0 8px 2px}
.au-item{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid rgba(127,127,127,.18);padding:12px 2px;color:inherit;font:inherit;cursor:pointer}
.au-item:first-of-type{border-top:0}
.au-n{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:800;background:rgba(16,150,100,.12);color:#0f8a5f}
.au-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.au-pb{display:block;height:4px;border-radius:2px;background:rgba(127,127,127,.2);margin-top:4px;overflow:hidden}.au-pb i{display:block;height:100%;background:#10b981}
.au-play{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#10b981;color:#fff;font-size:13px}
.au-novabar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.au-nova{font-weight:700}
.au-form{display:flex;flex-direction:column;gap:8px}.au-form .top{display:flex;justify-content:space-between;align-items:center}
.au-form input,.au-form textarea{width:100%;box-sizing:border-box}
.au-livros{display:flex;flex-direction:column;gap:6px}
.au-lv{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.25);background:none;color:inherit;font:inherit;cursor:pointer}
.au-lv.on{border-color:#10b981;background:rgba(16,185,129,.08)}
.au-up{display:block;text-align:center;padding:12px;border-radius:12px;border:1.5px dashed rgba(16,150,100,.5);color:#0f8a5f;font-weight:700;cursor:pointer}.au-up.dis{opacity:.5;pointer-events:none}
.au-row{display:flex;gap:8px}.au-row>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.au-caps{max-height:300px;overflow:auto;border:1px solid rgba(127,127,127,.2);border-radius:12px;padding:4px}
.au-cap{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer}.au-cap.on{background:rgba(16,185,129,.1)}
.au-cap span{flex:1;min-width:0;font-size:14px}.au-cap small{flex:none;opacity:.6;font-size:12px}.au-cap input{flex:none;width:18px;height:18px}
.au-acoes{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px}
.au-prog{margin-top:6px;display:flex;flex-direction:column;gap:6px}.au-prog .au-pb{height:6px}.au-pb i{transition:width .8s}
.au-ger{cursor:default}.au-ger .au-n{background:rgba(250,204,21,.15);color:#b45309}
html.au-aberto,html.au-aberto body{overflow:hidden}
.aup{position:fixed;inset:0;z-index:10000;background:#0b1220;color:#e2e8f0;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);font-family:inherit}
.aup button{font:inherit;color:inherit}
.aup-top{display:flex;align-items:center;gap:10px;padding:10px 12px}
.aup-tt{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14px;line-height:1.25}.aup-tt b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aup-tt span{font-size:12px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aup-x,.aup-ix{flex:none;width:38px;height:38px;border-radius:50%;border:1px solid #1e293b;background:#111a2e;font-size:16px;cursor:pointer}
.aup-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px 14px;cursor:pointer}
.aup-vis{width:100%;max-width:880px;max-height:100%;overflow:auto;animation:auin .35s ease}
@keyframes auin{from{opacity:.25;transform:translateY(6px)}to{opacity:1;transform:none}}
.aup-cap{min-height:4.6em;padding:10px 18px 6px;font-size:17px;line-height:1.45;text-align:center;color:#f8fafc;max-width:880px;margin:0 auto;width:100%;box-sizing:border-box}.aup-cap .mut{color:#64748b}
.aup-prog{display:flex;gap:3px;padding:4px 14px}.aup-prog i{flex:1;height:4px;border-radius:2px;background:#1e293b;cursor:pointer}.aup-prog i.ok{background:#10b981}.aup-prog i.at{background:#38bdf8}
.aup-ctl{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 12px 14px}
.aup-ctl>button{width:46px;height:46px;border-radius:50%;border:1px solid #1e293b;background:#111a2e;font-size:17px;cursor:pointer}
.aup-ctl .aup-pp{width:60px;height:60px;background:#10b981;border-color:#10b981;color:#fff;font-size:22px}
.aup .aup-ctl select{-webkit-appearance:none;appearance:none;background:#111a2e!important;color:#e2e8f0!important;border:1px solid #1e293b!important;border-radius:10px;padding:9px 10px;font:inherit;font-size:13px;max-width:104px;height:auto;min-height:0;box-shadow:none}
.aup .aup-ctl>button,.aup .aup-x,.aup .aup-ix{display:grid;place-items:center;padding:0;color:#e2e8f0;box-shadow:none;min-height:0;min-width:0;flex:none;aspect-ratio:1}
.aup .auv-tab th,.aup .auv-ajt th{color:#7dd3fc!important;opacity:1;text-align:left!important;font-size:12px;text-transform:uppercase;letter-spacing:.04em;background:none}
.aup .auv-tab td,.aup .auv-ajt td{text-align:left!important;color:#e2e8f0;background:none}
.aup .auv-ajt tr.call td{background:rgba(239,68,68,.14)}.aup .auv-ajt td.pos{color:#4ade80}.aup .auv-ajt td.neg{color:#f87171}
.aup .auv-ajt td:nth-child(n+2),.aup .auv-ajt th:nth-child(n+2){text-align:right!important}
.aup-idx{position:absolute;left:0;right:0;bottom:0;top:58px;background:#0b1220f2;overflow:auto;padding:8px 12px calc(16px + env(safe-area-inset-bottom))}
.aup-idx button{display:flex;gap:10px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #1e293b;padding:12px 4px;cursor:pointer}.aup-idx span{color:#64748b;min-width:22px}.aup-idx .aup-del{color:#f87171;border-bottom:0;margin-top:10px}.aup-idx .aup-del span{color:#f87171}
.auv-svg{width:100%;height:auto;display:block;font-family:inherit}
.auv-grid{stroke:#1e293b;stroke-width:.25}.auv-ax{font-size:2.3px;fill:#94a3b8}.auv-lb{font-size:2.5px;fill:#e2e8f0;font-weight:600}.auv-st{font-size:2.3px;fill:#cbd5e1;text-anchor:middle}
.auv-nt{font-size:2.9px;fill:#f1f5f9;text-anchor:middle;font-weight:700}.auv-ns{font-size:2.1px;fill:#94a3b8;text-anchor:middle}
.auv-h2{font-size:clamp(17px,4.6vw,26px);font-weight:800;margin:0 0 12px;color:#f8fafc;letter-spacing:-.01em}
.auv-nota,.auv-fonte{font-size:12px;color:#94a3b8;margin-top:8px}
.auv-tit{text-align:center;padding:10px}.auv-kick{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#10b981;font-weight:800;margin-bottom:10px}
.auv-h{font-size:clamp(26px,7.5vw,46px);font-weight:900;line-height:1.08;letter-spacing:-.02em}.auv-sub{font-size:clamp(14px,3.8vw,19px);color:#94a3b8;margin-top:12px;line-height:1.4}
.auv-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:16px}.auv-chips span{border:1px solid #1e3a5f;background:#0f1d33;color:#7dd3fc;border-radius:999px;padding:5px 11px;font-size:13px}
.auv-top ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.auv-top li{display:flex;gap:12px;align-items:flex-start;opacity:.16;transition:opacity .45s,transform .45s;transform:translateX(-4px);font-size:clamp(15px,4vw,20px);line-height:1.35}
.auv-top li.on{opacity:1;transform:none}.auv-top li small{display:block;color:#94a3b8;font-size:.78em;font-weight:400;margin-top:2px}
.auv-top .ic{flex:none;width:30px;height:30px;border-radius:9px;background:#0f1d33;display:grid;place-items:center;font-size:16px}.auv-top .ic.dot:after{content:"";width:8px;height:8px;border-radius:50%;background:#10b981}
.auv-tab table,.auv-ajt{width:100%;border-collapse:collapse;font-size:clamp(12px,3.4vw,16px)}
.auv-tab th,.auv-ajt th{text-align:left;color:#7dd3fc;font-weight:700;padding:7px 6px;border-bottom:1px solid #1e3a5f}
.auv-tab td,.auv-ajt td{padding:7px 6px;border-bottom:1px solid #1e293b;vertical-align:top}.auv-tab td.r{color:#94a3b8;font-weight:600}
.auv-tab tbody tr{opacity:.12;transition:opacity .45s}.auv-tab tbody tr.on{opacity:1}
.auv-ajc{font-size:13px;color:#94a3b8;margin:-6px 0 8px}
.auv-ajt{font-size:12.5px;margin-top:8px;font-variant-numeric:tabular-nums}.auv-ajt td{padding:4px 5px}.auv-ajt .pos{color:#4ade80}.auv-ajt .neg{color:#f87171}.auv-ajt tr.call td{background:rgba(239,68,68,.12)}.auv-ajt small{display:block;color:#fca5a5;font-size:11px}
.auv-for{text-align:center}.auv-f{font-size:clamp(18px,5vw,28px);font-weight:800;background:#0f1d33;border:1px solid #1e3a5f;border-radius:14px;padding:16px 12px;color:#7dd3fc;margin-bottom:14px;font-variant-numeric:tabular-nums}
.auv-fl{font-size:clamp(14px,3.8vw,19px);padding:5px 0;opacity:.14;transition:opacity .45s;font-variant-numeric:tabular-nums}.auv-fl.on{opacity:1}.auv-fl.forte{font-weight:800;color:#facc15}
.auv-q{text-align:center;padding:6px}.auv-qq{font-size:clamp(19px,5.2vw,30px);font-weight:800;line-height:1.25}
.auv-qa{margin-top:20px;font-size:clamp(15px,4.2vw,21px);color:#4ade80;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:14px;opacity:0;transform:translateY(6px);transition:all .5s}.auv-qa.on{opacity:1;transform:none}
.auv-wait{display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;text-align:center;min-height:160px;border:1px dashed #1e3a5f;border-radius:14px;padding:16px;color:#94a3b8}.auv-wait b{color:#e2e8f0}

.au-video{max-width:960px;overflow:hidden}.auyt{position:relative;min-height:min(62dvh,560px);border:1px solid #1e3a5f;border-radius:24px;overflow:hidden;background:radial-gradient(circle at 18% 18%,rgba(56,189,248,.22),transparent 34%),radial-gradient(circle at 82% 30%,rgba(16,185,129,.18),transparent 35%),linear-gradient(135deg,#08111f,#0f172a 58%,#050816);box-shadow:0 22px 70px rgba(0,0,0,.38);isolation:isolate}
.auyt:before{content:"";position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 0 22%,rgba(255,255,255,.07) 24%,transparent 28% 52%,rgba(125,211,252,.08) 55%,transparent 62%);transform:translateX(calc((var(--step,0) - 4)*3%));opacity:.8;pointer-events:none;animation:auytmove 9s linear infinite}
.auyt-bg{position:absolute;inset:0;overflow:hidden;z-index:-1}.auyt-bg span{position:absolute;font-size:clamp(88px,24vw,230px);font-weight:900;line-height:1;color:rgba(255,255,255,.035);filter:blur(.3px);transform:rotate(-12deg)}.auyt-bg span:nth-child(1){left:-3%;top:8%}.auyt-bg span:nth-child(2){right:-4%;bottom:1%;transform:rotate(13deg)}.auyt-bg span:nth-child(3){left:45%;top:45%;font-size:clamp(42px,13vw,120px);opacity:.7;transform:rotate(4deg)}
.auyt-head{display:flex;justify-content:space-between;gap:10px;padding:14px 16px 0;color:#7dd3fc;font-size:11px;letter-spacing:.13em;text-transform:uppercase}.auyt-head em{font-style:normal;color:#34d399;background:rgba(16,185,129,.11);border:1px solid rgba(52,211,153,.24);border-radius:999px;padding:4px 9px;letter-spacing:.08em}
.auyt-body{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:18px;padding:18px 18px 14px;align-items:stretch;min-height:430px}.auyt-main{min-width:0;display:flex;align-items:center;justify-content:center;padding:10px}.auyt-main>*{width:100%;animation:auytpop .38s ease}.auyt-side{display:flex;flex-direction:column;gap:10px;align-self:stretch;border-left:1px solid rgba(148,163,184,.18);padding-left:16px;color:#e2e8f0}.auyt-thumb{height:118px;border-radius:18px;display:grid;place-items:center;font-size:54px;background:linear-gradient(135deg,rgba(56,189,248,.18),rgba(16,185,129,.16));border:1px solid rgba(125,211,252,.2);box-shadow:inset 0 1px 18px rgba(255,255,255,.04)}.auyt-side strong{font-size:18px;line-height:1.12}.auyt-side small{color:#94a3b8}.auyt-bars{height:54px;display:flex;align-items:end;gap:3px;margin:2px 0}.auyt-bars i{flex:1;border-radius:5px 5px 1px 1px;background:linear-gradient(#22c55e,#0891b2);opacity:.86;animation:auytbar 1.6s ease-in-out infinite alternate}.auyt-card{display:block;border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:9px 10px;background:rgba(15,23,42,.72);font-size:12px;color:#cbd5e1}.auyt-card.c0{color:#fff;font-weight:800}.auyt-card.c1{color:#7dd3fc}.auyt-card.c2{color:#34d399}
.auyt-lower{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 18px 16px;padding:10px 12px;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:rgba(2,6,23,.68);backdrop-filter:blur(10px);font-size:12px;color:#cbd5e1}.auyt-lower span:first-child{color:#34d399;font-weight:800}.auyt-lower span:nth-child(2){flex:1;text-align:center;color:#f8fafc}.auyt-lower span:last-child{font-variant-numeric:tabular-nums;color:#94a3b8}
.auyt-1{background:radial-gradient(circle at 20% 10%,rgba(250,204,21,.18),transparent 33%),linear-gradient(135deg,#09111f,#162033 58%,#050816)}.auyt-2{background:radial-gradient(circle at 75% 20%,rgba(239,68,68,.18),transparent 33%),linear-gradient(135deg,#0e1116,#182032 58%,#050816)}.auyt-3{background:radial-gradient(circle at 18% 72%,rgba(168,85,247,.18),transparent 35%),linear-gradient(135deg,#08111f,#111827 58%,#050816)}.auyt-4{background:radial-gradient(circle at 55% 16%,rgba(20,184,166,.20),transparent 33%),linear-gradient(135deg,#07131d,#13233a 58%,#050816)}.auyt-5{background:radial-gradient(circle at 25% 20%,rgba(59,130,246,.20),transparent 34%),linear-gradient(135deg,#06111e,#102030 58%,#050816)}
@keyframes auytmove{to{transform:translateX(8%)}}@keyframes auytpop{from{opacity:.3;transform:scale(.985) translateY(8px)}to{opacity:1;transform:none}}@keyframes auytbar{to{opacity:.45;transform:scaleY(.72)}}
@media(max-width:760px){.auyt{min-height:min(66dvh,620px);border-radius:20px}.auyt-body{grid-template-columns:1fr;gap:10px;min-height:0;padding:12px}.auyt-main{padding:2px}.auyt-side{border-left:0;border-top:1px solid rgba(148,163,184,.18);padding:10px 0 0;display:grid;grid-template-columns:82px 1fr;align-items:center}.auyt-thumb{height:72px;border-radius:14px;font-size:34px;grid-row:span 3}.auyt-bars,.auyt-card.c1,.auyt-card.c2{display:none}.auyt-side strong{font-size:14px}.auyt-lower{margin:0 12px 12px;font-size:11px}.auyt-lower span:nth-child(2){display:none}.aup-stage{padding:4px 8px}.aup-cap{font-size:16px}}

@media (orientation:landscape) and (max-height:520px){.aup-top{padding:4px 10px}.aup-cap{min-height:2.9em;font-size:15px;padding:4px 14px}.aup-ctl{padding:4px 10px 6px}.aup-ctl>button{width:38px;height:38px}.aup-ctl .aup-pp{width:46px;height:46px}.auv-h2{margin-bottom:6px}}
`;
const st=document.createElement('style');st.id='aulas-css';st.textContent=css;document.head.appendChild(st);
window.AULAS={abre,carregaLista,VIS,calcAjuste,_dbg:{cena,P,falasCena}};
})();

;
/* módulo: adr-abertura.js */
/* Abertura teórica na B3 quando a B3 está fechada (feriado) e Nova York abre.
   Ação local ≈ ADR × dólar, então a variação esperada é (1 + var. ADR) × (1 + var. dólar) − 1.
   O mesmo vale para o Ibovespa via EWZ. Base: último fechamento da B3. Estimativa, não cotação. */
(function(){
'use strict';
if(typeof adrHtml!=='function')return;
const MAPA={PBR:'PETR3','PBR.A':'PETR4','PBR-A':'PETR4',VALE:'VALE3',ITUB:'ITUB4',BBD:'BBDC4',BBDO:'BBDC3',ABEV:'ABEV3',BSBR:'SANB11',SBS:'SBSP3',ERJ:'EMBJ3',EMBJ:'EMBJ3',GGB:'GGBR4',SID:'CSNA3',CIG:'CMIG4',ELP:'CPLE6',UGP:'UGPA3',SUZ:'SUZB3',BAK:'BRKM5',TIMB:'TIMS3',VIV:'VIVT3',EBR:'ELET3','EBR.B':'ELET6','EBR-B':'ELET6',CSAN:'CSAN3',BDORY:'BBAS3',EWZ:'IBOV'};
const S={ts:0,busy:0,dados:null,err:''};
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pc=v=>(v>0?'+':'')+nf(v,2)+'%',cor=v=>v>0.05?'g':v<-0.05?'r':'mut';
const diaBR=t=>new Date((t-3*3600)*1000).toISOString().slice(0,10);
const hojeBR=()=>new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
async function velas(ativo){const r=await rq('/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo,intervalo:'1d'}),signal:AbortSignal.timeout(20000)});const j=await r.json();return(j.candles||[]).filter(x=>x&&isFinite(x[4]))}
async function load(){
  if(Date.now()-S.ts<300000&&S.adrTs===AD.data?.ts)return;
  if(window.DIARIO_DEMO||typeof SESS==='undefined'||!SESS?.at)return;
  const itens=(AD.data&&AD.data.itens)||[];if(!itens.length)return;
  S.busy=1;S.err='';const adrTs=AD.data?.ts;
  try{
    const [ibov,dol]=await Promise.all([velas('IBOV'),velas('USDBRL')]);
    if(ibov.length<2||dol.length<2)throw new Error('Sem histórico do Ibovespa ou do dólar.');
    const ultB3=diaBR(ibov[ibov.length-1][0]);
    // dólar: variação do dia em relação ao fechamento do dia do último pregão da B3
    const dBase=[...dol].reverse().find(x=>diaBR(x[0])<=ultB3),dHoje=dol[dol.length-1];
    if(!dBase||!(dBase[4]>0)||!(dHoje[4]>0))throw new Error('Sem câmbio válido na data-base da B3.');
    const usd=diaBR(dHoje[0])>ultB3?(dHoje[4]/dBase[4]-1)*100:0;
    const linhas=[];
    const groups=itens.filter(row=>MAPA[String(row.s).toUpperCase()]);
    for(let i=0;i<groups.length;i+=3)await Promise.all(groups.slice(i,i+3).map(async row=>{
      const loc=MAPA[String(row.s).toUpperCase()];if(!loc)return;
      const v=window.TraderAdr.view(row),adr=v.regular&&v.regular.chp;if(typeof adr!=='number'||!Number.isFinite(adr))return;
      let base=null;
      if(loc==='IBOV')base=ibov[ibov.length-1][4];
      else{try{const c=await velas(loc);const u=[...c].reverse().find(x=>diaBR(x[0])<=ultB3);base=u?u[4]:null}catch{}}
      const varp=((1+adr/100)*(1+usd/100)-1)*100;
      linhas.push({adr:row.s,loc,adrp:adr,varp,base,teo:base?base*(1+varp/100):null});
    }));
    linhas.sort((a,b)=>itens.findIndex(x=>x.s===a.adr)-itens.findIndex(x=>x.s===b.adr));
    S.dados={ultB3,usd,dolar:dHoje[4],linhas,b3Fechada:ultB3<hojeBR()&&new Date().getUTCDay()%6!==0};S.ts=Date.now();S.dataTs=S.ts;S.adrTs=adrTs;
  }catch(e){S.err=String(e.message||e);S.ts=Date.now()}
  S.busy=0;if(typeof adrPaint==='function')adrPaint();
}
function carrega(){if(S.job)return S.job;S.job=load().finally(()=>{S.job=null});return S.job}
function abHtml(){
  setTimeout(carrega,0);
  const d=S.dados;
  if(!d)return`<div class="adr-ab card-sub"><b>Abertura teórica na B3</b><p class="sm mut">${S.busy?'Calculando…':S.err?h(S.err):'Calcula quando as ADRs carregarem (precisa estar logado).'}</p></div>`;
  const [,m,dd]=d.ultB3.split('-');
  const tab=d.linhas.map(l=>`<tr><td><b>${h(l.loc==='IBOV'?'Ibovespa':l.loc)}</b><small>${h(l.adr)} ${pc(l.adrp)}</small></td><td>${l.base?nf(l.base,l.loc==='IBOV'?0:2):'—'}</td><td class="${cor(l.varp)}"><b>${l.teo?pc(l.varp):'—'}</b></td><td>${l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—'}</td></tr>`).join('');
  return`<div class="adr-ab"><div class="adr-ab-top"><b>Abertura teórica na B3</b>${'<span class="adr-ab-tag">Estimativa · base '+dd+'/'+m+'</span>'}</div>
<p class="sm mut">Referência indicativa para o próximo pregão, sem prever o leilão de abertura: variação da ADR × variação do dólar (${pc(d.usd)}, R$ ${nf(d.dolar,4)}) sobre o fechamento da B3 em ${dd}/${m}.</p>
<div class="adr-ab-tab"><table><thead><tr><th>Ativo</th><th>Fech. B3</th><th>Var. esperada</th><th>Abertura teórica</th></tr></thead><tbody>${tab||'<tr><td colspan="4" class="mut">Nenhuma ADR da lista tem ação correspondente mapeada.</td></tr>'}</tbody></table></div>
<p class="sm mut">Conta: (1 + var. ADR) × (1 + var. dólar) − 1. Usa o pregão regular de Nova York; pós-mercado, notícias e o leilão de abertura podem mudar o preço. Ibovespa estimado pelo EWZ. Não é cotação.</p></div>`;
}

// Integra a estimativa no mesmo fluxo de desenho, imediatamente depois das ADRs.
function imageHeight(){return S.dados?.linhas.length?156+S.dados.linhas.slice(0,12).length*58:0}
function drawImage(ctx,width,y){
 const d=S.dados,L=d?.linhas.slice(0,12)||[];if(!L.length)return 0;
 const M=36,H=imageHeight(),top=y+48,boxH=40+L.length*58;
 ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#e2e8f0';ctx.font='700 30px system-ui';ctx.fillText('Abertura teórica na B3',48,y+30);
 ctx.textAlign='right';ctx.fillStyle='#a8b5c5';ctx.font='22px system-ui';ctx.fillText('Estimativa · base '+d.ultB3.slice(8)+'/'+d.ultB3.slice(5,7),width-48,y+30);
 ctx.fillStyle='#0d1b28';ctx.strokeStyle='#24313e';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(M,top,width-2*M,boxH,18);ctx.fill();ctx.stroke();
 const cols=[60,560,760,width-60];ctx.font='20px system-ui';ctx.fillStyle='#a8b5c5';
 ['Ativo / ADR','Fech. B3','Variação est.','Preço teórico'].forEach((t,i)=>{ctx.textAlign=i?'right':'left';ctx.fillText(t,cols[i],top+28)});
 L.forEach((l,k)=>{const yy=top+66+k*58;
  if(k){ctx.strokeStyle='#24313e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(56,yy-34);ctx.lineTo(width-56,yy-34);ctx.stroke()}
  ctx.textAlign='left';ctx.font='700 26px system-ui';ctx.fillStyle='#e2e8f0';ctx.fillText(l.loc==='IBOV'?'Ibovespa':l.loc,60,yy);ctx.font='18px system-ui';ctx.fillStyle='#a8b5c5';ctx.fillText(l.adr+' '+pc(l.adrp),60,yy+20);
  ctx.textAlign='right';ctx.font='24px system-ui';ctx.fillStyle='#e2e8f0';ctx.fillText(l.base?nf(l.base,l.loc==='IBOV'?0:2):'—',cols[1],yy);
  ctx.font='700 26px system-ui';ctx.fillStyle=l.teo?(l.varp>0.05?'#22c55e':l.varp<-0.05?'#f87171':'#a8b5c5'):'#a8b5c5';ctx.fillText(l.teo?pc(l.varp):'—',cols[2],yy);
  ctx.fillStyle='#e2e8f0';ctx.fillText(l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—',cols[3],yy);
 });
 ctx.textAlign='left';ctx.fillStyle='#a8b5c5';ctx.font='20px system-ui';ctx.fillText('ADR regular × dólar ('+pc(d.usd)+') · referência, não é preço de leilão.',48,top+boxH+30,width-96);
 ctx.fillText((S.err?'Falha na atualização · cópia anterior. ':'Consulta: ')+new Date(S.dataTs).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' · pós-mercado não incluído.',48,top+boxH+56,width-96);
 return H;
}
window.TraderPreOpen={height:imageHeight,draw:drawImage,prepare:carrega};
if(typeof imgDados==='function'){const original=imgDados;imgDados=async function(){await original.apply(this,arguments);S.ts=0;await carrega()}}
setTimeout(carrega,6000);setInterval(()=>{if(!document.hidden)carrega()},300000);
const o=adrHtml;adrHtml=function(){return o.apply(this,arguments)+abHtml()};
const st=document.createElement('style');st.textContent=`.adr-ab{margin-top:14px;padding-top:12px;border-top:1px solid rgba(127,127,127,.2)}.adr-ab-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.adr-ab-tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(250,204,21,.18);color:#b45309}.adr-ab-tab{overflow-x:auto;margin:8px 0}.adr-ab table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}.adr-ab th{text-align:left;font-size:11px;opacity:.65;padding:6px 4px;border-bottom:1px solid rgba(127,127,127,.25)}.adr-ab td{padding:7px 4px;border-bottom:1px solid rgba(127,127,127,.12)}.adr-ab td small{display:block;opacity:.6;font-size:11px}.adr-ab td:nth-child(n+2),.adr-ab th:nth-child(n+2){text-align:right}`;document.head.appendChild(st);
})();

;
/* módulo: terminal-radar.js */
/* Radar integrado: reutiliza o cache e o ciclo de atualização do Terminal. */
(function(){
 'use strict';
 const a=window.TRM;if(!a)return;
 const safe=x=>a.esc2(String(x??'')),finite=x=>typeof x==='number'&&Number.isFinite(x);
 const number=(v,d=2)=>finite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const percent=v=>finite(v)?(v>0?'+':'')+number(v)+'%':'—';
 const time=v=>v&&Number.isFinite(new Date(v).getTime())?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'não informado';
 const normalized=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const quotes=[['CME_MINI:NQ1!','Nasdaq futuro',2],['CME_MINI:ES1!','S&P 500 futuro',2],['BMFBOVESPA:WIN1!','Mini índice · WIN',0],['BMFBOVESPA:WDO1!','Mini dólar · WDO',1],['FX_IDC:USDBRL','Dólar / real',4],['TVC:DXY','DXY',2],['TVC:VIX','VIX',2],['TVC:US10Y','Treasury 10 anos',3]];
 const params={s:quotes.map(x=>x[0])};
 let dialog=null,trigger=null,loadedUser=null,scheduled=false;
 function label(id,w){return ({global:'Radar Global',dt:'Fluxo e Day Trade',macro:'Juros e Macroeconomia',ia:'Central de Inteligência'})[id]||w.n||id}
 function sorted(){const priority=['global','dt','macro','ia'];return Object.entries(a.TS().wss).sort((x,y)=>{const rank=k=>priority.includes(k)?priority.indexOf(k):99;return rank(x[0])-rank(y[0])})}
 function key(){return 'diario-terminal-resume-v306-'+(typeof SESS!=='undefined'&&SESS?.uid||'local')}
 function remember(){
  if(typeof tab!=='undefined'&&tab!=='term')return;
  const s=a.TS();s.resume={ws:s.ws,mob:a.TR.mob,foco:a.TR.foco};
  try{localStorage.setItem(key(),JSON.stringify(s.resume))}catch{}
 }
 function prepare(){
  const s=a.TS();
  if(!s.wss.global)s.wss.global={n:'Radar Global',p:['GLOBAL','DIFUT','ECO','NEWSBR'],t:[['GLOBAL','WEI','FX','CMDTY','ADR'],['DIFUT','WIRP','GC'],['ECO','EVT'],['NEWSBR','NEWSUS','TOP']],g:[{x:0,y:0,w:7,h:15},{x:7,y:0,w:5,h:15},{x:0,y:15,w:5,h:13},{x:5,y:15,w:7,h:13}]};
  if(loadedUser===key())return;loadedUser=key();
  let last=s.resume;try{last=JSON.parse(localStorage.getItem(key())||'null')||last}catch{}
  if(last&&s.wss[last.ws]){s.ws=last.ws;const max=s.wss[last.ws].p.length-1;const clamp=v=>Number.isInteger(v)?Math.max(0,Math.min(max,v)):0;a.TR.mob=clamp(last.mob);a.TR.foco=clamp(last.foco)}
 }
 function note(state,ttl){return `<div class="trfont">Consulta: ${safe(time(state.v?.em))} · ${state.err?'Falha na atualização · cópia anterior':!state.v?'Aguardando fonte':Date.now()-state.ts>ttl*2?'Consulta antiga':'Atualização automática'}${state.err?' · '+safe(state.err):''}. Horários em Brasília.</div>`}
 a.FN.GLOBAL='Radar Global · futuros, dólar e contexto do pregão';
 a.EXT.GLOBAL={livre:true,vivo:true,load:async()=>{if(!document.hidden)await a.trFn('cot',params,30000)},body:()=>{
  const state=a.trGet('cot',params),rows=state.v?.itens||[];
  const cards=quotes.map(([symbol,name,dp])=>{
   const q=rows.find(x=>x.pedido===symbol||x.s===symbol)||{};
   const local=/WIN1!/.test(symbol)?'WINFUT':/WDO1!/.test(symbol)?'WDOFUT':null;
   const current=a.melhorPx(local||symbol,q,q.r)||{};
   const bridge=local?a.profitDe?.(local):null;
   const px=finite(current.px)?current.px:q.px,d1=finite(current.px)?current.d1:q.d1;
   return `<article class="radar-quote"><span>${safe(name)}</span><strong>${number(px,dp)}</strong><b class="${finite(d1)?d1>0?'tg':d1<0?'tr':'':''}">${percent(d1)}</b><small>${safe(current.fonte||q.fonte||'TradingView')} · ${safe(current.fonte==='Profit'?(current.rt?'recebimento recente':'sem recebimento recente'):q.atraso===false?'tempo real na fonte':q.atraso?'com atraso':'atraso não confirmado')}<br>Preço: ${safe(current.fonte==='Profit'?bridge?.dat?bridge.dat+' '+(bridge.hor||''):'horário do negócio não informado':time(q.horarioPreco||q.dado_em))}${current.fonte==='Profit'?'<br>Recebido: '+safe(time(current.ts)):q.snapshot?'<br>Cópia do servidor':''}</small></article>`;
  }).join('');
  return `<div class="trsec">Brasil e EUA · radar de acompanhamento</div><div class="radar-quotes">${cards}</div><p class="trnote">Nasdaq futuro é a referência do mercado futuro; USTEC/NAS100 da sua corretora pode ter preço diferente. WIN/WDO usam a ponte quando há dado válido.</p>${note(state,30000)}`;
 }};
 a.FN.DIFUT='DI Futuros · curva, variação em pontos-base e referência oficial';
 a.EXT.DIFUT={livre:true,vivo:true,load:async()=>{if(!document.hidden)await a.trFn('copom',{},60000)},body:()=>{
  const state=a.trGet('copom',{}),d=state.v;
  if(!d)return a.carregando(state.err||'Consultando curva DI…');
  const curve=d.curva||[];
  return `<div class="trsec">DI Futuros · curva de juros</div><p class="trnote">Selic ${number(d.selic)}% · CDI ${number(d.cdi)}% · ref. ${safe(d.cdi_ref||'não informada')}</p>`+a.tabela(['Contrato','Taxa a.a.','Δ pb','Preço em'],curve.map(q=>`<tr><td>${safe(q.cod)}</td><td class="num">${number(q.taxa)}%</td><td class="num ${q.var_pb>0?'tr':q.var_pb<0?'tg':''}">${finite(q.var_pb)?(q.var_pb>0?'+':'')+number(q.var_pb,0):'—'}</td><td>${safe(time(q.horarioPreco))}</td></tr>`),'di-radar')+(!curve.length?'<p class="trnote">Curva indisponível. Nenhuma taxa foi estimada.</p>':'')+`<p class="trnote">${safe(d.fonte||'')}${(d.avisos||[]).map(x=>'<br>'+safe(x)).join('')}</p>`+note(state,60000);
 }};
 for(const [cmd,query,title]of [['NEWSBR','Brasil Ibovespa dólar economia','Notícias · Brasil'],['NEWSUS','United States Nasdaq Federal Reserve markets','Notícias · EUA e mundo']]){
  const args={q:query};a.FN[cmd]=title;
  a.EXT[cmd]={livre:true,vivo:true,load:async()=>{if(!document.hidden)await a.trFn('noticias',args,180000)},body:()=>{
   const state=a.trGet('noticias',args),items=state.v?.itens||[],seen=new Set();
   const news=items.filter(n=>{const k=normalized(n.t).replace(/[^a-z0-9]/g,'');if(seen.has(k))return false;seen.add(k);return true}).slice(0,30);
   return `<div class="trsec">${title}</div>`+news.map(n=>{let url='#';try{const u=new URL(n.l||n.u||n.url||n.link);if(/^https?:$/.test(u.protocol))url=u.href}catch{}return `<article class="radar-news"><a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(n.t)}</a><small>${safe(n.f)} · ${safe(time(n.d))}</small></article>`}).join('')+(!news.length?a.carregando(state.err||'Consultando notícias…'):'')+note(state,180000);
  }};
 }
 function close(){if(dialog?.open)dialog.close()}
 function choose(id){const select=document.querySelector('[data-trlay]');close();if(!select)return;select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));remember()}
 function openPicker(){
  trigger=document.querySelector('[data-radar-picker]');dialog?.remove();dialog=document.createElement('dialog');dialog.className='radar-picker';dialog.setAttribute('aria-label','Selecionar painel do Terminal');
  const head=document.createElement('header'),title=document.createElement('strong'),exit=document.createElement('button');title.textContent='Selecionar painel';exit.type='button';exit.textContent='Fechar';exit.addEventListener('click',close);head.append(title,exit);
  const search=document.createElement('input');search.type='search';search.placeholder='Pesquisar painéis…';search.setAttribute('aria-label','Pesquisar painéis');
  const list=document.createElement('div');list.className='radar-picker-list';
  function draw(){list.replaceChildren();const q=normalized(search.value);for(const [id,w]of sorted()){if(!normalized(label(id,w)+' '+w.p.join(' ')).includes(q))continue;const b=document.createElement('button');b.type='button';b.textContent=label(id,w);b.setAttribute('aria-current',String(id===a.TS().ws));b.addEventListener('click',()=>choose(id));list.append(b)}if(!list.children.length){const p=document.createElement('p');p.textContent='Nenhum painel encontrado.';list.append(p)}const add=document.createElement('button');add.type='button';add.textContent='+ Novo espaço';add.addEventListener('click',()=>choose('__novo'));list.append(add)}
  search.addEventListener('input',draw);dialog.addEventListener('click',e=>{if(e.target===dialog)close()});dialog.addEventListener('close',()=>trigger?.isConnected&&trigger.focus());dialog.append(head,search,list);document.body.append(dialog);draw();dialog.showModal();search.focus();
 }
 function mount(){
  if(!document.body.classList.contains('trmon')){close();return}
  const select=document.querySelector('[data-trlay]');if(!select)return;
  // O select fica como adaptador dos eventos existentes; o menu visível é sólido e pesquisável.
  select.hidden=true;select.style.display='none';let b=select.parentNode.querySelector('[data-radar-picker]');
  if(!b){b=document.createElement('button');b.type='button';b.className='trbtn radar-picker-trigger';b.dataset.radarPicker='';b.setAttribute('aria-haspopup','dialog');b.addEventListener('click',openPicker);select.after(b)}
  b.textContent=label(a.TS().ws,a.TS().wss[a.TS().ws])+' ▾';remember();
 }
 if(typeof render0==='function'){const original=render0;render0=function(){if(tab==='term')prepare();return original.apply(this,arguments)}}
 if(window.TraderUI?.onRender)window.TraderUI.onRender('terminal-radar',mount);
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-trmob],[data-trp]'))requestAnimationFrame(remember)});
 addEventListener('pagehide',remember);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){remember();return}if(typeof tab!=='undefined'&&tab==='term')a.layAtual().p.forEach((_,i)=>a.carrega(i))});
 const style=document.createElement('style');style.textContent=`.radar-picker{box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:80dvh;margin:auto;padding:16px;border:1px solid #344256;border-radius:16px;background:#101820!important;color:#e5edf5!important;box-shadow:0 20px 80px #0009;backdrop-filter:none!important;font:14px system-ui}.radar-picker::backdrop{background:#0009}.radar-picker header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.radar-picker input{box-sizing:border-box;width:100%;background:#08111c;color:#e5edf5;border:1px solid #344256;border-radius:8px;padding:12px;font:16px system-ui}.radar-picker button{color:#e5edf5;background:#182433;border:1px solid #344256;border-radius:8px;padding:10px 12px;min-height:44px;cursor:pointer;font:14px system-ui}.radar-picker-list{display:grid;gap:6px;max-height:55dvh;overflow-y:auto;margin-top:10px}.radar-picker-list button{text-align:left}.radar-picker-list button[aria-current=true]{border-color:#25bf80;background:#123328}.radar-picker button:focus-visible,.radar-picker input:focus-visible{outline:2px solid #25bf80;outline-offset:2px}.radar-picker-trigger{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.radar-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}.radar-quote{display:grid;gap:5px;background:#101820;border:1px solid #2a3544;border-radius:8px;padding:12px;color:#e5edf5;min-width:0}.radar-quote strong{font-size:23px;font-variant-numeric:tabular-nums}.radar-quote small,.radar-news small{color:#a1adbd;font:11px/1.5 system-ui}.radar-news{padding:12px;border-bottom:1px solid #303030}.radar-news a{color:#e5edf5;text-decoration:none;font:14px/1.5 system-ui}.radar-news small{display:block;margin-top:5px}@media(min-width:1400px){.radar-quotes{grid-template-columns:repeat(4,minmax(0,1fr))}}`;document.head.append(style);
 window.TraderRadar={prepare,mount,remember,openPicker,quotes};
})();

;
/* módulo: design-profissional.js */
/* v307 — apresentação, sem alterar registros, regras ou integrações. */
(function(root){
 'use strict';
 const doc=root.document;
 const make=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 function greeting(hour){return hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite'}
 function intro(){
  const header=make('header','studio-intro');header.id='studio-intro';
  const top=make('div','studio-intro-top');
  const date=make('span','studio-eyebrow',new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long',day:'2-digit',month:'long'}));
  const tools=make('div','studio-intro-tools');
  const search=make('button','studio-tool','Buscar');search.type='button';search.dataset.wf='search';search.setAttribute('aria-label','Buscar no aplicativo');
  const preferences=make('button','studio-tool','Personalizar');preferences.type='button';preferences.dataset.wf='organize-home';
  tools.append(search,preferences);top.append(date,tools);
  const hour=Number(new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  header.append(top,make('p','studio-greeting',greeting(hour)),make('h1','','Seu processo, em foco.'),make('p','studio-intro-copy','Prepare o dia, acompanhe o mercado e registre suas decisões.'));
  return header;
 }
 function shortcuts(){
  const section=make('section','studio-shortcuts');section.id='studio-shortcuts';section.setAttribute('aria-label','Acessos rápidos');
  // Ícones mantêm o sistema vetorial existente; os nomes permanecem visíveis.
  for(const [route,title,subtitle,icon] of [['term','Terminal','Seu radar de mercado','chart'],['carteiras','Carteiras','Posições e patrimônio','wallet'],['estudos','Estudos','Seu espaço de evolução','book']]){
   const button=make('button','studio-shortcut');button.type='button';button.dataset.navroute=route;
   const symbol=make('span','studio-shortcut-icon');symbol.setAttribute('aria-hidden','true');
   if(typeof root.icoSvg==='function')symbol.innerHTML=root.icoSvg(icon);
   button.append(symbol,make('b','',title),make('small','',subtitle));section.append(button);
  }
  return section;
 }
 function tabs(scope){
  scope.querySelectorAll('.pro-tabs,.pro-subtabs,.pftabs,.cqtabs,.seg:not(.hub),.rs-tabs').forEach(row=>{
   row.classList.add('studio-tabs');
   for(const button of row.querySelectorAll('button')){
    const selected=button.classList.contains('on')||button.getAttribute('aria-current')==='page';
    if(selected)button.setAttribute('aria-current','page');
    else if(button.getAttribute('aria-current')==='page')button.removeAttribute('aria-current');
   }
  });
 }
 function decorate(){
  const app=doc.getElementById('app');if(!app)return;
  doc.body.classList.add('studio-design');doc.body.classList.toggle('studio-home',tab==='home');
  if(tab==='home'){
   let header=app.querySelector('#studio-intro');if(!header){header=intro();app.prepend(header)}
   let links=app.querySelector('#studio-shortcuts');if(!links){links=shortcuts();header.after(links)}
   const routine=app.querySelector('.routine-card');if(routine){
    links.after(routine);routine.classList.add('studio-routine');
    const eyebrow=routine.querySelector('.routine-eyebrow');if(eyebrow)eyebrow.textContent='SEU PROCESSO';
    const title=routine.querySelector('#routine-title');if(title)title.textContent='Preparação e revisão';
    if(!routine.querySelector('.studio-routine-action')){const action=make('button','btn studio-routine-action','Abrir meu dia →');action.type='button';action.dataset.routine='pre';routine.append(action)}
   }
  }
  tabs(app);
  const nav=doc.querySelector('body > nav');if(nav)nav.setAttribute('aria-label','Navegação principal');
 }
 function sheet(){const box=doc.getElementById('sh');if(box)tabs(box)}
 root.TraderUI.onRender('design-profissional',decorate);root.TraderUI.onSheet('design-profissional',sheet);
 root.TraderDesign=Object.freeze({decorate,greeting});decorate();
})(window);

;
/* módulo: plataforma-acabamento.js */
/* v308: navegação e leitura comuns às áreas internas, sem novos níveis de abas. */
(function(root){
 'use strict';
 const areas=[
  [['dia','regras','rev'],'Diário e processo'],
  [['ops','trades','swing','opc','stats','ativos','dash','opgrade','opfluxo','opcart','swbt','dtrpy'],'Operações e desempenho'],
  [['carteiras','analise','imposto'],'Patrimônio e pesquisa'],
  [['mercado','juros','live','graf'],'Mercado e contexto'],
  [['estudos','livro','ingles','cnpi'],'Estudos e formação'],
  [['mesa','painel','contratos','carreira'],'Gestão e risco'],
  [['mais','conta','import','status'],'Configurações e dados']
 ];
 function decorate(){
  const app=document.getElementById('app');if(!app)return;
  const area=areas.find(([keys])=>keys.includes(tab))?.[1];
  document.body.dataset.platformArea=area||'';
  if(area&&tab!=='home'&&tab!=='term'&&!app.querySelector('.platform-area')){
   const header=document.createElement('div');header.className='platform-area';
   const label=document.createElement('p');label.textContent='DIÁRIO DE TRADER / '+area;const search=document.createElement('button');search.type='button';search.dataset.wf='search';search.textContent='Buscar';search.setAttribute('aria-label','Buscar no aplicativo');header.append(label,search);app.prepend(header);
  }
  for(const row of app.querySelectorAll('.pftabs,.pro-tabs,.pro-subtabs,.cqtabs,.rs-tabs,.seg:not(.hub)')){
   row.classList.add('studio-tabs');if(!row.getAttribute('aria-label'))row.setAttribute('aria-label','Navegação - '+(area||'Aplicativo'));
  }
  document.getElementById('bnav')?.setAttribute('aria-label','Navegação principal');
 }
 root.TraderUI.onRender('plataforma-acabamento',decorate);decorate();
})(window);

;
/* módulo: exports-profissionais.js */
/* v308 — identidade de PDFs vetoriais e imagens de compartilhamento.
   As fontes, fórmulas e opções de privacidade continuam nos módulos originais. */
(function(root){
 'use strict';
 const PDF={tx:'#203247',mut:'#536575',bd:'#d8e1e9',bg:'#f4f7fa',ac:'#087c55',dk:'#0b1b2b',g:'#087c55',r:'#bd343b',am:'#946100',bl:'#35669a',wh:'#ffffff',g2:'#e4f4ec',r2:'#fcebed',am2:'#fff3d5',bl2:'#eaf1f8',cz:'#f1f5f8',li:'#b6e7d4',li2:'#b7c8d8'};
 const IMAGE={bg:'#0b1119',card:'#121c28',raised:'#182535',line:'#293848',tx:'#edf3f8',mut:'#a0b0c2',ac:'#36d998',g:'#36d998',r:'#ff858c',am:'#f0b429'};
 const finite=x=>typeof x==='number'&&Number.isFinite(x),num=(x,d=2)=>finite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const pc=x=>finite(x)?(x>0?'+':'')+num(x)+'%':'—';
 const stack='system-ui,-apple-system,"Segoe UI",Arial,sans-serif';
 function footer(p){
  const active=p.pg,pages=p.doc.getPages();
  pages.forEach((page,i)=>{
   p.pg=page;const C=p.C;
   p.rect(0,p.H-55,p.W,55,{fill:p.hex(PDF.wh)});
   p.ln(p.M,p.H-49,p.W-p.M,p.H-49,{c:p.hex(PDF.bd),w:.7});
   p.t('DIÁRIO DE TRADER',p.M,p.H-37,{s:7.5,f:'b',c:p.hex(PDF.ac)});
   p.t('Página '+(i+1)+' de '+pages.length,p.W-p.M,p.H-37,{s:7.5,f:'b',al:'r',c:p.hex(PDF.mut)});
   const ref=String(p.meta?.data||'Referência não informada');
   const content=(p.meta?.demo?'DEMONSTRAÇÃO / DADOS FICTÍCIOS · ':'Uso pessoal · ')+ref;
   p.t(content,p.M,p.H-23,{s:7,c:p.hex(PDF.mut),w:p.CW});
   if(i){
    p.rect(0,0,p.W,51,{fill:p.hex(PDF.wh)});
    p.rect(0,0,p.W,4,{fill:p.hex(PDF.dk)});
    p.t('DIÁRIO DE TRADER',p.M,20,{s:7.5,f:'b',c:p.hex(PDF.ac)});
    p.t(p.meta?.cabecalho||p.meta?.titulo||'Relatório',p.M+100,20,{s:7.5,c:p.hex(PDF.mut),w:p.CW-100});
    p.ln(p.M,43,p.W-p.M,43,{c:p.hex(PDF.bd),w:.65});
   }
  });p.pg=active;
 }
 function cover(p,d){
  const C=p.C,reserve=d.preco||d.rec?165:0,left=p.CW-reserve;
  const lines=p.wrap(d.titulo||p.meta.titulo||'Relatório',left,26,'b');
  const sub=p.wrap(d.sub||'',left,9.5),h=Math.max(154,75+lines.length*31+sub.length*13+22);
  p.rect(0,0,p.W,h,{fill:C.dk});p.rect(0,h-3,p.W,3,{fill:C.ac});
  p.t('DIÁRIO DE TRADER',p.M,25,{s:8.5,f:'b',c:C.li});
  p.t(d.tipo||p.meta.tipo||'ACOMPANHAMENTO',p.M,43,{s:9,c:C.li2,w:p.CW});
  let y=73;for(const line of lines){p.t(line,p.M,y,{s:26,f:'b',c:C.wh});y+=31}
  for(const line of sub){p.t(line,p.M,y+5,{s:9.5,c:C.li2});y+=13}
  if(reserve){const right=p.W-p.M;if(d.rec){const label=p.wrap(d.rec,147,9,'b');label.forEach((line,i)=>p.t(line,right,69+i*13,{s:9,f:'b',al:'r',c:C.li}))}if(d.preco)p.t(d.preco,right,h-64,{s:20,f:'b',al:'r',c:C.wh,w:150});if(d.precoSub)p.t(d.precoSub,right,h-39,{s:8,al:'r',c:C.li2,w:150})}
  p.t(d.data||p.meta.data||'',p.W-p.M,h-19,{s:8,c:C.li2,al:'r',w:p.CW});p.y=h+20;
 }
 if(typeof RP_COR!=='undefined')Object.assign(RP_COR,PDF);
 if(typeof rpNovo==='function'){
  const original=rpNovo;
  rpNovo=async function(lib,meta){
   const p=await original(lib,{...meta,demo:!!meta?.demo||!!root.DIARIO_DEMO});
   for(const [key,value]of Object.entries(PDF))p.C[key]=p.hex(value);
   // Relatórios usam a mesma família; as fontes continuam incorporadas e selecionáveis.
   p.F.serif=p.F.b;p.F.serifItalic=p.F.i;
   const save=p.doc.save.bind(p.doc);p.doc.save=async function(...args){footer(p);return save(...args)};
   return p;
  };
 }
 if(typeof rpCapa==='function')rpCapa=cover;
 // A paleta atua apenas enquanto o renderizador legado está exportando.
 if(typeof imgdPal!=='undefined')Object.assign(imgdPal,{pag:IMAGE.bg,card:IMAGE.card,esc:IMAGE.raised,linha:IMAGE.line,tx:IMAGE.tx,tx2:IMAGE.mut,g:IMAGE.g,r:IMAGE.r,am:IMAGE.am});
 if(typeof IMG_FOLGA!=='undefined'){IMG_FOLGA.top=64;IMG_FOLGA.bot=72}
 // A fotografia decorativa deixa de ocupar os cabeçalhos dos compartilhamentos.
 if(typeof imgdTouro==='function')imgdTouro=function(){};
 function text(ctx,value,x,y,size=26,color=IMAGE.tx,weight=500,align='left',max){ctx.font=weight+' '+size+'px '+stack;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';let label=String(value??'');if(max&&ctx.measureText(label).width>max){const chars=Array.from(label);while(chars.length&&ctx.measureText(chars.join('')+'…').width>max)chars.pop();label=chars.join('')+'…'}ctx.fillText(label,x,y)}
 function box(ctx,x,y,w,h){ctx.fillStyle=IMAGE.card;ctx.strokeStyle=IMAGE.line;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill();ctx.stroke()}
 function line(ctx,y,w){ctx.fillStyle=IMAGE.line;ctx.fillRect(56,y,w-112,1)}
 function heading(ctx,w,title,sub){
  text(ctx,'DIÁRIO DE TRADER',56,62,23,IMAGE.ac,700);
  text(ctx,title,56,124,42,IMAGE.tx,700,'left',w-112);
  if(sub)text(ctx,sub,56,166,23,IMAGE.mut,400,'left',w-112);
  line(ctx,196,w);
 }
 function end(ctx,w,h,left,right='Registro pessoal'){
  if(root.DIARIO_DEMO)right='DEMONSTRAÇÃO / DADOS FICTÍCIOS';
  line(ctx,h-104,w);text(ctx,left,56,h-67,20,IMAGE.mut,400,'left',w-112);
  text(ctx,'DIÁRIO DE TRADER',56,h-30,19,IMAGE.ac,650);text(ctx,right,w-56,h-30,19,IMAGE.mut,400,'right',w-410);
 }
 function row(ctx,w,y,label,value,color=IMAGE.tx){text(ctx,label,80,y,25,IMAGE.mut);text(ctx,value,w-80,y,29,color,650,'right',w*.5);line(ctx,y+26,w)}
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=IMAGE.bg;ctx.fillRect(0,0,w,h);return {c,ctx}}
 function panoramaHeader(c){
  const ctx=c.getContext('2d'),w=c.width,top=c.__folga&&typeof IMG_FOLGA!=='undefined'?IMG_FOLGA.top:0,h=top+150;
  ctx.save();ctx.fillStyle=IMAGE.bg;ctx.fillRect(0,0,w,h);text(ctx,root.DIARIO_DEMO?'DIÁRIO DE TRADER / DADOS FICTÍCIOS':'DIÁRIO DE TRADER / MERCADO',48,42,22,IMAGE.ac,700);text(ctx,'Panorama do mercado',48,96,42,IMAGE.tx,700);
  const dt=new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  text(ctx,dt+' · Brasília',48,139,23,IMAGE.mut);
  const bias=typeof MDO!=='undefined'&&MDO.v?.mercados?.pre?.vies;
  if(bias){const label='Viés '+bias,x=w-300;box(ctx,x,111,252,43);text(ctx,label,x+126,140,23,bias==='positivo'?IMAGE.g:bias==='negativo'?IMAGE.r:IMAGE.am,650,'center',224)}
  ctx.fillStyle=IMAGE.line;ctx.fillRect(48,h-1,w-96,1);ctx.restore();
 }
 async function blob(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Não foi possível criar a imagem.')),'image/png'))}
 function tradeCanvas(t){
  const data=shrDados(t),mode=typeof SHR!=='undefined'&&SHR.modo||'preco',value=shrPct(t,data,mode),color=finite(value)?value>=0?IMAGE.g:IMAGE.r:IMAGE.mut;
  const {c,ctx}=canvas(1080,1350),date=String(t.dt||'').replace('T',' ').slice(0,16);
  heading(ctx,1080,'Registro da operação',[data.tp,data.lado,date].filter(Boolean).join(' · '));
  text(ctx,String(t.ativo||t.tk||'Ativo não informado'),56,282,48,IMAGE.tx,700,'left',968);
  text(ctx,data.op?'EM ANDAMENTO · VALOR DE REFERÊNCIA':'OPERAÇÃO ENCERRADA',56,326,22,IMAGE.mut,600);
  box(ctx,56,366,968,218);text(ctx,pc(value),80,476,88,color,700,'left',910);
  text(ctx,mode==='conta'?'Variação sobre a conta':'Variação do preço a favor da operação',80,540,25,IMAGE.mut);
  const price=v=>{const n=typeof numN==='function'?numN(v):typeof v==='number'?v:Number(String(v??'').replace(',','.'));return v!==null&&v!==undefined&&v!==''&&Number.isFinite(n)?num(n,Math.abs(n)>=10000?0:2):'—'};
  row(ctx,1080,660,'Entrada informada',price(t.entry));
  row(ctx,1080,750,data.op?'Referência disponível':'Saída informada',price(data.op?data.px:t.exit));
  row(ctx,1080,930,'Setup',t.setup||'Não informado');
  if(typeof SHR!=='undefined'&&SHR.rs&&finite(data.c?.pl))row(ctx,1080,1020,'Resultado financeiro',typeof mT==='function'?mT(t,data.c.pl):num(data.c.pl),data.c.pl>=0?IMAGE.g:IMAGE.r);
  text(ctx,'Dados da operação registrados no diário.',56,1140,22,IMAGE.mut,400,'left',968);
  end(ctx,1080,1350,data.op?'Operação aberta: valores podem mudar.':'Resultado individual; não representa o desempenho da conta.');return c;
 }
 function periodCanvas(data){
  const {c,ctx}=canvas(1080,1080);heading(ctx,1080,data.tit||'Resumo do período',data.sub||'Período não informado');
  box(ctx,56,236,968,214);text(ctx,pc(data.pct),80,350,86,finite(data.pct)?data.pct>=0?IMAGE.g:IMAGE.r:IMAGE.mut,700,'left',910);text(ctx,'Resultado sobre o capital de referência cadastrado',80,408,24,IMAGE.mut,400,'left',920);
  row(ctx,1080,528,'Operações encerradas',finite(data.M?.n)?String(data.M.n):'—');
  row(ctx,1080,620,'Acerto',finite(data.M?.acerto)?num(data.M.acerto*100,1)+'%':'—');
  const best=data.best?.t?.ativo||'—';
  row(ctx,1080,804,'Melhor trade',best);
  row(ctx,1080,892,'Regras seguidas',finite(data.seq)?data.seq+' dia(s) seguidos':'—');
  end(ctx,1080,1080,'Amostra pessoal do diário; registros e capital determinam o cálculo.');return c;
 }
 if(typeof shrGera==='function')shrGera=async t=>blob(tradeCanvas(t));
 if(typeof shrGeraPer==='function')shrGeraPer=async d=>blob(periodCanvas(d));
 function compactPanorama(source,contentEnd){
  const height=Math.ceil(contentEnd+124),foot=84;if(height>=source.height||height<400)return source;
  const result=document.createElement('canvas');result.width=source.width;result.height=height;const ctx=result.getContext('2d');
  ctx.drawImage(source,0,0,source.width,height-foot,0,0,source.width,height-foot);
  ctx.drawImage(source,0,source.height-foot,source.width,foot,0,height-foot,source.width,foot);return result;
 }
 function jsPdf(doc,meta={}){
  const count=doc.internal.getNumberOfPages(),w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  for(let i=1;i<=count;i++){
   doc.setPage(i);doc.setFillColor(255,255,255);doc.rect(0,0,w,11,'F');doc.rect(0,h-12,w,12,'F');
   doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(8,124,85);doc.text('DIÁRIO DE TRADER',14,7);
   doc.setDrawColor(216,225,233);doc.line(14,10,w-14,10);doc.line(14,h-12,w-14,h-12);
   doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(83,101,117);
   doc.text(root.DIARIO_DEMO?'DEMONSTRAÇÃO / DADOS FICTÍCIOS':'Uso pessoal - '+String(meta.tt||'Relatório').slice(0,65),14,h-6);
   doc.text(i+' / '+count,w-14,h-6,{align:'right'});
  }
 }
 function frame(source,title){
  if(!source?.getContext)return source;const w=source.width,h=source.height,{c,ctx}=canvas(w,h+174);
  ctx.drawImage(source,0,96);text(ctx,'DIÁRIO DE TRADER',32,37,21,IMAGE.ac,700);text(ctx,title,32,72,26,IMAGE.tx,650,'left',w-64);ctx.fillStyle=IMAGE.line;ctx.fillRect(32,94,w-64,1);
  text(ctx,'Registro pessoal - dados e filtros da tela',32,c.height-35,20,IMAGE.mut,400,'left',w-64);return c;
 }
 function legacyHeader(c,kind,data){
  if(!c?.getContext)return c;const ctx=c.getContext('2d'),w=c.width,top=c.__folga&&typeof IMG_FOLGA!=='undefined'?IMG_FOLGA.top:0;
  const height=top+(kind==='giro'?140:150),title=kind==='ranking'?'Altas e baixas da B3':kind==='giro'?'Giro do mercado':'Jornal do Pregão';
  const raw=data?.gerado||data?.dia;const date=raw?new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00-03:00':raw):new Date();
  const stamp=Number.isFinite(date.getTime())?date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',...(kind==='jornal'?{}:{hour:'2-digit',minute:'2-digit'})}):'não informada';
  ctx.save();ctx.fillStyle=IMAGE.bg;ctx.fillRect(0,0,w,height);
  const label=root.DIARIO_DEMO?'DIÁRIO DE TRADER / DADOS FICTÍCIOS':'DIÁRIO DE TRADER';
  text(ctx,label,48,45,22,IMAGE.ac,700);text(ctx,title,48,104,42,IMAGE.tx,700,'left',w-96);text(ctx,(raw?'Referência: ':'Captura: ')+stamp,48,150,23,IMAGE.mut,400,'left',w-96);
  ctx.fillStyle=IMAGE.line;ctx.fillRect(48,height-1,w-96,1);ctx.restore();return c;
 }
 if(typeof rkDesenha==='function'){const draw=rkDesenha;rkDesenha=function(data){return legacyHeader(draw.apply(this,arguments),'ranking',data)}}
 if(typeof grDesenha==='function'){const draw=grDesenha;grDesenha=function(data){return legacyHeader(draw.apply(this,arguments),'giro',data)}}
 if(typeof jrImagem==='function'){const draw=jrImagem;jrImagem=function(){return legacyHeader(draw.apply(this,arguments),'jornal',typeof jrVer==='function'?jrVer():null)}}
 root.TraderExportBrand=Object.freeze({PDF,IMAGE,footer,cover,panoramaHeader,tradeCanvas,periodCanvas,jsPdf,frame,compactPanorama,legacyHeader});
})(window);

;
/* módulo: cards-sazonais.js */
/* v311 — arte reutilizável, números desenhados pelo código, sem consumo de IA ao compartilhar. */
(function(root){
 'use strict';
 const base=root.TraderExportBrand;if(!base)return;
 const C=base.IMAGE,KEY='diario-share-theme-v309',options=[['auto','Automático'],['mercado','Mercado'],['natal','Natal'],['halloween','Halloween'],['carnaval','Carnaval'],['futebol','Futebol'],['pascoa','Páscoa'],['junina','Festa Junina'],['verao','Verão'],['reveillon','Réveillon'],['classico','Clássico']];
 const paths={mercado:'cards-art/mercados-brasil-eua.png',natal:'cards-art/natal-touro.png',halloween:'cards-art/halloween-touro.png'};
 const atlas={carnaval:[0,0],futebol:[1,0],pascoa:[2,0],junina:[0,1],verao:[1,1],reveillon:[2,1]};
 for(const id of Object.keys(atlas))paths[id]='cards-art/colecao-sazonal.png';
 const images=new Map(),jobs=new Map(),failures=new Set();let chosen='auto';
 try{const value=APP_STORAGE.getItem(KEY);if(options.some(([key])=>key===value))chosen=value}catch{}
 const finite=x=>typeof x==='number'&&Number.isFinite(x),number=(v,d=2)=>finite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const percent=v=>finite(v)?(v>0?'+':'')+number(v)+'%':'—';
 // Computus gregoriano: feriados móveis calculados sem rede e sem mudar a data do usuário.
 function easter(year){
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),v=h+l-7*m+114;
  return Date.UTC(year,Math.floor(v/31)-1,v%31+1);
 }
 function automatic(date=new Date()){
  if(!Number.isFinite(date.getTime()))return 'mercado';
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date),part=key=>Number(parts.find(p=>p.type===key)?.value),year=part('year'),month=part('month'),day=part('day'),delta=Math.round((Date.UTC(year,month-1,day)-easter(year))/86400000);
  if(month===12&&day>=26||month===1&&day<=6)return 'reveillon';
  if(month===12)return 'natal';
  if(month===10&&day>=15)return 'halloween';
  if(delta>=-51&&delta<=-46)return 'carnaval';
  if(delta>=-7&&delta<=0)return 'pascoa';
  if(month===6)return 'junina';
  if(month<=2||month===3&&day<=20)return 'verao';
  return 'mercado';
 }
 const theme=()=>chosen==='auto'?automatic():chosen;
 const themeName=id=>({mercado:'Mercado',natal:'Natal',halloween:'Halloween',carnaval:'Carnaval',futebol:'Futebol',pascoa:'Páscoa',junina:'Festa Junina',verao:'Verão',reveillon:'Réveillon',classico:'Clássico'})[id]||'Mercado';
 function setTheme(value){if(!options.some(([key])=>key===value))return false;chosen=value;try{APP_STORAGE.setItem(KEY,value)}catch{}return true}
 function load(id){
  const path=paths[id];if(!path)return Promise.resolve(null);if(images.has(path))return Promise.resolve(images.get(path));if(jobs.has(path))return jobs.get(path);
  const job=new Promise(resolve=>{
   const image=new Image();let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);if(ok){images.set(path,image);failures.delete(path)}else failures.add(path);resolve(ok?image:null)};
   const timer=setTimeout(()=>finish(false),10000);image.onload=()=>finish(image.naturalWidth>0&&image.naturalHeight>0);image.onerror=()=>finish(false);image.src=root.TraderCardArt?.[path]||path;
  }).finally(()=>jobs.delete(path));jobs.set(path,job);return job;
 }
 function text(ctx,value,x,y,size=26,color=C.tx,weight=500,max=968,align='left'){
  ctx.font=weight+' '+size+'px system-ui,-apple-system,"Segoe UI",Arial,sans-serif';ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';let label=String(value??'');
  if(ctx.measureText(label).width>max){const chars=Array.from(label);while(chars.length&&ctx.measureText(chars.join('')+'…').width>max)chars.pop();label=chars.join('')+'…'}ctx.fillText(label,x,y);
 }
 function rect(ctx,x,y,w,h,color,r=18){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
 function background(ctx,id){
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,1350);const art=images.get(paths[id]);
  if(art){if(atlas[id]){const [col,row]=atlas[id],sw=art.naturalWidth/3,sh=art.naturalHeight/2;ctx.drawImage(art,col*sw+1,row*sh+1,sw-2,sh-2,0,0,1080,1350)}else if(id==='mercado')ctx.drawImage(art,0,110,1080,720);else ctx.drawImage(art,0,0,1080,1350)}
  // O contraste protege os números sem alterar a arte nem a cor de ganhos/perdas.
  const shade=ctx.createLinearGradient(0,0,800,0);shade.addColorStop(0,'rgba(11,17,25,.84)');shade.addColorStop(.68,'rgba(11,17,25,.48)');shade.addColorStop(1,'rgba(11,17,25,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,1080,1350);
  rect(ctx,0,990,1080,360,'rgba(11,17,25,.96)',0);
 }
 function make(){const c=document.createElement('canvas');c.width=1080;c.height=1350;return {c,ctx:c.getContext('2d')}}
 function stamp(ctx,id){
  text(ctx,'DIÁRIO DE TRADER',56,66,24,C.ac,750);
  rect(ctx,830,34,194,44,'rgba(11,17,25,.8)',22);text(ctx,themeName(id),927,64,21,C.tx,650,174,'center');
 }
 function dateLabel(value){const s=String(value||'');return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4)+(s.length>=16?' · '+s.slice(11,16):''):s||'Data não informada'}
 function bottom(ctx,left){
  ctx.fillStyle=C.line;ctx.fillRect(56,1238,968,1);text(ctx,left,56,1280,20,C.mut,400);
  text(ctx,root.DIARIO_DEMO?'DEMONSTRAÇÃO / DADOS FICTÍCIOS':'DIÁRIO DE TRADER · Registro pessoal',56,1320,19,root.DIARIO_DEMO?C.am:C.ac,650);
 }
 function prices(ctx,left,right){
  rect(ctx,48,838,984,146,'rgba(18,28,40,.95)');text(ctx,left[0],74,884,23,C.mut);text(ctx,left[1],74,945,42,C.tx,700,440);
  ctx.fillStyle=C.line;ctx.fillRect(532,864,1,96);text(ctx,right[0],558,884,23,C.mut);text(ctx,right[1],558,945,42,C.tx,700,440);
 }
 function tradeCanvas(t,id=theme()){
  const data=shrDados(t),mode=typeof SHR!=='undefined'&&SHR.modo||'preco',value=shrPct(t,data,mode),color=finite(value)?value>=0?C.g:C.r:C.mut,{c,ctx}=make();background(ctx,id);stamp(ctx,id);
  text(ctx,typeof SHR!=='undefined'&&SHR.at===0?'Operação registrada':t.ativo||t.tk||'Ativo não informado',56,221,58,C.tx,750,700);text(ctx,[data.tp,data.lado].filter(Boolean).join(' · '),56,269,27,C.mut,500,620);
  text(ctx,data.op?'EM ANDAMENTO · REFERÊNCIA':'OPERAÇÃO ENCERRADA',56,312,21,C.mut,650,620);
  text(ctx,percent(value),56,444,98,color,750,710);text(ctx,mode==='conta'?'Variação sobre a conta':'Variação do preço na operação',56,494,24,C.mut,500,550);
  if(typeof SHR!=='undefined'&&SHR.rs&&finite(data.c?.pl)){
   text(ctx,'Resultado financeiro',56,587,23,C.mut,500,500);text(ctx,typeof mT==='function'?mT(t,data.c.pl):number(data.c.pl),56,649,46,data.c.pl>=0?C.g:C.r,700,500);
  }
  const price=v=>{const n=typeof numN==='function'?numN(v):Number(v);return v!==null&&v!==undefined&&v!==''&&finite(n)?number(n,Math.abs(n)>=10000?0:2):'—'};
  prices(ctx,['Entrada informada',price(t.entry)],[data.op?'Referência disponível':'Saída informada',price(data.op?data.px:t.exit)]);
  text(ctx,'SETUP',56,1042,20,C.mut,650);text(ctx,t.setup||'Não informado',56,1090,29,C.tx,600);
  text(ctx,dateLabel(data.op?t.dt:t.dtx||t.dt),56,1158,23,C.mut,500);
  bottom(ctx,data.op?'Operação aberta: o resultado pode mudar.':'Resultado individual; não representa o desempenho da conta.');return c;
 }
 function periodCanvas(data,id=theme()){
  const {c,ctx}=make();background(ctx,id);stamp(ctx,id);text(ctx,data.tit||'Meu desempenho',56,219,48,C.tx,750,850);text(ctx,data.sub||'Período não informado',56,270,27,C.mut,500,720);
  text(ctx,percent(data.pct),56,444,98,finite(data.pct)?data.pct>=0?C.g:C.r:C.mut,750,710);text(ctx,'Sobre o capital de referência cadastrado',56,494,24,C.mut,500,550);
  // A opção de dinheiro do compartilhamento permanece explícita e desmarcável.
  if(typeof SHR!=='undefined'&&SHR.rs&&finite(data.M?.P)){text(ctx,'Resultado financeiro',56,587,23,C.mut,500,500);text(ctx,typeof money==='function'?money(data.M.P):number(data.M.P),56,649,46,data.M.P>=0?C.g:C.r,700,500)}
  prices(ctx,['Operações encerradas',finite(data.M?.n)?String(data.M.n):'—'],['Acerto',finite(data.M?.acerto)?number(data.M.acerto*100,1)+'%':'—']);
  text(ctx,'REGRAS SEGUIDAS',56,1042,20,C.mut,650);text(ctx,finite(data.seq)?data.seq+' dia(s) seguidos':'Não informado',56,1090,29,C.tx,600);
  if((typeof SHR==='undefined'||SHR.at!==0)&&data.best?.t?.ativo)text(ctx,'Melhor operação: '+data.best.t.ativo,56,1158,23,C.mut,500);
  bottom(ctx,'Resultado calculado com os registros e o capital informados.');return c;
 }
 function panoramaHeader(c){
  const ctx=c.getContext('2d'),w=c.width,h=(c.__folga&&typeof IMG_FOLGA!=='undefined'?IMG_FOLGA.top:0)+150,art=images.get(paths.mercado);
  ctx.save();ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);if(art)ctx.drawImage(art,0,0,w,h);
  const shade=ctx.createLinearGradient(0,0,w*.72,0);shade.addColorStop(0,'rgba(11,17,25,.94)');shade.addColorStop(.76,'rgba(11,17,25,.6)');shade.addColorStop(1,'rgba(11,17,25,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  text(ctx,root.DIARIO_DEMO?'DIÁRIO DE TRADER / DADOS FICTÍCIOS':'DIÁRIO DE TRADER / BRASIL + EUA',48,40,20,C.ac,700,w-96);
  text(ctx,'Panorama do mercado',48,94,42,C.tx,750,w*.65);
  const dt=new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});text(ctx,dt+' · Brasília',48,134,23,C.mut,500,w*.64);
  text(ctx,'B3 · BRASIL',w-48,37,17,'#dce9f7',700,220,'right');text(ctx,'NYSE · NASDAQ',w-48,65,17,'#dce9f7',650,220,'right');
  const bias=typeof MDO!=='undefined'&&MDO.v?.mercados?.pre?.vies;
  if(bias){rect(ctx,48,157,225,39,'rgba(18,28,40,.92)',19);text(ctx,'Viés '+bias,160,184,22,bias==='positivo'?C.g:bias==='negativo'?C.r:C.am,650,200,'center')}
  ctx.fillStyle=C.line;ctx.fillRect(48,h-1,w-96,1);ctx.restore();
 }
 async function blob(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Falha ao criar a imagem.')),'image/png'))}
 if(typeof shrGera==='function')shrGera=async function(t){const id=theme();await load(id);return blob(tradeCanvas(t,id))};
 if(typeof shrGeraPer==='function')shrGeraPer=async function(d){const id=theme();await load(id);return blob(periodCanvas(d,id))};
 if(typeof imgDados==='function'){const original=imgDados;imgDados=async function(){await Promise.all([original.apply(this,arguments),load('mercado')])}}
 function mount(){
  const panel=document.querySelector('#shrov .sh');if(!panel||panel.querySelector('.season-picker'))return;
  const box=document.createElement('section');box.className='season-picker';box.setAttribute('aria-label','Tema da imagem');const label=document.createElement('b');label.textContent='Estilo do card';box.append(label);
  const buttons=document.createElement('div');buttons.className='season-buttons';
  for(const [id,name]of options){const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-pressed',String(id===chosen));button.addEventListener('click',async()=>{setTheme(id);if(typeof SHR!=='undefined'&&SHR.id)await shrAbre(SHR.id)});buttons.append(button)}
  box.append(buttons);const note=document.createElement('small');note.textContent=(chosen==='auto'?'Agora: '+themeName(theme())+'. O estilo acompanha a época do ano em Brasília. Futebol é uma escolha manual.':'Tema escolhido: '+themeName(theme())+'.')+(failures.has(paths[theme()])?' Arte indisponível. A imagem foi montada com fundo simples.':'');box.append(note);
  const image=panel.querySelector('img');if(image)image.before(box);else panel.append(box);
 }
 if(typeof shrAbre==='function'){const original=shrAbre;shrAbre=async function(id){await original.apply(this,arguments);if(typeof SHR!=='undefined'&&SHR.id===id)mount()}}
 root.TraderExportBrand=Object.freeze({...base,panoramaHeader,tradeCanvas,periodCanvas});
 root.TraderSeasonCards=Object.freeze({automatic,theme,setTheme,load,tradeCanvas,periodCanvas,mount,paths});
 const style=document.createElement('style');style.textContent='.season-picker{padding:14px;margin:12px 0;border:1px solid var(--bd);border-radius:12px;background:var(--card);color:var(--tx)}.season-picker>b{font-size:13px}.season-buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin:10px 0;max-height:148px;overflow-y:auto;overscroll-behavior:contain;padding:2px}.season-buttons button{min-height:40px;padding:8px 11px;border:1px solid var(--bd);border-radius:9px;background:var(--bg);color:var(--mut);font:600 12px system-ui;cursor:pointer}.season-buttons button[aria-pressed=true]{border-color:var(--ac);color:var(--ac);background:var(--surface-raised)}.season-picker small{display:block;font-size:11px;line-height:1.6;color:var(--mut)}';document.head.appendChild(style);
 load('mercado');
})(window);

