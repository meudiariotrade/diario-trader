import WebSocket from 'npm:ws@8.22.1';
// Função ADRS — arquivo único para colar no editor do Supabase (Edge Functions → adrs → index.ts)

// ===== tradingview =====
// supabase/functions/adrs/tv.ts — regras puras (sem rede): horário de Nova York, leitura do TradingView e do Yahoo.

export type Estado = 'pre' | 'reg' | 'post' | 'closed';
export type Fase = Estado | 'overnight';
export type Px = { px: number; chp: number | null; at?: string | null; fonte?: string; active?: boolean; delay?: string };
export type Item = { s: string; n: string; px: number; chp: number | null; base: number | null; state: Estado; phase: Fase; regular: Px; pre: Px | null; pos: Px | null; overnight: Px | null; atraso: boolean; fonte: 'tv' | 'yahoo' };
export const BOLSAS = ['NYSE', 'NASDAQ', 'AMEX', 'OTC'];
export const COLUNAS = ['close', 'change', 'change_abs', 'description', 'premarket_close', 'premarket_change', 'postmarket_close', 'postmarket_change', 'update_mode', 'update_time', 'premarket_time', 'postmarket_time', 'current_session'];
export const limpa = (s: unknown) => String(s || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12);
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x) ? x : null;
const stamp = (x: unknown) => typeof x === 'number' && x > 0 && x < 1e11 ? new Date(x * 1000).toISOString() : null;
export function nyParts(date: Date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
}
export function faseNY(date: Date): Fase {
  const p=nyParts(date),minute=+p.hour*60 + +p.minute;
  if(p.weekday==='Sat'||p.weekday==='Sun'&&minute<1200||p.weekday==='Fri'&&minute>=1200)return 'closed';
  if(minute<240||minute>=1200)return 'overnight';
  if(minute<570)return 'pre';if(minute<960)return 'reg';return 'post';
}
export function overnightKey(date: Date): string | null {
  if(faseNY(date)!=='overnight')return null;
  const p=nyParts(date),day=+p.day-(+p.hour<4?1:0);
  return new Date(Date.UTC(+p.year,+p.month-1,day)).toISOString().slice(0,10);
}
export function estadoNY(date: Date): Estado {const phase=faseNY(date);return phase==='overnight'?'closed':phase}
export function leTV(j: any, simbolos: string[], estado: Estado): {itens: Item[]; faltam: string[]} {
  const map=new Map<string,any[]>();
  for(const row of Array.isArray(j?.data)?j.data:[]){
    const [exchange,ticker]=String(row?.s||'').toUpperCase().split(':');
    if(!BOLSAS.includes(exchange)||!Array.isArray(row.d)||!simbolos.includes(ticker))continue;
    const current=map.get(ticker);if(!current||BOLSAS.indexOf(exchange)<BOLSAS.indexOf(current[0]))map.set(ticker,[exchange,row.d]);
  }
  const itens:Item[]=[],faltam:string[]=[];
  for(const s of simbolos){
    const d=map.get(s)?.[1],close=d?num(d[0]):null;
    if(close==null||close<=0){faltam.push(s);continue}
    const chp=num(d[1]),abs=num(d[2]),base=abs!=null?close-abs:null;
    const mode=String(d[8]||'unknown'),regular:Px={px:close,chp,at:stamp(d[9]),fonte:'TradingView',delay:mode};
    const extra=(price:unknown,change:unknown,at:unknown):Px|null=>{const px=num(price);return px!=null&&px>0?{px,chp:num(change),at:stamp(at),fonte:'TradingView',delay:mode}:null};
    const pre=extra(d[4],d[5],d[10]),pos=extra(d[6],d[7],d[11]);
    const current=d[12]==='out_of_session'?'closed':estado;
    const row:Item={s,n:typeof d[3]==='string'?d[3]:s,px:close,chp,base,state:current,phase:current,regular,pre,pos,overnight:null,atraso:mode.startsWith('delayed'),fonte:'tv'};
    // Contrato antigo preservado enquanto o cliente ainda não recebeu o novo pacote.
    if(current==='pre'&&pre){row.base=close;row.px=pre.px;row.chp=pre.chp;row.pos=null}
    if(current==='reg')row.pos=null;
    itens.push(row);
  }
  return {itens,faltam};
}
export function leYahoo(s:string,j:any,estado:Estado):Item|null{
  const m=j?.chart?.result?.[0]?.meta,px=num(m?.regularMarketPrice),base=num(m?.chartPreviousClose)??num(m?.previousClose);
  if(px==null||px<=0)return null;
  const chp=base!=null&&base>0?(px/base-1)*100:null,regular:Px={px,chp,at:stamp(m?.regularMarketTime),fonte:'Yahoo Finance',delay:'unknown'};
  return {s,n:String(m?.longName||m?.shortName||s),px,chp,base,state:'closed',phase:'closed',regular,pre:null,pos:null,overnight:null,atraso:true,fonte:'yahoo'};
}
export function juntaOvernight(itens:Item[],quotes:Record<string,any>,now:Date):number{
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
export function frames(text:string):string[]{
  const out:string[]=[];let position=0;
  while(position<text.length){const start=text.indexOf('~m~',position);if(start<0)break;const end=text.indexOf('~m~',start+3);if(end<0)break;const length=Number(text.slice(start+3,end));if(!Number.isInteger(length)||length<0||length>500000)break;const body=text.slice(end+3,end+3+length);if(body.length!==length)break;out.push(body);position=end+3+length}
  return out;
}

// ===== segurança =====
// seguranca.ts — login obrigatório, limite de uso por pessoa e comparação de segredo em tempo constante.
// Copiado em cada função (cada função do Supabase é publicada sozinha). Testes em seguranca.test.ts.
const ENV = (k: string) => ((globalThis as any).Deno?.env?.get(k) as string | undefined) || '';
const CACHE = new Map<string, { uid: string; ate: number }>();

/** Id do usuário logado a partir do token do app (a chave anônima sozinha não passa). Guarda o resultado por 5 min. */
export async function usuarioDe(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim(), url = ENV('SUPABASE_URL'), anon = ENV('SUPABASE_ANON_KEY');
  if (!tk || !url || tk.split('.').length !== 3 || tk === anon || tk.length > 4096) return null;
  const c = CACHE.get(tk);
  if (c && c.ate > Date.now()) return c.uid;
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: anon || ENV('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || typeof j.id !== 'string') return null;
    if (CACHE.size > 500) CACHE.clear();
    CACHE.set(tk, { uid: j.id, ate: Date.now() + 5 * 60_000 });
    return j.id;
  } catch { return null; }
}

const USO = new Map<string, number[]>();
/** Janela deslizante: no máximo `max` chamadas em `janelaMs` por chave (usuário). */
export function dentroDoLimite(chave: string, max: number, janelaMs = 60_000, agora = Date.now()): boolean {
  const L = (USO.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (L.length >= max) { USO.set(chave, L); return false; }
  L.push(agora); USO.set(chave, L);
  if (USO.size > 2000) USO.clear();
  return true;
}

/** Compara segredos sem vazar pelo tempo de resposta. Segredo vazio nunca confere. */
export function segredoIgual(recebido: string | null, esperado: string): boolean {
  if (!esperado || typeof recebido !== 'string') return false;
  const a = new TextEncoder().encode(recebido), b = new TextEncoder().encode(esperado);
  let d = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) d |= (a[i % (a.length || 1)] ?? 0) ^ b[i];
  return d === 0 && a.length === b.length;
}

/** Só aceita endereços dos serviços de push oficiais (Apple, Google, Mozilla, Microsoft): a função não vira um "carteiro" para qualquer site. */
export function pushOk(u: unknown): boolean {
  if (typeof u !== 'string' || u.length > 800) return false;
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && !x.port && /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/.test(x.hostname);
  } catch { return false; }
}

