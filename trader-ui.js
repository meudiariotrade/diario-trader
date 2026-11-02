/* Ciclo da interface: um único adaptador para os módulos atuais.
 * Mantém a ordem de antes/depois e o retorno do código legado.
 * Os callbacks são síncronos; consultas devem terminar chamando render depois.
 */
(function (root) {
  'use strict';
  if (root.TraderUI) return;
  const renderHooks = new Map();
  const sheetHooks = new Map();

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
    // Uma captura por ciclo: mudanças de registro valem na próxima atualização.
    const hooks = [...registry.values()];
    const states = new Map();
    for (let i = hooks.length - 1; i >= 0; i--) {
      const hook = hooks[i];
      if (hook.before) states.set(hook, hook.before.apply(receiver, args));
    }
    const result = base.apply(receiver, args);
    for (const hook of hooks) if (hook.after) hook.after.call(receiver, states.get(hook), ...args);
    return result;
  }

  const originalRender = render0;
  render0 = function () { return invoke(originalRender, renderHooks, this, [...arguments]); };
  const originalSheet = showSheet;
  showSheet = function () { return invoke(originalSheet, sheetHooks, this, [...arguments]); };

  root.TraderUI = Object.freeze({
    onRender: (id, hooks) => register(renderHooks, id, hooks),
    onSheet: (id, hooks) => register(sheetHooks, id, hooks),
    inspect: () => ({render: [...renderHooks.keys()], sheet: [...sheetHooks.keys()]})
  });
})(window);
