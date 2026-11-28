const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
const trecho=core.slice(core.indexOf('const CQ_ROLAGEM_V1054'),core.indexOf('function cqCancelarV1022'));
function rolagem(spot){
 const ctx={window:{DiarioMarketData:{get:k=>spot[k]==null?null:{d1:spot[k]}}}};
 vm.runInNewContext(trecho+'\nthis.f=cqRolagemV1054;',ctx);return ctx.f;
}
test('Etapa 1: WDO/DOL na rolagem perdem a variação falsa, mas mantêm o preço',()=>{
 const n={itens:[{c:'WDO',px:5549.5,d1:-3.43,dabs:-197},{c:'DOL',px:5549.5,d1:-3.43},{c:'WIN',px:178855,d1:0.07}]};
 rolagem({'BRL=X':-2.35,'^BVSP':0.51})(n);
 assert.equal(n.itens[0].d1,null);assert.equal(n.itens[0].px,5549.5);assert.equal(n.itens[0].quoteStatus,'rolagem');
 assert.equal(n.itens[1].d1,null);
 assert.equal(n.itens[2].d1,0.07,'WIN coerente com o Ibovespa permanece');
});
test('Etapa 1: sem cotação à vista não há como julgar, nada é alterado',()=>{
 const n={itens:[{c:'WDO',px:5549.5,d1:-3.43}]};rolagem({})(n);assert.equal(n.itens[0].d1,-3.43);
});
test('Etapa 1: rótulos distinguem Nasdaq 100 (Terminal) e Nasdaq Composite (Início)',()=>{
 assert.match(fs.readFileSync('src/domains/core/17-fontes-e-balancos.js','utf8'),/\["Nasdaq 100", "NASDAQ:NDX"/);
 assert.match(fs.readFileSync('src/domains/layers/03-apresentacao.js','utf8'),/\["\^IXIC","Nasdaq Comp\."\]/);
});
