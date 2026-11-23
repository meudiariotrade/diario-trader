const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const origin='https://meudiariotrade.github.io';
class DB{
 constructor(){this.docs=new Map();this.progress=new Map();}
 k(owner,collection,key){return owner+'|'+collection+'|'+key;}
 prepare(sql){
  const db=this;let p=[];
  return {
   bind(...x){p=x;return this;},
   async first(){
    if(sql.includes('SELECT next_offset,finished FROM private_migration_progress'))return db.progress.get(db.k(p[0],p[1],''))||null;
    if(sql.startsWith('SELECT count(*) AS n FROM private_documents'))return {n:[...db.docs.values()].filter(x=>x.owner===p[0]&&x.collection===p[1]).length};
    return null;
   },
   async all(){
    if(sql.startsWith('SELECT collection,count_rows,next_offset,finished FROM private_migration_progress'))return {results:[...db.progress.entries()].filter(([key])=>key.startsWith(p[0]+'|')).map(([,val])=>val)};
    return {results:[]};
   },
   async run(){
    if(sql.startsWith('INSERT OR IGNORE INTO private_documents')){
     if(db.docs.has(db.k(p[0],p[1],p[2])))return {meta:{changes:0}};
     db.docs.set(db.k(p[0],p[1],p[2]),{owner:p[0],collection:p[1],key:p[2],payload:p[3]});return {meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO private_migration_progress')){
     const key=db.k(p[0],p[1],''),prev=db.progress.get(key);
     if(!prev||prev.next_offset===p[5])db.progress.set(key,{collection:p[1],count_rows:p[2],next_offset:p[3],finished:p[4]});
     return {meta:{changes:1}};
    }
    throw Error('SQL desconhecido');
   }
  };
 }
 async batch(statements){for(const s of statements)await s.run();return [];}
}
const env=()=>({DB:new DB(),SUPABASE_URL:'https://teste.supabase.co',SUPABASE_ANON_KEY:'publishable',ALLOWED_ORIGIN:origin});
const request=(path,method,token,body)=>new Request('https://diario-sync.test'+path,{method,headers:{Origin:origin,Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('v902: copia aula apenas do UID autenticado e mantém progresso retomável',async()=>{
 const original=global.fetch,db=env(),urls=[],token='a'.repeat(32);
 global.fetch=async(url,opts)=>{
  urls.push(String(url));
  if(String(url).includes('/auth/v1/user'))return Response.json({id:a});
  if(String(url).includes('/rest/v1/aulas'))return Response.json([{user_id:a,id:'11111111-0000-4000-8000-000000000001',titulo:'Aula 1'},{user_id:a,id:'11111111-0000-4000-8000-000000000002',titulo:'Aula 2'}]);
  throw Error('Endpoint externo inesperado');
 };
 try{
  const {default:w}=await worker();
  const result=await w.fetch(request('/v1/migrate/step','POST',token,{collection:'aulas'}),db);
  assert.equal(result.status,200);
  const j=await result.json();
  assert.equal(j.finished,true);assert.equal(j.count,2);assert.equal(db.DB.docs.size,2);
  const u=new URL(urls.find(x=>x.includes('/rest/v1/aulas')));
  assert.equal(u.searchParams.get('user_id'),'eq.'+a);
  assert.equal(u.searchParams.get('limit'),'10');
  const s=await w.fetch(request('/v1/migrate/status','GET',token),db);
  const data=await s.json();assert.equal(data.collections.find(x=>x.name==='aulas').finished,true);
 }finally{global.fetch=original;}
});
test('v902: recusa dados que não pertençam à sessão',async()=>{
 const original=global.fetch,environment=env(),token='a'.repeat(32);
 global.fetch=async(url)=>String(url).includes('/auth/v1/user')?Response.json({id:a}):Response.json([{id:'11111111-0000-4000-8000-000000000001',user_id:b}]);
 try{
  const {default:w}=await worker();const r=await w.fetch(request('/v1/migrate/step','POST',token,{collection:'aulas'}),environment);
  assert.equal(r.status,403);assert.equal(environment.DB.docs.size,0);
 }finally{global.fetch=original;}
});
test('v902: bloqueia tabelas de logs, Analytics, tokens de teste e nomes arbitrários',async()=>{
 const config=fs.readFileSync('cloudflare/diario-sync/colecoes-v902.mjs','utf8');
 for(const n of ['erros_app','push_log','automacao_log','analise_uso','aulas_teste'])assert.doesNotMatch(config,new RegExp('"'+n+'"\\s*:'));
 const original=global.fetch;global.fetch=async()=>Response.json({id:a});
 try{
  const {default:w}=await worker(),db=env();
  const r=await w.fetch(request('/v1/migrate/step','POST','a'.repeat(32),{collection:'erros_app'}),db);
  assert.equal(r.status,400);assert.equal(db.DB.docs.size,0);
 }finally{global.fetch=original;}
});
test('v902: cliente sem polling e sem Supabase como destino das cópias',()=>{
 const s=fs.readFileSync('src/shared/diario-migracao-v902.js','utf8');
 assert.doesNotMatch(s,/setInterval|supabase\.co|service_role|githubusercontent/);
 assert.match(s,/attempted\.add\(uid\)/);
 assert.match(s,/credentials:'omit'/);
});
