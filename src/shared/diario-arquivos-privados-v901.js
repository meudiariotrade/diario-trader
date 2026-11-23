/* v906: migração privada observável, com lotes pequenos e sem polling.
 * Arquivos no Supabase permanecem intactos; nunca enviar fotos ou livros ao GitHub.
 */
(function(){
 'use strict';
 const ENDPOINT='https://diario-sync.lucianosilva43567.workers.dev/v1/files';
 let busy=false,doneOwner=null,proximaTentativa=0,ultimo={state:'idle',ready:0,pending:0,imported:0,failed:0,errors:[]};
 const objectPath=(bucket,key)=>ENDPOINT+'/'+encodeURIComponent(bucket)+'/'+String(key).split('/').map(encodeURIComponent).join('/');
 function atualiza(partial){
   ultimo=Object.freeze({...ultimo,...partial});
   try{window.dispatchEvent(new CustomEvent('diario:arquivos-migracao',{detail:ultimo}));}catch(_){}
   return ultimo;
 }
 function resumo(){
   if(ultimo.state==='idle')return 'Arquivos privados: verificação pendente';
   if(ultimo.state==='running')return 'Arquivos Cloudflare: '+ultimo.ready+' prontos, '+ultimo.pending+' pendentes (migrando)';
   if(ultimo.state==='done')return 'Arquivos Cloudflare: '+ultimo.ready+' prontos, nenhum pendente';
   const code=ultimo.errors?.[0]||'verificar acesso';
   return 'Arquivos Cloudflare: '+ultimo.ready+' prontos, '+ultimo.pending+' pendentes · '+code;
 }
 async function call(url,options,token){
   if(!token||token.length<30)throw Error('Entre na conta para acessar os arquivos privados.');
   const headers=new Headers(options?.headers||{});headers.set('Authorization','Bearer '+token);
   const r=await fetch(url,{...options,headers,credentials:'omit',mode:'cors',cache:'no-store',signal:AbortSignal.timeout(60000)});
   if(!r.ok){const body=await r.json().catch(()=>({}));const e=new Error(body.error||'Cloudflare HTTP '+r.status);e.status=r.status;throw e;}
   return r;
 }
 async function put(bucket,key,blob,token){
   if(!(blob instanceof Blob)||!blob.size)throw Error('Arquivo vazio.');
   if(blob.size>8*1024*1024)throw Error('Arquivo grande: salve no IndexedDB e exporte o backup de Estudos.');
   return (await call(objectPath(bucket,key),{method:'PUT',headers:{'Content-Type':blob.type||'application/octet-stream'},body:blob},token)).json();
 }
 async function get(bucket,key,token){return (await call(objectPath(bucket,key),{method:'GET'},token)).blob();}
 async function importOne(bucket,key,token){
   return (await call(ENDPOINT+'/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bucket,key})},token)).json();
 }
 async function manifest(token,status='pending',limit=60){
   const u=ENDPOINT+'/manifest?status='+encodeURIComponent(status)+'&limit='+Math.max(1,Math.min(Number(limit)||60,60));
   return (await (await call(u,{method:'GET'},token)).json()).items||[];
 }
 async function status(token){return (await (await call(ENDPOINT+'/status',{method:'GET'},token)).json()).status||[];}
 const counts=rows=>({ready:rows.filter(x=>x.status==='ready').reduce((n,x)=>n+Number(x.n||0),0),
                      pending:rows.filter(x=>x.status==='pending').reduce((n,x)=>n+Number(x.n||0),0)});
 async function batch(items,token){
   return (await (await call(ENDPOINT+'/import-batch',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({items:items.map(x=>({bucket:x.bucket,key:x.object_key}))})
   },token)).json()).results||[];
 }
 async function migrateAll(uid,token,{force=false}={}){
   if(!uid||!token||busy||doneOwner===uid||document.hidden||!navigator.onLine||
      (!force&&Date.now()<proximaTentativa))return ultimo;
   busy=true;let imported=0,failed=0,errors=[];
   try{
     const before=counts(await status(token));
     atualiza({...before,state:before.pending?'running':'done',imported:0,failed:0,errors:[]});
     if(!before.pending){doneOwner=uid;return ultimo;}
     const list=await manifest(token,'pending',60);
     if(!list.length)throw Error('manifesto_pendente_vazio');
     for(let i=0;i<list.length;i+=4){
       if(document.hidden||!navigator.onLine)break;
       const group=list.slice(i,i+4);
       let attempts;
       try{attempts=await batch(group,token);}
       catch(err){errors.push('lote HTTP '+(err.status||'indisponível'));failed+=group.length;break;}
       if(attempts.length!==group.length){errors.push('resposta_lote_incompleta');failed+=group.length;break;}
       for(const result of attempts){
         if(result.ok)imported++;
         else {failed++;const reason=result.code+(result.upstream_http?' HTTP '+result.upstream_http:'');if(!errors.includes(reason))errors.push(reason);}
       }
       atualiza({state:'running',ready:before.ready+imported,pending:Math.max(0,before.pending-imported),imported,failed,errors:errors.slice(0,3)});
     }
     const after=counts(await status(token));
     if(!after.pending)doneOwner=uid;
     else if(failed)proximaTentativa=Date.now()+5*60000;
     return atualiza({...after,state:after.pending?'error':'done',imported,failed,errors:errors.slice(0,3)});
   }catch(err){
     proximaTentativa=Date.now()+5*60000;
     return atualiza({state:'error',imported,failed,errors:[('falha HTTP '+(err.status||String(err.message||err))).slice(0,90)]});
   }finally{busy=false;}
 }
 window.DiarioArquivos=Object.freeze({put,get,importOne,manifest,status,migrateAll,resultado:()=>ultimo,resumo,limiteNuvem:8*1024*1024,versao:906});
})();