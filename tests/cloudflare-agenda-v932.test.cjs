'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const importAgenda=()=>import('../cloudflare/diario-radar/agenda-v932.mjs');
const ms=iso=>Date.parse(iso);
test('v932: os 16 jobs antigos estão representados e a execução é opt-in',async()=>{
 const {JOBS_V932}=await importAgenda();
 const conf=JSON.parse(fs.readFileSync('cloudflare/diario-radar/wrangler.jsonc','utf8'));
 assert.equal(JOBS_V932.length,16);
 assert.equal(new Set(JOBS_V932.map(x=>x.name)).size,16);
 assert.deepEqual(conf.triggers.crons,['7,37 * * * *','*/15 13-20 * * MON-FRI','* * * * *']);
 assert.equal(conf.vars.AGENDA_CUTOVER_ENABLED,'1');
 assert.equal(conf.vars.AGENDA_PREFLIGHT_ENABLED,'0');
 assert.equal(conf.keep_vars,true);
});
test('v932: preserva UTC e dias úteis dos gatilhos que migraram',async()=>{
 const {jobsAtV932}=await importAgenda();
 const names=x=>jobsAtV932(ms(x)).map(j=>j.name);
 const x=names('2026-11-23T12:00:00Z');
 for(const s of ['movimentos','noticias-urgentes-leve-v727','notificar-leve-v724','resumo-tick'])assert.ok(x.includes(s),s);
 assert.ok(names('2026-11-22T12:00:00Z').includes('notificar-leve-v724'));
 assert.ok(!names('2026-11-22T12:00:00Z').includes('movimentos'));
 assert.ok(names('2026-11-23T10:30:00Z').includes('jornal-mesa'));
 assert.ok(names('2026-11-23T10:45:00Z').includes('jornal-mesa-retentativa'));
 assert.ok(names('2026-11-23T11:00:00Z').includes('jornal-mesa-retentativa-2'));
 assert.ok(names('2026-11-23T09:50:00Z').includes('rotina-matinal'));
 assert.ok(names('2026-11-23T14:50:00Z').includes('rotina-almoco'));
 assert.ok(names('2026-11-23T20:45:00Z').includes('rotina-fechamento'));
 assert.ok(names('2026-11-23T21:20:00Z').includes('rotina-tarde'));
 assert.ok(names('2026-11-23T00:00:00Z').includes('email-semana'));
 assert.ok(names('2026-11-23T13:10:00Z').includes('insiders'));
 assert.ok(names('2026-11-23T03:50:00Z').includes('movimentos-limpa'));
 assert.ok(names('2026-11-23T03:00:00Z').includes('push-log-limpa'));
 assert.ok(names('2026-11-23T00:17:00Z').includes('calendario-push-v724'));
 assert.deepEqual(names('2026-11-23T03:51:00Z'),[]);
});
test('v932: sem ativar o corte não chama Supabase nem modifica D1',async()=>{
 const {runAgendaV932}=await importAgenda();
 const old=global.fetch;let count=0;global.fetch=async()=>{count++;return new Response(null,{status:204})};
 try{assert.deepEqual(await runAgendaV932({cron:'* * * * *',scheduledTime:ms('2026-11-23T12:00:00Z')},{AGENDA_CUTOVER_ENABLED:'0'}),{enabled:false,results:[]});assert.equal(count,0)}
 finally{global.fetch=old}
});
test('v932: com corte ativo, lock D1 impede envios duplicados no mesmo minuto',async()=>{
 const {runAgendaV932}=await importAgenda();
 const calls=[],locked=new Set(),updates=[];
 const env={AGENDA_CUTOVER_ENABLED:'1',SUPABASE_URL:'https://vdzwydizostutukppcsj.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'s'.repeat(48),CRON_SECRET:'c'.repeat(32),
 HISTORICO:{prepare(sql){let args=[];return{
 bind(...values){args=values;return this},
 async run(){if(sql.startsWith('INSERT')){const k=args[0]+':'+args[1];if(locked.has(k))return {meta:{changes:0}};locked.add(k);return {meta:{changes:1}}}
 updates.push({sql,args});return {meta:{changes:1}}}
 }}}};
 const old=global.fetch;global.fetch=async(url,init)=>{
  assert.equal(init.redirect,'manual');
  assert.match(String(url),/^https:\/\/vdzwydizostutukppcsj\.supabase\.co\//);
  assert.equal(init.headers.Authorization,'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(init.headers['x-cron-secret'],env.CRON_SECRET);
  calls.push({url:String(url),init});return new Response(null,{status:204});
 };
 try{
  const e={cron:'* * * * *',scheduledTime:ms('2026-11-22T03:50:00Z')};
  const a=await runAgendaV932(e,env),b=await runAgendaV932(e,env);
  assert.equal(a.results.length,2);assert.equal(b.results.filter(x=>x.skipped).length,2);
  assert.equal(calls.length,2);assert.equal(updates.length,2);
  assert.ok(calls.some(x=>x.url.includes('/rest/v1/movimentos?dia=lt.')));
  assert.ok(calls.every(x=>x.init.method==='DELETE'||x.init.method==='POST'));
 }finally{global.fetch=old}
});
test('v932: recusa base indevida ou ausência de segredos e não tenta conexão externa',async()=>{
 const {validateAgendaV932,runAgendaV932}=await importAgenda();
 assert.equal(validateAgendaV932({SUPABASE_URL:'https://evil.example',CRON_SECRET:'x'.repeat(30),SUPABASE_SERVICE_ROLE_KEY:'s'.repeat(50),HISTORICO:{}}),false);
 await assert.rejects(()=>runAgendaV932({cron:'* * * * *',scheduledTime:ms('2026-11-23T12:00:00Z')},{AGENDA_CUTOVER_ENABLED:'1'}),/sem credenciais/);
});

test('v943: notícias são 5min na janela BRT e 15min à noite e aos fins de semana',async()=>{
 const {jobsAtV932}=await importAgenda();
 const due=(iso,name)=>jobsAtV932(ms(iso)).some(j=>j.name===name);
 const news='noticias-urgentes-leve-v727',leves='notificar-leve-v724';
 assert.equal(due('2026-11-23T12:05:00Z',news),true); // segunda 09h05 BRT
 assert.equal(due('2026-11-23T20:10:00Z',news),true); // segunda 17h10 BRT
 assert.equal(due('2026-11-23T21:05:00Z',news),false); // segunda 18h05 BRT
 assert.equal(due('2026-11-23T21:15:00Z',news),true);
 assert.equal(due('2026-11-22T12:05:00Z',news),false); // domingo
 assert.equal(due('2026-11-22T12:15:00Z',news),true);
 assert.equal(due('2026-11-22T12:05:00Z',leves),true); // alerta de horário preservado
 assert.equal(due('2026-11-23T21:05:00Z',leves),true);
});
