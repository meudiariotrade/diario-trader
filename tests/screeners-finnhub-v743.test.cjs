const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('supabase/functions/screeners-finnhub/index.ts','utf8');
test('Coleta Finnhub permanece isolada no servidor e exige segredo de cron',()=>{
 new vm.Script(source);
 assert.match(source,/diario_agendamento_chave/);
 assert.match(source,/finnhub_chave/);
 assert.match(source,/quant_screeners_finnhub_pendentes/);
 assert.match(source,/quant_screeners_finnhub_patch/);
 assert.match(source,/p_limit:20/);
 assert.doesNotMatch(source,/Deno\.env\.get\(['"]SUPABASE_ANON_KEY/);
});
test('Indicadores referem métricas reais e não inventam yield de recompras',()=>{
 for(const t of ['forwardPE','forwardPEG','currentEv/freeCashFlowTTM','revenueGrowthTTMYoy','epsGrowthTTMYoy'])assert.ok(source.includes(t),t);
 assert.doesNotMatch(source,/buyback_yield|total_shareholder_yield/);
});
test('Processamento não consome API em loop e respeita erros 429',()=>{
 assert.doesNotMatch(source,/setInterval\(|setTimeout\(|subscribe\(/);
 assert.match(source,/r\.status===429/);
});
