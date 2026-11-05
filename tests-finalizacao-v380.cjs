'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8');
const start=app.indexOf('async function pcLerCompartilhamento(token)');
const end=app.indexOf('async function ',start+16);
assert(start>=0);
const source=app.slice(start,end>start?end:start+1500).split(/\n}\s*const r=await pcLerCompartilhamento/)[0];
// Read the balanced function rather than relying on app whitespace.
let open=app.indexOf('{',start),depth=0,close=-1;
for(let i=open;i<app.length;i++){
  if(app[i]==='{')depth++;
  else if(app[i]==='}'&&--depth===0){close=i+1;break;}
}
assert(close>open);
const fnText=app.slice(start,close);
assert(fnText.includes('return await legacy.json()'));
assert(fnText.includes('if(!endpointAusente)throw error'));
assert(fnText.includes('/functions/v1/parceiro-leitura'));
assert(!fnText.includes('SUPABASE_SERVICE_ROLE_KEY'));
let count=0;
async function scenario(name,reply,expected){
 const paths=[];
 const ctx={rq:async(path)=>{paths.push(path);return reply(path);}};
 vm.createContext(ctx);vm.runInContext(fnText,ctx);
 let result=null,err=null;
 try{result=await ctx.pcLerCompartilhamento('a'.repeat(28));}catch(e){err=e;}
 assert.deepEqual(paths,expected.paths,name+' paths');
 if(expected.error){assert(err,name+' error expected');assert.match(String(err.message),expected.error);}
 else {assert(!err,name+' unexpected: '+err);assert.equal(result.resumo.ok,true,name+' result');}
 count++;console.log('OK',name);
}
(async()=>{
 const ok=()=>({json:async()=>({resumo:{ok:true}})});
 await scenario('Edge responde com dados válidos',()=>ok(),{paths:['/functions/v1/parceiro-leitura']});
 await scenario('Edge ainda não implantado usa RPC legado',p=>{
  if(p.includes('/functions/')){const e=Error('Function not found');e.status=404;throw e;}return ok();
 },{paths:['/functions/v1/parceiro-leitura','/rest/v1/rpc/parceiro_ver']});
 await scenario('Token inválido não retorna ao RPC legado',()=>{const e=Error('Link indisponível');e.status=404;throw e;},{paths:['/functions/v1/parceiro-leitura'],error:/Link indisponível/});
 await scenario('Origem negada não retorna ao RPC legado',()=>{const e=Error('Origem não permitida');e.status=403;throw e;},{paths:['/functions/v1/parceiro-leitura'],error:/Origem/});
 await scenario('429 não retorna ao RPC legado',()=>{const e=Error('Aguarde');e.status=429;throw e;},{paths:['/functions/v1/parceiro-leitura'],error:/Aguarde/});
 console.log(count+'/'+count+' testes de migração segura do parceiro aprovados');
})().catch(e=>{console.error(e);process.exitCode=1;});
