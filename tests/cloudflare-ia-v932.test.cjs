'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {generateKeyPairSync,sign}=require('node:crypto');
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),alg:'ES256',kid:'ia-v932-test',use:'sig'};
const ORIGIN='https://meudiariotrade.github.io',URL='https://project.supabase.co';
const user='123e4567-e89b-12d3-a456-426614174000';
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function jwt(){
 const claims={iss:URL+'/auth/v1',aud:'authenticated',role:'authenticated',sub:user,exp:Math.floor(Date.now()/1000)+600,iat:Math.floor(Date.now()/1000)};
 const msg=b64({typ:'JWT',alg:'ES256',kid:jwk.kid})+'.'+b64(claims);
 return msg+'.'+sign('sha256',Buffer.from(msg),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
const env=(res)=>({SUPABASE_URL:URL,SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]}),
 SCREENER_CACHE:{async get(){return null},async put(){}},
 AI:{async run(){return {response:JSON.stringify({resultado:res})}}}});
function request(path,body,origin=ORIGIN,token=jwt()){
 return new Request('https://diario-screeners.test'+path,{
 method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+token},
 body:JSON.stringify(body)});
}
const stats=()=>import('../cloudflare/diario-screeners/estatisticas-v932.mjs');
const explica=()=>import('../cloudflare/diario-screeners/explica-v932.mjs');
const validStats=()=>({relatorio:{
 leitura_geral:['Amostra limitada'],pontos_fortes:[],pontos_de_melhoria:[],
 padroes_de_comportamento:[],plano_proximos_20_trades:['Proteger o risco'],alertas:[]}});
const validExplica=()=>({explicacao:'A fórmula indicada é correta pela definição do conceito.',conta:'',erro_marcado:'',dica:'Reveja a fórmula.'});
test('v932: ambas rotas exigem JWT e origem correta',async()=>{
 const {estatisticasV932}=await stats(),{explicarV932}=await explica();
 const s={modo:'estatisticas',resumo:{trades:10}};
 const e={modo:'explica',q:'Qual é a fórmula?',o:['A','B'],c:1};
 assert.equal((await estatisticasV932(request('/v1/ia-estatisticas',s,'https://evil.example'),env(validStats()))).status,403);
 assert.equal((await explicarV932(request('/v1/ia-explica',e,ORIGIN,'abc'),env(validExplica()))).status,401);
});
test('v932: estatísticas usam Workers AI como fallback e preservam contrato',async()=>{
 const {estatisticasV932}=await stats();
 const old=global.fetch;const visited=[];
 global.fetch=async url=>{visited.push(String(url));return new Response(null,{status:503})};
 try{
  const r=await estatisticasV932(request('/v1/ia-estatisticas',{modo:'estatisticas',resumo:{trades:18,acerto:55}}),env(validStats()));
  assert.equal(r.status,200);
  const j=await r.json();
  assert.equal(j.base,'números calculados pelo app');
  assert.deepEqual(j.relatorio.leitura_geral,['Amostra limitada']);
  assert.equal(j.ia,'Cloudflare');
  assert.equal(visited.some(u=>u.includes('/rest/v1/')||u.includes('/functions/v1/')),false);
 }finally{global.fetch=old}
});
test('v932: explicações preservam o gabarito e devolvem campos do app',async()=>{
 const {explicarV932}=await explica();
 const old=global.fetch;global.fetch=async()=>new Response(null,{status:503});
 try{
  const r=await explicarV932(request('/v1/ia-explica',{modo:'explica',q:'Que fórmula usar?',o:['Alternativa 1','Alternativa 2'],c:1,r:0,tema:'Matemática Financeira'}),env(validExplica()));
  assert.equal(r.status,200);
  const j=await r.json();
  assert.match(j.explicacao,/fórmula/);
  assert.equal(j.dica,'Reveja a fórmula.');
  assert.equal(typeof j.gerado,'string');
 }finally{global.fetch=old}
});
test('v932: recusa dados inválidos sem consumir chamada de IA',async()=>{
 const {estatisticasV932}=await stats(),{explicarV932}=await explica();
 const s=await estatisticasV932(request('/v1/ia-estatisticas',{modo:'estatisticas'}),env(validStats()));
 assert.equal(s.status,400);
 const e=await explicarV932(request('/v1/ia-explica',{modo:'explica',q:'x',o:['A','B'],c:4}),env(validExplica()));
 assert.equal(e.status,400);
});
test('v932: roteador prioriza Cloudflare antes da trava GET e o app retém fallback controlado',()=>{
 const worker=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 const ui=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
 assert.match(worker,/url\.pathname==='\/v1\/ia-explica'/);
 assert.match(worker,/url\.pathname==='\/v1\/ia-estatisticas'/);
 assert.match(ui,/endpointCloudflare/);
 assert.match(ui,/\[408, 429, 500, 502, 503, 504\]/);
 assert.match(ui,/e\?\.modo === "explica"/);
 assert.match(ui,/e\?\.modo === "estatisticas"/);
});

test('v932: tópicos, simulados e inglês retornam seus contratos via Workers AI',async()=>{
 const {estudosV932}=await import('../cloudflare/diario-screeners/estudos-v932.mjs');
 const cases=[
  [{modo:'topicos',materia:'Economia',curso:'Ciências Econômicas'}, {topicos:[{t:'Oferta e demanda',d:1},{t:'Inflação',d:2},{t:'Juros',d:2}]}],
  [{modo:'quiz',materia:'Economia',topico:'Oferta e demanda',n:3},{questoes:[
    {q:'Questão 1',o:['a','b','c','d'],c:0,e:'...',r:'manual'},
    {q:'Questão 2',o:['a','b','c','d'],c:1,e:'...',r:'manual'},
    {q:'Questão 3',o:['a','b','c','d'],c:2,e:'...',r:'manual'}]}],
  [{modo:'ingles',cena:'cumprimentos',texto:'hello'}, {resposta:'Hello! How are you?',traducao:'Olá, como você está?',correcao:'',explicacao:'',sugestao:'I am fine.'}]
 ];
 const old=global.fetch;global.fetch=async()=>new Response(null,{status:503});
 try{
  for(const [payload,answer] of cases){
   const r=await estudosV932(request('/v1/ia-estudos',payload),env(answer));
   assert.equal(r.status,200,payload.modo);
   const body=await r.json();
   if(payload.modo==='quiz')assert.equal(body.questoes.length,3);
   if(payload.modo==='topicos')assert.equal(body.topicos.length,3);
   if(payload.modo==='ingles')assert.equal(body.resposta,'Hello! How are you?');
  }
 }finally{global.fetch=old}
});
