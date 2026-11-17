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
  },
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(request.method!=='GET')return json({erro:'metodo_nao_permitido'},request,env,405);
    if(path==='/health')return json({ok:Boolean(env.NEWS_CACHE),servico:'diario-noticias',modo:'independente'},request,env,env.NEWS_CACHE?200:503);
    if(path!=='/v1/noticias')return json({erro:'rota_nao_encontrada'},request,env,404);
    if(!env.NEWS_CACHE)return json({erro:'cache_nao_configurado'},request,env,503);
    const salvo=await env.NEWS_CACHE.get(KEY);
    if(!salvo)return json({erro:'ainda_sem_coleta',itens:[]},request,env,503);
    const data=JSON.parse(salvo);
    return json({...data,desatualizado:Date.now()-Date.parse(data.atualizadoEm)>15*60000},request,env);
  }
};