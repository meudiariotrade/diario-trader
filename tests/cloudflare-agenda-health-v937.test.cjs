'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const load=()=>import('../cloudflare/diario-radar/agenda-health-v937.mjs');

test('v937: saúde da agenda publica somente estado, janela e horário UTC',async()=>{
 const calls=[];
 const env={AGENDA_CUTOVER_ENABLED:'1',HISTORICO:{prepare(sql){return{
  bind(...args){calls.push({sql,args});return this;},
  async all(){return{results:[
   {job:'notificar-leve-v724',ok:12,error:1,running:0,ultimo_slot:'2026-11-23T23:00'},
   {job:'email-semana',ok:1,error:0,running:0,ultimo_slot:'2026-11-23T00:00'}]}}
 }}}};
 const r=await (await load()).agendaHealthV937(env,Date.parse('2026-11-23T23:50:00Z'));
 assert.equal(r.status,200);
 const json=await r.json();
 assert.equal(json.enabled,true);assert.equal(json.total.ok,13);
 assert.equal(json.total.error,1);assert.equal(json.quantidade_jobs,16);
 assert.equal(json.estados[0].job,'notificar-leve-v724');
 assert.ok(!JSON.stringify(json).includes('token'));
 assert.match(json.observacao,/não a entrega/);
 assert.equal(calls.length,1);
 assert.equal(calls[0].args[0],'2026-11-22T23:50');
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('v937: indisponibilidade D1 não divulga estrutura privada',async()=>{
 const r=await (await load()).agendaHealthV937({AGENDA_CUTOVER_ENABLED:'1'});
 assert.equal(r.status,503);
 assert.equal((await r.json()).ok,false);
});
test('v937: retenção D1 corta apenas dados operacionais acima de 30 dias, uma vez ao dia',async()=>{
 const sqls=[],env={AGENDA_CUTOVER_ENABLED:'1',HISTORICO:{prepare(sql){return{
  bind(...x){sqls.push({sql,x});return this;},
  async run(){return{meta:{changes:4}}}
 }}}};
 const at=Date.parse('2026-11-23T03:07:00Z');
 assert.deepEqual(await (await load()).limparEstadosV937({cron:'* * * * *',scheduledTime:at-60000},env),{executou:false});
 const r=await (await load()).limparEstadosV937({cron:'* * * * *',scheduledTime:at},env);
 assert.equal(r.executou,true);assert.equal(r.removidos,8);
 assert.equal(sqls.length,2);
 assert.match(sqls[0].sql,/DELETE FROM agenda_runs_v932 WHERE slot < \?/);
 assert.match(sqls[1].sql,/DELETE FROM agenda_preflight_v933 WHERE slot < \?/);
 assert.equal(sqls[0].x[0],'2026-10-24T03:07');
 assert.deepEqual(await (await load()).limparEstadosV937({cron:'* * * * *',scheduledTime:at},{...env,AGENDA_CUTOVER_ENABLED:'0'}),{executou:false});
});
test('v937: nenhuma saída de dados pessoais para o provedor anônimo',async()=>{
 const {generate}=await import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs');
 const original=global.fetch,urls=[];
 global.fetch=async url=>{urls.push(String(url));throw Error('Não deveria requisitar '+url)};
 try{
  for(const mode of ['estudos','diario','coach']){
   const input='DADO PRIVADO: resultado de operações e documento de aula';
   const env={AI:{async run(){return{response:JSON.stringify({resultado:{resumo:'Análise baseada apenas nos dados fornecidos.'}})}}}};
   const out=await generate(env,input,mode);
   assert.match(out.text,/resultado/);
  }
  assert.deepEqual(urls,[]);
 }finally{global.fetch=original}
});
test('v937: integração preserva rota de saúde existente no Radar',()=>{
 const source=fs.readFileSync('cloudflare/diario-radar/producao-v892.mjs','utf8');
 const safety=fs.readFileSync('cloudflare/diario-screeners/aurea-resumao-v904.mjs','utf8');
 assert.match(source,/agendaHealthV937\(env\)/);
 assert.match(source,/limparEstadosV937\(controller,env\)/);
 assert.match(safety,/edition==='public'&&env\.ALLOW_PUBLIC_AI_FALLBACK==='1'/);
});
