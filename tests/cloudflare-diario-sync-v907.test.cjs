const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const getWorker=()=>import('../cloudflare/diario-sync/index.mjs');
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const auth='https://meudiariotrade.github.io';
const envBase={ALLOWED_ORIGIN:auth,SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public'};
function req(path,method='GET',payload,token='a'.repeat(32)){return new Request('https://diario-sync.test'+path,{method,headers:{Origin:auth,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});}
function dbMemory(){
 const rows=new Map();
 return {
  rows,
  prepare(sql){let values=[];return {bind(...p){values=p;return this},async all(){if(!sql.startsWith('SELECT ts AS t'))throw Error('unexpected SELECT');const [uid,tk,from,limit,offset]=values;const filtered=[...rows.values()].filter(x=>x.uid===uid&&x.ticker===tk&&x.ts>=from).sort((x,y)=>x.ts-y.ts).slice(offset,offset+limit).map(x=>({t:x.ts,o:x.o,h:x.h,l:x.l,c:x.c,v:x.v}));return {results:filtered}},get args(){return values}}},
  async batch(statements){for(const s of statements){const [uid,ticker,ts,o,h,l,c,v]=s.args;rows.set(uid+':'+ticker+':'+ts,{uid,ticker,ts,o,h,l,c,v})}return []}
 };
}
test('v907: candles do Profit isolados por usuário no Cloudflare D1',async()=>{
 const {default:w}=await getWorker(),DB=dbMemory();let calls=0;
 const native=global.fetch;global.fetch=async(_url,opt)=>{calls++;return Response.json({id:opt.headers.Authorization.includes('a'.repeat(32))?a:b})};
 try{
  const values=[{ativo:'PETR4',t:1700000000,o:10,h:12,l:9,c:11,v:150},{ativo:'VALE3',t:1700000060,o:20,h:22,l:19,c:21,v:200}];
  const put=await w.fetch(req('/v1/profit-candles','POST',{candles:values}),{...envBase,DB});
  assert.equal(put.status,200);assert.equal((await put.json()).saved,2);
  const own=await (await w.fetch(req('/v1/profit-candles?ticker=PETR4&from=1600000000'),{...envBase,DB})).json();
  assert.equal(own.candles.length,1);assert.equal(own.candles[0].c,11);
  const other=await (await w.fetch(req('/v1/profit-candles?ticker=PETR4&from=1600000000','GET',null,'b'.repeat(32)),{...envBase,DB})).json();
  assert.equal(other.candles.length,0);assert.equal(calls,3);
 }finally{global.fetch=native}
});
test('v907: rejeita timestamp negativo, ticker inválido e lotes acima de 100',async()=>{
 const {default:w}=await getWorker(),DB=dbMemory();
 const original=global.fetch;global.fetch=async()=>Response.json({id:a});
 try{
  assert.equal((await w.fetch(req('/v1/profit-candles?ticker=INVALID%2FNAME'),{...envBase,DB})).status,400);
  assert.equal((await w.fetch(req('/v1/profit-candles','POST',{candles:[{ativo:'PETR4',t:-2209150440,o:10,h:12,l:9,c:11,v:1}]}),{...envBase,DB})).status,422);
  assert.equal((await w.fetch(req('/v1/profit-candles','POST',{candles:Array.from({length:101},()=>({ativo:'PETR4',t:1700000000,o:10,h:12,l:9,c:11,v:1}))}),{...envBase,DB})).status,400);
  assert.equal(DB.rows.size,0);
 }finally{global.fetch=original}
});
test('v907: replay deixa de acessar diretamente a tabela Profit do Supabase',()=>{
 const code=fs.readFileSync('src/domains/core/17-fontes-e-balancos.js','utf8');
 assert.doesNotMatch(code,/\/rest\/v1\/profit_candles/);
 assert.match(code,/workers\.dev\/v1\/profit-candles/);
});
