/* Um conteúdo por edição e conta para tela, PDF e imagem. Sem recompor indicadores na exportação. */
(function(w){'use strict';const snapshots=new Map();let account='';
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
 function capture(kind,value){const uid=w.DiarioContexto?.owner()||'local';if(uid!==account){account=uid;snapshots.clear()}const raw=JSON.stringify(value),key=kind+':'+(value?.exec_id||value?.edicao_id||value?.id||value?.gerado||'atual'),previous=snapshots.get(key);if(previous?.raw===raw)return previous.value;const snap=freeze(w.DiarioDominios.snapshot(value,{tipo:kind,id:key,gerado:value?.gerado||value?.gerado_em||new Date().toISOString()}));snapshots.set(key,{raw,value:snap});while(snapshots.size>30)snapshots.delete(snapshots.keys().next().value);return snap}
 w.DiarioRelatorios={capture,get size(){return snapshots.size}};
})(window);
