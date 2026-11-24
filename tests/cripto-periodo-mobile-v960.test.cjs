const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const src = fs.readFileSync("src/domains/core/13-diagnostico-e-relatorios.js","utf8");
const block = src.slice(src.indexOf("const CQ_CRYPTO_PERIODOS"),src.indexOf("cqLinha = function (e, t) {",src.indexOf("const CQ_CRYPTO_PERIODOS")));
const env = {CQ:{aba:"cri"},window:{matchMedia:()=>({matches:true,addEventListener(){}})},document:{addEventListener(){}},Date,Map,Object,Number,Math};
vm.createContext(env);vm.runInContext(block,env);
const run = expression => vm.runInContext(expression,env);
test("períodos usam minuto UTC e ano-calendário UTC",()=>{
 const now=Date.parse("2026-11-24T14:18:57Z");
 assert.equal(run("cqCryptoBase('7d',"+now+")"),Date.parse("2026-11-17T14:18:00Z"));
 assert.equal(run("cqCryptoBase('30d',"+now+")"),Date.parse("2026-10-25T14:18:00Z"));
 assert.equal(run("cqCryptoBase('ytd',"+now+")"),Date.parse("2026-01-01T00:00:00Z"));
});
test("apenas Cripto mobile; 24h original e referência ausente sem porcentagem falsa",()=>{
 assert.equal(run("cqCryptoVariacao({c:'BTC',d1:3},'cri',{px:120,d1:4,bnc:true})"),4);
 run("CQ_CRYPTO_HIST.periodo='7d'; CQ_CRYPTO_HIST.refs={BTC:100}");
 assert.ok(Math.abs(run("cqCryptoVariacao({c:'BTC'},'cri',{px:120,d1:4,bnc:true})")-20)<1e-9);
 assert.equal(run("cqCryptoVariacao({c:'BTC'},'cri',{px:120,d1:4,bnc:false})"),null);
 assert.equal(run("cqCryptoVariacao({c:'ETH'},'cri',{px:120,d1:4,bnc:true})"),null);
 assert.equal(run("cqCryptoVariacao({c:'BTC'},'fav',{px:120,d1:4,bnc:true})"),4);
 run("CQ_CRYPTO_MQ.matches=false");
 assert.equal(run("cqCryptoVariacao({c:'BTC'},'cri',{px:120,d1:4,bnc:true})"),4);
 assert.equal(run("cqCryptoPeriodoHtml('cri')"),"");
});
