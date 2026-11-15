// Monitor de notícias urgentes — isolado da UI e dos demais alertas.
export type News={titulo:string;url:string;fonte:string;em:number};
type Sub={id:string;user_id:string;sub:any;prefs?:any};
const RSS:[string,string][]=[
 ['InfoMoney','https://www.infomoney.com.br/feed/'],
 ['Money Times','https://www.moneytimes.com.br/mercados/feed/'],
 ['Investing Brasil','https://br.investing.com/rss/news.rss'],
 ['Bloomberg Línea','https://www.bloomberglinea.com.br/arc/outboundfeeds/rss.xml'],
 ['CNBC','https://www.cnbc.com/id/100003114/device/rss/rss.html'],
 // Reuters: não há RSS oficial público estável; Google Notícias restringe ao domínio Reuters.
 ['Reuters','https://news.google.com/rss/search?q=when%3A1d%20site%3Areuters.com&hl=en-US&gl=US&ceid=US:en']
];
const X=['FirstSquawk','DeItaone'];
const IMPACTO=/\b(?:copom|selic|fed|powell|fomc|payroll|nonfarm|cpi|ipca|tarifas?|tariffs?|petroleo|petr[oó]leo|oil|crude|opep|opec|guerra|war|petrobras|petr4|petr3|vale|vale3|bitcoin|btc)\b/i;
const PESSOAL=/\b(?:moneyist|dear penny|husband|wife|wedding|horoscope|boyfriend|girlfriend|divorce|marriage|zodiac|astrology|mpox|monkeypox|measles|celebrity|fashion|relationship|retire at|should i marry|should i divorce|should i retire|personal advice|my spouse|my wife|my husband)\b/i;
const OUTLET=/(?:\s*[-–|]\s*|\s*[\(\[])(?:Reuters|CNBC|Money Times|InfoMoney|Investing(?:\.com)?(?: Brasil)?|Bloomberg(?: Línea)?|MarketWatch|Yahoo Finance|Google News|FirstSquawk|DeItaone)[\)\]]?\s*$/i;
function dec(t:string):string {
 return String(t||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
 .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,s)=>{const n=s[0].toLowerCase()==='x'?parseInt(s.slice(1),16):+s;return n>0&&n<=0x10ffff?String.fromCodePoint(n):''})
 .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,s)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[s.toLowerCase()]||' ')
 .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
