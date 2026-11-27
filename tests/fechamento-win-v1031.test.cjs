const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Início consome a ponte existente sem usar fallback Supabase',()=>{
 const s=fs.readFileSync('profit-cotacoes-v552.js','utf8');
 assert.match(s,/await cqPonte\(false,home\(\)\)/);
 assert.match(s,/if\(edgeOnly\)return;\s*if \(Date\.now/);
 assert.match(s,/if\(edgeOnly&&!edge&&!configured\)return/);
 assert.match(s,/home\(\)\|\|market\(\)/);
});
test('mercado apresenta carga já ao iniciar e compartilha chamadas em voo',async()=>{
 const s=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
 const a=s.indexOf('const CQ_EDGE_V1022='),b=s.indexOf('var cqPonte, cqPinta;',a);
 const CQ={aba:'br',d:{},ts:{},errors:{},loading:{}};
 let resolveFetch,calls=0;
 const c={CQ,window:{DIARIO_DEMO:true},CQ_ABAS:[['br']],tab:'mercado',MKT:{tab:'cq'},Date,Map,Promise,AbortController,AbortSignal,URLSearchParams,cqPinta:()=>{},fetch:()=>{calls++;return new Promise(r=>resolveFetch=r)}};
 vm.runInNewContext(s.slice(a,b),c);
 const p=c.cqCarrega('br',true);assert.equal(CQ.loading.br,true);
 const p2=c.cqCarrega('br',true);assert.equal(p,p2);
 await Promise.resolve();assert.equal(calls,1);
 resolveFetch({ok:true,json:async()=>({itens:[{s:'BMFBOVESPA:PETR4',px:44}]})});
 await p;assert.equal(CQ.loading.br,false);assert.equal(CQ.d.br.itens[0].px,44);
});
