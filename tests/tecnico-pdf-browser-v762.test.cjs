'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {withApp}=require('./helpers/app.cjs');
test('Dossiê Técnico Top 10: 42 páginas, 30 gráficos Canvas reais com médias, Fibo e ZigZag',{timeout:200000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 const result=await page.evaluate(async()=>{
  const candles=Array.from({length:280},(_,i)=>{
   const close=28+i*.09+Math.sin(i/7)*.65;
   return [1700000000+i*86400,close-.15,close+1,close-1,close,150000+i*500];
  });
  const pillars=[
   {name:'Tendência & Estrutura',weight:30,score:.75},
   {name:'Momentum / OBV / Força Relativa',weight:30,score:.75},
   {name:'Volume & Fluxo',weight:20,score:.75},
   {name:'Fibonaccing / Volatilidade / Risco',weight:20,score:.75}
  ];
  const side={eligible:true,valid:true,score:7.5,barCount:280,price:candles.at(-1)[4],pillars,flags:[],
   metrics:{mtf:true,obvConfirmed:true,rs:90,rvol:1.45,hvWeek:4.5,sma20:52,sma50:50,sma150:45,sma200:42},
   pisani:{pullback:true},minervini:{score:7},
   fib:{cluster:true,defense:[49,51],levels:[
    {r:0,price:55},{r:.236,price:53.8},{r:.382,price:52.2},{r:.5,price:51},
    {r:.618,price:50},{r:.764,price:48.8},{r:1,price:47.6},
    {r:1.11,price:56.2},{r:1.272,price:58},{r:1.414,price:60},{r:1.618,price:62}
   ]},turn:{confirmed:false,cisd:false},
   elliott:{label:'Indeterminada',reason:'Pivôs insuficientes',valid:false},
   plan:{entry:55,stop:52,target1:56.2,target2a:58,target2:60,targetFinal:62,rr:1.5}};
  const rows=Array.from({length:10},(_,i)=>({
   ticker:'T'+String(i).padStart(3,'0')+'3',source:'OHLCV fixture somente no teste',
   chartSource:'OHLCV fixture de regressão',chartTimeframe:'1d',chartCandles:candles,
   updatedAt:'2026-11-18',pdfSide:'buy',buy:side,sell:{eligible:false,score:0}
  }));
  let reject='';try{await window.DiarioTecnicoPDF.build('br',rows.slice(0,9),'1d')}catch(e){reject=e.message}
  const pdf=await window.DiarioTecnicoPDF.build('br',rows,'1d');
  return {pages:pdf.pages,bytes:pdf.blob.size,header:await pdf.blob.slice(0,8).text(),name:pdf.name,reject};
 });
 assert.match(result.reject,/exatamente 10/);
 assert.equal(result.pages,42,'capa + 10 fichas + 30 páginas gráficas + metodologia');
 assert.ok(result.bytes>90000,'PDF com 30 imagens Canvas deve conter conteúdo real');
 assert.match(result.header,/%PDF-/);
 assert.match(result.name,/Dossie-Tecnico-Brasil/);
 await page.close();
}));
