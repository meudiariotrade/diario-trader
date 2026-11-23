const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/shared/diario-d1-principal-v903.js','utf8');
const uid='11111111-1111-4111-8111-111111111111',token='a'.repeat(32);
function scenario(reply,conflict=false){
 const calls=[],window={};
 const fetch=async(url,options={})=>{
  calls.push({url:String(url),method:options.method||'GET',hasAuth:options.headers?.Authorization==='Bearer '+token,credentials:options.credentials});
  assert.match(String(url),/^https:\/\/diario-sync\./);
  if(options.method==='PUT'&&conflict)return Response.json({saved:false,revision:reply.revision},{status:409});
  if(options.method==='PUT')return Response.json({saved:true,revision:reply.revision+1});
  return Response.json(reply);
 };
 vm.runInNewContext(src,{window,fetch,AbortSignal,Response,Headers,Map,Set,Promise,Error,Number});
 return {api:window.DiarioD1Principal,calls,reply};
}
test('v903: só corta Supabase quando D1 contém dados pelo menos tão recentes',async()=>{
 const value={exists:true,revision:105,source_mt:100,data:{mt:100,trades:[]}};
 const x=scenario(value);
 const getOld=async()=>[{data:{mt:200,trades:[]}}];
 assert.equal(await x.api.prepare(uid,token,getOld),false);
 assert.equal(x.api.active(uid),false);
 value.source_mt=200;value.data.mt=200;
 assert.equal(await x.api.prepare(uid,token,getOld),true);
 assert.equal(x.api.active(uid),true);
 const count=x.calls.length;assert.equal(await x.api.prepare(uid,token,()=>{throw Error('Não deveria ler o legado outra vez')}),true);
 assert.equal(x.calls.length,count);
 assert.ok(x.calls.every(c=>c.hasAuth&&c.credentials==='omit'));
});
test('v903: conflito 409 consulta a revisão atual e preserva dados para merge',async()=>{
 const x=scenario({exists:true,revision:51,source_mt:250,data:{mt:250,trades:[{id:'old'}]}},true);
 const result=await x.api.save(token,50,{mt:260,trades:[{id:'new'}]});
 assert.equal(result.saved,false);
 assert.equal(result.revision,51);
 assert.equal(result.data.trades[0].id,'old');
 assert.deepEqual(x.calls.map(x=>x.method),['PUT','GET']);
});
test('v903: consulta D1 reproduz formato do sync anterior',async()=>{
 const x=scenario({exists:true,revision:55,source_mt:550,data:{mt:550,cart:{lanc:[]}}});
 assert.equal((await x.api.getMetaAsRows(token))[0].revision,55);
 assert.equal((await x.api.getRows(token))[0].data.mt,550);
});
test('v903: core conserva fallback até paridade e para de espelhar quando ativo',()=>{
 const core=fs.readFileSync('src/domains/core/02-estado-e-persistencia.js','utf8');
 assert.match(core,/usandoD1 = await window\.DiarioD1Principal\.prepare/);
 assert.match(core,/usandoD1\s*\?\s*await window\.DiarioD1Principal\.getRows/);
 assert.match(core,/window\.DiarioD1Principal\?\.active\(owner\)\s*\?\s*await window\.DiarioD1Principal\.save/);
 assert.equal((core.match(/!window\.DiarioD1Principal\?\.active\(owner\)/g)||[]).length,2);
 const sw=fs.readFileSync('src/service-worker.js','utf8');
 assert.match(sw,/diario-d1-principal-v903\.js/);
 assert.doesNotMatch(src,/supabase\.co|service_role|localStorage|setInterval/);
});
