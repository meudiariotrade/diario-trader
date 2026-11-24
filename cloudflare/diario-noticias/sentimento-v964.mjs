import {coletarSentimento,sentimentoAgora} from './dados-publicos.mjs';
export const CRON_SENTIMENTO='3,33 * * * *';
export const SENT_KEY_V964='diario:sentimento:v1';
const mercados=['b3','eua','cripto'];
const valido=x=>x&&typeof x.valor==='number'&&Number.isFinite(x.valor)&&x.valor>=0&&x.valor<=100;
export function mesclarSentimento(novo,anterior={}){
 const out={...novo};
 for(const k of mercados){
  const n=novo[k],a=anterior?.[k];
  if(valido(n)&&(!valido(a)||!a.data||!n.data||n.data>=a.data))out[k]={...n,atualizadoEm:novo.gerado,desatualizado:false};
  else if(valido(a))out[k]={...a,atualizadoEm:a.atualizadoEm||anterior.gerado,desatualizado:true};
  else out[k]=null;
 }
 return out;
}
export async function atualizarSentimento(env,agora,fetcher=fetch){
 if(!env.NEWS_CACHE)return null;
 let anterior={};try{anterior=JSON.parse(await env.NEWS_CACHE.get(SENT_KEY_V964)||'{}');}catch{}
 const novo=await coletarSentimento(fetcher,agora);
 const out=mesclarSentimento(novo,anterior);
 await env.NEWS_CACHE.put(SENT_KEY_V964,JSON.stringify(out));
 return out;
}
export function cronSentimento(event,env,ctx){
 if(event.cron!==CRON_SENTIMENTO)return false;
 if(env.NEWS_CACHE&&sentimentoAgora(new Date(event.scheduledTime-3*60000)))ctx.waitUntil(atualizarSentimento(env,event.scheduledTime).catch(()=>null));
 return true;
}
