'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8');
const start=src.indexOf('if (s.TraderRadar332) return;');
const end=src.indexOf('(function (s, l)',start+100);
const radar=src.slice(start,end<0?undefined:end);
test('v944: Radar Proativo permanece disponível no Terminal com atualização manual',()=>{
 assert.ok(start>=0);
 assert.match(radar,/y\.textContent = "Radar Proativo"/);
 assert.match(radar,/y\.addEventListener\("click", J\)/);
 assert.match(radar,/function J\(\)[\s\S]{0,310}h\(!0\)/);
 assert.match(radar,/data-r332="reload"/);
 assert.match(radar,/C === "reload" && h\(!0\)/);
 assert.match(src,/Radar Global/);
});
test('v944: sem consulta a Supabase por intervalo mesmo com janela do Radar fechada',()=>{
 assert.doesNotMatch(radar,/setInterval\([\s\S]{0,250}O\.enabled[\s\S]{0,300}\bh\(\)/);
 assert.doesNotMatch(radar,/\}, 6e4\)/);
 assert.match(radar,/l\.addEventListener\("visibilitychange", \(\) => \{/);
 assert.match(radar,/painel\?\.open/);
 assert.match(radar,/!l\.hidden/);
 assert.match(radar,/O\.enabled/);
 assert.match(radar,/Date\.now\(\) - O\.updated > 5 \* 6e4/);
});
test('v944: Radar de sinais automático não é ativado por otimização de interface',()=>{
 const cfg=JSON.parse(fs.readFileSync('cloudflare/diario-radar/wrangler.jsonc','utf8'));
 assert.equal(cfg.vars.RADAR_CUTOVER_ENABLED,'0');
 assert.equal(cfg.vars.AGENDA_CUTOVER_ENABLED,'1');
 assert.doesNotMatch(radar,/diario-radar\.lucianosilva43567\.workers\.dev/);
});
