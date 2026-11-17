const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const edge = fs.readFileSync('supabase/functions/notificar/index.ts','utf8');
const base = fs.readFileSync('supabase/migrations/20261117122000_agendamento_leve_base_v724.sql','utf8');
const cron = fs.readFileSync('supabase/migrations/20261117122500_agendamento_leve_cron_v724.sql','utf8');
test('v724: agendamento leve nunca consulta cotações, IA, Profit ou feeds externos',()=>{
 const s = edge.slice(edge.indexOf('async function tickLeve()'),edge.indexOf('// ---------- servidor ----------'));
 assert.ok(s.includes("from('push_subs')"));
 assert.ok(s.includes("from('push_calendario_eventos')"));
 assert.doesNotMatch(s,/await\s+eventos\s*\(|\bfetch\s*\(|briefingDados\s*\(|chamaAnalise\s*\(|precoAtraso\s*\(|operacoes_profit|carteira_relatorios|\.storage\(/);
 assert.match(s,/avisoDia\s*\(/);
 assert.match(s,/darfAvisos\s*\(/);
 assert.match(s,/avisoEstudo\s*\(/);
 assert.match(s,/p\.on\.ev/);
});
test('v724: a consulta pesada permanece desligada mesmo com cron antigo',()=>{
 assert.match(edge,/case 'tick':/);
 assert.match(edge,/ALLOW_HEAVY_NOTIFICATION_TICK/);
 assert.match(edge,/Ciclo pesado desativado/);
});
test('v724: calendário externo isolado e limitado a uma atualização a cada duas horas',()=>{
 assert.match(edge,/async function atualizarCalendarioPush\(\)/);
 assert.match(cron,/calendario-push-v724/);
 assert.match(cron,/17 \*\/2 \* \* \*/);
 assert.match(cron,/"acao":"atualizar_calendario"/);
 assert.match(cron,/"acao":"tick_leve"/);
 assert.doesNotMatch(cron,/"acao":"tick"/);
});
test('v724: segredo do scheduler no Vault e tabela sem acesso cliente',()=>{
 assert.match(base,/vault\.create_secret/);
 assert.match(base,/enable row level security/);
 assert.match(base,/revoke all on public\.push_calendario_eventos from anon, authenticated/);
 assert.match(base,/revoke all on function public\.diario_agendamento_chave\(\) from public, anon, authenticated/);
 assert.match(base,/grant execute on function public\.diario_agendamento_chave\(\) to service_role/);
 assert.match(cron,/vault\.decrypted_secrets/);
 assert.doesNotMatch(cron,/Authorization.*service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
