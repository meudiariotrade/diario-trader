const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const now=Date.parse('2026-11-27T00:50:00Z'),cols=['close','change','change_abs','Perf.1M','change|1M','update_time','update_mode'];
const req={body:JSON.stringify({symbols:{tickers:['SGX:FEF2!','TVC:GOLD']},columns:cols})};
test('FEF2 recupera o contínuo via consulta mínima, não troca por mensal disponível',async()=>{
 const m=await import('../cloudflare/diario-noticias/cotacoes-v954.mjs');let calls=0;
 const fetcher=async(u,o)=>{calls++;return calls===1?Response.json({data:[{s:'TVC:GOLD',d:[3550,-.2,-7,null,null,now/1000,'delayed']}]}):Response.json({data:[{s:'SGX:FEF2!',d:[88.7,-1.66,-1.5,now/1000,'delayed']},{s:'SGX:FEFZ2026',d:[88.8,-1.55,-1.4,now/1000,'delayed']}]})};
 const j=await (await m.scanMercadoV954(fetcher,'https://scanner.tradingview.com/futures/scan',req,now)).json();
 assert.equal(calls,2);assert.equal(j.data.length,2);const q=j.data.find(x=>x.s==='SGX:FEF2!');assert.equal(q.simboloFonte,'SGX:FEF2!');assert.equal(q.d[0],88.7);assert.equal(q.d[5],now/1000);
});
test('reserva mensal explícita preserva contrato, preço, ajuste e horário; nunca FEF1',async()=>{
 const m=await import('../cloudflare/diario-noticias/cotacoes-v954.mjs');let calls=0;assert.equal(m.segundoMesSGXV1029(now),'SGX:FEFZ2026');
 const fetcher=async()=>++calls===1?Response.json({data:[]}):Response.json({data:[{s:'SGX:FEF1!',d:[90.6,1,0.9,now/1000,'delayed']},{s:'SGX:FEFZ2026',d:[88.7,-1.66,-1.5,now/1000,'delayed']}]});
 const j=await (await m.scanMercadoV954(fetcher,'https://scanner.tradingview.com/global/scan',req,now)).json();assert.equal(j.data.length,1);assert.equal(j.data[0].simboloFonte,'SGX:FEFZ2026');
 const code=fs.readFileSync('src/shared/cache-publico.js','utf8'),at=new Date().toISOString(),w={document:{hidden:false},DiarioPublico:{peek:()=>null}},CQ={d:{cmd:{itens:[{s:'SGX:FEF2!',simboloFonte:'SGX:FEFZ2026',px:88.7,d1:-1.66,fechamentoAnterior:90.2,priceAt:at}]}}};
 vm.runInNewContext(code,{window:w,CQ,Date,Promise});const q=w.DiarioMarketData.get('TIO=F');assert.equal(q.quoteStatus,'referencia_mensal');assert.equal(q.px,88.7);assert.equal(q.simboloFonte,'SGX:FEFZ2026');
 CQ.d.cmd.itens[0].simboloFonte='SGX:FEF1!';assert.equal(w.DiarioMarketData.get('TIO=F'),null);
});
test('não repete consulta se contínuo veio válido; ausência não vira zero',async()=>{
 const m=await import('../cloudflare/diario-noticias/cotacoes-v954.mjs');let calls=0;const fetcher=async()=>{calls++;return Response.json({data:[{s:'SGX:FEF2!',d:[88.7,-1.66,-1.5,null,null,now/1000,'delayed']}]})};
 const j=await(await m.scanMercadoV954(fetcher,'https://scanner.tradingview.com/global/scan',req,now)).json();assert.equal(calls,1);assert.equal(j.data[0].d[1],-1.66);
});
