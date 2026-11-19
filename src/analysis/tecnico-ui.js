/* Análises Técnicas v762: duas sub-abas independentes, sem polling ou banco Supabase. */
(function(w,d){
'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const fmt=(v,n=1)=>v==null||!Number.isFinite(Number(v))?'N/D':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:n,maximumFractionDigits:n});
const pairs=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','LINKUSDT','AVAXUSDT','DOTUSDT','LTCUSDT','BCHUSDT','UNIUSDT','TRXUSDT','XLMUSDT','ATOMUSDT','NEARUSDT','APTUSDT','SUIUSDT','TONUSDT'];
const basicBR=['PETR4','VALE3','ITUB4','BBDC4','BBAS3','WEGE3','ABEV3','B3SA3','PRIO3','RENT3','SUZB3','ELET3','BPAC11','RADL3','GGBR4','VIVT3'];
const basicUS=['AAPL','MSFT','NVDA','AMZN','GOOGL','META','AVGO','TSLA','AMD','NFLX','JPM','V','XOM','CVX','PBR','LLY','COST','UNH'];
const presets=[['todos','Todos (Nota Geral)'],['fibo','Fibonaccing · Filé Mignon + 4-Barras'],['pisani','Pisani · Breakout + OBV Rompido'],['minervini','Minervini · 8/8 + VCP'],['dupla','Dupla Confluência · Fundam. + Técnico'],['afastamento','Pisani · Afastamento SMA20'],['squeeze','Bollinger · Squeeze'],['protecao','Proteção de Carteira · Exaustão'],['oneil','O\'Neil: CAN SLIM + Cup & Handle / Flat Base'],['pocket','O\'Neil: Pocket Pivot (Entrada Antecipada)'],['stormer','Stormer: Setup 9.1/9.2/9.3 & PFR'],['stormer-trap','Stormer: Trap / Armadilha'],['lemos','Lemos: Cruzamento EMA 9 x 21 + 1-2-3'],['pring','Pring: KST + Virada de Momentum']];
const create=()=>({tf:'1d',dir:'both',filter:'all',preset:'todos',search:'',rows:[],universe:[],next:0,loading:false,worker:null,workerReject:null,abort:null,error:'',info:'',detail:'',updatedAt:'',busyPDF:false,progress:0,token:0,source:'',owner:''});
const states={br:create(),world:create()};
let current='',observer=null;
const owner=()=>typeof SESS!=='undefined'&&SESS?.uid?SESS.uid:'local';
const holdings=()=>{try{return w.DiarioScreeners?.holdings?.()||[]}catch{return []}};
function markHoldings(rows){const own=new Set(holdings().map(x=>String(x.ticker).toUpperCase()));return rows.map(x=>({...x,holding:own.has(x.ticker)||own.has(x.bdr)}))}
function db(){
 return new Promise(resolve=>{
  if(!w.indexedDB)return resolve(null);
  try{const r=indexedDB.open('diario-tecnico-v762',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('data'))r.result.createObjectStore('data',{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);r.onblocked=()=>resolve(null)}catch{resolve(null)}
 });
}
async function store(key,item){
 const base=await db();if(!base)return;
 return new Promise(resolve=>{try{const tx=base.transaction('data','readwrite');tx.objectStore('data').put({key,version:'tecnico-779.1',when:Date.now(),item});tx.oncomplete=()=>{base.close();resolve()};tx.onerror=()=>{base.close();resolve()}}catch{base.close();resolve()}});
}
async function read(key,ttl){
 const base=await db();if(!base)return null;
 return new Promise(resolve=>{try{const tx=base.transaction('data','readonly'),r=tx.objectStore('data').get(key);r.onsuccess=()=>resolve(r.result?.version==='tecnico-779.1'&&Date.now()-r.result.when<ttl?r.result.item:null);r.onerror=()=>resolve(null);tx.oncomplete=()=>base.close()}catch{base.close();resolve(null)}});
}
async function fundamental(m,signal){
 let snap=null;
 if(w.indexedDB)try{
  const base=await new Promise(resolve=>{const r=indexedDB.open('diario-screeners-publicos-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);r.onupgradeneeded=()=>resolve(null)});
  if(base&&base.objectStoreNames.contains('snapshots'))snap=await new Promise(resolve=>{const tx=base.transaction('snapshots'),r=tx.objectStore('snapshots').get(m);r.onsuccess=()=>resolve(r.result?.data||null);r.onerror=()=>resolve(null);tx.oncomplete=()=>base.close()});else base?.close();
 }catch{}
 if(snap?.universe_complete&&Array.isArray(snap.universe_rows))return snap;
 const base=edgeBase();
 try{const response=await fetch(base+'/v1/screeners?market='+m+'&snapshot=1&universe=1',{signal,cache:'force-cache'});if(response.ok){const data=await response.json();if(data?.universe_complete&&Array.isArray(data.universe_rows))return data}}catch(e){if(signal.aborted)throw e}
 return snap;
}
function edgeBase(){
 // O host fica fechado ao Worker já autorizado na CSP; nunca aceita URL arbitrária.
 const fallback='https://diario-screeners-quant.lucianosilva43567.workers.dev';
 try{const supplied=new URL(w.DIARIO_SCREENERS_EDGE_URL||fallback);
  return supplied.protocol==='https:'&&supplied.hostname.endsWith('.workers.dev')?supplied.origin:fallback;
 }catch{return fallback}
}
const validTicker=(v,market)=>market==='BR'?/^[A-Z]{4}\d{1,2}$/.test(v):/^[A-Z]{1,5}(?:\.[A-Z])?$/.test(v);
function candidates(s,m,snapshot){
 const region=m==='br'?'BR':'US',data=(snapshot?.universe_rows||[]),from=data.map(row=>{
  const ticker=String(row.ticker||'').toUpperCase(),market=region;
  const liq=Number(region==='BR'?row.liquidez_diaria_brl:row.avg_daily_volume_usd);
  return {ticker,market,name:row.empresa||row.company_name||ticker,bdr:row.bdr_ticker||'',liquidity:Number.isFinite(liq)?liq:0,fund:Number(row[region==='BR'?'score_quant_br':'score_quant_us'])||null,
   fundamentals:Object.fromEntries(['eps_growth_yoy','eps_growth_qoq','eps_growth_annual_3y','roe','institutional_sponsorship_verified'].map(k=>[k,typeof row[k]==='number'&&Number.isFinite(row[k])?row[k]:row[k]===true?true:null]))};
 }).filter(x=>validTicker(x.ticker,x.market)&&x.liquidity>=(region==='BR'?1e6:2e6));
 const pool=data.length?from:((region==='BR'?basicBR:basicUS).map(ticker=>({ticker,market:region,name:ticker,bdr:'',liquidity:0,fund:null})));
 const merged=new Map(pool.map(x=>[x.ticker,x]));
 for(const h of holdings()){
  const ticker=String(h.ticker||'').toUpperCase();
  if(validTicker(ticker,region)&&!merged.has(ticker))merged.set(ticker,{ticker,market:region,name:ticker,bdr:'',liquidity:0,fund:null});
 }
 const listed=[...merged.values()].sort((a,b)=>b.liquidity-a.liquidity);
 const crypto=pairs.map(ticker=>({ticker,market:'CRYPTO',name:ticker.replace('USDT',' / USDT'),bdr:'',liquidity:0,fund:null}));
 return m==='br'?listed:listed.slice(0,60).concat(crypto.slice(0,20),listed.slice(60));
}
function barrasRecentes(rows,asset,tf){
 if(!Array.isArray(rows)||rows.length<250)return false;
 const last=rows.at(-1),seconds=Array.isArray(last)?Number(last[0]):Number(last?.t);
 const age=Date.now()-seconds*1000,days=(tf==='1d'?(asset.market==='CRYPTO'?2:7):(asset.market==='CRYPTO'?1:5));
 return Number.isFinite(age)&&age>=-3600000&&age<=days*86400000;
}
async function candles(asset,tf,signal){
 const key='candles|'+asset.market+'|'+asset.ticker+'|'+tf,ttl=tf==='1d'?6*3600000:10*60000;
 const hit=await read(key,ttl);if(barrasRecentes(hit?.candles,asset,tf)&&(tf!=='1d'||hit.candles.length>=400))return hit;
 // Reaproveita exclusivamente OHLCV local completo do gráfico legado, nunca snapshots de preço isolado.
 try{const h=typeof LVGC==='object'?LVGC[asset.ticker+'|'+tf]:null;
  const c=h?.v?.candles;
  if(!h?.v?.proxy&&barrasRecentes(c,asset,tf)&&(tf!=='1d'||c.length>=400)&&Date.now()-Number(h.ts)<ttl&&c.every(x=>Array.isArray(x)&&x.length>=6&&Number.isFinite(Number(x[5])))){
   const result={candles:c,source:'Histórico em cache do Terminal',fetchedAt:new Date(h.ts).toISOString()};
   void store(key,result);return result;
  }
 }catch{}
 // Se uma ponte já oferecer OHLCV validado, reaproveitar sem outra requisição.
 try{const local=w.DiarioTecnicoFeeds?.getCandles?.(asset.ticker,tf,asset.market);
  if(barrasRecentes(local,asset,tf)&&(tf!=='1d'||local.length>=400)){
   const result={candles:local,source:'Feed local Profit/Finnhub/Binance',fetchedAt:new Date().toISOString()};
   void store(key,result);return result;
  }
 }catch{}
 const url=edgeBase()+'/v1/tecnico-candles?market='+asset.market+'&ticker='+encodeURIComponent(asset.ticker)+'&tf='+tf;
 const response=await fetch(url,{signal,cache:'force-cache'});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||!payload.ok)throw Error(payload.error||'Candles HTTP '+response.status);
  if(!barrasRecentes(payload.candles,asset,tf)||(tf==='1d'&&payload.candles.length<400))
  throw Error('Não confirmado / Não calculável — OHLCV diário incompleto, mínimo 400 barras');
 const adjusted=Array.isArray(payload.adjustedCandles)&&payload.adjustedCandles.length===payload.candles.length?
  payload.adjustedCandles:null;
 const result={candles:payload.candles,adjustedCandles:adjusted,source:payload.source,fetchedAt:payload.fetchedAt};
 void store(key,result);return result;
}
async function receive(asset,tf,signal){
 const primary=await candles(asset,tf,signal);
 let daily=primary,higher=null;
 if(tf!=='1d')daily=await candles(asset,'1d',signal);
 if(tf==='15m')higher=await candles(asset,'1h',signal);
 if(tf==='1h')higher=daily;
 return {...asset,candles:primary.candles,daily:daily.candles,adjustedDaily:daily.adjustedCandles||null,higher:higher?.candles||null,source:primary.source,updatedAt:primary.fetchedAt};
}
const active=()=>current&&d.querySelector('#an-root [data-tech-root="'+current+'"]');
function render(){
 if(!current||!active()||typeof tab!=='undefined'&&tab!=='analises')return;
 const root=d.getElementById('an-root');if(root){root.outerHTML=w.DiarioAnalises.view();}
}
function side(r,s){
 if(s.dir==='buy')return ['buy',r.buy];
 if(s.dir==='sell')return ['sell',r.sell];
 const a=r.buy?.score??-1,b=r.sell?.score??-1;return a>=b?['buy',r.buy]:['sell',r.sell];
}
function qualifies(r,s){
 const [key,x]=side(r,s),valid=x?.valid;
 if(!valid)return false;
 if(s.filter==='us'&&r.market!=='US'||s.filter==='crypto'&&r.market!=='CRYPTO')return false;
 if(s.search&&!r.ticker.includes(s.search.toUpperCase())&&!r.name.toUpperCase().includes(s.search.toUpperCase()))return false;
 switch(s.preset){
  case 'fibo':return x.fib.zone&&(x.fib.cluster||x.turn.armed);
  case 'pisani':return x.pisani.breakout&&x.metrics.obvConfirmed;
  case 'minervini':return x.minervini.score===8&&x.vcp;
  case 'dupla':return r.fund>=65&&(r.buy.eligible||r.sell.eligible);
  case 'afastamento':return x.pisani.away;
  case 'squeeze':return x.bollinger.squeeze||x.bollinger.breakout;
  case 'protecao':return r.holding&&(x.fib.exhausted||x.elliott.valid);
  case 'oneil':return key==='buy'&&!!(x.institutional?.cupHandle?.armed||x.institutional?.flatBase?.armed||x.institutional?.canSlim?.partial);
  case 'pocket':return key==='buy'&&!!x.institutional?.pocket?.armed;
  case 'stormer':return !!(x.institutional?.stormer?.setup91?.armed||x.institutional?.stormer?.setup92?.armed||x.institutional?.stormer?.setup93?.armed||x.institutional?.stormer?.pfr?.armed);
  case 'stormer-trap':return !!x.institutional?.stormer?.trap?.armed;
  case 'lemos':return !!(x.institutional?.lemos?.ema921?.armed||x.institutional?.lemos?.reversal123?.armed);
  case 'pring':return !!x.institutional?.pring?.armed;
  default:return true;
 }
}
function selectedRows(s){return markHoldings(s.rows).filter(r=>qualifies(r,s)).sort((a,b)=>(side(b,s)[1]?.score??-1)-(side(a,s)[1]?.score??-1)||a.ticker.localeCompare(b.ticker))}
function autoTop(s){
 return selectedRows(s).filter(r=>{
  const [direction,x]=side(r,s),plan=x?.plan||{};
  // Não usar ativo sem candles, sem OBV/RS ou alvos negativos só para preencher dez posições.
  const prices=['entry','stop','target1','target2a','target2','targetFinal'];
  return x?.valid&&x.eligible&&x.barCount>=250&&x.flags.length===0&&
   x.metrics?.obvConfirmed&&Number.isFinite(x.metrics.rs)&&
   Number.isFinite(plan.rr)&&plan.rr>=1.5&&
   prices.every(key=>Number.isFinite(plan[key])&&plan[key]>0)&&
   (direction==='buy'?plan.stop<plan.entry&&plan.target1>plan.entry:
      plan.stop>plan.entry&&plan.target1<plan.entry);
 }).slice(0,10).map(r=>({...r,pdfSide:side(r,s)[0]}));
}
function avisoPdfInsuficiente(s,quantidade){
 const message='Encontrados '+quantidade+' de 10 ativos validados no cenário atual. '+
  'Por rigor metodológico, o dossiê completo exige 10 ativos com histórico OHLCV válido, '+
  'OBV e força relativa confirmados, risco/retorno >= 1,5, preços positivos e sem sinais esticados. '+
  (s.loading?'Aguarde a carga de candles.':'Atualize os candles ou amplie o cenário e carregue mais ativos.');
 s.error=message;render();if(typeof w.alert==='function')w.alert(message);
}

function badges(r,x){return (x.eligible?'<span class="tech-tag">SETUP CONDICIONAL</span>':'')+(x.metrics?.obvConfirmed?'<span class="tech-tag good">OBV ROMPIDO</span>':'')+(x.metrics?.mtf===true?'<span class="tech-tag">MTF ALINHADO</span>':'')+(x.fib?.cluster?'<span class="tech-tag">FIBONACCING CLUSTER</span>':'')+(x.flags||[]).map(y=>'<span class="tech-tag bad">'+E(y)+'</span>').join('')}
function kpis(s){
 const good=s.rows.filter(r=>r.buy?.eligible).length,short=s.rows.filter(r=>r.sell?.eligible).length,both=s.rows.filter(r=>r.buy?.metrics?.obvConfirmed&&r.buy?.metrics?.rvol>1||r.sell?.metrics?.obvConfirmed&&r.sell?.metrics?.rvol>1).length,
 confl=s.rows.filter(r=>(r.buy?.fib?.cluster||r.sell?.fib?.cluster)&&(r.buy?.pisani?.breakout||r.sell?.pisani?.breakout||r.buy?.minervini?.score===8)).length;
 const n=s.rows.filter(r=>r.buy?.valid).length||0,rate=x=>n?fmt(x/n*100,1)+'%':'—';
 return '<div class="scr-kpis tech-kpis">'+[['% Setups Compra',rate(good)],['% Setups Venda',rate(short)],['OBV Rompido + Vol > 1,0x',rate(both)],['Fibonaccing & Pisani/Minervini',rate(confl)]].map(x=>'<div class="scr-kpi"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('')+'</div>';
}
function graph(rows,s){
 const data=rows.filter(r=>side(r,s)[1]?.score!=null).slice(0,120);
 const pts=data.map((r,i)=>{
  const x=side(r,s)[1],px=46+Math.max(0,Math.min(10,x.score))*58,vy=x.metrics.hvWeek||0,y=252-Math.min(30,vy)/30*210;
  return '<circle cx="'+fmt(px,0)+'" cy="'+fmt(y,0)+'" r="'+(r.holding?5.6:4)+'" fill="'+(r.holding?'#d4a017':side(r,s)[0]==='buy'?'#10b981':'#ef4444')+'" stroke="#11141b" stroke-width="1" role="button" tabindex="0" data-tech-point="'+E(r.ticker)+'" aria-label="'+E(r.ticker)+' nota '+fmt(x.score)+' volatilidade '+fmt(vy)+' porcento"><title>'+E(r.ticker)+' · '+fmt(x.score)+'/10 · '+fmt(vy)+'% vol. semanal</title></circle>';
 }).join('');
 return '<section class="scr-panel tech-panel"><div class="scr-head"><h3>Dispersão · Nota Técnica × Volatilidade</h3><span class="scr-hint">Toque no ponto para abrir o ativo</span></div>'+
 (data.length?'<svg viewBox="0 0 690 290" class="tech-svg" role="img" aria-label="Dispersão de até 120 ativos analisados"><path d="M46 25V252H654" stroke="#68707a" fill="none"/><path d="M336 25V252" stroke="#4c535b" stroke-dasharray="4 4"/>'+
 pts+'<text x="46" y="277" fill="#9ba4af" font-size="12">Nota 0/10</text><text x="654" y="277" text-anchor="end" fill="#9ba4af" font-size="12">Nota 10/10</text><text x="47" y="18" fill="#9ba4af" font-size="11">HV semanal 30%+</text></svg>':'<p>Sem séries suficientes para calcular os pontos.</p>')+'</section>';
}

async function backtestFor(s,r,raw,tf){
 if(!Array.isArray(raw)||raw.length<263)return {method:'walk-forward-next-open-v1',
  status:'não comprovado',reason:'Histórico insuficiente: 252 candles de aquecimento e 11 de saída',setups:null};
 if(s.backtestWorker){s.backtestReject?.(Error('Backtest anterior cancelado'));s.backtestWorker.terminate()}
 const wk=new Worker('tecnico-worker.js?v=781');s.backtestWorker=wk;
 const request=s.token;const market=r.market;
 try{
  const result=await new Promise((resolve,reject)=>{
   s.backtestReject=reject;
   wk.onmessage=event=>{if(event.data?.reqId!==request)return;
    if(event.data.action==='BACKTEST_DONE')resolve(event.data.result);
    else if(event.data.action==='ERROR')reject(Error(event.data.error||'Backtest indisponível'));
   };
   wk.onerror=e=>reject(Error(e.message||'Worker de backtest indisponível'));
   wk.postMessage({action:'BACKTEST',reqId:request,market,ticker:r.ticker,
    tf,candles:raw,rsHistory:r.rsHistory||null,adjustedVerified:false});
  });
  return result;
 }finally{
  wk.terminate();if(s.backtestWorker===wk){s.backtestWorker=null;s.backtestReject=null}
 }
}
async function historicoNoDetalhe(m,ticker){
 const s=states[m],token=s.token,r=s.rows.find(x=>x.ticker===ticker);
 if(!r||r.backtest||s.busyPDF)return;
 const data=await read('candles|'+r.market+'|'+ticker+'|1d',6*3600000);
 if(token!==s.token||current!==m)return;
 try{r.backtest=await backtestFor(s,r,data?.adjustedCandles||data?.candles,'1d')}
 catch(e){r.backtest={status:'não comprovado',reason:String(e.message||e).slice(0,90),setups:null}}
 if(token===s.token&&current===m&&s.detail===ticker)render();
}
function resultadoBacktest(r){
 const bt=r.backtest;
 if(!bt)return 'Walk-forward: clique no plano para calcular sobre os candles locais; nenhuma taxa de acerto presumida.';
 if(!bt.setups)return 'Walk-forward indisponível: '+E(bt.reason||'amostra insuficiente');
 const labels={pisani:'Pisani',minervini:'Minervini',fibonaccing:'Fibonaccing',elliott:'Elliott'};
 return 'Walk-forward (exploratório, custos estimados; até 250 decisões, sem look-ahead): '+
  Object.entries(bt.setups).map(([k,v])=>labels[k]+': '+v.trades+' trades · '+
   (v.winRate===null?'acerto N/D':'acerto '+fmt(v.winRate,1)+'%')+
   ' · payoff '+fmt(v.payoff,2)+' · expectativa '+fmt(v.expectancyR,3)+'R ('+E(v.status)+')').join(' | ');
}
function detail(s,rows){
 const r=rows.find(x=>x.ticker===s.detail)||markHoldings(s.rows).find(x=>x.ticker===s.detail);if(!r)return '';
 const [direction,x]=side(r,s);if(!x?.valid)return '';
 const number=v=>fmt(v,2),plan=x.plan||{};
 return '<section class="scr-panel tech-detail" id="tech-detail"><div class="scr-head"><h3>'+E(r.ticker)+' · '+(direction==='buy'?'Compra':'Venda/Short')+'</h3><button type="button" data-tech-close="1" aria-label="Fechar detalhes">Fechar</button></div>'+
 '<div class="tech-tags">'+badges(r,x)+'</div><p>Heurística de estudo (VCP, Elliott, RMC/CISD e Fibonaccing) · validação condicional.</p><p>Fonte: '+E(r.source)+' · barras: '+x.barCount+' · dados: '+E(r.updatedAt||'não informada')+'</p>'+
 '<div class="tech-metrics">'+[['SMA 20',x.metrics.sma20],['SMA 50',x.metrics.sma50],['SMA 150',x.metrics.sma150],['SMA 200',x.metrics.sma200],['ATR 14',x.metrics.atr14],['RS Rating',x.metrics.rs],['IFR 14',x.metrics.rsi14],['Volume relativo',x.metrics.rvol],['HV Semanal %',x.metrics.hvWeek],['Minervini',x.minervini.score==null?'N/D':x.minervini.score+'/8']].map(a=>'<div><span>'+a[0]+'</span><b>'+E(String(a[1]??'N/D'))+'</b></div>').join('')+'</div>'+
 '<h4>Contribuição dos quatro pilares (0 a 10)</h4>'+x.pillars.map(p=>'<div class="tech-pillar"><span>'+E(p.name)+' ('+p.weight+'%)</span><b>'+fmt(p.score*p.weight/10,2)+'</b><i><em style="width:'+Math.round(p.score*100)+'%"></em></i></div>').join('')+
 '<div class="tech-trade-plan"><h4>Plano técnico condicional</h4><div>Gatilho <b>'+number(plan.entry)+'</b> · Stop <b>'+number(plan.stop)+'</b> · Alvo 1 (111%) <b>'+number(plan.target1)+'</b> · Alvo 2 (127,2%) <b>'+number(plan.target2a)+'</b> · Alvo 3 (141,4%) <b>'+number(plan.target2)+'</b> · Final (161,8%) <b>'+number(plan.targetFinal)+'</b> · R/R <b>'+number(plan.rr)+'</b> · R/R líquido estimado <b>'+number(plan.rrNet)+'</b></div><small>Custos ilustrativos de ida+volta: '+number(plan.costEstimateBps)+' bps; não são cotações do book nem incluem impacto/impostos. Confirme execução apenas no Profit. '+resultadoBacktest(r)+'</small></div>'+
 '<p>Fibonaccing: '+(x.fib.zone?'zona de mitigação':'fora da zona')+' · '+(x.fib.cluster?'cluster presente':'sem cluster')+' · '+(x.fib.fibogap?'Fibogap na defesa '+(x.fib.gapZone||[]).map(v=>fmt(v,2)).join('–'):'sem Fibogap aberto')+' · RMC: '+(x.turn.confirmed?'confirmado':'aguardando')+' · CISD: '+(x.turn.cisd?'confirmado':'não confirmado')+'</p>'+
 '<p>Elliott: '+E(x.elliott.label)+' — '+E(x.elliott.reason)+'</p>'+
 '<button class="btn s" type="button" data-tech-ai="'+E(r.ticker)+'">Abrir pesquisa técnica com IA existente</button></section>';
}
function view(m){
 const s=states[m],title=m==='br'?'Técnico Brasil':'Técnico EUA & Cripto',rows=selectedRows(s),top=autoTop(s);
 const option=(v,label,sel)=>'<option value="'+v+'"'+(sel===v?' selected':'')+'>'+E(label)+'</option>';
 const choice=(name,opts,val)=>'<select data-tech-change="'+name+'">'+opts.map(x=>option(x[0],x[1],val)).join('')+'</select>';
 return '<div data-tech-root="'+m+'"><header class="an-header"><div><p class="an-kicker">SCREENING TÉCNICO · CLIENT-SIDE</p><h1 id="an-title">'+title+'</h1><p>Fibonaccing / Pisani / Minervini / Elliott · cálculos por candle · não constitui recomendação</p></div><span class="an-badge">'+s.rows.length+' analisados</span></header>'+
 '<div class="tech-controls"><label>Direção '+choice('dir',[['buy','Compra · Alta'],['sell','Venda / Short · Baixa'],['both','Ambos']],s.dir)+'</label>'+
 '<label>Timeframe '+choice('tf',[['1d','Diário (1D)'],['1h','60 minutos (1H)'],['15m','15 minutos (15M)']],s.tf)+'</label>'+
 (m==='world'?'<label>Mercado '+choice('filter',[['all','Todos'],['us','Ações EUA'],['crypto','Cripto Binance']],s.filter)+'</label>':'')+
 '<label>Busca <input data-tech-search type="search" value="'+E(s.search)+'" placeholder="Ticker / nome" autocomplete="off"></label></div>'+
 '<div class="tech-presets" role="group" aria-label="Cenários técnicos">'+presets.map(x=>'<button type="button" data-tech-preset="'+x[0]+'" class="'+(s.preset===x[0]?'selected':'')+'">'+E(x[1])+'</button>').join('')+'</div>'+
 '<div class="scr-top"><span role="status" aria-live="polite">'+(s.loading?'Coletando candles sob demanda: '+s.progress+' ativo(s)…':s.error?E(s.error):E(s.info||'Snapshot local com prazo de validade.'))+'</span><div class="tech-action-grid"><button class="btn s" type="button" data-tech-reload="1" '+(s.loading?'disabled':'')+'>Atualizar</button> <button class="btn s" type="button" data-tech-more="1" '+(s.loading||s.next>=s.universe.length?'disabled':'')+'>Carregar mais</button> <button class="btn s" type="button" data-tech-pdf="1" '+(s.busyPDF?'disabled':'')+'>Dossiê PDF Top '+top.length+'</button></div></div>'+
 '<p class="tech-note">Cobertura: '+s.rows.length+' de '+s.universe.length+' ativos candidatos · filtragem mínima B3 R$ 1 milhão/dia; EUA US$ 2 milhões/dia. RS usa o universo fixo inicial (até 60 BR, 60 EUA e 20 cripto), com benchmark e data; sem cobertura total o RS é Não confirmado. Nunca há varredura ou polling de banco em segundo plano.</p>'+
 kpis(s)+graph(rows,s)+
 '<section class="scr-panel tech-panel"><div class="scr-head"><h3>Ranking · '+rows.length+' no cenário</h3><span class="scr-hint">Nota de 0 a 10 · top automático exige confirmação e não estar esticado</span></div>'+
 '<div class="scr-table-wrap"><table class="tech-table"><thead><tr><th>Ativo</th><th>Direção</th><th>Nota / 10</th><th>RS</th><th>Vol. relativo</th><th>Fibo / OBV</th><th>Estado</th><th>Detalhe</th></tr></thead><tbody>'+
 rows.slice(0,60).map(r=>{const [key,x]=side(r,s);return '<tr><th>'+E(r.ticker)+(r.bdr?' <small>BDR '+E(r.bdr)+'</small>':'')+(r.holding?' <small>CARTEIRA</small>':'')+'</th><td>'+(key==='buy'?'COMPRA':'SHORT')+'</td><td class="tech-num">'+fmt(x.score)+'</td><td class="tech-num">'+fmt(x.metrics.rs,0)+'</td><td class="tech-num">'+fmt(x.metrics.rvol,2)+'x</td><td>'+ (x.fib.cluster?'CLUSTER · ':'')+(x.metrics.obvConfirmed?'OBV ✓':'OBV pendente')+'</td><td>'+E(x.flags.join(', ')|| (x.eligible?'Elegível':'Em avaliação'))+'</td><td><button type="button" data-tech-detail="'+E(r.ticker)+'">Ver plano</button></td></tr>'}).join('')+
 '</tbody></table></div>'+(rows.length?'':'<p class="scr-empty">Nenhum setup com candles e critérios confirmados para este filtro. Não foram simuladas cotações.</p>')+'</section>'+
 detail(s,rows)+'<p class="an-disclaimer">Estruturas de Fibonaccing, RMC/CISD, VCP e Elliott são heurísticas codificadas conforme os critérios deste projeto, não certificação dos autores. A classificação só se confirma com dados históricos suficientes.</p></div>';
}
function leave(){
 if(current){const s=states[current];s.token++;s.abort?.abort();s.abort=null;s.workerReject?.(Error('Análise técnica interrompida ao sair da aba'));s.workerReject=null;s.worker?.terminate();s.worker=null;s.backtestReject?.(Error('Aba fechada'));s.backtestWorker?.terminate();s.backtestWorker=null;s.backtestReject=null;s.loading=false;s.busyPDF=false;}
 current='';observer?.disconnect();observer=null;
}
function watch(){
 if(observer)return;
 observer=new MutationObserver(()=>{queueMicrotask(()=>{if(current&&!active())leave()})});
 observer.observe(d.getElementById('app')||d.body,{childList:true,subtree:true});
}
async function enter(m){
 if(!states[m])return;
 if(current&&current!==m)leave();current=m;watch();
 const s=states[m],u=owner();
 if(s.owner!==u){s.owner=u;s.rows=[];s.universe=[];s.next=0;s.detail='';}
 if(s.rows.length||s.loading)return;
 const cached=await read('snapshot|'+m+'|'+s.tf,15*60000);
 if(current!==m||owner()!==u)return;
 if(cached?.rows?.length&&cached.rsUniversoFixo==='v779'){s.rows=markHoldings(cached.rows);s.universe=cached.universe||[];s.next=cached.next||s.rows.length;s.updatedAt=cached.updatedAt||'';s.info='Snapshot local · '+s.updatedAt;render();return}
 void load(m);
}
async function load(m,more=false){
 const s=states[m],u=owner();s.token++;const token=s.token;s.abort?.abort();s.workerReject?.(Error('Substituída por nova análise'));s.workerReject=null;s.worker?.terminate();s.worker=null;
 const ac=new AbortController();s.abort=ac;s.loading=true;s.error='';s.progress=0;
 if(!more){s.rows=[];s.next=0;s.universe=[]}render();
 try{
  if(!s.universe.length){
   const fundamentals=await fundamental(m==='br'?'BR':'US',ac.signal);
   s.universe=candidates(s,m,fundamentals);
   // Fundamentalista: apenas leitura do snapshot já existente.
   s.fundData=Object.fromEntries((fundamentals?.universe_rows||[]).map(r=>[r.ticker,Number(r[m==='br'?'score_quant_br':'score_quant_us'])||null]));
  }
  const chunk=s.universe.slice(s.next,s.next+(more?12:(m==='br'?60:80)));
  if(!chunk.length){s.info='Todos os candidatos locais já foram examinados.';return}
  const collected=[],failures=[];
  let index=0;
  const worker=async()=>{
   while(index<chunk.length&&token===s.token&&!ac.signal.aborted){
    const asset=chunk[index++];
    try{
     const item=await receive(asset,s.tf,ac.signal),daily=item.daily||[];
     if(daily.length>=20){
      const liquid=daily.slice(-20).reduce((a,c)=>a+Number(c[4]??c.c)*Number(c[5]??c.v),0)/20;
      if(asset.market!=='CRYPTO'&&liquid<(asset.market==='BR'?1e6:2e6))throw Error('Liquidez insuficiente');
      const close=Number(daily.at(-1)[4]??daily.at(-1).c);
      if(asset.market!=='CRYPTO'&&close<1)throw Error('Penny stock');
     }
     collected.push(item);
    }catch(e){if(!ac.signal.aborted)failures.push(asset.ticker+': '+String(e.message||e).slice(0,55))}
    s.progress++;if(token===s.token)render();
   }
  };
  await Promise.all(Array.from({length:8},()=>worker()));
  if(ac.signal.aborted||token!==s.token||current!==m||owner()!==u)return;
  s.next+=chunk.length;
  if(collected.length){
   // Reavalia também ativos já analisados usando somente o IndexedDB local.
   // A força relativa compara pares do conjunto acumulado, e não apenas 12 ativos de um lote.
   const previous=[];
   for(const prior of s.rows.slice(-108)){
    if(ac.signal.aborted||token!==s.token)break;
    const asset=s.universe.find(x=>x.ticker===prior.ticker);
    if(!asset)continue;
    const head=await read('candles|'+asset.market+'|'+asset.ticker+'|'+s.tf,6*3600000);
    const daily=s.tf==='1d'?head:await read('candles|'+asset.market+'|'+asset.ticker+'|1d',6*3600000);
    const higher=s.tf==='15m'?await read('candles|'+asset.market+'|'+asset.ticker+'|1h',6*3600000):s.tf==='1h'?daily:null;
    if(head?.candles?.length>=210&&daily?.candles?.length>=210)
     previous.push({...asset,candles:head.candles,daily:daily.candles,higher:higher?.candles||null,source:head.source,updatedAt:head.fetchedAt});
   }
   const batch=[...previous,...collected].slice(-120);
   if(ac.signal.aborted||token!==s.token)return;
   const bench={};
   // Sem benchmark real no cache não inventar RS; a nota sinaliza a lacuna.
   for(const key of ['BR','US','CRYPTO'])try{const symbol=key==='BR'?'IBOV':key==='US'?'SPX':'BTCUSDT';let b=await read('candles|'+key+'|'+symbol+'|1d',6*3600000);if(!b?.candles)b=await candles({market:key,ticker:symbol},'1d',ac.signal);if(b?.candles)bench[key]=b.candles}catch{}
   const result=await new Promise((resolve,reject)=>{
    try{
     const wk=new Worker('tecnico-worker.js?v=779');s.worker=wk;s.workerReject=reject;
     wk.onmessage=event=>{if(event.data.reqId!==token)return;if(event.data.action==='DONE')resolve(event.data.rows);else reject(Error(event.data.error||'Falha de cálculo'))};
     wk.onerror=e=>reject(Error(e.message||'Falha no worker'));
     const fixed=s.universe.slice(0,m==='br'?60:80);
      const rsUniverse={BR:fixed.filter(x=>x.market==='BR').map(x=>x.ticker),
       US:fixed.filter(x=>x.market==='US').map(x=>x.ticker),
       CRYPTO:fixed.filter(x=>x.market==='CRYPTO').map(x=>x.ticker)};
      wk.postMessage({action:'RUN',reqId:token,tf:s.tf,assets:batch,benchmarks:bench,rsUniverse,rsAsOf:new Date().toISOString()});
    }catch(e){reject(e)}
   }).finally(()=>{s.worker?.terminate();s.worker=null;s.workerReject=null});
   if(ac.signal.aborted||token!==s.token)return;
   const fund=s.fundData||{};
   const merged=result.map(x=>({...x,fund:fund[x.ticker]??s.universe.find(y=>y.ticker===x.ticker)?.fund??null}));
   const replaced=new Set(merged.map(x=>x.ticker));s.rows=markHoldings(s.rows.filter(x=>!replaced.has(x.ticker)).concat(merged));
   s.updatedAt=new Date().toLocaleString('pt-BR');s.info='Cálculo local · '+s.updatedAt+' · '+failures.length+' indisponível(is)';
   void store('snapshot|'+m+'|'+s.tf,{rows:s.rows.map(x=>({...x,holding:false})),universe:s.universe,next:s.next,updatedAt:s.updatedAt,rsUniversoFixo:'v779'});
  }else s.error='Nenhum candle histórico válido nesta amostra. '+failures.slice(0,2).join('; ')+'. Confira a publicação da rota /v1/tecnico-candles no Cloudflare Worker.';
 }catch(e){if(!ac.signal.aborted&&token===s.token)s.error=String(e.message||e).slice(0,240)}
 finally{if(token===s.token){s.loading=false;s.abort=null;render()}}
}
d.addEventListener('change',e=>{
 const el=e.target?.closest?.('[data-tech-change]');if(!el||!active())return;
 const s=states[current],key=el.dataset.techChange;
 if(!['tf','dir','filter'].includes(key))return;
 s[key]=el.value;s.detail='';
 if(key==='tf'){s.rows=[];s.universe=[];s.next=0;void load(current)}else render();
});
d.addEventListener('input',e=>{if(!e.target?.matches?.('[data-tech-search]')||!active())return;const s=states[current];s.search=e.target.value;// Refiltrar sem requisição externa.
 // A pesquisa completa é aplicada no próximo redesenho, sem timer em segundo plano.
 if(e.target.value.length===0||e.target.value.length>=2){const sel=e.target.selectionStart;render();const field=d.querySelector('[data-tech-search]');if(field){field.focus();field.setSelectionRange(sel,sel)}}
});
d.addEventListener('click',async e=>{
 const el=e.target.closest('[data-tech-preset],[data-tech-reload],[data-tech-more],[data-tech-detail],[data-tech-point],[data-tech-close],[data-tech-pdf],[data-tech-ai]');
 if(!el||!active())return;e.preventDefault();const m=current,s=states[m];
 if(el.dataset.techPreset){s.preset=el.dataset.techPreset;s.detail='';render();return}
 if(el.hasAttribute('data-tech-reload')){void load(m);return}
 if(el.hasAttribute('data-tech-more')){void load(m,true);return}
 if(el.dataset.techDetail||el.dataset.techPoint){s.detail=el.dataset.techDetail||el.dataset.techPoint;render();void historicoNoDetalhe(m,s.detail);d.getElementById('tech-detail')?.scrollIntoView({block:'start',behavior:'smooth'});return}
 if(el.hasAttribute('data-tech-close')){s.detail='';render();return}
 if(el.dataset.techAi){w.DiarioAnalises?.command?.('TECNICO '+el.dataset.techAi);return}
 if(el.hasAttribute('data-tech-pdf')&&!s.busyPDF){
  const rows=autoTop(s);
  if(rows.length!==10){avisoPdfInsuficiente(s,rows.length);return}
  // Safari/PWA: a janela precisa nascer no mesmo clique, antes do primeiro await.
  const ticket=w.DiarioPDFiOS?.prepare();
  s.busyPDF=true;s.error='';render();
  try{
   const reportRows=[];
   for(const r of rows){
    const key='candles|'+r.market+'|'+r.ticker+'|'+s.tf;
    const saved=await read(key,s.tf==='1d'?6*3600000:10*60000);
    if(!barrasRecentes(saved?.candles,r,s.tf))
     throw Error('Histórico OHLCV de '+r.ticker+' vencido ou ausente: atualize os candles antes do PDF.');
    const history=s.tf==='1d'?saved:await read('candles|'+r.market+'|'+r.ticker+'|1d',6*3600000);
    const backtest=r.backtest||await backtestFor(s,r,history?.candles,'1d');
    reportRows.push({...r,chartCandles:saved.candles,chartTimeframe:s.tf,chartSource:saved.source||r.source,backtest});
   }
   const result=await w.DiarioTecnicoPDF.share(m,reportRows,s.tf,ticket);
   if(!result.cancelled)s.info='Dossiê técnico de 10 ativos: '+result.pages+' páginas.';
  }catch(e){ticket?.close?.();s.error='PDF: '+String(e.message||e).slice(0,190)}
  finally{s.busyPDF=false;render()}
 }
});
d.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key)||!e.target.matches?.('[data-tech-point]'))return;e.preventDefault();e.target.click()});
w.DiarioTecnico={view,enter,leave,load};
})(window,document);
