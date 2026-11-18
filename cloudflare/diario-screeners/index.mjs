// Snapshot público e imutável por janela de cache. Nenhum JWT, carteira ou segredo sai do Worker.
const CACHE_CONTROL='public, max-age=900, s-maxage=1800';
const CORS={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Methods':'GET, OPTIONS',
 'Access-Control-Allow-Headers':'if-none-match',
 'Access-Control-Expose-Headers':'ETag, X-Screeners-Cache, X-Snapshot-Source',
};
const json=(value,status=200)=>Response.json(value,{status,headers:{...CORS,'Cache-Control':'no-store'}});
function conditional(req,response,hit){
 const headers=new Headers(response.headers);
 for(const [key,value] of Object.entries(CORS))headers.set(key,value);
 headers.set('Cache-Control',CACHE_CONTROL);
 headers.set('X-Screeners-Cache',hit?'HIT':'MISS');
 headers.set('X-Snapshot-Source','cloudflare-edge-public');
 const tag=headers.get('ETag'),cond=req.headers.get('If-None-Match')?.trim();
 if(tag&&cond&&(cond===tag||cond==='W/'+tag))
  return new Response(null,{status:304,headers});
 return new Response(response.body,{status:response.status,headers});
}
export default {
 async fetch(request,env,ctx){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
  if(request.method!=='GET')return json({error:'Somente leitura'},405);
  const url=new URL(request.url);
  if(url.pathname==='/health')return json({ok:true,servico:'screeners-edge',sem_dados_privados:true});
  if(url.pathname!=='/v1/screeners')return json({error:'Rota nao encontrada'},404);
  const market=url.searchParams.get('market');
  if(!['BR','US'].includes(market))return json({error:'Mercado invalido'},400);
  // O frontend v754 solicita o universo público com estes dois parâmetros fixos.
  // Aceitar apenas os valores esperados, evitando combinações e caches distintos.
  if([...url.searchParams.keys()].some(k=>!['market','v','snapshot','universe'].includes(k))||
     (url.searchParams.has('snapshot')&&url.searchParams.get('snapshot')!=='1')||
     (url.searchParams.has('universe')&&url.searchParams.get('universe')!=='1'))
   return json({error:'Parametros nao suportados'},400);
  const revision=(url.searchParams.get('v')||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40);
  const key=new Request(url.origin+'/v1/screeners?market='+market+(revision?'&v='+revision:''),{method:'GET'});
  const cache=caches.default;
  const cached=await cache.match(key);
  if(cached)return conditional(request,cached,true);
  const origin=String(env.SUPABASE_URL||'').replace(/\/$/,'');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(origin))
   return json({error:'Origem nao configurada'},503);
  const response=await fetch(origin+'/functions/v1/screeners-quant?market='+market+'&snapshot=1&universe=1',
   {method:'GET',headers:{Accept:'application/json'},signal:AbortSignal.timeout(18000)});
  if(!response.ok)return json({error:'Snapshot indisponivel',status:response.status},503);
  const body=await response.text();
  if(body.length>1800000)return json({error:'Snapshot excedeu limite da borda'},503);
  let payload;try{payload=JSON.parse(body)}catch{return json({error:'Resposta da origem invalida'},503)}
  if(!payload?.ok||payload?.market!==market)return json({error:'Snapshot incorreto'},503);
  const headers=new Headers({
   'Content-Type':'application/json; charset=utf-8','Cache-Control':CACHE_CONTROL,
   'ETag':response.headers.get('ETag')||'',
   'X-Snapshot-Source':'cloudflare-edge-public',
  });
  const sourceResponse=new Response(body,{status:200,headers});
  // Cache API por POP: hit compartilhado entre usuários nesse POP; não é cache global único.
  if(payload.universe_complete===true)ctx.waitUntil(cache.put(key,sourceResponse.clone()));
  return conditional(request,sourceResponse,false);
 }
};