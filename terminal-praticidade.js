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
    for(const [cmd,name] of window.TraderTerminalActions?.commands||[])map.set(cmd,{cmd,name,category:'Painéis do Terminal'});
    const tk = ticker();
    if (tk) for (const [suffix, label] of [['G', 'Gráfico'], ['DES', 'Visão da empresa'], ['FA', 'Fundamentos']]) {
      const cmd = tk + ' ' + suffix; map.set(cmd, {cmd, name: label + ' · ' + tk, category: 'Ativo do painel'});
    }
    if (tk) map.set('N ' + tk, {cmd: 'N ' + tk, name: 'Notícias · ' + tk, category: 'Ativo do painel'});
    const fav = favorites(), recent = (api()?.TR.hist || []).map(command).filter(Boolean).slice(0, 20);
    for (const cmd of [...fav, ...recent]) if (!map.has(cmd)) map.set(cmd, {cmd, name: cmd, category: 'Seus comandos'});
    const q = normalize(query).trim();
    const items = [...map.values()].filter(item => (!window.TerminalCommandPolicy || window.TerminalCommandPolicy.allows(item.cmd)) && (!q || normalize(item.cmd + ' ' + item.name + ' ' + item.category).includes(q)) && (filter !== 'favorites' || fav.includes(item.cmd)) && (filter !== 'recent' || recent.includes(item.cmd)));
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
