const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');

test('Terminal Pro: gráfico protagonista, navegação única, workspaces seguros e mobile empilhado',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:1600,height:950}}),app=page.locator('#app:not(.v503-fantasma)'),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 await page.locator('[data-dt393-action="menu"]').first().click();
 await page.locator('#dt394-drawer [data-dt393-route="term"]').first().click();
 await expect(app.locator('.trm.trm-pro #trgrid.pc')).toBeVisible();
 const info=await page.evaluate(()=>{
  const state=TRM.TS(),layout=TRM.layAtual(),graph=layout.g[0],monitor=layout.g[1];
  return {workspace:state.ws,panels:layout.p.slice(),graph,monitor,hasBrasil:!!state.wss.br,hasExterior:!!state.wss.ext,hasDefault:!!state.wss.pro};
 });
 assert.equal(info.workspace,'pro');
 assert.equal(info.panels[0],'PETR4 G');
 assert.equal(info.panels[1],'MON');
 assert.equal(info.panels[2],'TOP');
 assert.ok(info.graph.w/12>=.55&&info.graph.w/12<=.60);
 assert.ok(info.graph.h/26>=.65);
 assert.equal(info.monitor.x,0);
 assert.ok(info.hasBrasil&&info.hasExterior&&info.hasDefault);
 await expect(page.locator('#dt393-global-head nav.dt394-quicknav')).toBeHidden();
 const palette=await app.locator('.trm.trm-pro .trp').first().evaluate(el=>({background:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopColor}));
 assert.equal(palette.background,'rgb(15, 17, 21)');
 assert.equal(palette.border,'rgb(30, 34, 42)');
 await page.setViewportSize({width:390,height:844});
 await expect(app.locator('.trm.trm-pro #trgrid:not(.pc)')).toBeVisible();
 await expect(app.locator('.trm.trm-pro #trgrid .trp:visible')).toHaveCount(7);
 await expect(page.locator('[data-dt393-action="menu"]').first()).toBeVisible();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
}));
