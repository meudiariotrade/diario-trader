const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ponte(respWorker){
 const chamadas=[];
 const w={location:{href:'https://meudiariotrade.github.io/diario-trader/'},fetch:async(input)=>{const u=String(input&&input.url||input);chamadas.push(u);
  if(u.includes('workers.dev'))return respWorker();return new Response(JSON.stringify({versao:'v90'}),{status:200});}};
 vm.runInNewContext(fs.readFileSync('src/shared/funcoes-cloudflare-v1042.js','utf8'),{window:w,URL,Request,Response,Headers,Set,location:w.location});
 return {w,chamadas};
}
const URLF='https://vdzwydizostutukppcsj.supabase.co/functions/v1/analise?versao=1';
test('v1054: resposta do Worker sai marcada como Cloudflare',async()=>{
 const {w}=ponte(()=>new Response(JSON.stringify({versao:'v563'}),{status:200}));
 const r=await w.fetch(URLF,{headers:{apikey:'x'}});
 assert.equal(r.headers.get('x-diario-origem'),'cloudflare');assert.equal((await r.json()).versao,'v563');
});
test('v1054: Worker sem chaves (503) cai no Supabase e sai marcada como Supabase',async()=>{
 const {w,chamadas}=ponte(()=>new Response('{}',{status:503}));
 const r=await w.fetch(URLF,{headers:{apikey:'x'}});
 assert.equal(r.headers.get('x-diario-origem'),'supabase');assert.equal(chamadas.length,2);
});
test('v1054: Status do sistema mostra a origem',()=>{
 assert.match(fs.readFileSync('src/domains/core/08-terminal-e-sazonalidade.js','utf8'),/x-diario-origem[\s\S]{0,120}Cloudflare/);
});
