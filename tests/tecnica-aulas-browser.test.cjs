const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const{expect}=require('playwright/test');const{withApp}=require('./helpers/app.cjs');
test('trilha técnica na aplicação real: navegação, mentor, gráfico, quiz e telas preservadas',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/avatar-mentor*.png',route=>route.fulfill({path:path.join(__dirname,'../public',new URL(route.request().url()).pathname.split('/').pop()),contentType:'image/png'}));
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{tab='estudos';ESV='aul';render()});
 await expect(page.locator('#tp-root')).toHaveCount(1);await expect(page.locator('.tp-head h2')).toHaveText('Análise Técnica na Prática');
 await page.locator('[data-tp-lesson="martelo"]').click();await expect(page.locator('.tp-mentor img')).toBeVisible();assert.ok(await page.locator('.tp-mentor img').evaluate(e=>e.complete&&e.naturalWidth>0));
 await page.locator('[data-tp-action="visual"]').click();await expect(page.locator('.tp-chart svg')).toBeVisible();
 for(const i of [1,2,3])await page.locator(`[data-tp-step="${i}"]`).click();
 await page.locator('[data-tp-question="0"][value="1"]').check();await page.locator('[data-tp-question="1"][value="0"]').check();await page.locator('[data-tp-question="2"][value="2"]').check();await expect(page.locator('.tp-result')).toContainText('Lição concluída');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.locator('#tp-root').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'sem overflow da trilha em '+width);const box=await page.locator('#tp-root').boundingBox();assert.ok(box.x+box.width<=width+1);}
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/tecnica-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:1000});await page.screenshot({path:'test-results/tecnica-mobile.png',fullPage:true});
 await page.evaluate(()=>{ESV='liv';render()});await expect(page.locator('#tp-root')).toHaveCount(0);
 await page.evaluate(()=>{ESV='aul';render()});await expect(page.locator('#tp-root')).toHaveCount(1);
 assert.deepEqual(errors,[]);
}));

test('MP4 chega ao fim sem reiniciar durante atualizações automáticas da tela',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:1000}});
 await page.addInitScript(()=>{window.testNativeFetch=window.fetch.bind(window)});
 await page.route('**/storage/v1/object/sign/**',route=>route.request().method()==='POST'?route.fulfill({json:{signedURL:'/object/sign/aulas-videos/test-video/tecnica-v1-martelo-16x9.mp4?token=test'}}):route.fulfill({path:path.join(__dirname,'../public/avatar-talking.mp4'),contentType:'video/mp4'}));
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{tab='estudos';ESV='aul';SESS={uid:'test-video',at:'test',exp:Date.now()+3600000};window.SUPA_URL=location.origin;window.SUPA_KEY='public';const demoFetch=window.fetch;window.fetch=(url,options)=>String(url).startsWith(location.origin+'/storage/v1/object/sign/')?window.testNativeFetch(url,options):demoFetch(url,options);render()});
 await page.locator('[data-tp-lesson="martelo"]').click();await page.locator('.tp-bridge > summary').click();await page.locator('[data-tp-film="16x9"]').click();
 await expect(page.locator('[data-tp-film-player]')).toHaveCount(1);
 await page.evaluate(async()=>{const v=window.testVideo=document.querySelector('[data-tp-film-player]');v.muted=true;await v.play();window.testRefresh=setInterval(()=>render(),1000)});
 await page.waitForFunction(()=>window.testVideo.ended,{timeout:20000});
 assert.equal(await page.evaluate(()=>{clearInterval(window.testRefresh);return document.querySelector('[data-tp-film-player]')===window.testVideo&&window.testVideo.currentTime>=window.testVideo.duration-.1}),true);
 await page.locator('[data-tp-action="close-film"]').click();await expect(page.locator('[data-tp-film-player]')).toHaveCount(0);
}));
