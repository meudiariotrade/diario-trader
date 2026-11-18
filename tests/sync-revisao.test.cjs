const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn');
const {criar}=require('../sync-recovery.js');
const source=fs.readFileSync('nucleo-v560.js','utf8');
const names=new Set(['up','sync','syncOwner','assertSyncOwner']);
const funcs=acorn.parse(source,{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration'&&names.has(n.id.name)).map(n=>source.slice(n.start,n.end)).join('\n');
function app(options={}){
 const tasks=[],posts=[],reads=[];let failed=false;
 const c={Response,AbortSignal,Date,JSON,Error,Promise,setTimeout,clearTimeout,S:{mt:20,st:10,trades:[{id:'local'}]},SESS:{uid:'a'},SY:{busy:0,msg:''},RQ_DIARIO_REVISOES:new Map(),tab:'home',window:{TraderContinuo329:{signal(){}}},DiarioSyncRecovery:{criar:args=>criar({...args,schedule:f=>{tasks.push(f);return tasks.length},cancel:()=>{},online:()=>true})},
 pub:()=>JSON.parse(JSON.stringify(c.S)),persist(){},photos:async()=>0,uiSy(){},svUi(){},typing:()=>false,render(){},hm:()=> '20:00',em:e=>e.message,syncSoon(){},adopt:r=>{Object.assign(c.S,r);c.S.st=r.mt},mergeIn:r=>{c.S.trades=[...new Map([...r.trades,...c.S.trades].map(t=>[t.id,t])).values()];c.S.mt=Math.max(c.S.mt,r.mt)},
 rq:async(path,init)=>{
  if(!init.method){
    reads.push(path);
    if(path.includes('select=revision'))return new Response(JSON.stringify([{revision:options.serverRevision??4}]));
    return new Response(JSON.stringify([{data:options.remoteData??{mt:10,trades:[]},revision:options.serverRevision??4}]));
  }
  const body=JSON.parse(init.body);posts.push({path,body});
  if(options.timeout&&!failed){failed=true;throw Object.assign(new Error('temporário'),{status:503})}
  if(options.conflict&&posts.length===1)return new Response(JSON.stringify({saved:false,revision:5,data:{mt:21,trades:[{id:'remoto'}]}}));
  return new Response(JSON.stringify({saved:true,revision:6}));
 }};
 vm.createContext(c);vm.runInContext(funcs+'\nconst SY_RECOVERY=DiarioSyncRecovery.criar({owner:syncOwner,run:()=>sync()});',c);return{c,tasks,posts,reads};
}
test('runtime usa revisão curta e recupera um 503 mantendo alterações locais',async()=>{
 const {c,tasks,posts}=app({timeout:true});await vm.runInContext('sync(1)',c);
 assert.equal(c.S.st,10);assert.match(c.SY.msg,/Salvo neste aparelho/);assert.equal(c.SY.busy,0);assert.equal(tasks.length,1);
 await tasks[0]();assert.equal(c.S.st,20);assert.match(c.SY.msg,/Sincronizado/);
 assert.equal(posts[0].body.expected_revision,4);assert.ok(!('expected_data'in posts[0].body));assert.match(posts[0].path,/diario_salvar_revisao/);
});
test('conflito entre aparelhos conserva os dois trades e usa a nova revisão',async()=>{
 const {c,posts}=app({conflict:true});await vm.runInContext('sync(1)',c);
 assert.equal(posts[1].body.expected_revision,5);assert.deepEqual(posts[1].body.new_data.trades.map(t=>t.id).sort(),['local','remoto']);assert.equal(c.S.st,21);
});

test('consulta automática sem mudanças verifica só revisão, sem baixar o JSON volumoso', async()=>{
 const {c,reads,posts}=app();
 c.S.mt=10;c.S.st=10;c.window.DiarioSyncRevision={owner:'a',revision:4};
 await vm.runInContext('sync()',c);
 assert.equal(reads.length,1);
 assert.match(reads[0],/select=revision/);
 assert.doesNotMatch(reads[0],/select=data/);
 assert.equal(posts.length,0);
 assert.equal(c.S.st,10);
 assert.match(c.SY.msg,/Sincronizado/);
});
test('mudança de revisão em outro aparelho busca dados completos para atualização', async()=>{
 const {c,reads,posts}=app({serverRevision:5,remoteData:{mt:40,trades:[{id:'remoto'}]}});
 c.S.mt=10;c.S.st=10;c.window.DiarioSyncRevision={owner:'a',revision:4};
 await vm.runInContext('sync()',c);
 assert.match(reads[0],/select=revision/);
 assert.match(reads[1],/select=data,revision/);
 assert.equal(c.S.mt,40);
 assert.equal(c.S.st,40);
 assert.equal(c.window.DiarioSyncRevision.revision,5);
 assert.equal(posts.length,0);
});
test('salvamento pendente nunca ignora conflitos nem economiza leitura completa', async()=>{
 const {c,reads,posts}=app();
 c.window.DiarioSyncRevision={owner:'a',revision:4};
 await vm.runInContext('sync()',c);
 assert.equal(reads.length,1);
 assert.match(reads[0],/select=data,revision/);
 assert.equal(posts.length,1);
 assert.equal(c.window.DiarioSyncRevision.revision,null);
});
test('troca de conta invalida a revisão conhecida', async()=>{
 const {c,reads}=app();
 c.S.mt=10;c.S.st=10;
 c.window.DiarioSyncRevision={owner:'outra-conta',revision:4};
 await vm.runInContext('sync()',c);
 assert.match(reads[0],/select=data,revision/);
 assert.equal(c.window.DiarioSyncRevision.owner,'a');
});
