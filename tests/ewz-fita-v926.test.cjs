const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('src/market/tape-live.js','utf8');
function ambiente(adr) {
 const janela={DiarioEwzCotacao:adr,TRM:{TR:{px:{},profit:{}},trBinance(){}},tapeDados:()=>({})};
 const doc={hidden:false,addEventListener(){}};
 vm.runInNewContext(code,{window:janela,document:doc,navigator:{onLine:true},setInterval(){},setTimeout(){},Date});
 return janela;
}
test('v926: módulo final da fita usa mesma cotação de EWZ das ADRs no Início',()=>{
 const w=ambiente(()=>({px:29.18,chg:2.24,fonte:'EWZ · ADRs Cloudflare',dadoEm:new Date().toISOString()}));
 w.TRM.TR.px['FH:EWZ']={px:29.04,ts:Date.now()-1000};
 const cot=w.tapeVivo('EWZ');
 assert.equal(cot.px,29.18);
 assert.equal(cot.chg,2.24);
 assert.match(cot.fonte,/Cloudflare/);
});
test('v926: sem referência ADR válida, não inventa variação do Finnhub',()=>{
 const w=ambiente(()=>null);
 w.TRM.TR.px['FH:EWZ']={px:29.04,ts:Date.now()-1000};
 const q=w.tapeVivo('EWZ');
 assert.equal(q.px,29.04);
 assert.equal(q.chg,null);
});
test('v926: fonte indisponível não devolve dados artificiais',()=>{
 const w=ambiente(()=>({px:29.18,chg:null}));
 assert.equal(w.tapeVivo('EWZ'),null);
});
