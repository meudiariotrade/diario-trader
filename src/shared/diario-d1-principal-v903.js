/* v903 — troca segura do Diário principal para Cloudflare D1.
 * Só ativa em uma sessão após confirmar que o D1 contém versão >= Supabase legado.
 * Não apaga o Supabase e não usa service_role nem rotas públicas de dados.
 */
(function(){
 'use strict';
 const API='https://diario-sync.lucianosilva43567.workers.dev/v1/diario';
 const ativos=new Set(),verificando=new Map();
 async function call(token,method='GET',url=API,body){
  if(!token||token.length<30)throw Error('Login necessário para sincronização.');
  const opts={method,credentials:'omit',cache:'no-store',mode:'cors',redirect:'error',
    headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(22000)};
  if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  const response=await fetch(url,opts);
  const data=await response.json().catch(()=>({}));
  if(!response.ok&&response.status!==409){const e=new Error(data.error||'D1 indisponível, HTTP '+response.status);e.status=response.status;throw e;}
  return {status:response.status,data};
 }
 async function get(token,meta=false){return (await call(token,'GET',API+(meta?'?meta=1':''))).data;}
 async function getMetaAsRows(token){
  const data=await get(token,true);
  return data.exists?[{revision:data.revision}]:[];
 }
 async function getRows(token){
  const data=await get(token);
  return data.exists?[{data:data.data,revision:data.revision}]:[];
 }
 async function save(token,expected_revision,data){
  const response=await call(token,'PUT',API,{expected_revision,data});
  if(response.status!==409)return response.data;
  const current=await get(token);
  return {saved:false,revision:current.revision??null,data:current.data||null};
 }
 async function prepare(uid,token,readLegacy){
  if(!uid||!token)return false;
  if(ativos.has(uid))return true;
  if(verificando.has(uid))return verificando.get(uid);
  const job=(async()=>{
   const [cloud,oldRows]=await Promise.all([get(token),readLegacy()]);
   if(!cloud?.exists||!cloud.data||!Number.isFinite(Number(cloud.source_mt)))return false;
   const legacy=Array.isArray(oldRows)?oldRows[0]?.data:null;
   const oldTime=Number(legacy?.mt||0);
   if(legacy&&(!Number.isFinite(oldTime)||Number(cloud.source_mt)<oldTime))return false;
   // A origem antiga precisa permanecer intacta para recuperação em dispositivos antigos.
   ativos.add(uid);
   return true;
  })().catch(()=>false).finally(()=>verificando.delete(uid));
  verificando.set(uid,job);
  return job;
 }
 const BACKUPS='https://diario-sync.lucianosilva43567.workers.dev/v1/backups';
 const backupDia=dia=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(dia)))throw Error('Dia inválido.');return String(dia);};
 async function backupList(token){return (await call(token,'GET',BACKUPS)).data.items||[];}
 async function backupGet(token,dia){return (await call(token,'GET',BACKUPS+'/'+backupDia(dia))).data.data||null;}
 async function backupSave(token,dia,data){return (await call(token,'PUT',BACKUPS+'/'+backupDia(dia),{data})).data;}
 const active=uid=>ativos.has(uid);
 window.DiarioD1Principal=Object.freeze({active,prepare,get,getRows,getMetaAsRows,save,backupList,backupGet,backupSave,versao:906});
})();