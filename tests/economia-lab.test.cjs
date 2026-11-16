const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');

test('Estudos: mantém conteúdo anterior e abre laboratório com 14 ferramentas sem banner',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('https://**',r=>r.abort());
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{tab='estudos';ESV='liv';render()});
 await expect(p.locator('[data-eco-launch]')).toHaveCount(0);
 await expect(p.locator('.v596-sub [data-dt397-view="eco"]')).toBeVisible();
 await p.locator('.v596-sub [data-dt397-view="eco"]').click();
 await expect(p.locator('.eco-head h2')).toHaveText('Laboratório de Economia');
 await expect(p.locator('.eco-nav [data-eco-tool]')).toHaveCount(14);
 await expect(p.locator('.v596-sub [data-dt397-view]')).toHaveCount(4);
 await expect(p.locator('.eco-nav [data-eco-tool="mf"]')).toBeVisible();
 await expect(p.locator('.eco-root')).toContainText('Regra de Taylor');
 await p.locator('.eco-nav [data-eco-tool="mf"]').click();
 await expect(p.locator('.eco-root')).toContainText('Mundell');
 await expect(p.locator('.eco-nav [data-eco-tool="tempo"]')).toBeVisible();
 await p.locator('.eco-nav [data-eco-tool="tempo"]').click();
 await expect(p.locator('.eco-timeline>button')).toHaveCount(7);
 await p.locator('[data-eco-btn="evento"][data-v="6"]').click();
 await expect(p.locator('.eco-root')).toContainText('Lei Complementar 200/2023');
 await p.locator('.eco-nav [data-eco-tool="quiz"]').click();
 await expect(p.locator('[data-eco-btn="responder"]')).toHaveCount(4);
 await p.locator('[data-eco-btn="responder"][data-v="1"]').click();
 await expect(p.locator('.eco-root')).toContainText('Passo 1');
 await p.locator('[data-eco-btn="proxima"]').click();
 await expect(p.locator('.eco-root')).toContainText('Questão 2');
 await p.locator('.eco-nav [data-eco-tool="eco"]').click();
 await expect(p.locator('.eco-root')).toContainText('MQO');
 await p.evaluate(()=>{ESV='rpy';render()});
 await expect(p.locator('#app')).toContainText('Replay');
 await p.evaluate(()=>{ESV='liv';render()});
 await expect(p.locator('#app')).toContainText('Livros');
 assert.deepEqual(errs,[]);
}));
test('Economia: funções puras Taylor, Fisher, Mundell-Fleming e MQO',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('https://**',r=>r.abort());await p.goto(base+'/?demo=1');
 await p.locator('#splash').waitFor({state:'hidden'});
 const a=await p.evaluate(()=>{
  const L=window.EconomiaLab;
  return {t:L.taylor({meta:3,infl:4,neutro:2.5,hiato:0}),
   f:L.fisher(10,5),
   p:L.mf({fiscal:0,selic:0,externo:0}),fiscal:L.mf({fiscal:2,selic:0,externo:0}),
   m:L.mqo([1,2,3,4],[2,4,6,8])};
 });
 assert.equal(a.t,7);assert.ok(Math.abs(a.f-4.76190476)<.00001);
 assert.equal(a.p.y,100);assert.ok(a.fiscal.fx<0);assert.equal(a.fiscal.y,100);
 assert.ok(Math.abs(a.m.beta-2)<1e-10);assert.ok(Math.abs(a.m.alpha)<1e-10);
 assert.ok(Math.abs(a.m.r2-1)<1e-10);
}));
