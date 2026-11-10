const{test}=require('node:test');const assert=require('node:assert/strict');const{expect}=require('playwright/test');const{withApp}=require('./helpers/app.cjs');
test('Início do Terminal: busca por assunto e comando, ações nativas, três modos e workspaces preservados',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),app=p.locator('#app:not(.v503-fantasma)'),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});await p.getByRole('button',{name:'Abrir Terminal',exact:true}).click();
 await expect(app.locator('#terminal-inicio')).toBeVisible();await expect(app.locator('#v421-gp')).toBeHidden();await expect(app.locator('#trgrid')).toBeHidden();
 const saved=await p.evaluate(()=>JSON.stringify(TRM.TS().wss));
 for(const width of [1440,1920,390,320]){
  await p.setViewportSize({width,height:1000});await expect(app.locator('.tf415-nav button:visible')).toHaveText(['Início','Gráficos','Painéis']);
  await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const min=await app.locator('#terminal-inicio .ti539-row:visible').first().evaluate(n=>n.getBoundingClientRect().height);assert.ok(min>=(width<=760?44:30));
 }
 await app.locator('#ti539-search').fill('juros');await expect(app.locator('[data-ti539-item="DIFUT"]')).toBeVisible();
 await app.locator('#ti539-search').fill('grafico');await expect(app.locator('[data-ti539-item="@graph"]')).toBeVisible();
 await app.locator('[data-ti539-item="@graph"]').click();await expect(app.locator('#v421-gp')).toBeVisible();await expect(app.locator('#terminal-inicio')).toBeHidden();
 await app.locator('.tf415-nav [data-tf415-nav="WORKSPACES"]').click();await expect(app.locator('#trgrid')).toBeVisible();await expect(app.locator('#v421-gp')).toBeHidden();
 await app.locator('[data-tr341-menu]').click();await expect(app.locator('#terminal-inicio')).toBeVisible();
 await expect(app.locator('#ti539-search')).toHaveValue('');
 assert.equal(await p.evaluate(()=>JSON.stringify(TRM.TS().wss)),saved);
 await p.keyboard.press('Control+k');await expect(app.locator('#ti539-search')).toBeFocused();
 await p.keyboard.press('Control+Space');await expect(p.locator('.trquick-dialog')).toBeVisible();await p.locator('.trquick-search').fill('ECO');await p.locator('.trquick-search').press('Enter');await expect(app.locator('#trgrid')).toBeVisible();await expect(app.locator('#terminal-inicio')).toBeHidden();
 await app.locator('[data-tr341-menu]').click();
 await p.evaluate(()=>{window.__executed=[];const real=DiarioTerminalTools.run;DiarioTerminalTools.run=function(value){window.__executed.push(value);return real(value)}});
 await app.locator('#ti539-search').fill('ECO');await app.locator('.ti539-search').evaluate(n=>n.requestSubmit());await expect.poll(()=>p.evaluate(()=>window.__executed.at(-1))).toBe('ECO');await expect(app.locator('#trgrid')).toBeVisible();
 await app.locator('[data-tr341-menu]').click();await app.locator('#ti539-search').fill('PETR4 G');await app.locator('.ti539-search').evaluate(n=>n.requestSubmit());await expect.poll(()=>p.evaluate(()=>window.__executed.at(-1))).toBe('PETR4 G');
 await app.locator('[data-tr341-menu]').click();await app.locator('#ti539-search').fill('planejar');await expect(app.locator('[data-ti539-item="@plan"]')).toBeVisible();
 await p.evaluate(()=>{window.__nativePlan=0;document.querySelector('#app:not(.v503-fantasma) [data-pre328]').addEventListener('click',()=>window.__nativePlan++,{once:true})});
 await app.locator('[data-ti539-item="@plan"]').click();assert.equal(await p.evaluate(()=>window.__nativePlan),1);
 assert.deepEqual(errors,[]);
}));
