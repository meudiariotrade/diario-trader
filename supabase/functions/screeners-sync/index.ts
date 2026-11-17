// Catalogo institucional BR/EUA, sincronizacao somente por cron autorizado, sem polling ou dados privados.
import { scoreEngine } from '../_shared/score-engine.js';
const SB=Deno.env.get('SUPABASE_URL')||'', SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const HEAD={apikey:SVC,Authorization:'Bearer '+SVC,'Content-Type':'application/json'};
const now=new Date().toISOString().slice(0,10);
const ok=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const clean=(s:unknown)=>String(s||'').trim().toUpperCase();
const numeric=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?n:null;
async function fetchText(url:string){const r=await fetch(url,{headers:{'User-Agent':'DiarioTrader-Catalogo/742','Accept':'text/plain,*/*'},signal:AbortSignal.timeout(13000)});if(!r.ok)throw Error('Fonte HTTP '+r.status);const s=await r.text();if(s.length>4_000_000)throw Error('Fonte muito grande');return s}
async function rpc(name:string,args:unknown){const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:HEAD,body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(name+' HTTP '+r.status+': '+(await r.text()).slice(0,100));
 const payload=await r.text();return payload?JSON.parse(payload):null}
async function autorizado(req:Request){
 const token=req.headers.get('x-cron-secret')||'';if(!token||!SB||!SVC)return false;
 const esperado=await rpc('diario_agendamento_chave',{}).catch(()=>null);
 if(typeof esperado!=='string'||esperado.length!==token.length)return false;
 let x=0;for(let i=0;i<token.length;i++)x|=esperado.charCodeAt(i)^token.charCodeAt(i);return x===0;
}
async function lotes(market:string,rows:any[]){
 let escritos=0;for(let i=0;i<rows.length;i+=200){escritos+=Number(await rpc('quant_screeners_lote',{p_market:market,p_rows:rows.slice(i,i+200)}))||0;}
 return escritos;
}
function table(text:string){const lines=text.replaceAll(String.fromCharCode(13),'').split(String.fromCharCode(10)).filter(x=>x.includes('|'));if(lines.length<2)throw Error('Diretorio de ativos vazio');
 const header=lines.shift()!.split('|');return lines.filter(x=>!x.startsWith('File Creation Time:')).map(line=>Object.fromEntries(line.split('|').map((value,i)=>[header[i],value||''])));}
