const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const app=read('src/analysis/analises.js');
const sync=read('supabase/functions/screeners-sync/index.ts');
const sec=read('supabase/functions/screeners-sec/index.ts');
const css=read('analises.css');
test('Campos financeiros válidos de BR e EUA, sem substituir Forward P/E por trailing',()=>{
 assert.match(sync,/enterprise_value_ebitda_current/);
 assert.match(sync,/free_cash_flow_ttm/);
 assert.match(sync,/dividend_payout_ratio_ttm/);
 assert.match(sync,/price_earnings_growth_ttm/);
 assert.match(sync,/enterprise_value_to_free_cash_flow_ttm/);
 assert.match(sync,/price_earnings_forward_fy/);
 assert.doesNotMatch(sync,/forward_pe:lookup\('price_earnings_ttm'\)/);
});
test('Buyback yield exige fonte verificável, não confunde redução de ações com DY',()=>{
 assert.match(sec,/PaymentsForRepurchaseOfCommonStock/);
 assert.match(sec,/buyback_yield/);
 assert.match(sync,/Buyback yield nao pode ser confundido/);
 assert.match(sec,/A SEC bloqueou/);
});
test('Banco de mercado não recebe dados pessoais da Carteira',()=>{
 assert.match(app,/w\.pfCalc\(\)/);
 assert.doesNotMatch(sync,/S\.cart\.lanc/);
 assert.doesNotMatch(sec,/auth\.users|S\.cart|user_id/);
});
test('Painel exibe cobertura auditável com campos ausentes e sem duplicar telas',()=>{
 new vm.Script(app);
 assert.match(app,/function coverage\(m,s\)/);
 assert.match(app,/cobertura_media_pct/);
 assert.match(app,/cobertura_pct','Cobertura/);assert.match(app,/row\[COB\[0\]\]/);
 assert.match(css,/\.scr-coverage/);
 assert.match(css,/#11141b|var\(--dt-s1\)/i);
 assert.match(css,/#d4a017/i);
});
test('Ingestão em lotes e APIs restritas no servidor',()=>{
 assert.match(sync,/p_limit:max/);
 assert.match(sync,/Math\.min\(200/);
 assert.match(sec,/diario_agendamento_chave/);
 assert.doesNotMatch(sync,/setInterval\(/);
 assert.doesNotMatch(sec,/setInterval\(/);
 assert.match(sec,/status===403/);
});
test('Release não retrocede e já está em 743',()=>{
 const cfg=JSON.parse(read('release.config.json'));
 assert.ok(cfg.version>=743);
});
