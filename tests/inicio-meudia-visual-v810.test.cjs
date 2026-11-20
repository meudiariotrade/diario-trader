const { test } = require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const { expect }=require('playwright/test');
const { withApp }=require('./helpers/app.cjs');

test('v810 E2E: duas telas, três fases, override/auto, CLS, overflow e captura iPhone/desktop',{timeout:180000},async()=>withApp(async(browser,base)=>{
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['iphone',390,844],['desktop',1440,900]]){
  const page=await browser.newPage({viewport:{width,height},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.abort());
  await page.goto(base+'/?demo=1',{waitUntil:'load'});
  await page.locator('#splash').waitFor({state:'hidden'});
  for(const [phase,iso] of [['pre','2026-11-19T11:00:00Z'],['pregao','2026-11-19T13:40:00Z'],['pos','2026-11-19T22:30:00Z']]){
   await page.clock.setFixedTime(new Date(iso));
   await page.evaluate(()=>{tab='home';render();});
   const home=page.locator('#app .v810-home');
   await expect(home).toBeVisible({timeout:10000});
   await expect(home).toHaveAttribute('data-v810-phase',phase);
   await expect(home.locator(':scope > .dt670-opening')).toHaveCount(1);
   await expect(home.locator(':scope > .v4-iacard')).toHaveCount(1);
   await page.screenshot({path:'test-results/v810-'+name+'-inicio-'+phase+'.png',fullPage:false});
   const g=await page.evaluate(()=>{
     const el=document.querySelector('#app .v810-home');
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,full:el?.getBoundingClientRect().width||0};
   });
   assert.equal(g.overflow,false,'Início sem overflow: '+name+' '+phase);
   if(width>=1024)assert.ok(g.full>1100,'Início usa largura real do desktop');
   await page.evaluate(()=>{tab='dia';render();});
   const dia=page.locator('#app .v810-day');
   await expect(dia).toBeVisible();
   await expect(dia).toHaveAttribute('data-v810-phase',phase);
   await expect(dia.locator(':scope > .dt670-opening')).toHaveCount(1);
   await expect(dia.locator('.v810-day-context[data-intel-etapa1]')).toHaveCount(1);
   await expect(dia.getByText('Plano do dia',{exact:true})).toBeVisible();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Meu Dia sem overflow');
   await page.screenshot({path:'test-results/v810-'+name+'-meudia-'+phase+'.png',fullPage:false});
  }
  await page.clock.setFixedTime(new Date('2026-11-19T13:40:00Z'));
  await page.evaluate(()=>{tab='dia';render();});
  await page.locator('#app .v810-day [data-v4phase="pos"]').click();
  await expect(page.locator('#app .v810-day')).toHaveAttribute('data-v810-phase','pos');
  await expect(page.locator('#app .v810-day .v810-status')).toContainText('manual');
  await page.locator('#app .v810-day [data-v4auto]').click();
  await expect(page.locator('#app .v810-day')).toHaveAttribute('data-v810-phase','pregao');
  await expect(page.locator('#app .v810-day [data-v4auto]')).toHaveClass(/on/);
  await page.evaluate(()=>{
    window.__v810qa={mutations:0,removed:0,cls:0};
    const target=document.querySelector('#app .v810-day');
    window.__v810mo=new MutationObserver(ms=>{__v810qa.mutations+=ms.length;
      for(const m of ms)for(const n of m.removedNodes)if(n.nodeType===1&&n.matches?.('[data-intel-etapa1]'))__v810qa.removed++;
    });
    __v810mo.observe(target,{subtree:true,childList:true});
    window.__v810po=typeof PerformanceObserver==='function' ? new PerformanceObserver(list=>{
      for(const e of list.getEntries())if(!e.hadRecentInput)__v810qa.cls+=e.value;
    }):null;
    try{__v810po?.observe({type:'layout-shift'});}catch{}
  });
  await page.waitForTimeout(6000);
  const audit=await page.evaluate(()=>{__v810mo.disconnect();__v810po?.disconnect();return __v810qa;});
  assert.equal(audit.removed,0,'Central não desmonta sozinha');
  assert.ok(audit.cls<0.1,'layout shift na observação: '+audit.cls);
  assert.deepEqual(errors,[],'Sem exceção JS: '+name);
  await page.close();
 }
}));
