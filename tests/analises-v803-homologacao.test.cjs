'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run}=require('../scripts/analises-homologacao-v803.cjs');
test('v803: sete gates integrados locais sem invocar Supabase nem fontes privadas',()=>{
 const r=run();
 assert.equal(r.version,'v803');assert.equal(r.ok,true);
 assert.equal(r.checks,7);
 assert.match(r.claim,/não substitui/);
});
