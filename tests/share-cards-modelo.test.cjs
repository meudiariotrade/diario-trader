const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../src/share/cards-modelo.js');
test('cards: calendário anual respeita limites, prioridades e datas móveis',()=>{
 for(const [date,theme]of Object.entries({'2026-12-26':'reveillon','2027-01-05':'reveillon','2027-01-06':'mercado','2026-02-13':'carnaval','2026-02-18':'carnaval','2026-02-19':'mercado','2026-03-29':'pascoa','2026-04-05':'pascoa','2026-04-06':'mercado','2026-05-25':'champions','2026-06-07':'champions','2026-06-08':'junina','2026-06-30':'junina','2026-07-01':'mercado','2026-09-07':'brasil','2026-09-13':'brasil','2026-09-14':'mercado','2026-10-19':'mercado','2026-10-20':'halloween','2026-10-31':'halloween','2026-11-09':'mercado','2026-11-10':'libertadores','2026-11-22':'libertadores','2026-11-23':'blackfriday','2026-11-29':'blackfriday','2026-11-30':'libertadores','2026-12-01':'natal','2026-12-25':'natal','2024-12-01':'blackfriday'}))assert.equal(M.automatic(date),theme,date);
 assert.equal(M.easter(2026),'2026-04-05');assert.equal(M.easter(2027),'2027-03-28');assert.equal(M.blackFriday(2026),'2026-11-27');
 assert.equal(M.theme('natal','2026-11-13'),'natal');assert.equal(M.badge('auto','2026-11-13'),'Automático · Especial Libertadores');
});
test('cards: Super Quarta exige decisões coincidentes confirmadas',()=>{
 assert.equal(M.isSuperQuarta('2026-09-16'),true);assert.equal(M.isSuperQuarta('2026-07-15'),false);
 const e=[{date:'2030-07-17',title:'Copom: decisão Selic'},{date:'2030-07-17',title:'Fed: decisão juros'}];
 assert.equal(M.isSuperQuarta('2030-07-17',e),true);assert.equal(M.isSuperQuarta('2030-07-17',e.slice(0,1)),false);assert.equal(M.isSuperQuarta('2030-07-17',e.map(x=>({...x,title:'Ata '+x.title}))),false);assert.equal(M.isSuperQuarta('2030-07-17',e.map(x=>({title:x.title}))),false);
});
test('cards: datas locais e fusos preservam a data efetiva brasileira',()=>{
 assert.equal(M.dateKey('2026-11-13T11:13'),'2026-11-13');assert.equal(M.dateKey('2026-11-14T01:00:00Z'),'2026-11-13');assert.equal(M.dateKey('2026-02-30'),null);assert.equal(M.dateKey('inválida'),null);assert.deepEqual(M.week('2027-01-01'),['2026-12-28','2027-01-03']);
});
test('cards: pontos WIN e WDO são movimento favorável por contrato, sem multiplicar quantidade',()=>{
 assert.equal(M.points({ativo:'WINV26',side:'C',qty:3},207905,207410),-495);assert.equal(M.points({ativo:'WINV26',side:'V'},207905,207410),495);assert.equal(M.points({ativo:'WDOX26',side:'C'},5650,5662.5),12.5);
 for(const tk of ['BMF:WINV26','WINFUT','WIN1!','WIN'])assert.equal(M.future(tk),'WIN');assert.equal(M.future('WINNER'),null);assert.equal(M.points({ativo:'PETR4'},10,20),null);assert.equal(M.points({ativo:'WIN'},null,20),null);
});
test('cards: consolidação usa encerramento, não soma percentuais nem mistura pontos WIN/WDO',()=>{
 const row={id:'a',date:'2026-11-13',ticker:'WINV26',family:'WIN',points:-495,pnlBrl:-297,percent:-1,notionalBrl:1000};
 const rows=[row,{...row,id:'b',ticker:'WDOX26',family:'WDO',points:12.5,pnlBrl:125,percent:2,notionalBrl:3000},{...row,id:'c',pnlBrl:0,percent:0,points:0,notionalBrl:1000},row,{...row,id:'open',open:true},{...row,id:'other',date:'2026-11-16'},{...row,id:'unknown',pnlBrl:null},{...row,id:'no-date',date:undefined}];
 const r=M.aggregate(rows,'2026-11-13','week',10000);assert.equal(r.total,3);assert.equal(r.pnl,-172);assert.ok(Math.abs(r.winRate-100/3)<1e-9);assert.deepEqual(r.points,{WIN:-495,WDO:12.5});assert.equal(r.pctOperacoes,1);assert.equal(r.pctConta,-1.72);assert.deepEqual(r.tickers,['WINV26','WDOX26']);assert.equal(M.aggregate([{...row,notionalBrl:null}],'2026-11-13').pctOperacoes,null);assert.equal(M.aggregate([], '2026-11-13').winRate,null);
 const cross=M.aggregate([{...row,date:'2026-12-31'},{...row,id:'b',date:'2027-01-03'},{...row,id:'c',date:'2027-01-04'}],'2027-01-01','week');assert.equal(cross.total,2);
});
