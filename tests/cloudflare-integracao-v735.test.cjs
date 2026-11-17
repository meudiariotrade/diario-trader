const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
const start=src.indexOf('async function mkCloudflareNoticias()');
const end=src.indexOf('async function mkFinnhubNoticias(category)',start);
assert.ok(start>0&&end>start,'Cloudflare deve ser um adaptador isolado');
const adapter=src.slice(start,end);
const mock=async(data,status=200)=>{
  const calls=[];
  const ctx={fetch:async(url,init)=>{calls.push({url,init});return {ok:status===200,status,json:async()=>data}},Date,AbortSignal,Error,Number,Array,
    mkNoticia:n=>({t:n.t,a:n.a,d:n.d,c:n.c,l:n.l})};
  return {promise:vm.runInNewContext(adapter+'\n mkCloudflareNoticias()',ctx),calls};
};
test('v735: endpoint publico correto e payload de tema politica compatível com filtros',async()=>{
  const n=new Date().toISOString();
  const {promise,calls}=await mock({atualizadoEm:n,fontesOk:['InfoMoney'],itens:[{
    t:'Copom avalia juros e mercado reage',l:'https://www.infomoney.com.br/mercados/teste/',
    d:n,fonte:'InfoMoney',tema:'politica_economica'}]});
  const out=await promise;
  assert.equal(calls[0].url,'https://diario-trader.lucianosilva43567.workers.dev/v1/noticias');
  assert.deepEqual([...out[0].c],['politica']);
  assert.equal(out[0].a,'InfoMoney');
  assert.equal(calls[0].init.cache,'default');
});
test('v735: cache velho, dados vazios e erro HTTP ativam contingencia',async()=>{
  for (const [payload,status] of [
    [{atualizadoEm:new Date(Date.now()-3600e3).toISOString(),fontesOk:['CNBC'],itens:[{t:'Taxas e Fed'}]},200],
    [{atualizadoEm:new Date().toISOString(),fontesOk:[],itens:[]},200],
    [{atualizadoEm:new Date().toISOString(),fontesOk:['CNBC'],itens:[]},200],
    [{itens:[]},503]
  ]){
    const {promise}=await mock(payload,status);await assert.rejects(promise);
  }
});
test('v735: reduz consultas Edge em caso normal, preserva X e reservas sob falha',()=>{
  const load=src.slice(src.indexOf('async function mkLoad(force)'),src.indexOf('// Atualização compartilhada',src.indexOf('async function mkLoad(force)')));
  assert.match(load,/mkCloudflareNoticias\(\)/);
  assert.match(load,/if\(!cloudOk\|\|MKT\.nf==="x"\|\|resultados\.length<12\)/);
  assert.match(load,/if\(!cloudOk&&resultados\.length<12\)/);
  assert.match(load,/mkEdgeNoticias\("noticias"\)/);
  assert.match(load,/mkEdgeNoticias\("terminal"\)/);
  assert.match(load,/mkFinnhubNoticias\("general"\)/);
  assert.match(src,/s === "x" && mkLoad\(true\)/);
  assert.match(src,/document\.dispatchEvent\(new CustomEvent\("diario:noticias"\)\)/);
});
