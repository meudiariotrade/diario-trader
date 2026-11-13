const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');

test('Alertas isolados: Configurações, atalhos, atualização e retorno em celular e PC',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://**',r=>r.abort());
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 const check=async()=>{
  await p.waitForTimeout(250); // inclui os antigos redirecionamentos e decoradores assíncronos
  assert.equal(await p.evaluate(()=>MKT.tab),'al');
  await expect(app.locator('.m355-settings-head')).toBeVisible();
  await expect(p.locator('.dt393-title')).toHaveText('Configurações');
  await expect(app.locator('.m403-primary-tabs')).toHaveCount(0);
  await expect(app.locator('#v512-lsbtn')).toHaveCount(0);
 };
 await p.evaluate(()=>DiarioRotas.navigate('mais'));
 await app.locator('[data-navroute="mercado:al"]').click();await check();
 // Um render de dados não pode alterar o destino escolhido.
 await p.evaluate(()=>render());await check();
 await app.locator('.m355-crumb [data-navroute="mais"]').click();
 await expect(app.locator('.m355-alerts-link')).toBeVisible();
 for(const route of ['home','dia','ops','mercado:cq','mercado:ag','mercado:lab','estudos','term','mais']){
  await p.evaluate(r=>DiarioRotas.navigate(r),route);
  await p.evaluate(()=>DiarioRotas.navigate('mercado:al'));await check();
 }
 for(const width of [320,390,1440]){
  await p.setViewportSize({width,height:900});await check();
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sem transbordamento em '+width);
 }
 // Persistir e recarregar não depende de o usuário clicar de novo em Alertas.
 await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await p.reload();await p.locator('#splash').waitFor({state:'hidden'});await check();
 await p.getByRole('button',{name:'Mercado',exact:true}).last().click();
 await expect(app.locator('.m403-primary-tabs')).toBeVisible();
 await expect.poll(()=>p.evaluate(()=>MKT.tab)).toBe('cq');
 assert.deepEqual(errors,[]);
}));
