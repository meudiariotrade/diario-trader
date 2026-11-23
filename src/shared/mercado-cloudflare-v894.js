/* v894 — leituras públicas diretamente na Cloudflare, sem egress de mercado no Supabase.
 * Ponte estritamente limitada às Edge Functions de dados públicos. NUNCA repassa
 * credenciais, cabeçalhos de usuário, carteira, operações ou dados privados.
 * Para falhas públicas, retorna erro explícito (nunca consulta o Supabase).
 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof window.fetch!=='function')return;
const HOST='vdzwydizostutukppcsj.supabase.co';
const CLOUDFLARE='https://diario-trader.lucianosilva43567.workers.dev/v1/';
const FUNCOES=new Set(['ewz','macro','precos','candles','juros','sentimento','adrs','noticias']);
const FETCH_ORIGINAL=window.fetch.bind(window);
function erro(msg,status=503){
 return new Response(JSON.stringify({
   erro:String(msg||'Fonte pública temporariamente indisponível.'),
   error:String(msg||'Fonte pública temporariamente indisponível.'),
   origem:'cloudflare',
   semFallbackSupabase:true
 }),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
function endereco(funcao,dados){
 const p=new URLSearchParams();
 if(funcao==='macro'){
   for(const chave of ['modo','aba','semana'])if(dados[chave]!=null)p.set(chave,String(dados[chave]).slice(0,80));
 }else if(funcao==='candles'){
   for(const chave of ['ativo','sub','intervalo','de','ate','revista'])if(dados[chave]!=null)p.set(chave,String(dados[chave]).slice(0,60));
   if(!p.has('ativo'))return null;
 }else if(funcao==='ewz'){
   if(dados.acao&&dados.acao!=='agora')return null;
   if(dados.venc)p.set('venc',String(dados.venc).slice(0,10));
 }else if(funcao==='adrs'){
   const s=Array.isArray(dados.symbols)?dados.symbols:null;
   if(!s||!s.length||s.length>40||s.some(v=>!/^[A-Z0-9.^=_:-]{1,24}$/.test(String(v).toUpperCase())))return null;
   p.set('s',[...new Set(s.map(v=>String(v).toUpperCase()))].join(','));
 }else if(funcao==='juros'||funcao==='sentimento'||funcao==='noticias'){
   if(Object.keys(dados).length>0)return null;
 }else return null;
 return CLOUDFLARE+funcao+(p.size?'?'+p:'');
}
function valido(funcao,modo,j){
 if(!j||typeof j!=='object'||j.error||j.erro)return false;
 if(funcao==='ewz')return Number(j.spot)>0&&(j.status==='sem_feed_opcoes'||Array.isArray(j.vencs));
 if(funcao==='candles')return Array.isArray(j.candles)&&typeof j.simbolo==='string';
 if(funcao==='precos')return j.br&&j.us&&typeof j.br==='object'&&typeof j.us==='object';
 if(funcao==='juros')return !!(j.selic||j.curva);
 if(funcao==='sentimento')return !!(j.b3||j.eua||j.cripto);
 if(funcao==='adrs'||funcao==='noticias')return Array.isArray(j.itens);
 if(modo==='agenda')return Array.isArray(j.eventos);
 if(modo==='painel'||modo==='diag'||modo==='cotacoes')return Array.isArray(j.itens);
 if(modo==='balancos')return Array.isArray(j.proximos);
 if(modo==='ranking')return Array.isArray(j.altas);
 if(modo==='sazonal'||modo==='sazonal_us')return !!j.mes;
 if(modo==='setores')return 'us' in j||'br' in j;
 if(modo==='')return !!(j.mercados||j.brasil);
 return true;
}
async function getCloudflare(url,signal){
 const resposta=await FETCH_ORIGINAL(url,{method:'GET',credentials:'omit',mode:'cors',
    redirect:'error',cache:'default',headers:{Accept:'application/json'},signal});
 if(!resposta.ok){
  const j=await resposta.json().catch(()=>({}));
  throw Error(j.error||j.erro||'Cloudflare HTTP '+resposta.status);
 }
 if(!/application\/json/i.test(resposta.headers.get('content-type')||''))throw Error('Resposta pública não é JSON.');
 return resposta.json();
}
function simbolos(v){
 if(!Array.isArray(v))return null;
 const arr=v.map(x=>String(x||'').trim().toUpperCase());
 if(arr.length>800||arr.some(s=>s.length>32||!/^[A-Z0-9.^:_=/!-]+$/.test(s)))return null;
 return [...new Set(arr)];
}
async function precos(d,signal){
 const br=simbolos(d.br||[]),us=simbolos(d.us||[]);
 if(!br||!us)return erro('Lista de ativos inválida.',400);
 if(!br.length&&!us.length)return Response.json({br:{},us:{},fx:0,erros:[],fonte:'cloudflare'});
 const resultado={br:{},us:{},fx:0,erros:[],fonte:'cloudflare'};
 const lotes=Math.max(Math.ceil(br.length/40),Math.ceil(us.length/40));
 for(let n=0;n<lotes;n++){
  const p=new URLSearchParams({br:br.slice(n*40,(n+1)*40).join(','),us:us.slice(n*40,(n+1)*40).join(',')});
  const j=await getCloudflare(CLOUDFLARE+'precos?'+p.toString(),signal);
  if(!valido('precos','',j))throw Error('Cotação pública inválida.');
  Object.assign(resultado.br,j.br);Object.assign(resultado.us,j.us);
  if(Number(j.fx)>0)resultado.fx=Number(j.fx);
  if(Array.isArray(j.erros))resultado.erros.push(...j.erros);
 }
 if(!Object.keys(resultado.br).length&&!Object.keys(resultado.us).length)
  throw Error('Nenhuma cotação pública disponível no momento.');
 resultado.erros=[...new Set(resultado.erros)];
 return Response.json(resultado,{headers:{'Cache-Control':'no-store'}});
}
async function mercado(f,input,init){
 let dados={};
 try{
  if(init?.body!=null)dados=JSON.parse(String(init.body));
  else if(typeof Request!=='undefined'&&input instanceof Request)dados=await input.clone().json();
 }catch{return erro('Dados da consulta pública inválidos.',400);}
 if(!dados||typeof dados!=='object'||Array.isArray(dados))return erro('Dados da consulta pública inválidos.',400);
 const signal=init?.signal||(typeof Request!=='undefined'&&input instanceof Request?input.signal:undefined);
 try{
  if(f==='precos')return await precos(dados,signal);
  const url=endereco(f,dados);
  if(!url)return erro('Parâmetros da consulta pública inválidos.',400);
  const j=await getCloudflare(url,signal);
  if(!valido(f,String(dados.modo||''),j))throw Error('Formato de dados indisponível para '+f+'.');
  const saida=f==='noticias'?{...j,itens:j.itens.map(n=>({...n,f:n.f||n.fonte||n.a||'Fonte não indicada'}))}:j;
  return Response.json(saida,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return erro('Cloudflare: '+String(e?.message||e).slice(0,180));}
}
window.fetch=function(input,init){
 try{
  const u=new URL(typeof input==='string'||input instanceof URL?String(input):input?.url);
  const metodo=String(init?.method||input?.method||'GET').toUpperCase();
  if(metodo!=='POST'||u.protocol!=='https:'||u.hostname!==HOST)return FETCH_ORIGINAL(input,init);
  const prefix='/functions/v1/';
  if(!u.pathname.startsWith(prefix))return FETCH_ORIGINAL(input,init);
  const f=u.pathname.slice(prefix.length);
  if(!FUNCOES.has(f))return FETCH_ORIGINAL(input,init);
  return mercado(f,input,init);
 }catch{return FETCH_ORIGINAL(input,init);}
};
window.DiarioMercadoPublico=Object.freeze({versao:894,origem:'cloudflare',semFallbackSupabase:true});
})();
