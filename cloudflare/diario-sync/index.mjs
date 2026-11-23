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
export default {
 async fetch(req,env){
  const origin=req.headers.get('origin');
  const allowed=env.ALLOWED_ORIGIN||'https://meudiariotrade.github.io';
  if(origin&&origin!==allowed)return out({error:'origem_negada'},403,origin,env);
  if(req.method==='OPTIONS'){
   if(origin!==allowed)return out({error:'origem_negada'},403,origin,env);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}});
  }
  const url=new URL(req.url);
  if(url.pathname==='/health'&&req.method==='GET')return out({ok:!!env.DB,servico:'diario-sync',fase:'espelho'},env.DB?200:503,origin,env);
  if(url.pathname!=='/v1/diario'||!['GET','PUT'].includes(req.method))return out({error:'nao_encontrado'},404,origin,env);
  if(!env.DB)return out({error:'db_indisponivel'},503,origin,env);
  const uid=await owner(req,env);
  if(!uid)return out({error:'login_invalido'},401,origin,env);
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