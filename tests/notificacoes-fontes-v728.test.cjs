const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const sw=fs.readFileSync('src/service-worker.js','utf8');
const ui=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
const edge=fs.readFileSync('supabase/functions/notificar/index.ts','utf8');
const fontes=fs.readFileSync('supabase/functions/notificar/noticias-urgentes.ts','utf8');
const rss=fs.readFileSync('supabase/functions/noticias/index.ts','utf8');

test('v728: Service Worker registra somente horário/tag após showNotification',()=>{
 assert.match(sw,/diario-push-diagnostico-v1/);
 assert.match(sw,/await self\.registration\.showNotification/);
 assert.match(sw,/await pushDiagSalvar\('ultimo',d\.tag\|\|''\)/);
 assert.match(sw,/e\.waitUntil\(pushDiagSalvar\('clique'/);
 assert.doesNotMatch(sw,/put\(\{[^}]*body:/);
});
test('v728: diagnóstico mostra registro local e não confunde servidor com iPhone',()=>{
 assert.match(ui,/async function alPushLocalUltimos\(\)|function alPushLocalUltimos\(\)/);
 assert.match(ui,/Push processado no aparelho: ainda não confirmado/);
 assert.match(ui,/Inscrição deste aparelho no servidor:/);
 assert.match(ui,/endpoint: a\?\.endpoint \|\| ""/);
 assert.match(edge,/r\.aparelhoRegistrado = !!idLocal/);
 assert.match(edge,/\.eq\('subscription_id', idLocal\)/);
});
test('v728: feeds X têm fallback documentado, sequencial e sem RSSHub/Nitter',()=>{
 assert.match(fontes,/https:\/\/fixupx\.com/);
 assert.match(rss,/https:\/\/fixupx\.com/);
 assert.doesNotMatch(fontes,/rsshub\.app|nitter\.mie/);
 assert.match(fontes,/X_FALHA_ATE\.set\(perfil, Date\.now\(\) \+ 5 \* 60_000\)/);
 assert.match(fontes,/Promise\.allSettled/); 
});
