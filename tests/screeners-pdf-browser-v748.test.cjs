const test=require('node:test');const assert=require('node:assert/strict');
const {withApp}=require('./helpers/app.cjs');
test('PDF: gera capa, fichas dos ativos e metodologia com as bibliotecas já existentes',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 const result=await page.evaluate(async()=>{
  const make=(ticker)=>({ticker,empresa:'Companhia '+ticker,setor:'Energia',
   roe:18,roic:14,pl:10,ev_ebitda:7,fcf_yield:6,dividend_yield:6,payout_implicito:45,
   momentum_12_1:12,score_quant_br:65,cobertura_pct:95,
   fonte_principal:'Fonte de teste local',fundamentais_em:'2026-11-17',tecnicos_em:'2026-11-17',updated_at:'2026-11-17'});
  const result=await window.DiarioScreenersRelatorio.build('BR',[make('PETR4'),make('VALE3')]);
  return {pages:result.pages,bytes:result.blob.size,header:await result.blob.slice(0,8).text()};
 });
 assert.equal(result.pages,4,'capa + duas fichas + metodologia');
 assert.ok(result.bytes>12000,'PDF precisa conter texto e fontes');
 assert.match(result.header,/%PDF-/);
}));
