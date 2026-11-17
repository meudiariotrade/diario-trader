// Catalogo institucional BR/EUA, sincronizacao somente por cron autorizado, sem polling ou dados privados.
const SB=Deno.env.get('SUPABASE_URL')||'', SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const HEAD={apikey:SVC,Authorization:'Bearer '+SVC,'Content-Type':'application/json'};
const now=new Date().toISOString().slice(0,10);
const ok=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const clean=(s:unknown)=>String(s||'').trim().toUpperCase();
const numeric=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?n:null;
async function fetchText(url:string){const r=await fetch(url,{headers:{'User-Agent':'DiarioTrader-Catalogo/742','Accept':'text/plain,*/*'},signal:AbortSignal.timeout(13000)});if(!r.ok)throw Error('Fonte HTTP '+r.status);const s=await r.text();if(s.length>4_000_000)throw Error('Fonte muito grande');return s}
async function rpc(name:string,args:unknown){const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:HEAD,body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(name+' HTTP '+r.status+': '+(await r.text()).slice(0,100));return r.json()}
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
 const nas=table(rr[0]).filter((r:any)=>r['Test Issue']==='N'&&r.ETF==='N').map((r:any)=>({ticker:clean(r.Symbol),company_name:r['Security Name'],exchange:'NASDAQ',fonte_principal:'Nasdaq Trader · Symbol Directory',dados_status:'catalogado'}));
 const ny=table(rr[1]).filter((r:any)=>r.Exchange==='N'&&r.ETF==='N'&&r['Test Issue']==='N').map((r:any)=>({ticker:clean(r['ACT Symbol']),company_name:r['Security Name'],exchange:'NYSE',fonte_principal:'Nasdaq Trader · Other Listed',dados_status:'catalogado'}));
 const unique=[...new Map([...ny,...nas].filter(r=>/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(r.ticker)&&r.company_name).map(r=>[r.exchange+':'+r.ticker,r])).values()];
 return {encontrados:unique.length,gravados:await lotes('US',unique),fonte:'Nasdaq Trader'};
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
function normalizeScore(v:unknown,low:number,high:number,invert=false){const n=numeric(v);if(n==null)return null;const score=Math.min(100,Math.max(0,(n-low)/(high-low)*100));return invert?100-score:score;}
const mean=(v:(number|null)[])=>{const a=v.filter((x):x is number=>x!==null);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
function rating(m:string,r:any){
 const n=(v:any,lo:number,hi:number,inv=false)=>normalizeScore(v,lo,hi,inv);
 if(m==='BR'){
  const q=mean([n(r.roe,5,25),n(r.roic,5,22)]),v=mean([n(r.pl,5,25,true),n(r.ev_ebitda,4,18,true),n(r.fcf_yield,0,12)]);
  const d=mean([n(r.dividend_yield,0,12),r.payout_implicito==null?null:(r.payout_implicito>=20&&r.payout_implicito<=80?90:25)]);
  const mo=n(r.momentum_12_1,-30,50);return q===null||v===null||d===null||mo===null?null:+(.3*q+.3*v+.25*d+.15*mo).toFixed(2);
 }
 const q=mean([n(r.roic,5,22),n(r.eps_growth_yoy,-10,35),n(r.fcf_margin,0,30)]);
 const v=mean([n(r.forward_pe,8,40,true),n(r.peg_ratio,0.7,3,true),n(r.ev_fcf,5,35,true)]);
 const mo=mean([n(r.momentum_12_1,-30,50),n(r.short_interest_pct,0,15,true)]);
 const ret=n(r.total_shareholder_yield,0,12);
 return q===null||v===null||mo===null||ret===null?null:+(.3*q+.25*v+.25*mo+.2*ret).toFixed(2);
}
async function momentoHistorico(market:string,ticker:string):Promise<number|null>{
 try{
  const sym=market==='BR'?ticker+'.SA':ticker.replaceAll('.','-');
  const u='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(sym)+'?range=2y&interval=1mo';
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(6500)});
  if(!r.ok)return null;
  const x=await r.json(),values=x?.chart?.result?.[0]?.indicators?.adjclose?.[0]?.adjclose||x?.chart?.result?.[0]?.indicators?.quote?.[0]?.close||[];
  const closes=values.filter((v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0);
  if(closes.length<14)return null;
  const last=closes.length-2,old=closes[last-11];
  return old>0?+((closes[last]/old-1)*100).toFixed(4):null;
 }catch{return null;}
}
async function scanner(market:string,tickers:string[]){
 if(!tickers.length)return {atualizados:0,semDados:0};
 const usa=market==='US',columns=usa?
 ['name','description','sector','market_cap_basic','return_on_equity','return_on_invested_capital','price_earnings_ttm','dividends_yield_current','RSI','EMA200','close','Perf.1Y','Perf.1M','average_volume_30d_calc','earnings_per_share_diluted_ttm','earnings_per_share_diluted_yoy_growth_ttm']:
 ['name','description','sector','market_cap_basic','return_on_equity','return_on_invested_capital','price_earnings_ttm','dividends_yield_current','price_book_fq','enterprise_value_to_ebitda_ttm','free_cash_flow_yield_ttm','net_margin_ttm','RSI','EMA200','close','Perf.1Y','Perf.1M','average_volume_30d_calc'];
 const url='https://scanner.tradingview.com/'+(usa?'america':'brazil')+'/scan';
 let updated=0;
 for(let i=0;i<tickers.length;i+=40){
  const part=tickers.slice(i,i+40),prefix=usa? '': 'BMFBOVESPA:';
  const body={symbols:{tickers:usa?part.flatMap(t=>['NASDAQ:'+t,'NYSE:'+t]):part.map(t=>prefix+t),query:{types:[]}},columns};
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.tradingview.com',Referer:'https://www.tradingview.com/'},body:JSON.stringify(body),signal:AbortSignal.timeout(14000)});
  if(!r.ok)throw Error('TradingView HTTP '+r.status);
  const json=await r.json();const rows:any[]=[];
  for(const item of json.data||[]){
   const code=clean(String(item.s||'').split(':').pop()),d=item.d||[],lookup=(col:string)=>numeric(d[columns.indexOf(col)]);
   const price=lookup('close'),ema=lookup('EMA200'),y=lookup('Perf.1Y'),month=lookup('Perf.1M');
   const momentum=y!=null&&month!=null&&month>-99?+(((1+y/100)/(1+month/100)-1)*100).toFixed(3):null;
   const common:any={ticker:code,roe:lookup('return_on_equity'),roic:lookup('return_on_invested_capital'),dividend_yield:lookup('dividends_yield_current'),
    momentum_12_1:momentum,rsi_14:lookup('RSI'),dist_mm200_pct:price!=null&&ema!=null&&ema>0?+((price/ema-1)*100).toFixed(3):null,
    fonte_principal:'TradingView · screener',tecnicos_em:now,fundamentais_em:now};
   if(usa){
    Object.assign(common,{company_name:String(d[columns.indexOf('description')]||code).slice(0,180),exchange:'NASDAQ',
     sector:typeof d[columns.indexOf('sector')]==='string'?d[columns.indexOf('sector')]:null,
     market_cap_usd:lookup('market_cap_basic'),forward_pe:null,preco_referencia_usd:price,
     eps_growth_yoy:lookup('earnings_per_share_diluted_yoy_growth_ttm')});
    const covered=['roic','forward_pe','dividend_yield','momentum_12_1','eps_growth_yoy'].filter(k=>common[k]!=null).length;
    common.cobertura_pct=covered/5*100;common.dados_status=covered>=3?'parcial':'incompleto';common.score_quant_us=rating('US',common);
   }else{
    Object.assign(common,{empresa:String(d[columns.indexOf('description')]||code).slice(0,180),
     setor:typeof d[columns.indexOf('sector')]==='string'?d[columns.indexOf('sector')]:null,
     valor_mercado_brl:lookup('market_cap_basic'),preco_referencia:price,pl:lookup('price_earnings_ttm'),
     pvp:lookup('price_book_fq'),ev_ebitda:lookup('enterprise_value_to_ebitda_ttm'),fcf_yield:lookup('free_cash_flow_yield_ttm'),payout_implicito:lookup('price_earnings_ttm')!=null&&lookup('dividends_yield_current')!=null?lookup('price_earnings_ttm')*lookup('dividends_yield_current'):null,
     margem_liquida:lookup('net_margin_ttm'),liquidez_diaria_brl:price!=null&&lookup('average_volume_30d_calc')!=null?price*lookup('average_volume_30d_calc'):null});
    const covered=['roe','roic','pl','pvp','ev_ebitda','fcf_yield','dividend_yield','momentum_12_1'].filter(k=>common[k]!=null).length;
    common.cobertura_pct=covered/8*100;common.dados_status=covered>=5?'parcial':'incompleto';common.score_quant_br=rating('BR',common);
   }
   rows.push(common);
  }
  const unique=[...new Map(rows.map(x=>[x.ticker,x])).values()];
  // Momentum 12-1 por fechamentos mensais completos, como reserva para um subconjunto limitado.
  await Promise.all(unique.filter(x=>x.momentum_12_1==null).slice(0,14).map(async x=>{
   const m=await momentoHistorico(market,x.ticker);
   if(m!=null){x.momentum_12_1=m;
    if(market==='BR')x.score_quant_br=rating('BR',x);
    else x.score_quant_us=rating('US',x);}
  }));
  if(unique.length)updated+=await lotes(market,unique);
 }
 return {atualizados:updated,totalSolicitados:tickers.length};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return ok({error:'Somente POST'},405);
 if(!await autorizado(req))return ok({error:'Nao autorizado'},401);
 try{
  const b=await req.json().catch(()=>({})),mode=b.acao||'catalogo';
  if(mode==='catalogo'){const resp:any={};for(const [m,fn] of [['US',catalogoUS],['BR',catalogoBR]] as const){try{resp[m]=await fn()}catch(e){resp[m]={erro:String(e).slice(0,180)}}}return ok({acao:mode,...resp});}
  if(mode==='enriquecer'){const result:any={};for(const m of ['BR','US']){
    try{const symbols=await rpc('quant_screeners_pendentes',{p_market:m,p_limit:80});result[m]=await scanner(m,symbols||[])}
    catch(e){result[m]={erro:String(e).slice(0,170)}}
  }return ok({acao:mode,...result})}
  return ok({error:'Acao desconhecida'},400);
 }catch(e){return ok({error:String(e).slice(0,180)},503)}
});