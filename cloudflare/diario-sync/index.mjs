/* v900: snapshots privados. Sem dados de mercado, service-role ou cookies. */
const LIMIT=1400000;
function out(data,status,origin,env){
 const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin===env.ALLOWED_ORIGIN)h['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(data),{status:status||200,headers:h});
}
async function owner(req,env){
 const token=/^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')||'')?.[1];
 if(!token||token.length<30||token.length>4096)return null;
 if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)return null;
 const url=new URL(env.SUPABASE_URL);
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))return null;
 const r=await fetch(url.origin+'/auth/v1/user',{headers:{Authorization:'Bearer '+token,apikey:env.SUPABASE_ANON_KEY},redirect:'error',signal:AbortSignal.timeout(7000)}).catch(()=>null);
 if(!r?.ok)return null;
 const j=await r.json().catch(()=>null);
 return /^[0-9a-f-]{36}$/i.test(j?.id||'')?j.id:null;
}
async function row(db,uid,meta){
 return db.prepare(meta?'SELECT revision,source_mt FROM diario_snapshots WHERE user_id=?':'SELECT revision,source_mt,payload,updated_at FROM diario_snapshots WHERE user_id=?').bind(uid).first();
}

/* v901: arquivos privados no KV gratuito. A chave sempre inclui o UID autenticado. */
const MAX_ARQUIVO=8*1024*1024;
const MAX_POR_CONTA=100*1024*1024;
const BUCKETS=new Set(['fotos','backups','aulas-figuras','notas','planilhas','aulas-visuais','aulas-audio','aulas-videos','livros']);
function fileParts(url){
 const p=url.pathname.slice('/v1/files/'.length),split=p.indexOf('/');
 if(split<1)return null;
 const bucket=p.slice(0,split),key=decodeURIComponent(p.slice(split+1));
 if(!BUCKETS.has(bucket)||!key||key.length>512||key.includes('\\')||key.includes('\0')||key.split('/').some(x=>!x||x==='.'||x==='..'))return null;
 return {bucket,key};
}
const kvKey=(uid,bucket,key)=>uid+':'+bucket+':'+key;
const legacyUrl=(env,bucket,key)=>new URL(env.SUPABASE_URL).origin+'/storage/v1/object/authenticated/'+encodeURIComponent(bucket)+'/'+key.split('/').map(encodeURIComponent).join('/');
const safeType=t=>/^(image\/(?:jpeg|png|webp|gif)|application\/(?:pdf|json|zip|octet-stream)|audio\/[\w.+-]+|video\/[\w.+-]+|text\/plain)$/i.test(t||'')?t:'application/octet-stream';
async function atualizaArquivo(db,uid,bucket,key,mime,size,source){
 await db.prepare("INSERT INTO private_files(owner,bucket,object_key,content_type,size_bytes,status,source,updated_at) VALUES (?,?,?,?,?,'ready',?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(owner,bucket,object_key) DO UPDATE SET content_type=excluded.content_type,size_bytes=excluded.size_bytes,status='ready',source=excluded.source,updated_at=excluded.updated_at")
  .bind(uid,bucket,key,mime,size,source).run();
}
async function arquivos(req,env,uid,url,origin){
 if(!env.FILES_KV)return out({error:'kv_indisponivel'},503,origin,env);
 if(url.pathname==='/v1/files/status'&&req.method==='GET'){
  const stats=await env.DB.prepare("SELECT status,count(*) AS n,coalesce(sum(size_bytes),0) AS bytes FROM private_files WHERE owner=? GROUP BY status").bind(uid).all();
  return out({status:stats.results||[]},200,origin,env);
 }
 if(url.pathname==='/v1/files/manifest'&&req.method==='GET'){
  const status=url.searchParams.get('status')==='ready'?'ready':'pending';
  const limit=Math.max(1,Math.min(Number(url.searchParams.get('limit'))||20,60));
  const result=await env.DB.prepare("SELECT bucket,object_key,content_type,size_bytes FROM private_files WHERE owner=? AND status=? ORDER BY bucket,object_key LIMIT ?").bind(uid,status,limit).all();
  return out({items:result.results||[]},200,origin,env);
 }
 if(url.pathname==='/v1/files/import'&&req.method==='POST'){
  let body;try{body=await req.json()}catch{return out({error:'json_invalido'},400,origin,env);}
  const bucket=body?.bucket,key=body?.key;
  if(!BUCKETS.has(bucket)||typeof key!=='string'||!key||key.length>512||key.includes('\\')||key.split('/').some(x=>!x||x==='.'||x==='..'))return out({error:'chave_invalida'},400,origin,env);
  const metadata=await env.DB.prepare('SELECT content_type,size_bytes,status FROM private_files WHERE owner=? AND bucket=? AND object_key=?').bind(uid,bucket,key).first();
  if(!metadata)return out({error:'arquivo_nao_catalogado'},404,origin,env);
  if(metadata.status==='ready'){
   const k=await env.FILES_KV.get(kvKey(uid,bucket,key),'arrayBuffer');
   if(k)return out({ok:true,already:true,size_bytes:k.byteLength},200,origin,env);
  }
  const token=/^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')||'')?.[1];
  const remote=await fetch(legacyUrl(env,bucket,key),{
   headers:{Authorization:'Bearer '+token,apikey:env.SUPABASE_ANON_KEY},
   redirect:'error',signal:AbortSignal.timeout(20000)
  }).catch(()=>null);
  if(!remote?.ok)return out({error:'legado_indisponivel',status:remote?.status||503},409,origin,env);
  if(Number(remote.headers.get('content-length')||0)>MAX_ARQUIVO)return out({error:'grande_demais_para_nuvem'},413,origin,env);
  const bytes=await remote.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>MAX_ARQUIVO)return out({error:'arquivo_invalido_ou_grande'},413,origin,env);
  const mime=safeType(metadata.content_type||remote.headers.get('content-type')||'');
  await env.FILES_KV.put(kvKey(uid,bucket,key),bytes,{metadata:{mime,bytes:bytes.byteLength}});
  await atualizaArquivo(env.DB,uid,bucket,key,mime,bytes.byteLength,'legado');
  return out({ok:true,migrated:true,size_bytes:bytes.byteLength},200,origin,env);
 }
 const parts=url.pathname.startsWith('/v1/files/')?fileParts(url):null;
 if(!parts)return out({error:'arquivo_nao_encontrado'},404,origin,env);
 const {bucket,key}=parts,storage=kvKey(uid,bucket,key);
 if(req.method==='GET'||req.method==='HEAD'){
  const entry=await env.FILES_KV.getWithMetadata(storage,'arrayBuffer');
  if(!entry?.value)return out({error:'arquivo_nao_encontrado'},404,origin,env);
  const headers={'Content-Type':safeType(entry.metadata?.mime),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Length':String(entry.value.byteLength),'Vary':'Origin'};
  if(origin===env.ALLOWED_ORIGIN)headers['Access-Control-Allow-Origin']=origin;
  return new Response(req.method==='HEAD'?null:entry.value,{status:200,headers});
 }
 if(req.method==='PUT'){
  if(Number(req.headers.get('content-length')||0)>MAX_ARQUIVO)return out({error:'grande_demais_para_nuvem'},413,origin,env);
  const bytes=await req.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>MAX_ARQUIVO)return out({error:'arquivo_invalido_ou_grande'},413,origin,env);
  const total=await env.DB.prepare("SELECT coalesce(sum(size_bytes),0) AS bytes FROM private_files WHERE owner=? AND status='ready'").bind(uid).first();
  const previous=await env.DB.prepare('SELECT size_bytes FROM private_files WHERE owner=? AND bucket=? AND object_key=?').bind(uid,bucket,key).first();
  if((Number(total?.bytes)||0)-(Number(previous?.size_bytes)||0)+bytes.byteLength>MAX_POR_CONTA)return out({error:'limite_gratuito_da_conta'},413,origin,env);
  const mime=safeType(req.headers.get('content-type'));
  await env.FILES_KV.put(storage,bytes,{metadata:{mime,bytes:bytes.byteLength}});
  await atualizaArquivo(env.DB,uid,bucket,key,mime,bytes.byteLength,'cloudflare');
  return out({ok:true,size_bytes:bytes.byteLength},200,origin,env);
 }
 return out({error:'metodo_invalido'},405,origin,env);
}

