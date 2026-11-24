const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/analysis/analises.js','utf8');
test('v953: mediana real ignora lacunas, preserva zeros e distingue dividendo de retorno total',()=>{
 const data={universe_complete:true,universe_rows:[{roe:null,dividend_yield:null,total_shareholder_yield:8},{roe:10,dividend_yield:0,total_shareholder_yield:4},{roe:20,dividend_yield:2,total_shareholder_yield:6},{roe:'',dividend_yield:'',total_shareholder_yield:null}]};
 const c={snapshotMemory:new Map([['US',{data}]])};
 vm.runInNewContext(src.slice(src.indexOf('function mediana953('),src.indexOf('function localScreener(')),c);
 const m=c.medianasMercado('us');assert.equal(m.roe,15);assert.equal(m.dy,1);assert.equal(m.total_yield,6);assert.equal(m.n,4);
 data.universe_complete=false;assert.equal(c.medianasMercado('us'),null);
 assert.equal(c.mediana953([{a:null},{a:''}],'a'),null);
});
test('v953: explicação EUA usa IA autenticada, cache por conta e sem Cérebro legado',async()=>{
 const store=new Map(),requests=[],box={isConnected:true,innerHTML:''};
 const row={ticker:'AAPL',preco_referencia:200,roe:20};
 const c={Date,AbortSignal,owner:()=> 'u1',SESS:{uid:'u1',at:'token'},tok:async()=>{},fmt:String,E:String,medianasMercado:()=>null,sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},w:{fetch:async(url,opts)=>{requests.push({url,opts});return {ok:true,status:200,json:async()=>({ok:true,text:'Parecer da IA com os números informados.'})}}},d:{querySelectorAll:()=>[]}};
 vm.runInNewContext(src.slice(src.indexOf('const iaChave='),src.indexOf('/* v852: logotipo')),c);
 await c.explicarIA('AAPL','us',{data:{rows:[row]},selectedRows:{}},box);
 assert.equal(requests.length,1);assert.match(requests[0].url,/\/v1\/aurea-resumao$/);assert.equal(requests[0].opts.headers.Authorization,'Bearer token');assert.equal(requests[0].opts.cache,'no-store');assert.match(JSON.parse(requests[0].opts.body).prompt,/200 USD/);assert.match(box.innerHTML,/Parecer da IA/);
 await c.explicarIA('AAPL','us',{data:{rows:[row]},selectedRows:{}},box);assert.equal(requests.length,1);
 c.owner=()=> 'u2';c.SESS={uid:'u2',at:'token2'};await c.explicarIA('AAPL','us',{data:{rows:[row]},selectedRows:{}},box);assert.equal(requests.length,2);
});