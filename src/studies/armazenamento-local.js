/* Estudos · arquivos locais e backup portátil. Nada deste serviço envia conteúdo à rede. */
;(function(){
 'use strict';
 const DB='diario-estudos-local-v1',STORE='arquivos',VERSION=1,MAX_IMPORT=350*1024*1024;
 const owner=()=>typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):'visitante';
 const token=(tipo,id,uid=owner())=>uid+'|'+tipo+'|'+id;
 let opening;
 function open(){
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   if(!('indexedDB'in window)){reject(Error('IndexedDB indisponível neste navegador.'));return;}
   const req=indexedDB.open(DB,VERSION);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'key'});};
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||Error('Não foi possível abrir os arquivos locais.'));
   req.onblocked=()=>reject(Error('Feche outras janelas do aplicativo e tente novamente.'));
  }).catch(err=>{opening=null;throw err;});
  return opening;
 }
 async function transaction(mode,operation){
  const db=await open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
   let result;
   try{const req=operation(store);req.onsuccess=()=>{result=req.result;};req.onerror=()=>reject(req.error||Error('Falha no armazenamento local.'));}catch(err){reject(err);return;}
   tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('Sem espaço para salvar no dispositivo.'));tx.onabort=()=>reject(tx.error||Error('Gravação local cancelada.'));
  });
 }
 async function put(tipo,id,blob,meta={}){
  if(!(blob instanceof Blob)||!blob.size)throw Error('Selecione um arquivo válido.');
  const uid=owner();
  await transaction('readwrite',s=>s.put({key:token(tipo,id,uid),owner:uid,tipo,id,blob,meta,atualizado:Date.now()}));
  try{await navigator.storage?.persist?.();}catch{}
  return true;
 }
 async function get(tipo,id){return (await transaction('readonly',s=>s.get(token(tipo,id))))||null;}
 async function all(){return (await transaction('readonly',s=>s.getAll())).filter(r=>r.owner===owner());}
 async function legacy(){
  const uid=owner(),out=[];
  const name=window.DIARIO_DEMO?'diario-trader-demo-v286':'diario-trader';
  await new Promise(resolve=>{
   try{
    const req=indexedDB.open(name,1);
    req.onerror=()=>resolve();
    req.onupgradeneeded=()=>{req.transaction.abort();resolve();};
    req.onsuccess=()=>{
     const db=req.result;if(!db.objectStoreNames.contains('kv')){db.close();resolve();return;}
     const tx=db.transaction('kv','readonly'),cursor=tx.objectStore('kv').openCursor();
     cursor.onsuccess=()=>{
      const c=cursor.result;if(!c)return;
      const k=String(c.key);
      if((k.startsWith('diario:mentor-local:')||k.startsWith('diario:mentor-voz:'))&&(k.includes(':'+uid+':')||k.endsWith(':'+uid)))out.push({key:k,value:c.value});
      c.continue();
     };
     tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();resolve();};
    };
   }catch{resolve();}
  });
  return out;
 }
 const encode=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
 function decode(b64,mime){
  const bin=atob(b64),parts=[];
  for(let i=0;i<bin.length;i+=65536){const raw=bin.slice(i,i+65536),u=new Uint8Array(raw.length);for(let j=0;j<raw.length;j++)u[j]=raw.charCodeAt(j);parts.push(u);}
  return new Blob(parts,{type:mime||'application/octet-stream'});
 }
 const olderKey=k=>/^(diario:mentor-local:|diario:mentor-voz:)/.test(k);
 async function exportar(){
  const uid=owner(),records=await all(),old=await legacy(),keys={},saved=[];
  if(typeof S!=='undefined'&&Array.isArray(S.books))saved.push(...S.books);
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(/^(diario-rs|diario-foco|diario:voz:|diario:tecnica-pratica:)/.test(k)))keys[k]=localStorage.getItem(k);}
  let bytes=0;
  const items=[];
  for(const row of records){
   bytes+=row.blob?.size||0;
   if(bytes>MAX_IMPORT)throw Error('Backup acima de 350 MB. Exporte os vídeos separadamente para evitar travar o iPhone.');
   items.push({tipo:row.tipo,id:row.id,meta:row.meta,mime:row.blob.type,b64:await encode(row.blob)});
  }
  const cached=[];
  for(const item of old){if(item.value instanceof Blob){bytes+=item.value.size;if(bytes>MAX_IMPORT)throw Error('Backup acima de 350 MB.');cached.push({key:item.key,mime:item.value.type,b64:await encode(item.value)});}else cached.push({key:item.key,value:item.value});}
  const backup={format:'diario-estudos-backup',version:1,exportadoEm:new Date().toISOString(),livros:saved,preferencias:keys,arquivos:items,cache:cached};
  const json=new Blob([JSON.stringify(backup)],{type:'application/json'}),url=URL.createObjectURL(json),a=document.createElement('a');
  a.href=url;a.download='estudos-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  return {arquivos:items.length,cache:cached.length,livros:saved.length};
 }
 async function importar(file){
  if(!file||file.size>MAX_IMPORT*1.4)throw Error('Backup muito grande ou inválido.');
  const data=JSON.parse(await file.text());
  if(data?.format!=='diario-estudos-backup'||data.version!==1||!Array.isArray(data.arquivos)||!Array.isArray(data.cache))throw Error('Formato de backup de Estudos inválido.');
  if(data.arquivos.length>2000||data.cache.length>10000)throw Error('Backup contém registros demais.');
  for(const r of data.arquivos){if(typeof r.tipo!=='string'||typeof r.id!=='string'||typeof r.b64!=='string'||r.b64.length>MAX_IMPORT*1.4)throw Error('Arquivo do backup inválido.');await put(r.tipo.slice(0,60),r.id.slice(0,255),decode(r.b64,r.mime),r.meta||{});}
  // A importação é aditiva: nunca exclui livros ou arquivos deste aparelho.
  if(Array.isArray(data.livros)&&typeof S!=='undefined'){
   const list=new Map((S.books||[]).map(b=>[b.id,b]));
   for(const b of data.livros.slice(0,2000))if(b&&typeof b.id==='string')list.set(b.id,b);
   S.books=[...list.values()];if(typeof persist==='function')persist();
  }
  if(data.preferencias&&typeof data.preferencias==='object'){
   for(const [k,v] of Object.entries(data.preferencias))if(/^(diario-rs|diario-foco|diario:voz:|diario:tecnica-pratica:)/.test(k)&&typeof v==='string'&&v.length<2000000)try{localStorage.setItem(k,v);}catch{}
  }
  if(typeof idb==='function')for(const item of data.cache){if(!item||typeof item.key!=='string'||!olderKey(item.key))continue;const key=item.key.replace(/^(diario:mentor-(?:local|voz):v\d+:)(.*)$/,(_whole,prefix,rest)=>prefix+(prefix.includes('mentor-voz')?rest.replace(/^[^:]+/,owner()):rest.replace(/^(aulas|texto):[^:]+/,(_v,kind)=>kind+':'+owner())));try{await idb('kv','put',item.b64?decode(item.b64,item.mime):item.value,key);}catch{}}
  return {arquivos:data.arquivos.length,livros:data.livros?.length||0};
 }
 window.EstudosLocal={put,get,all,exportar,importar,owner};
})();