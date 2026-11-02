/* Backup integral: validação anterior à escrita e uma transação para dados e anexos. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const identity = ['uid', 'up', 'st', 'lastSyncAt'];
  const lists = ['trades', 'rules', 'books', 'ops', 'lanc', 'mesaTr', 'olho'];
  const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
  const maxBytes = 50 * 1024 * 1024;
  async function checksum(state,imgs){
    if(!root.crypto?.subtle)throw Error('Verificação de integridade indisponível neste ambiente.');
    const bytes=new TextEncoder().encode(JSON.stringify({S:state,imgs}));
    return Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  }
  function validate(input) {
    let nodes = 0;
    function walk(value, depth = 0) {
      if (++nodes > 500000 || depth > 70) throw Error('Backup excede o limite de estrutura.');
      if (typeof value === 'number' && !Number.isFinite(value)) throw Error('Número inválido no backup.');
      if (value && typeof value === 'object') for (const key of Object.keys(value)) {
        if (forbidden.has(key)) throw Error('Campo inseguro no backup.');
        walk(value[key], depth + 1);
      }
    }
    walk(input);
    if (!object(input) || ![1, 2].includes(input.v) || !object(input.S)) throw Error('Formato de backup não reconhecido.');
    const state = input.S;
    for (const key of lists) if (state[key] !== undefined) checkList(state[key], key);
    if (state.days !== undefined && !object(state.days)) throw Error('Diário inválido.');
    for (const [date, day] of Object.entries(state.days || {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !object(day)) throw Error('Data ou página do diário inválida.');
    }
    if (state.cart !== undefined) {
      if (!object(state.cart)) throw Error('Carteira inválida.');
      if (state.cart.lanc !== undefined) checkList(state.cart.lanc, 'movimentações da carteira');
    }
    if (input.imgs !== undefined && !object(input.imgs)) throw Error('Anexos inválidos.');
    for (const [id, data] of Object.entries(input.imgs || {})) {
      if (!id || id.length > 200 || typeof data !== 'string' || !/^data:(image\/(jpeg|png|webp|gif)|audio\/[a-z0-9.+-]+|video\/webm)(;codecs=[a-z0-9.,-]+)?;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(data)) throw Error('Anexo inválido: ' + id);
    }
    return input;
  }
  function checkList(rows, label) {
    if (!Array.isArray(rows)) throw Error('Lista inválida: ' + label);
    const ids = new Set();
    for (const row of rows) {
      if (!object(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw Error('Identificador inválido ou repetido: ' + label);
      ids.add(row.id);
    }
  }
  function records(local = [], incoming = [], deleted = {}) {
    const map = new Map();
    for (const row of [...incoming, ...local]) {
      const old = map.get(row.id);
      if (root.TraderModel) map.set(row.id, root.TraderModel.mergeRecord(row, old));
      else if (!old || (+row.u || 0) >= (+old.u || 0)) map.set(row.id, clone(row));
    }
    return [...map.values()].filter(row => !deleted[row.id] || deleted[row.id] < (+row.u || 0));
  }
  function fill(local, incoming) {
    if (!object(local) || !object(incoming)) return clone(local === undefined ? incoming : local);
    const out = clone(incoming);
    for (const key of Object.keys(local)) out[key] = key in incoming ? fill(local[key], incoming[key]) : clone(local[key]);
    return out;
  }
  function merge(local, incoming) {
    const out = fill(local, incoming), deleted = {...incoming.del};
    for (const [id, at] of Object.entries(local.del || {})) deleted[id] = Math.max(+at || 0, +deleted[id] || 0);
    out.del = deleted;
    for (const key of lists) if (local[key] || incoming[key]) out[key] = records(local[key], incoming[key], deleted);
    out.days = root.DiarioDados ? root.DiarioDados.mergeDays(local.days, incoming.days) : fill(local.days || {}, incoming.days || {});
    if (local.cart || incoming.cart) {
      out.cart = fill(local.cart || {}, incoming.cart || {});
      if (local.cart?.lanc || incoming.cart?.lanc) out.cart.lanc = records(local.cart?.lanc, incoming.cart?.lanc, deleted);
    }
    out.watch = [...new Set([...(local.watch || []), ...(incoming.watch || [])])];
    // Uma cópia nunca troca a conta conectada nem seus marcadores de sincronização.
    for (const key of identity) { delete out[key]; if (local[key] !== undefined) out[key] = clone(local[key]); }
    return out;
  }
  const model = Object.freeze({validate, merge, records, maxBytes});
  root.TraderBackupModel = model;
  let busy = false;
  const owner = () => JSON.stringify([S.uid || '', SESS?.uid || '']);
  function snapshot() { return clone({...S, days: diarioDaysCanonical()}); }
  function media() {
    return new Promise((resolve, reject) => {
      if (!db) return reject(Error('Armazenamento do aparelho indisponível.'));
      const tx = db.transaction('img', 'readonly'), store = tx.objectStore('img');
      const keys = store.getAllKeys(), values = store.getAll();
      tx.oncomplete = () => resolve(new Map(keys.result.map((key, i) => [String(key), values.result[i]])));
      tx.onabort = () => reject(tx.error || Error('Falha ao ler anexos.'));
    });
  }
  const dataURL = blob => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('Não foi possível ler um anexo.')); reader.readAsDataURL(blob);
  });
  function strings(value, out = new Set()) {
    if (typeof value === 'string') out.add(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(item => strings(item, out));
    return out;
  }
  function requiredMedia(value, out = new Set()) {
    if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
      if (['pin', 'pout', 'pplan', 'au'].includes(key) && typeof item === 'string' && item) out.add(item);
      else if (item && typeof item === 'object') requiredMedia(item, out);
    }
    return out;
  }
  async function exportBackup() {
    if (busy) return;
    busy = true;
    try {
      const account = owner(), state = snapshot(), references = strings(state), stored = await media(), imgs = {};
      for (const [id, blob] of stored) if (references.has(id)) imgs[id] = await dataURL(blob);
      for (const id of requiredMedia(state)) if (!imgs[id]) throw Error('Anexo não encontrado neste aparelho. Sincronize os anexos antes de exportar.');
      const payload = validate({v: 2, createdAt: new Date().toISOString(), S: state, imgs});
      if(root.crypto?.subtle)payload.integrity={algorithm:'SHA-256',value:await checksum(state,imgs)};
      const text = JSON.stringify(payload);
      if (new Blob([text]).size > maxBytes) throw Error('Backup maior que 50 MB. Exporte pelo computador após revisar os anexos.');
      if (owner() !== account) throw Error('A conta mudou durante a exportação. Tente novamente.');
      await saveFile('diario-backup-' + loc().slice(0, 10) + '.json', text, 'application/json');
      if(owner()===account){S.lastBackup = loc().slice(0, 10); save();}
    } catch (error) {
      if (typeof root.toast === 'function') root.toast(error.message, 8000);
      else root.alert(error.message);
    } finally { busy = false; }
  }
  function commit(state, images, before, account) {
    return new Promise((resolve, reject) => {
      if (!db) return reject(Error('Armazenamento do aparelho indisponível.'));
      const tx = db.transaction(['kv', 'img'], 'readwrite');
      let changed = false;
      tx.oncomplete = resolve;
      tx.onabort = () => reject(changed ? Error('Os dados mudaram durante a restauração. Nada foi importado; tente novamente.') : tx.error || Error('Falha ao gravar o backup. Nada foi importado.'));
      try {
        const guard = () => {if(owner() !== account || JSON.stringify(snapshot()) !== before){changed=true;tx.abort()}};
        tx.objectStore('kv').put(state, 's').onsuccess=guard;
        for (const [id, blob] of images) tx.objectStore('img').put(blob, id).onsuccess=guard;
      } catch (error) { tx.abort(); reject(error); }
    });
  }
  async function restoreBackup(file) {
    if (busy) return 'Há outro backup em andamento. Aguarde.';
    busy = true;
    try {
      const account = owner();
      if (file.size > maxBytes) throw Error('Backup excede o limite de 50 MB.');
      const text = await file.text();
      if (new Blob([text]).size > maxBytes) throw Error('Backup excede o limite de 50 MB.');
      const input = validate(JSON.parse(text));
      if(input.integrity&&(input.integrity.algorithm!=='SHA-256'||input.integrity.value!==await checksum(input.S,input.imgs||{})))throw Error('A verificação de integridade falhou. O arquivo foi alterado ou está corrompido.');
      const images = new Map(), existing = await media();
      for (const [id, data] of Object.entries(input.imgs || {})) {
        if (existing.has(id)) {
          if (await dataURL(existing.get(id)) !== data) throw Error('Anexo com identificador conflitante. Nada foi importado.');
          continue;
        }
        const raw = atob(data.slice(data.indexOf(',') + 1));
        images.set(id, new Blob([Uint8Array.from(raw, c => c.charCodeAt(0))], {type: data.slice(5, data.indexOf(';base64,'))}));
      }
      for (const id of requiredMedia(input.S)) if (!images.has(id) && !existing.has(id)) throw Error('O backup referencia um anexo ausente: ' + id);
      if (account !== owner()) throw Error('A conta mudou. Nada foi importado.');
      if (typeof mdmSet === 'function') mdmSet('br');
      const current = snapshot(), before = JSON.stringify(current), merged = merge(current, input.S);
      merged.mt = Math.max(Date.now(), +current.mt + 1 || 0);
      // Cancela a gravação agendada anterior; as transações já abertas terminam antes desta.
      clearTimeout(st);
      await commit(merged, images, before, account);
      if (owner() !== account) {
        persist();if(typeof persistNow==='function')persistNow();
        return 'A conta mudou ao concluir. A importação não foi aplicada à sessão atual; confira o backup na conta de origem.';
      }
      const latest = snapshot();
      S = JSON.stringify(latest) === before ? merged : merge(latest, merged);
      for (const [id, blob] of images) M[id] = blob;
      root.DiarioDados?.reset(S.days);
      save();
      return 'Backup restaurado: diário, operações, carteira, preferências e anexos mesclados. Registros locais mais recentes foram preservados.';
    } catch (error) {
      root.DiarioDados?.reset(diarioDaysCanonical());
      if (typeof persist === 'function' && LOCAL_SAVE.pending) persist();
      return 'Backup não restaurado. ' + (error instanceof SyntaxError ? 'JSON inválido.' : error.message);
    } finally { busy = false; }
  }
  root.TraderBackup = Object.freeze({exportBackup, restoreBackup});
})(typeof window === 'undefined' ? globalThis : window);
