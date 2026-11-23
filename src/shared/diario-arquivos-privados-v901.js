/* v901: arquivos privados em KV, com autenticação Supabase Auth.
 * Livros, vídeos e PDFs grandes continuam no IndexedDB/EstudosLocal, com backup.
 * Não envia dados privados ao GitHub e não utiliza R2 nem Storage Supabase.
 */
(function(){
 'use strict';
 const ENDPOINT='https://diario-sync.lucianosilva43567.workers.dev/v1/files';
 let migrationBusy=false,doneOwner=null;
 const objectPath=(bucket,key)=>ENDPOINT+'/'+encodeURIComponent(bucket)+'/'+String(key).split('/').map(encodeURIComponent).join('/');
 async function call(url,options,token){
  if(!token||token.length<30)throw Error('Entre na conta para acessar os arquivos privados.');
  const headers=new Headers(options?.headers||{});
  headers.set('Authorization','Bearer '+token);
  const r=await fetch(url,{...options,headers,credentials:'omit',mode:'cors',cache:'no-store',signal:AbortSignal.timeout(25000)});
  if(!r.ok){const body=await r.json().catch(()=>({}));const e=new Error(body.error||'Cloudflare HTTP '+r.status);e.status=r.status;throw e;}
  return r;
 }
 async function put(bucket,key,blob,token){
  if(!(blob instanceof Blob)||!blob.size)throw Error('Arquivo vazio.');
  if(blob.size>8*1024*1024)throw Error('Arquivo grande: salve no IndexedDB e exporte o backup de Estudos.');
  return (await call(objectPath(bucket,key),{method:'PUT',headers:{'Content-Type':blob.type||'application/octet-stream'},body:blob},token)).json();
 }
 async function get(bucket,key,token){
  const r=await call(objectPath(bucket,key),{method:'GET'},token);
  return r.blob();
 }
 async function importOne(bucket,key,token){
  return (await call(ENDPOINT+'/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bucket,key})},token)).json();
 }
 async function manifest(token,status='pending',limit=20){
  const url=ENDPOINT+'/manifest?status='+encodeURIComponent(status)+'&limit='+Math.max(1,Math.min(Number(limit)||20,60));
  return (await (await call(url,{method:'GET'},token)).json()).items||[];
 }
 async function status(token){return (await (await call(ENDPOINT+'/status',{method:'GET'},token)).json()).status||[];}
 async function migrateAll(uid,token){
  if(!uid||!token||migrationBusy||doneOwner===uid||document.hidden||!navigator.onLine)return;
  migrationBusy=true;
  try{
   let succeeded=0;
   for(let round=0;round<8;round++){
    const list=await manifest(token,'pending',20);
    if(!list.length){doneOwner=uid;break;}
    let ok=0;
    for(let index=0;index<list.length;index+=3){
     const attempts=await Promise.allSettled(list.slice(index,index+3).map(item=>importOne(item.bucket,item.object_key,token)));
     ok+=attempts.filter(r=>r.status==='fulfilled').length;
    }
    succeeded+=ok;
    if(!ok)break; // Não repetir erros em loop nem exceder cotas gratuitas.
   }
   return succeeded;
  }catch(_){return 0;}
  finally{migrationBusy=false;}
 }
 window.DiarioArquivos=Object.freeze({put,get,importOne,manifest,status,migrateAll,limiteNuvem:8*1024*1024});
})();