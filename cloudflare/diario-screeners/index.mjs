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

  // v773 — reduzir companyfacts SEC na borda: 1 download oficial, resposta XBRL compacta.
  // Nem Supabase nem cliente baixam JSON volumoso; nenhuma credencial via cache público.
  if(url.pathname==='/v1/sec-xbrl'){
   const cik=url.searchParams.get('cik')||'';
   if([...url.searchParams.keys()].some(k=>k!=='cik')||!/^[0-9]{10}$/.test(cik))
    return json({error:'CIK obrigatório'},400);
   const key=new Request(url.origin+'/v1/sec-xbrl?cik='+cik+'&revision=v777');
   const cache=caches.default,hit=await cache.match(key);
   if(hit)return conditional(request,hit,true);
   try{
    const urlSec='https://data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json';
    const remote=await fetch(urlSec,{headers:{
     'User-Agent':'DiarioTraderQuant/1.0 (contato@diariotrader.app)',Accept:'application/json'},
     signal:AbortSignal.timeout(16000)});
    if(remote.status===403||remote.status===429)return json({error:'SEC bloqueada',code:remote.status},503);
    if(!remote.ok)return json({error:'SEC Companyfacts indisponível',code:remote.status},502);
    const length=Number(remote.headers.get('content-length')||0);
    if(length>20000000)return json({error:'Arquivo XBRL acima do limite de borda'},413);
    const raw=await remote.text();
    if(raw.length>20000000)return json({error:'Arquivo XBRL acima do limite de borda'},413);
    const source=JSON.parse(raw);
    if(Number(source?.cik)!==Number(cik)||!source?.facts)return json({error:'CIK/XBRL inválido'},502);
    const concepts={
     'us-gaap':['Assets','StockholdersEquity','Liabilities','NetIncomeLoss','Revenues',
      'RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax',
      'SalesRevenueNet','EarningsPerShareDiluted','NetCashProvidedByUsedInOperatingActivities',
      'PaymentsToAcquirePropertyPlantAndEquipment'],
     'ifrs-full':['Assets','Equity','Liabilities','ProfitLoss','Revenue',
      'RevenueFromContractsWithCustomers','ProfitLossAttributableToOwnersOfParent',
      'DilutedEarningsLossPerShare','CashFlowsFromUsedInOperatingActivities',
      'PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities']
    };
    const eligible=new Set(['10-K','10-Q','10-K/A','10-Q/A','20-F','40-F','20-F/A','40-F/A']);
    const minimum=new Date(Date.now()-4*366*86400000).toISOString().slice(0,10);
    const today=new Date().toISOString().slice(0,10),facts={};
    for(const [group,tags] of Object.entries(concepts)){
     const result={};
     for(const tag of tags){
      const units=source.facts[group]?.[tag]?.units||{},selected={};
      for(const [unit,rows] of Object.entries(units)){
       if(!/^(USD|EUR|CAD|GBP|BRL|CHF|JPY)(?:\/shares)?$/.test(unit)||!Array.isArray(rows))continue;
       const valid=rows.filter(r=>eligible.has(String(r.form))&&
        /^\d{4}-\d{2}-\d{2}$/.test(String(r.end||''))&&r.end>=minimum&&r.end<=today&&
        /^\d{4}-\d{2}-\d{2}$/.test(String(r.filed||''))&&r.filed<=today&&
        /^\d{10}-\d{2}-\d{6}$/.test(String(r.accn||''))&&
        typeof r.val==='number'&&Number.isFinite(r.val));
       valid.sort((a,b)=>b.filed.localeCompare(a.filed)||b.end.localeCompare(a.end));
       const annual=valid.filter(r=>/^(10-K|20-F|40-F)/.test(r.form)).slice(0,16);
       const quarterly=valid.filter(r=>/^(10-Q)/.test(r.form)).slice(0,20);
       const dedup=new Map();
       for(const r of [...annual,...quarterly])dedup.set(r.accn+'|'+r.end+'|'+(r.start||'')+'|'+r.form,{
        accn:r.accn,form:r.form,start:r.start||null,end:r.end,filed:r.filed,val:r.val});
       if(dedup.size)selected[unit]=[...dedup.values()];
      }
      if(Object.keys(selected).length)result[tag]={units:selected};
     }
     if(Object.keys(result).length)facts[group]=result;
    }
    if(!Object.keys(facts).length)return json({error:'Sem conceitos XBRL aceitos (não inferir métricas)'},404);
    const body={cik:Number(cik),entityName:String(source.entityName||'').slice(0,140),facts,
     fonte_oficial:urlSec,transformacao:'sec-xbrl-compact-v777'};
    const out=Response.json(body,{headers:{...CORS,
     'Cache-Control':'public, max-age=43200, s-maxage=43200',
     'X-Screeners-Cache':'MISS','X-Snapshot-Source':'sec-edgar-xbrl-compact',
     ETag:'"xbrl-'+cik+'-'+Date.now()+'"'}});
    ctx.waitUntil(cache.put(key,out.clone()));return conditional(request,out,false);
   }catch{return json({error:'SEC XBRL não confirmado; manter indicadores nulos'},503)}
  }

  // v772 — espelhos públicos CVM produzidos semanalmente no GitHub, com cache de borda 24h.
  // Sem CPF, carteira, operações ou dados personalizados, com limites de tamanho e esquema.
  if(url.pathname==='/v1/cvm-provas'){
   if([...url.searchParams.keys()].length)return json({error:'Rota sem parâmetros'},400);
   const year=new Date().getUTCFullYear(),key=new Request(url.origin+'/v1/cvm-provas?year='+year);
   const cache=caches.default,hit=await cache.match(key);
   if(hit)return conditional(request,hit,true);
   try{
    const prefix='https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/';
    const [a,b]=await Promise.all([
     fetch(prefix+'cvm-emissores-'+year+'.json',{signal:AbortSignal.timeout(12000)}),
     fetch(prefix+'cvm-dre-'+year+'.json',{signal:AbortSignal.timeout(12000)})
    ]);
    if(!a.ok||!b.ok)return json({error:'Espelhos oficiais CVM indisponíveis'},503);
    const [idx,docs]=await Promise.all([a.text(),b.text()]);
    if(idx.length>950000||docs.length>1900000)return json({error:'Espelho CVM acima do limite'},502);
    const issuers=JSON.parse(idx),filings=JSON.parse(docs);
    const fresh=x=>x?.versao===1&&x?.ano===year&&
      Number.isFinite(Date.parse(x.gerado_em))&&Date.now()-Date.parse(x.gerado_em)<14*86400000;
    if(!fresh(issuers)||!fresh(filings)||!Array.isArray(issuers.emissores)||!Array.isArray(filings.documentos)||
     issuers.emissores.length<100||filings.documentos.length<100)return json({error:'Espelhos CVM desatualizados'},503);
    const result=Response.json({ok:true,ano:year,emissores:issuers.emissores,documentos:filings.documentos,
     gerado_em:issuers.gerado_em,fonte:'CVM Cadastro / ITR / DFP / DRE; somente dados públicos'},{
     headers:{...CORS,'Cache-Control':'public, max-age=86400, s-maxage=86400','X-Snapshot-Source':'cvm-github-oficial'}});
    ctx.waitUntil(cache.put(key,result.clone()));return conditional(request,result,false);
   }catch{return json({error:'Índice CVM não confirmado'},503)}
  }

  // Metadados documentais oficiais: a borda SEC é pública e não usa Supabase nem credenciais.
  if(url.pathname==='/v1/sec-documento'){
   const cik=url.searchParams.get('cik')||'';
   if([...url.searchParams.keys()].some(k=>k!=='cik')||!/^[0-9]{10}$/.test(cik))
    return json({error:'CIK de 10 dígitos obrigatório'},400);
   const key=new Request(url.origin+'/v1/sec-documento?cik='+cik+'&revision=v771');
   const cache=caches.default,hit=await cache.match(key);
   if(hit)return conditional(request,hit,true);
   try{
    const source='https://data.sec.gov/submissions/CIK'+cik+'.json';
    const response=await fetch(source,{headers:{
     'User-Agent':'DiarioTraderQuant/1.0 (contato@diariotrader.app)',
     Accept:'application/json'},signal:AbortSignal.timeout(11000)});
    if(response.status===403||response.status===429)
     return json({error:'SEC temporariamente bloqueada',code:response.status},503);
    if(!response.ok)return json({error:'Documento SEC indisponível',code:response.status},response.status===404?404:502);
    const data=await response.json();
    if(String(Number(data?.cik))!==String(Number(cik)))return json({error:'CIK divergente da fonte'},502);
    const r=data?.filings?.recent||{},forms=new Set(['10-K','10-Q','10-K/A','10-Q/A','20-F','40-F','20-F/A','40-F/A']);
    const today=new Date().toISOString().slice(0,10),docs=[];
    for(let i=0;i<(Array.isArray(r.form)?r.form.length:0);i++){
     const form=String(r.form[i]||''),reportDate=String(r.reportDate?.[i]||''),
      filingDate=String(r.filingDate?.[i]||''),accessionNumber=String(r.accessionNumber?.[i]||'');
     if(!forms.has(form)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(reportDate)||
       !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(filingDate)||
       !/^[0-9]{10}-[0-9]{2}-[0-9]{6}$/.test(accessionNumber)||
       reportDate>today||filingDate>today||filingDate<reportDate)continue;
     const primary=String(r.primaryDocument?.[i]||'');
     const base='https://www.sec.gov/Archives/edgar/data/'+Number(cik)+'/'+accessionNumber.replaceAll('-','')+'/';
     docs.push({form,reportDate,filingDate,accessionNumber,
      documentUrl:base+(/^[A-Za-z0-9._-]{1,150}$/.test(primary)?primary:''),
      sourceUrl:source});
    }
    docs.sort((a,b)=>b.reportDate.localeCompare(a.reportDate)||b.filingDate.localeCompare(a.filingDate));
    if(!docs.length)return json({ok:false,cik,reason:'Sem documento/competência verificáveis em filings.recent'},404);
    const value={ok:true,cik,...docs[0],model:'sec-submissions-v771'};
    const out=Response.json(value,{headers:{...CORS,
     'Cache-Control':'public, max-age=86400, s-maxage=86400',
     'X-Screeners-Cache':'MISS','X-Snapshot-Source':'sec-edgar-official',
     ETag:'"sec-'+docs[0].accessionNumber+'-'+docs[0].reportDate+'"'}});
    ctx.waitUntil(cache.put(key,out.clone()));
    return conditional(request,out,false);
   }catch{return json({error:'SEC indisponível; sem documentos presumidos'},503)}
  }

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
   const key=new Request(url.origin+'/v1/tecnico-candles?market='+market+'&tf='+tf+'&ticker='+ticker+(tf==='1d'?'&revision=v779-adjusted':''));
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
   let items=[],source='',adjustedSeries=null;
   try{
    if(market==='CRYPTO'){
     // Binance pode devolver HTTP 451 em algumas regiões Cloudflare.
     // Usar apenas candles OHLCV públicos de mercado à vista, sem preços inventados.
     const rangeBin=tf==='1d'?'1d':tf==='1h'?'1h':'15m';
     const bybitInterval=tf==='1d'?'D':tf==='1h'?'60':'15';
     const okxInterval=tf==='1d'?'1D':tf==='1h'?'1H':'15m';
     const sources=[
      {name:'Binance Klines',url:'https://data-api.binance.vision/api/v3/klines?symbol='+ticker+'&interval='+rangeBin+'&limit=750',
       parse:b=>Array.isArray(b)?b.map(x=>[Math.floor(Number(x[0])/1000),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[5])]):[]},
      {name:'Binance Klines',url:'https://api.binance.com/api/v3/klines?symbol='+ticker+'&interval='+rangeBin+'&limit=750',
       parse:b=>Array.isArray(b)?b.map(x=>[Math.floor(Number(x[0])/1000),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[5])]):[]},
      {name:'Bybit Spot Klines',url:'https://api.bybit.com/v5/market/kline?category=spot&symbol='+ticker+'&interval='+bybitInterval+'&limit=750',
       parse:b=>b?.retCode===0&&Array.isArray(b.result?.list)?b.result.list.map(x=>[Math.floor(Number(x[0])/1000),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[5])]):[]},
      {name:'OKX Spot Klines',url:'https://www.okx.com/api/v5/market/history-candles?instId='+ticker.replace(/USDT$/,'-USDT')+'&bar='+okxInterval+'&limit=300',
       parse:b=>b?.code==='0'&&Array.isArray(b.data)?b.data.map(x=>[Math.floor(Number(x[0])/1000),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[5])]):[]},
      {name:'Kraken Spot OHLC (USDT)',url:'https://api.kraken.com/0/public/OHLC?pair='+ticker.replace(/^BTC/,'XBT')+'&interval='+(tf==='1d'?'1440':tf==='1h'?'60':'15'),
       parse:b=>Array.isArray(b?.error)&&!b.error.length&&b?.result?
        Object.entries(b.result).filter(([k,v])=>k!=='last'&&Array.isArray(v)).flatMap(([,rows])=>rows.map(x=>[Number(x[0]),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[6])])):[]},
      {name:'MEXC Spot Klines (USDT)',url:'https://api.mexc.com/api/v3/klines?symbol='+ticker+'&interval='+rangeBin+'&limit=750',
       parse:b=>Array.isArray(b)?b.map(x=>[Math.floor(Number(x[0])/1000),Number(x[1]),Number(x[2]),Number(x[3]),Number(x[4]),Number(x[5])]):[]}
     ];
     const errors=[];
     // Séries diárias <400 barras não suportam o aquecimento/RS deste motor. 
     // Não encerrar na primeira API OKX com apenas 300 barras: tentar Kraken/MEXC.
     const minimumSourceBars=tf==='1d'?401:210;
     for(const provider of sources){
      try{
       const resp=await fetch(provider.url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
       if(!resp.ok){errors.push(provider.name+' HTTP '+resp.status);continue}
       const data=provider.parse(await resp.json()).filter(x=>x.every(Number.isFinite)&&x[0]>0&&x[1]>0&&x[4]>0&&x[2]>=Math.max(x[1],x[4])&&x[3]>0&&x[3]<=Math.min(x[1],x[4])&&x[5]>=0);
       if(data.length<minimumSourceBars){errors.push(provider.name+' histórico incompleto ('+data.length+'/'+minimumSourceBars+')');continue}
       items=data.sort((a,b)=>a[0]-b[0]).slice(-600);
       source=provider.name;
       break;
      }catch{errors.push(provider.name+' indisponível')}
     }
     if(!source)throw Error('Cripto sem OHLCV confiável: '+errors.join('; '));
    }else{
     // Yahoo Chart pode bloquear a borda: recorrer somente a OHLCV verdadeiro.
     const attempts=[];
     const validRows=a=>Array.isArray(a)?a.filter(x=>x.every(Number.isFinite)&&x[0]>0&&x[1]>0&&x[4]>0&&x[2]>=Math.max(x[1],x[4])&&x[3]>0&&x[3]<=Math.min(x[1],x[4])&&x[5]>=0):[];
     for(const h of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
      try{
       const u='https://'+h+'/v8/finance/chart/'+encodeURIComponent(symbol)+'?range='+range+'&interval='+interval+'&includePrePost=false';
       const response=await fetch(u,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});
       if(!response.ok){attempts.push('Yahoo '+response.status);continue}
       const obj=await response.json(),series=obj?.chart?.result?.[0],q=series?.indicators?.quote?.[0];
       if(!Array.isArray(series?.timestamp)||!q)continue;
       const candidate=validRows(series.timestamp.map((t,i)=>[Number(t),Number(q.open?.[i]),Number(q.high?.[i]),Number(q.low?.[i]),Number(q.close?.[i]),Number(q.volume?.[i])]));
       if(candidate.length>=210){
        items=candidate;source='Yahoo Finance Chart (histórico, sujeito a atraso)';
        // Série paralela ajustada para ESTUDO: preços executáveis e gráfico continuam nominais.
        // Ajuste adjclose/close vem do Yahoo; volume não é ajustado e NÃO é certificado por corretora.
        const adj=series.indicators?.adjclose?.[0]?.adjclose;
        if(tf==='1d'&&Array.isArray(adj)&&adj.length===series.timestamp.length){
         const adjusted=validRows(series.timestamp.map((t,i)=>{
          const close=Number(q.close?.[i]),adjustedClose=Number(adj[i]),
           factor=close>0&&adjustedClose>0?adjustedClose/close:NaN;
          return [Number(t),Number(q.open?.[i])*factor,Number(q.high?.[i])*factor,
           Number(q.low?.[i])*factor,adjustedClose,Number(q.volume?.[i])];
         }));
         if(adjusted.length===candidate.length)adjustedSeries=new Map(adjusted.map(x=>[x[0],x]));
        }
        break;
       }
       attempts.push('Yahoo histórico insuficiente');
      }catch{attempts.push('Yahoo indisponível')}
     }
     if(!source&&market==='BR'){
      try{
       // Apenas tickers liberados sem chave pela brapi.
       if(['PETR4','VALE3','ITUB4','MGLU3'].includes(ticker)){
        const r=await fetch('https://brapi.dev/api/quote/'+ticker+'?range='+range+'&interval='+interval,
         {headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
        if(!r.ok){attempts.push('brapi HTTP '+r.status)}
        else{
         const obj=await r.json(),data=obj?.results?.[0],history=data?.historicalDataPrice||data?.data?.historicalDataPrice||[];
         const candidate=validRows(history.map(v=>[Number(v.date),Number(v.open),Number(v.high),Number(v.low),Number(v.close),Number(v.volume)]));
         if(candidate.length>=210){items=candidate;source='brapi.dev OHLCV (histórico, sujeito a atraso)'}
         else attempts.push('brapi histórico insuficiente');
        }
       }
      }catch{attempts.push('brapi indisponível')}
     }
     if(!source&&market==='US'&&tf==='1d'&&ticker!=='SPX'){
      try{
       // Nasdaq publica EOD de ações; não converter EOD em intraday fictício.
       const startDay=new Date(Date.now()-730*86400000).toISOString().slice(0,10),endDay=new Date().toISOString().slice(0,10);
       const u='https://api.nasdaq.com/api/quote/'+encodeURIComponent(ticker)+'/historical?assetclass=stocks&fromdate='+startDay+'&todate='+endDay+'&limit=750';
       const r=await fetch(u,{headers:{Accept:'application/json','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(9000)});
       if(!r.ok)attempts.push('Nasdaq HTTP '+r.status);
       else{
        const obj=await r.json(),history=obj?.data?.tradesTable?.rows||obj?.data?.rows||[];
        const n=x=>Number(String(x??'').replace(/[$,]/g,''));
        const candidate=validRows(history.map(v=>[Math.floor(new Date(v.date).getTime()/1000),n(v.open),n(v.high),n(v.low),n(v.close),n(v.volume)]));
        if(candidate.length>=210){items=candidate;source='Nasdaq EOD (histórico diário, sujeito a atraso)'}
        else attempts.push('Nasdaq histórico insuficiente: '+candidate.length+' barras');
       }
      }catch{attempts.push('Nasdaq indisponível')}
     }
     if(!source)throw Error('Ações sem OHLCV suficiente: '+attempts.slice(0,5).join('; '));
    }
    items=items.filter(x=>x.every(Number.isFinite)&&x[0]>0&&x[1]>0&&x[4]>0&&x[2]>=Math.max(x[1],x[4])&&x[3]>0&&x[3]<=Math.min(x[1],x[4])&&x[5]>=0)
      .sort((a,b)=>a[0]-b[0])
      .filter((x,i,a)=>i===0||x[0]!==a[i-1][0]).slice(-600);
    // Apenas barras fechadas e verificadas: nunca promover médias com candles parciais.
     const barSeconds=tf==='1d'?86400:tf==='1h'?3600:900;
     const nowSeconds=Math.floor(Date.now()/1000);
     items=items.filter(x=>x[0]+barSeconds<=nowSeconds);
     if(items.length<250)return json({error:'Não confirmado / Não calculável — menos de 250 barras completas',candles:items.length},422);
     // RS e backtest precisam mais que 252 barras de aquecimento. Histórico incompleto permanece N/D.
     if(tf==='1d'&&items.length<400)return json({error:'Histórico diário menor que 400 barras; RS/backtest não certificado',candles:items.length},422);
     const adjustedCandles=tf==='1d'&&adjustedSeries?
      items.map(x=>adjustedSeries.get(x[0])).filter(Boolean):null;
     const adjustedReady=Array.isArray(adjustedCandles)&&adjustedCandles.length===items.length;
     const lastAsOf=items.at(-1)[0],maxLagDays=tf==='1d'?(market==='CRYPTO'?2:7):(market==='CRYPTO'?1:5);
     if(lastAsOf>nowSeconds||nowSeconds-lastAsOf>maxLagDays*86400)
      return json({error:'Não confirmado / Não calculável — barras desatualizadas',as_of:new Date(lastAsOf*1000).toISOString()},503);
    const ttl=tf==='1d'?900:300;
    const response=Response.json({ok:true,ticker,market,tf,source,fetchedAt:new Date().toISOString(),as_of:new Date(items.at(-1)[0]*1000).toISOString(),candles:items,
      adjustedCandles:adjustedReady?adjustedCandles:null,
      adjustmentBasis:adjustedReady?'Yahoo adjclose/close; volume não ajustado; exploratório':null,
      adjustedVerified:false},
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