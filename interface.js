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
    {id:'mercado',name:'Mercado',icon:'news',description:'Panorama, notícias, análises e cotações',items:[['mercado:mu','Panorama global'],['mercado:pn','Painel de mercado'],['mercado:giro','Giro de mercado'],['mercado:jr','Jornal do Pregão'],['mercado:ag','Agenda econômica'],['mercado:nt','Notícias'],['juros','Juros e DI'],['mercado:lab','Sazonalidade e sentimento · Brasil/EUA'],['graf','Gráficos'],['mercado:cq','Cotações e ADRs'],['live','Ponte do Profit e radar']]},
    {id:'terminal',name:'Terminal',icon:'monitor',description:'Segunda tela independente · inteligência de mercado',items:[['term','Abrir Terminal']]},
    {id:'patrimonio',name:'Patrimônio',icon:'wallet',description:'Carteiras, análise e impostos',items:[['carteiras','Carteiras Brasil e EUA'],['analise','Análise IA'],['imposto','Imposto de renda']]},
    {id:'gestao',name:'Gestão',icon:'shield',description:'Risco, capital e processo',items:[['mesa','Mesa proprietária'],['painel','Metas, posição e backup'],['contratos','Dimensionamento de contratos'],['carreira','Plano de transição']]},
    {id:'estudos',name:'Estudos',icon:'book',description:'Biblioteca, cursos e simulados',items:[['estudos','Central de estudos']]},
    {id:'conta',name:'Configurações',icon:'gear',description:'Alertas, conta e preferências',items:[['mercado:al','Alertas e notificações'],['conta','Conta e sincronização'],['import','Importar operações'],['mais','Aparência'],['status','Status das fontes']]},
  ];
  // v355: áreas do Mercado, sem repetir Alertas (Configurações) ou Terminal (área própria).
  const marketGroups = [
    {name:'Panorama',items:[['mercado:mu','Mundo'],['mercado:pn','Painel'],['mercado:giro','Giro'],['juros','Juros e DI']]},
    {name:'Notícias',items:[['mercado:nt','Notícias'],['mercado:jr','Jornal do Pregão'],['mercado:ag','Agenda econômica']]},
    {name:'Análises',items:[['mercado:lab','Sazonalidade e sentimento'],['graf','Gráficos']]},
    {name:'Cotações',items:[['mercado:cq','Monitor de ativos'],['live','Profit e radar']]},
  ];
  const safe = value => esc(String(value ?? ''));
  const current = () => tab === 'mercado' ? `mercado:${['saz','se','sazus'].includes(MKT.tab)?'lab':MKT.tab==='cot'?'cq':MKT.tab}` : tab==='dia'?`dia:${DV==='hist'?'hist':'ed'}`:tab;
  const activeGroup = () => groups.find(group=>group.items.some(([route])=>route===current()))?.id || (['trades','swing','opc','ativos','dash','opgrade','opfluxo','opcart','swbt','dtrpy'].includes(tab)?'operacoes':'');
  const icon = name => window.icoSvg ? window.icoSvg(name) : '';
  const link = ([route,name],cls='') => `<button type="button" class="${cls}" data-navroute="${safe(route)}"${current()===route?' aria-current="page"':''}>${safe(name)}</button>`;
  // v360: o menu do Mercado reutiliza as quatro áreas já existentes, sem criar rotas.
  const marketMenu = () => `<div class="pro-market-subgroups" aria-label="Páginas do Mercado">${marketGroups.map(area=>`<details class="pro-market-subgroup" data-market-subgroup="${safe(area.name)}"${area.items.some(([route])=>route===current())?' open':''}><summary><strong>${safe(area.name)}</strong><small>${area.items.length} ${area.items.length===1?'página':'páginas'}</small></summary><div class="pro-market-links">${area.items.map(item=>link(item)).join('')}${area.name==='Cotações'?'<button type="button" data-research-menu>Pesquisa de investimentos</button><button type="button" data-flow-menu>Fluxo de negócios · Profit</button>':''}</div></details>`).join('')}</div>`;
  function menu(panel) {
    panel.innerHTML = `<div class="pro-menu-header"><div><small>DIÁRIO DE TRADER</small><b>Seu espaço de trabalho</b></div><button type="button" data-navclose aria-label="Fechar menu">×</button></div>
      <label class="pro-menu-search">Encontrar função<input type="search" data-navsearch placeholder="Diário, sazonalidade, risco…" autocomplete="off"></label>
      <div class="pro-menu-groups">${groups.map(group=>`<details class="pro-menu-group" data-navgroup="${group.id}"${activeGroup()===group.id?' open':''}><summary><span class="pro-menu-icon">${icon(group.icon)}</span><span><b>${group.name}</b><small>${group.description}</small></span></summary><div>${group.id==='mercado'?marketMenu():group.items.filter(([route])=>route!=='mercado:sazus').map(item=>link(item)).join('')}${group.id==='home'?'<button type="button" data-wf="organize-home">Organizar início</button>':''}${group.id==='conta'?'<button type="button" data-wf="quality">Dados e fontes</button><button type="button" data-wf="reports">Relatórios</button>':''}</div></details>`).join('')}</div>
      <p class="pro-menu-note">Navegação simplificada · Interface v360</p>`;
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
          const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
          const groupTitle=element.querySelector(':scope > summary')?.textContent||'';
          const areaTitle=button.closest('[data-market-subgroup]')?.querySelector('summary')?.textContent||'';
          const match=!query||norm(button.textContent).includes(query)||norm(groupTitle).includes(query)||norm(areaTitle).includes(query);
          button.hidden=!match;any ||= match;
        });
        element.hidden=!any;
        element.open=query?any:element.dataset.navgroup===activeGroup();
        element.querySelectorAll('[data-market-subgroup]').forEach(area=>{
          const matches=[...area.querySelectorAll('[data-navroute],[data-research-menu],[data-flow-menu]')].some(button=>!button.hidden);
          area.hidden=!!query&&!matches;
          area.open=query?matches:[...area.querySelectorAll('[data-navroute]')].some(button=>button.dataset.navroute===current());
        });
      });
    });
  }
  window.DIARIO_NAV = {groups,marketGroups,menu,navigate};
  const existingMenu=document.querySelector?.('#mdr2 .pn');
  if(existingMenu)menu(existingMenu);
  // As abas internas seguem os mesmos grupos do menu, sem taxonomia paralela.
  grpHeader = function(route) {
    const group=groups.find(g=>g.items.some(([key])=>key===route));
    return !group||group.items.length<2?'':`<div class="pro-subtabs" role="navigation" aria-label="${safe(group.name)}">${group.items.filter(([target])=>target!=='mercado:sazus').map(item=>link(item,item[0]===route?'on':'')).join('')}</div>`;
  };
  function navigate(route) {
    const marketToMarket = tab==='mercado' && route.startsWith('mercado:');
    const oldTabs = marketToMarket ? document.querySelector('#app .m403-primary-tabs') : null;
    const oldTop = oldTabs?.getBoundingClientRect().top;
    if(route==='mercado:cot')route='mercado:cq';
    // v356: a antiga rota EUA ainda abre o estudo, mas sem criar uma página separada.
    if(route==='mercado:sazus'){US.section='us';route='mercado:lab'}
    else if(route==='mercado:lab')US.section='br';
    const [screen,sub]=route.split(':');
    if(screen==='dia'){DV=sub||'ed';tab='dia'}
    else if(screen==='mercado'){tab='mercado';MKT.tab=sub||'mu';try{ls.set('diario-mkt-tab',MKT.tab)}catch{}}
    else {tab=screen;if(['trades','swing','opc'].includes(screen))LT=screen}
    document.getElementById('mdr2')?.remove();
    document.getElementById('mdr')?.remove();
    document.body.style.overflow='';
    render();
    if(marketToMarket && Number.isFinite(oldTop)) {
      queueMicrotask(() => {
        const tabs=document.querySelector('#app .m403-primary-tabs');
        if(!tabs)return;
        const target=Math.max(0,window.scrollY+tabs.getBoundingClientRect().top-oldTop);
        window.scrollTo({top:target,behavior:'instant'});
      });
    } else window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-navroute]');
    if(!button)return;
    navigate(button.dataset.navroute);
  });
  // Um único conjunto de abas para todas as telas de mercado.
  segM = function () {
    // Reutiliza a rotina de alertas existente, mas a apresenta sob Configurações.
    if(current()==='mercado:al')return `<section class="m355-settings-head" aria-label="Configurações de alertas"><div class="m355-crumb"><button type="button" data-navroute="mais">Configurações</button><span aria-hidden="true">/</span><span>Alertas</span></div><span class="routine-eyebrow">PREFERÊNCIAS · NOTIFICAÇÕES</span><h1>Alertas e notificações</h1><p>Gerencie avisos de preço, eventos e notificações dos seus dispositivos em um único lugar.</p></section>`;
    const selected=current(), group=marketGroups.find(g=>g.items.some(([route])=>route===selected))||marketGroups[0];
    const active=group.items.find(([route])=>route===selected)||group.items[0];
    return `<section class="workbench-header m355-market-head" aria-label="Navegação de Mercado"><div class="m355-overline">CONTEXTO · BRASIL E MUNDO</div><div class="m355-market-title"><div><h1>Mercado</h1><p>Informação, análise e acompanhamento no mesmo lugar.</p></div><button type="button" class="m355-ia-button" data-market-chat>Economista IA</button></div><nav class="m355-areas m360-area-grid" aria-label="Áreas do mercado">${marketGroups.map((g,i)=>`<button type="button" class="m360-area ${g===group?'on':''}" data-navroute="${safe(g.items[0][0])}" aria-pressed="${g===group}"><span class="m360-area-symbol" aria-hidden="true">${['◉','▤','▥','▦'][i]}</span><span class="m360-area-content"><strong>${safe(g.name)}</strong><small>${safe(['Brasil e mundo','Jornal e agenda','Sazonalidade e gráficos','Ativos e preços'][i])}</small></span></button>`).join('')}</nav><div class="m355-page-header"><div><span>Página atual</span><strong>${safe(active[1])}</strong></div><label class="m355-page-picker"><span>Trocar página</span><select data-m355-market-page aria-label="Escolher página de ${safe(group.name)}">${group.items.map(([route,name])=>`<option value="${safe(route)}"${route===selected?' selected':''}>${safe(name)}</option>`).join('')}</select></label></div><nav class="m355-page-links" aria-label="Páginas de ${safe(group.name)}">${group.items.map(item=>link(item,selected===item[0]?'on':'')).join('')}</nav></section>`;
  };
  // Os alertas continuam com os mesmos handlers de inscrição/teste; retira só a barra antiga de páginas de Mercado.
  const previousAlerts=vAlertas;
  vAlertas=function(){return previousAlerts('').replace('<div class="top"><b>Alertas</b></div>','<div class="top"><b>Gerenciar alertas</b></div>')};
  // A tela de Configurações oferece um acesso explícito aos avisos (e não apenas um item escondido no menu).
  document.addEventListener('change',event=>{const select=event.target.closest?.('[data-m355-market-page]');if(select&&marketGroups.some(g=>g.items.some(([r])=>r===select.value)))navigate(select.value)});
  window.TraderUI?.onRender?.('mercado-v355',()=>{const element=document.getElementById('app');element?.classList.toggle('m355-settings-alerts',tab==='mercado'&&MKT.tab==='al')});
  // Preferências deixa de repetir todas as ferramentas já presentes no menu.
  const previousMore=vMais;
  const density=()=>{try{return ls.get('diario-densidade-v284')==='compact'?'compact':'comfortable'}catch{return 'comfortable'}};
  const applyDensity=()=>document.documentElement?.setAttribute('data-density',density());
  applyDensity();
  vMais=function(){const html=previousMore.apply(this,arguments),start=html.indexOf('<h2>Apar');return '<h1>Preferências</h1><p class="mut">Personalize a aparência do seu espaço.</p>'+(start>=0?html.slice(start):html)+`<h2>Densidade da interface</h2><p class="mut sm">Confortável para escrever e usar no celular. Compacta para comparar mais informações no computador.</p><div class="pro-subtabs">${[['comfortable','Confortável'],['compact','Compacta']].map(([key,name])=>`<button type="button" data-prodensity="${key}" class="${density()===key?'on':''}" aria-pressed="${density()===key}">${name}</button>`).join('')}</div>`};
  const previousSettingsAlerts=vMais;
  vMais=function(){const html=previousSettingsAlerts.apply(this,arguments),card=`<section class="m355-alerts-link"><div class="m355-alerts-icon" aria-hidden="true">🔔</div><div><span>CONFIGURAÇÕES</span><h2>Alertas e notificações</h2><p>Preços, eventos, lembretes e avisos no PC e no celular.</p></div><button type="button" data-navroute="mercado:al">Gerenciar</button></section>`,anchor='<p class="mut">Personalize a aparência do seu espaço.</p>';return html.includes(anchor)?html.replace(anchor,anchor+card):card+html};

  const US={section:'br',asset:'spx',view:'mensal',lookback:20,eventType:'midterm',eventCategory:'todos',window:'d1',cycle:2,month:new Date().getMonth()+1,value:null,busy:false,error:'',lastAttempt:0,extra:null,extraAsset:'',extraBusy:false,extraError:'',extraLast:0};
  const percent=x=>typeof x==='number'&&Number.isFinite(x)?`${x>0?'+':''}${x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`:'—';
  const cell=x=>`<span class="${x>0?'g':x<0?'r':'mut'}">${percent(x)}</span>`;
  const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  // Métricas observadas: somente meses completos já entregues por sazonal-us.ts.
  // Não usar como previsão nem como medida de volatilidade diária/intradiária.
  function seasonMetrics(row,years=0) {
    const obs=(Array.isArray(row?.observacoes)?row.observacoes:[]).filter(x=>Number.isFinite(x?.valor)&&Number.isInteger(+x.ano));
    const newest=obs.reduce((y,x)=>Math.max(y,+x.ano),0);
    const sample=years ? obs.filter(x=>+x.ano>=newest-years+1) : obs;
    const values=sample.map(x=>x.valor).sort((a,b)=>a-b),n=values.length;
    if(!n)return {...row,n:0,observacoes:[],media:null,mediana:null,positivas:null,melhor:null,pior:null,desvio:null,absmedia:null,absmediana:null,quedas:null,fortes3:null,fortes5:null,p25:null,p75:null};
    const mean=values.reduce((a,b)=>a+b,0)/n;
    const median=v=>v.length%2?v[Math.floor(v.length/2)]:(v[v.length/2-1]+v[v.length/2])/2;
    const abs=values.map(Math.abs).sort((a,b)=>a-b);
    const quantile=(v,q)=>{const pos=(v.length-1)*q,lo=Math.floor(pos),hi=Math.ceil(pos);return v[lo]+(v[hi]-v[lo])*(pos-lo)};
    return {...row,n,observacoes:sample,media:mean,mediana:median(values),positivas:values.filter(x=>x>0).length/n*100,
      quedas:values.filter(x=>x<0).length/n*100,melhor:values[n-1],pior:values[0],
      desvio:n>1?Math.sqrt(values.reduce((a,v)=>a+(v-mean)**2,0)/(n-1)):null,
      absmedia:abs.reduce((a,b)=>a+b,0)/n,absmediana:median(abs),
      fortes3:abs.filter(v=>v>=3).length/n*100,fortes5:abs.filter(v=>v>=5).length/n*100,
      p25:quantile(values,.25),p75:quantile(values,.75)};
  }
  function monthRanking(rows) {
    const ranked=rows.filter(x=>x.n>=8&&x.absmedia!=null).sort((a,b)=>b.absmedia-a.absmedia);
    const max=ranked[0]?.absmedia||1;
    return `<section class="us-rank"><div class="us-rank-head"><div><h3>Meses com maior movimentação histórica</h3><p>Ranking pela média do valor absoluto da variação mensal (fechamento a fechamento), sem considerar a direção.</p></div><span>Amostra ≥ 8 anos</span></div>${ranked.length?`<div class="us-rank-grid">${ranked.map((row,i)=>`<button type="button" class="us-rank-item${row.mes===US.month?' selected':''}" data-usmonth="${row.mes}" title="Ver detalhes de ${monthNames[row.mes-1]}"><span class="us-rank-label"><b>${i+1}. ${monthNames[row.mes-1]}</b><strong>${percent(row.absmedia)}</strong></span><span class="us-rank-bar"><i style="width:${Math.max(3,Math.min(100,row.absmedia/max*100)).toFixed(1)}%"></i></span><small>${row.n} anos · ${percent(row.fortes3)} tiveram |retorno| ≥ 3%</small></button>`).join('')}</div>`:'<p class="us-caution">Histórico insuficiente para comparar os meses com segurança.</p>'}<p class="us-footnote">A média absoluta não equivale a amplitude intradiária ou volume. Ranking histórico não é projeção do próximo mês.</p></section>`;
  }
  const EVENT_INFO={
    cpi:{name:'Inflação CPI',focus:'DXY · Treasuries · Nasdaq',source:'Bureau of Labor Statistics'},
    payroll:{name:'Emprego (Payroll)',focus:'Juros EUA · DXY · S&P 500',source:'Bureau of Labor Statistics'},
    fomc:{name:'Decisão do FOMC',focus:'Fed Funds · US10Y · Nasdaq',source:'Federal Reserve'},
    opex:{name:'Vencimento de opções',focus:'Opções e índices · ajustes de posições',source:'Cboe'}
  };
  // Calendário oficial conhecido na data desta versão (04/11/2026).
  // Eventos posteriores podem ser reagendados; oferecer links oficiais para conferência.
  const US_EVENTS=[
    ...['2026-11-10','2026-12-10'].map(d=>({d,t:'cpi'})),
    ...['2026-11-06','2026-12-04','2027-01-08','2027-02-05','2027-03-05','2027-04-02','2027-05-07','2027-06-04','2027-07-02','2027-08-06','2027-09-03','2027-10-08','2027-11-05','2027-12-03'].map(d=>({d,t:'payroll'})),
    ...['2026-12-09','2027-01-27','2027-03-17','2027-04-28','2027-06-09','2027-07-28','2027-09-15','2027-10-27','2027-12-08'].map(d=>({d,t:'fomc'})),
    ...['2026-11-20','2026-12-18'].map(d=>({d,t:'opex'}))
  ].sort((a,b)=>a.d.localeCompare(b.d));
  function eventsCalendar(){
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const rows=US_EVENTS.filter(e=>e.d>=today&&(US.eventCategory==='todos'||e.t===US.eventCategory)).slice(0,16);
    const fmt=d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4);
    return `<section class="us-events"><h3>Datas macro importantes · EUA</h3><p>Calendário de divulgação e decisões, não uma estatística de impacto. Reações dependem de surpresa, posicionamento e contexto.</p><div class="v357-alert-link"><span>Alertas de eventos econômicos usam o sistema de notificações já existente.</span><button type="button" class="btn s" data-navroute="mercado:al">Configurar avisos</button></div><div class="us-events-filter"><label>Mostrar<select data-useventcategory>${[['todos','Todos os eventos'],['cpi','Inflação CPI'],['payroll','Payroll'],['fomc','FOMC'],['opex','Opções']].map(([v,t])=>`<option value="${v}"${US.eventCategory===v?' selected':''}>${t}</option>`).join('')}</select></label></div>${rows.length?`<div class="pro-table-scroll" tabindex="0"><table class="us-table us-event-table"><thead><tr><th>Data (EUA)</th><th>Evento</th><th>Mercados para observar</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${fmt(r.d)}</th><td>${EVENT_INFO[r.t].name}</td><td>${EVENT_INFO[r.t].focus}</td></tr>`).join('')}</tbody></table></div>`:'<p class="us-caution">Não há datas futuras cadastradas nesta versão. Consulte os calendários oficiais para novas divulgações.</p>'}
    <div class="us-event-themes"><b>Meses e períodos para monitorar</b><p><strong>Março, junho, setembro e dezembro:</strong> costumam concentrar vencimentos trimestrais de derivativos e reuniões do Fed com projeções; não implica alta ou queda e nem comprova maior oscilação.</p><p><strong>Janeiro, abril, julho e outubro:</strong> acompanhe as temporadas de resultados trimestrais; as datas de cada empresa variam.</p><p><strong>Todo mês:</strong> CPI e emprego nos EUA; horários indicados nas fontes são no fuso Eastern Time.</p></div>
    <p class="us-footnote">Referência estática verificada em 04/11/2026. Datas podem mudar; o aplicativo não as sincroniza automaticamente. A janela de reação a CPI, payroll ou FOMC ainda não foi calculada sobre pregões diários.</p>
    <div class="us-event-sources"><a target="_blank" rel="noopener noreferrer" href="https://www.bls.gov/schedule/news_release/cpi.htm">CPI · BLS</a><a target="_blank" rel="noopener noreferrer" href="https://www.bls.gov/schedule/news_release/empsit.htm">Payroll · BLS</a><a target="_blank" rel="noopener noreferrer" href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm">FOMC · Fed</a><a target="_blank" rel="noopener noreferrer" href="https://www.cboe.com/about/hours/us-options/">Opções · Cboe</a></div></section>`;
  }
  function studyTable(rows,label) {
    return `<div class="pro-table-scroll" tabindex="0" role="region" aria-label="${safe(label)}"><table class="us-table"><caption>${safe(label)}</caption><thead><tr><th scope="col">Período</th><th scope="col">Média</th><th scope="col">Mediana</th><th scope="col">Positivas</th><th scope="col">Amostra</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${safe(row.label)}</th><td>${cell(row.media)}</td><td>${cell(row.mediana)}</td><td>${row.positivas==null?'—':percent(row.positivas)}</td><td>${row.n}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function closingTable(asset) {
    const rows=(asset.catalogo||[]).filter(row=>US.eventType==='todas'||row.tipo===US.eventType);
    const number=x=>typeof x==='number'?x.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—';
    const point=(p,change)=>p?`${safe(p.d)}<br><b>${number(p.v)}</b><br>${cell(change)}`:'Sem fechamento';
    return `<details class="us-observations"><summary>Fechamentos D-1, D0 e D+1 · ${rows.filter(row=>row.concluida).length} eleições cobertas</summary><p class="sm mut">Preço de fechamento e variação contra o pregão anterior. D0 é a eleição. Quando não houve pregão em D0, o retorno posterior usa o último fechamento anterior; D0 permanece vazio. Dias sem histórico ficam vazios e não entram nas médias. Midterms desde 1950: 19 concluídas até 2022; a amostra varia conforme índice e janela.</p><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th>Ano / tipo</th><th>Eleição</th><th>D-1 · anterior</th><th>D0 · eleição</th><th>D+1 · seguinte</th></tr></thead><tbody>${rows.map(row=>`<tr><th>${row.ano}<br>${safe(row.tipo)}</th><td>${safe(row.data)}${row.concluida?'':'<br>Aguardando / sem histórico'}</td><td>${point(row.anterior,row.variacao_anterior)}</td><td>${point(row.dia,row.variacao_dia)}</td><td>${point(row.seguinte,row.variacao_seguinte)}</td></tr>`).join('')}</tbody></table></div></details>`;
  }
  // v357: análises complementares usam séries diárias da função separada sazonal-extras.
  // Nunca combinar dados simulados ou séries de minicontratos não disponíveis.
  const extraViewNames={semanas:'Semanas e viradas de mês',eventos:'CPI, Payroll e FOMC',cenarios:'VIX, DXY e juros',brasil:'Brasil × Estados Unidos'};
  const extraLabels={primeiros5:'Primeiros 5 pregões',ultimos5:'Últimos 5 pregões',virada:'Primeiros 3 pregões do mês',opex:'Cinco pregões até o 3º vencimento de sexta',sem1:'Pregões 1–5',sem2:'Pregões 6–10',sem3:'Pregões 11–15',sem4:'Pregões 16–20',vix_baixo:'VIX abaixo de 20',vix_alto:'VIX igual/acima de 20',dxy_sobe:'DXY subia antes do mês',dxy_cai:'DXY caía antes do mês',juros_sobem:'US10Y subia antes do mês',juros_caem:'US10Y caía antes do mês',antes:'D−5 até D−1',dia:'Fechamento D−1 → D0',depois:'Fechamento D0 → D+1',semana:'D0 até D+5',total:'D−1 até D+5'};
  const extraNum=x=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
  function extraTable(items,sub=''){
    return `<div class="pro-table-scroll" tabindex="0"><table class="us-table us-v357-table"><thead><tr><th>Janela / condição</th><th>Ocorrências</th><th>Média</th><th>|Mov.| médio</th><th>Positivas</th></tr></thead><tbody>${items.map(([key,v])=>`<tr><th scope="row">${safe(extraLabels[key]||key)}</th><td>${v?.n||0}</td><td>${v?.n?cell(v.media):'—'}</td><td>${v?.n?extraNum(v.absmedia)+'%':'—'}</td><td>${v?.n?extraNum(v.positivas)+'%':'—'}</td></tr>`).join('')||'<tr><td colspan="5">Sem amostras disponíveis.</td></tr>'}</tbody></table></div>${sub?`<p class="us-footnote">${sub}</p>`:''}`;
  }
  function bodyExtra(){
    if(!US.extra||US.extraAsset!==US.asset){return `<div class="card us-empty" role="status"><b>${US.extraBusy?'Consultando fechamentos históricos…':'Análise diária ainda não carregada'}</b><p>${safe(US.extraError||'Esta análise usa o serviço histórico adicional. Não exibe métricas inventadas se a fonte falhar.')}</p><button class="btn s" data-us-extra-refresh ${US.extraBusy?'disabled':''}>${US.extraBusy?'Aguarde…':'Consultar agora'}</button></div>`}
    const d=US.extra;
    const missing=d.falhas?.length?`<p class="us-caution">Fontes indisponíveis nesta consulta: ${safe(d.falhas.join(', '))}. As estatísticas correspondentes podem ficar vazias.</p>`:'';
    let content='';
    if(US.view==='semanas')content=`<h3>Semanas e viradas de mês</h3><p>Movimento do fechamento anterior ao fechamento ao fim da janela, desde o histórico disponível. Não representa variação máxima intradiária nem certeza de um padrão sazonal.</p>${extraTable(Object.entries(d.semanas||{}),'“Virada” mede o fechamento anterior até o 3º pregão do mês. O vencimento é aproximado pela terceira sexta-feira, sem assumir liquidez idêntica entre produtos.')}<p class="us-caution">Amostras pequenas ou feriados podem afetar as comparações. Compare a média com a mediana no estudo mensal.</p>`;
    if(US.view==='eventos'){
      const names={cpi:'Inflação CPI',payroll:'Emprego · Payroll',fomc:'Decisão do Fed · FOMC'};
      content=`<h3>Comportamento em torno de eventos</h3><p>Estatísticas reais de fechamentos dos índices em janelas próximas às divulgações, sem atribuir causalidade. CPI/Payroll usam as datas oficiais de 2026 e FOMC, decisões de 2024–2026.</p><div class="v357-event-list">${Object.entries(d.eventos||{}).map(([name,e])=>`<details class="v357-event" ${name==='fomc'?'open':''}><summary>${safe(names[name]||name)} <span>${e?.janelas?.dia?.n||0} sessões D0</span></summary>${extraTable(Object.entries(e?.janelas||{}),'D0 é o pregão da divulgação; D−1 é o fechamento anterior. Não há medição de segundos/minutos após a notícia. Não se mede surpresa econômica.')}${(e?.janelas?.dia?.n||0)<10?'<p class="us-caution">Amostra pequena: não extrapole o resultado.</p>':''}</details>`).join('')}</div><p class="us-footnote"><a href="https://www.bls.gov/schedule/news_release/cpi.htm" target="_blank" rel="noopener noreferrer">Datas CPI · BLS</a> · <a href="https://www.bls.gov/cps/publications/release-calendar.htm" target="_blank" rel="noopener noreferrer">Payroll · BLS</a> · <a href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" target="_blank" rel="noopener noreferrer">FOMC · Fed</a></p>`;
    }
    if(US.view==='cenarios')content=`<h3>Movimentação condicionada ao cenário</h3><p>O cenário é observado <strong>antes do início do mês</strong>; o retorno medido é do mês seguinte. VIX abaixo/acima de 20, DXY e US10Y pela variação nos 21 pregões anteriores.</p>${extraTable(Object.entries(d.cenarios||{}),'VIX é um índice implícito de volatilidade de opções, não a volatilidade realizada. US10Y sobe/cai em pontos do indicador, não percentual da taxa.')}<p class="us-caution">São associações históricas, não efeitos causais nem estratégias testadas fora da amostra.</p>`;
    if(US.view==='brasil')content=`<h3>Comparação Brasil × EUA</h3><p>Correlação dos retornos diários, com <strong>252 observações coincidentes mais recentes</strong>. Os mercados fecham em horários diferentes; logo a correlação no mesmo dia pode distorcer a relação real.</p><div class="v357-corr-grid">${[['ibov','Ibovespa · referência para WIN'],['dolar','USD/BRL · referência para WDO']].map(([key,label])=>`<div class="v357-corr"><small>${label}</small><b>${d.brasil?.[key]?.correlacao==null?'Indisponível':extraNum(d.brasil[key].correlacao)}</b><span>Coeficiente r · ${d.brasil?.[key]?.n||0} pares de pregões</span></div>`).join('')}</div><p class="us-footnote">A correlação vai de −1 a +1. O cálculo usa IBOV e USD/BRL como <strong>proxies</strong>: não são as séries de futuros WIN e WDO, nem indicam direção futura ou sinal de entrada.</p>`;
    return `<section class="v357-extra"><div class="top"><h2>${safe(extraViewNames[US.view]||'Análise americana')}</h2><button type="button" class="btn s" data-us-extra-refresh ${US.extraBusy?'disabled':''}>Atualizar</button></div><p class="mut sm">${safe(US.asset.toUpperCase())} · Histórico ${safe(d.periodo?.de||'—')} a ${safe(d.periodo?.ate||'—')} · Consulta ${safe(new Date(d.gerado).toLocaleString('pt-BR'))}</p>${missing}${content}<details class="us-method"><summary>Fonte, cobertura e limitações</summary><p>${safe(d.metodo||'')}</p><p>Fonte de preços: Yahoo Finance (consulta sem garantia de disponibilidade). Métricas em fechamento diário, não ticks nem horário do anúncio. Fatores macro e feriados podem afetar séries.</p></details></section>`;
  }
  async function loadExtra(force=false){
    if(US.extraBusy||(!force&&US.extra&&US.extraAsset===US.asset))return;
    if(!force&&Date.now()-US.extraLast<12000)return;
    US.extraBusy=true;US.extraError='';US.extraLast=Date.now();paintUs();
    const asset=US.asset;
    try{
      const response=await rq('/functions/v1/sazonal-extras',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset}),signal:AbortSignal.timeout(45000)});
      const data=await response.json();
      if(!response.ok||data.versao!=='v357')throw new Error(data.error||'A análise diária não respondeu.');
      if(asset===US.asset){US.extra=data;US.extraAsset=asset;}
    }catch(error){US.extraError=error.name==='TimeoutError'?'Tempo esgotado ao consultar dados diários.':String(error.message||error)}
    finally{US.extraBusy=false;if(tab==='mercado'&&MKT.tab==='lab'&&US.section==='us')paintUs()}
  }
  function bodyUs() {
    if(US.view==='calendar')return eventsCalendar();
    if(['semanas','eventos','cenarios','brasil'].includes(US.view))return bodyExtra();
    const data=US.value;
    if(!data)return `<div class="card us-empty" role="status"><b>${US.busy?'Buscando séries históricas dos EUA…':'Histórico ainda não carregado'}</b><p>${safe(US.error||'Entre na conta para consultar os índices e calcular os estudos históricos.')}</p><button class="btn s" data-usrefresh${US.busy?' disabled':''}>${US.busy?'Aguarde':'Carregar histórico'}</button></div>`;
    const asset=data.ativos.find(a=>a.k===US.asset);
    if(!asset||asset.status!=='ok')return `<div class="card"><p>${safe(asset?.erro||'Este índice está indisponível.')}</p><button class="btn s" data-usrefresh>Tentar novamente</button></div>`;
    const rows=(US.view==='mensal' ? asset.mensal.map(row=>seasonMetrics(row,US.lookback)) : US.view==='ciclo' ? asset.ciclo : asset.eleicoes?.[US.eventType]||asset.midterms)||[];
    const selected=rows.find(row=>US.view==='mensal'?row.mes===US.month:US.view==='ciclo'?row.fase===US.cycle:row.k===US.window)||rows[0];
    const title=US.view==='mensal'?'Mês a mês':US.view==='ciclo'?'Ciclo presidencial · anos civis':'Antes e depois das eleições';
    const options=rows.map(row=>{const value=US.view==='mensal'?row.mes:US.view==='ciclo'?row.fase:row.k;return `<option value="${safe(value)}"${row===selected?' selected':''}>${safe(US.view==='mensal'?monthNames[row.mes-1]:US.view==='ciclo'?`Ano ${row.fase} · ${row.nome}`:row.nome)}</option>`}).join('');
    const fullRows=rows.map(row=>({...row,label:US.view==='mensal'?monthNames[row.mes-1]:US.view==='ciclo'?`Ano ${row.fase} · ${row.nome}`:row.nome}));
    return `<div class="us-study"><div class="top"><div><h2>${title}</h2><p class="mut sm">${safe(asset.n)} · ${safe(asset.de)} a ${safe(asset.ate)} · USD</p></div><button class="btn s" data-usrefresh${US.busy?' disabled':''}>${US.busy?'Atualizando…':'Atualizar'}</button></div>
      ${US.error?`<p class="warn" role="status">${safe(US.error)} Exibindo a consulta anterior, de ${safe(new Date(data.gerado).toLocaleString('pt-BR'))}.</p>`:''}
      ${US.view==='midterms'?`<label>Tipo de eleição<select data-uselection>${[['midterm','Midterms'],['presidencial','Presidenciais'],['todas','Todas as eleições federais']].map(([key,name])=>`<option value="${key}"${US.eventType===key?' selected':''}>${name}</option>`).join('')}</select></label>`:''}
      ${US.view==='mensal'?`<label>Período do histórico<select data-uslookback>${[[10,'Últimos 10 anos'],[20,'Últimos 20 anos'],[30,'Últimos 30 anos'],[0,'Histórico completo']].map(([v,name])=>`<option value="${v}"${US.lookback===v?' selected':''}>${name}</option>`).join('')}</select></label>${monthRanking(rows)}`:''}
      <label>${US.view==='mensal'?'Detalhes do mês':'Janela de comparação'}<select data-usperiod>${options}</select></label>
      <div class="us-kpis"><div><span>Média histórica</span><b>${cell(selected?.media)}</b></div><div><span>Mediana</span><b>${cell(selected?.mediana)}</b></div><div><span>Janelas positivas</span><b>${selected?.positivas==null?'—':percent(selected.positivas)}</b></div><div><span>Amostra concluída</span><b>${selected?.n||0} ${US.view==='midterms'?'eleições':'anos'}</b></div></div>
      <p class="us-dispersion">Pior: ${cell(selected?.pior)} · Melhor: ${cell(selected?.melhor)} · Desvio dos retornos: ${percent(selected?.desvio)}</p>
      ${US.view==='mensal'?`<div class="us-extra-kpis"><div><small>Movimento absoluto médio</small><b>${percent(selected?.absmedia)}</b></div><div><small>Mediana |retorno|</small><b>${percent(selected?.absmediana)}</b></div><div><small>Meses negativos</small><b>${percent(selected?.quedas)}</b></div><div><small>Movimentos ≥ 3%</small><b>${percent(selected?.fortes3)}</b></div><div><small>Intervalo P25–P75</small><b>${percent(selected?.p25)} a ${percent(selected?.p75)}</b></div><div><small>Movimentos ≥ 5%</small><b>${percent(selected?.fortes5)}</b></div></div><p class="us-footnote">Retorno absoluto = |variação do fechamento do mês|. P25–P75 descreve a faixa central das observações, não um intervalo de previsão.</p>`:''}
      ${selected?.n<10?'<p class="us-caution">Amostra pequena: poucos eventos podem alterar bastante as médias.</p>':''}
      ${studyTable(fullRows,title)}
      ${US.view==='midterms'?closingTable(asset):''}
      <details class="us-observations"><summary>Conferir cada observação e suas datas</summary><div class="pro-table-scroll" tabindex="0"><table class="us-table"><thead><tr><th scope="col">Ano</th><th scope="col">Fechamento inicial</th><th scope="col">Fechamento final</th><th scope="col">Retorno</th></tr></thead><tbody>${(selected?.observacoes||[]).map(row=>`<tr><th scope="row">${row.ano}</th><td>${safe(row.de)}</td><td>${safe(row.ate)}</td><td>${cell(row.valor)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhuma janela completa nesta amostra.</td></tr>'}</tbody></table></div></details>
      <details class="us-method"><summary>Metodologia e fontes</summary><p>${safe(data.metodo)}</p><p>Dados consultados em ${safe(new Date(data.gerado).toLocaleString('pt-BR'))}. Janelas positivas são frequência histórica, não probabilidade de alta futura. O desvio mede a dispersão entre retornos das janelas, não a volatilidade intradiária.</p><p><a href="https://finance.yahoo.com/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a> · <a href="https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/" target="_blank" rel="noopener noreferrer">Calendário eleitoral da FEC</a></p></details></div>`;
  }
  function renderUs() {
    return `<section class="us-seasonality"><div class="pro-region" role="group" aria-label="Sazonalidade e sentimento"><button type="button" data-usarea="br">Brasil · Sentimento</button><button type="button" class="on" aria-pressed="true" data-usarea="us">EUA · Sazonalidade</button></div>
      <div class="us-intro"><span class="routine-eyebrow">SAZONALIDADE · ESTADOS UNIDOS</span><h2>Meses, ciclos e datas importantes</h2><p>O ranking mostra os meses com maior movimento histórico de fechamento a fechamento. Eventos macro são apresentados separadamente, sem previsão de direção do mercado.</p></div>
      ${US.view==='midterms'?`<div class="us-election-context"><b>O que são as midterms?</b><p>Eleições legislativas no meio do mandato presidencial. Elas podem mudar o controle do Congresso. A comparação abaixo agrupa os eventos por data, sem atribuir o retorno ao partido vencedor.</p>${US.value?.proxima_midterm?`<span>Próxima data: <b>${safe(US.value.proxima_midterm.split('-').reverse().join('/'))}</b></span>`:'<a href="https://www.usa.gov/midterm-elections" target="_blank" rel="noopener noreferrer">Consultar o calendário oficial</a>'}<p class="sm">Lucros, juros e surpresas de política econômica também afetam os preços. Médias históricas não isolam o efeito de uma eleição.</p></div>`:''}
      ${US.view!=='calendar'?`<label>Índice<select data-usasset>${[['spx','S&P 500'],['ndx','Nasdaq 100'],['dji','Dow Jones'],['rut','Russell 2000']].map(([key,name])=>`<option value="${key}"${US.asset===key?' selected':''}>${name}</option>`).join('')}</select></label>`:''}
      <label class="v357-analysis-select">Tipo de análise<select data-usview-select>${[['mensal','Meses e movimento'],['semanas','Semanas e viradas de mês'],['eventos','CPI, Payroll e FOMC'],['cenarios','VIX, DXY e juros'],['brasil','Brasil × EUA'],['calendar','Calendário econômico'],['ciclo','Ciclo presidencial'],['midterms','Eleições']].map(([key,name])=>`<option value="${key}"${US.view===key?' selected':''}>${name}</option>`).join('')}</select></label>
      <div id="us-study-body" aria-live="polite">${bodyUs()}</div><p class="us-footnote">Estudos históricos de índices dos EUA, conforme disponibilidade da fonte. Retornos em USD, sem custos ou spreads. Médias históricas não são recomendação nem sinal de entrada.</p></section>`;
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
    finally{US.busy=false;if(tab==='mercado'&&['lab','sazus'].includes(MKT.tab)&&US.section==='us'&&US.view!=='calendar')render()}
  }
  function paintUs(){const body=document.getElementById('us-study-body');if(body)body.innerHTML=bodyUs()}
  const previousMarket=vMercado;
  vMercado=function(){
    if(MKT.tab==='sazus'){US.section='us';MKT.tab='lab'}
    if(MKT.tab==='lab'&&US.section==='us'){
      if(['semanas','eventos','cenarios','brasil'].includes(US.view))setTimeout(()=>loadExtra(),0);
      else if(US.view!=='calendar')setTimeout(()=>loadUs(),0);
      return renderUs();
    }
    const html=previousMarket.apply(this,arguments);
    return ['lab','saz','se'].includes(MKT.tab)?'<div class="pro-region" role="group" aria-label="Sazonalidade e sentimento"><button type="button" class="on" aria-pressed="true" data-usarea="br">Brasil · Sentimento</button><button type="button" data-usarea="us">EUA · Sazonalidade</button></div>'+html:html;
  };
  document.addEventListener('click',event=>{
    const compact=event.target.closest('[data-prodensity]');
    if(compact&&['comfortable','compact'].includes(compact.dataset.prodensity)){try{ls.set('diario-densidade-v284',compact.dataset.prodensity)}catch{}applyDensity();render();return}
    const area=event.target.closest('[data-usarea]');
    if(area&&['br','us'].includes(area.dataset.usarea)){US.section=area.dataset.usarea;MKT.tab='lab';render();return}
    const month=event.target.closest('[data-usmonth]');
    if(month){US.month=+month.dataset.usmonth;US.view='mensal';render();return}
    const view=event.target.closest('[data-usview]');
    if(view&&['mensal','calendar','ciclo','midterms'].includes(view.dataset.usview)){US.view=view.dataset.usview;render();return}
    if(event.target.closest('[data-usrefresh]'))loadUs(true);
    if(event.target.closest('[data-us-extra-refresh]'))loadExtra(true);
  });
  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.matches('[data-usview-select]')){US.view=target.value;render();return}
    if(target.matches('[data-uslookback]')){US.lookback=+target.value;paintUs()}
    if(target.matches('[data-useventcategory]')){US.eventCategory=target.value;paintUs()}
    if(target.matches('[data-usasset]')){US.asset=target.value;US.extra=null;US.extraAsset='';US.extraLast=0;paintUs();if(['semanas','eventos','cenarios','brasil'].includes(US.view))loadExtra()}
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
    return `<div class="wf-table"><table><thead><tr><th>Grupo declarado</th><th>Trades</th><th>Resultado por moeda</th><th>Média × risco</th><th>Positivos</th></tr></thead><tbody>${Object.entries(groups).map(([key,g])=>`<tr><th>${names[key]}</th><td>${g.n}</td><td>${moneyBy(g.currencies)}</td><td>${g.meanR==null?'—':g.meanR.toFixed(2)} <small>(${g.rCount} com risco)</small></td><td>${g.winRate==null?'—':g.winRate.toFixed(1)+'%'}</td></tr>`).join('')}</tbody></table></div><p class="wf-note">Classificação informada por você. Não mistura moedas e não prova causalidade. Amostras pequenas e operações diferentes limitam a comparação.</p>`;
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
/* módulo: carteira-periodos.js — v375: trilha contábil, conciliação anual e data de divulgação. */
(function(root){
 'use strict';
 const number=x=>typeof x==='number'&&Number.isFinite(x);
 const close=/^\d{4}-(03-31|06-30|09-30|12-31)$/;
 const currency=x=>{const s=String(x||'').trim().toUpperCase();return s==='R$'?'BRL':s==='US$'?'USD':/^[A-Z]{3}$/.test(s)?s:null};
 const quarter=p=>close.test(String(p||''))?Number(String(p).slice(5,7))/3:null;
 const label=p=>quarter(p)?quarter(p)+'T'+p.slice(2,4):String(p||'sem referência');
 const yearDate=x=>{const s=String(x||'');return /^\d{4}$/.test(s)?s+'-12-31':/^\d{4}-12-31$/.test(s)?s:null};
 const date=x=>{if(x==null||x==='')return null;const raw=String(x).trim();if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(raw))return null;const s=raw.slice(0,10),d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:null};
 const disclosureValue=x=>x?.data_divulgacao??x?.divulgado_em??x?.publicado_em??x?.published_at??x?.data_publicacao;
 const disclosure=x=>date(disclosureValue(x));
 // Quando uma fonte declara uma data inválida, não tratá-la como data desconhecida.
 // Datas ausentes continuam permitidas, mas claramente marcadas como não verificadas.
 const invalidDisclosure=x=>{const raw=disclosureValue(x);return raw!=null&&String(raw).trim()!==''&&!date(raw)};
 const accumulated=x=>[x?.tipo_periodo,x?.base_periodo,x?.escopo].some(v=>/^(ytd|ttm|anual|annual|acumulado|12m|9m|6m|3m-acum|ano|acumulado no ano|last 12 months)$/i.test(String(v||'').trim()));
 function previous(p){if(!close.test(p))return null;const y=Number(p.slice(0,4)),q=quarter(p),last=q===1?{y:y-1,q:4}:{y,q:q-1};return last.y+'-'+['03-31','06-30','09-30','12-31'][last.q-1]}
 const same=(a,b)=>Math.abs(a-b)<=Math.max(0.01,Math.abs(a)*1e-6,Math.abs(b)*1e-6);
 function normalize(sources,asOf,annualRows=[]){
  const validReference=date(asOf);const cutoff=validReference||'0000-01-01';
  const validSources=(Array.isArray(sources)?sources:[]).filter(s=>s&&Array.isArray(s.rows));
  const usable=(s,r)=>r&&close.test(String(r.periodo||''))&&r.periodo<=cutoff&&!invalidDisclosure(r)&&!invalidDisclosure(s)&&(!disclosure(r)||disclosure(r)<=cutoff)&&(!disclosure(s)||disclosure(s)<=cutoff)&&!accumulated(r)&&(number(r.receita)||number(r.lucro));
  // Prioriza a moeda do trimestre mais recente, não a ordem em que as fontes chegaram.
  // Uma captura histórica em outra moeda não pode descartar o último balanço disponível.
  const primaryCurrency=validSources.flatMap(s=>s.rows.filter(r=>usable(s,r))
    .map(r=>({periodo:r.periodo,moeda:currency(r.moeda)||currency(s.moeda)})))
    .filter(r=>r.moeda).sort((a,b)=>b.periodo.localeCompare(a.periodo))[0]?.moeda||null;
  const by=new Map(),rejected=[],conflicts=[],blocked=new Set(),derived=[],annualConflicts=[],reconciliations=[];
  for(const [index,source] of validSources.entries()){
   const srcCur=currency(source.moeda),origin=String(source.origem||'Fonte '+(index+1)).slice(0,100);
   for(const item of source.rows){
    const p=String(item?.periodo||'');
    if(!close.test(p)||p>cutoff||!number(item?.receita)&&!number(item?.lucro))continue;
    if(accumulated(item)){rejected.push({periodo:p,origem:origin,motivo:'valor acumulado ou anual não é trimestre isolado'});continue}
    if(invalidDisclosure(item)||invalidDisclosure(source)){rejected.push({periodo:p,origem:origin,motivo:'data de divulgação inválida na fonte; conferência necessária'});continue}
    if(disclosure(item)>cutoff||disclosure(source)>cutoff){rejected.push({periodo:p,origem:origin,motivo:'divulgação posterior à referência'});continue}
    const cur=currency(item.moeda)||srcCur;
    if(!cur||primaryCurrency&&cur!==primaryCurrency){rejected.push({periodo:p,origem:origin,motivo:!cur?'moeda não identificada':'moeda incompatível'});continue}
    if(!by.has(p))by.set(p,{periodo:p,receita:null,lucro:null,moeda:cur,origens:{},confirmacoes:{receita:[],lucro:[]},divulgadoEm:null,derivados:[]});
    const rec=by.get(p);
    if(rec.moeda!==cur){rejected.push({periodo:p,origem:origin,motivo:'moeda incompatível'});continue}
    const pub=disclosure(item)||disclosure(source);
    if(pub&&(!rec.divulgadoEm||rec.divulgadoEm<pub))rec.divulgadoEm=pub;
    for(const key of ['receita','lucro']){
     if(!number(item[key])||blocked.has(p+':'+key))continue;
     if(rec[key]===null){rec[key]=item[key];rec.origens[key]=origin;rec.confirmacoes[key].push(origin)}
     else if(!same(rec[key],item[key])){
      conflicts.push({periodo:p,campo:key,origens:[rec.origens[key],origin]});
      rec[key]=null;rec.origens[key]=null;rec.confirmacoes[key]=[];blocked.add(p+':'+key);
     }else if(!rec.confirmacoes[key].includes(origin))rec.confirmacoes[key].push(origin);
    }
   }
  }
  // Conciliação ANTES de calcular 4T; dois anuais conflitantes impedem derivação.
  const annualBy=new Map(),blockedAnnual=new Set();
  for(const [index,a] of (Array.isArray(annualRows)?annualRows:[]).entries()){
   if(!a||!primaryCurrency)continue;
   const period=yearDate(a.periodo||a.ano||a.date),cur=currency(a.moeda);
   if(!period||period>cutoff||cur!==primaryCurrency||invalidDisclosure(a)||disclosure(a)>cutoff)continue;
   if(!annualBy.has(period))annualBy.set(period,{periodo:period,moeda:cur,receita:null,lucro:null,origens:{}});
   const rec=annualBy.get(period),origin=String(a.origem||'Anual fonte '+(index+1)).slice(0,100);
   for(const key of ['receita','lucro']){
    const val=key==='receita'?(a.receita??a.revenue):(a.lucro??a.profit);
    if(!number(val)||blockedAnnual.has(period+':'+key))continue;
    if(rec[key]===null){rec[key]=val;rec.origens[key]=origin}
    else if(!same(rec[key],val)){
     annualConflicts.push({periodo:period,campo:key,origens:[rec.origens[key],origin]});
     rec[key]=null;rec.origens[key]=null;blockedAnnual.add(period+':'+key);
    }
   }
  }
  for(const annual of annualBy.values()){
   const period=annual.periodo,yr=period.slice(0,4),q1=by.get(yr+'-03-31'),q2=by.get(yr+'-06-30'),q3=by.get(yr+'-09-30');
   if(!q1||!q2||!q3)continue;
   const rec=by.get(period)||{periodo:period,receita:null,lucro:null,moeda:annual.moeda,origens:{},confirmacoes:{receita:[],lucro:[]},divulgadoEm:null,derivados:[]};
   let changed=false;
   for(const key of ['receita','lucro']){
    if(!number(annual[key])||blockedAnnual.has(period+':'+key)||blocked.has(period+':'+key))continue;
    if(![q1,q2,q3].every(q=>number(q[key])&&!blocked.has(q.periodo+':'+key)))continue;
    const calc=annual[key]-(q1[key]+q2[key]+q3[key]);
    if(!number(calc))continue;
    if(number(rec[key])){
     const total=rec[key]+q1[key]+q2[key]+q3[key];
     if(!same(total,annual[key])){
      reconciliations.push({periodo:period,campo:key,anual:annual[key],somaTrimestres:total});
      // Nunca usar 4T incompatível com anual oficial ou rastreável em somas YTD/TTM.
      // O trimestre original segue na fonte histórica, mas o valor normalizado é bloqueado.
      rec[key]=null;rec.origens[key]=null;rec.confirmacoes[key]=[];
      blocked.add(period+':'+key);
     }
     continue;
    }
    rec[key]=calc;rec.origens[key]='4T calculado: '+String(annual.origens[key]||'fonte secundária').slice(0,80);
    rec.derivados.push(key);derived.push({periodo:period,campo:key});changed=true;
   }
   if(changed)by.set(period,rec);
  }
  const quarters=[...by.values()].sort((a,b)=>b.periodo.localeCompare(a.periodo)).slice(0,12);
  const publicacoesNaoInformadas=quarters.filter(q=>!q.divulgadoEm).length;
  return {quarters,moeda:primaryCurrency,rejected,conflicts,derived,annualConflicts,reconciliations,publicacoesNaoInformadas,referenciaInvalida:!validReference};
 }
 function calculate(sources,asOf,annualRows=[]){
  const normalized=normalize(sources,asOf,annualRows),quarters=normalized.quarters,latest=quarters[0]||null;
  const empty={value:null,missing:[],reason:normalized.referenciaInvalida?'Data de referência inválida: não foi possível selecionar balanços com segurança.':'Nenhum trimestre isolado disponível',derivados:[]};
  if(!latest)return {...normalized,latest:null,ytd:{periodos:[],receita:{...empty},lucro:{...empty}},ttm:{periodos:[],receita:{...empty},lucro:{...empty}}};
  const known=new Map(quarters.map(q=>[q.periodo,q]));
  const q=quarter(latest.periodo),year=latest.periodo.slice(0,4);
  const ytdPeriods=Array.from({length:q},(_,i)=>year+'-'+['03-31','06-30','09-30','12-31'][i]);
  const ttmPeriods=[latest.periodo];for(let i=1;i<4;i++)ttmPeriods.unshift(previous(ttmPeriods[0]));
  function metric(periods,key){
   const missing=periods.filter(p=>!number(known.get(p)?.[key]));
   const conflicting=normalized.conflicts.filter(c=>c.campo===key&&periods.includes(c.periodo)).map(c=>c.periodo);
   const annualConflicting=normalized.annualConflicts.filter(c=>c.campo===key&&periods.includes(c.periodo)).map(c=>c.periodo);
   const reconciliationConflicting=normalized.reconciliations.filter(c=>c.campo===key&&periods.includes(c.periodo)).map(c=>c.periodo);
   const deriv=periods.filter(p=>known.get(p)?.derivados.includes(key));
   return {value:missing.length||!normalized.moeda?null:periods.reduce((sum,p)=>sum+known.get(p)[key],0),missing,derivados:deriv,
     reason:conflicting.length?'Divergência entre fontes em '+conflicting.map(label).join(', ')+'. Conferir CVM/RI':
     reconciliationConflicting.length?'Divergência entre anual e trimestres em '+reconciliationConflicting.map(label).join(', ')+'. Valores não somados. Conferir CVM/RI':
     annualConflicting.length&&missing.length?'Divergência nos anuais de '+annualConflicting.map(label).join(', ')+'. Conferir CVM/RI':
     missing.length?'Faltam '+missing.map(label).join(', '):!normalized.moeda?'Moeda contábil não confirmada':null};
  }
  const aggregate=periodos=>({periodos,inicio:periodos[0],fim:periodos.at(-1),receita:metric(periodos,'receita'),lucro:metric(periodos,'lucro')});
  return {...normalized,latest,ytd:aggregate(ytdPeriods),ttm:aggregate(ttmPeriods)};
 }
 root.CarteiraPeriodos={calculate,normalize,label,previous,quarter};
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
  // Logotipos reais de emissores americanos no PDF da Carteira. Mesma origem,
  // sem token e com degradação segura quando faltar imagem ou símbolo.
  const pdfIssuerMarks=new Map(),pdfCurrencyFlags=new Map();
  // Pares FX usam duas bandeiras do pacote local; não precisam de logotipo corporativo.
  const cachedCurrencyFlag=new Map();
  async function embedCurrencyFlag(country){
   if(cachedCurrencyFlag.has(country))return cachedCurrencyFlag.get(country);
   const controller=typeof AbortController==='function'?new AbortController():null;
   const timer=controller?setTimeout(()=>controller.abort(),1800):null;
   try{
    const response=await fetch('logos/fx/'+country.toLowerCase()+'.png',{
      cache:'force-cache',...(controller?{signal:controller.signal}:{})});
    if(!response.ok)return null;
    const embedded=await p.doc.embedPng(await response.arrayBuffer());
    cachedCurrencyFlag.set(country,embedded);return embedded;
   }catch(_){return null;}finally{if(timer!==null)clearTimeout(timer)}
  }
  for(const item of d.positions||[]){
   const ticker=String(item.position?.tk||'').toUpperCase();
   const pair=root.TraderAssetIdentity?.currencyPair(ticker);
   if(pair&&!pdfCurrencyFlags.has(ticker)){
    const baseFlag=await embedCurrencyFlag(pair.baseCountry);
    const quoteFlag=await embedCurrencyFlag(pair.quoteCountry);
    if(baseFlag&&quoteFlag)pdfCurrencyFlags.set(ticker,[baseFlag,quoteFlag]);
   }
   const logo=root.TraderAssetIdentity?.logoInfo(ticker);
   if(!logo?.local||pdfIssuerMarks.has(ticker))continue;
   try{const response=await fetch(logo.url,{cache:'force-cache'});
    if(response.ok)pdfIssuerMarks.set(ticker,await p.doc.embedPng(await response.arrayBuffer()));
   }catch(_){/* uma marca indisponível não bloqueia a exportação */}
  }
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
  // v365: mesma seleção para capa e páginas de cada ativo; não reaproveita PDF antigo.
  // Prioridade: snapshot do relatório selecionado, depois relatório individual salvo.
  function financialPeriods(tk,individual,model){
   const selected=input.selected||{},sources=[];
   const selectedFund=selected.tipo==='ativo'&&String(selected.tk||'').toUpperCase()===String(tk).toUpperCase()?selected.dados?.fundamentos||{}:{};
   if(Array.isArray(selectedFund.balancos_trimestrais_disponiveis))sources.push({rows:selectedFund.balancos_trimestrais_disponiveis,
    moeda:selectedFund.moeda_contabil||model?.financialCurrency,origem:'Relatório selecionado (Yahoo Finance)'});
   const matchingSources=Array.isArray(selected.dados?.balancos_trimestrais_da_fonte)
    ?selected.dados.balancos_trimestrais_da_fonte.filter(x=>String(x?.ticker||'').toUpperCase()===String(tk).toUpperCase()):[];
   for(const source of matchingSources)sources.push({rows:source.dados_trimestrais||[],moeda:source.moeda||model?.financialCurrency,
    origem:'Consolidado salvo ('+String(source.fonte||'Yahoo Finance')+')'});
   const f=individual?.dados?.fundamentos||{};
   if(Array.isArray(f.balancos_trimestrais_disponiveis))sources.push({rows:f.balancos_trimestrais_disponiveis,
    moeda:f.moeda_contabil||model?.financialCurrency,origem:'Relatório individual salvo (Yahoo Finance)'});
   // Dado anual de fonte secundária permite 4T por diferença com rastreabilidade.
   // Só preenche métricas não disponíveis quando os três trimestres anteriores são íntegros.
   const historical=Array.isArray(model?.annual)&&model.annual.length?model.annual:
     Array.isArray(f.evolucao_receita_lucro)&&f.evolucao_receita_lucro.length?f.evolucao_receita_lucro:
     Array.isArray(selectedFund.evolucao_receita_lucro)?selectedFund.evolucao_receita_lucro:[];
   const annual=historical.map(r=>({...r,moeda:r.moeda||f.moeda_contabil||selectedFund.moeda_contabil||model?.financialCurrency||matchingSources[0]?.moeda,
    origem:'Histórico anual secundário Yahoo Finance'}));
   return root.CarteiraPeriodos.calculate(sources,d.asOf,annual);
  }
  const periodValue=v=>v?.value===null||v?.value===undefined?'n/d':compactValue(v.value);
  const periodNum=v=>v?.value===null||v?.value===undefined?'Não disponível':num(v.value);
  const quarterName=root.CarteiraPeriodos.label;
  // Capa: mesma linguagem editorial do modelo, com métricas identificadas.
  p.pg=oldPage;p.y=60;p.rect(0,0,p.W,12,{fill:C.dk});p.t('GESTÃO DE CARTEIRA / FACTSHEET',p.M,p.y,{s:8,f:'b',c:C.ac});p.y=112;
  text('Relatório de Gestão\nde Carteira',{size:29,font:'b',gap:16});text((input.demo?'EDIÇÃO DEMONSTRATIVA · DADOS FICTÍCIOS':'Análise de investimentos')+' | '+d.asOf,{size:12,font:'b'});note('Desempenho, composição, proventos, risco e pesquisa fundamentalista por ativo.');
  p.y+=12;const cards=[['VALOR DAS POSIÇÕES',d.partial?'Cobertura parcial':money(d.total)],['RETORNO NO MÊS',pct(d.perf.monthReturn)],['RETORNO NO HISTÓRICO',pct(d.perf.return)]];const cw=p.CW/3;
  cards.forEach(([name,value],i)=>{p.rect(p.M+i*cw,p.y,cw-5,66,{fill:C.dk});p.t(name,p.M+i*cw+9,p.y+12,{s:6.4,f:'b',c:C.wh});p.t(value,p.M+i*cw+9,p.y+34,{s:13,f:'b',c:C.wh,w:cw-23})});p.y+=83;
  if(d.perf.available)lineChart([{name:'Carteira · base 100',color:'#087c55',points:d.perf.rows.map(r=>({date:r.date,value:r.index}))},{name:'IBOV',color:'#0b1b2b',points:d.perf.ib},{name:'CDI',color:'#d89824',points:d.perf.cdi}],'Evolução e referências','Índice de retorno calculado pelo aplicativo, com fluxos e proventos registrados. Séries completas alinhadas às mesmas datas; não é auditoria de rentabilidade.');
  else lineChart([{name:'Valor dos ativos · BRL',color:'#087c55',points:d.wealth}],'Evolução patrimonial',d.wealthRecorded?'Registros diários disponíveis, somente BRL. Mudanças na composição afetam a curva. Não mede rentabilidade.':'Valor dos ativos, sem caixa. Aportes, vendas e câmbio afetam o saldo; não mede rentabilidade.');
  note(input.demo?'DADOS FICTÍCIOS. Material ilustrativo para validar o formato; não representa uma carteira real.':'Documento privado. Posições atuais na exportação; análises armazenadas podem ter datas diferentes.');
  if(!d.perf.available)note(d.perf.reason);if(d.partial)note('Sem preço ou câmbio válido para: '+d.missing.join(', ')+'. Valores de custo não foram usados como cotação.');
  // Últimos períodos contábeis no começo do PDF: 2025 é histórico anual, não o último trimestre.
  const financeCoverage=d.positions.map(a=>({ticker:a.position.tk,classe:a.position.cl||'',summary:financialPeriods(a.position.tk,a.report,a.fundamental)}))
    .sort((a,b)=>a.ticker.localeCompare(b.ticker));
  const financeRecords=financeCoverage.filter(r=>r.summary.latest);
  const compactValue=v=>typeof v==='number'&&Number.isFinite(v)?(Math.abs(v)>=1e9?(v/1e9).toLocaleString('pt-BR',{maximumFractionDigits:2})+' bi':Math.abs(v)>=1e6?(v/1e6).toLocaleString('pt-BR',{maximumFractionDigits:2})+' mi':num(v)):'sem dado';
  page('01  Sumário executivo');
  text('A carteira reúne '+d.positions.length+' ativo(s). '+(d.partial?'A avaliação de mercado é parcial.':'O valor das posições com cotação é '+money(d.total)+'.')+' '+(d.top3!=null?'As três maiores posições representam '+pct(d.top3)+' do valor coberto.':''));
  heading('GUIA RÁPIDO — NÃO CONFUNDIR OS PERÍODOS');
  table(['Indicador','O que representa','Exemplo didático'],[
   ['Anual fechado','Exercício de 12 meses já encerrado','2025 = jan. a dez./2025'],
   ['Trimestre isolado','Receita/lucro de apenas 3 meses','3T26 = jul. a set./2026'],
   ['Acumulado (YTD)','Do início do ano até o último trimestre','9M26 = 1T + 2T + 3T'],
   ['Últimos 12 meses (TTM)','Quatro trimestres consecutivos','4T25 + 1T26 + 2T26 + 3T26']
  ],[24,39,37]);
  note('Atenção: NÃO compare o acumulado de 9 meses com o anual de 12 meses como se fossem a mesma janela. O YTD NÃO é previsão de fechamento; o TTM é histórico móvel, NÃO estimativa para o próximo ano.');
  heading('BALANÇOS — ÚLTIMO TRIMESTRE IDENTIFICADO');
  if(financeRecords.length){
    table(['Ativo','Trimestre','Receita isolada','Lucro isolado','Moeda'],financeRecords.slice(0,16).map(r=>[r.ticker,quarterName(r.summary.latest.periodo),compactValue(r.summary.latest.receita),compactValue(r.summary.latest.lucro),String(r.summary.moeda||'n/c')]),[15,19,26,25,15]);
    heading('ACUMULADO NO ANO (YTD) E ÚLTIMOS 12 MESES (TTM)');
    table(['Ativo','Receita YTD','Lucro YTD','Receita TTM','Lucro TTM'],financeRecords.slice(0,16).map(r=>[r.ticker,periodValue(r.summary.ytd.receita),periodValue(r.summary.ytd.lucro),periodValue(r.summary.ttm.receita),periodValue(r.summary.ttm.lucro)]),[14,22,21,22,21]);
    note('Cobertura contábil armazenada: '+financeRecords.length+' de '+d.positions.length+' ativos da carteira têm ao menos um trimestre. Alguns ativos não possuem divulgação trimestral aplicável.');
    note('YTD = trimestres isolados desde janeiro; TTM = quatro trimestres consecutivos. n/d = período ausente, moeda não confirmada ou valores divergentes. Dados não são interpolados.');
    note('Fonte: Yahoo Finance (secundária). Encerramento NÃO é divulgação. 4T calculado, quando houver, significa ANUAL menos 9M na mesma moeda; nunca é tratado como publicação oficial. Confira CVM/RI.');
    const nDisclosureUnknown=financeRecords.filter(r=>r.summary.publicacoesNaoInformadas>0).length;
    if(nDisclosureUnknown)note('Datas de divulgação não informadas pela fonte secundária em '+nDisclosureUnknown+' ativo(s); nenhum desses encerramentos comprova publicação oficial. Valores posteriores à referência são descartados quando uma data de divulgação é fornecida.');
  }else note('Nenhum trimestre isolado identificado no relatório salvo. O último anual fechado NÃO comprova a atualização dos balanços de 2026.');
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
  // v369: auditoria de cobertura antes das fichas individuais. Um encerramento
  // contábil NÃO é uma data de divulgação; ausência de dados NÃO implica atraso da companhia.
  const endedQuarter=(()=>{const year=Number(d.asOf.slice(0,4)),month=Number(d.asOf.slice(5,7)),q=Math.floor((month-1)/3);return q?year+'-'+['03-31','06-30','09-30','12-31'][q-1]:(year-1)+'-12-31'})();
  const financeStats={total:financeCoverage.length,withQuarter:financeRecords.length,
    current:financeRecords.filter(r=>r.summary.latest.periodo>=endedQuarter).length,
    unverified:financeRecords.filter(r=>r.summary.publicacoesNaoInformadas>0).length};
  page('06  Auditoria e cobertura dos balanços','Mapa de cobertura na fonte secundária · '+d.asOf);
  heading('MAPA DE COBERTURA DO TRIMESTRE ENCERRADO');
  note('Último trimestre calendário encerrado até a referência: '+quarterName(endedQuarter)+'. A empresa pode ainda não ter divulgado o resultado. O aplicativo não infere publicação a partir da data de encerramento.');
  if(financeCoverage.length){
    table(['Ativo','Último trimestre salvo','Moeda','Divulgação','Situação'],financeCoverage.map(r=>{
      const a=r.summary,ultimo=a.latest;
      return [r.ticker,ultimo?quarterName(ultimo.periodo):'sem trimestre',a.moeda||'n/c',ultimo?(ultimo.divulgadoEm||'não informada'):'não informada',
        !ultimo?'sem dados na fonte':ultimo.periodo>=endedQuarter?'trimestre registrado':'aguardando coleta / publicação'];
    }),[16,25,12,23,24]);
    note('Cobertura: '+financeStats.withQuarter+'/'+financeStats.total+' ativos com algum trimestre; '+financeStats.current+' com '+quarterName(endedQuarter)+' ou posterior; '+financeStats.unverified+' com datas de divulgação ausentes em parte do histórico.');
    note('Situação “aguardando coleta / publicação” NÃO afirma que a empresa esteja atrasada: pode ser ausência da captura Yahoo Finance, empresa sem divulgação aplicável ou demonstração ainda não apresentada. Verifique RI/CVM.');
  }else empty('Nenhuma posição disponível para auditar nesta exportação.');
  for(const a of d.positions){const position=a.position,report=a.report,meta={...a.meta,fs:{...(a.meta?.fs||{}),...(report?.dados?.fundamentos||{})}},detail=R.detail(position,input.ledger||[],d.asOf);page(position.tk+'  |  Pesquisa do ativo',(position.nome||a.meta?.nome||'')+' · '+(position.cl||'Classe não informada')+' · '+(position.moeda||detail.unit),true);
    const issuerMark=pdfIssuerMarks.get(String(position.tk||'').toUpperCase());
    const pairFlags=pdfCurrencyFlags.get(String(position.tk||'').toUpperCase());
    if(pairFlags){
      p.pg.drawImage(pairFlags[0],{x:p.W-p.M-41,y:p.H-130,width:25,height:25});
      p.pg.drawImage(pairFlags[1],{x:p.W-p.M-25,y:p.H-130,width:25,height:25});
    }else if(issuerMark)p.pg.drawImage(issuerMark,{x:p.W-p.M-28,y:p.H-130,width:25,height:25});
   table(['Posição','Valor','Fundamento','Indicador'],Array.from({length:Math.max(6,root.TraderReports.fundamentalRows(position,meta).length)},(_,i)=>{const holding=[['Quantidade',num(position.q,4)],['Cotação',position.tem?num(position.pa):'Sem cotação'],['Preço médio',num(position.pm,4)],['Valor BRL',money(a.value)],['Proventos do ciclo',num(detail.income)+' '+detail.unit],['Peso coberto',a.value!=null&&d.total>0?pct(a.value/d.total*100):'Indisponível']][i]||['',''];const f=root.TraderReports.fundamentalRows(position,meta)[i]||['',''];return [...holding,...f]}),[24,23,30,23]);
   const f=report?.dados?.fundamentos;
   const periods=financialPeriods(position.tk,report,a.fundamental),quarters=periods.quarters;
   const latestQuarterDate=periods.latest?.periodo||f?.data_ultimo_trimestre_na_fonte||meta.fs.ref||meta.fs.data_referencia||'não confirmada';
   note('Cotação: '+(position.pxEm||'sem data')+'. Referência contábil da fonte: '+latestQuarterDate+'. Proventos do ciclo desde '+(detail.cycleStart||'não identificado')+'. Preço médio é cadastral; ajustes por renda são gerenciais.');
   if(position.cl==='acao'||position.cl==='bdr'||position.cl==='acao_ext'){
    heading('Resultados trimestrais disponíveis');
    if(quarters.length){
     const quarterCurrency=periods.moeda||'moeda contábil não confirmada';
     table(['Trimestre','Encerramento','Receita isolada','Lucro isolado','Moeda'],quarters.map(r=>[quarterName(r.periodo),String(r.periodo),num(r.receita),num(r.lucro),String(r.moeda||quarterCurrency)]),[15,19,25,26,15]);
     note('Trimestre isolado = APENAS três meses. 3T26 é julho a setembro, não janeiro a setembro. Fonte identificada no campo de rastreabilidade; data do encerramento NÃO indica publicação oficial. Verifique no RI/CVM.');
     const latestAudit=periods.latest;
     note('RASTREABILIDADE DO ÚLTIMO TRIMESTRE — Receita: '+String(latestAudit.origens.receita||'n/d')+'; lucro: '+String(latestAudit.origens.lucro||'n/d')+'; divulgação: '+(latestAudit.divulgadoEm||'não informada')+'. Duas capturas da mesma fonte não significam auditoria independente.');
     if(periods.derived.length)note('ATENÇÃO — 4T calculado por diferença, não divulgado isoladamente: '+periods.derived.map(r=>quarterName(r.periodo)+' ('+r.campo+')').join(', ')+'. Fórmula: anual menos (1T + 2T + 3T), na mesma moeda. Conferir nas demonstrações oficiais.');
     if(periods.conflicts.length)note('DIVERGÊNCIA ENTRE FONTES — números conflitantes foram omitidos: '+periods.conflicts.map(r=>quarterName(r.periodo)+' ('+r.campo+')').join(', ')+'. Conferir CVM/RI; não usar estes valores em YTD/TTM.');
     if(periods.annualConflicts.length)note('DIVERGÊNCIA EM DADOS ANUAIS — não foi calculado 4T para os indicadores conflitantes: '+periods.annualConflicts.map(r=>quarterName(r.periodo)+' ('+r.campo+')').join(', ')+'.');
     if(periods.reconciliations.length)note('DIVERGÊNCIA ENTRE ANUAL E QUATRO TRIMESTRES — conferir consolidação, unidades e demonstrações CVM/RI: '+periods.reconciliations.map(r=>quarterName(r.periodo)+' ('+r.campo+')').join(', ')+'. O valor original foi preservado na fonte histórica, mas o campo divergente NÃO entra no YTD/TTM até conferência.');
     if(periods.publicacoesNaoInformadas)note('DATAS DE DIVULGAÇÃO — '+periods.publicacoesNaoInformadas+' de '+quarters.length+' trimestres não possuem data de publicação verificável nesta fonte; o encerramento do período não comprova divulgação.');
     const asOfQuarter=(()=>{const yr=Number(d.asOf.slice(0,4)),mo=Number(d.asOf.slice(5,7)),q=Math.floor((mo-1)/3);return q?yr+'-'+['03-31','06-30','09-30','12-31'][q-1]:(yr-1)+'-12-31'})();
     if(periods.latest.periodo<asOfQuarter)note('LACUNA DE COBERTURA — o último trimestre registrado ('+quarterName(periods.latest.periodo)+') é anterior ao trimestre calendário encerrado ('+quarterName(asOfQuarter)+'). O balanço pode ainda não ter sido divulgado ou a fonte secundária pode não estar atualizada.');
     heading('TRÊS VISÕES DOS RESULTADOS');
     table(['Janela','Receita','Lucro líquido','O que significa'],[
      [quarterName(periods.latest.periodo),num(periods.latest.receita),num(periods.latest.lucro),'Trimestre isolado (3 meses)'],
      ['Acumulado YTD',periodNum(periods.ytd.receita),periodNum(periods.ytd.lucro),'Jan. a '+quarterName(periods.latest.periodo)],
      ['TTM · 12 meses',periodNum(periods.ttm.receita),periodNum(periods.ttm.lucro),'Quatro trimestres consecutivos']
     ],[22,25,25,28]);
     const explainMissing=(name,record)=>{
       const parts=['receita','lucro'].filter(key=>record[key].value==null).map(key=>key+': '+(record[key].reason||'não disponível'));
       if(parts.length)note(name+' não calculado totalmente: '+parts.join(' | ')+'. Não foram estimados períodos ausentes.');
     };
     note('YTD = soma dos trimestres isolados desde janeiro até '+quarterName(periods.latest.periodo)+'. TTM = soma de '+periods.ttm.periodos.map(quarterName).join(' + ')+'. Não são a mesma base: não compare diretamente 9 meses de YTD com 12 meses do anual ou TTM.');
     explainMissing('Acumulado YTD',periods.ytd);
     explainMissing('TTM',periods.ttm);
     if(periods.rejected.length)note('REGISTROS NÃO UTILIZADOS — motivo por período: '+periods.rejected.map(r=>quarterName(r.periodo)+' ('+r.motivo+')').join(', ')+'. Data explícita inválida é bloqueada, não interpretada como divulgação conhecida; não foram presumidas moedas nem datas de publicação.');
     const W={p,heading:(title)=>heading(title),text:(value)=>note(value)};
     const chronological=[...quarters].reverse();
     if(chronological.some(r=>Number.isFinite(r.receita)))
       root.TraderReports.researchChart(W,chronological.map(r=>({date:quarterName(r.periodo),value:r.receita})),'Receita TRIMESTRAL · somente 3 meses',quarterCurrency,'bar');
     if(chronological.some(r=>Number.isFinite(r.lucro)))
       root.TraderReports.researchChart(W,chronological.map(r=>({date:quarterName(r.periodo),value:r.lucro})),'Lucro líquido TRIMESTRAL · somente 3 meses',quarterCurrency,'bar');
    }
    else note('Série trimestral ainda não identificada neste relatório salvo. Os exercícios anuais NÃO comprovam a atualização dos balanços de 2026. Gere novo relatório depois da atualização do servidor e confira o RI da empresa.');
   }
   const annual=a.fundamental?.annual?.length?a.fundamental.annual.map(r=>({ano:r.date,receita:r.revenue,lucro:r.profit})):Array.isArray(f?.evolucao_receita_lucro)?f.evolucao_receita_lucro:[];
   if(annual.length){heading('ANUAL FECHADO · 12 MESES (HISTÓRICO)');table(['Ano','Receita','Lucro líquido'],annual.map(r=>[String(r.ano),num(r.receita),num(r.lucro)]),[20,40,40]);note('Anual = exercício completo da companhia, geralmente janeiro a dezembro quando o ano fiscal coincide com o calendário. Não é YTD parcial nem projeção. Verifique a data de encerramento fiscal no RI/CVM. Moeda contábil: '+(a.fundamental?.financialCurrency||f?.moeda_contabil||'não confirmada')+'.');}
   if(a.fundamental?.annual?.length){
    const series=a.fundamental.annual;
    const W={p,heading:(title)=>heading(title),text:(value)=>note(value)};
    root.TraderReports.researchChart(W,series.map(r=>({date:r.date,value:r.revenue})),'Receita ANUAL · 12 meses fechados',a.fundamental.financialCurrency||'Moeda contábil não confirmada','bar');
    root.TraderReports.researchChart(W,series.map(r=>({date:r.date,value:r.profit})),'Lucro líquido ANUAL · 12 meses fechados',a.fundamental.financialCurrency||'Moeda contábil não confirmada','bar');
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
  heading('Conceitos dos indicadores financeiros');
  text('ANUAL FECHADO: janeiro a dezembro de um exercício completo. TRIMESTRE ISOLADO: apenas três meses. YTD: soma do 1T ao trimestre mais recente do mesmo ano (por exemplo, 9 meses até o 3T). TTM: soma dos últimos quatro trimestres consecutivos, mesmo que cruzem dois anos.');
  text('O aplicativo calcula YTD e TTM somente com todas as parcelas trimestrais individuais e a moeda identificada, sem extrapolações. Se faltar 4T anterior, por exemplo, o TTM é omitido. Os números vêm de fonte secundária, sem conferência automática com a publicação da empresa; 31/03, 30/06, 30/09 e 31/12 representam encerramento, não data de divulgação.');
  text('Receita e lucro são fluxos do período e podem ser somados entre trimestres comparáveis. Estoques de balanço como caixa, dívida ou patrimônio líquido NÃO devem ser somados, por serem saldos de uma data. Empresas com calendário fiscal não coincidente ou fontes com moedas diferentes exigem tratamento específico.');
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
    p.rect(0,0,p.W,128,{fill:p.C.dk});
    // Capa editorial nas revistas e jornais: fotografia ilustrativa, nunca cotação ou notícia.
    try{
      if(/revista|jornal|giro/i.test(String(title))&&typeof fetch==='function'){
        const response=await fetch('editorial-mercado-v379.jpg?v=379');
        if(response.ok){const jpg=await p.doc.embedJpg(await response.arrayBuffer());
          p.pg.drawImage(jpg,{x:p.W*.46,y:p.H-128,width:p.W*.54,height:128,opacity:.62});}
      }
    }catch(_){/* sem internet, o cabeçalho sólido original permanece legível */}
    p.t('DIÁRIO DE TRADER · PESQUISA',p.M,25,{s:9,f:'b',c:p.C.li});
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
const LS_LISTA='aulas-lista-v1',LS_ROT='aulas-rot-v1:',LS_POS='aulas-pos-v1:',LS_VOZ='aulas-voz',LS_VEL='aulas-vel',LS_NMODE='aulas-neural-mode',LS_NVOICE='aulas-neural-voice';
const AU={lista:null,busy:0,err:'',ts:0};
const IC={"prev": "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6 5h2v14H6zM20 5v14L9 12z\"/></svg>", "next": "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M16 5h2v14h-2zM4 5v14l11-7z\"/></svg>", "play": "<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M7 4v16l13-8z\"/></svg>", "pause": "<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6 4h4v16H6zM14 4h4v16h-4z\"/></svg>", "x": "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg>", "menu": "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M4 7h16M4 12h16M4 17h16\"/></svg>"};
const P={on:0,a:null,i:0,j:0,tok:0,play:0,t:0,wd:0,dados:{},vis:'',wl:null,aiImgs:{},aiBusy:0,nAudio:{},nEl:null,nBusy:0};
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ownerKey=()=>window.DIARIO_DEMO?'demo':((typeof SESS!=='undefined'&&SESS&&SESS.uid)||null);
let aulaOwner=ownerKey();
const storageKey=k=>/^aulas-(lista|rot|pos|job)/.test(k)?(ownerKey()?'aulas-v318:'+ownerKey()+':'+k:null):k;
function assertOwner(owner){if(owner!==ownerKey()){const e=new Error('A conta mudou. A operação anterior foi interrompida.');e.code='SESSION_CHANGED';throw e}}
const lsg=(k,d)=>{try{const key=storageKey(k);if(!key)return d;const v=localStorage.getItem(key);return v==null?d:JSON.parse(v)}catch{return d}};
const lsd=k=>{try{const key=storageKey(k);if(key)localStorage.removeItem(key)}catch{}};
const lss=(k,v)=>{try{const key=storageKey(k);if(key)localStorage.setItem(key,JSON.stringify(v))}catch{}};
const nf=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const brl=v=>(v<0?'-':'')+'R$ '+nf(Math.abs(v),2);
const pct=v=>(v>0?'+':v<0?'-':'')+nf(Math.abs(v),1)+'%';
const logado=()=>{try{return !!(typeof SESS!=='undefined'&&SESS&&SESS.uid&&cfg())}catch{return false}};

function ensureOwner(){
 const next=ownerKey();if(next===aulaOwner)return;aulaOwner=next;
 para();P.on=0;P.a=null;P.dados={};P.aiImgs={};P.aiBusy=0;neuralStop();piperRelease();P.nAudio={};document.getElementById('aup')?.remove();document.getElementById('au338-modal')?.remove();document.getElementById('auModal')?.remove();document.documentElement.classList.remove('au-aberto');
 clearTimeout(salvaPos.t);AU.lista=null;AU.busy=0;AU.err='';AU.ts=0;
 if(typeof G!=='undefined'){G.aberto=0;G.livros=null;G.sel='';G.caps={};G.manual='';G.numero='';G.busy=0;G.msg='';G.erro='';G.pdfTask?.destroy?.();G.pdfTask=null;G.request?.abort();G.request=null}
}
/* ---------- dados ---------- */
async function carregaLista(forca){
  ensureOwner();const owner=ownerKey();if(AU.busy)return;
  if(!logado()){AU.lista=(window.AULAS_LOCAIS||[]).filter(x=>x.local);AU.err=AU.lista.length?'':'login';return}
  if(!forca&&AU.lista&&Date.now()-AU.ts<60000)return;
  AU.busy=1;AU.err='';
  try{
    await tok();
    const r=await rq('/rest/v1/aulas?select=id,livro,numero,titulo,capitulos,progresso,criado_em,status,min:roteiro->min&user_id=eq.'+SESS.uid+'&order=livro.asc,numero.asc');
    const l=await r.json();assertOwner(owner);AU.lista=(Array.isArray(l)?l:[]).concat(window.AULAS_LOCAIS||[]);lss(LS_LISTA,l);AU.ts=Date.now();
  }catch(e){if(owner!==ownerKey())return;AU.lista=lsg(LS_LISTA,[]);AU.err=/aulas|schema cache|404/.test(String(e.message||e))?'tabela':String(e.message||e)}
  AU.busy=0;pinta();
  document.dispatchEvent(new CustomEvent('diario:aulas-carregadas'));
}
async function roteiro(a){
  const owner=ownerKey();
  if(a.roteiro)return a.roteiro;
  const c=lsg(LS_ROT+a.id,null);
  if(c&&c.em===a.criado_em)return c.r;
  await tok();
  const r=await rq('/rest/v1/aulas?select=roteiro&id=eq.'+a.id),l=await r.json();
  assertOwner(owner);if(!l[0])throw new Error('Aula não encontrada.');
  lss(LS_ROT+a.id,{em:a.criado_em,r:l[0].roteiro});
  return l[0].roteiro;
}
function salvaPos(fim){
  const a=P.a;if(!a||a._owner!==ownerKey())return;
  const pos={cena:P.i,total:a.r.cenas.length,fim:fim?1:((lsg(LS_POS+a.id,{})||{}).fim||0),em:new Date().toISOString()};
  lss(LS_POS+a.id,pos);
  if(!a.local&&logado()){clearTimeout(salvaPos.t);salvaPos.t=setTimeout(()=>{rq('/rest/v1/aulas?id=eq.'+a.id,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({progresso:pos,atualizado_em:pos.em})}).catch(()=>{})},1500)}
}
const posDe=a=>{const l=lsg(LS_POS+a.id,null),s=a.progresso||{};return(l&&(!s.em||l.em>=s.em))?l:s};


/* v316: organização local por conta; nenhum pedido adicional à IA. */
const ST={query:'',filter:'all'};
const studyKey=()=> 'estudos-v316:'+((typeof SESS!=='undefined'&&SESS&&SESS.uid)||'local');
function studyData(){const d=lsg(studyKey(),{});return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}
function studySave(d){try{localStorage.setItem(studyKey(),JSON.stringify(d));return true}catch{toast&&toast('Não foi possível salvar neste aparelho.');return false}}
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const progress=a=>{const p=posDe(a);return p.fim?100:p.total?Math.max(0,Math.min(99,Math.round(100*(Number(p.cena)||0)/p.total))):0};
function studyDashboard(){
 const all=(AU.lista||[]).filter(a=>a.status!=='gerando'),d=studyData(),done=all.filter(a=>posDe(a).fim).length;
 const last=all.filter(a=>posDe(a).em&&!posDe(a).fim).sort((a,b)=>String(posDe(b).em).localeCompare(String(posDe(a).em)))[0];
 return `<section class="card au-dashboard"><div class="au-dash-label">SEU ESPAÇO DE APRENDIZADO</div><h2>Uma aula de cada vez.</h2><div class="au-dash-stats"><span><b>${all.length}</b> aulas</span><span><b>${done}</b> concluídas</span><span><b>${all.filter(a=>d.fav?.[a.id]).length}</b> favoritas</span></div>${last?`<button class="btn" data-auopen="${h(last.id)}">Continuar · ${h(last.titulo)} <small>${progress(last)}%</small></button>`:'<div class="sm mut">Escolha uma aula para começar. Seu progresso fica salvo.</div>'}<p class="sm mut">Favoritos e anotações ficam neste aparelho, separados por conta.</p></section>
 <div class="au-study-tools"><label for="au-search" class="sm mut">Buscar por livro, título ou capítulo</label><input id="au-search" type="search" placeholder="Encontre sua próxima aula…" value="${h(ST.query)}"><div class="au-study-filters" role="group" aria-label="Filtrar aulas">${[['all','Todas'],['progress','Em andamento'],['done','Concluídas'],['fav','Favoritas']].map(([k,t])=>`<button type="button" data-austfilter="${k}" aria-pressed="${ST.filter===k}" class="btn s${ST.filter===k?' on':''}">${t}</button>`).join('')}</div></div>`;
}
function studyMatch(a){const p=posDe(a),d=studyData();return (!ST.query||norm([a.livro,a.titulo,a.capitulos].join(' ')).includes(norm(ST.query)))&&(ST.filter==='all'||ST.filter==='done'&&p.fim||ST.filter==='progress'&&!p.fim&&!!p.em||ST.filter==='fav'&&d.fav?.[a.id])}
function studyPanel(){
 if(!P.a)return;para();
 const a=P.a,d=studyData(),notes=d.notes?.[a.id]||[],c=a.r.cenas[P.i];
 document.getElementById('au-study-panel')?.remove();
 document.getElementById('aup').insertAdjacentHTML('beforeend',`<section id="au-study-panel" class="au-study-panel" role="dialog" aria-modal="true" aria-label="Caderno da aula"><div class="au-study-sheet"><button class="btn s" data-austclose="1">Fechar caderno</button><h2>Meu caderno</h2><p>${h(a.titulo)} · Cena ${P.i+1}</p><p class="sm mut">${h(c.titulo||'Cena atual')}</p><label for="au-note">Anotação sobre esta cena</label><textarea id="au-note" maxlength="4000" rows="4" placeholder="O que entendi? Como vou aplicar?"></textarea><button class="btn" data-austsave="1">Salvar anotação</button><p class="sm mut" role="status" id="au-note-status"></p><button class="btn s" data-austexport="1"${notes.length?'':' disabled'}>Baixar notas (.txt)</button><h3>Trechos salvos</h3><div>${notes.length?notes.map(n=>`<article><button class="btn s" data-austjump="${n.scene}">Ir à cena ${n.scene+1}</button><p>${h(n.text)}</p><button class="btn s" data-austdelete="${h(n.id)}">Excluir anotação</button></article>`).join(''):'<p class="sm mut">Suas anotações aparecerão aqui.</p>'}</div></div></section>`);
 document.getElementById('au-note').focus();
}
function studyExport(){const notes=studyData().notes?.[P.a.id]||[];if(!notes.length)return;const text=[P.a.titulo,P.a.livro,'',...notes.map(n=>`Cena ${n.scene+1} · ${n.title}\n${n.text}\n`)].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const el=document.createElement('a');el.href=url;el.download='anotacoes-aula.txt';el.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
document.addEventListener('input',e=>{if(e.target.id!=='au-search')return;const start=e.target.selectionStart;ST.query=e.target.value;pinta();const f=document.getElementById('au-search');f?.focus();try{f?.setSelectionRange(start,start)}catch{}});
document.addEventListener('click',e=>{let b=e.target.closest('[data-austfilter]');if(b){ST.filter=b.dataset.austfilter;pinta();return}b=e.target.closest('[data-austfav]');if(b){const d=studyData(),id=b.dataset.austfav;d.fav=d.fav||{};d.fav[id]=!d.fav[id];if(studySave(d))pinta();return}
 if(e.target.closest('[data-austnotes]')){studyPanel();return}
 if(e.target.closest('[data-austclose]')||e.target.id==='au-study-panel'){document.getElementById('au-study-panel')?.remove();document.querySelector('[data-austnotes]')?.focus();return}
 if(e.target.closest('[data-austsave]')){const f=document.getElementById('au-note'),text=f.value.trim();if(!text){document.getElementById('au-note-status').textContent='Escreva uma anotação antes de salvar.';return}const d=studyData();d.notes=d.notes||{};const list=d.notes[P.a.id]=d.notes[P.a.id]||[];list.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),scene:P.i,title:P.a.r.cenas[P.i].titulo||'',text,em:new Date().toISOString()});if(studySave(d)){studyPanel();document.getElementById('au-note-status').textContent='Anotação salva neste aparelho.'}return}
 if(e.target.closest('[data-austexport]')){studyExport();return}
 b=e.target.closest('[data-austdelete]');if(b){const d=studyData();d.notes[P.a.id]=d.notes[P.a.id].filter(n=>n.id!==b.dataset.austdelete);if(studySave(d))studyPanel();return}
 b=e.target.closest('[data-austjump]');if(b){document.getElementById('au-study-panel')?.remove();cena(Number(b.dataset.austjump),0);return}
});
document.addEventListener('au-study-pause',()=>{if(P.on)para()});
const studyStyle=document.createElement('style');studyStyle.textContent=`
.au-dashboard{background:linear-gradient(125deg,var(--card,#132135),var(--bg,#0e1929));border:1px solid #2a6a68;padding:20px}.au-dash-label{font-size:10px;letter-spacing:.14em;color:var(--mut,#81cbbf)}.au-dashboard h2{font-size:24px;margin:9px 0 16px}.au-dash-stats{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:18px}.au-dash-stats b{display:block;font-size:24px}.au-dashboard>.btn{max-width:100%;white-space:normal;text-align:left}.au-dashboard small{margin-left:6px}.au-study-tools{margin:14px 0}.au-study-tools input{width:100%;box-sizing:border-box;margin:6px 0 10px;min-height:44px}.au-study-filters{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px}.au-study-filters .btn{white-space:nowrap;min-height:40px}.au-study-filters [aria-pressed=true]{background:#16594f;color:#fff;border-color:#56d5b1}.au-study-row{display:flex;align-items:center;gap:5px}.au-study-row .au-item{flex:1;min-width:0}.au-fav{flex-shrink:0;background:transparent;color:var(--mut,#8c9eb6);border:1px solid var(--line,#405064);border-radius:12px;min-width:42px;min-height:42px;font-size:22px}.au-fav[aria-pressed=true]{color:#d7a82a}.au-study-panel{position:absolute;inset:0;z-index:150;background:#000b;display:flex;justify-content:flex-end}.au-study-sheet{background:#101c2d;color:#edf4fa;max-width:520px;width:100%;padding:20px;overflow:auto;box-sizing:border-box}.au-study-sheet textarea{display:block;box-sizing:border-box;width:100%;color:#edf4fa;background:#172638;border:1px solid #51647a;border-radius:12px;padding:12px;margin:8px 0;resize:vertical;font:16px/1.5 system-ui}.au-study-sheet article{border-top:1px solid #405064;margin-top:15px;padding-top:15px}.au-study-sheet article p{white-space:pre-wrap;overflow-wrap:anywhere}.au-study-sheet .btn{margin:4px 0}.aup-ctl{flex-wrap:wrap}.aup{overflow-y:auto}.au-study-note-btn{width:auto!important;font-size:12px!important;padding:9px!important}.au-study-row .au-tx{min-width:0;overflow-wrap:anywhere}.au-study-row .au-tx b{white-space:normal}@media(prefers-reduced-motion:reduce){.aup *{animation:none!important;transition:none!important}}
`;document.head.appendChild(studyStyle);

/* ---------- lista na aba Estudos ---------- */
function listaHtml(){
  ensureOwner();
  if(AU.lista==null){carregaLista();if(AU.lista==null)return'<div class="card"><div class="sm mut">Carregando aulas…</div></div>'}
  let o='';
  if(AU.err==='login')o+='<div class="card warn"><b>Entre na sua conta</b><div class="sm">As aulas ficam guardadas no Supabase. Entre em Mais → Conta para ver a lista.</div></div>';
  else if(AU.err==='tabela')o+='<div class="card warn"><b>Falta a tabela "aulas" no Supabase</b><div class="sm">Rode o SQL de aulas (supabase-aulas.sql).</div></div>';
  else if(AU.err)o+=`<div class="card warn"><b>Não consegui carregar as aulas</b><div class="sm">${h(AU.err)}</div><button class="btn s" data-aurel="1">Tentar de novo</button></div>`;
  o+=studyDashboard();const visible=AU.lista.filter(studyMatch);const g={};for(const a of visible)(g[a.livro]=g[a.livro]||[]).push(a);
  o+=novaHtml();if(AU.lista.length&&!visible.length)o+='<div class="card sm mut">Nenhuma aula neste filtro. Experimente outra busca ou Todas.</div>';
  if(!AU.lista.length&&!AU.err&&!G.aberto)o+='<div class="card"><b>Nenhuma aula ainda</b><div class="sm mut">Toque em “Nova aula”, envie o PDF do livro e escolha os capítulos.</div></div>';
  for(const[livro,L]of Object.entries(g)){
    o+=`<div class="card au-livro"><div class="au-lt">${h(livro)}</div>`;
    for(const a of L){
      if(a.status==='gerando'){o+=gerandoHtml(a);continue}
      const p=posDe(a),feito=p.fim,pc=progress(a);
      o+=`<div class="au-study-row"><button class="au-item" data-auopen="${h(a.id)}"><span class="au-n">${feito?'✓':a.numero}</span><span class="au-tx"><b>Aula ${a.numero} · ${h(a.titulo)}</b><span class="sm mut">${h(a.capitulos?'Capítulos '+a.capitulos:'')}${a.roteiro_min||a.min?' · ~'+(a.roteiro_min||a.min)+' min':''}${feito?' · concluída':pc?' · parou em '+pc+'%':''}</span>${pc&&!feito?`<span class="au-pb"><i style="width:${pc}%"></i></span>`:''}</span><span class="au-play">▶</span></button><button class="au-fav" type="button" data-austfav="${h(a.id)}" aria-label="Favoritar ${h(a.titulo)}" aria-pressed="${!!studyData().fav?.[a.id]}">${studyData().fav?.[a.id]?'★':'☆'}</button></div>`;
    }
    o+='</div>';
  }
  o+='<div class="sm mut" style="margin:6px 2px 14px">PDFs locais agora ficam separados por conta. Reimporte os PDFs das versões anteriores se precisar gerar novas aulas. <button class="lnk sm" data-aulegacyclear="1">Remover PDFs antigos deste aparelho</button></div>';
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
  ensureOwner();const owner=ownerKey();if(P.on){if(P.a?.id===id){au361Expand();return}fecha()}let a=(AU.lista||[]).find(x=>x.id===id)||(window.AULAS_LOCAIS||[]).find(x=>x.id===id);
  if(!a)return;
  try{toast&&toast('Abrindo a aula…');const r=await roteiro(a);assertOwner(owner);P.a={...a,r,_owner:owner};}catch(e){toast&&toast('Não abriu: '+(e.message||e));return}
  P.on=1;P.dados={};P.aiImgs={};P.aiBusy=0;P.nAudio={};const pos=posDe(a);P.i=pos.fim?0:Math.min(pos.cena||0,P.a.r.cenas.length-1);P.j=0;P.play=0;
  if(lsg(LS_NMODE,'local')==='piper'){lss(LS_NMODE,'local')}
  document.body.insertAdjacentHTML('beforeend',playerHtml());document.documentElement.classList.add('au-aberto');
  cena(P.i,0);
}
/* v361 · Janela compacta da aula. A instância P e o sintetizador permanecem vivos
   durante a navegação interna. O iOS pode suspender a voz quando a PWA sai de foco. */
function au361Info(){
 const el=document.getElementById('aup');if(!el||!P.a)return;
 const title=el.querySelector('[data-au361title]'),pos=el.querySelector('[data-au361pos]'),toggle=el.querySelector('[data-au361toggle]');
 if(title)title.textContent='Aula '+P.a.numero+' · '+P.a.titulo;
 if(pos)pos.textContent='Cena '+(P.i+1)+' de '+P.a.r.cenas.length+(P.play?' · narrando':' · pausada');
 if(toggle){toggle.textContent=P.play?'⏸ Pausar':'▶ Continuar';toggle.setAttribute('aria-label',P.play?'Pausar narração':'Continuar narração')}
}
function au361Minimize(){
 if(!P.on)return;
 document.getElementById('au-study-panel')?.remove();document.getElementById('au336-map')?.remove();tvFecha();
 const opt=document.getElementById('aupoptions');if(opt)opt.hidden=true;
 document.getElementById('aupidx')?.setAttribute('hidden','');
 const el=document.getElementById('aup');if(!el)return;
 el.classList.add('au361-floating');el.setAttribute('aria-label','Mini player da aula');
 document.documentElement.classList.remove('au-aberto');
 au361Info();soltaTela();
}
function au361Expand(){
 const el=document.getElementById('aup');if(!P.on||!el)return;
 el.classList.remove('au361-floating');el.removeAttribute('style');
 el.setAttribute('aria-label','Aula '+P.a.numero);
 document.documentElement.classList.add('au-aberto');au361Info();
}
function fecha(){piperRelease();neuralStop();document.getElementById('au338-modal')?.remove();P.aiBusy=0;P.aiImgs={};document.getElementById('au336-map')?.remove();tvFecha();para();salvaPos();P.on=0;P.a=null;const e=document.getElementById('aup');e&&e.remove();document.documentElement.classList.remove('au-aberto');soltaTela();const y=scrollY;render();scrollTo(0,y)}
function playerHtml(){
  const a=P.a,vel=lsg(LS_VEL,0.95);
  return `<div class="aup" id="aup" role="dialog" aria-label="Aula ${a.numero}">
<div class="aup-top"><button class="aup-x" data-aux="1" aria-label="Minimizar a aula">${IC.x}</button><div class="aup-tt"><b>Aula ${a.numero} · ${h(a.titulo)}</b><span id="aupct"></span></div><button type="button" class="aup-361-min" data-au361min="1" aria-label="Minimizar e continuar ouvindo">▣</button><button class="aup-ix" data-auidx="1" aria-label="Cenas">${IC.menu}</button></div>
<div class="au361-mini-bar"><div class="au361-grip" aria-label="Arrastar mini player" title="Arrastar">⠿</div><div class="au361-mini-copy"><strong data-au361title></strong><small data-au361pos></small></div><div class="au361-mini-actions"><button type="button" data-au361toggle="1" aria-label="Pausar ou continuar">▶ Continuar</button><button type="button" data-au361expand="1" aria-label="Expandir aula">⛶</button><button type="button" data-au361close="1" aria-label="Encerrar aula">×</button></div></div>
<div class="aup-stage"><div class="aup-vis" id="aupvis"></div></div>
<div class="aup-cap" id="aupcap"></div>
<div class="aup-prog" id="aupprog">${a.r.cenas.map((c,k)=>`<i data-aucena="${k}" title="${h(c.titulo||'')}"></i>`).join('')}</div>
<div class="au353-voice-alert" id="au353-voice-alert" role="alert" hidden><span id="au353-voice-message"></span><button type="button" data-au353retry="1">▶ Tentar voz novamente</button></div>
<div class="aup-ctl"><button data-auprev="1" aria-label="Cena anterior">${IC.prev}</button><button class="aup-pp" data-aupp="1" aria-label="Tocar">${IC.play}</button><button data-aunext="1" aria-label="Próxima cena">${IC.next}</button>
<button data-autv="1" class="aup-tv-btn" title="Explorar o exemplo no TradingView" aria-label="Abrir gráfico no TradingView">📈 Gráfico</button><button data-auoptions="1" class="aup-options-toggle" aria-expanded="false">Opções</button></div><div class="aup-options" id="aupoptions" hidden role="dialog" aria-modal="true" aria-label="Opções e narração da aula"><div class="au348-opt-head"><div><strong>🎙️ Narração</strong><small>Escolha como ouvir esta cena</small></div><button type="button" data-au348close="1" aria-label="Fechar opções">✕</button></div><details class="au352-tools"><summary>Mais ferramentas da aula</summary><div class="au348-first"><button class="au-study-note-btn" data-austnotes="1">Meu caderno</button><button type="button" data-auvisualmap="1" class="au336-map-btn">🗺️ Mapa visual</button><button type="button" data-au337gerar="1" class="au337-gen-btn">🎨 Gerar imagem desta cena</button><button type="button" data-au338diag="1" class="au338-diag-btn">🧪 Testar aulas</button><button type="button" data-au348mode="piper" aria-pressed="${lsg(LS_NMODE,"local")==="piper"}">🎧 Piper (avançado)</button></div></details><div class="au339-voices"><div class="au348-mode-tabs" role="group" aria-label="Modo de narração"><button type="button" data-au348mode="local" aria-pressed="${lsg(LS_NMODE,"local")==="local"}">📱 Voz gratuita do aparelho</button><button type="button" data-au348mode="off" aria-pressed="${lsg(LS_NMODE,"local")==="off"}">🔇 Sem voz</button></div><select id="au339mode" hidden aria-hidden="true"><option value="local">Local</option><option value="piper" ${lsg(LS_NMODE,"local")==="piper"?"selected":""}>Piper</option><option value="off" ${lsg(LS_NMODE,"local")==="off"?"selected":""}>Sem narração</option></select><div class="au349-piper"><strong>🎧 Piper TTS · gratuito e offline</strong><small>Gere a voz no computador, depois importe os arquivos WAV aqui. Sem API paga ou cobrança por cena.</small><div class="au349-piper-actions"><button type="button" data-au349export="1">⬇ Exportar roteiro da aula</button><label class="au349-import-btn" for="au349files">📂 Importar áudios WAV</label><input id="au349files" type="file" accept="audio/wav,.wav" multiple hidden></div><small id="au349status" role="status" aria-live="polite">Nenhum áudio Piper carregado nesta cena.</small><audio id="au349native" controls preload="metadata" playsinline aria-label="Ouvir áudio Piper da cena" hidden></audio></div><span id="au339status" hidden></span><div class="au348-actions"><button type="button" data-au349test="1">▶ Ouvir Piper desta cena</button><button type="button" data-au340resume="1" class="au340-resume">▶ Voltar à aula</button></div></div><span id="au337status" class="au337-status" role="status" aria-live="polite"></span><label class="au336-opt"><input type="checkbox" id="au336-auto" ${lsg("aulas-motor-visual-v336",true)?"checked":""}> Visuais por fala</label><label class="au352-control-label" for="aupvel">Velocidade da narração</label><select id="aupvel" aria-label="Velocidade">${[0.8,0.9,0.95,1,1.1,1.2,1.35].map(v=>`<option value="${v}"${v==vel?' selected':''}>${String(v).replace('.',',')}×</option>`).join('')}</select>
<label class="au352-control-label" for="aupvoz">Voz gratuita do aparelho</label><select id="aupvoz" aria-label="Voz">${temVoz()?vozOpts():'<option>sem voz</option>'}</select>${temVoz()?'<button data-auvozteste="1" aria-label="Ouvir voz selecionada" style="font-size:12px;width:auto;padding:8px">▶ Testar voz gratuita</button>':''}<small id="au352-voice-status" class="au352-voice-status" role="status" aria-live="polite">Se não houver som, escolha outra voz e toque em Testar voz gratuita.</small></div>
<div class="aup-idx" id="aupidx" hidden>${a.r.cenas.map((c,k)=>`<button data-aucena="${k}"><span>${k+1}</span>${h(c.titulo||'Cena '+(k+1))}</button>`).join('')}${a.local?'':'<button class="aup-del" data-audel="1"><span>✕</span>Apagar esta aula</button>'}</div>
</div>`;
}
function vozOpts(){const v=vozes(),saved=lsg(LS_VOZ,''),best=v[0];let out='<option value=""'+(!saved?' selected':'')+'>Automático'+(best?' · '+h(best.name):' · voz do aparelho')+'</option>';return out+v.map(x=>`<option value="${h(x.voiceURI||x.name)}"${saved&&(saved===x.voiceURI||saved===x.name)?' selected':''}>${h(x.name)}${qualidadeVoz(x)>=35?' ★':''}${/^pt[-_]BR$/i.test(x.lang)?' · Brasil':''}</option>`).join('')}
function au352VozStatus(m){const e=document.getElementById('au352-voice-status');if(e)e.textContent=m;}
function au353VoiceAlert(message){
 const el=document.getElementById('au353-voice-alert'),text=document.getElementById('au353-voice-message');
 if(!el||!text)return;text.textContent=message||'';el.hidden=!message;
}
function au353VoiceFail(message){
 // Não avançar a cena se a narração falhou; o usuário pode tentar de novo.
 P.play=0;P.tok++;clearTimeout(P.t);clearTimeout(P.wd);try{speechSynthesis.cancel()}catch{}botao();soltaTela();
 const msg=message||'Não foi possível iniciar a voz. Toque em Tentar voz novamente.';
 au353VoiceAlert(msg);au352VozStatus(msg);
}
function testaVoz(){
 if(!temVoz()){au352VozStatus('Este navegador não disponibiliza a voz do aparelho.');return}
 para();au353VoiceAlert('');
 try{
  // Fala real, iniciada dentro do clique: Safari exige ativação por gesto.
  const u=new SpeechSynthesisUtterance('Olá! Este é um teste gratuito da voz brasileira do aparelho.');
  const v=voz();u.lang=v?.lang||'pt-BR';if(v)u.voice=v;
  u.rate=0.95;u.pitch=1;u.volume=1;
  let iniciado=false,finalizado=false;
  const limite=setTimeout(()=>{if(!iniciado&&!finalizado){finalizado=true;try{speechSynthesis.cancel()}catch{}au352VozStatus('A voz não iniciou. Experimente tocar em Testar voz novamente ou selecionar outra voz.')}},8500);
  u.onstart=()=>{iniciado=true;au352VozStatus('Teste em reprodução. Se não ouvir, confira o volume do iPhone.')};
  u.onend=()=>{if(finalizado)return;finalizado=true;clearTimeout(limite);au352VozStatus('Teste concluído. Se não ouviu som, experimente outra voz disponível.')};
  u.onerror=e=>{if(finalizado)return;finalizado=true;clearTimeout(limite);au352VozStatus('A voz falhou ('+String(e?.error||'desconhecido').slice(0,36)+'). Tente outra voz gratuita.')};
  speechSynthesis.speak(u);
 }catch(e){au352VozStatus('Voz indisponível neste dispositivo: '+String(e?.message||e).slice(0,80))}
}
try{speechSynthesis.addEventListener('voiceschanged',()=>{const s=document.getElementById('aupvoz');s&&(s.innerHTML=vozOpts())})}catch{}

function cena(i,j){
  const a=P.a;if(!a)return;
  P.tok++;clearTimeout(P.t);clearTimeout(P.wd);neuralStop();const nativeAudio=document.getElementById("au348native");if(nativeAudio){nativeAudio.pause();nativeAudio.removeAttribute("src")}try{speechSynthesis.cancel()}catch{}
  P.i=Math.max(0,Math.min(i,a.r.cenas.length-1));P.j=j||0;
  const c=a.r.cenas[P.i];
  document.getElementById('aupct').textContent=`${P.i+1}/${a.r.cenas.length} · ${c.titulo||''}`;au361Info();
  document.querySelectorAll('#aupprog i').forEach((e,k)=>{e.className=k<P.i?'ok':k===P.i?'at':''});
  P.vis='';desenha(-1);
  if(c.vis&&c.vis.dados&&!P.dados[P.i])buscaDados(P.i);
  au337Consultar(P.i);if(lsg(LS_NMODE,'local')==='piper')piperLoad(P.i);else neuralConsultar(P.i);au348RefreshVoice();
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
 if(neuralMode()&&!P.nEl&&neuralPlay(P.i,L))return;
 const f=L[P.j];desenha(f.k);legenda(f);
 const tk=++P.tok,vel=+lsg(LS_VEL,0.95)||0.95;
 const prox=()=>{if(tk!==P.tok)return;clearTimeout(P.wd);P.j++;P.t=setTimeout(fala,f.t.endsWith('?')?900:180)};
 const est=(f.t.length/14.5/vel)*1000;
 if(lsg(LS_NMODE,'local')==='off'){
  P.wd=setTimeout(prox,Math.max(1800,est*1.05));return;
 }
 if(!temVoz()){au353VoiceFail('Este navegador não oferece narração. Abra Opções e escolha Sem voz para continuar com legendas.');return}
 try{
  const u=new SpeechSynthesisUtterance(f.t),v=voz();u.lang='pt-BR';if(v){u.voice=v;u.lang=v.lang}
  u.rate=vel;u.pitch=1;u.volume=1;
  let started=false,finished=false,startTime=0;
  // Nada de avançar silenciosamente quando o iOS recusou a síntese.
  const fail=(reason)=>{if(tk!==P.tok||finished)return;finished=true;au353VoiceFail(reason)};
  u.onstart=()=>{if(tk!==P.tok||finished)return;started=true;startTime=Date.now();clearTimeout(P.wd);au353VoiceAlert('');
   const monitor=()=>{if(tk!==P.tok||finished)return;
    let speaking=false,pending=false;try{speaking=!!speechSynthesis.speaking;pending=!!speechSynthesis.pending}catch{}
    if(!speaking&&!pending&&Date.now()-startTime>850){finished=true;prox();return}
    P.wd=setTimeout(monitor,1500);
   };P.wd=setTimeout(monitor,Math.max(2400,est*0.9));
  };
  u.onend=()=>{if(tk!==P.tok||finished)return;finished=true;prox()};
  u.onerror=e=>fail('Falha na voz do iPhone ('+String(e?.error||'desconhecida').slice(0,40)+'). Toque em Tentar voz novamente.');
  // O temporizador de início NÃO chama prox(): silêncio não significa fala concluída.
  P.wd=setTimeout(()=>{if(tk!==P.tok||finished||started)return;
   let speaking=false;try{speaking=!!speechSynthesis.speaking}catch{}
   if(speaking){started=true;startTime=Date.now();P.wd=setTimeout(()=>{if(tk===P.tok&&!finished&&!speechSynthesis.speaking){finished=true;prox()}},Math.max(3500,est*1.5));return}
   fail('A voz não iniciou no Safari. Toque em Tentar voz novamente ou escolha outra voz em Opções.');
  },7500);
  // IMPORTANTE: a primeira chamada real de speak() acontece no próprio clique do usuário.
  speechSynthesis.speak(u);
 }catch(e){au353VoiceFail('A voz não pôde iniciar ('+String(e?.message||'erro').slice(0,65)+'). Tente novamente.')}
}
function tocar(){
 if(!P.a)return;
 if(P.i>=P.a.r.cenas.length-1&&P.j>=((falasCena(P.a.r.cenas[P.i])||[]).length))cena(0,0);
 const nativeAudio=document.getElementById('au348native');if(nativeAudio)nativeAudio.pause();document.getElementById('au349native')?.pause();
 P.play=1;botao();prendeTela();au353VoiceAlert('');
 clearTimeout(P.t);clearTimeout(P.wd);
 // iOS: iniciar a fala REAL e diretamente a partir do toque em Play ou Tentar novamente.
 // Não usar fala silenciosa de preparação nem setTimeout para a primeira elocução.
 fala();
}
function para(){P.play=0;P.tok++;clearTimeout(P.t);clearTimeout(P.wd);neuralStop();try{speechSynthesis.cancel()}catch{}botao();soltaTela()}
function botao(){const b=document.querySelector('.aup-pp');b&&(b.innerHTML=P.play?IC.pause:IC.play,b.setAttribute('aria-label',P.play?'Pausar':'Tocar'));au361Info()}
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
  const momento=visualMomento(c,k);const chave=P.i+'|'+k+'|'+momento.tipo+'|'+(P.dados[P.i]?1:0)+'|'+(lsg('aulas-motor-visual-v336',true)?1:0);if(P.vis===chave)return;P.vis=chave;
  const R=VIS[v.tipo]||VIS.titulo,inner=R(v,k,P.dados[P.i],c);
  el.innerHTML=videoFrame(c,v,k,inner,momento);el.className='aup-vis au-video au-'+v.tipo;
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
function visualDidatico(c,v,k){
  if(!['titulo','topicos'].includes(v.tipo))return '';
  const tema=((c.titulo||'')+' '+(v.t||'')+' '+((v.chips||[]).join(' '))).toLowerCase();
  if(!/tend[eê]ncia|suporte|resist[eê]ncia|corre[cç][aã]o|pullback|candles|m[eé]dia m[oó]vel/.test(tema))return '';
  const up=/baixa|descend|queda|venda/.test(tema)?-1:1;
  const vals=[26,32,29,37,34,41,39,46,43,52,48,55,52,61,58,65,62,73];
  const bars=vals.map((raw,i)=>{
    const y=up===1?raw:100-raw,prev=up===1?(vals[i-1]||23):100-(vals[i-1]||23);
    const high=Math.min(86,Math.max(y,prev)+5),low=Math.max(6,Math.min(y,prev)-5);
    const x=18+i*25,sy=z=>125-z*1.12,green=y>=prev;
    return `<line x1="${x}" y1="${sy(high)}" x2="${x}" y2="${sy(low)}" stroke="${green?'#34d399':'#f87171'}" stroke-width="2"/><rect x="${x-5}" y="${Math.min(sy(y),sy(prev))}" width="10" height="${Math.max(3,Math.abs(sy(y)-sy(prev)))}" rx="1" fill="${green?'#34d399':'#f87171'}"/>`;
  }).join('');
  const points=vals.map((raw,i)=>`${18+i*25},${125-(up===1?raw:100-raw)*1.12}`).join(' ');
  return `<div class="au-viz-edu" aria-label="Diagrama ilustrativo de candles. Não são cotações reais."><div class="au-viz-label">EXEMPLO DIDÁTICO · NÃO É UM GRÁFICO REAL</div><svg role="img" aria-label="Sequência ilustrativa de candles e direção da tendência" viewBox="0 0 470 135" preserveAspectRatio="xMidYMid meet"><g stroke="#234059" stroke-width=".7">${[25,50,75,100].map(y=>`<line x1="8" x2="460" y1="${y}" y2="${y}"/>`).join('')}</g>${bars}<polyline points="${points}" fill="none" stroke="#eac861" stroke-width="1.5" stroke-dasharray="4 5" opacity=".85"/></svg><div class="au-viz-note">Observe a direção dos candles. Toque em <b>📈 Gráfico</b> para estudar um ativo no TradingView.</div></div>`;
}
/* v336 — motor local de cenas sem gerar dados financeiros artificiais.
   Interpreta o roteiro salvo em Supabase; também aceita metadados opcionais "visuais"
   por fala sem modificar o esquema da tabela aulas. Nunca busca imagens arbitrárias. */
const AU336_LIB=[
 {tipo:'suporte',nome:'Suporte e resistência',re:/suporte|resist[eê]ncia|regi[aã]o de pre[cç]os?|piso|teto/i},
 {tipo:'tendencia',nome:'Tendências e topos/fundos',re:/tend[eê]ncia|topos? e fundos?|tend[eê]ncia intermedi[aá]ria|linha de tend[eê]ncia/i},
 {tipo:'pullback',nome:'Correção e pullback',re:/pullback|corre[cç][aã]o|retra[cç][aã]o|repique/i},
 {tipo:'rompimento',nome:'Rompimentos',re:/rompimento|romper|breakout|falso rompimento/i},
 {tipo:'media',nome:'Médias móveis',re:/m[eé]dia[s]? m[oó]ve[il]|cruzamento de m[eé]dias/i},
 {tipo:'candles',nome:'Anatomia dos candles',re:/candles?|pavio|corpo real|abertura e fechamento|sombras? do candle/i},
 {tipo:'risco',nome:'Gestão de risco',re:/stop|risco|retorno|rela[cç][aã]o risco|posi[cç][aã]o|gerenciamento/i},
 {tipo:'ciclo',nome:'Ciclos e horizontes',re:/ciclos?|curto prazo|longo prazo|intermedi[aá]rio|prazo/i}
];
const AU336_TIPOS=new Set(AU336_LIB.map(x=>x.tipo));
function visualMomento(c,k){
 const L=falasCena(c)||[],fala=k<0?null:L.find(x=>x.k===k)||L[0], texto=String(fala?.t||'');
 // Metadados opcionais do roteiro já salvo no Supabase: [{fala:0,tipo:'suporte'}]
 const personalizados=Array.isArray(c.visuais)?c.visuais:[];
 const escolhido=personalizados.find(v=>v&&Number(v.fala)===Number(fala?.k)&&AU336_TIPOS.has(v.tipo));
 if(escolhido)return {tipo:escolhido.tipo,nome:AU336_LIB.find(x=>x.tipo===escolhido.tipo).nome,origem:'roteiro'};
 const fonte=k<0?(c.titulo||'')+' '+(c.vis?.t||''):texto;
 const cat=AU336_LIB.find(x=>x.re.test(fonte));
 return cat?{tipo:cat.tipo,nome:cat.nome,origem:'roteiro'}:{tipo:'',nome:'',origem:''};
}
function au336Grafico(tipo){
 const vals=tipo==='suporte'?[53,47,40,45,54,63,56,49,42,39,47,57,63,59,51,42,40,49,58,61]:tipo==='rompimento'?[43,51,56,48,38,46,54,59,49,55,60,64,69,75,83,79,86,91,95,99]:tipo==='pullback'?[27,33,39,47,53,62,67,61,55,47,50,59,65,73,79,83,76,85,92,97]:tipo==='media'?[23,29,25,34,36,33,40,48,44,55,50,61,62,60,73,72,81,86,85,96]:tipo==='ciclo'?[25,30,39,44,55,49,39,35,41,53,62,71,69,59,47,53,66,75,78,88]:[22,31,28,38,34,45,43,50,46,59,54,64,61,70,67,78,74,84,81,92];
 const X=i=>22+i*21,Y=v=>118-v, path=vals.map((v,i)=>(i?'L':'M')+X(i)+','+Y(v)).join(' ');
 const circle=(i,color)=>`<circle cx="${X(i)}" cy="${Y(vals[i])}" r="4" stroke="#071727" stroke-width="2" fill="${color}"/>`;
 const lines=tipo==='suporte'?`<line x1="12" y1="79" x2="430" y2="79" stroke="#34d399" stroke-dasharray="6 4"/><line x1="12" y1="51" x2="430" y2="51" stroke="#fb7185" stroke-dasharray="6 4"/><text x="320" y="75">SUPORTE</text><text x="320" y="46">RESISTÊNCIA</text>`:tipo==='rompimento'?`<line x1="12" y1="60" x2="430" y2="60" stroke="#facc15" stroke-dasharray="5 5"/><text x="245" y="55">ROMPIMENTO</text>`:tipo==='media'?`<path d="${vals.map((v,i)=>(i?'L':'M')+X(i)+','+Y(vals.slice(Math.max(0,i-4),i+1).reduce((a,b)=>a+b,0)/Math.min(5,i+1))).join(' ')}" stroke="#facc15" stroke-width="2.5" fill="none"/><text x="30" y="22">MÉDIA MÓVEL (SIMULADA)</text>`:tipo==='pullback'?`${circle(6,'#facc15')}${circle(9,'#fb7185')}<text x="140" y="20">CORREÇÃO</text>`:tipo==='tendencia'?`${circle(3,'#facc15')}${circle(9,'#facc15')}<line x1="20" y1="113" x2="430" y2="20" stroke="#facc15" stroke-width="1.7" stroke-dasharray="7 5"/><text x="250" y="18">DIREÇÃO</text>`:'';
 if(tipo==='candles')return `<svg viewBox="0 0 440 135" role="img" aria-label="Anatomia ilustrativa de um candle"><line x1="145" x2="145" y1="18" y2="118" stroke="#34d399" stroke-width="3"/><rect x="126" y="42" width="38" height="55" rx="2" fill="#34d399"/><line x1="145" y1="29" x2="250" y2="29" stroke="#d2e8ef"/><text x="255" y="33">PAVIO SUPERIOR</text><line x1="164" y1="70" x2="250" y2="70" stroke="#d2e8ef"/><text x="255" y="74">CORPO</text><line x1="145" y1="110" x2="250" y2="110" stroke="#d2e8ef"/><text x="255" y="114">PAVIO INFERIOR</text></svg>`;
 if(tipo==='risco')return `<svg viewBox="0 0 440 135" role="img" aria-label="Relação risco e retorno, exemplo didático"><line x1="70" y1="18" x2="70" y2="116" stroke="#cbd5e1"/><line x1="58" y1="75" x2="350" y2="75" stroke="#38bdf8" stroke-dasharray="5 4"/><rect x="118" y="75" width="100" height="34" fill="#b91c1c" opacity=".68"/><rect x="228" y="25" width="100" height="50" fill="#059669" opacity=".68"/><text x="123" y="97">RISCO</text><text x="239" y="54">RETORNO</text><text x="75" y="70">ENTRADA</text></svg>`;
 return `<svg viewBox="0 0 440 135" role="img" aria-label="Esquema financeiro ilustrativo"><g stroke="#24415b" stroke-width=".8">${[22,44,66,88,110].map(y=>`<line x1="10" y1="${y}" x2="432" y2="${y}"/>`).join('')}</g><path d="${path}" fill="none" stroke="#34d399" stroke-width="2.7" stroke-linejoin="round"/>${lines}</svg>`;
}
function au336Painel(momento){
 if(!momento.tipo||!lsg('aulas-motor-visual-v336',true))return '';
 return `<aside class="au336-example" aria-label="Exemplo didático gerado pelo motor visual"><div class="au336-head"><span>📚 ${h(momento.nome)}</span><small>ESQUEMA DIDÁTICO · SEM COTAÇÕES REAIS</small></div>${au336Grafico(momento.tipo)}<div class="au336-foot">Conceito ilustrativo. Para estudar um ativo real, use <b>📈 Gráfico</b> e confira data, período e fonte.</div></aside>`;
}
function au336Mapa(){
 if(!P.a)return;
 const aula=P.a,rows=aula.r.cenas.map((c,i)=>{
  const ls=falasPlano(c),temas=[...new Set([visualMomento(c,-1),...ls.map((f,j)=>visualTipoTexto(c,f,j))].filter(x=>x.tipo).map(x=>x.nome))].slice(0,4);
  return `<button type="button" data-au336goto="${i}" class="au336-map-row"><b>${i+1}. ${h(c.titulo||'Cena '+(i+1))}</b><span>${temas.length?temas.map(h).join(' · '):'Explicação narrada'}${c.vis?.dados?' · Gráfico histórico':' '}</span></button>`;
 }).join('');
 const dialog=document.createElement('div');dialog.className='au336-overlay';dialog.id='au336-map';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Mapa visual da aula');
 dialog.innerHTML=`<div class="au336-dialog"><header><strong>🗺️ Roteiro visual · ${h(aula.titulo)}</strong><button type="button" data-au336close="1" aria-label="Fechar mapa visual">✕</button></header><p>Os tópicos são inferidos do roteiro da aula, salvo no Supabase. Não são imagens geradas por IA nem recomendações de negociação.</p><div class="au336-list">${rows}</div></div>`;
 document.body.appendChild(dialog);dialog.querySelector('[data-au336close]')?.focus();
}
function falasPlano(c){return (Array.isArray(c.fala)?c.fala:[]).flatMap(x=>frasesDe(String(x||'')).map(t=>({t}))).slice(0,65)}
function visualTipoTexto(c,f,j){const manual=(Array.isArray(c.visuais)?c.visuais:[]).find(v=>v&&v.fala===j&&AU336_TIPOS.has(v.tipo));if(manual)return {tipo:manual.tipo,nome:AU336_LIB.find(x=>x.tipo===manual.tipo).nome};const hit=AU336_LIB.find(x=>x.re.test(f.t));return hit?{tipo:hit.tipo,nome:hit.nome}:{tipo:'',nome:''}}
/* v337 — imagens sob demanda: nenhum gasto automático e acesso somente à aula do usuário autenticado. */
function au337Imagem(i){
 const x=P.aiImgs[i];if(!x?.url||x.expira<Date.now())return '';
 let url;try{const u=new URL(x.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||!u.pathname.includes('/storage/v1/object/sign/aulas-visuais/'))return '';url=u.href}catch{return ''}
 return `<figure class="au337-figure"><img src="${h(url)}" alt="Imagem didática gerada por IA para esta cena. Não representa preços reais." loading="lazy" referrerpolicy="no-referrer"><figcaption>IMAGEM GERADA POR IA · ILUSTRAÇÃO DIDÁTICA, SEM COTAÇÕES REAIS</figcaption></figure>`;
}
async function au337Requisicao(acao,i){
 const sessionOwner=ownerKey();const lesson=P.a;if(!logado()||!lesson||lesson.local||!SESS?.at)throw Error('Entre na sua conta e escolha uma aula salva no Supabase.');
 const s=cfg();if(!s?.url||!s?.key)throw Error('Supabase indisponível.');
 const response=await fetch(s.url+'/functions/v1/aulas-visuais',{method:'POST',headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({acao,aula:lesson.id,cena:i}),signal:AbortSignal.timeout(110000)});
 const data=await response.json().catch(()=>({}));
 assertOwner(sessionOwner);if(!P.on||P.a?.id!==lesson.id)throw Error('A aula foi fechada.');
 if(!response.ok)throw Error(String(data.error||'Não foi possível carregar a imagem.'));
 return data;
}
function au337Salvar(i,data){
 if(!data?.existe||typeof data.url!=='string')return;
 P.aiImgs[i]={url:data.url,expira:Date.now()+50*60000};
 if(P.i===i&&P.on){P.vis='';const falaAtual=(falasCena(P.a.r.cenas[P.i])||[])[P.j];desenha(falaAtual?.k??-1)}
}
async function au337Consultar(i){
 if(!P.a||P.a.local||!logado()||P.aiImgs[i]?.expira>Date.now())return;
 try{const data=await au337Requisicao('consultar',i);au337Salvar(i,data)}catch{/* a aula continua com visuais didáticos se a rede falhar */}
}
async function au337Gerar(){
 if(P.aiBusy)return;
 const i=P.i;if(!logado()||P.a?.local){toast?.('Entre na conta e abra uma aula salva no Supabase.');return}
 if(!confirm('Gerar uma imagem ilustrativa para esta cena usando IA? O provedor pode cobrar pela geração. Limite: até 5 imagens por dia na sua conta.'))return;
 para();P.aiBusy=1;
 const status=document.getElementById('au337status'),bot=document.querySelector('[data-au337gerar]');
 if(status)status.textContent='Gerando imagem…';if(bot)bot.disabled=true;
 try{const data=await au337Requisicao('gerar',i);au337Salvar(i,data);if(status)status.textContent='Imagem salva! Será reutilizada nas próximas reproduções.';toast?.('Imagem didática gerada e salva.');}
 catch(e){if(status)status.textContent=String(e.message||e).slice(0,160);toast?.('Imagem: '+String(e.message||e).slice(0,100))}
 finally{P.aiBusy=0;if(bot)bot.disabled=false}
}
/* v339 — voz neural: áudio armazenado por cena, nunca gerado automaticamente. */
const neuralVoice=()=>lsg(LS_NVOICE,'Kore');
const neuralMode=()=>['neural','piper'].includes(lsg(LS_NMODE,'local'));
function neuralStop(){const a=P.nEl;P.nEl=null;if(a){a.onended=null;a.ontimeupdate=null;a.onerror=null;try{a.pause();a.removeAttribute('src');a.load()}catch{}}}
function neuralStatus(t){const e=document.getElementById('au339status');if(e)e.textContent=String(t)}
function neuralKey(i){return lsg(LS_NMODE,'local')==='piper'?'piper|'+String(P.a?.id||'')+'|'+i:i+'|'+neuralVoice()}
function au348RefreshVoice(){
 const mode=lsg(LS_NMODE,'local'),native=document.getElementById('au348native'),note=document.getElementById('au348native-note');
 document.querySelectorAll('[data-au348mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.au348mode===mode)));
 const m=document.getElementById('au339mode');if(m)m.value=mode;
 const item=P.nAudio[neuralKey(P.i)];const ok=!!item&&item.expira>Date.now();
 if(native){if(ok){if(native.dataset.audioKey!==neuralKey(P.i)||native.dataset.audioUrl!==item.url){native.pause();native.src=item.url;native.dataset.audioKey=neuralKey(P.i);native.dataset.audioUrl=item.url}}else{native.pause();native.removeAttribute('src');native.removeAttribute('data-audio-key');native.removeAttribute('data-audio-url')}native.hidden=!ok;}
 if(note)note.textContent=ok?'Reprodução direta: toque no ▶ do áudio. A imagem e a legenda não são sincronizadas neste modo.':'Áudio neural desta cena ainda não está disponível. Gere a voz ou use a voz do aparelho.';
 const pv=document.getElementById('au349native'),ps=document.getElementById('au349status'),isPiper=mode==='piper';
 if(pv){const pi=P.nAudio[neuralKey(P.i)];if(isPiper&&pi?.url){if(pv.dataset.key!==neuralKey(P.i)){pv.pause();pv.src=pi.url;pv.dataset.key=neuralKey(P.i)}pv.hidden=false}else{pv.pause();pv.removeAttribute('src');pv.dataset.key='';pv.hidden=true}}
 if(ps)ps.textContent=isPiper?(P.nAudio[neuralKey(P.i)]?.url?'Áudio Piper pronto nesta cena. Toque em Voltar à aula ou use o player abaixo.':'Ainda sem áudio Piper nesta cena. Importe os arquivos WAV gerados no PC.'):'Piper é gratuito; selecione Piper acima para usar.';

}
async function neuralReq(acao,i){
 const owner=ownerKey(),lesson=P.a,s=cfg();
 if(!logado()||!lesson||lesson.local||!SESS?.at||!s?.url||!s?.key)throw Error('Entre na conta e abra uma aula salva no Supabase.');
 const r=await fetch(s.url+'/functions/v1/aulas-voz',{method:'POST',headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({acao,aula:lesson.id,cena:i,voz:neuralVoice()}),signal:AbortSignal.timeout(115000)});
 const d=await r.json().catch(()=>({}));assertOwner(owner);
 if(!P.on||P.a?.id!==lesson.id)throw Error('A aula foi fechada.');
 if(!r.ok)throw Error(String(d.error||'Falha ao consultar voz neural.'));
 return d;
}
function neuralSave(i,d){if(d?.existe&&typeof d.url==='string'){
 try{const u=new URL(d.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||!u.pathname.includes('/storage/v1/object/sign/aulas-audio/'))return}catch{return}
 P.nAudio[neuralKey(i)]={url:d.url,expira:Date.now()+25*60000};if(P.i===i){au348RefreshVoice();neuralStatus("Áudio neural salvo nesta cena. Pode ouvir diretamente ou voltar à aula.")}
}}
async function neuralConsultar(i){if(lsg(LS_NMODE,'local')==='piper')return;if(!P.on||!P.a||P.a.local||!logado()||P.nAudio[neuralKey(i)]?.expira>Date.now())return;
 try{const d=await neuralReq('consultar',i);neuralSave(i,d)}catch{/* a narração local continua disponível */}}
async function neuralGerar(){
 if(P.nBusy)return;const i=P.i;
 if(!P.a||!logado()||P.a.local){neuralStatus('É necessário entrar na conta e abrir uma aula salva.');return}
 if(!confirm('Gerar a narração desta cena com IA? Pode haver cobrança pelo provedor. O áudio será reutilizado; limite de 8 cenas por dia.'))return;
 para();P.nBusy=1;const b=document.querySelector('[data-au339gerar]');if(b)b.disabled=true;neuralStatus('Gerando áudio natural…');
 try{const d=await neuralReq('gerar',i);neuralSave(i,d);lss(LS_NMODE,'neural');au348RefreshVoice();neuralStatus('Áudio salvo! Toque em ▶ Voltar à aula para reproduzir.');toast?.('Voz neural pronta! Use Voltar à aula.');}
 catch(e){neuralStatus(String(e.message||e).slice(0,190));toast?.('Voz neural: '+String(e.message||e).slice(0,110))}
 finally{P.nBusy=0;if(b)b.disabled=false}
}
function neuralPlay(i,L){
 const item=P.nAudio[neuralKey(i)];if(!item||item.expira<Date.now())return false;
 neuralStop();let audio;try{audio=new Audio(item.url);audio.preload='auto';audio.playbackRate=+lsg(LS_VEL,0.95)||0.95}catch{return false}
 P.nEl=audio;const tk=++P.tok;let last=-1;
 const visual=()=>{if(!P.play||tk!==P.tok||P.i!==i||!L.length)return;const total=L.reduce((a,x)=>a+Math.max(1,x.t.length),0);const elapsed=audio.duration>0?audio.currentTime/audio.duration:0;let left=total*elapsed,j=0;for(;j<L.length-1;j++){left-=Math.max(1,L[j].t.length);if(left<0)break}
  if(j!==last){last=j;P.j=j;desenha(L[j].k);legenda(L[j])}};
 audio.ontimeupdate=visual;audio.onloadedmetadata=()=>{if(P.j>0){const total=L.reduce((a,x)=>a+Math.max(1,x.t.length),0),before=L.slice(0,P.j).reduce((a,x)=>a+Math.max(1,x.t.length),0);audio.currentTime=Math.min(audio.duration*.99,audio.duration*before/total)}};
 audio.onended=()=>{if(tk!==P.tok||!P.play)return;neuralStop();P.j=L.length;P.t=setTimeout(fala,250)};
 audio.onerror=()=>{if(tk!==P.tok)return;neuralStatus('Áudio indisponível. Alternando para a voz do aparelho.');delete P.nAudio[neuralKey(i)];neuralStop();lss(LS_NMODE,'local');au348RefreshVoice();P.t=setTimeout(fala,100)};
 audio.play().catch(e=>{if(tk!==P.tok)return;neuralStop();lss(LS_NMODE,'local');au348RefreshVoice();neuralStatus('O Safari não reproduziu a voz neural ('+(e?.name||'erro')+'). Mudei para a voz do aparelho. Também é possível tocar diretamente no áudio salvo, em Opções.');toast?.('Áudio neural bloqueado. Tente voz do aparelho ou áudio salvo nas Opções.');P.t=setTimeout(fala,50)});return true;
}
/* v349 — Piper: geração gratuita acontece no computador; este app importa WAVs em IndexedDB.
   Sem API externa, sem custo por cena e sem envio de arquivos a terceiros. */
const PIPER_DB='diario-aulas-piper-v349';
function piperDB(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('Este navegador não oferece armazenamento offline.'));const q=indexedDB.open(PIPER_DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('audio'))q.result.createObjectStore('audio')};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||Error('Erro ao abrir armazenamento'))})}
async function piperStore(key,file){const db=await piperDB();return new Promise((ok,no)=>{const tx=db.transaction('audio','readwrite');tx.objectStore('audio').put(file,key);tx.oncomplete=()=>{db.close();ok()};tx.onerror=()=>{db.close();no(tx.error)}})}
async function piperRead(key){const db=await piperDB();return new Promise((ok,no)=>{const tx=db.transaction('audio','readonly');const rq=tx.objectStore('audio').get(key);rq.onsuccess=()=>{db.close();ok(rq.result)};rq.onerror=()=>{db.close();no(rq.error)}})}
function piperStatus(msg){const e=document.getElementById('au349status');if(e)e.textContent=msg}
function piperCacheKey(i){return 'piper|'+String(P.a?.id||'')+'|'+i}
function piperRelease(){for(const [k,item] of Object.entries(P.nAudio||{})){if(k.startsWith('piper|')&&item.url?.startsWith('blob:')){URL.revokeObjectURL(item.url);delete P.nAudio[k]}}}
async function piperLoad(i){if(!P.on||!P.a)return;const lesson=P.a.id,key=piperCacheKey(i);try{if(P.nAudio[key]?.url){au348RefreshVoice();return}const blob=await piperRead(String(lesson)+'|'+i);if(!blob||!P.on||P.a?.id!==lesson)return;P.nAudio[key]={url:URL.createObjectURL(blob),expira:Number.MAX_SAFE_INTEGER};if(P.i===i){au348RefreshVoice();piperStatus('Áudio Piper pronto nesta cena. Toque em Voltar à aula.')}}catch(e){piperStatus('Armazenamento offline indisponível: '+String(e.message||e).slice(0,90))}}
function piperExport(){if(!P.a?.r?.cenas)return;const a=P.a;const cenas=a.r.cenas.map((c,i)=>({cena:i+1,titulo:c.titulo||'Cena '+(i+1),texto:(c.fala||c.falaSem||[]).join(' ').replace(/\{\w+\}/g,'').trim()}));
 const body=JSON.stringify({formato:'diario-piper-v349',aula_id:String(a.id),titulo:String(a.titulo||''),cenas},null,2);const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));const x=document.createElement('a');x.href=url;x.download='roteiro-piper-aula-'+(a.numero||'')+'.json';document.body.appendChild(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);piperStatus('Roteiro exportado. Gere os WAVs no computador e importe os arquivos aqui.')}
async function piperImport(files){if(!P.a||!files?.length)return;para();const id=String(P.a.id);let ok=0,skip=0;const list=[...files];if(list.length>250){piperStatus('Selecione no máximo 250 arquivos por vez.');return}
 for(const f of list){const m=/^cena[-_ ]?(\d{1,3})\.wav$/i.exec(f.name);if(!m||f.size<44||f.size>30*1024*1024){skip++;continue}const i=+m[1]-1;if(i<0||i>=P.a.r.cenas.length){skip++;continue}try{await piperStore(id+'|'+i,f);const key=piperCacheKey(i);if(P.nAudio[key]?.url?.startsWith('blob:'))URL.revokeObjectURL(P.nAudio[key].url);delete P.nAudio[key];ok++}catch{skip++}}
 await piperLoad(P.i);piperStatus(ok+' cena(s) importada(s) para esta aula.'+(skip?' '+skip+' ignorada(s).':'')+' Arquivos armazenados neste navegador.');}
/* v338 — central de homologação sem gerar imagens nem consumir a cota de IA. */
function au338RenderDiag(d){
 const li=(name,ok,tip)=>`<li class="au338-check"><span aria-hidden="true">${ok?'✅':'⚠️'}</span><span><b>${h(name)}</b><small>${h(tip)}</small></span></li>`;
 return `<div class="au338-modal" id="au338-modal" role="dialog" aria-modal="true" aria-label="Diagnóstico das aulas"><div class="au338-panel"><header><strong>🧪 Testes de Aulas · v338</strong><button type="button" data-au338close="1" aria-label="Fechar diagnóstico">✕</button></header><p>Este diagnóstico não gera imagens nem consome sua cota da IA. Os testes de voz, TradingView e geração ainda precisam de sua confirmação.</p><ul>${li('Conexão',d.online,'O dispositivo precisa estar online para buscar imagens e gráficos.')}${li('Login Supabase',d.login,'Use a conta com a qual salvou a aula.')}${li('Narração',d.voice,'A disponibilidade e qualidade da voz dependem do dispositivo.')}${li('Aula sincronizada',d.lesson,'A cena atual deve corresponder ao texto narrado.')}${li('Imagem da cena',d.image,'Imagem encontrada no armazenamento privado; caso contrário, utilize o botão de gerar.')}${li('Biblioteca no servidor',d.backend,d.backendText)}</ul><div class="au338-actions"><button type="button" data-au338refresh="1">Atualizar diagnóstico</button><button type="button" data-au338graph="1">📈 Testar gráfico</button><button type="button" data-au338close="1">Fechar</button></div><small class="au338-small">Confira também: avançar cenas, pausar narração, retornar à cena, reabrir a aula e verificar se a imagem é reutilizada sem nova cobrança.</small></div></div>`;
}
async function au338Diagnostico(){
 if(!P.on||!P.a)return;
 para();document.getElementById('au338-modal')?.remove();
 const s=cfg(),on=navigator.onLine,lg=logado(),i=P.i;
 const d={online:on,login:lg,voice:temVoz(),lesson:!!P.a.r?.cenas?.[i],image:!!(P.aiImgs[i]?.url&&P.aiImgs[i]?.expira>Date.now()),backend:false,backendText:'Ainda não consultado.'};
 document.body.insertAdjacentHTML('beforeend',au338RenderDiag(d));
 if(!lg||!on||P.a.local){d.backendText=P.a.local?'Aula local: geração disponível somente para aulas salvas no Supabase.':'Conecte-se e entre na sua conta.'}
 else{
  d.backendText='Consultando a biblioteca privada…';
  try{const r=await au337Requisicao('consultar',i);d.backend=true;d.backendText=r.existe?'Imagem encontrada e reaproveitável.':'Biblioteca acessível; esta cena ainda não possui imagem.';if(r.existe)au337Salvar(i,r);d.image=!!r.existe}
  catch(e){d.backendText=String(e.message||e).slice(0,150)}
 }
 const modal=document.getElementById('au338-modal');if(modal){modal.outerHTML=au338RenderDiag(d);document.querySelector('[data-au338close]')?.focus()}
}
function videoFrame(c,v,k,inner,momento){return `<div class="au-lesson-visual">${inner}${au337Imagem(P.i)}${au336Painel(momento)}${!momento.tipo||!lsg('aulas-motor-visual-v336',true)?visualDidatico(c,v,k):''}</div>`;}

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

/* ---------- TradingView oficial no player de estudos ---------- */
const TV_ESTUDO=[
  ['BMFBOVESPA:PETR4','PETR4 · Petrobras'],
  ['BMFBOVESPA:VALE3','VALE3 · Vale'],
  ['BMFBOVESPA:IBOV','Ibovespa'],
  ['BMFBOVESPA:WIN1!','WIN · Futuro'],
  ['BMFBOVESPA:WDO1!','WDO · Futuro'],
  ['NASDAQ:NDX','Nasdaq 100'],
  ['FX_IDC:USDBRL','USD/BRL']
];
function tvEscolha(){
  const c=P.a?.r?.cenas?.[P.i]||{},d=c.vis?.dados,raw=String(d?.ativo||'').toUpperCase();
  const hit=TV_ESTUDO.find(([s])=>s===raw||s.split(':')[1]===raw);
  if(hit)return hit[0];
  const txt=(c.titulo+' '+(c.vis?.t||'')+' '+(P.a?.livro||'')).toLowerCase();
  if(/nasdaq|eua|americano/.test(txt))return 'NASDAQ:NDX';
  if(/wdo|d[oó]lar futuro/.test(txt))return 'BMFBOVESPA:WDO1!';
  if(/win|mini.?[ií]ndice|futuro de [ií]ndice/.test(txt))return 'BMFBOVESPA:WIN1!';
  if(/vale|min[eé]rio/.test(txt))return 'BMFBOVESPA:VALE3';
  if(/petr[oó]leo|petr4/.test(txt))return 'BMFBOVESPA:PETR4';
  return 'BMFBOVESPA:IBOV';
}
function tvFecha(){document.getElementById('au-tradingview')?.remove()}
function tvAbrir(){
  if(!P.on)return;
  para();tvFecha();
  const defaultSymbol=tvEscolha();
  const wrap=document.createElement('div');wrap.id='au-tradingview';wrap.className='au-tv-overlay';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','Gráfico TradingView para estudos');
  wrap.innerHTML=`<section class="au-tv-panel"><div class="au-tv-top"><strong>📈 Gráfico de estudo · TradingView</strong><button type="button" data-autvclose="1" aria-label="Fechar gráfico">✕</button></div><div class="au-tv-controls"><label>Ativo <select id="au-tv-symbol">${TV_ESTUDO.map(([sym,label])=>`<option value="${h(sym)}" ${sym===defaultSymbol?'selected':''}>${h(label)}</option>`).join('')}</select></label><label>Período <select id="au-tv-interval"><option value="D">Diário</option><option value="60">1 hora</option><option value="15">15 minutos</option><option value="W">Semanal</option></select></label><a id="au-tv-external" target="_blank" rel="noopener noreferrer">Abrir no TradingView ↗</a></div><div id="au-tv-chart" class="au-tv-chart"><div class="au-tv-loading">Carregando gráfico oficial do TradingView…</div></div><div class="au-tv-legal">Gráfico fornecido pelo TradingView, sujeito a disponibilidade, licenças e atrasos da fonte. A aula fica pausada enquanto você estuda. O gráfico ao vivo não corresponde necessariamente ao período histórico narrado.</div></section>`;
  document.body.appendChild(wrap);
  tvCarregar();document.querySelector('[data-autvclose]')?.focus();
}
function tvCarregar(){
  const modal=document.getElementById('au-tradingview');if(!modal)return;
  const symbol=modal.querySelector('#au-tv-symbol')?.value, interval=modal.querySelector('#au-tv-interval')?.value;
  if(!TV_ESTUDO.some(([s])=>s===symbol)||!['D','60','15','W'].includes(interval))return;
  modal.querySelector('#au-tv-external').href='https://www.tradingview.com/chart/?symbol='+encodeURIComponent(symbol);
  const area=modal.querySelector('#au-tv-chart');area.replaceChildren();
  const container=document.createElement('div');container.className='tradingview-widget-container';container.style.cssText='width:100%;height:100%';
  const widget=document.createElement('div');widget.className='tradingview-widget-container__widget';widget.style.cssText='width:100%;height:calc(100% - 28px)';
  const credit=document.createElement('div');credit.className='tradingview-widget-copyright';
  const link=document.createElement('a');link.href='https://www.tradingview.com/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Gráficos por TradingView';credit.appendChild(link);
  const script=document.createElement('script');script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';script.async=true;
  script.textContent=JSON.stringify({autosize:true,symbol,interval,timezone:'America/Sao_Paulo',theme:'dark',style:'1',locale:'br',allow_symbol_change:true,calendar:false,hide_side_toolbar:true,hide_top_toolbar:false,withdateranges:true,save_image:true,support_host:'https://www.tradingview.com'});
  container.append(widget,credit,script);area.append(container);
  script.onerror=()=>{if(area.contains(container)){container.remove();area.textContent='O widget não carregou. Use “Abrir no TradingView” acima.'}};
}
/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
  const q=s=>e.target.closest(s);let b;
  if(b=q('[data-auopen]')){e.preventDefault();abre(b.dataset.auopen);return}
  if(q('[data-aurel]')){AU.lista=null;carregaLista(1);pinta();return}
  if(q('[data-au336close]')){document.getElementById('au336-map')?.remove();return}
  if(b=q('[data-au336goto]')){const i=Number(b.dataset.au336goto);document.getElementById('au336-map')?.remove();if(P.on&&Number.isInteger(i)&&i>=0&&i<P.a.r.cenas.length){para();cena(i,0)}return}
  if(q('#au336-map')&&!q('.au336-dialog')){document.getElementById('au336-map')?.remove();return}
  if(q('[data-autvclose]')){tvFecha();return}
  if(b=q('#au-tv-symbol')||q('#au-tv-interval'))return;
  if(q('#au-tradingview')&&!q('.au-tv-panel')){tvFecha();return}
  if(!P.on)return;
  if(q('[data-au338close]')){document.getElementById('au338-modal')?.remove();return}
  if(q('[data-au338refresh]')){au338Diagnostico();return}
  if(q('[data-au338graph]')){document.getElementById('au338-modal')?.remove();tvAbrir();return}
  if(q('[data-au338diag]')){au338Diagnostico();return}
  if(q('[data-au348close]')){const op=document.getElementById('aupoptions');if(op)op.hidden=true;document.querySelector('[data-auoptions]')?.setAttribute('aria-expanded','false');return}
  if(b=q('[data-au348mode]')){const m=b.dataset.au348mode;lss(LS_NMODE,m);if(P.play)para();if(m==='piper')piperLoad(P.i);au348RefreshVoice();return}
  if(q('[data-au340resume]')){const op=document.getElementById('aupoptions');if(op){op.hidden=true;document.querySelector('[data-auoptions]')?.setAttribute('aria-expanded','false')}const stage=document.querySelector('#aup .aup-stage');if(stage)stage.scrollTop=0;if(!P.play)tocar();return}
 if(q('[data-au349export]')){piperExport();return}
 if(q('[data-au349test]')){para();const a=document.getElementById('au349native');if(a&&!a.hidden)a.play().catch(()=>piperStatus('O iPhone bloqueou o play. Toque diretamente no controle do áudio.'));else piperStatus('Importe o WAV desta cena para testar.');return}
 if(q('[data-au339gerar]')){neuralGerar();return}
  if(q('[data-au337gerar]')){au337Gerar();return}
  if(q('[data-auvisualmap]')){para();document.getElementById('aupoptions').hidden=true;au336Mapa();return}
  if(q('[data-autv]')){tvAbrir();return}
  if(q('[data-auoptions]')){const el=document.getElementById('aupoptions');if(el.hidden)para();el.hidden=!el.hidden;q('[data-auoptions]').setAttribute('aria-expanded',String(!el.hidden));au348RefreshVoice();return}
  if(q('[data-au353retry]')){if(P.play)para();tocar();return}
  if(q('[data-auvozteste]')){testaVoz();return}
  if(q('[data-au361close]')){fecha();return}
  if(q('[data-au361expand]')){au361Expand();return}
  if(q('[data-au361min]')||q('[data-aux]')){au361Minimize();return}
  if(q('[data-au361toggle]')){P.play?para():tocar();return}
  if(q('[data-aupp]')){P.play?para():tocar();return}
  if(q('[data-aunext]')){cena(P.i+1,0);return}
  if(q('[data-auprev]')){cena(P.j>1?P.i:P.i-1,0);return}
  if(q('[data-audel]')){const a=P.a;if(!a||!confirm(`Apagar a aula ${a.numero} de “${a.livro}”? Isso não pode ser desfeito.`))return;rq('/rest/v1/aulas?id=eq.'+a.id,{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(()=>{try{lsd(LS_ROT+a.id);lsd(LS_POS+a.id)}catch{}AU.lista=null;fecha();carregaLista(1);toast&&toast('Aula apagada.')}).catch(e=>toast&&toast('Não apagou: '+(e.message||e)));return}
  if(q('[data-auidx]')){const x=document.getElementById('aupidx');x.hidden=!x.hidden;return}
  if(b=q('[data-aucena]')){document.getElementById('aupidx').hidden=true;cena(+b.dataset.aucena,0);return}
  if(q('.aup-stage')&&!q('select')){P.play?para():tocar()}
},true);
document.addEventListener('change',e=>{
  if(e.target.matches('#au-tv-symbol,#au-tv-interval')){tvCarregar();return}
  if(e.target.id==='au349files'){piperImport(e.target.files).finally(()=>{e.target.value=''});return}
  if(e.target.id==='au336-auto'){lss('aulas-motor-visual-v336',!!e.target.checked);P.vis='';if(P.on)desenha(P.j?((falasCena(P.a.r.cenas[P.i])||[])[P.j]||{}).k:-1);return}
  if(e.target.id==='au339mode'){lss(LS_NMODE,e.target.value);if(e.target.value==='piper')piperLoad(P.i);au348RefreshVoice();if(P.play)cena(P.i,P.j);return}
  if(e.target.id==='au339voice'){lss(LS_NVOICE,e.target.value);neuralStop();au348RefreshVoice();neuralConsultar(P.i);if(P.play)cena(P.i,P.j);return}
  if(e.target.id==='aupvel'){lss(LS_VEL,+e.target.value);if(P.play){const j=P.j;cena(P.i,j)}}
  if(e.target.id==='aupvoz'){lss(LS_VOZ,e.target.value);if(P.play){cena(P.i,P.j)}}
});
document.addEventListener('play',e=>{if(['au348native','au349native'].includes(e.target?.id)&&P.play)para()},true);
document.addEventListener('error',e=>{if(e.target?.id==='au348native')neuralStatus('O iPhone não conseguiu reproduzir o arquivo salvo. Selecione Voz do aparelho e use ▶ no player.')},true);
document.addEventListener('keydown',e=>{if(document.getElementById('au336-map')){if(e.key==='Escape'){e.preventDefault();document.getElementById('au336-map')?.remove()}return}if(document.getElementById('au-tradingview')){if(e.key==='Escape'){e.preventDefault();tvFecha()}return}if(!P.on||document.getElementById('aup')?.classList.contains('au361-floating'))return;if(document.getElementById('au-study-panel')){if(e.key==='Escape'){document.getElementById('au-study-panel').remove();document.querySelector('[data-austnotes]')?.focus()}return}if(e.target.closest('input,textarea,select,[contenteditable=true]')||document.getElementById('auModal'))return;if(e.key==='Escape')au361Minimize();else if(e.key===' '){e.preventDefault();P.play?para():tocar()}else if(e.key==='ArrowRight')cena(P.i+1,0);else if(e.key==='ArrowLeft')cena(P.i-1,0)});

/* ---------- gerador: PDF do livro → aula pela IA (função "aulas") ---------- */
const LS_JOB='aulas-job-v1';
const G={aberto:0,livros:null,sel:'',novoNome:'',caps:{},manual:'',numero:'',busy:0,msg:'',erro:'',pct:0};
function idb(){const owner=ownerKey();if(!owner)return Promise.reject(new Error('Entre na sua conta para abrir os PDFs.'));return new Promise((ok,no)=>{const r=indexedDB.open('aulas-livros-v318:'+owner,1);r.onupgradeneeded=()=>r.result.createObjectStore('livros',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function idbOp(modo,fn){const owner=ownerKey(),d=await idb();assertOwner(owner);return new Promise((ok,no)=>{const t=d.transaction('livros',modo),st=t.objectStore('livros'),r=fn(st);t.oncomplete=()=>{d.close();try{assertOwner(owner);ok(r&&r.result)}catch(e){no(e)}};t.onerror=()=>{d.close();no(t.error)}})}
async function livrosLista(){const owner=ownerKey();try{const L=await idbOp('readonly',st=>st.getAll());assertOwner(owner);G.livros=(L||[]).map(({buf,...x})=>x).sort((a,b)=>b.em.localeCompare(a.em))}catch{if(owner!==ownerKey())return;G.livros=[]}pinta()}
const livroBuf=id=>idbOp('readonly',st=>st.get(id)).then(x=>x&&x.buf);
async function pdfLib(){return ntLib()}
async function abrePdf(buf){
 if(buf.byteLength>50*1024*1024)throw new Error('O PDF deve ter no máximo 50 MB.');
 const L=await pdfLib(),task=L.getDocument({data:new Uint8Array(buf.slice(0)),isEvalSupported:false,enableScripting:false,maxImageSize:16000000});G.pdfTask=task;
 const timer=setTimeout(()=>task.destroy(),60000);
 try{const pdf=await task.promise;if(pdf.numPages>2000){await pdf.destroy();throw new Error('Escolha um PDF com até 2.000 páginas.')}return pdf}finally{clearTimeout(timer);G.pdfTask=null}
}
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
  ensureOwner();const owner=ownerKey();if(!owner){G.erro='Entre na sua conta antes de enviar PDFs.';pinta();return}
  if(!file)return;if(file.size>50*1024*1024){G.erro='O PDF deve ter no máximo 50 MB.';pinta();return}if(!/pdf$/i.test(file.type)&&!/\.pdf$/i.test(file.name)){G.erro='Escolha um arquivo PDF.';pinta();return}
  G.busy=1;G.erro='';G.msg='Lendo o PDF…';pinta();
  try{
    const buf=await file.arrayBuffer(),pdf=await abrePdf(buf),sum=await sumarioDe(pdf);
    assertOwner(owner);if(pdf.destroy)await pdf.destroy();
    const nome=(G.novoNome||file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ')).trim().slice(0,120);
    const reg={id:'l'+Date.now().toString(36),nome,arquivo:file.name,paginas:pdf.numPages,sumario:sum,tam:file.size,em:new Date().toISOString(),buf};
    await idbOp('readwrite',st=>st.put(reg));
    G.sel=reg.id;G.caps={};G.manual='';G.msg=sum.length?'':'Este PDF não tem sumário embutido: informe as páginas de cada capítulo.';
    await livrosLista();
  }catch(e){if(owner!==ownerKey())return;G.erro='Não consegui ler o PDF: '+(e.message||e)}
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
async function chamaFn(corpo,ms,owner){
  assertOwner(owner);await tok();assertOwner(owner);const s=cfg();
  const ac=new AbortController();G.request=ac;const t=setTimeout(()=>ac.abort(),ms);
  try{
    const r=await fetch(s.url+'/functions/v1/aulas',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(corpo)});
    const j=await r.json().catch(()=>({}));assertOwner(owner);
    if(r.status===404&&!j.error)throw new Error('A função "aulas" não foi encontrada no Supabase.');
    if(!r.ok){const e=new Error(j.error||'Erro '+r.status);e.status=r.status;throw e}
    return j;
  }catch(e){if(e.name==='AbortError'){const x=new Error('A IA demorou demais para responder.');x.status=504;throw x}throw e}
  finally{clearTimeout(t);if(G.request===ac)G.request=null}
}
async function paginasTexto(pdf,de,ate,on){
  const L=[];de=Math.max(1,de);ate=Math.min(pdf.numPages,ate);
  for(let p=de;p<=ate;p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();L.push(tc.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('').replace(/[ \t]+/g,' ').trim());on&&on(p-de+1,ate-de+1)}
  return L;
}
// divide cada capítulo em trechos de ~10 páginas (~28 mil letras): cada trecho é uma chamada curta à IA
function trechos(pags){const B=[];let cur=[],n=0;for(const t of pags){if(n>0&&n+t.length>28000){B.push(cur.join('\n\n'));cur=[];n=0}cur.push(t);n+=t.length}if(cur.length)B.push(cur.join('\n\n'));if(B.length>1&&B[B.length-1].length<7000){const u=B.pop();B[B.length-1]+='\n\n'+u}return B}
async function gerar(cont){
  ensureOwner();const generationOwner=ownerKey();if(G.busy)return;
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
  if(generationOwner!==ownerKey())return;G.busy=1;G.pct=1;G.msg='Preparando…';pinta();prendeTela();
  try{
    const buf=await livroBuf(job.livroId);
    if(!buf)throw new Error('O PDF deste livro não está mais neste aparelho. Envie o PDF de novo.');
    const pdf=await abrePdf(buf);
    // 1) lê todos os capítulos no aparelho e monta os trechos
    const blocos=[];
    for(const[ci,p]of job.partes.entries()){
      assertOwner(generationOwner);
      const pags=await paginasTexto(pdf,p.de,p.ate,(k,t)=>{G.msg=`Lendo “${p.nome}” · página ${k} de ${t}`;G.pct=1+8*(ci+k/t)/job.partes.length;pintaProg()});
      assertOwner(generationOwner);const tot=pags.join('').replace(/\s/g,'').length;
      if(tot<600)throw new Error(`Quase não há texto nas páginas ${p.de}–${p.ate}. O PDF pode ser escaneado (imagem), ou as páginas estão erradas.`);
      const tr=trechos(pags);tr.forEach((texto,bi)=>blocos.push({nome:p.nome,texto,bloco:bi,blocos:tr.length}));
    }
    if(blocos.length>24)throw new Error('Capítulos longos demais para uma aula só. Escolha menos capítulos.');
    if(!job.id){const r=await chamaFn({acao:'iniciar',livro:job.livro,numero:job.numero,capitulos:job.partes.map(p=>p.nome)},30000,generationOwner);assertOwner(generationOwner);job.id=r.id;lss(LS_JOB,job);AU.lista=null;carregaLista(1)}
    // 2) a IA escreve um trecho por vez
    const n=blocos.length;
    for(let i=job.feitas;i<n;i++){
      assertOwner(generationOwner);
      const b=blocos[i],base=10+88*i/n,fatia=88/n;
      G.msg=`A IA está escrevendo “${b.nome}”${b.blocos>1?` (parte ${b.bloco+1} de ${b.blocos})`:''} · ${i+1} de ${n}`;G.pct=base;pintaProg();
      const anda=setInterval(()=>{G.pct=Math.min(base+fatia*.95,G.pct+fatia/90);pintaProg()},1000);
      const corpo={acao:'parte',id:job.id,idx:i,total:n,bloco:b.bloco,blocos:b.blocos,capitulo:b.nome,texto:b.texto};
      try{
        try{await chamaFn(corpo,165000,generationOwner)}
        catch(e){if(e.status===502||e.status===504||e.status===500||e.status===546){G.msg='A IA falhou neste trecho. Tentando de novo…';pintaProg();await chamaFn(corpo,165000,generationOwner)}else throw e}
      }finally{clearInterval(anda)}
      assertOwner(generationOwner);job.feitas=i+1;lss(LS_JOB,job);G.pct=10+88*(i+1)/n;
    }
    try{lsd(LS_JOB)}catch{}
    G.busy=0;G.aberto=0;G.msg='';G.caps={};G.numero='';soltaTela();
    AU.lista=null;await carregaLista(1);toast&&toast('Aula pronta! 🎬');
    const nova=(AU.lista||[]).find(a=>a.id===job.id);pinta();if(nova)setTimeout(()=>abre(nova.id),300);
    return;
  }catch(e){if(generationOwner!==ownerKey())return;G.erro=(e.message||String(e))+(job.id?' O que já foi feito ficou salvo: toque em “Continuar”.':'');}
  G.busy=0;soltaTela();AU.lista=null;carregaLista(1);pinta();
}
function pintaProg(){const g=document.querySelector('.au-ger .au-tx .sm');g&&(g.textContent=G.msg);const e=document.querySelector('.au-prog');if(e){e.querySelector('.sm').textContent=G.msg;const b=e.querySelector('.au-pb i');b&&(b.style.width=G.pct+'%')}else pinta()}
document.addEventListener('click',e=>{
  const q=s=>e.target.closest(s);let b;
  if(q('[data-aulegacyclear]')){if(confirm('Apagar os PDFs locais de versões anteriores? As aulas salvas no servidor não serão apagadas. Esta remoção dos PDFs antigos não pode ser desfeita.')){const r=indexedDB.deleteDatabase('aulas-livros');r.onsuccess=()=>toast&&toast('PDFs antigos removidos deste aparelho.');r.onblocked=()=>toast&&toast('Feche outras abas do app e tente novamente.')}return}
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
let css=`
.au-intro{margin:2px 2px 10px}
.au-livro{padding:12px}.au-lt{font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;opacity:.7;margin:0 0 8px 2px}
.au-item{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid rgba(127,127,127,.18);padding:12px 2px;color:inherit;font:inherit;cursor:pointer}
.au-item:first-of-type{border-top:0}
.au-n{flex:none;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-weight:800;background:rgba(16,150,100,.12);color:#0f8a5f}
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
.aup-cap{min-height:4.6em;padding:10px 18px 6px;font-size:18px;line-height:1.45;text-align:center;color:#f8fafc;max-width:880px;margin:0 auto;width:100%;box-sizing:border-box}.aup-cap .mut{color:#64748b}
.aup-prog{display:flex;gap:3px;padding:4px 14px}.aup-prog i{flex:1;height:4px;border-radius:2px;background:#1e293b;cursor:pointer}.aup-prog i.ok{background:#10b981}.aup-prog i.at{background:#38bdf8}
.aup-ctl{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 12px 14px}
.aup-ctl>button{width:46px;height:46px;border-radius:50%;border:1px solid #1e293b;background:#111a2e;font-size:18px;cursor:pointer}
.aup-ctl .aup-pp{width:60px;height:60px;background:#10b981;border-color:#10b981;color:#fff;font-size:22px}
.aup .aup-ctl select{-webkit-appearance:none;appearance:none;background:#111a2e!important;color:#e2e8f0!important;border:1px solid #1e293b!important;border-radius:12px;padding:9px 10px;font:inherit;font-size:13px;max-width:104px;height:auto;min-height:0;box-shadow:none}
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
.auv-top .ic{flex:none;width:30px;height:30px;border-radius:8px;background:#0f1d33;display:grid;place-items:center;font-size:16px}.auv-top .ic.dot:after{content:"";width:8px;height:8px;border-radius:50%;background:#10b981}
.auv-tab table,.auv-ajt{width:100%;border-collapse:collapse;font-size:clamp(12px,3.4vw,16px)}
.auv-tab th,.auv-ajt th{text-align:left;color:#7dd3fc;font-weight:700;padding:7px 6px;border-bottom:1px solid #1e3a5f}
.auv-tab td,.auv-ajt td{padding:7px 6px;border-bottom:1px solid #1e293b;vertical-align:top}.auv-tab td.r{color:#94a3b8;font-weight:600}
.auv-tab tbody tr{opacity:.12;transition:opacity .45s}.auv-tab tbody tr.on{opacity:1}
.auv-ajc{font-size:13px;color:#94a3b8;margin:-6px 0 8px}
.auv-ajt{font-size:13px;margin-top:8px;font-variant-numeric:tabular-nums}.auv-ajt td{padding:4px 5px}.auv-ajt .pos{color:#4ade80}.auv-ajt .neg{color:#f87171}.auv-ajt tr.call td{background:rgba(239,68,68,.12)}.auv-ajt small{display:block;color:#fca5a5;font-size:11px}
.auv-for{text-align:center}.auv-f{font-size:clamp(18px,5vw,28px);font-weight:800;background:#0f1d33;border:1px solid #1e3a5f;border-radius:16px;padding:16px 12px;color:#7dd3fc;margin-bottom:14px;font-variant-numeric:tabular-nums}
.auv-fl{font-size:clamp(14px,3.8vw,19px);padding:5px 0;opacity:.14;transition:opacity .45s;font-variant-numeric:tabular-nums}.auv-fl.on{opacity:1}.auv-fl.forte{font-weight:800;color:#facc15}
.auv-q{text-align:center;padding:6px}.auv-qq{font-size:clamp(19px,5.2vw,30px);font-weight:800;line-height:1.25}
.auv-qa{margin-top:20px;font-size:clamp(15px,4.2vw,21px);color:#4ade80;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:16px;padding:14px;opacity:0;transform:translateY(6px);transition:all .5s}.auv-qa.on{opacity:1;transform:none}
.auv-wait{display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;text-align:center;min-height:160px;border:1px dashed #1e3a5f;border-radius:16px;padding:16px;color:#94a3b8}.auv-wait b{color:#e2e8f0}

.au-video{max-width:960px;overflow:hidden}.auyt{position:relative;min-height:min(62dvh,560px);border:1px solid #1e3a5f;border-radius:20px;overflow:hidden;background:radial-gradient(circle at 18% 18%,rgba(56,189,248,.22),transparent 34%),radial-gradient(circle at 82% 30%,rgba(16,185,129,.18),transparent 35%),linear-gradient(135deg,#08111f,#0f172a 58%,#050816);box-shadow:0 22px 70px rgba(0,0,0,.38);isolation:isolate}
.auyt:before{content:"";position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 0 22%,rgba(255,255,255,.07) 24%,transparent 28% 52%,rgba(125,211,252,.08) 55%,transparent 62%);transform:translateX(calc((var(--step,0) - 4)*3%));opacity:.8;pointer-events:none;animation:auytmove 9s linear infinite}
.auyt-bg{position:absolute;inset:0;overflow:hidden;z-index:-1}.auyt-bg span{position:absolute;font-size:clamp(88px,24vw,230px);font-weight:900;line-height:1;color:rgba(255,255,255,.035);filter:blur(.3px);transform:rotate(-12deg)}.auyt-bg span:nth-child(1){left:-3%;top:8%}.auyt-bg span:nth-child(2){right:-4%;bottom:1%;transform:rotate(13deg)}.auyt-bg span:nth-child(3){left:45%;top:45%;font-size:clamp(42px,13vw,120px);opacity:.7;transform:rotate(4deg)}
.auyt-head{display:flex;justify-content:space-between;gap:10px;padding:14px 16px 0;color:#7dd3fc;font-size:11px;letter-spacing:.13em;text-transform:uppercase}.auyt-head em{font-style:normal;color:#34d399;background:rgba(16,185,129,.11);border:1px solid rgba(52,211,153,.24);border-radius:999px;padding:4px 9px;letter-spacing:.08em}
.auyt-body{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:18px;padding:18px 18px 14px;align-items:stretch;min-height:430px}.auyt-main{min-width:0;display:flex;align-items:center;justify-content:center;padding:10px}.auyt-main>*{width:100%;animation:auytpop .38s ease}.auyt-side{display:flex;flex-direction:column;gap:10px;align-self:stretch;border-left:1px solid rgba(148,163,184,.18);padding-left:16px;color:#e2e8f0}.auyt-thumb{height:118px;border-radius:16px;display:grid;place-items:center;font-size:54px;background:linear-gradient(135deg,rgba(56,189,248,.18),rgba(16,185,129,.16));border:1px solid rgba(125,211,252,.2);box-shadow:inset 0 1px 18px rgba(255,255,255,.04)}.auyt-side strong{font-size:18px;line-height:1.12}.auyt-side small{color:#94a3b8}.auyt-bars{height:54px;display:flex;align-items:end;gap:3px;margin:2px 0}.auyt-bars i{flex:1;border-radius:8px 5px 1px 1px;background:linear-gradient(#22c55e,#0891b2);opacity:.86;animation:auytbar 1.6s ease-in-out infinite alternate}.auyt-card{display:block;border:1px solid rgba(148,163,184,.18);border-radius:16px;padding:9px 10px;background:rgba(15,23,42,.72);font-size:12px;color:#cbd5e1}.auyt-card.c0{color:#fff;font-weight:800}.auyt-card.c1{color:#7dd3fc}.auyt-card.c2{color:#34d399}
.auyt-lower{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 18px 16px;padding:10px 12px;border:1px solid rgba(148,163,184,.18);border-radius:16px;background:rgba(2,6,23,.68);backdrop-filter:blur(10px);font-size:12px;color:#cbd5e1}.auyt-lower span:first-child{color:#34d399;font-weight:800}.auyt-lower span:nth-child(2){flex:1;text-align:center;color:#f8fafc}.auyt-lower span:last-child{font-variant-numeric:tabular-nums;color:#94a3b8}
.auyt-1{background:radial-gradient(circle at 20% 10%,rgba(250,204,21,.18),transparent 33%),linear-gradient(135deg,#09111f,#162033 58%,#050816)}.auyt-2{background:radial-gradient(circle at 75% 20%,rgba(239,68,68,.18),transparent 33%),linear-gradient(135deg,#0e1116,#182032 58%,#050816)}.auyt-3{background:radial-gradient(circle at 18% 72%,rgba(168,85,247,.18),transparent 35%),linear-gradient(135deg,#08111f,#111827 58%,#050816)}.auyt-4{background:radial-gradient(circle at 55% 16%,rgba(20,184,166,.20),transparent 33%),linear-gradient(135deg,#07131d,#13233a 58%,#050816)}.auyt-5{background:radial-gradient(circle at 25% 20%,rgba(59,130,246,.20),transparent 34%),linear-gradient(135deg,#06111e,#102030 58%,#050816)}
@keyframes auytmove{to{transform:translateX(8%)}}@keyframes auytpop{from{opacity:.3;transform:scale(.985) translateY(8px)}to{opacity:1;transform:none}}@keyframes auytbar{to{opacity:.45;transform:scaleY(.72)}}
@media(max-width:760px){.auyt{min-height:min(66dvh,620px);border-radius:20px}.auyt-body{grid-template-columns:1fr;gap:10px;min-height:0;padding:12px}.auyt-main{padding:2px}.auyt-side{border-left:0;border-top:1px solid rgba(148,163,184,.18);padding:10px 0 0;display:grid;grid-template-columns:82px 1fr;align-items:center}.auyt-thumb{height:72px;border-radius:16px;font-size:36px;grid-row:span 3}.auyt-bars,.auyt-card.c1,.auyt-card.c2{display:none}.auyt-side strong{font-size:14px}.auyt-lower{margin:0 12px 12px;font-size:11px}.auyt-lower span:nth-child(2){display:none}.aup-stage{padding:4px 8px}.aup-cap{font-size:16px}}

@media (orientation:landscape) and (max-height:520px){.aup-top{padding:4px 10px}.aup-cap{min-height:2.9em;font-size:15px;padding:4px 14px}.aup-ctl{padding:4px 10px 6px}.aup-ctl>button{width:38px;height:38px}.aup-ctl .aup-pp{width:46px;height:46px}.auv-h2{margin-bottom:6px}}
`;
css += '\n/* v335 - estudos visuais + TradingView */\n.aup-ctl .aup-tv-btn{width:auto!important;min-width:80px;padding:6px 12px;font-size:12px;border:1px solid #2a6a97;border-radius:20px;color:#d7f3ff;background:#12334c}\n.au-viz-edu{max-width:660px;margin:14px auto 0;border:1px solid #284d6a;border-radius:16px;padding:12px;background:rgba(3,18,34,.88)}\n.au-viz-label{font-size:10px;letter-spacing:.07em;color:#facc15;font-weight:800}.au-viz-edu svg{width:100%;height:auto;max-height:150px;display:block;margin:8px 0}.au-viz-note{font-size:11px;color:#bcd0e1}\n.au-tv-overlay{position:fixed;inset:0;z-index:100020;background:rgba(2,6,23,.96);display:grid;place-items:center;padding:12px;color:#e2e8f0}.au-tv-panel{width:min(1250px,100%);height:min(92dvh,860px);display:flex;flex-direction:column;background:#0b1728;border:1px solid #38516f;border-radius:16px;padding:12px;gap:10px}.au-tv-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.au-tv-top button{color:#fff;background:#263c56;border:0;border-radius:8px;min-width:40px;min-height:36px}.au-tv-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.au-tv-controls label{margin:0;color:#afc5d8;flex:1 1 140px}.au-tv-controls select{margin:2px 0 0;background:#15263b;color:#fff;border:1px solid #36516d;padding:7px}.au-tv-controls a{color:#7dd3fc;font-size:12px;padding:9px 4px}.au-tv-chart{flex:1;min-height:240px;position:relative}.au-tv-loading{padding:24px;color:#9bb2c9}.au-tv-legal{font-size:11px;color:#9fb4ca;line-height:1.4}.tradingview-widget-copyright{text-align:center;font-size:12px;padding:4px}.tradingview-widget-copyright a{color:#8bbdeb}\n@media(max-width:560px){.au-tv-overlay{padding:4px}.au-tv-panel{padding:8px;height:98dvh}.au-tv-controls label{flex-basis:105px}.au-viz-edu{padding:8px}.aup-ctl .aup-tv-btn{min-width:65px;padding:5px 7px}}\n';

css += '\n/* v336 - motor de cenas, biblioteca de gráficos didáticos e mapa visual */\n.au336-example{margin:12px auto 0;width:min(670px,100%);box-sizing:border-box;border:1px solid #395c75;border-radius:12px;padding:10px;background:#0b2136;color:#e5f4fb}.au336-example svg{display:block;width:100%;height:auto;max-height:158px;margin:8px auto}.au336-example svg text{font-family:system-ui;font-size:10px;fill:#d7e4ef}.au336-head{display:flex;flex-wrap:wrap;align-items:center;gap:7px;justify-content:space-between;font-size:13px;font-weight:700}.au336-head small{font-size:9px;color:#facc15;letter-spacing:.03em}.au336-foot{font-size:10px;color:#b8ccd9}.au336-map-btn{color:#e5f4fb;background:#18344b;border:1px solid #476987;border-radius:8px;padding:6px 10px}.au336-opt{display:flex!important;align-items:center;gap:6px;font-size:12px;color:#bdd2e3;white-space:nowrap}.au336-opt input{accent-color:#2dd4bf}.au336-overlay{position:fixed;inset:0;z-index:100050;display:grid;place-items:center;padding:12px;background:#020817e9}.au336-dialog{width:min(710px,100%);max-height:87dvh;overflow:auto;background:#0d1d2c;border:1px solid #476780;border-radius:12px;color:#e3f0fa;padding:16px;box-sizing:border-box;font:13px/1.5 system-ui}.au336-dialog header{display:flex;align-items:start;justify-content:space-between;gap:10px}.au336-dialog header strong{font-size:16px}.au336-dialog header button{border:1px solid #49657a;border-radius:8px;background:#223b51;color:white;padding:7px 12px}.au336-dialog p{color:#a9c0d2}.au336-list{display:grid;gap:7px}.au336-map-row{display:grid;gap:2px;text-align:left;padding:11px;border:1px solid #304b61;border-radius:8px;background:#142b40;color:#e9f5ff}.au336-map-row span{font-size:11px;color:#abc7d9}@media(max-width:560px){.au336-example{padding:6px;margin:7px auto 0}.au336-example svg{max-height:105px}.au336-head{font-size:11px}.au336-head small{font-size:8px}.au336-dialog{padding:11px}}\n';

css += '\n/* v337 — imagens educacionais geradas e armazenadas de forma privada */\n.au337-figure{width:min(690px,100%);margin:10px auto;border:1px solid #46637b;border-radius:12px;overflow:hidden;background:#09192d}.au337-figure img{width:100%;max-height:230px;object-fit:contain;display:block}.au337-figure figcaption{padding:5px 8px;font-size:9px;color:#facc15;letter-spacing:.04em;text-align:center}.au337-gen-btn{background:#234457;color:#e8f4ff;border:1px solid #417b8e;border-radius:8px;padding:7px 10px;white-space:normal}.au337-gen-btn:disabled{opacity:.5}.au337-status{font-size:11px;color:#bad7e6;flex:1 1 130px}.aup-options{flex-wrap:wrap}@media(max-width:560px){.au337-figure img{max-height:140px}.au337-gen-btn{font-size:11px}}\n';
css += '\n/* v338: janela de teste para aulas, sem custos de API */\n.au338-diag-btn{background:#233956;color:#d9efff;border:1px solid #476583;border-radius:8px;padding:7px 10px}.au338-modal{position:fixed;inset:0;z-index:2147483646;background:#020e1ccd;display:flex;align-items:center;justify-content:center;padding:16px}.au338-panel{width:min(600px,100%);max-height:86dvh;overflow:auto;padding:18px;background:#102239;color:#eef7ff;border:1px solid #59718b;border-radius:16px;box-shadow:0 18px 70px #0008}.au338-panel header{display:flex;align-items:center;justify-content:space-between;gap:15px}.au338-panel header button{padding:7px 12px;border:1px solid #748ca3;border-radius:8px;background:#23405e;color:#fff}.au338-panel p{font-size:12px;color:#b9cfdf}.au338-panel ul{list-style:none;padding:0;display:grid;gap:5px}.au338-check{display:flex;align-items:start;gap:12px;padding:8px;background:#1b3047;border-radius:8px}.au338-check b{display:block;font-size:13px}.au338-check small{display:block;font-size:11px;color:#b9cfdf}.au338-actions{display:flex;flex-wrap:wrap;gap:8px}.au338-actions button{padding:9px;border:1px solid #517391;background:#244765;color:#fff;border-radius:8px}.au338-small{display:block;margin-top:12px;color:#b5cadb;font-size:11px}\n';
css += '\n.au339-voices{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border-top:1px solid #486178;padding:8px 0}.au339-voices label{display:flex;align-items:center;gap:5px;font-size:12px}.au339-voices select{max-width:190px}.au339-voices button{border:1px solid #5a94b4;border-radius:8px;background:#1a4c69;color:#fff;padding:8px}.au339-voices #au339status{font-size:11px;color:#b1cfe0;width:100%}\n';
const st=document.createElement('style');st.id='aulas-css';st.textContent=css;document.head.appendChild(st);
async function limparConta(owner){
 if(!owner)return;for(const key of Object.keys(localStorage))if(key.startsWith('aulas-v318:'+owner+':')||key==='estudos-v316:'+owner)localStorage.removeItem(key);
 await new Promise((ok,no)=>{const r=indexedDB.deleteDatabase('aulas-livros-v318:'+owner);r.onsuccess=ok;r.onerror=()=>no(new Error('Não consegui remover os PDFs locais.'));r.onblocked=()=>no(new Error('Feche outras abas do aplicativo para remover os PDFs locais.'))});
}
const previousRender=render;render=function(){ensureOwner();return previousRender.apply(this,arguments)};
// Unowned legacy metadata is not reused. PDFs remain preserved in their old database, never opened by this version.
try{for(const key of Object.keys(localStorage))if(/^aulas-(lista-v1$|rot-v1:|pos-v1:|job-v1$)/.test(key))localStorage.removeItem(key)}catch{}
window.AULAS={abre,carregaLista,VIS,calcAjuste,_dbg:{cena,P,falasCena},ensureOwner,limparConta, getLista:()=>Array.isArray(AU.lista)?AU.lista.slice():[], progresso:a=>posDe(a)};
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
// Não confundir 'pregão ainda não abriu' com 'feriado sem pregão'.
const situacao=()=>window.TraderCalendario?window.TraderCalendario.visibility(new Date(),AD.data,row=>window.TraderAdr.view(row)):{show:false,reason:'calendario_indisponivel'};
function valorRecente(row,now=new Date()){
 const v=window.TraderAdr.view(row,now),q=v?.regular,at=window.TraderCalendario?.millis(q?.at);
 if(!q||!Number.isFinite(q.px)||q.px<=0||!Number.isFinite(q.chp)||!Number.isFinite(at))return false;
 if(at>now.getTime()+60000||now.getTime()-at>30*60000)return false;
 return window.TraderCalendario.datePart(new Date(at),'America/New_York').date===window.TraderCalendario.datePart(now,'America/New_York').date;
}
async function velas(ativo){const r=await rq('/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo,intervalo:'1d'}),signal:AbortSignal.timeout(20000)});const j=await r.json();return(j.candles||[]).filter(x=>x&&isFinite(x[4]))}
async function load(){
  const gate=situacao();
  if(!gate.show){const was=!!S.dados;S.dados=null;S.err='';S.ts=0;if(was&&typeof adrPaint==='function')adrPaint();return}
  if(Date.now()-S.ts<300000&&S.adrTs===AD.data?.ts)return;
  if(window.DIARIO_DEMO||typeof SESS==='undefined'||!SESS?.at)return;
  const itens=(AD.data&&AD.data.itens)||[];if(!itens.length)return;
  S.busy=1;S.err='';const adrTs=AD.data?.ts;
  try{
    const [ibov,dol]=await Promise.all([velas('IBOV'),velas('USDBRL')]);
    if(ibov.length<2||dol.length<2)throw new Error('Sem histórico do Ibovespa ou do dólar.');
    const ultB3=diaBR(ibov[ibov.length-1][0]);
    const diasBase=(Date.parse(hojeBR()+'T12:00:00Z')-Date.parse(ultB3+'T12:00:00Z'))/86400000;
    if(!Number.isFinite(diasBase)||diasBase<1||diasBase>7)
      throw new Error('Último fechamento da B3 sem referência recente e verificável.');
    // dólar: não transformar ausência de cotação nova em variação fictícia de 0%.
    const dBase=[...dol].reverse().find(x=>diaBR(x[0])<=ultB3),dHoje=dol[dol.length-1];
    if(diaBR(dHoje[0])!==hojeBR())throw new Error('Dólar sem candle de referência no feriado. Projeção indisponível.');
    if(!dBase||!(dBase[4]>0)||!(dHoje[4]>0))throw new Error('Sem câmbio válido na data-base da B3.');
    const usd=diaBR(dHoje[0])>ultB3?(dHoje[4]/dBase[4]-1)*100:0;
    const linhas=[];
    const groups=itens.filter(row=>MAPA[String(row.s).toUpperCase()]&&valorRecente(row));
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
    // Revalidar após as consultas: a sessão pode ter terminado durante o processamento.
    if(!situacao().show||ultB3>=hojeBR()||new Set(linhas.filter(x=>x.teo>0&&x.adr!=='EWZ').map(x=>x.loc)).size<2)
      throw new Error('Sem feriado confirmado, base B3 anterior ou duas ADRs elegíveis.');
    S.dados={ultB3,usd,dolar:dHoje[4],linhas,b3Fechada:true,feriadoB3:true};S.ts=Date.now();S.dataTs=S.ts;S.adrTs=adrTs;
  }catch(e){S.dados=null;S.err=String(e.message||e);S.ts=Date.now()}
  S.busy=0;if(typeof adrPaint==='function')adrPaint();
}
function carrega(){if(S.job)return S.job;S.job=load().finally(()=>{S.job=null});return S.job}
function abHtml(){
  if(!situacao().show)return ''; // em dias comuns, não criar nem o cabeçalho da projeção
  setTimeout(carrega,0);
  const d=S.dados;
  if(!d)return`<div class="adr-ab card-sub"><b>Abertura teórica na B3</b><p class="sm mut">${S.busy?'Calculando…':S.err?h(S.err):'Calcula quando as ADRs carregarem (precisa estar logado).'}</p></div>`;
  const [,m,dd]=d.ultB3.split('-');
  const tab=d.linhas.map(l=>`<tr><td><b>${h(l.loc==='IBOV'?'Ibovespa':l.loc)}</b><small>${h(l.adr)} ${pc(l.adrp)}</small></td><td>${l.base?nf(l.base,l.loc==='IBOV'?0:2):'—'}</td><td class="${cor(l.varp)}"><b>${l.teo?pc(l.varp):'—'}</b></td><td>${l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—'}</td></tr>`).join('');
  return`<div class="adr-ab"><div class="adr-ab-top"><b>Abertura teórica na B3</b>${'<span class="adr-ab-tag">FERIADO B3 · estimativa · base '+dd+'/'+m+'</span>'}</div>
<p class="sm mut">Estimativa exclusiva de feriado da B3 com NYSE em pregão regular, sem prever o leilão de abertura: variação da ADR × variação do dólar (${pc(d.usd)}, R$ ${nf(d.dolar,4)}) sobre o fechamento da B3 em ${dd}/${m}.</p>
<div class="adr-ab-tab"><table><thead><tr><th>Ativo</th><th>Fech. B3</th><th>Var. esperada</th><th>Abertura teórica</th></tr></thead><tbody>${tab||'<tr><td colspan="4" class="mut">Nenhuma ADR da lista tem ação correspondente mapeada.</td></tr>'}</tbody></table></div>
<p class="sm mut">Conta: (1 + var. ADR) × (1 + var. dólar) − 1. Usa o pregão regular de Nova York; pós-mercado, notícias e o leilão de abertura podem mudar o preço. Ibovespa estimado pelo EWZ. Não é cotação.</p></div>`;
}

// Integra a estimativa no mesmo fluxo de desenho, imediatamente depois das ADRs.
function imageHeight(){return situacao().show&&S.dados?.linhas.length?156+S.dados.linhas.slice(0,12).length*58:0}
function drawImage(ctx,width,y){
 if(!situacao().show)return 0;
 const d=S.dados,L=d?.linhas.slice(0,12)||[];if(!L.length)return 0;
 const M=36,H=imageHeight(),top=y+48,boxH=40+L.length*58;
 ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#e2e8f0';ctx.font='700 30px system-ui';ctx.fillText('Abertura teórica na B3',48,y+30);
 ctx.textAlign='right';ctx.fillStyle='#a8b5c5';ctx.font='22px system-ui';ctx.fillText('FERIADO B3 · estimativa · base '+d.ultB3.slice(8)+'/'+d.ultB3.slice(5,7),width-48,y+30);
 ctx.fillStyle='#0d1b28';ctx.strokeStyle='#24313e';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(M,top,width-2*M,boxH,18);ctx.fill();ctx.stroke();
 const cols=[60,560,760,width-60];ctx.font='20px system-ui';ctx.fillStyle='#a8b5c5';
 ['Ativo / ADR','Fech. B3','Variação est.','Preço teórico'].forEach((t,i)=>{ctx.textAlign=i?'right':'left';ctx.fillText(t,cols[i],top+28)});
 L.forEach((l,k)=>{const yy=top+66+k*58;
  if(k){ctx.strokeStyle='#24313e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(56,yy-34);ctx.lineTo(width-56,yy-34);ctx.stroke()}
  ctx.textAlign='left';ctx.font='700 26px system-ui';ctx.fillStyle='#e2e8f0';if(window.TraderAssetIdentity?.draw(ctx,l.loc,60,yy-26,25)){ctx.fillText(l.loc==='IBOV'?'Ibovespa':l.loc,96,yy)}else ctx.fillText(l.loc==='IBOV'?'Ibovespa':l.loc,60,yy);ctx.font='18px system-ui';ctx.fillStyle='#a8b5c5';ctx.fillText(l.adr+' '+pc(l.adrp),60,yy+20);
  ctx.textAlign='right';ctx.font='24px system-ui';ctx.fillStyle='#e2e8f0';ctx.fillText(l.base?nf(l.base,l.loc==='IBOV'?0:2):'—',cols[1],yy);
  ctx.font='700 26px system-ui';ctx.fillStyle=l.teo?(l.varp>0.05?'#22c55e':l.varp<-0.05?'#f87171':'#a8b5c5'):'#a8b5c5';ctx.fillText(l.teo?pc(l.varp):'—',cols[2],yy);
  ctx.fillStyle='#e2e8f0';ctx.fillText(l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—',cols[3],yy);
 });
 ctx.textAlign='left';ctx.fillStyle='#a8b5c5';ctx.font='20px system-ui';ctx.fillText('ADR regular × dólar ('+pc(d.usd)+') · referência, não é preço de leilão.',48,top+boxH+30,width-96);
 ctx.fillText((S.err?'Falha na atualização · cópia anterior. ':'Consulta: ')+new Date(S.dataTs).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' · pós-mercado não incluído.',48,top+boxH+56,width-96);
 return H;
}
window.TraderPreOpen={height:imageHeight,draw:drawImage,prepare:carrega,visibility:situacao};
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
 const style=document.createElement('style');style.textContent=`.radar-picker{box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:80dvh;margin:auto;padding:16px;border:1px solid #344256;border-radius:16px;background:#101820!important;color:#e5edf5!important;box-shadow:0 20px 80px #0009;backdrop-filter:none!important;font:14px system-ui}.radar-picker::backdrop{background:#0009}.radar-picker header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.radar-picker input{box-sizing:border-box;width:100%;background:#08111c;color:#e5edf5;border:1px solid #344256;border-radius:8px;padding:12px;font:16px system-ui}.radar-picker button{color:#e5edf5;background:#182433;border:1px solid #344256;border-radius:8px;padding:10px 12px;min-height:44px;cursor:pointer;font:14px system-ui}.radar-picker-list{display:grid;gap:6px;max-height:55dvh;overflow-y:auto;margin-top:10px}.radar-picker-list button{text-align:left}.radar-picker-list button[aria-current=true]{border-color:#25bf80;background:#123328}.radar-picker button:focus-visible,.radar-picker input:focus-visible{outline:2px solid #25bf80;outline-offset:2px}.radar-picker-trigger{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.radar-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}.radar-quote{display:grid;gap:5px;background:#101820;border:1px solid #2a3544;border-radius:8px;padding:12px;color:#e5edf5;min-width:0}.radar-quote strong{font-size:24px;font-variant-numeric:tabular-nums}.radar-quote small,.radar-news small{color:#a1adbd;font:11px/1.5 system-ui}.radar-news{padding:12px;border-bottom:1px solid #303030}.radar-news a{color:#e5edf5;text-decoration:none;font:14px/1.5 system-ui}.radar-news small{display:block;margin-top:5px}@media(min-width:1400px){.radar-quotes{grid-template-columns:repeat(4,minmax(0,1fr))}}`;document.head.append(style);
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
 const style=document.createElement('style');style.textContent='.season-picker{padding:14px;margin:12px 0;border:1px solid var(--bd);border-radius:12px;background:var(--card);color:var(--tx)}.season-picker>b{font-size:13px}.season-buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin:10px 0;max-height:148px;overflow-y:auto;overscroll-behavior:contain;padding:2px}.season-buttons button{min-height:40px;padding:8px 11px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--mut);font:600 12px system-ui;cursor:pointer}.season-buttons button[aria-pressed=true]{border-color:var(--ac);color:var(--ac);background:var(--surface-raised)}.season-picker small{display:block;font-size:11px;line-height:1.6;color:var(--mut)}';document.head.appendChild(style);
 load('mercado');
})(window);

;
/* módulo: aulas-pro-v315.js — camada rápida de estudo e acabamento das videoaulas. */
(function(){
 'use strict';
 const W=window,D=document;
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const txt=e=>String(e&&e.textContent||'').replace(/\s+/g,' ').trim();
 const clean=s=>String(s||'').replace(/[✓•·]+/g,'').replace(/\s+/g,' ').trim();
 const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const stop=new Set('a o os as um uma de da do das dos para por com sem sobre entre esse essa isso este esta cada como quando onde que qual quais porque entao muito mais menos voce aula cena livro mercado trader'.split(' '));
 function classify(t){t=key(t);if(/graf|candle|preco|tendencia|suporte|resistencia|volume/.test(t))return ['Gráfico','Leitura visual','au-kind-chart'];if(/exemplo|caso|pratico|calculo|passo/.test(t))return ['Exemplo','Aplicação prática','au-kind-example'];if(/risco|stop|erro|cuidado|alerta|perda|margem/.test(t))return ['Alerta','Controle de risco','au-kind-alert'];if(/resumo|conclus|revis|lembrar/.test(t))return ['Resumo','Memorização','au-kind-review'];if(/pergunta|teste|quiz/.test(t))return ['Quiz','Fixação','au-kind-quiz'];return ['Conceito','Base da aula','au-kind-concept']}
 function words(source,n=5){const m=new Map;String(source||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).forEach(w=>{if(w.length>3&&!stop.has(w))m.set(w,(m.get(w)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0])}
 function scenes(){return [...D.querySelectorAll('#aupidx [data-aucena]')].map((b,i)=>({i,el:b,title:clean(txt(b).replace(/^\d+\s*/,''))||('Cena '+(i+1))}))}
 function current(){const at=D.querySelector('#aupprog i.at');return at?[...at.parentNode.children].indexOf(at):0}
 function caption(){return clean(txt(D.getElementById('aupcap')))}
 function lessonTitle(){return clean(txt(D.querySelector('.aup-tt b')))||'Aula'}
 function ensure(){const p=D.getElementById('aup');if(!p)return null;
  if(!p.dataset.pro315){p.dataset.pro315='1';p.insertAdjacentHTML('beforeend','<div class="au-toast" id="auToast" hidden></div>');}
  const top=p.querySelector('.aup-top');
  if(top&&!D.getElementById('auProBar'))top.insertAdjacentHTML('afterend','<div class="au-probar"><b id="auProBar"></b></div>');
  const stage=p.querySelector('.aup-stage');



  const ctl=p.querySelector('.aup-options');
  if(ctl&&!D.getElementById('auReviewBtn'))ctl.insertAdjacentHTML('beforeend','<button id="auReviewBtn" class="au-probtn" type="button">Revisar aula</button><button id="auQuizBtn" class="au-probtn" type="button">Quiz</button>');

  return p;
 }
 function update(){const p=ensure();if(!p)return;const stamp=(D.getElementById("aupct")?.textContent||"")+"|"+caption();if(p.dataset.chrome317===stamp)return;p.dataset.chrome317=stamp;const sc=scenes(),i=current(),total=Math.max(sc.length,1),cap=caption(),title=sc[i]?.title||'Cena atual',kind=classify(title+' '+cap);
  p.classList.remove('au-kind-chart','au-kind-example','au-kind-alert','au-kind-review','au-kind-quiz','au-kind-concept');p.classList.add(kind[2]);
  const bar=D.getElementById('auProBar');bar&&(bar.style.width=Math.max(3,Math.round((i+1)/total*100))+'%');
  const k=D.getElementById('auKind');k&&(k.textContent=kind[0]);
  const low=D.getElementById('auLower');if(low){low.querySelector('b').textContent=title;low.querySelector('span').textContent=kind[1]}
  const strip=D.getElementById('auChapterStrip');if(strip&&strip.dataset.count!==String(sc.length)){strip.dataset.count=String(sc.length);strip.innerHTML=sc.map((s,j)=>`<button type="button" data-aujump="${s.i}"><b>${j+1}</b><span>${esc(s.title)}</span></button>`).join('')}
  D.querySelectorAll('[data-aujump]').forEach((b,j)=>b.classList.toggle('on',j===i));
  const card=D.getElementById('auBlockCard');if(card){const terms=words(title+' '+cap,4);const show=(i>0&&((i+1)%3===0||kind[0]==='Resumo'||i===total-1));if(show){card.hidden=false;card.innerHTML=`<b>O que lembrar deste bloco</b><span>${esc(cap||title)}</span>${terms.length?`<small>${terms.map(esc).join(' · ')}</small>`:''}`}else card.hidden=true}
 }
 function openReview(mode){D.dispatchEvent(new Event('au-study-pause'));const sc=scenes(),i=current(),all=(lessonTitle()+' '+sc.map(s=>s.title).join(' ')+' '+caption()),terms=words(all,8),main=sc.slice(0,6);
  let body='';
  if(mode==='quiz'){
    const qs=[`Qual é a ideia central de ${sc[i]?.title||'esta cena'}?`,`Como você aplicaria esse conceito antes de uma operação real?`,`Qual risco ou cuidado não pode ser ignorado aqui?`];
    body=`<h2>Quiz rápido</h2><p>Responda mentalmente ou em voz alta antes de continuar a aula.</p><ol>${qs.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><div class="au-hint"><b>Dica:</b> procure usar suas próprias palavras, como se estivesse explicando para outro trader.</div>`;
  }else{
    body=`<h2>Revisão da aula</h2><p class="mut">Resumo automático para fixar o conteúdo.</p><h3>Capítulos</h3><ol>${main.map(s=>`<li>${esc(s.title)}</li>`).join('')}</ol><h3>Pontos-chave</h3><div class="au-tags">${(terms.length?terms:['processo','risco','execução']).map(w=>`<span>${esc(w)}</span>`).join('')}</div><h3>Exercício prático</h3><p>Antes da próxima aula, escolha uma operação ou gráfico e explique onde esse conceito aparece no seu processo.</p>`;
  }
  closeModal();D.body.insertAdjacentHTML('beforeend',`<div class="au-modal" id="auModal"><div><button type="button" class="au-close" id="auClose">×</button>${body}</div></div>`);
 }
 function closeModal(){const m=D.getElementById('auModal');m&&m.remove()}
 function toast(s){const t=D.getElementById('auToast');if(!t)return;t.hidden=false;t.textContent=s;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.hidden=true},1800)}
 function inject(){if(D.getElementById('aulas-pro-v315-css'))return;const css=`
.au-probar{height:3px;background:rgba(255,255,255,.13);overflow:hidden}.au-probar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#36d998,#5b9bff);transition:width .35s ease}
.au-cine{position:absolute;z-index:7;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;align-items:center;pointer-events:none;font:700 10px/1.2 system-ui;letter-spacing:.14em;color:#dce7f4;text-shadow:0 2px 8px #000}.au-cine em{font-style:normal;border:1px solid rgba(255,255,255,.2);background:rgba(5,10,18,.5);border-radius:999px;padding:5px 9px;letter-spacing:.08em}.aup-stage{position:relative}.aup-stage:before,.aup-stage:after{content:"";position:absolute;left:0;right:0;height:34px;z-index:6;background:linear-gradient(#0009,#0000);pointer-events:none}.aup-stage:before{top:0}.aup-stage:after{bottom:0;transform:rotate(180deg)}
.au-lower{position:absolute;left:18px;right:18px;bottom:18px;z-index:8;background:linear-gradient(90deg,rgba(5,10,18,.86),rgba(5,10,18,.42));border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:10px 12px;color:#f4f8fb;box-shadow:0 10px 30px #0008;pointer-events:none}.au-lower b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.au-lower span{font-size:11px;color:#b8c7d9}.au-kind-alert .au-lower{border-color:#ff8a8a}.au-kind-chart .au-lower{border-color:#7ab7ff}.au-kind-example .au-lower{border-color:#ffd36a}.au-kind-review .au-lower{border-color:#36d998}
.au-chapters{display:flex;gap:7px;overflow-x:auto;padding:8px 12px 3px}.au-chapters button{flex:0 0 auto;max-width:185px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#dce7f4;border-radius:999px;padding:7px 10px;font:600 11px/1.1 system-ui;display:flex;gap:7px;align-items:center}.au-chapters button b{background:#36d998;color:#06110c;border-radius:50%;min-width:18px;height:18px;display:grid;place-items:center}.au-chapters button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.au-chapters button.on{background:#36d998;color:#06110c;border-color:#36d998}
.au-probtn{width:auto!important;padding:8px 10px!important;font-size:12px!important;border-radius:12px!important;border:1px solid rgba(255,255,255,.16)!important;background:rgba(255,255,255,.08)!important;color:#f4f8fb!important}.au-block-card{margin:8px 14px 0;border:1px solid rgba(54,217,152,.35);background:linear-gradient(135deg,rgba(54,217,152,.12),rgba(91,155,255,.08));border-radius:16px;padding:10px 12px;color:#eaf3fa}.au-block-card b{display:block;margin-bottom:3px}.au-block-card span{display:block;font-size:13px}.au-block-card small{display:block;margin-top:5px;color:#aebfd1}.au-modal{position:fixed;inset:0;background:#000b;z-index:9999;display:grid;place-items:center;padding:18px}.au-modal>div{width:min(520px,100%);max-height:86vh;overflow:auto;background:#111923;color:#edf3f8;border:1px solid #2d3c4f;border-radius:16px;padding:18px;box-shadow:0 25px 90px #000}.au-modal h2{margin:0 0 8px;font-size:20px}.au-modal h3{margin:14px 0 6px;color:#36d998;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.au-close{float:right;border:1px solid #405064;background:#172231;color:#edf3f8;border-radius:12px;width:36px;height:36px;font-size:24px}.au-tags{display:flex;flex-wrap:wrap;gap:7px}.au-tags span{border:1px solid #34506b;background:#172231;border-radius:999px;padding:5px 9px}.au-hint{border:1px solid #34506b;background:#172231;border-radius:12px;padding:10px;margin-top:10px}.au-toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:10000;background:#101923;color:#edf3f8;border:1px solid #31465f;border-radius:999px;padding:9px 14px;box-shadow:0 10px 30px #0008;font:600 13px system-ui}
@media(max-width:520px){.au-lower{left:10px;right:10px;bottom:10px}.au-chapters{padding-left:8px}.au-probtn{padding:7px 8px!important}.au-cine span{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
`;const st=D.createElement('style');st.id='aulas-pro-v315-css';st.textContent=css;D.head.appendChild(st)}
 D.addEventListener('click',e=>{const j=e.target.closest('[data-aujump]');if(j){e.preventDefault();const target=D.querySelector(`#aupidx [data-aucena="${j.dataset.aujump}"]`);target&&target.click();toast('Capítulo '+(Number(j.dataset.aujump)+1));setTimeout(update,120);return}if(e.target.closest('#auReviewBtn')){e.preventDefault();openReview('review');return}if(e.target.closest('#auQuizBtn')){e.preventDefault();openReview('quiz');return}if(e.target.closest('#auClose')||e.target.id==='auModal')closeModal()});
 // v316: o observador anterior observava suas próprias alterações. A atualização periódica basta.
 D.addEventListener('DOMContentLoaded',()=>{inject();update()});setInterval(update,1200);W.AulasPro315={update,review:()=>openReview('review'),quiz:()=>openReview('quiz')};
})();

/* v317: conteúdo sem sobreposição, controles secundários recolhidos. */
(()=>{const st=document.createElement('style');st.textContent=`
#aup{display:flex;flex-direction:column;overflow-y:auto;background:#0b1220;gap:0;padding-bottom:env(safe-area-inset-bottom,0px)}
#aup .aup-top{flex:none;padding:10px 12px;gap:10px;min-height:52px}#aup .aup-x,#aup .aup-ix{width:40px;height:40px;flex:none}#aup .aup-tt{min-width:0}#aup .aup-tt b{font-size:14px}#aup .aup-tt span{font-size:11px}
#aup .aup-stage{flex:1 0 auto;min-height:180px;align-items:flex-start;cursor:pointer;padding:16px;box-sizing:border-box}#aup .aup-stage:before,#aup .aup-stage:after{display:none}#aup .aup-vis{max-height:none;overflow:visible;animation:none}#aup .au-lesson-visual{width:100%;box-sizing:border-box;max-width:900px;margin:auto}#aup .auv-h2{font-size:20px;margin:0 0 18px}#aup .auv-h{font-size:24px}#aup .auv-top li{font-size:16px;line-height:1.5;transform:none;margin-bottom:8px}#aup .auv-top li:not(.on){visibility:hidden}#aup .auv-top li .ic{width:24px;height:24px}#aup .auv-top li small{font-size:13px}
#aup .aup-cap{flex:none;min-height:0;font-size:14px;line-height:1.5;text-align:left;padding:10px 16px;max-height:6.5em;overflow:auto;color:#cbd5e1}#aup .aup-prog{flex:none;padding:8px 16px}
#aup .aup-ctl{flex:none;display:flex;flex-wrap:nowrap;gap:12px;justify-content:center;align-items:center;padding:10px 12px 12px}#aup .aup-ctl>button{width:44px;height:44px;min-width:44px;min-height:44px;box-sizing:border-box}#aup .aup-ctl .aup-pp{width:54px;height:54px}#aup .aup-ctl .aup-options-toggle{width:auto;aspect-ratio:auto;border-radius:12px;padding:0 12px;font-size:13px}
#aup .aup-options[hidden]{display:none!important}#aup .aup-options{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;background:#111d2c;border-top:1px solid #26374c;flex:none;align-items:center}#aup .aup-options button,#aup .aup-options select{width:auto!important;min-height:42px!important;max-width:100%;aspect-ratio:auto;border-radius:12px!important;padding:9px 12px!important;font-size:13px!important;line-height:1.3;background:#18273b;color:#eef4fa;border:1px solid #34485f;box-sizing:border-box}#aup .aup-options #aupvoz{max-width:100%;flex:1;min-width:180px}#aup .aup-idx{z-index:100}#aup .au-chapters,#aup .au-cine,#aup .au-lower,#aup .au-block-card{display:none!important}
@media(orientation:landscape) and (max-height:520px){#aup .aup-stage{min-height:160px}#aup .aup-cap{max-height:4em}}
`;document.head.appendChild(st)})();

/* v340: correção mobile — título, imagem e controles no mesmo quadro, sem espaço elástico. */
(()=>{const css=document.createElement('style');css.id='au340-mobile-fix';css.textContent=`
#aup{height:100dvh;max-height:100dvh;overflow:hidden!important;display:flex;flex-direction:column;box-sizing:border-box}
#aup .aup-top{flex:0 0 auto}
#aup .aup-stage{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain;display:block!important;padding:12px 12px 6px!important}
#aup .aup-vis{max-height:none!important;overflow:visible!important;width:100%;margin:0 auto}
#aup .au-lesson-visual{display:flex;flex-direction:column;gap:10px;width:100%;margin:0 auto!important;min-height:0!important}
#aup .auv-tit{padding:2px 2px 5px;text-align:left;min-height:0!important;margin:0!important}
#aup .auv-tit .auv-h{font-size:clamp(19px,4.9vw,29px);line-height:1.18}
#aup .auyt{min-height:0!important}
#aup .au336-example{margin:2px auto 0!important;max-width:100%;padding:10px}
#aup .au336-example svg{height:auto;max-height:145px;max-width:100%;margin:8px 0}
#aup .au336-head{gap:6px;align-items:flex-start}
#aup .au336-head small{text-align:right;max-width:53%}
#aup .au337-figure{margin:4px auto!important}
#aup .aup-cap{flex:0 0 auto;max-height:65px;overflow-y:auto;font-size:13px!important;padding:5px 13px!important}
#aup .aup-prog{flex:0 0 auto;padding:6px 13px!important}
#aup .aup-ctl{flex:0 0 auto;position:relative;z-index:2;background:#0b1220;padding:7px 8px calc(8px + env(safe-area-inset-bottom,0px))!important;gap:7px!important;flex-wrap:nowrap!important}
#aup .aup-ctl>button{width:39px!important;min-width:39px!important;height:39px!important;min-height:39px!important}
#aup .aup-ctl .aup-pp{width:52px!important;min-width:52px!important;height:52px!important}
#aup .aup-ctl .aup-tv-btn,#aup .aup-ctl .aup-options-toggle{width:auto!important;min-width:0!important;padding:0 8px!important;font-size:11px!important;aspect-ratio:auto!important}
#aup .aup-options:not([hidden]){flex:0 1 auto;max-height:42dvh;overflow-y:auto;overscroll-behavior:contain}
#aup .au340-resume{background:#047857!important;color:white!important;border-color:#34d399!important;font-weight:700!important}
@media(max-width:420px){#aup .aup-stage{padding:9px 9px 3px!important}#aup .au336-example svg{max-height:118px}#aup .aup-top{padding:7px 9px}#aup .aup-ctl{gap:5px!important}#aup .aup-ctl>button{width:35px!important;min-width:35px!important;height:35px!important;min-height:35px!important}#aup .aup-ctl .aup-pp{width:48px!important;min-width:48px!important;height:48px!important}}
@media(orientation:landscape) and (max-height:520px){#aup .aup-stage{min-height:0!important}#aup .aup-cap{max-height:44px}#aup .au336-example svg{max-height:100px}}
`;document.head.appendChild(css)})();

/* v320: janela independente do Terminal; nenhuma execução de ordens. */
(function(){
'use strict';
// v323: o modo destacado só deve controlar a navegação em telas desktop.
// No celular uma janela/PWA independente pode abrir na mesma superfície, prendendo o usuário no Terminal.
const mobileTerminal=(()=>{
 try{return window.matchMedia('(max-width: 767px)').matches||/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent)}catch{return false}
})();
const terminalUrl=new URL(location.href);
const requestedDedicated=terminalUrl.searchParams.get('terminal')==='1';
const dedicated=requestedDedicated&&!mobileTerminal;
if(requestedDedicated&&mobileTerminal){
 // Recuperação automática para links antigos ?terminal=1 no celular.
 try{terminalUrl.searchParams.delete('terminal');history.replaceState(history.state,'',terminalUrl.href)}catch{}
}
function openTerminal(){
 if(mobileTerminal){if(typeof toast==='function')toast('No celular, use o Terminal nesta tela. A janela independente é exclusiva do computador.');return false}
 const url=new URL(location.pathname,location.origin);url.searchParams.set('terminal','1');if(window.DIARIO_DEMO)url.searchParams.set('demo','1');
 const win=window.open(url.href,'diario-terminal-desktop','popup=yes,width=1440,height=900,resizable=yes,scrollbars=yes');
 if(!win){if(typeof toast==='function')toast('O navegador bloqueou a janela. Permita pop-ups deste site e tente novamente.');return false}
 try{win.opener=null;win.focus()}catch{}return true;
}
function mount(){
 const bar=document.querySelector('.trbar');if(!bar)return;
 // Esconde apenas a abertura independente no celular; demais controles e abas seguem ativos.
 if(mobileTerminal){bar.querySelector('[data-terminal-window]')?.remove();return}
 if(bar.querySelector('[data-terminal-window]'))return;
 const b=document.createElement('button');b.type='button';b.className='trbtn';b.dataset.terminalWindow='1';
 b.textContent=dedicated?'Terminal independente':'Abrir em nova janela';b.title=dedicated?'Esta janela mantém o Terminal aberto enquanto você usa o aplicativo principal.':'Abrir o Terminal sem sair desta tela';b.disabled=dedicated;
 b.addEventListener('click',openTerminal);bar.appendChild(b);
}
if(dedicated){
 document.documentElement.classList.add('terminal-window');
 const style=document.createElement('style');style.textContent='.terminal-window #mbtn,.terminal-window #fab,.terminal-window #fabm,.terminal-window nav{display:none!important}.terminal-window #app{padding-bottom:12px!important}';document.head.appendChild(style);
 // Antes de cada renderização: a navegação do aplicativo principal não afeta esta janela.
 const previous=render;render=function(){const signedIn=typeof SESS!=='undefined'&&!!SESS?.uid;tab=signedIn||window.DIARIO_DEMO?'term':'conta';const result=previous.apply(this,arguments);document.title='Terminal · Diário Trader';mount();return result};
}
if(window.TraderUI)window.TraderUI.onRender('terminal-desktop-v320',mount);
else{const previous=render;render=function(){const result=previous.apply(this,arguments);mount();return result}}
// Apenas a sessão é compartilhada. Não copia estado de diário/carteira de outra janela.
window.addEventListener('storage',event=>{
 if(event.storageArea&&event.storageArea!==localStorage)return;
 if(event.key!=='diario-sess'||window.DIARIO_DEMO)return;
 let session=null;try{session=event.newValue?JSON.parse(event.newValue):null}catch{return}
 const current=typeof SESS!=='undefined'?SESS?.uid||null:null;
 if((session?.uid||null)!==current){location.reload();return}
 if(session&&typeof session.at==='string'&&typeof session.rt==='string'&&typeof session.exp==='number')SESS=session;
});
window.TerminalDesktop320={open:openTerminal,mount,dedicated};mount();
})();

/* v321: ferramentas sobre os Workspaces já existentes. Não contém execução de ordens. */
(function(){
'use strict';
const doc=document;let modalOwner=null;
const owner=()=>window.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'?SESS?.uid||null:null);
const notify=m=>{if(typeof toast==='function')toast(m)};
function guard(expected=owner()){if(!expected||expected!==owner())throw Error('Entre na mesma conta para alterar o Workspace.');return expected}
const state=()=>window.TRM.TS();
const custom=id=>/^ws321_[a-z0-9_]+$/.test(id)||/^u[a-z0-9]{7,}$/.test(id);
const integer=(n,min,max)=>Number.isFinite(n)&&Number.isInteger(n)&&n>=min&&n<=max;
function validate(input){
 if(!input||input.format!=='diario-terminal-workspace'||input.version!==1)throw Error('Arquivo de Workspace incompatível.');
 const l=input.layout;if(!l||!Array.isArray(l.p)||!Array.isArray(l.g)||!l.p.length||l.p.length>24||l.g.length!==l.p.length)throw Error('O Workspace deve ter de 1 a 24 painéis.');
 const p=l.p.map(x=>{if(typeof x!=='string'||!x.trim()||x.length>80||/[\u0000-\u001f\u007f<>]/.test(x))throw Error('Comando de painel inválido.');return x.trim()});
 const g=l.g.map(v=>{if(!v||!integer(v.x,0,11)||!integer(v.y,0,200)||!integer(v.w,1,12)||!integer(v.h,1,200)||v.x+v.w>12)throw Error('Dimensões de painel inválidas.');return{x:v.x,y:v.y,w:v.w,h:v.h}});
 return{n:String(l.n||'Meu Workspace').trim().slice(0,40)||'Meu Workspace',p,g};
}
function snapshot(){guard();if(window.TRPOP)throw Error('Abra o Terminal completo para salvar um Workspace.');const l=window.TRM.layAtual();return validate({format:'diario-terminal-workspace',version:1,layout:{n:l.n,p:l.p,g:l.g}})}
function exportData(){return{format:'diario-terminal-workspace',version:1,layout:snapshot()}}
function commit(){const t=window.TRM.TR;if(t){t.foco=0;t.mob=0;t.max=-1}save();close();render()}
function copy(name){guard();const l=snapshot();if(!String(name||'').trim())return null;l.n=String(name).trim().slice(0,40);const id='ws321_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),s=state();s.wss[id]=l;s.ws=id;commit();return id}
function restore(id){guard();const s=state();if(!Object.hasOwn(s.wss,id))throw Error('Workspace não encontrado.');s.ws=id;commit()}
function rename(name){guard();const s=state();if(!custom(s.ws))throw Error('Duplique o modelo padrão antes de renomear.');if(!String(name||'').trim())return false;s.wss[s.ws].n=String(name).trim().slice(0,40);commit();return true}
function remove(){guard();const s=state(),id=s.ws;if(!custom(id))throw Error('Os modelos padrão são preservados.');const next=Object.keys(s.wss).find(x=>x!==id);if(!next)throw Error('Mantenha pelo menos um Workspace.');delete s.wss[id];s.ws=next;commit()}
function importData(data,expected=owner()){guard(expected);const l=validate(data),id='ws321_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),s=state();s.wss[id]=l;s.ws=id;commit();return id}
async function importFile(file){const expected=guard();if(!file)return;if(file.size>65536)throw Error('O arquivo deve ter no máximo 64 KB.');const raw=await file.text();guard(expected);if(raw.length>65536)throw Error('Arquivo muito grande.');return importData(JSON.parse(raw),expected)}
function close(){const d=doc.getElementById('workspace321');if(d){try{d.close()}catch{}d.remove()}modalOwner=null}
function open(){guard();close();modalOwner=owner();const d=doc.createElement('dialog');d.id='workspace321';d.setAttribute('aria-label','Gerenciar Workspaces');d.innerHTML='<form method="dialog"><button class="ws321-close" aria-label="Fechar">×</button><h2>Seus Workspaces</h2><p>Salve e recupere seus painéis de consulta.</p><select id="ws321select" aria-label="Workspace"></select><button type="button" data-ws321="restore">Abrir selecionado</button><button type="button" data-ws321="copy">Salvar cópia dos painéis atuais</button><button type="button" data-ws321="rename">Renomear atual</button><button type="button" data-ws321="delete">Excluir atual</button><hr><button type="button" data-ws321="export">Exportar layout (.json)</button><label class="ws321-upload">Importar layout<input type="file" accept=".json,application/json" id="ws321file" hidden></label><small>Exporta somente nomes, comandos e distribuição dos painéis. Modelos padrão são preservados.</small><div id="ws321error" role="status"></div></form>';
 const s=state(),select=d.querySelector('select');for(const[id,l]of Object.entries(s.wss)){const o=doc.createElement('option');o.value=id;o.textContent=l.n||id;o.selected=id===s.ws;select.appendChild(o)}for(const x of ['rename','delete'])d.querySelector('[data-ws321="'+x+'"]').disabled=!custom(s.ws);
 doc.body.appendChild(d);try{d.showModal()}catch{d.setAttribute('open','')};d.addEventListener('close',()=>{d.remove();modalOwner=null});
}
function mount(){if(doc.getElementById('workspace321')&&modalOwner!==owner())close();const bar=doc.querySelector('.trbar');if(!bar||bar.querySelector('[data-ws321-open]')||window.TRPOP)return;const b=doc.createElement('button');b.type='button';b.className='trbtn';b.dataset.ws321Open='1';b.textContent='Workspaces';b.title='Duplicar, renomear e exportar os espaços de trabalho';b.onclick=()=>{try{open()}catch(e){notify(e.message)}};bar.appendChild(b)}
doc.addEventListener('click',e=>{const b=e.target.closest('[data-ws321]');if(!b)return;try{guard(modalOwner);const action=b.dataset.ws321;if(action==='restore')restore(doc.getElementById('ws321select').value);if(action==='copy'){const n=prompt('Nome da cópia:',state().wss[state().ws].n+' — cópia');if(n){guard(modalOwner);copy(n)}}if(action==='rename'){const n=prompt('Novo nome:',state().wss[state().ws].n);if(n){guard(modalOwner);rename(n)}}if(action==='delete'&&confirm('Excluir este Workspace personalizado? Seus registros do diário e da carteira não serão apagados.')){guard(modalOwner);remove()}if(action==='export'){const text=JSON.stringify(exportData(),null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=doc.createElement('a');a.href=url;a.download='terminal-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}catch(err){const box=doc.getElementById('ws321error');if(box)box.textContent=err.message;else notify(err.message)}});
doc.addEventListener('change',async e=>{if(e.target.id!=='ws321file')return;try{guard(modalOwner);await importFile(e.target.files?.[0])}catch(err){const box=doc.getElementById('ws321error');if(box)box.textContent=err.message}});
const style=doc.createElement('style');style.textContent='#workspace321{background:#101c2b;color:#edf4fb;border:1px solid #35516b;border-radius:16px;padding:20px;width:min(390px,86vw);max-height:85dvh;overflow:auto;box-sizing:border-box;box-shadow:0 20px 70px #0008}#workspace321::backdrop{background:#0009}#workspace321 h2{margin:4px 0 8px;font-size:22px}#workspace321 p,#workspace321 small{font-size:12px;color:#a9bacd;line-height:1.5}#workspace321 button,#workspace321 select,.ws321-upload{display:block;width:100%;box-sizing:border-box;text-align:left;min-height:40px;margin:7px 0;padding:9px 12px;border-radius:8px;border:1px solid #38516a;background:#192b40;color:#edf4fb;font:inherit;font-size:13px;cursor:pointer}#workspace321 button:disabled{opacity:.4;cursor:default}#workspace321 .ws321-close{float:right;width:36px;text-align:center;margin:0;min-height:36px}#ws321error{color:#ffb4b4;font-size:13px;margin-top:10px}';doc.head.appendChild(style);
if(window.TraderUI)window.TraderUI.onRender('workspaces-tools-v321',mount);mount();window.Workspaces321={validate,snapshot,exportData,copy,restore,rename,remove,importData,importFile,mount};
})();
/* v322: restauracao segura e sugestoes de layouts de consulta. Nao executa ordens. */
(function(){
'use strict';
const D=document;
let last=null,dialog=null,sessionOwner=null;
const owner=()=>window.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'?SESS?.uid||null:null);
const copy=x=>JSON.parse(JSON.stringify(x));
const message=s=>{if(typeof window.toast==='function')window.toast(s)};
const get=()=>{if(!window.TRM?.TS||!window.TRM?.TR||!window.trWsPad)throw Error('Terminal nao disponivel.');const uid=owner();if(!uid)throw Error('Entre na sua conta.');return{uid,s:window.TRM.TS()}};
const resetFocus=()=>{const t=window.TRM.TR;t.foco=0;t.mob=0;t.max=-1};
const persist=()=>{resetFocus();save();close();render()};
const safe=(fn)=>{try{fn()}catch(e){const target=D.getElementById('auto322-error');if(target)target.textContent=e.message;else message(e.message)}};
function preserve(){const {uid,s}=get();last={uid,ws:s.ws,wss:copy(s.wss)};}
function undo(){const {uid,s}=get();if(!last||last.uid!==uid)throw Error('Nao ha alteracao recente para desfazer.');const before={uid,ws:s.ws,wss:copy(s.wss)};s.wss=copy(last.wss);s.ws=last.ws;last=before;persist();}
function original(){const {s}=get(),current=s.ws;const presetKey=Object.keys(presets).find(k=>current==='ws321_auto_'+k);if(presetKey){const preset=presets[presetKey];const layout=preset.base?copy(window.trWsPad[preset.base]):{n:preset.name,p:preset.panels.slice(),g:grid(preset.panels.length)};if(!layout)throw Error('Modelo original nao encontrado.');if(!confirm('Restaurar a organizacao original de '+preset.name+'?'))return;preserve();s.wss[current]=layout;s.ws=current;persist();return;}const key=Object.hasOwn(window.trWsPad,current)?current:'br';const base=window.trWsPad[key];if(!base)throw Error('Modelo original nao encontrado.');if(!confirm(key===current?'Restaurar o modelo original de '+base.n+'?':'Abrir o modelo padrao '+base.n+'? Seu Workspace personalizado sera preservado.'))return;preserve();s.wss[key]=copy(base);s.ws=key;persist();}
const presets={
 pre:{name:'Pre-abertura',base:'pre'},
 live:{name:'Pregao brasileiro',panels:['WEI','ECO','FX','WIRP','NEWS','EVT']},
 post:{name:'Pos-pregao',panels:['JORNAL','NEWS','ECO','STAT','EVT']}
};
function grid(count){const cols=count<=2?1:count<=4?2:3,rows=Math.ceil(count/cols),w=12/cols,h=Math.max(6,Math.floor(26/rows));return Array.from({length:count},(_,i)=>({x:(i%cols)*w,y:Math.floor(i/cols)*h,w,h}));}
function apply(kind){const {s}=get(),preset=presets[kind];if(!preset)throw Error('Modo invalido.');let layout;if(preset.base){layout=copy(window.trWsPad[preset.base]);if(!layout)throw Error('Modelo ausente.');}else{layout={n:preset.name,p:preset.panels.slice(),g:grid(preset.panels.length)};}
 // Reutiliza um ambiente estavel por sessao em vez de criar uma copia a cada clique.
 // Workspaces anteriores e personalizados continuam intocados.
 const id='ws321_auto_'+kind;
 if(s.ws===id){close();message('Ambiente '+preset.name+' ja esta aberto.');return;}
 preserve();if(!Object.hasOwn(s.wss,id))s.wss[id]=layout;s.ws=id;persist();message('Ambiente '+preset.name+' selecionado.');}
function close(){if(dialog){try{dialog.close()}catch{}dialog.remove();dialog=null}sessionOwner=null;}
function show(){const {uid,s}=get();close();sessionOwner=uid;dialog=D.createElement('dialog');dialog.id='auto322';dialog.setAttribute('aria-label','Organizar Terminal');dialog.innerHTML='<div class="auto322-head"><strong>Organizar Terminal</strong><button type="button" data-auto322="close" aria-label="Fechar">×</button></div><p>Escolha um ambiente de consulta. Cada modo reutiliza seu proprio ambiente e preserva seus Workspaces personalizados.</p><div class="auto322-modes"><button type="button" data-auto322="pre">☀ Pré-abertura</button><button type="button" data-auto322="live">◉ Pregão</button><button type="button" data-auto322="post">◷ Pós-pregão</button></div><hr><button type="button" data-auto322="original">↺ Restaurar modelo original</button><button type="button" data-auto322="undo" '+(!last||last.uid!==uid?'disabled':'')+'>↶ Desfazer última mudança</button><small>Restaurar recupera o modelo do modo atual. Para outros Workspaces personalizados, abre Ações Brasil sem apagar suas configurações.</small><div id="auto322-error" role="status"></div>';
 D.body.appendChild(dialog);dialog.addEventListener('close',()=>{dialog?.remove();dialog=null;sessionOwner=null});try{dialog.showModal()}catch{dialog.setAttribute('open','')};}
function mount(){const bar=D.querySelector('.trbar');if(!bar||bar.querySelector('[data-auto322-open]')||window.TRPOP)return;const b=D.createElement('button');b.type='button';b.className='trbtn';b.dataset.auto322Open='1';b.textContent='Organizar';b.title='Restaurar original ou criar ambiente de pré-abertura, pregão e pós-pregão';b.addEventListener('click',()=>safe(show));bar.appendChild(b);}
D.addEventListener('click',e=>{const b=e.target.closest('[data-auto322]');if(!b)return;const action=b.dataset.auto322;if(action==='close'){close();return}safe(()=>{if(sessionOwner!==owner())throw Error('Sua sessao mudou. Reabra o menu.');if(action==='undo')undo();else if(action==='original')original();else apply(action);});});
const css=D.createElement('style');css.textContent='#auto322{width:min(460px,92vw);box-sizing:border-box;background:#101c2b;color:#edf4fb;border:1px solid #38516a;border-radius:16px;padding:20px;max-height:85dvh;overflow:auto;box-shadow:0 20px 60px #0008}#auto322::backdrop{background:#0009}#auto322 .auto322-head{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:18px}#auto322 p,#auto322 small{color:#acbfd0;line-height:1.5;font-size:12px}#auto322 button{display:block;width:100%;text-align:left;background:#1a3047;color:#edf4fb;border:1px solid #3a536b;border-radius:8px;padding:11px;min-height:42px;margin:8px 0;cursor:pointer;font:inherit;font-size:13px}#auto322 button:disabled{opacity:.45;cursor:default}#auto322 .auto322-head button{width:38px;text-align:center;margin:0}#auto322 hr{border:0;border-top:1px solid #38516a;margin:16px 0}#auto322-error{color:#ffb4b4;font-size:12px;margin-top:8px}@media(max-width:767px){#auto322{width:calc(100vw - 24px);max-height:78dvh;padding:14px;border-radius:16px}#auto322 .auto322-head{font-size:16px}#auto322 button{min-height:38px;padding:9px;margin:5px 0}#auto322 hr{margin:10px 0}#auto322 p{margin:10px 0}#auto322 small{display:block;margin-top:8px}}';D.head.appendChild(css);
if(window.TraderUI?.onRender)window.TraderUI.onRender('terminal-auto-v322',()=>{if(dialog&&sessionOwner!==owner())close();mount();});mount();
window.TerminalOrganizador322={mount,apply,original,undo,grid};
})();

;
/* v325 — Central de consulta consolidada. Sem execução de ordens, APIs novas ou modificação do Supabase. */
(function(){
'use strict';
if(window.TraderConsulta325)return;
const doc=document, modes={pre:'Pré-abertura',live:'Pregão',post:'Pós-pregão'};
const symbols=[['CME_MINI:NQ1!','Nasdaq futuro'],['CME_MINI:ES1!','S&P 500 futuro'],['BMFBOVESPA:WIN1!','WIN'],['BMFBOVESPA:WDO1!','WDO'],['FX_IDC:USDBRL','USD/BRL'],['TVC:DXY','DXY'],['TVC:VIX','VIX'],['TVC:US10Y','Treasury 10 anos']];
const params={s:symbols.map(x=>x[0])};
let dialog=null, dialogOwner=null, lastRender=0, timeline=[], lastKnown={}, sessionChannel=null, syncOwner=null, noticeSeen=new Set();
const owner=()=>window.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'?SESS?.uid||null:null);
const key=s=>'dt-consulta325-'+s+'-'+owner();
function safeStorageRead(k,fallback){try{const v=JSON.parse(localStorage.getItem(k));return v===null?fallback:v}catch{return fallback}}
function safeStorageWrite(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
const dom=(tag,text,cls)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
function btn(label,fn,cls){const b=dom('button',label,cls||'c325-btn');b.type='button';b.addEventListener('click',fn);return b}
function userSafe(){if(!owner())throw Error('Faça login para usar as preferências personalizadas.');if(!window.TRM?.TS)throw Error('Terminal indisponível nesta tela.');}
function feedback(message){const p=doc.querySelector('#c325-feedback');if(p){p.textContent=message;p.setAttribute('role','status')}else if(typeof window.toast==='function')window.toast(message)}
function close(){if(dialog){const d=dialog;dialog=null;dialogOwner=null;try{d.close()}catch{}d.remove()}}
function shell(title){userSafe();close();dialogOwner=owner();const d=dialog=dom('dialog',undefined,'c325-dialog');d.setAttribute('aria-label',title);const h=dom('div',undefined,'c325-head');h.append(dom('strong',title),btn('×',close,'c325-close'));d.append(h);d.append(dom('p','Informações de consulta. Sem envio de ordens.','c325-muted'));const content=dom('div',undefined,'c325-content');d.append(content);const status=dom('p','','c325-status');status.id='c325-feedback';d.append(status);d.addEventListener('close',()=>{if(dialog===d){dialog=null;dialogOwner=null}d.remove()});doc.body.append(d);try{d.showModal()}catch{d.setAttribute('open','')};return content}
function section(parent,title){const box=dom('section',undefined,'c325-section');box.append(dom('h3',title));parent.append(box);return box}
function timeBR(date){return new Date(date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function getQuotes(){const a=window.TRM;if(!a?.trGet)return {rows:[],status:'indisponível',timestamp:null};try{const state=a.trGet('cot',params),rows=state?.v?.itens||[];return {rows,status:state.err?'falha na fonte':!state.v?'aguardando fonte':(Date.now()-Number(state.ts||0)>120000?'consulta antiga':'consulta em cache'),timestamp:state.v?.em||null,error:state.err||null}}catch{return {rows:[],status:'sem leitura',timestamp:null}}}
function quality(q){if(!q)return 'sem cotação';if(q.atraso===true)return 'com atraso';if(q.atraso===false)return 'tempo real declarado pela fonte';return 'atraso não confirmado'}
function format(v){return typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('pt-BR',{maximumFractionDigits:4}):'—'}
function quotesView(parent){const {rows,status,timestamp,error}=getQuotes();parent.append(dom('p','Estado da consulta: '+status+(timestamp?' · '+timeBR(timestamp):'')+'.','c325-muted'));if(error)parent.append(dom('p','Fonte: '+String(error).slice(0,160),'c325-muted'));const table=dom('div',undefined,'c325-rows');for(const [id,label]of symbols){const q=rows.find(r=>r.pedido===id||r.s===id),row=dom('div',undefined,'c325-row');const name=dom('span',label),value=dom('strong',format(q?.px)),source=dom('small',q?(String(q.fonte||'Fonte não informada')+' · '+quality(q)):'sem informação');row.append(name,value,source);table.append(row)}parent.append(table);parent.append(dom('p','Preço, horário e atraso dependem dos provedores existentes. Não presuma tempo real quando o atraso não for confirmado.','c325-muted'));return rows}
function currentMode(){const dt=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(dt);const val=k=>parts.find(p=>p.type===k)?.value;const weekday=val('weekday'),minutes=Number(val('hour'))*60+Number(val('minute'));if(['Sat','Sun'].includes(weekday))return {mode:'post',reason:'Fim de semana · conferir calendário oficial de pregão'};if(minutes<9*60)return {mode:'pre',reason:'Horário de Brasília, regra indicativa'};if(minutes<18*60)return {mode:'live',reason:'Horário de Brasília, regra indicativa'};return {mode:'post',reason:'Horário de Brasília, regra indicativa'};}
function adviseMode(parent){const suggestion=currentMode(),prefs=safeStorageRead(key('pref'),{confirm:true});parent.append(dom('p','Sugestão: '+modes[suggestion.mode]+' · '+suggestion.reason+'.','c325-muted'));parent.append(dom('p','Feriados, horários especiais da B3 e mudanças nas sessões dos EUA não são verificados automaticamente aqui.','c325-muted'));for(const [code,label]of Object.entries(modes))parent.append(btn('Abrir '+label,()=>{if(dialogOwner!==owner())return feedback('Sessão alterada.');if(prefs.confirm&&!confirm('Abrir ambiente '+label+'? O Workspace atual será preservado.'))return;try{window.TerminalOrganizador322.apply(code);close()}catch(e){feedback(e.message)}}));const toggle=dom('label',undefined,'c325-check');const check=doc.createElement('input');check.type='checkbox';check.checked=prefs.confirm;check.addEventListener('change',()=>safeStorageWrite(key('pref'),{confirm:check.checked}));toggle.append(check,dom('span','Confirmar antes de trocar o Workspace'));parent.append(toggle)}
function appendEvent(label,details,stamp){if(!owner())return;const event={id:Date.now()+'-'+Math.random().toString(36).slice(2,6),stamp:stamp||Date.now(),label:String(label).slice(0,90),details:String(details).slice(0,180)};const items=safeStorageRead(key('events'),[]);if(items.some(x=>x.label===event.label&&Math.abs(x.stamp-event.stamp)<180000))return;items.push(event);safeStorageWrite(key('events'),items.slice(-100))}
function timelineView(parent){const items=safeStorageRead(key('events'),[]);parent.append(dom('p','Histórico local dos eventos registrados neste dispositivo. Não é um histórico completo das cotações ou das notícias.','c325-muted'));if(!items.length)parent.append(dom('p','Sem eventos registrados.'));else for(const e of items.slice(-25).reverse()){const line=dom('p',undefined,'c325-event');line.append(dom('b',timeBR(e.stamp)+' · '+e.label),dom('small',e.details));parent.append(line)}parent.append(btn('Registrar observação do mercado',()=>{const note=prompt('Descreva o evento que você observou (não informe senhas ou dados pessoais):');if(note?.trim()){appendEvent('Observação manual',note.trim());open('timeline')}}));parent.append(btn('Limpar histórico local',()=>{if(!confirm('Apagar apenas o histórico local desta central? Seus Workspaces e Diário não serão afetados.'))return;safeStorageWrite(key('events'),[]);open('timeline')}))}
function sinceLast(parent){const last=safeStorageRead(key('lastSeen'),0),items=safeStorageRead(key('events'),[]).filter(e=>e.stamp>last);parent.append(dom('p',last?'Última consulta desta central: '+timeBR(last):'Primeira consulta neste dispositivo.','c325-muted'));parent.append(dom('p',items.length+' evento(s) registrados desde a última consulta.'));for(const e of items.slice(-10).reverse())parent.append(dom('p',timeBR(e.stamp)+' · '+e.label+' — '+e.details,'c325-event'));parent.append(btn('Marcar como lido',()=>{safeStorageWrite(key('lastSeen'),Date.now());open('since')}));}
function context(parent){parent.append(dom('p','Contexto observável a partir das fontes já conectadas. Não é explicação causal nem recomendação de operação.','c325-muted'));const rows=quotesView(parent),found=symbols.map(([id,label])=>({label,q:rows.find(r=>r.pedido===id||r.s===id)})).filter(x=>Number.isFinite(x.q?.d1));if(found.length){parent.append(dom('h3','Variações informadas pelas fontes'));for(const x of found){parent.append(dom('p',x.label+': '+(x.q.d1>0?'+':'')+format(x.q.d1)+'% · '+quality(x.q),'c325-event'))}}parent.append(dom('p','Notícias e agenda continuam nos painéis já existentes (NEWSBR, NEWSUS e EVT). Esta visão não duplica esses feeds.','c325-muted'))}
function open(page='home'){const root=shell(({home:'Central de Consulta',quality:'Qualidade das cotações',sessions:'Ambientes por sessão',timeline:'Linha do tempo',since:'Desde a última consulta',context:'O que move o mercado?'})[page]||'Central de Consulta');if(page==='home'){root.append(dom('p','Acesso único a recursos complementares; não cria novos feeds nem duplica os painéis existentes.','c325-muted'));for(const [id,label]of [['sessions','Organizar por sessão'],['quality','Qualidade das cotações'],['context','O que move o mercado?'],['timeline','Linha do tempo local'],['since','Desde a última consulta']])root.append(btn(label,()=>open(id)));return}root.append(btn('← Voltar à central',()=>open('home')));if(page==='sessions')adviseMode(root);if(page==='quality')quotesView(root);if(page==='context')context(root);if(page==='timeline')timelineView(root);if(page==='since')sinceLast(root)}
function mount(){const bar=doc.querySelector('.trbar');if(!bar||bar.querySelector('[data-consulta325]')||window.TRPOP)return;const b=btn('Consulta +',()=>{try{open()}catch(e){feedback(e.message)}},'trbtn');b.dataset.consulta325='1';b.title='Qualidade dos dados, contexto, histórico e ambientes';bar.append(b)}
const css=dom('style');css.textContent='.c325-dialog{box-sizing:border-box;width:min(490px,calc(100vw - 22px));max-height:78dvh;overflow:auto;margin:auto;padding:17px;border:1px solid #395775;border-radius:16px;background:#101c2b;color:#e9f3fb;font:14px/1.5 system-ui;box-shadow:0 18px 70px #0009}.c325-dialog::backdrop{background:#0009}.c325-head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:18px}.c325-close{border:1px solid #47637e;border-radius:8px;background:#20334c;color:white;padding:8px 12px;cursor:pointer}.c325-btn{display:block;width:100%;text-align:left;background:#20344d;color:#ecf5ff;border:1px solid #48607b;border-radius:8px;padding:10px 12px;min-height:42px;margin:7px 0;cursor:pointer;font:inherit}.c325-btn:focus-visible,.c325-close:focus-visible{outline:2px solid #39cf93}.c325-muted{color:#a9bac9;font-size:12px}.c325-status{color:#f1bc76;font-size:12px}.c325-section{margin:12px 0}.c325-row{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:8px 0;border-bottom:1px solid #34465d}.c325-row small{grid-column:1/-1;color:#aab6c4}.c325-event{border-bottom:1px solid #2e4459;padding:7px 0;font-size:12px}.c325-event small{display:block;color:#aab6c4}.c325-check{display:flex;align-items:center;gap:9px;padding:10px 0}.c325-check input{width:18px;height:18px}@media(max-width:767px){.c325-dialog{max-height:75dvh;padding:13px}.c325-btn{min-height:38px;padding:8px 11px;margin:5px 0}}';doc.head.append(css);
if(window.TraderUI?.onRender)window.TraderUI.onRender('terminal-consulta-v325',()=>{if(dialog&&dialogOwner!==owner())close();mount()});mount();window.TraderConsulta325={mount,open,getQuotes,quality,currentMode,appendEvent};
})();


/* v326 — Consolidação visual de comandos, assistente de consulta e observação de cache.
   Não transmite ordens, não substitui fontes nem a navegação mobile. */
(function(){
'use strict';
if(window.TraderCommand326)return;
const D=document;
const storagePrefix='dt-commander326-';
let modal=null, connectedOwner=null, lastNotice='', autoTimer=null;
const userId=()=>window.DIARIO_DEMO?'demo':typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):null;
const storageKey=k=>storagePrefix+(userId()||'anonymous')+'-'+k;
const read=(k,f)=>{try{let v=JSON.parse(localStorage.getItem(storageKey(k)));return v===null?f:v}catch{return f}};
const write=(k,v)=>{if(!userId())return;try{localStorage.setItem(storageKey(k),JSON.stringify(v))}catch{}};
const elem=(tag,txt,cls)=>{const el=D.createElement(tag);if(txt!==undefined)el.textContent=txt;if(cls)el.className=cls;return el};
const makeButton=(txt,callback,cls='tc326-btn')=>{const b=elem('button',txt,cls);b.type='button';b.addEventListener('click',callback);return b};
function close(){if(!modal)return;const d=modal;modal=null;connectedOwner=null;try{d.close()}catch{}d.remove()}
function dialog(title){if(!userId())return null;close();connectedOwner=userId();const d=modal=elem('dialog',undefined,'tc326-modal');const head=elem('header',undefined,'tc326-head');head.append(elem('b',title),makeButton('✕',close,'tc326-close'));d.append(head);const body=elem('div',undefined,'tc326-body');d.append(body);d.addEventListener('close',()=>{if(modal===d){modal=null;connectedOwner=null}d.remove()});D.body.append(d);try{d.showModal()}catch{d.setAttribute('open','')};return body}
const actions=[
 ['planner328','Planejar Pré-Mercado · Global, WIN, WDO','layout',()=>window.TraderPre328?.open()],
 ['brief328','Briefing de consulta · Pré-Mercado','file',()=>window.TraderPre328?.briefing()],
 ['observer328','Observador de mudanças nas cotações','activity',()=>window.TraderObservador328?.settings()],
 ['sessions','Sessões · Pré, Pregão, Pós','clock',()=>window.TraderConsulta325?.open('sessions')],
 ['organize','Restaurar e desfazer layout','rotate',()=>D.querySelector('[data-auto322-open]')?.click()],
 ['workspaces','Gerenciar Workspaces','grid',()=>D.querySelector('[data-ws321-open]')?.click()],
 ['quality','Qualidade das cotações','pulse',()=>window.TraderConsulta325?.open('quality')],
 ['context','Contexto Brasil / EUA','globe',()=>window.TraderConsulta325?.open('context')],
 ['timeline','Linha do tempo de observações','history',()=>window.TraderConsulta325?.open('timeline')],
 ['since','Desde a última consulta','bookmark',()=>window.TraderConsulta325?.open('since')],
 ['notices','Radar de atenção','bell',()=>radar()],
 ['prefs','Preferências de automação','settings',()=>settings()],
 ['focus','Alternar Modo Foco (desktop)','monitor',()=>window.TraderVisual327?.toggleFocus()],
 ['density','Alternar densidade compacta (desktop)','layout',()=>window.TraderVisual327?.toggleDensity()],
 ['window','Terminal em nova janela (PC)','window',()=>D.querySelector('[data-terminal-window]:not(:disabled)')?.click()]
 ];
function runAction(act){close();if(act[0]==='window'&&!D.querySelector('[data-terminal-window]:not(:disabled)'))return;try{act[3]()}catch(e){if(typeof window.toast==='function')window.toast('Comando indisponível: '+e.message)}}
function palette(){const root=dialog('Comandos · Terminal');if(!root)return;root.append(elem('p','CONSULTA DE MERCADO  ·  SEM EXECUÇÃO DE ORDENS','tc326-overline'));const suggestion=read('prefs',{showSuggestion:true}).showSuggestion!==false;if(suggestion){const ses=sessionInfo();const names={pre:'Pré-Abertura',live:'Pregão',post:'Pós-Pregão'};const line=elem('div',undefined,'tc326-suggestion');line.append(elem('span','Sessão sugerida: '+(names[ses.mode]||'Consulta')+' · regra indicativa'));line.append(makeButton('Ver ambientes',()=>runAction(actions[0]),'tc326-mini'));root.append(line)}
 const field=elem('input',undefined,'tc326-search');field.type='search';field.placeholder='Pesquisar comandos, janelas ou dados…';field.setAttribute('aria-label','Pesquisar comandos do Terminal');root.append(field);
 const list=elem('div',undefined,'tc326-list');root.append(list);function update(){list.replaceChildren();const term=field.value.trim().toLocaleLowerCase('pt-BR');const found=actions.filter(a=>a[1].toLocaleLowerCase('pt-BR').includes(term));if(!found.length){list.append(elem('p','Nenhum comando encontrado.','tc326-muted'));return}for(const a of found){if(a[0]==='window'&&matchMedia('(max-width:767px)').matches)continue;list.append(makeButton(a[1],()=>runAction(a)))}}field.addEventListener('input',update);field.addEventListener('keydown',e=>{if(e.key==='Enter'){const a=actions.find(a=>a[1].toLocaleLowerCase('pt-BR').includes(field.value.trim().toLocaleLowerCase('pt-BR')));if(a){e.preventDefault();runAction(a)}}});update();if(matchMedia('(min-width:768px)').matches)field.focus();}
function sourceStatus(){const c=window.TraderConsulta325;const q=c?.getQuotes?.()||{rows:[],status:'não disponível'};const data=q.rows||[];const unavailable=data.filter(x=>!Number.isFinite(Number(x.px))).length;
 const delayed=data.filter(x=>x.atraso===true).length;const unknown=data.filter(x=>x.atraso!==true&&x.atraso!==false).length;
 return {state:q.status||'indisponível',count:data.length,unavailable,delayed,unknown,rows:data,stamp:q.timestamp};}
function sessionInfo(){try{return window.TraderConsulta325?.currentMode?.()||{mode:'pre',reason:'Indisponível'}}catch{return {mode:'pre',reason:'Indisponível'}}}
function radar(){const root=dialog('Radar de atenção');if(!root)return;const s=sourceStatus();const label={'pre':'Pré-abertura','live':'Pregão','post':'Pós-pregão'}[sessionInfo().mode];
 root.append(elem('p','SESSÃO SUGERIDA · '+label+' (regra de horário indicativa)','tc326-overline'));
 const summary=elem('div',undefined,'tc326-cards');for(const [n,v]of [['Fonte',s.state],['Ativos recebidos',String(s.count)],['Atraso declarado',String(s.delayed)],['Sem preço',String(s.unavailable)]]){const card=elem('div',undefined,'tc326-card');card.append(elem('small',n),elem('strong',v));summary.append(card)}root.append(summary);
 const notes=[];if(s.count===0)notes.push('Sem cotações no cache consultado. Confira os provedores no painel de qualidade.');if(s.delayed)notes.push(s.delayed+' cotação(ões) com atraso informado pela fonte.');if(s.unknown)notes.push(s.unknown+' cotação(ões) sem confirmação do regime de atraso.');if(String(s.state).includes('antiga'))notes.push('Consulta antiga. Não interprete como preço ao vivo.');if(!notes.length)notes.push('Nenhum alerta de qualidade identificável no cache atual. Isso não garante tempo real.');
 for(const t of notes)root.append(elem('p','• '+t,'tc326-msg'));
 root.append(elem('p','Atenção: não há monitoramento confiável de notícias ou calendário oficial nesta função. Não deduz operações a partir das variações.','tc326-muted'));
 root.append(makeButton('Ver fontes e preços',()=>{close();window.TraderConsulta325?.open('quality')}));}
function settings(){const root=dialog('Preferências · Terminal');if(!root)return;const prefs=read('prefs',{showSuggestion:true,monitorData:false,notifyDelay:true});const safeText=elem('p','A organização automática não altera o Workspace sem sua confirmação. Horários são indicativos; feriados e sessões especiais não são validados.','tc326-muted');root.append(safeText);
 for(const [id,title,desc]of [['showSuggestion','Sugerir sessão ao abrir','Exibe Pré-Abertura, Pregão ou Pós-Pregão, sem alterar janelas'],['monitorData','Monitorar qualidade das cotações','Analisa o cache existente a cada 90 segundos, apenas com o aplicativo aberto'],['notifyDelay','Avisar sobre atraso declarado','Só avisa quando o cache informar atraso ou falta de dados']]){const row=elem('label',undefined,'tc326-setting');const cb=elem('input');cb.type='checkbox';cb.checked=Boolean(prefs[id]);cb.addEventListener('change',()=>{prefs[id]=cb.checked;write('prefs',prefs);setupMonitor()});const descbox=elem('span');descbox.append(elem('b',title),elem('small',desc));row.append(cb,descbox);root.append(row)}
 root.append(makeButton('Abrir sessões',()=>{close();window.TraderConsulta325?.open('sessions')}));}
function setupMonitor(){if(autoTimer){clearInterval(autoTimer);autoTimer=null}if(!read('prefs',{}).monitorData||!userId())return;autoTimer=setInterval(()=>{if(!userId()||D.hidden)return;const s=sourceStatus();let key=[s.state,s.delayed,s.unavailable,s.count].join('|');if(key===lastNotice)return;lastNotice=key;if(s.count===0||s.delayed>0||(s.count&&s.unavailable>0)){const bar=D.querySelector('[data-tc326-status]');if(bar){bar.textContent='● Checar dados';bar.title='Cotações indisponíveis ou com atraso informado';bar.classList.add('tc326-warning')} if(read('prefs',{}).notifyDelay&&typeof window.toast==='function')window.toast('Terminal: verifique a qualidade das cotações.')}} ,90000)}
function mount(){const bar=D.querySelector('.trbar');if(!bar||window.TRPOP)return;const signed=Boolean(userId());if(!signed)return;if(!bar.querySelector('[data-tc326-menu]')){const btn=makeButton('⌕ Comandos',palette,'trbtn tc326-trigger');btn.dataset.tc326Menu='1';btn.title='Abrir comandos de consulta (Ctrl+K no PC)';bar.append(btn)}
 if(!bar.querySelector('[data-tc326-status]')){const badge=makeButton('● Dados',radar,'trbtn tc326-status');badge.dataset.tc326Status='1';badge.title='Ver qualidade das fontes';bar.append(badge)}bar.classList.add('tc326-ready');}
D.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&D.querySelector('.trbar')&&!window.TRPOP){e.preventDefault();palette()}if(e.key==='Escape'&&modal)close()});
D.addEventListener('visibilitychange',()=>{if(!D.hidden&&userId())mount()});
if(window.TraderUI?.onRender)window.TraderUI.onRender('terminal-commands-v326',()=>{if(modal&&connectedOwner!==userId())close();mount()});
const observer=new MutationObserver(()=>{if(D.querySelector('.trbar')&&!D.querySelector('[data-tc326-menu]'))mount()});observer.observe(D.body,{childList:true,subtree:true});
const css=elem('style');css.textContent=`
.tc326-ready [data-consulta325],.tc326-ready [data-auto322-open],.tc326-ready [data-ws321-open]{display:none!important}
.tc326-trigger{border-color:#9c793e!important;background:#3a2d1a!important;color:#ffda8c!important;font-weight:700!important}
.tc326-status{border-color:#3a5e63!important;color:#90dbce!important;font-size:12px!important}
.tc326-warning{color:#ffd184!important;border-color:#95713c!important}
.tc326-modal{box-sizing:border-box;border:1px solid #3c5364;background:#0a121b;color:#e6edf2;border-radius:12px;padding:0;width:min(530px,calc(100vw - 18px));max-height:83dvh;overflow:auto;box-shadow:0 25px 85px #000c;font:13px/1.45 system-ui}
.tc326-modal::backdrop{background:#000a}
.tc326-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;background:#111e29;border-bottom:1px solid #304250;padding:12px 16px;z-index:1;letter-spacing:.2px}
.tc326-close{cursor:pointer;border:1px solid #354856;background:#1d2e3c;color:#dce7ef;padding:6px 10px;border-radius:8px}
.tc326-body{padding:14px 16px 18px}
.tc326-overline{color:#d0a860;letter-spacing:1.1px;text-transform:uppercase;font-size:10px;font-weight:700}
.tc326-search{display:block;box-sizing:border-box;background:#142332;border:1px solid #466073;color:#fff;border-radius:8px;width:100%;padding:11px;outline-offset:2px;font:inherit}
.tc326-list{display:grid;grid-template-columns:1fr;gap:5px;margin-top:11px}
.tc326-btn{width:100%;cursor:pointer;text-align:left;background:#152535;color:#e6edf2;border:1px solid #334958;padding:10px 12px;border-radius:8px;font:inherit;min-height:40px}
.tc326-btn:hover,.tc326-btn:focus-visible{background:#244157;outline:1px solid #bb914c}
.tc326-suggestion{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#1c2c38;border:1px solid #3f5666;border-radius:8px;padding:9px;margin:8px 0;color:#dbe7ef;font-size:12px}.tc326-mini{background:#3b301e;color:#ffd08b;border:1px solid #866a3c;border-radius:8px;padding:6px 10px;cursor:pointer;flex:none}.tc326-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0}
.tc326-card{display:flex;flex-direction:column;gap:5px;background:#152431;border:1px solid #334655;border-radius:8px;padding:12px;min-width:0}
.tc326-card small{color:#9db1bf}.tc326-card strong{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.tc326-muted{font-size:12px;color:#9db1bf;line-height:1.5}
.tc326-msg{background:#1b2a35;border-left:2px solid #d0a860;padding:8px 10px;font-size:12px}
.tc326-setting{display:flex;gap:11px;align-items:flex-start;border-bottom:1px solid #263a4a;padding:12px 0;cursor:pointer}
.tc326-setting input{width:18px;height:18px;flex:none;accent-color:#d0a860}.tc326-setting span{display:grid;gap:3px}.tc326-setting small{color:#91a7b7;font-size:11px}
@media(max-width:767px){.tc326-modal{max-height:78dvh}.tc326-body{padding:12px}.tc326-head{padding:10px 12px}.tc326-trigger{font-size:12px!important}}
`;D.head.append(css);
mount();setupMonitor();window.TraderCommand326={mount,palette,radar,settings,sourceStatus,sessionInfo};
})();


/* v327: ajustes de visualização do Terminal no desktop.
 * Não altera Workspaces nem executa ordens. Reaproveita grade e drag nativos. */
(function(){
'use strict';
const doc=document;
const desk=()=>window.matchMedia('(min-width: 900px)').matches;
const terminal=()=>doc.body.classList.contains('trmon')&&!!doc.querySelector('.trbar');
const identity=()=>window.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'&&SESS?.uid?SESS.uid:null);
const key=(part)=>'terminal-v327-'+String(identity()||'anonymous')+'-'+part;
let previous=null;
function load(part){try{return localStorage.getItem(key(part))==='1'}catch{return false}}
function store(part,value){try{localStorage.setItem(key(part),value?'1':'0')}catch{}}
function apply(){
 const allowed=desk()&&terminal()&&!!identity();
 doc.body.classList.toggle('tr327-focus',allowed&&load('focus'));
 doc.body.classList.toggle('tr327-dense',allowed&&load('dense'));
 const b=doc.querySelector('[data-tr327-focus]');if(b){b.setAttribute('aria-pressed',String(doc.body.classList.contains('tr327-focus')));b.textContent=doc.body.classList.contains('tr327-focus')?'◧ Sair do foco':'◩ Modo Foco'}
}
function toggle(part){if(!desk()||!terminal()||!identity())return false;store(part,!load(part));apply();return true}
function mount(){const bar=doc.querySelector('.trbar');if(!bar||!desk()||!identity()||window.TRPOP){apply();return}
 if(!bar.querySelector('[data-tr327-focus]')){
  const b=doc.createElement('button');b.type='button';b.className='trbtn tr327-focus-btn';b.dataset.tr327Focus='1';b.title='Ocultar elementos secundários do Terminal (Shift+F)';b.addEventListener('click',()=>toggle('focus'));bar.append(b);
 }
 apply();
}
doc.addEventListener('keydown',e=>{if(!e.shiftKey||e.ctrlKey||e.metaKey||e.altKey||e.key.toLowerCase()!=='f'||e.repeat)return;
 const el=doc.activeElement;if(el&&(el.matches('input,textarea,select,[contenteditable="true"]')||el.closest('[contenteditable="true"],dialog')))return;
 if(desk()&&terminal()){e.preventDefault();toggle('focus')}
});
if(window.TraderUI?.onRender)window.TraderUI.onRender('desktop-visual-v327',mount);
window.addEventListener('resize',apply);
const observer=new MutationObserver(()=>{if(terminal()&&!doc.querySelector('[data-tr327-focus]')&&desk())mount();else if(!terminal()&&doc.body.classList.contains('tr327-focus'))apply()});
observer.observe(doc.getElementById('app')||doc.body,{childList:true,subtree:false});
const style=doc.createElement('style');style.textContent=`
/* V327: somente desktop e somente dentro do Terminal; preserva os painéis nativos. */
@media(min-width:900px){
 body.trmon.tr327-focus .trbar{padding:4px 6px!important;gap:4px!important}
 body.trmon.tr327-focus .trbar .trcmd{min-height:30px!important;height:30px!important}
 body.trmon.tr327-focus .trbar .trbtn{min-height:30px!important;padding:4px 8px!important;font-size:11px!important}
 body.trmon.tr327-focus .trrod{display:none!important}
 body.trmon.tr327-dense .trbar{gap:4px!important;padding:4px 6px!important}
 body.trmon.tr327-dense .trbar .trbtn{min-height:30px!important;padding:4px 7px!important;font-size:11px!important}
 body.trmon.tr327-dense .trph{min-height:27px!important;padding:3px 5px!important}
 body.trmon.tr327-dense .trph .trx{min-height:23px!important;padding:2px 5px!important}
 body.trmon.tr327-dense .trpb{font-size:12px!important}
 body.trmon .tr327-focus-btn{border-color:#a47a39!important;color:#ffd38a!important}
}
`;doc.head.append(style);
window.TraderVisual327={toggleFocus:()=>toggle('focus'),toggleDensity:()=>toggle('dense'),apply,mount};
mount();
})();
/* v328 — Planejamento de pré-mercado. Mantém todas as funções existentes e não executa ordens.
   Atualiza apenas Workspaces v328 com consentimento explícito e cópia de segurança. */
(function(){
'use strict';
if(window.TraderPre328)return;
const D=document,ID='pre328-dialog', PREFIX='diario-pre328-';
const presets={
 global:{name:'Pré-Mercado · Visão Global',desc:'Primeira leitura: exterior, indicadores, agenda, juros e notícias.',panels:[['WEI','Radar global'],['ECO','Agenda e indicadores'],['WIRP','Juros'],['FX','Câmbio'],['NEWS','Notícias'],['EVT','Eventos']]},
 win:{name:'Pré-Mercado · Foco WIN',desc:'Cenário externo, ações brasileiras, commodities e risco de calendário.',panels:[['WEI','Exterior'],['TOP','Destaques Brasil'],['CMDTY','Commodities'],['ECO','Agenda econômica'],['WIRP','Juros'],['NEWS','Notícias']]},
 wdo:{name:'Pré-Mercado · Foco WDO',desc:'Dólar global, juros, agenda Brasil/EUA e notícias relevantes.',panels:[['FX','Câmbio'],['WIRP','Curva de juros'],['WEI','Índices globais'],['ECO','Agenda econômica'],['EVT','Eventos'],['NEWS','Notícias']]},
 live:{name:'Pregão · Radar de Consulta',desc:'Foco no acompanhamento sem recriar a plataforma de execução.',panels:[['WEI','Mercados globais'],['ECO','Indicadores'],['FX','Câmbio'],['WIRP','Juros'],['NEWS','Notícias'],['EVT','Eventos']]},
 post:{name:'Pós-Pregão · Revisão',desc:'Reconstituir acontecimentos e consultar diário e estatísticas.',panels:[['JORNAL','Jornal do Pregão'],['NEWS','Notícias'],['ECO','Agenda'],['STAT','Estatísticas'],['EVT','Eventos']]}
};
const who=()=>window.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):null);
const key=x=>PREFIX+who()+'-'+x;
function read(name,def){try{const v=JSON.parse(localStorage.getItem(key(name)));return v===null?def:v}catch{return def}}
function write(name,v){try{if(who())localStorage.setItem(key(name),JSON.stringify(v))}catch{}}
const copy=x=>JSON.parse(JSON.stringify(x));
const el=(tag,txt,cls)=>{let x=D.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x};
const button=(txt,fn,cls='pre328-btn')=>{const b=el('button',txt,cls);b.type='button';b.addEventListener('click',fn);return b};
const state=()=>{const t=window.TRM?.TS?.();if(!t?.wss||!who())throw Error('Terminal indisponível ou sessão expirada.');return t};
let modal=null;
function close(){if(!modal)return;const x=modal;modal=null;try{x.close()}catch{}x.remove()}
function openDialog(title){close();const x=modal=el('dialog',undefined,'pre328-modal');x.id=ID;const h=el('header',undefined,'pre328-head');h.append(el('strong',title),button('✕',close,'pre328-close'));x.append(h);const body=el('section',undefined,'pre328-body');x.append(body);D.body.append(x);x.addEventListener('close',()=>{if(modal===x)modal=null;x.remove()});try{x.showModal()}catch{x.setAttribute('open','')};return body}
function grid(n){const cols=n<3?1:n<5?2:3;const h=Math.max(6,Math.floor(26/Math.ceil(n/cols)));return Array.from({length:n},(_,i)=>({x:i%cols*12/cols,y:Math.floor(i/cols)*h,w:12/cols,h}));}
function setWorkspace(kind,ids,force=false){const s=state(),p=presets[kind];if(!p)throw Error('Modelo desconhecido.');const selected=ids.filter(x=>p.panels.some(i=>i[0]===x));if(selected.length<2||selected.length>8)throw Error('Selecione de dois a oito painéis.');const id='ws328_'+kind,found=s.wss[id];if(found&&!force){s.ws=id;window.TRM.TR.foco=0;window.TRM.TR.mob=0;window.TRM.TR.max=-1;save();render();return 'Workspace existente reaberto sem alterações.'}
 const old={ws:s.ws,existing:found?copy(found):null};write('undo',old);
 s.wss[id]={n:p.name,p:selected.slice(),g:grid(selected.length)};s.ws=id;window.TRM.TR.foco=0;window.TRM.TR.mob=0;window.TRM.TR.max=-1;save();render();return 'Workspace salvo e aberto. Os demais espaços foram preservados.';}
function undo(){const prev=read('undo',null);if(!prev)throw Error('Nenhuma troca recente para desfazer.');const s=state(),current=s.ws;if(!current.startsWith('ws328_'))throw Error('O Workspace atual não é do planejador.');if(prev.existing)s.wss[current]=prev.existing;else delete s.wss[current];if(prev.ws&&s.wss[prev.ws])s.ws=prev.ws;window.TRM.TR.foco=0;window.TRM.TR.mob=0;window.TRM.TR.max=-1;write('undo',null);save();render()}
function quoteReport(){const q=window.TraderConsulta325?.getQuotes?.()||{rows:[],status:'não disponível'};const data=Array.isArray(q.rows)?q.rows:[];const picks=['IBOV','SPX','NDX','DXY','US10Y','WIN','WDO'];const selected=data.filter(v=>picks.some(t=>String(v.pedido||v.s||'').toUpperCase().includes(t))).slice(0,9);return{data,selected,atrasos:data.filter(v=>v.atraso===true).length,semPreco:data.filter(v=>!Number.isFinite(Number(v.px))).length,status:q.status||'Fonte não identificada',stamp:q.timestamp};}
function briefing(){const body=openDialog('Briefing de consulta · Pré-Mercado'),q=quoteReport();body.append(el('div','RESUMO AUTOMÁTICO BASEADO APENAS NO CACHE DISPONÍVEL','pre328-label'));
 body.append(el('p','Cenário de consulta: priorize os índices globais, o DXY, os Treasuries, a curva de DI e a agenda econômica antes de analisar WIN e WDO.','pre328-note'));
 body.append(el('div','Qualidade: '+q.data.length+' cotação(ões) no cache · '+q.atrasos+' com atraso declarado · '+q.semPreco+' sem preço válido.','pre328-alert'));
 if(q.selected.length){const section=el('div',undefined,'pre328-quotes');for(const a of q.selected){const name=String(a.pedido||a.s||'Ativo');const pct=Number(a.d1);const valid=Number.isFinite(pct);section.append(el('div',name+' · '+(valid?(pct>0?'+':'')+pct.toFixed(2)+'%':'variação indisponível')+(a.atraso===true?' · ATRASADO':'')))}body.append(section)}else body.append(el('p','Ainda não há cotações selecionáveis no cache. Consulte Radar Global e Qualidade dos Dados.','pre328-note'));
 body.append(el('p','Este briefing não interpreta notícias nem presume causa de movimentos. Dados podem estar atrasados. Confira Agenda e Notícias nos painéis existentes.','pre328-note'));
 body.append(button('Consultar qualidade das fontes',()=>{close();window.TraderConsulta325?.open?.('quality')}));
 body.append(button('Abrir planejamento de sessão',()=>open()));}
function open(){if(!who())return;const root=openDialog('Planejador do Terminal');root.append(el('p','Escolha a finalidade da consulta. O aplicativo reutiliza painéis que já existem, sem abrir ordens nem sobrescrever seus Workspaces.','pre328-note'));
 const suggestion=window.TraderConsulta325?.currentMode?.();const suggested=({pre:'global',live:'live',post:'post'})[suggestion?.mode]||'global';
 let mode=read('lastMode',suggested);if(!presets[mode])mode=suggested;
 const tabs=el('div',undefined,'pre328-tabs'),content=el('div');root.append(tabs,content);
 function draw(){tabs.replaceChildren();for(const [id,p]of Object.entries(presets)){const b=button(p.name.replace('Pré-Mercado · ','').replace('Pregão · ','').replace('Pós-Pregão · ',''),()=>{mode=id;write('lastMode',id);draw()},'pre328-tab');b.setAttribute('aria-pressed',String(mode===id));tabs.append(b)}
 content.replaceChildren();const p=presets[mode];content.append(el('h3',p.name),el('p',p.desc,'pre328-note'));
 const existing=state().wss['ws328_'+mode];content.append(el('p',existing?'Este ambiente já existe. Abrir preserva sua disposição atual; recriar utiliza os painéis selecionados.':'Este ambiente ainda não foi criado.','pre328-note'));
 const list=el('div',undefined,'pre328-panes');const selected=read('choices-'+mode,p.panels.map(x=>x[0]));for(const [id,label]of p.panels){const row=el('label',undefined,'pre328-item'),cb=el('input');cb.type='checkbox';cb.value=id;cb.checked=selected.includes(id);cb.addEventListener('change',()=>write('choices-'+mode,[...list.querySelectorAll('input:checked')].map(x=>x.value)));row.append(cb,el('span',label),el('small',id));list.append(row)}content.append(list);
 const status=el('p',undefined,'pre328-note');status.setAttribute('role','status');content.append(status);
 const actions=el('div',undefined,'pre328-actions');actions.append(button(existing?'Abrir Workspace salvo':'Criar e abrir ambiente',()=>{try{const ids=[...list.querySelectorAll('input:checked')].map(x=>x.value);status.textContent=setWorkspace(mode,ids,false);close()}catch(e){status.textContent=e.message}}));
 actions.append(button('Recriar usando seleção',()=>{if(!confirm('Recriar este ambiente usando os painéis selecionados? Outros Workspaces serão preservados.'))return;try{const ids=[...list.querySelectorAll('input:checked')].map(x=>x.value);status.textContent=setWorkspace(mode,ids,true);close()}catch(e){status.textContent=e.message}}));
 content.append(actions)}draw();
 root.append(button('↶ Desfazer última troca do planejador',()=>{try{undo();close()}catch(e){const p=el('p',e.message,'pre328-alert');root.append(p)}}));
 root.append(button('Gerar briefing de consulta',briefing));
 root.append(el('p','A seleção por horário é apenas sugestiva. Feriados, horários especiais e fusos de bolsas devem ser confirmados nas fontes oficiais.','pre328-note'));
}
function mount(){const bar=D.querySelector('.trbar');if(!bar||bar.querySelector('[data-pre328]')||window.TRPOP||!who())return;const b=button('◫ Planejar sessão',open,'trbtn pre328-trigger');b.dataset.pre328='1';b.title='Pré-Mercado: Global, WIN ou WDO · Pregão · Pós-Pregão';bar.append(b)}
const css=el('style');css.textContent=`
.pre328-modal{box-sizing:border-box;border:1px solid #3a5264;background:#0d1722;color:#f0f5fa;border-radius:12px;padding:0;width:min(650px,calc(100vw - 18px));max-height:86dvh;overflow:auto;font:13px/1.5 system-ui;box-shadow:0 25px 70px #000b}
.pre328-modal::backdrop{background:#000a}.pre328-head{position:sticky;top:0;background:#152331;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #385266;font-size:16px}.pre328-close{background:#26384a;border:1px solid #455c70;color:#eaf1f6;border-radius:8px;padding:6px 12px;cursor:pointer}.pre328-body{padding:14px 16px}.pre328-note{font-size:12px;color:#a9bdcc;margin:8px 0;line-height:1.5}.pre328-body h3{color:#eed29a;margin:13px 0 2px;font-size:15px}.pre328-label{color:#d7aa69;letter-spacing:1px;font-size:10px;font-weight:700}.pre328-tabs{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0}.pre328-tab{background:#1b2b39;border:1px solid #405366;border-radius:8px;color:#d5e1e9;padding:8px 10px;cursor:pointer;font:inherit}.pre328-tab[aria-pressed=true]{border-color:#e4b567;background:#44341c;color:#ffe2ab}.pre328-panes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:12px 0}.pre328-item{display:flex;align-items:center;gap:8px;background:#192a39;border:1px solid #344a5c;border-radius:8px;padding:9px;min-width:0;cursor:pointer}.pre328-item input{accent-color:#e5b565;width:17px;height:17px;flex:none}.pre328-item span{flex:1}.pre328-item small{color:#8da8ba;font-size:10px}.pre328-btn{background:#20354a;border:1px solid #48617a;color:#edf5fb;border-radius:8px;padding:10px 12px;cursor:pointer;text-align:left;font:inherit;margin:4px 0}.pre328-btn:hover,.pre328-btn:focus-visible{outline:1px solid #e1b874;background:#2b455c}.pre328-actions{display:flex;flex-wrap:wrap;gap:8px}.pre328-alert{border-left:3px solid #e1b874;background:#2a2d2c;padding:9px;color:#f4d5a1}.pre328-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:12px 0}.pre328-quotes div{background:#192a39;padding:8px;border-radius:8px}.pre328-trigger{color:#f0d39e!important;border-color:#9b7945!important}
@media(max-width:767px){.pre328-modal{max-height:78dvh}.pre328-body{padding:10px}.pre328-panes{grid-template-columns:1fr}.pre328-tabs{gap:3px}.pre328-tab{padding:7px;font-size:11px}.pre328-actions{display:grid;grid-template-columns:1fr}}
`;D.head.append(css);
if(window.TraderUI?.onRender)window.TraderUI.onRender('pre328-plan',mount);
const obs=new MutationObserver(()=>{if(D.querySelector('.trbar')&&!D.querySelector('[data-pre328]'))mount()});obs.observe(D.getElementById('app')||D.body,{childList:true,subtree:false});
window.TraderPre328={open,briefing,mount,presets,undo,setWorkspace,quoteReport};mount();
})();
/* v328 — Registro local opcional de mudanças observadas nas fontes conectadas.
   Sem feeds adicionais; não representa análise causal, tempo real ou sinal de trade. */
(function(){
'use strict';if(window.TraderObservador328)return;
const D=document;
const owner=()=>window.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):null);
const storage=k=>'diario-obs328-'+owner()+'-'+k;
const get=(k,def)=>{try{const v=JSON.parse(localStorage.getItem(storage(k)));return v??def}catch{return def}};
const set=(k,v)=>{try{if(owner())localStorage.setItem(storage(k),JSON.stringify(v))}catch{}};
const valid=r=>{const a=Number(r?.d1);return Number.isFinite(a)&&a>-100&&a<1000&&r?.atraso===false};
let timer=null;
function snapshot(){const source=window.TraderConsulta325?.getQuotes?.();if(!source?.rows?.length||!owner())return{ok:false,reason:'Sem cotações para comparar.'};
 const rows=source.rows.filter(valid);if(!rows.length)return{ok:false,reason:'Nenhuma cotação com regime de atraso confirmado como não atrasado.'};
 const now=Date.now();const curr={at:now,values:{}};for(const r of rows){const symbol=String(r.pedido||r.s||'').slice(0,25);if(symbol)curr.values[symbol]={pct:Number(r.d1),atraso:r.atraso}};
 const prev=get('snapshot',null);set('snapshot',curr);if(!prev||now-prev.at>3*60*60*1000)return{ok:true,count:0,reason:'Referência inicial registrada.'};
 let count=0;for(const [sym,v]of Object.entries(curr.values)){const old=prev.values?.[sym];if(!old||!Number.isFinite(old.pct))continue;
 const diff=v.pct-old.pct;if(Math.abs(diff)<0.75)continue;
 const tag=sym+'-'+Math.floor(now/(15*60*1000));const seen=get('seen',{});if(seen[tag])continue;
 window.TraderConsulta325?.appendEvent?.('Mudança observada · '+sym,'Variação informada pela fonte passou de '+old.pct.toFixed(2)+'% para '+v.pct.toFixed(2)+'% entre duas consultas locais. Sem inferência de causa.',now);
 seen[tag]=now;for(const k of Object.keys(seen))if(now-seen[k]>4*60*60*1000)delete seen[k];set('seen',seen);count++;if(count>=5)break}
 return{ok:true,count,reason:count?count+' mudança(s) registrada(s) na linha do tempo.':'Sem mudanças acima do limiar desde a última observação.'};}
function monitor(){if(timer){clearInterval(timer);timer=null}if(!get('enabled',false)||!owner())return;timer=setInterval(()=>{if(D.hidden||!D.querySelector('.trbar')||!owner())return;snapshot()},120000)}
function settings(){const box=D.createElement('dialog');box.className='obs328-modal';box.setAttribute('aria-label','Observador de mercado');const wrap=D.createElement('section');wrap.className='obs328-content';box.append(wrap);
 const h=D.createElement('h3');h.textContent='Observador de mercado';wrap.append(h);
 const intro=D.createElement('p');intro.textContent='Registra alterações observadas no cache de cotações e as envia para a linha do tempo local, sem fazer novas consultas. Não substitui dados oficiais nem executa ordens.';wrap.append(intro);
 const label=D.createElement('label');const check=D.createElement('input');check.type='checkbox';check.checked=get('enabled',false);label.append(check,D.createTextNode(' Monitorar automaticamente a cada 2 minutos, enquanto o Terminal estiver aberto'));wrap.append(label);
 const hint=D.createElement('p');hint.textContent='Só utiliza linhas identificadas explicitamente como não atrasadas, com variação percentual válida. Registra mudanças de 0,75 ponto percentual ou mais e limita duplicações. Não infere notícias nem causas.';wrap.append(hint);
 const message=D.createElement('p');message.setAttribute('role','status');wrap.append(message);
 check.addEventListener('change',()=>{set('enabled',check.checked);monitor();message.textContent=check.checked?'Monitoramento ativado neste dispositivo.':'Monitoramento desativado.'});
 const run=D.createElement('button');run.textContent='Comparar agora';run.addEventListener('click',()=>{message.textContent=snapshot().reason});wrap.append(run);
 const timeline=D.createElement('button');timeline.textContent='Abrir linha do tempo';timeline.addEventListener('click',()=>{box.close();window.TraderConsulta325?.open?.('timeline')});wrap.append(timeline);
 const close=D.createElement('button');close.textContent='Fechar';close.addEventListener('click',()=>box.close());wrap.append(close);
 box.addEventListener('close',()=>box.remove());D.body.append(box);try{box.showModal()}catch{box.open=true}}
function mount(){const bar=D.querySelector('.trbar');if(!bar||bar.querySelector('[data-obs328]')||!owner()||window.TRPOP)return;const b=D.createElement('button');b.type='button';b.className='trbtn';b.dataset.obs328='1';b.textContent='◷ Observador';b.title='Acompanhamento opcional de mudanças nas cotações, sem feeds adicionais';b.addEventListener('click',settings);bar.append(b)}
const css=D.createElement('style');css.textContent='.obs328-modal{background:#101a25;color:#e5eff8;border:1px solid #4a6073;border-radius:12px;width:min(520px,calc(100vw - 20px));max-height:75dvh;overflow:auto;font:13px/1.6 system-ui}.obs328-modal::backdrop{background:#000a}.obs328-content{padding:12px}.obs328-content p{color:#aec0cf}.obs328-content label{display:flex;gap:9px;align-items:start;background:#1e2f3c;padding:12px;border-radius:8px}.obs328-content input{margin-top:4px;accent-color:#e3b56e}.obs328-content button{display:inline-block;margin:6px 5px 0 0;padding:9px 12px;background:#284157;color:#f1f6fa;border:1px solid #597085;border-radius:8px;cursor:pointer}';D.head.append(css);
if(window.TraderUI?.onRender)window.TraderUI.onRender('obs328',mount);
const observer=new MutationObserver(()=>{if(D.querySelector('.trbar')&&!D.querySelector('[data-obs328]'))mount()});observer.observe(D.getElementById('app')||D.body,{childList:true,subtree:false});
window.TraderObservador328={settings,mount,snapshot,monitor};mount();monitor();
})();

/* v328: observador acessível também pelo menu de comandos, sem botão redundante. */
(function(){const style=document.createElement("style");style.textContent=".tc326-ready [data-obs328]{display:none!important}";document.head.appendChild(style)})();

/* v329 — Continuidade do Terminal: janelas, sinais entre abas e agenda local.
   Não transmite dados financeiros pela BroadcastChannel, não inventa notícias ou cotações. */
(function(win,doc){
 'use strict';
 if(win.TraderContinuo329)return;
 const id=()=>win.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'&&SESS&&SESS.uid?String(SESS.uid):null);
 const key=part=>'diario-v329-'+id()+'-'+part;
 const get=(name,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key(name)));return x??fallback}catch{return fallback}};
 const put=(name,value)=>{if(!id())return;try{localStorage.setItem(key(name),JSON.stringify(value))}catch{}};
 const node=(tag,text,cls)=>{const e=doc.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
 const btn=(text,cb)=>{const b=node('button',text,'v329-btn');b.type='button';b.addEventListener('click',cb);return b};
 const owned=()=>Boolean(id())&&Boolean(doc.querySelector('.trbar'));
 const desktop=()=>win.innerWidth>=980&&!(win.matchMedia&&win.matchMedia('(pointer:coarse)').matches&&win.innerWidth<1200);
 const tabId=Math.random().toString(36).slice(2);
 let channel=null,channelOwner=null,lastSignal=0,openWindows=new Map(),dialog=null,notice=null;
 function connect(){const owner=id();if(!owner||!('BroadcastChannel' in win))return;if(channel&&channelOwner===owner)return;
  if(channel)channel.close();channelOwner=owner;channel=new BroadcastChannel('diario-trader-v329-'+owner);
  channel.onmessage=ev=>{const m=ev.data;if(!m||m.from===tabId||m.owner!==id()||!['save','cloud','layout','ping'].includes(m.kind)||typeof m.at!=='number'||Math.abs(Date.now()-m.at)>30000)return;
   if(m.kind==='save'){lastSignal=m.at;showHint('Checklist/Diário alterados em outra janela. A atualização segura será tentada automaticamente após o salvamento na nuvem.');}
   if(m.kind==='cloud'){lastSignal=m.at;win.dispatchEvent(new CustomEvent('trader:remote-cloud-save',{detail:{owner:m.owner,at:m.at}}));}
   if(m.kind==='layout')showHint('Um Workspace foi alterado em outra janela. Atualize a visualização se desejar.');
  };
 }
 function signal(kind){if(!id()||!['save','cloud','layout','ping'].includes(kind))return;connect();try{channel?.postMessage({kind,owner:id(),from:tabId,at:Date.now()})}catch{}}
 function showHint(message){if(!owned())return;notice?.remove();const bar=doc.querySelector('.trbar');if(!bar)return;notice=node('div',null,'v329-hint');notice.append(node('span',message),btn('Entendi',()=>{notice?.remove();notice=null}));bar.insertAdjacentElement('afterend',notice)}
 function openPanel(){if(!desktop()){showHint('Janelas destacáveis estão disponíveis no computador.');return}if(!win.TRM?.layAtual)return;const p=win.TRM.layAtual()?.p||[];if(!p.length)return;
  const root=modal('Destacar painel para outro monitor');root.append(node('p','A janela é nativa do navegador. Você pode arrastá-la para outro monitor; bloqueadores de pop-up e permissões do sistema podem limitar o recurso.','v329-muted'));
  p.forEach((command,i)=>{const safe=String(command||'').slice(0,80);root.append(btn((i+1)+' · '+safe,()=>{
   const url=new URL(location.href);url.searchParams.delete('terminal');url.searchParams.set('pop',safe);const name='diario-panel-'+i+'-'+tabId;
   const winRef=win.open(url.href,name,'popup=yes,width=880,height=720,resizable=yes,scrollbars=yes');if(!winRef){root.append(node('p','O navegador bloqueou a janela. Permita pop-ups para este site.','v329-warn'));return}
   openWindows.set(name,winRef);try{winRef.focus()}catch{}signal('layout');close();
  }))});root.append(node('p','Os painéis destacados são visualizações de consulta. Eles não compartilham automaticamente posição, filtros ou dados editáveis.','v329-muted'));
 }
 function close(){if(!dialog)return;const d=dialog;dialog=null;try{d.close()}catch{}d.remove()}
 function modal(title){close();const d=dialog=node('dialog',null,'v329-dialog');const head=node('div',null,'v329-head');head.append(node('b',title),btn('✕',close));d.append(head);const content=node('section',null,'v329-content');d.append(content);doc.body.append(d);d.addEventListener('close',()=>{if(dialog===d)dialog=null;d.remove()});try{d.showModal()}catch{d.setAttribute('open','')};return content}
 const isoBR=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const hmBR=()=>new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
 function inferredSession(){const today=isoBR(),weekday=new Date(today+'T12:00:00Z').getUTCDay();const holidays=get('daysOff',[]);if(weekday===0||weekday===6||holidays.includes(today))return{label:'Mercado fechado / feriado configurado',kind:'post'};
  const t=hmBR();return t<'09:00'?{label:'Pré-Abertura sugerida',kind:'pre'}:t<'18:00'?{label:'Pregão sugerido',kind:'live'}:{label:'Pós-Pregão sugerido',kind:'post'};
 }
 function sessionPanel(){const c=modal('Agenda e sessões · horário de Brasília');const i=inferredSession();c.append(node('p','Sugestão local: '+i.label+'. Datas especiais e horários de bolsas devem ser conferidos em fontes oficiais.','v329-info'));
  c.append(btn('Planejar ambiente recomendado',()=>{close();win.TraderPre328?.open?.()}));
  const row=node('div',null,'v329-inline'),date=doc.createElement('input');date.type='date';date.value=isoBR();date.setAttribute('aria-label','Data de feriado ou sessão especial');row.append(date,btn('Marcar feriado',()=>{const dates=get('daysOff',[]);if(date.value&&!dates.includes(date.value))dates.push(date.value);put('daysOff',dates.slice(-100));sessionPanel()}),btn('Remover feriado',()=>{put('daysOff',get('daysOff',[]).filter(d=>d!==date.value));sessionPanel()}));c.append(row);
  c.append(node('p','Feriados locais cadastrados: '+(get('daysOff',[]).sort().join(', ')||'nenhum')+'. Cadastro manual, não é calendário oficial da B3.','v329-muted'));
 }
 function eventPanel(){const c=modal('Agenda de alertas locais');c.append(node('p','Cadastre lembretes econômicos com fonte verificada. Não é um feed automático de notícias ou um calendário oficial. Os alertas só aparecem com o aplicativo aberto.','v329-muted'));
  const form=node('form',null,'v329-form');const input=doc.createElement('input');input.placeholder='Evento (ex.: decisão Copom)';input.maxLength=110;input.required=true;const when=doc.createElement('input');when.type='datetime-local';when.required=true;
  const src=doc.createElement('input');src.placeholder='Fonte / URL (opcional)';src.maxLength=200;form.append(input,when,src);const add=btn('Adicionar evento',()=>{if(!input.reportValidity()||!when.reportValidity())return;const events=get('events',[]);events.push({id:Date.now()+Math.random(),name:input.value.trim(),when:when.value,source:src.value.trim(),done:false});put('events',events.slice(-70));eventPanel()});form.append(add);c.append(form);
  const events=get('events',[]).sort((a,b)=>a.when.localeCompare(b.when));events.forEach(ev=>{const r=node('div',null,'v329-event');r.append(node('span',ev.when.replace('T',' ')+' · '+ev.name+(ev.source?' · '+ev.source:'')));r.append(btn('Excluir',()=>{put('events',get('events',[]).filter(x=>x.id!==ev.id));eventPanel()}));c.append(r)});
 }
 function checkEvents(){if(!id()||doc.hidden)return;const events=get('events',[]);let updated=false;
  for(const ev of events){if(ev.done||!ev.when)continue;const ts=new Date(ev.when).getTime();if(!Number.isFinite(ts)||Date.now()<ts||Date.now()-ts>15*60*1000)continue;
   ev.done=true;updated=true;showHint('Evento cadastrado: '+ev.name+' (verifique a fonte).');win.TraderConsulta325?.appendEvent?.('Lembrete cadastrado · '+ev.name,'Evento manual com horário definido pelo usuário. Não comprova divulgação nem resultado.',ts);
  }if(updated)put('events',events)}
 function briefing(){const c=modal('Briefing de consulta · v329');c.append(node('p','Esta síntese utiliza os painéis e o cache existentes. Não contém análise de notícias por IA nem dados novos.','v329-muted'));
  const info=inferredSession();c.append(node('h3','Sessão: '+info.label));const q=win.TraderConsulta325?.getQuotes?.();if(!q?.rows?.length){c.append(node('p','Cotações não disponíveis; abra o Radar Global e confira as fontes.'));}else{
   const rows=q.rows.slice(0,12);rows.forEach(r=>{const label=String(r.pedido||r.s||'Ativo').slice(0,30),delta=Number(r.d1);c.append(node('p',label+' · '+(Number.isFinite(delta)?delta.toFixed(2)+'%':'variação indisponível')+' · '+(r.atraso===false?'sem atraso declarado':r.atraso===true?'atrasada':'status de atraso desconhecido'),'v329-quote'))})}
  c.append(btn('Abrir briefing anterior',()=>{close();win.TraderPre328?.briefing?.()}));
 }
 function open(){const c=modal('Central de automação · Terminal');c.append(node('p','Ferramentas de consulta, sem execução de ordens.','v329-muted'));
  c.append(btn('Destacar painéis em janelas separadas',openPanel),btn('Agenda de sessões e feriados configuráveis',sessionPanel),btn('Alertas de eventos cadastrados',eventPanel),btn('Briefing de consulta',briefing),btn('Linha do tempo existente',()=>{close();win.TraderConsulta325?.open?.('timeline')}));
  c.append(node('p','Sinais entre abas: '+(channel?'disponíveis neste navegador':'aguardando navegador compatível')+'. Dados do Diário não são transmitidos pelo canal; use a sincronização do aplicativo.','v329-muted'));
 }
 function mount(){const bar=doc.querySelector('.trbar');if(!bar||bar.querySelector('[data-v329-open]')||!id()||win.TRPOP)return;connect();const b=btn('Automação +',open);b.className='trbtn v329-open';b.dataset.v329Open='1';bar.append(b)}
 const style=node('style');style.textContent=`.v329-dialog{background:#0e1823;color:#eaf1f8;border:1px solid #3d596c;border-radius:12px;padding:0;width:min(620px,calc(100vw - 20px));max-height:85dvh;overflow:auto;font:13px/1.55 system-ui}.v329-dialog::backdrop{background:#000a}.v329-head{position:sticky;top:0;background:#17293a;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;z-index:2;border-bottom:1px solid #395064}.v329-content{padding:14px 16px;display:flex;flex-direction:column;gap:9px}.v329-content h3{margin:0}.v329-btn{background:#24394e;color:#eaf1f8;border:1px solid #46617a;border-radius:8px;padding:10px 12px;min-height:40px;text-align:left;cursor:pointer}.v329-btn:hover{border-color:#e0ac5a}.v329-muted{color:#acbbcd;font-size:12px}.v329-info{background:#192f43;padding:12px;border-radius:8px}.v329-inline{display:flex;gap:6px;flex-wrap:wrap}.v329-inline input,.v329-form input{min-height:40px;min-width:0;background:#1a2c3b;color:white;border:1px solid #456178;border-radius:8px;padding:8px}.v329-form{display:flex;flex-direction:column;gap:8px}.v329-event{display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid #395064;padding:6px 0}.v329-event span{overflow-wrap:anywhere}.v329-quote{border-bottom:1px solid #344c60;padding:5px}.v329-hint{display:flex;justify-content:space-between;gap:10px;background:#23374a;border:1px solid #d5a45d;color:#fff;padding:9px;font:12px/1.4 system-ui}.v329-open{white-space:nowrap}`;doc.head.append(style);
 win.TraderContinuo329={open,openPanel,sessionPanel,eventPanel,briefing,inferredSession,signal,mount,checkEvents};
 if(win.TraderUI?.onRender)win.TraderUI.onRender('terminal-v329',mount);
 const obs=new MutationObserver(()=>{if(owned()&&!doc.querySelector('[data-v329-open]'))mount()});obs.observe(doc.getElementById('app')||doc.body,{childList:true,subtree:false});
 setInterval(()=>{if(id())connect();checkEvents()},30000);mount();
})(window,document);


/* Terminal de inteligência v330: automações locais opt-in, sem operações, sem feed fictício. */
(function(win, doc){
'use strict';if(win.TraderInteligencia330)return;
const owner=()=>win.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):null);
const key=k=>'diario-intel330-'+owner()+'-'+k;
const get=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(key(k)));return v==null?f:v}catch{return f}};
const put=(k,v)=>{if(!owner())return;try{localStorage.setItem(key(k),JSON.stringify(v))}catch{}};
const node=(tag,txt,cls)=>{const e=doc.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
const button=(txt,fn)=>{const e=node('button',txt,'ti330-btn');e.type='button';e.addEventListener('click',fn);return e};
let dialog=null,tip=null,lastOwner=null,bc=null,peerCount=new Map(),tabId=Math.random().toString(36).slice(2),lastSessionKey='',lastScan=0;
const timeBR=()=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
const dateBR=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const config=()=>get('options',{sessionReminder:true,earlyEvents:true,quoteAlerts:false,quoteThreshold:1.0,monitorOpen:false});
function close(){if(!dialog)return;const d=dialog;dialog=null;try{d.close()}catch{}d.remove()}
function modal(title){close();const d=dialog=node('dialog',undefined,'ti330-modal');const head=node('header',undefined,'ti330-head');head.append(node('strong',title),button('Fechar',close));const body=node('section',undefined,'ti330-body');d.append(head,body);doc.body.append(d);d.addEventListener('close',()=>{if(dialog===d)dialog=null;d.remove()});try{d.showModal()}catch{d.setAttribute('open','')};return body}
function notify(msg){if(!doc.querySelector('.trbar')||doc.hidden||win.TRPOP)return;tip?.remove();tip=node('div',undefined,'ti330-notice');tip.setAttribute('role','status');tip.append(node('span',msg),button('Dispensar',()=>{tip?.remove();tip=null}));doc.querySelector('.trbar')?.insertAdjacentElement('afterend',tip)}
function connect(){const id=owner();if(!id)return;if(lastOwner===id&&bc)return;bc?.close();lastOwner=id;peerCount.clear();if(!('BroadcastChannel'in win))return;bc=new BroadcastChannel('diario-intel330-'+id);
 bc.onmessage=e=>{const m=e.data;if(!m||m.id===tabId||m.owner!==owner()||Math.abs(Date.now()-m.at)>60000)return;if(m.type==='hello'||m.type==='reply'){peerCount.set(m.id,m.at);if(m.type==='hello')send('reply')}if(m.type==='layout-change')notify('Layout modificado em outra janela. Reabra o Workspace aqui para aplicar as mudanças.');};send('hello')}
function send(type){if(!bc||!owner())return;try{bc.postMessage({type,id:tabId,owner:owner(),at:Date.now()})}catch{}}
function session(){const s=win.TraderContinuo329?.inferredSession?.();return s||{kind:'unknown',label:'Horário não identificado'}}
function sessionCheck(){if(!config().sessionReminder||!owner()||doc.hidden||!doc.querySelector('.trbar'))return;const s=session(),mark=dateBR()+':'+s.kind;if(s.kind==='unknown'||lastSessionKey===mark)return;lastSessionKey=mark;const prior=get('sessionPrompt','');if(prior===mark)return;put('sessionPrompt',mark);notify('Sessão sugerida: '+s.label+'. Abra Planejar sessão se quiser adaptar os painéis. Nenhuma janela foi alterada.')}
function earlyEvents(){if(!config().earlyEvents||!owner()||doc.hidden)return;const events=getV329Events();for(const e of events){if(e.done||!e.when||!e.name)continue;const at=new Date(e.when).getTime(),now=Date.now();if(!Number.isFinite(at)||at-now<0||at-now>15*60000)continue;const k='early-'+String(e.id).slice(0,50);if(get(k,false))continue;put(k,true);notify('Evento cadastrado em '+Math.max(1,Math.ceil((at-now)/60000))+' min: '+e.name+'. Confira a fonte.');record('Pré-aviso de evento cadastrado',e.name+' · lembrete local, não confirmação de divulgação.')}}
function getV329Events(){try{const v=JSON.parse(localStorage.getItem('diario-v329-'+owner()+'-events'));return Array.isArray(v)?v:[]}catch{return []}}
function record(title,detail){win.TraderConsulta325?.appendEvent?.(title,detail,Date.now())}
function quoteScan(){if(!config().quoteAlerts||!owner()||doc.hidden)return;const source=win.TraderConsulta325?.getQuotes?.();if(!Array.isArray(source?.rows))return;const now=Date.now(),current={at:now,rows:{}};
 for(const r of source.rows){if(r?.atraso!==false)continue;const symbol=String(r.pedido||r.s||'').slice(0,30),val=Number(r.d1);if(symbol&&Number.isFinite(val)&&Math.abs(val)<1000)current.rows[symbol]=val}
 const old=get('quotes',null);put('quotes',current);if(!old||now-old.at>90*60*1000)return;const limit=Math.max(.25,Math.min(10,Number(config().quoteThreshold)||1));let count=0;
 for(const [symbol,val] of Object.entries(current.rows)){const prev=old.rows?.[symbol];if(!Number.isFinite(prev)||Math.abs(val-prev)<limit)continue;const mark='quote-'+symbol+'-'+Math.floor(now/(15*60000));if(get(mark,false))continue;put(mark,true);const text=symbol+': variação observada '+prev.toFixed(2)+'% → '+val.toFixed(2)+'% (fonte sinalizada sem atraso).';record('Alerta de mudança observada',text+' Sem afirmação de causa.');notify(text);if(++count>=2)break}}
function tick(){if(!owner())return;connect();if(doc.hidden||Date.now()-lastScan<25000)return;lastScan=Date.now();sessionCheck();earlyEvents();quoteScan();for(const [id,at] of peerCount){if(Date.now()-at>70000)peerCount.delete(id)}}
function briefing(){const body=modal('Briefing de contexto · dados existentes');const s=session();body.append(node('p','Sessão sugerida: '+s.label+' · horário Brasília '+timeBR(),'ti330-muted'));
 const q=win.TraderConsulta325?.getQuotes?.();const rows=Array.isArray(q?.rows)?q.rows:[];const valid=rows.filter(r=>r?.atraso===false&&Number.isFinite(Number(r.d1)));const stale=rows.filter(r=>r?.atraso===true).length;const unknown=rows.length-stale-valid.length;
 body.append(node('div','Qualidade: '+rows.length+' ativos no cache · '+valid.length+' identificados sem atraso · '+stale+' atrasados · '+unknown+' sem confirmação de atualização.','ti330-info'));
 const picks=['NASDAQ','SP 500','S&P','IBOV','DXY','DÓLAR','DOLAR','JUROS','WIN','WDO','VIX','PETRÓLEO','PETROLEO'];
 const chosen=rows.filter(r=>picks.some(p=>String(r.pedido||r.s||'').toUpperCase().includes(p))).slice(0,10);
 if(!chosen.length)body.append(node('p','Ainda não há indicadores-chave disponíveis no cache. Abra o Radar Global e confirme a qualidade das fontes.','ti330-muted'));
 for(const r of chosen){const v=Number(r.d1),lbl=String(r.pedido||r.s||'Ativo').slice(0,55);body.append(node('div',lbl+' · '+(Number.isFinite(v)?v.toFixed(2)+'%':'sem variação')+' · '+(r.atraso===true?'ATRASADO':r.atraso===false?'sem atraso declarado':'atualização não confirmada'),'ti330-item'))}
 body.append(node('p','Leitura orientativa: confira cenário internacional, juros, dólar, agenda e notícias antes de tirar conclusões sobre WIN/WDO. Não é recomendação operacional nem análise de notícias por IA.','ti330-muted'));
 body.append(button('Abrir planejador Pré / Pregão / Pós',()=>{close();win.TraderPre328?.open?.()}));}
function health(){const b=modal('Diagnóstico de automação e janelas');const q=win.TraderConsulta325?.getQuotes?.(),r=Array.isArray(q?.rows)?q.rows:[];b.append(node('div','Conta autenticada: '+(owner()?'sim':'não')+' · Fonte de cotações: '+r.length+' linhas no cache.','ti330-info'));
 b.append(node('p','Canal local entre janelas: '+(bc?'ativo':'indisponível')+' · outras janelas detectadas recentemente: '+peerCount.size+'.','ti330-muted'));
 b.append(node('p','Esses canais não garantem sincronização do conteúdo do Diário ou resolução de conflitos. Não transmitem operações.','ti330-muted'));
 b.append(button('Sinalizar presença às outras janelas',()=>{send('hello');notify('Sinal enviado. Abra Diagnóstico novamente para consultar a contagem.')}));
 b.append(button('Abrir controle de painéis destacados',()=>{close();win.TraderContinuo329?.openPanel?.()}));}
function settings(){const b=modal('Automações do Terminal');b.append(node('p','Esses recursos funcionam com o Terminal aberto e os dados já disponíveis. Não executam ordens, não contratam APIs e não alteram Workspaces automaticamente.','ti330-muted'));
 const opts=config();const choices=[['sessionReminder','Sugerir sessão (Pré, Pregão, Pós) sem trocar layouts'],['earlyEvents','Avisar 15 min antes de lembretes cadastrados'],['quoteAlerts','Registrar alertas de variação observada em cotações identificadas como não atrasadas']];
 for(const [k,label] of choices){const row=node('label',undefined,'ti330-setting'),cb=node('input');cb.type='checkbox';cb.checked=!!opts[k];cb.addEventListener('change',()=>{const p=config();p[k]=cb.checked;put('options',p)});row.append(cb,node('span',label));b.append(row)}
 const limit=node('label',undefined,'ti330-setting');limit.append(node('span','Limiar de variação em pontos percentuais (0,25 a 10):'));const inp=node('input');inp.type='number';inp.min='.25';inp.max='10';inp.step='.25';inp.value=String(opts.quoteThreshold);inp.addEventListener('change',()=>{const p=config();p.quoteThreshold=Math.max(.25,Math.min(10,Number(inp.value)||1));put('options',p);inp.value=String(p.quoteThreshold)});limit.append(inp);b.append(limit);
 b.append(button('Ver briefing de contexto',briefing),button('Diagnóstico de janelas',health),button('Abrir calendário e lembretes',()=>{close();win.TraderContinuo329?.eventPanel?.()}));}
function mount(){const bar=doc.querySelector('.trbar');if(!bar||bar.querySelector('[data-ti330]')||!owner()||win.TRPOP)return;connect();const b=button('Inteligência ▾',settings);b.className='trbtn ti330-open';b.dataset.ti330='1';bar.append(b)}
const css=node('style');css.textContent=`.ti330-modal{box-sizing:border-box;width:min(590px,calc(100vw - 20px));max-height:85dvh;overflow:auto;border:1px solid #456178;border-radius:12px;background:#0d1824;color:#e9eff7;font:13px/1.5 system-ui;padding:0}.ti330-modal::backdrop{background:#000b}.ti330-head{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;background:#1a2c3d;padding:12px 14px;border-bottom:1px solid #456178}.ti330-body{display:flex;flex-direction:column;gap:10px;padding:14px}.ti330-body p{margin:4px 0}.ti330-muted{color:#b9c7d3}.ti330-btn{padding:9px 12px;border:1px solid #4b6680;border-radius:8px;background:#24394b;color:#f1f5f9;cursor:pointer;text-align:left}.ti330-setting{display:flex;gap:10px;align-items:center;background:#192b3b;padding:11px;border-radius:8px}.ti330-setting input[type=checkbox]{accent-color:#d7ac5c}.ti330-setting input[type=number]{width:75px;background:#102331;color:white;border:1px solid #456178;padding:8px}.ti330-info{border-left:3px solid #d3a85b;background:#263341;padding:10px}.ti330-item{border-bottom:1px solid #304455;padding:6px}.ti330-notice{padding:8px 12px;background:#223749;border-left:3px solid #d7ab5f;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;font:12px/1.5 system-ui}.ti330-open{white-space:nowrap}@media(max-width:767px){.ti330-modal{max-height:78dvh}.ti330-body{padding:10px}}`;doc.head.append(css);
win.TraderInteligencia330={mount,settings,briefing,health,session,quoteScan,earlyEvents,tick};
if(win.TraderUI?.onRender)win.TraderUI.onRender('inteligencia-v330',mount);
new MutationObserver(()=>{if(doc.querySelector('.trbar')&&!doc.querySelector('[data-ti330]'))mount()}).observe(doc.getElementById('app')||doc.body,{childList:true,subtree:false});
doc.addEventListener('visibilitychange',()=>{if(!doc.hidden){send('hello');tick()}});setInterval(tick,30000);mount();
})(window,document);


/* Radar proativo v332: reaproveita Edge Functions existentes; não negocia nem inventa cotações. */
(function(win,doc){
'use strict';if(win.TraderRadar332)return;
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=s=>{const d=new Date(s);return Number.isFinite(+d)?d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'horário indisponível'};
const state={news:[],events:[],indices:[],indicesAt:0,indicesError:"",newsFilter:"todas",updated:0,loading:false,error:'',active:false,enabled:true,lastSignature:'',lastAlert:0,newsSource:'',agendaSource:'',giro:null,giroError:'',giroChecked:0,displayNotifications:false,lastNewsSignature:'',lastUpdateSource:''};
const findCfg=()=>{try{return typeof cfg==='function'?cfg():null}catch{return null}};
const session=()=>{try{return typeof SESS!=='undefined'?SESS:null}catch{return null}};
const userId=()=>session()?.uid||'anon';
const k=()=>`diario-radar332:${userId()}:enabled`;
try{state.enabled=localStorage.getItem(k())!=='false'}catch{}
function notify(msg){
if(state.displayNotifications&&doc.visibilityState==='visible'&&'Notification'in win&&Notification.permission==='granted')try{new Notification('Radar Proativo',{body:msg,tag:'diario-radar-alerta'})}catch{}
const box=doc.getElementById('radar332-toast');if(!box)return;box.textContent=msg;box.hidden=false;setTimeout(()=>{box.hidden=true},7000)}
async function request(slug,payload){const conf=findCfg(),s=session();if(!conf?.url||!conf?.key||!s?.at)throw Error('Entre na sua conta para consultar as fontes existentes.');if(typeof tok==='function')await tok();const current=session();if(!current?.at)throw Error('Sessão indisponível.');const controller=new AbortController(),tid=setTimeout(()=>controller.abort(),22000);try{const resp=await fetch(conf.url+'/functions/v1/'+slug,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',apikey:conf.key,Authorization:'Bearer '+current.at},body:JSON.stringify(payload||{})});const data=await resp.json().catch(()=>({}));if(!resp.ok||data.error)throw Error(String(data.error||data.erro||'HTTP '+resp.status));return data}finally{clearTimeout(tid)}}
const bus=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('diario-radar-v332'):null;
const instanceId=Math.random().toString(36).slice(2);
const snapshotKey=()=>`radar332:snapshot:${userId()}`;
let lastRemote=0;
function applyShared(packet){
if(!packet||packet.uid!==userId()||packet.from===instanceId||packet.type!=='snapshot'||!session()?.at)return;
if(!Number.isFinite(packet.at)||packet.at<=state.updated||Date.now()-packet.at>10*60000)return;
state.news=normalizeNews({itens:packet.news});state.events=normalizeEvents({itens:packet.events});state.indices=Array.isArray(packet.indices)?packet.indices:[];state.indicesAt=packet.indicesAt||0;
state.updated=packet.at;state.newsSource=packet.newsSource||'Notícias';state.agendaSource=packet.agendaSource||'Terminal';state.error='';state.lastUpdateSource='Outra janela';lastRemote=Date.now();render();
}
if(bus)bus.onmessage=e=>applyShared(e.data);
function publishSnapshot(){if(!bus||!session()?.at)return;bus.postMessage({type:'snapshot',uid:userId(),from:instanceId,at:state.updated,news:state.news,events:state.events,indices:state.indices,indicesAt:state.indicesAt,newsSource:state.newsSource,agendaSource:state.agendaSource})}
function normalizeNews(data){const a=Array.isArray(data?.itens)?data.itens:Array.isArray(data?.noticias)?data.noticias:[];const seen=new Set();return a.map(x=>({title:String(x.t||x.titulo||x.title||'').slice(0,260),url:String(x.l||x.url||x.link||''),date:x.d||x.data||x.date||'',source:String(x.f||x.fonte||data.fonte||'Notícias'),category:Array.isArray(x.c)?x.c:[]})).filter(x=>{if(!x.title||!/^https?:\/\//i.test(x.url)||seen.has(x.url))return false;seen.add(x.url);return true}).slice(0,35)}
function normalizeEvents(data){const a=Array.isArray(data)?data:Array.isArray(data?.eventos)?data.eventos:Array.isArray(data?.itens)?data.itens:Array.isArray(data?.agenda)?data.agenda:[];const seen=new Set();return a.map(x=>({title:String(x.t||x.titulo||x.title||'').slice(0,200),date:x.d||x.data||x.date||'',country:x.pais||x.country||'',importance:Number(x.imp||x.importancia||0),source:x.fonte||data.fonte||'Agenda',actual:x.atual||'',forecast:x.prev||''})).filter(x=>{const hash=x.title+'|'+x.date;if(!x.title||!Number.isFinite(+new Date(x.date))||seen.has(hash))return false;seen.add(hash);return true}).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,60)}
function score(n){const text=(n.title+' '+n.category.join(' ')).toLowerCase();let val=0;for(const x of ['copom','selic','fed','fomc','payroll','inflação','inflacao','ipca','pib','juros','dólar','dolar','ibovespa','nasdaq','petróleo','petroleo','china','tarifas'])if(text.includes(x))val+=2;return val}
function region(n){const x=(n.title+' '+n.source).toLowerCase();if(/brasil|brasileir|ibovespa|b3\b|selic|copom|petrobras|vale3|petr4|real brasileiro|banco central do brasil|lula|brasília|brasilia/.test(x))return 'br';if(/reuters|cnbc|marketwatch|fed\b|fomc|nasdaq|s&p|wall street|dow jones|trump|china|europe|europa|treasury|new york|nyse|boe\b|ecb\b/.test(x))return 'ext';return 'geral'}
function headline(){return [...state.news].filter(n=>state.newsFilter==='todas'||region(n)===state.newsFilter).sort((a,b)=>score(b)-score(a)||new Date(b.date)-new Date(a.date)).slice(0,18)}
const TRACK=[['NASDAQ:NDX','Nasdaq 100'],['CME_MINI:NQ1!','Nasdaq Fut.'],['SP:SPX','S&P 500'],['CME_MINI:ES1!','S&P Fut.'],['TVC:DXY','DXY'],['FX_IDC:USDBRL','USD/BRL'],['TVC:US10Y','US10Y'],['BMFBOVESPA:IBOV','Ibovespa']];
function indicesHtml(){const map=new Map(state.indices.map(x=>[x.pedido,x]));return `<h3>Índices globais · Consulta</h3><div class="radar342-index-grid">${TRACK.map(([s,n])=>{const x=map.get(s);const px=typeof x?.px==="number"?x.px:NaN,pct=typeof x?.d1==="number"?x.d1:NaN;const has=Number.isFinite(px)&&px>0,stale=state.indicesAt&&Date.now()-state.indicesAt>5*60000;const label=!state.indicesAt&&state.loading?'Carregando…':state.indicesError?'Falha na consulta':state.indicesAt?'Indisponível na fonte':'Aguardando consulta';return `<div class="radar342-index"><b>${clean(n)}</b><strong>${has?clean(px.toLocaleString('pt-BR',{maximumFractionDigits:2})):'—'}</strong><small class="${has&&Number.isFinite(pct)?pct<0?'neg':'pos':''}">${has&&Number.isFinite(pct)?clean((pct>=0?'+':'')+pct.toFixed(2)+'%'):(has?'Variação não informada':label)} · ${clean(has?(x?.fonte||'TradingView'):'TradingView')}</small>${has&&stale?'<small>Dados possivelmente desatualizados</small>':''}</div>`}).join('')}</div><p class="radar332-small">Fonte: TradingView pela função terminal/cot com símbolos nativos da plataforma. Dados podem ter atraso; não representam preços para execução. ${state.indicesAt?'Atualizado: '+clean(time(state.indicesAt)):''}${state.indicesError?' · '+clean(state.indicesError):''}</p>`}
function upcoming(){const now=Date.now();return state.events.filter(e=>{const d=+new Date(e.date);return d>=now-15*60000&&d<=now+24*3600000}).slice(0,8)}
function sourceAge(){return state.updated?Math.round((Date.now()-state.updated)/60000):null}
function render(){const root=doc.getElementById('radar332-body');if(!root)return;const warning=state.error?`<p class="radar332-warn">${clean(state.error)}. Informações anteriores podem estar desatualizadas.</p>`:'';const ago=state.updated?`${time(state.updated)} · consulta há ${sourceAge()} min`:(state.loading?'Atualizando fontes…':state.error?'Falha na atualização; veja o diagnóstico':'Ainda não atualizado');const news=headline(),ev=upcoming();root.innerHTML=`<div class="radar332-small">Última consulta: ${clean(ago)} · ${clean(state.lastUpdateSource||'Fonte direta')} · Fontes: ${clean(state.newsSource||'noticias')} / ${clean(state.agendaSource||'terminal')}</div>${warning}<div class="radar332-actions"><button type="button" data-r332="reload" ${state.loading?'disabled':''}>${state.loading?'Atualizando…':'Atualizar agora'}</button><button type="button" data-r332="toggle">Proatividade: ${state.enabled?'ligada':'desligada'}</button><button type="button" data-r332="giro">Consultar giro IA já publicado</button><button type="button" data-r332="avisos">Avisos na tela: ${state.displayNotifications?'ligados':'desligados'}</button></div>${state.giro?`<h3>Giro IA do aplicativo · ${clean(state.giro.dia_giro||state.giro.dia||'data não informada')}</h3><div class="radar332-item">${clean(String(state.giro.texto||'').slice(0,3000))}</div>`:state.giroError?`<p class="radar332-small">${clean(state.giroError)}</p>`:''}${indicesHtml()}<h3>Agenda de atenção</h3>${ev.length?ev.map(x=>`<div class="radar332-item"><b>${clean(x.title)}</b><small>${clean(time(x.date))} · ${clean(x.country)} · importância ${x.importance||'não informada'} · ${clean(x.source)}</small>${x.actual?`<small>Divulgado: ${clean(x.actual)} · esperado: ${clean(x.forecast||'não informado')}</small>`:''}</div>`).join(''):'<p class="radar332-small">Sem eventos confirmados para as próximas 24 horas nesta fonte.</p>'}<h3>Brasil + exterior no mesmo painel</h3><div class="radar332-actions radar342-filters"><button data-r332="all" type="button">Todas</button><button data-r332="br" type="button">Brasil</button><button data-r332="ext" type="button">Internacionais</button></div><p class="radar332-small">Filtro por palavras-chave (aproximado). Cada manchete mostra a fonte original e abre o site.</p>${news.length?news.map(x=>`<a class="radar332-item" href="${clean(x.url)}" target="_blank" rel="noopener noreferrer"><b>${clean(x.title)}</b><small>${clean(x.source)} · ${clean(time(x.date))}</small></a>`).join(''):'<p class="radar332-small">Nenhuma notícia disponível. Verifique a autenticação e a fonte.</p>'}<p class="radar332-disclaimer">Relevância por palavras-chave, sem recomendação de operação. Notícias e eventos não explicam, por si só, a causa dos movimentos. Confira horários e atrasos nas fontes.</p>`}
async function refresh(force=false){if(state.loading)return;if(!force&&(!state.enabled||doc.hidden))return;if(!session()?.at){state.error='Sessão não detectada pela Central. Entre novamente na conta e toque em Atualizar agora.';render();return;}if(!force&&Date.now()-state.updated<4*60000)return;state.loading=true;render();const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const results=await Promise.allSettled([request('terminal',{acao:'noticias'}).catch(()=>request('noticias',{})),request('terminal',{acao:'agenda'}),request('terminal',{acao:'cot',s:TRACK.map(x=>x[0])})]);let ok=0,errors=[];if(results[0].status==='fulfilled'){const d=results[0].value;state.news=normalizeNews(d);state.newsSource=Array.isArray(d.fontes)?d.fontes.slice(0,6).join(', '):d.fonte||'Fontes internacionais e brasileiras';ok++}else errors.push('Notícias: '+results[0].reason.message);if(results[1].status==='fulfilled'){const d=results[1].value;state.events=normalizeEvents(d);state.agendaSource=d.fonte||'Terminal';ok++}else errors.push('Agenda: '+results[1].reason.message);if(results[2].status==='fulfilled'){const d=results[2].value;state.indices=Array.isArray(d.itens)?d.itens:[];state.indicesAt=Date.now();state.indicesError='';ok++}else{state.indicesError=String(results[2].reason.message||'Sem índices');errors.push('Índices: '+state.indicesError)}state.error=errors.join(' | ');if(!ok&&!state.error)state.error='Nenhuma fonte retornou dados. Verifique a conexão e a sessão.';if(ok){state.updated=Date.now();state.lastUpdateSource='Consulta autenticada';publishSnapshot();const recent=headline().filter(n=>{const d=+new Date(n.date);return Number.isFinite(d)&&Date.now()-d<60*60000});const signature=recent.slice(0,2).map(n=>n.url).join('|');if(state.lastSignature&&signature&&signature!==state.lastSignature&&Date.now()-state.lastAlert>15*60000){notify('Radar Proativo: novas manchetes relevantes disponíveis.');state.lastAlert=Date.now()}state.lastSignature=signature;const urgent=upcoming().find(e=>e.importance>=2&&(+new Date(e.date)-Date.now())>=0&&(+new Date(e.date)-Date.now())<=15*60000);if(urgent){const eventSig='event:'+urgent.title+urgent.date;if(state.lastEvent!==eventSig){state.lastEvent=eventSig;notify('Evento econômico em até 15 min: '+urgent.title)}}}state.loading=false;render()}
async function giro(){state.giroError='';try{const r=await request('analise',{modo:'giro',ultimo:true,hoje_tambem:true});if(r.erro)throw Error(r.erro);if(!r.texto)throw Error('Giro ainda não publicado na função de IA.');state.giro=r}catch(e){state.giroError='Giro indisponível: '+(e.message||e)}render()}
function open(){mount();const d=doc.getElementById('radar332-dialog');if(d?.showModal){if(!d.open)d.showModal()}else if(d)d.hidden=false;render();win.DiarioTv361?.onRadarOpen?.();refresh(true)}
function close(){const d=doc.getElementById('radar332-dialog');if(d?.close)d.close();else if(d)d.hidden=true}
function mount(){const bar=doc.querySelector('.trbar');if(bar&&!bar.querySelector('[data-radar332]')){const b=doc.createElement('button');b.className='trbtn';b.dataset.radar332='1';b.type='button';b.textContent='Radar Proativo';b.addEventListener('click',open);bar.appendChild(b)}if(doc.getElementById('radar332-dialog'))return;const d=doc.createElement('dialog');d.id='radar332-dialog';d.className='radar332-dialog';d.innerHTML='<header><strong>CENTRAL DE MERCADO · BRASIL + MUNDO</strong><button type="button" data-r332="close" aria-label="Fechar">×</button></header><div id="diario-tv343"></div><section id="radar332-body"></section>';d.addEventListener('click',ev=>{const cmd=ev.target.closest('[data-r332]')?.dataset.r332;if(cmd==='close')close();if(cmd==='reload')refresh(true);if(['all','br','ext'].includes(cmd)){state.newsFilter=cmd==='all'?'todas':cmd;render()}if(cmd==='giro')giro();if(cmd==='avisos'){state.displayNotifications=!state.displayNotifications;if(state.displayNotifications&&'Notification'in win&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});render()}if(cmd==='toggle'){state.enabled=!state.enabled;try{localStorage.setItem(k(),String(state.enabled))}catch{}render()}});doc.body.append(d);const toast=doc.createElement('div');toast.id='radar332-toast';toast.hidden=true;toast.setAttribute('role','status');doc.body.append(toast);const style=doc.createElement('style');style.textContent='.radar332-dialog{max-width:650px;width:calc(100vw - 26px);max-height:84dvh;overflow:auto;background:#101a25;color:#eaf2f7;border:1px solid #45576b;border-radius:12px;padding:0;font:13px/1.45 system-ui}.radar332-dialog::backdrop{background:#000a}.radar332-dialog header{position:sticky;top:0;background:#1c2b39;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;z-index:1}.radar332-dialog button{cursor:pointer}.radar332-dialog header button{border:0;background:transparent;color:#eee;font-size:22px}.radar332-dialog section{padding:12px 16px}.radar332-actions{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}.radar342-index-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:9px 0}.radar342-index{padding:10px 8px;border:1px solid #344c5d;border-radius:8px;background:#15283a;min-width:0}.radar342-index b,.radar342-index strong,.radar342-index small{display:block}.radar342-index strong{font-size:15px;margin:4px 0}.radar342-index small{font-size:10px;color:#b0c2d0}.radar342-index .pos{color:#56ddb0}.radar342-index .neg{color:#ff9d9d}@media(max-width:540px){.radar342-index-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}.radar332-actions button{background:#24394b;color:#fff;border:1px solid #536879;border-radius:8px;padding:7px 10px}.radar332-dialog h3{font-size:12px;letter-spacing:.07em;color:#ffbf69;border-bottom:1px solid #344654;padding-bottom:6px;margin:18px 0 6px}.radar332-item{display:block;color:inherit;text-decoration:none;padding:9px 0;border-bottom:1px solid #273544}.radar332-item small{display:block;color:#abb9c7;margin-top:2px}.radar332-warn{color:#ffc789}.radar332-small,.radar332-disclaimer{font-size:11px;color:#a7b7c6}#radar332-toast{position:fixed;bottom:22px;right:20px;z-index:99999;color:#fff;background:#314657;border:1px solid #edb967;border-radius:8px;padding:12px;max-width:310px}#radar332-toast[hidden]{display:none}@media(max-width:640px){.radar332-dialog{width:calc(100vw - 12px)}.radar332-dialog section{padding:10px}}';doc.head.append(style);render()}
win.TraderRadar332={open,refresh,normalizeNews,normalizeEvents,score,state,giro};if(win.TraderUI?.onRender)win.TraderUI.onRender('radar332',mount);let lastUid=userId();setInterval(()=>{const next=userId();if(next!==lastUid){lastUid=next;state.news=[];state.events=[];state.indices=[];state.indicesAt=0;state.updated=0;state.giro=null;state.lastSignature='';render()}},15000);const observer=new MutationObserver(()=>{if(doc.querySelector('.trbar')&&!doc.querySelector('[data-radar332]'))mount()});observer.observe(doc.getElementById('app')||doc.body,{childList:true,subtree:false});setInterval(()=>{if(state.enabled&&doc.querySelector('.trbar')&&session()?.at&&Date.now()-state.updated>5*60000)refresh()},60000);mount();
})(window,document);


/* v341 — Menu compacto e prioridade às abas de layout no Terminal mobile.
   Não duplica nem remove comandos: cada item executa o botão original. */
(()=>{
 'use strict';
 const doc=document;
 const mobile=()=>window.matchMedia('(max-width: 800px)').matches;
 const available=()=>doc.body.classList.contains('trmon')&&!window.TRPOP;
 let menu=null,open=false,focused=null;
 const css=doc.createElement('style');
 css.id='tr341-css';
 css.textContent=`
 @media(min-width:801px){body.trmon .trbar>[data-tr341-menu]{display:none!important}}
 @media(max-width:800px){
   body.trmon:not(.tr341-exempt) .trbar{display:flex!important;align-items:center!important;gap:6px!important;padding:8px!important;flex-wrap:wrap!important}
   body.trmon .trbar>.trlogo,body.trmon .trbar>.trmenub{display:none!important}
   body.trmon .trbar>.tr341-secondary{display:none!important}
   body.trmon .trquick-strip{display:none!important}
   body.trmon .trbar>.trcmdw{order:0!important;flex:1 1 100%!important;width:100%!important;min-width:0!important;margin:0!important}
   body.trmon .trbar>.trlay{order:1!important;flex:1 1 130px!important;min-width:100px!important;width:auto!important;margin:0!important}
   body.trmon .trbar>[data-tr="addp"]{order:2!important;flex:0 0 auto!important;white-space:nowrap}
   body.trmon .trbar>[data-tr341-menu]{order:3!important;flex:0 0 auto!important;white-space:nowrap;background:#223547!important;border:1px solid #5d7890!important;color:#eafaff!important;border-radius:8px!important;font-weight:700!important;min-height:42px!important;padding:8px 12px!important}
   body.trmon .trtabs{display:flex!important;gap:5px!important;flex-wrap:nowrap!important;overflow-x:auto!important;padding:10px 6px!important;scrollbar-width:thin;scroll-snap-type:x proximity;background:#0e1723!important;border-bottom:1px solid #304457}
   body.trmon .trtabs>button{flex:0 0 auto!important;min-height:44px!important;scroll-snap-align:start;font-weight:700!important}
   body.trmon #trtape{padding:4px 6px!important;min-height:0!important;font-size:11px!important}
 }
 .tr341-dialog{box-sizing:border-box;width:min(520px,calc(100vw - 16px));max-height:84dvh;overflow:auto;border:1px solid #52728b;border-radius:16px;background:#101c2a;color:#f3f8fc;padding:0;box-shadow:0 18px 50px #0009;font:14px/1.5 system-ui,sans-serif}
 .tr341-dialog::backdrop{background:#020911c9}
 .tr341-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 16px;background:#192b3b;border-bottom:1px solid #30495c}
 .tr341-head strong{font-size:16px}.tr341-head button{border:1px solid #648299;border-radius:8px;background:#223649;color:#f3f8fc;min-width:40px;min-height:40px;font-size:22px}
 .tr341-content{padding:12px 16px 24px}
 .tr341-group{margin:0 0 18px}.tr341-group h3{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#9dc6de;margin:0 0 8px}
 .tr341-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .tr341-items button{width:100%;padding:11px 9px;border:1px solid #3d5669;border-radius:12px;background:#1c2e41;color:#f1f7fa;font:600 13px/1.3 system-ui;min-height:46px;overflow-wrap:anywhere;text-align:left}
 .tr341-items button:active{background:#2c4a61}.tr341-empty{color:#a8b7c5;padding:12px}
 @media(max-width:360px){.tr341-items{grid-template-columns:1fr}}
 `;
 doc.head.appendChild(css);
 const category=(button)=>{
  const v=(button.textContent+' '+(button.title||'')+' '+Object.keys(button.dataset).join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/pesquis|fluxo|comandos|grafico|fundament|ficha|favorit|voltar/.test(v))return 'Pesquisa e comandos';
  if(/espac|work|organizar|painel|planejar|sessao|renomear|duplicar/.test(v))return 'Organização';
  if(/intelig|radar|notici|jornal|agenda|automac|dados|qualidade|context|fontes|monitor/.test(v))return 'Inteligência';
  return 'Outras funções';
 };
 function items(){
  const bar=doc.querySelector('.trbar');if(!bar)return [];
  const originals=[...bar.children].filter(el=>el.tagName==='BUTTON'&&!el.hasAttribute('data-tr341-menu')&&el.dataset.tr!=='addp');
  const shortcuts=[...doc.querySelectorAll('.trquick-strip button')];
  const all=[...originals,...shortcuts];const names=new Set();
  return all.filter(el=>{const text=(el.textContent||el.getAttribute('aria-label')||el.title||'').trim();if(!text)return false;const id=text+'|'+(el.dataset.tr||'')+'|'+(el.dataset.quickOpen||'');if(names.has(id))return false;names.add(id);return true});
 }
 function build(){
  if(!menu){menu=doc.createElement('dialog');menu.className='tr341-dialog';menu.setAttribute('aria-label','Menu do Terminal');menu.innerHTML='<div class="tr341-head"><strong>☰ Menu do Terminal</strong><button type="button" data-tr341-close aria-label="Fechar menu">×</button></div><div class="tr341-content"></div>';doc.body.appendChild(menu);
   menu.addEventListener('click',event=>{if(event.target===menu)menu.close();if(event.target.closest('[data-tr341-close]'))menu.close();const b=event.target.closest('[data-tr341-action]');if(b){const original=items()[Number(b.dataset.tr341Action)];if(!original){menu.close();return}menu.close();original.click()}});
   menu.addEventListener('close',()=>{open=false;if(focused?.isConnected)focused.focus()});
  }
  const content=menu.querySelector('.tr341-content');content.replaceChildren();const all=items();
  for(const group of ['Pesquisa e comandos','Organização','Inteligência','Outras funções']){
   const selected=all.map((el,i)=>({el,i})).filter(x=>category(x.el)===group);if(!selected.length)continue;
   const sec=doc.createElement('section');sec.className='tr341-group';const h=doc.createElement('h3');h.textContent=group;sec.append(h);const grid=doc.createElement('div');grid.className='tr341-items';
   for(const {el,i} of selected){const b=doc.createElement('button');b.type='button';b.dataset.tr341Action=String(i);b.textContent=(el.textContent||el.getAttribute('aria-label')||el.title||'Função').trim().replace(/\s+/g,' ');grid.appendChild(b)}
   sec.append(grid);content.append(sec);
  }
  if(!all.length){const empty=doc.createElement('p');empty.className='tr341-empty';empty.textContent='As funções aparecerão quando o Terminal terminar de carregar.';content.append(empty)}
 }
 function toggle(){build();focused=doc.activeElement;try{menu.showModal();open=true}catch{menu.setAttribute('open','');open=true}}
 function mount(){
  if(!available()){if(open&&menu){menu.close()}return}
  const bar=doc.querySelector('.trbar');if(!bar)return;
  for(const child of [...bar.children])if(child.tagName==='BUTTON'&&child.dataset.tr!=='addp'&&!child.hasAttribute('data-tr341-menu'))child.classList.add('tr341-secondary');
  if(!bar.querySelector('[data-tr341-menu]')){const b=doc.createElement('button');b.type='button';b.className='trbtn';b.dataset.tr341Menu='';b.textContent='☰ Menu';b.title='Abrir funções do Terminal';b.setAttribute('aria-label','Abrir menu de funções do Terminal');b.addEventListener('click',toggle);bar.appendChild(b)}
  // As abas de layout antecedem as cotações e os atalhos no celular.
  if(mobile()){const tabs=doc.querySelector('.trm>.trtabs'),tape=doc.querySelector('.trm>#trtape');if(tabs&&tape&&tabs.nextElementSibling!==tape)tape.before(tabs)}
 }
 let pending=false;
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;mount()})};
 const observer=new MutationObserver(changes=>{
  if(changes.some(c=>[...c.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.trm,.trbar,.trtabs,.trquick-strip')||n.querySelector?.('.trbar')))))schedule();
 });
 observer.observe(doc.getElementById('app')||doc.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule,{passive:true});
 doc.addEventListener('click',event=>{if(event.target.closest?.('[data-trmob]'))schedule()});
 schedule();
})();


/* v345 TV Proativa: um módulo dentro da Central existente, sem duplicar janelas/abas.
   Bloomberg: somente embed público oficial sob clique, sujeito às permissões do YouTube.
   Trader TV: textos das fontes existentes e Giro IA já publicado, sem geração extra ou dados fictícios. */
(function(win,doc){
'use strict';if(win.TraderTV343)return;
const ROOT='diario-tv343'; // compatibilidade com o player já publicado
const BLOOMBERG='https://www.bloomberg.com/live';
// v350: nenhum vídeo gravado é apresentado como live. IDs abaixo identificam canais,
// não vídeos; o YouTube escolhe a live atual (quando existente e incorporável).
const CHANNELS={
 bmc:{name:'BM&C News',lang:'Português BR',url:'https://www.youtube.com/c/BMCNEWStv/live',site:'https://bmcnews.com.br/bmc-news-ao-vivo/',youtubeChannel:'UCoja0MNI4SIvXqJR3szbSfw',desc:'Tentar localizar a live atual do canal oficial no YouTube. Não é confirmação de transmissão; a emissora pode impedir a incorporação.'},
 times:{name:'Times Brasil | CNBC',lang:'Português BR',url:'https://www.youtube.com/@otimesbrasil/live',site:'https://timesbrasil.com.br/videos/times-brasil-ao-vivo/',youtubeChannel:'',desc:'Sem identificação de canal validada para o player automático. Abra o canal oficial, copie o link de uma live atual e cole abaixo para testar no Terminal.'},
 bloomberg:{name:'Bloomberg Television',lang:'Inglês',url:'https://www.youtube.com/@markets/live',site:BLOOMBERG,youtubeChannel:'UCIALMKvObZNtJ6AmdCLP7Lg',desc:'O player tenta a transmissão atual do canal oficial, sem usar gravações antigas. Se não estiver disponível ou não permitir incorporação, use o canal oficial.'}
};

// Nenhum ID fixo de Bloomberg: lives antigas expiram e deixam vídeo indisponível.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={topic:'all',auto:false,proactive:true,seenNews:'',seenAt:0,highlight:'',channel:'bmc',tab:'trader',playing:false,expanded:false,muted:true,slide:0,source:'',loadingGiro:false,lastKey:'',collapsed:false,manualVideo:{},liveError:'',videoId:''};
try{state.collapsed=localStorage.getItem('diario-tv343-collapsed')==='1'}catch{}
try{const saved=JSON.parse(localStorage.getItem('diario-tv345-options')||'{}');if(['all','br','world','indices'].includes(saved.topic))state.topic=saved.topic;state.auto=saved.auto===true;state.proactive=saved.proactive!==false}catch{}
function saveOptions(){try{localStorage.setItem('diario-tv345-options',JSON.stringify({topic:state.topic,auto:state.auto,proactive:state.proactive}))}catch{}}
const radar=()=>win.TraderRadar332?.state||{};
const inDialog=()=>{const d=doc.getElementById('radar332-dialog');return !!d&&(d.open===true||d.hidden===false)};
const headlines=()=>Array.isArray(radar().news)?radar().news.filter(x=>x.title&&/^https?:\/\//.test(x.url)).slice(0,12):[];
const items=()=>Array.isArray(radar().indices)?radar().indices.filter(x=>typeof x.px==='number'&&x.px>0).slice(0,7):[];
function isBr(h){return /brasil|b3|ibovespa|petrobras|vale|copom|selic|bras[ií]lia|fiscal|real brasileiro|banco central do brasil|mercado brasileiro|bovespa/i.test((h.title||'')+' '+(h.source||''))}
function pickNews(list){return list.filter(n=>state.topic==='all'||(state.topic==='br'&&isBr(n))||(state.topic==='world'&&!isBr(n)))}
function noteEvents(){const ev=Array.isArray(radar().events)?radar().events:[],now=Date.now();return ev.filter(v=>{const when=+new Date(v.date);return Number.isFinite(when)&&when>=now&&when<now+20*60000&&Number(v.importance)>=2}).slice(0,1)}
function status(){const ev=noteEvents();if(ev.length)return {label:'AGENDA · PRÓXIMOS 20 MIN',txt:ev[0].title,kind:'event'};if(state.highlight)return {label:'NOVA MANCHETE RECEBIDA',txt:state.highlight,kind:'news'};return null}
function watchNews(){const n=headlines();if(!n.length)return;const newest=n[0],sig=newest.url||newest.title;if(!state.seenNews){state.seenNews=sig;state.seenAt=Date.now();return}if(sig!==state.seenNews){state.seenNews=sig;state.seenAt=Date.now();const published=+new Date(newest.date);if(state.proactive&&Number.isFinite(published)&&Date.now()-published<60*60000&&published<=Date.now()+2*60000){state.highlight=newest.title;state.slide=0}}}
function current(){const giro=radar().giro;const headline=pickNews(headlines());const indices=items();const pages=[];
 if(giro?.texto&&state.topic==='all'){const excerpt=String(giro.texto).replace(/\s+/g,' ').trim().slice(0,1000);pages.push({title:giro.titulo||'Giro de Mercado',detail:excerpt,tag:'ANÁLISE IA · PUBLICADA',source:'Giro de Mercado do Diário Trader',url:''});}
 for(const n of (state.topic==='indices'?[]:headline.slice(0,8)))pages.push({title:n.title,detail:n.source||'Fonte não informada',tag:'MANCHETE · FONTE EXTERNA',source:n.source||'',url:n.url});
 if(indices.length&&(state.topic==='all'||state.topic==='indices')){const quotes=indices.map(x=>`${x.pedido}: ${Number(x.px).toLocaleString('pt-BR',{maximumFractionDigits:2})}${typeof x.d1==='number'?' ('+(x.d1>=0?'+':'')+x.d1.toFixed(2)+'%)':''}`).join(' · ');pages.push({title:'Painel de índices globais',detail:quotes,tag:'COTAÇÕES · CONSULTA',source:'Terminal / TradingView',url:''});}
 return pages;
}
function root(){return doc.getElementById(ROOT)}
function button(action,label,extra=''){return `<button type="button" data-tv343="${action}" ${extra}>${label}</button>`}
function youtubeVideoId(raw){
 try{const u=new URL(String(raw).trim());if(u.protocol!=='https:')return '';
 const host=u.hostname.toLowerCase();if(host==='youtu.be')return /^[a-zA-Z0-9_-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):'';
 if(!['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host))return '';
 const v=u.searchParams.get('v')||(/\/(?:live|embed|shorts)\/([\w-]{11})/.exec(u.pathname)||[])[1]||'';
 return /^[a-zA-Z0-9_-]{11}$/.test(v)?v:'';
 }catch{return ''}
}
function canEmbed(channel){return !!(state.manualVideo[state.channel]||channel.youtubeChannel)}
function channelEmbedUrl(){
 const channel=CHANNELS[state.channel];if(!channel)return '';
 const videoId=state.manualVideo[state.channel]||'';
 const target=videoId?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(videoId):channel.youtubeChannel?'https://www.youtube.com/embed/live_stream?channel='+encodeURIComponent(channel.youtubeChannel):'';
 if(!target)return '';
 return target+(target.includes('?')?'&':'?')+'autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1';
}
const tv361={active:false,host:null};
function tv361Host(){
 if(tv361.host?.isConnected)return tv361.host;
 const el=doc.createElement('aside');el.id='dt361-tvmini';el.className='dt361-tvmini';el.hidden=true;
 el.setAttribute('aria-label','TV de Mercado flutuante');
 el.innerHTML='<div class="dt361-tvbar"><span class="dt361-grip" title="Arrastar mini player" aria-label="Arrastar mini player">⠿</span><strong data-dt361-name>TV de Mercado</strong><button type="button" data-dt361="restore" title="Expandir" aria-label="Voltar à TV de Mercado">⛶</button><button type="button" data-dt361="close" title="Fechar TV" aria-label="Encerrar transmissão">×</button></div><div class="dt361-vid"></div><small class="dt361-footer">Áudio pelo player · disponível dentro do aplicativo</small>';
 el.addEventListener('click',e=>{const b=e.target.closest('[data-dt361]');if(!b)return;if(b.dataset.dt361==='restore')tv361Return();if(b.dataset.dt361==='close'){stopLive();paint()}});
 doc.body.append(el);tv361.host=el;return el;
}
function tv361Start(){
 if(!(state.tab==='live'&&state.playing))return false;
 const box=tv361Host(),video=box.querySelector('.dt361-vid');
 const iframe=root()?.querySelector('.tv347-embedbox iframe')||root()?.querySelector('.tv343-screen iframe');
 if(iframe){video.replaceChildren(iframe)}
 else if(!video.querySelector('iframe')){
   const url=channelEmbedUrl();if(!url)return false;
   const f=doc.createElement('iframe');f.src=url;f.title='TV de Mercado · canal externo';
   f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';video.replaceChildren(f);
 }
 box.querySelector('[data-dt361-name]').textContent=CHANNELS[state.channel]?.name||'TV de Mercado';
 box.hidden=false;tv361.active=true;return true;
}
function tv361Return(){
 if(!tv361.active)return;
 const d=doc.getElementById('radar332-dialog');
 if(d&&!d.open){win.TraderRadar332?.open?.();return}
 const old=tv361Host().querySelector('.dt361-vid iframe');
 paint(); // enquanto ativo, frame() reserva o espaço sem gerar outro iframe
 const area=root()?.querySelector('.tv347-embedbox');
 if(old&&area)area.prepend(old);
 tv361.active=false;tv361.host.hidden=true;
 tv361.host.removeAttribute('style');
}
win.DiarioTv361={onRadarOpen:()=>{if(tv361.active)tv361Return()},isFloating:()=>tv361.active};
function frame(){const channel=CHANNELS[state.channel];const target=channelEmbedUrl();if(!channel||!target)return '';
 if(tv361.active)return `<div class="tv347-embedbox"><div class="dt361-wait">Transmissão no mini player</div><div class="tv347-embednotice">Áudio e vídeo controlados no canal.</div></div>`;
 return `<div class="tv347-embedbox"><iframe title="${esc(channel.name)} · reprodução externa não verificada" src="${esc(target)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><div class="tv347-embednotice" role="status">⚠ Reprodução experimental · o quadro não confirma que a emissora esteja ao vivo. Se surgir erro, gravação ou tela vazia, use o canal oficial.</div></div>`;
}
/* v354: janela separada de consulta no desktop, aberta somente no clique do usuário.
   Não acessa o vídeo do iframe (outra origem) nem promete PiP no iPhone. */
function floatingMarkup(channel,src){
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TV de Mercado · ${esc(channel.name)}</title><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#071320;color:#edf7fc;font:14px system-ui,-apple-system,Segoe UI,sans-serif}.head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 14px;background:#122638;border-bottom:1px solid #35516a;flex-wrap:wrap}.title{font-weight:750}.tip{color:#a6bece;font-size:12px}.tv{width:100%;height:min(75vh,calc(100vw * .5625));min-height:260px;background:#050a12;display:block;border:0}.foot{padding:11px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}a,button{color:#a8ffe0;border:1px solid #467f77;background:#16372f;border-radius:8px;padding:8px 12px;text-decoration:none;cursor:pointer;font:inherit}.foot span{font-size:12px;color:#acc5d3;flex:1;min-width:180px}</style></head><body><div class="head"><div><div class="title">📺 Diário Trader · ${esc(channel.name)}</div><div class="tip">Janela independente no PC · reprodução externa não verificada</div></div><span class="tip">Áudio inicialmente mudo: libere no vídeo</span></div><iframe class="tv" title="Transmissão de ${esc(channel.name)}" src="${esc(src)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="foot"><a target="_blank" rel="noopener noreferrer" href="${esc(channel.url)}">Abrir canal oficial ↗</a><button type="button" id="close-tv">Fechar janelinha</button><span>Você pode voltar ao Diário Trader ou ao Profit Pro. Se fechar a janela, a TV para. A emissora pode bloquear a reprodução.</span></div></body></html>`;
}
function fillFloating(w,channel,src){
 w.document.open();w.document.write(floatingMarkup(channel,src));w.document.close();
 w.document.getElementById('close-tv')?.addEventListener('click',()=>w.close());w.focus();stopLive();paint();
}
function openFloatingWindow(){
 const channel=CHANNELS[state.channel]||CHANNELS.bmc,src=channelEmbedUrl();
 if(!src){state.liveError='Este canal ainda não possui player incorporável. Use o canal oficial.';paint();return}
 let w=null;
 try{w=win.open('','diario_trader_tv_independente_v354','popup=yes,width=760,height=540,resizable=yes,scrollbars=yes')}catch{}
 if(!w){win.alert('O navegador bloqueou a janelinha. Permita pop-ups para este site ou use Abrir canal oficial.');return}
 try{fillFloating(w,channel,src)}
 catch{try{w.location.href=channel.url}catch{}win.alert('O navegador não permitiu abrir a janela interna. Abrimos a página oficial do canal.');}
}
/* Chrome/Edge podem exibir uma janela sempre visível via Document Picture-in-Picture.
   Ela não sobrevive ao fechamento total do aplicativo de origem. */
function openAlwaysOnTop(){
 if(!win.documentPictureInPicture?.requestWindow){openFloatingWindow();return}
 const channel=CHANNELS[state.channel]||CHANNELS.bmc,src=channelEmbedUrl();
 if(!src){state.liveError='Este canal não possui player incorporável neste momento.';paint();return}
 // A chamada ocorre diretamente dentro do gesto do usuário: exigência da API PiP.
 win.documentPictureInPicture.requestWindow({width:660,height:490}).then(w=>{
   try{fillFloating(w,channel,src)}catch{try{w.close()}catch{}state.liveError='Não foi possível preencher o PiP. Tente a janela comum.';paint()}
 }).catch(()=>{state.liveError='Seu navegador impediu o PiP. Use o botão Janela comum (PC).';paint()});
}
function paint(){const el=root();if(!el)return;
 const pages=current(),index=pages.length?state.slide%pages.length:0,p=pages[index];
 const video=state.tab==='live';
 const attention=!video&&state.proactive?status():null;
 const channel=CHANNELS[state.channel]||CHANNELS.bmc;
 const allowEmbed=canEmbed(channel);
 el.className='tv343'+(state.expanded?' tv343-large':'');
 el.innerHTML=`<div class="tv343-top"><div><small>DIÁRIO TRADER · CENTRAL DE MERCADO</small><strong>📺 TV de Mercado</strong></div><div class="tv343-toptools">${video&&state.playing?button('mini','▣ Mini player'):''}${button('collapse',state.collapsed?'Mostrar':'Recolher')}${button('expand',state.expanded?'Reduzir':'Ampliar')}</div></div>${state.collapsed?'':`<div class="tv343-controls">${button('trader','🎙️ Trader TV',state.tab==='trader'?'aria-pressed="true"':'')}${button('live','📺 Canais ao vivo',state.tab==='live'?'aria-pressed="true"':'')}</div>${!video?`<div class="tv345-tools" role="group" aria-label="Preferências da Trader TV"><label>Mostrar <select data-tv345-topic aria-label="Filtrar boletim"><option value="all" ${state.topic==='all'?'selected':''}>Tudo</option><option value="br" ${state.topic==='br'?'selected':''}>Brasil</option><option value="world" ${state.topic==='world'?'selected':''}>Exterior</option><option value="indices" ${state.topic==='indices'?'selected':''}>Índices</option></select></label>${button('autoplay',state.auto?'⏸ Rotação ligada':'▶ Rotação 30 s',state.auto?'aria-pressed="true"':'')}${button('proactive',state.proactive?'🔔 Destaques ligados':'🔕 Destaques desligados',state.proactive?'aria-pressed="true"':'')}</div>${attention?`<div class="tv345-alert" role="status"><strong>${esc(attention.label)}</strong><span>${esc(attention.txt.slice(0,125))}</span>${attention.kind==='news'?button('dismiss-alert','×','aria-label="Dispensar destaque"'):''}</div>`:''}`:''}${video?`<div class="tv344-channels" role="group" aria-label="Escolha o canal">${Object.entries(CHANNELS).map(([id,v])=>button('channel-'+id,v.name,state.channel===id?'aria-pressed="true"':'')).join('')}</div>`:''}<div class="tv343-screen">${video?(allowEmbed&&state.playing?frame():`<div class="tv343-stage"><span class="tv343-kicker">${esc(channel.lang.toUpperCase())} · CANAL EXTERNO</span><h3>${esc(channel.name)}</h3><p>${esc(channel.desc)}</p>${allowEmbed?button('start-live','▶ Testar sinal do canal'):''}<a href="${esc(channel.url)}" rel="noopener noreferrer" target="_blank">▶ Abrir transmissão oficial ↗</a></div>`):p?`<div class="tv343-stage"><span class="tv343-kicker">${esc(p.tag)}</span><h3>${esc(p.title)}</h3><p>${esc(p.detail.slice(0,p.url?250:500))}</p><small>${esc(p.source)}</small>${p.url?`<a href="${esc(p.url)}" rel="noopener noreferrer" target="_blank">Abrir notícia na fonte</a>`:''}</div>`:`<div class="tv343-stage"><span class="tv343-kicker">AGUARDANDO FONTES</span><h3>Boletim ainda indisponível</h3><p>Atualize a Central de Mercado. A Trader TV usa notícias, cotações e o Giro já publicados.</p></div>`}</div>${video?`<details class="tv350-choose tv352-advanced"><summary>Teste avançado · link oficial de vídeo</summary><label for="tv350-link">Link de transmissão atual do YouTube (opcional)</label><div class="tv350-entry"><input id="tv350-link" type="url" inputmode="url" autocomplete="off" placeholder="Cole um link youtube.com/watch?v=..." aria-label="Link do vídeo ao vivo" value=""><button type="button" data-tv343="use-link">Testar link</button><button type="button" data-tv343="clear-link" ${state.manualVideo[state.channel]?'':'disabled'}>Limpar</button></div><small role="status">${esc(state.liveError|| (state.manualVideo[state.channel]?'Link fornecido manualmente · confirme se está ao vivo.':'Sem live confirmada · links fixos antigos foram removidos.'))}</small></details>`:''}<div class="tv343-bottom">${video?`${allowEmbed?(win.documentPictureInPicture?.requestWindow?button('pip','▣ Flutuante PiP (PC)'):'')+button('floating','▣ Janela comum (PC)'):''}<a href="${esc(channel.url)}" target="_blank" rel="noopener noreferrer">▶ Abrir no YouTube · PiP no iPhone ↗</a>${allowEmbed&&state.playing?button('stop-live','■ Parar vídeo'):''}${state.channel==='bloomberg'?button('captions','CC · Legendas'):''}<span>${esc(channel.lang)} · Áudio controlado pelo canal</span>`:`${button('prev','◀ Anterior')}${button('next','Próxima ▶')}${button('speak','🔊 Ouvir boletim')}${button('stop-speech','■ Silenciar')}${button('giro',state.loadingGiro?'Consultando…':'Carregar Giro IA',state.loadingGiro?'disabled':'')}<span>${pages.length?index+1+'/'+pages.length:'0/0'} · Leitura por voz do aparelho</span>`}</div><div class="tv343-foot">${video?'No PC: use PiP flutuante (quando disponível) ou Janela comum para acompanhar enquanto usa outros programas. No iPhone: abra o canal no YouTube e use o Picture-in-Picture, se disponível nas configurações do iOS e do canal. Fechar totalmente o app ou o navegador pode interromper o vídeo. Transmissão externa não verificada; confira o selo AO VIVO no próprio player.':'O Giro é uma análise com IA previamente publicada; as demais cenas são manchetes atribuídas às fontes, não análises geradas em tempo real.'}</div>`}`;
}
function stopAudio(){try{win.speechSynthesis?.cancel()}catch{}}
function stopLive(){state.playing=false;if(tv361.active){tv361.host?.querySelector('iframe')?.remove();tv361.host.hidden=true;tv361.host.removeAttribute('style');tv361.active=false}const el=root();if(el)el.querySelector('iframe')?.remove()}
function select(t){if(state.tab===t)return;stopAudio();stopLive();state.tab=t;paint()}
async function getGiro(){state.loadingGiro=true;paint();try{await win.TraderRadar332?.giro?.()}finally{state.loadingGiro=false;paint()}}
function narrate(){stopAudio();const pages=current();if(!pages.length||!('speechSynthesis'in win))return;const x=pages[state.slide%pages.length];const text=x.url?`Notícia de ${x.source}. ${x.title}. Consulte o link da fonte para os detalhes.`:`${x.title}. ${x.detail}`;
 const u=new SpeechSynthesisUtterance(text.slice(0,1250));u.lang='pt-BR';u.rate=.96;u.pitch=1;try{const voices=win.speechSynthesis.getVoices();u.voice=voices.find(v=>/pt[-_]BR/i.test(v.lang)&&/natural|neural/i.test(v.name))||voices.find(v=>/pt[-_]BR/i.test(v.lang))||null;win.speechSynthesis.speak(u)}catch{}
}
function onAction(a){if(a==='use-link'){const raw=root()?.querySelector('#tv350-link')?.value||'';const id=youtubeVideoId(raw);if(!id){state.liveError='Cole um link HTTPS válido de um vídeo do YouTube (watch, live ou youtu.be).';stopLive();paint();return}stopLive();state.manualVideo[state.channel]=id;state.liveError='Vídeo informado manualmente · reproduzir não comprova live.';state.playing=true;paint();return}if(a==='clear-link'){stopLive();delete state.manualVideo[state.channel];state.liveError='';paint();return}if(a.startsWith('channel-')){const id=a.slice(8);if(CHANNELS[id]){stopLive();stopAudio();state.channel=id;state.liveError='';paint()}return}switch(a){case'autoplay':state.auto=!state.auto;saveOptions();paint();break;case'proactive':state.proactive=!state.proactive;if(!state.proactive)state.highlight='';saveOptions();paint();break;case'dismiss-alert':state.highlight='';paint();break;case'captions':win.alert('Legendas e tradução são controladas pelo YouTube. Se houver CC, abra as configurações do player e procure Legendas → Traduzir automaticamente → Português. Para lives, esse recurso pode não estar disponível.');break;case'trader':select('trader');break;case'live':select('live');break;case'mini':{const d=doc.getElementById('radar332-dialog');if(d?.open)d.close();else tv361Start();break}case'floating':openFloatingWindow();break;case'pip':openAlwaysOnTop();break;case'start-live':stopAudio();state.playing=true;paint();break;case'stop-live':stopLive();paint();break;case'collapse':state.collapsed=!state.collapsed;stopAudio();stopLive();try{localStorage.setItem('diario-tv343-collapsed',state.collapsed?'1':'0')}catch{}paint();break;case'expand':state.expanded=!state.expanded;paint();break;case'prev':stopAudio();state.slide=Math.max(0,state.slide-1);paint();break;case'next':stopAudio();state.slide++;paint();break;case'speak':narrate();break;case'stop-speech':stopAudio();break;case'giro':getGiro();break}}
function mount(){const el=root();if(!el||el.dataset.tv343Mounted)return;el.dataset.tv343Mounted='1';el.addEventListener('click',e=>{const button=e.target.closest('[data-tv343]');if(button)onAction(button.dataset.tv343)});el.addEventListener('change',e=>{const sel=e.target.closest('[data-tv345-topic]');if(!sel)return;if(['all','br','world','indices'].includes(sel.value)){stopAudio();state.topic=sel.value;state.slide=0;state.highlight='';saveOptions();paint()}});const dialog=doc.getElementById('radar332-dialog');if(dialog&&!dialog.dataset.tv343Close){dialog.dataset.tv343Close='1';dialog.addEventListener('close',()=>{stopAudio();if(tv361Start())return;stopLive();paint()})}paint()}
const style=doc.createElement('style');style.textContent=`
.tv350-choose{margin:8px 0 10px;padding:10px;border:1px solid #31556b;border-radius:8px;background:#102436;display:grid;gap:6px}.tv350-choose label{font-size:11px;color:#cee4f4;font-weight:650}.tv350-entry{display:flex;align-items:stretch;flex-wrap:wrap;gap:6px}.tv350-entry input{min-width:0;flex:1 1 190px;background:#091a29;border:1px solid #45647a;border-radius:8px;color:#ecf7ff;font-size:12px;padding:8px}.tv350-entry button{font-size:11px}.tv350-entry button:disabled{opacity:.4}.tv350-choose small{font-size:11px;color:#a9c4d7;line-height:1.4}.tv343-toptools{flex-direction:row;flex-wrap:wrap}.tv343-stage{justify-content:center}.tv343-screen{min-height:220px}.tv347-embedbox iframe{height:100%;min-height:220px}.tv347-embednotice{font-size:10px}.tv343-stage a{overflow-wrap:anywhere}
.tv347-embedbox{position:relative;width:100%;height:100%;min-height:250px;display:flex;flex-direction:column}.tv347-embedbox iframe{width:100%;flex:1;min-height:230px;border:0;background:#07121e}.tv347-embednotice{background:#182c3c;color:#d3e3ec;font-size:11px;padding:7px 10px;line-height:1.45}.tv343{padding:12px 16px 0;border-bottom:1px solid #2e4a5e;color:#e9f5ff;font:13px/1.45 system-ui}.tv343-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.tv343-top small{display:block;color:#58deb7;font-size:10px;font-weight:700;letter-spacing:.04em}.tv343-top strong{display:block;font-size:16px}.tv343-toptools,.tv343-controls,.tv343-bottom{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.tv343 button,.tv343-bottom a{font:inherit;cursor:pointer;background:#1e384a;color:#e8f3fd;border:1px solid #46647b;border-radius:8px;padding:7px 10px;text-decoration:none}.tv343-controls{margin:10px 0 6px}.tv344-channels{display:flex;gap:6px;overflow:auto;white-space:nowrap;padding:0 0 9px;scrollbar-width:thin}.tv344-channels button{flex:none;font-size:11px;padding:6px 9px}.tv343-stage a{margin-top:7px}.tv343 button[aria-pressed="true"]{border-color:#51ceaa;background:#153f39;color:#b8f6df}.tv343-screen{width:min(100%,440px);aspect-ratio:16/9;background:radial-gradient(circle at 25% 15%,#194867,#08121e 78%);border:1px solid #31526e;border-radius:12px;overflow:hidden;position:relative}.tv343-screen iframe{border:0;width:100%;height:100%;display:block}.tv343-stage{height:100%;padding:13px 16px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;overflow:auto}.tv343-stage h3{font-size:clamp(14px,2.4vw,19px);line-height:1.25;margin:5px 0;color:#f4fcff}.tv343-stage p{margin:4px 0;font-size:12px;line-height:1.45;overflow:auto;max-height:40%;color:#c4d6e2}.tv343-stage small,.tv343-kicker{color:#6fe0ba;font-size:10px;font-weight:700}.tv343-stage a{font-size:11px;color:#95d9ff}.tv343-stage button{align-self:flex-start}.tv343-bottom{margin:10px 0}.tv343-bottom span{font-size:10px;color:#a3b7c7}.tv343-foot{font-size:10px;color:#a1b4c3;margin:8px 0 12px}.tv343-large .tv343-screen{width:100%;max-width:none}.tv343-large .tv343-stage h3{font-size:22px}.tv343-large .tv343-screen{aspect-ratio:16/9}@media(max-width:480px){.tv343{padding:9px 12px 0}.tv343-screen{width:100%}.tv343-toptools button{padding:5px 7px}.tv343-stage{padding:10px}.tv343-stage h3{font-size:14px}.tv343-stage p{font-size:11px}.tv343-controls button,.tv343-bottom button{padding:6px 7px;font-size:11px}}
.tv345-tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:0 0 9px}.tv345-tools label{font-size:11px;color:#bfd6e3}.tv345-tools select{background:#142f40;border:1px solid #46647b;border-radius:8px;color:#e9f5ff;padding:6px 7px;margin-left:4px;font:inherit}.tv345-tools button{font-size:11px;padding:6px 8px}.tv345-alert{display:flex;align-items:center;flex-wrap:wrap;gap:5px 8px;padding:8px 10px;margin-bottom:8px;background:#3d2c17;border:1px solid #a77d37;border-radius:8px;font-size:11px}.tv345-alert strong{color:#ffd88c}.tv345-alert span{flex:1;min-width:120px}.tv345-alert button{padding:1px 7px}.tv343-bottom button{min-height:30px}.tv343-bottom a{font-size:11px;background:#14372f;color:#a6efd6;border-color:#396e63}.tv343-bottom a:focus-visible{outline:2px solid #5fe4b8}
`;doc.head.appendChild(style);
const obs=new MutationObserver(mount);obs.observe(doc.body,{childList:true,subtree:true});mount();
let past='';setInterval(()=>{if(!inDialog()||state.collapsed||state.tab!=='trader')return;const r=radar(),key=[r.updated,!!r.giro,r.news?.length,r.indicesAt,state.slide].join('|');if(key!==past){past=key;watchNews();paint()}},5000);
let lastRotation=Date.now();setInterval(()=>{if(!state.auto||!inDialog()||doc.hidden||state.collapsed||state.tab!=='trader'){lastRotation=Date.now();return}if(Date.now()-lastRotation<30000)return;lastRotation=Date.now();const pages=current();if(pages.length>1){stopAudio();state.slide=(state.slide+1)%pages.length;paint()}},1000);
win.TraderTV343={mount,stop:()=>{stopAudio();stopLive();paint()},state};
})(window,document);

/* v348 — opções como painel flutuante, fallback nativo iOS e organização da narração */
(()=>{const st=document.createElement('style');st.id='au348-aulas-layout';st.textContent=`
#aup{position:fixed!important;overflow:hidden!important;}
#aup .aup-stage{padding:10px 12px 4px!important;}
#aup .au-lesson-visual{gap:8px!important;}
#aup .aup-options:not([hidden]){display:flex!important;position:absolute!important;left:0;right:0;bottom:0;z-index:120!important;background:#101d2e!important;color:#ecf3fa;max-height:min(79dvh,740px)!important;min-height:unset;overflow-y:auto!important;overscroll-behavior:contain;border:1px solid #36536c;border-radius:20px 22px 0 0;box-shadow:0 -20px 65px #000d;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px))!important;gap:12px;align-items:stretch!important;box-sizing:border-box}
#aup .au348-opt-head{width:100%;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #33475d;padding-bottom:9px}
#aup .au348-opt-head strong{font-size:18px;display:block;color:#f1f7fc}#aup .au348-opt-head small{display:block;color:#abc4d8;font-size:12px;margin-top:4px}
#aup .au348-opt-head button{width:40px!important;height:40px!important;min-height:40px!important;border-radius:999px!important;background:#21354a!important}
#aup .au348-first{display:flex;flex-wrap:wrap;gap:7px;width:100%;order:3;border-top:1px solid #30435a;padding-top:9px}
#aup .au348-first button{flex:1 1 112px;font-size:11px!important}
#aup .au339-voices{order:1;width:100%;display:flex;flex-direction:column;align-items:stretch;gap:12px;border:none;padding:0}
#aup .au348-mode-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:7px}
#aup .au348-mode-tabs button{font-size:12px!important;white-space:normal;min-height:62px!important;padding:8px 6px!important;text-align:center;border:1px solid #395570!important;background:#1a3045!important}
#aup .au348-mode-tabs button[aria-pressed="true"]{background:#0d433b!important;border:2px solid #2cdaa5!important;color:#ecfff9!important;font-weight:700}
#aup .au348-neural-label{display:flex;width:100%;justify-content:space-between;align-items:center;gap:8px;color:#b9d1e4;font-size:13px!important}
#aup .au348-neural-label select{flex:1 1 auto;max-width:240px!important;min-width:0!important;background:#1b3046!important;color:#fff!important;opacity:1!important;-webkit-text-fill-color:#fff!important}
#aup .au348-native{display:grid;gap:7px;width:100%;background:#15273a;padding:10px;border-radius:12px;border:1px solid #34516b;box-sizing:border-box}
#aup .au348-native strong{font-size:12px;color:#d9edf9}#aup .au348-native small{font-size:11px;color:#aac4d8;line-height:1.4}
#aup #au348native{display:block;width:100%;max-width:100%;height:42px}#aup #au348native[hidden]{display:none}
#aup #au339status{display:block;width:100%;font-size:12px!important;line-height:1.45;color:#cde2f2}
#aup .au348-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
#aup .au348-actions button{min-height:48px!important;font-size:12px!important;white-space:normal}
#aup .au348-actions [data-au340resume]{background:#047857!important;color:#fff!important;border-color:#37d9ae!important;font-weight:800}
#aup .au337-status,#aup .au336-opt,#aup #aupvel,#aup #aupvoz,#aup [data-auvozteste]{order:4}
#aup .au337-status{width:100%;font-size:11px}
#aup .aup-ctl{z-index:3!important}
@media(max-width:390px){#aup .au348-mode-tabs button{font-size:11px!important}#aup .aup-options:not([hidden]){padding:12px 11px calc(12px + env(safe-area-inset-bottom,0px))!important}}

/* v349 — Piper gratuito */
#aup .au349-piper{display:grid;gap:10px;width:100%;border:1px solid #35617a;background:#102b3c;border-radius:12px;padding:12px;box-sizing:border-box}
#aup .au349-piper strong{font-size:14px;color:#edf8ff}#aup .au349-piper small{font-size:12px;color:#b4d0df;line-height:1.5}
#aup .au349-piper-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#aup .au349-piper-actions button,#aup .au349-import-btn{min-height:48px;border:1px solid #46839a;background:#184459;color:#efffff;border-radius:12px;padding:11px 6px;font-size:12px;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer;box-sizing:border-box}
#aup #au349native{width:100%;max-width:100%;height:40px}#aup #au349native[hidden]{display:none!important}
#aup .au348-native,#aup .au348-neural-label{display:none!important}
#aup .aup-options:not([hidden]){max-height:78dvh!important}
@media(max-width:480px){#aup .au349-piper-actions{grid-template-columns:1fr 1fr}}
`;document.head.appendChild(st)})();

(()=>{const st=document.createElement('style');st.id='v352-consolidacao-ui';st.textContent=`
#aup .au352-tools{order:5;width:100%;min-width:0;border-top:1px solid #30475c;margin-top:9px;padding-top:9px}
#aup .au352-tools summary{cursor:pointer;color:#b8d9e8;font-size:13px;font-weight:650;padding:8px 3px}
#aup .au352-tools .au348-first{order:initial;border:0;margin-top:7px;padding:0}
#aup .au352-control-label{order:4;width:100%;font-size:12px;line-height:1.2;color:#b5d2e5;margin:4px 0 -6px;font-weight:650}
#aup .au352-voice-status{order:4;display:block;width:100%;font-size:12px;line-height:1.4;color:#a8c6d7}
#aup .aup-options:not([hidden]){gap:10px!important}
#aup .aup-options #aupvel,#aup .aup-options #aupvoz{max-width:100%;width:100%;min-width:0}
#aup .aup-ctl{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));}
.tv352-advanced{display:block;min-width:0}.tv352-advanced summary{font-size:12px;color:#b2d9ea;cursor:pointer;list-style:revert;padding:4px}
.tv352-advanced:not([open]){padding:6px 10px}.tv352-advanced:not([open])> :not(summary){display:none!important}
.tv343-toptools{align-items:center;gap:5px}.tv343-toptools button{min-width:0}
@media(max-width:520px){#aup .aup-ctl{gap:6px!important;padding-left:8px!important;padding-right:8px!important}#aup .aup-ctl .aup-tv-btn,#aup .aup-ctl .aup-options-toggle{font-size:12px!important}#aup .aup-options:not([hidden]){max-height:75dvh!important}}
`;document.head.appendChild(st)})();
(()=>{const s=document.createElement("style");s.id="au351-iphone-voice-layout";s.textContent='\n/* v351: opções pertencem ao painel de narração; não vazam para o rodapé.\n   Safari iOS força cores claras em select sem appearance explícito. */\n#aup .aup-options[hidden]{display:none!important}\n#aup .aup-options:not([hidden]){display:flex!important;flex-direction:column!important;align-items:stretch!important;position:absolute!important;top:auto!important;left:0!important;right:0!important;bottom:0!important;max-height:min(75dvh,640px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;z-index:200!important;background:#101d2e!important;color:#edf6ff!important;border-radius:20px 20px 0 0!important;box-shadow:0 -20px 75px #000b!important;padding:14px 14px calc(18px + env(safe-area-inset-bottom,0px))!important}\n#aup .aup-options .au336-opt,#aup .aup-options #aupvel,#aup .aup-options #aupvoz,#aup .aup-options [data-auvozteste]{order:4!important;position:static!important;flex:none!important;max-width:100%!important;width:100%!important;margin:0!important;box-sizing:border-box!important}\n#aup .aup-options select,#aup .aup-options #aupvel,#aup .aup-options #aupvoz{appearance:none!important;-webkit-appearance:none!important;border:1px solid #45647c!important;border-radius:12px!important;background:#1c3147!important;color:#f4f8ff!important;-webkit-text-fill-color:#f4f8ff!important;opacity:1!important;min-height:43px!important;height:43px!important;padding:8px 12px!important;font:500 14px/1.2 system-ui,-apple-system,sans-serif!important;box-shadow:none!important}\n#aup .aup-options select option{background:#1c3147!important;color:#fff!important}\n#aup .aup-options [data-auvozteste]{background:#183b46!important;color:#e5fff7!important;border:1px solid #2c866f!important;border-radius:12px!important;min-height:42px!important}\n#aup .aup-options .au336-opt{display:flex!important;gap:8px;align-items:center;min-height:30px;font-size:13px!important;color:#c4deed!important;background:none!important}\n#aup .aup-options .au336-opt input{width:18px!important;height:18px!important;flex:none!important}\n#aup .au339-voices{width:100%!important;min-width:0!important;box-sizing:border-box!important}\n#aup .au349-piper{display:none!important}\n#aup:has([data-au348mode="piper"][aria-pressed="true"]) .au349-piper{display:grid!important}\n#aup .au348-actions [data-au349test]{display:none!important}\n#aup:has([data-au348mode="piper"][aria-pressed="true"]) .au348-actions [data-au349test]{display:block!important}\n#aup .aup-stage{min-height:0!important;flex:1 1 auto!important}\n#aup .aup-ctl{flex:0 0 auto!important}\n@media(max-width:520px){#aup .aup-options .au348-mode-tabs button{min-height:54px!important}#aup .aup-options:not([hidden]){max-height:72dvh!important}}\n';document.head.appendChild(s)})();

/* v353 — Narração gratuita confiável: aviso de falha e Piper relegado ao menu avançado. */
(()=>{const st=document.createElement('style');st.id='au353-ios-voice-feedback';st.textContent=`
#aup .au353-voice-alert[hidden]{display:none!important}
#aup .au353-voice-alert{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap;flex:none;max-width:100%;box-sizing:border-box;margin:5px 12px;background:#3a271e;border:1px solid #e0a675;color:#fff1d9;padding:10px 11px;border-radius:12px;font:500 12px/1.4 system-ui,-apple-system,sans-serif}
#aup .au353-voice-alert span{flex:1 1 180px}
#aup .au353-voice-alert button{flex:0 1 auto;min-height:38px!important;padding:7px 12px!important;border-radius:8px!important;color:#effffb!important;background:#086e58!important;border:1px solid #34d3aa!important;font-size:12px!important}
#aup .aup-options .au348-mode-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#aup .au352-tools [data-au348mode="piper"]{font-size:11px!important;min-height:38px!important}
#aup .aup-options .au352-tools{order:6!important}
@media(max-width:520px){#aup .au353-voice-alert{margin:5px 8px;padding:8px}}
`;document.head.appendChild(st)})();


/* v361 · Arrastar mini players pela alça, sem afetar botões nem a navegação. */
(function(){'use strict';
 let session=null;
 document.addEventListener('pointerdown',e=>{
  const handle=e.target.closest('.au361-grip,.dt361-grip');if(!handle||e.button!==0)return;
  const box=handle.closest('#aup.au361-floating,#dt361-tvmini');if(!box)return;
  const rect=box.getBoundingClientRect();
  session={id:e.pointerId,box,startX:e.clientX,startY:e.clientY,left:rect.left,top:rect.top};
  try{handle.setPointerCapture(e.pointerId)}catch{}
  e.preventDefault();
 },true);
 document.addEventListener('pointermove',e=>{
  const s=session;if(!s||s.id!==e.pointerId||!s.box.isConnected)return;
  const w=s.box.getBoundingClientRect().width,h=s.box.getBoundingClientRect().height;
  const left=Math.max(6,Math.min(innerWidth-w-6,s.left+e.clientX-s.startX));
  const top=Math.max(6,Math.min(innerHeight-h-6,s.top+e.clientY-s.startY));
  s.box.style.setProperty('left',left+'px','important');s.box.style.setProperty('top',top+'px','important');
  s.box.style.setProperty('right','auto','important');s.box.style.setProperty('bottom','auto','important');
 },true);
 document.addEventListener('pointerup',e=>{if(session?.id===e.pointerId)session=null},true);
 document.addEventListener('pointercancel',e=>{if(session?.id===e.pointerId)session=null},true);
})();
/* v369 — Rotinas sugeridas por fase, sem consultar bolsa e sem executar ordens.
   Ativação automática é opcional, por usuário, e preserva os layouts personalizados. */
(function(win,doc){
 'use strict';
 const base='diario-terminal-fase-auto-v369:';
 const names={pre:'Pré-mercado',live:'Pregão BR',post:'Pós-mercado'};
 const owner=()=>win.DIARIO_DEMO?'demo':(typeof SESS!=='undefined'?SESS?.uid||null:null);
 function phaseAtBR(instant){
   if(!(instant instanceof Date)||!Number.isFinite(instant.getTime()))return null;
   const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',hourCycle:'h23',weekday:'short',hour:'2-digit',minute:'2-digit'}).formatToParts(instant).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
   if(parts.weekday==='Sat'||parts.weekday==='Sun')return 'post';
   const minute=Number(parts.hour)*60+Number(parts.minute);
   return minute<9*60?'pre':minute<18*60?'live':'post';
 }
 const current=()=>phaseAtBR(new Date());
 const key=()=>owner()?base+owner():null;
 function automatic(){try{const k=key();return !!k&&localStorage.getItem(k)==='1';}catch{return false}}
 function setAutomatic(flag){const k=key();if(!k)throw Error('Entre na sua conta.');try{localStorage.setItem(k,flag?'1':'0')}catch{throw Error('Não foi possível salvar a preferência neste navegador.')}}
 let lastPhase=null;
 const state=()=>{try{return win.TRM?.TS?.()||null}catch{return null}};
 function suggest(kind){if(!kind||!win.TerminalOrganizador322?.apply)throw Error('O organizador ainda não está disponível.');win.TerminalOrganizador322.apply(kind);}
 function labels(){const phase=current(),mode=automatic(),bar=doc.querySelector('.trbar');if(!bar||win.TRPOP)return;
   let recommendation=bar.querySelector('[data-t369-suggest]'),toggle=bar.querySelector('[data-t369-auto]');
   if(!recommendation){
     recommendation=doc.createElement('button');recommendation.type='button';recommendation.className='trbtn';recommendation.dataset.t369Suggest='1';
     recommendation.addEventListener('click',()=>{try{suggest(current())}catch(e){if(typeof win.toast==='function')win.toast(e.message)}});bar.appendChild(recommendation);
   }
   if(!toggle){
     toggle=doc.createElement('button');toggle.type='button';toggle.className='trbtn';toggle.dataset.t369Auto='1';
     toggle.addEventListener('click',()=>{try{const enabled=!automatic();setAutomatic(enabled);if(enabled){const ws=state()?.ws||'';if(ws.startsWith('ws321_auto_')){lastPhase=current();suggest(lastPhase)}else{lastPhase=null;if(typeof win.toast==='function')win.toast('Modo automático habilitado, mas pausado neste Workspace personalizado. Selecione uma rotina para começar.')}}labels()}catch(e){if(typeof win.toast==='function')win.toast(e.message)}});bar.appendChild(toggle);
   }
   const t=phase?names[phase]:'indisponível';recommendation.textContent='Rotina: '+t;recommendation.title='Sugestão por horário de Brasília, não confirmação de abertura da bolsa. Clique para abrir o layout sem executar ordens.';
   const ws=state()?.ws||'';
   const paused=mode&&!ws.startsWith('ws321_auto_');
   toggle.textContent=mode?(paused?'Auto: pausado':'Auto: ligado'):'Auto: desligado';
   toggle.title='Alternância opcional de layouts por horário, limitada a Workspaces automáticos. Layout personalizado não é alterado automaticamente.';
   toggle.setAttribute('aria-pressed',mode?'true':'false');
 }
 function tick(){const p=current(),s=state();if(!p||!s)return;
   if(automatic()&&lastPhase!==p&&s.ws.startsWith('ws321_auto_')&&s.ws!=='ws321_auto_'+p){
      lastPhase=p;try{suggest(p)}catch(_){/* manter layout atual */}
   }else lastPhase=p;
   labels();
 }
 win.TerminalFases369={phaseAtBR,current,automatic,setAutomatic,tick,mount:labels};
 if(win.TraderUI?.onRender)win.TraderUI.onRender('terminal-fases-v369',()=>{labels()});
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{labels();tick()},{once:true});else{labels();tick()}
 setInterval(()=>{if(!doc.hidden)tick()},60*1000);
})(window,document);


/* v375 — qualidade observável das cotações já presentes; nenhuma ordem ou fonte fictícia. */
(function(win,doc){'use strict';
 function inspect(q){
  const rows=Array.isArray(q?.rows)?q.rows:[],good=rows.filter(r=>r?.px!=null&&r.px!==''&&Number.isFinite(Number(r.px))&&Number(r.px)>0);
  const delayed=rows.filter(r=>r?.atraso===true).length,missing=rows.length-good.length;
  const ts=q?.timestamp&&Number.isFinite(new Date(q.timestamp).getTime())?new Date(q.timestamp).toISOString():null;
  const rawStatus=typeof q?.status==='string'?q.status.slice(0,90):'sem conexão de leitura';
  return {status:rawStatus,registros:rows.length,precosValidos:good.length,precosAusentes:missing,atrasadosDeclarados:delayed,
   atrasoNaoInformado:rows.filter(r=>r?.atraso!==true&&r?.atraso!==false).length,observadoEm:ts,
   alerta:!rows.length?'Nenhuma cotação disponível no cache.':missing||delayed||/antiga|falha|aguardando|indisponível/i.test(rawStatus)?'Confira fontes, timestamps e situação do mercado.':'Valores consultivos; não equivalem a feed tick-by-tick.'};
 }
 function open(){
  const old=doc.querySelector('#tr-qualidade-v374');if(old){old.showModal?.();return}
  const dialog=doc.createElement('dialog');dialog.id='tr-qualidade-v374';
  Object.assign(dialog.style,{width:'min(490px,94vw)',maxHeight:'75dvh',background:'#101b28',color:'#edf5ff',border:'1px solid #6c8098',borderRadius:'12px',padding:'16px',font:'13px/1.5 system-ui'});
  const h=doc.createElement('h2');h.textContent='Qualidade dos dados · Terminal';dialog.append(h);
  const p=doc.createElement('pre');p.style.whiteSpace='pre-wrap';p.style.overflowWrap='anywhere';dialog.append(p);
  const desc=doc.createElement('p');desc.textContent='Consulta ao último cache do Terminal. Horário do registro não confirma se o mercado está aberto. Sem execução de ordens.';dialog.append(desc);
  function update(){const state=inspect(win.TraderConsulta325?.getQuotes?.());p.textContent=JSON.stringify(state,null,2)}
  const refresh=doc.createElement('button');refresh.type='button';refresh.textContent='Atualizar diagnóstico';refresh.addEventListener('click',update);dialog.append(refresh);
  const close=doc.createElement('button');close.type='button';close.textContent='Fechar';close.style.marginLeft='10px';close.addEventListener('click',()=>dialog.close());dialog.append(close);
  doc.body.append(dialog);update();dialog.showModal?.();
 }
 function mount(){const bar=doc.querySelector('.trbar');if(!bar||bar.querySelector('[data-tr-qualidade-v374]'))return;
  const b=doc.createElement('button');b.type='button';b.className='trbtn';b.dataset.trQualidadeV374='1';b.textContent='Qualidade dos dados';
  b.title='Diagnóstico das cotações existentes; não transmite dados e não executa ordens.';b.addEventListener('click',open);bar.appendChild(b);
 }
 win.TerminalQualidade374={inspect,mount};
 if(win.TraderUI?.onRender)win.TraderUI.onRender('terminal-qualidade-v374',mount);
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
