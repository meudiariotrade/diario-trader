import {autenticarUsuario} from './auth-jwks-v924.mjs';
import {servePublicSnapshot,refreshBoth,SCREENER_CRON} from './snapshot-cache-v896.mjs';
import {resumoAurea} from './aurea-resumao-v904.mjs';
import {estatisticasV932} from './estatisticas-v932.mjs';
import {explicarV932} from './explica-v932.mjs';
import {estudosV932} from './estudos-v932.mjs';
import {diarioIaV933} from './diario-ia-v933.mjs';
import {extrasV936} from './extras-v936.mjs';
import {centralV939} from './central-v939.mjs';
// Snapshot público e imutável por janela de cache. Nenhum JWT, carteira ou segredo sai do Worker.
const CACHE_CONTROL='public, max-age=900, s-maxage=1800';
const CORS={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Methods':'GET, OPTIONS',
 'Access-Control-Allow-Headers':'if-none-match, authorization',
 'Access-Control-Expose-Headers':'ETag, X-Screeners-Cache, X-Snapshot-Source',
};
const json=(value,status=200)=>Response.json(value,{status,headers:{...CORS,'Cache-Control':'no-store'}});
function conditional(req,response,hit,policy=CACHE_CONTROL){
 const headers=new Headers(response.headers);
 for(const [key,value] of Object.entries(CORS))headers.set(key,value);
 headers.set('Cache-Control',policy);
 headers.set('X-Screeners-Cache',hit?'HIT':'MISS');
 headers.set('X-Snapshot-Source','cloudflare-edge-public');
 const tag=headers.get('ETag'),cond=req.headers.get('If-None-Match')?.trim();
 if(tag&&cond&&(cond===tag||cond==='W/'+tag))
  return new Response(null,{status:304,headers});
 return new Response(response.body,{status:response.status,headers});
}
// v861 — voz das aulas por IA (Gemini TTS, API oficial) na borda. Texto público da lição → WAV em cache de borda.
// Só gera para quem está logado no app (token Supabase conferido apenas quando não há cache).
const VOZES=new Set(['Charon','Kore','Puck','Fenrir','Aoede','Orus']);
async function sha256Hex(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
function wav(pcm,rate=24000){const b=new Uint8Array(44+pcm.length),v=new DataView(b.buffer),t=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i)};
 t(0,'RIFF');v.setUint32(4,36+pcm.length,true);t(8,'WAVE');t(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);t(36,'data');v.setUint32(40,pcm.length,true);b.set(pcm,44);return b}
