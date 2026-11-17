// Screeners de Analises — consulta paginada. Sem polling e sem retorno de dados privados da Carteira.
const SB=Deno.env.get('SUPABASE_URL')||'';
const SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const out=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, max-age=60','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return out({ok:true});
 if(req.method!=='POST')return out({error:'Metodo nao permitido'},405);
 if(!SB||!SVC)return out({error:'Servico nao configurado'},503);
 try{
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\\s+/i,'');
  if(!token||token.length>4096)return out({error:'Entre na sua conta'},401);
  const auth=await fetch(SB+'/auth/v1/user',{headers:{apikey:ANON||SVC,Authorization:'Bearer '+token},signal:AbortSignal.timeout(7000)});
  if(!auth.ok)return out({error:'Sessao expirada'},401);
  const u=await auth.json();if(!u?.id)return out({error:'Sessao invalida'},401);
  const raw=await req.text();
  if(raw.length>4500)return out({error:'Pedido muito grande'},413);
  const b=JSON.parse(raw||'{}');
  if(!['BR','US'].includes(b.market))return out({error:'Mercado invalido'},400);
  const clean=(v:unknown,n:number)=>String(v||'').trim().slice(0,n);
  const setores=clean(b.sector,100), busca=clean(b.search,60);
  const custodia=['todos','carteira','fora'].includes(b.custody)?b.custody:'todos';
  const cap=['all','large','mid','small'].includes(b.cap)?b.cap:'all';
  const allowedBR=['top','dividendos','valor','bancos'];
  const allowedUS=['top','compounders','garp','rule40','buybacks'];
  const preset=(b.market==='BR'?allowedBR:allowedUS).includes(b.preset)?b.preset:'top';
  const order=['score','roe','roic','dy','momentum','pvp','forward_pe','yield'].includes(b.order)?b.order:'score';
  const owned=[...new Set((Array.isArray(b.owned)?b.owned:[]).slice(0,80).map((s:unknown)=>clean(s,20).toUpperCase()).filter((s:string)=>/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(s)))];
  const rpc=await fetch(SB+'/rest/v1/rpc/quant_screeners_buscar',{method:'POST',headers:{apikey:SVC,Authorization:'Bearer '+SVC,'Content-Type':'application/json'},body:JSON.stringify({
   p_market:b.market,p_search:busca,p_sector:setores,p_custody:custodia,p_owned:owned,
   p_liquidity:b.market==='BR'&&[0,1000000,5000000,20000000].includes(Number(b.liquidity))?Number(b.liquidity):0,
   p_cap:cap,p_preset:preset,p_order:order,p_page:Math.max(0,Math.min(100000,Math.floor(Number(b.page)||0)))
  }),signal:AbortSignal.timeout(12000)});
  if(!rpc.ok){console.error('quant_screeners_buscar',rpc.status);return out({error:'Nao foi possivel carregar o Screener.'},502)}
  const data=await rpc.json();return out({ok:true,...data});
 }catch(e){console.error('screeners-quant',String(e).slice(0,120));return out({error:'Consulta indisponivel. Tente novamente.'},503)}
});