/** Versão das funções: o app compara com a dele na tela "Status do sistema". */
export const VERSAO_FN = 'v295';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/adrs/index.ts
// Cotações das ADRs brasileiras para o Início: TradingView (scanner público, com pré e pós-mercado).
// Se o TradingView não responder, usa o Yahoo Finance como reserva (só preço e variação do dia).
// Deploy (sem verificação de JWT, igual às outras funções):
//   npx supabase functions deploy adrs --project-ref SEU-ID --no-verify-jwt

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
let cache: { ch: string; ts: number; v: unknown } | null = null;

async function tradingView(simbolos: string[]) {
  const tickers = simbolos.flatMap((s) => BOLSAS.map((b) => `${b}:${s}`));
  const r = await fetch('https://scanner.tradingview.com/america/scan', {
    method: 'POST', signal: AbortSignal.timeout(12_000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/', 'User-Agent': UA },
    body: JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: COLUNAS }),
  });
  if (!r.ok) throw new Error('TradingView ' + r.status);
  return await r.json();
}
async function yahoo(s: string, estado: ReturnType<typeof estadoNY>): Promise<Item | null> {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=1d&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) return null;
  return leYahoo(s, await r.json(), estado);
}

/** Snapshot público BOATS: conexão curta, sem conta TradingView e sem token do usuário. */
export function overnightQuotes(symbols:string[]):Promise<Record<string,any>>{
  return new Promise((resolve,reject)=>{
    const wanted=new Set(symbols.map(s=>'BOATS:'+s)),complete=new Set<string>(),quotes:Record<string,any>={};
    let socket:any,finished=false;
    const finish=(error?:Error)=>{if(finished)return;finished=true;clearTimeout(timer);try{socket?.close()}catch{};error?reject(error):resolve(quotes)};
    const timer=setTimeout(()=>finish(Object.keys(quotes).length?undefined:Error('Overnight timeout')),7000);
    const session='qs_'+crypto.randomUUID().replace(/-/g,'').slice(0,16);
    const envelope=(text:string)=>'~m~'+text.length+'~m~'+text;
    const send=(m:string,p:any[])=>socket.send(envelope(JSON.stringify({m,p})));
    try{
      socket=new WebSocket('wss://data.tradingview.com/socket.io/websocket',{origin:'https://www.tradingview.com',handshakeTimeout:6000,perMessageDeflate:false});
      socket.on('open',()=>{try{send('set_auth_token',['unauthorized_user_token']);send('quote_create_session',[session]);send('quote_set_fields',[session,'lp','lp_time','current_session','update_mode']);send('quote_add_symbols',[session,...wanted])}catch{finish(Error('Overnight connection failed'))}});
      socket.on('message',(raw:any)=>{
        const text=raw.toString();if(text.length>500000){finish(Error('Overnight response too large'));return}
        try{for(const body of frames(text)){
          if(body.startsWith('~h~')){socket.send(envelope(body));continue}
          let message;try{message=JSON.parse(body)}catch{continue}
          if(message.p?.[0]!==session)continue;
          if(message.m==='qsd'){const row=message.p[1];if(!wanted.has(row?.n))continue;if(row.s==='ok'&&row.v)quotes[row.n]={...quotes[row.n],...row.v};else complete.add(row.n)}
          if(message.m==='quote_completed'&&wanted.has(message.p[1]))complete.add(message.p[1]);
          if(complete.size===wanted.size)finish();
        }}catch{finish(Error('Invalid overnight response'))}
      });
      socket.on('error',()=>finish(Error('Overnight feed unavailable')));
      socket.on('close',()=>finish(Object.keys(quotes).length?undefined:Error('Overnight feed closed')));
    }catch{finish(Error('Overnight connection unavailable'))}
  });
}
const jobs=new Map<string,Promise<any>>();
async function loadQuotes(symbols:string[]){
  const ch=symbols.join(',');if(jobs.has(ch))return jobs.get(ch);
  const job=(async()=>{
    const now=new Date(),expected=faseNY(now),estado=estadoNY(now);
    const [tv,night]=await Promise.allSettled([tradingView(symbols),expected==='overnight'?overnightQuotes(symbols):Promise.resolve({})]);
    let itens:Item[]=[],faltam=symbols,erroTV='';
    if(tv.status==='fulfilled')({itens,faltam}=leTV(tv.value,symbols,estado));else erroTV='Fonte regular indisponível; consultada a reserva.';
    const fallback=await Promise.all(faltam.map(s=>yahoo(s,estado).catch(()=>null))),erros:string[]=[];
    faltam.forEach((s,i)=>{if(fallback[i])itens.push(fallback[i]!);else erros.push(s+': sem cotação')});
    itens.sort((a,b)=>symbols.indexOf(a.s)-symbols.indexOf(b.s));
    const overnightCount=juntaOvernight(itens,night.status==='fulfilled'?night.value:{},new Date());
    const warnings=[erroTV,expected==='overnight'&&!overnightCount?'Overnight não confirmado nesta consulta. Confira a data do último preço disponível.':''].filter(Boolean);
    const v={revision:'v295',consultedAt:new Date().toISOString(),itens,erros,fonte:itens.some(i=>i.fonte==='tv')?'TradingView · Yahoo como reserva':'Yahoo Finance',atraso:itens.some(i=>i.atraso),estado,phase:expected,overnightCount,...(warnings.length?{aviso:warnings.join(' ')}:{})};
    if(itens.length)cache={ch,ts:Date.now(),v};return v;
  })();jobs.set(ch,job);
  try{return await job}finally{jobs.delete(ch)}
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (value: unknown, status = 200) => new Response(JSON.stringify(value), {status, headers:{...cors,'Content-Type':'application/json','Cache-Control':'private, no-store'}});
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  {const version=versaoResp(req,'adrs',cors);if(version)return version}
  if(req.method!=='POST')return out({error:'Use POST.'},405);
  const uid = segredoIgual(req.headers.get('x-cron-secret'), ENV('CRON_SECRET')) ? 'interno-cron' : await usuarioDe(req);
  if(!uid)return out({error:'Entre na sua conta no app (Mais → Conta).'},401);
  if(!dentroDoLimite(uid,60))return out({error:'Muitas consultas seguidas. Espere um minuto.'},429);
  let body:any={};try{body=await req.json()}catch{}
  const symbols=[...new Set((Array.isArray(body.symbols)?body.symbols:[]).map(limpa).filter(Boolean))].slice(0,40) as string[];
  if(!symbols.length)return out({itens:[],erros:[]});
  const key=symbols.join(',');
  if(cache&&cache.ch===key&&Date.now()-cache.ts<20000)return out(cache.v);
  return out(await loadQuotes(symbols));
});
