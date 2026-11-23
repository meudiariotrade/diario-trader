const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/shared/cache-publico.js','utf8');
function client(token,cloudOk=true){
 const calls=[];const base='https://diario-trader.lucianosilva43567.workers.dev';
 const native=async(url,init)=>{calls.push({url:String(url),init});if(String(url).startsWith(base+'/v1/replay')){
  return new Response(cloudOk?JSON.stringify({simbolo:'VALE3.SA',intervalo:'5m',candles:[[1795000000,1,2,1,2,100]]}):JSON.stringify({error:'indisponivel'}),{status:cloudOk?200:503});}
 return new Response(JSON.stringify({candles:[[1795000000,1,2,1,2,100]],fonte:'supabase'}),{status:200});};
 const window={fetch:native};const context={window,SESS:token?{at:token}:null,Response,AbortSignal,DOMException,URL,console};
 vm.runInNewContext(source,context);
 return {window,calls,request:()=>window.fetch('https://example.supabase.co/functions/v1/candles',{method:'POST',headers:{apikey:'public-key'},body:JSON.stringify({ativo:'VALE3',modo:'replay',intervalo:'5m',pregao:'b3'})})};
}
test('replay autenticado vai primeiro ao D1 sem tokens em cache publico',async()=>{
 const c=client('token-local-de-teste');const r=await c.request(),v=await r.json();
 assert.equal(c.calls.length,1);assert.match(c.calls[0].url,/\/v1\/replay\?/);
 assert.match(c.calls[0].url,/intervalo=5m/);assert.match(c.calls[0].url,/pregao=b3/);
 assert.equal(c.calls[0].init.headers.Authorization,'Bearer token-local-de-teste');
 assert.ok(Array.isArray(v.candles));assert.equal(c.calls[0].init.credentials,'omit');
});
test('falha da Cloudflare preserva o fallback Supabase',async()=>{
 const c=client('token-local-de-teste',false),r=await c.request();assert.equal((await r.json()).fonte,'supabase');assert.equal(c.calls.length,2);
 assert.match(c.calls[1].url,/\/functions\/v1\/candles$/);
});
test('sem sessao o Worker nao recebe token inventado',async()=>{
 const c=client(null),r=await c.request();assert.equal((await r.json()).fonte,'supabase');assert.equal(c.calls.length,1);
 assert.match(c.calls[0].url,/\/functions\/v1\/candles$/);
});
