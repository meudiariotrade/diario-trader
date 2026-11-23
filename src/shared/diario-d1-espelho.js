/* v900 — espelho assíncrono D1. Não altera origem principal até homologação.
 * Não faz polling, não guarda JWT e não envia dados privados ao GitHub.
 */
(function(){
 'use strict';
 const endpoint='https://diario-sync.lucianosilva43567.workers.dev/v1/diario';
 const cache=new Map();
 async function save(uid,token,data){
  if(!uid||!token||!data||typeof data!=='object')return false;
  const mt=Number(data.mt||0);
  if(!Number.isSafeInteger(mt)||mt<0)return false;
  let state=cache.get(uid);
  if(!state){state={last:-1,revision:null,busy:false};cache.set(uid,state);}
  if(state.busy||state.last>=mt)return false;
  state.busy=true;
  try{
   for(let attempt=0;attempt<3;attempt++){
    const body=JSON.stringify({expected_revision:state.revision,data});
    if(new TextEncoder().encode(body).length>1400000)return false;
    const r=await fetch(endpoint,{method:'PUT',credentials:'omit',mode:'cors',cache:'no-store',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body,signal:AbortSignal.timeout(14000)});
    const reply=await r.json().catch(()=>({}));
    if(r.ok&&reply.saved){state.revision=reply.revision;state.last=mt;return true;}
    if(r.status!==409)return false;
    state.revision=reply.revision;
    if(Number(reply.source_mt)>=mt){state.last=mt;return true;}
   }
  }catch(_){/* a falha não afeta a sincronização existente */}
  finally{state.busy=false;}
  return false;
 }
 window.DiarioReplicaD1=Object.freeze({fase:'espelho-v900',save});
})();