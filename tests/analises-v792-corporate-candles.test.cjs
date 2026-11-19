'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/analysis/corporate-candles-v792.js');
const base=[
 {t:Date.UTC(2026,0,5,14),o:100,h:105,l:95,c:102,v:1000},
 {t:Date.UTC(2026,0,6,14),o:101,h:105,l:98,c:104,v:2000},
 {t:Date.UTC(2026,0,7,14),o:52,h:53,l:50,c:51,v:4000}
];
const split={type:'split',exDate:'2026-01-07',ratio:2,
 document_url:'https://www.b3.com.br/produtos-e-servicos/corporate-actions/example'};
test('v792: desdobramento 2:1 ajusta somente preços antigos e volume inversamente',()=>{
 const raw=structuredClone(base),r=A.adjust(raw,[split],{market:'BR',asOf:'2026-11-19'});
 assert.equal(r.verified,true);assert.equal(r.adjusted[0].c,51);
 assert.equal(r.adjusted[0].v,2000);assert.equal(r.adjusted[2].c,51);
 assert.deepEqual(raw,base);
});
test('v792: sem documento oficial, sem ajuste hipotético',()=>{
 const r=A.adjust(base,[{...split,document_url:'https://example.com'}],{market:'BR',asOf:'2026-11-19'});
 assert.equal(r.verified,false);assert.equal(r.adjusted,null);
});
test('v792: dividendo extraordinário não vira ajuste por split',()=>{
 const r=A.adjust(base,[{...split,type:'dividend'}],{market:'BR',asOf:'2026-11-19'});
 assert.equal(r.verified,false);
});
test('v792: não usar eventos futuros durante replay histórico',()=>{
 const r=A.adjust(base,[split],{market:'BR',asOf:'2026-01-06'});
 assert.equal(r.verified,false);
});
test('v792: cripto spot sem eventos passa sem alterar preços; dados inválidos bloqueiam',()=>{
 const good=A.adjust(base,[],{market:'CRYPTO'});
 assert.equal(good.verified,true);assert.deepEqual(good.adjusted,base);
 assert.equal(A.adjust([...base,{...base[2],t:base[2].t,c:-1}],[],{market:'CRYPTO'}).verified,false);
});

test('v792: calendário de pregão é local; não usa automaticamente data UTC',()=>{
 const t=Date.parse('2026-11-19T00:30:00Z');
 assert.equal(A.marketDate(t,'BR'),'2026-11-18');
 assert.equal(A.marketDate(t,'US'),'2026-11-18');
 assert.equal(A.marketDate(t,'CRYPTO'),'2026-11-19');
});
