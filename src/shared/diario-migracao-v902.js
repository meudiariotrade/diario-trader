/* v902: importação privada e retomável de tabelas antigas ao D1.
 * Só roda com sessão válida, não é polling e não altera registros do Supabase.
 */
(function(){
 'use strict';
 const url='https://diario-sync.lucianosilva43567.workers.dev/v1/migrate';
 let running=false;const completed=new Set(),attempted=new Set();
 async function request(path,token,opts={}){
  if(!token||token.length<30)throw Error('Sessão necessária.');
  const h=new Headers(opts.headers||{});h.set('Authorization','Bearer '+token);
  const res=await fetch(url+path,{...opts,headers:h,mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)});
  if(!res.ok){const body=await res.json().catch(()=>({}));const err=new Error(body.error||'Migração HTTP '+res.status);err.status=res.status;throw err;}
  return res.json();
 }
 const status=token=>request('/status',token);
 const step=(collection,token)=>request('/step',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({collection})});
 async function run(uid,token,active=()=>true){
  if(running||!uid||!token||completed.has(uid)||attempted.has(uid)||document.hidden||!navigator.onLine)return;
  attempted.add(uid);running=true;
  const blocked=[],budget=250;
  let steps=0,stored=0;
  try{
   const data=await status(token);
   for(const item of data.collections||[]){
    if(item.finished)continue;
    while(steps<budget&&!document.hidden&&navigator.onLine&&active()){
     try{
      const result=await step(item.name,token);
      stored+=Number(result.rows)||0;steps++;
      if(result.finished)break;
     }catch(err){
      blocked.push({name:item.name,reason:String(err.message||err).slice(0,60)});
      break;
     }
    }
    if(steps>=budget||document.hidden||!navigator.onLine||!active())break;
   }
   const after=await status(token).catch(()=>null);
   if(after?.collections?.every(x=>x.finished))completed.add(uid);
   return {steps,stored,blocked:blocked.map(x=>x.name),done:completed.has(uid),collections:after?.collections||[]};
  }finally{running=false;}
 }
 window.DiarioMigracaoD1=Object.freeze({status,step,run,versao:902});
})();