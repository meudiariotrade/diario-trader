const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v853: medianas do mercado inteiro, teto estimado marcado, avisos de valuation, conferência e PDF educativo',()=>{
 const a=fs.readFileSync('src/analysis/analises.js','utf8');
 for(const r of [/function medianasMercado\(m\)/,/med=medianasMercado\(m\)\|\|/,/Medianas do mercado inteiro/,/scr853-est/,/scr849-bar est/,/function avisoValuation/,/Setor cíclico/,/Banco\/seguradora/,/scr853-conf/,/data-scr-pdf-ficha/,/Ficha educativa/,/não é recomendação/])assert.match(a,r);
 const c=fs.readFileSync('analises.css','utf8');assert.match(c,/body\.scr853-imprimir #scr-detail/);
 const j=JSON.parse(fs.readFileSync('dados-publicos/cvm-historico.json','utf8'));const bb=j.empresas[j.tickers.BBAS3].a;
 assert.ok(Object.values(bb).every(v=>v.luc&&v.pl),'BBAS3 com lucro e patrimônio em todos os exercícios');
});
