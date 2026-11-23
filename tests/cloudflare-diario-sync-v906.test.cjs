const test=require('node:test');
const assert=require('node:assert/strict');
const worker=()=>import('../cloudflare/diario-sync/index.mjs');
const uid='11111111-1111-4111-8111-111111111111';
const origin='https://meudiariotrade.github.io';
const token='a'.repeat(32);
const envBase={ALLOWED_ORIGIN:origin,SUPABASE_URL:'https://sample.supabase.co',SUPABASE_ANON_KEY:'public'};
function request(path,method='GET',payload){
  return new Request('https://diario-sync.test'+path,{
    method,headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},
    ...(payload?{body:JSON.stringify(payload)}:{})
  });
}
test('v906: migração em lote exige autenticação e valida no máximo 4 arquivos',async()=>{
  const {default:w}=await worker();
  const env={...envBase,DB:{},FILES_KV:{}};
  const unauth=await w.fetch(new Request('https://diario-sync.test/v1/files/import-batch',{method:'POST'}),env);
  assert.equal(unauth.status,401);
  const fetchOriginal=global.fetch;
  global.fetch=async()=>Response.json({id:uid});
  try{
    assert.equal((await w.fetch(request('/v1/files/import-batch','POST',{items:[]}),env)).status,400);
    assert.equal((await w.fetch(request('/v1/files/import-batch','POST',{items:Array.from({length:5},()=>({bucket:'fotos',key:uid+'/a.jpg'}))}),env)).status,400);
  }finally{global.fetch=fetchOriginal}
});
test('v906: lote copia e confirma arquivo no KV antes de marcar como pronto',async()=>{
  const {default:w}=await worker();
  const data=new Uint8Array([1,2,3,4,5,6]),state={ready:false},objects=new Map();
  const DB={prepare(sql){
    let args=[];
    return {
      bind(...p){args=p;return this},
      async first(){return {content_type:'image/jpeg',size_bytes:data.byteLength,status:'pending'}},
      async run(){if(sql.includes("INSERT INTO private_files"))state.ready=true;return {meta:{changes:1}}}
    };
  }};
  const FILES_KV={
    async get(){return null},
    async put(key,value,options){objects.set(key,{value:value.slice(0),metadata:options.metadata})},
    async getWithMetadata(key){return objects.has(key)?objects.get(key):{value:null,metadata:null}}
  };
  const original=global.fetch;global.fetch=async(url)=>String(url).includes('/auth/v1/user')
    ? Response.json({id:uid})
    : new Response(data,{status:200,headers:{'Content-Type':'image/jpeg'}});
  try{
    const response=await w.fetch(request('/v1/files/import-batch','POST',{items:[{bucket:'fotos',key:uid+'/imagem.jpg'}]}),
      {...envBase,DB,FILES_KV});
    const result=await response.json();
    assert.equal(response.status,200);
    assert.equal(result.results.length,1);
    assert.equal(result.results[0].ok,true);
    assert.equal(result.results[0].size_bytes,data.byteLength);
    assert.equal(state.ready,true);
    assert.equal(objects.size,1);
    assert.match([...objects.values()][0].metadata.sha256,/^[a-f0-9]{64}$/);
  }finally{global.fetch=original}
});
test('v906: backup D1 só acessa documentos do usuário autenticado',async()=>{
 const {default:w}=await worker();
 const rows=new Map();
 const DB={prepare(sql){
   let args=[];
   return {
     bind(...p){args=p;return this},
     async run(){if(sql.includes('INSERT OR IGNORE'))rows.set(args[1],{payload:args[2]});return {meta:{changes:1}}},
     async first(){return rows.get(args[1])||null},
     async all(){return {results:[...rows.values()]}}
   };
 }};
 const original=global.fetch;global.fetch=async()=>Response.json({id:uid});
 try{
   const env={...envBase,DB};
   const dia='2026-11-23';
   const saved=await w.fetch(request('/v1/backups/'+dia,'PUT',{data:{mt:1700000000000,trades:[{id:'1'}]}}),env);
   assert.equal(saved.status,200);
   const list=await (await w.fetch(request('/v1/backups'),env)).json();
   assert.equal(list.items.length,1);
   assert.equal(list.items[0].dia,dia);
   const data=await (await w.fetch(request('/v1/backups/'+dia),env)).json();
   assert.equal(data.data.trades[0].id,'1');
   assert.equal((await w.fetch(request('/v1/backups/invalid'),env)).status,400);
 }finally{global.fetch=original}
});
