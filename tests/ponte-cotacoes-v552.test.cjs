const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('v552: WINFUT/WDOFUT da ponte valem para WIN e WDO nas Cotações e no destaque',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 await p.evaluate(async()=>{
  const agora=new Date().toISOString();
  SESS={uid:'u-teste',at:'t'};CQ.pfTs=0;
  window.rq=async()=>new Response(JSON.stringify([{ticker:'WINFUT',ult:'173495',var:'0.11',updated_at:agora},{ticker:'WDOFUT',ult:'5598',var:'-0.09',updated_at:agora},{ticker:'PETR4',ult:'44.95',var:'-0.53',updated_at:agora}]));
  await cqPonte();
  CQ.d.fut={em:agora,itens:[{s:'BMFBOVESPA:WIN1!',c:'WIN',n:'Mini índice (WIN)',px:173770,d1:0.32,dp:0},{s:'BMFBOVESPA:WDO1!',c:'WDO',n:'Mini dólar (WDO)',px:5590,d1:-0.31,dp:1}]};
  tab='mercado';MKT.tab='cq';CQ.aba='fut';render();
 });
 assert.equal(await p.evaluate(()=>CQ.pf['@WIN']?.px),173495);
 assert.equal(await p.evaluate(()=>CQ.pf['@WDO']?.px),5598);
 await expect(app.locator('#cotbox .cql')).toContainText('173.495');
 await expect(app.locator('#cotbox .cql')).toContainText('ao vivo');
 await expect(app.locator('#cotbox .cql')).toContainText('Profit ao vivo');
 await expect(app.locator('#m550-destaque')).toHaveCount(0);
 assert.deepEqual(errors,[]);
}));
