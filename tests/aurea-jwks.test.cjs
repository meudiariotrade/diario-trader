'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {generateKeyPairSync, sign} = require('node:crypto');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const ORIGIN = 'https://valid-project.supabase.co';
const ENV = {SUPABASE_URL: ORIGIN};
const UID = '123e4567-e89b-12d3-a456-426614174000';
const {privateKey, publicKey} = generateKeyPairSync('ec', { namedCurve:'prime256v1' });
const jwk = { ...publicKey.export({format:'jwk'}), alg:'ES256', kid:'test-kid-2026', use:'sig'};
const enc = x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
const claims = () => ({iss:ORIGIN+'/auth/v1',aud:'authenticated',role:'authenticated',sub:UID,exp:Math.floor(Date.now()/1000)+1000,iat:Math.floor(Date.now()/1000)});
function jwt(payload=claims(),header={typ:'JWT',alg:'ES256',kid:jwk.kid}) {
 const content=enc(header)+'.'+enc(payload);
 return content+'.'+sign('sha256',Buffer.from(content),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
const req = token => new Request('https://worker.workers.dev/v1/aurea-resumao', {headers:{Authorization:'Bearer '+token}});
async function fresh() {
 const p=pathToFileURL(path.join(__dirname,'..','cloudflare','diario-screeners','auth-jwks-v924.mjs')).href;
 return (await import(p+'?test='+Math.random().toString(36).slice(2))).autenticarUsuario;
}
const realFetch=globalThis.fetch;
const fake=()=>{let calls=[];globalThis.fetch=async(url)=>{calls.push(String(url));return Response.json({keys:[jwk]})};return calls};
test.after(()=>{globalThis.fetch=realFetch});
test('ES256 válido e cache de chaves públicas, sem chamada /user',async()=>{
 const f=await fresh(),calls=fake(),token=jwt();
 assert.equal(await f(ENV,req(token)),UID);
 assert.equal(await f(ENV,req(token)),UID);
 assert.equal(calls.length,1);
 assert.match(calls[0],/\/auth\/v1\/\.well-known\/jwks\.json$/);
});
test('Assinatura adulterada é negada sem consulta privada',async()=>{
 const f=await fresh(),calls=fake(),v=jwt();
 const parts=v.split('.');const tampered=parts[0]+'.'+enc({...claims(),sub:'223e4567-e89b-12d3-a456-426614174000'})+'.'+parts[2];
 assert.equal(await f(ENV,req(tampered)),null);
 assert.equal(calls.length,1);
});
test('JWT expirado, origem errada e alg=none são negados antes da rede',async()=>{
 const f=await fresh(),calls=fake();
 assert.equal(await f(ENV,req(jwt({...claims(),exp:Math.floor(Date.now()/1000)-1}))),null);
 assert.equal(await f(ENV,req(jwt({...claims(),iss:'https://evil.invalid/auth/v1'}))),null);
 const unsigned=enc({alg:'none',kid:jwk.kid})+'.'+enc(claims())+'.'+enc('0'.repeat(64));
 assert.equal(await f(ENV,req(unsigned)),null);
 assert.equal(calls.length,0);
});
test('Chave pública carregada no Worker valida ES256 offline, sem tocar na rede',async()=>{
 const f=await fresh(),before=globalThis.fetch;
 let network=0;globalThis.fetch=async()=>{network++;throw Error('rede indisponível')};
 try{
  const localEnv={...ENV,SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]})};
  assert.equal(await f(localEnv,req(jwt())),UID);
  assert.equal(network,0);
 }finally{globalThis.fetch=before}
});
test('Chave desconhecida não autoriza usuário',async()=>{
 const f=await fresh(),calls=fake();
 assert.equal(await f(ENV,req(jwt(claims(),{alg:'ES256',kid:'wrong-kid'}))),null);
 assert.equal(calls.length,2);
});
test('JWKS indisponível falha fechado, não libera IA',async()=>{
 const f=await fresh();globalThis.fetch=async()=>{throw Error('sem rede')};
 await assert.rejects(()=>f(ENV,req(jwt())),/sem rede/);
});
