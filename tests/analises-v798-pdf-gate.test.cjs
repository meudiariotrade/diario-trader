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
 assert.match(pdf,/Fórmula quant_v2_score \/ app v798/);
 assert.match(pdf,/const W=595\.28,H=841\.89,M=43/);
 assert.doesNotMatch(pdf,/\bfetch\('https?:\/\/[^']+supabase/);
});
