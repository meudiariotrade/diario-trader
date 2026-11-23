'use strict';
// v897 — processamento público exclusivamente no GitHub Actions.
// Cloudflare KV distribui snapshots; nenhuma chamada ao Supabase ou acesso a dados privados.
// Nunca inventar score, período, fonte ou resultado de documentação oficial.
const fs=require('node:fs');
const path=require('node:path');
const input=path.resolve(process.env.SCREENERS_INPUT_DIR||'.screeners-import');
const output=path.resolve(process.env.SCREENERS_OUTPUT_DIR||'.screeners-output');
const edge='https://diario-screeners-quant.lucianosilva43567.workers.dev';
const I=require('../src/analysis/screeners-inteligencia.js');
const sourceAgeHours=48;
const minRows={BR:150,US:600};
const columns={
 BR:['name','description','sector','market_cap_basic','return_on_equity','return_on_invested_capital','price_earnings_ttm',
 'dividends_yield_current','dividend_payout_ratio_ttm','price_book_fq','enterprise_value_ebitda_current',
 'free_cash_flow_ttm','net_margin_ttm','net_debt_to_ebitda_fq','RSI','EMA200','close','Perf.1Y','Perf.1M','average_volume_30d_calc'],
 US:['name','description','sector','market_cap_basic','return_on_equity','return_on_invested_capital',
 'price_earnings_forward_fy','price_earnings_growth_ttm','enterprise_value_to_free_cash_flow_ttm',
 'free_cash_flow_ttm','total_revenue_ttm','price_sales_current','dividends_yield_current',
 'net_debt_to_ebitda_fq','RSI','EMA200','close','Perf.1Y','Perf.1M','average_volume_30d_calc',
 'earnings_per_share_diluted_yoy_growth_ttm']
};
function readJson(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function clean(x){return String(x??'').trim().toUpperCase()}
function finite(x){return typeof x==='number'&&Number.isFinite(x)?x:null}
function dec(x,n=4){return x==null||!Number.isFinite(x)?null:+x.toFixed(n)}
function parseTime(x){const t=Date.parse(String(x||''));return Number.isFinite(t)?t:0}
function valid(data,m,baseline=0){
 return data&&data.ok===true&&data.market===m&&data.universe_complete===true&&
 Array.isArray(data.universe_rows)&&Array.isArray(data.rows)&&data.universe_rows.length>=Math.max(minRows[m],baseline)&&
 data.universe_rows.every(r=>r&&/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(r.ticker)&&r.ativo_elegivel===true)&&
 typeof data.last_update==='string'&&parseTime(data.last_update)>0&&!('user_id' in data)&&!('owned' in data);
}
async function request(url,options={},ms=15000){
 const r=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(ms)});
 if(r.status===429||r.status===403)throw Error('Fonte bloqueada/limitada HTTP '+r.status);
 if(!r.ok)throw Error('Fonte HTTP '+r.status);
 return r;
}
async function bootstrap(m){
 const stored=readJson(path.join(input,m+'.json'));
 if(valid(stored,m))return stored;
 const url=edge+'/v1/screeners?market='+m+'&snapshot=1&universe=1';
 const r=await request(url,{},15000),data=await r.json();
 if(!valid(data,m))throw Error('Falha no snapshot inicial Cloudflare '+m);
 return data;
}
function score(m,row){
 const v=I.diagnostics(m,row,Date.now(),null);
 if(!v||v.modelScore==null)return null;
 return {total:v.modelScore,model:v.modelVersion||v.version||null};
}
function update(row,patch,m,source,date){
 let changed=false;
 for(const [key,val] of Object.entries(patch)){
  if(val===undefined||val===null||val===''||!Number.isFinite(val)&&typeof val==='number')continue;
  if(row[key]!==val){row[key]=val;changed=true;}
 }
 if(!changed)return false;
 const sc=score(m,row);if(sc?.total!=null){
  row[m==='BR'?'score_quant_br':'score_quant_us']=sc.total;
  if(sc.model&&typeof sc.model==='string')row.score_model_version=sc.model;
 }
 row.fonte_principal=source;
 row.updated_at=new Date().toISOString();
 if(date){row.tecnicos_em=date;row.fundamentais_em=date}
 return true;
}
function scannerFields(m,ticker,item){
 const cols=columns[m],d=Array.isArray(item.d)?item.d:[];
 const idx=x=>cols.indexOf(x),n=x=>finite(d[idx(x)]),text=x=>typeof d[idx(x)]==='string'?d[idx(x)]:null;
 const price=n('close'),ema=n('EMA200'),year=n('Perf.1Y'),month=n('Perf.1M');
 const momentum=year!=null&&month!=null&&month>-99?dec(((1+year/100)/(1+month/100)-1)*100,3):null;
 const common={roe:n('return_on_equity'),roic:n('return_on_invested_capital'),dividend_yield:n('dividends_yield_current'),
  rsi_14:n('RSI'),momentum_12_1:momentum,dist_mm200_pct:price!=null&&ema>0?dec((price/ema-1)*100,3):null};
 if(m==='BR'){
  const cap=n('market_cap_basic'),fcf=n('free_cash_flow_ttm'),payout=n('dividend_payout_ratio_ttm');
  Object.assign(common,{empresa:text('description')?.slice(0,180),setor:text('sector'),valor_mercado_brl:cap,
   preco_referencia:price,pl:n('price_earnings_ttm'),pvp:n('price_book_fq'),
   ev_ebitda:n('enterprise_value_ebitda_current'),fcf_yield:cap>0&&fcf!=null?dec(fcf/cap*100):null,
   payout_implicito:payout!=null&&payout!==0?payout:null,
   div_liq_ebitda:n('net_debt_to_ebitda_fq'),margem_liquida:n('net_margin_ttm'),
   liquidez_diaria_brl:price>0&&n('average_volume_30d_calc')!=null?dec(price*n('average_volume_30d_calc'),2):null});
 }else{
  const rev=n('total_revenue_ttm'),fcf=n('free_cash_flow_ttm');
  Object.assign(common,{company_name:text('description')?.slice(0,180),sector:text('sector'),
   market_cap_usd:n('market_cap_basic'),forward_pe:n('price_earnings_forward_fy'),
   peg_ratio:n('price_earnings_growth_ttm'),ev_fcf:n('enterprise_value_to_free_cash_flow_ttm'),
   price_sales:n('price_sales_current'),fcf_margin:rev>0&&fcf!=null?dec(fcf/rev*100):null,
   eps_growth_yoy:n('earnings_per_share_diluted_yoy_growth_ttm'),
   net_debt_ebitda:n('net_debt_to_ebitda_fq'),
   avg_daily_volume_usd:price>0&&n('average_volume_30d_calc')!=null?dec(price*n('average_volume_30d_calc'),2):null});
 }
 return Object.fromEntries(Object.entries(common).filter(([k,v])=>v!==null&&v!==undefined&&v!==''));
}
async function scanner(m,rows){
 const chunkSize=40,now=new Date().toISOString().slice(0,10);
 const errors=[];let updates=0,blocked=false;
 for(let k=0;k<rows.length;k+=chunkSize){
  const part=rows.slice(k,k+chunkSize);
  const tickers=m==='BR'?part.map(r=>'BMFBOVESPA:'+r.ticker):
   part.flatMap(r=>[r.exchange==='NYSE'?'NYSE:'+r.ticker:'NASDAQ:'+r.ticker]);
  try{
   const r=await request('https://scanner.tradingview.com/'+(m==='BR'?'brazil':'america')+'/scan',{
    method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.tradingview.com',
     Referer:'https://www.tradingview.com/'},
    body:JSON.stringify({symbols:{tickers,query:{types:[]}},columns:columns[m]})},18000);
   const d=await r.json();if(!Array.isArray(d.data))throw Error('Scanner sem dados');
   const mapped=new Map(part.map(x=>[x.ticker,x]));
   for(const item of d.data){
    const ticker=clean(String(item.s||'').split(':').pop()),row=mapped.get(ticker);
    if(!row)continue;
    const patch=scannerFields(m,ticker,item);
    if(Object.keys(patch).length<6)continue;
    if(update(row,patch,m,'TradingView · screener (GitHub)',now))updates++;
   }
  }catch(e){errors.push(String(e.message||e).slice(0,110));
   if(/429|403|bloqueada|limitada/.test(String(e))) {blocked=true;break}}
 }
 return {updates,errors:errors.slice(0,5),blocked};
}
function secEvidence(row,doc){
 if(!doc||!/^0*\d{1,10}$/.test(String(doc.cik||'')))return false;
 const map={revenue_growth_yoy:'revenue_growth_yoy',eps_growth_yoy:'eps_growth_yoy',
  fcf_margin:'fcf_margin',buyback_yield:'buyback_yield',total_shareholder_yield:'total_shareholder_yield'};
 const patch={};for(const [key,field] of Object.entries(map)){
  if(finite(doc[field])===null)continue;
  const proof=doc.linhagem_indicadores?.[field];
  if(!Array.isArray(proof)||!proof.length)continue;
  patch[key]=doc[field];
 }
 if(!Object.keys(patch).length)return false;
 if(doc.linhagem_indicadores)patch.linhagem_indicadores=doc.linhagem_indicadores;
 if(/^\d{4}-\d{2}-\d{2}$/.test(String(doc.retorno_exercicio||'')))
  patch.sec_facts_at=doc.retorno_exercicio;
 if(!row.cik)patch.cik=doc.cik;
 return update(row,patch,'US','SEC EDGAR XBRL (GitHub)',null);
}
function enrichUS(rows){
 const sec=readJson('dados-publicos/sec-fundamentos.json');
 if(!sec?.tickers||!sec.gerado_em)return {updates:0,reason:'SEC público ausente'};
 let updates=0;for(const row of rows)if(secEvidence(row,sec.tickers[row.ticker]))updates++;
 return {updates,companies:Object.keys(sec.tickers).length,asOf:sec.gerado_em};
}
function cvmEvidence(row,registry){
 if(!registry||!Array.isArray(registry.emissores))return false;
 const exact=String(row.emissor_cnpj||'').replace(/\D/g,''),name=String(row.empresa||'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
 if(!name||!exact)return false;
 const found=registry.emissores.find(x=>x.cnpj===exact&&x.nomes?.some(z=>String(z).normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim().toUpperCase()===name));
 if(!found)return false;
 // Apenas prova de identidade cadastral: jamais inferir índices a partir de documentos.
 return false;
}
async function catalogUS(){
 const sources=[
  ['https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt','NASDAQ','Symbol','Security Name'],
  ['https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt','NYSE','ACT Symbol','Security Name']
 ];
 const rows=[];for(const [url,exchange,tickerKey,nameKey] of sources){
  const text=await (await request(url,{},16000)).text();
  const lines=text.replace(/\r/g,'').split('\n').filter(x=>x.includes('|'));
  const names=lines.shift()?.split('|')||[];
  const index=Object.fromEntries(names.map((n,i)=>[n,i]));
  for(const line of lines){
   const f=line.split('|'),ticker=clean(f[index[tickerKey]]),name=f[index[nameKey]];
   if(!/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(ticker)||!name||f[index['ETF']]==='Y'||f[index['Test Issue']]==='Y')continue;
   if(exchange==='NYSE'&&f[index.Exchange]!=='N')continue;
   rows.push({ticker,company_name:name.slice(0,180),exchange,
    security_type:/\b(UNIT|WARRANT|RIGHT|PREFERRED|NOTE|ETF|ETN|FUND)\b/i.test(name)?'other':'stock'});
  }
 }
 if(rows.length<3000)throw Error('Catálogo Nasdaq incompleto');
 return rows;
}
async function catalogBR(){
 const all=[];
 for(let page=1;page<=6;page++){
  const token=process.env.BRAPI_TOKEN;
  const h={Accept:'application/json'};if(token)h.Authorization='Bearer '+token;
  const obj=await(await request('https://brapi.dev/api/quote/list?type=stock&limit=1500&page='+page,{headers:h},18000)).json();
  const list=obj.stocks||[];
  for(const item of list){
   const ticker=clean(item.stock||item.ticker||item.symbol);
   if(/^[A-Z]{4}\d{1,2}$/.test(ticker))
    all.push({ticker,empresa:String(item.name||item.longName||ticker).slice(0,180),setor:item.sector||null});
  }
  if(!obj.hasNextPage)break;
 }
 if(all.length<150)throw Error('Catálogo B3 incompleto');
 return [...new Map(all.map(r=>[r.ticker,r])).values()];
}
async function documents(rows,m){
 if(m!=='US')return {updates:0,reason:'CVM processada por fonte pública independente'};
 // Dados oficiais por CIK existente; uma prova documental não prova automaticamente métricas.
 const selected=rows.filter(x=>/^\d{10}$/.test(String(x.cik||''))).slice(0,12);
 let updates=0,blocked=false;
 for(const row of selected){
  try{
   const r=await request(edge+'/v1/sec-documento?cik='+encodeURIComponent(row.cik),{},14000);
   const d=await r.json();if(!d?.ok||d.cik!==row.cik||
    !['10-Q','10-K','20-F','40-F','10-Q/A','10-K/A','20-F/A','40-F/A'].includes(d.form)||
    !/^\d{10}-\d{2}-\d{6}$/.test(d.accessionNumber)||!d.documentUrl?.startsWith('https://www.sec.gov/Archives/edgar/data/'))continue;
   const patch={documento_balanco_tipo:d.form,documento_balanco_id:d.accessionNumber,
    documento_balanco_url:d.documentUrl,documento_balanco_publicado_em:d.filingDate,
    data_competencia_balanco:d.reportDate};
   if(update(row,patch,'US','SEC EDGAR Submissions (GitHub)',null))updates++;
  }catch(e){if(/403|429|bloquead|limitad/i.test(String(e))){blocked=true;break}}
 }
 return {updates,blocked,checked:selected.length};
}
async function finnhub(rows){
 const token=process.env.FINNHUB_TOKEN;
 if(!token)return {updates:0,enabled:false,reason:'Sem FINNHUB_TOKEN no GitHub Actions; preserve dados anteriores'};
 let updates=0,blocked=false,attempted=0;
 for(const row of rows.slice(0,12)){
  try{
   const r=await request('https://finnhub.io/api/v1/stock/metric?symbol='+encodeURIComponent(row.ticker)+'&metric=all&token='+encodeURIComponent(token),
    {headers:{Accept:'application/json'}},12500);
   const d=(await r.json()).metric||{},patch={
    forward_pe:finite(d.forwardPE),peg_ratio:finite(d.forwardPEG)??finite(d.pegTTM),
    ev_fcf:finite(d['currentEv/freeCashFlowTTM']),
    revenue_growth_yoy:finite(d.revenueGrowthTTMYoy),eps_growth_yoy:finite(d.epsGrowthTTMYoy)};
   attempted++;if(update(row,patch,'US','Finnhub · métricas oficiais da API',null))updates++;
  }catch(e){if(/403|429|bloquead|limitad/i.test(String(e))){blocked=true;break}}
 }
 return {updates,blocked,attempted,enabled:true};
}
function computeSnapshot(data,m,changes){
 const now=new Date(),base=data.universe_rows;
 const scoreKey=m==='BR'?'score_quant_br':'score_quant_us';
 const sorted=[...base].sort((a,b)=>(Number(b[scoreKey])||-1)-(Number(a[scoreKey])||-1)||a.ticker.localeCompare(b.ticker));
 // Não remover empresas elegíveis só pela indisponibilidade transitória de um feed.
 if(sorted.length<minRows[m])throw Error('Universo encolheu; operação bloqueada');
 const median=key=>{const arr=sorted.map(r=>finite(r[key])).filter(x=>x!==null).sort((a,b)=>a-b);return arr.length?arr[Math.floor((arr.length-1)/2)]:null};
 const sectors=[...new Set(sorted.map(r=>r[m==='BR'?'setor':'sector']).filter(Boolean))].sort();
 const medians={roe:median('roe'),roic:median('roic'),dy:median('dividend_yield'),payout:median('payout_implicito'),
  momentum:median('momentum_12_1'),forward_pe:median('forward_pe'),total_yield:median('total_shareholder_yield')};
 const covered={com_score:sorted.filter(r=>finite(r[scoreKey])!==null).length,com_roic:sorted.filter(r=>finite(r.roic)!==null).length,
  com_roe:sorted.filter(r=>finite(r.roe)!==null).length,
  com_dividendos:sorted.filter(r=>finite(r.dividend_yield)!==null).length,
  com_momentum:sorted.filter(r=>finite(r.momentum_12_1)!==null).length,
  cobertura_media_pct:sorted.reduce((n,r)=>n+(finite(r.cobertura_pct)||0),0)/sorted.length};
 const scatter=sorted.slice(0,180).map(r=>({ticker:r.ticker,roe:r.roe,roic:r.roic,dy:r.dividend_yield,
  payout:r.payout_implicito,pvp:r.pvp,ev_ebitda:r.ev_ebitda,fcf_yield:r.fcf_yield,momentum:r.momentum_12_1,
  forward_pe:r.forward_pe,score:r[scoreKey],cap:r[m==='BR'?'valor_mercado_brl':'market_cap_usd']}));
 const updated=changes>0?now.toISOString():data.last_update;
 return {...data,rows:sorted.slice(0,50),universe_rows:sorted,universe_complete:true,universe_scope:'eligible',
  total:sorted.length,market:m,page:0,page_size:50,coverage:covered,medians,sectors,scatter,
  highlights:sorted.slice(0,4),last_update:updated,snapshot_model:'v897-public-actions',
  pipeline_origin:'github-actions-public',ok:true};
}
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const mode=process.env.SCREENERS_MODE||'rotina';
 const br=await bootstrap('BR'),us=await bootstrap('US');
 const src={BR:br,US:us},metrics={};
 let changedBR=0,changedUS=0;
 if(['rotina','fundamentos','enriquecer','precos'].includes(mode)){
  const rotate=Math.floor(Date.now()/(4*3600000));
  const b=br.universe_rows;
  const u=us.universe_rows,chunk=120,start=(rotate%Math.ceil(u.length/chunk))*chunk;
  const [rb,ru]=await Promise.all([scanner('BR',b),scanner('US',u.slice(start,start+chunk))]);
  metrics.scanner={BR:rb,US:ru};changedBR+=rb.updates;changedUS+=ru.updates;
 }
 if(['rotina','sec','sec_xbrl','fundamentos','enriquecer'].includes(mode)){
  const q=enrichUS(us.universe_rows);metrics.sec=q;changedUS+=q.updates;
 }
 if(['rotina','documentos','sec','sec_xbrl'].includes(mode)){
  const x=await documents(us.universe_rows,'US');metrics.documentos=x;changedUS+=x.updates;
 }
 if(['rotina','finnhub','enriquecer'].includes(mode)){
  const x=await finnhub(us.universe_rows);metrics.finnhub=x;changedUS+=x.updates;
 }
 if(['catalogo','rotina-semanal'].includes(mode)){
  const cats={generated:new Date().toISOString(),source:{BR:'brapi.dev',US:'Nasdaq Trader'},markets:{}};
  for(const m of ['BR','US']){
   try{cats.markets[m]=m==='BR'?await catalogBR():await catalogUS()}
   catch(e){metrics['catalogo_'+m]={error:String(e.message||e)}}
  }
  if(Object.values(cats.markets).length===2)
   fs.writeFileSync(path.join(output,'catalogo.json'),JSON.stringify(cats));
  metrics.catalogo={BR:cats.markets.BR?.length||0,US:cats.markets.US?.length||0};
 }
 const bFinal=computeSnapshot(br,'BR',changedBR),uFinal=computeSnapshot(us,'US',changedUS);
 if(!valid(bFinal,'BR',br.universe_rows.length)||!valid(uFinal,'US',us.universe_rows.length))
  throw Error('Snapshot de saída incompleto; não alterar nenhum mercado');
 for(const [m,d] of [['BR',bFinal],['US',uFinal]]){
  fs.writeFileSync(path.join(output,m+'.json'),JSON.stringify(d));
  if(fs.statSync(path.join(output,m+'.json')).size>1800000)throw Error('Snapshot maior que a borda: '+m);
 }
 const status={processedAt:new Date().toISOString(),mode,records:{BR:bFinal.universe_rows.length,US:uFinal.universe_rows.length},
  changed:{BR:changedBR,US:changedUS},metrics,
  supabase_requests:0,cache_source:'GitHub Actions -> Cloudflare KV'};
 fs.writeFileSync(path.join(output,'status.json'),JSON.stringify(status,null,2));
 console.log(JSON.stringify(status));
}
if(require.main===module)main().catch(e=>{console.error('COLETA BLOQUEADA: '+String(e.message||e));process.exitCode=1});
module.exports={valid,scannerFields,computeSnapshot,secEvidence,score,update};
