/* v824 — ADRs brasileiras na Cloudflare (gerado de supabase/functions/adrs/index.ts, só a parte de dados). */
// ===== tradingview =====
// supabase/functions/adrs/tv.ts — regras puras (sem rede): horário de Nova York, leitura do TradingView e do Yahoo.

                                                       
                                        
                                                                                                                          
                                                                                                                                                                                                                                        
export const BOLSAS = ['NYSE', 'NASDAQ', 'AMEX', 'OTC'];
export const COLUNAS = ['close', 'change', 'change_abs', 'description', 'premarket_close', 'premarket_change', 'postmarket_close', 'postmarket_change', 'update_mode', 'update_time', 'premarket_time', 'postmarket_time', 'current_session'];
export const limpa = (s         ) => String(s || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12);
const num = (x         ) => typeof x === 'number' && Number.isFinite(x) ? x : null;
const stamp = (x         ) => typeof x === 'number' && x > 0 && x < 1e11 ? new Date(x * 1000).toISOString() : null;
export function nyParts(date      ) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
}
export function faseNY(date      )       {
  const p=nyParts(date),minute=+p.hour*60 + +p.minute;
  if(p.weekday==='Sat'||p.weekday==='Sun'&&minute<1200||p.weekday==='Fri'&&minute>=1200)return 'closed';
  if(minute<240||minute>=1200)return 'overnight';
  if(minute<570)return 'pre';if(minute<960)return 'reg';return 'post';
}
export function overnightKey(date      )                {
  if(faseNY(date)!=='overnight')return null;
  const p=nyParts(date),day=+p.day-(+p.hour<4?1:0);
  return new Date(Date.UTC(+p.year,+p.month-1,day)).toISOString().slice(0,10);
}
export function estadoNY(date      )         {const phase=faseNY(date);return phase==='overnight'?'closed':phase}
export function leTV(j     , simbolos          , estado        )                                    {
  const map=new Map              ();
  for(const row of Array.isArray(j?.data)?j.data:[]){
    const [exchange,ticker]=String(row?.s||'').toUpperCase().split(':');
    if(!BOLSAS.includes(exchange)||!Array.isArray(row.d)||!simbolos.includes(ticker))continue;
    const current=map.get(ticker);if(!current||BOLSAS.indexOf(exchange)<BOLSAS.indexOf(current[0]))map.set(ticker,[exchange,row.d]);
  }
  const itens       =[],faltam         =[];
  for(const s of simbolos){
    const d=map.get(s)?.[1],close=d?num(d[0]):null;
    if(close==null||close<=0){faltam.push(s);continue}
    const chp=num(d[1]),abs=num(d[2]),base=abs!=null?close-abs:null;
    const mode=String(d[8]||'unknown'),regular   ={px:close,chp,at:stamp(d[9]),fonte:'TradingView',delay:mode};
    const extra=(price        ,change        ,at        )        =>{const px=num(price);return px!=null&&px>0?{px,chp:num(change),at:stamp(at),fonte:'TradingView',delay:mode}:null};
    const pre=extra(d[4],d[5],d[10]),pos=extra(d[6],d[7],d[11]);
    const current=d[12]==='out_of_session'?'closed':estado;
    const row     ={s,n:typeof d[3]==='string'?d[3]:s,px:close,chp,base,state:current,phase:current,regular,pre,pos,overnight:null,atraso:mode.startsWith('delayed'),fonte:'tv'};
    // Contrato antigo preservado enquanto o cliente ainda não recebeu o novo pacote.
    if(current==='pre'&&pre){row.base=close;row.px=pre.px;row.chp=pre.chp;row.pos=null}
    if(current==='reg')row.pos=null;
    itens.push(row);
  }
  return {itens,faltam};
}
export function leYahoo(s       ,j    ,estado       )          {
  const m=j?.chart?.result?.[0]?.meta,px=num(m?.regularMarketPrice),base=num(m?.chartPreviousClose)??num(m?.previousClose);
  if(px==null||px<=0)return null;
  const chp=base!=null&&base>0?(px/base-1)*100:null,regular   ={px,chp,at:stamp(m?.regularMarketTime),fonte:'Yahoo Finance',delay:'unknown'};
  return {s,n:String(m?.longName||m?.shortName||s),px,chp,base,state:'closed',phase:'closed',regular,pre:null,pos:null,overnight:null,atraso:true,fonte:'yahoo'};
}
export function juntaOvernight(itens       ,quotes                   ,now     )       {
  const key=overnightKey(now);if(!key)return 0;
  let count=0;
  for(const row of itens){
    const q=quotes['BOATS:'+row.s],price=num(q?.lp),at=stamp(q?.lp_time);
    if(price==null||price<=0||!at||q.current_session!=='market'||Date.parse(at)>now.getTime()+60000||overnightKey(new Date(at))!==key)continue;
    const base=row.regular.px;
    row.overnight={px:price,chp:base>0?(price/base-1)*100:null,at,fonte:'TradingView · BOATS',active:true,delay:String(q.update_mode||'unknown')};
    row.phase='overnight';count++;
  }
  return count;
}
export function frames(text       )         {
  const out         =[];let position=0;
  while(position<text.length){const start=text.indexOf('~m~',position);if(start<0)break;const end=text.indexOf('~m~',start+3);if(end<0)break;const length=Number(text.slice(start+3,end));if(!Number.isInteger(length)||length<0||length>500000)break;const body=text.slice(end+3,end+3+length);if(body.length!==length)break;out.push(body);position=end+3+length}
  return out;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
let cache                                                = null;

async function tradingView(simbolos          ) {
  const tickers = simbolos.flatMap((s) => BOLSAS.map((b) => `${b}:${s}`));
  const r = await fetch('https://scanner.tradingview.com/america/scan', {
    method: 'POST', signal: AbortSignal.timeout(12_000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/', 'User-Agent': UA },
    body: JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: COLUNAS }),
  });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  return await r.json();
}
async function yahoo(s        , estado                             )                       {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=1d&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) return null;
  return leYahoo(s, await r.json(), estado);
}

