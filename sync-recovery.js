/* Fila de recuperação da sincronização. Dados continuam no armazenamento local da conta. */
(function (root) {
  'use strict';
  function recuperavel(error) {
    if (!error || error.code === 'SESSION_CHANGED') return false;
    if (error.status) return [408, 409, 425, 429].includes(error.status) || error.status >= 500;
    return /fetch|network|offline|load failed|timeout|timed out|abort/i.test(String(error.message || error));
  }
  function criar({ owner, run, changed = () => {}, schedule = setTimeout, cancel = clearTimeout, online = () => root.navigator?.onLine !== false }) {
    let timer = null, attempt = 0, account = null;
    const limpar = () => { if (timer !== null) cancel(timer); timer = null; attempt = 0; account = null; };
    const failed = error => {
      const uid = owner();
      if (!uid || !recuperavel(error)) { limpar(); return false; }
      if (account !== uid) { limpar(); account = uid; }
      if (timer !== null) cancel(timer);
      const delay = Math.min(120000, 3000 * 2 ** Math.min(attempt++, 6));
      changed({ state: 'pending', delay, attempt, owner: uid });
      timer = schedule(async () => {
        timer = null;
        if (owner() !== uid) { limpar(); return; }
        if (!online()) { failed(new Error('offline')); return; }
        await run();
      }, delay);
      return true;
    };
    return { failed, saved() { limpar(); changed({ state: 'synced' }); }, clear: limpar, get pending() { return timer !== null; } };
  }
  const api = { criar, recuperavel };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DiarioSyncRecovery = api;
})(typeof window === 'undefined' ? globalThis : window);
