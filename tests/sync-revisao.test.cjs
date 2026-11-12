const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn');
const {criar}=require('../sync-recovery.js');
const source=fs.readFileSync('nucleo-v560.js','utf8');
const names=new Set(['up','sync','syncOwner','assertSyncOwner']);
const funcs=acorn.parse(source,{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration'&&names.has(n.id.name)).map(n=>source.slice(n.start,n.end)).join('\n');
function app(options={}){
 const tasks=[],posts=[];let failed=false;
 const c={Response,AbortSignal,Date,JSON,Error,Promise,setTimeout,clearTimeout,S:{mt:20,st:10,trades:[{id:'local'}]},SESS:{uid:'a'},SY:{busy:0,msg:''},tab:'home',window:{TraderContinuo329:{signal(){}}},DiarioSyncRecovery:{criar:args=>criar({...args,schedule:f=>{tasks.push(f);return tasks.length},cancel:()=>{},online:()=>true})},
 pub:()=>JSON.parse(JSON.stringify(c.S)),persist(){},photos:async()=>0,uiSy(){},svUi(){},typing:()=>false,render(){},hm:()=> '20:00',em:e=>e.message,syncSoon(){},adopt:r=>Object.assign(c.S,r),mergeIn:r=>{c.S.trades=[...new Map([...r.trades,...c.S.trades].map(t=>[t.id,t])).values()];c.S.mt=Math.max(c.S.mt,r.mt)},
 rq:async(path,init)=>{
  if(!init.method)return new Response(JSON.stringify([{data:{mt:10,trades:[]},revision:4}]));
  const body=JSON.parse(init.body);posts.push({path,body});
  if(options.timeout&&!failed){failed=true;throw Object.assign(new Error('temporário'),{status:503})}
  if(options.conflict&&posts.length===1)return new Response(JSON.stringify({saved:false,revision:5,data:{mt:21,trades:[{id:'remoto'}]}}));
  return new Response(JSON.stringify({saved:true,revision:6}));
 }};
 vm.createContext(c);vm.runInContext(funcs+'\nconst SY_RECOVERY=DiarioSyncRecovery.criar({owner:syncOwner,run:()=>sync()});',c);return{c,tasks,posts};
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
