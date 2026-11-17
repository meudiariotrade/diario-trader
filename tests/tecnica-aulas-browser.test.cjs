const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
const ID='12345678-1234-4234-8234-123456789abc';
const row={id:ID,user_id:'test-video',roteiro:{tipo:'mentor-pdf-v1',mentor:{
 id:ID,title:'Circuitos na prática',summary:'Aula criada com o PDF selecionado.',
 stageNames:['Conceito','Exemplo','Erro comum','Revisão'],
 stages:['Texto sobre MM200 e contexto.','Aplicação do conceito.','Erro a evitar.','Revisão final.'],
 visuals:Array.from({length:4},(_,i)=>({title:'Etapa '+(i+1),items:['Conceito no material','Aplicação prática']})),
 roteiroVoz:{abertura:'Vamos entender o conceito.',etapas:Array(4).fill('A MM200 ajuda na leitura do contexto.')},
 questions:Array.from({length:3},()=>({q:'Qual conceito foi usado?',options:['A','B','C'],answer:0,why:'A primeira opção está no material.'}))
}}};
test('Estudos > Aulas possui apenas uma sub-aba montada por vez e Mentor inicia vazio',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:920}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{tab='estudos';ESV='aul';render();});
 await expect(page.locator('[data-tp-aula-sub="tradicionais"]')).toBeVisible();
 await expect(page.locator('#tp-root')).toHaveCount(0);
 await page.locator('[data-tp-aula-sub="mentor"]').click();
 await expect(page.locator('#tp-root')).toHaveCount(1);
 await expect(page.locator('.tp-empty')).toContainText('Nenhuma aula gerada');
 await expect(page.locator('[data-tp-lesson]')).toHaveCount(0);
 await expect(page.locator('.tp-voice-dict')).toHaveCount(1);
 await expect(page.locator('.tp-pdf')).toHaveCount(1);
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:920});
  assert.ok(await page.locator('#tp-root').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'sem overflow: '+width);
 }
 await page.locator('[data-tp-aula-sub="tradicionais"]').click();
 await expect(page.locator('#tp-root')).toHaveCount(0);
 await expect(page.locator('[data-tp-aula-sub="tradicionais"]')).toHaveAttribute('aria-selected','true');
 await page.evaluate(()=>{ESV='liv';render()});
 await expect(page.locator('.tp-aulas-nav')).toHaveCount(0);
 assert.deepEqual(errors,[]);
}));
test('Mentor gera aula de PDF e preserva dicionário e diagramas SVG',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:1000}});
 await page.addInitScript(()=>{window.testNativeFetch=window.fetch.bind(window)});
 let sent;
 await page.route('**/functions/v1/aulas',route=>{sent=route.request().postDataJSON();return route.fulfill({json:{aula:row,local:true}})});
 await page.route('**/rest/v1/aulas?**',route=>route.fulfill({json:[]}));
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{
  tab='estudos';ESV='aul';SESS={uid:'test-video',at:'test',exp:Date.now()+3600000};
  window.SUPA_URL=location.origin;window.SUPA_KEY='public';
  const demoFetch=window.fetch;
  window.fetch=(url,options)=>(String(url).startsWith(location.origin+'/functions/')||String(url).startsWith(location.origin+'/rest/'))?window.testNativeFetch(url,options):demoFetch(url,options);
  ntLib=async()=>({getDocument:()=>({promise:Promise.resolve({numPages:2,getPage:async()=>({getTextContent:async()=>({items:[{str:'Um circuito e sua leitura técnica. '.repeat(20)}]}),cleanup(){}}),destroy:async()=>{}}),destroy(){}})});
  render();
 });
 await page.locator('[data-tp-aula-sub="mentor"]').click();
 await page.evaluate(()=>{
  const root=document.querySelector('.tp-voice-dict');root.open=true;
  const input=root.querySelector('[data-tp-dictionary]');
  input.value='XYZ = xis especial';
  root.querySelector('[data-tp-dict="save"]').click();
 });
 assert.equal(await page.evaluate(()=>DiarioVoz.normalizarTextoParaVoz('XYZ')),'xis especial');
 await page.locator('.tp-pdf > summary').click();
 await page.locator('[data-tp-pdf-file]').setInputFiles({name:'apostila.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nfixture')});
 await page.locator('[data-tp-pdf-theme]').fill('Circuitos');
 await page.locator('[data-tp-pdf-last]').fill('2');
 await page.evaluate(()=>TecnicaPratica.view.refresh());
 await expect(page.locator('.tp-pdf')).toHaveAttribute('open','');
 await page.locator('[data-tp-pdf-form] button[type="submit"]').click();
 await expect(page.locator('[data-tp-pdf-status]')).toContainText('Aula salva',{timeout:15000});
 assert.equal(sent.paginas,'1–2');
 await page.locator('[data-tp-lesson]').click();
 await expect(page.locator('#tp-title')).toHaveText('Circuitos na prática');
 await page.locator('[data-tp-action="visual"]').click();
 await expect(page.locator('.tp-chart svg')).toBeVisible();
 await expect(page.locator('.tp-script')).toContainText('MM200');
}));
test('vídeo privado da ponte permanece associado à aula gerada, sem trocar de player',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:900}});
 await page.addInitScript(()=>{window.testNativeFetch=window.fetch.bind(window)});
 await page.route('**/storage/v1/object/sign/**',route=>route.request().method()==='POST'?route.fulfill({json:{signedURL:'/object/sign/aulas-videos/test-video/'+ID+'-16x9.mp4?token=test'}}):route.fulfill({path:path.join(__dirname,'../public/avatar-talking.mp4'),contentType:'video/mp4'}));
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(data=>{
  tab='estudos';ESV='aul';SESS={uid:'test-video',at:'test',exp:Date.now()+3600000};
  window.SUPA_URL=location.origin;window.SUPA_KEY='public';
  const demoFetch=window.fetch;
  window.fetch=(url,options)=>String(url).startsWith(location.origin+'/storage/v1/object/sign/')?window.testNativeFetch(url,options):demoFetch(url,options);
  render();
  document.querySelector('[data-tp-aula-sub="mentor"]').click();
  TecnicaPratica.pdf.insert(data);TecnicaPratica.view.refresh();
 },row);
 await page.locator('[data-tp-lesson]').click();
 await page.locator('.tp-bridge > summary').click();
 await page.locator('[data-tp-film-migrate]').click();
 await expect(page.locator('[data-tp-film-player]')).toHaveCount(1);
 await page.evaluate(()=>{window.v=document.querySelector('[data-tp-film-player]');window.v.currentTime=1;render();});
 assert.equal(await page.evaluate(()=>document.querySelector('[data-tp-film-player]')===window.v),true);
 await page.locator('[data-tp-action="close-film"]').click();
 await expect(page.locator('[data-tp-film-player]')).toHaveCount(0);
}));
