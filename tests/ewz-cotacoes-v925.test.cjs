const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
const termo=fs.readFileSync('src/market/termometro-abertura-v670.js','utf8');
const home=fs.readFileSync('src/domains/layers/03-apresentacao.js','utf8');
const comeco=core.indexOf('function fhEwzAdr925()');
const fim=core.indexOf('// Fita superior: EWZ da cotação ADR recente',comeco);
assert.ok(comeco>=0&&fim>comeco);
const trecho=core.slice(comeco,fim);
function quote({price=29.18,change=2.24,ago=30000,cacheAgo=20000,phase='reg'}={}){
 const agora=Date.now();
 const estado={window:{TraderAdr:{view:()=>({active:{px:price,chp:change,at:new Date(agora-ago).toISOString()}}),phase:()=>phase}},
 AD:{data:{ts:agora-cacheAgo,itens:[{s:'EWZ'}],atraso:true}},Date,Number};
 vm.runInNewContext(trecho+'this.cotacao=fhEwzAdr925;',estado);
 return estado.cotacao();
}
test('v925: EWZ usa ADR recente com preço e percentual',()=>{
 const a=quote();
 assert.equal(a.px,29.18);assert.equal(a.chg,2.24);
 assert.match(a.fonte,/Cloudflare/);assert.ok(a.dadoEm);
});
test('v925: preço e consulta antigos não substituem cotação atual',()=>{
 assert.equal(quote({ago:100*60000}),null);
 assert.equal(quote({cacheAgo:6*60000}),null);
});
test('v925: variação ausente não equivale a zero',()=>{
 assert.equal(quote({change:null}),null);
 assert.equal(quote({change:0}).chg,0);
});
test('v925: fontes unificadas e sem tráfego extra ao Supabase',()=>{
 assert.match(core,/if \(s === "EWZ"\) \{\s+const referencia=fhEwzAdr925\(\)/);
 assert.match(termo,/grupo:"ewz-canonico"/);
 assert.match(home,/variação indisponível/);
 assert.doesNotMatch(trecho,/fetch\s*\(|supabase|\/rest\/v1\/|setInterval\s*\(/i);
});
