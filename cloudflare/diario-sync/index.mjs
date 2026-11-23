import {COLECOES} from './colecoes-v902.mjs';
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
 const r=await fetch(url.origin+'/auth/v1/user',{headers:{Authorization:'Bearer '+token,apikey:env.SUPABASE_ANON_KEY},redirect:'manual',signal:AbortSignal.timeout(7000)}).catch(()=>null);
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
 if(url.pathname==='/v1/files/import-batch'&&req.method==='POST'){
  let body;try{body=await req.json()}catch{return out({error:'json_invalido'},400,origin,env)}
  const items=body?.items;
  if(!Array.isArray(items)||!items.length||items.length>4||
    items.some(x=>!x||!BUCKETS.has(x.bucket)||typeof x.key!=='string'||!x.key||x.key.length>512))
    return out({error:'lote_invalido'},400,origin,env);
  const results=[];
  for(const item of items){
    try{
      const r=new Request(url.origin+'/v1/files/import',{
        method:'POST',headers:{Authorization:req.headers.get('authorization')||'','Content-Type':'application/json'},
        body:JSON.stringify({bucket:item.bucket,key:item.key})
      });
      const answer=await arquivos(r,env,uid,new URL(r.url),origin);
      const payload=await answer.json().catch(()=>({}));
      results.push({bucket:item.bucket,ok:answer.ok,http:answer.status,
        code:answer.ok?'ok':String(payload.error||'falha').slice(0,60),
        upstream_http:Number(payload.status)||null,size_bytes:Number(payload.size_bytes)||0});
    }catch(_){
      results.push({bucket:item.bucket,ok:false,http:503,code:'importacao_indisponivel'});
    }
  }
  return out({results},200,origin,env);
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
   redirect:'manual',signal:AbortSignal.timeout(20000)
  }).catch(()=>null);
  if(!remote?.ok)return out({error:'legado_indisponivel',status:remote?.status||503},409,origin,env);
  if(Number(remote.headers.get('content-length')||0)>MAX_ARQUIVO)return out({error:'grande_demais_para_nuvem'},413,origin,env);
  const bytes=await remote.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>MAX_ARQUIVO)return out({error:'arquivo_invalido_ou_grande'},413,origin,env);
  const mime=safeType(metadata.content_type||remote.headers.get('content-type')||'');
  const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
    .map(x=>x.toString(16).padStart(2,'0')).join('');
  await env.FILES_KV.put(kvKey(uid,bucket,key),bytes,{metadata:{mime,bytes:bytes.byteLength,sha256:checksum}});
  const check=await env.FILES_KV.getWithMetadata(kvKey(uid,bucket,key),'arrayBuffer');
  if(!check?.value||check.value.byteLength!==bytes.byteLength||check.metadata?.sha256!==checksum)
    return out({error:'kv_verificacao_pendente'},503,origin,env);
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


/* Backups diários privados no D1: o legado não é apagado, todas as rotas exigem JWT. */
async function backups(req,env,uid,url,origin){
 const prefix='/v1/backups';
 if(url.pathname===prefix && req.method==='GET'){
   const rows=await env.DB.prepare("SELECT payload FROM private_documents WHERE owner=? AND collection='diario_backup' ORDER BY doc_key DESC LIMIT 30").bind(uid).all();
   const items=(rows.results||[]).map(x=>{try{return JSON.parse(x.payload)}catch{return null}})
     .filter(x=>x?.user_id===uid&&/^\d{4}-\d{2}-\d{2}$/.test(x.dia||''))
     .map(x=>({dia:x.dia,criado:x.criado}));
   return out({items},200,origin,env);
 }
 const dia=url.pathname.startsWith(prefix+'/')?url.pathname.slice(prefix.length+1):'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dia)||dia.length!==10)
   return out({error:'dia_invalido'},400,origin,env);
 const key=JSON.stringify([uid,dia]);
 if(req.method==='GET'){
   const row=await env.DB.prepare("SELECT payload FROM private_documents WHERE owner=? AND collection='diario_backup' AND doc_key=?").bind(uid,key).first();
   if(!row)return out({error:'copia_nao_encontrada'},404,origin,env);
   const item=JSON.parse(row.payload);
   return out({data:item.data,criado:item.criado},200,origin,env);
 }
 if(req.method==='PUT'){
   if(Number(req.headers.get('content-length')||0)>LIMIT)return out({error:'muito_grande'},413,origin,env);
   const raw=await req.text();
   if(new TextEncoder().encode(raw).length>LIMIT)return out({error:'muito_grande'},413,origin,env);
   let value;try{value=JSON.parse(raw)}catch{return out({error:'json_invalido'},400,origin,env)}
   if(!value?.data||typeof value.data!=='object'||Array.isArray(value.data)||
     !Number.isSafeInteger(Number(value.data.mt))||Number(value.data.mt)<0)
     return out({error:'copia_invalida'},400,origin,env);
   const row=JSON.stringify({user_id:uid,dia,criado:new Date().toISOString(),data:value.data});
   if(new TextEncoder().encode(row).length>LIMIT)return out({error:'muito_grande'},413,origin,env);
   await env.DB.prepare("INSERT OR IGNORE INTO private_documents(owner,collection,doc_key,payload) VALUES (?,'diario_backup',?,?)").bind(uid,key,row).run();
   return out({saved:true,dia},200,origin,env);
 }
 return out({error:'metodo_invalido'},405,origin,env);
}

