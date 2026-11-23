'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {generateKeyPairSync,sign}=require('node:crypto');
const ORIGIN='https://meudiariotrade.github.io';
const PROJECT='https://example.supabase.co';
const USER='123e4567-e89b-12d3-a456-426614174000';
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),alg:'ES256',kid:'v931-local-test',use:'sig'};
const env={ALLOWED_ORIGIN:ORIGIN,SUPABASE_URL:PROJECT,SUPABASE_ANON_KEY:'public',
 SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]})};
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const claims=()=>({iss:PROJECT+'/auth/v1',aud:'authenticated',role:'authenticated',sub:USER,
 exp:Math.floor(Date.now()/1000)+600,iat:Math.floor(Date.now()/1000)});
function token(payload=claims()){
 const head=b64({typ:'JWT',alg:'ES256',kid:jwk.kid}),body=b64(payload),message=head+'.'+body;
 return message+'.'+sign('sha256',Buffer.from(message),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
function req(method,jwt){
 return new Request('https://diario-sync.test/v1/diario',{method,headers:{Origin:ORIGIN,Authorization:'Bearer '+jwt,
 'Content-Type':'application/json'},...(method==='PUT'?{body:JSON.stringify({data:{mt:Date.now()},expected_revision:null})}:{})});
}
const DB={prepare(sql){return {bind(){return this},async first(){return {revision:1,source_mt:100,payload:'{"mt":100}',updated_at:'now'}},
 async run(){return {meta:{changes:1}}}}}};
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
test('v931: GET de JWT ES256 válido usa JWKS local, sem /auth/v1/user',async()=>{
 const old=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error('rede indisponível')};
 try{
  const {default:w}=await worker();
  const r=await w.fetch(req('GET',token()),{...env,DB});
  assert.equal(r.status,200);assert.equal((await r.json()).revision,1);assert.equal(calls,0);
 }finally{global.fetch=old}
});
test('v931: GET com assinatura alterada falha fechado sem tocar na origem',async()=>{
 const old=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error('não usar')};
 try{
  const jwt=token(),parts=jwt.split('.'),fake=parts[0]+'.'+b64({...claims(),sub:'323e4567-e89b-12d3-a456-426614174000'})+'.'+parts[2];
  const {default:w}=await worker();
  assert.equal((await w.fetch(req('GET',fake),{...env,DB})).status,401);assert.equal(calls,0);
 }finally{global.fetch=old}
});
test('v931: PUT com JWT ES256 ainda valida sessão no Supabase Auth',async()=>{
 const old=global.fetch;let calls=0;global.fetch=async(url,options)=>{
  calls++;assert.match(String(url),/\/auth\/v1\/user$/);assert.equal(options.redirect,'manual');
  return Response.json({id:USER});
 };
 try{
  const {default:w}=await worker();
  const r=await w.fetch(req('PUT',token()),{...env,DB});assert.equal(r.status,200);assert.equal(calls,1);
 }finally{global.fetch=old}
});
test('v931: migração legada não sobrescreve documentos D1 mais recentes',()=>{
 const fs=require('node:fs'),s=fs.readFileSync('cloudflare/diario-sync/index.mjs','utf8');
 const migr=s.slice(s.indexOf('async function importarColecao('),s.indexOf('/* v907:'));
 assert.match(migr,/INSERT OR IGNORE INTO private_documents/);
 assert.doesNotMatch(migr,/ON CONFLICT\(owner,collection,doc_key\) DO UPDATE SET payload=/);
});
