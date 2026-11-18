'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {withApp}=require('./helpers/app.cjs'),{stripTypeScriptTypes}=require('node:module');
const source=(p)=>fs.readFileSync(p,'utf8');
const ui=source('src/analysis/tecnico-ui.js');
const pdf=source('src/analysis/tecnico-pdf.js');
const research=source('src/analysis/pesquisa-pdf.js');
test('Cadeado Top 10: exatamente dez, sem inventar OHLCV, OBV, RS ou alvos',()=>{
 assert.match(ui,/rows\.length!==10/);
 assert.match(ui,/avisoPdfInsuficiente\(s,rows\.length\)/);
 assert.match(ui,/Encontrados /);
 assert.match(ui,/s\.loading\?'Aguarde a carga de candles/);
 assert.match(ui,/const ticket=w\.DiarioPDFiOS\?\.prepare\(\);[\s\S]*?await read\(key/);
 assert.match(ui,/prices\.every\(key=>Number\.isFinite\(plan\[key\]\)&&plan\[key\]>0\)/);
 assert.match(ui,/x\.metrics\?\.obvConfirmed/);
 assert.match(ui,/Number\.isFinite\(x\.metrics\.rs\)/);
 assert.match(pdf,/candlesPDF\(r\.chartCandles\)/);
 assert.match(pdf,/Array\.isArray\(raw\)\|\|raw\.length<250/);
 assert.match(pdf,/Math\.abs\(c\.at\(-1\)\.c-x\.price\)/);
 assert.match(pdf,/rows\.length!==10/);
});
test('Canvas técnico: 90 barras, SMA 20/50/150/200, OBV, Fibo e pivôs reais',()=>{
 for(const f of ['src/analysis/tecnico-ui.js','src/analysis/tecnico-pdf.js','src/analysis/pesquisa-pdf.js'])
  new vm.Script(source(f),{filename:f});
 assert.match(pdf,/canvas\.width=1320;canvas\.height=720/);
 assert.match(pdf,/const view=candles\.slice\(-90\)/);
 assert.match(pdf,/'#FFFFFF'/);
 assert.match(pdf,/'#E5E7EB'/);
 assert.match(pdf,/'#089981'/);
 assert.match(pdf,/'#F23645'/);
 for(const n of ['20','50','150','200'])assert.match(pdf,new RegExp("'SMA "+n+"'"));
 assert.match(pdf,/obv90=obv\.slice\(-90\)/);
 assert.match(pdf,/const fibLevels=/);
 assert.match(pdf,/x\.fib\?\.defense/);
 assert.match(pdf,/function swingsPDF/);
 assert.match(pdf,/x\.elliott\?\.valid/);
 assert.match(pdf,/function descricaoGrafico/); // limites e explicações devem estar documentados
});
test('Valuation: DCF com patrimônio residual negativo nunca vira preço-alvo negativo',()=>{
 let sourceCode=source('supabase/functions/pesquisa/relatorio.ts').replace(/^import .*;\s*$/gm,'').replace(/export /g,'');
 const ctx={Math,Number,String,Date,JSON,Intl,Array,Object,Map,Set,Error};
 vm.createContext(ctx);vm.runInContext(stripTypeScriptTypes(sourceCode,{mode:'transform'}),ctx);
 const f={ticker:'TEST',mercado:'EUA',moeda:'USD',preco:15,lpa:3,vpa:2,
  dividendos_12m:1,fcl:1e6,acoes:1e8,divida_total:1e11,caixa:0,setor:'Technology'};
 const v=ctx.valuation(f,null);
 assert.equal(v.dcf,null);
 assert.match(v.dcfMotivo,/não calculável/i);
 assert.match(v.dcfMotivo,/não é positivo/);
 assert.equal(ctx.din(-5,'USD'),'US$ -5,00','perdas financeiras legítimas não devem ser escondidas');
 assert.equal(ctx.dinPreco(-.75,'USD'),'não calculável');
});
test('Pesquisa: gráfico com 90 candles reais e níveis positivos; ausência de série não inventa gráfico',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 const data=await page.evaluate(async()=>{
  const base=Math.floor(Date.now()/86400000)*86400-90*86400;
  const candles=Array.from({length:90},(_,i)=>{const p=22+i*.12+Math.sin(i/5);return [base+i*86400,p-.2,p+1,p-1,p,100000+i*10]});
  const baseResult={id:'pdf-v767',resultado:{texto:'# Pesquisa técnica\\nDados reais somente quando documentados.',fontes:[],consultado_em:new Date().toISOString()}};
  const plain=await window.DiarioPesquisaPDF.build(baseResult);
  const item={ticker:'PETR4',timeframe:'1d',fonte:'Yahoo Finance Chart',as_of:new Date().toISOString(),candles,
   referencias:{preco:candles.at(-1)[4],graham:30,bazin:27,dcf:null,dcf_motivo:'Patrimônio projetado negativo'}};
  const withChart=await window.DiarioPesquisaPDF.build({...baseResult,resultado:{...baseResult.resultado,graficos_pdf:[item]}});
  return {plain:plain.pages,charts:withChart.pages,bytes:withChart.blob.size,header:await withChart.blob.slice(0,7).text()};
 });
 assert.equal(data.charts,data.plain+1);
 assert.ok(data.bytes>15000);
 assert.match(data.header,/%PDF-/);
 await page.close();
}));
