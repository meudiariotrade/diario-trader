const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('v546: Estudos sem cabeçalho repetido e Mercado abrindo em Cotações sem rolagem lateral',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 await p.evaluate(()=>{tab='estudos';render()});
 await expect(app.locator('.dt397-hero')).toBeHidden();
 await p.evaluate(()=>document.querySelector('#app:not(.v503-fantasma) [data-dt397-view="aul"]').click());
 await expect(app.locator('.dt397-native-mount > header h2')).toHaveText('Aulas');
 await expect(app.locator('#v514-meta')).toBeHidden();
 await expect(app.locator('.e546-gerenciar')).toBeVisible();
 for(const width of [320,1440]){await p.setViewportSize({width,height:900});assert.equal(await app.locator('.dt397-dashboard').isVisible(),false)}
 await p.setViewportSize({width:320,height:900});
 await p.evaluate(()=>{tab='mercado';render()});
 assert.equal(await p.evaluate(()=>MKT.tab),'cq');
 await expect(app.locator('nav.m403-primary-tabs button').first()).toHaveText('Cotações');
 assert.ok(await app.locator('nav.m403-primary-tabs').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
 await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 assert.deepEqual(errors,[]);
}));
