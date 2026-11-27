'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const mod=()=>import('../cloudflare/diario-radar/segredos-v1041.mjs');
function d1(){const rows=new Map();return {rows,prepare(sql){return {_a:[],bind(...a){this._a=a;return this},
 async run(){if(/INSERT INTO cf_segredos_v1041/.test(sql)){const [nome,valor,origem,em]=this._a;rows.set(nome,{nome,valor,origem,em});}return {}},
 async all(){return {results:[...rows.values()].map(r=>({nome:r.nome,em:r.em}))}},
 async first(){return rows.get(this._a[0])||null}}}}}
const env=db=>({HISTORICO:db,SUPABASE_URL:'https://abc123.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'x'.repeat(40)});
test('copia só as 4 chaves autorizadas, uma única vez',async()=>{
 const {copiarSegredosV1041,segredoV1041}=await mod();const db=d1();let n=0;
 const f=async(url,init)=>{n++;assert.match(url,/\/rest\/v1\/rpc\/segredos_cloudflare_v1041$/);assert.equal(init.method,'POST');
  return Response.json([{nome:'diario_vapid_public',valor:'pub'},{nome:'diario_vapid_private',valor:'priv'},{nome:'diario_vapid_subject',valor:'mailto:a@b.c'},{nome:'diario_resend_api_key',valor:'re_x'},{nome:'OUTRA',valor:'nao'}]);};
 const r=await copiarSegredosV1041(env(db),f);assert.equal(r.copiou,4);assert.equal(r.motivo,'completo');assert.equal(db.rows.has('OUTRA'),false);
 const r2=await copiarSegredosV1041(env(db),f);assert.equal(r2.copiou,0);assert.equal(n,1);
 assert.equal(await segredoV1041(env(db),'diario_vapid_private'),'priv');
 await assert.rejects(()=>segredoV1041(env(db),'GEMINI_API_KEY'));
});
test('status nunca devolve valores',async()=>{
 const {copiarSegredosV1041,statusSegredosV1041}=await mod();const db=d1();
 await copiarSegredosV1041(env(db),async()=>Response.json([{nome:'diario_resend_api_key',valor:'re_segredo'}]));
 const t=await (await statusSegredosV1041(env(db))).text();
 assert.doesNotMatch(t,/re_segredo/);assert.match(t,/diario_resend_api_key/);assert.match(t,/diario_vapid_public/);
});
test('sem credencial de serviço não chama a rede',async()=>{
 const {copiarSegredosV1041}=await mod();let n=0;
 const r=await copiarSegredosV1041({HISTORICO:d1(),SUPABASE_URL:'https://evil.example',SUPABASE_SERVICE_ROLE_KEY:'x'.repeat(40)},async()=>{n++});
 assert.equal(n,0);assert.equal(r.copiou,0);
});
