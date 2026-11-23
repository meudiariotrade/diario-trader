'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {generateKeyPairSync,sign}=require('node:crypto');
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),alg:'ES256',kid:'v933',use:'sig'};
const origin='https://meudiariotrade.github.io',sb='https://example.supabase.co';
const id='123e4567-e89b-12d3-a456-426614174000';
const enc=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
function token(){
 const h=enc({alg:'ES256',kid:jwk.kid,typ:'JWT'});
 const p=enc({iss:sb+'/auth/v1',aud:'authenticated',role:'authenticated',sub:id,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+600});
 const signed=h+'.'+p;
 return signed+'.'+sign('sha256',Buffer.from(signed),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
const req=(body,opts={})=>new Request('https://diario-screeners-quant.test/v1/ia-diario',{
 method:'POST',headers:{Origin:opts.origin??origin,'Content-Type':'application/json',Authorization:'Bearer '+(opts.token??token())},
 body:JSON.stringify(body)});
const env=resultado=>({
 SUPABASE_URL:sb,SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]}),
 SCREENER_CACHE:{async get(){return null},async put(){}},
 AI:{async run(){return{response:JSON.stringify({resultado})}}}
});
const service=()=>import('../cloudflare/diario-screeners/diario-ia-v933.mjs');
test('v933: rejeita origem não permitida, assinatura JWT inválida e modo desconhecido',async()=>{
 const {diarioIaV933}=await service(),e=env({resposta:'ok'});
 assert.equal((await diarioIaV933(req({modo:'diario',sub:'chat',pergunta:'Qual desempenho?'},{origin:'https://evil.example'}),e)).status,403);
 assert.equal((await diarioIaV933(req({modo:'diario',sub:'chat',pergunta:'Qual desempenho?'},{token:'a.b.c'}),e)).status,401);
 assert.equal((await diarioIaV933(req({modo:'desconhecido',sub:'chat'}),e)).status,400);
});
test('v933: chat não usa Supabase REST nem grava dados privados em KV',async()=>{
 const {diarioIaV933}=await service(),e=env({resposta:'Foram 8 operações, segundo os dados informados.'});
 const old=global.fetch;const calls=[];
 global.fetch=async(url,opt)=>{calls.push(String(url));return new Response(null,{status:503})};
 try{
  const r=await diarioIaV933(req({modo:'diario',sub:'chat',pergunta:'Quantas operações foram?',dados:{trades:8}}),e);
  assert.equal(r.status,200);const j=await r.json();
  assert.match(j.resposta,/8 operações/);assert.equal(calls.some(x=>x.includes('supabase.co')),false);
 }finally{global.fetch=old}
});
test('v933: padrões de perdas só podem referenciar IDs autorizados e sem duplicação',async()=>{
 const {diarioIaV933}=await service();
 const perdas=Array.from({length:6},(_,i)=>({id:'trade-'+i,erro:'Sem stop',setup:'rompimento',r:-1}));
 const e=env({grupos:[
  {nome:'Sem stop',descricao:'Risco',evitar:'Definir stop',ids:['trade-0','trade-0','trade-1','outro']},
  {nome:'Revanche',descricao:'Após perda',evitar:'Pausa',ids:['trade-0','trade-3']}
 ]});
 const old=global.fetch;global.fetch=async()=>new Response(null,{status:503});
 try{
  const r=await diarioIaV933(req({modo:'diario',sub:'perdas',perdas}),e);
  assert.equal(r.status,200);const j=await r.json();
  assert.deepEqual(j.grupos[0].ids,['trade-0','trade-1']);
  assert.deepEqual(j.grupos[1].ids,['trade-3']);
 }finally{global.fetch=old}
});
test('v933: debriefing escrito funciona; áudio conserva tratamento multimodal legado',async()=>{
 const {diarioIaV933}=await service();
 const e=env({bem:'Seguiu o stop.',aprendizado:'Evitar antecipação.',emocoes:['ansiedade'],erros:['entrada tardia']});
 const old=global.fetch;global.fetch=async()=>new Response(null,{status:503});
 try{
  const payload={modo:'diario',sub:'debrief',texto:'Hoje operei com disciplina, porém entrei tarde.',dia:{trades:2}};
  const r=await diarioIaV933(req(payload),e),j=await r.json();
  assert.equal(r.status,200);assert.equal(j.bem,'Seguiu o stop.');assert.deepEqual(j.emocoes,['ansiedade']);
  const a=await diarioIaV933(req({...payload,audio:{data:'audio',mime:'audio/mp4'}}),e);
  assert.equal(a.status,422);
 }finally{global.fetch=old}
});
test('v933: interface preserva fallback de modo áudio mas não contorna limite HTTP 429',()=>{
 const src=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
 assert.match(src,/\/v1\/ia-diario/);
 assert.match(src,/\!e\?\.audio/);
 assert.match(src,/\[408, 500, 502, 503, 504\]/);
 assert.doesNotMatch(src,/\[408, 429,/);
});
