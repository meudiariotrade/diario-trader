'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=p=>fs.readFileSync(p,'utf8');
test('v776: fila com 12 CIK e cooldown por ativo não sobrecarrega SEC',()=>{
 const sql=src('supabase/migrations/20261119001000_analises_xbrl_cadencia_v776.sql');
 assert.match(sql,/sec_xbrl_proxima_tentativa_em/);
 assert.match(sql,/sec_xbrl_falhas/);
 assert.match(sql,/quant_sec_xbrl_retry_batch/);
 assert.match(sql,/make_interval\(hours=>least\(168/);
 assert.match(sql,/sec_xbrl_proxima_tentativa_em IS NULL OR a.sec_xbrl_proxima_tentativa_em<=now\(\)/);
 assert.match(sql,/least\(12,greatest\(1/);
 assert.match(sql,/15 1,7,13,19 \* \* 1-5/);
 assert.equal((sql.match(/cron\.schedule\(/g)||[]).length,1);
 assert.doesNotMatch(sql,/\b(DROP|TRUNCATE|DELETE)\b/i);
});
test('v776: Cloudflare é fonte dos fatos e erros entram em cooldown em lote',()=>{
 const s=src('supabase/functions/screeners-sync/index.ts');
 assert.match(s,/\/v1\/sec-xbrl\?cik=/);
 assert.match(s,/priority==='xbrl'\)xbrlRetry.push/);
 assert.match(s,/quant_sec_xbrl_retry_batch/);
 assert.match(s,/xbrlRetry\.slice\(0,12\)/);
 assert.match(s,/xbrl_cooldown:emCooldown/);
 assert.doesNotMatch(s,/setInterval\(/);
});
