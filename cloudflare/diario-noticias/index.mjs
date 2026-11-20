// Motor de notícias públicas. Não consulta Supabase, dados financeiros privados nem IA.
import '../../src/shared/sessoes-mercado.js';
import {FLOW_KEY,coletarFluxo} from './fluxo.mjs';
import {agruparEventos} from './eventos.mjs';
import {coletarAgenda,coletarSentimento,agendaAgora,sentimentoAgora} from './dados-publicos.mjs';
import {coletarJuros} from './juros.mjs';
import {seriePublica} from './series.mjs';
import {coletarAnalogia,analogiaAgora} from './analogia.mjs';
import {resolveLogos} from './logos.mjs';
import {loadQuotes as adrsCotacoes,limpa as adrLimpa} from './adrs.mjs';
const AGENDA_KEY=s=>'diario:agenda:v1:'+s, SENT_KEY='diario:sentimento:v1', JUROS_KEY='diario:juros:v1';
/* v820: Juros e DI a cada 10 min no horário de mercado (08:30–18:30, dias úteis); de hora em hora fora dele. */
export function jurosAgora(date){const b=globalThis.DiarioSessoes.local(+date,'America/Sao_Paulo');return !b.weekend&&b.minute>=510&&b.minute<1110?b.minute%10===0:b.minute%60===0;}
export {agruparEventos} from './eventos.mjs';
const KEY = 'diario:noticias:v1';
const FONTES = [
  { nome: 'InfoMoney', host: 'infomoney.com.br', url: 'https://www.infomoney.com.br/feed/' },
  { nome: 'Money Times', host: 'moneytimes.com.br', url: 'https://www.moneytimes.com.br/mercados/feed/' },
  { nome: 'CNBC', host: 'cnbc.com', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
  { nome: 'SEC EDGAR', host: 'sec.gov', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&output=atom', formato:'atom' },
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
  if(/\b(bitcoin|ethereum|solana|criptomoeda|crypto|btc|eth)\b/.test(n))return 'cripto';
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
    if(/\b(loterias?|mega.?sena|lotofacil|quina|dupla.sena|timemania|resultado do sorteio|horoscopo|horoscope|signo|moneyist|dear penny|conteudo patrocinado|publieditorial|patrocinado|advertorial|sponsored|bbb|novela|celebridade|fofoca|futebol|brasileirao|campeonato|receita de|cupom de desconto)\b/.test(normal(t)))continue; // v811: mesmo filtro de ruído do app
    if(!cat||t.length<12||!l||!Number.isFinite(d)||d>agora+300000||d<agora-86400000)continue;
    out.push({t,l,fonte:fonte.nome,d:new Date(d).toISOString(),tema:cat});
  }
  return out;
}
/* Feed Atom SEC: somente 8-K público. Validação de domínio e horário. */
export function lerSECAtom(xml,fonte,agora=Date.now()) {
  const out=[];
  for(const b of (String(xml||'').slice(0,160000).match(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi)||[]).slice(0,30)) {
    const t=tag(b,'title').slice(0,200);
    const l=/<link\b[^>]*href=["']([^"']+)["']/i.exec(b)?.[1]||'';
    const seguro=linkSeguro(l,fonte.host),dt=Date.parse(tag(b,'updated')||tag(b,'published'));
    if(!seguro||!Number.isFinite(dt)||dt>agora+300000||dt<agora-86400000||t.length<12)continue;
    out.push({t,l:seguro,fonte:'SEC',d:new Date(dt).toISOString(),tema:tema(t)||'acoes'});
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
export async function coletarNoticias(fetcher=fetch,agora=Date.now(),anteriores=[]){
  const resultados=await Promise.allSettled(FONTES.map(async f=>{
    const r=await fetcher(f.url,{headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml','User-Agent':'DiarioTraderPublicFeed/1.0 (GitHub meudiariotrade)'},signal:AbortSignal.timeout(5500)});
    if(!r.ok)throw Error('Feed HTTP '+r.status);
    const xml=await r.text();return f.formato==='atom'?lerSECAtom(xml,f,agora):lerRSS(xml,f,agora);
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
    eventos:agruparEventos([...map.values()],anteriores,agora),
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
  return !['Sat','Sun'].includes(p.weekday)&&+p.hour>=6&&+p.hour<21&&+p.minute%10===0;
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
    const px=item?.d?.[0],chp=item?.d?.[1];
    if(!Number.isFinite(px)||px<=0||!Number.isFinite(chp)||Math.abs(chp)>60)continue;
    seen.add(item.s);
    if(x[1]==='ADR')adrs.push({s:x[2],px,chp,state:'referencia',priceAt:null,source:'TradingView (atrasado)'});
    else { if(!grupos.has(x[1]))grupos.set(x[1],[]);
      grupos.get(x[1]).push({n:x[2],px,d1:chp,priceAt:null,source:'TradingView (atrasado)'}); }
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
  const body=JSON.stringify(v);let hash=2166136261;for(let i=0;i<body.length;i++)hash=Math.imul(hash^body.charCodeAt(i),16777619);
  const etag='W/"'+(hash>>>0).toString(16)+'"',headers={...cabecalhos(req,env),ETag:etag};
  return req.headers.get('if-none-match')===etag&&status===200?new Response(null,{status:304,headers}):new Response(body,{status,headers});
}
export default {
  async scheduled(event,env,ctx){
    // Coleta diária limitada, inclusive quando B3 estiver fechada; conserva snapshot em falha.
    const b=globalThis.DiarioSessoes.local(event.scheduledTime,'America/Sao_Paulo');
    if(env.NEWS_CACHE&&!b.weekend&&[660,1020].includes(b.minute))ctx.waitUntil((async()=>{try{
      await env.NEWS_CACHE.put(FLOW_KEY,JSON.stringify(await coletarFluxo(fetch,event.scheduledTime)));
    }catch(_){/* último dado permanece identificável pela data efetiva */}})());
    /* v811: agenda e Medo & Ganância saem do Supabase e passam a ser coletados aqui, uma vez para todos. */
    if(env.NEWS_CACHE&&agendaAgora(new Date(event.scheduledTime)))ctx.waitUntil((async()=>{
      for(const s of [0,1])try{await env.NEWS_CACHE.put(AGENDA_KEY(s),JSON.stringify(await coletarAgenda(fetch,event.scheduledTime,s)));}catch(_){/* conserva a última agenda */}
    })());
    if(env.NEWS_CACHE&&sentimentoAgora(new Date(event.scheduledTime)))ctx.waitUntil((async()=>{
      try{await env.NEWS_CACHE.put(SENT_KEY,JSON.stringify(await coletarSentimento(fetch,event.scheduledTime)));}catch(_){/* conserva o último índice */}
    })());
    if(env.NEWS_CACHE&&analogiaAgora(new Date(event.scheduledTime)))ctx.waitUntil((async()=>{
      try{const a=await coletarAnalogia();if(a&&a.hoje)await env.NEWS_CACHE.put('diario:analogia:v1',JSON.stringify(a));}catch(_){/* mantém o último quadro */}
    })());
    if(env.NEWS_CACHE&&jurosAgora(new Date(event.scheduledTime)))ctx.waitUntil((async()=>{
      try{const j=await coletarJuros();if(j&&(j.selic||j.curva))await env.NEWS_CACHE.put(JUROS_KEY,JSON.stringify(j));}catch(_){/* conserva o último quadro */}
    })());
    if(!env.NEWS_CACHE||!deveColetar(new Date(event.scheduledTime)))return;
    ctx.waitUntil((async()=>{
      let anteriores=[];
      try{const antigo=await env.NEWS_CACHE.get(KEY,'json');anteriores=Array.isArray(antigo?.eventos)?antigo.eventos:[];}catch(_){/* historico opcional */}
      const data=await coletarNoticias(fetch,event.scheduledTime,anteriores);
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
    /* v824: ADRs brasileiras (TradingView com Yahoo de reserva), cache de borda de 20 s. */
    if(path==='/v1/adrs'){
      const u=new URL(request.url),lista=[...new Set(String(u.searchParams.get('s')||'').split(',').map(adrLimpa).filter(Boolean))].slice(0,40);
      if(!lista.length)return json({itens:[],erros:[]},request,env);
      const cache=globalThis.caches?.default,chave=new Request(u.origin+'/v1/adrs?s='+lista.join(','));
      if(cache){const hit=await cache.match(chave);if(hit)return json(await hit.json(),request,env);}
      try{const v=await adrsCotacoes(lista);
        if(cache&&v.itens?.length)await cache.put(chave,new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=20'}}));
        return json(v,request,env);
      }catch(e){return json({error:String(e?.message||e)},request,env,502);}
    }
    /* v823: logotipos (até 120 tickers) com cache de borda de 7 dias por lote; dado público. */
    if(path==='/v1/logos'){
      const u=new URL(request.url),lista=[...new Set(String(u.searchParams.get('t')||'').toUpperCase().split(',').map(x=>x.trim()).filter(x=>/^[A-Z0-9.^_=!:-]{1,24}$/.test(x)))].sort().slice(0,120);
      if(!lista.length)return json({erro:'informe t=TICKER1,TICKER2'},request,env,400);
      const cache=globalThis.caches?.default,chave=new Request(u.origin+'/v1/logos?t='+lista.join(','));
      if(cache){const hit=await cache.match(chave);if(hit)return json(await hit.json(),request,env);}
      try{const v={versao:'v823',itens:await resolveLogos(lista)};
        if(cache)await cache.put(chave,new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=604800'}}));
        return json(v,request,env);
      }catch(e){return json({error:String(e?.message||e)},request,env,502);}
    }
    /* v823: séries do Banco Central sob demanda, com cache de borda de 6 h (dado público, sem usuário). */
    if(path==='/v1/series'){
      const u=new URL(request.url),cache=globalThis.caches?.default,chave=new Request(u.origin+'/v1/series?serie='+encodeURIComponent((u.searchParams.get('serie')||'').toLowerCase())+'&desde='+encodeURIComponent(u.searchParams.get('desde')||''));
      if(cache){const hit=await cache.match(chave);if(hit){const v=await hit.json();return json(v,request,env);}}
      try{const r=await seriePublica(u.searchParams.get('serie'),u.searchParams.get('desde'));
        if(r.status===200&&cache)await cache.put(chave,new Response(JSON.stringify(r.body),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=21600'}}));
        return json(r.body,request,env,r.status);
      }catch(e){return json({error:String(e?.message||e)},request,env,502);}
    }
    if(!['/v1/noticias','/v1/mercado','/v1/panorama','/v2/eventos','/v1/fluxo','/v1/sessoes','/v1/agenda','/v1/sentimento','/v1/juros','/v1/analogia'].includes(path))
      return json({erro:'rota_nao_encontrada'},request,env,404);
    if(path==='/v1/sessoes')return json(globalThis.DiarioSessoes.context(),request,env);
    if(!env.NEWS_CACHE)return json({erro:'cache_nao_configurado'},request,env,503);
    if(path==='/v1/agenda'){
      const semana=new URL(request.url).searchParams.get('semana')==='1'?1:0;
      const raw=await env.NEWS_CACHE.get(AGENDA_KEY(semana));if(!raw)return json({erro:'aguardando_agenda'},request,env,503);
      const a=JSON.parse(raw);return json({...a,desatualizado:Date.now()-Date.parse(a.em)>6*3600000},request,env);
    }
    /* v833: última vez parecida entre mercados (KV; na primeira vez calcula e guarda). */
    if(path==='/v1/analogia'){
      let raw=await env.NEWS_CACHE.get('diario:analogia:v1');
      if(!raw){try{const a=await coletarAnalogia();if(a&&a.hoje){raw=JSON.stringify(a);await env.NEWS_CACHE.put('diario:analogia:v1',raw);}}catch(_){}}
      if(!raw)return json({erro:'aguardando_analogia'},request,env,503);
      return json(JSON.parse(raw),request,env);
    }
    if(path==='/v1/juros'){
      const raw=await env.NEWS_CACHE.get(JUROS_KEY);if(!raw)return json({erro:'aguardando_juros'},request,env,503);
      const v=JSON.parse(raw);return json({...v,desatualizado:Date.now()-Date.parse(v.gerado)>3*3600000},request,env);
    }
    if(path==='/v1/sentimento'){
      const raw=await env.NEWS_CACHE.get(SENT_KEY);if(!raw)return json({erro:'aguardando_sentimento'},request,env,503);
      const v=JSON.parse(raw);return json({...v,desatualizado:Date.now()-Date.parse(v.gerado)>12*3600000},request,env);
    }
    if(path==='/v1/fluxo'){
      const raw=await env.NEWS_CACHE.get(FLOW_KEY);if(!raw)return json({erro:'aguardando_fluxo'},request,env,503);
      const f=JSON.parse(raw);return json({...f,desatualizado:Date.now()-Date.parse(f.atualizadoEm)>36*3600000},request,env);
    }
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
    const desatualizado=Date.now()-Date.parse(data.atualizadoEm)>15*60000;
    if(path==='/v2/eventos')return json({atualizadoEm:data.atualizadoEm,desatualizado,
      eventos:Array.isArray(data.eventos)?data.eventos:[],fontesOk:data.fontesOk||[],fontesIndisponiveis:data.fontesIndisponiveis||[]},request,env);
    return json({...data,desatualizado},request,env);
  }
};