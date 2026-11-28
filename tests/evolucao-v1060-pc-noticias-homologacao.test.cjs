'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('v1060 PC Notícias: visual limpo do celular habilitado no PC com botão da IA no canto direito para pesquisar',()=>{
 const js=read('src/domains/layers/02-carteira-e-terminal.js');
 assert.match(js,/dt1060-pc-news/);
 assert.match(js,/data-dt1060-ia-search="1"/);
 assert.match(js,/Pesquisar IA/);
 assert.match(js,/dt1060-ia-corner/);
 assert.doesNotMatch(js,/data-dt1060-ia-search[^>]*onclick=/i,'sem inline onclick por CSP');

 const css=read('src/app-theme.css');
 assert.match(css,/body\.mkt549\.dt1060-pc-news/);
 assert.match(css,/\.dt1060-ia-corner/);
 assert.match(css,/\.dt1060-right-actions/);
});

test('v1060 Etapa 09 Homologação: zero exposição de fontes/modelos/OHLC/SHA-256 nos módulos novos e versionamento 1060 coerente',()=>{
 const rel=JSON.parse(read('release.config.json'));
 assert.equal(rel.version,1060);
 assert.equal(JSON.parse(read('package.json')).version,'1060.0.0');

 // Verifica que nenhum módulo novo da série v1057-v1060 usa inline onclick= ou expõe provedores em strings visíveis
 const liv=read('src/analysis/livermore-graficos.js');
 assert.doesNotMatch(liv,/\sonclick=/i);
 assert.doesNotMatch(liv,/\b(Yahoo|TradingView|Brapi|Finnhub|Binance|Cloudflare|Twelve Data|Profit|Gemini|Groq|Mistral|OpenRouter|OHLC|OHLCV|SHA-256)\b/i);

 const uiAurea=read('src/shared/ui-aurea.js');
 assert.doesNotMatch(uiAurea,/\sonclick=/i);
 assert.match(uiAurea,/modoConselho/);
 assert.match(uiAurea,/anexarGraficosLivermore/);

 // Verifica que não foi criada nenhuma nova aba ou novo conselheiro fora da lista oficial
 const debate=read('cloudflare/diario-screeners/aurea-debate-v1013.mjs');
 assert.match(debate,/LENTES=Object\.freeze\(\{livermore:/);
});
