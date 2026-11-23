// v896: leituras publicas exclusivamente no KV Cloudflare.
// Origem legada consultada apenas pelo CRON (ate 4 snapshots/dia).
const ORIGIN='https://vdzwydizostutukppcsj.supabase.co/functions/v1/screeners-quant';
const FRESH_MS=12*3600000,MAX_STALE_MS=7*86400000,KV_TTL=604800;
export const SCREENER_CRON='25 2,14 * * *';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS',
 'Access-Control-Allow-Headers':'if-none-match',
 'Access-Control-Expose-Headers':'ETag, X-Snapshot-Source, X-Snapshot-Tier, X-Snapshot-Stale, X-Snapshot-Expires'};
const key=m=>'universe:v2:'+m;
const valid=m=>m==='BR'||m==='US';
const fail=(message,status=503)=>Response.json({ok:false,error:message,origem:'cloudflare-kv',semFallbackSupabase:true},
 {status,headers:{...CORS,'Cache-Control':'no-store'}});
const age=(at,now)=>{const t=Date.parse(String(at||''));return Number.isFinite(t)?Math.max(0,now-t):Infinity;};
function metaOf(value,now){
 const fetchedAt=Number(value?.fetchedAt)||0,expiresAt=Number(value?.expiresAt)||0;
 if(!fetchedAt||fetchedAt>now+300000||now-fetchedAt>MAX_STALE_MS)return null;
 return {expiresAt,etag:String(value?.etag||''),stale:now>=expiresAt||age(value?.generatedAt,now)>48*3600000};
}
function deliver(body,meta,req,tier){
 const fresh=!meta.stale,remaining=fresh?Math.max(0,Math.min(900,Math.floor((meta.expiresAt-Date.now())/1000))):0;
 const headers={...CORS,'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':fresh?'public, max-age='+remaining+', s-maxage='+remaining:'no-store',
  'ETag':meta.etag,'X-Snapshot-Source':'cloudflare-kv-public-v896','X-Snapshot-Tier':tier,
  'X-Snapshot-Stale':meta.stale?'1':'0','X-Snapshot-Expires':String(meta.expiresAt)};
 const inm=req.headers.get('If-None-Match');
 if(fresh&&meta.etag&&inm&&(inm===meta.etag||inm==='W/'+meta.etag))
  return new Response(null,{status:304,headers});
 return new Response(body,{status:200,headers});
}
export async function servePublicSnapshot(req,env,ctx,popCache=globalThis.caches?.default){
 const url=new URL(req.url),market=url.searchParams.get('market');
 if(!valid(market))return fail('Mercado inválido',400);
 if([...url.searchParams.keys()].some(k=>!['market','v','snapshot','universe'].includes(k))||
  (url.searchParams.has('snapshot')&&url.searchParams.get('snapshot')!=='1')||
  (url.searchParams.has('universe')&&url.searchParams.get('universe')!=='1'))
  return fail('Parâmetros não suportados',400);
 if(!env.SCREENER_CACHE)return fail('Cache público indisponível');
 const revision=String(url.searchParams.get('v')||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40);
 const popKey=new Request(url.origin+'/v1/screeners?market='+market+(revision?'&v='+revision:'')),now=Date.now();
 if(popCache){
  try{
   const hit=await popCache.match(popKey);
   if(hit&&Number(hit.headers.get('X-Snapshot-Expires'))>now&&hit.headers.get('X-Snapshot-Stale')==='0'){
    return deliver(await hit.text(),{stale:false,expiresAt:Number(hit.headers.get('X-Snapshot-Expires')),etag:hit.headers.get('ETag')||''},req,'pop');
   }
  }catch{/* Falha de POP nao altera a origem KV. */}
 }
 try{
  const item=await env.SCREENER_CACHE.getWithMetadata(key(market),'text');
  if(!item?.value)return fail('Snapshot Cloudflare ainda não carregado');
  const meta=metaOf(item.metadata,now);
  if(!meta)return fail('Snapshot antigo demais para uso');
  const response=deliver(item.value,meta,req,'kv');
  if(!meta.stale&&response.status===200&&popCache&&ctx?.waitUntil)
   ctx.waitUntil(popCache.put(popKey,response.clone()).catch(()=>{}));
  return response;
 }catch{return fail('Falha temporária ao ler o KV')}
}
async function etag(body){
 const x=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body)));
 return '"'+Array.from(x.slice(0,12),i=>i.toString(16).padStart(2,'0')).join('')+'"';
}
export async function refreshMarket(market,env,fetcher=fetch){
 if(!valid(market)||!env.SCREENER_CACHE)throw Error('Mercado/KV inválido');
 const res=await fetcher(ORIGIN+'?market='+market+'&snapshot=1&universe=1',{
  method:'GET',headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(18000)});
 if(!res.ok)throw Error('Origem de '+market+' HTTP '+res.status);
 const body=await res.text();if(body.length>1800000)throw Error('Snapshot acima de 1.8MB');
 let data;try{data=JSON.parse(body)}catch{throw Error('Resposta não JSON')}
 if(data?.ok!==true||data?.market!==market||data?.universe_complete!==true||
   !Array.isArray(data.universe_rows)||!data.universe_rows.length||!Array.isArray(data.rows)||
   !data.last_update||data.top10!==undefined||data.user_id!==undefined||
   data.owned!==undefined||data.custody!==undefined)
  throw Error('Snapshot incompleto ou com dados particulares');
 const now=Date.now();if(age(data.last_update,now)>MAX_STALE_MS)throw Error('Snapshot origem vencido');
 await env.SCREENER_CACHE.put(key(market),body,{expirationTtl:KV_TTL,
  metadata:{etag:await etag(body),expiresAt:now+FRESH_MS,fetchedAt:now,
   generatedAt:data.last_update,source:'scheduled-export-v896'}});
 return {market,rows:data.universe_rows.length,bytes:body.length};
}
export async function refreshBoth(env,fetcher=fetch){
 const all=await Promise.allSettled(['BR','US'].map(m=>refreshMarket(m,env,fetcher)));
 if(all.some(x=>x.status==='rejected'))
  throw Error('Atualização incompleta; KV anterior preservado');
 return all.map(x=>x.value);
}