export default {
 async fetch(req,env){
  const origin=req.headers.get('origin');
  const allowed=env.ALLOWED_ORIGIN||'https://meudiariotrade.github.io';
  if(origin&&origin!==allowed)return out({error:'origem_negada'},403,origin,env);
  if(req.method==='OPTIONS'){
   if(origin!==allowed)return out({error:'origem_negada'},403,origin,env);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,HEAD,PUT,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}});
  }
  const url=new URL(req.url);
  if(url.pathname==='/health'&&req.method==='GET')return out({ok:!!env.DB,servico:'diario-sync',fase:'espelho'},env.DB?200:503,origin,env);
  const isDiary=url.pathname==='/v1/diario'&&['GET','PUT'].includes(req.method);
  const isFiles=url.pathname.startsWith('/v1/files/');
  if(!isDiary&&!isFiles)return out({error:'nao_encontrado'},404,origin,env);
  if(!env.DB)return out({error:'db_indisponivel'},503,origin,env);
  const uid=await owner(req,env);
  if(!uid)return out({error:'login_invalido'},401,origin,env);
  if(isFiles)return arquivos(req,env,uid,url,origin);
  if(req.method==='GET'){
   const meta=url.searchParams.get('meta')==='1';
   const found=await row(env.DB,uid,meta);
   return out(found?{exists:true,revision:found.revision,source_mt:found.source_mt,...(meta?{}:{data:JSON.parse(found.payload),updated_at:found.updated_at})}:{exists:false,revision:null,source_mt:0},200,origin,env);
  }
  if(Number(req.headers.get('content-length')||0)>LIMIT)return out({error:'muito_grande'},413,origin,env);
  const text=await req.text();
  if(new TextEncoder().encode(text).length>LIMIT)return out({error:'muito_grande'},413,origin,env);
  let body;
  try{body=JSON.parse(text);}catch{return out({error:'json_invalido'},400,origin,env);}
  const data=body?.data;
  const mt=Number(data?.mt);
  if(!data||typeof data!=='object'||Array.isArray(data)||!Number.isSafeInteger(mt)||mt<0||mt>Date.now()+86400000)return out({error:'dados_invalidos'},400,origin,env);
  const payload=JSON.stringify(data);
  if(new TextEncoder().encode(payload).length>LIMIT)return out({error:'muito_grande'},413,origin,env);
  const expected=body.expected_revision;
  if(expected!==null&&(!Number.isSafeInteger(expected)||expected<1))return out({error:'revisao_invalida'},400,origin,env);
  let result;
  if(expected===null){
   result=await env.DB.prepare('INSERT OR IGNORE INTO diario_snapshots(user_id,revision,source_mt,payload) VALUES (?,1,?,?)').bind(uid,mt,payload).run();
   if(result.meta?.changes===1)return out({saved:true,revision:1,source_mt:mt},200,origin,env);
  }else{
   result=await env.DB.prepare("UPDATE diario_snapshots SET payload=?,source_mt=?,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id=? AND revision=? AND source_mt<=?").bind(payload,mt,uid,expected,mt).run();
   if(result.meta?.changes===1)return out({saved:true,revision:expected+1,source_mt:mt},200,origin,env);
  }
  const newer=await row(env.DB,uid,true);
  return out({saved:false,revision:newer?.revision??null,source_mt:newer?.source_mt??0,reason:'conflito'},409,origin,env);
 }
};