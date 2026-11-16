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

test('dicionário e aula do Mentor por PDF funcionam no fluxo de Aulas',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:1000}});
 await page.addInitScript(()=>{window.testNativeFetch=window.fetch.bind(window)});
 const id='12345678-1234-4234-8234-123456789abc';const row={id,user_id:'test-video',roteiro:{tipo:'mentor-pdf-v1',mentor:{id,title:'Circuitos na prática',summary:'Aula criada com o PDF selecionado.',stageNames:['Conceito','Exemplo','Erro comum','Revisão'],stages:['Leitura original do conceito.','Aplicação do conceito.','Erro a evitar.','Revisão final.'],visuals:Array.from({length:4},(_,i)=>({title:'Etapa '+(i+1),items:['Conceito no material','Aplicação prática']})),roteiroVoz:{abertura:'Vamos entender o conceito.',etapas:Array(4).fill('Olhe este exemplo e confira a aplicação prática.')},questions:Array.from({length:3},()=>({q:'Qual conceito foi usado?',options:['A','B','C'],answer:0,why:'A primeira opção está no material.'}))}}};
 let sent;
 await page.route('**/functions/v1/aulas',route=>{sent=route.request().postDataJSON();return route.fulfill({json:{aula:row}})});
 await page.route('**/rest/v1/aulas?**',route=>route.fulfill({json:[]}));
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{tab='estudos';ESV='aul';SESS={uid:'test-video',at:'test',exp:Date.now()+3600000};window.SUPA_URL=location.origin;window.SUPA_KEY='public';const demoFetch=window.fetch;window.fetch=(url,options)=>String(url).startsWith(location.origin+'/functions/')||String(url).startsWith(location.origin+'/rest/')?window.testNativeFetch(url,options):demoFetch(url,options);ntLib=async()=>({getDocument:()=>({promise:Promise.resolve({numPages:2,getPage:async()=>({getTextContent:async()=>({items:[{str:'Um circuito elétrico relaciona tensão corrente e resistência. '.repeat(20)}]}),cleanup(){}}),destroy:async()=>{}}),destroy(){}})});render()});
 await page.locator('.tp-voice-dict > summary').click();await page.locator('[data-tp-dictionary]').fill('MACD = mac dê\nXYZ = xis especial');await page.locator('[data-tp-dict="save"]').click();await expect(page.locator('[data-tp-dict-status]')).toContainText(/salvo/i);assert.equal(await page.evaluate(()=>DiarioVoz.normalizarTextoParaVoz('XYZ')),'xis especial');
 await page.locator('.tp-pdf > summary').click();await page.locator('[data-tp-pdf-file]').setInputFiles({name:'apostila.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nfixture')});await page.locator('[data-tp-pdf-theme]').fill('Circuitos');await page.locator('[data-tp-pdf-last]').fill('2');
 // Reproduz atualização da lista que antes desmontava/fechava o formulário.
 await page.evaluate(()=>TecnicaPratica.view.refresh());
 await expect(page.locator('.tp-pdf')).toHaveAttribute('open','');
 await expect(page.locator('[data-tp-pdf-theme]')).toHaveValue('Circuitos');
 await page.locator('[data-tp-pdf-form] button[type="submit"]').click();
 await expect(page.locator('[data-tp-pdf-status]')).toContainText('Aula salva',{timeout:15000});assert.equal(sent.acao,'mentor_pdf');assert.equal(sent.tema,'Circuitos');assert.equal(sent.paginas,'1–2');
 await page.locator(`[data-tp-lesson="${id}"]`).click();await expect(page.locator('#tp-title')).toHaveText('Circuitos na prática');await page.locator('[data-tp-action="visual"]').click();await expect(page.locator('.tp-chart svg')).toBeVisible();await expect(page.locator('.tp-script')).toContainText('Leitura original');
}));
