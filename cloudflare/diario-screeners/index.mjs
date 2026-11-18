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

  // v762 — candles técnicos: cache compartilhado na borda, ZERO consultas ao PostgreSQL.
  // Símbolos e intervalos fechados impedem proxy aberto, SSRF e varredura arbitrária.
  if(url.pathname==='/v1/tecnico-candles'){
   const ticker=(url.searchParams.get('ticker')||'').toUpperCase();
   const market=url.searchParams.get('market'),tf=url.searchParams.get('tf');
   if(!['BR','US','CRYPTO'].includes(market)||!['1d','1h','15m'].includes(tf)||
      [...url.searchParams.keys()].some(x=>!['ticker','market','tf'].includes(x))||
      !/^[A-Z0-9.-]{2,12}$/.test(ticker)||
      (market==='BR'&&ticker!=='IBOV'&&!/^[A-Z]{4}\d{1,2}$/.test(ticker))||
      (market==='US'&&!/^[A-Z]{1,5}(?:\.[A-Z])?$/.test(ticker))||
      (market==='CRYPTO'&&!/^(BTC|ETH|SOL|XRP|BNB|ADA|DOGE|LINK|AVAX|DOT|LTC|BCH|UNI|TRX|XLM|ATOM|NEAR|APT|SUI|TON)USDT$/.test(ticker)))
     return json({error:'Símbolo/intervalo não autorizado'},400);
   const key=new Request(url.origin+'/v1/tecnico-candles?market='+market+'&tf='+tf+'&ticker='+ticker);
   const cache=caches.default;
   const found=await cache.match(key);
   // Para os candles, 15m/1h precisam de TTL menor que o snapshot fundamentalista.
   if(found){
    const response=conditional(request,found,true);
    const headers=new Headers(response.headers);
    headers.set('Cache-Control',tf==='1d'?'public, max-age=900, s-maxage=900':'public, max-age=300, s-maxage=300');
    headers.set('X-Snapshot-Source','cloudflare-edge-candles');
    return new Response(response.body,{status:response.status,headers});
   }
   const interval=tf==='1d'?'1d':tf==='1h'?'60m':'15m';
   const range=tf==='1d'?'2y':tf==='1h'?'3mo':'1mo';
   const symbol=market==='BR'?(ticker==='IBOV'?'^BVSP':ticker+'.SA'):market==='US'&&ticker==='SPX'?'^GSPC':ticker;
   let items=[],source='';
   try{
    if(market==='CRYPTO'){
     const rangeBin=tf==='1d'?'1d':tf==='1h'?'1h':'15m';
     const resp=await fetch('https://api.binance.com/api/v3/klines?symbol='+ticker+'&interval='+rangeBin+'&limit=500',{signal:AbortSignal.timeout(9000)});
     if(!resp.ok)throw Error('Binance HTTP '+resp.status);
     const rows=await resp.json();
     items=rows.map(x=>[Math.floor(Number(x[0])/1000),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[5])]);
     source='Binance Klines';
    }else{
     let response=null;
     for(const h of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
      try{
       const u='https://'+h+'/v8/finance/chart/'+encodeURIComponent(symbol)+'?range='+range+'&interval='+interval+'&includePrePost=false';
       const r=await fetch(u,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});
       if(r.ok){response=r;break}
      }catch{}
     }
     if(!response)throw Error('Yahoo Chart indisponível');
     const obj=await response.json(),series=obj?.chart?.result?.[0],q=series?.indicators?.quote?.[0];
     if(!Array.isArray(series?.timestamp)||!q)throw Error('Série não retornada');
     items=series.timestamp.map((t,i)=>[Number(t),Number(q.open?.[i]),Number(q.high?.[i]),Number(q.low?.[i]),Number(q.close?.[i]),Number(q.volume?.[i])]);
     source='Yahoo Finance Chart (histórico, sujeito a atraso)';
    }
    items=items.filter(x=>x.every(Number.isFinite)&&x[0]>0&&x[1]>0&&x[4]>0&&x[2]>=Math.max(x[1],x[4])&&x[3]>0&&x[3]<=Math.min(x[1],x[4])&&x[5]>=0).slice(-600);
    if(items.length<30)return json({error:'Histórico confiável insuficiente',candles:items.length},422);
    const ttl=tf==='1d'?900:300;
    const response=Response.json({ok:true,ticker,market,tf,source,fetchedAt:new Date().toISOString(),candles:items},
      {headers:{'Cache-Control':'public, max-age='+ttl+', s-maxage='+ttl}});
    ctx.waitUntil(cache.put(key,response.clone()));
    const out=conditional(request,response,false);
    const headers=new Headers(out.headers);
    headers.set('Cache-Control','public, max-age='+ttl+', s-maxage='+ttl);
    headers.set('X-Snapshot-Source','cloudflare-edge-candles');
    return new Response(out.body,{status:out.status,headers});
   }catch(e){return json({error:String(e.message||e).slice(0,120)},502)}
  }

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