async function geminiTTS(env,texto,voz){
 const instr='Narre exatamente este texto em português brasileiro natural, como um professor experiente e acolhedor de análise técnica. Tom claro, conversacional, pausas naturais. Não invente nem acrescente palavras. Texto: '+texto;
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',{method:'POST',
  headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},signal:AbortSignal.timeout(110000),
  body:JSON.stringify({contents:[{parts:[{text:instr}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voz}}}}})});
 const out=await r.json().catch(()=>({}));if(!r.ok)throw Error('IA de voz respondeu '+r.status);
 const d=(out?.candidates?.[0]?.content?.parts||[]).find(x=>x.inlineData?.data)?.inlineData;if(!d?.data)throw Error('IA não devolveu áudio');
 const bin=atob(d.data),raw=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)raw[i]=bin.charCodeAt(i);
 if(raw.length>20e6)throw Error('Áudio grande demais');
 const rate=Number(/rate=(\d+)/.exec(String(d.mimeType||''))?.[1]||24000);
 return String(d.mimeType||'').includes('wav')?raw:wav(raw,rate);
}
async function logado(env,req){
 try{return Boolean(await autenticarUsuario(env,req))}catch{return false}
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/v1/aurea-resumao')return resumoAurea(request,env);
  if(url.pathname==='/v1/ia-estatisticas')return estatisticasV932(request,env);
  if(url.pathname==='/v1/ia-explica')return explicarV932(request,env);
  if(url.pathname==='/v1/ia-estudos')return estudosV932(request,env);
  if(url.pathname==='/v1/ia-diario')return diarioIaV933(request,env);
  if(url.pathname==='/v1/ia-extras')return extrasV936(request,env);
  if(url.pathname==='/v1/ia-central')return centralV939(request,env);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
  if(request.method!=='GET')return json({error:'Somente leitura'},405);
  if(url.pathname==='/health')return json({ok:true,servico:'screeners-edge',sem_dados_privados:true});
  if(url.pathname==='/v1/voz'){
   const texto=String(url.searchParams.get('t')||'').replace(/\s+/g,' ').trim(),voz=url.searchParams.get('v')||'Charon';
   if([...url.searchParams.keys()].some(k=>!['t','v'].includes(k))||texto.length<2||texto.length>2500||!VOZES.has(voz))
    return json({error:'Texto ou voz inválidos'},400);
   const cache=caches.default,key=new Request(url.origin+'/v1/voz?k='+(await sha256Hex(voz+'|'+texto)).slice(0,40)+'&rev=v861');
   const hit=await cache.match(key);if(hit)return hit;
   if(!env.GEMINI_API_KEY)return json({error:'Voz por IA ainda não configurada na Cloudflare (GEMINI_API_KEY)'},503);
   if(!await logado(env,request))return json({error:'Entre na conta do app para gerar a voz'},401);
   try{
    const audio=await geminiTTS(env,texto,voz);
    const out=new Response(audio,{headers:{...CORS,'Content-Type':'audio/wav','Cache-Control':'public, max-age=2592000, s-maxage=2592000','X-Snapshot-Source':'gemini-tts-borda'}});
    ctx.waitUntil(cache.put(key,out.clone()));return out;
   }catch(e){return json({error:'Voz indisponível agora',detalhe:String(e?.message||e).slice(0,120)},503)}
  }
   // v805 — Texto público via Cloudflare com allowlist e sem redirecionamentos.
   if(url.pathname==='/v1/biblioteca-texto'){
     const source=url.searchParams.get('url')||'';
     if([...url.searchParams.keys()].some(k=>k!=='url')||source.length>1000)return json({erro:'URL inválida'},400);
     let target;try{target=new URL(source)}catch{return json({erro:'URL inválida'},400)}
     const host=target.hostname.toLowerCase();
     const allow=['www.cvm.gov.br','cvm.gov.br','www.gov.br','gov.br','www.bcb.gov.br','bcb.gov.br','www.sec.gov','sec.gov','www.federalreserve.gov','federalreserve.gov','www.infomoney.com.br','infomoney.com.br','www.moneytimes.com.br','moneytimes.com.br','www.reuters.com','reuters.com','www.cnbc.com','cnbc.com','www.bloomberglinea.com','bloomberglinea.com'];
     if(target.protocol!=='https:'||target.username||target.password||target.port||!allow.includes(host)||/\\/.test(source))return json({erro:'Fonte não autorizada; cole o texto com permissão'},403);
     const cache=caches.default,cacheKey=new Request(url.toString(),{method:'GET'}),hit=await cache.match(cacheKey);
     if(hit)return hit;
     try{const r=await fetch(target.toString(),{redirect:'manual',headers:{Accept:'text/html,text/plain'},signal:AbortSignal.timeout(10000)});
       const mime=r.headers.get('content-type')||'',bytes=Number(r.headers.get('content-length')||0);
       if(!r.ok||bytes>600000||!/(text\/html|text\/plain)/i.test(mime))return json({erro:'Artigo público não acessível'},422);
       const html=await r.text();if(html.length>600000)return json({erro:'Artigo acima de 600 KB'},413);
       const plain=html.replace(/<(script|style|noscript|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
         .replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp|quot|lt|gt);/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,75000);
       if(plain.length<150)return json({erro:'Sem texto público aproveitável'},422);
       const out=Response.json({texto:plain,origem:target.toString(),publico:true},{headers:{...CORS,'Cache-Control':'public,max-age=900,s-maxage=1800'}});
       ctx.waitUntil(cache.put(cacheKey,out.clone()));return out;
     }catch{return json({erro:'Extração indisponível; cole texto autorizado'},503)}
   }


  // v773 — reduzir companyfacts SEC na borda: 1 download oficial, resposta XBRL compacta.
  // Nem Supabase nem cliente baixam JSON volumoso; nenhuma credencial via cache público.
  if(url.pathname==='/v1/sec-xbrl'){
   const cik=url.searchParams.get('cik')||'';
   if([...url.searchParams.keys()].some(k=>k!=='cik')||!/^[0-9]{10}$/.test(cik))
    return json({error:'CIK obrigatório'},400);
   const key=new Request(url.origin+'/v1/sec-xbrl?cik='+cik+'&revision=v858-concepts');
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
     'us-gaap':['Assets','AssetsCurrent','LiabilitiesCurrent','StockholdersEquity','Liabilities','CashAndCashEquivalentsAtCarryingValue','LongTermDebtNoncurrent','LongTermDebtCurrent','OperatingIncomeLoss','NetIncomeLoss','Revenues',
      'RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax',
      'SalesRevenueNet','EarningsPerShareBasic','EarningsPerShareDiluted','WeightedAverageNumberOfDilutedSharesOutstanding','WeightedAverageNumberOfSharesOutstandingBasic','CommonStockSharesOutstanding','PaymentsOfDividends','NetCashProvidedByUsedInOperatingActivities',
      'PaymentsToAcquirePropertyPlantAndEquipment','PaymentsForRepurchaseOfCommonStock','ProceedsFromIssuanceOfCommonStock','PaymentsOfDividendsCommonStock','PaymentsToAcquireProductiveAssets','PaymentsForCapitalImprovements','PaymentsToAcquireOilAndGasPropertyAndEquipment','PaymentsToAcquireOilAndGasProperty'],
     'ifrs-full':['Assets','CurrentAssets','CurrentLiabilities','Equity','EquityAttributableToOwnersOfParent','Liabilities','CashAndCashEquivalents','ProfitLoss','Revenue',
      'RevenueFromContractsWithCustomers','ProfitLossAttributableToOwnersOfParent',
      'BasicEarningsLossPerShare','DilutedEarningsLossPerShare','WeightedAverageShares','CashFlowsFromUsedInOperatingActivities',
      'PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities','DividendsPaidClassifiedAsFinancingActivities'],
     'dei':['EntityCommonStockSharesOutstanding']
    };
    const eligible=new Set(['10-K','10-Q','10-K/A','10-Q/A','20-F','40-F','20-F/A','40-F/A']);
    const minimum=new Date(Date.now()-4*366*86400000).toISOString().slice(0,10);
    const today=new Date().toISOString().slice(0,10),facts={};
    for(const [group,tags] of Object.entries(concepts)){
     const result={};
     for(const tag of tags){
      const units=source.facts[group]?.[tag]?.units||{},selected={};
      for(const [unit,rows] of Object.entries(units)){
       const shareTags=new Set(['CommonStockSharesOutstanding','WeightedAverageNumberOfDilutedSharesOutstanding','WeightedAverageNumberOfSharesOutstandingBasic','WeightedAverageShares','EntityCommonStockSharesOutstanding']);
       const epsTags=new Set(['EarningsPerShareBasic','EarningsPerShareDiluted','BasicEarningsLossPerShare','DilutedEarningsLossPerShare']);
       const allowed=shareTags.has(tag)?unit==='shares':epsTags.has(tag)?/^(USD|EUR|CAD|GBP|BRL|CHF|JPY)\/shares$/.test(unit):/^(USD|EUR|CAD|GBP|BRL|CHF|JPY)$/.test(unit);
       if(!allowed||!Array.isArray(rows))continue;
       const valid=rows.filter(r=>eligible.has(String(r.form))&&
        /^\d{4}-\d{2}-\d{2}$/.test(String(r.end||''))&&r.end>=minimum&&r.end<=today&&
        /^\d{4}-\d{2}-\d{2}$/.test(String(r.filed||''))&&r.filed>=r.end&&r.filed<=today&&
        (r.start==null||(/^\d{4}-\d{2}-\d{2}$/.test(String(r.start))&&r.start<=r.end))&&
        /^\d{10}-\d{2}-\d{6}$/.test(String(r.accn||''))&&
        typeof r.val==='number'&&Number.isFinite(r.val));
       valid.sort((a,b)=>b.filed.localeCompare(a.filed)||b.end.localeCompare(a.end));
       const annual=valid.filter(r=>/^(10-K|20-F|40-F)/.test(r.form)).slice(0,16);
       const quarterly=valid.filter(r=>/^(10-Q)/.test(r.form)).slice(0,20);
       const dedup=new Map();
       for(const r of [...annual,...quarterly])dedup.set(r.accn+'|'+r.end+'|'+(r.start||'')+'|'+r.form,{
        accn:r.accn,form:r.form,start:r.start||null,end:r.end,filed:r.filed,val:r.val,
        fy:Number.isInteger(r.fy)?r.fy:null,fp:typeof r.fp==='string'?r.fp.slice(0,4):null,frame:typeof r.frame==='string'?r.frame.slice(0,32):null});
       if(dedup.size)selected[unit]=[...dedup.values()];
      }
      if(Object.keys(selected).length)result[tag]={units:selected};
     }
     if(Object.keys(result).length)facts[group]=result;
    }
    if(!Object.keys(facts).length)return json({error:'Sem conceitos XBRL aceitos (não inferir métricas)'},404);
    const body={cik:Number(cik),entityName:String(source.entityName||'').slice(0,140),facts,
     fonte_oficial:urlSec,transformacao:'sec-xbrl-compact-v782'};
    const out=Response.json(body,{headers:{...CORS,
     'Cache-Control':'public, max-age=43200, s-maxage=43200',
     'X-Screeners-Cache':'MISS','X-Snapshot-Source':'sec-edgar-xbrl-compact',
     ETag:'"xbrl-'+cik+'-'+Date.now()+'"'}});
    ctx.waitUntil(cache.put(key,out.clone()));return conditional(request,out,false);
   }catch{return json({error:'SEC XBRL não confirmado; manter indicadores nulos'},503)}
  }

  // v847 — histórico anual (10 exercícios DFP) de uma companhia, recortado do espelho público CVM no GitHub.
  if(url.pathname==='/v1/cvm-historico'){
   const ticker=(url.searchParams.get('ticker')||'').toUpperCase();
   if([...url.searchParams.keys()].some(k=>k!=='ticker')||!/^[A-Z]{4}\d{1,2}$/.test(ticker))return json({error:'Ticker B3 obrigatório'},400);
   const cache=caches.default,key=new Request(url.origin+'/v1/cvm-historico?ticker='+ticker+'&rev=v847');
   const hit=await cache.match(key);if(hit)return conditional(request,hit,true);
   try{
    const fileKey=new Request(url.origin+'/v1/cvm-historico-arquivo?rev=v847');
    let file=await cache.match(fileKey);
    if(!file){
     const r=await fetch('https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/cvm-historico.json',{signal:AbortSignal.timeout(15000)});
     if(!r.ok)return json({error:'Histórico CVM ainda não gerado'},503);
     const txt=await r.text();if(txt.length>12_000_000)return json({error:'Histórico CVM acima do limite'},502);
     file=new Response(txt,{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=43200'}});
     ctx.waitUntil(cache.put(fileKey,file.clone()));
    }
    const all=await file.json(),cnpj=all?.tickers?.[ticker],emp=cnpj&&all.empresas?.[cnpj];
    if(!emp)return json({error:'Sem histórico CVM para '+ticker},404);
    const body={ok:true,ticker,cnpj,nome:emp.n,setor:emp.s,anos:emp.a,exercicios:all.exercicios,gerado_em:all.gerado_em,fonte:all.fonte,campos:all.campos};
    const out=Response.json(body,{headers:{...CORS,'Cache-Control':'public, max-age=43200, s-maxage=43200','X-Snapshot-Source':'cvm-historico-github',ETag:'"cvmh-'+ticker+'-'+String(all.gerado_em||'').slice(0,10)+'"'}});
    ctx.waitUntil(cache.put(key,out.clone()));return conditional(request,out,false);
   }catch{return json({error:'Histórico CVM não confirmado'},503)}
  }
  // v859 — fundamentos anuais SEC dos EUA (gerados no GitHub Actions), servidos com cache de borda.
  if(url.pathname==='/v1/sec-fundamentos'){
   if([...url.searchParams.keys()].length)return json({error:'Sem parâmetros'},400);
   const cache=caches.default,key=new Request(url.origin+'/v1/sec-fundamentos?rev=v859');
   const hit=await cache.match(key);if(hit)return conditional(request,hit,true);
   try{
    const r=await fetch('https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/sec-fundamentos.json',{signal:AbortSignal.timeout(15000)});
    if(!r.ok)return json({error:'Fundamentos SEC ainda não gerados'},503);
    const txt=await r.text();if(txt.length>8_000_000)return json({error:'Arquivo SEC acima do limite'},502);
    const all=JSON.parse(txt);if(!all?.tickers||typeof all.tickers!=='object')return json({error:'Formato SEC inválido'},502);
    const out=new Response(txt,{headers:{...CORS,'Content-Type':'application/json','Cache-Control':'public, max-age=21600, s-maxage=21600',
     'X-Snapshot-Source':'sec-fundamentos-github',ETag:'"secf-'+String(all.gerado_em||'').slice(0,16)+'"'}});
    ctx.waitUntil(cache.put(key,out.clone()));return conditional(request,out,false);
   }catch{return json({error:'Fundamentos SEC não confirmados'},503)}
  }
  // v849 — histórico anual (até 10 exercícios) de empresa dos EUA a partir do SEC XBRL Companyfacts (10-K/20-F/40-F).
  if(url.pathname==='/v1/sec-historico'){
   const ticker=(url.searchParams.get('ticker')||'').toUpperCase();
   if([...url.searchParams.keys()].some(k=>k!=='ticker')||!/^[A-Z]{1,5}(?:[.-][A-Z])?$/.test(ticker))return json({error:'Ticker EUA obrigatório'},400);
   const cache=caches.default,key=new Request(url.origin+'/v1/sec-historico?ticker='+ticker+'&rev=v850');
   const hit=await cache.match(key);if(hit)return conditional(request,hit,true);
   const UA={'User-Agent':'DiarioTraderQuant/1.0 (contato@diariotrader.app)',Accept:'application/json'};
   try{
    const mapKey=new Request(url.origin+'/v1/sec-tickers?rev=v849');let mapa=await cache.match(mapKey);
    if(!mapa){const r=await fetch('https://www.sec.gov/files/company_tickers.json',{headers:UA,signal:AbortSignal.timeout(12000)});
     if(!r.ok)return json({error:'Lista de tickers da SEC indisponível'},503);
     const raw=await r.json(),m={};for(const x of Object.values(raw||{}))if(x?.ticker&&x?.cik_str)m[String(x.ticker).toUpperCase()]=String(x.cik_str).padStart(10,'0');
     mapa=new Response(JSON.stringify(m),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=604800'}});ctx.waitUntil(cache.put(mapKey,mapa.clone()));}
    const tab=await mapa.json(),cik=tab[ticker]||tab[ticker.replace('.','-')];
    if(!cik)return json({error:'Ticker não encontrado na SEC'},404);
    const r=await fetch('https://data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json',{headers:UA,signal:AbortSignal.timeout(16000)});
    if(!r.ok)return json({error:'SEC Companyfacts indisponível',code:r.status},r.status===404?404:502);
    const txt=await r.text();if(txt.length>40_000_000)return json({error:'Arquivo XBRL acima do limite'},413);
    const src=JSON.parse(txt),F=src?.facts||{},anuais=new Set(['10-K','10-K/A','20-F','20-F/A','40-F','40-F/A']);
    const DIAS=864e5;
    // Valor anual por exercício: duração ~1 ano (fluxos) ou posição no fim do exercício (saldos); vale o arquivo mais recente.
    const serie=(tags,tipo)=>{const out={};
     for(const [grupo,tag] of tags){const units=F[grupo]?.[tag]?.units||{},tagOut={};
      for(const [u,rows] of Object.entries(units)){if(tipo==='acoes'?u!=='shares':!/^(USD|EUR|CAD|GBP|BRL|CHF|JPY|CNY|TWD|KRW|INR|MXN|AUD|SEK|DKK|NOK|ILS|HKD)$/.test(u))continue;
       for(const x of rows||[]){if(!anuais.has(String(x.form))||typeof x.val!=='number'||!/^\d{4}-\d{2}-\d{2}$/.test(String(x.end||'')))continue;
        if(tipo==='fluxo'){if(!x.start)continue;const d=(Date.parse(x.end)-Date.parse(x.start))/DIAS;if(d<330||d>400)continue}
        const ano=Number(String(x.end).slice(0,4)),old=tagOut[ano];
        if(!old||String(x.filed)>old.filed||(String(x.filed)===old.filed&&String(x.end)>old.end))tagOut[ano]={v:x.val,filed:String(x.filed),end:String(x.end),moeda:u}}
      }
      // Empresas trocam de conceito ao longo dos anos (ex.: Revenues → RevenueFromContract...): cada ano usa o primeiro conceito da lista que o tenha.
      for(const [a,val] of Object.entries(tagOut))if(!out[a])out[a]=val;}
     return out};
    const G='us-gaap',I='ifrs-full';
    const campos={
     rec:serie([[G,'Revenues'],[G,'RevenueFromContractWithCustomerExcludingAssessedTax'],[G,'SalesRevenueNet'],[G,'RevenuesNetOfInterestExpense'],[I,'Revenue']],'fluxo'),
     luc:serie([[G,'NetIncomeLoss'],[G,'ProfitLoss'],[I,'ProfitLossAttributableToOwnersOfParent'],[I,'ProfitLoss']],'fluxo'),
     pl:serie([[G,'StockholdersEquity'],[G,'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],[I,'EquityAttributableToOwnersOfParent'],[I,'Equity']],'saldo'),
     at:serie([[G,'Assets'],[I,'Assets']],'saldo'),
     cx:serie([[G,'CashAndCashEquivalentsAtCarryingValue'],[G,'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],[I,'CashAndCashEquivalents']],'saldo'),
     div:serie([[G,'LongTermDebt'],[G,'LongTermDebtNoncurrent'],[I,'Borrowings'],[I,'NoncurrentBorrowings']],'saldo'),
     dvd:serie([[G,'PaymentsOfDividends'],[G,'PaymentsOfDividendsCommonStock'],[I,'DividendsPaidClassifiedAsFinancingActivities']],'fluxo'),
     acoes:serie([[G,'WeightedAverageNumberOfDilutedSharesOutstanding'],[G,'WeightedAverageNumberOfSharesOutstandingBasic'],[I,'WeightedAverageShares']],'acoes')};
    const anosTodos=[...new Set(Object.values(campos).flatMap(o=>Object.keys(o).map(Number)))].sort((a,b)=>a-b).slice(-10),anos={};
    let moeda=null;
    for(const a of anosTodos){const o={};for(const [k,ser] of Object.entries(campos))if(ser[a]){o[k]=Math.round(k==='dvd'?Math.abs(ser[a].v):ser[a].v);if(k==='rec'||k==='luc')moeda=moeda||ser[a].moeda}
     if(o.rec!=null||o.luc!=null||o.pl!=null)anos[a]=o}
    if(Object.keys(anos).length<2)return json({error:'Sem balanços anuais suficientes na SEC'},404);
    const ks=Object.keys(anos);
    const body={ok:true,ticker,cik:Number(cik),nome:String(src.entityName||'').slice(0,140),setor:'',anos,exercicios:[Number(ks[0]),Number(ks[ks.length-1])],moeda:moeda||'USD',
     gerado_em:new Date().toISOString(),fonte:'SEC EDGAR XBRL Companyfacts (10-K/20-F/40-F)',fonte_oficial:'https://data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json'};
    const out=Response.json(body,{headers:{...CORS,'Cache-Control':'public, max-age=86400, s-maxage=86400','X-Snapshot-Source':'sec-historico'}});
    ctx.waitUntil(cache.put(key,out.clone()));return conditional(request,out,false);
   }catch{return json({error:'Histórico SEC não confirmado'},503)}
  }
  // v847 — preço mensal de 10 anos com dividendos (Yahoo), para valor de mercado, DY e retorno total.
  if(url.pathname==='/v1/historico-preco'){
   const ticker=(url.searchParams.get('ticker')||'').toUpperCase(),market=url.searchParams.get('market')||'BR';
   if([...url.searchParams.keys()].some(k=>!['ticker','market'].includes(k))||!['BR','US'].includes(market)||
    (market==='BR'&&!/^[A-Z]{4}\d{1,2}$/.test(ticker))||(market==='US'&&!/^[A-Z]{1,5}(?:\.[A-Z])?$/.test(ticker)))return json({error:'Ticker inválido'},400);
   const cache=caches.default,key=new Request(url.origin+'/v1/historico-preco?market='+market+'&ticker='+ticker+'&rev=v850');
   const hit=await cache.match(key);if(hit)return conditional(request,hit,true);
   const symbol=market==='BR'?ticker+'.SA':ticker;
   for(const h of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
    try{
     const r=await fetch('https://'+h+'/v8/finance/chart/'+encodeURIComponent(symbol)+'?range=10y&interval=1mo&events=div&includePrePost=false',{headers:{'User-Agent':'Mozilla/5.0',Accept:'application/json'},signal:AbortSignal.timeout(8000)});
     if(!r.ok)continue;
     const o=await r.json(),sr=o?.chart?.result?.[0],q=sr?.indicators?.quote?.[0],adj=sr?.indicators?.adjclose?.[0]?.adjclose;
     if(!Array.isArray(sr?.timestamp)||!q)continue;
     const meses=sr.timestamp.map((t,i)=>[Number(t),Number(q.close?.[i]),Number(adj?.[i])]).filter(x=>x[0]>0&&x[1]>0).map(x=>[x[0],Math.round(x[1]*10000)/10000,x[2]>0?Math.round(x[2]*10000)/10000:null]);
     const divs=Object.values(sr.events?.dividends||{}).map(d=>[Number(d.date),Number(d.amount)]).filter(d=>d[0]>0&&d[1]>0).sort((a,b)=>a[0]-b[0]);
     if(meses.length<12)continue;
     const out=Response.json({ok:true,ticker,market,moeda:sr.meta?.currency||null,meses,dividendos:divs,fonte:'Yahoo Finance (mensal, 10 anos; dividendos por ação, sujeito a atraso)'},
      {headers:{...CORS,'Cache-Control':'public, max-age=43200, s-maxage=43200','X-Snapshot-Source':'yahoo-historico-mensal'}});
     ctx.waitUntil(cache.put(key,out.clone()));return conditional(request,out,false);
    }catch{}
   }
   return json({error:'Histórico de preço indisponível'},503);
  }
  // v772 — espelhos públicos CVM produzidos semanalmente no GitHub, com cache de borda 24h.
  // Sem CPF, carteira, operações ou dados personalizados, com limites de tamanho e esquema.
  // v876: espelho público do Análises+ (lucro CVM e retornos diários por ticker), cache de 1 h na borda.
  if(url.pathname==='/v1/analises-plus'){
   const key=new Request(url.origin+'/v1/analises-plus'),cache=caches.default,hit=await cache.match(key);
   if(hit)return conditional(request,hit,true);
   try{const r=await fetch('https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/analises-plus.json',{signal:AbortSignal.timeout(15000)});
    if(!r.ok)return json({error:'Arquivo Análises+ indisponível'},503);
    const txt=await r.text();if(txt.length>3000000)return json({error:'Arquivo acima do limite'},502);
    const d=JSON.parse(txt);if(d?.versao!==1||!d.crescimento||!d.retornos)return json({error:'Esquema inválido'},502);
    const res=new Response(txt,{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=3600','access-control-allow-origin':'*'}});
    await cache.put(key,res.clone());return conditional(request,res,false);
   }catch{return json({error:'Falha ao ler Análises+'},502)}
  }
  // v896: espelho público de Fundos Imobiliários (FIIs da B3), cache de 4h na borda.
  if(url.pathname==='/v1/fiis'){
   const key=new Request(url.origin+'/v1/fiis'),cache=caches.default,hit=await cache.match(key);
   if(hit)return conditional(request,hit,true);
   try{
    const r=await fetch('https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/fiis.json',{signal:AbortSignal.timeout(15000)});
    if(!r.ok)return json({error:'Arquivo de FIIs indisponível'},503);
    const txt=await r.text();if(txt.length>3000000)return json({error:'Arquivo de FIIs acima do limite'},502);
    const d=JSON.parse(txt);if(d?.versao!==1||!Array.isArray(d.rows))return json({error:'Esquema de FIIs inválido'},502);
    const res=new Response(txt,{headers:{...CORS,'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=14400, s-maxage=14400','X-Snapshot-Source':'fiis-github-b3'}});
    ctx.waitUntil(cache.put(key,res.clone()));return conditional(request,res,false);
   }catch{return json({error:'Falha ao ler FIIs'},502)}
  }
  // v914: espelho público do Termômetro Fiscal e Dívida Pública (BCB SGS + Global), cache de 6h na borda.
  if(url.pathname==='/v1/macro-fiscal'){
   const key=new Request(url.origin+'/v1/macro-fiscal'),cache=caches.default,hit=await cache.match(key);
   if(hit)return conditional(request,hit,true);
   try{
    const r=await fetch('https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/macro-fiscal.json',{signal:AbortSignal.timeout(15000)});
    if(!r.ok)return json({error:'Arquivo Macro-Fiscal indisponível'},503);
    const txt=await r.text();if(txt.length>500000)return json({error:'Arquivo Macro-Fiscal acima do limite'},502);
    const d=JSON.parse(txt);if(d?.versao!==1||!d.brasil)return json({error:'Esquema Macro-Fiscal inválido'},502);
    const res=new Response(txt,{headers:{...CORS,'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=21600, s-maxage=21600','X-Snapshot-Source':'macro-fiscal-bcb-github'}});
    ctx.waitUntil(cache.put(key,res.clone()));return conditional(request,res,false);
   }catch{return json({error:'Falha ao ler Macro-Fiscal'},502)}
  }
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

  if(url.pathname==='/v1/screeners')return servePublicSnapshot(request,env,ctx);
  return json({error:'Rota nao encontrada'},404);
 },
 async scheduled(controller,env){
  if(controller.cron!==SCREENER_CRON)return;
  await refreshBoth(env);
 }
};
