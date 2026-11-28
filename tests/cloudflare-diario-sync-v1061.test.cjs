const test=require('node:test');
const assert=require('node:assert/strict');
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
const uid='11111111-1111-4111-8111-111111111111',outro='22222222-2222-4222-8222-222222222222';
const origin='https://meudiariotrade.github.io',token='a'.repeat(32);
const envBase={ALLOWED_ORIGIN:origin,SUPABASE_URL:'https://sample.supabase.co',SUPABASE_ANON_KEY:'public'};
const pedido=(body)=>new Request('https://diario-sync.test/v1/conta/excluir',{method:'POST',
 headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
function ambiente(){
 const kv=new Map([[uid+':fotos:'+uid+'/a.jpg',1],[uid+':livros:'+uid+'/b.pdf',1],[outro+':fotos:'+outro+'/c.jpg',1]]);
 const sqls=[];
 const DB={prepare(sql){let args=[];return {bind(...p){args=p;return this},async run(){sqls.push({sql,args});return {meta:{changes:1}}},async first(){return null},async all(){return {results:[]}}}}};
 const FILES_KV={async list({prefix}){return {keys:[...kv.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),list_complete:true}},async delete(k){kv.delete(k)}};
 return {kv,sqls,env:{...envBase,DB,FILES_KV}};
}
function supabase(senhaCerta='certa'){
 return async(url,init)=>{
  const u=String(url);
  if(u.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'pessoa@exemplo.test'});
  if(u.includes('/auth/v1/token')){const b=JSON.parse(init.body);return b.password===senhaCerta?Response.json({user:{id:uid}}):new Response('{}',{status:400})}
  return new Response('{}',{status:404});
 };
}
test('v1061: exclusão na Cloudflare exige EXCLUIR e a senha correta',async()=>{
 const {default:w}=await worker();const a=ambiente();const orig=global.fetch;global.fetch=supabase();
 try{
  assert.equal((await w.fetch(pedido({senha:'certa'}),a.env)).status,400);
  assert.equal((await w.fetch(pedido({senha:'errada',confirma:'EXCLUIR'}),a.env)).status,403);
  assert.equal(a.kv.size,3,'nada apagado antes da confirmação');assert.equal(a.sqls.length,0);
 }finally{global.fetch=orig}
});
test('v1061: apaga só o que é do usuário (KV por prefixo e D1 com WHERE do próprio UID)',async()=>{
 const {default:w}=await worker();const a=ambiente();const orig=global.fetch;global.fetch=supabase();
 try{
  const r=await w.fetch(pedido({senha:'certa',confirma:'EXCLUIR'}),a.env);const j=await r.json();
  assert.equal(r.status,200);assert.equal(j.ok,true);assert.equal(j.apagado.kv,2);
  assert.deepEqual([...a.kv.keys()],[outro+':fotos:'+outro+'/c.jpg'],'arquivo de outra pessoa preservado');
  assert.ok(a.sqls.length>=6);
  for(const {sql,args} of a.sqls){assert.match(sql,/^DELETE FROM [a-z_]+ WHERE (owner|user_id)=\?$/);assert.deepEqual(args,[uid])}
 }finally{global.fetch=orig}
});
test('v1061: sem login a rota responde 401',async()=>{
 const {default:w}=await worker();const a=ambiente();
 const r=await w.fetch(new Request('https://diario-sync.test/v1/conta/excluir',{method:'POST',headers:{Origin:origin}}),a.env);
 assert.equal(r.status,401);
});
