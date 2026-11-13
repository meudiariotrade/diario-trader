const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('v552: com a ponte ao vivo, WINFUT/WDOFUT e ações da B3 vêm do Profit',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 await p.evaluate(async()=>{
  const agora=new Date().toISOString();
  SESS={uid:'u-teste',at:'x'};CQ.pfTs=0;
  rq=async()=>new Response(JSON.stringify([{ticker:'WINFUT',ult:'173565',var:'0.15',updated_at:agora},{ticker:'WDOFUT',ult:'5590',var:'-0.23',updated_at:agora},{ticker:'PETR4',ult:'44.95',var:'1.1',updated_at:agora},{ticker:'VELHO3',ult:'1',var:'0',updated_at:'2020-01-01T00:00:00Z'}]));
  await cqPonte();
  CQ.d.fut={em:agora,itens:[{s:'BMFBOVESPA:WIN1!',c:'WIN1!',n:'Mini Índice',px:170000,d1:0.3,dp:0},{s:'BMFBOVESPA:WDO1!',c:'WDO1!',n:'Mini Dólar',px:5500,d1:-0.3,dp:1}]};
  tab='mercado';MKT.tab='cq';CQ.aba='fut';render();
 });
 const pf=await p.evaluate(()=>({win:CQ.pf['@WIN']?.px,wdo:CQ.pf['@WDO']?.px,petr:CQ.pf.PETR4?.px,velho:!!CQ.pf.VELHO3}));
 assert.deepEqual(pf,{win:173565,wdo:5590,petr:44.95,velho:false});
 await expect(app.locator('#cotbox .cql')).toContainText('173.565');
 await expect(app.locator('#cotbox .cql')).toContainText('ao vivo');
 await expect(app.locator('#cotbox')).toContainText('Profit ao vivo');
 await expect(app.locator('#m550-destaque')).toHaveCount(0);
 assert.deepEqual(errors,[]);
}));
