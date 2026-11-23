'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/20261123210000_movimentos_ativos_v941.sql','utf8');
const edge=fs.readFileSync('supabase/functions/movimentos/index.ts','utf8');
test('v941: RPC só devolve ID e tickers — nunca documento completo ou subscrição push',()=>{
 assert.match(sql,/RETURNS TABLE\(user_id uuid, ativos text\[\]\)/);
 assert.match(sql,/jsonb_array_elements/);
 assert.match(sql,/LIMIT 400/);
 assert.match(sql,/SELECT DISTINCT v\.ticker/);
 assert.doesNotMatch(sql,/SELECT\s+\*/i);
 assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE|CREATE TABLE|DELETE FROM|edge_logs|postgres_logs)\b/i);
});
test('v941: RPC com RLS invoker, nunca acessível a anônimos, auth ou PUBLIC',()=>{
 assert.match(sql,/SECURITY INVOKER/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.movimentos_ativos_v941\(\) FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.movimentos_ativos_v941\(\) TO service_role/);
 assert.doesNotMatch(sql,/SECURITY DEFINER/);
});
test('v941: Movimentos usa apenas tickers com fallback de compatibilidade e não muda alertas',()=>{
 const start=edge.indexOf('const ativosRPC = await db');
 assert.ok(start>0);
 const section=edge.slice(start,start+1500);
 assert.match(section,/rpc\/movimentos_ativos_v941/);
 assert.match(section,/Array\.isArray\(ativosRPC\)/);
 assert.match(section,/const D = \(await db\('diario\?select=user_id,data'\)/);
 assert.match(edge,/for \(const a of A\)/);
 assert.match(edge,/await manda\(s,/);
 assert.match(edge,/s\.prefs\?\.on\?\.acs !== false/);
});
test('v941: read-only melhoria não altera versão do contrato de notificações de outros serviços',()=>{
 assert.match(edge,//\* sem ponte \*\//);
 assert.match(edge,/push_subs\?select=id,user_id,sub,prefs/);
});
