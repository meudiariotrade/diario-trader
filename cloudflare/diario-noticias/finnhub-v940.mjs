/**
 * v940 — Finnhub público na borda: 3 categorias / 1 coleta compartilhada.
 * A chave só pode ser enviada em X-Finnhub-Token, nunca em URL, KV ou resposta.
 */
const CATS=Object.freeze(['general','forex','crypto']);
const urlOk=value=>{
 try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname!=='localhost'?u.href.slice(0,900):''}
 catch{return ''}
};
const trim=(v,n)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,n);
export async function buscarFinnhubV940(fetcher,token,tema,now=Date.now()){
 if(!token||String(token).length<10)return {itens:[],fontesOk:[],fontesIndisponiveis:[]};
 const jobs=CATS.map(async cat=>{
  const target='https://finnhub.io/api/v1/news?category='+cat;
  const r=await fetcher(target,{
   headers:{'X-Finnhub-Token':token,Accept:'application/json'},
   signal:AbortSignal.timeout(6500),redirect:'manual'
  });
  if(!r.ok)throw Error('Finnhub HTTP '+r.status);
  const data=await r.json();
  if(!Array.isArray(data))throw Error('Finnhub formato inválido');
  const itens=[];
  for(const x of data.slice(0,55)){
   const t=trim(x?.headline,200),l=urlOk(x?.url),d=Number(x?.datetime)*1000;
   if(!t||t.length<12||!l||!Number.isFinite(d)||d>now+300000||d<now-86400000)continue;
   if(/\b(moneyist|dear penny|horoscope|hor[oó]scopo|astrology|celebrity|fashion|giveaway|advertorial|sponsored)\b/i.test(t))continue;
   const tm=tema(t);
   if(!tm)continue;
   itens.push({t,l,fonte:'Finnhub '+cat,d:new Date(d).toISOString(),tema:tm});
  }
  return itens;
 });
 const results=await Promise.allSettled(jobs);
 const out={itens:[],fontesOk:[],fontesIndisponiveis:[]};
 results.forEach((v,i)=>{
  const name='Finnhub '+CATS[i];
  if(v.status==='fulfilled'){out.fontesOk.push(name);out.itens.push(...v.value);}
  else out.fontesIndisponiveis.push(name);
 });
 return out;
}
export const FINNHUB_CATEGORIAS_V940=CATS;

/** Concilia fontes sem sobrescrever notícias válidas se a API adicional falhar. */
export function mesclarFinnhubV940(snapshot,extra){
 if(!extra?.fontesOk?.length)return snapshot;
 const exists=new Set(),itens=[];
 const source=[...(Array.isArray(snapshot?.itens)?snapshot.itens:[]),...(extra.itens||[])];
 for(const x of source){
  const k=String(x?.t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  if(!k||exists.has(k))continue;
  exists.add(k);itens.push(x);
 }
 itens.sort((a,b)=>String(b.d||'').localeCompare(String(a.d||'')));
 return {...snapshot,itens:itens.slice(0,70),
  fontesOk:[...new Set([...(snapshot.fontesOk||[]),...extra.fontesOk])],
  fontesIndisponiveis:[...new Set([...(snapshot.fontesIndisponiveis||[]),...(extra.fontesIndisponiveis||[])])]};
}
