'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../src/analysis/tecnico-engine.js');
const G=require('../src/analysis/livermore-graficos.js');
const read=p=>fs.readFileSync(p,'utf8');

function sampleCandles(len=320){
 return Array.from({length:len},(_,i)=>{
  const p=45+i*0.16+Math.sin(i/8)*2.8;
  return {t:Date.UTC(2024,0,1+i),o:p-0.25,h:p+1.3,l:p-1.3,c:p+0.15,v:220000+(i%7)*8000};
 });
}

test('v1058 Etapa 05: 4 gráficos oficiais separados (01 Tendência/OBV, 02 Retração, 03 Projeção, 04 Dow/Elliott/Polaridade)',()=>{
 assert.deepEqual(G.CHARTS.map(c=>c.id),['01','02','03','04']);
 assert.deepEqual(G.CHARTS.map(c=>c.kind),['trend','retracement','projection','structure']);
 const candles=sampleCandles(340);
 const analysis=E.one(candles,1,{tf:'1d',daily:candles});
 const bundle=G.renderAll({ticker:'PETR4',analysis,candles,tf:'1d'});
 assert.equal(bundle.charts.length,4);
 for(const ch of bundle.charts){
  assert.ok(ch.reading.length>40,'leitura técnica ausente no gráfico '+ch.id);
  assert.doesNotMatch(ch.reading,/\b(Yahoo|TradingView|Brapi|Finnhub|Binance|Cloudflare|Twelve Data|Sina|Profit|Gemini|Groq|Mistral|OpenRouter|OHLC|OHLCV|SHA-256)\b/i);
 }
 // Retração e Projeção são gráficos e leituras independentes
 assert.notEqual(bundle.charts[1].reading,bundle.charts[2].reading);
 assert.match(bundle.charts[1].title,/Retração de Fibonacci/);
 assert.match(bundle.charts[2].title,/Projeção de Fibonacci/);
});

test('v1058 Etapa 05: Síntese operacional (Mapa de Confluências + Cenários Comprador/Neutro/Vendedor + Fechamento)',()=>{
 const candles=sampleCandles(340);
 const analysis=E.one(candles,1,{tf:'1d',daily:candles});
 const syn=G.buildOperationalSynthesis('VALE3',analysis,candles,'1d');
 assert.ok(Array.isArray(syn.confluencias));
 assert.ok(syn.cenarios.comprador&&syn.cenarios.neutro&&syn.cenarios.vendedor);
 for(const k of ['comprador','neutro','vendedor']){
  assert.ok(syn.cenarios[k].gatilho.length>10);
  assert.ok(syn.cenarios[k].invalidacao.length>10);
 }
 assert.ok(syn.fechamento.includes('VALE3'));
 assert.doesNotMatch(syn.fechamento,/Yahoo|TradingView|Brapi|Finnhub|Binance|Cloudflare|Profit|Gemini|Groq|OHLC|SHA-256/i);

 const html=G.renderHtmlPanel({ticker:'VALE3',analysis,candles,tf:'1d',theme:'dark'});
 assert.match(html,/data-liv-suite="VALE3"/);
 assert.match(html,/Mapa de Confluências/);
 assert.match(html,/Cenários Condicionais/);
 assert.match(html,/Fechamento Consolidado/);
 assert.doesNotMatch(html,/\sonclick=/i,'proibido inline onclick por CSP');
});

test('v1058 Etapa 05: integração no bundle, index.html, tecnico-pdf.js e tecnico-ui.js sem expor provedores',()=>{
 const rel=JSON.parse(read('release.config.json'));
 assert.equal(rel.bundles['livermore-graficos.js'],'src/analysis/livermore-graficos.js');
 assert.match(read('src/index.html'),/livermore-graficos\.js/);
 const pdf=read('src/analysis/tecnico-pdf.js');
 assert.match(pdf,/async function buildLivermore/);
 assert.match(pdf,/shareLivermore/);
 assert.doesNotMatch(pdf,/Fonte: '\+String\(r\.chartSource/);
 const ui=read('src/analysis/tecnico-ui.js');
 assert.match(ui,/data-tech-livermore=/);
 assert.match(ui,/data-tech-liv-pdf=/);
 assert.doesNotMatch(ui,/Feed local Profit\/Finnhub\/Binance/);
});
