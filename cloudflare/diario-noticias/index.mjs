// Piloto de notícias públicas. Não consulta Supabase, dados financeiros privados nem IA.
const KEY = 'diario:noticias:v1';
const FONTES = [
  { nome: 'InfoMoney', host: 'infomoney.com.br', url: 'https://www.infomoney.com.br/feed/' },
  { nome: 'Money Times', host: 'moneytimes.com.br', url: 'https://www.moneytimes.com.br/mercados/feed/' },
  { nome: 'CNBC', host: 'cnbc.com', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
];
const normal = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const ent = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ' };
function limpa(s) {
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ')
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/gi,(m)=>ent[m.slice(1,-1).toLowerCase()] || m)
    .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{
      const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);
      return c>0 && c<=0x10ffff ? String.fromCodePoint(c) : '';
    }).replace(/\s+/g,' ').trim();
}
function tag(b,n) {
  const x=new RegExp('<'+n+'\\b[^>]*>([\\s\\S]*?)<\\/'+n+'>','i').exec(b);
  return limpa(x?.[1]||'');
}
function linkSeguro(s,host) {
  try {
    const u=new URL(s);
    return u.protocol==='https:' && !u.port && !u.username && !u.password &&
      (u.hostname===host || u.hostname.endsWith('.'+host)) ? u.href.slice(0,900) : '';
  } catch { return ''; }
}
export function tema(t) {
  const n=normal(t);
  if(/\b(petroleo|brent|wti|crude|oil|opep|opec|petrobras|petr4|diesel)\b/.test(n))return 'petroleo';
  if(/\b(minerio|iron ore|iron-ore|vale3|siderurgia|mining|steel)\b/.test(n))return 'minerio';
  if(/\b(copom|selic|fed|fomc|powell|ipca|payroll|tarifa|tariff|congresso|congress|governo|government|eleicao|election|sancao|sanction|guerra|war)\b/.test(n))return 'politica_economica';
  if(/\b(acoes|acao|stock|shares|ibov|ibovespa|nasdaq|bolsa|earnings|balanco|resultado|lucro|dividendos|wall street)\b/.test(n))return 'acoes';
  return '';
}
export function lerRSS(xml,fonte,agora=Date.now()) {
  const out=[];
  const blocos=String(xml||'').slice(0,160000).match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[];
  for(const b of blocos.slice(0,45)){
    const t=tag(b,'title').slice(0,200),l=linkSeguro(tag(b,'link'),fonte.host);
    const d=Date.parse(tag(b,'pubDate')||tag(b,'dc:date')),cat=tema(t);
    if(!cat||t.length<12||!l||!Number.isFinite(d)||d>agora+300000||d<agora-86400000)continue;
    out.push({t,l,fonte:fonte.nome,d:new Date(d).toISOString(),tema:cat});
  }
  return out;
}
export function deveColetar(now=new Date()){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Sao_Paulo',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(now).map(x=>[x.type,x.value]));
  const pregao=!['Sat','Sun'].includes(p.weekday)&&+p.hour>=9&&+p.hour<18;
  return +p.minute%(pregao?2:10)===0;
}
export async function coletarNoticias(fetcher=fetch,agora=Date.now()){
  const resultados=await Promise.allSettled(FONTES.map(async f=>{
    const r=await fetcher(f.url,{headers:{Accept:'application/rss+xml, application/xml, text/xml'},signal:AbortSignal.timeout(5500)});
    if(!r.ok)throw Error('Feed HTTP '+r.status);
    return lerRSS(await r.text(),f,agora);
  }));
  const map=new Map(),fontesOk=[],fontesIndisponiveis=[];
  resultados.forEach((r,i)=>{
    if(r.status!=='fulfilled'){fontesIndisponiveis.push(FONTES[i].nome);return;}
    fontesOk.push(FONTES[i].nome);
    for(const item of r.value){
      const k=normal(item.t).replace(/[^a-z0-9]+/g,' ').trim();
      if(!map.has(k))map.set(k,item);
    }
  });
  return {atualizadoEm:new Date(agora).toISOString(),
    itens:[...map.values()].sort((a,b)=>b.d.localeCompare(a.d)).slice(0,50),
    fontesOk,fontesIndisponiveis};
}