export function limparTitulo(t:string):string {
 let s=dec(t).slice(0,500);for(let i=0;i<2;i++)s=s.replace(OUTLET,'').trim();
 return s.slice(0,220);
}
const norm=(t:string)=>limparTitulo(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/\b(?:breaking|urgente|alerta|exclusive|exclusivo|update|atualizado)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export const urgente=(t:string)=>limparTitulo(t).length>=15&&!PESSOAL.test(norm(t))&&IMPACTO.test(norm(t));
export function ritmo(agora:Date) {
 const p=(zona:string)=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zona,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(agora).map(x=>[x.type,x.value]));
 const br=p('America/Sao_Paulo'),ny=p('America/New_York');
 const util=(x:Record<string,string>)=>x.weekday!=='Sat'&&x.weekday!=='Sun';
 const ativo=(util(br)&&+br.hour>=9&&+br.hour<18)||(util(ny)&&(+ny.hour>9||(+ny.hour===9&&+ny.minute>=30))&&+ny.hour<17);
 const minutos=ativo?5:15;
 return {minutos,executar:+br.minute%minutos===0,ativo};
}
function xmlTag(bloco:string,tag:string) {
 const r=new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i');
 return dec(bloco.match(r)?.[1]||'');
}
export function parseRss(xml:string,fonte:string):News[] {
 return [...String(xml).matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0,75).flatMap(m=>{
  const b=m[1],titulo=limparTitulo(xmlTag(b,'title'));
  const url=dec(xmlTag(b,'link')||b.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i)?.[1]||xmlTag(b,'guid'));
  const em=Date.parse(xmlTag(b,'pubDate')||xmlTag(b,'published')||xmlTag(b,'updated')||xmlTag(b,'dc:date'));
  return titulo&&/^https:\/\//i.test(url)&&Number.isFinite(em)?[{titulo,url,fonte,em}]:[];
 });
}
async function texto(url:string){
 const r=await fetch(url,{signal:AbortSignal.timeout(6500),headers:{Accept:'application/rss+xml, application/xml, text/xml, */*'}});
 if(!r.ok)throw Error('RSS HTTP '+r.status);
 const t=await r.text();if(t.length>2_000_000)throw Error('RSS grande demais');return t;
}
async function rss(fonte:string,url:string){return parseRss(await texto(url),fonte)}
async function xrss(perfil:string){
 for(const url of ['https://rsshub.app/twitter/user/'+perfil,'https://nitter.net/'+perfil+'/rss','https://nitter.poast.org/'+perfil+'/rss']){
  try{const r=await rss('X @'+perfil,url);if(r.length)return r}catch{/* fallback */}
 }
 return [] as News[];
}
async function finnhub(cat:string,key:string):Promise<News[]>{
 const r=await fetch('https://finnhub.io/api/v1/news?category='+cat+'&token='+encodeURIComponent(key),{signal:AbortSignal.timeout(6500)});
 if(!r.ok)throw Error('Finnhub '+cat+' HTTP '+r.status); // nunca registrar URL nem token
 const j=await r.json();
 return (Array.isArray(j)?j:[]).slice(0,80).flatMap((n:any)=>{
  const titulo=limparTitulo(n.headline),url=String(n.url||''),em=Number(n.datetime)*1000;
  return titulo&&/^https:\/\//.test(url)&&Number.isFinite(em)?[{titulo,url,em,fonte:'Finnhub '+cat}]:[];
 });
}
async function sha(t:string,ms:number){
 const dia=new Date(ms).toISOString().slice(0,10);
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(dia+'|'+norm(t)));
 return Array.from(new Uint8Array(dig)).map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function monitorarNoticias(op:{db:any;enviar:(s:Sub,p:any,chave:string)=>Promise<boolean>;agora?:Date;simular?:boolean}){
 const {db,enviar,agora=new Date(),simular=false}=op,rit=ritmo(agora);
 if(!rit.executar&&!simular)return {executado:false,intervalo:rit.minutos};
 const q=await db.from('push_subs').select('id,user_id,sub,prefs').limit(150);
 if(q.error)throw Error('Aparelhos indisponíveis: '+q.error.message);
 const subs=((q.data||[]) as Sub[]).filter(s=>s.user_id&&s.prefs?.on?.kw!==false);
 if(!subs.length&&!simular)return {executado:true,intervalo:rit.minutos,inscritos:0,enviados:0};
 let key=Deno.env.get('FINNHUB_API_KEY')||'';
 if(!key)try{const r=await db.rpc('finnhub_chave');if(!r.error&&typeof r.data==='string')key=r.data}catch{/* RSS continua */}
 const jobs:Promise<News[]>[]=[
  ...RSS.map(([nome,url])=>rss(nome,url)),
  ...X.map(x=>xrss(x)),
  ...(key?['general','forex','crypto'].map(c=>finnhub(c,key)):[])
 ];
 const r=await Promise.allSettled(jobs);
 const erros=r.filter(x=>x.status==='rejected').length;
 const coletadas=r.flatMap(x=>x.status==='fulfilled'?x.value:[]);
 const unicas=new Map<string,News>(),limite=agora.getTime()-(rit.ativo?35:50)*60000;
 for(const n of coletadas){
  if(n.em<limite||n.em>agora.getTime()+300000||!urgente(n.titulo))continue;
  const id=new Date(n.em).toISOString().slice(0,10)+'|'+norm(n.titulo);
  if(!unicas.has(id))unicas.set(id,n);
 }
 const noticias=[...unicas.values()].sort((a,b)=>b.em-a.em).slice(0,30);
 if(simular)return {executado:true,intervalo:rit.minutos,origens:jobs.length,erros,coletadas:coletadas.length,candidatas:noticias.length,amostras:noticias.slice(0,4).map(n=>({titulo:n.titulo,fonte:n.fonte}))};
 const contas=new Map<string,Sub[]>();
 for(const s of subs){if(!contas.has(s.user_id))contas.set(s.user_id,[]);contas.get(s.user_id)!.push(s)}
 let novas=0,enviados=0,falhas=0;
 for(const n of noticias){
  const hash=await sha(n.titulo,n.em);
  for(const [uid,aparelhos] of contas){
   // INSERT...ON CONFLICT DO NOTHING garante reserva atômica e memória persistente por conta.
   const q=await db.from('noticias_urgentes_notificadas')
    .upsert({user_id:uid,noticia_hash:hash,titulo:n.titulo,url:n.url,fonte:n.fonte,publicada_em:new Date(n.em).toISOString()},
       {onConflict:'user_id,noticia_hash',ignoreDuplicates:true}).select('noticia_hash');
   if(q.error){falhas++;continue}
   if(!q.data?.length)continue;
   novas++;
   const payload={title:'🚨 '+n.titulo.slice(0,112),body:(n.fonte+' · '+n.url).slice(0,350),tag:'news-'+hash.slice(0,24),data:{go:'mercado',r:'nt',url:n.url}};
   for(const aparelho of aparelhos)try{if(await enviar(aparelho,payload,aparelho.id+'|news|'+hash))enviados++}catch{falhas++}
  }
 }
 return {executado:true,intervalo:rit.minutos,origens:jobs.length,erros,coletadas:coletadas.length,candidatas:noticias.length,novas,enviados,falhas};
}
