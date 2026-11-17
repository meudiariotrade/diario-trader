const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {withApp}=require('./helpers/app.cjs');
const txt=p=>fs.readFileSync(p,'utf8');

test('v711: HTML carrega config do Supabase principal antes do núcleo',()=>{
 const html=txt('src/index.html');
 assert.match(html,/src="config\.js\?v=__APP_VERSION__"/);
 assert.ok(html.indexOf('src="config.js?v=__APP_VERSION__"')<html.indexOf('src="nucleo-v560.js?v=__APP_VERSION__"'));
 assert.ok(txt('config.js').includes('https://vdzwydizostutukppcsj.supabase.co'));
 assert.ok(JSON.parse(txt('release.config.json')).version >= 711);
});
test('v711: service worker mantém config.js na publicação e valida a versão online',()=>{
 const sw=txt('src/service-worker.js');
 assert.ok(sw.includes('"config.js"'));
 assert.ok(sw.includes("const APP_VERSION='__APP_VERSION__'"));
 assert.match(sw,/response\.clone\(\)\.text\(\)/);
 assert.match(sw,/html\.includes\('config\.js\?v='\+APP_VERSION\)/);
 assert.match(sw,/return offline\|\|fetch\(event\.request\)/);
});
test('v711: cache de bloqueio e sessão são isolados por projeto, Auth não é bloqueado',()=>{
 const src=txt('src/domains/core/02-estado-e-persistencia.js');
 assert.ok(src.includes("const ehAuth = /^\\/auth\\/v1\\//.test(e);"));
 assert.match(src,/quota\.projeto !== s\.url/);
 assert.match(src,/!ehAuth && window\.DiarioNuvemQuota/);
 assert.match(src,/bloqueado = i\.status === 402 && !ehAuth/);
 assert.match(src,/window\.DiarioNuvemQuota = \{ projeto:s\.url/);
});
test('v711: configuração do projeto novo é realmente carregada no navegador', {timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage();
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 assert.equal(await page.evaluate(()=>window.SUPA_URL),'https://vdzwydizostutukppcsj.supabase.co');
 assert.equal(await page.evaluate(()=>cfg().url),'https://vdzwydizostutukppcsj.supabase.co');
 await page.close();
}));
