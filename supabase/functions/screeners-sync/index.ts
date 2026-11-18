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

const SEC_UA='DiarioTraderQuant/1.0 (contato@diariotrader.app)';
let secLast=0;
async function secGet(url:string,host:'www.sec.gov'|'data.sec.gov'){
 await wait(Math.max(0,180-(Date.now()-secLast)));secLast=Date.now();
 return fetch(url,{headers:{'User-Agent':SEC_UA,Accept:'application/json',Host:host},
  signal:AbortSignal.timeout(14000)});
}
async function secMapear(){
 // URL oficial do company_tickers.json usa www.sec.gov (Host precisa acompanhar o host real).
 const r=await secGet('https://www.sec.gov/files/company_tickers.json','www.sec.gov');
 if(!r.ok)return {http:r.status,erro:'SEC mapping HTTP '+r.status,mapeados:0};
 const source=await r.json(),rows=Object.values(source).filter((x:any)=>x?.ticker&&Number.isSafeInteger(x.cik_str))
  .map((x:any)=>({ticker:clean(x.ticker).replaceAll('-','.'),cik:String(x.cik_str).padStart(10,'0')}));
 let count=0;for(let i=0;i<rows.length;i+=200)count+=Number(await rpc('quant_screeners_sec_map',{p_rows:rows.slice(i,i+200)}))||0;
 return {http:200,mapeados:count,total:rows.length};
}
function secPeriodo(json:any){
 const gaap=json?.facts?.['us-gaap']||{},all:any[]=[];
 for(const tag of ['Assets','StockholdersEquity','Liabilities','NetIncomeLoss','Revenues',
   'RevenueFromContractWithCustomerExcludingAssessedTax']){
  for(const entries of Object.values(gaap[tag]?.units||{}) as any[][]){
   for(const x of entries||[]){
    if(['10-Q','10-K','10-Q/A','10-K/A'].includes(x.form)&&/^\d{4}-\d{2}-\d{2}$/.test(x.end||'')
      &&x.end<=now&&x.filed&&x.filed<=now)all.push(x);
   }
  }
 }
 all.sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed));
 return all[0]||null;
}
function secAnnual(doc:any,tags:string[],unit='USD'){
 const facts=doc?.facts?.['us-gaap']||{};
 for(const tag of tags){
  const entries=(facts[tag]?.units?.[unit]||[]).filter((x:any)=>
   x.form==='10-K'&&x.start&&x.end&&x.end<=now&&x.filed<=now&&numeric(x.val)!==null
   &&(Date.parse(x.end)-Date.parse(x.start))/86400000>=330
   &&(Date.parse(x.end)-Date.parse(x.start))/86400000<=390);
  if(!entries.length)continue;
  entries.sort((a:any,b:any)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed));
  const unique=new Map<string,any>();for(const x of entries)if(!unique.has(x.end))unique.set(x.end,x);
  return [...unique.values()].map(x=>({...x,tag}));
 }
 return [];
}
function secValores(doc:any){
 const rev=secAnnual(doc,['RevenueFromContractWithCustomerExcludingAssessedTax',
  'RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet']);
 const eps=secAnnual(doc,['EarningsPerShareDiluted'],'USD/shares');
 const operating=secAnnual(doc,['NetCashProvidedByUsedInOperatingActivities']);
 const capex=secAnnual(doc,['PaymentsToAcquirePropertyPlantAndEquipment']);
 const growth=(v:any[])=>v.length>=2&&numeric(v[0].val)!==null&&numeric(v[1].val)!==null&&
  Number(v[1].val)>0?round((Number(v[0].val)/Number(v[1].val)-1)*100):null;
 const cap=capex.find(x=>x.end===operating[0]?.end);
 const margin=operating[0]&&cap&&rev[0]?.val>0&&rev[0].end===operating[0].end?
  round((Number(operating[0].val)-Number(cap.val))/Number(rev[0].val)*100):null;
 return {revenue_growth_yoy:growth(rev),eps_growth_yoy:growth(eps),fcf_margin:margin};
}
async function secColetar(limit:number,priority:'score'|'cap'='cap'){
 const pending=await rpc(priority==='score'?'quant_screeners_sec_top':'quant_screeners_sec_pendentes',{p_limit:Math.max(1,Math.min(16,limit))});
 const updates:any[]=[],dates:any[]=[],docs:any[]=[],errors:string[]=[],semPeriodo:any[]=[];let http200=0,http403=0,http429=0;
 for(const row of Array.isArray(pending)?pending:[]){
  if(!/^[0-9]{10}$/.test(String(row.cik||'')))continue;
  const url='https://data.sec.gov/api/xbrl/companyfacts/CIK'+row.cik+'.json';
  try{
   const r=await secGet(url,'data.sec.gov');
   if(r.status===403||r.status===429){r.status===403?http403++:http429++;
    errors.push(row.ticker+': SEC HTTP '+r.status+'; sem retentativa em massa');break}
   if(!r.ok){errors.push(row.ticker+': SEC HTTP '+r.status);continue}
   const doc=await r.json();if(Number(doc?.cik)!==Number(row.cik))throw Error('CIK divergente');
   http200++;const period=secPeriodo(doc);
   if(!period){semPeriodo.push({ticker:row.ticker,cik:row.cik});errors.push(row.ticker+': 10-Q / 10-K sem periodo confirmado; pausa de 7 dias');continue}
   const metricas=secValores(doc);
   updates.push({ticker:row.ticker,cik:row.cik,sec_status:'verificado',sec_facts_at:period.end,sec_source_url:url,...metricas});
   dates.push({ticker:row.ticker,data_competencia_balanco:period.end});
   const id=String(period.accn||'');
   if(/^\d{10}-\d{2}-\d{6}$/.test(id)){
    const origin=(tags:string[],unit='USD',count=2)=>secAnnual(doc,tags,unit).slice(0,count)
     .filter((x:any)=>x.accn&&x.end&&x.filed&&x.tag)
     .map((x:any)=>({documento_id:x.accn,formulario:x.form,competencia:x.end,publicado_em:x.filed,codigo_xbrl:x.tag}));
    const linhagem={
     revenue_growth_yoy:metricas.revenue_growth_yoy!==null?origin(['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet']):[],
     eps_growth_yoy:metricas.eps_growth_yoy!==null?origin(['EarningsPerShareDiluted'],'USD/shares'):[],
     fcf_margin:metricas.fcf_margin!==null?origin(['NetCashProvidedByUsedInOperatingActivities']):[]};
    docs.push({ticker:row.ticker,cik:row.cik,competencia:period.end,formulario:period.form,
     documento_id:id,documento_url:'https://www.sec.gov/Archives/edgar/data/'+Number(row.cik)+'/'+id.replaceAll('-','')+'/',
     publicado_em:period.filed,linhagem});
   }
   }catch(e){errors.push(row.ticker+': '+String(e).slice(0,90))}
 }
 const suspensos=semPeriodo.length?Number(await rpc('quant_screeners_sec_tentativa_patch',{p_rows:semPeriodo}))||0:0;
 const patched=updates.length?Number(await rpc('quant_screeners_sec_patch',{p_rows:updates}))||0:0;
 const validated=dates.length?Number(await rpc('quant_screeners_competencia_patch',{p_market:'US',p_rows:dates}))||0:0;
 let oficiais=0;
  for(let i=0;i<docs.length;i+=12)oficiais+=Number(await rpc('quant_screeners_documento_patch',{p_market:'US',p_rows:docs.slice(i,i+12)}))||0;
  const final=dates.length?await finalized('US','sec_edgar_competencia',patched,errors.length,dates.map(x=>x.ticker)):null;
 return {selecionados:pending?.length||0,http_200:http200,http_403:http403,http_429:http429,
  fundamentos_validos:patched,competencias_gravadas:validated,documentos_oficiais:oficiais,sem_periodo_pausados:suspensos,erros:errors.slice(0,8),final};
}


