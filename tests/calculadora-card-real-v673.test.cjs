const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const file=fs.readFileSync(path.resolve(__dirname,'../src/navigation/organizacao.js'),'utf8');
const first=file.indexOf(' const posicaoTrade='),last=file.indexOf(' function rendered(){',first);
assert.ok(first>0&&last>first,'card atual de Operações encontrado');
function fixture(){
 const dom=new JSDOM('<main id="app"></main>',{url:'https://example.test'});
 const context=vm.createContext({w:dom.window,d:dom.window.document,tab:'ops'});
 vm.runInContext(file.slice(first,last),context);
 vm.runInContext('posicaoMini()',context);
 const set=values=>{
  for(const [k,v] of Object.entries(values))vm.runInContext('posicaoTrade['+JSON.stringify(k)+']='+JSON.stringify(v),context);
  vm.runInContext('posicaoAtualiza(d.querySelector("[data-posicao-painel]"))',context);
 };
 return {dom,doc:dom.window.document,context,set};
}
test('v673: o card visível de Operações > Hoje tem duas abas, sem duplicidade',()=>{
 const f=fixture();
 vm.runInContext('posicaoMini()',f.context);
 assert.equal(f.doc.querySelectorAll('[data-posicao-painel]').length,1);
 assert.equal(f.doc.querySelectorAll('[data-posicao-aba]').length,2);
 const tabs=f.doc.querySelectorAll('[data-posicao-aba]');
 tabs[1].click();
 assert.equal(f.doc.querySelector('[data-posicao-secao="parcial"]').hidden,false);
 assert.equal(f.doc.querySelector('[data-posicao-secao="tamanho"]').hidden,true);
 tabs[0].click();
 f.doc.querySelector('[data-posicao-modo="preco"]').click();
 assert.equal(f.doc.querySelector('[data-posicao-preco]').hidden,false);
 assert.equal(f.doc.querySelector('[data-posicao-direto]').hidden,true);
 f.dom.window.close();
});
test('v673: WIN compra, 50 contratos e alvos de 2R/3R',()=>{
 const f=fixture();
 f.set({ativo:'WIN',risco:'1000',entrada:'130000',precoStop:'129900',modo:'preco',lado:'C'});
 assert.equal(f.doc.querySelector('[data-posicao-resultado]').textContent,'50');
 assert.match(f.doc.querySelector('[data-posicao-alvos]').textContent,/130\.200/);
 assert.match(f.doc.querySelector('[data-posicao-alvos]').textContent,/130\.300/);
 assert.match(f.doc.querySelector('[data-posicao-alvos]').textContent,/2\.000,00/);
 assert.match(f.doc.querySelector('[data-posicao-alvos]').textContent,/3\.000,00/);
 f.dom.window.close();
});
test('v673: WDO venda, alvos inferiores e stop informado em R$ por contrato',()=>{
 const f=fixture();
 f.set({ativo:'WDO',risco:'1000',entrada:'5500',stop:'50',stopUnidade:'reais',modo:'direto',lado:'V'});
 assert.equal(f.doc.querySelector('[data-posicao-resultado]').textContent,'20');
 assert.match(f.doc.querySelector('[data-posicao-alvos]').textContent,/5\.490/);
 assert.match(f.doc.querySelector('[data-posicao-alvos]').textContent,/5\.485/);
 f.dom.window.close();
});
test('v673: parcial vendida WDO gera lucro e preço de risco zero no tick',()=>{
 const f=fixture();
 f.set({ativoParcial:'WDO',ladoParcial:'V',total:'10',medio:'5500',parcial:'4',saida:'5490'});
 const out=f.doc.querySelector('[data-posicao-parcial-res]').textContent;
 assert.match(out,/400,00/);assert.match(out,/5\.506,6667/);assert.match(out,/5\.506,50/);
 f.dom.window.close();
});
test('v673: parcial total não apresenta risco zero falso e quantidade inválida é rejeitada',()=>{
 const f=fixture();
 f.set({ativoParcial:'ACOES',ladoParcial:'C',total:'50',medio:'20',parcial:'50',saida:'22'});
 assert.match(f.doc.querySelector('[data-posicao-parcial-res]').textContent,/100,00/);
 assert.match(f.doc.querySelector('[data-posicao-parcial-res]').textContent,/totalmente encerrada/);
 f.set({parcial:'51'});
 assert.match(f.doc.querySelector('[data-posicao-parcial-res]').textContent,/quantidades inteiras/);
 f.dom.window.close();
});
