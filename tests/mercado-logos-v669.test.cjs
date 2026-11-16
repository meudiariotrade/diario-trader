const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');

test('Mercado v669: mesma logo e dimensões durante ticks, render completo e fontes variadas (mobile/desktop)',{timeout:120000},async()=>withApp(async(browser,base)=>{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('https://**',route=>route.abort());
  await page.goto(base+'/?demo=1');
  await page.locator('#splash').waitFor({state:'hidden'});
  await page.evaluate(()=>{
   tab='mercado';MKT.tab='cq';CQ.aba='fut';CQ.vis='lista';CQ.search='WIN';
   CQ.d.fut={em:new Date().toISOString(),itens:[
     {c:'WIN',s:'BMFBOVESPA:WIN1!',n:'Mini índice',px:173570,d1:.15,dp:0},
     {c:'WDO',s:'BMFBOVESPA:WDO1!',n:'Mini dólar',px:5601,d1:-.04,dp:1}
   ]};
   CQ.ts.fut=Date.now();
   render();
  });
  const row=page.locator('#cotbox .cqr[data-market-symbol="BMFBOVESPA:WIN1!"]');
  await expect(row).toHaveCount(1);
  const logo=row.locator('.cqm-logo');
  await expect(logo).toHaveCount(1);
  const handle=await logo.elementHandle();
  const original=await logo.evaluate(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}));
  assert.ok(original.w>=29&&original.h>=29,'logo reservou tamanho estável');
  await page.evaluate(()=>{
    CQ.d.fut.itens[0].px=173630;
    CQ.d.fut.itens[0].d1=.29;
    cqMorph();
    cqPinta();
  });
  await expect(row.locator('.cqp')).toContainText('173.630');
  assert.equal(await handle.evaluate(el=>el===document.querySelector('#cotbox .cqr[data-market-symbol="BMFBOVESPA:WIN1!"] .cqm-logo')),true,'o elemento da imagem não foi recriado');
  const later=await logo.evaluate(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}));
  assert.deepEqual(later,original,'o ícone não mudou de tamanho');
  await page.close();
 }
}));
