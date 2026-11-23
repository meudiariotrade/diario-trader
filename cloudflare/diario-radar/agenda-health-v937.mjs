/**
 * v937 - Saúde agregada dos cron jobs ativos no Cloudflare D1.
 * Não lê tabelas privadas, não consulta Logs/Analytics Supabase e não
 * expõe payload, token, endpoint, endereço ou identidade de usuário.
 */
const TTL_DAYS=30,HOURLY=3600000;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function agendaHealthV937(env,now=Date.now()){
 if(!env.HISTORICO)return Response.json({ok:false,erro:'D1 indisponível'},{status:503,headers});
 const start=new Date(now-24*HOURLY).toISOString().slice(0,16);
 let rows;
 try{
  const r=await env.HISTORICO.prepare(
   "SELECT job, SUM(CASE WHEN state='ok' THEN 1 ELSE 0 END) AS ok, "+
   "SUM(CASE WHEN state='error' THEN 1 ELSE 0 END) AS error, "+
   "SUM(CASE WHEN state='running' THEN 1 ELSE 0 END) AS running, "+
   "MAX(slot) AS ultimo_slot FROM agenda_runs_v932 WHERE slot>=? GROUP BY job ORDER BY job"
  ).bind(start).all();
  rows=(r.results||[]);
 }catch{return Response.json({ok:false,erro:'Não foi possível ler os estados da agenda'},{status:503,headers})}
 const summary={ok:0,error:0,running:0};
 const jobs=rows.map(x=>{
  const v={job:String(x.job),ok:Math.max(0,Number(x.ok)||0),
   error:Math.max(0,Number(x.error)||0),running:Math.max(0,Number(x.running)||0),
   ultimo_slot:String(x.ultimo_slot||'')};
  summary.ok+=v.ok;summary.error+=v.error;summary.running+=v.running;
  return v;
 });
 return Response.json({ok:true,enabled:env.AGENDA_CUTOVER_ENABLED==='1',
  service:'agenda-v937',timezone:'UTC',quantidade_jobs:16,janela:'24h',
  total:summary,estados:jobs,
  observacao:'HTTP 200 confirma a chamada do serviço, não a entrega de Web Push ou e-mail'},
  {headers});
}
export async function limparEstadosV937(event,env){
 if(event.cron!=='* * * * *'||env.AGENDA_CUTOVER_ENABLED!=='1'||!env.HISTORICO)
  return {executou:false};
 const d=new Date(event.scheduledTime);
 if(d.getUTCHours()!==3||d.getUTCMinutes()!==7)return {executou:false};
 // Somente histórico operacional D1 mais antigo que 30 dias; nunca documentos pessoais.
 const before=new Date(event.scheduledTime-TTL_DAYS*86400000).toISOString().slice(0,16);
 const r=await env.HISTORICO.prepare('DELETE FROM agenda_runs_v932 WHERE slot < ?').bind(before).run();
 const x=await env.HISTORICO.prepare('DELETE FROM agenda_preflight_v933 WHERE slot < ?').bind(before).run();
 return {executou:true,corte:before,removidos:(r.meta?.changes||0)+(x.meta?.changes||0)};
}
