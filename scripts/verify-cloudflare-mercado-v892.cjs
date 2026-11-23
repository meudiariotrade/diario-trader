// Uma consulta pública por serviço, sem credenciais, sem logs do Supabase.
const BASE='https://diario-trader.lucianosilva43567.workers.dev';
async function probe(route,timeout=16000){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);
  try{
    const r=await fetch(BASE+route,{method:'GET',headers:{Accept:'application/json'},cache:'no-store',signal:c.signal});
    const j=await r.json().catch(()=>({}));
    return {status:r.status,data:j};
  }finally{clearTimeout(timer);}
}
async function main(){
 const results={};
 for(const [name,route] of [
  ['health','/health'],
  ['prices','/v1/precos?br=PETR4&us=AAPL'],
  ['candles','/v1/candles?ativo=PETR4&intervalo=1d'],
  ['macro','/v1/macro?modo=agenda&semana=0']
 ]){
  try{
    const p=await probe(route);
    const ok=name==='health'?p.status===200&&p.data.ok===true:
      name==='prices'?p.status===200&&Number(p.data.br?.PETR4)>0&&Number(p.data.us?.AAPL)>0:
      name==='candles'?p.status===200&&Array.isArray(p.data.candles)&&p.data.candles.length>0:
      p.status===200&&p.data&&!p.data.error;
    results[name]={http:p.status,ok,source:p.data.fonte||p.data.origem||null};
  }catch(e){results[name]={http:0,ok:false,reason:e?.name==='AbortError'?'timeout':'network'};}
 }
 for(const [name,r] of Object.entries(results))console.log(name+': '+(r.ok?'OK':'PENDENTE')+' HTTP '+r.http+(r.source?' · '+String(r.source).slice(0,60):''));
 // Falha identificada com dados reais. Nao impede o fallback do app nem a publicacao.
 if(!results.prices.ok||!results.candles.ok||!results.health.ok)process.exitCode=1;
}
main().catch(()=>{console.error('Falha na auditoria do Worker');process.exitCode=1});
