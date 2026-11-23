const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
const mirror=fs.readFileSync('src/shared/diario-d1-espelho.js','utf8');
class DB{
 constructor(){this.rows=new Map()}
 prepare(sql){const db=this;let p;return {
  bind(...params){p=params;return this},
  async first(){const r=db.rows.get(p[0]);if(!r)return null;return sql.includes('payload')?r:{revision:r.revision,source_mt:r.source_mt}},
  async run(){
   if(sql.startsWith('INSERT')){if(db.rows.has(p[0]))return {meta:{changes:0}};db.rows.set(p[0],{revision:1,source_mt:p[1],payload:p[2],updated_at:'2026-11-23'});return {meta:{changes:1}}}
   if(sql.startsWith('UPDATE')){const [payload,mt,uid,rev,ts]=p;const r=db.rows.get(uid);if(!r||r.revision!==rev||r.source_mt>ts)return {meta:{changes:0}};db.rows.set(uid,{revision:rev+1,source_mt:mt,payload,updated_at:'2026-11-23'});return {meta:{changes:1}}}
   throw Error('SQL inesperado');
  }
 }}
}
const uidA='11111111-1111-4111-8111-111111111111',uidB='22222222-2222-4222-8222-222222222222';
function request(method,token,body){return new Request('https://diario-sync.test/v1/diario',{method,headers:{Origin:'https://meudiariotrade.github.io',Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})}
test('D1: autenticação Supabase mantém cada diário privado e sem service role',async()=>{
 const original=global.fetch;const db=new DB();const env={DB:db,ALLOWED_ORIGIN:'https://meudiariotrade.github.io',SUPABASE_URL:'https://projeto.supabase.co',SUPABASE_ANON_KEY:'public'};
 global.fetch=async(_url,opt)=>Response.json({id:opt.headers.Authorization.includes('a'.repeat(32))?uidA:uidB});
 try{
  const {default:w}=await worker();
  assert.equal((await w.fetch(new Request('https://diario-sync.test/v1/diario'),env)).status,401);
  const d={expected_revision:null,data:{mt:100,trades:[{id:'p1'}],cart:{lanc:[{ativo:'PETR4'}]}}};
  const r=await w.fetch(request('PUT','a'.repeat(32),d),env);
  assert.equal(r.status,200);assert.equal((await r.json()).revision,1);
  assert.equal((await (await w.fetch(request('GET','b'.repeat(32)),env)).json()).exists,false);
  assert.equal((await (await w.fetch(request('GET','a'.repeat(32)),env)).json()).data.cart.lanc[0].ativo,'PETR4');
  assert.equal((await w.fetch(request('PUT','a'.repeat(32),{expected_revision:1,data:{mt:101,trades:[]}}),env)).status,200);
  assert.equal((await w.fetch(request('PUT','a'.repeat(32),{expected_revision:2,data:{mt:100,trades:[]}}),env)).status,409);
  assert.equal((await w.fetch(request('PUT','a'.repeat(32),{expected_revision:1,data:{mt:110,trades:[]}}),env)).status,409);
 }finally{global.fetch=original;}
});
test('D1: bloqueia origem diferente e método destrutivo',async()=>{
 const {default:w}=await worker();const env={ALLOWED_ORIGIN:'https://meudiariotrade.github.io',DB:new DB()};
 assert.equal((await w.fetch(new Request('https://diario-sync.test/v1/diario',{headers:{Origin:'https://evil.test'}}),env)).status,403);
 assert.equal((await w.fetch(new Request('https://diario-sync.test/v1/diario',{method:'DELETE'}),env)).status,404);
});
test('espelho: não reescreve interface nem altera fonte principal',()=>{
 const core=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 assert.equal((core.match(/DiarioReplicaD1\?\.save/g)||[]).length,2);
 assert.match(mirror,/credentials:'omit'/);
 assert.match(mirror,/state\.last>=mt/);
 assert.doesNotMatch(mirror,/githubusercontent|service_role|localStorage/);
});