async function catalogoUS(){
 const urls=['https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt','https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt'];
 const rr=await Promise.all(urls.map(x=>fetchText(x)));
 const nas=table(rr[0]).filter((r:any)=>r['Test Issue']==='N'&&r.ETF==='N').map((r:any)=>({ticker:clean(r.Symbol),company_name:r['Security Name'],exchange:'NASDAQ',security_type:/\b(UNIT|WARRANT|RIGHT|PREFERRED|NOTE|ETF|ETN|FUND)\b/i.test(r['Security Name'])?'other':'stock',fonte_principal:'Nasdaq Trader · Symbol Directory',dados_status:'catalogado'}));
 const ny=table(rr[1]).filter((r:any)=>r.Exchange==='N'&&r.ETF==='N'&&r['Test Issue']==='N').map((r:any)=>({ticker:clean(r['ACT Symbol']),company_name:r['Security Name'],exchange:'NYSE',security_type:/\b(UNIT|WARRANT|RIGHT|PREFERRED|NOTE|ETF|ETN|FUND)\b/i.test(r['Security Name'])?'other':'stock',fonte_principal:'Nasdaq Trader · Other Listed',dados_status:'catalogado'}));
 const unique=[...new Map([...ny,...nas].filter(r=>/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(r.ticker)&&r.company_name).map(r=>[r.exchange+':'+r.ticker,r])).values()];
 const gravados=await lotes('US',unique);
 for(let i=0;i<unique.length;i+=180)await rpc('quant_v2_classificar_us',{p_rows:unique.slice(i,i+180).map(({ticker,exchange,security_type})=>({ticker,exchange,security_type}))});
 return {encontrados:unique.length,gravados,fonte:'Nasdaq Trader',classificados:unique.length};
}
async function catalogoBR(){
 const all:any[]=[];
 for(let page=1;page<=8;page++){
  const url='https://brapi.dev/api/quote/list?type=stock&limit=1500&page='+page;
  const r=await fetch(url,{signal:AbortSignal.timeout(14000),headers:{Accept:'application/json',...(Deno.env.get('BRAPI_TOKEN')?{Authorization:'Bearer '+Deno.env.get('BRAPI_TOKEN')}: {})}});
  if(!r.ok)throw Error('Catalogo brapi HTTP '+r.status);
  const j=await r.json();const list=Array.isArray(j.stocks)?j.stocks:[];
  if(page===1&&!list.length)throw Error('brapi sem catalogo de acoes');
  for(const a of list){const t=clean(a.stock||a.ticker||a.symbol);if(!/^[A-Z]{4}[0-9]{1,2}$/.test(t))continue;
   all.push({ticker:t,empresa:String(a.name||a.longName||t).slice(0,200),setor:a.sector||null,segmento:a.industry||null,
    valor_mercado_brl:numeric(a.market_cap)||numeric(a.marketCap),preco_referencia:numeric(a.close),
    fonte_principal:'brapi · listagem B3',dados_status:'catalogado'});}
  if(!j.hasNextPage||list.length===0)break;
 }
 const unique=[...new Map(all.map(r=>[r.ticker,r])).values()];
 return {encontrados:unique.length,gravados:await lotes('BR',unique),fonte:'brapi'};
}
function rating(m:string,r:any){
 const v=scoreEngine.calculate(m,r) as (number|null)[],weights=scoreEngine.weights[m] as {weight:number}[];
 if(v.some(x=>x===null))return null;
 return +v.reduce((sum:number,x:number|null,i:number)=>sum+Number(x)*weights[i].weight/100,0).toFixed(2);
}
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const round=(n:number|null,p=4)=>n!=null&&Number.isFinite(n)?+n.toFixed(p):null;
function technicalPrices(data:any,market:string){
 const meta=data?.chart?.result?.[0];if(!meta)throw Error('Yahoo: serie vazia');
 const currency=String(meta.meta?.currency||'').toUpperCase();
 if(currency!==(market==='BR'?'BRL':'USD'))throw Error('Moeda inesperada: '+currency);
 const q=meta.indicators?.quote?.[0]||{},adjusted=meta.indicators?.adjclose?.[0]?.adjclose||[];
 const days=(meta.timestamp||[]).map((t:number,i:number)=>({
   close:numeric(q.close?.[i]),adjusted:numeric(adjusted[i])??numeric(q.close?.[i]),
   high:numeric(q.high?.[i]),volume:numeric(q.volume?.[i])??0
 })).filter((x:any)=>x.close!=null&&x.close>0&&x.adjusted!=null&&x.adjusted>0);
 if(days.length<30)throw Error('Historico insuficiente para calculos diarios');
 const last=days[days.length-1],last20=days.slice(-20);
 const liquid=last20.length>=15?last20.reduce((sum:number,x:any)=>sum+(x.volume||0)*x.close,0)/last20.length:null;
 // Momentum 12-1: fechamento ajustado de 21 sessões atrás / fechamento ajustado de 252 sessões atrás.
 const momentum=days.length>=252?
   (days[days.length-22].adjusted/days[days.length-252].adjusted-1)*100:null;
 const prev200=days.slice(-200),mm200=prev200.length===200?
   prev200.reduce((a:number,x:any)=>a+x.close,0)/200:null;
 const high52=days.slice(-252).map((x:any)=>x.high||x.close),highest=Math.max(...high52);
 const changes=days.slice(-200).map((x:any,i:number,all:any[])=>i?x.close-all[i-1].close:null).filter((x:any)=>x!==null);
 let ups=0,downs=0,rsi:number|null=null;
 if(changes.length>=14){
  ups=changes.slice(0,14).reduce((a:number,n:number)=>a+Math.max(0,n),0)/14;
  downs=changes.slice(0,14).reduce((a:number,n:number)=>a+Math.max(0,-n),0)/14;
  for(const x of changes.slice(14)){ups=(ups*13+Math.max(x,0))/14;downs=(downs*13+Math.max(-x,0))/14}
  rsi=downs===0?(ups===0?50:100):100-100/(1+ups/downs);
 }
 return {momentum_12_1:round(momentum),rsi_14:round(rsi,2),dist_mm200_pct:mm200?round((last.close/mm200-1)*100):null,
 dist_max_52w:highest>0?round((last.close/highest-1)*100):null,
 ...(market==='BR'?{liquidez_diaria_brl:round(liquid,2),preco_referencia:round(last.close,4)}:
 {avg_daily_volume_usd:round(liquid,2),preco_referencia_usd:round(last.close,4)}),fonte_precos:'Yahoo Finance Chart · OHLCV 2y/1d'};
}
async function priceBatch(market:string,limit=8){
 const pending=await rpc('quant_v2_precos_pendentes',{p_market:market,p_limit:Math.min(20,Math.max(1,limit))});
 const updates:any[]=[],errors:string[]=[];let blocked=false;
 for(const ticker of Array.isArray(pending)?pending:[]){
  const symbol=market==='BR'?ticker+'.SA':String(ticker).replaceAll('.','-');
  const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?range=2y&interval=1d';
  try{
   const response=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'DiarioTrader-Quant/2.0 (market-research; limited batch)'},signal:AbortSignal.timeout(8000)});
   if(response.status===429||response.status===403){blocked=true;errors.push('Yahoo HTTP '+response.status+': interrompido sem tentativas em massa');break;}
   if(!response.ok){errors.push(ticker+': HTTP '+response.status);continue;}
   const data=await response.json(),calc=technicalPrices(data,market);
   updates.push({ticker,...calc});
  }catch(e){errors.push(ticker+': '+String(e).slice(0,80));}
  await wait(1100); // no máximo 1 requisição/segundo por função; não é garantia de cota Yahoo.
 }
 const gravados=updates.length?Number(await rpc('quant_v2_patch_precos',{p_market:market,p_rows:updates}))||0:0;
 return {selecionados:Array.isArray(pending)?pending.length:0,gravados,bloqueado:blocked,erros:errors.slice(0,8),tickers:updates.map((x:any)=>x.ticker)};
}
async function finalized(market:string,job:string,items:number,errors:number,tickers:string[]=[]){
 const list=[...new Set(tickers.filter(t=>/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(t)))].slice(0,250);
 const count=list.length?await rpc('quant_v2_recalcular_lote',{p_market:market,p_tickers:list}):0;
 const snap=await rpc('quant_v2_snapshot_refresh',{p_market:market});
 await rpc('quant_v2_sync_log',{p_market:market,p_job:job,p_items:items,p_errors:errors,p_details:'Score v2.0, snapshot e medianas atualizados'});
 return {recalculados:count,snapshot:snap};
}
async function scanner(market:string,tickers:string[],comHistorico=true){
 if(!tickers.length)return {atualizados:0,semDados:0};
 // Campos confirmados no catálogo da API de Screener: valores não informados permanecem nulos.
 const usa=market==='US',columns=usa?
 ['name','description','sector','market_cap_basic','return_on_equity','return_on_invested_capital',
 'price_earnings_ttm','price_earnings_forward_fy','price_earnings_growth_ttm','enterprise_value_to_free_cash_flow_ttm',
 'enterprise_value_fq','free_cash_flow_ttm','total_revenue_ttm','price_sales_current','dividends_yield_current',
 'net_debt_to_ebitda_fq','RSI','EMA200','close','Perf.1Y','Perf.1M','average_volume_30d_calc',
 'earnings_per_share_diluted_yoy_growth_ttm']:
 ['name','description','sector','market_cap_basic','return_on_equity','return_on_invested_capital',
 'price_earnings_ttm','dividends_yield_current','dividend_payout_ratio_ttm','price_book_fq',
 'enterprise_value_ebitda_current','free_cash_flow_ttm','net_margin_ttm','net_debt_to_ebitda_fq',
 'RSI','EMA200','close','Perf.1Y','Perf.1M','average_volume_30d_calc'];
 const url='https://scanner.tradingview.com/'+(usa?'america':'brazil')+'/scan';
 let updated=0;
 for(let i=0;i<tickers.length;i+=40){
  const part=tickers.slice(i,i+40),prefix=usa? '': 'BMFBOVESPA:';
  const body={symbols:{tickers:usa?part.flatMap(t=>['NASDAQ:'+t,'NYSE:'+t]):part.map(t=>prefix+t),query:{types:[]}},columns};
  let r:Response|null=null;
  for(let attempt=0;attempt<3;attempt++){
   r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.tradingview.com',Referer:'https://www.tradingview.com/'},body:JSON.stringify(body),signal:AbortSignal.timeout(14000)});
   if(r.status!==429&&r.status<500)break;
   if(attempt<2)await wait(1500*(attempt+1));
  }
  if(!r?.ok)throw Error('TradingView HTTP '+(r?.status||0));
  const json=await r.json();const rows:any[]=[];
  for(const item of json.data||[]){
   const code=clean(String(item.s||'').split(':').pop()),d=item.d||[],lookup=(col:string)=>numeric(d[columns.indexOf(col)]);
   const price=lookup('close'),ema=lookup('EMA200'),y=lookup('Perf.1Y'),month=lookup('Perf.1M');
   const momentum=y!=null&&month!=null&&month>-99?+(((1+y/100)/(1+month/100)-1)*100).toFixed(3):null;
   const common:any={ticker:code,roe:lookup('return_on_equity'),roic:lookup('return_on_invested_capital'),dividend_yield:lookup('dividends_yield_current'),
    momentum_12_1:momentum,rsi_14:lookup('RSI'),dist_mm200_pct:price!=null&&ema!=null&&ema>0?+((price/ema-1)*100).toFixed(3):null,
    fonte_principal:'TradingView · screener',tecnicos_em:now,fundamentais_em:now};
   if(usa){
    const cap=lookup('market_cap_basic'),fcf=lookup('free_cash_flow_ttm'),revenue=lookup('total_revenue_ttm'),ev=lookup('enterprise_value_fq');
    const margin=revenue!=null&&revenue>0&&fcf!=null?+(fcf/revenue*100).toFixed(4):null;
    const evFcf=lookup('enterprise_value_to_free_cash_flow_ttm')??(ev!=null&&fcf!=null&&fcf>0?+(ev/fcf).toFixed(4):null);
    Object.assign(common,{company_name:String(d[columns.indexOf('description')]||code).slice(0,180),exchange:String(item.s||'').startsWith('NYSE:')?'NYSE':'NASDAQ',
     sector:typeof d[columns.indexOf('sector')]==='string'?d[columns.indexOf('sector')]:null,
     market_cap_usd:cap,forward_pe:lookup('price_earnings_forward_fy'),
     peg_ratio:lookup('price_earnings_growth_ttm'),ev_fcf:evFcf,
     price_sales:lookup('price_sales_current'),fcf_margin:margin,
     net_debt_ebitda:lookup('net_debt_to_ebitda_fq'),preco_referencia_usd:price,
     avg_daily_volume_usd:price!=null&&lookup('average_volume_30d_calc')!=null?+(price*lookup('average_volume_30d_calc')).toFixed(2):null,
     eps_growth_yoy:lookup('earnings_per_share_diluted_yoy_growth_ttm')});
    // Buyback yield nao pode ser confundido com variacao percentual de acoes em circulacao.
    const checked=['roe','roic','forward_pe','peg_ratio','ev_fcf','price_sales','dividend_yield','fcf_margin',
      'eps_growth_yoy','momentum_12_1','rsi_14','dist_mm200_pct'];
    const covered=checked.filter(k=>common[k]!=null).length;
    common.cobertura_pct=+(covered/checked.length*100).toFixed(1);
    common.dados_status=covered>=8?'parcial':'incompleto';common.score_quant_us=rating('US',common);
   }else{
    const cap=lookup('market_cap_basic'),fcf=lookup('free_cash_flow_ttm'),payout=lookup('dividend_payout_ratio_ttm');
    Object.assign(common,{empresa:String(d[columns.indexOf('description')]||code).slice(0,180),
     setor:typeof d[columns.indexOf('sector')]==='string'?d[columns.indexOf('sector')]:null,
     valor_mercado_brl:cap,preco_referencia:price,pl:lookup('price_earnings_ttm'),
     pvp:lookup('price_book_fq'),ev_ebitda:lookup('enterprise_value_ebitda_current'),
     fcf_yield:cap!=null&&cap>0&&fcf!=null?+(fcf/cap*100).toFixed(4):null,
     payout_implicito:(payout!=null&&payout!==0?payout:(lookup('price_earnings_ttm')>0&&lookup('dividends_yield_current')>0
      ?+(lookup('price_earnings_ttm')*lookup('dividends_yield_current')).toFixed(4):payout)),
     div_liq_ebitda:lookup('net_debt_to_ebitda_fq'),
     margem_liquida:lookup('net_margin_ttm'),
     liquidez_diaria_brl:price!=null&&lookup('average_volume_30d_calc')!=null
      ?price*lookup('average_volume_30d_calc'):null});
    const checked=['roe','roic','pl','pvp','ev_ebitda','fcf_yield','dividend_yield','payout_implicito',
     'momentum_12_1','rsi_14','dist_mm200_pct'];
    const covered=checked.filter(k=>common[k]!=null).length;
    common.cobertura_pct=+(covered/checked.length*100).toFixed(1);
    common.dados_status=covered>=8?'parcial':'incompleto';common.score_quant_br=rating('BR',common);
   }
   rows.push(common);
  }
  const unique=[...new Map(rows.map(x=>[x.ticker,x])).values()];
  // Momentum 12-1 por fechamentos mensais completos, como reserva para um subconjunto limitado.
  // Historico de preços é atualizado em um lote independente, jamais 14 chamadas paralelas.
  if(unique.length)updated+=await lotes(market,unique);
 }
 return {atualizados:updated,totalSolicitados:tickers.length};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return ok({error:'Somente POST'},405);
 if(!await autorizado(req))return ok({error:'Nao autorizado'},401);
 try{
  const b=await req.json().catch(()=>({})),mode=b.acao||'catalogo';
  if(mode==='diagnostico')return ok({ok:true,modelo:scoreEngine.version,lote_maximo_precos:20,
   metodos:['catalogo','fundamentos','precos','enriquecer','sec'],sem_polling:true});
  if(mode==='catalogo'){
   const resp:any={};
   for(const [m,fn] of (b.mercado==='US'?[['US',catalogoUS]]:b.mercado==='BR'?[['BR',catalogoBR]]:[['US',catalogoUS],['BR',catalogoBR]]) as const){
    try{resp[m]=await fn();resp[m].final=await finalized(m,'catalogo',resp[m].gravados||0,0)}
    catch(e){resp[m]={erro:String(e).slice(0,160)}}
   }
   return ok({acao:mode,...resp});
  }
  if(mode==='precos'){
   const market=b.mercado==='BR'?'BR':b.mercado==='US'?'US':null;
   if(!market)return ok({error:'Mercado invalido'},400);
   const data=await priceBatch(market,Math.min(20,Math.max(1,Number(b.limite)||8)));
   const final=await finalized(market,'precos',data.gravados,data.erros.length,data.tickers);
   return ok({acao:mode,mercado:market,...data,final});
  }
  if(mode==='fundamentos'){
   const m=b.mercado==='BR'?'BR':b.mercado==='US'?'US':null;if(!m)return ok({erro:'Mercado invalido'},400);
   const max=Math.min(200,Math.max(1,Math.floor(Number(b.limite)||200)));
   const symbols=await rpc('quant_v2_fundamentos_pendentes',{p_market:m,p_limit:max});
   const fundamental=await scanner(m,symbols||[],false);
   const prices=await priceBatch(m,Math.min(12,Math.max(2,Math.ceil(max/20))));
   const final=await finalized(m,'fundamentos',Number(fundamental.atualizados||0)+prices.gravados,prices.erros.length,[...(Array.isArray(symbols)?symbols:[]),...prices.tickers]);
   return ok({acao:mode,mercado:m,...fundamental,precos:prices,final});
  }
  if(mode==='enriquecer'){
   const result:any={};
   for(const market of ['BR','US']){
    try{
     const symbols=await rpc('quant_v2_fundamentos_pendentes',{p_market:market,p_limit:80});
     const fundamental=await scanner(market,symbols||[],false);
     const prices=await priceBatch(market,market==='BR'?6:8);
     result[market]={fundamental,precos:prices,
       final:await finalized(market,'enriquecer',Number(fundamental.atualizados||0)+prices.gravados,prices.erros.length,[...(Array.isArray(symbols)?symbols:[]),...prices.tickers])};
    }catch(e){result[market]={erro:String(e).slice(0,170)}}
   }
   return ok({acao:mode,...result});
  }
  if(mode==='sec'){
   // Reutiliza a função SEC existente; não baixa ZIP nem ignora bloqueios 403/429.
   const r=await fetch(SB+'/functions/v1/screeners-sec',{
     method:'POST',headers:{'Content-Type':'application/json','x-cron-secret':req.headers.get('x-cron-secret')||''},
     body:JSON.stringify({acao:'sec'}),signal:AbortSignal.timeout(60000)});
   const result=await r.json().catch(()=>({}));
   await finalized('US','sec',Number(result.concluidos||0),Array.isArray(result.erros)?result.erros.length:0);
   return ok({acao:mode,origem:'SEC companyfacts',...result},r.status);
  }
  return ok({error:'Acao desconhecida'},400);
 }catch(e){console.error('screeners-sync v2',String(e).slice(0,150));return ok({error:'Coleta temporariamente indisponivel'},503)}
});
