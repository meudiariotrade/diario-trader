'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const pdf=fs.readFileSync('src/analysis/screeners-relatorio.js','utf8');
const app=fs.readFileSync('src/analysis/analises.js','utf8');
test('v798: relatório automático no app exige homologação antes de desenhar',()=>{
 assert.match(app,/automatic:true,requireVerified:true/);
 assert.match(pdf,/if\(opts\.requireVerified===true\)/);
 assert.match(pdf,/rows\.length!==10/);
 assert.match(pdf,/d\.difference>0\.1/);
});
test('v798: revisão de metadados do PDF não altera geometria editorial',()=>{
 assert.match(pdf,/doc\.setSubject\('Rastreabilidade do snapshot: SHA-256 '/);
 assert.match(pdf,/doc\.setKeywords/);
 // v1056: o rodapé visível não expõe mais SHA-256/fórmula; a rastreabilidade fica nos metadados do PDF.
 assert.match(pdf,/doc\.setKeywords\(\['quant_v2_score','sha256:'\+hash,'v798'/);
 assert.doesNotMatch(pdf,/drawText\('SHA-256 /);
 assert.match(pdf,/const W=595\.28,H=841\.89,M=43/);
 assert.doesNotMatch(pdf,/\bfetch\('https?:\/\/[^']+supabase/);
});
