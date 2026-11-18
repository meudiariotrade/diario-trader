// Diagnostico sob demanda na publicação: apenas dados públicos, sem tokens ou contas.
const base='https://diario-screeners-quant.lucianosilva43567.workers.dev';
const fetchJson=async(route)=>{
 const response=await fetch(base+route,{method:'GET',headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
 let data={};try{data=await response.json()}catch{}
 return {http:response.status,cache:response.headers.get('X-Screeners-Cache')||null,
  etag:!!response.headers.get('ETag'),ok:data.ok===true,
  market:data.market||null,complete:data.universe_complete===true,
  rows:Array.isArray(data.universe_rows)?data.universe_rows.length:0,error:data.error||null};
};
let failed=false;
try{
 const health=await fetchJson('/health');
 console.log('HEALTH',JSON.stringify(health));
 if(health.http!==200||!health.ok)failed=true;
 for(const market of ['BR','US']){
  const route='/v1/screeners?market='+market+'&snapshot=1&universe=1';
  for(let attempt=1;attempt<=2;attempt++){
   const result=await fetchJson(route);
   console.log('SNAPSHOT',market,attempt,JSON.stringify(result));
   if(result.http!==200||!result.ok||result.market!==market||!result.complete)failed=true;
   if(attempt===1)await new Promise(resolve=>setTimeout(resolve,900));
  }
 }
}catch(error){console.error('Falha de comunicacao com Worker:',error.message);failed=true}
if(failed){console.error('Worker indisponivel/incompleto: o aplicativo preserva fallback para Supabase.');process.exitCode=1}
else console.log('Worker respondeu BR/US. Verifique X-Screeners-Cache para confirmar HIT por POP.');
