'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=p=>fs.readFileSync(p,'utf8');
test('v773: companyfacts gigante não trafega pelo Supabase',()=>{
 const cf=src('cloudflare/diario-screeners/index.mjs'),sb=src('supabase/functions/screeners-sync/index.ts');
 assert.match(cf,/\/v1\/sec-xbrl/);
 assert.match(cf,/data\.sec\.gov\/api\/xbrl\/companyfacts\/CIK/);
 assert.match(cf,/max-age=43200/);
 assert.match(cf,/20000000/);
 assert.match(cf,/sec-edgar-xbrl-compact/);
 assert.match(sb,/\/v1\/sec-xbrl\?cik=/);
 assert.doesNotMatch(sb,/const r=await secGet\(url,'data\.sec\.gov'\)/);
 assert.match(sb,/sec_source_url:url/);
 assert.match(sb,/quant_sec_xbrl_pendentes/);
});
test('v773: crescimento YoY exige 320-410 dias entre anuais e provas são parciais',()=>{
 const sb=src('supabase/functions/screeners-sync/index.ts');
 assert.match(sb,/gap>=320&&gap<=410/);
 assert.match(sb,/codigo_xbrl:x\.tag/);
 assert.match(sb,/validacao:'parcial; sem TTM homologado'/);
 assert.match(sb,/quant_sec_xbrl_status_bulk/);
 assert.match(sb,/priority==='xbrl'\?null/);
 const sql=src('supabase/migrations/20261118232000_analises_sec_xbrl_compacto_v773.sql');
 assert.match(sql,/xbrl_parcial_com_metrica/);
 assert.match(sql,/fundamentos_prova_status/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.quant_sec_xbrl_pendentes\(integer\) TO service_role/);
 assert.match(sql,/35 21 \* \* 1-5/);
 assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE|DELETE)\b/i);
});
