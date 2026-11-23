'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs');
const {generateKeyPairSync,sign}=require('node:crypto');
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),kid:'v936-test',alg:'ES256',use:'sig'};
const ORIGIN='https://meudiariotrade.github.io', SB='https://test.supabase.co';
const uid='11111111-1111-4111-8111-111111111111';
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(){
 const head=b64({typ:'JWT',alg:'ES256',kid:jwk.kid});
 const now=Math.floor(Date.now()/1000);
 const payload=b64({iss:SB+'/auth/v1',aud:'authenticated',role:'authenticated',sub:uid,iat:now,exp:now+300});
 const data=head+'.'+payload;
 return data+'.'+sign('sha256',Buffer.from(data),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
const request=(body,{origin=ORIGIN,jwt=token()}={})=>new Request('https://diario-screeners-quant.test/v1/ia-extras',{
 method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+jwt},body:JSON.stringify(body)
});
function env(resultado){
 const put=[];
 return {SUPABASE_URL:SB,SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]}),
 SCREENER_CACHE:{async get(){return null},async put(key,value){put.push({key,value})}},
 AI:{async run(){return {response:JSON.stringify({resultado})}}},_put:put};
}
const service=()=>import('../cloudflare/diario-screeners/extras-v936.mjs');
const withFailFetch=async cb=>{
 const old=global.fetch,urls=[];
 global.fetch=async url=>{urls.push(String(url));return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}})};
 try{return await cb(urls)}finally{global.fetch=old}
};
test('v936: Coach retorna os mesmos campos e nota de disciplina limitada a 0..10',async()=>{
 await withFailFetch(async urls=>{
  const e=env({resumo:'Foram 10 trades e seis stops seguidos.',pontos_fortes:['Respeitou o stop'],
   a_melhorar:['Esperar confluência'],padroes:['Após duas perdas há overtrade'],
   plano:['Máximo de três entradas'],nota_disciplina:12});
  const {extrasV936}=await service();
  const r=await extrasV936(request({modo:'coach',periodo:'mes',dados:{operacoes:10,resultados:[-1,1]}}),e);
  assert.equal(r.status,200);
  const j=await r.json();
  assert.equal(j.periodo,'mes');assert.equal(j.nota_disciplina,10);
  assert.deepEqual(j.pontos_fortes,['Respeitou o stop']);
  assert.equal(j.plano[0],'Máximo de três entradas');
  assert.equal(e._put.length,1);
  assert.ok(!e._put[0].key.includes('Foram 10 trades'));
  assert.equal(urls.some(x=>x.includes('/rest/v1/')||x.includes('/functions/v1/')),false);
 });
});
test('v936: CNPI responde questões originais no contrato do app',async()=>{
 await withFailFetch(async()=>{
  const {extrasV936}=await service();
  const questoes=Array.from({length:4},(_,i)=>({q:'O que indica o item '+i+'?',o:['Renda','Risco','Juros','Volume'],c:i,e:'Conceito básico.',r:'Referência de estudo'}));
  const r=await extrasV936(request({modo:'cnpi',nome:'Fibonacci',tema:'t',n:4,existentes:['Pergunta antiga']}),env({questoes}));
  assert.equal(r.status,200);
  const j=await r.json();assert.equal(j.questoes.length,4);
  assert.equal(j.questoes[0].c,0);assert.equal(j.questoes[3].c,3);
 });
});
test('v936: Jornal Para Você não aceita ativo que o cliente não enviou',async()=>{
 await withFailFetch(async()=>{
  const {extrasV936}=await service();
  const r=await extrasV936(request({modo:'jornal_voce',ativos:['PETR4'],edicao:'Notícia sobre petróleo Brent.'}),
   env({itens:[{ativo:'PETR4',texto:'Petróleo influencia receita.'},{ativo:'VALE3',texto:'Injetado artificialmente.'}],resumo:'Petróleo em foco.'}));
  assert.equal(r.status,200);const j=await r.json();
  assert.deepEqual(j.itens,[{ativo:'PETR4',texto:'Petróleo influencia receita.'}]);
 });
});
test('v936: Quiz do Jornal garante 3 perguntas com 4 opções válidas',async()=>{
 await withFailFetch(async()=>{
  const {extrasV936}=await service();
  const perguntas=Array.from({length:3},(_,i)=>({p:'Qual o impacto '+i+'?',ops:['A','B','C','D'],c:i,exp:'Pelo mecanismo de juros.',disc:'Macroeconomia'}));
  const r=await extrasV936(request({modo:'jornal_quiz',edicao:'A Selic está sob debate.',disciplinas:['Macroeconomia']}),env({perguntas}));
  assert.equal(r.status,200);const j=await r.json();
  assert.equal(j.perguntas.length,3);assert.equal(j.perguntas[2].disc,'Macroeconomia');
 });
});
test('v936: recusa origem indevida, token inválido e conteúdo faltante',async()=>{
 const {extrasV936}=await service();
 assert.equal((await extrasV936(request({modo:'coach',dados:{trades:[]}}, {origin:'https://evil.example'}),env({resumo:'ok'}))).status,403);
 assert.equal((await extrasV936(request({modo:'coach',dados:{trades:[]}}, {jwt:'aaa.bbb.ccc'}),env({resumo:'ok'}))).status,401);
 assert.equal((await extrasV936(request({modo:'cnpi',nome:''}),env({questoes:[]}))).status,400);
});
test('v936: cliente só usa Supabase como reserva técnica, sem contornar quota 429',()=>{
 const app=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
 const index=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
 assert.match(app,/\/v1\/ia-extras/);
 assert.match(index,/extrasV936\(request,env\)/);
 assert.match(app,/\[408, 500, 502, 503, 504\]/);
 assert.doesNotMatch(app,/\[408, 429,/);
});
