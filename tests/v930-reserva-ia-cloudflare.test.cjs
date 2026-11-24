const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {generateKeyPairSync,sign}=require('node:crypto');
const uid='11111111-1111-4111-8111-111111111111';
const origin='https://meudiariotrade.github.io';
const auth='https://teste.supabase.co';
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),alg:'ES256',kid:'v930-test',use:'sig'};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const claims={iss:auth+'/auth/v1',aud:'authenticated',role:'authenticated',sub:uid,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)};
const msg=enc({typ:'JWT',alg:'ES256',kid:jwk.kid})+'.'+enc(claims);
const token=msg+'.'+sign('sha256',Buffer.from(msg),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
function req(edicao='manha'){
 return new Request('https://worker.test/v1/aurea-resumao',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({edicao,prompt:'Observações atualizadas e suas limitações. Explique exterior, Brasil, agenda e risco, distinguindo fatos e hipóteses, sem inventar preços nem notícias.'})});
}
function env(ai){
 const cache=new Map();
 return {SUPABASE_URL:auth,SUPABASE_ANON_KEY:'sb_publishable_teste',GEMINI_API_KEY:'chave-de-teste',GROQ_API_KEY:'chave-de-teste',SCREENER_CACHE:{async get(k){return cache.get(k)||null},async put(k,v){cache.set(k,v)}},AI:ai};
}
const worker=import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs');
test('v930: falhas externas levam a Workers AI, sem consultar PostgREST',async()=>{
 const prior=global.fetch,paths=[];const chamados=[];
 global.fetch=async(url)=>{const u=new URL(url);paths.push(u.toString());if(u.pathname.endsWith('/.well-known/jwks.json'))return Response.json({keys:[jwk]});return Response.json({error:'indisponivel'},{status:503})};
 try{
  const {resumoAurea}=await worker;
  const response=await resumoAurea(req(),env({async run(model,payload){chamados.push({model,payload});return {response:'1) Exterior: dados insuficientes. 2) Brasil: aguardar fonte. 3) Agenda: conferir próximos eventos. 4) Riscos: sem ordens automáticas.'}}}));
  const json=await response.json();
  assert.equal(response.status,200);assert.equal(json.ok,true);assert.match(json.model,/Workers AI/);
  assert.equal(chamados.length,1);assert.equal(chamados[0].model,'@cf/meta/llama-3.1-8b-instruct-fp8-fast');
  assert.ok(paths.every(x=>!x.includes('/rest/v1')&&!x.includes('/functions/v1')));
  assert.equal(response.headers.get('cache-control'),'private, no-store');
 }finally{global.fetch=prior}
});
test('v930: resposta de estudo inválida da reserva é recusada',async()=>{
 const prior=global.fetch;
 global.fetch=async(url)=>String(url).endsWith('/.well-known/jwks.json')?Response.json({keys:[jwk]}):Response.json({error:'offline'},{status:503});
 try{
  const {resumoAurea}=await worker;
  const response=await resumoAurea(req('estudos'),env({async run(){return {response:'{"resultado":{}}'}}}));
  assert.equal(response.status,503);
 }finally{global.fetch=prior}
});
test('v930: binding gratuito e cotas anteriores preservados',()=>{
 const cfg=JSON.parse(fs.readFileSync('cloudflare/diario-screeners/wrangler.jsonc','utf8'));
 const code=fs.readFileSync('cloudflare/diario-screeners/aurea-resumao-v904.mjs','utf8');
 assert.equal(cfg.ai.binding,'AI');
 // v956: janela Gemini de 14s, mantendo a reserva dentro do orçamento global.
 assert.ok(code.includes('prazoGemini=Date.now()+14000'));
 assert.ok(code.includes('prazoTotal=Date.now()+31500'));
 assert.match(code,/prazoTotal-Date\.now\(\)-\(env\.AI\?5000:500\)/);
 assert.match(code,/aurea:usage:v904:/);assert.match(code,/cerebro:usage:v924:/);
});
