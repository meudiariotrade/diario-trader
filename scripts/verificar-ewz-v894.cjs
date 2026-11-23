// Teste real, somente leitura, da Cloudflare pública; não chama Supabase.
const endpoint='https://diario-trader.lucianosilva43567.workers.dev/v1/ewz';
async function main(){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),25000);
 try{
  const r=await fetch(endpoint,{method:'GET',cache:'no-store',signal:ctrl.signal,headers:{Accept:'application/json',Origin:'https://meudiariotrade.github.io'}});
  const j=await r.json().catch(()=>({}));
  const cors=r.headers.get('access-control-allow-origin');
  const spot=Number(j.spot);
  console.log(JSON.stringify({http:r.status,origem:j.origem||null,status:j.status||null,spot:Number.isFinite(spot)?spot:null,fonte:j.fonte||null,metricaOpcoes:j.status==='sem_feed_opcoes'?'indisponivel_sem_feed':'com_feed',cors:!!cors,erro:j.error||j.erro||null}));
  if(r.status!==200||j.origem!=='cloudflare'||!(spot>0)||!['sem_feed_opcoes',undefined].includes(j.status))process.exitCode=1;
  if(cors!=='https://meudiariotrade.github.io')process.exitCode=1;
 }finally{clearTimeout(timer)}
}
main().catch(e=>{console.error('EWZ Cloudflare indisponivel:',String(e.message||e));process.exitCode=1});
