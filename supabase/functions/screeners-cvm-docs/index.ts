// v772 — reconcile ticker ↔ CNPJ only from CVM official issuer index.
// Edge Function reads compact Cloudflare public cache once; DB receives only bulk proof.
const SB=Deno.env.get('SUPABASE_URL')||'',KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const HEAD={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
const EDGE='https://diario-screeners-quant.lucianosilva43567.workers.dev';
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function rpc(fn:string,args:Record<string,unknown>){
 const r=await fetch(SB+'/rest/v1/rpc/'+fn,{method:'POST',headers:HEAD,body:JSON.stringify(args),signal:AbortSignal.timeout(13000)});
 if(!r.ok)throw Error('RPC '+fn+' HTTP '+r.status);
 return r.json().catch(()=>null);
}
async function authorized(req:Request){
 const got=req.headers.get('x-cron-secret')||'';
 if(!got||!SB||!KEY)return false;
 const expected=await rpc('diario_agendamento_chave',{}).catch(()=>null);
 if(typeof expected!=='string'||expected.length!==got.length)return false;
 let mismatch=0;for(let i=0;i<got.length;i++)mismatch|=got.charCodeAt(i)^expected.charCodeAt(i);
 return mismatch===0;
}
const norm=(n:unknown)=>String(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
 .replace(/\bS\s*[.\/-]?\s*A\b\.?/g,' ').replace(/\bBCO\b/g,'BANCO').replace(/\bCIA\b/g,'COMPANHIA')
 .replace(/\b(DO|DA|DE|DOS|DAS)\b/g,' ').replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const iso=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||'')),today=()=>new Date().toISOString().slice(0,10);
async function run(){
 const pending=await rpc('quant_cvm_pendentes',{p_limit:24});
 if(!Array.isArray(pending)||!pending.length)return {pending:0,gravados:0,fonte:'CVM sem novos pendentes'};
 const r=await fetch(EDGE+'/v1/cvm-provas',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Espelho CVM na Cloudflare HTTP '+r.status);
 const src=await r.json();
 if(src?.ok!==true||!Array.isArray(src.emissores)||!Array.isArray(src.documentos)||src.emissores.length<100)throw Error('Espelho sem prova');
 const normalized=new Map<string,Set<string>>();
 for(const issuer of src.emissores){
  const id=String(issuer.cnpj||'');
  if(!/^\d{14}$/.test(id)||!Array.isArray(issuer.nomes))continue;
  for(const name of issuer.nomes){
   const key=norm(name);if(key.length<3)continue;
   const group=normalized.get(key)||new Set<string>();group.add(id);normalized.set(key,group);
  }
 }
 const docs=new Map(src.documentos.filter((d:any)=>/^\d{14}$/.test(String(d.cnpj||'')) &&
  ['ITR','DFP'].includes(d.formulario) && /^\d{1,18}$/.test(String(d.documento_id||'')) &&
  iso(d.competencia)&&iso(d.publicado_em)&&d.competencia<=d.publicado_em&&d.publicado_em<=today()&&
  String(d.documento_url||'').startsWith('https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/'))
  .map((d:any)=>[String(d.cnpj),d]));
 const patches:any[]=[],notFound:string[]=[],ambiguous:string[]=[];
 for(const row of pending){
  const key=norm(row.empresa),exact=normalized.get(key);
  const found=exact||new Set<string>();
  // Only an exact normalized name is an identity assertion; ambiguous remains pending.
  if(found.size!==1){(found.size?ambiguous:notFound).push(String(row.ticker));continue;}
  const id=[...found][0],d:any=docs.get(id);
  if(!d){notFound.push(String(row.ticker));continue;}
  patches.push({ticker:row.ticker,cnpj:id,competencia:d.competencia,
   formulario:d.formulario,documento_id:String(d.documento_id),documento_url:d.documento_url,
   publicado_em:d.publicado_em,linhagem:typeof d.linhagem==='object'&&d.linhagem?d.linhagem:{}});
 }
 const applied=patches.length?Number(await rpc('quant_cvm_documentos_bulk',{p_rows:patches}))||0:0;
 if(applied>0)await rpc('quant_v2_snapshot_refresh',{p_market:'BR'}).catch(()=>null);
 return {pending:pending.length,provados:patches.length,gravados:applied,
  sem_match_exato:notFound,ambiguos:ambiguous,
  proveniencia:'CNPJ cadastral oficial CVM; protocolo ITR/DFP validado; sem supor identidade'};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return respond({error:'Método não permitido'},405);
 if(!await authorized(req))return respond({error:'Não autorizado'},401);
 try{const body=await req.json().catch(()=>({}));
  if(body.acao!=='reconciliar')return respond({error:'Ação inválida'},400);
  return respond(await run());
 }catch(e){return respond({error:'Reconciliacao CVM indisponivel',reason:String(e).slice(0,160)},503);}
});
