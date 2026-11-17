// Screeners: leitura publica de snapshots agregados e consultas privadas por filtro.
const SB=Deno.env.get('SUPABASE_URL')||'';
const SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,if-none-match',
 'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Expose-Headers':'ETag,X-Snapshot-Source'};
const privateHeaders={'Cache-Control':'private, no-store'};
function out(value:unknown,status=200,extra:Record<string,string>={}) {
 return new Response(JSON.stringify(value),{status,headers:{...CORS,...privateHeaders,...extra,'Content-Type':'application/json; charset=utf-8'}});
}
async function rpc(name:string,args:unknown){
 const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',
  headers:{apikey:SVC,Authorization:'Bearer '+SVC,'Content-Type':'application/json'},
  body:JSON.stringify(args),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('RPC indisponivel: '+name+' HTTP '+r.status);
 return r.json();
}
async function etag(value:string){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return '"'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('').slice(0,24)+'"';
}
async function publicSnapshot(req:Request,market:string){
 const raw=await rpc('quant_v2_snapshot_read',{p_market:market});
 if(!raw||typeof raw!=='object')return out({error:'Snapshot ainda nao gerado'},503);
 // Global, sem user_id, carteira ou qualquer dado particular.
 const {top10:storedRanking,...publicFields}=raw; // Top 10 fica precomputado no banco, não é retransmitido sem necessidade.
 const body=JSON.stringify({ok:true,...publicFields,snapshot_model:'v2.0'});
 const tag=await etag(body),headers={...CORS,'Cache-Control':'public, max-age=900, s-maxage=1800',
  'ETag':tag,'X-Snapshot-Source':'precomputed','Vary':'Accept-Encoding',
  'Content-Type':'application/json; charset=utf-8'};
 if(req.headers.get('if-none-match')===tag)return new Response(null,{status:304,headers});
 return new Response(body,{status:200,headers});
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(!SB||!SVC)return out({error:'Servico nao configurado'},503);
 try{
  if(req.method==='GET'){
   const u=new URL(req.url),market=u.searchParams.get('market');
   if(!['BR','US'].includes(market||'')||u.searchParams.get('snapshot')!=='1')
    return out({error:'Somente snapshots publicos BR ou US'},400);
   return publicSnapshot(req,market!);
  }
  if(req.method!=='POST')return out({error:'Metodo nao permitido'},405);
  // Consultas personalizadas SEMPRE autenticadas e nunca cacheadas entre usuarios.
  const token=(req.headers.get('authorization')||'').replace(/^Bearer +/i,'');
  if(!token||token.length>4096)return out({error:'Entre na sua conta'},401);
  const auth=await fetch(SB+'/auth/v1/user',{
   headers:{apikey:ANON||SVC,Authorization:'Bearer '+token},signal:AbortSignal.timeout(7000)});
  if(!auth.ok)return out({error:'Sessao expirada'},401);
  const user=await auth.json();if(!user?.id)return out({error:'Sessao invalida'},401);
  const raw=await req.text();if(raw.length>4500)return out({error:'Pedido muito grande'},413);
  const b=JSON.parse(raw||'{}');if(!['BR','US'].includes(b.market))return out({error:'Mercado invalido'},400);
  const clean=(v:unknown,n:number)=>String(v||'').trim().slice(0,n);
  const sectors=clean(b.sector,100),search=clean(b.search,60);
  const custody=['todos','carteira','fora'].includes(b.custody)?b.custody:'todos';
  const cap=['all','large','mid','small'].includes(b.cap)?b.cap:'all';
  const presets=b.market==='BR'?['top','dividendos','valor','bancos']:
   ['top','compounders','garp','rule40','buybacks'];
  const preset=presets.includes(b.preset)?b.preset:'top';
  const order=['score','roe','roic','dy','momentum','pvp','forward_pe','yield'].includes(b.order)?b.order:'score';
  const owned=[...new Set((Array.isArray(b.owned)?b.owned:[]).slice(0,80)
   .map((s:unknown)=>clean(s,20).toUpperCase())
   .filter((s:string)=>/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(s)))];
  const args={p_market:b.market,p_search:search,p_sector:sectors,p_custody:custody,p_owned:owned,
   p_liquidity:b.market==='BR'&&[0,1000000,5000000,20000000].includes(Number(b.liquidity))?Number(b.liquidity):0,
   p_cap:cap,p_preset:preset,p_order:order,
   p_page:Math.max(0,Math.min(100000,Math.floor(Number(b.page)||0)))};
  const publicQuery=owned.length===0&&custody==='todos'&&!search&&!sectors&&args.p_liquidity===0&&
   cap==='all'&&preset==='top'&&order==='score'&&args.p_page===0;
  if(publicQuery)return publicSnapshot(req,b.market);
  const data=await rpc('quant_v2_consulta_compacta',args);
  return out({ok:true,...data},200,{'X-Snapshot-Source':'filtered-private'});
 }catch(e){
  console.error('screeners-quant',String(e).slice(0,140));
  return out({error:'Consulta indisponivel. Tente novamente.'},503);
 }
});
