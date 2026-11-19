'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('src/analysis/analises.js','utf8');
const start=source.indexOf('async function getGlobalSnapshot('),end=source.indexOf('function rankedSnapshot(',start);
const fn=source.slice(start,end);
test('v799: screener público não consulta Edge Functions diretamente em outage',()=>{
 assert.match(fn,/const endpoints=\[\{url:edgeUrl\+path,edge:true\}\]/);
 assert.doesNotMatch(fn,/\/functions\/v1\/screeners-quant/);
 assert.match(fn,/const data=\{\.\.\.stored\.data,_historical_cache:historical/);
});
test('v799: somente Workers HTTPS conhecido como destino e leitura condicional ETag',()=>{
 assert.match(fn,/dest\.hostname\.endsWith\('\.workers\.dev'\)/);
 assert.match(fn,/dest\.protocol==='https:'/);
 assert.match(fn,/If-None-Match/);
 assert.match(fn,/snapshotPending\.has\(market\)/);
});
test('v799: sem polling novo e sem alteração de outros módulos do aplicativo',()=>{
 assert.doesNotMatch(fn,/\bsetInterval\b|\/functions\/v1\/pesquisa/);
 assert.match(fn,/void snapshotDB\(market,record\)/);
});
