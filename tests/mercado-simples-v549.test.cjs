const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('Mercado: quatro abas estáveis, categorias e ordenação única',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:320,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 await p.evaluate(()=>{tab='mercado';render()});
 const tabs=app.locator('nav.m403-primary-tabs button:visible');
 await expect(tabs).toHaveText(['Cotações','Notícias','Agenda','Análises','Long & Short']);
 await expect(app.locator('.market-categories button[data-cqa]')).toHaveCount(10);
 await expect(app.locator('[data-market-order]')).toHaveValue('lista');
 await app.locator('[data-market-order]').selectOption('alta');
 await expect.poll(()=>p.evaluate(()=>CQ.ord)).toBe('alta');
 await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // v579: a aba Análises abre direto (o menu Mais só tinha Análises).
 await app.locator('nav.m403-primary-tabs [data-navroute="mercado:lab"]').click();
 await expect.poll(()=>p.evaluate(()=>MKT.tab)).toBe('lab');
 await expect(app.locator('nav.m403-primary-tabs [data-navroute="mercado:lab"]')).toHaveClass(/on/);
 for(const width of [390,1440]){await p.setViewportSize({width,height:900});await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 assert.deepEqual(errors,[]);
}));
