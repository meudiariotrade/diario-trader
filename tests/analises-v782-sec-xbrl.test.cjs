'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const script=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');
const load=async()=>((await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(script))).default);
const company=(bad=false)=>{
 const r={accn:'0000320193-26-000010',form:'10-K',start:'2025-09-28',end:'2026-09-26',
  filed:'2026-11-10',fy:2026,fp:'FY',frame:'CY2026',val:150};
 return {cik:320193,entityName:'Fixture',facts:{
  'us-gaap':{
   Assets:{units:{USD:[{...r,start:undefined,val:200}],shares:[r]}},
   EarningsPerShareDiluted:{units:{'USD/shares':[{...r,val:5.2}],USD:[r]}},
   WeightedAverageNumberOfDilutedSharesOutstanding:{units:{shares:[{...r,val:123456789}]}}
  },
  dei:{EntityCommonStockSharesOutstanding:{units:{shares:[{...r,val:345678901}]}}}
 }};
};
test('v782: Cloudflare preserva EPS, ações, filing e tipagem sem dados privados',async()=>{
 const worker=await load(),oldFetch=globalThis.fetch,oldCache=globalThis.caches;
 globalThis.fetch=async()=>Response.json(company());
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 try{
  const r=await worker.fetch(new Request('https://example.workers.dev/v1/sec-xbrl?cik=0000320193'),{}, {waitUntil(){}});
  assert.equal(r.status,200);const body=await r.json();
  assert.equal(body.transformacao,'sec-xbrl-compact-v782');
  assert.equal(body.facts['us-gaap'].Assets.units.USD[0].start,null);
  assert.equal(body.facts['us-gaap'].EarningsPerShareDiluted.units['USD/shares'][0].val,5.2);
  assert.ok(!body.facts['us-gaap'].EarningsPerShareDiluted.units.USD);
  assert.ok(!body.facts['us-gaap'].Assets.units.shares);
  assert.equal(body.facts.dei.EntityCommonStockSharesOutstanding.units.shares[0].val,345678901);
  assert.equal(body.facts['us-gaap'].WeightedAverageNumberOfDilutedSharesOutstanding.units.shares[0].fp,'FY');
  assert.equal(body.facts['us-gaap'].WeightedAverageNumberOfDilutedSharesOutstanding.units.shares[0].accn,'0000320193-26-000010');
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCache}
});
test('v782: SEC com filed anterior ao end é recusada, não fabrica observações',async()=>{
 const worker=await load(),oldFetch=globalThis.fetch,oldCache=globalThis.caches;
 const bad=company();bad.facts['us-gaap'].Assets.units.USD[0].filed='2026-08-01';
 globalThis.fetch=async()=>Response.json(bad);
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 try{
  const r=await worker.fetch(new Request('https://example.workers.dev/v1/sec-xbrl?cik=0000320193'),{}, {waitUntil(){}});
  assert.equal(r.status,200);
  const body=await r.json();
  assert.ok(!body.facts['us-gaap'].Assets);
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCache}
});
