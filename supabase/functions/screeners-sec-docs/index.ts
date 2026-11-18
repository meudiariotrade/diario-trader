// v771 — documentos SEC via Cloudflare, somente metadados leves e persistência em lote.
// Autenticação igual aos crons existentes; jamais consulta Logs/Analytics do Supabase.
const SB=Deno.env.get('SUPABASE_URL')||'';
const KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const HEAD={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
const EDGE='https://diario-screeners-quant.lucianosilva43567.workers.dev';
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function rpc(fn:string,args:Record<string,unknown>){
 const result=await fetch(SB+'/rest/v1/rpc/'+fn,{
  method:'POST',headers:HEAD,body:JSON.stringify(args),signal:AbortSignal.timeout(14000)});
 if(!result.ok)throw Error('RPC '+fn+' HTTP '+result.status);
 return await result.json().catch(()=>null);
}
async function authorized(req:Request){
 const got=req.headers.get('x-cron-secret')||'';
 if(!got||!SB||!KEY)return false;
 const token=await rpc('diario_agendamento_chave',{}).catch(()=>null);
 if(typeof token!=='string'||token.length!==got.length)return false;
 let mismatch=0;for(let i=0;i<got.length;i++)mismatch|=got.charCodeAt(i)^token.charCodeAt(i);
 return mismatch===0;
}
function isDoc(x:any,cik:string){
 return x?.ok===true&&x.cik===cik&&
  ['10-Q','10-K','10-Q/A','10-K/A','20-F','40-F','20-F/A','40-F/A'].includes(x.form)&&
  /^\d{4}-\d\d-\d\d$/.test(x.reportDate)&&/^\d{4}-\d\d-\d\d$/.test(x.filingDate)&&
  /^\d{10}-\d{2}-\d{6}$/.test(x.accessionNumber)&&
  typeof x.documentUrl==='string'&&x.documentUrl.startsWith('https://www.sec.gov/Archives/edgar/data/')&&
  x.reportDate<=x.filingDate&&x.filingDate<=new Date().toISOString().slice(0,10);
}
async function collect(limit:number){
 // RPC retorna CIKs distintos: classes A/B do mesmo emissor compartilham uma só chamada HTTP.
 const pending=await rpc('quant_sec_docs_pendentes',{p_limit:limit});
 const accepted:any[]=[],missing:any[]=[],retryRows:any[]=[],errors:string[]=[];
 let fetched=0,blocked=false,last=0;
 for(const row of Array.isArray(pending)?pending:[]){
  const cik=String(row.cik||'');
  if(!/^\d{10}$/.test(cik))continue;
  await delay(Math.max(0,120-(Date.now()-last)));last=Date.now();
  try{
   const r=await fetch(EDGE+'/v1/sec-documento?cik='+cik,{
    headers:{Accept:'application/json'},signal:AbortSignal.timeout(14000)});
   const data=await r.json().catch(()=>({}));
   if(r.status===503&&(data.code===403||data.code===429)){
    blocked=true;retryRows.push({cik,motivo:'SEC HTTP '+data.code+'; próxima tentativa com backoff'});errors.push('SEC bloqueou/limitou acesso; lote interrompido sem repetição');break;
   }
   if(r.status===404&&data.reason){
    missing.push({cik,motivo:'SEC Submissions sem 10-K/10-Q/20-F/40-F e período comprovados'});
    continue;
   }
   if(!r.ok){retryRows.push({cik,motivo:'Cloudflare/SEC HTTP '+r.status});errors.push(String(row.ticker)+': Cloudflare HTTP '+r.status);continue;}
   if(!isDoc(data,cik)){retryRows.push({cik,motivo:'Metadados SEC inconsistentes; não promover sem prova'});errors.push(String(row.ticker)+': metadados inconsistentes');continue;}
   fetched++;
   accepted.push({cik,competencia:data.reportDate,formulario:data.form,
    documento_id:data.accessionNumber,documento_url:data.documentUrl,publicado_em:data.filingDate});
  }catch(e){retryRows.push({cik,motivo:'SEC indisponível; conferir em nova rodada'});errors.push(String(row.ticker)+': indisponível '+String(e).slice(0,55));}
 }
 const applied=accepted.length?Number(await rpc('quant_sec_docs_bulk_upsert',{p_rows:accepted}))||0:0;
 const paused=missing.length?Number(await rpc('quant_sec_docs_sem_prova',{p_rows:missing}))||0:0;
 const cooldown=retryRows.length?Number(await rpc('quant_sec_docs_retry_patch',{p_rows:retryRows}))||0:0;
 // Somente quando a fila termina, atualizar snapshot público uma vez.
 const finished=Array.isArray(pending)&&pending.length<limit&&!blocked&&!errors.length;
 if(finished&&applied>0)await rpc('quant_v2_snapshot_refresh',{p_market:'US'});
 // Encerrar cron finito ao concluir; em HTTP 403/429 pausar sem insistir contra a SEC.
 const cadence=await rpc('quant_sec_docs_cadencia',{p_bloqueio:blocked}).catch(()=>null);
 return {selecionados:Array.isArray(pending)?pending.length:0,consultados:fetched,
  emissores_gravados:accepted.length,linhas_atualizadas:applied,sem_formulario:paused,
  terminado:finished,sec_bloqueada:blocked,linhas_em_cooldown:cooldown,cadencia:cadence,erros:errors.slice(0,5),
  fonte:'SEC submissions via Cloudflare; somente prova documental'};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return response({error:'Somente POST'},405);
 if(!await authorized(req))return response({error:'Não autorizado'},401);
 try{
  const data=await req.json().catch(()=>({}));
  if(data.acao!=='coletar')return response({error:'Ação desconhecida'},400);
  const limit=Math.max(1,Math.min(16,Math.floor(Number(data.limite)||16)));
  return response(await collect(limit));
 }catch(e){return response({error:'Coleta documental indisponível',reason:String(e).slice(0,100)},503);}
});