/* v827: overnight (BOATS) pelo WebSocket público do TradingView, aberto pela Cloudflare (fetch com Upgrade),
   conexão curta de até 7 s, sem conta e sem token do usuário. */
export async function overnightQuotes(symbols){
  const resp=await fetch('https://data.tradingview.com/socket.io/websocket',{headers:{Upgrade:'websocket',Origin:'https://www.tradingview.com','User-Agent':UA}});
  const socket=resp.webSocket;if(!socket)throw Error('Overnight feed unavailable');
  socket.accept();
  return new Promise((resolve,reject)=>{
    const wanted=new Set(symbols.map(s=>'BOATS:'+s)),complete=new Set(),quotes={};
    let finished=false;
    const finish=(error)=>{if(finished)return;finished=true;clearTimeout(timer);try{socket.close()}catch{};error?reject(error):resolve(quotes)};
    const timer=setTimeout(()=>finish(Object.keys(quotes).length?undefined:Error('Overnight timeout')),7000);
    const session='qs_'+crypto.randomUUID().replace(/-/g,'').slice(0,16);
    const envelope=(text)=>'~m~'+text.length+'~m~'+text;
    const send=(m,p)=>socket.send(envelope(JSON.stringify({m,p})));
    socket.addEventListener('message',(ev)=>{
      const text=typeof ev.data==='string'?ev.data:'';if(text.length>500000){finish(Error('Overnight response too large'));return}
      try{for(const body of frames(text)){
        if(body.startsWith('~h~')){socket.send(envelope(body));continue}
        let message;try{message=JSON.parse(body)}catch{continue}
        if(message.p?.[0]!==session)continue;
        if(message.m==='qsd'){const row=message.p[1];if(!wanted.has(row?.n))continue;if(row.s==='ok'&&row.v)quotes[row.n]={...quotes[row.n],...row.v};else complete.add(row.n)}
        if(message.m==='quote_completed'&&wanted.has(message.p[1]))complete.add(message.p[1]);
        if(complete.size===wanted.size)finish();
      }}catch{finish(Error('Invalid overnight response'))}
    });
    socket.addEventListener('error',()=>finish(Error('Overnight feed unavailable')));
    socket.addEventListener('close',()=>finish(Object.keys(quotes).length?undefined:Error('Overnight feed closed')));
    try{send('set_auth_token',['unauthorized_user_token']);send('quote_create_session',[session]);send('quote_set_fields',[session,'lp','lp_time','current_session','update_mode']);send('quote_add_symbols',[session,...wanted])}catch{finish(Error('Overnight connection unavailable'))}
  });
}
const jobs=new Map                     ();
async function loadQuotes(symbols         ){
  const ch=symbols.join(',');if(jobs.has(ch))return jobs.get(ch);
  const job=(async()=>{
    const now=new Date(),expected=faseNY(now),estado=estadoNY(now);
    const [tv,night]=await Promise.allSettled([tradingView(symbols),expected==='overnight'?overnightQuotes(symbols):Promise.resolve({})]);
    let itens       =[],faltam=symbols,erroTV='';
    if(tv.status==='fulfilled')({itens,faltam}=leTV(tv.value,symbols,estado));else erroTV='Fonte regular indisponível; consultada a reserva.';
    const fallback=await Promise.all(faltam.map(s=>yahoo(s,estado).catch(()=>null))),erros         =[];
    faltam.forEach((s,i)=>{if(fallback[i])itens.push(fallback[i] );else erros.push(s+': sem cotação')});
    itens.sort((a,b)=>symbols.indexOf(a.s)-symbols.indexOf(b.s));
    const overnightCount=juntaOvernight(itens,night.status==='fulfilled'?night.value:{},new Date());
    const warnings=[erroTV,expected==='overnight'&&!overnightCount?'Overnight não confirmado nesta consulta. Confira a data do último preço disponível.':''].filter(Boolean);
    const v={revision:'v295',consultedAt:new Date().toISOString(),itens,erros,fonte:itens.some(i=>i.fonte==='tv')?'TradingView · Yahoo como reserva':'Yahoo Finance',atraso:itens.some(i=>i.atraso),estado,phase:expected,overnightCount,...(warnings.length?{aviso:warnings.join(' ')}:{})};
    if(itens.length)cache={ch,ts:Date.now(),v};return v;
  })();jobs.set(ch,job);
  try{return await job}finally{jobs.delete(ch)}
}

export {loadQuotes};
