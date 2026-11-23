const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const load=()=>import('../cloudflare/diario-sync/index.mjs');
const uidA='11111111-1111-4111-8111-111111111111',uidB='22222222-2222-4222-8222-222222222222';
const ORIGIN='https://meudiariotrade.github.io';
class DB {
 constructor(){this.files=new Map();}
 id(owner,bucket,key){return owner+'|'+bucket+'|'+key;}
 prepare(sql){
  const db=this;let p=[];
  return {
   bind(...values){p=values;return this;},
   async first(){
    if(sql.startsWith('SELECT content_type,size_bytes,status')||sql.startsWith('SELECT size_bytes FROM private_files'))
      return db.files.get(db.id(p[0],p[1],p[2]))||null;
    if(sql.includes('sum(size_bytes)'))return {bytes:[...db.files.values()].filter(x=>x.owner===p[0]&&x.status==='ready').reduce((a,x)=>a+x.size_bytes,0)};
    return null;
   },
   async all(){
    if(sql.includes('GROUP BY status')){const result=[];for(const s of ['pending','ready']){const items=[...db.files.values()].filter(x=>x.owner===p[0]&&x.status===s);if(items.length)result.push({status:s,n:items.length,bytes:items.reduce((a,x)=>a+x.size_bytes,0)})}return {results:result};}
    if(sql.includes('ORDER BY bucket,object_key'))return {results:[...db.files.values()].filter(x=>x.owner===p[0]&&x.status===p[1]).slice(0,p[2]).map(x=>({bucket:x.bucket,object_key:x.object_key,size_bytes:x.size_bytes,content_type:x.content_type}))};
    return {results:[]};
   },
   async run(){
    if(sql.startsWith('INSERT INTO private_files')){
     const [owner,bucket,key,mime,size,source]=p;
     db.files.set(db.id(owner,bucket,key),{owner,bucket,object_key:key,content_type:mime,size_bytes:size,status:'ready',source});
     return {meta:{changes:1}};
    }
    return {meta:{changes:0}};
   }
  };
 }
}
class KV{
 constructor(){this.data=new Map();}
 async put(k,bytes,opts){this.data.set(k,{bytes:bytes.slice(0),metadata:opts.metadata});}
 async get(k){return this.data.get(k)?.bytes||null;}
 async getWithMetadata(k){const found=this.data.get(k);return found?{value:found.bytes.slice(0),metadata:found.metadata}:{value:null,metadata:null};}
}
function environment(){return {DB:new DB(),FILES_KV:new KV(),ALLOWED_ORIGIN:ORIGIN,SUPABASE_URL:'https://projeto.supabase.co',SUPABASE_ANON_KEY:'publishable'};}
const tokenA='a'.repeat(32),tokenB='b'.repeat(32);
const make=(path,method,token,body,headers={})=>new Request('https://diario-sync.test'+path,{
 method,headers:{Origin:ORIGIN,Authorization:'Bearer '+token,...headers},
 ...(body!==undefined?{body}:{})
});
test('v901: arquivos gravados no KV só são lidos pelo dono autenticado',async()=>{
 const original=global.fetch,env=environment();
 global.fetch=async(_url,opts)=>Response.json({id:opts.headers.Authorization.endsWith(tokenA)?uidA:uidB});
 try{
  const {default:worker}=await load();
  const put=await worker.fetch(make('/v1/files/fotos/'+uidA+'/imagem.jpg','PUT',tokenA,new Uint8Array([1,2,3]),{'Content-Type':'image/jpeg'}),env);
  assert.equal(put.status,200);
  const own=await worker.fetch(make('/v1/files/fotos/'+uidA+'/imagem.jpg','GET',tokenA),env);
  assert.equal(own.status,200);assert.deepEqual([...new Uint8Array(await own.arrayBuffer())],[1,2,3]);
  const other=await worker.fetch(make('/v1/files/fotos/'+uidA+'/imagem.jpg','GET',tokenB),env);
  assert.equal(other.status,404);
  const unauth=await worker.fetch(new Request('https://diario-sync.test/v1/files/status'),env);
  assert.equal(unauth.status,401);
 }finally{global.fetch=original;}
});
test('v901: migração usa GET autenticado no Storage antigo, sem apagar o original',async()=>{
 const original=global.fetch,env=environment();
 env.DB.files.set(env.DB.id(uidA,'aulas-figuras','livro/fig-01.png'),
  {owner:uidA,bucket:'aulas-figuras',object_key:'livro/fig-01.png',content_type:'image/png',size_bytes:4,status:'pending',source:'legacy'});
 const urls=[];
 global.fetch=async(url,opts)=>{
  urls.push({url:String(url),method:opts.method||'GET',auth:opts.headers.Authorization});
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:uidA});
  if(String(url).includes('/storage/v1/object/authenticated/'))return new Response(new Uint8Array([137,80,78,71]),{headers:{'Content-Type':'image/png'}});
  throw Error('URL não esperada');
 };
 try{
  const {default:worker}=await load();
  const r=await worker.fetch(make('/v1/files/import','POST',tokenA,JSON.stringify({bucket:'aulas-figuras',key:'livro/fig-01.png'}),{'Content-Type':'application/json'}),env);
  assert.equal(r.status,200);
  assert.equal((await r.json()).migrated,true);
  assert.ok(urls.some(x=>x.url.includes('/storage/v1/object/authenticated/aulas-figuras/livro/fig-01.png')&&x.method==='GET'));
  assert.ok(urls.every(x=>x.method==='GET'));
  const items=await worker.fetch(make('/v1/files/manifest?status=pending','GET',tokenA),env);
  assert.equal((await items.json()).items.length,0);
 }finally{global.fetch=original;}
});
test('v901: outro usuário não pode importar foto catalogada para o dono',async()=>{
 const original=global.fetch,env=environment();
 env.DB.files.set(env.DB.id(uidA,'fotos','x.jpg'),{owner:uidA,bucket:'fotos',object_key:'x.jpg',content_type:'image/jpeg',size_bytes:3,status:'pending'});
 global.fetch=async()=>Response.json({id:uidB});
 try{
  const {default:worker}=await load();
  const r=await worker.fetch(make('/v1/files/import','POST',tokenB,JSON.stringify({bucket:'fotos',key:'x.jpg'}),{'Content-Type':'application/json'}),env);
  assert.equal(r.status,404);
  assert.equal(env.FILES_KV.data.size,0);
 }finally{global.fetch=original;}
});
test('v901: origem externa e upload grande são rejeitados',async()=>{
 const {default:worker}=await load(),env=environment();
 const forbidden=await worker.fetch(new Request('https://diario-sync.test/v1/files/status',{headers:{Origin:'https://fora.example'}}),env);
 assert.equal(forbidden.status,403);
 const original=global.fetch;global.fetch=async()=>Response.json({id:uidA});
 try{
  const p=make('/v1/files/fotos/a.jpg','PUT',tokenA,new Uint8Array([1]),{'Content-Type':'image/jpeg','Content-Length':String(9*1024*1024)});
  assert.equal((await worker.fetch(p,env)).status,413);
 }finally{global.fetch=original;}
});
test('v901: fotos do Diário não são gravadas em Supabase Storage e EstudosLocal conserva backup',()=>{
 const core=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 const a=core.slice(core.indexOf('async function photos()'),core.indexOf('async function up('));
 assert.doesNotMatch(a,/\/storage\/v1\/|\/rest\/v1\/|await rq\(/);
 assert.match(a,/api\.put\('fotos'/);assert.match(a,/api\.get\('fotos'/);
 const studies=fs.readFileSync('src/studies/armazenamento-local.js','utf8');
 assert.match(studies,/window\.EstudosLocal/);assert.match(studies,/async function exportar\(/);
 const sw=fs.readFileSync('src/service-worker.js','utf8');
 assert.match(sw,/diario-arquivos-privados-v901\.js/);
});
