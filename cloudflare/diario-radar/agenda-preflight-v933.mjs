/**
 * v933: verificações de autorização e conectividade para corte do pg_cron.
 * Nenhum diagnóstico publica, envia e-mail, apaga registros ou gera conteúdo.
 * Não armazena credenciais, JWT, respostas HTTP ou informações pessoais.
 */
import {validateAgendaV932} from './agenda-v932.mjs';
const PROBES=Object.freeze([
  {name:'rotina-cron',functionName:'rotina-cron',payload:{acao:'diagnostico_leve'}},
  {name:'email-semana',functionName:'email-semana',payload:{acao:'diagnostico'}},
  {name:'movimentos',functionName:'movimentos',payload:{acao:'lista'}}
]);
export const PROBES_V933=PROBES;
export function preflightDueV933(event,env){
 if(env.AGENDA_PREFLIGHT_ENABLED!=='1'||event.cron!=='* * * * *')return false;
 const d=new Date(event.scheduledTime);
 return Number.isFinite(d.getTime())&&d.getUTCMinutes()%15===0;
}
async function probe(entry,env){
 const url=env.SUPABASE_URL+'/functions/v1/'+entry.functionName;
 const r=await fetch(url,{method:'POST',headers:{
  apikey:env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type':'application/json',
  'x-cron-secret':env.CRON_SECRET
 },body:JSON.stringify(entry.payload),redirect:'manual',
  signal:AbortSignal.timeout(12000)});
 const status=r.status;
 try{await r.body?.cancel()}catch{}
 return status;
}
export async function preflightV933(event,env){
 if(!preflightDueV933(event,env))return {enabled:false};
 if(!validateAgendaV932(env))throw Error('Preflight sem bindings obrigatórios');
 const slot=new Date(event.scheduledTime).toISOString().slice(0,16);
 const changes=await env.HISTORICO.prepare(
  "INSERT OR IGNORE INTO agenda_preflight_v933(slot,component,state) VALUES (?,?,'running')"
 ).bind(slot,'all').run();
 if(changes.meta?.changes!==1)return {enabled:true,skipped:true};
 const statuses=await Promise.all(PROBES.map(async e=>{
  try{return {name:e.name,status:await probe(e,env)}}catch{return {name:e.name,status:0}}
 }));
 const ok=statuses.every(x=>x.status>=200&&x.status<300);
 for(const s of statuses)
  await env.HISTORICO.prepare(
   "INSERT OR REPLACE INTO agenda_preflight_v933(slot,component,state,http_status) VALUES (?,?,?,?)"
  ).bind(slot,s.name,s.status>=200&&s.status<300?'ok':'error',s.status).run();
 await env.HISTORICO.prepare(
  "UPDATE agenda_preflight_v933 SET state=?,http_status=? WHERE slot=? AND component='all'"
 ).bind(ok?'ok':'error',ok?200:503,slot).run();
 return {enabled:true,ok,statuses:statuses.map(x=>({name:x.name,ok:x.status>=200&&x.status<300}))};
}
