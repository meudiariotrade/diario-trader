// Complemento de fundamentos dos Screeners: Finnhub gratuito, lotes <=20 sem polling.
const SB=Deno.env.get('SUPABASE_URL')||'',SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const headers={apikey:SVC,Authorization:'Bearer '+SVC,'Content-Type':'application/json'};
const response=(o,status=200)=>new Response(JSON.stringify(o),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function rpc(name,payload={}){
 const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error(name+' HTTP '+r.status);
 return r.json();
}
async function permitted(req){
 if(!SB||!SVC)return false;
 const entered=req.headers.get('x-cron-secret')||'',expected=await rpc('diario_agendamento_chave').catch(()=>null);
 if(!entered||typeof expected!=='string'||entered.length!==expected.length)return false;
 let x=0;for(let i=0;i<entered.length;i++)x|=entered.charCodeAt(i)^expected.charCodeAt(i);
 return x===0;
}
function numeric(x){return typeof x==='number'&&Number.isFinite(x)?x:null}
function asNum(x){const n=numeric(x);return n!==null?+n.toFixed(5):null}
async function run(){
 const token=await rpc('finnhub_chave',{}).catch(()=>null);
 if(typeof token!=='string'||token.length<8)throw Error('Finnhub nao configurado no Vault');
 const pending=await rpc('quant_screeners_finnhub_pendentes',{p_limit:20});
 const updates=[],errors=[];
 for(const item of Array.isArray(pending)?pending:[]){
  const url='https://finnhub.io/api/v1/stock/metric?symbol='+encodeURIComponent(item.ticker)+'&metric=all&token='+encodeURIComponent(token);
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(11000),headers:{Accept:'application/json'}});
   if(r.status===429){errors.push('Finnhub 429: coleta interrompida para preservar a cota');break}
   if(!r.ok){updates.push({ticker:item.ticker,status:'http_'+r.status});continue}
   const obj=await r.json(),m=obj?.metric||{};
   const row={ticker:item.ticker,
    forward_pe:asNum(m.forwardPE),
    peg_ratio:asNum(m.forwardPEG)??asNum(m.pegTTM),
    ev_fcf:asNum(m['currentEv/freeCashFlowTTM']),
    revenue_growth_yoy:asNum(m.revenueGrowthTTMYoy),
    eps_growth_yoy:asNum(m.epsGrowthTTMYoy),
    status:Object.keys(m).length?'verificado':'sem_metricas'};
   updates.push(row);
  }catch(e){errors.push(item.ticker+': '+String(e).slice(0,60));updates.push({ticker:item.ticker,status:'erro_transitorio'})}
 }
 const gravados=updates.length?await rpc('quant_screeners_finnhub_patch',{p_rows:updates}):0;
 return {selecionados:pending?.length||0,gravados,metricas_verificadas:updates.filter(x=>x.forward_pe!=null||x.revenue_growth_yoy!=null).length,
 erros:errors.slice(0,4)};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return response({error:'Somente POST'},405);
 if(!await permitted(req))return response({error:'Nao autorizado'},401);
 try{return response({acao:'finnhub',...await run()})}
 catch(e){console.error('Finnhub screener',String(e).replace(/token=[^&]+/g,'token=[oculto]').slice(0,100));return response({error:'Coleta indisponivel'},503)}
});
