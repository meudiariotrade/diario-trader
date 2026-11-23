'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='cloudflare/diario-radar/';
const cut=fs.readFileSync(root+'pg-cron-corte-v935.sql','utf8');
const rollback=fs.readFileSync(root+'pg-cron-rollback-v935.sql','utf8');
const config=JSON.parse(fs.readFileSync(root+'wrangler.jsonc','utf8'));
const jobs=async()=> (await import('../cloudflare/diario-radar/agenda-v932.mjs')).JOBS_V932;
const listed=s=>{
 const block=s.split('alvo text[] := ARRAY[')[1]?.split(']')[0]||'';
 return [...block.matchAll(/'([a-z][a-z0-9_-]+)'/g)].map(x=>x[1]).sort();
};
test('v935: corte contém as 16 tarefas existentes no Worker, sem desativar terceiros',async()=>{
 const nomes=(await jobs()).map(j=>j.name).sort();
 assert.equal(nomes.length,16);
 assert.deepEqual(listed(cut),nomes);
 assert.deepEqual(listed(rollback),nomes);
 assert.match(cut,/encontrado<>16/);assert.match(rollback,/encontrado<>16/);
 assert.match(cut,/cron\.alter_job\(r\.jobid, active=>false\)/);
 assert.match(rollback,/cron\.alter_job\(r\.jobid, active=>true\)/);
 for(const text of [cut,rollback])assert.doesNotMatch(text.replace(/--[^\n]*/g,''),/\b(?:DROP|TRUNCATE|DELETE|edge_logs|postgres_logs)\b/i);
});
test('v935: cron Cloudflare ativo, preflight curto desligado e Auth preservado',()=>{
 assert.equal(config.vars.AGENDA_CUTOVER_ENABLED,'1');
 assert.equal(config.vars.AGENDA_PREFLIGHT_ENABLED,'0');
 assert.equal(config.vars.AGENDA_PREFLIGHT_FAST_V934,'0');
 assert.equal(config.vars.RADAR_CUTOVER_ENABLED,'0');
 assert.deepEqual(config.triggers.crons,['7,37 * * * *','*/15 13-20 * * MON-FRI','* * * * *']);
});
