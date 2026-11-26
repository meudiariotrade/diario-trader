/* v999: motor integral de Pesquisa na borda, mesmo contrato e persistência privada.
 * Nenhuma chave de servidor ou contexto de conta vai ao navegador ou cache público. */
import {criarPesquisaHandler} from '../../supabase/functions/pesquisa/index.ts';
import {envComVault} from '../../supabase/functions/_shared/ai-router.ts';
const ORIGIN='https://meudiariotrade.github.io';
const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Vary':'Origin','X-Content-Type-Options':'nosniff'};
const out=(x,status=200)=>Response.json(x,{status,headers});
const ready=env=>Boolean(env.SUPABASE_URL&&env.SUPABASE_ANON_KEY&&env.SUPABASE_SERVICE_ROLE_KEY);
export function pesquisaHealth(env){return out({ok:ready(env),servico:'pesquisa-cloudflare',contrato:1},ready(env)?200:503)}
// Same hybrid private-library search as conhecimento-ia; only the database RPC and
// user-owned metadata remain on Supabase. Embedding failure degrades to lexical retrieval.
export async function bibliotecaPesquisa(env,init,fetcher=fetch){
 const h=new Headers(init.headers),jwt=h.get('Authorization')||'';
 if(!/^Bearer [^ ]+$/.test(jwt))return out({erro:'Sessão inválida'},401);
 const b=JSON.parse(String(init.body||'{}')),consulta=String(b.consulta||'').trim().slice(0,480);
 if(consulta.length<3)return out({trechos:[]});
 let vector=null;
 try{
  const ev=await envComVault(k=>env[k],fetcher),key=ev('GEMINI_API_KEY')||ev('GOOGLE_API_KEY');
  if(key){
   const r=await fetcher('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({model:'models/gemini-embedding-001',content:{parts:[{text:consulta}]},taskType:'RETRIEVAL_QUERY',outputDimensionality:768}),signal:AbortSignal.timeout(3500)});
   if(r.ok){const v=(await r.json())?.embedding?.values;if(Array.isArray(v)&&v.length===768&&v.every(Number.isFinite))vector=v}else await r.body?.cancel();
  }
 }catch{}
 const privateHeaders={apikey:env.SUPABASE_ANON_KEY,Authorization:jwt,'Content-Type':'application/json'};
 const base=env.SUPABASE_URL+'/rest/v1/';
 const r=await fetcher(base+'rpc/buscar_biblioteca_hibrida',{method:'POST',headers:privateHeaders,body:JSON.stringify({consulta,query_embedding:vector,match_count:6,filtro_categoria:null}),signal:AbortSignal.timeout(4000)});
 if(!r.ok){await r.body?.cancel();return out({trechos:[]},503)}
 let trechos=await r.json();if(!Array.isArray(trechos))trechos=[];
 const titulos=[...new Set(trechos.map(t=>String(t.titulo_obra||'')))].slice(0,12),idade={},macro={};
 if(titulos.length)try{
  const q=await fetcher(base+'conhecimento_trading?select=titulo_obra,categoria,criado_em&titulo_obra=in.('+titulos.map(t=>'"'+t.replace(/"/g,'')+'"').map(encodeURIComponent).join(',')+')&limit=60',{headers:privateHeaders,signal:AbortSignal.timeout(1500)});
  if(q.ok)for(const x of await q.json()){const dias=(Date.now()-Date.parse(x.criado_em))/864e5;if(Number.isFinite(dias))idade[x.titulo_obra]=Math.max(idade[x.titulo_obra]||0,dias);if(x.categoria==='Fatos_Relevantes_Macro')macro[x.titulo_obra]=true}
 }catch{}
 trechos=trechos.map(t=>{const base=Number(t.similarity)||0,efemero=t.tipo_fonte==='Artigo_Web'||t.tipo_fonte==='Video_YouTube'||!!macro[t.titulo_obra],v=efemero?Math.max(.5,1-Math.max(0,idade[t.titulo_obra]??0)/365):1;return {...t,similarity:base*v,similarity_original:base}}).sort((a,b)=>b.similarity-a.similarity);
 return out({trechos});
}
export async function pesquisaCloudflare(req,env,macroResponder,fetcher=fetch){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return out({erro:'Use POST.'},405);
 if(req.headers.get('origin')&&req.headers.get('origin')!==ORIGIN)return out({erro:'Origem não autorizada.'},403);
 if(!ready(env))return out({erro:'Pesquisa temporariamente indisponível.'},503);
 if(!/^Bearer [^ ]+$/.test(req.headers.get('authorization')||''))return out({erro:'Entre na sua conta.'},401);
 const adapt=async(input,init)=>{
  const url=String(input);
  if(url===env.SUPABASE_URL+'/functions/v1/macro'){
   const body=JSON.parse(String(init?.body||'{}'));
   const r=await macroResponder({modo:'agenda',semana:body.semana||0});return out(r.body,r.status);
  }
  if(url===env.SUPABASE_URL+'/functions/v1/conhecimento-ia')return bibliotecaPesquisa(env,init,fetcher);
  return fetcher(input,init);
 };
 // Restrict legacy diagnostic endpoints: only actual user session can enter this route.
 const get=k=>k==='PESQUISA_CLOUDFLARE'?'1':k==='CRON_SECRET'?undefined:env[k];
 const reservaIA=env.AI&&typeof env.AI.run==='function'?async(system,prompt,json)=>{
  let timer;try{
   const result=await Promise.race([env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8-fast',{messages:[{role:'system',content:system+(json?' Responda apenas JSON válido.':'')},{role:'user',content:prompt}],max_tokens:1400,temperature:0.15}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Tempo de reserva esgotado')),10000)})]);
   return typeof result==='string'?result:typeof result?.response==='string'?result.response:'';
  }finally{clearTimeout(timer)}
 }:undefined;
 const r=await criarPesquisaHandler(get,adapt,true,reservaIA).handler(req);
 const h=new Headers(r.headers);for(const [k,v] of Object.entries(headers))h.set(k,v);
 return new Response(r.body,{status:r.status,headers:h});
}