/* v902: migração paginada, somente leitura do Supabase PostgREST do próprio usuário.
 * Nunca migra logs ou Analytics; rows são isoladas por owner no D1.
 */
const PAGE_SIZE=10;
async function importarColecao(req,env,uid,url,origin){
 if(url.pathname==='/v1/migrate/status'&&req.method==='GET'){
  const records=await env.DB.prepare('SELECT collection,count_rows,next_offset,finished FROM private_migration_progress WHERE owner=?').bind(uid).all();
  const byName=new Map((records.results||[]).map(x=>[x.collection,x]));
  return out({collections:Object.keys(COLECOES).map(name=>{
   const p=byName.get(name);
   return {name,finished:p?.finished===1,rows:p?.count_rows||0,offset:p?.next_offset||0};
  })},200,origin,env);
 }
 if(url.pathname!=='/v1/migrate/step'||req.method!=='POST')return out({error:'nao_encontrado'},404,origin,env);
 let payload;try{payload=await req.json()}catch{return out({error:'json_invalido'},400,origin,env);}
 const collection=payload?.collection,config=COLECOES[collection];
 if(!Object.prototype.hasOwnProperty.call(COLECOES,collection)||!config)return out({error:'colecao_nao_permitida'},400,origin,env);
 const previous=await env.DB.prepare('SELECT next_offset,finished FROM private_migration_progress WHERE owner=? AND collection=?').bind(uid,collection).first();
 if(previous?.finished===1)return out({ok:true,finished:true,offset:previous.next_offset},200,origin,env);
 const offset=previous?.next_offset||0;
 const qs=new URLSearchParams({select:'*',order:config.keys.map(key=>key+'.asc').join(','),limit:String(PAGE_SIZE),offset:String(offset)});
 qs.set(config.owner,'eq.'+uid);
 const base=new URL(env.SUPABASE_URL);
 const from=base.origin+'/rest/v1/'+encodeURIComponent(collection)+'?'+qs.toString();
 const token=/^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')||'')?.[1]||'';
 const response=await fetch(from,{method:'GET',headers:{Authorization:'Bearer '+token,apikey:env.SUPABASE_ANON_KEY,Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(18000)}).catch(()=>null);
 if(!response?.ok)return out({error:'origem_indisponivel',code:response?.status||503},424,origin,env);
 if(Number(response.headers.get('content-length')||0)>1200000)return out({error:'lote_grande'},413,origin,env);
 const raw=await response.text();
 if(raw.length>1200000)return out({error:'lote_grande'},413,origin,env);
 let rows;try{rows=JSON.parse(raw)}catch{return out({error:'origem_invalida'},502,origin,env);}
 if(!Array.isArray(rows)||rows.length>PAGE_SIZE)return out({error:'formato_invalido'},502,origin,env);
 if(rows.some(item=>!item||typeof item!=='object'||String(item[config.owner])!==uid||config.keys.some(k=>item[k]===undefined||item[k]===null)))return out({error:'isolamento_ou_chave_invalida'},403,origin,env);
 if(rows.length){
  const statements=rows.map(item=>env.DB.prepare("INSERT INTO private_documents(owner,collection,doc_key,payload,updated_at) VALUES (?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(owner,collection,doc_key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
    .bind(uid,collection,JSON.stringify(config.keys.map(k=>item[k])),JSON.stringify(item)));
  await env.DB.batch(statements);
 }
 const actual=await env.DB.prepare('SELECT count(*) AS n FROM private_documents WHERE owner=? AND collection=?').bind(uid,collection).first();
 const next=offset+rows.length,finished=rows.length<PAGE_SIZE;
 await env.DB.prepare("INSERT INTO private_migration_progress(owner,collection,count_rows,next_offset,finished,updated_at) VALUES (?,?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(owner,collection) DO UPDATE SET count_rows=excluded.count_rows,next_offset=excluded.next_offset,finished=excluded.finished,updated_at=excluded.updated_at WHERE private_migration_progress.next_offset=?")
  .bind(uid,collection,Number(actual?.n)||0,next,finished?1:0,offset).run();
 return out({ok:true,collection,finished,rows:rows.length,count:Number(actual?.n)||0,offset:next},200,origin,env);
}


/* v907: histórico Profit privado no D1; sem polling ou gravações no Supabase.
 * Paginação e limites protegem a cota gratuita, proprietário derivado do JWT.
 */
const PROFIT_MIN_TS=946684800,PROFIT_MAX_BATCH=100;
const profitTicker=t=>/^[A-Z0-9._-]{1,24}$/.test(String(t||'').toUpperCase())?String(t).toUpperCase():null;
async function profitCandles(req,env,uid,url,origin){
 if(req.method==='GET'){
   const ticker=profitTicker(url.searchParams.get('ticker'));
   const from=Number(url.searchParams.get('from')||PROFIT_MIN_TS);
   const limit=Math.max(1,Math.min(1000,Number(url.searchParams.get('limit'))||1000));
   const offset=Number(url.searchParams.get('offset')||0);
   if(!ticker||!Number.isSafeInteger(from)||from<PROFIT_MIN_TS||
      !Number.isSafeInteger(offset)||offset<0||offset>120000)
     return out({error:'parametros_invalidos'},400,origin,env);
   const result=await env.DB.prepare(
     'SELECT ts AS t,o,h,l,c,v FROM profit_candles_private WHERE owner=? AND ticker=? AND ts>=? ORDER BY ts ASC LIMIT ? OFFSET ?'
   ).bind(uid,ticker,from,limit,offset).all();
   return out({candles:result.results||[]},200,origin,env);
 }
 if(req.method==='POST'){
   if(Number(req.headers.get('content-length')||0)>125000)
     return out({error:'lote_grande'},413,origin,env);
   const raw=await req.text();
   if(new TextEncoder().encode(raw).length>125000)
     return out({error:'lote_grande'},413,origin,env);
   let parsed;try{parsed=JSON.parse(raw)}catch{return out({error:'json_invalido'},400,origin,env)}
   const items=parsed?.candles;
   if(!Array.isArray(items)||!items.length||items.length>PROFIT_MAX_BATCH)
     return out({error:'limite_lote_100'},400,origin,env);
   const until=Math.floor(Date.now()/1000)+86400,unique=new Map();
   for(const x of items){
     const ticker=profitTicker(x?.ativo),ts=Number(x?.t);
     const [o,h,l,c,v]=[x?.o,x?.h,x?.l,x?.c,x?.v??0].map(Number);
     if(!ticker||!Number.isSafeInteger(ts)||ts<PROFIT_MIN_TS||ts>until||
       ![o,h,l,c,v].every(Number.isFinite)||Math.min(o,h,l,c)<=0||v<0||
       l>Math.min(o,c)||h<Math.max(o,c)||h<l)
       return out({error:'candle_invalido',count:items.length},422,origin,env);
     unique.set(ticker+'|'+ts,[uid,ticker,ts,o,h,l,c,v]);
   }
   const statements=[...unique.values()].map(x=>env.DB.prepare(
     'INSERT INTO profit_candles_private(owner,ticker,ts,o,h,l,c,v) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(owner,ticker,ts) DO UPDATE SET o=excluded.o,h=excluded.h,l=excluded.l,c=excluded.c,v=excluded.v'
   ).bind(...x));
   await env.DB.batch(statements);
   return out({saved:statements.length},200,origin,env);
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
  const isMigration=url.pathname.startsWith('/v1/migrate/');
  const isBackup=url.pathname==='/v1/backups'||url.pathname.startsWith('/v1/backups/');
  const isProfit=url.pathname==='/v1/profit-candles';
  if(!isDiary&&!isFiles&&!isMigration&&!isBackup&&!isProfit)return out({error:'nao_encontrado'},404,origin,env);
  if(!env.DB)return out({error:'db_indisponivel'},503,origin,env);
  const uid=await owner(req,env);
  if(!uid)return out({error:'login_invalido'},401,origin,env);
  if(isFiles)return arquivos(req,env,uid,url,origin);
  if(isBackup)return backups(req,env,uid,url,origin);
  if(isProfit)return profitCandles(req,env,uid,url,origin);
  if(isMigration)return importarColecao(req,env,uid,url,origin);
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