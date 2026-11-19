'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/analysis/snapshot-contract-v800.js');
const b=()=>({ok:true,market:'BR',rows:[{ticker:'PETR4',score_quant_br:73}],
 universe_complete:true,universe_rows:[{ticker:'PETR4',score_quant_br:73}],
 last_update:'2026-11-18T18:00:00Z'});
test('v800: aceita snapshot público fechado e sem dados privados',()=>{
 const r=S.check(b(),{market:'BR',etag:'"sha256-123"'});
 assert.equal(r.valid,true);assert.equal(r.etagPresent,true);assert.equal(r.universeComplete,true);
});
test('v800: mercado/ticker/privacidade não cruzam cache',()=>{
 assert.equal(S.check(b(),{market:'US'}).valid,false);
 const a=b();a.rows[0].user_id='sensitive';
 assert.equal(S.check(a,{market:'BR'}).valid,false);
 const e=b();e.rows[0].ticker='PETR4';e.rows.push({...e.rows[0]});
 assert.equal(S.check(e,{market:'BR'}).valid,false);
});
test('v800: não aceita alegação de universo completo sem dados',()=>{
 assert.equal(S.check({...b(),universe_rows:undefined},{market:'BR'}).valid,false);
 const partial={...b(),universe_complete:false,universe_rows:undefined};
 const r=S.check(partial,{market:'BR'});
 assert.equal(r.valid,true);assert.equal(r.universeComplete,false);
});

test('v800: admite 1001 linhas públicas conforme contrato SQL atual',()=>{
 const rows=Array.from({length:1001},(_,i)=>({ticker:'T'+String(i).padStart(4,'0')}));
 const b={ok:true,market:'US',rows:rows.slice(0,250),universe_complete:true,
  universe_rows:rows,last_update:'2026-11-18T18:00:00Z'};
 assert.equal(S.check(b,{market:'US'}).valid,true);
});
