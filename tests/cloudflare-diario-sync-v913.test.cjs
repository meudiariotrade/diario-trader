const test=require('node:test');
const assert=require('node:assert/strict');
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
const USER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const ORIGIN='https://meudiariotrade.github.io';
const ENV={ALLOWED_ORIGIN:ORIGIN,SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'};
function request(path,method='GET',payload){
  return new Request('https://diario-sync.test'+path,{
    method,headers:{Origin:ORIGIN,Authorization:'Bearer '+'a'.repeat(36),'Content-Type':'application/json'},
    ...(payload?{body:JSON.stringify(payload)}:{})
  });
}
function memoryDB(seed=[]){
  const calls=[],stored=[...seed];
  return {
    calls,stored,
    prepare(sql){
      const r={sql,args:[],
        bind(...params){this.args=params;calls.push({sql,args:params});return this},
        async all(){
          if(sql.startsWith('SELECT payload FROM private_documents')){
            return {results:stored.filter(x=>x.owner===this.args[0]&&x.collection===this.args[1])
              .map(x=>({payload:x.payload}))}
          }
          return {results:[]};
        },
        async first(){return null},
        async run(){return {meta:{changes:1}}}
      };
      return r;
    },
    async batch(statements){
      for(const x of statements){
        if(x.sql.startsWith('INSERT INTO private_documents')){
          stored.push({owner:x.args[0],collection:x.args[1],doc_key:x.args[2],payload:x.args[3]});
        }
      }
      return statements.map(()=>({meta:{changes:1}}));
    }
  };
}
async function authenticated(fn){
 const prior=global.fetch;
 global.fetch=async()=>Response.json({id:USER});
 try{return await fn()}finally{global.fetch=prior}
}
test('v913: rota D1 só lê os registros do proprietário autenticado e projeta colunas',async()=>{
 await authenticated(async()=>{
   const db=memoryDB([
     {owner:USER,collection:'carteira_cfg',payload:JSON.stringify({user_id:USER,cfg:{on:true},atualizado:'2026-11-23'})},
     {owner:OTHER,collection:'carteira_cfg',payload:JSON.stringify({user_id:OTHER,cfg:{on:false},atualizado:'2020-01-01'})}
   ]);
   const {default:w}=await worker();
   const r=await w.fetch(request('/v1/records/carteira_cfg?select=cfg,atualizado&limit=10'),{...ENV,DB:db});
   assert.equal(r.status,200);
   const items=await r.json();
   assert.equal(items.length,1);
   assert.equal(items[0].cfg.on,true);
   assert.equal('user_id' in items[0],false);
   assert.equal(db.calls[0].args[0],USER);
   assert.match(db.calls[0].sql,/WHERE owner=\? AND collection=\?/);
 });
});
test('v913: bloqueia leitura de coleções não migradas e acesso cruzado',async()=>{
 await authenticated(async()=>{
   const {default:w}=await worker();
   const env={...ENV,DB:memoryDB()};
   assert.equal((await w.fetch(request('/v1/records/cotacoes'),env)).status,404);
   assert.equal((await w.fetch(request('/v1/records/carteira_cfg?user_id=eq.'+OTHER),env)).status,400);
   assert.equal((await w.fetch(request('/v1/records/carteira_cfg?order=anything.foo'),env)).status,400);
 });
});
test('v913: só aceita gravações privadas com proprietário correto e impede deleção sem filtro',async()=>{
 await authenticated(async()=>{
   const {default:w}=await worker(),db=memoryDB(),env={...ENV,DB:db};
   const bad=await w.fetch(request('/v1/records/carteira_cfg','POST',{user_id:OTHER,cfg:{on:true}}),env);
   assert.equal(bad.status,403);
   const ok=await w.fetch(request('/v1/records/carteira_cfg?on_conflict=user_id','POST',{cfg:{on:true}}),env);
   assert.equal(ok.status,201);
   assert.equal(db.stored.length,1);
   assert.equal(JSON.parse(db.stored[0].payload).user_id,USER);
   assert.equal((await w.fetch(request('/v1/records/carteira_cfg','DELETE'),env)).status,400);
   assert.equal((await w.fetch(request('/v1/records/carteira_cfg','PATCH',{cfg:{on:false}}),env)).status,400);
 });
});
test('v913: exige login e nunca consulta banco Supabase antes de autenticar',async()=>{
 const {default:w}=await worker();
 let q=0;
 const db={prepare(){q++;throw Error('no db without auth')}};
 const r=await w.fetch(new Request('https://diario-sync.test/v1/records/carteira_cfg',{headers:{Origin:ORIGIN}}),{...ENV,DB:db});
 assert.equal(r.status,401);
 assert.equal(q,0);
});
test('v913: fontes do app não enviam dados privados ao Supabase ao usar D1',()=>{
 const fs=require('node:fs');
 const core=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 const client=fs.readFileSync('src/shared/diario-registros-v913.js','utf8');
 assert.match(core,/DiarioD1Registros\.request\(e,t,SESS\.at\)/);
 assert.match(client,/credentials:'omit'/);
 assert.ok(client.includes('https://diario-sync.lucianosilva43567.workers.dev/v1/records/'));
});
