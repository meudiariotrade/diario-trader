/* Carregamento compartilhado: mantém uma única transferência por módulo e permite retentar falhas. */
(function (w,d) {
  const pending = new Map();
  w.DiarioChunks = { functions: {}, load(file) {
    if (pending.has(file)) return pending.get(file);
    const task = new Promise((resolve,reject) => {
      const s = d.createElement('script'); s.src = file + '?v=' + w.DIARIO_RELEASE.version; s.async = true;
      s.onload = resolve; s.onerror = () => { s.remove(); pending.delete(file); reject(new Error('Não foi possível carregar este recurso. Confira a conexão e tente de novo.')); };
      d.head.appendChild(s);
    });
    pending.set(file,task); return task;
  } };
})(window,document);
