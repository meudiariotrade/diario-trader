'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {generateKeyPairSync,sign}=require('node:crypto');
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),kid:'central-v939',alg:'ES256',use:'sig'};
const SB='https://test.supabase.co',ORIGIN='https://meudiariotrade.github.io';
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function jwt(){
 const t=Math.floor(Date.now()/1000),h=b64({alg:'ES256',kid:jwk.kid}),p=b64({iss:SB+'/auth/v1',aud:'authenticated',role:'authenticated',sub:'11111111-1111-4111-8111-111111111111',iat:t,exp:t+600});
 const msg=h+'.'+p;return msg+'.'+sign('sha256',Buffer.from(msg),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
const request=(body,origin=ORIGIN,token=jwt())=>new Request('https://central.test/v1/ia-central',{method:'POST',
 headers:{'Origin':origin,'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)});
function env(raw){return {SUPABASE_URL:SB,SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]}),
 SCREENER_CACHE:{async get(){return null},async put(){}},
 AI:{async run(){return {response:JSON.stringify({resultado:raw})}}}}}
const service=()=>import('../cloudflare/diario-screeners/central-v939.mjs');
test('v939: números não presentes no Terminal saem de Confirmados e viram interpretação',async()=>{
 const {normalizarCentralV939}=await service();
 const ctx={foco:'PETR4',ativo:{preco:35.2,fonte:'provedor',dado_em:'2026-11-23T19:00:00Z'},validacao:{problemas:['fonte atrasada']}};
 const value={resumo:'Análise condicionada aos dados.',confirmados:[
  {fato:'PETR4 cotado a R$ 35,20',fonte:'provedor'},
  {fato:'Ibovespa em 250.000 pontos',fonte:'desconhecido'}
 ],cenarios:{otimista:{descricao:'Se o ativo retomar a alta',gatilhos:['Confirmação de volume'],invalida:'Se perder suporte'}},riscos:['Desatualização']};
 const r=normalizarCentralV939(value,ctx);
 assert.equal(r.confirmados.length,1);
 assert.equal(r.confirmados[0].fonte,'provedor');
 assert.equal(r.interpretacoes.length,1);
 assert.match(r.interpretacoes[0].base,/não encontrado/);
 assert.equal(r.cenarios.otimista.gatilhos.length,1);
 assert.equal(r.cenarios.neutro.descricao,'');
 assert.ok(r.lacunas.some(x=>x.includes('fonte atrasada')));
});
test('v939: resposta autenticada preserva contrato do Terminal e não consulta Supabase Data API',async()=>{
 const {centralV939}=await service();
 const old=global.fetch,urls=[];
 global.fetch=async url=>{urls.push(String(url));return new Response(null,{status:503})};
 try{
  const ctx={foco:'PETR4',preco:35.2,fonte:'dados do aplicativo'};
  const r=await centralV939(request({modo:'central',contexto:ctx}),env({resumo:'PETR4 depende de confirmações nos preços.',confirmados:[{fato:'Preço do ativo: 35,20',fonte:'app'}],cenarios:{}}));
  assert.equal(r.status,200);const body=await r.json();
  assert.equal(body.ia,'Cloudflare');assert.equal(body.confirmados.length,1);
  assert.deepEqual(Object.keys(body.cenarios).sort(),['neutro','otimista','pessimista']);
  assert.equal(urls.some(u=>u.includes('/rest/v1/')||u.includes('/functions/v1/')),false);
 }finally{global.fetch=old}
});
test('v939: rejeita JWT, origem e payload inválidos',async()=>{
 const {centralV939}=await service();
 assert.equal((await centralV939(request({modo:'central',contexto:{foco:'PETR4'}}),'https://evil.example'),env({resumo:'ok'}))).status,403);
 assert.equal((await centralV939(request({modo:'central',contexto:{foco:'PETR4'}},ORIGIN,'bad'),env({resumo:'ok'}))).status,401);
 assert.equal((await centralV939(request({modo:'central',contexto:null}),env({resumo:'ok'}))).status,400);
});
test('v939: não contorna a quota quando Cloudflare retorna 429',()=>{
 const s=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
 assert.match(s,/e\?\.modo === "central" \? "\/v1\/ia-central"/);
 assert.match(s,/\[408, 500, 502, 503, 504\]/);
 assert.doesNotMatch(s,/\[408, 429,/);
});
