'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {withApp}=require('./helpers/app.cjs');
test('Dossiê Técnico: PDF editorial válido com capa, score auditável, ficha e metodologia',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 const result=await page.evaluate(async()=>{
  const pillars=[
   {name:'Tendência & Estrutura',weight:30,score:.75},
   {name:'Momentum / OBV / Força Relativa',weight:30,score:.75},
   {name:'Volume & Fluxo',weight:20,score:.75},
   {name:'Fibonaccing / Volatilidade / Risco',weight:20,score:.75}
  ];
  const side={eligible:true,valid:true,score:7.5,barCount:300,pillars,flags:[],
   metrics:{mtf:true,obvConfirmed:true,rvol:1.45,hvWeek:4.5},
   fib:{cluster:true},turn:{confirmed:false,cisd:false},elliott:{label:'Indeterminada',reason:'Pivôs insuficientes'},
   plan:{entry:35.2,stop:32.8,target1:37.3,target2a:38.4,target2:39.7,targetFinal:41.1,rr:1.87}};
  const row={ticker:'PETR4',source:'Yahoo Chart - série de teste',updatedAt:'2026-11-18',buy:side,sell:{eligible:false,score:1}};
  const result=await window.DiarioTecnicoPDF.build('br',[row],'1d');
  return {pages:result.pages,bytes:result.blob.size,header:await result.blob.slice(0,8).text(),name:result.name};
 });
 assert.equal(result.pages,3,'capa, ficha, metodologia');
 assert.ok(result.bytes>10000,'deve incorporar as fontes e os textos');
 assert.match(result.header,/%PDF-/);
 assert.match(result.name,/Dossie-Tecnico-Brasil/);
}));
