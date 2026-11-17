const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('CI não concorre em quatro navegadores Playwright ao mesmo tempo',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.equal(pkg.scripts.test,'node --test --test-concurrency=1 tests/*.test.cjs test-*.cjs');
});
test('relatório semanal independe de Resend e exige chave interna',()=>{
 const src=fs.readFileSync('supabase/functions/email-semana/index.ts','utf8');
 const action=src.indexOf("if (b.acao === 'rotina_semanal')");
 const provider=src.indexOf("if(!KEY)return new Response");
 assert.ok(action>0&&provider>action);
 const flow=src.slice(action,provider);
 assert.match(flow,/if \(!job\)/);
 assert.match(flow,/salvaResumo\(/);
 assert.match(flow,/if\(KEY&&x\.data\.emailSemana!==false\)/);
 assert.match(flow,/limit=150/);
 assert.match(flow,/semMigrarOperacoes:true/);
 assert.match(src,/on_conflict=user_id,semana_fim/);
});
test('Jornal, panorama e Push preservados no backend',()=>{
 const cron=fs.readFileSync('supabase/functions/rotina-cron/index.ts','utf8');
 assert.match(cron,/matinal_leve/);
 assert.match(cron,/jornal_agendado/);
 assert.match(cron,/fechamento/);
 const alerts=fs.readFileSync('supabase/functions/notificar/index.ts','utf8');
 assert.match(alerts,/noticias_urgentes/);
});
