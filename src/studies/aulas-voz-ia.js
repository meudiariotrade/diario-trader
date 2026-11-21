/* v863 — Voz por IA nas aulas tradicionais (mesma voz Gemini do Mentor, servida pela Cloudflare).
 * Uma requisição por cena; legenda e visuais acompanham a fala pela proporção de caracteres.
 * Áudio guardado no aparelho (Cache Storage) para tocar de novo sem gastar a chave. */
;(function(w){
'use strict';
const URL_VOZ='https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/voz',CACHE='aulas-voz-ia-v863',VOZ='Charon';
let atual=null;const pend=new Map();
function pedacos(t){const out=[];let cur='';for(const f of String(t).split(/(?<=[.!?;:])\s+/)){if((cur+' '+f).length>1800&&cur){out.push(cur);cur=f}else cur=cur?cur+' '+f:f}if(cur)out.push(cur);return out.flatMap(x=>x.length>2400?x.match(/[\s\S]{1,2400}/g):[x])}
async function juntarWav(bs){const arr=await Promise.all(bs.map(b=>b.arrayBuffer().then(x=>new Uint8Array(x))));const d=arr.map(b=>b.slice(44)),n=d.reduce((s,x)=>s+x.length,0),o=new Uint8Array(44+n);o.set(arr[0].slice(0,44));const v=new DataView(o.buffer);v.setUint32(4,36+n,true);v.setUint32(40,n,true);let k=44;for(const x of d){o.set(x,k);k+=x.length}return new Blob([o],{type:'audio/wav'})}
async function um(texto){
 const url=URL_VOZ+'?t='+encodeURIComponent(texto)+'&v='+VOZ;
 let c=null;try{c=await caches.open(CACHE);const hit=await c.match(url);if(hit)return await hit.blob()}catch{}
 const tk=(typeof SESS!=='undefined'&&SESS?.at)||'';
 const r=await fetch(url,{headers:tk?{Authorization:'Bearer '+tk}:{},credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(120000)});
 if(!r.ok||!/^audio\//i.test(r.headers.get('content-type')||''))throw Error('Voz por IA indisponível');
 const b=await r.blob();try{await c?.put(url,new Response(b,{headers:{'Content-Type':b.type}}))}catch{}return b;
}
function obter(texto){
 const t=(w.DiarioVoz?.normalizarTextoParaVoz?.(texto)||texto).replace(/\s+/g,' ').trim();if(!t)return Promise.reject(Error('Cena sem texto'));
 if(pend.has(t))return pend.get(t);
 const job=(async()=>{const ps=pedacos(t),bs=[];for(const p of ps)bs.push(await um(p));return bs.length>1?juntarWav(bs):bs[0]})();
 pend.set(t,job);job.catch(()=>{}).finally(()=>setTimeout(()=>pend.delete(t),60000));return job;
}
function parar(){if(!atual)return;try{atual.a.pause()}catch{}try{URL.revokeObjectURL(atual.u)}catch{}clearInterval(atual.iv);atual.fim?.(false,true);atual=null}
/* Toca as linhas da cena. Resolve true ao terminar, false se a voz falhar; nada se for cancelada (tok inválido). */
function cena(linhas,{tok,onLinha,vel=1,proxima=null}={}){
 parar();
 return new Promise(async res=>{
  let blob;try{blob=await obter(linhas.join(' '))}catch{return tok()?res(false):res(null)}
  if(!tok())return res(null);
  if(proxima?.length)obter(proxima.join(' ')).catch(()=>{});
  const u=URL.createObjectURL(blob),a=new Audio(u);a.playbackRate=Math.max(.5,Math.min(2,vel));
  const tam=linhas.map(l=>Math.max(1,l.length)),tot=tam.reduce((s,x)=>s+x,0),marcos=[];let acc=0;for(const x of tam){marcos.push(acc/tot);acc+=x}
  let linha=-1,feito=false;
  const fim=(ok,cancelado)=>{if(feito)return;feito=true;clearInterval(me.iv);try{URL.revokeObjectURL(u)}catch{}if(atual===me)atual=null;res(cancelado?null:ok)};
  const me={a,u,fim,iv:0};atual=me;
  const passo=()=>{if(!tok()){try{a.pause()}catch{}fim(false,true);return}
   const f=a.duration>0?a.currentTime/a.duration:0;let i=0;while(i+1<marcos.length&&f>=marcos[i+1])i++;if(i!==linha){linha=i;try{onLinha?.(i)}catch{}}};
  a.addEventListener('timeupdate',passo);me.iv=setInterval(passo,250);
  a.addEventListener('ended',()=>{if(tok())fim(true)});
  a.addEventListener('error',()=>fim(false));
  try{onLinha?.(0);linha=0;await a.play()}catch{fim(false)}
 });
}
w.AulaVozIA={cena,parar,obter};
})(window);
