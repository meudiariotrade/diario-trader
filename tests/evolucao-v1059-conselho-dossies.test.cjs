'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

test('v1059 Etapa 06: Conselho suporta modos Objetivo e Completo com debate e divergência real sem duplicar interface',()=>{
 const debate=read('cloudflare/diario-screeners/aurea-debate-v1013.mjs');
 assert.match(debate,/MODO COMPLETO:/);
 assert.match(debate,/MODO OBJETIVO:/);
 assert.match(debate,/divergências materiais reais/);
 assert.match(debate,/return json\(\{ok:true,modo,resultado/);

 const ui=read('src/shared/ui-aurea.js');
 assert.match(ui,/data-uim-modo="objetivo"/);
 assert.match(ui,/data-uim-modo="completo"/);
 assert.match(ui,/modoConselho/);
 assert.match(ui,/anexarGraficosLivermore/);
 assert.doesNotMatch(ui,/\sonclick=/i);

 const core=read('src/domains/core/07-conta-e-integracoes.js');
 assert.match(core,/DiarioAureaUI\?\.modoConselho\?\.\(\)/);
});

test('v1059 Etapas 07+08: Dossiê Completo de 18 capítulos adaptados ao ativo e PDF Graham fundamentalista',()=>{
 const src=read('src/analysis/pesquisa-pdf.js');
 const sandbox={window:{}};
 vm.runInNewContext(src,sandbox);
 const api=sandbox.window.DiarioPesquisaPDF;
 assert.equal(typeof api.DOSSIE_18_CAPITULOS,'function');
 assert.equal(typeof api.buildGraham,'function');
 assert.equal(typeof api.buildDossie18,'function');

 for(const tipo of ['acao_br','acao_us','fii','etf','cripto']){
  const caps=api.DOSSIE_18_CAPITULOS(tipo);
  assert.equal(caps.length,18,'dossiê deve ter exatamente 18 capítulos para '+tipo);
  for(const c of caps){
   assert.doesNotMatch(c,/\b(Yahoo|TradingView|Brapi|Finnhub|Binance|Cloudflare|Profit|Gemini|Groq|OHLC|SHA-256)\b/i);
  }
 }
 // Adaptação real por tipo de ativo
 assert.match(api.DOSSIE_18_CAPITULOS('acao_br')[3],/Selic/);
 assert.match(api.DOSSIE_18_CAPITULOS('acao_us')[3],/Fed/);
 assert.match(api.DOSSIE_18_CAPITULOS('fii')[4],/Imobiliário/);
 assert.match(api.DOSSIE_18_CAPITULOS('etf')[4],/Índice/);
 assert.match(api.DOSSIE_18_CAPITULOS('cripto')[4],/Tokenomics/);
 // Capítulos 11 a 14 dedicados aos 4 Gráficos Oficiais do Livermore (1 página por gráfico)
 const br=api.DOSSIE_18_CAPITULOS('acao_br');
 assert.match(br[10],/Gráfico 01/);
 assert.match(br[11],/Gráfico 02/);
 assert.match(br[12],/Gráfico 03/);
 assert.match(br[13],/Gráfico 04/);
});
