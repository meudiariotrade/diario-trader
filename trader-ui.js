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
