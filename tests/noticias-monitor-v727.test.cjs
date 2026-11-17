const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const edge = fs.readFileSync('supabase/functions/notificar/index.ts','utf8');
const push = fs.readFileSync('supabase/functions/notificar/noticias-urgentes.ts','utf8');
const tela = fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
const agenda = fs.readFileSync('supabase/migrations/20261117124500_cron_noticias_urgentes_leve_v727.sql','utf8');
const status = fs.readFileSync('supabase/migrations/20261117124000_monitor_noticias_status_v727.sql','utf8');
test('v727: rota de notícias usa credencial do Vault em vez de CRON_SECRET ausente',()=>{
  const inicio=edge.indexOf("case 'noticias_urgentes':"), fim=edge.indexOf("case 'chave':",inicio);
  assert.ok(inicio>0 && fim>inicio);
  const trecho=edge.slice(inicio,fim);
  assert.match(trecho,/agendamentoAutorizado\(req\)/);
  assert.doesNotMatch(trecho,/segredoIgual\(req.headers.get\('x-cron-secret'\), CRON\)/);
  assert.match(trecho,/on\.urg/);
  assert.doesNotMatch(trecho,/on\.kw/);
  assert.match(trecho,/noticias_monitor_status/);
});
test('v727: cron só consulta feed 5 minutos no pregão e 15 fora dele',()=>{
  assert.match(agenda,/noticias-urgentes-leve-v727/);
  assert.match(agenda,/America\/Sao_Paulo/);
  assert.match(agenda,/then 5\s*else 15/);
  assert.match(agenda,/"acao":"noticias_urgentes"/);
  assert.doesNotMatch(agenda,/"acao":"tick"/);
  assert.match(agenda,/diario_agendamento_v724/);
});
test('v727: preferências independentes sem mudar Jornal e alertas do calendário',()=>{
  assert.match(edge,/urg: p\.on\?\.urg !== false/);
  assert.match(edge,/kw: p\.on\?\.kw !== false/);
  assert.match(tela,/a\("urg", "⚡ Notícias urgentes · Breaking News"\)/);
  assert.match(tela,/monitorNoticias/);
  assert.match(tela,/Agendamento automático:/);
});
test('v727: consumo limitado, cron não dispara feeds completos nem proxies em paralelo',()=>{
  assert.match(push,/coletarNoticias\(op\.token, agora, op\.fetcher \|\| fetch, 'leve'\)/);
  assert.match(push,/jaEnviados >= 12/);
  assert.match(push,/n >= 3/);
  assert.doesNotMatch(push,/Promise\.any\(urls\.map/);
  assert.match(status,/enable row level security/);
  assert.match(status,/revoke all on public\.noticias_monitor_status from public, anon, authenticated/);
});
