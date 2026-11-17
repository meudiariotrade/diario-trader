const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Jornal agendado compartilha Vault sem abrir IA a pedido anônimo',()=>{
 const a=fs.readFileSync('supabase/functions/analise/index.ts','utf8');
 const r=fs.readFileSync('supabase/functions/rotina-cron/index.ts','utf8');
 assert.match(a,/const expected = await check.json\(\)/);
 assert.match(a,/rpc\/diario_agendamento_chave/);
 assert.match(a,/doCron = dif === 0/);
 assert.match(a,/b.modo === 'cron_diagnostico'/);
 assert.match(a,/doCron \? 200 : 401/);
 assert.match(r,/const chave=CRON\|\|/);
 assert.match(r,/jornal_agendado/);
 assert.match(r,/if\(!util\)return out\(\{r:'fim de semana'\}\)/);
 assert.match(r,/body:JSON.stringify\(\{modo:'jornal',partes:false,force:false\}\)/);
});
