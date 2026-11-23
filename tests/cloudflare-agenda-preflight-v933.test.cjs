'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
let funcs;
const ready=async()=>funcs||(funcs=await import('../cloudflare/diario-radar/agenda-preflight-v933.mjs')));
const environment=()=>{const lock=new Set(),writes=[];return {
 AGENDA_PREFLIGHT_ENABLED:'1',AGENDA_CUTOVER_ENABLED:'0',
 SUPABASE_URL:'https://vdzwydizostutukppcsj.supabase.co',
 SUPABASE_SERVICE_ROLE_KEY:'z'.repeat(55),CRON_SECRET:'k'.repeat(50),
 HISTORICO:{prepare(sql){let vals=[];return{bind(...args){vals=args;return this},
 async run(){if(sql.includes('INSERT OR IGNORE')){const key=vals.join(':');if(lock.has(key))return {meta:{changes:0}};lock.add(key);return{meta:{changes:1}}}
 writes.push({sql,vals});return{meta:{changes:1}}}}}},
 _writes:writes
 }};
};
const moment=Date.parse('2026-11-23T21:30:00.000Z');
test('v933: preflight avalia apenas horários fixos de 15 minutos UTC',async()=>{
 const env=environment();
 assert.equal((await ready()).preflightDueV933({cron:'* * * * *',scheduledTime:moment},env),true);
 assert.equal((await ready()).preflightDueV933({cron:'* * * * *',scheduledTime:moment+60000},env),false);
 assert.equal((await ready()).preflightDueV933({cron:'*/15 13-20 * * MON-FRI',scheduledTime:moment},env),false);
 assert.equal((await ready()).preflightDueV933({cron:'* * * * *',scheduledTime:moment},{AGENDA_PREFLIGHT_ENABLED:'0'}),false);
});
test('v933: 3 diagnósticos sem efeitos e idempotentes por slot',async()=>{
 const env=environment(),calls=[],prev=global.fetch;
 global.fetch=async(url,options)=>{
  calls.push({url:String(url),body:JSON.parse(options.body),header:options.headers['x-cron-secret']});
  return new Response(null,{status:200});
 };
 try{
  const ev={cron:'* * * * *',scheduledTime:moment};
  const r=await (await ready()).preflightV933(ev,env),again=await (await ready()).preflightV933(ev,env);
  assert.equal(r.ok,true);
  assert.equal(again.skipped,true);
  assert.equal(calls.length,3);
  assert.deepEqual(new Set(calls.map(x=>x.body.acao)),new Set(['diagnostico_leve','diagnostico','lista']));
  assert.ok(calls.every(x=>x.header===env.CRON_SECRET));
  assert.equal(env._writes.filter(x=>x.sql.includes('INSERT OR REPLACE')).length,3);
 }finally{global.fetch=prev}
});
test('v933: falha de autorização não altera configuração nem dispara ações reais',async()=>{
 const env=environment(),prev=global.fetch,acts=[];
 global.fetch=async(url,opt)=>{acts.push(JSON.parse(opt.body).acao);return new Response(null,{status:401})};
 try{
  const r=await (await ready()).preflightV933({cron:'* * * * *',scheduledTime:moment},env);
  assert.equal(r.ok,false);assert.ok(r.statuses.every(x=>x.ok===false));
  assert.deepEqual(acts.sort(),['diagnostico','diagnostico_leve','lista'].sort());
  assert.equal(env.AGENDA_CUTOVER_ENABLED,'0');
 }finally{global.fetch=prev}
});
test('v933: protocolo exige bindings e restringe destino fixo',async()=>{
 const env=environment();env.SUPABASE_URL='https://evil.example';
 await assert.rejects(async()=>(await ready()).preflightV933({cron:'* * * * *',scheduledTime:moment},env),/sem bindings/);
});
test('v933: endpoints de diagnóstico não têm escrituras nem envio',async()=>{
 for(const p of (await ready()).PROBES_V933)assert.ok(['diagnostico','diagnostico_leve','lista'].includes(p.payload.acao));
});
