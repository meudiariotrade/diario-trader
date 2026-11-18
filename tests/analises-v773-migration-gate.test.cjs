'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/20261118232000_analises_sec_xbrl_compacto_v773.sql','utf8');
test('v773: migration contém os 2 blocos SQL íntegros e um cron só',()=>{
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION /g)||[]).length,2);
 assert.equal((sql.match(/\$fn\$/g)||[]).length,4);
 assert.equal((sql.match(/\$cron\$/g)||[]).length,2);
 assert.equal((sql.match(/cron\.schedule\('screeners-sec-xbrl-v773'/g)||[]).length,1);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.quant_sec_xbrl_status_bulk[\s\S]+BEGIN[\s\S]+WHERE a\.active[\s\S]+GET DIAGNOSTICS n=ROW_COUNT;[\s\S]+END \$fn\$;/);
 assert.ok(sql.indexOf('GET DIAGNOSTICS n=ROW_COUNT')<sql.indexOf('cron.schedule('));
 assert.ok(sql.indexOf('ALTER TABLE')<sql.indexOf('cron.schedule('));
 assert.match(sql,/TO service_role/);
 assert.doesNotMatch(sql,/\b(DROP|TRUNCATE|DELETE)\b/i);
});
