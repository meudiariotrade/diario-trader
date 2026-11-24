'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
const UID='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const ORIGIN='https://meudiariotrade.github.io';
const ENV={ALLOWED_ORIGIN:ORIGIN,SUPABASE_URL:'https://demo.supabase.co',SUPABASE_ANON_KEY:'publishable'};
const request=(payload,method='POST',auth=true)=>new Request('https://diario-sync.test/v1/migrate/reconcile',{
 method,headers:{Origin:ORIGIN,...(auth?{Authorization:'Bearer '+'a'.repeat(36)}:{}),'Content-Type':'application/json'},
 ...(method==='POST'?{body:JSON.stringify(payload)}:{})
});
const db=()=>({
 inserts:[],progress:[],
 prepare(sql){
  const self=this;let args=[];
  return{
   sql,get args(){return args},
   bind(...items){args=items;return this},
   async first(){return {n:self.inserts.length}},
   async run(){self.progress.push({sql,args});return {meta:{changes:1}}}
  };
 },
 async batch(statements){
  for(const s of statements)this.inserts.push(s);
  return statements.map(()=>({meta:{changes:1}}));
 }
});
test('v942: sem login, espelho não consulta dados legados',async()=>{
 const {default:w}=await worker(),DB=db();
 const res=await w.fetch(request({collection:'push_subs',offset:0},'POST',false),{...ENV,DB});
 assert.equal(res.status,401);
 assert.equal(DB.inserts.length,0);
});
test('v942: coleções e paginação fora da lista são bloqueadas sem consulta privada',async()=>{
 const {default:w}=await worker(),DB=db(),original=global.fetch;
 let calls=0;
 global.fetch=async url=>{
  calls++;
  assert.match(String(url),/\/auth\/v1\/user$/);
  return Response.json({id:UID});
 };
 try{
  for(const payload of [
   {collection:'carteira_cfg',offset:0},
   {collection:'push_subs',offset:-1},
   {collection:'push_subs',offset:5001},
   {collection:'push_subs',offset:'0'}
  ])assert.equal((await w.fetch(request(payload),{...ENV,DB})).status,400);
  assert.equal(DB.inserts.length,0);
  assert.equal(calls,4);
 }finally{global.fetch=original}
});
test('v942: espelho JWT importa novas inscrições somente do próprio usuário',async()=>{
 const {default:w}=await worker(),DB=db(),original=global.fetch;
 const rows=[{id:'sub-1',user_id:UID,sub:{endpoint:'https://push.test/1'}},
  {id:'sub-2',user_id:UID,sub:{endpoint:'https://push.test/2'}}];
 let dataCalls=0;
 global.fetch=async(url,opts)=>{
  assert.equal(opts.redirect,'manual');
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:UID});
  dataCalls++;
  const u=new URL(String(url));
  assert.equal(u.pathname,'/rest/v1/push_subs');
  assert.equal(u.searchParams.get('user_id'),'eq.'+UID);
  assert.equal(u.searchParams.get('limit'),'20');
  assert.equal(u.searchParams.get('offset'),'0');
  return Response.json(rows);
 };
 try{
  const res=await w.fetch(request({collection:'push_subs',offset:0}),{...ENV,DB});
  const body=await res.json();
  assert.equal(res.status,200);
  assert.deepEqual({rows:body.rows,stored:body.stored,finished:body.finished}, {rows:2,stored:2,finished:true});
  assert.equal(body.destino,'espelho_sem_cutover');
  assert.equal(dataCalls,1);
  assert.equal(DB.inserts.length,2);
  assert.ok(DB.inserts.every(x=>x.sql.includes('ON CONFLICT(owner,collection,doc_key) DO UPDATE')));
  assert.ok(DB.inserts.every(x=>x.args[0]===UID&&x.args[1]==='push_subs'));
 }finally{global.fetch=original}
});
test('v942: resposta com owner divergente falha antes de gravar no D1',async()=>{
 const {default:w}=await worker(),DB=db(),original=global.fetch;
 global.fetch=async url=>String(url).endsWith('/auth/v1/user')?
  Response.json({id:UID}):Response.json([{id:'sub-x',user_id:OTHER}]);
 try{
  const res=await w.fetch(request({collection:'push_subs',offset:0}),{...ENV,DB});
  assert.equal(res.status,403);
  assert.equal(DB.inserts.length,0);
 }finally{global.fetch=original}
});
test('v942: cliente reconcilia somente uma vez a cada dia, sem polling e sem segredos',()=>{
 const src=fs.readFileSync('src/shared/diario-migracao-v902.js','utf8');
 const worker=fs.readFileSync('cloudflare/diario-sync/index.mjs','utf8');
 assert.match(src,/ESPELHOS_V942=\['push_subs','noticias_urgentes_notificadas'\]/);
 assert.match(src,/ESPELHO_TTL_V942=24\*60\*60\*1000/);
 assert.match(src,/after\?\.collections\?\.every\(x=>x.finished\)/);
 assert.doesNotMatch(src,/setInterval|setTimeout|service_role|edge_logs|postgres_logs/);
 assert.match(worker,/RECONCILE_MIRRORS_V942=new Set\(\['push_subs','noticias_urgentes_notificadas'\]\)/);
 const legacy=worker.slice(worker.indexOf('async function importarColecao('),worker.indexOf('/* v907:'));
 assert.match(legacy,/INSERT OR IGNORE INTO private_documents/);
 assert.doesNotMatch(legacy,/ON CONFLICT\(owner,collection,doc_key\) DO UPDATE SET payload=/);
});

test('v942: leitura de push_subs exige proprietário autenticado e preserva escrita legada',()=>{
 const policy=fs.readFileSync('supabase/migrations/20261124010000_push_subs_leitura_propria_v942.sql','utf8');
 assert.match(policy,/GRANT SELECT \(id, user_id, sub, prefs, criado\)/);
 assert.match(policy,/TO authenticated/);
 assert.match(policy,/FOR SELECT TO authenticated/);
 assert.match(policy,/USING \(\(SELECT auth\.uid\(\)\) = user_id\)/);
 assert.doesNotMatch(policy,/\bREVOKE\b|\bTRUNCATE\b|\bDROP\b|\bDELETE\s+FROM\b|\bTO anon\b/i);
});
