/**
 * v932 - Agenda institucional Cloudflare.
 * Replica os 16 horários UTC do pg_cron sem revelar segredos.
 * A execução só é ativada após a desativação coordenada dos jobs antigos.
 * Os serviços legados continuam consumindo Supabase até a migração funcional própria.
 */
import {rodaLocalV1062} from './funcoes-locais-v1062.mjs';
const HTTP_TIMEOUT=27000;
const iso=ms=>new Date(ms).toISOString();
const every=(m,n)=>m%n===0;
const days=d=>d>=1&&d<=5;
const job=(name,due,fn,body,cleanup)=>({name,due,fn,body,cleanup});
/* v943: notícia urgente a cada 5 min na janela de pregão BR (9h–18h BRT,
 * dias úteis), e a cada 15 min fora dela. Cron dos alertas operacionais é preservado. */
const NEWS_BRT_V943=new Intl.DateTimeFormat('en-US',{
 timeZone:'America/Sao_Paulo',weekday:'short',hour:'2-digit',hourCycle:'h23'
});
function janelaNoticiaRapidaV943(ms){
 const parts=NEWS_BRT_V943.formatToParts(new Date(ms));
 const weekday=parts.find(x=>x.type==='weekday')?.value;
 const hour=Number(parts.find(x=>x.type==='hour')?.value);
 return ['Mon','Tue','Wed','Thu','Fri'].includes(weekday)&&hour>=9&&hour<18;
}
export const JOBS_V932=Object.freeze([
 job('calendario-push-v724',x=>x.m===17&&every(x.h,2),'notificar',{acao:'atualizar_calendario'}),
 job('email-semana',x=>x.d===1&&x.h===0&&x.m===0,'email-semana',{acao:'rotina_semanal'}),
 job('insiders',x=>x.d===1&&x.h===13&&x.m===10,'insiders',{semAviso:true}),
 job('jornal-mesa',x=>days(x.d)&&x.m===30&&(x.h===10||x.h===21),'rotina-cron',{acao:'jornal_agendado'}),
 job('jornal-mesa-retentativa',x=>days(x.d)&&x.m===45&&(x.h===10||x.h===21),'rotina-cron',{acao:'jornal_agendado'}),
 job('jornal-mesa-retentativa-2',x=>days(x.d)&&x.m===0&&(x.h===11||x.h===22),'rotina-cron',{acao:'jornal_agendado'}),
 job('movimentos',x=>days(x.d)&&x.h>=12&&x.h<=21&&every(x.m,5),'movimentos',{}),
 job('movimentos-limpa',x=>x.h===3&&x.m===50,null,null,'movimentos'),
 job('noticias-urgentes-leve-v727',x=>every(x.m,x.noticiasRapidas?5:15),'notificar',{acao:'noticias_urgentes'}),
 job('notificar-leve-v724',x=>every(x.m,5),'notificar',{acao:'tick_leve'}),
 job('push-log-limpa',x=>x.h===3&&x.m===0,null,null,'push_log'),
 job('resumo-tick',x=>days(x.d)&&x.m===0&&[12,16,20].includes(x.h),'resumo',{acao:'tick'}),
 job('rotina-almoco',x=>days(x.d)&&x.h===14&&x.m===50,'rotina-cron',{acao:'matinal_leve',hm:'11:50'}),
 job('rotina-fechamento',x=>days(x.d)&&x.h===20&&x.m===45,'rotina-cron',{acao:'fechamento'}),
 job('rotina-matinal',x=>days(x.d)&&x.h===9&&x.m===50,'rotina-cron',{acao:'matinal_leve'}),
 job('rotina-tarde',x=>days(x.d)&&x.h===21&&x.m===20,'rotina-cron',{acao:'matinal_leve',hm:'18:20'})
]);
export function jobsAtV932(ms){
 if(!Number.isSafeInteger(ms)||ms<0)return [];
 const d=new Date(ms);
 const x={m:d.getUTCMinutes(),h:d.getUTCHours(),d:d.getUTCDay(),noticiasRapidas:janelaNoticiaRapidaV943(ms)};
 return JOBS_V932.filter(j=>j.due(x));
}
export function validateAgendaV932(env){
 // Impede SSRF e exposição inadvertida de credenciais em outro domínio.
 const u=String(env.SUPABASE_URL||'');
 return u==='https://vdzwydizostutukppcsj.supabase.co'&&
  typeof env.SUPABASE_SERVICE_ROLE_KEY==='string'&&env.SUPABASE_SERVICE_ROLE_KEY.length>=30&&
  typeof env.CRON_SECRET==='string'&&env.CRON_SECRET.length>=16&&!!env.HISTORICO;
}
function headers(env){
 const key=env.SUPABASE_SERVICE_ROLE_KEY;
 return {'Content-Type':'application/json','Cache-Control':'no-store',
  apikey:key,Authorization:'Bearer '+key,'x-cron-secret':env.CRON_SECRET,
  Prefer:'return=minimal'};
}
async function invoke(j,ms,env){
 const base=env.SUPABASE_URL;
 const h=headers(env);
 let target='',init={method:'POST',headers:h,redirect:'manual',signal:AbortSignal.timeout(HTTP_TIMEOUT)};
 if(j.cleanup==='movimentos'){
  const date=new Date(ms-60*86400000).toISOString().slice(0,10);
  target=base+'/rest/v1/movimentos?dia=lt.'+date;init.method='DELETE';
 }else if(j.cleanup==='push_log'){
  target=base+'/rest/v1/push_log?em=lt.'+encodeURIComponent(iso(ms-3*86400000));init.method='DELETE';
 }else{
  target=base+'/functions/v1/'+j.fn;
  init.body=JSON.stringify(j.body||{});
  // v1062: roda na Cloudflare (invocação própria via SELF); o Supabase fica só como reserva.
  if(rodaLocalV1062(j.fn,env)){
   try{
    const rl=await env.SELF.fetch('https://diario-radar.interno/v1/fn-local/'+j.fn,{method:'POST',headers:h,body:init.body,signal:AbortSignal.timeout(HTTP_TIMEOUT)});
    const st=rl.status;
    try{await rl.body?.cancel()}catch{}
    if(rl.ok)return st;
   }catch{}
  }
 }
 const r=await fetch(target,init);
 // Não registra mensagens privadas de erro, somente código HTTP.
 const status=r.status;
 try{await r.body?.cancel()}catch{}
 if(!r.ok)throw Object.assign(Error('HTTP '+status),{status});
 return status;
}
async function one(j,ms,env){
 const slot=iso(ms).slice(0,16);
 // Lock persistente antes de disparar, para impedir duplicidade de notificações.
 const lock=await env.HISTORICO.prepare("INSERT OR IGNORE INTO agenda_runs_v932(job,slot,state) VALUES (?,?, 'running')").bind(j.name,slot).run();
 if(lock.meta?.changes!==1)return {job:j.name,skipped:true};
 const started=Date.now();
 let state='ok',status=200;
 try{status=await invoke(j,ms,env)}
 catch(err){state='error';status=Number(err?.status)||0}
 await env.HISTORICO.prepare("UPDATE agenda_runs_v932 SET state=?,http_status=?,duration_ms=?,finished_at=? WHERE job=? AND slot=?")
  .bind(state,status,Math.max(0,Date.now()-started),iso(Date.now()),j.name,slot).run();
 return {job:j.name,state,status};
}
export async function runAgendaV932(event,env){
 if(event.cron!=='* * * * *'||env.AGENDA_CUTOVER_ENABLED!=='1')return {enabled:false,results:[]};
 if(!validateAgendaV932(env))throw Error('Agenda v932 sem credenciais vinculadas');
 const ms=event.scheduledTime,items=jobsAtV932(ms);
 const results=await Promise.all(items.map(x=>one(x,ms,env)));
 if(results.some(x=>x.state==='error'))throw Error('Uma ou mais rotinas falharam, verifique agenda_runs_v932');
 return {enabled:true,results};
}