// Radar público compartilhado sem consultar o Supabase e sem dados dos usuários.
const MARKET_KEY='diario:mercado:v1';
const MARKET_SYMBOLS=[
  ['AMEX:EWZ','Futuros e ADR','EWZ (Brasil em NY)'],
  ['NYSE:PBR','ADR','PBR'],['NYSE:VALE','ADR','VALE'],
  ['NYSE:ITUB','ADR','ITUB'],['NYSE:BBD','ADR','BBD'],
  ['NYSE:ABEV','ADR','ABEV'],['NYSE:GGB','ADR','GGB'],
  ['CME_MINI:ES1!','Futuros e ADR','S&P futuro'],
  ['CME_MINI:NQ1!','Futuros e ADR','Nasdaq futuro'],
  ['FX_IDC:USDBRL','Moedas','USD/BRL'],
  ['TVC:DXY','Moedas','DXY'],['TVC:US10Y','Juros dos EUA','Treasury 10 anos'],
  ['ICEEUR:BRN1!','Commodities','Petróleo Brent'],
  ['NYMEX:CL1!','Commodities','Petróleo WTI'],
  ['SGX:FEF1!','Commodities','Minério de ferro'],
  ['TVC:GOLD','Commodities','Ouro'],
  ['SP:SPX','Bolsas','S&P 500'],['NASDAQ:IXIC','Bolsas','Nasdaq']
];
export function coletarMercadoAgora(date=new Date()){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',
    weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
  return !['Sat','Sun'].includes(p.weekday)&&+p.hour>=7&&+p.hour<21&&+p.minute%10===0;
}
export async function coletarMercado(fetcher=fetch,agora=Date.now()){
  const r=await fetcher('https://scanner.tradingview.com/global/scan',{
    method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({symbols:{tickers:MARKET_SYMBOLS.map(x=>x[0])},columns:['close','change']}),
    signal:AbortSignal.timeout(7000)
  });
  if(!r.ok)throw Error('Mercado HTTP '+r.status);
  const resposta=await r.json();
  const nomes=new Map(MARKET_SYMBOLS.map(x=>[x[0],x])),seen=new Set(),grupos=new Map(),adrs=[];
  for(const item of (Array.isArray(resposta?.data)?resposta.data:[])){
    const x=nomes.get(item?.s);
    if(!x||seen.has(item.s))continue;
    const px=Number(item?.d?.[0]),chp=Number(item?.d?.[1]);
    if(!Number.isFinite(px)||px<=0||!Number.isFinite(chp)||Math.abs(chp)>60)continue;
    seen.add(item.s);
    if(x[1]==='ADR')adrs.push({s:x[2],px,chp,state:'reg'});
    else { if(!grupos.has(x[1]))grupos.set(x[1],[]);
      grupos.get(x[1]).push({n:x[2],px,d1:chp}); }
  }
  if(seen.size<4)throw Error('Mercado sem dados suficientes');
  return {atualizadoEm:new Date(agora).toISOString(),fonte:'TradingView (atrasado)',total:seen.size,
    mercados:{grupos:[...grupos.entries()].map(([g,itens])=>({g,itens}))},adrs};
}
function cabecalhos(req,env){
  const o=req.headers.get('origin');
  return {'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'public, max-age=60, stale-while-revalidate=60',
    'Vary':'Origin',
    ...(o&&o===env.ALLOWED_ORIGIN?{'Access-Control-Allow-Origin':o}:{})};
}
function json(v,req,env,status=200){
  return new Response(JSON.stringify(v),{status,headers:cabecalhos(req,env)});
}
export default {
  async scheduled(event,env,ctx){
    if(!env.NEWS_CACHE||!deveColetar(new Date(event.scheduledTime)))return;
    ctx.waitUntil((async()=>{
      const data=await coletarNoticias(fetch,event.scheduledTime);
      // Falha de todas as fontes não substitui o último snapshot.
      if(data.fontesOk.length)await env.NEWS_CACHE.put(KEY,JSON.stringify(data));
    })());
    if(coletarMercadoAgora(new Date(event.scheduledTime)))
      ctx.waitUntil((async()=>{try{
        const m=await coletarMercado(fetch,event.scheduledTime);
        await env.NEWS_CACHE.put(MARKET_KEY,JSON.stringify(m));
      }catch(_){/* conserva último snapshot, sem preço inventado */}})());
  },
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(request.method!=='GET')return json({erro:'metodo_nao_permitido'},request,env,405);
    if(path==='/health')return json({ok:Boolean(env.NEWS_CACHE),servico:'diario-noticias',modo:'independente'},request,env,env.NEWS_CACHE?200:503);
    if(!['/v1/noticias','/v1/mercado','/v1/panorama'].includes(path))
      return json({erro:'rota_nao_encontrada'},request,env,404);
    if(!env.NEWS_CACHE)return json({erro:'cache_nao_configurado'},request,env,503);
    if(path==='/v1/mercado'||path==='/v1/panorama'){
      const salvoMercado=await env.NEWS_CACHE.get(MARKET_KEY);
      if(!salvoMercado)return json({erro:'aguardando_cotacoes'},request,env,503);
      const m=JSON.parse(salvoMercado),idade=Date.now()-Date.parse(m.atualizadoEm);
      if(!Number.isFinite(idade)||idade < -300000||idade > 30*60000)
        return json({erro:'cotacoes_desatualizadas',atualizadoEm:m.atualizadoEm},request,env,503);
      return json(path==='/v1/panorama'?
        {geradoEm:m.atualizadoEm,fonte:m.fonte,mdo:{mercados:m.mercados},
         ad:{ts:Date.parse(m.atualizadoEm),itens:m.adrs,fonte:m.fonte},ag:{eventos:[]}}:m,
        request,env);
    }
    const salvo=await env.NEWS_CACHE.get(KEY);
    if(!salvo)return json({erro:'ainda_sem_coleta',itens:[]},request,env,503);
    const data=JSON.parse(salvo);
    return json({...data,desatualizado:Date.now()-Date.parse(data.atualizadoEm)>15*60000},request,env);
  }
};