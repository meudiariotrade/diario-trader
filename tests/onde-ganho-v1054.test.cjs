const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function carregar(){const w={};vm.runInNewContext(fs.readFileSync('src/journal/onde-ganho-v1054.js','utf8'),{window:w});return w.DiarioOndeGanho;}
let dia=0;const t=(v,extra={})=>({v,r:v>0?1.5:-1,d:'2026-11-'+String(2+(dia++%20)).padStart(2,'0'),h:10,at:'WIN',setup:'Rompimento',emo:'calmo',ok:true,...extra});

test('Etapa 7: aponta onde ganha e onde perde, só com grupos de 3+ trades',()=>{
 const og=carregar();
 const regs=[t(300),t(200),t(100),
  t(-250,{setup:'Contra tendência',emo:'ansioso',ok:false,h:9}),t(-150,{setup:'Contra tendência',emo:'ansioso',ok:false,h:9}),t(-100,{setup:'Contra tendência',emo:'ansioso',ok:false,h:9}),
  t(-999,{setup:'Raro',emo:'',ok:true,h:15,at:'WDO'})];
 const a=og.analisar(regs);
 assert.equal(a.total,7);
 assert.ok(a.ganha.some(g=>g.tipo==='Setup'&&g.nome==='Rompimento'&&g.v===600&&g.n===3));
 assert.ok(a.perde.some(g=>g.tipo==='Setup'&&g.nome==='Contra tendência'&&g.v===-500));
 assert.ok(a.perde.some(g=>g.tipo==='Emoção'&&g.nome==='Ansioso'));
 assert.ok(!a.perde.some(g=>g.nome==='Raro'),'grupo com 1 trade não entra');
 assert.ok(a.ganha.length<=3&&a.perde.length<=3);
});
test('Etapa 7: menos de 3 trades não mostra o painel; HTML escapa nomes',()=>{
 const og=carregar();
 assert.equal(og.html([t(10),t(-5)]),'');
 const h=og.html([t(10,{setup:'<b>x</b>'}),t(20,{setup:'<b>x</b>'}),t(30,{setup:'<b>x</b>'})]);
 assert.match(h,/Onde você ganha/);assert.match(h,/&lt;b&gt;x&lt;\/b&gt;/);assert.doesNotMatch(h,/<b>x<\/b>/);
 assert.match(h,/\+R\$ 60,00/);
});