async function principaisUS(page=0,limit=140){
 const urls=[
  'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv',
  'https://raw.githubusercontent.com/yfiua/index-constituents/main/docs/constituents-nasdaq100.csv'];
 const universe=new Set<string>(),sources:string[]=[];
 for(const url of urls){
  try{
   const lines=(await fetchText(url)).replaceAll('\r','').split('\n');
   if(!/^(Symbol|Ticker)/i.test(lines[0]||''))throw Error('Cabecalho CSV invalido');
   for(const line of lines.slice(1)){
    const ticker=clean(line.split(',')[0]?.replaceAll('"','')).replaceAll('/','.');
    if(/^[A-Z]{1,5}(?:[.-][A-Z])?$/.test(ticker))universe.add(ticker);
   }
   sources.push('OK '+url.split('/').pop());
  }catch(e){sources.push(String(e).slice(0,90))}
 }
 if(universe.size<200)throw Error('Fonte S&P/Nasdaq insuficiente: '+sources.join('; '));
 // Cap/líquidez observados pelo scanner, sem inferir market cap pela inicial do ticker.
 const columns=['market_cap_basic','average_volume_30d_calc','close'];
 const marketCap=new Map<string,{ticker:string,cap:number,liq:number}>(),errors:string[]=[];
 const all=[...universe];
 for(let i=0;i<all.length;i+=40){
  const chunk=all.slice(i,i+40),body={symbols:{tickers:chunk.flatMap(t=>['NASDAQ:'+t,'NYSE:'+t]),query:{types:[]}},columns};
  try{
   const response=await fetch('https://scanner.tradingview.com/america/scan',{
    method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.tradingview.com',Referer:'https://www.tradingview.com/'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(14000)});
   if(!response.ok)throw Error('Scanner cap HTTP '+response.status);
   const result=await response.json();
   for(const row of result.data||[]){
    const ticker=clean(String(row.s||'').split(':').pop()),[capRaw,volumeRaw,priceRaw]=row.d||[];
    const cap=numeric(capRaw),volume=numeric(volumeRaw),price=numeric(priceRaw);
    if(!universe.has(ticker)||cap===null||cap<=0)continue;
    const liq=volume!==null&&price!==null?volume*price:0,prev=marketCap.get(ticker);
    if(!prev||cap>prev.cap)marketCap.set(ticker,{ticker,cap,liq});
   }
  }catch(e){errors.push(String(e).slice(0,110));if(errors.length>=3)break}
  await wait(180);
 }
 if(marketCap.size<100)throw Error('Sem capitalizacao para priorizar: '+errors.slice(0,3).join('; '));
 const sorted=[...marketCap.values()].sort((a,b)=>b.cap-a.cap||b.liq-a.liq||a.ticker.localeCompare(b.ticker));
 const tickers=sorted.slice(page*limit,(page+1)*limit).map(x=>x.ticker);
 const fundamental=await scanner('US',tickers,false);
 const final=await finalized('US','principais_sp500_nasdaq100',fundamental.atualizados,errors.length,tickers);
 return {universo:universe.size,com_market_cap:marketCap.size,pagina:page,selecionados:tickers.length,
  prioridades:sorted.slice(0,20).map(x=>x.ticker),origens:sources,erros:errors.slice(0,4),fundamental,final};
}


async function cvmRange(url:string,range:string){
 const r=await fetch(url,{headers:{Range:range,'Accept-Encoding':'identity'},
  signal:AbortSignal.timeout(18000)});
 if(r.status!==206)throw Error('CVM nao suportou HTTP Range: '+r.status);
 const size=Number(r.headers.get('Content-Length')||0);
 if(size>5_000_000)throw Error('CVM faixa excede limite de transferencia');
 return new Uint8Array(await r.arrayBuffer());
}
async function cvmZipCsv(kind:'itr'|'dfp',parte:'metadados'|'DRE_con'|'DRE_ind'='metadados'){
 // HTTP Range: acessa somente o CSV selecionado, jamais extrai o ZIP completo.
 const year=new Date().getUTCFullYear();
 const file=kind+'_cia_aberta_'+(parte==='metadados'?'':parte+'_')+year+'.csv';
 const url='https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/'+kind.toUpperCase()+'/DADOS/'+kind+'_cia_aberta_'+year+'.zip';
 const tail=await cvmRange(url,'bytes=-65536'),tv=new DataView(tail.buffer,tail.byteOffset,tail.byteLength);
 let eocd=-1;for(let i=tail.length-22;i>=0;i--)if(tv.getUint32(i,true)===0x06054b50){eocd=i;break}
 if(eocd<0)throw Error('CVM ZIP: diretorio nao localizado');
 const size=tv.getUint32(eocd+12,true),offset=tv.getUint32(eocd+16,true);
 if(size<=0||size>100000)throw Error('CVM ZIP: diretorio muito grande');
 const dir=await cvmRange(url,'bytes='+offset+'-'+(offset+size-1)),dv=new DataView(dir.buffer,dir.byteOffset,dir.byteLength);
 let entry:null|{offset:number,compressed:number,method:number}=null;
 for(let i=0;i+46<=dir.length;){
  if(dv.getUint32(i,true)!==0x02014b50)break;
  const nl=dv.getUint16(i+28,true),el=dv.getUint16(i+30,true),cl=dv.getUint16(i+32,true);
  const name=new TextDecoder().decode(dir.slice(i+46,i+46+nl)).split('/').pop();
  if(name?.toLowerCase()===file){
   entry={offset:dv.getUint32(i+42,true),compressed:dv.getUint32(i+20,true),method:dv.getUint16(i+10,true)};break;
  }
  i+=46+nl+el+cl;
 }
 if(!entry||entry.compressed<=0||entry.compressed>(parte==='metadados'?4_000_000:5_000_000))throw Error('CVM ZIP: CSV indisponivel ou acima de 5 MB comprimidos: '+file);
 const header=await cvmRange(url,'bytes='+entry.offset+'-'+(entry.offset+511));
 const hv=new DataView(header.buffer,header.byteOffset,header.byteLength);
 if(hv.getUint32(0,true)!==0x04034b50)throw Error('CVM ZIP: cabecalho local invalido');
 const start=entry.offset+30+hv.getUint16(26,true)+hv.getUint16(28,true);
 const compressed=await cvmRange(url,'bytes='+start+'-'+(start+entry.compressed-1));
 if(entry.method===0)return new TextDecoder().decode(compressed);
 if(entry.method!==8)throw Error('CVM ZIP: metodo sem suporte');
 const text=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
 if(text.length>(parte==='metadados'?8_000_000:20_000_000))throw Error('CVM: CSV acima do limite de memoria');
 return text;
}
function csvRows(raw:string,cnpjs?:Set<string>){
 const lines=raw.replace(/^\uFEFF/,'').replaceAll('\r','').split('\n');
 const parse=(line:string)=>{
  const cols:string[]=[];let cell='',quoted=false;
  for(let i=0;i<line.length;i++){
   if(line[i]==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
   else if(line[i]===';'&&!quoted){cols.push(cell);cell=''}else cell+=line[i];
  }cols.push(cell);return cols;
 };
 const fields=parse(lines.shift()||''),idx=fields.indexOf('CNPJ_CIA'),out:Record<string,string>[]=[];
 if(cnpjs&&idx<0)throw Error('CVM: CSV sem CNPJ_CIA');
 for(const line of lines){
  if(!line)continue;
  const values=parse(line);
  if(cnpjs&&!cnpjs.has(String(values[idx]||'').replace(/\D/g,'')))continue;
  const x:Record<string,string>={};
  for(let i=0;i<fields.length;i++)x[fields[i]]=values[i]||'';
  out.push(x);
  if(out.length>=35000)break; // leitura bounded; nunca carrega linhas sem CNPJ de interesse
 }
 return out;
}
function cvmNumero(value:string){
 const s=String(value||'').trim().replace(/\./g,'').replace(',','.');
 if(!/^-?\d+(?:\.\d+)?$/.test(s))return null;
 const n=Number(s);return Number.isFinite(n)?n:null;
}
async function cvmDreEvidencias(docs:Map<string,any>){
 const contas=new Map<string,Record<string,any>>(),fontes:string[]=[],erros:string[]=[];
 for(const kind of ['itr','dfp'] as const){
  const alvo=new Set([...docs].filter(([,d])=>d.formulario===kind.toUpperCase()).map(([cnpj])=>cnpj));
  if(!alvo.size)continue;
  for(const parte of ['DRE_con','DRE_ind'] as const){
   try{
    const rows=csvRows(await cvmZipCsv(kind,parte),alvo);
    for(const row of rows){
     const cnpj=String(row.CNPJ_CIA||'').replace(/\D/g,''),doc=docs.get(cnpj);
     if(!doc||doc.formulario!==kind.toUpperCase()||row.DT_REFER!==doc.competencia)continue;
     if(doc.versao&&row.VERSAO&&String(row.VERSAO)!==String(doc.versao))continue;
     const ordem=String(row.ORDEM_EXERC||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
     if(ordem!=='ULTIMO'||row.DT_FIM_EXERC!==doc.competencia)continue;
     const chave=row.CD_CONTA==='3.01'?'receita_liquida_dre':row.CD_CONTA==='3.11'?'lucro_prejuizo_dre':null;
     if(!chave)continue;
     const valor=cvmNumero(row.VL_CONTA);
     if(valor===null||!['REAL','BRL'].includes(String(row.MOEDA||'').toUpperCase()))continue;
     const grupo=parte==='DRE_con'?'consolidado':'individual',anterior=contas.get(cnpj)||{};
     if(anterior._grupo&&anterior._grupo!==grupo)continue;
     anterior._grupo=grupo;
     if(!anterior[chave]){
      anterior[chave]={
       tipo:'conta_contabil_oficial',fonte:'CVM',documento_id:doc.documento_id,
       competencia:doc.competencia,publicado_em:doc.publicado_em,
       arquivo:kind+'_cia_aberta_'+parte+'_'+new Date().getUTCFullYear()+'.csv',
       demonstracao:'DRE '+grupo,codigo_conta:row.CD_CONTA,
       valor_reportado:valor,escala_moeda:row.ESCALA_MOEDA||null,
       periodo_inicio:row.DT_INI_EXERC||null,periodo_fim:row.DT_FIM_EXERC,
       valida_indicador_ttm:false
      };
     }
     contas.set(cnpj,anterior);
    }
    fontes.push(kind.toUpperCase()+'/'+parte+': '+rows.length+' linhas examinadas');
   }catch(e){erros.push(kind.toUpperCase()+'/'+parte+': '+String(e).slice(0,120))}
  }
 }
 for(const [cnpj,obj] of contas){delete obj._grupo;if(!Object.keys(obj).length)contas.delete(cnpj)}
 return {contas,fontes,erros};
}

function normalizeName(name:string){
 return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
  .replace(/\b(PFD|PREF|COMMON|SHARES|SHS|REGISTERED|S A|SA|S\.A\.|LTDA|NON|CUM|PERP|ADR|PREFERRED|DEPOSITARY)\b/g,' ')
  .replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}
async function cvmEnriquecer(){
 // Identidade contábil exige correspondência ÚNICA de emissor/empresa com cadastro CVM.
 const r=await fetch('https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv',
  {headers:{Accept:'text/csv'},signal:AbortSignal.timeout(18000)});
 if(!r.ok)throw Error('Cadastro CVM HTTP '+r.status);
 const cadBytes=await r.arrayBuffer();
 let cadText:string;
 try{cadText=new TextDecoder('utf-8',{fatal:true}).decode(cadBytes)}
 catch{cadText=new TextDecoder('windows-1252').decode(cadBytes)}
 const cad=csvRows(cadText),names=new Map<string,Set<string>>();
 for(const x of cad){
  const cnpj=(x.CNPJ_CIA||'').replace(/\D/g,'');
  if(cnpj.length!==14)continue;
  for(const label of [x.DENOM_SOCIAL,x.DENOM_COMERC]){
   const key=normalizeName(label);
   if(key.length<9)continue;
   if(!names.has(key))names.set(key,new Set());
   names.get(key)!.add(cnpj);
  }
 }
 const periods=new Map<string,string>(),docsByCnpj=new Map<string,any>(),fontes:string[]=[],errors:string[]=[];
 for(const kind of ['itr','dfp'] as const){
  try{
   const rows=csvRows(await cvmZipCsv(kind));
   for(const x of rows){
    const cnpj=(x.CNPJ_CIA||'').replace(/\D/g,''),date=x.DT_REFER||'';
    if(cnpj.length!==14||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>now)continue;
    if(!periods.has(cnpj)||periods.get(cnpj)!<date){
      periods.set(cnpj,date);
      const id=String(x.ID_DOC||x.NUM_SEQ_DOC||'').trim(),publicado=String(x.DT_RECEB||x.DT_ENTREGA||'').slice(0,10);
      if(/^\d{1,18}$/.test(id)&&/^\d{4}-\d{2}-\d{2}$/.test(publicado)&&publicado>=date&&publicado<=now){
       docsByCnpj.set(cnpj,{competencia:date,formulario:kind.toUpperCase(),documento_id:id,
        documento_url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/'+kind.toUpperCase()+'/DADOS/'+kind+'_cia_aberta_'+new Date().getUTCFullYear()+'.zip',
        publicado_em:publicado,versao:String(x.VERSAO||'').trim(),linhagem:{}});
      }else docsByCnpj.delete(cnpj);
     }
   }
   fontes.push(kind.toUpperCase()+' OK');
  }catch(e){errors.push(kind.toUpperCase()+': '+String(e).slice(0,120))}
 }
 if(!periods.size)throw Error('CVM DFP/ITR sem periodos confirmados: '+errors.join('; '));
 let targets:any[]=[];
 try{
  const universe=await rpc('quant_screeners_universo_publico',{p_market:'BR'});
  if(universe?.complete&&Array.isArray(universe.rows))targets=universe.rows;
 }catch{}
 if(!targets.length){
  const global=await rpc('quant_v2_snapshot_read',{p_market:'BR'});
  targets=[...(global?.rows||[]),...(global?.top10||[])];
 }
 const updates:any[]=[],docUpdates:any[]=[],unknown:string[]=[];
 for(const row of targets){
  const key=normalizeName(row.empresa),parts=key.split(' ').filter(x=>x.length>2);
  if(!parts.length)continue;
  const exact=new Set<string>(),fallback=new Set<string>(),prefix=parts.slice(0,2).join(' ');
  const aliases=String(row.ticker||'').startsWith('AXIA')?['CENTRAIS ELETRICAS BRASILEIRAS']:[];
  for(const [label,cnpjs] of names){
   if(label===key||label.startsWith(key+' ')||aliases.some(x=>label.startsWith(x+' ')))
    for(const c of cnpjs)exact.add(c);
   else if((parts.length>=2&&label.startsWith(prefix+' '))||
      (parts.length===1&&parts[0].length>=4&&label.startsWith(parts[0]+' ')))
    for(const c of cnpjs)fallback.add(c);
  }
  const matches=exact.size?exact:fallback;
  if(matches.size!==1){if(unknown.length<12)unknown.push(row.ticker);continue}
  const cnpj=[...matches][0],date=periods.get(cnpj);
   if(date)updates.push({ticker:row.ticker,data_competencia_balanco:date});
   const doc=docsByCnpj.get(cnpj);if(doc)docUpdates.push({ticker:row.ticker,cnpj,...doc});
 }
 let gravadas=0;for(let i=0;i<updates.length;i+=150)
  gravadas+=Number(await rpc('quant_screeners_competencia_patch',{p_market:'BR',p_rows:updates.slice(i,i+150)}))||0;
 // Prova CVM por conta contábil: não equivale a homologar índices TTM do TradingView.
 const cnpjsAlvo=new Set(docUpdates.map(x=>x.cnpj));
 const docsAlvo=new Map([...docsByCnpj].filter(([cnpj])=>cnpjsAlvo.has(cnpj)));
 const dre=await cvmDreEvidencias(docsAlvo);
 let documentosComId=0,comLinhagem=0;
 for(let i=0;i<docUpdates.length;i+=12){
  const lote=docUpdates.slice(i,i+12).map(({cnpj,...d})=>{
   const linhagem=dre.contas.get(cnpj)||{};
   if(Object.keys(linhagem).length)comLinhagem++;
   return {...d,linhagem};
  });
  documentosComId+=Number(await rpc('quant_screeners_documento_patch',{p_market:'BR',p_rows:lote}))||0;
 }
  const final=gravadas?await finalized('BR','cvm_dfp_itr',gravadas,errors.length,updates.map(x=>x.ticker)):null;
 return {elegiveis_consultadas:targets.length,documentos:periods.size,correspondencias:updates.length,
  competencias_gravadas:gravadas,documentos_oficiais:documentosComId,contas_dre_encontradas:comLinhagem,origens_dre:dre.fontes,fontes,erros:[...errors,...dre.erros],amostra_competencias:updates.slice(0,10),amostra_sem_cnpj:unknown,final};
}

Deno.serve(async req=>{
 if(req.method!=='POST')return ok({error:'Somente POST'},405);
 if(!await autorizado(req))return ok({error:'Nao autorizado'},401);
 try{
  const b=await req.json().catch(()=>({})),mode=b.acao||'catalogo';
  if(mode==='diagnostico')return ok({ok:true,modelo:scoreEngine.version,lote_maximo_precos:20,
   metodos:['catalogo','fundamentos','precos','enriquecer','principais','mapear_sec','sec','sec_top','cvm'],sem_polling:true});
  if(mode==='principais'){
   const page=Math.max(0,Math.min(10,Math.floor(Number(b.pagina)||0))),limit=Math.max(20,Math.min(180,Math.floor(Number(b.limite)||140)));
   return ok({acao:mode,mercado:'US',...await principaisUS(page,limit)});
  }
  if(mode==='cvm')return ok({acao:mode,mercado:'BR',...await cvmEnriquecer()});
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
  if(mode==='mapear_sec')return ok({acao:mode,...await secMapear()});
  if(mode==='sec')return ok({acao:mode,...await secColetar(Math.floor(Number(b.limite)||8))});
  if(mode==='sec_top')return ok({acao:mode,...await secColetar(Math.floor(Number(b.limite)||12),'score')});
  return ok({error:'Acao desconhecida'},400);
 }catch(e){console.error('screeners-sync v2',String(e).slice(0,150));return ok({error:'Coleta temporariamente indisponivel'},503)}
});
